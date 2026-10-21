#!/usr/bin/env node
// Renders an episode (a list of shots) to MP4, a still, or a contact sheet.
//
//   node render.js episodes/<name>                      -> renders/<name>.mp4 (1920x1080)
//   node render.js episodes/<name> --still 12.5         -> renders/<name>@12.5.png
//   node render.js episodes/<name> --sheet 1            -> contact sheet, one frame per second
//   node render.js episodes/<name> --from 10 --to 18    -> just that time range
//   node render.js episodes/<name> --scale 1            -> 1280x720 (default 1.5 = 1920x1080)
//   node render.js episodes/<name> --fps 12             -> quick low-fps preview
//   node render.js episodes/<name> --workers 3          -> parallel browser workers (default: CPUs - 1)
//
//   node render.js episodes/<name> --plan               -> print each shot's start/length (no rendering)
//
// An episode folder contains EITHER
//   shots.json (+ words.json, audio): plain data built with templates (lib/episode.js, SHOTS.md), OR
//   episode.js exporting { fps, shots: [{ name, dur, render(t, ctx) }], audio? } (hand-built shots).
// render(t) returns SVG markup for the shot at local time t (seconds). It must be pure.
//
// Speed: for video, film grain is added by ffmpeg (cheap) instead of an SVG turbulence filter
// (expensive in Chromium); stills and contact sheets keep the SVG grain so they look the same.

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const { frame } = require('./lib/svg');

const GRAIN_VF = 'noise=c0s=2:allf=t'; // ~1% luma noise: stops banding, matches the near-invisible SVG grain

function args() {
  const a = process.argv.slice(2);
  const o = { dir: a[0] };
  for (let i = 1; i < a.length; i++) {
    const key = a[i].replace(/^--/, '');
    const val = a[i + 1];
    if (val == null || val.startsWith('--')) o[key] = true; // bare flag, e.g. --plan
    else { o[key] = val; i++; }
  }
  return o;
}

function timeline(shots) {
  let at = 0;
  return shots.map((s) => {
    const e = { ...s, start: at };
    at += s.dur;
    return e;
  });
}

function shotAt(tl, t) {
  for (const s of tl) if (t < s.start + s.dur) return s;
  return tl[tl.length - 1];
}

async function openStage(browser, scale) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: scale });
  await page.goto('file://' + path.join(__dirname, 'lib', 'stage.html'));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

function makeDraw(page, tl, fps, { svgGrain, type = 'png' }) {
  return async (t) => {
    const s = shotAt(tl, t);
    const local = t - s.start;
    const opts = { ...(s.frameOpts || {}) };
    if (!svgGrain) opts.grain = false;
    const svg = frame(s.render(local, { dur: s.dur, global: t, fps }), t, opts);
    await page.evaluate((m) => { document.getElementById('stage').innerHTML = m; }, svg);
    return page.screenshot({ type, quality: type === 'jpeg' ? 94 : undefined, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  };
}

// Insert silence into the narration where cards (no-vo shots) were placed: gaps = [{ at, dur }].
async function insertGaps(audio, gaps, tmp) {
  const out = path.join(tmp, 'vo-gapped.wav');
  const fmt = 'aformat=sample_rates=44100:channel_layouts=stereo';
  const parts = [];
  let f = '';
  let prev = 0;
  gaps.forEach((gp, i) => {
    f += `[0:a]atrim=start=${prev}:end=${gp.at},asetpts=PTS-STARTPTS,${fmt}[s${i}];aevalsrc=0:d=${gp.dur}:s=44100,${fmt}[g${i}];`;
    parts.push(`[s${i}]`, `[g${i}]`);
    prev = gp.at;
  });
  f += `[0:a]atrim=start=${prev},asetpts=PTS-STARTPTS,${fmt}[end];`;
  parts.push('[end]');
  f += `${parts.join('')}concat=n=${parts.length}:v=0:a=1[out]`;
  await run('ffmpeg', ['-v', 'error', '-y', '-i', audio, '-filter_complex', f, '-map', '[out]', out]);
  return out;
}

function run(cmd, a) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
  });
}

// One worker renders frames [f0, f1) into its own MP4 segment.
async function renderSegment(browser, tl, fps, scale, from, f0, f1, out, progress) {
  const page = await openStage(browser, scale);
  const draw = makeDraw(page, tl, fps, { svgGrain: false, type: 'jpeg' });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', GRAIN_VF, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', String(fps), out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    const buf = await draw(from + f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    progress();
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
}

async function main() {
  const o = args();
  if (!o.dir) throw new Error('usage: node render.js episodes/<name> [--still t | --sheet every] [--from s --to s]');
  const dir = path.resolve(o.dir);
  const name = path.basename(dir);
  const ep = fs.existsSync(path.join(dir, 'episode.js'))
    ? require(path.join(dir, 'episode.js'))
    : require('./lib/episode').loadEpisode(dir);
  if (ep.estimated) console.error('note: no words.json; shot timing is estimated at 165 wpm');
  const fps = Number(o.fps || ep.fps || 24);
  const scale = Number(o.scale || 1.5);
  const tl = timeline(ep.shots);
  const total = tl.reduce((s, x) => s + x.dur, 0);
  const outDir = path.join(__dirname, 'renders');
  fs.mkdirSync(outDir, { recursive: true });
  if (o.plan != null) {
    tl.forEach((s, i) => console.log(`${String(i + 1).padStart(3)}  ${s.start.toFixed(2).padStart(7)}s  ${s.dur.toFixed(2).padStart(5)}s  ${s.name}`));
    console.log(`total ${total.toFixed(1)}s`);
    if (ep.lint) {
      const w = ep.lint();
      console.log(w.length ? `\nwarnings (${w.length}):\n- ${w.join('\n- ')}` : '\nchecks: OK');
    }
    return;
  }
  const browser = await chromium.launch();

  if (o.still != null) {
    const page = await openStage(browser, scale);
    const out = o.out || path.join(outDir, `${name}@${o.still}.png`);
    fs.writeFileSync(out, await makeDraw(page, tl, fps, { svgGrain: true })(Number(o.still)));
    console.log(out);
    await browser.close();
    return;
  }

  const from = Number(o.from || 0);
  const to = Math.min(total, Number(o.to || total));

  if (o.sheet != null) {
    const page = await openStage(browser, scale);
    const draw = makeDraw(page, tl, fps, { svgGrain: true });
    const every = Number(o.sheet);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
    let i = 0;
    for (let t = from + 0.05; t < to; t += every) fs.writeFileSync(path.join(tmp, `f${String(i++).padStart(4, '0')}.png`), await draw(t));
    await browser.close();
    const out = o.out || path.join(outDir, `${name}-sheet.jpg`);
    const cols = 4;
    await run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(tmp, 'f%04d.png'), '-vf', `scale=480:270,tile=${cols}x${Math.ceil(i / cols)}:padding=4:color=white`, '-frames:v', '1', '-q:v', '3', out]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(out);
    return;
  }

  // ---- video: split frames across workers, render segments in parallel, then join ----
  const out = o.out || path.join(outDir, `${name}.mp4`);
  const frames = Math.round((to - from) * fps);
  const workers = Math.max(1, Math.min(Number(o.workers || Math.max(1, os.cpus().length - 1)), Math.ceil(frames / fps)));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
  const t0 = Date.now();
  let done = 0;
  const progress = () => {
    done++;
    if (done % fps === 0) process.stderr.write(`  ${(done / fps).toFixed(0)}s / ${(frames / fps).toFixed(0)}s rendered\r`);
  };
  const per = Math.ceil(frames / workers);
  const segs = [];
  for (let w = 0; w < workers; w++) {
    const f0 = w * per, f1 = Math.min(frames, f0 + per);
    if (f0 >= f1) break;
    segs.push({ f0, f1, file: path.join(tmp, `seg${w}.mp4`) });
  }
  await Promise.all(segs.map((s) => renderSegment(browser, tl, fps, scale, from, s.f0, s.f1, s.file, progress)));
  await browser.close();

  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s.file}'`).join('\n'));
  let audio = o.audio || (ep.audio && path.join(dir, ep.audio));
  if (audio && fs.existsSync(audio) && ep.gaps && ep.gaps.length) audio = await insertGaps(audio, ep.gaps, tmp);
  const join = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
  if (audio && fs.existsSync(audio)) join.push('-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k');
  join.push('-c:v', 'copy', '-movflags', '+faststart', out);
  await run('ffmpeg', join);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${out}  (${frames} frames, ${segs.length} workers, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

main().catch((e) => { console.error(e.message && e.message.startsWith('shots.json') ? e.message : e); process.exit(1); });
