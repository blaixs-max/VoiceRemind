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
import { useAuthStore } from '../stores/authStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'

export default function AuthScreen() {
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="mic" size={36} color={colors.white} />
          </View>
          <Text style={styles.appName}>VoiceRemind</Text>
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

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.glow(colors.primary),
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow.md,
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
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    height: 50,
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
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    ...shadow.glow(colors.primary),
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  toggleText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
