// src/screens/SettingsScreen.tsx
// Ayarlar — Hesap durumu, Hesabımı Sil (Apple 5.1.1(v)), Çıkış, Linkler.
//
// Apple reviewer için kritik akış:
//   Settings → "Hesabımı Sil" → confirm dialog → Edge Function → success → Auth ekranına dön

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../stores/authStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'

const APP_VERSION = '1.0.1'
const PRIVACY_URL = 'https://blaixs-max.github.io/VoiceRemind/privacy/'
const SUPPORT_URL = 'https://blaixs-max.github.io/VoiceRemind/support/'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)
  const loading = useAuthStore((s) => s.loading)
  const signOut = useAuthStore((s) => s.signOut)
  const exitGuest = useAuthStore((s) => s.exitGuest)
  const deleteAccount = useAuthStore((s) => s.deleteAccount)

  const handleSignOut = () => {
    dialog.confirm({
      title: 'Çıkış Yap',
      message: 'Hesabınızdan çıkmak istediğinize emin misiniz?',
      confirmText: 'Çıkış Yap',
      onConfirm: () => {
        signOut()
      },
    })
  }

  const handleDeleteAccount = () => {
    // Apple kuralı: silme onay adımı OK ama tek tıkla bitmemeli, ama "highly-regulated"
    // değiliz, o yüzden iki adımlı (info → confirm) yeter. Tek bir destructive confirm
    // dialog'u Apple'ın "may include confirmation steps" kapsamında.
    dialog.confirm({
      title: 'Hesabımı Sil',
      message:
        'Hesabınız ve tüm verileriniz (hatırlatıcılar, cariler) kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      destructive: true,
      confirmText: 'Hesabı Sil',
      cancelText: 'Vazgeç',
      onConfirm: async () => {
        const error = await deleteAccount()
        if (error) {
          dialog.alert({
            title: 'Silinemedi',
            message: error,
            icon: 'alert-circle-outline',
            iconColor: colors.danger,
          })
          return
        }
        dialog.alert({
          title: 'Hesabınız Silindi',
          message: 'Tüm verileriniz kaldırıldı. İlgi gösterdiğiniz için teşekkürler.',
          icon: 'checkmark-circle-outline',
          iconColor: colors.success,
        })
      },
    })
  }

  const handleExitGuest = () => {
    exitGuest()
  }

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      dialog.alert({
        title: 'Bağlantı açılamadı',
        message: 'Lütfen daha sonra tekrar deneyin.',
        icon: 'alert-circle-outline',
        iconColor: colors.warning,
      })
    })
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Ayarlar</Text>

      {/* Hesap kartı */}
      <View style={styles.card}>
        <View style={styles.accountHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isGuest ? colors.textMuted : colors.primary },
            ]}
          >
            <Ionicons
              name={isGuest ? 'person-outline' : 'mail-outline'}
              size={22}
              color={colors.white}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>
              {isGuest ? 'Misafir Modu' : (user?.email ?? 'Hesap')}
            </Text>
            <Text style={styles.accountSubtitle}>
              {isGuest
                ? 'Verileriniz yalnızca bu cihazda. Hesap açarak buluta yedekleyin.'
                : 'Verileriniz bulutta güvenle senkronize ediliyor.'}
            </Text>
          </View>
        </View>

        {isGuest ? (
          <TouchableOpacity
            style={[styles.actionRow, styles.actionPrimary]}
            onPress={handleExitGuest}
            activeOpacity={0.7}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.white} />
            <Text style={styles.actionPrimaryText}>Hesap Aç / Giriş Yap</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
            <Text style={styles.actionText}>Çıkış Yap</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Yasal & Destek */}
      <Text style={styles.sectionLabel}>Yasal & Destek</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Gizlilik Politikası"
          onPress={() => openLink(PRIVACY_URL)}
        />
        <View style={styles.rowDivider} />
        <SettingsRow
          icon="help-circle-outline"
          label="Destek & SSS"
          onPress={() => openLink(SUPPORT_URL)}
        />
      </View>

      {/* Hesap Silme — sadece login kullanıcı için (misafirde silinecek hesap yok) */}
      {!isGuest && user && (
        <>
          <Text style={styles.sectionLabel}>Tehlikeli Bölge</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              )}
              <Text style={[styles.actionText, { color: colors.danger }]}>
                Hesabımı Sil
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.danger} />
            </TouchableOpacity>
            <Text style={styles.dangerNote}>
              Hesabınız ve tüm verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
            </Text>
          </View>
        </>
      )}

      <Text style={styles.versionText}>Voicely AI · Sürüm {APP_VERSION}</Text>
    </ScrollView>
  )
}

function SettingsRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  heading: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.textOnDark,
    letterSpacing: -0.6,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  accountSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textOnDarkMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOnCard,
    marginLeft: 32,
  },
  dangerNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
