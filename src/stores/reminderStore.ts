// src/stores/reminderStore.ts
// Dual-mode reminder store:
//   - Login: Supabase CRUD (cloud-first, RLS protected)
//   - Misafir (Apple 5.1.1(v)): AsyncStorage local-only — cihazda kalıcı, sync yok
//
// Local notification lifecycle her iki modda aynı çalışır (expo-notifications).

import { create } from 'zustand'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../utils/supabase'
import { useAuthStore } from './authStore'
import type { Reminder } from '../models/types'

const LOCAL_STORAGE_KEY = 'voicely.localReminders'

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

// Misafir mod helper'ları — AsyncStorage I/O
const isGuestMode = () => useAuthStore.getState().isGuest

async function loadLocal(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveLocal(reminders: Reminder[]) {
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reminders))
  } catch {
    // sessizce — bir sonraki write'da tekrar denenir
  }
}

// UUID alternatifi — guest local id (uuid paketi kurulu değil)
function localId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useReminderStore = create<ReminderState>()((set, get) => ({
  reminders: [],
  loading: false,

  fetchReminders: async () => {
    set({ loading: true })
    try {
      if (isGuestMode()) {
        const local = await loadLocal()
        set({ reminders: local })
        return
      }

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
    const notificationId = await scheduleNotification(data.title, data.datetime, data.remindBefore)

    if (isGuestMode()) {
      const newReminder: Reminder = {
        id: localId(),
        title: data.title,
        datetime: data.datetime,
        remindBefore: data.remindBefore,
        contactId: data.contactId,
        notificationId,
        status: data.status,
        isImportant: data.isImportant ?? false,
        timezone: data.timezone,
        sourceText: data.sourceText,
        confidence: data.confidence,
        createdAt: new Date().toISOString(),
      }
      const next = [...get().reminders, newReminder]
      set({ reminders: next })
      await saveLocal(next)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Oturum bulunamadı')

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
    newReminder.notificationId = notificationId

    set((s) => ({ reminders: [...s.reminders, newReminder] }))
  },

  updateReminder: async (id, data) => {
    const existing = get().reminders.find((r) => r.id === id)
    if (!existing) return

    let notificationId = existing.notificationId
    if (data.datetime && data.datetime !== existing.datetime) {
      await cancelNotification(existing.notificationId)
      notificationId = await scheduleNotification(
        data.title ?? existing.title,
        data.datetime,
        data.remindBefore ?? existing.remindBefore
      )
    }

    if (isGuestMode()) {
      const next = get().reminders.map((r) =>
        r.id === id ? { ...r, ...data, notificationId } : r
      )
      set({ reminders: next })
      await saveLocal(next)
      return
    }

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

    if (isGuestMode()) {
      const next = get().reminders.filter((r) => r.id !== id)
      set({ reminders: next })
      await saveLocal(next)
      return
    }

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

    if (isGuestMode()) {
      const next = get().reminders.map((r) =>
        r.id === id ? { ...r, status: 'done' as const, notificationId: '' } : r
      )
      set({ reminders: next })
      await saveLocal(next)
      return
    }

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

    if (isGuestMode()) {
      const next = get().reminders.map((r) =>
        r.id === id ? { ...r, status: 'pending' as const, notificationId } : r
      )
      set({ reminders: next })
      await saveLocal(next)
      return
    }

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

    if (isGuestMode()) {
      const next = get().reminders.map((r) =>
        r.id === id ? { ...r, status: 'dismissed' as const, notificationId: '' } : r
      )
      set({ reminders: next })
      await saveLocal(next)
      return
    }

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

    // Optimistic update
    set((s) => ({
      reminders: s.reminders.map((r) =>
        r.id === id ? { ...r, isImportant: next } : r
      ),
    }))

    if (isGuestMode()) {
      await saveLocal(get().reminders)
      return
    }

    const { error } = await supabase
      .from('reminders')
      .update({ is_important: next })
      .eq('id', id)

    if (error) {
      set((s) => ({
        reminders: s.reminders.map((r) =>
          r.id === id ? { ...r, isImportant: existing.isImportant } : r
        ),
      }))
      console.error('toggleImportant error:', error)
    }
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

    if (isGuestMode()) {
      if (overdue.length > 0) {
        for (const r of overdue) {
          await cancelNotification(r.notificationId)
        }
        const next = get().reminders.map((r) =>
          r.status === 'pending' && r.datetime < now
            ? { ...r, status: 'done' as const, notificationId: '' }
            : r
        )
        set({ reminders: next })
        await saveLocal(next)
      }
      return
    }

    for (const r of overdue) {
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
