// src/utils/turkishDateParser.ts
// Deterministic Türkçe tarih parser
// GPT'den gelen date_text'i (ör. "yarın akşam 8") ISO datetime'a çevirir.
// LLM'e datetime hesaplatmıyoruz — tarih parse hatası riski yüksek.

const DAY_NAMES: Record<string, number> = {
  pazartesi: 1,
  salı: 2, sali: 2,
  çarşamba: 3, carsamba: 3,
  perşembe: 4, persembe: 4,
  cuma: 5,
  cumartesi: 6,
  pazar: 0,
}

const TIME_WORDS: Record<string, number> = {
  sabah: 9,
  öğlen: 12, oglen: 12,
  'öğleden sonra': 14, 'ogleden sonra': 14,
  akşam: 19, aksam: 19,
  gece: 22,
}

// Türkçe sayı sözcükleri → rakam
const TURKISH_NUMBERS: Record<string, number> = {
  bir: 1, iki: 2, üç: 3, uc: 3, dört: 4, dort: 4,
  beş: 5, bes: 5, altı: 6, alti: 6, yedi: 7, sekiz: 8,
  dokuz: 9, on: 10, 'on bir': 11, 'on iki': 12,
  'on üç': 13, 'on uc': 13, 'on dört': 14, 'on dort': 14,
  'on beş': 15, 'on bes': 15, 'on altı': 16, 'on alti': 16,
  'on yedi': 17, 'on sekiz': 18, 'on dokuz': 19,
  yirmi: 20, 'yirmi bir': 21, 'yirmi iki': 22, 'yirmi üç': 23, 'yirmi uc': 23,
}

const MONTH_NAMES: Record<string, number> = {
  ocak: 0, şubat: 1, subat: 1, mart: 2, nisan: 3,
  mayıs: 4, mayis: 4, haziran: 5, temmuz: 6,
  ağustos: 7, agustos: 7, eylül: 8, eylul: 8,
  ekim: 9, kasım: 10, kasim: 10, aralık: 11, aralik: 11,
}

export type ParseResult = {
  datetime: string   // "YYYY-MM-DDTHH:mm:ss" — local time, Z yok
  confident: boolean
}

/**
 * Ana parse fonksiyonu.
 * @param dateText - GPT'den gelen ham tarih ifadesi: "yarın akşam 8"
 * @param now - referans zaman (test için override edilebilir)
 * @param timezone - IANA timezone string (şimdilik kullanılmıyor, gelecek için)
 */
export function parseTurkishDate(
  dateText: string,
  now: Date = new Date(),
  _timezone: string = 'Europe/Istanbul'
): ParseResult {
  const input = normalize(dateText)

  // --- Göreceli zaman: "10 dakika sonra", "1 saat sonra", "yarım saat sonra" ---
  const relative = resolveRelativeTime(input, now)
  if (relative) {
    return { datetime: formatLocal(relative), confident: true }
  }

  let date = resolveDate(input, now)
  let hour = resolveHour(input)
  const minute = resolveMinute(input)
  let confident = true

  if (!date) {
    date = cloneDate(now)
    confident = false
  }

  if (hour === null) {
    hour = 9
  }

  // AM/PM: saat < 7 ve açıkça "sabah 1-6" denmediyse → PM
  if (hour < 7 && !hasExplicitAMContext(input)) {
    hour += 12
  }

  date.setHours(hour, minute, 0, 0)

  // geçmiş tarih → gelecek
  if (date.getTime() <= now.getTime()) {
    date = pushToFuture(date, input)
  }

  return {
    datetime: formatLocal(date),
    confident,
  }
}

// --- Göreceli Zaman ---

function resolveRelativeTime(input: string, now: Date): Date | null {
  // "10 dakika sonra", "5 dakika içinde", "10 dk sonra"
  const dakikaMatch = input.match(/(\d+)\s*(?:dakika|dk)\s*(?:sonra|i[çc]inde)/)
  if (dakikaMatch) {
    const mins = parseInt(dakikaMatch[1], 10)
    return new Date(now.getTime() + mins * 60_000)
  }

  // "bir/iki/üç dakika sonra" — Türkçe sayı ile
  for (const [word, num] of Object.entries(TURKISH_NUMBERS)) {
    const pattern = new RegExp(`${word}\\s+(?:dakika|dk)\\s*(?:sonra|i[çc]inde)`)
    if (pattern.test(input)) {
      return new Date(now.getTime() + num * 60_000)
    }
  }

  // "1 saat sonra", "2 saat içinde"
  const saatSonraMatch = input.match(/(\d+)\s*saat\s*(?:sonra|i[çc]inde)/)
  if (saatSonraMatch) {
    const hours = parseInt(saatSonraMatch[1], 10)
    return new Date(now.getTime() + hours * 3600_000)
  }

  // "bir saat sonra", "iki saat sonra" — Türkçe sayı ile
  for (const [word, num] of Object.entries(TURKISH_NUMBERS)) {
    const pattern = new RegExp(`${word}\\s+saat\\s*(?:sonra|i[çc]inde)`)
    if (pattern.test(input)) {
      return new Date(now.getTime() + num * 3600_000)
    }
  }

  // "yarım saat sonra", "buçuk saat sonra"
  if (/yar[ıi]m\s+saat|bu[çc]uk\s+saat/.test(input)) {
    return new Date(now.getTime() + 30 * 60_000)
  }

  // "1.5 saat sonra", "1,5 saat sonra"
  const decimalMatch = input.match(/(\d+)[.,](\d)\s*saat\s*(?:sonra|i[çc]inde)/)
  if (decimalMatch) {
    const hours = parseInt(decimalMatch[1], 10)
    const fraction = parseInt(decimalMatch[2], 10) / 10
    return new Date(now.getTime() + (hours + fraction) * 3600_000)
  }

  return null
}

// --- Normalizasyon ---

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''\u2018\u2019]/g, "'")
    .replace(/[.,!?;]+$/g, '')
    .trim()
}

// --- Tarih Çözümleme ---

function resolveDate(input: string, now: Date): Date | null {
  if (/bug[üu]n/.test(input)) return cloneDate(now)
  if (/yar[ıi]n/.test(input)) return addDays(now, 1)
  if (/[öo]b[üu]r\s*g[üu]n/.test(input)) return addDays(now, 2)

  // "haftaya salı" vs "haftaya" — \S+ ile Türkçe karakter desteği
  const haftayaMatch = input.match(/haftaya\s+(\S+)/)
  if (haftayaMatch) {
    const dayNum = DAY_NAMES[haftayaMatch[1]]
    if (dayNum !== undefined) {
      return getNextWeekday(now, dayNum, true)
    }
    return addDays(now, 7)
  }
  if (/\bhaftaya\b/.test(input)) return addDays(now, 7)

  // gün adı — "salı", "cuma"
  // Uzun isimleri önce kontrol et: "cumartesi" "cuma"dan, "pazartesi" "pazar"dan önce eşleşmeli
  const dayEntries = Object.entries(DAY_NAMES).sort(
    ([a], [b]) => b.length - a.length
  )
  for (const [name, dayNum] of dayEntries) {
    if (input.includes(name)) {
      return getNextWeekday(now, dayNum, false)
    }
  }

  // "ayın 5'i"
  const ayinMatch = input.match(/ay[ıi]n\s+(\d{1,2})/)
  if (ayinMatch) {
    const dayOfMonth = parseInt(ayinMatch[1], 10)
    return getMonthDay(now, dayOfMonth)
  }

  // "gelecek ay" / "önümüzdeki ay"
  if (/gelecek\s+ay|[öo]n[üu]m[üu]zdeki\s+ay/.test(input)) {
    const d = cloneDate(now)
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    return d
  }

  // "14 nisan", "3 mayıs"
  for (const [monthName, monthIdx] of Object.entries(MONTH_NAMES)) {
    const m = input.match(new RegExp(`(\\d{1,2})\\s+${monthName}`))
    if (m) {
      const day = parseInt(m[1], 10)
      let year = now.getFullYear()
      const d = new Date(year, monthIdx, day)
      if (d.getTime() < now.getTime()) d.setFullYear(year + 1)
      return d
    }
  }

  return null
}

// --- Saat Çözümleme ---

function resolveHour(input: string): number | null {
  // "15:00", "15.00"
  const clockMatch = input.match(/(\d{1,2})[:.](\d{2})/)
  if (clockMatch) return parseInt(clockMatch[1], 10)

  // "16 10", "8 30" — boşlukla ayrılmış saat dakika
  const spaceTimeMatch = input.match(/\b(\d{1,2})\s+(\d{2})\b/)
  if (spaceTimeMatch) {
    const h = parseInt(spaceTimeMatch[1], 10)
    if (h >= 0 && h <= 23) return h
  }

  // "saat 3", "saat on altı"
  const saatMatch = input.match(/saat\s+(\d{1,2})/)
  if (saatMatch) return parseInt(saatMatch[1], 10)

  // "saat on altı", "saat yirmi bir" — Türkçe sayı
  const saatWordMatch = input.match(/saat\s+(.+?)(?:\s+(?:de|da|te|ta|için|e|a)|\s*$)/)
  if (saatWordMatch) {
    const num = parseTurkishNumber(saatWordMatch[1].trim())
    if (num !== null) return num
  }

  // "akşam 8", "sabah 7" — zaman dilimi + saat
  for (const [word] of Object.entries(TIME_WORDS)) {
    const m = input.match(new RegExp(word + '\\s+(\\d{1,2})'))
    if (m) {
      let h = parseInt(m[1], 10)
      if ((word.startsWith('akşam') || word.startsWith('aksam') || word === 'gece') && h < 12) {
        h += 12
      }
      return h
    }
    // "akşam on altıda" — zaman dilimi + Türkçe sayı
    const wordM = input.match(new RegExp(word + '\\s+(\\S+(?:\\s+\\S+)?)'))
    if (wordM) {
      const num = parseTurkishNumber(wordM[1].replace(/['']\s*(?:te|de|da|ta)$/, '').trim())
      if (num !== null) {
        let h = num
        if ((word.startsWith('akşam') || word.startsWith('aksam') || word === 'gece') && h < 12) {
          h += 12
        }
        return h
      }
    }
  }

  // "3'te", "5'de"
  const suffixMatch = input.match(/(\d{1,2})['']\s*(?:te|de|da|ta)\b/)
  if (suffixMatch) return parseInt(suffixMatch[1], 10)

  // Türkçe sayı sözcüğü ile saat: "on altıda", "sekizde"
  for (const [word, num] of Object.entries(TURKISH_NUMBERS)) {
    const pattern = new RegExp(`\\b${word}[''\\s]*(?:de|da|te|ta)\\b`)
    if (pattern.test(input)) return num
  }

  // sadece zaman kelimesi — "sabah" → 09:00
  for (const [word, defaultHour] of Object.entries(TIME_WORDS)) {
    if (input.includes(word)) return defaultHour
  }

  return null
}

function resolveMinute(input: string): number {
  const clockMatch = input.match(/(\d{1,2})[:.](\d{2})/)
  if (clockMatch) return parseInt(clockMatch[2], 10)

  // "16 10" — boşlukla ayrılmış
  const spaceTimeMatch = input.match(/\b(\d{1,2})\s+(\d{2})\b/)
  if (spaceTimeMatch) {
    const h = parseInt(spaceTimeMatch[1], 10)
    if (h >= 0 && h <= 23) return parseInt(spaceTimeMatch[2], 10)
  }

  if (/bu[çc]uk|yar[ıi]m/.test(input)) return 30
  return 0
}

// --- Yardımcılar ---

function parseTurkishNumber(text: string): number | null {
  const clean = text.toLowerCase().trim()
  if (TURKISH_NUMBERS[clean] !== undefined) return TURKISH_NUMBERS[clean]
  // İki kelimelik: "on altı"
  const parts = clean.split(/\s+/)
  if (parts.length === 2) {
    const combined = parts.join(' ')
    if (TURKISH_NUMBERS[combined] !== undefined) return TURKISH_NUMBERS[combined]
  }
  return null
}

function hasExplicitAMContext(input: string): boolean {
  return /sabah\s+[1-6]\b/.test(input)
}

function cloneDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const r = cloneDate(d)
  r.setDate(r.getDate() + n)
  return r
}

function getNextWeekday(now: Date, targetDay: number, nextWeek: boolean): Date {
  let diff = targetDay - now.getDay()
  if (diff <= 0) diff += 7
  if (nextWeek && diff < 7) diff += 7
  return addDays(now, diff)
}

function getMonthDay(now: Date, dayOfMonth: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
  if (d.getTime() <= now.getTime()) d.setMonth(d.getMonth() + 1)
  return d
}

/**
 * Geçmiş tarih → gelecek. Sadece input'ta geçen gün adları için +7,
 * diğer durumlarda +1 gün.
 */
function pushToFuture(date: Date, input: string): Date {
  for (const [name, dayNum] of Object.entries(DAY_NAMES)) {
    if (input.includes(name) && date.getDay() === dayNum) {
      date.setDate(date.getDate() + 7)
      return date
    }
  }
  date.setDate(date.getDate() + 1)
  return date
}

/**
 * Local time formatla — Z suffix olmadan.
 * toISOString() UTC döner, biz local wall-clock time istiyoruz.
 */
function formatLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  )
}
