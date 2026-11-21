// Video 1 (revised), part F: Scene 2, "count the tens: logarithms".
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoLive as AxoSide, AxoFrontLive} from '../../../lib/axolive';
import {Frame, KeySeq, SfxList, useCue} from '../kit';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst} from './common';
import {T, Sp, UnitTag, AMBER, RED} from '../v2/common';

type SfxItem = [number, Parameters<typeof SfxList>[0]['items'][number][1], number?, number?];

const Heads: React.FC<{items: {at: number; text: string; size?: number}[]; size?: number; y?: number}> = ({items, size = 74, y = 150}) => (
  <KeySeq x={90} y={y} w={1740} align="center" size={size} items={items} />
);

/** Words cue in order: each one searched for after the previous one. */
const seq = (cue: (p: string, fb?: number, after?: number, nth?: number) => number, fps: number, start: number, phrases: [string, number][]) => {
  const out: number[] = [];
  let after = start / fps;
  for (const [ph, fb] of phrases) {
    const t = cue(ph, fb, after);
    out.push(t);
    after = t / fps + 0.02;
  }
  return out;
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Log-scale ruler from 1 to 10 (one step of ten) between x0 and x0 + w. */
const lx = (v: number, x0: number, w: number) => x0 + Math.log10(v) * w;
const DigitRuler: React.FC<{x0: number; w: number; y: number; glow?: (n: number) => number; o?: number; labels?: boolean}> = ({x0, w, y, glow, o = 1, labels = true}) => (
  <g opacity={o}>
    <line x1={x0 - 20} x2={x0 + w + 20} y1={y} y2={y} stroke={INK} strokeWidth={LINE} />
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
      const x = lx(n, x0, w), g = glow ? glow(n) : 0;
      const major = n === 1 || n === 10;
      return (
        <g key={n}>
          {g > 0 && <circle cx={x} cy={y} r={18 + 8 * g} fill={TEAL} opacity={0.18 * g} />}
          <line x1={x} x2={x} y1={y - (major ? 30 : 20)} y2={y + (major ? 30 : 20)} stroke={g > 0.5 ? TEAL : INK} strokeWidth={major ? 5 : 4} />
          {labels && <text x={x} y={y + 68} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={major ? 44 : 38} fill={g > 0.5 ? TEAL : INK}>{n}</text>}
        </g>
      );
    })}
  </g>
);

/** A log block: a rounded bar with a stamp. */
const Block: React.FC<{x: number; y: number; w: number; color: string; label?: string; h?: number; o?: number; s?: number}> = ({x, y, w, color, label, h = 66, o = 1, s = 1}) => (
  <g opacity={o} transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={0} y={-h} width={w} height={h} rx={12} fill={color} fillOpacity={color === PAPER ? 1 : 0.85} stroke={INK} strokeWidth={4} />
    {[0.25, 0.75].map((k) => <circle key={k} cx={w * k} cy={-h - 6} r={8} fill={color} stroke={INK} strokeWidth={3} />)}
    {label && <text x={w / 2} y={-h / 2 + 11} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={color === PAPER ? INK : PAPER}>{label}</text>}
  </g>
);

const Confetti: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g>
      {Array.from({length: 46}).map((_, i) => {
        const a = random(`ca${i}`) * Math.PI * 2, v = 300 + random(`cv${i}`) * 500;
        const px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t + 900 * t * t;
        return <rect key={i} x={px} y={py} width={14} height={8} rx={2} fill={[ORANGE, TEAL, AMBER, INK][i % 4]} opacity={1 - t}
                     transform={`rotate(${random(`cr${i}`) * 360 + t * 600} ${px} ${py})`} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ 2A-1. the view counter
export const V1LogViews: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const posted = cue('posted', 0.02), one = cue('One view', 0.08), mom = cue("That's his mom", 0.12);
  const [ten, hund, thou, sunday, million] = seq(cue, fps, mom, [['Then ten', 0.2], ['hundred', 0.24], ['thousand', 0.28], ['Sunday', 0.32], ['million', 0.36]]);
  const every = cue('Every jump', 0.45), count = cue('count the jumps', 0.55), six = cue('six jumps', 0.62);
  const name = cue('has a name', 0.72), logm = cue('log of a million', 0.85);
  // the counter value over time: 1, 10, 100, 1,000, then 10k and 100k on "by Sunday", then the million
  const jumps = [ten, hund, thou, sunday + 6, sunday + 16, million];
  const nJ = jumps.filter((t) => f >= t).length;
  const views = Math.pow(10, nJ);
  const click = Math.max(posted + 16, cue('video', 0.05) + 8);   // a nervous hover first, then the click
  const uploaded = fin(f, click + 6, 10);
  const playerO = (1 - fin(f, every - 4, 14));
  const faint = tio(f, million + 6, million + 22);
  // tags peel off the counter and line up as steps on a ruler
  const line = tio(f, every + 6, every + 34);
  const R = {x0: 330, step: 210, y: 760};
  const stepsLit = f < count ? 0 : Math.min(6, Math.floor((f - count) / 7) + 1);
  const sfx: SfxItem[] = [[click, 'clack', 0.5], [one, 'blip', 0.35], [mom, 'pop', 0.3, 0.8],
    ...jumps.map((t, i) => [t, 'blip', 0.45, 0.9 + i * 0.15] as SfxItem), [million, 'confetti', 0.5], [million + 8, 'boing', 0.35, 0.7],
    [every + 6, 'whoosh', 0.3, 1.2], ...Array.from({length: 6}).map((_, k) => [count + k * 7, 'tick', 0.3, 1 + k * 0.08] as SfxItem), [logm, 'ding', 0.4]];
  return (
    <Frame
      html={
        <>
          <SfxList items={sfx} />
          <Heads items={[
            {at: posted, text: "Axol's [[first video]]"},
            {at: mom, text: "1 view. (That's his [[mom.]])"},
            {at: ten, text: 'Then…'},
            {at: million, text: 'A [[million!]]'},
            {at: every, text: 'Every jump: [[×10]]'},
            {at: six, text: 'A million is [[six]] jumps.'},
            {at: name, text: 'That count is the [[logarithm.]]'},
            {at: logm, text: 'log(1,000,000) = [[6]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {playerO > 0 && (
            <g opacity={playerO}>
              {/* a generic video page: player, title bar, upload button, view counter */}
              <rect x={420} y={300} width={1080} height={520} rx={22} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
              <rect x={450} y={330} width={640} height={360} rx={14} fill={P.line} stroke={INK} strokeWidth={4} />
              {uploaded > 0 && (
                <g opacity={uploaded}>
                  <AxoSide x={690} y={650} scale={0.55} rear={1} arm={-30} />
                  <circle cx={950} cy={510} r={46} fill={PAPER} stroke={INK} strokeWidth={4} />
                  <path d="M 936 488 L 970 510 L 936 532 Z" fill={INK} />
                </g>
              )}
              <rect x={450} y={712} width={420} height={22} rx={8} fill={P.line} />
              <rect x={450} y={748} width={300} height={16} rx={8} fill={P.line} />
              {/* upload button, clicked nervously */}
              <g transform={`translate(1290 420) scale(${f > click && f < click + 6 ? 0.92 : 1})`} opacity={1 - 0.6 * uploaded}>
                <rect x={-150} y={-46} width={300} height={92} rx={46} fill={uploaded > 0 ? TEAL : INK} />
                <path d="M -90 10 L -90 -18 M -102 -6 L -90 -20 L -78 -6" stroke={PAPER} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x={20} y={13} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={PAPER}>{uploaded > 0 ? 'POSTED' : 'UPLOAD'}</text>
              </g>
              {f < click + 8 && <AxoSide x={1180 + Math.sin(f / 3) * 4} y={560} scale={0.7} rear={1} arm={f > click - 4 && f < click + 4 ? 10 : -40 + Math.sin(f / 4) * 8} sweat />}
              {/* view counter */}
              {f >= one && (
                <g transform="translate(1290 640)">
                  <text x={0} y={0} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={nJ >= 5 ? 64 : 86} fill={nJ >= 6 ? ORANGE : INK}
                        transform={`scale(${jumps.some((t) => f >= t && f < t + 8) ? 1.12 : 1})`}>{fmt(views)}</text>
                  <text x={0} y={52} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} letterSpacing={3} fill={P.muted}>{views === 1 ? 'VIEW' : 'VIEWS'}</text>
                </g>
              )}
              {/* ×10 tags pop at each jump */}
              {jumps.map((t, i) => f >= t && <UnitTag key={i} x={1135 + (i % 3) * 105} y={715 + Math.floor(i / 3) * 58} text="×10" color={TEAL} s={0.7 * tsp(f, t, t + 10, 0.4, 1)} />)}
              {/* mom refreshing, in a tiny inset */}
              {f >= mom - 4 && f < ten && (
                <g opacity={fin(f, mom - 4, 6)}>
                  <rect x={1480} y={640} width={330} height={250} rx={18} fill={PAPER} stroke={INK} strokeWidth={5} />
                  <AxoSide x={1560} y={860} scale={0.6} rear={1} arm={-60 + Math.sin(f / 3) * 20} wink />
                  <g transform={`translate(1760 700) rotate(${f * 12})`}>
                    <path d="M -18 0 A 18 18 0 1 1 0 18" fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
                    <path d="M -6 18 L 2 10 L 2 26 Z" fill={TEAL} />
                  </g>
                  <text x={1645} y={680} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={22} letterSpacing={2} fill={P.muted}>MOM</text>
                </g>
              )}
              <Confetti t={(f - million) / 40} x={1290} y={600} />
              {/* Axol faints backwards at the million */}
              {f >= million && (
                <g transform={`rotate(${-80 * faint} 1700 980)`}>
                  <AxoSide x={1700} y={980} scale={0.7} rear={1} arm={-90} />
                </g>
              )}
            </g>
          )}
          {/* the six ×10 jumps become six equal steps on a ruler */}
          {line > 0 && (
            <g opacity={line}>
              <line x1={R.x0 - 40} x2={R.x0 + 6 * R.step + 40} y1={R.y} y2={R.y} stroke={INK} strokeWidth={LINE} />
              {Array.from({length: 7}).map((_, i) => {
                const x = R.x0 + i * R.step;
                return (
                  <g key={i}>
                    <line x1={x} x2={x} y1={R.y - 26} y2={R.y + 26} stroke={i <= stepsLit && f >= count ? TEAL : INK} strokeWidth={5} />
                    <text x={x} y={R.y + 70} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={i < 4 ? 40 : 34} fill={INK}>{fmt(Math.pow(10, i))}</text>
                  </g>
                );
              })}
              {Array.from({length: 6}).map((_, k) => {
                const x1 = R.x0 + k * R.step, x2 = x1 + R.step, mid = (x1 + x2) / 2;
                const from = {x: 1135 + (k % 3) * 105, y: 715 + Math.floor(k / 3) * 58};
                const tx = from.x + (mid - from.x) * line, ty = from.y + (R.y - 120 - from.y) * line;
                const lit = k < stepsLit;
                return (
                  <g key={k}>
                    <path d={`M ${x1} ${R.y - 34} Q ${mid} ${R.y - 120} ${x2} ${R.y - 34}`} fill="none" stroke={lit ? TEAL : INK} strokeWidth={4} strokeDasharray="8 8" opacity={line} />
                    <UnitTag x={tx} y={ty} text="×10" color={lit ? TEAL : INK} s={0.8} />
                  </g>
                );
              })}
              {/* the teal step counter */}
              <g transform="translate(960 470)" opacity={fin(f, count, 8)}>
                <circle r={86} fill={TEAL} />
                <text y={34} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={100} fill={PAPER}>{stepsLit}</text>
                <text y={130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} letterSpacing={3} fill={TEAL}>STEPS</text>
              </g>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2A-2. a log counts tens (and backwards)
export const V1LogCount: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const asks = cue('A log asks', 0.02), starting = cue('starting from one', 0.1);
  const [thou, ten, one, moved] = seq(cue, fps, starting, [['Log of a thousand', 0.35], ['Log of ten', 0.45], ['Log of one', 0.52], ["haven't moved", 0.58]]);
  const back = cue('backwards', 0.68), hundredth = cue('A hundredth', 0.76), minus = cue('minus two', 0.9);
  // camera: 1..1000 first, then the ruler extends left to 0.01
  const ext = tio(f, hundredth - 6, hundredth + 24);
  const step = 360 - 100 * ext, x1 = 420 + 340 * ext; // x of the "1" tick
  const Y = 720;
  const X = (e: number) => x1 + e * step;
  const value = f >= minus ? -2 : f >= one ? 0 : f >= ten ? 1 : f >= thou ? 3 : null;
  const target = f >= minus ? -2 : f >= one ? 0 : f >= ten ? 1 : f >= thou ? 3 : 0;
  const hopsShown = (k: number) => (target >= 0 ? (k < target ? 1 : 0) : 0);
  const glowE = (e: number) => (e === target && value !== null ? 1 : 0);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[asks, 'tap', 0.3], [thou, 'ding', 0.35], [ten, 'ding', 0.35, 1.2], [one, 'ding', 0.35, 0.8], [moved, 'boing', 0.3, 0.8], [hundredth - 6, 'slide', 0.3], [minus, 'ding', 0.35, 0.7]]} />
          <Heads items={[
            {at: asks, text: 'A log asks: [[how many ×10s?]]'},
            {at: thou, text: 'log 1,000 = [[3]]'},
            {at: ten, text: 'log 10 = [[1]]'},
            {at: one, text: 'log 1 = [[0]]'},
            {at: moved, text: "You haven't moved."},
            {at: back, text: 'It works [[backwards]] too.'},
            {at: minus, text: 'log 0.01 = [[−2]]'},
          ]} />
        </>
      }
      svg={
        <g opacity={fin(f, 0, 8)}>
          <line x1={X(-2) - 60} x2={X(3) + 60} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
          {[-2, -1, 0, 1, 2, 3].map((e) => {
            const o = e < 0 ? ext : 1;
            const lab = e < 0 ? (e === -1 ? '0.1' : '0.01') : fmt(Math.pow(10, e));
            const g = glowE(e);
            return (
              <g key={e} opacity={o}>
                {g > 0 && <circle cx={X(e)} cy={Y} r={34} fill={TEAL} opacity={0.2} />}
                <line x1={X(e)} x2={X(e)} y1={Y - 28} y2={Y + 28} stroke={g ? TEAL : INK} strokeWidth={5} />
                <text x={X(e)} y={Y + 74} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={g ? TEAL : INK}>{lab}</text>
              </g>
            );
          })}
          {/* ×10 hops from 1, or ÷10 hops to the left */}
          {[0, 1, 2].map((k) => hopsShown(k) > 0 && (
            <g key={`u${k}`} opacity={fin(f, (target === 3 ? thou : ten) + k * 5, 6)}>
              <path d={`M ${X(k)} ${Y - 36} Q ${(X(k) + X(k + 1)) / 2} ${Y - 130} ${X(k + 1)} ${Y - 36}`} fill="none" stroke={TEAL} strokeWidth={5} strokeDasharray="8 8" />
              <UnitTag x={(X(k) + X(k + 1)) / 2} y={Y - 128} text="×10" color={TEAL} s={0.75} />
            </g>
          ))}
          {f >= minus - 30 && [0, 1].map((k) => (
            <g key={`d${k}`} opacity={fin(f, minus - 30 + k * 8, 6)}>
              <path d={`M ${X(-k)} ${Y - 36} Q ${(X(-k) + X(-k - 1)) / 2} ${Y - 130} ${X(-k - 1)} ${Y - 36}`} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="8 8" />
              <UnitTag x={(X(-k) + X(-k - 1)) / 2} y={Y - 128} text="÷10" color={ORANGE} s={0.75} />
            </g>
          ))}
          {/* Axo stays put at 1 for "you haven't moved" */}
          <g opacity={fin(f, one - 6, 8) * (1 - fin(f, back, 8))}>
            <AxoSide x={X(0) - 80} y={Y - 8} scale={0.42} rear={1} arm={f > moved ? -60 + 40 * Math.sin((f - moved) / 4) : -20} />
          </g>
          {/* the teal step counter */}
          {value !== null && (
            <g transform="translate(960 430)">
              <rect x={-130} y={-80} width={260} height={150} rx={30} fill={value < 0 ? ORANGE : TEAL} />
              <text y={30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={100} fill={PAPER}>{value < 0 ? `−${-value}` : value}</text>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ the bench (2B)
const SEAT_W = 140;
const seatX = (i: number, x0: number) => x0 + (i + 0.5) * SEAT_W;
const Bench: React.FC<{x0: number; y: number; empty?: number[]; pulse?: number}> = ({x0, y, empty = [], pulse = 0}) => (
  <g>
    <rect x={x0 - 20} y={y} width={SEAT_W * 10 + 40} height={26} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={x0 - 20} y={y - 150} width={SEAT_W * 10 + 40} height={22} rx={8} fill={PAPER} stroke={INK} strokeWidth={4} />
    {[0, 0.5, 1].map((k) => <line key={k} x1={x0 + k * SEAT_W * 10} x2={x0 + k * SEAT_W * 10} y1={y - 128} y2={y} stroke={INK} strokeWidth={4} />)}
    {[-0, 1].map((k) => <line key={`l${k}`} x1={x0 + 20 + k * (SEAT_W * 10 - 40)} x2={x0 + 10 + k * (SEAT_W * 10 - 20)} y1={y + 26} y2={y + 110} stroke={INK} strokeWidth={6} />)}
    {Array.from({length: 10}).map((_, i) => (
      <g key={i}>
        {empty.includes(i) && pulse > 0 && <rect x={x0 + i * SEAT_W + 8} y={y - 8} width={SEAT_W - 16} height={14} rx={7} fill={ORANGE} opacity={0.8 * pulse} />}
        <text x={seatX(i, x0)} y={y + 64} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill={P.muted}>{i + 1}</text>
      </g>
    ))}
  </g>
);

/** Axos on the bench: count goes from `from` to `to` (each parent splits into `k` copies) as `t` goes 0..1. */
const Clones: React.FC<{x0: number; y: number; from: number; to: number; t: number; s?: number; fan?: boolean; look?: number}> = ({x0, y, from, to, t, s = 0.34, fan = false, look = 0}) => {
  const k = Math.max(1, Math.round(to / Math.max(1, from)));
  const sq = t > 0 && t < 0.3 ? Math.sin((t / 0.3) * Math.PI) : 0;
  const move = tsp(Math.min(1, Math.max(0, (t - 0.2) / 0.8)), 0, 1, 0, 1);
  const n = t <= 0 ? from : to;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const parent = t <= 0 ? i : Math.floor(i / k);
        const px = seatX(parent, x0), tx = seatX(i, x0);
        const x = t <= 0 ? seatX(i, x0) : px + (tx - px) * move;
        const fanRot = fan && t > 0 && t < 1 ? (i % k - (k - 1) / 2) * 18 * Math.sin(move * Math.PI) : 0;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${fanRot}) scale(${1 + 0.18 * sq} ${1 - 0.18 * sq}) translate(${-x} ${-y})`}>
            <AxoSide x={x - 30} y={y} scale={s} rear={1} arm={-30} look={look} />
          </g>
        );
      })}
    </g>
  );
};

const LogBars: React.FC<{x0: number; w: number; y: number; n: number; len: number; color: string; shown: (i: number) => number}> = ({x0, w, y, n, len, color, shown}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const o = shown(i);
      if (o <= 0) return null;
      return <rect key={i} x={x0 + i * len * w} y={y - 70} width={len * w * ease(o) - 4} height={50} rx={10} fill={color} fillOpacity={0.85} stroke={INK} strokeWidth={3} />;
    })}
  </g>
);

// ------------------------------------------------------------------ 2B-1. doubling on the bench: log 2
export const V1LogDouble: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const easy = cue('Easy for powers', 0.02), what = cue('log of two', 0.08), trick = cue('Axol has a trick', 0.16), split = cue('Watch him split', 0.26);
  const [one, two, four, eight] = seq(cue, fps, split, [['One Axol', 0.32], ['Two', 0.36], ['Four', 0.4], ['Eight', 0.44]]);
  const three = cue('Three doublings', 0.5), so = cue('So three doublings', 0.64), third = cue('third of a step', 0.8), log2 = cue('The log of two is', 0.9);
  const stage = f < two ? 0 : f < four ? 1 : f < eight ? 2 : 3;
  const counts = [1, 2, 4, 8];
  const starts = [0, two, four, eight];
  const t = stage === 0 ? 0 : clamp01((f - starts[stage]) / 18);
  const pulse = f > three + 6 && f < three + 30 ? Math.sin(((f - three - 6) / 24) * Math.PI) : 0;
  const lift = tio(f, so - 4, so + 20);       // bench moves to the top half, the ruler appears below
  const RW = 1200, RX = 360, RY = 860;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[split, 'whoosh', 0.25, 1.4], [two, 'pop', 0.45, 0.8], [four, 'pop', 0.45, 0.95], [eight, 'pop', 0.45, 1.1], [three + 6, 'blip', 0.3, 0.7],
            [so + 10, 'slide', 0.3], [so + 24, 'tap', 0.3], [so + 34, 'tap', 0.3, 1.1], [so + 44, 'tap', 0.3, 1.2], [log2, 'ding', 0.4]]} />
          <Heads items={[
            {at: easy, text: 'Easy for powers of ten.'},
            {at: what, text: 'But [[log 2]] = ?'},
            {at: trick, text: 'Axolotls [[regenerate.]]'},
            {at: two, text: '1 → 2 → 4 → 8'},
            {at: three, text: '3 doublings: [[almost]] full'},
            {at: third, text: '1 doubling ≈ [[⅓]] of a step'},
            {at: log2, text: 'log 2 ≈ [[0.3]]'},
          ]} />
        </>
      }
      svg={
        <g>
          <g transform={`translate(960 ${640 - 240 * lift}) scale(${1 - 0.3 * lift}) translate(-960 -640)`}>
            <Bench x0={260} y={700} empty={stage === 3 ? [8, 9] : []} pulse={pulse} />
            <Clones x0={260} y={696} from={stage === 0 ? 1 : counts[stage - 1]} to={counts[stage]} t={t} look={pulse > 0 ? 6 : 0} />
          </g>
          {lift > 0 && (
            <g opacity={lift}>
              <DigitRuler x0={RX} w={RW} y={RY} glow={(n) => (n === 2 && f >= log2 ? 1 : 0)} />
              <LogBars x0={RX} w={RW} y={RY} n={3} len={Math.log10(2)} color={TEAL} shown={(i) => clamp01((f - so - 24 - i * 10) / 10)} />
              {[1, 2].map((k) => <line key={k} x1={RX + (RW * k) / 3} x2={RX + (RW * k) / 3} y1={RY - 110} y2={RY + 12} stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={fin(f, third, 8)} />)}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2B-2. tripling on the bench: log 3 (and a pigeon)
const Pigeon: React.FC<{x: number; y: number; flap: number}> = ({x, y, flap}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={-28} rx={34} ry={24} fill={P.muted} stroke={INK} strokeWidth={3} />
    <circle cx={30} cy={-52} r={15} fill={P.muted} stroke={INK} strokeWidth={3} />
    <circle cx={34} cy={-55} r={3} fill={INK} />
    <path d="M 44 -50 L 56 -46 L 44 -42 Z" fill={AMBER} />
    <path d={`M -6 -36 Q -30 ${-70 - 30 * flap} -54 ${-40 - 20 * flap}`} fill="none" stroke={INK} strokeWidth={4} />
    <line x1={-6} x2={-10} y1={-6} y2={4} stroke={INK} strokeWidth={3} /><line x1={8} x2={10} y1={-6} y2={4} stroke={INK} strokeWidth={3} />
  </g>
);

export const V1LogTriple: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const triple = cue('Now triple', 0.02);
  const [one, three, nine] = seq(cue, fps, triple, [['One', 0.08], ['Three', 0.14], ['Nine', 0.2]]);
  const two = cue('Two triplings', 0.3), left = cue('one seat is left', 0.4), under = cue('just under half', 0.6), exact = cue('exact value', 0.75), log3 = cue('log of three', 0.85);
  // the 8 clones merge back into one (reverse bloop), then 1 → 3 → 9
  const merge = clamp01(f / 16);
  const stage = f < three ? 0 : f < nine ? 1 : 2;
  const t = stage === 0 ? 0 : clamp01((f - (stage === 1 ? three : nine)) / 18);
  const pig = clamp01((f - left) / 24);
  const px = 2100 + (seatX(9, 260) - 2100) * ease(pig), py = 696 - 260 * Math.sin(pig * Math.PI) * (1 - pig);
  const glare = f > left + 26 ? 8 : 0;
  const RW = 1200, RX = 360, RY = 860;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[2, 'pop', 0.35, 0.6], [three, 'pop', 0.45, 0.9], [nine, 'pop', 0.45, 1.05], [left, 'whoosh', 0.25, 1.6], [left + 24, 'tap', 0.35, 1.4],
            [two + 10, 'tap', 0.3], [two + 22, 'tap', 0.3, 1.1], [log3, 'ding', 0.4]]} />
          <Heads items={[
            {at: triple, text: 'Now [[triple.]]'},
            {at: three, text: '1 → 3 → 9'},
            {at: two, text: '2 triplings: [[one seat]] left'},
            {at: under, text: '1 tripling: just under [[½]] a step'},
            {at: log3, text: 'log 3 ≈ [[0.48]]'},
          ]} />
        </>
      }
      svg={
        <g>
          <g transform="translate(960 400) scale(0.7) translate(-960 -640)">
            <Bench x0={260} y={700} empty={stage === 2 ? [9] : []} pulse={f > two && f < two + 24 ? Math.sin(((f - two) / 24) * Math.PI) : 0} />
            {merge < 1 ? (
              <g opacity={1}>
                {Array.from({length: 8}).map((_, i) => {
                  const x = seatX(i, 260) + (seatX(0, 260) - seatX(i, 260)) * inOut(merge);
                  return <g key={i} opacity={i === 0 ? 1 : 1 - merge}><AxoSide x={x - 30} y={696} scale={0.34} rear={1} arm={-30} /></g>;
                })}
              </g>
            ) : (
              <Clones x0={260} y={696} from={stage === 0 ? 1 : stage === 1 ? 1 : 3} to={stage === 0 ? 1 : stage === 1 ? 3 : 9} t={t} fan look={glare} />
            )}
            {f >= left && <Pigeon x={px} y={py} flap={pig < 1 ? Math.abs(Math.sin(f / 2)) : 0} />}
          </g>
          <g opacity={fin(f, 0, 10)}>
            <DigitRuler x0={RX} w={RW} y={RY} glow={(n) => (n === 2 ? 0.6 : n === 3 && f >= log3 ? 1 : 0)} />
            <LogBars x0={RX} w={RW} y={RY} n={2} len={Math.log10(3)} color={AMBER} shown={(i) => clamp01((f - two - 10 - i * 12) / 12)} />
            {f >= two + 34 && <T x={RX + RW - 30} y={RY - 120} size={30} font={SANS} weight={800} color={P.muted} o={fin(f, two + 34, 8)}>gap</T>}
          </g>
        </g>
      }
    />
  );
};

export const v1f1 = {V1LogViews, V1LogCount, V1LogDouble, V1LogTriple};
export {DigitRuler, Block, lx, seq, Heads, fmt, Confetti, Bench};
