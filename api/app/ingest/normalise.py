"""Raw file -> plain text in corpus/normalised/<id>.txt.

Pages are separated by a `<<page N>>` line so later stages can point back to
the page a section came from. Text is cleaned of control characters because
corpus text reaches the model and must not smuggle anything in.
"""

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from app.ingest.manifest import REPO, ManifestSource

PAGE_MARK = "<<page {n}>>"
PAGE_RE = re.compile(r"^<<page (\d+)>>$", re.MULTILINE)

# A page with less text than this is probably a scan and goes to OCR.
MIN_PAGE_CHARS = 40


@dataclass(frozen=True)
class NormaliseResult:
    source_id: str
    path: Path
    pages: int
    ocr_pages: int
    chars: int


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    # Drop control and format characters (zero-width, bidi overrides) except newline/tab.
    text = "".join(
        ch for ch in text if ch in "\n\t" or unicodedata.category(ch) not in ("Cc", "Cf")
    )
    text = text.replace("\t", " ")
    # Re-join words hyphenated across a line break: "inven-\ntion" -> "invention".
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[  ]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def render_table(rows: list[list[str | None]]) -> str:
    """A detected table as one labelled line per row.

    Plain text extraction prints a table cell by cell, which loses which column a value
    belongs to: the Rule 158B licensing table came out as a column of "As per text",
    "Not Required", "Required" with nothing tying them to their headings, and the
    assistant duly misread it. Writing each row as
    "Category: (A) Aqueous | Safety study: Not Required | ..." keeps the pairing, and the
    row is then quotable as a citation like any other sentence.
    """
    grid = [[(c or "").replace("\n", " ").strip() for c in row] for row in rows]
    grid = [r for r in grid if any(r)]
    if not grid:
        return ""

    def is_numbering(row: list[str]) -> bool:
        filled = [c for c in row if c]
        return bool(filled) and all(re.fullmatch(r"\d{1,2}[.)]?", c) for c in filled)

    # A heading longer than this is extraction debris (a neighbouring paragraph pulled into
    # the header cell); a label like that is worse than none.
    header = [c if len(c) <= 60 else "" for c in grid[0]]
    body: list[list[str]] = []
    for row in grid[1:]:
        if is_numbering(row):
            continue  # a "1 2 3 4" column-number row
        filled = [c for c in row if c]
        # A continuation of the heading: few cells, and the columns they sit in are still
        # unnamed (wide tables print their sub-headings on a second line).
        if not body and len(filled) <= len(row) / 2 and all(len(c) < 60 for c in filled):
            for i, cell in enumerate(row):
                if cell and i < len(header) and not header[i]:
                    header[i] = cell  # names a column the first heading row left blank
            continue
        body.append(row)

    lines = []
    for row in body:
        parts = []
        for i, cell in enumerate(row):
            if not cell:
                continue
            label = header[i] if i < len(header) and header[i] else f"column {i + 1}"
            parts.append(f"{label}: {cell}")
        if parts:
            lines.append(" | ".join(parts))
    return "\n".join(lines)


def is_tabular(table) -> bool:
    """A real data table: at least three columns, two body rows, and short cells. Prose in a
    bordered box is not worth reshaping into rows."""
    rows = [[(c or "").strip() for c in row] for row in table.extract()]
    rows = [r for r in rows if any(r)]
    if table.col_count < 3 or len(rows) < 3:
        return False
    cells = [c for r in rows for c in r if c]
    return bool(cells) and sum(len(c) for c in cells) / len(cells) < 60


# Words whose tops are within this many points of each other were printed on one line.
ROW_TOLERANCE = 3.0


def row_lines(page) -> str:
    """Rebuild a columnar page as one printed row per line.

    Plain extraction reads a status list column by column, so a country and its date of
    accession end up lines apart and nothing joins them: "India" on one line, "July 8, 2013"
    three lines below, with two other countries in between. Grouping words by the line they
    were printed on puts the row back together, which is what makes it quotable as a citation
    and what lets the membership lookup read it.
    """
    rows: dict[int, list] = {}
    for w in page.get_text("words"):
        rows.setdefault(round(w[1] / ROW_TOLERANCE), []).append(w)
    out = []
    for key in sorted(rows):
        words = sorted(rows[key], key=lambda w: w[0])
        out.append(" ".join(w[4] for w in words))
    return "\n".join(out)


def pdf_pages(
    path: Path, ocr: bool = True, tables: bool = True, layout: str = "text"
) -> tuple[list[str], int]:
    import pymupdf

    pages: list[str] = []
    ocr_count = 0
    with pymupdf.open(path) as doc:
        for page in doc:
            rendered: list[str] = []
            if tables:
                # "lines_strict" only accepts tables drawn with ruled borders. The default
                # text heuristic called ordinary statute pages tables and redacting them
                # deleted real law (the Wildlife Act lost thousands of lines in one run).
                found = page.find_tables(strategy="lines_strict").tables
                for table in found:
                    if not is_tabular(table):
                        continue
                    block = render_table(table.extract())
                    if block:
                        rendered.append(block)

            text = row_lines(page) if layout == "rows" else page.get_text("text")
            if ocr and len(text.strip()) < MIN_PAGE_CHARS and not rendered:
                try:
                    # Needs Tesseract installed (it is in the API Docker image).
                    tp = page.get_textpage_ocr(language="eng", dpi=300, full=True)
                    text = page.get_text("text", textpage=tp)
                    ocr_count += 1
                except RuntimeError:
                    pass
            if rendered:
                # Added after the page text, never in place of it: deleting the original
                # cells once cost a notification most of its body. The duplicate cells are
                # noise; the labelled rows are what make a table row readable.
                text = f"{text}\n" + "\n".join(rendered)
            pages.append(clean_text(text))
    return pages, ocr_count


def html_text(path: Path) -> str:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(path.read_bytes(), "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "noscript", "form"]):
        tag.decompose()
    return clean_text(soup.get_text("\n"))


def normalise_source(
    source: ManifestSource, root: Path = REPO, ocr: bool = True
) -> NormaliseResult:
    raw = source.raw_path(root)
    if not raw.exists():
        raise FileNotFoundError(f"{source.id}: no raw file at {raw}; run fetch first")

    if source.format == "pdf":
        pages, ocr_pages = pdf_pages(raw, ocr=ocr, layout=source.layout)
    else:
        pages, ocr_pages = [html_text(raw)], 0

    body = "\n".join(f"{PAGE_MARK.format(n=i)}\n{text}" for i, text in enumerate(pages, 1))
    out = root / "corpus" / "normalised" / f"{source.id}.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body + "\n", encoding="utf-8")
    return NormaliseResult(source.id, out, len(pages), ocr_pages, len(body))
