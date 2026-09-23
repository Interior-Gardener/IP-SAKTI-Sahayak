import { useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { SourceMaterial } from '../types/source'
import { buildMicrobeGeometry } from './procedural/microbe'
import { buildSubstanceGeometry } from './procedural/substance'
import { disposeLook, materialLook } from './materialLook'
import type { Detail } from './procedural/plant'

/* ------------------------------------------------------------------ *
 * One source material, drawn.
 *
 * The Rasashala's answer to PlantObject: pick the generator the spec asks
 * for, build (or take from cache) the geometry, and stand it where it is
 * put. Two meshes, because every generator returns a body and an accent.
 *
 * A colony and a lump of cinnabar are described at completely different
 * scales, so nothing here trusts the spec's `size` for placement: the
 * built bounds are measured and scaled to the `fit` the shelf asks for.
 * That is also what lets the same material appear small on a shelf and
 * large on a workbench without a second spec.
 * ------------------------------------------------------------------ */

export interface MaterialObjectProps {
  material: SourceMaterial
  position: [number, number, number]
  /** Tallest dimension, in metres, once placed. */
  fit: number
  detail?: Detail
  rotation?: number
  /** Pointer on it, or off it (null). Carries the screen point for the card. */
  onRead?: (id: string | null, clientX?: number, clientY?: number) => void
  onSelect?: (id: string) => void
  /** Drawn a little brighter, for the one the panel is showing. */
  highlighted?: boolean
}

export function MaterialObject({
  material,
  position,
  fit,
  detail = 'high',
  rotation = 0,
  onRead,
  onSelect,
  highlighted = false,
}: MaterialObjectProps) {
  const spec = material.model
  const built = useMemo(
    () =>
      spec.draw === 'microbe'
        ? buildMicrobeGeometry(material.id, spec, detail)
        : buildSubstanceGeometry(material.id, spec, detail),
    [material.id, spec, detail],
  )

  /* Scale from the built extents, and lift the piece so its lowest point sits
   * on y = 0 — a colony is built around the origin and a pot on its base, and
   * a shelf should not have to know which. */
  const { scale, lift } = useMemo(() => {
    const size = built.bounds.getSize(new THREE.Vector3())
    const largest = Math.max(size.x, size.y, size.z) || 1
    const s = fit / largest
    return { scale: s, lift: -built.bounds.min.y * s }
  }, [built, fit])

  // Surfaces come from one place, so a pearl shimmers the same way on a shelf,
  // in the viewer and on its card.
  const materials = useMemo(() => materialLook(spec), [spec])
  useEffect(() => () => disposeLook(materials), [materials])
  const liquid = built.liquid

  // Highlighting is a property of the material, not a second mesh: the one the
  // panel is showing lifts slightly out of the shelf's gloom. It is set on the
  // material rather than rebuilt with it, so a hover does not churn two
  // materials per object across twenty objects.
  useLayoutEffect(() => {
    const glow = highlighted ? 0.22 : 0
    materials.body.emissive = new THREE.Color(spec.color)
    materials.body.emissiveIntensity = glow
    materials.accent.emissive = new THREE.Color(spec.accent ?? spec.color)
    materials.accent.emissiveIntensity = glow
  }, [materials, highlighted, spec])

  const read = onRead
    ? (e: { stopPropagation: () => void; clientX: number; clientY: number }) => {
        e.stopPropagation()
        onRead(material.id, e.clientX, e.clientY)
      }
    : undefined

  return (
    <group
      position={[position[0], position[1] + lift, position[2]]}
      rotation={[0, rotation, 0]}
      scale={scale}
      onPointerOver={read}
      onPointerMove={read}
      onPointerOut={onRead ? () => onRead(null) : undefined}
      onClick={
        onSelect
          ? (e) => {
              e.stopPropagation()
              onSelect(material.id)
            }
          : undefined
      }
    >
      {/* Liquid first, so a glass body drawn after it is seen through to it. */}
      {liquid && <mesh geometry={liquid} material={materials.liquid} renderOrder={0} />}
      <mesh geometry={built.body} material={materials.body} castShadow receiveShadow renderOrder={1} />
      {built.accent && <mesh geometry={built.accent} material={materials.accent} castShadow />}
    </group>
  )
}
