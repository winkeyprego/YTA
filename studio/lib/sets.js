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
const { n, g, tr, text, textWidth, W, H } = require('./svg');
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
  nightFar: '#253247',     // far night skyline (as towerNight)
  // newer sets (stage, wedding garden, resort, data centre, car, classroom, podcast, airport gate, prison)
  stageWall: '#3d4656',   // slate stage backdrop (navy lifted toward wallTrim)
  stageDrape: '#47516a',
  house: '#2a303a',       // dark auditorium floor
  duskTop: '#5d5a72',     // dusk sky: nightMid warmed toward blush
  duskLow: '#d4a585',
  sea: '#7f9ea3',         // muted coastal sea (blue lightened toward wall)
  seaDeep: '#5f8590',
  stucco: '#e2d3b5',      // villa wall (stone, lighter)
  terracotta: '#a8644a',  // roof tiles (red muted toward wood)
  shutter: '#6f8a8a',
  lawn: '#8b9a6b',
  lawnDark: '#76865a',
  cypress: '#4f6a4a',
  tropTop: '#9fbfc4',     // tropical day sky
  tropLow: '#dfe3d3',
  island: '#6f8f7f',
  tile: '#d8c9a8',        // balcony stone tiles
  tileLine: '#c2b28f',
  dcWall: '#1f2835',      // data centre (nightDeep lifted)
  dcCeil: '#171e29',
  dcFloor: '#4f5a66',
  dcFloorLine: '#3f4954',
  carInt: '#232831',      // car interior at night
  seat: '#4a4f5c',
  seatDark: '#383d48',
  silhouette: '#151b24',
  carpet: '#5a6470',      // airport carpet
  tarmac: '#8d918c',
  land: '#8f9a8a',
  overcastTop: '#a9b1b0', // flat daylight sky for the prison
  overcast: '#c8ccc6',
  hill: '#9aa395',
  concrete: '#b9b4a8',
  concreteDark: '#9d988c',
  gravel: '#a39c8e',
  podWall: '#3f4a4f',     // podcast studio wall + acoustic foam
  foamA: '#4c5660',
  foamB: '#5c5048',
  nightWall: '#5c6862',   // office at night (wall / wallDark / floor dimmed)
  nightWallDark: '#4b5651',
  nightFloor: '#4d4136',
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

const grad = (id, top, low) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${low}"/></linearGradient></defs>`;

// Word-wrap a headline into centred lines that fit a box (used on TV / studio screens).
function screenText(str, w, h, { size = 40, font = 'display', fill = P.paper, maxLines = 3 } = {}) {
  let sz = size, lines;
  for (;;) {
    lines = [];
    String(str).toUpperCase().split(/\s+/).forEach((word) => {
      const cur = lines[lines.length - 1];
      if (cur && textWidth(cur + ' ' + word, sz, font) <= w * 0.88) lines[lines.length - 1] = cur + ' ' + word;
      else lines.push(word);
    });
    const widest = Math.max(...lines.map((l) => textWidth(l, sz, font)));
    if ((lines.length <= maxLines && widest <= w * 0.9 && lines.length * sz * 1.1 <= h * 0.8) || sz <= 12) break;
    sz -= 2;
  }
  const y0 = h / 2 - ((lines.length - 1) * sz * 1.1) / 2 + sz * 0.36;
  return lines.map((l, i) => text(l, w / 2, y0 + i * sz * 1.1, { size: sz, font, fill, anchor: 'middle' })).join('');
}

// Neutral TV content (no finance): a headline card if given, else a calm landscape programme. w,h = screen box.
function neutralScreen(w, h, t, headline) {
  if (headline) {
    return `<rect width="${w}" height="${h}" fill="${P.navy}"/><rect y="${n(h - 10)}" width="${w}" height="10" fill="${P.red}"/>`
      + screenText(headline, w, h - 10, { size: Math.min(44, h * 0.3) });
  }
  const cx = (t * 6) % (w + 120) - 60;
  return `<rect width="${w}" height="${h}" fill="${P.blue}"/>
    <circle cx="${n(w * 0.75)}" cy="${n(h * 0.3)}" r="${n(h * 0.12)}" fill="${P.windowLit}" opacity=".9"/>
    <g opacity=".8"><ellipse cx="${n(cx)}" cy="${n(h * 0.22)}" rx="${n(w * 0.1)}" ry="${n(h * 0.06)}" fill="${P.greyLight}"/></g>
    <path d="M0 ${n(h * 0.7)} Q${n(w * 0.25)} ${n(h * 0.45)} ${n(w * 0.5)} ${n(h * 0.66)} T${w} ${n(h * 0.6)} V${h} H0 Z" fill="${P.green}"/>
    <path d="M0 ${n(h * 0.85)} Q${n(w * 0.4)} ${n(h * 0.7)} ${w} ${n(h * 0.82)} V${h} H0 Z" fill="${P.greenDark}"/>`;
}

// Neutral studio wall-screen: a slowly turning globe, or a headline if given.
function globeScreen(w, h, t, headline) {
  if (headline) return `<rect width="${w}" height="${h}" fill="${P.navy}"/>${screenText(headline, w, h, { size: 56 })}`;
  const cx = w / 2, cy = h / 2, R = h * 0.38;
  const mer = [0, 1, 2, 3].map((i) => { const k = Math.cos(((t * 12 + i * 45) % 180) * Math.PI / 180); return `<ellipse cx="${cx}" cy="${cy}" rx="${n(Math.abs(k) * R)}" ry="${n(R)}" fill="none" stroke="${P.greyLight}" stroke-width="2" opacity=".6"/>`; }).join('');
  const par = [-0.5, 0, 0.5].map((f) => `<path d="M${n(cx - R * Math.sqrt(1 - f * f))} ${n(cy + f * R)} H${n(cx + R * Math.sqrt(1 - f * f))}" stroke="${P.greyLight}" stroke-width="2" opacity=".6"/>`).join('');
  return `<rect width="${w}" height="${h}" fill="${P.nightMid}"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${n((i + 0.5) * h / 6)} H${w}" stroke="${P.blue}" stroke-width="1.5" opacity=".35"/>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="${n(R + 18)}" fill="${P.blue}" opacity=".25" filter="url(#glow)"/>
    <circle cx="${cx}" cy="${cy}" r="${n(R)}" fill="${P.blue}" stroke="${P.greyLight}" stroke-width="3"/>${mer}${par}`;
}

// A looping band of night buildings for moving windows (car, train). Pure in t: x offset = t * speed.
function scrollingCity(t, { seed = 4, speed = 40, base = 360, minH = 60, maxH = 200, minW = 60, maxW = 130, color = P.night, lit = 0.25, tile = 1600 } = {}) {
  const r = rng(seed);
  let x = 0, band = '';
  while (x < tile) {
    const bw = Math.min(minW + r() * (maxW - minW), tile - x);
    const bh = minH + r() * (maxH - minH);
    band += `<rect x="${n(x)}" y="${n(base - bh)}" width="${n(bw - 4)}" height="${n(bh)}" fill="${color}"/>`;
    for (let wy = base - bh + 12; wy < base - 12; wy += 20) for (let wx = x + 8; wx < x + bw - 14; wx += 16) {
      if (r() < lit) band += `<rect x="${n(wx)}" y="${n(wy)}" width="7" height="10" fill="${P.windowLit}" opacity=".8"/>`;
    }
    x += bw;
  }
  const off = -((t * speed) % tile);
  return `<g transform="translate(${n(off)} 0)">${band}<g transform="translate(${tile} 0)">${band}</g></g>`;
}

const SETS = {
  // ------------------------------------------------------------------ office
  office: {
    mood: 'day',
    // opts.night: dark window with a lit skyline, dimmer walls and a desk lamp (light pool on desk and wall).
    draw(t, { chart, hour, night = false } = {}) {
      const room = night ? props.office({ wall: T.nightWall, wallDark: T.nightWallDark, floor: T.nightFloor }) : props.office();
      return room
        + props.windowCity(830, 70, 360, 330, { night })
        + props.clock(570, 110, t, { hour: hour ?? (night ? 11 : 4) })
        + `<g transform="rotate(-1.5 275 210)" filter="url(#shadow)">${chart != null ? chart : smallChart()}</g>`
        + props.plant(1210, 600, { s: 0.9 })
        + (night ? `<rect width="${W}" height="${H}" fill="${P.nightDeep}" opacity=".3"/>` + pool(800, 400, 330, 170, 0.2) : '');
    },
    front(t, { night = false } = {}) {
      return props.desk(380, 470) + props.paperStack(440, 446) + props.phone(760, 446)
        + (night ? props.deskLamp(880, 470) + pool(800, 468, 170, 26, 0.35) : '');
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
    // opts: tvContent (raw SVG, 234x134 box) > finance: true (falling red bars) > tvHeadline (text card) > neutral programme.
    draw(t, { tvContent, tvHeadline, finance = false } = {}) {
      let stripes = '';
      for (let x = 0; x < W; x += 48) stripes += `<rect x="${x}" y="0" width="22" height="470" fill="${T.wallWarmDark}" opacity=".35"/>`;
      const tvIn = tvContent != null ? tvContent
        : finance ? `<rect width="234" height="134" fill="${P.navy}"/>${money.stockBars([5, 4.4, 4.8, 3.6, 2.8, 2], t, -2, { x: 10, y: 20, w: 214, h: 104, bare: true, color: P.red })}`
          : neutralScreen(234, 134, t, tvHeadline);
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
    // opts.neutral: no flags or seal (wall lamps instead), so it reads as a generic auditorium / meeting room.
    draw(t, { neutral = false } = {}) {
      const sconce = (x) => `<path d="M${x - 10} 150 H${x + 10} L${x + 6} 186 H${x - 6} Z" fill="${P.goldDark}" ${o(3)}/><path d="M${x - 22} 150 L${x - 14} 118 H${x + 14} L${x + 22} 150 Z" fill="${P.paper}" ${o(3)}/>${pool(x, 150, 70, 60, 0.22)}`;
      return `<rect width="${W}" height="${H}" fill="${T.panel}"/>`
        + woodPanels(0, 420, '#6b4a36')
        + (neutral
          ? [330, 640, 950].map(sconce).join('')
          : `<circle cx="640" cy="120" r="70" fill="${P.navy}" stroke="${P.gold}" stroke-width="8"/><circle cx="640" cy="120" r="34" fill="${P.gold}" stroke="${P.ink}" stroke-width="3"/>`
            + props.flagPole(470, 300, { h: 250, wave: t * 1.5 }) + props.flagPole(810, 300, { h: 250, kind: 'plain', color: P.blue, wave: t * 1.5 + 1 }))
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
    // opts: screen (raw SVG, 440x240 box) > finance: true (falling red bars) > tvHeadline (text on the screen) > a turning globe.
    // headline = the red strap under the screen.
    draw(t, { screen, headline = 'BREAKING NEWS', tvHeadline, finance = false } = {}) {
      const scr = screen != null ? screen
        : finance ? money.stockBars([6, 5.4, 5.8, 4, 3, 1.8], t, -2, { x: 0, y: 0, w: 440, h: 240, bare: true, color: P.red })
          : globeScreen(440, 240, t, tvHeadline);
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

  // ------------------------------------------------------------------ stage (graduation, conference, panel)
  // opts: banner (text on the hanging banner, '' for none), panel: true (a skirted panel table stage-right that
  // covers the right/farRight spots), podium: false (no lectern at center). No flags or seals.
  stage: {
    mood: 'day',
    draw(t, { banner = 'WELCOME', panel = false } = {}) {
      let folds = '';
      for (let x = 0; x < W; x += 80) folds += `<rect x="${x + 20}" y="0" width="34" height="450" fill="${T.stageDrape}" opacity=".6"/>`;
      const beam = (x) => `<path d="M${x - 40} 0 H${x + 40} L${x + 240} 520 H${x - 240} Z" fill="${P.windowLit}" opacity=".06"/>`;
      const bw = Math.max(300, Math.min(760, textWidth(banner, 48, 'display') + 120));
      let planks = '';
      for (let y = 452; y < 530; y += 16) planks += `<path d="M0 ${y} H${W}" stroke="${P.woodMid}" stroke-width="2"/>`;
      return `<rect width="${W}" height="${H}" fill="${T.stageWall}"/>${folds}
        ${beam(640)}${panel ? beam(1010) : ''}
        ${banner ? `<path d="M${n(640 - bw / 2 + 40)} 0 V60 M${n(640 + bw / 2 - 40)} 0 V60" stroke="${P.ink}" stroke-width="3"/>
          <g filter="url(#shadow)"><rect x="${n(640 - bw / 2)}" y="56" width="${n(bw)}" height="84" fill="${P.blue}" ${o(4)}/>
          <rect x="${n(640 - bw / 2 + 8)}" y="64" width="${n(bw - 16)}" height="68" fill="none" stroke="${P.paperDim}" stroke-width="2" opacity=".6"/>
          ${text(banner, 640, 114, { size: 48, font: 'display', fill: P.paper, anchor: 'middle', spacing: 2 })}</g>` : ''}
        <rect y="440" width="${W}" height="92" fill="${P.wood}"/>${planks}
        <path d="M0 440 H${W}" stroke="${P.ink}" stroke-width="4"/>
        <rect y="530" width="${W}" height="60" fill="${P.woodDeep}" ${o(4)}/>
        <rect y="590" width="${W}" height="130" fill="${T.house}"/>
        ${pool(640, 512, 240, 34, 0.3)}${panel ? pool(1010, 512, 240, 34, 0.25) : ''}`;
    },
    front(t, { panel = false, podium = true } = {}) {
      const table = panel ? `<g>
          <rect x="790" y="450" width="440" height="16" fill="${P.woodDark}" ${o(4)}/>
          <rect x="800" y="466" width="420" height="66" fill="${P.navy}" ${o(4)}/>
          ${[900, 1110].map((x) => `<path d="M${x - 34} 450 L${x - 26} 430 H${x + 26} L${x + 34} 450 Z" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/><rect x="${x + 44}" y="428" width="14" height="22" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="2" opacity=".85"/>`).join('')}
        </g>` : '';
      return table
        + (podium ? props.podium(640, 532, { w: 110, h: 84, seal: false, color: P.woodMid }) : '')
        + props.audienceBacks(11, { rows: 2, y: 652, rowGap: 82, scale: 0.5, grow: 0.32, perRow: 10 });
    },
    spots: { farLeft: [150, 528, 0.72], left: [390, 528, 0.72], center: [640, 528, 0.72], right: [900, 528, 0.72], farRight: [1110, 528, 0.72] },
    close: { fx: 640, fy: 360, zoom: 1.9 },
  },

  // ------------------------------------------------------------------ wedding garden (coastal villa)
  // opts.dusk: evening light (dusk sky, lit windows and bulbs, warm light pools).
  weddingGarden: {
    mood: 'day',
    draw(t, { dusk = false } = {}) {
      const sky = dusk ? grad('skyWG', T.duskTop, T.duskLow) + `<rect width="${W}" height="${H}" fill="url(#skyWG)"/>` : daySky('skyWG') + clouds(14);
      const cypress = (x, h) => `<path d="M${x} ${540 - h} Q${x + 34} ${540 - h * 0.6} ${x + 26} 540 H${x - 26} Q${x - 34} ${540 - h * 0.6} ${x} ${540 - h} Z" fill="${T.cypress}" ${o(3.5)}/>`;
      const winX = [790, 910, 1030, 1150];
      const arched = (x, y, w, h, lit) => `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${lit ? P.windowLit : P.windowDark}" ${o(3)}/>`;
      const windows = (lit) => winX.map((x) => arched(x, 220, 64, 90, lit) + arched(x - 4, 390, 72, 140, lit)).join('');
      const shutters = winX.map((x) => `<rect x="${x - 22}" y="222" width="18" height="88" fill="${T.shutter}" ${o(2.5)}/><rect x="${x + 68}" y="222" width="18" height="88" fill="${T.shutter}" ${o(2.5)}/>`).join('');
      let stripes = '';
      for (let x = -40; x < W; x += 120) stripes += `<path d="M${x} 720 L${x + 60} 540 H${x + 120} L${x + 60} 720 Z" fill="${T.lawnDark}" opacity=".35"/>`;
      const scene = sky
        + `<rect y="330" width="${W}" height="200" fill="${T.sea}"/><rect y="330" width="${W}" height="16" fill="${T.seaDeep}"/>`
        + [0, 1, 2, 3, 4].map((i) => `<path d="M${n(((i * 230 + t * 6) % 760) - 40)} ${380 + (i % 3) * 30} h60" stroke="${P.paper}" stroke-width="3" opacity=".5" stroke-linecap="round"/>`).join('')
        + `<path d="M-20 334 Q140 250 320 334 Z" fill="${T.island}" ${o(3)}/>`
        + `<path d="M690 170 L740 112 H1300 V170 Z" fill="${T.terracotta}" ${o(4)}/>`
        + [760, 820, 880, 940, 1000, 1060, 1120, 1180, 1240].map((x) => `<path d="M${x} 116 L${x - 10} 168" stroke="${P.redDark}" stroke-width="2" opacity=".5"/>`).join('')
        + `<rect x="700" y="168" width="600" height="380" fill="${T.stucco}" ${o(4)}/>`
        + `<rect x="700" y="340" width="600" height="12" fill="${T.stoneDark}" ${o(3)}/>`
        + windows(false) + shutters
        + cypress(90, 300) + cypress(190, 240) + cypress(668, 250)
        + `<path d="M0 550 ${Array.from({ length: 17 }, (_, i) => `Q${i * 80 + 40} 512 ${(i + 1) * 80} 550`).join(' ')} V560 H0 Z" fill="${P.greenDark}" ${o(3.5)}/>`
        + `<rect y="552" width="${W}" height="168" fill="${T.lawn}"/>${stripes}<path d="M0 552 H${W}" stroke="${P.ink}" stroke-width="3"/>`
        + `<path d="M590 640 L560 720 H720 L690 640 Z" fill="${P.paper}" opacity=".85" stroke="${P.ink}" stroke-width="2.5"/>`
        + props.banquetTable(390, 578, { s: 0.55 }) + props.banquetTable(900, 578, { s: 0.55 })
        + props.gardenArch(640, 646, { w: 300, h: 400 })
        + props.banquetTable(150, 650, { s: 0.85 }) + props.banquetTable(1130, 660, { s: 0.85 })
        + `<path d="M20 720 V30 M1262 720 V40" stroke="${P.ink}" stroke-width="7"/>`;
      const strands = (lit) => props.stringLights(20, 40, 700, 60, { sag: 46, count: 14, lit, t }) + props.stringLights(700, 60, 1262, 46, { sag: 42, count: 12, lit, t })
        + props.stringLights(20, 140, 1262, 150, { sag: 70, count: 22, lit, t });
      if (!dusk) return scene + strands(false);
      return scene + `<rect width="${W}" height="${H}" fill="${P.nightMid}" opacity=".38"/>`
        + `<g opacity=".85">${windows(true)}</g>` + shutters
        + pool(640, 600, 360, 120, 0.2) + pool(150, 600, 180, 70, 0.18) + pool(1130, 610, 180, 70, 0.18) + pool(640, 160, 620, 90, 0.1)
        + strands(true);
    },
    front: () => '',
    spots: { farLeft: [90, 705, 0.85], left: [330, 690, 0.88], center: [640, 652, 0.85], right: [950, 690, 0.88], farRight: [1190, 705, 0.85] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ resort (tropical penthouse balcony)
  // opts.laptop: false hides the laptop on the table.
  resort: {
    mood: 'day',
    draw(t) {
      let tiles = '';
      for (let k = -8; k <= 8; k++) tiles += `<path d="M${640 + k * 90} 560 L${n(640 + k * 90 * 2.4)} 720" stroke="${T.tileLine}" stroke-width="2.5"/>`;
      [600, 650, 710].forEach((y) => { tiles += `<path d="M0 ${y} H${W}" stroke="${T.tileLine}" stroke-width="2.5"/>`; });
      let awning = '';
      for (let x = 0; x < W; x += 80) awning += `<path d="M${x} 0 H${x + 40} V34 Q${x + 20} 46 ${x} 34 Z" fill="${P.paper}" ${o(2.5)}/><path d="M${x + 40} 0 H${x + 80} V34 Q${x + 60} 46 ${x + 40} 34 Z" fill="${T.shutter}" ${o(2.5)}/>`;
      let rail = '';
      for (let x = 0; x <= W; x += 160) rail += `<rect x="${x - 7}" y="420" width="14" height="140" fill="${P.greyLight}" ${o(3)}/>`;
      return grad('skyRS', T.tropTop, T.tropLow) + `<rect width="${W}" height="${H}" fill="url(#skyRS)"/>` + clouds(12)
        + `<circle cx="1020" cy="150" r="80" fill="${P.windowLit}" opacity=".25" filter="url(#glow)"/><circle cx="1020" cy="150" r="38" fill="${P.windowLit}" opacity=".8"/>`
        + `<path d="M820 352 Q930 300 1050 352 Z" fill="${T.island}" ${o(3)}/>`
        + `<rect y="350" width="${W}" height="220" fill="${T.sea}"/><rect y="350" width="${W}" height="18" fill="${T.seaDeep}"/>`
        + [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${n(((i * 190 + t * 10) % 1360) - 40)} ${384 + (i % 3) * 14} h${40 + (i % 2) * 30}" stroke="${P.paper}" stroke-width="3" opacity=".55" stroke-linecap="round"/>`).join('')
        + props.palmTree(110, 600, t, { h: 430, lean: 0.22, seed: 1 }) + props.palmTree(1190, 600, t, { h: 470, lean: -0.26, seed: 2 })
        + `<rect y="430" width="${W}" height="130" fill="${P.bubble}" opacity=".22"/>${rail}`
        + `<rect x="-10" y="412" width="${W + 20}" height="14" rx="4" fill="${P.greyLight}" ${o(3)}/><path d="M0 556 H${W}" stroke="${P.greyDark}" stroke-width="4"/>`
        + `<rect y="560" width="${W}" height="160" fill="${T.tile}"/>${tiles}<path d="M0 560 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + awning;
    },
    front(t, { laptop = true } = {}) {
      return `<g>
        <rect x="490" y="566" width="300" height="20" rx="4" fill="${P.paperDim}" ${o(4)}/>
        <rect x="502" y="586" width="276" height="106" fill="${P.woodMid}" ${o(4)}/>
        ${[530, 570, 610, 650, 690, 730].map((x) => `<path d="M${x} 592 V686" stroke="${P.woodDark}" stroke-width="2.5" opacity=".6"/>`).join('')}
        <path d="M528 566 L522 526 H552 L546 566 Z" fill="${P.bubble}" opacity=".7" ${o(2.5)}/><path d="M540 546 L556 506" stroke="${P.red}" stroke-width="3"/><circle cx="552" cy="528" r="7" fill="${P.green}" ${o(2)}/>
      </g>` + (laptop ? props.laptop(728, 568, { w: 96, side: 'back' }) : '');
    },
    spots: { farLeft: [130, 700, 0.92], left: [330, 690, 0.95], center: [640, 668, 0.92], right: [960, 690, 0.95], farRight: [1160, 700, 0.92] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ data centre
  dataCenter: {
    mood: 'night',
    draw(t) {
      const racks = Array.from({ length: 10 }, (_, i) => props.serverRack(8 + i * 127, 112, 120, 448, t, { seed: i * 3 + 1 })).join('');
      let tray = `<path d="M0 82 H${W} M0 100 H${W}" stroke="${P.greyDark}" stroke-width="5"/>`;
      for (let x = 10; x < W; x += 24) tray += `<path d="M${x} 82 V100" stroke="${P.greyDark}" stroke-width="3"/>`;
      const cables = [[60, P.blue], [190, P.gold], [320, P.greyLight], [450, P.blue], [700, P.gold], [830, P.blue], [960, P.greyLight], [1090, P.blue], [1220, P.gold]]
        .map(([x, c]) => `<path d="M${x} 96 Q${x + 18} 118 ${x + 30} 114" fill="none" stroke="${P.ink}" stroke-width="9"/><path d="M${x} 96 Q${x + 18} 118 ${x + 30} 114" fill="none" stroke="${c}" stroke-width="5"/>`).join('');
      let floor = `<rect y="560" width="${W}" height="160" fill="${T.dcFloor}"/>`;
      for (let k = -7; k <= 7; k++) floor += `<path d="M${640 + k * 120} 560 L${n(640 + k * 120 * 1.62)} 720" stroke="${T.dcFloorLine}" stroke-width="2.5"/>`;
      [592, 634, 690].forEach((y) => { floor += `<path d="M0 ${y} H${W}" stroke="${T.dcFloorLine}" stroke-width="2.5"/>`; });
      const perf = (x0, y0) => { let d = ''; for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) d += `<circle cx="${x0 + i * 12}" cy="${y0 + j * 10}" r="2" fill="${T.dcFloorLine}"/>`; return d; };
      return `<rect width="${W}" height="${H}" fill="${T.dcWall}"/>`
        + `<rect width="${W}" height="72" fill="${T.dcCeil}"/>`
        + [250, 640, 1030].map((x) => `<rect x="${x - 120}" y="34" width="240" height="12" rx="4" fill="${P.greyLight}" ${o(2.5)}/>${pool(x, 60, 200, 40, 0.22, P.greyLight)}`).join('')
        + racks + tray + cables
        + floor + perf(300, 604) + perf(880, 604) + perf(590, 650)
        + `<path d="M0 560 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + pool(640, 330, 640, 220, 0.12, P.blue) + pool(640, 640, 520, 60, 0.12, P.blue);
    },
    front: () => '',
    spots: { farLeft: [130, 690, 0.9], left: [340, 682, 0.92], center: [640, 682, 0.92], right: [940, 682, 0.92], farRight: [1150, 690, 0.9] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ back seat of a car at night
  // One passenger (center), seated: the seat cushion in front() hides the legs. The driver is a silhouette
  // in the front seat (screen-left). City lights slide past the window (parallax). opts.speed scales the motion.
  carNight: {
    mood: 'night',
    draw(t, { speed = 1 } = {}) {
      const win = 'M330 400 V136 Q332 82 396 78 H1050 Q1140 82 1186 150 L1220 400 Z';
      const lampX = (i) => ((i * 560 - t * 520 * speed) % 2240 + 2240) % 2240 - 200;
      const lamps = [0, 1, 2, 3].map((i) => { const x = lampX(i); return `<path d="M${n(x)} 400 V170 H${n(x - 40)}" fill="none" stroke="${T.silhouette}" stroke-width="8"/><circle cx="${n(x - 44)}" cy="176" r="40" fill="${P.windowLit}" opacity=".35" filter="url(#glow)"/><circle cx="${n(x - 44)}" cy="176" r="9" fill="${P.windowLit}"/>`; }).join('');
      const sweep = ((t * 700 * speed) % 2600) - 700;
      return `<rect width="${W}" height="${H}" fill="${T.carInt}"/><rect width="${W}" height="56" fill="${T.seatDark}"/>
        <defs><clipPath id="carWin"><path d="${win}"/></clipPath></defs>
        ${grad('skyCar', P.nightDeep, P.nightMid)}
        <g clip-path="url(#carWin)">
          <rect width="${W}" height="${H}" fill="url(#skyCar)"/>
          ${scrollingCity(t, { seed: 4, speed: 30 * speed, base: 400, minH: 150, maxH: 290, color: T.nightFar, lit: 0.12 })}
          ${scrollingCity(t, { seed: 9, speed: 140 * speed, base: 400, minH: 60, maxH: 170, minW: 80, maxW: 160, color: P.night, lit: 0.3 })}
          ${lamps}
        </g>
        <path d="${win}" fill="none" stroke="${T.seatDark}" stroke-width="18" stroke-linejoin="round"/>
        <path d="${win}" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linejoin="round"/>
        <rect x="1004" y="74" width="30" height="330" fill="${T.carInt}" ${o(4)}/>
        <rect x="290" y="380" width="980" height="300" rx="46" fill="${T.seat}" ${o(4)}/>
        ${[420, 520, 620, 820, 920, 1020, 1120].map((x) => `<path d="M${x} 410 V660" stroke="${T.seatDark}" stroke-width="4"/>`).join('')}
        <rect x="640" y="300" width="160" height="92" rx="22" fill="${T.seat}" ${o(4)}/>
        <rect x="1000" y="300" width="150" height="92" rx="22" fill="${T.seat}" ${o(4)}/>
        ${pool(170, 420, 200, 160, 0.1)}
        <circle cx="160" cy="150" r="64" fill="${T.silhouette}" ${o(4)}/>
        <ellipse cx="222" cy="160" rx="10" ry="16" fill="${T.silhouette}" ${o(3)}/>
        <path d="M196 98 A64 64 0 0 1 222 128 M200 205 A64 64 0 0 0 218 186" stroke="${P.windowLit}" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
        <path d="M40 300 Q150 240 270 300 V720 H40 Z" fill="${T.silhouette}" ${o(4)}/>
        <path d="M-20 720 V250 Q-16 206 40 206 H250 Q300 210 300 260 V720 Z" fill="${T.seatDark}" ${o(4)}/>
        <rect x="70" y="196" width="160" height="74" rx="22" fill="${T.seatDark}" ${o(4)}/>
        <path d="M${n(sweep)} 0 h180 l-260 ${H} h-180 Z" fill="${P.windowLit}" opacity=".07"/>`;
    },
    front() {
      return `<g>
        <path d="M280 720 V604 Q288 558 360 554 H1190 Q1262 558 1272 604 V720 Z" fill="${T.seat}" ${o(4)}/>
        <path d="M300 586 Q300 568 360 568 H1190 Q1250 568 1252 586" fill="none" stroke="${T.seatDark}" stroke-width="4"/>
        ${[480, 620, 760, 900, 1040].map((x) => `<path d="M${x} 578 V720" stroke="${T.seatDark}" stroke-width="3"/>`).join('')}
      </g>`;
    },
    spots: { center: [720, 640, 1.2] },
    close: { fx: 720, fy: 360, zoom: 1.45 },
  },

  // ------------------------------------------------------------------ classroom
  // opts.board: chalk text on the blackboard ('\n' for new lines; '' = a wiped board with smudges).
  classroom: {
    mood: 'day',
    draw(t, { board = '' } = {}) {
      const lines = String(board).split('\n').filter((l) => l.length);
      const sz = lines.length > 2 ? 40 : 48;
      const chalk = lines.map((l, i) => text(l, 640, 158 + i * sz * 1.25, { size: sz, font: 'hand', fill: P.paper, anchor: 'middle', opacity: 0.9 })).join('');
      const r = rng(17);
      const smudges = Array.from({ length: 6 }, () => `<ellipse cx="${n(300 + r() * 680)}" cy="${n(120 + r() * 240)}" rx="${n(50 + r() * 70)}" ry="${n(14 + r() * 16)}" fill="${P.paper}" opacity=".06"/>`).join('');
      return props.office({ dadoY: 440, floorY: 580 })
        + `<g filter="url(#shadow)"><rect x="236" y="66" width="808" height="338" fill="${P.woodDark}" ${o(4)}/>
          <rect x="252" y="82" width="776" height="306" fill="${P.board}" stroke="${P.ink}" stroke-width="2"/></g>
          ${smudges}${chalk}
          <rect x="246" y="398" width="788" height="14" fill="${P.woodMid}" ${o(3)}/>
          <rect x="860" y="390" width="40" height="10" rx="3" fill="${P.charcoal}" ${o(2)}/><rect x="320" y="393" width="26" height="6" rx="2" fill="${P.paper}"/><rect x="360" y="393" width="18" height="6" rx="2" fill="${P.paper}"/>`
        + `<g><defs><clipPath id="clsWin"><rect x="1092" y="70" width="190" height="320"/></clipPath></defs><rect x="1092" y="70" width="190" height="320" fill="${T.skyDay}"/>
          <g clip-path="url(#clsWin)"><circle cx="1190" cy="320" r="60" fill="${P.green}" ${o(3)}/><circle cx="1250" cy="270" r="50" fill="${P.greenDark}" ${o(3)}/></g>
          <rect x="1092" y="70" width="190" height="320" fill="none" ${o(8)}/>
          <path d="M1187 70 V390 M1092 230 H1282" stroke="${P.ink}" stroke-width="6"/><rect x="1080" y="390" width="210" height="14" fill="${P.wallTrim}" ${o(3)}/></g>`
        + props.clock(140, 120, t, { hour: 9 })
        + props.bookshelf(30, 330, 170, 250)
        + pool(1180, 500, 200, 90, 0.12, P.paper);
    },
    front() {
      return props.schoolDesk(250, 730, { w: 300 }) + props.schoolDesk(1030, 730, { w: 300 });
    },
    spots: { farLeft: [110, 630, 0.85], left: [250, 618, 0.85], center: [640, 600, 0.85], right: [1030, 618, 0.85], farRight: [1170, 630, 0.85] },
    close: { fx: 640, fy: 400, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ podcast studio
  // Two hosts at left/right behind a table, each with a boom-arm mic. opts.headphones: true puts headphones
  // on the left/right hosts' heads (otherwise they lie on the table). opts.onAir: false = sign unlit.
  podcast: {
    mood: 'night',
    draw(t, { onAir = true } = {}) {
      const panelGrid = (x0, y0) => {
        let d = '';
        for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
          const x = x0 + i * 96, y = y0 + j * 104, c = (i + j) % 2 ? T.foamA : T.foamB;
          d += `<rect x="${x}" y="${y}" width="88" height="96" rx="6" fill="${c}" ${o(3)}/>`;
          for (let k = 1; k < 4; k++) d += (i + j) % 2 ? `<path d="M${x + k * 22} ${y + 6} V${y + 90}" stroke="${P.ink}" stroke-width="2" opacity=".3"/>` : `<path d="M${x + 6} ${y + k * 24} H${x + 82}" stroke="${P.ink}" stroke-width="2" opacity=".3"/>`;
        }
        return d;
      };
      return `<rect width="${W}" height="${H}" fill="${T.podWall}"/>`
        + panelGrid(40, 100) + panelGrid(864, 100)
        + `<rect x="530" y="56" width="220" height="64" rx="10" fill="${onAir ? P.red : P.redDark}" ${o(4)}/>${text('ON AIR', 640, 102, { size: 40, font: 'display', fill: onAir ? P.paper : P.paperShade, anchor: 'middle', spacing: 3 })}`
        + (onAir ? pool(640, 88, 160, 60, 0.3, P.red) : '')
        + `<rect x="500" y="300" width="280" height="12" fill="${P.wood}" ${o(3)}/>`
        + [520, 540, 556].map((x, i) => `<rect x="${x}" y="${250 + i * 6}" width="16" height="${50 - i * 6}" fill="${[P.blue, P.gold, P.redDark][i]}" stroke="${P.ink}" stroke-width="2"/>`).join('')
        + props.plant(740, 300, { s: 0.5 })
        + `<rect y="580" width="${W}" height="140" fill="${P.floor}"/>`
        + pool(640, 300, 560, 220, 0.1);
    },
    front(t, { headphones = false } = {}) {
      const S = SETS.podcast.spots;
      const arm = ([x, y, s], dir) => {
        const mx = x + 100 * dir * s, my = y - 176 * s;
        const cx = x + 150 * dir, ex = x + 172 * dir, ey = 440;
        return `<path d="M${cx} 542 L${ex} ${ey} L${n(mx + 14 * dir)} ${n(my + 40)}" fill="none" stroke="${P.ink}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
          <path d="M${cx} 542 L${ex} ${ey} L${n(mx + 14 * dir)} ${n(my + 40)}" fill="none" stroke="${P.greyDark}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="${ex}" cy="${ey}" r="6" fill="${P.greyDark}" stroke="${P.ink}" stroke-width="2.5"/>
          <rect x="${cx - 14}" y="530" width="28" height="18" rx="3" fill="${P.charcoal}" ${o(2.5)}/>`
          + props.studioMic(mx, my, { s: 0.9, rot: -28 * dir });
      };
      const phones = headphones
        ? [S.left, S.right].map(([x, y, s]) => g(tr(x, y, s), props.headphones(0, 0, { worn: true }))).join('')
        : props.headphones(250, 540) + props.headphones(1030, 540);
      return phones + `<g>
        <rect x="90" y="538" width="1100" height="24" rx="6" fill="${P.wood}" ${o(4)}/>
        <rect x="104" y="562" width="1072" height="170" fill="${P.woodDeep}" ${o(4)}/>
        <path d="M104 600 H1176" stroke="${P.woodDark}" stroke-width="3"/>
      </g>` + props.laptop(640, 540, { w: 80, side: 'back' })
        + `<path d="M1100 540 V506 H1132 V540 Z" fill="${P.paper}" ${o(2.5)}/><path d="M1132 514 Q1146 522 1132 532" fill="none" stroke="${P.ink}" stroke-width="3"/>`
        + arm(S.left, 1) + arm(S.right, -1);
    },
    spots: { left: [420, 640, 0.95], center: [640, 640, 0.95], right: [860, 640, 0.95] },
    close: { fx: 640, fy: 420, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ airport departure gate
  // opts: flights = [[destination, time, status], ...] for the departures board; gate = gate number text.
  airportGate: {
    mood: 'day',
    draw(t, { flights, gate = '12' } = {}) {
      const rows = flights || [['Lisbon', '09:40', 'Boarding'], ['Singapore', '10:15', 'On time'], ['Toronto', '10:50', 'Delayed'], ['Zurich', '11:05', 'On time']];
      let carpet = '';
      for (let x = -200; x < W + 200; x += 60) carpet += `<path d="M${x} 720 L${x + 100} 570" stroke="${P.greyDark}" stroke-width="2" opacity=".35"/>`;
      const seatRow = (x0, count) => `<rect x="${x0 - 6}" y="592" width="${count * 70 + 12}" height="10" fill="${P.greyDark}" ${o(3)}/>`
        + Array.from({ length: count }, (_, i) => { const x = x0 + i * 70; return `<rect x="${x + 3}" y="520" width="64" height="66" rx="10" fill="${P.navy}" ${o(3)}/><rect x="${x}" y="580" width="70" height="16" rx="5" fill="${P.navy}" ${o(3)}/>`; }).join('')
        + `<path d="M${x0 + 20} 602 V640 M${x0 + count * 70 - 20} 602 V640" stroke="${P.ink}" stroke-width="6"/>`;
      return daySky('skyAG') + clouds(21)
        + `<path d="M0 392 ${Array.from({ length: 16 }, (_, i) => `Q${i * 80 + 40} 370 ${(i + 1) * 80} 392`).join(' ')} V410 H0 Z" fill="${T.land}"/>`
        + `<rect y="404" width="${W}" height="140" fill="${T.tarmac}"/><path d="M0 470 H${W}" stroke="${P.gold}" stroke-width="5" stroke-dasharray="40 30" opacity=".8"/><path d="M0 520 H${W}" stroke="${P.paper}" stroke-width="4" opacity=".6"/>`
        + props.airliner(400, 350, { s: 0.95 })
        + `<g><rect x="420" y="436" width="110" height="40" rx="8" fill="${P.gold}" ${o(3)}/><rect x="456" y="410" width="50" height="30" rx="4" fill="${P.windowDark}" ${o(3)}/>${[446, 506].map((x) => `<circle cx="${x}" cy="478" r="11" fill="${P.charcoal}" ${o(3)}/>`).join('')}</g>`
        + [0, 213, 426, 640, 853, 1066, 1280].map((x) => `<rect x="${x - 8}" y="56" width="16" height="490" fill="${P.greyDark}" ${o(3)}/>`).join('')
        + `<rect width="${W}" height="60" fill="${P.greyLight}" ${o(4)}/>${[200, 640, 1080].map((x) => `<rect x="${x - 70}" y="22" width="140" height="14" rx="4" fill="${P.paper}" ${o(2.5)}/>`).join('')}`
        + `<rect y="540" width="${W}" height="30" fill="${P.greyDark}" ${o(4)}/>`
        + `<rect y="570" width="${W}" height="150" fill="${T.carpet}"/>${carpet}`
        + `<path d="M110 60 V84 M310 60 V84" stroke="${P.ink}" stroke-width="4"/>`
        + props.departuresBoard(40, 84, 360, 210, rows, t)
        + `<path d="M1150 60 V78" stroke="${P.ink}" stroke-width="4"/><g filter="url(#shadow)"><rect x="1050" y="76" width="200" height="62" rx="6" fill="${P.navy}" ${o(4)}/>${text(`GATE ${gate}`, 1150, 120, { size: 36, font: 'display', fill: P.paper, anchor: 'middle', spacing: 2 })}</g>`
        + seatRow(40, 5) + seatRow(890, 5)
        + pool(640, 300, 640, 220, 0.08, P.paper);
    },
    front: () => '',
    spots: { farLeft: [110, 704, 0.9], left: [330, 694, 0.92], center: [640, 684, 0.92], right: [950, 694, 0.92], farRight: [1170, 704, 0.9] },
    close: { fx: 640, fy: 430, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ prison exterior (daylight, muted)
  // opts.name: optional plaque text beside the gate (generic names only).
  prisonExterior: {
    mood: 'day',
    draw(t, { name } = {}) {
      const r = rng(23);
      const stains = Array.from({ length: 14 }, () => `<rect x="${n(r() * 1240)}" y="266" width="${n(8 + r() * 26)}" height="${n(40 + r() * 140)}" fill="${T.concreteDark}" opacity=".35"/>`).join('');
      let joints = '';
      for (let x = 64; x < W; x += 128) joints += `<path d="M${x} 266 V600" stroke="${T.concreteDark}" stroke-width="3"/>`;
      let ribs = '';
      for (let x = 806; x < 1060; x += 28) ribs += `<path d="M${x} 340 V596" stroke="${P.charcoal}" stroke-width="4"/>`;
      return grad('skyPR', T.overcastTop, T.overcast) + `<rect width="${W}" height="${H}" fill="url(#skyPR)"/>`
        + `<g opacity=".6">${clouds(31)}</g>`
        + `<path d="M0 300 Q200 220 420 280 T860 260 T1280 280 V400 H0 Z" fill="${T.hill}"/>`
        + `<rect x="-10" y="262" width="${W + 20}" height="340" fill="${T.concrete}" ${o(5)}/>${joints}${stains}`
        + `<rect x="-10" y="252" width="${W + 20}" height="16" fill="${T.concreteDark}" ${o(4)}/>`
        + props.razorWire(0, W, 252)
        + `<rect x="776" y="320" width="300" height="282" fill="${T.concreteDark}" ${o(4)}/>
           <rect x="796" y="338" width="260" height="262" fill="${P.greyDark}" ${o(4)}/>${ribs}
           <rect x="796" y="460" width="260" height="14" fill="${P.charcoal}" ${o(3)}/><path d="M926 338 V600" stroke="${P.ink}" stroke-width="4"/>
           <rect x="760" y="300" width="332" height="22" fill="${T.concrete}" ${o(4)}/>`
        + (name ? `<g filter="url(#shadow)"><rect x="${n(560 - textWidth(name, 26, 'display') / 2 - 20)}" y="368" width="${n(textWidth(name, 26, 'display') + 40)}" height="48" fill="${P.paper}" ${o(3)}/>${text(name, 560, 402, { size: 26, font: 'display', anchor: 'middle' })}</g>` : '')
        + props.watchtower(190, 602, { h: 540 })
        + `<path d="M1210 602 V170" stroke="${P.ink}" stroke-width="10"/><path d="M1210 602 V170" stroke="${P.greyDark}" stroke-width="5"/>
           <rect x="1176" y="150" width="68" height="30" rx="5" fill="${P.greyDark}" ${o(3)}/>${[1186, 1210, 1234].map((x) => `<circle cx="${x}" cy="165" r="8" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2"/>`).join('')}`
        + `<rect y="600" width="${W}" height="22" fill="${T.gravel}"/><rect y="622" width="${W}" height="98" fill="${T.tarmac}"/>
           <path d="M0 600 H${W}" stroke="${P.ink}" stroke-width="4"/><path d="M0 622 H${W}" stroke="${P.ink}" stroke-width="3"/>
           <path d="M0 690 H${W}" stroke="${P.paperDim}" stroke-width="4" stroke-dasharray="44 34" opacity=".7"/>`;
    },
    front: () => '',
    spots: { farLeft: [120, 704, 0.85], left: [360, 694, 0.88], center: [640, 694, 0.88], right: [920, 694, 0.88], farRight: [1150, 704, 0.85] },
    close: { fx: 640, fy: 480, zoom: 1.7 },
  },
};

// History/places sets live in lib/sets-history.js (same interface); merged here so every episode sees one registry.
try { Object.assign(SETS, require('./sets-history').SETS); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }

module.exports = { SETS, pool };
