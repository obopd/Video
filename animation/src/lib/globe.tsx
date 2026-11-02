// A detailed Earth: real coastlines (Natural Earth, public domain, via world-atlas),
// biomes, shallow seas, clouds, atmosphere, a soft day/night terminator and city lights.
import React, {useId, useMemo} from 'react';
import {geoOrthographic, geoPath, geoCircle, geoDistance} from 'd3-geo';
import type {GeoPermissibleObjects} from 'd3-geo';
import {feature} from 'topojson-client';
import {random, useCurrentFrame} from 'remotion';
import land110 from 'world-atlas/land-110m.json';
import land50 from 'world-atlas/land-50m.json';
import {mix} from './color';

/* eslint-disable @typescript-eslint/no-explicit-any */
const LAND_LO = feature(land110 as any, (land110 as any).objects.land) as unknown as GeoPermissibleObjects;
const LAND_HI = feature(land50 as any, (land50 as any).objects.land) as unknown as GeoPermissibleObjects;

const circle = (lon: number, lat: number, radius: number) => geoCircle().center([lon, lat]).radius(radius)();

// [lon, lat, radius°, kind]
const BIOMES: [number, number, number, 'desert' | 'forest' | 'dry' | 'snow'][] = [
  [12, 23, 13, 'desert'], [30, 21, 7, 'desert'], [47, 23, 8, 'desert'], [57, 30, 5, 'dry'],
  [133, -25, 11, 'desert'], [120, -22, 6, 'dry'], [104, 42, 7, 'dry'], [80, 42, 6, 'desert'],
  [21, -23, 6, 'dry'], [-112, 34, 5, 'dry'], [-69, -24, 4, 'desert'], [-65, -38, 5, 'dry'],
  [-62, -5, 11, 'forest'], [-55, -12, 7, 'forest'], [22, 0, 7, 'forest'], [110, 0, 7, 'forest'],
  [100, 60, 16, 'forest'], [-100, 55, 14, 'forest'], [40, 58, 9, 'forest'], [-75, 45, 6, 'forest'],
  [-42, 73, 11, 'snow'], [0, -90, 26, 'snow'], [100, 75, 6, 'snow'], [-90, 72, 7, 'snow'],
];
const BIOME_COLOR = {desert: '#e9c98b', dry: '#b7b467', forest: '#2f8f4e', snow: '#f4fbff'};

// Major cities [lon, lat] for night lights.
const CITIES: [number, number][] = [
  [-74, 40.7], [-87.6, 41.9], [-118.2, 34], [-122.4, 37.8], [-95.4, 29.8], [-80.2, 25.8], [-77, 38.9], [-79.4, 43.7],
  [-73.6, 45.5], [-123.1, 49.3], [-99.1, 19.4], [-46.6, -23.5], [-43.2, -22.9], [-58.4, -34.6], [-70.6, -33.4],
  [-77, -12], [-74.1, 4.7], [-0.1, 51.5], [2.35, 48.9], [13.4, 52.5], [12.5, 41.9], [-3.7, 40.4], [4.9, 52.4],
  [16.4, 48.2], [21, 52.2], [37.6, 55.8], [30.3, 59.9], [28.9, 41], [31.2, 30], [3.4, 6.5], [36.8, -1.3],
  [28, -26.2], [18.4, -33.9], [46.7, 24.7], [55.3, 25.2], [51.4, 35.7], [67, 24.9], [72.9, 19], [77.2, 28.6],
  [88.4, 22.6], [80.3, 13.1], [90.4, 23.8], [100.5, 13.8], [106.8, -6.2], [103.8, 1.35], [121, 14.6],
  [114.2, 22.3], [121.5, 31.2], [116.4, 39.9], [126.9, 37.6], [139.7, 35.7], [135.5, 34.7], [151.2, -33.9],
  [145, -37.8], [153, -27.5], [174.8, -36.8], [104, 30.7], [113.3, 23.1], [108.9, 34.3], [-157.9, 21.3],
];

// Cloud streaks: they cluster along the equator and the mid-latitude storm tracks,
// stretched east-west by the winds, with a slight wave.
const CLOUDS = Array.from({length: 90}).map((_, i) => {
  const band = random(`cb${i}`);
  const lat = band < 0.35 ? (random(`cl${i}`) - 0.5) * 20 : (band < 0.7 ? 1 : -1) * (35 + random(`cl${i}`) * 25);
  const len = 8 + random(`cn${i}`) * 26;
  const lon = random(`co${i}`) * 360 - 180;
  const amp = 0.4 + random(`ca${i}`) * 1.2;
  const pts: [number, number][] = Array.from({length: 9}).map((__, k) => [lon + (len * k) / 8, lat + Math.sin(k * 0.35 + i) * amp]);
  return {pts, w: 0.6 + random(`cw${i}`) * 1.6, o: 0.35 + random(`cop${i}`) * 0.45};
});
// A few spiral storm systems.
const STORMS: [number, number, number][] = [[-40, 48, 1], [150, 38, 1], [80, -45, -1], [-140, -40, -1], [60, 15, 1]];
const spiral = (lon: number, lat: number, dir: number, size: number): [number, number][] =>
  Array.from({length: 40}).map((_, k) => {
    const t = k / 39, a = dir * t * Math.PI * 1.7, rr = size * (1 - t * 0.85);
    return [lon + (Math.cos(a) * rr) / Math.cos((lat * Math.PI) / 180), lat + Math.sin(a) * rr];
  });

export type GlobeProps = {
  cx: number; cy: number; r: number;
  /** Longitude at the center of the view; animate it to spin the planet. */
  lon?: number;
  /** Latitude at the center of the view (positive tilts the north pole toward us). */
  lat?: number;
  /** Direction of the light, as a longitude/latitude offset from the view center. null = no sun. */
  light?: [number, number] | null;
  /** 0..1: overall daylight brightness (fade to 0 when the Sun goes out). */
  daylight?: number;
  /** 0..1: how frozen the planet is. */
  ice?: number;
  clouds?: number;
  cityLights?: number;
};

export const Globe: React.FC<GlobeProps> = ({
  cx, cy, r, lon = 20, lat = 15, light = [-60, 15], daylight = 1, ice = 0, clouds = 1, cityLights = 0,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/:/g, '');
  const detail = r > 120 ? LAND_HI : LAND_LO;
  const proj = useMemo(() => geoOrthographic().scale(r).translate([cx, cy]).rotate([-lon, -lat]).clipAngle(90), [cx, cy, r, lon, lat]);
  const path = geoPath(proj);
  const landD = path(detail) ?? '';
  const sunLon = light ? lon + light[0] : 0;
  const sunLat = light ? lat + light[1] : 0;
  const night = light ? path(circle(sunLon + 180, -sunLat, 90)) ?? '' : '';
  const blur = Math.max(0.6, r * 0.035);
  const glint = light ? proj([sunLon, sunLat]) : null;
  const glintVisible = light && geoDistance([sunLon, sunLat], [lon, lat]) < Math.PI / 2;

  const ocean = mix('#1d63b0', '#5d86b3', ice * 0.85);
  const oceanLight = mix('#3fa7e0', '#a9c9e6', ice * 0.85);
  const landBase = mix('#58b562', '#e8f2fa', ice);
  const cloudDrift = frame * 0.05;

  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <clipPath id={`${id}l`}><path d={landD} /></clipPath>
        <radialGradient id={`${id}o`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor={oceanLight} />
          <stop offset="1" stopColor={ocean} />
        </radialGradient>
        <radialGradient id={`${id}a`}>
          <stop offset="0.86" stopColor="#8fd8ff" stopOpacity={0} />
          <stop offset="0.91" stopColor="#8fd8ff" stopOpacity={0.55 * Math.max(0.25, daylight)} />
          <stop offset="1" stopColor="#8fd8ff" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={blur} /></filter>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={blur * 0.35} /></filter>
        <filter id={`${id}c2`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={Math.max(0.5, r * 0.012)} /></filter>
        <filter id={`${id}n`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={r * 0.06} /></filter>
      </defs>

      {/* atmosphere halo */}
      <circle cx={cx} cy={cy} r={r * 1.16} fill={`url(#${id}a)`} />

      <g clipPath={`url(#${id}c)`}>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}o)`} />
        {/* shallow seas around coastlines */}
        <path d={landD} fill="none" stroke={mix('#5cc8ea', '#e0f0fb', ice)} strokeWidth={Math.max(1, r * 0.05)}
              strokeLinejoin="round" opacity={0.45} filter={`url(#${id}s)`} />
        <path d={landD} fill={landBase} />
        {/* biomes, softly blended and kept on land */}
        <g clipPath={`url(#${id}l)`} filter={`url(#${id}b)`} opacity={1 - ice * 0.85}>
          {BIOMES.map(([blon, blat, br, kind], i) => (
            <path key={i} d={path(circle(blon, blat, br)) ?? ''} fill={BIOME_COLOR[kind]} opacity={kind === 'snow' ? 1 : 0.85} />
          ))}
        </g>
        {/* subtle relief along coasts */}
        <path d={landD} fill="none" stroke="#1e5a37" strokeOpacity={0.25 * (1 - ice)} strokeWidth={Math.max(0.5, r * 0.006)} />
        {/* spreading ice: polar caps grow toward the equator */}
        {ice > 0 && (
          <g filter={`url(#${id}s)`}>
            <path d={path(circle(0, 90, 14 + ice * 50)) ?? ''} fill="#eef7ff" opacity={0.92} />
            <path d={path(circle(0, -90, 24 + ice * 42)) ?? ''} fill="#eef7ff" opacity={0.92} />
          </g>
        )}
        {ice > 0 && <path d={landD} fill="#f6fbff" opacity={ice * 0.75} />}
        {ice > 0 && <path d={landD} fill="none" stroke="#6f93b8" strokeWidth={Math.max(0.6, r * 0.006)} opacity={ice * 0.8} />}
        {/* clouds */}
        <g opacity={0.8 * clouds} filter={`url(#${id}c2)`} fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
          {CLOUDS.map((c, i) => (
            <path key={i} opacity={c.o} strokeWidth={Math.max(0.8, r * 0.04 * c.w)}
                  d={path({type: 'LineString', coordinates: c.pts.map(([x, y]) => [x + cloudDrift, y])}) ?? ''} />
          ))}
          {STORMS.map(([slon, slat, dir], i) => (
            <path key={`s${i}`} opacity={0.75} strokeWidth={Math.max(0.8, r * 0.04)}
                  d={path({type: 'LineString', coordinates: spiral(slon + cloudDrift, slat, dir, 7)}) ?? ''} />
          ))}
        </g>
        {/* sun glint on the ocean */}
        {glint && glintVisible && daylight > 0 && (
          <ellipse cx={glint[0]} cy={glint[1]} rx={r * 0.16} ry={r * 0.11} fill="#ffffff" opacity={0.22 * daylight} filter={`url(#${id}b)`} />
        )}
        {/* night side (soft terminator), then overall darkness when the Sun is gone */}
        {night && <path d={night} fill="#04051a" opacity={0.78} filter={`url(#${id}n)`} />}
        <circle cx={cx} cy={cy} r={r} fill="#04051a" opacity={(1 - daylight) * 0.78} />
        {/* city lights on the dark side */}
        {cityLights > 0 && CITIES.map(([clon, clat], i) => {
          const p = proj([clon, clat]);
          if (!p || geoDistance([clon, clat], [lon, lat]) > Math.PI / 2 - 0.05) return null;
          const dark = !light || daylight < 0.5 ? 1 : geoDistance([clon, clat], [sunLon, sunLat]) > Math.PI / 2 ? 1 : 0;
          if (!dark) return null;
          const flicker = 0.8 + 0.2 * Math.sin(frame / 7 + i);
          return (
            <g key={i} opacity={cityLights * flicker}>
              <circle cx={p[0]} cy={p[1]} r={Math.max(1.2, r * 0.028)} fill="#ffc46b" opacity={0.45} filter={`url(#${id}s)`} />
              <circle cx={p[0]} cy={p[1]} r={Math.max(0.5, r * 0.007)} fill="#fff1c2" />
            </g>
          );
        })}
      </g>
      {/* thin bright limb on the day side */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke="#b9e6ff" strokeWidth={Math.max(0.8, r * 0.012)} opacity={0.35 * daylight} />
    </g>
  );
};
