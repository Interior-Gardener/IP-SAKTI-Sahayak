import type { Tour } from '../types/plant'

/* Guided walks through the garden. Each stop flies the camera to a
 * plant and narrates why it belongs to the theme. */

export const tours: Tour[] = [
  {
    id: 'first-steps',
    title: 'First Steps in the Garden',
    theme: 'Foundations',
    subtitle: 'Five plants that explain everything else',
    blurb:
      'If you learn only five medicinal plants, learn these. Between them they cover the four Ayurvedic ideas you will meet again and again: rasayana, agni, doshic balance and the difference between a heating and a cooling herb.',
    minutes: 7,
    accent: '#4f9d5c',
    stops: [
      {
        plantId: 'tulsi',
        headline: 'Start at the threshold',
        narration:
          'Almost every Indian courtyard begins with tulsi. Notice the square stem — that single feature tells you it belongs to the mint family, and it is the first identification skill worth having. Tulsi is heating and drying, so it clears congestion; that is what ushna virya means in practice.',
      },
      {
        plantId: 'neem',
        headline: 'Meet the bitter',
        narration:
          'Neem is the reference point for tikta rasa, the bitter taste. In Ayurveda bitter is cooling, drying and cleansing — which is exactly how neem behaves on the skin and in the blood. Every part of this tree is used, from the twig you brush your teeth with to the oil pressed from its seed.',
      },
      {
        plantId: 'aloe-vera',
        headline: 'Two substances, one leaf',
        narration:
          'Cut an aloe leaf and you get two very different things: clear gel that soothes, and bitter yellow latex that purges. Confusing them is the commonest mistake in home herbalism. This is your first lesson in why the part used matters as much as the plant.',
      },
      {
        plantId: 'turmeric',
        headline: 'The rhizome that is also a ritual',
        narration:
          'Turmeric is the bridge between kitchen and clinic. The medicinal part grows underground — a rhizome, not a root. Its curcumin is famously hard to absorb, which is why the traditional pairing with black pepper and fat turns out to be sound pharmacology rather than coincidence.',
      },
      {
        plantId: 'ginger',
        headline: 'One plant, two medicines',
        narration:
          'Ayurveda treats fresh ginger and dried ginger as separate drugs, because drying converts gingerol into the sharper shogaol. Fresh for nausea, dried for deep cold and joint pain. That is a good final lesson: processing changes chemistry, and traditional systems knew it long before the mechanism did.',
      },
    ],
  },
  {
    id: 'digestive',
    title: 'The Digestive Path',
    theme: 'Digestive',
    subtitle: 'Agni, the fire that has to be tended',
    blurb:
      'Ayurveda treats digestion as the root of most disease. This walk runs through the herbs that kindle appetite, calm cramping, bind a loose gut and cool an over-hot one — and shows how the same plant can do opposite things depending on when you pick it.',
    minutes: 6,
    accent: '#d9a13c',
    stops: [
      {
        plantId: 'ginger',
        headline: 'Kindling agni',
        narration:
          'A slice of ginger with rock salt and lime before a meal is the classical appetiser. It is called deepana — literally, lighting the fire. Physiologically it raises saliva, gastric secretion and gastric emptying, so the tradition and the textbook agree.',
      },
      {
        plantId: 'mint',
        headline: 'Relaxing the cramp',
        narration:
          'Where ginger stimulates, mint relaxes. Its menthol-family volatiles calm smooth muscle in the gut wall, which is why a mint drink genuinely settles colic and bloating rather than just tasting pleasant.',
      },
      {
        plantId: 'bael',
        headline: 'Ripe or unripe — opposite medicines',
        narration:
          'Unripe bael is astringent and binding, used for chronic diarrhoea. Ripe bael is sweet, laxative and cooling. Same fruit, opposite action. Getting the stage right is the entire skill of using this plant.',
      },
      {
        plantId: 'fenugreek',
        headline: 'The bitter seed that slows sugar',
        narration:
          'Methi seed is packed with galactomannan, a soluble fibre that forms a gel and slows carbohydrate absorption. That single physical property explains its long use in prameha, the metabolic disorders, and its modern trial results in blood-sugar control.',
      },
      {
        plantId: 'amla',
        headline: 'Sour, yet cooling',
        narration:
          'Amla breaks a rule you have just learned: sour tastes usually heat the body, but amla is cooling. That exception is why it is the standard herb for hyperacidity, and why it anchors both Triphala and Chyawanprash.',
      },
    ],
  },
  {
    id: 'breath',
    title: 'Breath & Immunity',
    theme: 'Respiratory',
    subtitle: 'The herbs a physician reaches for in fever season',
    blurb:
      'From the shrub that gave modern medicine its mucolytics to the vine that regrows from a cut stem, this walk follows the AYUSH response to cough, fever and low resistance — including one plant whose molecule you have almost certainly swallowed in a pharmacy syrup.',
    minutes: 7,
    accent: '#4aa3a8',
    stops: [
      {
        plantId: 'vasaka',
        headline: 'The cough shrub',
        narration:
          'Vasaka is the definitive Indian respiratory herb. Its alkaloid vasicine is the direct chemical ancestor of bromhexine and ambroxol — two mucolytics sold in pharmacies worldwide. A hedge plant in Indian villages became a hospital drug.',
      },
      {
        plantId: 'mulethi',
        headline: 'Sweet, coating, calming',
        narration:
          'Liquorice root works by physically coating irritated tissue — that is what demulcent means. Chew a piece and you will taste glycyrrhizin, about fifty times sweeter than sugar. It is also the biggest interaction risk in this garden, because it raises blood pressure.',
      },
      {
        plantId: 'kalmegh',
        headline: 'King of bitters',
        narration:
          'Kalmegh is uncompromisingly bitter, and in Ayurveda that bitterness is the medicine. It leads Nilavembu kudineer, the Siddha decoction distributed across Tamil Nadu during dengue outbreaks, and has some of the better modern trial evidence among Indian bitters.',
      },
      {
        plantId: 'giloy',
        headline: 'Amrita — nectar of immortality',
        narration:
          'A cut length of giloy stem left on damp ground will root and climb again. That resilience is why the texts call it amrita. Practitioners insist that giloy grown on a neem tree is the most potent, absorbing its host’s bitterness.',
      },
      {
        plantId: 'tulsi',
        headline: 'Closing where we began',
        narration:
          'Every fever-season prescription tends to come back to tulsi. Twelve leaves, ginger, black pepper, honey. It is the simplest formulation in this garden and quite possibly the most used medicine in India.',
      },
    ],
  },
  {
    id: 'calm-mind',
    title: 'The Calm Mind Circuit',
    theme: 'Mind & Sleep',
    subtitle: 'Medhya rasayana — herbs for memory, calm and sleep',
    blurb:
      'Ayurveda has a specific category for plants that act on the mind: medhya rasayana. This walk visits the classical four, plus the root that gave psychiatry its first modern drug — and explains why none of them work overnight.',
    minutes: 8,
    accent: '#7c72c4',
    stops: [
      {
        plantId: 'brahmi',
        headline: 'The scholar’s herb',
        narration:
          'Brahmi is the true medhya rasayana of the classical texts. Its bacosides act slowly, over eight to twelve weeks — students hoping for an overnight effect before an exam will be disappointed, and that patience requirement is itself part of the teaching.',
      },
      {
        plantId: 'mandukaparni',
        headline: 'The frog-leaf twin',
        narration:
          'Two entirely different plants are sold as brahmi in India. This one, mandukaparni, has round scalloped leaves like a frog’s foot. It works on the mind and, quite separately, on connective tissue — the same extract sold as "cica" in Korean skincare.',
      },
      {
        plantId: 'ashwagandha',
        headline: 'Strength beneath calm',
        narration:
          'Ashwagandha is not a sedative. It is an adaptogen: it lowers the stress response rather than switching off the mind. Its species name, somnifera, means sleep-bearing, and the evening dose is where that shows.',
      },
      {
        plantId: 'sandalwood',
        headline: 'Cooling the head',
        narration:
          'Chandana paste on the forehead is the classical response to agitation and burning heat. Note that this tree cannot grow alone — it is a hemiparasite whose roots tap into a host. Over-harvesting for that fragrant heartwood has made it a protected species.',
      },
      {
        plantId: 'sarpagandha',
        headline: 'Where tradition became pharmacology',
        narration:
          'Ayurvedic physicians used this root for insomnia and insanity for centuries. In 1952 reserpine was isolated from it and became the first widely used antihypertensive and antipsychotic. It is also the sharpest warning in this garden: a genuine drug, never a casual home remedy.',
      },
    ],
  },
  {
    id: 'skin-hair',
    title: 'Skin, Hair & Healing',
    theme: 'Skin & Hair',
    subtitle: 'The oldest cosmetics were medicines first',
    blurb:
      'Turmeric before a wedding, henna on the hands, neem in the bathwater, oil massaged into the scalp on a Sunday. This walk shows how much of Indian personal care is dermatology that predates the word.',
    minutes: 6,
    accent: '#c9743f',
    stops: [
      {
        plantId: 'neem',
        headline: 'The bitter bath',
        narration:
          'Boiling neem leaves into bathwater for itching, chickenpox or scabies is standard practice across India. Antimicrobial and anti-inflammatory at once — and free, because the tree is in the street.',
      },
      {
        plantId: 'aloe-vera',
        headline: 'Snap and apply',
        narration:
          'Nothing in this garden is faster: break a leaf, fillet the gel, apply it. Trials show partial-thickness burns healing faster than with standard dressings. Just remember to drain the yellow latex first.',
      },
      {
        plantId: 'turmeric',
        headline: 'Ubtan and the wedding paste',
        narration:
          'Turmeric with gram flour, rubbed on the skin before a wedding, is not only symbolic — it is antiseptic, anti-inflammatory and mildly exfoliating. Ritual and dermatology in the same bowl.',
      },
      {
        plantId: 'henna',
        headline: 'Decoration that cools',
        narration:
          'Henna’s lawsone binds to keratin, staining skin and hair. The same application draws heat from the palms, which is why it is worn in the fiercest part of summer. Beware black henna: it contains PPD and causes chemical burns.',
      },
      {
        plantId: 'bhringraj',
        headline: 'King of hair, growing in a ditch',
        narration:
          'Bhringraj is a roadside weed that people buy in bottles. Its Sanskrit name means king of hair, and in Siddha its leaf soup is a jaundice remedy. It is the best illustration of how ordinary the AYUSH pharmacopoeia really is.',
      },
    ],
  },
  {
    id: 'rare',
    title: 'Rare & Endangered',
    theme: 'Rare & Endangered',
    subtitle: 'What happens when a medicine becomes popular',
    blurb:
      'Four plants in this garden are under conservation pressure, and in each case the reason is the same: the medicinal part is the part that kills the plant. This walk is about sustainable harvesting, and why cultivation matters more than wild collection.',
    minutes: 7,
    accent: '#b95a72',
    stops: [
      {
        plantId: 'guggulu',
        headline: 'Critically endangered',
        narration:
          'Guggulu is tapped for resin, and destructive tapping — deep cuts, repeated seasons, no rest — has driven the wild species to Critically Endangered on the IUCN Red List. One shallow incision every other year is the sustainable method. Almost nobody followed it.',
      },
      {
        plantId: 'sarpagandha',
        headline: 'Success as a threat',
        narration:
          'Once reserpine became a global drug, wild sarpagandha was dug out at scale. Since the medicinal part is the root, harvesting always kills the plant. India banned export of the wild root in 1997, and it is now on CITES Appendix II.',
      },
      {
        plantId: 'sandalwood',
        headline: 'Fifteen years to fragrance',
        narration:
          'Sandalwood heartwood only becomes fragrant after about fifteen years, and the roots are the most valuable part — so the whole tree is removed. Add a hemiparasitic root system that needs a host, and you have a species that is very slow to replace.',
      },
      {
        plantId: 'shatavari',
        headline: 'A hundred roots, all dug up',
        narration:
          'Shatavari is named for its cluster of tuberous roots, and those roots are the medicine. Heavy wild collection has pushed it onto conservation-concern lists in several Indian states. It grows well as an orchard intercrop — cultivation is the whole answer here.',
      },
    ],
  },
]

export const tourById: ReadonlyMap<string, Tour> = new Map(tours.map((t) => [t.id, t]))
