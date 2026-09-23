"""The relational knowledge graph, and the seed it starts from.

The problem statement asks for a *relational* knowledge graph, so it is
Postgres rows rather than a graph database: entities and edges, with the
provision each edge rests on carried on the edge itself.

Two rules hold here, the same two that hold everywhere else in this project:

1. **Every edge cites.** An edge that asserts a legal relation carries a
   manifest source id and a locator, and ``test_graph.py`` re-reads every one
   of them out of ``corpus/normalised/`` — an edge pointing at a provision
   that is not there fails the build. An edge with no locator points at the
   source as a whole, which is all a manual can be pointed at.
2. **Nothing here decides anything.** The graph widens retrieval: a question
   about musk should be able to reach the Wild Life Act even when the word
   "wildlife" never appears in it. The answer still comes from the retrieved
   text, and the verifier still checks every quote against it.

The seed is deliberately about *kinds* — traditional knowledge, a
micro-organism, a mineral — rather than about individual materials. Kinds are
what the statutes speak about: the Patents Act has nothing to say about
turmeric and a great deal to say about traditional knowledge.
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import KgEdge, KgEntity
from app.ingest.manifest import load_manifest


@dataclass(frozen=True)
class SeedEntity:
    kind: str
    key: str
    label: str
    #: Words that should reach this entity from a question, lowercase.
    aliases: tuple[str, ...] = ()

    @property
    def ref(self) -> str:
        return f"{self.kind}:{self.key}"


@dataclass(frozen=True)
class SeedEdge:
    #: "kind:key" of the entity the statement is about.
    subject: str
    predicate: str
    #: "kind:key" of the entity it points at.
    obj: str
    #: Manifest source id holding the provision this edge rests on.
    cite_source: str | None = None
    #: Locator within it, as the chunker names it. None = the source as a whole.
    cite_locator: str | None = None
    note: str = ""


# --- entities ---------------------------------------------------------------

CONCEPTS: list[SeedEntity] = [
    SeedEntity(
        "concept",
        "traditional-knowledge",
        "Traditional knowledge",
        (
            "traditional knowledge",
            "tkdl",
            "classical text",
            "parampara",
            "already known to the community",
        ),
    ),
    SeedEntity(
        "concept",
        "micro-organism",
        "Micro-organism",
        (
            "micro-organism",
            "microorganism",
            "micro organism",
            "microbe",
            "microbial",
            "strain",
            "culture",
            "yeast",
            "bacteria",
            "bacterium",
            "bacilli",
            "fungus",
            "fungal",
            "probiotic",
            "fermentation",
            "asava",
            "arishta",
        ),
    ),
    SeedEntity(
        "concept",
        "animal-derived",
        "Animal-derived material",
        (
            "animal",
            "animal-derived",
            "honey",
            "madhu",
            "ghee",
            "ghrita",
            "musk",
            "kasturi",
            "pearl",
            "mukta",
            "coral",
            "pravala",
            "conch",
            "shankha",
            "trophy",
        ),
    ),
    SeedEntity(
        "concept",
        "mineral",
        "Mineral and metallic material",
        (
            "mineral",
            "metallic",
            "bhasma",
            "rasa shastra",
            "parada",
            "mercury",
            "gandhaka",
            "sulphur",
            "hingula",
            "cinnabar",
            "abhraka",
            "mica",
            "swarna",
            "loha",
            "heavy metal",
        ),
    ),
    SeedEntity(
        "concept",
        "biological-resource",
        "Biological resource",
        (
            "biological resource",
            "bio-resource",
            "bioresource",
            "genetic resource",
            "biodiversity",
            "national biodiversity authority",
            "benefit sharing",
            "benefit-sharing",
        ),
    ),
    SeedEntity(
        "concept",
        "plant-variety",
        "Plant variety",
        ("plant variety", "farmers' variety", "farmers variety", "extant variety", "new variety"),
    ),
    SeedEntity(
        "concept",
        "deposit",
        "Deposit of a micro-organism",
        ("deposit", "depositary", "depository", "budapest", "international depositary authority"),
    ),
    SeedEntity(
        "concept",
        "classical-formulation",
        "Classical formulation",
        (
            "classical formulation",
            "classical medicine",
            "first schedule",
            "authoritative book",
            "asu drug",
            "ayurvedic drug",
            "generic medicine",
        ),
    ),
    SeedEntity(
        "concept",
        "trade-secret",
        "Trade secret",
        ("trade secret", "undisclosed information", "secret formula"),
    ),
]

#: Labels for the regimes the manifest uses; anything new falls back to its id.
REGIME_LABELS = {
    "patent": "Patents",
    "gi": "Geographical indications",
    "trademark": "Trade marks",
    "copyright": "Copyright",
    "design": "Designs",
    "pvp": "Plant variety protection",
    "abs": "Access and benefit sharing",
    "drug_licensing": "Drug licensing",
    "advertising": "Advertising",
    "labelling": "Labelling",
    "food": "Food",
    "cosmetic": "Cosmetics",
    "treaty": "Treaties",
    "market_access": "Market access",
    "trade_secret": "Trade secrets",
    "wildlife": "Wildlife",
    "privacy": "Privacy",
}


def source_entities() -> list[SeedEntity]:
    """One entity per corpus source, so an edge can point at a statute."""
    return [
        SeedEntity("source", s.id, s.title, (s.title.lower(),)) for s in load_manifest().sources
    ]


def regime_entities() -> list[SeedEntity]:
    """One entity per regime the manifest uses, so the set cannot drift from it."""
    regimes = {r for s in load_manifest().sources for r in s.regime}
    return [
        SeedEntity(
            "regime", r, REGIME_LABELS.get(r, r.replace("_", " ").title()), (r.replace("_", " "),)
        )
        for r in sorted(regimes)
    ]


def entities() -> list[SeedEntity]:
    return [*CONCEPTS, *regime_entities(), *source_entities()]


# --- edges ------------------------------------------------------------------
# Read as: subject — predicate → object, because <cite>.

EDGES: list[SeedEdge] = [
    # Traditional knowledge
    SeedEdge(
        "concept:traditional-knowledge",
        "not_patentable_under",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "s.3(p): an invention which in effect is traditional knowledge",
    ),
    SeedEdge(
        "concept:traditional-knowledge",
        "searched_in_examination_by",
        "source:in-mppp-v3",
        "in-mppp-v3",
        None,
        "The manual tells examiners to search the TKDL when applying s.3(p)",
    ),
    SeedEdge(
        "concept:traditional-knowledge",
        "disclosure_required_by",
        "source:intl-gratk-2024",
        "intl-gratk-2024",
        "Art. 3",
        "Art. 3.2: disclose the community, or the source",
    ),
    SeedEdge("concept:traditional-knowledge", "belongs_to_regime", "regime:patent"),
    # Micro-organisms and deposits
    SeedEdge(
        "concept:micro-organism",
        "carved_out_of_exclusion_by",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "s.3(j) excludes plants and animals 'other than micro-organisms'",
    ),
    SeedEdge(
        "concept:micro-organism",
        "deposit_required_by",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.10",
        "s.10(4)(d)(ii): deposit completes a specification that cannot describe the material",
    ),
    SeedEdge(
        "concept:deposit",
        "recognised_internationally_by",
        "source:intl-budapest-treaty",
        "intl-budapest-treaty",
        "Art. 3",
        "One deposit with an IDA counts in every contracting state",
    ),
    SeedEdge(
        "concept:micro-organism",
        "is_a",
        "concept:biological-resource",
        "in-bd-act-2002",
        "s.2",
        "s.2(c) counts micro-organisms as biological resources",
    ),
    SeedEdge("concept:micro-organism", "belongs_to_regime", "regime:patent"),
    # Animal-derived
    SeedEdge(
        "concept:animal-derived",
        "not_patentable_under",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "s.3(j) excludes animals in whole or any part thereof",
    ),
    SeedEdge(
        "concept:animal-derived",
        "trade_restricted_by",
        "source:in-wlpa-1972",
        "in-wlpa-1972",
        "s.49B",
        "Dealing in animal articles from scheduled animals is prohibited",
    ),
    SeedEdge(
        "concept:animal-derived",
        "export_permit_under",
        "source:in-wlpa-1972",
        "in-wlpa-1972",
        "s.49I",
        "Export of an Appendix I or II specimen needs a prior permit",
    ),
    SeedEdge("concept:animal-derived", "belongs_to_regime", "regime:wildlife"),
    # Minerals
    SeedEdge(
        "concept:mineral",
        "not_patentable_under",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "s.3(c): the discovery of a non-living substance occurring in nature",
    ),
    SeedEdge(
        "concept:mineral",
        "poisonous_list_in",
        "source:in-dc-rules-1945",
        "in-dc-rules-1945",
        "Schedule E(1)",
        "Parada, hingula and the other mineral-origin entries",
    ),
    SeedEdge(
        "concept:mineral",
        "labelling_under",
        "source:in-dc-rules-1945",
        "in-dc-rules-1945",
        "Rule 161",
        "A medicine made from a Schedule E(1) substance is labelled accordingly",
    ),
    SeedEdge("concept:mineral", "belongs_to_regime", "regime:drug_licensing"),
    # Biological resources and ABS
    SeedEdge(
        "concept:biological-resource",
        "access_approval_under",
        "source:in-bd-act-2002",
        "in-bd-act-2002",
        "s.3",
        "Foreign persons and entities need NBA approval to access",
    ),
    SeedEdge(
        "concept:biological-resource",
        "ip_approval_under",
        "source:in-bd-act-2002",
        "in-bd-act-2002",
        "s.6",
        "Approval before an IP right based on an Indian biological resource",
    ),
    SeedEdge(
        "concept:biological-resource",
        "intimation_under",
        "source:in-bd-act-2002",
        "in-bd-act-2002",
        "s.7",
        "Indian persons give prior intimation to the State Biodiversity Board",
    ),
    SeedEdge(
        "concept:biological-resource",
        "exemption_under",
        "source:in-bd-act-2002",
        "in-bd-act-2002",
        "s.40",
        "Normally traded commodities, by notification",
    ),
    SeedEdge(
        "concept:biological-resource",
        "benefit_sharing_under",
        "source:in-bd-act-2002",
        "in-bd-act-2002",
        "s.21",
        "The NBA determines fair and equitable benefit sharing",
    ),
    SeedEdge(
        "concept:biological-resource",
        "certificate_of_origin_under",
        "source:in-bd-rules-2024",
        "in-bd-rules-2024",
        "Rule 19",
        "Cultivated medicinal plants claiming the s.7 exemption",
    ),
    SeedEdge(
        "concept:biological-resource",
        "international_regime",
        "source:intl-cbd",
        "intl-cbd",
        "Art. 15",
        "Access on prior informed consent and mutually agreed terms",
    ),
    SeedEdge(
        "concept:biological-resource",
        "international_regime",
        "source:intl-nagoya-protocol",
        "intl-nagoya-protocol",
        "Art. 5",
        "Fair and equitable sharing of benefits",
    ),
    SeedEdge("concept:biological-resource", "belongs_to_regime", "regime:abs"),
    # Plant varieties
    SeedEdge(
        "concept:plant-variety",
        "registrable_under",
        "source:in-ppvfr-act-2001",
        "in-ppvfr-act-2001",
        "s.14",
        "New, extant and farmers' varieties",
    ),
    SeedEdge(
        "concept:plant-variety",
        "excluded_from_patent_by",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "s.3(j) covers seeds, varieties and species",
    ),
    SeedEdge("concept:plant-variety", "belongs_to_regime", "regime:pvp"),
    # Classical formulations and drug licensing
    SeedEdge(
        "concept:classical-formulation",
        "defined_by",
        "source:in-dc-act-1940",
        "in-dc-act-1940",
        "s.3",
        "s.3(a): the formulae of the First Schedule books",
    ),
    SeedEdge(
        "concept:classical-formulation",
        "licensed_under",
        "source:in-dc-rules-1945",
        "in-dc-rules-1945",
        "Rule 158B",
        "Guidelines for issue of a licence for ASU drugs",
    ),
    SeedEdge(
        "concept:classical-formulation",
        "manufactured_under",
        "source:in-dc-rules-1945",
        "in-dc-rules-1945",
        "Rule 157",
        "Good manufacturing practice, Schedule T",
    ),
    SeedEdge(
        "concept:classical-formulation",
        "not_patentable_under",
        "source:in-patents-act-1970",
        "in-patents-act-1970",
        "s.3",
        "Traditional knowledge under s.3(p), an admixture under s.3(e)",
    ),
    SeedEdge("concept:classical-formulation", "belongs_to_regime", "regime:drug_licensing"),
    # Trade secrets
    SeedEdge(
        "concept:trade-secret",
        "protected_internationally_under",
        "source:intl-trips",
        "intl-trips",
        "Art. 39",
        "Undisclosed information; India has no statute, so it is common law",
    ),
    SeedEdge("concept:trade-secret", "belongs_to_regime", "regime:trade_secret"),
    # Regimes to their primary sources
    SeedEdge(
        "regime:patent", "primary_law", "source:in-patents-act-1970", "in-patents-act-1970", "s.3"
    ),
    SeedEdge(
        "regime:patent",
        "procedure",
        "source:in-patents-rules-2003",
        "in-patents-rules-2003",
        "Rule 24B",
    ),
    SeedEdge("regime:patent", "practice", "source:in-mppp-v3", "in-mppp-v3", None),
    SeedEdge("regime:patent", "international", "source:intl-trips", "intl-trips", "Art. 27"),
    SeedEdge("regime:patent", "international", "source:intl-pct", "intl-pct", "Art. 11"),
    SeedEdge("regime:gi", "primary_law", "source:in-gi-act-1999", "in-gi-act-1999", "s.11"),
    SeedEdge("regime:gi", "international", "source:intl-trips", "intl-trips", "Art. 22"),
    SeedEdge(
        "regime:trademark",
        "primary_law",
        "source:in-trade-marks-act-1999",
        "in-trade-marks-act-1999",
        "s.9",
    ),
    SeedEdge(
        "regime:copyright",
        "primary_law",
        "source:in-copyright-act-1957",
        "in-copyright-act-1957",
        "s.13",
    ),
    SeedEdge(
        "regime:design", "primary_law", "source:in-designs-act-2000", "in-designs-act-2000", "s.2"
    ),
    SeedEdge("regime:abs", "primary_law", "source:in-bd-act-2002", "in-bd-act-2002", "s.6"),
    SeedEdge(
        "regime:drug_licensing", "primary_law", "source:in-dc-act-1940", "in-dc-act-1940", "s.33EEC"
    ),
    SeedEdge("regime:food", "primary_law", "source:in-fss-act-2006", "in-fss-act-2006", "s.22"),
    SeedEdge(
        "regime:food",
        "ayurveda_aahara",
        "source:in-fssai-ayurveda-aahara-2022",
        "in-fssai-ayurveda-aahara-2022",
        "Reg. 8",
    ),
    SeedEdge(
        "regime:cosmetic",
        "primary_law",
        "source:in-cosmetics-rules-2020",
        "in-cosmetics-rules-2020",
        "Rule 23",
    ),
    SeedEdge(
        "regime:advertising", "primary_law", "source:in-dmr-act-1954", "in-dmr-act-1954", "s.3"
    ),
    SeedEdge(
        "regime:advertising",
        "consumer_authority",
        "source:in-consumer-protection-act-2019",
        "in-consumer-protection-act-2019",
        "s.10",
    ),
    SeedEdge(
        "regime:market_access",
        "eu_traditional_use",
        "source:intl-eu-thmpd-2004-24",
        "intl-eu-thmpd-2004-24",
        "Art. 16a",
    ),
    SeedEdge("regime:wildlife", "primary_law", "source:in-wlpa-1972", "in-wlpa-1972", "s.49B"),
]


# --- seeding ----------------------------------------------------------------


def seed_graph(session: Session) -> dict[str, int]:
    """Writes the seed, idempotently. Safe to run on every deploy.

    Entities are keyed by (kind, key) and edges by (subject, predicate, object,
    locator), so re-running updates labels and notes without duplicating rows.
    """
    counts = {"entities": 0, "edges": 0}

    by_ref: dict[str, KgEntity] = {
        f"{e.kind}:{e.key}": e for e in session.execute(select(KgEntity)).scalars()
    }
    for seed in entities():
        row = by_ref.get(seed.ref)
        if row is None:
            row = KgEntity(
                kind=seed.kind, key=seed.key, label=seed.label, aliases=list(seed.aliases)
            )
            session.add(row)
            by_ref[seed.ref] = row
            counts["entities"] += 1
        else:
            row.label = seed.label
            row.aliases = list(seed.aliases)
    session.flush()

    existing = {
        (e.subject_id, e.predicate, e.object_id, e.cite_locator): e
        for e in session.execute(select(KgEdge)).scalars()
    }
    for edge in EDGES:
        subject = by_ref.get(edge.subject)
        obj = by_ref.get(edge.obj)
        if subject is None or obj is None:
            raise ValueError(
                f"edge names an entity that is not seeded: {edge.subject} -> {edge.obj}"
            )
        key = (subject.id, edge.predicate, obj.id, edge.cite_locator)
        row = existing.get(key)
        if row is None:
            session.add(
                KgEdge(
                    subject_id=subject.id,
                    predicate=edge.predicate,
                    object_id=obj.id,
                    cite_source_id=edge.cite_source,
                    cite_locator=edge.cite_locator,
                    note=edge.note,
                )
            )
            counts["edges"] += 1
        else:
            row.note = edge.note
            row.cite_source_id = edge.cite_source
    session.commit()
    return counts
