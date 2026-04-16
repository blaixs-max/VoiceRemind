// src/stores/contactStore.ts
// Cloud-first cari store — Supabase CRUD + lokal state

import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import { useReminderStore } from './reminderStore'
import type { Contact, ContactSummary } from '../models/types'

type ContactState = {
  contacts: Contact[]
  loading: boolean
  fetchContacts: () => Promise<void>
  addContact: (data: Omit<Contact, 'id' | 'createdAt'>) => Promise<string>
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getContact: (id: string) => Contact | undefined
  getSummaries: () => ContactSummary[]
  filterByTranscript: (transcript: string) => ContactSummary[]
}

// DB row → app model
function rowToContact(row: any): Contact {
  return {
    id: row.id,
    company: row.company,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export const useContactStore = create<ContactState>()((set, get) => ({
  contacts: [],
  loading: false,

  fetchContacts: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ contacts: (data ?? []).map(rowToContact) })
    } catch (err) {
      console.error('fetchContacts error:', err)
    } finally {
      set({ loading: false })
    }
  },

  addContact: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Oturum bulunamadı')

    const { data: rows, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        company: data.company,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      })
      .select()

    if (error) throw error
    const newContact = rowToContact(rows![0])
    set((s) => ({ contacts: [newContact, ...s.contacts] }))
    return newContact.id
  },

  updateContact: async (id, data) => {
    const updateData: Record<string, unknown> = {}
    if (data.company !== undefined) updateData.company = data.company
    if (data.contactName !== undefined) updateData.contact_name = data.contactName
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.notes !== undefined) updateData.notes = data.notes

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      contacts: s.contacts.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    }))
  },

  deleteContact: async (id) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) throw error
    set((s) => ({
      contacts: s.contacts.filter((c) => c.id !== id),
    }))

    // DB tarafında ON DELETE SET NULL çalışıyor; lokal reminder state'inde de
    // bu kişiye bağlı hatırlatıcıların contactId'sini null yap — yoksa UI'da
    // silinmiş cariye referans veren hatırlatıcılar "undefined cari" gösterir.
    useReminderStore.setState((s) => ({
      reminders: s.reminders.map((r) =>
        r.contactId === id ? { ...r, contactId: null } : r
      ),
    }))
  },

  getContact: (id) => {
    return get().contacts.find((c) => c.id === id)
  },

  getSummaries: () => {
    return get().contacts.map((c) => ({
      id: c.id,
      company: c.company,
      contactName: c.contactName,
    }))
  },

  filterByTranscript: (transcript: string) => {
    const t = transcript.toLowerCase()
    const all = get().contacts

    const matched = all.filter((c) => {
      const firstName = c.contactName.toLowerCase().split(' ')[0]
      const companyFirst = c.company.toLowerCase().split(' ')[0]
      return t.includes(firstName) || t.includes(companyFirst)
    })

    const result = matched.length > 0 ? matched : all.slice(-20)

    return result.map((c) => ({
      id: c.id,
      company: c.company,
      contactName: c.contactName,
    }))
  },
}))
