// Style frame for the redesigned Axol's Lab look (one still for approval).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage, useFontsReady} from '../../lib/stage';
import {P, Paper, Tag, Line, Sup, Circled, SANS} from '../../lib/paper';
import {Axo2} from '../../lib/axo2';
import type {SceneProps} from '../../lib/types';

export const StyleFrame: React.FC<SceneProps> = () => {
  useFontsReady();
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
        over={<Axo2 x={1640} y={975} scale={0.74} mood="happy" peek />}
      />
    </AbsoluteFill>
  );
};
