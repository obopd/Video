// Render still frames of scenes to PNG for quick visual checks.
// Usage:
//   node stills.mjs OUT_DIR Component:frame[:durationFrames] ...
//   node stills.mjs OUT_DIR --jobs path/to/animation-jobs.json sceneIndex:seconds ...
// The --jobs form uses the real props (narration timing etc.) from `python -m ytvideo script.yaml --plan`.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
let [outDir, ...specs] = process.argv.slice(2);
let jobs = null;
if (specs[0] === '--jobs') {
  jobs = JSON.parse(fs.readFileSync(specs[1], 'utf8'));
  specs = specs.slice(2);
}
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({entryPoint: path.join(here, 'src/index.ts'), publicDir: path.join(here, 'public')});

for (const spec of specs) {
  let inputProps, frame, name;
  if (jobs) {
    const [idx, sec] = spec.split(':');
    inputProps = jobs[Number(idx)].props;
    frame = Math.min(inputProps.durationInFrames - 1, Math.round(Number(sec) * inputProps.fps));
    name = `${String(idx).padStart(2, '0')}-${inputProps.component}-${sec}s`;
  } else {
    const [component, fr, dur = '450'] = spec.split(':');
    inputProps = {component, durationInFrames: Number(dur), fps: 30, width: 1920, height: 1080, words: []};
    frame = Number(fr);
    name = `${component}-${fr}`;
  }
  const composition = await selectComposition({serveUrl, id: 'Scene', inputProps, browserExecutable});
  const output = path.join(outDir, `${name}.png`);
  await renderStill({composition, serveUrl, frame, output, inputProps, browserExecutable});
  console.log(output);
}
