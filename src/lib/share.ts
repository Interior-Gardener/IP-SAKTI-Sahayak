import type { Plant } from '../types/plant'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export function plantUrl(plant: Plant): string {
  if (typeof window === 'undefined') return `/plant/${plant.id}`
  return `${window.location.origin}${import.meta.env.BASE_URL}plant/${plant.id}`.replace(/([^:]\/)\/+/g, '$1')
}

export function shareText(plant: Plant): string {
  return `${plant.name} (${plant.botanical}) — ${plant.tagline}`
}

/** Native share sheet where available, clipboard everywhere else. */
export async function sharePlant(plant: Plant): Promise<ShareResult> {
  const url = plantUrl(plant)
  const text = shareText(plant)

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: `${plant.name} · Vanaspati`, text, url })
      return 'shared'
    } catch (error) {
      // A dismissed share sheet rejects with AbortError — not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export interface SocialTarget {
  id: string
  label: string
  href: string
}

export function socialTargets(plant: Plant): SocialTarget[] {
  const url = encodeURIComponent(plantUrl(plant))
  const text = encodeURIComponent(shareText(plant))
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${text}%20${url}` },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${url}&text=${text}` },
  ]
}

/** Serialises a plant's study material as a plain-text study note. */
export function plantAsText(plant: Plant, note?: string): string {
  const lines = [
    `${plant.name} — ${plant.botanical}`,
    `Family: ${plant.family}`,
    `Also called: ${Object.entries(plant.names)
      .map(([lang, value]) => `${value} (${lang})`)
      .join(', ')}`,
    '',
    plant.tagline,
    '',
    'HABITAT',
    plant.habitat,
    '',
    'PARTS USED',
    plant.partsUsed.join(', '),
    '',
    'AYURVEDIC PROPERTIES',
    `Rasa: ${plant.ayurvedic.rasa.join(', ')}`,
    `Guna: ${plant.ayurvedic.guna.join(', ')}`,
    `Virya: ${plant.ayurvedic.virya}`,
    `Vipaka: ${plant.ayurvedic.vipaka}`,
    `Dosha: ${plant.ayurvedic.dosha}`,
    '',
    'MEDICINAL USES',
    ...plant.uses.map((u) => `• ${u.title} — ${u.detail}`),
    '',
    'CULTIVATION',
    `Soil: ${plant.cultivation.soil}`,
    `Climate: ${plant.cultivation.climate}`,
    `Propagation: ${plant.cultivation.propagation}`,
    `Harvest: ${plant.cultivation.harvest}`,
    '',
    'PRECAUTIONS',
    ...plant.precautions.map((p) => `• ${p}`),
  ]
  if (note) lines.push('', 'MY NOTES', note)
  lines.push('', `Source: Vanaspati Virtual Herbal Garden — ${plantUrl(plant)}`)
  return lines.join('\n')
}
