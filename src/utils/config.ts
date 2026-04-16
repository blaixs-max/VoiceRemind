// src/utils/config.ts

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Ses kaydı ayarları
export const RECORDING_CONFIG = {
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  extension: '.m4a',
  minDurationMs: 1000, // 1 saniyenin altı reddedilir
}

// Confidence eşikleri
export const CONFIDENCE = {
  HIGH: 0.9,    // hızlı onay — tek tık
  MEDIUM: 0.7,  // normal onay — düzenle + onayla
  // < 0.7 = zorunlu düzenleme, tarih kırmızı
}

// API ayarları
// Whisper STT (uzun ses) + GPT + multipart upload yavaş bağlantıda 10s'yi geçebilir.
// 45s daha gerçekçi — kullanıcı "bağlantı hatası" görüp tekrar kaydederek çift reminder
// oluşturmaz (ve istek aslında sunucuda tamamlanıyor olmasın).
export const API_TIMEOUT_MS = 45_000

// Varsayılan saat (saat belirtilmemişse)
export const DEFAULT_HOUR = 9 // 09:00

// Timezone
export const DEFAULT_TIMEZONE = 'Europe/Istanbul'
