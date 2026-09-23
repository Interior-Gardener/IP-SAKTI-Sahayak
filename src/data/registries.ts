import data from './registries.json'

/* The registries, as exported from the API's verified seed (api/app/registry)
 * by `api/scripts/export_registries.py`. CI fails when this file and the seed
 * disagree, so the street and /registry always show the same offices, forms and
 * citations — and the street still works with the API down. */

export interface RegistryForm {
  name: string
  purpose: string
  cite_source: string
  cite_locator: string
  /** The rule's own words naming the form, re-read from the corpus by the API tests. */
  quote: string
}

export interface RegistryData {
  id: string
  name: string
  jurisdiction: string
  regime: string[]
  url: string
  action: string
  cite_source: string
  cite_locator: string
  cite_quote: string
  forms: RegistryForm[]
  forms_note: string | null
  fee_note: string | null
}

export const REGISTRIES_CHECKED_ON: string = data.checked_on
export const REGISTRIES: RegistryData[] = data.registries as RegistryData[]

export function getRegistry(id: string | null | undefined): RegistryData | undefined {
  return id ? REGISTRIES.find((r) => r.id === id) : undefined
}
