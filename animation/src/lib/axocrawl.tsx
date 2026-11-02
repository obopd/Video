// Axo, seen from above, crawling across the paper. An ink-black imp-like axolotl:
// compact body, sharp jagged gill spikes, clawed feet, a thin whip tail with a fin
// tip, and glowing round white eyes. Faces +x at heading 0.
import React from 'react';
import {useCurrentFrame} from 'remotion';

const INK = '#141210', EYE = '#fffaf0';

export type CrawlMood = 'calm' | 'look';

/** Sideways sway of the spine at body position x. */
const sway = (x: number, a: number, moving: number) => {
  const toTail = Math.max(0, (60 - x) / 260);
  return Math.sin(a - x / 55) * (4 + 26 * toTail * toTail) * moving;
};

/** Half-width of the body at x: chunky trunk, then a thin whip tail. */
const width = (x: number) => {
  if (x > 60) return 30;
  if (x > -55) return 38 - Math.abs(x - 5) * 0.06;
  if (x > -80) return 34 - ((-55 - x) / 25) * 26; // quick pinch into the tail
  return Math.max(3, 8 - (-80 - x) * 0.04);
};

/** A sharp gill spike with two small barbs. */
const Spike: React.FC<{x: number; y: number; angle: number; len: number}> = ({x, y, angle, len}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path d={`M 0 -9 L ${len} 0 L 0 9 Z`} fill={INK} />
    <path d={`M ${len * 0.35} -5 L ${len * 0.55} -16 L ${len * 0.55} -3 Z`} fill={INK} />
    <path d={`M ${len * 0.6} 3 L ${len * 0.78} 13 L ${len * 0.76} 1 Z`} fill={INK} />
  </g>
);

/** Stubby leg ending in three sharp claws; swing moves it forward/back around the hip. */
const Leg: React.FC<{x: number; y: number; side: 1 | -1; swing: number}> = ({x, y, side, swing}) => (
  <g transform={`translate(${x} ${y}) rotate(${swing * side})`}>
    <g transform={`rotate(${-18 * side})`}>
      <rect x={-11} y={side > 0 ? 0 : -34} width={22} height={34} rx={11} fill={INK} />
      <g transform={`translate(0 ${34 * side})`}>
        {[-1, 0, 1].map((k) => (
          <path key={k} transform={`rotate(${k * 26 * side})`} d={`M -5 0 L 0 ${16 * side} L 5 0 Z`} fill={INK} />
        ))}
      </g>
    </g>
  </g>
);

export const AxoCrawl: React.FC<{
  x: number; y: number; scale?: number;
  heading?: number;   // degrees, 0 = right
  phase?: number;     // gait phase in cycles; advance it while walking
  moving?: number;    // 0..1, 0 = standing still
  mood?: CrawlMood;
}> = ({x, y, scale = 1, heading = 0, phase = 0, moving = 1, mood = 'calm'}) => {
  const f = useCurrentFrame();
  const a = phase * Math.PI * 2;
  const cycle = (f + 37) % 140;
  const blink = cycle > 134 ? Math.abs(cycle - 137) / 3 : 1;
  const twitch = Math.sin(f / 11) * 4;

  const discs: React.ReactNode[] = [];
  for (let sx = 70; sx >= -200; sx -= 4) {
    discs.push(<circle key={sx} cx={sx} cy={sway(sx, a, moving)} r={width(sx)} fill={INK} />);
  }
  const tipY = sway(-200, a, moving), tipY2 = sway(-192, a, moving);
  const tipAng = (Math.atan2(tipY - tipY2, -8) * 180) / Math.PI;
  const legSwing = (off: number) => Math.sin(a + off) * 30 * moving;
  const headY = sway(110, a, moving);
  const look = mood === 'look' ? 4 : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`}>
      <defs>
        <filter id="eyeglow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation={5} /></filter>
      </defs>
      <Leg x={42} y={sway(42, a, moving) + 26} side={1} swing={legSwing(0)} />
      <Leg x={42} y={sway(42, a, moving) - 26} side={-1} swing={legSwing(Math.PI)} />
      <Leg x={-38} y={sway(-38, a, moving) + 28} side={1} swing={legSwing(Math.PI)} />
      <Leg x={-38} y={sway(-38, a, moving) - 28} side={-1} swing={legSwing(0)} />
      {discs}
      {/* fin tip on the whip tail */}
      <g transform={`translate(-200 ${tipY}) rotate(${tipAng})`}>
        <path d="M 4 0 L -14 -13 L -30 0 L -14 13 Z" fill={INK} />
      </g>
      {/* jagged gill spikes: the devilish crown */}
      {[-1, 1].map((s) => [0, 1, 2].map((k) => (
        <Spike key={`${s}${k}`} x={122 - k * 16} y={headY + s * (34 - k * 3)} len={[46, 54, 42][k]}
               angle={s * ([62, 98, 132][k] + twitch * (k % 2 ? -1 : 1))} />
      )))}
      {/* head: wide and slightly squared */}
      <rect x={78} y={headY - 46} width={100} height={92} rx={40} fill={INK} />
      {/* glowing round eyes */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${152 + look} ${headY + s * 24}) scale(1 ${blink})`}>
          <circle r={15} fill={EYE} opacity={0.35} filter="url(#eyeglow)" />
          <circle r={10} fill={EYE} />
        </g>
      ))}
    </g>
  );
};
