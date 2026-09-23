import * as THREE from 'three'
import type { MaterialModelSpec } from '../types/source'

/* ------------------------------------------------------------------ *
 * What a material's surface is made of.
 *
 * Geometry says what shape a thing is; this says what it would feel like
 * to pick up. A pearl and a pebble are the same sphere until one of them
 * shimmers, and a kupi is only a glass flask if you can see the mercury
 * through it. Every scene that draws a material (the Rasashala, the
 * specimen viewer, the thumbnails) takes its surfaces from here, so the
 * same material never looks like two different things on two pages.
 *
 * MeshPhysicalMaterial throughout: clearcoat, sheen and iridescence are
 * what separate glaze from clay, wet from dry and nacre from chalk, and
 * none of them cost a texture.
 * ------------------------------------------------------------------ */

export interface MaterialLook {
  body: THREE.MeshPhysicalMaterial
  accent: THREE.MeshPhysicalMaterial
  liquid: THREE.MeshPhysicalMaterial
}

type Params = THREE.MeshPhysicalMaterialParameters

function bodyParams(spec: MaterialModelSpec): Params {
  const color = new THREE.Color(spec.color)
  if (spec.draw === 'microbe') {
    // A living cell under a microscope is mostly water behind a thin wall: it
    // is seen through, which is what lets the nucleoid, the vacuole or the
    // spore inside it show. Spirulina's filament is packed with pigment, so it
    // is nearly opaque. The sheen field is how wet and glossy the wall looks.
    const sheen = spec.sheen ?? 0.4
    const pigmented = spec.form === 'trichome' || spec.form === 'hypha'
    return {
      color,
      roughness: 0.35 - sheen * 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 0.6,
      sheenColor: color.clone().lerp(new THREE.Color('#ffffff'), 0.6),
      transparent: !pigmented,
      opacity: pigmented ? 1 : 0.58,
    }
  }
  const metalness = spec.metalness ?? 0
  const roughness = spec.roughness ?? 0.6
  switch (spec.form) {
    case 'pearl':
      // Nacre: thin layers that split the light, which is iridescence.
      return {
        color,
        roughness: Math.min(roughness, 0.22),
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 1,
        iridescenceIOR: 1.55,
        iridescenceThicknessRange: [180, 520],
      }
    case 'conch':
      return { color, roughness, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.3 }
    case 'honeycomb':
      // Wax is soft and faintly translucent at the edges.
      return { color, roughness: 0.55, metalness: 0, sheen: 0.5, sheenColor: new THREE.Color('#fff2c4') }
    case 'coral':
      return { color, roughness, metalness: 0, sheen: 0.45, sheenColor: color.clone().offsetHSL(0, -0.1, 0.25) }
    case 'ingot':
      // A polished bar is mostly what it reflects, so it takes more of the room.
      return { color, roughness, metalness, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 1.8 }
    case 'rock':
      if (spec.variant === 'crystals') {
        // Crystal faces are flat and catch the light one face at a time.
        return { color, roughness: Math.min(roughness, 0.4), metalness, clearcoat: 0.6, clearcoatRoughness: 0.15, flatShading: true }
      }
      if (spec.variant === 'pod') return { color, roughness: 0.75, metalness: 0, sheen: 0.6, sheenColor: color.clone().offsetHSL(0, 0, 0.2) }
      // A shard is faceted: its flat faces are the point, so it is shaded flat.
      return { color, roughness, metalness, flatShading: spec.variant === 'shard' }
    case 'shell':
      // The outside of a valve: chalky, ridged, dull.
      return { color, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }
    case 'powder':
      return { color, roughness: Math.max(roughness, 0.9), metalness: metalness * 0.5 }
    case 'vessel':
      if (spec.variant === 'flask') {
        // The kupi is glass. Transparency, not transmission: transmission
        // re-renders the scene per object, and twenty of those is a stutter.
        return {
          color: new THREE.Color('#dfe8ea'),
          roughness: 0.06,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          side: THREE.DoubleSide,
        }
      }
      // Fired clay under a glaze.
      return { color, roughness, metalness, clearcoat: 0.4, clearcoatRoughness: 0.35 }
  }
}

function accentParams(spec: MaterialModelSpec): Params {
  const color = new THREE.Color(spec.accent ?? spec.color)
  if (!spec.accent) color.multiplyScalar(0.7)
  const metalness = spec.draw === 'substance' ? (spec.metalness ?? 0) * 0.8 : 0.05
  if (spec.draw === 'substance' && spec.form === 'ingot') {
    // Gold leaf: brighter and rougher than the bar it was beaten from.
    return { color, roughness: 0.32, metalness: 0.9, side: THREE.DoubleSide }
  }
  if (spec.draw === 'substance' && spec.form === 'shell') {
    // The nacre lining: the same iridescence as the pearl it grew.
    return {
      color,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 1,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [200, 600],
      side: THREE.DoubleSide,
    }
  }
  if (spec.draw === 'substance' && spec.form === 'rock' && spec.variant === 'crystals') {
    // The host rock the crystals grew on: plain and matte.
    return { color, roughness: 0.95, metalness: 0 }
  }
  if (spec.draw === 'substance' && spec.form === 'powder' && spec.variant === 'mica') {
    // Mica sheets: glassy and faintly metallic, the look that names the mineral.
    return { color, roughness: 0.25, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }
  }
  if (spec.draw === 'substance' && (spec.form === 'pearl' || spec.form === 'vessel')) {
    // Cloth: a cushion, the cover tied over a jar, the seal on a kupi.
    return { color, roughness: 0.95, metalness: 0, sheen: 0.8, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') }
  }
  return { color, roughness: 0.55, metalness }
}

function liquidParams(spec: MaterialModelSpec): Params {
  if (spec.draw === 'substance' && spec.form === 'vessel') {
    // Mercury: a mirror that has been poured.
    return { color: new THREE.Color('#dfe3e8'), roughness: 0.08, metalness: 1, clearcoat: 1 }
  }
  // Honey, and anything else that pools: deep amber, wet, and lit a little
  // from within, which is the cheap stand-in for light passing through it.
  const color = new THREE.Color(spec.draw === 'substance' && spec.form === 'honeycomb' ? '#c98414' : spec.color)
  return {
    color,
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    emissive: color.clone().multiplyScalar(0.35),
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  }
}

/** Builds the three surfaces for one material. The caller owns and disposes them. */
export function materialLook(spec: MaterialModelSpec): MaterialLook {
  return {
    body: new THREE.MeshPhysicalMaterial(bodyParams(spec)),
    accent: new THREE.MeshPhysicalMaterial(accentParams(spec)),
    liquid: new THREE.MeshPhysicalMaterial(liquidParams(spec)),
  }
}

export function disposeLook(look: MaterialLook) {
  look.body.dispose()
  look.accent.dispose()
  look.liquid.dispose()
}
