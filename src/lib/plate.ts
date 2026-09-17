import type { Plant, PlantModelSpec } from '../types/plant'
import { leafProfile } from '../three/procedural/leaf'
import { hashSeed, makeRng } from '../three/procedural/rng'

/* ------------------------------------------------------------------ *
 * Botanical plates.
 *
 * The same profile mathematics that shapes the 3D leaf also draws the
 * 2D specimen plates used on cards and in the media gallery, so a
 * plant's silhouette is recognisably the same in both. Everything is
 * pure SVG path data — deterministic, tiny, and crisp at any size.
 * ------------------------------------------------------------------ */

export type PlateVariant = 'habit' | 'leaf' | 'flower' | 'part'

export interface PlateElement {
  kind: 'stem' | 'leaf' | 'vein' | 'flower' | 'core' | 'fruit' | 'organ'
  d?: string
  transform?: string
  cx?: number
  cy?: number
  r?: number
  width?: number
}

export interface Plate {
  viewBox: string
  elements: PlateElement[]
  /** Path of a single leaf, pointing up from the origin, for <use>. */
  leafPath: string
  caption: string
}

function THREE_clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const VIEW_W = 120
const VIEW_H = 140
const BASE_Y = 128

/** Outline of one blade: up the right margin, back down the left. */
function bladePath(spec: PlantModelSpec, length: number, width: number): string {
  const shape = spec.leaf.shape
  const samples = 26
  const notch = shape === 'cordate' ? 0.17 : shape === 'reniform' ? 0.3 : 0
  // A peltate blade hangs from its middle, so its outline is centred on the
  // attachment point instead of rising out of it.
  const hub = shape === 'peltate' ? length * 0.5 : 0
  const serration = spec.leaf.serration ?? 0

  const right: string[] = []
  const left: string[] = []

  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    let profile = leafProfile(shape, t)
    if (serration > 0) {
      profile *= 1 - serration * 0.16 * (0.5 + 0.5 * Math.cos(t * 9 * Math.PI * 2))
    }
    const halfWidth = profile * width * 0.5
    const y = -t * length + hub + notch * length * Math.max(0, 1 - t / 0.28)
    right.push(`${halfWidth.toFixed(2)},${y.toFixed(2)}`)
    left.push(`${(-halfWidth).toFixed(2)},${y.toFixed(2)}`)
  }

  return `M ${right[0]} L ${right.slice(1).join(' L ')} L ${left.reverse().join(' L ')} Z`
}

/** Midrib plus lateral veins for a close-up leaf study. */
function veinPaths(spec: PlantModelSpec, length: number, width: number): string[] {
  if (spec.leaf.shape === 'peltate') {
    // No midrib to hang laterals off — a lotus pad's veins run out from the hub.
    const ribs = 14
    return Array.from({ length: ribs }, (_, i) => {
      const a = (i / ribs) * Math.PI * 2
      return `M 0,0 L ${(Math.cos(a) * width * 0.5).toFixed(2)},${(Math.sin(a) * length * 0.5).toFixed(2)}`
    })
  }
  const paths = [`M 0,0 L 0,${(-length).toFixed(2)}`]
  const pairs = 6
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1)
    const y = -t * length
    const reach = leafProfile(spec.leaf.shape, t) * width * 0.42
    const tip = -t * length - length * 0.13
    paths.push(`M 0,${y.toFixed(2)} Q ${(reach * 0.6).toFixed(2)},${(y - length * 0.03).toFixed(2)} ${reach.toFixed(2)},${tip.toFixed(2)}`)
    paths.push(`M 0,${y.toFixed(2)} Q ${(-reach * 0.6).toFixed(2)},${(y - length * 0.03).toFixed(2)} ${(-reach).toFixed(2)},${tip.toFixed(2)}`)
  }
  return paths
}

interface Node {
  x: number
  y: number
  angle: number
  scale: number
}

/** Traces a stem as a quadratic curve and reports leaf attachment points. */
function stemCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bow: number,
  nodes: number,
  spread: number,
): { d: string; nodes: Node[] } {
  const cx = (x0 + x1) / 2 + bow
  const cy = (y0 + y1) / 2
  const points: Node[] = []
  for (let i = 0; i < nodes; i++) {
    const t = 0.18 + (i / Math.max(1, nodes - 1)) * 0.78
    const mt = 1 - t
    const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1
    const py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1
    const side = i % 2 === 0 ? 1 : -1
    points.push({
      x: px,
      y: py,
      angle: side * spread * (1 - t * 0.25),
      scale: 1 - t * 0.35,
    })
  }
  return { d: `M ${x0},${y0} Q ${cx},${cy} ${x1},${y1}`, nodes: points }
}

function habitElements(plant: Plant): PlateElement[] {
  const spec = plant.model
  const rng = makeRng(hashSeed(plant.id + 'plate'))
  const elements: PlateElement[] = []

  const leafAt = (n: Node, extra = 0, scale = 1) =>
    elements.push({
      kind: 'leaf',
      transform: `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)}) rotate(${(n.angle + extra).toFixed(1)}) scale(${(n.scale * scale).toFixed(3)})`,
    })

  switch (spec.archetype) {
    case 'rosette':
    case 'grass': {
      const blades = spec.archetype === 'grass' ? 13 : 11
      const arc = spec.archetype === 'grass' ? 62 : 84
      for (let i = 0; i < blades; i++) {
        const ratio = i / (blades - 1)
        const angle = (ratio - 0.5) * 2 * arc + rng.jitter(5)
        elements.push({
          kind: 'leaf',
          transform: `translate(${VIEW_W / 2} ${BASE_Y}) rotate(${angle.toFixed(1)}) scale(${(0.82 + Math.abs(ratio - 0.5) * 0.5).toFixed(3)})`,
        })
      }
      if (spec.flower) {
        const stalk = stemCurve(VIEW_W / 2, BASE_Y, VIEW_W / 2 + 6, 22, 5, 1, 0)
        elements.push({ kind: 'stem', d: stalk.d, width: 1.6 })
        for (let i = 0; i < 7; i++) {
          elements.push({ kind: 'flower', cx: VIEW_W / 2 + 4 + rng.jitter(4), cy: 24 + i * 6, r: 2.6 })
        }
      }
      break
    }

    case 'tree': {
      const trunkTop = 58
      elements.push({
        kind: 'stem',
        d: `M ${VIEW_W / 2 - 3.4},${BASE_Y} Q ${VIEW_W / 2 - 1.6},${(BASE_Y + trunkTop) / 2} ${VIEW_W / 2 - 1.4},${trunkTop} L ${VIEW_W / 2 + 1.4},${trunkTop} Q ${VIEW_W / 2 + 1.6},${(BASE_Y + trunkTop) / 2} ${VIEW_W / 2 + 3.4},${BASE_Y} Z`,
        width: 0,
      })
      const limbs = 7
      for (let i = 0; i < limbs; i++) {
        const dir = i % 2 === 0 ? 1 : -1
        const t = i / (limbs - 1)
        // Lower limbs reach widest; upper ones climb into the crown.
        const from = trunkTop + 12 - t * 14
        const reach = (38 - t * 12) * (0.85 + rng.next() * 0.3)
        const tipX = VIEW_W / 2 + dir * reach
        const tipY = from - 16 - t * 14 - rng.range(0, 8)
        const limb = stemCurve(VIEW_W / 2, from, tipX, tipY, dir * 9, 4, dir * 54)
        elements.push({ kind: 'stem', d: limb.d, width: 1.4 })
        for (const node of limb.nodes) leafAt(node, rng.jitter(22), 0.95)
        // Foliage massed at the end of each limb, where a real crown carries it.
        for (let k = 0; k < 6; k++) {
          leafAt(
            {
              x: tipX + rng.jitter(11),
              y: tipY + rng.jitter(10),
              angle: rng.range(-170, 170),
              scale: 0.6 + rng.next() * 0.3,
            },
            0,
            1,
          )
        }
      }
      if (spec.fruit) {
        for (let i = 0; i < 6; i++) {
          elements.push({
            kind: 'fruit',
            cx: VIEW_W / 2 + rng.jitter(32),
            cy: 46 + rng.jitter(20),
            r: 3.4,
          })
        }
      }
      break
    }

    case 'aquatic': {
      /* A waterline with stalks through it: pads held at their own heights,
       * and the flower standing over the top of the lot. */
      const water = BASE_Y - 5
      elements.push({ kind: 'stem', d: `M 6,${water} L ${VIEW_W - 6},${water}`, width: 1 })
      const stalks = 5
      for (let i = 0; i < stalks; i++) {
        const dir = i % 2 === 0 ? 1 : -1
        const x = VIEW_W / 2 + dir * (9 + (i / stalks) * 26)
        const y = water - 26 - (i % 3) * 20 - rng.range(0, 7)
        elements.push({ kind: 'stem', d: stemCurve(VIEW_W / 2 + dir * 3, BASE_Y, x, y, dir * 5, 1, 0).d, width: 1.5 })
        leafAt({ x, y, angle: 0, scale: 1 }, 0, 0.95 - (i % 3) * 0.08)
      }
      if (spec.flower) {
        const fx = VIEW_W / 2 + 12
        const fy = 26
        elements.push({ kind: 'stem', d: stemCurve(VIEW_W / 2 + 4, BASE_Y, fx, fy, 7, 1, 0).d, width: 1.4 })
        for (let ring = 0; ring < 3; ring++) {
          const petals = 8 - ring * 2
          for (let k = 0; k < petals; k++) {
            const a = (k / petals) * Math.PI * 2 + ring * 0.4
            elements.push({
              kind: 'flower',
              cx: fx + Math.cos(a) * (13 - ring * 4),
              cy: fy + Math.sin(a) * (8 - ring * 2.5),
              r: 6 - ring * 1.3,
            })
          }
        }
        elements.push({ kind: 'core', cx: fx, cy: fy, r: 3.4 })
      }
      break
    }

    case 'creeper': {
      for (let i = 0; i < 3; i++) {
        const dir = i === 1 ? 1 : -1
        const y = BASE_Y - 6 - i * 16
        const runner = stemCurve(VIEW_W / 2 - dir * 6, y, VIEW_W / 2 + dir * 44, y - 12, dir * 10, 5, dir * 30)
        elements.push({ kind: 'stem', d: runner.d, width: 1.3 })
        for (const node of runner.nodes) leafAt(node, rng.jitter(20), 1.05)
      }
      break
    }

    case 'climber': {
      const coils = 3
      let d = `M ${VIEW_W / 2},${BASE_Y}`
      const nodes: Node[] = []
      for (let i = 1; i <= coils * 2; i++) {
        const t = i / (coils * 2)
        const y = BASE_Y - t * 100
        const x = VIEW_W / 2 + Math.sin(i * 1.9) * 17
        d += ` Q ${VIEW_W / 2 + Math.sin(i * 1.9 - 0.9) * 24},${y + 9} ${x},${y}`
        nodes.push({ x, y, angle: (i % 2 === 0 ? 1 : -1) * 46, scale: 1 - t * 0.3 })
      }
      elements.push({ kind: 'stem', d, width: 1.6 })
      // A stake for the vine to twine around.
      elements.push({ kind: 'stem', d: `M ${VIEW_W / 2},${BASE_Y} L ${VIEW_W / 2},22`, width: 1 })
      for (const node of nodes) leafAt(node, rng.jitter(12), 1.1)
      break
    }

    default: {
      const stems = spec.archetype === 'shrub' ? 3 : 1
      for (let i = 0; i < stems; i++) {
        const dir = stems === 1 ? 0 : i - 1
        const top = 34 + Math.abs(dir) * 14 + rng.jitter(5)
        const stem = stemCurve(
          VIEW_W / 2 + dir * 5,
          BASE_Y,
          VIEW_W / 2 + dir * 30,
          top,
          dir * 6,
          spec.leaf.arrangement === 'opposite' ? 8 : 6,
          spec.leaf.arrangement === 'opposite' ? 62 : 54,
        )
        elements.push({ kind: 'stem', d: stem.d, width: 1.7 })
        for (const node of stem.nodes) {
          leafAt(node, rng.jitter(10))
          if (spec.leaf.arrangement === 'opposite') {
            leafAt({ ...node, angle: -node.angle }, rng.jitter(10))
          }
        }
        if (spec.flower) {
          for (let k = 0; k < 5; k++) {
            elements.push({
              kind: 'flower',
              cx: VIEW_W / 2 + dir * 30 + rng.jitter(4),
              cy: top - 4 - k * 5,
              r: 2.4,
            })
          }
        }
      }
      if (spec.rhizome) {
        for (let i = 0; i < 4; i++) {
          elements.push({
            kind: 'organ',
            cx: VIEW_W / 2 - 12 + i * 8 + rng.jitter(2),
            cy: BASE_Y + 3 + rng.jitter(2),
            r: 5.2,
          })
        }
      }
      break
    }
  }

  return elements
}

/** Builds one specimen plate for a plant. */
export function buildPlate(plant: Plant, variant: PlateVariant = 'habit'): Plate {
  const spec = plant.model
  const unit = 96 / spec.height
  const compoundBoost = spec.leaf.compound ? 3.2 : 1
  // A plate is a drawing, not a scale model: a tree's true leaf would be a
  // speck at this size, so canopy species get a legible minimum.
  const floor = spec.archetype === 'tree' ? 15 : spec.archetype === 'climber' ? 12 : 9
  // A ground-hugging creeper's leaf is a huge fraction of its own height, which
  // is true but unreadable on a plate — so each habit gets a ceiling too.
  const ceiling =
    spec.archetype === 'aquatic'
      ? 26
      : spec.archetype === 'rosette' || spec.archetype === 'grass'
        ? 40
      : spec.archetype === 'creeper'
        ? 21
        : spec.archetype === 'tree'
          ? 24
          : 32
  const leafLen = THREE_clamp(spec.leaf.length * unit * compoundBoost, floor, ceiling)
  const leafWid =
    leafLen * (spec.leaf.width / Math.max(spec.leaf.length, 1e-4)) * (spec.leaf.compound ? 0.62 : 1)

  const leafPath = bladePath(spec, leafLen, leafWid)
  let elements: PlateElement[] = []
  let caption = ''

  if (variant === 'habit') {
    elements = habitElements(plant)
    caption = `${plant.type} · habit`
  } else if (variant === 'leaf') {
    const big = 92
    const bigWidth = big * (spec.leaf.width / Math.max(spec.leaf.length, 1e-4))
    elements = [
      { kind: 'stem', d: `M ${VIEW_W / 2},${BASE_Y} L ${VIEW_W / 2},${BASE_Y - 14}`, width: 1.8 },
      { kind: 'leaf', transform: `translate(${VIEW_W / 2} ${BASE_Y - 14}) scale(1)` },
      ...veinPaths(spec, big, bigWidth).map((d) => ({ kind: 'vein' as const, d, transform: `translate(${VIEW_W / 2} ${BASE_Y - 14})`, width: 0.7 })),
    ]
    return {
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      elements,
      leafPath: bladePath(spec, big, bigWidth),
      caption: `${spec.leaf.shape} leaf · ${spec.leaf.arrangement}${spec.leaf.compound ? ` · ${spec.leaf.compound}` : ''}`,
    }
  } else if (variant === 'flower') {
    elements = flowerElements(plant)
    caption = spec.flower ? `${spec.flower.form} inflorescence` : 'flowers rarely seen'
  } else {
    elements = partElements(plant)
    caption = `${plant.partsUsed[0]} · medicinal part`
  }

  return { viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, elements, leafPath, caption }
}

function flowerElements(plant: Plant): PlateElement[] {
  const spec = plant.model
  const rng = makeRng(hashSeed(plant.id + 'flower'))
  const elements: PlateElement[] = []
  const cx = VIEW_W / 2

  if (!spec.flower) {
    // Species that seldom flower in cultivation get a bud study instead.
    elements.push({ kind: 'stem', d: `M ${cx},${BASE_Y} L ${cx},40`, width: 2 })
    for (let i = 0; i < 4; i++) {
      elements.push({ kind: 'leaf', transform: `translate(${cx} ${70 + i * 14}) rotate(${i % 2 ? 55 : -55}) scale(0.9)` })
    }
    return elements
  }

  const form = spec.flower.form
  const stemTop = form === 'umbel' ? 56 : form === 'lotus' ? 62 : 42
  elements.push({ kind: 'stem', d: `M ${cx},${BASE_Y} L ${cx},${stemTop}`, width: 2 })

  if (form === 'lotus') {
    /* Whorls, not one ring — three of them stepping in toward a flat
     * receptacle, which is the whole difference between this and a daisy. */
    for (let ring = 0; ring < 3; ring++) {
      const petals = 10 - ring * 2
      const spread = 27 - ring * 8
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + ring * 0.35
        elements.push({
          kind: 'flower',
          cx: cx + Math.cos(a) * spread,
          cy: 62 + Math.sin(a) * spread * 0.6,
          r: 11 - ring * 2.4,
        })
      }
    }
    elements.push({ kind: 'core', cx, cy: 62, r: 7.5 })
    // The carpels sunk in the face of it.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      elements.push({ kind: 'core', cx: cx + Math.cos(a) * 3.8, cy: 62 + Math.sin(a) * 2.5, r: 1.2 })
    }
  } else if (form === 'spike' || form === 'catkin') {
    for (let i = 0; i < 9; i++) {
      const y = 44 + i * 8
      elements.push({ kind: 'flower', cx: cx + (i % 2 ? 7 : -7), cy: y, r: 5.4 - i * 0.18 })
      elements.push({ kind: 'core', cx: cx + (i % 2 ? 7 : -7), cy: y, r: 1.7 })
    }
  } else if (form === 'umbel') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      const x = cx + Math.cos(a) * 26
      const y = 44 + Math.sin(a) * 15
      elements.push({ kind: 'stem', d: `M ${cx},56 L ${x.toFixed(1)},${y.toFixed(1)}`, width: 0.9 })
      elements.push({ kind: 'flower', cx: x, cy: y, r: 6 })
      elements.push({ kind: 'core', cx: x, cy: y, r: 1.9 })
    }
  } else if (form === 'panicle') {
    for (let i = 0; i < 5; i++) {
      const dir = i % 2 === 0 ? 1 : -1
      const y = 50 + i * 11
      const x = cx + dir * (12 + rng.range(4, 12))
      elements.push({ kind: 'stem', d: `M ${cx},${y} L ${x.toFixed(1)},${(y - 8).toFixed(1)}`, width: 0.9 })
      for (let k = 0; k < 3; k++) {
        elements.push({ kind: 'flower', cx: x + rng.jitter(6), cy: y - 8 + rng.jitter(5), r: 3.6 })
      }
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * 24
      const y = 52 + Math.abs(i - 1) * 12
      elements.push({ kind: 'stem', d: `M ${cx},${BASE_Y - 20} L ${x},${y}`, width: 1 })
      elements.push({ kind: 'flower', cx: x, cy: y, r: 11 - Math.abs(i - 1) * 2 })
      elements.push({ kind: 'core', cx: x, cy: y, r: 3.4 })
    }
  }
  return elements
}

function partElements(plant: Plant): PlateElement[] {
  const spec = plant.model
  const rng = makeRng(hashSeed(plant.id + 'part'))
  const elements: PlateElement[] = []
  const cx = VIEW_W / 2
  const part = plant.partsUsed[0].toLowerCase()

  if (spec.rhizome || part.includes('rhizome') || part.includes('root') || part.includes('tuber')) {
    // A branched rhizome or root fascicle.
    elements.push({ kind: 'stem', d: `M ${cx},34 L ${cx},64`, width: 2.4 })
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 === 0 ? 1 : -1
      const x = cx + dir * (10 + (i % 3) * 9)
      const y = 66 + i * 9
      elements.push({ kind: 'organ', cx: x, cy: y, r: 9 - i * 0.7 })
      elements.push({ kind: 'stem', d: `M ${cx},${64 + i * 4} L ${x},${y}`, width: 1.4 })
    }
    elements.push({ kind: 'organ', cx, cy: 66, r: 11 })
  } else if (part.includes('fruit') || part.includes('seed') || part.includes('pod')) {
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * 28
      const y = 74 + Math.abs(i - 1) * 8
      elements.push({ kind: 'stem', d: `M ${x},${y - 16} L ${x},${y - 26}`, width: 1.4 })
      elements.push({ kind: 'fruit', cx: x, cy: y, r: 16 - Math.abs(i - 1) * 3 })
    }
  } else if (part.includes('bark') || part.includes('wood') || part.includes('resin')) {
    // A strip of bark, curled at the edges.
    elements.push({
      kind: 'organ',
      d: `M ${cx - 22},32 Q ${cx - 30},${VIEW_H / 2} ${cx - 20},108 L ${cx + 20},108 Q ${cx + 30},${VIEW_H / 2} ${cx + 22},32 Z`,
    })
    for (let i = 0; i < 5; i++) {
      const x = cx - 14 + i * 7
      elements.push({ kind: 'vein', d: `M ${x},36 Q ${x + rng.jitter(5)},${VIEW_H / 2} ${x},104`, width: 0.8 })
    }
  } else {
    // Leaf-based drugs: a small pressed spray.
    for (let i = 0; i < 5; i++) {
      const dir = i % 2 === 0 ? 1 : -1
      elements.push({
        kind: 'leaf',
        transform: `translate(${cx + dir * 6} ${106 - i * 15}) rotate(${dir * (52 + rng.jitter(9))}) scale(${(1.15 - i * 0.09).toFixed(2)})`,
      })
    }
    elements.push({ kind: 'stem', d: `M ${cx},${BASE_Y} Q ${cx + 4},80 ${cx},34`, width: 1.8 })
  }
  return elements
}
