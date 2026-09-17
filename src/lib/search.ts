import type {
  AyushSystem,
  Conservation,
  OriginEra,
  Plant,
  PlantType,
  RegionTag,
  TherapeuticTag,
} from '../types/plant'

/* ------------------------------------------------------------------ *
 * Search & filtering.
 *
 * The catalogue is small enough that a hand-rolled weighted index beats
 * pulling in a search library: it runs in well under a millisecond and
 * lets us rank a botanical name above a passing mention in a paragraph.
 * ------------------------------------------------------------------ */

export interface Filters {
  therapeutic: TherapeuticTag[]
  regions: RegionTag[]
  systems: AyushSystem[]
  types: PlantType[]
  parts: string[]
  conservation: Conservation[]
  eras: OriginEra[]
  bookmarkedOnly: boolean
}

export const emptyFilters: Filters = {
  therapeutic: [],
  regions: [],
  systems: [],
  types: [],
  parts: [],
  conservation: [],
  eras: [],
  bookmarkedOnly: false,
}

export function countActiveFilters(f: Filters): number {
  return (
    f.therapeutic.length +
    f.regions.length +
    f.systems.length +
    f.types.length +
    f.parts.length +
    f.conservation.length +
    f.eras.length +
    (f.bookmarkedOnly ? 1 : 0)
  )
}

export type SortMode = 'relevance' | 'alpha' | 'easiest' | 'rarest' | 'oldest'

interface IndexEntry {
  plant: Plant
  name: string
  botanical: string
  aliases: string
  themes: string
  /** Tagline and use headings — the sentences that say what a plant is *for*. */
  headline: string
  body: string
}

const RARITY_ORDER: Record<Conservation, number> = {
  'Critically Endangered': 0,
  Endangered: 1,
  Vulnerable: 2,
  'Least Concern': 3,
  Cultivated: 4,
}

function buildIndex(plants: Plant[]): IndexEntry[] {
  return plants.map((plant) => ({
    plant,
    name: plant.name.toLowerCase(),
    botanical: `${plant.botanical} ${plant.family}`.toLowerCase(),
    aliases: Object.values(plant.names).join(' ').toLowerCase(),
    themes: [...plant.therapeutic, ...plant.partsUsed, ...plant.systems, ...plant.regions, plant.type]
      .join(' ')
      .toLowerCase(),
    headline: [plant.tagline, ...plant.uses.map((u) => u.title)].join(' ').toLowerCase(),
    body: [
      plant.tagline,
      plant.description,
      plant.habitat,
      plant.morphology,
      ...plant.uses.flatMap((u) => [u.title, u.detail]),
      ...plant.preparations.map((p) => p.name),
      ...plant.facts,
      plant.history.origin,
      plant.history.etymology,
      plant.history.spread,
      plant.history.lore,
      plant.history.firstRecord.source,
      plant.history.firstRecord.detail,
      ...plant.history.timeline.flatMap((e) => [e.title, e.detail, e.source, e.when]),
      plant.ayurvedic.rasa.join(' '),
      plant.ayurvedic.dosha,
    ]
      .join(' ')
      .toLowerCase(),
  }))
}

let index: IndexEntry[] | null = null
let indexedFrom: Plant[] | null = null

function getIndex(plants: Plant[]): IndexEntry[] {
  if (index && indexedFrom === plants) return index
  index = buildIndex(plants)
  indexedFrom = plants
  return index
}

/** How many times `needle` appears in `haystack`. */
function occurrences(haystack: string, needle: string): number {
  let count = 0
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at === -1) return count
    count++
    from = at + needle.length
  }
}

/** Loose subsequence match, so "ashwaganda" still finds "ashwagandha". */
function subsequenceScore(needle: string, haystack: string): number {
  if (needle.length < 3) return 0
  let i = 0
  let gaps = 0
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++
    else if (i > 0) gaps++
  }
  if (i < needle.length) return 0
  return Math.max(0, 1 - gaps / (haystack.length + 1))
}

function scoreToken(token: string, entry: IndexEntry): number {
  let score = 0
  if (entry.name === token) score += 1000
  else if (entry.name.startsWith(token)) score += 620
  else if (entry.name.includes(token)) score += 380

  if (entry.botanical.includes(token)) score += 320
  if (entry.aliases.includes(token)) score += 280
  if (entry.themes.includes(token)) score += 150
  // A plant whose tagline or use heading says "cough" is about cough; one that
  // merely mentions it in passing is not. Repetition is the tie-breaker.
  if (entry.headline.includes(token)) score += 240
  const mentions = occurrences(entry.body, token)
  if (mentions > 0) score += 45 + Math.min(mentions, 6) * 22

  if (score === 0) score += subsequenceScore(token, entry.name) * 220
  return score
}

function matchesFilters(plant: Plant, filters: Filters, bookmarks: Set<string>): boolean {
  if (filters.bookmarkedOnly && !bookmarks.has(plant.id)) return false
  if (filters.therapeutic.length && !filters.therapeutic.some((t) => plant.therapeutic.includes(t)))
    return false
  if (filters.regions.length && !filters.regions.some((r) => plant.regions.includes(r))) return false
  if (filters.systems.length && !filters.systems.some((s) => plant.systems.includes(s))) return false
  if (filters.types.length && !filters.types.includes(plant.type)) return false
  if (filters.parts.length && !filters.parts.some((p) => plant.partsUsed.includes(p))) return false
  if (filters.conservation.length && !filters.conservation.includes(plant.conservation)) return false
  if (filters.eras.length && !filters.eras.includes(plant.history.originEra)) return false
  return true
}

export interface SearchOptions {
  query: string
  filters: Filters
  sort: SortMode
  bookmarks: string[]
}

export function searchPlants(plants: Plant[], options: SearchOptions): Plant[] {
  const { query, filters, sort } = options
  const bookmarks = new Set(options.bookmarks)
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const entries = getIndex(plants)

  const scored: { plant: Plant; score: number }[] = []
  for (const entry of entries) {
    if (!matchesFilters(entry.plant, filters, bookmarks)) continue
    let score = 0
    let matchedAll = true
    for (const token of tokens) {
      const s = scoreToken(token, entry)
      if (s === 0) {
        matchedAll = false
        break
      }
      score += s
    }
    if (!matchedAll) continue
    scored.push({ plant: entry.plant, score })
  }

  switch (sort) {
    case 'alpha':
      scored.sort((a, b) => a.plant.name.localeCompare(b.plant.name))
      break
    case 'easiest':
      scored.sort((a, b) => a.plant.difficulty - b.plant.difficulty || a.plant.name.localeCompare(b.plant.name))
      break
    case 'oldest':
      // Earliest attested first; the sortYear is signed, so BCE sorts ahead.
      scored.sort(
        (a, b) =>
          a.plant.history.firstRecord.sortYear - b.plant.history.firstRecord.sortYear ||
          a.plant.name.localeCompare(b.plant.name),
      )
      break
    case 'rarest':
      scored.sort(
        (a, b) =>
          RARITY_ORDER[a.plant.conservation] - RARITY_ORDER[b.plant.conservation] ||
          a.plant.name.localeCompare(b.plant.name),
      )
      break
    default:
      scored.sort((a, b) => b.score - a.score || a.plant.name.localeCompare(b.plant.name))
  }

  return scored.map((s) => s.plant)
}

/** Type-ahead suggestions drawn from names, themes and parts. */
export function suggest(plants: Plant[], query: string, limit = 6): string[] {
  const token = query.trim().toLowerCase()
  if (token.length < 2) return []
  const pool = new Set<string>()
  for (const plant of plants) {
    pool.add(plant.name)
    pool.add(plant.botanical)
    for (const alias of Object.values(plant.names)) pool.add(alias.split(',')[0].trim())
    for (const t of plant.therapeutic) pool.add(t)
    for (const p of plant.partsUsed) pool.add(p)
  }
  return [...pool]
    .filter((s) => s.toLowerCase().includes(token))
    .sort((a, b) => a.toLowerCase().indexOf(token) - b.toLowerCase().indexOf(token) || a.length - b.length)
    .slice(0, limit)
}
