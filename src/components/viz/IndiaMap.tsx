import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { plants } from '../../data/plants'
import { REGION_POINTS, type RegionPoint } from '../../lib/ayurveda'
import { INDIA_VIEWBOX, ISLANDS, MAINLAND, VIEW, pathFor, project } from '../../lib/indiaOutline'
import type { Plant, RegionTag } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * Where the garden grows.
 *
 * The silhouette is the real coastline and border, projected from
 * longitude and latitude (see lib/indiaOutline). Regions are sized by
 * how many species the compendium places there — those circles are
 * indicative, but the country under them is not.
 * ------------------------------------------------------------------ */

const INDIA = pathFor(MAINLAND)
const ISLAND_PATHS = ISLANDS.map(pathFor)

interface RegionDatum extends RegionPoint {
  region: RegionTag
  members: Plant[]
  /** The marker's place on the map, projected once. */
  x: number
  y: number
}

function useRegionData(): { regions: RegionDatum[]; panIndia: Plant[] } {
  return useMemo(() => {
    const buckets = new Map<string, Plant[]>()
    for (const plant of plants) {
      for (const region of plant.regions) {
        const list = buckets.get(region) ?? []
        list.push(plant)
        buckets.set(region, list)
      }
    }

    // "Pan-India" is not a place on the map — pinning it somewhere would
    // be a lie about where those plants grow. It gets a line of its own.
    const panIndia = buckets.get('Pan-India') ?? []

    const regions = [...buckets.entries()]
      .filter(([region]) => region !== 'Pan-India')
      .map(([region, members]) => {
        const pos = REGION_POINTS[region]
        if (!pos) return null
        const [x, y] = project(pos.lon, pos.lat)
        return { region: region as RegionTag, ...pos, members, x, y }
      })
      .filter((d): d is RegionDatum => d !== null)
      .sort((a, b) => b.members.length - a.members.length)

    return { regions, panIndia }
  }, [])
}

/* Captions are drawn at 10px in the UI face; 0.56em a character is a
 * slight over-estimate of its average advance, which is the side to err
 * on when the number is used to keep text inside the frame. */
const CAPTION_EM = 5.6
/** Breathing room between a caption and the edge of the viewBox. */
const EDGE_PAD = 4

const captionWidth = (label: string) => label.length * CAPTION_EM

/**
 * Hangs a caption off whichever side of the circle points away from the
 * middle — then makes sure the result is actually on the map.
 *
 * The outward side is the right instinct (it keeps captions off their
 * neighbours) but it is blind to the frame: a marker near the west or
 * east coast can hang a long caption clean off the edge, where the SVG
 * clips it mid-word. So a side-hung caption that would overflow flips to
 * the other side of its own circle, and a centred one is nudged back
 * inside. Either way the caption stays with the circle it names.
 */
function labelPlacement(d: RegionDatum, r: number) {
  const gap = r + 7
  const w = captionWidth(d.label)
  let side = d.side

  if (side === 'left' && d.x - gap - w < EDGE_PAD) side = 'right'
  else if (side === 'right' && d.x + gap + w > VIEW.width - EDGE_PAD) side = 'left'

  switch (side) {
    case 'left':
      return { x: d.x - gap, y: d.y + 3.5, textAnchor: 'end' as const }
    case 'right':
      return { x: d.x + gap, y: d.y + 3.5, textAnchor: 'start' as const }
    default: {
      // Centred above or below, clamped so neither end leaves the frame.
      const half = w / 2
      const x = Math.min(Math.max(d.x, EDGE_PAD + half), VIEW.width - EDGE_PAD - half)
      return {
        x,
        y: side === 'above' ? d.y - gap : d.y + gap + 6,
        textAnchor: 'middle' as const,
      }
    }
  }
}

export function IndiaMap({
  selected,
  onSelect,
  className,
}: {
  selected?: RegionTag | null
  onSelect?: (region: RegionTag) => void
  className?: string
}) {
  const uid = useId()
  const { regions: data, panIndia } = useRegionData()
  const [hovered, setHovered] = useState<RegionDatum | null>(null)
  const max = Math.max(...data.map((d) => d.members.length))
  const active = hovered ?? data.find((d) => d.region === selected) ?? null

  const radiusFor = (count: number) => 9 + (count / max) * 17

  return (
    <div className={className}>
      <div className="relative">
        <svg viewBox={INDIA_VIEWBOX} className="w-full" role="img" aria-label="Medicinal plants by region of India">
          <defs>
            <radialGradient id={`${uid}-land`} cx="45%" cy="35%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${uid}-clip`}>
              <path d={INDIA} />
            </clipPath>
          </defs>

          {/* Latitude hatching, so the silhouette reads as a map and not a blob */}
          <g clipPath={`url(#${uid}-clip)`} opacity={0.45}>
            {Array.from({ length: 29 }, (_, i) => (
              <line
                key={i}
                x1={10}
                x2={415}
                y1={16 + i * 16}
                y2={16 + i * 16}
                stroke="var(--line-strong)"
                strokeWidth={0.6}
              />
            ))}
          </g>

          <motion.path
            d={INDIA}
            fill={`url(#${uid}-land)`}
            stroke="var(--accent)"
            strokeWidth={1.6}
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 1.8, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
          />

          {/* The Andaman and Nicobar chain — small, but part of the country. */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            {ISLAND_PATHS.map((d, i) => (
              <path key={i} d={d} fill={`url(#${uid}-land)`} stroke="var(--accent)" strokeWidth={1} />
            ))}
          </motion.g>

          {data.map((d, i) => {
            const isActive = active?.region === d.region
            const r = radiusFor(d.members.length)
            return (
              <motion.g
                key={d.region}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
                style={{ transformOrigin: `${d.x}px ${d.y}px`, cursor: onSelect ? 'pointer' : 'default' }}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(d.region)}
                aria-label={`${d.region}: ${d.members.length} plants`}
              >
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={r}
                  fill="var(--accent)"
                  opacity={isActive ? 0.72 : 0.34}
                  stroke="var(--accent)"
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? `url(#${uid}-glow)` : undefined}
                />
                <text
                  x={d.x}
                  y={d.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  className="font-mono"
                  fill="var(--surface-raised)"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.members.length}
                </text>
                <text
                  {...labelPlacement(d, r)}
                  fontSize={10}
                  fontWeight={600}
                  fill={isActive ? 'var(--ink)' : 'var(--ink-faint)'}
                  stroke="var(--surface-raised)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.label}
                </text>
              </motion.g>
            )
          })}
        </svg>

        {/* Hover readout */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          {active && (
            <motion.div
              key={active.region}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass mx-auto max-w-sm rounded-2xl border border-line p-3 shadow-[var(--shadow-soft)]"
            >
              <p className="font-display text-sm font-semibold">{active.region}</p>
              <p className="mt-0.5 text-[0.72rem] text-ink-faint">{active.members.length} species in the compendium</p>
              <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-soft">
                {active.members
                  .slice(0, 6)
                  .map((p) => p.name)
                  .join(' · ')}
                {active.members.length > 6 && ` +${active.members.length - 6} more`}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.72rem] text-ink-faint">
        <button
          type="button"
          onClick={() => onSelect?.('Pan-India' as RegionTag)}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
        >
          <span className="size-2.5 rounded-full border border-dashed border-current" />
          <span>
            <span className="font-semibold text-ink tabular-nums">{panIndia.length}</span> more grow right across the
            country
          </span>
        </button>
        <span>Boundary after Survey of India · region markers are indicative</span>
      </div>
    </div>
  )
}
