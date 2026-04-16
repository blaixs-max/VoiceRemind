// supabase/functions/parse-reminder/index.ts
// Tek endpoint: POST /functions/v1/parse-reminder
// Akış: multipart audio → Whisper STT → contact pre-filter → GPT function calling → date parse → response

import { parseTurkishDate } from './turkishDateParser.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// CORS headers — Expo client'tan erişim için
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- 0. Auth kontrolü ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Yetkilendirme gerekli' }, 401)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return jsonResponse({ error: 'Geçersiz oturum' }, 401)
    }

    // --- 1. Multipart parse ---
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const contactsRaw = formData.get('contacts') as string | null
    const timezone = (formData.get('timezone') as string) || 'Europe/Istanbul'

    if (!audioFile) {
      return jsonResponse({ error: 'audio field is required' }, 400)
    }

    let contacts: ContactSummary[] = []
    if (contactsRaw) {
      try {
        contacts = JSON.parse(contactsRaw)
        if (!Array.isArray(contacts)) contacts = []
      } catch {
        return jsonResponse({ error: 'Geçersiz cari listesi formatı' }, 400)
      }
    }

    // --- 2. Whisper API — ses → transkript ---
    const transcript = await transcribeAudio(audioFile)
    if (!transcript || transcript.trim().length === 0) {
      return jsonResponse({ error: 'Ses anlaşılamadı, tekrar deneyin.' }, 422)
    }

    // --- 3. Contact pre-filter — token tasarrufu ---
    const relevantContacts = filterContacts(contacts, transcript)

    // --- 4. GPT function calling — intent parse ---
    const today = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    })

    const gptResult = await callGPT(transcript, relevantContacts, today, timezone)

    // --- 5. Date parser — her reminder için date_text → ISO ---
    // Edge Function UTC'de çalışır — now'ı kullanıcı timezone'una çevir
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    const reminders = gptResult.map((r: any) => {
      const parsed = parseTurkishDate(r.date_text || '', now, timezone)
      return {
        title: r.title,
        dateText: r.date_text,
        datetime: parsed.datetime,
        contactId: r.contact_id || null,
        newContactSuggestion: r.new_contact_suggestion
          ? {
              company: r.new_contact_suggestion.company || '',
              contactName: r.new_contact_suggestion.contact_name || '',
            }
          : null,
        confidence: parsed.confident ? (r.confidence ?? 0.8) : Math.min(r.confidence ?? 0.5, 0.5),
      }
    })

    // --- 6. Response ---
    return jsonResponse({ reminders, transcript })

  } catch (err) {
    // Hata detayını SADECE server log'una yaz — client'a sanitize edilmiş mesaj dön
    // (OpenAI org id, stack trace, DB hata detayı sızdırmayı engeller).
    console.error('parse-reminder error:', err)
    return jsonResponse({
      error: 'Ses işlenirken bir hata oluştu. Lütfen tekrar deneyin.',
      code: 'parse_failed',
    }, 500)
  }
})

// --- Whisper API ---

async function transcribeAudio(audioFile: File): Promise<string> {
  const whisperForm = new FormData()
  whisperForm.append('file', audioFile, 'recording.m4a')
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', 'tr')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: whisperForm,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Whisper API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.text ?? ''
}

// --- Contact pre-filter ---

type ContactSummary = {
  id: string
  company: string
  contactName: string
}

function filterContacts(contacts: ContactSummary[], transcript: string): ContactSummary[] {
  if (contacts.length === 0) return []

  const t = transcript.toLowerCase()
  const matched = contacts.filter((c) => {
    const firstName = c.contactName.toLowerCase().split(' ')[0]
    const companyFirst = c.company.toLowerCase().split(' ')[0]
    return t.includes(firstName) || t.includes(companyFirst)
  })

  return matched.length > 0 ? matched : contacts.slice(0, 20)
}

// --- GPT Function Calling ---

async function callGPT(
  transcript: string,
  contacts: ContactSummary[],
  today: string,
  timezone: string
): Promise<any[]> {
  const systemPrompt = `Sen bir Türkçe sesli asistan için intent parser'sın. Kullanıcının konuşma transkriptini alıyorsun ve hatırlatıcılar çıkarıyorsun.

Kurallar:
- title: yapılacak işin kısa özeti
- date_text: tarihi OLDUĞU GİBİ yaz, dönüştürme. "yarın akşam 8" → "yarın akşam 8"
- Birden fazla hatırlatıcı varsa hepsini çıkar
- Konuşmada kişi/firma adı geçiyorsa mevcut cari listesiyle eşleştir
- Eşleşme yoksa new_contact_suggestion olarak öner
- Kişi/firma geçmiyorsa contact_id null bırak
- confidence: tarih ve içerik ne kadar net anlaşılıyorsa o kadar yüksek

Mevcut cari listesi:
${JSON.stringify(contacts)}

Bugünün tarihi: ${today}
Timezone: ${timezone}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'create_reminders',
            description: 'Kullanıcının sesli kaydından hatırlatıcılar oluştur',
            parameters: {
              type: 'object',
              properties: {
                reminders: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Hatırlatıcı başlığı — yapılacak işin kısa özeti' },
                      date_text: { type: 'string', description: "Orijinal tarih ifadesi olduğu gibi: 'yarın akşam 8', 'haftaya salı'" },
                      contact_id: { type: 'string', description: 'Eşleşen cari ID, yoksa null' },
                      new_contact_suggestion: {
                        type: 'object',
                        properties: {
                          company: { type: 'string' },
                          contact_name: { type: 'string' },
                        },
                        description: 'Yeni cari önerisi — listede eşleşme bulunamadığında',
                      },
                      confidence: { type: 'number', description: '0.0-1.0 arası güven skoru' },
                    },
                    required: ['title', 'date_text', 'confidence'],
                  },
                },
              },
              required: ['reminders'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'create_reminders' } },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`GPT API error (${res.status}): ${errText}`)
  }

  const data = await res.json()

  // function calling response parse
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
  if (!toolCall?.function?.arguments) {
    throw new Error('GPT did not return a function call')
  }

  const parsed = JSON.parse(toolCall.function.arguments)
  return parsed.reminders ?? []
}

// --- Util ---

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
