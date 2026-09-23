import { useEffect, useState } from 'react'
import { API_LABEL, OFFICIAL_DATABASES, queryLink } from '../../data/connectors'
import { getConsent, lensSearch, setConsent, type LensSearchResult } from '../../lib/sahayak/client'
import { useSahayak } from '../../store/useSahayak'
import { Icon } from '../ui/Icon'
import { Button, cx } from '../ui/primitives'

/* ------------------------------------------------------------------ *
 * The databases outside the corpus.
 *
 * Free official ones first, each with what it actually lets a program do —
 * usually nothing, said plainly. Then the one credentialed connector, which
 * runs only on the visitor's own token and only after they have agreed to
 * it separately: consent to ask Sahayak is not consent to spend someone's
 * paid quota.
 * ------------------------------------------------------------------ */

export function OfficialDatabases({ query }: { query?: string }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {OFFICIAL_DATABASES.map((db) => {
        const ready = query ? queryLink(db, query) : null
        return (
          <li key={db.id} className="flex flex-col rounded-2xl border border-line bg-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <a href={db.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-accent">
                {db.name}
              </a>
              <span
                className={cx(
                  'shrink-0 rounded-full px-2 py-0.5 text-[0.66rem] font-semibold',
                  db.api === 'none' ? 'bg-sunken text-ink-faint' : 'bg-accent-soft text-accent-ink',
                )}
              >
                {API_LABEL[db.api]}
              </span>
            </div>
            <p className="mt-0.5 text-[0.72rem] text-ink-faint">{db.issuer}</p>
            <p className="mt-2 text-[0.82rem] text-ink-soft">{db.covers}</p>
            <p className="mt-2 flex-1 text-[0.74rem] text-ink-faint">{db.note}</p>
            {ready && (
              <a href={ready} target="_blank" rel="noreferrer" className="mt-2 text-[0.76rem] font-medium text-accent hover:underline">
                Search “{query}” here →
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function LensConnector() {
  const sessionId = useSahayak((s) => s.sessionId)
  const [consented, setConsented] = useState<boolean | null>(null)
  // Held in component state only: gone on reload, never written to storage.
  const [token, setToken] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<LensSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    getConsent(sessionId)
      .then((c) => live && setConsented(Boolean(c.connectors?.lens)))
      .catch(() => live && setConsented(null))
    return () => {
      live = false
    }
  }, [sessionId])

  const toggleConsent = async (granted: boolean) => {
    try {
      const c = await setConsent(sessionId, 'connector:lens', granted)
      setConsented(Boolean(c.connectors?.lens))
      if (!granted) setResult(null)
    } catch {
      setError('Sahayak is offline, so the connector cannot be switched on.')
    }
  }

  const search = async () => {
    if (!token.trim() || query.trim().length < 2) return
    setBusy(true)
    setError(null)
    try {
      setResult(await lensSearch(sessionId, token.trim(), query.trim()))
    } catch (e) {
      const status = (e as { status?: number }).status
      setError(
        status === 401
          ? 'The Lens did not accept that token.'
          : status === 403
            ? 'Switch the connector on first.'
            : status === 429
              ? 'The Lens rate limit was reached; try again in a minute.'
              : 'The search did not go through.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">The Lens — patent search on your own token</h3>
          <p className="mt-1 max-w-xl text-[0.82rem] text-ink-soft">
            Free for non-commercial use, paid for commercial use. Sahayak calls it only on your token and only once you
            switch it on here. Each search is logged — the connector, a hash of the query and the result count, never
            the token and never the words you searched.
          </p>
        </div>
        {consented !== null && (
          <label className="flex items-center gap-2 text-[0.8rem] text-ink-soft">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => void toggleConsent(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            I agree to searches on my Lens account
          </label>
        )}
      </div>

      {consented === null && <p className="mt-3 text-[0.8rem] text-ink-faint">Needs the Sahayak API, which is offline.</p>}

      {consented && (
        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
          onSubmit={(e) => {
            e.preventDefault()
            void search()
          }}
        >
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Your Lens API token"
            aria-label="Your Lens API token"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[0.85rem] outline-none focus:border-line-strong"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Azadirachta indica" AND pesticide'
            aria-label="Search"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[0.85rem] outline-none focus:border-line-strong"
          />
          <Button type="submit" variant="primary" icon="search" disabled={busy || !token.trim() || query.trim().length < 2}>
            {busy ? 'Searching…' : 'Search'}
          </Button>
        </form>
      )}

      {error && <p className="mt-3 text-[0.8rem] text-rose-clay-500">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="text-[0.76rem] text-ink-faint">
            {result.total.toLocaleString()} patents · showing {result.hits.length} · {result.note}
          </p>
          <ul className="mt-2 divide-y divide-line">
            {result.hits.map((h) => (
              <li key={h.lens_id} className="flex flex-wrap items-baseline gap-x-3 py-2 text-[0.82rem]">
                <a href={h.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-accent">
                  {h.title || '(untitled)'}
                </a>
                <span className="font-mono text-[0.72rem] text-ink-faint">
                  {h.jurisdiction} {h.doc_number} {h.kind} · {h.date_published}
                </span>
                <Icon name="arrowRight" size={12} className="text-ink-faint" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
