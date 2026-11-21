export type Word = {text: string; start: number; end: number};

export type SceneProps = {
  component: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  /** Narration words with times in seconds from the start of the scene. */
  words?: Word[];
  [key: string]: unknown;
};
