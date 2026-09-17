import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * The garden's clock.
 *
 * One number, 0 to 1, runs from before dawn through noon to night, and
 * everything the scene needs — sky, fog, sun colour and angle, how much
 * ambient bounce there is, whether the fireflies are out — is read off
 * it. Keeping it in one table means the sky and the shadows can never
 * disagree about what time it is.
 * ------------------------------------------------------------------ */

export interface DaylightStop {
  at: number
  /** Colour at the horizon. Also the fog and the scene background. */
  sky: string
  /** Colour straight overhead. A flat sky reads as empty paper, not air. */
  zenith: string
  /**
   * Colour of the ambient light coming down from the sky. Kept separate
   * from `sky`: the night background is nearly black, and feeding that
   * into the hemisphere light leaves the garden unlit rather than moonlit.
   */
  hemi: string
  sun: string
  /** Colour of the bounce light coming off the ground. */
  bounce: string
  sunIntensity: number
  ambient: number
  /** Label shown beside the slider. */
  label: string
}

const STOPS: DaylightStop[] = [
  { at: 0.0, sky: '#33405e', zenith: '#131c2e', hemi: '#7d9bbe', sun: '#8fb0d6', bounce: '#3c5450', sunIntensity: 1.0, ambient: 1.55, label: 'Before dawn' },
  { at: 0.12, sky: '#e8ac83', zenith: '#6884b0', hemi: '#e7bd9a', sun: '#ffb877', bounce: '#6b5c46', sunIntensity: 1.5, ambient: 1.05, label: 'Sunrise' },
  { at: 0.3, sky: '#d3e2ee', zenith: '#4d82bd', hemi: '#bcd8ee', sun: '#fff0d2', bounce: '#7d8f56', sunIntensity: 2.3, ambient: 1.1, label: 'Morning' },
  { at: 0.5, sky: '#d2dde6', zenith: '#4487c6', hemi: '#cfe0ee', sun: '#fff8e8', bounce: '#5d6b3a', sunIntensity: 2.5, ambient: 1.12, label: 'Noon' },
  { at: 0.7, sky: '#ddd4c0', zenith: '#4a83bd', hemi: '#e6d3b4', sun: '#ffdca4', bounce: '#6f6a3f', sunIntensity: 2.15, ambient: 1.06, label: 'Afternoon' },
  { at: 0.85, sky: '#e0a37c', zenith: '#4d6d9e', hemi: '#e0a184', sun: '#ff9d63', bounce: '#5e4634', sunIntensity: 1.4, ambient: 1.02, label: 'Golden hour' },
  { at: 0.93, sky: '#b06f76', zenith: '#3a3c60', hemi: '#9b86a2', sun: '#d08a78', bounce: '#4a4150', sunIntensity: 1.15, ambient: 1.3, label: 'Dusk' },
  // Moonlight. Kept deliberately generous: a garden the visitor cannot
  // read is not atmospheric, it is broken.
  { at: 1.0, sky: '#1d2b30', zenith: '#0c141d', hemi: '#7d9dbc', sun: '#a8ccec', bounce: '#33513c', sunIntensity: 1.15, ambient: 1.6, label: 'Night' },
]

export interface Daylight {
  sky: string
  zenith: string
  hemi: string
  sun: string
  bounce: string
  sunIntensity: number
  ambient: number
  label: string
  /** Sun position in world space. */
  sunPosition: [number, number, number]
  /** 0 in full day, 1 in full night — drives fireflies and lamp glow. */
  nightness: number
  /** True once the scene is dark enough to want the night ground texture. */
  dark: boolean
  exposure: number
}

const a = new THREE.Color()
const b = new THREE.Color()

function mixHex(from: string, to: string, t: number): string {
  a.set(from)
  b.set(to)
  return `#${a.lerp(b, t).getHexString()}`
}

export function daylightAt(time: number): Daylight {
  const t = Math.max(0, Math.min(1, time))

  let lower = STOPS[0]
  let upper = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].at && t <= STOPS[i + 1].at) {
      lower = STOPS[i]
      upper = STOPS[i + 1]
      break
    }
  }
  const span = upper.at - lower.at || 1
  const k = (t - lower.at) / span

  // The sun climbs from the eastern horizon to the zenith and back down,
  // reaching its lowest at both ends of the day.
  const arc = Math.PI * Math.min(1, t / 0.92)
  const height = Math.sin(arc)
  const nightness = t > 0.86 ? Math.min(1, (t - 0.86) / 0.12) : t < 0.08 ? 1 - t / 0.08 : 0

  // After sunset the moon takes over, and it is overhead rather than on the
  // horizon — grazing light at midnight would leave the ground unreadable.
  const elevation = Math.max(height, nightness * 0.62)
  const sunPosition: [number, number, number] = [
    Math.cos(arc) * -16,
    Math.max(1.6, elevation * 17),
    7 + Math.cos(arc) * -4,
  ]

  return {
    sky: mixHex(lower.sky, upper.sky, k),
    zenith: mixHex(lower.zenith, upper.zenith, k),
    hemi: mixHex(lower.hemi, upper.hemi, k),
    sun: mixHex(lower.sun, upper.sun, k),
    bounce: mixHex(lower.bounce, upper.bounce, k),
    sunIntensity: lower.sunIntensity + (upper.sunIntensity - lower.sunIntensity) * k,
    ambient: lower.ambient + (upper.ambient - lower.ambient) * k,
    label: k < 0.5 ? lower.label : upper.label,
    sunPosition,
    nightness,
    dark: nightness > 0.45,
    exposure: 1.06 + nightness * 0.34,
  }
}

/* Two hours worth naming: the one the garden opens in, and the one the
 * dark theme implies. Both are just defaults — the slider owns the rest. */
export const AFTERNOON = 0.68
export const EVENING = 0.9

/** Clock face text for the slider, e.g. 0.5 → "12:00". */
export function clockLabel(time: number): string {
  // 05:00 at t=0 through to 21:00 at t=1 — the hours a garden is worth visiting.
  const minutes = 5 * 60 + time * 16 * 60
  const h = Math.floor(minutes / 60) % 24
  const m = Math.floor(minutes % 60 / 15) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
