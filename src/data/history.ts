import type { PlantHistory } from '../types/plant'

/* ------------------------------------------------------------------ *
 * Plant histories.
 *
 * Kept apart from the botanical entries because it is a different kind
 * of knowledge, gathered differently. Two rules hold throughout:
 *
 * 1. Dates are hedged and attributed. The classical Sanskrit medical
 *    texts cannot be dated precisely — scholars place the Charaka
 *    Samhita anywhere from the 2nd century BCE to the 2nd century CE —
 *    so a date here names the text or site it rests on and gives a
 *    range rather than a year.
 * 2. Where a tradition and the evidence disagree, both are said. A
 *    plant being called ancient is not the same as it being attested.
 *
 * This is an orientation, not a scholarly apparatus: the sources are
 * named so a reader can go and check, not because each has been
 * verified here.
 * ------------------------------------------------------------------ */

export const PLANT_HISTORY: Record<string, PlantHistory> = {
  tulsi: {
    origin:
      'Native to the Indian subcontinent, where it has been grown beside houses for so long that no truly wild population is easy to point to.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1000–500 BCE',
      sortYear: -800,
      source: 'Atharvaveda and the later Vedic domestic manuals',
      detail:
        'Aromatic household plants of the surasa group appear in Vedic ritual instruction, though which species each name meant is argued over.',
    },
    timeline: [
      {
        when: 'c. 1000–500 BCE',
        sortYear: -800,
        title: 'Named among the Vedic household herbs',
        detail:
          'Surasa, generally read as tulsi, appears in Vedic ritual and domestic texts as a plant of the courtyard rather than the forest.',
        kind: 'text',
        source: 'Atharvaveda',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Set down as medicine',
        detail:
          'The classical compendia describe surasa for cough, fever and skin disease, and for clearing the chest — the uses it still carries.',
        kind: 'text',
        source: 'Charaka Samhita and Sushruta Samhita',
      },
      {
        when: 'c. 800–1200 CE',
        sortYear: 1000,
        title: 'Becomes the goddess Tulsi',
        detail:
          'Puranic literature retells tulsi as a woman transformed into a plant and married to Vishnu each year, which is why a tulsi plant sits on a raised altar and is never casually cut.',
        kind: 'ritual',
        source: 'Padma Purana and the Tulsi-Vivah tradition',
      },
      {
        when: '1563',
        sortYear: 1563,
        title: 'Described for European readers',
        detail:
          'Garcia da Orta, working in Goa, recorded the Indian household basil and its uses in the first European book on Indian drugs.',
        kind: 'trade',
        source: 'Coloquios dos Simples e Drogas da India, Goa',
      },
      {
        when: '2000s',
        sortYear: 2005,
        title: 'Studied as an adaptogen',
        detail:
          'Trials from Indian research councils and universities examined tulsi for stress, blood sugar and immune response; results are promising but the studies are mostly small.',
        kind: 'science',
        source: 'CCRAS and university clinical studies',
      },
    ],
    etymology:
      'Sanskrit tulasi, usually glossed as "the incomparable one". The Hindi and Marathi names follow it directly.',
    spread:
      'Carried wherever Hindu households went — across South-East Asia with traders, and to Fiji, Mauritius, the Caribbean and East Africa with indentured labour in the 19th century.',
    lore:
      'The only plant routinely worshipped in Indian homes. A leaf is placed in the mouth of the dying, and the courtyard tulsi altar, the tulsi vrindavan, is often the oldest fixed thing in a house.',
  },

  neem: {
    origin:
      'Native to the dry deciduous forests of the Indian subcontinent and Myanmar, and cultivated across the plains since antiquity.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 2500–1900 BCE',
      sortYear: -2200,
      source: 'Harappan levels at Mohenjo-daro',
      detail:
        'Neem leaves have been reported from Harappan excavation levels, which if read correctly makes it one of the oldest medicinal plants in Indian use.',
    },
    timeline: [
      {
        when: 'c. 2500–1900 BCE',
        sortYear: -2200,
        title: 'Found in Harappan levels',
        detail:
          'Leaf remains reported from Mohenjo-daro suggest neem was already being used, most likely as a stored-grain protectant and a wound wash.',
        kind: 'archaeology',
        source: 'Excavation reports, Mohenjo-daro',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Nimba enters the medical canon',
        detail:
          'The classical texts give neem for skin disease, fever, worms and wound cleaning, and class it as the bitterest of the bitter drugs.',
        kind: 'text',
        source: 'Charaka Samhita and Sushruta Samhita',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'The village pharmacy',
        detail:
          'Medieval materia medica record the whole tree in use at once — twig as toothbrush, leaf in the grain bin, oil for skin, bark for fever.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '1928–1932',
        sortYear: 1930,
        title: 'The bitter principles isolated',
        detail:
          'Indian chemists isolated nimbin and nimbinin from neem oil, beginning the modern chemistry of the tree.',
        kind: 'science',
        source: 'Siddiqui and colleagues, Indian chemical literature',
      },
      {
        when: '1995–2005',
        sortYear: 2000,
        title: 'The neem patent revoked',
        detail:
          'A European patent on a neem-based fungicide was challenged on the ground that the use was long-standing Indian traditional knowledge, and was revoked after a decade-long fight — a founding case in the biopiracy debate.',
        kind: 'policy',
        source: 'European Patent Office, opposition to EP 0436257',
      },
    ],
    etymology:
      'Sanskrit nimba, from a root meaning to sprinkle or bestow health; the botanical Azadirachta comes through Persian azad-dirakht, "the free tree".',
    spread:
      'Taken to East and West Africa by Indian migrants in the 19th and 20th centuries, where it is now planted against desertification, and to the Caribbean and Australia.',
    lore:
      'Planted at temple gates and associated with Sitala, the goddess of pox and fever. Neem leaves are hung at doorways after illness, and eaten with jaggery at the Telugu and Marathi new year to take the bitter with the sweet.',
  },

  ashwagandha: {
    origin:
      'Native to the drier parts of India, the eastern Mediterranean and North Africa; the Indian medicinal tradition is built on cultivated Rajasthan and Madhya Pradesh stock.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Listed among the rasayana drugs — those taken not against a disease but to build the body back up.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Classed as a rasayana',
        detail:
          'The classical texts prescribe the root in milk for wasting, weakness and old age, a use that has not changed in two thousand years.',
        kind: 'text',
        source: 'Charaka Samhita, Chikitsasthana',
      },
      {
        when: 'c. 7th century CE',
        sortYear: 650,
        title: 'Fixed in the surgical and general canon',
        detail:
          'Vagbhata repeats the root as a strength-builder and adds its use in convalescence after fever and surgery.',
        kind: 'text',
        source: 'Ashtanga Hridayam',
      },
      {
        when: '1965',
        sortYear: 1965,
        title: 'The withanolides named',
        detail:
          'The steroidal lactones that give the root its activity were isolated and characterised, opening the modern pharmacology of the plant.',
        kind: 'science',
        source: 'Israeli and Indian phytochemical work on Withania',
      },
      {
        when: '2000s–2010s',
        sortYear: 2012,
        title: 'Trials on stress and cortisol',
        detail:
          'Randomised trials reported lower perceived stress and serum cortisol on standardised root extract. The trials are small and mostly industry-funded, which is worth knowing.',
        kind: 'science',
        source: 'Indian randomised controlled trials, 2008–2019',
      },
      {
        when: '2010s–present',
        sortYear: 2018,
        title: 'The export crop',
        detail:
          'Ashwagandha became one of India’s largest medicinal-plant exports as the global supplement market took it up, pulling cultivation into Madhya Pradesh and Rajasthan at scale.',
        kind: 'trade',
        source: 'National Medicinal Plants Board cultivation data',
      },
    ],
    etymology:
      'Sanskrit ashva-gandha, "horse smell" — for the sharp scent of the fresh root, and for the strength the root was said to give.',
    spread:
      'Known to Greek and Arab medicine as a soporific under the name of the winter cherry, and now grown for export in Africa and North America.',
    lore:
      'Called the strength of the stallion in the classical texts, and given to the weak, the elderly and the newly recovered — the drug of building back rather than curing.',
  },

  'aloe-vera': {
    origin:
      'A cultigen with no certain wild origin, most likely from the southern Arabian peninsula; carried into India early enough that it is naturalised across the dry west.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1550 BCE',
      sortYear: -1550,
      source: 'Ebers Papyrus, Egypt',
      detail:
        'Aloe appears in Egyptian medical papyri among wound and skin remedies, the earliest firm date for the plant anywhere.',
    },
    timeline: [
      {
        when: 'c. 1550 BCE',
        sortYear: -1550,
        title: 'Written down in Egypt',
        detail:
          'Egyptian medical papyri record aloe in salves and purges; the plant travelled with Red Sea trade long before it was written about in India.',
        kind: 'text',
        source: 'Ebers Papyrus',
      },
      {
        when: 'c. 50–70 CE',
        sortYear: 60,
        title: 'Described by Dioscorides',
        detail:
          'The Greek physician set out both uses that still matter — the gel on wounds and burns, the bitter dried juice as a purgative.',
        kind: 'text',
        source: 'De Materia Medica',
      },
      {
        when: 'c. 700–1200 CE',
        sortYear: 1000,
        title: 'Enters Indian materia medica as kumari',
        detail:
          'Ayurvedic lexicons give the gel for the liver, the eyes and the skin, and use the dried latex as a strong purgative under the name kumari.',
        kind: 'text',
        source: 'Ayurvedic nighantu literature',
      },
      {
        when: '16th–17th centuries',
        sortYear: 1600,
        title: 'The Socotra trade',
        detail:
          'Dried bitter aloes from Socotra were a staple of the Indian Ocean drug trade, shipped through Gujarat ports into the Indian market.',
        kind: 'trade',
        source: 'Indian Ocean drug-trade records',
      },
      {
        when: '1959',
        sortYear: 1959,
        title: 'Recognised by regulators',
        detail:
          'The US Food and Drug Administration approved aloe ointment for skin, and the modern gel industry grew from there into a global crop.',
        kind: 'policy',
        source: 'US FDA monograph on aloe ointment',
      },
    ],
    etymology:
      'From Arabic alloeh, "bitter shining substance" — the latex, not the gel. Sanskrit kumari, "young girl", for its use in restoring youthful vigour.',
    spread:
      'Moved out of Arabia with traders in every direction: to Egypt, Greece and Rome westward, and to India, China and eventually the Caribbean, where the commercial crop later concentrated.',
    lore:
      'Called the plant of immortality in Egypt and buried with the dead. In India its two substances — cooling gel and violent latex — became a standard lesson in why a single plant part cannot be treated as one drug.',
  },

  turmeric: {
    origin:
      'A sterile cultigen of South Asian origin, grown only by division of the rhizome; it does not set viable seed and has no wild population.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 2500 BCE',
      sortYear: -2500,
      source: 'Starch grains from Farmana, Harappan Haryana',
      detail:
        'Turmeric and ginger starch granules recovered from human dental calculus and cooking pots put the spice in Harappan kitchens.',
    },
    timeline: [
      {
        when: 'c. 2500 BCE',
        sortYear: -2500,
        title: 'In Harappan cooking pots',
        detail:
          'Starch grain analysis at Farmana found turmeric residue in dental calculus and vessels — the oldest direct evidence of the spice being eaten anywhere.',
        kind: 'archaeology',
        source: 'Starch grain study, Farmana, Haryana',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Haridra in the medical canon',
        detail:
          'The classical texts give turmeric for skin disease, wounds, diabetes-like conditions and poisoning, usually with honey or milk.',
        kind: 'text',
        source: 'Charaka Samhita and Sushruta Samhita',
      },
      {
        when: 'c. 1280',
        sortYear: 1280,
        title: 'Noticed by Marco Polo',
        detail:
          'Travelling the Malabar coast, Polo described a root with all the properties of saffron but which was not saffron — the earliest European notice.',
        kind: 'trade',
        source: 'Il Milione',
      },
      {
        when: '1815',
        sortYear: 1815,
        title: 'Curcumin isolated',
        detail:
          'European chemists separated the yellow colouring principle, later named curcumin, which is now the most studied natural product from an Indian plant.',
        kind: 'science',
        source: 'Vogel and Pelletier, Paris',
      },
      {
        when: '1995–1997',
        sortYear: 1997,
        title: 'The turmeric patent overturned',
        detail:
          'A US patent on turmeric for wound healing was revoked after India’s CSIR produced ancient texts and journal papers proving prior art — the case that led to the Traditional Knowledge Digital Library.',
        kind: 'policy',
        source: 'US Patent and Trademark Office re-examination of US 5,401,504',
      },
    ],
    etymology:
      'Sanskrit haridra, from hari, the yellow-green of Vishnu. The English word comes through Old French terre merite, "meritorious earth".',
    spread:
      'Reached China by the 7th century and East Africa by the 8th, moved west along the spice routes as a cheap saffron substitute, and went with Indian labour to the Caribbean and the Pacific.',
    lore:
      'Rubbed on the bride and groom before a wedding across most of India, tied as a root in auspicious threads, and used to mark the boundary between the ritually clean and unclean.',
  },

  ginger: {
    origin:
      'Another sterile cultigen, probably domesticated in Island South-East Asia or southern China and grown in India for at least four thousand years.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 2500 BCE',
      sortYear: -2500,
      source: 'Starch grains from Farmana, Harappan Haryana',
      detail:
        'Ginger starch appears alongside turmeric in Harappan dental calculus and cooking vessels.',
    },
    timeline: [
      {
        when: 'c. 2500 BCE',
        sortYear: -2500,
        title: 'In the Harappan kitchen',
        detail:
          'Starch residues put ginger in the same Harappan pots as turmeric, cooked with meat.',
        kind: 'archaeology',
        source: 'Starch grain study, Farmana, Haryana',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Called the universal medicine',
        detail:
          'The classical texts name dried ginger vishwabheshaja, the universal drug, for digestion, nausea, cough and joint pain.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: '1st century CE',
        sortYear: 50,
        title: 'Traded to Rome',
        detail:
          'Ginger reached Rome through the Red Sea trade and was taxed at Alexandria; Dioscorides described it as coming from the land of the Troglodytes, meaning by way of Africa.',
        kind: 'trade',
        source: 'De Materia Medica and Roman customs lists',
      },
      {
        when: 'c. 1500s',
        sortYear: 1550,
        title: 'Carried to the New World',
        detail:
          'The Spanish took ginger to Jamaica, which became a major producer and remains the reference grade for dried ginger.',
        kind: 'trade',
        source: 'Spanish colonial agricultural records',
      },
      {
        when: '1980s–present',
        sortYear: 1995,
        title: 'Trials for nausea',
        detail:
          'Clinical work supports ginger for motion sickness, morning sickness and post-operative nausea — among the better-evidenced uses of any traditional Indian drug.',
        kind: 'science',
        source: 'Cochrane and randomised trial literature',
      },
    ],
    etymology:
      'Sanskrit shringavera, "horn-shaped", through Greek zingiberis into every European language. Hindi adrak is the fresh root, sonth the dried.',
    spread:
      'One of the first spices to travel: to China and the Mediterranean before the common era, to East Africa with Arab traders, and to the Caribbean with the Spanish.',
    lore:
      'Fresh and dried ginger are treated as different drugs in Ayurveda, and dried ginger with jaggery is the standard household answer to a cold across northern India.',
  },

  brahmi: {
    origin:
      'A creeping marsh plant of wetlands across India and much of the warm world; the Indian tradition draws on plants from paddy margins and tank edges.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Listed among the medhya rasayana, the small group of drugs held to sharpen intellect and memory.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Named a medhya rasayana',
        detail:
          'Charaka groups four drugs as specifically good for the mind; brahmi is the one still most used, given to children learning by memory.',
        kind: 'text',
        source: 'Charaka Samhita, Chikitsasthana',
      },
      {
        when: 'c. 6th century CE',
        sortYear: 550,
        title: 'Fixed for epilepsy and insanity',
        detail:
          'Later classical writers add brahmi to formulations for fits and disordered mind, uses that carried into the medieval hospitals.',
        kind: 'text',
        source: 'Ashtanga Sangraha and later commentaries',
      },
      {
        when: 'c. 1500s–1700s',
        sortYear: 1600,
        title: 'The name confusion begins',
        detail:
          'Medieval lexicons apply the name brahmi to both Bacopa monnieri and Centella asiatica; the two are still sold interchangeably in parts of India, which matters because they are unrelated plants.',
        kind: 'text',
        source: 'Nighantu literature and regional practice',
      },
      {
        when: '1931',
        sortYear: 1931,
        title: 'Bacosides isolated',
        detail:
          'Indian chemists separated the saponins now called bacosides, the compounds most modern work is built on.',
        kind: 'science',
        source: 'Indian phytochemical literature on Bacopa',
      },
      {
        when: '2001–2016',
        sortYear: 2010,
        title: 'Memory trials in healthy adults',
        detail:
          'Australian and Indian randomised trials reported modest gains in delayed recall after twelve weeks of standardised extract; effects on other cognitive measures were inconsistent.',
        kind: 'science',
        source: 'Randomised controlled trials and later meta-analyses',
      },
    ],
    etymology:
      'From Brahma, the creator — the plant of the faculty that Brahma stands for. Bacopa is a Latinised form of a South American indigenous name for a related plant.',
    spread:
      'Naturally pantropical, so it needed no carrying; the Indian medical use travelled to Sri Lanka and South-East Asia with Ayurveda, and to the global supplement trade from the 1990s.',
    lore:
      'Given to schoolchildren before examinations across much of India, often as a spoonful of brahmi ghee, and planted at temple tanks where it grows on its own.',
  },

  amla: {
    origin:
      'Native to the deciduous forests of the Indian subcontinent, and among the oldest fruit trees taken into cultivation there.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1000–500 BCE',
      sortYear: -800,
      source: 'Vedic literature and the Chyavana legend',
      detail:
        'The story of the sage Chyavana restored to youth by a fruit preparation is Vedic in origin; the preparation that carries his name is built on amla.',
    },
    timeline: [
      {
        when: 'c. 1000–500 BCE',
        sortYear: -800,
        title: 'The Chyavana story',
        detail:
          'Vedic literature tells of the aged sage Chyavana made young again by the Ashvin twins — the origin story of chyawanprash, whose main ingredient is amla.',
        kind: 'text',
        source: 'Rigveda and the Shatapatha Brahmana',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The first among rasayanas',
        detail:
          'Charaka calls amla the best of the rejuvenating drugs and the one sour fruit that does not aggravate pitta.',
        kind: 'text',
        source: 'Charaka Samhita, Chikitsasthana',
      },
      {
        when: 'c. 250 BCE',
        sortYear: -250,
        title: 'The emperor’s half-amalaka',
        detail:
          'Buddhist tradition has the dying Ashoka, stripped of power, able to give the sangha only half an amla fruit — a story told across Buddhist Asia.',
        kind: 'ritual',
        source: 'Ashokavadana',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Standardised in the medieval canon',
        detail:
          'Bhavaprakasha fixes the triphala formula — amla with the two myrobalans — which remains the most-sold Ayurvedic preparation in India.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '1930s–present',
        sortYear: 1940,
        title: 'The vitamin C question',
        detail:
          'Indian analyses found unusually high and unusually stable ascorbic acid in the fruit; later work showed much of the stability comes from tannins rather than the vitamin itself.',
        kind: 'science',
        source: 'Indian nutritional chemistry literature',
      },
    ],
    etymology:
      'Sanskrit amalaki, from amala, "the pure one". Emblica comes from the Arabic and Persian amlaj, borrowed back into Latin botany.',
    spread:
      'Spread with Buddhism into Sri Lanka, Tibet and South-East Asia, where it entered local medicine; Tibetan medicine still depicts the Medicine Buddha holding an amla fruit.',
    lore:
      'The tree is worshipped on Amla Navami, when families eat under it. The fruit stands in Ayurveda for the idea that sourness need not heat the body.',
  },

  giloy: {
    origin:
      'A climber of Indian deciduous forests, often found growing up neem and mango trees, from which it takes part of its reputation.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Named amrita, the nectar of immortality, and given for chronic fever — the use that still dominates.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Named for the nectar of immortality',
        detail:
          'The classical texts call the climber amrita and guduchi, and prescribe it for fevers that will not resolve, for jaundice and for gout.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: 'undated, in Puranic tradition',
        sortYear: -300,
        title: 'The drops of amrita',
        detail:
          'Popular tradition ties the plant to the churning of the ocean: where drops of the nectar of immortality fell, guduchi grew.',
        kind: 'ritual',
        source: 'Puranic churning-of-the-ocean cycle',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'The satva preparation fixed',
        detail:
          'Medieval texts describe washing out the starch of the crushed stem to make guduchi satva, a cooling white powder still made the same way.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '2020',
        sortYear: 2020,
        title: 'Promoted during the pandemic',
        detail:
          'India’s AYUSH ministry recommended giloy in its immunity advisory, and demand rose sharply enough to strain wild supply.',
        kind: 'policy',
        source: 'Ministry of AYUSH COVID-19 advisory',
      },
      {
        when: '2021',
        sortYear: 2021,
        title: 'Liver-injury reports and the species mix-up',
        detail:
          'Indian hepatologists reported cases of liver injury after giloy use. Investigators concluded that misidentified look-alike species were a likely factor, which is a real caution about wild-collected material.',
        kind: 'science',
        source: 'Journal of Clinical and Experimental Hepatology case series',
      },
    ],
    etymology:
      'Sanskrit guduchi, "the one that protects the body"; amrita, "immortal". Hindi giloy comes from the same root as the Sanskrit guduchi.',
    spread:
      'Used across the subcontinent and into Sri Lanka and Myanmar; largely unknown outside South Asia until the supplement trade of the 2000s.',
    lore:
      'Giloy grown on a neem tree is held to be the most potent, on the reasoning that the climber takes up the host’s bitterness — a piece of traditional theory that modern chemistry does not support.',
  },

  shatavari: {
    origin:
      'Native to the forest edges and scrub of India, Sri Lanka and the Himalayan foothills, and now mostly gathered from the wild rather than grown.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita and Sushruta Samhita',
      detail:
        'Given as the principal drug for women, for milk production and for the drying that follows illness and age.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The queen of herbs',
        detail:
          'The classical texts name shatavari the chief drug for the female reproductive system and a first-rank rasayana.',
        kind: 'text',
        source: 'Charaka Samhita, Sutrasthana',
      },
      {
        when: 'c. 7th century CE',
        sortYear: 650,
        title: 'Fixed as a galactagogue',
        detail:
          'Vagbhata sets out shatavari with milk for nursing mothers, a use that has continued unbroken into present-day practice.',
        kind: 'text',
        source: 'Ashtanga Hridayam',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Shatavari kalpa recorded',
        detail:
          'The medieval texts standardise the sweetened root powder still sold under that name in Maharashtra and Gujarat.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '1960s–1980s',
        sortYear: 1975,
        title: 'Shatavarins isolated',
        detail:
          'The steroidal saponins responsible for much of the root’s activity were characterised in Indian laboratories.',
        kind: 'science',
        source: 'Indian phytochemical literature on Asparagus racemosus',
      },
      {
        when: '2000s–present',
        sortYear: 2010,
        title: 'Pressure on wild stock',
        detail:
          'Because the whole tuberous root system is dug up, demand has outrun regeneration; Indian state assessments list it as threatened in several states and it is a priority species for cultivation.',
        kind: 'policy',
        source: 'National Medicinal Plants Board and state red lists',
      },
    ],
    etymology:
      'Sanskrit shatavari, "she who has a hundred roots", read also as "she who has a hundred husbands" — a joke about its reputation in women’s medicine.',
    spread:
      'Used throughout South Asia and into Nepal and Sri Lanka; entered the international supplement trade late, in the 1990s.',
    lore:
      'Given to women at every stage — before conception, in nursing, and at menopause — which is why it is spoken of as the female counterpart to ashwagandha.',
  },

  mint: {
    origin:
      'The mints are Old World plants of Europe and West Asia; the Indian medicinal and commercial crop is largely Mentha arvensis brought from Japan in the twentieth century.',
    originEra: 'Colonial era',
    firstRecord: {
      when: 'c. 1400–1200 BCE',
      sortYear: -1300,
      source: 'Linear B tablets, Pylos',
      detail:
        'Mint appears in Mycenaean Greek palace records, the oldest written notice of the plant.',
    },
    timeline: [
      {
        when: 'c. 1400–1200 BCE',
        sortYear: -1300,
        title: 'Recorded in Mycenaean Greece',
        detail:
          'Mint is listed in palace inventories at Pylos, and the Greeks later told of the nymph Minthe crushed underfoot and turned into the herb.',
        kind: 'archaeology',
        source: 'Linear B tablets',
      },
      {
        when: 'c. 50–70 CE',
        sortYear: 60,
        title: 'Set down by Dioscorides',
        detail:
          'The Greek pharmacopoeia gives mint for the stomach, for headache and to settle nausea — the uses that carried into Unani medicine.',
        kind: 'text',
        source: 'De Materia Medica',
      },
      {
        when: 'c. 1200–1600 CE',
        sortYear: 1400,
        title: 'Enters India through Unani practice',
        detail:
          'Mint arrives in Indian medicine largely through Greco-Arabic Unani medicine, under the name pudina, rather than through the Sanskrit tradition.',
        kind: 'trade',
        source: 'Unani materia medica in India',
      },
      {
        when: '1771',
        sortYear: 1771,
        title: 'Peppermint distinguished',
        detail:
          'Linnaeus described Mentha piperita as a species, though it is a hybrid; the confusion between mint species has dogged the trade ever since.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '1960s–present',
        sortYear: 1975,
        title: 'India becomes the world’s menthol supplier',
        detail:
          'Japanese mint was introduced into the Terai and western Uttar Pradesh and the crop expanded until India produced the majority of the world’s natural menthol.',
        kind: 'trade',
        source: 'CIMAP and Indian essential-oil trade data',
      },
    ],
    etymology:
      'Greek minthe, from the nymph of the myth, through Latin mentha. Hindi pudina comes through Persian from Arabic.',
    spread:
      'Carried everywhere by Greek, Roman and Arab medicine; the Indian crop came the other way, from Japan through agricultural research stations in the 1960s.',
    lore:
      'The green chutney of the subcontinent is a medicinal preparation in disguise — mint eaten with heavy food, exactly as Unani practice prescribes it.',
  },

  lemongrass: {
    origin:
      'Native to South and South-East Asia; the oil-bearing East Indian type is a Kerala and Tamil Nadu plant with a distinct commercial history.',
    originEra: 'Colonial era',
    firstRecord: {
      when: 'c. 300 BCE – 300 CE',
      sortYear: 100,
      source: 'Sangam Tamil literature',
      detail:
        'Aromatic grasses used in cooling drinks and fumigation appear in early Tamil poetry, though which species is meant is not always clear.',
    },
    timeline: [
      {
        when: 'c. 300 BCE – 300 CE',
        sortYear: 100,
        title: 'Aromatic grasses in Tamil verse',
        detail:
          'Early Tamil literature refers to fragrant grasses in cooling infusions and room fumigation, the same domestic uses that survive today.',
        kind: 'text',
        source: 'Sangam corpus',
      },
      {
        when: 'c. 1000–1600 CE',
        sortYear: 1300,
        title: 'Named in the medical lexicons',
        detail:
          'Ayurvedic and Siddha lexicons record bhustrina for fever, indigestion and cough, given as a hot infusion.',
        kind: 'text',
        source: 'Ayurvedic nighantu and Siddha materia medica',
      },
      {
        when: '1793',
        sortYear: 1793,
        title: 'First oil shipments from Kerala',
        detail:
          'Distilled lemongrass oil began to be exported from the Malabar coast to Europe, where it was sold as oil of verbena or Indian melissa oil.',
        kind: 'trade',
        source: 'East India Company trade records',
      },
      {
        when: '1888',
        sortYear: 1888,
        title: 'Citral identified',
        detail:
          'The aldehyde that gives the oil its lemon note was characterised, and lemongrass became the industrial source of citral for perfumery and vitamin A synthesis.',
        kind: 'science',
        source: 'European essential-oil chemistry',
      },
      {
        when: '1950s–present',
        sortYear: 1970,
        title: 'Cochin oil and its decline',
        detail:
          'Kerala dominated world lemongrass oil until synthetic citral and Guatemalan competition took the market; Indian production shifted toward Cymbopogon flexuosus for perfumery.',
        kind: 'trade',
        source: 'Indian essential-oil industry statistics',
      },
    ],
    etymology:
      'Sanskrit bhustrina, "earth grass". Cymbopogon is Greek for "boat beard", from the shape of the flower spikes.',
    spread:
      'Taken from India to the Caribbean, Africa and Central America as a plantation oil crop in the nineteenth and twentieth centuries; Guatemala eventually outproduced Kerala.',
    lore:
      'The grass planted along Kerala house boundaries as much for the smell as for the tea, and burnt at doorways to keep mosquitoes off.',
  },

  fenugreek: {
    origin:
      'Domesticated in the Near East and carried into India early; India now grows most of the world’s crop, in Rajasthan and Gujarat.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 4000 BCE',
      sortYear: -4000,
      source: 'Charred seeds from Tell Halal, Iraq',
      detail:
        'Carbonised fenugreek seeds from Neolithic Iraq are among the oldest plant food remains identified anywhere.',
    },
    timeline: [
      {
        when: 'c. 4000 BCE',
        sortYear: -4000,
        title: 'Charred seeds in Neolithic Iraq',
        detail:
          'Excavated seed finds put fenugreek among the earliest cultivated plants of the Fertile Crescent.',
        kind: 'archaeology',
        source: 'Tell Halal excavation reports',
      },
      {
        when: 'c. 1550 BCE',
        sortYear: -1550,
        title: 'In Egyptian medicine',
        detail:
          'Egyptian papyri record fenugreek in preparations for burns and for inducing labour; seeds have been found in tombs.',
        kind: 'text',
        source: 'Ebers Papyrus',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Methika in the Indian canon',
        detail:
          'The classical texts give the seed for fever, digestion and the post-partum period, and the leaf as a vegetable.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: '1930s–1950s',
        sortYear: 1945,
        title: 'Diosgenin and the steroid industry',
        detail:
          'Fenugreek was found to contain diosgenin, one of the plant sapogenins that the mid-century steroid and contraceptive industry was built on.',
        kind: 'science',
        source: 'Steroid chemistry literature',
      },
      {
        when: '1990s–present',
        sortYear: 2005,
        title: 'Trials in diabetes',
        detail:
          'Indian trials reported lower fasting glucose on soaked seed powder, consistent with the traditional use; the fibre content probably matters as much as any alkaloid.',
        kind: 'science',
        source: 'Indian clinical nutrition studies',
      },
    ],
    etymology:
      'Latin foenum graecum, "Greek hay", from its use as fodder. Sanskrit methika gives Hindi methi.',
    spread:
      'Moved from the Fertile Crescent to Egypt, Greece and Rome, and eastward into India, where it settled so thoroughly that Rajasthan now supplies most of the world market.',
    lore:
      'Eaten by new mothers across northern India as methi laddoo through the winter after childbirth — a domestic use that predates and outlasts any prescription.',
  },

  sarpagandha: {
    origin:
      'Native to the moist deciduous forest floors of the Indian subcontinent and South-East Asia, now scarce in the wild through over-collection.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Named sarpagandha and used for snakebite, insomnia and insanity — the last of which turned out to be the important one.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The madness drug',
        detail:
          'The classical texts prescribe the root for insanity and for sleeplessness, and it was long known in villages as pagal-ki-dawa, the madman’s medicine.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: '1755',
        sortYear: 1755,
        title: 'Named for a European botanist',
        detail:
          'Linnaeus named the genus Rauvolfia after the sixteenth-century German traveller Leonhard Rauwolf; the species epithet serpentina records the snakebite use.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '1931',
        sortYear: 1931,
        title: 'Sen and Bose publish',
        detail:
          'Two Calcutta physicians reported that the root lowered blood pressure and calmed agitated patients — the paper that pulled an Indian folk drug into world medicine.',
        kind: 'science',
        source: 'Sen and Bose, Indian Medical World',
      },
      {
        when: '1952',
        sortYear: 1952,
        title: 'Reserpine isolated',
        detail:
          'Chemists at Ciba in Basel isolated reserpine from the root. It became the first effective antihypertensive and one of the first antipsychotics, and its action on monoamines helped found biological psychiatry.',
        kind: 'science',
        source: 'Müller, Schlittler and Bein, Ciba Laboratories',
      },
      {
        when: '1990',
        sortYear: 1990,
        title: 'Listed under CITES',
        detail:
          'Wild collection for the global reserpine trade had stripped Indian forests, and the species was placed on CITES Appendix II to control export.',
        kind: 'policy',
        source: 'CITES Appendix II listing',
      },
    ],
    etymology:
      'Sanskrit sarpagandha, "snake smell", from the belief that the root repelled snakes and treated their bite.',
    spread:
      'Known across South and South-East Asia in local medicine; after 1952 it went worldwide as a pharmaceutical raw material, which is what emptied the forests.',
    lore:
      'Gandhi is often said to have taken it as a tranquilliser. It is the clearest Indian case of a village remedy becoming a landmark drug and paying for it in wild populations.',
  },

  arjuna: {
    origin:
      'A riverbank tree of the Indian subcontinent, characteristically found along watercourses across the peninsula and the Gangetic plain.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita and Sushruta Samhita',
      detail:
        'The bark appears for wounds, fractures and bleeding before it is ever named for the heart.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Bark for wounds and bleeding',
        detail:
          'The earliest medical use is external and haemostatic; the cardiac reputation comes later.',
        kind: 'text',
        source: 'Sushruta Samhita',
      },
      {
        when: 'c. 10th–11th century CE',
        sortYear: 1050,
        title: 'Named for the heart',
        detail:
          'Chakradatta prescribes arjuna bark with milk for hridroga, disease of the heart — the first clear cardiac indication, and still the standard preparation.',
        kind: 'text',
        source: 'Chakradatta',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Fixed as a cardiac drug',
        detail:
          'Medieval materia medica settle arjuna as the cardiac tonic of the Ayurvedic pharmacopoeia, taken as bark decoction in milk.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '1980s–2000s',
        sortYear: 1995,
        title: 'Trials in angina and heart failure',
        detail:
          'Indian cardiology groups ran controlled studies of bark extract in stable angina and left ventricular dysfunction, reporting improvement in symptoms and ejection fraction in small samples.',
        kind: 'science',
        source: 'Indian Heart Journal and related clinical studies',
      },
      {
        when: '2000s–present',
        sortYear: 2010,
        title: 'Bark harvest under management',
        detail:
          'Because bark can be stripped without felling if done in rotation, state forest departments issue harvesting protocols — one of the few Indian medicinal barks with a sustainable-collection standard.',
        kind: 'policy',
        source: 'State forest department harvesting guidelines',
      },
    ],
    etymology:
      'Named for Arjuna of the Mahabharata, and from a root meaning white or shining — the trunk sheds its bark in pale sheets.',
    spread:
      'Largely a South Asian drug; it entered the international supplement trade only recently, as a cardiac tonic sold alongside hawthorn.',
    lore:
      'Planted at temples and along rivers, and associated with strength and endurance. The tree is one of the few in the canon whose classical indication and modern research point the same way.',
  },

  vasaka: {
    origin:
      'A shrub of the plains and lower hills of the Indian subcontinent, so common on wasteland and hedgerows that it is rarely cultivated.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Sushruta Samhita and Charaka Samhita',
      detail:
        'Given for cough, asthma and the spitting of blood, with the striking line that no patient of haemoptysis need despair while vasa exists.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The drug for coughing blood',
        detail:
          'The classical texts single out vasa for haemoptysis and for stubborn cough, and the claim made for it is unusually confident.',
        kind: 'text',
        source: 'Sushruta Samhita',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Vasavaleha standardised',
        detail:
          'The medieval texts fix the leaf-and-honey electuary that is still sold as the household cough preparation.',
        kind: 'text',
        source: 'Bhavaprakasha and Sharangadhara Samhita',
      },
      {
        when: '1888',
        sortYear: 1888,
        title: 'Vasicine isolated',
        detail:
          'Hooper separated the quinazoline alkaloid vasicine from the leaf, one of the earliest alkaloids taken from an Indian medicinal plant.',
        kind: 'science',
        source: 'Hooper, Indian chemical literature',
      },
      {
        when: '1960s',
        sortYear: 1963,
        title: 'Bromhexine developed from it',
        detail:
          'German pharmaceutical chemists modified vasicine into bromhexine, and then ambroxol — mucolytics still sold worldwide in cough syrups.',
        kind: 'science',
        source: 'Boehringer Ingelheim pharmaceutical development',
      },
      {
        when: '1970s–present',
        sortYear: 1985,
        title: 'Confirmed as a bronchodilator',
        detail:
          'Pharmacological work established vasicine and vasicinone as bronchodilatory and expectorant, which is a rare direct vindication of a classical indication.',
        kind: 'science',
        source: 'Indian pharmacology literature on Adhatoda',
      },
    ],
    etymology:
      'Sanskrit vasa or vasaka; the botanical Adhatoda comes from Tamil adhathodai, said to mean that goats will not touch it.',
    spread:
      'Native across South Asia and used in Sri Lankan and Nepali medicine; its real journey outward was chemical, through bromhexine into world pharmacy.',
    lore:
      'Called the lion among cough drugs. The leaf is also used to ripen fruit and to protect stored grain, which is why the shrub is left standing at field edges.',
  },

  kalmegh: {
    origin:
      'Native to India and Sri Lanka, growing as a weed of open ground; now cultivated across the peninsula for the pharmaceutical trade.',
    originEra: 'Medieval Nighantu',
    firstRecord: {
      when: 'c. 1200–1600 CE',
      sortYear: 1400,
      source: 'Ayurvedic nighantu literature and Siddha texts',
      detail:
        'Kalmegh enters the written record late for so common a plant, appearing in the medieval lexicons as bhunimba, the neem of the ground.',
    },
    timeline: [
      {
        when: 'c. 1200–1600 CE',
        sortYear: 1400,
        title: 'Named the neem of the ground',
        detail:
          'The medieval lexicons give bhunimba for fever, liver disorders and worms, treating it as a herbaceous stand-in for neem.',
        kind: 'text',
        source: 'Ayurvedic nighantu literature',
      },
      {
        when: 'c. 1600–1800',
        sortYear: 1700,
        title: 'Central to Siddha fever practice',
        detail:
          'Tamil Siddha medicine builds the compound nilavembu kudineer around the plant for fever, a formulation Tamil Nadu still distributes during dengue outbreaks.',
        kind: 'text',
        source: 'Siddha materia medica',
      },
      {
        when: '1918–1920',
        sortYear: 1919,
        title: 'Used in the influenza pandemic',
        detail:
          'Indian practitioners are widely reported to have used kalmegh during the 1918 influenza pandemic; the claim is repeated often but the contemporary documentation is thin.',
        kind: 'science',
        source: 'Later Indian pharmacognosy accounts',
      },
      {
        when: '1990s–2000s',
        sortYear: 2000,
        title: 'Scandinavian trials for colds',
        detail:
          'Randomised trials in Sweden and Chile found standardised andrographis extract shortened upper respiratory infection symptoms — some of the better evidence behind any Indian herb.',
        kind: 'science',
        source: 'Scandinavian randomised controlled trials',
      },
      {
        when: '2020–2021',
        sortYear: 2020,
        title: 'Tested against COVID-19',
        detail:
          'Thailand and India ran trials of andrographolide preparations in mild COVID-19, with mixed results and later safety cautions in Thailand.',
        kind: 'policy',
        source: 'Thai Ministry of Public Health and Indian CCRAS trials',
      },
    ],
    etymology:
      'Bengali kalmegh, "dark cloud", for the colour of the plant. Sanskrit bhunimba, "neem of the earth", for its bitterness; Tamil nilavembu says the same thing.',
    spread:
      'Carried into Chinese medicine as chuan xin lian and into Scandinavian herbal practice through twentieth-century trials — one of the few Indian herbs with a genuine northern European following.',
    lore:
      'Reputed to be the bitterest plant in common Indian use, which is the point: it is given precisely because nothing that bitter is taken casually.',
  },

  bael: {
    origin:
      'Native to the dry forests of the Indian subcontinent, and among the trees most closely tied to temple ground, so its range reflects planting as much as ecology.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1200–800 BCE',
      sortYear: -1000,
      source: 'Yajurveda',
      detail:
        'The bilva tree is named in Vedic ritual literature, where its trifoliate leaf is already an offering.',
    },
    timeline: [
      {
        when: 'c. 1200–800 BCE',
        sortYear: -1000,
        title: 'The bilva in Vedic ritual',
        detail:
          'The tree appears in Vedic texts as a ritual plant; the three-lobed leaf is read as the three eyes, or the three aspects, of Shiva.',
        kind: 'ritual',
        source: 'Yajurveda and later ritual manuals',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The gut specialist',
        detail:
          'The classical texts separate the two states carefully: unripe fruit binding, for chronic diarrhoea and dysentery; ripe pulp cooling and laxative.',
        kind: 'text',
        source: 'Charaka Samhita and Sushruta Samhita',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Bilva preparations fixed',
        detail:
          'Medieval texts standardise bilvadi churna and the dried unripe-fruit slices that are still the standard Ayurvedic antidiarrhoeal.',
        kind: 'text',
        source: 'Bhavaprakasha Nighantu',
      },
      {
        when: '1918–1930s',
        sortYear: 1925,
        title: 'Studied for dysentery',
        detail:
          'Colonial-era Indian medical services investigated bael for bacillary and amoebic dysentery and reported it useful in chronic cases, which put it into British Indian pharmacopoeial lists.',
        kind: 'science',
        source: 'Indian Medical Gazette and colonial pharmacopoeias',
      },
      {
        when: '1990s–present',
        sortYear: 2005,
        title: 'The mucilage explained',
        detail:
          'Work on the fruit’s pectin and mucilage supports the traditional split — the unripe fruit’s tannins bind, the ripe fruit’s mucilage soothes and moves.',
        kind: 'science',
        source: 'Indian food and pharmacognosy research',
      },
    ],
    etymology:
      'Sanskrit bilva, of uncertain derivation, giving Hindi bel or bael. Aegle is from the Greek nymph Aigle, one of the Hesperides.',
    spread:
      'Carried with Hindu and Buddhist settlement into Sri Lanka, Myanmar, Thailand and Java, where it entered local medicine and temple planting alike.',
    lore:
      'The leaf is offered to Shiva every day across India, and no bael tree on temple ground is cut. The fruit’s shell is hard enough that it was used as a small container.',
  },

  mulethi: {
    origin:
      'Native to West Asia, the Mediterranean and Central Asia. India has always been a consumer rather than a producer — the root came down the trade routes from Afghanistan and Iran.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 2500 BCE',
      sortYear: -2500,
      source: 'Assyrian clay tablets and Egyptian tomb finds',
      detail:
        'Liquorice root is listed on Mesopotamian medical tablets and was buried in quantity with Tutankhamun.',
    },
    timeline: [
      {
        when: 'c. 2500 BCE',
        sortYear: -2500,
        title: 'On Assyrian tablets',
        detail:
          'Mesopotamian medical texts list liquorice among their drugs, making it one of the oldest continuously used medicines on record.',
        kind: 'text',
        source: 'Assyrian medical tablets',
      },
      {
        when: 'c. 1325 BCE',
        sortYear: -1325,
        title: 'Buried with Tutankhamun',
        detail:
          'Bundles of liquorice root were placed in the tomb, presumably for a sweet drink in the afterlife.',
        kind: 'archaeology',
        source: 'Tutankhamun tomb inventory',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Yashtimadhu in the Indian canon',
        detail:
          'The classical texts give the sweet stick for cough, ulcers, eyes and voice, and class it as one of the great rejuvenating drugs.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: 'c. 1000–1800 CE',
        sortYear: 1400,
        title: 'The overland root trade',
        detail:
          'Liquorice reached Indian markets as dried root along the Khyber and Bolan routes from Afghanistan and Persia, and the supply chain has not fundamentally changed.',
        kind: 'trade',
        source: 'Central Asian caravan trade records',
      },
      {
        when: '1946–1970s',
        sortYear: 1950,
        title: 'Ulcers, and then a warning',
        detail:
          'Dutch and British work showed liquorice healed peptic ulcers, and carbenoxolone was developed from it; the same research established that heavy use raises blood pressure and depletes potassium.',
        kind: 'science',
        source: 'European clinical pharmacology literature',
      },
    ],
    etymology:
      'Sanskrit yashtimadhu, "sweet stick". Glycyrrhiza is the same idea in Greek, glykys rhiza, from which liquorice descends through Latin.',
    spread:
      'Moved from Mesopotamia into Greek, Roman, Arab, Chinese and Indian medicine — one of very few drugs shared by every classical system.',
    lore:
      'Chewed as a stick by singers and speakers for the voice, and used in Ayurveda as the softening agent that makes a harsh formula tolerable.',
  },

  sandalwood: {
    origin:
      'A hemiparasitic tree of peninsular India and Indonesia; the Mysore plateau produced the oil that set the world standard.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 900–500 BCE',
      sortYear: -700,
      source: 'Vedic and early Buddhist literature',
      detail:
        'Chandana appears as an incense and a cooling paste before it is described as a medicine.',
    },
    timeline: [
      {
        when: 'c. 900–500 BCE',
        sortYear: -700,
        title: 'Chandana as incense and paste',
        detail:
          'Early Indian literature treats sandal as ritual and cosmetic first — burnt as incense, ground into a cooling paste for the body.',
        kind: 'ritual',
        source: 'Vedic and early Buddhist texts',
      },
      {
        when: 'c. 300 BCE – 300 CE',
        sortYear: 100,
        title: 'A trade good of the Tamil ports',
        detail:
          'Sangam poetry and Roman trade accounts record sandalwood leaving the Malabar and Coromandel coasts for the west.',
        kind: 'trade',
        source: 'Sangam corpus and the Periplus of the Erythraean Sea',
      },
      {
        when: '1792',
        sortYear: 1792,
        title: 'Declared a royal tree',
        detail:
          'Tipu Sultan declared sandalwood a royal tree of Mysore, taking the trade into state hands. The British and later the Karnataka government kept the monopoly, so for two centuries a sandal tree on private land still belonged to the state.',
        kind: 'policy',
        source: 'Mysore state proclamation, later Karnataka Forest Act',
      },
      {
        when: '1916',
        sortYear: 1916,
        title: 'The Mysore distilleries open',
        detail:
          'With European oil markets closed by the war, Mysore built its own distilleries at Bangalore and Mysore, and Mysore sandalwood oil became the benchmark grade.',
        kind: 'trade',
        source: 'Government Sandalwood Oil Factory, Mysore',
      },
      {
        when: '1990s–2000s',
        sortYear: 2001,
        title: 'Smuggling, scarcity and reform',
        detail:
          'Decades of illegal felling — the sandalwood brigand Veeerappan being only the most notorious case — emptied the forests. Karnataka finally relaxed the state monopoly so farmers could own and sell their own trees, and the species is now listed as Vulnerable.',
        kind: 'policy',
        source: 'Karnataka Forest Act amendments and IUCN assessment',
      },
    ],
    etymology:
      'Sanskrit chandana, from a root meaning to shine or gladden; the English word comes through Greek and Arabic from the same source. Santalum is the Latinised form.',
    spread:
      'Exported west to Rome and Arabia and east to China, where it became central to temple incense; Indonesian and Australian species were later planted to relieve pressure on the Indian tree.',
    lore:
      'Ground on a stone with water and applied to the forehead in temples, burnt at funerals, and carved into images. The scarcity of the tree is a direct consequence of how thoroughly it was loved.',
  },

  henna: {
    origin:
      'Native to North Africa, West Asia and possibly north-west India; the Indian crop is concentrated almost entirely around Sojat in Rajasthan.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 3400 BCE',
      sortYear: -3400,
      source: 'Predynastic Egyptian burials',
      detail:
        'Henna-stained hair and nails have been found on Egyptian mummies, the earliest physical evidence of the dye in use.',
    },
    timeline: [
      {
        when: 'c. 3400 BCE',
        sortYear: -3400,
        title: 'On Egyptian mummies',
        detail:
          'Stained hair and fingernails in predynastic and later Egyptian burials show henna in cosmetic use before writing recorded it.',
        kind: 'archaeology',
        source: 'Egyptian burial analyses',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Recorded in Indian medicine',
        detail:
          'The classical texts give the leaf for headache, burning of the skin and jaundice, applied as a cooling paste rather than taken internally.',
        kind: 'text',
        source: 'Charaka Samhita and later Ayurvedic lexicons',
      },
      {
        when: 'c. 1200–1700 CE',
        sortYear: 1500,
        title: 'Mehndi becomes ceremonial',
        detail:
          'The elaborate patterned application that Indians now call mehndi took its present form under Persian and Mughal influence, and became a fixed part of the wedding sequence.',
        kind: 'ritual',
        source: 'Mughal-era court and domestic accounts',
      },
      {
        when: '1709',
        sortYear: 1709,
        title: 'Lawsonia named',
        detail:
          'The genus was named for the Scottish physician and naturalist Isaac Lawson; the dye molecule lawsone carries the same name.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '1980s–present',
        sortYear: 1995,
        title: 'Sojat, and the black henna warning',
        detail:
          'Sojat in Rajasthan came to supply most of the world’s henna. In the same decades, so-called black henna adulterated with para-phenylenediamine caused serious skin reactions, and health agencies now warn against it specifically.',
        kind: 'policy',
        source: 'Indian export data and dermatology safety advisories',
      },
    ],
    etymology:
      'Arabic hinna, borrowed into Hindi as henna and mehndi from Sanskrit mendhika.',
    spread:
      'Moved with Islam across North Africa, West Asia and into India; the Indian ceremonial use then travelled back out with the South Asian diaspora.',
    lore:
      'The night before a wedding belongs to henna across much of India and Pakistan, and the depth of the stain is read, half-jokingly, as a measure of the marriage.',
  },

  bhringraj: {
    origin:
      'A creeping herb of wet ground across India and much of the warm world, growing readily in paddy margins and ditches.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Named for the liver and for the hair — the two uses that have stayed with it.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Named in the canon',
        detail:
          'The classical texts give bhringaraja for liver disease and jaundice, and as a rasayana for hair and skin.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: 'c. 700–1200 CE',
        sortYear: 1000,
        title: 'Called the king of hair',
        detail:
          'Later lexicons name it kesharaja, king of the hair, and describe the black oil made by boiling the juice in sesame oil.',
        kind: 'text',
        source: 'Ayurvedic nighantu literature',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'Bhringraj taila standardised',
        detail:
          'The medieval texts fix the hair oil recipe still made in every South Indian household and sold by every Ayurvedic company.',
        kind: 'text',
        source: 'Bhavaprakasha and Sahasrayogam',
      },
      {
        when: '1970s–1990s',
        sortYear: 1985,
        title: 'Wedelolactone characterised',
        detail:
          'Indian and Japanese groups isolated the coumestans wedelolactone and demethylwedelolactone, and showed they protect liver cells and neutralise some snake venom enzymes.',
        kind: 'science',
        source: 'Phytochemistry and toxicology literature on Eclipta',
      },
      {
        when: '2000s–present',
        sortYear: 2008,
        title: 'Hair-growth studies',
        detail:
          'Animal studies reported faster hair regrowth with leaf extract than with minoxidil controls. There are no good human trials, so the traditional claim remains untested where it matters.',
        kind: 'science',
        source: 'Indian pharmacology studies on Eclipta alba',
      },
    ],
    etymology:
      'Sanskrit bhringaraja, "king of the bees", for the bees drawn to its flowers. Eclipta prostrata and Eclipta alba are the same plant under two names.',
    spread:
      'Pantropical by nature, so it grew where it was needed; the Indian hair-oil tradition carried its reputation into South-East Asia and, recently, the global cosmetics trade.',
    lore:
      'The plant that turns hair black — and, in the older texts, one of the drugs said to hold off ageing itself. Village practice also used it against snakebite, which the venom research partly explains.',
  },

  mandukaparni: {
    origin:
      'A creeping wetland herb found across India, Sri Lanka, South-East Asia, southern Africa and Australia, which is why so many traditions claim it.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita',
      detail:
        'Listed among the medhya rasayana drugs for the mind, alongside brahmi.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'One of the four drugs for the mind',
        detail:
          'Charaka names mandukaparni in the small group of medhya rasayana, given for memory, speech and intellect.',
        kind: 'text',
        source: 'Charaka Samhita, Chikitsasthana',
      },
      {
        when: 'c. 500–1500 CE',
        sortYear: 1000,
        title: 'Taken up across Asia',
        detail:
          'The same plant enters Chinese, Sinhalese and Indonesian medicine independently, generally for wounds, skin and long life.',
        kind: 'text',
        source: 'Chinese and Sinhalese materia medica',
      },
      {
        when: 'c. 1600–1900',
        sortYear: 1750,
        title: 'The brahmi name confusion',
        detail:
          'In much of North India this plant is sold as brahmi, while South India reserves that name for Bacopa. Both are medhya drugs, but they are unrelated species with different chemistry.',
        kind: 'text',
        source: 'Regional Ayurvedic practice and later pharmacognosy surveys',
      },
      {
        when: '1941',
        sortYear: 1941,
        title: 'Asiaticoside isolated',
        detail:
          'French chemists separated asiaticoside from the leaf, the triterpene behind the plant’s effect on wound healing and connective tissue.',
        kind: 'science',
        source: 'Bontems, French phytochemical work',
      },
      {
        when: '1950s–present',
        sortYear: 1960,
        title: 'Into European wound care',
        detail:
          'Centella extracts entered French and Italian pharmacy for burns, scars and venous insufficiency, and remain licensed medicines there — an Ayurvedic drug that became a European one.',
        kind: 'trade',
        source: 'European pharmaceutical registers',
      },
    ],
    etymology:
      'Sanskrit mandukaparni, "frog-leaf", for the round leaves scattered on wet ground where frogs sit. Gotu kola is the Sinhala name it travelled under.',
    spread:
      'Already pantropical, so the plant needed no help; what travelled was the use — into Chinese and South-East Asian medicine, and into European pharmacy in the twentieth century.',
    lore:
      'Sri Lankan tradition holds that elephants, long-lived animals, eat it — the reasoning behind its reputation for longevity. Students are given a few leaves before study, as with brahmi.',
  },

  guggulu: {
    origin:
      'A thorny desert shrub of the arid tracts of Rajasthan, Gujarat and Sindh, extending into Pakistan and the Arabian peninsula.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1000–800 BCE',
      sortYear: -900,
      source: 'Atharvaveda',
      detail:
        'Guggulu is named as a fumigant that drives off disease and evil, its earliest recorded role.',
    },
    timeline: [
      {
        when: 'c. 1000–800 BCE',
        sortYear: -900,
        title: 'Burnt as a fumigant',
        detail:
          'The Atharvaveda names guggulu as an incense used against disease — the resin was a purifier before it was a drug.',
        kind: 'ritual',
        source: 'Atharvaveda',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Prescribed for medoroga',
        detail:
          'Sushruta describes the resin for medoroga — the disorder of fat, corresponding closely to what would now be called obesity with high lipids — and for stiff joints.',
        kind: 'text',
        source: 'Sushruta Samhita',
      },
      {
        when: 'c. 1600 CE',
        sortYear: 1600,
        title: 'The guggulu formulas fixed',
        detail:
          'Medieval texts standardise yogaraja guggulu, kaishore guggulu and the rest — compound resin preparations still among the most prescribed Ayurvedic medicines.',
        kind: 'text',
        source: 'Sharangadhara Samhita and Bhavaprakasha',
      },
      {
        when: '1966',
        sortYear: 1966,
        title: 'Satyavati reads Sushruta and tests it',
        detail:
          'G. V. Satyavati took the medoroga passage as a hypothesis and showed in her doctoral work that guggulu lowered cholesterol — a rare case of a classical text used as a research lead.',
        kind: 'science',
        source: 'Doctoral research, Banaras Hindu University',
      },
      {
        when: '1986–2011',
        sortYear: 2000,
        title: 'Gugulipid, and a shrub in trouble',
        detail:
          'India’s CDRI developed the standardised drug gugulipid from that work. Demand plus destructive tapping pushed the wild shrub onto the IUCN threatened list, and the tree is now a conservation priority in Gujarat and Rajasthan.',
        kind: 'policy',
        source: 'CDRI drug development and IUCN Red List assessment',
      },
    ],
    etymology:
      'Sanskrit guggulu, of uncertain origin, related to the word for the resin itself; the botanical Commiphora means gum-bearing.',
    spread:
      'The resin was traded around the Arabian Sea alongside myrrh and frankincense, all three being Commiphora and Boswellia gums from the same dry belt.',
    lore:
      'One of the oldest continuously burnt incenses in India, and the plant most often cited when arguing that the classical texts can still generate testable medicine.',
  },

  punarnava: {
    origin:
      'A sprawling weed of roadsides and waste ground across India and much of the tropics, appearing with the first rains.',
    originEra: 'Classical Samhita',
    firstRecord: {
      when: 'c. 2nd century BCE – 2nd century CE',
      sortYear: -100,
      source: 'Charaka Samhita and Sushruta Samhita',
      detail:
        'Named punarnava, "renewed again", and given for swelling, water retention and disease of the kidneys.',
    },
    timeline: [
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The drug for swelling',
        detail:
          'The classical texts prescribe punarnava for shotha, oedema, and for ascites and kidney complaints — a diuretic in everything but the word.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: 'c. 700–1600 CE',
        sortYear: 1200,
        title: 'Punarnavadi kwatha standardised',
        detail:
          'The medieval texts fix the decoction still used in Ayurvedic practice for oedema, anaemia and liver disease.',
        kind: 'text',
        source: 'Sharangadhara Samhita and Bhavaprakasha',
      },
      {
        when: '1753',
        sortYear: 1753,
        title: 'Named for Boerhaave',
        detail:
          'Linnaeus named the genus for Herman Boerhaave, the Leiden physician — so an Indian roadside weed carries the name of the most famous European doctor of his century.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '1950s–1970s',
        sortYear: 1965,
        title: 'Punarnavine and the diuretic effect',
        detail:
          'Indian pharmacologists isolated the alkaloid punarnavine and confirmed diuretic activity in animals, supporting the classical indication.',
        kind: 'science',
        source: 'Indian Journal of Medical Research and related studies',
      },
      {
        when: '1990s–present',
        sortYear: 2005,
        title: 'Studied for the kidney',
        detail:
          'Later work reported protection against experimental kidney injury and effects on nephrotic syndrome in small studies; human evidence remains thin.',
        kind: 'science',
        source: 'Indian nephrology and pharmacology literature',
      },
    ],
    etymology:
      'Sanskrit punar-nava, "new again" — the plant dies back in the dry season and returns with the rains, and is said to do the same for the body.',
    spread:
      'Pantropical as a weed, and used in African and Caribbean folk medicine independently for much the same complaints, which is a useful piece of corroboration.',
    lore:
      'Eaten as a monsoon green in Maharashtra and Karnataka before it is ever taken as a medicine, on the reasoning that the season that swells the body also supplies its remedy.',
  },

  lotus: {
    origin:
      'Native across Asia from the Caspian to Japan, and in Indian water since before there was writing to record it.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1500–1000 BCE',
      sortYear: -1200,
      source: 'Rigveda and Harappan seal imagery',
      detail:
        'The lotus appears as an image before it appears as a drug — on Harappan seals, then as the Vedic emblem of birth and purity.',
    },
    timeline: [
      {
        when: 'c. 2600–1900 BCE',
        sortYear: -2200,
        title: 'On Harappan seals',
        detail:
          'Lotus motifs and a lotus-crowned figure appear in Indus valley imagery, the earliest sign of the flower’s standing in Indian culture.',
        kind: 'archaeology',
        source: 'Indus valley seal corpus',
      },
      {
        when: 'c. 1500–1000 BCE',
        sortYear: -1200,
        title: 'The Vedic emblem',
        detail:
          'Vedic hymns use the lotus for what is born of water and unstained by it, fixing an association that every later Indian religion inherited.',
        kind: 'ritual',
        source: 'Rigveda',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Every part taken into medicine',
        detail:
          'The classical texts give rhizome, seed, stamen and petal separately — cooling, astringent, and used for bleeding, burning and weakness.',
        kind: 'text',
        source: 'Charaka Samhita and Sushruta Samhita',
      },
      {
        when: '1950',
        sortYear: 1950,
        title: 'Made the national flower',
        detail:
          'Independent India took the lotus as its national flower, carrying a symbol thousands of years old into state iconography.',
        kind: 'policy',
        source: 'Government of India national symbols',
      },
      {
        when: '1997',
        sortYear: 1997,
        title: 'The lotus effect named',
        detail:
          'Botanists Barthlott and Neinhuis published the mechanism by which the leaf cleans itself, and self-cleaning surfaces have been engineered from it since.',
        kind: 'science',
        source: 'Barthlott and Neinhuis, Planta',
      },
    ],
    etymology:
      'Sanskrit padma and kamala, both old words for the flower; Nelumbo comes from the Sinhala nelumbu.',
    spread:
      'Carried across Asia with Buddhism, which took the lotus seat with it into Tibet, China, Korea and Japan; grown for food in China and Japan as much as for the flower.',
    lore:
      'The seat of Lakshmi, Brahma and the Buddha alike, and the standard Indian image for living in the world without being marked by it — rooted in mud, flowering clean.',
  },

  sadaphuli: {
    origin:
      'Native to Madagascar and nowhere else, though it now grows wild on waste ground across the Indian tropics.',
    originEra: 'Colonial era',
    firstRecord: {
      when: '1757',
      sortYear: 1757,
      source: 'Linnaeus, as Vinca rosea',
      detail:
        'Described by Linnaeus from cultivated material; it reached Indian gardens through the same colonial plant trade.',
    },
    timeline: [
      {
        when: '1757',
        sortYear: 1757,
        title: 'Named by Linnaeus',
        detail:
          'Described as Vinca rosea from plants already circulating in European hothouses, having left Madagascar with traders.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '18th–19th centuries',
        sortYear: 1800,
        title: 'Naturalised in India',
        detail:
          'Spread through gardens and then onto roadsides and coastal sand, becoming so common that it entered Indian folk practice as a local plant.',
        kind: 'trade',
        source: 'Colonial botanical surveys',
      },
      {
        when: '1950s',
        sortYear: 1955,
        title: 'Tested for the folk diabetes claim',
        detail:
          'Reports of the leaf being used for diabetes in Jamaica and the Philippines sent Canadian and American laboratories to the plant. It did not lower blood sugar in their animals — it destroyed white blood cells.',
        kind: 'science',
        source: 'Noble and Beer, University of Western Ontario',
      },
      {
        when: '1958–1963',
        sortYear: 1961,
        title: 'Vinblastine and vincristine isolated',
        detail:
          'That accidental finding produced two alkaloids that became frontline treatment for Hodgkin lymphoma and childhood leukaemia, turning near-certain deaths into survivable illnesses.',
        kind: 'science',
        source: 'Eli Lilly and University of Western Ontario research programmes',
      },
      {
        when: '1990s–present',
        sortYear: 1995,
        title: 'The benefit-sharing argument',
        detail:
          'Madagascar received nothing from drugs worth billions, and the case became one of the standard examples cited in the Convention on Biological Diversity debates on sharing the value of genetic resources.',
        kind: 'policy',
        source: 'Convention on Biological Diversity literature',
      },
    ],
    etymology:
      'Sanskrit Nityakalyani and Marathi Sadaphuli both mean the same thing — always in flower, always auspicious. Catharanthus is Greek for pure flower.',
    spread:
      'Left Madagascar with 18th-century traders, reached India, the Caribbean and South-East Asia as a garden plant, and escaped into the wild everywhere warm enough.',
    lore:
      'Grown at doorways for its unbroken flowering and offered at temples. That an ordinary garden flower turned out to hold two of medicine’s most important drugs is the argument for screening common plants, not only rare ones.',
  },

  pomegranate: {
    origin:
      'Domesticated in Iran and the Caucasus, and grown in the Indian north-west early enough that Sanskrit has its own word for it.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 3000 BCE',
      sortYear: -3000,
      source: 'Bronze Age remains from the Levant and Iran',
      detail:
        'Carbonised rind from early Bronze Age sites puts the fruit in cultivation well before it reaches India.',
    },
    timeline: [
      {
        when: 'c. 3000 BCE',
        sortYear: -3000,
        title: 'Cultivated in the Bronze Age west',
        detail:
          'Rind and seeds from sites in the Levant, Iran and later Egyptian tombs show the pomegranate as one of the first fruits taken into orchards.',
        kind: 'archaeology',
        source: 'Bronze Age excavation reports',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'Dadima in the Indian canon',
        detail:
          'The classical texts separate sweet from sour fruit and treat them as different drugs, and call dadima tridoshaghna — pacifying all three doshas, which almost nothing else is said to do.',
        kind: 'text',
        source: 'Charaka Samhita',
      },
      {
        when: 'c. 1000–1600 CE',
        sortYear: 1300,
        title: 'The compound powders fixed',
        detail:
          'Medieval texts standardise dadimashtaka churna, the eight-part pomegranate powder still dispensed for digestion and diarrhoea.',
        kind: 'text',
        source: 'Sharangadhara Samhita and Bhavaprakasha',
      },
      {
        when: '19th century',
        sortYear: 1850,
        title: 'Root bark in European pharmacy',
        detail:
          'Pelletierine from the root bark entered western pharmacopoeias as a taeniacide — an Indian and Persian use adopted wholesale.',
        kind: 'science',
        source: 'European pharmacopoeial literature',
      },
      {
        when: '2000s–present',
        sortYear: 2010,
        title: 'Juice trials, and India as first producer',
        detail:
          'Trials of the juice reported modest effects on blood pressure and lipid oxidation, while Maharashtra’s orchards made India the world’s largest producer.',
        kind: 'trade',
        source: 'Clinical nutrition literature and Indian horticultural statistics',
      },
    ],
    etymology:
      'Sanskrit dadima, of uncertain root; Hindi anar comes through Persian. Punica records the Roman name — the Carthaginian, or Phoenician, apple.',
    spread:
      'Moved from Iran west into the Mediterranean and east through Afghanistan into India, and was carried to Spain by the Moors and to the Americas by the Spanish.',
    lore:
      'A fertility symbol from Greece to China because of its many seeds, and one of the very few drugs Ayurveda considers safe for nearly everybody, in nearly every condition.',
  },

  babul: {
    origin:
      'Native across dry Africa, Arabia and the Indian subcontinent, and so at home on the Indian plains that it defines their look.',
    originEra: 'Indus & Vedic',
    firstRecord: {
      when: 'c. 1000–800 BCE',
      sortYear: -900,
      source: 'Atharvaveda',
      detail:
        'Babbula appears among the trees named in Vedic literature, chiefly for its wood and its astringency.',
    },
    timeline: [
      {
        when: 'c. 1000–800 BCE',
        sortYear: -900,
        title: 'Named in Vedic literature',
        detail: 'The thorn tree appears in Vedic texts as a source of hard timber and of astringent bark.',
        kind: 'text',
        source: 'Atharvaveda',
      },
      {
        when: 'c. 2nd century BCE – 2nd century CE',
        sortYear: -100,
        title: 'The bark and the twig',
        detail:
          'The classical texts give babul bark for loose gums, mouth ulcers, diarrhoea and bleeding, and the twig as a chewing stick — the datun most Indians still recognise.',
        kind: 'text',
        source: 'Sushruta Samhita',
      },
      {
        when: 'c. 1500 BCE onward',
        sortYear: -1500,
        title: 'The gum trade',
        detail:
          'Gum from Acacia species moved out of Africa and Arabia into Egypt and the Mediterranean, used in inks, dyes and medicines, and the Indian tree supplied the same gum locally.',
        kind: 'trade',
        source: 'Ancient Near Eastern trade records',
      },
      {
        when: '19th century',
        sortYear: 1870,
        title: 'Planted for tannin and fuel',
        detail:
          'Colonial forestry planted babul heavily across the dry plains for tanbark, fuel and railway sleepers, spreading it far beyond its earlier range.',
        kind: 'policy',
        source: 'Indian Forest Department records',
      },
      {
        when: '2005',
        sortYear: 2005,
        title: 'Renamed Vachellia',
        detail:
          'A contested reclassification split the old genus Acacia and moved this tree to Vachellia — which is why floras and pharmacopoeias now disagree about its name.',
        kind: 'science',
        source: 'International Botanical Congress decision on Acacia',
      },
    ],
    etymology:
      'Sanskrit babbula, giving Hindi babul; kikar is the Punjabi name. Nilotica records the Nile, where Europeans first described it.',
    spread:
      'Native from Africa to India, and planted well beyond that for tannin and fuel — successfully enough that it is now an invasive weed in Australia and parts of Africa.',
    lore:
      'The tree of hard country: a village toothbrush, a gum, a tannin and a fodder in one, and the shade of choice where nothing else will grow.',
  },

  hibiscus: {
    origin:
      'A cultigen with no wild population, most likely raised in southern China or the Pacific and grown in India for many centuries.',
    originEra: 'Medieval Nighantu',
    firstRecord: {
      when: 'c. 700–1200 CE',
      sortYear: 1000,
      source: 'Ayurvedic nighantu literature and temple practice',
      detail:
        'Japa enters the Indian record as a temple flower and a hair medicine rather than as a wild plant.',
    },
    timeline: [
      {
        when: 'c. 700–1200 CE',
        sortYear: 1000,
        title: 'Japa in the lexicons',
        detail:
          'Medieval Ayurvedic texts name japa for the hair, for the heart and for menstrual complaints, and describe the flower boiled in oil.',
        kind: 'text',
        source: 'Ayurvedic nighantu literature',
      },
      {
        when: 'c. 1000–1700 CE',
        sortYear: 1400,
        title: 'The offering to Kali',
        detail:
          'The red flower becomes fixed as the offering to Kali and to Ganesha, which is why it is planted at temples across the south and east.',
        kind: 'ritual',
        source: 'Tantric and temple ritual manuals',
      },
      {
        when: '1753',
        sortYear: 1753,
        title: 'Named rosa-sinensis',
        detail:
          'Linnaeus named it the rose of China, from material in European cultivation; no wild ancestor has ever been found.',
        kind: 'science',
        source: 'Linnaean botany',
      },
      {
        when: '19th century',
        sortYear: 1850,
        title: 'The shoe flower',
        detail:
          'Colonial households found the crushed petals blacked leather, and the English name shoe flower stuck in India even as the Ayurvedic use continued unbroken.',
        kind: 'trade',
        source: 'Colonial-era Indian glossaries',
      },
      {
        when: '1990s–present',
        sortYear: 2005,
        title: 'The hair claims tested',
        detail:
          'Indian studies of leaf and flower extracts reported faster hair regrowth in animals than minoxidil controls; human trials are still lacking, so the household use rests where it always did.',
        kind: 'science',
        source: 'Indian pharmacognosy studies on Hibiscus rosa-sinensis',
      },
    ],
    etymology:
      'Sanskrit japa, from the word for muttered prayer — the flower of repeated offering. Marathi jaswand and Hindi gudhal are unrelated local names.',
    spread:
      'Moved through the Pacific and Asia entirely by cultivation, since it sets little viable seed; carried onward by British and Dutch gardeners to every warm colony.',
    lore:
      'Offered to Kali, worn in the hair in Tamil Nadu and Kerala, and boiled into the coconut oil that is the country’s oldest continuing hair treatment.',
  },
}
