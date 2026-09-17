import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Materials.
 *
 * One shared uniform block drives the wind for the entire garden, and
 * every foliage material compiles to the same program (see
 * `customProgramCacheKey`), so twenty-five species cost one shader.
 * Leaf venation is drawn in the fragment shader from the blade's own
 * UVs — no textures are downloaded or generated.
 * ------------------------------------------------------------------ */

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
}

const VERTEX_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  attribute float aFlex;
  attribute float aPhase;
  attribute float aTint;
  varying vec2 vLeafUv;
  varying float vTint;
`

const VERTEX_BODY = /* glsl */ `
  vLeafUv = uv;
  vTint = aTint;

  // Whole-plant sway: taller parts travel further, phase varies per branch
  // so neighbouring stems never move in lockstep.
  float h = max(position.y, 0.0);
  float amp = uWind * (0.010 + 0.042 * pow(h, 1.25));
  transformed.x += sin(uTime * 1.15 + aPhase + h * 1.6) * amp;
  transformed.z += cos(uTime * 0.87 + aPhase * 1.31 + h) * amp * 0.62;

  // Leaf-tip flutter, riding on top of the sway.
  float flutter = sin(uTime * 3.1 + aPhase * 2.0) * aFlex * uWind * 0.007;
  transformed.y += flutter;
  transformed.x += flutter * 1.3;
`

const FRAGMENT_HEAD = /* glsl */ `
  uniform vec3 uBackTint;
  uniform float uVein;
  uniform float uSpots;
  uniform vec3 uSpotTint;
  varying vec2 vLeafUv;
  varying float vTint;
`

const FRAGMENT_BODY = /* glsl */ `
  #ifdef ORGAN_BARK
  // Vertical fissures running the length of a woody stem.
  float fissure = abs(fract(vLeafUv.x * 9.0 + sin(vLeafUv.y * 5.0) * 0.35) - 0.5) * 2.0;
  diffuseColor.rgb *= mix(0.74, 1.06, smoothstep(0.1, 0.75, fissure));
  diffuseColor.rgb *= 1.0 + vTint * 0.085;
  #else
  // Midrib plus lateral veins arching from it toward the margin.
  float axis = abs(vLeafUv.x - 0.5);
  float midrib = 1.0 - smoothstep(0.0, 0.030, axis);
  float ribs = abs(fract((vLeafUv.y - axis * 1.5) * 8.0) - 0.5) * 2.0;
  float lateral = smoothstep(0.86, 1.0, ribs) * (1.0 - smoothstep(0.34, 0.5, axis));
  float vein = clamp(midrib + lateral * 0.65, 0.0, 1.0) * uVein;
  diffuseColor.rgb *= mix(1.0, 0.76, vein);

  #ifdef ORGAN_SPOTS
  // Aloe's pale flecking: one blotch per cell of a grid stretched along the
  // blade, thinning out toward the tip the way the spots fade as a leaf ages.
  vec2 cell = vLeafUv * vec2(3.0, 16.0);
  vec2 id = floor(cell);
  float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
  vec2 jitter = vec2(fract(h * 17.0), fract(h * 31.0)) - 0.5;
  float d = length((fract(cell) - 0.5 - jitter * 0.55) * vec2(1.0, 2.6));
  float blotch = (1.0 - smoothstep(0.12, 0.34, d)) * step(0.42, h);
  blotch *= smoothstep(0.02, 0.22, vLeafUv.y) * (1.0 - smoothstep(0.55, 0.98, vLeafUv.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, uSpotTint, blotch * uSpots);
  #endif

  // Per-leaf tonal variation, and a paler underside on backfaces.
  diffuseColor.rgb *= 1.0 + vTint * 0.085;
  if (!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, uBackTint, 0.72);
  #endif
`

export interface OrganMaterialOptions {
  color: string
  /** Underside / shaded colour, blended on backfaces. */
  backColor?: string
  gloss?: number
  /** 0 disables venation — right for stems, fruit and petals. */
  veins?: number
  side?: THREE.Side
  /** Skips the wind displacement, for rhizomes sitting in the soil. */
  still?: boolean
  /** Draws vertical fissures instead of venation — for woody trunks. */
  bark?: boolean
  /** Pale flecking across the blade, 0–1 — the mottling on a young aloe. */
  spots?: number
  /** Colour of that flecking. */
  spotColor?: string
}

/**
 * A MeshStandardMaterial extended with the garden's wind and vein shader.
 * All variants share one compiled program.
 */
export function createOrganMaterial(opts: OrganMaterialOptions): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(opts.color),
    roughness: THREE.MathUtils.clamp(1 - (opts.gloss ?? 0.25) * 0.6, 0.25, 1),
    metalness: 0,
    side: opts.side ?? THREE.DoubleSide,
  })

  const backTint = new THREE.Color(opts.backColor ?? opts.color)
  const vein = { value: opts.veins ?? 0 }
  const still = opts.still ?? false
  const bark = opts.bark ?? false
  const spots = opts.spots ?? 0
  const spotTint = new THREE.Color(opts.spotColor ?? '#e8f0e2')

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime
    shader.uniforms.uWind = { value: still ? 0 : 1 }
    shader.uniforms.uBackTint = { value: backTint }
    shader.uniforms.uVein = vein
    shader.uniforms.uSpots = { value: spots }
    shader.uniforms.uSpotTint = { value: spotTint }

    shader.vertexShader = VERTEX_HEAD + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${VERTEX_BODY}`,
    )

    const defines = (bark ? '#define ORGAN_BARK\n' : '') + (spots > 0 ? '#define ORGAN_SPOTS\n' : '')
    shader.fragmentShader = defines + FRAGMENT_HEAD + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>\n${FRAGMENT_BODY}`,
    )
  }

  // A small fixed set of variants, so the whole garden shares a few programs.
  material.customProgramCacheKey = () =>
    `organ-${still ? 'still' : 'wind'}-${bark ? 'bark' : 'smooth'}-${spots > 0 ? 'spotted' : 'plain'}`

  return material
}

/** Advances the shared wind clock. Called once per frame from the scene. */
export function tickWind(elapsed: number, strength: number) {
  windUniforms.uTime.value = elapsed
  windUniforms.uWind.value = strength
}

/** Soil colours per habitat, used for the disc beneath each plant. */
export const groundColors: Record<string, string> = {
  soil: '#5a4632',
  sand: '#a68e63',
  water: '#3f5a4a',
  rock: '#7b7466',
}
