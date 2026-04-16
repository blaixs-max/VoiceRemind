// src/components/ConfidenceIndicator.tsx

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CONFIDENCE } from '../utils/config'
import { colors, fontSize, fontWeight, radius } from '../utils/theme'

type Props = { confidence: number }

export default function ConfidenceIndicator({ confidence }: Props) {
  const config = confidence >= CONFIDENCE.HIGH
    ? { color: colors.success, bg: colors.successBg, label: 'Yüksek' }
    : confidence >= CONFIDENCE.MEDIUM
    ? { color: colors.warning, bg: colors.warningBg, label: 'Orta' }
    : { color: colors.danger, bg: colors.dangerBg, label: 'Düşük' }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.label} {Math.round(confidence * 100)}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
})
