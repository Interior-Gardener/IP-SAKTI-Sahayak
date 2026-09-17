import type { PlantEntry } from '../types/plant'

/* ------------------------------------------------------------------ *
 * Vanaspati plant compendium — part 1.
 * Ayurvedic properties follow Ayurvedic Pharmacopoeia of India
 * conventions: rasa (taste), guna (quality), virya (potency),
 * vipaka (post-digestive effect) and doshic action.
 * ------------------------------------------------------------------ */

export const plantsPart1: PlantEntry[] = [
  {
    id: 'tulsi',
    name: 'Tulsi',
    botanical: 'Ocimum tenuiflorum',
    family: 'Lamiaceae',
    names: {
      Sanskrit: 'Surasa, Sulabha',
      Hindi: 'Tulsi',
      Tamil: 'Thulasi',
      Telugu: 'Tulasi',
      Bengali: 'Tulsi',
      Marathi: 'Tulas',
      English: 'Holy Basil',
    },
    tagline: 'The queen of herbs, grown at the threshold of nearly every Indian home.',
    description:
      'Tulsi is the most venerated plant in Indian households — planted in a raised courtyard altar and tended daily. Beyond ritual it is a genuine adaptogen: an aromatic mint-family herb whose eugenol-rich leaves are the first response to a cough, a fever, or a stressful week. Two cultivars dominate: Rama tulsi with green leaves and a milder taste, and Krishna tulsi with purple-tinged foliage and a sharper, clove-like bite.',
    habitat:
      'Cultivated throughout India from sea level to 1,800 m; naturalised on wasteland, roadsides and riverbanks. Thrives in warm humid conditions in full sun.',
    morphology:
      'An erect, much-branched aromatic undershrub 30–75 cm tall with hairy, square stems. Leaves are opposite, ovate, 2–5 cm long with a toothed margin and a surface dotted with aromatic oil glands. Tiny purplish flowers are borne in slender elongated racemes of whorled clusters.',
    regions: ['Pan-India', 'Indo-Gangetic Plains', 'Deccan Plateau'],
    type: 'Herb',
    partsUsed: ['Leaf', 'Seed', 'Whole plant', 'Root'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Respiratory', 'Immunity', 'Mind & Sleep', 'Digestive'],
    uses: [
      {
        title: 'Cough, cold and fever',
        detail:
          'A decoction of 10–12 leaves with ginger, black pepper and honey is the classical household remedy for kasa (cough) and jwara (fever). The volatile oil is expectorant and mildly antipyretic.',
      },
      {
        title: 'Adaptogen for stress',
        detail:
          'Studies on standardised tulsi extract report reduced cortisol reactivity and improved subjective stress scores, consistent with its Ayurvedic role as a medhya rasayana.',
      },
      {
        title: 'Oral and skin hygiene',
        detail:
          'Chewed leaves or a leaf paste is applied to acne, insect bites and ringworm; the eugenol content contributes antibacterial and anti-inflammatory action.',
      },
      {
        title: 'Mosquito and pest deterrence',
        detail:
          'Its volatile terpenes repel mosquitoes, one reason the plant is traditionally sited at the entrance of a house and near stored water.',
      },
    ],
    ayurvedic: {
      rasa: ['Katu (pungent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)', 'Tikshna (sharp)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; may aggravate Pitta in excess',
    },
    preparations: [
      { name: 'Tulsi kwatha', detail: 'Decoction of fresh leaves with ginger and pepper for cold and cough.' },
      { name: 'Swarasa', detail: 'Fresh leaf juice, 5–10 ml, taken with honey.' },
      { name: 'Tulsi arka', detail: 'Steam distillate used in respiratory formulations.' },
      { name: 'Herbal tea', detail: 'Dried leaf infused for five minutes; a daily adaptogenic drink.' },
    ],
    cultivation: {
      soil: 'Well-drained loamy or sandy soil, pH 6.0–7.5, moderately rich in organic matter.',
      climate: 'Warm and humid, 20–35 °C. Frost-sensitive.',
      propagation: 'Seed sown in nursery beds in March–April and transplanted at the four-leaf stage; also semi-hardwood cuttings.',
      spacing: '40 × 40 cm in the field; a 25 cm pot suffices at home.',
      water: 'Regular light watering, never waterlogged. Reduce in winter.',
      harvest: 'First leaf harvest 90–95 days after transplanting, then every 65–75 days. Cut on a dry sunny morning for peak oil content.',
      tips: [
        'Pinch off flowering spikes to keep the plant leafy and delay woodiness.',
        'Grow near tomatoes and chillies — it suppresses several sap-sucking pests.',
        'Repot yearly; tulsi exhausts a small pot within one season.',
      ],
    },
    precautions: [
      'May have a mild antifertility effect at high doses; avoid therapeutic doses when trying to conceive.',
      'Can potentiate anticoagulants — pause two weeks before scheduled surgery.',
      'Excess may aggravate Pitta, causing acidity in sensitive individuals.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Tulsi is the only plant in India worshipped as a deity, with its own festival — Tulsi Vivah.',
      'Krishna tulsi owes its purple pigment to anthocyanins, the same class of compounds found in blueberries.',
      'The plant is a member of the mint family, which is why its stem is square in cross-section.',
    ],
    difficulty: 1,
    accent: '#5b8f4f',
    /* Built to the morphology above rather than by eye: an erect,
     * much-branched undershrub of 30–75 cm, hairy square stems, opposite
     * ovate leaves of 2–5 cm with a shallowly toothed margin, and the
     * whorled purple racemes standing clear of the foliage. The leaves
     * were half as large again as the text describes, which was most of
     * what made it read as a generic bush. */
    model: {
      archetype: 'herb',
      height: 0.56,
      // Purple-flushed green, as the stems of a well-grown plant go.
      stem: { color: '#63753f', radius: 0.0095, curve: 0.22, square: true },
      // Much-branched, and branching low: a tulsi is bushy from the base.
      branching: { levels: 3, count: 3, angle: 40, startAt: 0.16, taper: 0.6 },
      leaf: {
        shape: 'ovate',
        // 4.5 x 2.7 cm — mid-range of the 2–5 cm the description gives.
        length: 0.045,
        width: 0.027,
        // Opposite pairs, each a quarter-turn on the last: decussate,
        // which the generator already does for `opposite`.
        arrangement: 'opposite',
        density: 8,
        top: '#4b7b3d',
        bottom: '#7ba169',
        // Shallowly toothed, not cut: tulsi's margin is only subserrate.
        serration: 0.36,
        droop: 0.16,
        curl: 0.2,
        // Matt and finely hairy rather than glossy — it is not a laurel.
        gloss: 0.18,
      },
      flower: {
        form: 'verticillaster',
        color: '#b98cd0',
        centre: '#efe3c6',
        size: 0.011,
        count: 4,
        petals: 5,
      },
      ground: 'soil',
    },
  },

  {
    id: 'neem',
    name: 'Neem',
    botanical: 'Azadirachta indica',
    family: 'Meliaceae',
    names: {
      Sanskrit: 'Nimba, Arishta',
      Hindi: 'Neem',
      Tamil: 'Vembu',
      Telugu: 'Vepa',
      Bengali: 'Nim',
      Kannada: 'Bevu',
      English: 'Indian Lilac',
    },
    tagline: 'The village pharmacy — a tree whose every part treats something.',
    description:
      'Called arishta, "the reliever of sickness", neem is the archetypal bitter. It is a fast-growing evergreen that shades village squares while supplying twigs for toothbrushes, leaves for storing grain, oil for skin disease and bark for fever. Its principal compound, azadirachtin, is one of the most studied botanical insecticides in the world and underpins a large organic-farming industry.',
    habitat:
      'Native to the Indian subcontinent; grows on almost any soil including saline and stony ground, from sea level to 1,500 m. Extremely drought hardy, tolerating 400 mm of annual rainfall.',
    morphology:
      'An evergreen tree reaching 15–20 m with a short bole and a spreading rounded crown. Bark is grey and longitudinally fissured. Leaves are alternate and imparipinnate, 20–40 cm long with 8–19 curved, sharply serrate leaflets. Small white honey-scented flowers hang in axillary panicles; the fruit is a yellow-green ovoid drupe.',
    regions: ['Pan-India', 'Deccan Plateau', 'Arid & Desert', 'Indo-Gangetic Plains'],
    type: 'Tree',
    partsUsed: ['Leaf', 'Bark', 'Seed oil', 'Twig', 'Flower', 'Fruit'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Skin & Hair', 'Immunity', 'Wound Care', 'Metabolic'],
    uses: [
      {
        title: 'Skin disorders (kushtha)',
        detail:
          'Neem leaf paste, or a bath in neem-leaf water, is the standard traditional management for eczema, scabies, acne and chickenpox lesions, combining antimicrobial and anti-inflammatory action.',
      },
      {
        title: 'Oral care',
        detail:
          'A tender twig used as a datun mechanically cleans while releasing antibacterial compounds; neem is now a standard ingredient in Indian toothpaste.',
      },
      {
        title: 'Blood-sugar support',
        detail:
          'Leaf extracts show hypoglycaemic activity in clinical and animal studies; classically used as a supportive measure in prameha, the metabolic and urinary disorders.',
      },
      {
        title: 'Natural pesticide and grain protection',
        detail:
          'Dried leaves layered into grain bins deter weevils; azadirachtin-based sprays disrupt insect moulting without harming pollinators at field doses.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Pitta; may aggravate Vata',
    },
    preparations: [
      { name: 'Nimba taila', detail: 'Cold-pressed seed oil for external application in skin disease.' },
      { name: 'Panchanimba churna', detail: 'Powder of five neem parts used in chronic skin conditions.' },
      { name: 'Nimbadi kwatha', detail: 'Bark decoction for fever and as a bitter tonic.' },
      { name: 'Neem bath', detail: 'Leaves boiled and added to bathing water for itching and rashes.' },
    ],
    cultivation: {
      soil: 'Tolerates poor, sandy, stony and saline soils; needs good drainage and dislikes waterlogged clay.',
      climate: 'Hot semi-arid to sub-humid, 21–32 °C, withstanding 45 °C. Sensitive to frost when young.',
      propagation: 'Fresh depulped seed sown immediately — viability lasts only two to three weeks; also root suckers and tissue culture.',
      spacing: '5 × 5 m in plantations; 8–10 m as an avenue tree.',
      water: 'Weekly for the first two years, then rainfed. A deep taproot makes it self-sufficient.',
      harvest: 'Leaves year-round, fruits June–August, bark only from mature trees by careful partial stripping.',
      tips: [
        'Never harvest bark in a full ring — it girdles and kills the tree. Take vertical strips from one quarter only.',
        'Seed loses viability quickly; sow within a fortnight of collection.',
        'Plant on the south-west side of a house — the dense crown drops summer wall temperatures noticeably.',
      ],
    },
    precautions: [
      'Neem oil is toxic if ingested by infants and small children, with reported cases of encephalopathy. Strictly external for children.',
      'Contraindicated in pregnancy and while trying to conceive; documented antifertility effects.',
      'Long high-dose internal use may stress the liver and deplete Vata further in already weakened people.',
    ],
    conservation: 'Least Concern',
    facts: [
      'A 1995 European patent on neem’s fungicidal use was revoked in 2005 after India argued it was prior traditional knowledge — a landmark biopiracy case.',
      'One mature tree yields up to 50 kg of fruit a year, giving roughly five litres of oil.',
      'Fifty thousand neem trees were planted on the Arafat plains near Mecca to shade pilgrims.',
    ],
    difficulty: 1,
    accent: '#3f7d3a',
    model: {
      archetype: 'tree',
      height: 2.9,
      stem: { color: '#7d6b52', radius: 0.055, curve: 0.16, woody: true },
      branching: { levels: 3, count: 5, angle: 38, startAt: 0.42, taper: 0.62 },
      leaf: {
        shape: 'lanceolate',
        compound: 'pinnate',
        leaflets: 9,
        length: 0.055,
        width: 0.018,
        arrangement: 'alternate',
        density: 5,
        top: '#3d7a37',
        bottom: '#6b9a56',
        serration: 0.75,
        droop: 0.35,
        curl: 0.18,
        gloss: 0.4,
      },
      flower: { form: 'panicle', color: '#f4f1e2', size: 0.008, count: 6, petals: 5 },
      fruit: { shape: 'ovoid', color: '#c8cf6a', size: 0.016, count: 8 },
      ground: 'soil',
    },
  },

  {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    botanical: 'Withania somnifera',
    family: 'Solanaceae',
    names: {
      Sanskrit: 'Ashwagandha, Varahakarni',
      Hindi: 'Asgandh',
      Tamil: 'Amukkara',
      Telugu: 'Pennerugadda',
      Marathi: 'Askandha',
      English: 'Indian Winter Cherry',
    },
    tagline: 'The strength of a horse — Ayurveda’s foremost rejuvenative for the nervous system.',
    description:
      'The name means "smell of a horse", referring both to the odour of the fresh root and to the vigour it is said to confer. Ashwagandha is a rasayana: a class of herbs taken over months to rebuild tissue rather than to suppress a symptom. Its withanolides are among the best clinically documented Indian phytochemicals, with trials covering stress, sleep quality and muscle strength.',
    habitat:
      'Dry sub-tropical scrub and wasteland; grows on marginal sandy soils across drier parts of India up to 1,700 m. Madhya Pradesh and Rajasthan form the commercial heartland.',
    morphology:
      'An erect greyish tomentose undershrub 30–150 cm tall. Leaves are simple and ovate, up to 10 cm, dull green and covered in fine star-shaped hairs. Flowers are small, inconspicuous, greenish-yellow and bell-shaped. The fruit is a smooth orange-red berry enclosed in an inflated papery calyx, giving the winter-cherry name.',
    regions: ['Arid & Desert', 'Deccan Plateau', 'Indo-Gangetic Plains'],
    type: 'Shrub',
    partsUsed: ['Root', 'Leaf', 'Seed'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Mind & Sleep', 'Immunity', 'Joints & Pain', 'Women’s Health'],
    uses: [
      {
        title: 'Stress and anxiety',
        detail:
          'Randomised trials of 300–600 mg per day of root extract over eight weeks report significant reductions in perceived-stress scores and serum cortisol against placebo.',
      },
      {
        title: 'Sleep quality',
        detail:
          'The species epithet somnifera means "sleep-bearing". Evening dosing improves sleep onset latency and efficiency, particularly in stress-linked insomnia.',
      },
      {
        title: 'Strength and recovery',
        detail:
          'Classically given with milk and ghee to underweight or convalescing patients; resistance-training studies show gains in muscle mass and strength.',
      },
      {
        title: 'Joint comfort',
        detail:
          'Anti-inflammatory withanolides support its traditional use in amavata, the rheumatoid-type joint pain, usually combined with guggulu.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Katu (pungent)', 'Madhura (sweet)'],
      guna: ['Laghu (light)', 'Snigdha (unctuous)'],
      virya: 'Ushna (heating)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies Vata and Kapha; balya and rasayana',
    },
    preparations: [
      { name: 'Ashwagandha churna', detail: '3–6 g of root powder with warm milk at night — the classical rasayana dose.' },
      { name: 'Ashwagandharishta', detail: 'A fermented liquid preparation for nervous exhaustion and low mood.' },
      { name: 'Ashwagandhadi lehya', detail: 'A confection given for weight gain and post-illness recovery.' },
      { name: 'Ksheerapaka', detail: 'Root simmered in milk and water until only the milk remains.' },
    ],
    cultivation: {
      soil: 'Sandy loam or light red soil, pH 7.5–8.0. Poor soils actually raise withanolide content.',
      climate: 'Dry sub-tropical, 20–35 °C with 500–750 mm rainfall. Late winter rain damages the root.',
      propagation: 'Direct seeding or nursery transplant once the monsoon begins in June–July.',
      spacing: '20 × 20 cm; broadcast at 10–12 kg of seed per hectare.',
      water: 'Rainfed, with one or two light irrigations only if the monsoon fails.',
      harvest: '150–180 days, when leaves dry and berries turn red-orange. Roots are dug after a light watering to soften the ground.',
      tips: [
        'Do not over-fertilise — lush growth gives thick, low-potency roots.',
        'Harvest whole plants, cut roots 1–2 cm from the crown, then dry in shade.',
        'Rotate the plot; seedling blight builds up under continuous cropping.',
      ],
    },
    precautions: [
      'Avoid in pregnancy — traditionally regarded as abortifacient at higher doses.',
      'May raise thyroid hormone levels; monitor if hyperthyroid or on thyroid medication.',
      'Being a nightshade, it can aggravate symptoms in some autoimmune conditions; introduce slowly.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Nagori ashwagandha from Rajasthan is the connoisseur’s grade, prized for long, straight, starchy roots.',
      'It belongs to the same family as tomato, potato and chilli.',
      'The papery inflated calyx around the berry is shared with its cousin, the cape gooseberry.',
    ],
    difficulty: 2,
    accent: '#8a7d4a',
    model: {
      archetype: 'shrub',
      height: 0.78,
      stem: { color: '#8a9070', radius: 0.014, curve: 0.3 },
      branching: { levels: 2, count: 5, angle: 48, startAt: 0.18, taper: 0.7 },
      leaf: {
        shape: 'ovate',
        length: 0.105,
        width: 0.062,
        arrangement: 'alternate',
        density: 6,
        top: '#7d9166',
        bottom: '#a3b189',
        serration: 0.08,
        droop: 0.3,
        curl: 0.3,
        gloss: 0.12,
      },
      flower: { form: 'cluster', color: '#cfd08a', size: 0.011, count: 4, petals: 5 },
      fruit: { shape: 'berry', color: '#d95f2e', size: 0.014, count: 7 },
      ground: 'sand',
    },
  },

  {
    id: 'aloe-vera',
    name: 'Aloe Vera',
    botanical: 'Aloe barbadensis',
    family: 'Asphodelaceae',
    names: {
      Sanskrit: 'Kumari, Ghrtakumari',
      Hindi: 'Gwarpatha, Ghikanwar',
      Tamil: 'Katralai',
      Telugu: 'Kalabanda',
      Malayalam: 'Kattarvazha',
      English: 'Aloe Vera',
    },
    tagline: 'A living first-aid kit — snap a leaf and the burn is already being treated.',
    description:
      'Kumari means "young girl", a name given because the plant was believed to restore youthful vitality. The leaf holds two distinct substances that must never be confused: the clear inner gel, soothing and safe for external use, and the bitter yellow latex just beneath the rind, a strong purgative. Understanding that difference is the single most important thing to learn about aloe.',
    habitat:
      'Native to the Arabian peninsula, naturalised and cultivated widely across India, especially in Rajasthan, Gujarat, Tamil Nadu and Maharashtra. Grows in hot dry conditions on sandy, well-drained ground.',
    morphology:
      'A stemless or very short-stemmed succulent forming a basal rosette. Leaves are thick and fleshy, 30–60 cm long, greyish-green, often white-spotted when young, with a horny prickly margin. A tall unbranched raceme carries pendulous tubular yellow to orange flowers.',
    regions: ['Arid & Desert', 'Coastal', 'Deccan Plateau', 'Pan-India'],
    type: 'Succulent',
    partsUsed: ['Leaf gel', 'Leaf latex', 'Whole leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Skin & Hair', 'Digestive', 'Wound Care', 'Women’s Health'],
    uses: [
      {
        title: 'Burns and wounds',
        detail:
          'Fresh gel applied to minor burns, sunburn and abrasions cools, seals in moisture and speeds re-epithelialisation. Several trials show faster healing of partial-thickness burns than standard dressings.',
      },
      {
        title: 'Digestive and liver support',
        detail:
          'Kumari asava, a fermented preparation, is used for sluggish digestion and liver complaints. The purified latex, aloin, is a stimulant laxative used only briefly and under supervision.',
      },
      {
        title: 'Menstrual regulation',
        detail:
          'Classically prescribed for irregular or scanty menses; the plant is described as an emmenagogue in both Ayurveda and Unani.',
      },
      {
        title: 'Hair and scalp',
        detail:
          'Gel massaged into the scalp for dandruff and itching; its enzymes and mucilage act as a light conditioner.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Madhura (sweet)'],
      guna: ['Guru (heavy)', 'Snigdha (unctuous)', 'Picchila (slimy)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies all three doshas, especially Pitta',
    },
    preparations: [
      { name: 'Kumari asava', detail: 'Fermented preparation for digestion, liver and menstrual health.' },
      { name: 'Fresh gel', detail: 'Filleted from the leaf and applied directly, or blended into juice.' },
      { name: 'Kumari taila', detail: 'Medicated oil for scalp and skin.' },
      { name: 'Musabbar', detail: 'The dried bitter latex, used in Unani formulations as a purgative.' },
    ],
    cultivation: {
      soil: 'Sandy, gritty, sharply drained soil, pH 6.5–8.0. Add coarse sand to potting mix.',
      climate: 'Hot and dry, 20–40 °C. Frost kills the leaves.',
      propagation: 'Offsets separated from the mother plant with roots attached; almost never from seed.',
      spacing: '60 × 45 cm in the field.',
      water: 'Deeply but rarely — let the soil dry out fully between waterings. Overwatering causes root rot, the commonest way people kill aloe.',
      harvest: 'From eight months onwards, cut three or four outer leaves per plant each quarter, always leaving the inner rosette intact.',
      tips: [
        'Stand a cut leaf upright for ten minutes to drain the yellow latex before filleting the gel.',
        'A pot with no drainage hole will eventually kill the plant; no watering discipline compensates.',
        'Bronze or reddish leaves mean too much direct sun — shift to bright indirect light.',
      ],
    },
    precautions: [
      'Never take the yellow latex internally without supervision — it causes severe cramping and electrolyte loss.',
      'Contraindicated in pregnancy: it can stimulate uterine contractions.',
      'Prolonged laxative use damages the bowel and can cause dependency.',
    ],
    conservation: 'Cultivated',
    facts: [
      'The gel is roughly 99 % water; its usefulness comes from the remaining 1 % of polysaccharides and glycoproteins.',
      'Aloe is not a cactus — it sits in the same broad group as asphodels and daylilies.',
      'It was carried on ships as a scurvy and wound remedy, earning the nickname "the burn plant of the sea".',
    ],
    difficulty: 1,
    accent: '#5fa88a',
    model: {
      archetype: 'rosette',
      height: 0.45,
      stem: { color: '#6d8f6a', radius: 0.02, curve: 0.05 },
      branching: { levels: 0, count: 0, angle: 0 },
      leaf: {
        shape: 'succulent',
        length: 0.42,
        width: 0.075,
        arrangement: 'basal',
        density: 14,
        top: '#7fae86',
        bottom: '#9dc39b',
        serration: 0.9,
        droop: 0.42,
        curl: 0.5,
        thickness: 0.028,
        gloss: 0.25,
        teeth: 0.85,
        spots: 0.55,
        spotColor: '#dbe7cf',
      },
      flower: { form: 'spike', color: '#f0a63c', size: 0.02, count: 1, petals: 6 },
      ground: 'sand',
    },
  },

  {
    id: 'turmeric',
    name: 'Turmeric',
    botanical: 'Curcuma longa',
    family: 'Zingiberaceae',
    names: {
      Sanskrit: 'Haridra, Kanchani',
      Hindi: 'Haldi',
      Tamil: 'Manjal',
      Telugu: 'Pasupu',
      Bengali: 'Halud',
      Kannada: 'Arishina',
      English: 'Turmeric',
    },
    tagline: 'Golden rhizome — the spice that colours ritual, food and medicine alike.',
    description:
      'Turmeric sits at the exact intersection of kitchen and clinic. The rhizome is boiled, dried and ground to the familiar yellow powder whose pigment, curcumin, is now among the world’s most researched natural anti-inflammatories. In Indian life it also marks transitions — smeared on the skin before a wedding, tied as a protective thread, offered at temples.',
    habitat:
      'A cultivated crop of warm humid regions with 1,500 mm or more of rainfall, grown from sea level to 1,200 m. Erode in Tamil Nadu, Sangli in Maharashtra and Nizamabad in Telangana are the major markets.',
    morphology:
      'A perennial rhizomatous herb 60–100 cm tall. The apparent stem is a pseudostem formed by rolled leaf sheaths. Leaves are large and oblong-lanceolate, 30–45 cm, bright green with a prominent midrib. Pale yellow flowers appear in a dense spike among pale green to pinkish bracts. Rhizomes are aromatic and deep orange inside.',
    regions: ['Western Ghats', 'Coastal', 'North-East India', 'Deccan Plateau'],
    type: 'Herb',
    partsUsed: ['Rhizome', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Joints & Pain', 'Skin & Hair', 'Immunity', 'Liver', 'Wound Care'],
    uses: [
      {
        title: 'Inflammation and joint pain',
        detail:
          'Curcumin inhibits the NF-κB and COX-2 pathways. Clinical trials in knee osteoarthritis show pain relief comparable to NSAIDs with fewer gastric effects.',
      },
      {
        title: 'Wound healing',
        detail:
          'Turmeric paste is packed onto cuts across rural India; it is antiseptic, reduces exudate and is documented to accelerate granulation.',
      },
      {
        title: 'Golden milk for cough and cold',
        detail:
          'Haridra khanda and simple haldi-doodh are given for allergic rhinitis, cough and sore throat — its heating potency cuts kapha.',
      },
      {
        title: 'Skin brightening and acne',
        detail:
          'Applied in ubtan with gram flour before weddings; also used on acne and fungal patches for its antimicrobial action.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Katu (pungent)'],
      guna: ['Ruksha (dry)', 'Laghu (light)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Pitta; balances all three in moderation',
    },
    preparations: [
      { name: 'Haridra khanda', detail: 'A granular preparation for urticaria, allergy and skin disease.' },
      { name: 'Haldi doodh', detail: 'Rhizome powder simmered in milk with a pinch of pepper and ghee.' },
      { name: 'Lepa', detail: 'Fresh rhizome paste applied to wounds, sprains and swellings.' },
      { name: 'Nisha amalaki', detail: 'Turmeric with amla, a classical pair for blood-sugar and skin support.' },
    ],
    cultivation: {
      soil: 'Deep, friable, well-drained loam rich in organic matter, pH 5.5–7.5.',
      climate: 'Warm humid tropical, 20–35 °C, with 1,500 mm rainfall or assured irrigation.',
      propagation: 'Whole or split mother rhizomes and finger rhizomes with at least one healthy bud, planted April–May.',
      spacing: '30 × 25 cm on raised beds or ridges.',
      water: 'Fifteen to twenty-five irrigations across the season for irrigated crops; never leave standing water.',
      harvest: 'Seven to nine months, when the lower leaves yellow and dry. Rhizomes are boiled, dried for 10–15 days and polished.',
      tips: [
        'Mulch heavily with green leaves right after planting — it markedly improves emergence.',
        'Curing by boiling before drying is what gives the uniform colour; sun-drying raw rhizome gives a patchy product.',
        'Grows perfectly well in a deep 12-inch pot on a balcony.',
      ],
    },
    precautions: [
      'High doses may aggravate gastric ulcers and increase gallbladder contraction — avoid with gallstones.',
      'Has mild blood-thinning action; stop before surgery and use cautiously with warfarin.',
      'Curcumin is poorly absorbed alone; the traditional pairing with black pepper and fat is pharmacologically sound.',
    ],
    conservation: 'Cultivated',
    facts: [
      'India produces about three-quarters of the world’s turmeric and consumes most of it domestically.',
      'A US patent on turmeric for wound healing was revoked in 1997 after the CSIR presented ancient Sanskrit texts as evidence.',
      'Curcumin is a pH indicator — turmeric paper turns red in an alkaline solution.',
    ],
    difficulty: 2,
    accent: '#d99b1f',
    model: {
      archetype: 'herb',
      height: 0.95,
      stem: { color: '#5d8a4a', radius: 0.022, curve: 0.1 },
      branching: { levels: 0, count: 0, angle: 0 },
      leaf: {
        shape: 'lanceolate',
        length: 0.46,
        width: 0.13,
        arrangement: 'basal',
        density: 7,
        top: '#4f9440',
        bottom: '#86b96c',
        serration: 0,
        droop: 0.5,
        curl: 0.55,
        gloss: 0.3,
      },
      flower: { form: 'spike', color: '#f2e6a8', centre: '#e8b73c', size: 0.03, count: 1 },
      rhizome: { color: '#e08a2c', size: 0.09 },
      ground: 'soil',
    },
  },

  {
    id: 'ginger',
    name: 'Ginger',
    botanical: 'Zingiber officinale',
    family: 'Zingiberaceae',
    names: {
      Sanskrit: 'Ardraka (fresh), Shunthi (dried)',
      Hindi: 'Adrak, Sonth',
      Tamil: 'Inji',
      Telugu: 'Allam',
      Bengali: 'Ada',
      Malayalam: 'Inchi',
      English: 'Ginger',
    },
    tagline: 'Vishwabheshaja — “the universal medicine” of the Ayurvedic texts.',
    description:
      'Ayurveda treats fresh and dried ginger as two different drugs. Fresh ardraka is juicier and milder, better for nausea and appetite; dried shunthi is more heating and penetrating, used for joint pain and deep kapha conditions. Ginger appears in more classical formulations than almost any other single plant, usually as a catalyst that carries other herbs deeper into the tissues.',
    habitat:
      'A cultivated crop of warm, humid, partially shaded slopes, grown to 1,500 m. Kerala, Karnataka, Meghalaya and Sikkim lead Indian production.',
    morphology:
      'A perennial herb 60–120 cm tall arising from a branched, aromatic, buff-coloured rhizome. Leaves are narrow and linear-lanceolate, 15–30 cm, arranged in two ranks on a reed-like pseudostem. Flowering is rare in cultivation; when it occurs, yellow-green flowers with a purple lip sit in a dense conical spike.',
    regions: ['Western Ghats', 'North-East India', 'Coastal', 'Himalayan'],
    type: 'Herb',
    partsUsed: ['Rhizome'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Digestive', 'Respiratory', 'Joints & Pain', 'Immunity'],
    uses: [
      {
        title: 'Nausea and motion sickness',
        detail:
          'One of the best-evidenced herbal antiemetics, effective for motion sickness, post-operative nausea and morning sickness at about 1 g a day of dried rhizome.',
      },
      {
        title: 'Digestive fire (agni)',
        detail:
          'A slice with rock salt and lime before meals is the classical appetiser, stimulating saliva, gastric secretion and gastric emptying.',
      },
      {
        title: 'Cough and congestion',
        detail:
          'Ginger juice with honey and tulsi is the household expectorant; its warming action thins and mobilises mucus.',
      },
      {
        title: 'Joint pain',
        detail:
          'Gingerols and shogaols inhibit inflammatory prostaglandins; dried ginger features in many anti-arthritic Ayurvedic formulations.',
      },
    ],
    ayurvedic: {
      rasa: ['Katu (pungent)'],
      guna: ['Guru (heavy)', 'Ruksha (dry)', 'Tikshna (sharp)'],
      virya: 'Ushna (heating)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies Vata and Kapha; aggravates Pitta in excess',
    },
    preparations: [
      { name: 'Shunthi churna', detail: 'Dried rhizome powder, 1–3 g with warm water, for indigestion and joint pain.' },
      { name: 'Ardraka swarasa', detail: 'Fresh juice with honey for cough, or with lime and salt as an appetiser.' },
      { name: 'Trikatu', detail: 'The classic triad of ginger, long pepper and black pepper for metabolic and respiratory disorders.' },
      { name: 'Ginger tea', detail: 'Crushed rhizome boiled with tulsi and cardamom.' },
    ],
    cultivation: {
      soil: 'Friable, well-drained sandy or clay loam rich in humus, pH 6.0–6.5.',
      climate: 'Warm and humid, 25–35 °C with 1,500–3,000 mm rainfall; partial shade improves yield.',
      propagation: 'Seed rhizome pieces of 20–25 g with two or three buds, planted April–May before the monsoon.',
      spacing: '20–25 cm within and between rows, on raised beds.',
      water: 'Frequent light irrigation; drainage is critical, since soft rot follows waterlogging.',
      harvest: 'Green ginger from six months; dry ginger at eight or nine months when leaves yellow and dry.',
      tips: [
        'Treat seed rhizomes with a biocontrol agent such as Trichoderma before planting to avoid rhizome rot.',
        'Interplant under coconut, arecanut or banana — ginger genuinely prefers dappled shade.',
        'A sprouted supermarket rhizome will grow happily in a wide shallow container.',
      ],
    },
    precautions: [
      'Large doses can worsen heartburn and gastritis.',
      'Antiplatelet effect — use cautiously with blood thinners and before surgery.',
      'Keep below 1 g a day during pregnancy unless advised otherwise.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Ginger has never been found growing wild — it exists only as a cultivated plant propagated by humans for millennia.',
      'Drying converts gingerol into shogaol, roughly twice as pungent; this is the chemistry behind ardraka versus shunthi.',
      'The Sanskrit name vishwabheshaja literally means "the medicine for all".',
    ],
    difficulty: 2,
    accent: '#c98b3f',
    model: {
      archetype: 'herb',
      height: 0.8,
      stem: { color: '#5f8f52', radius: 0.014, curve: 0.14 },
      branching: { levels: 0, count: 0, angle: 0 },
      leaf: {
        shape: 'linear',
        length: 0.28,
        width: 0.045,
        arrangement: 'alternate',
        density: 11,
        top: '#55984a',
        bottom: '#8dbd74',
        serration: 0,
        droop: 0.55,
        curl: 0.35,
        gloss: 0.35,
      },
      rhizome: { color: '#d9b978', size: 0.075 },
      ground: 'soil',
    },
  },

  {
    id: 'brahmi',
    name: 'Brahmi',
    botanical: 'Bacopa monnieri',
    family: 'Plantaginaceae',
    names: {
      Sanskrit: 'Brahmi, Saraswati',
      Hindi: 'Brahmi, Jalneem',
      Tamil: 'Neerbrahmi',
      Telugu: 'Sambrani chettu',
      Bengali: 'Brahmi shak',
      English: 'Water Hyssop',
    },
    tagline: 'Named for Brahma — the herb Ayurveda gives to the student and the scholar.',
    description:
      'Brahmi is the definitive medhya rasayana, an intellect-promoting rejuvenative. It is a small creeping succulent herb of wet ground, so unassuming that people walk past it at the edge of paddy fields. Its bacosides are believed to support synaptic communication and antioxidant defence in the hippocampus; human trials consistently show improvements in memory acquisition and retention after eight to twelve weeks — never overnight.',
    habitat:
      'Marshy ground, canal banks, paddy-field margins and shallow water throughout India up to 1,300 m. Needs permanently moist soil.',
    morphology:
      'A prostrate or creeping succulent herb rooting at the nodes and forming mats. Leaves are opposite, sessile, oblong-spatulate, 1–2 cm, fleshy and slightly succulent with faint venation. Flowers are solitary and axillary, small, pale violet to white with four or five lobes.',
    regions: ['Pan-India', 'Indo-Gangetic Plains', 'Coastal', 'Western Ghats'],
    type: 'Herb',
    partsUsed: ['Whole plant'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Mind & Sleep', 'Immunity'],
    uses: [
      {
        title: 'Memory and learning',
        detail:
          'Standardised extract at 300 mg a day for twelve weeks improved delayed word recall and attention in controlled trials in healthy adults and elderly participants.',
      },
      {
        title: 'Anxiety and mental fatigue',
        detail:
          'Traditionally given to students before examinations and to those with restless, scattered minds; it calms without sedating.',
      },
      {
        title: 'Neurological support',
        detail:
          'A classical adjunct in apasmara (epilepsy) formulations; it must accompany, never replace, prescribed anticonvulsants.',
      },
      {
        title: 'Hair oil base',
        detail:
          'Brahmi taila massaged into the scalp is the traditional evening practice for sleep, hair strength and mental cooling.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Kashaya (astringent)', 'Madhura (sweet)'],
      guna: ['Laghu (light)', 'Sara (mobile)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Balances all three doshas, especially Pitta and Kapha',
    },
    preparations: [
      { name: 'Brahmi ghrita', detail: 'Medicated ghee for memory, speech and neurological conditions.' },
      { name: 'Brahmi taila', detail: 'Hair and head-massage oil for sleep and mental calm.' },
      { name: 'Saraswatarishta', detail: 'A fermented tonic for memory, speech and voice.' },
      { name: 'Fresh juice', detail: '5–10 ml of swarasa taken in the morning.' },
    ],
    cultivation: {
      soil: 'Clayey, water-retentive soil or shallow standing water; tolerates pH 5.5–7.5.',
      climate: 'Tropical to sub-tropical, 20–35 °C, high humidity, partial to full sun.',
      propagation: 'Stem cuttings of 5–8 cm with nodes pressed into wet soil; they root in under a week.',
      spacing: '20 × 20 cm — it will quickly close the gaps into a mat.',
      water: 'Constantly saturated soil, or 2–5 cm of standing water.',
      harvest: 'First cut 80–90 days after planting, then every 60–70 days; up to four cuts a year.',
      tips: [
        'The easiest medicinal plant to grow at home: a wide tray, moist soil and bright light.',
        'Bacoside content peaks just before flowering — time harvests accordingly.',
        'Do not confuse it with mandukaparni (Centella asiatica), also sold as "brahmi" in north India.',
      ],
    },
    precautions: [
      'Can cause nausea, dry mouth and cramping on an empty stomach — take it with food.',
      'May slow heart rate slightly and increase bronchial secretions; caution in bradycardia and asthma.',
      'Effects build over weeks; a single dose does nothing, and impatience leads to overdosing.',
    ],
    conservation: 'Least Concern',
    facts: [
      'Two entirely different plants are sold as "brahmi" in India — this one and Centella asiatica. This is the Brahmi of the classical texts.',
      'It survives brackish water and is one of the few medicinal herbs that grows submerged.',
      'Bacosides were first isolated at the Central Drug Research Institute in Lucknow.',
    ],
    difficulty: 1,
    accent: '#4f9d8a',
    model: {
      archetype: 'creeper',
      height: 0.16,
      stem: { color: '#7fae6a', radius: 0.005, curve: 0.6 },
      branching: { levels: 1, count: 6, angle: 72, startAt: 0.05, taper: 0.8 },
      leaf: {
        shape: 'spatulate',
        length: 0.028,
        width: 0.016,
        arrangement: 'opposite',
        density: 9,
        top: '#6fae6b',
        bottom: '#95c78c',
        serration: 0,
        droop: 0.1,
        curl: 0.3,
        thickness: 0.004,
        gloss: 0.45,
      },
      flower: { form: 'solitary', color: '#c9c2e8', centre: '#f6f2d8', size: 0.012, count: 8, petals: 5 },
      ground: 'water',
    },
  },

  {
    id: 'amla',
    name: 'Amla',
    botanical: 'Phyllanthus emblica',
    family: 'Phyllanthaceae',
    names: {
      Sanskrit: 'Amalaki, Dhatri',
      Hindi: 'Amla',
      Tamil: 'Nellikkai',
      Telugu: 'Usiri',
      Bengali: 'Amlaki',
      Kannada: 'Nellikayi',
      English: 'Indian Gooseberry',
    },
    tagline: 'The fruit Ayurveda calls the nurse — a rasayana in a single sour bite.',
    description:
      'Amla is called dhatri, "the nurse", because it is said to look after the body the way a nurse looks after a patient. It is the principal ingredient of Chyawanprash and one third of Triphala. Unusually it carries five of the six tastes — everything but salt — and its vitamin C is stabilised by tannins, so it survives drying and cooking far better than the ascorbic acid in citrus.',
    habitat:
      'Deciduous forests and cultivated orchards across tropical and sub-tropical India up to 1,500 m. Tolerates poor, rocky, saline and alkaline soils that defeat other fruit trees.',
    morphology:
      'A small to medium deciduous tree 8–18 m tall with smooth greenish-grey peeling bark. The feathery, pinnate-looking foliage is actually made of tiny linear leaves borne on deciduous branchlets. Greenish-yellow flowers are inconspicuous. The fruit is a pale green, globose, six-lobed drupe of 2–3 cm, very hard and intensely sour.',
    regions: ['Pan-India', 'Deccan Plateau', 'Indo-Gangetic Plains', 'Western Ghats'],
    type: 'Tree',
    partsUsed: ['Fruit', 'Seed', 'Leaf', 'Bark', 'Root'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Immunity', 'Digestive', 'Skin & Hair', 'Liver', 'Heart & Circulation'],
    uses: [
      {
        title: 'Rasayana and immunity',
        detail:
          'Taken daily as a rejuvenative; its vitamin C and tannoids support immune function and are the reason Chyawanprash is a winter staple.',
      },
      {
        title: 'Hyperacidity and digestion',
        detail:
          'Despite being intensely sour, amla is cooling and is the standard herb for amlapitta — hyperacidity and gastritis.',
      },
      {
        title: 'Hair and scalp',
        detail:
          'Amla oil and fruit-water rinses are used against premature greying and hair fall; the fruit is astringent and rich in polyphenols.',
      },
      {
        title: 'Lipids and blood sugar',
        detail:
          'Trials report modest reductions in LDL cholesterol and fasting glucose with regular amla supplementation.',
      },
    ],
    ayurvedic: {
      rasa: ['Amla (sour), dominant', 'with Madhura, Tikta, Katu and Kashaya'],
      guna: ['Guru (heavy)', 'Ruksha (dry)', 'Shita (cold)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Balances all three doshas; the premier Pitta pacifier',
    },
    preparations: [
      { name: 'Chyawanprash', detail: 'A jam of amla with forty or more herbs, the best-known Ayurvedic rasayana.' },
      { name: 'Triphala', detail: 'Equal parts amla, haritaki and bibhitaki for digestion and gentle bowel regulation.' },
      { name: 'Amalaki rasayana', detail: 'Fruit powder taken with honey or ghee over months.' },
      { name: 'Amla murabba', detail: 'Fruit preserved in sugar syrup, a palatable daily form.' },
    ],
    cultivation: {
      soil: 'Adapts to almost anything — light, heavy, rocky, saline or alkaline — provided drainage is good.',
      climate: 'Tropical and sub-tropical; withstands 46 °C and light frost once established.',
      propagation: 'Patch or shield budding onto seedling rootstock; seedlings alone give variable fruit.',
      spacing: '8 × 8 m, wider on good soils.',
      water: 'Irrigate during fruit development; established trees are largely rainfed.',
      harvest: 'November to February, when the fruit turns pale and slightly translucent and the seed hardens.',
      tips: [
        'Plant at least two cultivars — amla is largely self-incompatible and needs cross-pollination.',
        'Named cultivars such as Banarasi, Chakaiya and NA-7 fruit far better than random seedlings.',
        'It is one of the best trees for reclaiming saline and degraded land.',
      ],
    },
    precautions: [
      'Its cold potency can aggravate cough and cold in Kapha-dominant people if eaten raw on winter evenings.',
      'May increase bleeding risk alongside anticoagulants.',
      'The very sour fruit can erode dental enamel if eaten raw in quantity; rinse afterwards.',
    ],
    conservation: 'Least Concern',
    facts: [
      'One amla fruit contains roughly 600–700 mg of vitamin C — around twenty times that of an orange by weight.',
      'The tree is worshipped on Amalaki Ekadashi, when families eat and offer the fruit.',
      'Its tannins protect the vitamin C, so dried amla powder retains most of its potency for a year.',
    ],
    difficulty: 2,
    accent: '#7ba63c',
    model: {
      archetype: 'tree',
      height: 2.6,
      stem: { color: '#94886e', radius: 0.044, curve: 0.2, woody: true },
      branching: { levels: 3, count: 5, angle: 45, startAt: 0.38, taper: 0.6 },
      leaf: {
        shape: 'linear',
        compound: 'pinnate',
        leaflets: 15,
        length: 0.02,
        width: 0.006,
        arrangement: 'alternate',
        density: 7,
        top: '#7fb04d',
        bottom: '#a8c774',
        serration: 0,
        droop: 0.28,
        curl: 0.12,
        gloss: 0.25,
      },
      fruit: { shape: 'round', color: '#cfd98a', size: 0.022, count: 10 },
      ground: 'soil',
    },
  },
]
