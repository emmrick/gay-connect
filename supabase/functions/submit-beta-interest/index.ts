import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  email?: string;
  donation_amount?: number;
  user_id?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const body = (await req.json()) as Payload;
    const email = (body.email ?? "").trim().toLowerCase();
    const amount = Number(body.donation_amount);
    const submitterId = body.user_id ?? null;

    if (!email || !EMAIL_RE.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Adresse e-mail invalide." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!Number.isFinite(amount) || amount < 15 || amount > 30) {
      return new Response(
        JSON.stringify({ error: "Le montant du don doit être compris entre 15 € et 30 €." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Save the submission
    const { data: submission, error: insertError } = await supabase
      .from("beta_interest_submissions")
      .insert({ email, donation_amount: amount, user_id: submitterId })
      .select()
      .single();
    if (insertError) throw insertError;

    // 2. Resolve staff recipients (admins + moderators)
    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "moderator"]);

    const staffIds = Array.from(
      new Set((staffRoles ?? []).map((r: { user_id: string }) => r.user_id)),
    );

    const messageContent = JSON.stringify({
      type: "beta_interest",
      email,
      amount,
      submissionId: submission.id,
      createdAt: submission.created_at,
    });

    const ensureConversation = async (a: string, b: string): Promise<string> => {
      const { data: existing } = await supabase
        .from("private_conversations")
        .select("id")
        .or(
          `and(user1_id.eq.${a},user2_id.eq.${b}),and(user1_id.eq.${b},user2_id.eq.${a})`,
        )
        .maybeSingle();
      if (existing) return existing.id;
      const { data: created, error } = await supabase
        .from("private_conversations")
        .insert({ user1_id: a, user2_id: b })
        .select("id")
        .single();
      if (error) throw error;
      return created.id;
    };

    let delivered = 0;
    for (const recipientId of staffIds) {
      // Pick a sender that is a different staff member so the message
      // appears as an incoming private message for the recipient.
      const senderId = staffIds.find((id) => id !== recipientId);

      // In-app notification for everyone (covers single-staff case too)
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "system",
        title: "🧪 Nouvelle inscription bêta",
        message: `${email} souhaite participer (don de ${amount} €).`,
        is_read: false,
      });

      if (!senderId) continue;

      try {
        await ensureConversation(senderId, recipientId);
        await supabase.from("messages").insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content: messageContent,
          message_type: "beta_interest",
          is_private: true,
        });
        delivered++;
      } catch (e) {
        console.error("Failed to deliver beta message to", recipientId, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, delivered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("submit-beta-interest error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
