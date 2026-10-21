// Timing helpers. Every function is pure: same t in, same frame out,
// so any frame can be rendered on its own (stills, contact sheets, re-renders).

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;

const ease = {
  linear: (k) => k,
  in: (k) => k * k * k,
  out: (k) => 1 - Math.pow(1 - k, 3),
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  sine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outBack: (k) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  },
};

// 0..1 progress of a window that starts at `at` and lasts `dur` seconds
const prog = (t, at, dur) => (dur <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / dur));

const tween = (t, at, dur, from, to, e = ease.inOut) => lerp(from, to, e(prog(t, at, dur)));

// Piecewise keyframes: keys = [[time, value], ...] sorted by time. Values may be numbers or arrays.
function keys(t, list, e = ease.inOut) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [t1, v1] = list[i];
    const [t0, v0] = list[i - 1];
    if (t <= t1) {
      const k = e(prog(t, t0, t1 - t0));
      return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k);
    }
  }
  return list[list.length - 1][1];
}

// Pop-in used by stickers, labels, cards: scale 0 -> overshoot -> 1, opacity 0 -> 1.
function pop(t, at, dur = 0.32) {
  if (t < at) return { s: 0, o: 0, on: false };
  const k = prog(t, at, dur);
  return { s: Math.max(0, ease.outBack(k)), o: clamp(k * 3), on: true };
}

// Number of characters revealed by a typewriter that starts at `at`.
const typed = (text, t, at, cps = 30) => text.slice(0, Math.max(0, Math.floor((t - at) * cps)));
const typeDuration = (text, cps = 30) => text.length / cps;

// Deterministic pseudo-random generator (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Eyes closed for ~0.11s roughly every 3-4.5s; `seed` desyncs characters.
function blinking(t, seed = 1) {
  const period = 3 + (seed % 7) * 0.22;
  const phase = (t + seed * 0.37) % period;
  return phase < 0.11;
}

// Mouth flaps while a line is being spoken/typed. Returns true when open.
function talking(t, from, to, rate = 8) {
  if (t < from || t > to) return false;
  return Math.sin((t - from) * Math.PI * 2 * rate * 0.5) > -0.2;
}

// Idle breathing multiplier for body scaleY (very subtle).
const breathe = (t, seed = 0) => 1 + 0.007 * Math.sin((t + seed) * (Math.PI * 2) / 3.4);

// Small decaying shake for impacts. Returns [dx, dy].
function shake(t, at, dur = 0.5, amp = 8) {
  if (t < at || t > at + dur) return [0, 0];
  const k = 1 - (t - at) / dur;
  return [Math.sin(t * 90) * amp * k, Math.cos(t * 77) * amp * k * 0.6];
}

module.exports = { clamp, lerp, ease, prog, tween, keys, pop, typed, typeDuration, rng, blinking, talking, breathe, shake };
