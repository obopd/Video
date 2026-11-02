// Batch renderer used by ytvideo: bundles the project once, then renders every job.
// Usage: node render.mjs jobs.json
// jobs.json: [{ "out": "/abs/path.mp4", "props": { "component": "...", "durationInFrames": 300, ... } }]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// Optional: use an existing Chrome/Chromium instead of letting Remotion download one.
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const serveUrl = await bundle({entryPoint: path.join(here, 'src/index.ts')});

for (const [i, job] of jobs.entries()) {
  const composition = await selectComposition({serveUrl, id: 'Scene', inputProps: job.props, browserExecutable});
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: job.crf ?? 18,
    muted: true,
    outputLocation: job.out,
    inputProps: job.props,
    browserExecutable,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(`\r  animation ${i + 1}/${jobs.length} [${job.props.component}] ${pct}%   `);
      }
    },
  });
  process.stdout.write('\n');
}
