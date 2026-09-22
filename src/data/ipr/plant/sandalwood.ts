import { UNKNOWN, type MaterialIPProfile } from '../../../types/material'
import { PATENT_BACKBONE, PATENT_BACKBONE_CITES, verifiedPlantProfile } from './common'

/* Sandalwood — Santalum album. People ask about sandalwood because of export
 * control, so the two questions are separated here.
 *
 * Wild Life (Protection) Act: checked, and Santalum album is in neither plant
 * schedule. The one sandalwood in the CITES schedule is the African Osyris
 * lanceolata. Export control over Indian sandalwood comes from DGFT policy and
 * state law instead, and neither is in the corpus, so `restricted` stays
 * 'unknown' rather than being guessed either way.
 *
 * @verify in-wlpa-1972 | Schedule IV, SANTALACEAE | SANTALACEAE Sandalwoods 476 Osyris lanceolata
 */
export const sandalwood: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Santalum album',
  patentability: {
    note:
      'No provision in the corpus names sandalwood, so nothing plant-specific is asserted. ' +
      PATENT_BACKBONE,
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: {
    protectedSchedule: null,
    // The CITES schedule's SANTALACEAE entry is Osyris lanceolata (African
    // populations) — not Santalum album, which appears nowhere in the Act.
    citesListed: false,
    cites: ['in-wlpa-1972'],
  },
  // DGFT export policy and the state sandalwood rules are not in the corpus.
  export: { restricted: UNKNOWN, cite: UNKNOWN },
})
