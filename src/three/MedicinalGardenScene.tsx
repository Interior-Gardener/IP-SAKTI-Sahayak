import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, useTexture } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BED_PLOTS, GARDEN, POND_PLANT, plotPlants, type GardenBedPlot } from '../data/medicinalGarden'
import { PlantObject } from './PlantObject'
import { SkyDome } from './GardenScene'
import { plantById } from '../data/plants'
import { tickWind, windUniforms } from './materials'
import { daylightAt } from './daylight'
import { useDetail, dprFor } from '../hooks/useDetail'
import { buildLotusBloom, plantTopY, type Detail } from './procedural/plant'
import { buildLeafGeometry } from './procedural/leaf'
import { useGarden } from '../store/useGarden'
import { makeRng, hashSeed } from './procedural/rng'
import { WalkControls, type Obstacle } from './WalkControls'
import type { Plant } from '../types/plant'
import { asset } from '../lib/asset'

/* ------------------------------------------------------------------ *
 * The medicinal garden.
 *
 * The layout comes from the garden's plan (see data/medicinalGarden), and
 * everything you see on top of it comes from the photographs taken on
 * site: red lateritic soil, brick kerbs standing a hand's width proud,
 * an asphalt spine with a painted kerb line, the white label boards on
 * black posts, a clipped boundary hedge, the lily pond, and the
 * transmission pylons overhead.
 *
 * The plants themselves are the same procedural specimens the main
 * garden grows — this is a different place, not a different botany.
 * ------------------------------------------------------------------ */

const SOIL = '#7d5638'
const SOIL_DARK = '#3a2418'
const PATH = '#4a4744'
const PATH_DARK = '#23211f'
const GRAVEL = '#9a9080'
const KERB = '#8d5b45'
const HEDGE = '#3f6b3a'

/* The photographed dedication board by the gate. Its own pixels are
 * 949 x 1658, and the plate is sized from that ratio so the print is
 * never stretched — height first, because the board's height against a
 * standing visitor is the thing that has to look right. */
export const PLAQUE_ART = asset('/cards/medicinal-garden-entry-board.png')
/** The scan's own pixel grid, which everything drawn from it is sized by. */
export const PLAQUE_ART_W = 949
export const PLAQUE_ART_H = 1658
const PLAQUE_ASPECT = PLAQUE_ART_W / PLAQUE_ART_H
const PLAQUE_H = 1.34
const PLAQUE_W = PLAQUE_H * PLAQUE_ASPECT
/** Clear of the ground, the way the real one sits on its footing. */
const PLAQUE_LIFT = 0.06

/**
 * The plaque's slab, held here so the label boards can be hidden behind
 * it.
 *
 * A board's label is DOM, not geometry: it is composited over the canvas
 * and so has no idea what is in front of it, which is why the print of a
 * board standing behind the plaque came through the plaque. Handing the
 * slab to those labels lets them test the one thing that is ever big
 * enough and near enough to stand in front of them. Nothing else in the
 * garden is, so nothing else is checked.
 *
 * There is one plaque, so one handle rather than a context.
 */
const plaqueOccluder: RefObject<THREE.Object3D | null> = { current: null }
const HEDGE_DARK = '#1b2d1a'

/**
 * A fine speckle, tiled across the lawn and the soil.
 *
 * Neither surface is a painted slab in the photographs — laterite is
 * grainy and blotchy where it has been turned over, and mown grass is
 * never one flat green — but a plain coloured plane is exactly what a
 * slab looks like. One 512px canvas, generated once and tinted by each
 * material's own colour, breaks both of them up for a single texture
 * fetch. The speckle is drawn near-white so it multiplies into whatever
 * colour it is laid under.
 */
let noiseCache: THREE.CanvasTexture | null = null
function groundNoise(): THREE.CanvasTexture {
  if (noiseCache) return noiseCache
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rng = makeRng(hashSeed('vanaspatyam-grain'))

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Wraps every mark round the edges, so the tile joins itself invisibly.
  const stamp = (draw: (dx: number, dy: number) => void, x: number, y: number, r: number) => {
    for (const ox of x < r ? [0, size] : x > size - r ? [0, -size] : [0]) {
      for (const oy of y < r ? [0, size] : y > size - r ? [0, -size] : [0]) draw(ox, oy)
    }
  }

  /**
   * Broad mottling: damp patches and worn ground.
   *
   * Every mark fades to nothing at its rim. A hard-edged ellipse reads as a
   * drawn circle rather than a patch of damp, and once the tile repeats you
   * see a lattice of them — which is exactly what the first cut of this did.
   * Small, faint and numerous beats large, dark and few for the same reason.
   */
  for (let i = 0; i < 260; i++) {
    const x = rng.next() * size
    const y = rng.next() * size
    const r = rng.range(10, 38)
    const dark = rng.next() > 0.45
    const alpha = rng.range(0.018, 0.055)
    stamp(
      (dx, dy) => {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
        const rgb = dark ? '0, 0, 0' : '255, 255, 255'
        g.addColorStop(0, `rgba(${rgb}, ${alpha})`)
        g.addColorStop(0.55, `rgba(${rgb}, ${alpha * 0.55})`)
        g.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2)
      },
      x,
      y,
      r,
    )
  }

  // Grain: grit in the soil, blade shadow in the turf.
  for (let i = 0; i < 22000; i++) {
    const x = rng.next() * size
    const y = rng.next() * size
    const w = rng.range(1, 3.4)
    ctx.globalAlpha = rng.range(0.05, 0.18)
    ctx.fillStyle = rng.next() > 0.45 ? '#000000' : '#ffffff'
    stamp((dx, dy) => ctx.fillRect(x + dx, y + dy, w, rng.range(1, 2.2)), x, y, 4)
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  noiseCache = texture
  return texture
}

/**
 * The grain above, repeated once per `tile` metres over a surface. Clones
 * share the one canvas; `seed` slides each surface to its own corner of
 * the tile so two beds of the same size don't come out identically dug.
 */
function useGrain(width: number, depth: number, tile = 1.6, seed = ''): THREE.Texture {
  return useMemo(() => {
    const texture = groundNoise().clone()
    texture.needsUpdate = true
    texture.repeat.set(width / tile, depth / tile)
    if (seed) {
      const rng = makeRng(hashSeed(`grain-${seed}`))
      texture.offset.set(rng.next(), rng.next())
    }
    return texture
  }, [width, depth, tile, seed])
}

function WindClock({ strength }: { strength: number }) {
  useFrame(({ clock }) => tickWind(clock.elapsedTime, strength))
  return null
}

/**
 * The weedy scatter that keeps the beds from reading as slabs of clay.
 *
 * One instanced mesh for the lot. Each instance is a tuft of three blades,
 * tapered to a point and arching over under their own weight, rather than
 * the flat card a quad gives you — a vertical card lit by its own normal
 * goes dark and reads as a painted stick, which is what the first version
 * of this looked like. The blades take the ground's normal, carry a
 * root-to-tip gradient in their vertex colours, and lean off vertical by a
 * random few degrees, so no two tufts catch the light the same way.
 */
function bladeGeometry(width: number, height: number, bend: number): THREE.BufferGeometry {
  const segments = 3
  const positions: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Wide at the sheath, drawn to a point: the taper is most of what
    // separates a blade of grass from a lolly stick.
    const halfWidth = width * (1 - t * 0.9) * 0.5
    const y = t * height
    const z = bend * height * t * t
    positions.push(-halfWidth, y, z, halfWidth, y, z)
    uvs.push(0, t, 1, t)
    // Shaded at the root where the tuft closes over itself, sun-bleached
    // and a shade yellower at the tip.
    const shade = 0.5 + t * 0.62
    colors.push(shade, shade, shade * 0.94, shade, shade, shade * 0.94)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    // Both windings, so a blade is lit from either side without needing a
    // DoubleSide material to flip its normal and black out the far face.
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    indices.push(a + 1, a + 2, a, a + 3, a + 2, a + 1)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setIndex(indices)
  // Blades borrow the ground's up-normal — the standard foliage trick, and
  // the reason the tufts sit in the light instead of on top of it.
  const upward = new Float32Array(positions.length)
  for (let i = 1; i < upward.length; i += 3) upward[i] = 1
  geo.setAttribute('normal', new THREE.BufferAttribute(upward, 3))
  return geo
}

/** A tuft: three blades of unequal height, splayed and arching apart. */
function tuftGeometry(): THREE.BufferGeometry {
  const rng = makeRng(hashSeed('vanaspatyam-tuft'))
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 3; i++) {
    const blade = bladeGeometry(0.028, rng.range(0.15, 0.26), rng.range(0.3, 0.75))
    // Splayed out of the crown, each one leaning its own way.
    blade.rotateX(rng.range(-0.18, 0.18))
    blade.rotateZ(rng.range(-0.22, 0.22))
    blade.rotateY((i / 3) * Math.PI * 2 + rng.range(-0.5, 0.5))
    blade.translate(rng.jitter(0.012), 0, rng.jitter(0.012))
    parts.push(blade)
  }
  const tuft = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())
  return tuft ?? new THREE.BufferGeometry()
}

/** Grass that moves: the same wind clock the plants run on. */
function weedMaterial(color: string): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 1,
    metalness: 0,
    vertexColors: true,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime
    shader.uniforms.uWind = windUniforms.uWind
    shader.vertexShader = ('uniform float uTime;\nuniform float uWind;\n' + shader.vertexShader).replace(
      '#include <begin_vertex>',
      [
        '#include <begin_vertex>',
        'float bladeH = max(transformed.y, 0.0);',
        // Every tuft keeps its own phase, taken from where it stands, so the
        // patch ripples instead of swinging as one body.
        'float phase = instanceMatrix[3].x * 1.9 + instanceMatrix[3].z * 1.3;',
        'float amp = uWind * (0.012 * bladeH + 0.24 * bladeH * bladeH);',
        'transformed.x += sin(uTime * 1.7 + phase) * amp;',
        'transformed.z += cos(uTime * 1.25 + phase * 1.4) * amp * 0.7;',
      ].join('\n'),
    )
  }
  material.customProgramCacheKey = () => 'medicinal-garden-weed'
  return material
}

function Weeds({ dark, detail }: { dark: boolean; detail: Detail }) {
  const geometry = useMemo(() => tuftGeometry(), [])
  const material = useMemo(() => weedMaterial(dark ? '#2c4526' : '#63853f'), [dark])
  useEffect(() => () => material.dispose(), [material])
  const count = detail === 'low' ? 900 : detail === 'medium' ? 2000 : 3400
  const mesh = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const target = mesh.current
    if (!target) return
    const rng = makeRng(hashSeed('vanaspatyam-weeds'))
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const tint = new THREE.Color()

    // Weeds come up in patches, not on a grid: pick a crown and let a
    // handful of tufts crowd around it.
    let placed = 0
    while (placed < count) {
      const clump = 3 + Math.floor(rng.next() * 5)
      // Two thirds of the patches go on the beds, the rest on the trodden
      // margins between them, where the growth is shorter and drier.
      const onBed = rng.next() < 0.66
      let cx: number
      let cz: number
      if (onBed) {
        const plot = BED_PLOTS[Math.floor(rng.next() * BED_PLOTS.length)]
        cx = plot.x + rng.range(-plot.halfX, plot.halfX) * 0.94
        cz = plot.z + rng.range(-plot.halfZ, plot.halfZ) * 0.94
      } else {
        cx = rng.range(-GARDEN.innerX, GARDEN.innerX)
        cz = rng.range(GARDEN.northZ, GARDEN.southZ)
        // Keep the spine walkable-looking rather than overgrown.
        if (Math.abs(cx) < GARDEN.spineHalfWidth + 0.2) cx += Math.sign(cx || 1) * 1.4
      }
      const spread = rng.range(0.18, 0.55)

      for (let j = 0; j < clump && placed < count; j++, placed++) {
        const x = cx + rng.jitter(spread)
        const z = cz + rng.jitter(spread)
        // Sit on whichever surface is underneath: the beds stand a little
        // proud of the ground they are cut into.
        const y = onBed ? 0.031 : 0.002
        // Height falls off toward the edge of the patch, so a clump has a
        // crown rather than a flat top.
        const near = 1 - Math.min(1, Math.hypot(x - cx, z - cz) / (spread * 2.2))
        const h = rng.range(0.6, 1.15) * (onBed ? 1.15 : 0.85) * (0.7 + near * 0.45)
        euler.set(rng.jitter(0.16), rng.range(0, Math.PI * 2), rng.jitter(0.16))
        q.setFromEuler(euler)
        scale.set(rng.range(0.8, 1.25), h, rng.range(0.8, 1.25))
        pos.set(x, y, z)
        m.compose(pos, q, scale)
        target.setMatrixAt(placed, m)
        // Some of it is green and some has gone over to straw — a working
        // garden in the dry season is never one flat colour.
        const dry = rng.next() < 0.28 ? rng.range(0.35, 0.9) : 0
        const shade = rng.range(0.82, 1.15)
        tint.setRGB(shade * (1 + dry * 0.55), shade * (1 + dry * 0.22), shade * (1 - dry * 0.35))
        target.setColorAt(placed, tint)
      }
    }
    target.count = placed
    target.instanceMatrix.needsUpdate = true
    if (target.instanceColor) target.instanceColor.needsUpdate = true
    // `material` is a dependency because swapping it rebuilds the mesh
    // itself: without this the night material would come back empty.
  }, [count, geometry, material])

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, count]}
      frustumCulled={false}
      receiveShadow
    />
  )
}

/** Ground: mown grass over the whole plot, with the beds cut into it. */
function Ground({ dark }: { dark: boolean }) {
  const width = GARDEN.width + 14
  const depth = GARDEN.length + 14
  const grain = useGrain(width, depth, 3.4)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={grain} color={dark ? '#22301f' : '#6f8a4e'} roughness={1} />
    </mesh>
  )
}

/**
 * The paths. The spine is asphalt with a painted kerb line down one edge —
 * the white pipe running beside it in every photograph — and the cross
 * paths and pond ring are the same gravelled earth as the bed margins.
 */
function Paths({ dark }: { dark: boolean }) {
  const { pond } = GARDEN
  const spineNorth = pond.z + pond.radius + pond.ringWidth
  const crossZs = useMemo(() => {
    const out: number[] = []
    for (const plot of BED_PLOTS) {
      const z = plot.z + plot.halfZ + GARDEN.crossWidth / 2
      if (!out.some((v) => Math.abs(v - z) < 0.05)) out.push(z)
    }
    return out
  }, [])

  return (
    <group>
      {/* Central spine: gate to the pond's walking ring, which is where it
          ends on the plan rather than running on into the hedge. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, (GARDEN.gate.z + spineNorth) / 2]} receiveShadow>
        <planeGeometry args={[GARDEN.spineHalfWidth * 2, GARDEN.gate.z - spineNorth]} />
        <meshStandardMaterial color={dark ? PATH_DARK : PATH} roughness={0.95} />
      </mesh>
      {/* The painted line along its west edge — the white pipe that runs
          beside the path in every photograph of the place. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-GARDEN.spineHalfWidth - 0.06, 0.025, (GARDEN.gate.z + spineNorth) / 2]}
      >
        <planeGeometry args={[0.09, GARDEN.gate.z - spineNorth]} />
        <meshStandardMaterial color={dark ? '#5c6360' : '#d8d4c6'} roughness={0.9} />
      </mesh>

      {crossZs.map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, z]} receiveShadow>
          <planeGeometry args={[GARDEN.innerX * 2, GARDEN.crossWidth]} />
          <meshStandardMaterial color={dark ? '#2a2822' : GRAVEL} roughness={1} />
        </mesh>
      ))}

      {/* The walking ring around the pond. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pond.x, 0.014, pond.z]} receiveShadow>
        <ringGeometry args={[pond.radius, pond.radius + pond.ringWidth, 64]} />
        <meshStandardMaterial color={dark ? '#2a2822' : GRAVEL} roughness={1} />
      </mesh>

      {/* Paved apron inside the gate. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, GARDEN.apron.z]} receiveShadow>
        <planeGeometry args={[3.2, GARDEN.apron.depth]} />
        <meshStandardMaterial color={dark ? '#3a3733' : '#8f8577'} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** A bed: bare red earth held in by a brick kerb a hand's width proud. */
function Bed({ plot, dark }: { plot: GardenBedPlot; dark: boolean }) {
  const t = 0.12
  const h = 0.16
  const tint = useMemo(() => {
    const rng = makeRng(hashSeed(`soil-${plot.id}`))
    return new THREE.Color(SOIL).offsetHSL(rng.jitter(0.012), rng.jitter(0.05), rng.jitter(0.035))
  }, [plot.id])
  // Turned earth is coarser than turf, so the grain sits closer together.
  const grain = useGrain(plot.halfX * 2, plot.halfZ * 2, 2.4, plot.id)
  return (
    <group position={[plot.x, 0, plot.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[plot.halfX * 2, plot.halfZ * 2]} />
        {/* Each bed is dug and weathered on its own, so no two are the same
            shade of laterite. */}
        <meshStandardMaterial map={grain} color={dark ? SOIL_DARK : tint} roughness={1} />
      </mesh>
      {([
        [0, plot.halfZ, plot.halfX * 2 + t, t],
        [0, -plot.halfZ, plot.halfX * 2 + t, t],
        [plot.halfX, 0, t, plot.halfZ * 2 + t],
        [-plot.halfX, 0, t, plot.halfZ * 2 + t],
      ] as const).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, h / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={dark ? '#3d271f' : KERB} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * What a board reports when the pointer is on it: which plant it names,
 * and where on screen to hang the printed card. Null means the pointer
 * has left every board.
 */
export type BoardRead = (plantId: string | null, clientX?: number, clientY?: number) => void

/**
 * The same, for the dedication plaque, which names no plant: whether the
 * pointer is on it, and where on screen to hang the reproduction.
 */
export type PlaqueRead = (on: boolean, clientX?: number, clientY?: number) => void

/**
 * The plaque stands in for a plant id wherever a board is identified —
 * hovering it, aiming at it on foot, and raising its card all run
 * through the bed boards' machinery rather than a second set of it.
 */
export const PLAQUE_BOARD_ID = '__plaque'

/**
 * The label board: a white plate raked back on a single black post, the
 * prop that makes the place recognisable more than any plant does.
 *
 * Reading one on the ground means walking up and squinting at the print,
 * so reading one here means holding the pointer on it: `onRead` fires
 * and the route raises the full board card over the scene.
 */
function LabelBoard({
  position,
  rotation,
  plant,
  dark,
  showText,
  onRead,
}: {
  position: [number, number, number]
  rotation: number
  plant: Plant
  dark: boolean
  showText: boolean
  onRead?: BoardRead
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.68, 6]} />
        <meshStandardMaterial color={dark ? '#15181a' : '#2b2f31'} roughness={0.7} metalness={0.3} />
      </mesh>
      <group position={[0, 0.72, 0]} rotation={[-Math.PI / 3.1, 0, 0]}>
        {/* The plate carries the pointer events for the whole board — the
            orange rule in front of it is taken out of the raycast below so
            crossing it cannot read as leaving the board. */}
        <mesh
          castShadow
          onPointerOver={
            onRead
              ? (e) => {
                  e.stopPropagation()
                  onRead(plant.id, e.clientX, e.clientY)
                }
              : undefined
          }
          onPointerMove={
            onRead
              ? (e) => {
                  e.stopPropagation()
                  onRead(plant.id, e.clientX, e.clientY)
                }
              : undefined
          }
          onPointerOut={onRead ? () => onRead(null) : undefined}
        >
          <boxGeometry args={[0.62, 0.42, 0.02]} />
          <meshStandardMaterial color={dark ? '#7d8288' : '#eceae2'} roughness={0.55} />
        </mesh>
        {/* The orange rule across every board on site. */}
        <mesh position={[0, -0.03, 0.012]} raycast={() => null}>
          <planeGeometry args={[0.62, 0.045]} />
          <meshStandardMaterial color="#e2762c" roughness={0.6} />
        </mesh>
        {showText && (
          <Html
            position={[0, 0.09, 0.014]}
            transform
            distanceFactor={2.6}
            zIndexRange={[8, 0]}
            /* Hidden outright when the plaque is between it and the camera —
               the label is not dimmed or blended, it is simply not drawn, so
               nothing about how it looks the rest of the time changes. */
            occlude={[plaqueOccluder as RefObject<THREE.Object3D>]}
            style={{ pointerEvents: 'none' }}
          >
            {/* The plate is 0.62 wide at distanceFactor 2.6, which works out at
                roughly 96 px of label — anything wider prints off the board, so
                long names wrap here rather than running over the edge. */}
            <div className="w-[96px] break-words px-1 text-center font-display leading-[1.1] text-stone-800">
              <div className="text-[7px] font-semibold">{plant.names.Sanskrit ?? plant.name}</div>
              <div className="text-[5.5px] italic">{plant.botanical}</div>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

/**
 * The tree line outside the hedge — the plan's perimeter vegetation, and
 * what closes the view in every photograph taken from inside. They are
 * ordinary compendium trees, grown large and set beyond the boundary, so
 * they cost nothing new to draw and nothing is clickable out there.
 */
/** Fixed at module load: the boundary is the same every visit. */
const PERIMETER_TREES: { plant: Plant; position: [number, number, number]; scale: number; spin: number }[] =
  (() => {
    const rng = makeRng(hashSeed('vanaspatyam-perimeter'))
    const species = ['neem', 'amla', 'arjuna', 'bael', 'sandalwood']
      .map((id) => plantById.get(id))
      .filter((p): p is Plant => Boolean(p))
    if (!species.length) return []

    const out: { plant: Plant; position: [number, number, number]; scale: number; spin: number }[] = []
    const x = GARDEN.innerX + 2.6
    const zN = GARDEN.northZ - 2.4
    const zS = GARDEN.southZ + 2.4
    const ring: [number, number][] = []
    for (let z = zN; z <= zS; z += 4.2) {
      ring.push([-x - rng.range(0, 1.6), z + rng.jitter(1.2)])
      ring.push([x + rng.range(0, 1.6), z + rng.jitter(1.2)])
    }
    for (let cx = -x; cx <= x; cx += 4.6) {
      ring.push([cx + rng.jitter(1.4), zN - rng.range(0.4, 2.2)])
    }
    ring.forEach(([px, pz], i) => {
      const plant = species[i % species.length]
      out.push({
        plant,
        position: [px, 0, pz],
        // Well beyond garden scale: these are mature trees, not specimens.
        scale: rng.range(2.4, 3.6),
        spin: rng.range(0, Math.PI * 2),
      })
    })
    return out
  })()

function PerimeterTrees({ detail, shadows }: { detail: Detail; shadows: boolean }) {
  return (
    <Suspense fallback={null}>
      {PERIMETER_TREES.map(({ plant, position, scale, spin }, i) => (
        <PlantObject
          key={i}
          plant={plant}
          // The boundary is never walked up to, so it is always cheap.
          detail={detail === 'high' ? 'medium' : 'low'}
          position={position}
          scale={scale}
          spin={spin}
          showSoil={false}
          castShadow={shadows}
        />
      ))}
    </Suspense>
  )
}

/** The clipped boundary hedge, dense enough to close the garden off. */
function Hedge({ dark }: { dark: boolean }) {
  const x = GARDEN.innerX + 1.1
  const zN = GARDEN.northZ - 1.1
  const zS = GARDEN.southZ + 1.1
  const height = 1.15
  const thick = 0.85
  const colour = dark ? HEDGE_DARK : HEDGE
  const gate = GARDEN.gate.halfWidth + 0.35
  const southRun = (x - gate) / 1
  return (
    <group>
      {([
        [0, zN, x * 2, thick],
        [-x, (zN + zS) / 2, thick, zS - zN],
        [x, (zN + zS) / 2, thick, zS - zN],
      ] as const).map(([cx, cz, w, d], i) => (
        <mesh key={i} position={[cx, height / 2, cz]} castShadow receiveShadow>
          <boxGeometry args={[w, height, d]} />
          <meshStandardMaterial color={colour} roughness={1} />
        </mesh>
      ))}
      {/* South side, broken either side of the gate. */}
      {[-1, 1].map((dir) => (
        <mesh
          key={dir}
          position={[dir * (gate + southRun / 2), height / 2, zS]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[southRun, height, thick]} />
          <meshStandardMaterial color={colour} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** The green double gate you come in through. */
function Gate({ dark }: { dark: boolean }) {
  const { halfWidth, z } = GARDEN.gate
  const frame = dark ? '#1e2a22' : '#3f5c44'
  return (
    <group position={[0, 0, z + 1.1]}>
      {[-1, 1].map((dir) => (
        <group key={dir} position={[dir * halfWidth, 0, 0]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.09, 1.5, 0.09]} />
            <meshStandardMaterial color={frame} roughness={0.8} metalness={0.35} />
          </mesh>
        </group>
      ))}
      {/* Both leaves, standing open against the hedge. */}
      {[-1, 1].map((dir) => (
        <group key={dir} position={[dir * halfWidth, 0, 0]} rotation={[0, dir * 1.15, 0]}>
          <mesh position={[dir * halfWidth * 0.5, 0.62, 0]} castShadow>
            <boxGeometry args={[halfWidth, 1.2, 0.05]} />
            <meshStandardMaterial
              color={frame}
              roughness={0.85}
              metalness={0.4}
              transparent
              opacity={0.55}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * The dedication plaque that stands beside the gate.
 *
 * This one is not drawn — it is the photograph of the real board,
 * frame and all, mapped onto the plate. That is what makes it read as
 * a thing standing in the garden rather than a caption floating in it:
 * it takes the scene's own light, it foreshortens as you walk past,
 * and from the side you see the slab it is printed on. The type on it
 * is the type on the real one, in both scripts, which no amount of
 * re-setting it in HTML would have matched.
 */
function Plaque({
  dark,
  onRead,
}: {
  dark: boolean
  /** Pointer on the plaque — the route raises the full board, as for a bed. */
  onRead?: PlaqueRead
}) {
  const { x, z, rotation } = GARDEN.plaque
  const art = useTexture(PLAQUE_ART)
  /* The scan is a colour photograph, so it has to be read as sRGB or the
   * cream ground comes out washed and the black frame flat grey. */
  useEffect(() => {
    art.colorSpace = THREE.SRGBColorSpace
    art.anisotropy = 8
    art.needsUpdate = true
  }, [art])

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* The slab behind the print: what you see edge-on, and what the
          print would otherwise have no thickness to sit on. */}
      <mesh ref={plaqueOccluder} position={[0, PLAQUE_H / 2 + PLAQUE_LIFT, 0]} castShadow receiveShadow>
        <boxGeometry args={[PLAQUE_W, PLAQUE_H, 0.075]} />
        <meshStandardMaterial color={dark ? '#0b0d0e' : '#17181a'} roughness={0.4} />
      </mesh>
      {/* The board itself, a hair proud of the slab on both faces so it is
          legible whichever side you come round. The front carries the
          pointer events for the whole plaque. */}
      {[1, -1].map((face) => (
        <mesh
          key={face}
          position={[0, PLAQUE_H / 2 + PLAQUE_LIFT, face * 0.039]}
          rotation={[0, face > 0 ? 0 : Math.PI, 0]}
          onPointerOver={
            onRead
              ? (e) => {
                  e.stopPropagation()
                  onRead(true, e.clientX, e.clientY)
                }
              : undefined
          }
          onPointerMove={
            onRead
              ? (e) => {
                  e.stopPropagation()
                  onRead(true, e.clientX, e.clientY)
                }
              : undefined
          }
          onPointerOut={onRead ? () => onRead(false) : undefined}
        >
          <planeGeometry args={[PLAQUE_W, PLAQUE_H]} />
          {/* Unlit-ish: the print is matt paper behind glass, and letting it
              go fully dark at dusk would lose the one sign that names the
              place. A little emissive keeps it readable without making it
              glow. */}
          <meshStandardMaterial
            map={art}
            roughness={0.62}
            metalness={0.05}
            emissiveMap={art}
            emissive="#ffffff"
            emissiveIntensity={dark ? 0.32 : 0.16}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Water lilies, the pond thick with them as the photographs show. */
/** Strips a part back to what a plain material needs, so parts built by
 * different generators can be merged into one buffer. */
function plainPart(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry()
  if (!geo.attributes.normal) geo.computeVertexNormals()
  out.setAttribute('position', geo.attributes.position)
  out.setAttribute('normal', geo.attributes.normal)
  out.setAttribute('uv', geo.attributes.uv)
  if (geo.index) out.setIndex(geo.index)
  return out
}

interface PondSurface {
  pads: THREE.BufferGeometry
  petals: THREE.BufferGeometry
  /** Receptacles and flower stalks — both green, so both in one buffer. */
  green: THREE.BufferGeometry
  /** The stamen collars. */
  gold: THREE.BufferGeometry | null
}

/**
 * Everything floating on the water, merged into one buffer per colour.
 *
 * The pads were flat discs and the flowers on them were pink cones, which is
 * what a lotus looks like from a hundred metres and nothing like one from the
 * path. They are now dished blades held at the middle, the way a lotus pad
 * sits, and real blooms at every stage of opening — some on the surface, some
 * lifted clear of it on their own stalk, which is the habit that separates a
 * lotus from the water lilies it shares the tank with.
 */
function pondSurface(radius: number, detail: Detail): PondSurface {
  const rng = makeRng(hashSeed('vanaspatyam-pond'))
  const count = detail === 'low' ? 70 : 150
  const fine = detail !== 'low'
  const padParts: THREE.BufferGeometry[] = []
  const petalParts: THREE.BufferGeometry[] = []
  const greenParts: THREE.BufferGeometry[] = []
  const goldParts: THREE.BufferGeometry[] = []

  for (let i = 0; i < count; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = Math.sqrt(rng.range(0, 1)) * (radius - 0.25)
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const s = rng.range(0.16, 0.32)
    // A quarter stay water lilies, cleft to the middle and lying flat; the
    // tank has both, and the notch is the quickest way to tell them apart.
    const lily = rng.range(0, 1) < 0.25

    let pad: THREE.BufferGeometry
    if (lily) {
      pad = new THREE.CircleGeometry(s, fine ? 12 : 8, 0.35, Math.PI * 1.86)
    } else {
      pad = buildLeafGeometry({
        shape: 'peltate',
        length: s * 2,
        width: s * 2,
        droop: 0.04,
        curl: 0.3,
        rows: fine ? 6 : 4,
        cols: fine ? 2 : 1,
      })
      // Built standing in the XY plane and held at one end; slide the hub back
      // to the origin before laying it down.
      pad.translate(0, -s, 0)
    }
    pad.rotateX(-Math.PI / 2)
    pad.rotateY(rng.range(0, Math.PI * 2))
    pad.translate(x, 0.075 + rng.range(0, 0.008), z)
    padParts.push(plainPart(pad))

    if (lily || rng.range(0, 1) > 0.2) continue

    const openness = rng.range(0, 1) < 0.32 ? rng.range(0, 0.2) : rng.range(0.55, 1)
    // Better than half stand on a stalk; the rest sit down on the water.
    const lift = rng.range(0, 1) < 0.6 ? rng.range(0.12, 0.34) : 0.015
    const bloom = buildLotusBloom({
      size: s * 0.4,
      petals: 18,
      openness,
      quality: fine ? 0.7 : 0.4,
    })
    const at = new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.08 + lift, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, Math.PI * 2)),
      new THREE.Vector3(1, 1, 1),
    )
    petalParts.push(plainPart(bloom.petals.applyMatrix4(at)))
    greenParts.push(plainPart(bloom.receptacle.applyMatrix4(at)))
    if (bloom.stamens) goldParts.push(plainPart(bloom.stamens.applyMatrix4(at)))
    if (lift > 0.05) {
      const stalk = new THREE.CylinderGeometry(0.008, 0.012, lift + 0.08, 5)
      stalk.translate(x, 0.04 + (lift + 0.08) * 0.5, z)
      greenParts.push(plainPart(stalk))
    }
  }

  const fold = (parts: THREE.BufferGeometry[]) => {
    if (parts.length === 0) return null
    const merged = mergeGeometries(parts, false)
    parts.forEach((part) => part.dispose())
    return merged
  }

  return {
    pads: fold(padParts) ?? new THREE.BufferGeometry(),
    petals: fold(petalParts) ?? new THREE.BufferGeometry(),
    green: fold(greenParts) ?? new THREE.BufferGeometry(),
    gold: fold(goldParts),
  }
}

function Pond({
  dark,
  detail,
  shadows,
  onSelect,
  onHover,
  walking,
}: {
  dark: boolean
  detail: Detail
  shadows: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  walking: boolean
}) {
  const { x, z, radius } = GARDEN.pond
  const lotus = plantById.get(POND_PLANT)
  /* The lotus stands in the water rather than in a bed, so it is placed
   * with the pond: a ring of them out from the middle, clear of the kerb. */
  const lotuses = useMemo(() => {
    if (!lotus) return []
    const rng = makeRng(hashSeed('vanaspatyam-lotus'))
    const count = detail === 'low' ? 5 : 9
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + rng.jitter(0.3)
      const r = rng.range(0.35, 0.78) * (radius - 0.5)
      return {
        position: [Math.cos(a) * r, 0.05, Math.sin(a) * r] as [number, number, number],
        spin: rng.range(0, Math.PI * 2),
        /* The aquatic habit already stands the flower scapes above the leaves,
         * so the old 1.05–1.5 put blooms nearly two metres over the water. */
        scale: rng.range(0.82, 1.16),
      }
    })
  }, [detail, radius, lotus])
  const surface = useMemo(() => pondSurface(radius, detail), [detail, radius])
  useEffect(
    () => () => {
      surface.pads.dispose()
      surface.petals.dispose()
      surface.green.dispose()
      surface.gold?.dispose()
    },
    [surface],
  )

  return (
    <group position={[x, 0, z]}>
      {/* Kerb ring holding the water in. */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius + 0.16, radius + 0.16, 0.18, 48, 1, true]} />
        <meshStandardMaterial color={dark ? '#2c2620' : '#7d7266'} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial
          color={dark ? '#101d22' : '#31504f'}
          roughness={0.12}
          metalness={0.4}
        />
      </mesh>
      {lotus &&
        lotuses.map((l, i) => (
          <PlantObject
            key={`lotus-${i}`}
            plant={lotus}
            detail={detail}
            position={l.position}
            spin={l.spin}
            scale={l.scale}
            grow
            showSoil={false}
            castShadow={shadows}
            onPointerOver={
              walking
                ? undefined
                : (e) => {
                    ;(e as unknown as { stopPropagation: () => void }).stopPropagation()
                    onHover(lotus.id)
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
                    onSelect(lotus.id)
                  }
            }
          />
        ))}
      <mesh geometry={surface.pads} receiveShadow>
        <meshStandardMaterial color={dark ? '#22391f' : '#4a8150'} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={surface.petals} castShadow={shadows}>
        <meshStandardMaterial color={dark ? '#8a4a68' : '#efabc8'} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={surface.green} castShadow={shadows}>
        <meshStandardMaterial color={dark ? '#2f5238' : '#6d9a5c'} roughness={0.72} />
      </mesh>
      {surface.gold && (
        <mesh geometry={surface.gold}>
          <meshStandardMaterial color={dark ? '#8d7638' : '#f2d264'} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

/**
 * A transmission pylon. Not scenery for its own sake — they stand over
 * the garden and give it a lived-in, landmark silhouette.
 *
 * Built as one merged mesh: four tapering legs, a rung at every level,
 * and an X of bracing across each of the four faces, which is what a
 * lattice tower actually is and what makes it read as one from a
 * distance rather than as a ladder.
 */
function pylonGeometry(height: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const LEVELS = 8
  const baseHalf = 1.5
  const topHalf = 0.3

  const halfAt = (t: number) => THREE.MathUtils.lerp(baseHalf, topHalf, Math.pow(t, 0.72))
  const corner = (level: number, i: number) => {
    const t = level / LEVELS
    const h = halfAt(t)
    const sx = i === 0 || i === 3 ? -1 : 1
    const sz = i < 2 ? -1 : 1
    return new THREE.Vector3(sx * h, t * height, sz * h)
  }

  /** One steel member, laid between two points. */
  const strut = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    if (len < 1e-4) return
    const geo = new THREE.CylinderGeometry(r, r, len, 4)
    geo.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
    )
    geo.translate(...new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5).toArray())
    parts.push(geo)
  }

  for (let level = 0; level < LEVELS; level++) {
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4
      const a0 = corner(level, i)
      const a1 = corner(level + 1, i)
      const b0 = corner(level, j)
      const b1 = corner(level + 1, j)
      // The leg itself, and the rung closing the top of this level.
      strut(a0, a1, 0.05)
      strut(a1, b1, 0.032)
      // The X across the face.
      strut(a0, b1, 0.026)
      strut(b0, a1, 0.026)
    }
  }

  // Cross-arms, and the insulator strings hanging off their tips.
  for (const [f, span] of [[0.62, 5.6], [0.78, 4.6], [0.93, 3.4]] as const) {
    const y = height * f
    strut(new THREE.Vector3(-span / 2, y, 0), new THREE.Vector3(span / 2, y, 0), 0.05)
    for (const dir of [-1, 1]) {
      const tip = new THREE.Vector3((dir * span) / 2, y, 0)
      strut(tip, new THREE.Vector3(dir * halfAt(f) * 0.6, y + 0.9, 0), 0.028)
      strut(tip, tip.clone().add(new THREE.Vector3(0, -0.9, 0)), 0.05)
    }
  }

  const merged = mergeGeometries(parts, false)
  for (const g of parts) g.dispose()
  return merged ?? new THREE.BufferGeometry()
}

function Pylon({ position, height = 17 }: { position: [number, number]; height?: number }) {
  const geometry = useMemo(() => pylonGeometry(height), [height])
  return (
    <mesh geometry={geometry} position={[position[0], 0, position[1]]} castShadow>
      <meshStandardMaterial color="#8b8578" roughness={0.72} metalness={0.55} />
    </mesh>
  )
}

/** The conductors, hanging in a catenary between two pylons. */
function Cables({ a, b, height }: { a: [number, number]; b: [number, number]; height: number }) {
  const lines = useMemo(() => {
    const out: THREE.Line[] = []
    for (const [f, spread] of [[0.66, 5.4], [0.8, 4.5], [0.94, 3.6]] as const) {
      for (const dir of [-1, 1]) {
        const pts: THREE.Vector3[] = []
        const y = height * f - 1
        for (let i = 0; i <= 16; i++) {
          const t = i / 16
          const sag = Math.sin(t * Math.PI) * 1.5
          pts.push(
            new THREE.Vector3(
              THREE.MathUtils.lerp(a[0], b[0], t) + (dir * spread) / 2,
              y - sag,
              THREE.MathUtils.lerp(a[1], b[1], t),
            ),
          )
        }
        out.push(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: '#3a3a38' }),
          ),
        )
      }
    }
    return out
  }, [a, b, height])
  return (
    <group>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  )
}

/** The transmission line, north-west to south-east across the site. */
const PYLONS: { at: [number, number]; height: number }[] = [
  { at: [-8.2, -8.6], height: 17 },
  { at: [4.4, -24], height: 16 },
  { at: [14, -38], height: 15 },
]

/* What the feet cannot walk through: every kerbed bed, the pond, and the
 * pylon standing in the garden. The hedge is the fence rather than an
 * obstacle. */
const WALK_OBSTACLES: Obstacle[] = [
  ...BED_PLOTS.map((plot) => ({
    kind: 'rect' as const,
    x: plot.x,
    z: plot.z,
    halfX: plot.halfX,
    halfZ: plot.halfZ,
  })),
  { x: GARDEN.pond.x, z: GARDEN.pond.z, r: GARDEN.pond.radius + 0.2 },
  { x: PYLONS[0].at[0], z: PYLONS[0].at[1], r: 1.5 },
]

/** Where a visitor is put down: on the spine, just inside the gate. */
const WALK_START: [number, number] = [0, GARDEN.gate.z - 1.4]

const WALK_BOUNDS = {
  kind: 'rect' as const,
  halfX: GARDEN.innerX + 0.5,
  halfZ: (GARDEN.southZ - GARDEN.northZ) / 2 + 0.5,
  // The garden runs from the gate at +Z to the pond at -Z, so its middle is
  // not the origin — clamping symmetrically would let you walk out through
  // the gate and stop you short of the pond.
  z: (GARDEN.southZ + GARDEN.northZ) / 2,
}

/**
 * How wide each habit grows compared with how tall it stands. Used to give
 * every species a footprint, so a bed is filled by the plant rather than by
 * whatever size the model happens to be.
 */
const SPREAD: Record<Plant['model']['archetype'], number> = {
  creeper: 1.8,
  /* An aloe is all leaf and no stem: the rosette throws its blades out
   * further than the plant stands tall, so it needs the widest allowance
   * here or it is planted at a size that hangs over the kerb. */
  rosette: 2.1,
  /* Not planted in a bed at all — the lotus stands in the pond — but the
   * table has to be total, and its pads reach about as far as a rosette's. */
  aquatic: 1.9,
  herb: 0.8,
  grass: 0.7,
  shrub: 0.9,
  climber: 0.8,
  tree: 0.7,
}

export interface MedicinalGardenSceneProps {
  selectedId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  timeOfDay: number
  walking?: boolean
  onWalkExit?: () => void
  onWalkDismiss?: () => void
  /** Pointer on a bed's label board — see `BoardRead`. */
  onBoardRead?: BoardRead
  /** Pointer on the dedication plaque — see `PlaqueRead`. */
  onPlaqueRead?: PlaqueRead
  /** Crosshair on a board while walking, or null. */
  onBoardAim?: (plantId: string | null) => void
  /** Board clicked while walking. */
  onBoardSelect?: (plantId: string) => void
}

function SceneContents({
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  timeOfDay,
  walking = false,
  onWalkExit,
  onWalkDismiss,
  onBoardRead,
  onPlaqueRead,
  onBoardAim,
  onBoardSelect,
  detail,
}: MedicinalGardenSceneProps & { detail: Detail }) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const reducedMotion = useGarden((s) => s.reducedMotion)
  const light = daylightAt(timeOfDay)
  const dark = light.dark
  const shadows = detail !== 'low'

  /* Every specimen, with where it stands. Plants are set out along the
   * length of their bed and scaled up the way the main garden does, so a
   * ground-hugging creeper still reads beside a young tree. */
  const specimens = useMemo(() => {
    const out: {
      plant: Plant
      /** Which copy within its patch — only used to key the mesh. */
      copy: number
      position: [number, number, number]
      spin: number
      scale: number
      plot: GardenBedPlot
    }[] = []
    for (const plot of BED_PLOTS) {
      const members = plotPlants(plot)
      const rng = makeRng(hashSeed(`vsp-${plot.id}`))
      members.forEach((plant, i) => {
        const share = members.length
        /* Each species gets a column of the bed running back from the path,
         * not a front-or-back band: the boards stand in a row along the bed's
         * edge, so the planting has to be split the same way round or the
         * board on the left names the plants on the right. */
        const bandHalfX = plot.halfX / share
        const bandX = plot.x + (share === 1 ? 0 : (i - 0.5) * bandHalfX * 2)

        /* How wide the thing grows, as a fraction of how tall it is. A bushy
         * creeper sprawls wider than it stands; a young tree does not. This
         * is what stops a mint from being planted on the same footprint as a
         * neem. */
        const spread = SPREAD[plant.model.archetype]
        // Aim each plant at a share of its column rather than at a fixed
        // size, then let the patch below make up whatever ground one plant of
        // it cannot cover.
        const target = Math.min(bandHalfX, plot.halfZ) * 1.1
        const scale = THREE.MathUtils.clamp(
          target / (plant.model.height * spread),
          0.8,
          2.4,
        )
        const footprint = plant.model.height * spread * scale

        /* A bed is planted in a drift, not with one specimen standing alone
         * in the middle of bare soil: a low herb fills its column with a
         * patch of itself, while anything already that size is planted once.
         * The patch runs deep rather than wide — rows back from the board, so
         * the drift reads as one species' column. Copies are capped because
         * every one of them is a few thousand leaf cards. */
        const cols = THREE.MathUtils.clamp(Math.round((bandHalfX * 2) / footprint), 1, 2)
        const rows = THREE.MathUtils.clamp(Math.round((plot.halfZ * 2) / footprint), 1, 3)
        // What the machine can afford: a full patch on a good one, a single
        // specimen on a weak one.
        const budget = detail === 'low' ? 1 : detail === 'medium' ? 3 : 6
        let planted = 0

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (planted >= budget) break
            planted++
            // Spread the grid across the column, then break it up — a
            // hand-set patch, not a plantation.
            const fx = cols === 1 ? 0 : (c / (cols - 1) - 0.5) * 2
            const fz = rows === 1 ? 0 : (r / (rows - 1) - 0.5) * 2
            out.push({
              plant,
              copy: r * cols + c,
              plot,
              position: [
                // Keep the whole footprint inside the kerb, jitter included.
                bandX + fx * Math.max(0, bandHalfX - footprint * 0.5 - 0.1) + rng.jitter(0.1),
                0.04,
                plot.z + fz * Math.max(0, plot.halfZ - footprint * 0.5 - 0.1) + rng.jitter(0.1),
              ],
              spin: rng.range(0, Math.PI * 2),
              scale: scale * rng.range(0.9, 1.1),
            })
          }
        }
      })
    }
    return out
  }, [detail])

  /* One board per species — a patch of six mint plants is still one thing
   * that needs naming — out on the bed's path edge rather than standing among
   * the plants, where a post would hide what it names. */
  const boards = useMemo(() => {
    const out: { plant: Plant; plotId: string; position: [number, number, number] }[] = []
    for (const plot of BED_PLOTS) {
      const members = plotPlants(plot)
      if (!members.length) continue
      // Each board stands at the mouth of its own species' column, so the
      // patch behind it is the one it names.
      const bandHalfX = plot.halfX / members.length
      members.forEach((plant, i) => {
        const centre =
          members.length === 1 ? plot.x : plot.x + (i - 0.5) * bandHalfX * 2
        out.push({
          plant,
          plotId: plot.id,
          position: [
            THREE.MathUtils.clamp(centre, plot.x - plot.halfX + 0.36, plot.x + plot.halfX - 0.36),
            0,
            plot.z + plot.halfZ + 0.42,
          ],
        })
      })
    }
    return out
  }, [])

  return (
    <>
      <color attach="background" args={[light.sky]} />
      <fog attach="fog" args={[light.sky, 40, 105]} />
      <SkyDome zenith={light.zenith} horizon={light.sky} />
      <WindClock strength={reducedMotion ? 0 : 1} />

      <hemisphereLight args={[light.hemi, light.bounce, light.ambient]} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sunIntensity}
        color={light.sun}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={60}
        shadow-bias={-0.0015}
      />
      <directionalLight position={[-10, 8, -12]} intensity={0.5} color={light.bounce} />

      <Ground dark={dark} />
      <Paths dark={dark} />
      <Weeds dark={dark} detail={detail} />
      <PerimeterTrees detail={detail} shadows={shadows} />
      <Hedge dark={dark} />
      <Gate dark={dark} />
      <Pond
        dark={dark}
        detail={detail}
        shadows={shadows}
        onSelect={onSelect}
        onHover={onHover}
        walking={walking}
      />
      {/* Its own boundary: the plaque waits on a photograph, and the rest
          of the garden should not wait with it. */}
      <Suspense fallback={null}>
        <Plaque dark={dark} onRead={walking ? undefined : onPlaqueRead} />
      </Suspense>

      {/* The line of towers that crosses the site. One stands in the open
          ground between the back rank and the pond, exactly as it does on
          the ground; the others march away north beyond the hedge. */}
      {PYLONS.map((tower, i) => (
        <Pylon key={i} position={tower.at} height={tower.height} />
      ))}
      <Cables a={PYLONS[0].at} b={PYLONS[1].at} height={PYLONS[0].height} />
      <Cables a={PYLONS[1].at} b={PYLONS[2].at} height={PYLONS[1].height} />

      {BED_PLOTS.map((plot) => (
        <Bed key={plot.id} plot={plot} dark={dark} />
      ))}

      <Suspense fallback={null}>
        {specimens.map(({ plant, copy, position, spin, scale, plot }) => (
          <group key={`${plot.id}-${plant.id}-${copy}`} position={position}>
            <PlantObject
              plant={plant}
              detail={detail}
              spin={spin}
              scale={scale}
              grow
              showSoil={false}
              castShadow={shadows}
              highlight={hoveredId === plant.id || selectedId === plant.id}
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
            {/* The plant's real crown, not its nominal height. See plantTopY. */}
            {(hoveredId === plant.id || selectedId === plant.id) && (
              <Html
                position={[0, plantTopY(plant.id, plant.model, detail) * scale + 0.3, 0]}
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

      {/* One board per plant, not per bed: a row of them along each bed's
          path edge, facing the walk. */}
      {boards.map(({ plant, plotId, position }) => (
        <LabelBoard
          key={`label-${plotId}-${plant.id}`}
          plant={plant}
          dark={dark}
          showText={detail !== 'low'}
          /* Walking locks the pointer away, so there is nothing to hover with. */
          onRead={walking ? undefined : onBoardRead}
          position={position}
          /* Facing +Z, which is back down the garden toward the gate — a
             board you read as you walk up to the plant, not after passing it. */
          rotation={0}
        />
      ))}

      {walking && onWalkExit ? (
        <WalkControls
          placements={specimens}
          onExit={onWalkExit}
          onAim={onHover}
          onSelect={onSelect}
          onDismiss={onWalkDismiss}
          /* The plaque aims and clicks exactly as a bed's board does, so on
             foot you read the garden's own name the same way you read a
             plant's. */
          boards={[
            ...boards.map(({ plant, position }) => ({ plantId: plant.id, position })),
            {
              plantId: PLAQUE_BOARD_ID,
              position: [GARDEN.plaque.x, PLAQUE_LIFT, GARDEN.plaque.z] as [number, number, number],
            },
          ]}
          onBoardAim={onBoardAim}
          onBoardSelect={onBoardSelect}
          obstacles={WALK_OBSTACLES}
          bounds={WALK_BOUNDS}
          start={WALK_START}
          /* The plan's cross paths are 1.4 m and the beds are kerbed hard up
             against them, so the walker has to be slimmer here than in the
             open main garden or the passages read as sealed. */
          bodyRadius={0.28}
        />
      ) : (
        <OrbitControls
          ref={controls}
          makeDefault
          target={[0, 1, 2]}
          enablePan
          enableDamping
          dampingFactor={0.06}
          minDistance={6}
          maxDistance={54}
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI * 0.487}
        />
      )}
    </>
  )
}

export function MedicinalGardenScene(props: MedicinalGardenSceneProps) {
  const detail = useDetail('garden')
  return (
    <Canvas
      shadows={detail !== 'low'}
      dpr={dprFor(detail)}
      gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
      camera={{ fov: 45, near: 0.1, far: 140, position: [0, 6.5, 22] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
      onPointerMissed={props.walking ? undefined : () => props.onHover(null)}
    >
      <SceneContents {...props} detail={detail} />
    </Canvas>
  )
}
