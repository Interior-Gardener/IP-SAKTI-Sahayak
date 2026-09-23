"""Voice in and voice out: speech recognition (ASR) and speech synthesis (TTS).

Bhashini first, because it is the national language infrastructure the problem
statement names and it covers the Indian languages the assistant answers in.
A Bhashini account takes days to approve, so nothing here blocks on one:

- ASR falls back to Groq Whisper, which the answer path's key already reaches.
- TTS falls back to the browser. The route answers 204 with a header saying so,
  and the web reads the answer aloud with its own speech synthesis — the same
  `useNarrator` the plant pages use, in the answer's language.

Audio is personal data. Nothing here stores it: the route passes it to the
provider and forgets it, and the audit row records the provider, the language
and the size — never the audio and never the transcript.
"""

import base64
import io
import logging
import os
from dataclasses import dataclass

import httpx

import app.settings  # noqa: F401 - copies the repo .env into os.environ, where the keys are read

logger = logging.getLogger(__name__)

#: The languages the assistant answers in, as ISO 639-1 codes. Bhashini uses the
#: same codes; Whisper takes them as its `language` hint.
LANGUAGES = ("en", "hi", "mr", "ta", "te", "kn", "bn", "gu")

#: Upper bound on what the route accepts: about a minute of 16 kHz mono WAV.
MAX_AUDIO_BYTES = 2_500_000

#: The longest text read aloud in one request. Answers are longer than this;
#: the web reads them a section at a time.
MAX_TTS_CHARS = 2_000

#: ULCA's pipeline service: one call to find the models for a task and
#: language, a second to the inference endpoint it returns. Written to the
#: published ULCA pipeline API; see docs/providers.md §5 for how it was checked.
BHASHINI_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
BHASHINI_PIPELINE_ID = "64392f96daac500b55c543cd"

#: Words Whisper would otherwise spell as it hears them. A vocabulary prompt
#: is how Whisper takes a hint: the first live test heard "Ayurvedic" as
#: "A. Urvedic", which is the one word nearly every question here contains.
ASR_VOCABULARY = (
    "Ayurveda, Ayurvedic, AYUSH, Siddha, Unani, TKDL, patent, Patents Act, section 3(p), "
    "geographical indication, GI, trade mark, Biological Diversity Act, NBA, "
    "benefit-sharing, Nagoya Protocol, TRIPS, PCT, Budapest Treaty, bhasma, churna, "
    "asava, arishta, rasa shastra, Schedule E(1), Drugs and Cosmetics Rules, FSSAI."
)


class VoiceUnavailable(Exception):
    """No provider could do it. The route turns this into a plain 503."""


@dataclass
class Transcript:
    text: str
    language: str
    provider: str


@dataclass
class Speech:
    audio: bytes
    mime: str
    provider: str


def bhashini_configured() -> bool:
    return bool(os.environ.get("BHASHINI_USER_ID") and os.environ.get("BHASHINI_API_KEY"))


def speech_provider() -> str:
    """'bhashini' when it is both chosen and configured, else 'fallback'."""
    wanted = os.environ.get("SPEECH_PROVIDER", "bhashini").lower()
    return "bhashini" if wanted == "bhashini" and bhashini_configured() else "fallback"


class Bhashini:
    """The two-step ULCA pipeline: ask which service handles a task in a
    language, then call the inference endpoint it hands back."""

    def __init__(self, client: httpx.Client | None = None) -> None:
        self.client = client or httpx.Client(timeout=30)

    def _pipeline(self, task: dict) -> tuple[str, dict[str, str], str]:
        response = self.client.post(
            BHASHINI_CONFIG_URL,
            headers={
                "userID": os.environ["BHASHINI_USER_ID"],
                "ulcaApiKey": os.environ["BHASHINI_API_KEY"],
            },
            json={
                "pipelineTasks": [task],
                "pipelineRequestConfig": {"pipelineId": BHASHINI_PIPELINE_ID},
            },
        )
        response.raise_for_status()
        body = response.json()
        endpoint = body["pipelineInferenceAPIEndPoint"]
        key = endpoint["inferenceApiKey"]
        service_id = body["pipelineResponseConfig"][0]["config"][0]["serviceId"]
        return endpoint["callbackUrl"], {key["name"]: key["value"]}, service_id

    def asr(self, audio_wav: bytes, language: str) -> str:
        task = {"taskType": "asr", "config": {"language": {"sourceLanguage": language}}}
        url, headers, service_id = self._pipeline(task)
        task["config"].update(serviceId=service_id, audioFormat="wav", samplingRate=16000)
        response = self.client.post(
            url,
            headers=headers,
            json={
                "pipelineTasks": [task],
                "inputData": {"audio": [{"audioContent": base64.b64encode(audio_wav).decode()}]},
            },
        )
        response.raise_for_status()
        return response.json()["pipelineResponse"][0]["output"][0]["source"]

    def tts(self, text: str, language: str) -> bytes:
        task = {"taskType": "tts", "config": {"language": {"sourceLanguage": language}}}
        url, headers, service_id = self._pipeline(task)
        task["config"].update(serviceId=service_id, gender="female")
        response = self.client.post(
            url,
            headers=headers,
            json={"pipelineTasks": [task], "inputData": {"input": [{"source": text}]}},
        )
        response.raise_for_status()
        content = response.json()["pipelineResponse"][0]["audio"][0]["audioContent"]
        return base64.b64decode(content)


def whisper_asr(audio_wav: bytes, language: str, client=None) -> str:
    """Groq's hosted Whisper. Its key is the one the answer path already uses."""
    if client is None:
        from groq import Groq

        from app.llm.groq_provider import groq_keys

        keys = groq_keys()
        if not keys:
            raise VoiceUnavailable("no speech provider is configured")
        client = Groq(api_key=keys[0])
    result = client.audio.transcriptions.create(
        file=("speech.wav", io.BytesIO(audio_wav)),
        model=os.environ.get("ASR_FALLBACK_MODEL", "whisper-large-v3"),
        language=language,
        prompt=ASR_VOCABULARY,
        response_format="json",
    )
    return (getattr(result, "text", "") or "").strip()


def transcribe(
    audio_wav: bytes, language: str, bhashini: Bhashini | None = None, whisper=None
) -> Transcript:
    """Bhashini when configured; Whisper when it is not or when it fails."""
    if speech_provider() == "bhashini":
        try:
            text = (bhashini or Bhashini()).asr(audio_wav, language)
            return Transcript(text.strip(), language, "bhashini")
        except Exception as e:  # noqa: BLE001 - any Bhashini failure falls back
            logger.warning(
                "bhashini asr failed (%s); falling back to whisper", e.__class__.__name__
            )
    try:
        return Transcript(whisper_asr(audio_wav, language, whisper), language, "groq-whisper")
    except VoiceUnavailable:
        raise
    except Exception as e:  # noqa: BLE001 - surfaced as a 503, never a stack trace
        raise VoiceUnavailable(f"speech recognition failed ({e.__class__.__name__})") from e


def synthesise(text: str, language: str, bhashini: Bhashini | None = None) -> Speech | None:
    """Audio from Bhashini, or None: the caller reads it in the browser instead."""
    if speech_provider() != "bhashini":
        return None
    try:
        audio = (bhashini or Bhashini()).tts(text, language)
        return Speech(audio, "audio/wav", "bhashini")
    except Exception as e:  # noqa: BLE001 - the browser is the fallback
        logger.warning("bhashini tts failed (%s); browser will read it", e.__class__.__name__)
        return None
