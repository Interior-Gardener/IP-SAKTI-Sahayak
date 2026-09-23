import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { RasashalaScene } from '../three/RasashalaScene'
import { MaterialIprPanel, MaterialIprStrip } from '../components/MaterialIprPanel'
import { Button, cx } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { SHELVES, getMaterial, materials, materialsOnShelf } from '../data/materials'
import { openSahayak } from '../lib/sahayak/client'
import { useGarden } from '../store/useGarden'
import { useWorkbench } from '../store/useWorkbench'
import { useNarrator } from '../lib/speech'
import { RASASHALA_TOUR } from '../data/rasashalaTour'
import type { SourceMaterial } from '../types/source'

/* ------------------------------------------------------------------ *
 * The Rasashala route.
 *
 * The pharmacy is the answer to the half of the problem statement the
 * garden cannot reach: therapeutics from microbial, animal and mineral
 * sources, and the Budapest Treaty deposits that go with the first of
 * them. Hovering a material raises its card; opening one shows the same
 * cited IP & law panel a plant has, because it is the same panel and the
 * same kind of profile underneath.
 *
 * The API is not involved in any of this — the hall, the materials and
 * their legal layer are all local — so the pharmacy keeps working with
 * the assistant offline, exactly as the garden does.
 * ------------------------------------------------------------------ */

function ShelfList({
  onPick,
  selected,
}: {
  onPick: (id: string) => void
  selected: string | null
}) {
  return (
    <div className="space-y-4">
      {SHELVES.map((shelf) => (
        <div key={shelf.id}>
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-faint uppercase">{shelf.title}</p>
          <p className="mt-1 text-[0.76rem] leading-snug text-ink-faint">{shelf.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {materialsOnShelf(shelf.id).map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m.id)}
                className={cx(
                  'rounded-full border px-2.5 py-1 text-[0.74rem] transition-colors',
                  selected === m.id
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line text-ink-soft hover:border-line-strong hover:text-ink',
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** The card that follows the pointer — what a hovered material is, in short. */
function HoverCard({ material, at }: { material: SourceMaterial; at: { x: number; y: number } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none fixed z-30 w-72"
      style={{ left: Math.min(at.x + 16, window.innerWidth - 300), top: Math.min(at.y + 16, window.innerHeight - 220) }}
    >
      <div className="glass overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
        <div className="p-4">
          <p className="text-[0.66rem] font-semibold tracking-[0.14em] text-accent uppercase">{material.kind}</p>
          <p className="mt-1 font-display text-lg leading-tight font-semibold text-ink">{material.name}</p>
          {material.scientific && <p className="text-[0.76rem] italic text-ink-faint">{material.scientific}</p>}
          <p className="mt-2 text-[0.8rem] leading-snug text-ink-soft">{material.tagline}</p>
        </div>
        <div className="border-t border-line">
          <MaterialIprStrip profile={material.ipr} name={material.name} materialId={material.id} interactive={false} />
        </div>
      </div>
    </motion.div>
  )
}

/** Roughly how long a stop takes to read aloud, so the tour can move on by itself. */
function readingTime(text: string) {
  return Math.max(9000, text.split(/\s+/).length * 390)
}

function TourCard({
  step,
  playing,
  onStep,
  onPlay,
  onOpen,
  onClose,
}: {
  step: number
  playing: boolean
  onStep: (next: number) => void
  onPlay: () => void
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const stop = RASASHALA_TOUR.stops[step]
  const material = getMaterial(stop.materialId)
  const last = step === RASASHALA_TOUR.stops.length - 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-3xl sm:bottom-6"
    >
      <div className="glass overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
        <div className="flex h-1">
          {RASASHALA_TOUR.stops.map((_, i) => (
            <span key={i} className={cx('flex-1 transition-colors', i <= step ? 'bg-accent' : 'bg-line')} />
          ))}
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[0.7rem] text-ink-faint">
              {String(step + 1).padStart(2, '0')} / {String(RASASHALA_TOUR.stops.length).padStart(2, '0')}
            </span>
            <h2 className="font-display text-[1.1rem] leading-tight font-semibold text-ink">{stop.headline}</h2>
            {material && (
              <button onClick={() => onOpen(material.id)} className="text-[0.78rem] font-medium text-accent underline underline-offset-2">
                {material.name}
              </button>
            )}
          </div>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">{stop.narration}</p>
          <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-[0.74rem] text-ink-soft">
            <span className="italic">“{stop.cite.quote}”</span>
            <span className="ml-1.5 font-mono text-[0.68rem] text-ink-faint">
              {stop.cite.source} · {stop.cite.locator}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
          <Button variant="ghost" size="sm" icon="chevronLeft" onClick={() => onStep(step - 1)} disabled={step === 0}>
            Back
          </Button>
          <Button variant="primary" size="sm" icon={playing ? 'pause' : 'play'} onClick={onPlay}>
            {playing ? 'Pause' : 'Play tour'}
          </Button>
          <button onClick={onClose} className="ml-auto text-[0.78rem] text-ink-faint hover:text-ink">
            End tour
          </button>
          <Button size="sm" iconRight="chevronRight" onClick={() => (last ? onClose() : onStep(step + 1))}>
            {last ? 'Finish' : 'Next stop'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Rasashala() {
  const timeOfDay = useGarden((s) => s.timeOfDay)
  const [walking, setWalking] = useState(false)
  // `?open=<id>` arrives from a material's own page ("See it in the
  // Rasashala"), and opens that material's panel on arrival.
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<string | null>(() => getMaterial(params.get('open') ?? undefined)?.id ?? null)
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null)
  const [aimed, setAimed] = useState<string | null>(null)
  const hoverRef = useRef<number | null>(null)
  const onBench = useWorkbench((s) => s.items.length)
  const narrationOn = useGarden((s) => s.narration)
  const narrator = useNarrator()
  // The tour: `?tour=1` starts it on arrival (the Tours page links there).
  const [tourStep, setTourStep] = useState<number | null>(() => (params.get('tour') ? 0 : null))
  const [tourPlaying, setTourPlaying] = useState(false)
  const touring = tourStep !== null
  const wide = typeof window !== 'undefined' && window.innerWidth >= 1024

  /* The tour reads each stop aloud (when narration is on) and, while playing,
   * moves on once the reading has had time to finish. */
  const { speak, stop: hush } = narrator
  useEffect(() => {
    if (tourStep === null) return
    const stop = RASASHALA_TOUR.stops[tourStep]
    if (tourPlaying && narrationOn) speak(`${stop.headline}. ${stop.narration}`)
    if (!tourPlaying) return
    const timer = window.setTimeout(() => {
      if (tourStep < RASASHALA_TOUR.stops.length - 1) setTourStep(tourStep + 1)
      else setTourPlaying(false)
    }, readingTime(stop.narration))
    return () => window.clearTimeout(timer)
  }, [tourStep, tourPlaying, narrationOn, speak])
  useEffect(() => () => hush(), [hush])

  const startTour = () => {
    setSelected(null)
    setWalking(false)
    setTourStep(0)
    setTourPlaying(true)
  }
  const endTour = () => {
    hush()
    setTourPlaying(false)
    setTourStep(null)
  }

  const onRead = useCallback((id: string | null, clientX?: number, clientY?: number) => {
    if (hoverRef.current) window.clearTimeout(hoverRef.current)
    if (id === null) {
      // A short grace period: crossing the gap between a material and its
      // board should not flicker the card away and back.
      hoverRef.current = window.setTimeout(() => setHovered(null), 90)
      return
    }
    setHovered({ id, x: clientX ?? 0, y: clientY ?? 0 })
  }, [])

  useEffect(() => () => void (hoverRef.current && window.clearTimeout(hoverRef.current)), [])

  /* Opening something while walking has to leave the walk: the pointer is
   * locked to the scene, so a panel raised behind that lock could be looked at
   * and not touched. Clicking a vial is a decision to stop and read it. */
  const open = useCallback(
    (id: string) => {
      // Opening something mid-tour pauses the tour rather than fighting it for the camera.
      hush()
      setTourPlaying(false)
      setTourStep(null)
      setSelected(id)
      setWalking(false)
      setAimed(null)
    },
    [hush],
  )

  const opened = useMemo(() => getMaterial(selected ?? undefined), [selected])
  const hoveredMaterial = useMemo(() => getMaterial(hovered?.id), [hovered])
  const aimedMaterial = useMemo(() => getMaterial(aimed ?? undefined), [aimed])

  return (
    <div className="relative h-full w-full overflow-hidden bg-sunken">
      <RasashalaScene
        timeOfDay={timeOfDay}
        selected={selected}
        walking={walking}
        // Opening a material brings the camera to it; the tour does the same stop by stop.
        focus={touring ? RASASHALA_TOUR.stops[tourStep].materialId : selected}
        // Keep the piece clear of the panel on the right, or of the tour card below.
        focusShift={touring ? [0, 0.16] : selected && wide ? [-0.2, 0] : [0, 0]}
        onRead={onRead}
        onSelect={open}
        onWalkExit={() => setWalking(false)}
        onWalkAim={setAimed}
      />

      {/* The hall's own chrome. Hidden while walking, when the pointer is
          locked away and there is nothing to click. */}
      <div className={cx('pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-6', walking && 'hidden')}>
        <div className="pointer-events-auto flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="glass inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[0.78rem] text-ink-soft hover:text-ink"
          >
            <Icon name="chevronLeft" size={14} /> Doorway
          </Link>
          <div className="glass rounded-full border border-line px-3.5 py-1.5">
            <span className="font-display text-[0.9rem] font-semibold text-ink">Rasashala</span>
            <span className="ml-2 text-[0.74rem] text-ink-faint">{materials.length} sources · pharmacy and lab</span>
          </div>
          <Button size="sm" icon="route" onClick={() => setWalking(true)}>
            Walk the hall
          </Button>
          <Button size="sm" icon="play" onClick={startTour}>
            Take the tour
          </Button>
          <Link to="/workbench">
            <Button size="sm" variant={onBench ? 'primary' : 'secondary'} icon="flask">
              Workbench{onBench ? ` · ${onBench}` : ''}
            </Button>
          </Link>
        </div>
      </div>

      {/* The shelf index, so nothing is findable only by sweeping the room. */}
      <div className={cx('absolute top-24 left-4 z-20 hidden w-72 lg:block', walking && 'hidden')}>
        <div className="glass max-h-[70vh] overflow-y-auto rounded-3xl border border-line p-4">
          <ShelfList onPick={open} selected={selected} />
        </div>
      </div>

      <AnimatePresence>
        {hoveredMaterial && !walking && !opened && (
          <HoverCard key={hoveredMaterial.id} material={hoveredMaterial} at={{ x: hovered!.x, y: hovered!.y }} />
        )}
      </AnimatePresence>

      {/* Walking: a plain line naming what the crosshair is on. */}
      {walking && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 text-center">
          <span className="glass rounded-full border border-line px-4 py-2 text-[0.82rem] text-ink-soft">
            {aimedMaterial ? `${aimedMaterial.name} — click to open` : 'Esc to stop walking'}
          </span>
        </div>
      )}

      {/* The opened material: the same cited panel a plant has. */}
      <AnimatePresence>
        {touring && !walking && (
          <TourCard
            key="tour"
            step={tourStep}
            playing={tourPlaying}
            onStep={(next) => {
              hush()
              setTourStep(Math.max(0, Math.min(RASASHALA_TOUR.stops.length - 1, next)))
            }}
            onPlay={() => {
              if (tourPlaying) hush()
              setTourPlaying((v) => !v)
            }}
            onOpen={open}
            onClose={endTour}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && !walking && (
          <motion.aside
            key={opened.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 z-30 w-full max-w-xl overflow-y-auto border-l border-line bg-raised p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-accent uppercase">
                  {opened.kind} · {SHELVES.find((s) => s.id === opened.shelf)?.title}
                </p>
                <h2 className="mt-1 font-display text-2xl leading-tight font-semibold text-ink">{opened.name}</h2>
                {opened.sanskrit && <p className="text-[0.85rem] text-ink-soft">{opened.sanskrit}</p>}
                {opened.scientific && <p className="text-[0.82rem] italic text-ink-faint">{opened.scientific}</p>}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-line p-2 text-ink-faint hover:text-ink"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-soft">{opened.description}</p>
            <div className="mt-4 rounded-2xl bg-sunken p-4">
              <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Classical use</p>
              <p className="mt-1 text-[0.86rem] leading-relaxed text-ink-soft">{opened.classicalUse}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                icon="scale"
                onClick={() =>
                  openSahayak({
                    question: `What IP and regulatory rules apply to ${opened.name} in an Ayurvedic product?`,
                    context: [{ kind: opened.kind, id: opened.id, label: opened.name }],
                  })
                }
              >
                Ask Sahayak about {opened.name}
              </Button>
              <Link to={`/material/${opened.id}`}>
                <Button size="sm" icon="expand">
                  Full page &amp; 3D view
                </Button>
              </Link>
              {opened.kind === 'microbe' && (
                <Button
                  size="sm"
                  onClick={() =>
                    openSahayak({
                      question: `Do I have to deposit a micro-organism to patent an invention that uses one?`,
                      context: [{ kind: opened.kind, id: opened.id, label: opened.name }],
                    })
                  }
                >
                  Deposit rules?
                </Button>
              )}
            </div>

            <h3 className="mt-7 font-display text-lg font-semibold text-ink">IP &amp; law</h3>
            <div className="mt-3">
              <MaterialIprPanel
                profile={opened.ipr}
                name={opened.name}
                materialId={opened.id}
                botanical={opened.scientific}
                names={opened.names}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
