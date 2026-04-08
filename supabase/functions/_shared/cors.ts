// supabase/functions/_shared/cors.ts

function resolveAllowedOrigin(requestOrigin: string | null): string {
  const raw = Deno.env.get("ALLOWED_ORIGIN");
  if (!raw) {
    throw new Error("ALLOWED_ORIGIN environment variable is not set — refusing to serve with wildcard CORS");
  }
  const allowed = raw.split(",").map((o) => o.trim()).filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Fall back to the first configured origin (preflight will fail for unlisted origins — correct behaviour)
  return allowed[0];
}

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(requestOrigin),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req.headers.get("origin")) });
  }
  return null;
}
