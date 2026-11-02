import type {SceneProps, Word} from './types';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find where a phrase is spoken: index of its first word, or -1. `nth` picks a later occurrence (1-based). */
export const findPhrase = (words: Word[], phrase: string, nth = 1, after = 0): number => {
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!target.length) return -1;
  let seen = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].start < after) continue;
    let ok = true;
    for (let k = 0; k < target.length; k++) {
      const w = words[i + k] ? norm(words[i + k].text) : '';
      // last word may be a prefix ("insulat" matches "insulating")
      if (!(w === target[k] || (k === target.length - 1 && w.startsWith(target[k])))) { ok = false; break; }
    }
    if (ok && ++seen === nth) return i;
  }
  return -1;
};

/**
 * Sync animation to narration. `cue('vanishes')` returns the frame where that
 * word (or phrase, e.g. 'ten to the minus five') is spoken. `nth` selects a later
 * occurrence. Falls back to `fallback` (a 0..1 fraction of the scene) if not found.
 */
export const makeCue = (props: SceneProps) => {
  const {words = [], fps, durationInFrames} = props;
  return (phrase: string, fallback = 0.5, after = 0, nth = 1): number => {
    const i = findPhrase(words, phrase, nth, after);
    return i >= 0 ? Math.round(words[i].start * fps) : Math.round(fallback * durationInFrames);
  };
};

/** A cue spec as written in YAML: "word", or {cue: "phrase", nth: 2, offset: 0.3}. */
export type CueSpec = string | {cue: string; nth?: number; offset?: number};

export const resolveCue = (props: SceneProps, spec: CueSpec | undefined, fallback: number): number => {
  if (spec === undefined) return Math.round(fallback * props.durationInFrames);
  const cue = makeCue(props);
  if (typeof spec === 'string') return cue(spec, fallback);
  return cue(spec.cue, fallback, 0, spec.nth ?? 1) + Math.round((spec.offset ?? 0) * props.fps);
};
