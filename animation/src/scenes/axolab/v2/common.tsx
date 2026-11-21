// Shared pieces for Video 2 ("units, ratios, and chance").
import React from 'react';
import {KeySeq, type KeyItem} from '../kit';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst, Caption} from '../v1/common';

export {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst, Caption};
export const AMBER = '#f2a23a';
export const RED = '#e5484d';

/** Headlines in the standard spot: centred, below the tag row. */
export const Heads: React.FC<{items: KeyItem[]; size?: number; y?: number}> = ({items, size = 76, y = 150}) => (
  <KeySeq x={90} y={y} w={1740} align="center" size={size} items={items} />
);

/** A unit tag: a small rounded label (SVG), centred on (x, y). */
export const UnitTag: React.FC<{x: number; y: number; text: string; color?: string; o?: number; s?: number; w?: number; fill?: string; strike?: number}> = ({
  x, y, text, color = INK, o = 1, s = 1, w, fill = PAPER, strike = 0,
}) => {
  const width = w ?? 44 + text.length * 25;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-width / 2} y={-32} width={width} height={64} rx={32} fill={fill} stroke={color} strokeWidth={4.5} />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={color}>{text}</text>
      {strike > 0 && <line x1={-width / 2 - 6} y1={24} x2={-width / 2 - 6 + (width + 12) * clamp01(strike)} y2={-24} stroke={RED} strokeWidth={6} strokeLinecap="round" />}
    </g>
  );
};

/** A fraction in the display face (SVG), centred on (x, y). */
export const Frac: React.FC<{x: number; y: number; top: React.ReactNode; bot: React.ReactNode; size?: number; w?: number; o?: number; color?: string; sy?: number}> = ({
  x, y, top, bot, size = 64, w = 220, o = 1, color = INK, sy = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(1 ${sy})`} opacity={o}>
    <text y={-size * 0.28} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={size} fill={color}>{top}</text>
    <line x1={-w / 2} x2={w / 2} y1={0} y2={0} stroke={color} strokeWidth={5} strokeLinecap="round" />
    <text y={size * 0.95} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={size} fill={color}>{bot}</text>
  </g>
);

/** Big display text in SVG. */
export const T: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; color?: string; o?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; s?: number; font?: string}> = ({
  x, y, children, size = 64, color = INK, o = 1, anchor = 'middle', weight = 700, s = 1, font = DISPLAY,
}) => (
  <text x={0} y={0} transform={`translate(${x} ${y}) scale(${s})`} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} opacity={o}
        style={{fontVariantNumeric: 'tabular-nums lining-nums'}}>{children}</text>
);

/** Superscript inside SVG text. */
export const Sp: React.FC<{children: React.ReactNode}> = ({children}) => <tspan baselineShift="super" fontSize="0.58em">{children}</tspan>;

/** A die-face tile with pips (or a number). */
export const DieTile: React.FC<{x: number; y: number; n: number; size?: number; fill?: string; stroke?: string; o?: number; s?: number; pipColor?: string}> = ({
  x, y, n, size = 120, fill = PAPER, stroke = INK, o = 1, s = 1, pipColor = INK,
}) => {
  const p = size * 0.26;
  const spots: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={size * 0.18} fill={fill} stroke={stroke} strokeWidth={LINE} />
      {(spots[n] || []).map(([a, b], i) => <circle key={i} cx={a * p} cy={b * p} r={size * 0.075} fill={pipColor} />)}
    </g>
  );
};

/** Coin (line art) with a letter. */
export const Coin: React.FC<{x: number; y: number; ch: string; r?: number; o?: number; fill?: string; color?: string}> = ({x, y, ch, r = 34, o = 1, fill = PAPER, color = INK}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={r} fill={fill} stroke={color} strokeWidth={4} />
    <circle r={r - 7} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
    <text y={r * 0.36} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={r} fill={color}>{ch}</text>
  </g>
);

/** Countdown ring (SVG). */
export const MiniRing: React.FC<{x: number; y: number; r?: number; frac: number; label: string; color?: string}> = ({x, y, r = 46, frac, label, color = ORANGE}) => {
  const c = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={PAPER} stroke={INK} strokeOpacity={0.12} strokeWidth={9} />
      <circle r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${c * clamp01(frac)} ${c}`} transform="rotate(-90)" />
      <text y={r * 0.3} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={r * 0.85} fill={INK}>{label}</text>
    </g>
  );
};

/** A tiny bacterium / cell (teal blob with a nucleus). */
export const Cell: React.FC<{x: number; y: number; r?: number; o?: number; glow?: number}> = ({x, y, r = 14, o = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {glow > 0 && <circle r={r * 2.2} fill={TEAL} opacity={0.18 * glow} />}
    <circle r={r} fill={TEAL} fillOpacity={0.22} stroke={TEAL} strokeWidth={Math.max(2, r * 0.18)} />
    <circle cx={r * 0.15} cy={-r * 0.1} r={r * 0.35} fill={TEAL} />
  </g>
);

/** Linear wobble that decays: for "this one breaks the pattern" moments. */
export const wobble = (f: number, at: number, amp = 8, d = 24) => (f < at || f > at + d ? 0 : Math.sin(((f - at) / d) * Math.PI * 5) * amp * (1 - (f - at) / d));

/** Frame index of the n-th item in a staggered sequence. */
export const stag = (f: number, at: number, i: number, every: number, d = 8) => clamp01((f - at - i * every) / d);

/** A tiny ruler (used in the recap montage and the final teaser). */
export const MiniRuler: React.FC<{x: number; y: number; w: number; o?: number; rot?: number; ticks?: number; sw?: number}> = ({x, y, w, o = 1, rot = 0, ticks = 10, sw = LINE}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
    <rect x={0} y={-24} width={w} height={48} rx={8} fill={PAPER} stroke={INK} strokeWidth={sw} />
    {Array.from({length: ticks + 1}).map((_, i) => (
      <line key={i} x1={(w * i) / ticks} x2={(w * i) / ticks} y1={-24} y2={i % 5 === 0 ? 4 : -6} stroke={INK} strokeWidth={3} />
    ))}
  </g>
);
