import { RASAS, rasaProfile, viryaOf } from '../../lib/ayurveda'
import type { Plant } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * A thumbnail of the taste hexagon, small enough to sit on a card.
 *
 * No animation and no labels: at this size the silhouette is the whole
 * message, and once a visitor has seen the full radar on a plant page
 * the shape alone starts to read. Deliberately static so a grid of
 * twenty-five of them costs nothing.
 * ------------------------------------------------------------------ */

const SIZE = 34
const C = SIZE / 2
const R = 13

function pointAt(index: number, magnitude: number) {
  const angle = (Math.PI * 2 * index) / RASAS.length - Math.PI / 2
  return `${(C + Math.cos(angle) * R * magnitude).toFixed(1)},${(C + Math.sin(angle) * R * magnitude).toFixed(1)}`
}

export function RasaGlyph({ plant, className }: { plant: Plant; className?: string }) {
  const profile = rasaProfile(plant)
  const shape = RASAS.map((rasa, i) => pointAt(i, Math.max(0.08, profile[rasa.key]))).join(' ')
  const outer = RASAS.map((_, i) => pointAt(i, 1)).join(' ')
  const heating = viryaOf(plant) === 'heating'
  const tastes = RASAS.filter((r) => profile[r.key] > 0).map((r) => r.english.toLowerCase())

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      role="img"
      aria-label={`Tastes: ${tastes.join(', ')}. ${heating ? 'Heating' : 'Cooling'}.`}
    >
      <polygon points={outer} fill="none" stroke="currentColor" strokeWidth={0.9} opacity={0.45} />
      <polygon
        points={shape}
        fill={plant.accent}
        fillOpacity={0.32}
        stroke={plant.accent}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      {/* Potency mark: a dot in the middle, warm or cool. */}
      <circle cx={C} cy={C} r={2.1} fill={heating ? '#c9743f' : '#4aa3a8'} />
    </svg>
  )
}
