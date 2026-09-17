import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { PlantModelSpec } from '../../types/plant'
import { buildLeafGeometry, buildLeafUnit } from './leaf'
import { hashSeed, makeRng, type Rng } from './rng'

/* ------------------------------------------------------------------ *
 * Procedural plant assembly.
 *
 * Everything in the garden is generated from a `PlantModelSpec` — no
 * downloaded models, no textures. An archetype (herb, tree, climber,
 * rosette, grass, creeper) decides the skeleton; the leaf, flower and
 * fruit specs decorate it. The result is merged into one geometry per
 * material, so a whole plant costs a handful of draw calls.
 * ------------------------------------------------------------------ */

export type Detail = 'high' | 'medium' | 'low'

/*
 * Mesh resolution and leaf count are deliberately separate knobs. A garden
 * seen from ten metres needs *many* leaves, each of which can be a handful
 * of triangles; a single specimen under inspection needs the opposite. The
 * old coupling produced botanically bare twigs on low-end devices.
 */
const QUALITY = {
  high: { rows: 9, cols: 3, radial: 6, steps: 10, density: 1, leafletScale: 1, floret: 1 },
  medium: { rows: 5, cols: 2, radial: 5, steps: 8, density: 1, leafletScale: 0.9, floret: 0.8 },
  low: { rows: 3, cols: 1, radial: 4, steps: 6, density: 1, leafletScale: 0.7, floret: 0.5 },
} as const

/** Leaf units a single plant may spend, per detail level. */
const BUDGET: Record<Detail, number> = { high: 520, medium: 340, low: 260 }

export interface PlantGeometrySet {
  stem: THREE.BufferGeometry | null
  foliage: THREE.BufferGeometry | null
  petal: THREE.BufferGeometry | null
  core: THREE.BufferGeometry | null
  fruit: THREE.BufferGeometry | null
  /** Ripe fruit, kept apart so the two states can be coloured and labelled separately. */
  ripeFruit: THREE.BufferGeometry | null
  rhizome: THREE.BufferGeometry | null
  /** Bounding measurements used for framing the camera and spacing beds. */
  height: number
  radius: number
  /** Actual extents of the generated geometry, for exact camera framing. */
  bounds: THREE.Box3
}

const UP = new THREE.Vector3(0, 1, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/* ---------------------------- helpers ---------------------------- */

/** Adds the wind attributes every generated part needs before merging. */
function stamp(geo: THREE.BufferGeometry, phase: number, tint: number): THREE.BufferGeometry {
  const count = geo.attributes.position.count
  if (!geo.attributes.uv) {
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2).fill(0.5), 2))
  }
  if (!geo.attributes.aFlex) {
    geo.setAttribute('aFlex', new THREE.Float32BufferAttribute(new Float32Array(count).fill(0.4), 1))
  }
  geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(new Float32Array(count).fill(phase), 1))
  /* A part that arrived already shaded keeps its own tone — the carpels sunk
   * in a lotus receptacle are darker than the face they sit in, and that has
   * to survive being placed. Everything else takes the caller's tint. */
  if (!geo.attributes.aTint) {
    geo.setAttribute('aTint', new THREE.Float32BufferAttribute(new Float32Array(count).fill(tint), 1))
  }
  if (!geo.index) {
    // Merging requires every part to agree on indexed-ness.
    const idx = new Uint32Array(count)
    for (let i = 0; i < count; i++) idx[i] = i
    geo.setIndex(new THREE.BufferAttribute(idx, 1))
  }
  return geo
}

function mergeOrNull(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (parts.length === 0) return null
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  return merged
}

/** Signed angle from `a` to `b` measured about `axis`. */
function signedAngle(a: THREE.Vector3, b: THREE.Vector3, axis: THREE.Vector3): number {
  const cross = new THREE.Vector3().crossVectors(a, b)
  return Math.atan2(cross.dot(axis), a.dot(b))
}

/**
 * Orientation for an organ growing along `dir`, rolled so its face (local +Z)
 * turns toward the sky — the way real leaves present themselves to light.
 */
function orientTo(dir: THREE.Vector3, faceUp = true): THREE.Quaternion {
  const d = dir.clone().normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, d)
  if (!faceUp) return q
  const skyward = UP.clone().addScaledVector(d, -UP.dot(d))
  if (skyward.lengthSq() < 1e-6) return q
  skyward.normalize()
  const face = new THREE.Vector3(0, 0, 1).applyQuaternion(q)
  const roll = signedAngle(face, skyward, d)
  return q.multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, roll))
}

/**
 * Orientation for an organ set round a flower's axis at `azimuth`, leaning
 * `pitch` radians off vertical, with its cupped face (local +Z) turned in
 * toward that axis — how a petal or a stamen actually sits. `orientTo` rolls
 * organs to face the sky instead, which is right for a leaf and wrong here:
 * it left every petal in a whorl cupping a different way.
 */
function radialOrientation(azimuth: number, pitch: number): THREE.Quaternion {
  const outward = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth))
  const tip = outward.clone().multiplyScalar(Math.sin(pitch)).addScaledVector(UP, Math.cos(pitch)).normalize()
  const face = UP.clone().multiplyScalar(Math.sin(pitch)).addScaledVector(outward, -Math.cos(pitch)).normalize()
  const side = new THREE.Vector3().crossVectors(tip, face)
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, tip, face))
}

/** A tapered tube swept through a set of points — stems, branches, petioles. */
function buildTube(
  points: THREE.Vector3[],
  radiusStart: number,
  radiusEnd: number,
  radialSegments: number,
  lengthSegments: number,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
  const seg = Math.max(2, lengthSegments)
  const frames = curve.computeFrenetFrames(seg, false)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const flex: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const p = curve.getPointAt(t)
    const n = frames.normals[i]
    const b = frames.binormals[i]
    const r = THREE.MathUtils.lerp(radiusStart, radiusEnd, t)
    for (let j = 0; j <= radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(a)
      const cos = Math.cos(a)
      const nx = n.x * cos + b.x * sin
      const ny = n.y * cos + b.y * sin
      const nz = n.z * cos + b.z * sin
      positions.push(p.x + nx * r, p.y + ny * r, p.z + nz * r)
      normals.push(nx, ny, nz)
      uvs.push(j / radialSegments, t)
      flex.push(t * t)
    }
  }

  const ring = radialSegments + 1
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ring + j
      const b = a + ring
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 1))
  geo.setIndex(indices)
  return geo
}

/**
 * Counts the axes an archetype will generate, per branching level, so leaf
 * density can be scaled evenly up front. Without this the depth-first walk
 * spends its whole leaf budget on the first limb and leaves the rest bare.
 */
function axisCensus(spec: PlantModelSpec, q: (typeof QUALITY)[Detail]): { level: number; axes: number }[] {
  const decay = spec.archetype === 'tree' ? 0.8 : 0.5
  const roots =
    spec.archetype === 'shrub'
      ? Math.max(2, Math.round(2 + q.density))
      : spec.archetype === 'creeper'
        ? Math.max(3, Math.round(spec.branching.count * q.density))
        : spec.archetype === 'climber'
          ? Math.max(1, Math.round(spec.branching.count * 0.5 * q.density)) + 1
          : 1

  const rows: { level: number; axes: number }[] = []
  let axes = roots
  for (let level = 0; level <= spec.branching.levels; level++) {
    rows.push({ level, axes })
    axes *= Math.max(1, Math.round(spec.branching.count * Math.pow(decay, level)))
  }
  return rows
}

/** Uniform thinning factor that keeps the whole plant within its leaf budget. */
function leafDensityScale(spec: PlantModelSpec, q: (typeof QUALITY)[Detail], budget: number): number {
  const arrangement = spec.leaf.arrangement
  if (arrangement === 'basal') return 1
  const perNode = arrangement === 'opposite' ? 2 : arrangement === 'whorled' ? 3 : 1
  let total = 0
  for (const { level, axes } of axisCensus(spec, q)) {
    const bears = spec.archetype === 'tree' ? level === spec.branching.levels : true
    if (!bears) continue
    const thinning = spec.archetype === 'tree' ? 1 : Math.pow(0.62, level)
    total += axes * (spec.leaf.density ?? 6) * q.density * thinning * perNode
  }
  return total > 0 ? Math.min(1, budget / total) : 1
}

/* --------------------------- the builder --------------------------- */

interface BuildContext {
  spec: PlantModelSpec
  rng: Rng
  q: (typeof QUALITY)[Detail]
  stems: THREE.BufferGeometry[]
  foliage: THREE.BufferGeometry[]
  petals: THREE.BufferGeometry[]
  cores: THREE.BufferGeometry[]
  fruits: THREE.BufferGeometry[]
  ripeFruits: THREE.BufferGeometry[]
  rhizomes: THREE.BufferGeometry[]
  leafTemplate: THREE.BufferGeometry
  floretPetal: THREE.BufferGeometry | null
  floretCore: THREE.BufferGeometry | null
  fruitTemplate: THREE.BufferGeometry | null
  /** Tips where terminal flowers and fruit can hang. */
  tips: { point: THREE.Vector3; dir: THREE.Vector3; phase: number }[]
  radius: number
  /** Remaining leaf units — a backstop behind `leafScale`. */
  budget: number
  /** Uniform density multiplier that keeps the plant inside its budget. */
  leafScale: number
}

function place(
  target: THREE.BufferGeometry[],
  template: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
  phase: number,
  tint: number,
) {
  const g = template.clone()
  g.applyMatrix4(matrix)
  target.push(stamp(g, phase, tint))
}

/** Grows one axis — trunk, branch, runner or petiole — and everything on it. */
function growAxis(
  ctx: BuildContext,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  radius: number,
  level: number,
  phase: number,
) {
  const { spec, rng, q } = ctx
  const steps = Math.max(3, Math.round(q.steps - level))
  const segment = length / steps
  const dir = direction.clone().normalize()
  const points: THREE.Vector3[] = [origin.clone()]
  const cursor = origin.clone()

  // Ground-level axes start just under the soil, hiding the open tube end.
  if (level === 0 && Math.abs(origin.y) < 1e-6) origin = origin.clone().setY(-Math.max(0.02, radius * 1.5))

  const wander = (spec.stem.curve ?? 0.2) * 0.34
  // Woody axes straighten with age; soft herbs keep reaching for the light.
  const gravitropism = spec.archetype === 'tree' ? 0.06 : spec.archetype === 'creeper' ? -0.02 : 0.13

  for (let i = 0; i < steps; i++) {
    dir.x += rng.jitter(wander) * 0.5
    dir.y += rng.jitter(wander) * 0.3 + gravitropism * (1 - dir.y) * 0.35
    dir.z += rng.jitter(wander) * 0.5
    dir.normalize()
    cursor.addScaledVector(dir, segment)
    points.push(cursor.clone())
    ctx.radius = Math.max(ctx.radius, Math.hypot(cursor.x, cursor.z))
  }

  const taper = spec.branching.taper ?? 0.65
  const tube = buildTube(points, radius, radius * taper, spec.stem.square ? 4 : q.radial, steps)
  ctx.stems.push(stamp(tube, phase, 0))

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
  const maxLevel = spec.branching.levels
  const isTip = level >= maxLevel
  // Trees carry foliage only on their outermost branches; herbs leaf all over.
  const bearsLeaves = spec.archetype === 'tree' ? isTip : true

  if (isTip) {
    ctx.tips.push({
      point: curve.getPointAt(1),
      dir: curve.getTangentAt(1),
      phase,
    })
  }

  if (bearsLeaves) attachLeaves(ctx, curve, level, phase)

  if (!isTip) {
    // Trees keep splitting to build a crown; herbs fan out once and stop.
    const decay = spec.archetype === 'tree' ? 0.8 : 0.5
    const count = Math.max(1, Math.round(spec.branching.count * Math.pow(decay, level)))
    const startAt = spec.branching.startAt ?? 0.3
    const angle = THREE.MathUtils.degToRad(spec.branching.angle)
    for (let i = 0; i < count; i++) {
      const t = THREE.MathUtils.lerp(startAt, 0.96, count === 1 ? 0.6 : i / (count - 1)) + rng.jitter(0.05)
      const at = THREE.MathUtils.clamp(t, 0.05, 0.98)
      const base = curve.getPointAt(at)
      const tangent = curve.getTangentAt(at)
      const azimuth = i * GOLDEN_ANGLE + rng.jitter(0.5) + level * 1.1
      const side = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth))
      side.addScaledVector(tangent, -side.dot(tangent)).normalize()
      const childDir = tangent
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(side, Math.sin(angle))
        .normalize()
      growAxis(
        ctx,
        base,
        childDir,
        length * (1 - at) * rng.range(0.55, 0.82) + length * 0.09,
        radius * taper * rng.range(0.75, 0.95),
        level + 1,
        phase + rng.range(0.4, 1.6),
      )
    }
  }
}

/** Distributes leaf units along an axis according to its phyllotaxy. */
function attachLeaves(
  ctx: BuildContext,
  curve: THREE.CatmullRomCurve3,
  level: number,
  phase: number,
) {
  const { spec, rng, q } = ctx
  const leaf = spec.leaf
  if (leaf.arrangement === 'basal') return

  const perNode = leaf.arrangement === 'opposite' ? 2 : leaf.arrangement === 'whorled' ? 3 : 1
  const thinning = spec.archetype === 'tree' ? 1 : Math.pow(0.62, level)
  const nodes = Math.max(1, Math.round((leaf.density ?? 6) * q.density * thinning * ctx.leafScale))
  const start = spec.archetype === 'tree' ? 0.1 : 0.18
  if (ctx.budget <= 0) return

  for (let n = 0; n < nodes; n++) {
    const t = THREE.MathUtils.lerp(start, 0.97, nodes === 1 ? 0.5 : n / (nodes - 1))
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    // Leaves shrink toward the growing tip, as new ones are still expanding.
    const scale = THREE.MathUtils.lerp(1.1, 0.74, t) * (level > 0 ? 0.94 : 1) * rng.range(0.92, 1.08)

    const nodeSpin =
      leaf.arrangement === 'alternate' ? n * GOLDEN_ANGLE : n * Math.PI * 0.5 + rng.jitter(0.15)

    for (let k = 0; k < perNode; k++) {
      const azimuth = nodeSpin + (k / perNode) * Math.PI * 2
      const side = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth))
      side.addScaledVector(tangent, -side.dot(tangent))
      if (side.lengthSq() < 1e-6) continue
      side.normalize()

      // Leaves lift away from the stem at roughly 55–75°.
      const pitch = THREE.MathUtils.degToRad(rng.range(52, 76))
      const leafDir = tangent
        .clone()
        .multiplyScalar(Math.cos(pitch))
        .addScaledVector(side, Math.sin(pitch))
        .normalize()

      if (ctx.budget-- <= 0) return
      const m = new THREE.Matrix4().compose(
        point,
        orientTo(leafDir),
        new THREE.Vector3(scale, scale, scale),
      )
      place(ctx.foliage, ctx.leafTemplate, m, phase + rng.range(0, 2), rng.jitter(1))
    }
  }
}

/** Leaves springing straight from the crown: rosettes, grass clumps, ferny basals. */
function attachBasalLeaves(
  ctx: BuildContext,
  origin: THREE.Vector3,
  tightness: number,
  /** Height over which successive leaves emerge — a pseudostem's sheath. */
  rise = 0,
) {
  const { spec, rng, q } = ctx
  const leaf = spec.leaf
  const count = Math.max(4, Math.round((leaf.density ?? 10) * q.density))

  for (let i = 0; i < count; i++) {
    const ratio = count === 1 ? 0.5 : i / (count - 1)
    const azimuth = i * GOLDEN_ANGLE + rng.jitter(0.25)
    // Inner leaves stand upright; outer ones lean further out as they age.
    const pitch = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(12, 86 * tightness, ratio) + rng.jitter(7))
    const dir = new THREE.Vector3(
      Math.cos(azimuth) * Math.sin(pitch),
      Math.cos(pitch),
      Math.sin(azimuth) * Math.sin(pitch),
    ).normalize()
    const scale = THREE.MathUtils.lerp(0.78, 1.12, ratio) * rng.range(0.92, 1.06)
    // The youngest leaves sit highest and stand most upright.
    const base = origin
      .clone()
      .setY(origin.y + (1 - ratio) * rise)
      .addScaledVector(dir, leaf.length * 0.04)
    if (ctx.budget-- <= 0) return
    const m = new THREE.Matrix4().compose(base, orientTo(dir), new THREE.Vector3(scale, scale, scale))
    place(ctx.foliage, ctx.leafTemplate, m, i * 0.7, rng.jitter(1))
    ctx.radius = Math.max(ctx.radius, leaf.length * Math.sin(pitch) * scale)
  }
}

/* ---------------------------- flowers ---------------------------- */

function buildFloretTemplates(ctx: BuildContext) {
  const flower = ctx.spec.flower
  // A lotus builds its own bloom per scape, at its own stage of opening.
  if (!flower || flower.form === 'lotus') return
  const petals = Math.max(3, Math.round((flower.petals ?? 5) * (ctx.q.floret >= 0.7 ? 1 : 0.7)))
  const petalGeo = buildLeafGeometry({
    shape: 'obovate',
    length: flower.size,
    width: flower.size * 0.62,
    droop: 0.35,
    curl: 0.4,
    rows: ctx.q.floret >= 0.7 ? 4 : 2,
    cols: 1,
  })

  const ring: THREE.BufferGeometry[] = []
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2
    const dir = new THREE.Vector3(Math.cos(a) * 0.82, 0.55, Math.sin(a) * 0.82).normalize()
    const g = petalGeo.clone()
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(), orientTo(dir, false), new THREE.Vector3(1, 1, 1)))
    ring.push(g)
  }
  petalGeo.dispose()
  ctx.floretPetal = mergeGeometries(ring, false)
  ring.forEach((r) => r.dispose())

  const coreGeo = new THREE.IcosahedronGeometry(flower.size * 0.3, 0)
  coreGeo.translate(0, flower.size * 0.16, 0)
  ctx.floretCore = coreGeo
}

function placeFloret(ctx: BuildContext, at: THREE.Vector3, scale: number, phase: number) {
  const m = new THREE.Matrix4().compose(
    at,
    new THREE.Quaternion().setFromAxisAngle(Y_AXIS, ctx.rng.range(0, Math.PI * 2)),
    new THREE.Vector3(scale, scale, scale),
  )
  if (ctx.floretPetal) place(ctx.petals, ctx.floretPetal, m, phase, ctx.rng.jitter(1))
  if (ctx.floretCore) place(ctx.cores, ctx.floretCore, m, phase, 0)
}

/* ------------------------------ lotus ------------------------------ */

/** The three material channels a lotus bloom is drawn in. */
export interface LotusBloomGeometry {
  /** The petals themselves. */
  petals: THREE.BufferGeometry
  /** Receptacle and carpels — green, and drawn with the foliage. */
  receptacle: THREE.BufferGeometry
  /** The stamen collar — gold, and drawn with the flower centre. Absent on a bud. */
  stamens: THREE.BufferGeometry | null
}

/**
 * Nelumbo's bloom, which none of the generic inflorescences describes.
 *
 * The tells are all in the middle of it. Twenty-odd petals in offset whorls,
 * the outer ones fallen back almost level while the inner ones still cup; a
 * dense collar of stamens; and — the thing no other flower in the garden has
 * — a bare flat-topped receptacle with its carpels sunk into the face, which
 * goes on to become the seed head everyone recognises. Built as a `solitary`
 * floret it came out a pink daisy with one bead in the middle.
 *
 * `openness` runs 0 (a tight bud, every petal drawn up around the receptacle)
 * to 1 (fully out); a real tank carries every stage at once. `quality` thins
 * the mesh for blooms that are only ever seen across the water.
 */
export function buildLotusBloom(opts: {
  size: number
  petals?: number
  openness?: number
  quality?: number
}): LotusBloomGeometry {
  const size = opts.size
  const openness = THREE.MathUtils.clamp(opts.openness ?? 1, 0, 1)
  const fidelity = THREE.MathUtils.clamp(opts.quality ?? 1, 0.25, 1)
  const fine = fidelity > 0.7
  const total = Math.max(9, Math.round((opts.petals ?? 22) * (0.55 + 0.45 * fidelity)))
  const whorls = fine ? 3 : 2
  const rows = fine ? 6 : 3
  const cols = fine ? 3 : 1
  const radial = fine ? 12 : 7

  /* ---- petals ---- */
  const petalParts: THREE.BufferGeometry[] = []
  for (let w = 0; w < whorls; w++) {
    // 0 at the outermost whorl, 1 at the innermost.
    const inward = w / (whorls - 1)
    const scale = THREE.MathUtils.lerp(1, 0.58, inward)
    const count = Math.max(4, Math.round((total / whorls) * THREE.MathUtils.lerp(1.18, 0.8, inward)))
    // Obovate: broadest above the middle and drawn to a point, which is the
    // lotus petal exactly. `curl` gives it its keel, `droop` recurves the tip.
    const blade = buildLeafGeometry({
      shape: 'obovate',
      length: size * scale,
      // Broad and overlapping. Narrower than this and the whorls stop touching,
      // which turns the bloom into a star rather than a cup.
      width: size * scale * 0.72,
      droop: THREE.MathUtils.lerp(0.3, 0.08, inward),
      curl: THREE.MathUtils.lerp(0.46, 0.86, inward),
      rows,
      cols,
    })
    /* Open, the outer whorl lies back almost level and every ring inside it
     * stands straighter; shut, they all draw up into the tulip of a lotus bud. */
    const pitch = THREE.MathUtils.lerp(
      THREE.MathUtils.degToRad(THREE.MathUtils.lerp(16, 6, inward)),
      THREE.MathUtils.degToRad(THREE.MathUtils.lerp(60, 22, inward)),
      openness,
    )
    const lift = size * THREE.MathUtils.lerp(0.06, 0.18, inward)
    for (let i = 0; i < count; i++) {
      // Half a step of offset per whorl, so each ring sits in the gaps of the last.
      const a = ((i + w * 0.5) / count) * Math.PI * 2
      const g = blade.clone()
      g.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(0, lift, 0),
          radialOrientation(a, pitch),
          new THREE.Vector3(1, 1, 1),
        ),
      )
      petalParts.push(g)
    }
    blade.dispose()
  }

  /* ---- receptacle ---- */
  /* Obconic: a cone stood on its point, widening to the flat face that carries
   * the carpels. Still small and tucked away in a bud, filling out as it opens. */
  const grown = 0.44 + 0.56 * openness
  const rTop = size * 0.24 * grown
  const rBot = size * 0.12 * grown
  const deep = size * 0.24 * grown
  /* Set well up on the pedicel, so the innermost whorl closes round it and the
   * flower is a cup with something inside rather than a ring of petals with a
   * green plug hanging below them. */
  const seat = size * 0.1
  const face = seat + deep

  /* Tint is set here rather than at placement because the two parts want
   * different tones, and `stamp` can only give a whole geometry one. */
  const shade = (geo: THREE.BufferGeometry, tone: number) => {
    const n = geo.attributes.position.count
    geo.setAttribute('aTint', new THREE.Float32BufferAttribute(new Float32Array(n).fill(tone), 1))
    return geo
  }

  const body = new THREE.CylinderGeometry(rTop, rBot, deep, radial, 1)
  body.translate(0, seat + deep * 0.5, 0)
  const receptacleParts: THREE.BufferGeometry[] = [shade(body, 1)]

  /* The carpels, on the phyllotactic spiral they actually grow in, each sunk
   * into the face so only its tip stands proud — the stipple that makes the
   * seed head read as a seed head rather than a plug. */
  const pips = Math.max(5, Math.round(17 * fidelity))
  const carpelR = rTop * 0.16
  const pip = new THREE.CylinderGeometry(carpelR, carpelR * 1.2, carpelR * 1.6, fine ? 6 : 4, 1)
  for (let i = 0; i < pips; i++) {
    const a = i * GOLDEN_ANGLE
    const reach = Math.sqrt((i + 0.5) / pips) * rTop * 0.66
    const g = pip.clone()
    g.translate(Math.cos(a) * reach, face - carpelR * 0.5, Math.sin(a) * reach)
    // Darker than the face they sit in.
    receptacleParts.push(shade(g, -1))
  }
  pip.dispose()

  const receptacle = mergeGeometries(receptacleParts, false)
  receptacleParts.forEach((r) => r.dispose())
  /* The receptacle shares the leaf material to get its green, but it is not a
   * leaf: parking every vertex off the shader's midrib keeps venation off it. */
  const uv = receptacle.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.02, 0.5)

  /* ---- stamens ---- */
  /* A closed bud keeps them hidden, so it does not pay for them. */
  let stamens: THREE.BufferGeometry | null = null
  if (openness > 0.3) {
    // Open-ended: the ends are buried in the ruff and in the anther above.
    const filament = new THREE.CylinderGeometry(size * 0.006, size * 0.009, size * 0.13, 3, 1, true)
    filament.translate(0, size * 0.065, 0)
    const anther = new THREE.CylinderGeometry(size * 0.004, size * 0.014, size * 0.09, fine ? 5 : 3, 1)
    anther.translate(0, size * 0.175, 0)
    const unit = mergeGeometries([filament, anther], false)
    filament.dispose()
    anther.dispose()

    const count = Math.max(9, Math.round(32 * fidelity))
    const ruff: THREE.BufferGeometry[] = []
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      // Two loose ranks, leaning out to clear the face of the receptacle.
      const rank = i % 2
      const lean = THREE.MathUtils.degToRad(16 + rank * 12) * (0.4 + 0.6 * openness)
      const g = unit.clone()
      g.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(Math.cos(a) * rBot * (1 + rank * 0.35), seat + deep * 0.16, Math.sin(a) * rBot * (1 + rank * 0.35)),
          radialOrientation(a, lean),
          new THREE.Vector3(1, 1, 1),
        ),
      )
      ruff.push(g)
    }
    unit.dispose()
    stamens = mergeGeometries(ruff, false)
    ruff.forEach((r) => r.dispose())
  }

  const petals = mergeGeometries(petalParts, false)
  petalParts.forEach((r) => r.dispose())
  return { petals, receptacle, stamens }
}

function attachFlowers(ctx: BuildContext) {
  const flower = ctx.spec.flower
  if (!flower || !ctx.tips.length) return
  const { rng, q } = ctx
  const clusters = Math.max(1, Math.round(flower.count * q.density))

  for (let c = 0; c < clusters; c++) {
    /* A lotus is one bloom on one scape and the aquatic habit raises a scape
     * per bloom, so they are taken in turn — picking at random stacked two
     * flowers on one stalk and left another bare. */
    const tip =
      flower.form === 'lotus'
        ? ctx.tips[c % ctx.tips.length]
        : ctx.tips[Math.floor(rng.next() * ctx.tips.length) % ctx.tips.length]
    const base = tip.point.clone()
    const dir = tip.dir.clone().normalize()

    switch (flower.form) {
      case 'spike':
      case 'catkin': {
        const florets = Math.max(4, Math.round(11 * q.floret))
        const spikeLength = flower.size * florets * 0.95
        const axis = flower.form === 'catkin' ? dir.clone().lerp(new THREE.Vector3(0, -1, 0), 0.8) : dir
        const stalk = buildTube(
          [base, base.clone().addScaledVector(axis, spikeLength * 0.5), base.clone().addScaledVector(axis, spikeLength)],
          flower.size * 0.22,
          flower.size * 0.1,
          4,
          4,
        )
        ctx.stems.push(stamp(stalk, tip.phase, 0))
        for (let i = 0; i < florets; i++) {
          const f = i / florets
          const at = base.clone().addScaledVector(axis, spikeLength * (0.12 + f * 0.88))
          const spin = i * GOLDEN_ANGLE
          at.x += Math.cos(spin) * flower.size * 0.5
          at.z += Math.sin(spin) * flower.size * 0.5
          placeFloret(ctx, at, 1 - f * 0.35, tip.phase + i * 0.3)
        }
        break
      }
      /*
       * The mint family's inflorescence, and the thing that reads as
       * "tulsi" from further away than any leaf does: an erect rachis
       * standing clear of the foliage, bare between rings of florets
       * rather than crowded along its whole length, opening from the
       * bottom up so the top of the spike is still in bud.
       */
      case 'verticillaster': {
        const whorls = Math.max(3, Math.round(7 * q.floret))
        const perWhorl = Math.max(3, Math.round(6 * q.floret))
        /* The raceme is terminal but stands up whatever the branch that
         * carries it was doing, which is why it clears the leaves. */
        const axis = dir.clone().lerp(UP, 0.62).normalize()
        const gap = flower.size * (flower.whorlGap ?? 2.4)
        const rachis = gap * whorls + flower.size
        const stalk = buildTube(
          [base, base.clone().addScaledVector(axis, rachis * 0.5), base.clone().addScaledVector(axis, rachis)],
          flower.size * 0.2,
          flower.size * 0.09,
          4,
          5,
        )
        ctx.stems.push(stamp(stalk, tip.phase, 0))

        // A frame on the rachis to hang each ring off squarely.
        const side = new THREE.Vector3(1, 0, 0)
        side.addScaledVector(axis, -side.dot(axis))
        if (side.lengthSq() < 1e-6) side.set(0, 0, 1).addScaledVector(axis, -axis.z)
        side.normalize()
        const other = new THREE.Vector3().crossVectors(axis, side).normalize()

        for (let w = 0; w < whorls; w++) {
          const up = w / whorls
          // Open at the foot, still budding at the tip.
          const open = 1 - up * 0.55
          const ring = base.clone().addScaledVector(axis, flower.size + w * gap)
          // Successive whorls sit half a step round from the last.
          const offset = w * (Math.PI / perWhorl)
          for (let i = 0; i < perWhorl; i++) {
            const a = offset + (i / perWhorl) * Math.PI * 2
            const at = ring
              .clone()
              .addScaledVector(side, Math.cos(a) * flower.size * 0.8)
              .addScaledVector(other, Math.sin(a) * flower.size * 0.8)
            placeFloret(ctx, at, open, tip.phase + w * 0.4 + i * 0.12)
          }
        }
        break
      }
      case 'umbel': {
        const florets = Math.max(4, Math.round(9 * q.floret))
        const head = base.clone().addScaledVector(dir, flower.size * 1.4)
        for (let i = 0; i < florets; i++) {
          const a = (i / florets) * Math.PI * 2
          const spread = flower.size * 1.5
          const at = head.clone().add(new THREE.Vector3(Math.cos(a) * spread, rng.jitter(flower.size * 0.3), Math.sin(a) * spread))
          const stalk = buildTube([base, at], flower.size * 0.09, flower.size * 0.06, 3, 2)
          ctx.stems.push(stamp(stalk, tip.phase, 0))
          placeFloret(ctx, at, 0.9, tip.phase + i * 0.4)
        }
        break
      }
      case 'panicle': {
        const branches = Math.max(3, Math.round(5 * q.floret))
        for (let i = 0; i < branches; i++) {
          const a = i * GOLDEN_ANGLE
          const reach = flower.size * rng.range(6, 11)
          const end = base
            .clone()
            .addScaledVector(dir, reach * 0.7)
            .add(new THREE.Vector3(Math.cos(a) * reach * 0.6, 0, Math.sin(a) * reach * 0.6))
          const stalk = buildTube([base, end], flower.size * 0.12, flower.size * 0.06, 3, 3)
          ctx.stems.push(stamp(stalk, tip.phase, 0))
          const per = Math.max(2, Math.round(3 * q.floret))
          for (let k = 0; k < per; k++) {
            const at = base.clone().lerp(end, 0.5 + (k / per) * 0.5)
            placeFloret(ctx, at, 0.85, tip.phase + k * 0.5)
          }
        }
        break
      }
      case 'cluster': {
        const per = Math.max(2, Math.round(4 * q.floret))
        for (let k = 0; k < per; k++) {
          const at = base
            .clone()
            .addScaledVector(dir, flower.size * rng.range(0.4, 1.6))
            .add(new THREE.Vector3(rng.jitter(flower.size), rng.jitter(flower.size * 0.6), rng.jitter(flower.size)))
          placeFloret(ctx, at, 0.95, tip.phase + k * 0.6)
        }
        break
      }
      case 'lotus': {
        /* Every stage at once, which is what a tank looks like: one scape
         * fully out and the rest caught somewhere short of it. */
        const target = flower.openness ?? 1
        const openness = c === 0 ? target : THREE.MathUtils.clamp(target * rng.range(0.1, 1.2), 0, 1)
        const bloom = buildLotusBloom({
          size: flower.size,
          petals: flower.petals,
          openness,
          quality: q.floret,
        })
        // A lotus holds its flower level whatever the scape is doing.
        const m = new THREE.Matrix4().compose(
          base.clone().addScaledVector(dir, flower.size * 0.2),
          new THREE.Quaternion().setFromAxisAngle(Y_AXIS, rng.range(0, Math.PI * 2)),
          new THREE.Vector3(1, 1, 1),
        )
        place(ctx.petals, bloom.petals, m, tip.phase, rng.jitter(0.8))
        place(ctx.foliage, bloom.receptacle, m, tip.phase, 1)
        if (bloom.stamens) place(ctx.cores, bloom.stamens, m, tip.phase, 0.5)
        bloom.petals.dispose()
        bloom.receptacle.dispose()
        bloom.stamens?.dispose()
        ctx.radius = Math.max(ctx.radius, flower.size * 1.15)
        break
      }
      default: {
        placeFloret(ctx, base.clone().addScaledVector(dir, flower.size * 0.8), 1, tip.phase)
      }
    }
  }
}

/* ----------------------------- fruit ----------------------------- */

function attachFruit(ctx: BuildContext) {
  const fruit = ctx.spec.fruit
  if (!fruit || !ctx.tips.length) return
  const { rng, q } = ctx

  let template: THREE.BufferGeometry
  if (fruit.shape === 'pod') {
    template = new THREE.CapsuleGeometry(fruit.size * 0.16, fruit.size, 2, q.radial)
    template.rotateZ(Math.PI * 0.12)
  } else {
    template = new THREE.IcosahedronGeometry(fruit.size, q.radial > 4 ? 1 : 0)
    if (fruit.shape === 'ovoid') template.scale(1, 1.35, 1)
    if (fruit.shape === 'berry') template.scale(1, 0.92, 1)
  }
  ctx.fruitTemplate = template

  const count = Math.max(2, Math.round(fruit.count * q.density))
  // Species whose ripe and unripe fruit are used for opposite things (bael)
  // carry both on the tree at once, so a share of the crop is drawn ripe.
  const ripe = fruit.ripeColor ? Math.max(1, Math.round(count * (fruit.ripeShare ?? 0.34))) : 0
  for (let i = 0; i < count; i++) {
    const tip = ctx.tips[i % ctx.tips.length]
    const hang = tip.point
      .clone()
      .addScaledVector(tip.dir, fruit.size * rng.range(0.3, 1.6))
      .add(new THREE.Vector3(rng.jitter(fruit.size * 2), -fruit.size * rng.range(0.8, 2.2), rng.jitter(fruit.size * 2)))
    const stalk = buildTube([tip.point.clone(), hang], fruit.size * 0.1, fruit.size * 0.07, 3, 2)
    ctx.stems.push(stamp(stalk, tip.phase, 0))
    const m = new THREE.Matrix4().compose(
      hang,
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, rng.range(0, Math.PI * 2)),
      new THREE.Vector3(1, 1, 1).multiplyScalar(rng.range(0.85, 1.15)),
    )
    // Ripe ones hang on alternating tips so the two states are interleaved.
    place(i % 2 === 1 && ctx.ripeFruits.length < ripe ? ctx.ripeFruits : ctx.fruits, template, m, tip.phase, rng.jitter(1))
  }
}

/** A rhizome or tuber cluster breaking the soil line — turmeric, ginger. */
function attachRhizome(ctx: BuildContext) {
  const rhizome = ctx.spec.rhizome
  if (!rhizome) return
  const { rng, q } = ctx
  const lobes = q.density > 0.6 ? 5 : 3
  const template = new THREE.IcosahedronGeometry(rhizome.size * 0.42, q.radial > 4 ? 1 : 0)
  for (let i = 0; i < lobes; i++) {
    const a = i * GOLDEN_ANGLE
    const reach = rhizome.size * rng.range(0.35, 0.85)
    const at = new THREE.Vector3(Math.cos(a) * reach, -rhizome.size * 0.12 + rng.jitter(0.01), Math.sin(a) * reach)
    const m = new THREE.Matrix4().compose(
      at,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.jitter(0.5), a, rng.jitter(0.4))),
      new THREE.Vector3(rng.range(0.8, 1.3), rng.range(0.6, 0.9), rng.range(0.8, 1.2)),
    )
    place(ctx.rhizomes, template, m, 0, rng.jitter(1))
  }
  template.dispose()
}

/* --------------------------- archetypes --------------------------- */

function growByArchetype(ctx: BuildContext) {
  const { spec, rng, q } = ctx
  const origin = new THREE.Vector3()

  switch (spec.archetype) {
    case 'rosette': {
      attachBasalLeaves(ctx, origin, 1)
      // A short thick crown holds the rosette together.
      const crown = buildTube(
        [new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0, spec.height * 0.08, 0)],
        spec.stem.radius * 1.6,
        spec.stem.radius,
        q.radial,
        2,
      )
      ctx.stems.push(stamp(crown, 0, 0))
      if (spec.flower) {
        const stalkTop = new THREE.Vector3(rng.jitter(0.03), spec.height * 1.15, rng.jitter(0.03))
        const stalk = buildTube(
          [origin, new THREE.Vector3(0, spec.height * 0.6, 0), stalkTop],
          spec.stem.radius * 0.7,
          spec.stem.radius * 0.4,
          q.radial,
          q.steps,
        )
        ctx.stems.push(stamp(stalk, 1.2, 0))
        ctx.tips.push({ point: stalkTop, dir: new THREE.Vector3(0, 1, 0), phase: 1.2 })
      }
      break
    }

    case 'aquatic': {
      /* Nelumbo's habit, and the whole reason it is not a rosette: a rhizome
       * buried in the mud sends up unbranched stalks one at a time, each
       * carrying a single peltate blade held clear of the water, with the
       * flower scapes standing higher again. Sitting the leaves flat on the
       * crown made it a water lily, which is the one plant a lotus is always
       * being told apart from. */
      const leaf = spec.leaf
      const pads = Math.max(3, Math.round((leaf.density ?? 6) * q.density))
      // The youngest blades have not made the surface yet and still float.
      const floaters = Math.max(1, Math.round(pads * 0.3))

      const stalk = (foot: THREE.Vector3, top: THREE.Vector3, thick: number, phase: number) => {
        // A lotus stalk leaves the mud upright and only leans out near the top.
        const knee = foot.clone().lerp(top, 0.6)
        knee.x = foot.x + (top.x - foot.x) * 0.25
        knee.z = foot.z + (top.z - foot.z) * 0.25
        const tube = buildTube([foot, knee, top], spec.stem.radius * thick, spec.stem.radius * thick * 0.72, q.radial, q.steps)
        ctx.stems.push(stamp(tube, phase, 0))
      }

      for (let i = 0; i < pads; i++) {
        const a = i * GOLDEN_ANGLE + rng.jitter(0.35)
        const floating = i < floaters
        const reach = spec.height * (floating ? rng.range(0.16, 0.36) : rng.range(0.08, 0.3))
        const lift = floating ? spec.height * rng.range(0.015, 0.05) : spec.height * rng.range(0.42, 1)
        // They come off a rhizome spread through the mud, so they break the
        // surface well apart rather than in one bundle.
        const foot = new THREE.Vector3(Math.cos(a) * reach * 0.5, -0.03, Math.sin(a) * reach * 0.5)
        const top = new THREE.Vector3(Math.cos(a) * reach, lift, Math.sin(a) * reach)
        stalk(foot, top, 0.95, i * 0.7)

        if (ctx.budget-- > 0) {
          /* A raised pad is a parasol tipped a few degrees off level; a
           * floating one lies right down on the water. */
          const tilt = floating ? rng.range(0.02, 0.07) : rng.range(0.09, 0.28)
          const az = rng.range(0, Math.PI * 2)
          const dir = new THREE.Vector3(Math.cos(az), tilt, Math.sin(az)).normalize()
          const scale = (floating ? rng.range(0.6, 0.82) : rng.range(0.86, 1.16)) * ctx.leafScale
          const m = new THREE.Matrix4().compose(top, orientTo(dir), new THREE.Vector3(scale, scale, scale))
          place(ctx.foliage, ctx.leafTemplate, m, i * 0.7, rng.jitter(1))
          ctx.radius = Math.max(ctx.radius, reach + leaf.width * 0.5 * scale)
        }
      }

      if (spec.flower) {
        // One scape per bloom — `attachFlowers` takes them in order.
        const scapes = Math.max(1, Math.round(spec.flower.count * q.density))
        for (let i = 0; i < scapes; i++) {
          const a = i * GOLDEN_ANGLE + Math.PI * 0.4 + rng.jitter(0.4)
          const reach = spec.height * rng.range(0.1, 0.28)
          // The flower stands above the leaves. That is how a lotus reads at a
          // distance, and it is the thing a water lily never does.
          const lift = spec.height * rng.range(1.02, 1.3)
          const foot = new THREE.Vector3(Math.cos(a) * reach * 0.5, -0.03, Math.sin(a) * reach * 0.5)
          const top = new THREE.Vector3(Math.cos(a) * reach, lift, Math.sin(a) * reach)
          stalk(foot, top, 0.8, 2.4 + i)
          ctx.tips.push({
            point: top,
            dir: new THREE.Vector3(rng.jitter(0.1), 1, rng.jitter(0.1)).normalize(),
            phase: 2.4 + i,
          })
        }
      }
      break
    }

    case 'grass': {
      attachBasalLeaves(ctx, origin, 0.55)
      const clump = buildTube(
        [new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0, spec.height * 0.12, 0)],
        spec.stem.radius * 3,
        spec.stem.radius * 1.6,
        q.radial,
        2,
      )
      ctx.stems.push(stamp(clump, 0, 0))
      break
    }

    case 'creeper': {
      const runners = Math.max(3, Math.round(spec.branching.count * q.density))
      for (let i = 0; i < runners; i++) {
        const a = i * GOLDEN_ANGLE + rng.jitter(0.3)
        const dir = new THREE.Vector3(Math.cos(a), 0.28, Math.sin(a)).normalize()
        growAxis(ctx, origin, dir, spec.height * 2.1, spec.stem.radius, 0, i * 0.8)
      }
      if (spec.leaf.arrangement === 'basal') attachPetiolateLeaves(ctx)
      break
    }

    case 'climber': {
      growHelix(ctx)
      break
    }

    case 'tree': {
      growAxis(ctx, origin, new THREE.Vector3(rng.jitter(0.05), 1, rng.jitter(0.05)), spec.height * 0.5, spec.stem.radius, 0, 0)
      break
    }

    default: {
      if (spec.archetype === 'herb' && spec.leaf.arrangement === 'basal') {
        // Zingiberaceae habit: leaves sheath a short pseudostem, and the
        // inflorescence pushes up through the middle of it.
        const sheath = spec.height * 0.42
        const trunk = buildTube(
          [new THREE.Vector3(0, -0.03, 0), new THREE.Vector3(0, sheath * 0.5, 0), new THREE.Vector3(0, sheath, 0)],
          spec.stem.radius * 1.8,
          spec.stem.radius * 0.9,
          q.radial,
          4,
        )
        ctx.stems.push(stamp(trunk, 0, 0))
        attachBasalLeaves(ctx, new THREE.Vector3(0, sheath * 0.18, 0), 0.7, sheath * 0.7)
        if (spec.flower) {
          const top = new THREE.Vector3(rng.jitter(0.01), sheath * 1.06, rng.jitter(0.01))
          ctx.tips.push({ point: top, dir: new THREE.Vector3(0, 1, 0), phase: 0.8 })
        }
        break
      }

      // Herbs and shrubs: one or a few stems from the crown.
      const crowns = spec.archetype === 'shrub' ? Math.max(2, Math.round(2 + q.density)) : 1
      for (let i = 0; i < crowns; i++) {
        const a = i * GOLDEN_ANGLE
        const lean = crowns > 1 ? 0.22 : 0.05
        const dir = new THREE.Vector3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize()
        growAxis(ctx, origin, dir, spec.height * (crowns > 1 ? 0.72 : 0.85), spec.stem.radius, 0, i * 1.1)
      }
      if (spec.leaf.arrangement === 'basal') attachBasalLeaves(ctx, origin, 0.75)
      break
    }
  }
}

/** Leaves lifted on their own upright stalks from a creeping runner. */
function attachPetiolateLeaves(ctx: BuildContext) {
  const { spec, rng, q } = ctx
  const nodes = Math.max(6, Math.round((spec.leaf.density ?? 6) * q.density * 3.4))
  for (let i = 0; i < nodes; i++) {
    if (ctx.budget-- <= 0) return
    const a = i * GOLDEN_ANGLE
    const reach = spec.height * rng.range(0.6, 2.4)
    const foot = new THREE.Vector3(Math.cos(a) * reach, 0.005, Math.sin(a) * reach)
    const top = foot.clone().add(new THREE.Vector3(rng.jitter(0.02), spec.height * rng.range(0.7, 1.15), rng.jitter(0.02)))
    const petiole = buildTube([foot, top], spec.stem.radius * 0.7, spec.stem.radius * 0.5, 3, 3)
    ctx.stems.push(stamp(petiole, i * 0.6, 0))
    const dir = new THREE.Vector3(rng.jitter(0.35), 1, rng.jitter(0.35)).normalize()
    const scale = rng.range(0.85, 1.15)
    const m = new THREE.Matrix4().compose(top, orientTo(dir), new THREE.Vector3(scale, scale, scale))
    place(ctx.foliage, ctx.leafTemplate, m, i * 0.6, rng.jitter(1))
    ctx.radius = Math.max(ctx.radius, reach)
  }
}

/** A twining stem winding up a garden stake, with leaves facing outward. */
function growHelix(ctx: BuildContext) {
  const { spec, rng, q } = ctx
  const turns = 2.6
  const coil = spec.height * 0.11
  const samples = Math.max(14, Math.round(q.steps * 3))
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const angle = t * turns * Math.PI * 2
    const r = coil * (1 - t * 0.25)
    points.push(new THREE.Vector3(Math.cos(angle) * r, t * spec.height, Math.sin(angle) * r))
  }
  ctx.radius = Math.max(ctx.radius, coil * 1.4)

  const stake = new THREE.CylinderGeometry(spec.stem.radius * 0.7, spec.stem.radius * 0.8, spec.height * 1.05, 5, 1)
  stake.translate(0, spec.height * 0.52, 0)
  ctx.stems.push(stamp(stake, 0, -0.6))

  const vine = buildTube(points, spec.stem.radius, spec.stem.radius * 0.6, q.radial, samples)
  ctx.stems.push(stamp(vine, 0.4, 0))

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
  attachLeaves(ctx, curve, 0, 0.4)
  ctx.tips.push({ point: curve.getPointAt(1), dir: curve.getTangentAt(1), phase: 0.4 })

  // A couple of side shoots reaching away from the stake.
  const shoots = Math.max(1, Math.round(spec.branching.count * 0.5 * q.density))
  for (let i = 0; i < shoots; i++) {
    const at = THREE.MathUtils.clamp(0.35 + i * 0.28 + rng.jitter(0.08), 0.2, 0.92)
    const base = curve.getPointAt(at)
    const outward = new THREE.Vector3(base.x, 0, base.z).normalize()
    const dir = outward.multiplyScalar(0.8).add(new THREE.Vector3(0, 0.55, 0)).normalize()
    growAxis(ctx, base, dir, spec.height * 0.36, spec.stem.radius * 0.6, 1, 1.4 + i)
  }
}

/* ---------------------------- entrypoint ---------------------------- */

const cache = new Map<string, PlantGeometrySet>()

export function buildPlantGeometry(
  id: string,
  spec: PlantModelSpec,
  detail: Detail = 'high',
): PlantGeometrySet {
  const key = `${id}:${detail}`
  const hit = cache.get(key)
  if (hit) return hit

  const q = QUALITY[detail]
  const rng = makeRng(hashSeed(id))
  const ctx: BuildContext = {
    spec,
    rng,
    q,
    stems: [],
    foliage: [],
    petals: [],
    cores: [],
    fruits: [],
    ripeFruits: [],
    rhizomes: [],
    leafTemplate: buildLeafUnit(spec.leaf, { rows: q.rows, cols: q.cols, leafletScale: q.leafletScale }),
    floretPetal: null,
    floretCore: null,
    fruitTemplate: null,
    tips: [],
    radius: spec.height * 0.12,
    budget: BUDGET[detail],
    leafScale: leafDensityScale(spec, q, BUDGET[detail]),
  }

  buildFloretTemplates(ctx)
  growByArchetype(ctx)
  attachFlowers(ctx)
  attachFruit(ctx)
  attachRhizome(ctx)

  ctx.leafTemplate.dispose()
  ctx.floretPetal?.dispose()
  ctx.floretCore?.dispose()
  ctx.fruitTemplate?.dispose()

  const set: PlantGeometrySet = {
    stem: mergeOrNull(ctx.stems),
    foliage: mergeOrNull(ctx.foliage),
    petal: mergeOrNull(ctx.petals),
    core: mergeOrNull(ctx.cores),
    fruit: mergeOrNull(ctx.fruits),
    ripeFruit: mergeOrNull(ctx.ripeFruits),
    rhizome: mergeOrNull(ctx.rhizomes),
    height: spec.height,
    radius: ctx.radius,
    bounds: new THREE.Box3(),
  }

  const parts = [set.stem, set.foliage, set.petal, set.core, set.fruit, set.ripeFruit, set.rhizome]
  for (const g of parts) {
    if (!g) continue
    if (!g.attributes.normal) g.computeVertexNormals()
    g.computeBoundingBox()
    if (g.boundingBox) set.bounds.union(g.boundingBox)
  }
  if (set.bounds.isEmpty()) set.bounds.set(new THREE.Vector3(-0.1, 0, -0.1), new THREE.Vector3(0.1, spec.height, 0.1))
  set.radius = Math.max(
    ctx.radius,
    Math.max(Math.abs(set.bounds.min.x), set.bounds.max.x, Math.abs(set.bounds.min.z), set.bounds.max.z),
  )

  cache.set(key, set)
  return set
}

/**
 * How high the plant actually reaches, in its own units.
 *
 * Not `spec.height`, which is the nominal size the generator is *aiming*
 * at and which the finished geometry misses in both directions: a tree's
 * crown closes around half way up its nominal height once branching and
 * taper have had their say (babul asks for 3.4 and tops out at 1.8),
 * while a lotus, an aloe or a creeping mandukaparni overshoots it. Reads
 * straight off the cached build, so callers pay nothing for asking.
 */
export function plantTopY(id: string, spec: PlantModelSpec, detail: Detail = 'high'): number {
  return buildPlantGeometry(id, spec, detail).bounds.max.y
}

/** Frees every cached build — used when the whole 3D layer unmounts. */
export function disposePlantCache() {
  for (const set of cache.values()) {
    for (const g of [set.stem, set.foliage, set.petal, set.core, set.fruit, set.ripeFruit, set.rhizome]) g?.dispose()
  }
  cache.clear()
}
