import { useId, useMemo, type CSSProperties } from 'react'
import type { Plant } from '../types/plant'
import { buildPlate, type PlateVariant } from '../lib/plate'

interface BotanicalPlateProps {
  plant: Plant
  variant?: PlateVariant
  className?: string
  style?: CSSProperties
  /** Draws the grid and caption of a herbarium sheet. */
  framed?: boolean
}

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const n = Number.parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * A specimen plate drawn from the plant's own morphology spec — the same
 * numbers that grow the 3D model, projected onto paper.
 */
export function BotanicalPlate({ plant, variant = 'habit', className, style, framed = false }: BotanicalPlateProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const plate = useMemo(() => buildPlate(plant, variant), [plant, variant])
  const accent = plant.accent
  const leafId = `leaf-${uid}`
  const flowerColor = plant.model.flower?.color ?? accent
  const fruitColor = plant.model.fruit?.color ?? accent

  return (
    <svg
      viewBox={plate.viewBox}
      className={className}
      style={style}
      role="img"
      aria-label={`${plant.name} — ${plate.caption}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <path id={leafId} d={plate.leafPath} />
        <linearGradient id={`blade-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={rgba(plant.model.leaf.bottom, 0.5)} />
          <stop offset="100%" stopColor={rgba(plant.model.leaf.top, 0.72)} />
        </linearGradient>
      </defs>

      {framed && (
        <g stroke={rgba(accent, 0.14)} strokeWidth="0.4">
          <path d="M8 8 H112 V132 H8 Z" fill="none" />
          <path d="M8 34 H112 M8 70 H112 M8 100 H112 M34 8 V132 M60 8 V132 M86 8 V132" />
        </g>
      )}

      <g strokeLinecap="round" strokeLinejoin="round">
        {plate.elements.map((el, i) => {
          switch (el.kind) {
            case 'leaf':
              return (
                <use
                  key={i}
                  href={`#${leafId}`}
                  transform={el.transform}
                  fill={`url(#blade-${uid})`}
                  stroke={rgba(plant.model.leaf.top, 0.85)}
                  strokeWidth="0.9"
                />
              )
            case 'stem':
              return (
                <path
                  key={i}
                  d={el.d}
                  transform={el.transform}
                  fill={el.width === 0 ? rgba(plant.model.stem.color, 0.8) : 'none'}
                  stroke={rgba(plant.model.stem.color, 0.95)}
                  strokeWidth={el.width ?? 1.4}
                />
              )
            case 'vein':
              return (
                <path
                  key={i}
                  d={el.d}
                  transform={el.transform}
                  fill="none"
                  stroke={rgba(plant.model.leaf.bottom, 0.85)}
                  strokeWidth={el.width ?? 0.7}
                />
              )
            case 'flower':
              return (
                <circle
                  key={i}
                  cx={el.cx}
                  cy={el.cy}
                  r={el.r}
                  fill={rgba(flowerColor, 0.82)}
                  stroke={rgba(flowerColor, 1)}
                  strokeWidth="0.6"
                />
              )
            case 'core':
              return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} fill={rgba(plant.model.flower?.centre ?? '#e8c96a', 0.95)} />
            case 'fruit':
              return (
                <circle
                  key={i}
                  cx={el.cx}
                  cy={el.cy}
                  r={el.r}
                  fill={rgba(fruitColor, 0.85)}
                  stroke={rgba(fruitColor, 1)}
                  strokeWidth="0.7"
                />
              )
            default:
              return el.d ? (
                <path key={i} d={el.d} fill={rgba(accent, 0.24)} stroke={rgba(accent, 0.9)} strokeWidth="1" />
              ) : (
                <circle
                  key={i}
                  cx={el.cx}
                  cy={el.cy}
                  r={el.r}
                  fill={rgba(plant.model.rhizome?.color ?? accent, 0.55)}
                  stroke={rgba(accent, 0.85)}
                  strokeWidth="0.8"
                />
              )
          }
        })}
      </g>

      {/* Soil line — grounds the specimen on the sheet. */}
      <path d="M22 130 H98" stroke={rgba(accent, 0.35)} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

export function plateCaption(plant: Plant, variant: PlateVariant): string {
  return buildPlate(plant, variant).caption
}
