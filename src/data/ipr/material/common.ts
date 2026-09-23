import { UNKNOWN, type MaterialIPProfile } from '../../../types/material'
import { searchLinks } from '../unknown'

/* ------------------------------------------------------------------ *
 * The legal layer of the microbial, animal-derived and mineral sources,
 * and the evidence for it.
 *
 * The three kinds answer the same questions differently, and the
 * differences are the interesting part:
 *
 *   - a micro-organism is the one living thing the Patents Act does not
 *     exclude, and the only one with a deposit route;
 *   - an animal or any part of one is excluded outright, and some of
 *     them carry a wildlife schedule as well;
 *   - a mineral is not a biological resource at all, so the biodiversity
 *     regime does not reach it — but Schedule E(1) does reach several.
 *
 * Checked by `npm run check:ipr`, which re-reads every quoted provision
 * out of corpus/normalised/.
 *
 * @verify in-patents-act-1970 | s.3(c) | discovery of any living thing or non-living substance occurring in nature
 * @verify in-patents-act-1970 | s.3(j) | plants and animals in whole or any part thereof other than micro-organisms but including seeds, varieties and species
 * @verify in-patents-act-1970 | s.10(4)(d)(ii) | if the applicant mentions a biological material in the specification which may not be described in such a way as to satisfy clauses (a) and (b)
 * @verify intl-budapest-treaty | Art. 3(1)(a) | shall recognize, for such purposes, the deposit of a microorganism with any international depositary authority
 * @verify in-bd-act-2002 | s.2(c) | include plants, animals, micro-organisms or parts of their genetic material and derivatives (excluding value added products)
 * @verify in-dc-rules-1945 | Schedule E(1) | List of poisonous substances under the Ayurvedic (including Siddha) and Unani Systems of Medicine
 * @verify in-dc-rules-1945 | Schedule E(1), mineral 18 | Parada Mercury.
 * @verify in-dc-rules-1945 | Schedule E(1), mineral 21 | Hingula Cinnabar.
 * @verify in-wlpa-1972 | Schedule I, Part A | Alpine Musk Deer Moschus chrysogaster
 * @verify in-wlpa-1972 | Schedule I, Part K | PART K : CORALS
 * @verify in-wlpa-1972 | Schedule IV, Appendix III | Corallium elatius (China)
 * @verify in-wlpa-1972 | s.2 | freshly killed wild animal, ambergris, musk and other animal products
 * @verify in-wlpa-1972 | s.49B | a manufacturer of, or dealer in, scheduled animal articles
 * @verify in-wlpa-1972 | s.49I(2) | The export of any specimen of species included in Appendix III of Schedule IV shall require the prior grant and presentation of an export permit
 * ------------------------------------------------------------------ */

/** The day these sources were read. */
export const MATERIAL_VERIFIED_ON = '2026-09-22'

/** True of every material here: nothing in the corpus records its TK status,
 *  GI or pharmacopoeial monograph. Built fresh each time so no two profiles
 *  share the same nested objects. */
function nothingRecorded(): Pick<MaterialIPProfile, 'tk' | 'gi' | 'monographs'> {
  return {
    tk: { tkdl: UNKNOWN, classicalTexts: [], cite: UNKNOWN },
    gi: { tags: [] },
    monographs: { api: null, cite: UNKNOWN },
  }
}

/** A micro-organism: the one living source the patent bar carves out. */
export function microbeProfile(input: { searchTerm: string; note: string }): MaterialIPProfile {
  return {
    kind: 'microbe',
    ...nothingRecorded(),
    patentability: {
      note: input.note,
      cites: ['in-patents-act-1970', 'intl-budapest-treaty'],
    },
    patents: { landmark: [], search: searchLinks(input.searchTerm) },
    // The Budapest route exists; which Indian institutions are international
    // depositary authorities is a WIPO list, and that list is not in the
    // corpus, so no institution is named here.
    deposit: { budapest: true, indianIDAs: [], cite: 'intl-budapest-treaty' },
    biodiversity: {
      // s.2(c) names micro-organisms in as many words.
      indianBioResource: true,
      normallyTradedCommodity: UNKNOWN,
      cites: ['in-bd-act-2002'],
    },
    wildlife: null,
    export: { restricted: UNKNOWN, cite: UNKNOWN },
    // Schedule E(1) lists drugs of vegetable, animal and mineral origin; no
    // micro-organism appears in it.
    drugSchedules: { scheduleE1: false, heavyMetalTesting: null, cite: 'in-dc-rules-1945' },
    lastVerified: MATERIAL_VERIFIED_ON,
  }
}

/** An animal-derived material: excluded from patents, and sometimes scheduled. */
export function animalProfile(input: {
  searchTerm: string
  note: string
  /** Only where a schedule was actually read for this species. */
  wildlife?: MaterialIPProfile['wildlife']
  export?: MaterialIPProfile['export']
}): MaterialIPProfile {
  return {
    kind: 'animal',
    ...nothingRecorded(),
    patentability: { note: input.note, cites: ['in-patents-act-1970'] },
    patents: { landmark: [], search: searchLinks(input.searchTerm) },
    deposit: null,
    biodiversity: { indianBioResource: true, normallyTradedCommodity: UNKNOWN, cites: ['in-bd-act-2002'] },
    // Left null unless a schedule was read: an empty wildlife row says
    // "not listed", and for most of these nobody has checked.
    wildlife: input.wildlife ?? null,
    export: input.export ?? { restricted: UNKNOWN, cite: UNKNOWN },
    drugSchedules: { scheduleE1: false, heavyMetalTesting: null, cite: 'in-dc-rules-1945' },
    lastVerified: MATERIAL_VERIFIED_ON,
  }
}

/** A mineral or metal: outside the biodiversity regime, and the kind of
 *  material Schedule E(1) actually names. */
export function mineralProfile(input: {
  searchTerm: string
  note: string
  /** True only for a substance read off the Schedule E(1) list by name. */
  scheduleE1: boolean
}): MaterialIPProfile {
  return {
    kind: 'mineral',
    ...nothingRecorded(),
    patentability: { note: input.note, cites: ['in-patents-act-1970'] },
    patents: { landmark: [], search: searchLinks(input.searchTerm) },
    deposit: null,
    biodiversity: {
      // s.2(c) reaches plants, animals and micro-organisms. A mineral is none
      // of the three, so the Act's access rules do not apply to it — which is
      // exactly why the rasa shelf answers differently from the herb beds.
      indianBioResource: false,
      normallyTradedCommodity: UNKNOWN,
      cites: ['in-bd-act-2002'],
    },
    wildlife: null,
    export: { restricted: UNKNOWN, cite: UNKNOWN },
    drugSchedules: {
      scheduleE1: input.scheduleE1,
      // The heavy-metal testing notification for exported ASU drugs is not in
      // the corpus, so it is not asserted for any of these.
      heavyMetalTesting: null,
      cite: 'in-dc-rules-1945',
    },
    lastVerified: MATERIAL_VERIFIED_ON,
  }
}

/** Shared sentences, so a change of view is a change in one place. */
export const MICROBE_PATENT_NOTE =
  'Micro-organisms are the carve-out in Patents Act s.3(j): plants and animals are excluded "other than ' +
  'micro-organisms". A strain as found is still caught by s.3(c), which keeps out the discovery of a living thing ' +
  'occurring in nature. Where a specification cannot describe the material well enough, s.10(4)(d)(ii) completes the ' +
  'application by deposit with an international depositary authority, and Budapest Treaty Art. 3(1)(a) makes one ' +
  'such deposit count in every contracting state.'

export const ANIMAL_PATENT_NOTE =
  'Patents Act s.3(j) excludes animals in whole or any part thereof, so the material itself is not patentable; ' +
  's.3(c) separately keeps out the discovery of a substance occurring in nature. A process of preparation is judged ' +
  'on its own against the rest of s.3.'

export const MINERAL_PATENT_NOTE =
  'Patents Act s.3(c) keeps out the discovery of a non-living substance occurring in nature, so the mineral itself ' +
  'is not patentable. A process — the classical purification and incineration steps, or a modern equivalent — is ' +
  'judged on its own against the rest of s.3, where s.3(p) and s.3(e) are the clauses that usually bite.'
