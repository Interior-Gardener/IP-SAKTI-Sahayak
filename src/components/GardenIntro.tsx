import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { OVERVIEW, type CameraGoal } from '../three/GardenScene'
import { plants, gardenBeds } from '../data/plants'
import { tours } from '../data/tours'
import { Button } from './ui/primitives'
import { useCalmMotion } from './motion/Reveal'

/* ------------------------------------------------------------------ *
 * The cinematic opening.
 *
 * Rather than a rendered video, the titles play over the live garden:
 * each beat hands the camera rig a new goal and the rig flies there.
 * So the first thing a visitor sees is the real scene, already moving —
 * and skipping the intro leaves them exactly where the camera stopped.
 * ------------------------------------------------------------------ */

export interface IntroBeat {
  goal: CameraGoal
  /** How long this beat holds, in milliseconds. */
  hold: number
  eyebrow?: string
  title?: string
  body: string
}

const grove = gardenBeds.find((b) => b.id === 'immunity') ?? gardenBeds[0]
const terrace = gardenBeds.find((b) => b.id === 'skin') ?? gardenBeds[2]

export const INTRO_BEATS: IntroBeat[] = [
  {
    // Low enough to keep the horizon and a band of sky in frame; a steep
    // establishing shot fills the screen with ground and reads as a diagram.
    goal: { target: [0, 1.2, 0], distance: 30, lift: 0.3, bearing: Math.PI * 0.25, speed: 0.55 },
    hold: 5200,
    eyebrow: 'A virtual herbal garden',
    title: 'Vanaspati',
    body: `${plants.length} medicinal plants of the AYUSH tradition, planted in a garden you can walk through.`,
  },
  {
    goal: {
      target: [grove.position[0], 0.7, grove.position[1]],
      distance: 9.5,
      lift: 0.34,
      speed: 0.7,
    },
    hold: 5000,
    eyebrow: 'Six themed beds',
    body: 'The garden is laid out the way a teaching garden is — one bed for each system of the body, so walking between them is itself a lesson.',
  },
  {
    goal: { target: [terrace.position[0], 0.55, terrace.position[1]], distance: 4.6, lift: 0.22, speed: 0.85 },
    hold: 5000,
    eyebrow: 'Grown, not downloaded',
    body: 'There is not a single 3D model or photograph in this project. Every leaf, stem and flower is generated at run time from the plant’s written botany.',
  },
  {
    goal: { ...OVERVIEW, speed: 0.7 },
    hold: 60_000,
    eyebrow: 'Ready when you are',
    title: 'Step into the garden',
    body: 'Drag to look around, click any plant to meet it, or let a guided walk take you.',
  },
]

export function GardenIntro({
  onBeat,
  onFinish,
  onWalkthrough,
}: {
  onBeat: (goal: CameraGoal) => void
  onFinish: () => void
  onWalkthrough: () => void
}) {
  const [index, setIndex] = useState(0)
  const calm = useCalmMotion()
  const beat = INTRO_BEATS[index]
  const isLast = index === INTRO_BEATS.length - 1

  // Each beat drives the camera, then hands over to the next.
  useEffect(() => {
    onBeat(INTRO_BEATS[index].goal)
    if (index === INTRO_BEATS.length - 1) return
    const timer = window.setTimeout(() => setIndex((i) => i + 1), INTRO_BEATS[index].hold)
    return () => window.clearTimeout(timer)
  }, [index, onBeat])

  // Any key press other than the obvious ones dismisses it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish()
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setIndex((i) => Math.min(INTRO_BEATS.length - 1, i + 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFinish])

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Letterbox */}
      <motion.div
        className="absolute inset-x-0 top-0 bg-[#080d0a]"
        initial={{ height: calm ? '4.5rem' : '50%' }}
        animate={{ height: '4.5rem' }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-[#080d0a]"
        initial={{ height: calm ? '4rem' : '50%' }}
        animate={{ height: '4rem' }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Vignette over the live scene */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 42%, rgb(8 13 10 / 0.6) 100%)' }}
      />

      {/* A scrim under the copy. The garden can be a bright noon sky, so the
          titles need their own ground rather than borrowing the vignette's. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[62%]"
        style={{ background: 'linear-gradient(to top, #080d0a 22%, rgb(8 13 10 / 0.88) 46%, transparent 100%)' }}
      />

      {/* Skip */}
      <div className="pointer-events-auto absolute top-4 right-4 z-10 flex items-center gap-2 sm:top-5 sm:right-6">
        <span className="hidden text-[0.7rem] tracking-wide text-white/45 sm:inline">space to advance</span>
        <button
          onClick={onFinish}
          className="rounded-full border border-white/20 px-3.5 py-1.5 text-[0.78rem] font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white"
        >
          Skip intro
        </button>
      </div>

      {/* Beat ticks */}
      <div className="absolute top-4 left-4 z-10 flex gap-1.5 sm:top-5 sm:left-6">
        {INTRO_BEATS.map((_, i) => (
          <span
            key={i}
            className="h-0.5 w-7 overflow-hidden rounded-full bg-white/20"
            aria-hidden="true"
          >
            <motion.span
              className="block h-full bg-white/85"
              initial={false}
              animate={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
              transition={{ duration: i === index && !isLast ? INTRO_BEATS[i].hold / 1000 : 0.3, ease: 'linear' }}
            />
          </span>
        ))}
      </div>

      {/* Copy */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-10 sm:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            {beat.eyebrow && (
              <p className="text-[0.66rem] font-semibold tracking-[0.28em] text-[#8fd8a6] uppercase">{beat.eyebrow}</p>
            )}
            {beat.title && (
              <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,5.5rem)] leading-[0.9] font-semibold tracking-[-0.04em] text-white">
                {beat.title}
              </h1>
            )}
            <p
              className={`mx-auto max-w-xl text-balance-pretty text-white/80 ${
                beat.title ? 'mt-3 text-[0.95rem] sm:text-[1.05rem]' : 'mt-2.5 text-[1rem] leading-relaxed sm:text-[1.15rem]'
              }`}
            >
              {beat.body}
            </p>

            {isLast && (
              <motion.div
                className="pointer-events-auto mt-5 flex flex-wrap items-center justify-center gap-2.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                <Button variant="primary" icon="compass" onClick={onFinish}>
                  Explore freely
                </Button>
                <button
                  onClick={onWalkthrough}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-white/60 hover:text-white"
                >
                  Show me around
                </button>
                <Link to={`/tours/${tours[0].id}`} onClick={onFinish}>
                  <span className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/60 transition-colors hover:text-white">
                    Take a guided walk →
                  </span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
