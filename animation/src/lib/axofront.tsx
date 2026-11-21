// AxoFrontRig: the black Axo seen from the FRONT or the BACK, as a rig
// (companion to AxoRig, the side view). Same ink-silhouette style as AxoFace:
// wide head, three feathery gills per side, two round white eyes, no outline.
//
//   * spine (hips -> neck) that leans and sways; rear 0 = on all fours, 1 = standing
//   * 2-bone IK hind legs (knees bend outward), stepping in place or walking
//   * front limbs blend from splayed legs (all fours) to arms (standing)
//   * head roll + head turn (eyes slide toward the side; from the back an eye
//     peeks around the edge of the head when Axo looks over its shoulder)
//   * tail: behind the body from the front, lying toward the camera from the back
//   * gills sway / flare and lag on springs (see simulateFront)
// (x, y) = ground point between the feet.
import React from 'react';
import {INK, PAPER, COBALT, COBALT_TINT, Gill} from './cast';
import {Spring} from './axorig';

type V = [number, number];
const D2R = Math.PI / 180;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const rot = (v: V, deg: number): V => {
  const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sstep = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

export type FrontPose = {
  frame: number;
  x: number; y: number; scale: number;
  /** false = facing the camera, true = seen from behind. */
  back: boolean;
  /** Horizontal squash used while turning around (1 = normal). */
  wk: number;
  lift: number; sx: number; sy: number; bob: number; crouch: number; breath: number;
  /** 0 on all fours .. 1 standing on the hind legs. */
  rear: number;
  /** Body lean (deg, + = to screen right) and head roll (deg). */
  lean: number; headTilt: number;
  /** Head turn -1..1 (+ = toward screen right). */
  turn: number; lookY: number;
  blink: number; happy: number; wide: number; sleep: number; wink: number; mouth: number;
  /** Arms by screen side; angle from straight down (0) outward (+90 sideways, 180 up); elbow bends further outward. */
  armL: number; elbowL: number; armR: number; elbowR: number;
  /** Stepping: phase in cycles, 0..1 amount, foot lift height; extra taps; stance width. */
  step: number; stepAmt: number; stepLift: number; tapL: number; tapR: number; stance: number;
  tailPhase: number; tailAmp: number;
  gillPhase: number; gillAmp: number; gillFlare: number;
  sweat: number;
  headLag: V;
};

export const FRONT_REST: FrontPose = {
  frame: 0, x: 960, y: 900, scale: 1, back: false, wk: 1, lift: 0, sx: 1, sy: 1, bob: 0, crouch: 0, breath: 0, rear: 1,
  lean: 0, headTilt: 0, turn: 0, lookY: 0, blink: 0, happy: 0, wide: 0, sleep: 0, wink: 0, mouth: 0,
  armL: 22, elbowL: 10, armR: 22, elbowR: 10, step: 0, stepAmt: 0, stepLift: 14, tapL: 0, tapR: 0, stance: 0,
  tailPhase: 0, tailAmp: 0.5, gillPhase: 0, gillAmp: 5, gillFlare: 0, sweat: 0, headLag: [0, 0],
};

// gills from AxoFace (left side; mirrored for the right), scaled to this rig
const GILLS: [number, number, number, number, number][] = [ // x, y, angle, len, flare sign
  [-66, -30, -128, 52, -1], [-78, -6, -156, 58, 0], [-75, 19, -182, 50, 1],
];

const ik = (hip: V, target: V, l1: number, l2: number, out: number): [V, V] => {
  const dx = target[0] - hip[0], dy = target[1] - hip[1];
  const dRaw = Math.hypot(dx, dy);
  const d = clamp(dRaw, 1e-3, l1 + l2 - 1e-3);
  const ux = dx / (dRaw || 1), uy = dy / (dRaw || 1);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const m: V = [hip[0] + ux * a, hip[1] + uy * a];
  const k1: V = [m[0] - uy * h, m[1] + ux * h];
  const k2: V = [m[0] + uy * h, m[1] - ux * h];
  return [(k1[0] - k2[0]) * out > 0 ? k1 : k2, [hip[0] + ux * d, hip[1] + uy * d]];
};

export const frontGeometry = (p: FrontPose) => {
  const bk = 1 + 0.018 * p.breath;
  const hip: V = [0, -54 - p.bob + p.crouch];
  const len = lerp(26, 96, p.rear);
  const spine: {c: V; r: number}[] = [];
  const R = [36, 44, 45, 40];
  const N = 24;
  let top: V = hip;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = -90 + p.lean * (0.6 + 0.6 * t);
    const c: V = add(hip, rot([len * t, 0], a));
    const ri = t * (R.length - 1);
    const r = lerp(R[Math.floor(ri)], R[Math.min(R.length - 1, Math.floor(ri) + 1)], ri - Math.floor(ri)) * bk;
    spine.push({c: [c[0], Math.min(c[1], -(r - 4))], r});
    top = c;
  }
  const headC: V = add(top, rot([0, -lerp(24, 42, p.rear)], p.lean * 1.1));
  const headAngle = p.lean * 0.5 + p.headTilt;

  // tail: behind (front view) or toward the camera (back view)
  const tail: {c: V; r: number}[] = [];
  {
    const sw = Math.sin(p.tailPhase * Math.PI * 2) * p.tailAmp;
    let c: V = add(hip, [0, 14]);
    let a = p.back ? 90 + sw * 40 : -90 + sw * 80;
    for (let i = 0; i <= 11; i++) {
      const r = lerp(28, 5, i / 11);
      tail.push({c, r});
      a += (p.back ? sw * 6 : sw * 4) + (p.back ? 0 : (i > 3 ? sw * 3 : 0));
      c = add(c, rot([12, 0], a));
      if (!p.back) c = [c[0], Math.min(c[1], -r + 2)];
    }
  }

  const armness = sstep((p.rear - 0.3) / 0.4);
  const limbs = ([-1, 1] as const).map((s) => {
    // hind leg
    const ph = Math.sin((p.step + (s > 0 ? 0.5 : 0)) * Math.PI * 2);
    const lift = Math.max(0, ph) * p.stepLift * p.stepAmt + (s < 0 ? p.tapL : p.tapR) + Math.min(14, p.lift * 0.35);
    const hp: V = add(hip, [s * 22, 8]);
    const [knee, foot] = ik(hp, [s * (30 + p.stance), -6 - lift], 24, 23, s);
    // front limb: shoulder on the chest
    const shT = Math.round(N * lerp(0.95, 0.78, armness));
    const sh: V = add(spine[shT].c, rot([s * lerp(30, 38, armness), 6], p.lean));
    const swing = Math.sin((p.step + (s > 0 ? 0 : 0.5)) * Math.PI * 2);
    const legT: V = [s * 74 + swing * 4 * p.stepAmt, -6 - Math.max(0, swing) * p.stepLift * p.stepAmt * 0.8 - Math.min(12, p.lift * 0.3)];
    const [lj, le] = ik(sh, legT, 30, 30, s);
    const a1 = s < 0 ? p.armL : p.armR, a2 = s < 0 ? p.elbowL : p.elbowR;
    const d1: V = [s * Math.sin(a1 * D2R), Math.cos(a1 * D2R)];
    const d2: V = [s * Math.sin((a1 + a2) * D2R), Math.cos((a1 + a2) * D2R)];
    const el = add(sh, [d1[0] * 31, d1[1] * 31]);
    const hand = add(el, [d2[0] * 31, d2[1] * 31]);
    return {s, hp, knee, foot, lift, sh, joint: lerpV(lj, el, armness), end: lerpV(le, hand, armness), armness};
  });
  return {hip, spine, tail, headC, headAngle, limbs};
};

const Limb: React.FC<{a: V; b: V; c: V; w1: number; w2: number}> = ({a, b, c, w1, w2}) => (
  <g strokeLinecap="round" fill="none" stroke={INK}>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w1} />
    <line x1={b[0]} y1={b[1]} x2={c[0]} y2={c[1]} strokeWidth={w2} />
  </g>
);

const Eye: React.FC<{x: number; y: number; r: number; p: FrontPose; wink?: boolean}> = ({x, y, r, p, wink}) => {
  const closed = Math.max(p.blink, p.sleep, wink ? p.wink : 0);
  const rr = r * (1 + 0.3 * p.wide);
  if (p.happy > 0.5 || (wink && p.wink > 0.6)) {
    return <path d={`M ${x - rr} ${y + rr * 0.35} Q ${x} ${y - rr * 1.1} ${x + rr} ${y + rr * 0.35}`}
                 stroke={PAPER} strokeWidth={r * 0.45} strokeLinecap="round" fill="none" />;
  }
  if (closed > 0.88) {
    return <path d={`M ${x - rr} ${y - rr * 0.1} Q ${x} ${y + rr * 0.9} ${x + rr} ${y - rr * 0.1}`}
                 stroke={PAPER} strokeWidth={r * 0.4} strokeLinecap="round" fill="none" />;
  }
  return <ellipse cx={x} cy={y + rr * 0.3 * closed} rx={rr} ry={rr * (1 - closed)} fill={PAPER} />;
};

let clipSeq = 0;

export const AxoFrontRig: React.FC<{p: FrontPose}> = ({p}) => {
  const g = frontGeometry(p);
  const sway = Math.sin(p.gillPhase * Math.PI * 2);
  const hl = rot(p.headLag, -g.headAngle);
  const clipId = React.useMemo(() => `axoHead${clipSeq++}`, []);
  const tailEl = g.tail.map((d, i) => <circle key={`t${i}`} cx={d.c[0]} cy={d.c[1]} r={d.r} fill={INK} />);
  const t = p.turn;
  return (
    <g transform={`translate(${p.x} ${p.y - p.lift * p.scale}) scale(${p.scale * p.sx * p.wk} ${p.scale * p.sy})`}>
      {!p.back && tailEl}
      {/* hind legs and feet */}
      {g.limbs.map((l) => (
        <g key={`h${l.s}`}>
          <Limb a={l.hp} b={l.knee} c={l.foot} w1={27} w2={24} />
          <ellipse cx={l.foot[0] + l.s * 6} cy={l.foot[1] + 1} rx={p.back ? 15 : 17} ry={9} fill={INK}
                   transform={`rotate(${-l.s * l.lift * 0.8} ${l.foot[0]} ${l.foot[1]})`} />
        </g>
      ))}
      {/* body */}
      {g.spine.map((d, i) => <circle key={`b${i}`} cx={d.c[0]} cy={d.c[1]} r={d.r} fill={INK} />)}
      {p.back && tailEl}
      {/* front limbs: legs when on all fours (drawn under the head), arms when standing */}
      {g.limbs.map((l) => (
        <g key={`f${l.s}`}>
          <Limb a={l.sh} b={l.joint} c={l.end} w1={26} w2={23} />
          <ellipse cx={l.end[0] + l.s * 4 * (1 - l.armness)} cy={l.end[1]} rx={lerp(17, 16, l.armness)} ry={lerp(9, 16, l.armness)} fill={INK} />
        </g>
      ))}
      {/* head */}
      <g transform={`translate(${g.headC[0]} ${g.headC[1]}) rotate(${g.headAngle})`}>
        {([-1, 1] as const).map((s) => (
          <g key={s} transform={`scale(${s} 1)`}>
            {GILLS.map(([gx, gy, ga, len, fs], i) => {
              // turning: the gills on the side Axo turns toward tuck in, the others fan out
              const tk = 1 - 0.18 * t * s * (p.back ? -1 : 1);
              let a = ga + p.gillAmp * Math.sin(p.gillPhase * Math.PI * 2 + i * 1.7 + (s > 0 ? 0.8 : 0)) * (i % 2 ? -1 : 1)
                - p.gillFlare * fs;
              const n: V = [-Math.sin(a * D2R), Math.cos(a * D2R)];
              a += clamp(((hl[0] * s) * n[0] + hl[1] * n[1]) / len, -0.7, 0.7) * 57.3;
              return <g key={i} transform={`translate(${gx * tk} ${gy}) scale(1.1)`}><Gill x={0} y={0} angle={a + sway * 0.5} len={len} /></g>;
            })}
          </g>
        ))}
        <ellipse cx={0} cy={0} rx={92} ry={68} fill={INK} />
        {!p.back ? (
          <>
            <Eye x={-38 + t * 28} y={-8 + p.lookY * 6} r={16 * (1 - Math.max(0, t) * 0.25)} p={p} wink />
            <Eye x={38 + t * 28} y={-8 + p.lookY * 6} r={16 * (1 + Math.min(0, t) * 0.25)} p={p} />
            {p.mouth > 0.04 && <ellipse cx={t * 30} cy={28} rx={5 + 7 * p.mouth} ry={5 + 10 * p.mouth} fill={PAPER} />}
          </>
        ) : (
          Math.abs(t) > 0.05 && (
            <>
              <defs><clipPath id={clipId}><ellipse cx={0} cy={0} rx={92} ry={68} /></clipPath></defs>
              {/* looking over the shoulder: one eye peeks round the edge of the head */}
              <g clipPath={`url(#${clipId})`}>
                <Eye x={Math.sign(t) * (112 - 40 * Math.min(1, Math.abs(t)))} y={-8} r={15} p={p} />
              </g>
            </>
          )
        )}
        {p.sweat > 0.02 && [[-60, -70, 1], [-88, -50, 0.7], [64, -72, 0.8]].map(([sx, sy, ss], i) => {
          const fall = ((p.frame * 1.4 + i * 17) % 40) / 40;
          return (
            <path key={i} transform={`translate(${sx} ${sy + fall * 18}) scale(${ss * p.sweat})`} opacity={1 - fall * 0.6}
                  d="M 0 -14 C 7 -2, 9 4, 0 9 C -9 4, -7 -2, 0 -14 Z" fill={COBALT_TINT} stroke={COBALT} strokeWidth={3} />
          );
        })}
      </g>
    </g>
  );
};

export type FrontDriver = Omit<FrontPose, 'tailPhase' | 'gillPhase' | 'headLag'> & {tailSpeed: number; gillSpeed: number};

/** Integrates tail/gill waves and the head spring for a whole timeline of driver poses. */
export const simulateFront = (drivers: FrontDriver[], fps: number): FrontPose[] => {
  const dt = 1 / fps;
  const head = new Spring(140, 9);
  let tp = 0, gp = 0;
  return drivers.map((d) => {
    tp += d.tailSpeed * dt;
    gp += d.gillSpeed * dt;
    const {tailSpeed, gillSpeed, ...rest} = d;
    const p: FrontPose = {...rest, tailPhase: tp, gillPhase: gp, headLag: [0, 0]};
    const g = frontGeometry(p);
    const w: V = [p.x + g.headC[0] * p.scale * p.sx * p.wk, p.y - p.lift * p.scale + g.headC[1] * p.scale * p.sy];
    const lag = head.step(w, dt);
    p.headLag = [lag[0] / p.scale, lag[1] / p.scale];
    return p;
  });
};
