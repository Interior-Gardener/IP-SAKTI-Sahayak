import type { SourceMaterialEntry } from '../../types/source'

/* ------------------------------------------------------------------ *
 * The microbial sources.
 *
 * Ayurveda has worked with micro-organisms for as long as it has made
 * asava and arishta, without naming them: the fermentation is described
 * by what is added and what happens, not by what lives in the jar. So
 * each entry says both things — the classical practice in its own terms,
 * and the organism modern work identifies in it.
 *
 * No entry claims a therapeutic effect, and none gives a dose.
 * ------------------------------------------------------------------ */

export const microbes: SourceMaterialEntry[] = [
  {
    id: 'dhataki-yeast',
    kind: 'microbe',
    name: 'Dhataki yeast',
    sanskrit: 'Dhataki pushpa (the flower that carries it)',
    scientific: 'Saccharomyces cerevisiae and related wild yeasts',
    names: { Sanskrit: 'Dhataki', Hindi: 'Dhai phool', English: 'Fire-flame bush flower' },
    tagline: 'The wild yeast on dhataki flowers that starts every asava and arishta.',
    description:
      'Classical fermentation does not add a culture. It adds dried dhataki (Woodfordia fruticosa) flowers to the sweetened decoction, and the fermentation starts. The flowers carry a wild yeast flora on their surface, and it is that flora — along with the sugars from jaggery or honey — that turns a kashaya into an arishta over a fortnight in a sealed vessel.',
    classicalUse:
      'Sandhana kalpana: the group of preparations made by fermentation. Asava is fermented from a cold infusion, arishta from a decoction; dhataki flowers are the usual starter in both.',
    shelf: 'fermentation',
    model: { draw: 'microbe', form: 'yeast', count: 11, size: 0.26, color: '#e8d9a8', accent: '#a98b4e', sheen: 0.7 },
  },
  {
    id: 'dadhi-lactococcus',
    kind: 'microbe',
    name: 'Dadhi lactic cocci',
    sanskrit: 'Dadhi (curd)',
    scientific: 'Lactococcus lactis and related lactic acid cocci',
    names: { Sanskrit: 'Dadhi', Hindi: 'Dahi', English: 'Curd' },
    tagline: 'The chains of cocci that set milk into curd overnight.',
    description:
      'Dadhi is milk soured by lactic acid bacteria, and in the classical texts it is a material in its own right rather than a food only — the base from which takra is churned. The organisms grow as short chains of spheres and acidify the milk until its proteins set.',
    classicalUse:
      'Dadhi is a dravya of the ksheera varga (the milk group), and the starting point for takra, which is used far more widely than the curd itself.',
    shelf: 'fermentation',
    model: { draw: 'microbe', form: 'coccus', count: 10, size: 0.22, color: '#f0efe6', accent: '#8d9a86', sheen: 0.55 },
  },
  {
    id: 'takra-lactobacillus',
    kind: 'microbe',
    name: 'Takra lactobacilli',
    sanskrit: 'Takra (buttermilk)',
    scientific: 'Lactiplantibacillus plantarum and related lactobacilli',
    names: { Sanskrit: 'Takra', Hindi: 'Chhachh', Tamil: 'Moru', English: 'Buttermilk' },
    tagline: 'The rods in buttermilk — the most used of all the fermented preparations.',
    description:
      'Takra is curd churned with water and the butter removed. It carries a population of lactic acid rods, which is why it keeps souring after churning. Classical practice grades takra by how much water is added and whether the fat is taken out, and uses the grades differently.',
    classicalUse:
      'Takra is used as an anupana (a vehicle taken with a medicine) and as a base for preparations such as takrarishta; the texts describe several grades of it.',
    shelf: 'fermentation',
    model: { draw: 'microbe', form: 'bacillus', count: 12, size: 0.3, color: '#f4f1e4', accent: '#9aa38c', sheen: 0.5 },
  },
  {
    id: 'bacillus-clausii',
    kind: 'microbe',
    name: 'Spore-forming bacillus',
    scientific: 'Bacillus clausii',
    names: { English: 'Spore-forming probiotic bacillus' },
    tagline: 'A spore former, and the reason the culture vault exists at all.',
    description:
      'A rod that survives as a spore and can therefore be kept, shipped and deposited without refrigeration. Strains of this kind sit at the boundary of the problem statement: the organism is a micro-organism for patent purposes, a biological resource under the biodiversity regime, and — when it goes into a product — something a regulator has a view on.',
    classicalUse:
      'No classical counterpart: this is a modern addition to the pharmacy, kept here because the deposit and disclosure questions it raises are the ones the culture vault is about.',
    shelf: 'vault',
    model: { draw: 'microbe', form: 'bacillus', count: 9, size: 0.34, color: '#dfe6ea', accent: '#6f8695', sheen: 0.35 },
  },
  {
    id: 'plant-endophyte',
    kind: 'microbe',
    name: 'Plant endophyte',
    scientific: 'Endophytic fungi of medicinal plants',
    names: { English: 'Endophytic fungus' },
    tagline: 'A fungus living inside a medicinal plant, sometimes making what the plant is collected for.',
    description:
      'Endophytes live inside plant tissue without causing disease, and some produce the same secondary metabolites as their host. That makes them a route to a compound without the plant — and it makes the legal questions harder, because the organism may be newly isolated while the use of the plant is old and documented.',
    classicalUse:
      'None. It is here because it is where a modern isolation meets an old use, which is the hardest case the assistant is asked about.',
    shelf: 'vault',
    model: { draw: 'microbe', form: 'hypha', count: 7, size: 0.4, color: '#e2ded0', accent: '#7d6b4f', sheen: 0.2 },
  },
  {
    id: 'spirulina',
    kind: 'microbe',
    name: 'Spirulina',
    scientific: 'Arthrospira platensis',
    names: { Hindi: 'Spirulina', English: 'Blue-green alga' },
    tagline: 'A helical cyanobacterium, grown in ponds and sold as a supplement.',
    description:
      'Arthrospira grows as a corkscrew filament visible under a light microscope, and is cultivated in open alkaline ponds. It is sold in India as a food supplement rather than as a classical Ayurvedic drug, which puts it on the food side of the classification flow rather than the drug side.',
    classicalUse:
      'Not a classical dravya. Included because supplement products routinely combine it with Ayurvedic ingredients, and the combination is what decides how the product is regulated.',
    shelf: 'vault',
    model: { draw: 'microbe', form: 'spirillum', count: 7, size: 0.34, color: '#4f7f5c', accent: '#2f5540', sheen: 0.6 },
  },
]
