// Axol's Lab backdrop: a dim lab wall with shelves of glassware, glowing liquids
// and the occasional rising bubble, plus a desk for exam scenes.
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {W, H} from './theme';
import {Glow} from './shapes';

const Flask: React.FC<{x: number; y: number; s: number; liquid: string; kind: number; seed: string}> = ({x, y, s, liquid, kind, seed}) => {
  const f = useCurrentFrame();
  const glass = 'rgba(200,220,255,0.22)', rim = 'rgba(220,235,255,0.55)';
  const bubbles = Array.from({length: 4}).map((_, i) => {
    const life = ((f * 0.6 + random(`${seed}b${i}`) * 100) % 100) / 100;
    return {bx: x + (random(`${seed}x${i}`) - 0.5) * 20 * s, by: y - life * 60 * s, o: 1 - life};
  });
  return (
    <g>
      <Glow cx={x} cy={y - 20 * s} r={70 * s} color={liquid} opacity={0.35} />
      {kind === 0 && ( // Erlenmeyer
        <g>
          <path d={`M ${x - 10 * s} ${y - 70 * s} V ${y - 40 * s} L ${x - 34 * s} ${y} H ${x + 34 * s} L ${x + 10 * s} ${y - 40 * s} V ${y - 70 * s} Z`} fill={glass} stroke={rim} strokeWidth={2} />
          <path d={`M ${x - 22 * s} ${y - 18 * s} L ${x - 34 * s} ${y} H ${x + 34 * s} L ${x + 22 * s} ${y - 18 * s} Z`} fill={liquid} opacity={0.85} />
        </g>
      )}
      {kind === 1 && ( // round-bottom
        <g>
          <rect x={x - 8 * s} y={y - 80 * s} width={16 * s} height={40 * s} fill={glass} stroke={rim} strokeWidth={2} />
          <circle cx={x} cy={y - 26 * s} r={28 * s} fill={glass} stroke={rim} strokeWidth={2} />
          <path d={`M ${x - 26 * s} ${y - 20 * s} A ${28 * s} ${28 * s} 0 0 0 ${x + 26 * s} ${y - 20 * s} Z`} fill={liquid} opacity={0.85} />
        </g>
      )}
      {kind === 2 && ( // test tubes in a rack
        <g>
          {[-24, 0, 24].map((dx, i) => (
            <g key={i}>
              <rect x={x + dx * s - 7 * s} y={y - 70 * s} width={14 * s} height={66 * s} rx={7 * s} fill={glass} stroke={rim} strokeWidth={2} />
              <rect x={x + dx * s - 7 * s} y={y - (30 + i * 10) * s} width={14 * s} height={(26 + i * 10) * s} rx={7 * s} fill={liquid} opacity={0.8} />
            </g>
          ))}
          <rect x={x - 40 * s} y={y - 30 * s} width={80 * s} height={8 * s} fill="#5a4a7a" />
        </g>
      )}
      {bubbles.map((b, i) => <circle key={i} cx={b.bx} cy={b.by - 10 * s} r={3 * s} fill="#ffffff" opacity={0.4 * b.o} />)}
    </g>
  );
};

export const LabBackground: React.FC<{dim?: number}> = ({dim = 0}) => {
  const liquids = ['#7cf5d0', '#ff6f91', '#ffd166', '#8fb8ff', '#c08bff'];
  return (
    <g>
      <defs>
        <linearGradient id="labwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14123a" />
          <stop offset="1" stopColor="#241a52" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#labwall)" />
      {/* faint tile grid */}
      {Array.from({length: 13}).map((_, i) => <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={H} stroke="#ffffff" strokeOpacity={0.025} />)}
      {Array.from({length: 7}).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 160} x2={W} y2={i * 160} stroke="#ffffff" strokeOpacity={0.025} />)}
      {/* shelves */}
      {[300, 620].map((sy, row) => (
        <g key={sy}>
          <rect x={-20} y={sy} width={W + 40} height={16} fill="#3a2f6a" />
          <rect x={-20} y={sy + 16} width={W + 40} height={6} fill="#1a1440" />
          {Array.from({length: 8}).map((_, i) => {
            const x = 110 + i * 240 + (row ? 120 : 0);
            return <Flask key={i} x={x} y={sy} s={0.9 + random(`fs${row}${i}`) * 0.4} kind={Math.floor(random(`fk${row}${i}`) * 3)}
                          liquid={liquids[Math.floor(random(`fl${row}${i}`) * liquids.length)]} seed={`${row}${i}`} />;
          })}
        </g>
      ))}
      {/* floor */}
      <rect x={0} y={930} width={W} height={150} fill="#18123c" />
      <rect x={0} y={926} width={W} height={6} fill="#3a2f6a" />
      <rect x={0} y={0} width={W} height={H} fill="#0a0820" opacity={0.35 + dim} />
    </g>
  );
};

/** An exam desk (front view) whose top edge sits at y. */
export const Desk: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <g>
    <rect x={x} y={y} width={w} height={28} rx={8} fill="#a8774f" />
    <rect x={x} y={y + 22} width={w} height={10} fill="#7a5236" />
    <rect x={x + 30} y={y + 32} width={w - 60} height={H - y} fill="#8a5d3d" />
    <rect x={x + 30} y={y + 32} width={w - 60} height={20} fill="#6b452c" />
  </g>
);
