// supabase/functions/delete-account/index.ts
// Apple Guideline 5.1.1(v) — kullanıcının uygulama içinden hesabını silmesi için endpoint.
// Akış: Bearer token doğrula → service-role ile auth.users'tan sil → cascade contacts+reminders.
//
// Deploy: supabase functions deploy delete-account --no-verify-jwt --project-ref dtepkruumsxlflyzfeut

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Yetkilendirme gerekli' }, 401)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Token sahibini doğrula — kendi hesabını silen kişi olduğundan emin ol.
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Geçersiz oturum' }, 401)
    }

    // auth.users DELETE → contacts.user_id ve reminders.user_id ON DELETE CASCADE
    // ile otomatik silinir (migration 001).
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (err) {
    return jsonResponse({ error: (err as Error).message ?? 'Bilinmeyen hata' }, 500)
  }
})

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
