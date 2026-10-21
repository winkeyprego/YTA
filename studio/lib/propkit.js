// Prop registry for the `compose` template: every prop that can be placed freely in a scene.
//
// Contract: PROPS[name] = (o, t) => svg, where o = { x, y, s (scale), at (entrance time, seconds), ...prop options }.
// (x, y) is the prop's anchor (usually bottom-centre, so props stand on a floor line), t is shot time.
// Props may animate in pure t (no Math.random; use rng from lib/motion.js). The compose template handles the entrance
// pop (scale from the anchor at `at`), so props only draw themselves; a prop that animates on its own after `at`
// (a scale tipping, a door closing) reads o.at itself.
//
// To add a prop: write it here (or in props.js/money.js and adapt it here), add an entry to DOCS at the bottom,
// and it becomes usable in every storyboard: {"t":"compose","items":[{"prop":"<name>","x":640,"y":600,"on":"word"}]}.

const P = require('./palette');
const { n } = require('./svg');
const props = require('./props');
const money = require('./money');

const at = (o) => o.at ?? 0;
const place = (o, inner) => `<g transform="translate(${n(o.x ?? 640)} ${n(o.y ?? 600)}) scale(${n(o.s ?? 1)})">${inner}</g>`;

const PROPS = {
  // money (lib/money.js)
  cashStack: (o, t) => money.cashStack(o.x ?? 640, o.y ?? 600, o.height ?? 220, t, at(o), { w: o.w ?? 120 }),
  moneyBag: (o) => money.moneyBag(o.x ?? 640, o.y ?? 600, { s: o.s ?? 1, label: o.label ?? '$' }),
  coinPile: (o) => money.coinPile(o.x ?? 640, o.y ?? 600, { s: o.s ?? 1, count: o.count ?? 14 }),
  goldBars: (o) => money.goldBars(o.x ?? 640, o.y ?? 600, { s: o.s ?? 1, rows: o.rows ?? 3 }),
  banknote: (o) => money.banknote(o.x ?? 640, o.y ?? 600, { s: o.s ?? 1, rot: o.rot ?? 0, value: o.value ?? '100' }),
  piggyBank: (o, t) => money.piggyBank(o.x ?? 640, o.y ?? 600, t, { s: o.s ?? 1, shake: o.shake ?? 0 }),
  vault: (o, t) => money.vault(o.x ?? 640, o.y ?? 400, { r: (o.s ?? 1) * 150, open: o.open ?? Math.min(1, Math.max(0, (t - at(o)) / 1.2)), t }),
  moneyRain: (o, t) => money.moneyRain(t, at(o), {}),
  // furniture & objects (lib/props.js)
  desk: (o) => place({ ...o, s: o.s ?? 1 }, props.desk(-260, -134, 520)),
  clock: (o, t) => props.clock(o.x ?? 640, o.y ?? 200, t, { r: (o.s ?? 1) * 34, hour: o.hour ?? 10 }),
  paperStack: (o) => place(o, props.paperStack(-60, -20, o.label)),
  phone: (o) => place(o, props.phone(-35, -24)),
  monitor: (o, t) => props.monitor((o.x ?? 640) - 55 * (o.s ?? 1), (o.y ?? 600) - 90 * (o.s ?? 1), 110 * (o.s ?? 1), 72 * (o.s ?? 1), t, { kind: o.kind ?? 'bars' }),
  chair: (o) => place(o, props.chair(-35, -120, {})),
  plant: (o) => props.plant(o.x ?? 640, o.y ?? 600, { s: o.s ?? 1 }),
  bookshelf: (o) => place(o, props.bookshelf(-110, -260)),
  flagPole: (o) => props.flagPole(o.x ?? 640, o.y ?? 600, { h: (o.s ?? 1) * 300, kind: o.kind ?? 'us' }),
  podium: (o) => props.podium(o.x ?? 640, o.y ?? 600, { seal: o.seal ?? false }),
  couch: (o) => props.couch(o.x ?? 640, o.y ?? 600, {}),
  tv: (o) => place(o, props.tv(-130, -160, 260, 160, o.content || '')),
  column: (o) => props.column(o.x ?? 640, (o.y ?? 600) - (o.s ?? 1) * 360, o.y ?? 600, {}),
  machine: (o, t) => props.machine(o.x ?? 640, o.y ?? 600, t, {}),
};

// One line per prop: what it is + its options (shown in SHOTS.md "compose"; keep it short).
const DOCS = {
  cashStack: 'stack of cash that grows at `at` (height, w)',
  moneyBag: 'money bag (label)', coinPile: 'pile of coins (count)', goldBars: 'stacked gold bars (rows)',
  banknote: 'single banknote (value, rot)', piggyBank: 'piggy bank (shake)', vault: 'vault door that swings open from `at` (open 0..1)',
  moneyRain: 'banknotes falling over the frame from `at`',
  desk: 'office desk (front view)', clock: 'wall clock (hour), hands move', paperStack: 'stack of papers (label)', phone: 'desk phone',
  monitor: 'computer monitor (kind: bars|line|text)', chair: 'office chair', plant: 'potted plant', bookshelf: 'bookshelf',
  flagPole: 'flag on a pole (kind: us|plain)', podium: 'speaker podium (seal)', couch: 'couch', tv: 'TV set (content svg)',
  column: 'classical column', machine: 'factory machine',
};

module.exports = { PROPS, DOCS };
