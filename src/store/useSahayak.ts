import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JurisdictionMode, Persona } from '../lib/sahayak/client'

export interface WorkbenchItem {
  kind: 'plant' | 'microbe' | 'animal' | 'mineral'
  id: string
  part?: string
  proportion?: string
  process?: string
}

interface SahayakState {
  /** Anonymous id; the API purges everything tied to it on `DELETE /me`. */
  sessionId: string
  jurisdiction: JurisdictionMode
  /** BCP-47 code the answer is written in. */
  language: string
  persona: Persona | null
  /** The visitor accepted the assistant notice; nothing is sent before this. */
  consent: boolean
  workbench: WorkbenchItem[]

  setJurisdiction: (jurisdiction: JurisdictionMode) => void
  setLanguage: (language: string) => void
  setPersona: (persona: Persona | null) => void
  setConsent: (consent: boolean) => void
  addToWorkbench: (item: WorkbenchItem) => void
  removeFromWorkbench: (kind: WorkbenchItem['kind'], id: string) => void
  clearWorkbench: () => void
  /** Forget this visitor locally and start a fresh session id. */
  resetSession: () => void
}

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export const useSahayak = create<SahayakState>()(
  persist(
    (set) => ({
      sessionId: newSessionId(),
      jurisdiction: 'BOTH',
      language: 'en',
      persona: null,
      consent: false,
      workbench: [],

      setJurisdiction: (jurisdiction) => set({ jurisdiction }),
      setLanguage: (language) => set({ language }),
      setPersona: (persona) => set({ persona }),
      setConsent: (consent) => set({ consent }),
      addToWorkbench: (item) =>
        set((s) => ({
          workbench: [...s.workbench.filter((w) => !(w.kind === item.kind && w.id === item.id)), item],
        })),
      removeFromWorkbench: (kind, id) =>
        set((s) => ({ workbench: s.workbench.filter((w) => !(w.kind === kind && w.id === id)) })),
      clearWorkbench: () => set({ workbench: [] }),
      resetSession: () => set({ sessionId: newSessionId(), consent: false, workbench: [] }),
    }),
    { name: 'vanaspati.sahayak.v1' },
  ),
)
