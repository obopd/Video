// Video 1 (revised), part G: Scene 2 continued: multiply = add, the log blocks, logs in the world, the slide rule.
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, SfxList, useCue} from '../kit';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst} from './common';
import {T, Sp, UnitTag, AMBER, RED} from '../v2/common';
import {DigitRuler, Block, lx, Heads} from './f';

type SfxItem = [number, Parameters<typeof SfxList>[0]['items'][number][1], number?, number?];
const RX = 360, RW = 1200, RY = 900;      // the 1-to-10 ruler used by the blocks
const L2 = Math.log10(2), L3 = Math.log10(3);

/** An exponent chip. */
const Chip: React.FC<{x: number; y: number; text: string; color?: string; s?: number; o?: number}> = ({x, y, text, color = ORANGE, s = 1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <rect x={-40} y={-40} width={80} height={80} rx={20} fill={color} />
    <text y={22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={60} fill={PAPER}>{text}</text>
  </g>
);

// ------------------------------------------------------------------ 2C-1. multiply = add
export const V1LogRule: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const rule = cue("Here's the rule", 0.02), remember = cue('Remember', 0.15), squared = cue('Ten squared', 0.3), fifth = cue('to the fifth', 0.45);
  const just = cue('A log is just', 0.6), add = cue('add their logs', 0.82);
  const inn = tio(f, remember, remember + 18);
  const merge = tio(f, fifth - 14, fifth + 4);
  const tens = 1 - fin(f, just, 14);
  const final = fin(f, add - 6, 12);
  const Y = 600;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[remember, 'slide', 0.3], [fifth - 14, 'swish', 0.3, 1.3], [fifth + 4, 'clack', 0.6], [just, 'whoosh', 0.25, 1.2], [add - 6, 'ding', 0.4]]} />
          <Heads items={[
            {at: rule, text: 'The rule that unlocks [[every digit]]'},
            {at: fifth, text: 'Multiply → exponents [[add]]'},
            {at: just, text: 'A log [[is]] the exponent.'},
          ]} />
        </>
      }
      svg={
        <g>
          {final < 1 && (
            <g opacity={inn * (1 - final)} transform={`translate(${-300 * (1 - inn)} 0)`}>
              <T x={560} y={Y} size={150} o={tens}>10</T>
              <T x={800} y={Y} size={110} color={P.muted} o={tens}>×</T>
              <T x={1040} y={Y} size={150} o={tens}>10</T>
              <T x={1290} y={Y} size={110} color={P.muted} o={tens * fin(f, fifth, 8)}>=</T>
              <T x={1520} y={Y} size={150} o={tens * fin(f, fifth, 8)}>10</T>
              {/* the exponents lift off and click together */}
              <Chip x={660 + (1625 - 660) * merge} y={Y - 110 - 40 * Math.sin(merge * Math.PI)} text="2" o={1 - (merge >= 1 ? 1 : 0)} />
              <Chip x={1140 + (1625 - 1140) * merge} y={Y - 110 - 40 * Math.sin(merge * Math.PI)} text="3" color={AMBER} o={1 - (merge >= 1 ? 1 : 0)} />
              {merge >= 1 && <Chip x={1625} y={Y - 110} text="5" color={TEAL} s={tsp(f, fifth + 4, fifth + 16, 0.6, 1.1)} />}
              {merge >= 1 && <Burst x={1625} y={Y - 110} t={clamp01((f - fifth - 4) / 14)} color={TEAL} r={60} />}
              {/* once the 10s fade, only the exponents remain: they are the logs */}
              {tens < 1 && [[660, 'log 100'], [1140, 'log 1000'], [1625, 'log 100,000']].map(([x, l]) => (
                <T key={l as string} x={x as number} y={Y + 10} size={40} font={SANS} weight={800} color={P.muted} o={1 - tens}>{l}</T>
              ))}
            </g>
          )}
          {/* the one caption that must stay up long enough to read */}
          {final > 0 && (
            <g opacity={final} transform={`translate(960 ${Y}) scale(${tsp(f, add - 6, add + 10, 0.8, 1)})`}>
              <rect x={-760} y={-130} width={1520} height={220} rx={40} fill={PAPER} stroke={TEAL} strokeWidth={6} />
              <T x={0} y={20} size={104}>log(a × b) = log a + log b</T>
            </g>
          )}
          {f > D - 1 && null}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ the blocks: shared pieces
/** Two original blocks on a small table. */
const Table: React.FC<{drop1?: number; drop2?: number}> = ({drop1 = 1, drop2 = 1}) => (
  <g>
    <rect x={300} y={470} width={1320} height={26} rx={6} fill="#e6d3b3" stroke={INK} strokeWidth={4} />
    <line x1={340} x2={340} y1={496} y2={560} stroke={INK} strokeWidth={5} />
    <line x1={1580} x2={1580} y1={496} y2={560} stroke={INK} strokeWidth={5} />
    <Block x={420} y={470 - 520 * (1 - drop1)} w={L2 * RW} color={TEAL} label="2 → 0.3" o={drop1 > 0 ? 1 : 0} />
    <Block x={900} y={470 - 520 * (1 - drop2)} w={L3 * RW} color={AMBER} label="3 → 0.48" o={drop2 > 0 ? 1 : 0} />
  </g>
);

type Build = {at: number; parts: ('t' | 'a')[]; n: number; val: string};
/** One number being built: copies fly from the table, snap into a bar, then the bar drops onto the ruler and lands on n. */
const Builder: React.FC<{b: Build; next: number}> = ({b, next}) => {
  const f = useCurrentFrame();
  if (f < b.at || f > next + 8) return null;
  const out = 1 - clamp01((f - next) / 8);
  const drop = tio(f, b.at + 24, b.at + 40);
  const y = 690 + (RY - 690) * drop;
  let x = RX;
  return (
    <g opacity={out}>
      {b.parts.map((p, i) => {
        const w = (p === 't' ? L2 : L3) * RW;
        const src = p === 't' ? 420 : 900;
        const k = tsp(f, b.at + i * 6, b.at + i * 6 + 16, 0, 1);
        const bx = src + (x - src) * k, by = 470 + (y - 470) * k;
        const el = <Block key={i} x={bx} y={by} w={w - 2} color={p === 't' ? TEAL : AMBER} h={56} />;
        x += w;
        return el;
      })}
      {f >= b.at + 40 && (
        <g opacity={fin(f, b.at + 40, 6)}>
          <line x1={lx(b.n, RX, RW)} x2={lx(b.n, RX, RW)} y1={RY - 120} y2={RY - 70} stroke={TEAL} strokeWidth={4} />
          <UnitTag x={lx(b.n, RX, RW)} y={RY - 150} text={b.val} color={TEAL} s={tsp(f, b.at + 40, b.at + 52, 0.6, 1)} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ 2C-2. building 6, 4, 8 and 9
export const V1LogBlocks: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const solid = cue('make that solid', 0.02), block = cue('each log as a block', 0.06), teal = cue('short teal block', 0.12), amber = cue('longer amber block', 0.24);
  const snap = cue('snap blocks together', 0.32), six = cue('Six is two times three', 0.38), four = cue('Four is two times two', 0.55);
  const eight = cue('Eight is two times', 0.67), nine = cue('Nine is three times', 0.8), seat = cue('empty seat', 0.94);
  const builds: Build[] = [
    {at: six, parts: ['t', 'a'], n: 6, val: '0.78'},
    {at: four, parts: ['t', 't'], n: 4, val: '0.6'},
    {at: eight, parts: ['t', 't', 't'], n: 8, val: '0.9'},
    {at: nine, parts: ['a', 'a'], n: 9, val: '0.96'},
  ];
  const landed = (n: number) => { const b = builds.find((x) => x.n === n); return b && f >= b.at + 40 ? 1 : 0; };
  const pushing = builds.some((b) => f > b.at + 20 && f < b.at + 40);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[teal + 8, 'clack', 0.6], [amber + 8, 'clack', 0.6, 0.85],
            ...builds.flatMap((b) => [[b.at + 14, 'clack', 0.35, 1.3], [b.at + 24, 'slide', 0.3], [b.at + 40, 'chime', 0.35]] as SfxItem[]), [seat, 'pop', 0.35]]} />
          <Heads items={[
            {at: block, text: 'Each log is a [[block]]'},
            {at: snap, text: 'Build a number: [[snap]] blocks'},
            {at: six, text: '6 = 2 × 3 → 0.3 + 0.48 = [[0.78]]', size: 64},
            {at: four, text: '4 = 2 × 2 → [[0.6]]'},
            {at: eight, text: '8 = 2 × 2 × 2 → [[0.9]]'},
            {at: nine, text: '9 = 3 × 3 → [[0.96]]'},
          ]} />
        </>
      }
      svg={
        <g opacity={fin(f, 0, 8)}>
          <Table drop1={tsp(f, teal, teal + 10, 0, 1)} drop2={tsp(f, amber, amber + 10, 0, 1)} />
          <DigitRuler x0={RX} w={RW} y={RY} glow={(n) => (n === 2 || n === 3 ? 0.7 : landed(n))} />
          {builds.map((b, i) => <Builder key={b.n} b={b} next={builds[i + 1]?.at ?? D + 100} />)}
          {/* the empty seat on the bench, beside 9 */}
          {f >= seat && (
            <g transform={`translate(${lx(9, RX, RW) + 40} ${RY - 270}) scale(0.5)`} opacity={fin(f, seat, 6) * (0.6 + 0.4 * Math.abs(Math.sin((f - seat) / 5)))}>
              <rect x={-100} y={0} width={200} height={14} rx={4} fill={PAPER} stroke={INK} strokeWidth={4} />
              {Array.from({length: 4}).map((_, i) => <circle key={i} cx={-75 + i * 50} cy={-14} r={12} fill={i === 3 ? 'none' : INK} stroke={i === 3 ? ORANGE : INK} strokeWidth={4} strokeDasharray={i === 3 ? '5 5' : undefined} />)}
            </g>
          )}
          <AxoSide x={160} y={720} scale={0.6} rear={1} arm={pushing ? 0 : -40} />
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2C-3. dividing: 5; and 7
export const V1LogBlocks2: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const div = cue('Dividing works', 0.02), pull = cue('pull one off', 0.12), five = cue('Five is ten', 0.2), start = cue('Start with one full', 0.3);
  const pullT = cue('pull off a teal', 0.38), log5 = cue('Log of five', 0.48), seven = cue('Seven is', 0.58), between = cue('between six and eight', 0.72), two = cue('Two blocks', 0.88);
  const fullIn = tsp(f, start, start + 14, 0, 1);
  const off = tio(f, pullT, pullT + 16);
  const drop = tio(f, pullT + 22, pullT + 38);
  const by = 690 + (RY - 690) * drop;
  const five5 = f >= pullT + 38;
  const q = f >= seven ? clamp01((f - seven) / 40) : 0;
  const qx = 1700 - 260 * Math.sin(q * Math.PI);
  const qRot = q > 0 && q < 1 ? Math.sin(q * Math.PI * 6) * 14 : 0;
  const marker = fin(f, between, 10);
  const all = fin(f, two, 12);
  const done = [2, 3, 4, 6, 8, 9];
  return (
    <Frame
      html={
        <>
          <SfxList items={[[start, 'slide', 0.3], [pullT + 4, 'pop', 0.6], [pullT + 22, 'slide', 0.3], [pullT + 38, 'chime', 0.35], [seven + 10, 'thud', 0.35], [seven + 20, 'boing', 0.3],
            [between, 'pop', 0.35], [two, 'sparkle', 0.4]]} />
          <Heads items={[
            {at: div, text: 'Dividing works [[backwards.]]'},
            {at: pull, text: 'Divide → [[subtract]]'},
            {at: five, text: '5 = 10 ÷ 2 → 1 − 0.3 = [[0.7]]', size: 66},
            {at: seven, text: '7: the one you [[can\'t]] build'},
            {at: between, text: 'log 7 ≈ [[0.85]]'},
            {at: two, text: 'Two blocks build the [[whole ruler.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          <Table />
          <DigitRuler x0={RX} w={RW} y={RY} glow={(n) => (done.includes(n) ? 0.8 : n === 5 && five5 ? 1 : n === 7 ? marker * 0.8 : 0) * (1 - all) + all * (n > 1 && n < 10 ? 1 : 0)} />
          {/* 10 → 1: a full step, then a teal block pulled off its end */}
          {fullIn > 0 && f < two && (
            <g opacity={1 - fin(f, seven - 6, 8)}>
              <Block x={RX} y={by} w={(off >= 1 ? 1 - L2 : 1) * RW} color={PAPER} label={off >= 1 ? '5 → 0.7' : '10 → 1'} h={56} s={1} o={fullIn} />
              {off < 1 && <rect x={RX + (1 - L2) * RW} y={by - 56} width={L2 * RW} height={56} rx={10} fill={TEAL} fillOpacity={0.85 * fin(f, pullT - 8, 8)} stroke={INK} strokeWidth={3} />}
              {off > 0 && <g transform={`translate(${200 * off} ${-180 * off})`} opacity={1 - off}><Block x={RX + (1 - L2) * RW} y={by} w={L2 * RW} color={TEAL} h={56} /></g>}
              {five5 && <UnitTag x={lx(5, RX, RW)} y={RY - 150} text="0.7" color={TEAL} s={tsp(f, pullT + 38, pullT + 50, 0.6, 1)} />}
            </g>
          )}
          {/* 7: a "?" block that won't snap in */}
          {q > 0 && q < 1 && (
            <g transform={`rotate(${qRot} ${qx} 640)`}>
              <rect x={qx - 70} y={600} width={140} height={60} rx={12} fill={PAPER} stroke={INK} strokeWidth={4} strokeDasharray="10 6" />
              <text x={qx} y={644} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={44} fill={RED}>?</text>
            </g>
          )}
          {marker > 0 && (
            <g opacity={marker}>
              <path d={`M ${lx(7, RX, RW)} ${RY - 40} l -16 -26 l 32 0 Z`} fill={ORANGE} />
              <UnitTag x={lx(7, RX, RW)} y={RY - 120} text="≈ 0.85" color={ORANGE} s={0.85} />
            </g>
          )}
          <AxoSide x={160} y={720} scale={0.6} rear={1} arm={f > seven + 24 && f < between ? -60 + 50 * Math.sin((f - seven) / 3) : f > pullT && f < pullT + 30 ? 0 : -40} />
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2D-1. logs in the world: earthquakes and decibels
const Building: React.FC<{x: number; w: number; h: number; base: number; rot: number}> = ({x, w, h, base, rot}) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${base})`}>
    <rect x={x} y={base - h} width={w} height={h} fill={PAPER} stroke={INK} strokeWidth={4} />
    {Array.from({length: Math.floor(h / 60)}).map((_, r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 16 + c * (w / 2 - 6)} y={base - h + 18 + r * 60} width={w / 2 - 30} height={26} fill={INK} opacity={0.15} />))}
  </g>
);

const DbMeter: React.FC<{x: number; y: number; db: number; marks: number}> = ({x, y, db, marks}) => {
  const ang = (d: number) => Math.PI + (d / 120) * Math.PI;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -230 0 A 230 230 0 0 1 230 0 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
      {Array.from({length: 13}).map((_, i) => {
        const d = i * 10, a = ang(d), lit = d > 30 && d <= 110 && (d - 30) / 10 <= marks;
        return (
          <g key={i}>
            <line x1={Math.cos(a) * 200} y1={Math.sin(a) * 200} x2={Math.cos(a) * 228} y2={Math.sin(a) * 228} stroke={lit ? ORANGE : INK} strokeWidth={lit ? 7 : 4} />
            {i % 2 === 1 && <text x={Math.cos(a) * 170} y={Math.sin(a) * 170 + 10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={P.muted}>{d}</text>}
          </g>
        );
      })}
      <line x1={0} y1={0} x2={Math.cos(ang(db)) * 190} y2={Math.sin(ang(db)) * 190} stroke={RED} strokeWidth={8} strokeLinecap="round" />
      <circle r={16} fill={INK} />
      <text y={80} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={72} fill={INK}>{Math.round(db)} dB</text>
    </g>
  );
};

export const V1LogWorld: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const live = cue('live on log', 0.06), quake = cue('Earthquakes', 0.14), bigger = cue('ten times bigger', 0.24), sound = cue('Sound', 0.32);
  const whisper = cue('A whisper', 0.44), concert = cue('A loud concert', 0.56), apart = cue('Eighty decibels apart', 0.66), hm = cue('a hundred million', 0.78), ears = cue('Your ears', 0.9);
  const beat = f < quake ? 0 : f < sound ? 1 : f < concert ? 2 : 3;
  const amp = f < bigger ? 1 : 10;
  const wob = Math.sin(f * 1.3) * amp * 0.6;
  const db = beat < 3 ? 30 : 30 + 80 * tio(f, concert + 4, apart + 30);
  const marks = beat < 3 ? 0 : Math.floor((db - 30) / 10 + 0.001);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[quake, 'crash', 0.18, 0.6], [bigger, 'crash', 0.35, 0.45], [whisper, 'fizz', 0.15, 0.6], [concert, 'bang', 0.5, 0.8],
            ...Array.from({length: 8}).map((_, k) => [concert + 8 + Math.round(((apart + 30 - concert - 8) * k) / 8), 'tick', 0.3, 1 + k * 0.06] as SfxItem), [hm, 'ding', 0.4]]} />
        </>
      }
      svg={
        <g>
          {beat === 0 && (
            <g opacity={fin(f, 0, 8)}>
              {/* a ruler counting tens */}
              <line x1={260} x2={1660} y1={600} y2={600} stroke={INK} strokeWidth={LINE} />
              {Array.from({length: 6}).map((_, i) => (
                <g key={i} opacity={fin(f, live + i * 4, 6)}>
                  <line x1={300 + i * 264} x2={300 + i * 264} y1={572} y2={628} stroke={INK} strokeWidth={5} />
                  <T x={300 + i * 264} y={690} size={42}>{`10`}<Sp>{String(i)}</Sp></T>
                  {i < 5 && <UnitTag x={432 + i * 264} y={500} text="×10" color={TEAL} s={0.75} />}
                </g>
              ))}
            </g>
          )}
          {beat === 1 && (
            <g>
              {/* seismograph */}
              <rect x={300} y={240} width={1320} height={200} rx={14} fill="#fffdf8" stroke={INK} strokeWidth={4} />
              <path d={Array.from({length: 120}).map((_, i) => `${i ? 'L' : 'M'} ${310 + i * 10.8} ${340 + Math.sin(i * 1.9 + f * 0.8) * (i > 100 ? 0 : 1) * (f > bigger && i > 60 ? 80 : 8) * (0.5 + random(`s${i}`) * 0.5)}`).join(' ')}
                    fill="none" stroke={RED} strokeWidth={3} />
              <T x={1720} y={380} size={150} color={f >= bigger ? RED : INK} s={f > bigger && f < bigger + 10 ? 1.2 : 1}>{f >= bigger ? '6' : '5'}</T>
              {/* the city wobbles; ten times more at magnitude 6 */}
              <line x1={200} x2={1720} y1={980} y2={980} stroke={INK} strokeWidth={LINE} />
              {[[300, 160, 300], [490, 120, 220], [640, 180, 380], [850, 140, 260], [1020, 170, 340], [1220, 130, 240]].map(([x, w, h], i) => (
                <Building key={i} x={x} w={w} h={h} base={980} rot={wob * (0.6 + 0.2 * (i % 3)) * (i % 2 ? 1 : -1)} />
              ))}
              {/* Axol clings to a lamppost */}
              <g transform={`rotate(${wob * 0.8} 1520 980)`}>
                <line x1={1520} x2={1520} y1={980} y2={640} stroke={INK} strokeWidth={10} />
                <path d="M 1520 640 Q 1560 610 1600 640" fill="none" stroke={INK} strokeWidth={8} />
                <circle cx={1600} cy={652} r={16} fill={AMBER} stroke={INK} strokeWidth={3} />
                <AxoSide x={1440 + wob} y={900} scale={0.55} rear={1} arm={-50} sweat />
              </g>
            </g>
          )}
          {beat === 2 && (
            <g>
              {/* a whisper */}
              <AxoSide x={560} y={820} scale={0.75} rear={1} arm={-20} />
              <AxoSide x={980} y={820} scale={0.75} rear={1} arm={-30} dir={-1} />
              {[0, 1, 2].map((k) => <path key={k} d={`M ${790 + k * 16} ${560 - k * 8} q 16 -10 30 0`} fill="none" stroke={P.muted} strokeWidth={4} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 6 + k))} />)}
              <DbMeter x={1460} y={760} db={30} marks={0} />
            </g>
          )}
          {beat === 3 && (
            <g>
              {/* a loud concert, invented band */}
              {[-1, 0, 1].map((k) => <path key={k} d={`M ${760 + k * 260} 150 L ${640 + k * 260 + 120 * Math.sin(f / 9 + k)} 880 L ${880 + k * 260 + 120 * Math.sin(f / 9 + k)} 880 Z`} fill={k ? AMBER : ORANGE} opacity={0.14} />)}
              <rect x={360} y={180} width={800} height={90} rx={12} fill={INK} />
              <text x={760} y={240} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={50} fill={AMBER}>THE DECIBELLES</text>
              {Array.from({length: 12}).map((_, i) => {
                const x = 260 + i * 85, jump = Math.abs(Math.sin(f / 5 + i * 1.3)) * 30;
                return (
                  <g key={i} transform={`translate(${x} ${980 - jump})`}>
                    <path d="M -36 0 Q -40 -80 0 -90 Q 40 -80 36 0 Z" fill={INK} />
                    <circle cx={0} cy={-118} r={26} fill={INK} />
                    <line x1={-20} y1={-80} x2={-34 - (i % 2) * 6} y2={-160} stroke={INK} strokeWidth={10} strokeLinecap="round" />
                  </g>
                );
              })}
              <AxoSide x={700} y={860 - Math.abs(Math.sin(f / 4)) * 70} scale={0.6} rear={1} arm={-110} />
              <DbMeter x={1500} y={760} db={db} marks={marks} />
              {f >= apart && (
                <g opacity={fin(f, apart, 8)}>
                  <T x={1500} y={400} size={64}>8 steps of ×10</T>
                </g>
              )}
              {f >= hm && <T x={1500} y={500} size={64} color={ORANGE} o={fin(f, hm, 8)}>100,000,000×</T>}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2D-2. the slide rule
const Scale: React.FC<{x0: number; w: number; y: number; flip?: boolean; hi?: number[]}> = ({x0, w, y, flip = false, hi = []}) => (
  <g>
    <rect x={x0 - 40} y={flip ? y : y - 110} width={w + 80} height={110} rx={10} fill={flip ? '#fffaf0' : PAPER} stroke={INK} strokeWidth={LINE} />
    {Array.from({length: 91}).map((_, i) => {
      const v = 1 + i / 10, x = lx(v, x0, w), major = Number.isInteger(Math.round(v * 10) / 10) && Math.abs(v - Math.round(v)) < 1e-6;
      const len = major ? 40 : i % 5 === 0 ? 26 : 14;
      return <line key={i} x1={x} x2={x} y1={y} y2={flip ? y + len : y - len} stroke={INK} strokeWidth={major ? 4 : 2} />;
    })}
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
      <text key={n} x={lx(n, x0, w)} y={flip ? y + 84 : y - 56} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={hi.includes(n) ? 48 : 36} fill={hi.includes(n) ? ORANGE : INK}>{n}</text>
    ))}
  </g>
);

export const V1LogSlideRule: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const before = cue('before calculators', 0.04), called = cue('slide rule', 0.3), apollo = cue('Apollo', 0.42), two = cue('Two times three', 0.72), read = cue('read six', 0.9);
  const beat = f < apollo ? 0 : f < two ? 1 : 2;
  const X0 = 210, W = 1500;
  const shift = beat === 2 ? tio(f, two + 6, two + 30) * Math.log10(2) * W : Math.sin(f / 18) * 120 + 150;
  const lineUp = fin(f, read - 4, 8);
  const snap = tio(f, read, read + 16);
  return (
    <Frame exit="whip"
      html={
        <>
          <SfxList items={[[called, 'slide', 0.3], [apollo, 'whoosh', 0.35, 0.7], [two + 6, 'slide', 0.4], [two + 30, 'clack', 0.5], [read, 'chime', 0.4], [read + 16, 'clack', 0.45, 1.2]]} />
          <Heads items={[
            {at: before, text: 'Before calculators:'},
            {at: called, text: 'the [[slide rule]]'},
            {at: apollo, text: 'Carried to the [[Moon]] as a backup'},
            {at: two, text: 'Multiply = [[add steps.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {beat === 0 && (
            <g opacity={fin(f, 0, 10)} transform="translate(960 640) scale(0.8) translate(-960 -640)">
              <Scale x0={X0} w={W} y={600} />
              <g transform={`translate(${shift} 0)`}><Scale x0={X0} w={W} y={610} flip /></g>
            </g>
          )}
          {beat === 1 && (
            <g>
              {Array.from({length: 60}).map((_, i) => <circle key={i} cx={random(`sx${i}`) * 1920} cy={300 + random(`sy${i}`) * 780} r={2 + random(`sr${i}`) * 2} fill={INK} opacity={0.4} />)}
              <circle cx={1620} cy={420} r={130} fill={P.line} stroke={INK} strokeWidth={LINE} />
              <circle cx={1580} cy={390} r={22} fill={INK} opacity={0.12} /><circle cx={1660} cy={460} r={14} fill={INK} opacity={0.12} />
              {/* a generic rocket, drifting */}
              <g transform={`translate(${760 + Math.sin(f / 30) * 20} ${660 + Math.cos(f / 25) * 14}) rotate(-20)`}>
                <path d="M -110 -60 L 160 -60 Q 260 0 160 60 L -110 60 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <path d="M -110 -60 L -170 -120 L -60 -60 Z M -110 60 L -170 120 L -60 60 Z" fill={ORANGE} stroke={INK} strokeWidth={4} />
                <circle cx={70} cy={0} r={46} fill="#eaf6f4" stroke={INK} strokeWidth={5} />
                <g transform="translate(70 30)"><AxoSide x={-24} y={0} scale={0.2} rear={1} arm={-40} /></g>
                <rect x={86} y={-16} width={40} height={10} fill={PAPER} stroke={INK} strokeWidth={2} transform="rotate(-30 106 -11)" />
                {[0, 1, 2].map((k) => <path key={k} d={`M -${120 + k * 6} ${-20 + k * 20} l -${60 + 30 * Math.abs(Math.sin(f / 3 + k))} 0`} stroke={AMBER} strokeWidth={10} strokeLinecap="round" />)}
              </g>
            </g>
          )}
          {beat === 2 && (
            <g>
              <Scale x0={X0} w={W} y={470} hi={lineUp > 0 ? [6] : []} />
              <g transform={`translate(${shift} 0)`}><Scale x0={X0} w={W} y={480} flip hi={lineUp > 0 ? [1, 3] : []} /></g>
              {lineUp > 0 && (
                <g opacity={lineUp}>
                  <line x1={lx(2, X0, W)} x2={lx(2, X0, W)} y1={330} y2={600} stroke={TEAL} strokeWidth={4} strokeDasharray="8 8" />
                  <line x1={lx(6, X0, W)} x2={lx(6, X0, W)} y1={330} y2={600} stroke={ORANGE} strokeWidth={5} strokeDasharray="8 8" />
                </g>
              )}
              {/* the same thing as blocks: teal + amber end to end */}
              <Block x={X0} y={790} w={Math.log10(2) * W - 2} color={TEAL} label="log 2" />
              <Block x={X0 + Math.log10(2) * W + 160 * (1 - snap)} y={790 - 40 * (1 - snap)} w={Math.log10(3) * W - 2} color={AMBER} label="log 3" />
              {snap >= 1 && <line x1={lx(6, X0, W)} x2={lx(6, X0, W)} y1={700} y2={820} stroke={ORANGE} strokeWidth={5} />}
              <AxoSide x={lx(3, X0, W) + shift - 180} y={1060} scale={0.5} rear={1} arm={lineUp > 0 ? -70 : -30} />
            </g>
          )}
        </g>
      }
    />
  );
};

export const v1g = {V1LogRule, V1LogBlocks, V1LogBlocks2, V1LogWorld, V1LogSlideRule};
