import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { gardenBeds, getPlant } from '../data/plants'
import { quizQuestions, shuffleQuestions, type QuizQuestion } from '../data/quiz'
import { GardenScene, OVERVIEW, type CameraGoal } from '../three/GardenScene'
import { useGarden } from '../store/useGarden'
import { Icon } from '../components/ui/Icon'
import { QuizHud } from '../components/QuizHud'
import { QuizFeedback } from '../components/QuizFeedback'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

type Phase = 'lobby' | 'playing' | 'feedback' | 'results'
type FeedbackKind = 'correct' | 'incorrect'

const ROUND_SIZE = 10

/* ------------------------------------------------------------------ *
 * Lobby screen
 * ------------------------------------------------------------------ */

function QuizLobby({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
    >
      {/* Blurred backdrop card */}
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-w-md overflow-hidden rounded-4xl border border-line shadow-[var(--shadow-lift)]"
      >
        {/* Hero banner */}
        <div
          className="relative overflow-hidden px-8 pt-10 pb-8 text-center"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)',
          }}
        >
          {/* Floating leaf icon */}
          <motion.span
            animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-4 inline-grid size-16 place-items-center rounded-3xl bg-accent text-[var(--surface-raised)]"
          >
            <Icon name="quiz" size={30} />
          </motion.span>

          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Vanaspati Quiz
          </h1>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft text-balance-pretty">
            Test your knowledge of medicinal plants. Read each clue, then
            click the correct plant in the 3D garden.
          </p>
        </div>

        {/* Rules */}
        <div className="space-y-3 border-y border-line px-6 py-5">
          {[
            { icon: 'map' as const, text: `${ROUND_SIZE} questions per round, drawn from ${quizQuestions.length} in the bank` },
            { icon: 'leaf' as const, text: 'The camera will focus the correct garden bed — you find the plant' },
            { icon: 'sparkle' as const, text: 'Hints appear after 8 seconds if you\'re stuck' },
            { icon: 'check' as const, text: 'Correct and incorrect answers are both educational!' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon name={icon} size={13} />
              </span>
              <p className="text-[0.84rem] leading-snug text-ink-soft">{text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 py-5">
          <button
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[1rem] font-semibold text-[var(--surface-raised)] shadow-[0_4px_16px_-4px_var(--accent)] transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <Icon name="play" size={18} />
            Start Quiz
          </button>
          <Link to="/garden" className="mt-3 block text-center text-[0.78rem] text-ink-faint hover:text-ink-soft transition-colors">
            Back to garden
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Results screen
 * ------------------------------------------------------------------ */

function medalFor(score: number, total: number) {
  const pct = score / total
  if (pct === 1) return { emoji: '🌿', label: 'Perfect Score!', color: '#1c7a41' }
  if (pct >= 0.8) return { emoji: '🌸', label: 'Expert Botanist', color: '#4f9d5c' }
  if (pct >= 0.6) return { emoji: '🌱', label: 'Growing Knowledge', color: '#d9a13c' }
  return { emoji: '🪴', label: 'Keep Exploring', color: '#c9743f' }
}

function QuizResults({
  score,
  total,
  onRestart,
}: {
  score: number
  total: number
  onRestart: () => void
}) {
  const medal = medalFor(score, total)
  const pct = Math.round((score / total) * 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-w-sm overflow-hidden rounded-4xl border border-line shadow-[var(--shadow-lift)]"
      >
        {/* Header */}
        <div
          className="flex flex-col items-center px-6 pt-10 pb-6 text-center"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${medal.color} 16%, transparent), transparent 70%)`,
          }}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
            className="mb-3 text-5xl"
          >
            {medal.emoji}
          </motion.span>
          <p
            className="mb-1 text-[0.7rem] font-bold tracking-[0.16em] uppercase"
            style={{ color: medal.color }}
          >
            {medal.label}
          </p>
          <h2 className="font-display text-4xl font-semibold">
            {score}
            <span className="text-ink-faint text-2xl font-normal"> / {total}</span>
          </h2>
          <p className="mt-1 text-[0.82rem] text-ink-soft">{pct}% correct</p>
        </div>

        {/* Score bar */}
        <div className="px-6 pb-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              style={{ background: medal.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-line px-6 py-5">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-full py-3 text-[0.9rem] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
            style={{ background: medal.color }}
          >
            <Icon name="reset" size={17} />
            Play again
          </button>
          <Link to="/garden">
            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-raised py-3 text-[0.9rem] font-medium text-ink-soft transition-colors hover:text-ink">
              <Icon name="leaf" size={17} />
              Back to garden
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Main Quiz component
 * ------------------------------------------------------------------ */

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackKind | null>(null)
  const [goal, setGoal] = useState<CameraGoal>(OVERVIEW)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const timeOfDay = useGarden((s) => s.timeOfDay)

  const currentQ = questions[current] ?? null

  /* ---- Start / restart ---- */
  const startQuiz = useCallback(() => {
    const qs = shuffleQuestions(quizQuestions, ROUND_SIZE)
    setQuestions(qs)
    setCurrent(0)
    setScore(0)
    setFeedback(null)
    setSelectedId(null)
    setPhase('playing')
  }, [])

  /* ---- When question changes, focus the right bed ---- */
  useEffect(() => {
    if (phase !== 'playing' || !currentQ) return
    const bed = gardenBeds.find((b) => b.id === currentQ.targetBedId)
    if (!bed) return
    setGoal({
      target: [bed.position[0], 0.6, bed.position[1]],
      distance: 8.5,
      lift: 0.46,
      speed: 0.7,
    })
    setSelectedId(null)
    setHoveredId(null)
  }, [current, phase, currentQ])

  /* ---- Handle a plant click in quiz mode ---- */
  const handleSelect = useCallback(
    (plantId: string) => {
      if (phase !== 'playing' || !currentQ) return

      if (plantId === currentQ.targetPlantId) {
        setScore((s) => s + 1)
        setFeedback('correct')
        setSelectedId(plantId)
      } else {
        setFeedback('incorrect')
        /* Light up the correct plant so the user can see where it was. */
        setSelectedId(currentQ.targetPlantId)
      }
      setPhase('feedback')
    },
    [phase, currentQ],
  )

  /* ---- Advance to next question or end ---- */
  const advance = useCallback(() => {
    const next = current + 1
    if (next >= questions.length) {
      setPhase('results')
    } else {
      setCurrent(next)
      setFeedback(null)
      setSelectedId(null)
      setPhase('playing')
    }
  }, [current, questions.length])

  /* ---- Derived ---- */
  const targetPlant = useMemo(
    () => (currentQ ? getPlant(currentQ.targetPlantId) : undefined),
    [currentQ],
  )

  const isImmersivePhase = phase === 'playing' || phase === 'feedback'

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100dvh - 4rem)' }}
    >
      {/* ── 3D garden scene ── always rendered in the background */}
      <GardenScene
        goal={goal}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onHover={isImmersivePhase ? setHoveredId : () => {}}
        onSelect={phase === 'playing' ? handleSelect : () => {}}
        onSelectBed={() => {}}
        idleSpin={phase === 'lobby' || phase === 'results'}
        showLabels={phase === 'lobby' || phase === 'results'}
        timeOfDay={timeOfDay}
      />

      {/* Vignette to give chrome some ground to sit on */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(125% 95% at 50% 42%, transparent 46%, color-mix(in srgb, var(--surface-inverse) 16%, transparent) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Lobby ── */}
      <AnimatePresence>
        {phase === 'lobby' && <QuizLobby onStart={startQuiz} />}
      </AnimatePresence>

      {/* ── Question HUD ── */}
      <AnimatePresence>
        {(phase === 'playing' || phase === 'feedback') && currentQ && (
          <QuizHud
            key={currentQ.id}
            question={currentQ}
            current={current}
            total={questions.length}
            score={score}
            onSkip={advance}
            locked={phase === 'feedback'}
          />
        )}
      </AnimatePresence>

      {/* ── Feedback overlay ── */}
      <AnimatePresence>
        {phase === 'feedback' && feedback && targetPlant && (
          <QuizFeedback key={`fb-${current}`} kind={feedback} plant={targetPlant} onNext={advance} />
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {phase === 'results' && (
          <QuizResults score={score} total={questions.length} onRestart={startQuiz} />
        )}
      </AnimatePresence>

      {/* ── Hover label (quiz-mode, so no card is opened) ── */}
      {/* This is rendered by GardenScene's Html label — no extra work needed */}
    </div>
  )
}
