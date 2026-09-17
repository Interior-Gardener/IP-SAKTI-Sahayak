import * as THREE from 'three'
import { BED_RADIUS, gardenBeds } from '../data/plants'
import { makeRng } from './procedural/rng'

/* ------------------------------------------------------------------ *
 * The garden floor is one canvas-drawn texture: lawn, gravel walks,
 * a central plaza and the soil of each themed bed. Painting the plan
 * once costs a single draw call instead of dozens of path meshes.
 * ------------------------------------------------------------------ */

export const GARDEN_EXTENT = 13.5

let cached: { texture: THREE.CanvasTexture; dark: boolean } | null = null

interface Palette {
  lawn: string
  lawnAlt: string
  gravel: string
  plaza: string
  soil: string
  edge: string
}

const LIGHT: Palette = {
  lawn: '#6d8b4e',
  lawnAlt: '#5e7c44',
  gravel: '#c6bda2',
  plaza: '#cfc7ae',
  soil: '#6a5137',
  edge: '#a99b7c',
}

const DARK: Palette = {
  lawn: '#40603f',
  lawnAlt: '#365436',
  gravel: '#7e7d66',
  plaza: '#807f68',
  soil: '#584534',
  edge: '#8e8d73',
}

/** Maps a garden-space coordinate onto the texture canvas. */
function project(value: number, size: number): number {
  return ((value + GARDEN_EXTENT) / (GARDEN_EXTENT * 2)) * size
}

export function gardenFloorTexture(dark: boolean): THREE.CanvasTexture {
  if (cached && cached.dark === dark) return cached.texture
  cached?.texture.dispose()

  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const p = dark ? DARK : LIGHT
  const rng = makeRng(20260820)
  const centre = size / 2
  const scale = size / (GARDEN_EXTENT * 2)

  // Lawn base, mown in soft bands.
  ctx.fillStyle = p.lawn
  ctx.fillRect(0, 0, size, size)
  ctx.globalAlpha = 0.5
  ctx.fillStyle = p.lawnAlt
  for (let y = 0; y < size; y += 46) ctx.fillRect(0, y, size, 23)
  ctx.globalAlpha = 1

  // Grain: thousands of tiny strokes so the lawn never looks flat.
  ctx.globalAlpha = 0.16
  for (let i = 0; i < 5200; i++) {
    const x = rng.next() * size
    const y = rng.next() * size
    ctx.fillStyle = rng.next() > 0.5 ? p.lawnAlt : p.lawn
    ctx.fillRect(x, y, 2 + rng.next() * 4, 1.5)
  }
  ctx.globalAlpha = 1

  const gravelStroke = (width: number) => {
    ctx.strokeStyle = p.gravel
    ctx.lineWidth = width
    ctx.lineCap = 'round'
  }

  // Perimeter walk.
  gravelStroke(scale * 1.05)
  ctx.beginPath()
  ctx.arc(centre, centre, scale * 10.6, 0, Math.PI * 2)
  ctx.stroke()

  // Spokes from the plaza out to each bed.
  for (const bed of gardenBeds) {
    const [bx, bz] = bed.position
    gravelStroke(scale * 0.85)
    ctx.beginPath()
    ctx.moveTo(centre, centre)
    ctx.lineTo(project(bx, size), project(bz, size))
    ctx.stroke()
  }

  // Central plaza.
  ctx.fillStyle = p.plaza
  ctx.beginPath()
  ctx.arc(centre, centre, scale * 3.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = p.edge
  ctx.lineWidth = scale * 0.16
  ctx.stroke()

  // Concentric paving rings in the plaza.
  ctx.globalAlpha = 0.35
  for (let r = 0.8; r < 3.1; r += 0.7) {
    ctx.beginPath()
    ctx.arc(centre, centre, scale * r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Bed soil, with a stone kerb.
  for (const bed of gardenBeds) {
    const x = project(bed.position[0], size)
    const y = project(bed.position[1], size)
    const radius = scale * BED_RADIUS

    ctx.fillStyle = p.soil
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Raked soil texture.
    ctx.globalAlpha = 0.18
    ctx.strokeStyle = dark ? '#000000' : '#3d2f1f'
    ctx.lineWidth = 2
    for (let i = -6; i <= 6; i++) {
      const offset = (i / 6) * radius * 0.85
      const half = Math.sqrt(Math.max(0, radius * radius - offset * offset)) * 0.92
      ctx.beginPath()
      ctx.moveTo(x - half, y + offset)
      ctx.lineTo(x + half, y + offset)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // A ring of the bed's own accent, so themes read from above.
    ctx.strokeStyle = bed.accent
    ctx.globalAlpha = 0.55
    ctx.lineWidth = scale * 0.14
    ctx.beginPath()
    ctx.arc(x, y, radius + scale * 0.1, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // The lawn dissolves to *transparent* rather than to a colour. It used to
  // fade into a hardcoded sky value, which stopped matching the moment the
  // sky started changing with the hour — and left a visible plate edge,
  // since this plane is lit and the background is not. Fading the alpha
  // instead lets the unlit horizon plane behind it show through, so the
  // join is exact at every hour of the day.
  ctx.globalCompositeOperation = 'destination-out'
  const fade = ctx.createRadialGradient(centre, centre, scale * 7.6, centre, centre, scale * 13.2)
  fade.addColorStop(0, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  cached = { texture, dark }
  return texture
}
