import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AFTERNOON, EVENING } from '../three/daylight'

export interface PlantNote {
  plantId: string
  body: string
  updatedAt: number
}

export type Quality = 'auto' | 'high' | 'balanced' | 'light'

interface GardenState {
  bookmarks: string[]
  notes: Record<string, PlantNote>
  /** Plants the visitor has opened, newest first. */
  visited: string[]
  completedTours: string[]
  theme: 'light' | 'dark'
  quality: Quality
  narration: boolean
  reducedMotion: boolean
  /** The cinematic opening has played at least once. */
  introSeen: boolean
  /** The coach-mark walkthrough has been completed or dismissed. */
  walkthroughSeen: boolean
  /** 0 = dawn, 0.5 = noon, 1 = night. Drives the garden's sky and lights. */
  timeOfDay: number

  toggleBookmark: (plantId: string) => void
  isBookmarked: (plantId: string) => boolean
  setNote: (plantId: string, body: string) => void
  deleteNote: (plantId: string) => void
  markVisited: (plantId: string) => void
  completeTour: (tourId: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setQuality: (quality: Quality) => void
  setNarration: (on: boolean) => void
  setReducedMotion: (on: boolean) => void
  setIntroSeen: (seen: boolean) => void
  setWalkthroughSeen: (seen: boolean) => void
  setTimeOfDay: (value: number) => void
  resetProgress: () => void
}

const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useGarden = create<GardenState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      notes: {},
      visited: [],
      completedTours: [],
      theme: prefersDark ? 'dark' : 'light',
      quality: 'auto',
      narration: true,
      reducedMotion: false,
      introSeen: false,
      walkthroughSeen: false,
      timeOfDay: prefersDark ? EVENING : AFTERNOON,

      toggleBookmark: (plantId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(plantId)
            ? s.bookmarks.filter((id) => id !== plantId)
            : [plantId, ...s.bookmarks],
        })),

      isBookmarked: (plantId) => get().bookmarks.includes(plantId),

      setNote: (plantId, body) =>
        set((s) => {
          const trimmed = body.trim()
          if (!trimmed) {
            const { [plantId]: _drop, ...rest } = s.notes
            return { notes: rest }
          }
          return { notes: { ...s.notes, [plantId]: { plantId, body, updatedAt: Date.now() } } }
        }),

      deleteNote: (plantId) =>
        set((s) => {
          const { [plantId]: _drop, ...rest } = s.notes
          return { notes: rest }
        }),

      markVisited: (plantId) =>
        set((s) => ({ visited: [plantId, ...s.visited.filter((id) => id !== plantId)].slice(0, 40) })),

      completeTour: (tourId) =>
        set((s) => ({
          completedTours: s.completedTours.includes(tourId)
            ? s.completedTours
            : [...s.completedTours, tourId],
        })),

      // Switching the theme also moves the sun, so the chrome and the garden
      // never disagree about what time it is. The daylight slider still wins
      // afterwards — this only sets the hour the theme implies.
      setTheme: (theme) => set({ theme, timeOfDay: theme === 'dark' ? EVENING : AFTERNOON }),
      toggleTheme: () =>
        set((s) => {
          const theme = s.theme === 'dark' ? 'light' : 'dark'
          return { theme, timeOfDay: theme === 'dark' ? EVENING : AFTERNOON }
        }),
      setQuality: (quality) => set({ quality }),
      setNarration: (narration) => set({ narration }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setIntroSeen: (introSeen) => set({ introSeen }),
      setWalkthroughSeen: (walkthroughSeen) => set({ walkthroughSeen }),
      setTimeOfDay: (timeOfDay) => set({ timeOfDay: Math.max(0, Math.min(1, timeOfDay)) }),
      resetProgress: () =>
        set({ bookmarks: [], notes: {}, visited: [], completedTours: [], introSeen: false, walkthroughSeen: false }),
    }),
    {
      name: 'vanaspati.garden.v1',
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        notes: s.notes,
        visited: s.visited,
        completedTours: s.completedTours,
        theme: s.theme,
        quality: s.quality,
        narration: s.narration,
        reducedMotion: s.reducedMotion,
        introSeen: s.introSeen,
        walkthroughSeen: s.walkthroughSeen,
        timeOfDay: s.timeOfDay,
      }),
    },
  ),
)

/** Applies the stored theme to <html> and keeps it in sync. */
export function useThemeEffect() {
  const theme = useGarden((s) => s.theme)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }
  return theme
}
