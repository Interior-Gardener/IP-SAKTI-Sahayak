"""Membership is read from WIPO's lists, and a negative is only as good as the parse."""

import pytest

from app.treaties.membership import (
    LISTS,
    IncompleteList,
    check,
    checks_for,
    known_countries,
    read_list,
)


@pytest.mark.parametrize("entry", LISTS, ids=lambda e: e.source_id)
def test_every_party_in_the_list_is_parsed(entry):
    """The lists print their own total; parsing fewer rows would invent an absence."""
    listing = read_list(entry.source_id)
    assert len(listing.rows) == listing.declared_total
    assert listing.status  # "July 14, 2026"


def test_india_is_a_party_to_madrid_with_the_date_the_list_gives():
    found = check("intl-madrid-parties", "India")
    assert found.listed and found.date == "July 8, 2013"
    assert "July 8, 2013" in found.sentence()
    # The row as printed, so an answer can quote it.
    assert "India" in found.sentence()


def test_india_is_not_a_party_to_hague():
    found = check("intl-hague-parties", "India")
    assert not found.listed and found.date == ""
    assert "does not appear" in found.sentence()
    assert str(found.total) in found.sentence()


def test_a_country_that_is_a_party_to_hague_reads_as_one():
    assert check("intl-hague-parties", "Japan").listed


def test_a_short_dotted_leader_still_counts_as_a_row():
    """Lao People's Democratic Republic is printed with a three-dot leader, not a long one;
    missing it would have left the list one short of its declared total."""
    names = {row.country for row in read_list("intl-hague-parties").rows}
    assert any(name.startswith("Lao People") for name in names)


def test_footnote_markers_are_not_read_as_part_of_a_name_or_a_year():
    rows = {r.country: r for r in read_list("intl-madrid-parties").rows}
    assert "Belgium" in rows  # printed "Belgium5"
    assert rows["India"].dates[1] == "July 8, 2013"  # printed "July 8, 20135,6,8"


def test_a_question_about_a_route_is_checked_for_the_country_it_names():
    found = checks_for("Can an applicant in India use the Hague System for a design?")
    assert [(c.treaty, c.listed) for c in found] == [("the Hague Agreement", False)]


def test_a_question_naming_no_country_is_checked_for_india():
    found = checks_for("How do I register my brand abroad through the Madrid Protocol?")
    assert [(c.country, c.listed) for c in found] == [("India", True)]


def test_a_question_about_neither_route_is_not_checked():
    assert checks_for("Is a classical formulation patentable under section 3(p)?") == []


def test_a_list_that_does_not_account_for_itself_raises(tmp_path):
    (tmp_path / "corpus" / "normalised").mkdir(parents=True)
    (tmp_path / "corpus" / "normalised" / "intl-hague-parties.txt").write_text(
        "<<page 1>>\nStatus on July 14, 2026\nAlbania ..... March 19, 2007\n(Total: 85)\n",
        encoding="utf-8",
    )
    with pytest.raises(IncompleteList):
        read_list("intl-hague-parties", tmp_path)


def test_countries_come_from_the_lists_themselves():
    names = known_countries()
    assert "India" in names and "Japan" in names
    # Longest first, so "Republic of Korea" is matched before "Korea".
    assert len(names[0]) >= len(names[-1])


def test_the_agent_can_ask_the_register_directly():
    from app.agent.tools import Toolbox, specs

    assert "treaty_membership" in [t.name for t in specs()]
    box = Toolbox(session=None, embedder=None)
    said = box.run("treaty_membership", {"treaty": "hague", "country": "India"})
    assert "does not appear" in said and "intl-hague-parties" in said
    assert "July 8, 2013" in box.run("treaty_membership", {"treaty": "madrid", "country": "India"})
    assert box.run("treaty_membership", {"treaty": "berne", "country": "India"}).startswith("error")
