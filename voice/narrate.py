#!/usr/bin/env python3
"""Kokoro narrator engine (VOICE.md Route B) with human-style delivery.

Why not just slow the voice down to hit 155 wpm? Because dragging every syllable
sounds robotic and low-energy. Real narrators talk at a natural speed and get their
pace from pauses between thoughts. So this engine:

  * keeps each voice near its natural speed and reaches the target pace with pauses
  * renders sentence by sentence, with slightly varied pause lengths
    (longer after questions and before reveals, shorter between linked thoughts)
  * varies speed a little per sentence (+-3%), slows on [slow] sentences (key
    takeaways, new terms) and speeds up a touch on [fast] asides
  * joins with short crossfades over a continuous room-tone bed
  * runs the fixed VOICE.md section 6 chain: high-pass 80 Hz, de-ess, light 2.5:1
    compression, very subtle small room, room tone, loudness -14 LUFS / -1 dBTP

Script markup: put [slow] or [fast] at the start of a sentence; a blank line is a
longer paragraph beat.
"""
import hashlib
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000


def split_script(text):
    """-> list of (sentence, mode, pause_after_seconds)."""
    out = []
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    for pi, para in enumerate(paragraphs):
        sents = re.findall(r"(?:\[(?:slow|fast)\]\s*)?[^.?!]+[.?!]+[\"')]*", para.replace("\n", " "))
        for si, s in enumerate(sents):
            s = s.strip()
            mode = "normal"
            m = re.match(r"\[(slow|fast)\]\s*", s)
            if m:
                mode, s = m.group(1), s[m.end():]
            h = int(hashlib.md5(s.encode()).hexdigest()[:6], 16) / 0xFFFFFF  # deterministic 0..1
            if s.endswith("?"):
                pause = 0.55
            elif len(s.split()) <= 5:
                pause = 0.42
            else:
                pause = 0.36
            pause += (h - 0.5) * 0.12
            last_in_para = si == len(sents) - 1
            if last_in_para and pi < len(paragraphs) - 1:
                pause = 0.85
            out.append((s, mode, round(pause, 3), h))
    return out


def trim(a, thresh=0.01, keep=0.03):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    k = int(keep * SR)
    return a[max(0, idx[0] - k): idx[-1] + k]


def room_tone(n, level_db=-62, seed=0):
    rng = np.random.default_rng(seed)
    w = rng.normal(0, 1, n + 2048)
    # soft pink-ish tone: cumulative filtering of white noise
    b = np.convolve(w, np.ones(64) / 64, "same")
    b = b[:n] / (np.std(b[:n]) + 1e-9)
    return (b * 10 ** (level_db / 20)).astype(np.float32)


def render_raw(pipe, voice, text, base_speed):
    """Sentence-by-sentence render with varied speed and pauses. Returns float32 audio."""
    parts = []
    for s, mode, pause, h in split_script(text):
        sp = base_speed * (1 + (h - 0.5) * 0.06)
        if mode == "slow":
            sp *= 0.9
        elif mode == "fast":
            sp *= 1.05
        audio = np.concatenate([np.asarray(r.audio) for r in pipe(s, voice=voice, speed=sp)]).astype(np.float32)
        parts.append((trim(audio), pause))
    fade = int(0.015 * SR)
    total = sum(len(a) + int(p * SR) for a, p in parts) + int(0.6 * SR)
    out = np.zeros(total, np.float32)
    pos = int(0.25 * SR)
    for a, p in parts:
        a = a.copy()
        a[:fade] *= np.linspace(0, 1, fade)
        a[-fade:] *= np.linspace(1, 0, fade)
        out[pos:pos + len(a)] += a
        pos += len(a) + int(p * SR)
    return out[:pos + int(0.35 * SR)]


def studio_chain(raw, out_path, room_db=-62):
    """VOICE.md section 6, identical for every video."""
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        sf.write(td / "in.wav", raw, SR)
        # small-room impulse response: short, dense, quickly decaying
        n = int(0.22 * SR)
        rng = np.random.default_rng(7)
        ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / (0.045 * SR))
        ir[0] = 0
        ir = ir / np.max(np.abs(ir)) * 0.5
        ir = np.concatenate([[1.0], np.zeros(int(0.004 * SR)), ir * 0.09]).astype(np.float32)  # ~9% wet
        sf.write(td / "ir.wav", ir, SR)
        sf.write(td / "tone.wav", room_tone(len(raw) + SR, room_db), SR)
        chain = ("[0:a]highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=-1.5,deesser=i=0.35,"
                 "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2[v];"
                 "[v][1:a]afir=dry=10:wet=10[r];"
                 "[r][2:a]amix=inputs=2:duration=first:normalize=0,"
                 "loudnorm=I=-14:TP=-1:LRA=11[o]")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(td / "in.wav"), "-i", str(td / "ir.wav"),
                        "-i", str(td / "tone.wav"), "-filter_complex", chain, "-map", "[o]", "-ar", "48000",
                        str(out_path)], check=True)
