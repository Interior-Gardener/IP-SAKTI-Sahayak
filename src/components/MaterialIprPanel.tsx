import type { MaterialIPProfile } from '../types/material'
import { openSahayak } from '../lib/sahayak/client'
import { priorArtLinks } from '../lib/priorArt'
import { Icon } from './ui/Icon'
import { Button, cx } from './ui/primitives'

/* The legal layer of a plant (and later microbes, animal and mineral sources).
 * Every value is either backed by a source id from corpus/manifest.yaml or shown as
 * "Not yet verified" — the panel never fills a gap with a guess. */

type Value = boolean | 'unknown' | null | undefined

function Status({ value, yes, no }: { value: Value; yes: string; no: string }) {
  if (value === true) return <span className="font-medium text-ink">{yes}</span>
  if (value === false) return <span className="font-medium text-ink">{no}</span>
  return <span className="text-ink-faint italic">Not yet verified</span>
}

function Row({ label, children, cite }: { label: string; children: React.ReactNode; cite?: string | string[] }) {
  const cites = (Array.isArray(cite) ? cite : cite ? [cite] : []).filter((c) => c && c !== 'unknown')
  return (
    <div className="grid gap-1 border-t border-line py-3 sm:grid-cols-[12rem_1fr]">
      <dt className="text-[0.78rem] text-ink-faint">{label}</dt>
      <dd className="text-[0.88rem] text-ink-soft">
        {children}
        {cites.length > 0 && (
          <span className="ml-2 font-mono text-[0.68rem] text-accent" title="Source id in the corpus">
            [{cites.join(', ')}]
          </span>
        )}
      </dd>
    </div>
  )
}

export function MaterialIprPanel({
  profile,
  name,
  materialId,
  botanical,
  names,
}: {
  profile: MaterialIPProfile
  name: string
  materialId: string
  /** Scientific name and local names feed the prior-art search. */
  botanical?: string
  names?: Record<string, string>
}) {
  const links = priorArtLinks(botanical ?? name, { common: name, ...names })
  const verified = profile.lastVerified !== null
  const ask = (question: string) =>
    openSahayak({ question, context: [{ kind: profile.kind, id: materialId, label: name }] })

  return (
    <div className="space-y-5">
      <div
        className={cx(
          'flex gap-3 rounded-2xl p-4 text-[0.85rem]',
          verified ? 'bg-sunken text-ink-soft' : 'border border-dashed border-line-strong text-ink-soft',
        )}
      >
        <Icon name={verified ? 'shield' : 'alert'} size={18} className="mt-0.5 shrink-0 text-accent" />
        <p>
          {verified ? (
            <>Checked against the cited sources on {profile.lastVerified}. Information, not legal advice.</>
          ) : (
            <>
              The legal profile of {name} has not been verified against official sources yet, so nothing is asserted
              here. Ask Sahayak for a cited answer, or search the registries below.
            </>
          )}
        </p>
      </div>

      <dl>
        <Row label="Traditional knowledge" cite={profile.tk.cite}>
          {profile.tk.tkdl === 'documented' ? 'Documented in TKDL' : <span className="text-ink-faint italic">Not yet verified</span>}
          {profile.tk.classicalTexts.length > 0 && <span className="block text-[0.78rem]">{profile.tk.classicalTexts.join(', ')}</span>}
        </Row>
        <Row label="Patentability" cite={profile.patentability.cites}>
          {profile.patentability.note}
        </Row>
        <Row label="Landmark patents">
          {profile.patents.landmark.length ? (
            <ul className="space-y-1">
              {profile.patents.landmark.map((p) => (
                <li key={p.number}>
                  {p.title} — {p.office} {p.number} ({p.year}): {p.outcome}{' '}
                  <span className="font-mono text-[0.68rem] text-accent">[{p.cite}]</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-ink-faint italic">None recorded</span>
          )}
        </Row>
        <Row label="Geographical indications">
          {profile.gi.tags.length ? (
            profile.gi.tags.map((t) => (
              <span key={t.regNo} className="mr-2">
                {t.name} (GI {t.regNo}) <span className="font-mono text-[0.68rem] text-accent">[{t.cite}]</span>
              </span>
            ))
          ) : (
            <span className="text-ink-faint italic">None recorded</span>
          )}
        </Row>
        <Row label="Indian biological resource" cite={profile.biodiversity.cites}>
          <Status value={profile.biodiversity.indianBioResource} yes="Yes — biodiversity rules may apply" no="No" />
        </Row>
        <Row label="Normally traded commodity" cite={profile.biodiversity.cites}>
          <Status value={profile.biodiversity.normallyTradedCommodity} yes="Yes" no="No" />
        </Row>
        {profile.wildlife && (
          <Row label="Wildlife / CITES" cite={profile.wildlife.cites}>
            {profile.wildlife.citesListed === true ? (
              <span className="font-medium text-ink">
                Listed{profile.wildlife.protectedSchedule ? ` — ${profile.wildlife.protectedSchedule}` : ''}
              </span>
            ) : profile.wildlife.citesListed === false ? (
              <>Not in the Wild Life (Protection) Act's plant schedules</>
            ) : (
              <span className="text-ink-faint italic">Not yet verified</span>
            )}
          </Row>
        )}
        <Row label="Export restricted" cite={profile.export.cite}>
          <Status value={profile.export.restricted} yes="Restricted" no="Not restricted" />
        </Row>
        <Row label="Schedule E(1)" cite={profile.drugSchedules.cite}>
          <Status value={profile.drugSchedules.scheduleE1} yes="Listed" no="Not listed" />
        </Row>
        <Row label="Pharmacopoeia monograph" cite={profile.monographs.cite}>
          {profile.monographs.api ? (
            `Ayurvedic Pharmacopoeia of India, Vol. ${profile.monographs.api.volume}, Part ${profile.monographs.api.part}`
          ) : (
            <span className="text-ink-faint italic">Not yet verified</span>
          )}
        </Row>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon="scale" onClick={() => ask(`Can I patent a product based on ${name}?`)}>
          Ask Sahayak about {name}
        </Button>
        <Button size="sm" onClick={() => ask(`Do I need biodiversity approval to use ${name} commercially?`)}>
          Biodiversity approval?
        </Button>
      </div>

      <div className="text-[0.78rem] text-ink-faint">
        <p className="mb-1.5">Search for prior art yourself, using every name of {name}:</p>
        <ul className="space-y-1.5">
          {links.map((l) => (
            <li key={l.name}>
              <a className="font-medium text-accent hover:underline" href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>{' '}
              — {l.note}
              {l.query && <code className="mt-0.5 block rounded bg-sunken px-2 py-1 font-mono text-[0.7rem] text-ink-soft">{l.query}</code>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** One line for places with no room for the full panel: the garden's plant card and
 *  the walkable garden's hover board. `interactive` is off where the card follows the
 *  pointer and cannot be clicked. */
export function MaterialIprStrip({
  profile,
  name,
  materialId,
  interactive = true,
}: {
  profile: MaterialIPProfile
  name: string
  materialId: string
  interactive?: boolean
}) {
  const verified = profile.lastVerified !== null
  const label = verified ? `IP & law checked ${profile.lastVerified}` : 'IP & law: not yet verified'
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-[0.74rem] text-ink-soft">
      <Icon name="scale" size={14} className="shrink-0 text-accent" />
      <span className="flex-1 truncate">{label}</span>
      {interactive && (
        <button
          onClick={() =>
            openSahayak({
              question: `What IP and regulatory rules apply to products made from ${name}?`,
              context: [{ kind: profile.kind, id: materialId, label: name }],
            })
          }
          className="shrink-0 font-medium text-accent hover:underline"
        >
          Ask Sahayak
        </button>
      )}
    </div>
  )
}
