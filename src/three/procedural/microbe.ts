import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MicrobeModelSpec } from '../../types/source'
import type { Detail } from './plant'
import { hashSeed, makeRng, type Rng } from './rng'

/* ------------------------------------------------------------------ *
 * Procedural micro-organisms.
 *
 * Same bargain as the plants: nothing is downloaded, a colony is grown
 * from its spec, and the same id always grows the same colony. A culture
 * is drawn at the scale of a microscope field — the Rasashala shows it
 * on a slide or in a vial, so the generator works in a unit box and the
 * scene scales it.
 *
 * Two geometries come back, because two materials is what reads: `body`
 * is the cell wall, `accent` is whatever the eye uses to tell the form
 * apart — the division plane of a coccus chain, the flagellum of a
 * spirillum, the bud scars of a yeast, the septa and spore heads of a
 * mould. Without the accent every form is a pale blob.
 * ------------------------------------------------------------------ */

export interface MicrobeGeometrySet {
  body: THREE.BufferGeometry
  /** Null when the form has no second material (a bare coccus chain). */
  accent: THREE.BufferGeometry | null
  /** Always null: a colony holds nothing. Kept so every material set has the same parts. */
  liquid: null
  /** Extents of the built colony, for framing and for standing it on a slide. */
  bounds: THREE.Box3
  height: number
  radius: number
}

/** Segment counts per detail level. A colony is small on screen; low is plenty. */
const QUALITY = {
  high: { radial: 14, rings: 10, tube: 40, cells: 1 },
  medium: { radial: 10, rings: 7, tube: 26, cells: 0.75 },
  low: { radial: 7, rings: 5, tube: 16, cells: 0.5 },
} as const

type Q = (typeof QUALITY)[Detail]

const cache = new Map<string, MicrobeGeometrySet>()

/** Places a part: scale, rotate, translate, then hand it to the merge list. */
function place(
  geo: THREE.BufferGeometry,
  into: THREE.BufferGeometry[],
  position: THREE.Vector3,
  quaternion?: THREE.Quaternion,
  scale?: THREE.Vector3,
) {
  const m = new THREE.Matrix4().compose(
    position,
    quaternion ?? new THREE.Quaternion(),
    scale ?? new THREE.Vector3(1, 1, 1),
  )
  geo.applyMatrix4(m)
  into.push(geo)
}

/** Rotation taking +Y onto `dir` — every primitive here is built along Y. */
function aim(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

/** A thread: flagellum, or a filament too thin to deserve a tube of its own. */
function thread(points: THREE.Vector3[], radius: number, q: Q): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points)
  // TubeGeometry does not round its segment counts, and a fractional one
  // produces indices past the last vertex; so they are rounded here.
  return new THREE.TubeGeometry(curve, Math.max(8, Math.round(q.tube / 2)), radius, Math.max(3, Math.round(q.radial / 3)), false)
}

/* ---------------------------- the five forms ---------------------------- */

/** A small, slightly irregular blob inside a cell: the nucleoid of a bacterium,
 *  the vacuole of a yeast. It is what a translucent cell wall is there to show. */
function inclusion(r: number, rng: Rng, q: Q): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, Math.max(1, Math.round(q.rings / 5)))
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.multiplyScalar(1 + rng.jitter(0.12))
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Cocci in pairs and short chains — Lactococcus, which is how it grows: two
 *  daughters that have not quite let go, sometimes three or four in a row.
 *  Each cell is a little flattened where it meets the next, with the division
 *  plane between them and a nucleoid showing through the wall. */
function coccus(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const r = spec.size / 2
  let left = Math.max(4, Math.round(spec.count * 1.6 * q.cells))
  // Close together, as a smear on a slide: spread wide, the cells shrank to specks.
  const spread = r * 4.2
  while (left > 0) {
    // Mostly pairs; now and then a short chain.
    const n = Math.min(left, rng.next() > 0.65 ? 3 + Math.floor(rng.next() * 3) : 2)
    left -= n
    const start = new THREE.Vector3(rng.jitter(spread), rng.range(0, r * 1.2), rng.jitter(spread))
    let dir = new THREE.Vector3(rng.jitter(1), rng.jitter(0.25), rng.jitter(1)).normalize()
    let at = start
    for (let i = 0; i < n; i++) {
      const rot = aim(dir)
      place(new THREE.SphereGeometry(r * rng.range(0.94, 1.04), q.radial, q.rings), body, at.clone(), rot, new THREE.Vector3(1, 0.9, 1))
      place(inclusion(r * 0.42, rng, q), accent, at.clone())
      if (i < n - 1) {
        const next = at.clone().addScaledVector(dir, r * 1.72)
        place(
          new THREE.CylinderGeometry(r * 0.66, r * 0.66, r * 0.08, q.radial),
          accent,
          at.clone().add(next).multiplyScalar(0.5),
          rot,
        )
        at = next
        dir = dir.clone().add(new THREE.Vector3(rng.jitter(0.25), rng.jitter(0.1), rng.jitter(0.25))).normalize()
      }
    }
  }
}

/** Rods. What the rods do depends on the organism, so the spec says:
 *  lactobacilli are non-motile and lie end to end in short chains; a Bacillus
 *  swims on flagella all over its body (peritrichous) and, when conditions
 *  turn, walls an oval endospore inside itself — the resting form a spore
 *  product is sold as. Spores and nucleoids are the accent, seen through the
 *  translucent wall. */
function bacillus(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const len = spec.size
  const r = len * 0.2
  const cells = Math.max(3, Math.round(spec.count * q.cells))
  const spread = len * 1.15
  const chains = spec.flagella === 'peritrichous' || spec.flagella === 'polar'
  for (let c = 0; c < cells; ) {
    // Non-motile lactobacilli stay joined in short chains; motile cells swim apart.
    const n = chains ? (rng.next() > 0.75 ? 2 : 1) : 1 + Math.floor(rng.next() * 3)
    let at = new THREE.Vector3(rng.jitter(spread), rng.range(0, len * 0.35), rng.jitter(spread))
    let dir = new THREE.Vector3(rng.jitter(1), rng.jitter(0.15), rng.jitter(1)).normalize()
    for (let i = 0; i < n && c < cells; i++, c++) {
      const rot = aim(dir)
      const cellLen = len * rng.range(0.9, 1.12)
      place(new THREE.CapsuleGeometry(r, cellLen - r * 2, Math.max(2, Math.round(q.rings / 2)), q.radial), body, at.clone(), rot)
      const sporing = spec.spores && rng.next() > 0.55
      if (sporing) {
        // The endospore: oval, bright, a little off centre along the rod.
        place(
          new THREE.SphereGeometry(r * 0.62, q.radial, q.rings),
          accent,
          at.clone().addScaledVector(dir, cellLen * 0.18),
          rot,
          new THREE.Vector3(1, 1.6, 1),
        )
      } else {
        place(inclusion(r * 0.45, rng, q), accent, at.clone(), rot, new THREE.Vector3(1, 2.2, 1))
      }
      if (spec.flagella === 'peritrichous' && !sporing) {
        // Flagella leave from all over the body, each a long gentle wave.
        const count = Math.max(3, Math.round(7 * q.cells))
        for (let f = 0; f < count; f++) {
          const around = rng.next() * Math.PI * 2
          const along = rng.range(-0.4, 0.4) * cellLen
          const out = new THREE.Vector3(Math.cos(around), 0, Math.sin(around))
          const base = new THREE.Vector3(out.x * r, along, out.z * r)
          const trail = new THREE.Vector3(0, along >= 0 ? 1 : -1, 0).lerp(out, 0.35).normalize()
          const wave: THREE.Vector3[] = []
          for (let t = 0; t <= 7; t++) {
            // About one cell length: longer, and the flagella swamp the cells.
            const s = (t / 7) * cellLen * 0.95
            const side = Math.sin(t * 1.4 + f) * r * 0.5
            wave.push(base.clone().addScaledVector(trail, s).addScaledVector(out, side))
          }
          place(thread(wave, r * 0.045, q), accent, at.clone(), rot)
        }
      }
      if (i < n - 1) {
        // The cross-wall where two rods of a chain meet.
        const next = at.clone().addScaledVector(dir, cellLen * 0.98)
        place(new THREE.CylinderGeometry(r * 0.95, r * 0.95, r * 0.1, q.radial), accent, at.clone().addScaledVector(dir, cellLen * 0.49), rot)
        at = next
        dir = dir.clone().add(new THREE.Vector3(rng.jitter(0.3), rng.jitter(0.08), rng.jitter(0.3))).normalize()
      }
    }
  }
  if (spec.spores) {
    // A few spores already free of their mother cells.
    for (let s = 0; s < Math.round(4 * q.cells); s++) {
      place(
        new THREE.SphereGeometry(r * 0.62, q.radial, q.rings),
        accent,
        new THREE.Vector3(rng.jitter(spread), r * 0.6, rng.jitter(spread)),
        aim(new THREE.Vector3(rng.jitter(1), rng.jitter(0.2), rng.jitter(1)).normalize()),
        new THREE.Vector3(1, 1.6, 1),
      )
    }
  }
}

/** Budding yeast: ovals, each mother wearing a daughter at one shoulder and a
 *  ring of bud scars where earlier daughters left. Inside, the vacuole — the
 *  large pale body the eye finds first under a microscope. */
function yeast(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const r = spec.size / 2
  const cells = Math.max(3, Math.round(spec.count * q.cells))
  for (let i = 0; i < cells; i++) {
    const at = new THREE.Vector3(rng.jitter(r * 4.4), rng.range(0, r * 1.6), rng.jitter(r * 4.4))
    const tilt = aim(new THREE.Vector3(rng.jitter(0.8), 1, rng.jitter(0.8)).normalize())
    const oval = new THREE.Vector3(1, 1.25 + rng.jitter(0.12), 1)
    place(new THREE.SphereGeometry(r, q.radial, q.rings), body, at.clone(), tilt, oval)
    // The vacuole, off to one side of the cell.
    place(
      inclusion(r * 0.5, rng, q),
      accent,
      at.clone().add(new THREE.Vector3(rng.jitter(r * 0.25), rng.jitter(r * 0.25), rng.jitter(r * 0.25))),
    )
    if (rng.next() > 0.25) {
      const budDir = new THREE.Vector3(0, 1, 0).applyQuaternion(tilt).add(new THREE.Vector3(rng.jitter(0.6), 0, rng.jitter(0.6))).normalize()
      const budR = r * rng.range(0.4, 0.68)
      place(new THREE.SphereGeometry(budR, q.radial, q.rings), body, at.clone().addScaledVector(budDir, r * 1.1 + budR * 0.55))
    }
    // Bud scars: small rings on the wall where daughters have already gone.
    for (let s = 0; s < 1 + Math.floor(rng.next() * 3); s++) {
      const scarDir = new THREE.Vector3(rng.jitter(1), rng.jitter(1), rng.jitter(1)).normalize()
      place(
        new THREE.TorusGeometry(r * 0.22, r * 0.05, 4, Math.max(8, q.radial)),
        accent,
        at.clone().addScaledVector(scarDir, r * 1.08),
        aim(scarDir).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))),
      )
    }
  }
}

/** A trichome: a helical filament of short disc-shaped cells, Arthrospira —
 *  "spirulina". It does not swim on flagella; the whole coil is the organism.
 *  Built as one continuous tube along a helix, with a cross-wall ring at every
 *  cell boundary, lying across the dish in a few loose coils. */
function trichome(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const filaments = Math.max(2, Math.round(spec.count * 0.5 * q.cells))
  const fr = spec.size * 0.11
  for (let f = 0; f < filaments; f++) {
    const coil = spec.size * rng.range(0.28, 0.36)
    const pitch = spec.size * rng.range(0.7, 0.95)
    const turns = rng.range(3, 4.5)
    const samples = Math.max(24, Math.round(turns * 18))
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= samples; i++) {
      const u = i / samples
      const a = u * turns * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * coil, u * turns * pitch - (turns * pitch) / 2, Math.sin(a) * coil))
    }
    // Lying across the dish: the helix axis tipped over, in a random direction.
    const lie = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0, rng.next() * Math.PI, 0))
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + rng.jitter(0.3))))
    const at = new THREE.Vector3(rng.jitter(spec.size * 1.2), coil + fr, rng.jitter(spec.size * 1.2))
    const curve = new THREE.CatmullRomCurve3(points)
    place(new THREE.TubeGeometry(curve, samples * 2, fr, Math.max(6, q.radial), false), body, at.clone(), lie)
    for (const end of [0, 1]) {
      place(new THREE.SphereGeometry(fr, Math.max(6, q.radial), Math.max(4, q.rings)), body, at.clone().add(curve.getPointAt(end).applyQuaternion(lie)))
    }
    // A cross-wall every short cell length along the filament.
    const length = curve.getLength()
    const walls = Math.min(90, Math.round((length / (fr * 1.2)) * q.cells))
    for (let w = 1; w < walls; w++) {
      const u = w / walls
      const p = curve.getPointAt(u).applyQuaternion(lie).add(at)
      const tangent = curve.getTangentAt(u).applyQuaternion(lie)
      place(
        new THREE.TorusGeometry(fr * 0.98, fr * 0.1, 4, Math.max(8, q.radial)),
        accent,
        p,
        aim(tangent).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))),
      )
    }
  }
}

/** Branching filaments — a mould. Grown like a tiny tree, because that is
 *  what a mycelium is: a tip that keeps going and throws side branches.
 *  The accent is the septa across the filaments and the spore heads. */
function hypha(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const unit = spec.size
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, radius: number, depth: number) => {
    const points = [from.clone()]
    let at = from.clone()
    let d = dir.clone()
    const segments = 4
    for (let i = 0; i < segments; i++) {
      d = d.clone().add(new THREE.Vector3(rng.jitter(0.4), rng.jitter(0.3), rng.jitter(0.4))).normalize()
      at = at.clone().addScaledVector(d, unit * 0.42)
      points.push(at.clone())
      // A septum every so often: the cross-wall that tells a septate mould
      // from a coenocytic one, and the only detail visible at this size.
      if (i % 2 === 1) {
        place(new THREE.CylinderGeometry(radius * 1.25, radius * 1.25, radius * 0.3, q.radial), accent, at.clone(), aim(d))
      }
    }
    body.push(thread(points, radius, q))
    if (depth === 0) {
      // Spore head: a knot of small spheres at the tip of a spent filament.
      for (let s = 0; s < 5; s++) {
        place(
          new THREE.SphereGeometry(radius * 1.5, Math.max(5, q.radial / 2), Math.max(4, q.rings / 2)),
          accent,
          at.clone().add(new THREE.Vector3(rng.jitter(radius * 2), rng.jitter(radius * 2), rng.jitter(radius * 2))),
        )
      }
      return
    }
    const branches = depth > 1 ? 2 : 1
    for (let b = 0; b < branches; b++) {
      const side = d
        .clone()
        .add(new THREE.Vector3(rng.jitter(1.1), rng.range(-0.2, 0.9), rng.jitter(1.1)))
        .normalize()
      grow(at, side, radius * 0.82, depth - 1)
    }
  }
  // Enough filaments to read as a mat of mycelium, not a few stray threads.
  const strands = Math.max(3, Math.round(spec.count * q.cells * 0.9))
  for (let i = 0; i < strands; i++) {
    const angle = (i / strands) * Math.PI * 2 + rng.jitter(0.4)
    grow(
      new THREE.Vector3(Math.cos(angle) * unit * 0.2, 0, Math.sin(angle) * unit * 0.2),
      new THREE.Vector3(Math.cos(angle), rng.range(0.1, 0.5), Math.sin(angle)).normalize(),
      unit * 0.09,
      2,
    )
  }
}

/** Corkscrews. Built as a helix swept into a tube, with a flagellum off each
 *  end — a spirillum is the one form that is unmistakable from its outline. */
function spirillum(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const len = spec.size * 1.6
  const cells = Math.max(2, Math.round(spec.count * q.cells * 0.4))
  for (let i = 0; i < cells; i++) {
    const turns = rng.range(2.2, 3.4)
    const coil = spec.size * 0.3
    const points: THREE.Vector3[] = []
    for (let t = 0; t <= 24; t++) {
      const u = t / 24
      points.push(new THREE.Vector3(Math.cos(u * turns * Math.PI * 2) * coil, u * len - len / 2, Math.sin(u * turns * Math.PI * 2) * coil))
    }
    const at = new THREE.Vector3(rng.jitter(len * 0.7), rng.jitter(len * 0.25), rng.jitter(len * 0.7))
    const rot = aim(new THREE.Vector3(rng.jitter(0.6), 1, rng.jitter(0.6)).normalize())
    place(thread(points, spec.size * 0.13, q), body, at, rot)
    for (const end of [points[0], points[points.length - 1]]) {
      const tail = [0, 1, 2, 3].map((t) => end.clone().addScaledVector(new THREE.Vector3(0, Math.sign(end.y), 0), (t * len) / 9))
      place(thread(tail, spec.size * 0.05, q), accent, at, rot)
    }
  }
}

const FORMS = { coccus, bacillus, yeast, hypha, spirillum, trichome } as const

/**
 * Builds (and caches) one colony. The id seeds it, so the same micro-organism
 * is the same colony on every visit and in every scene that draws it.
 */
export function buildMicrobeGeometry(
  id: string,
  spec: MicrobeModelSpec,
  detail: Detail = 'high',
): MicrobeGeometrySet {
  const key = `${id}:${detail}`
  const hit = cache.get(key)
  if (hit) return hit

  const q = QUALITY[detail]
  const rng = makeRng(hashSeed(id))
  const body: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  FORMS[spec.form](spec, rng, q, body, accent)

  // A form that built nothing would crash the merge; every form above puts
  // something in `body`, and this is the guard that keeps that true.
  // An icosahedron beside a sphere is non-indexed beside indexed, which
  // mergeGeometries refuses; flatten a mixed list first.
  const unify = (list: THREE.BufferGeometry[]) =>
    list.some((g) => !g.index) ? list.map((g) => (g.index ? g.toNonIndexed() : g)) : list
  const merged = body.length ? mergeGeometries(unify(body), false) : new THREE.SphereGeometry(spec.size / 2, q.radial, q.rings)
  const mergedAccent = accent.length ? mergeGeometries(unify(accent), false) : null
  for (const g of [...body, ...accent]) g.dispose()

  merged.computeVertexNormals()
  merged.computeBoundingBox()
  mergedAccent?.computeVertexNormals()
  const bounds = (merged.boundingBox ?? new THREE.Box3()).clone()
  if (mergedAccent) {
    mergedAccent.computeBoundingBox()
    if (mergedAccent.boundingBox) bounds.union(mergedAccent.boundingBox)
  }
  const size = bounds.getSize(new THREE.Vector3())
  const set: MicrobeGeometrySet = {
    body: merged,
    accent: mergedAccent,
    liquid: null,
    bounds,
    height: size.y,
    radius: Math.max(size.x, size.z) / 2,
  }
  cache.set(key, set)
  return set
}

/** Frees every cached colony — used when the 3D layer unmounts. */
export function disposeMicrobeCache() {
  for (const set of cache.values()) {
    set.body.dispose()
    set.accent?.dispose()
  }
  cache.clear()
}
