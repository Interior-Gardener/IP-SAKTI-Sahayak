import { useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { useDetail, dprFor } from '../hooks/useDetail'
import { daylightAt } from './daylight'
import { CultureDish, GroundPlane, LabelBoard, SignBoard, type BoardRead } from './scenery'
import { MaterialObject } from './MaterialObject'
import { AisleRunner, Bhatti, Khalva, WallShelf, Windows } from './rasashalaProps'
import { useGarden } from '../store/useGarden'
import { buildSubstanceGeometry } from './procedural/substance'
import { WalkControls, type Obstacle, type WalkTarget } from './WalkControls'
import { SHELVES, materials, materialsOnShelf } from '../data/materials'
import type { Detail } from './procedural/plant'
import type { Shelf, SourceMaterial } from '../types/source'

/* ------------------------------------------------------------------ *
 * The Rasashala — the pharmacy and laboratory.
 *
 * A hall rather than a garden: stone floor, plastered walls, open to the
 * sky at the ridge so the daylight model still drives it. Four areas off
 * a central aisle, each with a sign at its head:
 *
 *      fermentation hall  |  culture vault        (north, the working end)
 *      -------------------+------------------
 *      animal shelf       |  rasa shelf           (south, the storage end)
 *
 * Every object on a bench is a generated material — the same
 * `SourceMaterial` the IP layer is written against, so hovering a pot of
 * mercury and hovering a turmeric plant lead to the same kind of answer.
 * ------------------------------------------------------------------ */

/** The hall, in metres, laid out like the garden: +X east, -Z north. */
export const HALL = {
  width: 17,
  length: 23,
  wallHeight: 4.2,
  /** Half-width of the aisle down the middle. */
  aisleHalf: 1.6,
  /** The doorway sits on the south wall, on the axis. */
  door: { z: 11.5, halfWidth: 1.5 },
} as const

/** Where each area's bench stands, and which way it faces. */
const AREAS: Record<Shelf, { x: number; z: number; rotation: number; benchLength: number }> = {
  fermentation: { x: -4.6, z: -6.5, rotation: 0, benchLength: 6.4 },
  vault: { x: 4.6, z: -6.5, rotation: 0, benchLength: 5.2 },
  animal: { x: -4.6, z: 2.2, rotation: 0, benchLength: 6.4 },
  rasa: { x: 4.6, z: 2.2, rotation: 0, benchLength: 5.6 },
}

/** The furniture that is not a bench: where it stands, and what it keeps clear. */
const FURNITURE = {
  westShelf: { x: -HALL.width / 2 + 0.41, z: 2.2, length: 5 },
  eastShelf: { x: HALL.width / 2 - 0.41, z: -2.4, length: 2.4 },
  bhatti: { x: HALL.width / 2 - 0.9, z: 0.4 },
  khalva: { x: HALL.width / 2 - 1.1, z: 4.6 },
} as const

/** Bench top height — everything on a bench stands on this. */
const BENCH_Y = 0.92

export interface RasashalaPlacement {
  material: SourceMaterial
  position: [number, number, number]
  fit: number
}

/**
 * Where every material stands. Computed once: the benches are a fixed
 * length, so the materials on one are spread evenly along it and a shelf
 * that gains a material re-spaces itself rather than overflowing.
 */
export function placements(): RasashalaPlacement[] {
  const out: RasashalaPlacement[] = []
  for (const shelf of SHELVES) {
    const area = AREAS[shelf.id]
    const members = materialsOnShelf(shelf.id)
    const span = area.benchLength - 1.2
    members.forEach((material, i) => {
      const t = members.length === 1 ? 0.5 : i / (members.length - 1)
      const z = area.z - span / 2 + t * span
      out.push({
        material,
        // Everything stands on its bench. Nothing is put on the floor: a
        // colony left at ground level ends up behind the bench legs, which is
        // exactly how the first version of this scene looked.
        position: [area.x, BENCH_Y, z],
        // A colony is shown on a dish, spread out to be looked at; a pot or a
        // lump is shown at the size it would sit on a shelf.
        // Big enough to read from the aisle: at shelf size a pot of ghee was a
        // speck beside the storage jars on the wall.
        fit: material.kind === 'microbe' ? 0.44 : 0.56,
      })
    })
  }
  return out
}

/** Which side of a bench the aisle is on: +1 when the aisle is east of it. */
function aisleSide(x: number): 1 | -1 {
  return x < 0 ? 1 : -1
}

/** Walls with a gap for the door, and the low plinths the benches sit on. */
function Shell({ dark }: { dark: boolean }) {
  const wall = dark ? '#2b2724' : '#d8cdb8'
  const trim = dark ? '#1d1a17' : '#8c7355'
  const halfW = HALL.width / 2
  const northZ = -HALL.length / 2
  const southZ = HALL.length / 2
  const h = HALL.wallHeight
  // The south wall is two pieces with the doorway between them.
  const southRun = (halfW - HALL.door.halfWidth) / 2 + HALL.door.halfWidth / 2
  return (
    <group>
      {/* North, east, west */}
      <mesh position={[0, h / 2, northZ]} receiveShadow castShadow>
        <boxGeometry args={[HALL.width, h, 0.4]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * halfW, h / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, h, HALL.length]} />
          <meshStandardMaterial color={wall} roughness={0.95} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`s${side}`} position={[side * southRun, h / 2, southZ]} receiveShadow castShadow>
          <boxGeometry args={[halfW - HALL.door.halfWidth, h, 0.4]} />
          <meshStandardMaterial color={wall} roughness={0.95} />
        </mesh>
      ))}
      {/* A lintel over the doorway, so the gap reads as a door and not a hole. */}
      <mesh position={[0, h - 0.5, southZ]} castShadow>
        <boxGeometry args={[HALL.door.halfWidth * 2 + 0.6, 1, 0.45]} />
        <meshStandardMaterial color={trim} roughness={0.8} />
      </mesh>
      {/* The band of colour along the foot of every wall, as in an old hall. */}
      <mesh position={[0, 0.22, northZ + 0.21]}>
        <planeGeometry args={[HALL.width, 0.44]} />
        <meshStandardMaterial color={trim} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** A work bench: a slab on two piers, one per area. */
function Bench({ x, z, length, dark }: { x: number; z: number; length: number; dark: boolean }) {
  const top = dark ? '#3a332c' : '#9d8a6f'
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, BENCH_Y - 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.5, 0.1, length]} />
        <meshStandardMaterial color={top} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, (BENCH_Y - 0.1) / 2, side * (length / 2 - 0.5)]} receiveShadow castShadow>
          <boxGeometry args={[1.2, BENCH_Y - 0.1, 0.4]} />
          <meshStandardMaterial color={dark ? '#241f1a' : '#7d6a52'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * The vats. The fermentation hall is where an asava is left to work for a
 * fortnight, and the vessels that happens in are the size of the room — so
 * they stand on the floor along the wall, not on the bench, and they are
 * scenery rather than materials: what ferments is on the bench in front of
 * them, and that is what carries a legal layer.
 */
function Vats({ x, z, dark, detail }: { x: number; z: number; dark: boolean; detail: Detail }) {
  const built = useMemo(
    () =>
      [0, 1, 2].map((i) =>
        buildSubstanceGeometry(
          `rasashala-vat-${i}`,
          { form: 'vessel', size: 1.25, color: '#7a5a3c', accent: '#d9cdb4', roughness: 0.85 },
          detail,
        ),
      ),
    [detail],
  )
  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: dark ? '#4a3626' : '#8a6644', roughness: 0.9 }),
      cloth: new THREE.MeshStandardMaterial({ color: dark ? '#8d8574' : '#e6ddc8', roughness: 0.95 }),
    }),
    [dark],
  )
  return (
    <group position={[x, 0, z]}>
      {built.map((vat, i) => (
        <group key={i} position={[0, 0, (i - 1) * 1.7]} rotation={[0, i * 1.1, 0]}>
          <mesh geometry={vat.body} material={materials.body} castShadow receiveShadow />
          {vat.accent && <mesh geometry={vat.accent} material={materials.cloth} castShadow />}
        </group>
      ))}
    </group>
  )
}

/**
 * The vault's rack of vials — what a deposited strain actually lives in.
 *
 * On its own stand against the wall rather than on the bench: the bench is
 * for the cultures being looked at, and a rack set among them covered the one
 * at that end of it.
 */
function VialRack({ x, z, dark }: { x: number; z: number; dark: boolean }) {
  const glass = dark ? '#5d6a70' : '#b7c6cc'
  const top = 0.78
  return (
    <group position={[x, 0, z]}>
      {/* The stand. */}
      <mesh position={[0, top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, top, 1.5]} />
        <meshStandardMaterial color={dark ? '#26221d' : '#6f6055'} roughness={0.9} />
      </mesh>
      <mesh position={[0, top + 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.04, 1.6]} />
        <meshStandardMaterial color={dark ? '#2b2f31' : '#8d9499'} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Two rows of vials, capped. A deposit is a small thing kept carefully. */}
      {[-0.55, -0.18, 0.18, 0.55].map((dz) =>
        [-0.22, 0.22].map((dx) => (
          <group key={`${dx}-${dz}`} position={[dx, top + 0.04, dz]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.042, 0.042, 0.24, 12]} />
              <meshStandardMaterial
                color={glass}
                roughness={0.2}
                metalness={0.08}
                transparent
                opacity={0.72}
              />
            </mesh>
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.046, 0.046, 0.035, 12]} />
              <meshStandardMaterial color={dark ? '#7a5a3c' : '#c08b4e'} roughness={0.7} />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

interface ContentsProps {
  detail: Detail
  timeOfDay: number
  selected: string | null
  walking?: boolean
  onRead?: BoardRead
  onSelect?: (id: string) => void
  onWalkExit?: () => void
  onWalkAim?: (id: string | null) => void
}

function SceneContents({
  detail,
  timeOfDay,
  selected,
  walking,
  onRead,
  onSelect,
  onWalkExit,
  onWalkAim,
}: ContentsProps) {
  const light = daylightAt(timeOfDay)
  const dark = light.dark
  const shadows = detail !== 'low'
  const still = useGarden((s) => s.reducedMotion)
  const stands = useMemo(() => placements(), [])

  /* Aim targets and obstacles for walking: the benches block the feet, and
   * every material is something the crosshair can settle on. */
  const walkTargets: WalkTarget[] = useMemo(
    () =>
      stands.map(({ material, position, fit }) => ({
        id: material.id,
        height: fit,
        position,
        scale: 1,
      })),
    [stands],
  )
  /* The label boards are aimed at separately, the way the garden's are: a
   * crosshair on a board means "read this", and standing beside a bench you
   * are as likely to be looking at the plate as at the pot. */
  const walkBoards = useMemo(
    () =>
      stands.map(({ material, position }) => ({
        plantId: material.id,
        position: [position[0] + aisleSide(position[0]) * 1.05, 0, position[2]] as [
          number,
          number,
          number,
        ],
      })),
    [stands],
  )

  const obstacles: Obstacle[] = useMemo(
    () => [
      ...SHELVES.map(({ id }) => {
        const a = AREAS[id]
        return { kind: 'rect' as const, x: a.x, z: a.z, halfX: 0.9, halfZ: a.benchLength / 2 + 0.3 }
      }),
      // The vats and the vial stand are furniture too, and walking through a
      // vat of fermenting arishta is not a feature.
      { kind: 'rect' as const, x: AREAS.fermentation.x - 2.4, z: AREAS.fermentation.z, halfX: 0.7, halfZ: 2.6 },
      { kind: 'rect' as const, x: AREAS.vault.x + 2.4, z: AREAS.vault.z, halfX: 0.55, halfZ: 0.9 },
      { kind: 'rect' as const, x: FURNITURE.westShelf.x, z: FURNITURE.westShelf.z, halfX: 0.3, halfZ: FURNITURE.westShelf.length / 2 + 0.1 },
      { kind: 'rect' as const, x: FURNITURE.eastShelf.x, z: FURNITURE.eastShelf.z, halfX: 0.3, halfZ: FURNITURE.eastShelf.length / 2 + 0.1 },
      { kind: 'rect' as const, x: FURNITURE.bhatti.x, z: FURNITURE.bhatti.z, halfX: 0.65, halfZ: 0.65 },
      { kind: 'rect' as const, x: FURNITURE.khalva.x, z: FURNITURE.khalva.z, halfX: 0.45, halfZ: 0.45 },
    ],
    [],
  )

  return (
    <>
      <color attach="background" args={[light.sky]} />
      <fog attach="fog" args={[light.sky, 26, 70]} />

      <hemisphereLight args={[light.hemi, light.bounce, light.ambient * 1.15]} />
      <directionalLight
        position={light.sunPosition}
        intensity={light.sunIntensity * 0.9}
        color={light.sun}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={44}
        shadow-bias={-0.0015}
      />
      {/* A warm lamp over each bench: a working pharmacy is lit indoors, and
          without this the north end of the hall is a cave at dusk. */}
      {SHELVES.map(({ id }) => (
        <pointLight
          key={id}
          position={[AREAS[id].x, 2.9, AREAS[id].z]}
          intensity={dark ? 9 : 4}
          distance={9}
          decay={2}
          color={dark ? '#ffcf9b' : '#fff1de'}
        />
      ))}

      <GroundPlane width={HALL.width} depth={HALL.length} color={dark ? '#2e2a26' : '#b3a68f'} tile={2.2} seed="rasashala" />
      <Shell dark={dark} />

      {/* Something for the metals, the glass kupi and the pearls to reflect:
          a lit room built from light shapes, no HDR download. Held low so
          the plaster walls keep the daylight model's colour. */}
      <Environment resolution={64} frames={1} environmentIntensity={dark ? 0.5 : 0.85}>
        <Lightformer intensity={2} form="rect" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={14} color={light.sky} />
        <Lightformer intensity={1.2} form="rect" position={[6, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2, 1]} color="#fff0d8" />
        <Lightformer intensity={0.8} form="rect" position={[-6, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2, 1]} color="#f2e2c8" />
      </Environment>

      <Windows
        sky={light.sky}
        dark={dark}
        panes={[
          { x: -4.6, z: -HALL.length / 2 + 0.22, rotation: 0 },
          { x: 0, z: -HALL.length / 2 + 0.22, rotation: 0 },
          { x: 4.6, z: -HALL.length / 2 + 0.22, rotation: 0 },
          { x: -HALL.width / 2 + 0.22, z: -6.5, rotation: Math.PI / 2 },
          { x: -HALL.width / 2 + 0.22, z: 7.4, rotation: Math.PI / 2 },
          { x: HALL.width / 2 - 0.22, z: -6.5, rotation: -Math.PI / 2 },
          { x: HALL.width / 2 - 0.22, z: 7.4, rotation: -Math.PI / 2 },
        ]}
      />
      <AisleRunner fromZ={-10.4} toZ={HALL.length / 2 - 0.3} dark={dark} />
      <WallShelf {...FURNITURE.westShelf} facing={1} dark={dark} seed="west" />
      <WallShelf {...FURNITURE.eastShelf} facing={-1} dark={dark} seed="east" />
      <Bhatti x={FURNITURE.bhatti.x} z={FURNITURE.bhatti.z} rotation={Math.PI} dark={dark} still={still} />
      <Khalva x={FURNITURE.khalva.x} z={FURNITURE.khalva.z} dark={dark} />

      {SHELVES.map(({ id, title, blurb }) => {
        const a = AREAS[id]
        return (
          <group key={id}>
            <Bench x={a.x} z={a.z} length={a.benchLength} dark={dark} />
            <SignBoard
              position={[a.x, 0, a.z + a.benchLength / 2 + 1.1]}
              rotation={a.rotation}
              title={title}
              blurb={blurb}
              dark={dark}
              showText={detail !== 'low'}
            />
          </group>
        )
      })}

      <Vats x={AREAS.fermentation.x - 2.4} z={AREAS.fermentation.z} dark={dark} detail={detail} />
      <VialRack x={AREAS.vault.x + 2.4} z={AREAS.vault.z} dark={dark} />

      {stands.map(({ material, position, fit }) => {
        const side = aisleSide(position[0])
        return (
          <group key={material.id}>
            {material.kind === 'microbe' && (
              <CultureDish
                position={[position[0], position[1], position[2]]}
                dark={dark}
                id={material.id}
                tint={material.model.accent ?? material.model.color}
                scale={1.5}
              />
            )}
            <MaterialObject
              material={material}
              position={[position[0], position[1] + (material.kind === 'microbe' ? 0.024 : 0), position[2]]}
              fit={fit}
              detail={detail}
              highlighted={selected === material.id}
              onRead={walking ? undefined : onRead}
              onSelect={onSelect}
            />
            {/* Every material gets its own plate on the aisle side of the
                bench, as the garden's plants do: the name in the tradition,
                and the scientific identity under it. */}
            <LabelBoard
              id={material.id}
              title={material.sanskrit ?? material.name}
              subtitle={material.scientific}
              position={[position[0] + side * 1.05, 0, position[2]]}
              rotation={(side * Math.PI) / 2}
              dark={dark}
              /* The garden runs a step down from the viewer, so this is never
                 'high' — asking for it printed only the posts. */
              showText={detail !== 'low'}
              onRead={walking ? undefined : onRead}
              accent="#b4753a"
            />
          </group>
        )
      })}

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
          bounds={{ kind: 'rect', halfX: HALL.width / 2 - 0.8, halfZ: HALL.length / 2 - 0.8 }}
          start={[0, HALL.length / 2 - 2]}
          bodyRadius={0.34}
        />
      ) : (
        <OrbitControls
          makeDefault
          enablePan
          minDistance={4}
          maxDistance={34}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1.05, -3]}
        />
      )}
    </>
  )
}

export interface RasashalaSceneProps {
  timeOfDay: number
  selected: string | null
  walking?: boolean
  onRead?: BoardRead
  onSelect?: (id: string) => void
  onWalkExit?: () => void
  onWalkAim?: (id: string | null) => void
}

export function RasashalaScene(props: RasashalaSceneProps) {
  const detail = useDetail('garden')
  return (
    <Canvas
      shadows={detail !== 'low'}
      dpr={dprFor(detail)}
      gl={{ antialias: detail !== 'low', powerPreference: 'high-performance' }}
      /* Inside the hall, on the aisle. Starting outside the south wall meant
         looking in through it — the wall's back faces are not drawn, so the
         view worked, but it began in the car park. */
      camera={{ fov: 48, near: 0.1, far: 120, position: [0, 3.6, 9.2] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
      onPointerMissed={props.walking ? undefined : () => props.onRead?.(null)}
    >
      <SceneContents {...props} detail={detail} />
    </Canvas>
  )
}

/** Every material the hall holds, in the order the areas are walked. */
export const RASASHALA_MATERIALS = materials
