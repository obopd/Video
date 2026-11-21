// Scenes for "What if the Sun disappeared?"
import React from 'react';
import {useCurrentFrame, random} from 'remotion';
import {C, W, H} from '../../lib/theme';
import {Canvas, Stars, Glow, Label, tween, mix} from '../../lib/shapes';
import {Globe} from '../../lib/globe';
import {DetailedSun, BrightStars} from '../../lib/bodies';
import {makeCue} from '../../lib/cues';
import type {SceneProps} from '../../lib/types';
import {BODIES, CX, CY, Orbits, PlanetAt, orbitPos, driftPos, lightFrom2D} from './system';

const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/** 1. The solar system, then the Sun blinks out. Planets keep orbiting (gravity hasn't "heard" yet). */
export const SunVanishes: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const gone = cue('vanishes', 0.35);
  const zoom = tween(f, 0, props.durationInFrames, 1.3, 1.45);
  const flash = tween(f, gone, gone + 6, 1, 1.25) * tween(f, gone + 6, gone + 16, 1, 0);
  const sunScale = f < gone ? 1 : flash;
  const ring = tween(f, gone + 4, gone + 40, 0, 1);
  const earthLabel = tween(f, 20, 45, 0, 1) * tween(f, gone - 15, gone, 1, 0);

  const placed = BODIES.map((b) => ({b, ...orbitPos(b, f + 400)}));
  const behind = placed.filter((p) => p.y < CY);
  const front = placed.filter((p) => p.y >= CY);
  return (
    <Canvas>
      <Stars seed="s1" />
      <BrightStars seed="b1" />
      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        <Orbits />
        {behind.map((p) => <PlanetAt key={p.b.name} b={p.b} x={p.x} y={p.y} lit={1} label={p.b.name === 'Earth' ? earthLabel : 0} />)}
        <DetailedSun cx={CX} cy={CY} r={66} scale={sunScale} glow={f < gone ? 1 : tween(f, gone, gone + 20, 1, 0)} />
        {ring > 0 && ring < 1 && (
          <circle cx={CX} cy={CY} r={70 + ring * 260} fill="none" stroke={C.sunCore} strokeWidth={4 * (1 - ring)} opacity={1 - ring} />
        )}
        {front.map((p) => <PlanetAt key={p.b.name} b={p.b} x={p.x} y={p.y} lit={1} label={p.b.name === 'Earth' ? earthLabel : 0} />)}
      </g>
    </Canvas>
  );
};

/** Title card between the hook and the explanation. */
export const TitleCard: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const t = (props.title as string) ?? 'What if the Sun disappeared?';
  const inA = tween(f, 0, 18, 0, 1);
  const out = tween(f, props.durationInFrames - 12, props.durationInFrames, 1, 0);
  return (
    <Canvas>
      <Stars seed="title" drift={0.3} />
      <BrightStars seed="bt" count={6} />
      <g opacity={inA * out} transform={`translate(0 ${(1 - inA) * 20})`}>
        <Label x={W / 2} y={H / 2 + 20} size={96} weight={800}>{t}</Label>
        <rect x={W / 2 - 60} y={H / 2 + 60} width={120} height={8} rx={4} fill={C.accent} />
      </g>
    </Canvas>
  );
};

/** 2. The last sunlight (and the change in gravity) still racing toward Earth for 8m20s. */
export const LightDelay: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = makeCue(props);
  const sx = 240, ex = 1540, ey = 580, er = 150;
  const start = Math.round(D * 0.06), arrive = Math.round(D * 0.93);
  const edge = tween(f, start, arrive, sx, ex - er, (x) => x); // constant speed, like light
  const seconds = tween(f, start, arrive, 0, 500, (x) => x);
  const grav = tween(f, cue('gravity', 0.6) - 10, cue('gravity', 0.6) + 10, 0, 1);
  const daylight = tween(f, arrive - 2, arrive + 18, 1, 0);
  return (
    <Canvas>
      <Stars seed="s2" drift={0.05} />
      <BrightStars seed="b2" count={5} />
      {/* where the sun was */}
      <circle cx={sx} cy={ey} r={80} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="8 12" opacity={0.6} />
      <Label x={sx} y={ey + 140} size={28} color={C.muted}>Sun (gone)</Label>
      {/* remaining sunlight: everything right of the trailing edge */}
      <defs>
        <linearGradient id="beam" x1="0" x2="1">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.04} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0.24} />
        </linearGradient>
        <linearGradient id="photon" x1="0" x2="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity={0} />
          <stop offset="1" stopColor="#fff3c4" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={edge} y={ey - 210} width={Math.max(0, ex - edge)} height={420} fill="url(#beam)" />
      {Array.from({length: 90}).map((_, i) => {
        const y = ey - 190 + random(`py${i}`) * 380;
        const x = ((random(`px${i}`) * 1600 + f * 9) % 1400) + sx;
        if (x < edge || x > ex - er * 0.7) return null;
        const len = 20 + random(`pl${i}`) * 40;
        return (
          <g key={i}>
            <rect x={x - len} y={y - 1.5} width={len} height={3} rx={1.5} fill="url(#photon)" opacity={0.8} />
            <circle cx={x} cy={y} r={2.6} fill="#fffbe6" />
          </g>
        );
      })}
      {/* trailing edge = last light, and the gravity change travelling with it */}
      <line x1={edge} x2={edge} y1={ey - 220} y2={ey + 220} stroke={C.sunCore} strokeWidth={3} opacity={0.6} />
      <g opacity={grav}>
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M ${edge - 30 - k * 26} ${ey - 240} Q ${edge + 10 - k * 26} ${ey} ${edge - 30 - k * 26} ${ey + 240}`}
                fill="none" stroke={C.accent} strokeWidth={4} opacity={0.8 - k * 0.25} />
        ))}
        <Label x={edge - 60} y={ey - 260} size={26} color={C.accent} anchor="end">gravity</Label>
      </g>
      <Globe cx={ex} cy={ey} r={er} lon={-30 + f * 0.12} lat={18} light={[-80, 5]} daylight={daylight} cityLights={1 - daylight} />
      <Label x={ex} y={ey + er + 60} size={30}>Earth</Label>
      {/* clock */}
      <Label x={W / 2} y={170} size={96} weight={800}>{fmtClock(seconds)}</Label>
      <Label x={W / 2} y={225} size={28} color={C.muted} weight={500}>since the Sun vanished</Label>
    </Canvas>
  );
};

/** 3. Lights out, then every planet flies off along a straight line. */
export const Drift: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = makeCue(props);
  const off = cue('out', 0.1);
  const release = cue('straight', 0.4);
  const lit = tween(f, off, off + 20, 1, 0.35);
  const zoom = tween(f, release, D, 1.45, 0.8);
  const orbitFade = tween(f, release, release + 40, 1, 0);
  const base = 400 + 900; // continue roughly where the opening scene left off
  return (
    <Canvas>
      <Stars seed="s3" drift={0.08} />
      <BrightStars seed="b3" count={6} />
      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        <Orbits dashed opacity={orbitFade} />
        <circle cx={CX} cy={CY} r={70} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="8 12" opacity={0.45} />
        {BODIES.map((b) => {
          const p = driftPos(b, f + base, release + base);
          const r0 = orbitPos(b, release + base);
          return (
            <g key={b.name}>
              {f > release && (
                <line x1={r0.x} y1={r0.y} x2={p.x} y2={p.y} stroke={C.muted} strokeWidth={3}
                      strokeDasharray="4 10" opacity={0.55} />
              )}
              <PlanetAt b={b} x={p.x} y={p.y} lit={lit} label={b.name === 'Earth' ? tween(f, release, release + 20, 0, 1) : 0} />
            </g>
          );
        })}
      </g>
    </Canvas>
  );
};

/** A small plant that wilts and browns as `wilt` goes 0 -> 1. */
const Sapling: React.FC<{x: number; y: number; wilt: number}> = ({x, y, wilt}) => {
  const leafC = mix('#58c46e', '#9a7a4e', wilt);
  const veinC = mix('#2f8a45', '#6b5232', wilt);
  const stemC = mix('#3f9a52', '#7d6040', wilt);
  const droop = wilt * 50;
  const leaf = (lx: number, ly: number, ang: number, s: number, key: number) => (
    <g key={key} transform={`translate(${lx} ${ly}) rotate(${ang}) scale(${s})`}>
      <path d="M 0 0 C 20 -22, 62 -20, 80 0 C 62 20, 20 22, 0 0 Z" fill={leafC} />
      <path d="M 2 0 L 74 0" stroke={veinC} strokeWidth={2.5} />
      {[18, 34, 50].map((v) => <path key={v} d={`M ${v} 0 L ${v + 12} -9 M ${v} 0 L ${v + 12} 9`} stroke={veinC} strokeWidth={1.5} />)}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={6} rx={90} ry={18} fill="#3a2a40" />
      <ellipse cx={0} cy={2} rx={70} ry={11} fill="#4d3752" />
      <path d={`M 0 0 C ${-4} -50, ${6 + droop * 0.2} -100, ${droop * 0.5} -150`} stroke={stemC} strokeWidth={9} fill="none" strokeLinecap="round" />
      {leaf(-2, -55, 225 - droop * 0.2, 1, 1)}
      {leaf(2, -80, -20 + droop, 1.05, 2)}
      {leaf(droop * 0.25, -115, 205 + droop * 0.6, 0.85, 3)}
      {leaf(droop * 0.45, -145, -40 + droop * 1.2, 0.7, 4)}
    </g>
  );
};

/** 4. Earth freezes: ice spreads, city lights fail, the thermometer falls. */
export const Freeze: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const cold = cue('cold', 0.05);
  const c18 = cue('eighteen', 0.35);
  const c73 = cue('seventy', 0.6);
  const plants = cue('plants', 0.7);
  const yr = cue('year', 0.55);
  // 15 °C -> -18 °C by "eighteen" (one week), hold, then -> -73 °C between "year" and "seventy"
  const temp = f < yr ? tween(f, cold, c18, 15, -18) : tween(f, yr, c73, -18, -73);
  const icy = f < yr ? tween(f, cold, c18 + 20, 0, 0.35) : tween(f, yr, c73 + 30, 0.35, 1);
  const ex = 700, ey = 540, er = 330;
  const when = f >= yr ? 'after 1 year' : f >= cue('week', 0.3) ? 'after 1 week' : 'today';

  // thermometer: -80..+20 °C mapped onto the tube
  const tx = 1400, tTop = 230, tBot = 800;
  const level = tBot - ((temp + 80) / 100) * (tBot - tTop);
  const fluid = mix(C.accent, '#7fd3ff', icy);
  const wilt = tween(f, plants, plants + 45, 0, 1);
  return (
    <Canvas>
      <Stars seed="s4" drift={0.04} opacity={0.8} />
      <BrightStars seed="b4" count={5} />
      <Globe cx={ex} cy={ey} r={er} lon={-10 + f * 0.08} lat={22} light={[-55, 25]} daylight={0.62}
             ice={icy} cityLights={tween(f, 0, c73, 1, 0.15)} />

      {/* thermometer */}
      <rect x={tx - 36} y={tTop - 44} width={72} height={tBot - tTop + 90} rx={36} fill="#ffffff" opacity={0.1} />
      <rect x={tx - 36} y={tTop - 44} width={72} height={tBot - tTop + 90} rx={36} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} />
      <rect x={tx - 16} y={level} width={32} height={tBot - level + 20} rx={16} fill={fluid} />
      <circle cx={tx} cy={tBot + 62} r={60} fill="#ffffff" opacity={0.1} />
      <circle cx={tx} cy={tBot + 62} r={50} fill={fluid} />
      <ellipse cx={tx - 18} cy={tBot + 44} rx={14} ry={9} fill="#ffffff" opacity={0.45} />
      <rect x={tx - 26} y={tTop - 20} width={8} height={tBot - tTop} rx={4} fill="#ffffff" opacity={0.25} />
      {[20, 0, -20, -40, -60, -80].map((t) => {
        const y = tBot - ((t + 80) / 100) * (tBot - tTop);
        return <g key={t}><line x1={tx + 44} x2={tx + 64} y1={y} y2={y} stroke={C.muted} strokeWidth={3} />
          <Label x={tx + 76} y={y + 9} size={24} color={C.muted} anchor="start" weight={500}>{t}°</Label></g>;
      })}
      {[10, -10, -30, -50, -70].map((t) => {
        const y = tBot - ((t + 80) / 100) * (tBot - tTop);
        return <line key={t} x1={tx + 44} x2={tx + 54} y1={y} y2={y} stroke={C.muted} strokeWidth={2} opacity={0.7} />;
      })}
      <Label x={tx - 110} y={level + 20} size={64} weight={800} anchor="end">{Math.round(temp)}°C</Label>
      <Label x={tx - 110} y={level + 62} size={28} color={C.muted} anchor="end" weight={500}>{when}</Label>

      {/* a plant losing the light it lives on */}
      <g opacity={tween(f, plants - 10, plants + 10, 0, 1)}>
        <Sapling x={1690} y={900} wilt={wilt} />
        <Label x={1690} y={970} size={24} color={C.muted} weight={500}>no photosynthesis</Label>
      </g>
    </Canvas>
  );
};

/** A rod-shaped microbe with membrane, inner granules and a waving flagellum. */
const Microbe: React.FC<{x: number; y: number; rot: number; s: number; t: number}> = ({x, y, rot, s, t}) => {
  const wave = Array.from({length: 7}).map((_, i) => `${-22 - i * 7} ${Math.sin(t / 4 + i) * 4}`).join(' L ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Glow cx={0} cy={0} r={46} color={C.microbe} opacity={0.5} />
      <path d={`M -20 0 L ${wave}`} stroke="#9ff7dd" strokeWidth={1.6} fill="none" opacity={0.8} />
      <rect x={-22} y={-9} width={44} height={18} rx={9} fill="#2b8f7a" />
      <rect x={-20} y={-7} width={40} height={14} rx={7} fill={C.microbe} />
      <ellipse cx={-4} cy={0} rx={9} ry={3.5} fill="#2b8f7a" opacity={0.7} />
      <circle cx={10} cy={-2} r={2} fill="#e9fff8" />
      <circle cx={13} cy={3} r={1.4} fill="#e9fff8" />
    </g>
  );
};

/** Irregular rocky chimney outline, built from stacked knobbly segments. */
const chimneyPath = (vx: number, base: number, height: number, width: number, seed: string) => {
  const steps = 12;
  const left: string[] = [], right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const w = width * (1 - t * 0.62) * (0.88 + random(`${seed}w${i}`) * 0.24);
    const y = base - t * height;
    left.push(`${vx - w / 2 - random(`${seed}l${i}`) * 10} ${y}`);
    right.unshift(`${vx + w / 2 + random(`${seed}r${i}`) * 10} ${y}`);
  }
  return `M ${left.join(' L ')} L ${right.join(' L ')} Z`;
};

/** 5. Under the ice: a hydrothermal vent keeps microbes alive in the dark. */
export const DeepVent: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const cue = makeCue(props);
  const pan = tween(f, cue('insulat', 0.3), cue('springs', 0.6), 0, 760);
  const ventLabel = tween(f, cue('springs', 0.6), cue('springs', 0.6) + 15, 0, 1);
  const microbes = tween(f, cue('microbes', 0.75), cue('microbes', 0.75) + 30, 0, 1);
  const vx = 960, floor = 1640, ch = 300;
  return (
    <Canvas background={false}>
      <g transform={`translate(0 ${-pan})`}>
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b4f8a" />
            <stop offset="0.35" stopColor={C.water} />
            <stop offset="1" stopColor="#040b22" />
          </linearGradient>
          <linearGradient id="ice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4fbff" />
            <stop offset="1" stopColor="#a8d4f2" />
          </linearGradient>
          <linearGradient id="rock" x1="0" x2="1">
            <stop offset="0" stopColor="#5a4470" />
            <stop offset="0.45" stopColor="#3a2a4e" />
            <stop offset="1" stopColor="#241a36" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
        </defs>
        <rect x={-100} y={0} width={W + 200} height={1900} fill="url(#ocean)" />

        {/* ice sheet: layered, with trapped bubbles and cracks */}
        <path d={`M -100 0 H ${W + 100} V 190 ` + Array.from({length: 33}).map((_, i) =>
          `L ${W + 100 - i * 65} ${185 + (i % 2 ? 26 : 0) + random(`ice${i}`) * 48}`).join(' ') + ' L -100 200 Z'} fill="url(#ice)" />
        <path d={`M -100 0 H ${W + 100} V 120 ` + Array.from({length: 25}).map((_, i) =>
          `L ${W + 100 - i * 85} ${115 + random(`ic2${i}`) * 25}`).join(' ') + ' L -100 125 Z'} fill="#ffffff" opacity={0.45} />
        {Array.from({length: 18}).map((_, i) => (
          <path key={i} d={`M ${random(`ck${i}`) * W} ${20 + random(`cy${i}`) * 60} l ${(random(`cdx${i}`) - 0.5) * 60} ${40 + random(`cdy${i}`) * 50} l ${(random(`cex${i}`) - 0.5) * 40} 30`}
                stroke="#7fb4dc" strokeWidth={2} fill="none" opacity={0.6} />
        ))}
        {Array.from({length: 40}).map((_, i) => (
          <circle key={i} cx={random(`bb${i}`) * W} cy={60 + random(`by${i}`) * 110} r={2 + random(`br${i}`) * 4}
                  fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={0.6} />
        ))}
        <Label x={160} y={100} size={30} color="#3d6a99" anchor="start">ice</Label>
        <Label x={160} y={340} size={30} color={C.muted} anchor="start" opacity={tween(f, 20, 40, 0, 1)}>liquid water</Label>

        {/* drifting particles ("marine snow") */}
        {Array.from({length: 90}).map((_, i) => {
          const y = ((random(`sy${i}`) * 1700 + f * (0.4 + random(`sv${i}`) * 0.6)) % 1500) + 250;
          const x = random(`sx${i}`) * W + Math.sin(f / 40 + i) * 6;
          return <circle key={i} cx={x} cy={y} r={1 + random(`sr${i}`) * 2} fill="#cfe3ff" opacity={0.25} />;
        })}

        {/* sea floor: layered ridges, boulders and sediment */}
        <path d={`M -100 ${floor - 60} Q 300 ${floor - 170} 620 ${floor - 80} T 1300 ${floor - 120} T ${W + 100} ${floor - 70} V 1900 H -100 Z`} fill="#20142e" />
        <path d={`M -100 ${floor} Q 400 ${floor - 90} 760 ${floor - 20} T 1400 ${floor - 40} T ${W + 100} ${floor} V 1900 H -100 Z`} fill={C.seafloor} />
        <path d={`M -100 ${floor} Q 400 ${floor - 90} 760 ${floor - 20} T 1400 ${floor - 40} T ${W + 100} ${floor}`} stroke="#4a3360" strokeWidth={5} fill="none" />
        {Array.from({length: 14}).map((_, i) => {
          const bx = random(`rx${i}`) * W, s = 18 + random(`rs${i}`) * 40;
          const by = floor + 10 + random(`ry${i}`) * 60;
          return (
            <g key={i}>
              <path d={`M ${bx - s} ${by} Q ${bx - s * 0.9} ${by - s * 0.9} ${bx} ${by - s} Q ${bx + s * 0.9} ${by - s * 0.8} ${bx + s} ${by} Z`} fill="#3b2850" />
              <path d={`M ${bx - s * 0.7} ${by - s * 0.5} Q ${bx - s * 0.3} ${by - s * 0.95} ${bx + s * 0.2} ${by - s * 0.9}`} stroke="#5d4878" strokeWidth={3} fill="none" />
            </g>
          );
        })}
        {Array.from({length: 60}).map((_, i) => (
          <circle key={i} cx={random(`dx${i}`) * W} cy={floor + 30 + random(`dy${i}`) * 200} r={1.5 + random(`dr${i}`) * 3} fill="#4a3560" />
        ))}

        {/* hydrothermal vent field */}
        <Glow cx={vx} cy={floor - 160} r={460} color={C.plume} opacity={0.45} />
        <path d={chimneyPath(vx - 230, floor - 5, 140, 90, 'c2')} fill="url(#rock)" />
        <path d={chimneyPath(vx + 250, floor, 180, 100, 'c3')} fill="url(#rock)" />
        <path d={chimneyPath(vx, floor - 5, ch, 230, 'c1')} fill="url(#rock)" />
        {/* mineral crust bands and ledges */}
        {Array.from({length: 7}).map((_, i) => {
          const y = floor - 30 - i * 40, w = 210 * (1 - (i * 40) / ch * 0.62);
          return <path key={i} d={`M ${vx - w / 2} ${y} q ${w / 2} ${-10 - random(`ld${i}`) * 10} ${w} 0`} stroke={i % 2 ? '#c9a24a' : '#6e5590'} strokeWidth={i % 2 ? 4 : 6} fill="none" opacity={0.7} />;
        })}
        {/* microbial mats (real vents are carpeted with them) */}
        <g filter="url(#soft)">
          {Array.from({length: 24}).map((_, i) => (
            <ellipse key={i} cx={vx - 330 + random(`mt${i}`) * 660} cy={floor - 6 + random(`my${i}`) * 20} rx={22 + random(`mr${i}`) * 30} ry={8}
                     fill={i % 3 ? '#f2e6c4' : '#ffd58a'} opacity={0.55} />
          ))}
        </g>
        {/* vent mouth glow and dark mineral plume */}
        <ellipse cx={vx} cy={floor - ch - 4} rx={42} ry={14} fill="#ffb36b" opacity={0.9} />
        <Glow cx={vx} cy={floor - ch} r={90} color="#ffcf8a" opacity={0.8} />
        {Array.from({length: 46}).map((_, i) => {
          const life = ((f * 1.1 + random(`pl${i}`) * 200) % 200) / 200;
          const x = vx + Math.sin(life * 6 + i) * (12 + life * 120) * (random(`pw${i}`) - 0.5) * 2;
          const y = floor - ch - 10 - life * 560;
          const c = life < 0.12 ? mix('#ffb36b', '#3a2c48', life / 0.12) : mix('#3a2c48', '#1c2440', life);
          return <circle key={i} cx={x} cy={y} r={14 + life * 46} fill={c} opacity={0.6 * (1 - life)} />;
        })}
        {/* shimmering heat */}
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M ${vx - 30 + k * 30} ${floor - ch - 30} q 10 -30 0 -60 q -10 -30 0 -60`} stroke="#ffd9a0" strokeWidth={2}
                fill="none" opacity={0.25 + 0.15 * Math.sin(f / 6 + k)} transform={`translate(${Math.sin(f / 9 + k) * 4} 0)`} />
        ))}
        <g opacity={ventLabel}>
          <line x1={vx + 120} y1={floor - 230} x2={vx + 450} y2={floor - 410} stroke={C.muted} strokeWidth={2} />
          <Label x={vx + 470} y={floor - 420} size={30} anchor="start">hydrothermal vent</Label>
          <Label x={vx + 470} y={floor - 382} size={24} anchor="start" color={C.muted} weight={500}>heated by Earth's interior</Label>
        </g>
        <g opacity={microbes}>
          {Array.from({length: 22}).map((_, i) => {
            const a = random(`ma${i}`) * Math.PI * 2;
            const d = 170 + random(`md${i}`) * 260;
            const x = vx + Math.cos(a + f / 220) * d;
            const y = floor - 110 - Math.abs(Math.sin(a)) * d * 0.6 + Math.sin(f / 20 + i) * 6;
            return <Microbe key={i} x={x} y={y} rot={(a * 180) / Math.PI + f * 0.6} s={0.8 + random(`ms${i}`) * 0.6} t={f + i * 5} />;
          })}
        </g>
      </g>
    </Canvas>
  );
};

/** 6. The Sun comes back: it isn't going anywhere for ~5 billion years. */
export const SunReturns: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = makeCue(props);
  const back = tween(f, 5, 35, 0, 1, (x) => 1 - Math.pow(1 - x, 3));
  const years = tween(f, cue('five', 0.4) - 5, cue('five', 0.4) + 15, 0, 1);
  const end = tween(f, D - 20, D, 1, 0);
  const sx = 620, sy = 560;
  const a = f / 120;
  const ex = sx + 560 * Math.cos(a), ey = sy + 220 * Math.sin(a);
  const earth = (
    <Globe cx={ex} cy={ey} r={44} lon={f * 0.8} lat={20} light={lightFrom2D(sx - ex, sy - ey)} daylight={back} cityLights={1 - back} />
  );
  return (
    <Canvas>
      <Stars seed="s6" drift={0.04} />
      <BrightStars seed="b6" count={6} />
      <g opacity={end}>
        <ellipse cx={sx} cy={sy} rx={560} ry={220} fill="none" stroke={C.muted} strokeOpacity={0.3} strokeWidth={2} />
        {ey < sy && earth}
        <DetailedSun cx={sx} cy={sy} r={130} scale={back} glow={back} />
        {ey >= sy && earth}
        <g opacity={years} transform={`translate(0 ${(1 - years) * 20})`}>
          <Label x={1480} y={520} size={120} weight={800} color={C.sun}>~5 billion</Label>
          <Label x={1480} y={590} size={40} weight={500} color={C.text}>years of fuel left</Label>
        </g>
      </g>
    </Canvas>
  );
};

export const sunScenes = {SunVanishes, TitleCard, LightDelay, Drift, Freeze, DeepVent, SunReturns};
