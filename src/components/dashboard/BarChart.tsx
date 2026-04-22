// src/components/dashboard/BarChart.tsx
// Haftalık dikey bar chart — saf View, stacked (done yeşil + pending indigo)

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontSize, fontWeight, spacing, radius } from '../../utils/theme'
import type { DailyBar } from '../../utils/dashboardStats'

type BarChartProps = {
  data: DailyBar[]
  maxHeight?: number
}

export default function BarChart({ data, maxHeight = 100 }: BarChartProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <View style={styles.container}>
      {/* Bar alanı */}
      <View style={[styles.barsRow, { height: maxHeight + 24 }]}>
        {data.map((d) => {
          const ratio = d.total / maxTotal
          const totalH = ratio * maxHeight
          const doneH = d.total === 0 ? 0 : (d.done / d.total) * totalH
          const pendingH = totalH - doneH
          const emptyBar = d.total === 0

          return (
            <View key={d.key} style={styles.barCol}>
              {/* Sayı üstte */}
              <Text
                style={[
                  styles.count,
                  d.isToday && styles.countToday,
                  emptyBar && styles.countEmpty,
                ]}
              >
                {d.total === 0 ? '' : d.total}
              </Text>

              {/* Stacked bar */}
              <View style={styles.barTrack}>
                {emptyBar ? (
                  <View style={styles.emptyDot} />
                ) : (
                  <View style={[styles.barStack, { height: totalH }]}>
                    {pendingH > 0 && (
                      <View
                        style={[
                          styles.segPending,
                          {
                            height: pendingH,
                            backgroundColor: d.isToday ? colors.primary : colors.primaryLight,
                          },
                        ]}
                      />
                    )}
                    {doneH > 0 && (
                      <View
                        style={[
                          styles.segDone,
                          {
                            height: doneH,
                            // Eğer pending yoksa üst köşeler de yuvarlak olsun
                            borderTopLeftRadius: pendingH > 0 ? 0 : radius.sm,
                            borderTopRightRadius: pendingH > 0 ? 0 : radius.sm,
                          },
                        ]}
                      />
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        })}
      </View>

      {/* Gün etiketleri */}
      <View style={styles.labelsRow}>
        {data.map((d) => (
          <View key={d.key} style={styles.labelCol}>
            <Text
              style={[
                styles.label,
                d.isToday && styles.labelToday,
              ]}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Tamamlandı</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryLight }]} />
          <Text style={styles.legendText}>Bekliyor</Text>
        </View>
      </View>
    </View>
  )
}

const BAR_WIDTH = 22

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
    minHeight: 14,
  },
  countToday: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  countEmpty: {
    // Yer tutucu — yükseklik stabil kalsın
  },
  barTrack: {
    width: BAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barStack: {
    width: BAR_WIDTH,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  segPending: {
    width: '100%',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  segDone: {
    width: '100%',
    backgroundColor: colors.success,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    marginBottom: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  labelCol: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  labelToday: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
})
