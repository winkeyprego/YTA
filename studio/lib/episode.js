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
  let where = (msg) => msg;
  const boardWarnings = [];
  if (fs.existsSync(path.join(dir, 'storyboard.txt')) || fs.readdirSync(dir).some((f) => /^storyboard\..+\.txt$/.test(f))) {
    // compact storyboard (STORYBOARD.md) -> shots spec; messages point at storyboard lines
    const sb = require('./storyboard').compileStoryboard(dir);
    spec = sb.spec;
    where = (msg) => msg.replace(/^shots? (\d+)(-(\d+))?/, (m, a, _, b) => `${m} [${sb.lineOf[a - 1]}${b ? ` to ${sb.lineOf[b - 1]}` : ''}]`);
    const ranges = (xs) => xs.reduce((acc, x) => { const l = acc[acc.length - 1]; if (l && x === l[1] + 1) l[1] = x; else acc.push([x, x]); return acc; }, [])
      .map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(', ');
    if (sb.missing.length) boardWarnings.push(`beats not used by any shot: ${ranges(sb.missing)}`);
    if (sb.doubled.length) boardWarnings.push(`beats used twice: ${ranges(sb.doubled)}`);
    sb.mixedMontage.forEach((l) => boardWarnings.push(`${l}: montage mixes frames with and without "at"/"on". Give all frames a time or none`));
    fs.writeFileSync(path.join(dir, 'shots.compiled.json'), JSON.stringify(spec, null, 1));
  } else {
    try {
      spec = JSON.parse(fs.readFileSync(path.join(dir, 'shots.json'), 'utf8'));
    } catch (e) {
      throw new Error(`shots.json is not valid JSON: ${e.message}`);
    }
  }
  const check = require('./validate').validate(spec);
  check.errors = check.errors.map(where);
  check.warnings = [...boardWarnings, ...check.warnings.map(where)];
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
    return { name: shot.id || `${i + 1}-${shot.template}${shot.kind ? `-${shot.kind}` : ''}`, dur: win.dur, render: (t) => render(t), template: shot.template, frameOpts: { vignette: shot.vignette ?? style.vignette } };
  });
  return {
    lint: () => [...check.warnings, ...lint(spec, plan, style).map(where)],
    variety: () => variety(spec, plan),
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
    if (shot.template === 'talk' && Array.isArray(shot.lines)) shot.lines.forEach((l) => times.push(l.on ? cue(l.on, null) : null));
    const ev = times.filter((x) => x != null && x <= win.dur).sort((a, b) => a - b);
    ev.push(win.dur);
    let gap = 0, gapAt = 0;
    for (let k = 1; k < ev.length; k++) if (ev[k] - ev[k - 1] > gap) { gap = ev[k] - ev[k - 1]; gapAt = ev[k - 1]; }
    const label = `shot ${i + 1} (${shot.template}, ${win.dur.toFixed(1)}s)`;
    if (!MOVING.has(shot.template) && !['card', 'chapter', 'title'].includes(shot.template) && gap > maxGap) warn.push(`${label}: nothing happens for ${gap.toFixed(1)}s from ${gapAt.toFixed(1)}s. Add a sticker/pose/stat on a word, or split the shot`);
    if (!MOVING.has(shot.template) && !['card', 'chapter'].includes(shot.template) && !shot.fill && win.dur > maxShot) warn.push(`${label}: longer than ${maxShot}s. Split it (wide -> close, or a second template)`);
    if (shot.template === 'title' && win.dur > 5) warn.push(shot.fill
      ? `${label}: a ${win.dur.toFixed(0)}s pause held on one title card. Use a montage (diagram:montage) or split the pause into an establishing shot + title`
      : `${label}: title cards should be short. Move most of this narration to the next shot`);
    if (MOVING.has(shot.template) && win.dur > maxBuild + 1) warn.push(`${label}: very long even for a built-up shot (max ~${maxBuild}s)`);
    if (shot.template === 'card' && win.dur > 4) warn.push(`${label}: black cards hold 0.5-2.5s after typing. Keep the narration on them short`);
  });
  // Repetition limits (the "templated" feel): a graphic that keeps coming back, and people who only stand and face us.
  const n = spec.shots.length;
  if (n >= 40) {
    const kinds = {};
    spec.shots.forEach((s, i) => { const k = s.template + (s.kind ? `:${s.kind}` : ''); (kinds[k] = kinds[k] || []).push(i + 1); });
    const cap = Math.max(5, Math.round(n * 0.02));
    Object.entries(kinds).forEach(([k, idx]) => {
      if (['talk', 'compose', 'card', 'chapter', 'map', 'document', 'title'].includes(k) || idx.length <= cap) return;
      warn.push(`${k} is used ${idx.length} times (limit ~${cap} for ${n} shots; shots ${idx.slice(cap).join(', ')} are over): show those beats a new way (stage people, a compose scene, a different kind)`);
    });
    const talks = spec.shots.map((s, i) => [s, i + 1]).filter(([s]) => s.template === 'talk');
    const flat = talks.filter(([s]) => (s.chars || []).length === 1 && s.frame !== 'ots'
      && !(s.chars[0].sit || s.chars[0].turn || s.chars[0].back || s.chars[0].walk || s.chars[0].holding || s.chars[0].carry));
    if (talks.length >= 10 && flat.length / talks.length > 0.35) {
      warn.push(`${Math.round((100 * flat.length) / talks.length)}% of people shots are one person facing the camera doing nothing (limit 35%; e.g. shots ${flat.slice(0, 8).map(([, i]) => i).join(', ')}): stage them (sit, turn toward someone, "f":"o" over the shoulder, hand something over, walk in, hold a prop)`);
    }
    const setCount = {};
    talks.forEach(([s]) => { setCount[s.set] = (setCount[s.set] || 0) + 1; });
    Object.entries(setCount).forEach(([k, c]) => { if (c > Math.max(8, n * 0.05)) warn.push(`set "${k}" is used ${c} times (limit ~${Math.round(Math.max(8, n * 0.05))}): move some beats to other places`); });
  }
  return warn;
}

// Density of a shot, for rhythm: references alternate busy, information-rich scenes with simple ones
// (a big number, one phrase, a clean close-up) that are easy to follow. Never empty, never all busy.
function density(s) {
  const nChars = (s.chars || []).length;
  const nSt = (s.stickers || []).length;
  const k = s.template + (s.kind ? `:${s.kind}` : '');
  if (['card', 'chapter', 'title', 'stat', 'data:countUp', 'data:tickerChip', 'data:calendarFlip', 'data:cheque', 'screen:phoneNotification'].includes(k)) return 'simple';
  if (s.template === 'talk' && (s.frame === 'close' || s.frame === 'reverse') && nChars <= 2 && nSt <= 1) return 'simple';
  if (['diagram:montage', 'map', 'fuse', 'diagram:orgTree', 'diagram:loop', 'diagram:split', 'diagram:portraits', 'data:rankingBoard'].includes(k)) return 'busy';
  if (s.template === 'talk' && (nChars >= 3 || nSt >= 3 || s.set === 'hall' || s.set === 'tradingFloor')) return 'busy';
  return 'medium';
}

// Episode-wide variety report (printed by --plan): what the whole video is made of.
function variety(spec, plan) {
  const n = spec.shots.length;
  const total = plan.total || 1;
  const kinds = {}, sets = {};
  let cards = 0, host = 0, run = 1, worstRun = 1, worstAt = 0;
  spec.shots.forEach((s, i) => {
    const key = s.template + (s.kind ? `:${s.kind}` : '');
    kinds[key] = (kinds[key] || 0) + 1;
    if (s.set) sets[s.set] = (sets[s.set] || 0) + 1;
    if (s.template === 'card') cards++;
    if ((s.chars || []).some((c) => c.who === 'host')) host++;
    const prev = spec.shots[i - 1];
    const same = prev && (prev.template + (prev.kind || '') + (prev.set || '')) === (s.template + (s.kind || '') + (s.set || ''));
    run = same ? run + 1 : 1;
    if (run > worstRun) { worstRun = run; worstAt = i + 2 - run; }
  });
  const dens = spec.shots.map(density);
  const dc = { simple: 0, medium: 0, busy: 0 };
  dens.forEach((d) => dc[d]++);
  let bRun = 0, bWorst = 0, bAt = 0;
  dens.forEach((d, i) => { bRun = d === 'busy' ? bRun + 1 : 0; if (bRun > bWorst) { bWorst = bRun; bAt = i + 2 - bRun; } });
  let sRun = 0, sWorst = 0, sAt = 0;
  dens.forEach((d, i) => { sRun = d === 'simple' ? sRun + 1 : 0; if (sRun > sWorst) { sWorst = sRun; sAt = i + 2 - sRun; } });
  const pct = (x) => `${Math.round((100 * x) / n)}%`;
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${pct(v)}`).join(', ');
  const notes = [];
  const talkShare = (kinds.talk || 0) / n;
  if (talkShare > 0.55) notes.push(`talk shots are ${pct(kinds.talk)}: mix in more data/diagram/screen/document beats`);
  const topSet = Object.entries(sets).sort((a, b) => b[1] - a[1])[0];
  if (topSet && topSet[1] / n > 0.25) notes.push(`set "${topSet[0]}" is ${pct(topSet[1])} of shots: vary locations`);
  if (worstRun >= 4) notes.push(`${worstRun} near-identical shots in a row from shot ${worstAt}`);
  if (n >= 12 && dc.simple / n < 0.18) notes.push(`only ${pct(dc.simple)} simple shots: give key numbers/phrases a simple shot (countUp, stat, card, clean close-up) so they land`);
  if (n >= 12 && dc.simple / n > 0.45) notes.push(`${pct(dc.simple)} simple shots: add richer scenes (talk with set, diagrams, maps, montage)`);
  if (bWorst >= 5) notes.push(`${bWorst} busy shots in a row from shot ${bAt}: put a simple beat in between`);
  const aim = (spec.style || 'war') === 'finance' ? 3.3 : 3.8; // measured reference averages (docs/*ANALYSIS.md), with slack
  if (n >= 12 && total / n > aim * 1.2) notes.push(`average shot is ${(total / n).toFixed(1)}s (aim ~${aim}s): cover fewer beats per shot (one beat per shot is the norm; ranges only for quick lists)`);
  if (sWorst >= 4) notes.push(`${sWorst} simple shots in a row from shot ${sAt}: the pace will sag, add a richer scene`);
  return [
    `shots ${n}, ${(total / 60).toFixed(1)} min, avg ${(total / n).toFixed(1)}s/shot`,
    `mix: ${top(kinds)}`,
    `sets: ${top(sets) || '-'}`,
    `black cards: ${cards} (1 per ${cards ? Math.round(n / cards) : '-'} shots), host shots: ${host}`,
    `rhythm: simple ${pct(dc.simple)}, medium ${pct(dc.medium)}, busy ${pct(dc.busy)} (aim ~25-35% simple, never 5+ busy in a row)`,
    ...notes.map((x) => `NOTE ${x}`),
  ];
}

module.exports = { loadEpisode, lint, variety, density };
