import { UNKNOWN, type MaterialIPProfile } from '../../../types/material'
import {
  ANIMAL_PATENT_NOTE,
  MICROBE_PATENT_NOTE,
  MINERAL_PATENT_NOTE,
  animalProfile,
  microbeProfile,
  mineralProfile,
} from './common'

/* Verified IP profiles for the Rasashala's materials, keyed by material id.
 * A material not listed here is joined with an all-'unknown' profile in
 * src/data/materials/index.ts, the same way an unverified plant is.
 *
 * Every non-'unknown' value below is read out of corpus/normalised/; run
 * `npm run check:ipr` after touching this file. */

/* ---------------------------------------------------------- microbes */

const microbes: Record<string, MaterialIPProfile> = {
  'dhataki-yeast': microbeProfile({
    searchTerm: 'Saccharomyces cerevisiae',
    note: MICROBE_PATENT_NOTE,
  }),
  'dadhi-lactococcus': microbeProfile({
    searchTerm: 'Lactococcus lactis',
    note: MICROBE_PATENT_NOTE,
  }),
  'takra-lactobacillus': microbeProfile({
    searchTerm: 'Lactiplantibacillus plantarum',
    note: MICROBE_PATENT_NOTE,
  }),
  'bacillus-clausii': microbeProfile({
    searchTerm: 'Bacillus clausii',
    note: MICROBE_PATENT_NOTE,
  }),
  'plant-endophyte': microbeProfile({
    searchTerm: 'endophytic fungus medicinal plant',
    note:
      MICROBE_PATENT_NOTE +
      ' An endophyte that makes a compound its host plant is known for raises the s.3(p) question too: the use of the ' +
      'plant may be traditional knowledge even where the organism is newly isolated.',
  }),
  spirulina: microbeProfile({
    searchTerm: 'Arthrospira platensis',
    note: MICROBE_PATENT_NOTE,
  }),
}

/* ---------------------------------------------------------- animal */

const animal: Record<string, MaterialIPProfile> = {
  madhu: animalProfile({ searchTerm: 'honey Apis', note: ANIMAL_PATENT_NOTE }),
  ghrita: animalProfile({ searchTerm: 'ghee clarified butter', note: ANIMAL_PATENT_NOTE }),
  dugdha: animalProfile({ searchTerm: 'milk Ayurveda', note: ANIMAL_PATENT_NOTE }),
  mukta: animalProfile({ searchTerm: 'pearl Pinctada', note: ANIMAL_PATENT_NOTE }),
  shankha: animalProfile({ searchTerm: 'conch shell Turbinella pyrum', note: ANIMAL_PATENT_NOTE }),
  shukti: animalProfile({ searchTerm: 'pearl oyster shell', note: ANIMAL_PATENT_NOTE }),
  pravala: animalProfile({
    searchTerm: 'Corallium red coral',
    note: ANIMAL_PATENT_NOTE,
    // Both schedules were read for this one. Schedule I Part K lists corals;
    // Schedule IV carries the CITES appendices, where Corallium spp. appear in
    // Appendix III as listed by China, and the black and stony corals in
    // Appendix II.
    wildlife: {
      protectedSchedule:
        'Schedule I, Part K (corals) and Schedule IV — Corallium spp. in CITES Appendix III (listed by China), Antipatharia and Scleractinia in Appendix II',
      citesListed: true,
      cites: ['in-wlpa-1972'],
    },
    // s.49I(2): an Appendix III specimen needs an export permit where India
    // listed the species, and a certificate of origin otherwise.
    export: { restricted: true, cite: 'in-wlpa-1972' },
  }),
  kasturi: animalProfile({
    searchTerm: 'musk Moschus',
    note: ANIMAL_PATENT_NOTE,
    wildlife: {
      protectedSchedule:
        'Schedule I, Part A — Alpine, Black, Himalayan and Kashmir musk deer (Moschus spp.); s.49B prohibits dealing in animal articles derived from scheduled animals, and s.2 counts musk as an uncured trophy',
      // The copy of Schedule IV in the corpus does not list Moschus, but that
      // is not the same as the Convention not listing it. Left unknown rather
      // than asserted either way.
      citesListed: UNKNOWN,
      cites: ['in-wlpa-1972'],
    },
  }),
}

/* ---------------------------------------------------------- mineral */

const mineral: Record<string, MaterialIPProfile> = {
  // Read off the Schedule E(1) list by name: "Parada — Mercury".
  parada: mineralProfile({ searchTerm: 'mercury parada bhasma', note: MINERAL_PATENT_NOTE, scheduleE1: true }),
  // "Hingula — Cinnabar", in the same list of drugs of mineral origin.
  hingula: mineralProfile({ searchTerm: 'cinnabar hingula', note: MINERAL_PATENT_NOTE, scheduleE1: true }),
  gandhaka: mineralProfile({ searchTerm: 'sulphur gandhaka', note: MINERAL_PATENT_NOTE, scheduleE1: false }),
  abhraka: mineralProfile({ searchTerm: 'mica abhraka bhasma', note: MINERAL_PATENT_NOTE, scheduleE1: false }),
  swarna: mineralProfile({ searchTerm: 'swarna bhasma gold', note: MINERAL_PATENT_NOTE, scheduleE1: false }),
  loha: mineralProfile({ searchTerm: 'loha bhasma iron', note: MINERAL_PATENT_NOTE, scheduleE1: false }),
}

export const MATERIAL_IPR: Readonly<Record<string, MaterialIPProfile>> = {
  ...microbes,
  ...animal,
  ...mineral,
}
