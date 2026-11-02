// A tilted top-down solar system shared by the opening and the "drift" scenes.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../../lib/theme';
import {Label} from '../../lib/shapes';
import {Globe} from '../../lib/globe';
import {DetailedPlanet} from '../../lib/bodies';

export const CX = 960;
export const CY = 540;
export const TILT = 0.42; // vertical squash of the orbits, for a 3/4 view

export type Body = {name: string; R: number; r: number; phase: number; kind: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter'};

export const BODIES: Body[] = [
  {name: 'Mercury', R: 150, r: 10, phase: 0.6, kind: 'mercury'},
  {name: 'Venus', R: 230, r: 17, phase: 2.4, kind: 'venus'},
  {name: 'Earth', R: 330, r: 21, phase: 4.1, kind: 'earth'},
  {name: 'Mars', R: 440, r: 14, phase: 1.2, kind: 'mars'},
  {name: 'Jupiter', R: 640, r: 44, phase: 3.3, kind: 'jupiter'},
];

/** Angular speed in radians/frame; inner planets are faster (Kepler: w ~ R^-1.5). */
export const omega = (R: number) => 0.0075 * Math.pow(330 / R, 1.5);

export const orbitPos = (b: Body, frame: number) => {
  const a = b.phase + omega(b.R) * frame;
  return {x: CX + b.R * Math.cos(a), y: CY + b.R * TILT * Math.sin(a), a};
};

/** Position if gravity switches off at `release`: the planet continues along its tangent. */
export const driftPos = (b: Body, frame: number, release: number) => {
  if (frame <= release) return orbitPos(b, frame);
  const p = orbitPos(b, release);
  const w = omega(b.R);
  const vx = -b.R * w * Math.sin(p.a);
  const vy = b.R * TILT * w * Math.cos(p.a);
  const t = frame - release;
  return {x: p.x + vx * t, y: p.y + vy * t, a: p.a};
};

/** Convert a 2D direction toward the light into the Globe's light offset (lon, lat degrees). */
export const lightFrom2D = (dx: number, dy: number): [number, number] => {
  const len = Math.hypot(dx, dy) || 1;
  return [(dx / len) * 80, (-dy / len) * 60];
};

export const Orbits: React.FC<{opacity?: number; dashed?: boolean}> = ({opacity = 1, dashed}) => (
  <g opacity={opacity}>
    {BODIES.map((b) => (
      <ellipse key={b.name} cx={CX} cy={CY} rx={b.R} ry={b.R * TILT} fill="none"
               stroke={C.muted} strokeOpacity={0.3} strokeWidth={2}
               strokeDasharray={dashed ? '6 12' : undefined} />
    ))}
  </g>
);

export const PlanetAt: React.FC<{b: Body; x: number; y: number; lit: number; label?: number}> = ({b, x, y, lit, label = 0}) => {
  const f = useCurrentFrame();
  const angle = Math.atan2(CY - y, CX - x);
  return (
    <g>
      {b.kind === 'earth' ? (
        <Globe cx={x} cy={y} r={b.r} lon={20 + f * 0.6} lat={20} light={lightFrom2D(CX - x, CY - y)}
               daylight={lit} cityLights={1 - lit} />
      ) : (
        <DetailedPlanet kind={b.kind} cx={x} cy={y} r={b.r} lightAngle={angle} lit={lit} />
      )}
      {label > 0 && <Label x={x} y={y - b.r - 20} size={26} color={C.text} opacity={label}>{b.name}</Label>}
    </g>
  );
};
