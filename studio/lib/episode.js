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
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(path.join(dir, 'shots.json'), 'utf8'));
  } catch (e) {
    throw new Error(`shots.json is not valid JSON: ${e.message}`);
  }
  const check = require('./validate').validate(spec);
  if (check.errors.length) {
    throw new Error(`shots.json has ${check.errors.length} problem(s). Fix these first:\n- ${check.errors.join('\n- ')}`
      + (check.warnings.length ? `\n\nwarnings:\n- ${check.warnings.join('\n- ')}` : ''));
  }
  const wordsFile = spec.words ? path.join(dir, spec.words) : path.join(dir, 'words.json');
  const words = fs.existsSync(wordsFile) ? JSON.parse(fs.readFileSync(wordsFile, 'utf8')) : null;
  const style = require('./styles').styleOf(spec.style);
  const plan = schedule(spec.shots, words);
  const shots = spec.shots.map((shot, i) => {
    const win = plan.shots[i];
    const tpl = TEMPLATES[shot.template];
    if (!tpl) throw new Error(`shot ${i + 1}: unknown template "${shot.template}". Known: ${Object.keys(TEMPLATES).join(', ')}`);
    const ctx = { dur: win.dur, cue: cueFinder(win.words), cast: spec.cast || {}, index: i, style };
    const render = tpl(shot, ctx);
    return { name: shot.id || `${i + 1}-${shot.template}${shot.kind ? `-${shot.kind}` : ''}`, dur: win.dur, render: (t) => render(t), frameOpts: { vignette: style.vignette } };
  });
  return {
    lint: () => [...check.warnings, ...lint(spec, plan, style)],
    style: style.name,
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
const MOVING = new Set(['fuse', 'chart', 'map', 'data', 'diagram', 'screen']); // built/continuous shots
function lint(spec, plan, style = { pacing: { maxShot: 8, maxBuild: 13, maxGap: 4 } }) {
  const { maxShot, maxBuild, maxGap } = style.pacing;
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
    (shot.lines || []).forEach((l) => times.push(l.on ? cue(l.on, null) : null));
    const ev = times.filter((x) => x != null && x <= win.dur).sort((a, b) => a - b);
    ev.push(win.dur);
    let gap = 0, gapAt = 0;
    for (let k = 1; k < ev.length; k++) if (ev[k] - ev[k - 1] > gap) { gap = ev[k] - ev[k - 1]; gapAt = ev[k - 1]; }
    const label = `shot ${i + 1} (${shot.template}, ${win.dur.toFixed(1)}s)`;
    if (!MOVING.has(shot.template) && !['card', 'chapter', 'title'].includes(shot.template) && gap > maxGap) warn.push(`${label}: nothing happens for ${gap.toFixed(1)}s from ${gapAt.toFixed(1)}s. Add a sticker/pose/stat on a word, or split the shot`);
    if (!MOVING.has(shot.template) && !['card', 'chapter'].includes(shot.template) && win.dur > maxShot) warn.push(`${label}: longer than ${maxShot}s. Split it (wide -> close, or a second template)`);
    if (shot.template === 'title' && win.dur > 5) warn.push(`${label}: title cards should be short. Move most of this narration to the next shot`);
    if (MOVING.has(shot.template) && win.dur > maxBuild + 1) warn.push(`${label}: very long even for a built-up shot (max ~${maxBuild}s)`);
    if (shot.template === 'card' && win.dur > 4) warn.push(`${label}: black cards hold 0.5-2.5s after typing. Keep the narration on them short`);
  });
  return warn;
}

module.exports = { loadEpisode, lint };
