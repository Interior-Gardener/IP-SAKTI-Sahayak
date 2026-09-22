import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Tulsi — Ocimum tenuiflorum. Nothing in the corpus names it. Grown in
 * households across India, which is what makes the biodiversity question
 * concrete rather than theoretical: it is a biological resource under the BD
 * Act either way, and the cultivated-plant route in rule 19 of the 2024 Rules
 * is the one a grower would use. */
export const tulsi: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Ocimum tenuiflorum',
  patentability: {
    note:
      'No provision in the corpus names tulsi, so nothing plant-specific is asserted. ' +
      PATENT_BACKBONE,
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
