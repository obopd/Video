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
  // crawl in from the left along the bottom, pause under the answer, crawl on
  const stopAt = D * 0.45, goAt = D * 0.7;
  const moving = f < stopAt ? f : f < goAt ? stopAt : f - (goAt - stopAt);
  const x = interpolate(moving, [0, D - (goAt - stopAt)], [-200, 2150]);
  const phase = moving / 26;
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
        over={<AxoCrawl x={x} y={1052} scale={0.62} phase={phase} mood={f > stopAt && f < goAt ? 'happy' : 'calm'} />}
      />
    </AbsoluteFill>
  );
};
