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

// Chart coordinate mappers, so shots can pin stickers to data points.
function chartMap({ x, y, w, h, xRange, yRange }) {
  return {
    px: (v) => x + 30 + ((v - xRange[0]) / (xRange[1] - xRange[0])) * (w - 60),
    py: (v) => y + h - 50 - ((v - yRange[0]) / (yRange[1] - yRange[0])) * (h - 110),
  };
}

module.exports = { chartMap, office, windowCity, clock, desk, paperStack, phone, partialLine, lineChart, nightSky, skyline, tower, streetLamp, deskTop };
