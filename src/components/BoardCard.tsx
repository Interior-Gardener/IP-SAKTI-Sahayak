import type { CSSProperties } from 'react'
import type { Plant } from '../types/plant'
import { asset } from '../lib/asset'

/* ------------------------------------------------------------------ *
 * The plant display board, reproduced.
 *
 * Every bed in the medicinal garden carries a printed board — silver frame,
 * green banner, orange rule, two round photographs down the right, the
 * trust's logos along the foot. The artwork itself is the scan of a
 * blank one; everything on top of it is the compendium's own data, set
 * into the empty zones the artwork leaves.
 *
 * The zones were measured off the scan in its own pixels (1536 × 1024),
 * so every number below is a real coordinate on that image rather than
 * a guess. Positions are expressed as percentages of the card and type
 * sizes in `cqw`, which means the whole board scales as one piece at
 * any width without a single value needing to be touched.
 * ------------------------------------------------------------------ */

export const BOARD_ART = asset('/cards/plant-board.jpg')

/** The artwork's own pixel grid. */
const ART_W = 1536
const ART_H = 1024

/** Across the card. */
const x = (px: number) => `${(px / ART_W) * 100}%`
/** Down the card. */
const y = (px: number) => `${(px / ART_H) * 100}%`
/** A length that scales with the card — type, rules, photo circles. */
const u = (px: number) => `${(px / ART_W) * 100}cqw`

/* The measured zones. Circles are given as centre + the radius that
 * clears the inside of the printed ring. */
const TOP_PHOTO = { cx: 1254.5, cy: 266.5, r: 213 }
const LOWER_PHOTO = { cx: 1248, cy: 682.5, r: 199 }
/** Left edge of everything written on the board. */
const TEXT_LEFT = 168
/** Where the text column stops, clear of the photographs. */
const TEXT_RIGHT = 1000

const INK = '#17251a'
const GREEN = '#0c7434'
const GREEN_DEEP = '#0a5c2b'
const NAVY = '#14276b'

/** The two languages the real boards carry, in the order they carry them. */
const VERNACULAR = ['Marathi', 'Hindi', 'English'] as const

function circle(c: { cx: number; cy: number; r: number }): CSSProperties {
  return {
    position: 'absolute',
    left: x(c.cx - c.r),
    top: y(c.cy - c.r),
    width: u(c.r * 2),
    height: u(c.r * 2),
    borderRadius: '50%',
    overflow: 'hidden',
  }
}

/** Long Sanskrit names have to give up some size or run off the banner. */
function titleSize(name: string): number {
  if (name.length > 26) return 34
  if (name.length > 19) return 41
  return 50
}

function botanicalSize(name: string): number {
  return name.length > 24 ? 33 : 39
}

export function BoardCard({
  plant,
  className,
  style,
}: {
  plant: Plant
  className?: string
  style?: CSSProperties
}) {
  const title = plant.names.Sanskrit ?? plant.name
  const names: [string, string][] = VERNACULAR.flatMap((lang) => {
    const value = plant.names[lang]
    return value ? [[lang, value] as [string, string]] : []
  }).slice(0, 2)

  const rows: [string, string][] = [
    ['Family', `${plant.family} · ${plant.type}`],
    ['Parts used', plant.partsUsed.slice(0, 3).join(', ')],
    ['Rasa', plant.ayurvedic.rasa.join(', ')],
    ['Virya · Vipaka', `${plant.ayurvedic.virya} · ${plant.ayurvedic.vipaka}`],
    ['Dosha', plant.ayurvedic.dosha],
  ]

  return (
    <div
      className={className}
      style={{
        containerType: 'inline-size',
        aspectRatio: `${ART_W} / ${ART_H}`,
        position: 'relative',
        ...style,
      }}
    >
      <img
        src={BOARD_ART}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />

      {/* -------- Banner: the Sanskrit name over the botanical one -------- */}
      <div
        style={{
          position: 'absolute',
          left: x(TEXT_LEFT + 10),
          top: y(64),
          width: x(640),
          height: y(86),
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: u(titleSize(title)),
            lineHeight: 1,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: x(TEXT_LEFT + 10),
          top: y(153),
          width: x(600),
          height: y(86),
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: u(botanicalSize(plant.botanical)),
            lineHeight: 1,
            color: '#f4fbf5',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {plant.botanical}
        </span>
      </div>

      {/* ------------------ The two round photographs ------------------ */}
      {plant.photos[0] && (
        <div style={circle(TOP_PHOTO)}>
          <img
            src={plant.photos[0].src}
            alt={plant.photos[0].alt}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      {plant.photos[1] && (
        <div style={circle(LOWER_PHOTO)}>
          <img
            src={plant.photos[1].src}
            alt={plant.photos[1].alt}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* --------------------- The written column --------------------- */}
      <div
        style={{
          position: 'absolute',
          left: x(TEXT_LEFT),
          top: y(303),
          width: x(TEXT_RIGHT - TEXT_LEFT),
          height: y(836 - 303),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Vernacular names, dashes aligned the way the printed boards do. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content max-content',
            columnGap: u(18),
            rowGap: u(10),
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: u(35),
            lineHeight: 1.15,
          }}
        >
          {names.map(([lang, value]) => (
            <div key={lang} style={{ display: 'contents' }}>
              <span style={{ color: GREEN }}>{lang}</span>
              <span style={{ color: INK }}>— {value}</span>
            </div>
          ))}
        </div>

        <Rule top={20} bottom={18} />

        {/* Classical properties, as the compendium records them. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            columnGap: u(20),
            rowGap: u(9),
            fontFamily: 'var(--font-sans)',
            fontSize: u(26),
            lineHeight: 1.2,
          }}
        >
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <span style={{ color: GREEN_DEEP, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
              <span style={{ color: INK }}>{value}</span>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: u(12),
            fontFamily: 'var(--font-sans)',
            fontStyle: 'italic',
            fontSize: u(22),
            lineHeight: 1.2,
            color: '#5c6b5c',
          }}
        >
          After Ayurvedic Pharmacopoeia of India conventions.
        </p>

        <Rule top={18} bottom={18} />

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: u(33),
            lineHeight: 1.32,
            color: NAVY,
          }}
        >
          {plant.tagline}
        </p>
      </div>
    </div>
  )
}

function Rule({ top, bottom }: { top: number; bottom: number }) {
  return (
    <div
      style={{
        marginTop: u(top),
        marginBottom: u(bottom),
        height: u(2.5),
        background: GREEN_DEEP,
        opacity: 0.75,
        flex: 'none',
      }}
    />
  )
}
