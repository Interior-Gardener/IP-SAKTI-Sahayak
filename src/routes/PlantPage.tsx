import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { bedByPlantId, getPlant, plants } from '../data/plants'
import { tours } from '../data/tours'
import { PlantViewer } from '../three/PlantViewer'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon, type IconName } from '../components/ui/Icon'
import { AyurvedicFingerprint } from '../components/viz/AyurvedicFingerprint'
import { Badge, Button, DataRow, cx } from '../components/ui/primitives'
import { useGarden } from '../store/useGarden'
import { useNarrator } from '../lib/speech'
import { plantAsText, sharePlant, socialTargets } from '../lib/share'
import type { PlateVariant } from '../lib/plate'
import type { HistoryKind, Plant } from '../types/plant'

type TabId = 'overview' | 'uses' | 'ayurveda' | 'history' | 'cultivation' | 'gallery' | 'notes'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'info' },
  { id: 'uses', label: 'Medicinal uses', icon: 'drop' },
  { id: 'ayurveda', label: 'Properties', icon: 'layers' },
  { id: 'history', label: 'History', icon: 'book' },
  { id: 'cultivation', label: 'Grow it', icon: 'seedling' },
  { id: 'gallery', label: 'Plates & audio', icon: 'eye' },
  { id: 'notes', label: 'My notes', icon: 'note' },
]

const DIFFICULTY_LABEL = ['', 'Beginner', 'Intermediate', 'Specialist']

/** Red only means red: a cultivated or common plant should not look alarming. */
const CONSERVATION_TONE: Record<string, string> = {
  'Critically Endangered': '#c2413f',
  Endangered: '#cf6a2e',
  Vulnerable: '#c9922e',
  'Least Concern': '#5a8f52',
  Cultivated: '#628a9a',
}

export default function PlantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const plant = getPlant(id)
  const [params, setParams] = useSearchParams()
  const [toast, setToast] = useState<string | null>(null)

  // The open tab lives in the URL, so a link can point at a plant's
  // Ayurvedic properties rather than just at the plant.
  const requested = params.get('tab') as TabId | null
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'overview'
  const setTab = (next: TabId) => {
    const url = new URLSearchParams(params)
    if (next === 'overview') url.delete('tab')
    else url.set('tab', next)
    setParams(url, { replace: true })
  }

  const bookmarked = useGarden((s) => (id ? s.bookmarks.includes(id) : false))
  const toggleBookmark = useGarden((s) => s.toggleBookmark)
  const markVisited = useGarden((s) => s.markVisited)
  const note = useGarden((s) => (id ? s.notes[id]?.body : undefined))
  const narrator = useNarrator()

  useEffect(() => {
    if (plant) markVisited(plant.id)
    window.scrollTo({ top: 0 })
  }, [plant, markVisited])

  /* Hush the reading when the page changes underneath it. Keyed on the plant,
   * not on the narrator: `useNarrator` returns a fresh object every render, so
   * depending on it ran this cleanup on every render and cancelled the very
   * speech it was starting. Keying on the id also covers moving from one plant
   * to the next, which reuses this component — nothing unmounts, so without
   * this Tulsi carries on being read out over Neem's page. */
  const { stop: hushNarration } = narrator
  useEffect(() => () => hushNarration(), [plant?.id, hushNarration])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const related = useMemo(() => {
    if (!plant) return []
    return plants
      .filter((p) => p.id !== plant.id)
      .map((p) => ({
        plant: p,
        score:
          p.therapeutic.filter((t) => plant.therapeutic.includes(t)).length * 3 +
          (p.family === plant.family ? 4 : 0) +
          p.regions.filter((r) => plant.regions.includes(r)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((r) => r.plant)
  }, [plant])

  const inTours = useMemo(
    () => (plant ? tours.filter((t) => t.stops.some((s) => s.plantId === plant.id)) : []),
    [plant],
  )

  if (!plant) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">That plant isn’t in the garden</h1>
        <p className="mt-2 text-sm text-ink-soft">It may have been renamed. Try the compendium.</p>
        <Button variant="primary" className="mt-6" onClick={() => navigate('/explore')}>
          Browse all plants
        </Button>
      </div>
    )
  }

  const bed = bedByPlantId.get(plant.id)
  const narrationText = `${plant.name}. ${plant.botanical}. ${plant.tagline} ${plant.description} Parts used: ${plant.partsUsed.join(', ')}. ${plant.uses.map((u) => `${u.title}. ${u.detail}`).join(' ')}`

  const onShare = async () => {
    const result = await sharePlant(plant)
    if (result === 'copied') setToast('Link copied to clipboard')
    if (result === 'failed') setToast('Could not share — copy the URL from the address bar')
  }

  const onDownload = () => {
    const blob = new Blob([plantAsText(plant, note)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${plant.id}-study-notes.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('Study notes downloaded')
  }

  return (
    <div className="mx-auto max-w-[92rem] px-4 pb-20 sm:px-6">
      <nav className="flex items-center gap-2 py-4 text-[0.78rem] text-ink-faint">
        <Link to="/explore" className="transition-colors hover:text-ink">
          Compendium
        </Link>
        <Icon name="chevronRight" size={13} />
        {bed && (
          <>
            <Link to={`/?bed=${bed.id}`} className="transition-colors hover:text-ink">
              {bed.name}
            </Link>
            <Icon name="chevronRight" size={13} />
          </>
        )}
        <span className="text-ink-soft">{plant.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* ---------------- 3D specimen ---------------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div data-tour="specimen">
            <PlantViewer
              plant={plant}
              className="aspect-square w-full rounded-4xl border border-line bg-sunken sm:aspect-[4/3] lg:aspect-square"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant={bookmarked ? 'primary' : 'secondary'}
              icon="bookmark"
              solidIcon={bookmarked}
              onClick={() => toggleBookmark(plant.id)}
            >
              {bookmarked ? 'Saved to My Garden' : 'Save to My Garden'}
            </Button>
            <Button variant="secondary" icon="share" onClick={onShare}>
              Share
            </Button>
            <Button
              variant="secondary"
              icon={narrator.speaking ? 'mute' : 'sound'}
              onClick={() => narrator.toggle(narrationText)}
              disabled={!narrator.supported}
              title={narrator.supported ? 'Read this plant aloud' : 'Speech synthesis is unavailable in this browser'}
            >
              {narrator.speaking ? 'Stop' : 'Listen'}
            </Button>
            <Button variant="ghost" icon="download" onClick={onDownload} title="Download as a plain-text study sheet">
              Notes
            </Button>
          </div>
        </div>

        {/* ---------------- Text ---------------- */}
        <div className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={plant.accent}>{plant.type}</Badge>
              <Badge tone={plant.accent}>{plant.family}</Badge>
              <Badge tone={CONSERVATION_TONE[plant.conservation]}>{plant.conservation}</Badge>
            </div>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
              {plant.name}
            </h1>
            <p className="mt-1 font-display text-lg text-ink-soft italic">{plant.botanical}</p>
            <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft text-balance-pretty">
              {plant.tagline}
            </p>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {Object.entries(plant.names)
                .slice(0, 4)
                .map(([lang, value]) => (
                  <div key={lang}>
                    <dt className="text-[0.65rem] tracking-[0.12em] text-ink-faint uppercase">{lang}</dt>
                    <dd className="text-[0.92rem] font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
          </header>

          <div className="scrollbar-none mt-8 -mb-px flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'relative flex shrink-0 items-center gap-1.5 px-3.5 py-3 text-[0.85rem] font-medium transition-colors',
                  tab === t.id ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
                )}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: plant.accent }} />
                )}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-fade-up pt-6">
            {tab === 'overview' && <OverviewTab plant={plant} />}
            {tab === 'uses' && <UsesTab plant={plant} />}
            {tab === 'ayurveda' && <AyurvedaTab plant={plant} />}
            {tab === 'history' && <HistoryTab plant={plant} />}
            {tab === 'cultivation' && <CultivationTab plant={plant} />}
            {tab === 'gallery' && <GalleryTab plant={plant} onCopy={() => setToast('Link copied to clipboard')} />}
            {tab === 'notes' && <NotesTab plant={plant} />}
          </div>

          {inTours.length > 0 && (
            <div className="mt-10 rounded-3xl border border-line bg-raised p-5">
              <p className="text-[0.72rem] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                Featured in guided tours
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {inTours.map((tour) => (
                  <Link
                    key={tour.id}
                    to={`/tours/${tour.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[0.82rem] transition-colors hover:border-line-strong"
                  >
                    <Icon name="route" size={15} style={{ color: tour.accent }} />
                    {tour.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Related ---------------- */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-xl font-semibold">Growing nearby</h2>
        <p className="mt-1 text-sm text-ink-soft">Plants that share a use, a family, or a habitat with {plant.name}.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {related.map((p) => (
            <Link
              key={p.id}
              to={`/plant/${p.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-raised p-3 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
            >
              <span
                className="grid size-14 shrink-0 place-items-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${p.accent} 12%, var(--surface-sunken))` }}
              >
                <BotanicalPlate plant={p} className="size-12" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[0.95rem] font-semibold">{p.name}</span>
                <span className="block truncate text-[0.72rem] text-ink-faint italic">{p.botanical}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className="animate-fade-up fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-raised px-4 py-2.5 text-[0.82rem] shadow-[var(--shadow-lift)] md:bottom-8"
        >
          {toast}
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Tabs ------------------------------- */

function OverviewTab({ plant }: { plant: Plant }) {
  return (
    <div className="space-y-8">
      <p className="text-[1rem] leading-[1.75] text-ink-soft text-balance-pretty">{plant.description}</p>

      <dl>
        <DataRow label="Habitat">{plant.habitat}</DataRow>
        <DataRow label="Morphology">{plant.morphology}</DataRow>
        <DataRow label="Parts used">{plant.partsUsed.join(' · ')}</DataRow>
        <DataRow label="Regions">{plant.regions.join(' · ')}</DataRow>
        <DataRow label="Systems">{plant.systems.join(' · ')}</DataRow>
        <DataRow label="Grow difficulty">
          <span className="inline-flex items-center gap-2">
            {DIFFICULTY_LABEL[plant.difficulty]}
            <span className="flex gap-0.5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="h-1.5 w-5 rounded-full"
                  style={{ background: n <= plant.difficulty ? plant.accent : 'var(--line)' }}
                />
              ))}
            </span>
          </span>
        </DataRow>
      </dl>

      <div className="rounded-3xl border border-line bg-sunken p-5">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Icon name="sparkle" size={16} style={{ color: plant.accent }} />
          Worth knowing
        </h3>
        <ul className="mt-3 space-y-2.5">
          {plant.facts.map((fact) => (
            <li key={fact} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
              <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: plant.accent }} />
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Colour-codes the timeline by what kind of evidence an entry rests on. */
const HISTORY_KIND: Record<HistoryKind, { label: string; icon: IconName }> = {
  text: { label: 'Text', icon: 'book' },
  archaeology: { label: 'Archaeology', icon: 'layers' },
  trade: { label: 'Trade', icon: 'route' },
  ritual: { label: 'Ritual', icon: 'sparkle' },
  science: { label: 'Science', icon: 'drop' },
  policy: { label: 'Policy', icon: 'alert' },
}

function HistoryTab({ plant }: { plant: Plant }) {
  const { history } = plant
  const events = useMemo(
    () => [...history.timeline].sort((a, b) => a.sortYear - b.sortYear),
    [history.timeline],
  )

  return (
    <div className="space-y-8">
      <p className="text-[1rem] leading-[1.75] text-ink-soft text-balance-pretty">{history.origin}</p>

      <dl>
        <DataRow label="Earliest record anywhere">
          {history.firstRecord.when} — {history.firstRecord.source}. {history.firstRecord.detail}
        </DataRow>
        <DataRow label="Enters Indian use">{history.originEra}</DataRow>
        <DataRow label="Name">{history.etymology}</DataRow>
        <DataRow label="How it travelled">{history.spread}</DataRow>
      </dl>

      <section>
        <h3 className="font-display text-base font-semibold">Timeline</h3>
        <ol className="mt-4 space-y-0">
          {events.map((event) => {
            const kind = HISTORY_KIND[event.kind]
            return (
              <li key={`${event.sortYear}-${event.title}`} className="group relative flex gap-4 pb-6 last:pb-0">
                {/* The thread running down the timeline, stopped at the last node. */}
                <span
                  className="absolute top-8 bottom-0 left-[0.94rem] w-px group-last:hidden"
                  style={{ background: 'var(--line)' }}
                  aria-hidden
                />
                <span
                  className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-raised"
                  style={{ color: plant.accent }}
                  title={kind.label}
                >
                  <Icon name={kind.icon} size={15} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-mono text-[0.78rem] font-medium" style={{ color: plant.accent }}>
                      {event.when}
                    </span>
                    <h4 className="font-display text-[1rem] font-semibold">{event.title}</h4>
                    <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.66rem] text-ink-faint">
                      {kind.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">
                    {event.detail}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-ink-faint italic">Source: {event.source}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-3xl border border-line bg-sunken p-5">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Icon name="sparkle" size={16} style={{ color: plant.accent }} />
          Standing and lore
        </h3>
        <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">{history.lore}</p>
      </section>

      <p className="border-t border-line pt-3 text-[0.78rem] leading-relaxed text-ink-faint">
        Dates in this tradition are contested — the classical Sanskrit medical texts cannot be pinned to a year, so
        ranges are given and each entry names the text, site or study it rests on. Treat this as an orientation to
        follow up, not a citation.
      </p>
    </div>
  )
}

function UsesTab({ plant }: { plant: Plant }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {plant.uses.map((use, i) => (
          <article key={use.title} className="rounded-3xl border border-line bg-raised p-5">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full font-mono text-[0.7rem] font-medium"
                style={{ background: `color-mix(in srgb, ${plant.accent} 16%, transparent)`, color: plant.accent }}
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-[1.05rem] font-semibold">{use.title}</h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">{use.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section>
        <h3 className="font-display text-base font-semibold">Classical preparations</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {plant.preparations.map((prep) => (
            <div key={prep.name} className="rounded-2xl border border-line bg-sunken p-4">
              <p className="font-display text-[0.95rem] font-semibold">{prep.name}</p>
              <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">{prep.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 p-5" style={{ borderColor: 'color-mix(in srgb, #c2413f 30%, transparent)' }}>
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#c2413f]">
          <Icon name="alert" size={17} />
          Cautions and contraindications
        </h3>
        <ul className="mt-3 space-y-2">
          {plant.precautions.map((p) => (
            <li key={p} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#c2413f]" />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-[0.78rem] text-ink-faint">
          This garden is an educational resource. Nothing here is a prescription — consult a registered AYUSH
          practitioner before using any plant therapeutically.
        </p>
      </section>
    </div>
  )
}

function AyurvedaTab({ plant }: { plant: Plant }) {
  const a = plant.ayurvedic

  return (
    <div className="space-y-6">
      <p className="text-[0.95rem] leading-relaxed text-ink-soft text-balance-pretty">
        Ayurvedic pharmacology describes a drug through five properties rather than an active ingredient. Together
        they predict how {plant.name} will behave in a particular body, which is why the same plant is prescribed
        differently to two people.
      </p>

      <div data-tour="fingerprint">
        <AyurvedicFingerprint plant={plant} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-raised p-4">
          <p className="font-display text-sm font-semibold tracking-wide" style={{ color: plant.accent }}>
            Guna
          </p>
          <p className="mt-1.5 text-[0.95rem] leading-snug">{a.guna.join(', ')}</p>
          <p className="mt-2 text-[0.75rem] text-ink-faint">
            Physical qualities such as heavy, light, dry or oily — they decide how the potency lands.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-raised p-4">
          <p className="font-display text-sm font-semibold tracking-wide" style={{ color: plant.accent }}>
            Rasa, in full
          </p>
          <p className="mt-1.5 text-[0.95rem] leading-snug">{a.rasa.join(', ')}</p>
          <p className="mt-2 text-[0.75rem] text-ink-faint">
            The order matters: the first taste listed is the dominant one.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-sunken p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.72rem] font-semibold tracking-[0.1em] text-ink-faint uppercase">Therapeutic areas</p>
          <Link
            to={`/compare?ids=${plant.id}`}
            className="inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-accent hover:underline"
          >
            <Icon name="layers" size={14} />
            Compare with another plant
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {plant.therapeutic.map((tag) => (
            <Link
              key={tag}
              to={`/explore?treats=${encodeURIComponent(tag)}`}
              className="rounded-full border border-line bg-raised px-3 py-1.5 text-[0.8rem] transition-colors hover:border-line-strong"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function CultivationTab({ plant }: { plant: Plant }) {
  const c = plant.cultivation
  return (
    <div className="space-y-7">
      <dl>
        <DataRow label="Soil">{c.soil}</DataRow>
        <DataRow label="Climate">{c.climate}</DataRow>
        <DataRow label="Propagation">{c.propagation}</DataRow>
        <DataRow label="Spacing">{c.spacing}</DataRow>
        <DataRow label="Water">{c.water}</DataRow>
        <DataRow label="Harvest">{c.harvest}</DataRow>
      </dl>

      <div className="rounded-3xl border border-line p-5" style={{ background: `color-mix(in srgb, ${plant.accent} 6%, var(--surface-raised))` }}>
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Icon name="seedling" size={17} style={{ color: plant.accent }} />
          Grower’s notes
        </h3>
        <ul className="mt-3 space-y-2.5">
          {c.tips.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
              <Icon name="check" size={15} className="mt-0.5 shrink-0" style={{ color: plant.accent }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const PLATES: { variant: PlateVariant; title: string }[] = [
  { variant: 'habit', title: 'Whole plant · habit' },
  { variant: 'leaf', title: 'Leaf study · venation' },
  { variant: 'flower', title: 'Inflorescence' },
  { variant: 'part', title: 'Medicinal part' },
]

function GalleryTab({ plant, onCopy }: { plant: Plant; onCopy: () => void }) {
  const narrator = useNarrator()
  const [track, setTrack] = useState<string | null>(null)

  const tracks = [
    { id: 'intro', label: 'Introduction', text: `${plant.name}, ${plant.botanical}. ${plant.description}` },
    { id: 'ident', label: 'How to identify it', text: `${plant.morphology} It grows in: ${plant.habitat}` },
    {
      id: 'uses',
      label: 'Medicinal uses',
      text: plant.uses.map((u) => `${u.title}. ${u.detail}`).join(' '),
    },
    {
      id: 'grow',
      label: 'How to grow it',
      text: `Soil: ${plant.cultivation.soil} Climate: ${plant.cultivation.climate} Propagation: ${plant.cultivation.propagation} Harvest: ${plant.cultivation.harvest}`,
    },
  ]

  return (
    <div className="space-y-8">
      {plant.photos.length > 0 && (
        <section>
          <h3 className="font-display text-base font-semibold">Photographs</h3>
          <p className="mt-1 text-[0.85rem] text-ink-soft">
            The living plant, so the drawn plate can be checked against it. Every photograph is freely licensed and
            stored with the site, and each one credits its photographer and links back to where it came from.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plant.photos.map((photo) => (
              <figure key={photo.src} className="overflow-hidden rounded-2xl border border-line bg-sunken">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="space-y-1 border-t border-line px-3 py-2 text-[0.72rem] leading-snug text-ink-faint">
                  <span className="block text-ink-soft">{photo.alt}</span>
                  <span className="block">
                    {photo.credit} · {photo.license} ·{' '}
                    <a
                      href={photo.source}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      source
                    </a>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-display text-base font-semibold">Specimen plates</h3>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          Drawn from the same morphological data that grows the 3D model — click any plate to enlarge.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATES.map((p) => (
            <figure
              key={p.variant}
              className="group overflow-hidden rounded-2xl border border-line bg-sunken transition-colors hover:border-line-strong"
            >
              <div
                className="grain aspect-[6/7]"
                style={{ background: `color-mix(in srgb, ${plant.accent} 8%, var(--surface-sunken))` }}
              >
                <BotanicalPlate plant={plant} variant={p.variant} framed className="size-full p-2" />
              </div>
              <figcaption className="border-t border-line px-3 py-2 text-[0.72rem] text-ink-faint">{p.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold">Audio descriptions</h3>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          {narrator.supported
            ? 'Narrated by your browser’s voice — useful for revising with your eyes closed.'
            : 'Speech synthesis is not available in this browser.'}
        </p>
        <div className="mt-4 space-y-2">
          {tracks.map((t) => {
            const playing = narrator.speaking && track === t.id
            return (
              <button
                key={t.id}
                disabled={!narrator.supported}
                onClick={() => {
                  if (playing) {
                    narrator.stop()
                    setTrack(null)
                  } else {
                    narrator.speak(t.text)
                    setTrack(t.id)
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-raised px-4 py-3 text-left transition-colors hover:border-line-strong disabled:opacity-50"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ background: playing ? plant.accent : `color-mix(in srgb, ${plant.accent} 14%, transparent)`, color: playing ? '#fff' : plant.accent }}
                >
                  <Icon name={playing ? 'pause' : 'play'} size={15} />
                </span>
                <span className="flex-1 text-[0.9rem] font-medium">{t.label}</span>
                <span className="text-[0.72rem] text-ink-faint">
                  ≈{Math.max(1, Math.round(t.text.split(/\s+/).length / 150))} min
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="font-display text-base font-semibold">Share this plant</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {socialTargets(plant).map((target) => (
            <a
              key={target.id}
              href={target.href}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-line bg-raised px-4 py-2 text-[0.82rem] transition-colors hover:border-line-strong"
            >
              {target.label}
            </a>
          ))}
          <Button
            variant="ghost"
            onClick={async () => {
              await sharePlant(plant)
              onCopy()
            }}
          >
            Copy link
          </Button>
        </div>
      </section>
    </div>
  )
}

function NotesTab({ plant }: { plant: Plant }) {
  const stored = useGarden((s) => s.notes[plant.id])
  const setNote = useGarden((s) => s.setNote)
  const deleteNote = useGarden((s) => s.deleteNote)
  const [draft, setDraft] = useState(stored?.body ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(stored?.body ?? ''), [stored?.body, plant.id])

  // Autosave a moment after typing stops.
  useEffect(() => {
    if (draft === (stored?.body ?? '')) return
    const timer = setTimeout(() => {
      setNote(plant.id, draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    }, 700)
    return () => clearTimeout(timer)
  }, [draft, stored?.body, plant.id, setNote])

  const prompts = [
    `How would I tell ${plant.name} apart from a look-alike?`,
    `Which part is used, and why that part?`,
    `What is the one caution I must remember?`,
  ]

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="plant-note" className="font-display text-base font-semibold">
          Study notes
        </label>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          Saved on this device only. They travel with you to My Garden and into the downloaded study sheet.
        </p>
      </div>

      <div className="relative">
        <textarea
          id="plant-note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          placeholder={`Notes on ${plant.name}…`}
          className="w-full resize-y rounded-3xl border border-line bg-raised p-4 text-[0.92rem] leading-relaxed outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
        />
        <span
          className={cx(
            'absolute right-4 bottom-4 text-[0.72rem] transition-opacity duration-300',
            saved ? 'text-accent opacity-100' : 'opacity-0',
          )}
        >
          Saved
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.78rem] text-ink-faint">Prompts:</span>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setDraft((d) => (d ? `${d}\n\n${prompt}\n` : `${prompt}\n`))}
            className="rounded-full border border-line px-3 py-1.5 text-[0.76rem] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            {prompt}
          </button>
        ))}
      </div>

      {stored && (
        <div className="flex items-center justify-between border-t border-line pt-4 text-[0.78rem] text-ink-faint">
          <span>Last saved {new Date(stored.updatedAt).toLocaleString()}</span>
          <button
            onClick={() => {
              deleteNote(plant.id)
              setDraft('')
            }}
            className="text-[#c2413f] hover:underline"
          >
            Delete note
          </button>
        </div>
      )}
    </div>
  )
}
