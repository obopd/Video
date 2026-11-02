import type {SceneProps, Word} from './types';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

/**
 * Sync animation to narration. `cue('vanishes')` returns the frame where that
 * word is spoken (first match after `after` seconds), falling back to
 * `fallback` (a 0..1 fraction of the scene) if the word isn't in the narration.
 */
export const makeCue = (props: SceneProps) => {
  const {words = [], fps, durationInFrames} = props;
  return (word: string, fallback = 0.5, after = 0): number => {
    const w = norm(word);
    const hit = words.find((x: Word) => x.start >= after && norm(x.text).startsWith(w));
    return hit ? Math.round(hit.start * fps) : Math.round(fallback * durationInFrames);
  };
};
