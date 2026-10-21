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
//   D.portraits({ title, people: [{ who | emblem: 'SC' | silhouette: true, color, label, sub, at }] }, t)
//       a row of 1-5 circle portraits with name cards ("FOUNDERS OF ..." / "former CEO"). People we don't draw get
//       an initials disc (emblem, or the label's initials when there's no who) or a faceless silhouette.
//   D.steps({ title, steps: [{ label, at }], style: 'book' | 'notes', prefix: 'STEP' | 'THEORY' | '', numbered }, t)
//       an open notebook with "STEP 1: ..." handwritten page by page (up to 4), or sticky notes on a board
//       (up to 8; two rows when more than 4).
//   D.section({ title, columns, floors, highlight: [col], labels: ['TEXT' | { text, col | floor, at }], sagAt, sag, at }, t)
//       an ABSTRACT structural cross-section schematic: columns and floor lines draw on, highlighted columns turn red,
//       floor lines bow downward around them after sagAt. A diagram of load, never a picture of a real building.
//   D.split({ panels: [{ svg, label, bg, at }], dir: 'h' | 'v' }, t)
//       2-3 panels sliding in (0.35s) from the right (h) or bottom (v). `svg` is any full-frame world markup
//       (e.g. another diagram's output); it is scaled to cover its panel and clipped.
//   D.montage({ frames: [{ svg, at }], flash: 0.3 }, t)
//       flash montage: each frame shows from its `at` (default i * flash) with a quick white flash on the cut.
//
// Icons (D.ICONS): cash chartUp chartDown house bank chip fire rocket people bubble question server power pylon
//   building lock scales clock phone document plane radar shield eye.
//
// Camera: each build export has a `.focus(spec)` giving the first element's centre (or [x, y, zoom] for wide builds). In the template:
//   const c = D.buildCamera(t, dur, D.equation.focus(spec));       // { zoom, fx, fy }
//   camera(D.equation(spec, t), c)
// It holds a gentle 1.14x on the first element, then eases back to 0.95x (centred) over the last 2.6s.
// Backgrounds are drawn oversized, so zooming out below 1 never shows an empty edge.

const P = require('./palette');
const { n, text, esc, textWidth, W, H } = require('./svg');
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
  server: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-32" y="-44" width="64" height="88" rx="5" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="3.5"/>${[-30, -6, 18].map((y) => `<rect x="-24" y="${y}" width="48" height="18" rx="2" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="2.5"/><circle cx="-14" cy="${y + 9}" r="3.5" fill="${P.green}"/><circle cx="-4" cy="${y + 9}" r="3.5" fill="${P.gold}"/><path d="M6 ${y + 9} H18" stroke="${P.ink}" stroke-width="2.5" stroke-linecap="round"/>`).join('')}</g>`,
  power: (cx, cy) => `<g transform="translate(${cx} ${cy})"><circle r="42" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5"/><path d="M6 -34 L-20 6 L-2 6 L-8 34 L20 -8 L2 -8 Z" fill="${P.gold}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/></g>`,
  pylon: (cx, cy) => `<g transform="translate(${cx} ${cy})" fill="none" stroke="${P.ink}" stroke-linejoin="round" stroke-linecap="round"><path d="M-26 42 L-6 -40 L6 -40 L26 42" stroke-width="4"/><path d="M-20 18 L16 0 M20 18 L-16 0 M-14 -4 L10 -22 M14 -4 L-10 -22 M-22 26 H22 M-15 -4 H15" stroke-width="2.5"/><path d="M-40 -26 H40 M-30 -10 H30" stroke-width="4"/><path d="M-40 -26 V-18 M40 -26 V-18 M-30 -10 V-3 M30 -10 V-3" stroke="${P.greyDark}" stroke-width="3"/></g>`,
  building: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-34" y="-44" width="40" height="86" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3.5"/><rect x="6" y="-12" width="30" height="54" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="3.5"/>${[-34, -20, -6, 8, 22].map((y) => `<rect x="-27" y="${y}" width="9" height="8" fill="${C.slate}"/><rect x="-11" y="${y}" width="9" height="8" fill="${C.slate}"/>`).join('')}${[-2, 12, 26].map((y) => `<rect x="13" y="${y}" width="16" height="7" fill="${C.slate}"/>`).join('')}<path d="M-46 42 H46" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/></g>`,
  lock: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M-20 -6 V-20 Q-20 -42 0 -42 Q20 -42 20 -20 V-6" fill="none" stroke="${P.ink}" stroke-width="9" stroke-linecap="round"/><path d="M-20 -6 V-20 Q-20 -42 0 -42 Q20 -42 20 -20 V-6" fill="none" stroke="${P.greyLight}" stroke-width="3.5" stroke-linecap="round"/><rect x="-34" y="-8" width="68" height="52" rx="7" fill="${P.gold}" stroke="${P.ink}" stroke-width="3.5"/><circle cx="0" cy="12" r="7" fill="${P.ink}"/><path d="M0 14 V30" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/></g>`,
  scales: (cx, cy) => `<g transform="translate(${cx} ${cy})" stroke="${P.ink}" stroke-linejoin="round" stroke-linecap="round"><path d="M0 -36 V36 M-22 40 H22" stroke-width="5" fill="none"/><path d="M-40 -28 H40" stroke-width="5"/><circle cx="0" cy="-38" r="6" fill="${P.gold}" stroke-width="3"/><path d="M-40 -28 L-52 4 M-40 -28 L-28 4 M40 -28 L28 4 M40 -28 L52 4" stroke-width="2" fill="none"/><path d="M-56 4 H-24 Q-28 18 -40 18 Q-52 18 -56 4 Z M24 4 H56 Q52 18 40 18 Q28 18 24 4 Z" fill="${P.gold}" stroke-width="3"/></g>`,
  clock: (cx, cy) => `<g transform="translate(${cx} ${cy})"><circle r="42" fill="${P.paper}" stroke="${P.ink}" stroke-width="4"/>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; const r0 = i % 3 ? 33 : 29; return `<path d="M${n(Math.sin(a) * r0)} ${n(-Math.cos(a) * r0)} L${n(Math.sin(a) * 37)} ${n(-Math.cos(a) * 37)}" stroke="${P.ink}" stroke-width="${i % 3 ? 2 : 3.5}" stroke-linecap="round"/>`; }).join('')}<path d="M0 0 V-26 M0 0 L17 9" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/><circle r="4" fill="${P.red}"/></g>`,
  phone: (cx, cy) => `<g transform="translate(${cx} ${cy})"><rect x="-26" y="-44" width="52" height="88" rx="9" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="3.5"/><rect x="-20" y="-34" width="40" height="62" rx="3" fill="${C.tealLight}"/><path d="M-13 -22 H13 M-13 -12 H7 M-13 -2 H11" stroke="${P.paper}" stroke-width="3.5" stroke-linecap="round"/><circle cx="0" cy="36" r="3.5" fill="${P.greyLight}"/></g>`,
  document: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M-32 -44 H16 L34 -26 V44 H-32 Z" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 -44 V-26 H34" fill="${P.paperShade}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M-22 -24 H6 M-22 -10 H22 M-22 4 H22 M-22 18 H22 M-22 32 H8" stroke="${P.greyDark}" stroke-width="3.5" stroke-linecap="round"/></g>`,
  plane: (cx, cy) => `<g transform="translate(${cx} ${cy})" stroke="${P.ink}" stroke-linejoin="round"><path d="M-30 -4 L-40 -30 L-30 -30 L-14 -6 Z" fill="${P.greyLight}" stroke-width="3"/><path d="M-46 -6 Q-46 -12 -36 -12 L30 -12 Q48 -12 50 0 Q48 10 30 10 L-36 10 Q-46 10 -46 4 Z" fill="${P.paper}" stroke-width="3.5"/><path d="M-6 2 L-24 30 L-12 30 L16 2 Z" fill="${P.greyLight}" stroke-width="3"/>${[-26, -16, -6, 4, 14, 24].map((x) => `<circle cx="${x}" cy="-3" r="2.6" fill="${C.slate}" stroke="none"/>`).join('')}<path d="M36 -8 Q44 -8 46 -2 L36 -2 Z" fill="${C.slate}" stroke-width="2"/></g>`,
  radar: (cx, cy) => `<g transform="translate(${cx} ${cy})"><circle r="42" fill="${P.board}" stroke="${P.ink}" stroke-width="4"/><circle r="28" fill="none" stroke="${P.green}" stroke-width="2" opacity=".7"/><circle r="14" fill="none" stroke="${P.green}" stroke-width="2" opacity=".7"/><path d="M-38 0 H38 M0 -38 V38" stroke="${P.green}" stroke-width="1.5" opacity=".5"/><path d="M0 0 L0 -38 A38 38 0 0 1 33 -19 Z" fill="${P.green}" opacity=".55"/><path d="M0 0 L33 -19" stroke="${P.greyLight}" stroke-width="3" stroke-linecap="round"/><circle cx="14" cy="-24" r="4" fill="${P.gold}"/><circle cx="-18" cy="16" r="3.5" fill="${P.gold}" opacity=".7"/></g>`,
  shield: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M0 -44 L36 -30 Q38 14 0 44 Q-38 14 -36 -30 Z" fill="${P.blue}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 -32 L25 -22 Q26 8 0 31 Z" fill="${P.paper}" opacity=".25"/><path d="M-15 0 L-4 12 L17 -12" fill="none" stroke="${P.paper}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  eye: (cx, cy) => `<g transform="translate(${cx} ${cy})"><path d="M-46 0 Q0 -40 46 0 Q0 40 -46 0 Z" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/><circle r="17" fill="${C.teal}" stroke="${P.ink}" stroke-width="3"/><circle r="8" fill="${P.ink}"/><circle cx="-5" cy="-6" r="3.5" fill="${P.paper}"/></g>`,
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

// Follow camera for builds: elements(spec) gives each element's box and entrance time; the camera frames what is
// on screen so far (tight on the first element, so the cut lands on something big), widens as each new one lands,
// and pulls back to the whole diagram (and its title) over the last `back` seconds.
//   const c = D.followCamera(t, dur, D.loop.elements(spec));   // { zoom, fx, fy }
function followCamera(t, dur, els, opts = {}) {
  const { max = 1.6, pad = 40, move = 0.7, lead = 0.45, end = 0.97, back = 2.4 } = opts; // opts.title: keep the title in frame
  const list = (els || []).filter(Boolean).sort((a, b) => a.at - b.at);
  // the title joins the frame only when the first element sits under it; otherwise it waits for the pull-back
  if (opts.title && list.length && Math.abs((list[0].x0 + list[0].x1) / 2 - 640) < 250) list.unshift({ x0: 640 - textWidth(opts.title, 52, 'script') / 2, x1: 640 + textWidth(opts.title, 52, 'script') / 2, y0: 40, y1: 100, at: -1 });
  if (!list.length) return { zoom: 1, fx: 640, fy: 360 };
  const frameOf = (k) => {
    const seen = list.slice(0, k + 1);
    const x0 = Math.min(...seen.map((e) => e.x0)) - pad, x1 = Math.max(...seen.map((e) => e.x1)) + pad;
    const y0 = Math.min(...seen.map((e) => e.y0)) - pad, y1 = Math.max(...seen.map((e) => e.y1)) + pad;
    const zoom = Math.max(1, Math.min(max, W / (x1 - x0), H / (y1 - y0)));
    // keep the view on the background, which is drawn 200px oversized on every side
    const hw = W / zoom / 2, hh = H / zoom / 2;
    return { zoom, fx: M.clamp((x0 + x1) / 2, hw - 200, W - hw + 200), fy: M.clamp((y0 + y1) / 2, hh - 200, H - hh + 200) };
  };
  let cur = frameOf(0);
  for (let k = 1; k < list.length; k++) {
    const p = M.ease.inOut(M.prog(t, list[k].at - lead, move)); // starts moving before the element pops, so it pops in frame
    if (p <= 0) break;
    const next = frameOf(k);
    cur = { zoom: M.lerp(cur.zoom, next.zoom, p), fx: M.lerp(cur.fx, next.fx, p), fy: M.lerp(cur.fy, next.fy, p) };
  }
  const startBack = Math.max(list[list.length - 1].at - lead + move, dur - back);
  const k = M.ease.inOut(M.prog(t, startBack, Math.max(0.5, dur - startBack - 0.15)));
  const fx = M.lerp(cur.fx, 640, k), fy = M.lerp(cur.fy, 360, k);
  return { zoom: M.lerp(cur.zoom, end, k), fx, fy, x: 640 - fx, y: 360 - fy }; // x/y bring the framed point to the centre
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
equation.elements = (spec) => {
  const L = eqLayout(spec);
  const items = [...(spec.terms || []), ...(spec.result ? [spec.result] : [])];
  return items.map((it, i) => {
    const x = L.x0 + i * (L.cw + L.gap);
    return { x0: x - (i ? L.gap / 2 + 30 : 0), x1: x + L.cw, y0: L.y, y1: L.y + L.ch, at: it.at ?? 0.4 + i * 1.8 };
  });
};
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
    const lw = Math.max(180, textWidth(String(nd.label).toUpperCase(), 27) + 34); // the plate grows with its label
    const inner = (nd.who || nd.emblem || nd.icon ? badge(nd, x, y, nr) : `<circle cx="${n(x)}" cy="${n(y)}" r="${nr}" fill="${C.card}" stroke="${P.ink}" stroke-width="3.5" filter="url(#shadow)"/>`)
      + `<rect x="${n(x - lw / 2)}" y="${n(y + nr - 14)}" width="${n(lw)}" height="44" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>`
      + text(String(nd.label).toUpperCase(), x, y + nr + 17, { size: 27, font: 'hand', anchor: 'middle' });
    out += popIn(x, y, t, ats[i], inner, i % 2 ? 2 : -2);
  });
  return out;
}
loop.focus = (spec) => loopLayout(spec).pos[0] || [640, 360];
loop.elements = (spec) => {
  const L = loopLayout(spec);
  const els = (spec.nodes || []).map((nd, i) => {
    const [x, y] = L.pos[i];
    return { x0: x - 100, x1: x + 100, y0: y - 80, y1: y + 112, at: nd.at ?? 0.4 + i * 1.6 };
  });
  // the centre label pops right after the first node: frame both from the start
  if (spec.center && els.length) els.push({ x0: L.cx - 80, x1: L.cx + 80, y0: L.cy - 80, y1: L.cy + 80, at: els[0].at + 0.01 });
  return els;
};

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
  const pw = Math.max(200, textWidth(String(item.label || '').toUpperCase(), 24) + 30);
  const plate = `<rect x="${n(x - pw / 2)}" y="${n(y + r - 6)}" width="${n(pw)}" height="${item.sub ? 62 : 40}" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>`
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
orgTree.elements = (spec) => {
  const L = treeLayout(spec);
  const root = spec.root || {};
  const rootAt = root.at ?? 0.4;
  const box = (x, y, r, sub, at) => ({ x0: x - Math.max(r, 104), x1: x + Math.max(r, 104), y0: y - r, y1: y + r + (sub ? 60 : 38), at });
  const out = [box(L.root[0], L.root[1], L.rr, root.sub, rootAt)];
  (spec.children || []).slice(0, 6).forEach((c, i) => {
    const at = c.at ?? rootAt + 1.6 * (i + 1);
    out.push(box(L.nodes[i].pos[0], L.nodes[i].pos[1], L.kr, c.sub, at));
    (c.children || []).slice(0, 6).forEach((g, j) => out.push(box(L.nodes[i].grand[j][0], L.nodes[i].grand[j][1], L.gr, g.sub, g.at ?? at + 0.8 * (j + 1))));
  });
  return out;
};

// ---------- portraits ----------
// Initials from a label: "Sarah Connor" -> "SC", "The host" -> "TH", "FBI" -> "FBI".
function initials(label) {
  const words = String(label || '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, words[0].length <= 3 ? 3 : 2).toUpperCase();
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Faceless stand-in: a flat head-and-shoulders silhouette in a disc (for people we don't caricature).
function silhouette(cx, cy, r, { ring = P.ink, bg = C.tealLight, color = C.slate } = {}) {
  const id = `ps${(clipSeq = (clipSeq + 1) % 100000)}`;
  const s = r / 100;
  return `<clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${bg}"/>
    <g clip-path="url(#${id})"><g transform="translate(${n(cx)} ${n(cy)}) scale(${n(s)})">
      <path d="M-82 110 Q-80 34 -30 24 L30 24 Q80 34 82 110 Z" fill="${color}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M-16 24 V8 H16 V24" fill="${color}" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="0" cy="-22" r="38" fill="${color}" stroke="${P.ink}" stroke-width="5"/>
    </g></g>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${ring}" stroke-width="${n(Math.max(3, r * 0.06))}"/>`;
}

// One person's disc: who (cast face) | silhouette: true | emblem: 'SC' | nothing -> initials of the label.
function personDisc(p, x, y, r) {
  if (p.who) return portrait(p.who, x, y, r, { state: p.state || {} });
  if (p.silhouette) return silhouette(x, y, r, { color: p.color || C.slate });
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r + 8)}" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>`
    + emblem(p.emblem || initials(p.label), x, y, r, p.color || C.teal);
}

function portraitsLayout(spec) {
  const people = (spec.people || []).slice(0, 5);
  const k = people.length || 1;
  const r = k > 4 ? 88 : k > 3 ? 96 : 108;
  const gap = 1180 / k;
  const w = Math.min(gap - 20, 250);
  const hasSub = people.some((p) => p.sub);
  return { people, r, gap, w, y: 330, k, hasSub };
}
function portraits(spec, t) {
  const L = portraitsLayout(spec);
  let out = background(spec.title, t);
  L.people.forEach((p, i) => {
    const x = 50 + L.gap * (i + 0.5), y = L.y, r = L.r, w = L.w;
    const at = p.at ?? 0.4 + i * 1.5;
    const label = String(p.label || '').toUpperCase();
    const size = label.length * 27 * 0.47 > w - 16 ? Math.max(19, Math.floor((w - 16) / (label.length * 0.47))) : 27;
    const inner = personDisc(p, x, y, r)
      + `<rect x="${n(x - w / 2)}" y="${n(y + r + 22)}" width="${n(w)}" height="${p.sub ? 86 : 50}" rx="8" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" filter="url(#shadow)"/>`
      + text(label, x, y + r + 56, { size, font: 'hand', anchor: 'middle' })
      + (p.sub ? text(p.sub, x, y + r + 92, { size: 28, font: 'script', anchor: 'middle', fill: C.teal }) : '');
    out += popIn(x, y + 40, t, at, inner, i % 2 ? 1.5 : -1.5);
  });
  return out;
}
// Frames the whole row (centre + the tightest zoom that keeps every name card on screen).
portraits.focus = (spec) => {
  const L = portraitsLayout(spec);
  const x0 = 50 + L.gap * 0.5 - L.w / 2, x1 = 50 + L.gap * (L.k - 0.5) + L.w / 2;
  return fitFocus(x0, x1, L.y - L.r - 10, L.y + L.r + 22 + (L.hasSub ? 86 : 50) + 8);
};

// ---------- steps ----------
// Header for step i: prefix 'STEP' (default) | 'THEORY' | 'CLUE' | '' (none); numbered: false drops the number.
function stepHead(spec, i) {
  const prefix = spec.prefix == null ? 'STEP' : String(spec.prefix);
  const num = spec.numbered === false ? '' : String(i + 1);
  return [prefix, num].filter(Boolean).join(' ');
}
function notesLayout(spec) {
  const list = (spec.steps || []).slice(0, 8);
  const rows = list.length > 4 ? 2 : 1;
  const cols = Math.ceil(list.length / rows) || 1;
  const gap = 1160 / cols;
  const w = Math.min(230, gap - 24), h = rows > 1 ? 222 : 260;
  const pos = list.map((_, i) => {
    const row = rows > 1 ? Math.floor(i / cols) : 0, col = rows > 1 ? i % cols : i;
    // a short second row is centred under the first
    const inRow = rows > 1 && row === 1 ? list.length - cols : cols;
    const off = (cols - inRow) * gap / 2;
    return [60 + off + gap * (col + 0.5), rows > 1 ? 262 + row * 252 : 380];
  });
  return { list, rows, cols, gap, w, h, pos };
}
function steps(spec, t) {
  if (spec.style === 'notes') {
    const L = notesLayout(spec);
    let out = background(spec.title, t);
    const colors = ['#f2dc8a', '#bcd9c9', '#f0b9a8', '#c7d3e6'];
    L.list.forEach((s, i) => {
      const at = s.at ?? 0.4 + i * 1.7;
      const [x, y] = L.pos[i];
      const w = L.w, h = L.h;
      const head = stepHead(spec, i);
      const small = L.rows > 1;
      const lines = wrapWords(s.label, small ? 13 : 14).slice(0, head ? (small ? 3 : 4) : (small ? 4 : 5));
      const lh = small ? 34 : 40;
      const top = y - h / 2;
      const body0 = head ? top + (small ? 102 : 112) : y - ((lines.length - 1) * lh) / 2 + 10;
      const inner = `<g transform="rotate(${i % 2 ? 2.5 : -2.5} ${x} ${y})"><rect x="${n(x - w / 2)}" y="${n(top)}" width="${n(w)}" height="${h}" fill="${colors[i % 4]}" stroke="${P.ink}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="${n(x - 34)}" y="${n(top - 14)}" width="68" height="26" fill="${P.tape}" opacity=".85"/>
        ${head ? text(head, x, top + (small ? 52 : 60), { size: head.length > 8 ? 26 : small ? 30 : 34, font: 'display', anchor: 'middle', fill: P.red }) : ''}
        ${lines.map((ln, k) => text(ln, x, body0 + k * lh, { size: small ? 33 : 38, font: 'script', anchor: 'middle' })).join('')}</g>`;
      out += popIn(x, y, t, at, inner);
    });
    return out;
  }
  // open notebook on a desk: two steps per page
  const list = (spec.steps || []).slice(0, 4);
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
    const head = stepHead(spec, i);
    const full = head ? `${head}: ${s.label}` : String(s.label);
    const shown = M.typed(full, t, at, 30);
    const lines = wrapWords(shown, 22);
    // the header part of the first line is red, the rest ink
    words += lines.map((ln, k) => {
      const hl = k === 0 && head ? Math.min(ln.length, head.length + 1) : 0;
      if (!hl) return text(ln, x, y + k * 50, { size: 46, font: 'script' });
      return `<text x="${x}" y="${y + k * 50}" class="t-script" font-size="46" fill="${P.ink}"><tspan fill="${P.red}">${esc(ln.slice(0, hl))}</tspan>${esc(ln.slice(hl))}</text>`;
    }).join('');
  });
  return wood + book + (spec.title ? text(spec.title, 380, 182, { size: 40, font: 'script', anchor: 'middle', fill: C.teal }) : '') + words;
}
steps.focus = (spec) => {
  if (spec.style !== 'notes') return [380, 300];
  const L = notesLayout(spec);
  if (L.list.length <= 3) return [380, 300];
  const xs = L.pos.map((p) => p[0]), ys = L.pos.map((p) => p[1]);
  return fitFocus(Math.min(...xs) - L.w / 2 - 8, Math.max(...xs) + L.w / 2 + 8, Math.min(...ys) - L.h / 2 - 16, Math.max(...ys) + L.h / 2 + 8);
};

function wrapWords(str, max) {
  const out = [];
  let cur = '';
  String(str).split(/\s+/).forEach((w) => {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  });
  if (cur) out.push(cur);
  return out;
}

// ---------- section: abstract structural cross-section ----------
// A schematic (NOT a drawing of a real building): ground, a grid of columns and floor lines that draw on,
// highlighted columns in red, labels with leader lines, and (after sagAt) floor lines that bow downward
// around the highlighted columns as plain abstract lines.
//   labels: ['TEXT'] (attach to highlighted columns in order) | [{ text, col, floor, at, side: 'left'|'right' }]
function sectionLayout(spec) {
  const cols = Math.max(2, Math.min(12, spec.columns || 5));
  const floors = Math.max(1, Math.min(16, spec.floors || 6));
  const x0 = 290, x1 = 910, ground = 610, roof = 200;
  const xs = Array.from({ length: cols }, (_, i) => x0 + (i / (cols - 1)) * (x1 - x0));
  const ys = Array.from({ length: floors + 1 }, (_, i) => ground - (i / floors) * (ground - roof));
  return { cols, floors, x0, x1, ground, roof, xs, ys, spacing: (x1 - x0) / (cols - 1) };
}
function section(spec, t) {
  const L = sectionLayout(spec);
  const at = spec.at ?? 0.4;
  const hi = (spec.highlight || []).filter((i) => i >= 0 && i < L.cols);
  const hiAt = spec.highlightAt ?? at + 1.2 + L.floors * 0.12;
  const sagK = spec.sagAt == null ? 0 : M.ease.inOut(M.prog(t, spec.sagAt, spec.sagDur ?? 1.6));
  const sagAmp = (spec.sag ?? 46) * sagK;
  // sag profile: 0 at the ground, deepest at the roof, centred on the highlighted columns
  const bump = (x) => hi.reduce((m, c) => { const u = Math.abs(x - L.xs[c]) / (L.spacing * 1.7); return Math.max(m, u < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * u) : 0); }, 0);
  const yAt = (x, f) => L.ys[f] + (f > 0 ? sagAmp * bump(x) * (0.55 + 0.45 * (f / L.floors)) : 0);
  let out = background(spec.title, t);
  // drafting sheet
  out += popIn(640, 400, t, Math.max(0, at - 0.3), `<rect x="170" y="130" width="940" height="540" rx="6" fill="${P.paper}" stroke="${P.ink}" stroke-width="3" filter="url(#shadow)"/>
    <rect x="182" y="142" width="916" height="516" fill="none" stroke="${P.paperShade}" stroke-width="2"/>`);
  if (t < at) return out;
  // ground strip with hatching
  const gk = M.ease.out(M.prog(t, at, 0.4));
  const gx0 = L.x0 - 80, gx1 = L.x0 - 80 + (L.x1 - L.x0 + 160) * gk;
  out += `<rect x="${n(gx0)}" y="${L.ground}" width="${n(gx1 - gx0)}" height="30" fill="${P.paperShade}"/>`
    + `<path d="${Array.from({ length: 34 }, (_, i) => gx0 + i * 24).filter((x) => x < gx1 - 10).map((x) => `M${n(x)} ${L.ground + 30} L${n(x + 16)} ${L.ground}`).join(' ')}" stroke="${P.greyDark}" stroke-width="2"/>`
    + `<path d="M${n(gx0)} ${L.ground} H${n(gx1)}" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`;
  // columns grow up storey by storey; each segment follows the (sagging) floors at its x
  let cols = '';
  L.xs.forEach((x, c) => {
    const ck = M.ease.out(M.prog(t, at + 0.3 + c * 0.06, 0.7));
    if (ck <= 0) return;
    const isHi = hi.includes(c) && t >= hiAt;
    const top = ck * L.floors;
    let d = '';
    for (let f = 0; f < Math.ceil(top); f++) {
      const ya = yAt(x, f), yb = yAt(x, f + 1);
      const part = Math.min(1, top - f);
      d += `M${n(x)} ${n(ya)} L${n(x)} ${n(ya + (yb - ya) * part)} `;
    }
    cols += `<path d="${d}" stroke="${P.ink}" stroke-width="${isHi ? 16 : 12}" stroke-linecap="butt"/>`
      + `<path d="${d}" stroke="${isHi ? P.red : P.greyLight}" stroke-width="${isHi ? 9 : 6}" stroke-linecap="butt"/>`;
  });
  // floor lines draw left to right, bottom to top
  let floors = '';
  for (let f = 1; f <= L.floors; f++) {
    const fk = M.ease.inOut(M.prog(t, at + 0.6 + (f - 1) * 0.12, 0.5));
    if (fk <= 0) continue;
    const xa = L.x0 - 22, xb = xa + (L.x1 - L.x0 + 44) * fk;
    let d = '';
    for (let x = xa; x <= xb + 0.01; x += 8) d += `${d ? 'L' : 'M'}${n(Math.min(x, xb))} ${n(yAt(Math.min(x, xb), f))} `;
    floors += `<path d="${d}" stroke="${P.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  out += cols + floors;
  // highlight ring pulse on the highlighted columns
  hi.forEach((c) => {
    const pk = M.prog(t, hiAt, 0.6);
    if (pk > 0 && pk < 1) out += `<rect x="${n(L.xs[c] - 24)}" y="${n(L.roof - 14)}" width="48" height="${n(L.ground - L.roof + 28)}" rx="24" fill="none" stroke="${P.red}" stroke-width="4" opacity="${n(1 - pk)}"/>`;
  });
  // labels with leader lines
  const labels = (spec.labels || []).map((l, i) => (typeof l === 'string' ? { text: l, col: hi[i] ?? hi[0] } : l));
  labels.forEach((l, i) => {
    const lat = l.at ?? hiAt + 0.4 + i * 0.6;
    const k = M.ease.out(M.prog(t, lat, 0.3));
    if (k <= 0) return;
    const str = String(l.text || '').toUpperCase();
    const w = Math.max(120, str.length * 24 * 0.47 + 28);
    let ax, ay, lx, ly;
    if (l.floor != null) {
      const f = Math.max(0, Math.min(L.floors, l.floor));
      ax = L.x1 + 22; ay = yAt(L.x1 + 22, f); lx = Math.min(1094 - w / 2, ax + 26 + w / 2); ly = ay;
      if (l.side === 'left') { ax = L.x0 - 22; ay = yAt(ax, f); lx = Math.max(186 + w / 2, ax - 26 - w / 2); ly = ay; }
    } else {
      const c = l.col ?? hi[0] ?? 0;
      const f = Math.max(1, Math.min(L.floors, l.atFloor ?? Math.ceil(L.floors * 0.66)));
      ax = L.xs[c]; ay = (yAt(ax, f) + yAt(ax, f - 1)) / 2;
      const right = l.side ? l.side === 'right' : ax < 640;
      lx = right ? Math.min(1094 - w / 2, ax + 110 + w / 2) : Math.max(186 + w / 2, ax - 110 - w / 2);
      ly = L.roof - 38;
    }
    out += `<g opacity="${n(k)}"><path d="M${n(ax)} ${n(ay)} L${n(lx)} ${n(ly)}" stroke="${P.ink}" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="${n(ax)}" cy="${n(ay)}" r="5" fill="${P.ink}"/>
      <rect x="${n(lx - w / 2)}" y="${n(ly - 20)}" width="${n(w)}" height="40" rx="6" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>
      ${text(str, lx, ly + 9, { size: 24, font: 'hand', anchor: 'middle', fill: l.color || P.ink })}</g>`;
  });
  out += text(spec.note || 'SCHEMATIC · NOT TO SCALE', 1094, 652, { size: 18, font: 'hand', anchor: 'end', fill: P.inkSoft, opacity: 0.8 });
  return out;
}
section.focus = () => [640, 400, 1.04];

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

module.exports = { followCamera, equation, loop, funnel, orgTree, portraits, steps, section, split, montage, buildCamera, fitFocus, portrait, silhouette, emblem, initials, ICONS, countUp, C: C };
