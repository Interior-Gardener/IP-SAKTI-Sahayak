import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Ashwagandha — Withania somnifera. Nothing in the corpus names this plant, so
 * the profile says what the statutes say about a plant of this kind and no
 * more. A standardised withanolide fraction is a different question from the
 * root powder, and s.3(c), s.3(d) and s.3(e) are where that question goes. */
export const ashwagandha: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Withania somnifera',
  patentability: {
    note:
      'No provision in the corpus names ashwagandha, so nothing plant-specific is asserted. ' +
      PATENT_BACKBONE +
      ' A purified or standardised fraction is judged on the same sections: s.3(c) keeps out the discovery of a substance ' +
      'occurring in nature, and s.3(d) keeps out a new form of a known substance without better efficacy.',
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
