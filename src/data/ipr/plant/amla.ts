import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Amla — Phyllanthus emblica. Nothing in the corpus names it. Amla is as often
 * a food as a medicine, and the food route has its own gate: the Ayurveda
 * Aahara regulations exclude herbs listed in Schedule E(1) of the Drugs and
 * Cosmetics Rules, and amla is not one of them.
 *
 * @verify in-fssai-ayurveda-aahara-2022 | reg. 2(b) | herbs listed under Schedule E-1 of Drug and Cosmetics Act, 1940
 */
export const amla: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Phyllanthus emblica',
  patentability: {
    note:
      'No provision in the corpus names amla, so nothing plant-specific is asserted. ' +
      PATENT_BACKBONE +
      ' Its use in classical formulations such as the three-fruit combination is traditional knowledge on the face of ' +
      's.3(p), and a proportion or dosage-form change alone is the kind of claim s.3(e) is aimed at.',
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
