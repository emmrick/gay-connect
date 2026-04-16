import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { sendViaResend } from '../_shared/resend-sender.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

const SITE_NAME = 'Gay Social'
const ROOT_DOMAIN = 'gaysocial.fr'
const FROM_EMAIL = `${SITE_NAME} <noreply@${ROOT_DOMAIN}>`
const REPLY_TO = 'support@gaysocial.fr'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirmez votre inscription',
  invite: 'Vous avez été invité',
  magiclink: 'Votre lien de connexion',
  recovery: 'Réinitialisation de votre mot de passe',
  email_change: 'Confirmez votre nouvelle adresse email',
  reauthentication: 'Votre code de vérification',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')

  const rawBody = await req.text()
  let payload: any

  // Verify Supabase webhook signature (standardwebhooks) when secret is configured
  if (hookSecret) {
    try {
      const headers = Object.fromEntries(req.headers)
      const wh = new Webhook(hookSecret.replace('v1,whsec_', ''))
      payload = wh.verify(rawBody, headers)
    } catch (err) {
      console.error('Webhook signature verification failed', err)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } else {
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Supabase Auth Hook payload structure
  const userEmail = payload?.user?.email
  const emailData = payload?.email_data ?? {}
  const emailType: string = emailData.email_action_type ?? 'signup'

  if (!userEmail) {
    console.error('Missing user email in payload')
    return new Response(JSON.stringify({ error: 'Missing user email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[emailType] ?? SignupEmail

  // Construct confirmation URL
  const confirmationUrl =
    emailData.redirect_to && emailData.token_hash
      ? `${supabaseUrl}/auth/v1/verify?token=${emailData.token_hash}&type=${emailType}&redirect_to=${emailData.redirect_to}`
      : emailData.confirmation_url || `https://${ROOT_DOMAIN}`

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: userEmail,
    confirmationUrl,
    token: emailData.token,
    email: userEmail,
    newEmail: payload?.user?.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const messageId = crypto.randomUUID()

  try {
    const result = await sendViaResend({
      to: userEmail,
      from: FROM_EMAIL,
      subject: EMAIL_SUBJECTS[emailType] ?? 'Notification',
      html,
      text,
      replyTo: REPLY_TO,
    })

    if (!result.ok) {
      console.error('Resend auth email failed', { status: result.status, body: result.body, emailType, userEmail })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: `auth_${emailType}`,
        recipient_email: userEmail,
        status: 'failed',
        error_message: `Resend [${result.status}]: ${result.body.slice(0, 500)}`,
      })
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: `auth_${emailType}`,
      recipient_email: userEmail,
      status: 'sent',
      metadata: { resend_id: result.resendId, provider: 'resend' },
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Auth email send exception', { error: errorMsg, emailType, userEmail })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: `auth_${emailType}`,
      recipient_email: userEmail,
      status: 'failed',
      error_message: errorMsg.slice(0, 1000),
    })
    return new Response(JSON.stringify({ error: 'Email send failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
