// Sets and props. Flat shapes, ink outlines, muted fills, no gradients except skies.
const P = require('./palette');
const { n, text, W, H } = require('./svg');
const { rng, clamp, ease, prog } = require('./motion');

const o = (w = 4) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;

// ---------- interiors ----------
// Office room shell: wall, dado band, floor. Draw furniture on top.
function office({ wall = P.wall, wallDark = P.wallDark, floor = P.floor, dadoY = 430, floorY = 600 } = {}) {
  return `<rect width="${W}" height="${H}" fill="${wall}"/>
    <rect y="${dadoY}" width="${W}" height="${floorY - dadoY}" fill="${wallDark}"/>
    <rect y="${dadoY - 4}" width="${W}" height="10" fill="${P.wallTrim}"/>
    <rect y="${floorY}" width="${W}" height="${H - floorY}" fill="${floor}"/>
    <path d="M0 ${floorY} H${W}" stroke="${P.woodDark}" stroke-width="5" opacity=".6"/>
    <path d="M0 ${floorY + 40} H${W} M0 ${floorY + 80} H${W}" stroke="${P.floorLine}" stroke-width="2"/>`;
}

// Window with a city skyline: daytime by default; night: true gives a dark sky with lit windows.
function windowCity(x, y, w = 360, h = 330, { night = false, seed = 6 } = {}) {
  const b = [[0.05, 0.45, 0.14], [0.2, 0.3, 0.16], [0.39, 0.2, 0.14], [0.56, 0.38, 0.18], [0.76, 0.5, 0.2]];
  const bc = night ? P.night : P.grey;
  const r = rng(seed);
  let lit = '';
  if (night) {
    b.forEach(([bx, by, bw]) => {
      for (let wy = by * h + 12; wy < h - 12; wy += 20) for (let wx = bx * w + 8; wx < (bx + bw) * w - 10; wx += 14) {
        if (r() < 0.4) lit += `<rect x="${n(wx)}" y="${n(wy)}" width="6" height="9" fill="${P.windowLit}" opacity=".85"/>`;
      }
    });
  }
  const blds = b.map(([bx, by, bw]) => `<rect x="${n(bx * w)}" y="${n(by * h)}" width="${n(bw * w)}" height="${n(h - by * h)}" fill="${bc}"/>`).join('');
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" fill="${night ? P.nightMid : '#d9dedd'}"/>
    ${night ? `<circle cx="${n(w * 0.82)}" cy="${n(h * 0.16)}" r="14" fill="${P.moon}"/>` : ''}
    ${blds}${lit}
    <path d="M${n(0.39 * w)} ${n(0.2 * h)} L${n(0.46 * w)} ${n(0.1 * h)} L${n(0.53 * w)} ${n(0.2 * h)} Z" fill="${bc}"/>
    <rect width="${w}" height="${h}" fill="none" stroke="#4e5a54" stroke-width="10"/>
    <path d="M${w / 2} 0 V${h} M0 ${h / 2} H${w}" stroke="#4e5a54" stroke-width="8"/>
    <rect x="-14" y="${h}" width="${w + 28}" height="16" fill="#5d6a63"/>
  </g>`;
}

// Wall clock; minute hand creeps with t so held shots never look frozen.
function clock(x, y, t = 0, { r = 34, hour = 10 } = {}) {
  const m = (t * 6) % 360; // one full minute-hand turn per minute of screen time
  const h = hour * 30 + m / 12;
  return `<g transform="translate(${x} ${y})">
    <circle r="${r}" fill="#f4efe2" stroke="${P.ink}" stroke-width="5"/>
    <path d="M0 0 L0 ${-r * 0.65}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round" transform="rotate(${n(m)})"/>
    <path d="M0 0 L0 ${-r * 0.45}" stroke="${P.ink}" stroke-width="5" stroke-linecap="round" transform="rotate(${n(h)})"/>
    <circle r="3.5" fill="${P.ink}"/>
  </g>`;
}

// Front of a pedestal desk. Draw AFTER characters standing behind it.
function desk(x, y, w = 520) {
  const ped = 160, ph = 110;
  return `<g>
    <rect x="${x + ped}" y="${y + 24}" width="${w - 2 * ped}" height="${ph - 6}" fill="${P.woodDeep}" ${o()}/>
    <rect x="${x}" y="${y}" width="${w}" height="24" fill="${P.woodMid}" stroke="${P.woodDark}" stroke-width="4"/>
    ${[x + 20, x + w - ped - 20].map((px) => `<rect x="${px}" y="${y + 24}" width="${ped}" height="${ph}" fill="${P.wood}" stroke="${P.woodDark}" stroke-width="4"/>
      <path d="M${px} ${y + 24 + ph / 2} H${px + ped}" stroke="${P.woodDark}" stroke-width="3"/>
      <rect x="${px + ped / 2 - 12}" y="${y + 46}" width="24" height="6" rx="3" fill="#d6b56d"/>
      <rect x="${px + ped / 2 - 12}" y="${y + 100}" width="24" height="6" rx="3" fill="#d6b56d"/>`).join('')}
  </g>`;
}

function paperStack(x, y, label) {
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="8" width="120" height="16" fill="#e9e2cf" stroke="${P.ink}" stroke-width="2.5"/>
    <rect x="6" y="-4" width="120" height="14" fill="#efe8d6" stroke="${P.ink}" stroke-width="2.5"/>
    <rect x="-4" y="-14" width="120" height="12" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>
    ${label ? `<g transform="rotate(-6 50 -20)"><rect x="18" y="-30" width="70" height="20" fill="${P.red}" stroke="${P.ink}" stroke-width="2.5"/>${text(label, 53, -14, { size: 17, font: 'display', fill: P.paper, anchor: 'middle' })}</g>` : ''}
  </g>`;
}

function phone(x, y) {
  return `<g transform="translate(${x} ${y})"><rect width="70" height="24" rx="6" fill="${P.ink}"/>
    <path d="M6 0 Q35 -26 64 0" stroke="${P.ink}" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;
}

// ---------- charts ----------
// Partial polyline by progress 0..1 along its length. Returns { d, head:[x,y] }.
function partialLine(pts, k) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let left = total * clamp(k);
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  let head = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (left <= 0) break;
    const f = Math.min(1, left / seg[i - 1]);
    head = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    d += ` L${n(head[0])} ${n(head[1])}`;
    left -= seg[i - 1];
  }
  return { d, head };
}

// Line chart drawn on paper. data = [[xValue, yValue], ...]; k = 0..1 draw progress.
// Draw progress is either k (0..1 of the line's length) or upTo (an x value, e.g. a year).
function lineChart({ x, y, w, h, data, xRange, yRange, k = 1, upTo, title, xLabels = [], color = P.red, note }) {
  const px = (v) => x + 30 + ((v - xRange[0]) / (xRange[1] - xRange[0])) * (w - 60);
  const py = (v) => y + h - 50 - ((v - yRange[0]) / (yRange[1] - yRange[0])) * (h - 110);
  let pts = data.map(([a, b]) => [px(a), py(b)]);
  if (upTo != null) {
    const kept = data.filter(([a]) => a <= upTo);
    if (!kept.length) kept.push(data[0]);
    const nxt = data.find(([a]) => a > upTo);
    const last = kept[kept.length - 1];
    if (nxt && last) kept.push([upTo, last[1] + ((upTo - last[0]) / (nxt[0] - last[0])) * (nxt[1] - last[1])]);
    pts = kept.map(([a, b]) => [px(a), py(b)]);
    k = upTo >= data[data.length - 1][0] ? 1 : 0.9999;
  }
  const { d, head } = partialLine(pts, k);
  const grid = [0.25, 0.5, 0.75].map((f) => `<path d="M${x + 30} ${n(y + 60 + f * (h - 110))} H${x + w - 30}" stroke="${P.paperShade}" stroke-width="1.5"/>`).join('');
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.paper}" ${o(3)}/>
    ${title ? text(title, x + 24, y + 40, { size: Math.min(34, h * 0.09), font: 'display' }) : ''}
    ${grid}
    <path d="M${x + 30} ${y + 56} V${y + h - 50} H${x + w - 30}" fill="none" stroke="${P.ink}" stroke-width="3"/>
    ${xLabels.map(([v, lab]) => text(lab, px(v), y + h - 22, { size: Math.min(24, h * 0.06), anchor: 'middle', fill: P.inkSoft })).join('')}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${Math.max(5, h * 0.016)}" stroke-linejoin="round" stroke-linecap="round"/>
    ${k > 0 && k < 1 ? `<circle cx="${n(head[0])}" cy="${n(head[1])}" r="${Math.max(6, h * 0.016)}" fill="${color}" stroke="${P.ink}" stroke-width="2.5"/>` : ''}
    ${note ? text(note, x + w - 24, y + h + 26, { size: 17, anchor: 'end', fill: P.paperDim }) : ''}
  </g>`;
}

// ---------- exteriors ----------
function nightSky(seed = 3, { moonX = 1080, moonY = 110 } = {}) {
  const r = rng(seed);
  const stars = Array.from({ length: 60 }, () => `<circle cx="${n(r() * W)}" cy="${n(r() * 360)}" r="${n(0.8 + r() * 1.6)}" fill="#fff" opacity="${n(0.25 + r() * 0.5)}"/>`).join('');
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.nightDeep}"/><stop offset="1" stop-color="${P.nightMid}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>${stars}
    <circle cx="${moonX}" cy="${moonY}" r="70" fill="${P.moon}" opacity=".12" filter="url(#glow)"/>
    <circle cx="${moonX}" cy="${moonY}" r="30" fill="${P.moon}"/>`;
}

// Silhouette skyline band. base = y of the ground line.
function skyline(seed, base, { color = P.night, minH = 80, maxH = 260, minW = 50, maxW = 120, lit = 0.08 } = {}) {
  const r = rng(seed);
  let x = -20, out = '';
  while (x < W + 20) {
    const bw = minW + r() * (maxW - minW);
    const bh = minH + r() * (maxH - minH);
    out += `<rect x="${n(x)}" y="${n(base - bh)}" width="${n(bw + 1)}" height="${n(bh)}" fill="${color}"/>`;
    for (let wy = base - bh + 14; wy < base - 14; wy += 22) {
      for (let wx = x + 10; wx < x + bw - 12; wx += 18) {
        if (r() < lit) out += `<rect x="${n(wx)}" y="${n(wy)}" width="7" height="10" fill="${P.windowLit}" opacity=".7"/>`;
      }
    }
    x += bw + 4 + r() * 6;
  }
  return out;
}

// Hero office tower whose windows switch off over time.
// offFrom..offTo: window i goes dark at a random moment in that range (seeded).
function tower(x, y, w, h, t, { seed = 7, offFrom = 0.5, offTo = 5, cols = 9, rows = 16, stayOn = 0.04 } = {}) {
  const r = rng(seed);
  const cw = (w - 30) / cols, ch = (h - 80) / rows;
  let win = '';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const lit0 = r() < 0.82;
      const offAt = r() < stayOn ? 1e9 : offFrom + r() * (offTo - offFrom);
      const lit = lit0 && t < offAt;
      win += `<rect x="${n(x + 18 + i * cw)}" y="${n(y + 50 + j * ch)}" width="${n(cw - 8)}" height="${n(ch - 8)}" fill="${lit ? P.windowLit : P.windowDark}"/>`;
    }
  }
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a3446" ${o(4)}/>
    <rect x="${x - 10}" y="${y - 16}" width="${w + 20}" height="22" fill="#222b3a" ${o(4)}/>
    ${win}
    <rect x="${x + w / 2 - 40}" y="${y + h - 70}" width="80" height="70" fill="${P.windowLit}" opacity=".9" ${o(4)}/>
    <path d="M${x + w / 2} ${y + h - 70} V${y + h}" stroke="${P.ink}" stroke-width="3"/>
  </g>`;
}

function streetLamp(x, base, { on = true } = {}) {
  return `<g>
    ${on ? `<ellipse cx="${x + 34}" cy="${base - 4}" rx="90" ry="16" fill="${P.windowLit}" opacity=".18"/><circle cx="${x + 34}" cy="${base - 196}" r="40" fill="${P.windowLit}" opacity=".22" filter="url(#glow)"/>` : ''}
    <path d="M${x} ${base} V${base - 200} Q${x} ${base - 214} ${x + 16} ${base - 214} H${x + 34}" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M${x + 22} ${base - 214} L${x + 46} ${base - 214} L${x + 40} ${base - 200} L${x + 28} ${base - 200} Z" fill="${on ? P.windowLit : P.grey}" ${o(3)}/>
  </g>`;
}

// Top-down wooden desk surface (documents, evidence boards).
function deskTop(seed = 2) {
  const r = rng(seed);
  const grain = Array.from({ length: 22 }, (_, i) => `<path d="M0 ${n(i * 34 + r() * 10)} Q${n(400 + r() * 200)} ${n(i * 34 + r() * 30 - 10)} ${W} ${n(i * 34 + r() * 14)}" stroke="#6a4430" stroke-width="${n(1 + r() * 2)}" fill="none" opacity=".45"/>`).join('');
  return `<rect width="${W}" height="${H}" fill="#7d5238"/>${grain}`;
}


// ---------- more furniture & fittings (used by lib/sets.js) ----------

// Computer monitor on a stand. kind: 'bars' (red/green ticker bars), 'line', 'text', 'blank'. Animated by t.
function monitor(x, y, w = 110, h = 72, t = 0, { seed = 1, kind = 'bars', glow = true } = {}) {
  const r = rng(seed);
  let screen = '';
  if (kind === 'bars') {
    const nb = 7;
    for (let i = 0; i < nb; i++) {
      const v = 0.25 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 1.7 + seed));
      const up = r() < 0.5;
      const bh = v * (h - 24);
      screen += `<rect x="${n(x + 10 + i * ((w - 20) / nb))}" y="${n(y + h - 8 - bh)}" width="${n((w - 20) / nb - 4)}" height="${n(bh)}" fill="${up ? P.green : P.red}"/>`;
    }
  } else if (kind === 'line') {
    let d = '';
    for (let i = 0; i <= 10; i++) {
      const v = 0.5 + 0.35 * Math.sin(t * 1.1 + i * 0.9 + seed) - i * 0.02;
      d += `${i ? 'L' : 'M'}${n(x + 8 + i * ((w - 16) / 10))} ${n(y + 10 + (1 - v) * (h - 20))}`;
    }
    screen = `<path d="${d}" fill="none" stroke="${P.green}" stroke-width="3"/>`;
  } else if (kind === 'text') {
    for (let i = 0; i < 4; i++) screen += `<rect x="${x + 10}" y="${y + 12 + i * 14}" width="${n((w - 20) * (0.5 + r() * 0.5))}" height="5" fill="${P.greyLight}" opacity=".8"/>`;
  }
  return `<g>
    <rect x="${x + w / 2 - 6}" y="${y + h}" width="12" height="14" fill="${P.charcoal}"/>
    <rect x="${x + w / 2 - 22}" y="${y + h + 12}" width="44" height="6" rx="2" fill="${P.charcoal}"/>
    ${glow ? `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" fill="${P.blue}" opacity=".12" filter="url(#glow)"/>` : ''}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#1d2430" stroke="${P.ink}" stroke-width="4"/>
    ${screen}
  </g>`;
}

// Simple chair seen from the front (seat back above y, legs to y+h).
function chair(x, y, { w = 70, back = 80, color = P.woodMid } = {}) {
  return `<g>
    <rect x="${x - w / 2}" y="${y - back}" width="${w}" height="${back}" rx="8" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>
    <rect x="${x - w / 2 - 6}" y="${y}" width="${w + 12}" height="14" rx="4" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>
    <path d="M${x - w / 2} ${y + 14} V${y + 58} M${x + w / 2} ${y + 14} V${y + 58}" stroke="${P.ink}" stroke-width="5"/>
  </g>`;
}

function plant(x, base, { s = 1 } = {}) {
  const leaf = (a, l) => `<path d="M0 0 Q${n(Math.cos(a) * l * 0.5 - 14)} ${n(-Math.sin(a) * l * 0.6)} ${n(Math.cos(a) * l)} ${n(-Math.sin(a) * l)} Q${n(Math.cos(a) * l * 0.5 + 14)} ${n(-Math.sin(a) * l * 0.4)} 0 0 Z" fill="${P.green}" stroke="${P.ink}" stroke-width="3"/>`;
  return `<g transform="translate(${x} ${base}) scale(${s})">
    <g transform="translate(0 -60)">${[0.5, 1.0, 1.5, 2.1, 2.6].map((a, i) => leaf(a, 70 + (i % 2) * 20)).join('')}</g>
    <path d="M-30 -62 H30 L22 0 H-22 Z" fill="${P.red}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/>
  </g>`;
}

function bookshelf(x, y, w = 220, h = 260, seed = 4) {
  const r = rng(seed);
  const cols = [P.red, P.navy, P.green, P.gold, P.woodMid, P.greyDark, P.blue];
  let books = '';
  const shelves = 4, sh = (h - 20) / shelves;
  for (let j = 0; j < shelves; j++) {
    let bx = x + 12;
    while (bx < x + w - 24) {
      const bw = 12 + r() * 14, bh = sh * (0.55 + r() * 0.35);
      books += `<rect x="${n(bx)}" y="${n(y + 10 + (j + 1) * sh - bh)}" width="${n(bw)}" height="${n(bh)}" fill="${cols[Math.floor(r() * cols.length)]}" stroke="${P.ink}" stroke-width="2"/>`;
      bx += bw + 2;
    }
  }
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.woodDeep}" stroke="${P.ink}" stroke-width="4"/>${books}
    ${Array.from({ length: shelves + 1 }, (_, j) => `<rect x="${x}" y="${n(y + 4 + j * sh)}" width="${w}" height="8" fill="${P.wood}" stroke="${P.ink}" stroke-width="2"/>`).join('')}</g>`;
}

// Flag on a pole. kind: 'us' (simplified stripes + canton) or a plain colour.
function flagPole(x, base, { h = 300, kind = 'us', color = P.red, wave = 0 } = {}) {
  const fy = base - h + 10;
  const flag = kind === 'us'
    ? `${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="0" y="${i * 10}" width="110" height="10" fill="${i % 2 ? '#f2efe6' : P.red}"/>`).join('')}<rect x="0" y="0" width="46" height="40" fill="${P.navy}"/>`
    : `<rect x="0" y="0" width="110" height="70" fill="${color}"/>`;
  return `<g>
    <path d="M${x} ${base} V${base - h}" stroke="${P.gold}" stroke-width="6"/><circle cx="${x}" cy="${base - h - 6}" r="8" fill="${P.gold}" stroke="${P.ink}" stroke-width="2.5"/>
    <g transform="translate(${x + 3} ${fy}) skewY(${n(Math.sin(wave) * 3)})"><g stroke="${P.ink}" stroke-width="0">${flag}</g><rect width="110" height="70" fill="none" stroke="${P.ink}" stroke-width="3"/></g>
  </g>`;
}

// Lectern / podium. Draw in front of a character (feet hidden behind it).
function podium(x, base, { w = 150, h = 200, color = P.woodMid, seal = true } = {}) {
  return `<g>
    <path d="M${x - w / 2} ${base - h} H${x + w / 2} L${x + w / 2 - 14} ${base} H${x - w / 2 + 14} Z" fill="${color}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="${x - w / 2 - 12}" y="${base - h - 16}" width="${w + 24}" height="20" rx="4" fill="${P.woodDark}" stroke="${P.ink}" stroke-width="4"/>
    ${seal ? `<circle cx="${x}" cy="${base - h / 2 - 10}" r="${n(w * 0.22)}" fill="${P.navy}" stroke="${P.gold}" stroke-width="5"/><circle cx="${x}" cy="${base - h / 2 - 10}" r="${n(w * 0.1)}" fill="${P.gold}"/>` : ''}
    <path d="M${x - 30} ${base - h - 16} L${x - 10} ${base - h - 52}" stroke="${P.ink}" stroke-width="4"/><circle cx="${x - 9}" cy="${base - h - 56}" r="7" fill="${P.ink}"/>
  </g>`;
}

function couch(x, base, { w = 380, color = P.blue } = {}) {
  return `<g>
    <rect x="${x}" y="${base - 150}" width="${w}" height="90" rx="20" fill="${color}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x - 26}" y="${base - 110}" width="54" height="100" rx="18" fill="${color}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x + w - 28}" y="${base - 110}" width="54" height="100" rx="18" fill="${color}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x + 20}" y="${base - 76}" width="${w - 40}" height="60" rx="12" fill="${color}" stroke="${P.ink}" stroke-width="4"/>
    <path d="M${x + w / 2} ${base - 76} V${base - 16}" stroke="${P.ink}" stroke-width="3"/>
    <path d="M${x + 10} ${base - 10} V${base} M${x + w - 10} ${base - 10} V${base}" stroke="${P.ink}" stroke-width="7"/>
  </g>`;
}

// TV on a stand; `content` is SVG drawn inside the screen box (x,y,w,h given in local coordinates).
function tv(x, y, w = 260, h = 160, content = '') {
  return `<g>
    <rect x="${x - 14}" y="${y + h + 4}" width="${w + 28}" height="50" fill="${P.woodMid}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1d2430" stroke="${P.ink}" stroke-width="5"/>
    <g transform="translate(${x + 8} ${y + 8})">${content}</g>
  </g>`;
}

// Classical column (bank, court, parliament).
function column(x, top, base, { w = 54, color = '#e6dcc3' } = {}) {
  const flutes = [0.25, 0.5, 0.75].map((f) => `<path d="M${n(x - w / 2 + f * w)} ${top + 22} V${base - 18}" stroke="${P.paperShade}" stroke-width="3"/>`).join('');
  return `<g>
    <rect x="${x - w / 2 - 10}" y="${top}" width="${w + 20}" height="22" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>
    <rect x="${x - w / 2}" y="${top + 22}" width="${w}" height="${base - top - 40}" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>${flutes}
    <rect x="${x - w / 2 - 10}" y="${base - 18}" width="${w + 20}" height="18" fill="${color}" stroke="${P.ink}" stroke-width="3.5"/>
  </g>`;
}

// Shop front with an awning and a sign.
function shopFront(x, base, { w = 240, h = 260, color = P.red, sign = '', lit = false } = {}) {
  const stripes = Array.from({ length: 8 }, (_, i) => `<path d="M${n(x + i * (w / 8))} ${base - h + 60} h${n(w / 8)} l-6 34 h${n(-w / 8)} Z" fill="${i % 2 ? '#f2efe6' : color}" stroke="${P.ink}" stroke-width="2"/>`).join('');
  return `<g>
    <rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="#c9b99a" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x + 12}" y="${base - h + 12}" width="${w - 24}" height="44" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/>
    ${sign ? text(sign, x + w / 2, base - h + 44, { size: 26, font: 'display', anchor: 'middle', fill: P.ink }) : ''}
    ${stripes}
    <rect x="${x + 18}" y="${base - h + 104}" width="${w * 0.5}" height="${h - 120}" fill="${lit ? P.windowLit : '#a9c0c8'}" stroke="${P.ink}" stroke-width="3.5"/>
    <rect x="${x + w * 0.62}" y="${base - h + 104}" width="${w * 0.3}" height="${h - 104}" fill="${P.woodMid}" stroke="${P.ink}" stroke-width="3.5"/>
    <circle cx="${x + w * 0.66}" cy="${base - 70}" r="4" fill="${P.gold}"/>
  </g>`;
}

// Machine block for factories: body, gauge (needle moves with t), pipes, a blinking light.
function machine(x, base, t = 0, { w = 200, h = 220, color = P.greyDark, seed = 1 } = {}) {
  const ang = -60 + 120 * (0.5 + 0.5 * Math.sin(t * 2 + seed));
  const blink = Math.floor(t * 2 + seed) % 2 === 0;
  return `<g>
    <rect x="${x}" y="${base - h}" width="${w}" height="${h}" rx="8" fill="${color}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="${x + 16}" y="${base - h + 16}" width="${w - 32}" height="${h * 0.32}" rx="4" fill="#59605f" stroke="${P.ink}" stroke-width="3"/>
    <circle cx="${x + w * 0.3}" cy="${base - h * 0.4}" r="26" fill="${P.paper}" stroke="${P.ink}" stroke-width="3.5"/>
    <path d="M${x + w * 0.3} ${base - h * 0.4} l${n(Math.sin(ang * Math.PI / 180) * 20)} ${n(-Math.cos(ang * Math.PI / 180) * 20)}" stroke="${P.red}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${x + w * 0.72}" cy="${base - h * 0.42}" r="10" fill="${blink ? P.red : '#6b3a34'}" stroke="${P.ink}" stroke-width="3"/>
    <path d="M${x + w} ${base - h * 0.7} h40 v-${h * 0.5}" fill="none" stroke="${P.ink}" stroke-width="16" stroke-linejoin="round"/>
    <path d="M${x + w} ${base - h * 0.7} h40 v-${h * 0.5}" fill="none" stroke="${P.grey}" stroke-width="9" stroke-linejoin="round"/>
  </g>`;
}

// Conveyor belt with moving rollers and boxes travelling along it.
function conveyor(x, y, w, t = 0, { speed = 60, items = 4 } = {}) {
  const off = (t * speed) % (w / items);
  const rollers = Array.from({ length: Math.ceil(w / 40) + 1 }, (_, i) => {
    const cx = x + i * 40;
    const a = (t * speed / 10) * 57;
    return `<g transform="translate(${cx} ${y + 18})"><circle r="12" fill="${P.grey}" stroke="${P.ink}" stroke-width="3"/><path d="M-10 0 H10" stroke="${P.ink}" stroke-width="2.5" transform="rotate(${n(a)})"/></g>`;
  }).join('');
  const boxes = Array.from({ length: items }, (_, i) => {
    const bx = x + off + i * (w / items) - 40;
    if (bx < x - 20 || bx > x + w - 60) return '';
    return `<g><rect x="${n(bx)}" y="${y - 52}" width="64" height="52" fill="${P.paperShade}" stroke="${P.ink}" stroke-width="3.5"/><path d="M${n(bx)} ${y - 36} H${n(bx + 64)}" stroke="${P.ink}" stroke-width="2.5"/></g>`;
  }).join('');
  return `<g>
    <path d="M${x} ${y + 30} V${y + 110} M${x + w} ${y + 30} V${y + 110}" stroke="${P.ink}" stroke-width="8"/>
    <rect x="${x - 14}" y="${y}" width="${w + 28}" height="36" rx="18" fill="#3e4344" stroke="${P.ink}" stroke-width="4"/>
    ${rollers}${boxes}
  </g>`;
}

// ---------- props for the newer sets (stage, garden, resort, data centre, car, classroom, podcast, gate, prison) ----------
// Derived tints used only by these props (muted blends of palette colours). Candidates to move into palette.js.
const PT = {
  hairBrown: '#6b3f2a',   // same hair browns/blondes as characters.js
  hairDark: '#3a2d25',
  hairBlonde: '#d8c08a',
  palmTrunk: '#a08462',   // wood lightened toward paperShade
  rack: '#262d38',        // server rack body (nightDeep/charcoal)
  rackUnit: '#353d4a',
  fuselage: '#ebe6da',    // paper, cooled toward greyLight
  glass: '#a9c0c8',       // shop-window glass (as props.shopFront)
  concrete: '#b9b4a8',    // paperShade greyed
  concreteDark: '#9d988c',
  screen: '#1d2430',      // device screens (as props.tv / monitor)
};

// Rows of seated people seen from BEHIND (audiences, classrooms): shoulders + the back of a round head.
// Origin of each bust = bottom centre of the shoulders. rows go back -> front; front rows larger.
function audienceBacks(seed, { rows = 2, x = 0, w = W, y = 640, rowGap = 80, scale = 0.6, grow = 0.25, perRow = 9 } = {}) {
  const r = rng(seed);
  const suits = [P.navy, P.charcoal, P.greyDark, P.woodMid, P.blue, P.wallTrim, P.redDark];
  const hairs = [P.woodDark, P.charcoal, P.greyLight, PT.hairBrown, PT.hairDark, PT.hairBlonde, P.woodMid];
  let out = '';
  for (let j = 0; j < rows; j++) {
    const s = scale * (1 + grow * j);
    const yy = y + j * rowGap;
    const cols = Math.max(2, Math.round(perRow * (1 - 0.12 * j)));
    const step = w / cols;
    for (let i = 0; i < cols; i++) {
      const xx = x + step * (i + 0.5) + (j % 2 ? step * 0.3 : 0) + (r() - 0.5) * step * 0.18;
      const suit = suits[Math.floor(r() * suits.length)];
      const hc = hairs[Math.floor(r() * hairs.length)];
      const k = r();
      const bald = k < 0.12, long = k > 0.78, bun = k > 0.66 && k <= 0.78;
      out += `<g transform="translate(${n(xx)} ${n(yy)}) scale(${n(s)})">
        <path d="M-74 0 Q-78 -78 -40 -92 L40 -92 Q78 -78 74 0 Z" fill="${suit}" ${o(4.5)}/>
        <rect x="-18" y="-112" width="36" height="26" fill="${P.skin}" ${o(3.5)}/>
        <ellipse cx="-64" cy="-150" rx="10" ry="15" fill="${P.skin}" ${o(3)}/><ellipse cx="64" cy="-150" rx="10" ry="15" fill="${P.skin}" ${o(3)}/>
        ${long ? `<path d="M-60 -170 Q-70 -100 -52 -84 L52 -84 Q70 -100 60 -170 Z" fill="${hc}" ${o(3.5)}/>` : ''}
        <circle cx="0" cy="-160" r="64" fill="${bald ? P.skin : hc}" ${o(4.5)}/>
        ${bald ? `<path d="M-58 -132 Q0 -104 58 -132" stroke="${P.greyLight}" stroke-width="10" fill="none" stroke-linecap="round"/>` : `<path d="M-40 -110 Q0 -100 40 -110" stroke="${P.ink}" stroke-width="2.5" fill="none" opacity=".35"/>`}
        ${bun ? `<circle cx="0" cy="-226" r="22" fill="${hc}" ${o(3.5)}/>` : ''}
      </g>`;
    }
  }
  return out;
}

// Palm tree. base = foot of the trunk; lean bends the trunk right (negative = left). Fronds sway gently with t.
function palmTree(x, base, t = 0, { h = 380, lean = 0.25, s = 1, seed = 1 } = {}) {
  const top = [lean * h, -h];
  const ctrl = [lean * h * 0.15, -h * 0.55];
  const pt = (k) => [(1 - k) * (1 - k) * 0 + 2 * (1 - k) * k * ctrl[0] + k * k * top[0], 2 * (1 - k) * k * ctrl[1] + k * k * top[1]];
  let trunk = '';
  const segs = 9;
  for (let i = 0; i < segs; i++) {
    const [ax, ay] = pt(i / segs), [bx, by] = pt((i + 1) / segs);
    const wa = 22 - i * 1.3, wb = 22 - (i + 1) * 1.3;
    trunk += `<path d="M${n(ax - wa)} ${n(ay)} L${n(ax + wa)} ${n(ay)} L${n(bx + wb + 4)} ${n(by + 4)} L${n(bx - wb - 4)} ${n(by + 4)} Z" fill="${PT.palmTrunk}" ${o(3)}/>`;
  }
  const sway = Math.sin(t * 1.1 + seed) * 3;
  const frond = (a, len, col) => {
    const ar = (a + sway) * Math.PI / 180;
    const ex = Math.cos(ar) * len, ey = Math.sin(ar) * len + len * 0.35;
    const mx = Math.cos(ar) * len * 0.5, my = Math.sin(ar) * len * 0.5 - len * 0.18;
    const nx = -Math.sin(ar) * 16, ny = Math.cos(ar) * 16;
    return `<path d="M0 0 Q${n(mx + nx)} ${n(my + ny)} ${n(ex)} ${n(ey)} Q${n(mx - nx)} ${n(my - ny - 10)} 0 0 Z" fill="${col}" ${o(3)}/>
      <path d="M0 0 Q${n(mx)} ${n(my - 4)} ${n(ex)} ${n(ey)}" stroke="${P.ink}" stroke-width="2" fill="none" opacity=".5"/>`;
  };
  const angles = [-170, -140, -105, -75, -40, -10, 20, 160, 195];
  const fronds = angles.map((a, i) => frond(a, 150 + (i % 3) * 22, i % 2 ? P.greenDark : P.green)).join('');
  return `<g transform="translate(${x} ${base}) scale(${s})">${trunk}
    <g transform="translate(${n(top[0])} ${n(top[1])})">${fronds}
      <circle cx="-10" cy="14" r="11" fill="${P.woodMid}" ${o(2.5)}/><circle cx="10" cy="16" r="11" fill="${P.woodMid}" ${o(2.5)}/></g></g>`;
}

// Server rack with 1U slots and status LEDs that blink deterministically in t.
function serverRack(x, y, w = 110, h = 420, t = 0, { seed = 1, door = false } = {}) {
  const r = rng(seed);
  const leds = [P.green, P.green, P.blue, P.gold, P.green];
  let units = '';
  let yy = y + 18;
  while (yy < y + h - 40) {
    const uh = r() < 0.7 ? 22 : 44;
    if (r() < 0.12) { yy += uh + 4; continue; } // empty slot
    units += `<rect x="${x + 10}" y="${yy}" width="${w - 20}" height="${uh}" fill="${PT.rackUnit}" stroke="${P.ink}" stroke-width="2"/>`;
    for (let v = 0; v < 3; v++) units += `<path d="M${x + 18 + v * 7} ${yy + 5} V${yy + uh - 5}" stroke="${P.ink}" stroke-width="2" opacity=".5"/>`;
    const nl = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nl; i++) {
      const rate = 0.5 + r() * 2.5, ph = r(), duty = 0.35 + r() * 0.5;
      const col = leds[Math.floor(r() * leds.length)];
      const on = ((t * rate + ph) % 1) < duty;
      const lx = x + w - 18 - i * 11, ly = yy + 8;
      units += `<circle cx="${n(lx)}" cy="${n(ly)}" r="3" fill="${on ? col : P.ink}" opacity="${on ? 1 : 0.6}"/>`;
      if (on) units += `<circle cx="${n(lx)}" cy="${n(ly)}" r="8" fill="${col}" opacity=".25" filter="url(#glow)"/>`;
    }
    yy += uh + 4;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PT.rack}" ${o(4)}/>
    <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="10" fill="${P.charcoal}"/>
    ${units}
    ${door ? `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="${P.blue}" opacity=".12" stroke="${P.greyDark}" stroke-width="2"/>` : ''}
    <rect x="${x}" y="${y + h - 16}" width="${w}" height="16" fill="${P.charcoal}" ${o(3)}/>
  </g>`;
}

// Laptop on a table, base = table-top y. side: 'back' (lid towards camera) or 'front' (screen towards camera).
function laptop(x, base, { w = 110, side = 'back', screen = '' } = {}) {
  const lh = w * 0.62;
  return side === 'back'
    ? `<g><path d="M${x - w / 2 + 6} ${base - 6} L${x - w / 2} ${base - 6 - lh} H${x + w / 2} L${x + w / 2 - 6} ${base - 6} Z" fill="${P.greyLight}" ${o(3)}/>
        <rect x="${x - w / 2 - 6}" y="${base - 8}" width="${w + 12}" height="8" rx="3" fill="${P.grey}" ${o(2.5)}/></g>`
    : `<g><rect x="${x - w / 2}" y="${base - 6 - lh}" width="${w}" height="${lh}" rx="4" fill="${P.greyDark}" ${o(3)}/>
        <rect x="${x - w / 2 + 6}" y="${base - lh}" width="${w - 12}" height="${lh - 12}" fill="${PT.screen}"/>
        <g transform="translate(${x - w / 2 + 6} ${base - lh})">${screen}</g>
        <rect x="${x - w / 2 - 10}" y="${base - 8}" width="${w + 20}" height="8" rx="3" fill="${P.grey}" ${o(2.5)}/></g>`;
}

// Broadcast microphone capsule (pointing up-ish, rotated by rot degrees). Origin = centre of the capsule.
function studioMic(x, y, { s = 1, rot = 0 } = {}) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">
    <rect x="-17" y="-44" width="34" height="76" rx="17" fill="${P.charcoal}" ${o(3)}/>
    ${[-30, -20, -10, 0].map((yy) => `<path d="M-15 ${yy} H15" stroke="${P.greyDark}" stroke-width="2"/>`).join('')}
    <rect x="-20" y="8" width="40" height="10" rx="3" fill="${P.greyDark}" ${o(2.5)}/>
    <path d="M0 32 V48" stroke="${P.ink}" stroke-width="6"/>
  </g>`;
}

// Headphones. worn: drawn in CHARACTER-LOCAL coordinates (wrap in the character's tr()) over the head;
// otherwise lying on a table at (x, base).
function headphones(x = 0, base = 0, { worn = false, color = P.charcoal } = {}) {
  if (worn) {
    return `<g>
      <path d="M-68 -232 Q-74 -322 0 -322 Q74 -322 68 -232" fill="none" stroke="${P.ink}" stroke-width="13" stroke-linecap="round"/>
      <path d="M-68 -232 Q-74 -322 0 -322 Q74 -322 68 -232" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      <rect x="-86" y="-262" width="28" height="48" rx="12" fill="${color}" ${o(3.5)}/><rect x="58" y="-262" width="28" height="48" rx="12" fill="${color}" ${o(3.5)}/>
    </g>`;
  }
  return `<g transform="translate(${x} ${base})">
    <path d="M-34 -10 Q-36 -44 0 -44 Q36 -44 34 -10" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/>
    <path d="M-34 -10 Q-36 -44 0 -44 Q36 -44 34 -10" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="-34" cy="-8" rx="16" ry="9" fill="${color}" ${o(3)}/><ellipse cx="34" cy="-8" rx="16" ry="9" fill="${color}" ${o(3)}/>
  </g>`;
}

// A strand of festoon lights hung between two points with a sag. lit: glowing warm bulbs; otherwise pale glass.
function stringLights(x0, y0, x1, y1, { sag = 50, count = 12, lit = false, t = 0 } = {}) {
  const cx = (x0 + x1) / 2, ctrlY = (y0 + y1) / 2 + sag * 2; // quadratic control point (sag = drop at the middle)
  const at = (k) => [(1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * x1, (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * ctrlY + k * k * y1];
  let bulbs = '';
  for (let i = 1; i < count; i++) {
    const [bx, by] = at(i / count);
    const fl = lit ? 0.8 + 0.2 * Math.sin(t * 3 + i * 1.7) : 1;
    if (lit) bulbs += `<circle cx="${n(bx)}" cy="${n(by + 12)}" r="16" fill="${P.windowLit}" opacity="${n(0.35 * fl)}" filter="url(#glow)"/>`;
    bulbs += `<path d="M${n(bx)} ${n(by)} V${n(by + 5)}" stroke="${P.ink}" stroke-width="2"/><ellipse cx="${n(bx)}" cy="${n(by + 12)}" rx="5.5" ry="7.5" fill="${lit ? P.windowLit : P.paper}" stroke="${P.ink}" stroke-width="2"/>`;
  }
  return `<g><path d="M${x0} ${y0} Q${n(cx)} ${n(ctrlY)} ${x1} ${y1}" fill="none" stroke="${P.ink}" stroke-width="2.5"/>${bulbs}</g>`;
}

// Garden / wedding arch: a white round-topped frame dressed with greenery and flowers.
function gardenArch(x, base, { w = 320, h = 400, seed = 3 } = {}) {
  const r = rng(seed);
  const R = w / 2, top = base - h;
  const d = `M${x - R} ${base} V${top + R} A${R} ${R} 0 0 1 ${x + R} ${top + R} V${base}`;
  let leaves = '';
  for (let i = 0; i <= 26; i++) {
    const k = i / 26;
    let px, py;
    const L = (h - R) * 2 + Math.PI * R;
    const dist = k * L;
    if (dist < h - R) { px = x - R; py = base - dist; }
    else if (dist < h - R + Math.PI * R) { const a = Math.PI - (dist - (h - R)) / R; px = x + Math.cos(a) * R; py = top + R - Math.sin(a) * R; }
    else { px = x + R; py = top + R + (dist - (h - R) - Math.PI * R); }
    if (py > base - 120 && r() < 0.6) continue; // sparser near the ground
    const rr = 14 + r() * 12;
    leaves += `<circle cx="${n(px + (r() - 0.5) * 16)}" cy="${n(py + (r() - 0.5) * 16)}" r="${n(rr)}" fill="${r() < 0.5 ? P.green : P.greenDark}" stroke="${P.ink}" stroke-width="2.5"/>`;
    if (r() < 0.55) leaves += `<circle cx="${n(px + (r() - 0.5) * 22)}" cy="${n(py + (r() - 0.5) * 22)}" r="${n(6 + r() * 4)}" fill="${[P.paper, P.blush, P.gold][Math.floor(r() * 3)]}" stroke="${P.ink}" stroke-width="2"/>`;
  }
  return `<g>
    <path d="${d}" fill="none" stroke="${P.ink}" stroke-width="22" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${P.paper}" stroke-width="14" stroke-linejoin="round"/>
    ${leaves}
  </g>`;
}

// Round banquet table with a long cloth, a centrepiece and two chairs behind it. base = floor line.
function banquetTable(x, base, { w = 220, cloth = P.paper, s = 1, flowers = true } = {}) {
  const hw = w / 2;
  const chairs = [-hw * 0.6, hw * 0.6].map((dx) => `<g><rect x="${n(dx - 22)}" y="-150" width="44" height="70" rx="6" fill="${P.goldDark}" ${o(3)}/><path d="M${n(dx - 12)} -140 V-90 M${n(dx)} -140 V-90 M${n(dx + 12)} -140 V-90" stroke="${P.ink}" stroke-width="2"/></g>`).join('');
  return `<g transform="translate(${x} ${base}) scale(${s})">
    ${chairs}
    <path d="M${-hw} -86 Q${-hw - 6} -30 ${-hw - 10} 0 H${hw + 10} Q${hw + 6} -30 ${hw} -86 Z" fill="${cloth}" ${o(3.5)}/>
    <ellipse cx="0" cy="-86" rx="${hw}" ry="16" fill="${cloth}" ${o(3.5)}/>
    ${[-0.5, 0, 0.5].map((f) => `<path d="M${n(f * hw)} -70 Q${n(f * hw * 1.05)} -30 ${n(f * hw * 1.1)} 0" stroke="${P.paperShade}" stroke-width="2.5" fill="none"/>`).join('')}
    ${flowers ? `<path d="M-8 -90 L-6 -116 H6 L8 -90 Z" fill="${P.greyLight}" ${o(2.5)}/><circle cx="-8" cy="-122" r="8" fill="${P.blush}" ${o(2)}/><circle cx="8" cy="-124" r="8" fill="${P.paper}" ${o(2)}/><circle cx="0" cy="-134" r="8" fill="${P.gold}" ${o(2)}/>` : ''}
    <path d="M${n(-hw * 0.45)} -96 v-16 M${n(hw * 0.45)} -96 v-16" stroke="${P.greyLight}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// Generic airliner seen side-on, nose to the left. No logos: a plain muted stripe only.
function airliner(x, y, { s = 1, stripe = P.blue } = {}) {
  const wins = Array.from({ length: 22 }, (_, i) => `<rect x="${170 + i * 26}" y="-22" width="12" height="15" rx="5" fill="${P.windowDark}"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M690 -50 L770 -190 H822 L846 -44 Z" fill="${stripe}" ${o(4)}/>
    <path d="M720 -26 L860 -40 L866 -18 L730 -6 Z" fill="${P.greyLight}" ${o(3)}/>
    <path d="M60 -50 H720 L868 -44 L862 -28 Q800 22 720 36 H70 Q0 36 -14 0 Q-6 -46 60 -50 Z" fill="${PT.fuselage}" ${o(4.5)}/>
    <path d="M-10 12 Q30 34 80 36 H720 Q790 24 830 0" fill="none" stroke="${stripe}" stroke-width="9"/>
    <path d="M0 -14 Q14 -36 50 -40 L56 -20 Q26 -18 8 -8 Z" fill="${P.windowDark}" ${o(2.5)}/>
    ${wins}
    <rect x="110" y="-34" width="30" height="58" rx="5" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
    <path d="M330 12 L520 12 L610 110 H560 Z" fill="${P.greyLight}" ${o(4)}/>
    <rect x="360" y="34" width="120" height="44" rx="20" fill="${P.grey}" ${o(4)}/><ellipse cx="362" cy="56" rx="10" ry="20" fill="${P.charcoal}" ${o(3)}/>
    <path d="M120 36 V86 M470 36 V86 M500 36 V86" stroke="${P.ink}" stroke-width="7"/>
    ${[120, 470, 500].map((wx) => `<circle cx="${wx}" cy="92" r="13" fill="${P.charcoal}" ${o(3)}/>`).join('')}
  </g>`;
}

// Flight departures board. rows = [[destination, time, status], ...]; BOARDING blinks, DELAYED is red.
function departuresBoard(x, y, w, h, rows, t = 0, { title = 'DEPARTURES' } = {}) {
  const rh = (h - 64) / Math.max(rows.length, 1);
  const fs = Math.min(24, rh * 0.62);
  const lines = rows.map(([dest, time, status], i) => {
    const yy = y + 64 + i * rh + rh * 0.68;
    const st = String(status || '').toUpperCase();
    const col = st.includes('DELAY') || st.includes('CANCEL') ? P.red : st.includes('BOARD') ? P.green : P.paperDim;
    const show = !st.includes('BOARD') || Math.floor(t * 1.6) % 2 === 0;
    return `<path d="M${x + 14} ${n(y + 64 + i * rh)} H${x + w - 14}" stroke="${P.charcoal}" stroke-width="2"/>`
      + text(time, x + 20, yy, { size: fs, font: 'type', fill: P.windowLit })
      + text(String(dest).toUpperCase(), x + 20 + fs * 3.6, yy, { size: fs, font: 'type', fill: P.paper })
      + (show ? text(st, x + w - 20, yy, { size: fs * 0.9, font: 'type', fill: col, anchor: 'end' }) : '');
  }).join('');
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${PT.screen}" ${o(4)}/>
    <rect x="${x}" y="${y}" width="${w}" height="50" rx="6" fill="${P.charcoal}" ${o(3)}/>
    ${text(title, x + 20, y + 36, { size: 28, font: 'display', fill: P.gold, spacing: 2 })}
    ${lines}
  </g>`;
}

// Coiled razor wire along the top of a wall (y = top of the wall), with angled support posts.
function razorWire(x0, x1, y, { r = 18 } = {}) {
  let out = '';
  for (let x = x0; x < x1; x += 120) out += `<path d="M${x} ${y} L${x - 18} ${y - 46} M${x} ${y} L${x + 18} ${y - 46}" stroke="${P.greyDark}" stroke-width="5" stroke-linecap="round"/>`;
  let coils = '';
  for (let x = x0; x < x1 + r; x += r * 0.9) {
    coils += `<ellipse cx="${n(x)}" cy="${y - 30}" rx="${r}" ry="${n(r * 0.9)}" fill="none" stroke="${P.greyDark}" stroke-width="2.5"/>`;
    coils += `<path d="M${n(x - 3)} ${y - 30 - r * 0.9} l6 -6 M${n(x + r * 0.6)} ${y - 36} l7 -2" stroke="${P.greyDark}" stroke-width="2"/>`;
  }
  return `<g>${out}<g opacity=".95">${coils}</g></g>`;
}

// Prison / border watchtower: concrete shaft, glazed cab, flat roof and a searchlight. base = ground y.
function watchtower(x, base, { h = 480, w = 90 } = {}) {
  const cabY = base - h, cw = w + 70;
  return `<g>
    <rect x="${x - w / 2}" y="${cabY + 70}" width="${w}" height="${h - 70}" fill="${PT.concreteDark}" ${o(4)}/>
    ${[0.3, 0.55, 0.8].map((f) => `<path d="M${x - w / 2} ${n(cabY + 70 + f * (h - 70))} H${x + w / 2}" stroke="${P.ink}" stroke-width="2" opacity=".35"/>`).join('')}
    <rect x="${x - cw / 2 - 6}" y="${cabY + 64}" width="${cw + 12}" height="14" fill="${P.greyDark}" ${o(3)}/>
    <rect x="${x - cw / 2}" y="${cabY}" width="${cw}" height="66" fill="${PT.concrete}" ${o(4)}/>
    ${[0, 1, 2].map((i) => `<rect x="${n(x - cw / 2 + 12 + i * (cw - 24) / 3)}" y="${cabY + 12}" width="${n((cw - 24) / 3 - 8)}" height="36" fill="${P.windowDark}" stroke="${P.ink}" stroke-width="2.5"/>`).join('')}
    <path d="M${x - cw / 2 - 18} ${cabY} L${x - cw / 2 + 4} ${cabY - 30} H${x + cw / 2 - 4} L${x + cw / 2 + 18} ${cabY} Z" fill="${P.charcoal}" ${o(4)}/>
    <g transform="translate(${x + cw / 2 - 10} ${cabY - 40}) rotate(-20)"><rect x="-14" y="-12" width="30" height="24" rx="4" fill="${P.greyDark}" ${o(3)}/><rect x="14" y="-10" width="6" height="20" fill="${P.paperDim}" ${o(2)}/></g>
  </g>`;
}

// School desk seen from the back of the class: desk top + legs, with a chair (back to camera) in front of it.
function schoolDesk(x, base, { w = 260, s = 1, chair = true } = {}) {
  const hw = w / 2;
  return `<g transform="translate(${x} ${base}) scale(${s})">
    <path d="M${-hw + 14} -150 V0 M${hw - 14} -150 V0" stroke="${P.ink}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${-hw + 14} -150 V0 M${hw - 14} -150 V0" stroke="${P.greyDark}" stroke-width="4" stroke-linecap="round"/>
    <rect x="${-hw + 6}" y="-150" width="${w - 12}" height="50" fill="${P.greyDark}" ${o(3)}/>
    <rect x="${-hw}" y="-170" width="${w}" height="22" rx="4" fill="${P.wood}" ${o(4)}/>
    ${chair ? `<g><path d="M-50 -40 V40 M50 -40 V40" stroke="${P.ink}" stroke-width="8"/><rect x="-66" y="-120" width="132" height="70" rx="10" fill="${P.woodMid}" ${o(4)}/><path d="M-60 -60 H60" stroke="${P.ink}" stroke-width="7"/><path d="M-50 -50 V-40 M50 -50 V-40" stroke="${P.ink}" stroke-width="8"/></g>` : ''}
  </g>`;
}

// Desk lamp (angled arm). base = desk-top y; the shade points down-left (flip to point right). on: glowing bulb.
function deskLamp(x, base, { on = true, flip = false, color = P.charcoal } = {}) {
  const f = flip ? -1 : 1;
  return `<g transform="translate(${x} ${base}) scale(${f} 1)">
    <ellipse cx="0" cy="-5" rx="30" ry="8" fill="${color}" ${o(3)}/>
    <path d="M0 -8 L14 -80 L-36 -122" fill="none" stroke="${P.ink}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M0 -8 L14 -80 L-36 -122" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="14" cy="-80" r="6" fill="${color}" ${o(2.5)}/>
    <g transform="translate(-36 -122) rotate(-35)"><path d="M-30 30 L-14 -10 H14 L30 30 Z" fill="${color}" ${o(3)}/>
      ${on ? `<ellipse cx="0" cy="30" rx="24" ry="6" fill="${P.windowLit}" ${o(2)}/>` : ''}</g>
  </g>`;
}

// Chart coordinate mappers, so shots can pin stickers to data points.
function chartMap({ x, y, w, h, xRange, yRange }) {
  return {
    px: (v) => x + 30 + ((v - xRange[0]) / (xRange[1] - xRange[0])) * (w - 60),
    py: (v) => y + h - 50 - ((v - yRange[0]) / (yRange[1] - yRange[0])) * (h - 110),
  };
}

module.exports = { audienceBacks, palmTree, serverRack, laptop, studioMic, headphones, stringLights, gardenArch, banquetTable, airliner, departuresBoard, razorWire, watchtower, schoolDesk, deskLamp, monitor, chair, plant, bookshelf, flagPole, podium, couch, tv, column, shopFront, machine, conveyor, chartMap, office, windowCity, clock, desk, paperStack, phone, partialLine, lineChart, nightSky, skyline, tower, streetLamp, deskTop };
