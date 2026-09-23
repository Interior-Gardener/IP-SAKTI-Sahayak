import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OpenSahayakDetail } from '../../lib/sahayak/client'
import { useSahayak } from '../../store/useSahayak'
import { Icon } from '../ui/Icon'
import { Button, cx } from '../ui/primitives'
import { AnswerPane, Disclaimer, JURISDICTION_NAME, NextSteps, ProviderFooter } from './AnswerParts'
import {
  ConsentBanner,
  DeleteMyData,
  EscalateForm,
  JurisdictionSwitch,
  LanguagePicker,
  OfflineNotice,
  PersonaPicker,
} from './Controls'
import { useAsk, useAssistantHealth, type Stage } from './useAsk'
import { MicButton } from './Voice'

/** i18n keys for the pipeline's stages. */
const STAGE_LABEL: Partial<Record<Stage, string>> = {
  checking: 'ask.checking',
  understanding: 'ask.understanding',
  searching: 'ask.searching',
  answering: 'ask.answering',
}

const EXAMPLES = [
  'Can I patent a classical Ayurvedic formulation?',
  'Do I need NBA approval to use an Indian plant in research abroad?',
  'What does TRIPS say about patenting plants?',
]

/** The whole assistant: used full-page at /sahayak and compact in the drawer. */
export function AskPanel({
  compact = false,
  seed,
}: {
  compact?: boolean
  seed?: OpenSahayakDetail
}) {
  const { t } = useTranslation()
  const { status, retry } = useAssistantHealth()
  const consent = useSahayak((s) => s.consent)
  const jurisdiction = useSahayak((s) => s.jurisdiction)
  const language = useSahayak((s) => s.language)
  const persona = useSahayak((s) => s.persona)
  const { stage, partial, result, error, submit } = useAsk()
  const [question, setQuestion] = useState(seed?.question ?? '')
  const [escalating, setEscalating] = useState(false)
  const context = seed?.context ?? []

  useEffect(() => {
    if (seed?.question) setQuestion(seed.question)
  }, [seed])

  const busy = stage !== 'idle' && stage !== 'done' && stage !== 'error'
  const answers = result?.answers ?? partial

  const send = (q = question) => {
    const trimmed = q.trim()
    if (!trimmed || busy) return
    setEscalating(false)
    void submit({
      question: trimmed,
      language,
      jurisdiction_mode: jurisdiction,
      persona: persona ?? undefined,
      context: context.map(({ kind, id }) => ({ kind, id })),
    })
  }

  if (status === 'offline') return <OfflineNotice onRetry={retry} />
  if (status === 'checking')
    return <p className="p-4 text-[0.82rem] text-ink-faint">Connecting to Sahayak…</p>
  if (!consent) return <ConsentBanner />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <JurisdictionSwitch />
        <LanguagePicker />
        <PersonaPicker />
      </div>

      {context.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-[0.74rem] text-ink-faint">
          {t('ask.askingAbout')}
          {context.map((c) => (
            <span key={`${c.kind}:${c.id}`} className="rounded-full bg-sunken px-2 py-0.5 text-ink-soft">
              {c.label ?? c.id}
            </span>
          ))}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex items-end gap-2 rounded-2xl border border-line bg-raised p-2 focus-within:border-line-strong"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={compact ? 2 : 3}
          maxLength={2000}
          placeholder={t('ask.placeholder')}
          className="flex-1 resize-none bg-transparent p-1.5 text-[0.9rem] outline-none placeholder:text-ink-faint"
          aria-label={t('ask.question')}
        />
        <MicButton language={language} onHeard={(heard) => setQuestion((q) => (q.trim() ? `${q.trim()} ${heard}` : heard))} />
        <Button variant="primary" size="sm" icon="send" type="submit" disabled={busy || !question.trim()} aria-label={t('ask.send')} />
      </form>

      {stage === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuestion(ex)
                send(ex)
              }}
              className="rounded-full border border-line px-3 py-1.5 text-left text-[0.74rem] text-ink-soft hover:border-line-strong hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {busy && (
        <p className="flex items-center gap-2 text-[0.8rem] text-ink-faint" aria-live="polite">
          <Icon name="seedling" size={16} className="animate-float" /> {STAGE_LABEL[stage] && t(STAGE_LABEL[stage])}
        </p>
      )}
      {error && <p className="text-[0.82rem] text-rose-clay-500">{error}</p>}

      {result?.abstained && (
        <div className="rounded-2xl border border-line bg-sunken p-4 text-[0.85rem] text-ink-soft">
          <p className="mb-1 font-medium text-ink">
            {result.abstained.reason === 'insufficient_sources' ? 'Not enough sources to answer' : 'Sahayak can’t answer this one'}
          </p>
          {result.abstained.suggestion}
        </div>
      )}

      {answers.length > 0 && (
        // Two jurisdictions sit side by side and are never merged into one answer.
        <div className={cx('grid gap-3', !compact && answers.length > 1 && 'lg:grid-cols-2')}>
          {(['IN', 'INTL'] as const)
            .map((j) => answers.find((a) => a.jurisdiction === j))
            .filter((a): a is NonNullable<typeof a> => Boolean(a))
            .map((a) => (
              <AnswerPane key={a.jurisdiction} answer={a} language={result?.language ?? language} />
            ))}
          {busy && jurisdiction === 'BOTH' && answers.length === 1 && (
            <p className="rounded-2xl border border-dashed border-line p-4 text-[0.8rem] text-ink-faint">
              {JURISDICTION_NAME[answers[0].jurisdiction === 'IN' ? 'INTL' : 'IN']} answer on its way…
            </p>
          )}
        </div>
      )}

      {result && result.next_steps.length > 0 && <NextSteps steps={result.next_steps} />}

      {result && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!escalating && (
            <Button size="sm" variant="ghost" icon="scale" onClick={() => setEscalating(true)}>
              {t('ask.human')}
            </Button>
          )}
          <ProviderFooter answer={result} />
        </div>
      )}
      {escalating && <EscalateForm answerId={result?.id} onClose={() => setEscalating(false)} />}

      <Disclaimer text={result?.disclaimer} />
      <DeleteMyData />
    </div>
  )
}
