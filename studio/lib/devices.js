// Signature "devices": one recurring visual metaphor carries a whole episode
// (the references use a car passing exits, a balance scale, an evidence desk).
// Our money channel's house device is THE FUSE: a lit fuse burning along a timeline
// toward the disaster, with every stop a moment someone could have cut it.

const P = require('./palette');
const { n, text, W } = require('./svg');
const { rng, prog, ease, clamp, lerp } = require('./motion');

const fuseY = (x, base) => base + Math.sin(x / 70) * 12;

// stops: [{ x, year, title, lines }], end: { label, sub }.
// k = 0..1 burn progress (caller maps time -> k, usually with pauses at stops).
function fuse({ x0 = 110, x1 = 1060, base = 500, stops = [], end, k, t, cardAt = [] }) {
  const sparkX = lerp(x0, x1, clamp(k));
  // unburnt rope (tan, twisted) and burnt ash behind the spark
  const pts = (a, b) => {
    let d = '';
    for (let x = a; x <= b; x += 8) d += `${d ? 'L' : 'M'}${n(x)} ${n(fuseY(x, base))} `;
    return d;
  };
  const rope = sparkX < x1 ? `<path d="${pts(sparkX, x1)}" stroke="${P.ink}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="${pts(sparkX, x1)}" stroke="#c8a46a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="${pts(sparkX, x1)}" stroke="#8c6b3c" stroke-width="9" fill="none" stroke-dasharray="4 7"/>` : '';
  const ash = sparkX > x0 ? `<path d="${pts(x0, sparkX)}" stroke="#4a4a48" stroke-width="7" fill="none" stroke-dasharray="10 6" stroke-linecap="round" opacity=".8"/>` : '';

  const markers = stops.map((s, i) => {
    const passed = sparkX >= s.x;
    const y = fuseY(s.x, base);
    return `<g>
      <path d="M${s.x} ${y - 16} V${y - 70}" stroke="${passed ? P.red : P.paperDim}" stroke-width="3" stroke-dasharray="6 6"/>
      <circle cx="${s.x}" cy="${n(y)}" r="22" fill="none" stroke="${passed ? P.red : P.paperDim}" stroke-width="3" stroke-dasharray="7 5"/>
      ${text(s.year, s.x, n(y + 58), { size: 30, font: 'display', fill: passed ? P.paper : P.paperDim, anchor: 'middle' })}
    </g>`;
  }).join('');

  // spark: glow + flickering rays, deterministic per frame
  const r = rng(Math.floor(t * 24) + 11);
  const sy = fuseY(sparkX, base);
  const rays = Array.from({ length: 9 }, () => {
    const a = r() * Math.PI * 2, l = 14 + r() * 22;
    return `<path d="M${n(sparkX)} ${n(sy)} l${n(Math.cos(a) * l)} ${n(Math.sin(a) * l)}" stroke="${r() < 0.5 ? P.gold : '#fff6d0'}" stroke-width="${n(2 + r() * 2.5)}" stroke-linecap="round"/>`;
  }).join('');
  const spark = k < 1 ? `<circle cx="${n(sparkX)}" cy="${n(sy)}" r="40" fill="${P.gold}" opacity=".35" filter="url(#glow)"/>${rays}<circle cx="${n(sparkX)}" cy="${n(sy)}" r="8" fill="#fff6d0"/>` : '';

  const smoke = Array.from({ length: 6 }, (_, i) => {
    const age = ((t * 0.9 + i / 6) % 1);
    return `<circle cx="${n(sparkX - age * 30)}" cy="${n(sy - 20 - age * 90)}" r="${n(8 + age * 20)}" fill="#8a8a86" opacity="${n((1 - age) * 0.25)}"/>`;
  }).join('');

  const endBox = end ? (() => {
    const lit = k >= 1;
    return `<g transform="translate(${x1 + 20} ${n(fuseY(x1, base) - 70)})">
      ${lit ? `<circle cx="60" cy="70" r="90" fill="${P.red}" opacity=".35" filter="url(#glow)"/>` : ''}
      <circle cx="60" cy="70" r="62" fill="${P.ink}"/>
      <rect x="44" y="0" width="32" height="20" fill="${P.ink}"/>
      ${text(end.label, 60, 80, { size: 26, font: 'display', fill: lit ? P.red : P.paper, anchor: 'middle' })}
      ${end.sub ? text(end.sub, 60, 160, { size: 24, font: 'hand', fill: P.paperDim, anchor: 'middle' }) : ''}
    </g>`;
  })() : '';

  return `<g>${markers}${ash}${rope}${endBox}${smoke}${spark}</g>`;
}

// Map a time to fuse progress that pauses at each stop (so the card can land).
// stopsK = [0.2, 0.45, ...] fractions where it pauses; burn = seconds per segment; hold = pause length.
function fuseProgress(t, at, stopsK, { burn = 0.9, hold = 0.7 } = {}) {
  let tt = t - at;
  if (tt <= 0) return { k: 0, reached: -1 };
  const marks = [0, ...stopsK, 1];
  for (let i = 1; i < marks.length; i++) {
    const seg = burn * (marks[i] - marks[i - 1]) * (marks.length - 1); // burn = seconds for an average segment
    if (tt < seg) return { k: lerp(marks[i - 1], marks[i], ease.inOut(tt / seg)), reached: i - 2 };
    tt -= seg;
    if (i < marks.length - 1) {
      if (tt < hold) return { k: marks[i], reached: i - 1 };
      tt -= hold;
    }
  }
  return { k: 1, reached: stopsK.length };
}

// When the spark arrives at each stop and at the end (same maths as fuseProgress).
function fuseSchedule(at, stopsK, { burn = 0.9, hold = 0.7 } = {}) {
  const marks = [0, ...stopsK, 1];
  const arrive = [];
  let tt = at;
  for (let i = 1; i < marks.length; i++) {
    tt += burn * (marks[i] - marks[i - 1]) * (marks.length - 1);
    arrive.push(tt);
    if (i < marks.length - 1) tt += hold;
  }
  return { stops: arrive.slice(0, -1), end: arrive[arrive.length - 1] };
}

// Running tally like the references' "MISSED EXITS" scoreboard.
function tally(label, value, x, y, { w = 300 } = {}) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)">
    <rect width="${w}" height="74" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>
    <rect width="${w}" height="26" fill="${P.ink}"/>
    ${text(label, w / 2, 20, { size: 19, font: 'display', fill: P.paper, anchor: 'middle', spacing: 1 })}
    ${text(String(value), w / 2, 66, { size: 40, font: 'display', fill: P.red, anchor: 'middle' })}
  </g>`;
}

module.exports = { fuse, fuseProgress, fuseSchedule, tally, fuseY };
