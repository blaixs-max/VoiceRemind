// src/screens/ContactDetailScreen.tsx
// Premium cari detay — profil kartı + aksiyon butonları + reminder listesi

import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useContactStore } from '../stores/contactStore'
import { useReminderStore } from '../stores/reminderStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow, getAvatarColor } from '../utils/theme'
import type { Reminder } from '../models/types'
import type { ContactsStackParamList } from '../navigation/types'

type DetailNav = NativeStackNavigationProp<ContactsStackParamList, 'ContactDetail'>
type DetailRoute = RouteProp<ContactsStackParamList, 'ContactDetail'>

export default function ContactDetailScreen() {
  const navigation = useNavigation<DetailNav>()
  const route = useRoute<DetailRoute>()
  const { contactId } = route.params

  const contact = useContactStore((s) => s.getContact(contactId))
  const deleteContact = useContactStore((s) => s.deleteContact)
  const relatedReminders = useReminderStore((s) => s.getByContact(contactId))

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cari bulunamadı</Text>
      </View>
    )
  }

  const avatarColor = getAvatarColor(contact.contactName)

  const handleDelete = () => {
    dialog.confirm({
      title: 'Cariyi Sil',
      message: `${contact.company} silinecek. Bu işlem geri alınamaz.`,
      destructive: true,
      confirmText: 'Sil',
      onConfirm: () => { deleteContact(contact.id); navigation.goBack() },
    })
  }

  const actions = [
    contact.phone && {
      icon: 'call-outline' as const,
      label: 'Ara',
      color: colors.success,
      onPress: () => Linking.openURL(`tel:${contact.phone}`),
    },
    contact.email && {
      icon: 'mail-outline' as const,
      label: 'E-posta',
      color: colors.primary,
      onPress: () => Linking.openURL(`mailto:${contact.email}`),
    },
    {
      icon: 'create-outline' as const,
      label: 'Düzenle',
      color: colors.accent,
      onPress: () => navigation.navigate('ContactForm', { contactId: contact.id }),
    },
    {
      icon: 'trash-outline' as const,
      label: 'Sil',
      color: colors.danger,
      onPress: handleDelete,
    },
  ].filter(Boolean) as Array<{ icon: any; label: string; color: string; onPress: () => void }>

  const renderReminder = ({ item }: { item: Reminder }) => {
    const date = new Date(item.datetime)
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
    const isDone = item.status !== 'pending'

    return (
      <View style={[styles.reminderCard, isDone && styles.reminderDone]}>
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'time-outline'}
          size={20}
          color={isDone ? colors.success : colors.primary}
        />
        <View style={styles.reminderInfo}>
          <Text style={[styles.reminderTitle, isDone && styles.textDone]}>{item.title}</Text>
          <Text style={styles.reminderDate}>{dateStr}</Text>
        </View>
      </View>
    )
  }

  const header = (
    <>
      {/* Profil */}
      <View style={styles.profileCard}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarLargeText}>
            {contact.contactName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.companyName}>{contact.company}</Text>
        <Text style={styles.contactName}>{contact.contactName}</Text>

        {/* Aksiyonlar */}
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionBtn} onPress={a.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Detaylar */}
      <View style={styles.detailCard}>
        {contact.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
            <View>
              <Text style={styles.detailLabel}>Telefon</Text>
              <Text style={styles.detailValue}>{contact.phone}</Text>
            </View>
          </View>
        )}
        {contact.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <View>
              <Text style={styles.detailLabel}>E-posta</Text>
              <Text style={styles.detailValue}>{contact.email}</Text>
            </View>
          </View>
        )}
        {contact.notes && (
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
            <View>
              <Text style={styles.detailLabel}>Notlar</Text>
              <Text style={styles.detailValue}>{contact.notes}</Text>
            </View>
          </View>
        )}
        {!contact.phone && !contact.email && !contact.notes && (
          <Text style={styles.noDetail}>Ek bilgi girilmemiş</Text>
        )}
      </View>

      {/* Hatırlatıcılar başlık */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hatırlatıcılar</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{relatedReminders.length}</Text>
        </View>
      </View>
    </>
  )

  return (
    <FlatList
      style={styles.container}
      data={relatedReminders}
      keyExtractor={(item) => item.id}
      renderItem={renderReminder}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Bu cariyle ilişkili hatırlatıcı yok</Text>
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingBottom: 40,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.sm,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    color: colors.textInverse,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  companyName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  contactName: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  detailCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  noDetail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  reminderDone: {
    opacity: 0.5,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  reminderDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
})
