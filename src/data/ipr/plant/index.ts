import type { MaterialIPProfile } from '../../../types/material'
import { amla } from './amla'
import { ashwagandha } from './ashwagandha'
import { guggulu } from './guggulu'
import { neem } from './neem'
import { sandalwood } from './sandalwood'
import { sarpagandha } from './sarpagandha'
import { tulsi } from './tulsi'
import { turmeric } from './turmeric'

/* Verified plant IP profiles, one file per plant, keyed by plant id. Plants not
 * listed here get an all-'unknown' profile when they are joined in
 * src/data/plants.ts. Add a plant only when every non-'unknown' field carries a
 * cite id into corpus/manifest.yaml, and run `node scripts/check-ipr-cites.mjs`
 * before you push: it re-reads every quoted provision out of corpus/normalised/. */
export const PLANT_IPR: Readonly<Record<string, MaterialIPProfile>> = {
  turmeric,
  neem,
  ashwagandha,
  sandalwood,
  sarpagandha,
  guggulu,
  amla,
  tulsi,
}
