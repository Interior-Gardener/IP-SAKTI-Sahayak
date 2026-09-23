import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { SourceMaterial } from '../types/source'
import { buildMicrobeGeometry } from './procedural/microbe'
import { buildSubstanceGeometry } from './procedural/substance'
import { disposeLook, materialLook } from './materialLook'

/* ------------------------------------------------------------------ *
 * Still pictures of the Rasashala's materials, for cards and lists.
 *
 * A plant card has a drawn botanical plate. A material has no plate, and
 * twenty live canvases on one page would be twenty WebGL contexts —
 * browsers stop at sixteen. So one hidden renderer draws each material
 * once, from the same geometry and surfaces the 3D scenes use, and hands
 * back an image. The pictures are cached for the session and made one at
 * a time, so a grid fills in without a stall.
 *
 * Where WebGL is not available the promise resolves to null and the card
 * shows its fallback; nothing here throws.
 * ------------------------------------------------------------------ */

const SIZE = 360
const cache = new Map<string, string | null>()
let queue: Promise<unknown> = Promise.resolve()
let renderer: THREE.WebGLRenderer | null | undefined
let environment: THREE.Texture | null = null
let warned = false

function getRenderer(): THREE.WebGLRenderer | null {
  if (renderer !== undefined) return renderer
  try {
    const canvas = document.createElement('canvas')
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(1)
    renderer.setSize(SIZE, SIZE, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 0)
    const pmrem = new THREE.PMREMGenerator(renderer)
    environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
  } catch (error) {
    console.warn('material thumbnails unavailable: no WebGL', error)
    renderer = null
  }
  return renderer
}

function draw(material: SourceMaterial): string | null {
  const gl = getRenderer()
  if (!gl) return null
  const spec = material.model
  const built =
    spec.draw === 'microbe'
      ? buildMicrobeGeometry(material.id, spec, 'medium')
      : buildSubstanceGeometry(material.id, spec, 'medium')
  const look = materialLook(spec)

  const scene = new THREE.Scene()
  scene.environment = environment
  scene.add(new THREE.HemisphereLight('#fff6e6', '#6e5c44', 0.9))
  const sun = new THREE.DirectionalLight('#fff1da', 2.2)
  sun.position.set(1, 2, 1.4)
  scene.add(sun)

  const group = new THREE.Group()
  if (built.liquid) group.add(new THREE.Mesh(built.liquid, look.liquid))
  const body = new THREE.Mesh(built.body, look.body)
  body.renderOrder = 1
  group.add(body)
  if (built.accent) group.add(new THREE.Mesh(built.accent, look.accent))
  // Stand it on y = 0 and turn it three-quarters on, as the viewer first shows it.
  const box = built.bounds
  group.position.y = -box.min.y
  group.rotation.y = -0.6
  scene.add(group)

  const size = box.getSize(new THREE.Vector3())
  const reach = Math.max(size.x, size.y, size.z)
  const camera = new THREE.PerspectiveCamera(30, 1, reach * 0.01, reach * 20)
  const centre = new THREE.Vector3(0, size.y * 0.48, 0)
  const distance = (reach * 0.62) / Math.tan(THREE.MathUtils.degToRad(15))
  camera.position.set(distance * 0.55, centre.y + distance * 0.45, distance * 0.7)
  camera.lookAt(centre)

  gl.render(scene, camera)
  const url = gl.domElement.toDataURL('image/png')
  disposeLook(look)
  return url
}

/** A picture of one material, made once per session. Resolves to null without WebGL. */
export function materialThumb(material: SourceMaterial): Promise<string | null> {
  if (cache.has(material.id)) return Promise.resolve(cache.get(material.id) ?? null)
  const job = queue.then(
    () =>
      new Promise<string | null>((resolve) => {
        // One per frame: the grid paints its cards first and the pictures follow.
        requestAnimationFrame(() => {
          let url: string | null = null
          try {
            url = draw(material)
          } catch (error) {
            // The card falls back to its mark; say why once, for whoever is debugging.
            if (!warned) console.warn('material thumbnails unavailable:', error)
            warned = true
            url = null
          }
          cache.set(material.id, url)
          resolve(url)
        })
      }),
  )
  queue = job
  return job
}

/** The picture for a card, or null until (or unless) there is one. */
export function useMaterialThumb(material: SourceMaterial): string | null {
  const [url, setUrl] = useState<string | null>(() => cache.get(material.id) ?? null)
  useEffect(() => {
    let live = true
    materialThumb(material).then((made) => {
      if (live) setUrl(made)
    })
    return () => {
      live = false
    }
  }, [material])
  return url
}
