/* ------------------------------------------------------------------ *
 * Botanical + procedural-model type system.
 * The same `PlantModelSpec` drives the 3D generator and the 2D
 * botanical-plate illustrator, so every plant looks consistent in both.
 * ------------------------------------------------------------------ */

export type LeafShape =
  | 'ovate'
  | 'lanceolate'
  | 'cordate'
  | 'linear'
  | 'obovate'
  | 'elliptic'
  | 'reniform'
  | 'spatulate'
  | 'succulent'
  | 'deltoid'
  /** Round blade meeting its stalk at the middle, not the edge — a lotus pad. */
  | 'peltate'

export type CompoundType = 'simple' | 'trifoliate' | 'pinnate' | 'palmate' | 'bipinnate'

export type LeafArrangement = 'alternate' | 'opposite' | 'whorled' | 'basal'

/**
 * `aquatic` is Nelumbo's habit and nothing else's: a rhizome in the mud
 * throwing up unbranched stalks one at a time, each carrying a single leaf
 * held clear of the water, with the flower scapes standing higher again.
 * Drawn as a rosette it sat flat on the surface like a water lily, which is
 * the one thing a lotus is always distinguished from.
 */
export type Archetype = 'herb' | 'shrub' | 'tree' | 'climber' | 'rosette' | 'grass' | 'creeper' | 'aquatic'

export interface PlantModelSpec {
  archetype: Archetype
  /** Display height in world units (roughly metres, garden-scaled). */
  height: number
  stem: {
    color: string
    radius: number
    /** 0 = ramrod straight, 1 = strongly meandering. */
    curve?: number
    woody?: boolean
    /** Square stems — the Lamiaceae tell. */
    square?: boolean
  }
  branching: {
    levels: number
    count: number
    /** Degrees from the parent axis. */
    angle: number
    /** Fraction of the parent's length where branching begins. */
    startAt?: number
    taper?: number
  }
  leaf: {
    shape: LeafShape
    compound?: CompoundType
    leaflets?: number
    length: number
    width: number
    arrangement: LeafArrangement
    /** Leaf-bearing nodes per axis. */
    density?: number
    top: string
    bottom: string
    /** 0 = entire margin, 1 = deeply toothed. */
    serration?: number
    droop?: number
    curl?: number
    thickness?: number
    gloss?: number
    /** Horny marginal prickles, as on an aloe. 0–1. */
    teeth?: number
    /** Blade puckered between its veins — the mint and sage surface. 0–1. */
    rugose?: number
    /** Pale flecking across the blade, 0–1. */
    spots?: number
    /** Colour of that flecking; defaults to a chalky white. */
    spotColor?: string
  }
  flower?: {
    /**
     * `verticillaster` is the mint family's own: not a spike of scattered
     * florets but a bare erect rachis carrying rings of them at intervals,
     * which is what makes a tulsi or a mint recognisable across a bed.
     *
     * `lotus` is likewise its own thing — many petals in offset whorls around
     * a flat-topped receptacle and a collar of stamens — and `solitary` drew
     * it as a daisy.
     */
    form: 'spike' | 'umbel' | 'panicle' | 'solitary' | 'cluster' | 'catkin' | 'verticillaster' | 'lotus'
    color: string
    centre?: string
    size: number
    count: number
    petals?: number
    /** `lotus` only: 0 = every bloom a tight bud, 1 = every bloom fully out. */
    openness?: number
    /**
     * `verticillaster` only: spacing between whorls, in floret widths.
     * Tulsi's raceme is interrupted — bare rachis showing between the
     * rings — where spearmint's is crowded into a dense terminal spike.
     * Defaults to the interrupted kind.
     */
    whorlGap?: number
  }
  fruit?: {
    shape: 'round' | 'ovoid' | 'pod' | 'berry'
    color: string
    size: number
    count: number
    /** Ripe colour, for species whose ripe and unripe fruit are used apart. */
    ripeColor?: string
    /** Share of the crop drawn ripe, 0–1. Defaults to a third when a ripe colour is set. */
    ripeShare?: number
  }
  /** Visible underground organ, drawn at the soil line. */
  rhizome?: { color: string; size: number }
  ground?: 'soil' | 'water' | 'sand' | 'rock'
}

export type AyushSystem = 'Ayurveda' | 'Siddha' | 'Unani' | 'Homoeopathy' | 'Sowa-Rigpa' | 'Yoga & Naturopathy'

export type PlantType = 'Herb' | 'Shrub' | 'Tree' | 'Climber' | 'Grass' | 'Succulent'

export type TherapeuticTag =
  | 'Digestive'
  | 'Immunity'
  | 'Respiratory'
  | 'Skin & Hair'
  | 'Mind & Sleep'
  | 'Heart & Circulation'
  | 'Joints & Pain'
  | 'Metabolic'
  | 'Liver'
  | 'Women’s Health'
  | 'Kidney & Urinary'
  | 'Wound Care'

export type RegionTag =
  | 'Himalayan'
  | 'Indo-Gangetic Plains'
  | 'Western Ghats'
  | 'Eastern Ghats'
  | 'Deccan Plateau'
  | 'Arid & Desert'
  | 'Coastal'
  | 'North-East India'
  | 'Pan-India'

export type Conservation = 'Cultivated' | 'Least Concern' | 'Vulnerable' | 'Endangered' | 'Critically Endangered'

export interface AyurvedicProfile {
  rasa: string[]
  guna: string[]
  virya: string
  vipaka: string
  dosha: string
}

/**
 * Coarse era buckets — when the plant enters *Indian* use, which is not
 * always when it is first recorded anywhere. Mint is written down in
 * Mycenaean Greece but only reaches Indian medicine with Unani practice.
 */
export type OriginEra =
  | 'Indus & Vedic'
  | 'Classical Samhita'
  | 'Medieval Nighantu'
  | 'Colonial era'
  | 'Modern'

export type HistoryKind = 'text' | 'archaeology' | 'trade' | 'ritual' | 'science' | 'policy'

export interface HistoryEvent {
  /** Human-readable and deliberately hedged: "c. 1500–1200 BCE". */
  when: string
  /** Signed year for ordering only — negative is BCE. */
  sortYear: number
  title: string
  detail: string
  kind: HistoryKind
  /** The text, site or publication this rests on. */
  source: string
}

/**
 * Where a plant comes from and how it entered use.
 *
 * Dates in this tradition are contested — the Charaka Samhita is placed
 * anywhere from the 2nd century BCE to the 2nd century CE depending on
 * whose chronology you follow — so every date is a hedged string tied to
 * a named source, and `sortYear` exists only to put events in order.
 */
export interface PlantHistory {
  /** Native range, and where the plant was first taken into use. */
  origin: string
  /** When it enters Indian use. */
  originEra: OriginEra
  /** The earliest record anywhere, which may well be outside India. */
  firstRecord: {
    when: string
    sortYear: number
    source: string
    detail: string
  }
  timeline: HistoryEvent[]
  /** Where the name comes from and what it means. */
  etymology: string
  /** How it travelled — trade routes, colonial transfer, diaspora. */
  spread: string
  /** Ritual, mythological or cultural standing. */
  lore: string
}

export interface Plant {
  id: string
  name: string
  botanical: string
  family: string
  /** Localised & classical names, keyed by language label. */
  names: Record<string, string>
  tagline: string
  description: string
  habitat: string
  morphology: string
  regions: RegionTag[]
  type: PlantType
  partsUsed: string[]
  systems: AyushSystem[]
  therapeutic: TherapeuticTag[]
  uses: { title: string; detail: string }[]
  ayurvedic: AyurvedicProfile
  preparations: { name: string; detail: string }[]
  cultivation: {
    soil: string
    climate: string
    propagation: string
    spacing: string
    water: string
    harvest: string
    tips: string[]
  }
  precautions: string[]
  conservation: Conservation
  facts: string[]
  history: PlantHistory
  photos: PlantPhoto[]
  /** 1 = windowsill-easy, 3 = specialist. */
  difficulty: 1 | 2 | 3
  accent: string
  model: PlantModelSpec
}

/**
 * A photograph of the living plant, saved into the repo so the garden
 * works offline. Every file is freely licensed; the credit and the link
 * back to its source page are kept because the licences require it and
 * because a reader should be able to check the identification.
 */
export interface PlantPhoto {
  /** Path under public/, e.g. "/photos/tulsi-1.jpg". */
  src: string
  /** What the photo shows — used as the alt text. */
  alt: string
  credit: string
  license: string
  /** The Wikimedia Commons file page this came from. */
  source: string
}

/** A compendium entry before its history is attached — see data/plants.ts. */
export type PlantEntry = Omit<Plant, 'history' | 'photos'>

export interface TourStop {
  plantId: string
  headline: string
  narration: string
}

export interface Tour {
  id: string
  title: string
  theme: TherapeuticTag | 'Foundations' | 'Rare & Endangered'
  subtitle: string
  blurb: string
  minutes: number
  accent: string
  stops: TourStop[]
}
