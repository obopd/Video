// Video 1, part C: significant digits, estimation, tripwires, your turn, recap.
import React from 'react';
import {useCurrentFrame, random} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, KeySeq, KineticLine, SfxList, useCue, Ring, RED, rich} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Bill, Dime, Caption, ZeroTile, Burst, hopState, AxoSquash,
} from './common';

type S = [number, Parameters<typeof SfxList>[0]['items'][number][1], number?, number?];
const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 120, color = INK, style}) => (
  <span style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: size, color, fontVariantNumeric: 'tabular-nums lining-nums', ...style}}>{children}</span>
);

// --------------------------------------------------------------------- sig figs: the ruler's confession
export const V1SigRuler: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = useCue(props);
  const conf = cue('confession', 0.05), read = cue('honestly read', 0.3), guess = cue('guess one more', 0.45), write = cue('Write', 0.6), didnt = cue("You didn't", 0.9);
  const cm = 165, x0 = 220, Y = 640;
  const z = tio(f, 0, D, 1, 1.35);
  const dust = clamp01((f - didnt) / 22);
  return (
    <Frame tag="SIGNIFICANT DIGITS" push={0}
      html={
        <>
          <SfxList items={[[read, 'pop', 0.5], [guess, 'tap', 0.6], [write, 'scribble', 0.5], [didnt, 'whoosh', 0.4, 1.4], [didnt + 2, 'fizz', 0.4]]} />
          <KeySeq x={90} y={110} w={1300} size={76} items={[
            {at: conf, text: 'Every number [[confesses]] its ruler.'},
            {at: read, text: 'Millimetre ruler: read [[7.3 cm]]'},
            {at: guess, text: '+ one guessed digit, at most'},
            {at: write, text: '7.3157 cm?'},
            {at: didnt, text: "You [[didn't]] see that."},
          ]} />
          {f >= read && (
            <div style={{position: 'absolute', right: 120, top: 330, whiteSpace: 'nowrap'}}>
              <Big size={150}>7.3</Big>
              {f >= guess && <Big size={150} color="#bdb6aa">1</Big>}
              {f >= write && (
                <span style={{display: 'inline-block', opacity: 1 - dust, filter: `blur(${1 + dust * 6}px)`, transform: `translateY(${-dust * 60}px)`}}>
                  <Big size={150} color="#d4cdc1" style={{textDecoration: 'line-through'}}>57</Big>
                </span>
              )}
              <Big size={70} color={P.muted}> cm</Big>
            </div>
          )}
        </>
      }
      svg={
        <g transform={`translate(${x0 + 7.3 * cm} ${Y}) scale(${z}) translate(${-(x0 + 7.3 * cm)} ${-Y})`}>
          {/* the leaf */}
          <path d={`M ${x0} ${Y - 70} C ${x0 + 300} ${Y - 220}, ${x0 + 900} ${Y - 200}, ${x0 + 7.3 * cm} ${Y - 70} C ${x0 + 900} ${Y + 10}, ${x0 + 300} ${Y + 20}, ${x0} ${Y - 70} Z`}
                fill={TEAL} opacity={0.18} stroke={INK} strokeWidth={LINE} />
          <path d={`M ${x0} ${Y - 70} C ${x0 + 400} ${Y - 110}, ${x0 + 800} ${Y - 100}, ${x0 + 7.3 * cm} ${Y - 70}`} fill="none" stroke={INK} strokeWidth={3} />
          {/* millimetre ruler */}
          <rect x={x0 - 30} y={Y} width={9 * cm + 60} height={120} rx={10} fill={PAPER} stroke={INK} strokeWidth={LINE} />
          {Array.from({length: 91}).map((_, i) => (
            <g key={i}>
              <line x1={x0 + (i * cm) / 10} x2={x0 + (i * cm) / 10} y1={Y} y2={Y + (i % 10 === 0 ? 56 : i % 5 === 0 ? 38 : 24)} stroke={INK} strokeWidth={i % 10 === 0 ? 4 : 2} />
              {i % 10 === 0 && <text x={x0 + (i * cm) / 10} y={Y + 96} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={30} fill={INK}>{i / 10}</text>}
            </g>
          ))}
          <line x1={x0 + 7.3 * cm} x2={x0 + 7.3 * cm} y1={Y - 90} y2={Y + 60} stroke={ORANGE} strokeWidth={4} strokeDasharray="6 6" opacity={fin(f, read)} />
          {dust > 0 && dust < 1 && Array.from({length: 26}).map((_, i) => (
            <circle key={i} cx={x0 + 7.6 * cm + random(`dx${i}`) * 300 + dust * 80} cy={Y - 300 - dust * 140 * random(`dy${i}`)} r={3} fill={P.muted} opacity={1 - dust} />
          ))}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- sig figs: the zero rules
type DState = 'off' | 'on' | 'dim' | 'hide';
const DigitRow: React.FC<{x: number; y: number; chars: string; states: DState[]; size?: number}> = ({x, y, chars, states, size = 130}) => (
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: 12, alignItems: 'flex-end'}}>
    {chars.split('').map((c, i) => {
      const s = states[i] ?? 'off';
      if (s === 'hide') return null;
      const dot = c === '.';
      return (
        <div key={i} style={{width: dot ? size * 0.28 : size * 0.72, height: size * 1.1, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1,
          color: s === 'on' ? TEAL : s === 'dim' ? '#cfc8bc' : INK,
          border: dot ? 'none' : s === 'on' ? `5px solid ${TEAL}` : s === 'dim' ? '4px dashed #d8d1c5' : '4px solid transparent',
          background: s === 'on' ? 'rgba(17,165,150,0.08)' : 'transparent'}}>{c}</div>
      );
    })}
  </div>
);

export const V1SigZeros: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const which = cue('Which digits', 0.03), nonzero = cue('Nonzero digits', 0.1), start = cue('at the start', 0.25), two = cue('two significant', 0.38);
  const end = cue('at the end', 0.5), h2 = cue('hundred has two', 0.7), six = cue('has six', 0.9);
  const dot = tsp(f, six - 10, six);
  const lit = (i: number) => f >= six + i * 2;
  const r1: DState[] = [f >= start ? 'dim' : 'off', 'off', f >= start ? 'dim' : 'off', f >= nonzero ? 'on' : 'off', f >= two ? 'on' : 'off'];
  const r2: DState[] = [f >= nonzero ? 'on' : 'off', f >= nonzero ? 'on' : 'off', f >= h2 ? 'dim' : 'off', f >= h2 ? 'dim' : 'off'];
  const r3: DState[] = ['on', 'on', lit(0) ? 'on' : 'dim', lit(1) ? 'on' : 'dim', dot > 0.2 ? 'off' : 'hide', lit(2) ? 'on' : 'hide', lit(3) ? 'on' : 'hide'];
  return (
    <Frame tag="SIGNIFICANT DIGITS"
      html={
        <>
          <SfxList items={[[nonzero, 'pop', 0.5], [start, 'blip', 0.4], [two, 'ding', 0.4], [end, 'swish', 0.35], [h2, 'blip', 0.4],
            [six - 10, 'pop', 0.6, 1.3], ...[0, 1, 2, 3].map((i) => [six + i * 2, 'tick', 0.45, 1 + i * 0.1] as S), [six + 10, 'ding', 0.45]]} />
          <KeySeq x={90} y={110} w={1740} size={72} items={[
            {at: which, text: 'Which digits [[count?]]'},
            {at: nonzero, text: 'Nonzero digits, and zeros [[between]] them'},
            {at: start, text: 'Leading zeros: [[placeholders]]'},
            {at: end, text: 'Trailing zeros count only with a [[decimal point]]', size: 60},
          ]} />
          <DigitRow x={260} y={330} chars="0.010" states={r1} />
          {f >= two && <div style={{position: 'absolute', left: 1020, top: 400, opacity: fin(f, two)}}><Big size={60} color={TEAL}>2 sig figs</Big></div>}
          {f >= end - 4 && (
            <div style={{opacity: fin(f, end - 4, 10)}}>
              <DigitRow x={260} y={600} chars="4300" states={r2} />
              {f >= h2 && <div style={{position: 'absolute', left: 260, top: 760, opacity: fin(f, h2)}}><Big size={52} color={P.muted}>2</Big></div>}
              <div style={{position: 'absolute', left: 980, top: 600}}>
                <DigitRow x={0} y={0} chars="4300.00" states={r3} />
              </div>
              {f >= six && <div style={{position: 'absolute', left: 980, top: 760, opacity: fin(f, six)}}><Big size={52} color={TEAL}>6</Big></div>}
              {f >= six + 12 && <Caption y={900} o={fin(f, six + 12)} size={36} color={INK}>The decimal point is a promise: “I measured these.”</Caption>}
            </div>
          )}
        </>
      }
    />
  );
};

// --------------------------------------------------------------------- sig figs: combining, and round last
export const V1SigCombine: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const comb = cue('combine', 0.03), mul = cue('Multiplying or dividing', 0.15), add = cue('Adding or subtracting', 0.4), habit = cue('one habit', 0.6);
  const round = cue('round only at the end', 0.75), aamc = cue('expects', 0.88);
  const ph = f < add ? 1 : f < habit ? 2 : 3;
  const meet = tio(f, mul + 6, mul + 26);
  const odoDigits = f < round ? String(Math.floor(5970 + ((f * 37) % 30))).slice(1) : '';
  return (
    <Frame tag="SIGNIFICANT DIGITS"
      html={
        <>
          <SfxList items={[[mul + 26, 'clack', 0.6], [add, 'swish', 0.4], [add + 20, 'blip', 0.4], [habit, 'swish', 0.4], ...Array.from({length: 10}).map((_, i) => [habit + 10 + i * 4, 'tick', 0.2, 1.3] as S),
            [round, 'slide', 0.4], [round + 10, 'ding', 0.45], [aamc, 'pop', 0.4]]} />
          <KeySeq x={90} y={110} w={1740} size={72} items={[
            {at: comb, text: 'No sharper than your [[blurriest]] number.'},
            {at: mul, text: '× ÷ : fewest [[digits]] wins'},
            {at: add, text: '+ − : fewest [[decimal places]] wins'},
            {at: habit, text: 'Carry extras. Round [[last.]]'},
            {at: aamc, text: 'AAMC: “a [[general understanding]]”', size: 64},
          ]} />
          {ph === 1 && f >= mul - 4 && (
            <div style={{position: 'absolute', left: 0, width: 1920, top: 420, textAlign: 'center', whiteSpace: 'nowrap', opacity: fin(f, mul - 4, 8)}}>
              <span style={{display: 'inline-block', transform: `translateX(${(1 - meet) * -120}px)`}}><Big>3.1416</Big></span>
              <Big color={P.muted}> × </Big>
              <span style={{display: 'inline-block', filter: 'blur(3px)', transform: `translateX(${(1 - meet) * 120}px)`}}><Big>2.1</Big></span>
              {meet >= 1 && <><Big color={P.muted}> = </Big><span style={{filter: 'blur(3px)'}}><Big color={ORANGE}>6.6</Big></span></>}
            </div>
          )}
          {ph === 2 && (
            <div style={{position: 'absolute', left: 760, top: 340, opacity: fin(f, add, 8), fontFamily: DISPLAY, fontWeight: 700, fontSize: 110, lineHeight: 1.15, textAlign: 'right', width: 400, fontVariantNumeric: 'tabular-nums'}}>
              <div>12.1<span style={{color: f >= add + 20 ? '#d4cdc1' : INK}}>1</span></div>
              <div><span style={{color: P.muted}}>+ </span>0.3<span style={{opacity: 0}}>0</span></div>
              <div style={{borderTop: `6px solid ${INK}`, color: ORANGE}}>12.4<span style={{color: '#d4cdc1', opacity: f >= add + 20 ? 1 : 0}}>1</span></div>
            </div>
          )}
          {ph === 3 && (
            <div style={{position: 'absolute', left: 0, width: 1920, top: 440, textAlign: 'center', opacity: fin(f, habit, 8), whiteSpace: 'nowrap'}}>
              <Big size={150}>6.{f < round ? '5' : '6'}</Big>
              <span style={{display: 'inline-block', width: 260, textAlign: 'left', opacity: 1 - fin(f, round, 10), transform: `translateY(${fin(f, round, 10) * 40}px)`}}><Big size={150} color="#c9c2b6">{odoDigits || '97'}</Big></span>
            </div>
          )}
        </>
      }
    />
  );
};

// --------------------------------------------------------------------- estimation: choices, and the multiplying rectangle
export const V1EstMul: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const est = cue('rounding with a memory', 0.03), choices = cue('answer choices', 0.12), far = cue('far apart', 0.2), close = cue('close together', 0.3);
  const mul = cue('Multiplying', 0.42), round = cue('Round to seven', 0.5), cancel = cue('roughly cancel', 0.7), real = cue('28.3', 0.9);
  const ph2 = f >= mul - 4;
  const zoom = tio(f, close, close + 20);
  const lo = 0 + 24 * zoom, hi = 100 - 69 * zoom;
  const NX = (v: number) => 220 + ((v - lo) / (hi - lo)) * 1480;
  const vals = [[12, 26], [28, 27], [51, 28], [83, 29]].map(([a, b]) => a + (b - a) * zoom);
  const grid = zoom > 0.5 ? 1 : 10;
  const u = 100, gx = 610, gy = 330;
  const snap = tsp(f, round, round + 12);
  const w = (6.9 + 0.1 * snap) * u, h = (4.1 - 0.1 * snap) * u;
  const strips = fin(f, cancel - 30, 10), merge = tio(f, cancel, cancel + 16);
  return (
    <Frame tag="ESTIMATION"
      html={
        <>
          <SfxList items={[...[0, 1, 2, 3].map((i) => [choices + i * 4, 'tap', 0.5] as S), [far, 'thud', 0.4], [close, 'swish', 0.4], [close + 18, 'clack', 0.4, 1.4],
            [round, 'boing', 0.4, 1.3], [cancel - 30, 'swish', 0.35], [cancel + 16, 'clack', 0.6], [real, 'ding', 0.45]]} />
          <KeySeq x={90} y={110} w={1740} size={74} items={[
            {at: est, text: 'Estimating = rounding with a [[memory]]'},
            {at: choices, text: 'First: look at the [[answer choices]]'},
            {at: far, text: 'Far apart → round [[hard]]'},
            {at: close, text: 'Close together → round [[gently]]'},
            {at: mul, text: '6.9 × 4.1 ≈ 7 × 4 = [[28]]'},
            {at: cancel, text: 'One up, one down: errors [[cancel]]'},
            {at: real, text: 'True answer: [[28.3]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {!ph2 && f >= choices && (
            <g opacity={1 - fin(f, mul - 12, 8)}>
              <line x1={200} x2={1720} y1={640} y2={640} stroke={INK} strokeWidth={LINE} />
              {f >= far && Array.from({length: Math.floor((hi - lo) / grid) + 2}).map((_, i) => {
                const v = Math.ceil(lo / grid) * grid + i * grid;
                if (v > hi) return null;
                return <line key={`${grid}-${i}`} x1={NX(v)} x2={NX(v)} y1={440} y2={700} stroke={TEAL} strokeWidth={2} opacity={0.35 * fin(f, far, 6)} transform={`translate(0 ${(1 - ease(fin(f, far, 10))) * -60})`} />;
              })}
              {vals.map((v, i) => (
                <g key={i} opacity={fin(f, choices + i * 4, 6)} transform={`translate(${NX(v)} 640)`}>
                  <rect x={-50} y={-130} width={100} height={92} rx={16} fill={PAPER} stroke={INK} strokeWidth={4} />
                  <text y={-98} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={22} fill={P.muted}>{'ABCD'[i]}</text>
                  <text y={-56} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={38} fill={INK}>{Math.round(v)}</text>
                  <circle r={8} fill={ORANGE} />
                </g>
              ))}
            </g>
          )}
          {ph2 && (
            <g opacity={fin(f, mul - 4, 10)}>
              {Array.from({length: 8}).map((_, i) => <line key={`gx${i}`} x1={gx + i * u} x2={gx + i * u} y1={gy} y2={gy + 4 * u} stroke={INK} strokeWidth={2} opacity={0.15 * snap} />)}
              {Array.from({length: 5}).map((_, i) => <line key={`gy${i}`} x1={gx} x2={gx + 7 * u} y1={gy + i * u} y2={gy + i * u} stroke={INK} strokeWidth={2} opacity={0.15 * snap} />)}
              <rect x={gx} y={gy + 4 * u - h} width={w} height={h} fill={TEAL} opacity={0.12} stroke={INK} strokeWidth={LINE} />
              <text x={gx + w / 2} y={gy + 4 * u - h / 2 + 30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={90} fill={INK}>{snap > 0.5 ? '28' : ''}</text>
              <text x={gx + w / 2} y={gy + 4 * u + 60} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={P.muted}>{snap > 0.5 ? '7' : '6.9'}</text>
              <text x={gx - 40} y={gy + 4 * u - h / 2 + 14} textAnchor="end" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={P.muted}>{snap > 0.5 ? '4' : '4.1'}</text>
              {strips > 0 && (
                <g opacity={strips}>
                  <rect x={gx + merge * 140} y={gy - 26 - merge * -6} width={690 - merge * 420} height={26} rx={6} fill={ORANGE} />
                  <text x={gx + 345} y={gy - 44} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={34} fill={ORANGE} opacity={1 - merge}>+0.7</text>
                  <rect x={gx + 7 * u - 26 - merge * 150} y={gy + merge * 80} width={26} height={400 - merge * 380} rx={6} fill={INK} opacity={0.75} />
                  <text x={gx + 7 * u + 20} y={gy + 220} fontFamily={DISPLAY} fontWeight={700} fontSize={34} fill={INK} opacity={1 - merge}>−0.4</text>
                  {merge > 0.9 && <text x={gx + 7 * u + 60} y={gy + 30} fontFamily={DISPLAY} fontWeight={800} fontSize={54} fill={ORANGE}>≈ +0.3</text>}
                </g>
              )}
            </g>
          )}
          <AxoSide x={210} y={1010} scale={0.45} rear={f > real ? 1 : 0} arm={-50} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- estimation: dividing, and the moles problem
const Gauge: React.FC<{x: number; y: number; r: number; v: number; lo: number; hi: number; label: string; color?: string}> = ({x, y, r, v, lo, hi, label, color = ORANGE}) => {
  const a = Math.PI + ((v - lo) / (hi - lo)) * Math.PI;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill={PAPER} stroke={INK} strokeWidth={LINE} />
      {Array.from({length: 11}).map((_, i) => {
        const t = Math.PI + (i / 10) * Math.PI;
        return <line key={i} x1={Math.cos(t) * (r - 14)} y1={Math.sin(t) * (r - 14)} x2={Math.cos(t) * (r - (i % 5 === 0 ? 40 : 26))} y2={Math.sin(t) * (r - (i % 5 === 0 ? 40 : 26))} stroke={INK} strokeWidth={i % 5 === 0 ? 4 : 2} />;
      })}
      <line x1={0} y1={0} x2={Math.cos(a) * (r - 30)} y2={Math.sin(a) * (r - 30)} stroke={color} strokeWidth={8} strokeLinecap="round" />
      <circle r={14} fill={INK} />
      <text y={60} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>{label}</text>
    </g>
  );
};

export const V1EstDiv: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const opp = cue('Dividing is the opposite', 0.02), round = cue('round both up', 0.12), tru = cue('3.03', 0.2), pct = cue('same percentage', 0.26);
  const real = cue('real one', 0.36), digits = cue('Digits first', 0.55), tens = cue('Tens next', 0.68), six = cue('six moles', 0.86), eight = cue('eight seconds', 0.95);
  const ph2 = f >= real - 4;
  const nudge = tio(f, round + 4, round + 22);
  const top = 11.8 + 0.2 * nudge, bot = 3.9 + 0.1 * nudge;
  const split = fin(f, digits + 4, 16);
  const pairs = (i: number) => clamp01((f - tens - 6 - i * 0.6) / 8);
  const mergeT = tsp(f, six - 6, six + 8);
  const sw = ph2 ? Math.min(8, ((f - real) / Math.max(1, eight - real)) * 8) : 0;
  return (
    <Frame tag="ESTIMATION"
      html={
        <>
          <SfxList items={[[round + 4, 'rise', 0.35, 1.5], [tru, 'ding', 0.4], [real, 'swish', 0.4], [digits + 4, 'slide', 0.4], [tens + 6, 'fizz', 0.5],
            ...Array.from({length: 8}).map((_, i) => [tens + 6 + i * 2.5, 'pop', 0.25, 1.3 + i * 0.03] as S), [six, 'clack', 0.7], [six + 3, 'chime', 0.45], [eight, 'thud', 0.5]]} />
          <KeySeq x={90} y={110} w={1740} size={74} items={[
            {at: opp, text: 'Dividing: round both the [[same way]]'},
            {at: tru, text: '12 ÷ 4 = 3   (true: [[3.03]])'},
            {at: pct, text: 'Same % change cancels in a [[ratio]]', size: 66},
            {at: real, text: '3.6×10^{24} ÷ 6×10^{23}', sub: 'molecules → moles'},
            {at: six, text: '0.6 × 10 = [[6 mol]]', size: 96},
          ]} />
          {!ph2 && f >= opp && (
            <div style={{position: 'absolute', left: 520, top: 330, width: 520, textAlign: 'center', opacity: fin(f, opp + 4, 8) * (1 - fin(f, real - 10, 8))}}>
              <Big size={130}>{top.toFixed(1)}</Big>
              <div style={{height: 8, background: INK, borderRadius: 4, margin: '6px 40px'}} />
              <Big size={130}>{bot.toFixed(1)}</Big>
            </div>
          )}
          {ph2 && (
            <>
              <div style={{position: 'absolute', left: 120, top: 400, fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: P.muted, opacity: fin(f, digits)}}>DIGITS</div>
              <div style={{position: 'absolute', left: 120, top: 650, fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: P.muted, opacity: fin(f, tens)}}>TENS</div>
            </>
          )}
        </>
      }
      svg={
        <g>
          {!ph2 && f >= opp && (
            <g opacity={fin(f, opp + 4, 8) * (1 - fin(f, real - 10, 8))}>
              <Gauge x={1420} y={620} r={230} v={top / bot} lo={2.5} hi={3.5} label={(top / bot).toFixed(2)} />
            </g>
          )}
          {ph2 && f >= digits && (
            <g opacity={fin(f, digits, 8) * (1 - mergeT * 0.7)}>
              <rect x={320} y={440} width={3.6 * 300} height={60} rx={12} fill={TEAL} opacity={0.25} stroke={INK} strokeWidth={4} />
              {Array.from({length: 5}).map((_, i) => <line key={i} x1={320 + (i + 1) * 180} x2={320 + (i + 1) * 180} y1={440 - 10 * split} y2={500 + 10 * split} stroke={INK} strokeWidth={4} opacity={split} />)}
              <text x={320 + 90} y={560} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={ORANGE} opacity={split}>0.6</text>
              <text x={1460} y={490} fontFamily={DISPLAY} fontWeight={700} fontSize={56} fill={INK}>3.6 ÷ 6 = 0.6</text>
            </g>
          )}
          {ph2 && f >= tens && (
            <g opacity={fin(f, tens, 8) * (1 - mergeT * 0.7)}>
              {Array.from({length: 24}).map((_, i) => {
                const t = i < 23 ? pairs(i) : 0;
                return t < 1 ? <g key={`t${i}`}><text x={320 + i * 44} y={680} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={i === 23 ? ORANGE : INK} opacity={1 - t}>0</text><Burst x={320 + i * 44} y={666} t={t} r={16} /></g> : null;
              })}
              {Array.from({length: 23}).map((_, i) => {
                const t = pairs(i);
                return t < 1 ? <text key={`b${i}`} x={320 + i * 44} y={760} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK} opacity={1 - t}>0</text> : null;
              })}
              <text x={1460} y={720} fontFamily={DISPLAY} fontWeight={700} fontSize={56} fill={INK}>10<tspan dy={-26} fontSize={34}>24−23</tspan><tspan dy={26}> = 10</tspan></text>
            </g>
          )}
          {ph2 && <g opacity={fin(f, real, 8)}><Ring x={1720} y={190} r={90} frac={sw / 10} label={`${Math.floor(sw)}s`} sub="STOPWATCH" color={TEAL} /></g>}
          <AxoSide x={170} y={1010} scale={0.42} rear={f > six ? 1 : 0} arm={-40} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- three tripwires
export const V1Trip: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const one = cue('Three tripwires', 0.02), test = cue('Test it', 0.1), twenty = cue('log of twenty', 0.15), two = cue('is 2', 0.2), diff = cue('Different', 0.24);
  const t2 = cue('pH runs backwards', 0.38), wrote = cue('If you wrote', 0.48), t3 = cue('never add', 0.6), notFive = cue('not five', 0.75), match = cue('Match the units', 0.92);
  const beat = f < t2 - 6 ? 1 : f < t3 - 6 ? 2 : 3;
  const n1 = beat === 1 ? 1.3 * tsp(f, twenty, twenty + 14) : 0, n2 = beat === 1 ? 2.0 * tsp(f, two, two + 14) : 0;
  const pulse = f >= diff ? 0.5 + 0.5 * Math.cos((f - diff) / 3) : 0;
  const wob = f >= wrote ? Math.sin((f - wrote) / 2.5) * 5 * Math.exp(-(f - wrote) / 30) : 0;
  const tilt = beat === 2 ? -12 * tio(f, t2, t2 + 16) + wob : 0;
  const bounce = f >= t3 + 20 && f < notFive + 30 ? Math.sin(clamp01((f - t3 - 20) / 18) * Math.PI) : 0;
  const fuse = tio(f, match - 4, match + 14);
  return (
    <Frame tag="THREE TRIPWIRES"
      html={
        <>
          <SfxList items={[[twenty, 'boing', 0.4, 1.4], [two, 'boing', 0.4, 1.2], [diff, 'blip', 0.6], [t2, 'swish', 0.4], [wrote, 'boing', 0.5, 0.7], [t3, 'swish', 0.4],
            [t3 + 22, 'thud', 0.6], [match, 'whoosh', 0.3, 1.5], [match + 14, 'clack', 0.7], [match + 16, 'ding', 0.4]]} />
          <KeySeq x={90} y={110} w={1740} size={72} items={[
            {at: one, text: '[[1.]] log(a + b) ≠ log a + log b'},
            {at: t2, text: '[[2.]] pH runs [[backwards]]', sub: 'more acid → lower pH'},
            {at: t3, text: '[[3.]] Match the [[units]] first', sub: '3×10⁵ + 2×10⁴ ≠ 5×10⁵, ≠ 5×10⁹'},
          ]} />
        </>
      }
      svg={
        <g>
          {beat === 1 && (
            <g opacity={fin(f, test - 4, 10)}>
              <g transform="translate(560 650)">
                <path d="M -230 0 A 230 230 0 0 1 230 0" fill={PAPER} stroke={INK} strokeWidth={LINE} />
                {[0, 1, 2, 3].map((v) => { const a = Math.PI + (v / 3) * Math.PI; return <g key={v}><line x1={Math.cos(a) * 200} y1={Math.sin(a) * 200} x2={Math.cos(a) * 170} y2={Math.sin(a) * 170} stroke={INK} strokeWidth={4} /><text x={Math.cos(a) * 140} y={Math.sin(a) * 140 + 12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={32} fill={INK}>{v}</text></g>; })}
                <line x1={0} y1={0} x2={Math.cos(Math.PI + (n1 / 3) * Math.PI) * 190} y2={Math.sin(Math.PI + (n1 / 3) * Math.PI) * 190} stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
                <circle r={14} fill={INK} />
                <text y={80} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>log(10 + 10)</text>
                <text y={140} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={56} fill={ORANGE} opacity={fin(f, twenty + 10)}>1.3</text>
              </g>
              <g transform="translate(1360 650)">
                <path d="M -230 0 A 230 230 0 0 1 230 0" fill={PAPER} stroke={INK} strokeWidth={LINE} />
                {[0, 1, 2, 3].map((v) => { const a = Math.PI + (v / 3) * Math.PI; return <g key={v}><line x1={Math.cos(a) * 200} y1={Math.sin(a) * 200} x2={Math.cos(a) * 170} y2={Math.sin(a) * 170} stroke={INK} strokeWidth={4} /><text x={Math.cos(a) * 140} y={Math.sin(a) * 140 + 12} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={32} fill={INK}>{v}</text></g>; })}
                <line x1={0} y1={0} x2={Math.cos(Math.PI + (n2 / 3) * Math.PI) * 190} y2={Math.sin(Math.PI + (n2 / 3) * Math.PI) * 190} stroke={TEAL} strokeWidth={8} strokeLinecap="round" />
                <circle r={14} fill={INK} />
                <text y={80} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>log 10 + log 10</text>
                <text y={140} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={56} fill={TEAL} opacity={fin(f, two + 10)}>2.0</text>
              </g>
              {pulse > 0 && <path d="M 600 850 v 30 H 1320 v -30" fill="none" stroke={RED} strokeWidth={6} opacity={pulse} />}
            </g>
          )}
          {beat === 2 && (
            <g opacity={fin(f, t2 - 6, 10)}>
              <path d="M 960 760 l -60 120 h 120 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
              <g transform={`rotate(${tilt} 960 760)`}>
                <rect x={460} y={736} width={1000} height={28} rx={14} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <g transform="translate(520 690)"><rect x={-90} y={-46} width={180} height={64} rx={32} fill={ORANGE} /><text y={-2} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={36} fill={PAPER}>[H⁺] ↑</text></g>
                <g transform="translate(1400 690)"><rect x={-90} y={-46} width={180} height={64} rx={32} fill={INK} /><text y={-2} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={36} fill={PAPER}>pH ↓</text></g>
              </g>
              <AxoSide x={1330} y={1000} scale={0.5} rear={f >= wrote ? 1 : 0} arm={-80} sweat={f >= wrote} />
            </g>
          )}
          {beat === 3 && (
            <g opacity={fin(f, t3 - 6, 10)}>
              <Bill x={760 - bounce * 120} y={620} fill={fuse > 0 ? 1 : 1} />
              {fuse < 1 && <Dime x={1100 + bounce * 120 - fuse * 120} y={620} o={1 - fuse} />}
              {fuse > 0 && <Bill x={1100} y={620} fill={0.1} label="$0.1" o={fuse} />}
              {f >= t3 + 18 && f < match && <text x={930} y={500} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={48} fill={RED} opacity={fin(f, t3 + 18)}>“2 coins”?</text>}
              {fuse >= 1 && <text x={930} y={800} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={64} fill={TEAL}>= $1.1</text>}
              <AxoSide x={480} y={1000} scale={0.5} rear={1} arm={-30} />
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- your turn
const ConcRuler: React.FC<{mx: number; ripple?: number; o?: number}> = ({mx, ripple = 0, o = 1}) => {
  const X = (n: number) => 1500 - (n - 3) * 400; // 10^-n
  return (
    <g opacity={o}>
      <line x1={220} x2={1580} y1={640} y2={640} stroke={INK} strokeWidth={LINE} />
      {[3, 4, 5, 6].map((n) => (
        <g key={n}>
          <line x1={X(n)} x2={X(n)} y1={600} y2={680} stroke={INK} strokeWidth={6} />
          <text x={X(n)} y={740} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>10⁻{n}</text>
        </g>
      ))}
      {ripple > 0 && ripple < 1 && <rect x={220 + 1360 * ripple - 60} y={626} width={120} height={28} rx={14} fill={TEAL} opacity={0.6 * (1 - Math.abs(ripple - 0.5) * 2) + 0.2} />}
      <text x={300} y={820} fontFamily={SANS} fontWeight={700} fontSize={24} letterSpacing={2} fill={P.muted}>← MORE DILUTE</text>
      <path d={`M ${mx} 632 l -22 -34 h 44 Z`} fill={ORANGE} />
    </g>
  );
};

export const V1TurnQ: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const q = cue('strong acid', 0.08), ph = cue("What's the pH", 0.22), five = cue('Five seconds', 0.32);
  const start = five + Math.round(0.8 * fps);
  const left = Math.max(0, 5 - Math.max(0, f - start) / fps);
  return (
    <Frame tag="YOUR TURN"
      html={
        <>
          <SfxList items={[[ph, 'pop', 0.5], ...[0, 1, 2, 3, 4].map((k) => [start + k * fps, k % 2 ? 'tock' : 'tick', 0.6] as S), [start + 5 * fps, 'ding', 0.55]]} />
          <div style={{position: 'absolute', left: 0, width: 1920, top: 220}}>
            <KineticLine text="Strong acid: [H^{+}] = 2 × 10^{−4}" at={q} size={92} align="center" />
            <KineticLine text="pH = [[?]]" at={ph} size={120} align="center" style={{marginTop: 30}} />
          </div>
        </>
      }
      svg={
        <g>
          {f >= five && <g opacity={fin(f, five)}><Ring x={960} y={800} r={140} frac={left / 5} label={String(Math.ceil(left))} sub="SECONDS" /></g>}
          <AxoSide x={260} y={1010} scale={0.55} rear={1} arm={-60} />
        </g>
      }
    />
  );
};

export const V1TurnA: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const four = cue('Four steps down', 0.04), sub = cue('subtract 0.3', 0.2), r1 = cue('3.7', 0.3), dil = cue('dilute it', 0.45), two = cue('two more divide', 0.6), r2 = cue('5.7', 0.9);
  const X = (n: number) => 1500 - (n - 3) * 400;
  const s1 = tio(f, sub, sub + Math.round(1.0 * fps));
  const s2 = tio(f, two, two + Math.round(1.4 * fps));
  const pos4 = X(4) + 0.301 * 400 * s1; // 2 x 10^-4
  const mx = pos4 + (X(6) + 0.301 * 400 - pos4) * s2;
  const pH = 4 - 0.3 * s1 + 2 * s2;
  const ripple = clamp01((f - r2 - 4) / 30);
  return (
    <Frame tag="YOUR TURN"
      html={
        <>
          <SfxList items={[[sub, 'rise', 0.4, 1.4], [r1, 'pop', 0.6], [two, 'rise', 0.5, 0.8], [two + 1.4 * fps, 'clack', 0.5], [r2, 'chime', 0.5]]} />
          <KeySeq x={90} y={110} w={1740} size={76} items={[
            {at: four, text: '10^{−4}: four steps down → pH 4'},
            {at: sub, text: 'the 2 costs 0.3 → pH [[3.7]]'},
            {at: dil, text: 'Dilute 100× = [[two more]] steps'},
            {at: r2, text: 'pH [[5.7]]', size: 110},
          ]} />
          <div style={{position: 'absolute', left: mx - 150, width: 300, top: 410, textAlign: 'center'}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: P.muted}}>pH</div>
            <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: ORANGE, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{pH.toFixed(1)}</div>
          </div>
        </>
      }
      svg={<g><ConcRuler mx={mx} ripple={ripple} /><AxoSide x={200} y={1010} scale={0.42} rear={f > r2 ? 1 : 0} arm={-50} /></g>}
    />
  );
};

// --------------------------------------------------------------------- recap -> teaser (the ruler becomes a tape measure, snap, black)
export const V1Recap: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = useCue(props);
  const recap = cue('Recap', 0.02), zeros = cue('Count the zeros', 0.08), logs = cue('A log counts tens', 0.22), nums = cue('Two numbers', 0.34);
  const est = cue('Estimate first', 0.5), next = cue('Next time', 0.62);
  const snapAt = D - 14;
  const icon = f < logs ? 0 : f < nums ? 1 : f < est ? 2 : 3;
  const at = [zeros, logs, nums, est][icon];
  const s = tsp(f, at, at + 10) * (1 - fin(f, next - 6, 6));
  const relabel = fin(f, next + 20, 12);
  const retract = tio(f, snapAt - 10, snapAt);
  const black = f >= snapAt;
  return (
    <Frame tag="RECAP" exit="cut"
      html={
        <>
          <SfxList items={[[zeros, 'pop', 0.5], [logs, 'hop', 0.5], [nums, 'pop', 0.5, 1.1], [est, 'pop', 0.5, 1.2], [next, 'whoosh', 0.4], [next + 20, 'tick', 0.4],
            [snapAt - 12, 'tap', 0.6], [snapAt - 10, 'slide', 0.5, 1.6], [snapAt, 'clack', 1, 0.8], [snapAt, 'thud', 0.7]]} />
          <KeySeq x={90} y={110} w={1740} size={78} items={[
            {at: recap, text: 'Recap.'},
            {at: zeros, text: 'Count the zeros, [[don’t write them.]]'},
            {at: logs, text: 'A log counts [[tens.]]'},
            {at: nums, text: '[[0.3]] and [[0.48]] unlock the rest.'},
            {at: est, text: 'Estimate first, round [[later.]]'},
            {at: next, text: 'Next time: [[units.]]', size: 100, sub: 'the words that give numbers their meaning'},
          ]} />
          {black && <div style={{position: 'absolute', inset: 0, background: INK}} />}
        </>
      }
      svg={
        <g>
          {s > 0.01 && f < next && (
            <g transform={`translate(960 640) scale(${s})`}>
              {icon === 0 && <g><rect x={-170} y={-100} width={340} height={200} rx={100} fill={PAPER} stroke={INK} strokeWidth={LINE} /><text y={30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={90} fill={ORANGE}>10²³</text></g>}
              {icon === 1 && <g>{[0, 1, 2].map((i) => <path key={i} d={`M ${-300 + i * 200} 60 Q ${-200 + i * 200} -80 ${-100 + i * 200} 60`} fill="none" stroke={TEAL} strokeWidth={8} strokeLinecap="round" />)}<line x1={-340} x2={340} y1={60} y2={60} stroke={INK} strokeWidth={LINE} /></g>}
              {icon === 2 && <g><line x1={-400} x2={400} y1={-40} y2={-40} stroke={INK} strokeWidth={LINE} /><line x1={-280} x2={520} y1={60} y2={60} stroke={INK} strokeWidth={LINE} />{[-400, -280, 0, 400].map((x, i) => <line key={i} x1={x} x2={x} y1={i < 2 ? -70 : -70} y2={i < 2 ? -10 : -10} stroke={INK} strokeWidth={5} />)}<text x={-400} y={-90} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={TEAL}>0.3</text><text x={0} y={-90} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={40} fill={ORANGE}>0.48</text></g>}
              {icon === 3 && <g><Bill x={-130} y={0} /><Bill x={130} y={0} fill={0.2} label="$0.2" /></g>}
            </g>
          )}
          {f >= next && !black && (
            <g opacity={fin(f, next, 10)} transform={`translate(${-retract * 1400} 0)`}>
              <rect x={260} y={600} width={1400} height={110} rx={14} fill="#f2d36b" stroke={INK} strokeWidth={LINE} />
              {Array.from({length: 4}).map((_, i) => {
                const x = 330 + i * 430;
                const lab = relabel < 0.5 ? `×10${['⁰', '¹', '²', '³'][i]}` : ['mm', 'cm', 'dm', 'm'][i];
                return (
                  <g key={i}>
                    <line x1={x} x2={x} y1={600} y2={660} stroke={INK} strokeWidth={5} />
                    <text x={x + 14} y={694} fontFamily={DISPLAY} fontWeight={700} fontSize={36} fill={INK} opacity={Math.abs(relabel - 0.5) * 2}>{lab}</text>
                  </g>
                );
              })}
              <rect x={150} y={570} width={150} height={170} rx={30} fill={INK} />
            </g>
          )}
          {!black && <AxoSide x={f >= next ? 230 : 200} y={1010} scale={0.5} rear={f >= next ? 1 : 0} arm={f > snapAt - 14 ? -20 : -60} wink={f > next + 40 && f < next + 56} />}
        </g>
      }
    />
  );
};

export const v1c = {V1SigRuler, V1SigZeros, V1SigCombine, V1EstMul, V1EstDiv, V1Trip, V1TurnQ, V1TurnA, V1Recap};
void rich; void ZeroTile; void hopState; void AxoSquash; void inOut;
