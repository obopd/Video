// AxoRig: the black side-view Axo (same look as AxoSide in cast.tsx), rebuilt as a
// real character rig so it can move like an animated character instead of
// switching between fixed drawings.
//
//   * bendable spine (hips -> neck) drawn as overlapping ink discs, so the body
//     arches, rears up, breathes and squashes smoothly
//   * 10-segment tail with a travelling wave, curl, and ground contact
//   * 2-bone IK legs: feet stay planted on the ground while the body moves
//   * front limbs blend continuously from legs (on all fours) to arms (reared up)
//   * head on the neck that stays mostly upright, with lagging follow-through
//   * 6 gills with sway, flare (excited / droopy) and spring lag
//   * no mouth: emotion is in the eyes (blink, look, wide, happy ^ ^, sleepy, wink, squeezed > <)
//   * optional pencil in hand, sweat drops
//
// Usage: build a RigPose per frame (see simulateRig for springs + gait) and render
// <AxoRig p={pose} />. (x, y) = ground under the hips; faces +x when dir = 1.
import React from 'react';
import {INK, PAPER, COBALT, COBALT_TINT, Gill, Pencil} from './cast';

type V = [number, number];
const D2R = Math.PI / 180;
const rot = (v: V, deg: number): V => {
  const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sstep = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

export type RigPose = {
  frame: number;
  x: number; y: number; scale: number;
  /** 1 faces right, -1 faces left; values in between are mid-turn. */
  dir: number;
  /** Jump height above the ground (rig units, up). */
  lift: number;
  /** 0 on all fours .. 1 reared up on the hind legs. */
  rear: number;
  /** Extra spine bend in degrees (+ = chest up). */
  arch: number;
  /** Body height offset (units, + = up); feet stay on the ground. */
  bob: number;
  /** Lower the hips/belly toward the ground (units). */
  crouch: number;
  /** Squash & stretch around the feet. */
  sx: number; sy: number;
  breath: number;
  /** Head tilt in degrees (+ = nose up). */
  headTilt: number;
  look: number; lookY: number;
  blink: number; happy: number; wide: number; sleep: number; wink: number;
  /** 0..1 eyes squeezed shut (> <), for effort, yawning, bracing. */
  squeeze: number;
  /** Near arm: shoulder angle in world degrees (0 = forward, -90 = up), elbow bend. */
  arm: number; elbow: number;
  arm2: number; elbow2: number;
  /** Gait: phase in cycles, stride and step height in units, 0..1 how much it is walking. */
  gait: number; stride: number; stepLift: number; moving: number;
  /** Extra lift of the hind feet (dance taps). */
  tapNear: number; tapFar: number;
  tailPhase: number; tailAmp: number; tailCurl: number;
  gillPhase: number; gillAmp: number; gillFlare: number;
  pencil: number; sweat: number;
  /** Secondary motion (from simulateRig): lag of the head and tail, head rotation lag. */
  headLag: V; tailLag: V; headSpin: number;
};

export const REST_POSE: RigPose = {
  frame: 0, x: 960, y: 900, scale: 1, dir: 1, lift: 0, rear: 0, arch: 0, bob: 0, crouch: 0, sx: 1, sy: 1, breath: 0,
  headTilt: 0, look: 0, lookY: 0, blink: 0, happy: 0, wide: 0, sleep: 0, wink: 0, squeeze: 0,
  arm: 40, elbow: 0, arm2: 40, elbow2: 0,
  gait: 0, stride: 40, stepLift: 12, moving: 0, tapNear: 0, tapFar: 0,
  tailPhase: 0, tailAmp: 6, tailCurl: 0, gillPhase: 0, gillAmp: 5, gillFlare: 0,
  pencil: 0, sweat: 0, headLag: [0, 0], tailLag: [0, 0], headSpin: 0,
};

// ---------------------------------------------------------------- skeleton
const FWD_LEN = [24, 24, 24, 24, 24, 22];
const FWD_R = [32, 40, 44, 45, 43, 38, 32];
const TAIL_N = 10, TAIL_SEG = 19;
const TAIL_R = [30, 28, 25, 22, 19, 16, 13, 10, 8, 6, 4];
const GILLS: [number, number, number, number, number][] = [ // x, y, angle, len, flare sign
  [-38, -34, -145, 52, -1], [-50, -6, -178, 58, 0], [-40, 22, 152, 52, 1],
];

const ik = (hip: V, target: V, l1: number, l2: number, bendForward: boolean): [V, V] => {
  const dx = target[0] - hip[0], dy = target[1] - hip[1];
  const dRaw = Math.hypot(dx, dy);
  const d = clamp(dRaw, 1e-3, l1 + l2 - 1e-3);
  const ux = dx / (dRaw || 1), uy = dy / (dRaw || 1);
  const end: V = [hip[0] + ux * d, hip[1] + uy * d];
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const m: V = [hip[0] + ux * a, hip[1] + uy * a];
  const k1: V = [m[0] - uy * h, m[1] + ux * h];
  const k2: V = [m[0] + uy * h, m[1] - ux * h];
  const knee = (k1[0] > k2[0]) === bendForward ? k1 : k2;
  return [knee, end];
};

/** Foot offset along x and lift for a leg at gait phase p (cycles). */
const footCycle = (p: number, stride: number, lift: number): [number, number] => {
  const u = ((p % 1) + 1) % 1;
  if (u < 0.5) return [stride * (0.5 - u / 0.5), 0];
  const s = (u - 0.5) / 0.5;
  return [stride * (-0.5 + sstep(s)), lift * Math.sin(Math.PI * s)];
};

export type RigGeometry = {
  spine: {c: V; r: number}[];
  neckAngle: number;
  headC: V; headAngle: number; headScale: number;
  hind: {hip: V; knee: V; foot: V; tilt: number}[];
  front: {sh: V; joint: V; end: V; armness: number}[];
};

export const rigGeometry = (p: RigPose): RigGeometry => {
  const breathK = 1 + 0.018 * p.breath;
  const hip: V = [0, -42 - p.bob + p.crouch];

  // forward spine (hips -> neck)
  const fwd: V[] = [hip];
  const angs: number[] = [];
  for (let i = 0; i < FWD_LEN.length; i++) {
    const a = -5 - 62 * p.rear - (p.arch * (i + 1)) / FWD_LEN.length;
    angs.push(a);
    fwd.push(add(fwd[i], rot([FWD_LEN[i], 0], a)));
  }
  // the belly rests on the ground instead of sinking into it
  const fwdR = FWD_R.map((r) => r * breathK);
  for (let i = 0; i < fwd.length; i++) fwd[i] = [fwd[i][0], Math.min(fwd[i][1], -(fwdR[i] - 3))];

  // tail (hips -> tip)
  const tail: V[] = [hip];
  let ta = 172;
  for (let i = 1; i <= TAIL_N; i++) {
    const f = i / TAIL_N;
    let a = ta + 1.2 * i + p.tailCurl * f + p.tailAmp * Math.sin(p.tailPhase * Math.PI * 2 - i * 0.55) * f;
    const n: V = [-Math.sin(a * D2R), Math.cos(a * D2R)];
    a += clamp((p.tailLag[0] * n[0] + p.tailLag[1] * n[1]) / 90, -0.6, 0.6) * f * 57.3;
    const nxt = add(tail[i - 1], rot([TAIL_SEG, 0], a));
    tail.push([nxt[0], Math.min(nxt[1], -TAIL_R[i])]);
    if (i === 1) ta = a - 1.2;
  }

  const spine: {c: V; r: number}[] = [];
  const sample = (pts: V[], rs: number[]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      const n = Math.max(1, Math.ceil(len / 3));
      for (let k = 0; k < n; k++) spine.push({c: lerpV(pts[i], pts[i + 1], k / n), r: lerp(rs[i], rs[i + 1], k / n)});
    }
    spine.push({c: pts[pts.length - 1], r: rs[rs.length - 1]});
  };
  sample([...tail].reverse(), [...TAIL_R].reverse());
  sample(fwd, fwdR);

  const neckAngle = angs[angs.length - 1];
  const headAngle = neckAngle * 0.15 - p.headTilt + p.headSpin;
  const headScale = 1 + p.rear * 0.12;
  const neck = fwd[fwd.length - 1];
  const headC = add(add(neck, rot([12 - 16 * p.rear, -8], neckAngle)), rot([6 - 10 * p.rear, -8], headAngle));

  // hind legs: IK to planted feet
  const hind = [
    {off: [12, 6] as V, rest: 18, ph: 0, tap: p.tapNear},
    {off: [-12, 4] as V, rest: -8, ph: 0.5, tap: p.tapFar},
  ].map(({off, rest, ph, tap}) => {
    const hp = add(hip, off);
    const [dx, ly] = footCycle(p.gait + ph, p.stride, p.stepLift);
    const tuck = Math.min(14, p.lift * 0.35);
    const target: V = [rest + dx * p.moving + p.rear * 6, -5 - ly * p.moving - tap - tuck];
    const [knee, foot] = ik(hp, target, 24, 23, true);
    return {hip: hp, knee, foot, tilt: -(ly * p.moving + tap) * 1.4};
  });

  // front limbs: legs on all fours, arms when reared
  const armness = sstep((p.rear - 0.3) / 0.4);
  const a5 = lerp(angs[4], angs[2], armness);
  const shBase = add(lerpV(fwd[5], fwd[3], armness), rot([0, lerp(14, 26, armness)], a5));
  const front = [
    {d: 6, ph: 0.5, arm: p.arm, elbow: p.elbow},
    {d: -8, ph: 0, arm: p.arm2, elbow: p.elbow2},
  ].map(({d, ph, arm, elbow}) => {
    const sh = add(shBase, rot([d, 0], a5));
    const [dx, ly] = footCycle(p.gait + ph, p.stride, p.stepLift);
    const tuck = Math.min(12, p.lift * 0.3);
    const legTarget: V = [sh[0] + 4 + dx * p.moving, -5 - ly * p.moving - tuck];
    const [legJoint, legEnd] = ik(sh, legTarget, 23, 23, false);
    const el = add(sh, rot([31, 0], arm));
    const hand = add(el, rot([31, 0], arm + elbow));
    return {sh, joint: lerpV(legJoint, el, armness), end: lerpV(legEnd, hand, armness), armness};
  });

  return {spine, neckAngle, headC, headAngle, headScale, hind, front};
};

/** World position of a rig-space point for pose p. */
export const rigToWorld = (p: RigPose, v: V): V => [
  p.x + v[0] * p.dir * p.scale * p.sx,
  p.y - p.lift * p.scale + v[1] * p.scale * p.sy,
];

// ---------------------------------------------------------------- drawing
const Limb: React.FC<{a: V; b: V; c: V; w1: number; w2: number}> = ({a, b, c, w1, w2}) => (
  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={w1} />
    <line x1={b[0]} y1={b[1]} x2={c[0]} y2={c[1]} stroke={INK} strokeWidth={w2} />
  </g>
);

const Foot: React.FC<{at: V; tilt: number; armness?: number}> = ({at, tilt, armness = 0}) => {
  const cx = lerp(8, 0, armness), cy = lerp(2, 0, armness), rx = lerp(19, 17, armness), ry = lerp(9, 17, armness);
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${tilt})`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} />
    </g>
  );
};

const Eye: React.FC<{x: number; y: number; r: number; p: RigPose; near: boolean}> = ({x, y, r, p, near}) => {
  const closed = Math.max(p.blink, p.sleep, near ? p.wink : 0);
  const rr = r * (1 + 0.32 * p.wide);
  if (p.squeeze > 0.5) {
    const s = near ? 1 : -1;
    return <path d={`M ${x - s * rr} ${y - rr * 0.75} L ${x + s * rr * 0.7} ${y} L ${x - s * rr} ${y + rr * 0.75}`}
                 stroke={PAPER} strokeWidth={r * 0.42} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  }
  if (p.happy > 0.5 || (near && p.wink > 0.6)) {
    return <path d={`M ${x - rr} ${y + rr * 0.35} Q ${x} ${y - rr * 1.1} ${x + rr} ${y + rr * 0.35}`}
                 stroke={PAPER} strokeWidth={r * 0.48} strokeLinecap="round" fill="none" />;
  }
  if (closed > 0.88) {
    return <path d={`M ${x - rr} ${y - rr * 0.1} Q ${x} ${y + rr * 0.9} ${x + rr} ${y - rr * 0.1}`}
                 stroke={PAPER} strokeWidth={r * 0.42} strokeLinecap="round" fill="none" />;
  }
  return <ellipse cx={x} cy={y + rr * 0.3 * closed} rx={rr} ry={rr * (1 - closed)} fill={PAPER} />;
};

export const AxoRig: React.FC<{p: RigPose}> = ({p}) => {
  const g = rigGeometry(p);
  const [nearH, farH] = g.hind;
  const [nearF, farF] = g.front;
  const f = p.frame;
  // head-space lag for the gills
  const hl = rot([p.headLag[0] / g.headScale, p.headLag[1] / g.headScale], -g.headAngle);
  const sway = Math.sin(p.gillPhase * Math.PI * 2);
  const ex = p.look * 7, ey = p.lookY * 6;

  return (
    <g transform={`translate(${p.x} ${p.y - p.lift * p.scale}) scale(${p.dir * p.scale * p.sx} ${p.scale * p.sy})`}>
      {/* far limbs sit behind the body */}
      <Limb a={farH.hip} b={farH.knee} c={farH.foot} w1={26} w2={23} />
      <Foot at={farH.foot} tilt={farH.tilt} />
      <Limb a={farF.sh} b={farF.joint} c={farF.end} w1={25} w2={22} />
      <Foot at={farF.end} tilt={0} armness={farF.armness} />
      {/* tail + body */}
      {g.spine.map((s, i) => <circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.r} fill={INK} />)}
      <Limb a={nearH.hip} b={nearH.knee} c={nearH.foot} w1={28} w2={24} />
      <Foot at={nearH.foot} tilt={nearH.tilt} />
      {nearF.armness < 0.5 && (
        <>
          <Limb a={nearF.sh} b={nearF.joint} c={nearF.end} w1={26} w2={23} />
          <Foot at={nearF.end} tilt={0} armness={nearF.armness} />
        </>
      )}
      {/* head */}
      <g transform={`translate(${g.headC[0]} ${g.headC[1]}) rotate(${g.headAngle}) scale(${g.headScale})`}>
        {GILLS.map(([gx, gy, ga, len, fs], i) => {
          let a = ga + p.gillAmp * Math.sin(p.gillPhase * Math.PI * 2 + i * 1.7) * (i % 2 ? -1 : 1) + p.gillFlare * fs;
          const n: V = [-Math.sin(a * D2R), Math.cos(a * D2R)];
          a += clamp((hl[0] * n[0] + hl[1] * n[1]) / len, -0.7, 0.7) * 57.3;
          return <Gill key={i} x={gx} y={gy} angle={a + sway * 0.5} len={len} />;
        })}
        <ellipse cx={0} cy={0} rx={66} ry={58} fill={INK} />
        <Eye x={18 + ex} y={-10 + ey} r={13} p={p} near />
        <Eye x={46 + ex * 0.8} y={-12 + ey} r={9.5} p={p} near={false} />
        {p.sweat > 0.02 && [[-20, -70, 1], [-48, -58, 0.7], [30, -74, 0.8]].map(([sx, sy, ss], i) => {
          const fall = ((f * 1.4 + i * 17) % 40) / 40;
          return (
            <path key={i} transform={`translate(${sx} ${sy + fall * 18}) scale(${ss * p.sweat})`} opacity={1 - fall * 0.6}
                  d="M 0 -14 C 7 -2, 9 4, 0 9 C -9 4, -7 -2, 0 -14 Z" fill={COBALT_TINT} stroke={COBALT} strokeWidth={3} />
          );
        })}
      </g>
      {/* near arm in front of everything when reared */}
      {nearF.armness >= 0.5 && (
        <>
          <Limb a={nearF.sh} b={nearF.joint} c={nearF.end} w1={26} w2={24} />
          {p.pencil > 0.01 && (() => {
            const fa = Math.atan2(nearF.end[1] - nearF.joint[1], nearF.end[0] - nearF.joint[0]) / D2R;
            return (
              <g transform={`translate(${nearF.end[0]} ${nearF.end[1]}) rotate(${fa - 14}) scale(${p.pencil * 0.62}) translate(-70 0)`}>
                <Pencil len={230} w={30} />
              </g>
            );
          })()}
          <Foot at={nearF.end} tilt={0} armness={nearF.armness} />
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- simulation
export class Spring {
  p: V | null = null;
  v: V = [0, 0];
  constructor(public k: number, public c: number) {}
  step(target: V, dt: number): V {
    if (!this.p) this.p = [...target] as V;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      const ax = this.k * (target[0] - this.p[0]) - this.c * this.v[0];
      const ay = this.k * (target[1] - this.p[1]) - this.c * this.v[1];
      this.v = [this.v[0] + ax * h, this.v[1] + ay * h];
      this.p = [this.p[0] + this.v[0] * h, this.p[1] + this.v[1] * h];
    }
    return [this.p[0] - target[0], this.p[1] - target[1]];
  }
}

export type RigDriver = Omit<RigPose, 'gait' | 'moving' | 'tailPhase' | 'gillPhase' | 'headLag' | 'tailLag' | 'headSpin'> & {
  /** Tail / gill wave speeds in cycles per second. */
  tailSpeed: number; gillSpeed: number;
  /** Bob added per step while walking (units) and spine rocking while running (deg). */
  stepBob: number; rock: number;
};

export type RigTrack = {poses: RigPose[]; steps: number[]};

/**
 * Turn per-frame driver poses (positions, angles, expressions) into final poses:
 * integrates the gait from the distance travelled (so feet never slide), the tail
 * and gill waves, and damped springs for gill/tail/head follow-through.
 * Also returns the frames where a foot touches down (for footstep sounds).
 */
export const simulateRig = (drivers: RigDriver[], fps: number): RigTrack => {
  const dt = 1 / fps;
  const head = new Spring(140, 9), tail = new Spring(80, 7), spin = new Spring(110, 10);
  let gait = 0, tailPh = 0, gillPh = 0, moving = 0;
  const poses: RigPose[] = [];
  const steps: number[] = [];
  let prevStance: boolean[] | null = null;
  drivers.forEach((d, i) => {
    const prev = drivers[Math.max(0, i - 1)];
    const dist = Math.abs(d.x - prev.x) / d.scale;
    const speed = dist / dt;
    moving += (clamp(speed / 45, 0, 1) - moving) * 0.3;
    gait += dist / (2 * d.stride);
    tailPh += d.tailSpeed * dt;
    gillPh += d.gillSpeed * dt;
    const {tailSpeed, gillSpeed, stepBob, rock, ...rest} = d;
    const phase4 = Math.cos(gait * Math.PI * 4);
    const p: RigPose = {
      ...rest, gait, moving, tailPhase: tailPh, gillPhase: gillPh,
      bob: d.bob + moving * stepBob * (0.5 + 0.5 * phase4),
      arch: d.arch + moving * rock * Math.sin(gait * Math.PI * 2),
      headLag: [0, 0], tailLag: [0, 0], headSpin: 0,
    };
    const g = rigGeometry(p);
    const toLocal = (w: V): V => [w[0] / (p.scale * (p.dir || 1)), w[1] / p.scale];
    p.headLag = toLocal(head.step(rigToWorld(p, g.headC), dt));
    p.tailLag = toLocal(tail.step(rigToWorld(p, g.spine[Math.floor(g.spine.length * 0.15)].c), dt));
    p.headSpin = clamp(spin.step([g.neckAngle, 0], dt)[0] * 0.7, -25, 25);
    poses.push(p);
    // footsteps: a foot entering its stance phase while walking
    const stance = [0, 0.5].map((o) => ((gait + o) % 1) < 0.5);
    if (prevStance && moving > 0.35 && p.lift < 1) stance.forEach((s, k) => { if (s && !prevStance![k]) steps.push(i); });
    prevStance = stance;
  });
  return {poses, steps};
};
