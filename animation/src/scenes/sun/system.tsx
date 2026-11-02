// A tilted top-down solar system shared by the opening and the "drift" scenes.
import React from 'react';
import {C} from '../../lib/theme';
import {Planet, Continents, Label} from '../../lib/shapes';

export const CX = 960;
export const CY = 540;
export const TILT = 0.42; // vertical squash of the orbits, for a 3/4 view

export type Body = {name: string; R: number; r: number; color: string; phase: number; bands?: string};

export const BODIES: Body[] = [
  {name: 'Mercury', R: 150, r: 9, color: C.mercury, phase: 0.6},
  {name: 'Venus', R: 230, r: 16, color: C.venus, phase: 2.4},
  {name: 'Earth', R: 330, r: 19, color: C.earthOcean, phase: 4.1},
  {name: 'Mars', R: 440, r: 13, color: C.mars, phase: 1.2},
  {name: 'Jupiter', R: 640, r: 40, color: C.jupiter, phase: 3.3, bands: C.jupiterBand},
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

export const Orbits: React.FC<{opacity?: number; dashed?: boolean}> = ({opacity = 1, dashed}) => (
  <g opacity={opacity}>
    {BODIES.map((b) => (
      <ellipse key={b.name} cx={CX} cy={CY} rx={b.R} ry={b.R * TILT} fill="none"
               stroke={C.muted} strokeOpacity={0.35} strokeWidth={2}
               strokeDasharray={dashed ? '6 12' : undefined} />
    ))}
  </g>
);

export const PlanetAt: React.FC<{b: Body; x: number; y: number; lit: number; label?: number}> = ({b, x, y, lit, label = 0}) => (
  <g>
    <Planet cx={x} cy={y} r={b.r} color={b.color} bands={b.bands}
            lightAngle={Math.atan2(CY - y, CX - x)} lit={lit}>
      {b.name === 'Earth' && <Continents cx={x} cy={y} r={b.r} color={C.earthLand} />}
    </Planet>
    {label > 0 && <Label x={x} y={y - b.r - 18} size={26} color={C.text} opacity={label}>{b.name}</Label>}
  </g>
);
