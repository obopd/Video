"""Text-to-speech backends.

engine:
  auto   - edge if installed, else espeak-ng/espeak, else none
  edge   - Microsoft Edge neural voices via the `edge-tts` package (free, needs internet)
  espeak - offline, robotic, needs `espeak-ng` or `espeak` on PATH
  none   - no voice; scene length is estimated from the narration word count

synthesize() also returns word timings ({text, start, end} in seconds) when the
engine provides them (edge does). They drive caption timing and let animated
scenes trigger on specific spoken words.
"""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
from pathlib import Path

WORDS_PER_SECOND = 2.6  # ~155 wpm, used when there is no voice


def resolve_engine(engine: str) -> str:
    if engine != "auto":
        return engine
    try:
        import edge_tts  # noqa: F401
        return "edge"
    except ImportError:
        pass
    if shutil.which("espeak-ng") or shutil.which("espeak"):
        return "espeak"
    return "none"


def _edge(text: str, out_mp3: Path, voice: dict) -> list[dict]:
    # Respect a custom CA bundle (corporate proxies etc.); edge-tts otherwise only trusts certifi.
    if os.environ.get("SSL_CERT_FILE"):
        import certifi
        certifi.where = lambda: os.environ["SSL_CERT_FILE"]
    import edge_tts

    async def run() -> list[dict]:
        comm = edge_tts.Communicate(
            text,
            voice.get("name", "en-US-AndrewNeural"),
            rate=voice.get("rate", "+0%"),
            pitch=voice.get("pitch", "+0Hz"),
            volume=voice.get("volume", "+0%"),
            boundary="WordBoundary",
            proxy=os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None,
        )
        words = []
        with open(out_mp3, "wb") as fh:
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    fh.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    start = chunk["offset"] / 1e7  # 100ns ticks
                    words.append({"text": chunk["text"], "start": start, "end": start + chunk["duration"] / 1e7})
        return words

    return asyncio.run(run())


def synthesize(text: str, out_mp3: Path, engine: str, voice: dict) -> tuple[bool, list[dict]]:
    """Write speech for `text` to `out_mp3`. Returns (made_audio, word_timings)."""
    if engine == "none":
        return False, []
    if engine == "edge":
        return True, _edge(text, out_mp3, voice)
    if engine == "espeak":
        exe = shutil.which("espeak-ng") or shutil.which("espeak")
        if not exe:
            raise RuntimeError("espeak engine selected but espeak-ng/espeak is not installed")
        wav = out_mp3.with_suffix(".wav")
        subprocess.run([exe, "-v", voice.get("espeak_voice", "en-us"), "-s", str(voice.get("wpm", 165)),
                        "-w", str(wav), text], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), str(out_mp3)], check=True)
        return True, []
    raise ValueError(f"unknown TTS engine: {engine!r}")


def estimate_seconds(text: str) -> float:
    return max(1.5, len(text.split()) / WORDS_PER_SECOND)


def estimate_words(text: str, seconds: float) -> list[dict]:
    """Spread words over `seconds` by length, for when the engine gives no timings."""
    words = text.split()
    total = sum(len(w) + 2 for w in words) or 1
    out, t = [], 0.0
    for w in words:
        d = seconds * (len(w) + 2) / total
        out.append({"text": w, "start": t, "end": t + d})
        t += d
    return out
