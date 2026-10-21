// Library test: likeness features in lib/characters.js (face shapes, jowls, cast brows, new hair, templeColor,
// hairVolume, lines, earSize, glassesShape) and that hair, hats, ears, glasses, beards and headsets sit right on
// every head shape. Render: node render.js episodes/test-likeness --sheet 1 --scale 0.5
// Close-ups: --still 10.5 (famous-type lineup), --still 11.5 / 12.5 / 13.5 (big heads)
const P = require('../../lib/palette');
const { g, tr, text } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character } = require('../../lib/characters');

const bg = (fill = '#e9e4d8') => `<rect width="1280" height="720" fill="${fill}"/><rect y="640" width="1280" height="80" fill="${P.paperShade}"/>`;
const MOODS = [
  { eyes: 'dot', mouth: 'smile' }, { eyes: 'happy', brows: 'raised', mouth: 'grin' }, { eyes: 'wide', brows: 'raised', mouth: 'o' },
  { eyes: 'sad', brows: 'worried', mouth: 'frown' }, { eyes: 'smug', brows: 'smug', mouth: 'smirk' },
];

// one shot = a lineup; entries are [label, spec, state]
const lineup = (name, people, { s = 0.95, gap = 245, y = 640, dur = 1 } = {}) => ({
  name,
  dur,
  render: (t) => bg() + people.map(([label, spec, st = {}], i) => {
    const x = 640 + (i - (people.length - 1) / 2) * gap;
    const state = { ...MOODS[i % MOODS.length], breathe: M.breathe(t, i), ...st };
    return g(tr(x, y, s), character(spec, state)) + text(label, x, 690, { size: 22, anchor: 'middle' });
  }).join('') + text(name, 30, 44, { size: 30 }),
});

const man = { outfit: 'suit', suit: P.navy, tie: P.red, hairColor: '#4a4038' };
// the same five accessory checks on each head shape
const perFace = (face, extra = {}) => lineup(`face: ${face}${extra.jowls ? ' + jowls' : ''}`, [
  ['side, glasses, ears', { ...man, face, ...extra, hair: 'side', glasses: true, earSize: 1 }],
  ['fedora, full beard', { ...man, face, ...extra, hair: 'side', hat: 'fedora', beard: 'full', beardColor: '#4a4038' }],
  ['headset, curly', { outfit: 'shirt', shirt: '#c9d6e3', face, ...extra, hair: 'curly', hairColor: '#2f2a26', headset: true, skin: P.skin5 }],
  ['bob, short beard', { outfit: 'shirt', shirt: P.green, face, ...extra, hair: 'bob', hairColor: '#6b3f2a', beard: 'short', beardColor: '#6b3f2a', earrings: true, skin: P.skin2 }],
  ['tophat / helmet', { outfit: 'coat', face, ...extra, hair: 'bald', hairColor: P.greyLight, hat: face === 'wide' || face === 'square' ? 'pilotHelmet' : 'tophat', skin: P.skin3 }],
]);

const shots = [
  lineup('face shapes (plain)', ['round', 'long', 'wide', 'square'].map((face) => [face, { ...man, face, hair: 'slick' }, {}]).concat([['square + jowls', { ...man, face: 'square', jowls: true, hair: 'slick' }, {}]])),
  perFace('round'),
  perFace('long'),
  perFace('wide'),
  perFace('square'),
  perFace('round', { jowls: true }),
  lineup('cast brows (mood still sets the angle)', [
    ['default', { ...man, hair: 'side' }, { brows: 'angry', eyes: 'dot', mouth: 'frown' }],
    ['thin', { ...man, hair: 'side', brows: 'thin' }],
    ['thick', { ...man, hair: 'side', brows: 'thick' }],
    ['bushy', { ...man, hair: 'bald', hairColor: P.greyLight, brows: 'bushy' }, { brows: 'flat' }],
    ['arched', { outfit: 'dress', shirt: P.red, hair: 'bob', hairColor: '#2f2a26', brows: 'arched' }],
  ]),
  lineup('new hair 1', [
    ['receding', { ...man, hair: 'receding' }],
    ['buzz', { outfit: 'tshirt', shirt: P.green, hair: 'buzz', hairColor: '#2f2a26', skin: P.skin4 }],
    ['wavy', { outfit: 'shirt', shirt: P.gold, hair: 'wavy', hairColor: '#6b3f2a' }],
    ['combover', { ...man, hair: 'combover', hairColor: '#6b5a4a' }],
    ['afro', { outfit: 'shirt', shirt: P.blue, hair: 'afro', hairColor: '#2a221e', skin: P.skin5 }],
  ]),
  lineup('new hair 2 + volume', [
    ['parted', { ...man, hair: 'parted', hairColor: '#3a2d25' }],
    ['grey temples', { ...man, hair: 'side', hairColor: '#2f2a26', templeColor: P.greyLight }],
    ['volume 0.8', { ...man, hair: 'side', hairVolume: 0.8 }],
    ['volume 1.3', { ...man, hair: 'side', hairVolume: 1.3 }],
    ['afro 1.3 temples', { outfit: 'shirt', shirt: P.red, hair: 'afro', hairColor: '#2a221e', templeColor: P.greyLight, hairVolume: 1.3, skin: P.skin6 }],
  ]),
  lineup('glasses, lines, ears', [
    ['glasses round', { ...man, hair: 'side', glassesShape: 'round' }],
    ['square', { ...man, hair: 'parted', glassesShape: 'square' }],
    ['half', { ...man, hair: 'bald', hairColor: P.greyLight, glassesShape: 'half' }],
    ['lines', { ...man, hair: 'receding', hairColor: P.greyLight, lines: true }],
    ['ears 0.8 / 1.3', { ...man, hair: 'buzz', earSize: 1.3 }],
  ]),
  // the four "famous-type" combinations from SHOTS.md "Likeness"
  lineup('famous-type combinations', [
    ['long, bald, half, lines', { outfit: 'suit', suit: P.charcoal, tie: P.gold, face: 'long', hair: 'bald', hairColor: P.greyLight, glassesShape: 'half', lines: true }],
    ['wide, afro', { outfit: 'blazer', suit: P.red, face: 'wide', hair: 'afro', hairColor: '#2a221e', earrings: true, brows: 'arched', skin: P.skin5 }],
    ['square, buzz, thick', { outfit: 'tshirt', shirt: P.greyDark, face: 'square', hair: 'buzz', hairColor: '#3a2d25', brows: 'thick', skin: P.skin2 }],
    ['round, combover, jowls', { outfit: 'suit', suit: '#5a4a3a', tie: P.blue, hair: 'combover', hairColor: '#6b5a4a', jowls: true, glasses: true }],
  ], { gap: 290 }),
  lineup('close-up: famous-type 1-2', [
    ['', { outfit: 'suit', suit: P.charcoal, tie: P.gold, face: 'long', hair: 'bald', hairColor: P.greyLight, glassesShape: 'half', lines: true, brows: 'bushy' }],
    ['', { outfit: 'blazer', suit: P.red, face: 'wide', hair: 'afro', hairColor: '#2a221e', earrings: true, brows: 'arched', skin: P.skin5 }],
  ], { s: 1.9, gap: 560, y: 900 }),
  lineup('close-up: famous-type 3-4', [
    ['', { outfit: 'tshirt', shirt: P.greyDark, face: 'square', hair: 'buzz', hairColor: '#3a2d25', brows: 'thick', skin: P.skin2, earSize: 1.15 }],
    ['', { outfit: 'suit', suit: '#5a4a3a', tie: P.blue, hair: 'combover', hairColor: '#6b5a4a', jowls: true, glasses: true, lines: true }],
  ], { s: 1.9, gap: 560, y: 900 }),
  lineup('close-up: parted, grey temples, volume 1.3', [
    ['', { ...man, hair: 'parted', hairColor: '#3a2d25', brows: 'thin' }],
    ['', { ...man, hair: 'side', hairColor: '#2f2a26', templeColor: 'greyLight', brows: 'thick' }],
    ['', { ...man, hair: 'slick', hairColor: P.gold, hairVolume: 1.3, face: 'wide' }],
  ], { s: 1.7, gap: 420, y: 860 }),
  lineup('turn, back, silhouette', [
    ['long turn', { ...man, face: 'long', hair: 'parted', glassesShape: 'square', earSize: 1.1 }, { turn: 0.7 }],
    ['wide back', { ...man, face: 'wide', hair: 'side', earSize: 1.2, hat: 'fedora' }, { back: true }],
    ['afro back', { outfit: 'shirt', shirt: P.blue, hair: 'afro', hairColor: '#2a221e', skin: P.skin5 }, { back: true }],
    ['square sit', { ...man, face: 'square', hair: 'wavy', brows: 'bushy', beard: 'short' }, { sit: true }],
    ['silhouette', { outfit: 'coat', face: 'long', hair: 'afro', hat: 'fedora', silhouette: true }],
  ]),
];

module.exports = { fps: 24, shots };
