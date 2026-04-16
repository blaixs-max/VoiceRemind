// src/screens/HomeScreen.tsx
// Premium ana ekran — mikrofon + bugünün hatırlatıcıları

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MicButton from '../components/MicButton'
import ConfirmationModal from '../components/ConfirmationModal'
import { dialog } from '../components/AppDialog'
import { useRecording } from '../hooks/useRecording'
import { useParseAudio } from '../hooks/useParseAudio'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { Reminder } from '../models/types'

export default function HomeScreen() {
  const { state: recState, durationMs, startRecording, stopRecording } = useRecording()
  const { parseState, response, error, parseAudio, reset } = useParseAudio()
  const reminders = useReminderStore((s) => s.reminders)
  const getContact = useContactStore((s) => s.getContact)

  const [modalVisible, setModalVisible] = useState(false)

  const displayState = recState === 'recording'
    ? 'recording' as const
    : parseState === 'sending'
    ? 'processing' as const
    : 'idle' as const

  // bugünün pending reminder'ları
  const todayReminders = useMemo(() => {
    const today = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

    return reminders
      .filter((r) => r.datetime.startsWith(todayStr) && r.status === 'pending')
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
  }, [reminders])

  const handlePressOut = async () => {
    if (recState !== 'recording') return
    const uri = await stopRecording()
    if (!uri) return

    const result = await parseAudio(uri)
    if (result && result.reminders.length > 0) {
      setModalVisible(true)
    } else if (result && result.reminders.length === 0) {
      dialog.alert({
        title: 'Sonuç yok',
        message: 'Ses kaydından hatırlatıcı çıkarılamadı. Tekrar deneyin.',
        icon: 'information-circle-outline',
        iconColor: colors.warning,
      })
      reset()
    }
  }

  React.useEffect(() => {
    if (error) {
      dialog.alert({
        title: 'Hata',
        message: error,
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
        buttons: [{ text: 'Tamam', onPress: reset }],
      })
    }
  }, [error, reset])

  const handleModalClose = () => {
    setModalVisible(false)
    reset()
  }

  const renderReminder = ({ item }: { item: Reminder }) => {
    const time = new Date(item.datetime)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}`
    const contact = item.contactId ? getContact(item.contactId) : null

    return (
      <View style={styles.reminderCard}>
        <View style={styles.timeChip}>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
        <View style={styles.reminderContent}>
          <Text style={styles.reminderTitle} numberOfLines={1}>{item.title}</Text>
          {contact && (
            <View style={styles.contactRow}>
              <Ionicons name="person-outline" size={12} color={colors.textMuted} />
              <Text style={styles.reminderContact}>
                {contact.company}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Üst alan — gradient + mikrofon */}
      <View style={styles.micArea}>
        <MicButton
          state={displayState}
          durationMs={durationMs}
          onLongPress={startRecording}
          onPressOut={handlePressOut}
        />
      </View>

      {/* Alt alan — bugünün hatırlatıcıları */}
      <View style={styles.reminderSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="today-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Bugün</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{todayReminders.length}</Text>
          </View>
        </View>

        {todayReminders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sunny-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>Bugün için hatırlatıcı yok</Text>
            <Text style={styles.emptyHint}>Mikrofona basılı tutarak yeni ekleyin</Text>
          </View>
        ) : (
          <FlatList
            data={todayReminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminder}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ConfirmationModal
        visible={modalVisible}
        data={response}
        onClose={handleModalClose}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  micArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 260,
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadow.md,
  },
  reminderSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.sm,
  },
  timeChip: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  reminderContact: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
