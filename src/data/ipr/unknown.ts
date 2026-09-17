import { UNKNOWN, type MaterialIPProfile, type MaterialKind } from '../../types/material'

/* The honest starting point for every material: nothing asserted, every cite
 * 'unknown'. A profile only gains a real value together with a cite id into
 * corpus/manifest.yaml, in its own file under src/data/ipr/<kind>/.
 *
 * The search links are not legal claims, just starting points for a prior-art
 * search. InPASS and PATENTSCOPE have no stable query URL, so they open the
 * public search page; T2.8 builds proper per-material query strings. */
export function unknownProfile(kind: MaterialKind, searchTerm: string): MaterialIPProfile {
  return {
    kind,
    tk: { tkdl: UNKNOWN, classicalTexts: [], cite: UNKNOWN },
    patentability: { note: 'Not yet verified. Ask Sahayak or a facilitator.', cites: [] },
    patents: {
      landmark: [],
      search: {
        inpass: 'https://iprsearch.ipindia.gov.in/PublicSearch/',
        patentscope: 'https://patentscope.wipo.int/search/en/search.jsf',
        googlePatents: `https://patents.google.com/?q=${encodeURIComponent(`"${searchTerm}"`)}`,
      },
    },
    deposit: null,
    gi: { tags: [] },
    biodiversity: { indianBioResource: UNKNOWN, normallyTradedCommodity: UNKNOWN, cites: [] },
    wildlife: null,
    export: { restricted: UNKNOWN, cite: UNKNOWN },
    drugSchedules: { scheduleE1: UNKNOWN, heavyMetalTesting: null, cite: UNKNOWN },
    monographs: { api: null, cite: UNKNOWN },
    lastVerified: null,
  }
}
