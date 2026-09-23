import { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useDetail, dprFor } from '../hooks/useDetail'
import { daylightAt } from './daylight'
import { GroundPlane, SignBoard } from './scenery'
import { WalkControls, type Obstacle, type WalkBoard, type WalkTarget } from './WalkControls'
import { REGISTRIES, type RegistryData } from '../data/registries'
import type { Detail } from './procedural/plant'

/* ------------------------------------------------------------------ *
 * Registry Marg — the street of offices a question ends at.
 *
 * The garden answers "what is this plant"; Sahayak answers "what does the
 * law say"; this is "where do I go now". One building per registry, facing
 * a straight street, each lettered with its name and fronted by a sign that
 * says what you do there. Click one for its forms, each with the words of
 * the rule that names it — the same verified seed /registry serves.
 *
 * Laid out like the other scenes: +X east, -Z down the street. The arch
 * you enter under is at the south end, where the garden's gate would be.
 * ------------------------------------------------------------------ */

export const STREET = {
  /** Kerb to kerb. */
  roadHalf: 3.2,
  pavement: 2.2,
  /** Distance between one building's centre and the next along a side. */
  spacing: 7.5,
  /** Where the first pair of buildings stands. */
  startZ: 2,
} as const

/** A colour per regime, so offices of one kind read as a family. */
const REGIME_TONE: Record<string, string> = {
  patent: '#b5654a',
  gi: '#c79a3c',
  trademark: '#5b6a9e',
  abs: '#5f8d58',
  drug_licensing: '#3f8c8a',
  food: '#cf7d3a',
  pvp: '#8b8a3d',
  treaty: '#6c7c8a',
}

export function toneOf(r: RegistryData): string {
  return REGIME_TONE[r.regime[0]] ?? '#8a7f6f'
}

export interface RegistryPlacement {
  registry: RegistryData
  /** Centre of the building's footprint. */
  x: number
  z: number
  /** +1 on the west side (faces east), -1 on the east side (faces west). */
  side: 1 | -1
  width: number
  depth: number
  height: number
}

/** Where every office stands: alternating sides, one step down the street each pair. */
export function placements(): RegistryPlacement[] {
  const setback = STREET.roadHalf + STREET.pavement
  return REGISTRIES.map((registry, i) => {
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1
    const width = 5.2
    const depth = 4.6
    // Heights vary a little so the skyline is not a row of identical boxes.
    const height = 4.2 + ((i * 37) % 5) * 0.35
    return {
      registry,
      x: -side * (setback + depth / 2),
      z: STREET.startZ - Math.floor(i / 2) * STREET.spacing,
      side,
      width,
      depth,
      height,
    }
  })
}

/** One office: plinth, walls, cornice, a door and lit windows, its name on the front. */
function Office({
  place,
  dark,
  detail,
  selected,
  onSelect,
  onHover,
}: {
  place: RegistryPlacement
  dark: boolean
  detail: Detail
  selected: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
}) {
  const { registry, width, depth, height, side } = place
  const tone = toneOf(registry)
  const wall = useMemo(() => new THREE.Color(tone).lerp(new THREE.Color(dark ? '#1c1a18' : '#efe6d6'), dark ? 0.55 : 0.45), [tone, dark])
  const trim = dark ? '#2a2521' : '#f6f0e4'
  const glass = dark ? '#ffd9a0' : '#9fb7c4'
  // The front faces the street: +X for a building on the west side.
  const front = depth / 2 + 0.01
  const handlers = {
    onClick: onSelect
      ? (e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          onSelect(registry.id)
        }
      : undefined,
    onPointerOver: onHover
      ? (e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          onHover(registry.id)
        }
      : undefined,
    onPointerOut: onHover ? () => onHover(null) : undefined,
  }
  return (
    <group position={[place.x, 0, place.z]} rotation={[0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      {/* Steps up to the plinth. */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[width + 0.4, 0.3, depth + 0.4]} />
        <meshStandardMaterial color={dark ? '#3a3632' : '#cfc6b6'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3 + height / 2, 0]} castShadow receiveShadow {...handlers}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={wall}
          roughness={0.85}
          emissive={selected ? tone : '#000000'}
          emissiveIntensity={selected ? 0.18 : 0}
        />
      </mesh>
      {/* A band of the regime's colour at the base, and the cornice. */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[width + 0.02, 0.5, depth + 0.02]} />
        <meshStandardMaterial color={tone} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3 + height + 0.12, 0]} castShadow>
        <boxGeometry args={[width + 0.5, 0.24, depth + 0.5]} />
        <meshStandardMaterial color={trim} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3 + height + 0.42, 0]} castShadow>
        <boxGeometry args={[width - 0.6, 0.36, depth - 0.6]} />
        <meshStandardMaterial color={tone} roughness={0.8} />
      </mesh>
      {/* Door and its canopy, on the street face. */}
      <mesh position={[0, 0.3 + 1.1, front]}>
        <boxGeometry args={[1.2, 2.2, 0.06]} />
        <meshStandardMaterial color={dark ? '#1d1712' : '#4a3a2c'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3 + 2.45, front + 0.35]} castShadow>
        <boxGeometry args={[1.9, 0.08, 0.8]} />
        <meshStandardMaterial color={tone} roughness={0.6} />
      </mesh>
      {/* Windows either side of the door, and a row above. */}
      {[-1, 1].flatMap((wx) =>
        [1.5, height - 0.9].filter((wy) => wy > 1.4 && wy < height).map((wy) => (
          <mesh key={`${wx}-${wy}`} position={[wx * (width / 2 - 1.05), 0.3 + wy, front]}>
            <planeGeometry args={[1.1, 1.0]} />
            <meshStandardMaterial color={glass} emissive={glass} emissiveIntensity={dark ? 0.9 : 0.12} roughness={0.2} />
          </mesh>
        )),
      )}
      {/* The name, lettered over the door. */}
      {detail !== 'low' && (
        <Html position={[0, 0.3 + height - 0.4, front + 0.02]} transform distanceFactor={9} zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="w-[190px] rounded-sm px-2 py-1 text-center font-display text-[12px] leading-tight font-semibold text-white"
            style={{ background: tone }}
          >
            {registry.name}
          </div>
        </Html>
      )}
    </group>
  )
}

/** The arch you enter the street under. */
function Arch({ z, dark }: { z: number; dark: boolean }) {
  const stone = dark ? '#3c3731' : '#d8cdb8'
  const span = STREET.roadHalf + 0.8
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * span, 2.4, 0]} castShadow>
          <boxGeometry args={[0.8, 4.8, 0.8]} />
          <meshStandardMaterial color={stone} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[span * 2 + 1.4, 0.9, 1]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      {/* Capped low like every other label here, or the lettering draws over the page's own panels. */}
      <Html position={[0, 5.1, 0.52]} transform distanceFactor={8} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="px-3 text-center font-display text-[18px] font-semibold tracking-[0.2em] text-stone-800 uppercase">
          Registry Marg
        </div>
      </Html>
    </group>
  )
}

/** Street lamps down both kerbs. Lit heads always; real light only after dusk. */
function Lamps({ zs, dark }: { zs: number[]; dark: boolean }) {
  const x = STREET.roadHalf + 0.4
  return (
    <group>
      {zs.flatMap((z) =>
        [-1, 1].map((s) => (
          <group key={`${s}-${z}`} position={[s * x, 0, z]}>
            <mesh position={[0, 1.7, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 3.4, 8]} />
              <meshStandardMaterial color={dark ? '#1f2224' : '#3b4043'} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 3.45, 0]}>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshStandardMaterial color="#fff1cf" emissive="#ffd28a" emissiveIntensity={dark ? 2.2 : 0.3} />
            </mesh>
          </group>
        )),
      )}
      {dark &&
        zs.filter((_, i) => i % 2 === 0).map((z) => (
          <pointLight key={z} position={[0, 3.4, z]} intensity={10} distance={12} decay={2} color="#ffd9a0" />
        ))}
    </group>
  )
}

interface ContentsProps {
  detail: Detail
  timeOfDay: number
  selected: string | null
  walking?: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  onWalkExit?: () => void
  onWalkAim?: (id: string | null) => void
}

function SceneContents({ detail, timeOfDay, selected, walking, onSelect, onHover, onWalkExit, onWalkAim }: ContentsProps) {
  const light = daylightAt(timeOfDay)
  const dark = light.dark
  const offices = useMemo(() => placements(), [])
  const endZ = Math.min(...offices.map((o) => o.z)) - STREET.spacing
  const startZ = STREET.startZ + 8
  const length = startZ - endZ
  const midZ = (startZ + endZ) / 2
  const lampZs = useMemo(() => {
    const out: number[] = []
    for (let z = startZ - 3; z > endZ + 2; z -= 7) out.push(z)
    return out
  }, [startZ, endZ])

  const signs = offices.map((o) => ({
    id: o.registry.id,
    // At the kerb in front of the office, turned to face the street.
    position: [-o.side * (STREET.roadHalf + 0.9), 0, o.z + 2] as [number, number, number],
    rotation: o.side === 1 ? Math.PI / 2 : -Math.PI / 2,
    registry: o.registry,
  }))

  const walkTargets: WalkTarget[] = offices.map((o) => ({ id: o.registry.id, height: o.height, position: [o.x, 0, o.z], scale: 1 }))
  const walkBoards: WalkBoard[] = signs.map((s) => ({ plantId: s.id, position: s.position }))
  const obstacles: Obstacle[] = offices.map((o) => ({ kind: 'rect' as const, x: o.x, z: o.z, halfX: o.depth / 2 + 0.3, halfZ: o.width / 2 + 0.3 }))

  return (
    <>
      <color attach="background" args={[light.sky]} />
      <fog attach="fog" args={[light.sky, 30, 90]} />
      <hemisphereLight args={[light.hemi, light.bounce, light.ambient * 1.1]} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sunIntensity}
        color={light.sun}
        castShadow={detail !== 'low'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
        shadow-bias={-0.0015}
      />

      {/* Ground beyond the street, the road, the pavements and the centre line. */}
      <GroundPlane width={60} depth={length + 30} color={dark ? '#233026' : '#a9b58e'} tile={4} seed="marg" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, midZ]} receiveShadow>
        <planeGeometry args={[STREET.roadHalf * 2, length]} />
        <meshStandardMaterial color={dark ? '#26282a' : '#5d6063'} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (STREET.roadHalf + STREET.pavement / 2), 0.08, midZ]} receiveShadow>
          <boxGeometry args={[STREET.pavement, 0.16, length]} />
          <meshStandardMaterial color={dark ? '#4a4540' : '#cdc2ae'} roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(length / 3) }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, startZ - 1.5 - i * 3]}>
          <planeGeometry args={[0.14, 1.4]} />
          <meshStandardMaterial color={dark ? '#8d8a70' : '#f2e7c2'} />
        </mesh>
      ))}

      <Arch z={startZ - 1} dark={dark} />
      <Lamps zs={lampZs} dark={dark} />

      {offices.map((o) => (
        <Office
          key={o.registry.id}
          place={o}
          dark={dark}
          detail={detail}
          selected={selected === o.registry.id}
          onSelect={onSelect}
          onHover={walking ? undefined : onHover}
        />
      ))}
      {signs.map((s) => (
        <SignBoard
          key={s.id}
          position={s.position}
          rotation={s.rotation}
          title={s.registry.name.split(' (')[0]}
          blurb={s.registry.action}
          dark={dark}
          showText={detail !== 'low'}
          width={1.7}
          height={1.05}
          accent={toneOf(s.registry)}
        />
      ))}

      {walking && onWalkExit ? (
        <WalkControls
          placements={walkTargets}
          boards={walkBoards}
          onExit={onWalkExit}
          onAim={(id) => onWalkAim?.(id)}
          onSelect={(id) => onSelect?.(id)}
          onBoardAim={(id) => onWalkAim?.(id)}
          onBoardSelect={(id) => onSelect?.(id)}
          obstacles={obstacles}
          bounds={{ kind: 'rect', halfX: 12, halfZ: length / 2 - 1, z: midZ }}
          start={[0, startZ - 3]}
          bodyRadius={0.34}
        />
      ) : (
        <OrbitControls makeDefault enablePan minDistance={5} maxDistance={70} maxPolarAngle={Math.PI / 2.15} target={[0, 1.5, midZ + 2]} />
      )}
    </>
  )
}

export interface RegistryMargSceneProps {
  timeOfDay: number
  selected: string | null
  walking?: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  onWalkExit?: () => void
  onWalkAim?: (id: string | null) => void
}

export function RegistryMargScene(props: RegistryMargSceneProps) {
  const detail = useDetail('garden')
  return (
    <Canvas
      shadows={detail !== 'low'}
      dpr={dprFor(detail)}
      gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
      /* From above the entrance, looking down the street: the arch frames it
         rather than filling the screen. */
      camera={{ fov: 46, near: 0.1, far: 200, position: [12, 13, STREET.startZ + 26] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <SceneContents {...props} detail={detail} />
    </Canvas>
  )
}
