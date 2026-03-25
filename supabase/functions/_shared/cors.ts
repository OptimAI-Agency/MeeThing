// supabase/functions/_shared/cors.ts

function getAllowedOrigin(): string {
  const origin = Deno.env.get("ALLOWED_ORIGIN");
  if (!origin) {
    throw new Error("ALLOWED_ORIGIN environment variable is not set — refusing to serve with wildcard CORS");
  }
  return origin;
}

export function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }
  return null;
}
