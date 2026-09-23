import type { MaterialIPProfile } from '../types/material'
import type { Shelf, SourceMaterial } from '../types/source'

/* ------------------------------------------------------------------ *
 * The legal facts about a material that are worth a badge.
 *
 * Read straight off the verified profile, and only where the profile says
 * `true` or `false` with a citation behind it: an 'unknown' raises no flag
 * at all, because a missing flag is honest and a guessed one is not. Every
 * flag carries the manifest id it rests on, so a badge can always say where
 * it came from.
 * ------------------------------------------------------------------ */

export type FlagKey = 'scheduleE1' | 'wildlife' | 'cites' | 'exportRestricted' | 'deposit' | 'bioResource' | 'notBioResource'

export interface LegalFlag {
  key: FlagKey
  label: string
  /** One line on what the flag means for someone making a product. */
  meaning: string
  tone: string
  cite: string
}

export const FLAG_LABELS: Record<FlagKey, string> = {
  scheduleE1: 'Schedule E(1)',
  wildlife: 'Wildlife schedule',
  cites: 'CITES listed',
  exportRestricted: 'Export restricted',
  deposit: 'Deposit route',
  bioResource: 'Biological resource',
  notBioResource: 'Not a biological resource',
}

export function legalFlags(profile: MaterialIPProfile): LegalFlag[] {
  const out: LegalFlag[] = []
  if (profile.drugSchedules.scheduleE1 === true) {
    out.push({
      key: 'scheduleE1',
      label: FLAG_LABELS.scheduleE1,
      meaning: 'Named in Schedule E(1) of the Drugs and Cosmetics Rules, the list of poisonous substances for Ayurvedic, Siddha and Unani medicine.',
      tone: '#c2413f',
      cite: profile.drugSchedules.cite,
    })
  }
  const wildlife = profile.wildlife
  if (wildlife && wildlife.protectedSchedule && wildlife.protectedSchedule !== 'unknown' && wildlife.cites.length) {
    // A profile that records "not listed" says so in words; only a named
    // schedule raises the flag.
    if (!/^not\b/i.test(wildlife.protectedSchedule)) {
      out.push({
        key: 'wildlife',
        label: FLAG_LABELS.wildlife,
        meaning: wildlife.protectedSchedule,
        tone: '#cf6a2e',
        cite: wildlife.cites[0],
      })
    }
  }
  if (wildlife?.citesListed === true) {
    out.push({
      key: 'cites',
      label: FLAG_LABELS.cites,
      meaning: 'Listed in a CITES appendix, which the Wild Life (Protection) Act carries.',
      tone: '#c9922e',
      cite: wildlife.cites[0] ?? 'unknown',
    })
  }
  if (profile.export.restricted === true) {
    out.push({
      key: 'exportRestricted',
      label: FLAG_LABELS.exportRestricted,
      meaning: 'Export needs a permit or is barred.',
      tone: '#b4532a',
      cite: profile.export.cite,
    })
  }
  if (profile.deposit?.budapest === true) {
    out.push({
      key: 'deposit',
      label: FLAG_LABELS.deposit,
      meaning: 'A patent on it can be supported by depositing the strain under the Budapest Treaty.',
      tone: '#4a7fa8',
      cite: profile.deposit.cite,
    })
  }
  if (profile.biodiversity.indianBioResource === true) {
    out.push({
      key: 'bioResource',
      label: FLAG_LABELS.bioResource,
      meaning: 'A biological resource under the Biological Diversity Act, so its access and benefit-sharing rules can apply.',
      tone: '#5a8f52',
      cite: profile.biodiversity.cites[0] ?? 'unknown',
    })
  } else if (profile.biodiversity.indianBioResource === false) {
    out.push({
      key: 'notBioResource',
      label: FLAG_LABELS.notBioResource,
      meaning: 'Outside the Biological Diversity Act, which reaches plants, animals and micro-organisms only.',
      tone: '#628a9a',
      cite: profile.biodiversity.cites[0] ?? 'unknown',
    })
  }
  return out
}

export const KIND_LABEL: Record<SourceMaterial['kind'], string> = {
  microbe: 'Micro-organism',
  animal: 'Animal-derived',
  mineral: 'Mineral',
}

export const KIND_TONE: Record<SourceMaterial['kind'], string> = {
  microbe: '#4a7fa8',
  animal: '#b4753a',
  mineral: '#7a6f8a',
}

export const SHELF_LABEL: Record<Shelf, string> = {
  fermentation: 'Fermentation hall',
  vault: 'Culture vault',
  animal: 'Animal-derived shelf',
  rasa: 'Rasa shelf',
}

/** Name, Sanskrit, science, local names and prose, for the compendium's search box. */
export function materialMatches(material: SourceMaterial, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [
    material.name,
    material.sanskrit,
    material.scientific,
    material.tagline,
    material.description,
    material.classicalUse,
    KIND_LABEL[material.kind],
    SHELF_LABEL[material.shelf],
    ...Object.values(material.names),
    ...legalFlags(material.ipr).map((f) => f.label),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((word) => hay.includes(word))
}
