import { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDetail, dprFor } from '../hooks/useDetail'
import { daylightAt } from './daylight'
import { GroundPlane } from './scenery'
import { MaterialObject } from './MaterialObject'
import { PlantObject } from './PlantObject'
import { getMaterial } from '../data/materials'
import { getPlant } from '../data/plants'
import { useWorkbench } from '../store/useWorkbench'

/* ------------------------------------------------------------------ *
 * The workbench.
 *
 * The bench in the middle of the Rasashala, with whatever is on it laid
 * out in a row. Plants are the specimens the garden grows and materials
 * are the ones the pharmacy keeps, drawn by their own generators — the
 * point of the scene is that a formulation is made of both, and that you
 * can see what you are about to have classified.
 *
 * An empty bench is drawn as an empty bench, not as nothing: the route
 * says what to do about it.
 * ------------------------------------------------------------------ */

const BENCH_Y = 0.92
const BENCH_LENGTH = 5.4

function Bench({ dark }: { dark: boolean }) {
  return (
    <group>
      <mesh position={[0, BENCH_Y - 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[BENCH_LENGTH, 0.1, 1.5]} />
        <meshStandardMaterial color={dark ? '#3a332c' : '#9d8a6f'} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (BENCH_LENGTH / 2 - 0.5), (BENCH_Y - 0.1) / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, BENCH_Y - 0.1, 1.2]} />
          <meshStandardMaterial color={dark ? '#241f1a' : '#7d6a52'} roughness={0.85} />
        </mesh>
      ))}
      {/* The mortar at the end of the bench: the tool, so an empty bench
          still reads as a place where something is made. */}
      <group position={[BENCH_LENGTH / 2 - 0.75, BENCH_Y, 0.1]}>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.12, 0.22, 18]} />
          <meshStandardMaterial color={dark ? '#4a4a52' : '#8d8f96'} roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh position={[0.05, 0.26, 0]} rotation={[0, 0, -0.5]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.34, 10]} />
          <meshStandardMaterial color={dark ? '#4a4a52' : '#8d8f96'} roughness={0.5} metalness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

function Contents({ timeOfDay, selected }: { timeOfDay: number; selected: string | null }) {
  const detail = useDetail('garden')
  const items = useWorkbench((s) => s.items)
  const light = daylightAt(timeOfDay)
  const dark = light.dark

  /* Laid out along the bench, largest first so a tree does not hide a pinch
   * of bhasma behind it. Plants are scaled down hard: a two-metre shrub on a
   * bench is the one thing that would make the scene unreadable. */
  const laid = useMemo(() => {
    const span = BENCH_LENGTH - 1.8
    const n = Math.max(items.length, 1)
    return items.map((item, i) => {
      const t = items.length === 1 ? 0.5 : i / (n - 1)
      const x = -span / 2 + t * span - 0.4
      return { item, x }
    })
  }, [items])

  return (
    <>
      <color attach="background" args={[light.sky]} />
      <fog attach="fog" args={[light.sky, 14, 42]} />
      <hemisphereLight args={[light.hemi, light.bounce, light.ambient * 1.2]} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sunIntensity * 0.9}
        color={light.sun}
        castShadow={detail !== 'low'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0015}
      />
      <pointLight position={[0, 2.6, 1.2]} intensity={dark ? 7 : 3} distance={8} decay={2} color="#ffd9ad" />

      <GroundPlane width={16} depth={16} color={dark ? '#2e2a26' : '#b3a68f'} tile={2.2} seed="workbench" />
      <Bench dark={dark} />

      {laid.map(({ item, x }) => {
        const highlighted = selected === item.id
        if (item.kind === 'plant') {
          const plant = getPlant(item.id)
          if (!plant) return null
          // Scaled to a hand's span, so a tree and a herb sit together.
          const scale = 0.55 / Math.max(plant.model.height, 0.6)
          return (
            <PlantObject
              key={item.id}
              plant={plant}
              detail={detail}
              position={[x, BENCH_Y, 0]}
              scale={scale}
              showSoil={false}
              highlight={highlighted}
            />
          )
        }
        const material = getMaterial(item.id)
        if (!material) return null
        return (
          <MaterialObject
            key={item.id}
            material={material}
            position={[x, BENCH_Y, 0]}
            fit={0.42}
            detail={detail}
            highlighted={highlighted}
          />
        )
      })}

      <OrbitControls makeDefault enablePan minDistance={1.6} maxDistance={9} maxPolarAngle={Math.PI / 2.1} target={[0, 1.05, 0]} />
    </>
  )
}

export function WorkbenchScene({ timeOfDay, selected = null }: { timeOfDay: number; selected?: string | null }) {
  const detail = useDetail('garden')
  return (
    <Canvas
      shadows={detail !== 'low'}
      dpr={dprFor(detail)}
      gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.1, far: 60, position: [0, 2, 4.4] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <Contents timeOfDay={timeOfDay} selected={selected} />
    </Canvas>
  )
}
