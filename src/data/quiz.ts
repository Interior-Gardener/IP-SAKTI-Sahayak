/* ------------------------------------------------------------------ *
 * Vanaspati quiz question bank.
 * All questions are "find and click the correct plant" — the user
 * reads the clue and clicks on the matching 3D model in the garden.
 *
 * Pattern mirrors plants.part*.ts: static TypeScript, bundled at
 * build time, so the quiz works fully offline.
 *
 * Coverage: every plant in every gardenBed gets ≥ 1 question.
 * ------------------------------------------------------------------ */

export interface QuizQuestion {
  id: string
  /** The plant the visitor must click — the one correct answer. */
  targetPlantId: string
  /** The bed the camera will focus on when this question is shown.
   *  Narrows the search space without revealing the exact specimen. */
  targetBedId: string
  /** Human-friendly bed name shown in the HUD. */
  bedName: string
  /** The clue text shown to the player. */
  question: string
  /** Optional hint shown after 8 s of inactivity. */
  hint?: string
  /** 1 = recognisable name, 2 = moderate knowledge, 3 = specialist. */
  difficulty: 1 | 2 | 3
}

export const quizQuestions: QuizQuestion[] = [
  /* ---------------------------------------------------------------- *
   * Agni Court — Digestion & the gut
   * Plants: ginger, mint, bael, fenugreek, pomegranate
   * ---------------------------------------------------------------- */
  {
    id: 'q-ginger-1',
    targetPlantId: 'ginger',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'Called the "universal medicine" in Ayurveda, this rhizome warms the gut, soothes nausea, and forms the base of countless Indian spice blends. Find it.',
    hint: 'Its underground root is a staple in Indian kitchens.',
    difficulty: 1,
  },
  {
    id: 'q-ginger-2',
    targetPlantId: 'ginger',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'Vishwabheshaja \u2014 "physician of the world." This tropical plant\'s knobbly rhizome is harvested for both cooking and a classical Ayurvedic decoction called Trikatu. Which plant is it?',
    hint: 'Look for a reed-like plant with lance-shaped leaves near the soil.',
    difficulty: 2,
  },
  {
    id: 'q-mint-1',
    targetPlantId: 'mint',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'An aromatic herb with square stems and a cool, refreshing scent. Its leaves ease bloating, freshen breath, and give chutneys their bright flavour. Click it.',
    hint: 'It belongs to the same family as Tulsi — look for the square stems.',
    difficulty: 1,
  },
  {
    id: 'q-bael-1',
    targetPlantId: 'bael',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'Sacred to Lord Shiva, this tree bears a hard-shelled fruit that, when ripe, is scooped out and drunk as a digestive sherbet. It is one of Ayurveda\'s most revered gut tonics.',
    hint: 'Also called Wood Apple or Bilva.',
    difficulty: 2,
  },
  {
    id: 'q-fenugreek-1',
    targetPlantId: 'fenugreek',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'Called Methi in Hindi, this annual herb produces bitter golden seeds that regulate blood sugar, improve digestion, and are soaked overnight as a morning remedy. Find it.',
    hint: 'Its seeds are also used to sprout greens for salads.',
    difficulty: 1,
  },
  {
    id: 'q-pomegranate-1',
    targetPlantId: 'pomegranate',
    targetBedId: 'digestive',
    bedName: 'Agni Court',
    question:
      'This shrub or small tree bears jewel-red fruit bursting with antioxidants. In Ayurveda, its rind is used to treat diarrhoea and its juice to cool Pitta. Which one is it?',
    hint: 'Its Sanskrit name Dadima appears in the oldest Ayurvedic texts.',
    difficulty: 1,
  },

  /* ---------------------------------------------------------------- *
   * Rasayana Grove — Immunity & vitality
   * Plants: tulsi, giloy, amla, ashwagandha
   * ---------------------------------------------------------------- */
  {
    id: 'q-tulsi-1',
    targetPlantId: 'tulsi',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'The "Queen of Herbs," grown at the threshold of nearly every Indian home. Its eugenol-rich leaves are the first response to a cough, fever, or stressful week. Click it.',
    hint: 'It is planted in a raised courtyard altar and tended daily.',
    difficulty: 1,
  },
  {
    id: 'q-tulsi-2',
    targetPlantId: 'tulsi',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'Holy Basil — an erect aromatic undershrub in the mint family. It comes in two cultivars: Rama (green leaves, mild) and Krishna (purple-tinged, clove-like). Find it.',
    hint: 'Look for whorled purple flower clusters on a small branching herb.',
    difficulty: 2,
  },
  {
    id: 'q-giloy-1',
    targetPlantId: 'giloy',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'Called Amrita — "the nectar of immortality" — this heart-leaved climbing vine is one of Ayurveda\'s supreme immunity tonics. Find it in Rasayana Grove.',
    hint: 'A climber whose stem is used in kadha during seasonal illnesses.',
    difficulty: 2,
  },
  {
    id: 'q-amla-1',
    targetPlantId: 'amla',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'This deciduous tree bears small, sour, greenish fruits that are one of the richest natural sources of Vitamin C on Earth. It is the cornerstone of Triphala. Click it.',
    hint: 'Also called Indian Gooseberry.',
    difficulty: 1,
  },
  {
    id: 'q-ashwagandha-1',
    targetPlantId: 'ashwagandha',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'Often called Indian Ginseng, this adaptogenic root reduces cortisol, builds stamina, and strengthens the reproductive system. Which plant is it?',
    hint: 'Its name means "smell of horse" — its roots have a distinctive earthy scent.',
    difficulty: 1,
  },
  {
    id: 'q-ashwagandha-2',
    targetPlantId: 'ashwagandha',
    targetBedId: 'immunity',
    bedName: 'Rasayana Grove',
    question:
      'Withania somnifera — a small grey-green shrub bearing papery, lantern-like husks around its berries. Its tuberous root is a Balya (strength-giving) rasayana. Click it.',
    hint: 'It has a slightly woolly appearance.',
    difficulty: 3,
  },

  /* ---------------------------------------------------------------- *
   * Twak Terrace — Skin, hair & wounds
   * Plants: neem, aloe-vera, turmeric, henna, bhringraj, hibiscus
   * ---------------------------------------------------------------- */
  {
    id: 'q-neem-1',
    targetPlantId: 'neem',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'The "village pharmacy" of India — its leaves, bark, twigs, and oil fight bacteria, fungi, and insects. Villagers still use its twigs as toothbrushes. Find it.',
    hint: 'A fast-growing tree with pinnate leaves and a bitter taste.',
    difficulty: 1,
  },
  {
    id: 'q-aloe-vera-1',
    targetPlantId: 'aloe-vera',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'A succulent rosette with thick, fleshy leaves edged in tiny teeth. Its clear inner gel is the go-to remedy for sunburn, cuts, and dry skin. Click it.',
    hint: 'Look for a spiky ground-hugging plant in the skin bed.',
    difficulty: 1,
  },
  {
    id: 'q-turmeric-1',
    targetPlantId: 'turmeric',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'Haldi — the golden spice at the heart of every Indian kitchen and wedding ritual. Its curcumin fights inflammation and is applied as a face pack for glowing skin. Find it.',
    hint: 'A ginger-family plant with broad leaves and an underground golden rhizome.',
    difficulty: 1,
  },
  {
    id: 'q-turmeric-2',
    targetPlantId: 'turmeric',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'Curcuma longa — a tropical rhizome plant whose underground stem is a deep orange-yellow. Curcumin, its active compound, is now one of the most studied natural molecules in medicine. Click it.',
    hint: 'Its leaves are broad and paddle-shaped, like a large ginger plant.',
    difficulty: 2,
  },
  {
    id: 'q-henna-1',
    targetPlantId: 'henna',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'Its leaves are ground into a paste that stains skin in intricate patterns at Indian weddings — the famous mehndi. Find this shrub in the garden.',
    hint: 'A small shrub with small, narrow leaves used as a natural dye.',
    difficulty: 1,
  },
  {
    id: 'q-bhringraj-1',
    targetPlantId: 'bhringraj',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'The "king of hair" in Ayurveda — its leaf juice is blended into traditional hair oils to darken greying hair and restore the scalp. Which plant is it?',
    hint: 'A low-growing herb with small white daisy-like flowers.',
    difficulty: 2,
  },
  {
    id: 'q-hibiscus-1',
    targetPlantId: 'hibiscus',
    targetBedId: 'skin',
    bedName: 'Twak Terrace',
    question:
      'This tropical flowering shrub produces large, velvety red blossoms used to condition hair and brewed as a tart Vitamin-C-rich herbal tea. Click it.',
    hint: 'Look for bold, trumpet-shaped red flowers.',
    difficulty: 1,
  },

  /* ---------------------------------------------------------------- *
   * Prana Walk — Breath & lungs
   * Plants: vasaka, lemongrass, mulethi, kalmegh, babul
   * ---------------------------------------------------------------- */
  {
    id: 'q-vasaka-1',
    targetPlantId: 'vasaka',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'Also called Malabar Nut, this bushy shrub is the most widely prescribed Ayurvedic herb for coughs, asthma, and bronchitis. Its alkaloid vasicine gave us the drug bromhexine. Find it.',
    hint: 'A dense shrub with large, lance-shaped leaves.',
    difficulty: 2,
  },
  {
    id: 'q-vasaka-2',
    targetPlantId: 'vasaka',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'Adhatoda vasica — a bitter-tasting shrub whose Sanskrit name means "not eaten by animals." Which plant in Prana Walk is it?',
    hint: 'Even animals avoid eating this one because it is so bitter.',
    difficulty: 3,
  },
  {
    id: 'q-lemongrass-1',
    targetPlantId: 'lemongrass',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'A tall, clumping grass with a vivid citrus fragrance. Ayurveda uses its steam in inhalations for respiratory congestion; Thailand uses it in cooking. Click it.',
    hint: 'Look for a grass-like plant with long, slender blue-green blades.',
    difficulty: 1,
  },
  {
    id: 'q-mulethi-1',
    targetPlantId: 'mulethi',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'Yashtimadhu — "sweet stick." This legume\'s root is 50 times sweeter than sugar and is boiled into a soothing decoction for sore throats and ulcers. Find it.',
    hint: 'Also called Licorice. A small shrub with pinnate leaves.',
    difficulty: 2,
  },
  {
    id: 'q-kalmegh-1',
    targetPlantId: 'kalmegh',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'Nicknamed the "King of Bitters," this intensely bitter annual herb is a staple in Ayurveda and Siddha for fevers, liver conditions, and viral infections. Click it.',
    hint: 'One taste is enough to remember it — profoundly bitter.',
    difficulty: 2,
  },
  {
    id: 'q-babul-1',
    targetPlantId: 'babul',
    targetBedId: 'respiratory',
    bedName: 'Prana Walk',
    question:
      'A thorny acacia tree whose chewing-twig (datun) has been used for oral hygiene across India for millennia. Its gum resin soothes the respiratory tract. Find it.',
    hint: 'Look for a small thorny tree — its twigs were India\'s first toothbrush.',
    difficulty: 2,
  },

  /* ---------------------------------------------------------------- *
   * Medhya Arbour — Mind, memory & sleep
   * Plants: brahmi, mandukaparni, sarpagandha, sandalwood
   * ---------------------------------------------------------------- */
  {
    id: 'q-brahmi-1',
    targetPlantId: 'brahmi',
    targetBedId: 'mind',
    bedName: 'Medhya Arbour',
    question:
      'The most famous Ayurvedic brain tonic — students and scholars have used this creeping herb for centuries to sharpen memory and focus. Find it.',
    hint: 'A low, water-loving creeper with small, rounded succulent leaves.',
    difficulty: 1,
  },
  {
    id: 'q-brahmi-2',
    targetPlantId: 'brahmi',
    targetBedId: 'mind',
    bedName: 'Medhya Arbour',
    question:
      'Bacopa monnieri — a medhya rasayana that grows along riverbanks, with small fleshy leaves and pale lavender flowers. Which plant is it in the mind bed?',
    hint: 'Bacosides in its leaves are the active compounds studied for memory.',
    difficulty: 3,
  },
  {
    id: 'q-mandukaparni-1',
    targetPlantId: 'mandukaparni',
    targetBedId: 'mind',
    bedName: 'Medhya Arbour',
    question:
      'Also known as Gotu Kola or Centella, this creeping herb promotes wound healing, collagen synthesis, and mental clarity. It is used in both Ayurveda and traditional Thai medicine. Click it.',
    hint: 'Its round, fan-shaped leaves look like a frog\'s foot — that is what its Sanskrit name means.',
    difficulty: 2,
  },
  {
    id: 'q-sarpagandha-1',
    targetPlantId: 'sarpagandha',
    targetBedId: 'mind',
    bedName: 'Medhya Arbour',
    question:
      'This plant\'s root contains reserpine — one of the first plant-derived drugs used in modern medicine to treat hypertension and calm an agitated mind. Which one is it?',
    hint: 'Rauwolfia serpentina — its name means "snake root."',
    difficulty: 3,
  },
  {
    id: 'q-sandalwood-1',
    targetPlantId: 'sandalwood',
    targetBedId: 'mind',
    bedName: 'Medhya Arbour',
    question:
      'A fragrant tree whose creamy heartwood is shaved into a paste for cooling fevers and calming the mind. Its oil is one of the most valuable natural perfumes in the world. Find it.',
    hint: 'Used in meditation, religious rituals, and luxury perfumery.',
    difficulty: 1,
  },

  /* ---------------------------------------------------------------- *
   * Hridaya Circle — Heart, joints & renewal
   * Plants: arjuna, guggulu, punarnava, shatavari, lotus, sadaphuli
   * ---------------------------------------------------------------- */
  {
    id: 'q-arjuna-1',
    targetPlantId: 'arjuna',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'The bark of this large riverbank tree is the premier Ayurvedic cardiac tonic. Boiled as a milk decoction called Arjunakshira, it is prescribed for heart failure and angina. Click it.',
    hint: 'Named after the warrior-archer of the Mahabharata.',
    difficulty: 2,
  },
  {
    id: 'q-arjuna-2',
    targetPlantId: 'arjuna',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'Terminalia arjuna — a large tree with buttressed roots that prefers to grow beside rivers. Its bark peels in thin flakes and is prescribed to strengthen the myocardium. Find it.',
    hint: 'One of India\'s most important medicinal trees for heart health.',
    difficulty: 2,
  },
  {
    id: 'q-guggulu-1',
    targetPlantId: 'guggulu',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'This thorny plant oozes a fragrant gum resin that Ayurveda has used for thousands of years to reduce cholesterol and relieve joint inflammation. Which plant is it?',
    hint: 'The resin is burned as incense in temples across India.',
    difficulty: 2,
  },
  {
    id: 'q-punarnava-1',
    targetPlantId: 'punarnava',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      '"One that renews the body" — this plant\'s name says it all. A proven kidney and liver tonic used to reduce oedema and fluid retention in Ayurvedic practice. Find it.',
    hint: 'A creeping weed with pink flowers that springs back after the rains.',
    difficulty: 2,
  },
  {
    id: 'q-shatavari-1',
    targetPlantId: 'shatavari',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      '"She who has a hundred husbands" — Ayurveda\'s foremost tonic for women\'s reproductive health, lactation, and hormonal balance. Click it.',
    hint: 'A climber with needle-like leaflets and small white flowers.',
    difficulty: 2,
  },
  {
    id: 'q-shatavari-2',
    targetPlantId: 'shatavari',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'Asparagus racemosus — a thorny climber with feathery, needle-like leaves and tuberous roots ground into a sweet, nourishing powder for nursing mothers. Find it.',
    hint: 'Related to the vegetable asparagus, but a very different plant.',
    difficulty: 3,
  },
  {
    id: 'q-lotus-1',
    targetPlantId: 'lotus',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'India\'s national flower — this aquatic plant rising from still water is a symbol of purity. In Ayurveda its seeds and rhizome cool the heart and calm the mind. Click it.',
    hint: 'Look for the plant rooted in water with floating leaves.',
    difficulty: 1,
  },
  {
    id: 'q-sadaphuli-1',
    targetPlantId: 'sadaphuli',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'This cheerful flowering herb, known as Periwinkle, contains vincristine — a compound used in cancer chemotherapy — and also helps control blood pressure. Find it.',
    hint: 'Pink or white five-petalled flowers on a low spreading herb.',
    difficulty: 2,
  },
  {
    id: 'q-sadaphuli-2',
    targetPlantId: 'sadaphuli',
    targetBedId: 'heart',
    bedName: 'Hridaya Circle',
    question:
      'Catharanthus roseus — a small flowering herb bearing glossy leaves and flowers in shades of pink, red, or white year-round. Its alkaloids changed cancer treatment forever. Click it.',
    hint: 'Its name in Marathi means "always blooming."',
    difficulty: 3,
  },
]

/** Fisher-Yates shuffle, returns `count` questions. */
export function shuffleQuestions(qs: QuizQuestion[], count = 10): QuizQuestion[] {
  const copy = [...qs]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(count, copy.length))
}
