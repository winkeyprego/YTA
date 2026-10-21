// Library test: new cast archetypes, features (beards, hats, uniforms, skin tones, held props) and the props in
// lib/props-extra.js (via lib/propkit.js PROPS). Render: node render.js episodes/test-cast-props --sheet 1 --scale 1
const P = require('../../lib/palette');
const { g, tr, text, n } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const { PROPS } = require('../../lib/propkit');

const bg = (fill = '#e9e4d8') => `<rect width="1280" height="720" fill="${fill}"/><rect y="640" width="1280" height="80" fill="${P.paperShade}"/>`;
const MOODS = [
  { eyes: 'dot', mouth: 'smile' }, { eyes: 'happy', brows: 'raised', mouth: 'grin' }, { eyes: 'wide', brows: 'raised', mouth: 'o' },
  { eyes: 'sad', brows: 'worried', mouth: 'frown' }, { eyes: 'smug', brows: 'smug', mouth: 'smirk' },
];

// one shot = a lineup of 4-5 people; entries are CAST keys or [label, spec, state]
const lineup = (name, people) => ({
  name,
  dur: 1,
  render: (t) => bg() + people.map((p, i) => {
    const [label, spec, st] = typeof p === 'string' ? [p, CAST[p], {}] : p;
    const x = 640 + (i - (people.length - 1) / 2) * 245;
    const state = { ...MOODS[i % MOODS.length], breathe: M.breathe(t, i), blink: M.blinking(t, i + 2), ...st };
    return g(tr(x, 640, 0.95), character(spec, state)) + text(label, x, 690, { size: 24, anchor: 'middle' });
  }).join('') + text(name, 30, 44, { size: 30 }),
});

// props: draw each with the compose-style entrance pop at `at`
const popProp = (name, o, t) => {
  const at = o.at ?? 0;
  if (t < at) return '';
  const p = M.pop(t, at, 0.25);
  const x = o.x ?? 640, y = o.y ?? 600;
  return `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${PROPS[name]({ ...o, x, y }, t)}</g>`
    + text(name, x, Math.min(712, y + (o.label && name === 'thermometer' ? 58 : 30)), { size: 20, anchor: 'middle', fill: P.inkSoft });
};
const propShot = (name, dur, items, fill) => ({
  name, dur,
  render: (t) => bg(fill) + items.map(([k, o]) => popProp(k, o, t)).join('') + text(name, 30, 44, { size: 30 }),
});

const shots = [
  lineup('uniforms', ['officer', 'pilot', 'fighterPilot', 'policeOfficer', 'firefighter']),
  lineup('work & occasions', ['scientist', 'engineer', 'controller', 'groom', 'bride']),
  lineup('everyday + unknown', ['passerby', 'neighbor', 'student', 'shopkeeper', 'unknown']),
  lineup('skin tones', [1, 2, 3, 4, 5].map((k) => [`skin${k}`, { outfit: 'tshirt', shirt: [P.green, P.blue, P.gold, P.red, P.greyDark][k - 1], print: String(k), hair: ['bob', 'side', 'curly', 'long', 'spiky'][k - 1], hairColor: '#3a2d25', skin: P[`skin${k}`] }, {}])),
  lineup('skin6 + beards + holding', [
    ['skin6 glass', { outfit: 'tuxedo', hair: 'bald', skin: P.skin6, beard: 'short', beardColor: '#2a221e' }, { holding: 'glass', armR: [60, -60] }],
    ['camera', { ...CAST.passerby }, { holding: 'camera', armR: [70, -70] }],
    ['laptop', { ...CAST.scientist }, { holding: 'laptop', armR: [30, -70] }],
    ['book', { ...CAST.student }, { holding: 'book', armR: [40, -60] }],
    ['full beard', { outfit: 'labcoat', hair: 'side', hairColor: P.greyLight, beard: 'full', beardColor: P.greyLight, skin: P.skin3 }, { holding: 'glass', armR: [60, -60] }],
  ]),
  propShot('scale, bell, wall clock', 4, [
    ['balanceScale', { x: 260, y: 620, s: 0.85, at: 0.2, tip: 1, left: 'SAFETY', right: 'PROFIT' }],
    ['bell', { x: 680, y: 620, s: 0.85, at: 0.4 }],
    ['wallClock', { x: 1060, y: 560, s: 1, at: 0.3, time: '9:30' }],
  ]),
  propShot('countdown, invitation, thermometer, badge', 4, [
    ['countdownClock', { x: 330, y: 300, s: 0.8, at: 0.2, from: 3, to: 0, label: 'MARKET OPENS' }],
    ['invitation', { x: 330, y: 650, s: 0.8, at: 0.3, title: 'The Wedding', date: 'June 12, 1998' }],
    ['thermometer', { x: 760, y: 640, s: 0.85, at: 0.4, value: 42, max: 50, unit: '°C', label: 'JULY' }],
    ['badge', { x: 1080, y: 640, s: 0.95, at: 0.5, name: 'J. Doe', role: 'CONTRACTOR' }],
  ]),
  propShot('doors, sharks', 5, [
    ['doorsRow', { x: 640, y: 400, s: 0.9, at: 0.2, count: 5 }],
    ['sharkFins', { x: 640, y: 690, s: 0.9, at: 0.2, count: 3 }],
  ]),
  propShot('weather, breaker, copier, coffee', 4, [
    ['weather', { x: 230, y: 320, s: 0.9, at: 0.2, kind: 'sun' }],
    ['weather', { x: 640, y: 320, s: 0.9, at: 0.3, kind: 'storm' }],
    ['weather', { x: 1050, y: 320, s: 0.9, at: 0.4, kind: 'hurricane' }],
    ['circuitBreaker', { x: 230, y: 690, s: 0.75, at: 0.2 }],
    ['photocopier', { x: 700, y: 680, s: 0.85, at: 0.3 }],
    ['coffeeCup', { x: 1080, y: 680, s: 1, at: 0.4 }],
  ]),
  propShot('van, radar', 4, [
    ['van', { x: 280, y: 650, s: 0.9, at: 0.2 }],
    ['radarScope', { x: 760, y: 650, s: 0.85, at: 0.3, blips: 5 }],
    ['radarScope', { x: 1120, y: 650, s: 0.6, at: 0.4, ring: true, blips: 4 }],
  ]),
  propShot('jets, black box, rocket', 5, [
    ['jet', { x: 120, y: 150, s: 0.8, at: 0.2, kind: 'business', fly: 260 }],
    ['jet', { x: 760, y: 330, s: 0.8, at: 0.3, kind: 'fighter' }],
    ['blackBox', { x: 300, y: 660, s: 0.9, at: 0.3, ping: true }],
    ['rocket', { x: 1080, y: 680, s: 0.8, at: 0.2, launch: 1.5 }],
  ], '#c9d6dc'),
  propShot('poker, puzzle, evidence, petition', 5, [
    ['pokerTable', { x: 360, y: 390, s: 0.68, at: 0.2 }],
    ['puzzle', { x: 980, y: 330, s: 0.8, at: 0.2, missing: 2 }],
    ['evidenceTray', { x: 380, y: 690, s: 0.72, at: 0.4, items: ['PASSPORT', 'MAP', 'CASH'] }],
    ['clipboard', { x: 980, y: 700, s: 0.72, at: 0.3, count: 8 }],
  ]),
  propShot('house of cards', 7, [
    ['houseOfCards', { x: 640, y: 640, s: 1.2, at: 0.2, levels: 3 }],
  ]),
];

module.exports = { fps: 24, shots };
