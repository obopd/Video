// Render still frames of scenes to PNG for quick visual checks.
// Usage: node stills.mjs OUT_DIR Component:frame[:durationFrames] ...
//   e.g. node stills.mjs /tmp/stills Freeze:200 DeepVent:400:500
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, ...specs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({entryPoint: path.join(here, 'src/index.ts')});

for (const spec of specs) {
  const [component, frame, dur = '450'] = spec.split(':');
  const inputProps = {component, durationInFrames: Number(dur), fps: 30, width: 1920, height: 1080, words: []};
  const composition = await selectComposition({serveUrl, id: 'Scene', inputProps, browserExecutable});
  const output = path.join(outDir, `${component}-${frame}.png`);
  await renderStill({composition, serveUrl, frame: Number(frame), output, inputProps, browserExecutable});
  console.log(output);
}
