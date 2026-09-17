import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { useGarden } from '../../store/useGarden'
import { cx } from '../ui/primitives'

/* ------------------------------------------------------------------ *
 * Small motion primitives shared across the site.
 * All of them fall back to "just show it" when the visitor has asked
 * for reduced motion, either in the OS or in Settings.
 * ------------------------------------------------------------------ */

export function useCalmMotion(): boolean {
  const system = useReducedMotion()
  const preference = useGarden((s) => s.reducedMotion)
  return Boolean(system) || preference
}

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const calm = useCalmMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={calm ? false : { opacity: 0, y }}
      animate={inView || calm ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/** Counts up to `value` when it scrolls into view. */
export function Counter({
  value,
  duration = 1.2,
  className,
  suffix,
}: {
  value: number
  duration?: number
  className?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const calm = useCalmMotion()
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const [shown, setShown] = useState(calm ? value : 0)

  useEffect(() => {
    if (calm) {
      setShown(value)
      return
    }
    if (inView) motionValue.set(value)
    return spring.on('change', (latest) => setShown(Math.round(latest)))
  }, [inView, value, calm, motionValue, spring])

  return (
    <span ref={ref} className={cx('tabular-nums', className)}>
      {shown}
      {suffix}
    </span>
  )
}

/** Words rise into place one after another — used for page titles. */
export function StaggerWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const calm = useCalmMotion()
  if (calm) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.07 }}
          >
            {word}
            {' '}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
