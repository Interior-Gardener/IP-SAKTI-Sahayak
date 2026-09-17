import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Plant } from '../types/plant'
import { PlantObject } from './PlantObject'
import { buildPlantGeometry } from './procedural/plant'
import { hotspotAnchors } from './hotspots'
import { tickWind } from './materials'
import { useDetail, dprFor } from '../hooks/useDetail'
import { useGarden } from '../store/useGarden'
import { Icon } from '../components/ui/Icon'
import { cx } from '../components/ui/primitives'

/* ------------------------------------------------------------------ *
 * Single-specimen viewer: orbit, zoom, and labelled hotspots pointing
 * at the parts of the plant that actually carry the medicine.
 * ------------------------------------------------------------------ */

function WindClock({ strength }: { strength: number }) {
  useFrame(({ clock }) => tickWind(clock.elapsedTime, strength))
  return null
}

export function Hotspot({
  position,
  label,
  accent,
}: {
  position: [number, number, number]
  label: string
  accent: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Html position={position} center zIndexRange={[20, 0]}>
      <button
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex -translate-y-1/2 items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-[11px] font-medium whitespace-nowrap shadow-md ring-1 transition-colors duration-300',
          open ? 'text-white ring-transparent' : 'text-stone-700 ring-black/10',
        )}
        style={{ background: open ? accent : 'rgba(255,255,255,0.9)' }}
      >
        <span
          className="size-2.5 rounded-full ring-2 ring-white/70"
          style={{ background: open ? 'rgba(255,255,255,0.9)' : accent }}
        />
        {label}
      </button>
    </Html>
  )
}

/**
 * Frames the camera so the whole specimen fits, whatever its proportions —
 * a 14 cm creeper and a 3 m tree both need to fill the frame.
 */
function Rig({
  metrics,
  controls,
  autoRotate,
}: {
  metrics: { height: number; radius: number; centre: number }
  controls: React.RefObject<OrbitControlsImpl | null>
  autoRotate: boolean
}) {
  const { camera, size } = useThree()

  const distance = useMemo(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const vFov = THREE.MathUtils.degToRad(perspective.fov ?? 34)
    const aspect = Math.max(0.4, size.width / Math.max(1, size.height))
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fitVertical = metrics.height * 0.5 / Math.tan(vFov / 2)
    const fitHorizontal = metrics.radius / Math.tan(hFov / 2)
    return Math.max(fitVertical, fitHorizontal) * 1.55 + metrics.radius
  }, [camera, size.width, size.height, metrics.height, metrics.radius])

  // Placed once per specimen, before the first painted frame.
  useEffect(() => {
    camera.position.set(distance * 0.55, metrics.centre + distance * 0.42, distance * 0.78)
    camera.lookAt(0, metrics.centre, 0)
    controls.current?.update()
  }, [camera, controls, distance, metrics.centre])

  return (
    <OrbitControls
      ref={controls}
      target={[0, metrics.centre, 0]}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      autoRotate={autoRotate}
      autoRotateSpeed={0.7}
      minDistance={distance * 0.3}
      maxDistance={distance * 2.6}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.49}
      makeDefault
    />
  )
}

/** A dimension line showing the plant's real-world height. */
function ScaleBar({ height, radius }: { height: number; radius: number }) {
  const x = radius + Math.max(0.12, height * 0.16)
  const label = height >= 1 ? `${height.toFixed(1)} m` : `${Math.round(height * 100)} cm`
  const points = useMemo(
    () => [new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, height, 0)],
    [x, height],
  )
  const line = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: '#8a9a86' }),
      ),
    [points],
  )

  return (
    <group>
      <primitive object={line} />
      <Html position={[x, height * 0.5, 0]} center distanceFactor={5}>
        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-stone-700">
          {label}
        </span>
      </Html>
    </group>
  )
}

interface PlantViewerProps {
  plant: Plant
  className?: string
}

export function PlantViewer({ plant, className }: PlantViewerProps) {
  const detail = useDetail('viewer')
  const reducedMotion = useGarden((s) => s.reducedMotion)
  const theme = useGarden((s) => s.theme)
  const [autoRotate, setAutoRotate] = useState(!reducedMotion)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showScale, setShowScale] = useState(false)
  const controls = useRef<OrbitControlsImpl | null>(null)

  const parts = useMemo(() => plant.partsUsed.slice(0, 4), [plant.partsUsed])

  const metrics = useMemo(() => {
    const built = buildPlantGeometry(plant.id, plant.model, detail)
    // Frame on what was actually generated, not on the species' typical height:
    // a rosette or pseudostem herb is far shorter than its written maximum.
    const box = built.bounds
    const top = Math.max(0.06, box.max.y)
    const spread = Math.max(Math.abs(box.min.x), box.max.x, Math.abs(box.min.z), box.max.z, top * 0.14)
    return {
      height: top,
      radius: spread,
      centre: top * 0.5,
      /** The species' documented height, used by the scale bar. */
      trueHeight: built.height,
      /** Label anchors picked off the generated organs themselves. */
      anchors: hotspotAnchors(parts, built),
    }
  }, [plant.id, plant.model, detail, parts])

  const dark = theme === 'dark'

  return (
    <div className={cx('relative overflow-hidden', className)}>
      <Canvas
        shadows
        dpr={dprFor(detail)}
        gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
        camera={{ fov: 34, near: 0.02, far: 60 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = dark ? 0.92 : 1.05
          scene.fog = new THREE.Fog(dark ? '#0b1410' : '#e9eadf', metrics.height * 6, metrics.height * 16)
        }}
      >
        <color attach="background" args={[dark ? '#0d1712' : '#eceade']} />

        <WindClock strength={reducedMotion ? 0 : 0.85} />

        <hemisphereLight args={[dark ? '#5a7a86' : '#cfe3f2', dark ? '#22301f' : '#6b6046', dark ? 0.6 : 1.15]} />
        <directionalLight
          position={[metrics.height * 2, metrics.height * 3.2, metrics.height * 1.6]}
          intensity={dark ? 1.5 : 2.6}
          color={dark ? '#b9d3e8' : '#fff3dc'}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-metrics.height}
          shadow-camera-right={metrics.height}
          shadow-camera-top={metrics.height * 1.6}
          shadow-camera-bottom={-metrics.height * 0.2}
          shadow-bias={-0.0012}
        />
        <directionalLight position={[-metrics.height * 2, metrics.height, -metrics.height]} intensity={0.45} color="#9fc4a8" />

        <Suspense fallback={null}>
          <PlantObject plant={plant} detail={detail} grow showSoil={false} />

          {showHotspots &&
            parts.map((part, i) => (
              <Hotspot
                key={part}
                position={metrics.anchors[i]}
                label={part}
                accent={plant.accent}
              />
            ))}

          {showScale && <ScaleBar height={metrics.trueHeight} radius={metrics.radius} />}

          {/* Ground plane and its contact shadow. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
            <circleGeometry args={[Math.max(metrics.radius * 3.5, metrics.height * 1.4), 48]} />
            <meshStandardMaterial color={dark ? '#182420' : '#d8d6c6'} roughness={1} />
          </mesh>
          <ContactShadows
            position={[0, 0.002, 0]}
            scale={Math.max(metrics.radius * 5, metrics.height * 2)}
            opacity={dark ? 0.5 : 0.42}
            blur={2.4}
            far={metrics.height}
            resolution={detail === 'low' ? 256 : 512}
          />

          {/* A procedural sky box built from light shapes — no HDR download. */}
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={dark ? 0.7 : 1.8} form="rect" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={12} color={dark ? '#3c5566' : '#fff6e4'} />
            <Lightformer intensity={dark ? 0.5 : 1.1} form="circle" position={[5, 2, 4]} scale={6} color={dark ? '#2b4a3a' : '#cfe0c4'} />
            <Lightformer intensity={dark ? 0.4 : 0.8} form="circle" position={[-5, 1, -4]} scale={6} color={dark ? '#22303c' : '#e6d9c0'} />
          </Environment>
        </Suspense>

        <Rig metrics={metrics} controls={controls} autoRotate={autoRotate} />
      </Canvas>

      {/* Viewer controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 p-1 backdrop-blur-md">
          <ViewerToggle active={autoRotate} onClick={() => setAutoRotate((v) => !v)} icon="reset" label="Spin" />
          <ViewerToggle active={showHotspots} onClick={() => setShowHotspots((v) => !v)} icon="cursor" label="Parts" />
          <ViewerToggle active={showScale} onClick={() => setShowScale((v) => !v)} icon="expand" label="Scale" />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => controls.current?.reset()}
            className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[0.72rem] font-medium text-white/85 backdrop-blur-md transition-colors hover:text-white"
          >
            Reset view
          </button>
        </div>
      </div>

      <p className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/30 px-2.5 py-1 text-[0.68rem] text-white/70 backdrop-blur-md">
        Drag to rotate · scroll to zoom
      </p>
    </div>
  )
}

function ViewerToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: 'reset' | 'cursor' | 'expand'
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.72rem] font-medium transition-colors',
        active ? 'bg-white text-stone-900' : 'text-white/70 hover:text-white',
      )}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  )
}
