import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit config per endpoint
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  default: { maxRequests: 60, windowMs: 60000 }, // 60 req/min
  auth: { maxRequests: 10, windowMs: 300000 }, // 10 req/5min
  api: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { identifier, endpoint = "default" } = await req.json();
    
    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Identifier required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Check existing rate limit record
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .single();

    if (existing) {
      // Check if blocked
      if (existing.is_blocked && existing.blocked_until && new Date(existing.blocked_until) > now) {
        // Log the blocked attempt
        await supabase.from("security_events").insert({
          event_type: "rate_limit_exceeded",
          severity: "high",
          description: `Requête bloquée par rate limiter: ${identifier} sur ${endpoint}`,
          metadata: { identifier, endpoint, blocked_until: existing.blocked_until },
        });

        return new Response(
          JSON.stringify({ allowed: false, blocked: true, retry_after: existing.blocked_until }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if within window
      if (new Date(existing.window_start) > windowStart) {
        const newCount = existing.request_count + 1;

        if (newCount > config.maxRequests) {
          // Block for 5 minutes
          const blockedUntil = new Date(now.getTime() + 300000).toISOString();

          await supabase
            .from("rate_limits")
            .update({
              request_count: newCount,
              is_blocked: true,
              blocked_until: blockedUntil,
              updated_at: now.toISOString(),
            })
            .eq("id", existing.id);

          // Log security event
          await supabase.from("security_events").insert({
            event_type: "ddos",
            severity: "critical",
            description: `Rate limit dépassé: ${newCount} requêtes sur ${endpoint}. Bloqué pour 5 min.`,
            metadata: { identifier, endpoint, request_count: newCount, blocked_until: blockedUntil },
          });

          return new Response(
            JSON.stringify({ allowed: false, blocked: true, retry_after: blockedUntil }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Increment counter
        await supabase
          .from("rate_limits")
          .update({ request_count: newCount, updated_at: now.toISOString() })
          .eq("id", existing.id);

        return new Response(
          JSON.stringify({ allowed: true, remaining: config.maxRequests - newCount }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Window expired, reset
      await supabase
        .from("rate_limits")
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          is_blocked: false,
          blocked_until: null,
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new record
      await supabase.from("rate_limits").insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: now.toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ allowed: true, remaining: config.maxRequests - 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal error", allowed: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
