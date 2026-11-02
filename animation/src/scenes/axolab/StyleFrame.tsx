// Style frame for the redesigned Axol's Lab look (one still for approval).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage, useFontsReady} from '../../lib/stage';
import {P, Paper, Tag, Line, Sup, Circled, SANS} from '../../lib/paper';
import {AxoCrawl} from '../../lib/axocrawl';
import {useCurrentFrame, interpolate} from 'remotion';
import type {SceneProps} from '../../lib/types';

export const StyleFrame: React.FC<SceneProps> = (props) => {
  useFontsReady();
  const f = useCurrentFrame();
  const D = props.durationInFrames;
  // crawl in from the bottom-left on a gentle curve, pause near the answer, crawl off to the right
  const stopAt = D * 0.42, goAt = D * 0.68;
  const t = f < stopAt ? f : f < goAt ? stopAt : f - (goAt - stopAt);
  const T = D - (goAt - stopAt);
  const pos = (tt: number) => {
    const u = tt / T;
    return [interpolate(u, [0, 1], [-250, 2200]), 930 - Math.sin(u * Math.PI) * 170];
  };
  const [x, y] = pos(t);
  const [x2, y2] = pos(t + 1);
  const heading = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
  const moving = f > stopAt && f < goAt ? interpolate(f, [stopAt, stopAt + 8, goAt - 8, goAt], [1, 0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const phase = t / 24;
  return (
    <AbsoluteFill>
      <Stage
        svg={null}
        html={
          <>
            <Paper />
            <div style={{position: 'absolute', left: 0, top: 120, width: 1920, textAlign: 'center'}}>
              <Tag>pH</Tag>
              <div style={{fontFamily: SANS, fontSize: 30, color: P.muted, marginTop: 26, letterSpacing: 0.5}}>
                hydrogen ion concentration  3 × 10<Sup>−5</Sup> M
              </div>
            </div>
            <div style={{position: 'absolute', left: 0, top: 330, width: 1920, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
              <Line size={58} color={P.muted}>pH = −log [H<Sup>+</Sup>]</Line>
              <Line size={58} color={P.muted}>= −(log 3 + log 10<Sup>−5</Sup>)</Line>
              <Line size={132} style={{marginTop: 40}}>= 5 − 0.48 ≈ <Circled>4.5</Circled></Line>
            </div>
          </>
        }
        over={<AxoCrawl x={x} y={y} scale={0.75} heading={heading} phase={phase} moving={moving} mood={moving < 0.5 ? 'look' : 'calm'} />}
      />
    </AbsoluteFill>
  );
};
