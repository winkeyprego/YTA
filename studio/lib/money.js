// Money graphics: cash, coins, bags, gold, vaults, piggy banks, tickers, mini bar charts.
// All pure in t. Accents stay green/gold (money) and red (losses), everything else muted.

const P = require('./palette');
const { n, text } = require('./svg');
const { rng, prog, ease, clamp } = require('./motion');

const o = (w = 3) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;
const NOTE = '#8fb085'; // banknote face (light green)

// A single banknote. value is printed on it.
function banknote(x, y, { s = 1, rot = 0, value = '100' } = {}) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">
    <rect x="-60" y="-28" width="120" height="56" rx="4" fill="${NOTE}" ${o(3)}/>
    <rect x="-52" y="-20" width="104" height="40" rx="3" fill="none" stroke="${P.greenDark}" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="15" ry="16" fill="${P.green}" stroke="${P.greenDark}" stroke-width="2"/>
    ${text(value, -46, -6, { size: 14, font: 'display', fill: P.greenDark })}${text(value, 46, 18, { size: 14, font: 'display', fill: P.greenDark, anchor: 'end' })}
  </g>`;
}

// Stack of cash bricks that grows to `height` px over `dur` seconds from growAt. Base at (x, y).
function cashStack(x, y, height, t, growAt = 0, { w = 120, dur = 0.8 } = {}) {
  const k = ease.out(prog(t, growAt, dur));
  const bricks = Math.floor((height * k) / 18);
  let s = '';
  for (let i = 0; i < bricks; i++) {
    const dx = ((i * 7) % 5) - 2;
    s += `<g transform="translate(${n(x + dx)} ${n(y - 18 * (i + 1))})">
      <rect x="${-w / 2}" y="0" width="${w}" height="18" fill="${NOTE}" ${o(2.5)}/>
      <rect x="-10" y="0" width="20" height="18" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>
    </g>`;
  }
  return `<g>${s}</g>`;
}

function moneyBag(x, y, { s = 1, label = '$', color = '#b89a6a' } = {}) {
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">
    <path d="M-62 0 Q-80 -70 -30 -104 L-22 -118 Q0 -128 22 -118 L30 -104 Q80 -70 62 0 Z" fill="${color}" ${o(4)}/>
    <path d="M-30 -104 Q0 -94 30 -104" fill="none" stroke="${P.ink}" stroke-width="5"/>
    <path d="M-20 -118 L-34 -140 M20 -118 L34 -140 M0 -122 V-144" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>
    ${text(label, 0, -26, { size: 64, font: 'display', fill: P.greenDark, anchor: 'middle' })}
  </g>`;
}

// Pile of coins (pyramid of ellipses), seeded jitter.
function coinPile(x, y, { count = 14, s = 1, seed = 2 } = {}) {
  const r = rng(seed);
  let out = '', i = 0, row = 0;
  while (i < count) {
    const inRow = Math.max(1, 5 - row);
    for (let j = 0; j < inRow && i < count; j++, i++) {
      const cx = (j - (inRow - 1) / 2) * 34 + (r() - 0.5) * 6;
      const cy = -row * 13;
      out += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="18" ry="7" fill="${P.gold}" ${o(2.5)}/><path d="M${n(cx - 18)} ${n(cy)} v5 a18 7 0 0 0 36 0 v-5" fill="${P.goldDark}" ${o(2.5)}/>`;
    }
    row++;
  }
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">${out}</g>`;
}

// Pyramid of gold bars.
function goldBars(x, y, { rows = 3, s = 1 } = {}) {
  let out = '';
  for (let r = 0; r < rows; r++) {
    const inRow = rows - r;
    for (let j = 0; j < inRow; j++) {
      const bx = (j - (inRow - 1) / 2) * 92;
      const by = -r * 34;
      out += `<g transform="translate(${n(bx)} ${n(by)})"><path d="M-40 0 L-30 -30 H30 L40 0 Z" fill="${P.gold}" ${o(3)}/><path d="M-30 -30 H30 L24 -22 H-24 Z" fill="#f2d98a"/></g>`;
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">${out}</g>`;
}

// Price tag on a string; swings gently with t.
function priceTag(x, y, label, t = 0, { rot = 0, size = 30, color = P.paper } = {}) {
  const w = label.length * size * 0.6 + 50;
  const a = rot + Math.sin(t * 2.2) * 4;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)})" filter="url(#shadow)">
    <path d="M0 0 L0 -40" stroke="${P.ink}" stroke-width="2.5"/>
    <path d="M-22 0 H${n(w - 22)} V${size + 24} H-22 L-40 ${(size + 24) / 2} Z" fill="${color}" ${o(3)}/>
    <circle cx="-22" cy="${(size + 24) / 2}" r="5" fill="${P.ink}"/>
    ${text(label, -6, size + 4, { size, font: 'display', fill: P.red })}
  </g>`;
}

// Piggy bank. `shake` (0..1) wobbles it; coins can be dropped in with coinDrop(t, at).
function piggyBank(x, y, t = 0, { s = 1, shake = 0, color = '#e8a3a0' } = {}) {
  const a = Math.sin(t * 30) * 6 * shake;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(a)}) scale(${n(s)})">
    <path d="M-60 0 V22 M50 0 V22 M-30 6 V26 M24 6 V26" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="0" cy="-50" rx="96" ry="70" fill="${color}" ${o(4)}/>
    <ellipse cx="96" cy="-50" rx="22" ry="26" fill="${color}" ${o(4)}/><circle cx="92" cy="-54" r="4" fill="${P.ink}"/><circle cx="102" cy="-46" r="4" fill="${P.ink}"/>
    <path d="M20 -116 L36 -142 L52 -110 Z" fill="${color}" ${o(3.5)}/>
    <circle cx="56" cy="-74" r="6" fill="${P.ink}"/>
    <rect x="-20" y="-122" width="44" height="9" rx="4" fill="${P.ink}"/>
    <path d="M-96 -56 q-26 -10 -16 -30" fill="none" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

// A coin falling into a slot at (x, y): drops from 160px above over 0.45s starting at `at`.
function coinDrop(x, y, t, at) {
  if (t < at || t > at + 0.5) return '';
  const k = ease.in(prog(t, at, 0.45));
  return `<g transform="translate(${n(x)} ${n(y - 160 + 160 * k)})"><ellipse rx="16" ry="16" fill="${P.gold}" ${o(3)}/>${text('$', 0, 7, { size: 20, font: 'display', fill: P.goldDark, anchor: 'middle' })}</g>`;
}

// Bank vault door. open = 0 (shut) .. 1 (swung open, seen edge-on to the right).
function vault(x, y, { r = 150, open = 0, t = 0 } = {}) {
  const k = clamp(open);
  const sx = Math.cos(k * Math.PI * 0.45);
  const dx = r * (1 - sx) * 1.05;
  const wheel = (k * 300) + t * 0;
  const spokes = [0, 60, 120].map((a) => `<path d="M${-r * 0.32} 0 H${r * 0.32}" stroke="${P.greyDark}" stroke-width="10" stroke-linecap="round" transform="rotate(${n(a + wheel)})"/>`).join('');
  return `<g transform="translate(${n(x)} ${n(y)})">
    <rect x="${-r - 40}" y="${-r - 40}" width="${2 * r + 80}" height="${2 * r + 80}" rx="18" fill="${P.greyDark}" ${o(5)}/>
    <circle r="${r + 8}" fill="#2a2f33" ${o(4)}/>
    ${k > 0.02 ? goldBars(0, r * 0.55, { rows: 3, s: r / 170 }) : ''}
    <g transform="translate(${n(dx)} 0) scale(${n(sx)} 1)">
      <circle r="${r}" fill="${P.grey}" ${o(5)}/>
      <circle r="${r * 0.8}" fill="none" stroke="${P.greyDark}" stroke-width="5"/>
      ${spokes}<circle r="${r * 0.12}" fill="${P.greyDark}" ${o(3)}/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="${n(Math.cos(a * Math.PI / 180) * r * 0.9)}" cy="${n(Math.sin(a * Math.PI / 180) * r * 0.9)}" r="6" fill="${P.greyDark}"/>`).join('')}
    </g>
  </g>`;
}

// Scrolling ticker tape: a strip of text moving left. Width w, y = baseline strip top.
function ticker(label, t, { x = 0, y = 660, w = 1280, h = 46, speed = 90, color = P.ink, textColor = P.paper } = {}) {
  const item = `${label}   •   `;
  const iw = item.length * 13;
  const off = -((t * speed) % iw);
  const reps = Math.ceil(w / iw) + 2;
  let s = '';
  for (let i = 0; i < reps; i++) s += text(item, x + off + i * iw, y + h * 0.68, { size: 24, font: 'hand', fill: textColor });
  return `<g><clipPath id="tk${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>
    <g clip-path="url(#tk${y})">${s}</g></g>`;
}

// Stock-exchange style board with two scrolling rows of symbols and red/green moves.
const SYMBOLS = [['BANK', -4.2], ['GOLD', 1.8], ['OIL', -2.1], ['TECH', 3.4], ['HOME', -6.8], ['AUTO', -1.2], ['RETAIL', 0.6], ['BOND', 0.3], ['INS', -3.3], ['FOOD', 1.1]];
function tickerBoard(x, y, w, h, t, { symbols = SYMBOLS, speed = 60 } = {}) {
  const row = (yy, off, list) => {
    let s = '', cx = x + off;
    const items = list.concat(list, list);
    for (const [sym, ch] of items) {
      const up = ch >= 0;
      s += text(sym, cx, yy, { size: 28, font: 'display', fill: P.paper })
        + `<path d="${up ? `M${n(cx + sym.length * 17 + 8)} ${yy - 6} l9 -14 l9 14 Z` : `M${n(cx + sym.length * 17 + 8)} ${yy - 20} l9 14 l9 -14 Z`}" fill="${up ? P.green : P.red}"/>`
        + text(`${up ? '+' : ''}${ch.toFixed(1)}%`, cx + sym.length * 17 + 34, yy, { size: 24, font: 'hand', fill: up ? '#9cc496' : '#e08a80' });
      cx += sym.length * 17 + 130;
    }
    return s;
  };
  const span = symbols.reduce((s, [sym]) => s + sym.length * 17 + 130, 0);
  const o1 = -((t * speed) % span), o2 = -((t * speed * 0.8 + span / 2) % span);
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#141c28" ${o(5)}/>
    <clipPath id="tb${y}"><rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}"/></clipPath>
    <g clip-path="url(#tb${y})">${row(y + h * 0.42, o1, symbols)}${row(y + h * 0.84, o2, symbols.slice().reverse())}</g>
  </g>`;
}

// Mini bar chart; bars grow one after another from `at`. Colour per bar: green if up vs previous, red if down,
// unless opts.color forces one colour. bare = no paper card behind it.
function stockBars(values, t, at = 0, { x = 0, y = 0, w = 300, h = 180, bare = false, color, stagger = 0.12, dur = 0.4 } = {}) {
  const max = Math.max(...values) * 1.1;
  const bw = (w - 20) / values.length;
  const bars = values.map((v, i) => {
    const k = ease.out(prog(t, at + i * stagger, dur));
    const bh = (v / max) * (h - 20) * k;
    const c = color || (i === 0 || v >= values[i - 1] ? P.green : P.red);
    return `<rect x="${n(x + 10 + i * bw + 4)}" y="${n(y + h - 10 - bh)}" width="${n(bw - 8)}" height="${n(bh)}" fill="${c}" ${bare ? '' : o(2.5)}/>`;
  }).join('');
  return `<g>${bare ? '' : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.paper}" ${o(3)}/>`}
    <path d="M${x + 8} ${y + h - 10} H${x + w - 8}" stroke="${bare ? P.greyLight : P.ink}" stroke-width="2"/>${bars}</g>`;
}

// Falling banknotes ("money printer go brrr"). count notes fall through the box from `at`, looping.
function moneyRain(t, at = 0, { seed = 5, x = 0, y = -80, w = 1280, h = 880, count = 18, speed = 220 } = {}) {
  if (t < at) return '';
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const nx = x + r() * w, phase = r() * h, sp = speed * (0.7 + r() * 0.6), rs = (r() - 0.5) * 200;
    const yy = y + ((phase + (t - at) * sp) % h);
    const sway = Math.sin((t - at) * 2 + i) * 30;
    s += banknote(nx + sway, yy, { s: 0.6 + r() * 0.3, rot: rs + (t - at) * rs * 0.5 });
  }
  return `<g>${s}</g>`;
}

module.exports = { banknote, cashStack, moneyBag, coinPile, goldBars, priceTag, piggyBank, coinDrop, vault, ticker, tickerBoard, stockBars, moneyRain };
