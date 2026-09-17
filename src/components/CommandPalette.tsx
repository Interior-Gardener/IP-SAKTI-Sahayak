import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { plants } from '../data/plants'
import { tours } from '../data/tours'
import { emptyFilters, searchPlants } from '../lib/search'
import { BotanicalPlate } from './BotanicalPlate'
import { Icon, type IconName } from './ui/Icon'
import { cx } from './ui/primitives'
import { useGarden } from '../store/useGarden'

interface Result {
  id: string
  kind: 'plant' | 'tour' | 'page'
  title: string
  subtitle: string
  to: string
  icon?: IconName
  plantId?: string
}

const PAGES: Result[] = [
  { id: 'p-garden', kind: 'page', title: 'The Garden', subtitle: 'Walk the 3D beds', to: '/garden', icon: 'map' },
  { id: 'p-explore', kind: 'page', title: 'Explore all plants', subtitle: 'Search and filter the compendium', to: '/explore', icon: 'grid' },
  { id: 'p-atlas', kind: 'page', title: 'The Atlas', subtitle: 'The whole collection read as data', to: '/atlas', icon: 'layers' },
  { id: 'p-compare', kind: 'page', title: 'Comparison bench', subtitle: 'Put two or three plants side by side', to: '/compare', icon: 'expand' },
  { id: 'p-tours', kind: 'page', title: 'Guided tours', subtitle: 'Themed walks with narration', to: '/tours', icon: 'route' },
  { id: 'p-mine', kind: 'page', title: 'My Garden', subtitle: 'Saved plants and study notes', to: '/my-garden', icon: 'bookmark' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const bookmarks = useGarden((s) => s.bookmarks)
  const visited = useGarden((s) => s.visited)

  const results = useMemo<Result[]>(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      const recent = visited
        .slice(0, 4)
        .map((id) => plants.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map<Result>((p) => ({
          id: `r-${p.id}`,
          kind: 'plant',
          title: p.name,
          subtitle: `Recently viewed · ${p.botanical}`,
          to: `/plant/${p.id}`,
          plantId: p.id,
        }))
      return [...recent, ...PAGES]
    }

    const matched = searchPlants(plants, {
      query: trimmed,
      filters: emptyFilters,
      sort: 'relevance',
      bookmarks,
    }).slice(0, 7)

    const plantResults = matched.map<Result>((p) => ({
      id: `s-${p.id}`,
      kind: 'plant',
      title: p.name,
      subtitle: `${p.botanical} · ${p.therapeutic.slice(0, 2).join(', ')}`,
      to: `/plant/${p.id}`,
      plantId: p.id,
    }))

    const tourResults = tours
      .filter((t) => `${t.title} ${t.theme} ${t.subtitle}`.toLowerCase().includes(trimmed.toLowerCase()))
      .slice(0, 3)
      .map<Result>((t) => ({
        id: `t-${t.id}`,
        kind: 'tour',
        title: t.title,
        subtitle: `${t.stops.length}-stop tour · ${t.minutes} min`,
        to: `/tours/${t.id}`,
        icon: 'route',
      }))

    const pageResults = PAGES.filter((p) => p.title.toLowerCase().includes(trimmed.toLowerCase()))

    return [...plantResults, ...tourResults, ...pageResults]
  }, [query, bookmarks, visited])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % Math.max(1, results.length))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
      }
      if (e.key === 'Enter') {
        const target = results[active]
        if (target) {
          navigate(target.to)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, navigate, onClose])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button
        className="absolute inset-0 bg-[rgb(10_16_12/0.55)] backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close search"
        tabIndex={-1}
      />
      <div className="animate-fade-up relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-raised shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${plants.length} plants, tours, or a symptom…`}
            className="h-14 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-ink-faint"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-faint">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-ink-faint">
              Nothing matched “{query}”. Try a symptom like <em>cough</em> or a part like <em>root</em>.
            </p>
          )}
          {results.map((result, i) => {
            const plant = result.plantId ? plants.find((p) => p.id === result.plantId) : undefined
            return (
              <button
                key={result.id}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  navigate(result.to)
                  onClose()
                }}
                className={cx(
                  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                  i === active ? 'bg-sunken' : 'hover:bg-sunken/60',
                )}
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: plant
                      ? `color-mix(in srgb, ${plant.accent} 14%, var(--surface-sunken))`
                      : 'var(--surface-sunken)',
                  }}
                >
                  {plant ? (
                    <BotanicalPlate plant={plant} className="size-9" />
                  ) : (
                    <Icon name={result.icon ?? 'leaf'} size={17} className="text-ink-soft" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9rem] font-medium">{result.title}</span>
                  <span className="block truncate text-[0.76rem] text-ink-faint">{result.subtitle}</span>
                </span>
                {i === active && <Icon name="arrowRight" size={16} className="shrink-0 text-ink-faint" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[0.7rem] text-ink-faint">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line px-1 font-mono">↵</kbd> open
          </span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}
