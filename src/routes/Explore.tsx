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
import { MaterialCard } from '../components/MaterialCard'
import { SHELVES, materials } from '../data/materials'
import { FLAG_LABELS, KIND_LABEL, legalFlags, materialMatches, type FlagKey } from '../lib/materialFlags'
import type { Shelf, SourceMaterial } from '../types/source'
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

/* The compendium holds two collections: the plants of the gardens, and the
 * microbial, animal and mineral materials of the Rasashala. "All" shows both,
 * one after the other; each set keeps its own filters, because "part used"
 * means nothing for mercury and "Schedule E(1)" nothing for most herbs. */
type Collection = 'all' | 'plants' | 'materials'

interface MaterialFilters {
  kinds: SourceMaterial['kind'][]
  shelves: Shelf[]
  flags: FlagKey[]
}

const emptyMaterialFilters: MaterialFilters = { kinds: [], shelves: [], flags: [] }

const MATERIAL_FLAGS: FlagKey[] = ['scheduleE1', 'wildlife', 'cites', 'exportRestricted', 'deposit', 'bioResource', 'notBioResource']

function count<T>(values: T[], of: (m: SourceMaterial) => T[]): { value: T; count: number }[] {
  return values
    .map((value) => ({ value, count: materials.filter((m) => of(m).includes(value)).length }))
    .filter((f) => f.count > 0)
}

const MATERIAL_FACETS = {
  kinds: count<SourceMaterial['kind']>(['microbe', 'animal', 'mineral'], (m) => [m.kind]),
  shelves: count<Shelf>(
    SHELVES.map((s) => s.id),
    (m) => [m.shelf],
  ),
  flags: count<FlagKey>(MATERIAL_FLAGS, (m) => legalFlags(m.ipr).map((f) => f.key)),
}

function filterMaterials(query: string, f: MaterialFilters, sort: SortMode): SourceMaterial[] {
  const out = materials.filter(
    (m) =>
      materialMatches(m, query) &&
      (!f.kinds.length || f.kinds.includes(m.kind)) &&
      (!f.shelves.length || f.shelves.includes(m.shelf)) &&
      (!f.flags.length || legalFlags(m.ipr).some((flag) => f.flags.includes(flag.key))),
  )
  return sort === 'alpha' ? [...out].sort((a, b) => a.name.localeCompare(b.name)) : out
}

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
  const [collection, setCollection] = useState<Collection>(() => {
    const requested = params.get('set')
    return requested === 'plants' || requested === 'materials' ? requested : 'all'
  })
  const [mFilters, setMFilters] = useState<MaterialFilters>(emptyMaterialFilters)

  // Keep the URL shareable without thrashing history on every keystroke.
  useEffect(() => {
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (filters.therapeutic.length === 1) next.set('treats', filters.therapeutic[0])
    if (filters.regions.length === 1) next.set('region', filters.regions[0])
    if (collection !== 'all') next.set('set', collection)
    setParams(next, { replace: true })
  }, [query, filters.therapeutic, filters.regions, collection, setParams])

  const results = useMemo(
    () => searchPlants(plants, { query, filters, sort, bookmarks }),
    [query, filters, sort, bookmarks],
  )

  const materialResults = useMemo(() => filterMaterials(query, mFilters, sort), [query, mFilters, sort])

  const plantFilterCount = countActiveFilters(filters)
  const materialFilterCount = mFilters.kinds.length + mFilters.shelves.length + mFilters.flags.length
  const activeCount =
    collection === 'plants' ? plantFilterCount : collection === 'materials' ? materialFilterCount : plantFilterCount + materialFilterCount
  const showPlants = collection !== 'materials'
  // In "All", a plant-only filter would leave the materials unfiltered and
  // looking like matches, so the materials step aside until it is cleared —
  // and the reverse for a material-only filter.
  const showMaterials = collection === 'materials' || (collection === 'all' && plantFilterCount === 0)
  const plantsShown = showPlants && !(collection === 'all' && materialFilterCount > 0)

  const toggleMaterial = <K extends keyof MaterialFilters>(key: K, value: MaterialFilters[K][number]) =>
    setMFilters((f) => {
      const list = f[key] as MaterialFilters[K][number][]
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })
  const clearAll = () => {
    setFilters(emptyFilters)
    setMFilters(emptyMaterialFilters)
  }

  const toggle = (key: FacetKey, value: string) =>
    setFilters((f) => {
      const list = f[key] as string[]
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      }
    })

  const materialPanel = (
    <div className="space-y-7">
      {(
        [
          { key: 'kinds', label: 'Kind', hint: 'What sort of source', facets: MATERIAL_FACETS.kinds, name: (v: string) => KIND_LABEL[v as SourceMaterial['kind']] },
          { key: 'shelves', label: 'Rasashala area', hint: 'Where it stands', facets: MATERIAL_FACETS.shelves, name: (v: string) => SHELVES.find((s) => s.id === v)?.title ?? v },
          { key: 'flags', label: 'The law', hint: 'Verified, with a citation', facets: MATERIAL_FACETS.flags, name: (v: string) => FLAG_LABELS[v as FlagKey] },
        ] as const
      ).map((group) => (
        <fieldset key={group.key} className="space-y-2.5">
          <legend className="flex items-baseline gap-2">
            <span className="text-[0.72rem] font-semibold tracking-[0.09em] text-ink uppercase">{group.label}</span>
            <span className="text-[0.7rem] text-ink-faint">{group.hint}</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {group.facets.map((facet) => (
              <Chip
                key={facet.value}
                active={(mFilters[group.key] as string[]).includes(facet.value)}
                count={facet.count}
                onClick={() => toggleMaterial(group.key, facet.value as never)}
              >
                {group.name(facet.value)}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )

  const plantPanel = (
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

  const filterPanel =
    collection === 'plants' ? (
      plantPanel
    ) : collection === 'materials' ? (
      materialPanel
    ) : (
      <div className="space-y-9">
        <section>
          <p className="mb-4 font-display text-[0.95rem] font-semibold">Plants</p>
          {plantPanel}
        </section>
        <section className="border-t border-line pt-6">
          <p className="mb-4 font-display text-[0.95rem] font-semibold">Rasashala materials</p>
          {materialPanel}
        </section>
      </div>
    )

  const heading =
    collection === 'materials'
      ? `${materials.length} source materials from the Rasashala — microbes, animal products and minerals.`
      : collection === 'plants'
        ? `${plants.length} medicinal plants, described the way a vaidya would.`
        : `${plants.length} medicinal plants and ${materials.length} other source materials, in one compendium.`

  return (
    <div className="mx-auto max-w-[92rem] px-4 sm:px-6">
      <header className="py-8 sm:py-12">
        <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">The compendium</p>
        <h1 className="mt-2 max-w-3xl font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft text-balance-pretty">
          {collection === 'materials'
            ? 'The yeasts that finish an asava, the honey and ghee that carry a medicine, the pearl, the coral and the metals of rasa shastra. Each is drawn in 3D and carries its legal layer, cited — search by name, by shelf, or by the law that applies.'
            : 'Search by name, by symptom, by the part that carries the medicine, by the region where it grows, or by the century it first turns up in writing. Every entry carries its Ayurvedic profile, its recorded history, its legal layer, and the cautions that matter.'}
        </p>
        <div className="mt-5">
          <Segmented
            value={collection}
            onChange={setCollection}
            options={[
              { value: 'all', label: 'Everything' },
              { value: 'plants', label: `Plants · ${plants.length}`, icon: 'leaf' },
              { value: 'materials', label: `Rasashala · ${materials.length}`, icon: 'flask' },
            ]}
          />
        </div>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-line bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[14rem] flex-1">
            <Icon name="search" size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                collection === 'materials'
                  ? 'Try “honey”, “mercury”, “Schedule E(1)”, or “yeast”…'
                  : 'Try “cough”, “root”, “Himalayan”, “coral”, or “Withania”…'
              }
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
            {(['kinds', 'shelves', 'flags'] as const).flatMap((key) =>
              (mFilters[key] as string[]).map((value) => (
                <button
                  key={`${key}-${value}`}
                  onClick={() => toggleMaterial(key, value as never)}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[0.72rem] font-medium text-accent-ink transition-opacity hover:opacity-75"
                >
                  {key === 'kinds'
                    ? KIND_LABEL[value as SourceMaterial['kind']]
                    : key === 'flags'
                      ? FLAG_LABELS[value as FlagKey]
                      : (SHELVES.find((s) => s.id === value)?.title ?? value)}
                  <Icon name="close" size={12} />
                </button>
              )),
            )}
            <button
              onClick={clearAll}
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
          {plantsShown && (
            <>
              <p className="mb-4 text-[0.8rem] text-ink-faint">
                <span className="font-semibold text-ink tabular-nums">{results.length}</span> of {plants.length} plants
                {query && <> matching “{query}”</>}
              </p>

              {results.length === 0 ? (
                collection === 'plants' && (
                  <EmptyState
                    icon="search"
                    title="No plants matched"
                    body="Try loosening a filter, or search for a symptom such as “fever”, a part such as “bark”, or a Sanskrit name."
                    action={
                      <Button
                        variant="primary"
                        onClick={() => {
                          setQuery('')
                          clearAll()
                        }}
                      >
                        Reset search
                      </Button>
                    }
                  />
                )
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
            </>
          )}

          {showMaterials && (
            <section className={collection === 'all' && plantsShown ? 'mt-14 border-t border-line pt-8' : undefined}>
              {collection === 'all' && (
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.66rem] font-semibold tracking-[0.2em] text-accent uppercase">From the Rasashala</p>
                    <h2 className="mt-1 font-display text-xl font-semibold">Microbes, animal products and minerals</h2>
                  </div>
                </div>
              )}
              <p className="mb-4 text-[0.8rem] text-ink-faint">
                <span className="font-semibold text-ink tabular-nums">{materialResults.length}</span> of {materials.length}{' '}
                materials
                {query && <> matching “{query}”</>}
              </p>
              {materialResults.length === 0 ? (
                collection === 'materials' && (
                  <EmptyState
                    icon="search"
                    title="No materials matched"
                    body="Try a name such as “honey” or “coral”, a kind such as “mineral”, or a law such as “CITES”."
                    action={
                      <Button
                        variant="primary"
                        onClick={() => {
                          setQuery('')
                          clearAll()
                        }}
                      >
                        Reset search
                      </Button>
                    }
                  />
                )
              ) : layout === 'grid' ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 sm:gap-5">
                  {materialResults.map((m, i) => (
                    <MaterialCard key={m.id} material={m} index={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {materialResults.map((m, i) => (
                    <MaterialCard key={m.id} material={m} layout="row" index={i} />
                  ))}
                </div>
              )}
            </section>
          )}

          {collection === 'all' && results.length === 0 && (!showMaterials || materialResults.length === 0) && (
            <EmptyState
              icon="search"
              title="Nothing matched"
              body="Try loosening a filter, or search for a symptom, a Sanskrit name, or a material such as “honey”."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setQuery('')
                    clearAll()
                  }}
                >
                  Reset search
                </Button>
              }
            />
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
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPanelOpen(false)}>
                  Show {(plantsShown ? results.length : 0) + (showMaterials ? materialResults.length : 0)}
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
