import { AnimatePresence, motion } from 'motion/react'
import { BotanicalPlate } from './BotanicalPlate'
import { Icon } from './ui/Icon'
import { Badge } from './ui/primitives'
import type { Plant } from '../types/plant'

/* ------------------------------------------------------------------ *
 * The on-foot HUD: the crosshair you aim with, and the card a plant
 * gives you when you stop in front of it.
 *
 * Shared by both gardens — the procedural one and the medicinal garden — because
 * being on foot should feel identical in either; only the ground under
 * your feet changes.
 * ------------------------------------------------------------------ */

export function Crosshair({
  aimed,
  open,
  label,
}: {
  /* Only the accent is read off it, which is what lets the sight settle on
     something that is not a plant — the dedication plaque — as well. */
  aimed: Pick<Plant, 'accent'> | undefined
  open: boolean
  /** Overrides the prompt — a label board is read, not met. */
  label?: string
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <motion.span
          animate={{ scale: aimed ? 1.6 : 1 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="block size-2.5 rounded-full border-2"
          style={{
            borderColor: aimed ? aimed.accent : 'rgb(255 255 255 / 0.8)',
            background: aimed ? `${aimed.accent}66` : 'transparent',
            // The garden runs from near-white noon sand to near-black night,
            // so the sight needs its own contrast rather than the page's.
            boxShadow: '0 0 0 1px rgb(0 0 0 / 0.45)',
          }}
        />
        <AnimatePresence>
          {aimed && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="glass rounded-full border border-line px-3 py-1 text-[0.72rem] font-medium text-ink-soft"
            >
              {label ?? (open ? 'Click for quiet' : 'Click to meet')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* What a plant says when you stop in front of it.
 *
 * Built to the same shape as a tour stop, because it is the same moment: a
 * plant, a line about why it matters, and a voice reading it. The difference
 * is that nobody chose the order — you walked here. Nothing in it is
 * clickable, since the pointer is locked to the view while this is up. */
export function Encounter({ plant, speaking }: { plant: Plant; speaking: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 sm:p-6"
    >
      <div className="glass mx-auto max-w-2xl overflow-hidden rounded-4xl border border-line shadow-[var(--shadow-lift)]">
        <div className="flex items-start gap-4 p-4 sm:p-5">
          <span
            className="hidden size-20 shrink-0 place-items-center rounded-2xl sm:grid"
            style={{ background: `color-mix(in srgb, ${plant.accent} 15%, transparent)` }}
          >
            <BotanicalPlate plant={plant} className="size-18" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2 className="font-display text-[1.15rem] leading-tight font-semibold">{plant.name}</h2>
              <span className="truncate text-[0.78rem] text-ink-faint italic">{plant.botanical}</span>
              {speaking && (
                <span
                  className="ml-auto inline-flex items-center gap-1.5 text-[0.68rem] font-medium"
                  style={{ color: plant.accent }}
                >
                  <Icon name="sound" size={13} />
                  Speaking
                </span>
              )}
            </div>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">
              {plant.tagline}
            </p>
            {plant.facts[0] && (
              <p className="mt-2.5 flex items-start gap-1.5 text-[0.78rem] leading-relaxed text-ink-faint">
                <Icon name="sparkle" size={13} className="mt-0.5 shrink-0" style={{ color: plant.accent }} />
                {plant.facts[0]}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {plant.therapeutic.slice(0, 3).map((t) => (
                <Badge key={t} tone={plant.accent}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <p className="border-t border-line px-4 py-2.5 text-center text-[0.7rem] text-ink-faint">
          Click away to dismiss · <kbd className="font-mono font-semibold text-ink-soft">M</kbd> to mute ·{' '}
          <kbd className="font-mono font-semibold text-ink-soft">Esc</kbd> for the full entry
        </p>
      </div>
    </motion.div>
  )
}
