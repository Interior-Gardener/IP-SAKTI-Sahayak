import type { SourceMaterialEntry } from '../../types/source'

/* ------------------------------------------------------------------ *
 * The mineral and metallic sources — the rasa shelf.
 *
 * Rasa shastra is the branch of Ayurveda that works with metals and
 * minerals, and it is the branch with the sharpest regulatory edge: two
 * of the six below are named in Schedule E(1) of the Drugs and Cosmetics
 * Rules as poisonous substances, which is a fact about the list, not an
 * opinion about the tradition. Nothing here describes how to prepare or
 * take any of them.
 * ------------------------------------------------------------------ */

export const mineralMaterials: SourceMaterialEntry[] = [
  {
    id: 'parada',
    kind: 'mineral',
    name: 'Parada',
    sanskrit: 'Parada, Rasa',
    scientific: 'Mercury (Hg)',
    names: { Sanskrit: 'Parada', Hindi: 'Paara', English: 'Mercury' },
    tagline: 'The metal the whole branch is named after — and a listed poisonous substance.',
    description:
      'Rasa shastra takes its name from rasa, mercury. The tradition is emphatic that it is never used raw: a long sequence of purification steps precedes any preparation, and most preparations combine it with sulphur rather than using it alone. It is kept sealed, which is how it is drawn here.',
    classicalUse:
      'The base of the kupipakwa and parpati preparations, always after shodhana, and most often as kajjali — mercury ground with sulphur until neither is free.',
    shelf: 'rasa',
    // The kupi: round-bottomed, long-necked and sealed shut, because mercury
    // is never kept open.
    model: { draw: 'substance', form: 'vessel', variant: 'flask', size: 0.38, color: '#5e6570', accent: '#c6ccd4', metalness: 0.5, roughness: 0.4 },
  },
  {
    id: 'hingula',
    kind: 'mineral',
    name: 'Hingula',
    sanskrit: 'Hingula',
    scientific: 'Cinnabar (mercuric sulphide)',
    names: { Sanskrit: 'Hingula', Hindi: 'Ingur, Shingraf', English: 'Cinnabar' },
    tagline: 'Mercury already bound to sulphur, as the ore comes out of the ground.',
    description:
      'Cinnabar is the natural sulphide of mercury — a heavy red mineral. Because the mercury in it is already combined, the tradition treats it as a separate material from parada with its own processing, and it is used to extract mercury as well as in its own right.',
    classicalUse: 'Used after shodhana in several classical preparations, and as a source of parada.',
    shelf: 'rasa',
    model: { draw: 'substance', form: 'rock', size: 0.3, color: '#96302a', accent: '#d66a54', metalness: 0.25, roughness: 0.55 },
  },
  {
    id: 'gandhaka',
    kind: 'mineral',
    name: 'Gandhaka',
    sanskrit: 'Gandhaka',
    scientific: 'Sulphur (S)',
    names: { Sanskrit: 'Gandhaka', Hindi: 'Gandhak', English: 'Sulphur' },
    tagline: 'The partner of mercury in nearly every rasa preparation.',
    description:
      'Sulphur is purified through repeated melting in a fatty or milky medium before use. Its main role is with mercury: ground together, the two make kajjali, the black powder that most mercurial preparations start from.',
    classicalUse: 'Shodhita gandhaka, used with parada as kajjali and in preparations such as gandhaka rasayana.',
    shelf: 'rasa',
    // Sulphur breaks in flat bright plates rather than rounding off.
    model: { draw: 'substance', form: 'rock', variant: 'shard', size: 0.3, color: '#d8bf3c', accent: '#f4e79a', roughness: 0.6 },
  },
  {
    id: 'abhraka',
    kind: 'mineral',
    name: 'Abhraka',
    sanskrit: 'Abhraka',
    scientific: 'Mica (a phyllosilicate)',
    names: { Sanskrit: 'Abhraka', Hindi: 'Abhrak', English: 'Mica' },
    tagline: 'A sheet silicate reduced to a bhasma by repeated incineration.',
    description:
      'Mica splits into thin sheets, which is what makes its processing distinctive: it is heated and quenched again and again until it can be ground, then incinerated in a series of firings. A bhasma is graded by tests the tradition specifies, such as whether the powder floats on still water.',
    classicalUse: 'Abhraka bhasma, graded by the number of firings it has been through.',
    shelf: 'rasa',
    // Heaped on the bench, the way a bhasma is shown for its float test.
    model: { draw: 'substance', form: 'powder', size: 0.3, color: '#4a4a52', accent: '#8f8f9c', metalness: 0.35, roughness: 0.5 },
  },
  {
    id: 'swarna',
    kind: 'mineral',
    name: 'Swarna',
    sanskrit: 'Swarna, Hema',
    scientific: 'Gold (Au)',
    names: { Sanskrit: 'Swarna', Hindi: 'Sona', Tamil: 'Thangam', English: 'Gold' },
    tagline: 'Beaten into leaf, then incinerated — the most expensive thing on the shelf.',
    description:
      'Gold enters the pharmacy as thin leaf, which is purified and then incinerated with other materials through many firings to make swarna bhasma. It is a small-quantity material, and the cost is why the preparations that contain it are named after it.',
    classicalUse: 'Swarna bhasma, an ingredient of several classical rasayana preparations.',
    shelf: 'rasa',
    model: { draw: 'substance', form: 'ingot', size: 0.32, color: '#d8a626', accent: '#f6dd93', metalness: 0.85, roughness: 0.28 },
  },
  {
    id: 'loha',
    kind: 'mineral',
    name: 'Loha',
    sanskrit: 'Loha',
    scientific: 'Iron (Fe)',
    names: { Sanskrit: 'Loha', Hindi: 'Lauh', English: 'Iron' },
    tagline: 'The everyday metal of the shelf, and the one with the longest shelf life in the Rules.',
    description:
      'Iron is used as a bhasma, prepared from leaf or filings through purification and repeated incineration with herbal juices. Mandura, the rust of old iron, is treated as a related but separate material.',
    classicalUse: 'Loha bhasma, and the loha and mandura preparations built on it.',
    shelf: 'rasa',
    // Poured into a dish, so the two bhasmas on this shelf are told apart.
    model: { draw: 'substance', form: 'powder', variant: 'dish', size: 0.34, color: '#4b3c34', accent: '#8a6f5e', metalness: 0.3, roughness: 0.65 },
  },
]
