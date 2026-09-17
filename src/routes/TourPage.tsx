import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { getPlant } from '../data/plants'
import { tourById } from '../data/tours'
import { GardenScene, useGardenLayout, type CameraGoal } from '../three/GardenScene'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon } from '../components/ui/Icon'
import { Button, cx } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'
import { useNarrator } from '../lib/speech'

/** Roughly how long the narration takes to read aloud, in ms. */
function readingTime(text: string): number {
  return Math.max(6500, (text.split(/\s+/).length / 2.6) * 1000)
}

export default function TourPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tour = id ? tourById.get(id) : undefined
  const layout = useGardenLayout()
  const narrator = useNarrator()
  const narrationOn = useGarden((s) => s.narration)
  const setNarration = useGarden((s) => s.setNarration)
  const completeTour = useGarden((s) => s.completeTour)
  const markVisited = useGarden((s) => s.markVisited)
  const timeOfDay = useGarden((s) => s.timeOfDay)

  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const advanceTimer = useRef<number | null>(null)

  const stop = tour?.stops[step]
  const plant = getPlant(stop?.plantId)

  const goal = useMemo<CameraGoal>(() => {
    const placement = layout.find((p) => p.plant.id === stop?.plantId)
    if (!placement) return { target: [0, 0.7, 0], distance: 20, lift: 0.5 }
    const height = placement.plant.model.height * placement.scale
    return {
      target: [placement.position[0], Math.max(0.35, height * 0.5), placement.position[2]],
      distance: Math.max(2.1, height * 2.7),
      lift: 0.38,
    }
  }, [layout, stop?.plantId])

  const goTo = useCallback(
    (next: number) => {
      if (!tour) return
      const clamped = Math.max(0, Math.min(tour.stops.length - 1, next))
      setStep(clamped)
      setFinished(false)
    },
    [tour],
  )

  useEffect(() => {
    if (plant) markVisited(plant.id)
  }, [plant, markVisited])

  // Narrate the stop, then move on when the narration has had time to finish.
  useEffect(() => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    if (!playing || !stop || !tour) return

    const script = `${stop.headline}. ${stop.narration}`
    if (narrationOn && narrator.supported) narrator.speak(script)

    advanceTimer.current = window.setTimeout(() => {
      if (step < tour.stops.length - 1) setStep(step + 1)
      else {
        setPlaying(false)
        completeTour(tour.id)
        setFinished(true)
      }
    }, readingTime(script))

    /* Whatever this effect started, it also puts away. Pausing, muting,
     * reaching the last stop and leaving the page all land here, so none of
     * them can leave a voice talking over a screen that has moved on.
     *
     * This is safe where the old `[narrator]` cleanup was not: every
     * dependency below is real state, so the cleanup fires on genuine
     * transitions rather than on every render. */
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
      narrator.stop()
    }
    // narrator identity changes each render; only the script should re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, stop, tour, narrationOn, completeTour])

  /* There was a `useEffect(() => () => narrator.stop(), [narrator])` here,
   * meant to hush the voice on the way out. useNarrator hands back a fresh
   * object every render, so the dependency changed every render, so the
   * cleanup ran every render — it cancelled the speech it had just started
   * rather than the speech being left behind. The hook already cancels on
   * unmount, which is all this was ever trying to do. */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(step + 1)
      if (e.key === 'ArrowLeft') goTo(step - 1)
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, goTo])

  useEffect(() => {
    if (tour && step === tour.stops.length - 1) completeTour(tour.id)
  }, [tour, step, completeTour])

  if (!tour || !stop || !plant) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">That tour has not been planted yet</h1>
        <Button variant="primary" className="mt-6" onClick={() => navigate('/tours')}>
          See all tours
        </Button>
      </div>
    )
  }

  const isLast = step === tour.stops.length - 1

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GardenScene
        goal={goal}
        selectedId={plant.id}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={(pid) => {
          const index = tour.stops.findIndex((s) => s.plantId === pid)
          if (index >= 0) goTo(index)
        }}
        onSelectBed={() => {}}
        idleSpin={false}
        showLabels={false}
        timeOfDay={timeOfDay}
      />

      {/* -------------- Tour chrome -------------- */}
      {/* Story mode: while the tour plays itself, the frame closes in a
          little and the chrome recedes, so attention goes to the plant. */}
      <AnimatePresence>
        {playing && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 85% at 50% 42%, transparent 45%, color-mix(in srgb, ${tour.accent} 12%, rgb(8 13 10 / 0.62)) 100%)`,
              }}
            />
            <motion.div
              className="absolute inset-x-0 top-0 bg-[#080d0a]"
              initial={{ height: 0 }}
              animate={{ height: '2.75rem' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-[#080d0a]"
              initial={{ height: 0 }}
              animate={{ height: '2.75rem' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="glass pointer-events-auto flex items-center gap-3 rounded-full border border-line py-2 pr-4 pl-2">
          <Link
            to="/tours"
            aria-label="Leave tour"
            className="grid size-8 place-items-center rounded-full bg-sunken text-ink-soft transition-colors hover:text-ink"
          >
            <Icon name="close" size={16} />
          </Link>
          <div className="leading-tight">
            <p className="text-[0.62rem] tracking-[0.14em] uppercase" style={{ color: tour.accent }}>
              {tour.theme}
            </p>
            <p className="font-display text-[0.92rem] font-semibold">{tour.title}</p>
          </div>
        </div>

        <button
          onClick={() => setNarration(!narrationOn)}
          aria-pressed={narrationOn}
          title={narrationOn ? 'Mute narration' : 'Enable narration'}
          className="glass pointer-events-auto grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:text-ink"
        >
          <Icon name={narrationOn ? 'sound' : 'mute'} size={17} />
        </button>
      </div>

      {/* -------------- Narration panel -------------- */}
      {/* -------------- Completion card -------------- */}
      <AnimatePresence>
        {finished && (
          <motion.div
            className="absolute inset-0 z-30 grid place-items-center bg-[rgb(8_13_10/0.72)] p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md overflow-hidden rounded-4xl border border-line bg-raised shadow-[var(--shadow-lift)]"
            >
              <div className="p-6 text-center">
                <span
                  className="mx-auto grid size-12 place-items-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${tour.accent} 18%, transparent)`, color: tour.accent }}
                >
                  <Icon name="check" size={24} />
                </span>
                <p className="mt-3 text-[0.66rem] font-semibold tracking-[0.2em] uppercase" style={{ color: tour.accent }}>
                  Walk complete
                </p>
                <h2 className="mt-1.5 font-display text-2xl leading-tight font-semibold">{tour.title}</h2>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft text-balance-pretty">
                  {tour.stops.length} plants met. They are all in your garden history now — and every one has a full
                  entry waiting.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link to="/tours">
                    <Button variant="primary" size="sm" icon="route">
                      Choose another walk
                    </Button>
                  </Link>
                  <Link to={`/plant/${plant.id}`}>
                    <Button variant="secondary" size="sm" iconRight="arrowRight">
                      Read about {plant.name}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" icon="reset" onClick={() => goTo(0)}>
                    Walk it again
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-19 sm:p-6 md:pb-6">
        <div className="glass pointer-events-auto mx-auto max-w-3xl overflow-hidden rounded-4xl border border-line shadow-[var(--shadow-lift)]">
          {/* Progress rail */}
          <div className="flex gap-1 px-4 pt-3">
            {tour.stops.map((s, i) => (
              <button
                key={s.plantId + i}
                onClick={() => goTo(i)}
                aria-label={`Stop ${i + 1}: ${getPlant(s.plantId)?.name}`}
                className="group h-1.5 flex-1 overflow-hidden rounded-full bg-line"
              >
                <span
                  className="block h-full rounded-full transition-all duration-500"
                  style={{
                    width: i <= step ? '100%' : '0%',
                    background: tour.accent,
                  }}
                />
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4 p-4 sm:p-5"
          >
            <Link
              to={`/plant/${plant.id}`}
              className="hidden size-20 shrink-0 place-items-center rounded-2xl transition-transform hover:scale-105 sm:grid"
              style={{ background: `color-mix(in srgb, ${plant.accent} 15%, transparent)` }}
            >
              <BotanicalPlate plant={plant} className="size-18" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-mono text-[0.7rem] text-ink-faint">
                  {String(step + 1).padStart(2, '0')} / {String(tour.stops.length).padStart(2, '0')}
                </span>
                <h2 className="font-display text-[1.15rem] leading-tight font-semibold">{stop.headline}</h2>
                <Link
                  to={`/plant/${plant.id}`}
                  className="text-[0.78rem] font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
                  style={{ color: plant.accent }}
                >
                  {plant.name}
                </Link>
              </div>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">
                {stop.narration}
              </p>
              {plant.facts[0] && (
                <p className="mt-2.5 flex items-start gap-1.5 text-[0.78rem] leading-relaxed text-ink-faint">
                  <Icon name="sparkle" size={13} className="mt-0.5 shrink-0" style={{ color: plant.accent }} />
                  {plant.facts[0]}
                </p>
              )}
            </div>
          </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 border-t border-line px-4 py-3">
            <Button variant="ghost" size="sm" icon="chevronLeft" onClick={() => goTo(step - 1)} disabled={step === 0}>
              Back
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={playing ? 'pause' : 'play'}
              onClick={() => {
                if (playing) narrator.stop()
                setPlaying((v) => !v)
              }}
              className="px-4"
            >
              {playing ? 'Pause' : 'Play tour'}
            </Button>

            {isLast ? (
              <Link to="/tours" className="ml-auto">
                <Button variant="secondary" size="sm" iconRight="check">
                  Finish
                </Button>
              </Link>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                iconRight="chevronRight"
                className="ml-auto"
                onClick={() => goTo(step + 1)}
              >
                Next stop
              </Button>
            )}
          </div>
        </div>

        <p className={cx('mt-2 text-center text-[0.7rem] text-ink-faint', 'hidden sm:block')}>
          ← → to move between stops · space to play or pause
        </p>
      </div>
    </div>
  )
}
