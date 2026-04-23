// src/screens/ReminderEditScreen.tsx
// Hatırlatıcı düzenleme — başlık + tarih/saat + cari + remindBefore

import React, { useState, useLayoutEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow, gradients } from '../utils/theme'
import type { RemindersStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<RemindersStackParamList, 'ReminderEdit'>
type Rt = RouteProp<RemindersStackParamList, 'ReminderEdit'>

const REMIND_BEFORE_OPTIONS = [
  { value: 0, label: 'Tam zamanında' },
  { value: 5, label: '5 dk önce' },
  { value: 15, label: '15 dk önce' },
  { value: 30, label: '30 dk önce' },
  { value: 60, label: '1 saat önce' },
]

export default function ReminderEditScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<Rt>()
  const { reminderId } = route.params

  const reminder = useReminderStore((s) => s.reminders.find((r) => r.id === reminderId))
  const updateReminder = useReminderStore((s) => s.updateReminder)
  const deleteReminder = useReminderStore((s) => s.deleteReminder)
  const contacts = useContactStore((s) => s.contacts)
  const getContact = useContactStore((s) => s.getContact)

  // Hatırlatıcı yoksa (silinmiş olabilir) — geri dön
  useLayoutEffect(() => {
    if (!reminder) navigation.goBack()
  }, [reminder, navigation])

  // Form state — reminder varsa initial değerleri yükle
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [datetime, setDatetime] = useState<Date>(
    reminder ? new Date(reminder.datetime) : new Date()
  )
  const [contactId, setContactId] = useState<string | null>(reminder?.contactId ?? null)
  const [remindBefore, setRemindBefore] = useState<number>(reminder?.remindBefore ?? 0)
  const [saving, setSaving] = useState(false)

  // Android'de picker tek seferde açılıp kapanır; iOS'ta inline gösteririz
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  if (!reminder) return null

  const selectedContact = contactId ? getContact(contactId) : null

  const pickContact = () => {
    if (contacts.length === 0) {
      return dialog.alert({
        title: 'Cari Yok',
        message: 'Önce cari listesine kişi ekleyin.',
        icon: 'information-circle-outline',
        iconColor: colors.primary,
      })
    }
    dialog.options({
      title: 'Cari Seç',
      options: [
        {
          label: '(Carisiz)',
          icon: 'remove-circle-outline',
          onPress: () => setContactId(null),
        },
        ...contacts.map((c) => ({
          label: c.company,
          icon: 'business-outline' as const,
          onPress: () => setContactId(c.id),
        })),
      ],
    })
  }

  const pickRemindBefore = () => {
    dialog.options({
      title: 'Ne zaman hatırlatılsın?',
      options: REMIND_BEFORE_OPTIONS.map((o) => ({
        label: o.label,
        icon: 'notifications-outline' as const,
        onPress: () => setRemindBefore(o.value),
      })),
    })
  }

  const onDateChange = (_: unknown, selected?: Date) => {
    // Android: picker tek seferde kapanır; iOS: inline kalır
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (selected) {
      // Sadece tarih kısmını değiştir, saat korunsun
      const next = new Date(datetime)
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
      setDatetime(next)
    }
  }

  const onTimeChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false)
    if (selected) {
      const next = new Date(datetime)
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
      setDatetime(next)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      return dialog.alert({
        title: 'Hata',
        message: 'Başlık boş olamaz.',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    }

    setSaving(true)
    try {
      await updateReminder(reminderId, {
        title: title.trim(),
        datetime: datetime.toISOString(),
        contactId,
        remindBefore,
      })
      navigation.goBack()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kaydetme başarısız.'
      dialog.alert({
        title: 'Hata',
        message,
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    dialog.confirm({
      title: 'Hatırlatıcıyı Sil',
      message: `"${reminder.title}" silinecek. Bu işlem geri alınamaz.`,
      destructive: true,
      confirmText: 'Sil',
      onConfirm: async () => {
        await deleteReminder(reminderId)
        navigation.goBack()
      },
    })
  }

  const dateLabel = datetime.toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeLabel = datetime.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  })
  const remindBeforeLabel =
    REMIND_BEFORE_OPTIONS.find((o) => o.value === remindBefore)?.label ?? 'Tam zamanında'

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
        <View style={styles.card}>
          {/* Başlık */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
              <Text style={styles.label}>Başlık *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Hatırlatıcı başlığı"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Tarih */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.label}>Tarih</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowDatePicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{dateLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={datetime}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                locale="tr-TR"
              />
            )}
          </View>

          {/* Saat */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.label}>Saat</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowTimePicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{timeLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={datetime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                is24Hour
                locale="tr-TR"
              />
            )}
          </View>

          {/* Cari */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} />
              <Text style={styles.label}>Cari</Text>
            </View>
            <TouchableOpacity style={styles.pickerInput} onPress={pickContact} activeOpacity={0.7}>
              <Text style={[styles.pickerText, !selectedContact && styles.pickerPlaceholder]}>
                {selectedContact
                  ? `${selectedContact.company} — ${selectedContact.contactName}`
                  : 'Carisiz'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* RemindBefore */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="notifications-outline" size={16} color={colors.textMuted} />
              <Text style={styles.label}>Hatırlatma Zamanı</Text>
            </View>
            <TouchableOpacity style={styles.pickerInput} onPress={pickRemindBefore} activeOpacity={0.7}>
              <Text style={styles.pickerText}>{remindBeforeLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveWrap, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <LinearGradient
            colors={gradients.mic as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.saveButtonText}>
              {saving ? 'Kaydediliyor...' : 'Güncelle'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          disabled={saving}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteButtonText}>Hatırlatıcıyı Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
  fieldGroup: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerInput: {
    backgroundColor: '#F7F8FB',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  pickerPlaceholder: { color: colors.textMuted },
  saveWrap: {
    borderRadius: radius.lg,
    marginTop: spacing.xxl,
    ...shadow.glow('#7B61FF'),
  },
  saveButton: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
})
