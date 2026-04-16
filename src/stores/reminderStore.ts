// src/stores/reminderStore.ts
// Cloud-first hatırlatıcı store — Supabase CRUD + lokal notification lifecycle

import { create } from 'zustand'
import * as Notifications from 'expo-notifications'
import { supabase } from '../utils/supabase'
import type { Reminder } from '../models/types'

type ReminderState = {
  reminders: Reminder[]
  loading: boolean
  fetchReminders: () => Promise<void>
  addReminder: (data: Omit<Reminder, 'id' | 'notificationId' | 'createdAt'>) => Promise<void>
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  markDone: (id: string) => Promise<void>
  markPending: (id: string) => Promise<void>
  markDismissed: (id: string) => Promise<void>
  toggleImportant: (id: string) => Promise<void>
  getByContact: (contactId: string) => Reminder[]
  reconcileNotifications: () => Promise<void>
}

// DB row → app model
function rowToReminder(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    datetime: row.datetime,
    remindBefore: row.remind_before,
    contactId: row.contact_id,
    notificationId: row.notification_id,
    status: row.status,
    // Migration henüz uygulanmadıysa kolon eksik olabilir → güvenli default
    isImportant: row.is_important ?? false,
    timezone: row.timezone,
    sourceText: row.source_text,
    confidence: row.confidence,
    createdAt: row.created_at,
  }
}

// Lokal bildirim schedule et
async function scheduleNotification(
  title: string,
  datetime: string,
  remindBefore: number
): Promise<string> {
  const triggerDate = new Date(datetime)
  const notifyAt = new Date(triggerDate.getTime() - remindBefore * 60_000)

  if (notifyAt.getTime() <= Date.now()) return ''

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Hatırlatıcı',
      body: title,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  })
}

// Lokal bildirim iptal et
async function cancelNotification(notificationId: string) {
  if (!notificationId) return
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {})
}

export const useReminderStore = create<ReminderState>()((set, get) => ({
  reminders: [],
  loading: false,

  fetchReminders: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('datetime', { ascending: true })

      if (error) throw error
      const reminders = (data ?? []).map(rowToReminder)
      set({ reminders })

      // Pending hatırlatıcılar için lokal notification schedule et
      for (const r of reminders) {
        if (r.status === 'pending' && !r.notificationId) {
          const notifId = await scheduleNotification(r.title, r.datetime, r.remindBefore)
          if (notifId) {
            // Lokal state ve DB'de notification_id güncelle
            await supabase
              .from('reminders')
              .update({ notification_id: notifId })
              .eq('id', r.id)

            set((s) => ({
              reminders: s.reminders.map((rem) =>
                rem.id === r.id ? { ...rem, notificationId: notifId } : rem
              ),
            }))
          }
        }
      }
    } catch (err) {
      console.error('fetchReminders error:', err)
    } finally {
      set({ loading: false })
    }
  },

  addReminder: async (data) => {
    // Lokal bildirim schedule
    const notificationId = await scheduleNotification(data.title, data.datetime, data.remindBefore)

    // Kullanıcı ID'sini al
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Oturum bulunamadı')

    // Supabase'e kaydet
    const { data: rows, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        title: data.title,
        datetime: data.datetime,
        remind_before: data.remindBefore,
        contact_id: data.contactId,
        notification_id: notificationId,
        status: data.status,
        is_important: data.isImportant ?? false,
        timezone: data.timezone,
        source_text: data.sourceText,
        confidence: data.confidence,
      })
      .select()

    if (error) throw error
    const newReminder = rowToReminder(rows![0])
    newReminder.notificationId = notificationId // lokal ID

    set((s) => ({ reminders: [...s.reminders, newReminder] }))
  },

  updateReminder: async (id, data) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (!existing) return

    // Tarih değişmişse notification'ı yeniden schedule et
    let notificationId = existing.notificationId
    if (data.datetime && data.datetime !== existing.datetime) {
      await cancelNotification(existing.notificationId)
      notificationId = await scheduleNotification(
        data.title ?? existing.title,
        data.datetime,
        data.remindBefore ?? existing.remindBefore
      )
    }

    // DB güncelle
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.datetime !== undefined) updateData.datetime = data.datetime
    if (data.remindBefore !== undefined) updateData.remind_before = data.remindBefore
    if (data.contactId !== undefined) updateData.contact_id = data.contactId
    if (data.status !== undefined) updateData.status = data.status
    if (data.isImportant !== undefined) updateData.is_important = data.isImportant
    updateData.notification_id = notificationId

    const { error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, ...data, notificationId } : r
      ),
    }))
  },

  deleteReminder: async (id) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (existing) await cancelNotification(existing.notificationId)

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      reminders: s.reminders.filter((r) => r.id !== id),
    }))
  },

  markDone: async (id) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (!existing) return

    await cancelNotification(existing.notificationId)

    const { error } = await supabase
      .from('reminders')
      .update({ status: 'done', notification_id: '' })
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, status: 'done' as const, notificationId: '' } : r
      ),
    }))
  },

  markPending: async (id) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (!existing) return

    const notificationId = await scheduleNotification(
      existing.title, existing.datetime, existing.remindBefore
    )

    const { error } = await supabase
      .from('reminders')
      .update({ status: 'pending', notification_id: notificationId })
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, status: 'pending' as const, notificationId } : r
      ),
    }))
  },

  markDismissed: async (id) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (existing) await cancelNotification(existing.notificationId)

    const { error } = await supabase
      .from('reminders')
      .update({ status: 'dismissed', notification_id: '' })
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' as const, notificationId: '' } : r
      ),
    }))
  },

  toggleImportant: async (id) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (!existing) return

    const next = !existing.isImportant

    // Optimistic update — UI anında tepki versin, DB arkada
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, isImportant: next } : r
      ),
    }))

    const { error } = await supabase
      .from('reminders')
      .update({ is_important: next })
      .eq('id', id)

    // DB hatası varsa UI'yı geri al ki tutarsızlık olmasın
    if (error) {
      set((s) => ({
        reminders: s.reminders.map((r) =>
          r.id === id ? { ...r, isImportant: existing.isImportant } : r
        ),
      }))
      console.error('toggleImportant error:', error)
    }
  },

  getByContact: (contactId) => {
    return get().reminders.filter((r) => r.contactId === contactId)
  },

  reconcileNotifications: async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    const reminders = get().reminders

    const activeIds = new Set(
      reminders
        .filter((r) => r.status === 'pending')
        .map((r) => r.notificationId)
        .filter(Boolean)
    )

    for (const notif of scheduled) {
      if (!activeIds.has(notif.identifier)) {
        await cancelNotification(notif.identifier)
      }
    }

    // Geçmiş tarihlileri otomatik "done" yap
    const now = new Date().toISOString()
    const overdue = reminders.filter(
      (r) => r.status === 'pending' && r.datetime < now
    )

    for (const r of overdue) {
      // Hayalet bildirim bırakmamak için OS'taki schedule'ı iptal et
      await cancelNotification(r.notificationId)
      await supabase
        .from('reminders')
        .update({ status: 'done', notification_id: '' })
        .eq('id', r.id)
    }

    if (overdue.length > 0) {
      set((s) => ({
        reminders: s.reminders.map((r) =>
          r.status === 'pending' && r.datetime < now
            ? { ...r, status: 'done' as const, notificationId: '' }
            : r
        ),
      }))
    }
  },
}))
