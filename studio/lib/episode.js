// Build a renderable episode from plain data: episodes/<ep>/shots.json (+ optional words.json, audio).
//
// shots.json:
// {
//   "title": "Ozempic, explained",
//   "fps": 24,
//   "audio": "vo.mp3",            // optional narration file in the episode folder
//   "words": "words.json",        // optional word timings (tools/transcribe.py); without it timing is estimated
//   "cast": { "eng": { "base": "investor", "glasses": true } },   // optional named characters
//   "shots": [ { "template": "talk", "vo": "narration for this shot", ... }, ... ]
// }
// See SHOTS.md for every template and field.

const fs = require('fs');
const path = require('path');
const { schedule, cueFinder } = require('./timing');
const { TEMPLATES } = require('./templates');

function loadEpisode(dir) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'shots.json'), 'utf8'));
  const wordsFile = spec.words ? path.join(dir, spec.words) : path.join(dir, 'words.json');
  const words = fs.existsSync(wordsFile) ? JSON.parse(fs.readFileSync(wordsFile, 'utf8')) : null;
  const plan = schedule(spec.shots, words);
  const shots = spec.shots.map((shot, i) => {
    const win = plan.shots[i];
    const tpl = TEMPLATES[shot.template];
    if (!tpl) throw new Error(`shot ${i + 1}: unknown template "${shot.template}". Known: ${Object.keys(TEMPLATES).join(', ')}`);
    const ctx = { dur: win.dur, cue: cueFinder(win.words), cast: spec.cast || {}, index: i };
    const render = tpl(shot, ctx);
    return { name: shot.name || `${i + 1}-${shot.template}`, dur: win.dur, render: (t) => render(t) };
  });
  return {
    lint: () => lint(spec, plan),
    fps: spec.fps || 24,
    audio: spec.audio,
    gaps: plan.gaps,
    estimated: !words,
    shots,
    plan,
  };
}

// Pacing check against the measured reference rules (MOTION.md). Returns warning strings.
// Events = the cut itself plus every cue (`on` / `at`) in the shot, and implicit template entrances.
const MOVING = new Set(['fuse', 'chart', 'map']); // continuous motion: no still stretches
function lint(spec, plan) {
  const warn = [];
  spec.shots.forEach((shot, i) => {
    const win = plan.shots[i];
    const cue = cueFinder(win.words);
    const times = [0];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        if ((k === 'on' || /On$/.test(k)) && v != null) times.push(cue(v, null));
        else if ((k === 'at' || /At$/.test(k)) && typeof v === 'number') times.push(v);
        else if (typeof v === 'object') walk(v);
      }
    };
    walk(shot);
    if (shot.tag) times.push(0.1);
    if (shot.plate) times.push(0.5);
    if (shot.line) times.push(0.3);
    const ev = times.filter((x) => x != null && x <= win.dur).sort((a, b) => a - b);
    ev.push(win.dur);
    let gap = 0, gapAt = 0;
    for (let k = 1; k < ev.length; k++) if (ev[k] - ev[k - 1] > gap) { gap = ev[k] - ev[k - 1]; gapAt = ev[k - 1]; }
    const label = `shot ${i + 1} (${shot.template}, ${win.dur.toFixed(1)}s)`;
    if (!MOVING.has(shot.template) && gap > 4) warn.push(`${label}: nothing happens for ${gap.toFixed(1)}s from ${gapAt.toFixed(1)}s. Add a sticker/pose/stat on a word, or split the shot`);
    if (!MOVING.has(shot.template) && win.dur > 8) warn.push(`${label}: longer than 8s. Split it (wide -> close, or a second template)`);
    if (shot.template === 'title' && win.dur > 5) warn.push(`${label}: title cards should be short. Move most of this narration to the next shot`);
    if (MOVING.has(shot.template) && win.dur > 14) warn.push(`${label}: very long even for a built-up shot (max ~13s)`);
  });
  return warn;
}

module.exports = { loadEpisode, lint };
