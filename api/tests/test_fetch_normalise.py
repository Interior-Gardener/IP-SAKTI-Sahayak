import httpx
import pymupdf

from app.ingest.fetch import fetch_source, looks_like
from app.ingest.manifest import ManifestSource
from app.ingest.normalise import clean_text, normalise_source


def source(**kw):
    base = dict(
        id="in-test",
        title="Test Act",
        jurisdiction="IN",
        regime=["patent"],
        doc_type="statute",
        issuer="x",
        url="https://example.gov.in/a",
        fetch_url="https://example.gov.in/a.pdf",
        fetch="auto",
        format="pdf",
        licence="x",
        version_label="v",
    )
    return ManifestSource(**{**base, **kw})


def tiny_pdf(text: str) -> bytes:
    doc = pymupdf.open()
    doc.new_page().insert_text((72, 72), text)
    return doc.tobytes()


def client_returning(body: bytes, status: int = 200) -> httpx.Client:
    return httpx.Client(
        transport=httpx.MockTransport(lambda r: httpx.Response(status, content=body))
    )


def test_fetch_downloads_then_reports_unchanged(tmp_path):
    body = tiny_pdf("3. What are not inventions.")
    first = fetch_source(source(), tmp_path, client_returning(body))
    again = fetch_source(source(), tmp_path, client_returning(body))
    assert first.status == "downloaded" and again.status == "unchanged"
    assert first.sha256 == again.sha256
    assert (tmp_path / "corpus/raw/in-test.pdf").read_bytes() == body


def test_fetch_rejects_html_pretending_to_be_pdf(tmp_path):
    r = fetch_source(source(), tmp_path, client_returning(b"<!doctype html><html>app</html>"))
    assert r.status == "failed"
    assert not (tmp_path / "corpus/raw/in-test.pdf").exists()


def test_manual_source_missing_and_present(tmp_path):
    s = source(fetch="manual", fetch_url=None)
    assert fetch_source(s, tmp_path).status == "manual_missing"
    s.raw_path(tmp_path).parent.mkdir(parents=True, exist_ok=True)
    s.raw_path(tmp_path).write_bytes(tiny_pdf("x"))
    assert fetch_source(s, tmp_path).status == "manual_present"


def test_normalise_pdf_marks_pages(tmp_path):
    s = source()
    s.raw_path(tmp_path).parent.mkdir(parents=True, exist_ok=True)
    s.raw_path(tmp_path).write_bytes(tiny_pdf("3. What are not inventions."))
    r = normalise_source(s, tmp_path, ocr=False)
    text = r.path.read_text(encoding="utf-8")
    assert text.startswith("<<page 1>>\n") and "What are not inventions" in text


def test_clean_text_strips_hidden_characters_and_joins_hyphens():
    dirty = "inven-\ntion​ is‮  here\x07"
    assert clean_text(dirty) == "invention is here"


def test_looks_like():
    assert looks_like("pdf", b"%PDF-1.7 ...")
    assert not looks_like("pdf", b"<html>")
    assert looks_like("html", b"<!DOCTYPE html><html>")


def test_render_table_pairs_each_value_with_its_heading():
    from app.ingest.normalise import render_table

    rows = [
        ["Serial number", "Category", "Safety study", "Experience/Evidence of Effectiveness", ""],
        ["1", "2", "3", "4", ""],
        ["", "", "", "Published Literature", "Proof of Effectiveness"],
        ["1", "(A) Classical formulation", "As per text", "Required", "Not Required"],
        ["2", "(C) New indication", "As per text", "If Required", "Required"],
    ]
    out = render_table(rows).splitlines()
    assert len(out) == 2
    assert "Category: (A) Classical formulation" in out[0]
    assert (
        "Proof of Effectiveness: Not Required" in out[0]
    )  # the row's own value, not a neighbour's
    assert "Proof of Effectiveness: Required" in out[1]
    assert "column" not in out[0]  # every value found a heading


def test_render_table_ignores_an_empty_table():
    from app.ingest.normalise import render_table

    assert render_table([["", ""], ["", ""]]) == ""
