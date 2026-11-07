import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {sunScenes} from './scenes/sun';
import {mcatScenes} from './scenes/mcat';
import {StyleFrame} from './scenes/axolab/StyleFrame';
import {frameScenes} from './scenes/axolab/frames';
import {riddleScenes} from './scenes/axolab/riddle';
import {v1Scenes} from './scenes/axolab/v1';
import {brandScenes} from './scenes/axolab/brand';
import {v2Scenes} from './scenes/axolab/v2';
import type {SceneProps} from './lib/types';
import {C, FONT} from './lib/theme';

// Register new scene components here so YAML scripts can use them by name.
const SCENES: Record<string, React.FC<SceneProps>> = {
  ...sunScenes,
  ...mcatScenes,
  StyleFrame,
  ...frameScenes,
  ...riddleScenes,
  ...v1Scenes,
  ...brandScenes,
  ...v2Scenes,
};

const Router: React.FC<SceneProps> = (props) => {
  const Comp = SCENES[props.component];
  if (!Comp) {
    return (
      <AbsoluteFill style={{background: C.bgTop, color: C.text, fontFamily: FONT, fontSize: 48, padding: 80}}>
        Unknown scene component: {String(props.component)}
        <br />Available: {Object.keys(SCENES).join(', ')}
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{background: C.bgTop}}><Comp {...props} /></AbsoluteFill>;
};

const defaults: SceneProps = {component: 'SunVanishes', durationInFrames: 300, fps: 30, width: 1920, height: 1080, words: []};

export const RemotionRoot: React.FC = () => (
  <>
    {/* "Scene" is what ytvideo renders; size/length come from the props it passes. */}
    <Composition
      id="Scene"
      component={Router as React.FC<Record<string, unknown>>}
      defaultProps={defaults}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={({props}) => {
        const p = props as unknown as SceneProps;
        return {durationInFrames: p.durationInFrames, fps: p.fps, width: p.width, height: p.height};
      }}
    />
    {/* One preview per scene for `npm run studio`. */}
    {Object.keys(SCENES).map((name) => (
      <Composition key={name} id={name} component={Router as React.FC<Record<string, unknown>>}
                   defaultProps={{...defaults, component: name}} durationInFrames={300} fps={30} width={1920} height={1080} />
    ))}
  </>
);
