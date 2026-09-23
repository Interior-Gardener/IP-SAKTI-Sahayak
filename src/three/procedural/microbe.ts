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

/**
 * A wandering path for a chain of cells to follow. Straight chains look
 * drawn rather than grown, so the walk turns a little at every step and
 * never doubles back on itself.
 */
function chainPath(rng: Rng, steps: number, step: number): THREE.Vector3[] {
  const points = [new THREE.Vector3(0, 0, 0)]
  let dir = new THREE.Vector3(1, 0, 0)
  for (let i = 1; i < steps; i++) {
    dir = dir
      .clone()
      .add(new THREE.Vector3(rng.jitter(0.5), rng.jitter(0.35), rng.jitter(0.5)))
      .normalize()
    points.push(points[i - 1].clone().addScaledVector(dir, step))
  }
  return points
}

/** Centres a set of points on the origin so the colony hangs where it is put. */
function centre(points: THREE.Vector3[]): THREE.Vector3[] {
  const box = new THREE.Box3().setFromPoints(points)
  const mid = box.getCenter(new THREE.Vector3())
  return points.map((p) => p.clone().sub(mid))
}

/** A thread: flagellum, or a filament too thin to deserve a tube of its own. */
function thread(points: THREE.Vector3[], radius: number, q: Q): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, Math.max(8, q.tube / 2), radius, Math.max(3, q.radial / 3), false)
}

/* ---------------------------- the five forms ---------------------------- */

/** Spheres in a chain, each meeting the next — streptococci, and the lactic
 *  acid bacteria that sour a takra. The accent is the flattened division
 *  plane where two daughter cells still touch. */
function coccus(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const r = spec.size / 2
  const cells = Math.max(3, Math.round(spec.count * q.cells))
  const path = centre(chainPath(rng, cells, r * 1.7))
  path.forEach((p, i) => {
    const wobble = 1 + rng.jitter(0.08)
    place(
      new THREE.SphereGeometry(r * wobble, q.radial, q.rings),
      body,
      p,
      undefined,
      new THREE.Vector3(1, 1 + rng.jitter(0.06), 1),
    )
    if (i > 0) {
      const mid = p.clone().add(path[i - 1]).multiplyScalar(0.5)
      const dir = p.clone().sub(path[i - 1])
      place(new THREE.CylinderGeometry(r * 0.72, r * 0.72, r * 0.12, q.radial), accent, mid, aim(dir))
    }
  })
}

/** Rods, end to end and side by side — a bacillus culture. The accent is a
 *  polar flagellum on a few of them, which is what makes the pile read as
 *  living rather than as spilled rice. */
function bacillus(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const len = spec.size
  const r = len * 0.22
  const cells = Math.max(3, Math.round(spec.count * q.cells))
  for (let i = 0; i < cells; i++) {
    const at = new THREE.Vector3(rng.jitter(len * 1.6), rng.jitter(len * 0.5), rng.jitter(len * 1.6))
    const dir = new THREE.Vector3(rng.jitter(1), rng.jitter(0.25), rng.jitter(1)).normalize()
    const rot = aim(dir)
    place(new THREE.CapsuleGeometry(r, len - r * 2, Math.max(2, q.rings / 3), q.radial), body, at, rot)
    if (rng.next() > 0.55) {
      // The flagellum leaves the pole, so it is built in the rod's own frame
      // and carried into place with it rather than aimed separately.
      const tail: THREE.Vector3[] = []
      for (let t = 0; t <= 5; t++) {
        const y = len / 2 + (t / 5) * len * 0.9
        tail.push(new THREE.Vector3(Math.sin(t * 1.2 + i) * r * 0.9, y, Math.cos(t * 0.9 + i) * r * 0.9))
      }
      place(thread(tail, r * 0.12, q), accent, at, rot)
    }
  }
}

/** Budding ovals — the yeasts that carry an asava or arishta through its
 *  fermentation. Each mother wears a daughter at one shoulder; the accent
 *  is the ring of bud scars a used-up cell collects. */
function yeast(spec: MicrobeModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const r = spec.size / 2
  const cells = Math.max(3, Math.round(spec.count * q.cells))
  for (let i = 0; i < cells; i++) {
    const at = new THREE.Vector3(rng.jitter(r * 4), rng.jitter(r * 2.2), rng.jitter(r * 4))
    const oval = new THREE.Vector3(1, 1.25 + rng.jitter(0.15), 1)
    place(new THREE.SphereGeometry(r, q.radial, q.rings), body, at, undefined, oval)
    const budDir = new THREE.Vector3(rng.jitter(1), rng.range(0.2, 1), rng.jitter(1)).normalize()
    const budR = r * rng.range(0.45, 0.7)
    const budAt = at.clone().addScaledVector(budDir, r * 1.05)
    place(new THREE.SphereGeometry(budR, q.radial, q.rings), body, budAt)
    // The scar sits on the mother's wall, facing the bud it let go of.
    place(
      new THREE.TorusGeometry(budR * 0.8, budR * 0.16, 4, Math.max(8, q.radial)),
      accent,
      at.clone().addScaledVector(budDir, r * 0.95),
      aim(budDir).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))),
    )
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
  const strands = Math.max(2, Math.round(spec.count * q.cells * 0.5))
  for (let i = 0; i < strands; i++) {
    const angle = (i / strands) * Math.PI * 2 + rng.jitter(0.4)
    grow(
      new THREE.Vector3(Math.cos(angle) * unit * 0.2, 0, Math.sin(angle) * unit * 0.2),
      new THREE.Vector3(Math.cos(angle), rng.range(0.1, 0.5), Math.sin(angle)).normalize(),
      unit * 0.07,
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

const FORMS = { coccus, bacillus, yeast, hypha, spirillum } as const

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
  const merged = body.length ? mergeGeometries(body, false) : new THREE.SphereGeometry(spec.size / 2, q.radial, q.rings)
  const mergedAccent = accent.length ? mergeGeometries(accent, false) : null
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
