"""Step 5 of /ask: check the draft answer against what was actually retrieved.

The verifier trusts nothing the model says about its sources (PLAN.md, Guard-out):
  1. every quoted span must really be in the chunk it points to
  2. every "section / rule / article N" in the prose must appear in a cited chunk
  3. citations may only point at chunks retrieved for this request (so never at a
     superseded version, which retrieval already excluded)
  4. legal assertions without citations are flagged
  5. naming the other jurisdiction's law without a source for it here is a leak: the answer is
     regenerated once, and dropped if it leaks again
Then a confidence score decides whether the answer is shown or withheld.
"""

import re
import unicodedata
from dataclasses import dataclass, field

from app.generate.answer import DraftAnswer
from app.schemas import Citation, Confidence

CONFIDENCE_FLOOR = 0.25

PROVISION_RE = re.compile(
    r"\b(?P<kind>sections?|secs?\.|s\.|rules?|articles?|art\.)\s*"
    r"(?P<num>\d{1,4}[A-Z]{0,3})(?:\.\d{1,2})?(?:\s?\([a-z0-9]{1,4}\))*",
    re.IGNORECASE,
)
ASSERTION_RE = re.compile(
    r"\b(shall|must|required|requires|prohibit|not patentable|not allowed|permitted|mandatory|"
    r"approval|licen[cs]e|liable|penalt|under (section|rule|article))\w*",
    re.IGNORECASE,
)


# Names that belong to the other pane. Mentioning one is a leak unless a cited chunk
# (from this jurisdiction) itself mentions it, e.g. an Indian rule referring to the PCT.
FOREIGN_TERMS = {
    "IN": re.compile(
        r"\b(TRIPS|WIPO|Nagoya|Convention on Biological Diversity|CBD|PCT|Patent Cooperation "
        r"Treaty|Budapest Treaty|GRATK|Paris Convention|European Union|EU Directive|FDA|"
        r"Health Canada|TGA|MHRA)\b"
    ),
    "INTL": re.compile(
        r"\b(Patents Act|Biological Diversity Act|Drugs and Cosmetics|Trade Marks Act|"
        r"Designs Act|Copyright Act|FSSAI|National Biodiversity Authority|NBA|CDSCO|AYUSH|"
        r"Indian Patent Office|Controller of Patents)\b"
    ),
}


TERM_ALIASES = {
    "PCT": ("Patent Cooperation Treaty",),
    "CBD": ("Convention on Biological Diversity",),
    "TRIPS": ("Trade-Related Aspects of Intellectual Property",),
    "NBA": ("National Biodiversity Authority",),
    "WIPO": ("World Intellectual Property Organization",),
}


# Hyphen and dash look-alikes models use in place of the source's plain hyphen, e.g.
# gpt-oss writes "benefit‑sharing" (non-breaking hyphen) for "benefit-sharing".
DASHES = "‐‑‒–—―−-"
ELLIPSIS_RE = re.compile(r"\.{3,}|…")
MIN_PIECE = 12  # a quote piece shorter than this proves nothing on its own


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower().replace("­", "")
    # Quotes and square brackets vary between the source (amendment markers such as
    # "4[(b) ...]") and the model's copy of it, so neither counts in the comparison.
    text = re.sub(r"[“”\"'‘’`\[\]]", "", text)
    text = re.sub(f"[{DASHES}]", "-", text)
    text = re.sub(r"\s*-\s*", "-", text)
    return re.sub(r"\s+", " ", text).strip(" .;:,")


def quote_in(quote: str, source: str) -> bool:
    """The quote appears in the source. An ellipsis ("...", "…") may stand for omitted
    words: every piece around it must then appear in the source, in order. At least one
    piece must be long enough to be real evidence, so a string of fragments like
    "Category…(A)…As per text" cannot pass on its short pieces."""
    haystack = _norm(source)
    pieces = [p for p in (_norm(x) for x in ELLIPSIS_RE.split(quote)) if p]
    if not pieces or max(len(p) for p in pieces) < MIN_PIECE:
        return False
    at = 0
    for piece in pieces:
        found = haystack.find(piece, at)
        if found < 0:
            return False
        at = found + len(piece)
    return True


@dataclass
class Verified:
    jurisdiction: str
    markdown: str
    citations: list[Citation]
    flags: list[str] = field(default_factory=list)
    leaked: bool = False
    confidence: Confidence | None = None

    @property
    def verified_count(self) -> int:
        return sum(c.verified for c in self.citations)


def provisions_in(text: str) -> set[str]:
    """Numbers of provisions named in prose, e.g. {"3", "158B", "27"}."""
    return {m.group("num").upper() for m in PROVISION_RE.finditer(text)}


def verify(draft: DraftAnswer) -> Verified:
    by_id = {str(r.chunk_id): r for r in draft.retrieved}
    citations: list[Citation] = []
    flags: list[str] = []
    leaked = False
    seen: set[tuple[str, str]] = set()

    for raw in draft.answer.citations:
        chunk = by_id.get(raw.chunk_id)
        if chunk is None:
            flags.append(f"cites a chunk that was not retrieved ({raw.chunk_id})")
            continue
        if (raw.chunk_id, raw.cited_text) in seen:
            continue
        seen.add((raw.chunk_id, raw.cited_text))
        ok = quote_in(raw.cited_text, chunk.text)
        if not ok:
            # Models sometimes attach a correct quote to the neighbouring chunk. If the exact
            # words are in another chunk retrieved for this jurisdiction, cite that one.
            moved = next(
                (r for r in draft.retrieved
                 if r.jurisdiction == draft.jurisdiction and quote_in(raw.cited_text, r.text)),
                None,
            )  # fmt: skip
            if moved is not None:
                chunk, ok = moved, True
            else:
                flags.append(f"quoted text not found in {chunk.source_id} {chunk.locator}")
        if chunk.jurisdiction != draft.jurisdiction:  # defensive; retrieval filters this
            leaked = True
            flags.append(f"{chunk.source_id} belongs to {chunk.jurisdiction}")
            ok = False
        url = chunk.source_url
        if chunk.page and url.lower().endswith(".pdf"):
            url += f"#page={chunk.page}"  # browsers open a PDF at this page
        citations.append(
            Citation(
                source_id=chunk.source_id,
                source_title=chunk.source_title,
                version_label=chunk.version_label,
                locator=chunk.locator,
                cited_text=raw.cited_text,
                url=url,
                jurisdiction=chunk.jurisdiction,
                doc_type=chunk.doc_type,
                verified=ok,
            )
        )

    # Rule 2: provisions named in prose must be backed by a verified cited chunk.
    cited_chunks = [by_id[c] for c in {r.chunk_id for r in draft.answer.citations} if c in by_id]
    backed = set()
    for chunk in cited_chunks:
        backed |= provisions_in(f"{chunk.locator} {chunk.context_header} {chunk.text}")
        backed |= {re.sub(r"^\D+", "", chunk.locator).split("(")[0].split(".")[0].upper()}
    for num in sorted(provisions_in(draft.answer.markdown) - backed):
        flags.append(f"mentions provision {num} without a citation that contains it")

    # Rule 5: the other jurisdiction's law named in this pane without a source for it here.
    cited_text = " ".join(f"{c.context_header} {c.text}" for c in cited_chunks)
    foreign = FOREIGN_TERMS.get(draft.jurisdiction)
    if foreign:
        stray = {m.group(0) for m in foreign.finditer(draft.answer.markdown)}
        low = cited_text.lower()
        stray = {
            t for t in stray if not any(a.lower() in low for a in (t, *TERM_ALIASES.get(t, ())))
        }
        if stray:
            leaked = True
            flags.append(f"mentions other-jurisdiction law: {', '.join(sorted(stray))}")

    # Rule 4: legal assertions with no verified support.
    paragraphs = [p for p in re.split(r"\n\s*\n", draft.answer.markdown) if p.strip()]
    asserting = sum(bool(ASSERTION_RE.search(p)) for p in paragraphs)
    verified = sum(c.verified for c in citations)
    if asserting and verified == 0:
        flags.append("states legal rules without any verified citation")
    elif asserting > 2 * max(verified, 1):
        flags.append("several legal statements rest on few citations")

    return Verified(draft.jurisdiction, draft.answer.markdown, citations, flags, leaked)


def score_confidence(v: Verified, draft: DraftAnswer) -> Confidence:
    reasons: list[str] = []
    hits = draft.retrieved
    if not hits:
        return Confidence(score=0.0, band="low", reasons=["no sources found"])

    # Retrieval agreement: how many top hits were found by more than one method.
    agreement = sum(len({k for k in h.signals if k != "rerank"}) > 1 for h in hits) / len(hits)
    named = any("locator" in h.signals for h in hits)
    retrieval = min(1.0, 0.5 + 0.5 * agreement + (0.2 if named else 0))
    if named:
        reasons.append("the provision you named was found")

    total = len(v.citations)
    coverage = v.verified_count / total if total else 0.0
    if total:
        reasons.append(f"{v.verified_count} of {total} citations verified")
    else:
        reasons.append("no citations")

    penalty = min(0.6, 0.2 * len(v.flags))
    if v.flags:
        reasons.append(f"{len(v.flags)} verifier warning(s)")

    # Reranker agreement: did the sources the model cited rank near the top?
    cited_ids = {c for c in (r.chunk_id for r in draft.answer.citations)}
    top_ids = {str(h.chunk_id) for h in hits[:3]}
    rerank = 1.0 if cited_ids & top_ids else 0.8

    score = round(retrieval * coverage * (1 - penalty) * rerank, 3)
    band = "high" if score >= 0.7 else "medium" if score >= 0.45 else "low"
    return Confidence(score=score, band=band, reasons=reasons)
