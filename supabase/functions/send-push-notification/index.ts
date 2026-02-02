import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error("VAPID keys not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { userId, title, body, url, tag } = await req.json();

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: "userId and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError) {
      throw new Error(`Error fetching subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No push subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
      tag: tag || Date.now().toString(),
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    });

    const results: Array<{ endpoint: string; success: boolean; reason?: string }> = [];

    // Create JWT for VAPID authentication
    const createVapidJwt = async (audience: string): Promise<string> => {
      const header = { typ: "JWT", alg: "ES256" };
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        aud: audience,
        exp: now + 12 * 60 * 60,
        sub: "mailto:support@gayconnect.app",
      };

      const encoder = new TextEncoder();
      const headerB64 = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      const claimsB64 = btoa(JSON.stringify(claims))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      return `${headerB64}.${claimsB64}`;
    };

    for (const subscription of subscriptions) {
      try {
        const audience = new URL(subscription.endpoint).origin;
        const jwtPayload = await createVapidJwt(audience);

        // Send push notification with minimal headers
        // Note: For production, you'd need proper VAPID signing
        const response = await fetch(subscription.endpoint, {
          method: "POST",
          headers: {
            "TTL": "86400",
            "Content-Type": "application/octet-stream",
            "Content-Length": "0",
            "Urgency": "normal",
          },
        });

        if (response.status === 201 || response.status === 200) {
          results.push({ endpoint: subscription.endpoint, success: true });
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid, remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          results.push({ endpoint: subscription.endpoint, success: false, reason: "expired" });
        } else {
          const errorText = await response.text();
          console.log(`Push failed for ${subscription.endpoint}: ${response.status} - ${errorText}`);
          results.push({ endpoint: subscription.endpoint, success: false, reason: `${response.status}: ${errorText}` });
        }
      } catch (pushError: unknown) {
        const errorMessage = pushError instanceof Error ? pushError.message : String(pushError);
        console.error("Push error:", errorMessage);
        results.push({ endpoint: subscription.endpoint, success: false, reason: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
