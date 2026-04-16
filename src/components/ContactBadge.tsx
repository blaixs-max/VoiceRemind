// src/components/ContactBadge.tsx

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, fontWeight, radius } from '../utils/theme'

type Props = {
  company: string
  contactName: string
  isNew?: boolean
}

export default function ContactBadge({ company, contactName, isNew }: Props) {
  return (
    <View style={[styles.badge, isNew && styles.badgeNew]}>
      <Ionicons
        name={isNew ? 'person-add-outline' : 'person-outline'}
        size={13}
        color={isNew ? colors.warning : colors.primary}
      />
      <Text style={[styles.text, isNew && styles.textNew]} numberOfLines={1}>
        {company} — {contactName}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeNew: { backgroundColor: colors.warningBg },
  text: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium, flexShrink: 1 },
  textNew: { color: colors.warning },
})
