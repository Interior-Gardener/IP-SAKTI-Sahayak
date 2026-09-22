#!/usr/bin/env node
/* Checks the legal claims in src/data/ipr/ against the corpus, so a profile can
 * never drift from the text it rests on.
 *
 * Two rules, both mechanical:
 *   1. every `@verify <source-id> | <locator> | <quoted text>` line in a profile
 *      must name a source in corpus/manifest.yaml, and the quoted text must
 *      still be in corpus/normalised/<source-id>.txt (whitespace ignored, since
 *      the extracted text wraps mid-sentence);
 *   2. every cite id a profile uses in its data must be a manifest id, and must
 *      be backed by at least one @verify line in the same folder.
 *
 * Run: node scripts/check-ipr-cites.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const iprDir = join(root, 'src', 'data', 'ipr')
const normalisedDir = join(root, 'corpus', 'normalised')

const flat = (s) => s.replace(/\s+/g, ' ').trim()

function manifestIds() {
  const text = readFileSync(join(root, 'corpus', 'manifest.yaml'), 'utf8')
  return new Set([...text.matchAll(/^\s*- id:\s*(\S+)/gm)].map((m) => m[1]))
}

function tsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? tsFiles(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
  )
}

const ids = manifestIds()
const corpusCache = new Map()
const corpus = (id) => {
  if (!corpusCache.has(id)) {
    const path = join(normalisedDir, `${id}.txt`)
    corpusCache.set(id, existsSync(path) ? flat(readFileSync(path, 'utf8')) : null)
  }
  return corpusCache.get(id)
}

const problems = []
const verified = new Set()
let checked = 0

for (const file of tsFiles(iprDir)) {
  const source = readFileSync(file, 'utf8')
  const name = file.slice(root.length).split(sep).join('/')

  for (const line of source.split('\n')) {
    const m = line.match(/@verify\s+([\w-]+)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*$/)
    if (!m) continue
    const [, id, locator, quote] = m
    checked += 1
    if (!ids.has(id)) {
      problems.push(`${name}: @verify names "${id}", which is not a source id in corpus/manifest.yaml`)
      continue
    }
    const text = corpus(id)
    if (text === null) {
      problems.push(`${name}: corpus/normalised/${id}.txt is missing, so ${locator} cannot be checked`)
      continue
    }
    if (!text.includes(flat(quote))) {
      problems.push(`${name}: ${id} ${locator} — quoted text is not in corpus/normalised/${id}.txt:\n    "${flat(quote)}"`)
      continue
    }
    verified.add(id)
  }
}

// Cite ids used in the data itself: cite: 'x', cites: ['x', 'y'].
for (const file of tsFiles(iprDir)) {
  const source = readFileSync(file, 'utf8')
  const name = file.slice(root.length).split(sep).join('/')
  const used = new Set()
  for (const m of source.matchAll(/\bcite:\s*'([^']+)'/g)) used.add(m[1])
  for (const m of source.matchAll(/\bcites:\s*\[([^\]]*)\]/g)) {
    for (const c of m[1].matchAll(/'([^']+)'/g)) used.add(c[1])
  }
  for (const id of used) {
    if (id === 'unknown') continue
    if (!ids.has(id)) problems.push(`${name}: cite "${id}" is not a source id in corpus/manifest.yaml`)
    else if (!verified.has(id)) problems.push(`${name}: cite "${id}" has no @verify line quoting the provision it rests on`)
  }
}

if (problems.length) {
  console.error(`IPR cite check failed (${problems.length}):\n`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`IPR cite check passed: ${checked} quoted provisions re-read from the corpus, ${verified.size} sources used.`)
