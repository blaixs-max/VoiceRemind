// src/hooks/useRecording.ts
// expo-av ile ses kaydı yönetimi
// Bas-tut-bırak akışını destekler. Min 1sn kontrolü yapar.

import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import { RECORDING_CONFIG } from '../utils/config'

export type RecordingState = 'idle' | 'recording' | 'processing'

type UseRecordingReturn = {
  state: RecordingState
  durationMs: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null> // uri veya null (çok kısa)
  reset: () => void
}

export function useRecording(): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [durationMs, setDurationMs] = useState(0)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Race guard: startRecording henüz async kurulum (permission/prepare) yaparken
  // kullanıcı basışı bırakırsa stopRecording bunu true yapar. Her await'ten sonra
  // kontrol ederek hayalet kayıt başlamasını engelleriz.
  const cancelStartRef = useRef(false)

  const startRecording = useCallback(async () => {
    cancelStartRef.current = false
    try {
      // izin kontrolü
      const permission = await Audio.requestPermissionsAsync()
      if (cancelStartRef.current) return
      if (!permission.granted) {
        throw new Error('Mikrofon izni gerekli')
      }

      // ses modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })
      if (cancelStartRef.current) {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {})
        return
      }

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: RECORDING_CONFIG.extension,
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: RECORDING_CONFIG.sampleRate,
          numberOfChannels: RECORDING_CONFIG.numberOfChannels,
          bitRate: RECORDING_CONFIG.bitRate,
        },
        ios: {
          extension: RECORDING_CONFIG.extension,
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: RECORDING_CONFIG.sampleRate,
          numberOfChannels: RECORDING_CONFIG.numberOfChannels,
          bitRate: RECORDING_CONFIG.bitRate,
        },
        web: {},
      })
      if (cancelStartRef.current) {
        // Kullanıcı bırakmış; hazırlanan recording'i kaldır
        await recording.stopAndUnloadAsync().catch(() => {})
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {})
        return
      }

      await recording.startAsync()
      if (cancelStartRef.current) {
        await recording.stopAndUnloadAsync().catch(() => {})
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {})
        return
      }
      recordingRef.current = recording
      startTimeRef.current = Date.now()
      setState('recording')
      setDurationMs(0)

      // süre sayacı
      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current)
      }, 100)
    } catch (err) {
      console.error('Recording start error:', err)
      setState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Kullanıcı hızlı bıraktıysa startRecording hala async kurulum içinde olabilir.
    // Flag'i true yapınca oradaki her await-kontrolü temizlik yapıp erken döner.
    cancelStartRef.current = true

    // timer temizle
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const recording = recordingRef.current
    if (!recording) {
      setState('idle')
      return null
    }

    try {
      setState('processing')
      await recording.stopAndUnloadAsync()

      // ses modunu geri al
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })

      const elapsed = Date.now() - startTimeRef.current

      // min süre kontrolü
      if (elapsed < RECORDING_CONFIG.minDurationMs) {
        recordingRef.current = null
        setState('idle')
        return null // çok kısa — reddedildi
      }

      const uri = recording.getURI()
      recordingRef.current = null
      setDurationMs(elapsed)
      setState('idle')

      return uri ?? null
    } catch (err) {
      console.error('Recording stop error:', err)
      recordingRef.current = null
      setState('idle')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    recordingRef.current = null
    setState('idle')
    setDurationMs(0)
  }, [])

  return { state, durationMs, startRecording, stopRecording, reset }
}
