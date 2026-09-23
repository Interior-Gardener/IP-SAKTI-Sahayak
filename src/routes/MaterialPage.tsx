import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getMaterial, materials } from '../data/materials'
import { MaterialViewer } from '../three/MaterialViewer'
import { MaterialIprPanel } from '../components/MaterialIprPanel'
import { MaterialThumb } from '../components/MaterialCard'
import { Icon, type IconName } from '../components/ui/Icon'
import { Badge, Button, cx } from '../components/ui/primitives'
import { useNarrator } from '../lib/speech'
import { openSahayak } from '../lib/sahayak/client'
import { useWorkbench } from '../store/useWorkbench'
import { KIND_LABEL, KIND_TONE, SHELF_LABEL, legalFlags } from '../lib/materialFlags'

/* ------------------------------------------------------------------ *
 * One Rasashala material, on a page of its own — the plant page's
 * counterpart, so a pot of ghee can be linked to, searched for and read
 * the way a plant can, without walking the hall to find it.
 *
 * Deliberately fewer tabs than a plant: a material carries what it is,
 * how the tradition uses it, and its legal layer. Nothing is invented to
 * fill a tab a plant has and a mineral does not.
 * ------------------------------------------------------------------ */

type TabId = 'overview' | 'iplaw'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'info' },
  { id: 'iplaw', label: 'IP & Law', icon: 'scale' },
]

export default function MaterialPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const material = getMaterial(id)
  const [params, setParams] = useSearchParams()
  const [toast, setToast] = useState<string | null>(null)
  const narrator = useNarrator()
  const addToBench = useWorkbench((s) => s.add)
  const onBench = useWorkbench((s) => s.items.some((i) => i.id === id))

  const requested = params.get('tab') as TabId | null
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'overview'
  const setTab = (next: TabId) => {
    const url = new URLSearchParams(params)
    if (next === 'overview') url.delete('tab')
    else url.set('tab', next)
    setParams(url, { replace: true })
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  // Hush the reading when the page changes underneath it, as the plant page does.
  const { stop: hushNarration } = narrator
  useEffect(() => () => hushNarration(), [id, hushNarration])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const shelfmates = useMemo(
    () => (material ? materials.filter((m) => m.shelf === material.shelf && m.id !== material.id) : []),
    [material],
  )

  if (!material) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">That material isn’t in the Rasashala</h1>
        <p className="mt-2 text-sm text-ink-soft">It may have been renamed. Try the compendium.</p>
        <Button variant="primary" className="mt-6" onClick={() => navigate('/explore?set=materials')}>
          Browse the materials
        </Button>
      </div>
    )
  }

  const flags = legalFlags(material.ipr)
  const tone = KIND_TONE[material.kind]
  const narrationText = `${material.name}. ${material.scientific ?? ''}. ${material.tagline} ${material.description} Classical use: ${material.classicalUse}`

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('Link copied to clipboard')
    } catch {
      setToast('Could not copy — use the URL in the address bar')
    }
  }

  return (
    <div className="mx-auto max-w-[92rem] px-4 pb-20 sm:px-6">
      <nav className="flex items-center gap-2 py-4 text-[0.78rem] text-ink-faint">
        <Link to="/explore?set=materials" className="transition-colors hover:text-ink">
          Compendium
        </Link>
        <Icon name="chevronRight" size={13} />
        <Link to={`/rasashala?open=${material.id}`} className="transition-colors hover:text-ink">
          {SHELF_LABEL[material.shelf]}
        </Link>
        <Icon name="chevronRight" size={13} />
        <span className="text-ink-soft">{material.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* ---------------- 3D specimen ---------------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MaterialViewer
            material={material}
            className="aspect-square w-full rounded-4xl border border-line bg-sunken sm:aspect-[4/3] lg:aspect-square"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant={onBench ? 'secondary' : 'primary'}
              icon="flask"
              disabled={onBench}
              onClick={() => {
                addToBench({ kind: material.kind, id: material.id, label: material.name })
                setToast(`${material.name} is on the workbench`)
              }}
            >
              {onBench ? 'On the workbench' : 'Add to workbench'}
            </Button>
            {onBench && (
              <Link to="/workbench">
                <Button variant="primary" iconRight="arrowRight">
                  Open the workbench
                </Button>
              </Link>
            )}
            <Link to={`/rasashala?open=${material.id}`}>
              <Button variant="secondary" icon="compass">
                See it in the Rasashala
              </Button>
            </Link>
            <Button variant="secondary" icon="share" onClick={onShare}>
              Share
            </Button>
            <Button
              variant="secondary"
              icon={narrator.speaking ? 'mute' : 'sound'}
              onClick={() => narrator.toggle(narrationText)}
              disabled={!narrator.supported}
            >
              {narrator.speaking ? 'Stop' : 'Listen'}
            </Button>
          </div>
        </div>

        {/* ---------------- Text ---------------- */}
        <div className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tone}>{KIND_LABEL[material.kind]}</Badge>
              <Badge tone={tone}>{SHELF_LABEL[material.shelf]}</Badge>
              {flags.map((f) => (
                <Badge key={f.key} tone={f.tone} title={`${f.meaning} — ${f.cite}`}>
                  {f.label}
                </Badge>
              ))}
            </div>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
              {material.name}
            </h1>
            {material.scientific && <p className="mt-1 font-display text-lg text-ink-soft italic">{material.scientific}</p>}
            <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft text-balance-pretty">{material.tagline}</p>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {Object.entries(material.names).map(([lang, value]) => (
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
                {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: tone }} />}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-fade-up pt-6">
            {tab === 'overview' && (
              <div className="space-y-6">
                <p className="text-[0.95rem] leading-relaxed text-ink-soft text-balance-pretty">{material.description}</p>
                <section className="rounded-3xl bg-sunken p-5">
                  <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">Classical use</p>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{material.classicalUse}</p>
                  <p className="mt-3 text-[0.72rem] text-ink-faint">
                    Described, never prescribed: nothing on this page is a preparation method or a dose.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-lg font-semibold">The law, at a glance</h2>
                  {flags.length === 0 ? (
                    <p className="mt-2 text-[0.86rem] text-ink-soft">
                      No schedule, listing or restriction is recorded for this material. That is what the verified sources
                      say, or that nobody has checked yet — the IP &amp; Law tab says which.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {flags.map((f) => (
                        <li key={f.key} className="flex gap-3 rounded-2xl border border-line bg-raised p-3.5">
                          <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: f.tone }} />
                          <div className="min-w-0">
                            <p className="text-[0.88rem] font-semibold">{f.label}</p>
                            <p className="text-[0.82rem] leading-relaxed text-ink-soft">{f.meaning}</p>
                            <p className="mt-1 font-mono text-[0.7rem] text-ink-faint">{f.cite}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => setTab('iplaw')}
                    className="mt-3 inline-flex items-center gap-1 text-[0.82rem] font-medium text-accent hover:underline"
                  >
                    The full cited profile <Icon name="arrowRight" size={14} />
                  </button>
                </section>

                <Button
                  variant="secondary"
                  icon="scale"
                  onClick={() =>
                    openSahayak({
                      question: `What IP and regulatory rules apply to ${material.name} in an Ayurvedic product?`,
                      context: [{ kind: material.kind, id: material.id, label: material.name }],
                    })
                  }
                >
                  Ask Sahayak about {material.name}
                </Button>
              </div>
            )}
            {tab === 'iplaw' && (
              <MaterialIprPanel
                profile={material.ipr}
                name={material.name}
                materialId={material.id}
                botanical={material.scientific}
                names={material.names}
              />
            )}
          </div>
        </div>
      </div>

      {shelfmates.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-xl font-semibold">On the same shelf</h2>
          <p className="mt-1 text-sm text-ink-soft">What stands beside {material.name} in the {SHELF_LABEL[material.shelf].toLowerCase()}.</p>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {shelfmates.slice(0, 8).map((m) => (
              <Link
                key={m.id}
                to={`/material/${m.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-raised p-3 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
              >
                <span
                  className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl"
                  style={{ background: `color-mix(in srgb, ${KIND_TONE[m.kind]} 12%, var(--surface-sunken))` }}
                >
                  <MaterialThumb material={m} className="size-14 object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[0.95rem] font-semibold">{m.name}</span>
                  <span className="block truncate text-[0.72rem] text-ink-faint italic">{m.scientific ?? m.sanskrit}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
