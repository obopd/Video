// Axo: the Axol's Lab mascot, a pink axolotl in a lab coat with goggles.
// Drawn around (0,0) = middle of the body; about 450 units tall at scale 1.
import React from 'react';
import {useCurrentFrame} from 'remotion';

export type AxoExpression = 'happy' | 'thinking' | 'worried' | 'excited' | 'focused' | 'surprised';
export type AxoPose = 'rest' | 'point' | 'wave' | 'cheer' | 'chin' | 'write';

export const AXO = {
  skin: '#ff9fc0',
  skinShade: '#f07fa8',
  skinLight: '#ffc9db',
  belly: '#ffe0ea',
  gill: '#e2457f',
  gillLight: '#ff6f9f',
  eye: '#2a1830',
  coat: '#f6f7ff',
  coatShade: '#d4d9f0',
  coatLine: '#b8bfdc',
  goggleRim: '#3b3f63',
  goggleGlass: '#9fe3ff',
};

/** One feathery gill frond: a curved stalk with little filaments. */
const Gill: React.FC<{x: number; y: number; angle: number; len: number; sway: number; flip: number}> = ({x, y, angle, len, sway, flip}) => {
  const a = angle + sway;
  const pts = Array.from({length: 7}).map((_, i) => {
    const t = i / 6;
    const bend = Math.sin(t * 2) * 10 * flip;
    const ang = (a * Math.PI) / 180;
    return [x + Math.cos(ang) * len * t - Math.sin(ang) * bend, y + Math.sin(ang) * len * t + Math.cos(ang) * bend];
  });
  const d = `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
  return (
    <g>
      {pts.slice(1, 6).map(([px, py], i) => {
        const ang = (a * Math.PI) / 180;
        const fl = 13 - i * 1.2;
        return (
          <g key={i} stroke={AXO.gillLight} strokeWidth={4.5} strokeLinecap="round">
            <line x1={px} y1={py} x2={px + Math.cos(ang - 1.1) * fl} y2={py + Math.sin(ang - 1.1) * fl} />
            <line x1={px} y1={py} x2={px + Math.cos(ang + 1.1) * fl} y2={py + Math.sin(ang + 1.1) * fl} />
          </g>
        );
      })}
      <path d={d} stroke={AXO.gill} strokeWidth={11} strokeLinecap="round" fill="none" />
      <circle cx={pts[6][0]} cy={pts[6][1]} r={6.5} fill={AXO.gill} />
    </g>
  );
};

/** A coat sleeve + hand, rotated around the shoulder. */
const Arm: React.FC<{x: number; y: number; angle: number; side: 1 | -1; pointing?: boolean; holding?: 'pencil' | null}> = ({
  x, y, angle, side, pointing, holding,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={-20} y={-6} width={40} height={92} rx={20} fill={AXO.coat} stroke={AXO.coatLine} strokeWidth={3} />
    <rect x={-20} y={64} width={40} height={14} rx={6} fill={AXO.coatShade} />
    <g transform="translate(0 92)">
      <ellipse cx={0} cy={6} rx={21} ry={19} fill={AXO.skin} />
      {pointing ? (
        <rect x={-6} y={14} width={12} height={34} rx={6} fill={AXO.skin} />
      ) : (
        [-12, -4, 4, 12].map((fx, i) => <ellipse key={i} cx={fx} cy={22} rx={5.5} ry={8} fill={AXO.skin} />)
      )}
      {holding === 'pencil' && (
        <g transform={`rotate(${-20 * side}) translate(-4 0)`}>
          <rect x={-5} y={-30} width={10} height={72} fill="#ffd166" />
          <rect x={-5} y={-30} width={10} height={10} fill="#ef8f8f" />
          <path d="M -5 42 L 5 42 L 0 56 Z" fill="#f2d2a2" />
          <path d="M -2 50 L 2 50 L 0 56 Z" fill="#333" />
        </g>
      )}
    </g>
  </g>
);

export const Axo: React.FC<{
  x: number; y: number; scale?: number;
  expression?: AxoExpression; pose?: AxoPose;
  /** Eye direction, -1..1 each. */
  look?: [number, number];
  flip?: boolean;
  /** Hide everything below the waist (for sitting behind a desk). */
  seated?: boolean;
}> = ({x, y, scale = 1, expression = 'happy', pose = 'rest', look = [0, 0], flip = false, seated = false}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 22) * 4;
  const sway = Math.sin(f / 16) * 4;
  // blink every few seconds (deterministic)
  const cycle = f % 110;
  const blink = cycle > 104 ? Math.abs(cycle - 107) / 3 : 1;
  const eyeScale = expression === 'surprised' ? 1.25 : blink;

  // arm angles: 0 = hanging down; positive rotates toward the body's left (viewer's right) side
  const armL = pose === 'cheer' ? 150 : pose === 'wave' ? 140 + Math.sin(f / 5) * 15 : pose === 'chin' ? -135 : 18;
  const armR = pose === 'point' ? -125 : pose === 'cheer' ? -150 : pose === 'write' ? -55 : -18;

  const mouth = {
    happy: <path d="M -40 -122 Q 0 -92 40 -122" stroke={AXO.eye} strokeWidth={6} fill="none" strokeLinecap="round" />,
    excited: (
      <g>
        <path d="M -42 -124 Q 0 -70 42 -124 Z" fill="#7a2747" />
        <path d="M -20 -100 Q 0 -84 20 -100 Q 0 -94 -20 -100 Z" fill="#ff7aa2" />
      </g>
    ),
    thinking: <path d="M -18 -112 Q 4 -118 26 -110" stroke={AXO.eye} strokeWidth={6} fill="none" strokeLinecap="round" />,
    focused: <path d="M -22 -112 L 22 -112" stroke={AXO.eye} strokeWidth={6} fill="none" strokeLinecap="round" />,
    worried: <path d="M -30 -106 Q -15 -116 0 -106 Q 15 -96 30 -106" stroke={AXO.eye} strokeWidth={6} fill="none" strokeLinecap="round" />,
    surprised: <ellipse cx={0} cy={-104} rx={14} ry={17} fill="#7a2747" />,
  }[expression];
  const lx = look[0] * 7, ly = look[1] * 6 + (expression === 'thinking' ? -6 : 0);

  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* tail */}
      {!seated && (
        <g transform={`rotate(${sway * 1.5} 60 120)`}>
          <path d="M 50 110 C 150 120, 210 60, 240 10 C 220 90, 150 160, 50 160 Z" fill={AXO.skinShade} />
          <path d="M 70 112 C 150 115, 200 70, 236 18" stroke={AXO.skinLight} strokeWidth={6} fill="none" opacity={0.7} />
        </g>
      )}
      {/* legs */}
      {!seated && [-55, 55].map((lx2) => (
        <g key={lx2}>
          <rect x={lx2 - 22} y={130} width={44} height={60} rx={20} fill={AXO.skin} />
          {[-14, -5, 4, 13].map((tx) => <ellipse key={tx} cx={lx2 + tx} cy={190} rx={6} ry={8} fill={AXO.skin} />)}
        </g>
      ))}
      {/* body + lab coat */}
      <path d="M -105 20 C -110 -40, -80 -70, 0 -70 C 80 -70, 110 -40, 105 20 C 112 110, 70 160, 0 160 C -70 160, -112 110, -105 20 Z" fill={AXO.coat}
            stroke={AXO.coatLine} strokeWidth={3} />
      <path d="M -26 -66 L 26 -66 L 34 150 Q 0 160 -34 150 Z" fill={AXO.belly} />
      <path d="M -26 -66 L -6 20 L -40 -60 Z" fill={AXO.coatShade} />
      <path d="M 26 -66 L 6 20 L 40 -60 Z" fill={AXO.coatShade} />
      <path d="M -34 -64 L -4 30 L -36 150" stroke={AXO.coatLine} strokeWidth={3} fill="none" />
      <path d="M 34 -64 L 4 30 L 36 150" stroke={AXO.coatLine} strokeWidth={3} fill="none" />
      {[0, 1, 2].map((i) => <circle key={i} cx={46} cy={30 + i * 34} r={5} fill={AXO.coatLine} />)}
      {/* pocket with pens, name badge */}
      <rect x={-92} y={20} width={44} height={40} rx={6} fill={AXO.coatShade} />
      <rect x={-84} y={2} width={7} height={30} rx={3} fill="#4f7cff" />
      <rect x={-72} y={6} width={7} height={26} rx={3} fill="#ff6f91" />
      <rect x={52} y={-30} width={42} height={20} rx={4} fill="#ffd166" />
      <text x={73} y={-15} fontSize={13} fontWeight={800} textAnchor="middle" fill="#5a3a00" fontFamily="Inter, sans-serif">AXO</text>
      {/* arms (viewer's left, viewer's right) */}
      <Arm x={-100} y={-20} angle={armL} side={-1} />
      <Arm x={100} y={-20} angle={armR} side={1} pointing={pose === 'point'} holding={pose === 'write' ? 'pencil' : null} />

      {/* gills */}
      {[[-1, -150], [1, -30]].map(([side, base]) =>
        [0, 1, 2].map((k) => (
          <Gill key={`${side}${k}`} x={side * 128} y={-175 + k * 32} angle={(base as number) + (side as number) * (k - 1) * -22}
                len={70 - Math.abs(k - 1) * 8} sway={Math.sin(f / 14 + k + (side as number)) * 6} flip={side as number} />
        )),
      )}
      {/* head */}
      <ellipse cx={0} cy={-150} rx={150} ry={112} fill={AXO.skin} />
      <ellipse cx={-10} cy={-205} rx={100} ry={45} fill={AXO.skinLight} opacity={0.6} />
      {[[-90, -190, 6], [70, -215, 5], [105, -160, 4], [-60, -225, 4]].map(([sx, sy, sr], i) => (
        <circle key={i} cx={sx} cy={sy} r={sr} fill={AXO.skinShade} opacity={0.6} />
      ))}
      {/* goggles pushed up on the forehead */}
      <path d="M -146 -205 Q 0 -250 146 -205" stroke={AXO.goggleRim} strokeWidth={14} fill="none" />
      {[-48, 48].map((gx) => (
        <g key={gx}>
          <circle cx={gx} cy={-226} r={30} fill={AXO.goggleRim} />
          <circle cx={gx} cy={-226} r={22} fill={AXO.goggleGlass} />
          <path d={`M ${gx - 12} ${-236} q 8 -8 18 -4`} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* eyes */}
      {[-62, 62].map((ex) => (
        <g key={ex} transform={`translate(${ex + lx} ${-150 + ly}) scale(1 ${eyeScale})`}>
          <circle cx={0} cy={0} r={19} fill={AXO.eye} />
          <circle cx={-6} cy={-7} r={7} fill="#ffffff" />
          <circle cx={7} cy={6} r={3} fill="#ffffff" />
        </g>
      ))}
      {expression === 'worried' && [-62, 62].map((ex) => (
        <path key={ex} d={`M ${ex - 18} ${-186} L ${ex + 14} ${ex < 0 ? -178 : -194}`} stroke={AXO.eye} strokeWidth={5} strokeLinecap="round" />
      ))}
      {expression === 'thinking' && <path d="M 40 -186 Q 62 -196 84 -188" stroke={AXO.eye} strokeWidth={5} fill="none" strokeLinecap="round" />}
      {/* cheeks */}
      <ellipse cx={-98} cy={-118} rx={22} ry={12} fill="#ff6f9f" opacity={0.45} />
      <ellipse cx={98} cy={-118} rx={22} ry={12} fill="#ff6f9f" opacity={0.45} />
      {mouth}
      {expression === 'worried' && <path d="M 140 -200 q 10 18 0 26 q -10 -8 0 -26 Z" fill="#9fe3ff" />}
      {expression === 'excited' && [[-170, -260], [170, -250], [-150, -60]].map(([sx, sy], i) => (
        <path key={i} transform={`translate(${sx} ${sy}) scale(${0.8 + 0.3 * Math.sin(f / 5 + i)})`}
              d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" fill="#ffd166" />
      ))}
      {/* chin hand for the thinking pose sits on top of the head layer */}
      {pose === 'chin' && <ellipse cx={-34} cy={-52} rx={22} ry={18} fill={AXO.skin} stroke={AXO.skinShade} strokeWidth={2} />}
    </g>
  );
};

/** Speech/thought bubble anchored at (x, y) = tip of the tail. */
export const Bubble: React.FC<{x: number; y: number; w: number; h: number; opacity?: number; children: React.ReactNode}> = ({
  x, y, w, h, opacity = 1, children,
}) => (
  <g opacity={opacity}>
    <rect x={x - w / 2} y={y - h - 26} width={w} height={h} rx={h / 2.5} fill="#ffffff" />
    <path d={`M ${x - 18} ${y - 28} L ${x - 30} ${y} L ${x + 8} ${y - 28} Z`} fill="#ffffff" />
    <foreignObject x={x - w / 2} y={y - h - 26} width={w} height={h}>
      <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 34, color: '#2a1830'}}>{children}</div>
    </foreignObject>
  </g>
);
