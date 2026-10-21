// Sample: cold open of "Why the 2008 Crash Was COMPLETELY Avoidable".
// Eight shots, ~37s, cut to the reference pacing (docs/REFERENCE-ANALYSIS.md):
// short shots, wide -> close cuts, a visual event every ~1s, linear camera moves, no shake.
// Facts used are listed in SCRIPT.md with sources to check before publishing.

const P = require('../../lib/palette');
const { g, tr, text, camera, W, H } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const props = require('../../lib/props');
const ui = require('../../lib/ui');
const dev = require('../../lib/devices');

// ---------- shared set: Lehman HQ at night ----------
// `wt` = time in the world's own clock, so the windows keep going dark across cuts.
function lehmanNight(wt, { walkerFrom = null } = {}) {
  const walking = walkerFrom != null && wt > walkerFrom;
  const wx = M.tween(wt, walkerFrom ?? 0, 3.6, 640, 930, M.ease.linear);
  return [
    props.nightSky(3),
    props.skyline(11, 650, { color: '#253247', minH: 140, maxH: 330, lit: 0.04 }),
    props.skyline(5, 660, { color: P.night, minH: 60, maxH: 210, lit: 0.08 }),
    props.tower(520, 96, 240, 556, wt, { offFrom: 0.6, offTo: 6.4 }),
    `<rect y="652" width="${W}" height="${H - 652}" fill="#1a222e"/><path d="M0 652 H${W}" stroke="${P.ink}" stroke-width="5"/>
     <path d="M0 690 H${W}" stroke="#2a3444" stroke-width="3" stroke-dasharray="40 30"/>`,
    props.streetLamp(300, 652),
    props.streetLamp(890, 652),
    walking ? g(tr(wx, 668, 0.42), character(CAST.banker, { carry: 'box', walk: wt * 9, eyes: 'sad', brows: 'worried', mouth: 'frown' })) : '',
  ].join('');
}

// ---------- 1a. the tower ----------
const s1a = {
  name: 'tower-wide',
  dur: 3.4,
  render(t) {
    return camera(lehmanNight(t), { zoom: M.creep(t), fx: 640, fy: 420 })
      + ui.sticker('LEHMAN BROTHERS', 640, 66, t, 0.9, { rot: -1.5, size: 32, color: P.ink })
      + ui.dateTag('NEW YORK · 15 SEPT 2008 · 1:45 AM', t, 0.1);
  },
};

// ---------- 1b. the street (closer, locked-off) ----------
const s1b = {
  name: 'street-close',
  dur: 3.2,
  render(t) {
    const wt = 3.4 + t;
    return camera(lehmanNight(wt, { walkerFrom: 3.5 }), { zoom: 1.6, fx: 700, fy: 560 })
      + ui.bigStat('158 YEARS', 'ON WALL STREET', 64, 300, t, 0.5)
      + ui.sticker('GONE IN ONE NIGHT', 250, 420, t, 1.5, { rot: -3, size: 36 });
  },
};

// ---------- 2. the filing (hold, then punch in onto the stamp) ----------
const s2 = {
  name: 'bankruptcy-filing',
  dur: 4.6,
  render(t) {
    const doc = [
      ['UNITED STATES BANKRUPTCY COURT', 30],
      ['SOUTHERN DISTRICT OF NEW YORK', 30],
      ['', 30],
      ['In re:', 26],
      ['LEHMAN BROTHERS HOLDINGS INC.,', 30],
      ['                         Debtor.', 26],
      ['', 26],
      ['Chapter 11', 30],
      ['Case No. 08-13555', 26],
      ['', 20],
      ['VOLUNTARY PETITION', 30],
      ['Filed: September 15, 2008', 26],
    ];
    let y = 150;
    const lines = doc.map(([s, size]) => {
      const out = s ? text(s, 400, y, { size, font: 'type' }) : '';
      y += size * 1.32;
      return out;
    }).join('');
    const world = props.deskTop(4)
      + `<g filter="url(#softShadow)"><rect x="360" y="70" width="600" height="700" fill="${P.paper}" transform="rotate(-1.5 660 420)"/></g>`
      + `<g transform="rotate(-1.5 660 420)">`
      + ui.highlight(396, 315, 470, t, 0.6, { h: 34 })
      + lines
      + `<path d="M400 112 H900" stroke="${P.ink}" stroke-width="2"/>`
      + `</g>`
      + `<g transform="translate(1040 520) rotate(-35)"><rect width="230" height="16" fill="${P.red}" stroke="${P.ink}" stroke-width="3"/><path d="M230 0 L262 8 L230 16 Z" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3"/><path d="M252 5 L262 8 L252 11 Z" fill="${P.ink}"/></g>`
      + `<circle cx="190" cy="180" r="70" fill="none" stroke="#5a3a26" stroke-width="9" opacity=".5"/>`
      + ui.stamp('$613 BILLION IN DEBT', 650, 630, t, 1.8, { rot: -7, size: 48 });
    return camera(world, { zoom: M.punch(t, 1.2), fx: 650, fy: 560 })
      + ui.sticker('BIGGEST BANKRUPTCY IN U.S. HISTORY', 640, 44, t, 3.0, { rot: 1.5, size: 30, color: P.ink });
  },
};

// ---------- 3. the assumption (2006): wide, then close-up ----------
// S&P/Case-Shiller U.S. National Home Price Index (NSA, Jan 2000 = 100), approximate path.
const CS = [[2000, 100], [2001, 108], [2002, 116], [2003, 127], [2004, 141], [2005, 160], [2006.5, 184.6],
  [2007, 182], [2007.5, 178], [2008, 170], [2008.5, 165], [2009, 150], [2009.5, 147], [2010, 146],
  [2010.5, 147], [2011, 140], [2011.5, 140], [2012.1, 134]];

function officeSet(t, banker) {
  const chart = props.lineChart({
    x: 110, y: 90, w: 330, h: 240, title: 'U.S. HOME PRICES',
    data: CS, xRange: [2000, 2006.6], yRange: [90, 195], upTo: 2006.5,
    xLabels: [[2000, '2000'], [2006, '2006']],
  });
  return props.office()
    + props.windowCity(830, 70)
    + props.clock(570, 110, t, { hour: 4 })
    + g(`transform="rotate(-1.5 275 210)" filter="url(#shadow)"`, chart)
    + g(tr(680, 612), banker)
    + props.desk(380, 470)
    + props.paperStack(440, 446, 'AAA')
    + props.phone(790, 446);
}

const POINT = [115, 10];
const s3a = {
  name: 'office-wide',
  dur: 3.4,
  render(t) {
    const banker = character(CAST.banker, {
      armL: M.keys(t, [[0.9, [10, -6]], [1.3, POINT]]),
      armR: [12, -8],
      look: t > 1.0 ? -0.8 : 0,
      mouth: 'smirk',
      breathe: M.breathe(t),
    });
    return camera(officeSet(t, banker), { zoom: M.creep(t), fx: 650, fy: 330 })
      + ui.dateTag('NEW YORK · SPRING 2006', t, 0.1)
      + ui.namePlate('A Wall Street Banker', 'Mortgage desk', t, 0.5);
  },
};

const LINE = ['House prices never fall.', 'Not nationally. Not ever.'];
const s3b = {
  name: 'office-close',
  dur: 4.6,
  render(t) {
    const b = ui.bubble({ x: 740, y: 70, w: 430, lines: LINE, tail: [815, 285], size: 30 }, t, 0.3);
    const banker = character(CAST.banker, {
      armL: POINT,
      armR: [12, -8],
      eyes: 'smug',
      brows: 'smug',
      mouth: M.mouthCycle(t, 0.5, b.end) || 'smirk',
      breathe: M.breathe(3.4 + t),
      tilt: M.keys(t, [[0.3, 0], [0.6, -4]]),
    });
    return camera(officeSet(3.4 + t, banker), { zoom: M.creep(t, 0.011, 1.7), fx: 640, fy: 400 })
      + b.svg
      + ui.sticker('THE ONE ASSUMPTION', 290, 600, t, b.end + 0.3, { rot: -3, size: 38 });
  },
};

// ---------- 4. the crash (built-up chart, late push toward the fall) ----------
const BIG = { x: 140, y: 70, w: 1000, h: 560, xRange: [2000, 2012.2], yRange: [90, 195] };
const s4 = {
  name: 'the-crash',
  dur: 6.2,
  render(t) {
    const upTo = M.keys(t, [[0.3, 2000], [2.4, 2006.5], [2.9, 2006.5], [3.9, 2012.1]], M.ease.inOut);
    const map = props.chartMap(BIG);
    const world = `<rect width="${W}" height="${H}" fill="${P.wall}"/>`
      + g(`filter="url(#softShadow)"`, props.lineChart({ ...BIG, data: CS, upTo, title: 'U.S. HOME PRICES',
        xLabels: [[2000, '2000'], [2004, '2004'], [2006.5, '2006'], [2009, '2009'], [2012, '2012']] }))
      + ui.sticker('PEAK · JULY 2006', map.px(2006.5), map.py(184.6) - 58, t, 2.4, { size: 28, color: P.ink, rot: 2 })
      + ui.sticker('−27%', map.px(2010.2), map.py(182), t, 4.1, { size: 64, rot: -4, font: 'display' });
    return camera(world, { zoom: M.punch(t, 3.0, { rate: 0.08, dur: 2.5 }), fx: map.px(2009.6), fy: map.py(150) })
      + ui.dateTag('2000 → 2012', t, 0.1)
      + text('S&P/Case-Shiller U.S. National Home Price Index', 1250, 700, { size: 17, anchor: 'end', fill: P.paper, opacity: 0.7 });
  },
};

// ---------- 5. the fuse (signature device; locked-off, built up stop by stop) ----------
const STOPS = [
  { x: 300, year: '2003', title: 'RATES AT 1%', lines: ['Money gets cheap'] },
  { x: 520, year: '2004', title: 'MORE DEBT', lines: ['Banks allowed to', 'borrow more'] },
  { x: 740, year: '2006', title: 'PRICES PEAK', lines: ['Then they stop', 'going up'] },
  { x: 940, year: '2007', title: 'FIRST CRACKS', lines: ['Two Bear Stearns', 'funds collapse'] },
];
const FX0 = 110, FX1 = 1040;
const STOP_K = STOPS.map((s) => (s.x - FX0) / (FX1 - FX0));
const FUSE_OPTS = { burn: 0.72, hold: 0.8 };
const SCHED = dev.fuseSchedule(0.5, STOP_K, FUSE_OPTS);
const s5 = {
  name: 'the-fuse',
  dur: 8.0,
  render(t) {
    const { k, reached } = dev.fuseProgress(t, 0.5, STOP_K, FUSE_OPTS);
    const cards = STOPS.map((s, i) => ui.indexCard({ x: s.x - 105, y: 236, w: 210, h: 124, title: s.title, lines: s.lines, rot: i % 2 ? 2 : -2 }, t, SCHED.stops[i])).join('');
    const board = `<rect width="${W}" height="${H}" fill="${P.woodDark}"/>
      <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${P.board}" stroke="${P.ink}" stroke-width="5"/>
      ${text('THE FUSE', 640, 110, { size: 54, font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.9 })}
      ${text('every point where someone could have cut it', 640, 150, { size: 28, fill: P.paperDim, anchor: 'middle' })}`;
    return board
      + dev.fuse({ x0: FX0, x1: FX1, base: 470, stops: STOPS, end: { label: 'LEHMAN', sub: 'SEPT 2008' }, k, t })
      + cards
      + ui.dateTag('2003 → 2008', t, 0.1)
      + dev.tally('CHANCES TO CUT IT', Math.min(STOPS.length, Math.max(0, reached + 1)), 930, 48, { w: 290 });
  },
};

// ---------- 6. title (locked-off) ----------
const s6 = {
  name: 'title',
  dur: 4.0,
  render(t) {
    return camera(lehmanNight(20), { zoom: 1.07, fx: 640, fy: 420 })
      + `<rect width="${W}" height="${H}" fill="${P.nightDeep}" opacity="0.45"/>`
      + ui.titleCard([[['WHY THE ', false], ['2008 CRASH', true]], [['WAS COMPLETELY AVOIDABLE', false]]], t, 0.2, { y: 250, size: 66 });
  },
};

module.exports = { fps: 24, shots: [s1a, s1b, s2, s3a, s3b, s4, s5, s6] };
