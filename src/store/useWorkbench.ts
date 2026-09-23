import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ *
 * The formulation workbench.
 *
 * A basket of source materials with what is taken from each and how it is
 * processed — the minimum a classifier needs to be asked a real question
 * rather than a hypothetical one. It persists like the bookmarks do, so a
 * formulation survives a reload and a walk through the garden.
 *
 * Nothing here decides anything. The category comes from the rule table on
 * the API, which cites its provisions; this only carries the composition.
 * ------------------------------------------------------------------ */

/** What a material is turned into. The processes the classification flow
 *  actually distinguishes, in the order of increasing distance from the
 *  raw material. */
export const PROCESSES = [
  'raw',
  'powder (churna)',
  'decoction (kwatha)',
  'fermentation (asava/arishta)',
  'medicated fat (sneha)',
  'extract',
  'standardised fraction',
  'bhasma / calcined',
] as const

export type Process = (typeof PROCESSES)[number]

export interface WorkbenchItem {
  /** 'plant' takes a plant id; the others take a material id. */
  kind: 'plant' | 'microbe' | 'animal' | 'mineral'
  id: string
  /** Shown in the list so the basket reads without looking anything up. */
  label: string
  /** Which part of it — leaf, root, rhizome, whole. Free text: the parts
   *  differ per material and the classifier does not read this. */
  part?: string
  /** Parts by weight, relative to the other items. */
  proportion: number
  process: Process
}

interface WorkbenchState {
  items: WorkbenchItem[]
  /** Answers given to the classification wizard, keyed by question id. */
  answers: Record<string, boolean>
  /** A name for the formulation, if the user gave one. */
  name: string

  add: (item: Omit<WorkbenchItem, 'proportion' | 'process'> & Partial<WorkbenchItem>) => void
  remove: (id: string) => void
  update: (id: string, patch: Partial<WorkbenchItem>) => void
  has: (id: string) => boolean
  setAnswer: (questionId: string, value: boolean) => void
  clearAnswers: () => void
  setName: (name: string) => void
  clear: () => void
}

export const useWorkbench = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      items: [],
      answers: {},
      name: '',

      add: (item) =>
        set((s) =>
          // Adding something already on the bench is a no-op rather than a
          // duplicate: the same material twice is a composition mistake, and
          // the proportion field is there to say "more of it".
          s.items.some((i) => i.id === item.id)
            ? s
            : {
                items: [
                  ...s.items,
                  { proportion: 1, process: 'raw' as Process, ...item },
                ],
                // The composition changed, so any answers given about the old
                // one are stale. Better to ask again than to classify a
                // formulation that no longer exists.
                answers: {},
              },
        ),

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id), answers: {} })),

      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          answers: patch.process || patch.part ? {} : s.answers,
        })),

      has: (id) => get().items.some((i) => i.id === id),
      setAnswer: (questionId, value) => set((s) => ({ answers: { ...s.answers, [questionId]: value } })),
      clearAnswers: () => set({ answers: {} }),
      setName: (name) => set({ name }),
      clear: () => set({ items: [], answers: {}, name: '' }),
    }),
    { name: 'vanaspati.workbench.v1' },
  ),
)
