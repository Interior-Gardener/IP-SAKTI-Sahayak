import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  MedicinalGardenScene,
  PLAQUE_ART,
  PLAQUE_ART_H,
  PLAQUE_ART_W,
  PLAQUE_BOARD_ID,
  type BoardRead,
  type PlaqueRead,
} from '../three/MedicinalGardenScene'
import { Crosshair, Encounter } from '../components/WalkHud'
import { BoardCard, BOARD_ART } from '../components/BoardCard'
import { BED_PLOTS, PLAQUE, POND_PLANT } from '../data/medicinalGarden'
import { getPlant } from '../data/plants'
import { Icon } from '../components/ui/Icon'
import { Button, cx } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'
import { useNarrator } from '../lib/speech'

/* ------------------------------------------------------------------ *
 * The medicinal garden, walked rather than browsed.
 *
 * Deliberately quieter chrome than the main garden: no bed rail, no
 * cinematic opening. You come in at the gate, and the garden is the
 * thing. Everything else is one line of help and a way back out.
 * ------------------------------------------------------------------ */

export default function MedicinalGarden() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [walking, setWalking] = useState(false)
  /* placeBoard runs outside React's render, so it reads walk mode from a ref. */
  const walkingRef = useRef(false)
  const [metId, setMetId] = useState<string | null>(null)
  const [canWalk, setCanWalk] = useState(false)

  const timeOfDay = useGarden((s) => s.timeOfDay)
  const markVisited = useGarden((s) => s.markVisited)
  const narrationOn = useGarden((s) => s.narration)
  const { speak, stop: hush, speaking } = useNarrator()

  const selected = getPlant(selectedId ?? undefined)
  const hovered = getPlant(hoveredId ?? undefined)
  const met = getPlant(metId ?? undefined)

  /* ---------------- The label boards, read on hover ----------------
   * Hold the pointer on any bed's board and the printed card it stands
   * for is raised over the scene: the board artwork with this plant's
   * names, properties and photographs set into it.
   *
   * The card is hung off the pointer by writing a transform straight
   * onto the node rather than by holding the position in state — the
   * boards report on every pointer move, and re-rendering the canvas
   * that often would cost more than the card is worth. State changes
   * only when the pointer crosses onto a different board. */
  const [boardId, setBoardId] = useState<string | null>(null)
  const boardIdRef = useRef<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const board = getPlant(boardId ?? undefined)

  const placeBoard = useCallback(() => {
    const el = boardRef.current
    if (!el) return
    if (walkingRef.current) {
      // Pointer-locked: there is no pointer to sit beside, so the card takes
      // the middle of the screen where the crosshair already is.
      const left = Math.max(12, (window.innerWidth - el.offsetWidth) / 2)
      const top = Math.max(12, (window.innerHeight - el.offsetHeight) / 2)
      el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`
      return
    }
    const margin = 14
    const gap = 24
    const w = el.offsetWidth
    const h = el.offsetHeight
    const { x, y } = pointerRef.current
    // Beside the pointer, flipping to its other side rather than running
    // off the edge, and never pushed out of the window on either axis.
    let left = x + gap
    if (left + w > window.innerWidth - margin) left = x - gap - w
    const maxLeft = Math.max(margin, window.innerWidth - w - margin)
    const maxTop = Math.max(margin, window.innerHeight - h - margin)
    left = Math.min(Math.max(left, margin), maxLeft)
    const top = Math.min(Math.max(y - h / 2, margin), maxTop)
    el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`
  }, [])

  const readBoard = useCallback<BoardRead>(
    (id, clientX, clientY) => {
      if (id !== null && clientX !== undefined && clientY !== undefined) {
        pointerRef.current = { x: clientX, y: clientY }
        placeBoard()
      }
      if (boardIdRef.current === id) return
      boardIdRef.current = id
      setBoardId(id)
    },
    [placeBoard],
  )

  /* Hovering the dedication plaque raises the photograph of it, full size
   * and beside the pointer — the same gesture and the same frame as a bed's
   * board, because on the ground it is the same act: standing close enough
   * to read the thing. */
  const readPlaque = useCallback<PlaqueRead>(
    (on, clientX, clientY) => {
      if (on && clientX !== undefined && clientY !== undefined) {
        pointerRef.current = { x: clientX, y: clientY }
        placeBoard()
      }
      const next = on ? PLAQUE_BOARD_ID : null
      if (boardIdRef.current === next) return
      boardIdRef.current = next
      setBoardId(next)
    },
    [placeBoard],
  )

  /* The card mounts with the pointer already somewhere, so it has to be
   * put in place before the browser paints it. */
  useLayoutEffect(() => {
    if (boardId) placeBoard()
  }, [boardId, placeBoard])

  /* On foot the pointer is locked away, so a board is read by putting the
   * crosshair on it and clicking: the same card, parked in the middle of the
   * screen because there is no pointer to hang it beside. Clicking it again,
   * or clicking anything else, puts it down. */
  const [aimedBoardId, setAimedBoardId] = useState<string | null>(null)
  const readBoardOnFoot = useCallback((id: string) => {
    setBoardId((current) => {
      const next = current === id ? null : id
      boardIdRef.current = next
      return next
    })
  }, [])

  const aimedBoard = getPlant(aimedBoardId ?? undefined)
  /* The plaque names no plant, so it travels through the boards' machinery
   * under a sentinel id and is picked back out here. */
  const aimedPlaque = aimedBoardId === PLAQUE_BOARD_ID
  const plaqueUp = boardId === PLAQUE_BOARD_ID
  /* The sight only wants a colour, and the plaque's is the garden's own. */
  const aimedSight = aimedBoard ?? (aimedPlaque ? { accent: '#c7b299' } : undefined)

  const clearBoard = useCallback(() => {
    boardIdRef.current = null
    setBoardId(null)
  }, [])

  /* The artwork is the one heavy thing on this page; fetch it while the
   * garden is being looked at rather than on the first hover. */
  useEffect(() => {
    const art = new Image()
    art.src = BOARD_ART
  }, [])

  // The lotus grows in the pond rather than a bed, so it has to be counted
  // separately or the garden undersells itself by one.
  const species = useMemo(
    () => new Set([...BED_PLOTS.flatMap((plot) => plot.plantIds), POND_PLANT]),
    [],
  )

  /* Walking wants a pointer to lock and a mouse to steer with, which a
   * phone has neither of. Same test the main garden makes. */
  useEffect(() => {
    const pointer = window.matchMedia('(pointer: fine)').matches
    setCanWalk(pointer && 'requestPointerLock' in HTMLElement.prototype)
  }, [])

  const meetPlant = useCallback(
    (id: string) => {
      setMetId(id)
      markVisited(id)
      const plant = getPlant(id)
      if (plant && narrationOn) speak(`${plant.name}. ${plant.tagline}`)
    },
    [markVisited, narrationOn, speak],
  )

  const openPlant = useCallback(
    (id: string) => {
      setSelectedId(id)
      markVisited(id)
    },
    [markVisited],
  )

  /* placeBoard is called outside render, so walk mode is mirrored here. */
  useEffect(() => {
    walkingRef.current = walking
  }, [walking])

  const stopWalking = useCallback(() => {
    setWalking(false)
    setMetId(null)
    setAimedBoardId(null)
    boardIdRef.current = null
    setBoardId(null)
    hush()
  }, [hush])

  /* Esc while a plant is talking takes you to its full entry, the same
   * bargain the main garden strikes. */
  useEffect(() => {
    if (!walking) return
    const key = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') hush()
      if (e.code === 'Escape' && metId) navigate(`/plant/${metId}`)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [walking, metId, hush, navigate])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MedicinalGardenScene
        selectedId={selectedId}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={walking ? meetPlant : openPlant}
        timeOfDay={timeOfDay}
        walking={walking}
        onWalkExit={stopWalking}
        onWalkDismiss={() => {
          setMetId(null)
          clearBoard()
        }}
        onBoardRead={readBoard}
        onPlaqueRead={readPlaque}
        onBoardAim={setAimedBoardId}
        onBoardSelect={readBoardOnFoot}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 42%, transparent 46%, color-mix(in srgb, var(--surface-inverse) 16%, transparent) 100%)',
        }}
        aria-hidden="true"
      />

      {walking ? (
        <>
          {/* A board under the crosshair takes the sight over from the plant
              behind it: what a click does here is read, not meet. */}
          <Crosshair
            aimed={aimedSight ?? hovered}
            open={!!hovered && hovered.id === metId}
            label={
              aimedBoard || aimedPlaque
                ? boardId === aimedBoardId
                  ? 'Click to put down'
                  : 'Click to read'
                : undefined
            }
          />
          <AnimatePresence mode="wait">
            {met ? (
              <Encounter key={met.id} plant={met} speaking={speaking} />
            ) : (
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
      ) : (
        <>
          {/* ---------------- Identity ---------------- */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-6">
            <div className="glass pointer-events-auto inline-flex max-w-full flex-col rounded-3xl border border-line px-4 py-3">
              <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-accent uppercase">
                {PLAQUE.subtitle.replace(/[()]/g, '')}
              </p>
              <h1 className="mt-1 font-display text-[1.35rem] leading-none font-semibold tracking-[-0.02em]">
                {PLAQUE.title}
                <span className="ml-2 text-[0.95rem] font-normal text-ink-soft">{PLAQUE.devanagari}</span>
              </h1>
              <p className="mt-1.5 text-[0.72rem] text-ink-faint">
                Ayurvedic herb garden · {species.size} species in {BED_PLOTS.length} beds
                and the pond
              </p>
            </div>
          </div>

          {/* ---------------- Controls ---------------- */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-3 p-4 pb-19 sm:p-6 md:pb-6">
            <div className="glass pointer-events-auto max-w-sm rounded-3xl border border-line px-4 py-3 text-[0.78rem] leading-relaxed text-ink-soft">
              The garden as it is laid out on the ground: the gate at the south, the spine running
              north between four ranks of beds, and the lily pond closing the far end. Click any
              specimen to open its entry.
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" icon="arrowLeft">
                  Both gardens
                </Button>
              </Link>
              {canWalk && (
                <Button
                  onClick={() => {
                    // The pointer is about to be locked away, so nothing
                    // would be left to clear a card standing open.
                    clearBoard()
                    setWalking(true)
                  }}
                  icon="compass"
                >
                  Walk in
                </Button>
              )}
            </div>
          </div>

          {/* ---------------- Selected specimen ---------------- */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-24 right-4 bottom-24 z-20 w-[min(20rem,calc(100vw-2rem))] sm:right-6"
              >
                <div className="glass flex h-full flex-col rounded-3xl border border-line p-4 shadow-[var(--shadow-lift)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg leading-tight font-semibold">{selected.name}</h2>
                      <p className="text-[0.78rem] text-ink-faint italic">{selected.botanical}</p>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="rounded-full p-1 text-ink-faint transition-colors hover:text-ink"
                      aria-label="Close"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <p className="mt-2.5 text-[0.85rem] leading-relaxed text-ink-soft">{selected.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.therapeutic.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2 py-0.5 text-[0.68rem] font-medium"
                        style={{
                          background: `color-mix(in srgb, ${selected.accent} 14%, transparent)`,
                          color: `color-mix(in srgb, ${selected.accent} 78%, var(--ink))`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-3">
                    <Link to={`/plant/${selected.id}`}>
                      <Button className="w-full" iconRight="arrowRight">
                        Full entry
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* The board being read. The frame stays mounted so its transform
          survives between cards and can be set before the card appears. */}
      <div
        ref={boardRef}
        className="pointer-events-none fixed top-0 left-0 z-30"
        style={{
          /* The bed boards are landscape and the plaque is a tall portrait,
             so they cannot share one width — a width that suits the boards
             would stand the plaque taller than the window. It is the board
             that names the whole garden, though, so it is given as much
             height as the window will spare: the width below is set from
             the height it works out at, the art being roughly 1:1.75. */
          width: plaqueUp ? 'clamp(14rem, 46vh, 30rem)' : 'clamp(19rem, 52vw, 44rem)',
          willChange: 'transform',
        }}
      >
        <AnimatePresence>
          {plaqueUp ? (
            <motion.img
              key="plaque"
              src={PLAQUE_ART}
              alt={`${PLAQUE.title} — ${PLAQUE.subtitle.replace(/[()]/g, '')}, ${PLAQUE.opened.toLowerCase()}`}
              initial={{ opacity: 0, scale: 0.965 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full rounded-[6px] shadow-[0_28px_64px_-22px_rgb(0_0_0/0.6)]"
              /* The frame is put in place before the browser paints, and it is
                 measured to do it. An image has no height until it has decoded,
                 so without the art's own ratio declared here the card measures
                 as nothing, sits where the pointer is rather than centred on
                 it, and hangs off the bottom of the window. */
              style={{ aspectRatio: `${PLAQUE_ART_W} / ${PLAQUE_ART_H}` }}
            />
          ) : board ? (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, scale: 0.965 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <BoardCard
                plant={board}
                className="overflow-hidden rounded-[6px] shadow-[0_28px_64px_-22px_rgb(0_0_0/0.6)]"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* A plant met on foot, once the pointer is back. */}
      <div className={cx('pointer-events-none', walking && 'hidden')} aria-hidden />
    </div>
  )
}
