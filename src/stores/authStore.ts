// src/stores/authStore.ts
// Supabase Auth yönetimi — login, register, logout, session tracking

import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  initialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Mevcut session'ı kontrol et
      const { data } = await supabase.auth.getSession()
      set({
        session: data.session,
        user: data.session?.user ?? null,
        initialized: true,
      })

      // Auth değişikliklerini dinle (token refresh, logout vs.)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ initialized: true })
    }
  },

  signUp: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      return null // başarılı
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      return null // başarılı
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    // Ağ hatası/token geçersiz olsa bile lokal oturum state'i mutlaka temizlenmeli —
    // aksi halde kullanıcı "çıktım" sanır ama app hala giriş ekranına geçmez.
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('signOut remote error (lokal state yine de temizlenecek):', err)
    }
    set({ session: null, user: null })
  },
}))
