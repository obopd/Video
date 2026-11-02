// "Script paper" design system for Axol's Lab, matching the Planner app:
// warm off-white paper with still grain + vignette, ink type in Fraunces,
// grey for past/inactive, black pill tags, and an ink circle for the answer.
import React from 'react';
import '../fonts/fonts.css';

export const P = {
  paper: '#f6f1e8',
  ink: '#141210',
  muted: '#a8a197',
  line: '#e4ddd0',
  pink: '#f3a5b8',
  pinkDeep: '#e98ba3',
  ease: [0.32, 0.72, 0, 1] as const,
};

export const DISPLAY = '"Fraunces", Georgia, serif';
export const SANS = '-apple-system, "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif';

/** Paper background: flat warm off-white, still film grain, soft vignette. */
export const Paper: React.FC = () => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer><feFuncA type="linear" slope="0.09" /></feComponentTransfer>
      </filter>
      <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.75">
        <stop offset="0.55" stopColor="#3a2a10" stopOpacity={0} />
        <stop offset="1" stopColor="#3a2a10" stopOpacity={0.16} />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill={P.paper} />
    <rect width={1920} height={1080} filter="url(#grain)" />
    <rect width={1920} height={1080} fill="url(#vignette)" />
  </svg>
);

/** Black pill tag, like the Planner's "D-DAY". */
export const Tag: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{display: 'inline-block', background: P.ink, color: P.paper, fontFamily: SANS, fontWeight: 700,
    fontSize: 26, letterSpacing: 4, padding: '10px 26px 10px 30px', borderRadius: 999, ...style}}>{children}</div>
);

/** Superscript in the display face. */
export const Sup: React.FC<{children: React.ReactNode}> = ({children}) => (
  <sup style={{fontSize: '0.55em', verticalAlign: '0.85em', marginLeft: '0.04em', letterSpacing: 0}}>{children}</sup>
);

/** A line of display math set in Fraunces. */
export const Line: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 96, color = P.ink, style}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: size, color, letterSpacing: '-0.01em', lineHeight: 1.15,
    fontVariantNumeric: 'lining-nums', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** Ink circle around the answer (like the Planner's "today"), drawn in as `progress` goes 0 -> 1. */
export const Circled: React.FC<{children: React.ReactNode; progress?: number}> = ({children, progress = 1}) => (
  <span style={{position: 'relative', display: 'inline-block', padding: '0 0.32em', margin: '0 0.08em'}}>
    {children}
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{position: 'absolute', left: 0, top: '-10%', width: '100%', height: '120%', overflow: 'visible'}}>
      <path d="M 50 3 C 80 3, 97 15, 97 30 C 97 46, 78 57, 50 57 C 22 57, 3 46, 3 30 C 3 15, 21 3, 50 3 C 56 3, 61 3.5, 65 4.5"
            fill="none" stroke={P.ink} strokeLinecap="round" vectorEffect="non-scaling-stroke"
            strokeDasharray={progress >= 1 ? undefined : `${progress * 300} 1000`} style={{strokeWidth: 6}} />
    </svg>
  </span>
);
