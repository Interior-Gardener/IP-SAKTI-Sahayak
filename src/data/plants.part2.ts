import type { PlantEntry } from '../types/plant'

/* Vanaspati plant compendium — part 2. */

export const plantsPart2: PlantEntry[] = [
  {
    id: 'giloy',
    name: 'Giloy',
    botanical: 'Tinospora cordifolia',
    family: 'Menispermaceae',
    names: {
      Sanskrit: 'Guduchi, Amrita',
      Hindi: 'Giloy, Gurcha',
      Tamil: 'Seendil kodi',
      Telugu: 'Tippateega',
      Bengali: 'Gulancha',
      Marathi: 'Gulvel',
      English: 'Heart-leaved Moonseed',
    },
    tagline: 'Amrita, the nectar of immortality — a vine that regrows from almost nothing.',
    description:
      'Guduchi earns its epithet amrita from an extraordinary vitality: a cut length of stem left on damp ground will sprout, root and climb again. That resilience is mirrored in its clinical reputation as a rasayana and immunomodulator, the herb reached for in chronic fever, convalescence and low resistance. Vaidyas insist that giloy growing on a neem tree is the most potent, absorbing the host’s bitterness.',
    habitat:
      'Deciduous and dry forests throughout tropical India up to 1,200 m, climbing over hedges, neem and mango trees. Extremely tolerant of drought and poor soil.',
    morphology:
      'A large glabrous deciduous climbing shrub with succulent, warty, corky-barked stems. Leaves are alternate, membranous, broadly heart-shaped (cordate), 5–15 cm. Long thread-like aerial roots hang from the branches. Flowers are small and yellow in racemes; fruit is a pea-sized red drupe.',
    regions: ['Pan-India', 'Deccan Plateau', 'Indo-Gangetic Plains', 'Western Ghats'],
    type: 'Climber',
    partsUsed: ['Stem', 'Leaf', 'Root', 'Starch (satva)'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Immunity', 'Liver', 'Joints & Pain', 'Metabolic'],
    uses: [
      {
        title: 'Recurrent and chronic fever',
        detail:
          'Guduchi is the classical jwaraghna, prescribed in prolonged and intermittent fevers including the post-viral fatigue that follows dengue and chikungunya.',
      },
      {
        title: 'Immunomodulation',
        detail:
          'Polysaccharides and alkaloids stimulate macrophage activity in laboratory studies; it is used both to raise low resistance and to temper over-reactive immunity.',
      },
      {
        title: 'Gout and joint inflammation',
        detail:
          'A standard component of amavata and vatarakta (gout) formulations, often paired with guggulu and ginger.',
      },
      {
        title: 'Liver and metabolic support',
        detail:
          'Used in jaundice and as an adjunct in diabetes; studies report hepatoprotective and hypoglycaemic activity.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Kashaya (astringent)'],
      guna: ['Guru (heavy)', 'Snigdha (unctuous)'],
      virya: 'Ushna (heating)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Balances all three doshas — a tridoshahara rasayana',
    },
    preparations: [
      { name: 'Guduchi satva', detail: 'The settled starch from crushed fresh stem, cooling and used in Pitta fevers.' },
      { name: 'Guduchi kwatha', detail: 'Stem decoction, 40–80 ml, for fever and low immunity.' },
      { name: 'Amritarishta', detail: 'A fermented preparation for chronic and recurrent fevers.' },
      { name: 'Guduchi churna', detail: 'Dried stem powder, 3–6 g, taken with warm water.' },
    ],
    cultivation: {
      soil: 'Almost any well-drained soil; prefers a slightly alkaline loam.',
      climate: 'Tropical and sub-tropical; very drought-hardy once established.',
      propagation: 'Stem cuttings of 15–20 cm with two or three nodes planted at the onset of the monsoon; rooting is near-certain.',
      spacing: '2 × 2 m with a live support tree or trellis.',
      water: 'Weekly in the first season, then almost none.',
      harvest: 'Mature stems from the second year onwards, cut in autumn when the starch content peaks.',
      tips: [
        'Train it up a neem or mango tree rather than a dead pole — the classical texts and practitioners both prefer a living host.',
        'Harvest finger-thick stems; thin green ones have far less satva.',
        'It is deciduous — bare stems in summer are normal, not a sign of death.',
      ],
    },
    precautions: [
      'Rare reports of drug-induced liver injury with prolonged unsupervised high-dose use; limit continuous use and avoid in existing liver disease.',
      'Being an immunostimulant, use cautiously in autoimmune disease and after organ transplant.',
      'May lower blood sugar — watch for additive effects with antidiabetic medication.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The stem is so tenacious that a piece left in a drawer for weeks will still sprout when planted.',
      'It is one of the very few climbers granted the status of rasayana in the classical texts.',
      'The hanging aerial roots can reach the ground and establish entirely new plants.',
    ],
    difficulty: 1,
    accent: '#4a8f63',
    model: {
      archetype: 'climber',
      height: 1.7,
      stem: { color: '#8b9b62', radius: 0.014, curve: 0.75 },
      branching: { levels: 2, count: 3, angle: 55, startAt: 0.2, taper: 0.75 },
      leaf: {
        shape: 'cordate',
        length: 0.12,
        width: 0.115,
        arrangement: 'alternate',
        density: 16,
        top: '#57a05c',
        bottom: '#8ec184',
        serration: 0,
        droop: 0.3,
        curl: 0.28,
        gloss: 0.4,
      },
      fruit: { shape: 'berry', color: '#c33c37', size: 0.012, count: 6 },
      ground: 'soil',
    },
  },

  {
    id: 'shatavari',
    name: 'Shatavari',
    botanical: 'Asparagus racemosus',
    family: 'Asparagaceae',
    names: {
      Sanskrit: 'Shatavari, Shatamuli',
      Hindi: 'Satavar',
      Tamil: 'Thanneervittan kizhangu',
      Telugu: 'Pilligadalu',
      Marathi: 'Shatavari',
      English: 'Wild Asparagus',
    },
    tagline: '“She who possesses a hundred roots” — Ayurveda’s principal women’s tonic.',
    description:
      'Shatavari is the female counterpart to ashwagandha: a cooling, nourishing, moistening rasayana used across a woman’s life from menarche through lactation to menopause. The medicinal part is the cluster of finger-like tuberous roots, peeled and dried. It is also a general demulcent, soothing the gut lining and dry inflamed tissue anywhere in the body.',
    habitat:
      'Gravelly, rocky soils in tropical and sub-tropical forests up to 1,500 m, common in the Himalayan foothills, Western Ghats and central India. Prefers partial shade under tree canopy.',
    morphology:
      'A scrambling, much-branched spinous undershrub or climber to 1–2 m. The apparent leaves are cladodes — flattened needle-like stems in tufts of two to six, giving a feathery appearance. Small fragrant white flowers appear in racemes; fruit is a purple-black berry. Roots are tuberous, 30–100 cm long, in fascicles of up to a hundred.',
    regions: ['Himalayan', 'Western Ghats', 'Deccan Plateau', 'Pan-India'],
    type: 'Climber',
    partsUsed: ['Tuberous root', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Women’s Health', 'Digestive', 'Immunity'],
    uses: [
      {
        title: 'Lactation support',
        detail:
          'The classical galactagogue, given as root powder in milk to nursing mothers; small clinical studies report increased prolactin and milk output.',
      },
      {
        title: 'Menopause and cycle regulation',
        detail:
          'Its phytoestrogenic saponins (shatavarins) are used for hot flushes, irregular cycles and dryness, working gradually over weeks.',
      },
      {
        title: 'Hyperacidity and gastritis',
        detail:
          'A demulcent that coats and cools the gastric mucosa; a standard herb for amlapitta and peptic ulcer support.',
      },
      {
        title: 'Convalescence',
        detail:
          'Used as a general strengthener in dryness, weight loss and post-illness debility, especially in Pitta-dominant people who cannot tolerate heating tonics.',
      },
    ],
    ayurvedic: {
      rasa: ['Madhura (sweet)', 'Tikta (bitter)'],
      guna: ['Guru (heavy)', 'Snigdha (unctuous)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies Vata and Pitta; may increase Kapha',
    },
    preparations: [
      { name: 'Shatavari kalpa', detail: 'A sweetened granular preparation taken with milk, widely used post-partum.' },
      { name: 'Shatavari churna', detail: 'Root powder, 3–6 g twice daily with milk or warm water.' },
      { name: 'Shatavari ghrita', detail: 'Medicated ghee for dryness, infertility and gastric conditions.' },
      { name: 'Narayana taila', detail: 'A classical oil containing shatavari for Vata disorders and massage.' },
    ],
    cultivation: {
      soil: 'Well-drained sandy loam or lateritic gravelly soil, pH 6.0–8.0.',
      climate: 'Tropical to sub-tropical, 10–45 °C, 600–1,000 mm rainfall; tolerates partial shade well.',
      propagation: 'Seed raised in nursery beds (germination is slow and needs soaking), or crown division of tuber clumps.',
      spacing: '60 × 60 cm with a trellis or support stakes.',
      water: 'Fortnightly irrigation in dry months; the tubers rot in waterlogged ground.',
      harvest: 'Roots at 18–20 months, when the plant dries down. Tubers are dug, peeled while fresh and shade-dried.',
      tips: [
        'Soak seed for 24 hours and treat with cow-dung slurry — untreated seed germinates poorly and erratically.',
        'The stems carry recurved spines; harvest with gloves and long sleeves.',
        'An excellent intercrop in orchards, as it thrives in the shade beneath fruit trees.',
      ],
    },
    precautions: [
      'Avoid in oestrogen-sensitive conditions without medical advice, given its phytoestrogen content.',
      'Its heavy, moist quality can worsen congestion, oedema and sluggish digestion in Kapha states.',
      'People allergic to garden asparagus may react to it.',
    ],
    conservation: 'Vulnerable',
    facts: [
      'One plant can carry over a hundred tuberous roots, which is exactly what the name shatavari describes.',
      'What looks like a delicate fern frond is not a leaf at all — the true leaves are reduced to tiny spines.',
      'Heavy wild collection has pushed it onto conservation-concern lists in several Indian states.',
    ],
    difficulty: 2,
    accent: '#7fae7a',
    model: {
      archetype: 'climber',
      height: 1.15,
      stem: { color: '#9aa86a', radius: 0.008, curve: 0.55 },
      branching: { levels: 2, count: 5, angle: 62, startAt: 0.12, taper: 0.72 },
      leaf: {
        shape: 'linear',
        compound: 'pinnate',
        leaflets: 7,
        length: 0.024,
        width: 0.0035,
        arrangement: 'whorled',
        density: 5,
        top: '#84bd7c',
        bottom: '#a9d29c',
        serration: 0,
        droop: 0.25,
        curl: 0.1,
        gloss: 0.3,
      },
      flower: { form: 'panicle', color: '#f7f4e6', size: 0.006, count: 5 },
      ground: 'soil',
    },
  },

  {
    id: 'mint',
    name: 'Pudina',
    botanical: 'Mentha spicata',
    family: 'Lamiaceae',
    names: {
      Sanskrit: 'Putiha',
      Hindi: 'Pudina',
      Tamil: 'Pudhina',
      Telugu: 'Pudina',
      Bengali: 'Pudina',
      English: 'Spearmint',
    },
    tagline: 'The cooling breath of the herb garden, one crushed leaf at a time.',
    description:
      'Pudina is the everyday carminative of Indian kitchens — in chutney, in buttermilk, in a summer sherbet. Its menthol-family volatiles relax smooth muscle in the gut, which is why a mint drink genuinely settles a heavy meal. It spreads aggressively by runners, making it one of the few medicinal plants that a beginner is more likely to over-grow than to kill.',
    habitat:
      'Cultivated across India; naturalised along damp ditches and stream banks. Prefers cool, moist, partially shaded ground.',
    morphology:
      'An aromatic perennial herb 30–90 cm tall with square, often purplish stems and vigorous underground runners. Leaves are opposite, sessile to shortly stalked, lanceolate to ovate, 4–9 cm, wrinkled with sharply toothed margins. Small lilac to white flowers are borne in slender terminal spikes.',
    regions: ['Indo-Gangetic Plains', 'Himalayan', 'Pan-India'],
    type: 'Herb',
    partsUsed: ['Leaf', 'Whole aerial part', 'Essential oil'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Digestive', 'Respiratory', 'Skin & Hair'],
    uses: [
      {
        title: 'Indigestion and bloating',
        detail:
          'A carminative and antispasmodic; mint relaxes gastrointestinal smooth muscle, relieving colic, flatulence and the discomfort of a heavy meal.',
      },
      {
        title: 'Nausea and vomiting',
        detail:
          'Fresh leaf juice with a little honey, or a simple infusion, is the traditional response to nausea and travel sickness.',
      },
      {
        title: 'Cooling summer drinks',
        detail:
          'Pudina in buttermilk or panna is a classical response to heat exhaustion, combining fluid, electrolytes and a cooling sensation on the skin.',
      },
      {
        title: 'Oral freshness and headache',
        detail:
          'Chewed for halitosis; a leaf paste applied to the temples for tension headache produces a cooling counter-irritant effect.',
      },
    ],
    ayurvedic: {
      rasa: ['Katu (pungent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)', 'Tikshna (sharp)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; deepana and pachana',
    },
    preparations: [
      { name: 'Pudina arka', detail: 'A distillate used for indigestion and nausea.' },
      { name: 'Fresh chutney', detail: 'Ground with coriander, cumin and lime — everyday preventive digestive medicine.' },
      { name: 'Infusion', detail: 'A handful of leaves steeped in hot water for ten minutes after meals.' },
      { name: 'Pudina hara', detail: 'Concentrated mint-oil preparations used commercially for gastric discomfort.' },
    ],
    cultivation: {
      soil: 'Moist, fertile, humus-rich loam with good drainage, pH 6.0–7.5.',
      climate: 'Cool to warm, 20–30 °C; suffers in scorching dry heat and appreciates afternoon shade.',
      propagation: 'Runners or stem cuttings rooted in water or damp soil within a week.',
      spacing: '30 × 30 cm; it will fill the bed itself.',
      water: 'Frequent — mint wilts fast and needs consistently moist soil.',
      harvest: 'From 60 days, cutting stems 5 cm above the ground; three or four cuts a season.',
      tips: [
        'Grow it in a sunken pot or a contained bed — the runners will otherwise take over the entire garden.',
        'Cut before flowering; flowering thins the leaf and drops the oil content.',
        'Divide and replant every second year, since old clumps become woody and unproductive.',
      ],
    },
    precautions: [
      'Concentrated menthol oil must never be applied to an infant’s face or nostrils — it can cause laryngospasm.',
      'May worsen reflux in some people by relaxing the lower oesophageal sphincter.',
      'Culinary quantities are safe in pregnancy, but concentrated oil is not.',
    ],
    conservation: 'Cultivated',
    facts: [
      'The cooling sensation is not a temperature change at all — menthol binds the TRPM8 receptor, the same one that detects cold.',
      'A single plant can colonise a square metre of bed in one season through underground runners.',
      'India is the world’s largest producer of mint oil, mostly from the related Mentha arvensis.',
    ],
    difficulty: 1,
    accent: '#4faa74',
    /* Built to the morphology above: 30–90 cm, square purplish stems,
     * opposite lanceolate leaves of 4–9 cm, wrinkled and sharply toothed,
     * and lilac flowers in slender terminal spikes. What it was missing
     * was the wrinkling — a spearmint leaf you would know blindfolded by
     * its puckered surface was coming out as a smooth blade. */
    model: {
      archetype: 'herb',
      // As it is actually kept: a low dense mound, cut back for the kitchen
      // long before it reaches the 90 cm it is capable of.
      height: 0.4,
      // "Square, often purplish": green carrying the purple, not pure green.
      stem: { color: '#5f7a4c', radius: 0.008, curve: 0.28, square: true },
      /* It runs and it thickets — more orders of branching, starting low,
       * so a plant reads as the mat mint actually makes rather than as a
       * few stems in a row. */
      branching: { levels: 3, count: 3, angle: 44, startAt: 0.14, taper: 0.68 },
      /* Drawn from the pudina actually grown in Indian pots and kitchen
       * beds, which the description's "lanceolate to ovate" allows but
       * which sits hard at the ovate end: a broad blade barely longer
       * than it is wide, rounded at the base, and a bright yellow-green
       * rather than the deep green of a garden mint. */
      leaf: {
        shape: 'ovate',
        // Roughly 5.5 x 4 cm — nearly as broad as it is long.
        length: 0.055,
        width: 0.04,
        arrangement: 'opposite',
        density: 9,
        top: '#57a742',
        bottom: '#8cc472',
        /* Crenate, not serrate: the teeth are scalloped and blunt, and
         * cutting them sharply was making it read as a nettle. */
        serration: 0.5,
        droop: 0.12,
        // Cupping is not wrinkling: the blade quilts between its veins,
        // and doing that as `curl` alone only made it a trough.
        curl: 0.18,
        // Deeply puckered — on this plant it is the first thing you see.
        rugose: 0.92,
        gloss: 0.3,
      },
      /* Lamiaceae, like the tulsi — but where tulsi's raceme is interrupted,
       * spearmint's whorls crowd into one dense terminal spike, which is
       * what `whorlGap` is closing up here. */
      flower: {
        form: 'verticillaster',
        color: '#c9b8e0',
        centre: '#efe8f4',
        size: 0.009,
        /* Sparing: cropped pudina is picked over long before it runs to
         * flower, so a plant covered in spikes would be the wrong plant. */
        count: 2,
        petals: 4,
        whorlGap: 1.15,
      },
      ground: 'soil',
    },
  },

  {
    id: 'lemongrass',
    name: 'Lemongrass',
    botanical: 'Cymbopogon citratus',
    family: 'Poaceae',
    names: {
      Sanskrit: 'Bhustrina',
      Hindi: 'Nimbu ghas',
      Tamil: 'Karpoorapullu',
      Telugu: 'Nimmagaddi',
      Malayalam: 'Inchipullu',
      English: 'Lemongrass',
    },
    tagline: 'A grass that smells of citrus — the gentlest way into herbal tea.',
    description:
      'Lemongrass is an aromatic grass whose citral-rich leaves carry an unmistakable lemon scent without any of the acidity. It is grown at industrial scale for its essential oil, used in soaps, insect repellents and flavourings, and at household scale for a mild, pleasant tea that eases digestion and calms the nerves. Because it is a grass, it recovers instantly from cutting and lives for years.',
    habitat:
      'Cultivated in warm humid regions across India, notably Kerala, Karnataka, Maharashtra and the North-East. Tolerates poor soil and moderate drought.',
    morphology:
      'A densely tufted perennial grass forming clumps 1–1.8 m tall from a short rhizome. Leaves are long, linear, drooping, 50–100 cm, blue-green, with rough margins that can cut the skin. Flowering is rare in cultivation; when it occurs, the inflorescence is a large nodding panicle.',
    regions: ['Western Ghats', 'North-East India', 'Coastal', 'Deccan Plateau'],
    type: 'Grass',
    partsUsed: ['Leaf', 'Essential oil', 'Stem base'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Digestive', 'Mind & Sleep', 'Joints & Pain', 'Respiratory'],
    uses: [
      {
        title: 'Digestive tea',
        detail:
          'An infusion of two or three fresh leaves relieves bloating and mild colic and is a caffeine-free evening drink.',
      },
      {
        title: 'Calm and sleep',
        detail:
          'Traditionally used as a mild anxiolytic; the aroma of citral is used in aromatherapy for restlessness and tension.',
      },
      {
        title: 'Muscular and joint pain',
        detail:
          'Lemongrass oil diluted in a carrier is massaged into aching muscles and joints as a rubefacient.',
      },
      {
        title: 'Insect repellent',
        detail:
          'Its citral and geraniol content repels mosquitoes; the closely related citronella grass is the commercial source.',
      },
    ],
    ayurvedic: {
      rasa: ['Katu (pungent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata',
    },
    preparations: [
      { name: 'Leaf infusion', detail: 'Two or three chopped leaves steeped in hot water for five minutes.' },
      { name: 'Lemongrass oil', detail: 'Steam-distilled oil, diluted to 2 % for external massage.' },
      { name: 'Kwatha', detail: 'A decoction used for fever with body ache.' },
      { name: 'Steam inhalation', detail: 'Leaves boiled and the vapour inhaled for nasal congestion.' },
    ],
    cultivation: {
      soil: 'Wide tolerance — sandy loam to laterite, pH 5.0–8.0. Poor soils are acceptable.',
      climate: 'Warm humid tropical, 20–35 °C, 700–3,000 mm rainfall, full sun.',
      propagation: 'Slips — divided clumps with roots attached — planted at the start of the monsoon.',
      spacing: '60 × 60 cm.',
      water: 'Moderate; drought-tolerant once the clump establishes.',
      harvest: 'First cut at 90 days, then every 60–75 days, cutting 10 cm above ground. A clump yields for four to six years.',
      tips: [
        'Cut leaves in the afternoon on a dry day — oil content peaks then.',
        'Replant the clump every fifth year, as yields fall away sharply after that.',
        'The leaf margins are genuinely sharp; harvest with gloves.',
      ],
    },
    precautions: [
      'Undiluted essential oil irritates skin and must never be applied neat.',
      'Avoid therapeutic doses during pregnancy — it is a traditional emmenagogue.',
      'Very high oral doses of the oil have caused gastric irritation; tea quantities are safe.',
    ],
    conservation: 'Cultivated',
    facts: [
      'It gives up to 0.4 % essential oil, of which around 75 % is citral — the compound behind the lemon aroma.',
      'The plant is a grass, so cutting it back hard actually stimulates fresh, more aromatic growth.',
      'India exports lemongrass oil worldwide, with Kerala historically the leading producer.',
    ],
    difficulty: 1,
    accent: '#96b24c',
    model: {
      archetype: 'grass',
      height: 1.05,
      stem: { color: '#8fa85c', radius: 0.006, curve: 0.2 },
      branching: { levels: 0, count: 0, angle: 0 },
      leaf: {
        shape: 'linear',
        length: 0.9,
        width: 0.016,
        arrangement: 'basal',
        density: 26,
        top: '#8fb85e',
        bottom: '#b3cd82',
        serration: 0,
        droop: 0.85,
        curl: 0.25,
        gloss: 0.2,
      },
      ground: 'soil',
    },
  },

  {
    id: 'fenugreek',
    name: 'Methi',
    botanical: 'Trigonella foenum-graecum',
    family: 'Fabaceae',
    names: {
      Sanskrit: 'Methika',
      Hindi: 'Methi',
      Tamil: 'Vendhayam',
      Telugu: 'Menthulu',
      Bengali: 'Methi',
      Gujarati: 'Methi',
      English: 'Fenugreek',
    },
    tagline: 'A winter green and a bitter seed — food and medicine in the same plant.',
    description:
      'Few plants blur the line between vegetable and drug as thoroughly as methi. The tender leaves are a winter staple across north India; the hard, angular, bitter seeds are a spice, a galactagogue and one of the most studied botanicals for blood-sugar control. The seed’s galactomannan fibre slows carbohydrate absorption, which is the plausible mechanism behind its long traditional use in prameha.',
    habitat:
      'Cultivated as a rabi (winter) crop across India, especially Rajasthan, Madhya Pradesh and Gujarat. Prefers cool, dry weather with bright sunshine.',
    morphology:
      'An erect annual herb 30–60 cm tall with a strong characteristic aroma. Leaves are trifoliate with obovate leaflets 2–2.5 cm long and toothed at the tip. Flowers are white to pale yellow, solitary or paired in the leaf axils. The fruit is a slender curved pod 5–11 cm long containing 10–20 hard, yellowish-brown, rhomboidal seeds.',
    regions: ['Arid & Desert', 'Indo-Gangetic Plains', 'Deccan Plateau'],
    type: 'Herb',
    partsUsed: ['Seed', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Metabolic', 'Digestive', 'Women’s Health', 'Skin & Hair'],
    uses: [
      {
        title: 'Blood-sugar management',
        detail:
          'Meta-analyses of trials using 5–10 g a day of seed powder report meaningful reductions in fasting glucose and HbA1c, attributed to soluble fibre and 4-hydroxyisoleucine.',
      },
      {
        title: 'Lactation support',
        detail:
          'A widely used galactagogue; new mothers across India are given methi laddoo and seed-infused water in the weeks after delivery.',
      },
      {
        title: 'Joint and back pain',
        detail:
          'Soaked seeds or seed paste are applied and eaten for lumbar pain and stiffness — a Vata-pacifying use recorded in the classical texts.',
      },
      {
        title: 'Hair and scalp',
        detail:
          'Soaked, ground seed applied as a hair mask for dandruff and hair fall; the mucilage conditions and the saponins cleanse.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Katu (pungent)'],
      guna: ['Laghu (light)', 'Snigdha (unctuous)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Vata and Kapha; may aggravate Pitta',
    },
    preparations: [
      { name: 'Methi dana water', detail: 'A teaspoon of seed soaked overnight and the water drunk on an empty stomach.' },
      { name: 'Methi laddoo', detail: 'Seed powder with jaggery and ghee, traditionally given post-partum and in winter.' },
      { name: 'Seed powder', detail: '5 g twice daily before meals for metabolic support.' },
      { name: 'Hair mask', detail: 'Soaked seeds ground with curd and left on the scalp for thirty minutes.' },
    ],
    cultivation: {
      soil: 'Well-drained loamy soil rich in organic matter, pH 6.0–7.0.',
      climate: 'Cool dry winters, 10–25 °C; frost during flowering damages pod set.',
      propagation: 'Direct seeding in October–November at 20–25 kg per hectare.',
      spacing: '22 cm between rows for seed crops; broadcast densely for a leaf crop.',
      water: 'Light irrigation every 10–15 days; sensitive to waterlogging.',
      harvest: 'Leaves from 25–30 days; seed crop at 130–150 days when pods turn yellow and dry.',
      tips: [
        'Being a legume, it fixes nitrogen — an excellent rotation crop before a heavy feeder.',
        'For a leafy crop, broadcast thickly and cut repeatedly; for seed, sow in rows and thin.',
        'The easiest of all seeds to sprout on a kitchen windowsill in three days.',
      ],
    },
    precautions: [
      'Avoid therapeutic seed doses in pregnancy — it can stimulate uterine contractions.',
      'Can cause a maple-syrup body odour, harmless but occasionally alarming to parents of breastfed infants.',
      'Additive hypoglycaemic effect with diabetes medication; monitor blood sugar.',
    ],
    conservation: 'Cultivated',
    facts: [
      'The Latin name foenum-graecum means "Greek hay" — it was used as fodder in the classical Mediterranean.',
      'Its aroma compound, sotolon, is the same one that gives maple syrup its smell.',
      'Fenugreek seeds have been recovered from archaeological sites in Iraq dating to around 4000 BCE.',
    ],
    difficulty: 1,
    accent: '#84a340',
    model: {
      archetype: 'herb',
      height: 0.4,
      stem: { color: '#7ba055', radius: 0.007, curve: 0.28 },
      branching: { levels: 2, count: 4, angle: 50, startAt: 0.18, taper: 0.72 },
      leaf: {
        shape: 'obovate',
        compound: 'trifoliate',
        leaflets: 3,
        length: 0.032,
        width: 0.018,
        arrangement: 'alternate',
        density: 7,
        top: '#66a64c',
        bottom: '#93c179',
        serration: 0.4,
        droop: 0.18,
        curl: 0.2,
        gloss: 0.25,
      },
      flower: { form: 'solitary', color: '#f5f2d2', size: 0.011, count: 5, petals: 5 },
      fruit: { shape: 'pod', color: '#b6a95e', size: 0.055, count: 5 },
      ground: 'soil',
    },
  },

  {
    id: 'sarpagandha',
    name: 'Sarpagandha',
    botanical: 'Rauvolfia serpentina',
    family: 'Apocynaceae',
    names: {
      Sanskrit: 'Sarpagandha, Chandrika',
      Hindi: 'Chotachand',
      Tamil: 'Sivan amelpodi',
      Bengali: 'Chandra',
      Marathi: 'Harkaya',
      English: 'Indian Snakeroot',
    },
    tagline: 'The root that gave modern medicine its first antihypertensive drug.',
    description:
      'Sarpagandha is the clearest case of traditional knowledge entering the global pharmacopoeia. Ayurvedic physicians used the root for insomnia, insanity and what they called high pressure of blood; in 1952 reserpine was isolated from it and became the first widely used antihypertensive and antipsychotic. The plant is now a protected species, its wild populations wrecked by exactly that success.',
    habitat:
      'Moist deciduous forest understorey in the sub-Himalayan tract, Eastern and Western Ghats and the North-East, up to 1,300 m. Needs shade and humus-rich soil.',
    morphology:
      'An erect evergreen perennial undershrub 30–90 cm tall with a prominent tuberous taproot that is pale brown outside and creamy inside. Leaves are in whorls of three or four, elliptic-lanceolate, 7–17 cm, bright green and glossy. Flowers are white to pinkish in dense terminal umbel-like cymes with red pedicels; fruit is a shiny purple-black drupe.',
    regions: ['Himalayan', 'Western Ghats', 'Eastern Ghats', 'North-East India'],
    type: 'Shrub',
    partsUsed: ['Root'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Heart & Circulation', 'Mind & Sleep'],
    uses: [
      {
        title: 'High blood pressure',
        detail:
          'Reserpine depletes catecholamine stores, lowering blood pressure. Powdered root was the traditional form and remains in some classical formulations, always under supervision.',
      },
      {
        title: 'Insomnia and agitation',
        detail:
          'Named chandrika for its calming, moon-like quality; used in unmada (psychosis) and severe insomnia in the classical texts.',
      },
      {
        title: 'Snakebite folklore',
        detail:
          'The name means "snake smell", and the root was applied to snake and insect bites — a traditional use, not a substitute for antivenom.',
      },
      {
        title: 'Modern pharmacology',
        detail:
          'Reserpine remains a reference compound in pharmacology teaching and research on monoamine transport.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Katu (pungent)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; nidrajanana (sleep-inducing)',
    },
    preparations: [
      { name: 'Sarpagandha churna', detail: 'Root powder, 0.25–0.5 g, strictly under a physician’s supervision.' },
      { name: 'Sarpagandha ghana vati', detail: 'A tablet of concentrated extract used for hypertension.' },
      { name: 'Sarpagandhadi vati', detail: 'A compound formulation with other calming herbs.' },
      { name: 'Reserpine', detail: 'The isolated alkaloid, a landmark twentieth-century antihypertensive.' },
    ],
    cultivation: {
      soil: 'Deep, well-drained, humus-rich sandy loam, pH 5.5–7.0.',
      climate: 'Warm humid sub-tropical with 2,000–2,500 mm rainfall; needs 30–50 % shade.',
      propagation: 'Seed (which germinates slowly and unevenly), root cuttings of 2.5 cm, or stem cuttings under mist.',
      spacing: '45 × 30 cm.',
      water: 'Regular; the soil must stay moist but never waterlogged.',
      harvest: 'Roots at 18–30 months, dug in December–January after the plant sheds leaves.',
      tips: [
        'Grow it under a shade net or beneath taller plants; full sun scorches the leaves.',
        'Root cuttings establish far more reliably than seed for a home grower.',
        'Cultivation is the only responsible source — wild collection is restricted by law.',
      ],
    },
    precautions: [
      'A potent cardiovascular drug, not a casual home remedy. Self-medication risks dangerous hypotension.',
      'Contraindicated in depression — reserpine can precipitate severe depressive episodes and was withdrawn from routine use partly for this reason.',
      'Contraindicated in pregnancy, peptic ulcer and with MAO inhibitors.',
    ],
    conservation: 'Endangered',
    facts: [
      'Reserpine, isolated from this root in 1952, opened the modern era of psychopharmacology alongside chlorpromazine.',
      'Indian export of the wild root was banned in 1997 after populations collapsed; it is listed on CITES Appendix II.',
      'Mahatma Gandhi is said to have taken sarpagandha as a calming evening tea.',
    ],
    difficulty: 3,
    accent: '#8a6ba8',
    model: {
      archetype: 'shrub',
      height: 0.65,
      stem: { color: '#7e9463', radius: 0.011, curve: 0.15 },
      branching: { levels: 1, count: 3, angle: 35, startAt: 0.4, taper: 0.7 },
      leaf: {
        shape: 'elliptic',
        length: 0.135,
        width: 0.05,
        arrangement: 'whorled',
        density: 5,
        top: '#3f8f4e',
        bottom: '#77b078',
        serration: 0,
        droop: 0.22,
        curl: 0.3,
        gloss: 0.55,
      },
      flower: { form: 'umbel', color: '#f6e9ec', centre: '#c0454f', size: 0.012, count: 3, petals: 5 },
      fruit: { shape: 'berry', color: '#3b2540', size: 0.011, count: 6 },
      ground: 'soil',
    },
  },

  {
    id: 'arjuna',
    name: 'Arjuna',
    botanical: 'Terminalia arjuna',
    family: 'Combretaceae',
    names: {
      Sanskrit: 'Arjuna, Kakubha',
      Hindi: 'Arjun',
      Tamil: 'Marudham',
      Telugu: 'Tellamaddi',
      Bengali: 'Arjun gachh',
      Marathi: 'Arjun sadada',
      English: 'Arjuna Tree',
    },
    tagline: 'The heart tree — a white-barked riverside giant used for the heart for two millennia.',
    description:
      'Vagbhata, writing around the seventh century, prescribed arjuna bark in milk for hridroga, disease of the heart. It is one of very few classical indications that maps this precisely onto a modern one: trials of arjuna bark in stable angina and heart failure report improved ejection fraction and reduced anginal episodes. The tree itself is unmistakable — a smooth, pinkish-white trunk that flakes in large sheets, always near water.',
    habitat:
      'Riverbanks, dry riverbeds and moist areas throughout the Indian subcontinent up to 1,200 m, especially along the Ganges, Narmada and peninsular rivers.',
    morphology:
      'A large evergreen tree 20–30 m tall with a buttressed trunk and smooth, pinkish-grey bark that peels in thin flakes revealing white underneath. Leaves are sub-opposite, oblong, 10–15 cm, dull green above and pale brown below, with two glands at the leaf base. Flowers are small, white-yellow, in short spikes. The fruit is a fibrous woody drupe with five stiff wings.',
    regions: ['Indo-Gangetic Plains', 'Deccan Plateau', 'Western Ghats', 'Eastern Ghats'],
    type: 'Tree',
    partsUsed: ['Stem bark'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Heart & Circulation', 'Wound Care', 'Metabolic'],
    uses: [
      {
        title: 'Cardiac support',
        detail:
          'Bark powder in milk is the classical hridya preparation. Modern trials in stable angina and mild heart failure show reduced anginal frequency and improved left-ventricular function as an adjunct to standard care.',
      },
      {
        title: 'Cholesterol and blood pressure',
        detail:
          'Tannins and flavonoids contribute antioxidant and mild lipid-lowering effects; used alongside diet in dyslipidaemia.',
      },
      {
        title: 'Wound and fracture healing',
        detail:
          'The astringent bark is applied to ulcers and used internally in bone healing formulations.',
      },
      {
        title: 'Sericulture and ecology',
        detail:
          'Arjuna leaves feed the tasar silkworm, making the tree an economic mainstay in tribal central India.',
      },
    ],
    ayurvedic: {
      rasa: ['Kashaya (astringent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Pitta; hridya (cardiotonic)',
    },
    preparations: [
      { name: 'Arjuna ksheerapaka', detail: 'Bark powder simmered in milk and water — the classical cardiac tonic.' },
      { name: 'Arjunarishta', detail: 'A fermented preparation, 15–30 ml after meals, for cardiac support.' },
      { name: 'Arjuna churna', detail: 'Bark powder, 3–6 g a day.' },
      { name: 'Bark decoction', detail: 'Used as a wash for ulcers and skin lesions.' },
    ],
    cultivation: {
      soil: 'Deep alluvial or loamy soil near water; tolerates periodic flooding.',
      climate: 'Tropical and sub-tropical, 0–48 °C, 750–1,900 mm rainfall.',
      propagation: 'Seed sown after soaking for 48 hours; germination takes three to five weeks.',
      spacing: '8 × 8 m; often grown along canal and river banks.',
      water: 'Needs plentiful moisture in the early years; naturally a riparian species.',
      harvest: 'Bark from trees over ten years old, stripped in vertical panels during autumn; the tree regenerates bark in two to three years.',
      tips: [
        'Harvest bark in strips from alternate quadrants and never ring the trunk.',
        'A fast grower — it can reach 6 m in five years on a moist site.',
        'Excellent for riverbank stabilisation, as its roots bind eroding soil.',
      ],
    },
    precautions: [
      'A supportive therapy, never a replacement for cardiac medication or emergency care.',
      'May interact with antihypertensives and antiplatelet drugs; report use to your cardiologist.',
      'Long unsupervised use may affect thyroid function according to some reports.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The bark regenerates fully within two to three years of careful stripping, making it one of the few sustainably harvestable barks.',
      'The tree is named after Arjuna of the Mahabharata, and its whiteness is part of that association.',
      'Its leaves feed the tasar silkworm, supporting a traditional silk economy in Jharkhand and Chhattisgarh.',
    ],
    difficulty: 2,
    accent: '#a8a496',
    model: {
      archetype: 'tree',
      height: 3.2,
      stem: { color: '#d3cec0', radius: 0.065, curve: 0.12, woody: true },
      branching: { levels: 3, count: 5, angle: 42, startAt: 0.4, taper: 0.6 },
      leaf: {
        shape: 'elliptic',
        length: 0.11,
        width: 0.045,
        arrangement: 'opposite',
        density: 6,
        top: '#4c8547',
        bottom: '#93a06a',
        serration: 0.12,
        droop: 0.3,
        curl: 0.2,
        gloss: 0.2,
      },
      flower: { form: 'spike', color: '#f2eecd', size: 0.007, count: 4 },
      ground: 'soil',
    },
  },

  {
    id: 'vasaka',
    name: 'Vasaka',
    botanical: 'Justicia adhatoda',
    family: 'Acanthaceae',
    names: {
      Sanskrit: 'Vasa, Vasaka, Atarusha',
      Hindi: 'Adusa, Arusa',
      Tamil: 'Adathodai',
      Telugu: 'Addasaramu',
      Bengali: 'Bakas',
      Marathi: 'Adulsa',
      English: 'Malabar Nut',
    },
    tagline: 'The cough shrub — in Ayurveda, no one with a cough should despair while vasa exists.',
    description:
      'A classical verse says that as long as vasa exists, one need not fear haemoptysis or cough. Vasaka is the definitive Indian respiratory herb, its alkaloid vasicine being the direct chemical ancestor of bromhexine and ambroxol, two mucolytics now sold worldwide. It is a hardy, unfussy shrub often planted as a hedge, which means the medicine is quite literally at the garden boundary.',
    habitat:
      'Common throughout the plains of India up to 1,300 m, on wasteland, hedgerows and dry slopes. Extremely hardy and often used as a live fence.',
    morphology:
      'A dense evergreen shrub 1–2.5 m tall with ash-coloured bark. Leaves are opposite, large, elliptic-lanceolate, 10–20 cm, dark green above, paler below, with an unpleasant smell when bruised. Flowers are white with purple-pink veining on the lower lip, borne in dense axillary spikes with large bracts; fruit is a club-shaped capsule.',
    regions: ['Pan-India', 'Himalayan', 'Indo-Gangetic Plains', 'Deccan Plateau'],
    type: 'Shrub',
    partsUsed: ['Leaf', 'Root', 'Flower', 'Bark'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Respiratory', 'Wound Care'],
    uses: [
      {
        title: 'Cough and bronchitis',
        detail:
          'Vasicine is a bronchodilator and mucolytic; leaf juice with honey is the standard preparation for productive cough, bronchitis and asthma.',
      },
      {
        title: 'Haemoptysis and bleeding',
        detail:
          'Classically the first herb in raktapitta (bleeding disorders), particularly blood-streaked sputum, for its haemostatic action.',
      },
      {
        title: 'Modern derivatives',
        detail:
          'Bromhexine and ambroxol, standard hospital mucolytics, were both developed from the vasicine molecule.',
      },
      {
        title: 'External use',
        detail:
          'Leaf poultices are applied to rheumatic swellings and slow-healing wounds.',
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
      { name: 'Vasa swarasa', detail: 'Fresh leaf juice, 10–20 ml with honey, for cough.' },
      { name: 'Vasavaleha', detail: 'A confection for chronic cough and bleeding disorders.' },
      { name: 'Vasarishta', detail: 'A fermented respiratory tonic.' },
      { name: 'Vasa kwatha', detail: 'Leaf decoction for bronchitis and fever.' },
    ],
    cultivation: {
      soil: 'Any well-drained soil; tolerates poor and rocky ground.',
      climate: 'Tropical to sub-tropical, 10–40 °C, tolerant of drought and light frost.',
      propagation: 'Stem cuttings of 20–25 cm planted in the monsoon; rooting is easy and reliable.',
      spacing: '1 × 1 m, or 50 cm apart as a hedge.',
      water: 'Minimal once established.',
      harvest: 'Leaves from the second year onwards, twice a year, before flowering when alkaloid content is highest.',
      tips: [
        'Grow it as a boundary hedge — it doubles as a windbreak and a medicine chest.',
        'Cut back hard after harvesting; it responds with vigorous new leaf.',
        'The bruised leaf smells distinctly unpleasant, which is a useful identification check.',
      ],
    },
    precautions: [
      'Contraindicated in pregnancy — vasicine has documented uterotonic and abortifacient activity.',
      'High doses can cause nausea, vomiting and diarrhoea.',
      'Not suitable for dry, unproductive cough where its drying quality worsens symptoms.',
    ],
    conservation: 'Least Concern',
    facts: [
      'Two mainstream pharmaceutical mucolytics, bromhexine and ambroxol, descend directly from a molecule in this leaf.',
      'Farmers use vasaka leaves as a natural rooting hormone for other cuttings.',
      'It is one of the few Ayurvedic herbs given to children for cough with a long safety record at correct doses.',
    ],
    difficulty: 1,
    accent: '#5c8f6b',
    model: {
      archetype: 'shrub',
      height: 1.25,
      stem: { color: '#8d9a7c', radius: 0.018, curve: 0.2 },
      branching: { levels: 2, count: 4, angle: 40, startAt: 0.25, taper: 0.68 },
      leaf: {
        shape: 'lanceolate',
        length: 0.17,
        width: 0.055,
        arrangement: 'opposite',
        density: 7,
        top: '#3d7d4c',
        bottom: '#7ba777',
        serration: 0,
        droop: 0.3,
        curl: 0.3,
        gloss: 0.25,
      },
      flower: { form: 'spike', color: '#f4eef2', centre: '#b5719a', size: 0.02, count: 4, petals: 5 },
      ground: 'soil',
    },
  },
]
