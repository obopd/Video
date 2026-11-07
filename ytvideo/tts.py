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


_HQ_FORMAT = "audio-24khz-96kbitrate-mono-mp3"  # edge-tts asks for 48 kbps; 96 kbps has fewer artifacts


def _edge_one(text: str, out_mp3: Path, voice: dict) -> list[dict]:
    """One request to the Edge voice service. Returns word timings."""
    if os.environ.get("SSL_CERT_FILE"):  # respect a custom CA bundle (corporate proxies etc.)
        import certifi
        certifi.where = lambda: os.environ["SSL_CERT_FILE"]
    import aiohttp
    import edge_tts

    async def run() -> list[dict]:
        comm = edge_tts.Communicate(
            text,
            voice.get("name", "en-US-AndrewMultilingualNeural"),
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

    # Ask for the higher-bitrate stream. edge-tts hardcodes its format, so swap it in the
    # config message; if the service ever rejects it we retry with the default.
    orig = aiohttp.ClientWebSocketResponse.send_str

    async def send_str(self, data, *a, **kw):
        if "speech.config" in data and voice.get("hq", True):
            data = data.replace("audio-24khz-48kbitrate-mono-mp3", _HQ_FORMAT)
        return await orig(self, data, *a, **kw)

    aiohttp.ClientWebSocketResponse.send_str = send_str
    try:
        # the free service occasionally drops a request: retry, then fall back to the default format
        import time
        last: Exception | None = None
        for attempt in range(5):
            try:
                return asyncio.run(run())
            except Exception as e:  # noqa: BLE001
                last = e
                if attempt == 2:
                    voice = {**voice, "hq": False}
                time.sleep(1.5 * (attempt + 1))
        raise last  # type: ignore[misc]
    finally:
        aiohttp.ClientWebSocketResponse.send_str = orig


def split_sentences(text: str) -> list[tuple[str, float]]:
    """Split narration into sentences, each with the pause (seconds) that follows it.

    A real narrator doesn't leave identical gaps between sentences, so pauses vary a
    little (deterministically, so re-renders match). "..." or an em dash asks for a
    longer, dramatic pause. (The service also adds ~0.25 s of lead-in to each sentence.)
    """
    import re
    import zlib

    parts = re.split(r"(?<=[.!?\u2026])\s+|(?<=\u2014)\s*", " ".join(text.split()))
    out = []
    for p in (x.strip() for x in parts):
        if not p:
            continue
        jitter = (zlib.crc32(p.encode()) % 1000) / 1000  # 0..1
        if p.endswith(("...", "\u2026", "\u2014")):
            pause = 0.42 + 0.2 * jitter
        elif p.endswith("?"):
            pause = 0.26 + 0.14 * jitter
        else:
            pause = 0.08 + 0.14 * jitter
        out.append((p.rstrip("\u2014").strip(), pause))
    # Very short sentences ("No calculator.") give the multilingual voice too little context
    # to recognise English, and it can slip into another accent. Send them with a neighbour.
    merged: list[tuple[str, float]] = []
    for sent, pause in out:
        if merged and (len(merged[-1][0].split()) < 4 or len(sent.split()) < 4):
            merged[-1] = (merged[-1][0] + " " + sent, pause)
        else:
            merged.append((sent, pause))
    return merged


# Subtle "recorded voice" treatment: remove rumble, add a little chest warmth and
# presence, gentle compression like a voiceover chain, a very small room, and faint
# room tone so silences aren't digitally dead (a common giveaway of synthetic audio).
POLISH = (
    "highpass=f=70,"
    "equalizer=f=170:t=q:w=1.0:g=2.5,"
    "equalizer=f=3200:t=q:w=1.4:g=1.5,"
    "acompressor=threshold=-21dB:ratio=2.5:attack=6:release=140:makeup=1.5,"
    "aecho=0.88:0.9:23|41:0.06|0.035"
)


def _edge(text: str, out_mp3: Path, voice: dict) -> list[dict]:
    """Sentence-by-sentence synthesis joined with natural pauses, then polished."""
    import tempfile

    sentences = split_sentences(text) if voice.get("natural_pauses", True) else [(text, 0.0)]
    words: list[dict] = []
    with tempfile.TemporaryDirectory() as tmp:
        tmpd = Path(tmp)
        inputs, chain, t = [], [], 0.0
        for i, (sent, pause) in enumerate(sentences):
            raw = tmpd / f"s{i}.mp3"
            sw = _edge_one(sent, raw, voice)
            trimmed = tmpd / f"s{i}.wav"
            # drop the service's trailing silence so we control the pauses ourselves
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                            "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.09,"
                            "afade=t=in:d=0.03,areverse,afade=t=in:d=0.004,"  # soft edges: no clicks at sentence joins
                            "aresample=48000", "-ac", "1", str(trimmed)], check=True)
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                        "-of", "csv=p=0", str(trimmed)], capture_output=True, text=True).stdout)
            words += [{**w, "start": w["start"] + t, "end": w["end"] + t} for w in sw]
            gap = pause if i < len(sentences) - 1 else 0.0
            inputs += ["-i", str(trimmed)]
            chain.append(f"[{i}:a]apad=pad_dur={gap:.3f}[p{i}]")
            t += dur + gap
        n = len(sentences)
        joined = ";".join(chain) + ";" + "".join(f"[p{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[v]"
        polish = voice.get("polish", True)
        if polish:
            joined += (f";[v]{POLISH}[w];anoisesrc=color=pink:amplitude=0.0016:sample_rate=48000:d={t + 0.5:.2f},"
                       "lowpass=f=6000[n];[w][n]amix=inputs=2:duration=first:normalize=0[out]")
        else:
            joined += ";[v]anull[out]"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", joined,
                        "-map", "[out]", "-ar", "48000", "-ac", "1", "-c:a", "libmp3lame", "-q:a", "0",
                        str(out_mp3)], check=True)
    return words


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
