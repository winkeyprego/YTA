// Explainer diagrams for the FINANCE pack: builds where one element lands per narration beat,
// ending on a pull-back reveal. Every export is pure: (spec, t) -> full-frame world SVG (1280x720 design units).
// All times are NUMERIC seconds from the shot start (templates convert word cues to `at` before calling).
//
//   const D = require('./diagrams');
//   D.equation({ title, terms: [{ label, emblem | who | icon, at }], ops: ['+', '='], result: { label, value, at } }, t)
//       cards with + and = between them: CHEAP MONEY + HYPE = BUBBLE. emblem = 1-3 letters in a coloured disc
//       (we never draw real logos), who = a cast key or spec (circle portrait), icon = one of D.ICONS.
//   D.loop({ title, center, nodes: [{ label, who?, icon?, at }], arrowsAt }, t)
//       3-5 nodes on a circle; arrows draw on one by one at arrowsAt (default: after the last node), then keep flowing.
//   D.funnel({ title, stages: [{ label, value, prefix, suffix, at }] }, t)
//       stacked bands narrowing downward; numeric values count up.
//   D.orgTree({ title, root: { label, sub, who, at }, children: [{ label, sub, who, at, children: [...] }] }, t)
//       circle portraits joined by lines that draw on; up to 2 levels, up to 6 leaves.
//   D.portraits({ title, people: [{ who, label, sub, at }] }, t)
//       a row of 2-5 circle portraits with name cards ("FOUNDERS OF ..." / "former CEO").
//   D.steps({ title, steps: [{ label, at }], style: 'book' | 'notes' }, t)
//       an open notebook with "STEP 1: ..." handwritten page by page, or numbered sticky notes on a board.
//   D.split({ panels: [{ svg, label, bg, at }], dir: 'h' | 'v' }, t)
//       2-3 panels sliding in (0.35s) from the right (h) or bottom (v). `svg` is any full-frame world markup
//       (e.g. another diagram's output); it is scaled to cover its panel and clipped.
//   D.montage({ frames: [{ svg, at }], flash: 0.3 }, t)
//       flash montage: each frame shows from its `at` (default i * flash) with a quick white flash on the cut.
//
// Camera: each build export has a `.focus(spec)` giving the first element's centre. In the template:
//   const c = D.buildCamera(t, dur, D.equation.focus(spec));       // { zoom, fx, fy }
//   camera(D.equation(spec, t), c)
// It holds a gentle 1.14x on the first element, then eases back to 0.95x (centred) over the last 2.6s.
// Backgrounds are drawn oversized, so zooming out below 1 never shows an empty edge.

const P = require('./palette');
const { n, text, esc, W, H } = require('./svg');
const M = require('./motion');
const { character, CAST } = require('./characters');

// finance-pack board colours (light, muted)
const C = {
  board: '#e8e4d9',
  boardLine: '#dcd6c8',
  card: '#f7f4ec',
  teal: '#5d8a8a',
  tealLight: '#a9c4c2',
  slate: '#6b7a86',
};

// ---------- helpers ----------
const popIn = (cx, cy, t, at, inner, rot = 0) => {
  const p = M.pop(t, at);
  if (!p.on) return '';
  return `<g opacity="${n(p.o)}" transform="translate(${n(cx)} ${n(cy)}) rotate(${n(rot)}) scale(${n(p.s)}) translate(${n(-cx)} ${n(-cy)})">${inner}</g>`;
};

function background(title, t, { titleAt = 0 } = {}) {
  const grid = [];
  for (let x = -200; x <= W + 200; x += 40) grid.push(`M${x} -200 V${H + 200}`);
  for (let y = -200; y <= H + 200; y += 40) grid.push(`M-200 ${y} H${W + 200}`);
  return `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${C.board}"/>
    <path d="${grid.join(' ')}" stroke="${C.boardLine}" stroke-width="1.2" opacity=".7"/>
    ${title && t >= titleAt ? text(title, 640, 84, { size: 52, font: 'script', anchor: 'middle', opacity: M.clamp((t - titleAt) * 5) }) : ''}`;
}

const shadowCard = (x, y, w, h, { fill = C.card, stroke = P.ink, rx = 10, sw = 3 } = {}) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" filter="url(#shadow)"/>`;

// Circle portrait of a cast member: head and shoulders clipped into a disc.
let clipSeq = 0;
function portrait(who, cx, cy, r, { ring = P.ink, bg = C.tealLight, state = {} } = {}) {
  const spec = typeof who === 'string' ? CAST[who] || CAST.banker : who || CAST.banker;
  const id = `pc${(clipSeq = (clipSeq + 1) % 100000)}`;
  const s = r / 100;
  const body = character(spec, { eyes: 'dot', brows: 'flat', mouth: 'neutral', armL: [8, -4], armR: [8, -4], legs: false, ...state });
  return `<clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${bg}"/>
    <g clip-path="url(#${id})"><g transform="translate(${n(cx)} ${n(cy + 228 * s)}) scale(${n(s)})">${body}</g></g>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${ring}" stroke-width="${n(Math.max(3, r * 0.06))}"/>`;
}

// Lettered emblem: stands in for a company logo (never draw real logos).
function emblem(letters, cx, cy, r, color = C.teal) {
  const str = String(letters).slice(0, 3).toUpperCase();
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>
    ${text(str, cx, cy + r * (str.length > 2 ? 0.22 : 0.3), { size: n(r * (str.length > 2 ? 0.62 : 0.85)), font: 'display', anchor: 'middle', fill: P.paper })}`;
}

// Small icon set, drawn in ~90x90 around (cx, cy).
const ICONS = {
  cash: (cx, cy) => `<g transform="translate(${cx} ${cy})">${[16, 4, -8].map((d, i) => `<rect x="-44" y="${d - 14}" width="88" height="38" rx="4" fill="${i === 2 ? P.green : P.greenDark}" stroke="${P.ink}" stroke-width="3"/>`).join('')}<circle cx="0" cy="-3" r="10" fill="none" stroke="${P.paper}" stroke-width="3"/></g>`,
  chartUp: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-44" y="-38" width="88" height="76" rx="6" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/><path d="M-32 22 L-12 4 L4 12 L30 -22" stroke="${P.green}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 -24 L32 -24 L32 -10" stroke="${P.green}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`,
  chartDown: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-44" y="-38" width="88" height="76" rx="6" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/><path d="M-32 -22 L-12 -4 L4 -12 L30 22" stroke="${P.red}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 24 L32 24 L32 10" stroke="${P.red}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`,
  house: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M-40 -2 L0 -38 L40 -2" fill="${P.red}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/><rect x="-30" y="-6" width="60" height="44" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5"/><rect x="-9" y="12" width="18" height="26" fill="${P.wood}" stroke="${P.ink}" stroke-width="2.5"/></g>`,
  bank: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M-44 -14 L0 -40 L44 -14 Z" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/>${[-30, -10, 10, 30].map((x) => `<rect x="${x - 5}" y="-12" width="10" height="40" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>`).join('')}<rect x="-46" y="28" width="92" height="10" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3"/></g>`,
  chip: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-30" y="-30" width="60" height="60" rx="6" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="3.5"/><rect x="-16" y="-16" width="32" height="32" fill="${C.teal}"/>${[-18, -6, 6, 18].map((d) => `<path d="M${d} -30 V-42 M${d} 30 V42 M-30 ${d} H-42 M30 ${d} H42" stroke="${P.ink}" stroke-width="4"/>`).join('')}</g>`,
  fire: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M0 40 Q-36 36 -30 4 Q-26 -14 -10 -28 Q-12 -8 0 -6 Q-2 -26 14 -42 Q16 -18 30 -2 Q38 34 0 40 Z" fill="${P.red}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 34 Q-14 30 -10 14 Q-6 4 2 -4 Q6 10 14 16 Q16 32 0 34 Z" fill="${P.gold}"/></g>`,
  rocket: (cx, cy) => `<g transform="translate(${cx} ${cy}) rotate(35)"><path d="M0 -44 Q18 -24 16 16 L-16 16 Q-18 -24 0 -44 Z" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5"/><circle cx="0" cy="-12" r="7" fill="${C.teal}" stroke="${P.ink}" stroke-width="2.5"/><path d="M-16 4 L-28 24 L-14 18 M16 4 L28 24 L14 18" fill="${P.red}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M-9 18 Q0 46 9 18 Z" fill="${P.gold}" stroke="${P.ink}" stroke-width="2.5"/></g>`,
  people: (cx, cy) => `<g transform="translate(${cx} ${cy})">${[-24, 24, 0].map((x, i) => `<circle cx="${x}" cy="${i === 2 ? -10 : -4}" r="16" fill="${P.skin}" stroke="${P.ink}" stroke-width="3"/><path d="M${x - 22} ${i === 2 ? 36 : 40} Q${x} ${i === 2 ? 4 : 10} ${x + 22} ${i === 2 ? 36 : 40} Z" fill="${i === 2 ? C.teal : P.slate || C.slate}" stroke="${P.ink}" stroke-width="3"/>`).join('')}</g>`,
  bubble: (cx, cy) => `<g transform="translate(${cx} ${cy})"><circle r="40" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5"/><path d="M-22 -18 Q-30 -38 -10 -36" stroke="${P.ink}" stroke-width="2.5" fill="none" opacity=".4"/><circle cx="20" cy="40" r="5" fill="${P.ink}"/></g>`,
  question: (cx, cy) => `<g transform="translate(${cx} ${cy})"><circle r="40" fill="${P.gold}" stroke="${P.ink}" stroke-width="3.5"/>${text('?', 0, 22, { size: 60, font: 'display', anchor: 'middle', fill: P.ink })}</g>`,
};

function badge(item, cx, cy, r) {
  if (item.who) return portrait(item.who, cx, cy, r, { state: item.state || {} });
  if (item.emblem) return emblem(item.emblem, cx, cy, r, item.color);
  if (item.icon && ICONS[item.icon]) return `<g transform="translate(${cx} ${cy}) scale(${n(r / 46)}) translate(${-cx} ${-cy})">${ICONS[item.icon](cx, cy)}</g>`;
  return '';
}

// Count-up value text. value numeric -> rolls up over `dur` from `at`.
function countUp(value, t, at, { prefix = '', suffix = '', dur = 1.0 } = {}) {
  if (typeof value !== 'number') return String(value ?? '');
  const k = M.ease.out(M.prog(t, at, dur));
  const v = value * k;
  const str = Math.abs(value) >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(value % 1 ? 1 : 0);
  return prefix + str + suffix;
}

// Line that draws on from (x1,y1) to (x2,y2), optionally curved through (qx,qy), with an arrowhead.
function drawLine(x1, y1, x2, y2, t, at, { dur = 0.4, color = P.ink, width = 4, q, head = false, dash } = {}) {
  const k = M.ease.inOut(M.prog(t, at, dur));
  if (k <= 0) return '';
  const d = q ? `M${n(x1)} ${n(y1)} Q${n(q[0])} ${n(q[1])} ${n(x2)} ${n(y2)}` : `M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}`;
  const len = q ? Math.hypot(q[0] - x1, q[1] - y1) + Math.hypot(x2 - q[0], y2 - q[1]) : Math.hypot(x2 - x1, y2 - y1);
  let hd = '';
  if (head && k >= 1) {
    const [ax, ay] = q || [x1, y1];
    const ang = (Math.atan2(y2 - ay, x2 - ax) * 180) / Math.PI;
    hd = `<path d="M0 0 L-16 -10 L-16 10 Z" fill="${color}" transform="translate(${n(x2)} ${n(y2)}) rotate(${n(ang)})"/>`;
  }
  const dashAttr = dash && k >= 1 ? `stroke-dasharray="${dash[0]} ${dash[1]}" stroke-dashoffset="${n(dash[2] || 0)}"` : `stroke-dasharray="${n(len)}" stroke-dashoffset="${n(len * (1 - k))}"`;
  return `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" ${dashAttr}/>${hd}`;
}

// ---------- camera helper ----------
// `focus` may carry a third element: the tight zoom for that diagram (from fitFocus), so a wide build
// (5 portraits, 8 notes) is never cropped while it lands.
function buildCamera(t, dur, focus = [640, 360], { tight = 1.14, end = 0.95, back = 2.6 } = {}) {
  if (focus[2] != null) tight = focus[2];
  const startBack = Math.max(0.4, dur - back);
  const k = M.ease.inOut(M.prog(t, startBack, Math.max(0.5, dur - startBack - 0.15)));
  return { zoom: M.lerp(tight, end, k), fx: M.lerp(focus[0], 640, k), fy: M.lerp(focus[1], 380, k) };
}

// Focus for a build whose elements span the box [x0..x1, y0..y1]: centre of the box plus the tightest zoom
// (<= max) that still shows the whole box with `pad` to spare. Returns [fx, fy, zoom] for buildCamera.
function fitFocus(x0, x1, y0, y1, { max = 1.14, pad = 26 } = {}) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const z = Math.min(max, cx / Math.max(1, cx - x0 + pad), (W - cx) / Math.max(1, x1 + pad - cx),
    cy / Math.max(1, cy - y0 + pad), (H - cy) / Math.max(1, y1 + pad - cy));
  return [cx, cy, Math.max(1, z)];
}

// ---------- equation ----------
function eqLayout(spec) {
  const terms = spec.terms || [];
  const count = terms.length + (spec.result ? 1 : 0);
  const cw = count > 3 ? 220 : 270, ch = count > 3 ? 250 : 290, gap = count > 3 ? 74 : 90;
  const total = count * cw + (count - 1) * gap;
  const x0 = 640 - total / 2;
  return { cw, ch, gap, x0, y: count > 3 ? 250 : 220, count };
}
function equation(spec, t) {
  const L = eqLayout(spec);
  const terms = spec.terms || [];
  const ops = spec.ops || [...terms.slice(1).map(() => '+'), '='];
  let out = background(spec.title, t);
  const items = [...terms, ...(spec.result ? [{ ...spec.result, result: true }] : [])];
  items.forEach((it, i) => {
    const x = L.x0 + i * (L.cw + L.gap);
    const cx = x + L.cw / 2;
    const at = it.at ?? 0.4 + i * 1.8;
    const res = it.result;
    const card = shadowCard(x, L.y, L.cw, L.ch, { fill: res ? '#fbf3d9' : C.card, stroke: res ? P.goldDark : P.ink, sw: res ? 5 : 3 })
      + (res && it.value != null
        ? text(countUp(it.value, t, at + 0.15, it), cx, L.y + L.ch / 2 + (String(it.value).toUpperCase() === String(it.label || '').toUpperCase() ? 22 : 0), { size: String(it.value).length > 6 ? 50 : 64, font: 'display', anchor: 'middle', fill: it.color || P.ink })
        : badge(it, cx, L.y + L.ch * 0.4, 66))
      + (res && String(it.value ?? '').toUpperCase() === String(it.label || '').toUpperCase() ? ''
        : text(String(it.label || '').toUpperCase(), cx, L.y + L.ch - 34, { size: 30, font: 'hand', anchor: 'middle' }));
    out += popIn(cx, L.y + L.ch / 2, t, at, card, i % 2 ? 1.5 : -1.5);
    if (i > 0) {
      const op = ops[i - 1] || '+';
      const ox = x - L.gap / 2;
      out += popIn(ox, L.y + L.ch / 2, t, Math.max(0, at - 0.25), `<circle cx="${n(ox)}" cy="${n(L.y + L.ch / 2)}" r="30" fill="${op === '=' ? P.gold : P.paper}" stroke="${P.ink}" stroke-width="3.5"/>${text(op, ox, L.y + L.ch / 2 + 17, { size: 50, font: 'display', anchor: 'middle' })}`);
    }
  });
  return out;
}
equation.focus = (spec) => { const L = eqLayout(spec); return [L.x0 + L.cw / 2 + (L.cw + L.gap) * 0.5, L.y + L.ch / 2]; };

// ---------- loop ----------
function loopLayout(spec) {
  const nodes = spec.nodes || [];
  const R = nodes.length > 4 ? 225 : 205;
  const cx = 640, cy = 400;
  const pos = nodes.map((_, i) => {
    const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2;
    return [cx + Math.cos(a) * R * 1.25, cy + Math.sin(a) * R];
  });
  return { R, cx, cy, pos };
}
function loop(spec, t) {
  const L = loopLayout(spec);
  const nodes = spec.nodes || [];
  const ats = nodes.map((nd, i) => nd.at ?? 0.4 + i * 1.6);
  const arrowsAt = spec.arrowsAt ?? Math.max(...ats) + 0.6;
  let out = background(spec.title, t);
  const nr = 74;
  // arrows between consecutive nodes, bowed outward
  nodes.forEach((_, i) => {
    const [x1, y1] = L.pos[i], [x2, y2] = L.pos[(i + 1) % nodes.length];
    const ang1 = Math.atan2(y2 - y1, x2 - x1);
    const sx = x1 + Math.cos(ang1) * (nr + 10), sy = y1 + Math.sin(ang1) * (nr + 10);
    const ex = x2 - Math.cos(ang1) * (nr + 16), ey = y2 - Math.sin(ang1) * (nr + 16);
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const ox = mx - L.cx, oy = my - L.cy, ol = Math.hypot(ox, oy) || 1;
    const q = [mx + (ox / ol) * 50, my + (oy / ol) * 50];
    const flowing = t > arrowsAt + nodes.length * 0.4 + 0.4;
    out += drawLine(sx, sy, ex, ey, t, arrowsAt + i * 0.4, { dur: 0.4, color: P.red, width: 6, q, head: true, dash: flowing ? [18, 12, -((t * 50) % 30)] : null });
  });
  if (spec.center) {
    out += popIn(L.cx, L.cy, t, ats[0] + 0.2, `<circle cx="${L.cx}" cy="${L.cy}" r="78" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" stroke-dasharray="8 7"/>${text(spec.center, L.cx, L.cy + 14, { size: 40, font: 'script', anchor: 'middle' })}`);
  }
  nodes.forEach((nd, i) => {
    const [x, y] = L.pos[i];
    const inner = (nd.who || nd.emblem || nd.icon ? badge(nd, x, y, nr) : `<circle cx="${n(x)}" cy="${n(y)}" r="${nr}" fill="${C.card}" stroke="${P.ink}" stroke-width="3.5" filter="url(#shadow)"/>`)
      + `<rect x="${n(x - 90)}" y="${n(y + nr - 14)}" width="180" height="44" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>`
      + text(String(nd.label).toUpperCase(), x, y + nr + 17, { size: 27, font: 'hand', anchor: 'middle' });
    out += popIn(x, y, t, ats[i], inner, i % 2 ? 2 : -2);
  });
  return out;
}
loop.focus = (spec) => loopLayout(spec).pos[0] || [640, 360];

// ---------- funnel ----------
function funnel(spec, t) {
  const stages = spec.stages || [];
  let out = background(spec.title, t);
  const top = 150, bandH = Math.min(110, 480 / Math.max(1, stages.length)), wTop = 900, wBot = 320;
  stages.forEach((st, i) => {
    const at = st.at ?? 0.4 + i * 1.7;
    const k0 = i / stages.length, k1 = (i + 1) / stages.length;
    const w0 = M.lerp(wTop, wBot, k0), w1 = M.lerp(wTop, wBot, k1);
    const y0 = top + i * (bandH + 8), y1 = y0 + bandH;
    const shade = [C.tealLight, C.teal, P.blue, P.navy, P.charcoal][i % 5];
    const band = `<path d="M${n(640 - w0 / 2)} ${n(y0)} H${n(640 + w0 / 2)} L${n(640 + w1 / 2)} ${n(y1)} H${n(640 - w1 / 2)} Z" fill="${shade}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round" filter="url(#shadow)"/>`
      + text(String(st.label).toUpperCase(), 640, y0 + bandH / 2 + (st.value != null ? -4 : 10), { size: 28, font: 'hand', anchor: 'middle', fill: i < 1 ? P.ink : P.paper })
      + (st.value != null ? text(countUp(st.value, t, at + 0.1, st), 640, y0 + bandH / 2 + 32, { size: 30, font: 'display', anchor: 'middle', fill: i < 1 ? P.ink : P.gold }) : '');
    const k = M.ease.out(M.prog(t, at, 0.3));
    if (k > 0) out += `<g opacity="${n(Math.min(1, k * 2))}" transform="translate(0 ${n((1 - k) * -30)})">${band}</g>`;
  });
  return out;
}
funnel.focus = () => [640, 210];

// ---------- org tree ----------
function treeLayout(spec) {
  const kids = (spec.children || []).slice(0, 6);
  const leaves = kids.reduce((s, c) => s + Math.max(1, (c.children || []).length), 0) || 1;
  const twoLevel = kids.some((c) => (c.children || []).length);
  const root = [640, twoLevel ? 175 : 200];
  const yKid = twoLevel ? 380 : 470, yLeaf = 590;
  const slot = 1100 / leaves;
  let cursor = 90;
  const nodes = kids.map((c) => {
    const span = Math.max(1, (c.children || []).length);
    const x = cursor + (span * slot) / 2;
    const grand = (c.children || []).slice(0, 6).map((g, j) => [cursor + slot * (j + 0.5), yLeaf]);
    cursor += span * slot;
    return { pos: [x, yKid], grand };
  });
  return { root, nodes, twoLevel, rr: twoLevel ? 66 : 78, kr: twoLevel ? 58 : 70, gr: 44 };
}
function treeNode(item, x, y, r, t, at, rot) {
  const plate = `<rect x="${n(x - 100)}" y="${n(y + r - 6)}" width="200" height="${item.sub ? 62 : 40}" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>`
    + text(String(item.label || '').toUpperCase(), x, y + r + 24, { size: 24, font: 'hand', anchor: 'middle' })
    + (item.sub ? text(item.sub, x, y + r + 48, { size: 24, font: 'script', anchor: 'middle', fill: P.inkSoft }) : '');
  return popIn(x, y, t, at, (item.who || item.emblem || item.icon ? badge(item, x, y, r) : `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${C.card}" stroke="${P.ink}" stroke-width="3.5"/>`) + plate, rot);
}
function orgTree(spec, t) {
  const L = treeLayout(spec);
  const root = spec.root || {};
  const rootAt = root.at ?? 0.4;
  let lines = '', nodes = '';
  (spec.children || []).slice(0, 6).forEach((c, i) => {
    const at = c.at ?? rootAt + 1.6 * (i + 1);
    const [x, y] = L.nodes[i].pos;
    lines += drawLine(L.root[0], L.root[1] + L.rr, x, y - L.kr, t, at - 0.35, { dur: 0.35, width: 4 });
    nodes += treeNode(c, x, y, L.kr, t, at, i % 2 ? 2 : -2);
    (c.children || []).slice(0, 6).forEach((g, j) => {
      const gat = g.at ?? at + 0.8 * (j + 1);
      const [gx, gy] = L.nodes[i].grand[j];
      lines += drawLine(x, y + L.kr + (c.sub ? 58 : 36), gx, gy - L.gr, t, gat - 0.35, { dur: 0.35, width: 3.5 });
      nodes += treeNode(g, gx, gy, L.gr, t, gat, j % 2 ? -2 : 2);
    });
  });
  return background(spec.title, t) + lines + treeNode(root, L.root[0], L.root[1], L.rr, t, rootAt, 0) + nodes;
}
orgTree.focus = (spec) => treeLayout(spec).root;

// ---------- portraits ----------
function portraits(spec, t) {
  const people = (spec.people || []).slice(0, 5);
  const r = people.length > 4 ? 88 : people.length > 3 ? 96 : 108;
  const gap = 1180 / people.length;
  let out = background(spec.title, t);
  people.forEach((p, i) => {
    const x = 50 + gap * (i + 0.5), y = 330;
    const at = p.at ?? 0.4 + i * 1.5;
    const w = Math.min(gap - 20, 250);
    const inner = portrait(p.who || 'banker', x, y, r, { state: p.state || {} })
      + `<rect x="${n(x - w / 2)}" y="${n(y + r + 22)}" width="${n(w)}" height="${p.sub ? 86 : 50}" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" filter="url(#shadow)"/>`
      + text(String(p.label || '').toUpperCase(), x, y + r + 56, { size: 27, font: 'hand', anchor: 'middle' })
      + (p.sub ? text(p.sub, x, y + r + 92, { size: 28, font: 'script', anchor: 'middle', fill: C.teal }) : '');
    out += popIn(x, y + 40, t, at, inner, i % 2 ? 1.5 : -1.5);
  });
  return out;
}
portraits.focus = (spec) => { const k = (spec.people || []).length || 1; return [50 + (1180 / k) * 0.5, 380]; };

// ---------- steps ----------
function steps(spec, t) {
  const list = (spec.steps || []).slice(0, spec.style === 'notes' ? 5 : 4);
  if (spec.style === 'notes') {
    let out = background(spec.title, t);
    const colors = ['#f2dc8a', '#bcd9c9', '#f0b9a8', '#c7d3e6', '#f2dc8a'];
    const gap = 1160 / list.length;
    list.forEach((s, i) => {
      const at = s.at ?? 0.4 + i * 1.7;
      const x = 60 + gap * (i + 0.5), y = 380, w = Math.min(230, gap - 24);
      const lines = wrapWords(s.label, 14);
      const inner = `<g transform="rotate(${i % 2 ? 2.5 : -2.5} ${x} ${y})"><rect x="${n(x - w / 2)}" y="${y - 130}" width="${n(w)}" height="260" fill="${colors[i]}" stroke="${P.ink}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="${n(x - 34)}" y="${y - 144}" width="68" height="26" fill="${P.tape}" opacity=".85"/>
        ${text(`STEP ${i + 1}`, x, y - 70, { size: 34, font: 'display', anchor: 'middle', fill: P.red })}
        ${lines.map((ln, k) => text(ln, x, y - 18 + k * 40, { size: 38, font: 'script', anchor: 'middle' })).join('')}</g>`;
      out += popIn(x, y, t, at, inner);
    });
    return out;
  }
  // open notebook on a desk: two steps per page
  const wood = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="#8a6044"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M-200 ${i * 110 - 60} Q640 ${i * 110 - 40} ${W + 200} ${i * 110 - 70}" stroke="#7a5238" stroke-width="3" fill="none" opacity=".6"/>`).join('')}`;
  const book = `<g filter="url(#softShadow)"><path d="M120 120 Q380 96 640 132 Q900 96 1160 120 L1160 660 Q900 640 640 672 Q380 640 120 660 Z" fill="${P.paper}" stroke="${P.ink}" stroke-width="4"/></g>
    <path d="M640 132 V672" stroke="${P.paperShade}" stroke-width="6"/><path d="M640 132 V672" stroke="${P.ink}" stroke-width="2"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M160 ${200 + i * 50} H600 M680 ${200 + i * 50} H1120" stroke="#cfd8dc" stroke-width="2"/>`).join('')}
    <path d="M656 132 V700 L668 690 L680 700 V132" fill="${P.red}" stroke="${P.ink}" stroke-width="2"/>`;
  let words = '';
  list.forEach((s, i) => {
    const at = s.at ?? 0.4 + i * 1.8;
    if (t < at) return;
    const page = i % 2 ? 1 : 0;
    const slot = Math.floor(i / 2);
    const x = page ? 700 : 170, y = 240 + slot * 210;
    const head = `STEP ${i + 1}:`;
    const full = `${head} ${s.label}`;
    const shown = M.typed(full, t, at, 30);
    const lines = wrapWords(shown, 22);
    words += lines.map((ln, k) => text(ln, x, y + k * 50, { size: 46, font: 'script', fill: k === 0 && ln.startsWith('STEP') ? P.red : P.ink })).join('');
  });
  return wood + book + (spec.title ? text(spec.title, 380, 182, { size: 40, font: 'script', anchor: 'middle', fill: C.teal }) : '') + words;
}
steps.focus = () => [380, 300];

function wrapWords(str, max) {
  const out = [];
  let cur = '';
  String(str).split(/\s+/).forEach((w) => {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  });
  if (cur) out.push(cur);
  return out;
}

// ---------- split ----------
function split(spec, t) {
  const panels = (spec.panels || []).slice(0, 3);
  const k = panels.length || 1;
  const vertical = spec.dir === 'v';
  let out = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${P.ink}"/>`;
  panels.forEach((p, i) => {
    const at = p.at ?? i * 1.2;
    if (t < at) return;
    const e = M.ease.out(M.prog(t, at, 0.35));
    const pw = vertical ? W : W / k, ph = vertical ? H / k : H;
    const fx = vertical ? 0 : i * pw, fy = vertical ? i * ph : 0;
    const x = vertical ? fx : M.lerp(W, fx, i === 0 && at <= 0 ? 1 : e);
    const y = vertical ? M.lerp(H, fy, i === 0 && at <= 0 ? 1 : e) : fy;
    const content = p.svg || `<rect width="${W}" height="${H}" fill="${p.bg || C.tealLight}"/>`;
    // cover-fit the full-frame content into the panel, centred, clipped (explicit maths; nested <svg> slicing
    // is not reliable in Chromium screenshots)
    const sc = Math.max(pw / W, ph / H);
    const tx = x + (pw - W * sc) / 2, ty = y + (ph - H * sc) / 2;
    out += `<defs><clipPath id="splitClip${i}"><rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${n(ph)}"/></clipPath></defs>
      <g clip-path="url(#splitClip${i})"><g transform="translate(${n(tx)} ${n(ty)}) scale(${n(sc)})">
        <rect width="${W}" height="${H}" fill="${p.bg || C.board}"/>${content}</g></g>
      <rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${n(ph)}" fill="none" stroke="${P.ink}" stroke-width="8"/>`;
    if (p.label) {
      const lx = x + pw / 2, ly = y + ph - 52;
      const lw = Math.max(160, String(p.label).length * 16 + 40);
      out += popIn(lx, ly, t, at + 0.3, `<rect x="${n(lx - lw / 2)}" y="${n(ly - 26)}" width="${n(lw)}" height="52" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" filter="url(#shadow)"/>${text(String(p.label).toUpperCase(), lx, ly + 11, { size: 30, font: 'hand', anchor: 'middle' })}`, i % 2 ? 2 : -2);
    }
  });
  return out;
}

// ---------- montage ----------
function montage(spec, t) {
  const frames = spec.frames || [];
  const flash = spec.flash || 0.3;
  const ats = frames.map((f, i) => f.at ?? i * flash);
  let idx = -1;
  ats.forEach((a, i) => { if (t >= a) idx = i; });
  if (idx < 0) return `<rect width="${W}" height="${H}" fill="${P.ink}"/>`;
  const since = t - ats[idx];
  const white = since < 0.08 ? 0.7 * (1 - since / 0.08) : 0;
  return `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${C.board}"/>${frames[idx].svg || ''}`
    + (white > 0 ? `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="#fff" opacity="${n(white)}"/>` : '');
}

module.exports = { equation, loop, funnel, orgTree, portraits, steps, split, montage, buildCamera, portrait, emblem, ICONS, countUp, C: C };
