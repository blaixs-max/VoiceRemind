// src/models/types.ts

export type Contact = {
  id: string
  company: string
  contactName: string
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string // ISO
}

export type ContactSummary = {
  id: string
  company: string
  contactName: string
}

export type Reminder = {
  id: string
  title: string
  datetime: string          // ISO — deterministic parser çıktısı
  remindBefore: number      // dakika
  contactId: string | null  // nullable — carisiz reminder olabilir
  notificationId: string    // expo-notifications identifier
  status: 'pending' | 'done' | 'dismissed'
  timezone: string          // "Europe/Istanbul"
  sourceText: string        // orijinal Whisper transcript
  confidence: number        // 0.0 - 1.0
  createdAt: string         // ISO
}

export type ParsedReminder = {
  title: string
  dateText: string          // LLM raw çıktısı: "yarın akşam 8"
  datetime: string          // deterministic parser sonucu: ISO
  contactId: string | null
  newContactSuggestion: {
    company: string
    contactName: string
  } | null
  confidence: number
}

export type EdgeFunctionResponse = {
  reminders: ParsedReminder[]
  transcript: string
}
