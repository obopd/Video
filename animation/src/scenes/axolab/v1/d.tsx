// Video 1 (revised), part D: the 96-second hook (exam room, first-person desk).
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, KeySeq, SfxList, useCue, Ring} from '../kit';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst} from './common';

export const RED = '#e5484d';
export const DESK = '#efe7da';
const easeIn = (t: number) => { const x = clamp01(t); return x * x * x; };

/** Seated student (solid ink silhouette), side view facing right; (x, y) = floor under the stool. */
const Student: React.FC<{x: number; y: number; s?: number; seed?: number; phones?: boolean; cough?: number; shake?: number}> = ({x, y, s = 1, seed = 0, phones = false, cough = 0, shake = 0}) => {
  const f = useCurrentFrame();
  const write = Math.sin(f / 2.2 + seed * 3) * 3;   // pencil scratching
  const jump = cough > 0 ? Math.sin(cough * Math.PI) * 10 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* stool */}
      <line x1={-30} x2={-30} y1={0} y2={-70} stroke={INK} strokeWidth={4} />
      <rect x={-62} y={-80} width={64} height={12} rx={6} fill={INK} />
      <g transform={`translate(0 ${-jump})`}>
        {/* body and head */}
        <path d="M -60 -82 Q -66 -150 -40 -178 L -10 -178 Q 6 -150 0 -82 Z" fill={INK} />
        <circle cx={-22} cy={-205} r={27} fill={INK} />
        {phones && <path d="M -48 -210 Q -22 -246 6 -210" fill="none" stroke={INK} strokeWidth={6} />}
        {phones && <rect x={-10} y={-218} width={14} height={22} rx={5} fill={INK} />}
        {/* writing arm */}
        <path d={`M -14 -160 Q 20 -136 ${52 + write} -126`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        {shake > 0 && <path d={`M -30 -160 Q -50 -190 ${-40 + Math.sin(f * 1.6) * 10} -222`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />}
        {cough > 0 && [0, 1, 2].map((k) => <path key={k} d={`M 10 ${-212 + k * 10} q 14 -4 26 ${-8 + k * 6}`} fill="none" stroke={INK} strokeWidth={3} opacity={1 - cough} />)}
      </g>
    </g>
  );
};

/** Side-view exam desk with a privacy partition; (x, y) = floor under the front leg. */
const ExamDesk: React.FC<{x: number; y: number; s?: number; paper?: boolean; caseClear?: boolean}> = ({x, y, s = 1, paper = true, caseClear = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-10} y={-300} width={14} height={300} rx={4} fill={P.line} stroke={INK} strokeWidth={3} />
    <rect x={4} y={-128} width={210} height={14} rx={4} fill={PAPER} stroke={INK} strokeWidth={4} />
    <line x1={30} x2={30} y1={-114} y2={0} stroke={INK} strokeWidth={4} />
    <line x1={190} x2={190} y1={-114} y2={0} stroke={INK} strokeWidth={4} />
    {paper && <rect x={60} y={-134} width={90} height={6} fill="#fffdf8" stroke={INK} strokeWidth={2} />}
    {caseClear && <rect x={160} y={-146} width={44} height={18} rx={6} fill={TEAL} fillOpacity={0.15} stroke={INK} strokeWidth={2} />}
  </g>
);

/** Proctor (ink silhouette, standing, side view) with a clipboard. */
const Proctor: React.FC<{x: number; y: number; s?: number; dir?: 1 | -1; walk: number}> = ({x, y, s = 1, dir = 1, walk}) => {
  const a = Math.sin(walk) * 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <path d={`M -10 -150 L ${-24 + a} 0`} stroke={INK} strokeWidth={18} strokeLinecap="round" />
      <path d={`M 4 -150 L ${18 - a} 0`} stroke={INK} strokeWidth={18} strokeLinecap="round" />
      <path d="M -34 -150 Q -40 -270 -10 -300 L 14 -300 Q 36 -270 30 -150 Z" fill={INK} />
      <circle cx={2} cy={-330} r={30} fill={INK} />
      <rect x={26} y={-260} width={46} height={62} rx={4} fill={PAPER} stroke={INK} strokeWidth={4} transform="rotate(12 48 -230)" />
      <path d="M 20 -270 Q 40 -240 40 -224" stroke={INK} strokeWidth={14} strokeLinecap="round" fill="none" />
    </g>
  );
};

/** Flying sweat drop with squash and stretch along its path. */
const Drop: React.FC<{x: number; y: number; vx: number; vy: number; t: number; s?: number}> = ({x, y, vx, vy, t, s = 1}) => {
  if (t <= 0 || t >= 1) return null;
  const g = 900;
  const px = x + vx * t, py = y + vy * t + 0.5 * g * t * t;
  const ang = (Math.atan2(vy + g * t, vx) * 180) / Math.PI;
  const st = 1 + 0.5 * Math.min(1, Math.hypot(vx, vy + g * t) / 900);
  return (
    <g transform={`translate(${px} ${py}) rotate(${ang - 90}) scale(${s / st} ${s * st})`} opacity={1 - t * 0.4}>
      <path d="M 0 -16 C 8 -3, 10 4, 0 10 C -10 4, -8 -3, 0 -16 Z" fill="#dfe6ff" stroke="#2f5bff" strokeWidth={3} />
    </g>
  );
};

// ------------------------------------------------------------------ hook 1: the 96, and into the exam room
export const V1HookRoom: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = useCue(props);
  const c96 = cue('Ninety-six', 0.02);
  // dive into the loop of the 9 (ease-in), then crane down and pull back (ease-out)
  const p0 = c96 + 16, p1 = p0 + 75;
  const dive = easeIn((f - p0) / (p1 - p0));
  const z = Math.exp(Math.log(60) * dive);
  const blackO = 1 - clamp01((f - p1 + 4) / 6);
  const rack = clamp01((f - p1 + 8) / 26);           // focus racks in
  const crane = ease((f - p1) / (D - p1 - 6));
  const camS = 1.9 - 0.9 * crane, camY = -330 * (1 - crane);
  const secs = Math.max(0, 96 - Math.max(0, f - c96) / fps);
  const dome = -40 + 75 * clamp01((f - p1 - 30) / 30);
  const walk = f / 7;
  const proX = 300 + (f % 600) * 1.6;
  const ticks: [number, 'tick' | 'tock', number][] = [];
  for (let t = c96, k = 0; t < D; t += fps, k++) ticks.push([t, k % 2 ? 'tock' : 'tick', 0.3]);
  // the loop of Fraunces' "9" sits here in the 1920x1080 design space (centre and inner radius)
  const LX = 786, LY = 456, LRX = 44, LRY = 76;
  // zoom about the hole while panning it to the centre of the screen
  const PX = LX + (960 - LX) * dive, PY = LY + (540 - LY) * dive;
  return (
    <Frame enter="cut" exit="cut" push={0}
      html={<SfxList items={[...ticks, [c96, 'pop', 0.5, 0.7], [p0, 'whoosh', 0.45, 0.6], [p1 - 6, 'rise', 0.3, 1.4], [p1 + 30, 'scribble', 0.15, 0.8], [p1 + 50, 'blip', 0.12, 2.2], [p1 + 66, 'blip', 0.12, 2.3]]} />}
      svg={
        <g>
          {/* the exam room (seen through the 9, then on its own) */}
          <g transform={`translate(960 540) scale(${camS}) translate(-960 ${-540 - camY})`}>
            <defs>
              <filter id="rack" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={14 * (1 - rack)} /></filter>
            </defs>
            <g filter={rack < 1 ? 'url(#rack)' : undefined}>
              <rect x={-400} y={-400} width={2720} height={1880} fill={PAPER} />
              {/* ceiling with fluorescent panels and the security dome */}
              <rect x={-400} y={-400} width={2720} height={470} fill="#ebe3d5" />
              {[260, 760, 1260, 1760].map((x) => <rect key={x} x={x - 150} y={20} width={300} height={34} rx={6} fill="#fffdf3" stroke={INK} strokeWidth={3} />)}
              <g transform={`translate(1500 70) rotate(${dome})`}>
                <path d="M -34 0 A 34 34 0 0 0 34 0 Z" fill={INK} />
                <circle cx={0} cy={18} r={9} fill={RED} />
              </g>
              <line x1={-400} x2={2320} y1={70} y2={70} stroke={INK} strokeWidth={4} />
              {/* back wall: banner, clock, door, sign */}
              <rect x={560} y={110} width={800} height={78} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              <text x={960} y={162} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} letterSpacing={3} fill={INK}>MCAT EXAM IN PROGRESS: SILENCE</text>
              <g transform="translate(300 300)">
                <rect x={-120} y={-70} width={240} height={140} rx={18} fill={INK} />
                <text x={0} y={26} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={86} fill={secs <= 10 ? RED : ORANGE}>{Math.ceil(secs)}</text>
                <rect x={-100} y={52} width={200 * (secs / 96)} height={8} rx={4} fill={ORANGE} />
              </g>
              <rect x={1640} y={230} width={200} height={400} rx={6} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              <circle cx={1666} cy={440} r={9} fill={INK} />
              <g transform="translate(1420 300)">
                <rect x={-120} y={-56} width={240} height={112} rx={8} fill="#fffdf8" stroke={INK} strokeWidth={4} />
                {['No calculators.', 'No phones.', 'Lockers in the hall.'].map((t, i) => <text key={t} x={0} y={-20 + i * 30} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={20} fill={INK}>{t}</text>)}
              </g>
              <line x1={-400} x2={2320} y1={630} y2={630} stroke={INK} strokeWidth={4} />
              {/* proctor's desk with a stack of scratch paper */}
              <rect x={1430} y={540} width={180} height={18} fill={PAPER} stroke={INK} strokeWidth={4} />
              {[0, 1, 2, 3].map((i) => <rect key={i} x={1470} y={526 - i * 6} width={100} height={6} fill="#fffdf8" stroke={INK} strokeWidth={1.5} />)}
              {/* back row (smaller), proctor walking the aisle, front row */}
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={`b${i}`}>
                  <Student x={180 + i * 340} y={720} s={0.62} seed={i} phones={i % 2 === 0} cough={i === 3 ? clamp01((f - p1 - 40) / 14) : 0} />
                  <ExamDesk x={200 + i * 340} y={720} s={0.62} />
                </g>
              ))}
              <Proctor x={proX} y={790} s={0.7} walk={walk} />
              {[0, 1, 2, 3, 4].map((i) => {
                const x = 60 + i * 400;
                if (i === 2) {
                  // Axo, middle desk, sweating hard and chewing his pencil, eyes darting
                  const look = [0, -5, 5, -5, 5][Math.floor(f / 9) % 5];
                  return (
                    <g key="axo">
                      <AxoSide x={x + 20} y={1000} scale={0.72} rear={1} arm={-78 + Math.sin(f / 2) * 6} holding="pencil" sweat look={look} />
                      <ExamDesk x={x + 150} y={1000} s={0.85} />
                      {[0, 1, 2, 3, 4, 5].map((k) => {
                        const t0 = p1 + 6 + k * 13;
                        return <Drop key={k} x={x + 150} y={790} vx={(k % 2 ? 1 : -1) * (180 + 40 * k)} vy={-420} t={((f - t0) % 40) / 26} s={1.1} />;
                      })}
                    </g>
                  );
                }
                return (
                  <g key={`f${i}`}>
                    <Student x={x} y={1000} s={0.85} seed={i + 7} phones={i === 1} shake={i === 4 ? 1 : 0} />
                    <ExamDesk x={x + 20} y={1000} s={0.85} />
                  </g>
                );
              })}
            </g>
            {/* bokeh from the lights while out of focus */}
            {rack < 1 && [[260, 37], [760, 37], [1260, 37], [1760, 37], [500, 120], [1500, 90]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={80 + (i % 3) * 30} fill="#fff6d6" opacity={0.55 * (1 - rack)} />
            ))}
          </g>
          {/* black, with the 96: the hole of the 9 is cut out so we fly through it */}
          {blackO > 0 && (
            <g opacity={blackO}>
              <defs>
                <mask id="nine">
                  <rect x={-10} y={-10} width={1940} height={1100} fill="white" />
                  {f >= p0 && <ellipse cx={PX} cy={PY} rx={LRX * z} ry={LRY * z} fill="black" />}
                </mask>
              </defs>
              <rect x={-10} y={-10} width={1940} height={1100} fill={INK} mask="url(#nine)" />
              {f >= c96 && (
                <g transform={`translate(${PX} ${PY}) scale(${z}) translate(${-LX} ${-LY})`}>
                  <g transform={`translate(960 540) scale(${tsp(f, c96, c96 + 14, 0.9, 1)}) translate(-960 -540)`}>
                    <text x={960} y={720} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={520} fill={ORANGE} opacity={fin(f, c96, 4)}>96</text>
                  </g>
                </g>
              )}
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
  const eyeEnd = 15;
  const eyeZ = Math.exp(Math.log(9) * easeIn(f / eyeEnd));
  // breathing sway, which stops dead when he freezes
  const frozen = f >= freeze;
  const swayT = frozen ? freeze : f;
  const sway = Math.sin(swayT / 22) * 7, tilt = Math.sin(swayT / 31) * 0.5;
  const tremble = frozen ? 0 : Math.sin(f * 1.9) * 2.5;
  // the calculator: squash, stretch, pop
  const q = f - noCalc;
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
  const m0 = why + 18;
  const macro = easeIn((f - m0) / Math.max(1, D - m0 - 8));
  const mz = Math.exp(Math.log(140) * macro);
  const grains = clamp01((macro - 0.45) / 0.25), atoms = clamp01((macro - 0.72) / 0.2);
  const TIP: [number, number] = [1010, 560];
  const kz = clamp01(macro * 4), cxm = 960 + (TIP[0] - 960) * kz, cym = 540 + (TIP[1] - 540) * kz;
  const pEnd: [number, number] = [TIP[0] + 380 * 0.469, TIP[1] + 380 * 0.883 + 420 * (1 - rise)];
  const blurOthers = 6 * rack;
  return (
    <Frame enter="cut" exit="cut" push={0}
      html={
        <>
          <SfxList items={[[0, 'whoosh', 0.3, 1.6], [eyeEnd, 'swish', 0.3, 1.2], [noCalc + 10, 'pop', 0.7, 0.9], [noCalc + 12, 'fizz', 0.3, 1.3], [noCalc + 14, 'whoosh', 0.2, 1.8],
            [here, 'tap', 0.3], [freeze + 16, 'tap', 0.4, 0.7], [why - 4, 'slide', 0.3], [why + 14, 'tap', 0.45], [m0, 'rise', 0.35, 0.8],
            ...Array.from({length: Math.floor(D / fps)}).map((_, k) => [k * fps + 8, k % 2 ? 'tock' : 'tick', 0.26] as [number, 'tick' | 'tock', number])]} />
        </>
      }
      svg={
        <g>
          {f < eyeEnd ? (
            // close on Axo's eye (the near eye of the side-view head sits about here)
            <g transform={`translate(960 540) scale(${eyeZ}) translate(-885 -354)`}>
              <rect x={0} y={0} width={1920} height={1080} fill={PAPER} />
              <AxoSide x={760} y={760} scale={1.6} rear={1} arm={-10} sweat />
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
              {/* macro: graphite grains, then atoms, wall to wall */}
              {grains > 0 && (
                <g opacity={grains * (1 - atoms)}>
                  <rect x={0} y={0} width={1920} height={1080} fill="#bdb6ab" />
                  {Array.from({length: 90}).map((_, i) => (
                    <path key={i} transform={`translate(${random(`gx${i}`) * 1920} ${random(`gy${i}`) * 1080}) rotate(${random(`ga${i}`) * 180}) scale(${1.4 + random(`gs${i}`) * 2})`}
                          d="M -30 -10 L -6 -26 L 26 -14 L 30 12 L 4 26 L -24 16 Z" fill={INK} opacity={0.25 + random(`go${i}`) * 0.4} />
                  ))}
                </g>
              )}
              {atoms > 0 && (
                <g opacity={atoms}>
                  <rect x={0} y={0} width={1920} height={1080} fill={PAPER} />
                  {Array.from({length: 13 * 8}).map((_, i) => {
                    const c = i % 13, r = Math.floor(i / 13);
                    return <circle key={i} cx={c * 160 + (r % 2) * 80 + Math.sin(f / 3 + i) * 4} cy={r * 145 + 20 + Math.cos(f / 4 + i) * 4} r={46} fill={ORANGE} fillOpacity={0.35} stroke={INK} strokeWidth={3} />;
                  })}
                </g>
              )}
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
