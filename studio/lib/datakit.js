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
//   calendarFlip({ from: 'MARCH 2007', to: 'SEPT 2008', at, dur, circle })
//     A wall calendar whose pages flip from one date to the other. If both are "MONTH YEAR", the months in between are shown.
//     Day pages: when a date ends in a day number (<= 31), e.g. from 'JULY 24' to 'JULY 29' (or 'JULY 28' -> 'AUGUST 3'),
//     each page shows the month header and a big day number, flipping through every day (up to 9 pages, evenly picked);
//     a red pencil circle then rings the last day (circle: false to skip). Anything else is shown as given ("from" then "to").
//   cheque({ payer, payee, amount, memo, at, signAt })
//     A cheque on a desk; payee and amount write in, then the signature scribbles on at signAt.
//   countUp({ value, prefix, suffix, caption, at, dur })      Big centred count-up on a light backdrop.
//   countDown({ from, to, prefix, suffix, caption, at, dur })
//     countUp's look, falling: the red number drops from `from` to `to` over dur (default 1.4s) with a red down-arrow
//     beside it. e.g. { from: 45, to: 10, prefix: '$', suffix: ' BILLION', caption: 'WIPED OFF IN A WEEK' }.
//   ledger({ title, rows: [{ date, name, amount, note, at }], total, at, prefix })
//     A handwritten ledger book (two ruled pages, Caveat script). Each row writes in left to right across the spread at its
//     `at` (default at + 0.5 + 0.7 per row): date and name on the left page, note and amount on the right. Amounts may be
//     numbers (formatted with prefix, default '$') or strings; negatives ('-', '−' or '(') are red. Up to ~8 rows.
//     total: optional number | string | { label, amount, at } -> a TOTAL line with a double rule under it.
//   donut({ title, slices: [{ label, value, color, at }], center, centerSub, unit, hole, at })
//     A donut (hole: false = pie) that grows slice by slice (slice at default at + 0.45 each), with a legend of
//     label + percent (and value when unit is given, e.g. '$B'). The biggest slice is gold (unless coloured) and pops out
//     once all slices are in. center: text in the hole (default: the biggest slice's percent).
//   dualChart({ title, a: { label, data, color }, b: { label, data, color }, at, splitAt, splitX, drawDur, splitLabel, rebase })
//     Two lines on one card. data: [y, ...] or [[x, y], ...]. Both are rebased to 100 at their first point (rebase: false
//     keeps raw values on one shared scale). The lines draw together up to splitX (data x; default: where they first
//     differ by >3%) between at and splitAt, then the rest (b diverging) draws over drawDur (1.2s) from splitAt.
//     Colour by default: red if the series ends down >3%, green if up >5%, else navy. Legend chips show each % change.
//   leverage({ own, borrowed, move, at, moveAt, prefix, suffix })
//     "$1 of yours + $4 borrowed": a stack of bricks (yours gold on top, borrowed navy) builds from `at`, with the
//     equation on top. At moveAt the price move (move: -30, '-30%' or -0.3) pops; a loss chunk turns red and tumbles off
//     the top (it eats your part first), or a gain grows on top in green. The result card shows "YOUR $1 -> $0" and a
//     stamp: WIPED OUT (red) when the loss is >= your stake, else the % change on your money.
//
// No real logos anywhere: companies are lettered emblems plus names.

const P = require('./palette');
const { n, text, textWidth, esc } = require('./svg');
const { prog, ease, clamp, pop, lerp, rng } = require('./motion');
const { measure } = require('./screens');

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
const monthIdx = (w) => MONTHS.findIndex((x) => x.startsWith(String(w).slice(0, 3)));
function parseMonthYear(s) {
  const m = String(s).trim().toUpperCase().match(/^([A-Z]+)\.?\s+(\d{4})$/);
  if (!m) return null;
  const idx = monthIdx(m[1]);
  return idx < 0 ? null : { m: idx, y: Number(m[2]) };
}
// "JULY 24" -> { m: 6, d: 24 } (day mode: the string ends in a number <= 31)
function parseMonthDay(s) {
  const m = String(s).trim().toUpperCase().match(/^([A-Z]+)\.?\s+(\d{1,2})$/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 31) return null;
  const idx = monthIdx(m[1]);
  return idx < 0 ? null : { m: idx, d: Number(m[2]) };
}
const pickPages = (out, max = 9) => {
  if (out.length <= max) return out;
  const pick = [out[0]];
  for (let k = 1; k < max - 1; k++) pick.push(out[Math.round((k * (out.length - 1)) / (max - 1))]);
  pick.push(out[out.length - 1]);
  return pick;
};
function pagesBetween(from, to) {
  const da = parseMonthDay(from), db = parseMonthDay(to);
  if (da && db) {
    const day = 864e5;
    const t0 = Date.UTC(2001, da.m, da.d);
    let t1 = Date.UTC(2001, db.m, db.d);
    if (t1 < t0) t1 = Date.UTC(2002, db.m, db.d); // wraps over New Year
    const out = [];
    for (let x = t0; x <= t1 && out.length < 400; x += day) { const d = new Date(x); out.push(`${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`); }
    return pickPages(out);
  }
  const a = parseMonthYear(from), b = parseMonthYear(to);
  if (!a || !b) return [from, to];
  const out = [];
  for (let i = a.y * 12 + a.m; i <= b.y * 12 + b.m; i++) out.push(`${MONTHS[i % 12]} ${Math.floor(i / 12)}`);
  return pickPages(out, 8);
}

function calPage(label, x, y, w, h) {
  const md = parseMonthDay(label);
  const parts = String(label).trim().split(/\s+/);
  const year = !md && /^\d{4}$/.test(parts[parts.length - 1]) ? parts.pop() : '';
  const month = md ? MONTHS[md.m] : parts.join(' ');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="${w}" height="92" fill="${P.red}" stroke="${C.ink}" stroke-width="3"/>
    <g data-qa="text" data-qn="calendar '${esc(label)}'">${text(month, x + w / 2, y + 66, { size: month.length > 9 ? 46 : 54, font: 'display', fill: P.paper, anchor: 'middle' })}
    ${md ? text(String(md.d), x + w / 2, y + h / 2 + 118, { size: 250, font: 'display', fill: C.ink, anchor: 'middle' }) : ''}
    ${year ? text(year, x + w / 2, y + h / 2 + 100, { size: 150, font: 'display', fill: C.ink, anchor: 'middle' }) : ''}</g>
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
  const under = calPage(pages[Math.min(flips, cur + 1)], x, y, w, h).replace(/ data-qa="text"/g, ''); // only the top page is checked
  const top = calPage(pages[cur], x, y, w, h);
  // the flipping page lifts from the top hinge: scaleY 1 -> 0 -> slightly negative, drifting up
  const flipping = cur < flips && k > 0
    ? `<g transform="translate(0 ${n(y)}) scale(1 ${n(Math.cos(k * Math.PI * 0.6))}) translate(0 ${n(-y)})" opacity="${n(1 - k)}">${top}</g>`
    : top;
  const rings = [0, 1, 2, 3, 4].map((i) => `<rect x="${x + 70 + i * 90}" y="${y - 26}" width="14" height="46" rx="7" fill="${P.greyDark}" stroke="${C.ink}" stroke-width="2.5"/>`).join('');
  // day mode: a red pencil circle rings the last day once the flipping stops
  let ring = '';
  if (parseMonthDay(pages[flips]) && spec.circle !== false) {
    const ck = ease.inOut(prog(t, at + dur + 0.15, 0.5));
    const cx = x + w / 2, cy = y + h / 2 + 32;
    const d = `M${cx - 150} ${cy - 40} C${cx - 160} ${cy - 150} ${cx + 160} ${cy - 160} ${cx + 165} ${cy - 10} C${cx + 170} ${cy + 130} ${cx - 150} ${cy + 140} ${cx - 168} ${cy + 10} C${cx - 172} ${cy - 50} ${cx - 120} ${cy - 110} ${cx - 60} ${cy - 128}`;
    const len = 1150;
    if (ck > 0) ring = `<path d="${d}" fill="none" stroke="${P.red}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${n(len * (1 - ck))}" opacity=".9"/>`;
  }
  return `<rect width="1280" height="720" fill="#b9c4c0"/><rect y="560" width="1280" height="160" fill="#8b6a52"/>
    <path d="M0 560 H1280" stroke="${P.woodDark}" stroke-width="4"/>
    <g ${shadow}><rect x="${x - 16}" y="${y - 10}" width="${w + 32}" height="${h + 30}" rx="8" fill="${P.woodMid}" stroke="${C.ink}" stroke-width="3"/></g>
    ${cur < flips ? under : ''}${flipping}${rings}${ring}`;
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

// ---------- shared helpers for the newer kinds ----------
const qa = (name, inner) => `<g data-qa="text" data-qn="${esc(String(name).slice(0, 28))}">${inner}</g>`;
const isNeg = (v) => (typeof v === 'number' ? v < 0 : /^\s*[-−(]/.test(String(v ?? '')));
function fmtMoney(v, prefix = '$', suffix = '') {
  if (typeof v !== 'number') return String(v ?? '').replace(/^-/, '−');
  const a = Math.abs(v);
  return `${v < 0 ? '−' : ''}${prefix}${fmtNum(a, a % 1 ? 2 : 0)}${suffix}`;
}
// percent: -30, '-30%', '−30%' or -0.3 -> -0.3
function toFrac(m) {
  const v = typeof m === 'number' ? m : parseFloat(String(m ?? 0).replace('−', '-'));
  if (!Number.isFinite(v)) return 0;
  return Math.abs(v) > 1.5 || (typeof m === 'string' && /%/.test(m)) ? v / 100 : v;
}
const fmtPct = (f) => `${f > 0 ? '+' : f < 0 ? '−' : ''}${fmtNum(Math.abs(f * 100), Math.abs(f * 100) < 10 && (f * 100) % 1 ? 1 : 0)}%`;
function downArrow(cx, cy, s, col) {
  return `<path d="M${n(cx - s * 0.22)} ${n(cy - s * 0.6)} H${n(cx + s * 0.22)} V${n(cy + s * 0.02)} H${n(cx + s * 0.5)} L${n(cx)} ${n(cy + s * 0.62)} L${n(cx - s * 0.5)} ${n(cy + s * 0.02)} H${n(cx - s * 0.22)} Z" fill="${col}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
}
function deskBg(seed = 7) {
  const r = rng(seed);
  return `<rect width="1280" height="720" fill="#7d5238"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 64 + 20} Q640 ${i * 64 + 4 + r() * 30} 1280 ${i * 64 + 24}" stroke="#6a4430" stroke-width="2" fill="none" opacity=".5"/>`).join('')}`;
}

// ---------- count-down ----------
function countDown(spec, t) {
  const { from = 100, to = 0, prefix = '', suffix = '', caption = '' } = spec;
  const at = spec.at ?? 0.3, dur = spec.dur ?? 1.4;
  const k = ease.out(prog(t, at, dur));
  const dec = from % 1 || to % 1 ? 1 : 0;
  const fmt = (v) => `${prefix}${fmtNum(v, dec)}${suffix}`;
  const str = fmt(lerp(from, to, k));
  const longest = [fmt(from), fmt(to)].sort((p, q) => q.length - p.length)[0];
  const size = Math.min(150, 1000 / Math.max(4, longest.length * 0.56));
  const wMax = Math.max(measure(fmt(from), size, 'display'), measure(fmt(to), size, 'display'));
  const aw = size * 0.75, gap = 34;
  const cx = 640 + (aw + gap) / 2; // number + arrow centred as one group
  const ax = cx - wMax / 2 - gap - aw / 2;
  const bob = k < 1 ? Math.sin((t - at) * 9) * 6 * (1 - k) : 0;
  const ay = 380 - size * 0.36 + bob + (1 - ease.out(prog(t, at, 0.35))) * -30;
  const o = clamp((t - at) * 5);
  return backdrop() + `<g opacity="${n(o)}">
    ${downArrow(ax, ay, size * 0.95, P.red)}
    ${qa(`count '${longest}'`, text(str, cx, 380, { size: n(size), font: 'display', fill: P.red, anchor: 'middle' }))}
    ${caption ? qa('caption', text(caption, 640, 380 + size * 0.5 + 10, { size: 40, font: 'hand', fill: C.soft, anchor: 'middle' })) : ''}
  </g>`;
}

// ---------- ledger ----------
function ledger(spec, t) {
  const { title = 'Accounts', rows = [] } = spec;
  const at = spec.at ?? 0.3;
  const prefix = spec.prefix ?? '$';
  const tot = spec.total == null ? null : typeof spec.total === 'object' ? spec.total : { amount: spec.total };
  const list = rows.slice(0, 9);
  const nRows = list.length + (tot ? 1 : 0);
  const top = 298, rh = Math.min(60, (640 - top) / Math.max(1, nRows));
  const rowAt = (r, i) => r.at ?? at + 0.5 + i * 0.7;
  const r = rng(11);
  // pages (left 110..640, right 640..1170), slightly bowed at the spine
  const pageL = 'M110 88 Q380 74 640 96 V666 Q380 650 110 664 Z';
  const pageR = 'M640 96 Q900 74 1170 88 V664 Q900 650 640 666 Z';
  const rules = [];
  for (let i = 0; i <= Math.ceil((640 - top) / rh); i++) {
    const yy = top + 12 + i * rh;
    if (yy > 650) break;
    rules.push(`<path d="M128 ${n(yy)} H622 M658 ${n(yy)} H1152" stroke="${P.blue}" stroke-width="1.6" opacity=".35"/>`);
  }
  const cols = `<path d="M252 206 V650 M258 206 V650" stroke="${P.red}" stroke-width="1.6" opacity=".55"/>
    <path d="M990 206 V650 M1152 206 V650" stroke="${P.blue}" stroke-width="1.6" opacity=".45"/>`;
  const heads = `${text('DATE', 140, 232, { size: 22, fill: C.soft, spacing: 1 })}${text('DETAILS', 272, 232, { size: 22, fill: C.soft, spacing: 1 })}
    ${text('NOTE', 668, 232, { size: 22, fill: C.soft, spacing: 1 })}${text('AMOUNT', 1142, 232, { size: 22, fill: C.soft, anchor: 'end', spacing: 1 })}
    <path d="M128 244 H622 M658 244 H1152" stroke="${C.ink}" stroke-width="2" opacity=".6"/>`;
  const fit = (str, maxW, size) => Math.min(size, (maxW / Math.max(1, measure(str, 1, 'hand') * 0.92)));
  let pen = null;
  const writeRow = (i, ra, inner, dur = 1.0, x0 = 120) => {
    if (t < ra) return '';
    const k = ease.inOut(prog(t, ra, dur));
    const wx = x0 + k * (1165 - x0);
    if (k < 1) pen = [wx, top + i * rh];
    return `<defs><clipPath id="ldg${i}"><rect x="100" y="${n(top + i * rh - rh)}" width="${n(wx - 100)}" height="${n(rh + 20)}"/></clipPath></defs><g clip-path="url(#ldg${i})">${inner}</g>`;
  };
  const body = list.map((row, i) => {
    const y = top + i * rh;
    const amt = fmtMoney(row.amount ?? '', prefix);
    const col = isNeg(row.amount) ? P.red : C.ink;
    const name = String(row.name ?? '');
    const note = String(row.note ?? '');
    const sz = Math.min(40, rh * 0.72);
    const inner = `${text(String(row.date ?? ''), 138, y, { size: n(fit(String(row.date ?? ''), 108, sz * 0.9)), font: 'script' })}
      ${text(name, 272, y, { size: n(fit(name, 340, sz)), font: 'script' })}
      ${text(note, 668, y, { size: n(fit(note, 310, sz * 0.85)), font: 'script', fill: C.soft })}
      ${text(amt, 1142, y, { size: n(fit(amt, 145, sz)), font: 'script', fill: col, anchor: 'end' })}`;
    return writeRow(i, rowAt(row, i), qa(`ledger row ${i + 1}`, inner));
  }).join('');
  let total = '';
  if (tot) {
    const i = list.length;
    const y = top + i * rh;
    const ta = tot.at ?? (list.length ? rowAt(list[list.length - 1], list.length - 1) + 0.9 : at + 0.5);
    const amt = fmtMoney(tot.amount ?? '', prefix);
    const col = isNeg(tot.amount) ? P.red : C.ink;
    const k = ease.inOut(prog(t, ta, 0.35));
    total = (k > 0 ? `<path d="M1000 ${n(y - rh * 0.78)} H${n(1000 + 150 * k)}" stroke="${C.ink}" stroke-width="2.5"/>` : '')
      + writeRow(i, ta + 0.2, qa('ledger total', `${text(tot.label || 'TOTAL', 980, y, { size: n(Math.min(40, rh * 0.72)), font: 'script', anchor: 'end' })}
        ${text(amt, 1142, y, { size: n(fit(amt, 145, Math.min(44, rh * 0.78))), font: 'script', fill: col, anchor: 'end' })}
        <path d="M1000 ${n(y + 10)} H1150 M1000 ${n(y + 16)} H1150" stroke="${col}" stroke-width="2.5"/>`), 0.5, 860);
  }
  // a fountain pen rides the writing line
  const penSvg = pen ? `<g transform="translate(${n(pen[0])} ${n(pen[1] - 6)}) rotate(-35)">
      <path d="M0 0 L10 -18 L-10 -18 Z" fill="${P.goldDark}" stroke="${C.ink}" stroke-width="2"/>
      <rect x="-11" y="-118" width="22" height="100" rx="6" fill="${C.navy}" stroke="${C.ink}" stroke-width="2.5"/>
      <rect x="-11" y="-60" width="22" height="8" fill="${P.gold}"/></g>` : '';
  const o = clamp((t - at + 0.3) * 4);
  return deskBg(9) + `<g opacity="${n(o)}">
    <g filter="url(#softShadow)"><rect x="92" y="62" width="1096" height="622" rx="14" fill="${P.redDark}" stroke="${C.ink}" stroke-width="4"/></g>
    <path d="${pageL}" fill="${P.paper}" stroke="${C.ink}" stroke-width="3"/>
    <path d="${pageR}" fill="${P.paper}" stroke="${C.ink}" stroke-width="3"/>
    <defs><linearGradient id="ldgSpine" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
    <rect x="590" y="90" width="100" height="574" fill="url(#ldgSpine)"/>
    <path d="M640 96 V666" stroke="${C.ink}" stroke-width="2.5"/>
    ${rules.join('')}${cols}
    ${qa('ledger title', text(title, 140, 180, { size: 58, font: 'script' }))}
    <path d="M140 194 Q${n(260 + r() * 40)} 188 ${n(150 + Math.min(440, measure(title, 58, 'hand') * 0.85))} 192" stroke="${P.red}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${heads}${body}${total}${penSvg}
  </g>`;
}

// ---------- donut ----------
function arcPath(cx, cy, r0, r1, a0, a1) {
  a1 = Math.min(a1, a0 + Math.PI * 2 - 1e-3);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r, a) => `${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  if (r0 <= 0) return `M${cx} ${cy} L${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} Z`;
  return `M${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

function donut(spec, t) {
  const { title = '' } = spec;
  const at = spec.at ?? 0.3;
  const slices = (spec.slices || []).slice(0, 8);
  const sum = slices.reduce((a, s) => a + Math.max(0, s.value || 0), 0) || 1;
  const big = slices.reduce((bi, s, i) => ((s.value || 0) > (slices[bi]?.value || 0) ? i : bi), 0);
  const MUTED = [C.navy, C.teal, P.blue, P.greyDark, P.wallDark, P.woodMid, P.wallTrim];
  let mi = 0;
  const cols = slices.map((s, i) => s.color || (i === big ? P.gold : MUTED[mi++ % MUTED.length]));
  const sAt = slices.map((s, i) => s.at ?? at + 0.25 + i * 0.45);
  const allIn = Math.max(...sAt.map((x) => x + 0.5), at);
  const cx = 400, cy = 400, r1 = 205, r0 = spec.hole === false ? 0 : 110;
  const { prefix, suffix } = parseUnit(spec.unit);
  let a = -Math.PI / 2;
  const popK = ease.outBack(prog(t, allIn, 0.35));
  const arcs = slices.map((s, i) => {
    const frac = Math.max(0, s.value || 0) / sum;
    const a0 = a, a1 = a + frac * Math.PI * 2;
    a = a1;
    const g = ease.out(prog(t, sAt[i], 0.5));
    if (g <= 0) return '';
    const mid = (a0 + a1) / 2;
    const off = i === big ? 18 * popK : 0;
    return `<g transform="translate(${n(Math.cos(mid) * off)} ${n(Math.sin(mid) * off)})"><path d="${arcPath(cx, cy, r0, r1, a0, a0 + (a1 - a0) * g)}" fill="${cols[i]}" stroke="${C.ink}" stroke-width="${i === big && popK > 0 ? 4 : 3}" stroke-linejoin="round"/></g>`;
  });
  // draw the biggest last so its outline sits on top
  const arcSvg = arcs.filter((_, i) => i !== big).join('') + (arcs[big] || '');
  const rowH = Math.min(70, 400 / Math.max(1, slices.length));
  const ly = 236;
  const legend = slices.map((s, i) => {
    if (t < sAt[i]) return '';
    const y = ly + i * rowH;
    const pct = `${fmtNum((Math.max(0, s.value || 0) / sum) * 100, 0)}%`;
    const val = spec.unit ? `${prefix}${fmtNum(s.value, s.value % 1 ? 1 : 0)}${suffix}` : '';
    const hl = i === big && popK > 0 ? `<rect x="690" y="${n(y - rowH * 0.42)}" width="${n(460 * clamp(popK))}" height="${n(rowH * 0.84)}" rx="12" fill="${P.gold}" opacity=".35"/>` : '';
    const lw = 1000 - 760 - (val ? measure(val, 26, 'hand') + 16 : 0);
    const lsize = Math.min(32, lw / Math.max(1, measure(String(s.label), 1, 'hand')));
    return `<g opacity="${n(clamp((t - sAt[i]) * 6))}">${hl}
      <rect x="708" y="${n(y - 17)}" width="34" height="34" rx="8" fill="${cols[i]}" stroke="${C.ink}" stroke-width="2.5"/>
      ${qa(`slice '${s.label}'`, text(String(s.label), 760, y + 11, { size: n(lsize), font: 'hand' }) + (val ? text(val, 1000, y + 10, { size: 26, font: 'hand', fill: C.soft, anchor: 'end' }) : ''))}
      ${qa(`pct '${s.label}'`, text(pct, 1130, y + 13, { size: 36, font: 'display', anchor: 'end', fill: i === big ? P.goldDark : C.ink }))}</g>`;
  }).join('');
  const center = spec.center ?? (t >= allIn ? `${fmtNum(((slices[big]?.value || 0) / sum) * 100, 0)}%` : '');
  const cSize = Math.min(58, (r0 * 1.6) / Math.max(1, measure(String(center), 1, 'display')));
  const centerSvg = r0 > 0 && center ? qa('donut centre', text(String(center), cx, cy + (spec.centerSub ? 8 : cSize * 0.36), { size: n(cSize), font: 'display', anchor: 'middle', fill: spec.center == null ? P.goldDark : C.ink })
    + (spec.centerSub ? text(spec.centerSub, cx, cy + 44, { size: 24, font: 'hand', fill: C.soft, anchor: 'middle' }) : '')) : '';
  return backdrop() + `<g ${shadow}><rect x="90" y="60" width="1100" height="610" rx="22" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
    <rect x="90" y="60" width="1100" height="90" rx="22" fill="${P.ink}"/><rect x="90" y="120" width="1100" height="30" fill="${P.ink}"/>
    ${qa('donut title', text(title, 640, 120, { size: Math.min(42, 1000 / Math.max(1, measure(title, 1, 'display'))), font: 'display', fill: P.paper, anchor: 'middle' }))}
    <circle cx="${cx}" cy="${cy}" r="${r1}" fill="${C.grid}"/>${r0 ? `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="${C.card}"/>` : ''}
    ${arcSvg}${centerSvg}${legend}`;
}

// ---------- dual chart ----------
function dualChart(spec, t) {
  const { title = '' } = spec;
  const at = spec.at ?? 0.3;
  const norm = (d) => (d || []).map((p, i) => (Array.isArray(p) ? p : [i, p]));
  let A = norm(spec.a?.data), B = norm(spec.b?.data);
  if (!A.length || !B.length) return backdrop();
  if (spec.rebase !== false) {
    A = A.map(([x, y]) => [x, (y / (A[0][1] || 1)) * 100]);
    B = B.map(([x, y]) => [x, (y / (B[0][1] || 1)) * 100]);
  }
  const xs = [...A, ...B].map((p) => p[0]), ys = [...A, ...B].map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys), pad = (yMax - yMin) * 0.14 || 1;
  const box = { x: 150, y: 250, w: 960, h: 340 };
  const px = (v) => box.x + ((v - x0) / (x1 - x0 || 1)) * box.w;
  const py = (v) => box.y + box.h - ((v - (yMin - pad)) / (yMax - yMin + 2 * pad)) * box.h;
  // where b leaves a (first point >3% apart), unless given
  let splitX = spec.splitX;
  if (splitX == null) {
    const yA = (x) => { for (let i = 1; i < A.length; i++) if (x <= A[i][0]) return lerp(A[i - 1][1], A[i][1], (x - A[i - 1][0]) / (A[i][0] - A[i - 1][0] || 1)); return A[A.length - 1][1]; };
    const j = B.findIndex(([x, y]) => Math.abs(y - yA(x)) / Math.abs(yA(x) || 1) > 0.03);
    splitX = j > 0 ? B[j - 1][0] : j === 0 ? x0 : lerp(x0, x1, 0.6);
  }
  const splitAt = spec.splitAt ?? at + 1.4;
  const d1 = Math.max(0.3, splitAt - at), d2 = spec.drawDur ?? 1.2;
  const curX = t < splitAt ? lerp(x0, splitX, ease.inOut(prog(t, at, d1))) : lerp(splitX, x1, ease.out(prog(t, splitAt, d2)));
  const upTo = (pts) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][0] <= curX) { out.push(pts[i]); continue; }
      const f = (curX - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1);
      if (f > 0) out.push([curX, lerp(pts[i - 1][1], pts[i][1], f)]);
      break;
    }
    return out.map(([x, y]) => [px(x), py(y)]);
  };
  const done = splitAt + d2;
  const series = [['a', A], ['b', B]].map(([key, pts]) => {
    const s = spec[key] || {};
    const chg = pts[pts.length - 1][1] / (pts[0][1] || 1) - 1;
    const col = s.color || (chg <= -0.03 ? P.red : chg >= 0.05 ? P.green : C.navy);
    return { s, pts, chg, col, part: t >= at ? upTo(pts) : [] };
  });
  const lines = series.map(({ part, col }) => {
    if (part.length < 1) return '';
    const d = part.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join(' ');
    const h = part[part.length - 1];
    return (part.length > 1 ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` : '')
      + `<circle cx="${n(h[0])}" cy="${n(h[1])}" r="9" fill="${col}" stroke="${C.ink}" stroke-width="2.5"/>`;
  }).join('');
  const grid = [0, 1, 2, 3].map((i) => `<path d="M${box.x} ${n(box.y + (i * box.h) / 3)} H${box.x + box.w}" stroke="${C.grid}" stroke-width="2"/>`).join('');
  const sx = px(splitX);
  const split = t >= splitAt && splitX > x0 && splitX < x1 ? `<g opacity="${n(clamp((t - splitAt) * 4))}"><path d="M${n(sx)} ${box.y - 6} V${box.y + box.h}" stroke="${C.soft}" stroke-width="2.5" stroke-dasharray="8 8"/>
      ${spec.splitLabel ? qa('split label', text(spec.splitLabel, sx + 12, box.y + 18, { size: 24, fill: C.soft })) : ''}</g>` : '';
  // legend: one row per series, change chip pops when the lines finish
  const legend = series.map(({ s, chg, col }, i) => {
    const y = 196 + i * 0;
    const x = i === 0 ? 150 : 660;
    const lab = String(s.label || (i ? 'B' : 'A'));
    const chip = `${chg >= 0 ? '▲' : '▼'} ${fmtPct(chg)}`;
    const cw = measure(chip, 28, 'hand') + 28;
    const maxL = 450 - cw - 70;
    const ls = Math.min(32, maxL / Math.max(1, measure(lab, 1, 'hand')));
    const chipSvg = popAt(x + 64 + measure(lab, ls, 'hand') + 14 + cw / 2, y, pop(t, done), `<rect x="${n(x + 64 + measure(lab, ls, 'hand') + 14)}" y="${y - 21}" width="${n(cw)}" height="42" rx="21" fill="${col}" stroke="${C.ink}" stroke-width="2"/>${text(chip, x + 64 + measure(lab, ls, 'hand') + 14 + cw / 2, y + 10, { size: 28, anchor: 'middle', fill: P.paper })}`);
    return `<path d="M${x} ${y} H${x + 48}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>
      ${qa(`series '${lab}'`, text(lab, x + 62, y + 11, { size: n(ls), font: 'hand' }))}${chipSvg}`;
  }).join('');
  return backdrop() + `<g ${shadow}><rect x="90" y="60" width="1100" height="610" rx="22" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
    ${qa('chart title', text(title, 150, 128, { size: Math.min(44, 980 / Math.max(1, measure(title, 1, 'display'))), font: 'display' }))}
    <path d="M150 156 H1130" stroke="${C.grid}" stroke-width="2"/>
    ${legend}${grid}${split}${lines}`;
}

// ---------- leverage ----------
function leverage(spec, t) {
  const own = Math.max(0.0001, spec.own ?? 1), borrowed = Math.max(0, spec.borrowed ?? 4);
  const prefix = spec.prefix ?? '$', suffix = spec.suffix ?? '';
  const money = (v) => fmtMoney(v, prefix, suffix);
  const move = toFrac(spec.move ?? -30);
  const at = spec.at ?? 0.3;
  const moveAt = spec.moveAt ?? at + 2;
  const total = own + borrowed;
  const pnl = total * move;
  const after = Math.max(0, own + pnl);
  const wiped = move < 0 && after <= 1e-9;
  const resPct = (after - own) / own;
  // stack geometry: yours on top (it takes the first loss), borrowed below
  const sx = 330, sw = 240, bottom = 600, H = 380;
  const unitH = H / total;
  const ownH = own * unitH, borH = borrowed * unitH;
  const yTop = bottom - H;
  const ratio = borrowed / own;
  const bricks = Number.isInteger(Math.round(ratio * 1000) / 1000) && total / own <= 12 ? Math.round(ratio) : 0;
  // yours lands on the floor first, then each borrowed brick grows in underneath and lifts it up
  const nb = bricks || 1;
  const bh = borH / nb;
  const buildK = (i) => ease.out(prog(t, at + 0.5 + i * 0.18, 0.28));
  const cutY = yTop + (move < 0 ? Math.min(H, -total * move * unitH) : 0); // where the loss cuts the stack
  const fallen = t >= moveAt + 0.9 && move < 0;
  let stack = '', built = 0;
  for (let i = 0; i < nb; i++) {
    const k = buildK(i);
    if (k <= 0) continue;
    const hh = bh * k;
    const y = bottom - built - hh;
    built += hh;
    const label = bricks && bh >= 44 && k > 0.6 && !(fallen && y < cutY - 1);
    stack += `<rect x="${sx}" y="${n(y)}" width="${sw}" height="${n(hh)}" rx="6" fill="${C.navy}" stroke="${C.ink}" stroke-width="3"/>
      ${label ? text(money(own), sx + sw / 2, y + hh / 2 + 12, { size: Math.min(34, bh * 0.5), font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.85 * clamp((k - 0.6) * 4) }) : ''}`;
  }
  const yOwn = bottom - built - ownH;
  const ownK = ease.outBack(prog(t, at, 0.3));
  const ownSvg = ownK > 0 ? `<g opacity="${n(clamp(ownK * 3))}" transform="translate(0 ${n((1 - ownK) * -40)})"><rect x="${sx}" y="${n(yOwn)}" width="${sw}" height="${n(ownH)}" rx="6" fill="${P.gold}" stroke="${C.ink}" stroke-width="3.5"/>
      ${ownH >= 40 ? text(money(own), sx + sw / 2, yOwn + ownH / 2 + 13, { size: Math.min(38, ownH * 0.5), font: 'display', anchor: 'middle' }) : ''}</g>` : '';
  const cutEdge = fallen && cutY > yTop + ownH + 1 ? `<path d="M${sx} ${n(cutY)} l20 -6 l20 6 l20 -6 l20 6 l20 -6 l20 6 l20 -6 l20 6 l20 -6 l20 6 l20 -6 l20 6" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>` : '';
  // the move: loss chunk (red, tumbles off) or gain chunk (green, grows on top)
  const mk = prog(t, moveAt + 0.35, 0.4); // chunk tints
  const fk = ease.in(prog(t, moveAt + 0.9, 0.7)); // chunk falls
  const lossH = move < 0 ? Math.min(H, -pnl * unitH) : 0;
  const gainH = move > 0 ? pnl * unitH * ease.outBack(prog(t, moveAt + 0.35, 0.5)) : 0;
  const clipId = 'levClip';
  const remain = `<defs><clipPath id="${clipId}"><rect x="${sx - 20}" y="${n(yTop + (fk > 0 ? lossH : 0))}" width="${sw + 40}" height="${n(H + 40)}"/></clipPath></defs>`;
  let chunk = '';
  if (lossH > 0 && mk > 0) {
    const inner = `<rect x="${sx}" y="${n(yTop)}" width="${sw}" height="${n(lossH)}" rx="6" fill="${P.red}" stroke="${C.ink}" stroke-width="3.5"/>
      <rect x="${sx}" y="${n(yTop)}" width="${sw}" height="${n(lossH)}" rx="6" fill="url(#hatch)"/>
      ${lossH >= 40 ? text(`−${money(-pnl)}`, sx + sw / 2, yTop + lossH / 2 + 13, { size: Math.min(38, lossH * 0.42), font: 'display', fill: P.paper, anchor: 'middle' }) : ''}`;
    const ccx = sx + sw / 2, ccy = yTop + lossH / 2;
    chunk = `<g opacity="${n(clamp(mk * 1.5) * (1 - fk * fk))}" transform="translate(${n(fk * 230)} ${n(fk * fk * 330)}) rotate(${n(fk * 28)} ${n(ccx)} ${n(ccy)})">${inner}</g>`
      + (fk <= 0 ? `<path d="M${sx - 18} ${n(yTop + lossH)} H${sx + sw + 18}" stroke="${P.red}" stroke-width="4" stroke-dasharray="12 8" opacity="${n(clamp(mk * 2))}"/>` : '');
  }
  const gainSvg = gainH > 0 ? `<rect x="${sx}" y="${n(yTop - gainH)}" width="${sw}" height="${n(gainH)}" rx="6" fill="${P.green}" stroke="${C.ink}" stroke-width="3.5"/>
      ${gainH >= 40 ? text(`+${money(pnl)}`, sx + sw / 2, yTop - gainH / 2 + 13, { size: Math.min(38, gainH * 0.42), font: 'display', fill: P.paper, anchor: 'middle' }) : ''}` : '';
  // side labels
  const strike = fk > 0 && move < 0 ? ease.out(prog(t, moveAt + 1.0, 0.3)) : 0;
  const yoursLbl = ownK > 0 ? `<g opacity="${n(clamp(ownK * 3))}">${qa('yours label', text('YOURS', sx - 24, yOwn + ownH / 2 + 11, { size: 34, font: 'display', fill: P.goldDark, anchor: 'end' }))}
      ${strike > 0.03 ? `<path d="M${n(sx - 32 - measure('YOURS', 34, 'display'))} ${n(yOwn + ownH / 2)} L${n(sx - 32 - measure('YOURS', 34, 'display') + (measure('YOURS', 34, 'display') + 16) * strike)} ${n(yOwn + ownH / 2 - 4)}" stroke="${P.red}" stroke-width="6" stroke-linecap="round"/>` : ''}</g>` : '';
  const borO = clamp((built / (borH || 1) - 0.5) * 4);
  const borLbl = borO > 0 ? `<g opacity="${n(borO)}">${qa('borrowed label', text('BORROWED', sx - 24, bottom - built / 2 + 11, { size: 34, font: 'display', fill: C.navy, anchor: 'end' }))}
      <path d="M${sx - 14} ${n(bottom - built + 8)} Q${sx - 8} ${n(bottom - built / 2)} ${sx - 14} ${bottom - 8}" stroke="${C.soft}" stroke-width="3" fill="none"/></g>` : '';
  // equation on top
  const eqAt = [at, at + 0.5, at + 0.5 + nb * 0.18 + 0.2];
  const parts = [[`${money(own)} YOURS`, P.goldDark], [' + ', C.ink], [`${money(borrowed)} BORROWED`, C.navy], [' = ', C.ink], [`${money(total)} BET`, C.ink]];
  const eqSize = 44;
  const eqW = parts.reduce((w, [s]) => w + measure(s, eqSize, 'display'), 0);
  let ex = 640 - eqW / 2;
  const eq = parts.map(([s, col], i) => {
    const ea = eqAt[Math.ceil(i / 2)];
    const x = ex;
    ex += measure(s, eqSize, 'display');
    const w = measure(s, eqSize, 'display');
    return t >= ea ? `<g opacity="${n(clamp((t - ea) * 5))}">${qa(`equation ${i}`, text(s.trim(), x + w / 2, 104, { size: eqSize, font: 'display', fill: col, anchor: 'middle' }))}</g>` : '';
  }).join('');
  // right panel: price move, the arithmetic, the result
  const movCol = move < 0 ? P.red : P.green;
  const chipTxt = `PRICE ${move < 0 ? '▼' : '▲'} ${fmtPct(move).replace(/^[+−]/, '')}`;
  const chipW = measure(chipTxt, 44, 'display') + 60;
  const chip = popAt(950, 232, pop(t, moveAt), `<rect x="${n(950 - chipW / 2)}" y="194" width="${n(chipW)}" height="76" rx="38" fill="${movCol}" stroke="${C.ink}" stroke-width="3"/>${qa('price move', text(chipTxt, 950, 249, { size: 44, font: 'display', fill: P.paper, anchor: 'middle' }))}`);
  const mathTxt = `${fmtPct(move)} of ${money(total)} = ${pnl < 0 ? '−' : '+'}${money(Math.abs(pnl))}`;
  const math = t >= moveAt + 0.45 ? `<g opacity="${n(clamp((t - moveAt - 0.45) * 5))}">${qa('move maths', text(mathTxt, 950, 330, { size: 36, font: 'hand', fill: C.soft, anchor: 'middle' }))}</g>` : '';
  const rAt = moveAt + 1.1;
  const rk = ease.out(prog(t, rAt, 0.6));
  const shown = own + (after - own) * rk;
  const resCol = after < own ? P.red : P.green;
  const fromTxt = money(own), toTxt = money(Math.round(shown * 100) / 100);
  const card = t >= rAt ? rise(t, rAt, `<g ${shadow}><rect x="735" y="378" width="430" height="170" rx="18" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/></g>
      ${qa('your stake', text('YOUR MONEY', 950, 420, { size: 28, font: 'hand', fill: C.soft, anchor: 'middle', spacing: 2 }))}
      ${qa('result', text(fromTxt, 860, 512, { size: 70, font: 'display', anchor: 'middle' }) + text('→', 950, 506, { size: 56, font: 'display', fill: C.soft, anchor: 'middle' }) + text(toTxt, 1050, 512, { size: Math.min(70, 190 / Math.max(1, measure(toTxt, 1, 'display'))), font: 'display', fill: resCol, anchor: 'middle' }))}`) : '';
  const stampTxt = wiped ? 'WIPED OUT' : fmtPct(resPct);
  const sk = prog(t, rAt + 0.7, 0.22);
  const stamp = sk > 0 ? (() => {
    const s = lerp(1.8, 1, ease.out(sk));
    const sw2 = measure(stampTxt, 54, 'display') + 50;
    return `<g opacity="${n(clamp(sk * 3))}" transform="translate(950 615) rotate(-6) scale(${n(s)})">
      <rect x="${n(-sw2 / 2)}" y="-40" width="${n(sw2)}" height="80" rx="8" fill="${C.card}" fill-opacity=".85" stroke="${resCol}" stroke-width="6"/>
      ${qa('stamp', text(stampTxt, 0, 20, { size: 54, font: 'display', fill: resCol, anchor: 'middle' }))}</g>`;
  })() : '';
  return backdrop() + `${eq}
    <ellipse cx="${sx + sw / 2}" cy="${bottom + 6}" rx="${sw * 0.62}" ry="12" fill="#000" opacity=".12"/>
    ${remain}<g clip-path="url(#${clipId})">${stack}${ownSvg}</g>${cutEdge}${gainSvg}${chunk}
    ${yoursLbl}${borLbl}${chip}${math}${card}${stamp}`;
}

function rise(t, at, inner, dy = 30) {
  if (t < at) return '';
  const k = ease.out(prog(t, at, 0.3));
  return `<g opacity="${n(clamp(k * 1.4))}" transform="translate(0 ${n((1 - k) * dy)})">${inner}</g>`;
}

module.exports = { stockChart, tickerChip, rankingBoard, winnersLosers, calendarFlip, cheque, countUp, countDown, ledger, donut, dualChart, leverage, DATAKIT_COLORS: C };
