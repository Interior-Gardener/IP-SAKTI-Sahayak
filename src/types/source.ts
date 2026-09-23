import type { MaterialIPProfile, MaterialKind } from './material'

/* ------------------------------------------------------------------ *
 * Source materials other than plants — the microbial, animal-derived and
 * mineral ingredients the problem statement names alongside herbs.
 *
 * Deliberately lighter than `Plant`: a plant carries botany, pharmacology,
 * history, photographs and a quiz. These carry what the Rasashala needs to
 * show — what the thing is, what it is used for, and its legal layer — and
 * nothing that would have to be invented to fill a field.
 *
 * As with plants, the model spec drives the 3D generator, so a material is
 * described once and drawn from that description.
 * ------------------------------------------------------------------ */

/** The five shapes a micro-organism is drawn as. Chosen because they are
 *  the ones a light microscope tells apart, not because Ayurveda names them. */
export type MicrobeForm =
  /** Spheres in a chain or cluster — lactic acid bacteria. */
  | 'coccus'
  /** Rods, singly or end to end — bacilli. */
  | 'bacillus'
  /** Budding ovals — the yeasts that carry an asava through fermentation. */
  | 'yeast'
  /** Branching filaments — moulds. */
  | 'hypha'
  /** Corkscrews. */
  | 'spirillum'
  /** A helical filament of short cells — Arthrospira ("spirulina"). No flagella. */
  | 'trichome'

export interface MicrobeModelSpec {
  form: MicrobeForm
  /** Cells in the colony. The generator scatters them deterministically. */
  count: number
  /** Cell length in world units; the display scale is set by the shelf. */
  size: number
  color: string
  /** Nucleoid, bud scar or septum colour. Defaults to a darker `color`. */
  accent?: string
  /** 0 = matte, 1 = wet and glossy. Yeasts in wort are glossy; spores are not. */
  sheen?: number
  /** How the cells swim, if they do. Lactobacilli have none; Bacillus is
   *  peritrichous (flagella all over the cell). Only rods use it. */
  flagella?: 'none' | 'polar' | 'peritrichous'
  /** Whether some cells carry an endospore — a Bacillus does, a lactobacillus does not. */
  spores?: boolean
}

/** The shapes the pharmacy's shelves hold. */
export type SubstanceForm =
  /** Comb prisms — madhu. */
  | 'honeycomb'
  /** A turned lathe pot — ghrita, taila, an asava jar. */
  | 'vessel'
  /** A noise-displaced lump — shilajit, an ore, a raw resin. */
  | 'rock'
  /** A parametric spiral shell — shankha. */
  | 'conch'
  /** A smooth sphere — mukta. */
  | 'pearl'
  /** A branched stick — pravala. */
  | 'coral'
  /** One valve of a bivalve: frilled outside, nacre inside — shukti. */
  | 'shell'
  /** A cast bar — swarna, rajata, loha. */
  | 'ingot'
  /** A conical heap of powder — a bhasma or churna as it is kept. */
  | 'powder'

/** A shape within a form. Three pots on one shelf that differ only in colour
 *  read as one pot drawn three times, and the materials they hold are not
 *  alike: ghee is kept in a wide-mouthed jar, milk in a tall narrow pot, and
 *  mercury in a sealed round-bottomed flask because it must not escape. */
export type SubstanceVariant =
  /** vessel: wide mouth, low belly — ghrita. */
  | 'jar'
  /** vessel: tall, narrow neck — dugdha. */
  | 'pot'
  /** vessel: round bottom, long sealed neck — the rasa shastra kupi. */
  | 'flask'
  /** rock: flat and angular — a shell fragment. */
  | 'shard'
  /** rock: small, round, closed — a pod. */
  | 'nugget'
  /** powder: poured into a shallow dish rather than heaped. */
  | 'dish'
  /** powder: heaped, with books of raw mica sheets beside it — abhraka. */
  | 'mica'
  /** rock: a smooth pouch with a coat of short hair — the musk pod. */
  | 'pod'
  /** rock: bipyramid crystals grown on matrix rock — cinnabar, sulphur. The
   *  crystals take `color`, the matrix `accent`. */
  | 'crystals'

export interface SubstanceModelSpec {
  form: SubstanceForm
  /** Height in world units for the tallest axis. */
  size: number
  color: string
  accent?: string
  /** Metals and bhasmas need it; a honeycomb does not. */
  metalness?: number
  roughness?: number
  /** Which shape within the form. Omitted = the form's plain shape. */
  variant?: SubstanceVariant
}

export type MaterialModelSpec =
  | ({ draw: 'microbe' } & MicrobeModelSpec)
  | ({ draw: 'substance' } & SubstanceModelSpec)

/** Where in the Rasashala the material stands. */
export type Shelf =
  /** Fermentation hall: the asava and arishta vats and what works in them. */
  | 'fermentation'
  /** Culture vault: deposits, cryo-vials, agar. */
  | 'vault'
  /** Animal-derived shelf: madhu, ghrita, mukta, shankha. */
  | 'animal'
  /** Rasa shelf: the mineral and metallic preparations. */
  | 'rasa'

/** A material as written in `src/data/materials/`, before the IP profile is joined. */
export interface SourceMaterialEntry {
  id: string
  kind: Exclude<MaterialKind, 'plant'>
  name: string
  /** Sanskrit / Ayurvedic name where the tradition has one. */
  sanskrit?: string
  /** Binomial or chemical identity, where there is one to give. */
  scientific?: string
  names: Record<string, string>
  tagline: string
  description: string
  /** How the classical tradition uses it. Descriptive, never a dosage. */
  classicalUse: string
  shelf: Shelf
  model: MaterialModelSpec
}

/** The joined material: entry plus its legal layer, the same join plants get. */
export interface SourceMaterial extends SourceMaterialEntry {
  ipr: MaterialIPProfile
}
