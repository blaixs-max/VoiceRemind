// src/hooks/useParseAudio.ts
// Ses dosyasını Edge Function'a gönderir, parse sonucunu döner.

import { useState, useCallback } from 'react'
import { sendAudioForParsing } from '../utils/api'
import { useContactStore } from '../stores/contactStore'
import { DEFAULT_TIMEZONE } from '../utils/config'
import type { EdgeFunctionResponse } from '../models/types'

type ParseState = 'idle' | 'sending' | 'done' | 'error'

type UseParseAudioReturn = {
  parseState: ParseState
  response: EdgeFunctionResponse | null
  error: string | null
  parseAudio: (uri: string) => Promise<EdgeFunctionResponse | null>
  reset: () => void
}

export function useParseAudio(): UseParseAudioReturn {
  const [parseState, setParseState] = useState<ParseState>('idle')
  const [response, setResponse] = useState<EdgeFunctionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const filterByTranscript = useContactStore((s) => s.filterByTranscript)
  const getSummaries = useContactStore((s) => s.getSummaries)

  const parseAudio = useCallback(async (uri: string): Promise<EdgeFunctionResponse | null> => {
    setParseState('sending')
    setError(null)
    setResponse(null)

    try {
      // tüm carileri gönder — pre-filter Edge Function'da da yapılacak
      // ama client'ta da yapıyoruz ki gereksiz data göndermeyelim
      const contacts = getSummaries()

      const result = await sendAudioForParsing(uri, contacts, DEFAULT_TIMEZONE)

      setResponse(result)
      setParseState('done')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bağlantı hatası'
      setError(message)
      setParseState('error')
      return null
    }
  }, [getSummaries])

  const reset = useCallback(() => {
    setParseState('idle')
    setResponse(null)
    setError(null)
  }, [])

  return { parseState, response, error, parseAudio, reset }
}
