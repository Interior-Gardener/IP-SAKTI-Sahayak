import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WorkbenchScene } from '../three/WorkbenchScene'
import { Button, cx } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { PROCESSES, useWorkbench, type Process } from '../store/useWorkbench'
import { useGarden } from '../store/useGarden'
import {
  API_URL,
  classify,
  openSahayak,
  type CitedLine,
  type ClassificationResult,
  type ClassifyQuestion,
} from '../lib/sahayak/client'

/* ------------------------------------------------------------------ *
 * The formulation workbench.
 *
 * Left: what is on the bench and what is being done to each thing.
 * Right: the classifier's minimum questions, one at a time, and the
 * category they land on — with what it requires and what its IP and ABS
 * posture is, every line carrying the provision it rests on.
 *
 * The classification comes from the API's rule table, never from a model,
 * so it is the same answer every time and can be argued with. With the API
 * down the bench still composes; only the wizard is unavailable, and it
 * says so rather than guessing a category.
 * ------------------------------------------------------------------ */

/** A line from the rule table: text, then the provision it rests on. A line
 *  the corpus has not confirmed says "verify" rather than passing as fact. */
function Cited({ line }: { line: CitedLine }) {
  return (
    <li className="border-t border-line py-2.5 text-[0.85rem] leading-relaxed text-ink-soft first:border-t-0">
      {line.text}
      <span className="ml-2 font-mono text-[0.68rem] text-accent" title="Source id and locator in the corpus">
        [{line.cite.source_id} {line.cite.locator}]
      </span>
      {!line.cite.verified && (
        <span className="ml-1.5 rounded-full border border-line-strong px-1.5 py-0.5 text-[0.62rem] text-ink-faint uppercase">
          verify
        </span>
      )}
    </li>
  )
}

function ResultCard({ result, onAsk }: { result: ClassificationResult; onAsk: () => void }) {
  return (
    <div className="rounded-3xl border border-line bg-raised p-5">
      <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-accent uppercase">Category</p>
      <h3 className="mt-1 font-display text-xl leading-tight font-semibold text-ink">{result.label}</h3>
      <p className="mt-1 text-[0.76rem] text-ink-faint">
        Decided by: {result.decided_by} · rule table checked {result.verified_on}
      </p>

      <h4 className="mt-5 text-[0.72rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">What it requires</h4>
      <ul className="mt-1">
        {result.requires.map((line, i) => (
          <Cited key={i} line={line} />
        ))}
      </ul>

      <h4 className="mt-5 text-[0.72rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">IP and ABS posture</h4>
      <ul className="mt-1">
        {result.ip_posture.map((line, i) => (
          <Cited key={i} line={line} />
        ))}
      </ul>

      <p className="mt-5 rounded-2xl bg-sunken p-3 text-[0.78rem] leading-relaxed text-ink-faint">{result.disclaimer}</p>

      <Button className="mt-4" variant="primary" size="sm" icon="scale" onClick={onAsk}>
        Ask Sahayak about this formulation
      </Button>
    </div>
  )
}

export default function Workbench() {
  const timeOfDay = useGarden((s) => s.timeOfDay)
  const { items, answers, name, remove, update, setAnswer, clearAnswers, setName, clear } = useWorkbench()
  const [selected, setSelected] = useState<string | null>(null)
  const [question, setQuestion] = useState<ClassifyQuestion | null>(null)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const composition = useMemo(
    () =>
      items
        .map((i) => `${i.proportion} part ${i.label}${i.part ? ` (${i.part})` : ''} as ${i.process}`)
        .join(', '),
    [items],
  )

  /* One round trip per answer. The table is tiny and the call is cheap, and
   * asking the API each time means the branch is always the server's, never
   * a copy of it that has drifted. */
  const step = useCallback(
    async (next: Record<string, boolean>) => {
      if (!API_URL) {
        setError('The assistant API is not configured, so the classifier cannot run. Set VITE_API_URL.')
        return
      }
      setBusy(true)
      setError(null)
      try {
        const out = await classify(next)
        setQuestion(out.next_question ?? null)
        setResult(out.result ?? null)
      } catch {
        setError('The classifier is offline. The bench still works; try again when the API is up.')
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  // Start (or restart) the wizard whenever the composition changes under it.
  useEffect(() => {
    if (!items.length) {
      setQuestion(null)
      setResult(null)
      return
    }
    void step(answers)
    // `answers` is cleared by the store when the composition changes, which is
    // what should restart the wizard — so it belongs in the dependencies.
  }, [items.length, answers, step])

  const answer = (value: boolean) => {
    if (!question) return
    setAnswer(question.id, value)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-sunken">
      <div className="absolute inset-0">
        <WorkbenchScene timeOfDay={timeOfDay} selected={selected} />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <header className="pointer-events-auto flex flex-wrap items-center gap-3 p-4 sm:p-6">
          <Link
            to="/rasashala"
            className="glass inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.78rem] text-ink-soft hover:text-ink"
          >
            <Icon name="chevronLeft" size={14} /> Rasashala
          </Link>
          <div className="glass rounded-full border border-line px-3.5 py-1.5">
            <span className="font-display text-[0.9rem] font-semibold text-ink">Workbench</span>
            <span className="ml-2 text-[0.74rem] text-ink-faint">
              {items.length ? `${items.length} on the bench` : 'nothing on the bench yet'}
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-0 sm:p-6 sm:pt-0 lg:flex-row">
          {/* Composition */}
          <section className="glass pointer-events-auto w-full overflow-y-auto rounded-3xl border border-line p-4 lg:w-80">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-ink">Composition</h2>
              {items.length > 0 && (
                <button onClick={clear} className="text-[0.74rem] text-ink-faint hover:text-ink">
                  Clear
                </button>
              )}
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this formulation"
              className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[0.85rem] text-ink placeholder:text-ink-faint"
            />

            {items.length === 0 ? (
              <p className="mt-4 text-[0.82rem] leading-relaxed text-ink-faint">
                Nothing yet. Open a plant's <span className="text-ink-soft">IP &amp; Law</span> tab, or a material in the{' '}
                <Link to="/rasashala" className="text-accent hover:underline">
                  Rasashala
                </Link>
                , and add it to the bench.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={cx(
                      'rounded-2xl border p-3 transition-colors',
                      selected === item.id ? 'border-accent bg-accent/5' : 'border-line',
                    )}
                    onMouseEnter={() => setSelected(item.id)}
                    onMouseLeave={() => setSelected(null)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={item.kind === 'plant' ? `/plant/${item.id}` : `/material/${item.id}`}
                          className="text-[0.88rem] font-medium text-ink hover:text-accent hover:underline"
                        >
                          {item.label}
                        </Link>
                        <p className="text-[0.7rem] text-ink-faint uppercase">{item.kind}</p>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-ink-faint hover:text-ink"
                        aria-label={`Remove ${item.label}`}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <input
                        value={item.part ?? ''}
                        onChange={(e) => update(item.id, { part: e.target.value })}
                        placeholder="part (leaf, root…)"
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-[0.78rem] text-ink placeholder:text-ink-faint"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.proportion}
                        onChange={(e) => update(item.id, { proportion: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-[0.78rem] text-ink"
                        aria-label="parts by weight"
                      />
                    </div>
                    <select
                      value={item.process}
                      onChange={(e) => update(item.id, { process: e.target.value as Process })}
                      className="mt-2 w-full rounded-lg border border-line bg-surface px-2 py-1 text-[0.78rem] text-ink"
                    >
                      {PROCESSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* The wizard and its result */}
          <section className="glass pointer-events-auto ml-auto w-full overflow-y-auto rounded-3xl border border-line p-4 lg:w-[26rem]">
            <h2 className="font-display text-base font-semibold text-ink">Classification</h2>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-faint">
              The fewest questions that decide which category the product falls in. The branch comes from a rule table
              with a citation on every line — not from a model.
            </p>

            {items.length === 0 && (
              <p className="mt-4 text-[0.82rem] text-ink-faint">Put something on the bench to start.</p>
            )}

            {error && (
              <p className="mt-4 rounded-2xl border border-dashed border-line-strong p-3 text-[0.82rem] text-ink-soft">
                {error}
              </p>
            )}

            {items.length > 0 && !error && question && (
              <div className="mt-4 rounded-3xl border border-line bg-raised p-4">
                <p className="text-[0.9rem] leading-relaxed text-ink">{question.text}</p>
                {question.help && <p className="mt-1 text-[0.76rem] text-ink-faint">{question.help}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => answer(true)} disabled={busy}>
                    Yes
                  </Button>
                  <Button size="sm" onClick={() => answer(false)} disabled={busy}>
                    No
                  </Button>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4">
                <ResultCard
                  result={result}
                  onAsk={() =>
                    openSahayak({
                      question: `My formulation is ${composition || 'still being composed'}. It classifies as ${result.label}. What IP and regulatory steps apply?`,
                      context: items.map((i) => ({ kind: i.kind, id: i.id, label: i.label })),
                    })
                  }
                />
                <button onClick={clearAnswers} className="mt-3 text-[0.78rem] text-ink-faint hover:text-ink">
                  Answer the questions again
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
