import { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * Audio descriptions via the browser's speech synthesis — no audio
 * files to ship, and it reads whatever text we hand it, so narration
 * stays in sync with the compendium automatically.
 * ------------------------------------------------------------------ */

const CHUNK_LIMIT = 220

/** Chrome truncates long utterances, so text is split on sentence ends. */
function chunkText(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?—])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > CHUNK_LIMIT && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = `${current} ${sentence}`
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/**
 * Chrome reports an empty voice list until it has finished loading them,
 * which on a cold page lands a little after the page becomes usable. An
 * utterance queued in that window is dropped without a sound — which is why
 * it is reliably the *first* narration of a session that goes missing and
 * every one after it that works. Wait for the list, then give up and let the
 * browser pick rather than leaving the visitor in silence.
 */
function whenVoicesReady(run: () => void) {
  if (window.speechSynthesis.getVoices().length > 0) {
    run()
    return
  }
  let settled = false
  const go = () => {
    if (settled) return
    settled = true
    window.speechSynthesis.removeEventListener('voiceschanged', go)
    window.clearTimeout(timer)
    run()
  }
  const timer = window.setTimeout(go, 1200)
  window.speechSynthesis.addEventListener('voiceschanged', go)
}

/**
 * Cancel, and cancel again a moment later.
 *
 * Chrome will sometimes start an utterance that was already queued when the
 * cancel arrived, which is how a voice ends up talking over a page the
 * visitor has already left. The second pass sweeps those up. It is guarded on
 * `wanted`, so it can never cut off something new that began in between.
 */
function hardCancel(wanted: { current: string | null }) {
  window.speechSynthesis.cancel()
  window.setTimeout(() => {
    if (wanted.current === null) window.speechSynthesis.cancel()
  }, 80)
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Prefer an Indian English voice — the vocabulary here is largely Sanskrit.
  return (
    voices.find((v) => v.lang === 'en-IN') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0]
  )
}

export interface Narrator {
  supported: boolean
  speaking: boolean
  /** Reads the text aloud, cancelling anything already in progress. */
  speak: (text: string) => void
  stop: () => void
  /** Speaks if idle, stops if this same text is already playing. */
  toggle: (text: string) => void
}

export function useNarrator(): Narrator {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const currentText = useRef<string | null>(null)
  const voices = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (!supported) return
    const load = () => {
      voices.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      // Clearing this is what stops an utterance that is still waiting on the
      // voice list from starting up after the page it belonged to has gone.
      currentText.current = null
      hardCancel(currentText)
    }
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    // Cleared first: it is what tells both the delayed sweep and any
    // utterance still waiting on the voice list that nobody wants this.
    currentText.current = null
    setSpeaking(false)
    hardCancel(currentText)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return
      window.speechSynthesis.cancel()
      currentText.current = text
      setSpeaking(true)

      whenVoicesReady(() => {
        // Something else may have been asked for, or the page left, while we
        // waited. currentText is the record of what is wanted now.
        if (currentText.current !== text) return
        voices.current = window.speechSynthesis.getVoices()
        const voice = pickVoice(voices.current)
        const chunks = chunkText(text)

        chunks.forEach((chunk, i) => {
          const utterance = new SpeechSynthesisUtterance(chunk)
          /* Only name a language we have a voice for. Asking for en-IN on a
           * machine with no Indian English installed is another way to get
           * silence, and the fallback voice already carries its own lang. */
          if (voice) {
            utterance.voice = voice
            utterance.lang = voice.lang
          }
          utterance.rate = 0.96
          utterance.pitch = 1
          if (i === chunks.length - 1) {
            utterance.onend = () => {
              currentText.current = null
              setSpeaking(false)
            }
            utterance.onerror = utterance.onend
          }
          window.speechSynthesis.speak(utterance)
        })
      })
    },
    [supported],
  )

  const toggle = useCallback(
    (text: string) => {
      if (speaking && currentText.current === text) stop()
      else speak(text)
    },
    [speaking, speak, stop],
  )

  return { supported, speaking, speak, stop, toggle }
}
