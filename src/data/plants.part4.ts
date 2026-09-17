import type { PlantEntry } from '../types/plant'

/* ------------------------------------------------------------------ *
 * Vanaspati plant compendium — part 4.
 *
 * The five species the college garden asked for by name: the lotus in
 * the pond, and sadaphuli, dadima, babul and jaswand in the beds. Same
 * conventions as parts 1–3 — Ayurvedic properties follow the Ayurvedic
 * Pharmacopoeia of India.
 * ------------------------------------------------------------------ */

export const plantsPart4: PlantEntry[] = [
  {
    id: 'lotus',
    name: 'Kamal',
    botanical: 'Nelumbo nucifera',
    family: 'Nelumbonaceae',
    names: {
      Sanskrit: 'Padma, Kamala',
      Hindi: 'Kamal',
      Tamil: 'Thamarai',
      Telugu: 'Tamara',
      Bengali: 'Padma',
      Marathi: 'Kamal',
      English: 'Sacred lotus',
    },
    tagline: 'India’s national flower — and a cooling medicine from root to seed.',
    description:
      'Every part of the lotus is used. The rhizome is eaten and given for diarrhoea and bleeding; the seeds are a nourishing food and a classical heart tonic; the petals and stamens are cooling in fever and burning urination. The plant’s hold on Indian imagination — rooted in mud, flowering clean above it — has never been separable from its medicine, and the flower is the emblem of the country.',
    habitat:
      'Ponds, tanks and slow backwaters across India up to 1,500 m, rooted in mud under 30–150 cm of standing water. Widely planted in temple tanks and campus ponds.',
    morphology:
      'A stout aquatic perennial from a creeping banded rhizome buried in mud. Leaves are peltate, up to 60 cm across, held clear of the water on prickly stalks, and shed water completely. Flowers are solitary, fragrant, 15–25 cm across, pink or white, opening at dawn. The receptacle enlarges into the familiar flat-topped seed head.',
    regions: ['Pan-India', 'Indo-Gangetic Plains', 'Deccan Plateau'],
    type: 'Herb',
    partsUsed: ['Rhizome', 'Seed', 'Flower', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Heart & Circulation', 'Digestive', 'Mind & Sleep'],
    uses: [
      {
        title: 'Bleeding and burning',
        detail:
          'Cooling and astringent, the flower and rhizome are classically given for bleeding piles, heavy menstruation and burning urination — pitta conditions in the Ayurvedic reading.',
      },
      {
        title: 'The heart and the mind',
        detail:
          'Lotus seed is a rasayana for the heart; the same preparations are used for palpitation and restlessness, and the seed embryo is used in Chinese practice for exactly this.',
      },
      {
        title: 'Diarrhoea and digestion',
        detail:
          'Rhizome powder binds a loose gut, and the boiled rhizome is convalescent food across eastern India.',
      },
      {
        title: 'Skin and complexion',
        detail: 'Petal paste and lotus-infused oils are cooling applications for prickly heat and rashes.',
      },
    ],
    ayurvedic: {
      rasa: ['Madhura (sweet)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Snigdha (unctuous)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies Pitta and Kapha',
    },
    preparations: [
      { name: 'Kamala kesara', detail: 'Dried stamens, powdered, for bleeding disorders and burning urination.' },
      { name: 'Padmaka churna', detail: 'Seed powder in milk as a heart and strength tonic.' },
      { name: 'Bisa (rhizome)', detail: 'Boiled or powdered rhizome for diarrhoea and as convalescent food.' },
      { name: 'Lotus petal infusion', detail: 'Petals steeped as a cooling drink in summer fevers.' },
    ],
    cultivation: {
      soil: 'Rich clay loam under still water; a heavy, fertile mud is what it wants.',
      climate: 'Full sun and warmth, 22–35 °C. Goes dormant in cold winters and returns from the rhizome.',
      propagation: 'Rhizome sections with at least two nodes, pressed into the mud in late winter.',
      spacing: 'One rhizome to every 1.5–2 m² of pond; it fills space fast.',
      water: '30–120 cm of standing water, still rather than flowing.',
      harvest: 'Flowers at dawn through the monsoon; rhizomes lifted in winter once the leaves die back.',
      tips: [
        'Plant into a submerged container rather than the open pond bed — otherwise it takes the whole pond in two seasons.',
        'Never let the rhizome dry out; it must go from mud to mud.',
        'Water lily and lotus are different plants — lotus leaves stand clear of the water, lily leaves float on it.',
      ],
    },
    precautions: [
      'Rhizomes from polluted water accumulate heavy metals — source them from clean ponds only.',
      'Large amounts of seed can be constipating.',
      'Rhizome is starchy; diabetics should count it as a starchy vegetable rather than a free food.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The leaf surface is so finely textured that water rolls off carrying dirt with it — the effect is named the lotus effect and is copied in self-cleaning materials.',
      'Lotus seeds recovered from a dry lake bed in China germinated after more than a thousand years.',
      'The flower keeps its interior several degrees warmer than the surrounding air while blooming, which draws pollinating beetles.',
    ],
    difficulty: 2,
    accent: '#d4749f',
    model: {
      archetype: 'aquatic',
      height: 0.9,
      stem: { color: '#7c9a63', radius: 0.012, curve: 0.1 },
      branching: { levels: 0, count: 0, angle: 0 },
      leaf: {
        // Peltate and near-circular, dished about the stalk that holds it up
        // in the middle — the shape the morphology note above describes.
        shape: 'peltate',
        length: 0.44,
        width: 0.44,
        arrangement: 'basal',
        density: 10,
        top: '#4d8756',
        bottom: '#93b78c',
        serration: 0,
        droop: 0.05,
        curl: 0.5,
        gloss: 0.45,
      },
      flower: { form: 'lotus', color: '#efabc8', centre: '#f2d264', size: 0.13, count: 3, petals: 24 },
      ground: 'water',
    },
  },

  {
    id: 'sadaphuli',
    name: 'Sadaphuli',
    botanical: 'Catharanthus roseus',
    family: 'Apocynaceae',
    names: {
      Sanskrit: 'Nityakalyani',
      Hindi: 'Sadabahar',
      Tamil: 'Nithyakalyani',
      Telugu: 'Billaganneru',
      Marathi: 'Sadaphuli',
      English: 'Madagascar periwinkle',
    },
    tagline: 'A roadside flower that gave chemotherapy two of its drugs.',
    description:
      'Sadaphuli flowers all year, which is what both its Sanskrit and Marathi names say. Traditional practice used it for diabetes and for wasp stings; the modern story is larger. Screening the plant in the 1950s turned up vinblastine and vincristine, alkaloids that became frontline treatments for Hodgkin lymphoma and childhood leukaemia and turned two near-certain deaths into survivable illnesses.',
    habitat:
      'Native to Madagascar, naturalised across India on waste ground, roadsides and coastal sand. Grows in almost any soil and needs no care at all.',
    morphology:
      'An erect perennial herb or small subshrub 30–80 cm tall, with milky latex. Leaves are opposite, oblong, glossy and dark green with a pale midrib. Flowers are solitary, salver-shaped, five-lobed, white to rose-pink with a darker eye, borne continuously. Fruit is a pair of slender follicles.',
    regions: ['Pan-India', 'Coastal', 'Deccan Plateau'],
    type: 'Herb',
    partsUsed: ['Leaf', 'Root', 'Whole plant'],
    systems: ['Ayurveda', 'Siddha', 'Homoeopathy'],
    therapeutic: ['Metabolic', 'Immunity', 'Skin & Hair'],
    uses: [
      {
        title: 'The cancer alkaloids',
        detail:
          'Vinblastine and vincristine, isolated from the leaf, are on the WHO Essential Medicines List and remain standard in Hodgkin lymphoma and acute childhood leukaemia.',
      },
      {
        title: 'Blood sugar in folk use',
        detail:
          'Leaf infusions are a widespread folk treatment for diabetes across the tropics — the lead that sent researchers to the plant in the first place, though the alkaloids they found act elsewhere.',
      },
      {
        title: 'Stings and skin',
        detail: 'Crushed leaf is applied to wasp stings, and the juice to bleeding minor wounds.',
      },
      {
        title: 'Garden and temple flower',
        detail:
          'Grown at doorways and in temple gardens across India for its unbroken flowering, which is what the name Nityakalyani celebrates.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Pitta',
    },
    preparations: [
      { name: 'Leaf infusion', detail: 'A few leaves steeped in hot water, taken in folk practice for blood sugar.' },
      { name: 'Fresh leaf poultice', detail: 'Crushed leaf applied to stings and small wounds.' },
      { name: 'Root decoction', detail: 'Used in Siddha practice, and the richest part in alkaloids.' },
    ],
    cultivation: {
      soil: 'Any well-drained soil, including poor sandy ground; hates waterlogging.',
      climate: 'Warm and bright, 20–35 °C. Sensitive to frost, otherwise indestructible.',
      propagation: 'Seed, or soft cuttings which root in a fortnight.',
      spacing: '30 × 30 cm.',
      water: 'Light. It flowers better kept slightly dry than kept wet.',
      harvest: 'Leaves any time; roots after the second year for alkaloid content.',
      tips: [
        'Pinch the growing tips once early and the plant bushes out instead of running to a single stem.',
        'It self-seeds freely — a single plant becomes a patch.',
        'Poor soil gives more flowers than rich soil does.',
      ],
    },
    precautions: [
      'The plant is toxic in quantity. The isolated drugs are given only by oncologists under close monitoring — self-medicating the plant for cancer is dangerous and useless.',
      'Do not use the leaf infusion alongside prescribed diabetes medication without supervision; the combination can drop blood sugar too far.',
      'Avoid in pregnancy.',
    ],
    conservation: 'Cultivated',
    facts: [
      'A child diagnosed with acute lymphoblastic leukaemia in 1960 had a survival chance close to nil; with vincristine as part of combination therapy it now exceeds 90 per cent.',
      'Madagascar, the plant’s home, received nothing from the drugs for decades — the case is a standard example in debates on benefit-sharing.',
      'It takes about 500 kg of dried leaf to yield 1 g of vincristine.',
    ],
    difficulty: 1,
    accent: '#c86aa0',
    model: {
      archetype: 'herb',
      height: 0.55,
      stem: { color: '#6f8a5c', radius: 0.008, curve: 0.16 },
      branching: { levels: 2, count: 3, angle: 45, startAt: 0.2, taper: 0.7 },
      leaf: {
        shape: 'obovate',
        length: 0.055,
        width: 0.024,
        arrangement: 'opposite',
        density: 7,
        top: '#2f6b3c',
        bottom: '#6f9a68',
        serration: 0,
        droop: 0.2,
        curl: 0.16,
        gloss: 0.55,
      },
      flower: { form: 'solitary', color: '#e07ab0', centre: '#f4e08a', size: 0.022, count: 9, petals: 5 },
      ground: 'soil',
    },
  },

  {
    id: 'pomegranate',
    name: 'Dadima',
    botanical: 'Punica granatum',
    family: 'Lythraceae',
    names: {
      Sanskrit: 'Dadima',
      Hindi: 'Anar',
      Tamil: 'Madhulai',
      Telugu: 'Danimma',
      Marathi: 'Dalimb',
      English: 'Pomegranate',
    },
    tagline: 'The fruit Ayurveda reaches for when a gut is inflamed and a body is weak.',
    description:
      'Ayurveda separates the sweet fruit from the sour and treats them as different drugs — the sweet as a cooling tonic, the sour as digestive and appetising. The rind and root bark are a different medicine again: strongly astringent, long used against diarrhoea, dysentery and intestinal worms. It is one of the few classical drugs safe enough to give a child, a pregnant woman and an old man in the same week.',
    habitat:
      'Native to Iran and the Himalayan foothills, cultivated across India and especially Maharashtra, Karnataka and Gujarat. Thrives in hot dry summers with cool winters.',
    morphology:
      'A deciduous shrub or small tree 2–5 m tall, often spiny, with smooth grey bark. Leaves are opposite, oblong, glossy and small. Flowers are showy, scarlet, with a thick fleshy calyx tube. The fruit is a leathery-skinned balusta packed with seeds in juicy red arils, divided by white membrane.',
    regions: ['Deccan Plateau', 'Arid & Desert', 'Himalayan'],
    type: 'Shrub',
    partsUsed: ['Fruit', 'Rind', 'Seed', 'Root bark', 'Flower'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Digestive', 'Heart & Circulation', 'Immunity'],
    uses: [
      {
        title: 'Diarrhoea and dysentery',
        detail:
          'Dried rind decoction is a classical antidiarrhoeal — the tannins bind the gut wall and reduce fluid loss, and it is a staple of household practice.',
      },
      {
        title: 'Digestion and appetite',
        detail:
          'Sour pomegranate juice with rock salt and pepper is given for poor appetite, nausea and post-fever weakness.',
      },
      {
        title: 'Intestinal worms',
        detail:
          'Root bark contains pelletierine alkaloids and is a traditional taeniacide, effective against tapeworm — a use that entered European pharmacopoeias too.',
      },
      {
        title: 'Heart and blood',
        detail:
          'Modern trials of the juice report modest reductions in blood pressure and improvements in lipid oxidation, which fits its old reputation as a heart-strengthening fruit.',
      },
    ],
    ayurvedic: {
      rasa: ['Madhura (sweet)', 'Amla (sour)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Snigdha (unctuous)'],
      virya: 'Anushna (neither heating nor cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies all three doshas — one of the few drugs said to do so',
    },
    preparations: [
      { name: 'Dadimashtaka churna', detail: 'Eight-ingredient powder built on pomegranate, for digestion and diarrhoea.' },
      { name: 'Rind decoction', detail: 'Dried rind boiled down, taken for loose motions and dysentery.' },
      { name: 'Dadima svarasa', detail: 'Fresh juice with honey for anaemia and weakness.' },
      { name: 'Root bark decoction', detail: 'Given under supervision for tapeworm.' },
    ],
    cultivation: {
      soil: 'Deep loam, tolerant of alkaline and slightly saline soil; must drain freely.',
      climate: 'Hot dry summer and cool winter is ideal. Rain at fruiting splits the fruit.',
      propagation: 'Hardwood cuttings or air layers; seed does not come true.',
      spacing: '4 × 4 m in orchards, closer for garden shrubs.',
      water: 'Regular but moderate; irregular watering is the main cause of fruit cracking.',
      harvest: 'Five to seven months from flowering, when the fruit sounds metallic when tapped.',
      tips: [
        'Keep it to three or four main stems and remove the suckers, or it becomes an impenetrable thicket.',
        'Withhold water for a few weeks to force flowering — the standard bahar treatment in Maharashtra.',
        'Bag the fruit against the pomegranate butterfly rather than spraying.',
      ],
    },
    precautions: [
      'Root bark is toxic in overdose — cramping and vision disturbance — and is not a home remedy.',
      'The juice inhibits the same liver enzyme as grapefruit and can raise the levels of some prescribed drugs.',
      'Sour fruit can aggravate acidity in people already prone to it.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Ayurveda calls dadima tridoshaghna — pacifying all three doshas — which very few drugs are said to do.',
      'India is the world’s largest producer, and Maharashtra alone grows more than half the national crop.',
      'The many-seeded fruit is a fertility symbol from the Mediterranean to China, and appears in Greek, Jewish, Christian and Zoroastrian imagery alike.',
    ],
    difficulty: 2,
    accent: '#b8422f',
    model: {
      archetype: 'shrub',
      height: 2.4,
      stem: { color: '#8f8474', radius: 0.03, curve: 0.24, woody: true },
      branching: { levels: 2, count: 4, angle: 44, startAt: 0.2, taper: 0.68 },
      leaf: {
        shape: 'obovate',
        length: 0.05,
        width: 0.018,
        arrangement: 'opposite',
        density: 9,
        top: '#4a7c3f',
        bottom: '#82a86f',
        serration: 0,
        droop: 0.22,
        curl: 0.14,
        gloss: 0.6,
      },
      flower: { form: 'solitary', color: '#d94a2f', centre: '#f5c96a', size: 0.03, count: 6, petals: 6 },
      fruit: { shape: 'round', color: '#b8452f', size: 0.05, count: 5 },
      ground: 'soil',
    },
  },

  {
    id: 'babul',
    name: 'Babul',
    botanical: 'Acacia nilotica',
    family: 'Fabaceae',
    names: {
      Sanskrit: 'Babbula',
      Hindi: 'Babul, Kikar',
      Tamil: 'Karuvelam',
      Telugu: 'Nallatumma',
      Marathi: 'Babhul',
      English: 'Gum arabic tree',
    },
    tagline: 'The thorn tree of the dry plains — a toothbrush, a gum and a tannin all at once.',
    description:
      'Babul is the tree of hard country: it holds together eroding soil, feeds goats through a drought and supplies a gum, a tannin and a medicine. Its twigs are the classical datun, chewed into a brush, and its bark is one of the strongest astringents in the Indian materia medica, used for loose gums, sore throats and diarrhoea. Botanists have moved it to the genus Vachellia, but every pharmacopoeia and every village still calls it Acacia.',
    habitat:
      'Dry deciduous tracts and riverbanks across the plains of India, Pakistan and Africa; common in Rajasthan, Gujarat, Maharashtra and the Deccan. Survives on 250 mm of rain a year.',
    morphology:
      'A thorny tree 5–15 m tall, with dark fissured bark and paired straight white stipular spines. Leaves are bipinnate with many tiny leaflets. Flowers are bright yellow globose heads, strongly scented. Pods are grey, necklace-like, constricted between the seeds.',
    regions: ['Arid & Desert', 'Deccan Plateau', 'Indo-Gangetic Plains'],
    type: 'Tree',
    partsUsed: ['Bark', 'Gum', 'Pod', 'Twig', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Digestive', 'Wound Care', 'Respiratory'],
    uses: [
      {
        title: 'Teeth and gums',
        detail:
          'A chewed babul twig is the original datun — fibres brush, and the astringent sap tightens bleeding gums. Bark decoction is used as a gargle for loose teeth and mouth ulcers.',
      },
      {
        title: 'Diarrhoea and bleeding',
        detail:
          'Bark and pod are strongly astringent and are given for dysentery, bleeding piles and excessive menstruation.',
      },
      {
        title: 'Wounds and skin',
        detail:
          'Bark decoction washes ulcers and burns; the gum is applied to cracked skin and used as a demulcent for sore throats.',
      },
      {
        title: 'Strength and vigour',
        detail:
          'The gum in milk is a traditional convalescent food across north India, and the pods are given for general debility.',
      },
    ],
    ayurvedic: {
      rasa: ['Kashaya (astringent)'],
      guna: ['Guru (heavy)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Pitta and Kapha, may aggravate Vata',
    },
    preparations: [
      { name: 'Babul datun', detail: 'A fresh twig chewed at one end into a brush — the daily use most Indians know.' },
      { name: 'Bark decoction gargle', detail: 'For bleeding gums, mouth ulcers and sore throat.' },
      { name: 'Gum in milk', detail: 'Babul gum dissolved in warm milk as a strengthening drink.' },
      { name: 'Pod powder', detail: 'Dried pods powdered, given for diarrhoea and general weakness.' },
    ],
    cultivation: {
      soil: 'Almost anything — sand, clay, saline and alkaline ground included. Fixes its own nitrogen.',
      climate: 'Hot and dry, 25–45 °C. Deeply drought-hardy once its taproot is down.',
      propagation: 'Seed, scarified or soaked in hot water to break dormancy.',
      spacing: '5 × 5 m; it needs room and light.',
      water: 'Water through the first dry season only, then leave it alone.',
      harvest: 'Gum through the hot months; bark from thinnings rather than from a standing tree.',
      tips: [
        'Never ring-bark a live tree for medicine — take bark from branches pruned in rotation.',
        'The spines are serious; plant it away from paths and play areas.',
        'It is a nurse tree in degraded land, but it seeds aggressively and is invasive outside its range.',
      ],
    },
    precautions: [
      'Strongly astringent; prolonged internal use causes constipation and can hinder iron absorption.',
      'Not for people with Vata-type dryness without a suitable anupana.',
      'Aggressive coloniser outside its native range — do not plant it where it is not already at home.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The tree yields a true gum arabic, still used as a food emulsifier and in traditional inks.',
      'Twigs sold as datun in Indian markets are most often babul or neem — the two most-used chewing sticks in the country.',
      'Botanists reclassified it as Vachellia nilotica in 2005, which is why old and new floras disagree about its name.',
    ],
    difficulty: 2,
    accent: '#c9a227',
    model: {
      archetype: 'tree',
      height: 3.4,
      stem: { color: '#6a5c4a', radius: 0.052, curve: 0.22, woody: true },
      branching: { levels: 3, count: 3, angle: 52, startAt: 0.32, taper: 0.66 },
      leaf: {
        shape: 'elliptic',
        compound: 'bipinnate',
        leaflets: 11,
        length: 0.012,
        width: 0.004,
        arrangement: 'alternate',
        density: 8,
        top: '#5e8a4a',
        bottom: '#87a86d',
        serration: 0,
        droop: 0.16,
        curl: 0.1,
        gloss: 0.25,
      },
      flower: { form: 'cluster', color: '#f0c531', centre: '#e6b41f', size: 0.014, count: 12, petals: 5 },
      fruit: { shape: 'pod', color: '#9a9483', size: 0.05, count: 5 },
      ground: 'sand',
    },
  },

  {
    id: 'hibiscus',
    name: 'Jaswand',
    botanical: 'Hibiscus rosa-sinensis',
    family: 'Malvaceae',
    names: {
      Sanskrit: 'Japa',
      Hindi: 'Gudhal',
      Tamil: 'Semparuthi',
      Telugu: 'Mandara',
      Marathi: 'Jaswand',
      English: 'Shoe flower',
    },
    tagline: 'The temple flower offered to Kali — and the classic Indian hair tonic.',
    description:
      'Jaswand is the red flower laid before Kali and Ganesha, and the same flower is boiled in coconut oil in every second household of Kerala and Tamil Nadu for the hair. Its mucilage conditions and its mild acidity closes the cuticle, which is why the oil and the leaf-slip have outlasted every fashion in shampoo. Classical practice also uses the flower for the heart and for menstrual complaints.',
    habitat:
      'Probably of East Asian origin and now grown everywhere in India below 1,200 m, in gardens, hedges and temple grounds. Flowers nearly year-round in the warm south.',
    morphology:
      'A glabrous evergreen shrub 2–4 m tall. Leaves are alternate, broadly ovate, coarsely toothed toward the tip, glossy dark green. Flowers are solitary, axillary, 8–12 cm across, typically crimson, with the staminal column projecting well beyond the petals — the feature that makes the family unmistakable.',
    regions: ['Pan-India', 'Coastal', 'Western Ghats'],
    type: 'Shrub',
    partsUsed: ['Flower', 'Leaf', 'Root'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Skin & Hair', 'Heart & Circulation', 'Women’s Health'],
    uses: [
      {
        title: 'Hair and scalp',
        detail:
          'Flowers and leaves infused in coconut oil, or crushed to a slip, condition the hair, reduce dandruff and are held to slow greying and hair fall — the best-known use by far.',
      },
      {
        title: 'The heart',
        detail:
          'Japa is a classical cardiac drug, given for palpitation and as a cooling tonic; modern work on hibiscus species supports a mild blood-pressure-lowering effect.',
      },
      {
        title: 'Menstrual complaints',
        detail:
          'Flower decoction is used for painful and heavy periods, and in Siddha practice for regulating the cycle.',
      },
      {
        title: 'Ritual offering',
        detail:
          'The red flower is the offering to Kali and to Ganesha, which is why it grows at almost every temple in the south.',
      },
    ],
    ayurvedic: {
      rasa: ['Kashaya (astringent)', 'Madhura (sweet)'],
      guna: ['Laghu (light)', 'Snigdha (unctuous)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Pitta and Kapha',
    },
    preparations: [
      { name: 'Japa kusumadi taila', detail: 'Flowers boiled in coconut oil — the household hair oil of the south.' },
      { name: 'Flower and leaf slip', detail: 'Fresh flowers and leaves crushed in water to a mucilage, used as a shampoo.' },
      { name: 'Japa churna', detail: 'Dried flower powder, taken for menstrual and cardiac complaints.' },
      { name: 'Hibiscus tea', detail: 'Petals steeped as a cooling drink, more usually made from Hibiscus sabdariffa.' },
    ],
    cultivation: {
      soil: 'Well-drained loam with compost; slightly acidic suits it best.',
      climate: 'Warm and humid, 20–35 °C. Needs protection from frost and cold wind.',
      propagation: 'Semi-hardwood cuttings root readily in the monsoon; also air-layered.',
      spacing: '1.5 × 1.5 m as a shrub, 60 cm as a hedge.',
      water: 'Regular. It drops buds if allowed to dry out at flowering.',
      harvest: 'Flowers in the morning as they open; leaves any time.',
      tips: [
        'Prune hard after the cold season — flowers come on new wood, so an unpruned bush flowers less each year.',
        'Yellowing leaves with green veins usually mean iron, not water.',
        'Buds dropping unopened is almost always irregular watering.',
      ],
    },
    precautions: [
      'Avoid medicinal doses in pregnancy — the flower is traditionally regarded as emmenagogue and abortifacient.',
      'May add to the effect of blood-pressure medication; watch for dizziness.',
      'Fresh flower slip on the scalp can irritate broken or inflamed skin.',
    ],
    conservation: 'Cultivated',
    facts: [
      'The English name shoe flower comes from its use as a black shoe polish in colonial India — the crushed petals darken leather.',
      'Its pollen grains are so large and spiny that they are a standard teaching specimen in Indian botany classes.',
      'The flower is a natural pH indicator: its anthocyanins turn from red through purple to green as alkalinity rises.',
    ],
    difficulty: 1,
    accent: '#c9354b',
    model: {
      archetype: 'shrub',
      height: 1.7,
      stem: { color: '#7c7259', radius: 0.02, curve: 0.26, woody: true },
      branching: { levels: 2, count: 4, angle: 46, startAt: 0.22, taper: 0.7 },
      leaf: {
        shape: 'ovate',
        length: 0.075,
        width: 0.045,
        arrangement: 'alternate',
        density: 7,
        top: '#2f6b39',
        bottom: '#6f9a66',
        serration: 0.65,
        droop: 0.26,
        curl: 0.18,
        gloss: 0.62,
      },
      flower: { form: 'solitary', color: '#d1364c', centre: '#f2d264', size: 0.055, count: 7, petals: 5 },
      ground: 'soil',
    },
  },
]
