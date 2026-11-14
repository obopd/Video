// Video 1 (revised), part D: the 96-second hook (exam room, first-person desk).
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, KeySeq, SfxList, useCue, Ring} from '../kit';
import {AxoFace} from '../brand';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst} from './common';

export const RED = '#e5484d';
export const DESK = '#efe7da';
const easeIn = (t: number) => { const x = clamp01(t); return x * x * x; };

/** Front-view exam desk with privacy side panels; (x, y) = floor at the desk's centre. */
const FrontDesk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-1, 1].map((k) => <rect key={k} x={k * 150 - 7} y={-300} width={14} height={300} rx={4} fill={P.line} stroke={INK} strokeWidth={3} />)}
    <rect x={-150} y={-160} width={300} height={22} rx={5} fill={PAPER} stroke={INK} strokeWidth={4} />
    <rect x={-140} y={-138} width={280} height={110} rx={6} fill={PAPER} stroke={INK} strokeWidth={4} />
    {[-1, 1].map((k) => <line key={k} x1={k * 120} x2={k * 120} y1={-28} y2={0} stroke={INK} strokeWidth={4} />)}
  </g>
);

/** A student seen from the front, behind a desk: plain ink head and shoulders. */
const FrontStudent: React.FC<{x: number; y: number; s?: number; seed?: number}> = ({x, y, s = 1, seed = 0}) => {
  const f = useCurrentFrame();
  const nod = Math.sin(f / 18 + seed * 2.1) * 2.5;   // calm, steady writing
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -70 -150 Q -70 -215 0 -218 Q 70 -215 70 -150 Z" fill={INK} />
      <circle cx={0} cy={-252 + nod} r={36} fill={INK} />
      <rect x={-34} y={-168} width={68} height={8} rx={2} fill="#fffdf8" />
    </g>
  );
};

/** One sweat drop: it beads, slides down the side of the head, then drips off. Smooth and slow. */
const SweatBead: React.FC<{x: number; y: number; t: number; side: 1 | -1; s?: number}> = ({x, y, t, side, s = 1}) => {
  if (t <= 0 || t >= 1) return null;
  const grow = ease(clamp01(t / 0.25));                       // bead forms
  const slide = inOut(clamp01((t - 0.25) / 0.45));            // runs down the head
  const fall = clamp01((t - 0.7) / 0.3);                      // drips off
  const px = x + side * (6 + 18 * slide), py = y + 70 * slide + 160 * fall * fall;
  const st = 1 + 0.35 * fall;
  return (
    <g transform={`translate(${px} ${py}) scale(${s * grow / st} ${s * grow * st})`} opacity={1 - fall}>
      <path d="M 0 -15 C 7 -3, 9 4, 0 9 C -9 4, -7 -3, 0 -15 Z" fill="#dfe6ff" stroke="#2f5bff" strokeWidth={2.5} />
    </g>
  );
};

/** Axo from the front, behind the middle desk, holding a small pencil. Same Axo, front view. */
const AxoAtDesk: React.FC<{x: number; y: number; s?: number; look: number}> = ({x, y, s = 1, look}) => {
  const f = useCurrentFrame();
  const fidget = Math.sin(f / 5) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={-175} rx={78} ry={52} fill={INK} />
      <AxoFace x={0} y={-255} scale={0.56} look={look} />
      {[0, 1, 2].map((k) => <SweatBead key={k} x={k === 1 ? -44 : 40} y={-300 + k * 6} side={k === 1 ? -1 : 1} t={((f + k * 23) % 66) / 66} s={1.1} />)}
      {/* small hands on the desk, gripping a small pencil */}
      <g transform={`translate(0 ${-166 + fidget * 0.3})`}>
        <g transform="rotate(-28)">
          <rect x={-40} y={-5} width={74} height={10} fill={PAPER} stroke={INK} strokeWidth={2.5} />
          <path d="M 34 -5 L 48 0 L 34 5 Z" fill={INK} />
          <rect x={-46} y={-5} width={9} height={10} rx={2} fill={ORANGE} stroke={INK} strokeWidth={2} />
        </g>
        <ellipse cx={-22} cy={4} rx={20} ry={14} fill={INK} />
        <ellipse cx={18} cy={-6} rx={20} ry={14} fill={INK} />
      </g>
    </g>
  );
};

/** The exam room, front view. `secs` drives the wall countdown. */
const ExamRoom: React.FC<{secs: number}> = ({secs}) => {
  const f = useCurrentFrame();
  const look = [0, -7, 0, 7][Math.floor(f / 14) % 4];
  const proX = 300 + 1300 * (0.5 - 0.5 * Math.cos(f / 90));
  return (
    <g>
      <rect x={-200} y={-200} width={2320} height={1480} fill={PAPER} />
      {/* ceiling lights and a small security dome */}
      <rect x={-200} y={-200} width={2320} height={262} fill="#ebe3d5" />
      {[360, 960, 1560].map((x) => <rect key={x} x={x - 170} y={14} width={340} height={30} rx={6} fill="#fffdf3" stroke={INK} strokeWidth={3} />)}
      <line x1={-200} x2={2120} y1={62} y2={62} stroke={INK} strokeWidth={4} />
      <g transform="translate(1790 62)"><path d="M -26 0 A 26 26 0 0 0 26 0 Z" fill={INK} /><circle cx={0} cy={14} r={6} fill={RED} /></g>
      {/* back wall: banner, rules, countdown clock */}
      <rect x={560} y={98} width={800} height={74} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
      <text x={960} y={148} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} letterSpacing={3} fill={INK}>MCAT EXAM IN PROGRESS: SILENCE</text>
      <g transform="translate(300 290)">
        <rect x={-130} y={-52} width={260} height={104} rx={8} fill="#fffdf8" stroke={INK} strokeWidth={4} />
        <text x={0} y={-10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>No calculators.</text>
        <text x={0} y={24} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK}>No phones.</text>
      </g>
      <g transform="translate(1620 290)">
        <rect x={-110} y={-62} width={220} height={124} rx={16} fill={INK} />
        <text x={0} y={24} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={76} fill={secs <= 10 ? RED : ORANGE}>{Math.ceil(secs)}</text>
        <rect x={-90} y={40} width={180 * (secs / 96)} height={7} rx={3} fill={ORANGE} />
      </g>
      <rect x={-200} y={520} width={2320} height={1000} fill="#ece4d6" />
      <line x1={-200} x2={2120} y1={520} y2={520} stroke={INK} strokeWidth={4} />
      {/* proctor, slowly walking along the back */}
      <g transform={`translate(${proX} 560) scale(0.55)`}>
        <rect x={-34} y={-150} width={22} height={150} rx={10} fill={INK} />
        <rect x={12} y={-150} width={22} height={150} rx={10} fill={INK} />
        <path d="M -50 -150 Q -56 -280 0 -300 Q 56 -280 50 -150 Z" fill={INK} />
        <circle cx={0} cy={-330} r={30} fill={INK} />
      </g>
      {/* back row, middle row, front row (Axo in the middle) */}
      {[0, 1, 2, 3, 4].map((i) => <g key={`b${i}`}><FrontStudent x={360 + i * 300} y={690} s={0.48} seed={i} /><FrontDesk x={360 + i * 300} y={690} s={0.48} /></g>)}
      {[0, 1, 2, 3].map((i) => <g key={`m${i}`}><FrontStudent x={390 + i * 380} y={830} s={0.66} seed={i + 5} /><FrontDesk x={390 + i * 380} y={830} s={0.66} /></g>)}
      {[-1, 1].map((k) => <g key={`f${k}`}><FrontStudent x={960 + k * 560} y={1060} s={1.1} seed={k + 9} /><FrontDesk x={960 + k * 560} y={1060} s={1.1} /></g>)}
      <AxoAtDesk x={960} y={1060} s={1.1} look={look} />
      <FrontDesk x={960} y={1060} s={1.1} />
    </g>
  );
};

// ------------------------------------------------------------------ hook 1: the 96, and through its 9 into the exam room
export const V1HookRoom: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = useCue(props);
  const c96 = cue('Ninety-six', 0.02), all = cue("That's all", 0.3), q = cue('question', 0.6);
  // hold the 96 through "ninety-six seconds"; dive from "that's all" until "question"; settle after
  const p0 = all, p1 = Math.max(all + 48, q + 4);
  const dive = inOut((f - p0) / (p1 - p0));
  const z = Math.exp(Math.log(70) * dive);
  const settle = ease((f - p0) / Math.max(1, D - 4 - p0));
  const roomS = 1.18 - 0.18 * settle;
  const secs = Math.max(0, 96 - Math.max(0, f - c96) / fps);
  const ticks: [number, 'tick' | 'tock', number][] = [];
  for (let t = c96, k = 0; t < D; t += fps, k++) ticks.push([t, k % 2 ? 'tock' : 'tick', 0.3]);
  // the hole of Fraunces' "9" at 520 px (measured): centre and radii in the 1920x1080 space
  const LX = 786, LY = 456, RX = 44, RY = 76;
  const PX = LX + (960 - LX) * dive, PY = LY + (540 - LY) * dive;
  const open = z * RX > 1500;
  return (
    <Frame enter="cut" exit="cut" push={0}
      html={<SfxList items={[...ticks, [c96, 'pop', 0.45, 0.8], [p0, 'whoosh', 0.4, 0.7], [p1 - 8, 'rise', 0.25, 1.3]]} />}
      svg={
        <g>
          <rect x={-10} y={-10} width={1940} height={1100} fill={PAPER} />
          <defs><clipPath id="hole"><ellipse cx={PX} cy={PY} rx={RX * z} ry={RY * z} /></clipPath></defs>
          {/* the room, seen through the hole of the 9 */}
          <g clipPath={open ? undefined : 'url(#hole)'} opacity={f >= p0 ? 1 : 0}>
            <g transform={`translate(960 540) scale(${roomS}) translate(-960 -540)`}><ExamRoom secs={secs} /></g>
          </g>
          {/* the 96, flying past */}
          {f >= c96 && !open && (
            <g transform={`translate(${PX} ${PY}) scale(${z}) translate(${-LX} ${-LY})`}>
              <g transform={`translate(960 540) scale(${tsp(f, c96, c96 + 14, 0.9, 1)}) translate(-960 -540)`}>
                <text x={960} y={720} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={520} fill={ORANGE} opacity={fin(f, c96, 5)}>96</text>
              </g>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ hook 2: first person at the desk
const Calculator: React.FC<{sx?: number; sy?: number}> = ({sx = 1, sy = 1}) => (
  <g transform={`scale(${sx} ${sy})`}>
    <rect x={-90} y={-130} width={180} height={260} rx={22} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={-66} y={-106} width={132} height={52} rx={8} fill={TEAL} fillOpacity={0.2} stroke={INK} strokeWidth={3} />
    <text x={52} y={-68} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={34} fill={INK}>0</text>
    {Array.from({length: 12}).map((_, i) => <rect key={i} x={-66 + (i % 3) * 48} y={-36 + Math.floor(i / 3) * 40} width={36} height={28} rx={7} fill={i === 11 ? ORANGE : PAPER} stroke={INK} strokeWidth={2.5} />)}
  </g>
);

const PencilItem: React.FC<{x: number; y: number; a: number; len?: number}> = ({x, y, a, len = 300}) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <rect x={0} y={-12} width={len - 46} height={24} fill={PAPER} stroke={INK} strokeWidth={3.5} />
    <rect x={0} y={-12} width={26} height={24} rx={6} fill={ORANGE} stroke={INK} strokeWidth={3.5} />
    <path d={`M ${len - 46} -12 L ${len} 0 L ${len - 46} 12 Z`} fill={PAPER} stroke={INK} strokeWidth={3.5} />
    <path d={`M ${len - 16} -4 L ${len} 0 L ${len - 16} 4 Z`} fill={INK} />
  </g>
);

/** Axo's ink hand in first person: a stubby arm with round fingers. */
const PovHand: React.FC<{from: [number, number]; to: [number, number]; w?: number}> = ({from, to, w = 100}) => {
  const ang = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={w} strokeLinecap="round" />
      <g transform={`translate(${to[0]} ${to[1]}) rotate(${ang})`}>
        <ellipse cx={8} cy={0} rx={w * 0.6} ry={w * 0.55} fill={INK} />
        {[-0.4, -0.13, 0.13, 0.4].map((k, i) => <ellipse key={i} cx={w * 0.6 + (i === 0 || i === 3 ? -4 : 6)} cy={k * w * 1.05} rx={w * 0.19} ry={w * 0.13} fill={INK} />)}
      </g>
    </g>
  );
};

export const V1HookPOV: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = useCue(props);
  const noCalc = cue('calculator', 0.08), here = cue("Here's one", 0.16), hyd = cue('three times', 0.3), ph = cue("What's its pH", 0.42);
  const freeze = cue('freeze', 0.52), tenMin = cue('In ten minutes', 0.6), why = cue('why it works', 0.82);
  // 0.5 s push into Axo's eye, then the match cut to his view
  const eyeEnd = 0;   // the push into Axo's eye now ends the room shot
  const eyeZ = Math.exp(Math.log(8) * inOut(f / eyeEnd));
  // breathing sway, which stops dead when he freezes
  const frozen = f >= freeze;
  const swayT = frozen ? freeze : f;
  const sway = Math.sin(swayT / 22) * 7, tilt = Math.sin(swayT / 31) * 0.5;
  const tremble = frozen ? 0 : Math.sin(f * 1.9) * 2.5;
  // the calculator: squash, stretch, pop
  const q = f - noCalc - 4;
  const sx = q < 0 ? 1 : q < 5 ? 1 + 0.25 * (q / 5) : q < 10 ? 1.25 - 0.45 * ((q - 5) / 5) : 0;
  const sy = q < 0 ? 1 : q < 5 ? 1 - 0.3 * (q / 5) : q < 10 ? 0.7 + 0.65 * ((q - 5) / 5) : 0;
  const popped = q >= 10;
  const reach = tio(f, noCalc + 12, noCalc + 30) * (1 - tio(f, noCalc + 46, noCalc + 62));
  const rack = clamp01((f - here + 4) / 16);
  const secs = Math.max(0, 89.5 - f / fps);
  const drop = clamp01((f - freeze - 4) / 14);
  const smudge = clamp01((f - freeze - 18) / 10);
  // the pencil rises, touches the paper, and the camera dives into its tip
  const rise = tio(f, why - 4, why + 14);
  // after the pencil touches the paper: a short push into its tip, then a quick fade to blank paper
  const m0 = Math.max(why + 16, D - 32);
  const macro = inOut((f - m0) / 20);
  const mz = Math.exp(Math.log(5) * macro);
  const blank = clamp01((f - m0 - 10) / 10);
  const TIP: [number, number] = [1010, 560];
  const kz = clamp01(macro * 4), cxm = 960 + (TIP[0] - 960) * kz, cym = 540 + (TIP[1] - 540) * kz;
  const pEnd: [number, number] = [TIP[0] + 380 * 0.469, TIP[1] + 380 * 0.883 + 420 * (1 - rise)];
  const blurOthers = 6 * rack;
  return (
    <Frame enter="cut" exit="cut" push={0}
      html={
        <>
          <SfxList items={[[0, 'whoosh', 0.3, 1.6], [eyeEnd, 'swish', 0.3, 1.2], [noCalc + 10, 'pop', 0.7, 0.9], [noCalc + 12, 'fizz', 0.3, 1.3], [noCalc + 14, 'whoosh', 0.2, 1.8],
            [here, 'tap', 0.3], [freeze + 16, 'tap', 0.4, 0.7], [why - 4, 'slide', 0.3], [why + 14, 'tap', 0.45], [m0, 'whoosh', 0.3, 1.1],
            ...Array.from({length: Math.floor(D / fps)}).map((_, k) => [k * fps + 8, k % 2 ? 'tock' : 'tick', 0.26] as [number, 'tick' | 'tock', number])]} />
        </>
      }
      svg={
        <g>
          {f < eyeEnd ? (
            <g transform={`translate(960 540) scale(${eyeZ}) translate(-835 -516)`}>
              <rect x={-400} y={-400} width={2720} height={1880} fill={PAPER} />
              <ellipse cx={960} cy={760} rx={190} ry={120} fill={INK} />
              <AxoFace x={960} y={540} scale={2.4} />
            </g>
          ) : (
            <g>
              <g transform={`translate(960 540) scale(${mz}) translate(${-cxm} ${-cym})`}>
                <g transform={`translate(0 ${sway}) rotate(${tilt} 960 540)`}>
                  <rect x={-200} y={-200} width={2320} height={1480} fill={DESK} />
                  {[180, 420, 700, 980].map((y) => <path key={y} d={`M -200 ${y} q 600 -18 1200 0 t 1200 0`} fill="none" stroke={INK} strokeOpacity={0.06} strokeWidth={3} />)}
                  <defs><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={blurOthers} /></filter></defs>
                  <g filter={blurOthers > 0.2 ? 'url(#soft)' : undefined}>
                    {/* open pencil case, loose pencils, eraser, ruler */}
                    <g transform="translate(250 300) rotate(-8)">
                      <rect x={-150} y={-60} width={300} height={120} rx={30} fill={TEAL} fillOpacity={0.14} stroke={INK} strokeWidth={LINE} />
                      <path d="M -150 -60 L -120 -110 L 120 -110 L 150 -60" fill="none" stroke={INK} strokeWidth={4} />
                      <PencilItem x={-120} y={-10} a={-4} len={220} /><PencilItem x={-110} y={22} a={3} len={200} />
                    </g>
                    <PencilItem x={160} y={720} a={-24} />
                    <PencilItem x={300} y={850} a={8} len={260} />
                    <g transform="translate(480 520) rotate(18)"><rect x={-50} y={-26} width={100} height={52} rx={10} fill="#f3a5b8" stroke={INK} strokeWidth={4} /><rect x={-50} y={-26} width={36} height={52} rx={10} fill={PAPER} stroke={INK} strokeWidth={4} /></g>
                    <g transform="translate(1180 160) rotate(4)">
                      <rect x={-330} y={-34} width={660} height={68} rx={8} fill={PAPER} stroke={INK} strokeWidth={4} />
                      {Array.from({length: 31}).map((_, i) => <line key={i} x1={-310 + i * 20.6} x2={-310 + i * 20.6} y1={-34} y2={i % 5 === 0 ? -4 : -18} stroke={INK} strokeWidth={2.5} />)}
                    </g>
                    {/* the calculator, until it pops; then a clean outline in the dust */}
                    <g transform="translate(1600 640) rotate(6)">
                      {!popped && <Calculator sx={sx} sy={sy} />}
                      {popped && (
                        <g opacity={clamp01((q - 10) / 8)}>
                          <rect x={-90} y={-130} width={180} height={260} rx={22} fill={DESK} stroke={INK} strokeWidth={3} strokeDasharray="8 10" opacity={0.6} />
                          {Array.from({length: 46}).map((_, i) => {
                            const a = random(`d${i}`) * Math.PI * 2, r = 110 + random(`r${i}`) * 90;
                            return <circle key={i} cx={Math.cos(a) * r * 0.9} cy={Math.sin(a) * r * 1.25} r={1.5 + random(`s${i}`) * 2.5} fill={INK} opacity={0.18} />;
                          })}
                        </g>
                      )}
                    </g>
                  </g>
                  {popped && q < 34 && Array.from({length: 14}).map((_, i) => {
                    const a = (i / 14) * Math.PI * 2, t = clamp01((q - 10) / 20), r = 40 + 220 * ease(t);
                    return <circle key={i} cx={1600 + Math.cos(a) * r} cy={640 + Math.sin(a) * r} r={9 * (1 - t) + 1} fill={i % 2 ? ORANGE : '#f2a23a'} opacity={1 - t} />;
                  })}
                  {popped && <Burst x={1600} y={640} t={clamp01((q - 10) / 16)} r={120} />}
                  {/* the exam paper: the only sharp thing once focus racks */}
                  <g transform="rotate(-3 1000 560)">
                    <rect x={690} y={300} width={620} height={560} rx={8} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
                    <text x={720} y={350} fontFamily={SANS} fontWeight={800} fontSize={22} letterSpacing={4} fill={P.muted}>QUESTION 1 OF 59</text>
                    <text x={1000} y={480} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={66} fill={INK} opacity={fin(f, hyd, 8)}>
                      [H<tspan baselineShift="super" fontSize="0.55em">+</tspan>] = 3 × 10<tspan baselineShift="super" fontSize="0.55em">−5</tspan> M
                    </text>
                    <text x={1000} y={600} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={66} fill={INK} opacity={fin(f, ph, 8)}>
                      pH = <tspan fill={ORANGE}>?</tspan>
                    </text>
                    {[0, 1, 2].map((i) => <rect key={i} x={740} y={680 + i * 40} width={460 - i * 80} height={12} rx={6} fill="#e9e2d6" opacity={fin(f, here, 10)} />)}
                    {/* a sweat drop lands and smudges the ink */}
                    {smudge > 0 && <ellipse cx={1090} cy={470} rx={70 * smudge} ry={44 * smudge} fill={INK} opacity={0.14} filter="url(#soft2)" />}
                    <defs><filter id="soft2"><feGaussianBlur stdDeviation={6} /></filter></defs>
                  </g>
                  {drop > 0 && drop < 1 && <path transform={`translate(1090 ${-40 + 500 * drop * drop}) scale(${1 - 0.2 * drop} ${1 + 0.4 * drop})`} d="M 0 -18 C 9 -3, 11 5, 0 12 C -11 5, -9 -3, 0 -18 Z" fill="#dfe6ff" stroke="#2f5bff" strokeWidth={3} />}
                  {/* the pencil rises into frame and touches the paper */}
                  {rise > 0 && (
                    <g transform={`translate(${TIP[0]} ${TIP[1] + 420 * (1 - rise)}) rotate(-118)`}>
                      <g transform="translate(-380 0)"><PencilItem x={0} y={0} a={0} len={380} /></g>
                    </g>
                  )}
                  {/* Axo's trembling hands; the right one reaches for the calculator that isn't there */}
                  <PovHand from={[620, 1240]} to={[640 + tremble, 1000 + tremble]} w={96} />
                  <PovHand from={[1500, 1240]} to={rise > 0 ? [1380 + (pEnd[0] - 1380) * rise, 1000 + (pEnd[1] - 1000) * rise] : [1380 + 180 * reach - tremble, 1000 - 300 * reach]} w={100} />
                </g>
              </g>
              {blank > 0 && <rect x={-10} y={-10} width={1940} height={1100} fill={PAPER} opacity={blank} />}
              {f >= eyeEnd && macro < 0.3 && (
                <foreignObject x={0} y={0} width={1920} height={400}>
                  <KeySeq x={90} y={50} w={1740} align="center" size={64} items={[
                    {at: noCalc - 6, text: 'No [[calculator.]]'},
                    {at: here, text: "Here's one."},
                    {at: freeze, text: 'Most people [[freeze.]]'},
                    {at: tenMin, text: 'In 10 minutes: [[10 seconds.]]'},
                    {at: why, text: 'And know [[why.]]'},
                  ]} />
                </foreignObject>
              )}
              {/* the countdown in the corner */}
              {macro < 0.4 && f >= eyeEnd && <Ring x={1770} y={930} r={90} frac={secs / 96} label={String(Math.ceil(secs))} sub="SECONDS" color={secs <= 10 ? RED : ORANGE} />}
            </g>
          )}
        </g>
      }
    />
  );
};

export const v1d = {V1HookRoom, V1HookPOV};
