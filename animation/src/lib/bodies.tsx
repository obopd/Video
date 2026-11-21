// Detailed celestial bodies and backgrounds.
import React, {useId} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {W, H} from './theme';

const uid = () => useId().replace(/:/g, ''); // eslint-disable-line react-hooks/rules-of-hooks

/** Faint nebula clouds behind the stars, for depth. */
export const Nebula: React.FC<{seed?: string; opacity?: number}> = ({seed = 'neb', opacity = 1}) => {
  const id = uid();
  const frame = useCurrentFrame();
  const blobs = [
    {x: 0.2, y: 0.25, rx: 0.32, ry: 0.2, c: '#5b3fa8'},
    {x: 0.78, y: 0.7, rx: 0.36, ry: 0.22, c: '#2c4fa0'},
    {x: 0.62, y: 0.18, rx: 0.2, ry: 0.12, c: '#a0407e'},
    {x: 0.35, y: 0.85, rx: 0.25, ry: 0.12, c: '#3a2e8a'},
  ];
  return (
    <g opacity={opacity}>
      <defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={90} /></filter></defs>
      <g filter={`url(#${id})`}>
        {blobs.map((b, i) => (
          <ellipse key={i} cx={(b.x + 0.02 * Math.sin(frame / 300 + i)) * W} cy={b.y * H} rx={b.rx * W} ry={b.ry * H}
                   fill={b.c} opacity={0.18 + 0.12 * random(`${seed}${i}`)} />
        ))}
      </g>
    </g>
  );
};

/** A few bright stars with four-point flares. */
export const BrightStars: React.FC<{seed?: string; count?: number}> = ({seed = 'bs', count = 9}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        const x = random(`${seed}x${i}`) * W, y = random(`${seed}y${i}`) * H;
        const s = (6 + random(`${seed}s${i}`) * 10) * (0.85 + 0.15 * Math.sin(frame / 18 + i * 2));
        return (
          <g key={i} opacity={0.85}>
            <circle cx={x} cy={y} r={s * 0.9} fill="#fff6e0" opacity={0.12} />
            <path d={`M ${x - s * 2} ${y} Q ${x} ${y - s * 0.12} ${x + s * 2} ${y} Q ${x} ${y + s * 0.12} ${x - s * 2} ${y} Z`} fill="#fff6e0" opacity={0.7} />
            <path d={`M ${x} ${y - s * 2} Q ${x + s * 0.12} ${y} ${x} ${y + s * 2} Q ${x - s * 0.12} ${y} ${x} ${y - s * 2} Z`} fill="#fff6e0" opacity={0.7} />
            <circle cx={x} cy={y} r={s * 0.22} fill="#ffffff" />
          </g>
        );
      })}
    </g>
  );
};

/** The Sun: limb darkening, granulation, sunspots, prominences and a slowly turning corona. */
export const DetailedSun: React.FC<{cx: number; cy: number; r: number; scale?: number; glow?: number}> = ({
  cx, cy, r, scale = 1, glow = 1,
}) => {
  const frame = useCurrentFrame();
  const id = uid();
  const rr = r * scale * (1 + 0.012 * Math.sin(frame / 14));
  if (rr <= 0.5 && glow <= 0.01) return null;
  const rays = 14;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#ffb04a" stopOpacity={0.55} />
          <stop offset="0.35" stopColor="#ff7a3a" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ff5a3a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}b`} cx="0.45" cy="0.45">
          <stop offset="0" stopColor="#fff8d8" />
          <stop offset="0.55" stopColor="#ffd36a" />
          <stop offset="0.85" stopColor="#ffa53a" />
          <stop offset="1" stopColor="#f2772a" />
        </radialGradient>
        <linearGradient id={`${id}r`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}c`}><circle cx={cx} cy={cy} r={Math.max(rr, 0.01)} /></clipPath>
        <filter id={`${id}f`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={Math.max(1, rr * 0.08)} /></filter>
        <filter id={`${id}s`}><feGaussianBlur stdDeviation={Math.max(0.5, rr * 0.012)} /></filter>
      </defs>
      <g opacity={glow}>
        <circle cx={cx} cy={cy} r={rr * 6} fill={`url(#${id}g)`} />
        {/* corona rays */}
        <g filter={`url(#${id}f)`} transform={`rotate(${frame * 0.08} ${cx} ${cy})`}>
          {Array.from({length: rays}).map((_, i) => {
            const a = (i / rays) * 360 + random(`ray${i}`) * 12;
            const len = rr * (1.8 + random(`rl${i}`) * 1.6);
            const w = rr * (0.12 + random(`rw${i}`) * 0.12);
            return (
              <path key={i} transform={`rotate(${a} ${cx} ${cy})`}
                    d={`M ${cx + rr * 0.8} ${cy - w} L ${cx + rr + len} ${cy} L ${cx + rr * 0.8} ${cy + w} Z`}
                    fill={`url(#${id}r)`} opacity={0.55} />
            );
          })}
        </g>
        <circle cx={cx} cy={cy} r={rr * 1.25} fill="#ffb347" opacity={0.25} filter={`url(#${id}f)`} />
      </g>
      {rr > 0.5 && (
        <>
          {/* prominences at the limb */}
          {[35, 160, 250].map((a, i) => {
            const t = (a + frame * 0.08) * (Math.PI / 180);
            const x1 = cx + Math.cos(t - 0.12) * rr, y1 = cy + Math.sin(t - 0.12) * rr;
            const x2 = cx + Math.cos(t + 0.12) * rr, y2 = cy + Math.sin(t + 0.12) * rr;
            const h = rr * (0.12 + 0.04 * Math.sin(frame / 25 + i));
            const qx = cx + Math.cos(t) * (rr + h * 2), qy = cy + Math.sin(t) * (rr + h * 2);
            if (rr < 40) return null; // too small to read as a prominence
            return <path key={i} d={`M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`} fill="none" stroke="#ff7a3a"
                         strokeWidth={rr * 0.07} strokeLinecap="round" opacity={0.55} filter={`url(#${id}s)`} />;
          })}
          <circle cx={cx} cy={cy} r={rr} fill={`url(#${id}b)`} />
          <g clipPath={`url(#${id}c)`}>
            {/* granulation */}
            <g filter={`url(#${id}s)`}>
              {Array.from({length: 160}).map((_, i) => {
                const a = random(`ga${i}`) * Math.PI * 2;
                const d = Math.sqrt(random(`gd${i}`)) * rr;
                const s = rr * (0.035 + random(`gs${i}`) * 0.05);
                const tw = 0.5 + 0.5 * Math.sin(frame / (10 + random(`gt${i}`) * 14) + i);
                return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={s}
                               fill={i % 3 ? '#fff4c0' : '#e8892a'} opacity={0.18 * tw} />;
              })}
            </g>
            {/* sunspots */}
            {[[0.3, -0.2, 0.07], [0.38, -0.12, 0.04], [-0.35, 0.3, 0.05]].map(([x, y, s], i) => (
              <g key={i}>
                <circle cx={cx + x * rr} cy={cy + y * rr} r={s * rr * 1.8} fill="#d9752a" opacity={0.45} />
                <circle cx={cx + x * rr} cy={cy + y * rr} r={s * rr} fill="#8a3a1a" opacity={0.75} />
              </g>
            ))}
          </g>
        </>
      )}
    </g>
  );
};

type Kind = 'mercury' | 'venus' | 'mars' | 'jupiter';

/** Small rocky/gas planets with surface detail and a soft day/night terminator. */
export const DetailedPlanet: React.FC<{kind: Kind; cx: number; cy: number; r: number; lightAngle: number; lit?: number}> = ({
  kind, cx, cy, r, lightAngle, lit = 1,
}) => {
  const id = uid();
  const frame = useCurrentFrame();
  const base = {mercury: '#a99d94', venus: '#e9c58e', mars: '#d4673f', jupiter: '#e3b98a'}[kind];
  const sx = cx - Math.cos(lightAngle) * r * 0.75;
  const sy = cy - Math.sin(lightAngle) * r * 0.75;
  const hx = cx + Math.cos(lightAngle) * r * 0.35;
  const hy = cy + Math.sin(lightAngle) * r * 0.35;
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <filter id={`${id}t`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={r * 0.28} /></filter>
        <filter id={`${id}s`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={Math.max(0.3, r * 0.04)} /></filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={base} />
      <g clipPath={`url(#${id}c)`}>
        {kind === 'mercury' && Array.from({length: 14}).map((_, i) => {
          const x = cx + (random(`mx${i}`) - 0.5) * r * 1.8, y = cy + (random(`my${i}`) - 0.5) * r * 1.8;
          const s = r * (0.06 + random(`ms${i}`) * 0.16);
          return <g key={i}><circle cx={x} cy={y} r={s} fill="#7d726b" opacity={0.6} />
            <circle cx={x - s * 0.2} cy={y - s * 0.2} r={s * 0.75} fill="#c4b8af" opacity={0.35} /></g>;
        })}
        {kind === 'venus' && (
          <g filter={`url(#${id}s)`}>
            {[-0.6, -0.25, 0.1, 0.45].map((o, i) => (
              <path key={i} d={`M ${cx - r * 1.2} ${cy + o * r} Q ${cx - r * 0.4} ${cy + (o - 0.25) * r} ${cx} ${cy + o * r} T ${cx + r * 1.2} ${cy + o * r}`}
                    stroke={i % 2 ? '#f6dfb4' : '#c99a5b'} strokeWidth={r * 0.18} fill="none" opacity={0.6} />
            ))}
          </g>
        )}
        {kind === 'mars' && (
          <g>
            <g filter={`url(#${id}s)`}>
              {[[-0.3, 0.1, 0.45, 0.22], [0.35, -0.15, 0.3, 0.18], [0.1, 0.45, 0.35, 0.12]].map(([x, y, rx, ry], i) => (
                <ellipse key={i} cx={cx + x * r} cy={cy + y * r} rx={rx * r} ry={ry * r} fill="#8e3b25" opacity={0.55} />
              ))}
              <path d={`M ${cx - r * 0.5} ${cy + r * 0.05} q ${r * 0.4} ${-r * 0.08} ${r * 0.8} ${r * 0.02}`} stroke="#6a2a18" strokeWidth={r * 0.06} fill="none" />
            </g>
            <ellipse cx={cx} cy={cy - r * 0.88} rx={r * 0.42} ry={r * 0.2} fill="#fbf4ee" />
            <ellipse cx={cx} cy={cy + r * 0.93} rx={r * 0.3} ry={r * 0.12} fill="#fbf4ee" opacity={0.85} />
          </g>
        )}
        {kind === 'jupiter' && (
          <g>
            {[
              [-0.85, 0.16, '#f3ddbf'], [-0.62, 0.14, '#b9825a'], [-0.42, 0.12, '#f0d4ae'], [-0.25, 0.16, '#a86f48'],
              [-0.05, 0.2, '#f6e6cc'], [0.17, 0.15, '#b47b52'], [0.35, 0.14, '#e9caa0'], [0.52, 0.12, '#9d6a46'],
              [0.68, 0.18, '#ead2b0'],
            ].map(([o, h, c], i) => {
              const y = cy + (o as number) * r, hh = (h as number) * r;
              const wob = r * 0.025 * Math.sin(frame / 30 + i);
              return <path key={i} fill={c as string}
                           d={`M ${cx - r} ${y} Q ${cx - r * 0.5} ${y - hh * 0.3 + wob} ${cx} ${y} T ${cx + r} ${y} V ${y + hh} Q ${cx + r * 0.5} ${y + hh * 1.25} ${cx} ${y + hh} T ${cx - r} ${y + hh} Z`} />;
            })}
            {/* Great Red Spot */}
            <ellipse cx={cx + r * 0.3 + ((frame * 0.2) % (r * 0.2))} cy={cy + r * 0.3} rx={r * 0.22} ry={r * 0.12} fill="#e9caa0" />
            <ellipse cx={cx + r * 0.3 + ((frame * 0.2) % (r * 0.2))} cy={cy + r * 0.3} rx={r * 0.16} ry={r * 0.08} fill="#c4553a" />
            <ellipse cx={cx - r * 0.35} cy={cy - r * 0.12} rx={r * 0.07} ry={r * 0.035} fill="#fff4e4" opacity={0.8} />
          </g>
        )}
        {/* lit-side highlight and soft night side */}
        <circle cx={hx} cy={hy} r={r * 0.6} fill="#ffffff" opacity={0.12} filter={`url(#${id}t)`} />
        <circle cx={sx} cy={sy} r={r * 1.05} fill="#07051a" opacity={0.7} filter={`url(#${id}t)`} />
        <circle cx={cx} cy={cy} r={r} fill="#07051a" opacity={(1 - lit) * 0.7} />
      </g>
    </g>
  );
};
