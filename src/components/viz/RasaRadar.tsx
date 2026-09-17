import { useId } from 'react'
import { motion } from 'motion/react'
import { RASAS, rasaProfile, type RasaKey } from '../../lib/ayurveda'
import type { Plant } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * Shad-rasa radar — the six tastes on a hexagon.
 *
 * Six axes is the one case where a radar chart is genuinely the right
 * shape: the categories are fixed, cyclic in the tradition, and the
 * silhouette itself is the thing worth comparing between plants.
 * ------------------------------------------------------------------ */

const SIZE = 260
const CENTRE = SIZE / 2
const RADIUS = 95

/** Axis n, starting at twelve o'clock and running clockwise. */
function point(index: number, magnitude: number) {
  const angle = (Math.PI * 2 * index) / RASAS.length - Math.PI / 2
  return {
    x: CENTRE + Math.cos(angle) * RADIUS * magnitude,
    y: CENTRE + Math.sin(angle) * RADIUS * magnitude,
  }
}

function polygon(values: number[]): string {
  return values.map((v, i) => { const p = point(i, Math.max(0.04, v)); return `${p.x},${p.y}` }).join(' ')
}

function ring(magnitude: number): string {
  return polygon(RASAS.map(() => magnitude))
}

export interface RasaSeries {
  label: string
  color: string
  values: Record<RasaKey, number>
}

export function seriesFor(plant: Plant): RasaSeries {
  return { label: plant.name, color: plant.accent, values: rasaProfile(plant) }
}

export function RasaRadar({
  series,
  showLabels = true,
  className,
}: {
  series: RasaSeries[]
  showLabels?: boolean
  className?: string
}) {
  const uid = useId()
  // The axis labels sit outside the web, so the box is padded sideways to
  // keep "Kashaya" and "Lavana" from being clipped at the edges.
  const labelledBox = showLabels ? `-38 -14 ${SIZE + 76} ${SIZE + 32}` : `0 0 ${SIZE} ${SIZE}`

  return (
    <svg
      viewBox={labelledBox}
      className={className}
      role="img"
      aria-label={`Taste profile: ${series.map((s) => s.label).join(', ')}`}
    >
      <defs>
        {series.map((s, i) => (
          <radialGradient key={i} id={`${uid}-fill-${i}`}>
            <stop offset="0%" stopColor={s.color} stopOpacity={0.42} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.16} />
          </radialGradient>
        ))}
      </defs>

      {/* Web */}
      {[0.25, 0.5, 0.75, 1].map((m) => (
        <polygon
          key={m}
          points={ring(m)}
          fill="none"
          stroke="var(--line)"
          strokeWidth={m === 1 ? 1.2 : 0.8}
        />
      ))}
      {RASAS.map((_, i) => {
        const p = point(i, 1)
        return <line key={i} x1={CENTRE} y1={CENTRE} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth={0.8} />
      })}

      {/* Series */}
      {series.map((s, i) => {
        const values = RASAS.map((r) => s.values[r.key])
        return (
          <motion.g key={s.label}>
            <motion.polygon
              points={polygon(values)}
              fill={`url(#${uid}-fill-${i})`}
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
              style={{ transformOrigin: `${CENTRE}px ${CENTRE}px` }}
            />
            {values.map((v, j) =>
              v > 0 ? (
                <motion.circle
                  key={j}
                  cx={point(j, v).x}
                  cy={point(j, v).y}
                  r={3.4}
                  fill={s.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35 + j * 0.05 + i * 0.12, type: 'spring', stiffness: 320, damping: 18 }}
                  style={{ transformOrigin: `${point(j, v).x}px ${point(j, v).y}px` }}
                />
              ) : null,
            )}
          </motion.g>
        )
      })}

      {/* Axis labels */}
      {showLabels &&
        RASAS.map((rasa, i) => {
          const p = point(i, 1.3)
          const anchor = p.x > CENTRE + 6 ? 'start' : p.x < CENTRE - 6 ? 'end' : 'middle'
          const lit = series.some((s) => s.values[rasa.key] > 0)
          return (
            <g key={rasa.key} opacity={lit ? 1 : 0.42}>
              <text
                x={p.x}
                y={p.y - 3}
                textAnchor={anchor}
                className="font-display"
                fontSize={11.5}
                fontWeight={600}
                fill={lit ? rasa.color : 'var(--ink-faint)'}
              >
                {rasa.key}
              </text>
              <text x={p.x} y={p.y + 9} textAnchor={anchor} fontSize={9.5} fill="var(--ink-faint)">
                {rasa.english}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
