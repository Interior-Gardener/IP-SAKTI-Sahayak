import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { RegistryMargScene, toneOf } from '../three/RegistryMargScene'
import { REGISTRIES, REGISTRIES_CHECKED_ON, getRegistry, type RegistryData } from '../data/registries'
import { openSahayak } from '../lib/sahayak/client'
import { useGarden } from '../store/useGarden'
import { Icon } from '../components/ui/Icon'
import { Button, cx } from '../components/ui/primitives'

/* ------------------------------------------------------------------ *
 * Registry Marg, the route: the street, an index of its offices, and the
 * panel for the one you open.
 *
 * Everything here comes from the verified registry seed, exported for the
 * web, so the street works with the API down. The panel shows each form with
 * the words of the rule that names it, and says so plainly where the corpus
 * does not name the form — a street of confident-looking signs pointing at
 * made-up forms would be worse than no street.
 * ------------------------------------------------------------------ */

const REGIME_LABEL: Record<string, string> = {
  patent: 'Patents',
  gi: 'Geographical indications',
  trademark: 'Trade marks',
  abs: 'Access and benefit-sharing',
  drug_licensing: 'Drug licensing',
  food: 'Food safety',
  pvp: 'Plant varieties',
  treaty: 'Treaty',
}

function OfficePanel({ registry, onClose }: { registry: RegistryData; onClose: () => void }) {
  const tone = toneOf(registry)
  return (
    <motion.aside
      key={registry.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-y-0 right-0 z-30 w-full max-w-lg overflow-y-auto border-l border-line bg-raised p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase" style={{ color: tone }}>
            {registry.regime.map((r) => REGIME_LABEL[r] ?? r).join(' · ')}
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-ink">{registry.name}</h2>
        </div>
        <button onClick={onClose} className="rounded-full border border-line p-2 text-ink-faint hover:text-ink" aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>

      <p className="mt-3 text-[0.95rem] text-ink-soft">{registry.action}.</p>

      <div className="mt-4 rounded-2xl bg-sunken p-4 text-[0.82rem]">
        <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Why you go here</p>
        <p className="mt-1 text-ink-soft italic">“{registry.cite_quote}”</p>
        <p className="mt-1 font-mono text-[0.72rem] text-ink-faint">
          {registry.cite_source} · {registry.cite_locator}
        </p>
      </div>

      <h3 className="mt-6 font-display text-lg font-semibold">Forms</h3>
      {registry.forms.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {registry.forms.map((f) => (
            <li key={`${f.name}-${f.purpose}`} className="rounded-2xl border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-ink">{f.name}</span>
                <span className="font-mono text-[0.7rem] text-ink-faint">
                  {f.cite_source} · {f.cite_locator}
                </span>
              </div>
              <p className="mt-0.5 text-[0.8rem] text-ink-soft">{f.purpose}</p>
              <p className="mt-1 text-[0.74rem] text-ink-faint italic">“{f.quote}”</p>
            </li>
          ))}
        </ul>
      ) : null}
      {registry.forms_note && (
        <p className="mt-2 flex gap-2 rounded-xl border border-dashed border-line-strong p-3 text-[0.8rem] text-ink-soft">
          <Icon name="alert" size={15} className="mt-0.5 shrink-0 text-turmeric-600" />
          {registry.forms_note}
        </p>
      )}
      {registry.fee_note && <p className="mt-3 text-[0.78rem] text-ink-faint">{registry.fee_note}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <a href={registry.url} target="_blank" rel="noreferrer">
          <Button variant="primary" icon="arrowRight">
            Open the official site
          </Button>
        </a>
        <Button
          icon="scale"
          onClick={() =>
            openSahayak({
              question: `What do I need before I go to the ${registry.name.split(' (')[0]}?`,
            })
          }
        >
          Ask Sahayak
        </Button>
      </div>
      <p className="mt-4 text-[0.7rem] text-ink-faint">
        Link opened and every form checked against the corpus on {REGISTRIES_CHECKED_ON}. This is information, not
        legal advice.
      </p>
    </motion.aside>
  )
}

export default function RegistryMarg() {
  const timeOfDay = useGarden((s) => s.timeOfDay)
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<string | null>(() => getRegistry(params.get('open'))?.id ?? null)
  const [walking, setWalking] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [aimed, setAimed] = useState<string | null>(null)

  const open = useCallback((id: string) => {
    setSelected(id)
    setWalking(false)
    setAimed(null)
  }, [])

  const opened = useMemo(() => getRegistry(selected), [selected])
  const hoveredRegistry = useMemo(() => getRegistry(hovered), [hovered])
  const aimedRegistry = useMemo(() => getRegistry(aimed), [aimed])

  return (
    <div className="relative h-full w-full overflow-hidden bg-sunken">
      <RegistryMargScene
        timeOfDay={timeOfDay}
        selected={selected}
        walking={walking}
        onSelect={open}
        onHover={setHovered}
        onWalkExit={() => setWalking(false)}
        onWalkAim={setAimed}
      />

      <div className={cx('pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-6', walking && 'hidden')}>
        <div className="pointer-events-auto flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="glass inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.78rem] text-ink-soft hover:text-ink"
          >
            <Icon name="chevronLeft" size={14} /> Doorway
          </Link>
          <div className="glass rounded-full border border-line px-3.5 py-1.5">
            <span className="font-display text-[0.9rem] font-semibold text-ink">Registry Marg</span>
            <span className="ml-2 text-[0.74rem] text-ink-faint">{REGISTRIES.length} offices · where to go next</span>
          </div>
          <Button size="sm" icon="route" onClick={() => setWalking(true)}>
            Walk the street
          </Button>
        </div>
      </div>

      {/* The index, so no office is findable only by walking to it. */}
      <div className={cx('absolute top-24 left-4 z-20 hidden w-72 lg:block', walking && 'hidden')}>
        <div className="glass max-h-[70vh] overflow-y-auto rounded-3xl border border-line p-4">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">Offices on the street</p>
          <ul className="mt-2 space-y-1.5">
            {REGISTRIES.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => open(r.id)}
                  className={cx(
                    'flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left text-[0.8rem] transition-colors',
                    selected === r.id ? 'bg-accent/10 text-ink' : 'text-ink-soft hover:bg-sunken hover:text-ink',
                  )}
                >
                  <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: toneOf(r) }} />
                  <span>
                    <span className="block leading-snug">{r.name.split(' (')[0]}</span>
                    <span className="block text-[0.7rem] text-ink-faint">
                      {r.forms.find((f) => f.name.startsWith('Form'))?.name ?? 'form: verify'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hoveredRegistry && !walking && !opened && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
          <span className="glass rounded-full border border-line px-4 py-2 text-[0.82rem] text-ink-soft">
            {hoveredRegistry.name.split(' (')[0]} — {hoveredRegistry.action}
          </span>
        </div>
      )}

      {walking && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 text-center">
          <span className="glass rounded-full border border-line px-4 py-2 text-[0.82rem] text-ink-soft">
            {aimedRegistry ? `${aimedRegistry.name.split(' (')[0]} — click to open` : 'Esc to stop walking'}
          </span>
        </div>
      )}

      <AnimatePresence>{opened && !walking && <OfficePanel registry={opened} onClose={() => setSelected(null)} />}</AnimatePresence>
    </div>
  )
}
