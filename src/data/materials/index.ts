import type { SourceMaterial, Shelf } from '../../types/source'
import { MATERIAL_IPR } from '../ipr/material'
import { unknownProfile } from '../ipr/unknown'
import { animalMaterials } from './animal'
import { microbes } from './microbes'
import { mineralMaterials } from './mineral'

/* The non-plant source materials, joined with their legal layer exactly the
 * way plants are joined in src/data/plants.ts: the material is written in one
 * place, the law in another, and a material nobody has checked still gets a
 * profile — an honest all-'unknown' one. */
export const materials: SourceMaterial[] = [...microbes, ...animalMaterials, ...mineralMaterials].map((entry) => ({
  ...entry,
  ipr: MATERIAL_IPR[entry.id] ?? unknownProfile(entry.kind, entry.scientific ?? entry.name),
}))

export const materialById: ReadonlyMap<string, SourceMaterial> = new Map(materials.map((m) => [m.id, m]))

export function getMaterial(id: string | undefined): SourceMaterial | undefined {
  return id ? materialById.get(id) : undefined
}

/** The four areas of the Rasashala, in the order a visitor walks them. */
export const SHELVES: { id: Shelf; title: string; blurb: string }[] = [
  {
    id: 'fermentation',
    title: 'Fermentation hall',
    blurb: 'Asava and arishta: the preparations that need something alive to finish them.',
  },
  {
    id: 'vault',
    title: 'Culture vault',
    blurb: 'Deposits, strains and the one living thing the patent bar does not exclude.',
  },
  {
    id: 'animal',
    title: 'Animal-derived shelf',
    blurb: 'Madhu and ghrita beside mukta, shankha and the materials that carry a schedule.',
  },
  {
    id: 'rasa',
    title: 'Rasa shelf',
    blurb: 'Metals and minerals, two of them named in Schedule E(1) of the Drugs and Cosmetics Rules.',
  },
]

export function materialsOnShelf(shelf: Shelf): SourceMaterial[] {
  return materials.filter((m) => m.shelf === shelf)
}
