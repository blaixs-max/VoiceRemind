// src/components/ConfirmationModal.tsx

import React, { useState, useMemo } from 'react'
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ReminderCard from './ReminderCard'
import { CONFIDENCE, DEFAULT_TIMEZONE } from '../utils/config'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { ParsedReminder, EdgeFunctionResponse } from '../models/types'

type Props = {
  visible: boolean
  data: EdgeFunctionResponse | null
  onClose: () => void
}

export default function ConfirmationModal({ visible, data, onClose }: Props) {
  const addReminder = useReminderStore((s) => s.addReminder)
  const getContact = useContactStore((s) => s.getContact)
  const addContact = useContactStore((s) => s.addContact)

  const [editedReminders, setEditedReminders] = useState<ParsedReminder[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (data?.reminders) {
      setEditedReminders([...data.reminders])
      setSelected(new Set(data.reminders.map((_, i) => i)))
    }
  }, [data])

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const updateTitle = (i: number, title: string) => {
    setEditedReminders((prev) => prev.map((r, idx) => idx === i ? { ...r, title } : r))
  }

  const updateDatetime = (i: number, datetime: string) => {
    setEditedReminders((prev) => prev.map((r, idx) => idx === i ? { ...r, datetime } : r))
  }

  const hasLowConfidence = useMemo(() => {
    return editedReminders.some((r, i) => selected.has(i) && r.confidence < CONFIDENCE.MEDIUM)
  }, [editedReminders, selected])

  const handleConfirm = async () => {
    const toSave = editedReminders.filter((_, i) => selected.has(i))
    if (toSave.length === 0) return onClose()

    setSaving(true)
    try {
      for (const r of toSave) {
        let contactId = r.contactId
        if (!contactId && r.newContactSuggestion) {
          contactId = await addContact({
            company: r.newContactSuggestion.company,
            contactName: r.newContactSuggestion.contactName,
            email: null, phone: null, notes: null,
          })
        }
        await addReminder({
          title: r.title,
          datetime: r.datetime,
          remindBefore: 0,
          contactId,
          status: 'pending',
          timezone: DEFAULT_TIMEZONE,
          sourceText: data?.transcript ?? '',
          confidence: r.confidence,
        })
      }
      onClose()
    } catch { Alert.alert('Hata', 'Hatırlatıcı kaydedilemedi.') }
    finally { setSaving(false) }
  }

  const getContactInfo = (r: ParsedReminder) => {
    if (r.contactId) {
      const c = getContact(r.contactId)
      if (c) return { company: c.company, contactName: c.contactName }
    }
    return null
  }

  if (!data) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatırlatıcıları Onayla</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Transcript */}
        <View style={styles.transcriptBox}>
          <View style={styles.transcriptIcon}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
          </View>
          <Text style={styles.transcriptText} numberOfLines={3}>
            "{data.transcript}"
          </Text>
        </View>

        {/* Kartlar */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {editedReminders.map((r, i) => (
            <ReminderCard
              key={i}
              reminder={r}
              selected={selected.has(i)}
              onToggle={() => toggleSelect(i)}
              onTitleChange={(t) => updateTitle(i, t)}
              onDatetimeChange={(d) => updateDatetime(i, d)}
              contactName={getContactInfo(r)}
            />
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {hasLowConfidence && (
            <View style={styles.warningRow}>
              <Ionicons name="alert-circle" size={16} color={colors.warning} />
              <Text style={styles.warningText}>Düşük güvenli öğeler var — tarihleri kontrol edin</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.confirmBtn, selected.size === 0 && styles.confirmDisabled]}
            onPress={handleConfirm}
            disabled={selected.size === 0 || saving}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
            <Text style={styles.confirmText}>
              {saving ? 'Kaydediliyor...' : `${selected.size} Hatırlatıcı Kaydet`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cancelText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.medium },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  transcriptBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  transcriptIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  footer: {
    padding: spacing.lg,
    paddingBottom: 34,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  warningText: { fontSize: fontSize.sm, color: colors.warning },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.glow(colors.primary),
  },
  confirmDisabled: { backgroundColor: colors.textMuted },
  confirmText: { color: colors.textInverse, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
})
