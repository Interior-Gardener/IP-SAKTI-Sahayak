import type { PlantEntry } from '../types/plant'

/* Vanaspati plant compendium — part 3. */

export const plantsPart3: PlantEntry[] = [
  {
    id: 'kalmegh',
    name: 'Kalmegh',
    botanical: 'Andrographis paniculata',
    family: 'Acanthaceae',
    names: {
      Sanskrit: 'Bhunimba, Kiratatikta',
      Hindi: 'Kalmegh',
      Tamil: 'Nilavembu',
      Telugu: 'Nelavemu',
      Bengali: 'Kalmegh',
      Malayalam: 'Nilaveppu',
      English: 'King of Bitters',
    },
    tagline: 'The king of bitters — the herb that tastes exactly as strong as it acts.',
    description:
      'Kalmegh is uncompromisingly bitter, and that is the point: in Ayurveda and Siddha it is the reference tikta for fever, liver congestion and infection. Nilavembu kudineer, a Siddha decoction built around it, was distributed at scale during Tamil Nadu’s dengue and chikungunya outbreaks. European trials of andrographolide extracts in upper-respiratory infection show shorter symptom duration, giving it one of the better modern evidence bases among Indian bitters.',
    habitat:
      'Plains and moist shaded ground throughout India up to 500 m, common as an undergrowth herb in plantations, waste ground and hedges.',
    morphology:
      'An erect annual herb 30–110 cm tall with sharply quadrangular, dark green stems. Leaves are opposite, lanceolate, 4–8 cm, glabrous, with an entire margin and a very bitter taste. Small white flowers with rose-purple markings on the lower lip appear in lax spreading racemes; fruit is a linear capsule that splits explosively when ripe.',
    regions: ['Pan-India', 'Coastal', 'Western Ghats', 'Indo-Gangetic Plains'],
    type: 'Herb',
    partsUsed: ['Whole plant', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Liver', 'Immunity', 'Digestive', 'Respiratory'],
    uses: [
      {
        title: 'Fever and infection',
        detail:
          'The core ingredient of Nilavembu kudineer, used across South India for viral fevers with body ache and low platelet counts.',
      },
      {
        title: 'Liver protection',
        detail:
          'Andrographolide shows hepatoprotective activity in experimental liver injury; the herb is classically used for jaundice and sluggish liver.',
      },
      {
        title: 'Upper respiratory infection',
        detail:
          'Controlled trials of standardised extract report reduced severity and duration of cough, sore throat and nasal symptoms.',
      },
      {
        title: 'Digestive bitter',
        detail:
          'Small doses before meals stimulate appetite and bile flow — the classic action of a tikta rasa herb.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Pitta; strongly aggravates Vata in excess',
    },
    preparations: [
      { name: 'Nilavembu kudineer', detail: 'A Siddha decoction of nine herbs led by kalmegh, used in viral fevers.' },
      { name: 'Kalmegh churna', detail: 'Whole-plant powder, 1–3 g, taken with warm water.' },
      { name: 'Bhunimbadi kwatha', detail: 'A decoction for fever and liver disorders.' },
      { name: 'Fresh juice', detail: '10–20 ml of leaf juice, extremely bitter, taken on an empty stomach.' },
    ],
    cultivation: {
      soil: 'Light to medium loam with good drainage, pH 5.5–7.5.',
      climate: 'Warm humid tropical; grows through the monsoon and dies back after seeding.',
      propagation: 'Seed sown in nursery beds in May–June, transplanted after 30–40 days.',
      spacing: '30 × 20 cm.',
      water: 'Rainfed through the monsoon; light irrigation if the rains break.',
      harvest: '90–120 days, at the start of flowering when andrographolide peaks. Cut the whole plant 10 cm above ground.',
      tips: [
        'Collect seed capsules just before they dry, or the explosive dehiscence will scatter the entire crop.',
        'It self-seeds enthusiastically — one planting usually gives volunteers for years.',
        'Harvest at flower initiation, not after seeding, when potency has already fallen.',
      ],
    },
    precautions: [
      'Avoid in pregnancy — animal studies show antifertility and abortifacient effects.',
      'Can cause gastric discomfort, loss of appetite and headache at high doses.',
      'Being an immunostimulant, use cautiously in autoimmune disease and with immunosuppressants.',
    ],
    conservation: 'Least Concern',
    facts: [
      'It is called "Indian echinacea" in export markets, though the two plants are botanically unrelated.',
      'The ripe capsule splits with an audible snap, flinging seeds up to two metres away.',
      'Nilavembu kudineer was distributed free through Tamil Nadu government clinics during dengue outbreaks.',
    ],
    difficulty: 1,
    accent: '#3f7f6a',
    model: {
      archetype: 'herb',
      height: 0.55,
      stem: { color: '#5f8551', radius: 0.008, curve: 0.2, square: true },
      branching: { levels: 2, count: 4, angle: 46, startAt: 0.2, taper: 0.7 },
      leaf: {
        shape: 'lanceolate',
        length: 0.075,
        width: 0.024,
        arrangement: 'opposite',
        density: 8,
        top: '#357a4c',
        bottom: '#6ba172',
        serration: 0,
        droop: 0.24,
        curl: 0.25,
        gloss: 0.35,
      },
      flower: { form: 'panicle', color: '#f6f1f4', centre: '#a76c94', size: 0.009, count: 5, petals: 5 },
      ground: 'soil',
    },
  },

  {
    id: 'bael',
    name: 'Bael',
    botanical: 'Aegle marmelos',
    family: 'Rutaceae',
    names: {
      Sanskrit: 'Bilva, Shriphala',
      Hindi: 'Bel',
      Tamil: 'Vilvam',
      Telugu: 'Maredu',
      Bengali: 'Bel',
      Marathi: 'Bel',
      English: 'Stone Apple',
    },
    tagline: 'Shiva’s tree — a hard-shelled fruit that quietly repairs the gut.',
    description:
      'The trifoliate bilva leaf is offered to Shiva across India, which is why the tree stands in temple courtyards everywhere. Medicinally it is the gut specialist: the unripe fruit is astringent and binding, used for chronic diarrhoea and dysentery, while the ripe pulp is laxative and cooling. Getting this the right way round is the whole art of using bael — the two states of the same fruit do opposite things.',
    habitat:
      'Dry deciduous forests and cultivated groves throughout India up to 1,200 m. Tolerates poor, alkaline, stony soils and long dry seasons.',
    morphology:
      'A slender deciduous thorny tree 6–15 m tall with pale brown corky bark and straight sharp axillary spines. Leaves are alternate and trifoliate, the terminal leaflet largest, aromatic when crushed. Flowers are greenish-white, sweetly scented, in axillary panicles. The fruit is a large globose berry with a hard woody grey-yellow shell and sticky orange aromatic pulp full of mucilaginous seeds.',
    regions: ['Indo-Gangetic Plains', 'Deccan Plateau', 'Pan-India', 'Eastern Ghats'],
    type: 'Tree',
    partsUsed: ['Unripe fruit', 'Ripe fruit', 'Leaf', 'Root', 'Bark'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Digestive', 'Metabolic', 'Immunity'],
    uses: [
      {
        title: 'Chronic diarrhoea and dysentery',
        detail:
          'Unripe fruit pulp, dried and powdered, is the classical grahi (binding) medicine for long-standing loose motions and irritable bowel patterns.',
      },
      {
        title: 'Constipation, when ripe',
        detail:
          'The ripe pulp is mildly laxative and demulcent; bael sherbet is a summer drink that both cools and regulates the bowel.',
      },
      {
        title: 'Blood-sugar support',
        detail:
          'Leaf extracts show hypoglycaemic effects in animal studies, supporting the traditional use of leaf juice in prameha.',
      },
      {
        title: 'Heat and dehydration',
        detail:
          'Bael sherbet with jaggery is a standard north Indian summer preparation for heat exhaustion.',
      },
    ],
    ayurvedic: {
      rasa: ['Kashaya (astringent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; unripe fruit is grahi',
    },
    preparations: [
      { name: 'Bilva churna', detail: 'Dried unripe fruit powder, 3–6 g, for chronic diarrhoea.' },
      { name: 'Bilvadi lehya', detail: 'A confection for digestive weakness and dysentery.' },
      { name: 'Bael sherbet', detail: 'Ripe pulp whisked with water and jaggery — a summer cooler.' },
      { name: 'Dashamoola', detail: 'Bael root is one of the ten roots in this major classical formulation.' },
    ],
    cultivation: {
      soil: 'Tolerates a very wide range including alkaline, stony and swampy soils, pH up to 9.0.',
      climate: 'Sub-tropical; withstands 48 °C and freezing winters. Needs a distinct dry season to fruit well.',
      propagation: 'Seed, or budding of named cultivars such as NB-5, NB-9 or Pant Shivani.',
      spacing: '8 × 8 m.',
      water: 'Irrigate for the first three years; then largely rainfed.',
      harvest: 'Fruit in April–June when the shell turns yellowish-green; it stores for weeks without refrigeration.',
      tips: [
        'Trees carry sharp spines — prune to a clean framework early to make harvesting possible.',
        'Seedling trees take seven or eight years to fruit; budded plants fruit in four or five.',
        'One of the best fruit trees for saline, alkaline or degraded soil.',
      ],
    },
    precautions: [
      'Excess unripe fruit causes constipation and abdominal heaviness.',
      'The heating quality may aggravate Pitta and cause acidity in sensitive individuals.',
      'May lower blood sugar — monitor if on antidiabetic drugs.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The fruit shell is so hard it must be cracked with a stone or hammer, which is where "stone apple" comes from.',
      'Bilva leaves are offered to Shiva in threes, symbolising the three eyes and the trident.',
      'The fruit keeps for weeks at room temperature — a natural preservation trick used long before refrigeration.',
    ],
    difficulty: 2,
    accent: '#c8a12f',
    model: {
      archetype: 'tree',
      height: 2.4,
      stem: { color: '#a08f6f', radius: 0.042, curve: 0.24, woody: true },
      branching: { levels: 3, count: 4, angle: 46, startAt: 0.35, taper: 0.62 },
      leaf: {
        shape: 'ovate',
        compound: 'trifoliate',
        leaflets: 3,
        length: 0.075,
        width: 0.038,
        arrangement: 'alternate',
        density: 6,
        top: '#4b8c42',
        bottom: '#84ad6c',
        serration: 0.25,
        droop: 0.26,
        curl: 0.2,
        gloss: 0.45,
      },
      fruit: { shape: 'round', color: '#8b9c4c', ripeColor: '#cbbd60', ripeShare: 0.5, size: 0.05, count: 4 },
      ground: 'soil',
    },
  },

  {
    id: 'mulethi',
    name: 'Mulethi',
    botanical: 'Glycyrrhiza glabra',
    family: 'Fabaceae',
    names: {
      Sanskrit: 'Yashtimadhu, Madhuka',
      Hindi: 'Mulethi',
      Tamil: 'Athimadhuram',
      Telugu: 'Atimadhuramu',
      Bengali: 'Jashtimadhu',
      Urdu: 'Mulethi',
      English: 'Liquorice',
    },
    tagline: 'The sweet stick — fifty times sweeter than sugar, and it soothes what it touches.',
    description:
      'Yashtimadhu literally means "sweet stick", and chewing a piece of the dried root gives a lingering sweetness from glycyrrhizin, a saponin around fifty times sweeter than sucrose. It is a demulcent: it coats and calms inflamed mucous membranes, which is why it appears in cough syrups, throat lozenges and gastritis formulations worldwide. It is also the single most important interaction risk in the herbal cabinet, because glycyrrhizin raises blood pressure.',
    habitat:
      'Native to the Mediterranean and West Asia; cultivated in Jammu & Kashmir, Punjab and parts of Himachal Pradesh. Needs deep, sandy, well-drained soil and full sun.',
    morphology:
      'A hardy perennial herb or undershrub 1–2 m tall with a deep taproot and long horizontal stolons. Leaves are imparipinnate with 9–17 ovate leaflets, slightly sticky beneath. Flowers are pale violet to lavender in axillary spikes. The fruit is a flattened pod. The medicinal part is the dried root and stolon, yellow inside and fibrous.',
    regions: ['Himalayan', 'Arid & Desert'],
    type: 'Herb',
    partsUsed: ['Root', 'Stolon'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Respiratory', 'Digestive', 'Skin & Hair', 'Immunity'],
    uses: [
      {
        title: 'Sore throat and cough',
        detail:
          'A demulcent and expectorant; chewing the root or sipping a decoction coats the pharynx and eases dry irritating cough and hoarseness.',
      },
      {
        title: 'Gastritis and ulcers',
        detail:
          'Deglycyrrhizinated liquorice increases protective mucus secretion and is used for peptic ulcer and reflux without the blood-pressure risk.',
      },
      {
        title: 'Skin brightening',
        detail:
          'Glabridin inhibits tyrosinase, making liquorice extract a common ingredient in pigmentation and dark-circle formulations.',
      },
      {
        title: 'Anupana and formulation base',
        detail:
          'A very common carrier in Ayurvedic prescriptions, used to soften the harshness of stronger herbs and improve palatability.',
      },
    ],
    ayurvedic: {
      rasa: ['Madhura (sweet)'],
      guna: ['Guru (heavy)', 'Snigdha (unctuous)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Pacifies Vata and Pitta; increases Kapha',
    },
    preparations: [
      { name: 'Yashtimadhu churna', detail: 'Root powder, 1–3 g with honey or ghee, for cough and gastritis.' },
      { name: 'Yashtimadhu ghrita', detail: 'Medicated ghee for ulcers and eye disorders.' },
      { name: 'Throat decoction', detail: 'Root simmered in water and gargled warm.' },
      { name: 'DGL tablets', detail: 'Deglycyrrhizinated liquorice, safe for longer use in gastric conditions.' },
    ],
    cultivation: {
      soil: 'Deep sandy loam with high organic matter and excellent drainage, pH 6.0–8.2.',
      climate: 'Sub-tropical to temperate with hot dry summers and cold winters.',
      propagation: 'Stolon or root cuttings of 15–20 cm with two or three buds, planted in spring.',
      spacing: '90 × 45 cm.',
      water: 'Moderate; too much water dilutes glycyrrhizin in the root.',
      harvest: 'Roots at three to four years, when glycyrrhizin content peaks. Dug in autumn and dried slowly in shade.',
      tips: [
        'Patience is the crop: harvesting before the third year gives thin, weakly sweet root.',
        'Grow in a deep raised bed — the taproot goes down more than a metre.',
        'It spreads by stolons and can become invasive in a small plot; contain the bed.',
      ],
    },
    precautions: [
      'Glycyrrhizin causes sodium retention, potassium loss and raised blood pressure. Do not use continuously beyond four to six weeks.',
      'Contraindicated in hypertension, kidney disease, low potassium and pregnancy.',
      'Interacts with diuretics, digoxin and corticosteroids — a genuinely significant herb-drug interaction.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Glycyrrhizin is about fifty times sweeter than sucrose but tastes slow and lingering rather than sharp.',
      'Most "liquorice" confectionery in some countries contains no liquorice root at all — only anise oil.',
      'It was found among the treasures in Tutankhamun’s tomb, presumably for the afterlife.',
    ],
    difficulty: 3,
    accent: '#b9924a',
    model: {
      archetype: 'herb',
      height: 0.92,
      stem: { color: '#7f9159', radius: 0.011, curve: 0.22 },
      branching: { levels: 2, count: 4, angle: 40, startAt: 0.3, taper: 0.7 },
      leaf: {
        shape: 'ovate',
        compound: 'pinnate',
        leaflets: 11,
        length: 0.03,
        width: 0.016,
        arrangement: 'alternate',
        density: 6,
        top: '#5f9450',
        bottom: '#93b57c',
        serration: 0,
        droop: 0.2,
        curl: 0.15,
        gloss: 0.3,
      },
      flower: { form: 'spike', color: '#b3a6d6', size: 0.012, count: 4, petals: 5 },
      ground: 'sand',
    },
  },

  {
    id: 'sandalwood',
    name: 'Chandana',
    botanical: 'Santalum album',
    family: 'Santalaceae',
    names: {
      Sanskrit: 'Chandana, Shrikhanda',
      Hindi: 'Safed chandan',
      Tamil: 'Sandhanam',
      Telugu: 'Gandhapu chekka',
      Kannada: 'Srigandha',
      Malayalam: 'Chandanam',
      English: 'Indian Sandalwood',
    },
    tagline: 'A tree that steals from its neighbours and repays the world in fragrance.',
    description:
      'Sandalwood is a hemiparasite: its roots form haustoria that tap into the roots of host plants for water and nutrients, which is why it cannot be grown alone. The fragrant heartwood takes fifteen years or more to form, and its santalol is cooling both in the aromatic and the Ayurvedic sense — chandana paste on the forehead is the classical remedy for burning, fever and agitation. Over-exploitation has made it a protected species.',
    habitat:
      'Dry deciduous scrub forests of Karnataka, Tamil Nadu and Kerala, between 600 and 1,200 m. Needs a host plant throughout its life.',
    morphology:
      'A small evergreen hemiparasitic tree 8–12 m tall with slender drooping branches and dark rough bark. Leaves are opposite, ovate-elliptic, 3–8 cm, thin, glossy above and glaucous below. Flowers are small, straw-coloured turning deep reddish-purple, unscented, in short panicles. Fruit is a purple-black globose drupe. Only the heartwood and roots are fragrant.',
    regions: ['Deccan Plateau', 'Western Ghats', 'Eastern Ghats'],
    type: 'Tree',
    partsUsed: ['Heartwood', 'Essential oil', 'Root'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Skin & Hair', 'Mind & Sleep', 'Kidney & Urinary'],
    uses: [
      {
        title: 'Cooling skin applications',
        detail:
          'Wood ground on a wet stone into a paste is applied to prickly heat, acne, sunburn and burning sensations — the classical daha-prashamana action.',
      },
      {
        title: 'Calming the mind',
        detail:
          'The oil is used in aromatherapy and meditation practice for its grounding effect; classical texts prescribe it for agitation and insomnia.',
      },
      {
        title: 'Urinary tract',
        detail:
          'Traditionally given for burning urination and cystitis; its volatile constituents are excreted through the kidneys.',
      },
      {
        title: 'Ritual and perfumery',
        detail:
          'Sandalwood paste and incense are integral to Hindu, Buddhist and Jain worship, and the oil is a base note in fine perfumery.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Madhura (sweet)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Pitta and Kapha',
    },
    preparations: [
      { name: 'Chandana lepa', detail: 'Wood ground with water into a cooling paste for skin and forehead.' },
      { name: 'Chandanasava', detail: 'A fermented preparation for urinary burning and fever.' },
      { name: 'Chandanadi taila', detail: 'A medicated oil for head massage and Pitta conditions.' },
      { name: 'Sandalwood oil', detail: 'Steam-distilled heartwood oil, used at high dilution.' },
    ],
    cultivation: {
      soil: 'Well-drained red ferruginous loam over rocky ground, pH 6.0–7.5. Never waterlogged.',
      climate: 'Warm dry tropical, 600–1,600 mm rainfall, 12–38 °C.',
      propagation: 'Seed sown after treatment with gibberellic acid, always alongside a primary host such as Cajanus cajan and later a long-term host like Casuarina or Pongamia.',
      spacing: '4 × 4 m with hosts interplanted.',
      water: 'Occasional in early years; drought-tolerant thereafter.',
      harvest: 'Heartwood at 15–30 years. The whole tree including roots is removed, since the root wood is the most fragrant part.',
      tips: [
        'Plant a host at the same time and within a metre — a sandalwood seedling without a host will die.',
        'Since 2001–02, Karnataka and Tamil Nadu allow private ownership of sandalwood trees; check your state rules before planting or felling.',
        'Heartwood formation begins only around year eight; young trees have no fragrant wood at all.',
      ],
    },
    precautions: [
      'Pure sandalwood oil must be diluted; undiluted oil can sensitise skin.',
      'Adulteration is rampant — much "sandalwood oil" on the market is synthetic or from other species.',
      'Felling and transport are legally regulated in India; harvesting requires state permission.',
    ],
    conservation: 'Vulnerable',
    facts: [
      'It is a root hemiparasite — the haustoria clamp onto a host root and draw water and minerals, though the tree still photosynthesises.',
      'Fragrance is confined to the heartwood and roots; the sapwood is odourless.',
      'A kilogram of high-grade Indian sandalwood oil has at times been worth more than silver by weight.',
    ],
    difficulty: 3,
    accent: '#c2a883',
    model: {
      archetype: 'tree',
      height: 2.3,
      stem: { color: '#6d5f4d', radius: 0.038, curve: 0.2, woody: true },
      branching: { levels: 3, count: 5, angle: 50, startAt: 0.32, taper: 0.62 },
      leaf: {
        shape: 'elliptic',
        length: 0.065,
        width: 0.03,
        arrangement: 'opposite',
        density: 7,
        top: '#57874f',
        bottom: '#9dab86',
        serration: 0,
        droop: 0.45,
        curl: 0.25,
        gloss: 0.4,
      },
      fruit: { shape: 'berry', color: '#3a2a3d', size: 0.01, count: 8 },
      ground: 'rock',
    },
  },

  {
    id: 'henna',
    name: 'Mehndi',
    botanical: 'Lawsonia inermis',
    family: 'Lythraceae',
    names: {
      Sanskrit: 'Madayantika',
      Hindi: 'Mehndi',
      Tamil: 'Marudhani',
      Telugu: 'Goranta',
      Urdu: 'Mehndi',
      Bengali: 'Mehedi',
      English: 'Henna',
    },
    tagline: 'The dye of celebration — cooling to the skin long before it was decorative.',
    description:
      'Henna is best known for the intricate patterns painted on hands at weddings and festivals, but the practice began as medicine. The leaf’s lawsone binds to keratin, staining skin, hair and nails a lasting orange-red, and the same application cools the palms and soles — which is why it is traditionally applied in fierce summer heat and to feverish patients. Rajasthan’s Sojat region supplies most of the world’s henna.',
    habitat:
      'Hot arid and semi-arid regions; extensively cultivated in Rajasthan, Gujarat and Madhya Pradesh. Extremely drought-hardy and tolerant of saline soil.',
    morphology:
      'A much-branched glabrous shrub or small tree 2–6 m tall, with older branches often ending in spines. Leaves are opposite, small, elliptic to lanceolate, 2–3 cm, with an entire margin. Flowers are small, fragrant, white to rose in large terminal panicles. Fruit is a small globose capsule with numerous angular seeds.',
    regions: ['Arid & Desert', 'Deccan Plateau', 'Indo-Gangetic Plains'],
    type: 'Shrub',
    partsUsed: ['Leaf', 'Flower', 'Bark', 'Seed'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Skin & Hair', 'Wound Care'],
    uses: [
      {
        title: 'Hair conditioning and colour',
        detail:
          'Lawsone binds keratin, coating and strengthening the hair shaft while imparting a red-orange tone; it also reduces dandruff and scalp itching.',
      },
      {
        title: 'Cooling the body',
        detail:
          'Paste applied to palms, soles and the scalp draws off heat; classically used in fever, burning sensations and summer heat.',
      },
      {
        title: 'Wounds, burns and fungal skin',
        detail:
          'Antimicrobial and astringent; leaf paste is applied to boils, burns, ringworm and nail infections.',
      },
      {
        title: 'Ritual and celebration',
        detail:
          'Central to weddings and Eid across South Asia, West Asia and North Africa — one of the oldest continuous cosmetic traditions.',
      },
    ],
    ayurvedic: {
      rasa: ['Kashaya (astringent)', 'Tikta (bitter)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Shita (cooling)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Pitta and Kapha',
    },
    preparations: [
      { name: 'Mehndi paste', detail: 'Sieved leaf powder mixed with lemon juice and left to release dye for 6–12 hours.' },
      { name: 'Hair pack', detail: 'Henna with curd, amla and egg for conditioning and colour.' },
      { name: 'Leaf decoction', detail: 'Used as a gargle for mouth ulcers and a wash for skin infections.' },
      { name: 'Henna oil', detail: 'Leaves infused in coconut or sesame oil for scalp application.' },
    ],
    cultivation: {
      soil: 'Sandy loam to gravelly soil, tolerant of salinity and alkalinity, pH up to 8.5.',
      climate: 'Hot and dry, 25–45 °C; needs high temperature to develop good dye content.',
      propagation: 'Seed, or hardwood cuttings of 20–25 cm planted in the monsoon.',
      spacing: '60 × 45 cm for leaf crops; closer as a hedge.',
      water: 'Minimal — deep irrigation every three or four weeks in summer is enough.',
      harvest: 'Two cuts a year from the second year, in October–November and again in March–April, taken before flowering.',
      tips: [
        'Dye content is highest in leaves grown under intense heat and mild water stress; pampering the plant weakens the colour.',
        'Cut the whole bush back to 25 cm after harvest — it regenerates vigorously.',
        'Black henna containing PPD is not henna; it causes chemical burns and permanent sensitisation.',
      ],
    },
    precautions: [
      'So-called black henna contains para-phenylenediamine, which causes severe blistering and lifelong allergy. Only red-brown henna is genuine.',
      'Avoid in people with G6PD deficiency — henna can trigger haemolysis, especially in infants.',
      'Not for internal use in any significant quantity.',
    ],
    conservation: 'Cultivated',
    facts: [
      'Sojat in Rajasthan supplies the majority of the world’s henna and has a GI tag for it.',
      'The stain deepens for 48 hours after the paste is removed as lawsone oxidises in the keratin.',
      'Henna was found on the nails and hair of Egyptian mummies more than three thousand years old.',
    ],
    difficulty: 1,
    accent: '#a35f3d',
    model: {
      archetype: 'shrub',
      height: 1.35,
      stem: { color: '#8b7f66', radius: 0.016, curve: 0.28, woody: true },
      branching: { levels: 2, count: 4, angle: 48, startAt: 0.22, taper: 0.66 },
      leaf: {
        shape: 'elliptic',
        length: 0.032,
        width: 0.014,
        arrangement: 'opposite',
        density: 8,
        top: '#5b9152',
        bottom: '#8db47a',
        serration: 0,
        droop: 0.2,
        curl: 0.2,
        gloss: 0.35,
      },
      flower: { form: 'panicle', color: '#f6efe4', centre: '#e8d59a', size: 0.007, count: 6, petals: 4 },
      ground: 'sand',
    },
  },

  {
    id: 'bhringraj',
    name: 'Bhringraj',
    botanical: 'Eclipta prostrata',
    family: 'Asteraceae',
    names: {
      Sanskrit: 'Bhringaraja, Kesharaja',
      Hindi: 'Bhangra',
      Tamil: 'Karisalankanni',
      Telugu: 'Guntagalagaraku',
      Bengali: 'Kesuti',
      Malayalam: 'Kayyonni',
      English: 'False Daisy',
    },
    tagline: 'Kesharaja, king of hair — a roadside weed that ends up in every hair oil.',
    description:
      'Bhringraj grows in every damp ditch in India and is almost invariably dismissed as a weed, yet its Sanskrit epithet kesharaja, "king of hair", reflects its status in Ayurveda. Beyond hair it is a serious liver herb: in Siddha, karisalankanni is a staple for jaundice, taken as a leaf soup. It is one of the best examples of how ordinary and abundant much of the AYUSH pharmacopoeia actually is.',
    habitat:
      'Damp waste ground, paddy field bunds, canal edges and roadsides throughout India up to 2,000 m. Needs moisture and grows almost year-round.',
    morphology:
      'A prostrate or erect annual herb 20–60 cm tall with rough, hairy, often purplish, freely rooting stems. Leaves are opposite, sessile, lanceolate, 2–8 cm, with a rough surface and sparsely toothed margin. Flower heads are small white daisies, 6–8 mm, solitary or paired on long stalks. The crushed plant stains the fingers dark.',
    regions: ['Pan-India', 'Indo-Gangetic Plains', 'Coastal', 'Western Ghats'],
    type: 'Herb',
    partsUsed: ['Whole plant', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Skin & Hair', 'Liver', 'Mind & Sleep'],
    uses: [
      {
        title: 'Hair growth and greying',
        detail:
          'Bhringraj taila massaged into the scalp is the classical treatment for hair fall and premature greying; animal studies show increased follicle density with leaf extract.',
      },
      {
        title: 'Liver and jaundice',
        detail:
          'Karisalankanni leaf juice or soup is a Siddha mainstay in jaundice; wedelolactone shows hepatoprotective activity in experimental liver injury.',
      },
      {
        title: 'Skin conditions',
        detail:
          'Applied to eczema, athlete’s foot and minor infections for its antimicrobial and astringent action.',
      },
      {
        title: 'Sleep and calm',
        detail:
          'Head massage with bhringraj oil is used across India as an evening ritual for cooling the head and easing sleep.',
      },
    ],
    ayurvedic: {
      rasa: ['Katu (pungent)', 'Tikta (bitter)'],
      guna: ['Ruksha (dry)', 'Laghu (light)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; keshya and rasayana',
    },
    preparations: [
      { name: 'Bhringraj taila', detail: 'Leaf juice cooked into sesame or coconut oil for scalp massage.' },
      { name: 'Bhringrajasava', detail: 'A fermented preparation for liver disorders and general weakness.' },
      { name: 'Fresh juice', detail: '10–20 ml of swarasa with honey for liver support.' },
      { name: 'Karisalankanni kudineer', detail: 'A Siddha decoction taken in jaundice.' },
    ],
    cultivation: {
      soil: 'Moist, fertile clay loam; tolerates temporarily waterlogged ground.',
      climate: 'Tropical to sub-tropical; grows nearly year-round with moisture.',
      propagation: 'Seed, or stem cuttings that root at every node within days.',
      spacing: '30 × 30 cm; it spreads to cover the bed.',
      water: 'Frequent — this is a plant of wet ground.',
      harvest: 'Whole plant at 60–90 days, at the start of flowering; two or three cuts a year.',
      tips: [
        'One of the fastest-rooting cuttings of any medicinal plant — pieces root in a glass of water in three days.',
        'It grows freely as a weed in paddy fields, and that free supply is genuine medicine.',
        'The yellow-flowered Wedelia is a common look-alike; true bhringraj has white flower heads.',
      ],
    },
    precautions: [
      'Can cause a burning sensation on sensitive skin when applied fresh and undiluted.',
      'Its heating quality may aggravate Pitta in excess.',
      'Avoid therapeutic internal doses in pregnancy.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The plant stains skin and cloth blue-black, and was historically used as a tattoo dye.',
      'Three colour forms exist — white, yellow and black bhringraj — and the classical texts distinguish their uses.',
      'It grows on every continent except Antarctica, making it one of the world’s most widespread medicinal herbs.',
    ],
    difficulty: 1,
    accent: '#3f7a58',
    model: {
      archetype: 'creeper',
      height: 0.3,
      stem: { color: '#7d8a55', radius: 0.006, curve: 0.5 },
      branching: { levels: 1, count: 5, angle: 62, startAt: 0.1, taper: 0.75 },
      leaf: {
        shape: 'lanceolate',
        length: 0.055,
        width: 0.016,
        arrangement: 'opposite',
        density: 8,
        top: '#4c8a4e',
        bottom: '#7fae74',
        serration: 0.35,
        droop: 0.18,
        curl: 0.2,
        gloss: 0.2,
      },
      flower: { form: 'solitary', color: '#fbfaf3', centre: '#e2c85e', size: 0.014, count: 7, petals: 12 },
      ground: 'water',
    },
  },

  {
    id: 'mandukaparni',
    name: 'Mandukaparni',
    botanical: 'Centella asiatica',
    family: 'Apiaceae',
    names: {
      Sanskrit: 'Mandukaparni, Saraswati',
      Hindi: 'Brahmi booti',
      Tamil: 'Vallarai',
      Telugu: 'Saraswathi aku',
      Bengali: 'Thankuni',
      Malayalam: 'Kudangal',
      English: 'Gotu Kola',
    },
    tagline: 'The frog-leaf herb — a creeping mat that rebuilds skin and steadies the mind.',
    description:
      'Mandukaparni means "frog-leaf", after the shape of its rounded, scalloped leaves and its habit of hopping across wet ground by runners. It occupies two therapeutic worlds at once: a medhya herb for memory and calm, and one of the best-evidenced botanicals for connective tissue, with madecassoside and asiaticoside used clinically for wound healing, scars, stretch marks and venous insufficiency.',
    habitat:
      'Damp shaded ground, stream banks, paddy bunds and garden edges throughout India up to 2,000 m. Prefers moisture and partial shade.',
    morphology:
      'A slender prostrate perennial herb with creeping stolons rooting at the nodes. Leaves are long-stalked and arise in rosettes at the nodes: orbicular to reniform, 2–5 cm, with a crenate margin and palmate venation. Flowers are tiny, pinkish, in inconspicuous umbels hidden beneath the leaves.',
    regions: ['Pan-India', 'Western Ghats', 'North-East India', 'Himalayan'],
    type: 'Herb',
    partsUsed: ['Whole plant', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Mind & Sleep', 'Skin & Hair', 'Wound Care', 'Heart & Circulation'],
    uses: [
      {
        title: 'Wound healing and scars',
        detail:
          'Asiaticoside stimulates collagen synthesis. Titrated Centella extract is used clinically for burns, surgical scars, keloids and stretch marks.',
      },
      {
        title: 'Memory and mental clarity',
        detail:
          'A medhya rasayana used alongside brahmi; small trials report improvements in working memory and mood in older adults.',
      },
      {
        title: 'Venous insufficiency',
        detail:
          'European studies show reduced ankle oedema and improved venous tone in chronic venous insufficiency with standardised extract.',
      },
      {
        title: 'Vallarai in Tamil kitchens',
        detail:
          'Eaten as a chutney or thuvaiyal in Tamil Nadu — food and brain tonic in the same dish.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Madhura (sweet)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Sara (mobile)'],
      virya: 'Shita (cooling)',
      vipaka: 'Madhura (sweet)',
      dosha: 'Balances all three doshas; medhya and rasayana',
    },
    preparations: [
      { name: 'Vallarai thuvaiyal', detail: 'Fresh leaves ground with coconut, chilli and tamarind as a daily side dish.' },
      { name: 'Mandukaparni swarasa', detail: '10–20 ml of fresh juice on an empty stomach.' },
      { name: 'Centella extract cream', detail: 'Standardised topical preparation for scars and wounds.' },
      { name: 'Brahmi ghrita', detail: 'Frequently formulated together with Bacopa for neurological support.' },
    ],
    cultivation: {
      soil: 'Moist, fertile, humus-rich soil; tolerates clay and temporary waterlogging.',
      climate: 'Warm humid, 20–35 °C, in partial shade. Scorches in full afternoon sun.',
      propagation: 'Runners with rooted nodes, separated and replanted; establishes in days.',
      spacing: '20 × 20 cm — it will carpet the space.',
      water: 'Keep constantly moist.',
      harvest: 'From 90 days, cutting leaves and runners; regrows continuously, giving three or four cuts a year.',
      tips: [
        'A perfect ground cover under taller potted plants, using shade that would otherwise be wasted.',
        'Do not confuse it with Bacopa monnieri; both are sold as "brahmi" but this one has round scalloped leaves.',
        'Grows readily in a shallow tray on a shaded balcony.',
      ],
    },
    precautions: [
      'High doses can cause drowsiness and headache; avoid combining with sedatives.',
      'Rare reports of hepatotoxicity with prolonged high-dose use — limit continuous courses to six weeks.',
      'Avoid therapeutic doses in pregnancy.',
    ],
    conservation: 'Least Concern',
    facts: [
      'Sri Lankan tradition links it to elephants, which eat the leaves and are long-lived — hence its reputation as a longevity herb.',
      'Its scar-healing extract is a mainstream ingredient in Korean skincare, marketed as "cica".',
      'The leaf shape genuinely does resemble a frog’s webbed foot, which is what the Sanskrit name records.',
    ],
    difficulty: 1,
    accent: '#5aa06a',
    model: {
      archetype: 'creeper',
      height: 0.14,
      stem: { color: '#8fae63', radius: 0.0035, curve: 0.7 },
      branching: { levels: 1, count: 4, angle: 80, startAt: 0.05, taper: 0.85 },
      leaf: {
        shape: 'reniform',
        length: 0.05,
        width: 0.058,
        arrangement: 'basal',
        density: 6,
        top: '#5faa5f',
        bottom: '#8dc788',
        serration: 0.5,
        droop: 0.1,
        curl: 0.35,
        gloss: 0.4,
      },
      flower: { form: 'umbel', color: '#e8d3dc', size: 0.006, count: 4, petals: 5 },
      ground: 'water',
    },
  },

  {
    id: 'guggulu',
    name: 'Guggulu',
    botanical: 'Commiphora wightii',
    family: 'Burseraceae',
    names: {
      Sanskrit: 'Guggulu, Devadhupa',
      Hindi: 'Guggul',
      Gujarati: 'Gugal',
      Tamil: 'Gukkulu',
      Marathi: 'Guggul',
      English: 'Indian Bdellium',
    },
    tagline: 'A desert thorn bleeding fragrant resin — and one of India’s most threatened plants.',
    description:
      'Guggulu is not a leaf or a root but an oleo-gum-resin, tapped from the bark of a gnarled desert shrub. It is the binding agent of an entire class of Ayurvedic formulations — the guggulu kalpas — used for arthritis, obesity and lipid disorders. Its guggulsterones were the basis of gugulipid, an Indian anti-lipidaemic drug launched in the 1980s. Destructive tapping has pushed the wild plant to critically endangered status.',
    habitat:
      'Arid rocky tracts of Rajasthan, Gujarat, Madhya Pradesh and Karnataka, on gravelly and sandy soils in low-rainfall regions of 200–500 mm.',
    morphology:
      'A small, highly branched, spinescent shrub or tree 1–4 m tall with ash-coloured papery bark that peels in flakes. Branches are crooked and knotty, ending in sharp spines. Leaves are trifoliate or simple, small, 1–5 cm, with toothed margins, shed early in the dry season. Flowers are small and brownish-red. The stem exudes a pale yellow aromatic gum-resin when injured.',
    regions: ['Arid & Desert', 'Deccan Plateau'],
    type: 'Shrub',
    partsUsed: ['Oleo-gum-resin'],
    systems: ['Ayurveda', 'Siddha', 'Unani'],
    therapeutic: ['Joints & Pain', 'Metabolic', 'Heart & Circulation'],
    uses: [
      {
        title: 'Arthritis and joint disorders',
        detail:
          'The core anti-inflammatory of Ayurvedic rheumatology; Yogaraja guggulu and Simhanada guggulu are standard prescriptions for amavata and osteoarthritis.',
      },
      {
        title: 'Lipids and obesity',
        detail:
          'Guggulsterones act on bile-acid receptors affecting cholesterol metabolism; classically it is the premier medohara, or fat-reducing, drug.',
      },
      {
        title: 'Thyroid and metabolism',
        detail:
          'Traditionally used in hypothyroid-type presentations; experimental work shows stimulation of thyroid function.',
      },
      {
        title: 'Formulation binder',
        detail:
          'Purified guggulu binds and carries other herbs in dozens of compound tablets, giving the whole class its name.',
      },
    ],
    ayurvedic: {
      rasa: ['Tikta (bitter)', 'Katu (pungent)', 'Kashaya (astringent)', 'Madhura (sweet)'],
      guna: ['Laghu (light)', 'Ruksha (dry)', 'Vishada (clearing)', 'Sara (mobile)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Balances all three doshas; especially Kapha and Vata',
    },
    preparations: [
      { name: 'Yogaraja guggulu', detail: 'A classical compound for joint pain, stiffness and Vata disorders.' },
      { name: 'Triphala guggulu', detail: 'Used for weight management, haemorrhoids and fistula.' },
      { name: 'Kaishora guggulu', detail: 'A blood-purifying formulation for gout and skin disease.' },
      { name: 'Shuddha guggulu', detail: 'Resin purified in triphala or milk decoction before any internal use.' },
    ],
    cultivation: {
      soil: 'Poor, gravelly, sandy or rocky soil with sharp drainage; tolerates high pH.',
      climate: 'Hot arid, 200–500 mm rainfall; extremely drought-hardy and frost-sensitive.',
      propagation: 'Stem cuttings of 20–30 cm are far more reliable than seed, which has poor viability.',
      spacing: '3 × 3 m.',
      water: 'Almost none once established; excess water kills it.',
      harvest: 'Resin tapping only from plants over eight years old, in winter, from a single shallow incision, then a rest of at least a year.',
      tips: [
        'Never make deep or multiple incisions — that is precisely what pushed the wild species to the brink.',
        'Cuttings taken in the dry season and planted before the monsoon establish best.',
        'Cultivated guggulu is now actively promoted by the National Medicinal Plants Board; grow it if you have arid land.',
      ],
    },
    precautions: [
      'Interacts with propranolol, diltiazem and thyroid medication; discuss with a doctor before use.',
      'Raw unpurified resin causes rashes, gastric irritation and headache — only shuddha (purified) guggulu is used.',
      'Avoid in pregnancy, in active liver disease and before surgery.',
    ],
    conservation: 'Critically Endangered',
    facts: [
      'The wild population has fallen so far that Commiphora wightii is listed as Critically Endangered on the IUCN Red List.',
      'Gugulipid, launched in India in 1986, was one of the earliest modern drugs derived from an Ayurvedic plant.',
      'Devadhupa, one of its Sanskrit names, means "incense of the gods" — the resin has been burned in ritual for millennia.',
    ],
    difficulty: 3,
    accent: '#9a7b4f',
    model: {
      archetype: 'shrub',
      height: 1.1,
      stem: { color: '#b8b19d', radius: 0.026, curve: 0.55, woody: true },
      branching: { levels: 2, count: 3, angle: 62, startAt: 0.15, taper: 0.6 },
      leaf: {
        shape: 'obovate',
        compound: 'trifoliate',
        leaflets: 3,
        length: 0.022,
        width: 0.013,
        arrangement: 'alternate',
        density: 5,
        top: '#7d9d5e',
        bottom: '#a3bb85',
        serration: 0.4,
        droop: 0.15,
        curl: 0.2,
        gloss: 0.2,
      },
      ground: 'rock',
    },
  },

  {
    id: 'punarnava',
    name: 'Punarnava',
    botanical: 'Boerhavia diffusa',
    family: 'Nyctaginaceae',
    names: {
      Sanskrit: 'Punarnava, Varshabhu',
      Hindi: 'Gadahpurna, Santhi',
      Tamil: 'Mukkarattai',
      Telugu: 'Atikamamidi',
      Bengali: 'Punarnava',
      Malayalam: 'Thazhuthama',
      English: 'Spreading Hogweed',
    },
    tagline: '“That which renews” — a monsoon weed that resurrects itself and reduces swelling.',
    description:
      'Punarnava means "renewed again", and the name is literal: the plant dies back to its root in the dry season and springs to life with the first rains, which also gives it the epithet varshabhu, "born of the rains". Therapeutically it is India’s principal diuretic and anti-oedema herb, used for fluid retention, kidney disease and ascites, and its root is a standard component of formulations for swelling of any origin.',
    habitat:
      'A common weed of waste ground, roadsides, field bunds and gardens throughout India up to 2,000 m, most abundant during and after the monsoon.',
    morphology:
      'A prostrate or spreading perennial herb with a stout fusiform root and slender purplish-green stems 30–100 cm long, swollen at the nodes. Leaves are opposite and unequal in each pair, broadly ovate, 2–4 cm, green above and whitish beneath. Tiny pink to magenta flowers appear in small umbellate clusters on long stalks; fruit is a sticky, glandular, ribbed achene that clings to clothing.',
    regions: ['Pan-India', 'Indo-Gangetic Plains', 'Deccan Plateau', 'Coastal'],
    type: 'Herb',
    partsUsed: ['Root', 'Whole plant', 'Leaf'],
    systems: ['Ayurveda', 'Siddha', 'Unani', 'Homoeopathy'],
    therapeutic: ['Kidney & Urinary', 'Liver', 'Joints & Pain', 'Heart & Circulation'],
    uses: [
      {
        title: 'Oedema and fluid retention',
        detail:
          'The definitive shothahara (anti-swelling) herb, used for oedema of cardiac, renal and hepatic origin as a supportive diuretic.',
      },
      {
        title: 'Kidney support',
        detail:
          'Punarnavadi mandura and punarnava kwatha are prescribed in nephrotic syndrome and chronic kidney disease alongside conventional treatment.',
      },
      {
        title: 'Liver and ascites',
        detail:
          'Used in jaundice and ascites; experimental studies report hepatoprotective and diuretic activity for the root extract.',
      },
      {
        title: 'Anaemia',
        detail:
          'Punarnavadi mandura, an iron-containing classical formulation, is given for anaemia with swelling.',
      },
    ],
    ayurvedic: {
      rasa: ['Madhura (sweet)', 'Tikta (bitter)', 'Kashaya (astringent)'],
      guna: ['Laghu (light)', 'Ruksha (dry)'],
      virya: 'Ushna (heating)',
      vipaka: 'Katu (pungent)',
      dosha: 'Pacifies Kapha and Vata; shothahara and mutrala',
    },
    preparations: [
      { name: 'Punarnavadi kwatha', detail: 'A decoction for oedema, kidney and liver disorders.' },
      { name: 'Punarnavadi mandura', detail: 'An iron-based classical formulation for anaemia with swelling.' },
      { name: 'Punarnava churna', detail: 'Root powder, 3–6 g twice daily.' },
      { name: 'Leaf vegetable', detail: 'Young leaves cooked as a monsoon green in many rural cuisines.' },
    ],
    cultivation: {
      soil: 'Any well-drained soil; thrives on poor, disturbed ground.',
      climate: 'Tropical and sub-tropical; sprouts with the monsoon and dies back in the dry season.',
      propagation: 'Seed sown at the onset of the monsoon, or root cuttings.',
      spacing: '45 × 30 cm.',
      water: 'Rainfed; almost no irrigation needed.',
      harvest: 'Roots at 5–6 months after the monsoon, when the aerial parts dry back.',
      tips: [
        'It is very likely already growing in your garden — learn to recognise it before buying it.',
        'Roots of one-year-old plants are more potent than those of first-season seedlings.',
        'The sticky fruits disperse on clothing and animal fur, which is why it appears everywhere.',
      ],
    },
    precautions: [
      'Its diuretic action can deplete potassium; not for use alongside strong diuretics without monitoring.',
      'Avoid in pregnancy — it has emmenagogue and abortifacient reputation at high doses.',
      'Do not self-treat kidney disease; this herb is a supportive adjunct, never a substitute for nephrology care.',
    ],
    conservation: 'Least Concern',
    facts: [
      'The white-flowered and red-flowered forms are distinguished in the classical texts, with shweta punarnava considered superior.',
      'It regenerates from the root each monsoon, which is exactly what the name punarnava describes.',
      'Its sticky fruits are an efficient hitchhiker, dispersing on cattle and clothing across the whole subcontinent.',
    ],
    difficulty: 1,
    accent: '#a4577e',
    model: {
      archetype: 'creeper',
      height: 0.24,
      stem: { color: '#96755f', radius: 0.005, curve: 0.65 },
      branching: { levels: 1, count: 6, angle: 75, startAt: 0.08, taper: 0.78 },
      leaf: {
        shape: 'ovate',
        length: 0.045,
        width: 0.036,
        arrangement: 'opposite',
        density: 7,
        top: '#5c9153',
        bottom: '#c3cfae',
        serration: 0,
        droop: 0.12,
        curl: 0.28,
        gloss: 0.25,
      },
      flower: { form: 'umbel', color: '#d16a9c', size: 0.008, count: 6, petals: 5 },
      ground: 'soil',
    },
  },
]
