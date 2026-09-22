import type { MaterialIPProfile } from '../../../types/material'
import { PATENT_BACKBONE, PATENT_BACKBONE_CITES, verifiedPlantProfile } from './common'

/* Sarpagandha — Rauvolfia serpentina. The one plant of the eight that the Wild
 * Life (Protection) Act does list: Schedule IV carries the CITES appendices,
 * and Rauvolfia serpentina sits in Appendix II with annotation #2 — all parts
 * and derivatives except seeds and pollen, and except finished products
 * packaged and ready for retail trade.
 *
 * That makes export a permit question (s.49I), not a paperwork question, for
 * roots and extracts; a packaged retail product is outside the annotation.
 * `restricted: true` is the honest summary, and the wildlife row carries the
 * annotation so the exception is not lost.
 *
 * @verify in-wlpa-1972 | Schedule IV, Appendix II | Rauvolfia serpentina #2
 * @verify in-wlpa-1972 | Schedule IV, annotation #2 | #2 All parts and derivatives except:
 * @verify in-wlpa-1972 | s.49I | The export of any specimen of species included in Appendices I or II of Schedule IV shall require the prior grant and presentation of an export permit
 * @verify in-wlpa-1972 | s.49H | No person shall engage in trade of scheduled specimens except as provided for under this Chapter
 */
export const sarpagandha: MaterialIPProfile = verifiedPlantProfile({
  botanical: 'Rauvolfia serpentina',
  patentability: {
    note:
      'No provision in the corpus names sarpagandha in a patent context, so nothing plant-specific is asserted there. ' +
      PATENT_BACKBONE +
      ' Its alkaloids are the obvious patent question, and s.3(c) keeps out the discovery of a substance occurring in ' +
      'nature, so an isolated alkaloid as such is outside patentability.',
    cites: PATENT_BACKBONE_CITES,
  },
  wildlife: {
    protectedSchedule:
      'Schedule IV, CITES Appendix II, annotation #2 (all parts and derivatives except seeds, pollen and finished products packaged for retail trade)',
    citesListed: true,
    cites: ['in-wlpa-1972'],
  },
  // s.49I: export of an Appendix I or II specimen needs a prior export permit.
  export: { restricted: true, cite: 'in-wlpa-1972' },
})
