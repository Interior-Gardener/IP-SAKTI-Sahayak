import { Link } from 'react-router-dom'
import { materials } from '../../data/materials'
import { FLAG_LABELS, KIND_LABEL, KIND_TONE, legalFlags, type FlagKey } from '../../lib/materialFlags'
import { MaterialThumb } from '../MaterialCard'

/* ------------------------------------------------------------------ *
 * Which laws reach which Rasashala material, as a grid.
 *
 * One row per material, one column per flag, a dot where the verified
 * profile says the law applies. Built from the same `legalFlags` the cards
 * and pages use, so it cannot disagree with them — and an empty cell means
 * "not recorded", never "does not apply": the page says which.
 * ------------------------------------------------------------------ */

const COLUMNS: FlagKey[] = ['bioResource', 'notBioResource', 'deposit', 'wildlife', 'cites', 'exportRestricted', 'scheduleE1']

export function MaterialLawMatrix() {
  const rows = materials.map((m) => {
    const flags = legalFlags(m.ipr)
    return { material: m, flags: new Map(flags.map((f) => [f.key, f])) }
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-[0.78rem]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-raised pb-2 text-left font-medium text-ink-faint">Material</th>
            {COLUMNS.map((key) => (
              <th key={key} className="px-1 pb-2 text-center align-bottom font-medium text-ink-faint">
                <span className="inline-block max-w-[5.5rem] leading-tight">{FLAG_LABELS[key]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ material, flags }) => (
            <tr key={material.id} className="group">
              <td className="sticky left-0 border-t border-line bg-raised py-1.5 pr-3">
                <Link to={`/material/${material.id}`} className="flex items-center gap-2.5 hover:text-accent">
                  <span
                    className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg"
                    style={{ background: `color-mix(in srgb, ${KIND_TONE[material.kind]} 12%, var(--surface-sunken))` }}
                  >
                    <MaterialThumb material={material} className="size-8 object-contain" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{material.name}</span>
                    <span className="block truncate text-[0.68rem] text-ink-faint">{KIND_LABEL[material.kind]}</span>
                  </span>
                </Link>
              </td>
              {COLUMNS.map((key) => {
                const flag = flags.get(key)
                return (
                  <td key={key} className="border-t border-line text-center group-hover:bg-sunken">
                    {flag ? (
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ background: flag.tone }}
                        title={`${flag.label}: ${flag.meaning} (${flag.cite})`}
                      />
                    ) : (
                      <span className="inline-block size-1 rounded-full bg-line-strong" aria-label="not recorded" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
