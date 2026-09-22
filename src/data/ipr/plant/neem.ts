import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Neem — Azadirachta indica. The other plant the Patent Office manual names by
 * itself, for its pesticidal and insecticidal properties.
 *
 * The EPO opposition over the neem fungicide patent is not cited here: the
 * corpus holds no case law yet (corpus/CHANGELOG.md).
 *
 * @verify in-mppp-v3 | 09.03.05.15 | Another example is the pesticidal and insecticidal properties of neem
 */
export const neem: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Azadirachta indica',
  patentability: {
    note:
      'The Patent Office names neem itself: its manual gives "the pesticidal and insecticidal properties of neem" as an ' +
      'example of knowledge that, being traditional, is not an invention under s.3(p). ' +
      PATENT_BACKBONE,
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
