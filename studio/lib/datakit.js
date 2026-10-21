// Data kit for the FINANCE pack: Crayon-style money and market graphics.
// Every export is a pure function (spec, t) -> SVG for the full 1280x720 world layer (it draws its own background),
// except tickerChip, which is a small overlay. All time fields are numeric seconds from the shot start.
//
//   stockChart({ name, ticker, data: [[x, y], ...], tabs, activeTab, price, change, at, drawDur, endLabel, xLabels })
//     Line chart in a white card, with timeframe tabs. Green if the line ends above its start, red if below.
//     The line draws over drawDur (default 2.2s) starting at `at`, with a soft area fill. `price` (number) counts up to
//     its value; a string is shown as is. The change chip (▲/▼, e.g. '-27%' or -27) pops when the line finishes.
//     xLabels: [[x, 'label'], ...]. endLabel: small label pinned to the last point.
//   tickerChip({ ticker, change, price, x, y, at })                       x, y = centre of the chip (overlay)
//   rankingBoard({ title, rows: [{ label, value, emblem, highlight }], unit, at, stagger, sort })
//     Ranked bars (sorted biggest first unless sort: false) that grow one by one (stagger, default 0.45s), with values counting up. A highlighted row is gold.
//     unit: '$B' (prefix $, suffix B), 'B', or { prefix, suffix }. emblem: 1–2 letters in the circle (default: label initial).
//   winnersLosers({ left: { title, items, trend: 'up', caption }, right: { title, items, trend: 'down', caption }, at, verdictAt })
//     Two cards, each with a mini bar chart; '>' pops between them at verdictAt.
//   calendarFlip({ from: 'MARCH 2007', to: 'SEPT 2008', at, dur })
//     A wall calendar whose pages flip from one date to the other. If both are "MONTH YEAR", the months in between are shown.
//   cheque({ payer, payee, amount, memo, at, signAt })
//     A cheque on a desk; payee and amount write in, then the signature scribbles on at signAt.
//   countUp({ value, prefix, suffix, caption, at, dur })      Big centred count-up on a light backdrop.
//
// No real logos anywhere: companies are lettered emblems plus names.

const P = require('./palette');
const { n, text, textWidth, esc } = require('./svg');
const { prog, ease, clamp, pop, lerp, rng } = require('./motion');

// Finance UI colours (derived from the palette: light, muted, Crayon-style).
const C = {
  bg: '#d9d7d1',       // soft grey seamless backdrop
  bgFloor: '#c9c6bf',
  card: '#fbfaf6',     // white UI card
  grid: '#e6e2d9',
  tab: '#eeeae1',
  ink: P.ink,
  soft: P.inkSoft,
  navy: '#3d5a7a',     // neutral bar colour
  teal: '#4f8a8b',
  chequeTint: '#e4ede4',
  chequeLine: '#c3d3c4',
};

const up = (c) => !(typeof c === 'number' ? c < 0 : /^[-−]/.test(String(c || '').trim()));
const fmtNum = (v, dec = null) => {
  const d = dec ?? (Math.abs(v) < 100 && v % 1 ? 1 : 0);
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const fmtChange = (c) => (typeof c === 'number' ? `${c > 0 ? '+' : c < 0 ? '−' : ''}${fmtNum(Math.abs(c), Math.abs(c) % 1 ? 1 : 0)}%` : String(c).replace(/^-/, '−'));
const popAt = (cx, cy, p, inner) => (p.on ? `<g opacity="${n(p.o)}" transform="translate(${n(cx)} ${n(cy)}) scale(${n(p.s)}) translate(${n(-cx)} ${n(-cy)})">${inner}</g>` : '');
const shadow = 'filter="url(#shadow)"';

function backdrop() {
  return `<rect width="1280" height="720" fill="${C.bg}"/>
    <path d="M0 560 Q640 520 1280 560 V720 H0 Z" fill="${C.bgFloor}"/>`;
}

function emblem(cx, cy, r, letters, color = C.navy) {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${color}" stroke="${C.ink}" stroke-width="2.5"/>
    ${text(letters, cx, cy + r * 0.36, { size: r * 0.95, font: 'display', fill: P.paper, anchor: 'middle' })}`;
}

// Points of a polyline up to fraction k of its length.
function partialPts(pts, k) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let left = total * clamp(k);
  const out = [pts[0]];
  for (let i = 1; i < pts.length && left > 0; i++) {
    const f = Math.min(1, left / seg[i - 1]);
    out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]);
    left -= seg[i - 1];
  }
  return out;
}

// ---------- ticker chip ----------
function chipSvg({ ticker, change, price, x, y, size = 32 }) {
  const isUp = up(change);
  const col = isUp ? P.green : P.red;
  const chg = `${isUp ? '▲' : '▼'} ${fmtChange(change)}`;
  const priceStr = price == null ? '' : typeof price === 'number' ? `$${fmtNum(price, 2)}` : String(price);
  const w1 = textWidth(ticker, size, 'hand') + 16;
  const w2 = priceStr ? textWidth(priceStr, size, 'hand') + 18 : 0;
  const w3 = textWidth(chg, size, 'hand') + 26;
  const h = size + 22;
  const W = h + w1 + w2 + w3 + 10;
  const x0 = x - W / 2, y0 = y - h / 2;
  let cx = x0 + h;
  const parts = [
    `<rect x="${n(x0)}" y="${n(y0)}" width="${n(W)}" height="${h}" rx="${h / 2}" fill="${C.card}" stroke="${C.ink}" stroke-width="2.5"/>`,
    emblem(x0 + h / 2, y, h / 2 - 6, String(ticker || '?')[0]),
    text(ticker, cx + 6, y + size * 0.36, { size, font: 'hand' }),
  ];
  cx += w1;
  if (priceStr) { parts.push(text(priceStr, cx + 4, y + size * 0.36, { size, font: 'hand', fill: C.soft })); cx += w2; }
  parts.push(`<rect x="${n(cx)}" y="${n(y0 + 6)}" width="${n(w3)}" height="${h - 12}" rx="${(h - 12) / 2}" fill="${col}"/>`,
    text(chg, cx + w3 / 2, y + size * 0.36, { size, font: 'hand', fill: P.paper, anchor: 'middle' }));
  return `<g ${shadow}>${parts.join('')}</g>`;
}

function tickerChip(spec, t) {
  return popAt(spec.x, spec.y, pop(t, spec.at ?? 0), chipSvg(spec));
}

// ---------- stock chart ----------
function stockChart(spec, t) {
  const { name = '', ticker = '', data, tabs = ['1D', '1W', '1M', '6M', 'YTD', '1Y', '5Y'], activeTab, price, change, endLabel, xLabels = [] } = spec;
  const at = spec.at ?? 0.3, drawDur = spec.drawDur ?? 2.2;
  const isUp = change != null ? up(change) : data[data.length - 1][1] >= data[0][1];
  const col = isUp ? P.green : P.red;
  const box = { x: 150, y: 210, w: 980, h: 330 };
  const xs = data.map((d) => d[0]), ys = data.map((d) => d[1]);
  const yMin = Math.min(...ys), yMax = Math.max(...ys), pad = (yMax - yMin) * 0.12 || 1;
  const px = (v) => box.x + ((v - xs[0]) / (xs[xs.length - 1] - xs[0] || 1)) * box.w;
  const py = (v) => box.y + box.h - ((v - (yMin - pad)) / (yMax - yMin + 2 * pad)) * box.h;
  const pts = data.map(([a, b]) => [px(a), py(b)]);
  const k = ease.inOut(prog(t, at, drawDur));
  const part = partialPts(pts, k);
  const head = part[part.length - 1];
  const line = part.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join(' ');
  const area = part.length > 1 ? `${line} L${n(head[0])} ${box.y + box.h} L${n(part[0][0])} ${box.y + box.h} Z` : '';
  const done = at + drawDur;

  const grid = [0, 1, 2, 3].map((i) => `<path d="M${box.x} ${n(box.y + (i * box.h) / 3)} H${box.x + box.w}" stroke="${C.grid}" stroke-width="2"/>`).join('');
  const labels = xLabels.map(([v, l]) => text(l, px(v), box.y + box.h + 34, { size: 24, anchor: 'middle', fill: C.soft })).join('');

  // header: name + ticker, price + change chip
  let priceStr = '';
  if (typeof price === 'number') {
    // the price ticks along with the line: value under the moving head, scaled so the last point = price
    const yAt = (yMin - pad) + ((box.y + box.h - head[1]) / box.h) * (yMax - yMin + 2 * pad);
    const v = k > 0 ? price * (yAt / ys[ys.length - 1]) : price * (ys[0] / ys[ys.length - 1]);
    priceStr = `$${fmtNum(v, price % 1 || price < 1000 ? 2 : 0)}`;
  } else if (price) priceStr = String(price);
  const chg = change != null ? `${isUp ? '▲' : '▼'} ${fmtChange(change)}` : '';
  const chgW = textWidth(chg, 30, 'hand') + 30;
  const chip = chg ? popAt(1090 - chgW / 2, 150, pop(t, done), `<rect x="${n(1090 - chgW)}" y="128" width="${n(chgW)}" height="44" rx="22" fill="${col}" stroke="${C.ink}" stroke-width="2"/>${text(chg, 1090 - chgW / 2, 161, { size: 30, anchor: 'middle', fill: P.paper })}`) : '';

  const tabW = 96, tabsX = 640 - (tabs.length * tabW) / 2;
  const tabRow = tabs.map((tb, i) => {
    const on = tb === (activeTab || tabs[tabs.length - 1]);
    return `<rect x="${tabsX + i * tabW + 6}" y="598" width="${tabW - 12}" height="42" rx="21" fill="${on ? col : C.tab}" stroke="${on ? C.ink : 'none'}" stroke-width="2"/>
      ${text(tb, tabsX + i * tabW + tabW / 2, 628, { size: 24, anchor: 'middle', fill: on ? P.paper : C.soft })}`;
  }).join('');

  const endTag = endLabel && t >= done ? popAt(head[0], head[1] - 44, pop(t, done + 0.2), `<rect x="${n(head[0] - textWidth(endLabel, 24) / 2 - 14)}" y="${n(head[1] - 66)}" width="${n(textWidth(endLabel, 24) + 28)}" height="40" rx="8" fill="${C.card}" stroke="${col}" stroke-width="2.5"/>${text(endLabel, head[0], head[1] - 38, { size: 24, anchor: 'middle', fill: col })}`) : '';

  return backdrop() + `<g ${shadow}><rect x="90" y="60" width="1100" height="610" rx="22" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
    ${emblem(150, 122, 30, String(ticker || name || '?')[0])}
    ${text(name, 196, 118, { size: 38, font: 'hand' })}
    ${ticker ? text(ticker, 198, 150, { size: 24, font: 'hand', fill: C.soft }) : ''}
    ${priceStr ? text(priceStr, chg ? 1070 - chgW : 1130, 162, { size: 50, font: 'display', anchor: 'end' }) : ''}
    ${chip}
    ${grid}
    ${area ? `<path d="${area}" fill="${col}" opacity=".14"/>` : ''}
    ${part.length > 1 ? `<path d="${line}" fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${k > 0 ? `<circle cx="${n(head[0])}" cy="${n(head[1])}" r="9" fill="${col}" stroke="${C.ink}" stroke-width="2.5"/>` : ''}
    ${labels}${tabRow}${endTag}`;
}

// ---------- ranking board ----------
function parseUnit(unit) {
  if (!unit) return { prefix: '', suffix: '' };
  if (typeof unit === 'object') return { prefix: unit.prefix || '', suffix: unit.suffix || '' };
  return unit.startsWith('$') ? { prefix: '$', suffix: unit.slice(1) } : { prefix: '', suffix: unit };
}

function rankingBoard(spec, t) {
  const { title = '' } = spec;
  const rows = spec.sort === false ? spec.rows || [] : [...(spec.rows || [])].sort((a, b) => b.value - a.value); // biggest first
  const at = spec.at ?? 0.3, stagger = spec.stagger ?? 0.45;
  const { prefix, suffix } = parseUnit(spec.unit);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const rowH = Math.min(78, 430 / Math.max(1, rows.length));
  const top = 190;
  const labelW = Math.max(...rows.map((r) => textWidth(r.label, 30)), 120);
  const barX = 260 + labelW + 20, barMax = 1060 - barX - 150;
  const body = rows.map((r, i) => {
    const ra = at + i * stagger;
    if (t < ra) return '';
    const y = top + i * rowH;
    const g = ease.out(prog(t, ra, 0.6));
    const col = r.highlight ? P.gold : C.navy;
    const w = Math.max(8, (r.value / max) * barMax * g);
    const val = `${prefix}${fmtNum(r.value * g, r.value % 1 ? 1 : 0)}${suffix}`;
    const inner = `${text(String(i + 1), 210, y + rowH / 2 + 12, { size: 32, font: 'display', fill: C.soft, anchor: 'middle' })}
      ${emblem(262, y + rowH / 2, Math.min(24, rowH / 2 - 8), r.emblem || String(r.label)[0], r.highlight ? P.goldDark : C.teal)}
      ${text(r.label, 300, y + rowH / 2 + 11, { size: 30 })}
      <rect x="${n(barX)}" y="${n(y + rowH * 0.22)}" width="${n(w)}" height="${n(rowH * 0.56)}" rx="8" fill="${col}" stroke="${C.ink}" stroke-width="2"/>
      ${text(val, barX + w + 14, y + rowH / 2 + 11, { size: 30, font: 'display', fill: r.highlight ? P.goldDark : C.ink })}`;
    return `<g opacity="${n(clamp((t - ra) * 6))}">${inner}</g>`;
  }).join('');
  return backdrop() + `<g ${shadow}><rect x="160" y="70" width="960" height="590" rx="20" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
    <rect x="160" y="70" width="960" height="90" rx="20" fill="${P.ink}"/><rect x="160" y="130" width="960" height="30" fill="${P.ink}"/>
    ${text(title, 640, 130, { size: 42, font: 'display', fill: P.paper, anchor: 'middle' })}
    ${body}`;
}

// ---------- winners vs losers ----------
function miniBars(x, y, w, h, trend, t, at) {
  const vals = trend === 'down' ? [0.95, 0.8, 0.62, 0.45, 0.3] : [0.3, 0.45, 0.6, 0.78, 0.95];
  const col = trend === 'down' ? P.red : P.green;
  const bw = w / vals.length;
  const bars = vals.map((v, i) => {
    const g = ease.out(prog(t, at + i * 0.08, 0.5));
    const bh = v * h * g;
    return `<rect x="${n(x + i * bw + 6)}" y="${n(y + h - bh)}" width="${n(bw - 12)}" height="${n(bh)}" fill="${col}" stroke="${C.ink}" stroke-width="2"/>`;
  }).join('');
  const k = ease.inOut(prog(t, at + 0.3, 0.6));
  const ax0 = x + 10, ay0 = trend === 'down' ? y + 10 : y + h - 10, ax1 = x + w - 10, ay1 = trend === 'down' ? y + h - 30 : y + 4;
  const ex = lerp(ax0, ax1, k), ey = lerp(ay0, ay1, k);
  const ang = (Math.atan2(ay1 - ay0, ax1 - ax0) * 180) / Math.PI;
  const arrow = k > 0 ? `<path d="M${ax0} ${ay0} L${n(ex)} ${n(ey)}" stroke="${col}" stroke-width="6" stroke-linecap="round"/><path d="M0 0 L-18 -11 L-18 11 Z" fill="${col}" transform="translate(${n(ex)} ${n(ey)}) rotate(${n(ang)})"/>` : '';
  return bars + arrow;
}

function wlCard(side, x, t, at) {
  const trend = side.trend || 'up';
  const col = trend === 'down' ? P.red : P.green;
  const w = 400, y = 120, h = 470;
  const items = (side.items || []).slice(0, 4);
  const inner = `<g ${shadow}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
    <rect x="${x}" y="${y}" width="${w}" height="76" rx="18" fill="${col}"/><rect x="${x}" y="${y + 50}" width="${w}" height="26" fill="${col}"/>
    <path d="M${x} ${y + 76} H${x + w}" stroke="${C.ink}" stroke-width="3"/>
    ${text(side.title || '', x + w / 2, y + 52, { size: 36, font: 'display', fill: P.paper, anchor: 'middle' })}
    ${miniBars(x + 40, y + 100, w - 80, 170, trend, t, at + 0.2)}
    ${items.map((it, i) => text(it, x + w / 2, y + 330 + i * 34, { size: 28, anchor: 'middle' })).join('')}
    ${side.caption ? text(side.caption, x + w / 2, y + h + 44, { size: 34, font: 'hand', fill: col, anchor: 'middle' }) : ''}`;
  return popAt(x + w / 2, y + h / 2, pop(t, at), inner);
}

function winnersLosers(spec, t) {
  const at = spec.at ?? 0.3;
  const verdictAt = spec.verdictAt ?? at + 1.4;
  const left = { trend: 'up', ...(spec.left || {}) };
  const right = { trend: 'down', ...(spec.right || {}) };
  const sym = spec.symbol || (left.trend === 'up' && right.trend === 'down' ? '>' : 'vs');
  return backdrop() + wlCard(left, 140, t, at) + wlCard(right, 740, t, at + 0.5)
    + popAt(640, 355, pop(t, verdictAt), `<circle cx="640" cy="355" r="54" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/>${text(sym, 640, 355 + (sym === '>' ? 26 : 16), { size: sym === '>' ? 76 : 44, font: 'display', anchor: 'middle', fill: C.ink })}`);
}

// ---------- calendar flip ----------
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
function parseMonthYear(s) {
  const m = String(s).trim().toUpperCase().match(/^([A-Z]+)\.?\s+(\d{4})$/);
  if (!m) return null;
  const idx = MONTHS.findIndex((x) => x.startsWith(m[1].slice(0, 3)));
  return idx < 0 ? null : { m: idx, y: Number(m[2]) };
}
function pagesBetween(from, to) {
  const a = parseMonthYear(from), b = parseMonthYear(to);
  if (!a || !b) return [from, to];
  const out = [];
  for (let i = a.y * 12 + a.m; i <= b.y * 12 + b.m; i++) out.push(`${MONTHS[i % 12]} ${Math.floor(i / 12)}`);
  if (out.length <= 8) return out;
  const pick = [out[0]];
  for (let k = 1; k < 7; k++) pick.push(out[Math.round((k * (out.length - 1)) / 7)]);
  pick.push(out[out.length - 1]);
  return pick;
}

function calPage(label, x, y, w, h) {
  const parts = String(label).trim().split(/\s+/);
  const year = /^\d{4}$/.test(parts[parts.length - 1]) ? parts.pop() : '';
  const month = parts.join(' ');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="${w}" height="92" fill="${P.red}" stroke="${C.ink}" stroke-width="3"/>
    ${text(month, x + w / 2, y + 66, { size: month.length > 9 ? 46 : 54, font: 'display', fill: P.paper, anchor: 'middle' })}
    ${year ? text(year, x + w / 2, y + h / 2 + 100, { size: 150, font: 'display', fill: C.ink, anchor: 'middle' }) : ''}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${n(x + 40 + i * ((w - 80) / 7))}" y="${y + h - 64}" width="${n((w - 80) / 7 - 10)}" height="22" fill="${C.grid}"/>`).join('')}`;
}

function calendarFlip(spec, t) {
  const at = spec.at ?? 0.4, dur = spec.dur ?? 1.6;
  const pages = pagesBetween(spec.from, spec.to);
  const flips = pages.length - 1;
  const x = 390, y = 110, w = 500, h = 480;
  const step = flips ? dur / flips : 1;
  const f = clamp((t - at) / step, 0, flips); // how many pages have flipped (fractional)
  const cur = Math.min(flips, Math.floor(f));
  const k = f - cur; // progress of the page currently flipping
  const under = calPage(pages[Math.min(flips, cur + 1)], x, y, w, h);
  const top = calPage(pages[cur], x, y, w, h);
  // the flipping page lifts from the top hinge: scaleY 1 -> 0 -> slightly negative, drifting up
  const flipping = cur < flips && k > 0
    ? `<g transform="translate(0 ${n(y)}) scale(1 ${n(Math.cos(k * Math.PI * 0.6))}) translate(0 ${n(-y)})" opacity="${n(1 - k)}">${top}</g>`
    : top;
  const rings = [0, 1, 2, 3, 4].map((i) => `<rect x="${x + 70 + i * 90}" y="${y - 26}" width="14" height="46" rx="7" fill="${P.greyDark}" stroke="${C.ink}" stroke-width="2.5"/>`).join('');
  return `<rect width="1280" height="720" fill="#b9c4c0"/><rect y="560" width="1280" height="160" fill="#8b6a52"/>
    <path d="M0 560 H1280" stroke="${P.woodDark}" stroke-width="4"/>
    <g ${shadow}><rect x="${x - 16}" y="${y - 10}" width="${w + 32}" height="${h + 30}" rx="8" fill="${P.woodMid}" stroke="${C.ink}" stroke-width="3"/></g>
    ${cur < flips ? under : ''}${flipping}${rings}`;
}

// ---------- cheque ----------
function cheque(spec, t) {
  const { payer = 'FIRST NATIONAL BANK', payee = '', amount = 0, memo = '' } = spec;
  const at = spec.at ?? 0.3;
  const signAt = spec.signAt ?? at + 1.8;
  const amt = typeof amount === 'number' ? `$${fmtNum(amount, 0)}` : String(amount);
  const x = 140, y = 150, w = 1000, h = 420;
  const r = rng(5);
  const guill = Array.from({ length: 9 }, (_, i) => `<path d="M${x} ${y + 40 + i * 42} Q${x + w / 2} ${y + 20 + i * 42 + r() * 30} ${x + w} ${y + 40 + i * 42}" stroke="${C.chequeLine}" stroke-width="1.5" fill="none"/>`).join('');
  const payeeShown = esc(payee).slice(0, Math.max(0, Math.floor((t - at) * 26)));
  const amtShown = amt.slice(0, Math.max(0, Math.floor((t - at - 0.7) * 18)));
  const sk = ease.inOut(prog(t, signAt, 0.8));
  const sig = 'M760 505 q12 -38 26 -6 q10 22 22 -10 q8 -26 20 4 q10 22 24 -14 q6 -16 18 2 q10 16 30 -4 q14 -12 34 -2';
  const sigLen = 420;
  return `<rect width="1280" height="720" fill="#7d5238"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 64 + 20} Q640 ${i * 64 + 4 + r() * 30} 1280 ${i * 64 + 24}" stroke="#6a4430" stroke-width="2" fill="none" opacity=".5"/>`).join('')}
    <g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.chequeTint}" stroke="${C.ink}" stroke-width="3"/></g>
    ${guill}
    ${emblem(x + 56, y + 58, 30, String(payer)[0], C.teal)}
    ${text(payer, x + 100, y + 70, { size: 32, font: 'hand' })}
    ${text('DATE ________________', x + w - 40, y + 70, { size: 24, anchor: 'end', fill: C.soft })}
    ${text('PAY TO THE ORDER OF', x + 40, y + 170, { size: 22, fill: C.soft })}
    <path d="M${x + 250} ${y + 172} H${x + w - 300}" stroke="${C.ink}" stroke-width="2"/>
    ${text(payeeShown, x + 262, y + 162, { size: 44, font: 'script' })}
    <rect x="${x + w - 280}" y="${y + 120}" width="240" height="66" rx="6" fill="${C.card}" stroke="${C.ink}" stroke-width="2.5"/>
    ${text(amtShown, x + w - 160, y + 166, { size: amt.length > 12 ? 30 : 36, font: 'display', anchor: 'middle' })}
    ${text('MEMO', x + 40, y + 350, { size: 22, fill: C.soft })}
    <path d="M${x + 110} ${y + 352} H${x + 480}" stroke="${C.ink}" stroke-width="2"/>
    ${memo ? text(memo, x + 120, y + 344, { size: 34, font: 'script', opacity: clamp((t - at - 1.2) * 4) }) : ''}
    <path d="M${x + 600} ${y + 352} H${x + w - 40}" stroke="${C.ink}" stroke-width="2"/>
    ${sk > 0 ? `<path d="${sig}" fill="none" stroke="${C.navy}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${sigLen}" stroke-dashoffset="${n(sigLen * (1 - sk))}"/>` : ''}`;
}

// ---------- count-up ----------
function countUp(spec, t) {
  const { value = 0, prefix = '', suffix = '', caption = '' } = spec;
  const at = spec.at ?? 0.3, dur = spec.dur ?? 1.2;
  const k = ease.out(prog(t, at, dur));
  const dec = value % 1 ? 1 : 0;
  const str = `${prefix}${fmtNum(value * k, dec)}${suffix}`;
  const fin = `${prefix}${fmtNum(value, dec)}${suffix}`;
  const size = Math.min(150, 1100 / Math.max(4, fin.length * 0.56));
  const o = clamp((t - at) * 5);
  return backdrop() + `<g opacity="${n(o)}">
    ${text(str, 640, 380, { size: n(size), font: 'display', fill: C.ink, anchor: 'middle' })}
    ${caption ? text(caption, 640, 380 + size * 0.5 + 10, { size: 40, font: 'hand', fill: C.soft, anchor: 'middle' }) : ''}
  </g>`;
}

module.exports = { stockChart, tickerChip, rankingBoard, winnersLosers, calendarFlip, cheque, countUp, DATAKIT_COLORS: C };
