// src/screens/RemindersScreen.tsx
// Premium reminder listesi — section groups + segment control + filtre

import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { Reminder } from '../models/types'
import type { RemindersStackParamList } from '../navigation/types'
import ReminderActionSheet from '../components/ReminderActionSheet'

type Nav = NativeStackNavigationProp<RemindersStackParamList, 'ReminderList'>


type FilterMode = 'pending' | 'done' | 'all'

export default function RemindersScreen() {
  const navigation = useNavigation<Nav>()
  const reminders = useReminderStore((s) => s.reminders)
  const markDone = useReminderStore((s) => s.markDone)
  const markPending = useReminderStore((s) => s.markPending)
  const deleteReminder = useReminderStore((s) => s.deleteReminder)
  const getContact = useContactStore((s) => s.getContact)
  const contacts = useContactStore((s) => s.contacts)

  const [filter, setFilter] = useState<FilterMode>('pending')
  const [contactFilter, setContactFilter] = useState<string | null>(null)

  // Uygulama içi aksiyon menüsünün hedefi. null iken menü kapalı.
  const [actionTarget, setActionTarget] = useState<Reminder | null>(null)

  // Ekran saat başına kadar açık kalırsa grupları doğru tutmak için
  // 60 sn'de bir 'now' tick'i — useMemo bu tick'e bağlı olduğundan gece yarısı
  // geçince "Bugün" otomatik yenilenir.
  const [nowTick, setNowTick] = useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const sections = useMemo(() => {
    const todayStr = fmtDateKey(new Date())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = fmtDateKey(tomorrow)

    let list = reminders
    if (filter === 'pending') list = list.filter((r) => r.status === 'pending')
    else if (filter === 'done') list = list.filter((r) => r.status === 'done')
    if (contactFilter) list = list.filter((r) => r.contactId === contactFilter)

    list = [...list].sort((a, b) => a.datetime.localeCompare(b.datetime))

    const groups: Record<string, Reminder[]> = {}
    const order = ['Geçmiş', 'Bugün', 'Yarın', 'Gelecek']
    for (const key of order) groups[key] = []

    for (const r of list) {
      const dk = r.datetime.substring(0, 10)
      if (dk === todayStr) groups['Bugün'].push(r)
      else if (dk === tomorrowStr) groups['Yarın'].push(r)
      else if (dk > todayStr) groups['Gelecek'].push(r)
      else groups['Geçmiş'].push(r)
    }

    return order
      .filter((k) => groups[k].length > 0)
      .map((title) => ({ title, data: groups[title] }))
  }, [reminders, filter, contactFilter, nowTick])

  const totalCount = sections.reduce((s, sec) => s + sec.data.length, 0)

  // Long-press → uygulama içi aksiyon menüsünü aç
  const showActions = useCallback((r: Reminder) => {
    setActionTarget(r)
  }, [])

  // Silme onayı hâlâ sistem Alert — "yanlışlıkla sil" korumasının en tanıdık yolu.
  const confirmDelete = useCallback((r: Reminder) => {
    Alert.alert('Sil', `"${r.title}" silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteReminder(r.id) },
    ])
  }, [deleteReminder])

  const handleToggleStatus = useCallback((r: Reminder) => {
    if (r.status === 'pending') markDone(r.id)
    else markPending(r.id)
  }, [markDone, markPending])

  const handleEditReminder = useCallback((r: Reminder) => {
    navigation.navigate('ReminderEdit', { reminderId: r.id })
  }, [navigation])

  const renderItem = useCallback(({ item }: { item: Reminder }) => {
    const t = new Date(item.datetime)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${pad(t.getHours())}:${pad(t.getMinutes())}`
    const dateStr = t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    const contact = item.contactId ? getContact(item.contactId) : null
    const isDone = item.status !== 'pending'

    return (
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        onPress={() => { if (item.status === 'pending') markDone(item.id) }}
        onLongPress={() => showActions(item)}
        activeOpacity={0.7}
      >
        {/* Timeline dot */}
        <View style={styles.timeline}>
          <View style={[
            styles.dot,
            { backgroundColor: isDone ? colors.success : colors.primary }
          ]}>
            {isDone && <Ionicons name="checkmark" size={10} color={colors.white} />}
          </View>
          <View style={styles.line} />
        </View>

        {/* İçerik */}
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, isDone && styles.textDone]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[
              styles.confidenceDot,
              {
                backgroundColor:
                  item.confidence >= 0.9 ? colors.success
                  : item.confidence >= 0.7 ? colors.warning
                  : colors.danger
              }
            ]} />
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color={colors.primary} />
              <Text style={styles.metaText}>{timeStr}</Text>
            </View>
            <Text style={styles.metaDate}>{dateStr}</Text>
            {contact && (
              <View style={styles.metaChip}>
                <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaContact} numberOfLines={1}>{contact.company}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }, [getContact, showActions, markDone])

  const sectionIcon = (title: string) => {
    switch (title) {
      case 'Bugün': return 'today-outline'
      case 'Yarın': return 'calendar-outline'
      case 'Gelecek': return 'arrow-forward-outline'
      case 'Geçmiş': return 'time-outline'
      default: return 'calendar-outline'
    }
  }

  return (
    <View style={styles.container}>
      {/* Segment control */}
      <View style={styles.filterBar}>
        <View style={styles.segmentRow}>
          {(['pending', 'done', 'all'] as FilterMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.segment, filter === mode && styles.segmentActive]}
              onPress={() => setFilter(mode)}
            >
              <Text style={[styles.segmentText, filter === mode && styles.segmentTextActive]}>
                {mode === 'pending' ? 'Bekliyor' : mode === 'done' ? 'Tamamlandı' : 'Tümü'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {contacts.length > 0 && (
          <TouchableOpacity
            style={[styles.filterChip, contactFilter && styles.filterChipActive]}
            onPress={() => {
              if (contactFilter) return setContactFilter(null)
              if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: [...contacts.map((c) => c.company), 'Tümü', 'İptal'],
                    cancelButtonIndex: contacts.length + 1,
                  },
                  (i) => {
                    if (i < contacts.length) setContactFilter(contacts[i].id)
                    else if (i === contacts.length) setContactFilter(null)
                  }
                )
              } else {
                Alert.alert('Cariye Göre Filtrele', '', [
                  ...contacts.map((c) => ({
                    text: c.company,
                    onPress: () => setContactFilter(c.id),
                  })),
                  { text: 'Tümü', onPress: () => setContactFilter(null) },
                  { text: 'İptal', style: 'cancel' as const },
                ])
              }
            }}
          >
            <Ionicons
              name="funnel-outline"
              size={14}
              color={contactFilter ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.filterChipText, contactFilter && { color: colors.primary }]}>
              {contactFilter ? getContact(contactFilter)?.company ?? 'Filtre' : 'Cari'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Liste */}
      {totalCount === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>
            {filter === 'pending' ? 'Bekleyen hatırlatıcı yok'
            : filter === 'done' ? 'Tamamlanmış hatırlatıcı yok'
            : 'Henüz hatırlatıcı eklenmemiş'}
          </Text>
          <Text style={styles.emptyHint}>Kayıt ekranından sesli komut verin</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLeft}>
                <Ionicons name={sectionIcon(section.title) as any} size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionCount}>{section.data.length}</Text>
              </View>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Uygulama içi aksiyon menüsü — long-press ile açılır */}
      <ReminderActionSheet
        reminder={actionTarget}
        onClose={() => setActionTarget(null)}
        onEdit={handleEditReminder}
        onToggleStatus={handleToggleStatus}
        onDelete={confirmDelete}
      />
    </View>
  )
}

function fmtDateKey(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  segmentText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.primaryBg,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  listContent: { paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardDone: { opacity: 0.45 },
  timeline: {
    alignItems: 'center',
    width: 20,
    paddingTop: 4,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  cardBody: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  confidenceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  metaDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  metaContact: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    maxWidth: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
