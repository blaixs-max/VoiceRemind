// src/components/ManualReminderForm.tsx
// Manuel hatırlatıcı oluşturma modalı.
// Apple 5.1.1(v): Misafir kullanıcı için sesli komut yerine alternatif giriş yolu.
// Login kullanıcı için de yedek (Türkçe dictation olmayan cihaz / sessiz ortam).

import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { dialog } from './AppDialog'
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
  gradients,
} from '../utils/theme'

const REMIND_BEFORE_OPTIONS = [
  { label: 'Tam saatinde', value: 0 },
  { label: '5 dk önce', value: 5 },
  { label: '15 dk önce', value: 15 },
  { label: '30 dk önce', value: 30 },
  { label: '1 saat önce', value: 60 },
]

type Props = {
  visible: boolean
  onClose: () => void
}

export default function ManualReminderForm({ visible, onClose }: Props) {
  const addReminder = useReminderStore((s) => s.addReminder)
  const contacts = useContactStore((s) => s.contacts)

  const [title, setTitle] = useState('')
  const [datetime, setDatetime] = useState<Date>(() => roundedFutureDate())
  const [remindBefore, setRemindBefore] = useState<number>(0)
  const [contactId, setContactId] = useState<string | null>(null)
  const [showDate, setShowDate] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setTitle('')
    setDatetime(roundedFutureDate())
    setRemindBefore(0)
    setContactId(null)
    setShowDate(false)
    setShowTime(false)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      return dialog.alert({
        title: 'Başlık gerekli',
        message: 'Hatırlatıcı için bir başlık girin.',
        icon: 'alert-circle-outline',
        iconColor: colors.warning,
      })
    }
    if (datetime.getTime() <= Date.now()) {
      return dialog.alert({
        title: 'Geçmiş zaman seçilemez',
        message: 'Lütfen ileri bir tarih ve saat seçin.',
        icon: 'alert-circle-outline',
        iconColor: colors.warning,
      })
    }

    setSubmitting(true)
    try {
      await addReminder({
        title: cleanTitle,
        datetime: datetime.toISOString(),
        remindBefore,
        contactId,
        status: 'pending',
        isImportant: false,
        timezone: 'Europe/Istanbul',
        sourceText: '(Manuel)',
        confidence: 1,
      })
      reset()
      onClose()
    } catch (err) {
      dialog.alert({
        title: 'Kaydedilemedi',
        message: (err as Error).message ?? 'Bilinmeyen hata',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    // Android'de picker bir kez göründükten sonra otomatik kapanır.
    if (Platform.OS === 'android') setShowDate(false)
    if (selected) {
      const next = new Date(datetime)
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
      setDatetime(next)
    }
  }

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTime(false)
    if (selected) {
      const next = new Date(datetime)
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
      setDatetime(next)
    }
  }

  const showContactPicker = () => {
    dialog.options({
      title: 'Cari Seç',
      options: [
        {
          label: 'Cari yok',
          icon: 'close-circle-outline',
          onPress: () => setContactId(null),
        },
        ...contacts.map((c) => ({
          label: `${c.company} — ${c.contactName}`,
          icon: 'business-outline' as const,
          onPress: () => setContactId(c.id),
        })),
      ],
    })
  }

  const selectedContact = contactId ? contacts.find((c) => c.id === contactId) : null
  const remindBeforeLabel = REMIND_BEFORE_OPTIONS.find((o) => o.value === remindBefore)?.label ?? ''

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Yeni Hatırlatıcı</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Başlık */}
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. Aysu'yu ara"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />

            {/* Tarih + saat */}
            <Text style={styles.label}>Ne zaman</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowDate(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.pickerText}>{formatDate(datetime)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTime(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.pickerText}>{formatTime(datetime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Hatırlat */}
            <Text style={styles.label}>Bildirim zamanı</Text>
            <View style={styles.chipRow}>
              {REMIND_BEFORE_OPTIONS.map((opt) => {
                const active = remindBefore === opt.value
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setRemindBefore(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Cari (login ise + cariler varsa) */}
            {contacts.length > 0 && (
              <>
                <Text style={styles.label}>Cari (opsiyonel)</Text>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={showContactPicker}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={selectedContact ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.contactText,
                      !selectedContact && { color: colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedContact
                      ? `${selectedContact.company} — ${selectedContact.contactName}`
                      : 'Cari seçin (opsiyonel)'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitWrap, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={gradients.mic as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitBtn}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <Text style={styles.submitText}>Hatırlatıcıyı Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hint}>
              {remindBeforeLabel === 'Tam saatinde'
                ? 'Bildirim, hatırlatıcının saatinde gelecek.'
                : `Bildirim ${remindBeforeLabel.toLowerCase()} gelecek.`}
            </Text>
          </ScrollView>

          {/* Tarih picker — iOS inline, Android dialog */}
          {showDate && (
            <DateTimePicker
              value={datetime}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={onDateChange}
              themeVariant="light"
            />
          )}
          {showTime && (
            <DateTimePicker
              value={datetime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              themeVariant="light"
            />
          )}
          {/* iOS inline picker'lar için "Tamam" — Android'de otomatik kapanır */}
          {Platform.OS === 'ios' && (showDate || showTime) && (
            <TouchableOpacity
              style={styles.iosDoneBtn}
              onPress={() => {
                setShowDate(false)
                setShowTime(false)
              }}
            >
              <Text style={styles.iosDoneText}>Tamam</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// "Bir sonraki yarım saat"e yuvarla — örn. 14:23 → 14:30, 14:31 → 15:00
function roundedFutureDate(): Date {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() <= 30 ? 30 : 60)
  return d
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })
}

function formatTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: fontSize.md,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  pickerText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  contactText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  submitWrap: {
    borderRadius: radius.lg,
    marginTop: spacing.xl,
    ...shadow.glow('#7B61FF'),
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.lg,
  },
  submitText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  iosDoneText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
})
