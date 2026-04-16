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
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useContactStore } from '../stores/contactStore'
import { colors, fontSize, fontWeight, spacing, radius, shadow, getAvatarColor } from '../utils/theme'
import type { Contact } from '../models/types'
import type { ContactsStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<ContactsStackParamList, 'ContactList'>

export default function ContactsScreen() {
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
    Alert.alert(
      'Cariyi Sil',
      `${contact.company} — ${contact.contactName} silinecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteContact(contact.id) },
      ]
    )
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
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Firma veya yetkili ara..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
          </View>
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContactForm', {})}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.sm,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow(colors.primary),
  },
})
