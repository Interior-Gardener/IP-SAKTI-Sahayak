import type { components } from '../../types/sahayak'

/* Everything the garden needs from the Sahayak API goes through here. The
 * garden itself never waits on these calls: when the API is down, `health()`
 * says so and the assistant surfaces show the offline notice instead. */

export type SahayakAnswer = components['schemas']['SahayakAnswer']
export type Citation = components['schemas']['Citation']
export type RegistryPointer = components['schemas']['RegistryPointer']
export type MaterialIPProfile = components['schemas']['MaterialIPProfile']
export type Health = components['schemas']['Health']
export type JurisdictionMode = SahayakAnswer['jurisdiction_mode']
export type Persona = NonNullable<SahayakAnswer['persona']>

export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class SahayakError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface AskRequest {
  question: string
  language?: string
  jurisdiction_mode: JurisdictionMode
  persona?: Persona
  /** What the visitor is looking at: a plant, a shelf item, the workbench basket. */
  context?: { kind: string; id: string }[]
}

/** One server-sent event from `/ask`. The final one carries the envelope. */
export interface AskEvent {
  event: string
  data: unknown
}

async function request<T>(path: string, init: RequestInit = {}, sessionId?: string): Promise<T> {
  if (!API_URL) throw new SahayakError(0, 'VITE_API_URL is not set')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) throw new SahayakError(res.status, await res.text())
  return (await res.json()) as T
}

/** Resolves to null rather than throwing: "offline" is a normal state here. */
export async function health(timeoutMs = 4000): Promise<Health | null> {
  try {
    return await request<Health>('/health', { signal: AbortSignal.timeout(timeoutMs) })
  } catch {
    return null
  }
}

export function materialIpr(kind: string, id: string) {
  return request<MaterialIPProfile>(`/materials/${kind}/${encodeURIComponent(id)}/ipr`)
}

/* `/ask` is a POST, which EventSource cannot send, so the stream is read by
 * hand: SSE frames are separated by a blank line, each with `event:` and
 * `data:` lines. */
function parseFrame(frame: string): AskEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  if (!data.length) return null
  const raw = data.join('\n')
  try {
    return { event, data: JSON.parse(raw) }
  } catch {
    return { event, data: raw }
  }
}

export async function* ask(
  body: AskRequest,
  sessionId: string,
  signal?: AbortSignal,
): AsyncGenerator<AskEvent> {
  if (!API_URL) throw new SahayakError(0, 'VITE_API_URL is not set')
  const res = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'X-Session-Id': sessionId,
    },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) throw new SahayakError(res.status, await res.text())

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const parsed = parseFrame(frame)
      if (parsed) yield parsed
    }
  }
  const tail = parseFrame(buffer)
  if (tail) yield tail
}

/* ---------------------------------------------------------------- privacy, escalation, corpus */

export type ConsentState = components['schemas']['ConsentState']
export type EscalateResult = components['schemas']['EscalateResult']
export type SourcesOut = components['schemas']['SourcesOut']
export type JurisdictionAnswer = SahayakAnswer['answers'][number]

export function getConsent(sessionId: string) {
  return request<ConsentState>('/consent', {}, sessionId)
}

export function setConsent(
  sessionId: string,
  scope: 'assistant' | 'transcript' | 'connector:lens',
  granted: boolean,
) {
  return request<ConsentState>(
    '/consent',
    { method: 'POST', body: JSON.stringify({ scope, granted }) },
    sessionId,
  )
}

export function deleteMyData(sessionId: string) {
  return request<{ deleted: Record<string, number> }>('/me', { method: 'DELETE' }, sessionId)
}

export function escalate(sessionId: string, body: { answer_id?: string; message: string; contact?: string }) {
  return request<EscalateResult>('/escalate', { method: 'POST', body: JSON.stringify(body) }, sessionId)
}

export function sources() {
  return request<SourcesOut>('/sources')
}

/* ------------------------------------------------- classification and ABS
 * Both are rule tables on the API, not model calls: the same answers always
 * give the same category, and every line comes back with the provision it
 * rests on. The wizard sends the answers it has so far and gets either the
 * next question or the result. */

export type ClassifyStep = components['schemas']['ClassifyStep']
export type ClassificationResult = components['schemas']['ClassificationResult']
export type AbsStep = components['schemas']['AbsStep']
export type ClassifyQuestion = components['schemas']['Question']
export type CitedLine = components['schemas']['Line']

export function classify(answers: Record<string, boolean>, sessionId?: string) {
  return request<ClassifyStep>('/classify', { method: 'POST', body: JSON.stringify({ answers }) }, sessionId)
}

export function absCheck(answers: Record<string, boolean>, sessionId?: string) {
  return request<AbsStep>('/abs', { method: 'POST', body: JSON.stringify({ answers }) }, sessionId)
}

/* ---------------------------------------------------------------- opening the drawer */

export interface OpenSahayakDetail {
  question?: string
  context?: { kind: string; id: string; label?: string }[]
}

/** Any page (or a 3D scene) can open the assistant without prop drilling. */
export function openSahayak(detail: OpenSahayakDetail = {}) {
  window.dispatchEvent(new CustomEvent<OpenSahayakDetail>('sahayak:open', { detail }))
}

/* ---------------------------------------------------------------- voice (stage 3) */

export type AsrResult = components['schemas']['AsrResult']

/** Speech to text. `audioBase64` is 16 kHz mono WAV (see lib/sahayak/voice.ts). */
export function transcribe(sessionId: string, audioBase64: string, language: string) {
  return request<AsrResult>(
    '/voice/asr',
    { method: 'POST', body: JSON.stringify({ audio_base64: audioBase64, language }) },
    sessionId,
  )
}

/**
 * Text to speech. Resolves to a playable blob when the API has a speech
 * provider, and to null when it answers 204 — the signal to read the text in
 * the browser instead, which is what happens until Bhashini is configured.
 */
export async function synthesise(sessionId: string, text: string, language: string): Promise<Blob | null> {
  if (!API_URL) return null
  const res = await fetch(`${API_URL}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
    body: JSON.stringify({ text, language }),
  })
  if (res.status === 204) return null
  if (!res.ok) throw new SahayakError(res.status, await res.text())
  return await res.blob()
}

/* ------------------------------------------------------------ connectors (stage 3) */

export type LensSearchResult = components['schemas']['LensSearchResult']

/** Patent search on The Lens with the person's own token. The token goes in a
 *  header on this one request and is kept nowhere — not here, not on the API. */
export function lensSearch(sessionId: string, token: string, query: string) {
  return request<LensSearchResult>(
    '/connectors/lens/search',
    { method: 'POST', body: JSON.stringify({ query }), headers: { 'X-Connector-Token': token } },
    sessionId,
  )
}
