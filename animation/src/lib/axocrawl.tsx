// Axo, seen from above, crawling across the paper: slender ink silhouette,
// wide flat head with feathery gills, four splayed legs in a diagonal gait,
// a body that sways side to side, two round white eyes. Faces +x at rotate 0.
import React from 'react';
import {useCurrentFrame} from 'remotion';

const INK = '#141210', EYE = '#fbf7ef';

export type CrawlMood = 'calm' | 'look';

/** Spine offset (sideways sway) at body position x, for gait phase a. */
const sway = (x: number, a: number, moving: number) => {
  const toTail = Math.max(0, (90 - x) / 380); // 0 near the head, grows toward the tail
  return Math.sin(a - x / 70) * (6 + 30 * toTail) * moving;
};

/** Body half-width at position x (head is drawn separately). */
const width = (x: number) => {
  if (x > 70) return 20;
  if (x > -70) return 24 - Math.abs(x) * 0.02;
  return Math.max(1.5, 22 * (1 - (-70 - x) / 230)); // tail tapers to a point
};

const Gill: React.FC<{x: number; y: number; angle: number}> = ({x, y, angle}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={0} y={-4} width={46} height={8} rx={4} fill={INK} />
    {[12, 22, 32, 40].map((d) => (
      <g key={d}>
        <rect x={d} y={-12} width={4.5} height={10} rx={2.2} fill={INK} transform={`rotate(-30 ${d} -2)`} />
        <rect x={d} y={2} width={4.5} height={10} rx={2.2} fill={INK} transform={`rotate(30 ${d} 2)`} />
      </g>
    ))}
    <circle cx={47} cy={0} r={6} fill={INK} />
  </g>
);

/** A splayed leg with little toes; swing rotates it forward/back around the hip. */
const Leg: React.FC<{x: number; y: number; side: 1 | -1; swing: number}> = ({x, y, side, swing}) => (
  <g transform={`translate(${x} ${y}) rotate(${swing * side})`}>
    <rect x={-7} y={side > 0 ? 0 : -42} width={14} height={42} rx={7} fill={INK} transform={`rotate(${-20 * side})`} />
    <g transform={`rotate(${-20 * side}) translate(0 ${42 * side})`}>
      {[-12, -4, 4, 12].map((t, i) => (
        <rect key={i} x={t - 2.5} y={side > 0 ? -2 : -10} width={5} height={12} rx={2.5} fill={INK} transform={`rotate(${(i - 1.5) * 18 * side})`} />
      ))}
    </g>
  </g>
);

export const AxoCrawl: React.FC<{
  x: number; y: number; scale?: number;
  /** Heading in degrees (0 = right). */
  heading?: number;
  /** Gait phase in cycles; advance it while walking. */
  phase?: number;
  /** 0..1 how much it is walking (0 = standing still, legs and body settle). */
  moving?: number;
  mood?: CrawlMood;
}> = ({x, y, scale = 1, heading = 0, phase = 0, moving = 1, mood = 'calm'}) => {
  const f = useCurrentFrame();
  const a = phase * Math.PI * 2;
  const cycle = (f + 37) % 140;
  const blink = cycle > 134 ? Math.abs(cycle - 137) / 3 : 1;
  const gillWiggle = Math.sin(f / 14) * 5;

  // body silhouette as overlapping discs along a swaying spine
  const discs: React.ReactNode[] = [];
  for (let sx = 90; sx >= -300; sx -= 5) {
    discs.push(<circle key={sx} cx={sx} cy={sway(sx, a, moving)} r={width(sx)} fill={INK} />);
  }
  const legSwing = (off: number) => Math.sin(a + off) * 28 * moving;
  const headY = sway(110, a, moving);
  const look = mood === 'look' ? 4 : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`}>
      {/* legs: front-left with back-right, front-right with back-left */}
      <Leg x={46} y={sway(46, a, moving) + 14} side={1} swing={legSwing(0)} />
      <Leg x={46} y={sway(46, a, moving) - 14} side={-1} swing={legSwing(Math.PI)} />
      <Leg x={-62} y={sway(-62, a, moving) + 14} side={1} swing={legSwing(Math.PI)} />
      <Leg x={-62} y={sway(-62, a, moving) - 14} side={-1} swing={legSwing(0)} />
      {discs}
      {/* gills fan back from both sides of the head */}
      {[-1, 1].map((s) => [0, 1, 2].map((k) => (
        <Gill key={`${s}${k}`} x={112 - k * 12} y={headY + s * (30 - k * 2)} angle={s * (62 + k * 30 + gillWiggle * (k % 2 ? -1 : 1))} />
      )))}
      {/* wide, flat head */}
      <ellipse cx={128} cy={headY} rx={44} ry={40} fill={INK} />
      <ellipse cx={150} cy={headY} rx={30} ry={34} fill={INK} />
      {/* eyes near the front edges of the head */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${148 + look} ${headY + s * 22}) scale(1 ${blink})`}>
          <circle r={8} fill={EYE} />
        </g>
      ))}
    </g>
  );
};
