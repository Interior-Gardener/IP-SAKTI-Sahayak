import { useCallback, useEffect, useState } from 'react'
import { Markdown } from '../components/sahayak/AnswerParts'
import { OfflineNotice } from '../components/sahayak/Controls'
import { LensConnector, OfficialDatabases } from '../components/sahayak/Connectors'
import { Icon } from '../components/ui/Icon'
import { cx } from '../components/ui/primitives'
import { sources, type SourcesOut } from '../lib/sahayak/client'

export default function Sources() {
  const [data, setData] = useState<SourcesOut | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'offline'>('loading')
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'INTL'>('ALL')

  const load = useCallback(() => {
    setState('loading')
    sources()
      .then((d) => {
        setData(d)
        setState('ok')
      })
      .catch(() => setState('offline'))
  }, [])
  useEffect(load, [load])

  const rows = (data?.sources ?? []).filter((s) => filter === 'ALL' || s.jurisdiction === filter)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6 max-w-2xl">
        <p className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.18em] text-accent uppercase">
          <Icon name="book" size={14} /> The corpus
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">What Sahayak can cite</h1>
        <p className="mt-3 text-[0.95rem] text-ink-soft">
          Every answer is grounded in these official texts. Each has a version; when a law changes, the new text is
          added and the old one is kept for reference but no longer used for answers.
        </p>
      </header>

      {state === 'offline' && <OfflineNotice onRetry={load} />}
      {state === 'loading' && <p className="text-ink-faint">Loading sources…</p>}

      {data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {(['ALL', 'IN', 'INTL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cx(
                  'rounded-full px-3 py-1 text-[0.8rem]',
                  filter === f ? 'bg-accent text-[var(--surface-raised)]' : 'border border-line text-ink-soft',
                )}
              >
                {f === 'ALL' ? 'All' : f === 'IN' ? 'India' : 'International'}
              </button>
            ))}
            <span className="ml-auto font-mono text-[0.72rem] text-ink-faint">corpus {data.corpus_version}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-[0.82rem]">
              <thead className="bg-sunken text-[0.72rem] text-ink-faint uppercase">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2 text-right">Passages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const current = s.versions.find((v) => !v.superseded)
                  return (
                    <tr key={s.id} className="border-t border-line align-top">
                      <td className="px-3 py-2">
                        <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-accent">
                          {s.title}
                        </a>
                        <span className="block text-[0.72rem] text-ink-faint">
                          {s.issuer} · {s.jurisdiction === 'IN' ? 'India' : 'International'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-soft">{s.doc_type}</td>
                      <td className="px-3 py-2 text-ink-soft">
                        {current?.version_label ?? '—'}
                        {s.versions.length > 1 && (
                          <span className="block text-[0.7rem] text-ink-faint">{s.versions.length - 1} older kept</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-ink-soft tabular-nums">{current?.chunks ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <section className="mt-10 max-w-3xl">
            <h2 className="mb-3 font-display text-xl font-semibold">Changelog</h2>
            <Markdown text={data.changelog_markdown.replace(/^# .*\n/, '')} />
          </section>
        </>
      )}

      {/* Outside the corpus: shown whether or not the API is up. */}
      <section className="mt-12" aria-labelledby="databases">
        <h2 id="databases" className="font-display text-xl font-semibold">
          Official databases, and what they let a program do
        </h2>
        <p className="mt-1 mb-4 max-w-2xl text-[0.88rem] text-ink-soft">
          Records change faster than law, so Sahayak points you at the registers themselves. Most publish no public API —
          IP India, TKDL and PATENTSCOPE among them — so it links rather than pretending to search them for you.
        </p>
        <OfficialDatabases />
      </section>

      <section className="mt-10" aria-label="Credentialed connector">
        <LensConnector />
      </section>
    </div>
  )
}
