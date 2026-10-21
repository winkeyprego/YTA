// Library test: the WW2 Eastern Front kit. Props tank, tankColumn, truck (canvas|crates|rockets|bread), cargoShip, book
// (lib/props-extra.js via lib/propkit.js PROPS), the `pipes` house device (lib/devices.js, template in lib/templates.js)
// through its whole build with a shut valve, and the costume features ushanka / stahlhelm / peaked + greatcoat / tunic.
// Render: node render.js episodes/test-eastfront-props --sheet 1 --scale 0.5
const P = require('../../lib/palette');
const { g, tr, text, n } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character } = require('../../lib/characters');
const { PROPS } = require('../../lib/propkit');
const { TEMPLATES } = require('../../lib/templates');
const { styleOf } = require('../../lib/styles');

const bg = (fill = '#e9e4d8') => `<rect width="1280" height="720" fill="${fill}"/><rect y="640" width="1280" height="80" fill="${P.paperShade}"/>`;
const MOODS = [
  { eyes: 'dot', mouth: 'neutral' }, { eyes: 'dot', brows: 'angry', mouth: 'flat' }, { eyes: 'dot', brows: 'flat', mouth: 'smile' },
  { eyes: 'sad', brows: 'worried', mouth: 'frown' }, { eyes: 'smug', brows: 'smug', mouth: 'smirk' },
];

// one shot = a lineup of people: [label, spec, state]
const lineup = (name, people, dur = 2) => ({
  name, dur,
  render: (t) => bg() + people.map(([label, spec, st = {}], i) => {
    const x = 640 + (i - (people.length - 1) / 2) * 245;
    const state = { ...MOODS[i % MOODS.length], breathe: M.breathe(t, i), blink: M.blinking(t, i + 2), ...st };
    return g(tr(x, 640, 0.95), character(spec, state)) + text(label, x, 690, { size: 24, anchor: 'middle' });
  }).join('') + text(name, 30, 44, { size: 30 }),
});

// props with the compose-style entrance pop at `at`
const popProp = (name, o, t) => {
  const at = o.at ?? 0;
  if (t < at) return '';
  const p = M.pop(t, at, 0.25);
  const x = o.x ?? 640, y = o.y ?? 600;
  return `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${PROPS[name]({ ...o, x, y }, t)}</g>`
    + (o.tag === false ? '' : text(o.tag || name, o.tx ?? x, Math.min(712, o.ty ?? y + 30), { size: 20, anchor: 'middle', fill: P.inkSoft }));
};
const propShot = (name, dur, items, fill) => ({
  name, dur,
  render: (t) => bg(fill) + items.map(([k, o]) => popProp(k, o, t)).join('') + text(name, 30, 44, { size: 30 }),
});

// a template shot driven by numeric cues (no narration)
const ctx = (dur) => ({ dur, cue: (c, d = 0) => (typeof c === 'number' ? c : d), cast: {}, style: styleOf('war') });
const tplShot = (name, dur, shot) => {
  const r = TEMPLATES[shot.template](shot, ctx(dur));
  return { name, dur, template: shot.template, render: (t) => r(t) };
};

const SKY = '#c9d6dc';
const shots = [
  propShot('tank: static, driving (dir -1), no star', 4, [
    ['tank', { x: 340, y: 380, s: 0.72, at: 0.1, tag: 'tank (static)' }],
    ['tank', { x: 1080, y: 650, s: 0.72, at: 0.2, dir: -1, drive: 130, tag: 'tank dir -1 drive 130', tx: 900 }],
    ['tank', { x: 980, y: 380, s: 0.5, at: 0.3, star: false, color: 'greyDark', tag: 'star:false color:greyDark' }],
  ], SKY),
  propShot('tankColumn: count 5 speed 120 / count 3 dir -1', 4, [
    ['tankColumn', { x: 380, y: 360, count: 5, speed: 120, at: 0.1, tag: false }],
    ['tankColumn', { x: 980, y: 660, count: 3, speed: 90, dir: -1, at: 0.2, s: 0.4, tag: false }],
  ], SKY),
  propShot('truck cargo: canvas (star) / crates / rockets / bread', 3, [
    ['truck', { x: 330, y: 320, s: 0.62, at: 0.1, star: true, tag: 'canvas, star:true' }],
    ['truck', { x: 960, y: 320, s: 0.62, at: 0.2, cargo: 'crates', tag: 'crates' }],
    ['truck', { x: 330, y: 650, s: 0.62, at: 0.3, cargo: 'rockets', tag: 'rockets (Katyusha)', ty: 690 }],
    ['truck', { x: 960, y: 650, s: 0.62, at: 0.4, cargo: 'bread', tag: 'bread', ty: 690 }],
  ], SKY),
  propShot('trucks driving: dir 1 drive 150 / rockets dir -1', 4, [
    ['truck', { x: 220, y: 360, s: 0.7, at: 0.1, star: true, drive: 150, tag: false }],
    ['truck', { x: 1080, y: 660, s: 0.7, at: 0.2, cargo: 'rockets', dir: -1, drive: 110, tag: false }],
  ], SKY),
  propShot('cargoShip (static, bobbing)', 3, [
    ['cargoShip', { x: 640, y: 680, s: 0.75, at: 0.1, tag: false }],
  ], SKY),
  propShot('cargoShip sailing dir -1 (sail 70)', 4, [
    ['cargoShip', { x: 760, y: 640, s: 0.6, at: 0.1, dir: -1, sail: 70, tag: false }],
  ], SKY),
  propShot('book: closed (title, color, tilt) / open', 3, [
    ['book', { x: 240, y: 600, s: 1.2, at: 0.1, title: 'The Eastern Front', tag: 'title, default red' }],
    ['book', { x: 520, y: 600, s: 1.2, at: 0.2, title: 'Lend-Lease', color: 'navy', tilt: 4, tag: 'navy, tilt 4' }],
    ['book', { x: 920, y: 600, s: 1.2, at: 0.3, open: true, tag: 'open: true' }],
  ]),
  tplShot('pipes', 11, {
    template: 'pipes', heading: 'TWO PIPES, ONE FRONT', sub: 'what kept the Red Army moving',
    tag: 'EASTERN FRONT · 1942',
    a: { label: 'SOVIET PIPE', sub: 'from behind the Urals', at: 0.6 },
    b: { label: 'ALLIED PIPE', sub: 'from three oceans', at: 2.6, share: 0.3 },
    front: { label: 'THE FRONT', at: 0 },
    shut: [{ pipe: 'b', at: 7.2, label: 'CUT' }],
  }),
  lineup('Soviet soldier / German soldier / officers', [
    ['greatcoat + ushanka', { outfit: 'greatcoat', hat: 'ushanka', hair: 'none', skin: P.skin2 }],
    ['greatcoat fieldGrey + stahlhelm', { outfit: 'greatcoat', suit: P.fieldGrey, shirt: P.fieldGrey, hat: 'stahlhelm', hair: 'none', skin: P.skin1 }],
    ['tunic + peaked', { outfit: 'tunic', hat: 'peaked', hair: 'side', hairColor: '#4a4038', skin: P.skin2 }],
    ['tunic fieldGrey + peaked', { outfit: 'tunic', suit: P.fieldGrey, hat: 'peaked', hatColor: P.fieldGrey, hatBand: P.oliveDark, hair: 'slick', hairColor: '#6b5a4a', glasses: true, skin: P.skin1 }],
    ['tunic + ushanka (pointing)', { outfit: 'tunic', suit: P.oliveDark, hat: 'ushanka', hair: 'none', skin: P.skin3 }, { armR: [115, 10] }],
  ]),
  lineup('turned, walking, back, seated', [
    ['turn 0.8', { outfit: 'greatcoat', hat: 'ushanka', hair: 'none', skin: P.skin4 }, { turn: 0.8 }],
    ['walking', { outfit: 'greatcoat', suit: P.fieldGrey, hat: 'stahlhelm', hair: 'none' }, { walk: 1.2 }],
    ['back view', { outfit: 'greatcoat', hat: 'ushanka', hair: 'none' }, { back: true }],
    ['seated officer', { outfit: 'tunic', hat: 'peaked', hair: 'side' }, { sit: true }],
  ]),
];

module.exports = { fps: 24, shots };
