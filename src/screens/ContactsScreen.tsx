// src/screens/ContactsScreen.tsx
// Modern cari listesi — avatar renkleri + arama + FAB

import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useContactStore } from '../stores/contactStore'
import { dialog } from '../components/AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow, gradients, getAvatarColor } from '../utils/theme'
import type { Contact } from '../models/types'
import type { ContactsStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<ContactsStackParamList, 'ContactList'>

export default function ContactsScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const contacts = useContactStore((s) => s.contacts)
  const deleteContact = useContactStore((s) => s.deleteContact)
  const navigation = useNavigation<Nav>()

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const handleDelete = useCallback((contact: Contact) => {
    dialog.confirm({
      title: 'Cariyi Sil',
      message: `${contact.company} — ${contact.contactName} silinecek. Bu işlem geri alınamaz.`,
      destructive: true,
      confirmText: 'Sil',
      onConfirm: () => { deleteContact(contact.id) },
    })
  }, [deleteContact])

  const renderItem = useCallback(({ item }: { item: Contact }) => {
    const avatarColor = getAvatarColor(item.contactName)
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>
            {item.contactName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
          <Text style={styles.contactName} numberOfLines={1}>{item.contactName}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    )
  }, [navigation, handleDelete])

  return (
    <View style={styles.container}>
      {/* Arama */}
      <View style={[styles.searchWrapper, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textOnDarkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Firma veya yetkili ara..."
            placeholderTextColor={colors.textOnDarkMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textOnDarkMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sayaç */}
      <View style={styles.countRow}>
        <Text style={styles.countLabel}>
          {filtered.length} cari {search ? '(filtrelenmiş)' : ''}
        </Text>
      </View>

      {/* Liste */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <LinearGradient
            colors={gradients.mic as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="people-outline" size={36} color={colors.white} />
          </LinearGradient>
          <Text style={styles.emptyText}>
            {contacts.length === 0 ? 'Henüz cari eklenmemiş' : 'Sonuç bulunamadı'}
          </Text>
          {contacts.length === 0 && (
            <Text style={styles.emptyHint}>+ butonuna basarak ilk carinizi ekleyin</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — gradient sunset */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContactForm', {})}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={gradients.mic as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchWrapper: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    height: 44,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textOnDark,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.textOnDarkMuted,
    fontWeight: fontWeight.medium,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  cardInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  contactName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.glow('#7B61FF'),
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnDark,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 92, // tab bar üstünde
    width: 60,
    height: 60,
    borderRadius: 30,
    ...shadow.glow('#7B61FF'),
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
