// Typeset math (KaTeX) and the "board": lines of math that appear in sync with narration.
import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {useCurrentFrame} from 'remotion';
import {C, FONT} from './theme';
import {tween} from './shapes';

const cache = new Map<string, string>();
export const texHtml = (tex: string, display = false) => {
  const key = `${display}|${tex}`;
  if (!cache.has(key)) {
    cache.set(key, katex.renderToString(tex, {throwOnError: false, displayMode: display, strict: 'ignore', trust: false}));
  }
  return cache.get(key)!;
};

export const Tex: React.FC<{tex: string; size?: number; color?: string; style?: React.CSSProperties}> = ({tex, size = 56, color = C.text, style}) => (
  <span style={{fontSize: size, color, lineHeight: 1.25, ...style}} dangerouslySetInnerHTML={{__html: texHtml(tex)}} />
);

/** Mixed text: plain words with $...$ math segments. */
export const Rich: React.FC<{text: string; size?: number; color?: string; weight?: number}> = ({text, size = 44, color = C.text, weight = 600}) => (
  <span style={{fontFamily: FONT, fontSize: size, color, fontWeight: weight, lineHeight: 1.3}}>
    {text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('$') ? <span key={i} style={{fontSize: size * 1.08}} dangerouslySetInnerHTML={{__html: texHtml(part.slice(1, -1))}} />
        : part.startsWith('**') ? <b key={i} style={{color: '#ffd166', fontWeight: 800}}>{part.slice(2, -2)}</b>
        : <span key={i}>{part}</span>,
    )}
  </span>
);

export type BoardLine = {at: number; tex?: string; text?: string; note?: string; color?: string; size?: number; strike?: number};

/**
 * A glassy panel showing lines that appear at their `at` frames. The newest line
 * glows briefly; when there are more than `maxLines`, older lines scroll away.
 */
export const Board: React.FC<{
  x: number; y: number; w: number; h: number; title?: string; titleAt?: number;
  lines: BoardLine[]; maxLines?: number; lineSize?: number; align?: 'left' | 'center';
}> = ({x, y, w, h, title, titleAt = 0, lines, maxLines = 5, lineSize = 58, align = 'left'}) => {
  const f = useCurrentFrame();
  const shown = lines.filter((l) => f >= l.at);
  const start = Math.max(0, shown.length - maxLines);
  const latest = shown.length ? shown[shown.length - 1].at : -999;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 36,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
      border: '2px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', padding: '44px 60px',
      boxSizing: 'border-box', overflow: 'hidden', fontFamily: FONT}}>
      {title && (
        <div style={{fontSize: 36, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase',
          opacity: tween(f, titleAt, titleAt + 10, 0, 1), marginBottom: 18}}>{title}</div>
      )}
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, alignItems: align === 'center' ? 'center' : 'flex-start'}}>
        {shown.slice(start).map((l, i) => {
          const a = tween(f, l.at, l.at + 10, 0, 1);
          const glow = l.at === latest ? tween(f, l.at, l.at + 45, 1, 0.25) : 0;
          return (
            <div key={`${start + i}`} style={{opacity: a, transform: `translateY(${(1 - a) * 18}px)`, display: 'flex',
              alignItems: 'baseline', gap: 28, filter: glow > 0.3 ? `drop-shadow(0 0 ${14 * glow}px rgba(255,209,102,${0.6 * glow}))` : undefined}}>
              {l.tex && <Tex tex={l.tex} size={l.size ?? lineSize} color={l.color ?? C.text} />}
              {l.text && <Rich text={l.text} size={(l.size ?? lineSize) * 0.72} color={l.color ?? C.text} />}
              {l.note && <span style={{fontSize: 30, color: C.muted, fontWeight: 600}}>{l.note}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** A small rounded tag/chip. */
export const Chip: React.FC<{children: React.ReactNode; color?: string; opacity?: number; style?: React.CSSProperties}> = ({children, color = C.accent, opacity = 1, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 999,
    background: `${color}26`, border: `2px solid ${color}`, color: C.text, fontFamily: FONT, fontWeight: 700, fontSize: 36,
    opacity, transform: `scale(${0.85 + 0.15 * opacity})`, ...style}}>{children}</div>
);
