// Video 1, part A: hook and "count the zeros".
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, KeySeq, KineticLine, SfxList, useCue, RED, rich} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin,
  Desk, RectRing, AxoSquash, Bill, Dime, ZeroTile, Burst, SparkField, Caption,
} from './common';

type S = [number, Parameters<typeof SfxList>[0]['items'][number][1], number?, number?];

// --------------------------------------------------------------------- 0. black, one tick
export const V1Black: React.FC<SceneProps> = () => (
  <Frame enter="cut" exit="cut" still html={<><div style={{position: 'absolute', inset: 0, background: INK}} /><SfxList items={[[3, 'tick', 0.8]]} /></>} />
);

// --------------------------------------------------------------------- hook
export const V1Hook: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = useCue(props);
  const c96 = cue('Ninety-six', 0.02), noCalc = cue('no calculator', 0.2), here = cue("Here's one", 0.3);
  const hyd = cue('hydrogen', 0.36), ph = cue("What's its pH", 0.5), freeze = cue('freeze', 0.62);
  const tenMin = cue('In ten minutes', 0.7), why = cue('why', 0.86);
  // phase 1: dolly down the row of desks (4 s, ease in-out); phase 2: over the shoulder onto the sheet
  const dollyEnd = Math.round(4 * fps);
  const close = clamp01((f - dollyEnd + 6) / 12);
  const cx = tio(f, 0, dollyEnd, 640, 3700), z = tio(f, 0, dollyEnd, 0.8, 1.45);
  const desks = [0, 1, 2, 3, 4, 5].map((i) => 520 + i * 640);
  // the ring drains in real time from 96 s; on "why" it snaps to 10 and turns red
  const secs = f < why ? Math.max(0, 96 - Math.max(0, f - c96) / fps) : 10;
  const ringColor = secs <= 10 ? RED : ORANGE;
  // the hand drifts toward the empty tray: lean back, reach, stop, retract, gulp
  const h0 = noCalc + 4;
  const lean = tio(f, h0, h0 + 8), reach = tio(f, h0 + 8, h0 + 34), back = tio(f, h0 + 46, h0 + 66);
  const hx = 560 - 40 * lean * (1 - reach) + (1180 - 560) * reach * (1 - back);
  const hy = 930 + 30 * lean * (1 - reach) + (700 - 930) * reach * (1 - back);
  const gulp = f > h0 + 66 && f < h0 + 80 ? Math.sin(((f - h0 - 66) / 14) * Math.PI) : 0;
  const trayLit = fin(f, noCalc, 6) * (1 - 0.6 * fin(f, h0 + 70, 20));
  const ticks: S[] = [];
  for (let t = c96, k = 0; t < why; t += fps, k++) ticks.push([t, k % 2 ? 'tock' : 'tick', 0.22]);
  return (
    <Frame enter="cut" exit="whip" push={0}
      html={
        <>
          <SfxList items={[[0, 'whoosh', 0.25, 0.6], ...ticks, [noCalc, 'blip', 0.5], [h0, 'swish', 0.35], [h0 + 46, 'swish', 0.25, 0.8],
            [h0 + 68, 'pop', 0.5, 0.55], [why, 'clack', 0.8], [why + 2, 'tick', 0.6], [D - 12, 'whoosh', 0.7]]} />
          {false && (
            <div style={{position: 'absolute', left: 740, top: 230, width: 560, transform: 'rotate(-3deg)', opacity: close}}>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: P.muted}}>QUESTION 1 OF 59</div>
              <div style={{marginTop: 26, opacity: fin(f, here, 8), fontFamily: SANS, fontSize: 26, color: '#5c564d', lineHeight: 1.5}}>
                A solution has a hydrogen ion concentration of
              </div>
              <div style={{marginTop: 10}}><KineticLine text="3 × 10^{−5} M" at={hyd} size={78} /></div>
              <div style={{marginTop: 24}}><KineticLine text="pH = [[?]]" at={ph} size={78} /></div>
              {[0, 1, 2, 3].map((i) => <div key={i} style={{marginTop: 22, height: 10, width: 480 - i * 60, borderRadius: 5, background: '#e9e2d6', opacity: fin(f, here, 10)}} />)}
            </div>
          )}
          <KeySeq x={90} y={70} w={620} size={72} items={[
            {at: c96, text: '[[96]] seconds.'},
            {at: noCalc, text: 'No calculator.'},
            {at: here, text: "Here's one."},
            {at: freeze, text: 'Most people [[freeze.]]'},
            {at: tenMin, text: 'In 10 minutes: [[10 seconds.]]', size: 64},
            {at: why, text: 'And know [[why.]]'},
          ]} />
          {close > 0 && f >= c96 && (
            <div style={{position: 'absolute', left: 1210, top: 120, opacity: close, fontFamily: DISPLAY, fontWeight: 700, fontSize: 46,
              color: ringColor, fontVariantNumeric: 'tabular-nums'}}>{Math.ceil(secs)}s</div>
          )}
        </>
      }
      svg={
        <g>
          {/* phase 1: the row of desks, only the last one sharp */}
          {close < 1 && (
            <g opacity={Math.max(0, 1 - close * 2)} transform={`translate(960 600) scale(${z}) translate(${-cx} -600)`}>
              <defs><filter id="dof" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={6} /></filter></defs>
              <line x1={0} x2={4400} y1={860} y2={860} stroke={INK} strokeWidth={3} opacity={0.4} />
              {desks.map((x, i) => (
                <g key={i} filter={i < 5 ? 'url(#dof)' : undefined} opacity={i < 5 ? 0.55 : 1}>
                  {i === 5 && <AxoSide x={x - 60} y={860} scale={1.25} rear={1} arm={-60} />}
                  <Desk x={x} y={650} s={1} />
                </g>
              ))}
            </g>
          )}
          {/* phase 2: over the shoulder: desk top, sheet, ring, empty tray, Axo */}
          {close > 0 && (
            <g opacity={close} transform={`translate(960 540) scale(${0.92 + 0.08 * close}) translate(-960 -540)`}>
              <path d="M -50 600 L 1970 600 L 1970 1130 L -50 1130 Z" fill="#efe7da" stroke={INK} strokeWidth={LINE} />
              <g transform="rotate(-3 1020 500)">
                <rect x={710} y={190} width={620} height={600} rx={10} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
                <foreignObject x={740} y={220} width={570} height={560}>
                  <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: P.muted}}>QUESTION 1 OF 59</div>
                  <div style={{marginTop: 26, opacity: fin(f, here, 8), fontFamily: SANS, fontSize: 26, color: '#5c564d', lineHeight: 1.5}}>
                    A solution has a hydrogen ion concentration of
                  </div>
                  <div style={{marginTop: 10}}><KineticLine text="3 × 10^{−5} M" at={hyd} size={78} /></div>
                  <div style={{marginTop: 24}}><KineticLine text="pH = [[?]]" at={ph} size={78} /></div>
                  {[0, 1, 2, 3].map((i) => <div key={i} style={{marginTop: 22, height: 10, width: 480 - i * 60, borderRadius: 5, background: '#e9e2d6', opacity: fin(f, here, 10)}} />)}
                </foreignObject>
                <RectRing x={680} y={160} w={680} h={660} frac={secs / 96} color={ringColor} r={30} />
              </g>
              {/* empty calculator tray, lit */}
              <g transform="translate(1450 640)">
                <ellipse cx={150} cy={50} rx={240} ry={110} fill={ORANGE} opacity={0.16 * trayLit} />
                <rect x={0} y={0} width={300} height={110} rx={20} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <rect x={95} y={14} width={110} height={82} rx={10} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="9 8" opacity={0.6} />
                <text x={150} y={150} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={22} letterSpacing={3} fill={P.muted} opacity={trayLit}>NO CALCULATOR</text>
              </g>
              {/* Axo over the shoulder (big, lower left) and the reaching hand */}
              <g transform={`translate(330 1180) scale(1 ${1 - 0.06 * gulp}) translate(-330 -1180)`}>
                <AxoSide x={250} y={1180} scale={1.9} rear={1} arm={-70} sweat={f > freeze} />
              </g>
              <path d={`M 470 1100 Q ${(470 + hx) / 2} ${hy + 120} ${hx} ${hy}`} stroke={INK} strokeWidth={46} strokeLinecap="round" fill="none" />
              <circle cx={hx} cy={hy} r={34} fill={INK} />
            </g>
          )}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- 1. count the zeros
export const V1Zeros: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const absurd = cue('absurd', 0.04), mole = cue('six hundred two', 0.12), nobody = cue('Nobody', 0.3);
  const count = cue('Count them', 0.42), matter = cue('digits that matter', 0.55), stacked = cue('stacked', 0.62);
  const here = cue('six-point-oh-two', 0.72), expo = cue('That count', 0.88);
  // sparks stream away, revealing the ribbon of digits; the camera runs along it
  const away = clamp01((f - mole + 6) / 14);
  const runA = mole + 4, runB = runA + fps, runC = count - Math.round(0.6 * fps);
  const travel = 1260;
  const run = f < runA ? 0 : f < runB ? 0.35 * Math.pow((f - runA) / fps, 2) : f < runC ? 0.35 + 0.55 * ((f - runB) / Math.max(1, runC - runB)) : 0.9 + 0.1 * inOut((f - runC) / (0.6 * fps));
  const off = -travel * Math.min(1, run);
  const digits = ['6', '0', '2', ...Array.from({length: 21}).map(() => '0')];
  const xs = digits.map((_, i) => 360 + i * 96 + off);
  const passed = digits.slice(3).filter((_, i) => xs[i + 3] < 1500).length;
  const fold = (i: number) => clamp01((f - count - (i - 3) * 1.2) / 10);
  const spool = tsp(f, count + 30, count + 44);
  return (
    <Frame enter="whip"
      html={
        <>
          <SfxList items={[[2, 'fizz', 0.6], [mole, 'whoosh', 0.6], ...Array.from({length: 21}).map((_, i) => [runA + 8 + i * 2.4, 'tick', 0.18, 1.2] as S),
            ...Array.from({length: 7}).map((_, i) => [count + i * 4, 'clack', 0.3, 1.4 + i * 0.05] as S), [count + 32, 'pop', 0.7], [expo, 'chime', 0.4]]} />
          <KeySeq x={90} y={80} w={1100} size={78} items={[
            {at: absurd, text: 'Chemistry numbers are [[absurd.]]'},
            {at: nobody, text: 'Nobody wants to write that.'},
            {at: count, text: "Don't write zeros. [[Count]] them."},
            {at: expo, text: 'That count is the [[exponent.]]'},
          ]} />
          {f >= mole && f < count + 30 && (
            <div style={{position: 'absolute', right: 90, top: 90, fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, color: TEAL, fontVariantNumeric: 'tabular-nums'}}>
              {passed} <span style={{fontFamily: SANS, fontSize: 22, letterSpacing: 3, color: P.muted}}>ZEROS</span>
            </div>
          )}
          {f >= count + 26 && (
            <>
              <div style={{position: 'absolute', left: 360, top: 430, fontFamily: DISPLAY, fontWeight: 700, fontSize: 210, color: INK, opacity: fin(f, count + 26, 10), lineHeight: 1}}>6.02</div>
              <Caption x={330} w={520} y={680} o={fin(f, matter)}>the digits that matter</Caption>
              <Caption x={1060} w={560} y={680} o={fin(f, stacked)}>how many tens are stacked</Caption>
              <div style={{position: 'absolute', left: 880, top: 500, fontFamily: DISPLAY, fontWeight: 600, fontSize: 110, color: P.muted, opacity: fin(f, here)}}>×</div>
            </>
          )}
        </>
      }
      svg={
        <g>
          {away < 1 && (
            <g opacity={1 - away} transform={`translate(${-away * 900} 0)`}>
              <path d="M 380 140 L 380 960 Q 380 1000 420 1000 L 1500 1000 Q 1540 1000 1540 960 L 1540 140" fill="none" stroke={INK} strokeWidth={LINE} />
              <SparkField n={18} x={420} y={300} w={1080} h={640} seed="v1z" drift={f * 7} r={16} />
              <SparkField n={8} x={420} y={300} w={1080} h={640} seed="v1zb" drift={f * 14} r={22} o={0.8} />
            </g>
          )}
          {f >= mole - 6 && digits.map((d, i) => {
            if (i >= 3 && f >= count) {
              const t = fold(i);
              if (t >= 1) return null;
              const x = xs[i] + (1330 - xs[i]) * ease(t);
              return <ZeroTile key={i} x={x} y={600 - Math.sin(t * Math.PI) * 30} s={1 - 0.7 * t} o={1 - t} />;
            }
            if (i < 3 && f >= count + 20) return null;
            const x = xs[i];
            if (x < -80 || x > 2000) return null;
            return <ZeroTile key={i} x={x} y={600} o={clamp01((f - mole + 6 - i * 0.5) / 8)} color={i < 3 ? INK : INK} glow={i >= 3 && x < 1500 && x > 1400 ? 1 : 0} />;
          })}
          {spool > 0 && (
            <g transform={`translate(1330 560) scale(${spool})`}>
              <rect x={-190} y={-120} width={380} height={240} rx={110} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              <rect x={-150} y={-84} width={300} height={168} rx={80} fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
              <text x={0} y={34} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={104} fill={ORANGE}>10</text>
              <text x={92} y={-18} fontFamily={DISPLAY} fontWeight={800} fontSize={58} fill={ORANGE}>23</text>
            </g>
          )}
          <AxoSide x={tio(f, mole, runC, 1700, 1760)} y={1000} scale={0.45} dir={-1} run={f > mole && f < runC ? f / 4 : undefined} sweat={f > mole && f < count + 20} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- tiny numbers: four hops of the decimal point
export const V1Tiny: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const tiny = cue('Tiny', 0.04), zero = cue('Zero-point', 0.22), divided = cue('divided by ten', 0.45), times = cue('four times', 0.6), neg = cue('negative exponent', 0.75);
  const bw = 150, gap = 40, x0 = 960 - (6 * bw + 5 * gap) / 2, Y = 560;
  const bx = (b: number) => x0 + b * (bw + gap) - gap / 2;
  const hopLen = 12, start = divided, span = Math.max(4 * hopLen, times - divided + 14);
  const each = span / 4;
  const k = Math.max(0, Math.min(4, (f - start) / each));
  const kInt = Math.floor(k), frac = k - kInt;
  const pos = 5 - Math.min(4, kInt + inOut(clamp01(frac * (each / hopLen))));
  const hop = kInt < 4 && f >= start ? Math.sin(clamp01(frac * (each / hopLen)) * Math.PI) * 70 : 0;
  const shown = Math.min(4, kInt + (frac * (each / hopLen) > 0.6 ? 1 : 0));
  const values = ['4.5', '0.45', '0.045', '0.0045', '0.00045'];
  const firstVisible = Math.min(4, 4 - shown);
  return (
    <Frame tag="SCIENTIFIC NOTATION"
      html={
        <>
          <SfxList items={[...[0, 1, 2, 3].flatMap((i) => [[start + i * each, 'hop', 0.5, 1 - i * 0.06], [start + i * each + hopLen - 2, 'pop', 0.4, 1.1 + i * 0.1]] as S[]), [neg, 'chime', 0.35]]} />
          <KeySeq x={0} y={150} w={1920} align="center" size={76} items={[
            {at: tiny, text: 'Tiny numbers: [[reverse.]]'},
            {at: zero, text: '0.00045 = 4.5 ÷ 10 ÷ 10 ÷ 10 ÷ 10', size: 64},
            {at: neg, text: '= 4.5 × [[10^{−4}]]', size: 96, sub: 'negative exponent = divide by ten that many times'},
          ]} />
          {f >= zero - 4 && ['0', '0', '0', '0', '4', '5'].map((d, i) => (
            <div key={i} style={{position: 'absolute', left: x0 + i * (bw + gap), top: Y - 220, width: bw, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 230,
              lineHeight: 1, color: INK, opacity: (i >= 4 ? 1 : clamp01((k - (3 - i)) * 2.2)) * fin(f, zero - 4, 8), transform: `translateY(${i < 4 ? (1 - clamp01((k - (3 - i)) * 2.2)) * 30 : 0}px)`}}>{d}</div>
          ))}
          <div style={{position: 'absolute', left: 0, width: 1920, top: 880, textAlign: 'center', opacity: fin(f, zero), fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: P.muted, fontVariantNumeric: 'tabular-nums'}}>
            {values[shown]}
          </div>
        </>
      }
      svg={
        <g>
          {f >= zero - 4 && <circle cx={bx(pos)} cy={Y + 20 - hop} r={22} fill={ORANGE} />}
          {[0, 1, 2, 3].map((i) => {
            const at = start + i * each;
            const t = clamp01((f - at) / 18);
            if (f < at) return null;
            return (
              <g key={i} transform={`translate(${bx(5 - i - 0.5)} ${Y + 120 + 20 * ease(t)}) scale(${0.6 + 0.4 * tsp(f, at, at + 10)})`} opacity={i === shown - 1 ? 1 : 0.35}>
                <rect x={-58} y={-30} width={116} height={60} rx={30} fill={INK} />
                <text y={13} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={36} fill={PAPER}>÷10</text>
              </g>
            );
          })}
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- multiplying / dividing as counting zeros
export const V1ZeroOps: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const pay = cue('payoff', 0.03), mul = cue('Ten thousand', 0.15), meet = cue('meet three', 0.25), seven = cue('get seven', 0.38);
  const add = cue('exponents add', 0.5), div = cue('Divide', 0.62), sub = cue('exponents subtract', 0.88);
  const phase2 = f >= div;
  const Y = 560, w = 86;
  const lock = tsp(f, meet, meet + 14);
  // multiply: [1 0 0 0 0] from the left, [1 0 0 0] from the right; the right "1" pops, its zeros lock on
  const left = ['1', '0', '0', '0', '0'].map((c, i) => ({c, x: tio(f, mul - 10, mul + 14, -500, 330) + i * w}));
  const rStart = 1500, rEnd = 330 + 5 * w - w;
  const right = ['1', '0', '0', '0'].map((c, i) => ({c, x: tio(f, mul, mul + 18, 2300, rStart) + (rEnd - rStart) * lock + i * w}));
  // divide: 1 00000 over 1 00; pairs cancel
  const topZ = 5, botZ = 2;
  const pairT = (i: number) => clamp01((f - div - 24 - i * 2) / 10);
  const settle = tio(f, div + 40, div + 54);
  return (
    <Frame tag="SCIENTIFIC NOTATION"
      html={
        <>
          <SfxList items={[[mul, 'swish', 0.4], [meet + 6, 'clack', 0.9], [meet + 8, 'pop', 0.4], [seven, 'ding', 0.45], [div, 'swish', 0.4],
            [div + 24, 'pop', 0.5], [div + 26, 'pop', 0.5, 1.15], [div + 44, 'clack', 0.5], [sub, 'ding', 0.4]]} />
          <KeySeq x={90} y={90} w={1500} size={80} items={[
            {at: pay, text: 'Multiplying = [[counting.]]'},
            {at: seven, text: '10^{4} × 10^{3} = [[10^{7}]]', sub: 'four zeros + three zeros'},
            {at: add, text: '× → exponents [[add]]'},
            {at: div, text: 'Divide: zeros cancel in [[pairs]]'},
            {at: sub, text: '10^{5} ÷ 10^{2} = [[10^{3}]]', sub: '÷ → exponents subtract'},
          ]} />
          {!phase2 && f >= seven && (
            <div style={{position: 'absolute', left: 0, width: 1920, top: 720, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 96, color: ORANGE, opacity: fin(f, seven)}}>4 + 3 = 7</div>
          )}
        </>
      }
      svg={
        <g>
          {!phase2 && (
            <g opacity={1 - clamp01((f - div + 8) / 8)}>
              {left.map((t, i) => <ZeroTile key={`l${i}`} x={t.x} y={Y} ch={t.c} />)}
              {right.map((t, i) => {
                if (i === 0) {
                  const pop = clamp01((f - meet) / 8);
                  return pop < 1 ? <g key="r0"><ZeroTile x={t.x} y={Y - pop * 40} ch="1" o={1 - pop} s={1 + pop * 0.3} /><Burst x={t.x} y={Y} t={pop} /></g> : null;
                }
                return <ZeroTile key={`r${i}`} x={t.x} y={Y} ch={t.c} glow={lock > 0.95 && f < seven + 20 ? 1 : 0} />;
              })}
            </g>
          )}
          {phase2 && (
            <g opacity={fin(f, div, 8)}>
              <line x1={560} x2={1360} y1={Y} y2={Y} stroke={INK} strokeWidth={6} strokeLinecap="round" />
              {Array.from({length: topZ + 1}).map((_, i) => {
                const isPair = i >= 1 && i <= botZ;
                const t = isPair ? pairT(i - 1) : 0;
                const shift = i > botZ ? -botZ * w * settle : 0;
                return t < 1 ? <g key={`t${i}`}><ZeroTile x={700 + i * w + shift} y={Y - 90} ch={i === 0 ? '1' : '0'} o={1 - t} /><Burst x={700 + i * w} y={Y - 90} t={t} color={ORANGE} /></g> : null;
              })}
              {Array.from({length: botZ + 1}).map((_, i) => {
                const isPair = i >= 1;
                const t = isPair ? pairT(i - 1) : 0;
                const o = i === 0 ? 1 - settle * 0.6 : 1 - t;
                return o > 0 ? <g key={`b${i}`}><ZeroTile x={700 + i * w} y={Y + 90} ch={i === 0 ? '1' : '0'} o={o} /><Burst x={700 + i * w} y={Y + 90} t={t} color={ORANGE} /></g> : null;
              })}
            </g>
          )}
          <AxoSide x={250} y={1010} scale={0.5} rear={f > seven && f < seven + 40 ? 1 : 0} arm={-60} />
        </g>
      }
    />
  );
};

// --------------------------------------------------------------------- adding: dollars and dimes
export const V1Dollars: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const diff = cue('Adding is different', 0.02), dollars = cue('Three dollars', 0.08), dimes = cue('two dimes', 0.12);
  const five = cue('five of anything', 0.18), fuse = cue('Two dimes is', 0.25), match = cue('units match', 0.34);
  const powers = cue('Powers of ten', 0.45), term = cue('Three times ten to the five', 0.52), turn = cue('turn the second', 0.66);
  const done = cue('Three-point-two times', 0.88);
  const fusion = tio(f, fuse + 4, fuse + 22);
  const toTags = tio(f, powers, powers + 16);
  const roll = tio(f, turn + 6, turn + 26);
  const join = tio(f, done - 6, done + 10);
  const bills = [460, 690, 920];
  const coef = roll < 0.5 ? '2' : '0.2';
  const expo = roll < 0.5 ? '4' : '5';
  const rollY = (roll < 0.5 ? roll : roll - 1) * -60;
  return (
    <Frame tag="SCIENTIFIC NOTATION"
      html={
        <>
          <SfxList items={[[dollars, 'swish', 0.35], [dimes, 'tap', 0.6], [dimes + 6, 'tap', 0.6], [five, 'blip', 0.4], [fuse + 6, 'whoosh', 0.3, 1.5],
            [fuse + 22, 'clack', 0.7], [match, 'ding', 0.4], [powers, 'sparkle', 0.4], [turn + 6, 'tick', 0.5], [turn + 16, 'tick', 0.5, 1.2], [done, 'clack', 0.7], [done + 4, 'chime', 0.4]]} />
          <KeySeq x={90} y={90} w={1600} size={78} items={[
            {at: diff, text: 'Adding is [[different.]]'},
            {at: five, text: '$3 + 2 dimes ≠ 5 of anything'},
            {at: match, text: 'Match the units: [[$3.20]]'},
            {at: powers, text: 'Powers of ten are your [[units.]]'},
            {at: done, text: 'Match the exponents, then add.'},
          ]} />
          {f >= term && (
            <div style={{position: 'absolute', left: 0, width: 1920, top: 690, textAlign: 'center', opacity: fin(f, term, 10), fontFamily: DISPLAY, fontWeight: 700, fontSize: 120, color: INK, whiteSpace: 'nowrap'}}>
              {join < 1 ? (
                <span>
                  3 × 10<sup style={{fontSize: '0.55em', verticalAlign: '0.85em', color: ORANGE}}>5</sup>
                  <span style={{color: P.muted, margin: '0 0.3em'}}>+</span>
                  <span style={{display: 'inline-block', overflow: 'hidden', height: '1.15em', verticalAlign: 'bottom'}}>
                    <span style={{display: 'inline-block', transform: `translateY(${rollY}px)`, color: roll > 0 ? TEAL : INK}}>{coef}</span>
                  </span>
                  {' '}× 10<sup style={{fontSize: '0.55em', verticalAlign: '0.85em', color: ORANGE, display: 'inline-block', transform: `translateY(${rollY * 0.5}px)`}}>{expo}</sup>
                </span>
              ) : (
                <span style={{display: 'inline-block', opacity: join, transform: `scale(${0.9 + 0.1 * join})`}}>{rich('[[3.2]] × 10^{5}')}</span>
              )}
            </div>
          )}
        </>
      }
      svg={
        <g>
          {/* faint grid */}
          {Array.from({length: 13}).map((_, i) => <line key={`v${i}`} x1={i * 160} x2={i * 160} y1={0} y2={1080} stroke={INK} strokeOpacity={0.04} />)}
          {Array.from({length: 7}).map((_, i) => <line key={`h${i}`} x1={0} x2={1920} y1={i * 160} y2={i * 160} stroke={INK} strokeOpacity={0.04} />)}
          <g opacity={1 - toTags}>
            {bills.map((x, i) => f >= dollars + i * 3 && <Bill key={i} x={x} y={470} s={0.95} o={fin(f, dollars + i * 3, 6)} />)}
            {f >= dimes && fusion < 1 && [0, 1].map((i) => <Dime key={i} x={1180 + (i ? 120 : 0) - (i ? 120 : 0) * fusion + 60 * fusion * (i ? 1 : 1)} y={470} o={(1 - fusion) * fin(f, dimes + i * 6, 6)} />)}
            {fusion > 0 && <Bill x={1240} y={470} s={0.95} fill={0.2 * fusion} label="$0.2" o={fusion} />}
            {f >= match && <text x={1500} y={490} fontFamily={DISPLAY} fontWeight={700} fontSize={64} fill={TEAL} opacity={fin(f, match)}>= $3.2</text>}
          </g>
          {toTags > 0 && (
            <g opacity={toTags}>
              {[[690, '5'], [1240, '4']].map(([x, e], i) => (
                <g key={i} transform={`translate(${x} 470) scale(${0.6 + 0.4 * toTags})`}>
                  <rect x={-130} y={-60} width={260} height={120} rx={60} fill={PAPER} stroke={ORANGE} strokeWidth={6} />
                  <text y={22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={64} fill={ORANGE}>×10<tspan dy={-26} fontSize={38}>{e}</tspan></text>
                </g>
              ))}
            </g>
          )}
        </g>
      }
    />
  );
};

export const v1a = {V1Black, V1Hook, V1Zeros, V1Tiny, V1ZeroOps, V1Dollars};
void PAPER; void LINE;
