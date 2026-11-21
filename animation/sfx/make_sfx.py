"""Synthesize the Axol's Lab sound-effect kit (no samples, no licensing issues).

Run:  python3 animation/sfx/make_sfx.py   -> writes animation/public/sfx/*.wav
Every sound is built from tuned sines and shaped noise, plus a short room reverb,
then peak-normalized. Keep them short and clean so they sit under the voice.
"""

from __future__ import annotations

import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def t(d: float) -> np.ndarray:
    return np.arange(int(SR * d)) / SR


def env(d: float, attack: float = 0.002, decay: float = 0.1) -> np.ndarray:
    x = t(d)
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(x - attack, 0) / decay)


def sweep(f0: float, f1: float, d: float, curve: float = 1.0) -> np.ndarray:
    x = t(d) / d
    f = f0 + (f1 - f0) * x**curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(d: float) -> np.ndarray:
    return rng.standard_normal(int(SR * d))


def onepole(x: np.ndarray, cutoff: float, high: bool = False) -> np.ndarray:
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s
        y[i] = s
    return x - y if high else y


def bandpass(x: np.ndarray, f: np.ndarray | float, q: float = 4.0) -> np.ndarray:
    """State-variable band-pass; f may change per sample (for whooshes)."""
    f = np.broadcast_to(np.asarray(f, dtype=float), x.shape)
    low = band = 0.0
    y = np.empty_like(x)
    damp = 1.0 / q
    for i, v in enumerate(x):
        g = 2 * np.sin(np.pi * min(f[i], SR / 6) / SR)
        low += g * band
        high = v - low - damp * band
        band += g * high
        y[i] = band
    return y


def bell(freq: float, d: float = 1.2, bright: float = 1.0) -> np.ndarray:
    x = t(d)
    parts = [(1.0, 1.0, 0.9), (2.76, 0.45 * bright, 0.35), (5.4, 0.25 * bright, 0.18), (8.93, 0.12 * bright, 0.09)]
    y = sum(a * np.sin(2 * np.pi * freq * r * x) * np.exp(-x / dec) for r, a, dec in parts)
    return y * np.clip(x / 0.002, 0, 1)


def reverb(x: np.ndarray, mix: float = 0.18, size: float = 1.0) -> np.ndarray:
    tail = int(SR * 0.6 * size)
    y = np.concatenate([x, np.zeros(tail)])
    wet = np.zeros_like(y)
    for delay, gain in [(0.029, 0.5), (0.037, 0.45), (0.043, 0.4), (0.053, 0.35), (0.067, 0.3), (0.079, 0.25)]:
        dl = int(SR * delay * size)
        g = gain
        k = dl
        while k < len(y) and g > 0.01:
            wet[k:] += y[: len(y) - k] * g
            k += dl
            g *= gain
    wet = onepole(wet, 5000)
    return y + mix * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(x))


def mix(*parts: tuple[float, np.ndarray]) -> np.ndarray:
    n = max(int(o * SR) + len(p) for o, p in parts)
    y = np.zeros(n)
    for o, p in parts:
        s = int(o * SR)
        y[s : s + len(p)] += p
    return y


def plus(*arrs: np.ndarray) -> np.ndarray:
    """Sum arrays of different lengths (shorter ones are zero-padded)."""
    n = max(len(a) for a in arrs)
    y = np.zeros(n)
    for a in arrs:
        y[: len(a)] += a
    return y


def save(name: str, x: np.ndarray, peak_db: float = -3.0, fade: float = 0.01) -> None:
    x = x - np.mean(x)
    nf = int(SR * fade)
    if nf and len(x) > nf:
        x[-nf:] *= np.linspace(1, 0, nf)
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def build() -> None:
    # bubble pop: quick downward pitch blip + tiny click
    d = 0.09
    pop = plus(sweep(1100, 260, d, 0.6) * env(d, 0.001, 0.025), 0.3 * onepole(noise(0.004), 4000) * env(0.004, 0.0005, 0.001))
    save("pop", reverb(pop, 0.12, 0.5))

    # soft headline "type-in": muffled woody knock
    d = 0.08
    knock = (np.sin(2 * np.pi * 620 * t(d)) + 0.4 * np.sin(2 * np.pi * 1240 * t(d))) * env(d, 0.001, 0.018)
    save("type", reverb(onepole(knock, 3000), 0.15, 0.4), -9)

    # clock tick / tock
    for name, f in (("tick", 2600), ("tock", 1700)):
        d = 0.05
        x = np.sin(2 * np.pi * f * t(d)) * env(d, 0.0005, 0.006) + 0.5 * onepole(noise(d), 6000, True) * env(d, 0.0003, 0.003)
        save(name, reverb(x, 0.2, 0.6), -6)

    # whoosh (long) and swish (short): noise through a rising-falling band
    for name, d, f0, f1 in (("whoosh", 0.7, 300, 2600), ("swish", 0.32, 900, 4200)):
        n = noise(d)
        x = t(d) / d
        f = f0 + (f1 - f0) * np.sin(np.pi * x) ** 1.5
        w = bandpass(n, f, 1.6) * np.sin(np.pi * x) ** 2
        save(name, reverb(w, 0.1, 0.8))

    # stamp thud: deep body + papery slap
    d = 0.4
    body = sweep(140, 55, d, 0.5) * env(d, 0.002, 0.11)
    slap = onepole(noise(0.06), 2500) * env(0.06, 0.0005, 0.012)
    save("thud", reverb(mix((0, body), (0, 0.8 * slap)), 0.2, 0.9))

    # door bang: wooden slam with a short room
    d = 0.6
    b = plus(sweep(180, 70, d, 0.4) * env(d, 0.001, 0.09), 0.9 * onepole(noise(0.12), 1800) * env(0.12, 0.0005, 0.025))
    save("bang", reverb(b, 0.35, 1.2))

    # ding: clean bell; chime: little major arpeggio; sparkle: high shimmer
    save("ding", reverb(bell(1318.5, 1.4), 0.25, 1.0))
    save("chime", reverb(mix((0, bell(1046.5, 1.2)), (0.07, bell(1318.5, 1.2)), (0.14, bell(1568.0, 1.4)), (0.21, 0.7 * bell(2093.0, 1.4))), 0.3, 1.0))
    sparkle = mix(*[(0.035 * i, 0.5 * bell(2093.0 * 2 ** (k / 12), 0.5, 0.6)) for i, k in enumerate([0, 4, 7, 12, 16])])
    save("sparkle", reverb(sparkle, 0.35, 0.9), -6)

    # boing: springy wobble that rises
    d = 0.45
    x = t(d)
    f = 180 + 420 * (x / d) ** 0.7 + 60 * np.sin(2 * np.pi * 16 * x) * np.exp(-x / 0.15)
    save("boing", reverb(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 0.16), 0.15, 0.6), -5)

    # hop: short cartoon jump (rising blip)
    d = 0.14
    save("hop", reverb(sweep(320, 900, d, 0.8) * env(d, 0.002, 0.05), 0.12, 0.5), -5)

    # clack: wood block (stacking blocks)
    d = 0.12
    clack = plus((np.sin(2 * np.pi * 950 * t(d)) + 0.6 * np.sin(2 * np.pi * 2280 * t(d))) * env(d, 0.0005, 0.02), 0.4 * onepole(noise(0.01), 5000) * env(0.01, 0.0002, 0.002))
    save("clack", reverb(clack, 0.18, 0.6))

    # crash: demolition clatter
    parts = [(0, 0.9 * onepole(noise(0.5), 3000) * env(0.5, 0.001, 0.12))]
    for i in range(7):
        o = 0.02 + rng.random() * 0.35
        f0 = 500 + rng.random() * 900
        parts.append((o, 0.6 * np.sin(2 * np.pi * f0 * t(0.1)) * env(0.1, 0.0005, 0.02)))
    parts.append((0, sweep(120, 45, 0.5, 0.5) * env(0.5, 0.001, 0.12)))
    save("crash", reverb(mix(*parts), 0.3, 1.1))

    # chomp: two bites
    bite = plus(sweep(260, 90, 0.08, 0.5) * env(0.08, 0.001, 0.025), 0.6 * onepole(noise(0.03), 3000) * env(0.03, 0.0005, 0.006))
    save("chomp", reverb(mix((0, bite), (0.11, 0.9 * bite)), 0.15, 0.6))

    # fizz: tiny crackles (H+ sparks)
    d = 0.6
    imp = np.zeros(int(SR * d))
    idx = rng.integers(0, len(imp), 90)
    imp[idx] = rng.uniform(-1, 1, len(idx))
    fz = onepole(imp, 7000) * np.sin(np.pi * t(d) / d)
    save("fizz", reverb(onepole(fz, 1500, True), 0.15, 0.5), -8)

    # scribble: pencil scratching
    d = 0.55
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 11 * t(d)) ** 2
    sc = bandpass(noise(d), 3200, 2.5) * am * np.sin(np.pi * t(d) / d)
    save("scribble", reverb(sc, 0.1, 0.5), -8)

    # rise: elevator glide with a soft motor hum
    d = 0.9
    rise = 0.6 * sweep(160, 260, d, 1.0) * np.sin(np.pi * t(d) / d) + 0.3 * bandpass(noise(d), 400, 3) * np.sin(np.pi * t(d) / d)
    save("rise", reverb(rise, 0.15, 0.8), -8)

    # confetti: party popper + sparkles
    pop2 = plus(sweep(600, 120, 0.12, 0.5) * env(0.12, 0.001, 0.03), onepole(noise(0.08), 4000) * env(0.08, 0.0005, 0.015))
    sp = mix(*[(0.05 + rng.random() * 0.6, 0.25 * bell(1800 + rng.random() * 1800, 0.35, 0.5)) for _ in range(14)])
    save("confetti", reverb(mix((0, pop2), (0, sp)), 0.3, 1.0))

    # tap: tiptoe step; blip: loading blip; slide: soft slide for the victory skid
    save("tap", reverb(onepole(noise(0.02), 2500) * env(0.02, 0.0005, 0.004) + 0.4 * np.sin(2 * np.pi * 400 * t(0.02)) * env(0.02, 0.0005, 0.006), 0.15, 0.4), -10)
    d = 0.07
    save("blip", reverb(np.sign(np.sin(2 * np.pi * 880 * t(d))) * 0.3 * env(d, 0.002, 0.02), 0.15, 0.4), -12)
    d = 0.5
    slide = bandpass(noise(d), 1200 + 1500 * (1 - t(d) / d), 2.0) * np.sin(np.pi * t(d) / d) ** 0.7
    save("slide", reverb(slide, 0.1, 0.5), -6)


if __name__ == "__main__":
    build()
    print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
