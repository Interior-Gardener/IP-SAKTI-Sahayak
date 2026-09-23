/* ------------------------------------------------------------------ *
 * The free official databases a question leads to, and what each one
 * actually offers a program.
 *
 * Most of them offer nothing: IP India, TKDL and PATENTSCOPE publish no
 * public query API, so Sahayak cannot search them for you and does not
 * pretend to. It links to them — with a ready-made query where the site
 * takes one in the URL — and says plainly where it cannot.
 *
 * Every URL here opened on 2026-09-23. IP India's trade mark search (503)
 * and its GI public search (404) did not, and are left out until they do.
 * Kept in the web app, not the API, so the list works with the API down.
 * ------------------------------------------------------------------ */

export type ApiStatus =
  /** No public programmatic access at all. */
  | 'none'
  /** Needs a registered login even to search by hand. */
  | 'registered'
  /** A public API exists, behind a free token. */
  | 'token'

export interface OfficialDatabase {
  id: string
  name: string
  issuer: string
  covers: string
  url: string
  /** A search link with `{q}` for the query, where the site takes one in the URL. */
  queryUrl?: string
  api: ApiStatus
  /** Said next to the link: what you can and cannot do there. */
  note: string
}

export const OFFICIAL_DATABASES: OfficialDatabase[] = [
  {
    id: 'ipindia-patents',
    name: 'IP India public search',
    issuer: 'Office of the Controller General of Patents, Designs and Trade Marks',
    covers: 'Indian patent applications and grants',
    url: 'https://iprsearch.ipindia.gov.in/PublicSearch/',
    api: 'none',
    note: 'No public API and no query URL: open it and paste the query into the search form.',
  },
  {
    id: 'tkdl',
    name: 'Traditional Knowledge Digital Library (TKDL)',
    issuer: 'CSIR',
    covers: 'Ayurveda, Unani, Siddha, Sowa Rigpa and yoga formulations, as prior art',
    url: 'https://www.tkdl.res.in/tkdl/langdefault/common/Home.asp?GL=Eng',
    api: 'registered',
    note: 'The home page is open; full search needs registered access. No public API.',
  },
  {
    id: 'patentscope',
    name: 'WIPO PATENTSCOPE',
    issuer: 'World Intellectual Property Organization',
    covers: 'PCT international applications and many national collections',
    url: 'https://patentscope.wipo.int/search/en/search.jsf',
    api: 'none',
    note: 'Form-based search with no stable query URL and no free public API: paste the query.',
  },
  {
    id: 'google-patents',
    name: 'Google Patents',
    issuer: 'Google (not an official register)',
    covers: 'Worldwide patent full texts',
    url: 'https://patents.google.com/',
    queryUrl: 'https://patents.google.com/?q={q}',
    api: 'none',
    note: 'Not an official register, but it takes a query in the link, so Sahayak can hand you a ready search.',
  },
  {
    id: 'wipo-lex',
    name: 'WIPO Lex',
    issuer: 'World Intellectual Property Organization',
    covers: 'IP laws and treaties of WIPO members, including India',
    url: 'https://www.wipo.int/wipolex/en/',
    api: 'none',
    note: 'Where several of the corpus texts came from; its PDFs sit behind signed links.',
  },
  {
    id: 'india-code',
    name: 'India Code',
    issuer: 'Legislative Department, Government of India',
    covers: 'Central Acts as amended, with their rules and notifications',
    url: 'https://www.indiacode.nic.in/',
    api: 'none',
    note: 'The official consolidated text of Indian Acts; search by hand.',
  },
  {
    id: 'cites-checklist',
    name: 'CITES Checklist',
    issuer: 'CITES Secretariat',
    covers: 'Which species are in which CITES appendix',
    url: 'https://checklist.cites.org/',
    api: 'none',
    note: 'Check a species before export; the Wild Life (Protection) Act carries these appendices as Schedule IV.',
  },
  {
    id: 'species-plus',
    name: 'Species+',
    issuer: 'UNEP-WCMC with the CITES Secretariat',
    covers: 'CITES listings, reservations and trade suspensions by species',
    url: 'https://speciesplus.net/',
    api: 'token',
    note: 'Offers an API to registered users; Sahayak does not call it yet and links instead.',
  },
]

export const API_LABEL: Record<ApiStatus, string> = {
  none: 'No public API',
  registered: 'Registered access only',
  token: 'API for registered users',
}

/** A ready search link, where the database takes one. */
export function queryLink(db: OfficialDatabase, query: string): string | null {
  return db.queryUrl ? db.queryUrl.replace('{q}', encodeURIComponent(query)) : null
}
