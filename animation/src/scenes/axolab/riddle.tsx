// Axol's Lab: "The 96-second riddle". Every scene syncs to narration via cues.
import React from 'react';
import {useCurrentFrame, random, spring} from 'remotion';
import type {SceneProps} from '../../lib/types';
import {AxoSide, Calc, Pencil, Stamp, BigClock, Zero, Crate, COBALT_TINT} from '../../lib/cast';
import {
  Frame, KeySeq, KineticLine, InkCircle, Spark, Beaker, Ring, useCue, tw, clamp01, ease, fall, rich, SfxList,
  INK, PAPER, ORANGE, COBALT, LINE, DISPLAY, SANS, P,
} from './kit';

const Floor: React.FC<{y?: number; x1?: number; x2?: number}> = ({y = 940, x1 = 0, x2 = 1920}) => (
  <line x1={x1} x2={x2} y1={y} y2={y} stroke={INK} strokeWidth={4} opacity={0.85} />
);
const Pill: React.FC<{x: number; y: number; text: string; r?: number; fill?: string; color?: string}> = ({x, y, text, r = 30, fill = INK, color = PAPER}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-Math.max(r, text.length * r * 0.42)} y={-r} width={Math.max(r, text.length * r * 0.42) * 2} height={r * 2} rx={r} fill={fill} />
    <text y={r * 0.42} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={r * 1.25} fill={color}>{text}</text>
  </g>
);
const pop = (f: number, at: number, fps = 30) => (f < at ? 0 : spring({frame: f - at, fps, config: {damping: 12, mass: 0.6}}));

// --------------------------------------------------------------------- 0. black + ticking
export const BlackTick: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  return (
    <Frame html={
      <div style={{position: 'absolute', inset: 0, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60}}>
        {['tick', 'tock', 'tick'].map((t, i) => (
          <span key={i} style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: '#6d665c',
            opacity: f >= i * 14 ? 1 : 0}}>{t.toUpperCase()}</span>
        ))}
        <SfxList items={[[0, 'tick', 0.7], [14, 'tock', 0.7], [28, 'tick', 0.7]]} />
      </div>
    } />
  );
};

// --------------------------------------------------------------------- 1. hook
export const Hook: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const c96 = cue('ninety-six', 0.06), noCalc = cue('no calculator', 0.42), none = cue('None', 0.5), imp = cue('Impossible', 0.58);
  const ten = cue('ten seconds', 0.8);
  const open = tw(f, 0, 7);
  const L = (a: number, b: number) => a + (b - a) * open;
  const door = `M ${L(110, 410)} 300 L ${L(410, 560)} ${L(300, 250)} L ${L(410, 560)} ${L(940, 990)} L ${L(110, 410)} 940 Z`;
  const arrive = 3 + Math.round(1.25 * fps);
  const ax = tw(f, 3, arrive, 250, 800, (t) => 1 - Math.pow(1 - t, 3));
  const speed = f < arrive - 4 ? 1 : 0;
  const rear = tw(f, arrive - 3, arrive + 12, 0, 1);
  const D = props.durationInFrames;
  const ticks: [number, 'tick' | 'tock', number][] = [];
  for (let t = c96, k = 0; t < D; t += fps, k++) ticks.push([t, k % 2 ? 'tock' : 'tick', 0.28]);
  const taps: [number, 'tap', number][] = [];
  for (let t = noCalc; t < none - 4; t += 9) taps.push([t, 'tap', 0.5]);
  const secs = Math.max(0, 96 - Math.max(0, f - c96) / fps);
  const tip = tw(f, noCalc, none - 4, 2060, 1390, (t) => t);
  const flick = clamp01((f - none) / 5);
  const calcX = f < none ? tip : tw(f, none, none + 14, 1390, 1240);
  const calcRot = f < none ? 0 : tw(f, none, none + 14, 0, -24);
  const hand = f < none - 3 ? [1600, 780] : [1600 - 90 * flick, 780 - 70 * flick];
  const stampS = f < imp ? 0 : tw(f, imp, imp + 6, 2.4, 0.85, (t) => t * t);
  return (
    <Frame
      html={<><SfxList items={[[1, 'bang', 0.9], [3, 'whoosh', 0.5], [arrive + 2, 'swish', 0.5], [c96, 'pop', 0.7], ...ticks, ...taps,
        [none - 2, 'swish', 0.8], [none + 2, 'slide', 0.6], [imp + 5, 'thud', 1], [ten, 'sparkle', 0.5], [cue('Pause', 0.92) + 6, 'pop', 0.5]]} />
      <KeySeq x={100} y={100} w={860} size={92} items={[
        {at: cue('Riddle', 0.02), text: 'Riddle:'},
        {at: c96, text: '[[96]] seconds.'},
        {at: cue('hydrogen ion', 0.18), text: '[H^{+}] = 3 × 10^{−5}', sub: 'hydrogen ion concentration'},
        {at: cue("What's its pH", 0.3), text: 'pH = [[?]]'},
        {at: noCalc, text: 'No calculator.'},
        {at: none, text: '[[None.]]'},
        {at: imp, text: 'Impossible?'},
        {at: ten, text: '[[10 seconds.]]', sub: 'in your head'},
        {at: cue('Pause', 0.92), text: 'Pause & guess.'},
      ]} /></>}
      svg={
        <g>
          <Floor />
          <rect x={110} y={300} width={300} height={640} fill={INK} />
          <path d={door} fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
          {speed > 0 && [[ax - 120, 560], [ax - 100, 610], [ax - 130, 660]].map(([lx, ly], i) => (
            <line key={i} x1={lx - 80} y1={ly} x2={lx} y2={ly} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.35} />
          ))}
          <AxoSide x={ax} y={940} scale={1.05} rear={rear} run={speed ? f / 5 : undefined} arm={8} holding="pencil" sweat wink={f > ten && f < ten + 20} />
          <g transform={`translate(1150 330) scale(${pop(f, c96, fps)})`}><BigClock x={0} y={0} r={170} value={Math.ceil(secs)} /></g>
          {/* the bouncer */}
          <g transform="translate(1690 940) rotate(-90)"><Pencil len={620} w={120} face /></g>
          <path d={`M 1640 640 Q ${(1640 + hand[0]) / 2} ${hand[1] - 40} ${hand[0]} ${hand[1]}`} stroke={INK} strokeWidth={22} strokeLinecap="round" fill="none" />
          <circle cx={hand[0]} cy={hand[1]} r={18} fill={INK} />
          {f >= noCalc && <Calc x={calcX} y={935} scale={0.85} rotate={calcRot} mood={f < none ? 'sneaky' : 'shock'} tiptoe={f / 18} />}
          {f >= none && f < none + 16 && [[calcX - 60, 880], [calcX - 80, 905]].map(([lx, ly], i) => (
            <line key={i} x1={lx} y1={ly} x2={lx + 90} y2={ly} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.35} />
          ))}
          {stampS > 0 && <Stamp x={1240} y={770} text="BANNED" rotate={-14} scale={stampS} />}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 2. crate
export const SciCrate: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const enorm = cue('enormous', 0.04), micro = cue('microscopic', 0.12), avo = cue("Avogadro's", 0.2), zeros = cue('twenty-one', 0.3);
  const nobody = cue('Nobody', 0.42), pack = cue('pack', 0.5), label = cue('label', 0.62), parts = cue('two parts', 0.78);
  const beakerA = 1 - clamp01((f - avo) / 10);
  const sparkScale = 1 - 0.55 * clamp01((f - micro) / 12);
  const walk = Math.max(0, f - zeros);
  return (
    <Frame tag="SCIENTIFIC NOTATION"
      html={
        <>
          <SfxList items={[[enorm, 'fizz', 0.5], [micro, 'swish', 0.35], [avo, 'swish', 0.5], [zeros - 5, 'whoosh', 0.35],
            ...Array.from({length: 21}).map((_, i) => [zeros + (850 + 95 * i) / 11, 'pop', 0.32, 0.9 + i * 0.03] as [number, 'pop', number, number]),
            [label, 'thud', 0.8], [parts, 'pop', 0.7]]} />
          <KeySeq x={100} y={300} w={720} size={84} items={[
            {at: enorm, text: 'Enormous,'},
            {at: micro, text: 'or [[microscopic.]]'},
            {at: avo, text: '602 + 21 zeros'},
            {at: nobody, text: 'Nobody writes that.'},
            {at: pack, text: 'Pack them in a [[crate.]]'},
            {at: label, text: 'Label = [[exponent]]'},
            {at: parts, text: ' '},
          ]} />
          <div style={{position: 'absolute', left: 0, width: 1920, top: 160, textAlign: 'center', opacity: clamp01((f - avo) / 10),
            fontFamily: DISPLAY, fontWeight: 600, fontSize: 56, color: P.muted, letterSpacing: 2}}>602,000,000,000,000,000,000,000</div>
          <div style={{position: 'absolute', left: 120, top: 470, opacity: clamp01((f - parts) / 10)}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 200, color: INK, lineHeight: 1}}>6.02 <span style={{color: P.muted, fontWeight: 600}}>×</span></div>
            <div style={{fontFamily: SANS, fontSize: 30, color: P.muted, fontWeight: 600, marginTop: 16}}>coefficient, between 1 and 10</div>
          </div>
        </>
      }
      svg={
        <g>
          <Floor y={870} />
          {beakerA > 0 && (
            <g opacity={beakerA}>
              <Beaker x={1250} y={860} w={320} h={380} />
              {Array.from({length: 7}).map((_, i) => (
                <g key={i} transform={`translate(${1250 + (random(`bs${i}`) - 0.5) * 220} ${700 - random(`by${i}`) * 140}) scale(${sparkScale})`}><Spark x={0} y={0} r={16} seed={i} /></g>
              ))}
            </g>
          )}
          {f >= zeros - 5 && (
            <g opacity={clamp01((f - zeros + 5) / 10)}>
              <path d="M 860 330 L 1140 330 L 1060 430 L 940 430 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
              <rect x={940} y={430} width={120} height={40} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              <Crate x={1000} y={870} w={380} h={300} label={<span style={{opacity: clamp01((f - label) / 8)}}>×10<sup style={{fontSize: '0.55em', verticalAlign: '0.9em'}}>23</sup></span>} />
              {Array.from({length: 21}).map((_, i) => {
                const x = 2000 + i * 95 - walk * 11;
                if (x < 1150 || x > 2100) return null;
                return <Zero key={i} x={x} y={870} step={(walk + i * 6) / 18} scale={0.72} />;
              })}
              {(() => {
                const st = zeros + Math.round(1.6 * fps);
                const axX = tw(f, zeros, st, 2060, 1720, (t) => 1 - Math.pow(1 - t, 2));
                return <AxoSide x={axX} y={870} scale={0.5} dir={-1} run={f < st ? f / 5 : undefined} sweat={f < st + 40} />;
              })()}
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 3. Dot
const DotChar: React.FC<{x: number; y: number; hop?: number; slide?: number}> = ({x, y, hop = 0, slide = 0}) => {
  const f = useCurrentFrame();
  const legs = Math.sin(f / 3) * 18;
  return (
    <g transform={`translate(${x} ${y - hop}) rotate(${slide * -12})`}>
      {[-8, 8].map((lx, i) => <rect key={lx} x={lx - 3} y={14} width={6} height={20} rx={3} fill={INK} transform={`rotate(${(i ? 1 : -1) * legs * (hop > 1 ? 1 : 0.3)} ${lx} 14)`} />)}
      <circle r={26} fill={INK} />
      <circle cx={-8} cy={-6} r={6} fill={PAPER} /><circle cx={9} cy={-6} r={6} fill={PAPER} />
    </g>
  );
};

export const DotRun: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const meet = cue('decimal point is Dot', 0.03), runL = cue('Run left', 0.18), runR = cue('Run right', 0.32);
  const digitsAt = cue('Zero point', 0.48), steps = cue('four steps', 0.62), so = cue('so four', 0.8);
  const digits = '000045'.split('');
  const bw = 150, gap = 46, left0 = 960 - (6 * bw + 5 * gap) / 2, baseY = 620;
  const boundaryX = (b: number) => left0 + b * (bw + gap) - gap / 2;
  const hopDur = Math.max(10, Math.floor((so - steps) / 4));
  const hops = clamp01((f - steps) / (hopDur * 4)) * 4;
  const k = Math.floor(hops), frac = hops - k;
  const b = 1 + Math.min(4, k + ease(frac));
  const demoOff = f < runL ? 0 : f < runR ? tw(f, runL, runL + 18, 0, -260) : tw(f, runR, runR + 22, -260, 260);
  const inDigits = f >= digitsAt;
  const dotX = inDigits ? boundaryX(b) : 960 + demoOff;
  const hop = inDigits && hops < 4 ? Math.sin(frac * Math.PI) * 60 : 0;
  const done = clamp01((f - so) / 12);
  const expo = inDigits ? -Math.min(4, Math.round(hops)) : f >= runR + 10 ? -1 : f >= runL + 10 ? 1 : 0;
  return (
    <Frame tag="SCIENTIFIC NOTATION"
      html={
        <>
          <SfxList items={[[meet, 'pop', 0.6], [runL, 'whoosh', 0.45], [runR, 'whoosh', 0.45], [digitsAt, 'swish', 0.4],
            ...[0, 1, 2, 3].flatMap((k) => [[steps + k * hopDur, 'hop', 0.6, 1 + k * 0.1], [steps + k * hopDur + hopDur - 2, 'tick', 0.4]] as [number, 'hop' | 'tick', number, number][]),
            [so, 'slide', 0.6], [so + 8, 'sparkle', 0.5]]} />
          <KeySeq x={0} y={170} w={1920} align="center" size={80} items={[
            {at: meet, text: 'Meet [[Dot]], the decimal point.'},
            {at: runL, text: '← Run left: exponent [[up]]'},
            {at: runR, text: 'Run right →: exponent [[down]]'},
            {at: steps, text: 'Four steps right'},
            {at: so, text: '0.00045 = [[4.5 × 10^{−4}]]'},
          ]} />
          {inDigits && digits.map((d, i) => (
            <div key={i} style={{position: 'absolute', left: left0 + i * (bw + gap), top: baseY - 230, width: bw, textAlign: 'center',
              fontFamily: DISPLAY, fontWeight: 700, fontSize: 250, lineHeight: 1, color: i < 4 && done > 0 ? `rgba(20,18,16,${1 - done * 0.8})` : INK,
              opacity: clamp01((f - digitsAt) / 8)}}>{d}</div>
          ))}
        </>
      }
      svg={
        <g>
          <DotChar x={dotX} y={baseY + 10} hop={hop} slide={done} />
          {done > 0 && done < 1 && <path d={`M ${dotX - 30} ${baseY + 40} q -30 -10 -60 0`} stroke={INK} strokeWidth={3} opacity={0.4} fill="none" />}
          {/* exponent tile */}
          <g transform="translate(960 860)">
            <rect x={-170} y={-60} width={340} height={120} rx={20} fill={PAPER} stroke={INK} strokeWidth={LINE} />
            <foreignObject x={-170} y={-60} width={340} height={120}>
              <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: INK}}>
                ×10<sup style={{fontSize: '0.55em', verticalAlign: '0.9em', color: expo === 0 ? INK : ORANGE}}>{expo > 0 ? `+${expo}` : expo < 0 ? `−${-expo}` : '0'}</sup>
              </div>
            </foreignObject>
          </g>
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 4. towers
const Block: React.FC<{x: number; y: number; o?: number; r?: number}> = ({x, y, o = 1, r = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`} opacity={o}>
    <rect x={-60} y={-68} width={120} height={64} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <text x={0} y={-24} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={34} fill={INK}>10</text>
  </g>
);
const TowerLabel: React.FC<{x: number; text: string; y?: number}> = ({x, text, y = 960}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={50} fill={ORANGE}>{text}</text>
);

export const Towers: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const mul = cue('Multiply', 0.02), times2 = cue('times two', 0.12), six = cue('is six', 0.2);
  const div = cue('Divide', 0.3), wreck = cue('wrecking ball', 0.34), sub = cue('exponents subtract', 0.42);
  const add = cue('Add or subtract', 0.5), lower = cue('Lower', 0.72), total = cue('Total', 0.88);
  const Y = 900, H = 66;
  const phase = f < div ? 1 : f < add ? 2 : 3;
  const blocks: React.ReactNode[] = [];
  let labels: React.ReactNode = null;
  let axo: React.ReactNode = <AxoSide x={260} y={Y} scale={0.55} />;
  if (phase === 1) {
    const ax = 700, bx = 1100;
    for (let i = 0; i < 4; i++) blocks.push(<Block key={`a${i}`} x={ax} y={Y - i * H} />);
    for (let i = 0; i < 3; i++) {
      const t = clamp01((f - times2 - i * 8) / 16);
      const x = bx + (ax - bx) * ease(t);
      const y = (Y - i * H) + ((Y - (4 + i) * H) - (Y - i * H)) * ease(t) - Math.sin(t * Math.PI) * 120;
      blocks.push(<Block key={`b${i}`} x={x} y={y} />);
    }
    labels = <>{f < six ? <><TowerLabel x={ax} text="3" /><TowerLabel x={bx} text="2" /></> : <TowerLabel x={ax} text="6" />}</>;
  } else if (phase === 2) {
    const tx = 860;
    const swing = f < wreck ? tw(f, div, wreck, -70, -40) : tw(f, wreck, wreck + 10, -40, 28);
    const hit = f >= wreck + 10;
    for (let i = 0; i < 6; i++) {
      if (i >= 4 && hit) {
        const t = clamp01((f - wreck - 10) / 25);
        blocks.push(<Block key={i} x={tx + t * (300 + i * 60)} y={Y - i * H + t * t * 300 - Math.sin(t * Math.PI) * 120} r={t * 160} o={1 - t} />);
      } else blocks.push(<Block key={i} x={tx} y={Y - i * H} />);
    }
    const px = 600, py = 160, len = 470, a = (swing * Math.PI) / 180;
    const bx = px + Math.sin(a) * len, by = py + Math.cos(a) * len;
    blocks.push(
      <g key="ball">
        <line x1={px - 200} y1={py} x2={px + 40} y2={py} stroke={INK} strokeWidth={LINE} />
        <line x1={px} y1={py} x2={bx} y2={by} stroke={INK} strokeWidth={4} strokeDasharray="12 6" />
        <circle cx={bx} cy={by} r={56} fill={INK} />
      </g>,
    );
    labels = <TowerLabel x={tx} text={f < sub ? '8' : '2'} />;
  } else {
    const ax = 700, bx0 = 1060;
    const merge = clamp01((f - total) / 18);
    const bx = bx0 + (ax + 140 - bx0) * ease(merge);
    for (let i = 0; i < 5; i++) blocks.push(<Block key={`a${i}`} x={ax} y={Y - i * H} />);
    const lift = clamp01((f - lower) / 20);
    for (let i = 0; i < 4; i++) blocks.push(<Block key={`b${i}`} x={bx} y={Y - i * H} />);
    if (f >= lower) blocks.push(<Block key="b4" x={bx} y={Y - 4 * H + (1 - ease(lift)) * -260} o={ease(lift)} />);
    labels = <>{merge < 1 ? <><TowerLabel x={ax} text="3" /><TowerLabel x={bx} text={f < lower ? '2' : '0.2'} /></> : null}
      {merge >= 1 && <TowerLabel x={ax + 70} text="3.2" />}</>;
    const topY = Y - (f >= lower ? 5 : 4) * H - 4;
    axo = f >= lower - 10 ? <AxoSide x={bx - 40} y={topY + (1 - ease(lift)) * -260} scale={0.36} /> : <AxoSide x={260} y={Y} scale={0.55} />;
  }
  return (
    <Frame tag="EXPONENT RULES"
      html={<><SfxList items={[
        ...[0, 1, 2].map((i) => [times2 + i * 8 + 15, 'clack', 0.7, 1 + i * 0.08] as [number, 'clack', number, number]),
        [six, 'ding', 0.45], [div, 'whoosh', 0.5], [wreck + 9, 'crash', 0.8], [sub, 'pop', 0.5],
        [add, 'swish', 0.4], [lower, 'rise', 0.6], [lower + 20, 'clack', 0.7], [total + 17, 'clack', 0.8], [total + 20, 'ding', 0.5]]} />
      <KeySeq x={1260} y={330} w={620} size={70} items={[
        {at: mul, text: 'Multiply → [[stack]]', sub: 'exponents add'},
        {at: cue('Three times ten to the four', 0.08), text: '3×10^{4} · 2×10^{3}'},
        {at: six, text: '= [[6×10^{7}]]'},
        {at: div, text: 'Divide → [[demolish]]', sub: 'exponents subtract'},
        {at: cue('removes floors', 0.38), text: '8×10^{6} ÷ 4×10^{2}'},
        {at: sub, text: '= [[2×10^{4}]]'},
        {at: add, text: 'Add → same floor [[first]]'},
        {at: cue('Three times ten to the five', 0.6), text: '3×10^{5} + 2×10^{4}'},
        {at: lower, text: '= 3×10^{5} + [[0.2×10^{5}]]', size: 60},
        {at: total, text: '= [[3.2×10^{5}]]'},
      ]} /></>}
      svg={<g><Floor y={Y} x2={1220} />{blocks}{labels}{axo}</g>}
    />
  );
};

// --------------------------------------------------------------------- 5. the log elevator
const Building: React.FC<{x: number; w: number; floors: number[]; Y: (n: number) => number; right: (n: number) => string; left?: (n: number) => string; top: number}> = ({x, w, floors, Y, right, left, top}) => (
  <g>
    <rect x={x} y={top} width={w} height={Y(floors[0]) - top} rx={18} fill={COBALT_TINT} fillOpacity={0.45} stroke={INK} strokeWidth={LINE} />
    {floors.map((n) => (
      <g key={n}>
        <line x1={x} x2={x + w} y1={Y(n)} y2={Y(n)} stroke={INK} strokeWidth={n === floors[0] ? LINE : 3} />
        <Pill x={x - 64} y={Y(n)} text={left ? left(n) : String(n).replace('-', '−')} r={26} />
        <text x={x + w - 18} y={Y(n) - 14} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>{right(n)}</text>
      </g>
    ))}
  </g>
);
const Car: React.FC<{x: number; y: number; w?: number; h?: number; shake?: number; axo?: boolean}> = ({x, y, w = 150, h = 112, shake = 0, axo = true}) => (
  <g transform={`translate(${x + shake} ${y})`}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={10} fill={PAPER} stroke={COBALT} strokeWidth={6} />
    {axo && <AxoSide x={-28} y={-4} scale={0.26} rear={1} arm={-60} />}
  </g>
);

export const LogElevator: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const counter = cue('floor counter', 0.05), each = cue('each floor up', 0.15), three = cue('floor three', 0.32);
  const hund = cue('hundredth', 0.48), two = cue('what about two', 0.6), stuck = cue('stuck', 0.75), log2 = cue('Log of two', 0.9);
  const Y = (n: number) => 860 - (n + 2) * 124;
  const keys: [number, number][] = [[0, 0], [three, 3], [hund, -2], [two, Math.log10(2)]];
  let lvl = 0;
  for (let i = 1; i < keys.length; i++) if (f >= keys[i][0]) lvl = keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * ease(clamp01((f - keys[i][0]) / 28));
  const shudder = f > two + 28 ? Math.sin(f * 2.2) * 4 * Math.max(0, 1 - (f - two - 28) / 60) + (f > stuck ? Math.sin(f * 2.6) * 2 : 0) : 0;
  const nums = ['0.01', '0.1', '1', '10', '100', '1000'];
  return (
    <Frame tag="LOGARITHMS"
      html={<><SfxList items={[[three, 'rise', 0.6], [three + 27, 'ding', 0.5], [hund, 'rise', 0.6, 0.85], [hund + 27, 'ding', 0.5, 0.9],
        [two, 'rise', 0.6], [two + 27, 'boing', 0.5, 0.8], [stuck, 'pop', 0.6], [log2, 'chime', 0.5]]} />
      <KeySeq x={1150} y={330} w={720} size={84} items={[
        {at: counter, text: 'log = [[floor number]]'},
        {at: each, text: 'Each floor up: ×10'},
        {at: three, text: 'log 1000 = [[3]]'},
        {at: hund, text: 'log 0.01 = [[−2]]'},
        {at: two, text: 'log 2 = ?'},
        {at: log2, text: 'log 2 ≈ [[0.3]]', size: 110},
      ]} /></>}
      svg={
        <g>
          <Building x={500} w={500} floors={[-2, -1, 0, 1, 2, 3]} Y={Y} right={(n) => nums[n + 2]} top={Y(3) - 110} />
          <g transform={`translate(520 ${Y(3) - 92})`}>
            <rect width={270} height={52} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
            <text x={135} y={35} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={23} fill={INK}>each floor up = ×10</text>
          </g>
          <line x1={700} x2={700} y1={Y(3) - 30} y2={Y(lvl) - 112} stroke={INK} strokeWidth={3} />
          <Car x={700} y={Y(lvl)} shake={shudder} />
          {f >= stuck && (
            <g transform={`translate(880 ${Y(Math.log10(2))})`} opacity={clamp01((f - stuck) / 10)}>
              <line x1={-40} x2={40} y1={0} y2={0} stroke={ORANGE} strokeWidth={4} strokeDasharray="8 8" />
              <text x={0} y={-10} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={80} fill={ORANGE}>2</text>
              <circle cx={-7} cy={-58} r={4} fill={INK} /><circle cx={9} cy={-58} r={4} fill={INK} />
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 6. hops
export const LogHops: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const memo = cue('Memorize', 0.02), l2 = cue('log two', 0.08), l3 = cue('log three', 0.15);
  const c5 = cue('Five is', 0.28), c4 = cue('Four is', 0.4), c6 = cue('Six is', 0.5), c8 = cue('Eight is', 0.6);
  const add = cue('multiplication into addition', 0.72), carry = cue('glad to carry', 0.88);
  const Y = (v: number) => 900 - 700 * v, X = 560;
  const marks: [number, number, number, boolean][] = [[1, 0, 0, false], [10, 1, 0, false], [2, 0.301, l2, true], [3, 0.477, l3, true], [5, 0.699, c5, false], [4, 0.602, c4, false], [6, 0.778, c6, false], [8, 0.903, c8, false]];
  const hopSets: [number, number[]][] = [[c5, [1, 0.699]], [c4, [0, 0.301, 0.602]], [c6, [0, 0.301, 0.778]], [c8, [0, 0.301, 0.602, 0.903]]];
  const cur = [...hopSets].reverse().find(([at]) => f >= at && f < add);
  // the marker glides between stops instead of teleporting
  const stops: [number, number][] = [[0, 0], [l2, 0.301], [l3, 0.477]];
  hopSets.forEach(([at, vs]) => vs.forEach((v, i) => stops.push([at + Math.max(0, i - 1) * 14 + (i === 0 ? -8 : 2), v])));
  stops.sort((a, b) => a[0] - b[0]);
  let target = 0;
  for (let i = 0; i < stops.length; i++) {
    if (f < stops[i][0]) break;
    const prev = i ? stops[i - 1][1] : 0;
    target = prev + (stops[i][1] - prev) * ease(clamp01((f - stops[i][0]) / 10));
  }
  const carX = tw(f, carry, carry + 70, 2050, 1500, (t) => t);
  return (
    <Frame tag="LOGARITHMS"
      html={<><SfxList items={[[l2, 'pop', 0.6], [l3, 'pop', 0.6, 1.1],
        ...hopSets.flatMap(([at, vs]) => vs.slice(1).map((_, i) => [at + i * 14, 'hop', 0.55, 1 + i * 0.12] as [number, 'hop', number, number])),
        [add, 'chime', 0.45], ...Array.from({length: 9}).map((_, i) => [carry + i * 8, 'tap', 0.45] as [number, 'tap', number])]} />
      <KeySeq x={900} y={300} w={980} size={84} items={[
        {at: memo, text: 'Memorize two numbers'},
        {at: l2, text: 'log 2 = [[0.30]]'},
        {at: l3, text: 'log 3 = [[0.48]]', sub: 'everything else is hops'},
        {at: c5, text: 'log 5 = 1 − 0.3 = [[0.7]]'},
        {at: c4, text: 'log 4 = 0.3 + 0.3 = [[0.6]]'},
        {at: c6, text: 'log 6 = 0.3 + 0.48 = [[0.78]]', size: 76},
        {at: c8, text: 'log 8 = 3 × 0.3 = [[0.9]]'},
        {at: add, text: '× becomes [[+]]', sub: "you're walking, not building", size: 110},
        {at: carry, text: 'The only log you’ll be glad to carry.', size: 60},
      ]} /></>}
      svg={
        <g>
          <line x1={X} x2={X} y1={Y(0) + 20} y2={Y(1) - 20} stroke={INK} strokeWidth={LINE} />
          {marks.map(([n, v, at, memoMark]) => f >= at && (
            <g key={n} opacity={clamp01((f - at) / 8)}>
              <line x1={X - 22} x2={X + 22} y1={Y(v)} y2={Y(v)} stroke={memoMark ? ORANGE : INK} strokeWidth={memoMark ? 6 : 4} />
              <text x={X - 40} y={Y(v) + 14} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={memoMark ? ORANGE : INK}>{v === 0 ? '0' : v === 1 ? '1' : v.toFixed(2).replace(/^0/, '0')}</text>
              <text x={X + 40} y={Y(v) + 14} fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={P.muted}>{n}</text>
            </g>
          ))}
          {cur && cur[1].slice(1).map((v, i) => {
            const from = cur[1][i];
            const t = clamp01((f - cur[0] - i * 14) / 12);
            if (t <= 0) return null;
            const r = Math.abs(Y(v) - Y(from)) / 2;
            return <path key={i} d={`M ${X + 120} ${Y(from)} A ${r * 0.8} ${r} 0 0 ${v > from ? 0 : 1} ${X + 120} ${Y(from) + (Y(v) - Y(from)) * t}`}
                         fill="none" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />;
          })}
          <g transform={`translate(${X + 200} ${Y(target)})`}>
            <rect x={-30} y={-26} width={60} height={52} rx={8} fill={PAPER} stroke={COBALT} strokeWidth={5} />
          </g>
          {f >= carry && (
            <g>
              <AxoSide x={carX} y={1010} scale={0.48} dir={-1} run={f / 9} />
              <g transform={`translate(${carX - 40} 925) rotate(-4)`}>
                <rect x={-120} y={-34} width={240} height={68} rx={34} fill="#c98a52" stroke={INK} strokeWidth={LINE} />
                <ellipse cx={120} cy={0} rx={22} ry={34} fill="#e9c08e" stroke={INK} strokeWidth={LINE} />
                <ellipse cx={120} cy={0} rx={10} ry={16} fill="none" stroke={INK} strokeWidth={3} />
                <text x={-10} y={12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={36} fill={INK}>log</text>
              </g>
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 7. solving the riddle
export const RiddleSolve: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const three = cue('Three times', 0.15), floors = cue('Five floors', 0.28), hopC = cue('hop', 0.36), minus = cue('so minus', 0.45);
  const flip = cue('flips', 0.58), about = cue('pH is about', 0.72), done = cue('Done', 0.86);
  const cx = 470, cy = 520;
  const Y = (v: number) => cy + (v + 2.5) * 130; // v in [-5, 0] -> 845 .. 195
  const lvl = f < hopC ? -5 : -5 + 0.48 * ease(clamp01((f - hopC) / 16));
  const ang = 180 * ease(clamp01((f - flip) / 22));
  const flipped = ang > 90;
  const circ = clamp01((f - about - 8) / 18);
  return (
    <Frame tag="SOLVING THE RIDDLE"
      html={
        <>
          <SfxList items={[[three, 'fizz', 0.6], [hopC, 'hop', 0.6], [flip, 'whoosh', 0.6], [about + 8, 'scribble', 0.6],
            [done, 'confetti', 0.9], [done + 6, 'chime', 0.5]]} />
          <KeySeq x={980} y={240} w={900} size={92} items={[
            {at: 0, text: 'pH = −log [H^{+}]'},
            {at: three, text: '[H^{+}] = 3 × 10^{−5}'},
            {at: floors, text: '−5 + 0.48'},
            {at: minus, text: '= [[−4.52]]'},
            {at: flip, text: 'flip the sign'},
            {at: about, text: 'pH ≈ 4.5', size: 150},
          ]} />
        </>
      }
      svg={
        <g>
          <g transform={`rotate(${ang} ${cx + 60} ${cy})`}>
            <line x1={cx} x2={cx} y1={Y(-5) + 30} y2={Y(0) - 30} stroke={INK} strokeWidth={LINE} />
            {[0, -1, -2, -3, -4, -5].map((v) => (
              <g key={v}>
                <line x1={cx - 20} x2={cx + 160} y1={Y(v)} y2={Y(v)} stroke={INK} strokeWidth={3} opacity={0.5} />
                <g transform={`rotate(${-ang} ${cx - 60} ${Y(v)})`}><Pill x={cx - 60} y={Y(v)} text={flipped ? String(-v) : String(v).replace('-', '−')} r={26} /></g>
              </g>
            ))}
            {f >= three && [0, 1, 2].map((i) => <Spark key={i} x={cx + 60 + i * 34} y={Y(-5) - 20} r={12} seed={i} />)}
            {f >= floors && (
              <g transform={`translate(${cx + 140} ${Y(lvl)})`}>
                <rect x={-26} y={-44} width={52} height={44} rx={8} fill={PAPER} stroke={COBALT} strokeWidth={5} />
              </g>
            )}
            {f >= hopC && <path d={`M ${cx + 200} ${Y(-5)} q 40 ${-(Y(-5) - Y(-4.52)) / 2} 0 ${-(Y(-5) - Y(-4.52))}`} stroke={ORANGE} strokeWidth={5} fill="none" strokeLinecap="round" />}
          </g>
          <InkCircle cx={1560} cy={322} rx={190} ry={110} progress={circ} />
          {f >= done && Array.from({length: 70}).map((_, i) => {
            const t = (f - done) / 30;
            const x = random(`cx${i}`) * 1920, y = -40 + t * (300 + random(`cy${i}`) * 500) + random(`c0${i}`) * 200 - 200;
            const c = [ORANGE, COBALT, INK][i % 3];
            return <rect key={i} x={x} y={y} width={14} height={8} fill={c} transform={`rotate(${f * 8 + i * 37} ${x} ${y})`} opacity={clamp01(2 - t / 2)} />;
          })}
          {f >= done && (
            <g opacity={clamp01((f - done) / 10)}>
              <Ring x={1720} y={820} r={110} frac={86 / 96} label="86" sub="SEC LEFT" />
              <defs><clipPath id="win"><rect x={1150} y={640} width={300} height={260} rx={10} /></clipPath></defs>
              <rect x={1150} y={640} width={300} height={260} rx={10} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              <g clipPath="url(#win)"><Calc x={1300} y={980 - 120 * clamp01((f - done) / 12)} scale={0.8} mood="shock" /></g>
              <line x1={1300} x2={1300} y1={640} y2={900} stroke={INK} strokeWidth={4} />
              <line x1={1150} x2={1450} y1={770} y2={770} stroke={INK} strokeWidth={4} opacity={0.3} />
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 8. sparks scale
export const SparkScale: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const c1 = cue('Each pH step', 0.05), c2 = cue('ten times', 0.15), c3 = cue('more sparks', 0.25);
  const hund = cue('hundred', 0.5), sq = cue('squeeze', 0.75);
  const beakers: [number, number, number, string][] = [[480, 10, c1, 'pH 5'], [960, 45, c2, 'pH 4'], [1440, 130, c3, 'pH 3']];
  return (
    <Frame tag="pH"
      html={<><SfxList items={[[c1, 'fizz', 0.4], [c2, 'fizz', 0.55], [c3, 'fizz', 0.75], [c3 + 30, 'slide', 0.4], [hund, 'whoosh', 0.4]]} />
      <KeySeq x={0} y={130} w={1920} align="center" size={84} items={[
        {at: c1, text: '1 pH step = [[10×]] the sparks'},
        {at: hund, text: 'pH 3 vs pH 5 = [[100×]] more acid'},
        {at: sq, text: 'Logs squeeze huge ranges small.'},
      ]} /></>}
      svg={
        <g>
          {beakers.map(([x, n, at, label], bi) => f >= at && (
            <g key={bi} opacity={clamp01((f - at) / 8)}>
              <Beaker x={x} y={860} w={300} h={340} fill={0.8} />
              {Array.from({length: n}).map((_, i) => {
                const show = clamp01((f - at - i * (bi === 2 ? 0.25 : 0.8)) / 6);
                let sx = x + (random(`sx${bi}${i}`) - 0.5) * 250, sy = 840 - random(`sy${bi}${i}`) * 260;
                if (bi === 2 && i > 90) { const t = clamp01((f - at - 30 - (i - 90) * 1.5) / 40); sx = x + 150 + t * 60 + (i % 5) * 8; sy = 520 + t * 320; }
                return show > 0 ? <circle key={i} cx={sx} cy={sy} r={bi === 0 ? 14 : bi === 1 ? 10 : 7} fill={ORANGE} opacity={show} /> : null;
              })}
              <text x={x} y={940} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={48} fill={INK}>{label}</text>
            </g>
          ))}
          {f >= hund && (
            <g opacity={clamp01((f - hund) / 10)}>
              <path d="M 480 470 Q 960 300 1440 470" fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="14 10" />
              <text x={960} y={370} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={64} fill={ORANGE}>×100</text>
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 9. natural log twins
export const LnTwins: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const cousin = cue('cousin', 0.12), eAt = cue('number e', 0.25), same = cue('Same rules', 0.4), mult = cue('2.3', 0.55), ln2 = cue('0.69', 0.78);
  const Y = (n: number) => 880 - n * 190;
  const k = clamp01((f - mult) / 20);
  return (
    <Frame tag="NATURAL LOG"
      html={
        <>
          <SfxList items={[[cousin, 'swish', 0.5], [mult, 'rise', 0.45, 1.2], [mult + 20, 'ding', 0.45], [ln2, 'pop', 0.5]]} />
          <KeySeq x={1300} y={300} w={600} size={80} items={[
            {at: 0, text: 'ln: log’s [[cousin]]'},
            {at: eAt, text: 'base e ≈ 2.718', sub: 'instead of 10'},
            {at: same, text: 'Same rules.'},
            {at: mult, text: 'ln ≈ [[2.3]] × log'},
            {at: ln2, text: 'ln 2 ≈ [[0.69]]', sub: 'you’ll need it for half-lives'},
          ]} />
          <div style={{position: 'absolute', left: 330, top: 160, width: 300, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: INK}}>log</div>
          <div style={{position: 'absolute', left: 820, top: 160, width: 300, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: COBALT, opacity: clamp01((f - cousin) / 10)}}>ln</div>
        </>
      }
      svg={
        <g>
          <Building x={380} w={200} floors={[0, 1, 2, 3]} Y={Y} right={() => ''} top={Y(3) - 60} />
          {f >= cousin && (
            <g opacity={clamp01((f - cousin) / 10)}>
              <Building x={870} w={200} floors={[0, 1, 2, 3]} Y={Y} right={() => ''} top={Y(3) - 60}
                        left={(n) => (n === 0 ? '0' : (n * (1 + 1.3 * k)).toFixed(k > 0.98 ? 1 : 1))} />
            </g>
          )}
          <AxoSide x={1180} y={1010} scale={0.4} dir={-1} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 10. rulers (sig figs)
export const Rulers: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const confess = cue('confession', 0.05), measured = cue('measured', 0.2), made = cue('made up', 0.32), nose = cue('nose grows', 0.42);
  const mul = cue('Multiply or divide', 0.52), add = cue('Add or subtract', 0.7), weak = cue('Weakest link', 0.9);
  const x0 = 300, cm = 140, wy = 300;
  const fine = f >= measured;
  const noseLen = 260 * ease(clamp01((f - nose) / 30));
  const top = 1 - 0.65 * clamp01((f - mul + 10) / 12);
  return (
    <Frame tag="SIGNIFICANT DIGITS"
      html={
        <>
          <SfxList items={[[confess, 'clack', 0.5], [measured, 'swish', 0.5], [made, 'blip', 0.5], [nose, 'boing', 0.7, 0.75],
            [weak, 'thud', 0.6]]} />
          <KeySeq x={100} y={630} w={1100} size={72} items={[
            {at: confess, text: 'Every number confesses its ruler.'},
            {at: measured, text: 'Measured = [[significant]]'},
            {at: made, text: 'Made up = lies.'},
            {at: mul, text: '× ÷  →  fewest [[sig figs]]'},
            {at: add, text: '+ −  →  fewest [[decimal places]]'},
            {at: weak, text: 'Weakest link wins.', size: 96},
          ]} />
          <div style={{position: 'absolute', left: x0 + 4.3 * cm + 60, top: 210, opacity: top, fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, color: INK, whiteSpace: 'nowrap'}}>
            {fine ? <><span style={{color: ORANGE}}>4.3</span>{f >= made && <span style={{color: '#b9b2a7', textDecoration: 'line-through', textDecorationThickness: 4}}>172</span>} cm</> : <><span style={{color: ORANGE}}>4</span> cm</>}
          </div>
        </>
      }
      svg={
        <g opacity={top}>
          {/* the worm */}
          {Array.from({length: 30}).map((_, i) => {
            const x = x0 + 12 + i * ((4.3 * cm - 24) / 29);
            return <circle key={i} cx={x} cy={wy + Math.sin(i / 3 + f / 10) * 5} r={20} fill={INK} />;
          })}
          <circle cx={x0 + 4.3 * cm - 18} cy={wy - 8} r={5} fill={PAPER} />
          {/* ruler */}
          <rect x={x0 - 20} y={wy + 40} width={6 * cm + 40} height={90} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
          {Array.from({length: fine ? 61 : 7}).map((_, i) => {
            const isCm = fine ? i % 10 === 0 : true;
            const x = x0 + (fine ? i * cm / 10 : i * cm);
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={wy + 40} y2={wy + 40 + (isCm ? 44 : i % 5 === 0 ? 30 : 18)} stroke={INK} strokeWidth={isCm ? 4 : 2} />
                {isCm && <text x={x} y={wy + 118} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={26} fill={INK}>{fine ? i / 10 : i}</text>}
              </g>
            );
          })}
          {/* Calc with a growing nose */}
          {f >= made && (
            <g opacity={clamp01((f - made) / 10)}>
              <Calc x={1620} y={520} scale={0.85} mood="sneaky" />
              <rect x={1620 - noseLen} y={520 - 140} width={noseLen} height={16} rx={8} fill={INK} />
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 11. sculpting (estimation)
export const Sculpt: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const chip = cue('Chip', 0.1), about = cue('about twenty-eight', 0.3), mol = cue('Molecules', 0.42);
  const over = cue('3.6 over six', 0.62), six = cue('Six moles', 0.78), eight = cue('Eight seconds', 0.86), calc = cue('Calc is still', 0.92);
  const blockA = 1 - clamp01((f - mol + 10) / 12);
  const rough = 1 - clamp01((f - about) / 10);
  const chips = clamp01((f - chip) / 30);
  const sec = f < mol ? 0 : Math.min(8, ((f - mol) / Math.max(1, eight - mol)) * 8);
  const pts = Array.from({length: 14}).map((_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 1 + (random(`m${i}`) - 0.5) * 0.35;
    return `${960 + Math.cos(a) * 380 * r} ${520 + Math.sin(a) * 210 * r}`;
  }).join(' L ');
  return (
    <Frame tag="ESTIMATION"
      html={
        <>
          <SfxList items={[[chip, 'clack', 0.6, 1.6], [chip + 9, 'clack', 0.6, 1.8], [chip + 18, 'clack', 0.6, 1.5], [about, 'pop', 0.6],
            [mol, 'swish', 0.5], ...Array.from({length: 8}).map((_, i) => [mol + ((eight - mol) * i) / 8, 'tick', 0.35] as [number, 'tick', number]),
            [six, 'ding', 0.55], ...[0, 1, 2, 3].map((i) => [calc + i * 9, 'blip', 0.4] as [number, 'blip', number])]} />
          <KeySeq x={100} y={150} w={900} size={76} items={[
            {at: 0, text: 'Estimating is [[sculpting.]]'},
            {at: chip, text: 'Chip to friendly shapes.'},
            {at: mol, text: ' '},
          ]} />
          {blockA > 0 && (
            <div style={{position: 'absolute', left: 560, width: 800, top: 450, textAlign: 'center', opacity: blockA, fontFamily: DISPLAY, fontWeight: 700, fontSize: 120, color: INK, lineHeight: 1}}>
              {f < about ? '6.9 × 4.1' : <>7 × 4 = <span style={{color: ORANGE}}>28</span></>}
            </div>
          )}
          <KeySeq x={420} y={330} w={1100} align="center" size={96} items={[
            {at: mol, text: '3.6×10^{24} ÷ 6×10^{23}', sub: 'molecules → moles'},
            {at: over, text: '= 0.6 × 10'},
            {at: six, text: '= [[6 mol]]', size: 150},
          ]} />
        </>
      }
      svg={
        <g>
          {blockA > 0 && (
            <g opacity={blockA}>
              <path d={`M ${pts} Z`} fill="none" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" opacity={rough} />
              <rect x={600} y={400} width={720} height={240} rx={40} fill="none" stroke={INK} strokeWidth={LINE} opacity={1 - rough} />
              {chips > 0 && chips < 1 && Array.from({length: 12}).map((_, i) => {
                const a = random(`ca${i}`) * Math.PI * 2;
                const d = 380 + chips * 260;
                const x = 960 + Math.cos(a) * d, y = 520 + Math.sin(a) * d * 0.6 + chips * chips * 200;
                return <path key={i} d={`M ${x} ${y} l 18 -6 l -6 18 Z`} fill={PAPER} stroke={INK} strokeWidth={3} opacity={1 - chips} />;
              })}
              <AxoSide x={250} y={980} scale={0.75} rear={1} arm={-20 + Math.sin(f / 3) * 12 * (f < about ? 1 : 0)} holding="pencil" />
            </g>
          )}
          {f >= mol && (
            <g opacity={clamp01((f - mol) / 10)}>
              <Ring x={1680} y={300} r={120} frac={sec / 10} label={`${Math.floor(sec)}s`} sub="STOPWATCH" color={COBALT} />
            </g>
          )}
          {f >= calc && (
            <g opacity={clamp01((f - calc) / 10)}>
              <Calc x={1680} y={1000} scale={0.75} mood="loading" />
              <text x={1680} y={760} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={P.muted}>40%</text>
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 12. chests that bite
const Chest: React.FC<{x: number; y: number; open: number}> = ({x, y, open}) => (
  <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
    {open > 0.05 && (
      <g>
        <rect x={-140} y={-112} width={280} height={40} fill={INK} />
        {Array.from({length: 9}).map((_, i) => (
          <path key={i} d={`M ${-136 + i * 31} -112 l 15 ${22 * open} l 15 ${-22 * open} Z`} fill={PAPER} />
        ))}
      </g>
    )}
    <rect x={-150} y={-110} width={300} height={140} rx={14} fill={PAPER} stroke={INK} strokeWidth={LINE} />
    <rect x={-22} y={-80} width={44} height={36} rx={6} fill={ORANGE} stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${-open * 55} -150 -110)`}>
      <path d="M -150 -110 L -150 -150 Q 0 -200 150 -150 L 150 -110 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} />
      {open > 0.05 && Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M ${-136 + i * 31} -110 l 15 ${-22 * open} l 15 ${22 * open} Z`} fill={PAPER} stroke={INK} strokeWidth={2} />
      ))}
    </g>
  </g>
);

export const Chests: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const c1 = cue('Number one', 0.1), only = cue('Only products', 0.35), c2 = cue('Two', 0.5), c3 = cue('Three', 0.72);
  const bite = (at: number) => (f < at ? 0 : f < at + 10 ? ease((f - at) / 10) : f < at + 22 ? 1 - ease((f - at - 10) / 8) * 0.8 : 0.2 + 0.1 * Math.sin(f / 5));
  const chests: [number, number, string, string][] = [
    [400, c1, 'log(a + b) ≠ log a + log b', 'only products → sums'],
    [960, c2, 'lower [H^{+}] → [[higher]] pH', ''],
    [1520, c3, 'add only on the [[same floor]]', ''],
  ];
  const pencilT = clamp01((f - c1 - 4) / 10);
  return (
    <Frame tag="THREE TRAPS"
      html={
        <>
          <SfxList items={[[0, 'type', 0.45], [c1, 'chomp', 0.9], [c1 + 12, 'crash', 0.25], [only, 'pop', 0.4], [c2, 'chomp', 0.9], [c3, 'chomp', 0.9]]} />
          <div style={{position: 'absolute', left: 0, width: 1920, top: 150}}>
            <KineticLine text="Chests that [[bite.]]" at={0} size={100} align="center" />
          </div>
          {chests.map(([x, at, text, sub], i) => (
            <div key={i} style={{position: 'absolute', left: x - 280, width: 560, top: 800}}>
              <KineticLine text={text} at={at + 6} size={40} align="center" />
              {sub && <KineticLine text={sub} at={only} size={28} weight={600} font="sans" color={P.muted} align="center" style={{marginTop: 12}} />}
            </div>
          ))}
        </>
      }
      svg={
        <g>
          {chests.map(([x, at], i) => f >= at - 6 && (
            <g key={i} opacity={clamp01((f - at + 6) / 6)}><Chest x={x} y={720} open={bite(at)} /></g>
          ))}
          {f >= c1 && pencilT < 1 && (
            <g transform={`translate(${160 + pencilT * 240} ${560 + pencilT * 80}) rotate(${20 + pencilT * 30})`} opacity={1 - pencilT * 0.6}>
              <Pencil len={170} w={24} />
            </g>
          )}
          <AxoSide x={130} y={1040} scale={0.5} rear={f < c1 ? 1 : 0} arm={-10} holding={f < c1 ? 'pencil' : null} sweat={f >= c1 && f < c1 + 60} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 13. your turn
export const YourTurnQ: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const q = cue('Strong acid', 0.08), ph = cue('pH', 0.2), five = cue('Five seconds', 0.3);
  const start = five + Math.round(0.9 * fps);
  const left = Math.max(0, 5 - Math.max(0, f - start) / fps);
  return (
    <Frame tag="YOUR TURN"
      html={
        <div style={{position: 'absolute', left: 0, width: 1920, top: 200}}>
          <SfxList items={[[q, 'type', 0.45], [ph, 'pop', 0.5], ...[0, 1, 2, 3, 4].map((k) => [start + k * fps, k % 2 ? 'tock' : 'tick', 0.6] as [number, 'tick' | 'tock', number]),
            [start + 5 * fps, 'ding', 0.6]]} />
          <KineticLine text="Strong acid: [H^{+}] = 2 × 10^{−4}" at={q} size={92} align="center" />
          <KineticLine text="pH = [[?]]" at={ph} size={120} align="center" style={{marginTop: 30}} />
        </div>
      }
      svg={
        <g>
          {f >= five && <g opacity={clamp01((f - five) / 8)}><Ring x={960} y={790} r={150} frac={left / 5} label={String(Math.ceil(left))} sub="SECONDS" /></g>}
          <AxoSide x={260} y={1010} scale={0.6} rear={1} arm={-50} />
        </g>
      }
    />
  );
};

export const YourTurnA: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const a1 = cue("four minus", 0.05), r1 = cue('3.7', 0.3), dil = cue('Dilute', 0.45), lift = cue('lifts', 0.65), r2 = cue('5.7', 0.88);
  const Y = (v: number) => 900 - (v - 3) * 190;
  const lvl = f < lift ? 3.7 : 3.7 + 2 * ease(clamp01((f - lift) / 30));
  return (
    <Frame tag="YOUR TURN"
      html={<><SfxList items={[[r1, 'pop', 0.6], [lift, 'rise', 0.7], [lift + 30, 'ding', 0.5], [r2, 'chime', 0.5]]} />
      <KeySeq x={820} y={300} w={1060} size={92} items={[
        {at: a1, text: 'pH ≈ 4 − 0.3'},
        {at: r1, text: 'pH ≈ [[3.7]]', size: 140},
        {at: dil, text: 'Dilute 100× → [[+2 floors]]'},
        {at: r2, text: 'pH ≈ [[5.7]]', size: 140},
      ]} /></>}
      svg={
        <g>
          <Building x={300} w={300} floors={[3, 4, 5, 6]} Y={Y} right={() => ''} top={Y(6) - 60} />
          <line x1={450} x2={450} y1={Y(6) - 40} y2={Y(lvl) - 112} stroke={INK} strokeWidth={3} />
          <Car x={450} y={Y(lvl)} />
          <text x={620} y={Y(lvl) - 40} fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={ORANGE}>{lvl.toFixed(1)}</text>
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 14. recap
const MiniIcon: React.FC<{kind: number}> = ({kind}) => {
  if (kind === 0) return <Crate x={0} y={80} w={170} h={130} label={<span style={{fontSize: 30}}>×10<sup style={{fontSize: '0.6em'}}>n</sup></span>} />;
  if (kind === 1) return <g>{[0, 1, 2].map((i) => <rect key={i} x={-90} y={40 - i * 40} width={70} height={36} rx={5} fill={PAPER} stroke={INK} strokeWidth={4} />)}
    {[0, 1].map((i) => <rect key={`b${i}`} x={10} y={40 - i * 40} width={70} height={36} rx={5} fill={PAPER} stroke={INK} strokeWidth={4} />)}</g>;
  if (kind === 2) return <g><rect x={-60} y={-90} width={120} height={170} rx={10} fill={COBALT_TINT} stroke={INK} strokeWidth={4} />
    {[-40, 0, 40].map((y) => <line key={y} x1={-60} x2={60} y1={y} y2={y} stroke={INK} strokeWidth={3} />)}
    <rect x={-20} y={-30} width={40} height={30} rx={4} fill={PAPER} stroke={COBALT} strokeWidth={4} /></g>;
  if (kind === 3) return <g><rect x={-90} y={-25} width={180} height={50} rx={6} fill={PAPER} stroke={INK} strokeWidth={4} />
    {Array.from({length: 10}).map((_, i) => <line key={i} x1={-80 + i * 18} x2={-80 + i * 18} y1={-25} y2={i % 5 === 0 ? 5 : -8} stroke={INK} strokeWidth={3} />)}</g>;
  return <g transform="rotate(-35) translate(-90 0)"><Pencil len={180} w={26} /></g>;
};

export const RiddleRecap: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const names = ['Crate', 'Towers', 'Elevator', 'Ruler', 'Chisel'];
  const ats = names.map((n, i) => cue(n, 0.06 + i * 0.1));
  const next = cue('Next time', 0.62);
  const out = clamp01((f - next) / 12);
  const D = props.durationInFrames;
  return (
    <Frame tag="RECAP"
      html={
        <>
          {names.map((n, i) => (
            <div key={n} style={{position: 'absolute', left: 160 + i * 340 - 100, width: 200, top: 620, textAlign: 'center', opacity: clamp01((f - ats[i]) / 8) * (1 - out),
              fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: INK}}>{n}</div>
          ))}
          <SfxList items={[...ats.map((a, i) => [a, 'pop', 0.6, 1 + i * 0.1] as [number, 'pop', number, number]), [next, 'whoosh', 0.45],
            [D - 40, 'sparkle', 0.55]]} />
          <div style={{position: 'absolute', left: 0, width: 1920, top: 330}}>
            <KineticLine text="Next time: [[Units.]]" at={next} size={120} align="center" />
            <KineticLine text="the words that give numbers meaning" at={next + 12} size={40} weight={600} font="sans" color={P.muted} align="center" style={{marginTop: 24}} />
          </div>
        </>
      }
      svg={
        <g>
          {names.map((n, i) => {
            const s = pop(f, ats[i], fps) * (1 - out);
            return s > 0.01 ? <g key={n} transform={`translate(${160 + i * 340} 470) scale(${s})`}><MiniIcon kind={i} /></g> : null;
          })}
          <AxoSide x={1650} y={1000} scale={0.7} rear={1} arm={-40} wink={f > D - 40 && f < D - 20} />
        </g>
      }
    />
  );
};

export const riddleScenes = {BlackTick, Hook, SciCrate, DotRun, Towers, LogElevator, LogHops, RiddleSolve, SparkScale, LnTwins, Rulers, Sculpt, Chests, YourTurnQ, YourTurnA, RiddleRecap};
void rich; void fall;
