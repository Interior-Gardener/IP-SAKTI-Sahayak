import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { makeRng, hashSeed } from './procedural/rng'

/* ------------------------------------------------------------------ *
 * Scene furniture shared between the walkable places.
 *
 * All of this began inside MedicinalGardenScene, where it was written for
 * one garden. The Rasashala needs the same things — ground that is not a
 * flat slab of colour, and boards you read by holding the pointer on them
 * — so they live here now and the garden imports them. Nothing about how
 * the garden looks or behaves changed in the move: the garden still
 * passes its own colours, sizes and text, and its dedication plaque (a
 * photographic print, particular to that place) stayed where it was.
 * ------------------------------------------------------------------ */

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
export function groundNoise(): THREE.CanvasTexture {
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
export function useGrain(width: number, depth: number, tile = 1.6, seed = ''): THREE.Texture {
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

/** A grained horizontal surface: the garden's mown ground, the Rasashala's floor. */
export function GroundPlane({
  width,
  depth,
  color,
  tile = 3.4,
  seed = '',
  y = 0,
}: {
  width: number
  depth: number
  color: string
  tile?: number
  seed?: string
  y?: number
}) {
  const grain = useGrain(width, depth, tile, seed)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, y, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={grain} color={color} roughness={1} />
    </mesh>
  )
}

/** What a board reports: which thing it names, and where on screen to hang
 *  the card. Null means the pointer left it. */
export type BoardRead = (id: string | null, clientX?: number, clientY?: number) => void

/**
 * The label board: a white plate raked back on a single black post, the prop
 * that makes the garden recognisable more than any plant does — and, in the
 * Rasashala, the same prop naming a vat or a shelf.
 *
 * Reading one on the ground means walking up and squinting at the print, so
 * reading one here means holding the pointer on it: `onRead` fires and the
 * route raises the full card over the scene.
 */
export function LabelBoard({
  position,
  rotation,
  id,
  title,
  subtitle,
  dark,
  showText,
  onRead,
  occlude,
  accent = '#e2762c',
}: {
  position: [number, number, number]
  rotation: number
  /** What this board names — a plant id, a material id, the plaque's stand-in. */
  id: string
  title: string
  subtitle?: string
  dark: boolean
  showText: boolean
  onRead?: BoardRead
  /** Objects that hide the label outright when they come between it and the
   *  camera. Dimming or blending it would change how it looks the rest of
   *  the time; not drawing it does not. */
  occlude?: RefObject<THREE.Object3D>[]
  /** The rule across the plate. The garden's boards are orange on site. */
  accent?: string
}) {
  const read = onRead
    ? (e: { stopPropagation: () => void; clientX: number; clientY: number }) => {
        e.stopPropagation()
        onRead(id, e.clientX, e.clientY)
      }
    : undefined
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.68, 6]} />
        <meshStandardMaterial color={dark ? '#15181a' : '#2b2f31'} roughness={0.7} metalness={0.3} />
      </mesh>
      <group position={[0, 0.72, 0]} rotation={[-Math.PI / 3.1, 0, 0]}>
        {/* The plate carries the pointer events for the whole board — the
            rule in front of it is taken out of the raycast below so crossing
            it cannot read as leaving the board. */}
        <mesh castShadow onPointerOver={read} onPointerMove={read} onPointerOut={onRead ? () => onRead(null) : undefined}>
          <boxGeometry args={[0.62, 0.42, 0.02]} />
          <meshStandardMaterial color={dark ? '#7d8288' : '#eceae2'} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.03, 0.012]} raycast={() => null}>
          <planeGeometry args={[0.62, 0.045]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        {showText && (
          <Html
            position={[0, 0.09, 0.014]}
            transform
            distanceFactor={2.6}
            zIndexRange={[8, 0]}
            occlude={occlude}
            style={{ pointerEvents: 'none' }}
          >
            {/* The plate is 0.62 wide at distanceFactor 2.6, which works out at
                roughly 96 px of label — anything wider prints off the board, so
                long names wrap here rather than running over the edge. */}
            <div className="w-[96px] break-words px-1 text-center font-display leading-[1.1] text-stone-800">
              <div className="text-[7px] font-semibold">{title}</div>
              {subtitle && <div className="text-[5.5px] italic">{subtitle}</div>}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

/**
 * A standing sign: the board at the head of an area, naming it and saying
 * what it holds. The garden's dedication plaque is a photographic print and
 * stays in that scene; this is its plain-text cousin, for places whose
 * signs are lettered rather than scanned.
 */
export function SignBoard({
  position,
  rotation = 0,
  title,
  blurb,
  dark,
  showText,
  width = 1.5,
  height = 0.95,
  accent = '#b4753a',
}: {
  position: [number, number, number]
  rotation?: number
  title: string
  blurb?: string
  dark: boolean
  showText: boolean
  width?: number
  height?: number
  accent?: string
}) {
  const post = 1.05
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.1), post / 2, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.04, post, 6]} />
          <meshStandardMaterial color={dark ? '#1b1410' : '#3a2a1e'} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, post + height / 2 - 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={dark ? '#2a2620' : '#efe6d2'} roughness={0.7} />
      </mesh>
      <mesh position={[0, post + height - 0.16, 0.028]} raycast={() => null}>
        <planeGeometry args={[width - 0.16, 0.035]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      {showText && (
        <Html
          position={[0, post + height / 2 - 0.12, 0.032]}
          transform
          distanceFactor={2.6}
          zIndexRange={[8, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-[230px] px-2 text-center font-display leading-tight text-stone-800">
            <div className="text-[11px] font-semibold tracking-wide">{title}</div>
            {blurb && <div className="mt-1 text-[7px] leading-[1.35] text-stone-600">{blurb}</div>}
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * A Petri dish, for a culture to be spread on, so a colony reads as something
 * being looked at rather than as a blob floating over a bench.
 *
 * Glass wall, agar floor, and a scatter of colonies grown on the agar in the
 * organism's own colour: the magnified cells stand in the middle, and the
 * spots round them are what the same culture looks like at arm's length.
 */
export function CultureDish({
  position,
  dark,
  id = 'dish',
  tint,
  scale = 1,
}: {
  position: [number, number, number]
  dark: boolean
  /** Seeds where the colonies grow, so each dish is its own and stays so. */
  id?: string
  /** Colony colour; no spots are drawn without one. */
  tint?: string
  scale?: number
}) {
  const spots = useMemo(() => {
    if (!tint) return []
    const rng = makeRng(hashSeed(`colonies-${id}`))
    const out: { x: number; z: number; r: number }[] = []
    for (let i = 0; i < 14; i++) {
      // Out towards the rim: the middle of the dish is where the cells stand.
      const a = rng.next() * Math.PI * 2
      const d = 0.09 + rng.next() * 0.08
      out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: 0.006 + rng.next() * 0.011 })
    }
    return out
  }, [id, tint])
  return (
    <group position={position} scale={scale}>
      {/* Base and wall, in glass. */}
      <mesh position={[0, 0.003, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.006, 32]} />
        <meshPhysicalMaterial color={dark ? '#8a9199' : '#e8eef0'} roughness={0.08} clearcoat={1} transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0.016, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.032, 32, 1, true]} />
        <meshPhysicalMaterial
          color={dark ? '#9aa3aa' : '#f2f6f7'}
          roughness={0.05}
          clearcoat={1}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* The agar. */}
      <mesh position={[0, 0.011, 0]}>
        <cylinderGeometry args={[0.194, 0.194, 0.01, 32]} />
        <meshPhysicalMaterial color={dark ? '#6e6a4c' : '#e3d9a6'} roughness={0.35} clearcoat={0.6} transparent opacity={0.9} />
      </mesh>
      {spots.map((spot, i) => (
        <mesh key={i} position={[spot.x, 0.016, spot.z]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[spot.r, 10, 6]} />
          <meshPhysicalMaterial color={tint} roughness={0.4} clearcoat={0.7} />
        </mesh>
      ))}
    </group>
  )
}
