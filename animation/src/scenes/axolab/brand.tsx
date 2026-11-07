// Channel branding for Axol's Lab: profile picture, banner. Rendered as stills
// at their native sizes (no 1920x1080 stage), same paper / ink / tangerine style.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import {useFontsReady} from '../../lib/stage';
import {P, DISPLAY, SANS} from '../../lib/paper';
import {AxoSide, Gill, INK, PAPER, ORANGE} from '../../lib/cast';
import type {SceneProps} from '../../lib/types';

const PaperBg: React.FC<{color?: string; grain?: number}> = ({color = PAPER, grain = 0.5}) => {
  const {width, height} = useVideoConfig();
  return (
    <>
      <AbsoluteFill style={{background: color}} />
      <Img src={staticFile('grain.png')} style={{position: 'absolute', inset: 0, width, height, objectFit: 'cover', opacity: grain}} />
    </>
  );
};

/** Axo's head from the front: six feathery gills, two round white eyes, no mouth. */
export const AxoFace: React.FC<{x: number; y: number; scale?: number; look?: number}> = ({x, y, scale = 1, look = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {[-1, 1].map((s) => (
      <g key={s} transform={`scale(${s} 1)`}>
        <g transform="translate(-92 -40) scale(1.45)"><Gill x={0} y={0} angle={-128} len={58} /></g>
        <g transform="translate(-108 -8) scale(1.45)"><Gill x={0} y={0} angle={-156} len={64} /></g>
        <g transform="translate(-104 26) scale(1.45)"><Gill x={0} y={0} angle={-182} len={56} /></g>
      </g>
    ))}
    <ellipse cx={0} cy={0} rx={124} ry={90} fill={INK} />
    <circle cx={-52 + look} cy={-10} r={21} fill={PAPER} />
    <circle cx={52 + look} cy={-10} r={21} fill={PAPER} />
  </g>
);


/** A puffy gill frond: soft stalk with round bumps (cuter than the feathery one). */
const PuffGill: React.FC<{x: number; y: number; angle: number; len?: number}> = ({x, y, angle, len = 70}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect x={0} y={-11} width={len} height={22} rx={11} fill={INK} />
    {[0.35, 0.62, 0.88].map((t, i) => (
      <g key={i}>
        <circle cx={len * t} cy={-15} r={10.5 - i * 1.2} fill={INK} />
        <circle cx={len * t} cy={15} r={10.5 - i * 1.2} fill={INK} />
      </g>
    ))}
    <circle cx={len + 4} cy={0} r={16} fill={INK} />
  </g>
);

/** Cute Axo: round head, big sparkly eyes set low, blush, chubby body peeking up with little paws. */
export const AxoCute: React.FC<{x: number; y: number; scale?: number; tilt?: number; bg?: string}> = ({x, y, scale = 1, tilt = -6, bg = ORANGE}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`}>
    {/* body peeking up from below */}
    <ellipse cx={0} cy={215} rx={135} ry={125} fill={INK} />
    {[-1, 1].map((s) => (
      <g key={s} transform={`scale(${s} 1)`}>
        <PuffGill x={-112} y={-50} angle={-138} len={64} />
        <PuffGill x={-128} y={-8} angle={-166} len={72} />
        <PuffGill x={-118} y={34} angle={-194} len={60} />
      </g>
    ))}
    <ellipse cx={0} cy={0} rx={140} ry={112} fill={INK} />
    {[-1, 1].map((s) => (
      <g key={s}>
        {/* eye: white, big ink pupil, two sparkles */}
        <circle cx={s * 54} cy={10} r={33} fill={PAPER} />
        <circle cx={s * 54} cy={16} r={24} fill={INK} />
        <circle cx={s * 54 - 8} cy={5} r={9} fill={PAPER} />
        <circle cx={s * 54 + 9} cy={26} r={4} fill={PAPER} />
        {/* blush */}
        <ellipse cx={s * 96} cy={54} rx={22} ry={12} fill={P.pink} />
        {/* little paw resting on the edge */}
        <g transform={`translate(${s * 56} 112)`}>
          {/* outlined in the background colour so the paw reads against the body */}
          {[-18, 0, 18].map((t) => <circle key={t} cx={t} cy={-18} r={11} fill={INK} stroke={bg} strokeWidth={7} />)}
          <ellipse cx={0} cy={0} rx={34} ry={24} fill={INK} stroke={bg} strokeWidth={7} />
          {[-18, 0, 18].map((t) => <circle key={t} cx={t} cy={-18} r={11} fill={INK} />)}
        </g>
      </g>
    ))}
  </g>
);

// Profile picture (800x800; YouTube crops it to a circle).
export const BrandAvatar: React.FC<SceneProps> = (props) => {
  useFontsReady();
  const bg = (props.bg as string) ?? ORANGE;
  return (
    <AbsoluteFill>
      <PaperBg color={bg} grain={0.35} />
      <svg viewBox="0 0 800 800" width={800} height={800} style={{position: 'absolute', inset: 0}}>
        {props.face !== 'cute' ? <AxoFace x={400} y={445} scale={1.8} /> : <AxoCute x={400} y={370} scale={1.55} bg={bg} />}
      </svg>
    </AbsoluteFill>
  );
};

const sup = (s: string) => <sup style={{fontSize: '0.55em', verticalAlign: '0.85em'}}>{s}</sup>;

// Banner (2560x1440). Everything important sits in the 1546x423 centre that shows on every device.
export const BrandBanner: React.FC<SceneProps> = () => {
  useFontsReady();
  const faint: React.CSSProperties = {position: 'absolute', fontFamily: DISPLAY, fontWeight: 600, color: INK, opacity: 0.09, whiteSpace: 'nowrap'};
  return (
    <AbsoluteFill>
      <PaperBg />
      {/* faint margin notes, only seen on wide screens and TVs */}
      <div style={{...faint, left: 120, top: 180, fontSize: 120}}>6.02 × 10{sup('23')}</div>
      <div style={{...faint, left: 260, top: 1080, fontSize: 110}}>log 2 ≈ 0.3</div>
      <div style={{...faint, right: 140, top: 200, fontSize: 110}}>pH = −log[H{sup('+')}]</div>
      <div style={{...faint, right: 220, top: 1090, fontSize: 120}}>ln 2 ≈ 0.69</div>
      <svg viewBox="0 0 2560 1440" width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
        {/* a log ruler running along the bottom of the safe area */}
        <g transform="translate(560 912)" opacity={0.85}>
          <line x1={0} x2={1440} y1={0} y2={0} stroke={INK} strokeWidth={4} />
          {Array.from({length: 4}).map((_, d) =>
            [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const xx = (d + Math.log10(n)) * 360;
              return n === 1 || d < 3 ? <line key={`${d}${n}`} x1={xx} x2={xx} y1={0} y2={n === 1 ? -26 : -12} stroke={INK} strokeWidth={n === 1 ? 4 : 2.5} /> : null;
            }),
          )}
        </g>
        <AxoSide x={1760} y={905} scale={1.1} rear={1} arm={-6} holding="pencil" />
      </svg>
      <div style={{position: 'absolute', left: 600, top: 530}}>
        <div style={{display: 'inline-block', background: ORANGE, color: INK, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 6,
          padding: '12px 32px 12px 38px', borderRadius: 999}}>MCAT PREP</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 168, lineHeight: 0.95, color: INK, letterSpacing: '-0.03em', marginTop: 22}}>
          Axol’s <span style={{color: ORANGE}}>Lab</span>
        </div>
        <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 46, color: P.muted, marginTop: 14}}>MCAT science, no calculator required.</div>
      </div>
    </AbsoluteFill>
  );
};

export const brandScenes = {BrandAvatar, BrandBanner};
