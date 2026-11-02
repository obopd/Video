// Axol's Lab cast and props. Rule: characters are solid ink silhouettes,
// objects are ink line drawings on paper. One warm accent (tangerine) and one
// cool accent (cobalt) keep it clean.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {P, DISPLAY, SANS} from './paper';

export const INK = '#141210';
export const PAPER = '#f6f1e8';
export const ORANGE = '#ff6b3d';
export const COBALT = '#2f5bff';
export const COBALT_TINT = '#dfe6ff';
export const LINE = 5; // standard ink line width for props

/** A feathery gill: stalk with filaments. */
const Gill: React.FC<{x: number; y: number; angle: number; len?: number}> = ({x, y, angle, len = 52}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={0} y={-4.5} width={len} height={9} rx={4.5} fill={INK} />
    {Array.from({length: 4}).map((_, i) => {
      const d = 12 + i * ((len - 16) / 3);
      return (
        <g key={i}>
          <rect x={d} y={-14} width={5} height={11} rx={2.5} fill={INK} transform={`rotate(-30 ${d} -3)`} />
          <rect x={d} y={3} width={5} height={11} rx={2.5} fill={INK} transform={`rotate(30 ${d} 3)`} />
        </g>
      );
    })}
    <circle cx={len + 2} cy={0} r={7} fill={INK} />
  </g>
);

/** Line-art pencil along +x, from the eraser (0,0) to the tip (len,0). */
export const Pencil: React.FC<{len?: number; w?: number; face?: boolean}> = ({len = 260, w = 34, face = false}) => (
  <g strokeLinejoin="round">
    <rect x={0} y={-w / 2} width={w * 0.9} height={w} rx={w * 0.25} fill={ORANGE} stroke={INK} strokeWidth={LINE} />
    <rect x={w * 0.9} y={-w / 2} width={w * 0.45} height={w} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={w * 1.35} y={-w / 2} width={len - w * 2.6} height={w} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <line x1={w * 1.35} y1={0} x2={len - w * 1.25} y2={0} stroke={INK} strokeWidth={2} opacity={0.35} />
    <path d={`M ${len - w * 1.25} ${-w / 2} L ${len} 0 L ${len - w * 1.25} ${w / 2} Z`} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <path d={`M ${len - w * 0.42} ${-w * 0.17} L ${len} 0 L ${len - w * 0.42} ${w * 0.17} Z`} fill={INK} />
    {face && (
      <g>
        <circle cx={len * 0.42} cy={-w * 0.05} r={w * 0.11} fill={INK} />
        <circle cx={len * 0.55} cy={-w * 0.05} r={w * 0.11} fill={INK} />
        <path d={`M ${len * 0.4} ${-w * 0.3} L ${len * 0.47} ${-w * 0.2} M ${len * 0.57} ${-w * 0.3} L ${len * 0.5} ${-w * 0.2}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g>
    )}
  </g>
);

/**
 * Axo from the side: chunky ink axolotl with feathery gills and round white eyes
 * (head turned 3/4 to camera). (x, y) = ground under the hips; faces +x.
 * rear: 0 on all fours .. 1 reared up on the hind legs. arm: front arm angle (deg).
 */
export const AxoSide: React.FC<{
  x: number; y: number; scale?: number; dir?: 1 | -1; rear?: number; arm?: number;
  holding?: 'pencil' | null; sweat?: boolean; wink?: boolean; run?: number;
}> = ({x, y, scale = 1, dir = 1, rear = 0, arm = 40, holding = null, sweat = false, wink = false, run}) => {
  const f = useCurrentFrame();
  const ph = (run ?? 0) * Math.PI * 2;
  const tilt = -rear * 62;
  const wig = Math.sin(f / 13) * 4;
  const tail = Array.from({length: 34}).map((_, i) => {
    const t = i / 33;
    return {cx: -20 - 175 * t, cy: -30 + 26 * t + Math.sin(t * 3 + f / 12) * 7 * t, r: 30 * (1 - t) + 4};
  });
  const hindSwing = run !== undefined ? Math.sin(ph) * 25 : 0;
  const frontSwing = run !== undefined ? Math.sin(ph + Math.PI) * 25 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * dir} ${scale})`}>
      {tail.map((d, i) => <circle key={i} {...d} fill={INK} />)}
      {/* hind legs */}
      {[-14, 14].map((o, k) => (
        <g key={o} transform={`translate(${o} -30) rotate(${(k ? hindSwing : -hindSwing) - rear * 10})`}>
          <rect x={-14} y={0} width={28} height={36} rx={14} fill={INK} />
          <ellipse cx={8} cy={34} rx={20} ry={9} fill={INK} />
        </g>
      ))}
      <g transform={`rotate(${tilt} 0 -30)`}>
        {/* body */}
        <ellipse cx={58} cy={-42} rx={84} ry={46} fill={INK} />
        {/* front leg (when on all fours) */}
        {rear < 0.5 && (
          <g transform={`translate(118 -20) rotate(${-tilt + frontSwing})`}>
            <rect x={-13} y={0} width={26} height={34} rx={13} fill={INK} />
            <ellipse cx={8} cy={32} rx={18} ry={8} fill={INK} />
          </g>
        )}
        {/* head, kept upright */}
        <g transform={`translate(160 -66) rotate(${-tilt * 0.85}) scale(${1 + rear * 0.25})`}>
          <Gill x={-38} y={-34} angle={-145 + wig} />
          <Gill x={-50} y={-6} angle={-178 - wig} len={58} />
          <Gill x={-40} y={22} angle={152 + wig} />
          <ellipse cx={0} cy={0} rx={66} ry={58} fill={INK} />
          {/* eyes: near eye bigger, far eye smaller (3/4 view) */}
          <g transform={`scale(${dir} 1)`}>
            {wink ? (
              <path d="M 4 -10 Q 18 -22 32 -10" stroke={PAPER} strokeWidth={6} strokeLinecap="round" fill="none" />
            ) : (
              <circle cx={18} cy={-10} r={13} fill={PAPER} />
            )}
            <circle cx={46} cy={-12} r={9.5} fill={PAPER} />
          </g>
          {sweat && [[-20, -70, 1], [-48, -58, 0.7], [30, -74, 0.8]].map(([sx, sy, ss], i) => {
            const fall = ((f * 1.4 + i * 17) % 40) / 40;
            return (
              <path key={i} transform={`translate(${sx} ${sy + fall * 18}) scale(${ss})`} opacity={1 - fall * 0.6}
                    d="M 0 -14 C 7 -2, 9 4, 0 9 C -9 4, -7 -2, 0 -14 Z" fill={COBALT_TINT} stroke={COBALT} strokeWidth={3} />
            );
          })}
        </g>
        {/* front arm, raised when reared up */}
        {rear >= 0.5 && (
          <g transform={`translate(112 -48) rotate(${-tilt + arm})`}>
            <rect x={-13} y={-13} width={64} height={26} rx={13} fill={INK} />
            <circle cx={58} cy={0} r={16} fill={INK} />
            {holding === 'pencil' && <g transform="translate(-10 0) rotate(-12)"><Pencil len={230} w={30} /></g>}
          </g>
        )}
      </g>
    </g>
  );
};

/** Calc: a rounded ink calculator whose screen is its face. */
export const Calc: React.FC<{x: number; y: number; scale?: number; rotate?: number; mood?: 'sneaky' | 'shock' | 'loading'; tiptoe?: number}> = ({
  x, y, scale = 1, rotate = 0, mood = 'sneaky', tiptoe = 0,
}) => {
  const f = useCurrentFrame();
  const step = Math.sin(tiptoe * Math.PI * 2);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {[-28, 28].map((lx, i) => (
        <g key={lx} transform={`translate(${lx} 0) rotate(${(i ? 1 : -1) * step * 14})`}>
          <rect x={-7} y={-6} width={14} height={40} rx={7} fill={INK} />
          <ellipse cx={4} cy={34} rx={14} ry={6} fill={INK} />
        </g>
      ))}
      <rect x={-62} y={-176} width={124} height={176} rx={22} fill={INK} />
      <rect x={-48} y={-160} width={96} height={52} rx={10} fill={PAPER} />
      {mood === 'loading' ? (
        <g transform="translate(0 -134)">
          <circle r={15} fill="none" stroke={INK} strokeWidth={4} opacity={0.2} />
          <path d="M 0 -15 A 15 15 0 0 1 15 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${f * 8})`} />
        </g>
      ) : (
        <g>
          <circle cx={-18} cy={-134} r={mood === 'shock' ? 9 : 7} fill={INK} />
          <circle cx={18} cy={-134} r={mood === 'shock' ? 9 : 7} fill={INK} />
          {mood === 'sneaky' && <path d="M -30 -148 L -8 -142 M 30 -148 L 8 -142" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
        </g>
      )}
      {Array.from({length: 9}).map((_, i) => (
        <rect key={i} x={-44 + (i % 3) * 32} y={-96 + Math.floor(i / 3) * 30} width={24} height={20} rx={6} fill={PAPER} opacity={0.9} />
      ))}
    </g>
  );
};

/** Rubber stamp mark. */
export const Stamp: React.FC<{x: number; y: number; text: string; rotate?: number; scale?: number; color?: string}> = ({x, y, text, rotate = -12, scale = 1, color = ORANGE}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={0.92}>
    <rect x={-150} y={-52} width={300} height={104} rx={18} fill="none" stroke={color} strokeWidth={10} />
    <rect x={-136} y={-38} width={272} height={76} rx={10} fill="none" stroke={color} strokeWidth={3} />
    <text x={0} y={22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={66} fill={color} letterSpacing={6}>{text}</text>
  </g>
);

/** Big clock face with a number. */
export const BigClock: React.FC<{x: number; y: number; r?: number; value: number; total?: number}> = ({x, y, r = 150, value, total = 96}) => {
  const c = 2 * Math.PI * (r - 18);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={PAPER} stroke={INK} strokeWidth={LINE + 1} />
      <circle r={r - 18} fill="none" stroke={INK} strokeWidth={3} opacity={0.12} />
      <circle r={r - 18} fill="none" stroke={ORANGE} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={`${(c * value) / total} ${c}`} transform="rotate(-90)" />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={0} y1={-(r - 34)} x2={0} y2={-(r - 46)} stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />
      ))}
      <text x={0} y={38} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={r * 0.82} fill={INK}>{value}</text>
      <text x={0} y={r * 0.55} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={22} fill={P.muted} letterSpacing={3}>SECONDS</text>
    </g>
  );
};

/** A little "0" character with legs, for the conga line. */
export const Zero: React.FC<{x: number; y: number; step: number; scale?: number}> = ({x, y, step, scale = 1}) => {
  const s = Math.sin(step * Math.PI * 2);
  return (
    <g transform={`translate(${x} ${y + Math.abs(s) * -6}) scale(${scale})`}>
      {[-12, 12].map((lx, i) => (
        <g key={lx} transform={`translate(${lx} -8) rotate(${(i ? 1 : -1) * s * 22})`}>
          <rect x={-4} y={0} width={8} height={26} rx={4} fill={INK} />
          <ellipse cx={4} cy={26} rx={9} ry={4} fill={INK} />
        </g>
      ))}
      <text x={0} y={-6} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={110} fill={INK}>0</text>
      <circle cx={-8} cy={-48} r={4.5} fill={INK} />
      <circle cx={8} cy={-48} r={4.5} fill={INK} />
    </g>
  );
};

/** Line-art wooden crate with a label. */
export const Crate: React.FC<{x: number; y: number; w?: number; h?: number; label: React.ReactNode}> = ({x, y, w = 320, h = 240, label}) => (
  <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
    <rect x={-w / 2} y={-h} width={w} height={h} rx={10} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={-w / 2} x2={w / 2} y1={-h * t} y2={-h * t} stroke={INK} strokeWidth={3} opacity={0.25} />)}
    <path d={`M ${-w / 2 + 14} ${-14} L ${w / 2 - 14} ${-h + 14}`} stroke={INK} strokeWidth={4} opacity={0.3} />
    <rect x={-w * 0.36} y={-h * 0.72} width={w * 0.72} height={h * 0.42} rx={10} fill={PAPER} stroke={INK} strokeWidth={4} />
    <foreignObject x={-w * 0.36} y={-h * 0.72} width={w * 0.72} height={h * 0.42}>
      <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: INK}}>{label}</div>
    </foreignObject>
  </g>
);
