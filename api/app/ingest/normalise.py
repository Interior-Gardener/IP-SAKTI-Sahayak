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


def pdf_pages(path: Path, ocr: bool = True) -> tuple[list[str], int]:
    import pymupdf

    pages: list[str] = []
    ocr_count = 0
    with pymupdf.open(path) as doc:
        for page in doc:
            text = page.get_text("text")
            if ocr and len(text.strip()) < MIN_PAGE_CHARS:
                try:
                    # Needs Tesseract installed (it is in the API Docker image).
                    tp = page.get_textpage_ocr(language="eng", dpi=300, full=True)
                    text = page.get_text("text", textpage=tp)
                    ocr_count += 1
                except RuntimeError:
                    pass
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
        pages, ocr_pages = pdf_pages(raw, ocr=ocr)
    else:
        pages, ocr_pages = [html_text(raw)], 0

    body = "\n".join(f"{PAGE_MARK.format(n=i)}\n{text}" for i, text in enumerate(pages, 1))
    out = root / "corpus" / "normalised" / f"{source.id}.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body + "\n", encoding="utf-8")
    return NormaliseResult(source.id, out, len(pages), ocr_pages, len(body))
