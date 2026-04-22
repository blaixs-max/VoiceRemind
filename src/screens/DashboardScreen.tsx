// src/screens/DashboardScreen.tsx
// CRM odaklı ana dashboard — metrikler, haftalık bar chart, top cariler, uyuyan cariler + mic FAB

import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
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
import { colors, fontSize, fontWeight, spacing, radius, shadow, getAvatarColor } from '../utils/theme'
import MetricCard from '../components/dashboard/MetricCard'
import BarChart from '../components/dashboard/BarChart'
import ProgressBar from '../components/dashboard/ProgressBar'
import {
  getTodayStats,
  getOverdueCount,
  getWeekStats,
  getActiveContactsCount,
  getWeeklyBars,
  getTopContacts,
  getDormantContacts,
  getCompletionStreak,
  getGlobalTotals,
} from '../utils/dashboardStats'
import type { Reminder } from '../models/types'

export default function DashboardScreen() {
  const { state: recState, durationMs, startRecording, stopRecording } = useRecording()
  const { parseState, response, error, parseAudio, reset } = useParseAudio()
  const reminders = useReminderStore((s) => s.reminders)
  const contacts = useContactStore((s) => s.contacts)
  const getContact = useContactStore((s) => s.getContact)

  const [modalVisible, setModalVisible] = useState(false)

  // Dakikada bir yenile — "gecikmiş" hesabı canlı kalsın
  const [nowTick, setNowTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const displayState = recState === 'recording'
    ? 'recording' as const
    : parseState === 'sending'
    ? 'processing' as const
    : 'idle' as const

  // --- Metrikler ---
  const stats = useMemo(() => {
    const now = new Date()
    return {
      today: getTodayStats(reminders, now),
      overdue: getOverdueCount(reminders, now),
      week: getWeekStats(reminders, now),
      activeContacts: getActiveContactsCount(reminders, contacts, 30, now),
      bars: getWeeklyBars(reminders, now),
      topContacts: getTopContacts(reminders, contacts, 5, 30, now),
      dormantContacts: getDormantContacts(reminders, contacts, 30, now).slice(0, 3),
      streak: getCompletionStreak(reminders, now),
      global: getGlobalTotals(reminders),
    }
    // nowTick sayesinde dakikada bir yeniden hesap
  }, [reminders, contacts, nowTick])

  // Bugünün pending reminder'ları — dipte kompakt liste
  const todayReminders = useMemo(() => {
    const today = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    return reminders
      .filter((r) => r.datetime.startsWith(todayStr) && r.status === 'pending')
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .slice(0, 3)
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

  useEffect(() => {
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

  // -------------------------- Render helpers --------------------------

  const renderTodayRow = (item: Reminder) => {
    const time = new Date(item.datetime)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}`
    const contact = item.contactId ? getContact(item.contactId) : null

    return (
      <View key={item.id} style={styles.todayRow}>
        <View style={styles.timeChip}>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
        <View style={styles.todayContent}>
          <Text style={styles.todayTitle} numberOfLines={1}>{item.title}</Text>
          {contact && (
            <Text style={styles.todayContact} numberOfLines={1}>
              {contact.company}
            </Text>
          )}
        </View>
        {item.isImportant && (
          <Ionicons name="flag" size={14} color={colors.accent} />
        )}
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Başlık */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.subGreeting}>CRM ve hatırlatıcı özet</Text>
          </View>
          {stats.streak > 0 && (
            <View style={styles.streakPill}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={styles.streakText}>{stats.streak} gün</Text>
            </View>
          )}
        </View>

        {/* Metric grid — 2x2 */}
        <View style={styles.metricGrid}>
          <View style={styles.metricRow}>
            <MetricCard
              icon="today-outline"
              label="Bugün"
              value={`${stats.today.done}/${stats.today.total}`}
              subValue={stats.today.total === 0 ? 'Plan yok' : `%${stats.today.completionPct} tamam`}
              accentColor={colors.primary}
              accentBg={colors.primaryBg}
            />
            <View style={{ width: spacing.md }} />
            <MetricCard
              icon="alert-circle-outline"
              label="Gecikmiş"
              value={stats.overdue}
              subValue={stats.overdue === 0 ? 'Temiz 🎉' : 'dikkat gerekiyor'}
              accentColor={colors.danger}
              accentBg={colors.dangerBg}
            />
          </View>
          <View style={{ height: spacing.md }} />
          <View style={styles.metricRow}>
            <MetricCard
              icon="trending-up-outline"
              label="Bu Hafta"
              value={`%${stats.week.completionPct}`}
              subValue={`${stats.week.done}/${stats.week.total} hatırlatıcı`}
              accentColor={colors.success}
              accentBg={colors.successBg}
            />
            <View style={{ width: spacing.md }} />
            <MetricCard
              icon="people-outline"
              label="Aktif Cari"
              value={stats.activeContacts}
              subValue="son 30 gün"
              accentColor={colors.accent}
              accentBg={colors.accentLight}
            />
          </View>
        </View>

        {/* Haftalık bar chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Haftalık Aktivite</Text>
            <Text style={styles.cardSub}>
              {stats.week.total === 0 ? 'Bu hafta veri yok' : `%${stats.week.completionPct} tamamlanma`}
            </Text>
          </View>
          <BarChart data={stats.bars} maxHeight={100} />
        </View>

        {/* Genel tamamlanma oranı (all-time) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Genel Tamamlanma</Text>
            <Text style={styles.cardSub}>{stats.global.allTime} toplam</Text>
          </View>
          <ProgressBar
            label="Tüm zamanlar"
            value={stats.global.allTimeCompletionPct}
            rightText={`%${stats.global.allTimeCompletionPct}`}
            fillColor={colors.success}
          />
          <View style={{ height: spacing.md }} />
          <View style={styles.globalStats}>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>{stats.global.allTimeDone}</Text>
              <Text style={styles.globalStatLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>{stats.global.allTimePending}</Text>
              <Text style={styles.globalStatLabel}>Bekleyen</Text>
            </View>
          </View>
        </View>

        {/* Top 5 cari */}
        {stats.topContacts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>En Aktif Cariler</Text>
              <Text style={styles.cardSub}>son 30 gün</Text>
            </View>
            {stats.topContacts.map((c) => {
              const maxTotal = Math.max(stats.topContacts[0].totalCount, 1)
              const widthPct = (c.totalCount / maxTotal) * 100
              const avatarColor = getAvatarColor(c.company)
              return (
                <View key={c.contactId} style={styles.contactRow}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>
                      {c.company.charAt(0).toLocaleUpperCase('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName} numberOfLines={1}>{c.company}</Text>
                    <View style={styles.contactBarTrack}>
                      <View
                        style={[
                          styles.contactBarFill,
                          { width: `${widthPct}%`, backgroundColor: avatarColor },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.contactCount}>{c.totalCount}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Uyuyan cariler */}
        {stats.dormantContacts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.rowCenter}>
                <Ionicons name="moon-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.cardTitle, { marginLeft: 6 }]}>Temas Bekliyor</Text>
              </View>
              <Text style={styles.cardSub}>30+ gün</Text>
            </View>
            {stats.dormantContacts.map((c) => {
              const daysSince = c.lastActivityAt
                ? Math.floor(
                    (Date.now() - new Date(c.lastActivityAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0
              const avatarColor = getAvatarColor(c.company)
              return (
                <View key={c.contactId} style={styles.dormantRow}>
                  <View style={[styles.avatarSmall, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarTextSmall}>
                      {c.company.charAt(0).toLocaleUpperCase('tr-TR')}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName} numberOfLines={1}>{c.company}</Text>
                    <Text style={styles.dormantSub}>{daysSince} gündür hareket yok</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Bugünün kompakt listesi */}
        {todayReminders.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bugün Sırada</Text>
              <Text style={styles.cardSub}>{todayReminders.length} bekleyen</Text>
            </View>
            {todayReminders.map(renderTodayRow)}
          </View>
        )}

        {/* Boş durum — hiç reminder yoksa bilgilendirme */}
        {reminders.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Hoş geldin!</Text>
            <Text style={styles.emptyText}>
              Sağ alttaki mikrofon butonuna basılı tutarak ilk hatırlatıcını ekle.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Mikrofon FAB — sağ alt */}
      <View style={styles.fab} pointerEvents="box-none">
        <MicButton
          state={displayState}
          durationMs={durationMs}
          onLongPress={startRecording}
          onPressOut={handlePressOut}
        />
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
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 180, // FAB ve alt tab için alan
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  // Metric grid
  metricGrid: {
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
  },
  // Kart
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  // Genel stats
  globalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  globalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  globalStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  globalStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  // Top contacts
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  contactBarTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  contactBarFill: {
    height: 6,
    borderRadius: radius.full,
  },
  contactCount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    minWidth: 24,
    textAlign: 'right',
  },
  // Dormant
  dormantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  dormantSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  // Today rows
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  timeChip: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  todayContent: {
    flex: 1,
  },
  todayTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  todayContact: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Empty card
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
})
