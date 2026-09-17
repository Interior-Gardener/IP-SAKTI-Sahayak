import { useState } from 'react'
import {
  deleteMyData,
  escalate,
  setConsent,
  type EscalateResult,
  type JurisdictionMode,
  type Persona,
} from '../../lib/sahayak/client'
import { useSahayak } from '../../store/useSahayak'
import { Icon } from '../ui/Icon'
import { Button, cx } from '../ui/primitives'

/* ---------------------------------------------------------------- jurisdiction, language, persona */

const MODES: { value: JurisdictionMode; label: string }[] = [
  { value: 'IN', label: 'India' },
  { value: 'BOTH', label: 'Both' },
  { value: 'INTL', label: 'International' },
]

export function JurisdictionSwitch() {
  const value = useSahayak((s) => s.jurisdiction)
  const set = useSahayak((s) => s.setJurisdiction)
  return (
    <div role="radiogroup" aria-label="Jurisdiction" className="inline-flex rounded-full border border-line bg-sunken p-0.5">
      {MODES.map((m) => (
        <button
          key={m.value}
          role="radio"
          aria-checked={value === m.value}
          onClick={() => set(m.value)}
          className={cx(
            'rounded-full px-3 py-1 text-[0.76rem] font-medium transition-colors',
            value === m.value ? 'bg-raised text-ink shadow-sm' : 'text-ink-faint hover:text-ink-soft',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
]

const PERSONAS: { value: Persona; label: string }[] = [
  { value: 'practitioner', label: 'Practitioner' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'startup', label: 'Startup / MSME' },
  { value: 'cultivator', label: 'Cultivator' },
]

const selectClass =
  'h-8 rounded-full border border-line bg-raised px-2.5 text-[0.76rem] text-ink-soft outline-none focus:border-line-strong'

export function LanguagePicker() {
  const value = useSahayak((s) => s.language)
  const set = useSahayak((s) => s.setLanguage)
  return (
    <select aria-label="Answer language" value={value} onChange={(e) => set(e.target.value)} className={selectClass}>
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  )
}

export function PersonaPicker() {
  const value = useSahayak((s) => s.persona)
  const set = useSahayak((s) => s.setPersona)
  return (
    <select
      aria-label="I am a"
      value={value ?? ''}
      onChange={(e) => set((e.target.value || null) as Persona | null)}
      className={selectClass}
    >
      <option value="">I am a…</option>
      {PERSONAS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

/* ---------------------------------------------------------------- consent */

export function ConsentBanner() {
  const sessionId = useSahayak((s) => s.sessionId)
  const accept = useSahayak((s) => s.setConsent)
  const [transcript, setTranscript] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agree = async () => {
    setBusy(true)
    setError(null)
    try {
      await setConsent(sessionId, 'assistant', true)
      if (transcript) await setConsent(sessionId, 'transcript', true)
      accept(true)
    } catch {
      setError('Could not reach Sahayak to record your choice. Try again shortly.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-raised p-4 text-[0.82rem] text-ink-soft">
      <p className="flex items-center gap-2 font-display text-[1rem] font-semibold text-ink">
        <Icon name="shield" size={18} className="text-accent" /> Before you ask
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Sahayak gives information, not legal advice.</li>
        <li>
          Your question is sent to an AI model provider to write the answer. Do not include personal details you
          don't want to share.
        </li>
        <li>No account is needed. Activity is logged against an anonymous id, without your question text.</li>
        <li>You can delete everything linked to this browser at any time.</li>
      </ul>
      <label className="flex items-start gap-2 text-[0.78rem]">
        <input type="checkbox" checked={transcript} onChange={(e) => setTranscript(e.target.checked)} className="mt-0.5" />
        Also keep my questions and answers so a human facilitator can follow up if I escalate. (Optional)
      </label>
      {error && <p className="text-rose-clay-500">{error}</p>}
      <Button variant="primary" size="sm" onClick={agree} disabled={busy}>
        I understand, continue
      </Button>
    </div>
  )
}

export function DeleteMyData() {
  const sessionId = useSahayak((s) => s.sessionId)
  const reset = useSahayak((s) => s.resetSession)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  return (
    <button
      className="text-[0.7rem] text-ink-faint underline-offset-2 hover:text-ink-soft hover:underline"
      disabled={state === 'busy'}
      onClick={async () => {
        setState('busy')
        try {
          await deleteMyData(sessionId)
          reset()
          setState('done')
        } catch {
          setState('error')
        }
      }}
    >
      {state === 'done' ? 'Your data was deleted' : state === 'error' ? 'Delete failed — retry' : 'Delete my data'}
    </button>
  )
}

/* ---------------------------------------------------------------- escalation */

export function EscalateForm({ answerId, onClose }: { answerId?: string; onClose: () => void }) {
  const sessionId = useSahayak((s) => s.sessionId)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [result, setResult] = useState<EscalateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result) {
    return (
      <div className="space-y-2 rounded-2xl border border-line bg-raised p-4 text-[0.82rem]">
        <p className="font-medium text-ink">Ticket {result.ticket_id} logged.</p>
        <p className="text-ink-soft">{result.note}</p>
        {result.facilitators.map((f) => (
          <p key={f.name} className="text-ink-soft">
            <a href={f.source_url} target="_blank" rel="noreferrer" className="font-medium text-accent">
              {f.name}
            </a>{' '}
            — {f.body} · {f.contact}
          </p>
        ))}
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-2 rounded-2xl border border-line bg-raised p-4 text-[0.82rem]"
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        try {
          setResult(await escalate(sessionId, { answer_id: answerId, message, contact: contact || undefined }))
        } catch {
          setError('Could not log the request. Try again shortly.')
        }
      }}
    >
      <p className="font-display text-[0.95rem] font-semibold text-ink">Ask a human IP facilitator</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What do you need help with?"
        className="w-full rounded-xl border border-line bg-surface p-2 outline-none focus:border-line-strong"
      />
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        maxLength={200}
        placeholder="Email or phone (optional, only used to reply)"
        className="h-9 w-full rounded-xl border border-line bg-surface px-2 outline-none focus:border-line-strong"
      />
      {error && <p className="text-rose-clay-500">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" type="submit">
          Send
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/* ---------------------------------------------------------------- offline */

export function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-line-strong bg-sunken p-4 text-[0.82rem] text-ink-soft">
      <p className="flex items-center gap-2 font-medium text-ink">
        <Icon name="alert" size={16} /> Assistant offline
      </p>
      <p>
        Sahayak's server can't be reached right now. The gardens, plant pages and tours all keep working without it.
      </p>
      <Button size="sm" icon="reset" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
