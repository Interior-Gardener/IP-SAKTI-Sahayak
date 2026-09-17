import type { MaterialIPProfile } from '../../../types/material'

/* Verified plant IP profiles, one file per plant, keyed by plant id. Plants not
 * listed here get an all-'unknown' profile when they are joined in
 * src/data/plants.ts. Add a plant only when every non-'unknown' field carries a
 * cite id into corpus/manifest.yaml (T1.19, T1.20). */
export const PLANT_IPR: Readonly<Record<string, MaterialIPProfile>> = {}
