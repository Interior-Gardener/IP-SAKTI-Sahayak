import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { hashSeed, makeRng } from './procedural/rng'

/* ------------------------------------------------------------------ *
 * The Rasashala's furniture: what makes the hall a working pharmacy
 * rather than four benches in a box.
 *
 * None of this is a material and none of it carries a legal layer — it is
 * scenery, the way the garden's hedges are. It is also cheap on purpose:
 * the storage jars are two instanced meshes however many there are, and
 * the furnace's glow is one flickering light.
 * ------------------------------------------------------------------ */

/** Shelf heights, floor to board. */
const LEVELS = [0.55, 1.15, 1.75, 2.35]

const JAR_COLOURS = ['#8a5a3c', '#6f4a33', '#a0714c', '#5a6b5e', '#7b6a4f', '#94603f', '#4f5d6a', '#b08a5a']

/** A turned storage jar, one unit tall; the shelf scales each instance. */
function jarGeometry(): THREE.LatheGeometry {
  const profile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.3, 0),
    new THREE.Vector2(0.4, 0.12),
    new THREE.Vector2(0.44, 0.45),
    new THREE.Vector2(0.36, 0.78),
    new THREE.Vector2(0.24, 0.88),
    new THREE.Vector2(0.26, 0.96),
    new THREE.Vector2(0.001, 0.96),
  ]
  return new THREE.LatheGeometry(profile, 14)
}

/**
 * Shelving along a wall, stocked. Every pharmacy's back wall is jars of what
 * it keeps; the ones on the benches are the twenty the visitor can open.
 */
export function WallShelf({
  x,
  z,
  length,
  facing,
  dark,
  seed,
}: {
  x: number
  z: number
  length: number
  /** +1 when the shelf faces east (it stands on the west wall). */
  facing: 1 | -1
  dark: boolean
  seed: string
}) {
  const depth = 0.42
  const jars = useMemo(() => {
    const rng = makeRng(hashSeed(`shelf-${seed}`))
    const out: { y: number; z: number; s: number; w: number; color: string }[] = []
    for (const y of LEVELS) {
      let at = -length / 2 + 0.2
      while (at < length / 2 - 0.2) {
        const s = rng.range(0.2, 0.34)
        const w = rng.range(0.85, 1.15)
        out.push({ y, z: at + (s * w) / 2, s, w, color: JAR_COLOURS[Math.floor(rng.next() * JAR_COLOURS.length)] })
        at += s * w * 0.9 + rng.range(0.04, 0.16)
      }
    }
    return out
  }, [length, seed])

  const jar = useMemo(() => jarGeometry(), [])
  const lid = useMemo(() => new THREE.CylinderGeometry(0.27, 0.27, 0.06, 12), [])
  const bodies = useRef<THREE.InstancedMesh>(null)
  const lids = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const colour = new THREE.Color()
    jars.forEach((j, i) => {
      m.compose(new THREE.Vector3(0, j.y, j.z), q, new THREE.Vector3(j.s * j.w, j.s, j.s * j.w))
      bodies.current?.setMatrixAt(i, m)
      bodies.current?.setColorAt(i, colour.set(j.color))
      m.compose(new THREE.Vector3(0, j.y + j.s * 0.97, j.z), q, new THREE.Vector3(j.s * j.w, j.s, j.s * j.w))
      lids.current?.setMatrixAt(i, m)
    })
    if (bodies.current) {
      bodies.current.instanceMatrix.needsUpdate = true
      if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    }
    if (lids.current) lids.current.instanceMatrix.needsUpdate = true
  }, [jars])

  const wood = dark ? '#2e241b' : '#6e5337'
  return (
    <group position={[x, 0, z]}>
      {/* Uprights and boards. */}
      {[-1, 1].map((end) => (
        <mesh key={end} position={[0, 1.35, end * (length / 2)]} castShadow>
          <boxGeometry args={[depth, 2.7, 0.06]} />
          <meshStandardMaterial color={wood} roughness={0.8} />
        </mesh>
      ))}
      {LEVELS.map((y) => (
        <mesh key={y} position={[0, y - 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[depth, 0.04, length]} />
          <meshStandardMaterial color={wood} roughness={0.75} />
        </mesh>
      ))}
      <group position={[facing * 0.02, 0, 0]}>
        <instancedMesh ref={bodies} args={[jar, undefined, jars.length]} castShadow>
          <meshPhysicalMaterial roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.4} />
        </instancedMesh>
        <instancedMesh ref={lids} args={[lid, undefined, jars.length]}>
          <meshStandardMaterial color={dark ? '#8d8574' : '#e6ddc8'} roughness={0.95} />
        </instancedMesh>
      </group>
    </group>
  )
}

/**
 * The bhatti: the furnace every rasa preparation passes through. Brick, a
 * glowing mouth, a crucible on top and a flue to the roof. The glow flickers
 * — slowly, and not at all when motion is reduced.
 */
export function Bhatti({ x, z, rotation = 0, dark, still }: { x: number; z: number; rotation?: number; dark: boolean; still: boolean }) {
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  const lamp = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (still) return
    const t = clock.elapsedTime
    const f = 0.82 + Math.sin(t * 3.1) * 0.08 + Math.sin(t * 7.3 + 1.7) * 0.06 + Math.sin(t * 13.7) * 0.04
    if (glow.current) glow.current.emissiveIntensity = 2.4 * f
    if (lamp.current) lamp.current.intensity = (dark ? 6 : 2.5) * f
  })
  const brick = dark ? '#4a2a22' : '#9a5a44'
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.9, 1.1]} />
        <meshStandardMaterial color={brick} roughness={0.95} />
      </mesh>
      {/* Mortar courses, so it reads as brick and not as a red box. */}
      {[0.15, 0.3, 0.45, 0.6, 0.75].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.112, 0.012, 1.112]} />
          <meshStandardMaterial color={dark ? '#5a4a40' : '#c9b8a2'} roughness={1} />
        </mesh>
      ))}
      {/* The mouth, and the fire in it. */}
      <mesh position={[0.556, 0.32, 0]}>
        <boxGeometry args={[0.02, 0.34, 0.44]} />
        <meshStandardMaterial ref={glow} color="#2a0f05" emissive="#ff6a1a" emissiveIntensity={2.4} />
      </mesh>
      <pointLight ref={lamp} position={[0.9, 0.4, 0]} color="#ff8a3a" intensity={dark ? 6 : 2.5} distance={4.5} decay={2} />
      {/* The crucible on the top plate. */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.11, 0.18, 16]} />
        <meshStandardMaterial color={dark ? '#3a3632' : '#6d6760'} roughness={0.8} />
      </mesh>
      {/* The flue, up to the roof line. */}
      <mesh position={[-0.3, 2.2, -0.3]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 2.7, 12]} />
        <meshStandardMaterial color={dark ? '#2a2826' : '#4f4a45'} roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * The khalva yantra: the stone mortar that most of rasa shastra is ground in,
 * with its pestle resting across it. On a low stand of its own.
 */
export function Khalva({ x, z, rotation = 0, dark }: { x: number; z: number; rotation?: number; dark: boolean }) {
  const bowl = useMemo(() => {
    const profile = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.26, 0),
      new THREE.Vector2(0.3, 0.1),
      new THREE.Vector2(0.28, 0.2),
      new THREE.Vector2(0.22, 0.2),
      new THREE.Vector2(0.18, 0.1),
      new THREE.Vector2(0.001, 0.08),
    ]
    return new THREE.LatheGeometry(profile, 24)
  }, [])
  const stone = dark ? '#4b4a47' : '#8d8a84'
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.6, 16]} />
        <meshStandardMaterial color={dark ? '#2e241b' : '#6e5337'} roughness={0.85} />
      </mesh>
      <mesh geometry={bowl} position={[0, 0.6, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      {/* A dark paste in the bottom: something mid-grind. */}
      <mesh position={[0, 0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.17, 20]} />
        <meshStandardMaterial color="#26221e" roughness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.8, 0.02]} rotation={[0, 0, 0.95]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.42, 10]} />
        <meshStandardMaterial color={stone} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** High windows: the hall's daylight, lit as panes by the sky colour. */
export function Windows({
  panes,
  sky,
  dark,
}: {
  panes: { x: number; z: number; rotation: number }[]
  sky: string
  dark: boolean
}) {
  const frame = dark ? '#1d1a17' : '#5e4a36'
  return (
    <group>
      {panes.map((p, i) => (
        <group key={i} position={[p.x, 2.75, p.z]} rotation={[0, p.rotation, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 1.2, 0.08]} />
            <meshStandardMaterial color={frame} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.32, 1.02]} />
            <meshStandardMaterial color={sky} emissive={sky} emissiveIntensity={dark ? 0.25 : 0.9} roughness={0.3} />
          </mesh>
          {/* Glazing bars. */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.04, 1.02, 0.02]} />
            <meshStandardMaterial color={frame} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[1.32, 0.04, 0.02]} />
            <meshStandardMaterial color={frame} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** A long cotton runner down the aisle: the way in, and the way to walk. */
export function AisleRunner({ fromZ, toZ, dark }: { fromZ: number; toZ: number; dark: boolean }) {
  const length = toZ - fromZ
  return (
    <group position={[0, 0.004, (fromZ + toZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[2.1, length]} />
        <meshStandardMaterial color={dark ? '#3a1f1c' : '#8e3b2e'} roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.001]} receiveShadow>
        <planeGeometry args={[1.7, length - 0.4]} />
        <meshStandardMaterial color={dark ? '#2a2733' : '#3d4a6b'} roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.002]} receiveShadow>
        <planeGeometry args={[1.5, length - 0.6]} />
        <meshStandardMaterial color={dark ? '#3a1f1c' : '#9c4636'} roughness={1} />
      </mesh>
    </group>
  )
}
