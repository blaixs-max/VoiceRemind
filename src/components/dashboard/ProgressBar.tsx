// src/components/dashboard/ProgressBar.tsx
// Horizontal progress bar — basit ama etkili görsel oran göstergesi

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, fontSize, fontWeight, radius } from '../../utils/theme'

type ProgressBarProps = {
  label?: string
  value: number // 0-100
  rightText?: string
  height?: number
  fillColor?: string
  trackColor?: string
}

export default function ProgressBar({
  label,
  value,
  rightText,
  height = 8,
  fillColor = colors.primary,
  trackColor = colors.borderLight,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))

  return (
    <View style={styles.wrap}>
      {(label || rightText) && (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  rightText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  track: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.full,
  },
})
