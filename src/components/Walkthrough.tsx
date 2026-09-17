import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useGarden } from '../store/useGarden'
import { Icon } from './ui/Icon'
import { cx } from './ui/primitives'

/* ------------------------------------------------------------------ *
 * The guided walkthrough.
 *
 * A spotlight tour that crosses routes: each step names the page it
 * lives on and a `data-tour` handle on the element it points at. If the
 * handle never appears — a narrow viewport hides it, say — the step
 * falls back to a centred card rather than stalling the tour.
 * ------------------------------------------------------------------ */

interface Step {
  id: string
  route: string
  /** The `data-tour` value of the element to spotlight. */
  handle?: string
  title: string
  body: string
  /** Extra breathing room around the cut-out, in px. */
  pad?: number
}

export const WALKTHROUGH_STEPS: Step[] = [
  {
    id: 'garden',
    route: '/',
    handle: 'bed-rail',
    title: 'Start in the garden',
    body: 'Six beds, each planted for one system of the body. Tap a bed to fly the camera to it — or drag anywhere in the scene to look around freely.',
    pad: 10,
  },
  {
    id: 'daylight',
    route: '/',
    handle: 'daylight',
    title: 'Move the sun',
    body: 'The garden is lit in real time. Drag the hour through dawn, noon and dusk — after sunset the fireflies come out.',
  },
  {
    id: 'search',
    route: '/',
    handle: 'search',
    title: 'Find anything, fast',
    body: 'Search by name, by Sanskrit synonym, or by the symptom you are trying to treat. ⌘K opens it from any page.',
  },
  {
    id: 'facets',
    route: '/explore',
    handle: 'facets',
    title: 'Filter the compendium',
    body: 'Narrow by what a plant treats, which part carries the medicine, where it grows, or how threatened it is in the wild.',
    pad: 8,
  },
  {
    id: 'fingerprint',
    route: '/plant/tulsi?tab=ayurveda',
    handle: 'fingerprint',
    title: 'Read a plant as shapes',
    body: 'Every entry draws its own Ayurvedic fingerprint: the six tastes as a hexagon, potency on a heating-to-cooling scale, and what it does to each dosha.',
    pad: 8,
  },
  {
    id: 'specimen',
    route: '/plant/tulsi',
    handle: 'specimen',
    title: 'Inspect the specimen',
    body: 'The 3D model is generated from this plant’s own botanical description — the square stem is a real Lamiaceae trait, not decoration. Tap a labelled hotspot to see which part is used.',
    pad: 6,
  },
  {
    id: 'atlas',
    route: '/atlas',
    handle: 'atlas-map',
    title: 'See the whole collection',
    body: 'The Atlas reads the compendium as data — where these plants grow, what they treat, how they taste, and how many are at risk in the wild.',
    pad: 8,
  },
  {
    id: 'tours',
    route: '/tours',
    handle: 'tour-list',
    title: 'Let a walk lead you',
    body: 'Six narrated routes fly the camera bed to bed and explain why each plant belongs to the theme. Start with First Steps.',
    pad: 8,
  },
  {
    id: 'my-garden',
    route: '/my-garden',
    handle: 'progress',
    title: 'Everything you save lives here',
    body: 'Bookmarks, notes and progress — kept on your own device, no account required. That is also where you can replay this walkthrough.',
    pad: 8,
  },
]

const MARGIN = 14
const CARD_W = 340

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function useSpotlight(handle: string | undefined, stepId: string, ready: boolean) {
  const [rect, setRect] = useState<Rect | null>(null)

  // A handle can appear more than once — the same control rendered for
  // desktop and for mobile — so take the first one actually on screen.
  const find = useCallback(() => {
    if (!handle) return null
    const nodes = [...document.querySelectorAll<HTMLElement>(`[data-tour="${handle}"]`)]
    return (
      nodes.find((node) => {
        const box = node.getBoundingClientRect()
        return box.width > 4 && box.height > 4
      }) ?? null
    )
  }, [handle])

  const measure = useCallback(() => {
    const el = find()
    if (!el) return null
    const box = el.getBoundingClientRect()
    return { top: box.top, left: box.left, width: box.width, height: box.height }
  }, [find])

  useLayoutEffect(() => {
    setRect(null)
    if (!handle || !ready) return

    let raf = 0
    const deadline = performance.now() + 2600
    const hunt = () => {
      const el = find()
      if (el) {
        // Bring it into view first; the next frame measures where it landed.
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        raf = requestAnimationFrame(() => {
          setRect(measure())
          // A smooth scroll takes a moment to settle — re-measure after it.
          window.setTimeout(() => setRect(measure()), 420)
        })
        return
      }
      if (performance.now() < deadline) raf = requestAnimationFrame(hunt)
    }
    raf = requestAnimationFrame(hunt)
    return () => cancelAnimationFrame(raf)
  }, [handle, stepId, ready, measure, find])

  useEffect(() => {
    if (!rect) return
    const update = () => setRect(measure())
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [rect, measure])

  return rect
}

/** Puts the card beside the cut-out, preferring below, and clamps to the viewport. */
function cardPosition(rect: Rect | null): { top: number; left: number; centred: boolean } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!rect) return { top: vh / 2 - 110, left: vw / 2 - CARD_W / 2, centred: true }

  const below = rect.top + rect.height + MARGIN
  const above = rect.top - MARGIN
  const roomBelow = vh - below
  const cardH = 210

  let top: number
  if (roomBelow > cardH + 20) top = below
  else if (above > cardH + 20) top = above - cardH
  else top = Math.max(MARGIN, Math.min(vh - cardH - MARGIN, rect.top))

  const left = Math.max(
    MARGIN,
    Math.min(vw - CARD_W - MARGIN, rect.left + rect.width / 2 - CARD_W / 2),
  )
  return { top, left, centred: false }
}

export function Walkthrough({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const setWalkthroughSeen = useGarden((s) => s.setWalkthroughSeen)
  const [routeReady, setRouteReady] = useState(false)
  const step = WALKTHROUGH_STEPS[index]

  // Reset to the first step whenever the tour is opened afresh.
  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  // Move to the step's page, then give the route a beat to mount. A step
  // may name a query too (a plant page opened on a particular tab), so
  // path and query are compared separately.
  useEffect(() => {
    if (!open) return
    setRouteReady(false)
    const [path, search = ''] = step.route.split('?')
    const here = location.pathname === path && (!search || location.search === `?${search}`)
    if (!here) navigate(step.route)
    const timer = window.setTimeout(() => setRouteReady(true), 300)
    return () => window.clearTimeout(timer)
  }, [open, step.route, index, navigate, location.pathname, location.search])

  const rect = useSpotlight(step?.handle, step?.id ?? '', open && routeReady)

  const finish = useCallback(
    (completed: boolean) => {
      setWalkthroughSeen(true)
      onClose()
      if (completed) navigate('/')
    },
    [onClose, setWalkthroughSeen, navigate],
  )

  const next = useCallback(() => {
    if (index >= WALKTHROUGH_STEPS.length - 1) finish(true)
    else setIndex((i) => i + 1)
  }, [index, finish])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false)
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next, finish])

  if (!open || !step) return null

  const pad = step.pad ?? 6
  const pos = cardPosition(rect)
  const progress = (index + 1) / WALKTHROUGH_STEPS.length

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Guided walkthrough">
      {/* Dimmer with a cut-out. Pointer events stay on it so a stray click
          during the tour doesn't navigate the visitor somewhere unexpected. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="walkthrough-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <motion.rect
                initial={false}
                animate={{
                  x: rect.left - pad,
                  y: rect.top - pad,
                  width: rect.width + pad * 2,
                  height: rect.height + pad * 2,
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                rx={18}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgb(6 12 8 / 0.72)" mask="url(#walkthrough-mask)" />
      </svg>

      {/* Ring around the spotlit element */}
      {rect && (
        <motion.div
          className="pointer-events-none absolute rounded-[18px] ring-2 ring-[var(--accent)]"
          initial={false}
          animate={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ boxShadow: '0 0 0 6px color-mix(in srgb, var(--accent) 18%, transparent)' }}
        />
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={cx(
            'absolute overflow-hidden rounded-3xl border border-line bg-raised shadow-[var(--shadow-lift)]',
            pos.centred && 'ring-1 ring-[var(--accent)]/30',
          )}
          style={{ top: pos.top, left: pos.left, width: CARD_W }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-[0.68rem] font-semibold text-[var(--surface-raised)] tabular-nums">
                {index + 1}
              </span>
              <span className="text-[0.66rem] font-semibold tracking-[0.16em] text-ink-faint uppercase">
                Walkthrough · {index + 1} of {WALKTHROUGH_STEPS.length}
              </span>
              <button
                onClick={() => finish(false)}
                aria-label="End walkthrough"
                className="ml-auto text-ink-faint transition-colors hover:text-ink"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <h3 className="mt-3 font-display text-[1.15rem] leading-tight font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink-soft text-balance-pretty">{step.body}</p>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-ink-faint transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-35"
              >
                Back
              </button>
              <button
                onClick={() => finish(false)}
                className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-ink-faint transition-colors hover:text-ink"
              >
                Skip
              </button>
              <button
                onClick={next}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[0.82rem] font-medium text-[var(--surface-raised)] transition-all hover:brightness-110 active:scale-[0.97]"
              >
                {index === WALKTHROUGH_STEPS.length - 1 ? 'Finish' : 'Next'}
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>

          <div className="h-1 bg-sunken">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
