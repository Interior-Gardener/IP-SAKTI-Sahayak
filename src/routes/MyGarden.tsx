import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gardenBeds, getPlant, plants } from '../data/plants'
import { tours } from '../data/tours'
import { PlantCard } from '../components/PlantCard'
import { BotanicalPlate } from '../components/BotanicalPlate'
import { Icon } from '../components/ui/Icon'
import { Button, EmptyState, Section, Segmented, cx } from '../components/ui/primitives'
import { useGarden, type Quality } from '../store/useGarden'
import { plantAsText } from '../lib/share'

type TabId = 'saved' | 'notes' | 'progress' | 'settings'

export default function MyGarden() {
  const [tab, setTab] = useState<TabId>('saved')
  const bookmarks = useGarden((s) => s.bookmarks)
  const notes = useGarden((s) => s.notes)
  const visited = useGarden((s) => s.visited)
  const completedTours = useGarden((s) => s.completedTours)

  const saved = useMemo(
    () => bookmarks.map((id) => getPlant(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [bookmarks],
  )
  const noteEntries = useMemo(
    () =>
      Object.values(notes)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((note) => ({ note, plant: getPlant(note.plantId) }))
        .filter((e) => e.plant),
    [notes],
  )

  const seenCount = visited.filter((id) => plants.some((p) => p.id === id)).length
  const progress = Math.round((seenCount / plants.length) * 100)

  const exportAll = () => {
    const body = saved
      .map((plant) => plantAsText(plant, notes[plant.id]?.body))
      .join('\n\n' + '─'.repeat(60) + '\n\n')
    const blob = new Blob([body || 'No plants saved yet.'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'vanaspati-my-garden.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-24 sm:px-6">
      <header className="py-8 sm:py-12">
        <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-accent uppercase">Your plot</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          My Garden
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
          Saved plants, study notes and progress — kept on this device, no account required.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-4" data-tour="progress">
          <Stat label="Plants met" value={`${seenCount}/${plants.length}`} icon="leaf" progress={progress} />
          <Stat label="Saved" value={String(saved.length)} icon="bookmark" />
          <Stat label="Notes written" value={String(noteEntries.length)} icon="note" />
          <Stat label="Tours finished" value={`${completedTours.length}/${tours.length}`} icon="route" />
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'saved', label: 'Saved', icon: 'bookmark' },
            { value: 'notes', label: 'Notes', icon: 'note' },
            { value: 'progress', label: 'Progress', icon: 'map' },
            { value: 'settings', label: 'Settings', icon: 'settings' },
          ]}
        />
        {tab === 'saved' && saved.length > 0 && (
          <Button variant="ghost" size="sm" icon="download" onClick={exportAll}>
            Export study sheet
          </Button>
        )}
      </div>

      <div key={tab} className="animate-fade-up">
        {tab === 'saved' &&
          (saved.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="Nothing saved yet"
              body="Tap the bookmark on any plant card, or on a plant's page, to keep it here for revision."
              action={
                <Link to="/explore">
                  <Button variant="primary">Browse the compendium</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 sm:gap-5">
              {saved.map((plant, i) => (
                <PlantCard key={plant.id} plant={plant} index={i} />
              ))}
            </div>
          ))}

        {tab === 'notes' &&
          (noteEntries.length === 0 ? (
            <EmptyState
              icon="note"
              title="No notes yet"
              body="Every plant page has a notes tab. Write what you want to remember — how to tell it apart, what part is used, what to avoid."
            />
          ) : (
            <div className="space-y-3">
              {noteEntries.map(({ note, plant }) =>
                plant ? (
                  <article key={note.plantId} className="rounded-3xl border border-line bg-raised p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-xl"
                        style={{ background: `color-mix(in srgb, ${plant.accent} 14%, transparent)` }}
                      >
                        <BotanicalPlate plant={plant} className="size-10" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link to={`/plant/${plant.id}`} className="font-display text-base font-semibold hover:underline">
                          {plant.name}
                        </Link>
                        <p className="text-[0.72rem] text-ink-faint">
                          Updated {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/plant/${plant.id}`} className="text-ink-faint transition-colors hover:text-ink">
                        <Icon name="chevronRight" size={18} />
                      </Link>
                    </div>
                    <p className="mt-3 border-t border-line pt-3 text-[0.9rem] leading-relaxed whitespace-pre-wrap text-ink-soft">
                      {note.body}
                    </p>
                  </article>
                ) : null,
              )}
            </div>
          ))}

        {tab === 'progress' && <ProgressTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  progress,
}: {
  label: string
  value: string
  icon: 'leaf' | 'bookmark' | 'note' | 'route'
  progress?: number
}) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-4">
      <div className="flex items-center gap-2 text-ink-faint">
        <Icon name={icon} size={15} />
        <span className="text-[0.72rem] tracking-[0.08em] uppercase">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function ProgressTab() {
  const visited = useGarden((s) => s.visited)
  const completedTours = useGarden((s) => s.completedTours)

  return (
    <div className="space-y-10">
      <Section title="Beds explored" subtitle="Which parts of the garden you have walked through.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gardenBeds.map((bed) => {
            const seen = bed.plantIds.filter((id) => visited.includes(id))
            const pct = Math.round((seen.length / bed.plantIds.length) * 100)
            return (
              <Link
                key={bed.id}
                to={`/?bed=${bed.id}`}
                className="group rounded-2xl border border-line bg-raised p-4 transition-all hover:-translate-y-0.5 hover:border-line-strong"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: bed.accent }} />
                  <h3 className="font-display text-[1rem] font-semibold">{bed.name}</h3>
                  <span className="ml-auto text-[0.78rem] text-ink-faint tabular-nums">
                    {seen.length}/{bed.plantIds.length}
                  </span>
                </div>
                <p className="mt-1 text-[0.78rem] text-ink-faint">{bed.theme}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: bed.accent }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bed.plantIds.map((id) => {
                    const plant = getPlant(id)
                    if (!plant) return null
                    const met = visited.includes(id)
                    return (
                      <span
                        key={id}
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[0.68rem]',
                          met ? 'text-[var(--surface-raised)]' : 'bg-sunken text-ink-faint',
                        )}
                        style={met ? { background: bed.accent } : undefined}
                      >
                        {plant.name}
                      </span>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      </Section>

      <Section title="Tours" subtitle="Guided walks you have completed.">
        <div className="grid gap-3 sm:grid-cols-2">
          {tours.map((tour) => {
            const done = completedTours.includes(tour.id)
            return (
              <Link
                key={tour.id}
                to={`/tours/${tour.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-4 transition-colors hover:border-line-strong"
              >
                <span
                  className={cx('grid size-9 shrink-0 place-items-center rounded-full')}
                  style={{
                    background: done ? tour.accent : 'var(--surface-sunken)',
                    color: done ? '#fff' : 'var(--ink-faint)',
                  }}
                >
                  <Icon name={done ? 'check' : 'route'} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[0.95rem] font-semibold">{tour.title}</span>
                  <span className="block text-[0.74rem] text-ink-faint">
                    {tour.stops.length} stops · {done ? 'Completed' : 'Not started'}
                  </span>
                </span>
                <Icon name="chevronRight" size={17} className="text-ink-faint" />
              </Link>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

const QUALITY_OPTIONS: { value: Quality; label: string; hint: string }[] = [
  { value: 'auto', label: 'Automatic', hint: 'Matches your device' },
  { value: 'high', label: 'High', hint: 'Most leaves, sharpest shadows' },
  { value: 'balanced', label: 'Balanced', hint: 'Good on most laptops' },
  { value: 'light', label: 'Light', hint: 'Best for older phones' },
]

function SettingsTab() {
  const { quality, setQuality, narration, setNarration, reducedMotion, setReducedMotion, resetProgress, setIntroSeen } =
    useGarden()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="font-display text-lg font-semibold">3D quality</h2>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          Plants are generated in your browser, so quality trades leaf count and shadow detail against frame rate.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {QUALITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setQuality(option.value)}
              className={cx(
                'rounded-2xl border p-4 text-left transition-all',
                quality === option.value
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-raised hover:border-line-strong',
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {option.label}
                {quality === option.value && <Icon name="check" size={15} className="text-accent" />}
              </span>
              <span className="mt-0.5 block text-[0.78rem] text-ink-faint">{option.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Show me around again</h2>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          The guided walkthrough and the cinematic opening can both be replayed at any time — useful when you are
          demonstrating the garden to somebody else.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon="cursor"
            onClick={() => window.dispatchEvent(new CustomEvent('vanaspati:walkthrough'))}
          >
            Replay the walkthrough
          </Button>
          <Button
            variant="secondary"
            icon="sparkle"
            onClick={() => {
              setIntroSeen(false)
              navigate('/garden')
            }}
          >
            Replay the opening
          </Button>
          <Button variant="ghost" icon="play" onClick={() => navigate('/')} title="Then press P">
            Presentation mode is P
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Accessibility</h2>
        <Toggle
          label="Narrate guided tours"
          hint="Reads each stop aloud using your browser's voice."
          checked={narration}
          onChange={setNarration}
        />
        <Toggle
          label="Reduce motion"
          hint="Stills the wind, the growth animation and camera drift."
          checked={reducedMotion}
          onChange={setReducedMotion}
        />
      </section>

      <section className="rounded-3xl border border-line bg-sunken p-5">
        <h2 className="font-display text-base font-semibold">Reset your garden</h2>
        <p className="mt-1 text-[0.85rem] text-ink-soft">
          Clears saved plants, notes, visit history and tour progress from this device. This cannot be undone.
        </p>
        {confirming ? (
          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-[#c2413f]"
              onClick={() => {
                resetProgress()
                setConfirming(false)
              }}
            >
              Yes, clear everything
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="mt-4" icon="reset" onClick={() => setConfirming(true)}>
            Reset
          </Button>
        )}
      </section>

      <section className="border-t border-line pt-6 text-[0.8rem] leading-relaxed text-ink-faint">
        <p>
          <strong className="text-ink-soft">About the plant data.</strong> Botanical descriptions, Ayurvedic
          properties and cultivation notes follow the conventions of the Ayurvedic Pharmacopoeia of India and
          standard field floras. The garden is an educational resource, not medical advice — consult a registered
          AYUSH practitioner before using any plant therapeutically.
        </p>
      </section>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-raised p-4">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-[0.78rem] text-ink-faint">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}
