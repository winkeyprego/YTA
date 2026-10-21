// Sets: ready-made backgrounds that most money/business scripts can be staged on.
//
// Every set has the same interface (templates rely on it):
//   draw(t, opts)  -> background SVG (everything behind the characters)
//   front(t, opts) -> foreground SVG drawn AFTER the characters (desk, podium, table...) or ''
//   spots          -> { farLeft, left, center, right, farRight, ...extra }: [x, y, scale] = feet position + character
//                     scale for the wide framing. Spots behind furniture are placed so the furniture in front()
//                     covers the legs/lower body.
//   close          -> { fx, fy, zoom }: default close-up framing on the center spot (pass to camera()).
//   mood           -> 'day' | 'night'
//
// Usage: SETS.office.draw(t, o) + character at spot + SETS.office.front(t, o), all inside camera().

const P = require('./palette');
const { n, text, W, H } = require('./svg');
const { rng } = require('./motion');
const props = require('./props');
const { crowd, character, CAST } = require('./characters');
const money = require('./money');

// Derived tints used only by sets (muted, on-palette blends). Candidates to move into palette.js.
const T = {
  skyDay: '#cdd6d3',
  skyDayTop: '#b4c3c1',
  stone: '#d9cfb8',
  stoneDark: '#b8ac92',
  wallWarm: '#cdb994',
  wallWarmDark: '#b39f7b',
  panel: '#5e4030',
  industrial: '#7d8580',
  studio: '#22304a',
};

const o = (w = 4) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;
const pool = (x, y, rx, ry, op = 0.16, color = P.windowLit) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${op}" filter="url(#glow)"/>`;
const daySky = (id = 'skyD') => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.skyDayTop}"/><stop offset="1" stop-color="${T.skyDay}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
const clouds = (seed) => {
  const r = rng(seed);
  return Array.from({ length: 4 }, () => {
    const x = r() * W, y = 40 + r() * 140, s = 0.6 + r() * 0.7;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" opacity=".85"><ellipse cx="0" cy="0" rx="70" ry="24" fill="#eef0ea"/><ellipse cx="-34" cy="-14" rx="34" ry="22" fill="#eef0ea"/><ellipse cx="26" cy="-18" rx="40" ry="26" fill="#eef0ea"/></g>`;
  }).join('');
};
const woodPanels = (y0, y1, color = T.panel) => {
  let s = `<rect y="${y0}" width="${W}" height="${y1 - y0}" fill="${color}"/>`;
  for (let x = 0; x < W; x += 160) s += `<rect x="${x + 14}" y="${y0 + 18}" width="132" height="${y1 - y0 - 36}" fill="none" stroke="${P.woodDark}" stroke-width="3" opacity=".6"/>`;
  return s;
};
const frameOnWall = (x, y, w, h, inner = '') => `<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.woodMid}" ${o(3)}/><rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2"/>${inner}</g>`;

// Default wall chart for the office: a small rising line on paper.
const smallChart = () => props.lineChart({ x: 110, y: 90, w: 330, h: 240, title: 'Q3 RESULTS', data: [[0, 2], [1, 3], [2, 2.6], [3, 4], [4, 5.2]], xRange: [0, 4], yRange: [1, 6], color: P.green });

const SETS = {
  // ------------------------------------------------------------------ office
  office: {
    mood: 'day',
    draw(t, { chart, hour = 4 } = {}) {
      return props.office()
        + props.windowCity(830, 70)
        + props.clock(570, 110, t, { hour })
        + `<g transform="rotate(-1.5 275 210)" filter="url(#shadow)">${chart != null ? chart : smallChart()}</g>`
        + props.plant(1210, 600, { s: 0.9 });
    },
    front() {
      return props.desk(380, 470) + props.paperStack(440, 446) + props.phone(790, 446);
    },
    spots: { farLeft: [90, 660, 0.95], left: [260, 650, 1], center: [680, 612, 1], right: [1060, 660, 1], farRight: [1190, 668, 0.95] },
    close: { fx: 680, fy: 400, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ boardroom
  boardroom: {
    mood: 'day',
    draw(t, { screen } = {}) {
      const chairs = [250, 450, 640, 830, 1030].map((x) => props.chair(x, 520, { w: 96, back: 110, color: P.charcoal })).join('');
      return `<rect width="${W}" height="${H}" fill="${P.wallDark}"/>`
        + woodPanels(420, 720)
        + props.windowCity(380, 50, 520, 300)
        + `<g filter="url(#shadow)">${props.tv(70, 90, 240, 150, screen != null ? screen : money.stockBars([3, 4, 3.4, 5, 4.2, 6], t, -2, { x: 0, y: 0, w: 224, h: 134, bare: true }))}</g>`
        + props.plant(1180, 470, { s: 1 })
        + chairs;
    },
    front() {
      return `<g>
        <path d="M140 528 H1140 L1200 612 H80 Z" fill="${P.woodMid}" ${o(4)}/>
        <path d="M80 612 H1200 V640 H80 Z" fill="${P.woodDark}" ${o(4)}/>
        ${[300, 520, 760, 980].map((x) => `<rect x="${x}" y="548" width="54" height="36" fill="${P.paper}" stroke="${P.ink}" stroke-width="2" transform="rotate(-6 ${x + 27} 566)"/>`).join('')}
        <rect x="610" y="538" width="60" height="20" rx="4" fill="${P.ink}"/>
      </g>`;
    },
    spots: { farLeft: [250, 620, 0.9], left: [450, 620, 0.9], center: [640, 620, 0.9], right: [830, 620, 0.9], farRight: [1030, 620, 0.9] },
    close: { fx: 640, fy: 420, zoom: 1.8 },
  },

  // ------------------------------------------------------------------ trading floor
  tradingFloor: {
    mood: 'day',
    draw(t) {
      const backDesks = [0, 1, 2, 3, 4, 5].map((i) => {
        const x = 70 + i * 200;
        return `<rect x="${x}" y="420" width="180" height="40" fill="${P.woodMid}" ${o(3)}/>`
          + props.monitor(x + 20, 360, 60, 40, t, { seed: i + 3, kind: i % 2 ? 'bars' : 'line', glow: false })
          + props.monitor(x + 100, 360, 60, 40, t, { seed: i + 9, kind: 'bars', glow: false });
      }).join('');
      return `<rect width="${W}" height="${H}" fill="#4e5a63"/>`
        + `<rect y="470" width="${W}" height="250" fill="${P.floor}"/>`
        + money.tickerBoard(40, 40, 1200, 120, t)
        + crowd(21, 1, 9, 60, 410, 1160, 0, 0.26)
        + backDesks
        + pool(640, 260, 520, 80, 0.08, P.blue);
    },
    front(t) {
      const mons = [[400, 'bars', 2], [500, 'line', 5], [780, 'bars', 7], [880, 'line', 8]];
      return `<g>
        <rect x="-10" y="560" width="${W + 20}" height="34" fill="${P.woodMid}" ${o(4)}/>
        <rect x="-10" y="594" width="${W + 20}" height="130" fill="${P.woodDeep}" ${o(4)}/>
        ${mons.map(([x, k, s]) => props.monitor(x, 470, 100, 66, t, { seed: s, kind: k })).join('')}
        <rect x="140" y="540" width="60" height="22" rx="4" fill="${P.ink}"/><rect x="1080" y="540" width="60" height="22" rx="4" fill="${P.ink}"/>
      </g>`;
    },
    spots: { farLeft: [90, 650, 0.95], left: [270, 660, 1], center: [640, 660, 1], right: [1010, 660, 1], farRight: [1190, 650, 0.95] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ bank exterior (day)
  bankExterior: {
    mood: 'day',
    draw(t, { name = 'NATIONAL BANK' } = {}) {
      const cols = [0, 1, 2, 3, 4, 5].map((i) => props.column(330 + i * 124, 310, 560, { w: 56, color: T.stone })).join('');
      return daySky() + clouds(5)
        + props.skyline(31, 600, { color: '#a4adab', minH: 120, maxH: 300, lit: 0 })
        + `<path d="M250 250 L640 120 L1030 250 Z" fill="${T.stone}" ${o(4)}/><path d="M330 236 L640 140 L950 236 Z" fill="none" stroke="${T.stoneDark}" stroke-width="3"/>`
        + `<rect x="250" y="250" width="780" height="60" fill="${T.stone}" ${o(4)}/>`
        + text(name, 640, 294, { size: 40, font: 'display', fill: P.ink, anchor: 'middle', spacing: 4 })
        + `<rect x="270" y="310" width="740" height="250" fill="${T.stoneDark}" ${o(4)}/>`
        + `<rect x="580" y="400" width="120" height="160" fill="${P.woodDark}" ${o(4)}/><path d="M640 400 V560" stroke="${P.ink}" stroke-width="3"/><circle cx="628" cy="490" r="5" fill="${P.gold}"/><circle cx="652" cy="490" r="5" fill="${P.gold}"/>`
        + cols
        + `<rect x="250" y="250" width="780" height="60" fill="${T.stone}" ${o(4)}/>` + text(name, 640, 294, { size: 40, font: 'display', fill: P.ink, anchor: 'middle', spacing: 4 })
        + [0, 1, 2].map((i) => `<rect x="${230 - i * 20}" y="${560 + i * 20}" width="${820 + i * 40}" height="20" fill="${T.stone}" ${o(3)}/>`).join('')
        + `<rect y="620" width="${W}" height="100" fill="#9c9a90"/><path d="M0 620 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + `<path d="M0 690 H${W}" stroke="#8a887f" stroke-width="3"/>`
        + props.flagPole(150, 620, { h: 360, wave: t * 2 }) + props.streetLamp(1110, 620, { on: false });
    },
    front: () => '',
    spots: { farLeft: [120, 700, 0.8], left: [330, 700, 0.85], center: [640, 700, 0.85], right: [950, 700, 0.85], farRight: [1160, 700, 0.8] },
    close: { fx: 640, fy: 520, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ tower at night
  towerNight: {
    mood: 'night',
    draw(t, { name, darkFrom, darkTo } = {}) {
      return props.nightSky(3)
        + props.skyline(11, 650, { color: '#253247', minH: 140, maxH: 330, lit: 0.04 })
        + props.skyline(5, 660, { color: P.night, minH: 60, maxH: 210, lit: 0.08 })
        + props.tower(520, 96, 240, 556, t, darkFrom != null ? { offFrom: darkFrom, offTo: darkTo ?? darkFrom + 5 } : { offFrom: 1e9, offTo: 1e9 + 1 })
        + (name ? `<g filter="url(#shadow)"><rect x="${n(640 - name.length * 9 - 20)}" y="48" width="${n(name.length * 18 + 40)}" height="40" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>${text(name, 640, 77, { size: 28, font: 'display', anchor: 'middle' })}</g>` : '')
        + `<rect y="652" width="${W}" height="${H - 652}" fill="#1a222e"/><path d="M0 652 H${W}" stroke="${P.ink}" stroke-width="5"/>
           <path d="M0 690 H${W}" stroke="#2a3444" stroke-width="3" stroke-dasharray="40 30"/>`
        + props.streetLamp(300, 652) + props.streetLamp(890, 652);
    },
    front: () => '',
    spots: { farLeft: [200, 668, 0.42], left: [420, 668, 0.42], center: [640, 668, 0.42], right: [860, 668, 0.42], farRight: [1080, 668, 0.42] },
    close: { fx: 700, fy: 560, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ street, day
  streetDay: {
    mood: 'day',
    draw(t, { signs = ['BAKERY', 'PAWN', 'DINER'] } = {}) {
      return daySky('skyS') + clouds(8)
        + props.skyline(17, 360, { color: '#a4adab', minH: 80, maxH: 220, lit: 0 })
        + `<rect y="340" width="${W}" height="260" fill="${T.wallWarmDark}"/>`
        + props.shopFront(40, 600, { w: 360, h: 270, color: P.red, sign: signs[0] })
        + props.shopFront(460, 600, { w: 360, h: 270, color: P.green, sign: signs[1] })
        + props.shopFront(880, 600, { w: 360, h: 270, color: P.blue, sign: signs[2] })
        + `<rect y="600" width="${W}" height="60" fill="#b8b3a6"/><path d="M0 600 H${W} M0 660 H${W}" stroke="${P.ink}" stroke-width="4"/>
           <rect y="660" width="${W}" height="60" fill="#55585a"/><path d="M0 692 H${W}" stroke="${P.paperDim}" stroke-width="4" stroke-dasharray="44 34"/>`
        + props.streetLamp(430, 600, { on: false }) + props.streetLamp(850, 600, { on: false });
    },
    front: () => '',
    spots: { farLeft: [110, 652, 0.75], left: [300, 652, 0.8], center: [640, 652, 0.8], right: [980, 652, 0.8], farRight: [1170, 652, 0.75] },
    close: { fx: 640, fy: 480, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ home / living room
  home: {
    mood: 'day',
    draw(t, { tvContent } = {}) {
      let stripes = '';
      for (let x = 0; x < W; x += 48) stripes += `<rect x="${x}" y="0" width="22" height="470" fill="${T.wallWarmDark}" opacity=".35"/>`;
      const tvIn = tvContent != null ? tvContent : `<rect width="234" height="134" fill="${P.navy}"/>${money.stockBars([5, 4.4, 4.8, 3.6, 2.8, 2], t, -2, { x: 10, y: 20, w: 214, h: 104, bare: true, color: P.red })}`;
      return `<rect width="${W}" height="${H}" fill="${T.wallWarm}"/>${stripes}
        <rect y="470" width="${W}" height="10" fill="${P.woodMid}"/>
        <rect y="480" width="${W}" height="240" fill="${P.wood}"/>
        <path d="M0 540 H${W} M0 610 H${W} M0 680 H${W}" stroke="${P.woodMid}" stroke-width="3"/>
        <g transform="translate(110 70)"><rect width="250" height="230" fill="#d9e2df" ${o(8)}/><path d="M125 0 V230 M0 115 H250" stroke="${P.ink}" stroke-width="6"/>
          <path d="M-30 -14 H40 Q20 120 46 250 H-30 Z M280 -14 H210 Q230 120 204 250 H280 Z" fill="${P.red}" ${o(3)}/></g>
        ${frameOnWall(560, 110, 150, 110, `<path d="M580 200 L620 150 L650 180 L670 160 L690 200 Z" fill="${P.green}"/>`)}
        ${props.couch(450, 610, { w: 380, color: P.blue })}
        ${props.tv(930, 300, 250, 150, tvIn)}
        <g><path d="M396 610 V430" stroke="${P.ink}" stroke-width="5"/><path d="M366 430 H426 L410 380 H382 Z" fill="${P.paper}" ${o(3)}/></g>
        ${pool(396, 420, 80, 60, 0.22)}`;
    },
    front: () => '',
    spots: { farLeft: [120, 680, 0.95], left: [340, 670, 0.95], center: [640, 670, 0.95], right: [940, 690, 0.95], farRight: [1170, 690, 0.95] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ hearing hall (congress / parliament)
  hall: {
    mood: 'day',
    draw(t) {
      return `<rect width="${W}" height="${H}" fill="${T.panel}"/>`
        + woodPanels(0, 420, '#6b4a36')
        + `<circle cx="640" cy="120" r="70" fill="${P.navy}" stroke="${P.gold}" stroke-width="8"/><circle cx="640" cy="120" r="34" fill="${P.gold}" stroke="${P.ink}" stroke-width="3"/>`
        + props.flagPole(470, 300, { h: 250, wave: t * 1.5 }) + props.flagPole(810, 300, { h: 250, kind: 'plain', color: P.blue, wave: t * 1.5 + 1 })
        + crowd(13, 1, 9, 120, 330, 1040, 0, 0.27)
        + `<rect x="80" y="300" width="1120" height="90" fill="${P.woodMid}" ${o(4)}/><rect x="80" y="300" width="1120" height="16" fill="${P.wood}" ${o(3)}/>`
        + `<rect y="390" width="${W}" height="330" fill="${P.floor}"/>`
        + crowd(29, 3, 4, 0, 450, 300, 150, 0.3)
        + crowd(37, 3, 4, 980, 450, 300, 150, 0.3)
        + pool(640, 300, 500, 60, 0.12);
    },
    front() {
      return `<g>
        <rect x="380" y="560" width="520" height="30" fill="${P.woodMid}" ${o(4)}/>
        <rect x="390" y="590" width="500" height="110" fill="${P.woodDeep}" ${o(4)}/>
        <rect x="420" y="606" width="440" height="78" fill="none" stroke="${P.woodDark}" stroke-width="3"/>
        ${[520, 760].map((x) => `<path d="M${x} 560 L${x + 16} 520" stroke="${P.ink}" stroke-width="4"/><circle cx="${x + 18}" cy="516" r="7" fill="${P.ink}"/>`).join('')}
        <rect x="600" y="540" width="80" height="22" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>
      </g>`;
    },
    spots: { farLeft: [200, 715, 0.8], left: [510, 640, 0.9], center: [640, 640, 0.9], right: [770, 640, 0.9], farRight: [1080, 715, 0.8] },
    close: { fx: 640, fy: 450, zoom: 1.8 },
  },

  // ------------------------------------------------------------------ courtroom
  courtroom: {
    mood: 'day',
    // The judge belongs to the set (drawn behind the bench, in the background layer), so people on the
    // floor spots can stand in front of the bench. opts.judge = cast spec (default CAST.judge) or false,
    // opts.judgeState = character state for the judge (e.g. { brows: 'angry', armR: [150, 20] }).
    draw(t, { judge, judgeState = {} } = {}) {
      const judgeSpec = judge === false ? null : (judge || CAST.judge);
      return `<rect width="${W}" height="${H}" fill="${T.wallWarm}"/>`
        + woodPanels(260, 720)
        + props.column(140, 40, 520, { w: 50, color: T.stone }) + props.column(1140, 40, 520, { w: 50, color: T.stone })
        + `<circle cx="640" cy="110" r="60" fill="${P.navy}" stroke="${P.gold}" stroke-width="7"/><path d="M610 110 H670 M640 84 V136 M616 96 L604 124 H628 Z M664 96 L652 124 H676 Z" stroke="${P.gold}" stroke-width="4" fill="none"/>`
        + props.flagPole(880, 420, { h: 260, wave: t * 1.3 })
        + `<rect y="520" width="${W}" height="200" fill="${P.floor}"/>`
        + (judgeSpec ? `<g transform="translate(640 420) scale(0.75)">${character(judgeSpec, { breathe: 1, ...judgeState })}</g>` : '')
        + `<rect x="440" y="300" width="400" height="30" fill="${P.wood}" ${o(4)}/><rect x="450" y="330" width="380" height="190" fill="${P.woodMid}" ${o(4)}/>
        <rect x="480" y="356" width="320" height="130" fill="none" stroke="${P.woodDark}" stroke-width="3"/>
        <g transform="translate(560 300) rotate(-20)"><rect x="-6" y="-46" width="12" height="40" rx="3" fill="${P.woodDark}"/><rect x="-24" y="-60" width="48" height="22" rx="6" fill="${P.woodDark}" ${o(3)}/></g>`;
    },
    front() {
      return `<g>
        <rect x="900" y="510" width="200" height="24" fill="${P.wood}" ${o(4)}/><rect x="910" y="534" width="180" height="150" fill="${P.woodMid}" ${o(4)}/>
        <rect x="140" y="590" width="300" height="24" fill="${P.wood}" ${o(4)}/><rect x="150" y="614" width="280" height="90" fill="${P.woodDeep}" ${o(4)}/>
        <rect x="200" y="572" width="70" height="20" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>
      </g>`;
    },
    // judge: where the set's own judge stands (informational; it is drawn by draw()).
    spots: { judge: [640, 420, 0.75], farLeft: [80, 710, 0.85], left: [290, 690, 0.9], center: [640, 700, 0.9], right: [1000, 650, 0.85], farRight: [1190, 710, 0.85] },
    close: { fx: 640, fy: 500, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ factory
  factory: {
    mood: 'day',
    draw(t) {
      let ribs = '';
      for (let x = 0; x < W; x += 30) ribs += `<path d="M${x} 0 V440" stroke="#6f7772" stroke-width="3"/>`;
      return `<rect width="${W}" height="${H}" fill="${T.industrial}"/>${ribs}
        ${[120, 440, 760, 1080].map((x) => `<rect x="${x}" y="50" width="200" height="110" fill="#c9d0cc" ${o(5)}/><path d="M${x + 100} 50 V160 M${x} 105 H${x + 200}" stroke="${P.ink}" stroke-width="4"/>`).join('')}
        ${pool(640, 140, 600, 70, 0.12, '#fff')}
        <rect y="440" width="${W}" height="280" fill="#5d625f"/><path d="M0 440 H${W}" stroke="${P.ink}" stroke-width="5"/>
        <path d="M0 520 L${W} 520" stroke="${P.gold}" stroke-width="6" stroke-dasharray="30 24" opacity=".6"/>
        ${props.machine(40, 500, t, { seed: 1 })}${props.machine(980, 500, t, { w: 220, seed: 4, color: '#4f5e66' })}`;
    },
    front(t) {
      return props.conveyor(330, 560, 620, t);
    },
    spots: { farLeft: [120, 690, 0.85], left: [300, 670, 0.9], center: [640, 690, 0.9], right: [1000, 670, 0.9], farRight: [1180, 690, 0.85] },
    close: { fx: 640, fy: 470, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ TV news studio
  studioNews: {
    mood: 'night',
    draw(t, { screen, headline = 'BREAKING NEWS' } = {}) {
      const scr = screen != null ? screen : money.stockBars([6, 5.4, 5.8, 4, 3, 1.8], t, -2, { x: 0, y: 0, w: 440, h: 240, bare: true, color: P.red });
      return `<rect width="${W}" height="${H}" fill="${T.studio}"/>
        ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 150 - 20}" y="0" width="70" height="720" fill="#2a3a58" opacity=".6"/>`).join('')}
        ${pool(420, 300, 360, 220, 0.12, P.blue)}
        <g filter="url(#softShadow)"><rect x="730" y="70" width="470" height="270" rx="8" fill="#141c28" ${o(5)}/><g transform="translate(745 85)">${scr}</g></g>
        <rect x="730" y="350" width="470" height="44" fill="${P.red}" ${o(3)}/>${text(headline, 965, 382, { size: 30, font: 'display', fill: P.paper, anchor: 'middle' })}
        <rect y="560" width="${W}" height="160" fill="#18202e"/>`;
    },
    front() {
      return `<g>
        <path d="M120 540 Q480 520 860 540 L880 700 Q480 680 100 700 Z" fill="${P.navy}" ${o(4)}/>
        <path d="M120 540 Q480 520 860 540 L862 562 Q480 542 118 562 Z" fill="${P.greyLight}" ${o(3)}/>
        <rect x="380" y="600" width="200" height="40" fill="${P.red}" ${o(3)}/>${text('NEWS', 480, 630, { size: 30, font: 'display', fill: P.paper, anchor: 'middle' })}
      </g>`;
    },
    spots: { farLeft: [80, 700, 0.9], left: [260, 640, 0.95], center: [480, 640, 0.95], right: [700, 640, 0.95], farRight: [1100, 700, 0.9] },
    close: { fx: 480, fy: 420, zoom: 1.7 },
  },
};

// History/places sets live in lib/sets-history.js (same interface); merged here so every episode sees one registry.
try { Object.assign(SETS, require('./sets-history').SETS); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }

module.exports = { SETS, pool };
