import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Turmeric — Curcuma longa. The Manual of Patent Office Practice uses turmeric
 * as its worked example of the s.3(p) traditional-knowledge bar, so the bar can
 * be stated for this plant by name rather than by analogy.
 *
 * The 1995 US wound-healing patent and its re-examination are the story people
 * expect here. No patent record or case report is in the corpus, so the
 * landmark list stays empty until those sources are added.
 *
 * @verify in-mppp-v3 | 09.03.05.15 | An example is the antiseptic properties of turmeric for wound healing
 */
export const turmeric: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Curcuma longa',
  patentability: {
    note:
      'The Patent Office names turmeric itself: its manual gives "the antiseptic properties of turmeric for wound healing" ' +
      'as the example of knowledge that, being traditional, is not an invention under s.3(p). ' +
      PATENT_BACKBONE,
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
