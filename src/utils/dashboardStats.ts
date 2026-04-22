// src/utils/dashboardStats.ts
// Dashboard için saf veri aggregation fonksiyonları.
// Her fonksiyon pure — side effect yok, DashboardScreen'de useMemo ile hesaplanır.

import type { Reminder, Contact } from '../models/types'

// ---------- Zaman yardımcıları ----------

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ISO datetime → lokal tarih anahtarı (YYYY-MM-DD)
function isoToDateKey(iso: string): string {
  const d = new Date(iso)
  return toLocalDateKey(d)
}

// Pazartesi başlangıçlı haftanın ilk günü (lokal)
function startOfWeek(ref: Date): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Paz, 1 = Pzt, ..., 6 = Cmt
  const offset = (dow + 6) % 7 // Pazartesi'ye olan uzaklık
  d.setDate(d.getDate() - offset)
  return d
}

// N gün öncesi (00:00:00'da)
function daysAgo(n: number, ref: Date = new Date()): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

// ---------- Ana metrikler ----------

export type TodayStats = {
  total: number
  done: number
  pending: number
  completionPct: number // 0-100
}

export function getTodayStats(reminders: Reminder[], now: Date = new Date()): TodayStats {
  const todayKey = toLocalDateKey(now)
  const todays = reminders.filter((r) => isoToDateKey(r.datetime) === todayKey)
  const done = todays.filter((r) => r.status === 'done').length
  const pending = todays.filter((r) => r.status === 'pending').length
  const total = todays.length
  const completionPct = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, pending, completionPct }
}

// Gecikmiş = status pending AND datetime geçmişte
export function getOverdueCount(reminders: Reminder[], now: Date = new Date()): number {
  const nowTs = now.getTime()
  return reminders.filter((r) => {
    if (r.status !== 'pending') return false
    return new Date(r.datetime).getTime() < nowTs
  }).length
}

export type WeekStats = {
  total: number
  done: number
  pending: number
  completionPct: number
}

// Bu hafta (Pzt-Paz, lokal) tamamlanma
export function getWeekStats(reminders: Reminder[], now: Date = new Date()): WeekStats {
  const weekStart = startOfWeek(now).getTime()
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000
  const weekItems = reminders.filter((r) => {
    const t = new Date(r.datetime).getTime()
    return t >= weekStart && t < weekEnd
  })
  const done = weekItems.filter((r) => r.status === 'done').length
  const pending = weekItems.filter((r) => r.status === 'pending').length
  const total = weekItems.length
  const completionPct = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, done, pending, completionPct }
}

// Aktif cari: son 30 günde en az 1 reminder eklenmiş contact sayısı
export function getActiveContactsCount(
  reminders: Reminder[],
  contacts: Contact[],
  days: number = 30,
  now: Date = new Date()
): number {
  const cutoff = daysAgo(days - 1, now).getTime()
  const activeIds = new Set<string>()
  for (const r of reminders) {
    if (!r.contactId) continue
    const created = new Date(r.createdAt).getTime()
    if (created >= cutoff) activeIds.add(r.contactId)
  }
  // Sadece hâlâ mevcut olan cariler (silinmişleri sayma)
  const contactIdSet = new Set(contacts.map((c) => c.id))
  let count = 0
  for (const id of activeIds) if (contactIdSet.has(id)) count++
  return count
}

// ---------- Haftalık bar chart verisi ----------

export type DailyBar = {
  key: string            // YYYY-MM-DD
  label: string          // "Pzt" / "Sal" / ...
  done: number
  pending: number
  total: number
  isToday: boolean
}

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function getWeeklyBars(reminders: Reminder[], now: Date = new Date()): DailyBar[] {
  const weekStart = startOfWeek(now)
  const todayKey = toLocalDateKey(now)
  const bars: DailyBar[] = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    const key = toLocalDateKey(day)
    const items = reminders.filter((r) => isoToDateKey(r.datetime) === key)
    const done = items.filter((r) => r.status === 'done').length
    const pending = items.filter((r) => r.status === 'pending').length
    bars.push({
      key,
      label: DAY_LABELS[i],
      done,
      pending,
      total: items.length,
      isToday: key === todayKey,
    })
  }
  return bars
}

// ---------- Cari bazlı metrikler (CRM odaklı) ----------

export type ContactActivity = {
  contactId: string
  company: string
  contactName: string
  totalCount: number
  doneCount: number
  pendingCount: number
  lastActivityAt: string | null // ISO — en son reminder createdAt
}

export function getContactActivity(
  reminders: Reminder[],
  contacts: Contact[]
): ContactActivity[] {
  const byId = new Map<string, ContactActivity>()
  for (const c of contacts) {
    byId.set(c.id, {
      contactId: c.id,
      company: c.company,
      contactName: c.contactName,
      totalCount: 0,
      doneCount: 0,
      pendingCount: 0,
      lastActivityAt: null,
    })
  }
  for (const r of reminders) {
    if (!r.contactId) continue
    const row = byId.get(r.contactId)
    if (!row) continue
    row.totalCount += 1
    if (r.status === 'done') row.doneCount += 1
    if (r.status === 'pending') row.pendingCount += 1
    if (!row.lastActivityAt || r.createdAt > row.lastActivityAt) {
      row.lastActivityAt = r.createdAt
    }
  }
  return Array.from(byId.values())
}

// Son 30 günde hatırlatıcısı olan en yoğun 5 cari
export function getTopContacts(
  reminders: Reminder[],
  contacts: Contact[],
  limit: number = 5,
  days: number = 30,
  now: Date = new Date()
): ContactActivity[] {
  const cutoff = daysAgo(days - 1, now).getTime()
  const recentReminders = reminders.filter(
    (r) => new Date(r.createdAt).getTime() >= cutoff
  )
  return getContactActivity(recentReminders, contacts)
    .filter((row) => row.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, limit)
}

// Uyuyan cari: 30+ gündür reminder'ı olmayan (ama en az 1 reminder geçmişi olan)
export function getDormantContacts(
  reminders: Reminder[],
  contacts: Contact[],
  sleepDays: number = 30,
  now: Date = new Date()
): ContactActivity[] {
  const cutoff = daysAgo(sleepDays - 1, now).getTime()
  return getContactActivity(reminders, contacts)
    .filter((row) => {
      if (!row.lastActivityAt) return false // Hiç reminder'ı olmamış — dormant değil "boş"
      return new Date(row.lastActivityAt).getTime() < cutoff
    })
    .sort((a, b) => {
      // En uzun süredir temas edilmeyen önce
      const aT = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
      const bT = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
      return aT - bT
    })
}

// ---------- Streak (tamamlanma serisi) ----------

// Kaç gündür peş peşe günlük hedef (en az 1 tamamlanmış) tutuldu
export function getCompletionStreak(reminders: Reminder[], now: Date = new Date()): number {
  if (reminders.length === 0) return 0

  // Günlük done kümesi
  const doneDays = new Set<string>()
  for (const r of reminders) {
    if (r.status !== 'done') continue
    doneDays.add(isoToDateKey(r.datetime))
  }
  if (doneDays.size === 0) return 0

  let streak = 0
  for (let i = 0; i < 365; i++) {
    const day = daysAgo(i, now)
    const key = toLocalDateKey(day)
    if (doneDays.has(key)) streak++
    else {
      // Bugün henüz iş yapılmamış olabilir — bugünü atla ama dün varsa sayıya dahil
      if (i === 0) continue
      break
    }
  }
  return streak
}

// ---------- Genel: toplamlar ----------

export type GlobalTotals = {
  allTime: number
  allTimeDone: number
  allTimePending: number
  allTimeCompletionPct: number
}

export function getGlobalTotals(reminders: Reminder[]): GlobalTotals {
  const allTime = reminders.length
  const allTimeDone = reminders.filter((r) => r.status === 'done').length
  const allTimePending = reminders.filter((r) => r.status === 'pending').length
  const allTimeCompletionPct =
    allTime === 0 ? 0 : Math.round((allTimeDone / allTime) * 100)
  return { allTime, allTimeDone, allTimePending, allTimeCompletionPct }
}
