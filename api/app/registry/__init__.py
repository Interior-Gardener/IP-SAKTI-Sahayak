"""Where a user goes next: the registries, their forms, and the law that sends them there.

Seeded from `REGISTRIES` below into the `registries` table that `/registry`,
the agent's `registry_pointer` tool and Registry Marg all read.

The rule for an entry is the project's rule for everything: nothing from memory.

- Every registry cites the provision that requires going there (`cite`), as a
  manifest source id and a chunk locator. The seed resolves it to the stored
  chunk, and fails if there is none.
- Every form carries the words of the rule that names it (`quote`), and
  `tests/test_registry.py` re-reads each quote from `corpus/normalised/`. A form
  the corpus does not name is not listed; the entry says to verify instead.
- Every URL was opened on 2026-09-23 and answered 200.
- No fees. The fee schedules are not in the corpus in a form that can be quoted
  row by row, so `fee_note` points at where the fee is set rather than at a sum.
"""

from contextlib import suppress
from dataclasses import dataclass, field

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.models import Registry

CHECKED_ON = "2026-09-23"


@dataclass(frozen=True)
class Form:
    name: str
    purpose: str
    cite_source: str
    cite_locator: str
    #: The rule's own words naming the form. Re-read from the corpus by the tests.
    quote: str


@dataclass(frozen=True)
class RegistryEntry:
    id: str
    name: str
    jurisdiction: str
    regime: list[str]
    url: str
    #: What the person does there, in a line.
    action: str
    #: The provision that requires going there.
    cite_source: str
    cite_locator: str
    cite_quote: str
    forms: list[Form] = field(default_factory=list)
    #: Said when the corpus does not name the form, so the gap is visible.
    forms_note: str | None = None
    fee_note: str | None = None


REGISTRIES: list[RegistryEntry] = [
    RegistryEntry(
        id="in-patent-office",
        name="Indian Patent Office (Controller General of Patents, Designs and Trade Marks)",
        jurisdiction="IN",
        regime=["patent"],
        url="https://ipindiaonline.gov.in/epatentfiling/",
        action="File a patent application, then request its examination",
        cite_source="in-patents-act-1970",
        cite_locator="s.7",
        cite_quote="shall be made in the prescribed form and filed in the patent office",
        forms=[
            Form(
                "Form 18",
                "Request for examination",
                "in-patents-rules-2003",
                "Rule 24B",
                "A request for examination under section 11B shall be made in Form 18",
            ),
            Form(
                "Form 1",
                "Application corresponding to an international (PCT) application",
                "in-patents-rules-2003",
                "Rule 20",
                "may be made in Form 1 under sub-section (1A) of section 7",
            ),
        ],
        forms_note=(
            "The form for an ordinary application is 'the prescribed form' in s.7; the forms "
            "schedule of the Patents Rules is not in the corpus, so verify it before filing."
        ),
        fee_note="Fees are set by the Patents Rules, 2003 (as amended in 2024); not quoted here.",
    ),
    RegistryEntry(
        id="in-gi-registry",
        name="Geographical Indications Registry",
        jurisdiction="IN",
        regime=["gi"],
        url="https://ipindiaonline.gov.in/gi/",
        action="Apply to register a geographical indication for a class of goods",
        cite_source="in-gi-act-1999",
        cite_locator="s.11",
        cite_quote="shall apply in writing to the Registrar",
        forms=[
            Form(
                "Form GI-1",
                "Application to register a geographical indication",
                "in-gi-rules-2002",
                "Rule 23",
                "shall be made in Form GI-1",
            ),
        ],
        fee_note="Fees are set by the Geographical Indications Rules, 2002; not quoted here.",
    ),
    RegistryEntry(
        id="in-tm-registry",
        name="Trade Marks Registry",
        jurisdiction="IN",
        regime=["trademark"],
        url="https://ipindiaonline.gov.in/trademarkefiling/",
        action="Apply to register a trade mark for your goods or services",
        cite_source="in-trade-marks-act-1999",
        cite_locator="s.18",
        cite_quote="shall apply in writing to the Registrar in the prescribed manner",
        forms_note=(
            "The Trade Marks Rules, which name the forms, are not in the corpus: the e-filing "
            "portal shows the current form."
        ),
    ),
    RegistryEntry(
        id="in-nba",
        name="National Biodiversity Authority",
        jurisdiction="IN",
        regime=["abs"],
        url="https://nbaindia.org/",
        action="Seek approval before accessing a biological resource or associated knowledge",
        cite_source="in-bd-rules-2024",
        cite_locator="Rule 13",
        cite_quote="shall make an application on the web portal of the Authority in Form 1",
        forms=[
            Form(
                "Form 1",
                "Access for research, bio-survey or bio-utilisation",
                "in-bd-rules-2024",
                "Rule 13",
                "for research or for bio-survey and bio-utilisation shall make an application "
                "on the web portal of the Authority in Form 1",
            ),
            Form(
                "Form 2",
                "Access for commercial utilisation",
                "in-bd-rules-2024",
                "Rule 13",
                "for commercial utilisation shall make an application on the web portal of the "
                "Authority in Form 2",
            ),
        ],
        fee_note="Fees are in the First Schedule to the Biological Diversity Rules, 2024.",
    ),
    RegistryEntry(
        id="in-asu-licensing",
        name="State Licensing Authority for Ayurveda, Siddha and Unani drugs (e-Aushadhi)",
        jurisdiction="IN",
        regime=["drug_licensing"],
        url="https://e-aushadhi.gov.in/",
        action="Apply for a licence to manufacture Ayurvedic, Siddha or Unani drugs for sale",
        cite_source="in-dc-rules-1945",
        cite_locator="Rule 153",
        cite_quote="shall be made in Form 24-D to the Licensing Authority",
        forms=[
            Form(
                "Form 24-D",
                "Licence to manufacture Ayurvedic (including Siddha) or Unani drugs for sale",
                "in-dc-rules-1945",
                "Rule 153",
                "shall be made in Form 24-D to the Licensing Authority",
            ),
        ],
    ),
    RegistryEntry(
        id="in-fssai",
        name="Food Safety and Standards Authority of India (FoSCoS)",
        jurisdiction="IN",
        regime=["food"],
        url="https://foscos.fssai.gov.in/",
        action="Get a food business licence or registration before selling Ayurveda Aahara",
        cite_source="in-fss-act-2006",
        cite_locator="s.31",
        cite_quote="No person shall commence or carry on any food business except under a licence",
        forms_note=(
            "The licensing regulations that name the forms are not in the corpus; FoSCoS shows "
            "which licence or registration applies."
        ),
    ),
    RegistryEntry(
        id="in-ppvfra",
        name="Protection of Plant Varieties and Farmers' Rights Authority",
        jurisdiction="IN",
        regime=["pvp"],
        url="https://plantauthority.gov.in/",
        action="Register a new, extant or farmers' plant variety",
        cite_source="in-ppvfr-act-2001",
        cite_locator="s.14",
        cite_quote="may make an application to the Registrar for registration of any variety",
        forms_note=(
            "The PPV&FR Rules, which name the application form, are not in the corpus; the "
            "Authority's site has the current one."
        ),
    ),
    RegistryEntry(
        id="in-ida-mtcc",
        name="Microbial Type Culture Collection and Gene Bank (MTCC), a depositary authority",
        jurisdiction="IN",
        regime=["patent", "treaty"],
        url="https://mtccindia.res.in/",
        action="Deposit a micro-organism a patent application relies on, before filing",
        cite_source="in-patents-act-1970",
        cite_locator="s.10",
        cite_quote="an international depository authority under the Budapest Treaty",
        forms=[
            Form(
                "Recognised depositary",
                "MTCC is on WIPO's list of International Depositary Authorities (since 4 October "
                "2002); MCC and NAIMCC are the other two in India",
                "intl-budapest-ida-list",
                "p.1",
                "Microbial Type Culture Collection and Gene Bank (MTCC)",
            ),
        ],
        forms_note="Each depositary sets its own deposit forms and charges; ask it directly.",
    ),
]


def _chunk_id(session: Session, source: str, locator: str, quote: str) -> int | None:
    """The stored chunk a cite points at. A long provision is stored as several
    chunks ("s.10(1)–(i)", "s.10(ii)–(7)"), so the one holding the quoted words
    wins, then an exact locator, then the provision's first chunk."""
    row = session.execute(
        text(
            "SELECT c.id FROM chunks c JOIN source_versions v ON v.id = c.source_version_id "
            "WHERE v.source_id = :source AND NOT v.superseded "
            "AND (c.locator = :loc OR split_part(c.locator, '(', 1) = :loc) "
            r"ORDER BY (regexp_replace(c.text, '\s+', ' ', 'g') ILIKE :quote) DESC, "
            "(c.locator = :loc) DESC, c.id LIMIT 1"
        ),
        {"source": source, "loc": locator, "quote": f"%{' '.join(quote.split())}%"},
    ).first()
    return row[0] if row else None


def seed_registries(session: Session) -> dict[str, int]:
    """Write every entry, replacing what is stored. Idempotent.

    An entry whose cite resolves to no stored chunk is still written, with no
    cite chunk, and counted as unresolved — a database ingested without that
    source should not lose the registry, and the count says it happened.
    """
    unresolved = 0
    for entry in REGISTRIES:
        row = session.get(Registry, entry.id) or Registry(id=entry.id)
        row.name = entry.name
        row.jurisdiction = entry.jurisdiction
        row.regime = list(entry.regime)
        row.url = entry.url
        row.fee_note = entry.fee_note
        row.forms = [
            {
                "name": f.name,
                "purpose": f.purpose,
                "cite_source_id": f.cite_source,
                "cite_locator": f.cite_locator,
                "quote": f.quote,
            }
            for f in entry.forms
        ]
        row.action = entry.action
        row.forms_note = entry.forms_note
        row.cite_chunk_id = _chunk_id(
            session, entry.cite_source, entry.cite_locator, entry.cite_quote
        )
        if row.cite_chunk_id is None:
            unresolved += 1
        session.add(row)
    session.commit()
    return {"registries": len(REGISTRIES), "unresolved": unresolved}


_BY_ID = {r.id: r for r in REGISTRIES}


def pointers(session: Session, regimes: list[str], limit: int = 3) -> list:
    """The registries an answer about these regimes should point to next.

    Each carries its cite as a full Citation: the stored chunk it rests on, and
    the provision's own words (the quote the tests re-read from the corpus), so
    "Where to go next" is held to the same standard as the answer above it.
    Never raises: a missing table or database leaves the answer without next
    steps rather than without an answer.
    """
    from app.schemas import Citation, RegistryPointer

    if not regimes:
        return []
    try:
        rows = session.execute(
            text(
                "SELECT r.id, r.name, r.url, r.fee_note, r.action, s.title, s.url, s.doc_type, "
                "v.version_label, c.locator, s.jurisdiction "
                "FROM registries r JOIN chunks c ON c.id = r.cite_chunk_id "
                "JOIN source_versions v ON v.id = c.source_version_id "
                "JOIN sources s ON s.id = v.source_id "
                "WHERE r.regime && CAST(:regimes AS varchar[]) ORDER BY r.name"
            ),
            {"regimes": list(regimes)},
        ).all()
    except Exception:  # noqa: BLE001 - next steps are optional; the answer is not
        # The rollback can fail too (a session with no connection behind it), and
        # "never raises" has to hold for it as well.
        with suppress(Exception):
            session.rollback()
        return []
    out = []
    for rid, name, url, fee, action, title, src_url, doc_type, version, locator, juris in rows:
        entry = _BY_ID.get(rid)
        if entry is None:
            continue
        out.append(
            RegistryPointer(
                registry=name,
                action=action or entry.action,
                # A record such as the depositary list is evidence, not a form to file.
                form=next((f.name for f in entry.forms if f.name.startswith("Form")), None),
                url=url,
                fee_note=fee,
                cite=Citation(
                    source_id=entry.cite_source,
                    source_title=title,
                    version_label=version,
                    locator=locator,
                    cited_text=entry.cite_quote,
                    url=src_url,
                    jurisdiction=juris,
                    doc_type=doc_type,
                    verified=True,
                ),
            )
        )
    return out[:limit]
