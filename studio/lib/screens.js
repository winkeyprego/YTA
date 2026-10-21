// Screens kit (finance pack): simplified, flat UI mock-ups in the studio's ink-outline style.
// Every export is a pure function (spec, t) -> SVG for the full 1280x720 world layer (draws its own backdrop).
// All timing fields are NUMERIC seconds from the shot start (templates convert word cues to seconds first).
// No real logos or trademarks: brands are lettered emblems (rounded square / disc with 1-2 letters) + a name.
//
//   socialPost({ name, handle, text, avatar, likes, reposts, time, at, likesAt, verified })
//       avatar: 'host' | a CAST key (drawn as a head in a circle) | 1-2 letters (emblem disc). Default: initials of name.
//       likes / reposts: numbers, count up from likesAt (default at + 1.2). time: '2h' | 'Dec 1, 2022'.
//   phoneNotification({ app, title, body, time, at, count, urgent })
//       app: name (emblem letters from it). count > 1 stacks cards behind ("+N more"). urgent: red title (margin calls etc.).
//   browserArticle({ site, headline, sub, lines, highlight, highlightAt, at })
//       lines: number of grey placeholder lines, or an array of strings. highlight: phrase inside the headline (or a line)
//       swept with the highlighter at highlightAt (default at + 1.2).
//   appPage({ name, emblem, rating, rank, category, downloads, at })
//       emblem: letters (default: first letters of name). rating 0..5. rank: '#1 in Finance'. downloads: number (counts up).
//   newsLive({ channel, headline, ticker, anchor, at })
//       TV set showing a broadcast: LIVE tag, channel emblem, headline bar slides up at `at`, ticker text scrolls.
//       anchor: optional CAST key presenting in the studio box.
//   terminal({ lines: [{ text, at }], title })
//       dark terminal window; each line types at ~40 cps from its at; blinking cursor.
//   chatThread({ messages: [{ from: 'left'|'right', text, at }], title })
//       phone chat; a typing indicator shows 0.6s before each left message, then the bubble pops.

const P = require('./palette');
const { n, text, textWidth, esc } = require('./svg');
const { typed, ease, prog, clamp } = require('./motion');

// UI chrome colours (derived, finance pack only).
const C = {
  wall: '#d8dbd5',       // light neutral backdrop
  wallDeep: '#c5cac3',
  desk: '#9a6b4a',       // warm wood strip
  deskDark: '#7d5439',
  card: '#fbfbf8',       // UI surfaces
  chrome: '#e7e8e3',     // browser/app chrome
  line: '#d2d4cd',       // separators, placeholder text bars
  muted: '#7b7f7a',      // secondary UI text
  teal: '#3f8f8a',       // UI accent (links, buttons, own chat bubbles)
  tealLight: '#cfe6e2',
  blueCheck: '#4f8fc9',
  screenDark: '#1f2a33', // phone lock screen / terminal
  termText: '#a8dcb4',
  tvBlue: '#24344d',
};

// Real glyph advance widths (per 100px, ASCII 32-126) measured in Chromium for the two UI fonts,
// so highlights, badges and bubbles line up with the text exactly.
const GLYPHS = {
  display: [19,29,46,83,53,80,67,30,43,42,56,60,30,52,23,57,64,41,52,53,60,52,57,50,57,56,28,28,48,58,45,58,87,65,59,56,62,49,47,62,64,43,46,62,43,91,65,70,57,71,59,53,50,63,66,95,68,61,56,38,59,38,69,64,35,52,52,42,56,49,37,52,50,27,27,53,27,79,55,51,55,51,40,45,37,54,52,75,56,54,45,36,63,36,46],
  hand: [23,25,30,46,51,64,53,16,33,36,40,48,20,40,21,42,45,36,47,45,37,42,40,49,43,37,23,23,40,57,40,37,55,49,51,55,47,44,37,48,47,23,37,52,37,59,53,56,48,65,45,46,47,55,56,62,60,44,51,30,42,30,37,57,22,39,41,39,39,40,36,44,42,22,23,41,27,68,45,40,43,46,38,38,34,40,40,46,45,42,43,34,18,33,53],
};
function measure(str, size, font = 'hand') {
  const tbl = GLYPHS[font];
  if (!tbl) return textWidth(str, size, font);
  let wsum = 0;
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0);
    wsum += c >= 32 && c < 127 ? tbl[c - 32] : 60;
  }
  return (wsum / 100) * size;
}

const ink = (w = 3) => `stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round"`;

// ---------- shared helpers ----------
function backdrop({ desk = true } = {}) {
  return `<defs><radialGradient id="scrWall" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${C.wall}"/><stop offset="1" stop-color="${C.wallDeep}"/></radialGradient></defs>
    <rect width="1280" height="720" fill="url(#scrWall)"/>
    ${desk ? `<rect y="622" width="1280" height="98" fill="${C.desk}"/><path d="M0 622 H1280" stroke="${P.ink}" stroke-width="4"/><path d="M0 652 H1280" stroke="${C.deskDark}" stroke-width="2"/>` : ''}`;
}

// Entrance: rises 40px and fades in over 0.3s.
function rise(t, at, inner, { dy = 40, dur = 0.3 } = {}) {
  if (t < at) return '';
  const k = ease.out(prog(t, at, dur));
  return `<g opacity="${n(clamp(k * 1.4))}" transform="translate(0 ${n((1 - k) * dy)})">${inner}</g>`;
}

// Pop: scale from 50% with overshoot around (cx, cy).
function popAt(t, at, cx, cy, inner, dur = 0.2) {
  if (t < at) return '';
  const k = prog(t, at, dur);
  const s = 0.5 + 0.5 * ease.outBack(k);
  return `<g opacity="${n(clamp(k * 4))}" transform="translate(${n(cx)} ${n(cy)}) scale(${n(s)}) translate(${n(-cx)} ${n(-cy)})">${inner}</g>`;
}

const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Lettered emblem (rounded square or disc). Never a real logo.
function emblem(cx, cy, size, letters, { color = C.teal, round = false } = {}) {
  const r = round ? size / 2 : size * 0.24;
  const fs = letters.length > 1 ? size * 0.42 : size * 0.56;
  return `<rect x="${n(cx - size / 2)}" y="${n(cy - size / 2)}" width="${size}" height="${size}" rx="${n(r)}" fill="${color}" ${ink(2.5)}/>
    ${text(letters, cx, cy + fs * 0.36, { size: n(fs), font: 'display', fill: P.paper, anchor: 'middle' })}`;
}

// Round avatar: a cast head inside a circle, or an emblem disc.
function avatar(cx, cy, r, who, fallbackName) {
  let CAST, character;
  try { ({ CAST, character } = require('./characters')); } catch (e) { CAST = {}; }
  const key = who && CAST[who] ? who : null;
  if (!key) return emblem(cx, cy, r * 2, who && who.length <= 2 ? who.toUpperCase() : initials(fallbackName), { round: true, color: P.blue });
  const id = `av${Math.round(cx)}x${Math.round(cy)}`;
  const s = r / 74;
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.tealLight}"/>
    <g clip-path="url(#${id})"><g transform="translate(${n(cx)} ${n(cy + 236 * s + r * 0.12)}) scale(${n(s)})">${character(CAST[key], { eyes: 'dot', mouth: 'smile', legs: false })}</g></g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${ink(3)}/>`;
}

// Word-wrap by approximate width.
function wrap(str, maxW, size, font = 'hand') {
  const words = String(str || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next, size, font) > maxW) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Typed multi-line text: reveals characters across lines in order. Returns svg.
function typedLines(lines, x, y, lh, t, at, cps, opts) {
  let left = typed(lines.join('\n'), t, at, cps).length;
  return lines.map((ln, i) => {
    const show = ln.slice(0, Math.max(0, left));
    left -= ln.length + 1;
    return show ? text(show, x, y + i * lh, opts) : '';
  }).join('');
}

// Count-up formatted like a UI: 1.2K, 34K, 1.5M.
function compact(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K`;
  return String(Math.round(v));
}
const countUp = (value, t, at, dur = 1.1) => (value || 0) * ease.out(prog(t, at, dur));

// ---------- socialPost ----------
function socialPost(spec, t) {
  const at = spec.at ?? 0.2;
  const likesAt = spec.likesAt ?? at + 1.2;
  const x = 230, w = 820;
  const bodySize = 36;
  const lines = wrap(spec.text, w - 90, bodySize);
  const h = 180 + lines.length * bodySize * 1.3 + 90;
  const y = Math.max(40, Math.round((720 - h) / 2) - 10);
  const name = spec.name || 'Someone';
  const handle = spec.handle || `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const verified = spec.verified ? `<circle cx="${n(x + 152 + measure(name, 32, 'display'))}" cy="${y + 64}" r="13" fill="${C.blueCheck}" ${ink(2)}/>
    <path d="M${n(x + 145 + measure(name, 32, 'display'))} ${y + 64} l5 5 l9 -10" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : '';
  const liked = t >= likesAt;
  const icon = (ix, kind, val, active) => {
    const col = active ? (kind === 'heart' ? P.red : P.green) : C.muted;
    const shape = kind === 'heart'
      ? `<path d="M${ix} ${y + h - 46} c-8 -10 -22 -4 -18 8 c3 8 18 18 18 18 c0 0 15 -10 18 -18 c4 -12 -10 -18 -18 -8 Z" fill="${active ? P.red : 'none'}" stroke="${col}" stroke-width="3"/>`
      : kind === 'repost'
        ? `<path d="M${ix - 16} ${y + h - 40} v-6 h26 l-6 -6 M${ix + 16} ${y + h - 28} v6 h-26 l6 6" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M${ix - 16} ${y + h - 50} h32 v20 h-18 l-8 7 v-7 h-6 Z" stroke="${col}" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    return shape + (val != null ? text(val, ix + 28, y + h - 28, { size: 26, fill: col, font: 'hand' }) : '');
  };
  const card = `<g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${n(h)}" rx="28" fill="${C.card}" ${ink(3)}/></g>
    ${avatar(x + 72, y + 78, 40, spec.avatar, name)}
    ${text(name, x + 130, y + 76, { size: 32, font: 'display' })}${verified}
    ${text(handle, x + 130, y + 112, { size: 26, font: 'hand', fill: C.muted })}
    ${spec.time ? text(spec.time, x + w - 40, y + 76, { size: 24, font: 'hand', fill: C.muted, anchor: 'end' }) : ''}
    ${typedLines(lines, x + 46, y + 180, bodySize * 1.3, t, at + 0.3, 30, { size: bodySize, font: 'hand' })}
    <path d="M${x + 30} ${n(y + h - 80)} H${x + w - 30}" stroke="${C.line}" stroke-width="2"/>
    ${icon(x + 90, 'reply', null, false)}
    ${icon(x + 320, 'repost', spec.reposts != null ? compact(countUp(spec.reposts, t, likesAt)) : null, liked && spec.reposts)}
    ${icon(x + 550, 'heart', spec.likes != null ? compact(countUp(spec.likes, t, likesAt)) : null, liked)}`;
  return backdrop({ desk: false }) + rise(t, at, card);
}

// ---------- phoneNotification ----------
function phone(cx, top, w, h, screen, { color = C.screenDark } = {}) {
  const x = cx - w / 2;
  return `<g filter="url(#softShadow)"><rect x="${n(x)}" y="${top}" width="${w}" height="${h}" rx="54" fill="${P.ink}"/></g>
    <rect x="${n(x + 14)}" y="${top + 14}" width="${w - 28}" height="${h - 28}" rx="42" fill="${color}"/>
    <rect x="${n(cx - 55)}" y="${top + 26}" width="110" height="26" rx="13" fill="${P.ink}"/>
    ${screen}`;
}

function phoneNotification(spec, t) {
  const at = spec.at ?? 0.3;
  const cx = 640, top = 50, w = 520, h = 780;
  const x = cx - w / 2 + 34, cw = w - 68;
  const bodyLines = wrap(spec.body, cw - 40, 28);
  const ch = 120 + bodyLines.length * 36;
  const cardY = 300;
  const k = ease.out(prog(t, at, 0.35));
  const slideY = cardY - (1 - k) * 160;
  const extra = (spec.count || 1) > 1;
  const appName = spec.app || 'Bank';
  const card = t >= at ? `<g opacity="${n(clamp(k * 1.5))}" transform="translate(0 ${n(slideY - cardY)})">
      ${extra ? `<rect x="${x + 16}" y="${cardY + ch - 10}" width="${cw - 32}" height="34" rx="16" fill="#e9ebe6" ${ink(2)}/>` : ''}
      <rect x="${x}" y="${cardY}" width="${cw}" height="${ch}" rx="26" fill="${C.card}" ${ink(2.5)}/>
      ${emblem(x + 40, cardY + 38, 40, initials(appName).slice(0, 1), { color: spec.urgent ? P.red : C.teal })}
      ${text(appName.toUpperCase(), x + 72, cardY + 46, { size: 24, font: 'hand', fill: C.muted })}
      ${text('now', x + cw - 22, cardY + 46, { size: 22, font: 'hand', fill: C.muted, anchor: 'end' })}
      ${text(spec.title || '', x + 22, cardY + 92, { size: 32, font: 'display', fill: spec.urgent ? P.red : P.ink })}
      ${bodyLines.map((l, i) => text(l, x + 22, cardY + 128 + i * 36, { size: 28, font: 'hand' })).join('')}
      ${extra ? text(`+${spec.count - 1} more`, cx, cardY + ch + 64, { size: 24, font: 'hand', fill: P.paper, anchor: 'middle' }) : ''}
    </g>` : '';
  const lock = `${text(spec.time || '9:41', cx, top + 170, { size: 84, font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.92 })}
    ${text(spec.date || 'Monday', cx, top + 210, { size: 26, font: 'hand', fill: P.paper, anchor: 'middle', opacity: 0.7 })}`;
  return backdrop() + phone(cx, top, w, h, lock + card);
}

// ---------- browserArticle ----------
function browserArticle(spec, t) {
  const at = spec.at ?? 0.2;
  const hlAt = spec.highlightAt ?? at + 1.2;
  const x = 110, y = 50, w = 1060, h = 640;
  const site = spec.site || 'The Daily Ledger';
  const headSize = 48;
  const headLines = wrap(spec.headline, w - 140, headSize, 'display');
  let yy = y + 190;
  // highlight range in the joined headline, so a phrase that wraps onto two lines is swept on both
  const joined = headLines.join(' ');
  const hlStart = spec.highlight ? joined.toLowerCase().indexOf(String(spec.highlight).toLowerCase()) : -1;
  const hlEnd = hlStart >= 0 ? hlStart + spec.highlight.length : -1;
  const kk = ease.inOut(prog(t, hlAt, 0.45));
  let offset = 0;
  const headSvg = headLines.map((ln, i) => {
    let hl = '';
    const a0 = Math.max(hlStart, offset), a1 = Math.min(hlEnd, offset + ln.length);
    if (hlStart >= 0 && a1 > a0 && kk > 0) {
      const hx = x + 70 + measure(ln.slice(0, a0 - offset), headSize, 'display');
      const hw = measure(ln.slice(a0 - offset, a1 - offset), headSize, 'display');
      hl = `<rect x="${n(hx - 6)}" y="${n(yy + i * headSize * 1.15 - headSize * 0.82)}" width="${n((hw + 12) * kk)}" height="${n(headSize * 0.95)}" fill="${P.gold}" opacity=".55"/>`;
    }
    offset += ln.length + 1;
    return hl + text(ln, x + 70, yy + i * headSize * 1.15, { size: headSize, font: 'display' });
  }).join('');
  yy += headLines.length * headSize * 1.15;
  const sub = spec.sub ? text(spec.sub, x + 70, yy + 6, { size: 30, font: 'hand', fill: C.muted }) : '';
  yy += spec.sub ? 60 : 24;
  let body = '';
  if (Array.isArray(spec.lines)) {
    body = spec.lines.map((l, i) => text(l, x + 70, yy + 20 + i * 40, { size: 28, font: 'hand' })).join('');
  } else {
    const count = spec.lines ?? 5;
    for (let i = 0; i < count && yy + 24 + i * 34 < y + h - 30; i++) {
      body += `<rect x="${x + 70}" y="${n(yy + 8 + i * 34)}" width="${n((w - 140) * (i === count - 1 ? 0.55 : 0.9 + ((i * 37) % 10) / 100))}" height="14" rx="7" fill="${C.line}"/>`;
    }
  }
  const win = `<g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${C.card}" ${ink(3)}/></g>
    <path d="M${x + 1.5} ${y + 70} H${x + w - 1.5}" stroke="${P.ink}" stroke-width="2.5"/>
    <path d="M${x + 22} ${y} h${w - 44} a20 20 0 0 1 20 20 v50 H${x + 1.5} v-50 a20 20 0 0 1 20 -20 Z" fill="${C.chrome}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="none" ${ink(3)}/>
    <path d="M${x} ${y + 70} H${x + w}" stroke="${P.ink}" stroke-width="2.5"/>
    ${[0, 1, 2].map((i) => `<circle cx="${x + 36 + i * 30}" cy="${y + 36}" r="9" fill="${[P.red, P.gold, P.green][i]}" ${ink(2)}/>`).join('')}
    <rect x="${x + 150}" y="${y + 16}" width="${w - 300}" height="40" rx="20" fill="${C.card}" ${ink(2)}/>
    ${text(`${site.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`, x + 180, y + 45, { size: 24, font: 'hand', fill: C.muted })}
    ${text(site.toUpperCase(), x + 70, y + 122, { size: 30, font: 'display', fill: P.redDark, spacing: 2 })}
    <path d="M${x + 70} ${y + 138} H${x + w - 70}" stroke="${P.ink}" stroke-width="2"/>
    ${headSvg}${sub}${body}`;
  return backdrop({ desk: false }) + rise(t, at, win, { dy: 30 });
}

// ---------- appPage ----------
function stars(x, y, rating, size = 26) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const fill = rating >= i + 0.75 ? P.gold : rating >= i + 0.25 ? 'url(#halfStar)' : '#d9d9d2';
    const cx = x + i * size * 1.15, cy = y;
    const pts = Array.from({ length: 10 }, (_, k) => {
      const r = k % 2 ? size * 0.22 : size * 0.5;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      return `${n(cx + Math.cos(a) * r)},${n(cy + Math.sin(a) * r)}`;
    }).join(' ');
    out += `<polygon points="${pts}" fill="${fill}" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  return `<defs><linearGradient id="halfStar"><stop offset=".5" stop-color="${P.gold}"/><stop offset=".5" stop-color="#d9d9d2"/></linearGradient></defs>${out}`;
}

function appPage(spec, t) {
  const at = spec.at ?? 0.2;
  const x = 200, y = 60, w = 880, h = 600;
  const name = spec.name || 'App';
  const letters = spec.emblem || initials(name);
  const rankAt = at + 0.9, dlAt = at + 1.4;
  const dl = spec.downloads != null && t >= dlAt ? compact(countUp(spec.downloads, t, dlAt)) + '+' : null;
  const page = `<g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${C.card}" ${ink(3)}/></g>
    ${text('APP STORE', x + 40, y + 52, { size: 26, font: 'hand', fill: C.muted, spacing: 2 })}
    <path d="M${x + 30} ${y + 74} H${x + w - 30}" stroke="${C.line}" stroke-width="2"/>
    ${emblem(x + 130, y + 190, 170, letters, { color: C.teal })}
    ${text(name, x + 250, y + 170, { size: 56, font: 'display' })}
    ${text(spec.category || 'Finance', x + 250, y + 212, { size: 30, font: 'hand', fill: C.muted })}
    <rect x="${x + 250}" y="${y + 238}" width="150" height="54" rx="27" fill="${C.teal}" ${ink(2.5)}/>
    ${text('GET', x + 325, y + 275, { size: 30, font: 'display', fill: P.paper, anchor: 'middle' })}
    <path d="M${x + 30} ${y + 330} H${x + w - 30}" stroke="${C.line}" stroke-width="2"/>
    <g>${stars(x + 80, y + 400, spec.rating ?? 4.8, 34)}</g>
    ${text(`${(spec.rating ?? 4.8).toFixed(1)} RATING`, x + 60, y + 460, { size: 28, font: 'hand', fill: C.muted })}
    <path d="M${x + 330} ${y + 360} V${y + 480} M${x + 600} ${y + 360} V${y + 480}" stroke="${C.line}" stroke-width="2"/>
    ${dl ? text(dl, x + 465, y + 420, { size: 48, font: 'display', anchor: 'middle' }) + text('DOWNLOADS', x + 465, y + 460, { size: 28, font: 'hand', fill: C.muted, anchor: 'middle' }) : ''}
    ${spec.rank ? popAt(t, rankAt, x + 740, y + 420, `<rect x="${x + 620}" y="${y + 380}" width="240" height="80" rx="40" fill="${P.gold}" ${ink(3)}/>${text(spec.rank, x + 740, y + 432, { size: 30, font: 'display', anchor: 'middle' })}`) : ''}
    ${[0, 1, 2].map((i) => `<rect x="${x + 40 + i * 275}" y="${y + 500}" width="250" height="80" rx="16" fill="${C.tealLight}" ${ink(2)}/>`).join('')}`;
  return backdrop({ desk: false }) + rise(t, at, page, { dy: 30 });
}

// ---------- newsLive ----------
function newsLive(spec, t) {
  const at = spec.at ?? 0.3;
  const sx = 120, sy = 50, sw = 1040, sh = 560;
  let anchor = '';
  if (spec.anchor) {
    try {
      const { CAST, character } = require('./characters');
      if (CAST[spec.anchor]) {
        anchor = `<g transform="translate(${sx + 290} ${sy + 560}) scale(1.05)">${character(CAST[spec.anchor], { eyes: 'dot', brows: 'flat', mouth: Math.floor(t * 6) % 3 === 0 ? 'open' : 'neutral', legs: false })}</g>
          <rect x="${sx + 120}" y="${sy + 420}" width="340" height="140" fill="#3a4a63" ${ink(3)}/>`;
      }
    } catch (e) { anchor = ''; }
  }
  const studio = `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${C.tvBlue}"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${sx + i * 160}" y="${sy}" width="80" height="${sh}" fill="#2b3d59" opacity=".6"/>`).join('')}
    <rect x="${sx + 620}" y="${sy + 70}" width="360" height="230" rx="10" fill="#16202e" ${ink(3)}/>
    <path d="M${sx + 650} ${sy + 260} l60 -50 l50 30 l60 -80 l70 40" stroke="${P.red}" stroke-width="6" fill="none" stroke-linejoin="round"/>
    ${anchor}`;
  const k = ease.out(prog(t, at, 0.35));
  const barY = sy + sh - 150 + (1 - k) * 160;
  const headline = String(spec.headline || 'BREAKING NEWS').toUpperCase();
  const tick = spec.ticker ? (() => {
    const msg = `${String(spec.ticker).toUpperCase()}   •   `;
    const unit = measure(msg, 26, 'hand');
    const off = (t * 140) % unit;
    return `<rect x="${sx}" y="${sy + sh - 44}" width="${sw}" height="44" fill="${P.ink}"/>
      <g clip-path="url(#tvClip)">${[0, 1, 2, 3].map((i) => text(msg, sx + 20 - off + i * unit, sy + sh - 13, { size: 26, font: 'hand', fill: P.paper })).join('')}</g>`;
  })() : '';
  const live = t >= at ? `<g opacity="${n(clamp(k * 1.5))}">
      <rect x="${sx + 30}" y="${n(barY)}" width="${sw - 60}" height="84" fill="${C.card}" ${ink(3)}/>
      <rect x="${sx + 30}" y="${n(barY - 44)}" width="140" height="44" fill="${P.red}" ${ink(3)}/>
      <circle cx="${sx + 56}" cy="${n(barY - 22)}" r="8" fill="#fff" opacity="${Math.floor(t * 2) % 2 ? 1 : 0.35}"/>
      ${text('LIVE', sx + 74, barY - 10, { size: 32, font: 'display', fill: '#fff' })}
      ${emblem(sx + 80, barY + 42, 56, initials(spec.channel || 'News Network').slice(0, 2), { color: P.redDark })}
      ${text(headline, sx + 128, barY + 56, { size: Math.min(40, (sw - 200) / (headline.length * 0.56)), font: 'display' })}
    </g>` : '';
  const tv = `<defs><clipPath id="tvClip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}"/></clipPath></defs>
    <rect x="${sx - 22}" y="${sy - 22}" width="${sw + 44}" height="${sh + 44}" rx="18" fill="${P.ink}"/>
    <g clip-path="url(#tvClip)">${studio}${tick}${live}</g>
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="590" y="${sy + sh + 22}" width="100" height="40" fill="${P.ink}"/>`;
  return `<rect width="1280" height="720" fill="#cfc9bd"/><rect y="650" width="1280" height="70" fill="${C.desk}"/><path d="M0 650 H1280" stroke="${P.ink}" stroke-width="4"/>${tv}`;
}

// ---------- terminal ----------
function terminal(spec, t) {
  const x = 140, y = 70, w = 1000, h = 560;
  const lines = spec.lines || [];
  let cursorLine = 0, cursorX = x + 50;
  const rows = lines.map((l, i) => {
    const at = l.at ?? 0.3 + i * 0.8;
    if (t < at) return '';
    const shown = typed(l.text, t, at, 40);
    cursorLine = i;
    cursorX = x + 50 + measure(shown, 30, 'type');
    return text(shown, x + 50, y + 130 + i * 48, { size: 30, font: 'type', fill: l.color || C.termText });
  }).join('');
  const cursor = Math.floor(t * 2.5) % 2 ? `<rect x="${n(cursorX + 4)}" y="${y + 106 + cursorLine * 48}" width="16" height="30" fill="${C.termText}"/>` : '';
  const win = `<g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${C.screenDark}" ${ink(3)}/></g>
    <path d="M${x + 18} ${y} h${w - 36} a16 16 0 0 1 16 16 v40 H${x + 1.5} v-40 a16 16 0 0 1 16 -16 Z" fill="#2d3943"/>
    <path d="M${x} ${y + 56} H${x + w}" stroke="${P.ink}" stroke-width="2.5"/>
    ${[0, 1, 2].map((i) => `<circle cx="${x + 32 + i * 28}" cy="${y + 28}" r="8" fill="${[P.red, P.gold, P.green][i]}" ${ink(1.5)}/>`).join('')}
    ${text(spec.title || 'TERMINAL', x + w / 2, y + 38, { size: 26, font: 'hand', fill: '#c9d3d6', anchor: 'middle', spacing: 2 })}
    ${rows}${cursor}`;
  return backdrop() + win;
}

// ---------- chatThread ----------
function chatThread(spec, t) {
  const cx = 640, top = 30, w = 560, h = 820;
  const x0 = cx - w / 2 + 34, cw = w - 68;
  const msgs = spec.messages || [];
  let y = top + 200;
  const size = 32;
  const out = [];
  msgs.forEach((m, i) => {
    const at = m.at ?? 0.4 + i * 1.1;
    const lines = wrap(m.text, cw * 0.68, size);
    const bw = Math.max(...lines.map((l) => measure(l, size))) + 40;
    const bh = lines.length * size * 1.25 + 26;
    const right = m.from === 'right';
    const bx = right ? x0 + cw - bw - 12 : x0 + 12;
    if (!right && t >= at - 0.6 && t < at) {
      out.push(`<rect x="${bx}" y="${y}" width="96" height="52" rx="26" fill="#e3e5e0" ${ink(2)}/>`
        + [0, 1, 2].map((d) => `<circle cx="${bx + 28 + d * 20}" cy="${y + 26 - (Math.floor(t * 6 + d) % 3 === 0 ? 5 : 0)}" r="6" fill="${C.muted}"/>`).join(''));
    }
    if (t >= at) {
      const bubble = `<rect x="${n(bx)}" y="${n(y)}" width="${n(bw)}" height="${n(bh)}" rx="24" fill="${right ? C.teal : '#e3e5e0'}" ${ink(2)}/>
        ${lines.map((l, k) => text(l, bx + 20, y + 22 + size * 0.85 + k * size * 1.25, { size, font: 'hand', fill: right ? P.paper : P.ink })).join('')}`;
      out.push(popAt(t, at, right ? bx + bw : bx, y + bh, bubble, 0.18));
    }
    y += bh + 22;
  });
  const header = `${avatar(cx, top + 110, 36, spec.avatar, spec.title || 'Chat')}
    ${text(spec.title || 'Chat', cx, top + 172, { size: 26, font: 'display', fill: P.paper, anchor: 'middle' })}`;
  return backdrop() + phone(cx, top, w, h, `<rect x="${cx - w / 2 + 14}" y="${top + 190}" width="${w - 28}" height="${h - 204}" rx="0" fill="${C.card}"/>${header}${out.join('')}`, { color: '#2c3a44' });
}

module.exports = { measure, socialPost, phoneNotification, browserArticle, appPage, newsLive, terminal, chatThread, emblem, avatar, SCREEN_COLORS: C };
