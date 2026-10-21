// Voiceover timing. Lines up each shot's narration ("vo") with the word timings from
// tools/transcribe.py, so shots last exactly as long as their line and graphics can pop on a word.
// Without a words.json, timing is estimated at the reference narration speed (165 wpm),
// which is good enough for previews before the voice exists.

const WPM = 165;

const norm = (w) => String(w).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9%$]+/g, '');
const tokens = (text) => String(text || '').split(/\s+/).map(norm).filter(Boolean);

// Spelled-out numbers in narration vs digits in transcripts: treat these as equal.
const ALIAS = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
const same = (a, b) => a === b || ALIAS[a] === b || ALIAS[b] === a || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));

// Greedy forward alignment of every shot's vo tokens against the transcript.
// Returns per shot: { start, end, words: [{ w, s, e }] } in absolute seconds.
function alignToWords(shots, words) {
  const W = words.map((x) => ({ ...x, n: norm(x.w) })).filter((x) => x.n);
  let p = 0;
  const out = shots.map((shot) => {
    const toks = tokens(shot.vo);
    const matched = [];
    for (const tk of toks) {
      let hit = -1;
      for (let j = p; j < Math.min(W.length, p + 12); j++) {
        if (same(W[j].n, tk)) { hit = j; break; }
      }
      if (hit >= 0) {
        matched.push({ w: tk, s: W[hit].s, e: W[hit].e });
        p = hit + 1;
      } else {
        matched.push({ w: tk, s: null, e: null }); // word not in transcript: interpolated below
      }
    }
    return { toks: matched, hasVo: toks.length > 0 };
  });
  // fill unmatched word times by interpolation between neighbours
  out.forEach((o) => {
    const k = o.toks;
    for (let i = 0; i < k.length; i++) {
      if (k[i].s != null) continue;
      const prev = k.slice(0, i).reverse().find((x) => x.s != null);
      const next = k.slice(i + 1).find((x) => x.s != null);
      const s = prev ? prev.e : next ? next.s : null;
      k[i].s = s; k[i].e = s;
    }
  });
  return out;
}

// Estimated word times (no voiceover yet).
function estimate(shots) {
  const wps = WPM / 60;
  let t = 0;
  return shots.map((shot) => {
    const toks = tokens(shot.vo);
    const k = toks.map((w, i) => ({ w, s: t + i / wps, e: t + (i + 1) / wps }));
    t += toks.length / wps;
    return { toks: k, hasVo: toks.length > 0, est: true };
  });
}

// Final shot windows.
// - A voiced shot starts where the previous one ended and runs until the next voiced shot's first
//   word, so cuts land on the start of each line (as in the references).
// - Shots without vo (title, chapter cards) last `dur` (default 2.0s). The narration pauses for
//   them: `gaps` lists where silence must be inserted into the audio ({ at: audioTime, dur }).
// Returns { shots: [{ start, dur, words }], gaps }.
function schedule(shots, words) {
  const al = words && words.length ? alignToWords(shots, words) : estimate(shots);
  const first = (i) => al[i].toks[0].s;
  const last = (i) => al[i].toks[al[i].toks.length - 1].e;
  const out = [];
  const gaps = [];
  let clock = 0; // timeline time
  let shift = 0; // total silence inserted so far (timeline = audio + shift)
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    if (!al[i].hasVo) {
      const dur = s.dur || 2.0;
      gaps.push({ at: clock - shift, dur });
      out.push({ start: clock, dur, words: [] });
      clock += dur;
      shift += dur;
      continue;
    }
    const start = clock;
    const nextVoiced = i + 1 < shots.length && al[i + 1].hasVo;
    const end = nextVoiced ? first(i + 1) + shift : last(i) + shift + (s.tail ?? (i === shots.length - 1 ? 0.8 : 0.4));
    const dur = Math.max(s.minDur || 1.2, s.dur || end - start);
    out.push({ start, dur, words: al[i].toks.map((w) => ({ w: w.w, s: w.s + shift - start, e: w.e + shift - start })), est: !!al[i].est });
    clock = start + dur;
  }
  return { shots: out, gaps, total: clock };
}

// Cue lookup inside one shot: a word (first match at or after an optional occurrence index),
// or a number (seconds). Returns local seconds, or `fallback`.
function cueFinder(words) {
  return (cue, fallback = 0) => {
    if (cue == null) return fallback;
    if (typeof cue === 'number') return cue;
    const [word, nth] = String(cue).split('#');
    const target = tokens(word);
    if (!target.length) return fallback;
    let count = 0;
    for (let i = 0; i < words.length; i++) {
      let ok = true;
      for (let k = 0; k < target.length; k++) if (!words[i + k] || !same(words[i + k].w, target[k])) { ok = false; break; }
      if (ok && count++ === Number(nth || 0)) return Math.max(0, words[i].s);
    }
    return fallback;
  };
}

module.exports = { schedule, cueFinder, tokens, norm, WPM };
