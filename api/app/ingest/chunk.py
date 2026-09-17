"""Units -> retrieval chunks with contextual headers.

One chunk per section/rule/article. A long unit is split at its clause or
sub-section boundaries and each piece gets the finer locator, so an answer can
cite ``s.3(p)`` rather than all of ``s.3``. Pieces that are still too long are
cut by paragraph and keep the same locator.

Every chunk carries a contextual header (document title, chapter, locator,
heading). It is prepended for embedding and full-text search so a bare clause
like "(p) an invention which, in effect, is traditional knowledge ..." is still
found by "Patents Act section 3".
"""

import re
from dataclasses import dataclass

from app.ingest.structure import Unit

TARGET_CHARS = 2400  # ~600 tokens
MAX_CHARS = 3200

# "(p) an invention ...", "4[(b) an invention ...", "(1) Save as ...", "1." (treaty paragraph)
CLAUSE_RE = re.compile(r"^(?:\d{1,3}\[\s*)?\((?P<id>[a-z]{1,4}|\d{1,3}[A-Z]?)\)\s")
PARA_RE = re.compile(r"^(?P<id>\d{1,2})\.$")


@dataclass(frozen=True)
class Chunk:
    locator: str
    heading_path: str
    text: str
    context_header: str
    page: int


def _pieces(unit: Unit) -> list[tuple[str, list[str]]]:
    """Split a unit's lines at clause/paragraph starts: [(clause id or '', lines)]."""
    pieces: list[tuple[str, list[str]]] = [("", [])]
    for line in unit.lines:
        m = CLAUSE_RE.match(line) or PARA_RE.match(line)
        if m:
            pieces.append((m.group("id"), [line]))
        else:
            pieces[-1][1].append(line)
    return [(cid, lines) for cid, lines in pieces if lines]


def _clause_locator(base: str, ids: list[str]) -> str:
    ids = [i for i in ids if i]
    if not ids:
        return base
    fmt = (lambda i: f".{i}") if base.startswith("Art.") else (lambda i: f"({i})")
    return base + fmt(ids[0]) if len(ids) == 1 else f"{base}{fmt(ids[0])}–{fmt(ids[-1])}"


def _cut(text: str) -> list[str]:
    """Last resort for an over-long piece: cut at blank lines, then at line ends."""
    if len(text) <= MAX_CHARS:
        return [text]
    out, buf = [], ""
    for line in text.split("\n"):
        if buf and len(buf) + len(line) + 1 > TARGET_CHARS:
            out.append(buf)
            buf = ""
        buf = f"{buf}\n{line}" if buf else line
    if buf:
        out.append(buf)
    return out


def chunk_units(units: list[Unit], title: str) -> list[Chunk]:
    chunks: list[Chunk] = []
    for unit in units:
        heading_path = " > ".join(p for p in (unit.chapter, unit.locator, unit.heading) if p)
        groups: list[tuple[list[str], str]] = []
        if len(unit.text) <= MAX_CHARS:
            groups.append(([], unit.text))
        else:
            ids: list[str] = []
            buf: list[str] = []
            for cid, lines in _pieces(unit):
                piece = "\n".join(lines)
                if buf and len("\n".join(buf)) + len(piece) > TARGET_CHARS:
                    groups.append((ids, "\n".join(buf)))
                    ids, buf = [], []
                ids.append(cid)
                buf.append(piece)
            if buf:
                groups.append((ids, "\n".join(buf)))

        for ids, text in groups:
            locator = _clause_locator(unit.locator, ids)
            header = " — ".join(
                p for p in (title, unit.chapter, f"{locator} {unit.heading}".strip()) if p
            )
            for part in _cut(text):
                chunks.append(Chunk(locator, heading_path, part.strip(), header, unit.page))
    return chunks
