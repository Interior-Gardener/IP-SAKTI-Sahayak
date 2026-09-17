import type { Plant } from '../types/plant'
import { plantById } from './plants'

/* ------------------------------------------------------------------ *
 * The medicinal plants' garden — a walkable Ayurvedic herb garden.
 *
 * The bones are the surveyed design: 30 m north-south by 25 m across, a
 * south gate on the axis, a 2.2 m central spine, ranks of beds either
 * side of it, and a circular lily pond closing the north end.
 * The dressing is what the camera found there — red lateritic soil,
 * brick-kerbed beds, white label boards on black posts, a clipped
 * boundary hedge, and the transmission pylons that stand over the whole
 * garden and are the first thing anyone recognises.
 *
 * Everything below is in metres, laid out around the origin:
 *   +X east, -Z north (so the gate sits at +Z), Y up.
 * ------------------------------------------------------------------ */

/* The plan gives 30 m by 25 m, a 2.2 m spine, 1.3–1.5 m cross paths,
 * 3–4 m beds and a 6–7 m pond. Those are constraints rather than
 * coordinates, so the positions below are derived from them and checked
 * against each other — the first attempt at this put the pond's walking
 * ring straight through the back rank of beds. */
/* Five ranks rather than the plan's four. The plan's sixteen beds meant
 * three species crowded into some of them, standing close enough to grow
 * through each other and to need three labels on one bed's edge. A fifth
 * rank buys four more beds, which is enough to hold every bed to one or
 * two species — slightly shallower beds and tighter cross paths pay for
 * most of the extra length. */
const RANKS = 5
const RANK_DEPTH = 2.9
const RANK_GAP = 1.35
/** South edge of the rank nearest the gate. */
const FIRST_RANK_SOUTH = 11.6
const POND_RADIUS = 3.2
const POND_RING = 1.2
/** Air between the pond's ring and the bed behind it. */
const POND_CLEARANCE = 0.4

const LAST_RANK_NORTH = FIRST_RANK_SOUTH - RANKS * RANK_DEPTH - (RANKS - 1) * RANK_GAP
const POND_Z = LAST_RANK_NORTH - POND_CLEARANCE - POND_RADIUS - POND_RING

export const GARDEN = {
  /** Overall plot. The plan gives 30 m; the fifth rank of beds takes it to
   * 32, which only the mown ground beyond the hedge cares about. */
  length: 32,
  width: 25,
  /** Planted ground stops here; the hedge rings the outside of it. */
  innerX: 10.5,
  /** The far edge, set by the pond rather than chosen. */
  northZ: POND_Z - POND_RADIUS - POND_RING - 0.6,
  southZ: 13.2,
  /** Main north-south path — 2.2 m on the plan. */
  spineHalfWidth: 1.1,
  /** East-west paths between the ranks of beds. */
  crossWidth: RANK_GAP,
  pond: { x: 0, z: POND_Z, radius: POND_RADIUS, ringWidth: POND_RING },
  gate: { z: 13.2, halfWidth: 1.3 },
  /** Paved apron inside the gate, clear of the first rank. */
  apron: { z: 12.55, depth: 1.7 },
  /** The dedication plaque, standing on the apron east of the gate,
   * facing whoever walks in — it names the garden, so it is the one
   * thing that has to be legible before anything else is. */
  plaque: { x: 2.7, z: 12.4, rotation: -0.35 },
} as const

export interface GardenBedPlot {
  id: string
  /** Bed centre. */
  x: number
  z: number
  /** Half-extents, so a bed is 2·halfX by 2·halfZ. */
  halfX: number
  halfZ: number
  /** Which rank (0 = nearest the gate) and side this belongs to. */
  rank: number
  side: 'west' | 'east'
  plantIds: string[]
}

/** Beds run from just clear of the spine out toward the hedge. */
const BED_INNER_X = 1.6
const BED_OUTER_X = 9.6
const BED_SPLIT_GAP = 0.25

/**
 * The compendium's species across the twenty plots, each planted once —
 * every one except the lotus, which stands in the pond instead. Height rises with distance from the gate — ground-cover herbs at
 * the entrance, trees against the pond — which is both how the plan's
 * planting-height guide reads and how you would actually plant it, so
 * nothing stands in front of anything shorter.
 */
const PLANTING: string[][] = [
  // Rank nearest the gate: the low, creeping and household herbs.
  ['brahmi', 'mandukaparni'],
  ['mint'],
  ['bhringraj'],
  ['tulsi', 'punarnava'],
  // Second rank: the last of the soft herbs, then the rhizomes.
  ['sadaphuli'],
  ['aloe-vera', 'fenugreek'],
  ['turmeric', 'ginger'],
  ['lemongrass'],
  // Third rank: grasses giving way to the shrubby ones.
  ['shatavari'],
  ['ashwagandha', 'sarpagandha'],
  ['kalmegh', 'vasaka'],
  ['hibiscus'],
  // Fourth rank: climbers and the taller shrubs.
  ['mulethi', 'giloy'],
  ['henna'],
  ['pomegranate'],
  ['guggulu'],
  // Rank against the pond: the trees, which would shade anything in front.
  ['neem'],
  ['amla', 'arjuna'],
  ['bael'],
  ['sandalwood', 'babul'],
]

function buildPlots(): GardenBedPlot[] {
  const plots: GardenBedPlot[] = []
  const halfZ = RANK_DEPTH / 2
  const span = BED_OUTER_X - BED_INNER_X
  const halfX = (span - BED_SPLIT_GAP) / 4

  let i = 0
  for (let rank = 0; rank < RANKS; rank++) {
    const centreZ = FIRST_RANK_SOUTH - halfZ - rank * (RANK_DEPTH + RANK_GAP)
    for (const side of ['west', 'east'] as const) {
      const dir = side === 'west' ? -1 : 1
      // Inner half of the block, then outer half.
      for (let half = 0; half < 2; half++) {
        const centreX = dir * (BED_INNER_X + halfX + half * (halfX * 2 + BED_SPLIT_GAP))
        plots.push({
          id: `r${rank}-${side}-${half}`,
          x: centreX,
          z: centreZ,
          halfX,
          halfZ,
          rank,
          side,
          plantIds: PLANTING[i] ?? [],
        })
        i++
      }
    }
  }
  return plots
}

export const BED_PLOTS: GardenBedPlot[] = buildPlots()

/** Every plot's plants, resolved once. */
export function plotPlants(plot: GardenBedPlot): Plant[] {
  return plot.plantIds.map((id) => plantById.get(id)).filter((p): p is Plant => Boolean(p))
}

/**
 * The pond planting. The lotus is not in a bed — it stands in the water,
 * which is the whole point of it, so it is placed by the pond rather
 * than by the bed layout.
 */
export const POND_PLANT = 'lotus'

/** What the plaque by the gate says. */
export const PLAQUE = {
  title: 'MEDICINAL PLANTS GARDEN',
  subtitle: "(AYURVEDIC MEDICINAL PLANTS' GARDEN)",
  devanagari: 'औषधीय उद्यान',
  opened: 'A VIRTUAL HERBAL GARDEN',
} as const
