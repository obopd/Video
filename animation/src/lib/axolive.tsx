// Drop-in adapters for the new Axo rigs (AxoRig side view, AxoFrontRig front/back view).
// AxoLive takes the same props as the old AxoSide, so existing scenes switch to the new
// design by import alone; it adds the rig's idle life: breathing, blinks, gill and tail sway.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AxoRig, REST_POSE, type RigPose} from './axorig';
import {AxoFrontRig, FRONT_REST, type FrontPose} from './axofront';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Natural blinks: a quick close every few seconds, offset per character. */
const blinkAt = (f: number, seed = 0) => {
  const period = 97 + (seed % 5) * 11;
  const t = (f + seed * 37) % period;
  return t < 5 ? Math.sin((t / 5) * Math.PI) : 0;
};

export type AxoLiveProps = {
  x: number; y: number; scale?: number; dir?: 1 | -1; rear?: number; arm?: number;
  holding?: 'pencil' | null; sweat?: boolean; wink?: boolean; run?: number; look?: number;
  happy?: number; wide?: number; squeeze?: number; seed?: number; headTilt?: number; arch?: number;
};

/** Side view (replaces AxoSide). (x, y) = ground under the hips; faces +x. */
export const AxoLive: React.FC<AxoLiveProps> = ({
  x, y, scale = 1, dir = 1, rear = 0, arm = 40, holding = null, sweat = false, wink = false, run, look = 0,
  happy = 0, wide = 0, squeeze = 0, seed = 0, headTilt = 0, arch = 0,
}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const p: RigPose = {
    ...REST_POSE,
    frame: f, x, y, scale, dir, rear,
    arm, elbow: 0, arm2: arm + 18, elbow2: 0,
    pencil: holding === 'pencil' ? 1 : 0,
    sweat: sweat ? 1 : 0,
    wink: wink ? 1 : 0,
    happy, wide, squeeze, headTilt, arch,
    look: clamp(look / 7, -1, 1),
    breath: Math.sin(t * Math.PI * 2 / 2.6 + seed),
    blink: wink ? 0 : blinkAt(f, seed),
    tailPhase: t * 0.45 + seed * 0.3, tailAmp: 6,
    gillPhase: t * 0.7 + seed * 0.2, gillAmp: 5,
    gait: run !== undefined ? run : 0, moving: run !== undefined ? 1 : 0,
  };
  return <AxoRig p={p} />;
};

export type AxoFrontLiveProps = {
  x: number; y: number; scale?: number; rear?: number; look?: number; sweat?: boolean; back?: boolean;
  armL?: number; armR?: number; elbowL?: number; elbowR?: number; seed?: number; lean?: number; wide?: number;
};

/** Front (or back) view. (x, y) = ground point between the feet. */
export const AxoFrontLive: React.FC<AxoFrontLiveProps> = ({
  x, y, scale = 1, rear = 1, look = 0, sweat = false, back = false, armL = 22, armR = 22, elbowL = 10, elbowR = 10, seed = 0, lean = 0, wide = 0,
}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const p: FrontPose = {
    ...FRONT_REST,
    frame: f, x, y, scale, rear, back, lean, wide,
    turn: clamp(look / 7, -1, 1) * 0.6,
    armL, armR, elbowL, elbowR,
    sweat: sweat ? 1 : 0,
    breath: Math.sin(t * Math.PI * 2 / 2.6 + seed),
    blink: blinkAt(f, seed),
    tailPhase: t * 0.45, gillPhase: t * 0.7 + seed * 0.2,
  };
  return <AxoFrontRig p={p} />;
};
