import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { plants, getPlant } from '../data/plants'
import { DOSHAS, doshaLabel, doshaProfile, viryaScale, vipakaOf } from '../lib/ayurveda'
import { RasaRadar, seriesFor } from '../components/viz/RasaRadar'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Button, Badge, EmptyState, cx } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { StaggerWords } from '../components/motion/Reveal'
import type { Plant } from '../types/plant'

/* ------------------------------------------------------------------ *
 * The comparison bench.
 *
 * Two or three plants, the same axes, one screen. Difference is easier
 * to learn than description — a student who has seen tulsi's hexagon
 * next to brahmi's will not confuse them again.
 * ------------------------------------------------------------------ */

const MAX = 3

function Picker({ chosen, onPick }: { chosen: string[]; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return plants
      .filter((p) => !chosen.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.botanical.toLowerCase().includes(q))
      .slice(0, 40)
  }, [query, chosen])

  return (
    <div className="rounded-3xl border border-line bg-raised p-4">
      <label className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2">
        <Icon name="search" size={15} className="text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={chosen.length >= MAX ? 'Remove one to add another' : 'Add a plant to the bench…'}
          disabled={chosen.length >= MAX}
          className="w-full bg-transparent text-[0.88rem] outline-none placeholder:text-ink-faint disabled:cursor-not-allowed"
        />
      </label>

      <div className="scrollbar-none mt-3 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
        {results.map((plant) => (
          <button
            key={plant.id}
            onClick={() => onPick(plant.id)}
            disabled={chosen.length >= MAX}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.78rem] transition-colors hover:border-line-strong hover:bg-sunken disabled:opacity-40"
          >
            <span className="size-2 rounded-full" style={{ background: plant.accent }} />
            {plant.name}
          </button>
        ))}
        {results.length === 0 && <p className="px-1 py-2 text-[0.8rem] text-ink-faint">No plant by that name.</p>}
      </div>
    </div>
  )
}

function ViryaTrack({ chosen }: { chosen: Plant[] }) {
  return (
    <div className="rounded-3xl border border-line bg-raised p-5">
      <h3 className="font-display text-[0.95rem] font-semibold">Virya · the heating and cooling axis</h3>
      <p className="mt-1 text-[0.76rem] text-ink-faint text-balance-pretty">
        Positions account for the gunas too, so a sharp heating herb sits further right than a merely warm one.
      </p>

      <div className="mt-5 flex justify-between text-[0.7rem] text-ink-faint">
        <span>Shita · cooling</span>
        <span>Ushna · heating</span>
      </div>

      {/* Pins hang below the track and step down one row each, so three of
          them can share a crowded stretch of the scale without colliding. */}
      <div className="relative mt-1.5" style={{ paddingBottom: chosen.length * 30 + 4 }}>
        <div className="h-3 rounded-full bg-gradient-to-r from-[#4aa3a8] via-[color-mix(in_srgb,var(--surface-sunken)_75%,#89a)] to-[#c9743f]" />
        {chosen.map((plant, i) => {
          const position = ((viryaScale(plant) + 1) / 2) * 100
          return (
            <motion.div
              key={plant.id}
              className="absolute top-3 flex -translate-x-1/2 flex-col items-center"
              initial={{ left: '50%', opacity: 0 }}
              animate={{ left: `${position}%`, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="block w-px"
                style={{ background: plant.accent, height: `${6 + i * 30}px` }}
                aria-hidden="true"
              />
              <span
                className="block rounded-full px-2.5 py-1 text-[0.72rem] font-semibold whitespace-nowrap text-white shadow-[var(--shadow-soft)]"
                style={{ background: plant.accent }}
              >
                {plant.name}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function DoshaGrid({ chosen }: { chosen: Plant[] }) {
  const profiles = chosen.map((p) => ({ plant: p, profile: doshaProfile(p) }))

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-raised">
      <h3 className="border-b border-line px-5 py-3.5 font-display text-[0.95rem] font-semibold">Doshic effect</h3>
      <div className="grid" style={{ gridTemplateColumns: `minmax(6rem,8rem) repeat(${chosen.length}, minmax(0,1fr))` }}>
        <div className="border-b border-line bg-sunken px-4 py-2" />
        {chosen.map((plant) => (
          <div key={plant.id} className="border-b border-l border-line bg-sunken px-3 py-2 text-center">
            <span className="text-[0.76rem] font-semibold" style={{ color: plant.accent }}>
              {plant.name}
            </span>
          </div>
        ))}

        {DOSHAS.map((dosha) => (
          <div key={dosha.key} className="contents">
            <div className="border-b border-line px-4 py-3 last:border-0">
              <p className="font-display text-[0.86rem] font-semibold" style={{ color: dosha.color }}>
                {dosha.key}
              </p>
              <p className="text-[0.6rem] text-ink-faint">{dosha.gloss}</p>
            </div>
            {profiles.map(({ plant, profile }) => {
              const effect = profile[dosha.key]
              return (
                <div
                  key={plant.id}
                  className="grid place-items-center border-b border-l border-line px-2 py-3 text-center"
                  style={{
                    background:
                      effect < 0
                        ? `color-mix(in srgb, ${dosha.color} 12%, transparent)`
                        : effect > 0
                          ? 'color-mix(in srgb, #c2413f 12%, transparent)'
                          : undefined,
                  }}
                >
                  <span
                    className="text-[0.76rem] font-medium"
                    style={{ color: effect < 0 ? dosha.color : effect > 0 ? '#c2413f' : 'var(--ink-faint)' }}
                  >
                    {effect < 0 ? '↓ ' : effect > 0 ? '↑ ' : '· '}
                    {doshaLabel(effect)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const FACTS: { label: string; read: (p: Plant) => string }[] = [
  { label: 'Botanical', read: (p) => p.botanical },
  { label: 'Family', read: (p) => p.family },
  { label: 'Habit', read: (p) => p.type },
  { label: 'Parts used', read: (p) => p.partsUsed.join(', ') },
  { label: 'Treats', read: (p) => p.therapeutic.join(', ') },
  { label: 'Vipaka', read: (p) => vipakaOf(p).english },
  { label: 'Systems', read: (p) => p.systems.join(', ') },
  { label: 'Regions', read: (p) => p.regions.join(', ') },
  { label: 'Conservation', read: (p) => p.conservation },
  { label: 'Grow difficulty', read: (p) => ['Easy', 'Moderate', 'Specialist'][p.difficulty - 1] },
  { label: 'Watch out for', read: (p) => p.precautions[0] ?? '—' },
]

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const chosenIds = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, MAX), [params])
  const chosen = chosenIds.map((id) => getPlant(id)).filter((p): p is Plant => Boolean(p))

  const setChosen = (ids: string[]) => {
    const next = new URLSearchParams(params)
    if (ids.length) next.set('ids', ids.join(','))
    else next.delete('ids')
    setParams(next, { replace: true })
  }

  const add = (id: string) => setChosen([...chosenIds, id].slice(0, MAX))
  const remove = (id: string) => setChosen(chosenIds.filter((x) => x !== id))

  return (
    <div className="mx-auto max-w-[80rem] px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-accent uppercase">Comparison bench</p>
        <h1 className="mt-2 font-display text-[clamp(2.1rem,5.5vw,3.2rem)] leading-[1] font-semibold tracking-[-0.03em]">
          <StaggerWords text="Learn a herb against another herb" />
        </h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-ink-soft text-balance-pretty">
          Pick up to three. Their taste hexagons overlay on one chart, their potencies land on one scale, and the
          properties line up row by row.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        {/* --------------------------- bench rail --------------------------- */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <Picker chosen={chosenIds} onPick={add} />

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {chosen.map((plant) => (
                <motion.div
                  key={plant.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-3"
                  style={{ borderLeft: `3px solid ${plant.accent}` }}
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${plant.accent} 14%, transparent)` }}
                  >
                    <BotanicalPlate plant={plant} className="size-10" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/plant/${plant.id}`} className="font-display text-[0.95rem] font-semibold hover:underline">
                      {plant.name}
                    </Link>
                    <p className="truncate text-[0.72rem] text-ink-faint italic">{plant.botanical}</p>
                  </div>
                  <button
                    onClick={() => remove(plant.id)}
                    aria-label={`Remove ${plant.name}`}
                    className="text-ink-faint transition-colors hover:text-ink"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {chosen.length > 0 && (
            <Button variant="ghost" size="sm" icon="reset" onClick={() => setChosen([])} className="w-full">
              Clear the bench
            </Button>
          )}

          {chosen.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line-strong p-4">
              <p className="text-[0.78rem] leading-relaxed text-ink-soft text-balance-pretty">
                Try <button className="font-medium text-accent hover:underline" onClick={() => setChosen(['tulsi', 'brahmi'])}>tulsi against brahmi</button> — both
                famous, both aromatic, and almost opposite in what they do.
              </p>
            </div>
          )}
        </div>

        {/* ----------------------------- results ----------------------------- */}
        <div className="space-y-5">
          {chosen.length === 0 ? (
            <EmptyState
              icon="layers"
              title="The bench is empty"
              body="Add a plant from the list on the left. Two is the useful minimum; three is the most that stays readable on one chart."
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-3xl border border-line bg-raised p-5">
                  <h3 className="font-display text-[0.95rem] font-semibold">Rasa overlay</h3>
                  <p className="mt-1 text-[0.76rem] text-ink-faint text-balance-pretty">
                    Where the silhouettes fail to overlap is where the plants part company.
                  </p>
                  <RasaRadar series={chosen.map(seriesFor)} className="mx-auto mt-2 w-full max-w-[19rem]" />
                  <div className="mt-1 flex flex-wrap justify-center gap-3">
                    {chosen.map((plant) => (
                      <span key={plant.id} className="flex items-center gap-1.5 text-[0.75rem] text-ink-soft">
                        <span className="size-2.5 rounded-full" style={{ background: plant.accent }} />
                        {plant.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <ViryaTrack chosen={chosen} />
                  <DoshaGrid chosen={chosen} />
                </div>
              </div>

              {/* Property table */}
              <div className="overflow-hidden rounded-3xl border border-line bg-raised">
                <h3 className="border-b border-line px-5 py-3.5 font-display text-[0.95rem] font-semibold">
                  Side by side
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="w-40 bg-sunken px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                          Property
                        </th>
                        {chosen.map((plant) => (
                          <th key={plant.id} className="border-l border-line bg-sunken px-4 py-2.5">
                            <span className="font-display text-[0.88rem] font-semibold" style={{ color: plant.accent }}>
                              {plant.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FACTS.map((fact, i) => (
                        <tr key={fact.label} className={cx(i % 2 === 1 && 'bg-surface')}>
                          <th className="border-t border-line px-4 py-3 align-top text-[0.72rem] font-semibold tracking-[0.06em] text-ink-faint uppercase">
                            {fact.label}
                          </th>
                          {chosen.map((plant) => (
                            <td
                              key={plant.id}
                              className="border-t border-l border-line px-4 py-3 align-top text-[0.82rem] leading-relaxed text-ink-soft"
                            >
                              {fact.read(plant)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {chosen.map((plant) => (
                  <Link key={plant.id} to={`/plant/${plant.id}`}>
                    <Badge tone={plant.accent}>Open {plant.name} →</Badge>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
