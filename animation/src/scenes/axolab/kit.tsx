// Shared kit for the riddle video: frame wrapper, kinetic typography, small props.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Stage, useFontsReady} from '../../lib/stage';
import {Paper, Tag, DISPLAY, SANS, P} from '../../lib/paper';
import {INK, PAPER, ORANGE, COBALT, LINE} from '../../lib/cast';
import {makeCue} from '../../lib/cues';
import type {SceneProps} from '../../lib/types';

export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
export const tw = (f: number, a: number, b: number, from = 0, to = 1, e: (t: number) => number = ease) =>
  from + (to - from) * e((f - a) / Math.max(1, b - a));
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Paper frame with an HTML layer (type) under an SVG layer (characters, props). */
export const Frame: React.FC<{svg?: React.ReactNode; html?: React.ReactNode; tag?: string; tagOpacity?: number}> = ({svg, html, tag, tagOpacity = 1}) => {
  useFontsReady();
  return (
    <AbsoluteFill>
      <Stage
        html={
          <>
            <Paper />
            {tag && <div style={{position: 'absolute', left: 80, top: 64, opacity: tagOpacity}}><Tag>{tag}</Tag></div>}
            {html}
          </>
        }
        over={svg}
      />
    </AbsoluteFill>
  );
};

/** Render text with ^{sup} and [[accent]] markup in the display face. */
export const rich = (text: string, accent = ORANGE): React.ReactNode[] =>
  text.split(/(\^\{[^}]*\}|\[\[[^\]]*\]\])/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('^{')) return <sup key={i} style={{fontSize: '0.55em', verticalAlign: '0.85em', marginLeft: '0.04em'}}>{part.slice(2, -1)}</sup>;
    if (part.startsWith('[[')) return <span key={i} style={{color: accent}}>{rich(part.slice(2, -2), accent)}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

/** One headline whose words rise in one by one. */
export const KineticLine: React.FC<{
  text: string; at: number; out?: number; size?: number; color?: string; weight?: number;
  align?: 'left' | 'center' | 'right'; font?: 'display' | 'sans'; style?: React.CSSProperties;
}> = ({text, at, out, size = 96, color = INK, weight = 700, align = 'left', font = 'display', style}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const outA = out !== undefined ? 1 - clamp01((f - out) / 6) : 1;
  if (outA <= 0) return null;
  const marked = text.replace(/\[\[([^\]]*)\]\]/g, (_m, inner: string) => inner.split(/\s+/).map((w) => `[[${w}]]`).join(' '));
  const words = marked.split(/(\s+)/);
  let wi = 0;
  return (
    <div style={{fontFamily: font === 'display' ? DISPLAY : SANS, fontWeight: weight, fontSize: size, color, lineHeight: 1.08,
      letterSpacing: font === 'display' ? '-0.015em' : '0.01em', textAlign: align, opacity: outA,
      transform: `translateY(${(1 - outA) * -16}px)`, fontVariantNumeric: 'lining-nums', ...style}}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
        const k = wi++;
        const t = clamp01((f - at - k * 3) / 10);
        return (
          <span key={i} style={{display: 'inline-block', opacity: ease(t), transform: `translateY(${(1 - ease(t)) * size * 0.35}px)`}}>
            {rich(w)}
          </span>
        );
      })}
    </div>
  );
};

export type KeyItem = {at: number; text: string; size?: number; color?: string; sub?: string};

/** A sequence of headlines in one spot: each replaces the previous one. */
export const KeySeq: React.FC<{items: KeyItem[]; x: number; y: number; w?: number; align?: 'left' | 'center' | 'right'; size?: number}> = ({
  items, x, y, w = 900, align = 'left', size = 92,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    {items.map((it, i) => it.text.trim() && <Sfx key={`s${i}`} at={i === 0 ? it.at : it.at + 7} name="type" volume={0.45} />)}
    {items.map((it, i) => (
      <div key={i} style={{position: 'absolute', left: 0, top: 0, width: w}}>
        <KineticLine text={it.text} at={i === 0 ? it.at : it.at + 7} out={items[i + 1]?.at} size={it.size ?? size} color={it.color} align={align} />
        {it.sub && <KineticLine text={it.sub} at={it.at + 15} out={items[i + 1]?.at} size={30} weight={600} color={P.muted} font="sans" align={align} style={{marginTop: 18}} />}
      </div>
    ))}
  </div>
);

export type SfxName = 'pop' | 'type' | 'tick' | 'tock' | 'whoosh' | 'swish' | 'thud' | 'bang' | 'ding' | 'chime' | 'sparkle'
  | 'boing' | 'hop' | 'clack' | 'crash' | 'chomp' | 'fizz' | 'scribble' | 'rise' | 'confetti' | 'tap' | 'blip' | 'slide';

/** A sound effect that plays at frame `at` (synthesized kit in public/sfx). */
export const Sfx: React.FC<{at: number; name: SfxName; volume?: number; rate?: number}> = ({at, name, volume = 0.6, rate = 1}) => {
  if (!Number.isFinite(at)) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`sfx:${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} playbackRate={rate} />
    </Sequence>
  );
};

/** Several sound effects at once: [frame, name, volume?, rate?]. */
export const SfxList: React.FC<{items: [number, SfxName, number?, number?][]}> = ({items}) => (
  <>{items.map(([at, name, vol, rate], i) => <Sfx key={i} at={at} name={name} volume={vol ?? 0.6} rate={rate ?? 1} />)}</>
);

/** Cue helper: frame for a phrase, with fallback fraction. */
export const useCue = (props: SceneProps) => makeCue(props);

/** Ink-circle draw-on around a box (SVG coords). */
export const InkCircle: React.FC<{cx: number; cy: number; rx: number; ry: number; progress: number}> = ({cx, cy, rx, ry, progress}) => {
  if (progress <= 0) return null;
  const pts: string[] = [];
  const n = 60, total = Math.PI * 2 * 1.06 * progress;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 - 0.2 + (total * i) / n;
    const wob = 1 + 0.03 * Math.sin(a * 3);
    pts.push(`${cx + Math.cos(a) * rx * wob} ${cy + Math.sin(a) * ry * wob}`);
  }
  return <path d={`M ${pts.join(' L ')}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />;
};

/** Orange H+ spark. */
export const Spark: React.FC<{x: number; y: number; r?: number; seed?: number}> = ({x, y, r = 12, seed = 0}) => {
  const f = useCurrentFrame();
  const j = Math.sin(f / 4 + seed * 2.3) * 2;
  return (
    <g transform={`translate(${x + j} ${y - j})`}>
      <circle r={r * 1.9} fill={ORANGE} opacity={0.18} />
      <circle r={r} fill={ORANGE} />
      <text x={0} y={r * 0.38} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={r * 1.05} fill={PAPER}>+</text>
    </g>
  );
};

/** Line-art beaker; (x, y) = bottom center. */
export const Beaker: React.FC<{x: number; y: number; w?: number; h?: number; fill?: number}> = ({x, y, w = 260, h = 300, fill = 0.55}) => (
  <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
    <rect x={-w / 2 + 6} y={-h * fill} width={w - 12} height={h * fill - 6} rx={14} fill={COBALT} opacity={0.1} />
    <path d={`M ${-w / 2} ${-h} L ${-w / 2} -16 Q ${-w / 2} 0 ${-w / 2 + 16} 0 L ${w / 2 - 16} 0 Q ${w / 2} 0 ${w / 2} -16 L ${w / 2} ${-h}`}
          fill="none" stroke={INK} strokeWidth={LINE} />
    <path d={`M ${-w / 2 - 20} ${-h} L ${-w / 2} ${-h}`} stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
    {[0.25, 0.45, 0.65].map((t) => <line key={t} x1={w / 2 - 50} x2={w / 2 - 14} y1={-h * t} y2={-h * t} stroke={INK} strokeWidth={3} opacity={0.5} />)}
  </g>
);

/** Stopwatch / countdown ring. */
export const Ring: React.FC<{x: number; y: number; r?: number; frac: number; label: string; sub?: string; color?: string}> = ({x, y, r = 110, frac, label, sub, color = ORANGE}) => {
  const c = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={PAPER} stroke={INK} strokeWidth={LINE} />
      <circle r={r - 16} fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={10} />
      <circle r={r - 16} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={`${(c - 100) * clamp01(frac)} ${c}`} transform="rotate(-90)" />
      <text y={r * 0.22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={r * 0.62} fill={INK}>{label}</text>
      {sub && <text y={r * 0.55} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={r * 0.15} fill={P.muted} letterSpacing={2}>{sub}</text>}
    </g>
  );
};

export const fall = (f: number, at: number, from: number, to: number, d = 14) => interpolate(f, [at, at + d], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export {INK, PAPER, ORANGE, COBALT, LINE, DISPLAY, SANS, P};
