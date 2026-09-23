import type { SourceMaterialEntry } from '../../types/source'

/* ------------------------------------------------------------------ *
 * The animal-derived sources — jangama dravya.
 *
 * Two of these carry a wildlife schedule, and that is the point of the
 * shelf: the same shelf holds honey, which anyone may sell, and musk,
 * which comes from a Schedule I animal. The legal layer is in
 * src/data/ipr/material/, cited; here is what the material is.
 * ------------------------------------------------------------------ */

export const animalMaterials: SourceMaterialEntry[] = [
  {
    id: 'madhu',
    kind: 'animal',
    name: 'Madhu',
    sanskrit: 'Madhu',
    scientific: 'Honey (Apis spp. and Trigona spp.)',
    names: { Sanskrit: 'Madhu', Hindi: 'Shahad', Tamil: 'Then', Telugu: 'Tene', English: 'Honey' },
    tagline: 'The oldest vehicle in the pharmacy, and a preservative in its own right.',
    description:
      'Honey is used more often as a vehicle than as a drug: it carries powders, holds pastes together and keeps preparations from spoiling. The classical texts distinguish several kinds by the bee that made it, and are emphatic that honey is not to be heated.',
    classicalUse:
      'Anupana and yogavahi — the medium a medicine is taken with, said to carry the action of what is mixed into it. Also a base for avaleha (electuaries).',
    shelf: 'animal',
    model: { draw: 'substance', form: 'honeycomb', size: 0.46, color: '#d9a441', accent: '#f0d59a', roughness: 0.45 },
  },
  {
    id: 'ghrita',
    kind: 'animal',
    name: 'Ghrita',
    sanskrit: 'Ghrita',
    scientific: 'Clarified butter from cow milk',
    names: { Sanskrit: 'Ghrita', Hindi: 'Ghee', Tamil: 'Nei', Bengali: 'Ghee', English: 'Clarified butter' },
    tagline: 'The fat that carries fat-soluble actives — and a whole class of preparations.',
    description:
      'Ghee is butter simmered until its water and milk solids are driven off. Ayurveda uses it as a medium in which herbs are cooked, so that what dissolves in fat moves into the ghee; the result is a ghrita, named after the herbs cooked in it.',
    classicalUse:
      'Sneha kalpana: the medicated fats. Ghrita preparations are a large class of classical formulations, and ghee is also used plain in pre-treatment procedures.',
    shelf: 'animal',
    // A wide-mouthed jar: ghee is reached into, not poured.
    model: { draw: 'substance', form: 'vessel', variant: 'jar', size: 0.42, color: '#c9a973', accent: '#e8e0cb', roughness: 0.7 },
  },
  {
    id: 'dugdha',
    kind: 'animal',
    name: 'Dugdha',
    sanskrit: 'Ksheera',
    scientific: 'Milk (Bos indicus and others)',
    names: { Sanskrit: 'Ksheera, Dugdha', Hindi: 'Doodh', Tamil: 'Paal', English: 'Milk' },
    tagline: 'A dravya, a vehicle and the starting point of curd, buttermilk and ghee.',
    description:
      'Milk is treated as a material in its own right, graded by the animal it comes from, and it is the head of a family: curd from milk, buttermilk from curd, butter from buttermilk, ghee from butter. Decoctions made with milk instead of water are a standard classical variation.',
    classicalUse:
      'Ksheerapaka: a preparation in which a drug is boiled with milk and water until only the milk remains.',
    shelf: 'animal',
    // A tall narrow pot, the shape milk is carried in.
    model: { draw: 'substance', form: 'vessel', variant: 'pot', size: 0.4, color: '#8e7a66', accent: '#f3f1ea', roughness: 0.8 },
  },
  {
    id: 'mukta',
    kind: 'animal',
    name: 'Mukta',
    sanskrit: 'Mukta',
    scientific: 'Pearl (Pinctada spp.)',
    names: { Sanskrit: 'Mukta', Hindi: 'Moti', Tamil: 'Muthu', English: 'Pearl' },
    tagline: 'Calcium carbonate laid down in nacre, and a ratna of the rasa shastra tradition.',
    description:
      'Pearl is one of the gem materials used in Ayurvedic pharmacy. It is not used whole: it is processed into a pishti or a bhasma — ground with a liquid, or incinerated — so that it can be dispensed as a fine powder.',
    classicalUse:
      'Mukta pishti and mukta bhasma, made by the ratna processing methods of rasa shastra.',
    shelf: 'animal',
    model: { draw: 'substance', form: 'pearl', size: 0.26, color: '#f2ece0', accent: '#d9cdb6', roughness: 0.18, metalness: 0.12 },
  },
  {
    id: 'shankha',
    kind: 'animal',
    name: 'Shankha',
    sanskrit: 'Shankha',
    scientific: 'Conch shell (Turbinella pyrum)',
    names: { Sanskrit: 'Shankha', Hindi: 'Shankh', Tamil: 'Sangu', English: 'Conch' },
    tagline: 'The temple conch, also processed into a calcium-rich bhasma.',
    description:
      'The conch is familiar as a ritual object; in the pharmacy it is a source of calcium carbonate, purified and incinerated into shankha bhasma. It is drawn here as it is set down: lying on its side, a heavy spindle with a stepped spire at one end, knobs round the shoulder and a long canal at the other.',
    classicalUse: 'Shankha bhasma, prepared by the standard shodhana and marana steps.',
    shelf: 'animal',
    // Creamy outside; the accent is the glossy pink-orange of the aperture lip.
    model: { draw: 'substance', form: 'conch', size: 0.5, color: '#efe6d4', accent: '#e8a88c', roughness: 0.35 },
  },
  {
    id: 'shukti',
    kind: 'animal',
    name: 'Shukti',
    sanskrit: 'Shukti',
    scientific: 'Pearl oyster shell',
    names: { Sanskrit: 'Shukti', Hindi: 'Seep', English: 'Oyster shell' },
    tagline: 'The shell the pearl came from, used where the pearl is not needed.',
    description:
      'Shukti is the shell rather than the pearl, and is used for the same calcium content at a fraction of the cost. Classical practice treats the two as related but separate materials, with their own processing.',
    classicalUse: 'Shukti bhasma, prepared like the other shell and gem materials.',
    shelf: 'animal',
    // One valve of the oyster: grey-brown frilled outside, nacre inside.
    model: { draw: 'substance', form: 'shell', size: 0.4, color: '#a8957a', accent: '#efe8dc', roughness: 0.8 },
  },
  {
    id: 'pravala',
    kind: 'animal',
    name: 'Pravala',
    sanskrit: 'Pravala, Vidruma',
    scientific: 'Red coral (Corallium spp.)',
    names: { Sanskrit: 'Pravala', Hindi: 'Moonga', Tamil: 'Pavalam', English: 'Red coral' },
    tagline: 'A skeleton, not a stone — and the material on this shelf with the most paperwork.',
    description:
      'Red coral is the calcareous skeleton of a colonial marine animal, used in the same gem-processing tradition as pearl. It is also the material here most likely to stop a consignment: corals appear both in the Wild Life (Protection) Act schedules and in the CITES appendices, which the Act carries.',
    classicalUse: 'Pravala pishti and pravala bhasma.',
    shelf: 'animal',
    model: { draw: 'substance', form: 'coral', size: 0.44, color: '#c0492f', accent: '#e28b72', roughness: 0.55 },
  },
  {
    id: 'kasturi',
    kind: 'animal',
    name: 'Kasturi',
    sanskrit: 'Kasturi, Mriganabhi',
    scientific: 'Musk (Moschus spp.)',
    names: { Sanskrit: 'Kasturi', Hindi: 'Kasturi', English: 'Musk' },
    tagline: 'Named throughout the classical texts, and taken from a Schedule I animal.',
    description:
      'Musk is the secretion of the musk deer, named in classical formulations and in perfumery. It is also the clearest case on this shelf where the classical record and the current law point in opposite directions: the deer is a protected animal, and the Act reaches the derived article as well as the animal. A modern formulator substitutes.',
    classicalUse:
      'Named as an ingredient of several classical compound formulations. Present-day manufacture substitutes it; see the IP & law layer for why.',
    shelf: 'animal',
    // The pod: a small closed pouch with a coat of short hair.
    model: { draw: 'substance', form: 'rock', variant: 'pod', size: 0.22, color: '#6b4a34', accent: '#3c2a1e', roughness: 0.8 },
  },
]
