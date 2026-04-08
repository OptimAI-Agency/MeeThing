import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt, decrypt } from "../_shared/crypto.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw { message: `Token refresh failed: ${err}`, isAuthError: true };
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get("origin");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Load the Google calendar connection
    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    if (connError || !connection) throw new Error("No active Google Calendar connection found");

    let accessToken = await decrypt(connection.access_token_encrypted);

    // Refresh the access token if it has expired or is about to expire (within 5 minutes)
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

    if (needsRefresh) {
      if (!connection.refresh_token_encrypted) {
        throw { message: "Access token expired and no refresh token available. Please reconnect.", isAuthError: true };
      }
      const refreshToken = await decrypt(connection.refresh_token_encrypted);
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;

      const encryptedNewAccess = await encrypt(refreshed.accessToken);
      await supabase
        .from("calendar_connections")
        .update({
          access_token_encrypted: encryptedNewAccess,
          token_expires_at: refreshed.expiresAt,
        })
        .eq("id", connection.id);
    }

    // Fetch events from Google Calendar for the next 7 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Paginate through ALL events using nextPageToken loop
    let allEvents: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let pageToken: string | undefined;

    do {
      const params: Record<string, string> = {
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
      };
      if (pageToken) params.pageToken = pageToken;

      const calRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
          new URLSearchParams(params),
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!calRes.ok) {
        const errText = await calRes.text();
        const status = calRes.status;
        if (status === 401 || status === 403) {
          throw { message: "Token rejected by Google — please reconnect", isAuthError: true };
        }
        throw { message: `Google Calendar API error: ${errText}`, isAuthError: false };
      }

      const calData = await calRes.json();
      allEvents = allEvents.concat(calData.items ?? []);
      pageToken = calData.nextPageToken;
    } while (pageToken);

    const events = allEvents;

    // Map to our meetings schema, skipping all-day events (no dateTime)
    const meetings = events
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        user_id: user.id,
        calendar_connection_id: connection.id,
        external_id: e.id,
        title: e.summary ?? "Untitled",
        description: e.description ?? null,
        start_time: e.start.dateTime,
        end_time: e.end.dateTime,
        location: e.location ?? null,
        attendees: (e.attendees ?? []).map((a: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          email: a.email,
          name: a.displayName ?? null,
          self: a.self ?? false,
        })),
        metadata: {
          htmlLink: e.htmlLink ?? null,
          status: e.status ?? null,
          recurringEventId: e.recurringEventId ?? null,
        },
      }));

    if (meetings.length > 0) {
      const { error: upsertError } = await supabase
        .from("meetings")
        .upsert(meetings, { onConflict: "user_id,external_id" });

      if (upsertError) throw upsertError;
    }

    // Remove meetings from this connection that are no longer in the upcoming window
    // (events that were deleted or moved out of range)
    const externalIds = meetings.map((m) => m.external_id);
    if (externalIds.length > 0) {
      await supabase
        .from("meetings")
        .delete()
        .eq("calendar_connection_id", connection.id)
        .gte("start_time", timeMin)
        .lte("start_time", timeMax)
        .not("external_id", "in", `(${externalIds.map((id) => `"${id}"`).join(",")})`);
    }

    // Update last_synced_at
    await supabase
      .from("calendar_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connection.id);

    return new Response(JSON.stringify({ success: true, synced: meetings.length }), {
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("google-calendar-sync error:", err);

    const isAuthError = err.isAuthError === true ||
      (typeof err.message === "string" && (
        err.message.includes("Token refresh failed") ||
        err.message.includes("no refresh token") ||
        err.message.includes("reconnect")
      ));

    return new Response(
      JSON.stringify({
        error: typeof err.message === "string" ? err.message : String(err),
        error_type: isAuthError ? "auth_expired" : "sync_failed",
      }),
      {
        status: isAuthError ? 401 : 400,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
      },
    );
  }
});
