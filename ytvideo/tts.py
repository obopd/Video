"""Text-to-speech backends.

engine:
  auto   - edge if installed, else espeak-ng/espeak, else none
  edge   - Microsoft Edge neural voices via the `edge-tts` package (free, needs internet)
  espeak - offline, robotic, needs `espeak-ng` or `espeak` on PATH
  none   - no voice; scene length is estimated from the narration word count
"""

from __future__ import annotations

import asyncio
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


def synthesize(text: str, out_mp3: Path, engine: str, voice: dict) -> bool:
    """Write speech for `text` to `out_mp3`. Returns False if engine is 'none'."""
    if engine == "none":
        return False
    if engine == "edge":
        import edge_tts

        async def run():
            comm = edge_tts.Communicate(
                text,
                voice.get("name", "en-US-AriaNeural"),
                rate=voice.get("rate", "+0%"),
                pitch=voice.get("pitch", "+0Hz"),
                volume=voice.get("volume", "+0%"),
            )
            await comm.save(str(out_mp3))

        asyncio.run(run())
        return True
    if engine == "espeak":
        exe = shutil.which("espeak-ng") or shutil.which("espeak")
        if not exe:
            raise RuntimeError("espeak engine selected but espeak-ng/espeak is not installed")
        wav = out_mp3.with_suffix(".wav")
        subprocess.run([exe, "-v", voice.get("espeak_voice", "en-us"), "-s", str(voice.get("wpm", 165)),
                        "-w", str(wav), text], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), str(out_mp3)], check=True)
        return True
    raise ValueError(f"unknown TTS engine: {engine!r}")


def estimate_seconds(text: str) -> float:
    return max(1.5, len(text.split()) / WORDS_PER_SECOND)
