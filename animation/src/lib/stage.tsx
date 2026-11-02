// A 1920x1080 design-space stage that scales to the output size, with an SVG
// layer for illustration and an HTML layer for typeset math and text.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useVideoConfig} from 'remotion';
import {W, H} from './theme';

export const Stage: React.FC<{svg?: React.ReactNode; html?: React.ReactNode; over?: React.ReactNode}> = ({svg, html, over}) => {
  const {width, height} = useVideoConfig();
  const s = Math.min(width / W, height / H);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: (width - W * s) / 2, top: (height - H * s) / 2, width: W, height: H,
        transform: `scale(${s})`, transformOrigin: 'top left'}}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>{svg}</svg>
        <div style={{position: 'absolute', inset: 0}}>{html}</div>
        {over && <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>{over}</svg>}
      </div>
    </AbsoluteFill>
  );
};

/** Hold rendering until web fonts (KaTeX, etc.) have loaded, so no frame uses a fallback font. */
export const useFontsReady = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);
};
