import { useCallback, useEffect, useRef, useState } from 'react'
import {
  API_URL,
  ask,
  health,
  SahayakError,
  type AskRequest,
  type Health,
  type JurisdictionAnswer,
  type SahayakAnswer,
} from '../../lib/sahayak/client'
import { useSahayak } from '../../store/useSahayak'

export type AssistantStatus = 'checking' | 'online' | 'offline'

/** Whether the API is reachable. Checked when a Sahayak surface mounts, never by the
 *  garden itself, so a dead API costs the 3D pages nothing. */
export function useAssistantHealth() {
  const [status, setStatus] = useState<AssistantStatus>(API_URL ? 'checking' : 'offline')
  const [info, setInfo] = useState<Health | null>(null)

  const check = useCallback(async () => {
    if (!API_URL) return setStatus('offline')
    setStatus('checking')
    const h = await health()
    setInfo(h)
    setStatus(h && h.database ? 'online' : 'offline')
  }, [])

  useEffect(() => {
    void check()
  }, [check])

  return { status, info, retry: check }
}

export type Stage = 'idle' | 'checking' | 'understanding' | 'searching' | 'answering' | 'done' | 'error'

export function useAsk() {
  const sessionId = useSahayak((s) => s.sessionId)
  const [stage, setStage] = useState<Stage>('idle')
  const [partial, setPartial] = useState<JurisdictionAnswer[]>([])
  const [result, setResult] = useState<SahayakAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const submit = useCallback(
    async (body: AskRequest) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setStage('checking')
      setPartial([])
      setResult(null)
      setError(null)
      try {
        for await (const ev of ask(body, sessionId, controller.signal)) {
          if (ev.event === 'status') {
            const s = (ev.data as { stage?: string }).stage
            if (s === 'checking' || s === 'understanding' || s === 'searching') setStage(s)
          } else if (ev.event === 'answer') {
            setStage('answering')
            setPartial((prev) => [...prev, ev.data as JurisdictionAnswer])
          } else if (ev.event === 'done') {
            setResult(ev.data as SahayakAnswer)
            setStage('done')
          } else if (ev.event === 'error') {
            setError((ev.data as { message?: string }).message ?? 'Something went wrong.')
            setStage('error')
          }
        }
      } catch (e) {
        if (controller.signal.aborted) return
        const status = e instanceof SahayakError ? e.status : 0
        // The server has no consent for this session (e.g. data was deleted): ask again.
        if (status === 403) useSahayak.getState().setConsent(false)
        setError(
          status === 403
            ? 'Please accept the notice before asking.'
            : status === 429
              ? 'You are asking quickly — wait a minute and try again.'
              : 'Sahayak could not be reached. The garden still works; try again shortly.',
        )
        setStage('error')
      }
    },
    [sessionId],
  )

  useEffect(() => () => abortRef.current?.abort(), [])

  return { stage, partial, result, error, submit }
}
