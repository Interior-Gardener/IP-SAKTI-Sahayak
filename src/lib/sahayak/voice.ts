import { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The microphone, for asking Sahayak out loud.
 *
 * The browser records in whatever it likes (webm/opus in Chrome, mp4 in
 * Safari). Bhashini wants 16 kHz mono WAV, and Whisper takes WAV too, so
 * the recording is decoded and resampled here and sent as one format both
 * providers read: the server never has to guess, and never needs ffmpeg.
 *
 * Nothing is kept. The audio goes to /voice/asr once and the words come
 * back into the question box, where the visitor reads them before sending.
 * ------------------------------------------------------------------ */

const TARGET_RATE = 16000
/** The API's limit is about a minute; stop a little before it. */
const MAX_SECONDS = 55

/** PCM samples to a 16-bit mono WAV file. */
function encodeWav(samples: Float32Array, rate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

/** Whatever the browser recorded, as base64 16 kHz mono WAV. */
export async function toWavBase64(recording: Blob): Promise<string> {
  const decoder = new AudioContext()
  try {
    const decoded = await decoder.decodeAudioData(await recording.arrayBuffer())
    const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE))
    const offline = new OfflineAudioContext(1, length, TARGET_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const rendered = await offline.startRendering()
    const bytes = new Uint8Array(encodeWav(rendered.getChannelData(0), TARGET_RATE))
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return btoa(binary)
  } finally {
    void decoder.close()
  }
}

export type RecorderState = 'idle' | 'recording' | 'working'

export interface Recorder {
  supported: boolean
  state: RecorderState
  seconds: number
  start: () => Promise<void>
  /** Stops and resolves to the WAV, or null if nothing was recorded. */
  stop: () => Promise<string | null>
  cancel: () => void
}

export function useRecorder(): Recorder {
  const supported =
    typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  const [state, setState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const done = useRef<((blob: Blob | null) => void) | null>(null)

  const release = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    recorder.current?.stream.getTracks().forEach((t) => t.stop())
    recorder.current = null
  }, [])

  useEffect(() => release, [release])

  const stopRecording = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const r = recorder.current
        if (!r || r.state === 'inactive') {
          resolve(null)
          return
        }
        done.current = resolve
        r.stop()
      }),
    [],
  )

  const start = useCallback(async () => {
    if (!supported || recorder.current) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } })
    const r = new MediaRecorder(stream)
    chunks.current = []
    r.ondataavailable = (e) => {
      if (e.data.size) chunks.current.push(e.data)
    }
    r.onstop = () => {
      const blob = chunks.current.length ? new Blob(chunks.current, { type: r.mimeType }) : null
      release()
      done.current?.(blob)
      done.current = null
    }
    recorder.current = r
    r.start()
    setSeconds(0)
    setState('recording')
    const began = Date.now()
    timer.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - began) / 1000)
      setSeconds(elapsed)
      // Past the API's limit the whole recording would be refused; stop in time.
      if (elapsed >= MAX_SECONDS) void stopRecording()
    }, 250)
  }, [supported, release, stopRecording])

  const stop = useCallback(async () => {
    const blob = await stopRecording()
    if (!blob) {
      setState('idle')
      return null
    }
    setState('working')
    try {
      return await toWavBase64(blob)
    } finally {
      setState('idle')
    }
  }, [stopRecording])

  const cancel = useCallback(() => {
    done.current = null
    recorder.current?.stop()
    release()
    setState('idle')
  }, [release])

  return { supported, state, seconds, start, stop, cancel }
}

/** An answer's markdown as sentences to read aloud: no asterisks, no list marks. */
export function speakableText(markdown: string): string {
  return markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*([-*•]|\d+[.)])\s+/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
