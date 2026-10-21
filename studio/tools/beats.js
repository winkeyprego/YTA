#!/usr/bin/env node
// Split a transcript (words.json from tools/transcribe.py) into numbered beats for storyboarding.
//
//   node tools/beats.js episodes/<ep>            -> episodes/<ep>/beats.json + beats.txt
//
// A beat is one shot's worth of narration: it ends at a sentence end, at a pause, or before it gets too long
// (finance ~3s / 8-11 words). beats.txt is what Claude reads to write the storyboard: one numbered line per beat
// with its start time, length and text. Numbers, years, money and capitalised names are marked so recipes are quick to pick.

const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const opts = { maxWords: Number(process.env.BEAT_MAX_WORDS || 13), minWords: 4, pause: 0.45, maxDur: 4.6 };
const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));

// Never end a beat on a word that needs what follows ("...match human intelligence by" / "2027.").
const FUNCTION = new Set(['a', 'an', 'the', 'by', 'of', 'to', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'from', 'into',
  'that', 'which', 'who', 'as', 'than', 'his', 'her', 'their', 'its', 'our', 'my', 'your', 'is', 'was', 'were', 'are', 'be', 'been',
  'has', 'have', 'had', 'will', 'would', 'could', 'should', 'can', 'not', 'no', 'so', 'if', 'when', 'while', 'about', 'over', 'after', 'before']);
const bare = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
// 1) sentences (or chunks between long silences)
const sentences = [];
let cur = [];
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  if (!next || /[.?!]["”']?$/.test(w.w) || next.s - w.e > 2.0) { sentences.push(cur); cur = []; }
});

// 2) split long sentences at the best break: comma/pause, near the middle, never after a function word
const fits = (b) => b.length <= opts.maxWords && b[b.length - 1].e - b[0].s <= opts.maxDur;
function split(b) {
  if (fits(b) || b.length < 6) return [b];
  let best = -1, bestScore = -1e9;
  for (let k = 3; k <= b.length - 3; k++) {
    const left = b[k - 1], right = b[k];
    if (FUNCTION.has(bare(left.w))) continue;
    const gap = right.s - left.e;
    const mid = 1 - Math.abs((left.e - b[0].s) / (b[b.length - 1].e - b[0].s) - 0.5) * 2; // 1 at the middle
    let score = mid * 2;
    if (/[,;:—–-]$/.test(left.w)) score += 3;
    if (gap > 0.25) score += 2 + gap;
    if (FUNCTION.has(bare(right.w))) score += 0.8; // starting a beat on "and", "but", "which" reads naturally
    if (score > bestScore) { bestScore = score; best = k; }
  }
  if (best < 0) return [b];
  return [...split(b.slice(0, best)), ...split(b.slice(best))];
}
const pieces = sentences.flatMap(split);

// 3) merge tiny pieces (< 3 words or < 1s) into a neighbour, as long as the result stays short
const merged = [];
let carry = null; // a tiny piece that opens a sentence waits to join the next piece
pieces.forEach((b) => {
  if (carry) { b = [...carry, ...b]; carry = null; }
  const tiny = b.length < 3 || b[b.length - 1].e - b[0].s < 1.0;
  const last = merged[merged.length - 1];
  const endsSentence = /[.?!]["”']?$/.test(b[b.length - 1].w);
  const lastEnded = last && /[.?!]["”']?$/.test(last[last.length - 1].w);
  if (tiny && lastEnded && !endsSentence) { carry = b; return; }
  if (tiny && last && b[0].s - last[last.length - 1].e < 1.0 && b[b.length - 1].e - last[0].s < 6) last.push(...b);
  else merged.push(b);
});
if (carry) merged.push(carry);

const mark = (txt) => {
  const tags = [];
  if (/\$|dollar|billion|million|thousand|percent|%/i.test(txt)) tags.push('MONEY/NUM');
  if (/\b(1[89]\d\d|20\d\d)\b/.test(txt)) tags.push('YEAR');
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(txt)) tags.push('DATE');
  if (/["“”]/.test(txt)) tags.push('QUOTE');
  if (/\?$/.test(txt.trim())) tags.push('QUESTION');
  return tags;
};

// Silences longer than 2s (music, title, breath between acts) become their own pause beats: give them a title,
// montage or establishing shot. A pause beat uses the existing silence (no extra time is added).
const out = [];
merged.forEach((b, i) => {
  const text = b.map((w) => w.w).join(' ');
  const prev = merged[i - 1];
  if (prev && b[0].s - prev[prev.length - 1].e > 2.0) {
    out.push({ n: out.length + 1, s: +prev[prev.length - 1].e.toFixed(2), e: +b[0].s.toFixed(2), text: '', pause: true, tags: ['PAUSE'] });
  }
  out.push({ n: out.length + 1, s: +b[0].s.toFixed(2), e: +b[b.length - 1].e.toFixed(2), text, tags: mark(text) });
});
fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(out));
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
fs.writeFileSync(path.join(dir, 'beats.txt'), out.map((b) =>
  `${b.n}\t${fmt(b.s)}\t${(b.e - b.s).toFixed(1)}s\t${b.pause ? '(PAUSE: no narration; use a title, montage or establishing shot)' : b.text}${b.tags.length && !b.pause ? `\t[${b.tags.join(' ')}]` : ''}`).join('\n') + '\n');
const durs = out.map((b) => b.e - b.s).sort((a, b) => a - b);
console.log(`${out.length} beats, median ${durs[Math.floor(durs.length / 2)].toFixed(1)}s, total ${fmt(out[out.length - 1].e)} -> ${path.join(dir, 'beats.txt')}`);
