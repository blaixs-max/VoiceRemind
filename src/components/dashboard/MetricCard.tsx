// src/components/dashboard/MetricCard.tsx
// Dashboard 4'lü grid için metric card — ikon + label + değer + alt metin

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../../utils/theme'

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string | number
  subValue?: string
  accentColor?: string
  accentBg?: string
  onPress?: () => void
}

export default function MetricCard({
  icon,
  label,
  value,
  subValue,
  accentColor = colors.primary,
  accentBg = colors.primaryBg,
  onPress,
}: MetricCardProps) {
  const Container: any = onPress ? TouchableOpacity : View
  const containerProps = onPress ? { activeOpacity: 0.8, onPress } : {}

  return (
    <Container style={styles.card} {...containerProps}>
      <View style={[styles.iconWrap, { backgroundColor: accentBg }]}>
        <Ionicons name={icon} size={18} color={accentColor} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      {subValue ? (
        <Text style={styles.sub} numberOfLines={1}>
          {subValue}
        </Text>
      ) : null}
    </Container>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 110,
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
})
