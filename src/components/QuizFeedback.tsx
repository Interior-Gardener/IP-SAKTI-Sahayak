import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { Plant } from '../types/plant'
import { BotanicalPlate } from './BotanicalPlate'
import { Icon } from './ui/Icon'

/* ------------------------------------------------------------------ *
 * QuizFeedback — full-screen overlay shown between question and next.
 *
 * Correct  → radial accent pulse + 8 animated leaf particles + green
 *            panel sliding up with the plant name and a fun fact.
 * Incorrect → horizontal shake on the whole overlay + red panel
 *             revealing the correct plant name.
 * ------------------------------------------------------------------ */

type FeedbackKind = 'correct' | 'incorrect'

interface QuizFeedbackProps {
  kind: FeedbackKind
  plant: Plant
  onNext: () => void
}

/* Fixed leaf positions so animations are deterministic (no Math.random in render). */
const LEAF_CONFIGS = [
  { angle: 0,   distance: 145, size: 20, delay: 0.00 },
  { angle: 45,  distance: 162, size: 16, delay: 0.04 },
  { angle: 90,  distance: 130, size: 22, delay: 0.02 },
  { angle: 135, distance: 170, size: 18, delay: 0.06 },
  { angle: 180, distance: 150, size: 21, delay: 0.01 },
  { angle: 225, distance: 138, size: 17, delay: 0.05 },
  { angle: 270, distance: 165, size: 19, delay: 0.03 },
  { angle: 315, distance: 155, size: 23, delay: 0.07 },
]

const LEAF_PATH =
  'M12 3C9 7 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7-6-11Zm0 0v15'

/** Eight leaves that burst outward from the centre of the screen. */
function LeafBurst({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {LEAF_CONFIGS.map(({ angle, distance, size, delay }) => {
        const rad = (angle * Math.PI) / 180
        const x = Math.round(Math.cos(rad) * distance)
        const y = Math.round(Math.sin(rad) * distance)
        return (
          <motion.svg
            key={angle}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="absolute"
            style={{ color, left: '50%', top: '40%', translateX: '-50%', translateY: '-50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: angle - 90 }}
            animate={{ x, y, opacity: 0, scale: 1.3, rotate: angle + 90 }}
            transition={{
              duration: 0.85,
              delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <path d={LEAF_PATH} fill="currentColor" stroke="none" />
          </motion.svg>
        )
      })}
    </div>
  )
}

/** A radial colour pulse that expands and fades. */
function AccentPulse({ color }: { color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      initial={{ opacity: 0.32 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{
        background: `radial-gradient(circle at 50% 42%, ${color}55 0%, transparent 60%)`,
      }}
    />
  )
}

/* Shake keyframes for incorrect answers. */
const shakeTransition = {
  duration: 0.45,
  times: [0, 0.13, 0.25, 0.38, 0.5, 0.65, 0.78, 1],
  ease: 'easeOut' as const,
}

export function QuizFeedback({ kind, plant, onNext }: QuizFeedbackProps) {
  const isCorrect = kind === 'correct'

  /* Pick the first non-empty fact for the correct panel. */
  const fact = useMemo(
    () => plant.facts.find((f) => f.trim().length > 0) ?? plant.tagline,
    [plant],
  )

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-24 md:pb-8"
      initial={{ opacity: 0 }}
      animate={
        isCorrect
          ? { opacity: 1, x: 0 }
          : {
              opacity: 1,
              x: [0, -10, 10, -8, 8, -5, 5, 0],
            }
      }
      exit={{ opacity: 0 }}
      transition={isCorrect ? { duration: 0.25 } : shakeTransition}
    >
      {/* Background dim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isCorrect
            ? 'radial-gradient(ellipse at 50% 100%, color-mix(in srgb, #1c7a41 8%, transparent), transparent 70%)'
            : 'radial-gradient(ellipse at 50% 100%, color-mix(in srgb, #b95a72 8%, transparent), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Leaf burst & pulse on correct */}
      {isCorrect && (
        <>
          <AccentPulse color={plant.accent} />
          <LeafBurst color={plant.accent} />
        </>
      )}

      {/* Result card */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="glass pointer-events-auto mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]"
      >
        {/* Header stripe */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            background: isCorrect
              ? `color-mix(in srgb, ${plant.accent} 12%, transparent)`
              : 'color-mix(in srgb, #b95a72 10%, transparent)',
          }}
        >
          {/* Icon */}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.15 }}
            className="grid size-11 shrink-0 place-items-center rounded-2xl text-white"
            style={{ background: isCorrect ? plant.accent : '#b95a72' }}
          >
            {isCorrect ? (
              <Icon name="check" size={22} />
            ) : (
              <Icon name="close" size={22} />
            )}
          </motion.span>

          <div className="min-w-0 flex-1">
            <p
              className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase"
              style={{ color: isCorrect ? plant.accent : '#b95a72' }}
            >
              {isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </p>
            <h3 className="font-display text-xl font-semibold leading-tight">
              {plant.name}
            </h3>
            <p className="text-[0.74rem] italic text-ink-faint">{plant.botanical}</p>
          </div>

          {/* Botanical plate */}
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${plant.accent} 16%, transparent)`,
            }}
          >
            <BotanicalPlate plant={plant} className="size-12" />
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isCorrect ? (
            <p className="text-[0.88rem] leading-relaxed text-ink-soft text-balance-pretty">
              {fact}
            </p>
          ) : (
            <p className="text-[0.88rem] leading-relaxed text-ink-soft">
              The correct plant was{' '}
              <span className="font-semibold text-ink">{plant.name}</span>.{' '}
              {plant.tagline}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-line px-5 py-3.5">
          <button
            onClick={onNext}
            className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[0.9rem] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ background: isCorrect ? plant.accent : '#b95a72' }}
          >
            Next question
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
