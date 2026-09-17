import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { plants } from '../../data/plants'
import { CONSERVATION_TIERS } from '../../lib/ayurveda'
import { BotanicalPlate } from '../BotanicalPlate'
import { Icon } from '../ui/Icon'

/* ------------------------------------------------------------------ *
 * Conservation ladder.
 *
 * The uncomfortable pattern in medicinal botany is that the valuable
 * part is often the part whose removal kills the plant — bark, root,
 * heartwood, resin. Sorting the collection by wild status and marking
 * which of those are root or bark drugs makes that visible in one look.
 * ------------------------------------------------------------------ */

const DESTRUCTIVE = /root|bark|heartwood|rhizome|resin|oleoresin|wood|tuber/i

export function ConservationLadder({ className }: { className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const tiers = useMemo(
    () =>
      CONSERVATION_TIERS.map((tier) => ({
        ...tier,
        members: plants.filter((p) => p.conservation === tier.key),
      })),
    [],
  )

  const max = Math.max(...tiers.map((t) => t.members.length))
  const atRisk = plants.filter((p) => /Vulnerable|Endangered/.test(p.conservation))
  const active = hovered ? plants.find((p) => p.id === hovered) : null

  return (
    <div className={className}>
      <div className="space-y-2.5">
        {tiers.map((tier, tierIndex) => (
          <div key={tier.key} className="grid grid-cols-[minmax(6.5rem,10rem)_1fr] items-center gap-3 sm:gap-5">
            <div className="text-right">
              <p className="text-[0.78rem] leading-tight font-semibold" style={{ color: tier.color }}>
                {tier.key}
              </p>
              <p className="text-[0.62rem] text-ink-faint tabular-nums">{tier.members.length} species</p>
            </div>

            <div
              className="relative flex min-h-11 flex-wrap items-center gap-1.5 rounded-2xl border px-3 py-2"
              style={{
                borderColor: `color-mix(in srgb, ${tier.color} 32%, transparent)`,
                background: `color-mix(in srgb, ${tier.color} ${4 + (tier.members.length / max) * 8}%, transparent)`,
              }}
            >
              {tier.members.map((plant, i) => {
                const destructive = plant.partsUsed.some((part) => DESTRUCTIVE.test(part))
                return (
                  <Link
                    key={plant.id}
                    to={`/plant/${plant.id}`}
                    onMouseEnter={() => setHovered(plant.id)}
                    onMouseLeave={() => setHovered(null)}
                    aria-label={`${plant.name} — ${tier.key}`}
                  >
                    <motion.span
                      className="block size-4 rounded-full transition-transform hover:scale-150"
                      style={{
                        background: destructive ? tier.color : 'transparent',
                        border: `2px solid ${tier.color}`,
                        boxShadow: hovered === plant.id ? `0 0 0 4px color-mix(in srgb, ${tier.color} 25%, transparent)` : undefined,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: tierIndex * 0.08 + i * 0.025, type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  </Link>
                )
              })}
              {tier.members.length === 0 && <span className="text-[0.72rem] text-ink-faint">none</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-ink-faint" /> root, bark or heartwood drug
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-ink-faint" /> leaf, fruit or aerial part
        </span>
      </div>

      <div className="mt-4 min-h-[4.5rem]">
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-3"
          >
            <span
              className="grid size-12 shrink-0 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${active.accent} 15%, transparent)` }}
            >
              <BotanicalPlate plant={active} className="size-10" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold">
                {active.name} <span className="font-sans text-[0.72rem] font-normal text-ink-faint italic">{active.botanical}</span>
              </p>
              <p className="text-[0.74rem] text-ink-soft">
                {active.conservation} · parts used: {active.partsUsed.join(', ')}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-line-strong p-3">
            <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-turmeric-500" />
            <p className="text-[0.78rem] leading-relaxed text-ink-soft text-balance-pretty">
              {atRisk.length} of {plants.length} species in this garden carry a wild-population warning. Filled dots mark the
              plants whose medicinal part is the root, bark or heartwood — harvest there and the plant does not grow back.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
