import { plants } from '../../data/plants'
import type { TherapeuticTag } from '../../types/plant'

/* ------------------------------------------------------------------ *
 * The therapeutic constellation's layout.
 *
 * Kept apart from the drawing so it is plain maths on plain objects —
 * no JSX, no react — which means the spring simulation and the caption
 * placement can be run and checked on their own.
 * ------------------------------------------------------------------ */

export const WIDTH = 720
export const HEIGHT = 560

export interface Node {
  id: string
  label: string
  kind: 'tag' | 'plant'
  color: string
  radius: number
  x: number
  y: number
  vx: number
  vy: number
  degree: number
}

export interface Edge {
  source: string
  target: string
}

export const TAG_COLORS: Record<TherapeuticTag, string> = {
  Digestive: '#d9a13c',
  Immunity: '#4f9d5c',
  Respiratory: '#4aa3a8',
  'Skin & Hair': '#c9743f',
  'Mind & Sleep': '#7c72c4',
  'Heart & Circulation': '#b95a72',
  'Joints & Pain': '#8a7f5c',
  Metabolic: '#9db83f',
  Liver: '#6f9d78',
  'Women’s Health': '#c2688f',
  'Kidney & Urinary': '#5f8fc4',
  'Wound Care': '#b6795a',
}

/** "Heart & Circulation" over two lines is half as wide, and half as
 *  likely to land on top of a neighbouring node. */
export function wrapLabel(label: string): string[] {
  const parts = label.split(' & ')
  return parts.length === 2 ? [`${parts[0]} &`, parts[1]] : [label]
}

/* ------------------------- caption placement ------------------------ *
 * The spring layout keeps *circles* apart, and it has no idea how wide a
 * name is. Plant captions only appear while something is isolated, so
 * reserving room for them in the simulation would spread the whole graph
 * out permanently to pay for labels that are usually not drawn. Instead
 * the captions are placed at draw time, from the positions the layout
 * settled on: fanned outward from whatever is isolated, then nudged off
 * each other until nothing overlaps.
 * ------------------------------------------------------------------- */

/** Average glyph advance as a fraction of font size. A slight over-estimate. */
const CAPTION_EM = 0.54
export const LINE_H = 11
/** Ascender above the first baseline, descender below the last. */
const CAP_UP = 8
const CAP_DOWN = 3
const EDGE_PAD = 3

export interface Caption {
  id: string
  lines: string[]
  x: number
  /** Baseline of the first line. */
  y: number
  anchor: 'start' | 'middle' | 'end'
  size: number
  w: number
  isTag: boolean
  node: Node
}

const capLeft = (c: Caption) =>
  c.anchor === 'middle' ? c.x - c.w / 2 : c.anchor === 'start' ? c.x : c.x - c.w
const capTop = (c: Caption) => c.y - CAP_UP
const capBottom = (c: Caption) => c.y + (c.lines.length - 1) * LINE_H + CAP_DOWN

export function capsOverlap(a: Caption, b: Caption): boolean {
  return (
    capLeft(a) < capLeft(b) + b.w &&
    capLeft(b) < capLeft(a) + a.w &&
    capTop(a) < capBottom(b) &&
    capTop(b) < capBottom(a)
  )
}

/**
 * Hangs one caption off its node, on the side pointing away from whatever
 * the reader is isolating — so the names of a tag's plants fan outward
 * instead of all crowding back toward the hub they share.
 */
export function placeCaption(node: Node, focus: Node | null, isTag: boolean): Caption {
  const lines = wrapLabel(node.label)
  const size = isTag ? 10.5 : 9.5
  const w = Math.max(...lines.map((l) => l.length)) * size * CAPTION_EM
  const gap = node.radius + 6

  let dx = focus ? node.x - focus.x : 0
  let dy = focus ? node.y - focus.y : 1
  // Tags keep their caption underneath, as before: they are the fixed
  // frame of the picture and moving them around would make it restless.
  if (isTag || !focus || Math.hypot(dx, dy) < 1) {
    dx = 0
    dy = 1
  }

  if (Math.abs(dx) > Math.abs(dy) * 1.1) {
    return {
      id: node.id,
      lines,
      x: node.x + (dx > 0 ? gap : -gap),
      y: node.y + 3.5 - ((lines.length - 1) * LINE_H) / 2,
      anchor: dx > 0 ? 'start' : 'end',
      size,
      w,
      isTag,
      node,
    }
  }
  return {
    id: node.id,
    lines,
    x: node.x,
    y: dy < 0 ? node.y - gap - (lines.length - 1) * LINE_H : node.y + gap + 6,
    anchor: 'middle',
    size,
    w,
    isTag,
    node,
  }
}

/**
 * Pushes overlapping captions apart vertically. Tag captions are treated
 * as fixed — they are always on screen, and letting them drift would make
 * the whole picture twitch every time the pointer moved.
 */
export function resolveCaptions(caps: Caption[]) {
  for (let pass = 0; pass < 20; pass++) {
    let moved = false
    for (let i = 0; i < caps.length; i++) {
      for (let j = i + 1; j < caps.length; j++) {
        const a = caps[i]
        const b = caps[j]
        if (a.isTag && b.isTag) continue
        if (!capsOverlap(a, b)) continue

        const aMid = (capTop(a) + capBottom(a)) / 2
        const bMid = (capTop(b) + capBottom(b)) / 2
        const dir = aMid <= bMid ? -1 : 1
        const overlap =
          Math.min(capBottom(a), capBottom(b)) - Math.max(capTop(a), capTop(b))
        const shift = overlap / 2 + 1

        if (a.isTag) b.y -= dir * shift * 2
        else if (b.isTag) a.y += dir * shift * 2
        else {
          a.y += dir * shift
          b.y -= dir * shift
        }
        moved = true
      }
    }
    if (!moved) break
  }

  // Whatever the nudging did, keep every caption on the canvas.
  for (const c of caps) {
    const half = c.anchor === 'middle' ? c.w / 2 : 0
    const min = c.anchor === 'start' ? EDGE_PAD : EDGE_PAD + (c.anchor === 'end' ? c.w : half)
    const max =
      WIDTH - EDGE_PAD - (c.anchor === 'start' ? c.w : c.anchor === 'end' ? 0 : half)
    c.x = Math.min(Math.max(c.x, min), max)
    c.y = Math.min(
      Math.max(c.y, EDGE_PAD + CAP_UP),
      HEIGHT - EDGE_PAD - CAP_DOWN - (c.lines.length - 1) * LINE_H,
    )
  }
}

export function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const tagCounts = new Map<string, number>()

  for (const plant of plants) {
    for (const tag of plant.therapeutic) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  // Tags seeded on a ring, plants just outside it — a sane starting shape
  // beats random placement, which takes far longer to untangle.
  const tags = [...tagCounts.keys()]
  tags.forEach((tag, i) => {
    const angle = (Math.PI * 2 * i) / tags.length
    nodes.push({
      id: `tag:${tag}`,
      label: tag,
      kind: 'tag',
      color: TAG_COLORS[tag as TherapeuticTag] ?? '#4f9d5c',
      radius: 10 + (tagCounts.get(tag) ?? 1) * 1.25,
      x: WIDTH / 2 + Math.cos(angle) * 130,
      y: HEIGHT / 2 + Math.sin(angle) * 110,
      vx: 0,
      vy: 0,
      degree: tagCounts.get(tag) ?? 1,
    })
  })

  plants.forEach((plant, i) => {
    const angle = (Math.PI * 2 * i) / plants.length
    nodes.push({
      id: `plant:${plant.id}`,
      label: plant.name,
      kind: 'plant',
      color: plant.accent,
      radius: 5 + plant.therapeutic.length * 1.2,
      x: WIDTH / 2 + Math.cos(angle) * 235,
      y: HEIGHT / 2 + Math.sin(angle) * 205,
      vx: 0,
      vy: 0,
      degree: plant.therapeutic.length,
    })
    for (const tag of plant.therapeutic) edges.push({ source: `plant:${plant.id}`, target: `tag:${tag}` })
  })

  return { nodes, edges }
}

/** One Verlet-ish step: link springs, all-pairs repulsion, gentle centring. */
export function step(nodes: Node[], edges: Edge[], byId: Map<string, Node>, alpha: number) {
  for (const edge of edges) {
    const a = byId.get(edge.source)!
    const b = byId.get(edge.target)!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy) || 1
    const rest = 88
    const force = ((dist - rest) / dist) * 0.045 * alpha
    a.vx += dx * force
    a.vy += dy * force
    b.vx -= dx * force
    b.vy -= dy * force
  }

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      let dist = Math.hypot(dx, dy)
      if (dist < 0.01) dist = 0.01
      // Tag nodes carry a caption underneath, so they need room for it.
      const captionRoom = (a.kind === 'tag' ? 15 : 0) + (b.kind === 'tag' ? 15 : 0)
      const min = a.radius + b.radius + 24 + captionRoom
      const repel = (900 / (dist * dist)) * alpha
      const push = dist < min ? ((min - dist) / dist) * 0.5 : 0
      const fx = (dx / dist) * repel + dx * push
      const fy = (dy / dist) * repel + dy * push
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  for (const node of nodes) {
    node.vx += (WIDTH / 2 - node.x) * 0.0022 * alpha
    node.vy += (HEIGHT / 2 - node.y) * 0.0026 * alpha
    node.vx *= 0.84
    node.vy *= 0.84
    node.x = Math.max(node.radius + 4, Math.min(WIDTH - node.radius - 4, node.x + node.vx))
    node.y = Math.max(node.radius + 4, Math.min(HEIGHT - node.radius - 4, node.y + node.vy))
  }
}

