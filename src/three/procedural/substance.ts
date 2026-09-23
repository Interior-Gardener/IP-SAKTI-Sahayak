import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'
import type { SubstanceModelSpec } from '../../types/source'
import type { Detail } from './plant'
import { hashSeed, makeRng, type Rng } from './rng'

/* ------------------------------------------------------------------ *
 * Procedural substances — what the Rasashala's shelves hold.
 *
 * Honey in the comb, ghee in a turned pot, shilajit as a lump of exudate,
 * a conch, a pearl, a branch of coral, a cast ingot of a metal, and a
 * heap of bhasma. All generated, all deterministic from the material's
 * id, and all built standing on y = 0 so a shelf can simply place them.
 *
 * `body` and `accent` again: the accent is the wax cap on a comb cell,
 * the tied cloth over a pot's mouth, the cushion a pearl is shown on. It
 * is what stops eight grey solids looking like eight grey solids.
 *
 * A third part, `liquid`, is what a form holds when you can see it: honey
 * standing in the open cells, mercury pooled in the bottom of a glass kupi.
 * It gets a wet, glossy material of its own, which a body or an accent
 * cannot have without the whole object turning to glass.
 * ------------------------------------------------------------------ */

export interface SubstanceGeometrySet {
  body: THREE.BufferGeometry
  accent: THREE.BufferGeometry | null
  /** What the form holds, where it shows: honey in the comb, mercury in the kupi. */
  liquid: THREE.BufferGeometry | null
  bounds: THREE.Box3
  height: number
  radius: number
}

const QUALITY = {
  high: { radial: 24, rings: 16, tube: 64, detail: 3, cells: 1 },
  medium: { radial: 16, rings: 11, tube: 40, detail: 2, cells: 0.7 },
  low: { radial: 10, rings: 7, tube: 24, detail: 1, cells: 0.45 },
} as const

type Q = (typeof QUALITY)[Detail]

const cache = new Map<string, SubstanceGeometrySet>()

function place(
  geo: THREE.BufferGeometry,
  into: THREE.BufferGeometry[],
  position: THREE.Vector3,
  quaternion?: THREE.Quaternion,
  scale?: THREE.Vector3,
) {
  geo.applyMatrix4(
    new THREE.Matrix4().compose(position, quaternion ?? new THREE.Quaternion(), scale ?? new THREE.Vector3(1, 1, 1)),
  )
  into.push(geo)
}

/** A torus whose axis is +Y, like every other part here. THREE's torus lies
 *  in the XY plane facing +Z, so aimed as-is a cord round a jar's neck stood
 *  up on end; turned once here, `aim` points its axis where it should go. */
function hoop(radius: number, tube: number, radial: number, tubular: number): THREE.BufferGeometry {
  return new THREE.TorusGeometry(radius, tube, radial, tubular).rotateX(Math.PI / 2)
}

function aim(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

/**
 * Smooth pseudo-noise on the unit sphere.
 *
 * Displacing each vertex by its own random number gives a sea urchin, not a
 * rock: neighbours must move together. Summing a handful of cosine lobes in
 * random directions is the cheapest thing that does, and it is continuous
 * everywhere, so the lump closes on itself with no seam.
 */
function lobes(rng: Rng, count: number) {
  const dirs: THREE.Vector3[] = []
  const freqs: number[] = []
  const amps: number[] = []
  for (let i = 0; i < count; i++) {
    dirs.push(new THREE.Vector3(rng.jitter(1), rng.jitter(1), rng.jitter(1)).normalize())
    freqs.push(rng.range(1.2, 4.5))
    amps.push(rng.range(0.05, 0.16) / (i * 0.5 + 1))
  }
  return (n: THREE.Vector3) => {
    let sum = 0
    for (let i = 0; i < count; i++) sum += Math.cos(n.dot(dirs[i]) * freqs[i] * Math.PI) * amps[i]
    return sum
  }
}

/* ---------------------------- the forms ---------------------------- */

/** Comb: hexagonal cells on a hex lattice, most of them open, a few capped
 *  with wax. Madhu is kept and graded in the comb, so the comb is the honest
 *  way to show it.
 *
 *  The cells are open tubes standing on a thin backing sheet, not solid
 *  cylinders. Solid ones pack into a block with a flat top, and a block of
 *  yellow is exactly what the first version of this looked like. */
function honeycomb(
  spec: SubstanceModelSpec,
  rng: Rng,
  q: Q,
  body: THREE.BufferGeometry[],
  accent: THREE.BufferGeometry[],
  liquid: THREE.BufferGeometry[],
) {
  const cell = spec.size * 0.13
  const depth = spec.size * 0.34
  const rows = Math.max(2, Math.round(4 * q.cells) + 1)
  const reach = cell * rows * 1.75
  // Where this comb's parts start in each list, so they can be stood up
  // together once built — a comb lying flat reads as a block of cheese.
  const from = { body: body.length, accent: accent.length, liquid: liquid.length }
  // The sheet the cells are built on, so the comb has a back and not a void.
  place(
    new THREE.CylinderGeometry(reach * 0.92, reach * 0.88, depth * 0.16, Math.max(8, q.radial)),
    body,
    new THREE.Vector3(0, depth * 0.08, 0),
  )
  const spin = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 6, 0))
  for (let row = -rows; row <= rows; row++) {
    for (let col = -rows; col <= rows; col++) {
      const x = (col + (row % 2 ? 0.5 : 0)) * cell * 1.74
      const z = row * cell * 1.5
      // Round off the block into a torn piece of comb rather than a slab.
      const edge = Math.hypot(x, z) / reach
      if (edge > 1) continue
      const d = depth * (1 - edge * 0.35) * rng.range(0.88, 1)
      // An open hexagonal tube: the wall of one cell.
      place(
        new THREE.CylinderGeometry(cell, cell, d, 6, 1, true),
        body,
        new THREE.Vector3(x, depth * 0.16 + d / 2, z),
        spin,
      )
      // Capped cells are the full ones. About a third, in patches rather than
      // scattered, which is how a comb actually fills.
      if (rng.next() > 0.62) {
        // A cap bulges a little: it is wax drawn over a full cell, not a lid.
        place(
          new THREE.SphereGeometry(cell * 0.95, 6, 2, 0, Math.PI * 2, 0, Math.PI / 2),
          accent,
          new THREE.Vector3(x, depth * 0.16 + d, z),
          spin,
          new THREE.Vector3(1, 0.28, 1),
        )
      } else if (rng.next() > 0.25) {
        // An open cell holds honey to somewhere below the rim, and not every
        // cell to the same level, which is what makes the comb read as full
        // of something rather than as a grid.
        const fill = d * rng.range(0.45, 0.85)
        place(
          new THREE.CylinderGeometry(cell * 0.93, cell * 0.93, fill, 6),
          liquid,
          new THREE.Vector3(x, depth * 0.16 + fill / 2, z),
          spin,
        )
      }
    }
  }
  // Stand the comb up, leaning back a little, its cells facing the room.
  const lean = new THREE.Matrix4()
    .makeTranslation(0, reach * 0.93 + depth * 0.2, 0)
    // +Y (the way the cells open) turned to +Z: towards whoever faces the comb.
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.3))
  body.slice(from.body).forEach((g) => g.applyMatrix4(lean))
  accent.slice(from.accent).forEach((g) => g.applyMatrix4(lean))
  liquid.slice(from.liquid).forEach((g) => g.applyMatrix4(lean))
  // Honey run off the torn edge and pooled on the bench under it.
  for (let i = 0; i < Math.max(2, Math.round(4 * q.cells)); i++) {
    const a = rng.next() * Math.PI * 2
    const at = reach * rng.range(0.25, 0.6)
    place(
      new THREE.SphereGeometry(cell * rng.range(0.9, 1.5), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      liquid,
      // In front of the comb's foot, where it dripped.
      new THREE.Vector3(Math.cos(a) * at, 0, Math.abs(Math.sin(a)) * at + depth * 0.3),
      undefined,
      new THREE.Vector3(1.6, 0.32, 1.2),
    )
  }
}

/** A turned vessel. The variant decides the silhouette, because what is kept
 *  in it decides the shape: ghee goes in a wide-mouthed jar you can reach
 *  into, milk in a tall narrow pot, mercury in a round-bottomed flask with a
 *  long neck that is sealed shut — the kupi of rasa shastra — and an asava
 *  ferments in a big-bellied vat under a tied cloth. */
function vessel(
  spec: SubstanceModelSpec,
  rng: Rng,
  q: Q,
  body: THREE.BufferGeometry[],
  accent: THREE.BufferGeometry[],
  liquid: THREE.BufferGeometry[],
) {
  const h = spec.size
  const v = spec.variant
  const wobble = rng.range(0.96, 1.04)

  if (v === 'flask') {
    // Round body, long neck, sealed. Nothing is tied over this one.
    const r = h * 0.3 * wobble
    const profile: THREE.Vector2[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      // A circle from the base up to the shoulder, then a straight neck.
      profile.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.86) * r + h * 0.02, t * r * 1.9))
    }
    profile.push(new THREE.Vector2(h * 0.075, h * 0.7), new THREE.Vector2(h * 0.08, h * 0.96))
    body.push(new THREE.LatheGeometry(profile, Math.max(32, q.radial * 2)))
    // The kupi is glass, and what it holds is the point of it: a bead of
    // mercury pooled in the round bottom, drawn as a flattened drop.
    place(
      new THREE.SphereGeometry(r * 0.62, q.radial, Math.max(6, q.rings)),
      liquid,
      new THREE.Vector3(0, r * 0.2, 0),
      undefined,
      new THREE.Vector3(1, 0.3, 1),
    )
    // The seal: a plug of clay and cloth, wound at the mouth.
    place(new THREE.CylinderGeometry(h * 0.095, h * 0.085, h * 0.09, q.radial), accent, new THREE.Vector3(0, h * 0.99, 0))
    place(hoop(h * 0.088, h * 0.016, 6, q.radial), accent, new THREE.Vector3(0, h * 0.88, 0), aim(new THREE.Vector3(0, 1, 0)))
    return
  }

  const shape =
    v === 'jar'
      ? { belly: 0.46, shoulder: 0.42, neck: 0.4, lip: 0.46, waist: 0.3 }
      : v === 'pot'
        ? { belly: 0.3, shoulder: 0.26, neck: 0.15, lip: 0.2, waist: 0.5 }
        : { belly: 0.44, shoulder: 0.4, neck: 0.25, lip: 0.3, waist: 0.36 }
  const profile = [
    new THREE.Vector2(h * shape.waist * 0.45, 0),
    new THREE.Vector2(h * shape.waist * 0.8, h * 0.05),
    new THREE.Vector2(h * shape.belly * wobble, h * 0.34),
    new THREE.Vector2(h * shape.shoulder * wobble, h * 0.6),
    new THREE.Vector2(h * shape.neck, h * 0.82),
    new THREE.Vector2(h * shape.neck * 0.96, h * 0.9),
    new THREE.Vector2(h * shape.lip, h * 0.96),
    new THREE.Vector2(h * shape.lip * 0.94, h),
  ]
  // Eight control points turned directly give a faceted pot; a spline through
  // them, turned on more sides, gives a thrown one.
  const turned = new THREE.SplineCurve(profile).getPoints(Math.max(24, q.rings * 3))
  body.push(new THREE.LatheGeometry(turned, Math.max(32, q.radial * 2)))
  // The cloth over the mouth, with the cord below it — how a jar of ghee and
  // a fermenting vat are both actually kept.
  const mouth = h * shape.lip
  // A shallow cap whose edge rests on the lip. The cap's rim sits cos(θ)·R
  // above its centre, so the centre goes that far below the lip — placed at
  // the lip itself, the cloth hovered over the jar with a gap under it.
  const clothR = mouth * 1.06
  const clothArc = Math.PI / 2.6
  const flatten = 0.45
  const cloth = new THREE.SphereGeometry(clothR, q.radial, Math.max(4, q.rings / 2), 0, Math.PI * 2, 0, clothArc)
  place(
    cloth,
    accent,
    new THREE.Vector3(0, h * 0.99 - Math.cos(clothArc) * clothR * flatten, 0),
    undefined,
    new THREE.Vector3(1, flatten, 1),
  )
  place(hoop(mouth * 0.98, h * 0.018, 6, q.radial), accent, new THREE.Vector3(0, h * 0.93, 0), aim(new THREE.Vector3(0, 1, 0)))
}

/** A lump of something: ore, resin, shell fragment, musk pod, crystal cluster.
 *  The variant decides how it sits. A shard is flat and angular; a pod is a
 *  smooth pouch with short hair; crystals are a cluster of bipyramids grown on
 *  a lump of matrix rock, which is how cinnabar and sulphur are found. */
function rock(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  if (spec.variant === 'pod') {
    // Kasturi: the musk pod. Smooth, a little flattened, with a small opening
    // on top and a short coat of hair laid over it.
    const r = spec.size * 0.5
    const pod = new THREE.SphereGeometry(r, Math.max(24, q.radial * 2), Math.max(16, q.rings * 2))
    const noise = lobes(rng, 3)
    const pos = pod.attributes.position
    const n = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      n.fromBufferAttribute(pos, i).normalize()
      const d = r * (1 + noise(n) * 0.25)
      pos.setXYZ(i, n.x * d, n.y * d * 0.78, n.z * d * 0.92)
    }
    pod.computeVertexNormals()
    place(pod, body, new THREE.Vector3(0, r * 0.78, 0))
    place(hoop(r * 0.12, r * 0.045, 6, q.radial), accent, new THREE.Vector3(0, r * 1.54, 0), aim(new THREE.Vector3(0, 1, 0)))
    const hairs = Math.round(110 * q.cells)
    for (let i = 0; i < hairs; i++) {
      // Only the upper two-thirds; the pod sits on the rest.
      const dir = new THREE.Vector3(rng.jitter(1), rng.range(-0.3, 1), rng.jitter(1)).normalize()
      const at = new THREE.Vector3(dir.x * r, r * 0.78 + dir.y * r * 0.78, dir.z * r * 0.92)
      // Laid back along the surface, as fur lies, not standing straight out.
      const lay = dir.clone().lerp(new THREE.Vector3(0, -1, 0), 0.55).normalize()
      const len = spec.size * rng.range(0.05, 0.09)
      place(new THREE.ConeGeometry(spec.size * 0.006, len, 3), accent, at.addScaledVector(lay, len * 0.4), aim(lay))
    }
    return
  }

  if (spec.variant === 'crystals') {
    // Matrix first (the accent: dull host rock), crystals on its top (the body).
    const matrixR = spec.size * 0.42
    const matrix = new THREE.IcosahedronGeometry(matrixR, Math.max(1, q.detail - 1))
    const noise = lobes(rng, 4)
    const mpos = matrix.attributes.position
    const n = new THREE.Vector3()
    for (let i = 0; i < mpos.count; i++) {
      n.fromBufferAttribute(mpos, i).normalize()
      const d = matrixR * (1 + noise(n) * 0.9)
      mpos.setXYZ(i, n.x * d * 1.15, n.y * d * 0.45, n.z * d)
    }
    matrix.computeVertexNormals()
    place(matrix, accent, new THREE.Vector3(0, matrixR * 0.45, 0))
    const count = Math.round(14 * q.cells) + 4
    for (let i = 0; i < count; i++) {
      const a = rng.next() * Math.PI * 2
      const out = rng.range(0, 0.8)
      const w = spec.size * rng.range(0.05, 0.11) * (1 - out * 0.4)
      const h = w * rng.range(1.8, 3)
      const up = new THREE.Vector3(Math.cos(a) * out, 1, Math.sin(a) * out).normalize()
      const at = new THREE.Vector3(Math.cos(a) * out * matrixR, matrixR * 0.72 + h * 0.3, Math.sin(a) * out * matrixR * 0.8)
      const twist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.next() * Math.PI)
      place(new THREE.OctahedronGeometry(1, 0), body, at, aim(up).multiply(twist), new THREE.Vector3(w, h, w * rng.range(0.7, 1)))
    }
    return
  }

  const shard = spec.variant === 'shard'
  const nugget = spec.variant === 'nugget'
  // A shard is faceted, so it is built at a lower subdivision and left angular.
  const detail = shard ? Math.max(0, q.detail - 2) : q.detail
  const geo = new THREE.IcosahedronGeometry(spec.size * 0.5, detail)
  const pos = geo.attributes.position
  const noise = lobes(rng, shard ? 3 : nugget ? 4 : 5)
  const squash = shard ? 0.38 : nugget ? 0.92 : 0.8
  const spread = shard ? 1.3 : 1
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i)
    const r = n.length()
    n.normalize()
    const d = r * (1 + noise(n) * (nugget ? 0.5 : 1))
    pos.setXYZ(i, n.x * d * spread, n.y * d * squash, n.z * d * spread)
  }
  geo.computeVertexNormals()
  place(geo, body, new THREE.Vector3(0, spec.size * 0.5 * squash, 0))
  const lift = spec.size * 0.5 * squash
  for (let i = 0; i < Math.round(6 * q.cells); i++) {
    const dir = new THREE.Vector3(rng.jitter(1), rng.range(0, 1), rng.jitter(1)).normalize()
    place(
      new THREE.IcosahedronGeometry(spec.size * rng.range(0.03, 0.06), 0),
      accent,
      new THREE.Vector3(dir.x * spec.size * 0.45 * spread, lift + dir.y * lift * 0.8, dir.z * spec.size * 0.45 * spread),
    )
  }
}

/** Shankha: the sacred conch, Turbinella pyrum — a heavy spindle, not a
 *  coil. A low stepped spire at one end, a broad knobbed shoulder, and a body
 *  that tapers into a long siphonal canal at the other, wrapped in fine spiral
 *  cords. Built as one parametric surface along the shell's axis, lying on its
 *  side the way it is set down, with the glossy pink-orange aperture lip on
 *  top — the colour the tradition prizes. */
function conch(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const length = spec.size
  const widest = spec.size * 0.25
  const whorls = 4 + Math.round(rng.next())
  const smooth = (t: number) => t * t * (3 - 2 * t)
  const profile = (u: number) => {
    if (u < 0.3) {
      // The spire: a cone of stepped whorls, each a little bulge.
      const s = (u / 0.3) * whorls
      const step = 0.78 + 0.22 * smooth(s - Math.floor(s))
      return widest * 0.6 * Math.pow(u / 0.3, 0.85) * step
    }
    if (u < 0.46) return widest * (0.6 + 0.4 * smooth((u - 0.3) / 0.16))
    // The body whorl narrowing into the canal, closing at the very tip.
    const t = (u - 0.46) / 0.54
    return widest * (0.1 + 0.9 * Math.pow(1 - smooth(t), 0.85)) * (u > 0.985 ? (1 - u) / 0.015 : 1)
  }
  const knobs = rng.range(7, 9)
  const surface = new ParametricGeometry(
    (u: number, v: number, target: THREE.Vector3) => {
      const theta = v * Math.PI * 2
      let r = profile(u)
      // Fine spiral cords over the whole shell.
      r *= 1 + 0.03 * Math.cos(2 * Math.PI * u * 16 + theta)
      // Blunt knobs round the shoulder.
      r *= 1 + 0.09 * Math.exp(-(((u - 0.4) / 0.045) ** 2)) * Math.max(0, Math.cos(theta * knobs))
      target.set((u - 0.45) * length, r * Math.cos(theta), r * Math.sin(theta))
    },
    q.tube * 2,
    Math.max(24, q.radial * 2),
  )
  body.push(surface)

  // The aperture lip: a glossy pink-orange band laid on the shell itself,
  // along the upper side of the body whorl. Drawn as its own patch of the same
  // surface a hair further out, so it follows every cord and knob beneath it.
  const half = 0.13
  const lip = new ParametricGeometry(
    (u: number, v: number, target: THREE.Vector3) => {
      const uu = 0.48 + u * 0.46
      const theta = (v - 0.5) * 2 * half * Math.PI * 2
      // Widest in the middle of the lip, narrowing to both ends.
      const taper = Math.sin(u * Math.PI)
      const t = theta * (0.35 + 0.65 * taper)
      let r = profile(uu) * 1.012
      r *= 1 + 0.03 * Math.cos(2 * Math.PI * uu * 16 + t)
      target.set((uu - 0.45) * length, r * Math.cos(t), r * Math.sin(t))
    },
    q.tube,
    Math.max(8, q.radial / 2),
  )
  accent.push(lip)
}

/** Mukta: a sphere, very nearly. Pearls are not perfectly round, and the
 *  slight ovality is most of what makes one look real. */
function pearl(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  // One pearl on its own is a white ball. Shown the way they are kept, a
  // few on a cloth cushion with one larger than the rest, they read as pearls.
  const r = spec.size * 0.24
  const cushion = r * 2.6
  place(
    new THREE.SphereGeometry(cushion, q.radial * 2, q.rings),
    accent,
    new THREE.Vector3(0, cushion * 0.16, 0),
    undefined,
    new THREE.Vector3(1, 0.2, 1),
  )
  // The raised rim of cloth round the dip the pearls sit in.
  place(
    hoop(cushion * 0.8, cushion * 0.13, 8, q.radial * 2),
    accent,
    new THREE.Vector3(0, cushion * 0.26, 0),
    aim(new THREE.Vector3(0, 1, 0)),
    new THREE.Vector3(1, 1, 0.6),
  )
  const rest = cushion * 0.32
  const seats: [number, number, number][] = [
    [0, 0, 1],
    [0.95, 0.4, 0.62],
    [-0.8, 0.7, 0.55],
    [0.2, -0.95, 0.5],
  ]
  for (const [sx, sz, scale] of seats) {
    const pr = r * scale
    place(
      new THREE.SphereGeometry(pr, q.radial * 2, q.rings * 2),
      body,
      new THREE.Vector3(sx * cushion * 0.42, rest + pr * 0.92, sz * cushion * 0.42),
      undefined,
      // Pearls are not perfectly round; the slight ovality is most of what
      // makes one look real.
      new THREE.Vector3(1, rng.range(0.93, 1), rng.range(0.96, 1.03)),
    )
  }
}

/** Pravala: a branch of red coral as it is sold — a bushy fan of tapering,
 *  slightly crooked branches from a thick base, dotted with polyp pores. Each
 *  branch is two bent segments with a knuckle between, so none is a straight rod. */
function coral(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const sides = Math.max(6, Math.round(q.radial / 2))
  const segment = (from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number) => {
    const dir = to.clone().sub(from)
    const len = dir.length()
    place(new THREE.CylinderGeometry(r1, r0, len, sides), body, from.clone().add(to).multiplyScalar(0.5), aim(dir))
    place(new THREE.SphereGeometry(r1, sides, Math.max(4, sides / 2)), body, to)
  }
  const pores = (from: THREE.Vector3, to: THREE.Vector3, r: number) => {
    const count = Math.round(3 * q.cells)
    for (let i = 0; i < count; i++) {
      const at = from.clone().lerp(to, rng.range(0.15, 0.95))
      const out = new THREE.Vector3(rng.jitter(1), rng.jitter(1), rng.jitter(1)).normalize()
      place(new THREE.SphereGeometry(r * 0.32, 5, 4), accent, at.addScaledVector(out, r * 0.85))
    }
  }
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, radius: number, length: number, depth: number) => {
    // A knuckle partway along, turning the branch a little.
    const bend = dir
      .clone()
      .add(new THREE.Vector3(rng.jitter(0.35), rng.range(0, 0.2), rng.jitter(0.35)))
      .normalize()
    const knuckle = from.clone().addScaledVector(dir, length * 0.5)
    const tip = knuckle.clone().addScaledVector(bend, length * 0.5)
    segment(from, knuckle, radius, radius * 0.85)
    segment(knuckle, tip, radius * 0.85, radius * 0.7)
    pores(from, tip, radius)
    if (depth === 0) {
      place(new THREE.SphereGeometry(radius * 0.78, sides, Math.max(4, sides / 2)), body, tip)
      return
    }
    const children = 2 + (rng.next() > 0.45 ? 1 : 0)
    for (let i = 0; i < children; i++) {
      const spread = (i / children) * Math.PI * 2 + rng.next()
      const next = bend
        .clone()
        .add(new THREE.Vector3(Math.cos(spread) * 0.75, rng.range(0.2, 0.55), Math.sin(spread) * 0.75))
        .normalize()
      grow(tip, next, radius * 0.68, length * rng.range(0.62, 0.8), depth - 1)
    }
  }
  const trunk = spec.size * 0.075
  // A short thick stump, then three leaders that fan out from it.
  const base = new THREE.Vector3(0, spec.size * 0.12, 0)
  segment(new THREE.Vector3(0, 0, 0), base, trunk * 1.4, trunk * 1.1)
  const leaders = 3
  for (let i = 0; i < leaders; i++) {
    const a = (i / leaders) * Math.PI * 2 + rng.jitter(0.4)
    const dir = new THREE.Vector3(Math.cos(a) * 0.55, 1, Math.sin(a) * 0.3).normalize()
    grow(base, dir, trunk, spec.size * rng.range(0.26, 0.32), Math.min(3, q.detail))
  }
}

/** Shukti: one valve of a pearl oyster — a shallow, fan-shaped dish with
 *  frilled growth rings outside and a smooth nacre lining within. The lining
 *  is the accent, so it can take the pearl's own iridescence. */
function shell(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const R = spec.size * 0.5
  const depth = spec.size * 0.16
  const wobble = [rng.jitter(0.08), rng.jitter(0.08), rng.jitter(0.06)]
  // The outline: rounded, a little longer than wide, narrowing to the hinge.
  const outline = (phi: number) =>
    R * (1 + 0.18 * Math.cos(phi) + wobble[0] * Math.cos(2 * phi) + wobble[1] * Math.sin(3 * phi)) *
    (1 - 0.35 * Math.max(0, -Math.cos(phi)) ** 3)
  const valve = (inset: number, frills: number) =>
    new ParametricGeometry(
      (t: number, v: number, target: THREE.Vector3) => {
        const phi = v * Math.PI * 2
        const rings = frills * Math.sin(t * Math.PI * 11) * t
        const rho = t * outline(phi) * (1 - inset) * (1 + rings * 0.06)
        const y = depth * t * t * (1 - inset * 0.5) + rings * spec.size * 0.02 + inset * spec.size * 0.014
        target.set(rho * Math.cos(phi) - R * 0.12, y, rho * Math.sin(phi))
      },
      Math.max(10, q.rings * 2),
      Math.max(24, q.radial * 2),
    )
  // Propped up on its hinge, tipped towards the viewer: flat, it showed only
  // the lining and read as a saucer.
  const prop = new THREE.Matrix4().makeTranslation(0, R * 0.45, 0).multiply(new THREE.Matrix4().makeRotationZ(0.55))
  body.push(valve(0, 1).applyMatrix4(prop))
  accent.push(valve(0.12, 0).applyMatrix4(prop))
}


/** A cast bar: swarna, rajata, loha. Tapered like a mould-cast ingot, with
 *  the bevel a bar actually has, not a plain box. */
function ingot(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const w = spec.size
  const h = spec.size * 0.38
  const d = spec.size * 0.5
  const shape = new THREE.Shape()
  const bevel = h * 0.28
  shape.moveTo(-w / 2, 0)
  shape.lineTo(w / 2, 0)
  shape.lineTo(w / 2 - bevel, h)
  shape.lineTo(-w / 2 + bevel, h)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: h * 0.06, bevelThickness: h * 0.06, bevelSegments: 1, steps: 1 })
  geo.rotateX(0)
  place(geo, body, new THREE.Vector3(0, 0, -d / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng.jitter(0.25), 0)))
  // The stamp on the face.
  place(hoop(h * 0.22, h * 0.03, 4, Math.max(8, q.radial)), accent, new THREE.Vector3(0, h * 0.55, d / 2 - 0.001), aim(new THREE.Vector3(0, 0, 1)))
  // Beside the bar, the form the pharmacy actually takes it in: beaten leaf,
  // a loose stack of sheets thin enough to lift on a breath.
  for (let i = 0; i < 4; i++) {
    const sheet = new THREE.PlaneGeometry(w * 0.46, w * 0.46, 3, 3)
    const pos = sheet.attributes.position
    const curl = rng.range(0.4, 1.1)
    for (let v = 0; v < pos.count; v++) {
      // Leaf never lies flat: the corners lift, each sheet its own way.
      const x = pos.getX(v)
      const y = pos.getY(v)
      pos.setZ(v, ((x * x + y * y) * curl) / w)
    }
    sheet.computeVertexNormals()
    place(
      sheet,
      accent,
      new THREE.Vector3(w * 0.86 + rng.jitter(w * 0.04), h * 0.02 + i * h * 0.035, rng.jitter(w * 0.05)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rng.next() * Math.PI)),
    )
  }
}

/** A heap of powder — how a bhasma or a churna is actually kept and shown.
 *  The `dish` variant pours it into a shallow bowl instead of heaping it on
 *  the bench, which is the difference between two bhasmas on one shelf and
 *  the same grey cone twice. */
function powder(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const r = spec.size * 0.5
  const h = spec.size * (spec.variant === 'dish' ? 0.2 : 0.42)
  if (spec.variant === 'dish') {
    // The bowl: a shallow lathe turned from its rim down to its foot.
    const bowl = [
      new THREE.Vector2(r * 0.34, 0),
      new THREE.Vector2(r * 0.42, spec.size * 0.03),
      new THREE.Vector2(r * 0.9, spec.size * 0.05),
      new THREE.Vector2(r * 1.12, spec.size * 0.17),
      new THREE.Vector2(r * 1.08, spec.size * 0.19),
      new THREE.Vector2(r * 0.86, spec.size * 0.07),
      new THREE.Vector2(r * 0.3, spec.size * 0.045),
    ]
    place(new THREE.LatheGeometry(bowl, q.radial), accent, new THREE.Vector3(0, 0, 0))
  }
  if (spec.variant === 'mica') {
    // Beside the bhasma, the raw mineral it was made from: "books" of mica,
    // stacks of thin six-sided sheets, each a little turned on the one below.
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2 + rng.next()
      const at = new THREE.Vector3(Math.cos(a) * r * 1.55, 0, Math.sin(a) * r * 1.55)
      const plate = r * rng.range(0.28, 0.42)
      const sheets = 4 + Math.round(rng.next() * 3)
      for (let k = 0; k < sheets; k++) {
        place(
          new THREE.CylinderGeometry(plate, plate, spec.size * 0.012, 6),
          accent,
          new THREE.Vector3(at.x + rng.jitter(plate * 0.08), spec.size * (0.008 + k * 0.014), at.z + rng.jitter(plate * 0.08)),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.jitter(0.04), rng.next() * Math.PI, rng.jitter(0.04))),
        )
      }
    }
  }
  const cone = new THREE.ConeGeometry(r, h, q.radial, 2)
  const pos = cone.attributes.position
  const noise = lobes(rng, 3)
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i)
    // Only the flanks move: a heap slumps, its apex stays an apex.
    const slump = 1 + noise(n.clone().normalize()) * 0.35
    pos.setXYZ(i, n.x * slump, n.y, n.z * slump)
  }
  cone.computeVertexNormals()
  place(cone, body, new THREE.Vector3(0, spec.variant === 'dish' ? spec.size * 0.05 + h / 2 : h / 2, 0))
  for (let i = 0; i < Math.round(14 * q.cells); i++) {
    const a = rng.next() * Math.PI * 2
    const at = r * rng.range(1.02, 1.5)
    place(
      new THREE.SphereGeometry(spec.size * rng.range(0.012, 0.026), 4, 3),
      accent,
      new THREE.Vector3(Math.cos(a) * at, spec.size * 0.012, Math.sin(a) * at),
    )
  }
}

const FORMS = { honeycomb, vessel, rock, conch, pearl, coral, shell, ingot, powder } as const

/** Builds (and caches) one substance, standing on y = 0. */
export function buildSubstanceGeometry(
  id: string,
  spec: SubstanceModelSpec,
  detail: Detail = 'high',
): SubstanceGeometrySet {
  const key = `${id}:${detail}`
  const hit = cache.get(key)
  if (hit) return hit

  const q = QUALITY[detail]
  const rng = makeRng(hashSeed(id))
  const body: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const liquid: THREE.BufferGeometry[] = []
  FORMS[spec.form](spec, rng, q, body, accent, liquid)

  // mergeGeometries refuses a mix of indexed and non-indexed parts (a
  // polyhedron beside a sphere), so a mixed list is flattened first.
  const unify = (list: THREE.BufferGeometry[]) =>
    list.some((g) => !g.index) ? list.map((g) => (g.index ? g.toNonIndexed() : g)) : list
  const merged = body.length ? mergeGeometries(unify(body), false) : new THREE.BoxGeometry(spec.size, spec.size, spec.size)
  const mergedAccent = accent.length ? mergeGeometries(unify(accent), false) : null
  const mergedLiquid = liquid.length ? mergeGeometries(unify(liquid), false) : null
  for (const g of [...body, ...accent, ...liquid]) g.dispose()

  merged.computeVertexNormals()
  merged.computeBoundingBox()
  mergedAccent?.computeVertexNormals()
  mergedLiquid?.computeVertexNormals()
  const bounds = (merged.boundingBox ?? new THREE.Box3()).clone()
  for (const extra of [mergedAccent, mergedLiquid]) {
    if (!extra) continue
    extra.computeBoundingBox()
    if (extra.boundingBox) bounds.union(extra.boundingBox)
  }
  const size = bounds.getSize(new THREE.Vector3())
  const set: SubstanceGeometrySet = {
    body: merged,
    accent: mergedAccent,
    liquid: mergedLiquid,
    bounds,
    height: size.y,
    radius: Math.max(size.x, size.z) / 2,
  }
  cache.set(key, set)
  return set
}

/** Frees every cached substance — used when the 3D layer unmounts. */
export function disposeSubstanceCache() {
  for (const set of cache.values()) {
    set.body.dispose()
    set.accent?.dispose()
    set.liquid?.dispose()
  }
  cache.clear()
}
