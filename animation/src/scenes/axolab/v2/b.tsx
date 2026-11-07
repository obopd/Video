// Video 2, part B: multiply by one, stacked conversions, the units lie detector, ratios and scaling.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoSide} from '../../../lib/cast';
import {Frame, SfxList, useCue} from '../kit';
import {
  INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, AMBER, RED, clamp01, ease, inOut, tio, tsp, fin, Burst,
  Heads, UnitTag, T, Sp, stag,
} from './common';

// ------------------------------------------------------------------ 2a. the same stick
export const V2Stick: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const idea = cue('idea behind', 0.02), never = cue('never change', 0.14), ruler = cue('only change the ruler', 0.25);
  const five = cue('Five meters', 0.36), same = cue('same stick', 0.45), thou = cue('five thousand millimeters', 0.58);
  const smaller = cue('Smaller unit', 0.74), bigger = cue('Bigger unit', 0.87);
  const X0 = 260, W = 1400, Y = 600;
  const stickIn = tsp(f, five - 4, five + 14, 0, 1);
  const sweep = tio(f, same, thou + 16);
  const sx = X0 + W * sweep;
  const value = f < same ? 5 : Math.round(5 * Math.pow(10, 3 * sweep));
  const unitMM = f >= same;
  const lensO = sweep > 0 && sweep < 1 ? 1 : f < thou + 30 ? 1 - clamp01((f - thou - 16) / 14) : 0;
  const swapA = fin(f, smaller, 10), swapB = fin(f, bigger, 10);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[five, 'slide', 0.4], [same, 'crash', 0.18, 1.8], [same + 2, 'scribble', 0.3, 1.4], [thou + 16, 'ding', 0.35], [smaller, 'pop', 0.35], [bigger, 'pop', 0.35, 0.85]]} />
          <Heads items={[
            {at: idea, text: 'Every conversion:'},
            {at: never, text: 'You never change the [[amount.]]'},
            {at: ruler, text: 'You only change the [[ruler.]]'},
            {at: five, text: '5 meters'},
            {at: same, text: 'Same stick.'},
            {at: thou, text: '5 m = [[5000 mm]]'},
            {at: smaller, text: 'Smaller unit, [[bigger]] number.'},
            {at: bigger, text: 'Bigger unit, [[smaller]] number.'},
          ]} />
        </>
      }
      svg={
        <g>
          {/* a ruler drawn twice: same span, two scales */}
          <g opacity={fin(f, never, 10) * (1 - fin(f, five - 6, 8))}>
            <line x1={X0} x2={X0 + W} y1={Y} y2={Y} stroke={INK} strokeWidth={LINE} />
            {Array.from({length: 6}).map((_, i) => <line key={i} x1={X0 + i * 280} x2={X0 + i * 280} y1={Y} y2={Y - 40} stroke={INK} strokeWidth={4} />)}
            <g opacity={fin(f, ruler, 10)}>
              {Array.from({length: 51}).map((_, i) => <line key={i} x1={X0 + i * 28} x2={X0 + i * 28} y1={Y} y2={Y + 18} stroke={TEAL} strokeWidth={2.5} />)}
            </g>
          </g>
          {stickIn > 0 && (
            <g>
              {/* constant length bracket */}
              <path d={`M ${X0} ${Y - 70} L ${X0} ${Y - 90} L ${X0 + W} ${Y - 90} L ${X0 + W} ${Y - 70}`} fill="none" stroke={INK} strokeWidth={4} opacity={stickIn} />
              <rect x={960 - 70} y={Y - 122} width={140} height={56} rx={28} fill={PAPER} opacity={stickIn} />
              <T x={960} y={Y - 80} size={44} o={stickIn}>5 m</T>
              <rect x={X0} y={Y - 28} width={W * stickIn} height={56} rx={10} fill={ORANGE} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} />
              {/* it fractures into millimetre sticks, left to right */}
              {sweep > 0 && Array.from({length: 500}).map((_, i) => {
                const x = X0 + (i * W) / 500;
                return x < sx ? <line key={i} x1={x} x2={x} y1={Y - 28} y2={Y + 28} stroke={INK} strokeWidth={1} opacity={0.45} /> : null;
              })}
              {/* the lens shows the tiny sticks */}
              {lensO > 0 && (
                <g opacity={lensO}>
                  <defs><clipPath id="lens"><circle cx={Math.min(sx, X0 + W - 10)} cy={Y} r={96} /></clipPath></defs>
                  <circle cx={Math.min(sx, X0 + W - 10)} cy={Y} r={100} fill={PAPER} stroke={INK} strokeWidth={6} />
                  <g clipPath="url(#lens)">
                    {Array.from({length: 12}).map((_, i) => (
                      <rect key={i} x={Math.min(sx, X0 + W - 10) - 132 + i * 24} y={Y - 30} width={20} height={60} rx={3} fill={ORANGE} fillOpacity={0.3} stroke={INK} strokeWidth={3} />
                    ))}
                  </g>
                  <T x={Math.min(sx, X0 + W - 10)} y={Y + 150} size={30} font={SANS} weight={800} color={P.muted}>each = 1 mm</T>
                </g>
              )}
              {/* the counter: the number grows while the unit shrinks */}
              <g transform="translate(960 860)">
                <T x={-20} y={0} size={110} anchor="end">{value.toLocaleString('en-US')}</T>
                <T x={10} y={0} size={110} anchor="start" color={unitMM ? TEAL : INK}>{unitMM ? 'mm' : 'm'}</T>
              </g>
            </g>
          )}
          {/* smaller unit / bigger number arrows */}
          {swapA > 0 && (
            <g opacity={swapA * (1 - 0.6 * swapB)}>
              <UnitTag x={460} y={860} text="unit ↓" color={TEAL} />
              <UnitTag x={1460} y={860} text="number ↑" color={ORANGE} />
            </g>
          )}
          {swapB > 0 && (
            <g opacity={swapB}>
              <UnitTag x={460} y={960} text="unit ↑" color={TEAL} />
              <UnitTag x={1460} y={960} text="number ↓" color={ORANGE} />
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2b. multiply by one in disguise
export const V2One: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const disguise = cue('in disguise', 0.04), equals = cue('One meter equals', 0.12), exactly = cue('exactly one', 0.22), cant = cue("can't change", 0.3);
  const cancel = cue('units cancel', 0.38), times = cue('Five meters times', 0.5), mc = cue('the meters cancel', 0.62), left = cue("you're left", 0.68);
  const rule = cue('The rule', 0.8);
  // phase 1: the card squashes into a "1" and back
  const sq = f < exactly ? 0 : f < exactly + 14 ? inOut((f - exactly) / 14) : f < exactly + 30 ? 1 : f < exactly + 44 ? 1 - inOut((f - exactly - 30) / 14) : 0;
  const card1 = fin(f, equals, 10) * (1 - fin(f, times - 8, 10));
  // phase 2: the equation, with unit tags cancelling
  const eq = fin(f, times, 10);
  const slide = tio(f, mc, mc + 16);
  const popT = clamp01((f - mc - 16) / 18);
  const gone = f > mc + 16;
  const res = fin(f, left, 10);
  const ruleO = fin(f, rule, 10);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[equals, 'pop', 0.4], [exactly, 'swish', 0.3, 1.3], [exactly + 30, 'swish', 0.25, 0.9], [cancel, 'tap', 0.3], [times, 'slide', 0.35],
            [mc + 16, 'pop', 0.6], [left, 'ding', 0.35], [rule, 'clack', 0.5]]} />
          <Heads items={[
            {at: disguise, text: 'Multiply by [[one]] in disguise'},
            {at: equals, text: '1 m = 1000 mm'},
            {at: exactly, text: 'so this is exactly [[1]]'},
            {at: cant, text: "The amount can't change."},
            {at: cancel, text: 'And the units [[cancel.]]'},
            {at: times, text: '5 m × the disguised 1'},
            {at: left, text: '= [[5000 mm]]'},
            {at: rule, text: 'Unwanted unit goes on the [[bottom.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {card1 > 0 && (
            <g opacity={card1} transform={`translate(960 620) scale(${1 - 0.15 * sq} ${1 - 0.82 * sq})`}>
              <rect x={-220} y={-190} width={440} height={380} rx={26} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
              <g opacity={1 - sq}>
                <T x={-40} y={-50} size={96}>1000</T><UnitTag x={140} y={-80} text="mm" color={TEAL} />
                <line x1={-170} x2={170} y1={0} y2={0} stroke={INK} strokeWidth={6} />
                <T x={-40} y={120} size={96}>1</T><UnitTag x={70} y={90} text="m" color={ORANGE} />
              </g>
            </g>
          )}
          {sq > 0.5 && card1 > 0 && <T x={960} y={680} size={220} color={ORANGE} o={(sq - 0.5) * 2}>1</T>}
          {eq > 0 && (
            <g opacity={eq}>
              {/* 5 m */}
              <T x={420} y={660} size={120}>5</T>
              {!gone && <UnitTag x={530 + (980 - 530) * 0 } y={620} text="m" color={ORANGE} />}
              <T x={660} y={650} size={90} color={P.muted}>×</T>
              {/* the disguised 1 */}
              <rect x={760} y={430} width={460} height={380} rx={26} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
              <T x={930} y={570} size={96}>1000</T><UnitTag x={1110} y={540} text="mm" color={TEAL} />
              <line x1={800} x2={1180} y1={620} y2={620} stroke={INK} strokeWidth={6} />
              <T x={940} y={740} size={96}>1</T>
              {!gone && <UnitTag x={1040 + (530 - 1040) * slide} y={710 + (620 - 710) * slide} text="m" color={ORANGE} />}
              <Burst x={530} y={620} t={popT} color={ORANGE} r={60} />
              {ruleO > 0 && (
                <g opacity={ruleO}>
                  <rect x={790} y={650} width={400} height={140} rx={20} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="14 10" />
                  <T x={990} y={860} size={32} font={SANS} weight={800} color={ORANGE}>the unit you want gone</T>
                </g>
              )}
              {/* result */}
              {res > 0 && (
                <g opacity={res}>
                  <T x={1310} y={650} size={90} color={P.muted}>=</T>
                  <T x={1580} y={660} size={110}>5000</T>
                  <UnitTag x={1580} y={740} text="mm" color={TEAL} />
                </g>
              )}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2c. stacked conversions
const Car: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -90 -20 L -60 -20 L -36 -52 L 34 -52 L 60 -20 L 90 -20 Q 100 -20 100 -8 L 100 8 L -100 8 L -100 -8 Q -100 -20 -90 -20 Z" fill={PAPER} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M -26 -44 L 26 -44 L 44 -22 L -42 -22 Z" fill={TEAL} fillOpacity={0.2} stroke={INK} strokeWidth={3} />
      {[-56, 56].map((wx) => (
        <g key={wx} transform={`translate(${wx} 10) rotate(${f * 12})`}>
          <circle r={20} fill={INK} /><line x1={0} x2={12} y1={0} y2={0} stroke={PAPER} strokeWidth={4} />
        </g>
      ))}
    </g>
  );
};

export const V2Speed: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const {durationInFrames: D} = props;
  const stacks = cue('It stacks', 0.02), kmh = cue('Thirty-six kilometers', 0.08), into = cue('into meters per second', 0.18);
  const m1 = cue('a thousand meters per', 0.3), m2 = cue('one hour per', 0.42), kmC = cue('Kilometers cancel', 0.55), hC = cue('Hours cancel', 0.62);
  const over = cue('Thirty-six thousand over', 0.72), ten = cue('ten meters per second', 0.88);
  const c1 = fin(f, kmh, 10), c2 = fin(f, m1, 10), c3 = fin(f, m2, 10);
  const kmS = clamp01((f - kmC) / 10), hS = clamp01((f - hC) / 10);
  const row = (cx: number, top: string, tu: string, bot: string, bu: string, o: number, dx: number, strikeTop = 0, strikeBot = 0, colT = INK, colB = INK) => (
    <g opacity={o} transform={`translate(${dx * (1 - o)} 0)`}>
      <T x={cx - 30} y={540} size={84} anchor="end">{top}</T>
      <UnitTag x={cx + 40} y={512} text={tu} color={colT} strike={strikeTop} o={1 - 0.65 * clamp01(strikeTop - 1 + 1) * (strikeTop >= 1 ? 1 : 0)} />
      <line x1={cx - 210} x2={cx + 110} y1={572} y2={572} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <T x={cx - 30} y={668} size={84} anchor="end">{bot}</T>
      <UnitTag x={cx + 40} y={640} text={bu} color={colB} strike={strikeBot} o={1 - 0.65 * (strikeBot >= 1 ? 1 : 0)} />
    </g>
  );
  // the result fraction: 36000/3600 -> 360/36 -> 10
  const stageB = f >= over + 26, stageC = f >= ten;
  const resO = fin(f, over, 10);
  const carX = 120 + ((f * 9) % 2100) - 100;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[kmh, 'slide', 0.35], [m1, 'slide', 0.35, 1.1], [m2, 'slide', 0.35, 1.2], [kmC, 'pop', 0.5], [kmC + 3, 'pop', 0.45, 1.1], [hC, 'pop', 0.5, 0.9],
            [hC + 3, 'pop', 0.45], [over + 26, 'pop', 0.4, 1.3], [over + 29, 'pop', 0.4, 1.4], [ten, 'ding', 0.4]]} />
          <Heads items={[
            {at: stacks, text: 'It [[stacks.]]'},
            {at: kmh, text: '36 km/h'},
            {at: into, text: '36 km/h → [[m/s]]'},
            {at: kmC, text: 'Kilometers [[cancel.]]'},
            {at: hC, text: 'Hours [[cancel.]]'},
            {at: over, text: '36,000 m ÷ 3,600 s'},
            {at: ten, text: '= [[10 m/s]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {row(430, '36', 'km', '1', 'h', c1, -200, kmS, hS, ORANGE, AMBER)}
          {c2 > 0 && <T x={640} y={600} size={80} color={P.muted} o={c2}>×</T>}
          {row(960, '1000', 'm', '1', 'km', c2, 200, 0, kmS, INK, ORANGE)}
          {c3 > 0 && <T x={1170} y={600} size={80} color={P.muted} o={c3}>×</T>}
          {row(1490, '1', 'h', '3600', 's', c3, 200, hS, 0, AMBER, INK)}
          <Burst x={470} y={512} t={clamp01((f - kmC - 10) / 16)} color={ORANGE} />
          <Burst x={1000} y={640} t={clamp01((f - kmC - 10) / 16)} color={ORANGE} />
          <Burst x={470} y={640} t={clamp01((f - hC - 10) / 16)} color={AMBER} />
          <Burst x={1530} y={512} t={clamp01((f - hC - 10) / 16)} color={AMBER} />
          {/* result */}
          {resO > 0 && (
            <g opacity={resO}>
              {!stageC ? (
                <g>
                  <T x={900} y={810} size={70} anchor="end">{stageB ? '360' : '36,000'}</T><T x={920} y={810} size={46} anchor="start" font={SANS} weight={800}>m</T>
                  <T x={1020} y={810} size={70} color={P.muted}>/</T>
                  <T x={1240} y={810} size={70} anchor="end">{stageB ? '36' : '3,600'}</T><T x={1260} y={810} size={46} anchor="start" font={SANS} weight={800}>s</T>
                  <Burst x={880} y={790} t={clamp01((f - over - 26) / 14)} r={34} />
                  <Burst x={1220} y={790} t={clamp01((f - over - 29) / 14)} r={34} />
                </g>
              ) : (
                <g transform={`translate(960 820) scale(${tsp(f, ten, ten + 14, 0.6, 1)})`}>
                  <T x={0} y={0} size={110} color={TEAL}>10 m/s</T>
                </g>
              )}
            </g>
          )}
          {/* a car at a constant speed: nothing about it changed */}
          <g opacity={fin(f, into, 12)}>
            <line x1={0} x2={1920} y1={1010} y2={1010} stroke={INK} strokeWidth={3} opacity={0.4} />
            <Car x={carX} y={990} />
            <UnitTag x={carX} y={910} text={f >= ten ? '10 m/s' : '36 km/h'} color={f >= ten ? TEAL : INK} s={0.8} />
          </g>
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2d. factors are given
export const V2Given: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const pounds = cue('pounds and inches', 0.04), hands = cue('hands you', 0.25), tests = cue('What it tests', 0.55), cancel = cue('units cancel', 0.85);
  const card = tsp(f, hands, hands + 16, 0, 1);
  const setup = fin(f, tests, 10);
  const strike = clamp01((f - cancel) / 10);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[hands, 'whoosh', 0.35, 1.2], [tests, 'tap', 0.35], [cancel, 'pop', 0.5], [cancel + 3, 'pop', 0.45, 1.1]]} />
          <Heads items={[
            {at: pounds, text: 'Pounds? Inches?'},
            {at: hands, text: 'The exam hands you the [[factors.]]'},
            {at: tests, text: 'It tests the [[setup.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {card > 0 && (
            <g transform={`translate(${1460 + 500 * (1 - card)} ${380 - 200 * (1 - card)}) rotate(${3 * (1 - card) + 2})`}>
              <rect x={-230} y={-80} width={460} height={160} rx={18} fill="#fffdf8" stroke={INK} strokeWidth={LINE} />
              <rect x={-230} y={-80} width={460} height={44} rx={18} fill={INK} />
              <text x={0} y={-48} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} letterSpacing={3} fill={PAPER}>GIVEN ON THE EXAM</text>
              <T x={0} y={40} size={58}>1 in = 2.54 cm</T>
            </g>
          )}
          {setup > 0 && (
            <g opacity={setup}>
              <T x={520} y={700} size={110}>12</T><UnitTag x={640} y={668} text="in" color={ORANGE} strike={strike} />
              <T x={760} y={690} size={80} color={P.muted}>×</T>
              <T x={980} y={610} size={84} anchor="end">2.54</T><UnitTag x={1050} y={582} text="cm" color={TEAL} />
              <line x1={820} x2={1110} y1={640} y2={640} stroke={INK} strokeWidth={6} />
              <T x={980} y={740} size={84} anchor="end">1</T><UnitTag x={1050} y={712} text="in" color={ORANGE} strike={strike} />
              <Burst x={640} y={668} t={clamp01((f - cancel - 10) / 16)} />
              <Burst x={1050} y={712} t={clamp01((f - cancel - 10) / 16)} />
            </g>
          )}
          {/* Axo points at the setup, not at the number */}
          <AxoSide x={1500} y={960} scale={0.8} rear={1} dir={-1} arm={setup > 0 ? -150 : -30} />
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 2e. units are a lie detector
export const V2Lie: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const bonus = cue('bonus', 0.02), detector = cue('lie detector', 0.06), claims = cue('Someone claims', 0.12), mts = cue('Meters times seconds', 0.24);
  const wrong = cue('formula is wrong', 0.32), force = cue('Force is mass', 0.42), kgms = cue('kilograms times meters', 0.5), newton = cue('call a newton', 0.6);
  const ke = cue('Kinetic energy', 0.68), kgm2 = cue('kilograms times meters squared', 0.74), joule = cue("That's a joule", 0.84), stop = cue("don't match", 0.93);
  const r1 = fin(f, claims, 10), r2 = fin(f, force, 10), r3 = fin(f, ke, 10);
  const flash = f > wrong && f < wrong + 20 ? Math.sin(((f - wrong) / 20) * Math.PI) : 0;
  const fuseN = tio(f, newton, newton + 12), fuseJ = tio(f, joule, joule + 12);
  const dimAll = 1 - 0.55 * fin(f, stop, 10);
  const Row: React.FC<{y: number; o: number; eq: React.ReactNode; children: React.ReactNode}> = ({y, o, eq, children}) => (
    <g opacity={o}>
      <g transform={`translate(${-60 * (1 - o)} 0)`}>
        <T x={700} y={y + 30} size={84} anchor="end">{eq}</T>
      </g>
      <line x1={760} x2={830} y1={y + 2} y2={y + 2} stroke={P.muted} strokeWidth={4} strokeDasharray="6 8" />
      {children}
    </g>
  );
  return (
    <Frame
      html={
        <>
          <SfxList items={[[detector, 'blip', 0.35, 1.3], [claims, 'slide', 0.3], [mts, 'tap', 0.35], [wrong, 'blip', 0.55, 0.45], [wrong + 4, 'thud', 0.45],
            [force, 'slide', 0.3], [newton, 'clack', 0.6], [ke, 'slide', 0.3], [joule, 'clack', 0.6], [stop, 'thud', 0.45]]} />
          <Heads items={[
            {at: bonus, text: 'A bonus:'},
            {at: detector, text: 'Units are a [[lie detector.]]'},
            {at: wrong, text: 'Wrong before any math.'},
            {at: force, text: 'Force = mass × acceleration'},
            {at: newton, text: 'kg·m/s^{2} = a [[newton]]'},
            {at: ke, text: 'Kinetic energy'},
            {at: joule, text: 'kg·m^{2}/s^{2} = a [[joule]]'},
            {at: stop, text: "Units don't match? [[Stop.]]"},
          ]} />
        </>
      }
      svg={
        <g opacity={dimAll}>
          <Row y={420} o={r1} eq={<>v = d × t</>}>
            {f >= mts && (
              <g opacity={fin(f, mts, 8)} transform={`translate(${flash * 6 * Math.sin(f * 2)} 0)`}>
                <UnitTag x={960} y={420} text="m/s" color={flash > 0 || f > wrong ? RED : INK} />
                <T x={1110} y={440} size={64} color={f > wrong ? RED : P.muted}>{f > wrong ? '≠' : 'vs'}</T>
                <UnitTag x={1260} y={420} text="m·s" color={flash > 0 || f > wrong ? RED : INK} />
                {f > wrong && <T x={1440} y={444} size={72} color={RED} o={fin(f, wrong, 6)}>✗</T>}
              </g>
            )}
            {flash > 0 && <rect x={280} y={340} width={1360} height={160} rx={20} fill={RED} opacity={0.12 * flash} />}
          </Row>
          <Row y={620} o={r2} eq={<>F = m a</>}>
            {f >= kgms && (
              <g opacity={fin(f, kgms, 8)}>
                {fuseN < 1 && (
                  <g opacity={1 - fuseN}>
                    <UnitTag x={940 + 120 * fuseN} y={620} text="kg" />
                    <UnitTag x={1160 - 100 * fuseN} y={620} text="m/s²" />
                  </g>
                )}
                {fuseN > 0 && <UnitTag x={1050} y={620} text="N" color={TEAL} w={110} s={tsp(f, newton + 6, newton + 18, 0.6, 1)} o={fuseN} />}
                {f > newton + 6 && <T x={1440} y={644} size={72} color={TEAL} o={fin(f, newton + 6, 6)}>✓</T>}
              </g>
            )}
          </Row>
          <Row y={820} o={r3} eq={<>KE = ½ m v<Sp>2</Sp></>}>
            {f >= kgm2 && (
              <g opacity={fin(f, kgm2, 8)}>
                {fuseJ < 1 && (
                  <g opacity={1 - fuseJ}>
                    <UnitTag x={940 + 120 * fuseJ} y={820} text="kg" />
                    <UnitTag x={1180 - 120 * fuseJ} y={820} text="m²/s²" />
                  </g>
                )}
                {fuseJ > 0 && <UnitTag x={1050} y={820} text="J" color={TEAL} w={110} s={tsp(f, joule + 6, joule + 18, 0.6, 1)} o={fuseJ} />}
                {f > joule + 6 && <T x={1440} y={844} size={72} color={TEAL} o={fin(f, joule + 6, 6)}>✓</T>}
              </g>
            )}
          </Row>
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 3a. direct and inverse
export const V2Direct: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const half = cue('Half of', 0.02), change = cue('if I change this', 0.1), two = cue('two ways', 0.22), directly = cue('Directly', 0.3);
  const ratio = cue('ratio stays fixed', 0.42), inversely = cue('inversely', 0.52), product = cue('product stays fixed', 0.64);
  const rect = cue('Picture a rectangle', 0.72), stretch = cue('Stretch it wider', 0.85);
  // intro: "this" and "that", tied by a string
  const intro = fin(f, change, 10) * (1 - fin(f, directly - 6, 8));
  const tug = f > change + 10 ? Math.sin((f - change) / 9) * 30 : 0;
  // direct: both bars stretch by the same factor
  const dirO = fin(f, directly, 10) * (1 - fin(f, inversely - 6, 8));
  const k = 1 + 0.9 * (0.5 - 0.5 * Math.cos(Math.max(0, f - directly - 8) / 22));
  // inverse: a rectangle of fixed area
  const invO = fin(f, inversely, 10);
  const kk = f < rect ? 1 + 0.6 * (0.5 - 0.5 * Math.cos(Math.max(0, f - inversely - 8) / 20)) : tsp(f, stretch, stretch + 18, 1, 1.9);
  const W0 = 360, H0 = 240;
  const w = W0 * kk, h = H0 / kk;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[change, 'boing', 0.3], [directly, 'slide', 0.35], [ratio, 'ding', 0.3], [inversely, 'slide', 0.35, 0.9], [product, 'ding', 0.3, 1.1], [stretch, 'boing', 0.4]]} />
          <Heads items={[
            {at: half, text: "Half of MCAT math isn't arithmetic."},
            {at: change, text: 'Change [[this]]: what happens to [[that]]?'},
            {at: two, text: 'Two ways to be tied:'},
            {at: directly, text: '[[Directly]]: double, double'},
            {at: ratio, text: 'The [[ratio]] stays fixed.'},
            {at: inversely, text: '[[Inversely]]: double, halve'},
            {at: product, text: 'The [[product]] stays fixed.'},
            {at: stretch, text: 'Wider means [[shorter.]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {intro > 0 && (
            <g opacity={intro}>
              <circle cx={700 + tug * 0.2} cy={620} r={90} fill={ORANGE} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} />
              <T x={700 + tug * 0.2} y={636} size={40} font={SANS} weight={800}>this</T>
              <path d={`M 790 620 Q 960 ${620 + tug} 1130 620`} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="8 8" />
              <circle cx={1220 - tug * 0.2} cy={620} r={90} fill={TEAL} fillOpacity={0.25} stroke={INK} strokeWidth={LINE} />
              <T x={1220 - tug * 0.2} y={636} size={40} font={SANS} weight={800}>that</T>
            </g>
          )}
          {dirO > 0 && (
            <g opacity={dirO}>
              <line x1={420} x2={860} y1={920} y2={920} stroke={INK} strokeWidth={4} />
              <rect x={500} y={920 - 200 * k} width={110} height={200 * k} rx={10} fill={ORANGE} fillOpacity={0.3} stroke={INK} strokeWidth={LINE} />
              <rect x={670} y={920 - 100 * k} width={110} height={100 * k} rx={10} fill={TEAL} fillOpacity={0.3} stroke={INK} strokeWidth={LINE} />
              <T x={555} y={970} size={40} font={SANS} weight={800}>A</T><T x={725} y={970} size={40} font={SANS} weight={800}>B</T>
              {/* the graph: one fixed slope */}
              <g transform="translate(1100 920)">
                <line x1={0} x2={600} y1={0} y2={0} stroke={INK} strokeWidth={4} />
                <line x1={0} x2={0} y1={0} y2={-480} stroke={INK} strokeWidth={4} />
                <line x1={0} y1={0} x2={240 * 1.95} y2={-480 * 0.98} stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
                <circle cx={120 * k} cy={-240 * k} r={14} fill={ORANGE} stroke={INK} strokeWidth={3} />
                <text x={590} y={40} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={28} fill={P.muted}>B</text>
                <text x={-20} y={-450} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={28} fill={P.muted}>A</text>
              </g>
              <g opacity={fin(f, ratio, 8)}><UnitTag x={640} y={480} text={`A / B = ${(2).toFixed(0)}`} color={ORANGE} /></g>
            </g>
          )}
          {invO > 0 && (
            <g opacity={invO}>
              <rect x={960 - W0 / 2} y={680 - H0 / 2} width={W0} height={H0} fill="none" stroke={P.muted} strokeWidth={3} strokeDasharray="10 10" />
              <rect x={960 - w / 2} y={680 - h / 2} width={w} height={h} rx={8} fill={TEAL} fillOpacity={0.22} stroke={INK} strokeWidth={LINE} />
              <T x={960} y={680 + h / 2 + 60} size={40} font={SANS} weight={800}>{`width ${(4 * kk).toFixed(1)}`}</T>
              <T x={960 + w / 2 + 30} y={694} size={40} font={SANS} weight={800} anchor="start">{`height ${(3 / kk).toFixed(1)}`}</T>
              <g opacity={fin(f, product, 8)}><UnitTag x={960} y={430} text="width × height = 12" color={TEAL} /></g>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 3b. squares and the lamp
export const V2Squares: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const squares = cue('Then there are squares', 0.02), dbl = cue('Double the side', 0.08), four = cue('four times', 0.18), fit = cue('four of the old', 0.24);
  const triple = cue('Triple it', 0.34), lamp = cue('light from a lamp', 0.45), weaker = cue('weaker with the square', 0.62), twice = cue('Twice as far', 0.8);
  const U = 120;
  const tileO = 1 - fin(f, lamp - 6, 8);
  const side = f < triple ? tio(f, dbl, dbl + 18, 1, 2) : tio(f, triple, triple + 18, 2, 3);
  const n = f < triple ? 2 : 3;
  const fillAt = f < triple ? fit : triple + 18;
  const cx = 960, cy = 640;
  // lamp: the screen moves from d to 2d; the same light covers four tiles
  const lampO = fin(f, lamp, 10);
  const move = tio(f, weaker, weaker + 30);
  const sx = 820 + 520 * move;
  const tiles = move > 0.5 ? 2 : 1;
  const bright = move > 0.5 ? 0.25 : 1;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[dbl, 'slide', 0.35], [fit, 'pop', 0.35], [fit + 4, 'pop', 0.35, 1.1], [fit + 8, 'pop', 0.35, 1.2], [triple, 'slide', 0.35, 1.1],
            [triple + 18, 'sparkle', 0.3], [lamp, 'whoosh', 0.3, 1.3], [weaker, 'slide', 0.35, 0.8], [twice, 'ding', 0.35]]} />
          <Heads items={[
            {at: squares, text: 'Then there are [[squares.]]'},
            {at: dbl, text: 'Double the side…'},
            {at: four, text: '…area [[×4]]'},
            {at: triple, text: 'Triple it: [[×9]]'},
            {at: lamp, text: 'Light from a lamp'},
            {at: weaker, text: 'Weaker with the [[square]] of distance'},
            {at: twice, text: 'Twice as far: [[¼]] as bright'},
          ]} />
        </>
      }
      svg={
        <g>
          {tileO > 0 && f >= dbl - 30 && (
            <g opacity={tileO * fin(f, squares, 10)}>
              {/* the original tile, then copies filling the bigger square */}
              {Array.from({length: n * n}).map((_, i) => {
                const r = Math.floor(i / n), c = i % n;
                const o = i === 0 ? 1 : stag(f, fillAt, i - 1, 2, 6);
                return <rect key={`${n}${i}`} x={cx - (side * U) / 2 + c * U + 3} y={cy - (side * U) / 2 + r * U + 3} width={U - 6} height={U - 6} rx={8}
                             fill={i === 0 ? ORANGE : TEAL} fillOpacity={i === 0 ? 0.45 : 0.25} stroke={INK} strokeWidth={3} opacity={o} />;
              })}
              <rect x={cx - (side * U) / 2} y={cy - (side * U) / 2} width={side * U} height={side * U} fill="none" stroke={INK} strokeWidth={LINE} />
              <T x={cx + (side * U) / 2 + 40} y={cy + 20} size={60} anchor="start" color={TEAL} o={fin(f, four, 8)}>{f >= triple + 18 ? '×9' : '×4'}</T>
              <T x={cx} y={cy + (side * U) / 2 + 60} size={36} font={SANS} weight={800} color={P.muted}>{`side ×${Math.round(side)}`}</T>
            </g>
          )}
          {lampO > 0 && (
            <g opacity={lampO}>
              {/* lamp */}
              <g transform="translate(260 640)">
                <circle r={46} fill={AMBER} fillOpacity={0.5} stroke={INK} strokeWidth={LINE} />
                <rect x={-26} y={40} width={52} height={40} rx={6} fill={PAPER} stroke={INK} strokeWidth={4} />
              </g>
              {/* the cone, spreading */}
              <path d={`M 306 640 L ${sx} ${640 - 60 * (sx - 306) / 514} L ${sx} ${640 + 60 * (sx - 306) / 514} Z`} fill={AMBER} opacity={0.16} />
              <line x1={sx} x2={sx} y1={400} y2={880} stroke={INK} strokeWidth={LINE} />
              <T x={(306 + sx) / 2} y={920} size={40} font={SANS} weight={800}>{move > 0.5 ? '2d' : 'd'}</T>
              {/* front view of the screen */}
              <g transform="translate(1640 640)">
                <rect x={-130} y={-130} width={260} height={260} rx={10} fill={PAPER} stroke={INK} strokeWidth={4} />
                {Array.from({length: tiles * tiles}).map((_, i) => {
                  const r = Math.floor(i / tiles), c = i % tiles, s = 100;
                  return <rect key={`${tiles}${i}`} x={-tiles * s / 2 + c * s + 3} y={-tiles * s / 2 + r * s + 3} width={s - 6} height={s - 6} rx={6} fill={AMBER} fillOpacity={0.85 * bright} stroke={INK} strokeWidth={2} />;
                })}
                <T x={0} y={190} size={34} font={SANS} weight={800} color={P.muted}>{move > 0.5 ? 'each tile: ¼' : 'one tile'}</T>
              </g>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 3c. track the multipliers
const Syringe: React.FC<{x: number; y: number; len: number; color: string; label: string}> = ({x, y, len, color, label}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-40} y={-30} width={26} height={60} rx={4} fill={PAPER} stroke={INK} strokeWidth={4} />
    <line x1={-14} x2={0} y1={0} y2={0} stroke={INK} strokeWidth={10} />
    <rect x={0} y={-34} width={len} height={68} rx={10} fill={color} fillOpacity={0.28} stroke={INK} strokeWidth={LINE} />
    <path d={`M ${len} -12 L ${len + 30} -6 L ${len + 30} 6 L ${len} 12 Z`} fill={PAPER} stroke={INK} strokeWidth={3} />
    <line x1={len + 30} x2={len + 90} y1={0} y2={0} stroke={INK} strokeWidth={3} />
    <text x={len + 110} y={14} fontFamily={DISPLAY} fontWeight={700} fontSize={48} fill={INK}>{label}</text>
  </g>
);

export const V2Multipliers: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const trick = cue("here's the trick", 0.02), plug = cue("Don't plug", 0.06), track = cue('Track the multipliers', 0.1), suppose = cue('Suppose', 0.15);
  const dbl = cue('charge doubles', 0.27), tri = cue('distance triples', 0.35), together = cue('Together', 0.42), noNum = cue('No calculator', 0.47);
  const plain = cue('Plain ratios', 0.54), four = cue('If four milliliters', 0.6), ten = cue('ten milliliters', 0.76), res = cue('one-point-five', 0.92);
  const formO = fin(f, suppose, 10) * (1 - fin(f, plain - 6, 8));
  const tagQ = tsp(f, dbl, dbl + 14, 0, 1), tagR = tsp(f, tri, tri + 14, 0, 1);
  const nine = fin(f, tri + 16, 8);
  const merge = tio(f, together, together + 18);
  const mergedS = tsp(f, together + 14, together + 28, 0.4, 1);
  const syrO = fin(f, four, 10);
  const scale = tsp(f, ten, ten + 22, 1, 2.5);
  const mg = 0.6 * scale;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[plug, 'tap', 0.3], [dbl, 'pop', 0.45], [tri, 'pop', 0.45, 1.1], [tri + 16, 'tick', 0.35], [together, 'slide', 0.35], [together + 16, 'clack', 0.55],
            [four, 'slide', 0.35], [ten, 'rise', 0.35, 1.3], [res, 'ding', 0.4]]} />
          <Heads items={[
            {at: trick, text: "Here's the trick."},
            {at: plug, text: "Don't plug in numbers."},
            {at: track, text: 'Track the [[multipliers.]]'},
            {at: dbl, text: 'Charge doubles: [[×2]]'},
            {at: tri, text: 'Distance triples: [[×1/9]]'},
            {at: together, text: 'Together: [[×2/9]]'},
            {at: plain, text: 'Plain ratios: same idea.'},
            {at: ten, text: '10 mL is [[2.5×]] the 4 mL'},
            {at: res, text: '0.6 mg × 2.5 = [[1.5 mg]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {formO > 0 && (
            <g opacity={formO}>
              <T x={640} y={660} size={150}>F</T>
              <T x={790} y={650} size={110} color={P.muted}>∝</T>
              <T x={1010} y={580} size={120}>q</T>
              <line x1={900} x2={1120} y1={620} y2={620} stroke={INK} strokeWidth={7} strokeLinecap="round" />
              <T x={1010} y={760} size={120}>r<Sp>2</Sp></T>
              {/* tags attach, then slide together and merge */}
              {tagQ > 0 && merge < 1 && <UnitTag x={1230 + (1520 - 1230) * merge} y={545 + (620 - 545) * merge} text="×2" color={ORANGE} s={tagQ} o={1 - merge} />}
              {tagR > 0 && merge < 1 && <UnitTag x={1240 + (1520 - 1240) * merge} y={715 + (620 - 715) * merge} text={nine > 0.5 ? '×1/9' : '×3'} color={AMBER} s={tagR} o={1 - merge} />}
              {nine > 0 && merge < 1 && <T x={1010} y={840} size={44} font={SANS} weight={800} color={AMBER} o={nine * (1 - merge)}>(×3)² = ×9 on the bottom</T>}
              {f >= together + 14 && <UnitTag x={1520} y={620} text="×2/9" color={TEAL} s={1.5 * mergedS} />}
              {f >= noNum && <T x={1520} y={760} size={36} font={SANS} weight={800} color={P.muted} o={fin(f, noNum, 8)}>no numbers needed</T>}
            </g>
          )}
          {syrO > 0 && (
            <g opacity={syrO}>
              <Syringe x={300} y={520} len={100 * 4 * scale / 1.5} color={TEAL} label={`${(4 * scale).toFixed(scale > 2.49 ? 0 : 1)} mL`} />
              <Syringe x={300} y={720} len={100 * 4 * mg / 0.9 / 1.5} color={ORANGE} label={`${mg.toFixed(2).replace(/0$/, '')} mg`} />
              {f >= ten && <UnitTag x={1600} y={880} text="both ×2.5" color={INK} o={fin(f, ten, 8)} />}
            </g>
          )}
        </g>
      }
    />
  );
};

export const v2b = {V2Stick, V2One, V2Speed, V2Given, V2Lie, V2Direct, V2Squares, V2Multipliers};
