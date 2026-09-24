"""Who is a party to which treaty, read from WIPO's own status lists.

Why this exists. "Can an Indian applicant use the Hague route?" is settled by India's
*absence* from a list, and an absence is the one thing retrieval cannot find: there is no
text for the question to match on. Asked it, the assistant said it could not confirm
membership — correct, since guessing is worse, but the answer was sitting in the corpus.

So the lists are read here instead, by code, with no model in the loop:

* Every row of the status list is parsed out of ``corpus/normalised/`` — the same committed
  text every quote is checked against, not a live call to WIPO.
* **A negative is only returned from a parse that is provably complete.** Each list prints
  its own party count ("(Total: 85)"); if the rows parsed do not match it, this module
  raises rather than report a country as absent. A missed row would otherwise turn into a
  confident, wrong "not a party".
* What comes back carries the row as printed, the source id and the page, so the statement
  is as citable as any other in this project.

The country names are taken from the lists themselves, so there is no separate gazetteer to
drift: a country this project can be asked about is one that appears in some official list.
"""

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.ingest.manifest import REPO

#: "India ....... – July 8, 2013": a name, a dotted leader of any length, then the columns.
ROW_RE = re.compile(r"^(?P<name>\S[^.]*?)\s*\.{2,}\s*(?P<rest>.*\S)\s*$")
#: Footnote markers are printed hard against the year ("July 8, 20135,6,8").
DATE_RE = re.compile(r"[A-Z][a-z]+ \d{1,2}, \d{4}")
DASH_RE = re.compile(r"[–—-]")
TOTAL_RE = re.compile(r"\(Total:\s*(\d+)\)")
STATUS_RE = re.compile(r"^Status on (.+?)\s*$")
PAGE_RE = re.compile(r"^<<page (\d+)>>$")
#: Trailing footnote markers on a country name ("Belgium5", "United Kingdom12, 13").
NAME_NOTES_RE = re.compile(r"\d+(,\s*\d+)*$")


@dataclass(frozen=True)
class TreatyList:
    source_id: str
    #: What the treaty is called in an answer.
    treaty: str
    #: The date column that decides membership of the route, counted from 0.
    column: int
    #: Lowercase words in a question that mean this treaty.
    aliases: tuple[str, ...]


LISTS: tuple[TreatyList, ...] = (
    TreatyList(
        "intl-madrid-parties",
        "the Madrid Protocol",
        1,  # column 0 is the 1891 Agreement, column 1 the 1989 Protocol
        ("madrid", "madrid protocol", "madrid system", "international registration of marks"),
    ),
    TreatyList(
        "intl-hague-parties",
        "the Hague Agreement",
        0,
        (
            "hague",
            "hague system",
            "hague agreement",
            "geneva act",
            "international registration of industrial designs",
        ),
    ),
)


@dataclass(frozen=True)
class Row:
    country: str
    #: One entry per date column, as printed; "" where the list prints a dash.
    dates: tuple[str, ...]
    #: The line exactly as printed, which is what an answer quotes.
    line: str
    page: int


@dataclass(frozen=True)
class ListStatus:
    source_id: str
    #: "July 14, 2026" — the day WIPO's list speaks as of.
    status: str
    rows: tuple[Row, ...]
    declared_total: int


@dataclass(frozen=True)
class RegisterCheck:
    """One country against one treaty, settled from the list."""

    treaty: str
    country: str
    listed: bool
    date: str
    source_id: str
    locator: str
    status: str
    total: int

    def sentence(self) -> str:
        where = f"WIPO's list of parties to {self.treaty}, as at {self.status}"
        if self.listed and self.date:
            return f"{where}, gives {self.country} as a party from {self.date}."
        if self.listed:
            return f"{where}, lists {self.country}, with no date in the column that matters."
        return (
            f"{self.country} does not appear among the {self.total} parties in {where}. "
            f"The route is therefore not open on a connection with {self.country} alone."
        )


class IncompleteList(RuntimeError):
    """The parse does not account for every party the list says it has."""


def _clean_name(name: str) -> str:
    return NAME_NOTES_RE.sub("", name).strip().rstrip(",").strip()


@lru_cache(maxsize=8)
def read_list(source_id: str, root: Path = REPO) -> ListStatus:
    """Parse a status list out of the committed normalised text.

    Raises IncompleteList when the rows found do not match the total the document prints,
    because every answer built on this leans on the parse being exhaustive.
    """
    text = (root / "corpus" / "normalised" / f"{source_id}.txt").read_text(encoding="utf-8")
    rows: list[Row] = []
    status = ""
    total = 0
    page = 1
    for line in text.splitlines():
        marker = PAGE_RE.match(line)
        if marker:
            page = int(marker.group(1))
            continue
        line = line.strip()
        if not status:
            found = STATUS_RE.match(line)
            if found:
                status = found.group(1)
        seen_total = TOTAL_RE.search(line)
        if seen_total and not total:
            total = int(seen_total.group(1))
        row = ROW_RE.match(line)
        if not row or not DATE_RE.search(row.group("rest")):
            continue
        dates: list[str] = []
        for token in re.finditer(rf"{DATE_RE.pattern}|{DASH_RE.pattern}", row.group("rest")):
            value = token.group(0)
            dates.append("" if DASH_RE.fullmatch(value) else value)
        rows.append(Row(_clean_name(row.group("name")), tuple(dates), line, page))

    if not total or len(rows) != total:
        raise IncompleteList(
            f"{source_id}: parsed {len(rows)} parties, the list declares {total or 'none'}"
        )
    return ListStatus(source_id, status, tuple(rows), total)


def _match_country(rows: tuple[Row, ...], country: str) -> Row | None:
    wanted = country.casefold()
    for row in rows:
        name = row.country.casefold()
        if name == wanted or name.startswith(f"{wanted} (") or wanted in name.split(" ("):
            return row
    return None


def check(source_id: str, country: str) -> RegisterCheck:
    """Settle one country against one list."""
    entry = next(t for t in LISTS if t.source_id == source_id)
    listing = read_list(source_id)
    row = _match_country(listing.rows, country)
    date = ""
    if row and entry.column < len(row.dates):
        date = row.dates[entry.column]
    return RegisterCheck(
        treaty=entry.treaty,
        country=row.country if row else country,
        listed=row is not None and bool(date or not row.dates),
        date=date,
        source_id=source_id,
        locator=f"p.{row.page}" if row else f"p.{listing.rows[0].page}",
        status=listing.status,
        total=listing.declared_total,
    )


@lru_cache(maxsize=1)
def known_countries() -> tuple[str, ...]:
    """Every name any list prints, longest first so "Republic of Korea" beats "Korea"."""
    names: set[str] = set()
    for entry in LISTS:
        for row in read_list(entry.source_id).rows:
            names.add(row.country)
    return tuple(sorted(names, key=len, reverse=True))


def checks_for(question: str) -> list[RegisterCheck]:
    """The register checks a question calls for: a treaty named, and a country named."""
    asked = question.casefold()
    treaties = [t for t in LISTS if any(a in asked for a in t.aliases)]
    if not treaties:
        return []
    countries = [c for c in known_countries() if c.casefold() in asked]
    # A question naming no country is about the route itself, and India is who asks.
    if not countries:
        countries = ["India"]
    out: list[RegisterCheck] = []
    for treaty in treaties:
        for country in countries[:2]:
            try:
                out.append(check(treaty.source_id, country))
            except IncompleteList:
                continue  # never answer from a parse that cannot be trusted
    return out
