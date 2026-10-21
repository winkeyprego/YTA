// Sample: cold open of "Why the 2008 Crash Was COMPLETELY Avoidable".
// Six shots, ~35s. Facts used are listed in SCRIPT.md with sources to check before publishing.

const P = require('../../lib/palette');
const { g, tr, text, camera, W, H } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const props = require('../../lib/props');
const ui = require('../../lib/ui');
const dev = require('../../lib/devices');

// ---------- shared scene: Lehman HQ at night ----------
function lehmanNight(t, { windowsOff = [1.0, 5.6], walker = true } = {}) {
  const walking = t > 1.6 && t < 5.8;
  const wx = M.tween(t, 1.6, 4.2, 640, 990, M.ease.linear);
  return [
    props.nightSky(3),
    props.skyline(11, 650, { color: '#253247', minH: 140, maxH: 330, lit: 0.04 }),
    props.skyline(5, 660, { color: P.night, minH: 60, maxH: 210, lit: 0.08 }),
    props.tower(520, 96, 240, 556, t, { offFrom: windowsOff[0], offTo: windowsOff[1] }),
    `<rect y="652" width="${W}" height="${H - 652}" fill="#1a222e"/><path d="M0 652 H${W}" stroke="${P.ink}" stroke-width="5"/>
     <path d="M0 690 H${W}" stroke="#2a3444" stroke-width="3" stroke-dasharray="40 30"/>`,
    props.streetLamp(300, 652),
    props.streetLamp(890, 652),
    walker && t > 1.6 ? g(tr(wx, 668, 0.42), character(CAST.banker, { carry: 'box', walk: walking ? t * 9 : null, eyes: 'sad', brows: 'worried', mouth: 'frown' })) : '',
  ].join('');
}

// ---------- 1. cold open ----------
const s1 = {
  name: 'lehman-night',
  dur: 6.2,
  render(t) {
    const world = camera(lehmanNight(t), { zoom: M.tween(t, 0, 6.2, 1, 1.07), fx: 640, fy: 560 });
    return world
      + ui.sticker('LEHMAN BROTHERS', 640, 66, t, 0.9, { rot: -1.5, size: 30, color: P.ink })
      + ui.dateTag('NEW YORK · 15 SEPT 2008 · 1:45 AM', t, 0.15)
      + ui.bigStat('158 YEARS', 'ON WALL STREET', 64, 340, t, 2.3, { size: 70 })
      + ui.sticker('GONE IN ONE NIGHT', 232, 452, t, 3.7, { rot: -3, size: 30 });
  },
};

// ---------- 2. the filing ----------
const s2 = {
  name: 'bankruptcy-filing',
  dur: 5.0,
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
    const sh = M.shake(t, 2.0, 0.35, 7);
    const world = camera(
      props.deskTop(4)
        + `<g filter="url(#softShadow)"><rect x="360" y="70" width="600" height="700" fill="${P.paper}" transform="rotate(-1.5 660 420)"/></g>`
        + `<g transform="rotate(-1.5 660 420)">`
        + ui.highlight(396, 315, 470, t, 0.9, { h: 34 })
        + lines
        + `<path d="M400 112 H900" stroke="${P.ink}" stroke-width="2"/>`
        + `</g>`
        // red pencil and coffee ring on the desk
        + `<g transform="translate(1040 520) rotate(-35)"><rect width="230" height="16" fill="${P.red}" stroke="${P.ink}" stroke-width="3"/><path d="M230 0 L262 8 L230 16 Z" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3"/><path d="M252 5 L262 8 L252 11 Z" fill="${P.ink}"/></g>`
        + `<circle cx="190" cy="180" r="70" fill="none" stroke="#5a3a26" stroke-width="9" opacity=".5"/>`
        + ui.stamp('$613 BILLION IN DEBT', 650, 630, t, 2.0, { rot: -7, size: 48 }),
      { zoom: M.tween(t, 0, 5, 1.0, 1.06), fx: 660, fy: 400, x: sh[0], y: sh[1], rot: M.tween(t, 0, 5, 0, 0.6) },
    );
    return world + ui.sticker('BIGGEST BANKRUPTCY IN U.S. HISTORY', 640, 44, t, 3.1, { rot: 1.5, size: 28, color: P.ink });
  },
};

// ---------- 3. the assumption (2006) ----------
const BUBBLE = { x: 790, y: 168, w: 400, lines: ['House prices never fall.', 'Not nationally. Not ever.'], tail: [722, 372] };
const s3 = {
  name: 'the-assumption',
  dur: 7.4,
  render(t) {
    const b = ui.bubble(BUBBLE, t, 1.7);
    const chart = props.lineChart({
      x: 110, y: 90, w: 330, h: 240, title: 'U.S. HOME PRICES',
      data: CS, xRange: [2000, 2006.6], yRange: [90, 195], upTo: 2006.5,
      xLabels: [[2000, '2000'], [2006, '2006']],
    });
    const point = M.keys(t, [[0, [10, -6]], [0.8, [10, -6]], [1.25, [115, 10]], [4.6, [115, 10]], [5.1, [12, -8]]]);
    const banker = character(CAST.banker, {
      armL: point,
      armR: [12, -8],
      eyes: t < 1.7 ? 'dot' : 'smug',
      look: t > 0.8 && t < 1.7 ? -0.8 : 0,
      brows: t < 1.7 ? 'flat' : 'smug',
      mouth: 'smirk',
      talk: M.talking(t, 2.0, b.end),
      blink: t < 1.7 && M.blinking(t, 2),
      breathe: M.breathe(t),
      tilt: M.keys(t, [[1.6, 0], [2.0, -4], [b.end, -4], [b.end + 0.4, 0]]),
    });
    const world = props.office()
      + props.windowCity(830, 70)
      + props.clock(570, 110, t, { hour: 4 })
      + g(`transform="translate(0 0) rotate(-1.5 275 210)" filter="url(#shadow)"`, chart)
      + g(tr(680, 612), banker)
      + props.desk(380, 470)
      + props.paperStack(440, 446, 'AAA')
      + props.phone(790, 446)
      + b.svg
      + ui.sticker('THE ONE ASSUMPTION', 330, 392, t, b.end + 0.35, { rot: -3, size: 30 });
    return camera(world, { zoom: M.tween(t, 0, 7.4, 1.0, 1.08), fx: 650, fy: 330 })
      + ui.dateTag('NEW YORK · SPRING 2006', t, 0.15)
      + ui.namePlate('A Wall Street Banker', 'Mortgage desk', t, 0.6);
  },
};

// S&P/Case-Shiller U.S. National Home Price Index (NSA, Jan 2000 = 100), approximate path.
const CS = [[2000, 100], [2001, 108], [2002, 116], [2003, 127], [2004, 141], [2005, 160], [2006.5, 184.6],
  [2007, 182], [2007.5, 178], [2008, 170], [2008.5, 165], [2009, 150], [2009.5, 147], [2010, 146],
  [2010.5, 147], [2011, 140], [2011.5, 140], [2012.1, 134]];

// ---------- 4. the crash ----------
const BIG = { x: 140, y: 70, w: 1000, h: 560, xRange: [2000, 2012.2], yRange: [90, 195] };
const s4 = {
  name: 'the-crash',
  dur: 6.0,
  render(t) {
    const upTo = M.keys(t, [[0.3, 2000], [2.5, 2006.5], [3.0, 2006.5], [4.0, 2012.1]], M.ease.inOut);
    const map = props.chartMap(BIG);
    const sh = M.shake(t, 3.2, 0.7, 7);
    const world = `<rect width="${W}" height="${H}" fill="${P.wall}"/>`
      + g(`filter="url(#softShadow)"`, props.lineChart({ ...BIG, data: CS, upTo, title: 'U.S. HOME PRICES',
        xLabels: [[2000, '2000'], [2004, '2004'], [2006.5, '2006'], [2009, '2009'], [2012, '2012']] }))
      + (t > 2.5 ? ui.sticker('PEAK · JULY 2006', map.px(2006.5), map.py(184.6) - 58, t, 2.5, { size: 24, color: P.ink, rot: 2 }) : '')
      + ui.sticker('−27%', map.px(2010.2), map.py(182), t, 4.1, { size: 60, rot: -4 });
    return camera(world, { zoom: M.tween(t, 0, 6, 1.0, 1.04), fx: 640, fy: 360, x: sh[0], y: sh[1] })
      + ui.dateTag('2000 → 2012', t, 0.1)
      + text('S&P/Case-Shiller U.S. National Home Price Index', 1250, 700, { size: 17, anchor: 'end', fill: P.ink, opacity: 0.6 });
  },
};

// ---------- 5. the fuse ----------
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
    const sh = M.shake(t, SCHED.end, 0.6, 9);
    const board = `<rect width="${W}" height="${H}" fill="${P.woodDark}"/>
      <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${P.board}" stroke="${P.ink}" stroke-width="5"/>
      ${text('THE FUSE', 640, 110, { size: 54, font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.9 })}
      ${text('every point where someone could have cut it', 640, 150, { size: 28, fill: P.paperDim, anchor: 'middle' })}`;
    const world = board
      + dev.fuse({ x0: FX0, x1: FX1, base: 470, stops: STOPS, end: { label: 'LEHMAN', sub: 'SEPT 2008' }, k, t })
      + cards;
    return camera(world, { zoom: M.tween(t, 0, 8, 1.0, 1.03), fx: 640, fy: 420, x: sh[0], y: sh[1] })
      + ui.dateTag('2003 → 2008', t, 0.1)
      + dev.tally('CHANCES TO CUT IT', Math.max(0, reached + 1), 930, 48, { w: 290 });
  },
};

// ---------- 6. title ----------
const s6 = {
  name: 'title',
  dur: 4.4,
  render(t) {
    const world = camera(lehmanNight(6.2 + t, { walker: false }), { zoom: M.tween(t, 0, 4.4, 1.07, 1.1), fx: 640, fy: 560 });
    return world
      + `<rect width="${W}" height="${H}" fill="${P.nightDeep}" opacity="${M.tween(t, 0, 0.5, 0, 0.45)}"/>`
      + ui.titleCard([[['WHY THE ', false], ['2008 CRASH', true]], [['WAS COMPLETELY AVOIDABLE', false]]], t, 0.25, { y: 250, size: 66 });
  },
};

module.exports = { fps: 24, shots: [s1, s2, s3, s4, s5, s6] };
