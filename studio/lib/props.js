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

// Window with a daytime city skyline.
function windowCity(x, y, w = 360, h = 330) {
  const b = [[0.05, 0.45, 0.14], [0.2, 0.3, 0.16], [0.39, 0.2, 0.14], [0.56, 0.38, 0.18], [0.76, 0.5, 0.2]];
  const blds = b.map(([bx, by, bw]) => `<rect x="${n(bx * w)}" y="${n(by * h)}" width="${n(bw * w)}" height="${n(h - by * h)}" fill="${P.grey}"/>`).join('');
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" fill="#d9dedd"/>
    ${blds}
    <path d="M${n(0.39 * w)} ${n(0.2 * h)} L${n(0.46 * w)} ${n(0.1 * h)} L${n(0.53 * w)} ${n(0.2 * h)} Z" fill="${P.grey}"/>
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

// Chart coordinate mappers, so shots can pin stickers to data points.
function chartMap({ x, y, w, h, xRange, yRange }) {
  return {
    px: (v) => x + 30 + ((v - xRange[0]) / (xRange[1] - xRange[0])) * (w - 60),
    py: (v) => y + h - 50 - ((v - yRange[0]) / (yRange[1] - yRange[0])) * (h - 110),
  };
}

module.exports = { monitor, chair, plant, bookshelf, flagPole, podium, couch, tv, column, shopFront, machine, conveyor, chartMap, office, windowCity, clock, desk, paperStack, phone, partialLine, lineChart, nightSky, skyline, tower, streetLamp, deskTop };
