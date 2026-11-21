#!/usr/bin/env python3
"""Procedurally generate a vertical (phone-format) music video entirely in code.

No footage, no stock assets, no AI video model: every pixel and every audio
sample is computed here with numpy + Pillow, then encoded with ffmpeg.

Usage: python3 generate.py [output.mp4]
"""
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 720, 1280, 30, 15.0
NFRAMES = int(FPS * DUR)
SR = 44100
BPM = 100
BEAT = 60 / BPM
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
rng = np.random.default_rng(7)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def beat_pulse(t):
    """1.0 on each beat, decaying quickly - drives visual 'kicks'."""
    return np.exp(-((t % BEAT) / BEAT) * 6)


def glow(img, radius=12, strength=1.0):
    blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)
    return blurred * strength


def text_layer(lines, t_in, t, size=64, y=0.5, color=(255, 255, 255)):
    """Return float RGB array with glowing text that fades/slides in at t_in."""
    a = smooth((t - t_in) / 0.8)
    layer = Image.new("RGB", (W, H))
    if a <= 0:
        return np.zeros((H, W, 3), np.float32)
    d = ImageDraw.Draw(layer)
    yy = int(H * y + (1 - a) * 40)
    for i, (txt, bold, sz) in enumerate(lines):
        f = ImageFont.truetype(FONT_BOLD if bold else FONT_REG, sz)
        bw = d.textlength(txt, font=f)
        d.text(((W - bw) / 2, yy), txt, font=f, fill=color)
        yy += int(sz * 1.3)
    arr = np.asarray(layer, np.float32)
    return (arr + glow(layer, 14, 1.4)) * a


# ---------------------------------------------------------------- scene 1
NSTARS = 1800
stars = np.column_stack([rng.uniform(-1, 1, NSTARS), rng.uniform(-1, 1, NSTARS),
                         rng.uniform(0.05, 1, NSTARS)])
star_hue = rng.uniform(0, 1, NSTARS)


def scene_starfield(t):
    img = np.zeros((H, W, 3), np.float32)
    speed = 0.25 + 0.6 * smooth(t / 3)
    z = (stars[:, 2] - t * speed) % 1.0 + 0.02
    for trail in range(4):  # motion streaks
        zt = z + trail * 0.012 * speed
        sx = (stars[:, 0] / zt * W * 0.35 + W / 2).astype(int)
        sy = (stars[:, 1] / zt * W * 0.35 + H / 2).astype(int)
        ok = (sx >= 0) & (sx < W - 1) & (sy >= 0) & (sy < H - 1)
        b = np.clip((1 - zt) * 1.4, 0, 1)[ok] * (1 - trail / 4) * 255
        c = np.column_stack([0.7 + 0.3 * np.cos(star_hue[ok] * 6.28),
                             0.8 * np.ones(ok.sum()),
                             np.ones(ok.sum())]) * b[:, None]
        for dx in (0, 1):
            for dy in (0, 1):
                np.add.at(img, (sy[ok] + dy, sx[ok] + dx), c)
    # nebula tint
    yy, xx = np.mgrid[0:H:8, 0:W:8] / np.array([H, W])[:, None, None]
    neb = 0.5 + 0.5 * np.sin(xx * 5 + t * 0.6) * np.cos(yy * 4 - t * 0.4)
    neb = np.kron(neb, np.ones((8, 8)))[:H, :W]
    img += neb[..., None] * np.array([40, 10, 70], np.float32)
    img += text_layer([("CODE", True, 120), ("IN MOTION", True, 72)], 1.2, t, y=0.40)
    img += text_layer([("rendered from a phone prompt", False, 34)], 2.4, t, y=0.62,
                      color=(150, 200, 255))
    return img


# ---------------------------------------------------------------- scene 2
LW, LH = W // 4, H // 4
ly, lx = np.mgrid[0:LH, 0:LW].astype(np.float32)
lx /= LW
ly /= LH


def scene_plasma(t):
    v = (np.sin(lx * 10 + t) + np.sin(ly * 8 - t * 1.3)
         + np.sin((lx + ly) * 6 + t * 0.7)
         + np.sin(np.hypot(lx - 0.5, ly - 0.5) * 18 - t * 2))
    r = 0.5 + 0.5 * np.sin(v * np.pi + 0)
    g = 0.5 + 0.5 * np.sin(v * np.pi + 2.1)
    b = 0.5 + 0.5 * np.sin(v * np.pi + 4.2)
    small = (np.stack([r, g, b], -1) * 120).astype(np.uint8)
    bg = np.asarray(Image.fromarray(small).resize((W, H), Image.BICUBIC), np.float32)

    shapes = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(shapes)
    cx, cy = W / 2, H * 0.45
    kick = beat_pulse(t)
    for ring in range(3):
        n = 12 + ring * 6
        rad = 120 + ring * 85 + kick * 25
        for i in range(n):
            ang = i / n * 2 * np.pi + t * (0.8 - ring * 0.35) * (1 if ring % 2 == 0 else -1)
            x = cx + np.cos(ang) * rad
            y = cy + np.sin(ang) * rad
            s = 9 - ring * 2 + kick * 5
            hue = (i / n + t * 0.1 + ring * 0.3) % 1
            col = tuple(int(255 * (0.5 + 0.5 * np.cos(6.28 * (hue + o)))) for o in (0, .33, .66))
            d.ellipse([x - s, y - s, x + s, y + s], fill=col)
    # oscilloscope wave
    xs = np.linspace(0, W, 180)
    ys = H * 0.80 + np.sin(xs / W * 12 + t * 5) * 50 * (0.4 + kick) * np.sin(xs / W * np.pi)
    d.line(list(zip(xs, ys)), fill=(255, 255, 255), width=4)
    arr = np.asarray(shapes, np.float32)
    bg = bg * 0.55 + np.array([30, 5, 45], np.float32)
    img = bg + arr + glow(shapes, 16, 2.0)
    img += text_layer([("every pixel is math", True, 52)], 5.8, t, y=0.08)
    return img


# ---------------------------------------------------------------- scene 3
HORIZON = int(H * 0.56)
sky_y = np.linspace(0, 1, HORIZON)[:, None]
SKY = np.stack([40 + 200 * sky_y, 10 + 40 * sky_y, 70 + 60 * (1 - sky_y)], -1)
SKY = np.repeat(SKY, W, axis=1).astype(np.float32)


def scene_synthwave(t):
    img = np.zeros((H, W, 3), np.float32)
    img[:HORIZON] = SKY
    # sun with scrolling stripe cut-outs
    sun = Image.new("L", (W, H))
    sd = ImageDraw.Draw(sun)
    R = 210
    scx, scy = W / 2, HORIZON - 120
    sd.ellipse([scx - R, scy - R, scx + R, scy + R], fill=255)
    for k in range(8):
        yk = scy + 10 + ((k * 28 + t * 30) % 230)
        hgt = 4 + (yk - scy) / 7
        sd.rectangle([0, yk, W, yk + hgt], fill=0)
    sd.rectangle([0, HORIZON, W, H], fill=0)
    sm = np.asarray(sun, np.float32)[..., None] / 255
    grad = np.linspace(0, 1, H)[:, None, None]
    sun_col = np.concatenate([np.full_like(grad, 255), 220 - 180 * grad * 1.8, 80 + 0 * grad], -1)
    img = img * (1 - sm) + sm * np.clip(sun_col, 0, 255)
    img += glow(Image.fromarray((sm[..., 0] * 255).astype(np.uint8)).convert("RGB"), 40, 0.3) \
        * np.array([1, .4, .6])

    # perspective grid floor
    grid = Image.new("RGB", (W, H))
    gd = ImageDraw.Draw(grid)
    col = (255, 60, 220)
    for i in range(-14, 15):
        gd.line([(W / 2 + i * 8, HORIZON), (W / 2 + i * 180, H)], fill=col, width=2)
    for k in range(24):
        z = (k - (t * 2.2) % 1) / 24 + 0.001
        if z <= 0:
            continue
        y = HORIZON + (H - HORIZON) * (z ** 2.2)
        gd.line([(0, y), (W, y)], fill=col, width=2)
    garr = np.asarray(grid, np.float32)
    img[HORIZON:] = np.array([20, 0, 35])
    img += garr + glow(grid, 8, 1.6)
    img += text_layer([("MADE WITH", False, 40), ("PYTHON + FFMPEG", True, 56)], 11.0, t,
                      y=0.70, color=(120, 255, 255))
    img += text_layer([("no camera. no footage.", False, 32)], 12.3, t, y=0.88,
                      color=(255, 220, 160))
    return img


SCENES = [(0.0, 5.0, scene_starfield), (5.0, 10.0, scene_plasma), (10.0, 15.0, scene_synthwave)]
XFADE = 0.6


def frame(t):
    out = np.zeros((H, W, 3), np.float32)
    for start, end, fn in SCENES:
        if start - XFADE <= t < end + XFADE:
            w = min(smooth((t - start + XFADE) / XFADE) if start > 0 else 1,
                    smooth((end + XFADE - t) / XFADE) if end < DUR else 1)
            if w > 0:
                out += fn(t) * w
    # global fade in/out + vignette
    out *= smooth(t / 0.6) * smooth((DUR - t) / 0.8)
    return np.clip(out * VIGNETTE, 0, 255).astype(np.uint8)


vy, vx = np.mgrid[0:H, 0:W]
VIGNETTE = (1 - 0.45 * (((vx - W / 2) / W) ** 2 + ((vy - H / 2) / H) ** 2) * 2.2)[..., None]


# ---------------------------------------------------------------- audio
def make_audio(path):
    n = int(SR * DUR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    # chord progression: Am - F - C - G, one chord per 2 bars-ish
    chords = [[220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [261.6, 329.6, 392.0], [196.0, 246.9, 293.7]]
    clen = DUR / 4 * 0.999
    for i, ch in enumerate(chords * 1):
        seg = (t >= i * clen) & (t < (i + 1) * clen + 0.5)
        lt = t[seg] - i * clen
        env = np.minimum(lt / 0.4, 1) * np.exp(-np.maximum(lt - clen, 0) * 6)
        for f in ch:
            for det in (-0.6, 0.6):  # detuned saw-ish pad
                ph = 2 * np.pi * (f + det) * lt
                out[seg] += (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * env * 0.05
        # bass
        out[seg] += np.sin(2 * np.pi * ch[0] / 2 * lt) * env * 0.18
    # arpeggio from 5s on
    step = BEAT / 4
    notes = [440, 523.3, 659.3, 784, 659.3, 523.3]
    k = 0
    for s in np.arange(5.0, DUR - 0.5, step):
        i0, i1 = int(s * SR), int((s + step) * SR)
        lt = t[i0:i1] - s
        out[i0:i1] += np.sin(2 * np.pi * notes[k % len(notes)] * lt) * np.exp(-lt * 18) * 0.12
        k += 1
    # kick on every beat from 2.5s
    for s in np.arange(2.4, DUR - 0.4, BEAT):
        i0 = int(s * SR)
        lt = t[i0:i0 + int(0.35 * SR)] - s
        f = 45 + 110 * np.exp(-lt * 30)
        out[i0:i0 + len(lt)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-lt * 9) * 0.55
    # hi-hats on offbeats
    for s in np.arange(5.0 + BEAT / 2, DUR - 0.4, BEAT):
        i0 = int(s * SR)
        m = int(0.05 * SR)
        out[i0:i0 + m] += rng.normal(0, 1, m) * np.exp(-np.arange(m) / SR * 80) * 0.08
    out *= np.minimum(t / 0.5, 1) * np.minimum((DUR - t) / 1.0, 1)
    out = out / np.max(np.abs(out)) * 0.85
    pcm = (np.column_stack([out, out]) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "output.mp4"
    wav = out.rsplit(".", 1)[0] + ".wav"
    make_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(NFRAMES):
        p.stdin.write(frame(i / FPS).tobytes())
        if i % 60 == 0:
            print(f"frame {i}/{NFRAMES}", flush=True)
    p.stdin.close()
    p.wait()
    print("wrote", out)


if __name__ == "__main__":
    main()
