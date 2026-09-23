/* ------------------------------------------------------------------ *
 * The Rasashala tour: "Three kinds of law under one roof".
 *
 * The camera goes to each material in turn and a card says what the law
 * does with it. The point of the walk is the contrast: a micro-organism, an
 * animal product and a mineral sit on neighbouring benches and meet three
 * different sets of rules.
 *
 * Every legal sentence rests on a provision whose words are quoted, and each
 * quote is re-read from the corpus by `npm run check:ipr` through the
 * @verify line beside it.
 * ------------------------------------------------------------------ */

export interface RasashalaTourStop {
  materialId: string
  headline: string
  narration: string
  cite: { source: string; locator: string; quote: string }
}

export const RASASHALA_TOUR = {
  title: 'Three Kinds of Law Under One Roof',
  subtitle: 'Microbes, animal products and minerals, and what the law does with each',
  stops: [
    {
      materialId: 'dhataki-yeast',
      headline: 'The one living thing a patent can reach',
      narration:
        'Section 3(j) of the Patents Act keeps plants and animals out of patent law — "other than micro-organisms". That carve-out is why a yeast strain, isolated and put to a new use, can be patentable where the flower it lives on cannot. A microbe simply found in nature is still a discovery, which section 3(c) keeps out.',
      // @verify in-patents-act-1970 | s.3(j) | plants and animals in whole or any part thereof other than micro-organisms but including seeds, varieties and species
      cite: {
        source: 'in-patents-act-1970',
        locator: 's.3(j)',
        quote: 'plants and animals in whole or any part thereof other than micro-organisms but including seeds, varieties and species',
      },
    },
    {
      materialId: 'bacillus-clausii',
      headline: 'When words are not enough: the deposit',
      narration:
        'A living strain cannot always be described well enough on paper for someone else to repeat the invention. Where it cannot, section 10(4)(d)(ii) completes the application by depositing the material with an international depositary authority under the Budapest Treaty. India has three; Registry Marg has one of them.',
      // @verify in-patents-act-1970 | s.10(4)(d)(ii) | if the applicant mentions a biological material in the specification which may not be described in such a way as to satisfy clauses (a) and (b)
      // @verify intl-budapest-treaty | Art. 3(1)(a) | shall recognize, for such purposes, the deposit of a microorganism with any international depositary authority
      cite: {
        source: 'in-patents-act-1970',
        locator: 's.10(4)(d)(ii)',
        quote:
          'if the applicant mentions a biological material in the specification which may not be described in such a way as to satisfy clauses (a) and (b)',
      },
    },
    {
      materialId: 'madhu',
      headline: 'Honey is a biological resource',
      narration:
        'The Biological Diversity Act\'s biological resources include plants, animals and micro-organisms, their genetic material and derivatives — excluding value added products. Honey comes from an animal, so the Act\'s access and benefit-sharing rules can reach it; whether a finished product counts as value added is the question to check.',
      // @verify in-bd-act-2002 | s.2(c) | include plants, animals, micro-organisms or parts of their genetic material and derivatives (excluding value added products)
      cite: {
        source: 'in-bd-act-2002',
        locator: 's.2(c)',
        quote: 'include plants, animals, micro-organisms or parts of their genetic material and derivatives (excluding value added products)',
      },
    },
    {
      materialId: 'kasturi',
      headline: 'Musk, and Schedule I',
      narration:
        'The classical texts name musk; the Wild Life (Protection) Act lists the musk deer in Schedule I, Part A, and its definitions name musk among the animal products it reaches. Section 49B restricts dealing in scheduled animal articles. The classical record and the current law point in opposite directions here, and a modern formulator substitutes.',
      // @verify in-wlpa-1972 | Schedule I, Part A | Alpine Musk Deer Moschus chrysogaster
      // @verify in-wlpa-1972 | s.2 | freshly killed wild animal, ambergris, musk and other animal products
      // @verify in-wlpa-1972 | s.49B | a manufacturer of, or dealer in, scheduled animal articles
      cite: { source: 'in-wlpa-1972', locator: 'Schedule I, Part A', quote: 'Alpine Musk Deer Moschus chrysogaster' },
    },
    {
      materialId: 'pravala',
      headline: 'Coral needs a permit to leave',
      narration:
        'Corals are in Schedule I, Part K, and red coral species are in Schedule IV — the Act\'s copy of the CITES appendices. Under section 49I(2), exporting any specimen of an Appendix III species needs an export permit granted first. Of everything on this shelf, coral is the one most likely to stop a consignment.',
      // @verify in-wlpa-1972 | Schedule I, Part K | PART K : CORALS
      // @verify in-wlpa-1972 | Schedule IV, Appendix III | Corallium elatius (China)
      // @verify in-wlpa-1972 | s.49I(2) | The export of any specimen of species included in Appendix III of Schedule IV shall require the prior grant and presentation of an export permit
      cite: {
        source: 'in-wlpa-1972',
        locator: 's.49I(2)',
        quote:
          'The export of any specimen of species included in Appendix III of Schedule IV shall require the prior grant and presentation of an export permit',
      },
    },
    {
      materialId: 'parada',
      headline: 'Mercury is on the poison list',
      narration:
        'Schedule E(1) of the Drugs and Cosmetics Rules is the list of poisonous substances for Ayurvedic, Siddha and Unani medicine, and parada — mercury — is on it, as is hingula, cinnabar. A formulation that uses one is not barred by that listing, but it is on the list the licensing and labelling rules refer to.',
      // @verify in-dc-rules-1945 | Schedule E(1) | List of poisonous substances under the Ayurvedic (including Siddha) and Unani Systems of Medicine
      // @verify in-dc-rules-1945 | Schedule E(1), mineral 18 | Parada Mercury.
      cite: { source: 'in-dc-rules-1945', locator: 'Schedule E(1)', quote: 'Parada Mercury.' },
    },
    {
      materialId: 'swarna',
      headline: 'Gold: a mineral, and outside two laws',
      narration:
        'Gold is not a plant, an animal or a micro-organism, so the Biological Diversity Act\'s access rules do not reach it at all. And as a substance occurring in nature it is kept out of patent law by section 3(c) — the discovery of a non-living substance occurring in nature. A process for making a bhasma from it is judged on its own.',
      // @verify in-patents-act-1970 | s.3(c) | discovery of any living thing or non-living substance occurring in nature
      cite: {
        source: 'in-patents-act-1970',
        locator: 's.3(c)',
        quote: 'discovery of any living thing or non-living substance occurring in nature',
      },
    },
  ] satisfies RasashalaTourStop[],
}
