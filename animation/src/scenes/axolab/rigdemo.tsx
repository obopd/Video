// AxoRigDemo: the black Axo performing a string of actions with the new rig
// (idle, walk, rear up + wave, think -> idea, startle, turn + run + skid,
// celebrate hops, dance, yawn + sleep). 32 s at 30 fps, 1920x1080.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Frame, Sfx, SfxList, SfxName, backOut, clamp01} from './kit';
import {Tag, DISPLAY} from '../../lib/paper';
import {INK, PAPER, ORANGE, AxoSide} from '../../lib/cast';
import {AxoRig, REST_POSE, RigDriver, rigGeometry, rigToWorld, simulateRig} from '../../lib/axorig';
import type {SceneProps} from '../../lib/types';

const FPS = 30;
export const RIG_DEMO_FRAMES = 32 * FPS;
const GROUND = 900;
const SCALE = 1.5;

// ---------------------------------------------------------------- keyframe helpers
type Keys = [number, number][];
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const k = (t: number, ks: Keys, e: (x: number) => number = inOut) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * e((t - t0) / (t1 - t0));
  }
  return ks[ks.length - 1][1];
};
/** 0..1 window with soft edges. */
const win = (t: number, a: number, b: number, edge = 0.25) => clamp01((t - a) / edge) * clamp01((b - t) / edge);
const tri = (t: number, at: number, w: number) => Math.max(0, 1 - Math.abs(t - at) / w);

// hops: start, duration, height (units)
const HOPS: [number, number, number][] = [[13.32, 0.45, 50], [15.25, 0.26, 16], [18.0, 0.26, 16], [19.3, 0.45, 70], [20.3, 0.45, 70],
  [24.5, 0.4, 26]];
const hop = (t: number) => {
  let lift = 0, sx = 1, sy = 1;
  for (const [t0, d, h] of HOPS) {
    const pre = (t - (t0 - 0.12)) / 0.12;
    if (pre > 0 && pre < 1) { const q = Math.sin(pre * Math.PI / 2); sx *= 1 + 0.1 * q; sy *= 1 - 0.15 * q; }
    const u = (t - t0) / d;
    if (u >= 0 && u <= 1) {
      lift += 4 * h * u * (1 - u);
      const st = Math.abs(1 - 2 * u) * Math.min(1, h / 50);
      sx *= 1 - 0.07 * st; sy *= 1 + 0.1 * st;
    }
    const l = (t - (t0 + d)) / 0.16;
    if (l > 0 && l < 1) { const q = Math.sin(l * Math.PI) * Math.min(1, h / 40); sx *= 1 + 0.15 * q; sy *= 1 - 0.18 * q; }
  }
  return {lift, sx, sy};
};

const BLINKS = [0.5, 2.6, 5.4, 9.3, 15.0, 22.1, 25.6];
const IDEA = 11.85, POP = 13.25;

const driver = (f: number): RigDriver => {
  const t = f / FPS;
  const h = hop(t);
  const dance = win(t, 22.5, 26.9, 0.3);
  const db = t - 22.5; // dance beat clock (0.5 s per beat)
  const sw = Math.sin((db / 1.0) * Math.PI * 2);
  const run = win(t, 15.5, 17.6, 0.2);

  // near arm (world degrees, 0 = forward, -90 = up)
  let arm = k(t, [[0, 40], [7.2, 40], [7.6, -10], [9.6, -10], [9.95, 30], [10.3, 30], [11.8, 30], [11.95, -20], [13.2, -20],
    [13.36, -30], [13.7, -10], [18.7, 10], [19.0, -15], [21.9, -15], [22.5, -5], [26.9, -5], [27.5, -40], [28.3, -40], [28.8, 40]]);
  let elbow = k(t, [[0, 0], [7.2, 0], [7.6, -60], [9.6, -60], [9.95, 0], [10.3, -140], [11.8, -140], [11.95, -40], [13.2, -40],
    [13.4, -20], [13.7, 0], [18.7, 0], [19.0, -50], [21.9, -50], [22.2, 0], [27.0, 0], [27.5, -10], [28.3, -10], [28.6, 0]]);
  elbow += 32 * Math.sin(t * Math.PI * 2 * 2.2) * win(t, 7.6, 9.6, 0.2);
  elbow += 12 * Math.sin(t * Math.PI * 2 * 3) * win(t, 10.4, 11.7, 0.15);
  elbow += 26 * Math.sin(t * Math.PI * 2 * 2) * win(t, 19.0, 21.9, 0.2);
  arm += 25 * sw * dance;
  elbow += (-40 + 30 * Math.sin((db / 0.5) * Math.PI * 2)) * dance;
  const t2 = t - 0.09; // the far arm follows a beat later (overlapping action)
  let arm2 = k(t2, [[0, 40], [7.2, 40], [7.6, 10], [9.6, 10], [9.95, 30], [11.95, 30], [13.2, 30], [13.36, -60], [13.7, -10],
    [18.7, 10], [19.0, -25], [21.9, -25], [22.5, -10], [26.9, -10], [27.5, -55], [28.3, -55], [28.8, 40]]);
  arm2 += -45 * sw * dance;
  const elbow2 = (-20 + 20 * Math.sin(t2 * Math.PI * 2 * 2)) * win(t, 19.0, 21.9, 0.2) - 30 * dance;

  return {
    ...REST_POSE,
    frame: f,
    x: k(t, [[0, 760], [3.2, 760], [6.8, 1240], [13.32, 1240], [13.77, 1170], [15.6, 1170], [17.3, 470], [17.7, 420],
      [19.3, 420], [19.75, 640], [20.3, 640], [20.75, 860]]),
    y: GROUND,
    scale: SCALE,
    dir: k(t, [[0, 1], [15.27, 1], [15.47, -1], [18.02, -1], [18.22, 1], [24.52, 1], [24.68, -1], [24.86, 1]]),
    lift: h.lift,
    sx: h.sx, sy: h.sy,
    rear: k(t, [[0, 0], [7.0, 0], [7.15, -0.06], [7.6, 1], [13.32, 1], [13.75, 0.1], [13.95, 0], [15.6, 0], [16.0, -0.1], [17.2, -0.1],
      [17.45, 0.25], [17.9, 0], [18.6, 0], [19.05, 1], [28.4, 1], [28.95, 0]]),
    arch: k(t, [[13.2, 0], [13.36, -12], [13.8, 0], [27.0, 0], [27.5, 14], [28.3, 14], [28.7, 0]]) + 9 * sw * dance,
    bob: (7 * Math.abs(Math.sin((db / 0.5) * Math.PI)) - 3) * dance,
    crouch: k(t, [[0, 0], [7.0, 0], [7.15, 6], [7.4, 0], [28.9, 0], [29.8, 17]]),
    breath: Math.sin(t * Math.PI * 2 / k(t, [[0, 2.4], [29, 2.4], [30, 3.6]])) * k(t, [[29, 1], [30, 2.2]]),
    headTilt: k(t, [[0, 0], [0.9, 0], [1.25, 12], [1.9, 12], [2.3, -7], [2.8, 0], [7.4, 0], [7.8, 9], [9.6, 9], [10.2, 4],
      [10.5, 16], [11.8, 16], [11.95, 22], [13.2, 18], [13.36, 28], [13.9, 0], [15.6, 0], [16.0, -8], [17.3, -8], [17.6, 8],
      [18.0, 0], [19.0, 10], [21.9, 10], [22.5, 0], [27.0, 0], [27.5, 28], [28.3, 28], [28.9, -4], [30.0, -14]])
      + 12 * Math.sin((db / 1.0) * Math.PI * 2 + Math.PI / 2) * dance,
    look: k(t, [[0, 0], [0.9, 0], [1.2, -1], [2.0, -1], [2.3, 0.8], [2.9, 0], [10.3, 0], [10.5, 0.4], [11.8, 0.4], [12.0, 0]])
      + 0.8 * sw * dance,
    lookY: k(t, [[10.3, 0], [10.5, -1], [11.8, -1], [12.0, -0.6], [13.2, -0.6], [13.4, 0]]),
    blink: Math.max(0, ...BLINKS.map((b) => tri(t, b, 0.1))),
    happy: k(t, [[7.7, 0], [7.85, 1], [9.6, 1], [9.75, 0], [12.0, 0], [12.1, 1], [12.6, 1], [12.7, 0], [19.1, 0], [19.25, 1],
      [21.8, 1], [21.9, 0], [22.5, 0], [22.6, 1], [24.4, 1], [24.5, 0]]),
    wide: k(t, [[11.8, 0], [11.88, 1], [12.0, 0], [13.22, 0], [13.3, 1], [15.2, 1], [15.4, 0.4], [17.9, 0.4], [18.3, 0]]),
    sleep: k(t, [[28.3, 0], [28.4, 0.5], [29.4, 0.6], [29.7, 1]]),
    wink: k(t, [[21.9, 0], [22.0, 1], [22.25, 1], [22.35, 0]]),
    squeeze: k(t, [[27.3, 0], [27.4, 1], [28.3, 1], [28.4, 0]]),
    arm, elbow, arm2, elbow2,
    stride: k(t, [[0, 40], [15.5, 40], [15.7, 72], [17.9, 72], [18.1, 40]]),
    stepLift: k(t, [[0, 12], [15.5, 12], [15.7, 22], [17.9, 22], [18.1, 12]]),
    tapNear: 12 * Math.max(0, sw) * dance,
    tapFar: 12 * Math.max(0, -sw) * dance,
    tailAmp: 6 + 10 * run + 16 * dance + 8 * win(t, 19.0, 21.9) - 4 * clamp01((t - 29) / 1),
    tailCurl: k(t, [[29, 0], [30, -30]]),
    gillAmp: 5 + 6 * win(t, 7.6, 9.6) + 8 * win(t, 13.3, 15.0) + 6 * dance + 5 * win(t, 19.0, 21.9) - 3 * clamp01((t - 29) / 1),
    gillFlare: k(t, [[7.5, 0], [7.8, 10], [9.6, 10], [9.9, 0], [11.85, 0], [11.95, 16], [12.6, 4], [13.25, 4], [13.32, 28], [14.2, 6],
      [18.5, 6], [19.0, 12], [26.9, 12], [27.3, 0], [29.0, 0], [30, -10]]),
    pencil: k(t, [[10.0, 0], [10.25, 1], [13.1, 1], [13.3, 0]], (x) => backOut(x)),
    sweat: k(t, [[13.3, 0], [13.4, 1], [18.5, 1], [18.8, 0]]),
    tailSpeed: 1.2 + 1.2 * run + 1.0 * dance + 0.8 * win(t, 3.2, 6.8) - 0.6 * clamp01((t - 29) / 1),
    gillSpeed: 0.5 + 0.9 * win(t, 13.3, 18.5) + 0.8 * dance - 0.2 * clamp01((t - 29) / 1),
    stepBob: k(t, [[0, 2.5], [15.5, 2.5], [15.7, 7], [17.9, 7], [18.1, 2.5]]),
    rock: 7 * run,
  };
};

const TRACK = simulateRig(Array.from({length: RIG_DEMO_FRAMES}, (_, f) => driver(f)), FPS);

// where the light bulb hangs: above the head at the moment of the idea
const BULB = (() => {
  const p = TRACK.poses[Math.round(IDEA * FPS)];
  const g = rigGeometry(p);
  const [hx, hy] = rigToWorld(p, g.headC);
  return {x: hx + 40, y: hy - 175};
})();

const LABELS: [number, number, string][] = [
  [0, 3.1, 'IDLE · LOOK AROUND'], [3.2, 6.95, 'WALK · FEET STAY PLANTED'], [7.0, 9.95, 'REAR UP · WAVE'],
  [10.0, 13.2, 'THINK · IDEA!'], [13.25, 15.2, 'STARTLE'], [15.25, 18.5, 'TURN · RUN · SKID'], [18.6, 22.4, 'CELEBRATE'],
  [22.5, 26.95, 'DANCE'], [27.0, 32, 'YAWN · SLEEP'],
];

// ---------------------------------------------------------------- props + effects
const Bulb: React.FC<{t: number}> = ({t}) => {
  const a = backOut(clamp01((t - IDEA - 0.05) / 0.3));
  if (t < IDEA || t > POP) return null;
  const wob = Math.sin(t * 9) * 4;
  return (
    <g transform={`translate(${BULB.x} ${BULB.y}) scale(${a}) rotate(${wob})`}>
      <circle r={95} fill={ORANGE} opacity={0.16 + 0.05 * Math.sin(t * 12)} />
      {Array.from({length: 8}).map((_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return <line key={i} x1={Math.cos(ang) * 70} y1={Math.sin(ang) * 70 - 8} x2={Math.cos(ang) * 92} y2={Math.sin(ang) * 92 - 8}
                     stroke={ORANGE} strokeWidth={7} strokeLinecap="round" />;
      })}
      <path d="M -40 -12 A 46 46 0 1 1 40 -12 C 32 8, 22 18, 22 34 L -22 34 C -22 18, -32 8, -40 -12 Z" fill={PAPER} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -12 34 L -8 4 L 0 14 L 8 4 L 12 34" fill="none" stroke={ORANGE} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-24} y={34} width={48} height={24} rx={6} fill={PAPER} stroke={INK} strokeWidth={6} />
      <line x1={-20} y1={46} x2={20} y2={46} stroke={INK} strokeWidth={4} />
    </g>
  );
};

const Pop: React.FC<{t: number}> = ({t}) => {
  const u = (t - POP) / 0.45;
  if (u <= 0 || u >= 1) return null;
  return (
    <g transform={`translate(${BULB.x} ${BULB.y})`} opacity={1 - u}>
      <circle r={40 + u * 120} fill="none" stroke={ORANGE} strokeWidth={10 * (1 - u) + 2} />
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * (50 + u * 90)} y1={Math.sin(a) * (50 + u * 90)} x2={Math.cos(a) * (80 + u * 150)}
                     y2={Math.sin(a) * (80 + u * 150)} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Ink dust puffs: [time, x, direction]. */
const PUFFS: [number, number, number][] = [];
for (const [t0, d] of HOPS) PUFFS.push([t0 + d, -1, 0]);
for (let t = 17.3; t < 17.75; t += 0.07) PUFFS.push([t, -1, 1]);

const Dust: React.FC<{t: number}> = ({t}) => (
  <g>
    {PUFFS.flatMap(([t0, , skid], i) => {
      const u = (t - t0) / 0.55;
      if (u <= 0 || u >= 1) return [];
      const p = TRACK.poses[Math.min(TRACK.poses.length - 1, Math.round(t0 * FPS))];
      return [-1, 1].map((s) => {
        if (skid && s > 0) return null;
        const x = p.x + s * (40 + 140 * Math.pow(u, 0.6)) * (skid ? 0.6 : 1) + (skid ? 40 * p.dir : 0);
        return <circle key={`${i}${s}`} cx={x} cy={GROUND - 10 - 30 * u} r={10 + 22 * u} fill="none" stroke={INK} strokeWidth={4 * (1 - u) + 0.5}
                       opacity={0.55 * (1 - u)} />;
      });
    })}
  </g>
);

const Notes: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 9}).map((_, i) => {
      const t0 = 22.5 + i * 0.5;
      const u = (t - t0) / 1.4;
      if (u <= 0 || u >= 1) return null;
      const s = i % 2 ? 1 : -1;
      return (
        <text key={i} x={860 + s * (230 + 60 * u) + 15 * Math.sin(u * 9)} y={520 - 200 * u} fontSize={86} fontFamily={DISPLAY}
              fontWeight={700} fill={i % 3 === 1 ? ORANGE : INK} opacity={Math.min(1, 3 * (1 - u))} textAnchor="middle">
          {i % 2 ? '♪' : '♫'}
        </text>
      );
    })}
  </g>
);

const Zzz: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 3}).map((_, i) => {
      const t0 = 30.0 + i * 0.7;
      const u = (t - t0) / 2.0;
      if (u <= 0 || u >= 1) return null;
      return (
        <text key={i} x={1010 + 70 * u + 10 * Math.sin(u * 7)} y={700 - 190 * u} fontSize={40 + 50 * u} fontFamily={DISPLAY} fontWeight={700}
              fill={INK} opacity={Math.min(1, 3 * (1 - u))}>z</text>
      );
    })}
  </g>
);

const Ground: React.FC = () => (
  <g stroke={INK} strokeLinecap="round">
    <line x1={70} y1={GROUND + 8} x2={1850} y2={GROUND + 8} strokeWidth={5} />
    {[150, 330, 610, 1010, 1380, 1590, 1760].map((x, i) => (
      <line key={i} x1={x} y1={GROUND + 30 + (i % 2) * 12} x2={x + 40 + (i % 3) * 20} y2={GROUND + 30 + (i % 2) * 12} strokeWidth={4} opacity={0.35} />
    ))}
  </g>
);

const Shadow: React.FC<{lift: number; x: number}> = ({lift, x}) => {
  const k = 1 / (1 + (lift * SCALE) / 260);
  return <ellipse cx={x + 40} cy={GROUND + 8} rx={170 * k} ry={14 * k} fill={INK} opacity={0.1 * k} />;
};

// ---------------------------------------------------------------- sound
const SFX: [number, SfxName, number?, number?][] = [
  ...TRACK.steps.map((f, i): [number, SfxName, number, number] => [f, 'tap', 0.22, 0.9 + (i % 3) * 0.08]),
  [7.15 * FPS, 'swish', 0.4], [7.8 * FPS, 'sparkle', 0.45], [10.05 * FPS, 'pop', 0.5], [10.6 * FPS, 'tick', 0.3], [11.0 * FPS, 'tick', 0.3],
  [11.4 * FPS, 'tick', 0.3], [IDEA * FPS, 'ding', 0.6], [POP * FPS, 'bang', 0.6], [13.3 * FPS, 'boing', 0.4], [13.77 * FPS, 'thud', 0.5],
  [15.25 * FPS, 'swish', 0.45], [15.6 * FPS, 'whoosh', 0.5], [17.3 * FPS, 'slide', 0.55], [18.0 * FPS, 'swish', 0.45],
  [19.25 * FPS, 'hop', 0.5], [19.75 * FPS, 'thud', 0.35], [19.8 * FPS, 'confetti', 0.4], [20.25 * FPS, 'hop', 0.5], [20.75 * FPS, 'thud', 0.35],
  [21.95 * FPS, 'blip', 0.4], [24.45 * FPS, 'swish', 0.4], [24.9 * FPS, 'thud', 0.3],
  ...Array.from({length: 9}, (_, i): [number, SfxName, number] => [(22.5 + i * 0.5) * FPS, i % 2 ? 'tock' : 'tick', 0.45]),
  [27.3 * FPS, 'rise', 0.35], [29.3 * FPS, 'slide', 0.2], [30.0 * FPS, 'blip', 0.2], [30.7 * FPS, 'blip', 0.18], [31.4 * FPS, 'blip', 0.16],
];

export const AxoRigDemo: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = TRACK.poses[Math.min(f, TRACK.poses.length - 1)];
  const label = LABELS.find(([a, b]) => t >= a && t < b);
  const la = label ? Math.min(clamp01((t - label[0]) / 0.25), clamp01((label[1] - t) / 0.25)) : 0;
  return (
    <>
      <Frame
        push={0}
        html={label && (
          <div style={{position: 'absolute', left: 0, width: 1920, top: 60, textAlign: 'center', opacity: la,
            transform: `translateY(${(1 - la) * -12}px)`}}>
            <Tag>{label[2]}</Tag>
          </div>
        )}
        svg={
          <g>
            <Ground />
            <Shadow lift={p.lift} x={p.x} />
            <Dust t={t} />
            <AxoRig p={p} />
            <Bulb t={t} />
            <Pop t={t} />
            <Notes t={t} />
            <Zzz t={t} />
          </g>
        }
      />
      <SfxList items={SFX} />
      <Sfx at={0} name="tick" volume={0} />
    </>
  );
};

/** Side-by-side check: original AxoSide (top) vs AxoRig (bottom), on all fours and reared. */
export const AxoRigCompare: React.FC<SceneProps> = () => {
  const base = {...REST_POSE, scale: 1.3, frame: 0};
  const a = {...base, x: 420, y: 980};
  const b = {...base, x: 1260, y: 980, rear: 1, arm: -60, elbow: 0, arm2: -30};
  return (
    <Frame push={0} still svg={
      <g>
        <AxoSide x={420} y={430} scale={1.3} />
        <AxoSide x={1260} y={430} scale={1.3} rear={1} arm={-60} />
        <line x1={0} x2={1920} y1={438} y2={438} stroke={INK} strokeWidth={2} opacity={0.3} />
        <line x1={0} x2={1920} y1={988} y2={988} stroke={INK} strokeWidth={2} opacity={0.3} />
        <AxoRig p={a} />
        <AxoRig p={b} />
      </g>
    } />
  );
};
