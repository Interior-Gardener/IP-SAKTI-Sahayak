import type { MaterialIPProfile } from '../../../types/material'
import {
  EXPORT_NOT_VERIFIED,
  NOT_IN_WILDLIFE_SCHEDULES,
  PATENT_BACKBONE,
  PATENT_BACKBONE_CITES,
  verifiedPlantProfile,
} from './common'

/* Guggulu — Commiphora wightii. The word does its own work in the Drugs and
 * Cosmetics Rules, where "Guggulu" names a group of Ayurvedic medicines with a
 * five-year shelf life under rule 161B — a fact about the preparation, not
 * about the plant, and the profile has no field for it. It is recorded here so
 * the next person does not have to find it again.
 *
 * The plant is not in either Wild Life (Protection) Act plant schedule. Its
 * conservation status is discussed widely, but nothing in the corpus states it.
 *
 * @verify in-dc-rules-1945 | r.161B | Name of the Group of Ayurvedic Medicine: Guggulu | column 3: 5 years
 */
export const guggulu: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Commiphora wightii',
  patentability: {
    note:
      'No provision in the corpus names guggulu as a plant, so nothing plant-specific is asserted. ' +
      PATENT_BACKBONE +
      ' A guggulu preparation built from a classical formula runs into s.3(p) and s.3(e) together: traditional knowledge, ' +
      'and an admixture whose properties are the sum of its parts.',
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: NOT_IN_WILDLIFE_SCHEDULES,
  export: EXPORT_NOT_VERIFIED,
})
