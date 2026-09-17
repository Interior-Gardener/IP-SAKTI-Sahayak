import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useGarden } from '../store/useGarden'
import { useNarrator } from '../lib/speech'
import { Icon } from './ui/Icon'
import { cx } from './ui/primitives'

/* ------------------------------------------------------------------ *
 * Presentation mode.
 *
 * A hands-free reel of the whole project for when you are talking to a
 * room and cannot also be clicking. Each scene drives the app to a real
 * route — nothing here is a screenshot — narrates a line, and hands on
 * to the next. Press P to start or stop it, space to pause.
 * ------------------------------------------------------------------ */

interface Scene {
  route: string
  eyebrow: string
  caption: string
  /** Spoken aloud when narration is on. Defaults to the caption. */
  say?: string
  seconds: number
}

export const SCENES: Scene[] = [
  {
    route: '/garden',
    eyebrow: 'The garden',
    caption: 'Thirty AYUSH medicinal plants, growing in gardens you can walk through.',
    say: 'Welcome to Vanaspati, a virtual herbal garden. Thirty medicinal plants of the AYUSH tradition, laid out in six themed beds you can walk through.',
    seconds: 11,
  },
  {
    route: '/garden?bed=immunity',
    eyebrow: 'Rasayana Grove',
    caption: 'Six beds, one for each system of the body. The camera flies to whichever you choose.',
    say: 'The beds are arranged by what the plants do. This is the Rasayana Grove — tulsi, giloy, amla and ashwagandha, the herbs of immunity and vitality.',
    seconds: 11,
  },
  {
    route: '/garden?plant=tulsi',
    eyebrow: 'Generated, not downloaded',
    caption: 'Every plant is grown at run time from its written botany. No models, no textures, no photographs.',
    say: 'There is not a single downloaded 3D model in this project. Every leaf, stem and flower is generated from the plant’s botanical description — which is why this tulsi has the square stem of a true mint.',
    seconds: 12,
  },
  {
    route: '/plant/tulsi',
    eyebrow: 'The compendium',
    caption: 'Each entry carries names in six languages, morphology, preparations, cultivation and cautions.',
    say: 'Each plant has a full entry: names in six languages, habitat and morphology, the part that carries the medicine, classical preparations, a cultivation calendar, and the precautions that matter.',
    seconds: 12,
  },
  {
    route: '/plant/tulsi?tab=ayurveda',
    eyebrow: 'Pharmacology as shapes',
    caption: 'The six tastes as a hexagon, potency on a scale, and what the herb does to each dosha.',
    say: 'The Ayurvedic properties are drawn rather than listed. The six tastes become a hexagon, the potency lands on a heating-to-cooling scale, and the doshic effect reads at a glance — so a student learns the shape of a herb, not a paragraph.',
    seconds: 12,
  },
  {
    route: '/atlas',
    eyebrow: 'The Atlas',
    caption: 'The whole collection read as data — geography, therapeutics, pharmacology, conservation.',
    say: 'The Atlas reads the entire compendium as data. Where these plants grow across India, what each one treats, how the tastes and potencies distribute, and how many are now at risk in the wild.',
    seconds: 13,
  },
  {
    route: '/compare?ids=tulsi,brahmi',
    eyebrow: 'The bench',
    caption: 'Two herbs on one set of axes: taste hexagons overlaid, potencies on a shared scale.',
    say: 'Difference teaches faster than description. Tulsi against brahmi: both aromatic, both famous, and almost opposite in what they do to the doshas.',
    seconds: 12,
  },
  {
    route: '/explore',
    eyebrow: 'Search',
    caption: 'Weighted fuzzy search over names, Sanskrit synonyms and symptoms, with six facet groups.',
    say: 'Search runs over botanical names, Sanskrit synonyms and symptoms, so a visitor can start from what is wrong rather than from what a plant is called.',
    seconds: 10,
  },
  {
    route: '/tours',
    eyebrow: 'Guided walks',
    caption: 'Six narrated routes that fly the camera bed to bed and explain the theme.',
    say: 'Six guided walks lead the camera from plant to plant with narration — including one about what happens when a medicine becomes popular enough to be harvested to extinction.',
    seconds: 11,
  },
  {
    route: '/my-garden',
    eyebrow: 'Yours to keep',
    caption: 'Bookmarks, notes and progress, saved on the device. No account, no backend, works offline.',
    say: 'Everything a visitor saves — bookmarks, study notes, progress — lives on their own device. There is no backend, and after the first load the whole garden works offline.',
    seconds: 11,
  },
  {
    route: '/garden',
    eyebrow: 'Vanaspati',
    caption: 'A herbal garden that scales by writing botany, not by modelling it.',
    say: 'Adding the next hundred plants means writing their botany, not modelling them. That is the idea the whole project rests on. Thank you.',
    seconds: 10,
  },
]

export function PresentationMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const navigate = useNavigate()
  const narrator = useNarrator()
  const narrationOn = useGarden((s) => s.narration)
  const scene = SCENES[index]
  const tick = useRef<number | null>(null)

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(SCENES.length - 1, next))
      setIndex(clamped)
      setElapsed(0)
    },
    [],
  )

  // Drive the app to the scene's route and read its line.
  useEffect(() => {
    if (!open) return
    navigate(scene.route)
    if (narrationOn && narrator.supported) narrator.speak(scene.say ?? scene.caption)
    else narrator.stop()
    // narrator identity is stable per render; re-running on it would restart speech.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, navigate, narrationOn])

  // The clock only counts; deciding what to do when a scene runs out is
  // the effect below. Keeping the two apart means the state updater
  // stays pure, which it has to be.
  useEffect(() => {
    if (!open || paused) return
    tick.current = window.setInterval(() => setElapsed((e) => e + 0.1), 100)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [open, paused])

  useEffect(() => {
    if (!open || paused || elapsed < scene.seconds) return
    if (index >= SCENES.length - 1) onClose()
    else go(index + 1)
  }, [open, paused, elapsed, scene.seconds, index, go, onClose])

  useEffect(() => {
    if (open) {
      setIndex(0)
      setElapsed(0)
      setPaused(false)
    } else {
      narrator.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* No `useEffect(() => () => narrator.stop(), [narrator])` here either — the
   * narrator object is rebuilt every render, so that cleanup fired on every
   * render and cut off the line it had just started. Closing is handled by the
   * effect above, and unmounting by the hook itself. */

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, go, onClose])

  if (!open) return null

  const progress = Math.min(1, elapsed / scene.seconds)

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Cinematic edges — enough to frame the app without hiding it. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(130% 100% at 50% 40%, transparent 55%, rgb(6 12 8 / 0.45) 100%)' }}
      />

      {/* Scene index, top left, out of the header's way */}
      <div className="absolute top-20 left-4 flex items-center gap-2 sm:left-6">
        <span className="rounded-full bg-[#080d0a]/80 px-2.5 py-1 font-mono text-[0.68rem] tracking-wider text-white/80 backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')} / {String(SCENES.length).padStart(2, '0')}
        </span>
        {paused && (
          <span className="rounded-full bg-turmeric-500/90 px-2.5 py-1 text-[0.68rem] font-semibold text-black/80">
            Paused
          </span>
        )}
      </div>

      {/* Caption bar */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="pointer-events-auto mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/12 bg-[#080d0a]/88 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="px-5 pt-4 pb-3 sm:px-7"
            >
              <p className="text-[0.64rem] font-semibold tracking-[0.24em] text-[#8fd8a6] uppercase">{scene.eyebrow}</p>
              <p className="mt-1.5 font-display text-[1.05rem] leading-snug font-medium text-white text-balance-pretty sm:text-[1.3rem]">
                {scene.caption}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-1.5 border-t border-white/10 px-4 py-2.5 sm:px-6">
            <button
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous scene"
              className="grid size-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume' : 'Pause'}
              className="grid size-9 place-items-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20"
            >
              <Icon name={paused ? 'play' : 'pause'} size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              disabled={index === SCENES.length - 1}
              aria-label="Next scene"
              className="grid size-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon name="chevronRight" size={16} />
            </button>

            {/* Scene ticks double as a scrubber */}
            <div className="mx-2 flex flex-1 items-center gap-1">
              {SCENES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Scene ${i + 1}`}
                  className="group h-4 flex-1"
                >
                  <span
                    className={cx(
                      'block h-1 w-full overflow-hidden rounded-full transition-colors',
                      i < index ? 'bg-white/55' : 'bg-white/15 group-hover:bg-white/30',
                    )}
                  >
                    {i === index && (
                      <span
                        className="block h-full rounded-full bg-[#8fd8a6] transition-[width] duration-100 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <span className="hidden font-mono text-[0.64rem] text-white/40 lg:inline">space · ← → · esc</span>
            <button
              onClick={onClose}
              className="ml-1 rounded-full border border-white/20 px-3 py-1.5 text-[0.76rem] font-medium text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
