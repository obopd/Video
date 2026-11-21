#!/usr/bin/env python3
"""Axol - a rigged, procedurally animated axolotl character.

Axol is not a sprite. Every frame is redrawn from a skeleton:
  * root (position, rotation, squash & stretch)
  * 2-bone IK legs (feet stay planted while the body moves)
  * 2-bone FK arms (shoulder + elbow)
  * head on a neck pivot (tilt, bob, turn via face offset)
  * 14-segment tail driven by a travelling wave
  * 6 feathery gills
  * eyes (look direction, blink, happy ^ ^, sleepy) and a mouth (smile / open / yawn)
Secondary motion (gills and tail lagging behind and wobbling) comes from
damped springs simulated frame-by-frame, so nothing moves rigidly.

Actions are posed with eased keyframes and blended into each other.

Usage: python3 axol.py [axol.mp4]
"""
import math
import subprocess
import sys
import wave

import cairo
import numpy as np

W, H, FPS = 1080, 1920, 30
DUR = 30.0
NFRAMES = int(DUR * FPS)
GROUND = 1480
CX = 540
SCALE = 3.1
SR = 44100
BEAT = 0.5  # 120 BPM

# palette
BODY = (0.97, 0.65, 0.76)
BELLY = (1.0, 0.85, 0.89)
GILL = (0.91, 0.32, 0.55)
FRILL = (1.0, 0.55, 0.72)
LINE = (0.42, 0.16, 0.28)
EYE = (0.13, 0.06, 0.10)
LW = 2.4


# ------------------------------------------------------------------ helpers
def clamp(x, a, b):
    return max(a, min(b, x))


def sstep(x):
    x = clamp(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def ease(x):
    x = clamp(x, 0.0, 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)


def lerp(a, b, w):
    return a + (b - a) * w


def key(u, ks):
    """Eased keyframe track: ks = [(time, value), ...]."""
    if u <= ks[0][0]:
        return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if u <= t1:
            return lerp(v0, v1, ease((u - t0) / (t1 - t0)))
    return ks[-1][1]


class Aff:
    """Tiny 2D affine (cairo semantics: later ops apply first)."""

    def __init__(self, m=None):
        self.m = np.eye(3) if m is None else m.copy()

    def copy(self):
        return Aff(self.m)

    def translate(self, x, y):
        self.m = self.m @ np.array([[1, 0, x], [0, 1, y], [0, 0, 1.0]])
        return self

    def rotate(self, deg):
        c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
        self.m = self.m @ np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])
        return self

    def scale(self, x, y):
        self.m = self.m @ np.diag([x, y, 1.0])
        return self

    def apply(self, x, y):
        v = self.m @ np.array([x, y, 1.0])
        return v[0], v[1]

    def cairo(self):
        m = self.m
        return cairo.Matrix(m[0, 0], m[1, 0], m[0, 1], m[1, 1], m[0, 2], m[1, 2])


# ------------------------------------------------------------------ poses
BLINKS = [0.35, 2.35, 6.9, 9.6, 11.7, 16.1, 21.3, 23.6]


def blink(t):
    return max([0.0] + [1 - abs(t - b) / 0.09 for b in BLINKS if abs(t - b) < 0.09])


def base_pose(t):
    br = math.sin(t * 2.4)
    return dict(x=CX, y=0.0, rot=0.0, sx=1 - 0.012 * br, sy=1 + 0.018 * br, crouch=0.0,
                head_tilt=3 * math.sin(t * 1.1), head_dy=1.2 * br, face=0.0,
                eye_x=0.0, eye_y=0.0, happy=0.0, sleepy=0.0, mouth=0.0, yawn=0.0,
                aL1=14 + 3 * br, aL2=12.0, aR1=14 + 3 * br, aR2=12.0,
                fLx=0.0, fLy=0.0, fRx=0.0, fRy=0.0,
                tail_amp=0.25, tail_speed=2.0, gill_amp=1.0, gill_speed=1.6)


def act_idle(u, t):
    ex = key(u, [(0.6, 0), (0.9, -1), (1.6, -1), (1.9, 1), (2.5, 1), (2.8, 0)])
    return dict(eye_x=ex, face=ex * 0.35, head_tilt=-ex * 6 + 3 * math.sin(t * 1.1),
                mouth=key(u, [(2.6, 0), (3.0, 0.3)]))


def act_wave(u, t):
    env = sstep((u - 0.4) / 0.2) * sstep((2.6 - u) / 0.2)
    return dict(aR1=key(u, [(0, 14), (0.45, 155), (2.6, 155), (3.1, 14)]),
                aR2=15 + 32 * math.sin(u * 11) * env,
                aL1=key(u, [(0, 14), (0.5, 28), (2.6, 28), (3.1, 14)]),
                head_tilt=key(u, [(0, 0), (0.5, -10), (2.6, -10), (3.1, 0)]),
                rot=-3 * env, y=-abs(math.sin(u * 5.5)) * 4 * env,
                happy=key(u, [(0.6, 0), (0.8, 1), (1.9, 1), (2.1, 0)]),
                mouth=key(u, [(0.3, 0), (0.6, 0.6), (2.6, 0.6), (3.0, 0.1)]),
                gill_amp=1.8, gill_speed=3.0)


WALK_D = 180


def walk_dist(u):
    if u < 2.6:
        return WALK_D * sstep(u / 2.6)
    if u < 3.3:
        return WALK_D + 140 * (u - 2.6) / 0.7
    return WALK_D + 140 + WALK_D * sstep((u - 3.3) / 2.6)


def act_walk(u, t):
    if u < 2.6:
        x = CX + WALK_D * sstep(u / 2.6)
    elif u < 3.3:
        x = CX + WALK_D
    else:
        x = CX + WALK_D - WALK_D * sstep((u - 3.3) / 2.6)
    speed = abs(walk_dist(u + 0.01) - walk_dist(u - 0.01)) / 0.02
    amp = clamp(speed / 60, 0, 1)
    ph = 2 * math.pi * walk_dist(u) / 140
    face = key(u, [(0, 0), (0.3, 1), (2.6, 1), (3.3, -1), (5.9, -1), (6.2, 0)])
    sw = math.sin(ph)
    return dict(x=x, face=face, y=-4 * amp * abs(math.cos(ph)),
                fLx=face * 9 * sw * amp, fLy=-max(0, math.cos(ph)) * 12 * amp,
                fRx=-face * 9 * sw * amp, fRy=-max(0, -math.cos(ph)) * 12 * amp,
                aL1=20 + 18 * sw * amp, aR1=20 - 18 * sw * amp, aL2=18, aR2=18,
                rot=face * 5 * amp, head_tilt=-face * 3 + 2 * math.sin(2 * ph),
                mouth=0.25, eye_x=face * 0.8, tail_amp=0.45, tail_speed=4.0, gill_speed=2.6)


JUMP_UP, JUMP_LAND, JUMP_H = 0.45, 1.4, 95


def act_jump(u, t):
    h = 0.0
    if JUMP_UP < u < JUMP_LAND:
        s = (u - JUMP_UP) / (JUMP_LAND - JUMP_UP)
        h = 4 * JUMP_H * s * (1 - s)
    rot = -360 * ease((u - 0.6) / 0.65)
    if rot < -180:
        rot += 360
    arms = key(u, [(0, 14), (0.35, 35), (0.5, 165), (1.25, 165), (1.4, 95), (1.8, 95),
                   (2.0, 150), (2.4, 150), (2.6, 14)])
    tuck = key(u, [(0.45, 0), (0.6, -14), (1.2, -14), (1.38, 0)])
    return dict(y=-h, rot=rot,
                crouch=key(u, [(0, 0), (0.35, 14), (0.45, -4), (0.55, 0), (1.36, 0),
                               (1.43, 16), (1.75, -3), (1.95, 0)]),
                sx=key(u, [(0, 1), (0.35, 1.1), (0.47, 0.9), (0.7, 1), (1.36, 1), (1.42, 1.18),
                           (1.56, 0.96), (1.75, 1)]),
                sy=key(u, [(0, 1), (0.35, 0.86), (0.47, 1.15), (0.7, 1), (1.36, 1), (1.42, 0.8),
                           (1.56, 1.06), (1.75, 1)]),
                aL1=arms, aR1=arms, aL2=10, aR2=10, fLy=tuck, fRy=tuck, fLx=-4 * tuck / 14,
                fRx=4 * tuck / 14,
                happy=key(u, [(0.5, 0), (0.6, 1), (1.25, 1), (1.35, 0), (1.95, 0), (2.05, 1),
                              (2.4, 1), (2.5, 0)]),
                mouth=key(u, [(0.3, 0), (0.5, 0.9), (1.3, 0.9), (1.4, 0.3), (2.0, 0.8), (2.5, 0)]),
                gill_amp=2.0, tail_amp=0.6, tail_speed=5.0)


def act_dance(u, t):
    sw = math.sin(2 * math.pi * u / 1.0)
    part2 = sstep((u - 2.4) / 0.3)
    up = math.sin(2 * math.pi * u / 0.5)
    return dict(x=CX + 26 * sw, y=-10 * abs(math.sin(math.pi * u / 0.5)), rot=7 * sw,
                head_tilt=-10 * sw, face=0.4 * sw, eye_x=0.6 * sw,
                aR1=lerp(95 + 65 * sw, 160, part2), aL1=lerp(95 - 65 * sw, 160, part2),
                aR2=lerp(25 + 25 * up, 20 * up, part2), aL2=lerp(25 - 25 * up, -20 * up, part2),
                fLy=-10 * max(0, sw), fRy=-10 * max(0, -sw), fLx=-4 * sw, fRx=-4 * sw,
                happy=part2, mouth=0.7, gill_amp=2.5, gill_speed=4.0,
                tail_amp=0.6, tail_speed=6.0)


# swim path (positions of the body pivot, in world pixels)
SWIM_PTS = np.array([(540, 1294), (560, 1040), (790, 840), (720, 640), (430, 560),
                     (330, 760), (360, 960), (520, 1080), (600, 1120), (560, 1150)], float)
SWIM_T0, SWIM_T1 = 0.4, 4.6


def catmull(pts, s):
    n = len(pts) - 1
    f = clamp(s, 0, 1) * n
    i = min(int(f), n - 1)
    lt = f - i
    p0, p1, p2, p3 = (pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, n)])
    return 0.5 * ((2 * p1) + (-p0 + p2) * lt + (2 * p0 - 5 * p1 + 4 * p2 - p3) * lt ** 2
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * lt ** 3)


_us = np.linspace(SWIM_T0, SWIM_T1, 800)
_pos = np.array([catmull(SWIM_PTS, ease((u - SWIM_T0) / (SWIM_T1 - SWIM_T0))) for u in _us])
_vel = np.gradient(_pos, axis=0)
_head = np.unwrap(np.arctan2(_vel[:, 0], -_vel[:, 1]))
_head[:5] = _head[5]
_head_deg = np.degrees(_head)
_BLEND_OUT = 4.1
_head_target = 360 * round(np.interp(_BLEND_OUT, _us, _head_deg) / 360)


def act_swim(u, t):
    if u < SWIM_T0:
        px, py = SWIM_PTS[0]
        heading = 0.0
    elif u < SWIM_T1:
        px = np.interp(u, _us, _pos[:, 0])
        py = np.interp(u, _us, _pos[:, 1])
        heading = np.interp(u, _us, _head_deg)
    else:
        e = ease((u - SWIM_T1) / 0.8)
        px = lerp(SWIM_PTS[-1][0], 540, e)
        py = lerp(SWIM_PTS[-1][1], GROUND - 60 * SCALE, e)
        heading = _head_target
    wr = sstep((u - SWIM_T0) / 0.4)
    wo = sstep((u - _BLEND_OUT) / 0.6)
    rot = lerp(heading * wr, _head_target, wo) if u > _BLEND_OUT else heading * wr
    rot = ((rot + 180) % 360) - 180
    swimming = sstep((u - 0.4) / 0.3) * sstep((4.8 - u) / 0.4)
    paddle = math.sin(u * 9)
    return dict(x=px, y=(py - GROUND) / SCALE + 60, rot=rot,
                crouch=key(u, [(0, 0), (0.3, 12), (0.42, -3), (0.6, 0), (5.15, 0), (5.3, 8),
                               (5.5, 0)]),
                aL1=lerp(key(u, [(0, 14), (0.3, 60)]), 8, swimming),
                aR1=lerp(key(u, [(0, 14), (0.3, 60)]), 8, swimming),
                aL2=lerp(12, 0, swimming), aR2=lerp(12, 0, swimming),
                fLy=(-6 + 6 * paddle) * swimming, fRy=(-6 - 6 * paddle) * swimming,
                fLx=2 * swimming, fRx=-2 * swimming,
                tail_amp=lerp(0.3, 1.0, swimming), tail_speed=lerp(2, 9, swimming),
                mouth=0.2 + 0.3 * swimming, eye_y=-0.5 * swimming, gill_amp=1.5)


def act_sleep(u, t):
    late = sstep((u - 3.0) / 0.5)
    breath = math.sin(u * 2.0) * late
    rest = key(u, [(0, 14), (0.5, 150), (1.6, 150), (2.1, 28)])
    return dict(aL1=rest, aR1=rest,
                aL2=key(u, [(0, 12), (0.5, 0), (1.6, 0), (2.1, 45)]),
                aR2=key(u, [(0, 12), (0.5, 0), (1.6, 0), (2.1, 45)]),
                sy=key(u, [(0, 1), (0.5, 1.08), (1.6, 1.08), (2.0, 1)]) + 0.03 * breath,
                sx=key(u, [(0, 1), (0.5, 0.95), (1.6, 0.95), (2.0, 1)]) - 0.015 * breath,
                yawn=key(u, [(0.2, 0), (0.6, 1), (1.5, 1), (1.8, 0)]),
                sleepy=key(u, [(0.3, 0), (0.5, 1), (1.6, 1), (1.9, 0.55), (2.6, 0.55), (2.9, 1)]),
                head_tilt=key(u, [(0, 0), (0.5, -8), (1.6, -8), (2.2, 6), (3.0, 14)]),
                head_dy=key(u, [(2.0, 0), (3.0, 4)]) + 1.5 * breath,
                crouch=key(u, [(2.0, 0), (2.9, 18)]),
                fLx=key(u, [(2.0, 0), (2.9, -8)]), fRx=key(u, [(2.0, 0), (2.9, 8)]),
                tail_amp=0.15, tail_speed=1.0, gill_amp=0.5, gill_speed=0.8)


ACTIONS = [  # (start, end, fn, label)
    (0.0, 3.0, act_idle, "IDLE  ·  LOOK AROUND"),
    (3.0, 6.2, act_wave, "WAVE HELLO"),
    (6.2, 12.4, act_walk, "WALK  ·  TURN  ·  WALK BACK"),
    (12.4, 15.0, act_jump, "JUMP  +  BACKFLIP"),
    (15.0, 20.0, act_dance, "DANCE"),
    (20.0, 25.6, act_swim, "SWIM"),
    (25.6, DUR, act_sleep, "YAWN  ·  SLEEP"),
]
BLEND = 0.4


def pose(t):
    p = base_pose(t)
    for start, end, fn, _ in ACTIONS:
        if start <= t <= end:
            w = (sstep((t - start) / BLEND) if start > 0 else 1.0) * \
                (sstep((end - t) / BLEND) if end < DUR else 1.0)
            for k, v in fn(t - start, t).items():
                p[k] = lerp(p[k], v, w)
    p["blink"] = blink(t)
    return p


# ------------------------------------------------------------------ rig geometry
def body_aff(p):
    a = Aff().translate(p["x"], GROUND + p["y"] * SCALE).scale(SCALE, SCALE)
    a.translate(0, -60).rotate(p["rot"]).translate(0, 60)
    return a.scale(p["sx"], p["sy"])


def head_aff(p, body):
    return body.copy().translate(0, -88 + p["crouch"]).rotate(p["head_tilt"]) \
        .translate(0, -37 + p["head_dy"])


def ik(hip, foot, l1, l2, out_sign):
    hx, hy = hip
    fx, fy = foot
    dx, dy = fx - hx, fy - hy
    d = clamp(math.hypot(dx, dy), 1e-3, l1 + l2 - 1e-3)
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, l1 * l1 - a * a))
    ux, uy = dx / d, dy / d
    mx, my = hx + a * ux, hy + a * uy
    k1 = (mx - uy * h, my + ux * h)
    k2 = (mx + uy * h, my - ux * h)
    return k1 if (k1[0] * out_sign) > (k2[0] * out_sign) else k2


GILLS = [(-0.80, 34, 48, -22), (-0.22, 40, 57, -6), (0.35, 33, 53, 11)]  # angle, len, bx, by


def gill_geometry(p, sec, s, i):
    ang, length, bx, by = GILLS[i]
    flap = (0.10 * p["gill_amp"] * math.sin(sec["gill_ph"] + i * 1.3)
            + 0.04 * math.sin(sec["gill_ph"] * 2.3 + i))
    phi = math.atan2(math.sin(ang), s * math.cos(ang)) - s * flap
    dx, dy = sec["gill_lag"]
    n = (-math.sin(phi), math.cos(phi))
    phi += clamp((dx * n[0] + dy * n[1]) / length * 1.6, -0.9, 0.9)
    base = (s * bx - p["face"] * 6, by)
    return base, phi, length


def tail_points(p, sec):
    face = p["face"]
    side = clamp(-face + (1 - abs(face)), -1, 1)
    n = 14
    seg = 7.0
    ang = -math.pi / 2 + side * (math.pi / 2 + 0.2)  # sweeps up behind the body when turning
    x, y = side * 8, -38 + p["crouch"]
    pts = [(x, y)]
    dx, dy = sec["tail_lag"]
    for i in range(1, n + 1):
        f = i / n
        a = ang - side * 0.075 * i + p["tail_amp"] * math.sin(sec["tail_ph"] - i * 0.45) * f
        nrm = (-math.sin(a), math.cos(a))
        a += clamp((dx * nrm[0] + dy * nrm[1]) / 60 * f, -0.7, 0.7)
        x += seg * math.cos(a)
        y += seg * math.sin(a)
        pts.append((x, y))
    return pts


# ------------------------------------------------------------------ drawing
def ell(ctx, x, y, rx, ry):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(rx, ry)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()


def fill_stroke(ctx, fill, line=LINE, lw=LW):
    ctx.set_source_rgb(*fill)
    ctx.fill_preserve()
    ctx.set_source_rgb(*line)
    ctx.set_line_width(lw)
    ctx.stroke()


def limb(ctx, pts, width, color):
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    for w, c in ((width + 2 * LW, LINE), (width, color)):
        ctx.move_to(*pts[0])
        for q in pts[1:]:
            ctx.line_to(*q)
        ctx.set_line_width(w)
        ctx.set_source_rgb(*c)
        ctx.stroke()


def ribbon(ctx, pts, widths):
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        w = widths[i] / 2
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    poly = left + right[::-1]
    ctx.move_to(*poly[0])
    for q in poly[1:]:
        ctx.line_to(*q)
    ctx.close_path()


def draw_character(ctx, p, sec):
    body = body_aff(p)
    ctx.save()
    ctx.set_matrix(body.cairo())
    cr = p["crouch"]

    # tail (behind everything)
    tp = tail_points(p, sec)
    n = len(tp)
    ribbon(ctx, tp, [26 * (1 - i / n) + 10 for i in range(n)])
    ctx.set_source_rgba(*FRILL, 0.55)
    ctx.fill()
    ribbon(ctx, tp, [16 * (1 - i / n) + 3 for i in range(n)])
    fill_stroke(ctx, BODY)

    # legs (2-bone IK, feet planted on y=0)
    for s, fx, fy in ((-1, p["fLx"], p["fLy"]), (1, p["fRx"], p["fRy"])):
        hip = (s * 20, -28 + cr)
        foot = (s * 22 + fx, fy - 3)
        knee = ik(hip, foot, 17, 17, s)
        limb(ctx, [hip, knee, foot], 13, BODY)
        ell(ctx, foot[0] + s * 3, foot[1] + 1, 11, 6)
        fill_stroke(ctx, BODY)
        for k in (-1, 0, 1):
            ell(ctx, foot[0] + s * 3 + k * 6 + s * 4, foot[1] + 4, 3.2, 2.6)
            fill_stroke(ctx, BODY, lw=1.6)

    # torso
    ell(ctx, 0, -60 + cr, 40, 42)
    fill_stroke(ctx, BODY)
    ell(ctx, p["face"] * 6, -54 + cr, 26, 28)
    ctx.set_source_rgb(*BELLY)
    ctx.fill()

    # head (separate transform so it can tilt on the neck)
    ctx.save()
    ctx.set_matrix(head_aff(p, body).cairo())
    for s in (-1, 1):
        for i in range(3):
            base, phi, length = gill_geometry(p, sec, s, i)
            pts = []
            for k in range(7):
                f = k / 6
                a = phi - s * 0.5 * f * f
                pts.append((base[0] + math.cos(a) * length * f, base[1] + math.sin(a) * length * f))
            for k in range(2, 7):
                x, y = pts[k]
                a = phi - s * 0.5 * (k / 6) ** 2
                nx, ny = -math.sin(a), math.cos(a)
                for side in (-1, 1):
                    ell(ctx, x + nx * 5.5 * side, y + ny * 5.5 * side, 4.6 - k * 0.3, 3.8 - k * 0.25)
                    fill_stroke(ctx, FRILL, lw=1.6)
            ell(ctx, pts[-1][0], pts[-1][1], 5, 5)
            fill_stroke(ctx, FRILL, lw=1.6)
            limb(ctx, pts, 7, GILL)
    ell(ctx, 0, 0, 62, 45)
    fill_stroke(ctx, BODY)

    fx = p["face"] * 16
    # cheeks
    for s in (-1, 1):
        ell(ctx, s * 38 + fx * 0.7, 13, 9, 5)
        ctx.set_source_rgba(1.0, 0.45, 0.6, 0.45)
        ctx.fill()
    # eyes
    closed = max(p["blink"], p["happy"], p["sleepy"])
    for s in (-1, 1):
        ex = s * 25 + fx
        ey = -3
        if closed > 0.85:
            ctx.set_source_rgb(*EYE)
            ctx.set_line_width(3)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            if p["happy"] >= p["sleepy"] and p["happy"] > 0.5:
                ctx.move_to(ex - 7, ey + 3)
                ctx.curve_to(ex - 3, ey - 6, ex + 3, ey - 6, ex + 7, ey + 3)
            else:
                ctx.move_to(ex - 7, ey)
                ctx.curve_to(ex - 3, ey + 5, ex + 3, ey + 5, ex + 7, ey)
            ctx.stroke()
        else:
            open_ = 1 - closed
            ell(ctx, ex, ey, 7.5, 8.5 * max(open_, 0.08))
            ctx.set_source_rgb(*EYE)
            ctx.fill()
            if open_ > 0.35:
                ell(ctx, ex - 2 + p["eye_x"] * 2.5, ey - 3 + p["eye_y"] * 2, 2.6, 2.6 * open_)
                ctx.set_source_rgb(1, 1, 1)
                ctx.fill()
    # mouth
    mx, my = fx * 0.9, 17
    yawn = p["yawn"]
    openv = max(p["mouth"], yawn)
    mw = 13 * (1 - 0.45 * yawn)
    if openv < 0.15:
        ctx.move_to(mx - 13, my - 2)
        ctx.curve_to(mx - 5, my + 6, mx + 5, my + 6, mx + 13, my - 2)
        ctx.set_source_rgb(*LINE)
        ctx.set_line_width(2.6)
        ctx.stroke()
    else:
        depth = 4 + openv * 12 + yawn * 6
        top = my - 2 - yawn * 6
        ctx.move_to(mx - mw, top)
        ctx.curve_to(mx - mw * 0.4, top + 2, mx + mw * 0.4, top + 2, mx + mw, top)
        ctx.curve_to(mx + mw * 0.8, top + depth, mx - mw * 0.8, top + depth, mx - mw, top)
        ctx.close_path()
        fill_stroke(ctx, (0.55, 0.12, 0.22), lw=2.0)
        ell(ctx, mx, top + depth * 0.62, mw * 0.5, depth * 0.22)
        ctx.set_source_rgb(1.0, 0.5, 0.6)
        ctx.fill()
    ctx.restore()

    # arms (in front of torso)
    for s, a1, a2 in ((-1, p["aL1"], p["aL2"]), (1, p["aR1"], p["aR2"])):
        sh = (s * 31, -76 + cr)
        r1, r2 = math.radians(a1), math.radians(a1 + a2)
        el = (sh[0] + s * math.sin(r1) * 16, sh[1] + math.cos(r1) * 16)
        hd = (el[0] + s * math.sin(r2) * 15, el[1] + math.cos(r2) * 15)
        limb(ctx, [sh, el, hd], 11, BODY)
        for k in (-1, 0, 1):
            fa = r2 + k * 0.55
            ell(ctx, hd[0] + s * math.sin(fa) * 6.5, hd[1] + math.cos(fa) * 6.5, 3.2, 3.2)
            fill_stroke(ctx, BODY, lw=1.6)
        ell(ctx, hd[0], hd[1], 6.5, 6.5)
        ctx.set_source_rgb(*BODY)
        ctx.fill()
    ctx.restore()


# ------------------------------------------------------------------ world
rng = np.random.default_rng(3)
WEEDS = [(60, 520, 0.0, 1), (150, 380, 1.3, 1), (930, 470, 2.1, 1), (1010, 600, 0.7, 1),
         (300, 260, 2.8, 0), (780, 300, 1.9, 0)]
PEBBLES = [(rng.uniform(0, W), rng.uniform(GROUND + 20, H - 20), rng.uniform(8, 22)) for _ in range(40)]
MOTES = rng.uniform(0, 1, (70, 4))
AMBIENT = [(rng.uniform(40, W - 40), rng.uniform(0, 6), rng.uniform(4, 10)) for _ in range(26)]


def make_static_bg():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, 0.35, 0.80, 0.85)
    g.add_color_stop_rgb(0.55, 0.10, 0.45, 0.62)
    g.add_color_stop_rgb(1, 0.04, 0.20, 0.36)
    ctx.set_source(g)
    ctx.paint()
    # distant rocks
    ctx.set_source_rgba(0.05, 0.25, 0.38, 0.55)
    ctx.move_to(0, GROUND - 120)
    for x in range(0, W + 60, 60):
        ctx.line_to(x, GROUND - 140 - 90 * abs(math.sin(x * 0.007 + 1.2)) - 40 * math.sin(x * 0.03))
    ctx.line_to(W, GROUND)
    ctx.line_to(0, GROUND)
    ctx.fill()
    # sand
    sg = cairo.LinearGradient(0, GROUND - 30, 0, H)
    sg.add_color_stop_rgb(0, 0.93, 0.84, 0.62)
    sg.add_color_stop_rgb(1, 0.70, 0.58, 0.40)
    ctx.set_source(sg)
    ctx.move_to(0, GROUND - 10)
    for x in range(0, W + 40, 40):
        ctx.line_to(x, GROUND - 10 + 12 * math.sin(x * 0.011))
    ctx.line_to(W, H)
    ctx.line_to(0, H)
    ctx.fill()
    for x, y, r in PEBBLES:
        ell(ctx, x, y, r, r * 0.6)
        ctx.set_source_rgba(0.55, 0.45, 0.35, 0.6)
        ctx.fill()
    return surf


def draw_weed(ctx, x, height, ph, t, dark):
    pts = []
    for i in range(16):
        f = i / 15
        sway = math.sin(t * 1.3 + ph + f * 2.5) * 30 * f
        pts.append((x + sway, GROUND + 10 - height * f))
    ribbon(ctx, pts, [26 * (1 - f) + 4 for f in np.linspace(0, 1, 16)])
    ctx.set_source_rgb(*((0.10, 0.45, 0.30) if dark else (0.18, 0.55, 0.40)))
    ctx.fill()


def draw_world(ctx, t, front):
    if not front:
        # light rays
        for i in range(5):
            x = 150 + i * 210 + 40 * math.sin(t * 0.4 + i)
            ctx.move_to(x - 40, 0)
            ctx.line_to(x + 40, 0)
            ctx.line_to(x + 260, GROUND)
            ctx.line_to(x + 80, GROUND)
            ctx.close_path()
            ctx.set_source_rgba(1, 1, 1, 0.05 + 0.02 * math.sin(t * 0.7 + i * 2))
            ctx.fill()
        for x, h, ph, fr in WEEDS:
            if not fr:
                draw_weed(ctx, x, h, ph, t, False)
        for m in MOTES:
            x = (m[0] * W + t * 12 * (m[2] - 0.5)) % W
            y = (m[1] * GROUND - t * 15 * m[3]) % GROUND
            ctx.arc(x, y, 1.5 + m[2] * 2, 0, 2 * math.pi)
            ctx.set_source_rgba(1, 1, 1, 0.25)
            ctx.fill()
        for x, off, spd in AMBIENT:
            y = GROUND - ((t + off) * spd * 18) % (GROUND + 100)
            bubble(ctx, x + 10 * math.sin(t * 2 + off), y, 3 + spd * 0.6, 0.5)
    else:
        for x, h, ph, fr in WEEDS:
            if fr:
                draw_weed(ctx, x, h, ph, t, True)


def bubble(ctx, x, y, r, a):
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.set_source_rgba(0.85, 0.97, 1.0, 0.18 * a)
    ctx.fill_preserve()
    ctx.set_source_rgba(1, 1, 1, 0.7 * a)
    ctx.set_line_width(2)
    ctx.stroke()
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, 0.8 * a)
    ctx.fill()


# ------------------------------------------------------------------ simulation
class Spring:
    def __init__(self, k, c):
        self.k, self.c = k, c
        self.p = None
        self.v = np.zeros(2)

    def step(self, target, dt):
        target = np.array(target)
        if self.p is None:
            self.p = target.copy()
        for _ in range(4):
            h = dt / 4
            a = self.k * (target - self.p) - self.c * self.v
            self.v += a * h
            self.p += self.v * h
        return self.p - target


def rot_vec(v, deg):
    c, s = math.cos(math.radians(-deg)), math.sin(math.radians(-deg))
    return (c * v[0] - s * v[1], s * v[0] + c * v[1])


# scripted events (time, kind)
EVENTS = [(3.45, "chime"), (12.85, "boing"), (13.0, "whoosh"), (13.8, "land"),
          (20.4, "boing"), (26.0, "yawn")]
EVENTS += [(15.0 + i * BEAT, "note") for i in range(10)]
EVENTS += [(20.6 + i * 0.32, "bubble") for i in range(13)]
EVENTS += [(28.7 + i * 0.85, "zzz") for i in range(2)]
EVENTS.sort()


class Sim:
    def __init__(self):
        self.gill = Spring(150, 9)
        self.tail = Spring(90, 8)
        self.tail_ph = 0.0
        self.gill_ph = 0.0
        self.parts = []
        self.sfx = []
        self.ev_i = 0
        self.prev_feet = None

    def step(self, t, dt):
        p = pose(t)
        body = body_aff(p)
        head = head_aff(p, body)
        self.tail_ph += p["tail_speed"] * dt
        self.gill_ph += p["gill_speed"] * dt
        lag_g = self.gill.step(head.apply(0, 0), dt)
        lag_t = self.tail.step(body.apply(0, -40), dt)
        sec = dict(tail_ph=self.tail_ph, gill_ph=self.gill_ph,
                   gill_lag=tuple(x / SCALE for x in rot_vec(lag_g, p["rot"] + p["head_tilt"])),
                   tail_lag=tuple(x / SCALE for x in rot_vec(lag_t, p["rot"])))

        # footsteps: foot touching the ground again
        feet = (p["fLy"], p["fRy"])
        if self.prev_feet and p["y"] > -2:
            for i, s in enumerate((-1, 1)):
                if self.prev_feet[i] < -1.5 and feet[i] >= -1.5:
                    fx = p["fLx"] if i == 0 else p["fRx"]
                    wx, wy = body.apply(s * 22 + fx, 0)
                    self.dust(t, wx, wy, 4, 0.5)
                    self.sfx.append((t, "step"))
        self.prev_feet = feet

        while self.ev_i < len(EVENTS) and EVENTS[self.ev_i][0] <= t:
            et, kind = EVENTS[self.ev_i]
            self.ev_i += 1
            self.sfx.append((et, kind))
            if kind == "land":
                self.dust(t, p["x"], GROUND, 14, 1.0)
            elif kind == "boing" and et < 15:
                self.dust(t, p["x"], GROUND, 6, 0.6)
            elif kind == "note":
                hx, hy = head.apply(0, -40)
                side = 1 if int((et - 15) / BEAT) % 2 else -1
                self.parts.append(dict(kind="note", t0=t, x=hx + side * 140, y=hy,
                                       vx=side * 40, vy=-110, life=1.5,
                                       glyph="♪" if side > 0 else "♫",
                                       col=[(1, .9, .3), (.5, 1, .8), (1, .6, .9)][int(et * 2) % 3]))
            elif kind == "bubble":
                mx, my = head.apply(p["face"] * 14, 22)
                self.parts.append(dict(kind="bubble", t0=t, x=mx, y=my, vx=rng.uniform(-20, 20),
                                       vy=-140, life=2.2, r=rng.uniform(7, 14)))
            elif kind == "zzz":
                hx, hy = head.apply(40, -50)
                self.parts.append(dict(kind="z", t0=t, x=hx, y=hy, vx=45, vy=-60, life=2.4))

        for q in self.parts:
            q["x"] += q["vx"] * dt
            q["y"] += q["vy"] * dt
            if q["kind"] == "dust":
                q["vx"] *= 0.92
                q["vy"] *= 0.92
        self.parts = [q for q in self.parts if t - q["t0"] < q["life"]]
        return p, sec

    def dust(self, t, x, y, n, power):
        for i in range(n):
            a = math.pi + (i + 0.5) / n * math.pi
            sp = rng.uniform(150, 380) * power
            self.parts.append(dict(kind="dust", t0=t, x=x + rng.uniform(-20, 20), y=y - 5,
                                   vx=math.cos(a) * sp * 1.4, vy=math.sin(a) * sp * 0.4,
                                   life=0.7 * (0.6 + power * 0.5), r=rng.uniform(10, 22) * power))

    def draw_particles(self, ctx, t):
        for q in self.parts:
            age = (t - q["t0"]) / q["life"]
            a = 1 - age
            if q["kind"] == "dust":
                ctx.arc(q["x"], q["y"], q["r"] * (0.6 + age), 0, 2 * math.pi)
                ctx.set_source_rgba(0.95, 0.88, 0.70, 0.7 * a)
                ctx.fill()
            elif q["kind"] == "bubble":
                bubble(ctx, q["x"] + 8 * math.sin(age * 12), q["y"], q["r"] * (0.8 + age * 0.4), a)
            else:
                ctx.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
                glyph = q.get("glyph", "Z")
                size = 90 if q["kind"] == "note" else 40 + age * 50
                ctx.set_font_size(size)
                col = q.get("col", (1, 1, 1))
                x = q["x"] + (10 * math.sin(age * 8) if q["kind"] == "note" else 0)
                ctx.move_to(x, q["y"])
                ctx.text_path(glyph)
                ctx.set_source_rgba(*col, min(1, a * 1.5))
                ctx.fill_preserve()
                ctx.set_source_rgba(0.1, 0.15, 0.3, min(1, a * 1.5) * 0.6)
                ctx.set_line_width(3)
                ctx.stroke()


def draw_shadow(ctx, p):
    height = max(0.0, -(p["y"]) * SCALE + (60 * SCALE if abs(p["rot"]) > 0 else 0) * 0)
    if p["y"] < -1:
        height = -p["y"] * SCALE
    k = 1 / (1 + height / 350)
    ell(ctx, p["x"], GROUND + 6, 120 * k * p["sx"], 20 * k)
    ctx.set_source_rgba(0.1, 0.15, 0.2, 0.28 * k)
    ctx.fill()


def draw_label(ctx, t):
    for start, end, _, label in ACTIONS:
        a = sstep((t - start - 0.1) / 0.35) * (sstep((end - t - 0.1) / 0.35) if end < DUR else 1)
        if t > DUR - 1.5:
            a *= sstep((DUR - 0.3 - t) / 1.0)
        if a <= 0:
            continue
        ctx.select_font_face("DejaVu Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
        ctx.set_font_size(40)
        ext = ctx.text_extents(label)
        w = ext.width + 70
        x0, y0 = (W - w) / 2, 110 - (1 - a) * 20
        r = 34
        ctx.new_sub_path()
        ctx.arc(x0 + r, y0 + r, r, math.pi / 2, 3 * math.pi / 2)
        ctx.arc(x0 + w - r, y0 + r, r, -math.pi / 2, math.pi / 2)
        ctx.close_path()
        ctx.set_source_rgba(0.05, 0.15, 0.25, 0.55 * a)
        ctx.fill()
        ctx.move_to(x0 + 35 - ext.x_bearing, y0 + r - ext.y_bearing - ext.height / 2)
        ctx.set_source_rgba(1, 1, 1, a)
        ctx.show_text(label)


# ------------------------------------------------------------------ audio
def tone(n_samples, f0, f1=None, decay=8.0, harmonics=((1, 1.0),)):
    tt = np.arange(n_samples) / SR
    f = np.full(n_samples, float(f0)) if f1 is None else np.geomspace(f0, f1, n_samples)
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = sum(a * np.sin(ph * h) for h, a in harmonics)
    return out * np.exp(-tt * decay)


def make_audio(path, sfx):
    n = int(SR * DUR)
    out = np.zeros(n)

    def add(t0, sig, vol):
        i0 = int(t0 * SR)
        j = min(n, i0 + len(sig))
        if i0 < n:
            out[i0:j] += sig[:j - i0] * vol

    notes = {"C": 261.6, "D": 293.7, "E": 329.6, "F": 349.2, "G": 392.0, "A": 440.0, "B": 493.9}
    chords = [("C", "E", "G"), ("A", "C", "E"), ("F", "A", "C"), ("G", "B", "D")]
    mrng = np.random.default_rng(11)
    bars = int(DUR / (4 * BEAT))
    for b in range(bars):
        ch = chords[b % 4]
        t0 = b * 4 * BEAT
        sleepy = clamp((t0 - 26) / 2, 0, 1)
        bass = notes[ch[0]] / 4
        for beat in (0, 2):
            add(t0 + beat * BEAT, tone(int(SR * 0.9), bass, decay=3.5,
                                       harmonics=((1, 1), (2, .3))), 0.22 * (1 - 0.6 * sleepy))
        for e in range(8):
            if mrng.random() < 0.35 + 0.4 * (1 - sleepy) and not (sleepy and e % 2):
                f = notes[ch[mrng.integers(3)]] * (2 if mrng.random() < 0.5 else 1)
                add(t0 + e * BEAT / 2, tone(int(SR * 0.5), f, decay=9,
                                            harmonics=((1, 1), (4, .25), (10, .05))),
                    0.10 * (1 - 0.5 * sleepy))
            if sleepy < 0.5:
                m = int(SR * 0.04)
                add(t0 + e * BEAT / 2, mrng.normal(0, 1, m) * np.exp(-np.arange(m) / SR * 90),
                    0.025 if e % 2 else 0.04)
        # soft pad
        for f in ch:
            m = int(SR * 4 * BEAT)
            tt = np.arange(m) / SR
            env = np.minimum(tt / 0.3, 1) * np.minimum((4 * BEAT - tt) / 0.3, 1)
            add(t0, np.sin(2 * np.pi * notes[f] * tt) * env, 0.025)

    for t0, kind in sfx:
        if kind == "step":
            add(t0, tone(int(SR * 0.07), 220, 120, decay=40), 0.18)
        elif kind == "boing":
            m = int(SR * 0.45)
            tt = np.arange(m) / SR
            f = 180 + 520 * (tt / 0.45) + 25 * np.sin(tt * 60)
            add(t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5), 0.25)
        elif kind == "land":
            add(t0, tone(int(SR * 0.4), 120, 45, decay=10), 0.5)
            m = int(SR * 0.15)
            add(t0, rng.normal(0, 1, m) * np.exp(-np.arange(m) / SR * 30), 0.12)
        elif kind == "whoosh":
            m = int(SR * 0.6)
            noise = rng.normal(0, 1, m)
            k = np.ones(30) / 30
            noise = np.convolve(noise, k, "same")
            env = np.sin(np.linspace(0, np.pi, m)) ** 2
            add(t0, noise * env, 0.5)
        elif kind == "chime":
            for i, f in enumerate((1568, 2093, 2637)):
                add(t0 + i * 0.09, tone(int(SR * 0.6), f, decay=7), 0.09)
        elif kind == "bubble":
            add(t0, tone(int(SR * 0.06), 500, 1500, decay=30), 0.12)
        elif kind == "yawn":
            m = int(SR * 1.3)
            tt = np.arange(m) / SR
            f = 330 * np.exp(-tt * 0.7) + 6 * np.sin(tt * 30)
            ph = 2 * np.pi * np.cumsum(f) / SR
            env = np.minimum(tt / 0.2, 1) * np.minimum((1.3 - tt) / 0.4, 1)
            add(t0, (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * env, 0.12)

    tt = np.arange(n) / SR
    out *= np.minimum(tt / 0.3, 1) * np.minimum((DUR - tt) / 1.2, 1)
    out = out / np.max(np.abs(out)) * 0.85
    pcm = (np.column_stack([out, out]) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ------------------------------------------------------------------ render
def render(out, frames=None, still_cb=None):
    bg = make_static_bg()
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    sim = Sim()
    proc = None
    if out:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra",
               "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
               "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
               "-an", out + ".noaudio.mp4"]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(NFRAMES):
        t = i / FPS
        p, sec = sim.step(t, 1 / FPS)
        if proc is None and i not in frames:
            continue
        ctx.set_matrix(cairo.Matrix())
        ctx.set_source_surface(bg)
        ctx.paint()
        draw_world(ctx, t, front=False)
        draw_shadow(ctx, p)
        draw_character(ctx, p, sec)
        ctx.set_matrix(cairo.Matrix())
        sim.draw_particles(ctx, t)
        draw_world(ctx, t, front=True)
        draw_label(ctx, t)
        fade = sstep(t / 0.5) * sstep((DUR - t) / 1.0)
        if fade < 1:
            ctx.set_source_rgba(0, 0, 0, 1 - fade)
            ctx.paint()
        surf.flush()
        if proc:
            proc.stdin.write(bytes(surf.get_data()))
            if i % 90 == 0:
                print(f"frame {i}/{NFRAMES}", flush=True)
        else:
            still_cb(i, surf)
    if proc:
        proc.stdin.close()
        proc.wait()
    return sim


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "axol.mp4"
    sim = render(out)
    wav = out + ".wav"
    make_audio(wav, sim.sfx)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out + ".noaudio.mp4", "-i", wav,
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest",
                    "-movflags", "+faststart", out], check=True)
    import os
    os.remove(out + ".noaudio.mp4")
    os.remove(wav)
    print("wrote", out)


if __name__ == "__main__":
    main()
