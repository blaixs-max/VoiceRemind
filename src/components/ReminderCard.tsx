// src/components/ReminderCard.tsx

import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ConfidenceIndicator from './ConfidenceIndicator'
import ContactBadge from './ContactBadge'
import { CONFIDENCE } from '../utils/config'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { ParsedReminder } from '../models/types'

type Props = {
  reminder: ParsedReminder
  selected: boolean
  onToggle: () => void
  onTitleChange: (title: string) => void
  onDatetimeChange: (datetime: string) => void
  contactName?: { company: string; contactName: string } | null
}

export default function ReminderCard({
  reminder, selected, onToggle, onTitleChange, onDatetimeChange, contactName,
}: Props) {
  const isLow = reminder.confidence < CONFIDENCE.MEDIUM

  const dateObj = new Date(reminder.datetime)
  const dateDisplay = dateObj.toLocaleDateString('tr-TR', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={[styles.card, isLow && styles.cardWarning]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={22}
            color={selected ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TextInput
            style={styles.titleInput}
            value={reminder.title}
            onChangeText={onTitleChange}
            placeholder="Hatırlatıcı başlığı"
            placeholderTextColor={colors.textMuted}
          />
          <ConfidenceIndicator confidence={reminder.confidence} />
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={isLow ? colors.danger : colors.textMuted} />
        <Text style={[styles.dateText, isLow && styles.dateWarning]}>{dateDisplay}</Text>
        <Text style={styles.dateOriginal}>({reminder.dateText})</Text>
      </View>

      {contactName && (
        <View style={styles.badgeRow}>
          <ContactBadge company={contactName.company} contactName={contactName.contactName} />
        </View>
      )}
      {reminder.newContactSuggestion && !contactName && (
        <View style={styles.badgeRow}>
          <ContactBadge
            company={reminder.newContactSuggestion.company}
            contactName={reminder.newContactSuggestion.contactName}
            isNew
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardWarning: { borderColor: colors.danger, borderWidth: 1.5 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerRight: { flex: 1, gap: 8 },
  titleInput: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    marginLeft: 34,
  },
  dateText: { fontSize: fontSize.sm, color: colors.textSecondary },
  dateWarning: { color: colors.danger, fontWeight: fontWeight.semibold },
  dateOriginal: { fontSize: fontSize.xs, color: colors.textMuted },
  badgeRow: { marginTop: spacing.sm, marginLeft: 34 },
})
