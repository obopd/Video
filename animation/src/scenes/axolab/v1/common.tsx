// Shared pieces for Video 1 ("count the zeros, count the tens").
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {AxoSide} from '../../../lib/cast';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, backOut} from '../kit';

export {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL};

export const inOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Tween with ease-in-out (clamped). */
export const tio = (f: number, a: number, b: number, from = 0, to = 1) => from + (to - from) * inOut((f - a) / Math.max(1, b - a));
/** Spring-ish overshoot tween (clamped). */
export const tsp = (f: number, a: number, b: number, from = 0, to = 1) => from + (to - from) * backOut(clamp01((f - a) / Math.max(1, b - a)));
export const fin = (f: number, at: number, d = 8) => clamp01((f - at) / d);

/** Line-art school desk; (x, y) = middle of the desktop's front edge. */
export const Desk: React.FC<{x: number; y: number; s?: number; paper?: boolean}> = ({x, y, s = 1, paper = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
    <path d="M -230 0 L -190 -60 L 190 -60 L 230 0 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={-230} y={0} width={460} height={26} rx={4} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <line x1={-200} y1={26} x2={-200} y2={210} stroke={INK} strokeWidth={LINE} />
    <line x1={200} y1={26} x2={200} y2={210} stroke={INK} strokeWidth={LINE} />
    {paper && <path d="M -60 -12 L -40 -48 L 70 -48 L 55 -12 Z" fill="#fffdf8" stroke={INK} strokeWidth={3} />}
  </g>
);

/** Rounded progress ring around a rectangle (drains clockwise from the top middle). */
export const RectRing: React.FC<{x: number; y: number; w: number; h: number; frac: number; color: string; r?: number}> = ({x, y, w, h, frac, color, r = 28}) => {
  const per = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={INK} strokeOpacity={0.08} strokeWidth={10} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
            pathLength={per} strokeDasharray={`${per * clamp01(frac)} ${per}`} strokeDashoffset={-(w / 2 - r)} />
    </g>
  );
};

/** A hop of Axo from x0 to x1 starting at frame `at`, lasting `d` frames, with anticipation + squash. */
export const hopState = (f: number, at: number, d: number, x0: number, x1: number, h = 120) => {
  const crouch = 5, land = 7;
  if (f < at) return {x: x0, y: 0, sx: 1, sy: 1, air: false};
  const t = f - at;
  if (t < crouch) { const k = Math.sin((t / crouch) * Math.PI / 2); return {x: x0, y: 0, sx: 1 + 0.12 * k, sy: 1 - 0.16 * k, air: false}; }
  if (t < crouch + d) {
    const u = (t - crouch) / d;
    return {x: x0 + (x1 - x0) * inOut(u), y: -4 * h * u * (1 - u), sx: 0.94, sy: 1.08, air: true};
  }
  if (t < crouch + d + land) { const k = Math.sin(((t - crouch - d) / land) * Math.PI); return {x: x1, y: 0, sx: 1 + 0.16 * k, sy: 1 - 0.2 * k, air: false}; }
  return {x: x1, y: 0, sx: 1, sy: 1, air: false};
};

/** Axo (side view) drawn with a squash/stretch around the feet. */
export const AxoSquash: React.FC<{x: number; y: number; scale: number; sx?: number; sy?: number; dir?: 1 | -1; rear?: number; arm?: number;
  holding?: 'pencil' | null; sweat?: boolean; wink?: boolean; run?: number}> = ({x, y, scale, sx = 1, sy = 1, ...rest}) => (
  <g transform={`translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})`}>
    <AxoSide x={x} y={y} scale={scale} {...rest} />
  </g>
);

/** Log ruler geometry: value -> x for a ruler where each power of ten spans `step` px starting at x0 (value 1). */
export const logX = (v: number, x0: number, step: number) => x0 + Math.log10(v) * step;

/** Rolling numeric readout (counts smoothly between values). */
export const Roll: React.FC<{value: number; digits?: number; size?: number; color?: string; prefix?: string}> = ({value, digits = 2, size = 80, color = INK, prefix = ''}) => (
  <span style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: size, color, fontVariantNumeric: 'tabular-nums lining-nums'}}>{prefix}{value.toFixed(digits)}</span>
);

/** One dollar bill (line art, with an optional teal fill fraction). */
export const Bill: React.FC<{x: number; y: number; s?: number; fill?: number; label?: string; o?: number}> = ({x, y, s = 1, fill = 1, label = '$1', o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <rect x={-110} y={-55} width={220} height={110} rx={12} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={-104} y={-49} width={208 * clamp01(fill)} height={98} rx={8} fill={TEAL} opacity={0.22} />
    <ellipse cx={0} cy={0} rx={30} ry={36} fill="none" stroke={INK} strokeWidth={3} />
    <text x={0} y={13} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={34} fill={INK}>{label}</text>
  </g>
);
export const Dime: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle r={42} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <circle r={32} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
    <text y={11} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={28} fill={INK}>10¢</text>
  </g>
);

/** A zero tile (for zero ribbons). */
export const ZeroTile: React.FC<{x: number; y: number; s?: number; o?: number; ch?: string; glow?: number; color?: string}> = ({x, y, s = 1, o = 1, ch = '0', glow = 0, color = INK}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <rect x={-34} y={-46} width={68} height={92} rx={14} fill={PAPER} stroke={glow > 0 ? TEAL : INK} strokeWidth={glow > 0 ? 6 : 4} />
    <text y={24} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={68} fill={color}>{ch}</text>
  </g>
);

/** Soft burst for a pop. */
export const Burst: React.FC<{x: number; y: number; t: number; color?: string; r?: number}> = ({x, y, t, color = ORANGE, r = 40}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g opacity={1 - t}>
      <circle cx={x} cy={y} r={r * (0.4 + t)} fill="none" stroke={color} strokeWidth={4 * (1 - t) + 1} />
      {Array.from({length: 8}).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <line key={i} x1={x + Math.cos(a) * r * (0.5 + t * 0.6)} y1={y + Math.sin(a) * r * (0.5 + t * 0.6)}
                     x2={x + Math.cos(a) * r * (0.7 + t)} y2={y + Math.sin(a) * r * (0.7 + t)} stroke={color} strokeWidth={4} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Orange H+ sparks scattered in a box, with gentle drift; parallax via depth. */
export const SparkField: React.FC<{n: number; x: number; y: number; w: number; h: number; seed: string; drift?: number; r?: number; o?: number}> = ({
  n, x, y, w, h, seed, drift = 0, r = 12, o = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <g opacity={o}>
      {Array.from({length: n}).map((_, i) => {
        const d = 0.4 + random(`${seed}d${i}`) * 0.6;
        const px = x + ((random(`${seed}x${i}`) * w - drift * d) % w + w) % w;
        const py = y + random(`${seed}y${i}`) * h + Math.sin(f / 15 + i) * 4;
        return (
          <g key={i} transform={`translate(${px} ${py}) scale(${d})`}>
            <circle r={r * 1.8} fill={ORANGE} opacity={0.15} />
            <circle r={r} fill={ORANGE} />
          </g>
        );
      })}
    </g>
  );
};

export const Caption: React.FC<{children: React.ReactNode; o?: number; x?: number; y?: number; w?: number; size?: number; color?: string}> = ({children, o = 1, x = 0, y = 960, w = 1920, size = 34, color = P.muted}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: 'center', opacity: o, fontFamily: SANS, fontWeight: 700, fontSize: size, color, letterSpacing: 1}}>{children}</div>
);

export {clamp01, ease};
