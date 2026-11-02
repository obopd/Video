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


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def token_times(text: str, words: list[dict]) -> list[float]:
    """Start time of each whitespace token of `text`, aligned to TTS word timings."""
    tokens = text.split()
    times: list[float] = []
    j, last = 0, 0.0
    for tok in tokens:
        t = _norm(tok)
        found = None
        for k in range(j, min(j + 4, len(words))):
            w = _norm(words[k]["text"])
            if w and (t.startswith(w) or w.startswith(t)):
                found = k
                break
        if found is not None:
            last = words[found]["start"]
            j = found + 1
        times.append(last)
    return times


def word_timed_chunks(text: str, words: list[dict], start: float, end: float, max_chars: int = 42):
    """Caption chunks timed from real word timings (seconds relative to `start`)."""
    pieces = chunk(text, max_chars)
    times = token_times(" ".join(text.split()), words)
    idx = 0
    starts = []
    for p in pieces:
        starts.append(start + times[min(idx, len(times) - 1)])
        idx += len(p.split())
    for i, p in enumerate(pieces):
        stop = starts[i + 1] if i + 1 < len(pieces) else end
        yield starts[i], max(stop, starts[i] + 0.3), p


def _ts(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def to_srt(cues) -> str:
    return "".join(f"{i}\n{_ts(a)} --> {_ts(b)}\n{text}\n\n" for i, (a, b, text) in enumerate(cues, 1))
