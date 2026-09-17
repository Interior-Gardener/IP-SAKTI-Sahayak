import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { gardenBeds, partFacets, plants, therapeuticFacets, typeFacets } from '../data/plants'
import { tours } from '../data/tours'
import { RASAS, rasaProfile, viryaOf, vipakaOf } from '../lib/ayurveda'
import { IndiaMap } from '../components/viz/IndiaMap'
import { Constellation } from '../components/viz/Constellation'
import { ConservationLadder } from '../components/viz/ConservationLadder'
import { Counter, Reveal, StaggerWords } from '../components/motion/Reveal'
import { Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import type { RegionTag } from '../types/plant'

/* ------------------------------------------------------------------ *
 * The Atlas — the whole compendium seen at once.
 *
 * Every number on this page is derived from the plant data at load
 * time. Nothing here is hand-written copy about the collection, so it
 * cannot fall out of step with what the collection actually contains.
 * ------------------------------------------------------------------ */

function useStats() {
  return useMemo(() => {
    const rasaCounts = RASAS.map((rasa) => ({
      ...rasa,
      count: plants.filter((p) => rasaProfile(p)[rasa.key] > 0).length,
    })).sort((a, b) => b.count - a.count)

    const heating = plants.filter((p) => viryaOf(p) === 'heating').length
    const sweetVipaka = plants.filter((p) => vipakaOf(p).key === 'Madhura').length
    const atRisk = plants.filter((p) => /Vulnerable|Endangered/.test(p.conservation)).length
    const regions = new Set(plants.flatMap((p) => p.regions)).size
    const languages = new Set(plants.flatMap((p) => Object.keys(p.names))).size

    return { rasaCounts, heating, sweetVipaka, atRisk, regions, languages }
  }, [])
}

/* ------------------------------- pieces ------------------------------ */

function StatTile({ value, label, hint, suffix }: { value: number; label: string; hint: string; suffix?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-raised p-4 sm:p-5">
      <p className="font-display text-[2.4rem] leading-none font-semibold tracking-[-0.03em] text-accent">
        <Counter value={value} suffix={suffix} />
      </p>
      <p className="mt-1.5 text-[0.85rem] font-medium">{label}</p>
      <p className="mt-0.5 text-[0.72rem] leading-snug text-ink-faint text-balance-pretty">{hint}</p>
    </div>
  )
}

function Bars({
  items,
  total,
  tone,
}: {
  items: { label: string; count: number; color?: string }[]
  total: number
  tone?: string
}) {
  const max = Math.max(...items.map((i) => i.count))
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={item.label} className="grid grid-cols-[minmax(5.5rem,9rem)_1fr_2.2rem] items-center gap-3">
          <span className="truncate text-[0.78rem] text-ink-soft">{item.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-sunken">
            <motion.span
              className="block h-full rounded-full"
              style={{ background: item.color ?? tone ?? 'var(--accent)' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
            />
          </span>
          <span className="text-right text-[0.76rem] text-ink-faint tabular-nums">{item.count}</span>
        </li>
      ))}
      <li className="pt-1 text-[0.68rem] text-ink-faint">out of {total} species</li>
    </ul>
  )
}

function Split({ left, right, leftLabel, rightLabel, leftColor, rightColor }: {
  left: number
  right: number
  leftLabel: string
  rightLabel: string
  leftColor: string
  rightColor: string
}) {
  const total = left + right
  return (
    <div>
      <div className="flex h-14 overflow-hidden rounded-2xl">
        <motion.div
          className="grid place-items-center font-display text-lg font-semibold text-white"
          style={{ background: leftColor }}
          initial={{ width: '50%' }}
          whileInView={{ width: `${(left / total) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {left}
        </motion.div>
        <motion.div
          className="grid flex-1 place-items-center font-display text-lg font-semibold text-white"
          style={{ background: rightColor }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {right}
        </motion.div>
      </div>
      <div className="mt-1.5 flex justify-between text-[0.72rem] text-ink-soft">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

function Panel({
  eyebrow,
  title,
  lede,
  children,
  aside,
}: {
  eyebrow: string
  title: string
  lede: string
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <Reveal className="rounded-4xl border border-line bg-raised p-5 sm:p-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
          <h2 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
          <p className="mt-1.5 max-w-xl text-[0.88rem] leading-relaxed text-ink-soft text-balance-pretty">{lede}</p>
        </div>
        {aside}
      </header>
      {children}
    </Reveal>
  )
}

/* ------------------------------- route ------------------------------- */

export default function Atlas() {
  const stats = useStats()
  const navigate = useNavigate()

  const onRegion = (region: RegionTag) => navigate(`/explore?region=${encodeURIComponent(region)}`)

  return (
    <div className="mx-auto max-w-[92rem] px-4 py-10 sm:px-6 sm:py-14">
      {/* ------------------------------ hero ------------------------------ */}
      <header className="mb-10">
        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-accent uppercase">The Atlas</p>
        <h1 className="mt-2 max-w-3xl font-display text-[clamp(2.3rem,6vw,3.8rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
          <StaggerWords text="The whole garden, read as data" />
        </h1>
        <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft text-balance-pretty">
          These species carry a great deal more than their names. Here is what the collection looks like when you
          ask it where it grows, what it treats, how it tastes, and how much of it is still safe in the wild.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        <StatTile value={plants.length} label="Species" hint="Each grown from its botanical description" />
        <StatTile value={therapeuticFacets.length} label="Complaints covered" hint="From digestion to wound care" />
        <StatTile value={stats.regions} label="Regions of India" hint="Himalaya to the coasts" />
        <StatTile value={stats.languages} label="Name languages" hint="Sanskrit, Hindi, Tamil and more" />
        <StatTile value={tours.length} label="Guided walks" hint="Narrated, camera-led routes" />
        <StatTile value={stats.atRisk} label="At risk in the wild" hint="Vulnerable or worse on the Red List" />
      </div>

      <div className="space-y-5">
        {/* ---------------------------- geography ---------------------------- */}
        <Panel
          eyebrow="Geography"
          title="Where the garden grows"
          lede="Each circle is a climatic region, sized by how many species the compendium places there. Click one to filter the collection down to it."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div data-tour="atlas-map">
              <IndiaMap onSelect={onRegion} />
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="mb-2.5 font-display text-[0.95rem] font-semibold">Growth habit</h3>
                <Bars items={typeFacets.map((f) => ({ label: f.value, count: f.count }))} total={plants.length} />
              </div>
              <div>
                <h3 className="mb-2.5 font-display text-[0.95rem] font-semibold">The part that carries the medicine</h3>
                <Bars
                  items={partFacets.slice(0, 7).map((f) => ({ label: f.value, count: f.count }))}
                  total={plants.length}
                  tone="#8a7f5c"
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* --------------------------- constellation -------------------------- */}
        <Panel
          eyebrow="Therapeutics"
          title="What treats what"
          lede="Every plant tied to every complaint it addresses. The hubs are the generalists — the herbs a household would actually keep — and the thin edges are the specialists."
          aside={
            <Link to="/explore">
              <Button variant="secondary" size="sm" iconRight="arrowRight">
                Browse the compendium
              </Button>
            </Link>
          }
        >
          <Constellation />
        </Panel>

        {/* ------------------------------ tastes ------------------------------ */}
        <Panel
          eyebrow="Pharmacology"
          title="Taste, potency, and what happens after"
          lede="Ayurveda classifies a drug three times over: how it tastes, whether it heats or cools, and what taste it leaves once digestion has finished with it. Those three axes do most of the prescribing work."
        >
          <div className="grid gap-7 md:grid-cols-3">
            <div>
              <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Rasa · the six tastes</h3>
              <Bars
                items={stats.rasaCounts.map((r) => ({ label: `${r.key} · ${r.english}`, count: r.count, color: r.color }))}
                total={plants.length}
              />
              <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-faint text-balance-pretty">
                Bitter dominates, and that is not an accident of this collection — tikta rasa is the taste of most
                cleansing, antipyretic and antimicrobial drugs.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Virya · potency</h3>
              <Split
                left={stats.heating}
                right={plants.length - stats.heating}
                leftLabel="Ushna · heating"
                rightLabel="Shita · cooling"
                leftColor="#c9743f"
                rightColor="#4aa3a8"
              />
              <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-faint text-balance-pretty">
                Virya is the single most practical fact about a herb: it tells you which season, which constitution and
                which complaint it suits before you know anything else.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Vipaka · after digestion</h3>
              <Split
                left={stats.sweetVipaka}
                right={plants.length - stats.sweetVipaka}
                leftLabel="Madhura · sweet"
                rightLabel="Katu · pungent"
                leftColor="#d9a13c"
                rightColor="#8a7f5c"
              />
              <p className="mt-3 text-[0.74rem] leading-relaxed text-ink-faint text-balance-pretty">
                A sweet vipaka builds tissue; a pungent one lightens and dries. It is why two bitter herbs can end up
                doing opposite things to the same patient.
              </p>
            </div>
          </div>
        </Panel>

        {/* --------------------------- conservation --------------------------- */}
        <Panel
          eyebrow="Conservation"
          title="What we stand to lose"
          lede="Sorted by wild population status. Hover any dot for the species; filled dots are the plants harvested for root, bark or heartwood — the parts that do not grow back."
          aside={
            <Link to="/tours/rare">
              <Button variant="secondary" size="sm" icon="route">
                Walk the endangered beds
              </Button>
            </Link>
          }
        >
          <ConservationLadder />
        </Panel>

        {/* ------------------------------- beds ------------------------------- */}
        <Panel
          eyebrow="The garden itself"
          title="Six beds, planted by purpose"
          lede="The 3D garden is laid out the way a teaching garden would be: one bed per system of the body, so walking between them is itself a lesson in classification."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gardenBeds.map((bed, i) => (
              <Reveal key={bed.id} delay={i * 0.05}>
                <Link
                  to={`/?bed=${bed.id}`}
                  className="group block h-full overflow-hidden rounded-3xl border border-line bg-surface p-4 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                  style={{ borderTop: `3px solid ${bed.accent}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: bed.accent }} />
                    <h3 className="font-display text-[1.05rem] font-semibold">{bed.name}</h3>
                    <Icon
                      name="arrowRight"
                      size={15}
                      className="ml-auto text-ink-faint transition-transform group-hover:translate-x-1"
                    />
                  </div>
                  <p className="mt-1 text-[0.8rem] text-ink-soft">{bed.theme}</p>
                  <p className="mt-2.5 text-[0.74rem] text-ink-faint">
                    {bed.plantIds.length} plants · {bed.plantIds.slice(0, 3).join(', ')}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Panel>
      </div>

      <Reveal className="mt-8 rounded-4xl border border-dashed border-line-strong p-6 text-center">
        <h2 className="font-display text-xl font-semibold">Put two plants side by side</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[0.88rem] text-ink-soft text-balance-pretty">
          The fastest way to learn a herb is against another one. Overlay their taste profiles, potencies and doshic
          effects and the difference stops being abstract.
        </p>
        <Link to="/compare" className="mt-4 inline-block">
          <Button variant="primary" icon="layers">
            Open the comparison bench
          </Button>
        </Link>
      </Reveal>
    </div>
  )
}
