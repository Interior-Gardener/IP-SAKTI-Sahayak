import { motion } from 'motion/react'
import {
  DOSHAS,
  doshaLabel,
  doshaProfile,
  viryaOf,
  viryaScale,
  vipakaOf,
  type DoshaEffect,
} from '../../lib/ayurveda'
import type { Plant } from '../../types/plant'
import { RasaRadar, seriesFor } from './RasaRadar'
import { Icon } from '../ui/Icon'

/* ------------------------------------------------------------------ *
 * One card that says everything an Ayurvedic profile says, in shapes:
 * the taste hexagon, the heating/cooling scale, the post-digestive
 * taste, and what the plant does to each dosha.
 * ------------------------------------------------------------------ */

export function ViryaGauge({ plant }: { plant: Plant }) {
  const scale = viryaScale(plant)
  const heating = viryaOf(plant) === 'heating'
  // -1..1 mapped onto the track.
  const position = (scale + 1) / 2

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Virya</span>
        <span className="font-display text-sm font-semibold" style={{ color: heating ? '#c9743f' : '#4aa3a8' }}>
          {plant.ayurvedic.virya}
        </span>
      </div>

      <div className="relative mt-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#4aa3a8] via-[color-mix(in_srgb,var(--surface-sunken)_70%,#8aa)] to-[#c9743f]">
        <motion.span
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface-raised)] shadow-[var(--shadow-soft)]"
          style={{ background: heating ? '#c9743f' : '#4aa3a8' }}
          initial={{ left: '50%', scale: 0 }}
          animate={{ left: `${position * 100}%`, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.66rem] text-ink-faint">
        <span>Shita · cooling</span>
        <span>Ushna · heating</span>
      </div>
    </div>
  )
}

function DoshaRow({ name, gloss, color, effect, index }: {
  name: string
  gloss: string
  color: string
  effect: DoshaEffect
  index: number
}) {
  // A centre-anchored bar: pacifies grows left, aggravates grows right.
  const width = effect === 0 ? 6 : 44
  const tone = effect > 0 ? '#c2413f' : effect < 0 ? color : 'var(--line-strong)'

  return (
    <div className="grid grid-cols-[4.2rem_1fr_5.6rem] items-center gap-3">
      <div>
        <p className="font-display text-[0.86rem] font-semibold" style={{ color: effect === 0 ? 'var(--ink-faint)' : color }}>
          {name}
        </p>
        <p className="text-[0.6rem] text-ink-faint">{gloss}</p>
      </div>

      <div className="relative h-6">
        <span className="absolute inset-y-1 left-1/2 w-px bg-line-strong" aria-hidden="true" />
        <motion.span
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full"
          style={{
            background: tone,
            left: effect > 0 ? '50%' : undefined,
            right: effect < 0 ? '50%' : undefined,
            ...(effect === 0 ? { left: `calc(50% - 3px)` } : {}),
          }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.1 }}
        />
      </div>

      <p
        className="text-right text-[0.72rem] font-medium"
        style={{ color: effect > 0 ? '#c2413f' : effect < 0 ? color : 'var(--ink-faint)' }}
      >
        {doshaLabel(effect)}
      </p>
    </div>
  )
}

export function DoshaBalance({ plant }: { plant: Plant }) {
  const profile = doshaProfile(plant)
  return (
    <div className="space-y-2.5">
      <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Doshic effect</span>
      {DOSHAS.map((d, i) => (
        <DoshaRow key={d.key} name={d.key} gloss={d.gloss} color={d.color} effect={profile[d.key]} index={i} />
      ))}
    </div>
  )
}

export function AyurvedicFingerprint({ plant }: { plant: Plant }) {
  const vipaka = vipakaOf(plant)

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-raised">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <Icon name="sparkle" size={16} style={{ color: plant.accent }} />
        <h3 className="font-display text-[0.95rem] font-semibold">Ayurvedic fingerprint</h3>
        <span className="ml-auto text-[0.68rem] text-ink-faint">read as shapes, not a list</span>
      </header>

      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8">
        <div>
          <RasaRadar series={[seriesFor(plant)]} className="w-full" />
          <p className="mt-1 text-center text-[0.7rem] text-ink-faint text-balance-pretty">
            Rasa — the tastes the tongue reports, and the first thing a vaidya records.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <ViryaGauge plant={plant} />

          <div>
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Vipaka</span>
            <div className="mt-2 flex items-center gap-2.5">
              <span
                className="grid size-9 place-items-center rounded-xl font-display text-[0.8rem] font-semibold"
                style={{ background: `color-mix(in srgb, ${vipaka.color} 18%, transparent)`, color: vipaka.color }}
              >
                {vipaka.key.slice(0, 2)}
              </span>
              <div>
                <p className="text-[0.88rem] font-medium">{plant.ayurvedic.vipaka}</p>
                <p className="text-[0.68rem] text-ink-faint">The taste it becomes after digestion</p>
              </div>
            </div>
          </div>

          <DoshaBalance plant={plant} />
        </div>
      </div>

      <footer className="border-t border-line bg-sunken px-5 py-3">
        <p className="text-[0.78rem] leading-relaxed text-ink-soft text-balance-pretty">{plant.ayurvedic.dosha}</p>
      </footer>
    </div>
  )
}
