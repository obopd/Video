// Shared layout for Axol's Lab lessons: lab backdrop + Axo + an HTML layer.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage, useFontsReady} from '../../lib/stage';
import {LabBackground} from '../../lib/lab';
import {Axo, AxoExpression, AxoPose} from '../../lib/axo';
import {Board, BoardLine, Tex} from '../../lib/math';
import {resolveCue, CueSpec} from '../../lib/cues';
import {tween} from '../../lib/shapes';
import {C, FONT} from '../../lib/theme';
import type {SceneProps} from '../../lib/types';

export type AxoEvent = {at: number; expression?: AxoExpression; pose?: AxoPose};

/** Axo's expression/pose at frame f: the latest event wins; `pointFor` frames of pointing after `pointAt` times. */
export const axoAt = (f: number, events: AxoEvent[], base: {expression: AxoExpression; pose: AxoPose}, pointAt: number[] = [], pointFor = 36) => {
  let expression = base.expression, pose = base.pose;
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    if (f >= e.at) {
      if (e.expression) expression = e.expression;
      if (e.pose) pose = e.pose;
    }
  }
  if (pose === 'rest' && pointAt.some((t) => f >= t && f < t + pointFor)) pose = 'point';
  return {expression, pose};
};

export const LabScene: React.FC<{svg?: React.ReactNode; html?: React.ReactNode; over?: React.ReactNode; dim?: number}> = ({svg, html, over, dim}) => {
  useFontsReady();
  return <Stage svg={<><LabBackground dim={dim} />{svg}</>} html={html} over={over} />;
};

/** An exam-paper style card with typeset math. */
export const QuestionCard: React.FC<{x: number; y: number; w: number; tex: string; label?: string; opacity?: number; scale?: number}> = ({
  x, y, w, tex, label = "Axo's question", opacity = 1, scale = 1,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, opacity, transform: `scale(${scale})`, transformOrigin: 'top left',
    background: '#fbf8f1', borderRadius: 22, padding: '22px 40px 26px', boxSizing: 'border-box',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderLeft: `14px solid ${C.accent}`}}>
    <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: 2, textTransform: 'uppercase', color: '#b0476a', marginBottom: 6}}>{label}</div>
    <Tex tex={tex} size={50} color="#1d1636" />
  </div>
);

type Step = {
  cue?: CueSpec; tex?: string; text?: string; note?: string; color?: string; size?: number;
  clear?: boolean; title?: string; axo?: AxoExpression; pose?: AxoPose;
};

/** Generic lesson board: Axo on the left, lines of math appearing on cue. Driven entirely by YAML props. */
export const BoardScene: React.FC<SceneProps> = (props) => {
  const f = useCurrentFrame();
  const steps = (props.steps as Step[]) ?? [];
  const question = props.question as string | undefined;
  const n = steps.length;
  let prev = 0;
  const timed = steps.map((s, i) => {
    const at = Math.max(prev, resolveCue(props, s.cue, (i + 1) / (n + 1)));
    prev = at;
    return {...s, at};
  });
  // pages: a `clear` step starts a fresh board
  let pageStart = 0;
  timed.forEach((s) => { if (s.clear && f >= s.at) pageStart = s.at; });
  const lines: BoardLine[] = timed
    .filter((s) => (s.tex || s.text) && s.at >= pageStart)
    .map((s) => ({at: s.at, tex: s.tex, text: s.text, note: s.note, color: s.color, size: s.size}));
  let title = props.title as string | undefined;
  let titleAt = 0;
  timed.forEach((s) => { if (s.title && f >= s.at) { title = s.title; titleAt = s.at; } });

  const ax = axoAt(f, timed.filter((s) => s.axo || s.pose).map((s) => ({at: s.at, expression: s.axo, pose: s.pose})),
    {expression: (props.axo as AxoExpression) ?? 'happy', pose: (props.pose as AxoPose) ?? 'rest'},
    timed.filter((s) => s.tex || s.text).map((s) => s.at));

  const by = question ? 260 : 90;
  return (
    <LabScene
      svg={<Axo x={300} y={705} scale={0.92} expression={ax.expression} pose={ax.pose} look={[0.7, -0.2]} />}
      html={
        <>
          {question && <QuestionCard x={620} y={64} w={1220} tex={question} label={(props.questionLabel as string) ?? "Axo's question"}
                                     opacity={tween(f, 0, 12, 0, 1)} />}
          <Board x={620} y={by} w={1220} h={1000 - by - 40} title={title} titleAt={titleAt} lines={lines}
                 maxLines={(props.maxLines as number) ?? 5} lineSize={(props.lineSize as number) ?? 60} />
        </>
      }
    />
  );
};
