import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BED_RADIUS, gardenBeds, plantById, type GardenBed } from '../data/plants'
import type { Plant } from '../types/plant'
import { PlantObject } from './PlantObject'
import { tickWind } from './materials'
import { GARDEN_EXTENT, gardenFloorTexture } from './gardenTexture'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildLeafGeometry } from './procedural/leaf'
import { plantTopY, type Detail } from './procedural/plant'
import { hashSeed, makeRng } from './procedural/rng'
import { useDetail, dprFor } from '../hooks/useDetail'
import { useGarden } from '../store/useGarden'
import { daylightAt } from './daylight'
import { WalkControls } from './WalkControls'

/* ------------------------------------------------------------------ *
 * The garden: six themed beds arranged around a central plaza, every
 * plant generated at run time. Camera focus is damped rather than
 * cut, so moving between beds reads as walking, not teleporting.
 * ------------------------------------------------------------------ */

export interface Placement {
  plant: Plant
  bed: GardenBed
  position: [number, number, number]
  spin: number
  scale: number
}

/** Lays each bed out as a ring with the tallest specimen at the back. */
export function useGardenLayout(): Placement[] {
  return useMemo(() => {
    const placements: Placement[] = []
    for (const bed of gardenBeds) {
      const rng = makeRng(hashSeed(bed.id))
      const members = bed.plantIds
        .map((id) => plantById.get(id))
        .filter((p): p is Plant => Boolean(p))
        .sort((a, b) => b.model.height - a.model.height)

      members.forEach((plant, i) => {
        // Tallest goes to the middle-back; the rest fan out toward the path.
        const angle =
          i === 0 ? Math.PI * 1.5 : Math.PI * 0.5 + ((i - 0.5) / (members.length - 1) - 0.5) * Math.PI * 1.25
        const ring = i === 0 ? BED_RADIUS * 0.34 : BED_RADIUS * 0.62
        const x = bed.position[0] + Math.cos(angle) * ring + rng.jitter(0.16)
        const z = bed.position[1] + Math.sin(angle) * ring + rng.jitter(0.16)
        // Everything is nudged up for presence, and ground-hugging creepers
        // get a further lift so they stay legible beside a young tree.
        const scale = 1.5 * THREE.MathUtils.clamp(0.5 / plant.model.height, 1, 2.9)
        placements.push({
          plant,
          bed,
          position: [x, 0, z],
          spin: rng.range(0, Math.PI * 2),
          scale,
        })
      })
    }
    return placements
  }, [])
}

function WindClock({ strength }: { strength: number }) {
  useFrame(({ clock }) => tickWind(clock.elapsedTime, strength))
  return null
}

/* --------------------------- camera rig --------------------------- */

export interface CameraGoal {
  target: [number, number, number]
  distance: number
  /** Height of the eye above the target, as a fraction of distance. */
  lift?: number
  /** Compass bearing in radians; undefined keeps the current bearing. */
  bearing?: number
  /** Multiplies the approach rate. Below 1 gives a slow cinematic glide. */
  speed?: number
}

/* The eye sits low enough to put a band of sky above the horizon. At the
 * old lift of 0.38 the top of the frame landed within a fraction of a
 * degree of the horizon line, which is why the sky read as one flat wash
 * however the gradient was tuned. */
export const OVERVIEW: CameraGoal = { target: [0, 1.1, 0], distance: 24, lift: 0.27, bearing: Math.PI * 0.5 }

function CameraRig({
  goal,
  controls,
  idleSpin,
}: {
  goal: CameraGoal
  controls: React.RefObject<OrbitControlsImpl | null>
  idleSpin: boolean
}) {
  const { camera, size } = useThree()
  const desiredTarget = useRef(new THREE.Vector3(...OVERVIEW.target))
  const flyTo = useRef<THREE.Vector3 | null>(null)
  const approach = useRef(1)
  // A portrait viewport sees far less of the garden at a given distance.
  const aspect = size.width / Math.max(1, size.height)
  const reachScale = THREE.MathUtils.clamp(1.5 / Math.max(0.35, aspect), 1, 2.1)

  useEffect(() => {
    desiredTarget.current.set(...goal.target)

    // Aim from the plaza outward so the visitor always faces the bed.
    const outward = new THREE.Vector2(goal.target[0], goal.target[2])
    const bearing =
      goal.bearing ?? (outward.lengthSq() > 0.5 ? Math.atan2(outward.y, outward.x) : Math.PI * 0.5)
    const lift = goal.lift ?? 0.42
    const reach = goal.distance * reachScale
    const eye = new THREE.Vector3(
      goal.target[0] + Math.cos(bearing) * reach,
      goal.target[1] + reach * lift,
      goal.target[2] + Math.sin(bearing) * reach,
    )
    // The frame loop eases toward this rather than cutting to it.
    approach.current = goal.speed ?? 1
    flyTo.current = eye
  }, [goal, reachScale])

  useFrame((_, delta) => {
    const ctrl = controls.current
    if (!ctrl) return
    const destination = flyTo.current
    const rate = 2.6 * approach.current
    if (destination) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, destination.x, rate, delta)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, destination.y, rate, delta)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, destination.z, rate, delta)
      if (camera.position.distanceToSquared(destination) < 0.004) flyTo.current = null
    }
    const targetRate = 3 * approach.current
    ctrl.target.x = THREE.MathUtils.damp(ctrl.target.x, desiredTarget.current.x, targetRate, delta)
    ctrl.target.y = THREE.MathUtils.damp(ctrl.target.y, desiredTarget.current.y, targetRate, delta)
    ctrl.target.z = THREE.MathUtils.damp(ctrl.target.z, desiredTarget.current.z, targetRate, delta)
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      autoRotate={idleSpin}
      autoRotateSpeed={0.18}
      minDistance={1.6}
      maxDistance={34}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.47}
    />
  )
}

/* ---------------------------- scenery ---------------------------- */

/**
 * The sky.
 *
 * A flat background colour reads as empty paper rather than air, so the
 * scene sits inside a dome shaded from a deep zenith down to a paler,
 * warmer horizon. The dome rides with the camera, which means it can be
 * small enough never to meet the far clip plane.
 *
 * The gradient is a 2×96 canvas rather than a shader: a basic material
 * gets colour management and `toneMapped` handled for it, and 96 pixels
 * cost nothing to repaint when the hour changes.
 */
export function SkyDome({ zenith, horizon }: { zenith: string; horizon: string }) {
  const mesh = useRef<THREE.Mesh>(null)

  const { texture, paint } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    // The dome is a solid of revolution: one column of pixels is enough,
    // but it needs to be a tall one — the whole visible ramp lives in a few
    // per cent of the texture's height.
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping

    // Mixed here rather than with CSS color-mix(): an unparseable colour
    // stop throws, and canvas support for CSS Color 5 is not universal.
    const blend = new THREE.Color()
    const paintGradient = (top: string, bottom: string) => {
      const mid = `#${blend.set(top).lerp(new THREE.Color(bottom), 0.55).getHexString()}`
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
      // The dome's equator is the horizon, at half height. The camera looks
      // slightly down at the garden, so only a shallow band above the equator
      // is ever on screen — the whole zenith-to-horizon ramp has to happen
      // inside it, or the sky renders as one flat horizon colour.
      // Half height is the horizon; one unit of height is 180° of arc. The
      // camera only ever sees the first ~6° above the horizon, so the ramp
      // is squeezed into roughly that: 0.478 here is about 8° up.
      grad.addColorStop(0, top)
      grad.addColorStop(0.462, top)
      grad.addColorStop(0.486, mid)
      grad.addColorStop(0.4985, bottom)
      grad.addColorStop(1, bottom)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      tex.needsUpdate = true
    }

    return { texture: tex, paint: paintGradient }
  }, [])

  useEffect(() => {
    paint(zenith, horizon)
  }, [zenith, horizon, paint])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position)
  })

  return (
    <mesh ref={mesh} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[60, 32, 20]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * The land beyond the garden.
 *
 * This used to be one flat plane in the sky colour, which is why the
 * garden looked like an island floating in an empty white field: three
 * quarters of the frame was ground pretending to be sky. It is now a
 * radial ramp — open country near the beds, dissolving into the same
 * haze the fog and the horizon use, so the eye reads distance instead
 * of emptiness.
 */
function GroundHaze({ land, haze, nightness }: { land: string; haze: string; nightness: number }) {
  const { texture, paint } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace

    const paintRamp = (near: string, far: string) => {
      const c = canvas.width / 2
      // The plane is 110 across, so half-width is 55 world units. Country
      // holds out to ~35, then gives way to haze by the plane's edge.
      const grad = ctx.createRadialGradient(c, c, c * 0.24, c, c, c)
      grad.addColorStop(0, near)
      grad.addColorStop(0.64, near)
      grad.addColorStop(1, far)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Outside the inscribed circle a radial gradient leaves its end colour,
      // which is what we want at the corners anyway.
      tex.needsUpdate = true
    }

    return { texture: tex, paint: paintRamp }
  }, [])

  // The bounce colour already is "what the ground looks like at this hour",
  // lifted toward the haze so the far country reads as distance. This plane
  // is unlit, so it also has to be dimmed by hand after dusk — otherwise the
  // far field glows brighter than the garden standing in front of it.
  const near = useMemo(() => {
    const c = new THREE.Color(land).lerp(new THREE.Color(haze), 0.32)
    c.multiplyScalar(1 - nightness * 0.5)
    return `#${c.getHexString()}`
  }, [land, haze, nightness])

  useEffect(() => {
    paint(near, haze)
  }, [near, haze, paint])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
      <planeGeometry args={[110, 110, 1, 1]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function Ground({
  dark,
  horizon,
  land,
  nightness,
}: {
  dark: boolean
  horizon: string
  land: string
  nightness: number
}) {
  const texture = useMemo(() => gardenFloorTexture(dark), [dark])
  return (
    <group>
      <GroundHaze land={land} haze={horizon} nightness={nightness} />
      {/* The lit, textured plan fades its alpha out into the haze above, so
          the join stays invisible however the light changes. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[GARDEN_EXTENT * 2, GARDEN_EXTENT * 2, 1, 1]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Raised stone kerb and soil for each themed bed. */
function BedPlinths({ dark }: { dark: boolean }) {
  return (
    <group>
      {gardenBeds.map((bed) => (
        <group key={bed.id} position={[bed.position[0], 0, bed.position[1]]}>
          <mesh position={[0, 0.055, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[BED_RADIUS, BED_RADIUS + 0.06, 0.11, 40, 1]} />
            <meshStandardMaterial color={dark ? '#4d5044' : '#b3a98c'} roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.115, 0]} receiveShadow>
            <cylinderGeometry args={[BED_RADIUS - 0.13, BED_RADIUS - 0.13, 0.02, 36, 1]} />
            <meshStandardMaterial color={dark ? '#3a2e1f' : '#5f4a31'} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * The fountain at the centre of the plaza.
 *
 * Turned rather than stacked: the basin and the upper dish are each one
 * profile revolved about the axis, the way a real one is cut on a lathe,
 * so the lip and the inner slope belong to the same surface instead of
 * being cylinders balanced on each other. Eight jets arc from the finial
 * into the basin, droplets run along them, and rings spread where they
 * land. Water is the only thing here that moves, so all of it stops when
 * the visitor has asked for calm.
 * ------------------------------------------------------------------ */

/** Basin profile, [radius, height], swept about Y. */
const BASIN_PROFILE: [number, number][] = [
  [0, 0.06],
  [0.98, 0.06],
  [1.02, 0.11],
  [1.06, 0.4],
  [1.2, 0.45],
  [1.24, 0.4],
  [1.22, 0.1],
  [1.18, 0.06],
]

/** The upper dish the jets fall past, same treatment. */
const DISH_PROFILE: [number, number][] = [
  [0, 0.92],
  [0.34, 0.95],
  [0.42, 1.0],
  [0.47, 1.07],
  [0.43, 1.02],
  [0.35, 0.96],
  [0, 0.93],
]

const JET_COUNT = 8
const JET_REACH = 0.78
const DROPLETS = 72
const RIPPLES = 3
/** Where the basin water sits — the jets have to land on it. */
const BASIN_WATER_Y = 0.37

/** One jet: up out of the finial, over, and down into the basin. */
function jetCurve(i: number): THREE.QuadraticBezierCurve3 {
  const a = (Math.PI * 2 * i) / JET_COUNT
  const cx = Math.cos(a)
  const cz = Math.sin(a)
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 1.29, 0),
    new THREE.Vector3(cx * JET_REACH * 0.5, 1.63, cz * JET_REACH * 0.5),
    new THREE.Vector3(cx * JET_REACH, BASIN_WATER_Y + 0.01, cz * JET_REACH),
  )
}

function Fountain({ dark, calm }: { dark: boolean; calm: boolean }) {
  const stone = dark ? '#616754' : '#b6ad92'
  const stoneDeep = dark ? '#555b49' : '#a89f83'
  const water = dark ? '#2d6070' : '#68a8bd'

  const basinPoints = useMemo(() => BASIN_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), [])
  const dishPoints = useMemo(() => DISH_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), [])
  const curves = useMemo(() => Array.from({ length: JET_COUNT }, (_, i) => jetCurve(i)), [])

  /* Droplets are carried by the jets rather than falling on their own:
   * each one holds a jet and a position along it, and simply advances. */
  const drops = useMemo(() => {
    const rng = makeRng(hashSeed('fountain-drops'))
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPLETS * 3), 3))
    return {
      geo,
      jet: Array.from({ length: DROPLETS }, (_, i) => i % JET_COUNT),
      t: Array.from({ length: DROPLETS }, () => rng.range(0, 1)),
      speed: Array.from({ length: DROPLETS }, () => rng.range(0.42, 0.62)),
    }
  }, [])

  useEffect(() => () => drops.geo.dispose(), [drops])

  const ripples = useRef<(THREE.Mesh | null)[]>([])
  const scratch = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    if (calm) return

    const pos = drops.geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < DROPLETS; i++) {
      drops.t[i] = (drops.t[i] + delta * drops.speed[i]) % 1
      curves[drops.jet[i]].getPoint(drops.t[i], scratch)
      pos.setXYZ(i, scratch.x, scratch.y, scratch.z)
    }
    pos.needsUpdate = true

    for (let i = 0; i < RIPPLES; i++) {
      const ring = ripples.current[i]
      if (!ring) continue
      const material = ring.material as THREE.MeshBasicMaterial
      // Each ring is the same ring, a third of a cycle apart.
      const phase = ((ring.userData.phase as number) + delta * 0.42) % 1
      ring.userData.phase = phase
      ring.scale.setScalar(0.35 + phase * 2.4)
      material.opacity = 0.3 * (1 - phase)
    }
  })

  return (
    <group>
      {/* Basin and dish are lathes, whose normals point inward over part of
          the sweep; opaque stone reads correctly either way once both
          sides are drawn. */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[basinPoints, 48]} />
        <meshStandardMaterial color={stone} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>

      {/* The pool the jets land in. A CircleGeometry is born in the XY
          plane facing +Z, so it has to be laid down flat. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASIN_WATER_Y, 0]}>
        <circleGeometry args={[1.02, 40]} />
        <meshStandardMaterial
          color={water}
          roughness={0.06}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Rings spreading from where the jets strike. */}
      {!calm &&
        Array.from({ length: RIPPLES }, (_, i) => (
          <mesh
            key={i}
            ref={(node) => {
              ripples.current[i] = node
              if (node) node.userData.phase = i / RIPPLES
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, BASIN_WATER_Y + 0.004, 0]}
          >
            <ringGeometry args={[0.3, 0.335, 40]} />
            <meshBasicMaterial color={water} transparent opacity={0.22} depthWrite={false} />
          </mesh>
        ))}

      {/* Pedestal, collar, dish, finial. */}
      <mesh position={[0, 0.64, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.17, 0.58, 20, 1]} />
        <meshStandardMaterial color={stoneDeep} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <torusGeometry args={[0.13, 0.032, 8, 24]} />
        <meshStandardMaterial color={stone} roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[dishPoints, 40]} />
        <meshStandardMaterial color={stone} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.015, 0]}>
        <circleGeometry args={[0.4, 28]} />
        <meshStandardMaterial color={water} roughness={0.06} metalness={0.3} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 0.2, 12, 1]} />
        <meshStandardMaterial color={stoneDeep} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.068, 16, 12]} />
        <meshStandardMaterial color={stone} roughness={0.7} />
      </mesh>

      {/* The jets themselves — thin, and lit rather than shaded, so they
          stay legible against the stone at every hour. */}
      {curves.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 22, 0.017, 6, false]} />
          <meshBasicMaterial color={water} transparent opacity={0.42} depthWrite={false} />
        </mesh>
      ))}

      {!calm && (
        <points geometry={drops.geo}>
          <pointsMaterial
            color={water}
            size={0.035}
            sizeAttenuation
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  )
}

/** The plaza at the crossing of the paths, with the fountain at its centre. */
function Plaza({ dark, calm }: { dark: boolean; calm: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[3.1, 3.15, 0.06, 48, 1]} />
        <meshStandardMaterial color={dark ? '#565b4b' : '#c8c0a6'} roughness={0.85} />
      </mesh>
      <Fountain dark={dark} calm={calm} />
    </group>
  )
}

/** One grass blade: wide at the base, pointed at the tip, arching over. */
function bladeGeometry(width: number, height: number, bend: number): THREE.BufferGeometry {
  const segments = 3
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const halfWidth = width * (1 - t * 0.92) * 0.5
    const y = t * height
    const z = bend * height * t * t
    positions.push(-halfWidth, y, z, halfWidth, y, z)
    uvs.push(0, t, 1, t)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    // Both windings, so the blade is visible from either side while still
    // rendering as a front face — a DoubleSide material would flip the
    // normal on the far side and turn the tuft black.
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    indices.push(a + 1, a + 2, a, a + 3, a + 2, a + 1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  // Blades take the ground's normal rather than their own. A vertical card lit
  // by its true normal goes almost black; this is the standard foliage trick,
  // and it makes the tufts read as part of the lawn instead of objects on it.
  const upward = new Float32Array(positions.length)
  for (let i = 1; i < upward.length; i += 3) upward[i] = 1
  geo.setAttribute('normal', new THREE.BufferAttribute(upward, 3))
  return geo
}

/** A tuft of three crossed blades — the lawn's grass. */
function tuftGeometry(width: number, height: number): THREE.BufferGeometry {
  const blade = bladeGeometry(width, height, 0.35)
  const parts = [blade, blade.clone().rotateY(Math.PI / 3), blade.clone().rotateY(-Math.PI / 3)]
  const tuft = mergeGeometries(parts, false)!
  parts.forEach((part) => part.dispose())
  return tuft
}

/** A small leafy rosette — bed filler that reads as planting, not grass. */
function sproutGeometry(): THREE.BufferGeometry {
  const leaf = buildLeafGeometry({
    shape: 'ovate',
    length: 0.15,
    width: 0.082,
    droop: 0.42,
    curl: 0.35,
    rows: 3,
    cols: 2,
  })
  const golden = Math.PI * (3 - Math.sqrt(5))
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 6; i++) {
    const angle = i * golden
    const lean = 0.55 + (i / 6) * 0.6
    const dir = new THREE.Vector3(Math.cos(angle) * lean, 0.72, Math.sin(angle) * lean).normalize()
    const g = leaf.clone()
    g.applyMatrix4(
      new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
      ),
    )
    parts.push(g)
  }
  leaf.dispose()
  const sprout = mergeGeometries(parts, false)!
  parts.forEach((part) => part.dispose())

  // Half-way to the same trick: keep enough of the real normal to show form,
  // but lift it toward the sky so the filler does not read as dark clutter.
  const normals = sprout.attributes.normal
  const up = new THREE.Vector3(0, 1, 0)
  const n = new THREE.Vector3()
  for (let i = 0; i < normals.count; i++) {
    n.fromBufferAttribute(normals, i).lerp(up, 0.55).normalize()
    normals.setXYZ(i, n.x, n.y, n.z)
  }
  normals.needsUpdate = true
  return sprout
}

/**
 * Low planting that fills the soil between specimens. A real herb bed is
 * dense; without this the beds read as bare earth with a few twigs in it.
 */
function BedUndergrowth({ dark, perBed }: { dark: boolean; perBed: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => sproutGeometry(), [])
  const total = perBed * gardenBeds.length
  const placements = useGardenLayout()

  useEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const rng = makeRng(90210)
    const matrix = new THREE.Matrix4()
    const colour = new THREE.Color()
    const tint = new THREE.Color()
    let placed = 0

    for (const bed of gardenBeds) {
      tint.set(bed.accent)
      const occupied = placements.filter((p) => p.bed.id === bed.id)
      let attempts = 0
      let inBed = 0
      while (inBed < perBed && attempts < perBed * 10) {
        attempts++
        const angle = rng.next() * Math.PI * 2
        const radius = Math.sqrt(rng.next()) * (BED_RADIUS - 0.3)
        const x = bed.position[0] + Math.cos(angle) * radius
        const z = bed.position[1] + Math.sin(angle) * radius
        // Leave breathing room around each specimen.
        if (occupied.some((o) => Math.hypot(x - o.position[0], z - o.position[2]) < 0.34)) continue

        const scale = rng.range(0.55, 1.25)
        matrix.compose(
          new THREE.Vector3(x, 0.13, z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, Math.PI)),
          new THREE.Vector3(scale, scale * rng.range(0.7, 1.3), scale),
        )
        instanced.setMatrixAt(placed, matrix)
        // Brightness variation, nudged a little toward the bed's theme colour.
        const shade = rng.range(0.78, 1.15)
        colour.setRGB(shade, shade, shade).lerp(tint, 0.14)
        instanced.setColorAt(placed, colour)
        placed++
        inBed++
      }
    }
    instanced.count = placed
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  }, [dark, perBed, placements])

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, total]} frustumCulled={false}>
      <meshStandardMaterial color={dark ? '#3f6740' : '#5f9a52'} side={THREE.DoubleSide} roughness={1} />
    </instancedMesh>
  )
}

/** Scattered tufts of grass, drawn as one instanced mesh. */
function GrassTufts({ count, dark }: { count: number; dark: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => tuftGeometry(0.07, 0.095), [])

  useEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const rng = makeRng(4242)
    const matrix = new THREE.Matrix4()
    const colour = new THREE.Color()
    let placed = 0
    let guard = 0

    while (placed < count && guard < count * 12) {
      guard++
      const angle = rng.next() * Math.PI * 2
      const radius = 3.4 + rng.next() * (GARDEN_EXTENT - 4.6)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      // Keep the walkways and beds clear.
      if (Math.abs(radius - 10.6) < 0.7) continue
      if (gardenBeds.some((b) => Math.hypot(x - b.position[0], z - b.position[1]) < BED_RADIUS + 0.5)) continue

      const scale = rng.range(0.6, 1.0)
      matrix.compose(
        new THREE.Vector3(x, 0, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, Math.PI)),
        new THREE.Vector3(scale, scale * rng.range(0.8, 1.4), scale),
      )
      instanced.setMatrixAt(placed, matrix)
      // The material carries the colour; instances only shift its brightness,
      // so the lawn still looks right even where instance colour is unsupported.
      const shade = rng.range(0.82, 1.12)
      colour.setRGB(shade, shade * rng.range(0.97, 1.04), shade * 0.97)
      instanced.setColorAt(placed, colour)
      placed++
    }
    instanced.count = placed
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  }, [count, dark])

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color={dark ? '#3b5a3a' : '#6f9150'} roughness={1} />
    </instancedMesh>
  )
}

/* --------------------------- night pieces --------------------------- */

/** Keeps tone-mapping exposure in step with the hour. */
function Exposure({ value }: { value: number }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMappingExposure = value
  }, [gl, value])
  return null
}

/**
 * Fireflies. Cheap on purpose: one points cloud, positions jittered on
 * the CPU once, and a shader-free sine drift applied to the whole cloud
 * so there is nothing per-particle to update each frame.
 */
function Fireflies({ count, strength }: { count: number; strength: number }) {
  const points = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const rng = makeRng(hashSeed('fireflies'))
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = rng.range(0, Math.PI * 2)
      const radius = rng.range(2, GARDEN_EXTENT * 0.46)
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = rng.range(0.25, 1.95)
      positions[i * 3 + 2] = Math.sin(angle) * radius
      phases[i] = rng.range(0, Math.PI * 2)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const node = points.current
    if (!node) return
    const t = clock.elapsedTime
    node.position.y = Math.sin(t * 0.55) * 0.22
    node.rotation.y = t * 0.02
    const material = node.material as THREE.PointsMaterial
    material.opacity = strength * (0.55 + Math.sin(t * 1.6) * 0.18)
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.13}
        sizeAttenuation
        color="#ffe9a3"
        transparent
        opacity={strength * 0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ---------------------------- the scene ---------------------------- */

interface GardenSceneProps {
  goal: CameraGoal
  selectedId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onSelectBed: (bed: GardenBed) => void
  idleSpin: boolean
  showLabels: boolean
  /** 0 = before dawn, 0.5 = noon, 1 = night. */
  timeOfDay: number
  /** First person: pointer lock and WASD in place of the orbit camera.
   *  Off by default — a guided tour drives the camera itself. */
  walking?: boolean
  /** Pointer lock ended — by Esc, by alt-tab, or by the browser's choice. */
  onWalkExit?: () => void
  /** Clicked on nothing while walking: put whatever is open away. */
  onWalkDismiss?: () => void
}

function SceneContents({
  goal,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onSelectBed,
  idleSpin,
  showLabels,
  timeOfDay,
  walking = false,
  onWalkExit,
  onWalkDismiss,
  detail,
}: GardenSceneProps & { detail: Detail }) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const placements = useGardenLayout()
  const reducedMotion = useGarden((s) => s.reducedMotion)
  const shadows = detail !== 'low'
  // Everything about the light — sky, sun, fog, whether it is dark enough
  // for fireflies — comes off one clock value.
  const light = daylightAt(timeOfDay)
  const dark = light.dark

  return (
    <>
      <color attach="background" args={[light.sky]} />
      <fog attach="fog" args={[light.sky, 42, 86]} />
      <SkyDome zenith={light.zenith} horizon={light.sky} />
      <Exposure value={light.exposure} />

      <WindClock strength={reducedMotion ? 0 : 1} />

      <hemisphereLight args={[light.hemi, light.bounce, light.ambient]} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sunIntensity}
        color={light.sun}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={40}
        shadow-bias={-0.0015}
      />
      <directionalLight position={[-8, 6, -9]} intensity={0.55 + light.nightness * 0.2} color={light.bounce} />

      {light.nightness > 0.05 && !reducedMotion && (
        <Fireflies count={detail === 'low' ? 60 : 150} strength={light.nightness} />
      )}

      <Ground dark={dark} horizon={light.sky} land={light.bounce} nightness={light.nightness} />
      <Plaza dark={dark} calm={reducedMotion} />
      <BedPlinths dark={dark} />
      <GrassTufts count={detail === 'low' ? 1100 : 2400} dark={dark} />
      <BedUndergrowth dark={dark} perBed={detail === 'low' ? 26 : 44} />

      <Suspense fallback={null}>
        {placements.map(({ plant, position, spin, scale }) => (
          <group key={plant.id} position={[position[0], 0.13, position[2]]}>
            <PlantObject
              plant={plant}
              detail={detail}
              spin={spin}
              scale={scale}
              grow
              showSoil={false}
              castShadow={shadows}
              highlight={hoveredId === plant.id || selectedId === plant.id}
              /* On foot there is no cursor to hover with, and the crosshair
                 does the picking instead. Dropping the handlers takes these
                 meshes out of the raycast entirely, so the two schemes never
                 disagree about what is under the middle of the screen. */
              onPointerOver={
                walking
                  ? undefined
                  : (e) => {
                      ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
                      onHover(plant.id)
                      document.body.style.cursor = 'pointer'
                    }
              }
              onPointerOut={
                walking
                  ? undefined
                  : () => {
                      onHover(null)
                      document.body.style.cursor = ''
                    }
              }
              onClick={
                walking
                  ? undefined
                  : (e) => {
                      ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
                      onSelect(plant.id)
                    }
              }
            />
            {/* The label sits on the plant's real crown, not its nominal
                height — the two are far enough apart on a tree to leave it
                hanging in clear sky above the canopy. */}
            {(hoveredId === plant.id || selectedId === plant.id) && (
              <Html
                position={[0, plantTopY(plant.id, plant.model, detail) * scale + 0.22, 0]}
                center
                zIndexRange={[15, 0]}
              >
                <span
                  className="pointer-events-none -translate-y-2 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-white shadow-lg"
                  style={{ background: plant.accent }}
                >
                  {plant.name}
                </span>
              </Html>
            )}
          </group>
        ))}
      </Suspense>

      {showLabels &&
        gardenBeds.map((bed) => (
          <Html
            key={bed.id}
            position={[bed.position[0], 1.05, bed.position[1] + BED_RADIUS + 0.55]}
            center
            zIndexRange={[10, 0]}
          >
            <button
              onClick={() => onSelectBed(bed)}
              className="rounded-full border border-white/25 px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap text-white/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
              style={{ background: `${bed.accent}dd` }}
            >
              {bed.name}
            </button>
          </Html>
        ))}

      {/* One camera scheme at a time. Unmounting the rig is what makes the
          handover clean — two sets of controls both claiming the camera
          fight each other every frame. Coming back, the rig mounts fresh and
          its own effect glides the view home to whatever goal is current. */}
      {walking && onWalkExit ? (
        <WalkControls
          placements={placements}
          onExit={onWalkExit}
          onAim={onHover}
          onSelect={onSelect}
          onDismiss={onWalkDismiss}
        />
      ) : (
        <CameraRig goal={goal} controls={controls} idleSpin={idleSpin} />
      )}
    </>
  )
}

export function GardenScene(props: GardenSceneProps) {
  const detail = useDetail('garden')

  return (
    <Canvas
      shadows={detail !== 'low'}
      dpr={dprFor(detail)}
      gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.1, far: 90, position: [0, 11, 18] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
      /* On foot the crosshair owns what is aimed at, and nothing in the scene
         carries pointer handlers, so every click would "miss" and wipe the
         aim the moment you tried to act on it. */
      onPointerMissed={props.walking ? undefined : () => props.onHover(null)}
    >
      <SceneContents {...props} detail={detail} />
    </Canvas>
  )
}
