// Showcase for the second batch of library pieces: faceless portraits, step prefixes + 8 notes, the structural
// section schematic, new icons, fuse endStyle/rope options, the case board, map rings and the city plate.
const P = require('../../lib/palette');
const { camera } = require('../../lib/svg');
const M = require('../../lib/motion');
const ui = require('../../lib/ui');
const D = require('../../lib/diagrams');
const dev = require('../../lib/devices');
const maps = require('../../lib/maps');

const FO = { vignette: 0.25 };
const build = (name, fn, spec, dur) => ({
  name, dur, frameOpts: FO,
  render: (t) => camera(fn(spec, t), D.buildCamera(t, dur, fn.focus ? fn.focus(spec) : [640, 360])),
});

const PORT = { title: 'Who was in the room', people: [
  { emblem: 'SC', label: 'Sarah Connor', sub: 'the analyst', at: 0.4 },
  { silhouette: true, label: 'Unnamed source', sub: 'never identified', at: 1.3 },
  { who: 'host', label: 'The host', sub: 'explains it', at: 2.2 },
  { label: 'Federal Agency', sub: 'the regulator', color: P.navy, at: 3.1 },
  { silhouette: true, label: 'The witness', sub: 'gave a statement', color: P.greyDark, at: 4.0 }] };
const NOTES = { style: 'notes', title: 'What people claimed', prefix: '', steps: [
  'It was planned', 'The timing was odd', 'Nobody was warned', 'Records went missing', 'A second team', 'The money trail', 'Still unanswered'].map((label, i) => ({ label, at: 0.4 + i * 0.7 })) };
const BOOK = { title: 'The theories', prefix: 'THEORY', steps: [{ label: 'An inside job', at: 0.4 }, { label: 'A cover-up', at: 2.0 }, { label: 'Pure chance', at: 3.6 }] };
const SECTION = { title: 'How the load moved', columns: 6, floors: 7, highlight: [2], labels: ['KEY COLUMN', { text: 'ROOF LOAD', floor: 7 }], at: 0.4, sagAt: 3.6 };
const EQ = { title: 'What the system needed', terms: [{ label: 'Servers', icon: 'server', at: 0.3 }, { label: 'Power', icon: 'power', at: 0.6 }, { label: 'Lock', icon: 'lock', at: 0.9 }],
  ops: ['+', '+', '='], result: { label: 'Uptime', icon: 'clock', at: 1.2 } };
const ICON_NAMES = ['server', 'power', 'pylon', 'building', 'lock', 'scales', 'clock', 'phone', 'document', 'plane', 'radar', 'shield', 'eye'];
const iconGrid = (t) => D.loop({ title: '', nodes: [] }, t) + ICON_NAMES.map((k, i) => {
  const x = 140 + (i % 7) * 167, y = 230 + Math.floor(i / 7) * 260;
  return `<rect x="${x - 70}" y="${y - 70}" width="140" height="140" rx="10" fill="${D.C.card}" stroke="${P.ink}" stroke-width="3"/>${D.ICONS[k](x, y)}<text x="${x}" y="${y + 104}" class="t-hand" font-size="26" text-anchor="middle" fill="${P.ink}">${k}</text>`;
}).join('');

// fuse: verdict card + red thread on the dark board (mirrors templates.fuse layout)
const boardBg = (h, sub) => `<rect width="1280" height="720" fill="${P.woodDark}"/><rect x="22" y="22" width="1236" height="676" fill="${P.board}" stroke="${P.ink}" stroke-width="5"/>
  <text x="640" y="110" class="t-display" font-size="54" text-anchor="middle" fill="${P.paper}" opacity=".9">${h}</text><text x="640" y="150" class="t-hand" font-size="28" text-anchor="middle" fill="${P.paperDim}">${sub}</text>`;
function fuseShot(name, opts, dur) {
  const stops = [{ year: '1993', title: 'A WARNING', lines: ['report filed', 'then shelved'] }, { year: '1998', title: 'A MEMO', lines: ['flagged the gap'] }, { year: '2001', title: 'A TIP', lines: ['never shared'] }];
  const x0 = 110, x1 = 1040;
  const xs = stops.map((_, i) => x0 + ((i + 1) / 4) * (x1 - x0));
  const ks = xs.map((x) => (x - x0) / (x1 - x0));
  const sch = dev.fuseSchedule(0.4, ks, { burn: 0.9, hold: 0.8 });
  return { name, dur, render: (t) => {
    const { k, reached } = dev.fuseProgress(t, 0.4, ks, { burn: 0.9, hold: 0.8 });
    const defs = stops.map((s, i) => ({ ...s, x: xs[i] }));
    const cards = defs.map((s, i) => ui.indexCard({ x: s.x - 105, y: 236, w: 210, h: 124, title: s.title, lines: s.lines, rot: i % 2 ? 2 : -2 }, t, sch.stops[i])).join('');
    return boardBg('THE RECORD', 'every point where someone could have acted')
      + dev.fuse({ x0, x1, base: 470, stops: defs, end: { label: opts.label, sub: opts.sub, at: sch.end, color: opts.color }, k, t, endStyle: opts.endStyle, rope: opts.rope }) + cards
      + dev.tally('CHANCES TO ACT', reached + 1, 930, 48, { w: 290 });
  } };
}

const CARDS = [
  { title: 'The claim', lines: ['The alarm was switched off on purpose'], verdict: 'FALSE' },
  { title: 'The memo', lines: ['A warning sat unread for six weeks'], verdict: 'UNPROVEN' },
  { title: 'The call log', lines: ['Two calls are missing from the record'], verdict: 'STILL OPEN' },
  { title: 'The inquiry', lines: ['Found failures, not a plot'], verdict: 'CONFIRMED' },
];
const CARDS6 = [...CARDS, { title: 'The leak', lines: ['A copy reached the press'] }, { title: 'The reply', lines: ['Officials declined to comment'], verdict: 'STILL OPEN' }];

const RVIEW = maps.fitTo(['United States of America'], { padding: 60 });
const ringMap = { name: 'map-rings', dur: 4, render: (t) => camera(maps.mapView({ t, ...RVIEW,
  highlight: { 'United States of America': { color: P.paperDim } },
  cities: [{ name: 'New York', lon: -74.0, lat: 40.7, at: 0.3 }, { name: 'Washington', lon: -77.04, lat: 38.9, at: 0.5, side: 'left' }],
  rings: [{ lon: -74.0, lat: 40.7, miles: 200, label: '200 MILES', at: 0.8 }, { lon: -77.04, lat: 38.9, km: 800, label: '800 KM', at: 1.8, color: P.blue }],
}), { zoom: M.creep(t) }) + ui.dateTag('THE NORTHEAST · RANGE', t, 0.1) };
const ringMap2 = { name: 'map-rings-close', dur: 3.5, render: (t) => maps.mapView({ t, center: [-76, 40.5], zoom: 14,
  cities: [{ name: 'New York', lon: -74.0, lat: 40.7, at: 0.2 }, { name: 'Pittsburgh', lon: -79.99, lat: 40.44, at: 0.2, side: 'left' }],
  rings: [{ lon: -74.0, lat: 40.7, miles: 100, at: 0.5 }, { lon: -79.99, lat: 40.44, miles: 50, at: 1.2, color: P.blue }] }) };

module.exports = {
  fps: 24,
  shots: [
    build('portraits-faceless', D.portraits, PORT, 6.5),
    build('notes-7-noprefix', D.steps, NOTES, 6),
    build('book-theory', D.steps, BOOK, 5.5),
    build('section-sag', D.section, SECTION, 6.5),
    build('equation-icons', D.equation, EQ, 3.5),
    { name: 'icon-grid', dur: 1, frameOpts: FO, render: iconGrid },
    fuseShot('fuse-card-thread', { endStyle: 'card', rope: 'thread', label: 'NO ACTION', sub: 'the verdict' }, 7.5),
    fuseShot('fuse-flag-fuse', { endStyle: 'flag', rope: 'fuse', label: 'FINISH' }, 6),
    { name: 'case-board', dur: 8.5, render: (t) => camera(dev.caseBoard({ heading: 'THE CASE FILE', sub: 'four claims, checked against the record', cards: CARDS, t }), { zoom: M.creep(t, 0.006) }) },
    { name: 'case-board-6', dur: 4, render: (t) => dev.caseBoard({ heading: 'SIX THREADS', cards: dev.caseSchedule(CARDS6, { start: 0.2, every: 0.5, verdictDelay: 0.4 }), t }) },
    ringMap,
    ringMap2,
    { name: 'city-plate', dur: 4, render: (t) => camera(maps.cityPlate({ name: 'Lower Manhattan', sub: 'the financial district', water: ['left', 'bottom'], t, at: 0.1,
      pins: [{ label: 'The exchange', x: 0.55, y: 0.42, at: 0.7 }, { label: 'City hall', x: 0.66, y: 0.2, at: 1.2, color: P.blue }, { label: 'The ferry', x: 0.42, y: 0.72, at: 1.7, color: P.gold }] }), { zoom: M.creep(t) })
      + ui.dateTag('NEW YORK · 2001', t, 0.1) },
    { name: 'city-plate-rural', dur: 3, render: (t) => maps.cityPlate({ name: 'Open country', sub: 'a field, a road', grid: false, water: 'right', t,
      pins: [{ label: 'The field', x: 0.4, y: 0.55, at: 0.6 }] }) },
  ],
};
