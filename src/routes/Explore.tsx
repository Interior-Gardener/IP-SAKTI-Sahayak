import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  conservationFacets,
  eraFacets,
  partFacets,
  plants,
  regionFacets,
  systemFacets,
  therapeuticFacets,
  typeFacets,
} from '../data/plants'
import { countActiveFilters, emptyFilters, searchPlants, type Filters, type SortMode } from '../lib/search'
import { PlantCard } from '../components/PlantCard'
import { Icon } from '../components/ui/Icon'
import { Button, Chip, EmptyState, Segmented } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'

type FacetKey = 'therapeutic' | 'regions' | 'systems' | 'types' | 'parts' | 'conservation' | 'eras'

const FACET_GROUPS: { key: FacetKey; label: string; hint: string; facets: { value: string; count: number }[] }[] = [
  { key: 'therapeutic', label: 'Treats', hint: 'What the plant is used for', facets: therapeuticFacets },
  { key: 'types', label: 'Plant type', hint: 'Growth habit', facets: typeFacets },
  { key: 'parts', label: 'Part used', hint: 'The medicinal organ', facets: partFacets },
  { key: 'regions', label: 'Region', hint: 'Where it grows in India', facets: regionFacets },
  { key: 'systems', label: 'AYUSH system', hint: 'Traditions that use it', facets: systemFacets },
  { key: 'conservation', label: 'Conservation', hint: 'Wild population status', facets: conservationFacets },
  { key: 'eras', label: 'Era', hint: 'When it enters Indian use', facets: eraFacets },
]

const SORTS: { value: SortMode; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'alpha', label: 'A–Z' },
  { value: 'easiest', label: 'Easiest to grow' },
  { value: 'rarest', label: 'Rarest first' },
  { value: 'oldest', label: 'Oldest record first' },
]

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [filters, setFilters] = useState<Filters>(() => ({
    ...emptyFilters,
    therapeutic: params.get('treats') ? [params.get('treats') as never] : [],
    regions: params.get('region') ? [params.get('region') as never] : [],
  }))
  const [sort, setSort] = useState<SortMode>('relevance')
  const [layout, setLayout] = useState<'grid' | 'row'>('grid')
  const [panelOpen, setPanelOpen] = useState(false)
  const bookmarks = useGarden((s) => s.bookmarks)

  // Keep the URL shareable without thrashing history on every keystroke.
  useEffect(() => {
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (filters.therapeutic.length === 1) next.set('treats', filters.therapeutic[0])
    if (filters.regions.length === 1) next.set('region', filters.regions[0])
    setParams(next, { replace: true })
  }, [query, filters.therapeutic, filters.regions, setParams])

  const results = useMemo(
    () => searchPlants(plants, { query, filters, sort, bookmarks }),
    [query, filters, sort, bookmarks],
  )

  const activeCount = countActiveFilters(filters)

  const toggle = (key: FacetKey, value: string) =>
    setFilters((f) => {
      const list = f[key] as string[]
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      }
    })

  const filterPanel = (
    <div className="space-y-7">
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-raised px-4 py-3">
        <span className="flex items-center gap-2.5 text-[0.85rem] font-medium">
          <Icon name="bookmark" size={16} className="text-accent" />
          Only my saved plants
        </span>
        <input
          type="checkbox"
          checked={filters.bookmarkedOnly}
          onChange={(e) => setFilters((f) => ({ ...f, bookmarkedOnly: e.target.checked }))}
          className="size-4 accent-[var(--accent)]"
        />
      </label>

      {FACET_GROUPS.map((group) => (
        <fieldset key={group.key} className="space-y-2.5">
          <legend className="flex items-baseline gap-2">
            <span className="text-[0.72rem] font-semibold tracking-[0.09em] text-ink uppercase">{group.label}</span>
            <span className="text-[0.7rem] text-ink-faint">{group.hint}</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {group.facets.map((facet) => (
              <Chip
                key={facet.value}
                active={(filters[group.key] as string[]).includes(facet.value)}
                count={facet.count}
                onClick={() => toggle(group.key, facet.value)}
              >
                {facet.value}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )

  return (
    <div className="mx-auto max-w-[92rem] px-4 sm:px-6">
      <header className="py-8 sm:py-12">
        <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">The compendium</p>
        <h1 className="mt-2 max-w-3xl font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          {plants.length} medicinal plants, described the way a vaidya would.
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft text-balance-pretty">
          Search by name, by symptom, by the part that carries the medicine, by the region where it grows, or by
          the century it first turns up in writing. Every entry carries its Ayurvedic profile, its cultivation
          calendar, its recorded history, and the cautions that matter.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-line bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[14rem] flex-1">
            <Icon name="search" size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “cough”, “root”, “Himalayan”, or “Withania”…"
              className="h-11 w-full rounded-full border border-line bg-raised pr-10 pl-10 text-[0.9rem] outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <Icon name="close" size={15} />
              </button>
            )}
          </div>

          <Button
            variant={activeCount ? 'primary' : 'secondary'}
            icon="filter"
            className="lg:hidden"
            data-tour="facets"
            onClick={() => setPanelOpen(true)}
          >
            Filters{activeCount ? ` · ${activeCount}` : ''}
          </Button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label="Sort results"
            className="h-11 rounded-full border border-line bg-raised px-4 text-[0.82rem] text-ink-soft outline-none focus:border-accent"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <Segmented
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'grid', label: '', icon: 'grid' },
              { value: 'row', label: '', icon: 'list' },
            ]}
          />
        </div>

        {activeCount > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {FACET_GROUPS.flatMap((group) =>
              (filters[group.key] as string[]).map((value) => (
                <button
                  key={`${group.key}-${value}`}
                  onClick={() => toggle(group.key, value)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[0.72rem] font-medium text-accent-ink transition-opacity hover:opacity-75"
                >
                  {value}
                  <Icon name="close" size={12} />
                </button>
              )),
            )}
            {filters.bookmarkedOnly && (
              <button
                onClick={() => setFilters((f) => ({ ...f, bookmarkedOnly: false }))}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[0.72rem] font-medium text-accent-ink"
              >
                Saved only <Icon name="close" size={12} />
              </button>
            )}
            <button
              onClick={() => setFilters(emptyFilters)}
              className="ml-1 text-[0.72rem] text-ink-faint underline underline-offset-2 hover:text-ink"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div
            className="sticky top-40 max-h-[calc(100dvh-12rem)] overflow-y-auto pr-2 pb-8"
            data-tour="facets"
          >
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0 pb-16">
          <p className="mb-4 text-[0.8rem] text-ink-faint">
            <span className="font-semibold text-ink tabular-nums">{results.length}</span> of {plants.length} plants
            {query && <> matching “{query}”</>}
          </p>

          {results.length === 0 ? (
            <EmptyState
              icon="search"
              title="No plants matched"
              body="Try loosening a filter, or search for a symptom such as “fever”, a part such as “bark”, or a Sanskrit name."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setQuery('')
                    setFilters(emptyFilters)
                  }}
                >
                  Reset search
                </Button>
              }
            />
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 sm:gap-5">
              {results.map((plant, i) => (
                <PlantCard key={plant.id} plant={plant} index={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((plant, i) => (
                <PlantCard key={plant.id} plant={plant} layout="row" index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-[rgb(10_16_12/0.5)] backdrop-blur-sm" onClick={() => setPanelOpen(false)} tabIndex={-1} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-4xl border-t border-line bg-raised p-5 pb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setFilters(emptyFilters)}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPanelOpen(false)}>
                  Show {results.length}
                </Button>
              </div>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  )
}
