// Video 2, part A: the Mars hook, the cell question, and prefixes as counts of tens.
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, SfxList, useCue} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, AMBER, RED, clamp01, ease, inOut, tio, tsp, fin, Burst,
  Heads, UnitTag, T, Sp, Cell, wobble, MiniRuler,
} from './common';

// ------------------------------------------------------------------ shared space bits
const Stars: React.FC<{o: number; seed: string}> = ({o, seed}) => (
  <g opacity={o}>
    {Array.from({length: 70}).map((_, i) => (
      <circle key={i} cx={random(`${seed}x${i}`) * 1920} cy={330 + random(`${seed}y${i}`) * 720} r={1.5 + random(`${seed}r${i}`) * 2.5} fill={INK} opacity={0.25 + random(`${seed}o${i}`) * 0.4} />
    ))}
  </g>
);

const bez = (t: number, a: [number, number], c: [number, number], b: [number, number]): [number, number] => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const pathOf = (a: [number, number], c: [number, number], b: [number, number], t0 = 0, t1 = 1) => {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) { const p = bez(t0 + ((t1 - t0) * i) / 40, a, c, b); pts.push(`${p[0].toFixed(1)} ${p[1].toFixed(1)}`); }
  return `M ${pts.join(' L ')}`;
};
const EARTH: [number, number] = [330, 790], CTRL: [number, number] = [930, 400], GOAL: [number, number] = [1440, 600], LOST: [number, number] = [1500, 628];
const MARS: [number, number] = [1590, 560];

const Probe: React.FC<{x: number; y: number; ang: number; dark: number}> = ({x, y, ang, dark}) => {
  const f = useCurrentFrame();
  const blink = dark < 0.5 && Math.floor(f / 10) % 3 === 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={1 - 0.55 * dark}>
      <rect x={-46} y={-9} width={30} height={18} fill={PAPER} stroke={INK} strokeWidth={3} />
      <rect x={16} y={-9} width={30} height={18} fill={PAPER} stroke={INK} strokeWidth={3} />
      {[-38, -28, 24, 34].map((lx) => <line key={lx} x1={lx} x2={lx} y1={-9} y2={9} stroke={INK} strokeWidth={2} />)}
      <rect x={-14} y={-14} width={28} height={28} rx={5} fill={dark > 0.5 ? P.muted : INK} />
      <circle cx={0} cy={0} r={5} fill={blink ? ORANGE : PAPER} opacity={1 - dark} />
    </g>
  );
};

// ------------------------------------------------------------------ 0. Mars
export const V2Mars: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const lost = cue('lost', 0.05), team = cue('One team', 0.25), pounds = cue('pounds', 0.33), other = cue('other team', 0.45);
  const newtons = cue('newtons', 0.55), same = cue('Same numbers', 0.68), dU = cue('Different units', 0.8), dM = cue('Different meaning', 0.9);
  // the ruler snaps taut, then the camera pulls back through its ticks into space
  const snap = f < 14 ? Math.sin((f / 14) * Math.PI * 4) * (1 - f / 14) : 0;
  const pull = tio(f, 10, 100);
  const rulerS = 1 - 0.96 * pull, rulerO = 1 - clamp01((f - 70) / 24);
  const space = clamp01((f - 40) / 40);
  // the probe: along the planned (dotted teal) path, then forking onto its real (amber) path
  const t = f < 90 ? 0 : f < pounds + 20 ? 0.55 * ease((f - 90) / Math.max(1, pounds + 20 - 90)) : 0.55 + 0.45 * inOut((f - pounds - 20) / Math.max(1, newtons + 24 - pounds - 20));
  const fork = clamp01((t - 0.55) / 0.45);
  const pd = bez(t, EARTH, CTRL, GOAL), pr = bez(t, EARTH, CTRL, LOST);
  const k = ease(fork);
  const px = pd[0] + (pr[0] - pd[0]) * k, py = pd[1] + (pr[1] - pd[1]) * k + 18 * k * k;
  const nx = bez(Math.min(1, t + 0.01), EARTH, CTRL, GOAL);
  const ang = (Math.atan2(nx[1] - pd[1], nx[0] - pd[0]) * 180) / Math.PI;
  const dark = clamp01((f - newtons - 26) / 16);
  const tagsIn = tio(f, same - 4, same + 18), clash = f > same + 18 && f < same + 32 ? Math.sin(((f - same - 18) / 14) * Math.PI * 3) * 6 : 0;
  const dim = 1 - 0.65 * clamp01((f - same + 6) / 12);
  const uLit = fin(f, dU, 8);
  return (
    <Frame enter="cut" push={0.015}
      html={
        <>
          <SfxList items={[[2, 'slide', 0.4, 1.3], [12, 'whoosh', 0.35, 0.7], [pounds, 'blip', 0.3, 0.7], [same + 16, 'thud', 0.5], [dU, 'pop', 0.4], [dM, 'pop', 0.4, 0.8]]} />
          <Heads size={66} items={[
            {at: lost, text: '[[1999]]: a $125 million spacecraft, lost'},
            {at: team, text: 'One team: [[pounds]] of force'},
            {at: other, text: 'The other: [[newtons]]'},
            {at: same, text: 'Same numbers.'},
            {at: dU, text: 'Different [[units.]]'},
            {at: dM, text: 'Different [[meaning.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {/* the ruler from Video 1, pulling away */}
          {rulerO > 0 && (
            <g opacity={rulerO} transform={`translate(960 640) scale(${rulerS} ${rulerS * (1 + 0.06 * snap)}) translate(-960 -640)`}>
              <MiniRuler x={360} y={640} w={1200} ticks={20} />
              {[['mm', 420], ['cm', 900], ['m', 1500]].map(([l, x]) => <T key={l as string} x={x as number} y={580} size={44} font={SANS} weight={800}>{l}</T>)}
            </g>
          )}
          <g opacity={space * dim}>
            <Stars o={1} seed="v2mars" />
            {/* Earth */}
            <circle cx={EARTH[0]} cy={EARTH[1]} r={46} fill={TEAL} fillOpacity={0.18} stroke={INK} strokeWidth={LINE} />
            <path d={`M ${EARTH[0] - 30} ${EARTH[1] - 10} q 14 -18 30 -6 q 10 8 24 -2`} fill="none" stroke={INK} strokeWidth={3} />
            {/* Mars with its thin atmosphere */}
            <circle cx={MARS[0]} cy={MARS[1]} r={140} fill={ORANGE} opacity={0.09} />
            <circle cx={MARS[0]} cy={MARS[1]} r={118} fill={ORANGE} opacity={0.08} />
            <circle cx={MARS[0]} cy={MARS[1]} r={95} fill={ORANGE} stroke={INK} strokeWidth={LINE} />
            <ellipse cx={MARS[0] - 25} cy={MARS[1] - 20} rx={26} ry={14} fill={INK} opacity={0.18} />
            <ellipse cx={MARS[0] + 30} cy={MARS[1] + 30} rx={18} ry={10} fill={INK} opacity={0.14} />
            {/* the plan: dotted teal path into a safe orbit */}
            <path d={pathOf(EARTH, CTRL, GOAL, 0, clamp01((f - 60) / 40))} fill="none" stroke={TEAL} strokeWidth={5} strokeDasharray="3 16" strokeLinecap="round" />
            <circle cx={MARS[0]} cy={MARS[1]} r={165} fill="none" stroke={TEAL} strokeWidth={4} strokeDasharray="3 16" strokeLinecap="round" opacity={clamp01((f - 80) / 20) * 0.8} />
            {/* reality: the amber path dips lower, into the atmosphere */}
            {fork > 0 && <path d={pathOf(EARTH, CTRL, LOST, 0.55, t)} fill="none" stroke={AMBER} strokeWidth={6} strokeLinecap="round" />}
            {f >= 90 && <Probe x={px} y={py} ang={ang} dark={dark} />}
          </g>
          {/* same digits, different unit labels: they slide together but don't mesh */}
          {tagsIn > 0 && (
            <g>
              <g transform={`translate(${-420 * (1 - tagsIn) + clash} 0)`}>
                <path d="M 470 780 L 900 780 L 940 840 L 900 900 L 470 900 Q 450 900 450 880 L 450 800 Q 450 780 470 780 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <T x={600} y={862} size={66}>12.6</T>
                <T x={800} y={858} size={40} font={SANS} weight={800} color={uLit > 0 ? ORANGE : INK}>lbf·s</T>
              </g>
              <g transform={`translate(${420 * (1 - tagsIn) - clash} 0)`}>
                <path d="M 1010 780 L 1450 780 Q 1470 780 1470 800 L 1470 880 Q 1470 900 1450 900 L 1010 900 A 60 60 0 0 0 1010 780 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <T x={1170} y={862} size={66}>12.6</T>
                <T x={1360} y={858} size={40} font={SANS} weight={800} color={uLit > 0 ? ORANGE : INK}>N·s</T>
              </g>
              {/* the gap where they fail to fit */}
              <T x={975} y={858} size={64} color={RED} o={fin(f, dM, 8)}>≠</T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 0b. the cell question
export const V2HookQ: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const noise = cue('noise', 0.08), version = cue("Here's your version", 0.2), cell = cue('A cell', 0.26), fit = cue('How many', 0.38);
  const hold = cue('Hold that thought', 0.5), end = cue('By the end', 0.58), kit = cue('whole toolkit', 0.72);
  const chipsAt = [cue('units', 0.76, 0, 1), cue('ratios', 0.8), cue('percentages', 0.84), cue('probability', 0.88), cue('square roots', 0.92)];
  // match cut: the dotted path flattens into a ruler
  const flat = tio(f, 0, 22);
  const a: [number, number] = [EARTH[0] + (260 - EARTH[0]) * flat, EARTH[1] + (640 - EARTH[1]) * flat];
  const c: [number, number] = [CTRL[0] + (960 - CTRL[0]) * flat, CTRL[1] + (640 - CTRL[1]) * flat];
  const b: [number, number] = [GOAL[0] + (1660 - GOAL[0]) * flat, GOAL[1] + (640 - GOAL[1]) * flat];
  const ruler = clamp01((f - 18) / 14);
  // "noise": a bare number, jittering
  const bare = fin(f, noise - 6, 8) * (1 - fin(f, cell, 8));
  const jx = Math.sin(f * 1.7) * 5, jy = Math.cos(f * 2.3) * 4;
  const cellIn = fin(f, cell, 10), span = fin(f, fit, 12);
  const q = fin(f, fit + 8, 8);
  const qPulse = f > fit + 8 && f < fit + 26 ? 1 + 0.18 * Math.sin(((f - fit - 8) / 18) * Math.PI) : 1;
  const dimQ = 1 - 0.55 * clamp01((f - hold) / 12);
  const lift = tio(f, kit - 6, kit + 14);
  const chips = ['Units', 'Ratios', 'Percentages', 'Probability', 'Square roots'];
  const cw = [170, 180, 280, 260, 280];
  let cx0 = 960 - (cw.reduce((s, w) => s + w, 0) + 4 * 26) / 2;
  return (
    <Frame enter="cut"
      html={
        <>
          <SfxList items={[[cell, 'pop', 0.45], [fit + 8, 'blip', 0.4], [hold, 'tap', 0.4], ...chipsAt.map((t) => [t, 'pop', 0.4, 1.1] as [number, 'pop', number, number])]} />
          <Heads size={70} items={[
            {at: noise, text: 'A number without its unit is just [[noise.]]', size: 62},
            {at: version, text: "Here's your version."},
            {at: cell, text: 'A cell: [[20 µm]] across.'},
            {at: fit, text: 'How many fit across [[1 mm]]?'},
            {at: hold, text: 'Hold that thought.'},
            {at: end, text: 'By the end: about [[3 seconds.]]'},
            {at: kit, text: 'Plus the whole [[toolkit.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          <g opacity={dimQ} transform={`translate(0 ${-150 * lift}) translate(960 640) scale(${1 - 0.3 * lift}) translate(-960 -640)`}>
            <path d={pathOf(a, c, b)} fill="none" stroke={ruler > 0.5 ? INK : TEAL} strokeWidth={ruler > 0.5 ? LINE : 5} strokeDasharray={ruler > 0.5 ? undefined : '3 16'} strokeLinecap="round" />
            {ruler > 0 && Array.from({length: 51}).map((_, i) => (
              <line key={i} x1={260 + i * 28} x2={260 + i * 28} y1={640} y2={640 - (i % 10 === 0 ? 34 : i % 5 === 0 ? 24 : 12) * ruler} stroke={INK} strokeWidth={i % 10 === 0 ? 4 : 2.5} />
            ))}
            {/* the bare, meaningless number */}
            {bare > 0 && <T x={960 + jx} y={560 + jy} size={150} o={bare}>20</T>}
            {bare > 0 && [0, 1, 2].map((i) => (
              <path key={i} d={`M ${760 + i * 160} ${420 + Math.sin(f / 3 + i) * 10} q 20 -20 40 0 q 20 20 40 0`} fill="none" stroke={P.muted} strokeWidth={4} opacity={bare * 0.8} />
            ))}
            {/* one 20 µm cell at the left end */}
            {cellIn > 0 && <Cell x={274} y={612} r={14 * tsp(f, cell, cell + 12, 0, 1)} glow={1} />}
            {cellIn > 0 && <UnitTag x={300} y={540} text="20 µm" color={TEAL} o={cellIn} />}
            {/* the 1 mm span */}
            {span > 0 && (
              <g opacity={span}>
                <rect x={260} y={660} width={1400 * ease(span)} height={16} rx={8} fill={ORANGE} opacity={0.85} />
                <T x={960} y={750} size={56}>1 mm</T>
              </g>
            )}
            {q > 0 && <T x={960} y={520} size={130} color={ORANGE} o={q} s={qPulse}>?</T>}
          </g>
          {/* Axo, eyebrows (well, eyes) up */}
          <g opacity={fin(f, version, 10)}>
            <AxoSide x={1650} y={985} scale={0.62} rear={1} arm={-20} dir={-1} />
            {f > fit + 10 && f < hold + 10 && (
              <g transform={`translate(1560 ${770 - 6 * Math.sin(f / 8)})`} opacity={fin(f, fit + 10, 6)}>
                <path d="M -16 -26 Q -16 -44 0 -44 Q 16 -44 16 -30 Q 16 -20 4 -14 L 4 -2" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
                <circle cx={4} cy={12} r={5} fill={INK} />
              </g>
            )}
          </g>
          {/* the toolkit chips */}
          {chips.map((ch, i) => {
            const x = cx0 + cw[i] / 2;
            cx0 += cw[i] + 26;
            const s = tsp(f, chipsAt[i], chipsAt[i] + 12, 0.4, 1), o = fin(f, chipsAt[i], 6);
            if (o <= 0) return null;
            return (
              <g key={ch} transform={`translate(${x} 780) scale(${s})`} opacity={o}>
                <rect x={-cw[i] / 2} y={-38} width={cw[i]} height={76} rx={38} fill={i % 2 ? PAPER : INK} stroke={INK} strokeWidth={4} />
                <text y={12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={i % 2 ? INK : PAPER}>{ch}</text>
              </g>
            );
          })}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1. prefixes on one ruler
const PREFIXES: {e: number; name: string; sym: string}[] = [
  {e: 3, name: 'kilo', sym: 'k'}, {e: 6, name: 'mega', sym: 'M'}, {e: 9, name: 'giga', sym: 'G'},
  {e: -3, name: 'milli', sym: 'm'}, {e: -6, name: 'micro', sym: 'µ'}, {e: -9, name: 'nano', sym: 'n'}, {e: -12, name: 'pico', sym: 'p'},
];
const supDigits = (e: number) => String(e).replace('-', '−');

const Road: React.FC = () => (
  <g>
    <path d="M -120 40 L -40 -60 M 120 40 L 40 -60" stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
    {[0, 1, 2].map((i) => <line key={i} x1={0} x2={0} y1={-50 + i * 34} y2={-36 + i * 34 + i * 4} stroke={INK} strokeWidth={5} strokeLinecap="round" />)}
  </g>
);
const Grain: React.FC = () => (
  <g>
    <path d="M -34 6 Q -38 -26 -6 -32 Q 30 -36 36 -6 Q 40 28 6 32 Q -30 36 -34 6 Z" fill={AMBER} fillOpacity={0.35} stroke={INK} strokeWidth={LINE} />
    {[[-12, -8], [10, 4], [-2, 16], [14, -14]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={INK} opacity={0.5} />)}
  </g>
);
const Bacterium: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <path d={`M 44 0 q 16 ${-10 + Math.sin(f / 4) * 6} 32 0 q 16 ${10 - Math.sin(f / 4) * 6} 32 0`} fill="none" stroke={TEAL} strokeWidth={4} strokeLinecap="round" />
      <rect x={-48} y={-24} width={96} height={48} rx={24} fill={TEAL} fillOpacity={0.22} stroke={TEAL} strokeWidth={5} />
      <circle cx={-10} cy={0} r={9} fill={TEAL} />
    </g>
  );
};
export const Helix: React.FC<{h?: number; w?: number; color?: string}> = ({h = 120, w = 26, color = INK}) => {
  const f = useCurrentFrame();
  const pts = (s: number) => Array.from({length: 25}).map((_, i) => `${i ? 'L' : 'M'} ${Math.sin(i / 4 + f / 12) * w * s} ${-h / 2 + (i * h) / 24}`).join(' ');
  return (
    <g>
      <path d={pts(1)} fill="none" stroke={color} strokeWidth={4} />
      <path d={pts(-1)} fill="none" stroke={ORANGE} strokeWidth={4} />
      {Array.from({length: 7}).map((_, i) => { const y = -h / 2 + (i + 0.5) * (h / 7); const xx = Math.sin((i + 0.5) * (24 / 7) / 4 + f / 12) * w; return <line key={i} x1={-xx} x2={xx} y1={y} y2={y} stroke={color} strokeWidth={2.5} opacity={0.6} />; })}
    </g>
  );
};

export const V2Prefix: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const start = cue('Start with prefixes', 0.02), count = cue('count of tens', 0.15);
  const at: Record<number, number> = {
    3: cue('Kilo', 0.3), 6: cue('Mega', 0.38), 9: cue('Giga', 0.46), [-3]: cue('milli', 0.6), [-6]: cue('Micro', 0.7), [-9]: cue('Nano', 0.78), [-12]: cue('Pico', 0.84),
  };
  const centi = cue('centi', 0.9);
  // camera: follows each prefix along one long ruler (150 px per ten)
  const stops: [number, number][] = [[0, 0], [at[3], 3], [at[6], 6], [at[9], 8], [at[-3], -3], [at[-6], -6], [at[-9], -8.5], [at[-12], -10], [centi, -2]];
  let cam = 0;
  for (let i = 1; i < stops.length; i++) {
    const [t0, v] = stops[i];
    const prev = cam;
    const long = Math.abs(v - prev) > 6;
    cam = f < t0 - 6 ? prev : prev + (v - prev) * inOut((f - t0 + 6) / (long ? 34 : 22));
    if (f < t0 - 6) break;
  }
  const SP = 150, Y = 720;
  const X = (e: number) => 960 + (e - cam) * SP;
  const shown = (e: number) => (e === 0 ? start : at[e]);
  const shrug = f > centi + 8 && f < centi + 40 ? Math.sin(((f - centi - 8) / 32) * Math.PI * 2) : 0;
  const icons: [number, React.ReactNode, string][] = [
    [3, <Road key="r" />, '1 km of road'], [-3, <Grain key="g" />, 'a grain of sand'], [-6, <Bacterium key="b" />, 'a bacterium'], [-9, <Helix key="h" />, 'DNA, 2 nm wide'],
  ];
  return (
    <Frame
      html={
        <>
          <SfxList items={[...Object.values(at).map((t) => [t, 'pop', 0.4, 1.05] as [number, 'pop', number, number]), [centi, 'boing', 0.35, 1.2],
            ...stops.slice(1).map(([t]) => [t - 6, 'slide', 0.16, 1.4] as [number, 'slide', number, number])]} />
          <Heads size={74} items={[
            {at: start, text: 'Prefixes'},
            {at: count, text: 'Each one is a [[count of tens]]'},
            {at: at[3], text: 'kilo = 10^{3} = [[1,000]]'},
            {at: at[6], text: 'mega = 10^{6} = [[a million]]'},
            {at: at[9], text: 'giga = 10^{9} = [[a billion]]'},
            {at: at[-3], text: 'milli = 10^{−3} = [[a thousandth]]'},
            {at: at[-6], text: 'micro = 10^{−6} = [[a millionth]]'},
            {at: at[-9], text: 'nano = 10^{−9}'},
            {at: at[-12], text: 'pico = 10^{−12}'},
            {at: centi, text: 'centi = 10^{−2}: the [[odd one]]'},
          ]} />
        </>
      }
      svg={
        <g opacity={fin(f, 0, 10)}>
          <line x1={0} x2={1920} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
          {Array.from({length: 22}).map((_, i) => {
            const e = i - 12, x = X(e);
            if (x < -100 || x > 2020) return null;
            const major = e % 3 === 0;
            return (
              <g key={e}>
                <line x1={x} x2={x} y1={Y} y2={Y - (major ? 36 : 18)} stroke={INK} strokeWidth={major ? 5 : 3} />
                <T x={x} y={Y + 52} size={major ? 34 : 26} color={major ? INK : P.muted} font={DISPLAY}>10<Sp>{supDigits(e)}</Sp></T>
              </g>
            );
          })}
          {/* scenery that changes with scale */}
          <g opacity={fin(f, 4, 12)}>
            <AxoSide x={X(0) - 150} y={Y - 4} scale={0.5} rear={1} arm={-30 + 60 * shrug} />
            <text x={X(0) - 70} y={Y - 200} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={P.muted}>Axo, about 1 m (well…)</text>
          </g>
          {icons.map(([e, el, label]) => (
            <g key={e} opacity={fin(f, shown(e) - 10, 10)}>
              <g transform={`translate(${X(e)} ${Y - 230})`}>{el}</g>
              <text x={X(e)} y={Y - 320} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={P.muted}>{label}</text>
            </g>
          ))}
          {/* prefix names drop in with a spring */}
          {PREFIXES.map(({e, name, sym}) => {
            const t0 = at[e], o = fin(f, t0, 6);
            if (o <= 0) return null;
            const dy = tsp(f, t0, t0 + 14, -60, 0);
            const col = e > 0 ? ORANGE : TEAL;
            return (
              <g key={name} opacity={o} transform={`translate(0 ${dy})`}>
                <T x={X(e)} y={Y + 140} size={62} color={col}>{name}</T>
                <T x={X(e)} y={Y + 190} size={30} font={SANS} weight={800} color={P.muted}>{sym}</T>
              </g>
            );
          })}
          {/* arcs between neighbours: always ×1000 */}
          {[[0, 3], [3, 6], [6, 9], [-3, 0], [-6, -3], [-9, -6], [-12, -9]].map(([a, b]) => {
            const later = Math.max(a === 0 ? 0 : at[a], b === 0 ? 0 : at[b]);
            const o = fin(f, later + 14, 10);
            if (o <= 0) return null;
            const x1 = X(a), x2 = X(b), mid = (x1 + x2) / 2;
            return (
              <g key={`${a}${b}`} opacity={o}>
                <path d={`M ${x1} ${Y - 46} Q ${mid} ${Y - 120} ${x2} ${Y - 46}`} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="6 8" />
                <rect x={mid - 62} y={Y - 106} width={124} height={34} rx={17} fill={PAPER} />
                <text x={mid} y={Y - 80} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>×1000</text>
              </g>
            );
          })}
          {/* centi: a small, wobbly tick that breaks the pattern */}
          {f >= centi && (
            <g transform={`rotate(${wobble(f, centi, 10, 30)} ${X(-2)} ${Y})`} opacity={fin(f, centi, 6)}>
              <line x1={X(-2)} x2={X(-2)} y1={Y} y2={Y - 30} stroke={RED} strokeWidth={5} />
              <line x1={X(-2)} x2={X(-2) + 40} y1={Y + 12} y2={Y + 230} stroke={RED} strokeWidth={3} strokeDasharray="5 7" />
              <T x={X(-2) + 70} y={Y + 280} size={54} color={RED}>centi</T>
              <T x={X(-2) + 70} y={Y + 322} size={28} font={SANS} weight={800} color={P.muted}>c = 10⁻² (not a step of 3)</T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1b. one ruler, and the answer
export const V2PrefixSolve: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const pattern = cue('Notice the pattern', 0.02), step = cue('step by three', 0.08), table = cue("don't memorize", 0.18), ruler = cue('one ruler', 0.25);
  const question = cue('Now your question', 0.32), mm = cue('One millimeter', 0.38), um = cue('One micrometer', 0.46), apart = cue('Three ticks apart', 0.54);
  const twenty = cue('twenty per cell', 0.7), fifty = cue('fifty cells', 0.8), three = cue('Three seconds', 0.9);
  // camera: whole ruler -> zoom on milli..micro
  const zoom = tio(f, question, question + 30);
  const SP = 76 + (300 - 76) * zoom, C = -1.5 + (-4.5 + 1.5) * zoom, Y = 680;
  const X = (e: number) => 960 + (e - C) * SP;
  const rulerO = 1 - clamp01((f - twenty + 4) / 12);
  const bar = fin(f, twenty - 2, 12);
  const stampAt = twenty + 10;
  const n = Math.max(0, Math.min(50, Math.floor((f - stampAt) / 0.6)));
  const land = fifty;
  const big = tsp(f, land, land + 14, 0.5, 1);
  const tableO = fin(f, table, 8) * (1 - fin(f, ruler, 10));
  const glow = f > ruler && f < ruler + 24 ? Math.sin(((f - ruler) / 24) * Math.PI) : 0;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[step, 'tick', 0.3], [table, 'swish', 0.3], [ruler, 'chime', 0.3], [question, 'whoosh', 0.3, 1.2], [mm, 'pop', 0.4], [um, 'pop', 0.4, 1.1],
            [apart, 'slide', 0.35], [stampAt, 'scribble', 0.3, 1.6], [land, 'clack', 0.7], [land + 2, 'ding', 0.35], [three, 'tick', 0.4]]} />
          <Heads size={74} items={[
            {at: pattern, text: 'Notice the pattern.'},
            {at: step, text: 'The big ones step by [[3 tens]]'},
            {at: table, text: "Don't memorize a table."},
            {at: ruler, text: 'Memorize [[one ruler.]]'},
            {at: question, text: 'Now your question.'},
            {at: mm, text: '1 mm = 10^{−3} m'},
            {at: um, text: '1 µm = 10^{−6} m'},
            {at: apart, text: '3 ticks apart: [[×1000]]'},
            {at: twenty, text: '1000 µm ÷ 20 µm'},
            {at: fifty, text: '= [[50 cells.]]'},
            {at: three, text: 'Three seconds.'},
          ]} />
        </>
      }
      svg={
        <g>
          {rulerO > 0 && (
            <g opacity={rulerO}>
              <line x1={0} x2={1920} y1={Y} y2={Y} stroke={glow > 0 ? ORANGE : INK} strokeWidth={LINE + 4 * glow} />
              {Array.from({length: 22}).map((_, i) => {
                const e = i - 12, x = X(e);
                if (x < -60 || x > 1980) return null;
                const major = e % 3 === 0;
                const p = PREFIXES.find((q) => q.e === e);
                const lit = (e === -3 && f >= mm) || (e === -6 && f >= um);
                return (
                  <g key={e}>
                    <line x1={x} x2={x} y1={Y} y2={Y - (major ? 34 : 16)} stroke={lit ? TEAL : INK} strokeWidth={major ? 5 : 3} />
                    {(major || zoom > 0.5) && <T x={x} y={Y + 46} size={major ? 30 : 24} color={major ? INK : P.muted}>10<Sp>{supDigits(e)}</Sp></T>}
                    {p && <T x={x} y={Y + 100 + 20 * zoom} size={34 + 20 * zoom} color={lit ? TEAL : e > 0 ? ORANGE : TEAL} o={lit || zoom < 0.5 ? 1 : 0.35}>{zoom > 0.5 ? `1 ${p.sym}m` : p.name}</T>}
                  </g>
                );
              })}
              {/* the ×1000 arcs, stepping by three */}
              {zoom < 1 && [-12, -9, -6, -3, 0, 3, 6].map((a, i) => {
                const o = fin(f, step + i * 5, 8) * (1 - zoom);
                const x1 = X(a), x2 = X(a + 3), mid = (x1 + x2) / 2;
                return (
                  <g key={a} opacity={o}>
                    <path d={`M ${x1} ${Y - 44} Q ${mid} ${Y - 110} ${x2} ${Y - 44}`} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="6 8" />
                    <text x={mid} y={Y - 84} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={22} fill={INK}>×1000</text>
                  </g>
                );
              })}
              {/* teal bracket: 1 mm to 1 µm is three ticks, ×1000 */}
              {f >= apart && (
                <g opacity={fin(f, apart, 10)}>
                  <path d={`M ${X(-6)} ${Y - 70} L ${X(-6)} ${Y - 100} L ${X(-6) + (X(-3) - X(-6)) * ease(fin(f, apart, 16))} ${Y - 100}`} fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
                  {f > apart + 14 && <line x1={X(-3)} x2={X(-3)} y1={Y - 100} y2={Y - 70} stroke={TEAL} strokeWidth={6} strokeLinecap="round" />}
                  <rect x={(X(-3) + X(-6)) / 2 - 90} y={Y - 160} width={180} height={52} rx={26} fill={TEAL} opacity={fin(f, apart + 10, 8)} />
                  <text x={(X(-3) + X(-6)) / 2} y={Y - 122} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={PAPER} opacity={fin(f, apart + 10, 8)}>×1000</text>
                </g>
              )}
            </g>
          )}
          {/* a forgettable table, thrown away */}
          {tableO > 0 && (
            <g opacity={tableO} transform={`translate(1500 ${420 - 60 * fin(f, ruler, 10)}) rotate(${4 + 20 * fin(f, ruler, 10)}) scale(${1 - 0.4 * fin(f, ruler, 10)})`}>
              <rect x={-160} y={-120} width={320} height={240} rx={10} fill="#fffdf8" stroke={INK} strokeWidth={4} />
              {['kilo  10³', 'mega  10⁶', 'milli  10⁻³', 'micro  10⁻⁶', 'nano  10⁻⁹'].map((r, i) => (
                <text key={r} x={-130} y={-78 + i * 42} fontFamily={SANS} fontWeight={600} fontSize={26} fill={P.muted}>{r}</text>
              ))}
            </g>
          )}
          {/* 1 mm span, stamped with 20 µm cells */}
          {bar > 0 && (
            <g opacity={bar}>
              <rect x={260} y={660} width={1400} height={16} rx={8} fill={ORANGE} />
              <T x={960} y={760} size={52}>1 mm = 1000 µm</T>
              {Array.from({length: n}).map((_, i) => <Cell key={i} x={274 + i * 28} y={632} r={13} glow={i === n - 1 ? 1 : 0} />)}
              <g transform={`translate(960 540) scale(${f >= land ? big : 1})`}>
                <T x={0} y={0} size={f >= land ? 150 : 110} color={f >= land ? TEAL : INK}>{n}</T>
              </g>
              {f >= land && <Burst x={960} y={500} t={clamp01((f - land) / 18)} color={TEAL} r={110} />}
            </g>
          )}
          {/* Axo relaxes: a wink once the 50 lands */}
          <AxoSide x={1700} y={990} scale={0.55} rear={1} dir={-1} arm={f >= land ? -60 : -10} wink={f >= land + 4} />
        </g>
      }
    />
  );
};

export const v2a = {V2Mars, V2HookQ, V2Prefix, V2PrefixSolve};
