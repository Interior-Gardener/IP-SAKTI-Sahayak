import { UNKNOWN, type MaterialIPProfile } from '../../../types/material'
import { searchLinks } from '../unknown'

/* ------------------------------------------------------------------ *
 * What every verified plant profile shares, and the evidence for it.
 *
 * A field here is filled only where the text in corpus/normalised/ says
 * so. Everything else stays 'unknown' — the corpus has no GI register,
 * no patent records, no case law and no Ayurvedic Pharmacopoeia index
 * yet (see corpus/CHANGELOG.md), so those fields cannot be filled
 * honestly for any plant.
 *
 * The `@verify` lines below are checked by `node scripts/check-ipr-cites.mjs`:
 * the source id must exist in corpus/manifest.yaml and the quoted text
 * must appear in corpus/normalised/<id>.txt. Add a line before you rely
 * on a provision, and run the script before you push.
 *
 * @verify in-patents-act-1970 | s.3(c) | discovery of any living thing or non-living substance occurring in nature
 * @verify in-patents-act-1970 | s.3(d) | the mere discovery of a new form of a known substance which does not result in the enhancement of the known efficacy of that substance
 * @verify in-patents-act-1970 | s.3(e) | a substance obtained by a mere admixture resulting only in the aggregation of the properties of the components thereof
 * @verify in-patents-act-1970 | s.3(j) | plants and animals in whole or any part thereof other than micro-organisms but including seeds, varieties and species
 * @verify in-patents-act-1970 | s.3(p) | an invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components
 * @verify in-patents-act-1970 | s.10(4)(d)(ii)(D) | disclose the source and geographical origin of the biological material in the specification, when used in an invention
 * @verify in-mppp-v3 | 09.03.05.15 | The Examiner conducts investigation by using Traditional Knowledge
 * @verify in-ppvfr-act-2001 | s.14 | Any person specified in section 16 may make an application to the Registrar for registration of any variety
 * @verify intl-gratk-2024 | Art. 3.1 | Where the claimed invention in a patent application is based on genetic resources, each Contracting Party shall require applicants to disclose
 * @verify in-bd-act-2002 | s.2(c) | include plants, animals, micro-organisms or parts of their genetic material and derivatives (excluding value added products)
 * @verify in-bd-act-2002 | s.6 | applying for an intellectual property right, by whatever name called, in or outside India, for any invention based on any research or information on a biological resource which is accessed from India
 * @verify in-bd-act-2002 | s.7 | without giving prior intimation to the concerned State Biodiversity Board
 * @verify in-bd-act-2002 | s.40 | biological resources when normally traded as commodities
 * @verify in-bd-rules-2024 | r.19 | Procedure for obtaining a certificate of origin for cultivated medicinal plants
 * @verify in-dc-rules-1945 | Schedule E(1) | List of poisonous substances under the Ayurvedic (including Siddha) and Unani Systems of Medicine
 * @verify in-wlpa-1972 | Schedule III | SPECIFIED PLANTS
 * @verify in-wlpa-1972 | Schedule IV | Rauvolfia serpentina #2
 * ------------------------------------------------------------------ */

/** The day the sources below were read for these profiles. */
export const VERIFIED_ON = '2026-09-21'

/** The sentence every plant profile ends on: what the Patents Act keeps out,
 *  what has to be disclosed, and where varieties go instead. */
export const PATENT_BACKBONE =
  'The plant and its parts are not patentable as such (Patents Act s.3(j), which carves out only micro-organisms); ' +
  'knowledge that is already traditional is excluded by s.3(p) and examiners search the TKDL when they apply it; ' +
  'a mere admixture of known ingredients is excluded by s.3(e) and a new form or new use of a known substance by s.3(d) ' +
  'unless efficacy improves. An application resting on this material must disclose the source and geographical origin ' +
  'of the biological material (s.10(4)(d)(ii)(D)), and the WIPO GRATK Treaty Art. 3.1 asks for the same disclosure ' +
  'internationally. New varieties go to the PPV&FR Act s.14 route instead of the patent route; whether this species is ' +
  'notified under s.29(2) is not verified here.'

/** Cites for {@link PATENT_BACKBONE}. A plant adds its own ids to these. */
export const PATENT_BACKBONE_CITES = ['in-patents-act-1970', 'in-mppp-v3', 'intl-gratk-2024', 'in-ppvfr-act-2001']

type Overrides = {
  /** Scientific name; used for the prior-art search links. */
  botanical: string
  patentability: MaterialIPProfile['patentability']
  /** Checked against both WLPA plant schedules; never left to chance. */
  wildlife: NonNullable<MaterialIPProfile['wildlife']>
  export: MaterialIPProfile['export']
}

/** A profile for a plant whose sources have actually been read. Fields not in
 *  `over` are the shared ones above; none of them is a guess. */
export function verifiedPlantProfile(over: Overrides): MaterialIPProfile {
  return {
    kind: 'plant',
    // TKDL holdings are not in the corpus, so no plant can claim to be documented there.
    tk: { tkdl: UNKNOWN, classicalTexts: [], cite: UNKNOWN },
    patentability: over.patentability,
    // No patent records or case law in the corpus yet (corpus/CHANGELOG.md).
    patents: { landmark: [], search: searchLinks(over.botanical) },
    deposit: null,
    // No GI Register in the corpus, so no GI tag can be cited.
    gi: { tags: [] },
    biodiversity: {
      // s.2(c) counts plants as biological resources, and these are Indian plants,
      // so the access rules can apply: s.7 intimation, s.3 approval for foreign
      // applicants, s.6 approval before an IP right. Which one depends on who is
      // asking, and that is the ABS helper's job, not this profile's.
      indianBioResource: true,
      // The s.40 exemption works through a Central Government notification, and
      // that notification is not in the corpus.
      normallyTradedCommodity: UNKNOWN,
      cites: ['in-bd-act-2002', 'in-bd-rules-2024'],
    },
    wildlife: over.wildlife,
    export: over.export,
    // Read against the full Schedule E(1) list (Ayurvedic, Siddha and Unani parts).
    drugSchedules: { scheduleE1: false, heavyMetalTesting: null, cite: 'in-dc-rules-1945' },
    // The Ayurvedic Pharmacopoeia is not ingested, so no volume can be named.
    monographs: { api: null, cite: UNKNOWN },
    lastVerified: VERIFIED_ON,
  }
}

/** Neither of the Wild Life (Protection) Act's plant schedules lists this
 *  species: not Schedule III (specified plants) and not Schedule IV (the CITES
 *  appendices). Checked by reading both lists, not by a name search alone. */
export const NOT_IN_WILDLIFE_SCHEDULES: NonNullable<MaterialIPProfile['wildlife']> = {
  protectedSchedule: null,
  citesListed: false,
  cites: ['in-wlpa-1972'],
}

/** Export control outside the Wild Life Act — DGFT policy, state sandalwood and
 *  red-sanders rules — is not in the corpus, so it cannot be stated. */
export const EXPORT_NOT_VERIFIED: MaterialIPProfile['export'] = { restricted: UNKNOWN, cite: UNKNOWN }
