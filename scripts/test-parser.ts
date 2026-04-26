// scripts/test-parser.ts — Parser regression smoke test.
// Çalıştır: npx tsx scripts/test-parser.ts
// Çıktıyı manuel doğrula — formel test framework'ü yok (over-engineering değil).

import { parseTurkishDate } from '../src/utils/turkishDateParser'

// Sahte now: 2026-04-26 Pazar 14:30 (Türkiye öğleden sonrası)
const now = new Date(2026, 3, 26, 14, 30, 0)

const cases: Array<[string, string]> = [
  // Kullanıcının istediği temel matris
  ['bugün', 'bugün → 09:00 (geçmiş → +1g)'],
  ['yarın', 'yarın 09:00'],
  ['yarın akşam 8', '27 Nis 20:00'],
  ['3 gün sonra', '29 Nis 09:00'],
  ['3 gün sonra akşam 8', '29 Nis 20:00'],
  ['üç gün sonra', '29 Nis 09:00'],

  // Implicit today (date denmedi ama saat var → confident=true)
  ['akşam 8', 'bugün 20:00'],
  ['saat 14', 'geçmiş → 27 Nis 14:00'],
  ['saat 16', 'bugün 16:00'],
  ['16:00', 'bugün 16:00'],

  // Hafta/ay/yıl shift
  ['2 hafta sonra', '10 May 09:00'],
  ['1 ay sonra', '26 May 09:00'],
  ['iki ay sonra', '26 Haz 09:00'],
  ['1 yıl sonra', '26 Nis 2027 09:00'],

  // Gelecek/önümüzdeki
  ['gelecek pazartesi', '4 May (bir sonraki haftanın pzt)'],
  ['önümüzdeki cuma', '8 May'],
  ['gelecek hafta', '3 May (+7g)'],
  ['gelecek hafta cuma', '8 May'],

  // Az sonra / şimdi
  ['az sonra', '+5 dk'],
  ['birazdan', '+5 dk'],
  ['şimdi', '+10 sn'],

  // Zaman dilimleri (öğle çakışma kontrolü)
  ['öğleden sonra', '27 Nis 14:00 (geçmiş +1g)'],
  ['ikindi', '16:00'],
  ['akşamüstü', '17:00'],
  ['öğleden önce', '27 Nis 10:00'],
  ['öğle', '27 Nis 12:00'],

  // Regression
  ['10 dakika sonra', '+10 dk'],
  ['yarım saat sonra', '+30 dk'],
  ['salı', '28 Nis'],
  ['haftaya cuma', '8 May'],
  ["ayın 5'i", '5 May'],
]

console.log(`Sahte now: ${now.toString()}\n`)
for (const [input, label] of cases) {
  const r = parseTurkishDate(input, now)
  const flag = r.confident ? '  OK' : ' low'
  console.log(`${input.padEnd(28)} → ${r.datetime} ${flag}  | ${label}`)
}
