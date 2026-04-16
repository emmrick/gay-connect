// Backfill function: sends welcome emails to users who signed up recently
// but never received one (because the email system was broken).
// Admin-only. Idempotent: skips users already in email_send_log as 'sent' for 'welcome'.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Verify caller is admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller } } = await anonClient.auth.getUser(token)
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!role) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse options
  let daysBack = 60
  let dryRun = false
  let templateName = 'welcome'
  try {
    const body = await req.json()
    if (typeof body.daysBack === 'number') daysBack = body.daysBack
    if (typeof body.dryRun === 'boolean') dryRun = body.dryRun
    if (typeof body.templateName === 'string') templateName = body.templateName
  } catch {
    // optional body
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all profiles created since `since`
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (profilesError) {
    console.error('Failed to fetch profiles', profilesError)
    return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch all auth users (paginated)
  const usersByEmail = new Map<string, { id: string; email: string }>()
  const usersById = new Map<string, { id: string; email: string }>()
  let page = 1
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users?.length) break
    for (const u of users) {
      if (u.email) {
        usersByEmail.set(u.email.toLowerCase(), { id: u.id, email: u.email })
        usersById.set(u.id, { id: u.id, email: u.email })
      }
    }
    if (users.length < 1000) break
    page++
  }

  // Fetch already-sent welcome emails to skip
  const { data: alreadySent } = await supabase
    .from('email_send_log')
    .select('recipient_email')
    .eq('template_name', templateName)
    .eq('status', 'sent')

  const alreadySentSet = new Set((alreadySent ?? []).map((r: any) => r.recipient_email.toLowerCase()))

  // Fetch suppressed emails
  const { data: suppressedRows } = await supabase
    .from('suppressed_emails')
    .select('email')
  const suppressedSet = new Set((suppressedRows ?? []).map((r: any) => r.email.toLowerCase()))

  const results = {
    candidates: 0,
    skipped_already_sent: 0,
    skipped_suppressed: 0,
    skipped_no_email: 0,
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  }

  for (const profile of profiles ?? []) {
    const authUser = usersById.get(profile.user_id)
    if (!authUser?.email) {
      results.skipped_no_email++
      continue
    }
    const emailLower = authUser.email.toLowerCase()
    results.candidates++

    if (alreadySentSet.has(emailLower)) {
      results.skipped_already_sent++
      continue
    }
    if (suppressedSet.has(emailLower)) {
      results.skipped_suppressed++
      continue
    }

    if (dryRun) continue

    try {
      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName,
          recipientEmail: authUser.email,
          templateData: { pseudo: profile.username },
        },
      })
      if (error || (data as any)?.error) {
        results.failed++
        results.errors.push({ email: authUser.email, error: error?.message || JSON.stringify(data) })
      } else {
        results.sent++
        // Throttle: Resend free tier = 2/sec, paid = 10/sec. Be safe at 4/sec.
        await new Promise((r) => setTimeout(r, 250))
      }
    } catch (err) {
      results.failed++
      results.errors.push({ email: authUser.email, error: err instanceof Error ? err.message : String(err) })
    }
  }

  console.log('Backfill complete', results)
  return new Response(JSON.stringify({ success: true, dryRun, daysBack, ...results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
