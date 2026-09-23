import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Citation, JurisdictionAnswer, SahayakAnswer } from '../../lib/sahayak/client'
import { Icon } from '../ui/Icon'
import { cx } from '../ui/primitives'
import { ListenButton } from './Voice'

export const JURISDICTION_NAME: Record<'IN' | 'INTL', string> = {
  IN: 'India',
  INTL: 'International',
}

/* Answers are model output, so they are never injected as HTML. This renders the
 * small subset the answer prompt asks for: paragraphs, "-" or "1." lists, **bold**. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className="space-y-3 text-[0.92rem] leading-relaxed text-ink-soft">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const bullets = lines.every((l) => /^([-*•]|\d+[.)])\s+/.test(l))
        if (bullets) {
          const ordered = /^\d/.test(lines[0])
          const Tag = ordered ? 'ol' : 'ul'
          return (
            <Tag key={i} className={cx('space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^([-*•]|\d+[.)])\s+/, ''))}</li>
              ))}
            </Tag>
          )
        }
        return <p key={i}>{inline(lines.join(' ').replace(/^#+\s*/, ''))}</p>
      })}
    </div>
  )
}

const BAND_STYLE = {
  high: 'bg-moss-100 text-moss-800 dark:bg-moss-900 dark:text-moss-200',
  medium: 'bg-turmeric-300/40 text-bark-800 dark:bg-turmeric-600/30 dark:text-turmeric-300',
  low: 'bg-rose-clay-400/25 text-rose-clay-500',
} as const

export function ConfidenceChip({ confidence }: { confidence: JurisdictionAnswer['confidence'] }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold', BAND_STYLE[confidence.band])}
      title={confidence.reasons.join(' · ')}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {confidence.band} confidence
      <span className="font-normal tabular-nums opacity-70">{Math.round(confidence.score * 100)}%</span>
    </span>
  )
}

export function Citations({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null
  // One entry per provision; several quotes from the same section are grouped.
  const groups = new Map<string, Citation[]>()
  for (const c of citations) {
    const key = `${c.source_id}|${c.locator}`
    groups.set(key, [...(groups.get(key) ?? []), c])
  }
  return (
    <ol className="mt-4 space-y-2 border-t border-line pt-3">
      {[...groups.values()].map((group, i) => {
        const c = group[0]
        return (
          <li key={i} className="text-[0.78rem]">
            <a href={c.url} target="_blank" rel="noreferrer" className="group flex items-baseline gap-2 font-medium text-ink hover:text-accent">
              <span className="font-mono text-[0.7rem] text-accent">[{i + 1}]</span>
              <span>
                {c.source_title} — <span className="font-mono">{c.locator}</span>
              </span>
              <Icon name="arrowRight" size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            {group.map((q, j) => (
              <blockquote key={j} className="mt-1 ml-7 border-l-2 border-line pl-2 text-ink-faint italic">
                “{q.cited_text}”
              </blockquote>
            ))}
            <span className="ml-7 text-[0.68rem] text-ink-faint">{c.version_label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function AnswerPane({ answer, language = 'en' }: { answer: JurisdictionAnswer; language?: string }) {
  return (
    <section
      className="rounded-2xl border border-line bg-raised p-4"
      aria-label={`${JURISDICTION_NAME[answer.jurisdiction]} answer`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[1rem] font-semibold">{JURISDICTION_NAME[answer.jurisdiction]}</h3>
        <span className="flex items-center gap-2">
          <ListenButton markdown={answer.markdown} language={language} />
          <ConfidenceChip confidence={answer.confidence} />
        </span>
      </header>
      <Markdown text={answer.markdown} />
      <Citations citations={answer.citations} />
    </section>
  )
}

export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="flex gap-2 rounded-xl bg-sunken px-3 py-2 text-[0.72rem] leading-snug text-ink-faint">
      <Icon name="info" size={14} className="mt-px shrink-0" />
      {text ?? 'This is information, not legal advice. Verify with the cited source or a qualified IP facilitator before acting on it.'}
    </p>
  )
}

export function ProviderFooter({ answer }: { answer: SahayakAnswer }) {
  return (
    <p className="text-[0.66rem] text-ink-faint">
      Answered by {answer.provider.name} · <span className="font-mono">{answer.provider.model}</span>
    </p>
  )
}

/**
 * Where to go next: the registries the question's regimes point at, each with
 * the provision that sends you there. Held to the same rule as the answer —
 * every line shows its source, and a form is named only where the corpus names it.
 */
export function NextSteps({ steps }: { steps: SahayakAnswer['next_steps'] }) {
  const { t } = useTranslation()
  if (!steps.length) return null
  return (
    <section className="rounded-2xl border border-line bg-sunken p-4" aria-label="Where to go next">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[1rem] font-semibold">{t('ask.nextSteps')}</h3>
        <Link to="/registry-marg" className="text-[0.74rem] font-medium text-accent hover:underline">
          {t('ask.walkMarg')}
        </Link>
      </header>
      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.registry} className="rounded-xl border border-line bg-raised p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-accent">
                {s.registry}
              </a>
              {s.form && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.68rem] font-semibold text-accent-ink">
                  {s.form}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.8rem] text-ink-soft">{s.action}</p>
            <p className="mt-1.5 text-[0.7rem] text-ink-faint">
              Because <span className="font-mono">{s.cite.source_id}</span> {s.cite.locator}:{' '}
              <span className="italic">“{s.cite.cited_text}”</span>
            </p>
            {s.fee_note && <p className="mt-1 text-[0.68rem] text-ink-faint">{s.fee_note}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
