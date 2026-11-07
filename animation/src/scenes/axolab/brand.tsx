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
const sub = (s: string) => <sub style={{fontSize: '0.55em', verticalAlign: '-0.25em'}}>{s}</sub>;

// Faint line-art doodles for the banner margins (ink strokes, no fills), drawn around (0,0).
const L = {fill: 'none', stroke: INK, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
const Stethoscope = () => (
  <g {...L}>
    <path d="M -70 -150 L -70 -40 C -70 30, 70 30, 70 -40 L 70 -150" />
    <circle cx={-70} cy={-160} r={9} /><circle cx={70} cy={-160} r={9} />
    <path d="M 0 5 L 0 70 C 0 160, 150 160, 150 70 L 150 40" />
    <circle cx={150} cy={10} r={34} /><circle cx={150} cy={10} r={14} />
  </g>
);
const Heart = () => (
  <g {...L}>
    <path d="M 0 90 C -40 60, -120 10, -120 -50 C -120 -110, -40 -120, 0 -60 C 40 -120, 120 -110, 120 -50 C 120 10, 40 60, 0 90 Z" />
    <path d="M -95 -20 L -45 -20 L -25 -65 L 5 30 L 30 -40 L 45 -20 L 95 -20" strokeWidth={6} />
  </g>
);
const Dna = ({n = 7}: {n?: number}) => (
  <g {...L}>
    <path d={Array.from({length: n * 8 + 1}).map((_, i) => `${i ? 'L' : 'M'} ${Math.sin(i / 8 * Math.PI) * 60} ${i * 15}`).join(' ')} />
    <path d={Array.from({length: n * 8 + 1}).map((_, i) => `${i ? 'L' : 'M'} ${-Math.sin(i / 8 * Math.PI) * 60} ${i * 15}`).join(' ')} />
    {Array.from({length: n * 2}).map((_, k) => {
      const i = k * 4 + 2; const xx = Math.sin(i / 8 * Math.PI) * 60;
      return <line key={k} x1={-xx} x2={xx} y1={i * 15} y2={i * 15} strokeWidth={5} />;
    })}
  </g>
);
const Atom = () => (
  <g {...L}>
    {[0, 60, 120].map((a) => <ellipse key={a} cx={0} cy={0} rx={130} ry={44} transform={`rotate(${a})`} />)}
    <circle cx={0} cy={0} r={14} fill={INK} />
  </g>
);
const Flask = () => (
  <g {...L}>
    <path d="M -30 -130 L -30 -40 L -110 100 C -118 116, -108 128, -90 128 L 90 128 C 108 128, 118 116, 110 100 L 30 -40 L 30 -130" />
    <line x1={-48} x2={48} y1={-130} y2={-130} />
    <path d="M -78 50 C -40 35, 40 65, 78 50" />
    <circle cx={-15} cy={90} r={10} /><circle cx={25} cy={70} r={7} />
  </g>
);
const Capsule = () => (
  <g {...L} transform="rotate(-35)">
    <rect x={-110} y={-40} width={220} height={80} rx={40} />
    <line x1={0} x2={0} y1={-40} y2={40} />
  </g>
);
const Neuron = () => (
  <g {...L}>
    <circle cx={0} cy={0} r={34} />
    {[200, 250, 140, 100].map((a) => (
      <path key={a} transform={`rotate(${a})`} d="M 34 0 L 95 0 M 70 0 L 105 -28 M 70 0 L 108 26" />
    ))}
    <path d="M 30 18 C 120 60, 200 40, 300 70" />
    {[110, 170, 230].map((x0) => <rect key={x0} x={x0 - 22} y={(x0 - 110) * 0.12 + 40} width={44} height={26} rx={13} transform={`rotate(10 ${x0} 60)`} />)}
    <path d="M 300 70 L 340 45 M 300 70 L 345 85" />
  </g>
);

// Banner (2560x1440). Everything important sits in the 1546x423 centre that shows on every device.
export const BrandBanner: React.FC<SceneProps> = () => {
  useFontsReady();
  const faint: React.CSSProperties = {position: 'absolute', fontFamily: DISPLAY, fontWeight: 600, color: INK, opacity: 0.1, whiteSpace: 'nowrap'};
  const doodle = (x: number, y: number, el: React.ReactNode, sc = 1, rot = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={0.11}>{el}</g>
  );
  return (
    <AbsoluteFill>
      <PaperBg />
      {/* faint margin notes across biology, chemistry, physics and math (wide screens and TVs) */}
      <div style={{...faint, left: 150, top: 150, fontSize: 92}}>pH = −log[H{sup('+')}]</div>
      <div style={{...faint, left: 940, top: 1180, fontSize: 92}}>F = ma</div>
      <div style={{...faint, right: 170, top: 1180, fontSize: 88}}>ΔG = ΔH − TΔS</div>
      <div style={{...faint, left: 1560, top: 150, fontSize: 88}}>C{sub('6')}H{sub('12')}O{sub('6')}</div>
      <svg viewBox="0 0 2560 1440" width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
        {doodle(280, 470, <Dna n={7} />, 0.9, 18)}
        {doodle(2330, 640, <Stethoscope />, 1.1, 12)}
        {doodle(1080, 230, <Atom />, 0.9)}
        {doodle(2240, 230, <Heart />, 0.9, -8)}
        {doodle(620, 1230, <Flask />, 0.85, -10)}
        {doodle(250, 1250, <Capsule />, 0.9)}
        {doodle(1500, 1230, <Neuron />, 0.7, -8)}
        {/* a heartbeat line running along the bottom of the safe area */}
        <path d="M 560 912 L 1060 912 L 1082 892 L 1104 912 L 1130 912 L 1155 862 L 1182 930 L 1204 896 L 1222 912 L 2000 912"
              fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
        <AxoSide x={1760} y={905} scale={1.1} rear={1} arm={-6} holding="pencil" />
      </svg>
      <div style={{position: 'absolute', left: 600, top: 530}}>
        <div style={{display: 'inline-block', background: ORANGE, color: INK, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 6,
          padding: '12px 32px 12px 38px', borderRadius: 999}}>MCAT PREP</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 168, lineHeight: 0.95, color: INK, letterSpacing: '-0.03em', marginTop: 22}}>
          Axol’s <span style={{color: ORANGE}}>Lab</span>
        </div>
        <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 46, color: P.muted, marginTop: 14}}>Bio, chem, physics &amp; psych, made simple.</div>
      </div>
    </AbsoluteFill>
  );
};

export const brandScenes = {BrandAvatar, BrandBanner};
