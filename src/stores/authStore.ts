// src/stores/authStore.ts
// Supabase Auth + guest mode yönetimi.
// Apple 5.1.1(v): login wall yasak → "Misafir Devam Et" girişi var.
// Apple 5.1.1(v): hesap silme zorunlu → deleteAccount Edge Function çağrısı yapar.

import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../utils/supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/config'
import type { Session, User } from '@supabase/supabase-js'

const GUEST_STORAGE_KEY = 'voicely.isGuest'

type AuthState = {
  session: Session | null
  user: User | null
  isGuest: boolean
  loading: boolean
  initialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  continueAsGuest: () => Promise<void>
  exitGuest: () => Promise<void>
  deleteAccount: () => Promise<string | null>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  user: null,
  isGuest: false,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const [{ data }, guestRaw] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(GUEST_STORAGE_KEY),
      ])

      // Cache'lenmiş session'ı server-side doğrula: getUser() JWT'yi Supabase Auth
      // sunucusunda validate eder. Cache "geçerli" görünüyor ama server reddediyorsa
      // (expire olmuş refresh token vb.), refresh dene → başarısızsa session'ı sıfırla.
      // Bu, "app'e girdim ama boş veri geldi çünkü token invalid" bug'ını önler.
      let validSession = data.session
      if (validSession) {
        const { data: userData, error } = await supabase.auth.getUser()
        if (error || !userData.user) {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !refreshed.session) {
            // Kurtarılamaz — user login ekranına düşsün, "sessizce boş liste" olmasın.
            validSession = null
          } else {
            validSession = refreshed.session
          }
        }
      }

      // Session varsa guest bayrağını yok say (login öncelikli).
      const hasSession = !!validSession
      const isGuest = !hasSession && guestRaw === '1'

      set({
        session: validSession,
        user: validSession?.user ?? null,
        isGuest,
        initialized: true,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          // Login olunca guest bayrağı kalkar.
          isGuest: session ? false : get().isGuest,
        })
        if (session) {
          AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {})
        }
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
      return null
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      return null
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
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {})
    set({ session: null, user: null, isGuest: false })
  },

  continueAsGuest: async () => {
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, '1').catch(() => {})
    set({ isGuest: true, session: null, user: null })
  },

  exitGuest: async () => {
    // Kullanıcı misafir modundan çıkmak isterse — login ekranına geri döner.
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {})
    set({ isGuest: false })
  },

  deleteAccount: async () => {
    const { session } = get()
    if (!session) return 'Oturum bulunamadı'

    set({ loading: true })
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Silme başarısız' }))
        return body.error ?? `Silme başarısız (${res.status})`
      }

      // Hesap silindi — lokal state'i sıfırla. signOut çağırmıyoruz çünkü
      // kullanıcı zaten yok, getSession 401 verir.
      await supabase.auth.signOut().catch(() => {})
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {})
      set({ session: null, user: null, isGuest: false })
      return null
    } catch (err) {
      return (err as Error).message ?? 'Beklenmeyen hata'
    } finally {
      set({ loading: false })
    }
  },
}))
