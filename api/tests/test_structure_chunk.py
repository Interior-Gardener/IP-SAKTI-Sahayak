"""Snippets below are copied from the normalised corpus so the parser is tested on
the real formats, not idealised ones."""

from app.ingest.chunk import MAX_CHARS, chunk_units
from app.ingest.structure import parse_units

PATENTS = """<<page 1>>
ARRANGEMENT OF SECTIONS
3. What are not inventions.
4. Inventions relating to atomic energy not patentable.
<<page 12>>
CHAPTER II
INVENTIONS NOT PATENTABLE
3. What are not inventions.—The following are not inventions within the meaning of this
Act,—
(a) an invention which is frivolous or which claims anything obviously contrary to well
established natural laws;
(p) an invention which, in effect, is traditional knowledge or which is an aggregation or
duplication of known properties of traditionally known component or components.
3. Subs. by s. 6, ibid., for section 4 (w.e.f. 1-4-2024).
IndiaCode
4. Inventions relating to atomic energy not patentable.—No patent shall be granted in respect
of an invention relating to atomic energy falling within sub-section (1) of section 20.
5[11A. Publication of applications.—6[(1) Save as otherwise provided, no application for patent
shall ordinarily be open to the public for such period as may be prescribed.
STATEMENT OF OBJECTS AND REASONS
3. The Bill has the following salient features:— this must not replace section 3.
"""

NBA_RULES = """<<page 50>>
1. संजिप्त नाम और प्रारंभ.- (1) इन जनर्मों का संजिप् त नाम िैव जवजवधता जनर्म, 2024 है। और अधिक पाठ
<<page 51>>
1. Short title and commencement. – (1) These rules may be called the Biological Diversity Rules, 2024.
2. Definitions. – (1) In these rules, unless the context otherwise requires, the Act means the 2002 Act.
16.
Procedure for registration and obtaining prior approval from Authority before grant of intellectual property
rights.- (1) Any person who intends to apply for a patent shall apply to the Authority.
"""

TREATY = """<<page 9>>
Article 27
Patentable Subject Matter
1.
Subject to the provisions of paragraphs 2 and 3, patents shall be available for any inventions.
3.
Members may also exclude from patentability plants and animals other than micro-organisms.
Article
28
Rights Conferred
1.
A patent shall confer on its owner the following exclusive rights.
"""


def test_statute_sections_skip_contents_footnotes_and_notes():
    units = parse_units(PATENTS, "statute")
    assert [u.locator for u in units] == ["s.3", "s.4", "s.11A"]
    s3 = units[0]
    assert s3.heading == "What are not inventions"
    assert s3.chapter == "CHAPTER II Inventions Not Patentable"
    assert "traditional knowledge" in s3.text
    assert "Subs. by" not in s3.text and "IndiaCode" not in s3.text
    assert "salient features" not in s3.text


def test_bilingual_rules_keep_english_and_join_split_headings():
    units = parse_units(NBA_RULES, "rules")
    assert [u.locator for u in units] == ["Rule 1", "Rule 2", "Rule 16"]
    assert units[0].text.startswith("(1) These rules may be called")
    assert units[2].heading.startswith("Procedure for registration")


def test_treaty_articles_with_split_article_lines():
    units = parse_units(TREATY, "treaty")
    assert [u.locator for u in units] == ["Art. 27", "Art. 28"]
    assert units[0].heading == "Patentable Subject Matter"


def test_short_section_is_one_chunk_with_context_header():
    chunks = chunk_units(parse_units(PATENTS, "statute"), "The Patents Act, 1970")
    s3 = chunks[0]
    assert s3.locator == "s.3"
    assert s3.context_header == (
        "The Patents Act, 1970 — CHAPTER II Inventions Not Patentable — s.3 What are not inventions"
    )


def test_long_section_splits_at_clauses_with_clause_locators():
    clause = "an invention which is described at some length for the purposes of this test. " * 12
    body = "\n".join(f"({c}) {clause}" for c in "abcdefghijklmnop")
    text = f"<<page 1>>\n3. What are not inventions.—The following are not inventions,—\n{body}\n"
    chunks = chunk_units(parse_units(text, "statute"), "The Patents Act, 1970")
    assert len(chunks) > 1
    assert all(len(c.text) <= MAX_CHARS for c in chunks)
    assert all(c.locator.startswith("s.3(") for c in chunks[1:])
    assert chunks[-1].locator.endswith("(p)")


def test_unstructured_document_falls_back_to_pages():
    text = "<<page 1>>\nSome manual text about practice.\n<<page 2>>\nMore manual text here.\n"
    assert [u.locator for u in parse_units(text, "manual")] == ["p.1", "p.2"]
