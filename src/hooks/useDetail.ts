import { useMemo } from 'react'
import { useGarden } from '../store/useGarden'
import type { Detail } from '../three/procedural/plant'

/** Rough capability sniff, evaluated once — no benchmarking loop needed. */
function autoDetail(): Detail {
  if (typeof navigator === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  if (cores <= 4 || memory <= 4) return coarse ? 'low' : 'medium'
  if (coarse) return 'medium'
  return 'high'
}

/** Evaluated once at module load, not during a render. */
const detected: Detail = autoDetail()

/**
 * Detail level for a scene. `context` lets the garden run one step lighter
 * than a single-specimen viewer, since it draws twenty-five plants at once.
 */
export function useDetail(context: 'viewer' | 'garden' = 'viewer'): Detail {
  const quality = useGarden((s) => s.quality)
  return useMemo(() => {
    const base: Detail =
      quality === 'high' ? 'high' : quality === 'balanced' ? 'medium' : quality === 'light' ? 'low' : detected
    if (context === 'garden') {
      return base === 'high' ? 'medium' : 'low'
    }
    return base
  }, [quality, context])
}

/** Device pixel ratio ceiling matched to the chosen detail level. */
export function dprFor(detail: Detail): [number, number] {
  if (detail === 'low') return [1, 1.25]
  if (detail === 'medium') return [1, 1.6]
  return [1, 2]
}
