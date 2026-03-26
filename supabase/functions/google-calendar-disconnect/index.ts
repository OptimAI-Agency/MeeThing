import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/crypto.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

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

    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("id, refresh_token_encrypted")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    if (connError || !connection) throw new Error("No active Google Calendar connection found");

    // 1. Revoke token with Google (best-effort -- proceed even if this fails)
    if (connection.refresh_token_encrypted) {
      try {
        const refreshToken = await decrypt(connection.refresh_token_encrypted);
        const revokeRes = await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: refreshToken }),
        });
        if (!revokeRes.ok) {
          console.warn("Token revocation failed (proceeding with cleanup):", await revokeRes.text());
        }
      } catch (revokeErr) {
        console.warn("Token revocation error (proceeding with cleanup):", revokeErr);
      }
    }

    // 2. Delete all meetings for this connection (hard-delete per D-05)
    const { error: meetingsDeleteError } = await supabase
      .from("meetings")
      .delete()
      .eq("calendar_connection_id", connection.id);

    if (meetingsDeleteError) {
      console.error("Failed to delete meetings:", meetingsDeleteError);
      throw new Error("Failed to clean up synced meetings");
    }

    // 3. Delete the calendar connection row
    const { error: connDeleteError } = await supabase
      .from("calendar_connections")
      .delete()
      .eq("id", connection.id);

    if (connDeleteError) {
      console.error("Failed to delete connection:", connDeleteError);
      throw new Error("Failed to remove calendar connection");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-disconnect error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});
