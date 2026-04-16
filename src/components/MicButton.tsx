// src/components/MicButton.tsx
// Premium mikrofon butonu — gradient ring + glow pulse + süre

import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, fontWeight, shadow } from '../utils/theme'
import type { RecordingState } from '../hooks/useRecording'

type Props = {
  state: RecordingState
  durationMs: number
  onLongPress: () => void
  onPressOut: () => void
}

export default function MicButton({ state, durationMs, onLongPress, onPressOut }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    if (state === 'recording') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      pulseLoop.start()
      glowLoop.start()
      return () => { pulseLoop.stop(); glowLoop.stop() }
    } else {
      pulseAnim.setValue(1)
      glowAnim.setValue(0.3)
    }
  }, [state, pulseAnim, glowAnim])

  const formatDuration = (ms: number): string => {
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const remainSecs = secs % 60
    return `${mins}:${remainSecs.toString().padStart(2, '0')}`
  }

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <View style={styles.container}>
      {/* Durum metni */}
      <Text style={[styles.stateText, isRecording && styles.stateTextRecording]}>
        {isRecording
          ? 'Dinliyorum...'
          : isProcessing
          ? 'İşleniyor...'
          : 'Basılı tut ve konuş'}
      </Text>

      {/* Süre */}
      {isRecording && (
        <Text style={styles.duration}>{formatDuration(durationMs)}</Text>
      )}

      {isProcessing && (
        <Text style={styles.processingDots}>●  ●  ●</Text>
      )}

      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glowAnim,
            backgroundColor: isRecording ? colors.micRecordingGlow : colors.micGlow,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Buton */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onLongPress={onLongPress}
          onPressOut={onPressOut}
          delayLongPress={300}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.button,
            isRecording && styles.buttonRecording,
            isProcessing && styles.buttonProcessing,
            pressed && !isRecording && !isProcessing && styles.buttonPressed,
          ]}
        >
          <View style={[
            styles.buttonInner,
            isRecording && styles.buttonInnerRecording,
            isProcessing && styles.buttonInnerProcessing,
          ]}>
            <Ionicons
              name={isRecording ? 'mic' : isProcessing ? 'hourglass-outline' : 'mic-outline'}
              size={36}
              color={colors.textInverse}
            />
          </View>
        </Pressable>
      </Animated.View>

      {/* İpucu */}
      {!isRecording && !isProcessing && (
        <Text style={styles.hint}>En az 1 saniye kayıt yapın</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  stateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  stateTextRecording: {
    color: colors.danger,
  },
  duration: {
    fontSize: 36,
    fontWeight: fontWeight.heavy,
    color: colors.danger,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  processingDots: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    letterSpacing: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: '50%',
    marginTop: -10,
  },
  button: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: colors.primary,
    ...shadow.glow(colors.primary),
  },
  buttonRecording: {
    backgroundColor: colors.danger,
    ...shadow.glow(colors.danger),
  },
  buttonProcessing: {
    backgroundColor: colors.textMuted,
    ...shadow.glow(colors.textMuted),
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonInner: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  buttonInnerRecording: {
    backgroundColor: colors.danger,
  },
  buttonInnerProcessing: {
    backgroundColor: colors.textMuted,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: -0.2,
  },
})
