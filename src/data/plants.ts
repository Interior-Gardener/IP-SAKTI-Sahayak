import type { OriginEra, Plant, RegionTag, TherapeuticTag } from '../types/plant'
import { plantsPart1 } from './plants.part1'
import { plantsPart2 } from './plants.part2'
import { plantsPart3 } from './plants.part3'
import { plantsPart4 } from './plants.part4'
import { PLANT_HISTORY } from './history'
import { PLANT_PHOTOS } from './photos'
import { asset } from '../lib/asset'

// Botany and history are written and reviewed separately, then joined here.
export const plants: Plant[] = [...plantsPart1, ...plantsPart2, ...plantsPart3, ...plantsPart4].map((entry) => {
  const history = PLANT_HISTORY[entry.id]
  // Loud at module load rather than a blank panel three clicks in.
  if (!history) throw new Error(`No history written for plant "${entry.id}"`)
  // Photograph paths are written from the site root; resolve them against
  // the deploy base so they survive being served from a sub-path.
  const photos = (PLANT_PHOTOS[entry.id] ?? []).map((photo) => ({
    ...photo,
    src: asset(photo.src),
  }))
  return { ...entry, history, photos }
})

export const plantById: ReadonlyMap<string, Plant> = new Map(plants.map((p) => [p.id, p]))

export function getPlant(id: string | undefined): Plant | undefined {
  return id ? plantById.get(id) : undefined
}

/* ---------------------------------------------------------------- *
 * Garden beds — the physical layout of the 3D garden.
 * Each bed is a themed plot the visitor can walk up to.
 * ---------------------------------------------------------------- */

/** Radius of a themed bed, in garden units. The floor texture and the 3D
 *  plinth both read this, so they can never drift apart. */
export const BED_RADIUS = 2.1

/** How far the plaza fountain's stonework reaches, for walk collision. */
export const FOUNTAIN_RADIUS = 1.26

export interface GardenBed {
  id: string
  name: string
  theme: string
  accent: string
  /** Bed centre on the garden plane. */
  position: [number, number]
  plantIds: string[]
}

export const gardenBeds: GardenBed[] = [
  {
    id: 'digestive',
    name: 'Agni Court',
    theme: 'Digestion & the gut',
    accent: '#d9a13c',
    position: [-7.2, -6.4],
    plantIds: ['ginger', 'mint', 'bael', 'fenugreek', 'pomegranate'],
  },
  {
    id: 'immunity',
    name: 'Rasayana Grove',
    theme: 'Immunity & vitality',
    accent: '#4f9d5c',
    position: [0, -8.6],
    plantIds: ['tulsi', 'giloy', 'amla', 'ashwagandha'],
  },
  {
    id: 'skin',
    name: 'Twak Terrace',
    theme: 'Skin, hair & wounds',
    accent: '#c9743f',
    position: [7.2, -6.4],
    plantIds: ['neem', 'aloe-vera', 'turmeric', 'henna', 'bhringraj', 'hibiscus'],
  },
  {
    id: 'respiratory',
    name: 'Prana Walk',
    theme: 'Breath & lungs',
    accent: '#4aa3a8',
    position: [-7.2, 6.4],
    plantIds: ['vasaka', 'lemongrass', 'mulethi', 'kalmegh', 'babul'],
  },
  {
    id: 'mind',
    name: 'Medhya Arbour',
    theme: 'Mind, memory & sleep',
    accent: '#7c72c4',
    position: [0, 8.6],
    plantIds: ['brahmi', 'mandukaparni', 'sarpagandha', 'sandalwood'],
  },
  {
    id: 'heart',
    name: 'Hridaya Circle',
    theme: 'Heart, joints & renewal',
    accent: '#b95a72',
    position: [7.2, 6.4],
    plantIds: ['arjuna', 'guggulu', 'punarnava', 'shatavari', 'lotus', 'sadaphuli'],
  },
]

export const bedByPlantId: ReadonlyMap<string, GardenBed> = new Map(
  gardenBeds.flatMap((bed) => bed.plantIds.map((id) => [id, bed] as const)),
)

/* ---------------------------------------------------------------- *
 * Facets, derived once at module load for the filter UI.
 * ---------------------------------------------------------------- */

function tally<T extends string>(values: T[][]): { value: T; count: number }[] {
  const counts = new Map<T, number>()
  for (const list of values) for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export const therapeuticFacets = tally<TherapeuticTag>(plants.map((p) => p.therapeutic))
export const regionFacets = tally<RegionTag>(plants.map((p) => p.regions))
export const systemFacets = tally(plants.map((p) => p.systems))
export const typeFacets = tally(plants.map((p) => [p.type]))
export const partFacets = tally(plants.map((p) => p.partsUsed))
export const conservationFacets = tally(plants.map((p) => [p.conservation]))
/** Eras read as a sequence, so these stay in time order rather than by count. */
const ERA_ORDER: OriginEra[] = [
  'Indus & Vedic',
  'Classical Samhita',
  'Medieval Nighantu',
  'Colonial era',
  'Modern',
]
export const eraFacets = tally<OriginEra>(plants.map((p) => [p.history.originEra])).sort(
  (a, b) => ERA_ORDER.indexOf(a.value) - ERA_ORDER.indexOf(b.value),
)

export const therapeuticIcons: Record<TherapeuticTag, string> = {
  Digestive: 'M12 3c3 3 4.5 5.5 4.5 8a4.5 4.5 0 1 1-9 0c0-2.5 1.5-5 4.5-8Z',
  Immunity: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z',
  Respiratory: 'M12 4v9m0 0c0 3-2 5-4.5 5S4 16.5 4 14c0-3 2.5-5.5 4-7m4 6c0 3 2 5 4.5 5S20 16.5 20 14c0-3-2.5-5.5-4-7',
  'Skin & Hair': 'M5 20c0-6 3-11 7-11s7 5 7 11M9 4c1 2 5 2 6 0',
  'Mind & Sleep': 'M12 4a6 6 0 0 0-4 10.5V18h8v-3.5A6 6 0 0 0 12 4Z',
  'Heart & Circulation': 'M12 20s-7-4.6-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.4 12 20 12 20Z',
  'Joints & Pain': 'M7 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm10 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM9.5 9.5l5 5',
  Metabolic: 'M4 18c3 0 3-8 6-8s3 8 6 8 4-4 4-4',
  Liver: 'M4 8c4-3 12-3 16 0 0 6-3 10-8 10S4 14 4 8Z',
  'Women’s Health': 'M12 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 10v6m-3-3h6',
  'Kidney & Urinary': 'M9 4C6 4 4 7 4 11s2 7 5 7c2 0 3-2 3-4s1-4 3-4 3 2 3 4',
  'Wound Care': 'M9 5h6v4h4v6h-4v4H9v-4H5V9h4V5Z',
}
