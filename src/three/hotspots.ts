import * as THREE from 'three'
import type { PlantGeometrySet } from './procedural/plant'

/* ------------------------------------------------------------------ *
 * Where the part labels attach. The old placement guessed a height and
 * a radius from the plant's overall bounding box, which left dots
 * hanging in mid-air whenever a specimen was not a tidy cylinder — an
 * aloe rosette under a tall flower spike being the worst case. These
 * anchors are picked off the generated geometry instead, so every dot
 * lands on the organ it names.
 * ------------------------------------------------------------------ */

type OrganKey = 'stem' | 'foliage' | 'petal' | 'core' | 'fruit' | 'ripeFruit' | 'rhizome'

/**
 * Which generated organs can carry a given medicinal part, best first.
 * `siblings` are the plant's other listed parts — an extract takes its
 * anchor from the organ it is drawn out of, and for oils that depends on
 * the species: lemongrass oil is in the leaf, sandalwood oil in the wood.
 */
function organsFor(part: string, siblings: string[]): OrganKey[] {
  const p = part.toLowerCase()
  // Extracts, named for the substance rather than the organ that holds it.
  if (/satva|starch/.test(p)) return ['stem', 'rhizome', 'foliage']
  if (/stolon|runner|offset/.test(p)) return ['stem', 'rhizome', 'foliage']
  if (/oil|otto|attar/.test(p) && !/seed|kernel|fruit/.test(p)) {
    const woody = siblings.some((s) => /wood|bark|root/.test(s.toLowerCase()))
    return woody ? ['stem', 'foliage'] : ['foliage', 'stem']
  }
  if (/root|rhizome|tuber|bulb|corm/.test(p)) return ['rhizome', 'stem', 'foliage']
  if (/bark|stem|wood|resin|gum|twig|branch|culm|shoot|cane/.test(p)) return ['stem', 'foliage']
  if (/flower|petal|blossom|bud|stigma|calyx|inflorescence/.test(p)) return ['petal', 'core', 'foliage']
  // Unripe first: "unripe" contains "ripe".
  if (/unripe|green fruit/.test(p)) return ['fruit', 'ripeFruit', 'petal', 'foliage']
  if (/ripe|mature fruit/.test(p)) return ['ripeFruit', 'fruit', 'petal', 'foliage']
  if (/fruit|seed|pod|nut|berry|rind|peel|kernel|drupe|aril/.test(p))
    return ['fruit', 'ripeFruit', 'petal', 'foliage']
  if (/leaf|leaves|frond|blade|gel|latex|sap|juice/.test(p)) return ['foliage', 'stem']
  if (/whole|aerial|herb|plant|panchang/.test(p)) return ['foliage', 'stem']
  return ['foliage', 'stem', 'petal']
}

interface Cloud {
  points: Float32Array
  count: number
  minY: number
  maxY: number
  maxR: number
}

const clouds = new WeakMap<THREE.BufferGeometry, Cloud>()

/** A thinned copy of an organ's vertices — enough to find its silhouette. */
function cloudOf(geo: THREE.BufferGeometry): Cloud {
  const hit = clouds.get(geo)
  if (hit) return hit

  const pos = geo.attributes.position as THREE.BufferAttribute
  const stride = Math.max(1, Math.floor(pos.count / 1500))
  const kept = Math.ceil(pos.count / stride)
  const points = new Float32Array(kept * 3)
  let n = 0
  let minY = Infinity
  let maxY = -Infinity
  let maxR = 0
  for (let i = 0; i < pos.count; i += stride) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    points[n * 3] = x
    points[n * 3 + 1] = y
    points[n * 3 + 2] = z
    n++
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    const r = Math.hypot(x, z)
    if (r > maxR) maxR = r
  }
  const cloud: Cloud = { points, count: n, minY, maxY, maxR: Math.max(maxR, 1e-4) }
  clouds.set(geo, cloud)
  return cloud
}

/** Signed distance between two bearings, wrapped to [-π, π]. */
function bearingGap(a: number, b: number): number {
  let d = a - b
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

type Anchor = [number, number, number]

/**
 * Picks the outermost vertex of `geo` near a wanted bearing and height, so
 * the dot sits on the visible edge of the organ rather than inside it.
 * Candidates already too close to a placed label are passed over, which is
 * what stops "Leaf gel" and "Leaf latex" landing on top of one another.
 */
function pickOn(
  geo: THREE.BufferGeometry,
  bearing: number,
  level: number,
  taken: Anchor[],
  minGap: number,
  levelWeight: number,
  band?: [number, number],
): Anchor | null {
  const cloud = cloudOf(geo)
  if (!cloud.count) return null
  const span = Math.max(1e-4, cloud.maxY - cloud.minY)

  // Three tiers: fully clear of placed labels, half-clear, anything at all.
  const best: (Anchor | null)[] = [null, null, null]
  const bestScore = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < cloud.count; i++) {
    const x = cloud.points[i * 3]
    const y = cloud.points[i * 3 + 1]
    const z = cloud.points[i * 3 + 2]
    const r = Math.hypot(x, z)
    const gap = Math.abs(bearingGap(Math.atan2(z, x), bearing))
    const height = (y - cloud.minY) / span
    if (band && (height < band[0] || height > band[1])) continue
    const levelGap = Math.abs(height - level)
    // Reward reach (silhouette), punish drifting off the wanted bearing/height.
    const score = r / cloud.maxR - gap * 0.55 - levelGap * levelWeight
    let nearest = Infinity
    for (const t of taken) {
      const d = Math.hypot(t[0] - x, t[1] - y, t[2] - z)
      if (d < nearest) nearest = d
    }
    const tier = nearest >= minGap ? 0 : nearest >= minGap * 0.5 ? 1 : 2
    if (score > bestScore[tier]) {
      bestScore[tier] = score
      best[tier] = [x, y, z]
    }
  }
  return best[0] ?? best[1] ?? best[2]
}

/**
 * One anchor per medicinal part, in the order the parts are given.
 * Parts sharing an organ are fanned around it and staggered in height.
 */
export function hotspotAnchors(parts: string[], set: PlantGeometrySet): Anchor[] {
  const box = set.bounds
  const top = Math.max(0.06, box.max.y)
  const spread = Math.max(Math.abs(box.min.x), box.max.x, Math.abs(box.min.z), box.max.z, top * 0.14)
  const minGap = Math.max(top, spread) * 0.22

  // Group by organ first so parts drawn from the same organ can be fanned apart.
  const wanted = parts.map((part) => {
    const keys = organsFor(part, parts)
    const key = keys.find((k) => set[k]) ?? null
    return { part, key }
  })
  const seats = new Map<OrganKey | 'none', number>()
  const totals = new Map<OrganKey | 'none', number>()
  for (const w of wanted) totals.set(w.key ?? 'none', (totals.get(w.key ?? 'none') ?? 0) + 1)

  const taken: Anchor[] = []
  return wanted.map(({ part, key }, i) => {
    const bucket = key ?? 'none'
    const seat = seats.get(bucket) ?? 0
    seats.set(bucket, seat + 1)
    const share = totals.get(bucket) ?? 1
    // Fan the bearing around the specimen, then stagger heights within the organ.
    const bearing = (i * 2.4 + seat * 0.9 + 0.6) % (Math.PI * 2)
    // Roots and other underground parts belong at the soil line, wherever the
    // silhouette is widest — never partway up a stem that merely stands in for
    // them because the species has no modelled rhizome.
    const below = /root|rhizome|tuber|bulb|corm|stem base|stolon|runner/.test(part.toLowerCase())
    // Foliage and stems are continuous, so sharing parts are staggered up them.
    // Fruit, flowers and rhizomes come as discrete lumps: pushing a second
    // label up the crown only buries it, so those stay on whichever lump is
    // most exposed and are separated by bearing alone.
    const continuous = key === 'foliage' || key === 'stem'
    const level = below ? 0.02 : continuous && share > 1 ? 0.28 + (0.5 * seat) / (share - 1) : 0.5
    const levelWeight = below ? 1.5 : continuous ? 1.5 : 0.35

    // Bark, wood and the extracts drawn from them are read off the trunk, so
    // keep them on the lower stem rather than letting the silhouette score
    // carry them up among the fruit and leaves.
    const trunk =
      key === 'stem' &&
      !below &&
      /bark|wood|resin|gum|satva|starch|oil|^stem/.test(part.toLowerCase()) &&
      !/twig|branch|shoot/.test(part.toLowerCase())

    const geo = key ? set[key] : null
    const band: [number, number] | undefined =
      below && key !== 'rhizome' ? [0, 0.08] : trunk ? [0.02, 0.45] : undefined
    let found = geo ? pickOn(geo, bearing, level, taken, minGap, levelWeight, band) : null
    if (found && below) {
      // A thin base gives underground labels nowhere to spread, so when two
      // still land on top of each other, fan them around the soil instead.
      const crowded = taken.some(
        (t) => Math.hypot(t[0] - found![0], t[1] - found![1], t[2] - found![2]) < minGap * 0.6,
      )
      if (crowded) found = null
    }
    if (found) {
      // Nudge just clear of the surface so the dot reads as a pin, not a speck.
      const r = Math.hypot(found[0], found[2])
      // Scaled by the smaller extent so flat creepers don't fling labels wide.
      const push = Math.max(Math.min(spread, top) * 0.06, 0.008)
      const scale = r > 1e-4 ? (r + push) / r : 1
      // Never below the soil disc — a buried dot reads as a stray label.
      const anchor: Anchor = [found[0] * scale, Math.max(found[1], top * 0.015), found[2] * scale]
      taken.push(anchor)
      return anchor
    }

    // No geometry for this organ at all: sit the label at the plant's edge.
    const reach = spread * (below ? 0.5 : 0.75)
    const anchor: Anchor = [
      Math.cos(bearing) * reach,
      below ? top * 0.03 : top * level,
      Math.sin(bearing) * reach,
    ]
    taken.push(anchor)
    return anchor
  })
}
