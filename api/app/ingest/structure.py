"""Normalised text -> structural units (sections, rules, articles, schedules).

Built for the conventions of the texts in corpus/manifest.yaml, seen in the
normalised files:

- Indian statutes and rules (India Code, CDSCO, NBA):
    ``3. What are not inventions.—The following ...``
    ``3[11A. Publication of applications.—4[(1) Save as ...``   (amendment footnote prefix)
    ``1[158(B) Guidelines for issue of license ...``            (D&C Rules numbering)
    ``17. Revocation of access or approval.- (1) The ...``      (NBA hyphen style)
  The arrangement-of-sections table at the top has no dash, so it is skipped.
- Treaties: a bare ``Article 27`` line, then a title line, then numbered paragraphs.
- Amendment footnotes at page bottoms (``3. Subs. by s. 6, ibid., ... (w.e.f. 1-4-2024).``)
  are dropped from the text; they say how the text changed, not what it says.
- Anything without recognisable structure (manuals) falls back to one unit per page.
"""

import re
from dataclasses import dataclass, field

from app.ingest.normalise import PAGE_RE

SECTION_RE = re.compile(
    r"^(?:\d{1,3}\[\s*)?"  # amendment footnote marker, e.g. "3["
    r"(?P<num>\d{1,4}(?:[A-Z]{1,3}|\([A-Z]{1,2}\)|-[A-Z]{1,2})?)"  # 3, 11A, 158(B), 158-B
    r"\.?\s+"
    r"(?P<title>[^\n—–]{2,160}?)"
    r"(?:\.\s?[—–]|\.\s?-\s|\.-|—)"  # ".—" (India Code), ". – " / ".- " (NBA), bare "—"
)
ARTICLE_RE = re.compile(r"^Article\s+(?P<num>\d{1,3}(?:[a-z]|bis|ter|quater)?)\s*$", re.IGNORECASE)
# A heading on its own line with no dash (NDCT Rules style): "3. Central Licencing Authority".
BARE_HEADING_RE = re.compile(r"^(?P<num>\d{1,3}[A-Z]?)\.\s+(?P<title>[A-Z][^.—]{2,120})$")
# The start of a numbered heading whose dash may be on the next line.
HEADING_START_RE = re.compile(
    r"^(?:\d{1,3}\[\s*)?\d{1,4}(?:[A-Z]{1,3}|\([A-Z]{1,2}\)|-[A-Z]{1,2})?\.?\s+[A-Z]"
)
DASH_RE = re.compile(r"\.\s?[—–]|\.\s?-\s|\.-|—")
# "SCHEDULE III", "THE FIRST SCHEDULE.", "1[SCHEDULE - H", "SCHEDULE — I", "2[SCHEDULE E(1)",
# "SCHEDULE C (1)", "SCHEDULE-E". The separator may be a space or a dash, and the line may end on
# a stray "." or "]" left by the gazette. "THE SCHEDULES" and "SCHEDULE OF FEES" are not headings.
SCHEDULE_RE = re.compile(
    r"^(?:\d{1,3}\[\s*)?(?:THE\s+)?(?P<ordinal>[A-Z]+\s+)?SCHEDULE"
    r"(?:(?:\s*[—–-]\s*|\s+)(?P<suffix>[A-Z0-9][A-Z0-9()\-]{0,11}(?:\s*\([A-Z0-9]{1,4}\))?))?"
    r"\s*[.\]]*\s*$"
)


def schedule_name(m: re.Match[str]) -> str:
    """`1[SCHEDULE - H` -> "Schedule H": separator dropped, suffix kept as written."""
    parts = [(m.group("ordinal") or "").strip(), "Schedule", (m.group("suffix") or "").strip()]
    return " ".join(p for p in parts if p).title()


CHAPTER_RE = re.compile(r"^(?:\d{1,3}\[\s*)?(?P<name>(?:CHAPTER|PART)\s+[IVXLC0-9A-Z]{1,8})\]?\s*$")
FOOTNOTE_RE = re.compile(
    r"^\d{1,3}\.\s+(?:Subs\.|Ins\.|Omitted|Cls?\.|The words|Added|Rep\.|Renumbered|Sub-section|"
    r"Sub-clause|Proviso|Section|Chapter|Explanation|Clause|Entry|Item|Words|Figures)\s.*"
    r"(?:w\.e\.f\.|ibid|Act\s+\d+\s+of\s+\d{4}|G\.S\.R\.|S\.O\.)"
    # Free-form notes: "2. Certain words omitted by s. 2, ibid. (w.e.f. 1-1-2005)".
    r"|^\d{1,3}\.\s.{0,160}\b(?:omitted|ins\.|inserted|subs\.?|substituted|added|renumbered|"
    r"repealed)\s.{0,120}(?:w\.e\.f\.|ibid)",
    re.IGNORECASE,
)
NOISE_RE = re.compile(r"^(?:IndiaCode|Page \d+ of \d+)$")
PAGE_NUMBER_RE = re.compile(r"^\d{1,4}$")
DEVANAGARI_RE = re.compile(r"[ऀ-ॿ]")

STATUTE_PREFIX = {
    "statute": "s.",
    "rules": "Rule ",
    "regulations": "Reg. ",
    "notification": "para ",
}


@dataclass
class Unit:
    """One citable piece: a section, rule, article or schedule (or a page as fallback)."""

    locator: str
    heading: str
    chapter: str
    page: int
    lines: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return "\n".join(self.lines).strip()


def _devanagari_share(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    return sum(bool(DEVANAGARI_RE.match(c)) for c in letters) / len(letters) if letters else 0.0


END_OF_TEXT_RE = re.compile(r"^STATEMENT OF OBJECTS AND REASONS|^NOTES ON CLAUSES", re.IGNORECASE)


def iter_lines(normalised: str, join_bare_numbers: bool = False) -> list[tuple[int, str]]:
    """(page, line) pairs with page markers, footnotes and page furniture removed, and
    headings that wrapped onto a second line joined back together."""
    page = 1
    raw: list[tuple[int, str]] = []
    for line in normalised.splitlines():
        m = PAGE_RE.match(line)
        if m:
            page = int(m.group(1))
            continue
        line = line.strip()
        if END_OF_TEXT_RE.match(line):
            break  # the bill's explanatory notes reuse section numbers
        if not line or NOISE_RE.match(line) or FOOTNOTE_RE.match(line):
            continue
        raw.append((page, line))

    out: list[tuple[int, str]] = []
    i = 0
    while i < len(raw):
        page, line = raw[i]
        nxt = raw[i + 1][1] if i + 1 < len(raw) else ""
        if re.fullmatch(r"Article", line, re.IGNORECASE) and re.fullmatch(r"\d{1,3}\w{0,6}", nxt):
            out.append((page, f"{line} {nxt}"))
            i += 2
            continue
        if PAGE_NUMBER_RE.match(line):
            i += 1  # a bare number that isn't an article number is a page number
            continue
        if (
            join_bare_numbers
            and re.fullmatch(r"(?:\d{1,3}\[\s*)?\d{1,4}[A-Z]{0,3}\.", line)
            and nxt[:1].isupper()
        ):
            # NBA gazettes put the rule number alone on a line: "16." / "Procedure for ...".
            raw[i + 1] = (page, f"{line} {nxt}")
            i += 1
            continue
        dash = DASH_RE.search(nxt)
        if (
            HEADING_START_RE.match(line)
            and not DASH_RE.search(line)
            and not line.endswith((".", ";", ":", ","))
            and dash
            and dash.start() < 120
        ):
            out.append((page, f"{line} {nxt}"))
            i += 2
            continue
        out.append((page, line))
        i += 1
    return out


def parse_units(normalised: str, doc_type: str, language: str = "en") -> list[Unit]:
    def tidy(units: list[Unit]) -> list[Unit]:
        if language == "en":
            # Bilingual gazettes carry a Hindi copy first; the English one is indexed.
            # Filter before de-duplicating, or the Hindi "Rule 1" would win.
            units = [u for u in units if u.text and _devanagari_share(u.text) < 0.3]
        units = [u for u in units if len(u.text) >= 20]
        if doc_type in STATUTE_PREFIX:
            return _keep_first(units)
        return _keep_first_substantial(units)

    if doc_type in ("treaty", "regulation"):
        units = tidy(_parse_articles(normalised))
    elif doc_type in STATUTE_PREFIX:
        prefix = STATUTE_PREFIX[doc_type]
        dashed = tidy(_parse_sections(normalised, prefix))
        bare = tidy(_parse_bare_headings(normalised, prefix))
        # Documents use one heading style or the other; the style that finds more
        # distinct sections is the right one.
        units = dashed if len(dashed) >= len(bare) else bare
    else:
        units = []
    if not units:  # structure not recognised: fall back to pages
        units = tidy(_parse_pages(normalised))
    return units


def _parse_sections(normalised: str, prefix: str) -> list[Unit]:
    units: list[Unit] = []
    chapter = ""
    pending_chapter: str | None = None
    current: Unit | None = None
    for page, line in iter_lines(normalised, join_bare_numbers=True):
        cm = CHAPTER_RE.match(line)
        if cm:
            pending_chapter = cm.group("name")
            continue
        if pending_chapter is not None:
            # The line after "CHAPTER II" is its title, when it is in capitals.
            if line.isupper() and len(line) < 120:
                chapter = f"{pending_chapter} {line.title()}"
                pending_chapter = None
                continue
            chapter, pending_chapter = pending_chapter, None

        sm = SCHEDULE_RE.match(line)
        if sm and current is not None:
            name = schedule_name(sm)
            current = Unit(name, name, chapter, page)
            units.append(current)
            continue

        m = SECTION_RE.match(line)
        if m:
            num = m.group("num").replace("-", "").replace("(", "").replace(")", "")
            current = Unit(f"{prefix}{num}", m.group("title").strip(" .]"), chapter, page)
            units.append(current)
            rest = line[m.end() :].strip()
            if rest:
                current.lines.append(rest)
            continue
        if current is not None:
            current.lines.append(line)
    return units


def _keep_first(units: list[Unit]) -> list[Unit]:
    """Dash-style headings only occur in the body, so a repeat is later material
    (an appended schedule or form reusing numbers): the first one is the section."""
    seen: set[str] = set()
    out = []
    for u in units:
        if u.locator not in seen:
            seen.add(u.locator)
            out.append(u)
    return out


def _keep_first_substantial(units: list[Unit], min_chars: int = 150) -> list[Unit]:
    """Treaties repeat article numbers twice over: a contents list (tiny entries) and
    annexes that restart at Article 1. Keep the first copy with real text, else the
    longest."""
    chosen: dict[str, Unit] = {}
    for u in units:
        prev = chosen.get(u.locator)
        if prev is None or (len(prev.text) < min_chars and len(u.text) > len(prev.text)):
            chosen[u.locator] = u
    keep = {id(u) for u in chosen.values()}
    return [u for u in units if id(u) in keep]


def _parse_bare_headings(normalised: str, prefix: str) -> list[Unit]:
    """Headings alone on a line, accepted only when numbered in sequence (1, 2, 3 ...)
    so that ordinary numbered list items are not mistaken for rules."""
    units: list[Unit] = []
    current: Unit | None = None
    last = 0
    for page, line in iter_lines(normalised):
        sm = SCHEDULE_RE.match(line)
        if sm and current is not None:
            # Schedules restart numbering, so list items inside them must not become rules.
            name = schedule_name(sm)
            current = Unit(name, name, "", page)
            units.append(current)
            last = 10_000
            continue
        m = BARE_HEADING_RE.match(line)
        if m:
            n = int(re.match(r"\d+", m.group("num")).group())
            # Small gaps are normal: a heading merged with its body text, or an omitted rule.
            if last <= n <= last + 3 or (n == 1 and last > 3):
                last = n
                current = Unit(f"{prefix}{m.group('num')}", m.group("title").strip(), "", page)
                units.append(current)
                continue
        if current is not None:
            current.lines.append(line)
    return units


def _parse_articles(normalised: str) -> list[Unit]:
    units: list[Unit] = []
    current: Unit | None = None
    expect_title = False
    for page, line in iter_lines(normalised):
        m = ARTICLE_RE.match(line)
        if m:
            current = Unit(f"Art. {m.group('num').lower()}", "", "", page)
            units.append(current)
            expect_title = True
            continue
        if current is None:
            continue
        if expect_title:
            expect_title = False
            if len(line) < 120 and not line.endswith((".", ";", ":")):
                current.heading = line
                continue
        current.lines.append(line)
    return units


def _parse_pages(normalised: str) -> list[Unit]:
    units: dict[int, Unit] = {}
    for page, line in iter_lines(normalised):
        units.setdefault(page, Unit(f"p.{page}", "", "", page)).lines.append(line)
    return list(units.values())
