// More props for the `compose` template (registered in lib/propkit.js PROPS + DOCS).
// Contract (same as propkit): fn(o, t) => svg, o = { x, y, s, at, ...options }.
// Every prop draws around its anchor (x, y) = BOTTOM-CENTRE (it stands on a floor or table line), except `jet`
// (anchor = centre of the plane, since it flies). Scale o.s. Pure in t: no Math.random (rng from lib/motion.js).
// Props that act after appearing (tip, ring, count, slam, trip, fill, deal, stack, fall, lift off) read o.at.
// Ink outlines 2-3 px, flat muted fills, palette colours only. Red / green / gold only where they carry meaning.

const P = require('./palette');
const { n, text, textWidth } = require('./svg');
const { rng, clamp, lerp, ease, prog } = require('./motion');

const AT = (o) => o.at ?? 0;
const place = (o, inner) => `<g transform="translate(${n(o.x ?? 640)} ${n(o.y ?? 600)}) scale(${n(o.s ?? 1)})">${inner}</g>`;
const ol = (w = 3) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;
const rad = (d) => (d * Math.PI) / 180;
const damp = (k, f = 8, d = 2) => (k <= 0 ? 0 : Math.sin(k * f) * Math.exp(-k * d));

// ---------- balance scale ----------
// o.tip -1..1: target tilt (+1 = right pan down). Tips toward it over 1s after `at`. o.left / o.right: pan labels.
function balanceScale(o, t) {
  const at = AT(o);
  const k = ease.inOut(prog(t, at + 0.3, 1));
  const tip = clamp(o.tip ?? 0, -1, 1);
  const a = tip * 16 * k + tip * 3 * damp(t - at - 1.3, 7, 2.2);
  const py = -262, L = 150;
  const end = (sd) => [sd * L * Math.cos(rad(a)), py + sd * L * Math.sin(rad(a))];
  const pan = (sd, label) => {
    const [ex, ey] = end(sd);
    const by = ey + 110;
    return `<path d="M${n(ex)} ${n(ey)} L${n(ex - 58)} ${n(by)} M${n(ex)} ${n(ey)} L${n(ex + 58)} ${n(by)} M${n(ex)} ${n(ey)} V${n(by)}" stroke="${P.inkSoft}" stroke-width="2.2"/>
      <path d="M${n(ex - 70)} ${n(by)} Q${n(ex)} ${n(by + 50)} ${n(ex + 70)} ${n(by)} Z" fill="${P.goldDark}" ${ol(3)}/>
      <path d="M${n(ex - 70)} ${n(by)} H${n(ex + 70)}" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>
      ${label ? text(label, ex, by + 24, { size: label.length > 9 ? 17 : 21, anchor: 'middle', font: 'hand', fill: P.ink }) : ''}
      <circle cx="${n(ex)}" cy="${n(ey)}" r="5" fill="${P.gold}" ${ol(2)}/>`;
  };
  return place(o, `
    <rect x="-96" y="-24" width="192" height="24" rx="4" fill="${P.woodMid}" ${ol()}/>
    <path d="M-50 -24 L-16 -54 H16 L50 -24 Z" fill="${P.goldDark}" ${ol()}/>
    <rect x="-9" y="${py + 6}" width="18" height="${-py - 54}" fill="${P.gold}" ${ol()}/>
    <g transform="rotate(${n(a)} 0 ${py})">
      <rect x="${-L - 8}" y="${py - 6}" width="${2 * L + 16}" height="12" rx="6" fill="${P.gold}" ${ol()}/>
      <path d="M-5 ${py} L0 ${py - 40} L5 ${py} Z" fill="${P.goldDark}" ${ol(2)}/>
    </g>
    <circle cx="0" cy="${py}" r="9" fill="${P.goldDark}" ${ol(2.5)}/>
    <circle cx="0" cy="${py - 42}" r="10" fill="${P.gold}" ${ol(2.5)}/>
    ${pan(-1, o.left)}${pan(1, o.right)}`);
}

// ---------- opening bell ----------
// Brass bell in a wooden frame; swings and rings for ~3s after `at` (o.ringAt to delay, absolute seconds).
function bell(o, t) {
  const k = t - (o.ringAt ?? AT(o) + 0.3);
  const sw = k > 0 ? 16 * Math.sin(k * 13) * Math.exp(-k * 1.1) : 0;
  const rings = Math.abs(sw) > 2 ? [1, 2, 3].map((i) => {
    const r = 96 + i * 18, op = clamp(Math.abs(sw) / 16) * (1 - i * 0.25);
    return `<path d="M${-r} -210 Q${-r - 12} -170 ${-r} -130 M${r} -210 Q${r + 12} -170 ${r} -130" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="${n(op)}"/>`;
  }).join('') : '';
  return place(o, `
    <rect x="-130" y="-16" width="260" height="16" rx="3" fill="${P.woodMid}" ${ol()}/>
    <rect x="-118" y="-284" width="18" height="270" fill="${P.wood}" ${ol()}/><rect x="100" y="-284" width="18" height="270" fill="${P.wood}" ${ol()}/>
    <rect x="-132" y="-298" width="264" height="18" rx="3" fill="${P.woodMid}" ${ol()}/>
    ${rings}
    <g transform="rotate(${n(sw)} 0 -280)">
      <rect x="-14" y="-282" width="28" height="16" rx="3" fill="${P.woodDark}" ${ol(2.5)}/>
      <g transform="rotate(${n(-sw * 0.6)} 0 -268)"><path d="M0 -268 V-140" stroke="${P.ink}" stroke-width="3.5"/><circle cx="0" cy="-136" r="11" fill="${P.goldDark}" ${ol(2.5)}/></g>
      <path d="M-20 -266 Q-26 -238 -42 -190 Q-52 -162 -74 -152 H74 Q52 -162 42 -190 Q26 -238 20 -266 Z" fill="${P.gold}" ${ol(3)}/>
      <ellipse cx="0" cy="-152" rx="76" ry="9" fill="${P.goldDark}" ${ol(3)}/>
      <path d="M-34 -194 H34" stroke="${P.goldDark}" stroke-width="3"/>
      <path d="M-14 -250 Q-22 -220 -30 -198" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
    </g>`);
}

// ---------- countdown clock ----------
// Digital panel counting from o.from to o.to (o.unit 'sec' -> MM:SS, 'min' -> HH:MM) at o.rate units per second, from `at`.
function countdownClock(o, t) {
  const at = AT(o) + 0.3;
  const from = o.from ?? 10, to = o.to ?? 0, rate = o.rate ?? 1;
  const dirn = to < from ? -1 : 1;
  const v = Math.max(0, t < at ? from : (dirn < 0 ? Math.max(to, from - (t - at) * rate) : Math.min(to, from + (t - at) * rate)));
  const whole = dirn < 0 ? Math.ceil(v - 1e-6) : Math.floor(v);
  const a = Math.floor(whole / 60), b = whole % 60;
  const str = `${String(a).padStart(2, '0')}:${String(b).padStart(2, '0')}`;
  const done = whole === to && t > at;
  const colonOn = done || Math.floor(t * 2) % 2 === 0;
  const flash = done ? (Math.floor((t - at) * 4) % 2 === 0 ? 1 : 0.55) : 1;
  const digits = str.replace(':', colonOn ? ':' : ' ');
  return place(o, `
    <path d="M-150 0 L-130 -30 M150 0 L130 -30" stroke="${P.ink}" stroke-width="7" stroke-linecap="round"/>
    <rect x="-200" y="-190" width="400" height="160" rx="12" fill="${P.charcoal}" ${ol(4)}/>
    <rect x="-180" y="-172" width="360" height="124" rx="6" fill="${P.nightDeep}" ${ol(2.5)}/>
    ${text('88:88', 0, -70, { font: 'display', size: 108, anchor: 'middle', fill: P.red, opacity: 0.1 })}
    ${text(digits, 0, -70, { font: 'display', size: 108, anchor: 'middle', fill: P.red, opacity: flash })}
    ${o.label ? `<rect x="${n(-textWidth(o.label, 26) / 2 - 16)}" y="-232" width="${n(textWidth(o.label, 26) + 32)}" height="38" fill="${P.paper}" ${ol(2.5)}/>${text(o.label, 0, -204, { size: 26, anchor: 'middle' })}` : ''}
    ${text(o.unit === 'min' ? 'HRS   MIN' : 'MIN   SEC', 0, -36, { size: 15, anchor: 'middle', fill: P.greyLight, spacing: 3 })}`);
}

// ---------- wall clock (big analog) ----------
// o.time "9:30": hands sweep from o.from ("12:00") to it over 1.4s after `at`. Second hand ticks. Anchor = bottom of the rim.
function wallClock(o, t) {
  const toMin = (s) => { const [h, m] = String(s).split(':').map(Number); return ((h % 12) * 60 + (m || 0)); };
  const m0 = toMin(o.from ?? '12:00');
  let m1 = toMin(o.time ?? '9:30');
  if (m1 < m0) m1 += 720;
  const cur = lerp(m0, m1, ease.inOut(prog(t, AT(o) + 0.25, 1.4)));
  const r = 120, cy = -r - 12;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0, a = rad(i * 6);
    const r1 = big ? r - 22 : r - 12;
    return `<path d="M${n(Math.sin(a) * r1)} ${n(cy - Math.cos(a) * r1)} L${n(Math.sin(a) * (r - 5))} ${n(cy - Math.cos(a) * (r - 5))}" stroke="${P.ink}" stroke-width="${big ? 4 : 1.8}" stroke-linecap="round"/>`;
  }).join('');
  const nums = [[12, 0, -1], [3, 1, 0], [6, 0, 1], [9, -1, 0]].map(([v, dx, dy]) => text(String(v), dx * (r - 42), cy + dy * (r - 42) + 12, { font: 'display', size: 32, anchor: 'middle' })).join('');
  const hand = (deg, len, w, col = P.ink) => `<path d="M0 ${cy + len * 0.15} L0 ${cy - len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${n(deg)} 0 ${cy})"/>`;
  return place(o, `
    <circle cx="0" cy="${cy}" r="${r + 12}" fill="${P.woodMid}" ${ol(4)}/>
    <circle cx="0" cy="${cy}" r="${r}" fill="${P.paper}" ${ol(3)}/>
    ${ticks}${nums}
    ${hand((cur % 720) * 0.5, r * 0.5, 9)}${hand((cur % 60) * 6, r * 0.78, 6)}
    ${hand(Math.floor(t) * 6, r * 0.82, 2.2, P.red)}
    <circle cx="0" cy="${cy}" r="8" fill="${P.ink}"/>`);
}

// ---------- invitation ----------
// Envelope; the card slides up out of it after `at`. o.title (script), o.date.
function invitation(o, t) {
  const dy = lerp(0, -150, ease.out(prog(t, AT(o) + 0.3, 0.8)));
  const title = o.title ?? 'You are invited';
  const tSize = Math.min(38, 230 / Math.max(1, title.length * 0.42));
  return place(o, `
    <rect x="-150" y="-190" width="300" height="190" rx="4" fill="${P.paperShade}" ${ol()}/>
    <path d="M-150 -190 L0 -290 L150 -190 Z" fill="${P.paperDim}" ${ol()}/>
    <g transform="translate(0 ${n(dy)})">
      <rect x="-128" y="-200" width="256" height="196" rx="3" fill="${P.bubble}" ${ol(2.5)}/>
      <rect x="-118" y="-190" width="236" height="176" fill="none" stroke="${P.goldDark}" stroke-width="2"/>
      ${text(title, 0, -140, { font: 'script', size: n(tSize), anchor: 'middle' })}
      <path d="M-50 -122 H50" stroke="${P.goldDark}" stroke-width="2"/>
      ${o.date ? text(o.date, 0, -92, { size: 22, anchor: 'middle', fill: P.inkSoft }) : ''}
    </g>
    <path d="M-150 -190 L0 -84 L150 -190 V0 H-150 Z" fill="${P.paperDim}" ${ol()}/>
    <path d="M-150 0 L-40 -110 M150 0 L40 -110" stroke="${P.paperShade}" stroke-width="2.5"/>
    <circle cx="0" cy="-84" r="16" fill="${P.gold}" ${ol(2.5)}/><circle cx="0" cy="-84" r="8" fill="none" stroke="${P.goldDark}" stroke-width="2"/>`);
}

// ---------- row of exit doors ----------
// o.count doors (default 5) with EXIT signs; after `at` they slam shut one by one (o.every seconds apart, default 0.5).
function doorsRow(o, t) {
  const c = o.count ?? 5, dw = 96, dh = 200, gap = 34, every = o.every ?? 0.5;
  const total = c * dw + (c - 1) * gap;
  const doors = Array.from({ length: c }, (_, i) => {
    const x = -total / 2 + i * (dw + gap);
    const ct = AT(o) + 0.6 + i * every;
    const k = ease.in(prog(t, ct, 0.2));
    const shut = t >= ct + 0.2;
    const w = lerp(0.2, 1, k) * dw;
    const flare = (1 - k) * 16; // the open leaf is nearer the camera: taller at its free edge
    const jolt = shut ? damp(t - ct - 0.2, 40, 9) * 3 : 0;
    const hit = shut && t < ct + 0.45 ? `<g stroke="${P.ink}" stroke-width="3" stroke-linecap="round" opacity="${n(1 - (t - ct - 0.2) / 0.25)}"><path d="M${x + dw + 8} ${-dh + 30} l12 -8 M${x + dw + 10} ${-dh / 2} h14 M${x + dw + 8} -30 l12 8"/></g>` : '';
    const lit = !shut;
    return `<g transform="translate(${n(jolt)} 0)">
      <rect x="${x - 8}" y="${-dh - 8}" width="${dw + 16}" height="${dh + 8}" fill="${P.woodDark}" ${ol()}/>
      <rect x="${x}" y="${-dh}" width="${dw}" height="${dh}" fill="${P.nightDeep}"/>
      <path d="M${x} ${-dh} L${n(x + w)} ${n(-dh - flare)} L${n(x + w)} ${n(flare * 0.6)} L${x} 0 Z" fill="${P.greyDark}" ${ol(2.5)}/>
      ${k > 0.6 ? `<rect x="${n(x + w - 22)}" y="-108" width="12" height="18" rx="3" fill="${P.greyLight}" ${ol(2)}/><rect x="${x + 16}" y="${-dh + 22}" width="${dw - 32}" height="44" fill="none" stroke="${P.ink}" stroke-width="2" opacity=".5"/>` : ''}
      <rect x="${x + dw / 2 - 36}" y="${-dh - 50}" width="72" height="30" rx="3" fill="${lit ? P.green : P.greenDark}" ${ol(2.5)} opacity="${lit ? 1 : 0.7}"/>
      ${text('EXIT', x + dw / 2, -dh - 27, { font: 'display', size: 22, anchor: 'middle', fill: lit ? P.paper : P.grey })}
      ${hit}
    </g>`;
  }).join('');
  return place(o, doors);
}

// ---------- shark fins ----------
// 2-4 fins (o.count, default 3) circling in a pool of water. Anchor = bottom of the water.
function sharkFins(o, t) {
  const c = clamp(o.count ?? 3, 2, 4), rx = 300, ry = 92, cy = -ry;
  const speed = o.speed ?? 0.55;
  const fins = Array.from({ length: c }, (_, i) => {
    const ph = t * speed + (i * Math.PI * 2) / c + 0.4;
    const px = Math.cos(ph) * rx * 0.68, py = cy + Math.sin(ph) * ry * 0.55;
    const dir = -Math.sin(ph) >= 0 ? 1 : -1; // moving right?
    const sc = 0.8 + 0.25 * ((py - cy) / (ry * 0.55) + 1) / 2;
    return { py, svg: `<g transform="translate(${n(px)} ${n(py)}) scale(${n(dir * sc)} ${n(sc)})">
      <path d="M-62 4 Q-80 0 -96 6 M-60 12 Q-84 10 -104 16" stroke="${P.paper}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>
      <path d="M-30 4 Q-16 -30 14 -62 Q8 -28 30 4 Z" fill="${P.greyDark}" ${ol(3)}/>
      <path d="M2 -40 Q0 -20 8 0" stroke="${P.grey}" stroke-width="3" fill="none" opacity=".6"/>
      <ellipse cx="0" cy="5" rx="40" ry="6" fill="${P.water}" stroke="${P.paper}" stroke-width="2.5" opacity=".9"/>
    </g>` };
  }).sort((a, b) => a.py - b.py).map((f) => f.svg).join('');
  const waves = [-0.5, 0, 0.5].map((f, i) => `<path d="M${-rx * 0.6 + i * 40} ${n(cy + f * ry * 0.7)} q20 -8 40 0 t40 0" stroke="${P.paper}" stroke-width="2.5" fill="none" opacity=".35" transform="translate(${n(Math.sin(t + i) * 10)} 0)"/>`).join('');
  return place(o, `
    <ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${P.water}" ${ol(3)}/>
    <ellipse cx="0" cy="${cy + 8}" rx="${rx - 30}" ry="${ry - 22}" fill="none" stroke="${P.waterDark}" stroke-width="3" opacity=".6"/>
    ${waves}${fins}`);
}

// ---------- circuit breaker ----------
// Wall panel with a big switch that trips ON -> OFF with a spark, o.tripAfter seconds after `at` (default 1).
function circuitBreaker(o, t) {
  const tt = AT(o) + (o.tripAfter ?? 1);
  const k = ease.out(prog(t, tt, 0.12));
  const ly = lerp(-212, -128, k);
  const sk = prog(t, tt, 0.45);
  const spark = t >= tt && sk < 1 ? `<g transform="translate(70 -170) scale(${n(0.6 + sk * 0.8)})" opacity="${n(1 - sk)}">
      ${Array.from({ length: 8 }, (_, i) => { const a = rad(i * 45 + 20); return `<path d="M${n(Math.cos(a) * 10)} ${n(Math.sin(a) * 10)} L${n(Math.cos(a) * (i % 2 ? 30 : 44))} ${n(Math.sin(a) * (i % 2 ? 30 : 44))}" stroke="${P.gold}" stroke-width="5" stroke-linecap="round"/>`; }).join('')}
      <circle r="10" fill="${P.gold}" ${ol(2)}/></g>` : '';
  const on = k < 0.5;
  return place(o, `
    <rect x="-110" y="-300" width="220" height="290" rx="8" fill="${P.steel}" ${ol(4)}/>
    <rect x="-90" y="-280" width="180" height="250" rx="4" fill="${P.greyDark}" ${ol(2.5)}/>
    ${text('ON', -60, -204, { font: 'display', size: 22, anchor: 'middle', fill: on ? P.paper : P.grey })}
    ${text('OFF', -60, -120, { font: 'display', size: 22, anchor: 'middle', fill: on ? P.grey : P.paper })}
    <rect x="-2" y="-240" width="28" height="140" rx="6" fill="${P.ink}"/>
    <rect x="-18" y="${n(ly - 20)}" width="60" height="40" rx="8" fill="${P.charcoal}" ${ol(3)}/>
    <path d="M-8 ${n(ly - 6)} H32" stroke="${P.grey}" stroke-width="3"/>
    <circle cx="58" cy="-250" r="11" fill="${on ? P.green : P.red}" ${ol(2.5)}/>
    <circle cx="55" cy="-254" r="3" fill="#fff" opacity=".6"/>
    <path d="M-110 -10 H110" stroke="${P.ink}" stroke-width="4"/>
    ${spark}`);
}

// ---------- weather symbol ----------
// o.kind 'sun' | 'storm' | 'hurricane'. Gently animated (rays turn, lightning flashes, spiral turns).
function weather(o, t) {
  const kind = o.kind ?? 'sun', cy = -120;
  if (kind === 'storm') {
    const flash = (t * 0.8) % 1 < 0.12;
    const rain = Array.from({ length: 9 }, (_, i) => {
      const yy = ((t * 260 + i * 37) % 90);
      return `<path d="M${-80 + i * 20} ${n(cy + 20 + yy)} l-6 16" stroke="${P.blue}" stroke-width="3.5" stroke-linecap="round" opacity="${n(1 - yy / 90)}"/>`;
    }).join('');
    return place(o, `${rain}
      <path d="M-14 ${cy + 10} L-34 ${cy + 64} H-10 L-24 ${cy + 110} L28 ${cy + 44} H4 L20 ${cy + 10} Z" fill="${P.gold}" ${ol(3)} opacity="${flash ? 1 : 0.85}"/>
      <path d="M-110 ${cy + 20} Q-130 ${cy - 30} -80 ${cy - 40} Q-70 ${cy - 100} -10 ${cy - 90} Q30 ${cy - 130} 70 ${cy - 80} Q130 ${cy - 80} 120 ${cy - 20} Q130 ${cy + 20} 90 ${cy + 20} Z" fill="${flash ? P.grey : P.greyDark}" ${ol(4)}/>
      <path d="M-60 ${cy - 30} Q-40 ${cy - 50} -10 ${cy - 44}" stroke="${P.greyLight}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`);
  }
  if (kind === 'hurricane') {
    const arm = `<path d="M0 -28 Q10 -90 70 -96 Q30 -70 26 -20 Z" fill="${P.red}" ${ol(3)}/>`;
    return place(o, `<g transform="translate(0 ${cy}) rotate(${n(-t * 80)})">
      ${arm}<g transform="rotate(180)">${arm}</g>
      <circle r="34" fill="${P.red}" ${ol(3.5)}/><circle r="13" fill="${P.paper}" ${ol(2.5)}/></g>`);
  }
  const rays = Array.from({ length: 12 }, (_, i) => `<path d="M0 -84 L0 -112" stroke="${P.goldDark}" stroke-width="9" stroke-linecap="round" transform="rotate(${i * 30})"/>`).join('');
  return place(o, `<g transform="translate(0 ${cy})"><g transform="rotate(${n(t * 12)})">${rays}</g>
    <circle r="66" fill="${P.gold}" ${ol(4)}/><path d="M-36 -26 Q-24 -46 0 -50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".4"/></g>`);
}

// ---------- photocopier ----------
// Copier with a scan bar; spits pages into the side tray from `at` (o.pages max stacked, default 12; o.every seconds).
function photocopier(o, t) {
  const start = AT(o) + 0.3, every = o.every ?? 0.6, max = o.pages ?? 12;
  const el = t - start;
  const done = el < 0 ? 0 : Math.min(max, Math.floor(el / every));
  const u = el < 0 || done >= max ? -1 : (el % every) / every;
  // a sheet lying on the slanted output tray; dx shifts it toward the machine (0 = in the tray)
  const sheet = (dx, dy, fill, w = 2) => `<path d="M${n(-246 + dx)} ${n(-104 + dy)} L${n(-156 + dx)} ${n(-98 + dy)} L${n(-170 + dx)} ${n(-126 + dy)} L${n(-252 + dx)} ${n(-130 + dy)} Z" fill="${fill}" stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const stack = Array.from({ length: done }, (_, i) => sheet(0, -i * 2.5, i % 2 ? P.paper : P.bubble, 1.5)).join('');
  const moving = u >= 0 ? sheet(lerp(80, 0, ease.out(clamp(u * 1.4))), -done * 2.5 - 2, P.bubble, 2) : '';
  const scan = u >= 0 ? lerp(-130, 110, u) : -130;
  return place(o, `
    <rect x="-150" y="-60" width="300" height="60" fill="${P.greyDark}" ${ol(3)}/>
    <path d="M-100 -30 H100" stroke="${P.ink}" stroke-width="3"/><rect x="-14" y="-40" width="28" height="6" rx="3" fill="${P.grey}"/>
    <rect x="-150" y="-180" width="300" height="122" rx="6" fill="${P.greyLight}" ${ol(3)}/>
    <rect x="-140" y="-188" width="240" height="10" fill="${P.nightMid}"/>
    <rect x="${n(scan)}" y="-188" width="26" height="10" fill="${P.gold}" opacity="${u >= 0 ? 0.95 : 0}"/>
    <rect x="-146" y="-206" width="248" height="20" rx="4" fill="${P.grey}" ${ol(3)}/>
    <rect x="104" y="-206" width="52" height="28" rx="4" fill="${P.greyDark}" ${ol(2.5)}/>
    <rect x="110" y="-201" width="22" height="12" fill="${P.scope}"/><circle cx="143" cy="-195" r="5" fill="${P.green}" ${ol(1.5)}/>
    <path d="M-150 -92 L-262 -100 L-266 -136 L-150 -130 Z" fill="${P.grey}" ${ol(2.5)}/>
    <path d="M-262 -100 L-262 -90 L-150 -82 V-92 Z" fill="${P.greyDark}" ${ol(2)}/>
    ${stack}${moving}
    <rect x="-154" y="-150" width="8" height="40" fill="${P.ink}"/>
    <path d="M-120 -150 H60 M-120 -100 H60" stroke="${P.grey}" stroke-width="3"/>`);
}

// ---------- ID badge ----------
// Lanyard ID badge, swings in. o.name, o.role.
function badge(o, t) {
  const k = t - AT(o);
  const sw = 8 * damp(k, 4, 1.2) + 1.2 * Math.sin(t * 1.3);
  const name = String(o.name ?? 'VISITOR').toUpperCase();
  return place(o, `<g transform="rotate(${n(sw)} 0 -330)">
    <path d="M-44 -340 L-10 -216 M44 -340 L10 -216" stroke="${P.blue}" stroke-width="12" stroke-linecap="round"/>
    <path d="M-44 -340 L-10 -216 M44 -340 L10 -216" stroke="${P.ink}" stroke-width="1.5" opacity=".4"/>
    <rect x="-14" y="-222" width="28" height="22" rx="4" fill="${P.greyLight}" ${ol(2.5)}/>
    <rect x="-84" y="-206" width="168" height="206" rx="10" fill="${P.bubble}" ${ol(3)}/>
    <path d="M-84 -166 V-196 Q-84 -206 -74 -206 H74 Q84 -206 84 -196 V-166 Z" fill="${P.blue}" ${ol(3)}/>
    <rect x="-20" y="-196" width="40" height="8" rx="4" fill="${P.bubble}" ${ol(1.5)}/>
    <rect x="-70" y="-152" width="64" height="76" fill="${P.paperDim}" ${ol(2)}/>
    <circle cx="-38" cy="-124" r="15" fill="${P.grey}"/><path d="M-62 -76 Q-62 -102 -38 -102 Q-14 -102 -14 -76 Z" fill="${P.grey}"/>
    <path d="M6 -140 H70 M6 -124 H56 M6 -108 H64" stroke="${P.paperShade}" stroke-width="5" stroke-linecap="round"/>
    ${text(name, 0, -44, { font: 'display', size: name.length > 9 ? 20 : 26, anchor: 'middle' })}
    ${o.role ? text(String(o.role), 0, -22, { size: 18, anchor: 'middle', fill: P.inkSoft }) : ''}
    <g stroke="${P.ink}">${Array.from({ length: 16 }, (_, i) => `<path d="M${-40 + i * 5} -16 V-6" stroke-width="${i % 3 === 0 ? 3 : 1.5}"/>`).join('')}</g>
  </g>`);
}

// ---------- plain white van ----------
// Side view, front to the right (o.dir -1 faces left). o.drive: px/s it rolls from `at` (wheels turn).
function van(o, t) {
  const dir = o.dir ?? 1;
  const dx = o.drive ? Math.max(0, t - AT(o)) * o.drive : 0;
  const spin = dx / 30 * 57.3;
  const wheel = (x) => `<g transform="translate(${x} -34)"><circle r="32" fill="${P.ink}"/><circle r="15" fill="${P.grey}" ${ol(2.5)}/>
    <g transform="rotate(${n(spin)})"><path d="M-12 0 H12 M0 -12 V12" stroke="${P.greyDark}" stroke-width="3"/></g></g>`;
  return place({ ...o, x: (o.x ?? 640) + dx * dir }, `<g transform="scale(${dir} 1)">
    <ellipse cx="0" cy="-2" rx="200" ry="8" fill="${P.ink}" opacity=".18"/>
    <path d="M-200 -46 V-200 Q-200 -212 -188 -212 H110 Q130 -212 140 -196 L180 -132 Q198 -126 200 -108 V-46 Z" fill="${P.vanWhite}" ${ol(3.5)}/>
    <path d="M118 -196 L158 -134 H100 V-196 Z" fill="${P.windowDark}" ${ol(2.5)}/>
    <path d="M110 -190 L130 -160" stroke="${P.grey}" stroke-width="4" opacity=".5" stroke-linecap="round"/>
    <path d="M92 -200 V-50 M-40 -204 V-50" stroke="${P.ink}" stroke-width="2.5"/>
    <rect x="72" y="-128" width="14" height="6" rx="3" fill="${P.greyDark}"/><rect x="-62" y="-128" width="14" height="6" rx="3" fill="${P.greyDark}"/>
    <rect x="188" y="-104" width="14" height="14" rx="3" fill="${P.windowLit}" ${ol(2)}/>
    <rect x="-206" y="-62" width="24" height="18" rx="3" fill="${P.greyDark}" ${ol(2)}/><rect x="178" y="-62" width="28" height="18" rx="3" fill="${P.greyDark}" ${ol(2)}/>
    <path d="M-200 -84 H200" stroke="${P.greyLight}" stroke-width="3"/>
    ${wheel(-120)}${wheel(124)}
  </g>`);
}

// ---------- radar scope ----------
// Console with a round green scope: rotating sweep, o.blips contacts that glow as the sweep passes.
// o.ring true = coverage only at the rim (the centre is a dark "no coverage" zone).
function radarScope(o, t) {
  const R = 150, cy = -220;
  const sweep = ((t * 90) % 360);
  const r0 = o.ring ? 104 : 0;
  const wedge = (a0, a1, op) => {
    const p = (a, r) => `${n(Math.sin(rad(a)) * r)} ${n(cy - Math.cos(rad(a)) * r)}`;
    return `<path d="M${p(a0, r0)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r0)} ${r0 ? `A${r0} ${r0} 0 0 0 ${p(a0, r0)}` : ''} Z" fill="${P.scope}" opacity="${n(op)}"/>`;
  };
  const trail = Array.from({ length: 6 }, (_, i) => wedge(sweep - (i + 1) * 7, sweep - i * 7, 0.34 - i * 0.05)).join('');
  const r = rng(o.seed ?? 7);
  const blips = Array.from({ length: o.blips ?? 4 }, (_, i) => {
    const a = r() * 360, d = lerp(o.ring ? 114 : 30, 138, r());
    const appear = AT(o) + 0.3 + i * 0.25;
    if (t < appear) return '';
    const since = (((sweep - a) % 360) + 360) % 360 / 90;
    const glow = 0.25 + 0.75 * Math.exp(-since * 1.3);
    return `<circle cx="${n(Math.sin(rad(a)) * d)}" cy="${n(cy - Math.cos(rad(a)) * d)}" r="${n(5 + glow * 3)}" fill="${P.scope}" opacity="${n(glow)}"/>`;
  }).join('');
  const dead = o.ring ? `<circle cx="0" cy="${cy}" r="${r0}" fill="${P.ink}" opacity=".7"/><circle cx="0" cy="${cy}" r="${r0}" fill="none" stroke="${P.scope}" stroke-width="2" stroke-dasharray="6 6" opacity=".6"/>
    ${text('NO COVERAGE', 0, cy + 6, { size: 18, anchor: 'middle', fill: P.scope, opacity: 0.55 })}` : '';
  return place(o, `
    <rect x="-190" y="-400" width="380" height="400" rx="14" fill="${P.steel}" ${ol(4)}/>
    <circle cx="0" cy="${cy}" r="${R + 16}" fill="${P.charcoal}" ${ol(3)}/>
    <circle cx="0" cy="${cy}" r="${R}" fill="${P.scopeDark}"/>
    <g stroke="${P.scope}" fill="none" opacity=".3" stroke-width="2"><circle cx="0" cy="${cy}" r="${R / 3}"/><circle cx="0" cy="${cy}" r="${(R * 2) / 3}"/><circle cx="0" cy="${cy}" r="${R - 4}"/>
      <path d="M${-R} ${cy} H${R} M0 ${cy - R} V${cy + R}"/></g>
    ${trail}
    <path d="M${n(Math.sin(rad(sweep)) * r0)} ${n(cy - Math.cos(rad(sweep)) * r0)} L${n(Math.sin(rad(sweep)) * R)} ${n(cy - Math.cos(rad(sweep)) * R)}" stroke="${P.scope}" stroke-width="3"/>
    ${dead}${blips}
    <circle cx="0" cy="${cy}" r="${R}" fill="none" ${ol(3)}/>
    ${[-110, 0, 110].map((x) => `<circle cx="${x}" cy="-30" r="13" fill="${P.charcoal}" ${ol(2.5)}/><path d="M${x} -30 l6 -8" stroke="${P.grey}" stroke-width="3" stroke-linecap="round"/>`).join('')}`);
}

// ---------- flight recorder ("black box") ----------
// Orange recorder with reflective stripes and its memory drum. o.ping true = locator-beacon rings.
function blackBox(o, t) {
  const pings = o.ping ? [0, 1, 2].map((i) => {
    const k = ((t - AT(o)) * 0.8 + i / 3) % 1;
    if (t < AT(o)) return '';
    return `<path d="M${n(150 + k * 60)} ${n(-120 - k * 40)} Q${n(170 + k * 80)} -100 ${n(150 + k * 60)} ${n(-80 + k * 40)}" stroke="${P.inkSoft}" stroke-width="3" fill="none" opacity="${n(1 - k)}" stroke-linecap="round"/>`;
  }).join('') : '';
  return place(o, `
    <ellipse cx="0" cy="-2" rx="150" ry="8" fill="${P.ink}" opacity=".18"/>
    <rect x="-140" y="-150" width="250" height="148" rx="8" fill="${P.flightOrange}" ${ol(3.5)}/>
    <rect x="-140" y="-150" width="250" height="18" fill="${P.paper}" ${ol(2.5)}/><rect x="-140" y="-20" width="250" height="18" fill="${P.paper}" ${ol(2.5)}/>
    <path d="M-140 -132 H110 M-140 -20 H110" stroke="${P.ink}" stroke-width="2"/>
    ${text('FLIGHT RECORDER', -15, -84, { font: 'type', size: 21, anchor: 'middle' })}
    ${text('DO NOT OPEN', -15, -54, { font: 'type', size: 19, anchor: 'middle' })}
    <rect x="-120" y="-206" width="96" height="58" rx="8" fill="${P.flightOrange}" ${ol(3)}/>
    <ellipse cx="-72" cy="-206" rx="48" ry="9" fill="#e39a62" ${ol(2.5)}/>
    <path d="M10 -150 V-178 H86 V-150" fill="none" stroke="${P.ink}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="110" y="-112" width="40" height="40" rx="6" fill="${P.flightOrange}" ${ol(3)}/><rect x="146" y="-102" width="10" height="20" rx="3" fill="${P.greyDark}" ${ol(2)}/>
    ${pings}`);
}

// ---------- jet ----------
// Side view, nose to the right (o.dir -1 = left). o.kind 'business' | 'fighter'. Anchor = CENTRE of the plane.
// o.fly: true (or px/s) = flies across from `at`, leaving a thin trail. Keep it in open sky, never near buildings.
function jet(o, t) {
  const dir = o.dir ?? 1;
  const speed = o.fly === true ? 420 : (o.fly || 0);
  const el = Math.max(0, t - AT(o));
  const dx = speed * el * dir;
  const bob = Math.sin(t * 2.2) * 3;
  const trail = speed ? `<path d="M${n(-190 - Math.min(el * speed, 900))} 0 H-190" stroke="${P.bubble}" stroke-width="8" stroke-linecap="round" opacity=".55"/>
    <path d="M${n(-190 - Math.min(el * speed, 600))} 10 H-196" stroke="${P.bubble}" stroke-width="4" stroke-linecap="round" opacity=".35"/>` : '';
  const business = `
    <path d="M-150 -6 L-178 -78 H-150 L-110 -16 Z" fill="${P.vanWhite}" ${ol(3)}/>
    <path d="M-196 -80 H-138" stroke="${P.ink}" stroke-width="9" stroke-linecap="round"/><path d="M-194 -80 H-140" stroke="${P.greyLight}" stroke-width="4" stroke-linecap="round"/>
    <path d="M-170 -10 Q-170 -30 -130 -30 H130 Q176 -28 190 -4 Q176 14 130 16 H-130 Q-170 14 -170 -10 Z" fill="${P.vanWhite}" ${ol(3)}/>
    <path d="M150 -22 Q170 -20 180 -8 H152 Z" fill="${P.windowDark}" ${ol(2)}/>
    ${[-80, -50, -20, 10, 40, 70, 100].map((x) => `<ellipse cx="${x}" cy="-12" rx="7" ry="8" fill="${P.windowDark}"/>`).join('')}
    <path d="M-160 4 H150" stroke="${P.blue}" stroke-width="3"/>
    <rect x="-140" y="-52" width="70" height="26" rx="13" fill="${P.greyLight}" ${ol(3)}/><path d="M-98 -26 V-20" stroke="${P.ink}" stroke-width="4"/>
    <path d="M-30 8 L-70 40 H-40 L40 8 Z" fill="${P.greyLight}" ${ol(3)}/>`;
  const fighter = `
    <path d="M-120 -10 L-170 -82 H-138 L-80 -14 Z" fill="${P.steel}" ${ol(3)}/>
    <path d="M-170 -14 H130 L200 2 L130 14 H-170 Z" fill="${P.steel}" ${ol(3)}/>
    <path d="M40 -12 Q70 -42 110 -12 Z" fill="${P.windowDark}" ${ol(2.5)}/><path d="M56 -20 Q70 -32 86 -26" stroke="${P.greyLight}" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M-110 6 L-20 6 L50 6 L-60 46 H-110 Z" fill="${P.greyDark}" ${ol(3)}/>
    <rect x="-186" y="-12" width="18" height="24" rx="4" fill="${P.charcoal}" ${ol(2.5)}/>
    <path d="M-150 -2 H-10" stroke="${P.greyDark}" stroke-width="2.5"/>`;
  return `<g transform="translate(${n((o.x ?? 640) + dx)} ${n((o.y ?? 300) + bob)}) scale(${n((o.s ?? 1) * dir)} ${n(o.s ?? 1)})">${trail}${o.kind === 'fighter' ? fighter : business}</g>`;
}

// ---------- thermometer ----------
// Fills to o.value of o.max (0 at the bulb) over 1.2s after `at`; o.unit label (e.g. '°C', '%'), o.label below.
function thermometer(o, t) {
  const max = o.max ?? 100, val = o.value ?? 70;
  const k = ease.out(prog(t, AT(o) + 0.2, 1.2));
  const frac = clamp(val / max) * k;
  const top = -400, bot = -96, hgt = bot - top;
  const lvl = bot - frac * hgt;
  const ticks = Array.from({ length: 6 }, (_, i) => {
    const y = bot - (i / 5) * hgt, v = Math.round((max * i) / 5);
    return `<path d="M24 ${n(y)} H40" stroke="${P.ink}" stroke-width="3"/>${text(String(v), 48, y + 7, { size: 20 })}`;
  }).join('');
  const shown = Math.round(val * k);
  return place(o, `
    <rect x="-56" y="-450" width="150" height="450" rx="14" fill="${P.paper}" ${ol(3)}/>
    ${o.unit ? text(o.unit, 18, -418, { font: 'display', size: 26, anchor: 'middle' }) : ''}
    <rect x="-20" y="${top - 10}" width="40" height="${hgt + 40}" rx="20" fill="${P.bubble}" ${ol(3)}/>
    <rect x="-9" y="${n(lvl)}" width="18" height="${n(bot - lvl + 20)}" fill="${P.red}"/>
    <circle cx="0" cy="-62" r="36" fill="${P.red}" ${ol(3)}/>
    <path d="M-20 ${top + 10} V${bot - 30}" stroke="${P.ink}" stroke-width="0"/>
    <path d="M-10 ${top + 6} V${bot - 10}" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>
    ${ticks}
    ${k > 0 ? `<g transform="translate(-30 ${n(lvl)})"><path d="M0 0 L-14 -10 V10 Z" fill="${P.ink}"/>${text(`${shown}${o.unit && o.unit.length <= 2 ? o.unit : ''}`, -18, 9, { font: 'display', size: 26, anchor: 'end' })}</g>` : ''}
    ${o.label ? text(o.label, 18, 34, { size: 24, anchor: 'middle' }) : ''}`);
}

// ---------- poker table (top-down) ----------
// Green felt, five community cards dealt one by one after `at`, chip stacks, face-down hands. o.cards: up to 5 'A♠'-style labels.
function suit(kind, x, y, s = 1) {
  const red = kind === '♥' || kind === '♦';
  const f = red ? P.red : P.ink;
  const sh = {
    '♦': `<path d="M0 -10 L8 0 L0 10 L-8 0 Z"/>`,
    '♥': `<path d="M0 9 Q-12 0 -9 -6 Q-5 -11 0 -5 Q5 -11 9 -6 Q12 0 0 9 Z"/>`,
    '♠': `<path d="M0 -10 Q-12 0 -9 5 Q-5 9 0 4 Q5 9 9 5 Q12 0 0 -10 Z M0 3 L-4 11 H4 Z"/>`,
    '♣': `<circle cx="0" cy="-5" r="4.5"/><circle cx="-5" cy="2" r="4.5"/><circle cx="5" cy="2" r="4.5"/><path d="M0 2 L-4 11 H4 Z"/>`,
  }[kind] || '';
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" fill="${f}">${sh}</g>`;
}
function pokerTable(o, t) {
  const cy = -170;
  const cards = (o.cards || ['A♠', 'K♥', 'Q♦', 'J♣', '10♠']).slice(0, 5);
  const card = (x, y, label, k) => {
    if (k <= 0) return '';
    const rank = label.slice(0, -1), st = label.slice(-1);
    const flip = Math.abs(Math.cos(Math.PI * clamp(k)));
    const face = k > 0.5;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(Math.max(0.05, flip))} 1)">
      <rect x="-27" y="-38" width="54" height="76" rx="5" fill="${face ? P.bubble : P.blue}" ${ol(2.5)}/>
      ${face ? text(rank, -16, -14, { font: 'display', size: 20, anchor: 'middle', fill: st === '♥' || st === '♦' ? P.red : P.ink }) + suit(st, 4, 12, 1.4) : `<rect x="-20" y="-31" width="40" height="62" rx="3" fill="none" stroke="${P.paper}" stroke-width="2" opacity=".6"/>`}
    </g>`;
  };
  const deal = cards.map((c, i) => card(-136 + i * 68, cy - 6, c, prog(t, AT(o) + 0.3 + i * 0.35, 0.3))).join('');
  const chip = (x, y, col, h) => Array.from({ length: h }, (_, j) => `<ellipse cx="${x}" cy="${y - j * 5}" rx="17" ry="10" fill="${col}" ${ol(2)}/>`).join('')
    + `<ellipse cx="${x}" cy="${y - (h - 1) * 5}" rx="9" ry="5" fill="none" stroke="${P.paper}" stroke-width="2" stroke-dasharray="4 3"/>`;
  const hands = [[-230, cy + 70, -20], [230, cy + 70, 20], [-250, cy - 80, 20], [250, cy - 80, -20]].map(([x, y, r]) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-30" y="-24" width="36" height="50" rx="4" fill="${P.blue}" ${ol(2)}/><rect x="-6" y="-26" width="36" height="50" rx="4" fill="${P.blue}" ${ol(2)}/></g>`).join('');
  return place(o, `
    <ellipse cx="0" cy="${cy}" rx="360" ry="170" fill="${P.woodMid}" ${ol(4)}/>
    <ellipse cx="0" cy="${cy}" rx="330" ry="146" fill="${P.felt}" ${ol(3)}/>
    <ellipse cx="0" cy="${cy}" rx="270" ry="104" fill="none" stroke="${P.feltDark}" stroke-width="4"/>
    ${hands}
    ${chip(-60, cy + 84, P.red, 4)}${chip(-24, cy + 90, P.paper, 6)}${chip(14, cy + 86, P.blue, 3)}${chip(52, cy + 92, P.gold, 5)}
    ${chip(-180, cy + 10, P.green, 3)}${chip(184, cy + 16, P.red, 5)}
    ${deal}`);
}

// ---------- jigsaw puzzle ----------
// o.cols x o.rows (4 x 3) pieces pop into place one by one after `at`; the last o.missing (default 1) stay empty.
function puzzle(o, t) {
  const cols = o.cols ?? 4, rows = o.rows ?? 3, S = o.size ?? 90;
  const W = cols * S, H = rows * S, x0 = -W / 2, y0 = -H - 20;
  const r = rng(o.seed ?? 5);
  const Hs = Array.from({ length: rows + 1 }, () => Array.from({ length: cols }, () => (r() < 0.5 ? 1 : -1)));
  const Vs = Array.from({ length: rows }, () => Array.from({ length: cols + 1 }, () => (r() < 0.5 ? 1 : -1)));
  const edge = (ax, ay, bx, by, nx, ny, s) => {
    if (!s) return `L${n(bx)} ${n(by)}`;
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) * 0.3 * s;
    const p = (f, m = 0) => `${n(ax + dx * f + nx * L * m)} ${n(ay + dy * f + ny * L * m)}`;
    return `L${p(0.36)} C${p(0.24, 1.1)} ${p(0.76, 1.1)} ${p(0.64)} L${n(bx)} ${n(by)}`;
  };
  const piece = (c, rr) => {
    const x = x0 + c * S, y = y0 + rr * S;
    const top = rr === 0 ? 0 : -Hs[rr][c];
    const bottom = rr === rows - 1 ? 0 : Hs[rr + 1][c];
    const left = c === 0 ? 0 : -Vs[rr][c];
    const right = c === cols - 1 ? 0 : Vs[rr][c + 1];
    return `M${x} ${y} ${edge(x, y, x + S, y, 0, -1, top)} ${edge(x + S, y, x + S, y + S, 1, 0, right)} ${edge(x + S, y + S, x, y + S, 0, 1, bottom)} ${edge(x, y + S, x, y, -1, 0, left)} Z`;
  };
  const all = [];
  for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) all.push([c, rr]);
  const order = all.map((p) => [r(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const missing = clamp(o.missing ?? 1, 0, order.length);
  const placed = order.slice(0, order.length - missing);
  const holes = order.slice(order.length - missing);
  const fills = [P.blue, '#6f8aa3', P.green, '#7fa577'];
  const pcs = placed.map(([c, rr], i) => {
    const k = prog(t, AT(o) + 0.3 + i * 0.22, 0.25);
    if (k <= 0) return '';
    const cx = x0 + c * S + S / 2, cyy = y0 + rr * S + S / 2;
    const sc = 0.5 + 0.5 * ease.outBack(k), lift = (1 - k) * -30;
    const col = fills[(rr < rows / 2 ? 0 : 2) + ((c + rr) % 2)];
    return `<g transform="translate(${n(cx)} ${n(cyy + lift)}) scale(${n(sc)}) translate(${n(-cx)} ${n(-cyy)})" opacity="${n(clamp(k * 3))}"><path d="${piece(c, rr)}" fill="${col}" ${ol(2.5)}/></g>`;
  }).join('');
  const gaps = holes.map(([c, rr]) => `<path d="${piece(c, rr)}" fill="${P.paperShade}" stroke="${P.inkSoft}" stroke-width="2.5" stroke-dasharray="7 6"/>
    ${text('?', x0 + c * S + S / 2, y0 + rr * S + S / 2 + 14, { font: 'display', size: 40, anchor: 'middle', fill: P.inkSoft })}`).join('');
  return place(o, `<rect x="${x0 - 20}" y="${y0 - 20}" width="${W + 40}" height="${H + 40}" rx="6" fill="${P.paperDim}" ${ol(3)}/>${gaps}${pcs}`);
}

// ---------- coffee cup ----------
// Mug on a saucer with rising steam. o.color = mug colour.
function coffeeCup(o, t) {
  const steam = [0, 1, 2].map((i) => {
    const k = ((t * 0.5 + i / 3) % 1);
    const x = -22 + i * 22;
    return `<path d="M${x} ${n(-130 - k * 60)} q-10 -14 0 -28 t0 -28" stroke="${P.paper}" stroke-width="5" stroke-linecap="round" fill="none" opacity="${n(Math.sin(k * Math.PI) * 0.85)}"/>`;
  }).join('');
  return place(o, `
    <ellipse cx="0" cy="-10" rx="96" ry="14" fill="${P.paperDim}" ${ol(3)}/>
    <path d="M52 -100 Q96 -96 90 -64 Q84 -38 46 -42" stroke="${P.ink}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M52 -100 Q96 -96 90 -64 Q84 -38 46 -42" stroke="${o.color ?? P.paper}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-58 -118 H58 L50 -30 Q48 -16 30 -16 H-30 Q-48 -16 -50 -30 Z" fill="${o.color ?? P.paper}" ${ol(3)}/>
    <ellipse cx="0" cy="-118" rx="58" ry="12" fill="${P.woodDeep}" ${ol(3)}/>
    <path d="M-36 -96 Q-38 -60 -30 -36" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
    ${steam}`);
}

// ---------- petition clipboard ----------
// Clipboard with o.title (default 'PETITION') and o.count signatures (max 10) signing in one by one after `at`.
function clipboard(o, t) {
  const count = clamp(o.count ?? 8, 0, 10);
  const r = rng(o.seed ?? 11);
  const sigs = Array.from({ length: count }, (_, i) => {
    const y = -268 + i * 26, x = -86 + r() * 20;
    let d = `M${n(x)} ${n(y - 2)} c${n(2 + r() * 4)} ${n(-22 - r() * 6)} ${n(14 + r() * 6)} -24 ${n(6 + r() * 4)} -2 c-4 8 4 6 8 0`;
    const segs = 4 + Math.floor(r() * 4);
    let run = 20;
    for (let j = 0; j < segs; j++) {
      const h = r() < 0.25 ? 15 + r() * 5 : 5 + r() * 5, w = 10 + r() * 8;
      run += w;
      d += ` c${n(w * 0.1)} ${n(-h)} ${n(w * 0.7)} ${n(-h)} ${n(w * 0.5)} 0 c${n(-w * 0.1)} 4 ${n(w * 0.4)} 4 ${n(w * 0.5)} 0`;
    }
    d += ` c8 -6 ${n(-run * 0.5)} 6 ${n(-run * 0.8)} 5`;
    const k = prog(t, AT(o) + 0.4 + i * 0.35, 0.3);
    if (k <= 0) return '';
    return `<path d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${n(1 - k)}" stroke="${i % 3 === 1 ? P.blue : P.ink}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  const lines = Array.from({ length: 10 }, (_, i) => `<path d="M-96 ${-264 + i * 26} H96" stroke="${P.paperShade}" stroke-width="2"/>${text(`${i + 1}.`, -104, -266 + i * 26, { size: 14, anchor: 'end', fill: P.inkSoft })}`).join('');
  return place(o, `
    <rect x="-140" y="-380" width="280" height="380" rx="12" fill="${P.wood}" ${ol(3.5)}/>
    <rect x="-120" y="-350" width="240" height="334" fill="${P.paper}" ${ol(2.5)}/>
    ${text(o.title ?? 'PETITION', 0, -306, { font: 'display', size: 30, anchor: 'middle' })}
    ${lines}${sigs}
    <rect x="-56" y="-394" width="112" height="34" rx="8" fill="${P.greyLight}" ${ol(3)}/>
    <circle cx="0" cy="-386" r="6" fill="${P.greyDark}" ${ol(2)}/>`);
}

// ---------- evidence tray (top-down) ----------
// Grey tray; o.items (labels, e.g. ['PASSPORT','MAP','CASH']) placed one by one after `at`, each with a numbered tag.
// Known looks: PASSPORT, MAP, CASH, PHONE, KEYS, LETTER/NOTE/RECEIPT, WATCH; anything else is a sealed evidence bag.
function evidenceItem(label) {
  const L = String(label).toUpperCase();
  if (L.includes('PASSPORT')) return `<rect x="-38" y="-52" width="76" height="104" rx="5" fill="${P.navy}" ${ol(3)}/><circle cx="0" cy="-8" r="18" fill="none" stroke="${P.gold}" stroke-width="3"/><path d="M-18 -8 H18 M0 -26 V10" stroke="${P.gold}" stroke-width="2"/><path d="M-22 30 H22" stroke="${P.gold}" stroke-width="3"/>`;
  if (L.includes('MAP')) return `<path d="M-60 -44 L-20 -54 L20 -44 L60 -54 V44 L20 54 L-20 44 L-60 54 Z" fill="${P.paperDim}" ${ol(3)}/><path d="M-20 -54 V44 M20 -44 V54" stroke="${P.paperShade}" stroke-width="3"/><path d="M-46 30 Q-20 0 0 10 T44 -30" stroke="${P.red}" stroke-width="3" stroke-dasharray="6 5" fill="none"/><path d="M38 -38 l12 12 M50 -38 l-12 12" stroke="${P.red}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (L.includes('CASH') || L.includes('MONEY')) return [10, 0, -10].map((dy, i) => `<rect x="-62" y="${-30 + dy}" width="124" height="60" rx="4" fill="${i === 2 ? '#8fb085' : P.green}" ${ol(2.5)}/>`).join('') + `<circle cx="0" cy="-10" r="14" fill="none" stroke="${P.greenDark}" stroke-width="3"/><rect x="-14" y="-40" width="28" height="60" fill="${P.paper}" ${ol(2)}/>`;
  if (L.includes('PHONE')) return `<rect x="-30" y="-56" width="60" height="112" rx="10" fill="${P.ink}"/><rect x="-24" y="-46" width="48" height="88" rx="4" fill="${P.nightMid}"/><path d="M-18 -30 L16 20" stroke="${P.grey}" stroke-width="2.5"/>`;
  if (L.includes('KEY')) return `<circle cx="-30" cy="0" r="22" fill="none" stroke="${P.greyDark}" stroke-width="7"/><path d="M-8 0 H52 M36 0 V14 M48 0 V12" stroke="${P.goldDark}" stroke-width="8" stroke-linecap="round"/>`;
  if (L.includes('WATCH')) return `<rect x="-14" y="-56" width="28" height="112" rx="6" fill="${P.woodDeep}" ${ol(2.5)}/><circle r="28" fill="${P.paper}" ${ol(3)}/><path d="M0 0 V-18 M0 0 L12 6" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`;
  if (/LETTER|NOTE|RECEIPT|TICKET|DOC/.test(L)) return `<rect x="-44" y="-56" width="88" height="112" fill="${P.paper}" ${ol(2.5)}/>${[-36, -22, -8, 6, 20].map((y) => `<path d="M-32 ${y} H${y === 20 ? 10 : 32}" stroke="${P.inkSoft}" stroke-width="2.5"/>`).join('')}`;
  return `<rect x="-52" y="-58" width="104" height="116" rx="4" fill="${P.bubble}" opacity=".75" ${ol(2.5)}/><path d="M-52 -42 H52" stroke="${P.red}" stroke-width="4"/><rect x="-26" y="-20" width="52" height="40" fill="${P.paperDim}" ${ol(2)}/>`;
}
function evidenceTray(o, t) {
  const items = o.items || ['PASSPORT', 'MAP', 'CASH'];
  const m = items.length;
  const W = Math.max(420, m * 170 + 40), Hh = 280;
  const r = rng(o.seed ?? 3);
  const its = items.map((label, i) => {
    const x = -W / 2 + 20 + (W - 40) * (i + 0.5) / m, y = -Hh / 2 - 22;
    const rot = (r() - 0.5) * 16;
    const k = prog(t, AT(o) + 0.3 + i * 0.4, 0.25);
    if (k <= 0) return '';
    const sc = 0.5 + 0.5 * ease.outBack(k);
    const tag = `${i + 1}  ${String(label).toUpperCase()}`;
    const tw = textWidth(tag, 18, 'type') + 18;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(sc)})" opacity="${n(clamp(k * 3))}">
      <g transform="rotate(${n(rot)})">${evidenceItem(label)}</g>
      <g transform="translate(0 84) rotate(${n(-rot * 0.4)})"><rect x="${n(-tw / 2)}" y="-14" width="${n(tw)}" height="26" fill="${P.paper}" ${ol(2)}/>
      ${text(tag, 0, 5, { font: 'type', size: 18, anchor: 'middle' })}</g></g>`;
  }).join('');
  return place(o, `
    <rect x="${-W / 2}" y="${-Hh}" width="${W}" height="${Hh}" rx="16" fill="${P.steel}" ${ol(3.5)}/>
    <rect x="${-W / 2 + 14}" y="${-Hh + 14}" width="${W - 28}" height="${Hh - 28}" rx="10" fill="${P.greyLight}" stroke="${P.greyDark}" stroke-width="3"/>
    ${its}`);
}

// ---------- house of cards ----------
// Cards stack into an o.levels (3) pyramid after `at`, then collapse at o.fallAt (absolute seconds; default: 1.2s after built).
function houseOfCards(o, t) {
  const levels = o.levels ?? 3, CH = 110, lean = 17, CW = 11;
  const half = CH * Math.sin(rad(lean)), LH = CH * Math.cos(rad(lean)) + 8, SP = 2 * half + 18;
  const cards = []; // { x, y, rot, flat }
  for (let lv = 0; lv < levels; lv++) {
    const pairs = levels - lv, by = -lv * LH;
    for (let p = 0; p < pairs; p++) {
      const cx = (p - (pairs - 1) / 2) * SP;
      cards.push({ x: cx - half / 2, y: by - CH * Math.cos(rad(lean)) / 2, rot: lean, lv });
      cards.push({ x: cx + half / 2, y: by - CH * Math.cos(rad(lean)) / 2, rot: -lean, lv });
    }
    for (let p = 0; p < pairs - 1; p++) {
      const cx = (p + 0.5 - (pairs - 1) / 2) * SP;
      cards.push({ x: cx, y: by - LH + 4, rot: 90, lv, flat: true });
    }
  }
  const at = AT(o), step = 0.18;
  const built = at + 0.2 + cards.length * step;
  const fallAt = o.fallAt ?? built + 1.2;
  const r = rng(o.seed ?? 9);
  const svg = cards.map((c, i) => {
    const k = prog(t, at + 0.2 + i * step, 0.2);
    if (k <= 0) return '';
    const sx = (r() - 0.5) * 360, srot = (r() < 0.5 ? -1 : 1) * (70 + r() * 30), d = (levels - c.lv) * 0.08 + r() * 0.2;
    const f = ease.in(prog(t, fallAt + d, 0.6));
    const x = lerp(c.x, sx, f), y = lerp(c.y - (1 - k) * 30, -CW / 2 - 1, f);
    const rot = lerp(c.rot, srot, f);
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})" opacity="${n(clamp(k * 3))}">
      <rect x="${-CW / 2}" y="${-CH / 2}" width="${CW}" height="${CH}" rx="2" fill="${P.bubble}" ${ol(2.5)}/>
      <path d="M0 ${-CH / 2 + 10} V${CH / 2 - 10}" stroke="${i % 2 ? P.red : P.blue}" stroke-width="3"/></g>`;
  }).join('');
  return place(o, `<path d="M${-levels * SP / 2 - 40} 0 H${levels * SP / 2 + 40}" stroke="${P.ink}" stroke-width="3" opacity=".5"/>${svg}`);
}

// ---------- rocket ----------
// Rocket on a pad beside a gantry; lifts off o.launch seconds after `at` (default 0.8) with a smoke trail.
function rocket(o, t) {
  const lt = AT(o) + (o.launch ?? 0.8);
  const el = Math.max(0, t - lt);
  const rise = 110 * el * el + 20 * el; // accelerates upward
  const shakeX = t > lt - 0.4 && el < 0.6 ? Math.sin(t * 70) * 2 : 0;
  const puffs = [];
  if (t > lt - 0.4) {
    for (let e = lt - 0.4; e < t; e += 0.07) {
      const age = t - e;
      const ee = Math.max(0, e - lt);
      const py = -24 - (110 * ee * ee + 20 * ee) + age * 20;
      const side = Math.sin(e * 37) * (12 + age * 30);
      const op = clamp(0.85 - age * 0.35);
      if (op <= 0) continue;
      puffs.push(`<circle cx="${n(side)}" cy="${n(Math.min(-14, py))}" r="${n(14 + age * 16)}" fill="${P.bubble}" stroke="${P.greyLight}" stroke-width="2" opacity="${n(op)}"/>`);
    }
  }
  const flame = t > lt - 0.2 ? `<path d="M-14 -24 Q0 ${n(16 + Math.sin(t * 40) * 8 + Math.min(el, 1) * 20)} 14 -24 Z" fill="${P.gold}" ${ol(2)}/>` : '';
  const gantry = `<g opacity="${n(1 - clamp(el * 0.2))}"><rect x="-150" y="-330" width="34" height="306" fill="none" stroke="${P.greyDark}" stroke-width="5"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M-150 ${-24 - i * 38} L-116 ${-62 - i * 38}" stroke="${P.greyDark}" stroke-width="3"/>`).join('')}
    <path d="M-116 -250 H${n(-38 + Math.min(el * 60, 0))}" stroke="${P.greyDark}" stroke-width="5"/></g>`;
  return place(o, `
    ${gantry}
    <rect x="-110" y="-24" width="220" height="24" fill="${P.greyDark}" ${ol(3)}/>
    ${puffs.join('')}
    <g transform="translate(${n(shakeX)} ${n(-rise)})">
      ${flame}
      <path d="M-30 -48 L-62 -24 V-6 L-30 -24 Z M30 -48 L62 -24 V-6 L30 -24 Z" fill="${P.blue}" ${ol(3)}/>
      <rect x="-18" y="-34" width="36" height="12" fill="${P.greyDark}" ${ol(2.5)}/>
      <path d="M-30 -30 V-240 Q-30 -296 0 -330 Q30 -296 30 -240 V-30 Z" fill="${P.vanWhite}" ${ol(3.5)}/>
      <path d="M-30 -240 Q-30 -296 0 -330 Q30 -296 30 -240 Z" fill="${P.blue}" ${ol(3)}/>
      <circle cx="0" cy="-190" r="13" fill="${P.windowDark}" ${ol(3)}/>
      <path d="M-30 -90 H30" stroke="${P.ink}" stroke-width="2.5"/>
    </g>`);
}

module.exports = {
  balanceScale, bell, countdownClock, wallClock, invitation, doorsRow, sharkFins, circuitBreaker, weather, photocopier,
  badge, van, radarScope, blackBox, jet, thermometer, pokerTable, puzzle, coffeeCup, clipboard, evidenceTray, houseOfCards, rocket,
};
