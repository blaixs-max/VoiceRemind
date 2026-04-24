// src/components/CustomTabBar.tsx
// Custom bottom tab bar — rounded top corners + ortada floating mic FAB
// Mic state artık tab bar'a ait (tüm tab'lardan erişilebilir)

import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MicButton from './MicButton'
import ConfirmationModal from './ConfirmationModal'
import { dialog } from './AppDialog'
import { useRecording } from '../hooks/useRecording'
import { useParseAudio } from '../hooks/useParseAudio'
import { colors, fontSize, fontWeight } from '../utils/theme'

// Tab ismi → icon eşlemesi (inactive/active state aynı isim, renk ile ayrılıyor)
const iconFor = (routeName: string): keyof typeof Ionicons.glyphMap => {
  switch (routeName) {
    case 'Panel':
      return 'grid-outline'
    case 'Hatırlatıcılar':
      return 'notifications-outline'
    case 'Cariler':
      return 'people-outline'
    default:
      return 'ellipse-outline'
  }
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  // Mic state — global (her tab'dan tek kaynak)
  const { state: recState, durationMs, startRecording, stopRecording } = useRecording()
  const { parseState, response, error, parseAudio, reset } = useParseAudio()
  const [modalVisible, setModalVisible] = useState(false)

  const displayState =
    recState === 'recording'
      ? ('recording' as const)
      : parseState === 'sending'
      ? ('processing' as const)
      : ('idle' as const)

  const handlePressOut = async () => {
    if (recState !== 'recording') return
    const uri = await stopRecording()
    if (!uri) return

    const result = await parseAudio(uri)
    if (result && result.reminders.length > 0) {
      setModalVisible(true)
    } else if (result && result.reminders.length === 0) {
      dialog.alert({
        title: 'Sonuç yok',
        message: 'Ses kaydından hatırlatıcı çıkarılamadı. Tekrar deneyin.',
        icon: 'information-circle-outline',
        iconColor: colors.warning,
      })
      reset()
    }
  }

  useEffect(() => {
    if (error) {
      dialog.alert({
        title: 'Hata',
        message: error,
        icon: 'alert-circle-outline',
        iconColor: colors.danger,
        buttons: [{ text: 'Tamam', onPress: reset }],
      })
    }
  }, [error, reset])

  const handleModalClose = () => {
    setModalVisible(false)
    reset()
  }

  return (
    <>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name
          const isFocused = state.index === index
          const iconName = iconFor(route.name)
          const color = isFocused ? colors.primaryLight : colors.textOnDarkMuted

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key })
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Ionicons name={iconName} size={22} color={color} />
              <Text style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
          )
        })}

        {/* Floating mic — ortada, tab bar'ın üstüne çıkıyor */}
        <View style={styles.micWrap} pointerEvents="box-none">
          <MicButton
            state={displayState}
            durationMs={durationMs}
            onLongPress={startRecording}
            onPressOut={handlePressOut}
            compact
          />
        </View>
      </View>

      <ConfirmationModal
        visible={modalVisible}
        data={response}
        onClose={handleModalClose}
      />
    </>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 52, // ÜST kısım floating mic için rezerve — tab butonları alta itilir
    // Gölge — yukarı doğru drop shadow
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 16,
    elevation: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end', // icon + label bar'ın ALT kısmına hizalanır
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.1,
  },
  // Mic floating wrapper — bar'ın üst kenarında, ~%65 yukarıda %35 bar içinde
  micWrap: {
    position: 'absolute',
    top: -60, // daha yukarı taşıdım: buton 96px'in ~%63'ü bar dışında kalır
    left: 0,
    right: 0,
    alignItems: 'center',
  },
})
