// Scenes for "What if the Sun disappeared?"
import React from 'react';
import {useCurrentFrame, random} from 'remotion';
import {C, W, H, FONT} from '../../lib/theme';
import {Canvas, Stars, Sun, Planet, Continents, Glow, Label, tween, mix, Sky} from '../../lib/shapes';
import {makeCue} from '../../lib/cues';
import type {SceneProps} from '../../lib/types';
import {BODIES, CX, CY, Orbits, PlanetAt, orbitPos, driftPos} from './system';

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
      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        <Orbits />
        {behind.map((p) => <PlanetAt key={p.b.name} b={p.b} x={p.x} y={p.y} lit={1} label={p.b.name === 'Earth' ? earthLabel : 0} />)}
        <Sun cx={CX} cy={CY} r={70} scale={sunScale} glow={f < gone ? 1 : tween(f, gone, gone + 20, 1, 0)} />
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
  const sx = 240, ex = 1560, ey = 560, er = 110;
  const start = Math.round(D * 0.06), arrive = Math.round(D * 0.95);
  const edge = tween(f, start, arrive, sx, ex - er, (x) => x); // constant speed, like light
  const seconds = tween(f, start, arrive, 0, 500, (x) => x);
  const grav = tween(f, cue('gravity', 0.6) - 10, cue('gravity', 0.6) + 10, 0, 1);
  const dark = tween(f, arrive - 2, D, 1, 0.15);
  return (
    <Canvas>
      <Stars seed="s2" drift={0.05} />
      {/* where the sun was */}
      <circle cx={sx} cy={ey} r={80} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="8 12" opacity={0.6} />
      <Label x={sx} y={ey + 140} size={28} color={C.muted}>Sun (gone)</Label>
      {/* remaining sunlight: everything right of the trailing edge */}
      <defs>
        <linearGradient id="beam" x1="0" x2="1">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.05} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <rect x={edge} y={ey - 190} width={Math.max(0, ex - edge)} height={380} fill="url(#beam)" />
      {Array.from({length: 70}).map((_, i) => {
        const y = ey - 170 + random(`py${i}`) * 340;
        const x = ((random(`px${i}`) * 1600 + f * 9) % 1400) + sx;
        if (x < edge || x > ex - er * 0.6) return null;
        return <rect key={i} x={x} y={y} width={26} height={4} rx={2} fill={C.sunCore} opacity={0.75} />;
      })}
      {/* trailing edge = last light, and the gravity change travelling with it */}
      <line x1={edge} x2={edge} y1={ey - 200} y2={ey + 200} stroke={C.sunCore} strokeWidth={3} opacity={0.6} />
      <g opacity={grav}>
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M ${edge - 30 - k * 26} ${ey - 220} Q ${edge + 10 - k * 26} ${ey} ${edge - 30 - k * 26} ${ey + 220}`}
                fill="none" stroke={C.accent} strokeWidth={4} opacity={0.8 - k * 0.25} />
        ))}
        <Label x={edge - 60} y={ey - 240} size={26} color={C.accent} anchor="end">gravity</Label>
      </g>
      <Planet cx={ex} cy={ey} r={er} color={C.earthOcean} lightAngle={Math.PI} lit={dark}>
        <Continents cx={ex} cy={ey} r={er} color={C.earthLand} spin={f / 900} />
      </Planet>
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
  const lit = tween(f, off, off + 20, 1, 0.5);
  const zoom = tween(f, release, D, 1.45, 0.8);
  const orbitFade = tween(f, release, release + 40, 1, 0);
  const base = 400 + 900; // continue roughly where the opening scene left off
  return (
    <Canvas>
      <Stars seed="s3" drift={0.08} />
      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        <Orbits dashed opacity={orbitFade} />
        <circle cx={CX} cy={CY} r={70} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="8 12" opacity={0.45} />
        {BODIES.map((b) => {
          const p = driftPos(b, f + base, release + base);
          const r0 = orbitPos(b, release + base);
          return (
            <g key={b.name}>
              {f > release && (
                <line x1={r0.x} y1={r0.y} x2={p.x} y2={p.y} stroke={b.color} strokeWidth={3}
                      strokeDasharray="4 10" opacity={0.6} />
              )}
              <PlanetAt b={b} x={p.x} y={p.y} lit={lit} label={b.name === 'Earth' ? tween(f, release, release + 20, 0, 1) : 0} />
            </g>
          );
        })}
      </g>
    </Canvas>
  );
};

/** 4. Earth freezes: ice caps grow, colors cool, the thermometer falls. */
export const Freeze: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = makeCue(props);
  const cold = cue('cold', 0.05);
  const c18 = cue('eighteen', 0.35);
  const c73 = cue('seventy', 0.6);
  const plants = cue('plants', 0.7);
  const temp = f < c18 ? tween(f, cold, c18, 15, -18) : tween(f, c18 + 5, c73, -18, -73);
  const icy = tween(f, cold, c73 + 30, 0, 1);
  const ex = 720, ey = 540, er = 320;
  const cap = icy * er * 0.5;
  const when = f >= cue('year', 0.55) ? 'after 1 year' : f >= cue('week', 0.3) ? 'after 1 week' : 'today';

  // thermometer: -80..+20 °C mapped onto the tube
  const tx = 1420, tTop = 230, tBot = 800;
  const level = tBot - ((temp + 80) / 100) * (tBot - tTop);
  const leaf = tween(f, plants, plants + 40, 0, 1);
  return (
    <Canvas>
      <Stars seed="s4" drift={0.04} opacity={0.7} />
      <defs><clipPath id="earth-clip"><circle cx={ex} cy={ey} r={er} /></clipPath></defs>
      <Planet cx={ex} cy={ey} r={er} color={mix(C.earthOcean, '#6fa8d6', icy * 0.8)} lightAngle={-2.4} lit={1 - icy * 0.35}>
        <Continents cx={ex} cy={ey} r={er} color={mix(C.earthLand, C.ice, icy)} spin={f / 1200} />
        <g clipPath="url(#earth-clip)">
          <rect x={ex - er} y={ey - er} width={er * 2} height={cap} fill={C.ice} />
          <rect x={ex - er} y={ey + er - cap} width={er * 2} height={cap} fill={C.ice} />
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={ex - er + (i + 0.5) * (er * 2 / 9)} cy={ey - er + cap} rx={er / 8} ry={er / 18 + 6} fill={C.ice} />
          ))}
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={`b${i}`} cx={ex - er + (i + 0.2) * (er * 2 / 9)} cy={ey + er - cap} rx={er / 8} ry={er / 18 + 6} fill={C.ice} />
          ))}
        </g>
      </Planet>

      {/* thermometer */}
      <rect x={tx - 34} y={tTop - 40} width={68} height={tBot - tTop + 80} rx={34} fill="#ffffff" opacity={0.12} />
      <rect x={tx - 16} y={level} width={32} height={tBot - level + 20} rx={16} fill={mix(C.accent, '#7fd3ff', icy)} />
      <circle cx={tx} cy={tBot + 60} r={58} fill={mix(C.accent, '#7fd3ff', icy)} />
      {[20, 0, -20, -40, -60, -80].map((t) => {
        const y = tBot - ((t + 80) / 100) * (tBot - tTop);
        return <g key={t}><line x1={tx + 40} x2={tx + 58} y1={y} y2={y} stroke={C.muted} strokeWidth={3} />
          <Label x={tx + 70} y={y + 9} size={24} color={C.muted} anchor="start" weight={500}>{t}°</Label></g>;
      })}
      <Label x={tx - 110} y={level + 20} size={64} weight={800} anchor="end">{Math.round(temp)}°C</Label>
      <Label x={tx - 110} y={level + 62} size={28} color={C.muted} anchor="end" weight={500}>{when}</Label>

      {/* a plant losing the light it lives on */}
      <g opacity={tween(f, plants - 10, plants + 10, 0, 1)} transform={`translate(1660 ${880})`}>
        <path d="M0 0 C 0 -40, 0 -70, 0 -100" stroke={mix('#4fbf6a', '#8a6a4a', leaf)} strokeWidth={8} fill="none" />
        <g transform={`rotate(${-35 + leaf * 60} 0 -70)`}>
          <ellipse cx={-34} cy={-80} rx={36} ry={16} fill={mix('#5cd17a', '#9a7a52', leaf)} />
        </g>
        <g transform={`rotate(${30 + leaf * 40} 0 -95)`}>
          <ellipse cx={34} cy={-105} rx={36} ry={16} fill={mix('#5cd17a', '#9a7a52', leaf)} />
        </g>
        <Label x={0} y={50} size={24} color={C.muted} weight={500}>no photosynthesis</Label>
      </g>
    </Canvas>
  );
};

/** 5. Under the ice: a hydrothermal vent keeps microbes alive in the dark. */
export const DeepVent: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  const cue = makeCue(props);
  const pan = tween(f, cue('insulate', 0.3), cue('springs', 0.6), 0, 760);
  const ventLabel = tween(f, cue('springs', 0.6), cue('springs', 0.6) + 15, 0, 1);
  const microbes = tween(f, cue('microbes', 0.75), cue('microbes', 0.75) + 30, 0, 1);
  const vx = 960, floor = 1640;
  return (
    <Canvas background={false}>
      <g transform={`translate(0 ${-pan})`}>
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.water} />
            <stop offset="1" stopColor={C.deepWater} />
          </linearGradient>
        </defs>
        <rect x={-100} y={0} width={W + 200} height={1900} fill="url(#ocean)" />
        {/* ice sheet with a jagged underside */}
        <path d={`M -100 0 H ${W + 100} V 170 ` + Array.from({length: 25}).map((_, i) =>
          `L ${W + 100 - i * 85} ${170 + (i % 2 ? 30 : 0) + random(`ice${i}`) * 40}`).join(' ') + ' L -100 190 Z'}
              fill={C.ice} />
        <rect x={-100} y={0} width={W + 200} height={70} fill={C.iceShade} opacity={0.5} />
        <Label x={160} y={110} size={30} color="#4a6f99" anchor="start">ice</Label>
        <Label x={160} y={330} size={30} color={C.muted} anchor="start" opacity={tween(f, 20, 40, 0, 1)}>liquid water</Label>
        {/* sea floor */}
        <path d={`M -100 ${floor} Q 400 ${floor - 90} 760 ${floor - 20} T 1400 ${floor - 40} T ${W + 100} ${floor} V 1900 H -100 Z`} fill={C.seafloor} />
        {/* vent chimney */}
        <Glow cx={vx} cy={floor - 140} r={420} color={C.plume} opacity={0.5} />
        <path d={`M ${vx - 120} ${floor - 10} L ${vx - 46} ${floor - 260} L ${vx + 46} ${floor - 260} L ${vx + 120} ${floor - 10} Z`} fill={C.rock} />
        <path d={`M ${vx - 46} ${floor - 260} L ${vx - 20} ${floor - 260} L ${vx - 70} ${floor - 10} L ${vx - 120} ${floor - 10} Z`} fill={C.rockLight} />
        {Array.from({length: 40}).map((_, i) => {
          const life = ((f * 1.2 + random(`pl${i}`) * 200) % 200) / 200;
          const x = vx + Math.sin(life * 6 + i) * (20 + life * 120) * (random(`pw${i}`) - 0.5) * 2;
          const y = floor - 270 - life * 520;
          return <circle key={i} cx={x} cy={y} r={14 + life * 40} fill={mix(C.plume, '#3a2f5a', life)} opacity={0.5 * (1 - life)} />;
        })}
        <g opacity={ventLabel}>
          <Label x={vx + 470} y={floor - 420} size={30} anchor="start">hydrothermal vent</Label>
          <Label x={vx + 470} y={floor - 382} size={24} anchor="start" color={C.muted} weight={500}>heated by Earth's interior</Label>
        </g>
        <g opacity={microbes}>
          {Array.from({length: 26}).map((_, i) => {
            const a = random(`ma${i}`) * Math.PI * 2;
            const d = 160 + random(`md${i}`) * 260;
            const x = vx + Math.cos(a + f / 200) * d;
            const y = floor - 120 - Math.abs(Math.sin(a)) * d * 0.6 + Math.sin(f / 20 + i) * 6;
            return (
              <g key={i} transform={`rotate(${(a * 180) / Math.PI + f} ${x} ${y})`}>
                <Glow cx={x} cy={y} r={30} color={C.microbe} opacity={0.6} />
                <rect x={x - 16} y={y - 7} width={32} height={14} rx={7} fill={C.microbe} />
              </g>
            );
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
  return (
    <Canvas>
      <Stars seed="s6" drift={0.04} />
      <g opacity={end}>
        <ellipse cx={sx} cy={sy} rx={560} ry={220} fill="none" stroke={C.muted} strokeOpacity={0.3} strokeWidth={2} />
        {ey < sy && (
          <Planet cx={ex} cy={ey} r={34} color={C.earthOcean} lightAngle={Math.atan2(sy - ey, sx - ex)} lit={back}>
            <Continents cx={ex} cy={ey} r={34} color={C.earthLand} spin={f / 300} />
          </Planet>
        )}
        <Sun cx={sx} cy={sy} r={130} scale={back} glow={back} />
        {ey >= sy && (
          <Planet cx={ex} cy={ey} r={34} color={C.earthOcean} lightAngle={Math.atan2(sy - ey, sx - ex)} lit={back}>
            <Continents cx={ex} cy={ey} r={34} color={C.earthLand} spin={f / 300} />
          </Planet>
        )}
        <g opacity={years} transform={`translate(0 ${(1 - years) * 20})`}>
          <Label x={1480} y={520} size={120} weight={800} color={C.sun}>~5 billion</Label>
          <Label x={1480} y={590} size={40} weight={500} color={C.text}>years of fuel left</Label>
        </g>
      </g>
    </Canvas>
  );
};

export const sunScenes = {SunVanishes, TitleCard, LightDelay, Drift, Freeze, DeepVent, SunReturns};
