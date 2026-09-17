import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Plant } from '../types/plant'
import { buildPlantGeometry, type Detail } from './procedural/plant'
import { createOrganMaterial, groundColors } from './materials'

interface PlantObjectProps {
  plant: Plant
  detail?: Detail
  position?: [number, number, number]
  /** Y rotation in radians — varies the look of repeated species. */
  spin?: number
  scale?: number
  /** Plays a short growth animation on mount. */
  grow?: boolean
  highlight?: boolean
  showSoil?: boolean
  castShadow?: boolean
  onPointerOver?: (e: THREE.Event) => void
  onPointerOut?: (e: THREE.Event) => void
  onClick?: (e: THREE.Event) => void
}

/** Lightens a hex colour — used for petal undersides and highlights. */
function lighten(hex: string, amount: number): THREE.Color {
  const c = new THREE.Color(hex)
  return c.lerp(new THREE.Color('#ffffff'), amount)
}

export function PlantObject({
  plant,
  detail = 'high',
  position = [0, 0, 0],
  spin = 0,
  scale = 1,
  grow = false,
  highlight = false,
  showSoil = true,
  castShadow = true,
  onPointerOver,
  onPointerOut,
  onClick,
}: PlantObjectProps) {
  const spec = plant.model
  const geometry = useMemo(() => buildPlantGeometry(plant.id, spec, detail), [plant.id, spec, detail])

  const materials = useMemo(() => {
    const leaf = spec.leaf
    return {
      stem: createOrganMaterial({
        color: spec.stem.color,
        backColor: spec.stem.color,
        gloss: spec.stem.woody ? 0.05 : 0.2,
        side: THREE.FrontSide,
        bark: spec.stem.woody,
      }),
      foliage: createOrganMaterial({
        color: leaf.top,
        backColor: leaf.bottom,
        gloss: leaf.gloss ?? 0.3,
        // A succulent blade has no visible venation to draw — the flecking
        // takes its place.
        veins: leaf.spots ? 0.1 : 1,
        spots: leaf.spots ?? 0,
        spotColor: leaf.spotColor,
      }),
      petal: createOrganMaterial({
        color: spec.flower?.color ?? '#ffffff',
        backColor: lighten(spec.flower?.color ?? '#ffffff', 0.25).getStyle(),
        gloss: 0.45,
        veins: 0.35,
      }),
      core: createOrganMaterial({
        color: spec.flower?.centre ?? '#e8c96a',
        gloss: 0.4,
        side: THREE.FrontSide,
      }),
      fruit: createOrganMaterial({
        color: spec.fruit?.color ?? '#c0563a',
        gloss: 0.65,
        side: THREE.FrontSide,
      }),
      ripeFruit: createOrganMaterial({
        color: spec.fruit?.ripeColor ?? spec.fruit?.color ?? '#c0563a',
        gloss: 0.7,
        side: THREE.FrontSide,
      }),
      rhizome: createOrganMaterial({
        color: spec.rhizome?.color ?? '#c9a06a',
        gloss: 0.1,
        side: THREE.FrontSide,
        still: true,
      }),
      soil: new THREE.MeshStandardMaterial({
        color: new THREE.Color(groundColors[spec.ground ?? 'soil']),
        roughness: 1,
        metalness: 0,
      }),
    }
  }, [spec])

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const group = useRef<THREE.Group>(null)
  const progress = useRef(grow ? 0 : 1)
  const glow = useRef(0)

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 1.35)
      // Ease-out-back: the plant overshoots very slightly as it settles.
      const t = progress.current
      const eased = 1 + 1.9 * Math.pow(t - 1, 3) + 1.0 * Math.pow(t - 1, 2)
      g.scale.setScalar(scale * eased)
    } else if (Math.abs(g.scale.x - scale) > 1e-4) {
      g.scale.setScalar(scale)
    }

    const target = highlight ? 1 : 0
    if (Math.abs(glow.current - target) > 1e-3) {
      glow.current = THREE.MathUtils.damp(glow.current, target, 8, delta)
      materials.foliage.emissive.setRGB(0.12, 0.3, 0.14)
      materials.foliage.emissiveIntensity = glow.current * 0.5
      materials.petal.emissiveIntensity = glow.current * 0.4
      materials.petal.emissive.setRGB(0.3, 0.25, 0.12)
    }
  })

  const radius = geometry.radius * 1.35 + 0.06

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, spin, 0]}
      scale={grow ? 0.001 : scale}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {showSoil && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow material={materials.soil}>
          <circleGeometry args={[radius, 18]} />
        </mesh>
      )}
      {geometry.rhizome && (
        <mesh geometry={geometry.rhizome} material={materials.rhizome} castShadow={castShadow} />
      )}
      {geometry.stem && (
        <mesh geometry={geometry.stem} material={materials.stem} castShadow={castShadow} />
      )}
      {geometry.foliage && (
        <mesh geometry={geometry.foliage} material={materials.foliage} castShadow={castShadow} />
      )}
      {geometry.petal && <mesh geometry={geometry.petal} material={materials.petal} />}
      {geometry.core && <mesh geometry={geometry.core} material={materials.core} />}
      {geometry.fruit && (
        <mesh geometry={geometry.fruit} material={materials.fruit} castShadow={castShadow} />
      )}
      {geometry.ripeFruit && (
        <mesh geometry={geometry.ripeFruit} material={materials.ripeFruit} castShadow={castShadow} />
      )}
    </group>
  )
}
