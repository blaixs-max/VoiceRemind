// src/screens/AuthScreen.tsx
// Login + Register — tek ekran, toggle ile geçiş

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../stores/authStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow, gradients } from '../utils/theme'

export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const loading = useAuthStore((s) => s.loading)

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) {
      return dialog.alert({
        title: 'Hata',
        message: 'E-posta ve şifre gereklidir.',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    }
    if (password.length < 6) {
      return dialog.alert({
        title: 'Hata',
        message: 'Şifre en az 6 karakter olmalıdır.',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    }

    const error = isLogin
      ? await signIn(trimmedEmail, password)
      : await signUp(trimmedEmail, password)

    if (error) {
      dialog.alert({
        title: isLogin ? 'Giriş Başarısız' : 'Kayıt Başarısız',
        message: translateError(error),
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    } else if (!isLogin) {
      dialog.alert({
        title: 'Başarılı',
        message: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
        icon: 'checkmark-circle-outline',
        iconColor: colors.success,
        buttons: [{ text: 'Tamam', onPress: () => setIsLogin(true) }],
      })
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={gradients.mic as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="mic" size={36} color={colors.white} />
          </LinearGradient>
          <Text style={styles.appName}>Voicely AI</Text>
          <Text style={styles.tagline}>Sesli hatırlatıcı asistanınız</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((p) => !p)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Submit — gradient sunset */}
          <TouchableOpacity
            style={[styles.submitWrap, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradients.mic as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name={isLogin ? 'log-in-outline' : 'person-add-outline'}
                    size={20}
                    color={colors.white}
                  />
                  <Text style={styles.submitText}>
                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setIsLogin((p) => !p)}
        >
          <Text style={styles.toggleText}>
            {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
          </Text>
          <Text style={styles.toggleLink}>
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function translateError(error: string): string {
  if (error.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.'
  if (error.includes('already registered')) return 'Bu e-posta zaten kayıtlı.'
  if (error.includes('valid email')) return 'Geçerli bir e-posta adresi girin.'
  if (error.includes('Password should be')) return 'Şifre en az 6 karakter olmalıdır.'
  if (error.includes('network')) return 'İnternet bağlantınızı kontrol edin.'
  return error
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.glow('#7B61FF'),
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.textOnDark,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textOnDarkSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    ...shadow.lg,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    height: 52,
  },
  inputIcon: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingRight: spacing.md,
  },
  eyeBtn: {
    width: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitWrap: {
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    ...shadow.glow('#7B61FF'),
  },
  submitBtn: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  toggleText: {
    fontSize: fontSize.md,
    color: colors.textOnDarkSecondary,
  },
  toggleLink: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    fontWeight: fontWeight.bold,
  },
})
