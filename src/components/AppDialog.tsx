// src/components/AppDialog.tsx
// Uygulama içi merkezi dialog sistemi — Alert.alert ve ActionSheetIOS'un yerine.
// Tek bir <DialogHost /> App root'a mount edilir, her yerden `dialog.alert(...)`,
// `dialog.confirm(...)`, `dialog.options(...)` ile çağrılır.
//
// Kullanım:
//   import { dialog } from './AppDialog'
//   dialog.alert('Başlık', 'Mesaj')
//   dialog.confirm({ title: 'Sil', message: '...', destructive: true, onConfirm: () => ... })
//   dialog.options({ title: 'Cari Seç', options: [{ label: 'A', onPress: ... }] })

import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

type Button = {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

type Option = {
  label: string
  icon?: IconName
  color?: string
  destructive?: boolean
  onPress: () => void
}

type Config =
  | {
      kind: 'alert'
      title: string
      message?: string
      icon?: IconName
      iconColor?: string
      buttons: Button[]
    }
  | {
      kind: 'options'
      title?: string
      message?: string
      options: Option[]
    }

// --- Singleton state + listener --------------------------------------------

type Listener = (c: Config | null) => void
const listeners = new Set<Listener>()
let current: Config | null = null

function emit() {
  for (const l of listeners) l(current)
}

function setConfig(c: Config | null) {
  current = c
  emit()
}

// --- Public imperative API -------------------------------------------------

type AlertOpts = {
  title: string
  message?: string
  icon?: IconName
  iconColor?: string
  buttons?: Button[]
}

type ConfirmOpts = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

type OptionsOpts = {
  title?: string
  message?: string
  options: Option[]
}

export const dialog = {
  /** Tek butonlu ya da çok butonlu basit mesaj kutusu. */
  alert(input: string | AlertOpts, message?: string, onPress?: () => void) {
    if (typeof input === 'string') {
      // Alert.alert(title, message, onPress) backward-compat API
      setConfig({
        kind: 'alert',
        title: input,
        message,
        buttons: [{ text: 'Tamam', onPress }],
      })
      return
    }
    setConfig({
      kind: 'alert',
      title: input.title,
      message: input.message,
      icon: input.icon,
      iconColor: input.iconColor,
      buttons:
        input.buttons && input.buttons.length > 0
          ? input.buttons
          : [{ text: 'Tamam' }],
    })
  },

  /** İptal + Onayla şeklinde ikili dialog. destructive=true ise onay butonu kırmızı. */
  confirm(opts: ConfirmOpts) {
    setConfig({
      kind: 'alert',
      title: opts.title,
      message: opts.message,
      icon: opts.destructive ? 'alert-circle-outline' : 'help-circle-outline',
      iconColor: opts.destructive ? colors.danger : colors.primary,
      buttons: [
        {
          text: opts.cancelText ?? 'İptal',
          style: 'cancel',
          onPress: opts.onCancel,
        },
        {
          text: opts.confirmText ?? (opts.destructive ? 'Sil' : 'Onayla'),
          style: opts.destructive ? 'destructive' : 'default',
          onPress: opts.onConfirm,
        },
      ],
    })
  },

  /** Seçenek listesi — X butonu ve dışa tıklama ile kapatılabilir. */
  options(opts: OptionsOpts) {
    setConfig({
      kind: 'options',
      title: opts.title,
      message: opts.message,
      options: opts.options,
    })
  },

  /** Programatik kapama (genelde gerek yok; seçim otomatik kapar). */
  hide() {
    setConfig(null)
  },
}

// --- Host component (App root'a bir kez mount edilir) ----------------------

export function DialogHost() {
  const [config, setLocal] = useState<Config | null>(current)

  useEffect(() => {
    listeners.add(setLocal)
    return () => {
      listeners.delete(setLocal)
    }
  }, [])

  const visible = config !== null

  // Backdrop / X / Android back: alert'te cancel butonu var ise onu çağır,
  // yoksa sadece kapat. Options'ta her zaman sadece kapat.
  const handleDismiss = () => {
    if (config?.kind === 'alert') {
      const cancelBtn = config.buttons.find((b) => b.style === 'cancel')
      setConfig(null)
      cancelBtn?.onPress?.()
      return
    }
    setConfig(null)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {config?.kind === 'alert' && <AlertBody config={config} />}
              {config?.kind === 'options' && (
                <OptionsBody
                  config={config}
                  onClose={() => setConfig(null)}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

// --- Alert body (ikonlu başlık + mesaj + butonlar) -------------------------

function AlertBody({ config }: { config: Extract<Config, { kind: 'alert' }> }) {
  const { title, message, icon, iconColor, buttons } = config

  const handlePress = (btn: Button) => {
    setConfig(null)
    btn.onPress?.()
  }

  // 2 buton → yatay (İptal solda, Onay sağda); aksi → dikey liste
  const horizontal = buttons.length === 2

  return (
    <View>
      {icon && (
        <View style={[styles.iconCircle, { backgroundColor: (iconColor ?? colors.primary) + '1A' }]}>
          <Ionicons name={icon} size={28} color={iconColor ?? colors.primary} />
        </View>
      )}
      <Text style={styles.alertTitle}>{title}</Text>
      {message ? <Text style={styles.alertMessage}>{message}</Text> : null}

      <View style={[styles.btnRow, horizontal ? styles.btnRowHorizontal : styles.btnRowVertical]}>
        {buttons.map((btn, i) => {
          const isCancel = btn.style === 'cancel'
          const isDestructive = btn.style === 'destructive'
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handlePress(btn)}
              activeOpacity={0.7}
              style={[
                styles.btn,
                horizontal ? styles.btnHorizontal : styles.btnVertical,
                isCancel && styles.btnCancel,
                isDestructive && styles.btnDestructive,
                !isCancel && !isDestructive && styles.btnPrimary,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.btnText,
                  isCancel && styles.btnTextCancel,
                  isDestructive && styles.btnTextDestructive,
                  !isCancel && !isDestructive && styles.btnTextPrimary,
                ]}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// --- Options body (X butonu + seçenek satırları) ---------------------------

function OptionsBody({
  config,
  onClose,
}: {
  config: Extract<Config, { kind: 'options' }>
  onClose: () => void
}) {
  const { title, message, options } = config

  const handleSelect = (opt: Option) => {
    setConfig(null)
    opt.onPress()
  }

  // 6+ seçenek varsa scrollable yap (uzun cari listeleri için)
  const Container: any = options.length > 6 ? ScrollView : View
  const containerProps = options.length > 6 ? { style: { maxHeight: 360 } } : {}

  return (
    <View>
      {/* Başlık satırı — sağda X */}
      <View style={styles.optionsHeader}>
        <View style={{ flex: 1 }}>
          {title ? <Text style={styles.optionsTitle} numberOfLines={1}>{title}</Text> : null}
          {message ? <Text style={styles.optionsMessage} numberOfLines={2}>{message}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
          accessibilityLabel="Kapat"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {(title || message) && <View style={styles.divider} />}

      <Container {...containerProps}>
        {options.map((opt, i) => {
          const color =
            opt.color ?? (opt.destructive ? colors.danger : colors.text)
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.6}
              style={styles.optionRow}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              {opt.icon && (
                <View
                  style={[
                    styles.optionIconWrap,
                    { backgroundColor: (opt.color ?? (opt.destructive ? colors.danger : colors.primary)) + '15' },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={opt.color ?? (opt.destructive ? colors.danger : colors.primary)}
                  />
                </View>
              )}
              <Text style={[styles.optionLabel, { color }]}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </Container>
    </View>
  )
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.lg,
  },

  // Alert
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  alertMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  btnRow: {
    marginTop: spacing.sm,
  },
  btnRowHorizontal: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnRowVertical: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHorizontal: { flex: 1 },
  btnVertical: { width: '100%' },
  btnPrimary: { backgroundColor: colors.primary },
  btnCancel: { backgroundColor: colors.borderLight },
  btnDestructive: { backgroundColor: colors.danger },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  btnTextPrimary: { color: colors.white },
  btnTextCancel: { color: colors.textSecondary },
  btnTextDestructive: { color: colors.white },

  // Options
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  optionsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  optionsMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
})
