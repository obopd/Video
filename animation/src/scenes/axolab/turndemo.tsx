// AxoTurnDemo: one continuous take switching between the side rig (AxoRig) and the
// front/back rig (AxoFrontRig): walk in from the side, stand, turn to the front,
// turn to the back, look over the shoulder, turn to the side, walk off. 12 s.
// The swap happens at the thinnest point of a quick squash, with the head kept in place.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Frame, SfxList, SfxName, clamp01} from './kit';
import {Tag} from '../../lib/paper';
import {INK} from '../../lib/cast';
import {AxoRig, REST_POSE, RigDriver, rigGeometry, simulateRig} from '../../lib/axorig';
import {AxoFrontRig, FRONT_REST, FrontDriver, simulateFront} from '../../lib/axofront';
import type {SceneProps} from '../../lib/types';

const FPS = 30, FRAMES = 12 * FPS, GROUND = 880, SCALE = 1.5;

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
const win = (t: number, a: number, b: number, e = 0.2) => clamp01((t - a) / e) * clamp01((b - t) / e);
const tri = (t: number, at: number, w: number) => Math.max(0, 1 - Math.abs(t - at) / w);

// horizontal distance from the hips to the head centre when reared (side rig units)
const HEAD_DX = (() => {
  const g = rigGeometry({...REST_POSE, rear: 1});
  return g.headC[0];
})();

const TURNS: [number, number][] = [[3.4, 0.32], [5.6, 0.32], [7.7, 0.32]];
const view = (t: number) => {
  const mids = TURNS.map(([a, d]) => a + d / 2);
  return t < mids[0] ? 'side' : t < mids[1] ? 'front' : t < mids[2] ? 'back' : 'sideL';
};
const squash = (t: number) => {
  let wk = 1, lift = 0;
  for (const [t0, d] of TURNS) {
    const u = (t - t0) / d;
    if (u > 0 && u < 1) { wk = Math.max(0.1, Math.abs(Math.cos(Math.PI * u))); lift = 4 * 12 * u * (1 - u); }
  }
  return {wk, lift};
};

const HIPS_IN = 860;
const HEAD_X = HIPS_IN + HEAD_DX * SCALE;        // where the head sits while facing front/back
const HIPS_LEFT = HEAD_X + HEAD_DX * SCALE;      // hips when facing left with the head in the same place

const sideDriver = (f: number): RigDriver => {
  const t = f / FPS;
  const sq = squash(t);
  const left = t >= 7.86;
  return {
    ...REST_POSE, frame: f, y: GROUND, scale: SCALE,
    // while squashing for a turn, keep the head (not the hips) in place
    x: sq.wk < 1 ? HEAD_X - (left ? -1 : 1) * HEAD_DX * SCALE * sq.wk
      : left ? k(t, [[9.4, HIPS_LEFT], [12, HIPS_LEFT - 900]]) : k(t, [[0, 360], [2.4, HIPS_IN]]),
    dir: left ? -1 : 1,
    sx: sq.wk, lift: sq.lift,
    rear: k(t, [[0, 0], [2.6, 0], [2.75, -0.05], [3.2, 1], [8.6, 1], [9.2, 0]]),
    crouch: k(t, [[2.6, 0], [2.75, 5], [3.0, 0]]),
    breath: Math.sin(t * Math.PI * 2 / 2.4),
    blink: tri(t, 1.4, 0.1) + tri(t, 8.4, 0.1),
    arm: 40, arm2: 40,
    headTilt: k(t, [[2.6, 0], [3.0, 6], [3.4, 0]]),
    tailSpeed: 1.2, gillSpeed: 0.55, stepBob: 2.5, rock: 0,
  };
};

const frontDriver = (f: number): FrontDriver => {
  const t = f / FPS;
  const sq = squash(t);
  const wave = win(t, 4.2, 5.2);
  return {
    ...FRONT_REST, frame: f, x: HEAD_X, y: GROUND, scale: SCALE,
    back: view(t) === 'back', wk: sq.wk, lift: sq.lift,
    breath: Math.sin(t * Math.PI * 2 / 2.4),
    blink: tri(t, 4.0, 0.1),
    happy: win(t, 4.3, 5.1, 0.08),
    turn: k(t, [[3.7, 0], [3.8, 0], [4.0, -0.4], [4.2, 0], [6.1, 0], [6.4, 1], [7.1, 1], [7.4, 0]]),
    headTilt: k(t, [[4.1, 0], [4.3, 8], [5.1, 8], [5.3, 0], [6.1, 0], [6.4, 6], [7.1, 6], [7.4, 0]]),
    armR: k(t, [[4.0, 22], [4.3, 100], [5.1, 100], [5.4, 22]]),
    elbowR: 10 + (40 + 30 * Math.sin(t * Math.PI * 2 * 2.2)) * wave,
    gillFlare: 6 * wave,
    tailSpeed: 0.8, gillSpeed: 0.55,
  };
};

const SIDE = simulateRig(Array.from({length: FRAMES}, (_, f) => sideDriver(f)), FPS);
const FRONT = simulateFront(Array.from({length: FRAMES}, (_, f) => frontDriver(f)), FPS);

const LABELS: [number, number, string][] = [
  [0, 3.5, 'SIDE'], [3.5, 5.7, 'FRONT'], [5.7, 7.8, 'BACK · LOOK OVER SHOULDER'], [7.8, 12, 'SIDE'],
];
const SFX: [number, SfxName, number?, number?][] = [
  ...SIDE.steps.map((f): [number, SfxName, number] => [f, 'tap', 0.22]),
  ...TURNS.map(([t0]): [number, SfxName, number] => [t0 * FPS, 'swish', 0.4]),
  [4.3 * FPS, 'sparkle', 0.4], [6.3 * FPS, 'pop', 0.3],
];

export const AxoTurnDemo: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const v = view(t);
  const label = LABELS.find(([a, b]) => t >= a && t < b);
  const sp = SIDE.poses[Math.min(f, FRAMES - 1)];
  const fp = FRONT[Math.min(f, FRAMES - 1)];
  const sx = v === 'side' || v === 'sideL' ? sp.x + 40 * sp.dir * SCALE : fp.x;
  return (
    <>
      <Frame
        push={0}
        html={label && <div style={{position: 'absolute', left: 0, width: 1920, top: 60, textAlign: 'center'}}><Tag>{label[2]}</Tag></div>}
        svg={
          <g>
            <line x1={70} x2={1850} y1={GROUND + 8} y2={GROUND + 8} stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <ellipse cx={sx} cy={GROUND + 8} rx={160} ry={14} fill={INK} opacity={0.1} />
            {v === 'side' || v === 'sideL' ? <AxoRig p={sp} /> : <AxoFrontRig p={fp} />}
          </g>
        }
      />
      <SfxList items={SFX} />
    </>
  );
};
