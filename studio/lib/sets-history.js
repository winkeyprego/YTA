// History & places sets: same interface as lib/sets.js (draw, front, spots, close, mood) and merged into its SETS
// registry, so episodes just use SETS.<name>. Built for 9/11 and general history documentaries.
//
// RESPECT (see RECIPES.md "Sensitive topics"): these are calm establishing places. Nothing here draws damage,
// smoke, fire, impacts, aircraft near buildings or victims, and nothing should be added that does.
//
//   skylineWTC   Lower Manhattan across the river, from a promenade.
//                setOpts: towers (true) = the two towers; false = the same skyline with empty sky where they stood.
//                         dusk | night (lit windows); light (true) = Tribute in Light beams (only with towers:false;
//                         implies night).
//   pentagon     aerial 3/4 view of the intact building, rings, courtyard, roads, parking. Day. No cast (aerial).
//   memorial     two square reflecting pools with falling water, plain bronze parapets (no names), trees, candles.
//                setOpts: night; light (default = night) = the two beams behind the trees.
//   fieldPA      rural Pennsylvania: rolling fields, tree line, a low pale memorial wall in the distance, a path.
//   controlRoom  dark air-traffic / operations room: US wall map, radar scopes (sweep in t), console desk in front()
//                with headsets. spots left/center/right = seated operators (desk covers the legs).
//                setOpts: mapLabel ('') small caption under the map.
//   ovalOffice   curved walls, three windows, two flags (US + plain blue), rug; big desk in front(); center = behind desk.
//   capitol      U.S. Capitol exterior on its hill, lawn in front.
//   courthouse   federal courthouse, columns and steps. setOpts: name ('UNITED STATES COURTHOUSE').
//   cinema       film-festival front at night: marquee with setOpts.title, setOpts.festival ('FILM FESTIVAL'),
//                red carpet, photographers with flashes (front()). setOpts.inside = screening room: screen with the
//                title, a little stage (spots stage/stageLeft/stageRight), seat rows from behind in front().
//   cinemaInside the screening room as its own set (center/left/right = the stage spots).
//   embassy      embassy/consulate front: fence and gate, flag pole (plain flag, setOpts.flagColor, default blue),
//                setOpts.name ('EMBASSY').
//   balcony      apartment balcony, a person at the railing, distant skyline across water.
//                setOpts: skyline 'generic' | 'wtc'; time 'day' | 'dusk' | 'night'; towers (true) and light for 'wtc'.
//   gulfSkyline  generic desert-coast city at dusk from a palm-lined corniche (no landmarks).
//
// Exported helper: manhattan(t, opts) draws the Lower Manhattan silhouette with its base at y = 0 (wrap it in a
// translate/scale) for other sets or screens.

const P = require('./palette');
const { n, text, textWidth, W, H } = require('./svg');
const { rng } = require('./motion');
const props = require('./props');
const { crowd } = require('./characters');

// Derived tints (muted blends of palette colours), used only by these sets. Candidates to move into palette.js.
const T = {
  skyDay: '#cdd6d3', skyDayTop: '#b4c3c1',
  duskTop: '#465069', duskMid: '#8c8090', duskLow: '#d4ad86', sun: '#ead0a0',
  cityDay: '#b3bcbb', cityDayNear: '#949e9d', cityDusk: '#5d6378', cityDuskNear: '#3f4659',
  towerDay: '#a3acac', towerStripe: '#bfc6c5', towerDusk: '#4a5266', towerNight: '#263246',
  riverDay: '#93a6a8', riverDusk: '#6a6f86', riverNight: '#1b2432',
  beam: '#e4ecf2',
  grass: '#93a47d', grassDark: '#7a8d66', grassLight: '#a9b78f', haze: '#aab6a6',
  tree: '#5f7d55', treeDark: '#4b6646', treeNight: '#2a3a34',
  stone: '#d9cfb8', stoneDark: '#b8ac92', stoneShade: '#c8bda3',
  roof: '#c4bca8', roofDark: '#a59c86', lightwell: '#8b836f',
  asphalt: '#7a7d7a', paving: '#b9b6ac', pavingDark: '#a19e95', pavingNight: '#2b3240',
  bronze: '#4d4238', granite: '#5b6064', waterPool: '#4f6670', waterDeep: '#26333b', foam: '#e3e9e8',
  room: '#1d2531', roomFloor: '#151b25', console: '#3c444e', consoleTop: '#58616b', scope: '#7fb07a', scopeBg: '#15221b',
  ovalWall: '#e1d6b5', ovalShade: '#cbbf98', ovalCeil: '#ece4cc', carpet: '#41506d', drape: '#c2a160',
  facade: '#3e3644', facadeDark: '#2f2934', cinemaRoom: '#211c24',
  sand: '#d6bf95', sandDark: '#bfa478', seaDusk: '#7a7f93', gulfBack: '#6c6e83', gulfFront: '#4a4e64', corniche: '#c7b79a',
  glass: '#a9c0c8', glassDark: '#56687a', iron: '#2b2622',
};

// ---------- small local helpers (sets.js requires this file, so nothing is imported from it) ----------
const o = (w = 4) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;
const pool = (x, y, rx, ry, op = 0.16, color = P.windowLit) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${color}" opacity="${op}" filter="url(#glow)"/>`;
const grad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([off, c, op = 1]) => `<stop offset="${off}" stop-color="${c}" stop-opacity="${op}"/>`).join('')}</linearGradient></defs>`;
const daySky = (id = 'hsSkyD') => grad(id, [[0, T.skyDayTop], [1, T.skyDay]]) + `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
const duskSky = (id = 'hsSkyK', sunX = 300, sunY = 440) => grad(id, [[0, T.duskTop], [0.55, T.duskMid], [1, T.duskLow]])
  + `<rect width="${W}" height="${H}" fill="url(#${id})"/>`
  + `<circle cx="${sunX}" cy="${sunY}" r="120" fill="${T.sun}" opacity=".35" filter="url(#glow)"/><circle cx="${sunX}" cy="${sunY}" r="44" fill="${T.sun}" opacity=".9"/>`;
const sky = (mode, id, sunX, sunY) => (mode === 'night' ? props.nightSky(9, { moonX: 1130, moonY: 86 }) : mode === 'dusk' ? duskSky(id + 'K', sunX, sunY) : daySky(id + 'D'));
// Clouds that drift slowly with t (pure in t).
const clouds = (seed, t = 0, { count = 4, yMax = 150, color = '#eef0ea' } = {}) => {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const x = ((r() * W + t * 5) % (W + 200)) - 100, y = 40 + r() * yMax, s = 0.6 + r() * 0.6;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" opacity=".85"><ellipse cx="0" cy="0" rx="70" ry="24" fill="${color}"/><ellipse cx="-34" cy="-14" rx="34" ry="22" fill="${color}"/><ellipse cx="26" cy="-18" rx="40" ry="26" fill="${color}"/></g>`;
  }).join('');
};
const ptsStr = (arr) => arr.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const poly = (arr, attrs) => `<polygon points="${ptsStr(arr)}" ${attrs}/>`;
const lerpPt = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const centroid = (arr) => [arr.reduce((s, p) => s + p[0], 0) / arr.length, arr.reduce((s, p) => s + p[1], 0) / arr.length];
const shrink = (arr, k, dy = 0) => { const c = centroid(arr); return arr.map((p) => { const q = lerpPt(p, c, k); return [q[0], q[1] + dy]; }); };
// Fit a label's font size into a width.
const fit = (str, maxW, size, font = 'display') => Math.min(size, maxW / Math.max(1, textWidth(str, 1, font)));
// Simple column (shaft + capital + base), for small-scale facades.
const col = (x, top, base, w, color = T.stone, sw = 2.5) => {
  const c = w * 0.38;
  return `<rect x="${n(x - w / 2)}" y="${n(top + c)}" width="${n(w)}" height="${n(base - top - 2 * c)}" fill="${color}" stroke="${P.ink}" stroke-width="${sw}"/>`
    + `<rect x="${n(x - w * 0.72)}" y="${n(top)}" width="${n(w * 1.44)}" height="${n(c)}" fill="${color}" stroke="${P.ink}" stroke-width="${sw}"/>`
    + `<rect x="${n(x - w * 0.72)}" y="${n(base - c)}" width="${n(w * 1.44)}" height="${n(c)}" fill="${color}" stroke="${P.ink}" stroke-width="${sw}"/>`;
};
// Round deciduous tree: one merged canopy outline (outline pass, then fill pass).
function tree(x, base, s = 1, { color = T.tree, trunk = P.woodMid } = {}) {
  const blobs = [[0, -130, 58], [-42, -104, 44], [42, -100, 46], [0, -168, 44], [-24, -150, 40], [26, -152, 40]];
  const sw = n(3 / s);
  return `<g transform="translate(${n(x)} ${n(base)}) scale(${n(s)})">
    <path d="M-9 0 L-6 -90 H6 L9 0 Z" fill="${trunk}" stroke="${P.ink}" stroke-width="${sw}"/>
    ${blobs.map(([bx, by, r]) => `<circle cx="${bx}" cy="${by}" r="${r}" fill="${P.ink}" stroke="${P.ink}" stroke-width="${n(6 / s)}"/>`).join('')}
    ${blobs.map(([bx, by, r]) => `<circle cx="${bx}" cy="${by}" r="${r}" fill="${color}"/>`).join('')}
    <path d="M-30 -120 Q-10 -140 10 -128" stroke="${P.ink}" stroke-width="${sw}" fill="none" opacity=".35"/>
  </g>`;
}
// Conifer (hemlock / pine): stacked triangles.
function conifer(x, base, s = 1, color = T.treeDark) {
  const tiers = [[0, 92], [-60, 74], [-115, 56], [-165, 38]];
  return `<g transform="translate(${n(x)} ${n(base)}) scale(${n(s)})"><rect x="-7" y="-30" width="14" height="30" fill="${P.woodMid}" stroke="${P.ink}" stroke-width="${n(3 / s)}"/>
    ${tiers.map(([y, w]) => `<path d="M${-w} ${y - 20} L0 ${y - 20 - w * 1.4} L${w} ${y - 20} Z" fill="${color}" stroke="${P.ink}" stroke-width="${n(3 / s)}" stroke-linejoin="round"/>`).join('')}</g>`;
}
// Palm tree: curved trunk + fronds.
function palm(x, base, s = 1, lean = 1) {
  const tx = 30 * lean, ty = -300;
  const fronds = [-150, -120, -80, -40, -10, 25, 60].map((a) => {
    const r = (a * Math.PI) / 180, L = 120;
    const ex = Math.cos(r) * L * lean, ey = Math.sin(r) * L * 0.55 + 30;
    return `<path d="M${tx} ${ty} Q${n(tx + ex * 0.5)} ${n(ty + ey - 46)} ${n(tx + ex)} ${n(ty + ey)} Q${n(tx + ex * 0.45)} ${n(ty + ey - 18)} ${tx} ${ty} Z" fill="${T.treeDark}" stroke="${P.ink}" stroke-width="${n(3 / s)}" stroke-linejoin="round"/>`;
  }).join('');
  return `<g transform="translate(${n(x)} ${n(base)}) scale(${n(s)})">
    <path d="M0 0 Q${n(-10 * lean)} -160 ${tx} ${ty}" stroke="${P.ink}" stroke-width="${n(18)}" fill="none" stroke-linecap="round"/>
    <path d="M0 0 Q${n(-10 * lean)} -160 ${tx} ${ty}" stroke="${P.woodMid}" stroke-width="${n(11)}" fill="none" stroke-linecap="round"/>
    ${fronds}<circle cx="${tx}" cy="${ty}" r="10" fill="${P.woodDark}" stroke="${P.ink}" stroke-width="2.5"/></g>`;
}
// Lit window specks inside a rect (deterministic).
function winGrid(r, x, y, w, h, { prob = 0.15, dx = 9, dy = 12, ww = 3, wh = 5, color = P.windowLit, op = 0.85 } = {}) {
  let s = '';
  for (let yy = y + 7; yy < y + h - wh - 3; yy += dy) for (let xx = x + 4; xx < x + w - ww - 3; xx += dx) if (r() < prob) s += `<rect x="${n(xx)}" y="${n(yy)}" width="${ww}" height="${wh}" fill="${color}" opacity="${op}"/>`;
  return s;
}
const smallFlag = (x, y, s = 1) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><path d="M0 0 V-46" stroke="${P.ink}" stroke-width="2.5"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="1" y="${-46 + i * 4}" width="28" height="4" fill="${i % 2 ? '#f2efe6' : P.red}"/>`).join('')}<rect x="1" y="-46" width="12" height="10" fill="${P.navy}"/><rect x="1" y="-46" width="28" height="20" fill="none" stroke="${P.ink}" stroke-width="1.5"/></g>`;

// ---------- Lower Manhattan silhouette ----------
// Local coords: x 0..1280, base at y = 0 (buildings grow to negative y). Wrap in translate/scale.
// towers: the two equal towers (dense vertical window grid, one antenna). towers:false leaves the same skyline with
// open sky where they stood. light: two vertical beams where they stood (only drawn when towers is false).
const TOWERS = [[566, 62], [652, 62]];
const TOWER_H = 390;
function manhattan(t = 0, { towers = true, mode = 'day', light = false, seed = 911 } = {}) {
  const C = mode === 'night' ? { back: '#26324a', front: P.night, tower: T.towerNight, lit: 0.16, edge: 0.9 }
    : mode === 'dusk' ? { back: T.cityDusk, front: T.cityDuskNear, tower: T.towerDusk, lit: 0.06, edge: 0.9 }
      : { back: T.cityDay, front: T.cityDayNear, tower: T.towerDay, lit: 0, edge: 0.55 };
  const r = rng(seed);
  const prof = (x) => 46 + 160 * Math.exp(-(((x - 800) / 300) ** 2)) + 30 * Math.exp(-(((x - 300) / 160) ** 2));
  const plaza = (x, w) => x + w > 540 && x < 734; // where the towers stood: kept low so their absence reads as open sky
  let back = '', front = '';
  for (let x = -20; x < W + 20;) {
    const bw = 30 + r() * 46;
    let bh = prof(x) * (0.55 + r() * 0.55) + 24;
    if (plaza(x, bw)) bh = Math.min(bh, 110 + r() * 30);
    back += `<rect x="${n(x)}" y="${n(-bh)}" width="${n(bw + 1)}" height="${n(bh)}" fill="${C.back}"/>`;
    if (C.lit) back += winGrid(r, x, -bh, bw, bh, { prob: C.lit * 0.6, op: 0.55 });
    x += bw + 1;
  }
  for (let x = -30; x < W + 30;) {
    const bw = 26 + r() * 46;
    let bh = prof(x) * (0.35 + r() * 0.6);
    if (plaza(x, bw)) bh = Math.min(bh, 36 + r() * 44);
    const top = r();
    const y = -bh;
    let cap = '';
    if (top < 0.12 && bh > 90) cap = `<rect x="${n(x + bw * 0.22)}" y="${n(y - 22)}" width="${n(bw * 0.56)}" height="23" fill="${C.front}" stroke="${P.ink}" stroke-width="2.5" stroke-opacity="${C.edge}"/>`;
    else if (top < 0.2 && bh > 110) cap = `<path d="M${n(x + 2)} ${n(y)} L${n(x + bw / 2)} ${n(y - bw * 0.7)} L${n(x + bw - 2)} ${n(y)} Z" fill="${C.front}" stroke="${P.ink}" stroke-width="2.5" stroke-opacity="${C.edge}"/>`;
    else if (top < 0.25 && bh > 120) cap = `<path d="M${n(x + bw / 2)} ${n(y)} V${n(y - 40)}" stroke="${P.ink}" stroke-width="3" stroke-opacity="${C.edge}"/>`;
    front += cap + `<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="${n(bh + 2)}" fill="${C.front}" stroke="${P.ink}" stroke-width="2.5" stroke-opacity="${C.edge}"/>`;
    if (C.lit) front += winGrid(r, x, y, bw, bh, { prob: C.lit });
    else for (let wx = x + 7; wx < x + bw - 6; wx += 9) front += `<path d="M${n(wx)} ${n(y + 8)} V-4" stroke="${T.cityDay}" stroke-width="2" opacity=".55"/>`;
    x += bw + 2 + r() * 4;
  }
  let tw = '';
  if (towers) {
    const tr2 = rng(seed + 1);
    tw = TOWERS.map(([x, w], k) => {
      const y = -TOWER_H;
      let grid = '';
      if (mode === 'day') {
        for (let i = 1; i < 15; i++) grid += `<path d="M${n(x + i * (w / 15))} ${y + 6} V-2" stroke="${T.towerStripe}" stroke-width="1.8"/>`;
      } else {
        for (let i = 1; i < 15; i++) grid += `<path d="M${n(x + i * (w / 15))} ${y + 6} V-2" stroke="${mode === 'dusk' ? '#5b6479' : '#34405a'}" stroke-width="1.6"/>`;
        const cols = 13, rows = 56, cw = (w - 6) / cols, ch = (TOWER_H - 10) / rows;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (tr2() < (mode === 'dusk' ? 0.22 : 0.42)) grid += `<rect x="${n(x + 4 + i * cw)}" y="${n(y + 6 + j * ch)}" width="${n(cw * 0.55)}" height="${n(ch * 0.6)}" fill="${P.windowLit}" opacity=".85"/>`;
      }
      const bands = [0.07, 0.38, 0.69, 0.985].map((f) => `<rect x="${x}" y="${n(-TOWER_H * f - 3)}" width="${w}" height="5" fill="${C.front}" opacity=".7"/>`).join('');
      const antenna = k === 0 ? `<rect x="${n(x + w / 2 - 7)}" y="${y - 10}" width="14" height="10" fill="${C.tower}" stroke="${P.ink}" stroke-width="2.5"/><path d="M${n(x + w / 2)} ${y - 10} V${y - 74}" stroke="${P.ink}" stroke-width="4"/><path d="M${n(x + w / 2)} ${y - 10} V${y - 74}" stroke="${C.tower}" stroke-width="1.5"/>` : '';
      return `${antenna}<rect x="${x}" y="${y}" width="${w}" height="${TOWER_H}" fill="${C.tower}" stroke="${P.ink}" stroke-width="3.5"/>${grid}${bands}<rect x="${x}" y="${y}" width="${w}" height="${TOWER_H}" fill="none" stroke="${P.ink}" stroke-width="3.5"/>`;
    }).join('');
  }
  let beams = '';
  if (light && !towers) {
    const shimmer = 0.92 + 0.08 * Math.sin(t * 1.7);
    beams = grad('hsBeam', [[0, T.beam, 0.02], [0.55, T.beam, 0.3], [1, T.beam, 0.8]])
      + TOWERS.map(([x, w]) => {
        const cx = x + w / 2;
        // no glow blob at the base: a soft grey cloud near the buildings would read as smoke
        return `<polygon points="${n(cx - 46)},-1500 ${n(cx + 46)},-1500 ${n(cx + 24)},0 ${n(cx - 24)},0" fill="url(#hsBeam)" opacity="${n(0.55 * shimmer)}" filter="url(#glow)"/>`
          + `<polygon points="${n(cx - 30)},-1500 ${n(cx + 30)},-1500 ${n(cx + 13)},0 ${n(cx - 13)},0" fill="url(#hsBeam)" opacity="${n(shimmer)}"/>`;
      }).join('');
  }
  return `${beams}<g>${back}</g>${tw}<g>${front}</g>`;
}

// River band with drifting ripples; reflections of the towers / beams / lit windows.
function river(t, y0, y1, mode, { towers = false, light = false, tx = 0, ts = 1 } = {}) {
  const fill = mode === 'night' ? T.riverNight : mode === 'dusk' ? T.riverDusk : T.riverDay;
  const line = mode === 'day' ? '#b4c3c4' : mode === 'dusk' ? '#8c8aa0' : '#34425a';
  let s = `<rect y="${y0}" width="${W}" height="${y1 - y0}" fill="${fill}"/>`;
  const refl = (cx, w, color, op) => {
    let d = '';
    for (let y = y0 + 6, i = 0; y < y1 - 4; y += 9, i++) {
      const wob = Math.sin(t * 2 + i * 1.3) * 4;
      d += `<rect x="${n(cx - w / 2 + wob)}" y="${n(y)}" width="${n(w * (0.7 + 0.3 * Math.sin(i * 2.1)))}" height="4" fill="${color}" opacity="${op}"/>`;
    }
    return d;
  };
  if (towers) TOWERS.forEach(([x, w]) => { s += refl(tx + (x + w / 2) * ts, w * ts, mode === 'night' ? P.windowLit : mode === 'dusk' ? '#8a90a6' : T.towerStripe, mode === 'day' ? 0.55 : 0.35); });
  if (light && !towers) TOWERS.forEach(([x, w]) => { s += refl(tx + (x + w / 2) * ts, 40 * ts, T.beam, 0.35); });
  if (mode !== 'day') {
    const r = rng(77);
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = y0 + 6 + r() * (y1 - y0 - 12);
      s += `<rect x="${n(x + Math.sin(t * 1.5 + i) * 3)}" y="${n(y)}" width="${n(6 + r() * 14)}" height="3" fill="${P.windowLit}" opacity="${n(0.25 + r() * 0.3)}"/>`;
    }
  }
  for (let k = 0; k < 6; k++) {
    const y = y0 + 10 + k * k * 4 + k * 6;
    if (y > y1 - 4) break;
    const dash = 30 + k * 12, gap = 50 + k * 16;
    s += `<path d="M0 ${n(y)} H${W}" stroke="${line}" stroke-width="${2 + k * 0.4}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${n(-(t * (8 + k * 3)) % (dash + gap) - k * 37)}" opacity=".7"/>`;
  }
  return s + `<path d="M0 ${y0} H${W}" stroke="${P.ink}" stroke-width="3" opacity=".6"/>`;
}

// ---------- the pentagon geometry ----------
const pent = (cx, cy, r, sy = 0.5) => Array.from({ length: 5 }, (_, i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a) * sy]; });

// ---------- a (simplified) contiguous-US outline, lon/lat pairs ----------
const US = [[-124.7, 48.4], [-123, 49], [-95, 49], [-95, 49.4], [-89.5, 48], [-84.5, 46.5], [-82.5, 45.3], [-82.4, 43], [-79, 43.4], [-76.5, 44], [-75, 45], [-71.5, 45], [-69.2, 47.4], [-67.8, 47], [-67, 44.8], [-70, 43.7], [-70.6, 42.6], [-70, 41.7], [-71.5, 41.4], [-74, 40.6], [-74, 39.5], [-75.5, 38.5], [-76, 37], [-75.7, 35.5], [-77, 34.6], [-79, 33.5], [-81, 32], [-81.5, 30.5], [-80.5, 28.5], [-80, 26.8], [-80.4, 25.2], [-81.2, 25.4], [-82, 26.8], [-82.8, 28], [-82.7, 29.5], [-84, 30.1], [-86, 30.4], [-88, 30.4], [-89.5, 30.2], [-89.5, 29.2], [-90.5, 29.1], [-93.5, 29.7], [-95, 29.2], [-97, 27.8], [-97.4, 26], [-99, 26.5], [-100.5, 28.5], [-101.5, 29.8], [-103, 29], [-104.5, 29.7], [-106.5, 31.8], [-108.2, 31.8], [-108.2, 31.3], [-111, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.5], [-121.9, 36.5], [-122.5, 37.8], [-123.8, 39.5], [-124.3, 41], [-124, 43.5], [-124, 46.3]];
const usXY = (x, y, w, h) => ([lon, lat]) => [x + ((lon + 125) / 58) * w, y + ((49.6 - lat) / 25) * h];

// Radar scope: bezel, range rings, rotating sweep with a fading trail, blips that brighten as the sweep passes.
function scope(cx, cy, r, t, seed = 1) {
  const ang = ((t * 90 + seed * 77) % 360);
  const rad = (d) => (d * Math.PI) / 180;
  const wedge = (a0, a1, op) => `<path d="M${cx} ${cy} L${n(cx + Math.cos(rad(a0)) * r)} ${n(cy + Math.sin(rad(a0)) * r)} A${r} ${r} 0 0 1 ${n(cx + Math.cos(rad(a1)) * r)} ${n(cy + Math.sin(rad(a1)) * r)} Z" fill="${T.scope}" opacity="${op}"/>`;
  let trail = '';
  for (let k = 0; k < 6; k++) trail += wedge(ang - 10 * (k + 1), ang - 10 * k, n(0.32 - k * 0.05));
  const rr = rng(seed * 31);
  let blips = '';
  for (let i = 0; i < 6; i++) {
    const ba = rr() * 360, bd = 0.25 + rr() * 0.65;
    const since = ((ang - ba) % 360 + 360) % 360; // degrees since the sweep passed
    const b = Math.max(0.25, 1 - since / 300);
    blips += `<circle cx="${n(cx + Math.cos(rad(ba)) * r * bd)}" cy="${n(cy + Math.sin(rad(ba)) * r * bd)}" r="3.2" fill="#d6f0c8" opacity="${n(b)}"/>`;
  }
  return `<g>
    ${pool(cx, cy, r * 1.3, r * 1.3, 0.12, T.scope)}
    <circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="${T.console}" stroke="${P.ink}" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${T.scopeBg}" stroke="${P.ink}" stroke-width="3"/>
    ${[0.33, 0.66].map((f) => `<circle cx="${cx}" cy="${cy}" r="${n(r * f)}" fill="none" stroke="${T.scope}" stroke-width="1.5" opacity=".45"/>`).join('')}
    <path d="M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r}" stroke="${T.scope}" stroke-width="1.2" opacity=".35"/>
    ${trail}
    <path d="M${cx} ${cy} L${n(cx + Math.cos(rad(ang)) * r)} ${n(cy + Math.sin(rad(ang)) * r)}" stroke="#cfeec0" stroke-width="2.5"/>
    ${blips}
  </g>`;
}

// Headset lying on a desk.
const headset = (x, y, s = 1) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><path d="M-22 0 Q-24 -34 0 -36 Q24 -34 22 0" fill="none" stroke="${P.ink}" stroke-width="5"/><rect x="-30" y="-12" width="14" height="18" rx="5" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="2.5"/><rect x="16" y="-12" width="14" height="18" rx="5" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="2.5"/><path d="M-24 4 Q-30 14 -14 16" fill="none" stroke="${P.ink}" stroke-width="2.5"/><circle cx="-12" cy="16" r="3" fill="${P.ink}"/></g>`;

// Candle with a flickering flame (pure in t).
const candle = (x, y, t, i = 0, s = 1) => {
  const fl = 1 + 0.12 * Math.sin(t * 11 + i * 2.3) + 0.06 * Math.sin(t * 23 + i);
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">${pool(0, -20, 22, 18, 0.35)}
    <rect x="-5" y="-16" width="10" height="16" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>
    <ellipse cx="0" cy="${n(-22 - 2 * fl)}" rx="3.6" ry="${n(6 * fl)}" fill="${P.gold}" stroke="${P.ink}" stroke-width="1.2"/>
    <ellipse cx="0" cy="${n(-21 - 1.5 * fl)}" rx="1.5" ry="${n(3 * fl)}" fill="${P.paper}"/></g>`;
};
const rose = (x, y, rot = -8) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${rot})"><path d="M0 0 H-26" stroke="${P.greenDark}" stroke-width="2.5"/><path d="M-14 0 q-4 -6 -9 -5" stroke="${P.greenDark}" stroke-width="2" fill="none"/><circle cx="4" cy="-1" r="6" fill="#f7f3ea" stroke="${P.ink}" stroke-width="1.5"/><path d="M1 -2 q3 -3 6 0" stroke="${P.ink}" stroke-width="1" fill="none"/></g>`;

// Reflecting pool in 3/4 view: bronze parapet, water falling down the inner walls into the pool, a central void.
function reflectingPool(id, nl, nr, ny, fy, t, night) {
  const k = 0.62;
  const far = (x) => 640 + (x - 640) * k;
  const outer = [[far(nl), fy], [far(nr), fy], [nr, ny], [nl, ny]];
  const inner = shrink(outer, 0.06, 2);
  const floor = shrink(inner, 0.05, 44);
  const voidO = shrink(floor, 0.68, 2);
  const voidF = shrink(voidO, 0.08, 16);
  const top = Math.min(...inner.map((p) => p[1])), bot = Math.max(...inner.map((p) => p[1]));
  const x0 = Math.min(...inner.map((p) => p[0])), x1 = Math.max(...inner.map((p) => p[0]));
  const off = n(-((t * 46) % 19));
  // (dash pattern period is 19: 16 + 3)
  let streaks = '';
  for (let x = x0 + 3; x < x1; x += 6) streaks += `<path d="M${n(x)} ${n(top)} V${n(bot)}" stroke="${T.foam}" stroke-width="2" stroke-dasharray="16 3" stroke-dashoffset="${off}" opacity="${night ? 0.75 : 0.6}"/>`;
  const vt = Math.min(...voidO.map((p) => p[1])), vb = Math.max(...voidO.map((p) => p[1]));
  const vx0 = Math.min(...voidO.map((p) => p[0])), vx1 = Math.max(...voidO.map((p) => p[0]));
  let vstreaks = '';
  for (let x = vx0 + 2; x < vx1; x += 5) vstreaks += `<path d="M${n(x)} ${n(vt)} V${n(vb)}" stroke="${T.foam}" stroke-width="1.6" stroke-dasharray="7 5" stroke-dashoffset="${off}" opacity=".55"/>`;
  const water = night ? '#3f6470' : T.waterPool;
  let ripples = '';
  const fT = Math.min(...floor.map((p) => p[1])), fB = Math.max(...floor.map((p) => p[1]));
  for (let i = 0; i < 4; i++) {
    const y = fT + 8 + i * ((fB - fT - 12) / 4);
    ripples += `<path d="M${n(x0)} ${n(y)} H${n(x1)}" stroke="${night ? '#7fa3ad' : '#7d939b'}" stroke-width="2" stroke-dasharray="22 30" stroke-dashoffset="${n(-(t * 10) - i * 17)}" opacity=".6"/>`;
  }
  return `<g>
    <defs><clipPath id="${id}i"><polygon points="${ptsStr(inner)}"/></clipPath><clipPath id="${id}v"><polygon points="${ptsStr(voidO)}"/></clipPath></defs>
    ${poly([[nl, ny], [nr, ny], [nr, ny + 20], [nl, ny + 20]], `fill="${night ? '#2a3038' : T.granite}" ${o(3)}`)}
    ${poly(outer, `fill="${T.bronze}" ${o(4)}`)}
    ${poly(outer.slice(0, 2).concat(inner.slice(0, 2).reverse()), `fill="#5e5246" opacity=".6"`)}
    <g clip-path="url(#${id}i)">
      <rect x="${n(x0 - 5)}" y="${n(top - 5)}" width="${n(x1 - x0 + 10)}" height="${n(bot - top + 10)}" fill="${night ? '#4a5a62' : T.granite}"/>${streaks}
      ${poly(floor, `fill="${water}"`)}${ripples}
      <path d="M${ptsStr([floor[0], floor[1]]).replace(' ', ' L')}" stroke="${T.foam}" stroke-width="4" opacity=".8" fill="none"/>
      ${poly(voidO, `fill="${night ? '#33454d' : T.granite}" stroke="${T.foam}" stroke-width="2.5"`)}
      <g clip-path="url(#${id}v)">${vstreaks}${poly(voidF, `fill="${T.waterDeep}"`)}</g>
      ${night ? pool(...centroid(floor), (x1 - x0) * 0.45, (bot - top) * 0.35, 0.14, T.foam) : ''}
    </g>
    ${poly(inner, `fill="none" stroke="${P.ink}" stroke-width="3"`)}
    ${[0.25, 0.5, 0.75].map((f) => { const a = lerpPt(outer[3], outer[2], f), b = lerpPt(inner[3], inner[2], f); return `<path d="M${n(a[0])} ${n(a[1])} L${n(b[0])} ${n(b[1])}" stroke="${P.ink}" stroke-width="1.5" opacity=".5"/>`; }).join('')}
  </g>`;
}

// Theatre seat row seen from behind, with backs of heads (deterministic).
function seatRow(y, w, h, seed, { x0 = 40, x1 = 1240, fillP = 0.55 } = {}) {
  const r = rng(seed);
  const hairs = ['#4a4038', '#2f2a26', P.greyLight, '#6b3f2a', '#3a2d25', '#d8c08a', P.skin];
  let s = '', heads = '';
  for (let x = x0; x + w <= x1 + 1; x += w + 6) {
    if (r() < fillP) {
      const hr = w * 0.42, hx = x + w / 2 + (r() - 0.5) * 6;
      const c = hairs[Math.floor(r() * hairs.length)];
      heads += `<path d="M${n(hx - hr * 0.8)} ${n(y + 4)} Q${n(hx)} ${n(y - hr * 0.5)} ${n(hx + hr * 0.8)} ${n(y + 4)} Z" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="2.5"/>`
        + `<circle cx="${n(hx)}" cy="${n(y - hr * 0.55)}" r="${n(hr)}" fill="${c}" stroke="${P.ink}" stroke-width="3"/>`;
    }
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(w * 0.22)}" fill="${P.redDark}" stroke="${P.ink}" stroke-width="3"/><path d="M${n(x + 6)} ${n(y + 8)} H${n(x + w - 6)}" stroke="#a5453a" stroke-width="3" opacity=".7"/>`;
  }
  return heads + s;
}

// Photographer at the rope line: a bust with a camera held to the face; flash fires on a deterministic schedule.
function photographer(x, base, s, t, i) {
  const r = rng(500 + i * 13);
  const period = 0.9 + r() * 0.9, phase = r() * period;
  const ph = (t + phase) % period;
  const on = ph < 0.1;
  const fy = base - 152 * s, fx = x + (i % 2 ? -8 : 8) * s;
  return crowd(700 + i * 7, 1, 1, x - 1, base, 2, 0, s)
    + `<g transform="translate(${n(fx)} ${n(fy)}) scale(${n(s)})">
      <rect x="-34" y="-24" width="68" height="44" rx="6" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="3.5"/>
      <circle cx="0" cy="0" r="15" fill="${P.ink}" stroke="${P.greyDark}" stroke-width="4"/><circle cx="-4" cy="-4" r="4" fill="${P.greyLight}" opacity=".7"/>
      <rect x="10" y="-46" width="24" height="20" rx="3" fill="${on ? P.bubble : P.greyLight}" stroke="${P.ink}" stroke-width="3"/>
      ${on ? `<circle cx="22" cy="-38" r="60" fill="${P.bubble}" opacity=".55" filter="url(#glow)"/>${[0, 45, 90, 135].map((a) => `<path d="M${n(22 - Math.cos(a * Math.PI / 180) * 46)} ${n(-38 - Math.sin(a * Math.PI / 180) * 46)} L${n(22 + Math.cos(a * Math.PI / 180) * 46)} ${n(-38 + Math.sin(a * Math.PI / 180) * 46)}" stroke="${P.bubble}" stroke-width="4" stroke-linecap="round" opacity=".9"/>`).join('')}<circle cx="22" cy="-38" r="16" fill="#fff"/>` : ''}
    </g>`;
}

// ====================================================================================================== SETS
const SETS = {
  // ------------------------------------------------------------------ Lower Manhattan skyline across the river
  skylineWTC: {
    mood: 'day',
    draw(t, { towers = true, dusk = false, night = false, light = false } = {}) {
      const mode = night || light ? 'night' : dusk ? 'dusk' : 'day';
      const RV = 470;
      const pave = mode === 'day' ? T.paving : mode === 'dusk' ? '#8d8a8e' : T.pavingNight;
      return sky(mode, 'hsWtc', 1080, 430) + (mode === 'day' ? clouds(21, t) : '')
        + `<g transform="translate(0 ${RV})">${manhattan(t, { towers, mode, light })}</g>`
        + river(t, RV, 612, mode, { towers, light })
        // promenade: railing at the water's edge (behind people), paving, lamps
        + `<rect y="612" width="${W}" height="${H - 612}" fill="${pave}"/><path d="M0 612 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + `<path d="M0 660 H${W} M0 700 H${W}" stroke="${mode === 'day' ? T.pavingDark : '#3a4252'}" stroke-width="2"/>`
        + `<path d="M0 586 H${W}" stroke="${P.ink}" stroke-width="7"/><path d="M0 586 H${W}" stroke="${mode === 'day' ? P.greyDark : '#4a5466'}" stroke-width="3"/>`
        + Array.from({ length: 33 }, (_, i) => `<path d="M${i * 40 + 8} 588 V612" stroke="${P.ink}" stroke-width="4"/>`).join('')
        + props.streetLamp(255, 640, { on: mode !== 'day' }) + props.streetLamp(1015, 640, { on: mode !== 'day' });
    },
    front: () => '',
    spots: { farLeft: [110, 704, 0.6], left: [400, 700, 0.62], center: [640, 706, 0.62], right: [880, 700, 0.62], farRight: [1170, 704, 0.6] },
    close: { fx: 640, fy: 560, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ the Pentagon (aerial 3/4, intact, day)
  pentagon: {
    mood: 'day',
    draw(t) {
      const cx = 640, cy = 398, R = 300, WH = 34;
      const outer = pent(cx, cy, R);
      const down = (p, d = WH) => [p[0], p[1] + d];
      // far bank: river, low trees, a hazy far city
      let s = daySky('hsPgSky') + clouds(4, t, { count: 3, yMax: 30 })
        + props.skyline(12, 128, { color: '#b9c2c0', minH: 10, maxH: 46, minW: 20, maxW: 50, lit: 0 })
        + `<rect y="126" width="${W}" height="28" fill="${T.riverDay}"/><path d="M0 126 H${W}" stroke="${P.ink}" stroke-width="2" opacity=".5"/>`
        + `<rect y="152" width="${W}" height="${H - 152}" fill="${T.grass}"/><path d="M0 152 H${W}" stroke="${P.ink}" stroke-width="3"/>`;
      for (let i = 0; i < 7; i++) s += `<rect y="${166 + i * 80}" width="${W}" height="40" fill="${T.grassLight}" opacity=".35"/>`;
      // ring road + highway, with cars moving in t
      s += `<ellipse cx="${cx}" cy="${cy + 10}" rx="580" ry="232" fill="none" stroke="${P.ink}" stroke-width="28" opacity=".85"/><ellipse cx="${cx}" cy="${cy + 10}" rx="580" ry="232" fill="none" stroke="${T.asphalt}" stroke-width="22"/>
        <ellipse cx="${cx}" cy="${cy + 10}" rx="580" ry="232" fill="none" stroke="${P.paperDim}" stroke-width="2" stroke-dasharray="14 12"/>
        <path d="M-10 250 Q200 170 420 176" fill="none" stroke="${P.ink}" stroke-width="24" opacity=".85"/><path d="M-10 250 Q200 170 420 176" fill="none" stroke="${T.asphalt}" stroke-width="18"/>
        <rect x="-10" y="664" width="${W + 20}" height="46" fill="${T.asphalt}" ${o(3)}/><path d="M0 687 H${W}" stroke="${P.paperDim}" stroke-width="2.5" stroke-dasharray="20 16"/>`;
      // parking lots
      const lot = (x, y, w, h, seed) => {
        const r = rng(seed);
        let l = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8e908c" ${o(3)}/>`;
        for (let row = 0; row < Math.floor(h / 34); row++) {
          const yy = y + 8 + row * 34;
          l += `<path d="M${x + 6} ${yy + 22} H${x + w - 6}" stroke="${P.paperDim}" stroke-width="1.5" opacity=".8"/>`;
          for (let xx = x + 8; xx < x + w - 12; xx += 14) {
            l += `<path d="M${xx} ${yy} V${yy + 22}" stroke="${P.paperDim}" stroke-width="1.2" opacity=".7"/>`;
            if (r() < 0.62) l += `<rect x="${xx + 2}" y="${yy + 3}" width="10" height="16" rx="2" fill="${[P.red, P.blue, P.greyLight, P.paper, P.navy, P.greyDark, P.goldDark][Math.floor(r() * 7)]}" stroke="${P.ink}" stroke-width="1"/>`;
          }
        }
        return l;
      };
      s += lot(90, 300, 230, 230, 5) + lot(960, 300, 230, 230, 8) + lot(470, 588, 340, 58, 11);
      // tree clumps
      const tr3 = rng(42);
      for (let i = 0; i < 26; i++) {
        const x = tr3() * W, y = 170 + tr3() * 500;
        const dx = (x - cx) / 330, dy = (y - cy) / 190;
        if (dx * dx + dy * dy < 1.35 || (x > 80 && x < 330 && y > 290 && y < 540) || (x > 950 && x < 1200 && y > 290 && y < 540) || (y > 575 && y < 720)) continue;
        s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(10 + tr3() * 8)}" fill="${T.tree}" ${o(2.5)}/>`;
      }
      // cars on the ring and the highway
      for (let i = 0; i < 8; i++) {
        const a = t * 0.1 + i * 0.78;
        const x = cx + 580 * Math.cos(a), y = cy + 10 + 232 * Math.sin(a);
        const deg = (Math.atan2(232 * Math.cos(a), -580 * Math.sin(a)) * 180) / Math.PI;
        s += `<rect x="-8" y="-4" width="16" height="8" rx="2" transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})" fill="${[P.paper, P.red, P.blue, P.greyLight][i % 4]}" stroke="${P.ink}" stroke-width="1.5"/>`;
      }
      for (let i = 0; i < 7; i++) {
        const x1 = ((i * 200 + t * 70) % 1400) - 60, x2 = 1340 - ((i * 210 + 90 + t * 60) % 1400);
        s += `<rect x="${n(x1)}" y="694" width="22" height="10" rx="2" fill="${[P.paper, P.red, P.blue][i % 3]}" stroke="${P.ink}" stroke-width="1.5"/><rect x="${n(x2)}" y="670" width="22" height="10" rx="2" fill="${[P.greyLight, P.navy, P.gold][i % 3]}" stroke="${P.ink}" stroke-width="1.5"/>`;
      }
      // the building: shadow, facades on the three visible sides, roof rings, courtyard
      s += poly(outer.map((p) => [p[0] + 22, p[1] + WH + 16]), `fill="${P.greenDark}" opacity=".35"`);
      [[1, 2, T.stoneShade], [2, 3, T.stone], [3, 4, T.stoneDark]].forEach(([a, b, c]) => {
        const A = outer[a], B = outer[b];
        s += poly([A, B, down(B), down(A)], `fill="${c}" ${o(3)}`);
        [9, 17, 25].forEach((yy) => { s += `<path d="M${n(A[0])} ${n(A[1] + yy)} L${n(B[0])} ${n(B[1] + yy)}" stroke="${P.inkSoft}" stroke-width="3" stroke-dasharray="7 5" opacity=".75"/>`; });
      });
      s += poly(outer, `fill="${T.roof}" ${o(4)}`);
      [0.9, 0.8, 0.7, 0.6].forEach((k) => { s += poly(pent(cx, cy, R * k), `fill="none" stroke="${T.lightwell}" stroke-width="5"`); });
      const court = pent(cx, cy, R * 0.5);
      outer.forEach((p, i) => { s += `<path d="M${n(court[i][0])} ${n(court[i][1])} L${n(p[0])} ${n(p[1])}" stroke="${T.roofDark}" stroke-width="3"/>`; });
      const courtGround = court.map((p) => [p[0], p[1] + 16]);
      s += `<defs><clipPath id="hsPgCourt"><polygon points="${ptsStr(court)}"/></clipPath></defs>`
        + poly(court, `fill="${T.stoneDark}"`)
        + `<g clip-path="url(#hsPgCourt)">${poly(courtGround, `fill="${T.grass}"`)}
            ${[[-60, 0], [50, -14], [-10, 34], [70, 30], [-80, 30], [10, -30]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + 10 + dy}" r="11" fill="${T.tree}" ${o(2)}/>`).join('')}
            <path d="M${cx - 150} ${cy + 10} H${cx + 150} M${cx} ${cy - 70} V${cy + 90}" stroke="${P.paperDim}" stroke-width="3"/>
            ${poly(pent(cx, cy + 12, 22), `fill="${T.roof}" ${o(2)}`)}</g>`
        + poly(court, `fill="none" ${o(3)}`);
      return s;
    },
    front: () => '',
    // Aerial view: people would be out of scale. Spots exist for the interface; prefer no cast (or a 'compose' overlay).
    spots: { farLeft: [140, 712, 0.4], left: [360, 712, 0.4], center: [640, 712, 0.4], right: [920, 712, 0.4], farRight: [1140, 712, 0.4] },
    close: { fx: 640, fy: 400, zoom: 1.5 },
  },

  // ------------------------------------------------------------------ memorial reflecting pools
  memorial: {
    mood: 'day',
    draw(t, { night = false, light } = {}) {
      const beams = light != null ? light : night;
      let s = night ? props.nightSky(14, { moonX: 1150, moonY: 80 }) : daySky('hsMemSky') + clouds(6, t, { count: 3 });
      if (beams) {
        const sh = 0.92 + 0.08 * Math.sin(t * 1.7);
        s += grad('hsMemBeam', [[0, T.beam, 0.02], [0.6, T.beam, 0.3], [1, T.beam, 0.75]])
          + [560, 720].map((cx) => `<polygon points="${cx - 44},-10 ${cx + 44},-10 ${cx + 20},340 ${cx - 20},340" fill="url(#hsMemBeam)" opacity="${n(0.55 * sh)}" filter="url(#glow)"/><polygon points="${cx - 28},-10 ${cx + 28},-10 ${cx + 11},340 ${cx - 11},340" fill="url(#hsMemBeam)" opacity="${n(sh)}"/>`).join('');
      }
      s += props.skyline(23, 360, { color: night ? P.night : T.cityDay, minH: 60, maxH: 230, lit: night ? 0.12 : 0 });
      // trees behind the pools: far row then near row
      const tc = night ? T.treeNight : T.tree, tc2 = night ? '#24322e' : T.treeDark;
      for (let x = -20; x < W + 40; x += 64) s += tree(x, 372, 0.42, { color: tc2 });
      s += `<rect y="352" width="${W}" height="${H - 352}" fill="${night ? T.pavingNight : T.paving}"/>`;
      for (let x = 10; x < W + 40; x += 92) s += tree(x + ((x / 92) % 2) * 20, 420, 0.55, { color: tc });
      // paving joints converging to a vanishing point
      const jc = night ? '#394152' : T.pavingDark;
      for (let i = -12; i <= 12; i++) s += `<path d="M${n(640 + i * 120)} 720 L${n(640 + i * 120 * 0.3)} 420" stroke="${jc}" stroke-width="2"/>`;
      [430, 446, 470, 505, 552, 612, 690].forEach((y) => { s += `<path d="M0 ${y} H${W}" stroke="${jc}" stroke-width="2"/>`; });
      s += reflectingPool('hsPoolA', 40, 570, 600, 445, t, night) + reflectingPool('hsPoolB', 710, 1240, 600, 445, t, night);
      // candles and white roses on the near parapets
      s += candle(150, 598, t, 0) + candle(176, 600, t, 1, 0.85) + candle(470, 598, t, 2) + candle(840, 598, t, 3) + candle(1110, 598, t, 4) + candle(1134, 600, t, 5, 0.85)
        + rose(330, 594) + rose(980, 594, 6);
      if (night) s += pool(640, 600, 640, 60, 0.08, T.foam);
      return s;
    },
    front: () => '',
    spots: { farLeft: [110, 710, 0.7], left: [330, 704, 0.72], center: [640, 708, 0.72], right: [950, 704, 0.72], farRight: [1170, 710, 0.7] },
    close: { fx: 640, fy: 480, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ rural Pennsylvania field
  fieldPA: {
    mood: 'day',
    draw(t) {
      let s = daySky('hsPaSky') + clouds(17, t, { count: 5, yMax: 160 })
        + `<path d="M0 330 Q300 286 640 318 Q960 344 1280 300 V460 H0 Z" fill="${T.haze}"/>`
        + `<path d="M0 392 Q330 350 700 378 Q1000 400 1280 366 V500 H0 Z" fill="${T.grassDark}" ${o(3)}/>`;
      // tree line along the mid hill: merged blobs (outline pass + fill pass)
      const hill = (x) => (x < 700 ? 392 + (378 - 392) * (x / 700) - 30 * Math.sin((x / 700) * Math.PI) : 378 + (366 - 378) * ((x - 700) / 580) + 14 * Math.sin(((x - 700) / 580) * Math.PI));
      const r = rng(64);
      const blobs = [];
      for (let x = -10; x < W + 20; x += 22) blobs.push([x, hill(x) - 8 - r() * 10, 16 + r() * 14]);
      s += blobs.map(([x, y, rr]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rr)}" fill="${P.ink}" stroke="${P.ink}" stroke-width="5"/>`).join('')
        + blobs.map(([x, y, rr], i) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rr)}" fill="${i % 3 ? T.treeDark : T.tree}"/>`).join('')
        + `<path d="M0 404 Q330 362 700 390 Q1000 412 1280 378 V500 H0 Z" fill="${T.grassDark}"/>`;
      // the low pale memorial wall in the distance
      s += `<path d="M700 430 L1060 440" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/><path d="M700 430 L1060 440" stroke="#ece6d6" stroke-width="7" stroke-linecap="round"/>`
        + Array.from({ length: 12 }, (_, i) => { const x = 712 + i * 29; return `<path d="M${x} ${n(427 + i * 0.8)} V${n(434 + i * 0.8)}" stroke="${P.ink}" stroke-width="1" opacity=".5"/>`; }).join('')
        + `<path d="M690 440 L1080 452" stroke="${P.paperShade}" stroke-width="3" opacity=".8"/>`
        + `<path d="M1080 448 V398" stroke="${P.ink}" stroke-width="2"/><rect x="1081" y="398" width="16" height="10" fill="${P.blue}" stroke="${P.ink}" stroke-width="1.2"/>`;
      // near rolling field with crop stripes
      s += `<path d="M0 470 Q420 420 820 462 Q1060 486 1280 450 V720 H0 Z" fill="${T.grass}" ${o(4)}/>`;
      for (let k = 1; k < 9; k++) s += `<path d="M0 ${470 + k * k * 4} Q420 ${420 + k * k * 4.4} 820 ${462 + k * k * 4} Q1060 ${486 + k * k * 3.6} 1280 ${450 + k * k * 4}" fill="none" stroke="${k % 2 ? T.grassLight : T.grassDark}" stroke-width="${2 + k * 0.8}" opacity=".55"/>`;
      // a split-rail fence on the mid field
      s += `<path d="M90 520 L520 488" stroke="${P.woodMid}" stroke-width="4"/><path d="M90 536 L520 504" stroke="${P.woodMid}" stroke-width="4"/>`
        + Array.from({ length: 9 }, (_, i) => { const x = 90 + i * 54, y = 520 - i * 4; return `<path d="M${x} ${y - 8} V${y + 26}" stroke="${P.ink}" stroke-width="4"/>`; }).join('');
      // gravel path winding to the wall
      s += `<path d="M540 722 Q600 600 700 520 Q760 470 780 446 L804 448 Q800 480 760 530 Q700 610 780 722 Z" fill="${P.paperShade}" ${o(3)}/>`;
      // hemlocks at the right, a tree at the left
      s += conifer(1160, 650, 1.35) + conifer(1250, 600, 1.05) + tree(40, 560, 1.05);
      // wildflowers that sway gently
      const fr = rng(88);
      for (let i = 0; i < 70; i++) {
        const x = fr() * W, y = 560 + fr() * 160;
        if (x > 500 && x < 820 && y > 600) continue;
        const sway = Math.sin(t * 1.6 + i) * 2.5, hgt = 10 + fr() * 12;
        const c = [P.gold, P.paper, P.blush][Math.floor(fr() * 3)];
        s += `<path d="M${n(x)} ${n(y)} Q${n(x + sway * 0.5)} ${n(y - hgt * 0.5)} ${n(x + sway)} ${n(y - hgt)}" stroke="${T.grassDark}" stroke-width="2" fill="none"/><circle cx="${n(x + sway)}" cy="${n(y - hgt)}" r="3.6" fill="${c}" stroke="${P.ink}" stroke-width="1.2"/>`;
      }
      return s;
    },
    front: () => '',
    spots: { farLeft: [170, 706, 0.7], left: [400, 700, 0.72], center: [640, 704, 0.74], right: [900, 700, 0.72], farRight: [1060, 706, 0.7] },
    close: { fx: 640, fy: 500, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ air traffic control / operations room
  controlRoom: {
    mood: 'night',
    draw(t, { mapLabel = '' } = {}) {
      let s = `<rect width="${W}" height="${H}" fill="${T.room}"/>`
        + Array.from({ length: 6 }, (_, i) => `<rect x="${i * 240 + 40}" y="0" width="140" height="10" fill="${P.greyLight}" opacity=".25"/>`).join('')
        + `<rect y="600" width="${W}" height="${H - 600}" fill="${T.roomFloor}"/>`;
      // wall map of the US
      const mx = 340, my = 46, mw = 600, mh = 270;
      const map = US.map(usXY(mx + 34, my + 26, mw - 68, mh - 60));
      s += `<g filter="url(#softShadow)"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="6" fill="#102019" ${o(5)}/></g>`;
      for (let i = 1; i < 10; i++) s += `<path d="M${mx + i * 60} ${my + 4} V${my + mh - 4}" stroke="${T.scope}" stroke-width="1" opacity=".18"/>`;
      for (let j = 1; j < 5; j++) s += `<path d="M${mx + 4} ${my + j * 54} H${mx + mw - 4}" stroke="${T.scope}" stroke-width="1" opacity=".18"/>`;
      s += poly(map, `fill="#1f3a2a" stroke="${T.scope}" stroke-width="3" stroke-linejoin="round"`);
      const br = rng(9);
      for (let i = 0; i < 22; i++) {
        const p = map[Math.floor(br() * map.length)], c = centroid(map);
        const q = lerpPt(c, p, 0.15 + br() * 0.75);
        const on = Math.floor(t * 2 + i * 0.7) % 4 !== 0;
        s += `<circle cx="${n(q[0])}" cy="${n(q[1])}" r="3" fill="#d6f0c8" opacity="${on ? 0.9 : 0.3}"/>`;
      }
      if (mapLabel) s += text(mapLabel, mx + mw / 2, my + mh - 10, { size: 20, anchor: 'middle', fill: T.scope });
      s += pool(640, 180, 380, 150, 0.08, T.scope);
      // status boards with blinking lights on the side walls
      [[40, 70], [1030, 70]].forEach(([x, y], b) => {
        s += `<rect x="${x}" y="${y}" width="210" height="230" rx="4" fill="#232b36" ${o(4)}/>`;
        for (let j = 0; j < 7; j++) {
          s += `<rect x="${x + 16}" y="${y + 18 + j * 30}" width="${n(90 + ((j * 37 + b * 11) % 60))}" height="8" fill="${P.greyDark}"/>`;
          const lit = (Math.floor(t * 1.5 + j * 1.3 + b) % 5) !== 0;
          s += `<circle cx="${x + 186}" cy="${y + 22 + j * 30}" r="6" fill="${lit ? (j === 3 ? P.gold : T.scope) : '#2f3a33'}" stroke="${P.ink}" stroke-width="2"/>`;
        }
      });
      // console bank along the back wall, scopes between the operator spots
      s += `<path d="M0 372 H${W} V600 H0 Z" fill="${T.console}" ${o(4)}/><path d="M0 372 H${W} V392 H0 Z" fill="${T.consoleTop}" ${o(3)}/>`;
      for (let x = 0; x < W; x += 160) s += `<path d="M${x} 392 V600" stroke="${P.ink}" stroke-width="2" opacity=".5"/>`;
      [180, 485, 795, 1100].forEach((x, i) => {
        s += scope(x, 470, 54, t, i + 1);
        for (let k = 0; k < 4; k++) s += `<rect x="${x - 40 + k * 22}" y="548" width="14" height="8" rx="2" fill="${(Math.floor(t * 3 + k + i) % 3) ? P.greyDark : P.gold}" stroke="${P.ink}" stroke-width="1.5"/>`;
      });
      return s + props.clock(1135, 340, t, { r: 22, hour: 8 });
    },
    front(t) {
      let s = `<rect x="-10" y="612" width="${W + 20}" height="22" fill="${T.consoleTop}" ${o(4)}/><rect x="-10" y="634" width="${W + 20}" height="96" fill="${T.console}" ${o(4)}/>`;
      for (let i = 0; i < 26; i++) {
        const x = 30 + i * 48, lit = (Math.floor(t * 2 + i * 0.37 * 7) % 4) === 0;
        s += `<rect x="${x}" y="652" width="26" height="12" rx="2" fill="${lit ? P.gold : P.greyDark}" stroke="${P.ink}" stroke-width="1.5"/><rect x="${x}" y="676" width="26" height="12" rx="2" fill="${(i % 5) ? '#2f3a33' : T.scope}" stroke="${P.ink}" stroke-width="1.5"/>`;
      }
      // headsets, flight strips and a gooseneck mic on the desk
      s += headset(430, 612, 0.9) + headset(1060, 612, 0.9) + headset(170, 612, 0.85);
      [[740, 'a'], [212, 'b']].forEach(([x]) => { s += `<g transform="rotate(-4 ${x} 608)">${[0, 1, 2].map((k) => `<rect x="${x + k * 6}" y="${600 - k * 5}" width="70" height="10" fill="${P.paper}" stroke="${P.ink}" stroke-width="1.5"/>`).join('')}</g>`; });
      s += `<path d="M820 612 Q812 580 840 566" stroke="${P.ink}" stroke-width="4" fill="none"/><circle cx="842" cy="565" r="5" fill="${P.ink}"/>`
        + `<rect x="560" y="596" width="22" height="16" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2"/>`;
      return s;
    },
    spots: { farLeft: [80, 712, 0.85], left: [330, 712, 0.85], center: [640, 712, 0.85], right: [950, 712, 0.85], farRight: [1210, 712, 0.85] },
    close: { fx: 640, fy: 500, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ Oval Office
  ovalOffice: {
    mood: 'day',
    draw(t) {
      let s = `<rect width="${W}" height="${H}" fill="${T.ovalWall}"/>`
        // ceiling (curved crown above), wainscot and floor (curved below)
        + `<path d="M0 0 H${W} V30 Q640 170 0 30 Z" fill="${T.ovalCeil}"/><path d="M0 30 Q640 170 ${W} 30" fill="none" stroke="${P.ink}" stroke-width="5"/><path d="M0 44 Q640 184 ${W} 44" fill="none" stroke="${T.ovalShade}" stroke-width="6"/>`
        + `<path d="M0 590 Q640 250 ${W} 590 L${W} 700 Q640 300 0 700 Z" fill="${T.ovalShade}"/><path d="M0 590 Q640 250 ${W} 590" fill="none" stroke="${P.ink}" stroke-width="4"/>`
        + `<path d="M0 700 Q640 300 ${W} 700 V${H} H0 Z" fill="${T.carpet}"/><path d="M0 700 Q640 300 ${W} 700" fill="none" stroke="${P.ink}" stroke-width="5"/>`;
      // panel mouldings on the curved wall
      [-3, -2, 2, 3].forEach((k) => {
        const x = 640 + k * 150;
        s += `<rect x="${x - 48}" y="${n(150 - Math.abs(k) * 20)}" width="96" height="${n(210 + Math.abs(k) * 10)}" fill="none" stroke="${T.ovalShade}" stroke-width="4"/>`;
      });
      // three tall windows with garden view, drapes, valance
      [[470, 550], [600, 680], [730, 810]].forEach(([a, b]) => {
        const w = b - a;
        s += `<path d="M${a} 400 V160 Q${a + w / 2} 120 ${b} 160 V400 Z" fill="#d6e0dc" ${o(5)}/>`
          + `<path d="M${a} 330 Q${a + w / 2} 310 ${b} 326 V400 H${a} Z" fill="${T.grass}"/>`
          + `<path d="M${a + w / 2} 140 V400 M${a} 240 H${b} M${a} 320 H${b}" stroke="${P.ink}" stroke-width="3"/>`
          + `<path d="M${a} 400 V160 Q${a + w / 2} 120 ${b} 160 V400 Z" fill="none" ${o(5)}/><rect x="${a - 8}" y="400" width="${w + 16}" height="10" fill="${P.paper}" ${o(3)}/>`;
      });
      s += pool(640, 260, 260, 160, 0.18, '#fff');
      const drape = (x, w, dir) => `<path d="M${x} 104 H${x + w} V430 Q${x + w / 2 + dir * 10} 446 ${x} 430 Z" fill="${T.drape}" ${o(4)}/>${[0.3, 0.6].map((f) => `<path d="M${n(x + w * f)} 112 V430" stroke="${P.goldDark}" stroke-width="3"/>`).join('')}`;
      s += drape(406, 56, -1) + drape(818, 56, 1) + `<path d="M396 96 H884 V124 Q640 140 396 124 Z" fill="${T.drape}" ${o(4)}/>`;
      // flags flanking the windows
      s += props.flagPole(352, 604, { h: 340, wave: t * 0.9 }) + props.flagPole(908, 604, { h: 340, kind: 'plain', color: P.blue, wave: t * 0.9 + 1.3 });
      // side walls: a framed landscape, a bookcase, a side table with a lamp
      s += `<g filter="url(#shadow)"><rect x="96" y="170" width="150" height="190" fill="${P.goldDark}" ${o(3)}/><rect x="108" y="182" width="126" height="166" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2"/><path d="M110 300 L150 250 L180 280 L200 262 L232 300 V346 H110 Z" fill="${T.grassDark}"/><circle cx="200" cy="220" r="12" fill="${P.gold}"/></g>`
        + props.bookshelf(1040, 230, 170, 290, 6)
        + `<rect x="1006" y="530" width="230" height="16" fill="${P.wood}" ${o(3)}/>`;
      // rug (mostly behind the desk): oval with a gold border
      s += `<ellipse cx="640" cy="650" rx="560" ry="66" fill="${T.carpet}" stroke="${T.drape}" stroke-width="10"/><ellipse cx="640" cy="650" rx="560" ry="66" fill="none" stroke="${P.ink}" stroke-width="3"/>`;
      return s;
    },
    front() {
      const panel = (x, w) => `<rect x="${x}" y="622" width="${w}" height="98" fill="${P.woodMid}" stroke="${P.woodDark}" stroke-width="4"/><rect x="${x + 14}" y="636" width="${w - 28}" height="70" fill="none" stroke="${P.woodDark}" stroke-width="3"/>`;
      return `<g>
        <rect x="396" y="614" width="488" height="110" fill="${P.woodDeep}" ${o(4)}/>
        ${panel(406, 150)}${panel(724, 150)}
        <rect x="556" y="622" width="168" height="98" fill="${P.wood}" stroke="${P.woodDark}" stroke-width="4"/>
        <circle cx="640" cy="672" r="32" fill="${P.woodMid}" stroke="${P.goldDark}" stroke-width="5"/><circle cx="640" cy="672" r="14" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="2"/>
        <path d="M572 640 Q600 660 600 700 M708 640 Q680 660 680 700" stroke="${P.woodDark}" stroke-width="3" fill="none"/>
        <rect x="380" y="596" width="520" height="22" rx="3" fill="${P.woodMid}" ${o(4)}/>
        ${props.paperStack(452, 584)}
        <rect x="770" y="580" width="36" height="16" rx="3" fill="${P.ink}"/><path d="M772 580 Q788 564 804 580" stroke="${P.ink}" stroke-width="7" fill="none"/>
        <rect x="690" y="586" width="40" height="10" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="2"/><path d="M700 586 L694 566 M718 586 L724 568" stroke="${P.ink}" stroke-width="2.5"/>
      </g>`;
    },
    spots: { desk: [640, 712, 0.9], farLeft: [70, 712, 0.92], left: [220, 712, 0.92], center: [640, 712, 0.9], right: [1080, 712, 0.92], farRight: [1215, 712, 0.92] },
    close: { fx: 640, fy: 470, zoom: 1.7 },
  },

  // ------------------------------------------------------------------ U.S. Capitol exterior
  capitol: {
    mood: 'day',
    draw(t) {
      let s = daySky('hsCapSky') + clouds(31, t, { count: 4, yMax: 120 });
      // the building, drawn in its own frame and shifted down
      let b = '';
      // dome: drum, peristyle, attic, shell, lantern
      b += `<rect x="520" y="250" width="240" height="80" fill="${T.stoneShade}" ${o(4)}/>`
        + `<rect x="538" y="200" width="204" height="100" fill="${T.stoneDark}" ${o(4)}/>`
        + Array.from({ length: 12 }, (_, i) => col(548 + i * 16.7, 204, 298, 8, T.stone, 2)).join('')
        + `<rect x="530" y="188" width="220" height="16" fill="${T.stone}" ${o(3)}/><rect x="556" y="164" width="168" height="26" fill="${T.stone}" ${o(3)}/>`
        + Array.from({ length: 10 }, (_, i) => `<rect x="${566 + i * 15.5}" y="171" width="6" height="12" fill="${T.stoneDark}"/>`).join('')
        + `<path d="M566 166 A74 116 0 0 1 714 166 Z" fill="${T.stone}" ${o(4)}/>`
        + [-3, -2, -1, 0, 1, 2, 3].map((k) => `<path d="M${640 + k * 21} 166 Q${640 + k * 17} 96 640 52" stroke="${T.stoneDark}" stroke-width="2.5" fill="none"/>`).join('')
        + [-2, -1, 0, 1, 2].map((k) => `<ellipse cx="${640 + k * 22}" cy="140" rx="3.5" ry="6" fill="${T.stoneDark}"/>`).join('')
        + `<rect x="626" y="24" width="28" height="32" fill="${T.stone}" ${o(3)}/><path d="M634 24 V56 M646 24 V56" stroke="${T.stoneDark}" stroke-width="2"/><path d="M622 26 Q640 6 658 26 Z" fill="${T.stone}" ${o(3)}/><path d="M640 10 V-4" stroke="${P.ink}" stroke-width="4"/><circle cx="640" cy="-6" r="4" fill="${P.ink}"/>`;
      // wings
      [[130, 480], [800, 1150]].forEach(([a, z]) => {
        const c = (a + z) / 2;
        b += `<rect x="${a}" y="392" width="${z - a}" height="128" fill="${T.stone}" ${o(4)}/><rect x="${a - 6}" y="384" width="${z - a + 12}" height="12" fill="${T.stoneShade}" ${o(3)}/>`;
        for (let x = a + 16; x < z - 16; x += 28) { if (Math.abs(x - c) < 96) continue; b += `<rect x="${x}" y="414" width="12" height="26" fill="${T.glassDark}" stroke="${P.ink}" stroke-width="1.5"/><rect x="${x}" y="462" width="12" height="30" fill="${T.glassDark}" stroke="${P.ink}" stroke-width="1.5"/>`; }
        b += `<rect x="${c - 90}" y="396" width="180" height="124" fill="${T.stoneShade}" ${o(3)}/>` + Array.from({ length: 6 }, (_, i) => col(c - 75 + i * 30, 404, 520, 11, T.stone, 2)).join('')
          + `<path d="M${c - 98} 398 L${c} 362 L${c + 98} 398 Z" fill="${T.stone}" ${o(3)}/>` + smallFlag(c, 362, 0.8);
      });
      // central block with its portico and pediment
      b += `<rect x="480" y="356" width="320" height="164" fill="${T.stone}" ${o(4)}/><rect x="494" y="380" width="292" height="140" fill="${T.stoneShade}" ${o(3)}/>`
        + `<rect x="586" y="440" width="108" height="80" fill="${T.glassDark}" ${o(3)}/>`
        + Array.from({ length: 8 }, (_, i) => col(508 + i * 37.7, 384, 520, 14, T.stone, 2.5)).join('')
        + `<rect x="486" y="356" width="308" height="26" fill="${T.stone}" ${o(3)}/><path d="M486 358 L640 312 L794 358 Z" fill="${T.stone}" ${o(4)}/><path d="M520 350 L640 322 L760 350 Z" fill="none" stroke="${T.stoneDark}" stroke-width="2.5"/>`;
      // terrace and grand stairs
      b += `<rect x="100" y="520" width="1080" height="24" fill="${T.stoneShade}" ${o(3)}/>`
        + Array.from({ length: 5 }, (_, i) => `<rect x="${520 - i * 16}" y="${544 + i * 12}" width="${240 + i * 32}" height="12" fill="${T.stone}" stroke="${P.ink}" stroke-width="2.5"/>`).join('');
      // hill + lawn
      s += `<path d="M0 560 Q320 520 640 540 Q960 520 1280 560 V${H} H0 Z" fill="${T.grass}" ${o(4)}/>`;
      s += `<g transform="translate(0 24)">${b}</g>`;
      s += `<path d="M0 650 Q640 600 ${W} 650 V${H} H0 Z" fill="${T.grassLight}" opacity=".5"/>`
        + `<path d="M540 632 L740 632 L860 722 L420 722 Z" fill="${P.paperShade}" ${o(3)}/>`
        + tree(70, 640, 1.15) + tree(1210, 640, 1.2) + tree(210, 590, 0.75, { color: T.treeDark }) + tree(1070, 590, 0.75, { color: T.treeDark })
        + props.streetLamp(380, 650, { on: false }) + props.streetLamp(870, 650, { on: false });
      return s;
    },
    front: () => '',
    spots: { farLeft: [200, 706, 0.6], left: [420, 702, 0.62], center: [640, 708, 0.62], right: [860, 702, 0.62], farRight: [1080, 706, 0.6] },
    close: { fx: 640, fy: 400, zoom: 1.35 },
  },

  // ------------------------------------------------------------------ federal courthouse exterior
  courthouse: {
    mood: 'day',
    draw(t, { name = 'UNITED STATES COURTHOUSE' } = {}) {
      let s = daySky('hsCtSky') + clouds(12, t)
        + props.skyline(44, 520, { color: T.cityDay, minH: 120, maxH: 320, lit: 0 })
        + `<rect x="110" y="130" width="1060" height="430" fill="${T.stoneShade}" ${o(4)}/><rect x="96" y="118" width="1088" height="22" fill="${T.stone}" ${o(4)}/>`;
      // side wings: tall windows
      [[130, 270], [1010, 1150]].forEach(([a, z]) => {
        for (let x = a + 14; x < z - 20; x += 44) for (let y = 170; y < 520; y += 120) s += `<rect x="${x}" y="${y}" width="24" height="84" fill="${T.glassDark}" stroke="${P.ink}" stroke-width="2.5"/><rect x="${x - 4}" y="${y + 84}" width="32" height="6" fill="${T.stone}" stroke="${P.ink}" stroke-width="1.5"/>`;
      });
      // portico: attic, entablature with the name, columns, doors
      const size = fit(name, 640, 36);
      s += `<rect x="280" y="150" width="720" height="40" fill="${T.stone}" ${o(4)}/>`
        + `<rect x="270" y="190" width="740" height="58" fill="${T.stone}" ${o(4)}/>${text(name, 640, 230, { size, font: 'display', anchor: 'middle', spacing: 3 })}`
        + `<rect x="300" y="248" width="680" height="272" fill="${T.stoneDark}" ${o(4)}/>`
        + [400, 520, 640, 760, 880].map((x) => `<rect x="${x - 36}" y="380" width="72" height="140" fill="${P.woodDark}" ${o(3)}/><path d="M${x} 380 V520" stroke="${P.ink}" stroke-width="2.5"/><rect x="${x - 28}" y="296" width="56" height="60" fill="${T.glassDark}" stroke="${P.ink}" stroke-width="2.5"/>`).join('')
        + Array.from({ length: 8 }, (_, i) => props.column(332 + i * 88, 248, 520, { w: 44, color: T.stone })).join('')
        + `<rect x="270" y="190" width="740" height="58" fill="none" ${o(4)}/>`;
      // steps and plaza
      s += Array.from({ length: 4 }, (_, i) => `<rect x="${250 - i * 22}" y="${520 + i * 20}" width="${780 + i * 44}" height="20" fill="${T.stone}" ${o(3)}/>`).join('')
        + `<rect y="600" width="${W}" height="${H - 600}" fill="${T.paving}"/><path d="M0 600 H${W}" stroke="${P.ink}" stroke-width="4"/><path d="M0 660 H${W}" stroke="${T.pavingDark}" stroke-width="3"/>`
        + props.flagPole(84, 610, { h: 420, wave: t * 1.6 })
        + props.streetLamp(186, 600, { on: false }) + props.streetLamp(1060, 600, { on: false })
        + `<rect x="1150" y="560" width="110" height="46" fill="${T.stoneDark}" ${o(3)}/>` + tree(1205, 566, 0.55);
      return s;
    },
    front: () => '',
    spots: { farLeft: [140, 700, 0.8], left: [340, 700, 0.82], center: [640, 704, 0.82], right: [940, 700, 0.82], farRight: [1150, 702, 0.8] },
    close: { fx: 640, fy: 440, zoom: 1.4 },
  },

  // ------------------------------------------------------------------ film festival (exterior) / screening room (inside)
  cinema: {
    mood: 'night',
    draw(t, { title = 'PREMIERE', festival = 'FILM FESTIVAL', inside = false } = {}) {
      if (inside) {
        let s = `<rect width="${W}" height="${H}" fill="${T.cinemaRoom}"/>`;
        // projector beam from behind the audience
        s += `<polygon points="600,-20 680,-20 1040,400 240,400" fill="${P.paper}" opacity=".05"/>`;
        s += pool(640, 230, 520, 220, 0.14, P.paper);
        s += `<g filter="url(#softShadow)"><rect x="232" y="52" width="816" height="356" fill="${P.ink}"/></g><rect x="240" y="60" width="800" height="340" fill="${P.nightMid}" ${o(3)}/>`
          + `<rect x="240" y="300" width="800" height="100" fill="${P.night}" opacity=".6"/>`
          + text(festival, 640, 120, { size: 24, font: 'hand', fill: P.gold, anchor: 'middle', spacing: 3 })
          + text(title, 640, 200, { size: fit(title, 700, 70), font: 'display', fill: P.paper, anchor: 'middle' })
          + `<path d="M520 222 H760" stroke="${P.gold}" stroke-width="4"/>`;
        // curtains, valance
        const curtain = (x, w) => `<rect x="${x}" y="0" width="${w}" height="470" fill="${P.redDark}" ${o(4)}/>${[0.2, 0.4, 0.6, 0.8].map((f) => `<path d="M${n(x + w * f)} 40 V470" stroke="#6e221c" stroke-width="5"/>`).join('')}`;
        s += curtain(-10, 226) + curtain(1064, 226) + `<path d="M-10 0 H${W + 10} V40 Q640 60 -10 40 Z" fill="${P.redDark}" ${o(4)}/>`;
        // sconces
        [130, 1150].forEach((x) => { s += pool(x, 200, 60, 70, 0.3) + `<path d="M${x - 14} 214 H${x + 14} L${x + 8} 190 H${x - 8} Z" fill="${P.windowLit}" ${o(2.5)}/>`; });
        // stage
        s += `<rect x="180" y="400" width="920" height="14" fill="${P.wood}" ${o(3)}/><rect x="180" y="414" width="920" height="60" fill="${P.woodDark}" ${o(3)}/><rect y="474" width="${W}" height="${H - 474}" fill="#18141a"/>`;
        return s;
      }
      let s = props.nightSky(5, { moonX: 1180, moonY: 40 })
        + `<rect x="0" y="56" width="${W}" height="548" fill="${T.facade}" ${o(4)}/>`;
      for (let y = 80; y < 600; y += 26) s += `<path d="M0 ${y} H${W}" stroke="${T.facadeDark}" stroke-width="2" opacity=".6"/>`;
      // festival banners
      [[54, P.red], [1156, P.gold]].forEach(([x, c]) => { s += `<path d="M${x} 90 H${x + 70} V330 L${x + 35} 304 L${x} 330 Z" fill="${c}" ${o(3)}/><circle cx="${x + 35}" cy="150" r="20" fill="none" stroke="${P.ink}" stroke-width="3"/><path d="M${x + 20} 200 H${x + 50} M${x + 20} 220 H${x + 50}" stroke="${P.ink}" stroke-width="3"/>`; });
      // entrance doors and poster cases
      s += pool(640, 470, 330, 150, 0.22) + `<rect x="400" y="320" width="480" height="284" fill="${T.facadeDark}" ${o(4)}/>`
        + [0, 1, 2, 3].map((i) => `<rect x="${414 + i * 116}" y="334" width="104" height="270" fill="${P.windowLit}" opacity=".85" ${o(3)}/><path d="M${466 + i * 116} 334 V604" stroke="${P.ink}" stroke-width="3"/>`).join('');
      [[176, P.blue], [980, P.green]].forEach(([x, c]) => { s += `<rect x="${x}" y="340" width="124" height="190" fill="${P.goldDark}" ${o(3)}/><rect x="${x + 10}" y="350" width="104" height="170" fill="${c}"/><circle cx="${x + 62}" cy="410" r="28" fill="${P.paper}" opacity=".8"/><path d="M${x + 24} 470 H${x + 100} M${x + 34} 490 H${x + 90}" stroke="${P.paper}" stroke-width="5"/>`; });
      // marquee with chasing bulbs and the title
      const step = Math.floor(t * 6);
      const bulbs = (y) => Array.from({ length: 32 }, (_, i) => `<circle cx="${262 + i * 24}" cy="${y}" r="5" fill="${(i + step) % 3 ? P.windowLit : '#8a7a4a'}" stroke="${P.ink}" stroke-width="1.5"/>`).join('');
      s += `<rect x="460" y="94" width="360" height="44" fill="${P.ink}" ${o(3)}/>${text(festival, 640, 125, { size: fit(festival, 330, 28), font: 'display', fill: P.gold, anchor: 'middle', spacing: 2 })}`
        + pool(640, 210, 420, 90, 0.2)
        + `<rect x="246" y="138" width="788" height="150" fill="${P.goldDark}" ${o(4)}/>${bulbs(150)}${bulbs(276)}`
        + `<rect x="266" y="162" width="748" height="102" fill="${P.paper}" ${o(3)}/>${text(title, 640, 232, { size: fit(title, 700, 62), font: 'display', anchor: 'middle' })}`
        + `<path d="M246 288 L270 312 H1010 L1034 288 Z" fill="${P.ink}"/>`;
      // pavement, red carpet, stanchions and ropes
      s += `<rect y="604" width="${W}" height="${H - 604}" fill="#4a4c52"/><path d="M0 604 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + `<path d="M540 604 L740 604 L900 724 L380 724 Z" fill="${P.red}" ${o(3)}/><path d="M556 604 L404 724 M724 604 L876 724" stroke="${P.redDark}" stroke-width="4"/>`;
      const posts = (x0, x1) => [0, 0.5, 1].map((u) => [x0 + (x1 - x0) * u, 604 + 116 * u, 0.6 + 0.4 * u]);
      [posts(520, 360), posts(760, 920)].forEach((ps) => {
        for (let i = 0; i < ps.length - 1; i++) { const [ax, ay, as] = ps[i], [bx, by, bs] = ps[i + 1]; s += `<path d="M${n(ax)} ${n(ay - 50 * as)} Q${n((ax + bx) / 2)} ${n((ay + by) / 2 - 18)} ${n(bx)} ${n(by - 50 * bs)}" stroke="${P.redDark}" stroke-width="${n(5 * bs)}" fill="none"/>`; }
        ps.forEach(([x, y, k]) => { s += `<path d="M${n(x)} ${n(y)} V${n(y - 56 * k)}" stroke="${P.ink}" stroke-width="${n(8 * k)}"/><path d="M${n(x)} ${n(y)} V${n(y - 56 * k)}" stroke="${P.gold}" stroke-width="${n(4 * k)}"/><circle cx="${n(x)}" cy="${n(y - 58 * k)}" r="${n(6 * k)}" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/>`; });
      });
      return s;
    },
    front(t, { inside = false } = {}) {
      if (inside) return seatRow(500, 56, 40, 3, { x0: 60, x1: 1220 }) + seatRow(560, 70, 52, 5, { x0: 20, x1: 1260 }) + seatRow(640, 92, 90, 9, { x0: -20, x1: 1300, fillP: 0.45 });
      return [[70, 0], [196, 1], [1084, 2], [1210, 3]].map(([x, i]) => photographer(x, 724, 0.78, t, i)).join('');
    },
    // carpet spots (exterior); stage spots (inside: true)
    spots: { farLeft: [450, 640, 0.64], left: [530, 662, 0.7], center: [640, 692, 0.75], right: [750, 662, 0.7], farRight: [830, 640, 0.64],
      stage: [640, 410, 0.58], stageLeft: [420, 410, 0.58], stageRight: [860, 410, 0.58] },
    close: { fx: 640, fy: 420, zoom: 1.45 },
  },

  // ------------------------------------------------------------------ embassy / consulate exterior
  embassy: {
    mood: 'day',
    draw(t, { name = 'EMBASSY', flagColor = P.blue } = {}) {
      let s = daySky('hsEmSky') + clouds(27, t)
        + props.skyline(52, 540, { color: T.cityDay, minH: 100, maxH: 280, lit: 0 })
        + `<rect x="190" y="180" width="900" height="380" fill="${T.stone}" ${o(4)}/><rect x="176" y="164" width="928" height="24" fill="${T.stoneShade}" ${o(4)}/>`;
      for (let x = 216; x < 1070; x += 58) {
        if (x > 470 && x < 800) continue;
        for (let y = 214; y < 520; y += 106) s += `<rect x="${x - 8}" y="${y - 6}" width="44" height="78" fill="${T.stoneShade}" stroke="${P.ink}" stroke-width="2"/><rect x="${x}" y="${y}" width="28" height="64" fill="${T.glassDark}" stroke="${P.ink}" stroke-width="2.5"/><path d="M${x + 14} ${y} V${y + 64}" stroke="${P.ink}" stroke-width="1.5"/>`;
      }
      const size = fit(name, 360, 32);
      s += `<rect x="470" y="180" width="340" height="380" fill="${T.stoneShade}" ${o(3)}/>`
        + `<circle cx="640" cy="210" r="20" fill="none" stroke="${P.goldDark}" stroke-width="5"/><circle cx="640" cy="210" r="8" fill="${P.goldDark}"/>`
        + `<rect x="440" y="236" width="400" height="48" fill="${T.stone}" ${o(3)}/>${text(name, 640, 272, { size, font: 'display', anchor: 'middle', fill: T.bronze, spacing: 2 })}`
        + `<rect x="490" y="292" width="300" height="18" fill="${T.stoneDark}" ${o(3)}/>`
        + `<rect x="544" y="352" width="192" height="208" fill="${T.glassDark}" ${o(3)}/><path d="M640 352 V560 M592 352 V560 M688 352 V560" stroke="${P.ink}" stroke-width="2.5"/>`
        + [516, 588, 692, 764].map((x) => `<rect x="${x - 14}" y="310" width="28" height="250" fill="${T.stone}" ${o(3)}/>`).join('');
      // fence with a gate opening, stone gate posts
      s += `<rect y="560" width="${W}" height="${H - 560}" fill="${T.paving}"/><path d="M0 560 H${W}" stroke="${P.ink}" stroke-width="3"/>`;
      let fence = '';
      for (let x = 6; x < W; x += 20) { if (x > 528 && x < 752) continue; fence += `<path d="M${x} 618 V566" stroke="${T.iron}" stroke-width="4"/><circle cx="${x}" cy="564" r="3.5" fill="${T.iron}"/>`; }
      s += fence + `<path d="M0 578 H530 M750 578 H${W} M0 610 H530 M750 610 H${W}" stroke="${T.iron}" stroke-width="5"/>`
        + [520, 760].map((x) => `<rect x="${x - 18}" y="536" width="36" height="86" fill="${T.stoneShade}" ${o(3)}/><rect x="${x - 24}" y="528" width="48" height="12" fill="${T.stone}" ${o(3)}/>`).join('')
        + `<rect y="618" width="${W}" height="${H - 618}" fill="${T.paving}"/><path d="M0 618 H${W}" stroke="${P.ink}" stroke-width="4"/><path d="M0 680 H${W}" stroke="${T.pavingDark}" stroke-width="3"/>`
        + props.flagPole(130, 618, { h: 470, kind: 'plain', color: flagColor, wave: t * 1.4 })
        + tree(1180, 620, 0.9) + tree(300, 600, 0.6, { color: T.treeDark })
        + [930, 1010, 1090].map((x) => `<rect x="${x - 7}" y="676" width="14" height="30" rx="5" fill="${P.greyDark}" ${o(2.5)}/>`).join('');
      return s;
    },
    front: () => '',
    spots: { farLeft: [60, 708, 0.8], left: [340, 704, 0.82], center: [640, 708, 0.82], right: [920, 704, 0.82], farRight: [1180, 708, 0.8] },
    close: { fx: 640, fy: 460, zoom: 1.5 },
  },

  // ------------------------------------------------------------------ apartment balcony with a distant skyline
  balcony: {
    mood: 'day',
    draw(t, { skyline = 'generic', time = 'day', towers = true, light = false } = {}) {
      const mode = time === 'night' || (skyline === 'wtc' && light && !towers) ? 'night' : time === 'dusk' ? 'dusk' : 'day';
      const HZ = 440, S = 0.6, TX = 900 - 635 * S;
      let s = sky(mode, 'hsBal', 260, 420) + (mode === 'day' ? clouds(3, t, { count: 3, yMax: 120 }) : '');
      const far = mode === 'day' ? '#c1c9c8' : mode === 'dusk' ? '#6c7086' : '#222d40';
      s += props.skyline(skyline === 'wtc' ? 61 : 71, HZ, { color: far, minH: 30, maxH: skyline === 'wtc' ? 80 : 160, minW: 30, maxW: 70, lit: mode === 'night' ? 0.08 : 0 });
      if (skyline === 'wtc') s += `<g transform="translate(${n(TX)} ${HZ}) scale(${S})">${manhattan(t, { towers, mode, light })}</g>`;
      else s += props.skyline(72, HZ, { color: mode === 'day' ? T.cityDayNear : mode === 'dusk' ? T.cityDuskNear : P.night, minH: 60, maxH: 240, lit: mode === 'day' ? 0 : 0.1 });
      s += river(t, HZ, 600, mode, { towers: skyline === 'wtc' && towers, light: skyline === 'wtc' && light, tx: TX, ts: S });
      // balcony: slab above, wall and sliding door at the left, railing, floor
      const wall = mode === 'night' ? '#4a4f5a' : '#b8ae9a', slab = mode === 'night' ? '#3a3e47' : '#9d9483';
      s += `<rect x="-10" y="-10" width="${W + 20}" height="46" fill="${slab}" ${o(4)}/>`
        + `<rect x="-10" y="-10" width="180" height="${H + 20}" fill="${wall}" ${o(4)}/><rect x="40" y="70" width="110" height="530" fill="${mode === 'night' ? P.windowLit : T.glass}" opacity="${mode === 'night' ? 0.7 : 1}" ${o(4)}/><path d="M95 70 V600" stroke="${P.ink}" stroke-width="4"/>`
        + (mode === 'night' ? pool(95, 400, 120, 220, 0.25) : '')
        + `<rect x="170" y="600" width="${W - 160}" height="${H - 600}" fill="${mode === 'night' ? '#3d4049' : '#a89f8e'}"/><path d="M170 600 H${W}" stroke="${P.ink}" stroke-width="4"/>`
        + Array.from({ length: 8 }, (_, i) => `<path d="M${200 + i * 150} 600 L${150 + i * 170} 720" stroke="${P.ink}" stroke-width="2" opacity=".25"/>`).join('');
      let bars = '';
      for (let x = 186; x < W; x += 26) bars += `<path d="M${x} 478 V600" stroke="${P.ink}" stroke-width="4"/>`;
      s += bars + `<rect x="170" y="466" width="${W - 160}" height="14" rx="4" fill="${P.greyDark}" ${o(3)}/><path d="M170 588 H${W}" stroke="${P.ink}" stroke-width="5"/>`
        + props.plant(1205, 690, { s: 0.85 });
      return s;
    },
    front: () => '',
    spots: { farLeft: [250, 712, 0.95], left: [420, 712, 0.95], center: [640, 712, 0.95], right: [860, 712, 0.95], farRight: [1060, 712, 0.95] },
    close: { fx: 640, fy: 480, zoom: 1.6 },
  },

  // ------------------------------------------------------------------ desert-coast city at dusk (generic)
  gulfSkyline: {
    mood: 'night',
    draw(t) {
      const HZ = 470;
      let s = duskSky('hsGulfSky', 300, 430);
      // dunes behind the city at the edges
      s += `<path d="M-10 ${HZ} Q100 410 240 446 Q330 420 430 ${HZ} Z" fill="${T.sandDark}" opacity=".85"/><path d="M900 ${HZ} Q1040 416 1150 444 Q1220 426 1290 ${HZ} Z" fill="${T.sandDark}" opacity=".85"/>`;
      const r = rng(303);
      for (let x = 360; x < 1180;) { const w = 24 + r() * 30, h = 40 + r() * 120; s += `<rect x="${n(x)}" y="${n(HZ - h)}" width="${n(w)}" height="${n(h)}" fill="${T.gulfBack}"/>`; x += w + 2; }
      const towers = [[420, 40, 150, 'flat'], [470, 46, 230, 'slant'], [528, 34, 190, 'round'], [572, 50, 300, 'spire'], [636, 42, 250, 'step'], [690, 36, 180, 'flat'], [736, 54, 330, 'spire'], [804, 40, 220, 'round'], [854, 48, 270, 'slant'], [912, 36, 170, 'flat'], [958, 44, 210, 'step'], [1012, 30, 130, 'flat'], [1050, 40, 160, 'round']];
      const wr = rng(404);
      towers.forEach(([x, w, h, top]) => {
        const y = HZ - h;
        let cap = '';
        if (top === 'spire') cap = `<path d="M${x + 6} ${y} L${x + w / 2} ${y - 44} L${x + w - 6} ${y} Z" fill="${T.gulfFront}" ${o(2.5)}/><path d="M${x + w / 2} ${y - 44} V${y - 80}" stroke="${P.ink}" stroke-width="3"/>`;
        else if (top === 'round') cap = `<path d="M${x} ${y + 2} Q${x + w / 2} ${y - w * 0.7} ${x + w} ${y + 2} Z" fill="${T.gulfFront}" ${o(2.5)}/>`;
        else if (top === 'step') cap = `<rect x="${x + w * 0.15}" y="${y - 20}" width="${w * 0.7}" height="21" fill="${T.gulfFront}" ${o(2.5)}/><rect x="${x + w * 0.32}" y="${y - 36}" width="${w * 0.36}" height="17" fill="${T.gulfFront}" ${o(2.5)}/>`;
        const body = top === 'slant' ? `<path d="M${x} ${HZ} V${y + 24} L${x + w} ${y} V${HZ} Z" fill="${T.gulfFront}" ${o(2.5)}/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.gulfFront}" ${o(2.5)}/>`;
        s += cap + body + `<rect x="${x + 4}" y="${y + 26}" width="5" height="${h - 34}" fill="#8a8196" opacity=".6"/>` + winGrid(wr, x, y + 22, w, h - 22, { prob: 0.13, op: 0.75 });
      });
      // sea with the sun's reflection, a small boat drifting
      s += `<rect y="${HZ}" width="${W}" height="${610 - HZ}" fill="${T.seaDusk}"/><path d="M0 ${HZ} H${W}" stroke="${P.ink}" stroke-width="3" opacity=".6"/>`;
      for (let i = 0; i < 12; i++) { const y = HZ + 8 + i * 11, w = 90 - i * 5 + Math.sin(t * 2 + i) * 8; s += `<rect x="${n(300 - w / 2 + Math.sin(t + i * 1.7) * 6)}" y="${y}" width="${n(w)}" height="4" fill="${T.sun}" opacity="${n(0.7 - i * 0.04)}"/>`; }
      for (let k = 0; k < 5; k++) { const y = HZ + 16 + k * 26; s += `<path d="M0 ${y} H${W}" stroke="#9a9cad" stroke-width="2" stroke-dasharray="${40 + k * 10} ${60 + k * 14}" stroke-dashoffset="${n(-(t * (6 + k * 2)) - k * 40)}" opacity=".6"/>`; }
      const bx = 900 + t * 4;
      s += `<g transform="translate(${n(bx)} 540)"><path d="M-46 0 H46 L34 16 H-36 Z" fill="${P.woodMid}" ${o(2.5)}/><path d="M0 0 V-58" stroke="${P.ink}" stroke-width="3"/><path d="M2 -56 Q30 -30 34 -4 H2 Z" fill="${P.paperDim}" ${o(2)}/></g>`;
      // corniche: low sea wall, paving, palms
      s += `<rect y="598" width="${W}" height="16" fill="${T.sand}" ${o(3)}/><rect y="614" width="${W}" height="${H - 614}" fill="${T.corniche}"/><path d="M0 614 H${W}" stroke="${P.ink}" stroke-width="3"/>`
        + Array.from({ length: 9 }, (_, i) => `<path d="M${i * 160} 614 L${i * 160 - 60} 720" stroke="${T.sandDark}" stroke-width="2"/>`).join('') + `<path d="M0 660 H${W}" stroke="${T.sandDark}" stroke-width="2"/>`
        + palm(110, 650, 1, 1) + palm(1170, 650, 1, -1);
      return s;
    },
    front: () => '',
    spots: { farLeft: [250, 706, 0.66], left: [400, 702, 0.68], center: [640, 706, 0.68], right: [880, 702, 0.68], farRight: [1030, 706, 0.66] },
    close: { fx: 640, fy: 540, zoom: 1.6 },
  },
};

// The screening room as its own set, so 'talk' shots can use center/left/right on the stage.
SETS.cinemaInside = {
  mood: 'night',
  draw: (t, opts = {}) => SETS.cinema.draw(t, { ...opts, inside: true }),
  front: (t, opts = {}) => SETS.cinema.front(t, { ...opts, inside: true }),
  spots: { farLeft: [300, 410, 0.58], left: [440, 410, 0.58], center: [640, 410, 0.58], right: [840, 410, 0.58], farRight: [980, 410, 0.58] },
  close: { fx: 640, fy: 300, zoom: 1.8 },
};

module.exports = { SETS, manhattan };
