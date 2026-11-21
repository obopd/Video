// Video 1 (revised), part E: what is scientific notation?
import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import type {SceneProps} from '../../../lib/types';
import {AxoLive as AxoSide, AxoFrontLive} from '../../../lib/axolive';
import {Frame, KeySeq, SfxList, useCue} from '../kit';
import {INK, PAPER, ORANGE, LINE, DISPLAY, SANS, P, TEAL, clamp01, ease, inOut, tio, tsp, fin, Burst, Bill, Dime, ZeroTile} from './common';
import {T, Sp, UnitTag, AMBER, RED} from '../v2/common';

const SPACE = '#e4dac7'; // "number space": a deeper paper tone with a faint grid
const Grid: React.FC<{o: number; dx?: number}> = ({o, dx = 0}) => (
  <g opacity={o}>
    <rect x={-10} y={-10} width={1940} height={1100} fill={SPACE} />
    {Array.from({length: 26}).map((_, i) => <line key={`v${i}`} x1={((i * 80 - dx) % 2080 + 2080) % 2080 - 80} x2={((i * 80 - dx) % 2080 + 2080) % 2080 - 80} y1={0} y2={1080} stroke={INK} strokeOpacity={0.07} strokeWidth={2} />)}
    {Array.from({length: 14}).map((_, i) => <line key={`h${i}`} x1={0} x2={1920} y1={i * 80} y2={i * 80} stroke={INK} strokeOpacity={0.07} strokeWidth={2} />)}
  </g>
);

const Heads: React.FC<{items: {at: number; text: string; size?: number}[]; size?: number}> = ({items, size = 76}) => (
  <KeySeq x={90} y={150} w={1740} align="center" size={size} items={items} />
);

/** A value rolling from a to b (old one slides up and out, new one rises in). */
const RollT: React.FC<{x: number; y: number; a: string; b: string; t: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; sup?: boolean}> = ({x, y, a, b, t, size = 80, color = INK, anchor = 'middle'}) => {
  const k = inOut(t);
  if (k <= 0) return <T x={x} y={y} size={size} color={color} anchor={anchor}>{a}</T>;
  if (k >= 1) return <T x={x} y={y} size={size} color={color} anchor={anchor}>{b}</T>;
  return (
    <g>
      <T x={x} y={y - size * 0.6 * k} size={size} color={color} anchor={anchor} o={1 - k}>{a}</T>
      <T x={x} y={y + size * 0.6 * (1 - k)} size={size} color={color} anchor={anchor} o={k}>{b}</T>
    </g>
  );
};

/**
 * Digits with a sliding decimal point. `pos` = how many digits sit left of the point
 * (fractional while it hops). Leading zeros left of the point fade away.
 */
const DecNum: React.FC<{x: number; y: number; digits: string; pos: number; size?: number; color?: string}> = ({x, y, digits, pos, size = 120, color = INK}) => {
  const w = size * 0.6, gap = size * 0.32;
  const first = digits.search(/[1-9]/);
  let last = -1;
  for (let i = 0; i < digits.length; i++) if (digits[i] !== '0') last = i;
  const pr = Math.round(pos);
  const hopping = Math.abs(pos - pr) > 0.02;
  const hop = Math.abs(pos - Math.round(pos));
  const shift = (i: number) => gap * clamp01(i + 1 - pos);   // digits right of the point make room for it
  const hasFrac = last >= pr;                                 // anything but zeros after the point?
  const dotO = pos >= digits.length - 0.01 ? 0 : hopping || hasFrac ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {digits.split('').map((d, i) => {
        const lead = i < first && i < pr - 1;
        const trail = !hopping && i >= pr && i > last;
        return <text key={i} x={i * w + w / 2 + shift(i)} y={0} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={size} fill={color} opacity={lead || trail ? 0 : 1}>{d}</text>;
      })}
      <circle cx={pos * w + gap * 0.5} cy={-size * 0.06 - Math.sin(hop * Math.PI) * size * 0.4} r={size * 0.1} fill={color === INK || color === TEAL ? ORANGE : INK} opacity={dotO} />
    </g>
  );
};

/** Log-scale gauge with the 1-to-10 zone in green; returns x for a value. */
const gaugeX = (v: number, x0: number, dec: number, lo: number) => x0 + (Math.log10(v) - lo) * dec;
const Gauge: React.FC<{x0: number; y: number; dec: number; lo: number; hi: number; o?: number}> = ({x0, y, dec, lo, hi, o = 1}) => (
  <g opacity={o}>
    <rect x={gaugeX(1, x0, dec, lo)} y={y - 22} width={dec} height={44} rx={10} fill={TEAL} opacity={0.22} />
    <line x1={x0} x2={x0 + (hi - lo) * dec} y1={y} y2={y} stroke={INK} strokeWidth={4} />
    {Array.from({length: hi - lo + 1}).map((_, i) => {
      const e = lo + i, x = x0 + i * dec;
      const lab = e >= 0 ? String(Math.pow(10, e)) : `0.${'0'.repeat(-e - 1)}1`;
      return <g key={e}><line x1={x} x2={x} y1={y - 18} y2={y + 18} stroke={INK} strokeWidth={4} /><text x={x} y={y + 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} fill={P.muted}>{lab}</text></g>;
    })}
    <text x={gaugeX(3.16, x0, dec, lo)} y={y - 34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={TEAL}>1 ≤ a &lt; 10</text>
  </g>
);
const Marker: React.FC<{x: number; y: number; ok: boolean; flash?: number; o?: number}> = ({x, y, ok, flash = 0, o = 1}) => (
  <g opacity={o}>
    <path d={`M ${x} ${y - 26} l -16 -26 l 32 0 Z`} fill={ok ? TEAL : RED} />
    {flash > 0 && <circle cx={x} cy={y} r={20 + 40 * flash} fill="none" stroke={ok ? TEAL : RED} strokeWidth={5 * (1 - flash) + 1} opacity={1 - flash} />}
  </g>
);

// the whole 24-tile row laid out across the screen (end of the mole scene, start of the notation scene)
const RIB_S = 0.86;
const ribbonX = (k: number) => 960 + (k - 11.5) * 86 * RIB_S;
const easeIn2 = (t: number) => { const x = clamp01(t); return x * x; };

// ------------------------------------------------------------------ 1a. one mole of particles
export const V1Mole: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const absurd = cue('absurd', 0.02), chamber = cue('This chamber', 0.15), how = cue('How many is that', 0.35);
  const six = cue('Six hundred', 0.48), nobody = cue('Nobody', 0.85);
  // pull back from inside the swarm to the chamber on the bench
  const pbStart = Math.max(absurd + 24, chamber - 62);
  const pb = inOut((f - pbStart) / 76);
  const camS = 5.2 - 4.2 * pb;
  const C = {x: 960, y: 600};
  const arc = Math.sin(pb * Math.PI / 2) * 1;         // a gentle 20° arc, faked with parallax
  // the digits stream out of the valve one after another (6, 0, 2, then zeros); the camera follows the newest one, then brakes
  const N = 24, emitEvery = 3, GAP = 86;
  const runLen = Math.max(N * emitEvery, nobody - 2 - six);   // keep streaming until "Nobody…"
  const u = clamp01((f - six) / runLen);
  const shape = (x: number) => (x < 0.2 ? 2.5 * x * x : x > 0.85 ? 1 - (1 - x) * (1 - x) / 0.3 : 0.1 + (x - 0.2) * (0.925 - 0.1) / 0.65);
  const headX = 1290 + GAP * (N - 1) * shape(u);
  const tStop = six + runLen;
  // on "Nobody wants to write that": the camera eases back to the whole row, then the zeros topple like dominoes
  const camX = Math.max(0, headX - 1450);
  const fold = inOut((f - nobody - 2) / 22);
  const space = inOut((f - six - 6) / 50);
  const shownN = f < six ? 0 : Math.min(N, Math.floor((headX - 1290) / GAP) + 1);
  const zerosOut = Math.max(0, shownN - 3);
  const digit = (k: number) => (k === 0 ? '6' : k === 1 ? '0' : k === 2 ? '2' : '0');
  return (
    <Frame enter="cut" exit="cut" push={0}
      html={
        <>
          <SfxList items={[[0, 'sparkle', 0.25, 0.8], [pbStart, 'whoosh', 0.35, 0.7], [chamber, 'clack', 0.3, 0.8], [six, 'swish', 0.35, 1.2], ...Array.from({length: 8}).map((_, k) => [six + k * 9, 'tick', 0.18, 1.5 + k * 0.05] as [number, 'tick', number, number]),
            [nobody + 2, 'swish', 0.3, 1.2], [nobody + 8, 'crash', 0.22, 0.5], [nobody + 16, 'thud', 0.4, 0.6], [nobody + 24, 'thud', 0.3, 0.7], [nobody + 32, 'thud', 0.25, 0.8]]} />
        </>
      }
      svg={
        <g>
          <g transform={`translate(${-camX} 0)`}>
            <g transform={`translate(${C.x} ${C.y}) scale(${camS}) translate(${-C.x} ${-C.y})`}>
              {/* the lab, which dissolves into number space once the ribbon runs */}
              <g opacity={1 - space}>
                <g transform={`translate(${-40 * arc} 0)`}>
                  {/* spectrometer tower */}
                  <rect x={250} y={330} width={190} height={550} rx={12} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                  {Array.from({length: 6}).map((_, i) => <circle key={i} cx={290 + (i % 3) * 55} cy={380 + Math.floor(i / 3) * 50} r={11} fill={Math.floor(f / 8 + i) % 3 === 0 ? ORANGE : PAPER} stroke={INK} strokeWidth={3} />)}
                  {[0, 1, 2].map((i) => <rect key={i} x={280} y={500 + i * 70} width={130} height={40} rx={6} fill="none" stroke={INK} strokeWidth={3} />)}
                  {/* monitors with wave graphs */}
                  {[0, 1].map((m) => (
                    <g key={m} transform={`translate(${1450 + m * 250} ${360 + m * 40})`}>
                      <rect x={0} y={0} width={220} height={150} rx={10} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                      <path d={Array.from({length: 40}).map((_, i) => `${i ? 'L' : 'M'} ${14 + i * 4.9} ${75 + Math.sin(i / 3 + f / 6 + m) * (24 + m * 10)}`).join(' ')} fill="none" stroke={m ? ORANGE : TEAL} strokeWidth={4} />
                      <line x1={110} x2={110} y1={150} y2={210} stroke={INK} strokeWidth={5} />
                    </g>
                  ))}
                  {/* vacuum pump with a gauge */}
                  <g transform="translate(1330 760)">
                    <rect x={-80} y={-60} width={160} height={120} rx={16} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                    <circle cx={0} cy={-100} r={44} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                    <line x1={0} y1={-100} x2={30 * Math.cos(-2.4 + Math.sin(f / 9) * 0.4)} y2={-100 + 30 * Math.sin(-2.4 + Math.sin(f / 9) * 0.4)} stroke={RED} strokeWidth={4} strokeLinecap="round" />
                  </g>
                  {/* coiled glass tubing */}
                  <path d={`M 440 420 ${Array.from({length: 6}).map((_, i) => `C ${500 + i * 40} 380, ${520 + i * 40} 470, ${540 + i * 40} 430`).join(' ')} L 760 360`} fill="none" stroke={INK} strokeWidth={5} opacity={0.8} />
                </g>
                {/* bench */}
                <rect x={-200} y={880} width={2320} height={30} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <rect x={-200} y={910} width={2320} height={200} fill="#ebe3d5" />
              </g>
              {space > 0 && <g transform={`translate(${C.x} ${C.y}) scale(${1 / camS}) translate(${-C.x} ${-C.y}) translate(${camX} 0)`}><Grid o={space} dx={camX * 0.5} /></g>}
              {/* the chamber, with particles bouncing inside */}
              <g opacity={1 - space}>
                <rect x={760} y={300} width={400} height={580} rx={40} fill={TEAL} fillOpacity={0.06} stroke={INK} strokeWidth={LINE} />
                <rect x={740} y={280} width={440} height={36} rx={12} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                <text x={960} y={850} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} letterSpacing={4} fill={INK} opacity={0.5}>1 mole</text>
                {/* the valve on the right side */}
                <rect x={1160} y={580} width={70} height={40} rx={8} fill={PAPER} stroke={INK} strokeWidth={LINE} />
                {Array.from({length: 110}).map((_, i) => {
                  const depth = 0.4 + random(`pd${i}`) * 0.6;
                  const sp = (0.6 + random(`ps${i}`) * 1.4) * depth;
                  const tri = (u: number) => Math.abs(((u % 2) + 2) % 2 - 1);
                  const jx = Math.sin(f / (7 + 5 * random(`jx${i}`)) + i) * 3, jy = Math.cos(f / (6 + 6 * random(`jy${i}`)) + i * 1.7) * 3;
                  const px = 790 + 340 * tri(random(`px${i}`) * 2 + (f * sp) / 120) + jx;
                  const py = 330 + 520 * tri(random(`py${i}`) * 2 + (f * sp) / 170) + jy;
                  const born = random(`born${i}`) * 26, g = ease(clamp01((f - born) / 10));
                  if (g <= 0) return null;
                  const r = (2.2 + 4.2 * depth) * (0.4 + 0.6 * g);
                  // the earlier particle look: a solid orange core inside a soft halo, no outline
                  return (
                    <g key={i} opacity={g}>
                      <circle cx={px} cy={py} r={r * 1.9} fill={ORANGE} opacity={0.18} />
                      <circle cx={px} cy={py} r={r} fill={ORANGE} opacity={0.75 + 0.25 * depth} />
                    </g>
                  );
                })}
                {/* Axo, tiny beside it, hands on the glass, and his faint reflection */}
                <g transform={`translate(${20 * arc} 0)`}>
                  <AxoSide x={600} y={880} scale={0.62} rear={1} arm={-12} />
                </g>
                <g opacity={0.12}><AxoSide x={900} y={880} scale={0.55} rear={1} arm={-12} dir={-1} /></g>
              </g>
            </g>
          </g>
          {/* the ribbon of digits (screen space): tracked by the camera, then laid out whole, then the zeros fall */}
          {f >= six && Array.from({length: shownN}).map((_, k) => {
            const x0 = 1290 + k * GAP;
            const pop = k === shownN - 1 ? clamp01((headX - x0) / GAP + 0.4) : 1;
            const sx = (x0 - GAP * (1 - pop) * 0.6 - camX) * (1 - fold) + ribbonX(k) * fold;
            const sc = 0.95 * (0.7 + 0.3 * pop) * (1 - (1 - RIB_S) * fold);
            // earthquake: the row shakes harder and harder, then the zeros drop off with gravity and a tumble
            const qs = nobody + 8, quakeEnd = qs + 34;
            const amp = f < qs || f > quakeEnd ? 0 : 12 * clamp01((f - qs) / 12) * (k < 3 ? 0.45 : 1);
            const jx = amp * Math.sin(f * 3.1 + k * 1.7), jy = amp * 0.6 * Math.cos(f * 2.7 + k * 1.3);
            const td = qs + 6 + random(`drop${k}`) * 10;
            const t = k < 3 ? 0 : Math.max(0, (f - td) / 30);
            const dy = 0.5 * 4200 * t * t, dx = (random(`dx${k}`) - 0.5) * 160 * t;
            const rot = (random(`spin${k}`) - 0.5) * 300 * t;
            if (600 + dy > 1300) return null;
            return (
              <g key={k} transform={`translate(${jx + dx} ${jy + dy}) rotate(${rot} ${sx} ${600})`}>
                <ZeroTile x={sx} y={600} s={sc} o={pop} ch={digit(k)} glow={k < 3 ? 1 : 0} color={k < 3 ? ORANGE : INK} />
              </g>
            );
          })}
          {/* foreground zeros blurring past */}
          {space > 0 && f < tStop + 10 && (
            <g opacity={0.25 * space}>
              <defs><filter id="fgblur"><feGaussianBlur stdDeviation={10} /></filter></defs>
              {[0, 1, 2].map((k) => <text key={k} x={((2200 - (f - six) * 70 - k * 700) % 2400 + 2400) % 2400 - 200} y={950 - k * 40} fontFamily={DISPLAY} fontWeight={800} fontSize={300} fill={INK} filter="url(#fgblur)">0</text>)}
            </g>
          )}
          {/* headlines on top of the swarm, on a soft paper band while we're inside it */}
          <foreignObject x={0} y={0} width={1920} height={420}>
            <Heads items={[
            {at: Math.max(chamber, pbStart + 72), text: 'This chamber: [[1 mole]] of gas'},
            {at: how, text: 'How many is that?'},
            {at: six, text: '602, then [[21 zeros]]'},
            {at: nobody, text: 'Nobody wants to write that.'},
            ]} />
          </foreignObject>
          {/* the rolling zero counter */}
          {f >= six && (
            <g opacity={fin(f, six, 8) * (1 - fold)}>
              <rect x={1610} y={900} width={250} height={110} rx={20} fill={PAPER} stroke={INK} strokeWidth={4} />
              <text x={1735} y={942} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={22} letterSpacing={3} fill={P.muted}>ZEROS</text>
              <text x={1735} y={994} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={56} fill={INK}>{zerosOut}</text>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1b. 6.02 × 10²³, and the chemist's dozen
const Egg: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <ellipse cx={x} cy={y} rx={22 * s} ry={28 * s} fill="#fffdf3" stroke={INK} strokeWidth={3.5} />
);
const Atom: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle r={22} fill={ORANGE} fillOpacity={0.4} stroke={INK} strokeWidth={3.5} /><circle r={7} fill={INK} /></g>
);
const Molecule: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-20} x2={20} y1={6} y2={6} stroke={INK} strokeWidth={5} />
    <circle cx={-20} cy={6} r={15} fill={TEAL} fillOpacity={0.4} stroke={INK} strokeWidth={3} />
    <circle cx={20} cy={6} r={15} fill={TEAL} fillOpacity={0.4} stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={-14} r={18} fill={ORANGE} fillOpacity={0.45} stroke={INK} strokeWidth={3} />
  </g>
);

export const V1Notation: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const write = cue('write it like this', 0.02), sixp = cue('six-point-oh-two times', 0.08), avo = cue("Avogadro's", 0.22), parts = cue('how many particles', 0.3);
  const dozen = cue("chemist's dozen", 0.42), twelve = cue('dozen is twelve', 0.5), moleIs = cue('a mole is', 0.6), atoms = cue('atoms', 0.8), mols = cue('molecules', 0.86);
  const W = 76, X0 = 960 - (24 * W) / 2;
  const squeeze = tsp(f, write + 4, write + 26, 0, 1);
  // starts on the fallen dominoes from the previous scene; on "write it like this" they slide into ×10²³ and the number forms
  const gather = inOut((f - 2) / 18);
  const resolve = clamp01((f - 10) / 12);
  const spoolX = 1200;
  const toCorner = tio(f, parts, parts + 22);
  const numX = 960, numY = 560 + (380 - 560) * toCorner, numS = 1 - 0.4 * toCorner;
  const paperBack = inOut((f - avo + 6) / 60);   // slow, eased cross-fade from the grid to plain paper
  const eggs = fin(f, twelve, 6);
  const row = fin(f, moleIs, 10);
  const icon = f < atoms ? 'egg' : f < mols ? 'atom' : 'mol';
  const slideRow = (f - moleIs) * 3;
  return (
    <Frame enter="cut" push={0.015}
      html={
        <>
          <SfxList items={[[2, 'swish', 0.35, 1.3], [20, 'clack', 0.45], [sixp, 'pop', 0.4], [parts, 'slide', 0.3], [twelve, 'pop', 0.35], [moleIs, 'rise', 0.3, 1.2], [atoms, 'pop', 0.35, 1.2], [mols, 'pop', 0.35, 1.3]]} />
          <Heads items={[
            {at: write, text: 'Write it like [[this:]]'},
            {at: avo, text: "[[Avogadro's]] number"},
            {at: dozen, text: "A mole is a [[chemist's dozen]]"},
            {at: moleIs, text: 'Same count, [[anything]] you count'},
          ]} />
        </>
      }
      svg={
        <g>
          <Grid o={1 - paperBack} />
          {/* the ribbon squeezes like an accordion into a spool */}
          {resolve < 1 && (
            <g opacity={1 - resolve}>
              {Array.from({length: 24}).map((_, k) => {
                const sc = 0.95 * RIB_S;
                const x0 = ribbonX(k);
                if (k >= 3) return null;   // the zeros fell away in the earthquake
                const x = x0 + (760 + (k - 1) * 70 - x0) * gather;
                const rot = 0;
                return (
                  <g key={k} transform={`rotate(${rot} ${x + 34 * sc} ${600 + 46 * sc})`} opacity={k < 3 ? 1 : 1 - 0.7 * gather}>
                    <ZeroTile x={x} y={600} s={sc * (k < 3 ? 1 : 1 - 0.5 * gather)} ch={k === 0 ? '6' : k === 2 ? '2' : '0'} glow={k < 3 ? 1 : 0} color={k < 3 ? ORANGE : INK} />
                  </g>
                );
              })}
            </g>
          )}
          {resolve > 0 && (
            <g opacity={resolve} transform={`translate(${numX} ${numY}) scale(${numS * (f > sixp && f < sixp + 20 ? 1 + 0.05 * Math.sin(((f - sixp) / 20) * Math.PI) : 1)})`}>
              <T x={0} y={50} size={170}>6.02 × 10<tspan baselineShift="super" fontSize="0.58em" fill={ORANGE}>23</tspan></T>
            </g>
          )}
          {f >= parts && <T x={960} y={480} size={44} font={SANS} weight={800} o={fin(f, parts + 10, 10)}>1 mole = 6.02 × 10<Sp>23</Sp> particles</T>}
          {/* a dozen is twelve: eggs */}
          {eggs > 0 && (
            <g>
              {Array.from({length: 12}).map((_, i) => <g key={i} opacity={fin(f, twelve + i * 2, 5)}><Egg x={608 + i * 64} y={620} s={tsp(f, twelve + i * 2, twelve + i * 2 + 10, 0.4, 1)} /></g>)}
              <T x={960} y={710} size={40} font={SANS} weight={800}>1 dozen = 12</T>
            </g>
          )}
          {/* a mole: a row that runs off the screen; the icons change, the count never does */}
          {row > 0 && (
            <g opacity={row}>
              {Array.from({length: 40}).map((_, i) => {
                const x = 140 + i * 64 - (slideRow % 64);
                if (x > 2000) return null;
                return <g key={i}>{icon === 'egg' ? <Egg x={x} y={880} s={0.8} /> : icon === 'atom' ? <Atom x={x} y={880} s={0.9} /> : <Molecule x={x} y={884} s={0.85} />}</g>;
              })}
              <rect x={680} y={930} width={560} height={70} rx={35} fill={PAPER} stroke={INK} strokeWidth={4} />
              <T x={960} y={978} size={38} font={SANS} weight={800}>1 mole = 6.02 × 10<Sp>23</Sp></T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1c. the rule: 1 ≤ a < 10, then a power of ten
export const V1Rule: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const called = cue('called scientific notation', 0.03), two = cue('two parts', 0.12), front = cue('A front number', 0.2), raised = cue('ten raised', 0.32);
  const fits = cue('fits', 0.42), sixty = cue('Sixty-two', 0.48), neither = cue('neither does', 0.58), power = cue('The power counts', 0.72), times = cue('twenty-three times', 0.9);
  const split = tio(f, two, two + 18);
  const G = {x0: 525, y: 830, dec: 290, lo: -1, hi: 2};
  // what sits in the "a" block, and its exponent
  const phase = f < sixty ? 0 : f < neither ? 1 : f < power ? 2 : 3;
  const hop1 = tio(f, sixty + 26, sixty + 44), hop2 = tio(f, neither + 26, neither + 44);
  let digits = '602', pos = 1, expA = '23', expB = '23', expT = 0, val = 6.02, ok = true, flash = 0;
  if (phase === 1) { digits = '62'; pos = 2 - hop1; expA = '0'; expB = '1'; expT = hop1; val = 62 / Math.pow(10, hop1); ok = hop1 > 0.5; flash = clamp01((f - sixty - 8) / 16); }
  if (phase === 2) { digits = '06'; pos = 1 + hop2; expA = '0'; expB = '−1'; expT = hop2; val = 0.6 * Math.pow(10, hop2); ok = hop2 > 0.5; flash = clamp01((f - neither - 8) / 16); }
  const pingOk = phase === 0 ? clamp01((f - fits) / 18) : 0;
  const chain = phase === 3 ? clamp01((f - power) / 40) : 0;
  const squash = tio(f, times, times + 18);
  const nLinks = Math.round(23 * chain);
  const aX = 760 - 130 * split, eX = 1160 + 130 * split;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[two, 'slide', 0.35], [fits, 'ding', 0.35], [sixty, 'thud', 0.35], [sixty + 10, 'blip', 0.45, 0.5], [sixty + 26, 'swish', 0.3, 1.4], [sixty + 44, 'ding', 0.3],
            [neither, 'thud', 0.35], [neither + 10, 'blip', 0.45, 0.5], [neither + 26, 'swish', 0.3, 1.4], [neither + 44, 'ding', 0.3],
            ...Array.from({length: 23}).map((_, k) => [power + Math.round((k / 23) * 40), 'tick', 0.14, 1.2 + k * 0.03] as [number, 'tick', number, number]), [times + 18, 'clack', 0.5]]} />
          <Heads items={[
            {at: called, text: '[[Scientific]] notation'},
            {at: two, text: 'Always [[two]] parts'},
            {at: front, text: 'A front number: [[1 ≤ a < 10]]'},
            {at: raised, text: 'Then [[× 10]] to a power'},
            {at: fits, text: '6.02 fits.'},
            {at: sixty, text: '62 doesn\'t…'},
            {at: neither, text: '…neither does 0.6'},
            {at: power, text: 'The power counts the [[×10s]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {/* block a, with the sliding decimal */}
          <g opacity={fin(f, 0, 8)}>
            <rect x={aX - 230} y={420} width={460} height={200} rx={30} fill={PAPER} stroke={INK} strokeWidth={LINE} opacity={split} />
            <T x={aX} y={400} size={30} font={SANS} weight={800} color={P.muted} o={split}>front number a</T>
            {phase === 0 || phase === 3 ? <T x={aX} y={570} size={130}>6.02</T> : <DecNum x={aX - (digits.length * 0.6 * 130) / 2} y={570} digits={digits} pos={pos} size={130} color={ok ? INK : RED} />}
            {/* the power of ten */}
            <rect x={eX - 210} y={420} width={420} height={200} rx={30} fill={PAPER} stroke={INK} strokeWidth={LINE} opacity={split} />
            <T x={eX} y={400} size={30} font={SANS} weight={800} color={P.muted} o={split}>× 10 to a power</T>
            <T x={eX + 50} y={570} size={130} anchor="end">×10</T>
            {phase === 3 ? (
              <T x={eX + 58} y={505} size={70} anchor="start" color={ORANGE} s={squash > 0 ? 1 + 0.4 * Math.sin(squash * Math.PI) : 1}>23</T>
            ) : (
              <RollT x={eX + 58} y={505} a={expA} b={expB} t={expT} size={70} color={ORANGE} anchor="start" />
            )}
          </g>
          {/* the gauge under a */}
          <g opacity={fin(f, front, 10) * (1 - (phase === 3 ? fin(f, power, 10) : 0))}>
            <Gauge {...G} />
            <Marker x={gaugeX(Math.max(0.1, Math.min(100, val)), G.x0, G.dec, G.lo)} y={G.y} ok={ok} flash={phase === 0 ? pingOk : flash} />
          </g>
          {/* the chain of ×10 tags, compressing into the exponent */}
          {chain > 0 && (
            <g opacity={1 - squash}>
              {Array.from({length: nLinks}).map((_, k) => {
                const r = Math.floor(k / 12), c = k % 12;
                const x0 = 300 + c * 120, y0 = 790 + r * 90;
                const x = x0 + (eX + 150 - x0) * squash, y = y0 + (480 - y0) * squash;
                return <UnitTag key={k} x={x} y={y} text="×10" color={k % 2 ? INK : ORANGE} s={0.82 * (1 - 0.7 * squash)} />;
              })}
              <T x={960} y={1010} size={50} color={ORANGE} o={chain}>{nLinks} × 10</T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1d. slide the decimal; negative exponents
export const V1Slide: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const land = cue('To land', 0.02), left = cue('Slide it left', 0.12), right = cue('Slide it right', 0.22), zero = cue('Zero-point-zero', 0.32);
  const four = cue('slide four places', 0.48), get = cue('you get four-point-five', 0.6), negative = cue('A negative exponent', 0.74), divide = cue('divide by ten', 0.84);
  const demoL = fin(f, left, 8) * (1 - fin(f, right - 4, 6));
  const demoR = fin(f, right, 8) * (1 - fin(f, zero - 4, 6));
  const hl = tio(f, left + 10, left + 26), hr = tio(f, right + 10, right + 26);
  const mainO = fin(f, zero, 10);
  const span = Math.max(40, get - four);
  const hopT = clamp01((f - four) / span) * 4;          // 0..4 hops
  const pos = 1 + hopT;
  const expV = -Math.floor(hopT + 0.5);
  const value = 0.00045 * Math.pow(10, hopT);
  const G = {x0: 360, y: 840, dec: 200, lo: -4, hi: 2};
  const ghost = f >= negative ? clamp01((f - negative) / Math.max(40, divide + 30 - negative)) * 4 : 0;
  return (
    <Frame
      html={
        <>
          <SfxList items={[[left + 10, 'swish', 0.3, 1.5], [right + 10, 'swish', 0.3, 1.3], [zero, 'pop', 0.35],
            ...[0, 1, 2, 3].map((k) => [four + Math.round((k + 0.5) * span / 4), 'tap', 0.4, 1.1 + 0.08 * k] as [number, 'tap', number, number]), [get, 'ding', 0.35],
            ...[0, 1, 2, 3].map((k) => [negative + Math.round((k + 0.5) * Math.max(40, divide + 30 - negative) / 4), 'blip', 0.22, 1 - 0.08 * k] as [number, 'blip', number, number])]} />
          <Heads items={[
            {at: land, text: 'Slide the [[decimal point]]'},
            {at: left, text: 'Slide [[left]]: exponent [[up]]'},
            {at: right, text: 'Slide [[right]]: exponent [[down]]'},
            {at: zero, text: '0.00045'},
            {at: get, text: '= [[4.5 × 10^{−4}]]'},
            {at: negative, text: 'Negative exponent = [[÷10]] that many times'},
          ]} />
        </>
      }
      svg={
        <g>
          {demoL > 0 && (
            <g opacity={demoL}>
              <DecNum x={700} y={600} digits="45" pos={2 - hl} size={150} />
              <T x={980} y={600} size={120} anchor="start">× 10</T>
              <RollT x={1225} y={530} a="0" b="1" t={hl} size={74} color={ORANGE} anchor="start" />
              <path d="M 820 680 L 740 680 M 760 664 L 740 680 L 760 696" stroke={ORANGE} strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          )}
          {demoR > 0 && (
            <g opacity={demoR}>
              <DecNum x={640} y={600} digits="045" pos={1 + hr} size={150} />
              <T x={1010} y={600} size={120} anchor="start">× 10</T>
              <RollT x={1255} y={530} a="0" b="−1" t={hr} size={74} color={ORANGE} anchor="start" />
              <path d="M 740 680 L 820 680 M 800 664 L 820 680 L 800 696" stroke={TEAL} strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          )}
          {mainO > 0 && (
            <g opacity={mainO}>
              <DecNum x={480} y={600} digits="000045" pos={pos} size={150} color={value >= 1 ? TEAL : INK} />
              <T x={1120} y={600} size={120} anchor="start">× 10</T>
              <T x={1365} y={530} size={74} anchor="start" color={ORANGE}>{expV === 0 ? '0' : `−${-expV}`}</T>
              {/* a ÷10 tag for each hop */}
              {[0, 1, 2, 3].map((k) => hopT > k + 0.5 && <UnitTag key={k} x={765 + k * 130} y={420} text="÷10" color={ORANGE} s={tsp(f, four + Math.round((k + 0.5) * span / 4), four + Math.round((k + 0.5) * span / 4) + 10, 0.5, 0.85)} />)}
              <Gauge {...G} />
              <Marker x={gaugeX(value, G.x0, G.dec, G.lo)} y={G.y} ok={value >= 1} />
              {/* ghost replay: 4.5 shrinks by ten at each hop */}
              {ghost > 0 && (
                <g opacity={0.45}>
                  <Marker x={gaugeX(4.5 / Math.pow(10, ghost), G.x0, G.dec, G.lo)} y={G.y + 90} ok={false} />
                  <T x={gaugeX(4.5 / Math.pow(10, ghost), G.x0, G.dec, G.lo)} y={G.y + 150} size={36} font={SANS} weight={800} color={P.muted}>{(4.5 / Math.pow(10, Math.round(ghost))).toFixed(Math.max(1, Math.round(ghost) + 1))}</T>
                </g>
              )}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1e. multiplying: front numbers multiply, exponents add
const ZeroRibbon: React.FC<{x: number; y: number; n: number; lead?: string; s?: number; o?: number}> = ({x, y, n, lead = '1', s = 0.7, o = 1}) => (
  <g opacity={o}>
    {lead && <ZeroTile x={x} y={y} s={s} ch={lead} color={ORANGE} />}
    {Array.from({length: n}).map((_, i) => <ZeroTile key={i} x={x + (i + (lead ? 1 : 0)) * 54 * s / 0.7} y={y} s={s} />)}
  </g>
);

export const V1Mult: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const payoff = cue('Now the payoff', 0.01), mult = cue('When you multiply', 0.06), tenK = cue('Ten thousand times', 0.16), meet = cue('four zeros meet', 0.22);
  const seven = cue('seven zeros', 0.28), so3 = cue('So three times', 0.33), is6 = cue('is six times', 0.45), outside = cue('lands outside', 0.52);
  const five = cue('Five times ten to the three', 0.64), twenty = cue('twenty times ten', 0.8), two6 = cue('two times ten to the six', 0.92);
  const lanes = fin(f, mult, 10) * (1 - fin(f, outside - 6, 8));
  const inL = tio(f, tenK, tenK + 20), lock = tsp(f, meet, meet + 14, 0, 1);
  const lx = -400 + (640 + 400) * inL + 60 * lock, rx = 2200 + (1030 - 2200) * inL - 60 * lock;
  const fr = fin(f, so3, 10), frJoin = tio(f, so3 + 30, so3 + 50);
  const merge = tio(f, is6 - 4, is6 + 18);
  const fix = fin(f, five, 10);
  const lands = fin(f, twenty, 8), flash = clamp01((f - twenty - 8) / 16), hop = tio(f, twenty + 34, twenty + 52);
  const G = {x0: 520, y: 860, dec: 300, lo: -1, hi: 2};
  return (
    <Frame
      html={
        <>
          <SfxList items={[[tenK, 'whoosh', 0.3, 1.2], [meet + 2, 'clack', 0.6], [seven, 'ding', 0.3], [so3 + 30, 'pop', 0.4], [is6, 'slide', 0.35], [is6 + 18, 'ding', 0.35],
            [five, 'slide', 0.3], [twenty, 'thud', 0.35], [twenty + 10, 'blip', 0.45, 0.5], [twenty + 34, 'swish', 0.3, 1.4], [twenty + 52, 'ding', 0.35]]} />
          <Heads items={[
            {at: payoff, text: 'Now the payoff: [[calculating]]'},
            {at: mult, text: 'Multiply: fronts [[×]], exponents [[+]]'},
            {at: tenK, text: '10,000 × 1,000'},
            {at: seven, text: '4 zeros + 3 zeros = [[7]]'},
            {at: so3, text: '(3 × 10^{4}) × (2 × 10^{3})'},
            {at: is6, text: '= [[6 × 10^{7}]]'},
            {at: outside, text: 'Outside 1 to 10? [[Fix it.]]'},
            {at: twenty, text: '20 × 10^{5} = [[2 × 10^{6}]]'},
          ]} />
        </>
      }
      svg={
        <g>
          {lanes > 0 && (
            <g opacity={lanes * (1 - merge)}>
              <T x={150} y={470} size={28} font={SANS} weight={800} color={P.muted} anchor="start">FRONT NUMBERS</T>
              <T x={150} y={690} size={28} font={SANS} weight={800} color={P.muted} anchor="start">ZEROS</T>
              <line x1={150} x2={1770} y1={580} y2={580} stroke={INK} strokeOpacity={0.12} strokeWidth={3} />
              {/* zeros lane: four zeros from the left, three from the right, locking end to end */}
              <g transform={`translate(0 ${lock > 0 && lock < 1 ? -8 * Math.sin(lock * Math.PI) : 0})`}>
                <ZeroRibbon x={lx} y={760} n={4} />
                <ZeroRibbon x={rx} y={760} n={3} lead="" />
              </g>
              {f >= seven && <UnitTag x={1530} y={760} text="4 + 3 = 7" color={TEAL} s={tsp(f, seven, seven + 12, 0.6, 1.1)} />}
              {/* front lane: 3 × 2 forms a 6 */}
              {fr > 0 && (
                <g opacity={fr}>
                  <T x={800 + 160 * frJoin} y={500} size={110} o={1 - frJoin}>3</T>
                  <T x={960} y={500} size={80} color={P.muted} o={1 - frJoin}>×</T>
                  <T x={1120 - 160 * frJoin} y={500} size={110} o={1 - frJoin}>2</T>
                  {frJoin > 0 && <T x={960} y={500} size={130} color={ORANGE} o={frJoin} s={tsp(f, so3 + 30, so3 + 44, 0.6, 1)}>6</T>}
                </g>
              )}
            </g>
          )}
          {merge > 0 && f < outside && (
            <g opacity={merge} transform={`translate(960 640) scale(${tsp(f, is6 - 4, is6 + 18, 0.6, 1)})`}>
              <T x={0} y={40} size={170}>6 × 10<Sp>7</Sp></T>
            </g>
          )}
          {fix > 0 && (
            <g opacity={fix}>
              <T x={960} y={480} size={80} color={P.muted}>(5 × 10<Sp>3</Sp>) × (4 × 10<Sp>2</Sp>)</T>
              {lands > 0 && (
                <g opacity={lands}>
                  <DecNum x={760 - 0} y={680} digits="20" pos={2 - hop} size={140} color={hop > 0.5 ? TEAL : RED} />
                  <T x={1100} y={680} size={120}>× 10</T>
                  <RollT x={1222} y={612} a="5" b="6" t={hop} size={70} color={ORANGE} anchor="start" />
                  <Gauge {...G} />
                  <Marker x={gaugeX(20 / Math.pow(10, hop), G.x0, G.dec, G.lo)} y={G.y} ok={hop > 0.5} flash={hop > 0.5 ? clamp01((f - twenty - 52) / 16) : flash} />
                </g>
              )}
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1f. dividing: zeros cancel in pairs
export const V1Div: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = useCue(props);
  const div = cue('When you divide', 0.02), cancel = cue('cancel in pairs', 0.3), eight = cue('Eight times', 0.45), is2 = cue('is two times', 0.85);
  const lanes = fin(f, cancel - 4, 10);
  const fr = tio(f, eight + 20, eight + 40);
  const popAt = eight + Math.round((is2 - eight) * 0.45);
  const res = fin(f, is2, 10);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[eight, 'slide', 0.3], ...[0, 1].map((k) => [popAt + k * 2, 'pop', 0.5, 1 + 0.1 * k] as [number, 'pop', number, number]), [eight + 40, 'pop', 0.4], [is2, 'ding', 0.4]]} />
          <Heads items={[
            {at: div, text: 'Divide: fronts [[÷]], exponents [[−]]'},
            {at: cancel, text: 'Zeros [[cancel]] in pairs.'},
            {at: eight, text: '(8 × 10^{6}) ÷ (4 × 10^{2})'},
            {at: is2, text: '= [[2 × 10^{4}]]'},
          ]} />
        </>
      }
      svg={
        <g opacity={lanes}>
          <T x={150} y={470} size={28} font={SANS} weight={800} color={P.muted} anchor="start">FRONT NUMBERS</T>
          <T x={150} y={690} size={28} font={SANS} weight={800} color={P.muted} anchor="start">ZEROS</T>
          {/* front lane */}
          <T x={810 + 150 * fr} y={500} size={110} o={1 - fr}>8</T>
          <T x={960} y={500} size={80} color={P.muted} o={1 - fr}>÷</T>
          <T x={1110 - 150 * fr} y={500} size={110} o={1 - fr}>4</T>
          {fr > 0 && <T x={960} y={500} size={130} color={ORANGE} o={fr}>2</T>}
          {/* zeros lane, as a fraction: six on top, two below; pairs pop */}
          <line x1={740} x2={1240} y1={760} y2={760} stroke={INK} strokeWidth={5} />
          {Array.from({length: 6}).map((_, i) => {
            const gone = i < 2 && f >= popAt + i * 2;
            const settle = tio(f, popAt + 16, popAt + 34);
            const x = 780 + i * 72 - (i >= 2 ? 2 * 72 * settle * 0.5 : 0);
            return gone ? <Burst key={i} x={780 + i * 72} y={705} t={clamp01((f - popAt - i * 2) / 14)} color={ORANGE} r={30} /> : <ZeroTile key={i} x={x} y={705} s={0.6} />;
          })}
          {Array.from({length: 2}).map((_, i) => (
            f >= popAt + i * 2 ? <Burst key={i} x={780 + i * 72} y={820} t={clamp01((f - popAt - i * 2) / 14)} color={ORANGE} r={30} /> : <ZeroTile key={i} x={780 + i * 72} y={820} s={0.6} />
          ))}
          {f >= popAt + 20 && <UnitTag x={1480} y={705} text="6 − 2 = 4" color={TEAL} s={tsp(f, popAt + 20, popAt + 32, 0.6, 1)} />}
          {res > 0 && (
            <g opacity={res} transform={`translate(1500 500) scale(${tsp(f, is2, is2 + 14, 0.6, 1)})`}>
              <rect x={-230} y={-90} width={460} height={140} rx={30} fill={PAPER} stroke={TEAL} strokeWidth={5} />
              <T x={0} y={20} size={100}>2 × 10<Sp>4</Sp></T>
            </g>
          )}
        </g>
      }
    />
  );
};

// ------------------------------------------------------------------ 1g. adding and subtracting: match the units first
export const V1AddSub: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = props;
  const cue = useCue(props);
  const diff = cue('Adding and subtracting', 0.01), dollars = cue('Three dollars plus', 0.05), five = cue('five of anything', 0.1), fuse = cue('Two dimes is', 0.15);
  const match = cue('units match', 0.21), powers = cue('Powers of ten', 0.28), term = cue('Three times ten to the five', 0.33), turn = cue('turn the second', 0.42);
  const done = cue('Three-point-two times', 0.52), subw = cue('Subtracting works', 0.6), minus = cue('three dollars minus', 0.66), two8 = cue('two-point-eight', 0.74);
  const matchE = cue('Match the exponents', 0.84);
  const addPhase = f < subw - 4;
  const fusion = tio(f, fuse + 4, fuse + 22);
  const toTags = tio(f, powers, powers + 16);
  const roll = tio(f, turn + 6, turn + 26);
  const join = tio(f, done - 6, done + 10);
  const bills = [560, 790, 1020];
  // subtract phase
  const subIn = fin(f, subw, 10);
  const sFuse = tio(f, minus + 4, minus + 22), lift = tio(f, minus + 24, minus + 44);
  const sTags = tio(f, matchE - 26, matchE - 10);
  const sRoll = tio(f, matchE - 6, matchE + 14), sJoin = tio(f, matchE + 16, matchE + 32);
  const endPair = fin(f, D - 34, 10);
  return (
    <Frame
      html={
        <>
          <SfxList items={[[dollars, 'slide', 0.35], [five, 'blip', 0.4, 0.6], [fuse + 4, 'swish', 0.35], [fuse + 22, 'clack', 0.5], [match, 'ding', 0.3], [powers, 'whoosh', 0.3, 1.3],
            [turn + 6, 'tap', 0.4], [done, 'ding', 0.4], [subw, 'slide', 0.3], [minus + 4, 'swish', 0.35], [minus + 24, 'whoosh', 0.3, 1.4], [two8, 'ding', 0.35], [matchE + 16, 'clack', 0.5], [D - 34, 'chime', 0.3]]} />
          <Heads items={[
            {at: diff, text: 'Adding and subtracting: [[different]]'},
            {at: dollars, text: '$3 + 2 dimes'},
            {at: five, text: '5 of [[what?]]'},
            {at: fuse, text: '2 dimes = $0.20'},
            {at: match, text: '= [[$3.20]]'},
            {at: powers, text: 'Powers of ten are your [[units.]]'},
            {at: done, text: '= [[3.2 × 10^{5}]]'},
            {at: subw, text: 'Subtracting: same idea'},
            {at: two8, text: '$3 − $0.20 = [[$2.80]]'},
            {at: matchE, text: 'Match the exponents first.'},
          ]} />
        </>
      }
      svg={
        <g>
          {/* a faint grid on the table */}
          {Array.from({length: 24}).map((_, i) => <line key={i} x1={i * 84} x2={i * 84} y1={300} y2={1040} stroke={INK} strokeOpacity={0.05} strokeWidth={2} />)}
          {addPhase && (
            <g>
              <g opacity={1 - toTags}>
                {bills.map((x) => <Bill key={x} x={x} y={560} s={0.86} />)}
                {fusion < 1 && [1280, 1390].map((x, i) => <Dime key={x} x={x + (1335 - x) * fusion} y={560} o={1 - fusion * 0.9} />)}
                {fusion > 0 && <Bill x={1335} y={560} fill={0.2 * fusion} label="$0.20" o={fusion} s={0.7 + 0.3 * fusion} />}
                {f >= five && f < fuse && <T x={1600} y={580} size={80} color={RED} o={fin(f, five, 6)}>5 ?</T>}
                {f >= match && <T x={1640} y={590} size={90} color={TEAL} o={fin(f, match, 8)}>3.2</T>}
              </g>
              {toTags > 0 && (
                <g opacity={toTags}>
                  {/* match cut: bills become ×10⁵, the dime-bill becomes ×10⁴ */}
                  <g opacity={1 - join}>
                    <T x={600} y={600} size={120} anchor="end">3</T>
                    <T x={740} y={600} size={96}>×10<Sp>5</Sp></T>
                  </g>
                  <T x={960} y={590} size={100} color={P.muted} o={1 - join}>+</T>
                  <g transform={`translate(${-520 * join} 0)`} opacity={1 - join}>
                    <RollT x={1250} y={600} a="2" b="0.2" t={roll} size={120} anchor="end" />
                    <T x={1355} y={600} size={96}>×10</T>
                    <RollT x={1450} y={560} a="4" b="5" t={roll} size={58} anchor="start" color={ORANGE} />
                  </g>
                  {join > 0 && (
                    <g opacity={join} transform={`translate(960 570) scale(${tsp(f, done - 6, done + 12, 0.7, 1)})`}>
                      <rect x={-330} y={-100} width={660} height={190} rx={40} fill={PAPER} stroke={TEAL} strokeWidth={5} />
                      <T x={0} y={30} size={110} color={TEAL}>3.2 × 10<Sp>5</Sp></T>
                    </g>
                  )}
                </g>
              )}
            </g>
          )}
          {!addPhase && (
            <g opacity={subIn * (1 - endPair)}>
              <g opacity={1 - sTags}>
                {bills.map((x, i) => <Bill key={x} x={x} y={560} s={0.86} fill={i === 2 ? 1 - 0.2 * lift : 1} />)}
                {sFuse < 1 && [1280, 1390].map((x) => <Dime key={x} x={x + (1335 - x) * sFuse} y={560} o={1 - sFuse * 0.9} />)}
                {sFuse > 0 && <Bill x={1335 + (1020 - 1335) * lift} y={560 - 160 * lift} fill={0.2} label="−$0.20" o={sFuse * (1 - 0.6 * lift)} s={0.7} />}
                {f >= two8 && <T x={1640} y={590} size={90} color={TEAL} o={fin(f, two8, 8)}>2.8</T>}
              </g>
              {sTags > 0 && (
                <g opacity={sTags}>
                  <T x={600} y={600} size={120} anchor="end">3</T>
                  <T x={740} y={600} size={96}>×10<Sp>5</Sp></T>
                  <T x={960} y={590} size={100} color={P.muted}>−</T>
                  <RollT x={1250} y={600} a="2" b="0.2" t={sRoll} size={120} anchor="end" />
                  <T x={1355} y={600} size={96}>×10</T>
                  <RollT x={1450} y={560} a="4" b="5" t={sRoll} size={58} anchor="start" color={ORANGE} />
                  {sJoin > 0 && <T x={960} y={820} size={110} color={TEAL} o={sJoin}>= 2.8 × 10<Sp>5</Sp></T>}
                </g>
              )}
            </g>
          )}
          {/* the two results, side by side */}
          {endPair > 0 && (
            <g opacity={endPair}>
              <g transform="translate(600 640)"><rect x={-300} y={-110} width={600} height={190} rx={40} fill={PAPER} stroke={TEAL} strokeWidth={5} /><T x={0} y={30} size={110}>3.2 × 10<Sp>5</Sp></T><T x={0} y={150} size={34} font={SANS} weight={800} color={P.muted}>added</T></g>
              <g transform="translate(1320 640)"><rect x={-300} y={-110} width={600} height={190} rx={40} fill={PAPER} stroke={TEAL} strokeWidth={5} /><T x={0} y={30} size={110}>2.8 × 10<Sp>5</Sp></T><T x={0} y={150} size={34} font={SANS} weight={800} color={P.muted}>subtracted</T></g>
            </g>
          )}
        </g>
      }
    />
  );
};

export const v1e = {V1Mole, V1Notation, V1Rule, V1Slide, V1Mult, V1Div, V1AddSub};
