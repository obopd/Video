// Video 1, part B: logarithms as counting tens, the riddle solved, the natural log.
import React from 'react';
import {useCurrentFrame, random} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, KeySeq, KineticLine, SfxList, useCue} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, hopState, AxoSquash, Caption, SparkField,
} from './common';

type S = [number, Parameters<typeof SfxList>[0]['items'][number][1], number?, number?];

const Tick: React.FC<{x: number; y: number; h?: number; label?: string; sub?: string; color?: string; o?: number; size?: number; glow?: number}> = ({
  x, y, h = 40, label, sub, color = INK, o = 1, size = 46, glow = 0,
}) => (
  <g opacity={o}>
    {glow > 0 && <circle cx={x} cy={y} r={34} fill={TEAL} opacity={0.22 * glow} />}
    <line x1={x} x2={x} y1={y - h} y2={y + h} stroke={glow > 0.5 ? TEAL : color} strokeWidth={glow > 0.5 ? 7 : 5} strokeLinecap="round" />
    {label && <text x={x} y={y + h + size + 6} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={size} fill={color}>{label}</text>}
    {sub && <text x={x} y={y - h - 18} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={size * 0.8} fill={glow > 0.5 ? TEAL : P.muted}>{sub}</text>}
  </g>
);

// --------------------------------------------------------------------- the lying ruler -> the log ruler
export const V1LogRuler: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const forget = cue('Forget the formula', 0.06), asks = cue('how many tens', 0.14), step1 = cue('One to ten', 0.42);
  const two = cue('To a hundred', 0.52), three = cue('To a thousand', 0.6), l1000 = cue('log of a thousand', 0.68), minus = cue('minus two', 0.92);
  const other = cue('other way', 0.76);
  const Y = 600, x0 = 160, x1 = 1760;
  const M = tio(f, 4, 4 + 4 * fps, 10, 1000);
  const linX = (v: number) => x0 + (v / M) * (x1 - x0);
  const k = clamp01(tsp(f, step1 - 14, step1 + 10));
  const lx = (v: number) => 760 + Math.log10(v) * 330;
  const X = (v: number) => (k <= 0 ? linX(v) : linX(v) * (1 - k) + lx(v) * k);
  const ends = 4 + 4 * fps;
  const dt = f > ends - 40 && f < ends ? ((f - (ends - 40)) % 20 < 10 ? -1 : 1) : 1;
  const glowAt = [step1, step1, two, three];
  const small = [2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90, 200, 300, 400, 500, 600, 700, 800, 900];
  const left = fin(f, minus - 8, 14);
  return (
    <Frame tag="LOGARITHMS"
      html={
        <>
          <SfxList items={[[4, 'whoosh', 0.35, 0.6], [ends - 30, 'boing', 0.35, 1.4], [step1 - 14, 'boing', 0.5], [step1, 'pop', 0.5], [two, 'pop', 0.5, 1.12],
            [three, 'pop', 0.5, 1.25], [minus - 8, 'swish', 0.4]]} />
          <KeySeq x={90} y={110} w={1700} size={80} items={[
            {at: forget, text: 'Forget the formula.'},
            {at: asks, text: 'A log asks: [[how many tens?]]'},
            {at: l1000, text: 'log 1000 = [[3]]'},
            {at: minus, text: 'log 0.01 = [[−2]]'},
          ]} />
          {k < 0.2 && f > ends - 50 && <Caption y={860} o={fin(f, ends - 50)}>1 to 10 is a sliver?</Caption>}
        </>
      }
      svg={
        <g>
          <line x1={k > 0.5 ? 60 : x0} x2={x1} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
          {k < 0.98 && Array.from({length: 11}).map((_, i) => {
            const x = linX(i);
            const crowd = (x1 - x0) / M;
            return <Tick key={`l${i}`} x={x} y={Y} h={i % 5 === 0 ? 30 : 18} label={crowd > 46 || i === 10 ? String(i) : undefined} size={36} o={1 - k} />;
          })}
          {k < 0.98 && [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((v) => linX(v) < x1 + 1 && (
            <Tick key={`h${v}`} x={linX(v)} y={Y} h={24} label={String(v)} size={34} o={(1 - k) * clamp01((M - v * 0.6) / (v * 0.4))} />
          ))}
          {k > 0 && small.map((v) => <line key={`s${v}`} x1={lx(v)} x2={lx(v)} y1={Y - 14} y2={Y + 14} stroke={INK} strokeWidth={3} opacity={0.45 * k} />)}
          {k > 0 && [1, 10, 100, 1000].map((v, i) => (
            <Tick key={`m${v}`} x={X(v)} y={Y} h={44} label={String(v)} sub={String(i)} glow={fin(f, glowAt[i], 6)} o={k} />
          ))}
          {left > 0 && [0.1, 0.01].map((v, i) => (
            <Tick key={`n${v}`} x={lx(v) - (1 - ease(left)) * 300} y={Y} h={44} label={String(v)} sub={`−${i + 1}`} o={left} glow={fin(f, minus, 6)} />
          ))}
          <AxoSide x={X(5) - 40} y={Y - 4} scale={0.34} dir={dt as 1 | -1} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- measuring log 2 and log 3 by hopping
export const V1Hops: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const q = cue('log of two', 0.04), measure = cue('measure it', 0.1), d2 = cue('doubling Two', 0.16), d4 = cue('Four', 0.2), d8 = cue('Eight', 0.24);
  const almost = cue('almost at ten', 0.3), third = cue('third of a step', 0.4), l2 = cue('about 0.3', 0.46);
  const tri = cue('Same trick', 0.52), t3 = cue('once three', 0.58), t9 = cue('Twice nine', 0.64), half = cue('half a step', 0.78), l3 = cue('0.48', 0.9);
  const Y = 640, X = (v: number) => 260 + Math.log10(v) * 1400, L = 1400;
  const phase2 = f >= tri - 10;
  const hops = phase2 ? [[t3 - 6, 1, 3], [t9 - 6, 3, 9]] : [[d2 - 6, 1, 2], [d4 - 6, 2, 4], [d8 - 6, 4, 8]];
  let st = {x: X(1), y: 0, sx: 1, sy: 1, air: false};
  for (const [at, a, b] of hops) if (f >= at) st = hopState(f, at, 16, X(a), X(b), 150);
  if (phase2 && f < hops[0][0]) st = {...st, x: tio(f, tri - 10, tri + 6, X(8), X(1)), y: 0};
  const unit = phase2 ? Math.log10(3) : Math.log10(2);
  const landed = hops.filter(([at]) => f >= at + 28).length;
  const stack = tio(f, (phase2 ? half : third) - 4, (phase2 ? half : third) + 18);
  const gapPulse = !phase2 && f >= almost ? 0.5 + 0.5 * Math.sin((f - almost) / 3) * Math.exp(-(f - almost) / 40) : 0;
  const lbl = phase2 ? l3 : l2;
  return (
    <Frame tag="LOGARITHMS"
      html={
        <>
          <SfxList items={[...hops.flatMap(([at], i) => [[at + 5, 'hop', 0.55, 1 + i * 0.1], [at + 21, 'tap', 0.6]] as S[]), [almost, 'boing', 0.3, 1.6],
            [third, 'swish', 0.4], [l2, 'ding', 0.4], [tri - 10, 'slide', 0.35], [half, 'swish', 0.4], [l3, 'ding', 0.4, 1.1]]} />
          <KeySeq x={90} y={110} w={1700} size={80} items={[
            {at: q, text: 'log 2 = [[?]]'},
            {at: measure, text: 'Measure it: keep [[doubling.]]'},
            {at: third, text: '3 doublings ≈ 1 step', sub: 'so 1 doubling ≈ a third of a step'},
            {at: l2, text: 'log 2 ≈ [[0.3]]', size: 100},
            {at: tri, text: 'Same trick: [[tripling.]]'},
            {at: half, text: '2 triplings ≈ 1 step', sub: 'so 1 tripling ≈ half a step'},
            {at: l3, text: 'log 3 ≈ [[0.48]]', size: 100},
          ]} />
        </>
      }
      svg={
        <g>
          <line x1={X(1) - 60} x2={X(10) + 60} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <Tick key={v} x={X(v)} y={Y} h={v === 1 || v === 10 ? 40 : 22} label={String(v)} size={v === 1 || v === 10 ? 46 : 34}
                  o={v === 1 || v === 10 || v === 2 || v === 4 || v === 8 || v === 3 || v === 9 ? 1 : 0.35} />
          ))}
          {/* measuring bars copying each hop */}
          {Array.from({length: landed}).map((_, i) => {
            const a = X(1) + i * unit * L, b = a + unit * L;
            const yb = Y + 150 - (Y + 150 - (Y + 230)) * 0;
            const stackY = Y + 210;
            const y = yb + (stackY - yb) * stack;
            return (
              <g key={i} opacity={fin(f, hops[i][0] + 26, 6)}>
                <rect x={a + 4} y={y - 10} width={b - a - 8} height={20} rx={10} fill={i % 2 ? TEAL : '#7fd6cb'} />
              </g>
            );
          })}
          {/* one full step bracket and the 1/3 or 1/2 marker */}
          {stack > 0 && (
            <g opacity={stack}>
              <path d={`M ${X(1)} ${Y + 260} v 16 H ${X(10)} v -16`} fill="none" stroke={INK} strokeWidth={3} />
              <text x={(X(1) + X(10)) / 2} y={Y + 320} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={P.muted} letterSpacing={2}>ONE FULL STEP (×10)</text>
              <line x1={X(1) + L * (phase2 ? 0.5 : 1 / 3)} x2={X(1) + L * (phase2 ? 0.5 : 1 / 3)} y1={Y + 170} y2={Y + 250} stroke={ORANGE} strokeWidth={4} strokeDasharray="8 8" />
            </g>
          )}
          {f >= lbl && (
            <text x={X(1) + (unit * L) / 2} y={Y - 120} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={56} fill={TEAL} opacity={fin(f, lbl)}>
              {phase2 ? '0.48' : '0.3'}
            </text>
          )}
          {gapPulse > 0 && (
            <g opacity={gapPulse}>
              <path d={`M ${X(8) + 10} ${Y - 70} Q ${(X(8) + X(10)) / 2} ${Y - 110} ${X(10) - 10} ${Y - 70}`} stroke={ORANGE} strokeWidth={5} fill="none" />
              <text x={(X(8) + X(10)) / 2} y={Y - 124} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={ORANGE}>almost</text>
            </g>
          )}
          <AxoSquash x={st.x - 30} y={Y - 4 + st.y} scale={0.36} sx={st.sx} sy={st.sy} rear={st.air ? 0.3 : 0} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- everything else is steps; the slide rule
export const V1SlideRule: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const steps = cue('steps added', 0.02), c4 = cue('Four is', 0.08), c6 = cue('Six is', 0.15), c8 = cue('Eight is', 0.24), c5 = cue('Five is', 0.31);
  const memo = cue('Memorize', 0.4), notice = cue('Notice', 0.48), slide = cue('Slide one ruler', 0.56), rules = cue('slide rules', 0.75);
  const two3 = cue('Two times three', 0.86), read = cue('read six', 0.93);
  const Y = 470, X = (v: number) => 260 + Math.log10(v) * 1400;
  const lands: [number, number][] = [[4, c4], [6, c6], [8, c8], [5, c5]];
  const slideT = tio(f, slide, slide + Math.round(1.2 * fps));
  const settle = f > slide + 1.2 * fps ? Math.sin((f - slide - 1.2 * fps) / 3) * 8 * Math.exp(-(f - slide - 1.2 * fps) / 8) : 0;
  const off = (X(2) - X(1)) * slideT + settle;
  const arrows = fin(f, two3, 12);
  const lower = f >= slide - 6;
  return (
    <Frame tag="LOGARITHMS"
      html={
        <>
          <SfxList items={[...lands.map(([, at], i) => [at + 4, 'pop', 0.55, 1 + i * 0.08] as S), [memo, 'chime', 0.35], [slide, 'slide', 0.5], [slide + 1.2 * fps, 'clack', 0.9],
            [two3, 'swish', 0.4], [read, 'ding', 0.5]]} />
          <KeySeq x={90} y={110} w={1740} size={78} items={[
            {at: steps, text: 'Everything else is [[steps added.]]'},
            {at: c4, text: 'log 4 = 0.3 + 0.3 = [[0.6]]'},
            {at: c6, text: 'log 6 = 0.3 + 0.48 = [[0.78]]'},
            {at: c8, text: 'log 8 = 3 × 0.3 = [[0.9]]'},
            {at: c5, text: 'log 5 = 1 − 0.3 = [[0.7]]'},
            {at: memo, text: 'Memorize [[two]] numbers.'},
            {at: notice, text: 'Multiplying → [[adding steps]]'},
            {at: rules, text: 'That’s a [[slide rule.]]'},
            {at: two3, text: '2 × 3: slide, read [[6]]'},
          ]} />
          {f >= read && <Caption y={940} o={fin(f, read)} size={40} color={INK}>Multiply = add steps</Caption>}
        </>
      }
      svg={
        <g>
          <line x1={X(1) - 60} x2={X(10) + 60} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
            const land = lands.find(([n]) => n === v);
            const shown = !land || f >= land[1];
            const vals: Record<number, string> = {2: '0.3', 3: '0.48', 4: '0.6', 5: '0.7', 6: '0.78', 8: '0.9'};
            const isNew = land && f >= land[1] && f < land[1] + 24;
            return (
              <g key={v}>
                <Tick x={X(v)} y={Y} h={v === 1 || v === 10 ? 40 : 26} label={String(v)} size={42} o={v === 7 || v === 9 ? 0.3 : 1}
                      glow={(v === 6 && f >= read ? 1 : 0) || (isNew ? 1 - (f - land![1]) / 24 : 0)} />
                {vals[v] && shown && (
                  <text x={X(v)} y={Y - 64} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={34}
                        fill={v === 2 || v === 3 ? TEAL : ORANGE} transform={`translate(0 ${land ? -16 * (1 - tsp(f, land[1], land[1] + 12)) : 0})`}
                        opacity={land ? fin(f, land[1], 6) : 1}>{vals[v]}</text>
                )}
              </g>
            );
          })}
          {/* the second ruler slides along the first */}
          {lower && (
            <g opacity={fin(f, slide - 6, 10)} transform={`translate(${off} 0)`}>
              <line x1={X(1) - 60} x2={X(10) + 60} y1={Y + 230} y2={Y + 230} stroke={INK} strokeWidth={LINE} />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <Tick key={v} x={X(v)} y={Y + 230} h={v === 1 || v === 10 ? 34 : 20} label={String(v)} size={36} o={X(v) + off < 1900 ? (v === 1 || v === 3 ? 1 : 0.4) : 0} />
              ))}
            </g>
          )}
          {arrows > 0 && (
            <g opacity={arrows}>
              <line x1={X(1)} x2={X(1) + (X(2) - X(1)) * arrows} y1={Y + 110} y2={Y + 110} stroke={TEAL} strokeWidth={10} strokeLinecap="round" />
              <line x1={X(2)} x2={X(2) + (X(6) - X(2)) * clamp01((f - two3 - 10) / 12)} y1={Y + 130} y2={Y + 130} stroke={ORANGE} strokeWidth={10} strokeLinecap="round" />
              <text x={(X(1) + X(2)) / 2} y={Y + 96} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={30} fill={TEAL}>0.3</text>
              <text x={(X(2) + X(6)) / 2} y={Y + 170} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={30} fill={ORANGE}>0.48</text>
            </g>
          )}
          <AxoSide x={180} y={1000} scale={0.45} rear={f >= read ? 1 : 0} arm={-50} wink={f > read + 6 && f < read + 22} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- the riddle, solved on the ruler
export const V1pH: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const back = cue('Back to the riddle', 0.02), idea = cue('log idea', 0.07), five = cue('five steps down', 0.16), ours = cue('Ours is', 0.24);
  const bigger = cue('three times bigger', 0.3), under = cue('bit under five', 0.38), costs = cue('costs us', 0.45), exact = cue('exact answer', 0.55);
  const sanity = cue('Sanity check', 0.62), halfway = cue('roughly halfway', 0.76), ten = cue('Ten seconds', 0.92);
  const Y = 640, x0 = 360, x1 = 1560, X = (k: number) => x0 + Math.log10(k) * (x1 - x0);
  const glide = tio(f, ours, ours + 20);
  const slideT = tio(f, costs, costs + Math.round(1.2 * fps));
  const mx = X(1) + (X(3) - X(1)) * slideT;
  const pH = 5 - 0.477 * slideT;
  const nod = f > exact && f < exact + 24 ? Math.sin(((f - exact) / 24) * Math.PI * 2) * 6 : 0;
  const stamp = f >= ten ? tsp(f, ten, ten + 8, 2, 1) : 0;
  return (
    <Frame tag="THE RIDDLE, SOLVED"
      html={
        <>
          <SfxList items={[[ours, 'swish', 0.45], [ours + 20, 'fizz', 0.6], [costs, 'rise', 0.5, 1.2], [costs + 1.2 * fps, 'clack', 0.6], [exact, 'ding', 0.45],
            [halfway, 'pop', 0.4], [ten, 'thud', 0.8], [ten + 4, 'chime', 0.4]]} />
          <KeySeq x={90} y={110} w={1300} size={74} items={[
            {at: back, text: 'Back to the riddle.'},
            {at: idea, text: 'pH = ÷10 steps [[down]] from 1'},
            {at: five, text: '10^{−5} → pH [[5]]'},
            {at: bigger, text: '3× more acid → [[fewer]] steps'},
            {at: costs, text: 'The 3 costs [[0.48]]'},
            {at: exact, text: '5 − 0.48 = [[4.52]]'},
            {at: sanity, text: 'Sanity check.'},
            {at: ten, text: '[[10 seconds.]] No calculator.'},
          ]} />
          <div style={{position: 'absolute', right: 90, top: 120, opacity: fin(f, idea), fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, color: P.muted}}>pH = −log [H⁺]</div>
          {f >= five && (
            <div style={{position: 'absolute', left: mx - 150, width: 300, top: Y - 230, textAlign: 'center', opacity: fin(f, five)}}>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: P.muted}}>pH</div>
              <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: slideT > 0 ? ORANGE : INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{pH.toFixed(2)}</div>
            </div>
          )}
          {f >= ours - 4 && glide < 1 && (
            <div style={{position: 'absolute', left: 820, top: 240 + glide * 380, opacity: 1 - glide * 0.9, fontFamily: DISPLAY, fontWeight: 700, fontSize: 70 - glide * 30, color: INK}}>3 × 10⁻⁵</div>
          )}
        </>
      }
      svg={
        <g>
          {/* the beaker, with the ruler on its back wall */}
          <path d="M 260 300 L 260 960 Q 260 1000 300 1000 L 1620 1000 Q 1660 1000 1660 960 L 1660 300" fill="none" stroke={INK} strokeWidth={LINE} opacity={0.5} />
          {f >= ours + 14 && <SparkField n={20} x={300} y={760} w={1320} h={210} seed="v1ph" drift={f * 0.6} r={13} o={fin(f, ours + 14, 10)} />}
          {f >= five - 6 && (
            <g opacity={fin(f, five - 6, 10)}>
              <line x1={x0 - 40} x2={x1 + 40} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
                <line key={k} x1={X(k)} x2={X(k)} y1={Y - (k === 1 || k === 10 ? 40 : 18)} y2={Y + (k === 1 || k === 10 ? 40 : 18)}
                      stroke={k === 3 && f >= halfway ? ORANGE : INK} strokeWidth={k === 1 || k === 10 ? 6 : 3} opacity={k === 1 || k === 10 || k === 3 ? 1 : 0.4} />
              ))}
              <text x={X(1)} y={Y + 100} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={46} fill={INK}>10⁻⁵</text>
              <text x={X(10)} y={Y + 100} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={46} fill={INK}>10⁻⁴</text>
              <text x={X(3)} y={Y + 90} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={32} fill={P.muted}>3 × 10⁻⁵</text>
              <text x={X(1)} y={Y - 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={P.muted}>pH 5</text>
              <text x={X(10)} y={Y - 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={P.muted}>pH 4</text>
              {/* marker */}
              <path d={`M ${mx} ${Y - 8} l -22 -34 h 44 Z`} fill={ORANGE} />
              {f >= halfway && <path d={`M ${X(1)} ${Y + 140} v 14 H ${X(10)} v -14 M ${(X(1) + X(10)) / 2} ${Y + 154} v 16`} fill="none" stroke={INK} strokeWidth={3} opacity={fin(f, halfway)} />}
              {f >= halfway && <text x={(X(1) + X(10)) / 2} y={Y + 210} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={P.muted} opacity={fin(f, halfway)}>roughly halfway</text>}
            </g>
          )}
          {stamp > 0 && (
            <g transform={`translate(1660 820) rotate(-10) scale(${stamp})`} opacity={Math.min(1, 2 - stamp + 0.01)}>
              <rect x={-110} y={-56} width={220} height={112} rx={20} fill="none" stroke={TEAL} strokeWidth={8} />
              <text y={22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={66} fill={TEAL}>10 s</text>
            </g>
          )}
          <g transform={`rotate(${nod} 180 1000)`}>
            <AxoSide x={150} y={1000} scale={0.5} rear={f > exact - 6 && f < exact + 40 ? 1 : 0} arm={-30} />
          </g>
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- each pH step = 10x acid (flood)
export const V1Flood: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = useCue(props);
  const ten = cue('ten times', 0.25), hund = cue('hundred', 0.75);
  const n = f < ten ? 24 : f < hund ? 24 + Math.floor(216 * clamp01((f - ten) / 20)) : 240 + Math.floor(1960 * clamp01((f - hund) / 24));
  const z = 1.25 - 0.4 * inOut(f / D);
  const label = f < ten ? 'pH 5' : f < hund ? 'pH 4' : 'pH 3';
  return (
    <Frame tag="pH" push={0}
      html={
        <>
          <SfxList items={[[ten, 'fizz', 0.6], [hund, 'fizz', 0.9], [hund + 4, 'whoosh', 0.4]]} />
          <KeySeq x={0} y={140} w={1920} align="center" size={84} items={[
            {at: 0, text: 'Each pH step = [[10×]] the acid'},
            {at: hund, text: 'pH 3 vs pH 5 = [[100×]]'},
          ]} />
          <div style={{position: 'absolute', left: 0, width: 1920, top: 880, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 90, color: INK}}>{label}</div>
        </>
      }
      svg={
        <g transform={`translate(960 600) scale(${z}) translate(-960 -600)`}>
          {Array.from({length: n}).map((_, i) => {
            const d = 0.4 + random(`fl${i}`) * 0.6;
            const x = 200 + random(`fx${i}`) * 1520 + Math.sin(f / 20 + i) * 6 * d;
            const y = 300 + random(`fy${i}`) * 540 + Math.cos(f / 25 + i) * 6 * d;
            return <circle key={i} cx={x} cy={y} r={(n > 400 ? 7 : 12) * d} fill={ORANGE} opacity={0.5 + 0.5 * d} />;
          })}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- natural log: smaller hops
export const V1Ln: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const meet = cue('natural log', 0.03), e = cue('about 2.7', 0.15), smaller = cue('Smaller steps', 0.26), reach = cue('2.3 to reach', 0.38);
  const rule = cue('That gives the rule', 0.48), ln2 = cue('0.69', 0.75), half = cue('half-life', 0.88);
  const x0 = 260, L = 1400, Yt = 440, Yb = 720;
  const s = L / 2.302585;
  const h1 = smaller, h2 = smaller + 20, h3 = smaller + 40;
  let st = {x: x0, y: 0, sx: 1, sy: 1, air: false};
  if (f >= h1) st = hopState(f, h1, 12, x0, x0 + s, 110);
  if (f >= h2) st = hopState(f, h2, 12, x0 + s, x0 + 2 * s, 110);
  if (f >= h3) st = hopState(f, h3, 8, x0 + 2 * s, x0 + L, 60);
  const count = f < h1 + 17 ? '0' : f < h2 + 17 ? '1' : f < h3 + 13 ? '2' : '2.3';
  const lit = fin(f, h3 + 13, 10);
  return (
    <Frame tag="NATURAL LOG"
      html={
        <>
          <SfxList items={[[h1 + 5, 'hop', 0.5, 1.2], [h2 + 5, 'hop', 0.5, 1.3], [h3 + 5, 'hop', 0.4, 1.5], [h3 + 13, 'ding', 0.5], [rule, 'swish', 0.4], [ln2, 'pop', 0.5]]} />
          <KeySeq x={90} y={110} w={1740} size={80} items={[
            {at: meet, text: 'ln: the [[natural]] log'},
            {at: e, text: 'each step: × [[e]] ≈ 2.7'},
            {at: reach, text: 'about [[2.3]] steps to reach 10'},
            {at: rule, text: 'ln x ≈ [[2.3]] × log x', size: 96},
            {at: ln2, text: 'ln 2 ≈ [[0.69]]', size: 96, sub: 'half-lives: “about point seven”'},
          ]} />
          <div style={{position: 'absolute', right: 120, top: Yb - 170, fontFamily: DISPLAY, fontWeight: 800, fontSize: 80, color: TEAL, opacity: fin(f, h1)}}>{count}</div>
          {f >= half && <Caption y={940} o={fin(f, half)}>t½ problems: ln 2 ≈ 0.7</Caption>}
        </>
      }
      svg={
        <g>
          <text x={x0 - 40} y={Yt + 14} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={INK}>log</text>
          <line x1={x0} x2={x0 + L} y1={Yt} y2={Yt} stroke={INK} strokeWidth={LINE} />
          {[0, 1].map((k) => <Tick key={k} x={x0 + k * L} y={Yt} h={36} label={k ? '10' : '1'} size={40} />)}
          <g opacity={fin(f, e - 6, 12)}>
            <text x={x0 - 40} y={Yb + 14} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={TEAL}>ln</text>
            <line x1={x0} x2={x0 + L} y1={Yb} y2={Yb} stroke={TEAL} strokeWidth={LINE} strokeDasharray="14 10" />
            <rect x={x0} y={Yb - 12} width={L * lit} height={24} rx={12} fill={TEAL} opacity={0.25} />
            {[0, 1, 2].map((k) => <Tick key={k} x={x0 + k * s} y={Yb} h={26} label={k === 0 ? '1' : k === 1 ? 'e' : 'e²'} size={34} color={TEAL} />)}
            <Tick x={x0 + L} y={Yb} h={34} label="10" size={40} color={TEAL} glow={lit} />
          </g>
          <AxoSquash x={st.x - 24} y={Yb - 4 + st.y} scale={0.3} sx={st.sx} sy={st.sy} rear={st.air ? 0.3 : 0} />
        </g>
      }
    />
  );
};

export const v1b = {V1LogRuler, V1Hops, V1SlideRule, V1pH, V1Flood, V1Ln};
void PAPER; void KineticLine; void ease;
