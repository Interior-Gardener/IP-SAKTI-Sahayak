/* Prior-art search pointers for a source material.
 *
 * Search engines are only as good as the names you give them: a patent on neem may
 * say "Azadirachta indica", "neem", "nimba" or "margosa". This builds one OR-query
 * from every name we hold, and says honestly where a site has no query link.
 *
 * Checked 2026-09-17: Google Patents accepts `?q=("a" OR b)`; TKDL's public home page
 * opens but its search needs a registered login; IP India's public search and WIPO
 * PATENTSCOPE are form-based with no stable query URL. */

export interface PriorArtLink {
  name: string
  url: string
  /** What the link does, shown next to it. */
  note: string
  /** The query text to paste where the site has no query URL. */
  query?: string
}

function quoted(term: string) {
  return /\s/.test(term) ? `"${term}"` : term
}

/** Unique, search-friendly names: scientific first, then the rest, no parentheticals. */
export function searchTerms(botanical: string, names: Record<string, string> = {}): string[] {
  const all = [botanical, ...Object.values(names)]
    .flatMap((n) => n.split(/[,/;]/))
    .map((n) => n.replace(/\(.*?\)/g, '').trim())
    // Latin-script names only: patent full texts are overwhelmingly English.
    .filter((n) => n.length > 2 && /^[A-Za-z][A-Za-z .'-]*$/.test(n))
  return [...new Map(all.map((n) => [n.toLowerCase(), n])).values()].slice(0, 6)
}

export function priorArtLinks(botanical: string, names: Record<string, string> = {}): PriorArtLink[] {
  const terms = searchTerms(botanical, names)
  const query = terms.map(quoted).join(' OR ')
  return [
    {
      name: 'Google Patents',
      url: `https://patents.google.com/?q=${encodeURIComponent(`(${query})`)}`,
      note: 'Worldwide patents searched for every name at once',
    },
    {
      name: 'IP India public search',
      url: 'https://iprsearch.ipindia.gov.in/PublicSearch/',
      note: 'Indian applications and grants; paste the query into the title/abstract field',
      query,
    },
    {
      name: 'WIPO PATENTSCOPE',
      url: 'https://patentscope.wipo.int/search/en/search.jsf',
      note: 'PCT applications; paste the query',
      query,
    },
    {
      name: 'TKDL',
      url: 'https://www.tkdl.res.in/tkdl/langdefault/common/Home.asp?GL=Eng',
      note: 'Traditional Knowledge Digital Library; full search needs registered access',
    },
  ]
}
