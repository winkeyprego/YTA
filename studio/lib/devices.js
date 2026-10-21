// Signature "devices": one recurring visual metaphor carries a whole episode
// (the references use a car passing exits, a balance scale, an evidence desk).
// Our money channel's house device is THE FUSE: a lit fuse burning along a timeline
// toward the disaster, with every stop a moment someone could have cut it.
//
//   fuse({ stops, end, k, t, endStyle: 'bomb' | 'card' | 'flag', rope: 'fuse' | 'thread' })
//   caseBoard({ heading, sub, cards: [{ title, lines, verdict, verdictColor, verdictAt, at }], k, t })
//       the calm investigation device (cork board, pinned cards, red thread, verdict stamps); caseSchedule() fills times.
//   For real tragedies and claims, prefer rope: 'thread' + endStyle: 'card', or the case board (no fire, no bomb).

const P = require('./palette');
const { n, text, textWidth, esc, W, H } = require('./svg');
const { rng, prog, ease, clamp, lerp, pop } = require('./motion');

// Device-only colours (candidates for palette.js): cork board and the red investigation thread.
const C = {
  cork: '#b08a5e',
  corkDark: '#9a7650',
  corkFleck: '#8a6744',
  thread: '#a8342b',
};

const fuseY = (x, base) => base + Math.sin(x / 70) * 12;

// stops: [{ x, year, title, lines }], end: { label, sub, at?, color? }.
// k = 0..1 burn progress (caller maps time -> k, usually with pauses at stops).
// endStyle: 'bomb' (default) | 'card' (a verdict card; end.label stamps on when the spark arrives, at end.at if given)
//           | 'flag' (a finish flag). Neither 'card' nor 'flag' has any fire.
// rope: 'fuse' (default, burning rope + spark + smoke) | 'thread' (a red thread pinned stop to stop; the moving
//       marker is a pin; no flame, no smoke). Use 'thread' + 'card' for investigations and sensitive topics.
function fuse({ x0 = 110, x1 = 1060, base = 500, stops = [], end, k, t, cardAt = [], endStyle = 'bomb', rope: ropeStyle = 'fuse' }) {
  const sparkX = lerp(x0, x1, clamp(k));
  const thread = ropeStyle === 'thread';
  // unburnt rope (tan, twisted) and burnt ash behind the spark
  const pts = (a, b) => {
    let d = '';
    for (let x = a; x <= b; x += 8) d += `${d ? 'L' : 'M'}${n(x)} ${n(fuseY(x, base))} `;
    return d;
  };
  const markers = stops.map((s, i) => {
    const passed = sparkX >= s.x;
    const y = fuseY(s.x, base);
    const on = passed ? (thread ? P.paper : P.red) : P.paperDim;
    return `<g>
      <path d="M${s.x} ${y - 16} V${y - 70}" stroke="${on}" stroke-width="3" stroke-dasharray="6 6"/>
      <circle cx="${s.x}" cy="${n(y)}" r="22" fill="none" stroke="${on}" stroke-width="3" stroke-dasharray="7 5"/>
      ${text(s.year, s.x, n(y + 58), { size: 30, font: 'display', fill: passed ? P.paper : P.paperDim, anchor: 'middle' })}
    </g>`;
  }).join('');
  const sy = fuseY(sparkX, base);

  let rope = '', ash = '', spark = '', smoke = '';
  if (thread) {
    // taut thread pin to pin (through the stop points), drawn up to the marker; a faint guide ahead
    const knots = [[x0, fuseY(x0, base)], ...stops.map((s) => [s.x, fuseY(s.x, base)]), [x1, fuseY(x1, base)]];
    const yOn = (x) => {
      for (let i = 1; i < knots.length; i++) if (x <= knots[i][0]) return lerp(knots[i - 1][1], knots[i][1], (x - knots[i - 1][0]) / Math.max(1, knots[i][0] - knots[i - 1][0]));
      return knots[knots.length - 1][1];
    };
    const my = yOn(sparkX);
    const done = knots.filter(([x]) => x < sparkX);
    const dd = [...done, [sparkX, my]].map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
    const guide = knots.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
    rope = `<path d="${guide}" stroke="${P.paperDim}" stroke-width="2.5" fill="none" stroke-dasharray="3 9" opacity=".35"/>`
      + `<path d="${dd}" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linejoin="round" opacity=".5"/>`
      + `<path d="${dd}" stroke="${C.thread}" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
    const pin = (x, y, head = P.red, r = 9) => `<circle cx="${n(x + 2)}" cy="${n(y + 3)}" r="${r}" fill="#000" opacity=".25"/><circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${head}" stroke="${P.ink}" stroke-width="2.5"/><circle cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.3)}" r="${n(r * 0.3)}" fill="${P.paper}" opacity=".7"/>`;
    ash = pin(x0, knots[0][1]) + knots.slice(1, -1).filter(([x]) => x <= sparkX + 0.5).map(([x, y]) => pin(x, y)).join('');
    // the moving marker: a gold pin with a soft ring (no flame)
    spark = k < 1 ? `<circle cx="${n(sparkX)}" cy="${n(my)}" r="20" fill="none" stroke="${P.gold}" stroke-width="3" opacity=".6"/>${pin(sparkX, my, P.gold, 11)}` : pin(x1, knots[knots.length - 1][1]);
  } else {
    rope = sparkX < x1 ? `<path d="${pts(sparkX, x1)}" stroke="${P.ink}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="${pts(sparkX, x1)}" stroke="#c8a46a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="${pts(sparkX, x1)}" stroke="#8c6b3c" stroke-width="9" fill="none" stroke-dasharray="4 7"/>` : '';
    ash = sparkX > x0 ? `<path d="${pts(x0, sparkX)}" stroke="#4a4a48" stroke-width="7" fill="none" stroke-dasharray="10 6" stroke-linecap="round" opacity=".8"/>` : '';
    // spark: glow + flickering rays, deterministic per frame
    const r = rng(Math.floor(t * 24) + 11);
    const rays = Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2, l = 14 + r() * 22;
      return `<path d="M${n(sparkX)} ${n(sy)} l${n(Math.cos(a) * l)} ${n(Math.sin(a) * l)}" stroke="${r() < 0.5 ? P.gold : '#fff6d0'}" stroke-width="${n(2 + r() * 2.5)}" stroke-linecap="round"/>`;
    }).join('');
    spark = k < 1 ? `<circle cx="${n(sparkX)}" cy="${n(sy)}" r="40" fill="${P.gold}" opacity=".35" filter="url(#glow)"/>${rays}<circle cx="${n(sparkX)}" cy="${n(sy)}" r="8" fill="#fff6d0"/>` : '';
    smoke = Array.from({ length: 6 }, (_, i) => {
      const age = ((t * 0.9 + i / 6) % 1);
      return `<circle cx="${n(sparkX - age * 30)}" cy="${n(sy - 20 - age * 90)}" r="${n(8 + age * 20)}" fill="#8a8a86" opacity="${n((1 - age) * 0.25)}"/>`;
    }).join('');
  }

  const endBox = end ? fuseEnd(endStyle, end, x1, fuseY(x1, base), k, t) : '';
  return `<g>${markers}${ash}${rope}${endBox}${smoke}${spark}</g>`;
}

// The end of the fuse. (ex, ey) = where the rope meets it.
function fuseEnd(style, end, ex, ey, k, t) {
  const lit = k >= 1;
  if (style === 'card') {
    // verdict card: an index card that the end label stamps onto when the marker arrives
    const x = ex + 18, y = ey - 92, w = 168, h = 150;
    const color = (end.color && P[end.color]) || end.color || P.red;
    const stampAt = end.at != null ? end.at : lit ? -1 : Infinity;
    const label = String(end.label || '');
    const size = Math.min(30, (w - 44) / Math.max(1, textWidth(label, 1, 'display')));
    return `<g filter="url(#shadow)" transform="rotate(2 ${x + w / 2} ${y + h / 2})">
      <rect x="${x}" y="${n(y)}" width="${w}" height="${h}" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>
      <rect x="${x}" y="${n(y)}" width="${w}" height="30" fill="${P.ink}"/>
      ${text(end.title || 'VERDICT', x + w / 2, y + 22, { size: 19, font: 'display', fill: P.paper, anchor: 'middle', spacing: 1 })}
      ${[1, 2, 3].map((i) => `<path d="M${x + 14} ${n(y + 40 + i * 26)} H${x + w - 14}" stroke="${P.paperShade}" stroke-width="1.5"/>`).join('')}
    </g>
    ${t >= stampAt ? stampMark(label, x + w / 2, y + h / 2 + 14, t, stampAt, { size, color, rot: -9 }) : ''}
    ${end.sub ? text(end.sub, x + w / 2, y + h + 40, { size: 24, font: 'hand', fill: P.paperDim, anchor: 'middle' }) : ''}`;
  }
  if (style === 'flag') {
    // finish flag on a pole, waving gently (pure in t); a gold ring when the marker arrives
    const px = ex + 40, top = ey - 150;
    const wave = (u) => Math.sin(t * 3 + u * 4) * 6 * u;
    const cells = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      if ((r + c) % 2) continue;
      const u0 = c / 6, u1 = (c + 1) / 6;
      const X = (u) => px + 4 + u * 108, Y = (u, v) => top + v * 18 + wave(u);
      cells.push(`M${n(X(u0))} ${n(Y(u0, r))} L${n(X(u1))} ${n(Y(u1, r))} L${n(X(u1))} ${n(Y(u1, r + 1))} L${n(X(u0))} ${n(Y(u0, r + 1))} Z`);
    }
    const outline = `M${px + 4} ${n(top + wave(0))} ${Array.from({ length: 7 }, (_, i) => `L${n(px + 4 + (i / 6) * 108)} ${n(top + wave(i / 6))}`).join(' ')} L${px + 112} ${n(top + 72 + wave(1))} ${Array.from({ length: 7 }, (_, i) => `L${n(px + 112 - (i / 6) * 108)} ${n(top + 72 + wave(1 - i / 6))}`).join(' ')} Z`;
    return `<g>
      ${lit ? `<circle cx="${px}" cy="${n(ey)}" r="34" fill="none" stroke="${P.gold}" stroke-width="4" opacity=".7"/>` : ''}
      <path d="${outline}" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${cells.join(' ')}" fill="${P.ink}"/>
      <path d="M${px} ${top - 10} V${n(ey + 14)}" stroke="${P.ink}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${px}" cy="${top - 12}" r="7" fill="${P.gold}" stroke="${P.ink}" stroke-width="2.5"/>
      ${text(end.label || '', px + 58, n(ey + 54), { size: 26, font: 'display', fill: lit ? P.gold : P.paper, anchor: 'middle' })}
      ${end.sub ? text(end.sub, px + 58, n(ey + 84), { size: 24, font: 'hand', fill: P.paperDim, anchor: 'middle' }) : ''}
    </g>`;
  }
  return `<g transform="translate(${ex + 20} ${n(ey - 70)})">
      ${lit ? `<circle cx="60" cy="70" r="90" fill="${P.red}" opacity=".35" filter="url(#glow)"/>` : ''}
      <circle cx="60" cy="70" r="62" fill="${P.ink}"/>
      <rect x="44" y="0" width="32" height="20" fill="${P.ink}"/>
      ${text(end.label, 60, 80, { size: 26, font: 'display', fill: lit ? P.red : P.paper, anchor: 'middle' })}
      ${end.sub ? text(end.sub, 60, 160, { size: 24, font: 'hand', fill: P.paperDim, anchor: 'middle' }) : ''}
    </g>`;
}

// Rubber stamp that slams on (same motion as ui.stamp: 1.8x -> 1x in 0.18s).
function stampMark(label, x, y, t, at, { rot = -8, size = 34, color = P.red } = {}) {
  if (t < at) return '';
  const k = prog(t, at, 0.18);
  const s = 1.8 - 0.8 * ease.out(k);
  const o = clamp(k * 2) * 0.92;
  const w = textWidth(label, size, 'display') + 36;
  const h = size + 24;
  return `<g opacity="${n(o)}" transform="translate(${n(x)} ${n(y)}) rotate(${rot}) scale(${n(s)})">
    <rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="6" fill="${P.paper}" fill-opacity=".55" stroke="${color}" stroke-width="5"/>
    <rect x="${n(-w / 2 + 6)}" y="${n(-h / 2 + 6)}" width="${n(w - 12)}" height="${n(h - 12)}" rx="3" fill="none" stroke="${color}" stroke-width="2"/>
    ${text(label, 0, size * 0.36, { size: n(size), font: 'display', fill: color, anchor: 'middle' })}
  </g>`;
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


// ---------- caseBoard: the calm investigation device ----------
// A cork board with index cards pinned in a row (<= 4) or a grid (5-6), joined in order by a red thread that
// draws on as each card lands, and an optional verdict stamp per card. No fire, no countdown: use it for claims,
// theories and open questions (see RECIPES "Sensitive topics").
//   caseBoard({ heading, sub, cards: [{ title, lines, verdict, verdictColor, verdictAt, at }], k, t })
//   k (optional, 0..1): thread progress along the whole chain; by default the thread reaches each card at its `at`.
//   verdictColor: a palette name or hex; by default FALSE/DEBUNKED = red, UNPROVEN = gold, OPEN = blue, TRUE = green.
const VERDICT_COLORS = [[/FALSE|DEBUNK|MYTH|NO EVIDENCE/, P.red], [/UNPROVEN|UNCLEAR|DISPUTED|PARTLY/, P.goldDark], [/OPEN|UNKNOWN|PENDING/, P.blue], [/TRUE|CONFIRMED|PROVEN/, P.greenDark]];
const verdictColor = (v, c) => (c && (P[c] || c)) || (VERDICT_COLORS.find(([re]) => re.test(String(v).toUpperCase())) || [0, P.red])[1];

function caseLayout(cards) {
  const list = cards.slice(0, 6);
  const grid = list.length > 4;
  const cols = grid ? Math.ceil(list.length / 2) : list.length || 1;
  const slot = 1120 / cols;
  const w = Math.min(grid ? 300 : 262, slot - 34), h = grid ? 180 : 214;
  const pos = list.map((_, i) => {
    const row = grid ? Math.floor(i / cols) : 0, col = grid ? i % cols : i;
    // grid rows snake (left to right, then right to left) so the thread never crosses the board
    const c = grid && row === 1 ? cols - 1 - col : col;
    const x = 80 + slot * (c + 0.5);
    const y = grid ? 300 + row * 240 : 392 + (i % 2 ? 18 : -18);
    return [x, y];
  });
  return { list, pos, w, h, grid };
}
// Fill in default times: cards every `every` seconds from `start`, each verdict `verdictDelay` after its card.
function caseSchedule(cards, { start = 0.5, every = 1.8, verdictDelay = 0.9 } = {}) {
  return cards.map((c, i) => {
    const at = c.at ?? start + i * every;
    return { ...c, at, verdictAt: c.verdict ? c.verdictAt ?? at + verdictDelay : undefined };
  });
}
function wrapText(str, max) {
  const out = [];
  let cur = '';
  String(str || '').split(/\s+/).forEach((w) => {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  });
  if (cur) out.push(cur);
  return out;
}
function caseBoard({ heading, sub, cards = [], k, t = 0 }) {
  const sched = caseSchedule(cards);
  const L = caseLayout(sched);
  const fr = rng(7);
  const flecks = Array.from({ length: 260 }, () => `<circle cx="${n(fr() * 1240 + 20)}" cy="${n(fr() * 680 + 20)}" r="${n(1 + fr() * 2.2)}" fill="${fr() < 0.5 ? C.corkFleck : C.corkDark}" opacity="${n(0.35 + fr() * 0.4)}"/>`).join('');
  let out = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${P.woodDark}"/>
    <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${C.cork}" stroke="${P.ink}" stroke-width="5"/>${flecks}
    <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${P.woodMid}" stroke-width="10" opacity=".6"/>`;
  // heading on a pinned paper strip
  if (heading) {
    const hw = Math.max(textWidth(heading, 44, 'display'), sub ? textWidth(sub, 26, 'hand') : 0) + 70;
    out += `<g filter="url(#shadow)" transform="rotate(-1 640 100)"><rect x="${n(640 - hw / 2)}" y="${sub ? 52 : 62}" width="${n(hw)}" height="${sub ? 104 : 76}" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/></g>
      ${text(heading, 640, sub ? 104 : 114, { size: 44, font: 'display', anchor: 'middle' })}
      ${sub ? text(sub, 640, 140, { size: 26, font: 'hand', anchor: 'middle', fill: P.inkSoft }) : ''}
      ${pinSvg(640 - hw / 2 + 22, sub ? 70 : 80, P.blue)}${pinSvg(640 + hw / 2 - 22, sub ? 70 : 80, P.blue)}`;
  }
  const pinXY = L.pos.map(([x, y]) => [x, y - L.h / 2 + 13]);
  // red thread: segment i -> i+1 draws during the 0.55s before card i+1 lands (or along k)
  let thread = '';
  for (let i = 1; i < L.list.length; i++) {
    const [ax, ay] = pinXY[i - 1], [bx, by] = pinXY[i];
    const seg = k != null ? clamp(k * (L.list.length - 1) - (i - 1)) : ease.inOut(prog(t, L.list[i].at - 0.55, 0.55));
    if (seg <= 0) continue;
    // nearly taut between neighbours; a link straight down (grid) loops round the card's right edge instead of crossing it
    const down = Math.abs(bx - ax) < 20;
    const c1 = down ? [ax + L.w * 0.95, ay + 10] : [lerp(ax, bx, 0.33), lerp(ay, by, 0.33) + 14];
    const c2 = down ? [bx + L.w * 0.95, by - 40] : [lerp(ax, bx, 0.67), lerp(ay, by, 0.67) + 14];
    const pt = (s) => [0, 1].map((j) => (1 - s) ** 3 * [ax, ay][j] + 3 * (1 - s) ** 2 * s * c1[j] + 3 * (1 - s) * s * s * c2[j] + s ** 3 * [bx, by][j]);
    const N = 24, m = Math.max(1, Math.round(N * seg));
    const d = Array.from({ length: m + 1 }, (_, j) => pt((j / m) * seg)).map(([x, y], j) => `${j ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
    thread += `<path d="${d}" stroke="#000" stroke-width="6" fill="none" opacity=".18" transform="translate(2 4)"/><path d="${d}" stroke="${C.thread}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  let cardsSvg = '', pins = '', stamps = '';
  L.list.forEach((c, i) => {
    const p = pop(t, c.at, 0.22);
    if (!p.on) return;
    const [x, y] = L.pos[i];
    const w = L.w, h = L.h, x0 = x - w / 2, y0 = y - h / 2;
    const rot = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9][i % 6];
    const title = String(c.title || '').toUpperCase();
    const tsize = Math.min(28, (w - 28) / Math.max(1, textWidth(title, 1, 'display')));
    const lines = (Array.isArray(c.lines) ? c.lines : c.lines ? [c.lines] : []).flatMap((l) => wrapText(l, Math.floor((w - 28) / 11.2))).slice(0, (L.grid ? 3 : 4) - (c.verdict ? 1 : 0));
    const inner = `<g filter="url(#shadow)"><rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${h}" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/></g>
      <path d="M${n(x0)} ${n(y0 + 66)} H${n(x0 + w)}" stroke="${P.red}" stroke-width="2"/>
      ${[1, 2, 3, 4].slice(0, L.grid ? 3 : 4).map((j) => `<path d="M${n(x0 + 12)} ${n(y0 + 66 + j * 30)} H${n(x0 + w - 12)}" stroke="${P.paperShade}" stroke-width="1.5"/>`).join('')}
      ${text(title, x0 + 14, y0 + 56, { size: n(tsize), font: 'display', fill: P.ink })}
      ${lines.map((ln, j) => text(ln, x0 + 14, y0 + 92 + j * 30, { size: 24, font: 'hand' })).join('')}`;
    cardsSvg += `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) rotate(${rot}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${inner}</g>`;
    pins += p.s > 0.9 ? pinSvg(pinXY[i][0], pinXY[i][1], P.red) : '';
    if (c.verdict && c.verdictAt != null) stamps += stampMark(String(c.verdict).toUpperCase(), x + w * 0.12, y + h / 2 - 8, t, c.verdictAt, { size: 30, rot: i % 2 ? 7 : -8, color: verdictColor(c.verdict, c.verdictColor) });
  });
  return out + cardsSvg + thread + pins + stamps;
}
const pinSvg = (x, y, head = P.red, r = 10) => `<circle cx="${n(x + 2)}" cy="${n(y + 4)}" r="${r}" fill="#000" opacity=".25"/><circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${head}" stroke="${P.ink}" stroke-width="2.5"/><circle cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.3)}" r="${n(r * 0.32)}" fill="${P.paper}" opacity=".7"/>`;

// Running tally like the references' "MISSED EXITS" scoreboard.
function tally(label, value, x, y, { w = 300 } = {}) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)">
    <rect width="${w}" height="74" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>
    <rect width="${w}" height="26" fill="${P.ink}"/>
    ${text(label, w / 2, 20, { size: 19, font: 'display', fill: P.paper, anchor: 'middle', spacing: 1 })}
    ${text(String(value), w / 2, 66, { size: 40, font: 'display', fill: P.red, anchor: 'middle' })}
  </g>`;
}

module.exports = { fuse, fuseProgress, fuseSchedule, tally, fuseY, caseBoard, caseSchedule, stampMark, verdictColor, DEVICE_COLORS: C };
