// Scenes for the Axol's Lab video "Calculator-free MCAT math".
import React from 'react';
import {useCurrentFrame, interpolate, spring} from 'remotion';
import {C, FONT, W} from '../../lib/theme';
import {tween} from '../../lib/shapes';
import {Axo, Bubble} from '../../lib/axo';
import {Desk} from '../../lib/lab';
import {Board, Chip, Tex, Rich} from '../../lib/math';
import {makeCue} from '../../lib/cues';
import type {SceneProps} from '../../lib/types';
import {LabScene, QuestionCard, BoardScene, axoAt} from './common';

const GOLD = '#ffd166';
const MINT = '#7cf5d0';
const RED = '#ff5d73';

const fadeIn = (f: number, at: number, d = 12) => tween(f, at, at + d, 0, 1);
const pop = (f: number, at: number, fps: number) => spring({frame: f - at, fps, config: {damping: 14, mass: 0.6}});

const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({children, size = 48, color = C.text, weight = 700, style}) => (
  <div style={{fontFamily: FONT, fontSize: size, color, fontWeight: weight, lineHeight: 1.2, ...style}}>{children}</div>
);

// ----------------------------------------------------------------------------- Cold open
export const ColdOpen: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = makeCue(props);
  const c59 = cue('Fifty-nine', 0.02), c95 = cue('Ninety-five', 0.08), c96 = cue('ninety-six', 0.14);
  const noCalc = cue('no calculator', 0.22);
  const q = cue("Axo's", 0.3), ph = cue("What's the pH", 0.5);
  const noCalc2 = cue('No calculator', 0.6, 0, 2), panic = cue('No panic', 0.65), hand = cue('by hand', 0.8);
  const ax = axoAt(f, [{at: noCalc2, expression: 'worried'}, {at: panic, expression: 'thinking'}, {at: hand, expression: 'excited', pose: 'rest'}],
    {expression: 'focused', pose: 'write'});
  const statsOut = tween(f, q - 10, q + 5, 1, 0);
  const secs = Math.max(0, 96 - Math.max(0, f - c96) / fps);
  const clockIn = fadeIn(f, c96);
  const ring = secs / 96;
  const tray = fadeIn(f, noCalc);
  const cx = 1650, cy = 250, r = 120;
  return (
    <LabScene
      svg={
        <g>
          <Axo x={720} y={560} scale={1.05} seated expression={ax.expression} pose={ax.pose} look={[0.3, 0.6]} />
          <Desk x={330} y={700} w={1100} />
          {/* exam paper */}
          <g transform="translate(560 650) skewX(-18)">
            <rect x={0} y={0} width={240} height={52} fill="#fbf8f1" />
            {[12, 24, 36].map((y) => <rect key={y} x={16} y={y} width={180 - y} height={4} fill="#c8c2d8" />)}
          </g>
          {/* empty calculator tray */}
          <g transform="translate(1060 640)">
            <rect x={0} y={20} width={260} height={56} rx={14} fill="#5b3c27" />
            <rect x={10} y={26} width={240} height={44} rx={10} fill="#3d281a" />
            <g opacity={0.5 + 0.5 * (1 - tray)}>
              <rect x={70} y={-140} width={120} height={170} rx={14} fill="none" stroke="#c8c2d8" strokeWidth={4} strokeDasharray="10 9" />
              {Array.from({length: 9}).map((_, i) => (
                <rect key={i} x={86 + (i % 3) * 32} y={-80 + Math.floor(i / 3) * 32} width={22} height={22} rx={5} fill="none" stroke="#c8c2d8" strokeWidth={3} strokeDasharray="5 5" />
              ))}
              <rect x={86} y={-124} width={88} height={30} rx={5} fill="none" stroke="#c8c2d8" strokeWidth={3} strokeDasharray="5 5" />
            </g>
            <g opacity={tray} transform={`translate(130 -55) scale(${0.6 + 0.4 * tray})`}>
              <circle r={70} fill="none" stroke={RED} strokeWidth={12} />
              <line x1={-50} y1={50} x2={50} y2={-50} stroke={RED} strokeWidth={12} strokeLinecap="round" />
            </g>
          </g>
          {/* countdown clock */}
          <g opacity={clockIn}>
            <circle cx={cx} cy={cy} r={r} fill="#0e0b2a" stroke="#ffffff" strokeOpacity={0.15} strokeWidth={4} />
            <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke="#ffffff" strokeOpacity={0.1} strokeWidth={16} />
            <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke={secs < 80 ? GOLD : MINT} strokeWidth={16} strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * (r - 18) * ring} ${2 * Math.PI * (r - 18)}`} transform={`rotate(-90 ${cx} ${cy})`} />
            <text x={cx} y={cy + 22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={64} fill={C.text}>{Math.ceil(secs)}</text>
            <text x={cx} y={cy + 60} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={22} fill={C.muted}>seconds</text>
          </g>
        </g>
      }
      html={
        <>
          <div style={{position: 'absolute', left: 110, top: 80, display: 'flex', gap: 28, opacity: statsOut}}>
            <Chip opacity={fadeIn(f, c59)} color={MINT}>59 questions</Chip>
            <Chip opacity={fadeIn(f, c95)} color={MINT}>95 minutes</Chip>
            <Chip opacity={fadeIn(f, c96)} color={GOLD}>≈ 96 s each</Chip>
          </div>
          <div style={{position: 'absolute', left: 1160, top: 760, opacity: tray}}>
            <Big size={34} color={RED} weight={800}>no calculator</Big>
          </div>
          {f >= q - 10 && (
            <QuestionCard x={110} y={70} w={1300} opacity={fadeIn(f, q)}
                          tex={f < ph ? '[\\mathrm{H^+}] = 3\\times10^{-5}\\ \\mathrm{M}' : '[\\mathrm{H^+}] = 3\\times10^{-5}\\ \\mathrm{M} \\qquad \\mathrm{pH} = \\,?'} />
          )}
          <div style={{position: 'absolute', left: 110, top: 300, opacity: fadeIn(f, hand)}}>
            <Big size={40} color={MINT} weight={800}>✓ doable by hand</Big>
          </div>
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Roadmap
export const Roadmap: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const items = [
    {cue: 'scientific', label: 'Scientific notation', tex: '6.02\\times10^{23}'},
    {cue: 'exponent', label: 'Exponent rules', tex: '10^{a}\\cdot10^{b}=10^{a+b}'},
    {cue: 'logarithms', label: 'Logarithms', tex: '\\log 2 \\approx 0.30'},
    {cue: 'significant', label: 'Significant digits', tex: '1.50'},
    {cue: 'estimation', label: 'Estimation', tex: '6.9\\times4.1\\approx 28'},
  ];
  const easier = cue('easier', 0.85);
  const ax = axoAt(f, [{at: easier, expression: 'excited', pose: 'cheer'}], {expression: 'happy', pose: 'wave'});
  return (
    <LabScene
      svg={<Axo x={330} y={700} scale={0.95} expression={ax.expression} pose={ax.pose} look={[0.6, 0]} />}
      html={
        <div style={{position: 'absolute', left: 700, top: 110, width: 1100}}>
          <Big size={40} color={C.accent} weight={800} style={{letterSpacing: 2, textTransform: 'uppercase', opacity: fadeIn(f, 0)}}>Your calculator-free toolkit</Big>
          <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 30}}>
            {items.map((it, i) => {
              const at = cue(it.cue, (i + 1) / 7);
              const a = fadeIn(f, at, 10);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, opacity: a, transform: `translateX(${(1 - a) * 40}px)`,
                  background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '18px 30px'}}>
                  <div style={{width: 60, height: 60, borderRadius: 30, background: GOLD, color: '#2a1830', fontFamily: FONT, fontWeight: 900,
                    fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
                  <Big size={44} weight={800} style={{width: 470}}>{it.label}</Big>
                  <Tex tex={it.tex} size={44} color={MINT} />
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Title
export const LabTitle: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const a = fadeIn(f, 0, 15) * tween(f, props.durationInFrames - 12, props.durationInFrames, 1, 0);
  return (
    <LabScene dim={0.25}
      svg={<Axo x={1600} y={760} scale={0.75} expression="excited" pose="wave" look={[-0.6, -0.3]} />}
      html={
        <div style={{position: 'absolute', left: 0, top: 380, width: W, textAlign: 'center', opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
          <Big size={30} color={C.accent} weight={800} style={{letterSpacing: 6, textTransform: 'uppercase'}}>{String(props.subtitle ?? "Axol's Lab")}</Big>
          <Big size={104} weight={900} style={{marginTop: 10}}>{String(props.title ?? '')}</Big>
          <div style={{width: 140, height: 10, borderRadius: 5, background: GOLD, margin: '28px auto 0'}} />
        </div>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Scientific notation intro
/** A row of digits with a decimal point that hops between them. */
const DigitRow: React.FC<{digits: string; point: number; y: number; size?: number; dimFrom?: number; dimTo?: number; dim?: number; group?: boolean}> = ({
  digits, point, y, size = 84, dimFrom = 99, dimTo = 99, dim = 0, group = false,
}) => {
  const n = digits.length;
  const bw = size * 0.62, gap = group ? size * 0.28 : 0;
  const gapsBefore = (i: number) => (group ? Array.from({length: i}).filter((_, k) => k > 0 && (n - k) % 3 === 0).length : 0);
  const xAt = (i: number) => i * bw + gapsBefore(i) * gap;
  const total = xAt(n);
  const left = (W - total) / 2;
  const pi = Math.floor(point), frac = point - pi;
  const px = left + xAt(pi) + (xAt(Math.min(n, pi + 1)) - xAt(pi)) * frac;
  const hop = Math.sin(frac * Math.PI) * size * 0.45;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: W, height: size * 1.3}}>
      {digits.split('').map((d, i) => (
        <div key={i} style={{position: 'absolute', left: left + xAt(i), width: bw, textAlign: 'center', fontFamily: FONT,
          fontWeight: 800, fontSize: size, color: C.text, fontVariantNumeric: 'tabular-nums',
          opacity: i >= dimFrom && i < dimTo ? 1 - dim * 0.85 : 1}}>{d}</div>
      ))}
      <div style={{position: 'absolute', left: px - size * 0.11, top: size * 0.78 - hop, width: size * 0.22, height: size * 0.22,
        borderRadius: '50%', background: GOLD, boxShadow: `0 0 20px ${GOLD}`}} />
    </div>
  );
};

export const SciIntro: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = makeCue(props);
  const coef = cue('coefficient', 0.08), avo = cue("Avogadro's", 0.22), conv = cue('To convert', 0.42);
  const left = cue('Move left', 0.55), right = cue('Move right', 0.65), so = cue('So', 0.75), becomes2 = cue('becomes', 0.88, 0, 2);
  // phase A: Avogadro's number, decimal hops 23 places to the left
  const hopA = tween(f, avo + 8, avo + 8 + 2.2 * fps, 24, 1, (x) => x);
  const doneA = fadeIn(f, avo + 8 + 2.2 * fps, 14);
  const phaseA = tween(f, conv - 12, conv, 1, 0);
  // phase B: 0.00045, decimal hops 4 places to the right
  const hopB = tween(f, so + 6, becomes2, 1, 5, (x) => x);
  const doneB = fadeIn(f, becomes2, 12);
  const phaseB = fadeIn(f, conv, 12);
  const kA = Math.round(24 - hopA), kB = Math.round(hopB - 1);
  return (
    <LabScene dim={0.15}
      svg={<Axo x={190} y={880} scale={0.55} expression={f > becomes2 ? 'excited' : 'happy'} pose={f > avo && f < avo + 3 * fps ? 'point' : 'rest'} look={[0.8, -0.6]} />}
      html={
        <>
          <div style={{position: 'absolute', left: 0, width: W, top: 110, textAlign: 'center', opacity: fadeIn(f, coef) * phaseA}}>
            <Tex tex={'\\color{#7cf5d0}{a} \\times 10^{\\color{#ffd166}{n}}'} size={90} />
            <div style={{marginTop: 4}}><Rich text={'coefficient $1 \\le a < 10$   ·   $n$ = power of ten'} size={34} color={C.muted} /></div>
          </div>
          {phaseA > 0 && (
            <div style={{opacity: phaseA}}>
              <DigitRow digits="602000000000000000000000" point={hopA} y={420} size={76} group={hopA > 23.5} dimFrom={3} dimTo={24} dim={doneA} />
              <div style={{position: 'absolute', left: 0, width: W, top: 560, textAlign: 'center', opacity: fadeIn(f, avo + 8)}}>
                <Tex tex={`\\text{decimal moved } ${kA} \\text{ places}`} size={44} color={C.muted} />
              </div>
              <div style={{position: 'absolute', left: 0, width: W, top: 660, textAlign: 'center', opacity: doneA, transform: `scale(${0.9 + 0.1 * doneA})`}}>
                <Tex tex={'6.02 \\times 10^{23}'} size={120} color={GOLD} />
                <Big size={32} color={C.muted}>Avogadro's number</Big>
              </div>
            </div>
          )}
          {phaseB > 0 && (
            <div style={{opacity: phaseB}}>
              <div style={{position: 'absolute', left: 0, width: W, top: 180, display: 'flex', justifyContent: 'center', gap: 80}}>
                <div style={{opacity: fadeIn(f, left)}}><Rich text={'decimal ← left: exponent **goes up**'} size={40} /></div>
                <div style={{opacity: fadeIn(f, right)}}><Rich text={'decimal → right: exponent **goes down**'} size={40} /></div>
              </div>
              {f >= so - 6 && <DigitRow digits="000045" point={hopB} y={450} size={110} dimFrom={0} dimTo={4} dim={doneB} />}
              <div style={{position: 'absolute', left: 0, width: W, top: 620, textAlign: 'center', opacity: fadeIn(f, so + 6)}}>
                <Tex tex={`\\times 10^{${kB === 0 ? '0' : '-' + kB}}`} size={56} color={C.muted} />
              </div>
              <div style={{position: 'absolute', left: 0, width: W, top: 740, textAlign: 'center', opacity: doneB}}>
                <Tex tex={'0.00045 = \\color{#ffd166}{4.5 \\times 10^{-4}}'} size={96} />
              </div>
            </div>
          )}
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Logs: power meter
export const PowerMeter: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = makeCue(props);
  const ask = cue('what power', 0.1);
  const items = [
    {at: cue('one thousand', 0.3), x: '1000', v: 3, why: '10^{3} = 1000'},
    {at: cue('of one is', 0.55), x: '1', v: 0, why: '10^{0} = 1'},
    {at: cue('of ten is', 0.68), x: '10', v: 1, why: '10^{1} = 10'},
    {at: cue('point zero one', 0.82), x: '0.01', v: -2, why: '10^{-2} = 0.01'},
  ];
  const cur = [...items].reverse().find((it) => f >= it.at);
  // needle springs between values
  let val = 0;
  items.forEach((it, i) => {
    const prev = i === 0 ? 0 : items[i - 1].v;
    val += (it.v - prev) * spring({frame: f - it.at, fps, config: {damping: 12}});
  });
  const gx = 1260, gy = 720, gr = 330;
  const ang = (v: number) => Math.PI + ((v + 3) / 7) * Math.PI; // -3..4 across the half circle
  const ticks = [-3, -2, -1, 0, 1, 2, 3, 4];
  const bubble = tween(f, ask, ask + 8, 0, 1) * tween(f, items[0].at + 20, items[0].at + 30, 1, 0.0);
  return (
    <LabScene dim={0.15}
      svg={
        <g>
          <Axo x={300} y={705} scale={0.9} expression={f < items[0].at ? 'thinking' : 'happy'} pose={f < items[0].at ? 'chin' : 'point'} look={[0.8, -0.3]} />
          <Bubble x={380} y={360} w={420} h={110} opacity={bubble}>What power of ten?</Bubble>
          {/* gauge */}
          <path d={`M ${gx - gr} ${gy} A ${gr} ${gr} 0 0 1 ${gx + gr} ${gy}`} fill="#100c2e" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={6} />
          <path d={`M ${gx - gr + 40} ${gy} A ${gr - 40} ${gr - 40} 0 0 1 ${gx + gr - 40} ${gy}`} fill="none" stroke="url(#gaugeGrad)" strokeWidth={26} />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" x2="1">
              <stop offset="0" stopColor="#8fb8ff" /><stop offset="0.5" stopColor={MINT} /><stop offset="1" stopColor={GOLD} />
            </linearGradient>
          </defs>
          {ticks.map((t) => {
            const a = ang(t);
            return (
              <g key={t}>
                <line x1={gx + Math.cos(a) * (gr - 70)} y1={gy + Math.sin(a) * (gr - 70)} x2={gx + Math.cos(a) * (gr - 92)} y2={gy + Math.sin(a) * (gr - 92)} stroke="#ffffff" strokeWidth={5} />
                <text x={gx + Math.cos(a) * (gr - 130)} y={gy + Math.sin(a) * (gr - 130) + 14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={C.text}>{t}</text>
              </g>
            );
          })}
          <g transform={`rotate(${(ang(val) * 180) / Math.PI} ${gx} ${gy})`}>
            <path d={`M ${gx} ${gy - 12} L ${gx + gr - 60} ${gy} L ${gx} ${gy + 12} Z`} fill={RED} />
          </g>
          <circle cx={gx} cy={gy} r={26} fill="#ffffff" />
          <text x={gx} y={gy + 80} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.muted}>power of ten</text>
        </g>
      }
      html={
        <>
          {cur && (
            <div key={cur.x} style={{position: 'absolute', left: 760, width: 1000, top: 90, textAlign: 'center', opacity: fadeIn(f, cur.at, 8)}}>
              <Tex tex={`\\log(${cur.x}) = \\color{#ffd166}{${cur.v}}`} size={92} />
              <div><Tex tex={`\\text{because } ${cur.why}`} size={46} color={C.muted} /></div>
            </div>
          )}
          <div style={{position: 'absolute', left: 820, top: 880, display: 'flex', gap: 22}}>
            {items.map((it, i) => (
              <Chip key={i} opacity={fadeIn(f, it.at)} color={i === items.indexOf(cur ?? items[0]) ? GOLD : '#8fb8ff'}>
                <Tex tex={`\\log ${it.x} = ${it.v}`} size={34} />
              </Chip>
            ))}
          </div>
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Logs: the log ladder
export const LogLadder: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const x0 = 180, x1 = 1740, y = 600;
  const X = (n: number) => x0 + Math.log10(n) * (x1 - x0);
  const entries: {n: number; v: string; at: number; tex: string; memo?: boolean}[] = [
    {n: 2, v: '0.30', at: cue('log two', 0.08), tex: '\\log 2 \\approx 0.30', memo: true},
    {n: 3, v: '0.48', at: cue('log three', 0.18), tex: '\\log 3 \\approx 0.48', memo: true},
    {n: 5, v: '0.70', at: cue('Five is', 0.35), tex: '\\log 5 = \\log\\tfrac{10}{2} = 1 - 0.30 = 0.70'},
    {n: 4, v: '0.60', at: cue('Four is', 0.5), tex: '\\log 4 = \\log 2^{2} = 2(0.30) = 0.60'},
    {n: 6, v: '0.78', at: cue('Six is', 0.62), tex: '\\log 6 = \\log 2 + \\log 3 = 0.78'},
    {n: 8, v: '0.90', at: cue('Eight is', 0.76), tex: '\\log 8 = 3\\log 2 = 0.90'},
    {n: 9, v: '0.96', at: cue('Nine is', 0.88), tex: '\\log 9 = 2\\log 3 \\approx 0.96'},
  ];
  const cur = [...entries].reverse().find((e) => f >= e.at);
  const everything = cue('Everything else', 0.25);
  return (
    <LabScene dim={0.2}
      svg={
        <g>
          <Axo x={1700} y={880} scale={0.5} expression={cur && !cur.memo ? 'excited' : 'happy'} pose="point" flip look={[0.6, -0.8]} />
          <rect x={x0 - 40} y={y - 14} width={x1 - x0 + 80} height={28} rx={14} fill="#ffffff" opacity={0.12} />
          <rect x={x0} y={y - 5} width={x1 - x0} height={10} rx={5} fill={MINT} opacity={0.7} />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const e = entries.find((q) => q.n === n);
            const on = n === 1 || n === 10 || (e && f >= e.at);
            const isCur = cur && cur.n === n;
            const a = e ? fadeIn(f, e.at, 10) : 1;
            return (
              <g key={n}>
                <line x1={X(n)} x2={X(n)} y1={y - 40} y2={y + 40} stroke={isCur ? GOLD : '#ffffff'} strokeWidth={isCur ? 8 : 5} opacity={n === 7 ? 0.35 : 1} />
                {isCur && <circle cx={X(n)} cy={y} r={30} fill={GOLD} opacity={0.25} />}
                <text x={X(n)} y={y + 100} textAnchor="middle" fontFamily={FONT} fontSize={56} fontWeight={800} fill={n === 7 ? '#ffffff55' : C.text}>{n}</text>
                {on && (
                  <text x={X(n)} y={y - 64} textAnchor="middle" fontFamily={FONT} fontSize={40} fontWeight={800} opacity={a}
                        fill={e?.memo ? GOLD : n === 1 || n === 10 ? C.muted : MINT}>{n === 1 ? '0' : n === 10 ? '1' : e!.v}</text>
                )}
              </g>
            );
          })}
          <text x={x0 - 60} y={y - 64} textAnchor="end" fontFamily={FONT} fontSize={30} fontWeight={700} fill={C.muted}>log</text>
          <text x={x0 - 60} y={y + 100} textAnchor="end" fontFamily={FONT} fontSize={30} fontWeight={700} fill={C.muted}>x</text>
        </g>
      }
      html={
        <>
          <div style={{position: 'absolute', left: 0, width: W, top: 90, textAlign: 'center'}}>
            <Big size={40} color={C.accent} weight={800} style={{letterSpacing: 2, textTransform: 'uppercase'}}>Memorize two numbers</Big>
            <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginTop: 20}}>
              <Chip opacity={fadeIn(f, entries[0].at)} color={GOLD}><Tex tex="\log 2 \approx 0.30" size={44} /></Chip>
              <Chip opacity={fadeIn(f, entries[1].at)} color={GOLD}><Tex tex="\log 3 \approx 0.48" size={44} /></Chip>
            </div>
          </div>
          {cur && !cur.memo && (
            <div key={cur.n} style={{position: 'absolute', left: 0, width: W, top: 790, textAlign: 'center', opacity: fadeIn(f, cur.at, 8)}}>
              <Tex tex={cur.tex} size={66} />
            </div>
          )}
          <div style={{position: 'absolute', left: 0, width: W, top: 330, textAlign: 'center', opacity: fadeIn(f, everything) * (cur && !cur.memo ? 0 : 1)}}>
            <Big size={34} color={C.muted}>everything else comes from them</Big>
          </div>
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- pH scale
export const PhScale: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const tenfold = cue('tenfold', 0.12), vs = cue('three versus five', 0.35), huge = cue('huge ranges', 0.6), db = cue('decibels', 0.85);
  const x0 = 170, x1 = 1750, y = 470, h = 90;
  const X = (p: number) => x0 + 50 + (p / 14) * (x1 - x0 - 100);
  const colors = ['#ff3b3b', '#ff7a2f', '#ffb52e', '#ffe14d', '#c7e85b', '#8bd96b', '#4fcf7f', '#36c2a0', '#35a9c9', '#3f86d8', '#4f67d6', '#6a52cf', '#7d43c4', '#8d36b3', '#9a2aa0'];
  return (
    <LabScene dim={0.2}
      svg={
        <g>
          <Axo x={200} y={890} scale={0.5} expression={f > vs ? 'excited' : 'happy'} pose="point" look={[0.8, -0.8]} />
          <defs>
            <linearGradient id="phg" x1="0" x2="1">{colors.map((c, i) => <stop key={i} offset={i / 14} stopColor={c} />)}</linearGradient>
          </defs>
          <rect x={x0} y={y} width={x1 - x0} height={h} rx={h / 2} fill="url(#phg)" />
          {Array.from({length: 15}).map((_, p) => (
            <g key={p}>
              <text x={X(p)} y={y + h / 2 + 14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={38} fill="#1b1236">{p}</text>
            </g>
          ))}
          {/* tenfold arcs between steps */}
          {Array.from({length: 6}).map((_, k) => {
            const a = fadeIn(f, tenfold + k * 6, 8);
            const p = 6 + k;
            return (
              <g key={k} opacity={a * tween(f, vs - 10, vs, 1, 0.25)}>
                <path d={`M ${X(p)} ${y - 10} Q ${(X(p) + X(p + 1)) / 2} ${y - 80} ${X(p + 1)} ${y - 10}`} fill="none" stroke={MINT} strokeWidth={5} />
                <text x={(X(p) + X(p + 1)) / 2} y={y - 74} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={MINT}>×10</text>
              </g>
            );
          })}
          {/* pH 3 vs 5 */}
          <g opacity={fadeIn(f, vs)}>
            {[3, 5].map((p) => (
              <g key={p}>
                <circle cx={X(p)} cy={y + h / 2} r={48} fill="none" stroke="#ffffff" strokeWidth={8} />
              </g>
            ))}
            <path d={`M ${X(3)} ${y + h + 30} V ${y + h + 60} H ${X(5)} V ${y + h + 30}`} fill="none" stroke={GOLD} strokeWidth={6} />
            <text x={X(4)} y={y + h + 120} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={GOLD}>×100</text>
          </g>
        </g>
      }
      html={
        <>
          <div style={{position: 'absolute', left: 0, width: W, top: 90, textAlign: 'center', opacity: fadeIn(f, 0)}}>
            <Big size={46} color={C.accent} weight={800}>Each pH step = 10× the concentration</Big>
          </div>
          <div style={{position: 'absolute', left: 0, width: W, top: 190, textAlign: 'center', opacity: fadeIn(f, vs)}}>
            <Tex tex={'\\mathrm{pH}\\ 3:\\ 10^{-3}\\ \\mathrm{M} \\qquad \\mathrm{pH}\\ 5:\\ 10^{-5}\\ \\mathrm{M} \\qquad \\tfrac{10^{-3}}{10^{-5}} = \\color{#ffd166}{100}'} size={50} />
          </div>
          <div style={{position: 'absolute', left: 0, width: W, top: 770, textAlign: 'center', opacity: fadeIn(f, huge) * tween(f, db - 8, db, 1, 0.35)}}>
            <Tex tex={'10^{0} \\ldots 10^{-14}\\ \\mathrm{M} \\;\\longrightarrow\\; \\mathrm{pH}\\ 0 \\ldots 14'} size={58} color={C.text} />
          </div>
          <div style={{position: 'absolute', left: 0, width: W, top: 880, display: 'flex', justifyContent: 'center', opacity: fadeIn(f, db)}}>
            <Chip color={MINT}><span style={{fontSize: 40}}>🔊</span> Sound decibels use logs too</Chip>
          </div>
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Natural log
export const NaturalLog: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = makeCue(props);
  const steps = [
    {at: cue('uses', 0.06), tex: '\\ln x = \\log_{e} x, \\quad e \\approx 2.718'},
    {at: cue('same three rules', 0.18), text: 'Same three rules as log', color: '#a49fd6'},
    {at: cue('of one is zero', 0.26), tex: '\\ln 1 = 0, \\qquad \\ln e = 1'},
    {at: cue('To convert', 0.38), tex: '\\ln x \\approx \\color{#ffd166}{2.3}\\,\\log x'},
    {at: cue('because', 0.48), tex: '\\text{since } \\ln 10 \\approx 2.3'},
    {at: cue('one hundred', 0.58), tex: '\\ln 100 \\approx 2.3 \\times 2 = \\color{#ffd166}{4.6}'},
    {at: cue('0.69', 0.7), tex: '\\ln 2 \\approx \\color{#ffd166}{0.69}', note: 'half-lives'},
    {at: cue('radioactive', 0.85), text: 'Shows up in: radioactive decay · Arrhenius · more', color: MINT},
  ];
  // graph of e^x
  const gx0 = 110, gx1 = 800, gy0 = 930, gy1 = 150;
  const xmin = -2, xmax = 2.4, ymax = 11;
  const PX = (x: number) => gx0 + ((x - xmin) / (xmax - xmin)) * (gx1 - gx0);
  const PY = (y: number) => gy0 - (y / ymax) * (gy0 - gy1);
  const draw = tween(f, 0, 2.5 * fps, 0, 1);
  const pts: string[] = [];
  for (let i = 0; i <= 120 * draw; i++) {
    const x = xmin + (i / 120) * (xmax - xmin);
    pts.push(`${PX(x)} ${PY(Math.exp(x))}`);
  }
  const eDot = fadeIn(f, steps[0].at);
  return (
    <LabScene dim={0.25}
      svg={
        <g>
          <rect x={60} y={90} width={790} height={900} rx={36} fill="#0e0b2a" opacity={0.7} />
          {[2, 4, 6, 8, 10].map((v) => <line key={v} x1={gx0} x2={gx1} y1={PY(v)} y2={PY(v)} stroke="#ffffff" strokeOpacity={0.08} />)}
          <line x1={gx0} x2={gx1} y1={gy0} y2={gy0} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={3} />
          <line x1={PX(0)} x2={PX(0)} y1={gy0} y2={gy1} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={3} />
          <path d={`M ${pts.join(' L ')}`} fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" />
          <text x={PX(1.9)} y={PY(9.5)} fontFamily={FONT} fontWeight={800} fontSize={44} fill={GOLD} textAnchor="end" opacity={draw}>y = eˣ</text>
          <g opacity={eDot}>
            <line x1={PX(1)} x2={PX(1)} y1={gy0} y2={PY(Math.E)} stroke={MINT} strokeWidth={3} strokeDasharray="8 8" />
            <line x1={PX(0)} x2={PX(1)} y1={PY(Math.E)} y2={PY(Math.E)} stroke={MINT} strokeWidth={3} strokeDasharray="8 8" />
            <circle cx={PX(1)} cy={PY(Math.E)} r={14} fill={MINT} />
            <text x={PX(1) + 24} y={PY(Math.E) + 12} fontFamily={FONT} fontWeight={800} fontSize={40} fill={MINT}>e ≈ 2.718</text>
          </g>
        </g>
      }
      html={<Board x={900} y={90} w={940} h={900} title="The natural log, ln" lines={steps} maxLines={6} lineSize={50} />}
    />
  );
};

// ----------------------------------------------------------------------------- Significant digits
type DigitState = 'plain' | 'sig' | 'not';
export const SigFigs: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const nonzero = cue('Nonzero', 0.15), between = cue('between', 0.3), four = cue('has four', 0.42);
  const leading = cue('Leading', 0.52), two = cue('has two', 0.66), trailing = cue('Trailing', 0.75), three = cue('has three', 0.92);
  const rows: {num: string; states: (f: number) => DigitState[]; badge: string; badgeAt: number; rule: string; ruleAt: number}[] = [
    {num: '1002', badge: '4 sig figs', badgeAt: four, rule: 'zeros between digits count', ruleAt: between,
      states: (t) => ['1', '0', '0', '2'].map((d) => (d !== '0' ? (t >= nonzero ? 'sig' : 'plain') : t >= between ? 'sig' : 'plain'))},
    {num: '0.0045', badge: '2 sig figs', badgeAt: two, rule: "leading zeros don't", ruleAt: leading,
      states: (t) => ['0', '.', '0', '0', '4', '5'].map((d) => (d === '4' || d === '5' ? (t >= nonzero ? 'sig' : 'plain') : d === '.' ? 'plain' : t >= leading ? 'not' : 'plain'))},
    {num: '1.50', badge: '3 sig figs', badgeAt: three, rule: 'trailing zeros count with a decimal point', ruleAt: trailing,
      states: (t) => ['1', '.', '5', '0'].map((d, i) => (d === '.' ? 'plain' : i === 3 ? (t >= trailing ? 'sig' : 'plain') : t >= nonzero ? 'sig' : 'plain'))},
  ];
  return (
    <LabScene dim={0.2}
      svg={<Axo x={190} y={880} scale={0.5} expression={f > three ? 'excited' : 'happy'} pose="point" look={[0.8, -0.8]} />}
      html={
        <>
          <div style={{position: 'absolute', left: 0, width: W, top: 80, textAlign: 'center'}}>
            <Big size={40} color={C.accent} weight={800} style={{letterSpacing: 2, textTransform: 'uppercase'}}>Which digits are significant?</Big>
            <div style={{marginTop: 14, opacity: fadeIn(f, nonzero)}}><Rich text="**nonzero digits always count**" size={36} /></div>
          </div>
          {rows.map((r, ri) => {
            const st = r.states(f);
            return (
              <div key={ri} style={{position: 'absolute', left: 360, top: 260 + ri * 240, display: 'flex', alignItems: 'center', gap: 16}}>
                {r.num.split('').map((d, i) => {
                  const s = st[i];
                  return (
                    <div key={i} style={{width: d === '.' ? 40 : 110, height: 150, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONT, fontWeight: 900, fontSize: 110, transition: 'none',
                      background: s === 'sig' ? 'rgba(124,245,208,0.18)' : s === 'not' ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: s === 'sig' ? `4px solid ${MINT}` : d === '.' ? 'none' : '4px solid rgba(255,255,255,0.08)',
                      color: s === 'sig' ? MINT : s === 'not' ? 'rgba(255,255,255,0.25)' : C.text,
                      textDecoration: s === 'not' ? 'line-through' : 'none', boxShadow: s === 'sig' ? `0 0 30px ${MINT}55` : 'none'}}>{d}</div>
                  );
                })}
                <div style={{marginLeft: 40, display: 'flex', flexDirection: 'column', gap: 8}}>
                  <div style={{opacity: fadeIn(f, r.badgeAt)}}><Chip color={GOLD}>{r.badge}</Chip></div>
                  <div style={{opacity: fadeIn(f, r.ruleAt)}}><Big size={32} color={C.muted}>{r.rule}</Big></div>
                </div>
              </div>
            );
          })}
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Estimation
export const Estimation: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const about = cue('about seven', 0.12), g = cue('Gravity', 0.22), avo = cue("Avogadro's", 0.3);
  const tryIt = cue('Try it', 0.42), divide = cue('Divide by', 0.55), over = cue('over six', 0.66), which = cue('which is six', 0.85), under = cue('Under ten', 0.93);
  const top = tween(f, tryIt - 10, tryIt, 1, 0);
  const morph = tween(f, about, about + 12, 0, 1);
  const lines = [
    {at: divide, tex: '\\dfrac{3.6\\times10^{24}}{6\\times10^{23}}'},
    {at: over, tex: '= \\dfrac{3.6}{6}\\times\\dfrac{10^{24}}{10^{23}} = 0.6\\times 10'},
    {at: which, tex: '= \\color{#ffd166}{6\\ \\mathrm{mol}}'},
  ];
  const ax = axoAt(f, [{at: about, expression: 'excited'}, {at: tryIt, expression: 'focused', pose: 'write'}, {at: which, expression: 'excited', pose: 'cheer'}],
    {expression: 'thinking', pose: 'chin'});
  return (
    <LabScene dim={0.15}
      svg={<Axo x={300} y={705} scale={0.9} expression={ax.expression} pose={ax.pose} look={[0.8, -0.3]} />}
      html={
        <>
          {top > 0 && (
            <div style={{opacity: top}}>
              <div style={{position: 'absolute', left: 640, width: 1180, top: 150, textAlign: 'center'}}>
                <Big size={40} color={C.accent} weight={800} style={{letterSpacing: 2, textTransform: 'uppercase'}}>Round to friendly numbers</Big>
              </div>
              <div style={{position: 'absolute', left: 640, width: 1180, top: 290, textAlign: 'center', opacity: 1 - morph, transform: `scale(${1 - 0.1 * morph})`}}>
                <Tex tex="6.9 \times 4.1" size={130} />
              </div>
              <div style={{position: 'absolute', left: 640, width: 1180, top: 290, textAlign: 'center', opacity: morph, transform: `scale(${0.9 + 0.1 * morph})`}}>
                <Tex tex="\sim 7 \times 4 = \color{#ffd166}{28}" size={130} />
              </div>
              <div style={{position: 'absolute', left: 640, width: 1180, top: 620, display: 'flex', justifyContent: 'center', gap: 40}}>
                <div style={{opacity: fadeIn(f, g)}}><Chip color={MINT}><Tex tex="g = 9.8 \to 10" size={42} /></Chip></div>
                <div style={{opacity: fadeIn(f, avo)}}><Chip color={MINT}><Tex tex="N_A = 6.02\times10^{23} \to 6\times10^{23}" size={42} /></Chip></div>
              </div>
            </div>
          )}
          {f >= tryIt - 5 && (
            <div style={{opacity: fadeIn(f, tryIt)}}>
              <QuestionCard x={620} y={64} w={1220} label="Try it" tex={'3.6\\times10^{24}\\ \\text{molecules} = \\;?\\ \\text{mol}'} />
              <Board x={620} y={260} w={1220} h={560} lines={lines} lineSize={60} />
              <div style={{position: 'absolute', left: 620, top: 860, opacity: fadeIn(f, under)}}>
                <Chip color={GOLD}>⏱ under 10 seconds</Chip>
              </div>
            </div>
          )}
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Traps
const WarningSign: React.FC<{x: number; y: number; at: number; fps: number}> = ({x, y, at, fps}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = (f - at) / fps;
  const swing = 35 * Math.exp(-t * 2.2) * Math.cos(t * 9);
  const drop = interpolate(f - at, [0, 8], [-200, 0], {extrapolateRight: 'clamp'});
  return (
    <g transform={`translate(${x} ${y + drop}) rotate(${swing})`}>
      <line x1={0} y1={-140} x2={0} y2={-60} stroke="#c8c2d8" strokeWidth={5} />
      <path d="M 0 -70 L 70 50 L -70 50 Z" fill={RED} stroke="#ffffff" strokeWidth={8} strokeLinejoin="round" />
      <rect x={-6} y={-30} width={12} height={46} rx={6} fill="#ffffff" />
      <circle cx={0} cy={32} r={7} fill="#ffffff" />
    </g>
  );
};

export const Traps: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = makeCue(props);
  const one = cue('One', 0.1), two = cue('Two', 0.4), three = cue('Three', 0.8, 0, 2);
  const onlyMult = cue('only works', 0.3), smaller = cue('smaller', 0.65);
  const cards = [
    {at: one, x: 70, tex: '\\log(a+b) \\;\\color{#ff5d73}{\\neq}\\; \\log a + \\log b', note: 'the rule only works for multiplication', noteAt: onlyMult},
    {at: two, x: 680, tex: '10^{-5}\\ \\mathrm{M} \\Rightarrow \\mathrm{pH} = \\color{#7cf5d0}{+5}', note: 'smaller [H⁺] → higher pH', noteAt: smaller},
    {at: three, x: 1290, tex: '3{\\times}10^{5} + 2{\\times}10^{4} \\;\\color{#ff5d73}{\\neq}\\; 5{\\times}10^{9}', note: 'match the exponents first', noteAt: three + 20},
  ];
  const ax = axoAt(f, [{at: one, expression: 'surprised'}, {at: two, expression: 'worried'}, {at: three, expression: 'focused'}], {expression: 'thinking', pose: 'rest'});
  return (
    <LabScene dim={0.2}
      svg={
        <g>
          {cards.map((c, i) => <WarningSign key={i} x={c.x + 280} y={250} at={c.at} fps={fps} />)}
          <Axo x={960} y={1010} scale={0.42} expression={ax.expression} pose={ax.pose} look={[0, -1]} />
        </g>
      }
      html={
        <>
          <div style={{position: 'absolute', left: 0, width: W, top: 40, textAlign: 'center'}}>
            <Big size={44} color={RED} weight={900} style={{letterSpacing: 3, textTransform: 'uppercase'}}>⚠ MCAT traps</Big>
          </div>
          {cards.map((c, i) => {
            const a = fadeIn(f, c.at + 6);
            return (
              <div key={i} style={{position: 'absolute', left: c.x, top: 360, width: 560, height: 420, opacity: a, transform: `translateY(${(1 - a) * 30}px)`,
                background: 'rgba(255,255,255,0.07)', border: `2px solid ${RED}66`, borderRadius: 28, padding: '34px 30px', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <Big size={30} color={RED} weight={900}>{i + 1}</Big>
                <div style={{textAlign: 'center', whiteSpace: 'nowrap'}}><Tex tex={c.tex} size={i === 2 ? 32 : 38} /></div>
                <div style={{opacity: fadeIn(f, c.noteAt)}}><Big size={30} color={C.muted} style={{textAlign: 'center'}}>{c.note}</Big></div>
              </div>
            );
          })}
        </>
      }
    />
  );
};

// ----------------------------------------------------------------------------- Recap
export const Recap: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const cards = [
    {at: cue('Scientific', 0.02), title: 'Scientific notation', lines: ['\\times \\;\\to\\; \\text{add exponents}', '\\div \\;\\to\\; \\text{subtract exponents}']},
    {at: cue('Logs turn', 0.25), title: 'Logs', lines: ['\\log(ab) = \\log a + \\log b', '\\log 2 \\approx 0.30 \\qquad \\log 3 \\approx 0.48']},
    {at: cue('is about 2.3', 0.5), title: 'Natural log', lines: ['\\ln x \\approx 2.3\\,\\log x', '\\ln 2 \\approx 0.69']},
    {at: cue('Estimate first', 0.62), title: 'Estimation', lines: ['\\text{estimate first,}', '\\text{round later}']},
  ];
  const next = cue('Next time', 0.75);
  const ax = axoAt(f, [{at: next, expression: 'excited', pose: 'wave'}], {expression: 'happy', pose: 'rest'});
  return (
    <LabScene dim={0.2}
      svg={<Axo x={1700} y={850} scale={0.55} expression={ax.expression} pose={ax.pose} flip look={[0.5, -0.5]} />}
      html={
        <>
          <div style={{position: 'absolute', left: 120, top: 70}}>
            <Big size={44} color={C.accent} weight={900} style={{letterSpacing: 3, textTransform: 'uppercase'}}>Recap</Big>
          </div>
          {cards.map((c, i) => {
            const a = fadeIn(f, c.at);
            return (
              <div key={i} style={{position: 'absolute', left: 100 + (i % 2) * 780, top: 160 + Math.floor(i / 2) * 285, width: 750, height: 260,
                opacity: a, transform: `translateY(${(1 - a) * 24}px)`, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.14)',
                borderRadius: 28, padding: '28px 34px', boxSizing: 'border-box'}}>
                <Big size={34} color={GOLD} weight={900}>✓ {c.title}</Big>
                {c.lines.map((t, k) => <div key={k} style={{marginTop: k ? 4 : 16, whiteSpace: 'nowrap'}}><Tex tex={t} size={42} /></div>)}
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 100, top: 780, width: 1310, opacity: fadeIn(f, next), transform: `translateY(${(1 - fadeIn(f, next)) * 24}px)`,
            background: `linear-gradient(90deg, ${C.accent}33, transparent)`, borderLeft: `10px solid ${C.accent}`, borderRadius: 20, padding: '30px 40px'}}>
            <Big size={30} color={C.muted} weight={700}>NEXT TIME</Big>
            <Big size={56} weight={900}>Units, conversions & ratios</Big>
          </div>
        </>
      }
    />
  );
};

export const mcatScenes = {ColdOpen, Roadmap, LabTitle, SciIntro, BoardScene, PowerMeter, LogLadder, PhScale, NaturalLog, SigFigs, Estimation, Traps, Recap};
