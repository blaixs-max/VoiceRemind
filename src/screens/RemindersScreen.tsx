// src/screens/RemindersScreen.tsx
// Premium reminder listesi — section groups + segment control + filtre

import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useReminderStore } from '../stores/reminderStore'
import { useContactStore } from '../stores/contactStore'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { Reminder } from '../models/types'
import type { RemindersStackParamList } from '../navigation/types'
import { dialog } from '../components/AppDialog'

type Nav = NativeStackNavigationProp<RemindersStackParamList, 'ReminderList'>


type FilterMode = 'pending' | 'done' | 'all' | 'today' | 'important'

const FILTER_LABELS: Record<FilterMode, string> = {
  pending: 'Bekliyor',
  done: 'Tamamlandı',
  all: 'Tümü',
  today: 'Bugün',
  important: 'Önemli',
}

const FILTER_ORDER: FilterMode[] = ['pending', 'done', 'all', 'today', 'important']

export default function RemindersScreen() {
  const navigation = useNavigation<Nav>()
  const reminders = useReminderStore((s) => s.reminders)
  const markDone = useReminderStore((s) => s.markDone)
  const markPending = useReminderStore((s) => s.markPending)
  const deleteReminder = useReminderStore((s) => s.deleteReminder)
  const toggleImportant = useReminderStore((s) => s.toggleImportant)
  const getContact = useContactStore((s) => s.getContact)
  const contacts = useContactStore((s) => s.contacts)

  const [filter, setFilter] = useState<FilterMode>('pending')
  const [contactFilter, setContactFilter] = useState<string | null>(null)

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
    else if (filter === 'today') list = list.filter((r) => r.datetime.substring(0, 10) === todayStr)
    else if (filter === 'important') list = list.filter((r) => r.isImportant)
    if (contactFilter) list = list.filter((r) => r.contactId === contactFilter)

    // Önemli olanlar kendi section'ı içinde üste — tarih sıralamasını grup içinde koruyoruz
    list = [...list].sort((a, b) => {
      if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1
      return a.datetime.localeCompare(b.datetime)
    })

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

  const confirmDelete = useCallback((r: Reminder) => {
    dialog.confirm({
      title: 'Hatırlatıcıyı Sil',
      message: `"${r.title}" silinecek. Bu işlem geri alınamaz.`,
      destructive: true,
      confirmText: 'Sil',
      onConfirm: () => { deleteReminder(r.id) },
    })
  }, [deleteReminder])

  // Long-press → merkezi options dialog (ekranın ortasında, X butonlu)
  const showActions = useCallback((r: Reminder) => {
    const toggleLabel = r.status === 'pending' ? 'Tamamla' : 'Geri Al'
    const toggleIcon = r.status === 'pending'
      ? 'checkmark-circle-outline'
      : 'arrow-undo-outline'

    dialog.options({
      title: r.title,
      options: [
        {
          label: 'Düzenle',
          icon: 'create-outline',
          color: colors.primary,
          onPress: () => navigation.navigate('ReminderEdit', { reminderId: r.id }),
        },
        {
          label: toggleLabel,
          icon: toggleIcon,
          color: colors.success,
          onPress: () => {
            if (r.status === 'pending') markDone(r.id)
            else markPending(r.id)
          },
        },
        {
          label: 'Sil',
          icon: 'trash-outline',
          destructive: true,
          onPress: () => confirmDelete(r),
        },
      ],
    })
  }, [markDone, markPending, navigation, confirmDelete])

  const renderItem = useCallback(({ item }: { item: Reminder }) => {
    const t = new Date(item.datetime)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${pad(t.getHours())}:${pad(t.getMinutes())}`
    const dateStr = t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    const contact = item.contactId ? getContact(item.contactId) : null
    const isDone = item.status !== 'pending'
    const important = item.isImportant

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

        {/* İçerik — önemli ise sol kenarda amber bar + hafif amber tint */}
        <View style={[styles.cardBody, important && styles.cardBodyImportant]}>
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
            {/* Önemli bayrak — basılınca toggle; nested touchable, outer onPress tetiklenmez */}
            <TouchableOpacity
              onPress={() => toggleImportant(item.id)}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              style={styles.flagBtn}
              accessibilityLabel={important ? 'Önemli işaretini kaldır' : 'Önemli olarak işaretle'}
              accessibilityRole="button"
            >
              <Ionicons
                name={important ? 'flag' : 'flag-outline'}
                size={20}
                color={important ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
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
            {important && (
              <View style={styles.importantBadge}>
                <Text style={styles.importantBadgeText}>Önemli</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }, [getContact, showActions, markDone, toggleImportant])

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
      {/* Segment control — 5 filtre, tek satırda eşit bölünmüş (iOS segment control tarzı) */}
      <View style={styles.filterBar}>
        <View style={styles.segmentRow}>
          {FILTER_ORDER.map((mode) => {
            const active = filter === mode
            const isImportantSegment = mode === 'important'
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setFilter(mode)}
                activeOpacity={0.7}
              >
                {isImportantSegment && (
                  <Ionicons
                    name={active ? 'flag' : 'flag-outline'}
                    size={11}
                    color={active ? colors.warning : colors.textMuted}
                  />
                )}
                <Text
                  style={[styles.segmentText, active && styles.segmentTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  allowFontScaling={false}
                >
                  {FILTER_LABELS[mode]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {contacts.length > 0 && (
          <TouchableOpacity
            style={[styles.filterChip, contactFilter && styles.filterChipActive]}
            onPress={() => {
              if (contactFilter) return setContactFilter(null)
              dialog.options({
                title: 'Cariye Göre Filtrele',
                options: [
                  {
                    label: 'Tümü',
                    icon: 'apps-outline',
                    onPress: () => setContactFilter(null),
                  },
                  ...contacts.map((c) => ({
                    label: c.company,
                    icon: 'business-outline' as const,
                    onPress: () => setContactFilter(c.id),
                  })),
                ],
              })
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
            : filter === 'today' ? 'Bugün için hatırlatıcı yok'
            : filter === 'important' ? 'Önemli işaretli hatırlatıcı yok'
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
    gap: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  segmentText: {
    fontSize: fontSize.xs,
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
  cardBodyImportant: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  flagBtn: {
    marginLeft: spacing.sm,
    padding: 4,
  },
  importantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.warning + '1A',
  },
  importantBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
})
