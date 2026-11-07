// Video 2, part C: percentages, probability, square roots, your turn, recap and teaser.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, SfxList, useCue} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, AMBER, RED, clamp01, ease, inOut, tio, tsp, fin, Burst,
  Heads, UnitTag, T, Sp, DieTile, Coin, MiniRing, stag, wobble, MiniRuler,
} from './common';

// ------------------------------------------------------------------ 4a. percent of
export const V2Percent: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const per = cue('per hundred', 0.02), fifteen = cue('Fifteen percent', 0.1), ten = cue('Build it from ten', 0.17), dec = cue('moving the decimal', 0.23);
  const five = cue('Five percent', 0.32), plus = cue('Eight plus four', 0.42), free = cue('A free trick', 0.52), xy = cue('x percent', 0.58);
  const awk = cue('Eight percent of fifty', 0.68), half = cue('Fifty percent of eight', 0.82);
  const X0 = 360, W = 1200, Y = 600, CW = W / 10;
  const barO = fin(f, fifteen, 10) * (1 - fin(f, free - 6, 8));
  const split = fin(f, ten, 12);
  const c0 = fin(f, dec + 10, 8), c1 = fin(f, five + 8, 8), sum = fin(f, plus, 10);
  const swapO = fin(f, awk, 10);
  const sw = tio(f, half - 4, half + 20);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[fifteen, 'slide', 0.35], [ten, 'tick', 0.35], [dec + 10, 'pop', 0.45], [five + 8, 'pop', 0.45, 1.15], [plus, 'ding', 0.35], [free, 'sparkle', 0.3], [half - 4, 'swish', 0.4], [half + 22, 'ding', 0.35]]} />
          <Heads items={[
            {at: per, text: 'Percent = [[per hundred]]'},
            {at: fifteen, text: '15% of 80?'},
            {at: dec, text: '10% = [[8]]'},
            {at: five, text: '5% = half of that = [[4]]'},
            {at: plus, text: '15% = 8 + 4 = [[12]]'},
            {at: free, text: 'A free trick:'},
            {at: xy, text: 'x% of y = [[y% of x]]'},
            {at: half, text: '50% of 8 = [[4]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {barO > 0 && (
            <g opacity={barO}>
              <T x={960} y={Y - 80} size={60}>80</T>
              <rect x={X0} y={Y - 45} width={W} height={90} rx={12} fill={PAPER} stroke={INK} strokeWidth={LINE} />
              {c0 > 0 && <rect x={X0 + 4} y={Y - 41} width={CW - 6} height={82} rx={9} fill={ORANGE} opacity={0.55 * c0} />}
              {c1 > 0 && <rect x={X0 + CW + 2} y={Y - 41} width={CW / 2 - 4} height={82} rx={8} fill={AMBER} opacity={0.6 * c1} />}
              {Array.from({length: 9}).map((_, i) => (
                <line key={i} x1={X0 + CW * (i + 1)} x2={X0 + CW * (i + 1)} y1={Y - 45} y2={Y - 45 + 90 * ease(stag(f, ten, i, 2, 6))} stroke={INK} strokeWidth={3} />
              ))}
              {c1 > 0 && <line x1={X0 + CW * 1.5} x2={X0 + CW * 1.5} y1={Y - 45} y2={Y + 45} stroke={INK} strokeWidth={2} strokeDasharray="6 6" opacity={c1} />}
              {split > 0 && Array.from({length: 10}).map((_, i) => <T key={i} x={X0 + CW * (i + 0.5)} y={Y + 100} size={34} font={SANS} weight={800} color={P.muted} o={stag(f, ten, i, 2, 6)}>8</T>)}
              {c0 > 0 && <T x={X0 + CW / 2} y={Y + 170} size={40} color={ORANGE} o={c0}>10%</T>}
              {c1 > 0 && <T x={X0 + CW * 1.25} y={Y + 220} size={40} color={AMBER} o={c1}>5%</T>}
              {sum > 0 && (
                <g opacity={sum}>
                  <path d={`M ${X0} ${Y - 60} L ${X0} ${Y - 80} L ${X0 + CW * 1.5} ${Y - 80} L ${X0 + CW * 1.5} ${Y - 60}`} fill="none" stroke={ORANGE} strokeWidth={5} />
                  <UnitTag x={X0 + CW * 0.75} y={Y - 125} text="12" color={ORANGE} s={tsp(f, plus, plus + 14, 0.6, 1)} />
                </g>
              )}
            </g>
          )}
          {swapO > 0 && (
            <g opacity={swapO}>
              {/* the two numbers slide past each other */}
              <T x={540 + (1080 - 540) * sw} y={650 - 90 * Math.sin(sw * Math.PI)} size={130} color={ORANGE}>8</T>
              <T x={1080 + (540 - 1080) * sw} y={650 + 90 * Math.sin(sw * Math.PI)} size={130} color={TEAL}>50</T>
              <T x={660} y={650} size={80} color={P.muted}>%</T>
              <T x={830} y={640} size={56} font={SANS} weight={800} color={P.muted}>of</T>
              <T x={1380} y={650} size={120} o={fin(f, half + 20, 8)}>= 4</T>
              <T x={960} y={860} size={36} font={SANS} weight={800} color={P.muted} o={fin(f, half + 26, 8)}>(8% of 50 is also 4)</T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 4b. percent change and the trap
export const V2PctChange: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const change = cue('Percent change', 0.02), newOld = cue('New minus old', 0.09), forty = cue('Forty to fifty', 0.16), tf = cue('twenty-five percent', 0.25);
  const always = cue('Always divide', 0.3), trap = cue('classic trap', 0.38), rises = cue('rises fifty', 0.44), falls = cue('falls fifty', 0.5);
  const back = cue('Are you back', 0.56), hundred = cue('A hundred goes', 0.64), halfOf = cue('Half of a hundred', 0.74), second = cue('second percentage', 0.86);
  const formO = fin(f, newOld, 10) * (1 - fin(f, trap - 6, 8));
  const grow = tsp(f, forty + 8, forty + 26, 40, 50);
  const detach = tio(f, forty + 34, forty + 56);
  const B = 940, S = 8; // bar baseline and px per unit
  const tfO = fin(f, tf, 8);
  // the trap: 100 -> 150 -> 75
  const trapO = fin(f, trap, 10);
  const b1 = tsp(f, hundred, hundred + 18, 100, 150);
  const b2 = tsp(f, halfOf, halfOf + 18, 150, 75);
  const pulse = f > halfOf + 20 && f < halfOf + 40 ? Math.sin(((f - halfOf - 20) / 20) * Math.PI) : 0;
  const take = f > back + 4 && f < back + 26 ? (Math.floor((f - back - 4) / 7) % 2 ? 1 : -1) : -1;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[newOld, 'tap', 0.3], [forty + 8, 'boing', 0.35], [forty + 34, 'swish', 0.35], [forty + 56, 'thud', 0.4], [tf, 'ding', 0.35], [trap, 'blip', 0.35, 0.7],
            [hundred, 'rise', 0.35], [halfOf, 'slide', 0.4, 0.7], [halfOf + 20, 'thud', 0.5], [back + 4, 'swish', 0.3, 1.4], [back + 11, 'swish', 0.3, 1.5]]} />
          <Heads items={[
            {at: change, text: 'Percent [[change]]'},
            {at: newOld, text: '(new − old) ÷ [[old]]'},
            {at: forty, text: '40 → 50'},
            {at: tf, text: '10 ÷ 40 = [[25%]]'},
            {at: always, text: 'Divide by the [[starting]] value.'},
            {at: trap, text: 'The classic [[trap]]'},
            {at: rises, text: 'Up 50%, then down 50%'},
            {at: back, text: 'Back where you started?'},
            {at: hundred, text: '100 → 150 → [[75]]'},
            {at: second, text: 'The second % came from a [[bigger]] number.'},
          ]} />
        </>
      }
      svg={
        <g>
          {formO > 0 && (
            <g opacity={formO}>
              {/* the bar grows from 40 to 50; the extra 10 drops onto a copy of the 40 */}
              <line x1={500} x2={1420} y1={B} y2={B} stroke={INK} strokeWidth={4} />
              <rect x={640} y={B - 40 * S} width={180} height={40 * S} rx={8} fill={TEAL} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} opacity={fin(f, forty, 8)} />
              {grow > 40 && detach < 1 && (
                <rect x={640 + (1100 - 640) * detach} y={B - grow * S + (40 * S - 10 * S) * ease(detach) * 0 + (grow * S - 10 * S) * 0 + (B - 10 * S - (B - grow * S)) * ease(detach)} width={180} height={(grow - 40) * S} rx={8}
                      fill={ORANGE} fillOpacity={0.55} stroke={INK} strokeWidth={4} />
              )}
              <T x={730} y={B + 50} size={40} font={SANS} weight={800} o={fin(f, forty, 8)}>{f >= forty + 8 ? '50' : '40'}</T>
              {f >= forty + 30 && (
                <g opacity={fin(f, forty + 30, 8)}>
                  <rect x={1100} y={B - 40 * S} width={180} height={40 * S} rx={8} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 8" />
                  <T x={1190} y={B + 50} size={36} font={SANS} weight={800} color={P.muted}>start: 40</T>
                </g>
              )}
              {detach >= 1 && <rect x={1100} y={B - 10 * S} width={180} height={10 * S} rx={8} fill={ORANGE} fillOpacity={0.55} stroke={INK} strokeWidth={4} />}
              {tfO > 0 && <UnitTag x={1190} y={B - 40 * S - 60} text="¼ = 25%" color={ORANGE} s={tsp(f, tf, tf + 14, 0.6, 1)} />}
            </g>
          )}
          {trapO > 0 && (
            <g opacity={trapO}>
              <line x1={420} x2={1500} y1={B} y2={B} stroke={INK} strokeWidth={4} />
              <rect x={520} y={B - 100 * 3.6} width={200} height={100 * 3.6} rx={10} fill={TEAL} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} />
              <T x={620} y={B + 52} size={44}>100</T>
              {f >= hundred && (
                <g>
                  <rect x={860} y={B - b1 * 3.6} width={200} height={b1 * 3.6} rx={10} fill={ORANGE} fillOpacity={0.3} stroke={INK} strokeWidth={LINE} />
                  <T x={960} y={B + 52} size={44}>{Math.round(b1)}</T>
                  <UnitTag x={790} y={B - 420} text="+50%" color={ORANGE} s={0.8} />
                </g>
              )}
              {f >= halfOf && (
                <g>
                  <rect x={1200} y={B - b2 * 3.6} width={200} height={b2 * 3.6} rx={10} fill={pulse > 0 ? RED : AMBER} fillOpacity={0.3 + 0.3 * pulse} stroke={INK} strokeWidth={LINE} />
                  <T x={1300} y={B + 52} size={44} color={f > halfOf + 20 ? RED : INK}>{Math.round(b2)}</T>
                  <UnitTag x={1130} y={B - 600} text="−50% of 150" color={AMBER} s={0.8} />
                </g>
              )}
              {/* the 100 line shows the shortfall */}
              <line x1={500} x2={1440} y1={B - 360} y2={B - 360} stroke={f > halfOf + 20 ? RED : P.muted} strokeWidth={4} strokeDasharray="12 10" />
              <AxoSide x={1700} y={980} scale={0.6} rear={1} dir={take as 1 | -1} arm={-40} sweat={f > halfOf + 20} />
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 5a. probability: and = multiply
export const V2Prob: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const frac = cue('Probability is a fraction', 0.02), face = cue('One face', 0.2), sixth = cue('one-sixth', 0.28), and = cue('means multiply', 0.38);
  const heads = cue('Heads on a coin', 0.5), twelfth = cue('one-twelfth', 0.66), grid = cue('Picture a grid', 0.74), halfOf = cue('Take half', 0.82), sixthOf = cue('a sixth of that', 0.9);
  const dieO = fin(f, face - 6, 10) * (1 - fin(f, and - 4, 8));
  const gridO = fin(f, and, 10);
  const rowLit = Math.max(fin(f, heads + 8, 8) * (1 - fin(f, grid, 8)), fin(f, halfOf, 8));
  const cellLit = Math.max(fin(f, twelfth - 10, 8) * (1 - fin(f, grid, 8)), fin(f, sixthOf, 8));
  // camera: zoom into the heads row, then the cell, then pull back to the whole grid
  const C = 170, GX = 960 - 3 * C, GY = 560;
  const zRow = f < grid ? 0 : tio(f, halfOf, halfOf + 16), zCell = f < grid ? 0 : tio(f, sixthOf, sixthOf + 16), back = tio(f, sixthOf + 26, sixthOf + 54);
  const z = (1 + 0.35 * zRow + 0.55 * zCell) * (1 - back) + back;
  const fx = (960 + (GX + 5.5 * C - 960) * zCell) * (1 - back) + 960 * back;
  const fy = ((GY + C) + (GY + C / 2 - (GY + C)) * zRow) * (1 - back) + (GY + C) * back;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[face, 'clack', 0.4], [sixth, 'pop', 0.35], [and, 'slide', 0.35], [heads + 8, 'sparkle', 0.3], [twelfth - 10, 'pop', 0.45], [halfOf, 'whoosh', 0.3, 1.3], [sixthOf + 26, 'whoosh', 0.3, 0.9], [sixthOf + 54, 'ding', 0.35]]} />
          <Heads items={[
            {at: frac, text: 'Probability = [[wanted ÷ all]]'},
            {at: face, text: 'One face of six: [[1/6]]'},
            {at: and, text: '"And" means [[multiply]]'},
            {at: heads, text: 'Heads [[and]] a six'},
            {at: twelfth, text: '½ × ⅙ = [[1/12]]'},
            {at: grid, text: 'Picture a grid.'},
            {at: halfOf, text: 'Half of it…'},
            {at: sixthOf, text: '…then a sixth of that: [[1/12]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {dieO > 0 && (
            <g opacity={dieO}>
              {[1, 2, 3, 4, 5, 6].map((n, i) => (
                <DieTile key={n} x={410 + i * 220} y={620} n={n} size={150} fill={n === 6 && f > sixth ? ORANGE : PAPER} s={tsp(f, face + i * 2, face + i * 2 + 12, 0.5, 1)} />
              ))}
              <T x={960} y={850} size={90} color={ORANGE} o={fin(f, sixth, 8)}>1 / 6</T>
            </g>
          )}
          {gridO > 0 && (
            <g opacity={gridO} transform={`translate(960 ${GY + C}) scale(${z}) translate(${-fx} ${-fy})`}>
              {[0, 1].map((r) => [1, 2, 3, 4, 5, 6].map((n, c) => {
                const lit = r === 0 ? rowLit : 0;
                const cell = r === 0 && n === 6 ? cellLit : 0;
                return (
                  <g key={`${r}${n}`}>
                    <rect x={GX + c * C + 4} y={GY + r * C + 4} width={C - 8} height={C - 8} rx={14} fill={cell > 0 ? ORANGE : TEAL}
                          fillOpacity={cell > 0 ? 0.6 * cell + 0.25 * lit : 0.08 + 0.25 * lit} stroke={INK} strokeWidth={3} />
                    <DieTile x={GX + c * C + C / 2 + 26} y={GY + r * C + C / 2 + 26} n={n} size={50} />
                    <Coin x={GX + c * C + 46} y={GY + r * C + 46} ch={r === 0 ? 'H' : 'T'} r={24} />
                  </g>
                );
              }))}
              <T x={GX - 40} y={GY + 100} size={36} font={SANS} weight={800} anchor="end" color={P.muted}>½</T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 5b. or = add, minus the overlap
export const V2Or: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const or = cue('means add', 0.03), two3 = cue('two or a three', 0.1), third = cue('one-third', 0.2), over = cue('if they can overlap', 0.28);
  const even = cue('Even, or greater', 0.4), whole = cue('is a whole', 0.52), both = cue('on both lists', 0.62), sub = cue('Subtract the overlap', 0.72);
  const leaves = cue('That leaves', 0.84), tt = cue('two-thirds', 0.93);
  const first = f < even - 4;
  const lit23 = fin(f, two3 + 6, 8) * (1 - fin(f, even - 6, 8));
  const ev = fin(f, even + 6, 8), gt = fin(f, even + 22, 8);
  const red = f > whole && f < whole + 30 ? Math.sin(((f - whole) / 30) * Math.PI) : 0;
  const ovPulse = f > both && f < both + 30 ? 1 + 0.12 * Math.sin(((f - both) / 30) * Math.PI * 3) : 1;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[two3 + 6, 'pop', 0.4], [third, 'ding', 0.3], [even + 6, 'pop', 0.35], [even + 22, 'pop', 0.35, 1.2], [whole, 'blip', 0.5, 0.45], [both, 'sparkle', 0.3], [sub, 'swish', 0.35], [tt, 'ding', 0.4]]} />
          <Heads items={[
            {at: or, text: '"Or" means [[add]]'},
            {at: two3, text: 'A 2 or a 3'},
            {at: third, text: '⅙ + ⅙ = [[⅓]]'},
            {at: over, text: 'If they overlap, [[subtract]] it.'},
            {at: even, text: 'Even, or greater than 3?'},
            {at: whole, text: '3/6 + 3/6 = 1 [[?]]'},
            {at: both, text: '4 and 6 are on [[both]] lists'},
            {at: sub, text: '6/6 − 2/6 = 4/6'},
            {at: tt, text: '= [[⅔]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const x = 410 + i * 220, y = 600;
            const isEven = n % 2 === 0, isGt = n > 3, both2 = isEven && isGt;
            let fill = PAPER;
            if (first && (n === 2 || n === 3) && lit23 > 0) fill = TEAL;
            if (!first) fill = both2 && gt > 0 ? '#ffffff' : isEven && ev > 0 ? AMBER : isGt && gt > 0 ? TEAL : PAPER;
            const s = both2 && !first ? ovPulse : 1;
            return (
              <g key={n}>
                {both2 && !first && gt > 0 && <rect x={x - 88 * s} y={y - 88 * s} width={176 * s} height={176 * s} rx={30} fill="none" stroke={AMBER} strokeWidth={6} />}
                <DieTile x={x} y={y} n={n} size={150} s={s} fill={fill} />
                {!first && isEven && <rect x={x - 60} y={y + 100} width={120} height={12} rx={6} fill={AMBER} opacity={ev} />}
                {!first && isGt && <rect x={x - 60} y={y - 112} width={120} height={12} rx={6} fill={TEAL} opacity={gt} />}
              </g>
            );
          })}
          {first && <T x={960} y={870} size={80} color={TEAL} o={fin(f, third, 8) * (1 - fin(f, even - 6, 8))}>1/6 + 1/6 = 1/3</T>}
          {!first && (
            <g>
              <text x={1510} y={760} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={30} fill={AMBER} opacity={ev}>even</text>
              <text x={1510} y={470} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={30} fill={TEAL} opacity={gt}>greater than 3</text>
              {f >= whole && f < sub && <T x={960} y={900} size={80} color={red > 0 ? RED : INK}>3/6 + 3/6 = 6/6</T>}
              {red > 0 && <rect x={560} y={830} width={800} height={100} rx={20} fill={RED} opacity={0.12 * red} />}
              {f >= sub && <T x={960} y={900} size={80} o={fin(f, sub, 8)}>{f >= leaves ? (f >= tt ? '= 4/6 = 2/3' : '= 4/6') : '6/6 − 2/6'}</T>}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 5c. at least one = 1 − none
export const V2AtLeast: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const trick = cue('One more trick', 0.02), minus = cue('one minus', 0.15), three = cue('At least one head', 0.35), fail = cue('only way to fail', 0.55);
  const eighth = cue('one-eighth', 0.7), seven = cue('seven-eighths', 0.88);
  const lv = [tsp(f, three, three + 14, 0, 1), tsp(f, three + 12, three + 26, 0, 1), tsp(f, three + 24, three + 38, 0, 1)];
  const ys = [380, 540, 700, 860];
  const xsAt = (level: number, i: number) => 960 + (i - (Math.pow(2, level) - 1) / 2) * (1600 / Math.pow(2, level));
  const dead = fin(f, fail + 10, 10), glow = fin(f, seven, 8);
  const labels = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
  return (
    <Frame
      html={
        <>
          <SfxList items={[[three, 'pop', 0.3], [three + 12, 'pop', 0.3, 1.1], [three + 24, 'pop', 0.3, 1.2], [fail + 10, 'thud', 0.4], [seven, 'chime', 0.35]]} />
          <Heads items={[
            {at: trick, text: 'One more trick.'},
            {at: minus, text: '"At least one" = 1 − [[none]]'},
            {at: three, text: 'At least one head in 3 flips?'},
            {at: fail, text: 'Fail only with TTT: [[1/8]]'},
            {at: seven, text: '1 − ⅛ = [[⅞]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {f >= three - 4 && <Coin x={960} y={ys[0]} ch="?" r={30} o={fin(f, three - 4, 6)} />}
          {[1, 2, 3].map((level) => Array.from({length: Math.pow(2, level)}).map((_, i) => {
            const k = lv[level - 1];
            if (k <= 0) return null;
            const px = xsAt(level - 1, Math.floor(i / 2)), py = ys[level - 1];
            const x = px + (xsAt(level, i) - px) * k, y = py + (ys[level] - py) * k;
            const leaf = level === 3;
            const isDead = leaf && i === 7;
            const col = leaf ? (isDead ? (dead > 0 ? P.muted : INK) : glow > 0 ? TEAL : INK) : INK;
            return (
              <g key={`${level}${i}`}>
                <line x1={px} y1={py + 30} x2={x} y2={y - 30} stroke={isDead && dead > 0 ? P.muted : INK} strokeWidth={3} opacity={0.6} />
                <Coin x={x} y={y} ch={i % 2 ? 'T' : 'H'} r={level === 3 ? 30 : 28} fill={leaf && !isDead && glow > 0 ? '#e6f6f3' : PAPER} color={col} o={isDead ? 1 - 0.5 * dead : 1} />
                {leaf && <text x={x} y={y + 64} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={col} opacity={k}>{labels[i]}</text>}
              </g>
            );
          }))}
          {f >= seven && <UnitTag x={960} y={990} text="7 / 8" color={TEAL} s={1.3 * tsp(f, seven, seven + 14, 0.6, 1)} />}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 6a. perfect squares, and √50
const SQ_NAMES = ['one', 'four', 'nine', 'sixteen', 'twenty-five', 'thirty-six', 'forty-nine', 'sixty-four', 'eighty-one', 'hundred'];

export const V2Roots: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = props;
  const cue = useCue(props);
  const roots = cue('Square roots', 0.01), asks = cue('what number times itself', 0.06), learn = cue('learn your perfect squares', 0.12);
  const listStart = cue('up to a hundred', 0.15);
  const at: number[] = [];
  let after = listStart / fps + 0.3;
  SQ_NAMES.forEach((n, i) => {
    const t = cue(n, 0.18 + i * 0.025, after);
    at.push(t);
    after = t / fps + 0.05;
  });
  const sand = cue('sandwiches', 0.48), fifty = cue('root of fifty', 0.56), sits = cue('sits between', 0.64), b78 = cue('between seven and eight', 0.72);
  const barely = cue('barely past', 0.82), about = cue('seven-point-one', 0.93);
  const S = 18, GAP = 26, BASE = 780;
  const xs: number[] = [];
  let x = 960 - (S * 55 + GAP * 9) / 2;
  for (let n = 1; n <= 10; n++) { xs.push(x); x += S * n + GAP; }
  const zoom = tio(f, fifty, fifty + 26);
  const nl = fin(f, b78, 10);
  const mark = f < barely ? tio(f, b78 + 6, b78 + 26, 7.5, 7.5) : tsp(f, barely, barely + 24, 7.5, 7.07);
  const NX = (v: number) => 760 + (v - 7) * 400;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[asks, 'tap', 0.3], ...at.map((t, i) => [t, 'pop', 0.28, 0.9 + i * 0.05] as [number, 'pop', number, number]), [sand, 'tick', 0.3], [fifty, 'whoosh', 0.3, 1.2],
            [sits, 'slide', 0.35], [barely, 'slide', 0.35, 1.2], [about, 'ding', 0.4]]} />
          <Heads items={[
            {at: roots, text: 'Square roots'},
            {at: asks, text: 'What number [[times itself]] gives this?'},
            {at: learn, text: 'Learn the perfect squares'},
            {at: sand, text: 'Every estimate [[sandwiches]] between two.'},
            {at: fifty, text: '√50 ?'},
            {at: b78, text: 'Between [[7]] and [[8]]'},
            {at: barely, text: '50 is barely past 49'},
            {at: about, text: '√50 ≈ [[7.1]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {/* the row of perfect squares, each one the last plus an L-shaped strip */}
          <g opacity={1 - zoom}>
            {xs.map((x0, i) => {
              const n = i + 1, t = at[i];
              const g = tsp(f, t, t + 10, 0, 1);
              if (g <= 0) return null;
              const side = S * ((n - 1) + g);
              return (
                <g key={n}>
                  {n > 1 && <rect x={x0} y={BASE - S * (n - 1)} width={S * (n - 1)} height={S * (n - 1)} fill={TEAL} fillOpacity={0.2} />}
                  <rect x={x0} y={BASE - side} width={side} height={side} fill={ORANGE} fillOpacity={n > 1 ? 0.25 : 0.4} stroke={INK} strokeWidth={3} />
                  <T x={x0 + (S * n) / 2} y={BASE + 50} size={34} font={SANS} weight={800} o={fin(f, t, 6)}>{n * n}</T>
                </g>
              );
            })}
          </g>
          {zoom > 0 && (
            <g opacity={zoom}>
              {[[7, 520, TEAL], [8, 1400, TEAL]].map(([n, cx]) => {
                const side = (n as number) * 30;
                return (
                  <g key={n as number}>
                    <rect x={(cx as number) - side / 2} y={720 - side} width={side} height={side} fill={TEAL} fillOpacity={0.18} stroke={INK} strokeWidth={LINE} />
                    <T x={cx as number} y={720 - side / 2 + 20} size={54}>{(n as number) * (n as number)}</T>
                  </g>
                );
              })}
              {/* the area-50 square slides in between */}
              {f >= sits && (() => {
                const side = Math.sqrt(50) * 30, cx = tsp(f, sits, sits + 20, 1900, 960);
                return (
                  <g>
                    <rect x={cx - side / 2} y={720 - side} width={side} height={side} fill={ORANGE} fillOpacity={0.3} stroke={INK} strokeWidth={LINE} />
                    <T x={cx} y={720 - side / 2 + 20} size={54} color={INK}>50</T>
                  </g>
                );
              })()}
              {nl > 0 && (
                <g opacity={nl}>
                  <line x1={NX(6.6)} x2={NX(8.4)} y1={880} y2={880} stroke={INK} strokeWidth={4} />
                  {[7, 8].map((v) => <g key={v}><line x1={NX(v)} x2={NX(v)} y1={862} y2={898} stroke={INK} strokeWidth={4} /><T x={NX(v)} y={950} size={44}>{v}</T></g>)}
                  {[7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9].map((v) => <line key={v} x1={NX(v)} x2={NX(v)} y1={872} y2={888} stroke={INK} strokeWidth={2} />)}
                  <path d={`M ${NX(mark)} 850 l -14 -22 l 28 0 Z`} fill={ORANGE} />
                  {f >= about && <UnitTag x={NX(mark)} y={790} text="≈ 7.1" color={ORANGE} />}
                </g>
              )}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 6b. √2, √3, and roots of powers of ten
export const V2Roots2: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const two = cue('Memorize two more', 0.02), r2 = cue('square root of two', 0.07), r3 = cue('square root of three', 0.15), tri = cue('in triangles', 0.24);
  const halve = cue('halve the exponent', 0.33), four = cue('root of four', 0.4), twoT = cue('two times ten', 0.5), odd = cue('exponent is odd', 0.58);
  const nine = cue('nine times ten', 0.66), ninety = cue('ninety times ten', 0.76), gives = cue('which gives', 0.86);
  const geoO = fin(f, two, 10) * (1 - fin(f, halve - 6, 8));
  const swing = tio(f, r2 + 6, r2 + 30);
  const ang = -45 * (1 - swing);
  const L = 200 * Math.SQRT2;
  const ex = 600 + L * Math.cos((ang * Math.PI) / 180), ey = 800 + L * Math.sin((ang * Math.PI) / 180);
  const sciO = fin(f, halve, 10);
  const split = tio(f, twoT - 4, twoT + 16);
  const oddO = fin(f, odd, 10);
  const borrow = tio(f, ninety - 2, ninety + 18);
  const half2 = tio(f, gives, gives + 18);
  const wob = wobble(f, odd + 4, 8, 26);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[r2 + 6, 'swish', 0.35], [r2 + 30, 'clack', 0.45], [r3, 'tick', 0.4], [halve, 'slide', 0.35], [twoT - 4, 'pop', 0.45], [odd + 4, 'boing', 0.35], [ninety - 2, 'slide', 0.35, 1.2], [gives, 'pop', 0.45], [gives + 20, 'ding', 0.35]]} />
          <Heads items={[
            {at: two, text: 'Two more to know:'},
            {at: r2, text: '√2 ≈ [[1.4]]'},
            {at: r3, text: '√3 ≈ [[1.7]]'},
            {at: tri, text: '(You\'ll meet them in triangles.)'},
            {at: halve, text: 'Powers of ten: [[halve]] the exponent'},
            {at: four, text: '√(4 × 10^{6})'},
            {at: twoT, text: '= [[2 × 10^{3}]]'},
            {at: odd, text: 'Odd exponent? [[Borrow]] a ten.'},
            {at: ninety, text: '9 × 10^{5} = 90 × 10^{4}'},
            {at: gives, text: '√(90 × 10^{4}) ≈ [[9.5 × 10^{2}]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {geoO > 0 && (
            <g opacity={geoO}>
              <line x1={540} x2={1400} y1={800} y2={800} stroke={INK} strokeWidth={4} />
              {[0, 1, 2].map((v) => <g key={v}><line x1={600 + v * 200} x2={600 + v * 200} y1={784} y2={816} stroke={INK} strokeWidth={4} /><T x={600 + v * 200} y={870} size={40}>{v}</T></g>)}
              <rect x={600} y={600} width={200} height={200} fill={TEAL} fillOpacity={0.15} stroke={INK} strokeWidth={LINE} />
              <T x={700} y={580} size={32} font={SANS} weight={800} color={P.muted}>1</T>
              <line x1={600} y1={800} x2={ex} y2={ey} stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
              {swing > 0 && <path d={`M ${600 + L * Math.cos(-Math.PI / 4)} ${800 + L * Math.sin(-Math.PI / 4)} A ${L} ${L} 0 0 1 ${ex} ${ey}`} fill="none" stroke={ORANGE} strokeWidth={3} strokeDasharray="6 8" />}
              {swing >= 1 && <UnitTag x={600 + L} y={720} text="√2 ≈ 1.41" color={ORANGE} s={tsp(f, r2 + 30, r2 + 44, 0.6, 1)} />}
              {f >= r3 && (
                <g opacity={fin(f, r3, 8)}>
                  <line x1={600 + 200 * Math.sqrt(3)} x2={600 + 200 * Math.sqrt(3)} y1={780} y2={820} stroke={TEAL} strokeWidth={6} />
                  <UnitTag x={600 + 200 * Math.sqrt(3) + 90} y={640} text="√3 ≈ 1.73" color={TEAL} />
                </g>
              )}
            </g>
          )}
          {sciO > 0 && f < odd && (
            <g opacity={sciO * (1 - fin(f, odd - 6, 6))}>
              <T x={1010} y={620} size={110} anchor="end">√(4 × 10</T>
              <T x={1006} y={560} size={70} anchor="start" color={ORANGE} o={1 - split}>6</T>
              <T x={1090} y={620} size={110} anchor="start">)</T>
              {split > 0 && (
                <g>
                  <T x={1006} y={560} size={70} anchor="start" color={ORANGE} o={1 - 0.6 * split}>3</T>
                  <T x={1006} y={560 + 260 * split} size={70} anchor="start" color={ORANGE}>3</T>
                  <T x={1010} y={880} size={110} anchor="end" o={split}>= 2 × 10</T>
                </g>
              )}
            </g>
          )}
          {oddO > 0 && (
            <g opacity={oddO} transform={`translate(${wob} 0)`}>
              <T x={680} y={620} size={110} anchor="end">√(</T>
              <T x={830} y={620} size={110} anchor="end" color={borrow > 0.5 ? TEAL : INK}>{borrow > 0.5 ? '90' : '9'}</T>
              <T x={860} y={620} size={110} anchor="start">× 10</T>
              <T x={1096} y={560} size={70} anchor="start" color={borrow > 0.5 ? TEAL : RED}>{borrow > 0.5 ? '4' : '5'}</T>
              <T x={1170} y={620} size={110} anchor="start">)</T>
              {half2 > 0 && <T x={960} y={880} size={110} o={half2}>≈ 9.5 × 10<Sp>2</Sp></T>}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 7a. your turn
const CARD_X = [330, 960, 1590];
const Card: React.FC<{i: number; o: number; dy: number; title: string; children: React.ReactNode}> = ({i, o, dy, title, children}) => (
  <g opacity={o} transform={`translate(${CARD_X[i]} ${640 + dy})`}>
    <rect x={-270} y={-230} width={540} height={460} rx={26} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
    <rect x={-270} y={-230} width={540} height={70} rx={26} fill={INK} />
    <rect x={-270} y={-180} width={540} height={20} fill={INK} />
    <text x={-240} y={-183} fontFamily={SANS} fontWeight={800} fontSize={30} letterSpacing={3} fill={PAPER}>{title}</text>
    {children}
  </g>
);

export const V2TurnQ: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = props;
  const cue = useCue(props);
  const turn = cue('Your turn', 0.01), q1 = cue('One how many', 0.08), q2 = cue('Two a force', 0.3), q3 = cue('Three whats', 0.55);
  const q1e = q2 - 4, q2e = q3 - 4, q3e = Math.min(D - 5 * fps, q3 + Math.round(3.2 * fps));
  const ring = (start: number) => clamp01((f - start) / (5 * fps));
  const cards = [q1, q2, q3].map((t) => tsp(f, t, t + 16, 0, 1));
  return (
    <Frame
      html={
        <>
          <SfxList items={[[q1, 'whoosh', 0.3, 1.2], [q2, 'whoosh', 0.3, 1.3], [q3, 'whoosh', 0.3, 1.4],
            ...[q3e, q3e + fps, q3e + 2 * fps, q3e + 3 * fps, q3e + 4 * fps].map((t, k) => [t, k % 2 ? 'tock' : 'tick', 0.3] as [number, 'tick' | 'tock', number]), [q3e + 5 * fps, 'ding', 0.4]]} />
          <Heads items={[{at: turn, text: 'Your turn: [[three]] quick ones'}]} />
        </>
      }
      svg={
        <g>
          <Card i={0} o={cards[0]} dy={80 * (1 - cards[0])} title="1 · UNITS">
            <T x={0} y={-60} size={70}>2 L of water</T>
            <T x={0} y={30} size={70}>= ? kg</T>
            <T x={0} y={120} size={32} font={SANS} weight={700} color={P.muted}>1 mL weighs 1 g</T>
            <MiniRing x={190} y={160} r={42} frac={1 - ring(q1e)} label={String(Math.min(5, Math.max(0, 5 - Math.floor((f - q1e) / fps))))} />
          </Card>
          <Card i={1} o={cards[1]} dy={80 * (1 - cards[1])} title="2 · SCALING">
            <T x={-60} y={-40} size={80}>F ∝ q/r<Sp>2</Sp></T>
            <T x={0} y={50} size={44} font={SANS} weight={800} color={ORANGE}>q ×2,  r ×3</T>
            <T x={0} y={130} size={60}>F × ?</T>
            <MiniRing x={190} y={160} r={42} frac={1 - ring(q2e)} label={String(Math.min(5, Math.max(0, 5 - Math.floor((f - q2e) / fps))))} />
          </Card>
          <Card i={2} o={cards[2]} dy={80 * (1 - cards[2])} title="3 · ROOTS">
            <T x={0} y={20} size={120}>√80 ≈ ?</T>
            <MiniRing x={190} y={160} r={42} frac={1 - ring(q3e)} label={String(Math.min(5, Math.max(0, 5 - Math.floor((f - q3e) / fps))))} />
          </Card>
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 7b. answers
export const V2TurnA: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const ans = cue('Answers', 0.02), l = cue('Two liters is', 0.08), g = cue('two thousand grams', 0.24), kg = cue('two kilograms', 0.34);
  const force = cue('force gets multiplied', 0.44), r = cue('root of eighty', 0.66), under = cue('just under nine', 0.78), p89 = cue('eight-point-nine', 0.9);
  const chain = ['2 L', '2000 mL', '2000 g', '2 kg'];
  const step = f < l + 20 ? 0 : f < g ? 1 : f < kg ? 2 : 3;
  const merge = tio(f, force + 10, force + 30);
  const mark = tsp(f, under, under + 22, 8.5, 8.94);
  const NX = (v: number) => (v - 8.5) * 400;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[l + 20, 'pop', 0.4], [g, 'pop', 0.4, 1.1], [kg, 'ding', 0.35], [force + 30, 'clack', 0.5], [under, 'slide', 0.35], [p89, 'ding', 0.35]]} />
          <Heads items={[{at: ans, text: 'Answers'}]} />
        </>
      }
      svg={
        <g>
          <Card i={0} o={1} dy={0} title="1 · UNITS">
            {chain.map((c, k) => (
              <g key={c} opacity={k <= step ? (k === step ? 1 : 0.35) : 0}>
                <UnitTag x={0} y={-110 + k * 80} text={c} color={k === 3 ? TEAL : INK} s={k === step ? tsp(f, [l, l + 20, g, kg][k], [l, l + 20, g, kg][k] + 12, 0.7, 1.1) : 0.9} />
              </g>
            ))}
          </Card>
          <Card i={1} o={1} dy={0} title="2 · SCALING">
            {merge < 1 && (
              <g opacity={1 - merge}>
                <UnitTag x={-110 + 110 * merge} y={0} text="×2" color={ORANGE} />
                <UnitTag x={110 - 110 * merge} y={0} text="×1/9" color={AMBER} />
              </g>
            )}
            {merge > 0 && <UnitTag x={0} y={0} text="×2/9" color={TEAL} s={1.4 * tsp(f, force + 26, force + 40, 0.6, 1)} o={merge} />}
          </Card>
          <Card i={2} o={1} dy={0} title="3 · ROOTS">
            <g opacity={fin(f, r, 8)}>
              <line x1={NX(7.9)} x2={NX(9.1)} y1={40} y2={40} stroke={INK} strokeWidth={4} />
              {[8, 9].map((v) => <g key={v}><line x1={NX(v)} x2={NX(v)} y1={22} y2={58} stroke={INK} strokeWidth={4} /><T x={NX(v)} y={110} size={40}>{v}</T></g>)}
              <T x={NX(8)} y={-30} size={30} font={SANS} weight={800} color={P.muted}>√64</T>
              <T x={NX(9)} y={-30} size={30} font={SANS} weight={800} color={P.muted}>√81</T>
              {f >= under && <path d={`M ${NX(mark)} 14 l -12 -20 l 24 0 Z`} fill={ORANGE} />}
              {f >= p89 && <UnitTag x={NX(8.94) - 40} y={170} text="≈ 8.9" color={ORANGE} />}
            </g>
          </Card>
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 7c. recap and the teaser
export const V2Recap: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const recap = cue('Recap', 0.01), pre = cue('Prefixes are', 0.05), conv = cue('Conversions multiply', 0.14), units = cue('Units catch', 0.25), track = cue('Track multipliers', 0.33);
  const pct = cue('Percent change divides', 0.42), and = cue('And means multiply', 0.52), or = cue('Or means add', 0.58), roots = cue('Square roots sandwich', 0.66);
  const next = cue('Next time', 0.78), bend = cue('rulers that bend', 0.9);
  const beats = [pre, conv, units, track, pct, and, or, roots, next];
  const vis = (i: number) => fin(f, beats[i], 8) * (1 - fin(f, beats[i + 1] - 4, 6));
  const tilt = tio(f, next + 10, next + 34);
  const legs = fin(f, next + 34, 14);
  const tap = bend + 26;
  const snapAt = D - 10;
  const black = f >= snapAt;
  const cx = 960, cy = 700;
  return (
    <Frame exit="cut"
      html={
        <>
          <SfxList items={[...beats.map((t) => [t, 'pop', 0.3, 1.1] as [number, 'pop', number, number]), [next + 10, 'slide', 0.35], [tap, 'tap', 0.5], [snapAt, 'clack', 0.8]]} />
          <Heads size={68} items={[
            {at: recap, text: 'Recap'},
            {at: pre, text: 'Prefixes are [[counts of tens.]]'},
            {at: conv, text: 'Conversions [[multiply by one.]]'},
            {at: units, text: 'Units catch [[wrong formulas.]]'},
            {at: track, text: 'Track [[multipliers]], not numbers.'},
            {at: pct, text: 'Percent change: divide by the [[start.]]'},
            {at: and, text: '"And" means [[multiply.]]'},
            {at: or, text: '"Or" means add, [[minus the overlap.]]'},
            {at: roots, text: 'Roots [[sandwich]] between squares.'},
            {at: next, text: 'Next: angles, triangles, [[bent rulers.]]'},
          ]} />
          {black && <div style={{position: 'absolute', inset: -200, background: INK}} />}
        </>
      }
      svg={
        black ? null : (
          <g>
            {/* 0 prefixes ruler */}
            <g opacity={vis(0)}><MiniRuler x={cx - 400} y={cy} w={800} ticks={6} />{['m', '', 'k'].map((p, i) => <T key={i} x={cx - 400 + i * 400} y={cy - 50} size={44} color={ORANGE}>{p || '1'}</T>)}</g>
            {/* 1 the stick */}
            <g opacity={vis(1)}>
              <rect x={cx - 500} y={cy - 28} width={1000} height={56} rx={10} fill={ORANGE} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} />
              {Array.from({length: 60}).map((_, i) => <line key={i} x1={cx - 500 + i * 16.7} x2={cx - 500 + i * 16.7} y1={cy - 28} y2={cy + 28} stroke={INK} strokeWidth={1} opacity={0.4} />)}
            </g>
            {/* 2 cancelling tags */}
            <g opacity={vis(2)}><UnitTag x={cx - 120} y={cy} text="m" color={ORANGE} strike={1} /><UnitTag x={cx + 120} y={cy} text="m" color={ORANGE} strike={1} /></g>
            {/* 3 the fixed-area rectangle */}
            <g opacity={vis(3)}>
              <rect x={cx - 180} y={cy - 120} width={360} height={240} fill="none" stroke={P.muted} strokeWidth={3} strokeDasharray="10 10" />
              <rect x={cx - 320} y={cy - 68} width={640} height={135} rx={8} fill={TEAL} fillOpacity={0.22} stroke={INK} strokeWidth={LINE} />
            </g>
            {/* 4 percent bars */}
            <g opacity={vis(4)}>
              {[[cx - 260, 100], [cx, 150], [cx + 260, 75]].map(([x, v], i) => <rect key={i} x={x - 80} y={cy + 150 - v * 2.4} width={160} height={v * 2.4} rx={8} fill={[TEAL, ORANGE, AMBER][i]} fillOpacity={0.3} stroke={INK} strokeWidth={4} />)}
            </g>
            {/* 5 the grid */}
            <g opacity={vis(5)}>
              {Array.from({length: 12}).map((_, i) => <rect key={i} x={cx - 330 + (i % 6) * 110} y={cy - 110 + Math.floor(i / 6) * 110} width={100} height={100} rx={12} fill={i === 5 ? ORANGE : TEAL} fillOpacity={i === 5 ? 0.6 : i < 6 ? 0.3 : 0.08} stroke={INK} strokeWidth={3} />)}
            </g>
            {/* 6 overlap tiles */}
            <g opacity={vis(6)}>
              {[1, 2, 3, 4, 5, 6].map((n, i) => <DieTile key={n} x={cx - 450 + i * 180} y={cy} n={n} size={130} fill={n === 4 || n === 6 ? '#ffffff' : n % 2 === 0 ? AMBER : n > 3 ? TEAL : PAPER} />)}
            </g>
            {/* 7 square tiles */}
            <g opacity={vis(7)}>
              {[7, 8].map((n, i) => <rect key={n} x={cx - 300 + i * 360} y={cy + 120 - n * 30} width={n * 30} height={n * 30} fill={TEAL} fillOpacity={0.2} stroke={INK} strokeWidth={4} />)}
              <rect x={cx - 106 + 40} y={cy + 120 - 212} width={212} height={212} fill={ORANGE} fillOpacity={0.3} stroke={INK} strokeWidth={4} />
            </g>
            {/* 8 the ruler tilts into a hypotenuse; Axo taps it; it snaps */}
            {f >= next - 4 && (
              <g opacity={fin(f, next - 4, 8)}>
                <g transform={`translate(${cx - 420} ${cy + 180}) rotate(${-33 * tilt})`}>
                  <MiniRuler x={0} y={0} w={840} ticks={14} />
                </g>
                {legs > 0 && (
                  <g opacity={legs}>
                    <line x1={cx - 420} y1={cy + 206} x2={cx - 420 + 840 * Math.cos((33 * Math.PI) / 180) * ease(legs)} y2={cy + 206} stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
                    <line x1={cx - 420 + 840 * Math.cos((33 * Math.PI) / 180)} y1={cy + 206} x2={cx - 420 + 840 * Math.cos((33 * Math.PI) / 180)} y2={cy + 206 - (840 * Math.sin((33 * Math.PI) / 180) + 26) * ease(legs)} stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
                    <rect x={cx - 420 + 840 * Math.cos((33 * Math.PI) / 180) - 40} y={cy + 166} width={40} height={40} fill="none" stroke={INK} strokeWidth={4} />
                  </g>
                )}
                <AxoSide x={cx - 560} y={cy + 206} scale={0.75} rear={1} arm={f > tap - 6 && f < tap + 6 ? 10 : -60} />
                {f >= tap && <Burst x={cx - 400} y={cy + 160} t={clamp01((f - tap) / 14)} color={ORANGE} r={36} />}
              </g>
            )}
          </g>
        )
      }
    />
  );
};

export const v2c = {V2Percent, V2PctChange, V2Prob, V2Or, V2AtLeast, V2Roots, V2Roots2, V2TurnQ, V2TurnA, V2Recap};
