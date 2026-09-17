import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { gardenBeds, getPlant, plants, type GardenBed } from '../data/plants'
import { tours } from '../data/tours'
import { GardenScene, OVERVIEW, type CameraGoal } from '../three/GardenScene'
import { useGardenLayout } from '../three/GardenScene'
import { clockLabel, daylightAt } from '../three/daylight'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Crosshair, Encounter } from '../components/WalkHud'
import { GardenIntro } from '../components/GardenIntro'
import { Icon } from '../components/ui/Icon'
import { Badge, Button, cx } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'
import { useNarrator } from '../lib/speech'

/* ------------------------------------------------------------------ *
 * The garden itself. Everything else in the site is a way back here.
 * ------------------------------------------------------------------ */

function DaylightDial() {
  const timeOfDay = useGarden((s) => s.timeOfDay)
  const setTimeOfDay = useGarden((s) => s.setTimeOfDay)
  const [open, setOpen] = useState(false)
  const light = daylightAt(timeOfDay)
  const night = light.nightness > 0.4

  return (
    <div className="flex items-center gap-2" data-tour="daylight">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="glass overflow-hidden rounded-full border border-line"
          >
            <div className="flex items-center gap-3 py-2 pr-3 pl-4">
              <div className="text-right">
                <p className="font-display text-[0.8rem] leading-none font-semibold">{light.label}</p>
                <p className="mt-0.5 font-mono text-[0.62rem] text-ink-faint">{clockLabel(timeOfDay)}</p>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
                aria-label="Time of day"
                className="h-1.5 w-36 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#243049] via-[#ffd79a] to-[#101d18] accent-[var(--accent)] sm:w-44"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        aria-label="Change the time of day"
        title="Time of day"
        className={cx(
          'glass grid size-10 shrink-0 place-items-center rounded-full border border-line transition-colors',
          open ? 'text-accent' : 'text-ink-soft hover:text-ink',
        )}
      >
        <Icon name={night ? 'moon' : 'sun'} size={17} />
      </button>
    </div>
  )
}

/* The sight on foot. With the pointer locked there is no cursor left to aim
 * with, so the middle of the screen becomes the cursor. It only claims to be
 * a target when it is actually over something — the plant's own floating
 * label supplies the name, so this only has to say that it can be opened. */
export default function Garden() {
  const [params, setParams] = useSearchParams()
  const [goal, setGoal] = useState<CameraGoal>(OVERVIEW)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeBed, setActiveBed] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [walking, setWalking] = useState(false)
  /** The plant being met on foot, if any. */
  const [metId, setMetId] = useState<string | null>(null)

  const layout = useGardenLayout()
  const visited = useGarden((s) => s.visited)
  const bookmarks = useGarden((s) => s.bookmarks)
  const timeOfDay = useGarden((s) => s.timeOfDay)
  const introSeen = useGarden((s) => s.introSeen)
  const setIntroSeen = useGarden((s) => s.setIntroSeen)
  const markVisited = useGarden((s) => s.markVisited)
  const narrationOn = useGarden((s) => s.narration)
  const setNarration = useGarden((s) => s.setNarration)
  // speak and stop keep their identity across renders; the object around them
  // does not, so take the two functions rather than the narrator itself.
  const { speak, stop: hush, speaking } = useNarrator()
  const selected = getPlant(selectedId ?? undefined)
  // On foot this is whatever the crosshair has found rather than the cursor.
  const hovered = getPlant(hoveredId ?? undefined)
  const met = getPlant(metId ?? undefined)

  /* A deep link is an instruction to be somewhere specific, so it outranks
   * the opening titles — presentation mode drives the garden through these
   * and must not have the intro start up underneath it. Decided once, from
   * the query the page was opened with, because the effect below strips
   * that query as soon as it has acted on it. */
  const [introPlaying, setIntroPlaying] = useState(
    () => !introSeen && !params.has('bed') && !params.has('plant'),
  )

  /* A replay from the help menu clears introSeen; pick that up here.
   *
   * What matters is the *transition* from seen to unseen, not the value:
   * reacting to `!introSeen` alone would restart the titles on a first
   * visit that arrived by deep link, and StrictMode's double-invoked
   * effects made that fire even with a guard flag in the way. */
  const wasSeen = useRef(introSeen)
  useEffect(() => {
    const replayed = wasSeen.current && !introSeen
    wasSeen.current = introSeen
    if (replayed) setIntroPlaying(true)
  }, [introSeen])

  /* Walking needs a pointer to lock and a mouse to steer with. Phones and
   * tablets have neither — iOS Safari has no Pointer Lock API at all — so
   * the invitation is only offered where it can be accepted. */
  const canWalk = useMemo(
    () =>
      'pointerLockElement' in document &&
      !window.matchMedia('(pointer: coarse)').matches,
    [],
  )

  /* Mirrored so the exit path can read what you were listening to without
   * changing identity every time you meet something new — the walk controls
   * key their pointer-lock setup off that callback, and churning it would
   * restart the handshake mid-stride. */
  const metRef = useRef<string | null>(null)
  const setMet = useCallback((id: string | null) => {
    metRef.current = id
    setMetId(id)
  }, [])

  const focusBed = useCallback((bed: GardenBed) => {
    setActiveBed(bed.id)
    setSelectedId(null)
    setGoal({ target: [bed.position[0], 0.6, bed.position[1]], distance: 7.4, lift: 0.42 })
  }, [])

  const focusPlant = useCallback(
    (id: string) => {
      const placement = layout.find((p) => p.plant.id === id)
      if (!placement) return
      setSelectedId(id)
      setActiveBed(placement.bed.id)
      const height = placement.plant.model.height * placement.scale
      setGoal({
        target: [placement.position[0], Math.max(0.35, height * 0.5), placement.position[2]],
        distance: Math.max(1.9, height * 2.5),
        lift: 0.4,
      })
    },
    [layout],
  )

  // Deep links: /?bed=mind focuses a bed, /?plant=tulsi walks up to a plant.
  // Presentation mode drives the garden through exactly these.
  useEffect(() => {
    const bedId = params.get('bed')
    const plantId = params.get('plant')
    if (!bedId && !plantId) return

    if (bedId) {
      const bed = gardenBeds.find((b) => b.id === bedId)
      if (bed) focusBed(bed)
    }
    if (plantId) focusPlant(plantId)

    setIntroPlaying(false)
    setIntroSeen(true)
    params.delete('bed')
    params.delete('plant')
    setParams(params, { replace: true })
  }, [params, setParams, focusBed, focusPlant, setIntroSeen])

  const goOverview = () => {
    setActiveBed(null)
    setSelectedId(null)
    setGoal({ ...OVERVIEW })
  }

  const endIntro = useCallback(() => {
    setIntroPlaying(false)
    setIntroSeen(true)
  }, [setIntroSeen])

  const stopWalking = useCallback(() => {
    // The browser holds the lock, not React; unmounting the controls alone
    // would leave the pointer captured with nothing listening to it.
    document.exitPointerLock?.()
    setWalking(false)
    setHoveredId(null)
    hush()
    /* Stepping out mid-encounter lands on the plant you were listening to,
     * with its full card open, rather than dropping you back at the overview
     * having lost the thing you walked over to see. */
    const listening = metRef.current
    setMet(null)
    if (listening) focusPlant(listening)
  }, [hush, setMet, focusPlant])

  /* Stopping in front of a plant. This is a tour stop that nobody scripted:
   * the same card, the same voice, but you chose it by walking there. Meeting
   * the same plant a second time is a request for quiet. */
  const meetPlant = useCallback(
    (id: string) => {
      if (id === metRef.current) {
        setMet(null)
        hush()
        return
      }
      const plant = getPlant(id)
      if (!plant) return
      setMet(id)
      markVisited(id)
      if (narrationOn) speak(`${plant.name}. ${plant.tagline} ${plant.facts[0] ?? ''}`)
      else hush()
    },
    [setMet, hush, markVisited, narrationOn, speak],
  )

  const dismissMet = useCallback(() => {
    if (!metRef.current) return
    setMet(null)
    hush()
  }, [setMet, hush])

  /* Muting from the path. The narration switch lives in the tour chrome,
   * which is not reachable with the pointer locked, so it gets a key. */
  useEffect(() => {
    if (!walking) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyM') return
      e.preventDefault()
      setNarration(!narrationOn)
      if (narrationOn) hush()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [walking, narrationOn, setNarration, hush])

  const idleSpin = !selectedId && !activeBed && introPlaying
  const chromeHidden = introPlaying || walking

  return (
    <div className="relative h-full w-full overflow-hidden" data-tour="garden-canvas">
      <GardenScene
        goal={goal}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        // On foot a plant is met where it stands; at the desk it is opened.
        onSelect={walking ? meetPlant : focusPlant}
        onSelectBed={focusBed}
        idleSpin={idleSpin}
        showLabels={showLabels && !selectedId && !chromeHidden}
        timeOfDay={timeOfDay}
        walking={walking}
        onWalkExit={stopWalking}
        onWalkDismiss={dismissMet}
      />

      {/* A soft vignette over the canvas. The chrome floats on top of a live
          3D scene, and without something to sit on it reads as stickers on a
          photograph — this gives the frame edges just enough weight. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 42%, transparent 46%, color-mix(in srgb, var(--surface-inverse) 16%, transparent) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ---------------- Cinematic opening ---------------- */}
      {introPlaying && (
        <GardenIntro
          onBeat={setGoal}
          onFinish={endIntro}
          onWalkthrough={() => {
            endIntro()
            window.dispatchEvent(new CustomEvent('vanaspati:walkthrough'))
          }}
        />
      )}

      {/* ---------------- On foot ---------------- */}
      {walking && (
        <>
          <Crosshair aimed={hovered} open={!!hovered && hovered.id === metId} />
          <AnimatePresence mode="wait">
            {met ? (
              <Encounter key={met.id} plant={met} speaking={speaking} />
            ) : (
              /* The keys only need saying while there is nothing else to
                 read; once a plant is talking, the card carries its own. */
              <motion.p
                key="keys"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="glass pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-line px-4 py-2 text-[0.76rem] whitespace-nowrap text-ink-soft"
              >
                <kbd className="font-mono font-semibold text-ink">WASD</kbd> to walk ·{' '}
                <kbd className="font-mono font-semibold text-ink">Shift</kbd> to hurry ·{' '}
                <kbd className="font-mono font-semibold text-ink">Esc</kbd> to step back out
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}

      {!chromeHidden && (
        <>
          {/* ---------------- Bed navigator ---------------- */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-19 sm:p-5 md:pb-5">
            <div
              className="scrollbar-none pointer-events-auto mx-auto flex max-w-full items-center gap-2 overflow-x-auto pb-1"
              data-tour="bed-rail"
            >
              <button
                onClick={goOverview}
                className={cx(
                  'glass flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[0.8rem] font-medium transition-colors',
                  !activeBed ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
                )}
              >
                <Icon name="map" size={15} />
                Whole garden
              </button>
              {gardenBeds.map((bed) => {
                const seen = bed.plantIds.filter((id) => visited.includes(id)).length
                return (
                  <button
                    key={bed.id}
                    onClick={() => focusBed(bed)}
                    className={cx(
                      'glass flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.8rem] font-medium whitespace-nowrap transition-all',
                      activeBed === bed.id ? 'border-transparent text-white' : 'border-line text-ink-soft hover:text-ink',
                    )}
                    style={activeBed === bed.id ? { background: bed.accent } : undefined}
                  >
                    <span className="size-2 rounded-full" style={{ background: bed.accent }} />
                    {bed.name}
                    <span
                      className={cx(
                        'text-[0.7rem] tabular-nums',
                        activeBed === bed.id ? 'opacity-75' : 'text-ink-faint',
                      )}
                    >
                      {seen}/{bed.plantIds.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---------------- Utility controls ---------------- */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
            <DaylightDial />
            {canWalk && (
              <button
                onClick={() => setWalking(true)}
                title="Walk in (WASD)"
                aria-label="Walk into the garden"
                className="glass grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:text-accent"
              >
                <Icon name="compass" size={17} />
              </button>
            )}
            {!selected && (
              <button
                onClick={() => setShowLabels((v) => !v)}
                aria-pressed={showLabels}
                title="Toggle bed signs"
                className="glass grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:text-ink"
              >
                <Icon name={showLabels ? 'eye' : 'layers'} size={17} />
              </button>
            )}
          </div>

          {!selected && (
            <p className="glass pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-line px-3.5 py-1.5 text-[0.74rem] text-ink-faint sm:top-6">
              Click a plant to meet it · drag to look around
            </p>
          )}

          {/* ---------------- Quick links ---------------- */}
          {!selected && !activeBed && (
            <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 sm:top-20">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="pointer-events-auto flex flex-wrap items-center justify-center gap-2"
              >
                <Link to={`/tours/${tours[0].id}`}>
                  <span className="glass inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.76rem] font-medium text-ink-soft transition-colors hover:text-ink">
                    <Icon name="route" size={14} />
                    Take a guided walk
                  </span>
                </Link>
                <Link to="/atlas">
                  <span className="glass inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.76rem] font-medium text-ink-soft transition-colors hover:text-ink">
                    <Icon name="layers" size={14} />
                    See all {plants.length} as data
                  </span>
                </Link>
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* ---------------- Selected plant panel ---------------- */}
      <AnimatePresence>
        {selected && !chromeHidden && (
          <motion.aside
            key={selected.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-3 bottom-36 z-20 md:inset-x-auto md:top-24 md:right-6 md:bottom-auto md:w-[22rem]"
          >
            <div className="glass overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
              <div className="flex items-start gap-3 p-4">
                <span
                  className="grid size-16 shrink-0 place-items-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${selected.accent} 16%, transparent)` }}
                >
                  <BotanicalPlate plant={selected} className="size-14" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg leading-tight font-semibold">{selected.name}</h2>
                  <p className="truncate text-[0.76rem] text-ink-faint italic">{selected.botanical}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selected.therapeutic.slice(0, 2).map((t) => (
                      <Badge key={t} tone={selected.accent}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedId(null)
                    const bed = gardenBeds.find((b) => b.id === activeBed)
                    if (bed) focusBed(bed)
                    else goOverview()
                  }}
                  aria-label="Close"
                  className="text-ink-faint transition-colors hover:text-ink"
                >
                  <Icon name="close" size={17} />
                </button>
              </div>

              <p className="px-4 pb-3 text-[0.85rem] leading-relaxed text-ink-soft text-balance-pretty">
                {selected.tagline}
              </p>

              <dl className="grid grid-cols-2 gap-px border-y border-line bg-line">
                <div className="bg-[var(--surface-raised)] px-4 py-2.5">
                  <dt className="text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase">Parts used</dt>
                  <dd className="truncate text-[0.82rem]">{selected.partsUsed.slice(0, 2).join(', ')}</dd>
                </div>
                <div className="bg-[var(--surface-raised)] px-4 py-2.5">
                  <dt className="text-[0.62rem] tracking-[0.1em] text-ink-faint uppercase">Potency</dt>
                  <dd className="truncate text-[0.82rem]">{selected.ayurvedic.virya}</dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 p-3">
                <Link to={`/plant/${selected.id}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full" iconRight="arrowRight">
                    Full entry
                  </Button>
                </Link>
                <Link to={`/compare?ids=${selected.id}`}>
                  <Button variant="secondary" size="sm" icon="layers" aria-label="Compare this plant" />
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="bookmark"
                  solidIcon={bookmarks.includes(selected.id)}
                  onClick={() => useGarden.getState().toggleBookmark(selected.id)}
                  aria-label="Save to My Garden"
                />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
