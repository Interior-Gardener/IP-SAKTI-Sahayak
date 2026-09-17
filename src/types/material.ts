import type { components } from './sahayak'

/* The IP profile shape is owned by the API (api/app/schemas) and generated into
 * ./sahayak.ts; re-exported here so data files don't reach into generated code. */
export type MaterialIPProfile = components['schemas']['MaterialIPProfile']
export type MaterialKind = MaterialIPProfile['kind']

/** A value no one has verified against a source in corpus/manifest.yaml yet. */
export const UNKNOWN = 'unknown' as const
