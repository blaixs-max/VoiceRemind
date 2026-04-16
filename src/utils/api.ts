// src/utils/api.ts
// Edge Function client — auth token ile korumalı

import { SUPABASE_URL, SUPABASE_ANON_KEY, API_TIMEOUT_MS } from './config'
import { supabase } from './supabase'
import type { ContactSummary, EdgeFunctionResponse } from '../models/types'

/**
 * Ses dosyasını Edge Function'a gönderir, parse edilmiş reminder'ları döner.
 * Auth token otomatik olarak mevcut oturumdan alınır.
 */
export async function sendAudioForParsing(
  audioUri: string,
  contacts: ContactSummary[],
  timezone: string
): Promise<EdgeFunctionResponse> {
  // Mevcut oturumdan JWT al
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Oturum bulunamadı. Lütfen giriş yapın.')
  }

  const formData = new FormData()

  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any)

  formData.append('contacts', JSON.stringify(contacts))
  formData.append('timezone', timezone)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/parse-reminder`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: controller.signal,
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown error')
      throw new Error(`Edge function error (${res.status}): ${text}`)
    }

    return await res.json() as EdgeFunctionResponse
  } finally {
    clearTimeout(timeout)
  }
}
