// AxoFrontBackDemo: the black Axo facing the camera and from behind (30 s, 1920x1080).
// Front: idle + look around, stand up, wave, walk toward the camera, dance, jump, shrug.
// Turn around. Back: look over the shoulder, walk away, cheer, drop to all fours.
// Turn back to the front and wink.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Frame, SfxList, SfxName, clamp01} from './kit';
import {Tag, DISPLAY} from '../../lib/paper';
import {INK, ORANGE} from '../../lib/cast';
import {AxoFrontRig, FRONT_REST, FrontDriver, simulateFront} from '../../lib/axofront';
import type {SceneProps} from '../../lib/types';

const FPS = 30;
const FRAMES = 30 * FPS;
const WALL = 420;

type Keys = [number, number][];
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const k = (t: number, ks: Keys) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * inOut((t - t0) / (t1 - t0));
  }
  return ks[ks.length - 1][1];
};
const win = (t: number, a: number, b: number, e = 0.25) => clamp01((t - a) / e) * clamp01((b - t) / e);
const tri = (t: number, at: number, w: number) => Math.max(0, 1 - Math.abs(t - at) / w);

const HOPS: [number, number, number][] = [[12.6, 0.5, 70], [16.62, 0.3, 18], [23.6, 0.35, 30], [24.4, 0.35, 30], [27.02, 0.3, 18]];
const hop = (t: number) => {
  let lift = 0, sx = 1, sy = 1;
  for (const [t0, d, h] of HOPS) {
    const pre = (t - (t0 - 0.13)) / 0.13;
    if (pre > 0 && pre < 1) { const q = Math.sin(pre * Math.PI / 2); sx *= 1 + 0.1 * q; sy *= 1 - 0.15 * q; }
    const u = (t - t0) / d;
    if (u >= 0 && u <= 1) {
      lift += 4 * h * u * (1 - u);
      const st = Math.abs(1 - 2 * u) * Math.min(1, h / 50);
      sx *= 1 - 0.07 * st; sy *= 1 + 0.1 * st;
    }
    const l = (t - (t0 + d)) / 0.16;
    if (l > 0 && l < 1) { const q = Math.sin(l * Math.PI) * Math.min(1, h / 40); sx *= 1 + 0.14 * q; sy *= 1 - 0.17 * q; }
  }
  return {lift, sx, sy};
};

// turning around: squash to a sliver and swap front <-> back at the middle
const TURNS: [number, number][] = [[16.62, 0.3], [27.02, 0.3]];
const turnState = (t: number) => {
  let wk = 1, back = t >= TURNS[0][0] + TURNS[0][1] / 2 && t < TURNS[1][0] + TURNS[1][1] / 2;
  for (const [t0, d] of TURNS) {
    const u = (t - t0) / d;
    if (u > 0 && u < 1) wk = Math.max(0.1, Math.abs(Math.cos(Math.PI * u)));
  }
  return {wk, back};
};

const WALKS: [number, number][] = [[6.0, 9.0], [20.0, 23.0]];
const STEP_HZ = 1.7;
const BLINKS = [1.1, 4.0, 7.8, 14.0, 28.0];

const driver = (f: number): FrontDriver => {
  const t = f / FPS;
  const h = hop(t);
  const ts = turnState(t);
  const walk = Math.max(...WALKS.map(([a, b]) => win(t, a, b, 0.3)));
  const step = t * STEP_HZ;
  const ws = Math.sin(step * Math.PI * 2);
  const dance = win(t, 9.0, 12.0, 0.3);
  const sw = Math.sin(((t - 9) / 1.0) * Math.PI * 2);
  const beat = Math.abs(Math.sin(((t - 9) / 0.5) * Math.PI));
  const wave = win(t, 3.7, 5.7, 0.2);
  const cheer = win(t, 23.3, 25.3, 0.25);
  const shrug = win(t, 14.4, 16.0, 0.3);

  return {
    ...FRONT_REST,
    frame: f,
    back: ts.back, wk: ts.wk,
    x: k(t, [[0, 960], [20, 960], [23, 1060]]) + 14 * ws * walk + 22 * sw * dance,
    y: k(t, [[0, 860], [6.0, 860], [9.0, 1000], [20.0, 1000], [23.0, 840]]),
    scale: k(t, [[0, 1.4], [6.0, 1.4], [9.0, 1.85], [20.0, 1.85], [23.0, 1.3]]),
    lift: h.lift, sx: h.sx, sy: h.sy,
    rear: k(t, [[0, 0], [2.5, 0], [2.6, -0.04], [3.2, 1], [25.5, 1], [26.2, 0]]),
    bob: 3 * Math.abs(Math.cos(step * Math.PI * 2)) * walk + (6 * beat - 2) * dance + 5 * shrug,
    crouch: k(t, [[2.4, 0], [2.55, 5], [2.9, 0]]),
    breath: Math.sin(t * Math.PI * 2 / 2.4),
    lean: 4 * ws * walk + 9 * sw * dance + k(t, [[14.3, 0], [14.7, -5], [16.0, -5], [16.3, 0]]),
    headTilt: -6 * ws * walk - 12 * sw * dance + k(t, [[3.6, 0], [3.9, 8], [5.7, 8], [6.0, 0], [14.3, 0], [14.7, 14], [16.0, 14],
      [16.3, 0], [18.2, 0], [18.6, 8], [19.3, 8], [19.6, 0], [27.5, 0], [28.6, 0], [28.8, -8], [29.6, -8]]),
    turn: k(t, [[0.6, 0], [0.9, -0.8], [1.5, -0.8], [1.8, 0.8], [2.2, 0.8], [2.4, 0], [16.4, 0], [16.75, 1], [16.76, 0],
      [18.2, 0], [18.6, 1], [19.3, 1], [19.6, 0], [26.85, 0], [27.15, -1], [27.17, 0]]) + 0.35 * sw * dance,
    lookY: k(t, [[14.3, 0], [14.7, -1], [16.0, -1], [16.3, 0]]),
    blink: Math.max(0, ...BLINKS.map((b) => tri(t, b, 0.1))),
    happy: Math.max(win(t, 3.9, 5.6, 0.1), win(t, 9.2, 11.9, 0.1), win(t, 12.7, 13.6, 0.1)),
    wide: win(t, 12.3, 12.62, 0.05),
    wink: win(t, 28.7, 29.3, 0.08),
    mouth: 0.4 * win(t, 12.62, 13.0, 0.06),
    armL: k(t, [[0, 22], [12.3, 22], [12.45, 8], [12.65, 118], [13.1, 118], [13.3, 60], [14.0, 22], [14.3, 22], [14.7, 50],
      [16.0, 50], [16.3, 22], [23.1, 22], [23.4, 112], [25.2, 112], [25.5, 22]]) + 15 * ws * walk - 60 * sw * dance + 78 * dance,
    armR: k(t, [[0, 22], [3.3, 22], [3.7, 100], [5.7, 100], [6.0, 22], [12.3, 22], [12.45, 8], [12.65, 118], [13.1, 118], [13.3, 60],
      [14.0, 22], [14.3, 22], [14.7, 50], [16.0, 50], [16.3, 22], [23.1, 22], [23.4, 112], [25.2, 112], [25.5, 22]])
      - 15 * ws * walk + 60 * sw * dance + 78 * dance,
    elbowL: 10 + 80 * shrug + 25 * dance + (-5 + 22 * Math.sin(t * Math.PI * 2 * 2.4)) * cheer,
    elbowR: 10 + (50 + 30 * Math.sin(t * Math.PI * 2 * 2.2)) * wave + 80 * shrug + 25 * dance
      + (-5 + 22 * Math.sin(t * Math.PI * 2 * 2.4 + 1)) * cheer,
    step, stepAmt: walk, stepLift: 16,
    tapL: 12 * Math.max(0, sw) * dance, tapR: 12 * Math.max(0, -sw) * dance,
    stance: k(t, [[0, 0], [2.5, 0], [3.2, 4]]),
    tailAmp: 0.35 + 0.3 * walk + 0.4 * dance + 0.5 * win(t, 25.8, 27.0, 0.2) + 0.3 * cheer,
    tailSpeed: 0.8 + 0.9 * walk + 1.2 * dance + 1.6 * win(t, 25.8, 27.0, 0.2),
    gillAmp: 5 + 5 * dance + 5 * cheer,
    gillSpeed: 0.55 + 0.6 * dance + 0.5 * cheer,
    gillFlare: k(t, [[3.6, 0], [3.9, 8], [5.7, 8], [6.0, 0], [12.5, 0], [12.65, 24], [13.6, 4], [14.2, 0], [23.2, 0], [23.4, 12],
      [25.3, 12], [25.6, 0], [28.6, 0], [28.75, 14], [29.4, 4]]),
  };
};

const POSES = simulateFront(Array.from({length: FRAMES}, (_, f) => driver(f)), FPS);

// a footstep every half step-cycle while walking
const STEPS: number[] = [];
for (let f = 1; f < FRAMES; f++) {
  const t = f / FPS;
  const inWalk = WALKS.some(([a, b]) => t > a + 0.3 && t < b - 0.2);
  if (inWalk && Math.floor(t * STEP_HZ * 2) !== Math.floor(((f - 1) / FPS) * STEP_HZ * 2)) STEPS.push(f);
}

const LABELS: [number, number, string][] = [
  [0, 2.45, 'FRONT · IDLE · LOOK AROUND'], [2.5, 3.3, 'STAND UP'], [3.3, 6.0, 'WAVE'], [6.0, 9.0, 'WALK TOWARD CAMERA'],
  [9.0, 12.0, 'DANCE'], [12.0, 14.0, 'JUMP'], [14.0, 16.5, 'SHRUG'], [16.5, 17.0, 'TURN AROUND'],
  [17.0, 20.0, 'BACK · LOOK OVER SHOULDER'], [20.0, 23.0, 'WALK AWAY'], [23.0, 25.5, 'CHEER FROM BEHIND'],
  [25.5, 26.95, 'DOWN ON ALL FOURS · TAIL WAG'], [27.0, 30.0, 'TURN TO FRONT · WINK'],
];

const SFX: [number, SfxName, number?, number?][] = [
  ...STEPS.map((f, i): [number, SfxName, number, number] => [f, 'tap', 0.25, 0.9 + (i % 3) * 0.08]),
  [2.55 * FPS, 'rise', 0.3], [3.75 * FPS, 'sparkle', 0.45],
  ...Array.from({length: 6}, (_, i): [number, SfxName, number] => [(9 + i * 0.5) * FPS, i % 2 ? 'tock' : 'tick', 0.45]),
  [12.5 * FPS, 'boing', 0.45], [13.1 * FPS, 'thud', 0.45], [14.6 * FPS, 'blip', 0.35],
  [16.6 * FPS, 'swish', 0.45], [16.95 * FPS, 'tap', 0.35], [18.5 * FPS, 'pop', 0.3],
  [23.55 * FPS, 'hop', 0.4], [23.95 * FPS, 'tap', 0.3], [24.35 * FPS, 'hop', 0.4], [24.75 * FPS, 'tap', 0.3], [23.8 * FPS, 'confetti', 0.35],
  [26.0 * FPS, 'slide', 0.25], [27.0 * FPS, 'swish', 0.45], [27.35 * FPS, 'tap', 0.35], [28.7 * FPS, 'ding', 0.4],
];

const Notes: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => (
  <g>
    {Array.from({length: 6}).map((_, i) => {
      const t0 = 9 + i * 0.5;
      const u = (t - t0) / 1.3;
      if (u <= 0 || u >= 1) return null;
      const s = i % 2 ? 1 : -1;
      return (
        <text key={i} x={x + s * (300 + 50 * u) + 14 * Math.sin(u * 9)} y={y - 120 - 200 * u} fontSize={90} fontFamily={DISPLAY}
              fontWeight={700} fill={i % 3 === 1 ? ORANGE : INK} opacity={Math.min(1, 3 * (1 - u))} textAnchor="middle">
          {i % 2 ? '♪' : '♫'}
        </text>
      );
    })}
  </g>
);

export const AxoFrontBackDemo: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = POSES[Math.min(f, POSES.length - 1)];
  const label = LABELS.find(([a, b]) => t >= a && t < b);
  const la = label ? Math.min(clamp01((t - label[0]) / 0.2), clamp01((label[1] - t) / 0.2)) : 0;
  const shadowK = 1 / (1 + (p.lift * p.scale) / 260);
  return (
    <>
      <Frame
        push={0}
        html={label && (
          <div style={{position: 'absolute', left: 0, width: 1920, top: 60, textAlign: 'center', opacity: la}}>
            <Tag>{label[2]}</Tag>
          </div>
        )}
        svg={
          <g>
            <line x1={70} x2={1850} y1={WALL} y2={WALL} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            {[260, 520, 1400, 1660].map((x, i) => (
              <line key={i} x1={x} x2={x + 50} y1={WALL + 360 + i * 60} y2={WALL + 360 + i * 60} stroke={INK} strokeWidth={4} opacity={0.25} strokeLinecap="round" />
            ))}
            <ellipse cx={p.x} cy={p.y + 4} rx={110 * p.scale * shadowK * Math.max(0.3, p.wk)} ry={13 * p.scale * shadowK} fill={INK} opacity={0.1 * shadowK} />
            <AxoFrontRig p={p} />
            <Notes t={t} x={p.x} y={p.y - 260 * p.scale} />
          </g>
        }
      />
      <SfxList items={SFX} />
    </>
  );
};
