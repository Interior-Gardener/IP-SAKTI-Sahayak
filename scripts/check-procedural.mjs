#!/usr/bin/env node
/* Builds every procedural form outside the browser.
 *
 * The generators are pure geometry — no WebGL, no DOM — so they can be run in
 * node and checked. A typecheck cannot see an empty merge, a NaN vertex from a
 * zero-length direction, or a form that quietly collapses at low detail; those
 * show up in the scene as nothing at all, which is hard to notice and harder
 * to trace. This runs every form at every detail level and fails on any of it.
 *
 * Run: node scripts/check-procedural.mjs
 */
import { createJiti } from 'jiti'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const jiti = createJiti(fileURLToPath(import.meta.url), { interopDefault: true })

const { buildMicrobeGeometry } = await jiti.import(`${root}src/three/procedural/microbe.ts`)
const { buildSubstanceGeometry } = await jiti.import(`${root}src/three/procedural/substance.ts`)

const MICROBES = ['coccus', 'bacillus', 'yeast', 'hypha', 'spirillum', 'trichome']
const SUBSTANCES = ['honeycomb', 'vessel', 'rock', 'conch', 'pearl', 'coral', 'shell', 'ingot', 'powder']
const DETAILS = ['high', 'medium', 'low']

const problems = []
let built = 0

function check(label, set) {
  const pos = set.body.attributes.position
  built += 1
  if (pos.count === 0) problems.push(`${label}: built no geometry`)
  else if (!set.body.attributes.normal) problems.push(`${label}: no normals, so it cannot be lit`)
  for (const [name, attr] of [
    ['body', pos],
    ['accent', set.accent?.attributes.position],
    ['liquid', set.liquid?.attributes.position],
  ]) {
    if (!attr) continue
    for (let i = 0; i < attr.array.length; i++) {
      if (!Number.isFinite(attr.array[i])) {
        problems.push(`${label}: ${name} has a non-finite vertex at index ${i}`)
        break
      }
    }
  }
  if (!(set.height > 0) || !(set.radius > 0)) {
    problems.push(`${label}: degenerate bounds (h=${set.height}, r=${set.radius})`)
  }
}

for (const detail of DETAILS) {
  for (const form of MICROBES) {
    const spec = { form, count: 9, size: 0.3, color: '#cfd8c5', accent: '#6b7a5e' }
    check(`microbe ${form} @${detail}`, buildMicrobeGeometry(`check-${form}`, spec, detail))
  }
  for (const form of SUBSTANCES) {
    const spec = { form, size: 0.4, color: '#d8c9a8', accent: '#8a7455' }
    check(`substance ${form} @${detail}`, buildSubstanceGeometry(`check-${form}`, spec, detail))
  }
}

/* The forms above are built from made-up specs. These are the real ones: every
 * material the Rasashala holds, built the way the scene builds it, so a spec
 * with a bad value is caught here rather than as a hole on a shelf. */
const { materials } = await jiti.import(`${root}src/data/materials/index.ts`)
const seen = new Set()
for (const material of materials) {
  if (seen.has(material.id)) problems.push(`material ${material.id}: duplicate id`)
  seen.add(material.id)
  if (!material.ipr) problems.push(`material ${material.id}: no IP profile joined`)
  const spec = material.model
  const build = spec.draw === 'microbe' ? buildMicrobeGeometry : buildSubstanceGeometry
  for (const detail of DETAILS) check(`${material.kind} ${material.id} @${detail}`, build(material.id, spec, detail))
}
console.log(`  (${materials.length} materials from src/data/materials, each at ${DETAILS.length} detail levels)`)

if (problems.length) {
  console.error(`procedural check failed (${problems.length}):\n`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`procedural check passed: ${built} builds across ${MICROBES.length + SUBSTANCES.length} forms and ${DETAILS.length} detail levels.`)
