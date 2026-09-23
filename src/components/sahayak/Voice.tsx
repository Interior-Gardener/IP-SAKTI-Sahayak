import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { synthesise, transcribe } from '../../lib/sahayak/client'
import { speakableText, useRecorder } from '../../lib/sahayak/voice'
import { useNarrator } from '../../lib/speech'
import { useSahayak } from '../../store/useSahayak'
import { Icon } from '../ui/Icon'
import { cx } from '../ui/primitives'

/* ------------------------------------------------------------------ *
 * Voice in the assistant: a mic beside the question box, and a Listen
 * button on each answer.
 *
 * The mic puts what it heard into the question box rather than sending it:
 * speech recognition mishears legal terms often enough that a person should
 * read the question before it is asked.
 * ------------------------------------------------------------------ */

export function MicButton({ language, onHeard }: { language: string; onHeard: (text: string) => void }) {
  const { t } = useTranslation()
  const sessionId = useSahayak((s) => s.sessionId)
  const recorder = useRecorder()
  const [note, setNote] = useState<string | null>(null)

  if (!recorder.supported) return null

  const toggle = async () => {
    setNote(null)
    if (recorder.state === 'idle') {
      try {
        await recorder.start()
      } catch {
        setNote('The microphone is blocked. Allow it in the browser to ask by voice.')
      }
      return
    }
    if (recorder.state !== 'recording') return
    const wav = await recorder.stop()
    if (!wav) return
    try {
      const heard = await transcribe(sessionId, wav, language)
      if (heard.text) onHeard(heard.text)
      else setNote('Nothing was heard. Try again, a little closer to the mic.')
    } catch {
      setNote('Voice input is unavailable right now. Type the question instead.')
    }
  }

  const recording = recorder.state === 'recording'
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={recorder.state === 'working'}
        aria-pressed={recording}
        aria-label={recording ? t('ask.micStop') : t('ask.mic')}
        title={recording ? t('ask.micStop') : t('ask.mic')}
        className={cx(
          'grid size-8 place-items-center rounded-full border transition-colors',
          recording ? 'animate-pulse border-transparent bg-rose-clay-500 text-white' : 'border-line text-ink-soft hover:text-ink',
          recorder.state === 'working' && 'opacity-60',
        )}
      >
        {recorder.state === 'working' ? <Icon name="seedling" size={15} className="animate-float" /> : <Icon name="mic" size={15} />}
      </button>
      {recording && (
        <span className="absolute -top-6 right-0 rounded-full bg-rose-clay-500 px-2 py-0.5 text-[0.66rem] font-semibold text-white tabular-nums">
          0:{String(recorder.seconds).padStart(2, '0')}
        </span>
      )}
      {note && (
        <p role="status" className="absolute right-0 bottom-10 w-60 rounded-xl border border-line bg-raised p-2 text-[0.72rem] text-ink-soft shadow-[var(--shadow-soft)]">
          {note}
        </p>
      )}
    </div>
  )
}

/**
 * Reads one answer aloud: Bhashini's voice when the API has one, the
 * browser's own voices otherwise. Where the browser has no voice for the
 * answer's language it says so rather than reading Hindi in an English accent.
 */
export function ListenButton({ markdown, language }: { markdown: string; language: string }) {
  const { t } = useTranslation()
  const sessionId = useSahayak((s) => s.sessionId)
  const narrator = useNarrator()
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const text = speakableText(markdown)

  useEffect(
    () => () => {
      audio.current?.pause()
      if (audio.current?.src) URL.revokeObjectURL(audio.current.src)
    },
    [],
  )

  const stop = () => {
    audio.current?.pause()
    narrator.stop()
    setPlaying(false)
  }

  const play = async () => {
    if (playing || narrator.speaking) {
      stop()
      return
    }
    setNote(null)
    setBusy(true)
    try {
      // The API reads at most 2,000 characters; the browser has no such limit.
      const blob = text.length <= 2000 ? await synthesise(sessionId, text, language).catch(() => null) : null
      if (blob) {
        if (audio.current?.src) URL.revokeObjectURL(audio.current.src)
        audio.current = new Audio(URL.createObjectURL(blob))
        audio.current.onended = () => setPlaying(false)
        setPlaying(true)
        await audio.current.play()
        return
      }
      if (!narrator.supported || !narrator.hasVoice(language)) {
        setNote('This browser has no voice for this language.')
        return
      }
      narrator.speak(text, language)
    } finally {
      setBusy(false)
    }
  }

  const active = playing || narrator.speaking
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void play()}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.7rem] text-ink-soft hover:text-ink disabled:opacity-60"
        aria-pressed={active}
      >
        <Icon name={active ? 'mute' : 'sound'} size={13} />
        {active ? t('ask.stop') : t('ask.listen')}
      </button>
      {note && <span className="text-[0.68rem] text-ink-faint">{note}</span>}
    </span>
  )
}
