"""Voice in and out.

The provider calls are faked; the live check is in docs/WHAT-CHANGED-2026-09-23.md
(Groq Whisper transcribed a spoken question correctly). What these hold is the
contract: consent before a recording is accepted, a size limit, Bhashini first
with a working fallback, and an audit row that never holds the audio or the words.
"""

import base64
from types import SimpleNamespace as NS

from fastapi.testclient import TestClient

from app import voice
from app.main import app


class FakeWhisper:
    def __init__(self, text="Can I patent turmeric?"):
        self.text = text
        self.calls = []
        self.audio = NS(transcriptions=NS(create=self._create))

    def _create(self, **kw):
        self.calls.append(kw)
        return NS(text=self.text)


class BrokenBhashini:
    def asr(self, audio, language):
        raise RuntimeError("service down")

    def tts(self, text, language):
        raise RuntimeError("service down")


def test_whisper_is_used_without_bhashini(monkeypatch):
    monkeypatch.delenv("BHASHINI_USER_ID", raising=False)
    whisper = FakeWhisper()
    heard = voice.transcribe(b"RIFF....", "hi", whisper=whisper)
    assert heard.provider == "groq-whisper" and heard.text == "Can I patent turmeric?"
    assert whisper.calls[0]["language"] == "hi"
    assert "Ayurvedic" in whisper.calls[0]["prompt"]  # the vocabulary hint goes with it


def test_a_failing_bhashini_falls_back_to_whisper(monkeypatch):
    monkeypatch.setenv("BHASHINI_USER_ID", "u")
    monkeypatch.setenv("BHASHINI_API_KEY", "k")
    monkeypatch.setenv("SPEECH_PROVIDER", "bhashini")
    heard = voice.transcribe(b"RIFF....", "ta", bhashini=BrokenBhashini(), whisper=FakeWhisper())
    assert heard.provider == "groq-whisper"
    # TTS has no server fallback: None tells the route to let the browser read it.
    assert voice.synthesise("hello", "ta", bhashini=BrokenBhashini()) is None


def test_tts_without_bhashini_hands_reading_to_the_browser(monkeypatch):
    monkeypatch.delenv("BHASHINI_USER_ID", raising=False)
    r = TestClient(app).post(
        "/voice/tts", json={"text": "hello", "language": "hi"}, headers={"X-Session-Id": "s" * 16}
    )
    assert r.status_code == 204 and r.headers["X-Voice-Fallback"] == "browser"


def test_asr_needs_consent_limits_size_and_audits_nothing_personal(db_session, monkeypatch):
    monkeypatch.setattr(voice, "whisper_asr", lambda audio, language, client=None: "a question")
    client = TestClient(app)
    h = {"X-Session-Id": "voice-test-session-01"}
    wav = base64.b64encode(b"RIFF" + b"\0" * 64).decode()

    assert client.post("/voice/asr", json={"audio_base64": wav}, headers=h).status_code == 403
    client.post("/consent", json={"scope": "assistant", "granted": True}, headers=h)

    too_big = base64.b64encode(b"\0" * (voice.MAX_AUDIO_BYTES + 1)).decode()
    assert client.post("/voice/asr", json={"audio_base64": too_big}, headers=h).status_code == 413
    assert client.post("/voice/asr", json={"audio_base64": "%%%"}, headers=h).status_code == 422

    r = client.post("/voice/asr", json={"audio_base64": wav, "language": "mr"}, headers=h)
    assert r.status_code == 200 and r.json() == {
        "text": "a question",
        "language": "mr",
        "provider": "groq-whisper",
    }

    from sqlalchemy import select

    from app.db.models import AuditEvent

    rows = db_session.scalars(
        select(AuditEvent).where(
            AuditEvent.session_id == h["X-Session-Id"], AuditEvent.kind == "voice_asr"
        )
    ).all()
    assert rows and set(rows[-1].payload) == {"provider", "language", "audio_bytes"}
    client.delete("/me", headers=h)
