// src/components/MicButton.tsx
// Premium mikrofon butonu — gradient (purple→orange sunset) + glow pulse + süre

import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, fontWeight, shadow, gradients } from '../utils/theme'
import type { RecordingState } from '../hooks/useRecording'

type Props = {
  state: RecordingState
  durationMs: number
  onLongPress: () => void
  onPressOut: () => void
  /** Dark bg üstünde ise state text ve hint beyaz görünür */
  onDark?: boolean
  /** Tab bar slot'u için kompakt mod — state text ve hint gizli, sadece buton + glow */
  compact?: boolean
}

export default function MicButton({ state, durationMs, onLongPress, onPressOut, onDark = true, compact = false }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    if (state === 'recording') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      )
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        ])
      )
      pulseLoop.start()
      glowLoop.start()
      return () => { pulseLoop.stop(); glowLoop.stop() }
    } else {
      pulseAnim.setValue(1)
      glowAnim.setValue(0.35)
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

  const gradientColors = isRecording
    ? gradients.micRecording
    : gradients.mic

  const stateTextColor = onDark ? colors.textOnDark : colors.text
  const hintColor = onDark ? colors.textOnDarkMuted : colors.textMuted

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Durum metni — compact modda gizli */}
      {!compact && (
        <Text style={[styles.stateText, { color: stateTextColor }, isRecording && styles.stateTextRecording]}>
          {isRecording
            ? 'Dinliyorum...'
            : isProcessing
            ? 'İşleniyor...'
            : 'Basılı tut ve konuş'}
        </Text>
      )}

      {/* Süre — compact modda küçük badge olarak gösterilir */}
      {isRecording && !compact && (
        <Text style={styles.duration}>{formatDuration(durationMs)}</Text>
      )}
      {isRecording && compact && (
        <View style={styles.compactDurationPill}>
          <Text style={styles.compactDurationText}>{formatDuration(durationMs)}</Text>
        </View>
      )}

      {isProcessing && !compact && (
        <Text style={[styles.processingDots, { color: hintColor }]}>●  ●  ●</Text>
      )}

      {/* Glow ring — gradient'in ışıltısı */}
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

      {/* Buton — gradient sunset */}
      <Animated.View style={[styles.buttonWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Pressable
          onLongPress={onLongPress}
          onPressOut={onPressOut}
          delayLongPress={300}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.buttonBase,
            pressed && !isRecording && !isProcessing && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={gradientColors as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.ringInner}>
              <Ionicons
                name={isRecording ? 'mic' : isProcessing ? 'hourglass-outline' : 'mic'}
                size={36}
                color={colors.white}
              />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* İpucu — compact modda gizli */}
      {!isRecording && !isProcessing && !compact && (
        <Text style={[styles.hint, { color: hintColor }]}>En az 1 saniye kayıt yapın</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  containerCompact: {
    gap: 0,
  },
  compactDurationPill: {
    position: 'absolute',
    top: -28,
    backgroundColor: '#FF6A88',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 10,
  },
  compactDurationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.4,
  },
  stateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
  },
  stateTextRecording: {
    color: '#FF6A88',
  },
  duration: {
    fontSize: 36,
    fontWeight: fontWeight.heavy,
    color: '#FF6A88',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  processingDots: {
    fontSize: fontSize.xl,
    letterSpacing: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: '50%',
    marginTop: -15,
  },
  buttonWrap: {
    ...shadow.glow('#7B61FF'),
  },
  buttonBase: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  gradient: {
    flex: 1,
    borderRadius: 48,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  hint: {
    fontSize: fontSize.sm,
    letterSpacing: -0.2,
  },
})
