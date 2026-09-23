#!/usr/bin/env node
/* Writes the verified IP profiles the web shows into the file the API serves.
 *
 * The profiles are written once, in TypeScript, beside the plants and materials
 * they describe (src/data/ipr/). The API cannot import TypeScript, so this
 * copies them into api/app/materials/profiles.json and the API seeds its
 * `material_ipr` table from that file. Only profiles somebody has verified are
 * exported: an all-'unknown' profile is what the API's 404 already means.
 *
 * Run: node scripts/export-ipr.mjs          (write)
 *      node scripts/export-ipr.mjs --check  (fail if the file is stale; CI runs this)
 */
import { createJiti } from 'jiti'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const jiti = createJiti(fileURLToPath(import.meta.url), { interopDefault: true })

const { PLANT_IPR } = await jiti.import(`${root}src/data/ipr/plant/index.ts`)
const { MATERIAL_IPR } = await jiti.import(`${root}src/data/ipr/material/index.ts`)

const out = { plant: {}, microbe: {}, animal: {}, mineral: {} }
for (const [id, profile] of [...Object.entries(PLANT_IPR), ...Object.entries(MATERIAL_IPR)]) {
  if (profile.lastVerified === null) continue
  out[profile.kind][id] = profile
}
for (const kind of Object.keys(out)) {
  out[kind] = Object.fromEntries(Object.entries(out[kind]).sort(([a], [b]) => a.localeCompare(b)))
}

const target = `${root}api/app/materials/profiles.json`
const text = `${JSON.stringify(out, null, 2)}\n`
const count = Object.values(out).reduce((n, byId) => n + Object.keys(byId).length, 0)

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf8')
  } catch {
    // A missing file is stale too.
  }
  if (current !== text) {
    console.error('api/app/materials/profiles.json is out of date: run `npm run export:ipr` and commit it.')
    process.exit(1)
  }
  console.log(`profiles.json is current: ${count} verified profiles.`)
} else {
  writeFileSync(target, text)
  console.log(`wrote ${count} verified profiles to api/app/materials/profiles.json`)
}
