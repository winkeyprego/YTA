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
//   node render.js episodes/<name> --plan               -> print each shot's start/length + checks (no rendering)
//   node render.js episodes/<name> --qa                 -> layout check: overlaps, text off screen, faces covered
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

// ---- layout QA: measure where faces and on-screen text land; report overlaps and text off-frame ----
// Elements opt in with data-qa="face" | "text" (lib/ui.js, characters.js, host.js). No screenshots: fast.
// chapter/title/card shots are meant to be sparse; everything else should never hold an (almost) empty frame
const EMPTY_OK = new Set(['chapter', 'card', 'title']);
const EMPTY_EDGES = Number(process.env.QA_EMPTY || 0.02);

// Share of edge pixels in a tiny render of the frame: a plain backdrop scores ~0.01, any real content far more.
async function edgeDensity(page, s, lt, fps) {
  const svg = frame(s.render(lt, { dur: s.dur, global: s.start + lt, fps }), s.start + lt, { grain: false, vignette: false });
  return page.evaluate(async (m) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m);
    await img.decode().catch(() => null);
    const c = document.createElement('canvas'); c.width = 128; c.height = 72;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 128, 72);
    const d = g.getImageData(0, 0, 128, 72).data;
    let e = 0;
    for (let y = 0; y < 71; y++) for (let x = 0; x < 127; x++) {
      const k = (y * 128 + x) * 4, r = k + 4, b = k + 512;
      if (Math.abs(d[k] - d[r]) + Math.abs(d[k + 1] - d[r + 1]) + Math.abs(d[k + 2] - d[r + 2]) > 40
        || Math.abs(d[k] - d[b]) + Math.abs(d[k + 1] - d[b + 1]) + Math.abs(d[k + 2] - d[b + 2]) > 40) e++;
    }
    return e / (127 * 71);
  }, svg);
}

async function runQA(browser, tl, fps, name, outDir, from = 0, to = Infinity) {
  const page = await openStage(browser, 1);
  const issues = [];
  let checked = 0;
  for (let i = 0; i < tl.length; i++) {
    const s = tl[i];
    if (s.start + s.dur <= from || s.start >= to) continue; // --qa --from/--to checks only that stretch
    checked++;
    const times = s.dur > 1.2 ? [0.45, 0.72, 0.97].map((k) => s.dur * k) : [s.dur * 0.8];
    const seen = new Set();
    for (const lt of times) {
      const svg = frame(s.render(lt, { dur: s.dur, global: s.start + lt, fps }), s.start + lt, { grain: false });
      const found = await page.evaluate((m) => {
        document.getElementById('stage').innerHTML = m;
        const els = [...document.querySelectorAll('[data-qa]')].map((e) => {
          const r = e.getBoundingClientRect();
          let op = 1;
          for (let p = e; p && p.getAttribute; p = p.parentNode) { const v = p.getAttribute('opacity'); if (v != null) op *= Number(v); }
          return { kind: e.getAttribute('data-qa'), qn: e.getAttribute('data-qn') || 'face', x: r.left, y: r.top, w: r.width, h: r.height, op };
        }).filter((e) => e.w > 2 && e.h > 2 && e.op > 0.5);
        const area = (a) => a.w * a.h;
        const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const texts = els.filter((e) => e.kind === 'text');
        const faces = els.filter((e) => e.kind === 'face' && e.w > 60); // ignore background crowds
        const out = [];
        for (let a = 0; a < texts.length; a++) {
          const A = texts[a];
          const off = Math.max(0, -A.x, -A.y, A.x + A.w - 1280, A.y + A.h - 720);
          if (off > 6) out.push(`${A.qn} runs ${Math.round(off)}px off screen`);
          for (let b = a + 1; b < texts.length; b++) {
            const B = texts[b];
            if (inter(A, B) > 0.1 * Math.min(area(A), area(B))) out.push(`${A.qn} overlaps ${B.qn}`);
          }
          for (const F of faces) {
            // face boxes are shrunk a little: touching a hairline is fine, covering eyes or mouth is not
            const core = { x: F.x + F.w * 0.15, y: F.y + F.h * 0.2, w: F.w * 0.7, h: F.h * 0.7 };
            if (inter(A, core) > 0.06 * area(core)) out.push(`${A.qn} covers a face`);
          }
        }
        return out;
      }, svg);
      // nearly empty frame (a misspelled field, a kit with no data, a screen that left)
      if (lt > 0.8 && !EMPTY_OK.has(s.template) && (await edgeDensity(page, s, lt, fps)) < EMPTY_EDGES) {
        found.push(`frame is almost empty (check field names against the kit header in SHOTS.md, or the cue times)`);
      }
      found.forEach((f) => { if (!seen.has(f)) { seen.add(f); issues.push({ shot: i + 1, name: s.name, t: s.start + lt, msg: f }); } });
    }
    // the cut must land on something: an opening that builds from an empty backdrop reads as a gap
    if (!EMPTY_OK.has(s.template) && s.dur > 1 && (await edgeDensity(page, s, 0.2, fps)) < EMPTY_EDGES) {
      issues.push({ shot: i + 1, name: s.name, t: s.start + 0.2, msg: 'opens on an almost empty frame (something should be on screen within 0.2s of the cut)' });
    }
  }
  const fmt = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  const lines = issues.map((x) => `shot ${x.shot} (${x.name}) at ${fmt(x.t)} [--still ${x.t.toFixed(1)}]: ${x.msg}`);
  const qaFile = `${name}-qa${from ? `-${Math.round(from)}` : ''}.txt`;
  fs.writeFileSync(path.join(outDir, qaFile), lines.join('\n') + '\n');
  console.log(lines.length ? `layout QA: ${lines.length} issue(s)\n- ${lines.slice(0, 60).join('\n- ')}${lines.length > 60 ? `\n... (${lines.length - 60} more in renders/${qaFile})` : ''}` : `layout QA: OK (${checked} shots checked)`);
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
    if (ep.variety) console.log(`\n${ep.variety().join('\n')}`);
    if (ep.lint) {
      const w = ep.lint();
      console.log(w.length ? `\nwarnings (${w.length}):\n- ${w.join('\n- ')}` : '\nchecks: OK');
    }
    return;
  }
  const browser = await chromium.launch();

  if (o.qa != null) {
    await runQA(browser, tl, fps, name, outDir, Number(o.from || 0), o.to != null ? Number(o.to) : Infinity);
    await browser.close();
    return;
  }

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
