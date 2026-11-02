"""Build SRT captions from narration text and known audio durations."""

from __future__ import annotations

import re


def chunk(text: str, max_chars: int = 42) -> list[str]:
    """Split narration into caption-sized pieces, preferring sentence/clause breaks."""
    sentences = re.split(r"(?<=[.!?])\s+", " ".join(text.split()))
    out: list[str] = []
    for s in sentences:
        if not s:
            continue
        words, line = s.split(), ""
        for word in words:
            trial = f"{line} {word}".strip()
            if len(trial) > max_chars and line:
                out.append(line)
                line = word
            else:
                line = trial
            if line.endswith((",", ";", ":")) and len(line) > max_chars * 0.5:
                out.append(line)
                line = ""
        if line:
            out.append(line)
    return out


def timed_chunks(text: str, start: float, duration: float, max_chars: int = 42):
    """Spread chunks over [start, start+duration] proportionally to their length."""
    pieces = chunk(text, max_chars)
    total = sum(len(p) + 3 for p in pieces) or 1
    t = start
    for p in pieces:
        d = duration * (len(p) + 3) / total
        yield t, t + d, p
        t += d


def _ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def to_srt(cues) -> str:
    return "".join(f"{i}\n{_ts(a)} --> {_ts(b)}\n{text}\n\n" for i, (a, b, text) in enumerate(cues, 1))
