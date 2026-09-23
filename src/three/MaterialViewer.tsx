import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { SourceMaterial } from '../types/source'
import { MaterialObject } from './MaterialObject'
import { buildMicrobeGeometry } from './procedural/microbe'
import { buildSubstanceGeometry } from './procedural/substance'
import { CultureDish } from './scenery'
import { Rig, ViewerToggle } from './PlantViewer'
import { useDetail, dprFor } from '../hooks/useDetail'
import { useGarden } from '../store/useGarden'
import { Icon } from '../components/ui/Icon'
import { cx } from '../components/ui/primitives'
import { openSahayak } from '../lib/sahayak/client'

/* ------------------------------------------------------------------ *
 * Single-specimen viewer for a Rasashala material: the PlantViewer's
 * turntable, for a pot of ghee or a colony of yeast.
 *
 * The one thing that differs is scale. A plant is shown at its real
 * height; a micro-organism has no size anyone could see, so a colony is
 * shown magnified on a Petri dish and the viewer says so, rather than
 * pretending a yeast cell is a few centimetres across.
 * ------------------------------------------------------------------ */

/** How big each kind is drawn, in metres. Chosen to fill the frame, not to scale. */
const FIT = { microbe: 0.34, animal: 0.42, mineral: 0.42 } as const

export function MaterialViewer({ material, className }: { material: SourceMaterial; className?: string }) {
  const detail = useDetail('viewer')
  const reducedMotion = useGarden((s) => s.reducedMotion)
  const theme = useGarden((s) => s.theme)
  const [autoRotate, setAutoRotate] = useState(!reducedMotion)
  const [showLabels, setShowLabels] = useState(true)
  const controls = useRef<OrbitControlsImpl | null>(null)
  const dark = theme === 'dark'

  const microbe = material.kind === 'microbe'
  const fit = FIT[material.kind]
  // On a dish the colony stands a little proud of the agar.
  const base = microbe ? 0.024 : 0
  /* Frame what was built, not the fit: a comb is wide and flat, a kupi tall
   * and narrow, and framing both as a cube leaves the comb sitting low under
   * an empty sky. MaterialObject scales the largest side to `fit`, so the
   * same scale is applied here to the measured bounds. */
  const metrics = useMemo(() => {
    const spec = material.model
    const built =
      spec.draw === 'microbe'
        ? buildMicrobeGeometry(material.id, spec, detail)
        : buildSubstanceGeometry(material.id, spec, detail)
    const size = built.bounds.getSize(new THREE.Vector3())
    const s = fit / (Math.max(size.x, size.y, size.z) || 1)
    const height = size.y * s + base
    const radius = Math.max(size.x, size.z) * s * 0.5
    return { height, radius: microbe ? Math.max(radius, 0.24) : Math.max(radius, height * 0.4), centre: height * 0.5 }
  }, [material, fit, base, microbe, detail])

  return (
    <div className={cx('relative overflow-hidden', className)}>
      <Canvas
        shadows
        dpr={dprFor(detail)}
        gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
        camera={{ fov: 34, near: 0.01, far: 30 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = dark ? 0.95 : 1.05
        }}
      >
        <color attach="background" args={[dark ? '#16130f' : '#ece6da']} />
        <hemisphereLight args={[dark ? '#6b6258' : '#f4ecde', dark ? '#221c16' : '#7a6a52', dark ? 0.55 : 1]} />
        <directionalLight
          position={[0.9, 1.6, 0.8]}
          intensity={dark ? 1.4 : 2.4}
          color={dark ? '#e6d2b8' : '#fff1da'}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-0.6}
          shadow-camera-right={0.6}
          shadow-camera-top={0.8}
          shadow-camera-bottom={-0.2}
          shadow-bias={-0.0008}
        />
        <directionalLight position={[-1, 0.6, -0.8]} intensity={0.5} color="#c8b79c" />

        <Suspense fallback={null}>
          {microbe && <CultureDish position={[0, 0, 0]} dark={dark} id={material.id} tint={material.model.accent ?? material.model.color} scale={1.15} />}
          <MaterialObject material={material} position={[0, base, 0]} fit={fit} detail={detail} />

          {showLabels && (
            <Html position={[0, metrics.height + Math.max(0.07, metrics.radius * 0.45), 0]} center zIndexRange={[20, 0]}>
              <button
                onClick={() =>
                  openSahayak({
                    question: `What IP and regulatory rules apply to ${material.name} in an Ayurvedic product?`,
                    context: [{ kind: material.kind, id: material.id, label: material.name }],
                  })
                }
                className="flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-moss-900/90 py-1 pr-2.5 pl-1.5 text-[11px] font-medium whitespace-nowrap text-moss-100 shadow-md ring-1 ring-white/20 transition-transform hover:scale-105"
              >
                <Icon name="scale" size={13} />
                IP &amp; law
              </button>
            </Html>
          )}

          {/* A turned wooden plinth: the thing is being shown, not left lying about. */}
          <mesh position={[0, -0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.27, 0.29, 0.04, 48]} />
            <meshPhysicalMaterial color={dark ? '#3a2e24' : '#9c7f5f'} roughness={0.55} clearcoat={0.4} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
            <circleGeometry args={[3, 48]} />
            <meshStandardMaterial color={dark ? '#1c1814' : '#ddd5c6'} roughness={1} />
          </mesh>
          <ContactShadows position={[0, 0.001, 0]} scale={1.2} opacity={dark ? 0.55 : 0.45} blur={2.2} far={0.6} resolution={detail === 'low' ? 256 : 512} />

          {/* Metals and glass need something to reflect; this is a lit room, not an HDR download. */}
          <Environment resolution={64} frames={1} environmentIntensity={dark ? 0.9 : 1.5}>
            <Lightformer intensity={dark ? 0.8 : 1.9} form="rect" position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={8} color={dark ? '#5a4a3a' : '#fff5e2'} />
            <Lightformer intensity={dark ? 0.6 : 1.2} form="rect" position={[3, 1.5, 2]} scale={[3, 1.5, 1]} color={dark ? '#4a3a2a' : '#f3e2c4'} />
            <Lightformer intensity={dark ? 0.4 : 0.8} form="circle" position={[-3, 1, -2]} scale={3} color={dark ? '#2a3440' : '#d6e0e6'} />
            {/* A band of light all the way round at eye level: a metal's side
                faces reflect the horizon, and without this a gold bar's front
                was the colour of mud. */}
            {[0, 1, 2, 3].map((i) => (
              <Lightformer
                key={i}
                intensity={dark ? 0.5 : 1.1}
                form="rect"
                position={[Math.sin((i * Math.PI) / 2) * 4, 0.6, Math.cos((i * Math.PI) / 2) * 4]}
                rotation={[0, (i * Math.PI) / 2 + Math.PI, 0]}
                scale={[5, 1.2, 1]}
                color={dark ? '#6a5a48' : '#fff3e0'}
              />
            ))}
          </Environment>
        </Suspense>

        <Rig metrics={metrics} controls={controls} autoRotate={autoRotate} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 p-1 backdrop-blur-md">
          <ViewerToggle active={autoRotate} onClick={() => setAutoRotate((v) => !v)} icon="reset" label="Spin" />
          <ViewerToggle active={showLabels} onClick={() => setShowLabels((v) => !v)} icon="cursor" label="Labels" />
        </div>
        <button
          onClick={() => controls.current?.reset()}
          className="pointer-events-auto rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[0.72rem] font-medium text-white/85 backdrop-blur-md transition-colors hover:text-white"
        >
          Reset view
        </button>
      </div>

      <p className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/30 px-2.5 py-1 text-[0.68rem] text-white/70 backdrop-blur-md">
        {microbe ? 'Magnified — cells are microscopic' : 'Drag to rotate · scroll to zoom'}
      </p>
    </div>
  )
}
