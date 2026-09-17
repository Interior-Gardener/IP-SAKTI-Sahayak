import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { QuizQuestion } from '../data/quiz'
import { Icon } from './ui/Icon'
import { cx } from './ui/primitives'

/* ------------------------------------------------------------------ *
 * QuizHud — floats over the 3D garden while a question is active.
 * Shows: progress bar, score, question text, bed hint, optional hint.
 * ------------------------------------------------------------------ */

interface QuizHudProps {
  question: QuizQuestion
  current: number
  total: number
  score: number
  onSkip: () => void
  /** When true (feedback phase) the HUD dims — another overlay is on top. */
  locked: boolean
}

export function QuizHud({ question, current, total, score, onSkip, locked }: QuizHudProps) {
  const [hintVisible, setHintVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Auto-reveal hint after 8 s of silence for this question. */
  useEffect(() => {
    setHintVisible(false)
    timerRef.current = setTimeout(() => setHintVisible(true), 8000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [question.id])

  const progress = ((current) / total) * 100

  const difficultyLabel: Record<1 | 2 | 3, string> = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
  }
  const difficultyColor: Record<1 | 2 | 3, string> = {
    1: '#4f9d5c',
    2: '#d9a13c',
    3: '#b95a72',
  }

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: locked ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 pb-22 sm:p-6 sm:pb-22 md:pb-8"
    >
      {/* Progress bar — top of HUD */}
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[0.68rem] text-ink-faint tracking-widest uppercase">
            Question {current + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold tracking-wide"
              style={{
                background: `color-mix(in srgb, ${difficultyColor[question.difficulty]} 18%, transparent)`,
                color: difficultyColor[question.difficulty],
              }}
            >
              {difficultyLabel[question.difficulty]}
            </span>
            {/* Score badge */}
            <motion.span
              key={score}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[0.72rem] font-bold text-[var(--surface-raised)]"
            >
              <Icon name="sparkle" size={11} />
              {score}
            </motion.span>
          </div>
        </div>
        {/* Progress track */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="glass pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-lift)]">
        {/* Bed hint banner */}
        <div
          className="flex items-center gap-2 border-b border-line px-4 py-2"
        >
          <Icon name="map" size={13} className="shrink-0 text-ink-faint" />
          <p className="text-[0.7rem] text-ink-faint">
            Look in:{' '}
            <span className="font-semibold text-ink-soft">{question.bedName}</span>
          </p>
        </div>

        {/* Question text */}
        <p className="px-5 py-4 text-[0.95rem] leading-relaxed font-medium text-ink text-balance-pretty">
          {question.question}
        </p>

        {/* Hint row */}
        <AnimatePresence>
          {question.hint && hintVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-line"
            >
              <div className="flex items-start gap-2 bg-accent-soft px-4 py-2.5">
                <Icon name="sparkle" size={13} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[0.76rem] text-accent">
                  <span className="font-semibold">Hint: </span>
                  {question.hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <p className="text-[0.7rem] text-ink-faint">
            Click the correct plant in the garden ↑
          </p>
          <button
            onClick={onSkip}
            className={cx(
              'flex items-center gap-1 rounded-full px-3 py-1 text-[0.72rem] font-medium text-ink-faint transition-colors hover:text-ink-soft',
            )}
          >
            Skip
            <Icon name="chevronRight" size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
