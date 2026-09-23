import { Link } from 'react-router-dom'
import type { SourceMaterial } from '../types/source'
import { useMaterialThumb } from '../three/materialThumbs'
import { KIND_LABEL, KIND_TONE, SHELF_LABEL, legalFlags } from '../lib/materialFlags'
import { Icon } from './ui/Icon'

/* ------------------------------------------------------------------ *
 * A Rasashala material in the compendium: PlantCard's counterpart.
 *
 * Where a plant card shows its botanical plate, this shows the material's
 * own 3D model, rendered once to a still (see three/materialThumbs.ts).
 * Where a plant card shows its uses, this shows the legal flags — for these
 * materials the law is the thing that differs most from one to the next.
 * ------------------------------------------------------------------ */

export function MaterialThumb({ material, className }: { material: SourceMaterial; className?: string }) {
  const src = useMaterialThumb(material)
  return src ? (
    <img src={src} alt={`${material.name}, drawn in 3D`} className={className} draggable={false} />
  ) : (
    // Until the picture is made, or where it cannot be: the kind's colour, and
    // a mark for what sort of thing it is.
    <span className={className} style={{ display: 'grid', placeItems: 'center', color: KIND_TONE[material.kind] }}>
      <Icon name={material.kind === 'microbe' ? 'eye' : material.kind === 'animal' ? 'drop' : 'flask'} size={28} />
    </span>
  )
}

export function MaterialCard({
  material,
  layout = 'grid',
  index = 0,
}: {
  material: SourceMaterial
  layout?: 'grid' | 'row'
  index?: number
}) {
  const flags = legalFlags(material.ipr)
  const tone = KIND_TONE[material.kind]

  if (layout === 'row') {
    return (
      <Link
        to={`/material/${material.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-line bg-raised px-3 py-3 transition-all duration-300 hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
      >
        <div
          className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl"
          style={{ background: `color-mix(in srgb, ${tone} 12%, var(--surface-sunken))` }}
        >
          <MaterialThumb material={material} className="size-16 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate font-display text-base font-semibold">{material.name}</h3>
            {material.scientific && <span className="truncate text-xs text-ink-faint italic">{material.scientific}</span>}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[0.82rem] text-ink-soft">{material.tagline}</p>
          <p className="mt-0.5 truncate text-[0.7rem] text-ink-faint">
            {KIND_LABEL[material.kind]} · {SHELF_LABEL[material.shelf]}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {flags.slice(0, 2).map((f) => (
            <span
              key={f.key}
              className="rounded-full px-2.5 py-1 text-[0.7rem] font-medium"
              style={{ background: `color-mix(in srgb, ${f.tone} 13%, transparent)`, color: f.tone }}
            >
              {f.label}
            </span>
          ))}
        </div>
        <Icon name="chevronRight" size={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
      </Link>
    )
  }

  return (
    <article className="group relative animate-fade-up" style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
      <Link
        to={`/material/${material.id}`}
        className="block overflow-hidden rounded-3xl border border-line bg-raised transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
      >
        <div
          className="grain relative aspect-[5/4] overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 50% 108%, color-mix(in srgb, ${tone} 24%, transparent) 0%, color-mix(in srgb, ${tone} 7%, var(--surface-sunken)) 62%, var(--surface-sunken) 100%)`,
          }}
        >
          <MaterialThumb
            material={material}
            className="absolute inset-0 size-full object-contain p-4 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide backdrop-blur-sm"
            style={{ background: 'color-mix(in srgb, var(--surface-raised) 78%, transparent)', color: tone }}
          >
            {KIND_LABEL[material.kind]}
          </span>
          <span
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.66rem] font-medium text-ink-soft backdrop-blur-sm"
            style={{ background: 'color-mix(in srgb, var(--surface-raised) 72%, transparent)' }}
            title="Stands in the Rasashala"
          >
            <Icon name="flask" size={12} />
            Rasashala
          </span>
        </div>

        <div className="space-y-2 p-4">
          <div>
            <h3 className="font-display text-[1.15rem] leading-tight font-semibold tracking-[-0.01em]">{material.name}</h3>
            <p className="text-[0.78rem] text-ink-faint italic">{material.scientific ?? material.sanskrit}</p>
          </div>
          <p className="line-clamp-2 text-[0.85rem] leading-relaxed text-ink-soft text-balance-pretty">{material.tagline}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {flags.slice(0, 3).map((f) => (
              <span
                key={f.key}
                className="rounded-full px-2 py-0.5 text-[0.68rem] font-medium"
                style={{ background: `color-mix(in srgb, ${f.tone} 13%, transparent)`, color: `color-mix(in srgb, ${f.tone} 82%, var(--ink))` }}
                title={`${f.meaning} (${f.cite})`}
              >
                {f.label}
              </span>
            ))}
          </div>
          <p className="flex items-baseline gap-1.5 border-t border-line pt-2 text-[0.7rem] text-ink-faint">
            <span className="font-semibold tracking-wide uppercase">Shelf</span>
            <span className="truncate">{SHELF_LABEL[material.shelf]}</span>
          </p>
        </div>
      </Link>
    </article>
  )
}
