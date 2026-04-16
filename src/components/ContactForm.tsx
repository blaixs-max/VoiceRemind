// src/components/ContactForm.tsx
// Premium cari form — add/edit

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { useContactStore } from '../stores/contactStore'
import { dialog } from './AppDialog'
import { colors, fontSize, fontWeight, spacing, radius, shadow } from '../utils/theme'
import type { ContactsStackParamList } from '../navigation/types'

type FormNav = NativeStackNavigationProp<ContactsStackParamList, 'ContactForm'>
type FormRoute = RouteProp<ContactsStackParamList, 'ContactForm'>

type FieldConfig = {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  placeholder: string
  required?: boolean
  keyboard?: 'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'words'
  multiline?: boolean
}

const FIELDS: FieldConfig[] = [
  { key: 'company', label: 'Firma', icon: 'business-outline', placeholder: 'Acme Lojistik', required: true, autoCapitalize: 'words' },
  { key: 'contactName', label: 'Yetkili Adı', icon: 'person-outline', placeholder: 'Mehmet Kaya', required: true, autoCapitalize: 'words' },
  { key: 'email', label: 'E-posta', icon: 'mail-outline', placeholder: 'mehmet@acme.com', keyboard: 'email-address', autoCapitalize: 'none' },
  { key: 'phone', label: 'Telefon', icon: 'call-outline', placeholder: '0532 123 45 67', keyboard: 'phone-pad' },
  { key: 'notes', label: 'Notlar', icon: 'document-text-outline', placeholder: 'Ek notlar...', multiline: true },
]

export default function ContactFormScreen() {
  const navigation = useNavigation<FormNav>()
  const route = useRoute<FormRoute>()
  const editId = route.params?.contactId

  const addContact = useContactStore((s) => s.addContact)
  const updateContact = useContactStore((s) => s.updateContact)
  const getContact = useContactStore((s) => s.getContact)
  const existing = editId ? getContact(editId) : undefined

  const [form, setForm] = useState({
    company: existing?.company ?? '',
    contactName: existing?.contactName ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    notes: existing?.notes ?? '',
  })

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Cariyi Düzenle' : 'Yeni Cari' })
  }, [editId, navigation])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.company.trim()) {
      return dialog.alert({
        title: 'Hata',
        message: 'Firma adı zorunludur.',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    }
    if (!form.contactName.trim()) {
      return dialog.alert({
        title: 'Hata',
        message: 'Yetkili adı zorunludur.',
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    }

    const data = {
      company: form.company.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    }

    setSaving(true)
    try {
      if (editId) await updateContact(editId, data)
      else await addContact(data)
      navigation.goBack()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kaydetme başarısız.'
      dialog.alert({
        title: 'Hata',
        message,
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name={field.icon} size={16} color={colors.textMuted} />
                <Text style={styles.label}>
                  {field.label}{field.required ? ' *' : ''}
                </Text>
              </View>
              <TextInput
                style={[styles.input, field.multiline && styles.inputMultiline]}
                value={(form as any)[field.key]}
                onChangeText={(v) => updateField(field.key, v)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.keyboard ?? 'default'}
                autoCapitalize={field.autoCapitalize ?? 'sentences'}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Ionicons name={editId ? 'checkmark-circle' : 'add-circle'} size={20} color={colors.textInverse} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Kaydediliyor...' : editId ? 'Güncelle' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
    ...shadow.glow(colors.primary),
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
})
