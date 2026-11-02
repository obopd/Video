// Axo crawling: side-view ink silhouette on four short legs, head turned to camera.
// (x, y) = point on the ground under the middle of the body; dir 1 = facing right.
import React from 'react';
import {useCurrentFrame} from 'remotion';

const INK = '#141210', FACE = '#fbf7ef';

export type CrawlMood = 'calm' | 'happy' | 'wow';

/** One leg: a capsule that swings around its hip, with a small round foot. */
const Leg: React.FC<{x: number; swing: number; lift: number}> = ({x, swing, lift}) => (
  <g transform={`translate(${x} 18) rotate(${swing})`}>
    <rect x={-13} y={-6} width={26} height={52 - lift} rx={13} fill={INK} />
    <ellipse cx={4} cy={44 - lift} rx={19} ry={11} fill={INK} />
  </g>
);

const Tuft: React.FC<{x: number; y: number; angle: number}> = ({x, y, angle}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    {[[12, 20], [36, 17], [57, 13]].map(([d, r], k) => <circle key={k} cx={d} cy={0} r={r} fill={INK} />)}
  </g>
);

export const AxoCrawl: React.FC<{
  x: number; y: number; scale?: number; dir?: 1 | -1;
  /** Gait phase in cycles (increase while moving; hold still to stop walking). */
  phase?: number; mood?: CrawlMood; rotate?: number;
}> = ({x, y, scale = 1, dir = 1, phase = 0, mood = 'calm', rotate = 0}) => {
  const f = useCurrentFrame();
  const a = phase * Math.PI * 2;
  // diagonal pairs move together: front-right with back-left
  const sw = (off: number) => Math.sin(a + off) * 24;
  const lift = (off: number) => Math.max(0, Math.cos(a + off)) * 10;
  const bob = Math.abs(Math.sin(a)) * 4;
  const tail = Math.sin(a * 0.5 + f / 30) * 10;
  const wiggle = Math.sin(f / 18) * 4;
  const cycle = f % 130;
  const blink = cycle > 124 ? Math.abs(cycle - 127) / 3 : 1;
  const hx = 128, hy = -78; // head center
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale * dir} ${scale}) translate(0 ${-70 - bob})`}>
      {/* far legs (slightly lower, behind the body) */}
      <Leg x={-70} swing={sw(Math.PI)} lift={lift(Math.PI)} />
      <Leg x={70} swing={sw(0)} lift={lift(0)} />
      {/* tail with a soft fin */}
      <g transform={`rotate(${tail} -120 -20)`}>
        <path d="M -110 -50 C -170 -60, -240 -40, -300 -10 C -240 5, -170 10, -110 6 Z" fill={INK} />
      </g>
      {/* body */}
      <ellipse cx={-10} cy={-22} rx={140} ry={52} fill={INK} />
      {/* near legs */}
      <Leg x={-92} swing={sw(0)} lift={lift(0)} />
      <Leg x={50} swing={sw(Math.PI)} lift={lift(Math.PI)} />
      {/* gills behind the head */}
      <Tuft x={hx - 50} y={hy - 52} angle={-150 + wiggle} />
      <Tuft x={hx - 66} y={hy - 18} angle={-175 - wiggle} />
      <Tuft x={hx - 56} y={hy + 18} angle={160 + wiggle} />
      <Tuft x={hx + 50} y={hy - 58} angle={-40 - wiggle} />
      {/* head, turned toward the camera */}
      <ellipse cx={hx} cy={hy} rx={92} ry={78} fill={INK} />
      {/* face: drawn un-mirrored so it reads the same both directions */}
      <g transform={`translate(${hx + 14} ${hy + 4}) scale(${dir} 1)`}>
        {[-34, 34].map((ex) => (
          mood === 'happy' ? (
            <path key={ex} d={`M ${ex - 13} 2 Q ${ex} -12 ${ex + 13} 2`} stroke={FACE} strokeWidth={7} strokeLinecap="round" fill="none" />
          ) : (
            <circle key={ex} cx={ex} cy={-6} r={(mood === 'wow' ? 17 : 14)} fill={FACE} transform={`translate(0 ${-6 * (1 - blink)}) scale(1 ${blink})`} style={{transformOrigin: `${ex}px -6px`}} />
          )
        ))}
        {mood === 'wow' ? (
          <ellipse cx={0} cy={30} rx={8} ry={10} fill={FACE} />
        ) : (
          <path d="M -12 26 Q -6 33 0 27 Q 6 33 12 26" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </g>
    </g>
  );
};
