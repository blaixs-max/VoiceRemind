// src/components/ReminderActionSheet.tsx
// Uygulama içi bottom-sheet menüsü — uzun basınca açılır,
// Düzenle / Tamamla (veya Geri Al) / Sil seçeneklerini sunar.
// Native ActionSheetIOS / Alert.alert yerine kullanılır.

import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Reminder } from '../models/types'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'

type Props = {
  /** Hedef reminder. null ise modal kapalıdır. */
  reminder: Reminder | null
  onClose: () => void
  onEdit: (r: Reminder) => void
  onToggleStatus: (r: Reminder) => void
  onDelete: (r: Reminder) => void
}

export default function ReminderActionSheet({
  reminder,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  const visible = reminder !== null

  // Seçim yapıldığında önce parent callback, sonra kapat — parent
  // state güncellemesiyle modal zaten kapanacak ama iki kere setState
  // tetikleme riski olmaması için her iki yol da çalışsın.
  const handleEdit = () => {
    if (!reminder) return
    onClose()
    onEdit(reminder)
  }
  const handleToggle = () => {
    if (!reminder) return
    onClose()
    onToggleStatus(reminder)
  }
  const handleDelete = () => {
    if (!reminder) return
    onClose()
    onDelete(reminder)
  }

  const toggleLabel = reminder?.status === 'pending' ? 'Tamamla' : 'Geri Al'
  const toggleIcon = reminder?.status === 'pending'
    ? 'checkmark-circle-outline'
    : 'arrow-undo-outline'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop — boşluğa tıklayınca kapat */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          {/* İçeriği tıklama geçmesin — stopPropagation */}
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Başlık satırı: reminder adı + X kapama butonu */}
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                  {reminder?.title ?? ''}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.closeBtn}
                  accessibilityLabel="Kapat"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Aksiyon satırları */}
              <ActionRow
                icon="create-outline"
                label="Düzenle"
                color={colors.primary}
                onPress={handleEdit}
              />
              <ActionRow
                icon={toggleIcon}
                label={toggleLabel}
                color={colors.success}
                onPress={handleToggle}
              />
              <ActionRow
                icon="trash-outline"
                label="Sil"
                color={colors.danger}
                destructive
                onPress={handleDelete}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

type ActionRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  color: string
  destructive?: boolean
  onPress: () => void
}

function ActionRow({ icon, label, color, destructive, onPress }: ActionRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[
        styles.rowLabel,
        destructive && { color: colors.danger },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    // iOS home indicator alanı için biraz ekstra alt boşluk
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl + 8 : spacing.lg,
    ...shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
})
