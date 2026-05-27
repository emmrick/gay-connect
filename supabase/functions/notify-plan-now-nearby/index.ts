/**
 * notify-plan-now-nearby
 * Notifie les profils dans un rayon de 10 km qu'un utilisateur vient d'activer Plan Now.
 * Appelée depuis le front juste après l'insertion de la session.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEARBY_RADIUS_KM = 10;
const MAX_RECIPIENTS = 50;

interface Payload {
  lat: number;
  lon: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify JWT to get user_id
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { lat, lon } = (await req.json()) as Payload;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(JSON.stringify({ error: 'lat/lon required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get sender username
    const { data: senderProfile } = await admin
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();
    const senderName = senderProfile?.username ?? 'Quelqu\'un';

    // Find nearby profiles (10 km)
    const { data: nearby, error: rpcErr } = await admin.rpc('get_nearby_profiles', {
      user_lat: lat,
      user_lon: lon,
      max_distance_km: NEARBY_RADIUS_KM,
      limit_count: MAX_RECIPIENTS,
    });
    if (rpcErr) throw rpcErr;

    const recipients = (nearby ?? [])
      .map((p: any) => p.user_id)
      .filter((id: string) => id && id !== userId)
      .slice(0, MAX_RECIPIENTS);

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk insert in-app notifications
    const title = `⚡ ${senderName} est en Plan Now`;
    const message = `${senderName} cherche une rencontre immédiate près de toi.`;
    const rows = recipients.map((rid: string) => ({
      user_id: rid,
      type: 'plan_now_nearby',
      title,
      message,
      action_url: `/member/${userId}`,
    }));
    await admin.from('notifications').insert(rows);

    // Fire-and-forget push for each (limited)
    Promise.all(
      recipients.slice(0, 20).map((rid: string) =>
        admin.functions.invoke('send-push-notification', {
          body: { userId: rid, title, body: message, url: `/member/${userId}` },
        }).catch(() => {}),
      ),
    );

    return new Response(JSON.stringify({ sent: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-plan-now-nearby error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
