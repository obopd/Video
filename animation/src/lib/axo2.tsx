// Axo v2: flat, soft, minimal. A few rounded shapes in one pink, ink eyes and smile
// in the same ink as the type. Drawn around the head center (0,0).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {P} from './paper';

export type Mood = 'calm' | 'happy' | 'curious' | 'wow';

// Ink version: a solid black silhouette with white eyes and smile.
const BODY = '#141210', TUFT = '#141210', FACE = '#fbf7ef';

const Tuft: React.FC<{side: 1 | -1; i: number; wiggle: number}> = ({side, i, wiggle}) => {
  // fluffy tuft: three overlapping puffs getting smaller toward the tip
  const base = [[138, -84], [162, -30], [150, 24]][i];
  const ang = ([-34, -6, 22][i] + wiggle) * side;
  return (
    <g transform={`translate(${base[0] * side} ${base[1]}) rotate(${ang})`}>
      {[[16, 30], [46, 25], [72, 19]].map(([d, r], k) => (
        <circle key={k} cx={d * side} cy={0} r={r} fill={TUFT} />
      ))}
    </g>
  );
};

export const Axo2: React.FC<{x: number; y: number; scale?: number; mood?: Mood; look?: number; peek?: boolean}> = ({
  x, y, scale = 1, mood = 'calm', look = 0, peek = false,
}) => {
  const f = useCurrentFrame();
  const breathe = 1 + Math.sin(f / 26) * 0.012;
  const wiggle = Math.sin(f / (mood === 'wow' ? 4 : 18)) * (mood === 'wow' ? 7 : 3);
  const cycle = f % 120;
  const blink = cycle > 114 ? Math.abs(cycle - 117) / 3 : 1;
  const eyeX = 72, eyeY = -6, lx = look * 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * breathe} ${scale / breathe})`}>
      {!peek && (
        <g>
          <ellipse cx={0} cy={210} rx={120} ry={110} fill={BODY} />
        </g>
      )}
      {[-1, 1].map((s) => [0, 1, 2].map((i) => <Tuft key={`${s}${i}`} side={s as 1 | -1} i={i} wiggle={wiggle * (i % 2 ? -1 : 1)} />))}
      <ellipse cx={0} cy={0} rx={178} ry={138} fill={BODY} />
      {/* eyes */}
      {[-1, 1].map((s) => (
        mood === 'happy' ? (
          <path key={s} d={`M ${s * eyeX - 17} ${eyeY + 6} Q ${s * eyeX} ${eyeY - 14} ${s * eyeX + 17} ${eyeY + 6}`}
                stroke={FACE} strokeWidth={9} strokeLinecap="round" fill="none" />
        ) : (
          <g key={s} transform={`translate(${s * eyeX + lx} ${eyeY}) scale(1 ${blink * (mood === 'wow' ? 1.15 : 1)})`}>
            <ellipse rx={mood === 'wow' ? 22 : 18} ry={mood === 'wow' ? 26 : 22} fill={FACE} />
          </g>
        )
      ))}
      {/* blush + smile */}
      {mood === 'wow' ? (
        <ellipse cx={0} cy={44} rx={11} ry={13} fill={FACE} />
      ) : (
        <path d="M -16 38 Q -8 48 0 40 Q 8 48 16 38" stroke={FACE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
      {/* little hands holding the edge when peeking */}
      {peek && [-1, 1].map((s) => <ellipse key={s} cx={s * 92} cy={128} rx={36} ry={24} fill={BODY} />)}
    </g>
  );
};
