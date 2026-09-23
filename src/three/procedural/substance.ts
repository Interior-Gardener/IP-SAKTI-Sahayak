import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
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
  // Honey run off the torn edge and pooled on the bench under it.
  for (let i = 0; i < Math.max(2, Math.round(4 * q.cells)); i++) {
    const a = rng.next() * Math.PI * 2
    const at = reach * rng.range(0.82, 0.95)
    place(
      new THREE.SphereGeometry(cell * rng.range(0.9, 1.5), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      liquid,
      new THREE.Vector3(Math.cos(a) * at, 0, Math.sin(a) * at),
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
    body.push(new THREE.LatheGeometry(profile, q.radial))
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
  body.push(new THREE.LatheGeometry(profile, q.radial))
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

/** A lump: an ore, a raw resin, a shell fragment, a pod. The variant decides
 *  how it sits — a shard is flat and angular where a nugget is closed and
 *  round, and the two do not read as the same object. */
function rock(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
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
  // A few bright grains where the lump was broken open. They follow the same
  // squash as the body, or they float off a flattened shard.
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

/** Shankha: a logarithmic spiral swept into a tube, widening as it turns,
 *  with the aperture flared at the end. Shell ridges are the accent. */
function conch(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const turns = rng.range(3.1, 3.6)
  const steps = q.tube
  const points: THREE.Vector3[] = []
  const radii: number[] = []
  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const angle = u * turns * Math.PI * 2
    // Both the spiral and the tube grow geometrically — that ratio is what
    // makes a shell a shell rather than a coiled sausage.
    const spiral = Math.pow(1.9, u * 2.2) * spec.size * 0.06
    points.push(new THREE.Vector3(Math.cos(angle) * spiral, u * spec.size * 0.62, Math.sin(angle) * spiral))
    radii.push(Math.pow(2.1, u * 2.1) * spec.size * 0.035)
  }
  const curve = new THREE.CatmullRomCurve3(points)
  // TubeGeometry takes one radius, so the taper is applied to its vertices
  // afterwards: each ring is scaled about the curve point it belongs to.
  const tube = new THREE.TubeGeometry(curve, steps, 1, Math.max(6, q.radial / 2), false)
  const pos = tube.attributes.position
  const ring = Math.max(6, Math.round(q.radial / 2)) + 1
  for (let i = 0; i < pos.count; i++) {
    const seg = Math.min(steps, Math.floor(i / ring))
    const centre = points[seg]
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).sub(centre).multiplyScalar(radii[seg]).add(centre)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  tube.computeVertexNormals()
  // The shell lies on its side, the way a conch is set down and the way it is
  // held to blow it — standing on its spire it reads as a screw.
  const lie = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2.1, 0, 0.18))
  place(tube, body, new THREE.Vector3(0, 0, 0), lie)

  // The aperture: the mouth flares out, and without it the last whorl ends in
  // a cut-off pipe. Built as a short cone on the final tangent.
  const last = points[points.length - 1]
  const mouthR = radii[radii.length - 1]
  const mouth = new THREE.CylinderGeometry(mouthR * 1.55, mouthR * 0.98, mouthR * 1.3, Math.max(8, q.radial), 1, true)
  const mouthPlace = new THREE.Vector3().copy(last).addScaledVector(curve.getTangentAt(0.999), mouthR * 0.6)
  place(mouth, body, mouthPlace.applyQuaternion(lie), lie.clone().multiply(aim(curve.getTangentAt(0.999))))

  // Growth ridges across the whorls.
  for (let i = 0; i < Math.round(7 * q.cells); i++) {
    const u = 0.35 + (i / 8) * 0.6
    const seg = Math.min(steps, Math.round(u * steps))
    place(
      hoop(radii[seg] * 1.04, radii[seg] * 0.08, 4, Math.max(8, q.radial)),
      accent,
      points[seg].clone().applyQuaternion(lie),
      lie.clone().multiply(aim(curve.getTangentAt(Math.min(0.999, u)))),
    )
  }
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

/** Pravala: a branch of coral, grown by the same recursion as a mould but
 *  thicker, blunter and reaching upwards. */
function coral(spec: SubstanceModelSpec, rng: Rng, q: Q, body: THREE.BufferGeometry[], accent: THREE.BufferGeometry[]) {
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, radius: number, length: number, depth: number) => {
    const to = from.clone().addScaledVector(dir, length)
    const mid = from.clone().add(to).multiplyScalar(0.5)
    place(new THREE.CylinderGeometry(radius * 0.72, radius, length, Math.max(5, q.radial / 3)), body, mid, aim(dir))
    place(new THREE.SphereGeometry(radius * 0.8, Math.max(5, q.radial / 3), Math.max(4, q.rings / 3)), body, to)
    if (depth === 0) {
      // The polyp cups at the tips, which is where coral reads as coral.
      place(new THREE.SphereGeometry(radius * 0.5, 6, 5), accent, to.clone().addScaledVector(dir, radius * 0.4))
      return
    }
    for (let i = 0; i < 2 + (rng.next() > 0.6 ? 1 : 0); i++) {
      const side = dir
        .clone()
        .add(new THREE.Vector3(rng.jitter(0.9), rng.range(0.1, 0.6), rng.jitter(0.9)))
        .normalize()
      grow(to, side, radius * 0.7, length * rng.range(0.6, 0.85), depth - 1)
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(rng.jitter(0.2), 1, rng.jitter(0.2)).normalize(), spec.size * 0.09, spec.size * 0.34, q.detail)
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

const FORMS = { honeycomb, vessel, rock, conch, pearl, coral, ingot, powder } as const

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

  const merged = body.length ? mergeGeometries(body, false) : new THREE.BoxGeometry(spec.size, spec.size, spec.size)
  const mergedAccent = accent.length ? mergeGeometries(accent, false) : null
  const mergedLiquid = liquid.length ? mergeGeometries(liquid, false) : null
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
