// Style frames for the new "riddle" script: hook, crate, elevator.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage, useFontsReady} from '../../lib/stage';
import {Paper, Tag, DISPLAY, SANS, P} from '../../lib/paper';
import {AxoSide, Calc, Pencil, Stamp, BigClock, Zero, Crate, INK, PAPER, ORANGE, COBALT, COBALT_TINT, LINE} from '../../lib/cast';
import type {SceneProps} from '../../lib/types';

const Frame: React.FC<{children: React.ReactNode; html?: React.ReactNode}> = ({children, html}) => {
  useFontsReady();
  return (
    <AbsoluteFill>
      <Stage html={<><Paper />{html}</>} over={children} />
    </AbsoluteFill>
  );
};

const Floor: React.FC<{y?: number}> = ({y = 940}) => <line x1={0} x2={1920} y1={y} y2={y} stroke={INK} strokeWidth={4} opacity={0.85} />;

// 1. Hook: Axo bursts in with a pencil-sword, the clock reads 96, Calc gets flicked and BANNED.
export const FrameHook: React.FC<SceneProps> = () => (
  <Frame>
    <Floor />
    {/* dark doorway (the black opening screen behind) and the kicked-open door */}
    <rect x={110} y={300} width={300} height={640} fill={INK} />
    <path d={`M 410 300 L 560 250 L 560 990 L 410 940 Z`} fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    <circle cx={530} cy={640} r={10} fill={INK} />
    {/* slow-motion speed lines */}
    {[[600, 560], [620, 610], [590, 660]].map(([lx, ly], i) => (
      <line key={i} x1={lx - 90} y1={ly} x2={lx - 20} y2={ly} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.35} />
    ))}
    <AxoSide x={800} y={940} scale={1.05} rear={1} arm={8} holding="pencil" sweat />
    <BigClock x={1150} y={330} r={180} value={96} />
    {/* the bouncer: a giant pencil standing guard */}
    <g transform="translate(1690 940) rotate(-90)">
      <Pencil len={620} w={120} face />
    </g>
    <path d="M 1640 640 Q 1560 650 1520 700" stroke={INK} strokeWidth={22} strokeLinecap="round" fill="none" />
    <circle cx={1512} cy={712} r={18} fill={INK} />
    {/* Calc, flicked across the floor */}
    <Calc x={1330} y={935} scale={0.85} rotate={-24} mood="shock" />
    {[[1240, 880], [1215, 905]].map(([lx, ly], i) => <line key={i} x1={lx} y1={ly} x2={lx - 70} y2={ly + 10} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.35} />)}
    <Stamp x={1310} y={770} text="BANNED" rotate={-14} scale={0.85} />
  </Frame>
);

// 2. Scientific notation: the zeros conga into the crate labelled x10^23.
export const FrameCrate: React.FC<SceneProps> = () => (
  <Frame
    html={
      <>
        <div style={{position: 'absolute', left: 0, width: 1920, top: 70, textAlign: 'center'}}>
          <Tag>SCIENTIFIC NOTATION</Tag>
          <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 52, color: P.muted, marginTop: 28, letterSpacing: 2}}>
            602,000,000,000,000,000,000,000
          </div>
        </div>
        <div style={{position: 'absolute', left: 150, top: 450, fontFamily: DISPLAY, fontWeight: 700, fontSize: 210, color: INK, lineHeight: 1}}>6.02</div>
        <div style={{position: 'absolute', left: 640, top: 500, fontFamily: DISPLAY, fontWeight: 600, fontSize: 130, color: P.muted, lineHeight: 1}}>×</div>
        <div style={{position: 'absolute', left: 150, top: 690, fontFamily: SANS, fontSize: 30, color: P.muted, fontWeight: 600}}>coefficient, between 1 and 10</div>
        <div style={{position: 'absolute', left: 820, top: 890, width: 380, textAlign: 'center', fontFamily: SANS, fontSize: 30, color: P.muted, fontWeight: 600}}>the crate = the exponent</div>
      </>
    }
  >
    <Floor y={870} />
    {/* compactor funnel feeding the crate */}
    <path d="M 860 330 L 1140 330 L 1060 430 L 940 430 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
    <rect x={940} y={430} width={120} height={40} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <Crate x={1000} y={870} w={380} h={300} label={<span>×10<sup style={{fontSize: '0.55em', verticalAlign: '0.9em'}}>23</sup></span>} />
    {/* the conga line marching in from the right */}
    {Array.from({length: 5}).map((_, i) => (
      <Zero key={i} x={1280 + i * 95} y={870} step={0.25 * i} scale={0.75} />
    ))}
    <path d="M 1240 760 Q 1190 700 1150 700" stroke={INK} strokeWidth={4} strokeDasharray="10 12" fill="none" opacity={0.5} />
    {/* Axo running alongside, panting */}
    <AxoSide x={1870} y={870} scale={0.5} dir={-1} run={0.2} sweat />
  </Frame>
);

// 3. Logarithms: the floor-counter elevator, stuck a third of the way up for log 2.
export const FrameElevator: React.FC<SceneProps> = () => {
  const y0 = 920, step = 235;
  const floorY = (n: number) => y0 - n * step;
  const carY = floorY(Math.log10(2));
  return (
    <Frame
      html={
        <>
          <div style={{position: 'absolute', left: 1180, top: 380}}>
            <Tag>LOGARITHMS</Tag>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 132, color: INK, marginTop: 30, lineHeight: 1, whiteSpace: 'nowrap'}}>log 2 ≈ 0.30</div>
            <div style={{fontFamily: SANS, fontSize: 32, color: P.muted, marginTop: 22, fontWeight: 600}}>stuck a third of the way to floor 1</div>
          </div>
        </>
      }
    >
      {/* glass tower */}
      <rect x={430} y={floorY(3) - 120} width={620} height={y0 - floorY(3) + 120} rx={18} fill={COBALT_TINT} fillOpacity={0.45} stroke={INK} strokeWidth={LINE} />
      {[0, 1, 2, 3].map((n) => (
        <g key={n}>
          <line x1={430} x2={1050} y1={floorY(n)} y2={floorY(n)} stroke={INK} strokeWidth={n === 0 ? LINE : 3} />
          <g transform={`translate(360 ${floorY(n)})`}>
            <rect x={-34} y={-30} width={68} height={60} rx={30} fill={INK} />
            <text x={0} y={14} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={PAPER}>{n}</text>
          </g>
          <text x={1030} y={floorY(n) - 16} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={52} fill={INK}>{[1, 10, 100, '1000'][n]}</text>
        </g>
      ))}
      {/* sign on the wall */}
      <g transform={`translate(470 ${floorY(3) - 92})`}>
        <rect width={300} height={58} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
        <text x={150} y={39} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={INK}>each floor up = ×10</text>
      </g>
      {/* elevator shaft and car */}
      <line x1={640} x2={640} y1={floorY(3) - 30} y2={y0} stroke={INK} strokeWidth={3} opacity={0.4} />
      <line x1={820} x2={820} y1={floorY(3) - 30} y2={y0} stroke={INK} strokeWidth={3} opacity={0.4} />
      <line x1={730} x2={730} y1={floorY(3) - 30} y2={carY - 190} stroke={INK} strokeWidth={3} />
      <g transform={`translate(0 ${carY})`}>
        <rect x={648} y={-190} width={164} height={190} rx={10} fill={PAPER} stroke={COBALT} strokeWidth={6} />
        <AxoSide x={700} y={-6} scale={0.36} rear={1} arm={-60} />
        {/* shudder marks */}
        {[-1, 1].map((s) => [0, 1].map((k) => (
          <path key={`${s}${k}`} d={`M ${730 + s * (100 + k * 18)} ${-140 + k * 30} q ${s * 8} 10 0 20 q ${-s * 8} 10 0 20`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        )))}
      </g>
      {/* the little "2", standing on its fractional floor */}
      <g transform={`translate(930 ${carY})`}>
        <line x1={-50} x2={50} y1={0} y2={0} stroke={ORANGE} strokeWidth={4} strokeDasharray="8 8" />
        <text x={0} y={-12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={96} fill={ORANGE}>2</text>
        <circle cx={-8} cy={-70} r={4.5} fill={INK} /><circle cx={10} cy={-70} r={4.5} fill={INK} />
      </g>
    </Frame>
  );
};



// Thumbnail in the channel style: paper, huge Fraunces, one accent, ink Axo.
export const Thumb: React.FC<SceneProps> = (props) => {
  const big = (props.big as string) ?? 'pH in';
  const hero = (props.hero as string) ?? '10s?';
  const tag = (props.tag as string) ?? 'NO CALCULATOR';
  const sub = (props.sub as string) ?? '';
  return (
    <Frame
      html={
        <>
          <div style={{position: 'absolute', left: 110, top: 96}}><Tag style={{fontSize: 34, padding: '14px 34px 14px 38px'}}>{tag}</Tag></div>
          {sub && <div style={{position: 'absolute', left: 114, top: 200, fontFamily: DISPLAY, fontWeight: 600, fontSize: 54, color: P.muted}}>{sub}</div>}
          <div style={{position: 'absolute', left: 100, top: 300, fontFamily: DISPLAY, fontWeight: 800, fontSize: 250, lineHeight: 0.95, color: INK, letterSpacing: '-0.03em'}}>
            {big}
          </div>
          <div style={{position: 'absolute', left: 100, top: 560, fontFamily: DISPLAY, fontWeight: 800, fontSize: 330, lineHeight: 0.95, color: ORANGE, letterSpacing: '-0.035em'}}>
            {hero}
          </div>
        </>
      }
    >
      <path d="M 520 548 C 790 545, 905 625, 900 735 C 895 860, 720 925, 470 922 C 220 919, 55 850, 58 735 C 61 615, 230 552, 470 549 C 560 548, 640 552, 700 563"
            fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <AxoSide x={1430} y={1010} scale={1.55} rear={1} arm={-6} holding="pencil" sweat />
    </Frame>
  );
};

/** Axo's ink hand seen from first person: a stubby arm with four round fingers. */
const PovArm: React.FC<{from: [number, number]; to: [number, number]; w?: number}> = ({from, to, w = 120}) => {
  const ang = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth={w} strokeLinecap="round" />
      <g transform={`translate(${to[0]} ${to[1]}) rotate(${ang})`}>
        <ellipse cx={10} cy={0} rx={w * 0.62} ry={w * 0.56} fill={INK} />
        {[-0.42, -0.14, 0.14, 0.42].map((k, i) => (
          <ellipse key={i} cx={w * 0.62 + (i === 0 || i === 3 ? -4 : 8)} cy={k * w * 1.05} rx={w * 0.2} ry={w * 0.13} fill={INK} />
        ))}
      </g>
    </g>
  );
};

// Thumbnail, first person: Axo's ink hands over an MCAT paper exam with the pH question.
export const ThumbExam: React.FC<SceneProps> = (props) => {
  const tag = (props.tag as string) ?? 'MCAT PREP';
  const big = (props.big as string) ?? 'pH in';
  const hero = (props.hero as string) ?? '10s?';
  const sub = (props.sub as string) ?? 'no calculator';
  const vals = (props.choices as string[] | undefined) ?? ['3.48', '4.52', '5.00', '5.48'];
  const choices: [string, string][] = vals.map((v, i) => ['ABCD'[i], v]);
  const qLines = typeof props.q === 'string' ? (props.q as string).split('|') : null;  // custom question (answer stays on B)
  return (
    <Frame
      html={
        <>
          {/* the exam sheet on the desk, seen from above */}
          <div style={{position: 'absolute', left: 860, top: 70, width: 900, height: 1180, transformOrigin: '50% 0%',
            transform: 'perspective(2200px) rotateX(16deg) rotateZ(-5deg)'}}>
            <div style={{position: 'absolute', inset: 0, background: '#fffdf8', border: `5px solid ${INK}`, borderRadius: 14,
              boxShadow: '0 30px 60px rgba(58,42,16,0.18)', padding: '46px 60px'}}>
              <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `5px solid ${INK}`, paddingBottom: 18}}>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 0.85, color: INK, letterSpacing: '-0.03em'}}>MCAT</div>
                <div style={{textAlign: 'right', fontFamily: SANS, fontWeight: 800, color: INK}}>
                  <div style={{fontSize: 30, letterSpacing: 5, whiteSpace: 'nowrap'}}>PRACTICE TEST</div>
                  <div style={{fontSize: 21, letterSpacing: 2, color: P.muted, marginTop: 8, whiteSpace: 'nowrap'}}>CHEM / PHYS · SECTION 1</div>
                </div>
              </div>
              <div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 22}}>
                <Tag style={{fontSize: 26, padding: '8px 22px 8px 26px'}}>Q 12</Tag>
                <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: ORANGE, letterSpacing: 3}}>NO CALCULATOR</div>
              </div>
              <div style={{marginTop: 26, fontFamily: DISPLAY, fontWeight: 600, fontSize: 62, lineHeight: 1.18, color: INK}}>
                {qLines ? qLines.map((l, i) => <div key={i}>{l}</div>) : <>[H<sup style={{fontSize: '0.55em'}}>+</sup>] = 3 × 10<sup style={{fontSize: '0.55em'}}>−5</sup> M.<br />What is the pH?</>}
              </div>
              <div style={{marginTop: 34}}>
                {choices.map(([k, v]) => (
                  <div key={k} style={{display: 'flex', alignItems: 'center', gap: 26, height: 88}}>
                    <div style={{width: 58, height: 58, borderRadius: 99, border: `4px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: SANS, fontWeight: 800, fontSize: 28, background: k === 'B' ? INK : 'transparent', color: k === 'B' ? PAPER : INK}}>{k}</div>
                    <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 56, color: INK}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* the headline */}
          <div style={{position: 'absolute', left: 96, top: 92}}><Tag style={{fontSize: 40, padding: '16px 38px 16px 44px', background: ORANGE, color: INK}}>{tag}</Tag></div>
          <div style={{position: 'absolute', left: 88, top: 250, fontFamily: DISPLAY, fontWeight: 800, fontSize: 230, lineHeight: 0.95, color: INK, letterSpacing: '-0.03em'}}>{big}</div>
          <div style={{position: 'absolute', left: 88, top: 480, fontFamily: DISPLAY, fontWeight: 800, fontSize: 310, lineHeight: 0.95, color: ORANGE, letterSpacing: '-0.035em'}}>{hero}</div>
          {sub && <div style={{position: 'absolute', left: 100, top: 820, fontFamily: DISPLAY, fontWeight: 600, fontSize: 62, color: P.muted}}>{sub}</div>}
        </>
      }
    >
      {/* Axo's hands: the left one pins the sheet, the right one has just circled B */}
      <g transform="rotate(-6 1075 758)">
        <path d="M 1222 742 C 1230 700, 1150 690, 1070 692 C 970 694, 905 715, 905 760 C 905 805, 985 826, 1075 824 C 1160 822, 1238 800, 1236 756"
              fill="none" stroke={ORANGE} strokeWidth={10} strokeLinecap="round" />
      </g>
      <PovArm from={[800, 1260]} to={[870, 1065]} w={110} />
      <g transform={`translate(${props.px ?? 1570} ${props.py ?? 888}) rotate(${props.pr ?? 194})`}>
        <Pencil len={400} w={40} />
      </g>
      <PovArm from={[1860, 1260]} to={[1520, 905]} w={120} />
    </Frame>
  );
};

export const frameScenes = {FrameHook, FrameCrate, FrameElevator, Thumb, ThumbExam};
