import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportData {
  report_id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  report_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_data }: { report_data: ReportData } = await req.json();

    if (!report_data) {
      return new Response(
        JSON.stringify({ error: "Missing report data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch reported user profile
    const { data: reportedProfile } = await supabase
      .from("profiles")
      .select("username, bio, age, created_at")
      .eq("user_id", report_data.reported_user_id)
      .single();

    // Fetch conversations from last 48 hours
    const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("id, content, message_type, created_at, recipient_id, is_private, chat_room_id")
      .eq("sender_id", report_data.reported_user_id)
      .gte("created_at", last48h)
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch ephemeral media from last 48h
    const messageIds = recentMessages?.map(m => m.id) || [];
    let ephemeralMedia: any[] = [];
    if (messageIds.length > 0) {
      const { data: media } = await supabase
        .from("ephemeral_media")
        .select("id, media_type, media_url, view_duration, created_at, message_id")
        .in("message_id", messageIds);
      ephemeralMedia = media || [];
    }

    // Find all users who communicated with the reported user
    const { data: conversations } = await supabase
      .from("private_conversations")
      .select("id, user1_id, user2_id, created_at")
      .or(`user1_id.eq.${report_data.reported_user_id},user2_id.eq.${report_data.reported_user_id}`);

    const contactIds = new Set<string>();
    conversations?.forEach(conv => {
      if (conv.user1_id !== report_data.reported_user_id) contactIds.add(conv.user1_id);
      if (conv.user2_id !== report_data.reported_user_id) contactIds.add(conv.user2_id);
    });

    // Build investigation data
    const investigationData = {
      reported_user: reportedProfile,
      recent_messages_count: recentMessages?.length || 0,
      ephemeral_media_count: ephemeralMedia.length,
      contacts_count: contactIds.size,
      contact_user_ids: Array.from(contactIds),
      messages_sample: recentMessages?.slice(0, 20).map(m => ({
        id: m.id,
        content: m.content?.substring(0, 200),
        type: m.message_type,
        is_private: m.is_private,
        created_at: m.created_at,
      })),
      ephemeral_media: ephemeralMedia.map(m => ({
        id: m.id,
        type: m.media_type,
        url: m.media_url,
        message_id: m.message_id,
      })),
    };

    // Prepare AI analysis
    let aiAnalysis = "Analyse automatique: signalement reçu, compte temporairement suspendu pour investigation.";
    let aiRecommendation = "Suspension préventive en attente de revue humaine.";
    let severityScore = 50;

    // Call Lovable AI for analysis if available
    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Tu es un assistant de modération pour une application de rencontres. Analyse les signalements et détermine la gravité.
                
Réponds UNIQUEMENT en JSON avec cette structure:
{
  "analysis": "Résumé de l'analyse du signalement",
  "recommendation": "Action recommandée",
  "severity_score": 50,
  "should_suspend": true,
  "reason_code": "harassment|inappropriate_content|spam|fake_profile|underage|other"
}

Le severity_score va de 0 (anodin) à 100 (très grave).
should_suspend = true si le compte doit être suspendu immédiatement.`
              },
              {
                role: "user",
                content: `Signalement reçu:
- Type: ${report_data.report_type}
- Raison: ${report_data.reason}
- Description: ${report_data.description || "Aucune description"}
- Nombre de messages récents (48h): ${recentMessages?.length || 0}
- Nombre de médias éphémères: ${ephemeralMedia.length}
- Contacts récents: ${contactIds.size}
- Profil signalé: ${reportedProfile?.username || "Inconnu"}, ${reportedProfile?.age || "?"} ans, inscrit le ${reportedProfile?.created_at || "?"}
- Bio: ${reportedProfile?.bio?.substring(0, 200) || "Aucune"}

Échantillon de messages récents:
${recentMessages?.slice(0, 5).map(m => `- "${m.content?.substring(0, 100) || "[média]"}"`).join("\n") || "Aucun message"}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          try {
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              aiAnalysis = parsed.analysis || aiAnalysis;
              aiRecommendation = parsed.recommendation || aiRecommendation;
              severityScore = parsed.severity_score || severityScore;
            }
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            aiAnalysis = content || aiAnalysis;
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    // Create AI moderation report
    const { data: aiReport, error: reportError } = await supabase
      .from("ai_moderation_reports")
      .insert({
        report_id: report_data.report_id,
        reported_user_id: report_data.reported_user_id,
        ai_analysis: aiAnalysis,
        ai_recommendation: aiRecommendation,
        severity_score: severityScore,
        auto_suspended: true,
        investigation_data: investigationData,
        status: "investigating",
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Failed to create AI report: ${reportError.message}`);
    }

    // Auto-suspend the reported user (24h initial suspension)
    const suspensionEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Check if already suspended
    const { data: existingBlock } = await supabase
      .from("user_blocks")
      .select("id")
      .eq("user_id", report_data.reported_user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!existingBlock) {
      await supabase
        .from("user_blocks")
        .insert({
          user_id: report_data.reported_user_id,
          blocked_by: report_data.reporter_id,
          reason: `Signalement automatique: ${report_data.reason}`,
          is_active: true,
          suspension_type: "temporary",
          suspension_duration: "24 hours",
          suspension_ends_at: suspensionEndsAt,
        });
    }

    // Notify all contacts about the investigation
    const contactsArray = Array.from(contactIds);
    const notificationExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72h access

    for (const contactId of contactsArray) {
      // Create investigation notification
      await supabase
        .from("investigation_notifications")
        .insert({
          ai_report_id: aiReport.id,
          notified_user_id: contactId,
          reported_user_id: report_data.reported_user_id,
          data_access_expires_at: notificationExpiry,
        });

      // Send notification to user
      await supabase
        .from("notifications")
        .insert({
          user_id: contactId,
          type: "investigation_notice",
          title: "⚠️ Information importante",
          message: "Suite à un signalement, certaines de vos conversations peuvent être temporairement consultées par notre équipe de modération. Vos données seront traitées avec respect et supprimées après analyse.",
          is_read: false,
        });
    }

    // Update AI report to mark contacts as notified
    await supabase
      .from("ai_moderation_reports")
      .update({ contacts_notified: true })
      .eq("id", aiReport.id);

    // Log moderation action
    await supabase
      .from("moderation_actions")
      .insert({
        action_type: "user_suspended",
        target_user_id: report_data.reported_user_id,
        performed_by: report_data.reporter_id,
        details: `Suspension automatique IA suite à signalement: ${report_data.reason}`,
        metadata: {
          ai_report_id: aiReport.id,
          severity_score: severityScore,
          auto_suspended: true,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        ai_report_id: aiReport.id,
        severity_score: severityScore,
        contacts_notified: contactsArray.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Moderation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
