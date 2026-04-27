import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email, returnUrl } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Generate magic link token via RPC (handles rate-limit + validation)
    const { data: token, error: rpcError } = await supabase.rpc('request_advertiser_magic_link', {
      _email: email.trim().toLowerCase(),
    });

    if (rpcError) {
      const msg = rpcError.message || '';
      if (msg.includes('rate_limited')) {
        return new Response(JSON.stringify({ error: 'rate_limited', message: 'Trop de demandes, réessayez dans 1h.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg.includes('invalid_email')) {
        return new Response(JSON.stringify({ error: 'invalid_email' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw rpcError;
    }

    const baseUrl = (returnUrl || 'https://gaysocial.fr/advertise').replace(/\?.*$/, '');
    const loginUrl = `${baseUrl}?magic=${token}`;

    // Send email via transactional template (idempotency on token ensures one email per token)
    const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'advertiser-magic-link',
        recipientEmail: email.trim().toLowerCase(),
        idempotencyKey: `adv-magic-${token.slice(0, 16)}`,
        templateData: { loginUrl },
      },
    });

    if (emailError) {
      console.error('email send error', emailError);
      // Don't expose to client; token is created so user can retry
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('advertiser-magic-link-send error', e);
    return new Response(JSON.stringify({ error: 'internal', message: e?.message || 'Erreur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
