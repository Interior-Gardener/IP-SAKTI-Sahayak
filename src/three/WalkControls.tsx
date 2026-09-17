import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { BED_RADIUS, FOUNTAIN_RADIUS, gardenBeds } from '../data/plants'
import { GARDEN_EXTENT } from './gardenTexture'
import { useGarden } from '../store/useGarden'
import type { Plant } from '../types/plant'

/* ------------------------------------------------------------------ *
 * Walking the garden.
 *
 * The orbit camera is a way of looking at the garden; this is a way of
 * being in it. Pointer lock for the head, WASD for the feet, and a
 * crosshair that names whatever you stop in front of.
 * ------------------------------------------------------------------ */

/** Standing eye height, in the same rough-metres the rest of the garden uses. */
const EYE = 1.62
/** How close a shoulder gets to a kerb before it stops. */
const BODY = 0.36
/**
 * How far the solver will slide someone sideways to free them. Brushing the
 * corner of a bed on the way into a narrow path should slip you into the
 * gap, not stop you dead against a wall you cannot see.
 */
const CORNER_ASSIST = 0.45
const WALK_SPEED = 2.7
const RUN_SPEED = 4.9
/** The crosshair only names things within conversational distance. */
const REACH = 7.5

/** Something you cannot walk through, in the XZ plane. */
export type Obstacle =
  | { kind?: 'circle'; x: number; z: number; r: number }
  | { kind: 'rect'; x: number; z: number; halfX: number; halfZ: number }

/** Where the walk is fenced in. */
export type Bounds =
  | { kind?: 'circle'; r: number }
  | { kind: 'rect'; halfX: number; halfZ: number; x?: number; z?: number }

/** The main garden's own furniture, used when a scene names nothing else. */
const DEFAULT_OBSTACLES: Obstacle[] = [
  ...gardenBeds.map((bed) => ({ x: bed.position[0], z: bed.position[1], r: BED_RADIUS })),
  // The fountain at the centre of the plaza. The kerb ringing the plaza
  // itself is only 6cm proud, so that one is walked over rather than around.
  { x: 0, z: 0, r: FOUNTAIN_RADIUS },
]

/** Stop short of the edge, where the ground texture fades out into haze. */
const DEFAULT_BOUNDS: Bounds = { r: GARDEN_EXTENT - 1.1 }

const KEY_MAP: Record<string, 'forward' | 'back' | 'left' | 'right'> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

const AXIS = new THREE.Vector3()
/** A standing visitor, for the solver's "which way are you going" test. */
const ZERO = new THREE.Vector2(0, 0)

/**
 * Slide a ground position out of anything solid, then back inside the
 * garden. Nudging out of each circle in turn is not a true solver, but the
 * obstacles here are far enough apart that none of them overlap, so a
 * single pass always settles.
 */
function resolve(
  p: THREE.Vector2,
  obstacles: Obstacle[],
  bounds: Bounds,
  body: number,
  motion: THREE.Vector2,
) {
  for (const o of obstacles) {
    if (o.kind === 'rect') {
      const dx = p.x - o.x
      const dz = p.y - o.z
      const overX = o.halfX + body - Math.abs(dx)
      const overZ = o.halfZ + body - Math.abs(dz)
      if (overX <= 0 || overZ <= 0) continue

      /* Which way to push. The shortest way out is the obvious answer and
       * usually the right one, but it is wrong in the case that matters
       * most here: walking west into the mouth of a cross path while a
       * hair's breadth inside the bed behind you. There the shortest way
       * out is straight back the way you came, so the path reads as sealed.
       *
       * So when someone is moving, push them across their travel instead —
       * along whichever axis they are moving least — as long as that is a
       * nudge rather than a shove. That turns clipping a bed corner into
       * slipping into the gap, which is what a person walking it would do. */
      const movingX = Math.abs(motion.x)
      const movingZ = Math.abs(motion.y)
      const moving = movingX + movingZ > 0.05
      let alongX = overX < overZ
      if (moving) {
        const acrossX = movingX < movingZ
        const acrossOver = acrossX ? overX : overZ
        if (acrossOver <= CORNER_ASSIST) alongX = acrossX
      }

      if (alongX) p.x += Math.sign(dx || 1) * overX
      else p.y += Math.sign(dz || 1) * overZ
      continue
    }
    const dx = p.x - o.x
    const dz = p.y - o.z
    const min = o.r + body
    const d2 = dx * dx + dz * dz
    if (d2 >= min * min) continue
    const d = Math.sqrt(d2)
    // Dead centre of an obstacle has no "out" direction; pick one.
    if (d < 1e-4) {
      p.set(o.x + min, o.z)
      continue
    }
    p.set(o.x + (dx / d) * min, o.z + (dz / d) * min)
  }
  if (bounds.kind === 'rect') {
    const cx = bounds.x ?? 0
    const cz = bounds.z ?? 0
    p.x = THREE.MathUtils.clamp(p.x, cx - bounds.halfX, cx + bounds.halfX)
    p.y = THREE.MathUtils.clamp(p.y, cz - bounds.halfZ, cz + bounds.halfZ)
  } else if (p.lengthSq() > bounds.r * bounds.r) {
    p.setLength(bounds.r)
  }
}

/** The minimum a scene must say about a specimen for it to be aimed at. */
export interface WalkTarget {
  plant: Plant
  position: [number, number, number]
  scale: number
}

/**
 * A label board that can be read on foot. Boards are props rather than
 * plants, so they aim as a small upright slab at reading height and report
 * separately — the crosshair on a board means "read this", not "meet this".
 */
export interface WalkBoard {
  plantId: string
  /** Foot of the post. */
  position: [number, number, number]
}

interface WalkControlsProps {
  placements: WalkTarget[]
  /** Readable label boards, if the scene has any. */
  boards?: WalkBoard[]
  /** Fired when pointer lock ends: Esc, alt-tab, or the browser deciding so. */
  onExit: () => void
  /** The plant under the crosshair, or null. */
  onAim: (plantId: string | null) => void
  onSelect: (plantId: string) => void
  /** The board under the crosshair, or null. */
  onBoardAim?: (plantId: string | null) => void
  /** Clicked while aiming at a board. */
  onBoardSelect?: (plantId: string) => void
  /** Clicked on nothing in particular. */
  onDismiss?: () => void
  /** What blocks the feet. Defaults to the main garden's beds and basin. */
  obstacles?: Obstacle[]
  /** Where the walk is fenced in. Defaults to the main garden's circle. */
  bounds?: Bounds
  /** Where to stand on entering, when the scene wants a particular spot. */
  start?: [number, number]
  /** Half a visitor's width. Narrow formal paths want a narrower walker. */
  bodyRadius?: number
}

export function WalkControls({
  placements,
  boards,
  onExit,
  onAim,
  onSelect,
  onBoardAim,
  onBoardSelect,
  onDismiss,
  obstacles = DEFAULT_OBSTACLES,
  bounds = DEFAULT_BOUNDS,
  start,
  bodyRadius = BODY,
}: WalkControlsProps) {
  const { camera, gl } = useThree()
  const reducedMotion = useGarden((s) => s.reducedMotion)

  const controls = useRef<PointerLockControlsImpl | null>(null)
  const held = useRef(new Set<string>())
  const velocity = useRef(new THREE.Vector2())
  /** Where the visitor is standing. The camera eases toward it. */
  const feet = useRef(new THREE.Vector2())
  const stride = useRef(0)
  const aimed = useRef<string | null>(null)
  const aimedBoard = useRef<string | null>(null)

  /* Aim is tested against a vertical capsule per plant rather than the real
   * foliage. The generated plants are thousands of thin leaf cards with gaps
   * you can stare clean through, and a crosshair that registers only when it
   * lands on a leaf reads as broken rather than precise. */
  const targets = useMemo(
    () =>
      placements.map(({ plant, position, scale }) => {
        const height = plant.model.height * scale
        return {
          id: plant.id,
          board: false,
          x: position[0],
          z: position[2],
          bottom: -0.1,
          top: height + 0.25,
          radius: THREE.MathUtils.clamp(height * 0.36, 0.34, 1),
        }
      }),
    [placements],
  )

  /* Boards aim as a stubby column around the plate: knee height upward, so
   * looking at the soil in front of a bed is not the same as reading its
   * board, and a little wider than the plate so the crosshair does not have
   * to be dead centre on a sign you are standing beside. */
  const boardTargets = useMemo(
    () =>
      (boards ?? []).map(({ plantId, position }) => ({
        id: plantId,
        board: true,
        x: position[0],
        z: position[2],
        bottom: position[1] + 0.45,
        top: position[1] + 1.05,
        radius: 0.42,
      })),
    [boards],
  )

  const aimTargets = useMemo(() => [...targets, ...boardTargets], [targets, boardTargets])

  /* Step in from wherever the orbit camera was watching: keep its bearing on
   * the garden, drop to standing height, and level the view so nobody starts
   * off staring at their own feet.
   *
   * This is an entry, so it must happen exactly once per mount — and it is
   * guarded rather than trusted to its dependency list, because it plants
   * the feet: if it ever ran again mid-walk it would teleport the visitor
   * back to the gate, which is precisely what it did when a prop identity
   * changed on re-render. */
  const entered = useRef(false)
  useEffect(() => {
    if (entered.current) return
    entered.current = true

    const stance = start
      ? new THREE.Vector2(start[0], start[1])
      : (() => {
          const from = new THREE.Vector2(camera.position.x, camera.position.z)
          if (from.lengthSq() < 0.04) from.set(0, 1)
          const reach = bounds.kind === 'rect' ? Math.min(bounds.halfX, bounds.halfZ) : bounds.r
          return from.clone().setLength(Math.min(from.length(), reach))
        })()
    resolve(stance, obstacles, bounds, bodyRadius, ZERO)
    feet.current.copy(stance)

    /* Face the middle of the garden, level. This is set as a bare yaw rather
     * than with lookAt, because at this instant the camera is still up on its
     * orbit — aiming it at a point on the ground would start the visitor
     * staring at their own feet, which is the thing being avoided. YXZ is the
     * order PointerLockControls reads back, so the first mouse move picks up
     * from here cleanly. */
    const inward =
      stance.lengthSq() > 0.04 ? stance.clone().negate().normalize() : new THREE.Vector2(0, -1)
    // A camera with no rotation looks down -Z, so yaw runs the other way.
    const yaw = Math.atan2(-inward.x, -inward.y)
    camera.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0, 'YXZ'))
  }, [camera, obstacles, bounds, start, bodyRadius])

  /* Take the pointer. drei only locks on a *subsequent* click, but the click
   * that turned walk mode on is the one that should have counted — and this
   * runs inside the activation window that click opened, so asking directly
   * works.
   *
   * Ask exactly once. StrictMode runs this effect, tears it down and runs it
   * again, and a second requestPointerLock while the first is still in flight
   * is rejected — which, if that rejection is read as a refusal, turns walk
   * mode off in the same breath it was turned on. The ref survives the
   * remount because StrictMode replays effects on the same instance.
   *
   * Failure is judged by the outcome rather than by the error event, for the
   * same reason: a stray error does not mean the lock did not take. If after
   * a moment nothing holds the pointer, the browser has genuinely refused —
   * back out rather than strand someone in a mode where the mouse is dead. */
  const requested = useRef(false)
  useEffect(() => {
    if (!requested.current) {
      requested.current = true
      // The canvas is the fallback because that is the element drei connects
      // the controls to, so either route captures the same thing.
      const el = controls.current?.domElement ?? gl.domElement
      el?.requestPointerLock()
    }
    const settle = window.setTimeout(() => {
      if (document.pointerLockElement) return
      console.warn('[garden] the browser would not lock the pointer; leaving walk mode')
      onExit()
    }, 700)
    return () => window.clearTimeout(settle)
  }, [onExit, gl.domElement])

  /* Keys, by physical position, so the WASD block stays under the same
   * fingers on layouts that put those letters elsewhere. */
  useEffect(() => {
    const keys = held.current
    const down = (e: KeyboardEvent) => {
      if (!KEY_MAP[e.code] && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') return
      // The arrows would otherwise scroll the page behind the canvas.
      e.preventDefault()
      keys.add(e.code)
    }
    const up = (e: KeyboardEvent) => keys.delete(e.code)
    // Losing the window mid-stride would otherwise leave a key stuck down.
    const clear = () => keys.clear()

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      keys.clear()
    }
  }, [])

  /* With the pointer locked there is nowhere else to click, so any click is
   * a click on the crosshair — and a click on empty air is how you put down
   * whatever the last one picked up. */
  useEffect(() => {
    const pick = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (aimedBoard.current) onBoardSelect?.(aimedBoard.current)
      else if (aimed.current) onSelect(aimed.current)
      else onDismiss?.()
    }
    document.addEventListener('pointerdown', pick)
    return () => document.removeEventListener('pointerdown', pick)
  }, [onSelect, onBoardSelect, onDismiss])

  // Leaving walk mode should not leave a plant lit up behind it.
  useEffect(() => () => onAim(null), [onAim])
  useEffect(() => () => onBoardAim?.(null), [onBoardAim])

  useFrame((_, rawDelta) => {
    // A backgrounded tab resumes with one enormous delta; clamp it so nobody
    // teleports through a flowerbed on the first frame back.
    const delta = Math.min(rawDelta, 0.05)
    const keys = held.current

    camera.getWorldDirection(AXIS)
    const forward = new THREE.Vector2(AXIS.x, AXIS.z)
    // Looking straight up or down leaves no heading to walk along; keep the
    // last sane one rather than freezing.
    if (forward.lengthSq() < 1e-6) forward.set(0, -1)
    forward.normalize()
    // Screen-right, on the ground plane.
    const right = new THREE.Vector2(-forward.y, forward.x)

    const wish = new THREE.Vector2()
    for (const code of keys) {
      const dir = KEY_MAP[code]
      if (dir === 'forward') wish.add(forward)
      else if (dir === 'back') wish.sub(forward)
      else if (dir === 'right') wish.add(right)
      else if (dir === 'left') wish.sub(right)
    }

    const running = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const moving = wish.lengthSq() > 1e-6
    if (moving) wish.setLength(running ? RUN_SPEED : WALK_SPEED)

    // Ease into and out of motion instead of snapping between still and full
    // speed — the difference between walking and sliding on ice. Stopping is
    // quicker than starting, which is how legs work.
    const rate = moving ? 9 : 12
    velocity.current.x = THREE.MathUtils.damp(velocity.current.x, wish.x, rate, delta)
    velocity.current.y = THREE.MathUtils.damp(velocity.current.y, wish.y, rate, delta)

    const speed = velocity.current.length()
    if (speed > 0.01) {
      feet.current.addScaledVector(velocity.current, delta)
      resolve(feet.current, obstacles, bounds, bodyRadius, velocity.current)
    }

    // The gait: a shallow rise and fall, twice per stride, scaled by how fast
    // the legs are actually going.
    let bob = 0
    if (!reducedMotion) {
      stride.current += speed * delta * 2.4
      bob = Math.sin(stride.current * Math.PI) * 0.022 * Math.min(1, speed / WALK_SPEED)
    }

    // Damping the camera onto the feet doubles as the entry glide: on the
    // first frame the feet are already standing in the garden while the
    // camera is still up on its orbit, and it swoops down to meet them.
    camera.position.x = THREE.MathUtils.damp(camera.position.x, feet.current.x, 9, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, EYE + bob, 9, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, feet.current.y, 9, delta)

    /* What the crosshair is on: the nearest capsule the view axis runs
     * through, within reach. */
    let bestId: string | null = null
    let bestBoard = false
    let bestDist = Infinity
    const hx = AXIS.x
    const hz = AXIS.z
    const hLenSq = hx * hx + hz * hz
    // Near-vertical views degenerate — nothing is meaningfully "in front".
    if (hLenSq > 1e-4) {
      for (const t of aimTargets) {
        const ox = camera.position.x - t.x
        const oz = camera.position.z - t.z
        // How far along the view axis the plant's axis comes closest.
        const s = -(ox * hx + oz * hz) / hLenSq
        if (s < 0.4 || s > REACH || s >= bestDist) continue
        const px = ox + hx * s
        const pz = oz + hz * s
        if (px * px + pz * pz > t.radius * t.radius) continue
        // ...and whether the view is at the plant's height there, or over it.
        const y = camera.position.y + AXIS.y * s
        if (y < t.bottom || y > t.top) continue
        bestId = t.id
        bestBoard = t.board
        bestDist = s
      }
    }

    const plantId = bestBoard ? null : bestId
    const boardId = bestBoard ? bestId : null
    if (plantId !== aimed.current) {
      aimed.current = plantId
      onAim(plantId)
    }
    if (boardId !== aimedBoard.current) {
      aimedBoard.current = boardId
      onBoardAim?.(boardId)
    }
  })

  /* The selector matches nothing on purpose. Left to itself drei binds a
   * click handler on the document that re-takes the pointer, which would
   * fight both ways out of here: Esc would be undone by the next click, and
   * clicking a plant would re-lock on the way to opening its card. Locking is
   * this component's own business — see the effect above. */
  return (
    <PointerLockControls
      ref={controls}
      makeDefault
      selector="[data-walk-never-matches]"
      onUnlock={onExit}
    />
  )
}
