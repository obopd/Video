import React, {useId} from 'react';
import {random, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, W, H, FONT} from './theme';

export const ease = Easing.bezier(0.45, 0, 0.25, 1);

/** interpolate() clamped on both sides, with a smooth ease by default. */
export const tween = (
  frame: number, from: number, to: number, a: number, b: number, easing = ease,
) => interpolate(frame, [from, to], [a, b], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Full-frame SVG canvas in 1920x1080 design units that fills any output size. */
export const Canvas: React.FC<{children: React.ReactNode; background?: boolean}> = ({children, background = true}) => (
  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
       style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
    {background && <Sky />}
    {children}
  </svg>
);

export const Sky: React.FC<{top?: string; bottom?: string}> = ({top = C.bgTop, bottom = C.bgBottom}) => {
  const id = useId();
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={`url(#${id})`} />
    </>
  );
};

/** Deterministic twinkling stars; `drift` slides them for a sense of motion. */
export const Stars: React.FC<{count?: number; seed?: string; drift?: number; opacity?: number}> = ({
  count = 220, seed = 'stars', drift = 0.15, opacity = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <g opacity={opacity}>
      {Array.from({length: count}).map((_, i) => {
        const depth = 0.3 + random(`${seed}-d-${i}`) * 0.7;
        const x = (((random(`${seed}-x-${i}`) * W * 1.6 - frame * drift * depth) % (W * 1.6)) + W * 1.6) % (W * 1.6) - W * 0.3;
        const y = random(`${seed}-y-${i}`) * H * 1.6 - H * 0.3;
        const tw = 0.55 + 0.45 * Math.sin(frame / (14 + 20 * random(`${seed}-t-${i}`)) + i);
        return <circle key={i} cx={x} cy={y} r={0.8 + depth * 1.8} fill={C.star} opacity={tw * depth} />;
      })}
    </g>
  );
};

/** Soft radial glow. */
export const Glow: React.FC<{cx: number; cy: number; r: number; color: string; opacity?: number}> = ({
  cx, cy, r, color, opacity = 1,
}) => {
  const id = useId();
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={color} stopOpacity={0.18} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} opacity={opacity} />
    </>
  );
};

export const Sun: React.FC<{cx: number; cy: number; r: number; scale?: number; glow?: number}> = ({
  cx, cy, r, scale = 1, glow = 1,
}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.015 * Math.sin(frame / 12);
  const rr = r * scale * pulse;
  if (rr <= 0.01 && glow <= 0.01) return null;
  return (
    <g>
      <Glow cx={cx} cy={cy} r={rr * 5} color={C.sunGlow} opacity={glow} />
      <Glow cx={cx} cy={cy} r={rr * 2.4} color={C.sun} opacity={glow} />
      <circle cx={cx} cy={cy} r={rr} fill={C.sunEdge} />
      <circle cx={cx} cy={cy} r={rr * 0.86} fill={C.sun} />
      <circle cx={cx - rr * 0.18} cy={cy - rr * 0.18} r={rr * 0.5} fill={C.sunCore} opacity={0.85} />
    </g>
  );
};

/**
 * Flat planet with a night-side shadow. `lightAngle` (radians) points from the
 * planet toward the light; `lit` 0..1 fades the day side to night.
 */
export const Planet: React.FC<{
  cx: number; cy: number; r: number; color: string; lightAngle?: number; lit?: number;
  bands?: string; ring?: string; children?: React.ReactNode;
}> = ({cx, cy, r, color, lightAngle = Math.PI, lit = 1, bands, ring, children}) => {
  const clip = useId();
  const sx = cx - Math.cos(lightAngle) * r * 0.55;
  const sy = cy - Math.sin(lightAngle) * r * 0.55;
  return (
    <g>
      <defs>
        <clipPath id={clip}><circle cx={cx} cy={cy} r={r} /></clipPath>
      </defs>
      {ring && <ellipse cx={cx} cy={cy} rx={r * 2} ry={r * 0.5} fill="none" stroke={ring} strokeWidth={r * 0.18} opacity={0.8} />}
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <g clipPath={`url(#${clip})`}>
        {bands && [-0.45, -0.1, 0.3].map((o, i) => (
          <rect key={i} x={cx - r} y={cy + o * r} width={r * 2} height={r * 0.18} fill={bands} opacity={0.7} />
        ))}
        {children}
        {/* night side */}
        <circle cx={sx} cy={sy} r={r * 1.05} fill="#0a0820" opacity={0.42} />
        {/* everything dims as light goes away */}
        <circle cx={cx} cy={cy} r={r} fill="#060418" opacity={(1 - lit) * 0.72} />
      </g>
    </g>
  );
};

export const Label: React.FC<{
  x: number; y: number; children: React.ReactNode; size?: number; color?: string;
  opacity?: number; weight?: number; anchor?: 'start' | 'middle' | 'end';
}> = ({x, y, children, size = 34, color = C.text, opacity = 1, weight = 600, anchor = 'middle'}) => (
  <text x={x} y={y} fontFamily={FONT} fontSize={size} fontWeight={weight} fill={color}
        textAnchor={anchor} opacity={opacity} style={{letterSpacing: size > 60 ? -1 : 0}}>
    {children}
  </text>
);

/** Continents as simple rounded blobs, drawn in a unit circle and scaled to the planet. */
export const Continents: React.FC<{cx: number; cy: number; r: number; color: string; spin?: number}> = ({
  cx, cy, r, color, spin = 0,
}) => {
  const blobs = [
    [-0.55, -0.35, 0.32, 0.22, -20], [-0.35, 0.15, 0.2, 0.36, 10], [0.25, -0.4, 0.38, 0.2, 15],
    [0.35, 0.05, 0.18, 0.3, -10], [0.6, 0.45, 0.2, 0.12, 0], [-0.9, 0.5, 0.15, 0.1, 0],
  ];
  return (
    <g>
      {blobs.map(([x, y, rx, ry, rot], i) => {
        const px = ((x + spin + 1.6) % 3.2) - 1.6;
        return (
          <ellipse key={i} cx={cx + px * r} cy={cy + y * r} rx={rx * r} ry={ry * r}
                   transform={`rotate(${rot} ${cx + px * r} ${cy + y * r})`} fill={color} />
        );
      })}
    </g>
  );
};

/** Mix two hex colors. */
export const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, Math.max(0, t))).toString(16).padStart(2, '0')).join('');
};
