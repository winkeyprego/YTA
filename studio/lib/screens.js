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
//   email({ from, to, subject, body: [lines] | 'text', at, sendAt, fly })
//       mail-client compose window; From/To/Subject shown, the body types in at ~32 cps from at + 0.4. At sendAt
//       (default: 0.5s after the typing ends) the SEND button presses, the window swooshes off to the top right and a
//       "SENT" chip pops.
//   videoPage({ title, channel, views, viewsFrom, length, progress, emblem, at, viewsAt })
//       video-site watch page: player with an abstract thumbnail (channel emblem, falling line, coins; no real logos), play
//       bar creeping forward, title, channel row, and the view counter counting up from viewsFrom (0) at viewsAt
//       (default at + 0.8). views: number (counted, comma-formatted) or string. length: '12:08'. progress 0..1.
//   cctv({ label, time, frame, frames, scene, at })
//       grainy grey security-camera still of an EMPTY scene: scene 'hallway' (default) or 'doorway'. Overlay: REC dot,
//       label ('CAM 03 · LOBBY'), timestamp whose trailing HH:MM:SS ticks with t ('07/24/2026 02:14:07'), and
//       'FRAME 1/5' (frame: '1/5', or frame: 1 + frames: 5). Static burst at `at`. No people, no incidents.
//   radar({ blips: [{ x, y } | { angle, dist }, label, at, ghost], ring, inner, innerLabel, label, period, at })
//       round green radar scope in a console, with a rotating sweep (period 2.6s); blips glow as the sweep passes.
//       x, y in -1..1 (y down) or angle (deg, 0 = up, clockwise) + dist 0..1. ring: true = coverage only on the rim:
//       the middle (inner radius, default 0.55) is dark and labelled innerLabel ('NO COVERAGE'); blips there stay
//       unseen (ghost: true draws them as faint dashed outlines). label: plate under the scope.

const P = require('./palette');
const { n, text, textWidth, esc } = require('./svg');
const { typed, ease, prog, clamp, lerp } = require('./motion');

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
  cctvText: '#eef0ea',   // security-camera on-screen display
  radar: '#163625',      // radar scope
  radarDeep: '#0e2318',
  radarLine: '#5fbf8a',
  radarBright: '#b4f2c8',
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
// The room behind the screen (lib/backdrops.js; the kit template picks the room per shot).
function backdrop({ desk = true } = {}) {
  return require('./backdrops').room(undefined, { desk });
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

// ---------- shared: tagged text for the layout checker ----------
const qa = (name, inner) => `<g data-qa="text" data-qn="${esc(String(name).slice(0, 28))}">${inner}</g>`;
const fitSize = (str, maxW, size, font = 'hand') => Math.min(size, maxW / Math.max(1, measure(str, 1, font)));
const commas = (v) => Math.round(v).toLocaleString('en-US');

function windowChrome(x, y, w, h, { title = '', bar = 56, fill = C.card } = {}) {
  return `<g filter="url(#softShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${fill}" ${ink(3)}/></g>
    <path d="M${x + 20} ${y} h${w - 40} a20 20 0 0 1 20 20 v${bar - 20} H${x} v-${bar - 20} a20 20 0 0 1 20 -20 Z" fill="${C.chrome}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="none" ${ink(3)}/>
    <path d="M${x} ${y + bar} H${x + w}" stroke="${P.ink}" stroke-width="2.5"/>
    ${[0, 1, 2].map((i) => `<circle cx="${x + 32 + i * 28}" cy="${y + bar / 2}" r="8" fill="${[P.red, P.gold, P.green][i]}" ${ink(1.5)}/>`).join('')}
    ${title ? text(title, x + w / 2, y + bar / 2 + 9, { size: 26, font: 'hand', fill: C.muted, anchor: 'middle' }) : ''}`;
}

// ---------- email ----------
function email(spec, t) {
  const at = spec.at ?? 0.2;
  const x = 170, y = 46, w = 940, h = 590;
  const size = 32, lh = size * 1.32;
  const raw = Array.isArray(spec.body) ? spec.body : [spec.body || ''];
  const lines = raw.flatMap((l) => (String(l).trim() ? wrap(l, w - 110, size) : [''])).slice(0, 7);
  const typeAt = at + 0.4, cps = 32;
  const typeEnd = typeAt + lines.join('\n').length / cps;
  const sendAt = spec.sendAt ?? typeEnd + 0.5;
  const field = (label, val, yy, bold) => `${text(label, x + 40, yy, { size: 26, font: 'hand', fill: C.muted })}
    ${qa(`email ${label}`, text(val, x + 150, yy, { size: n(fitSize(val, w - 200, 30, bold ? 'display' : 'hand')), font: bold ? 'display' : 'hand' }))}
    <path d="M${x + 30} ${yy + 20} H${x + w - 30}" stroke="${C.line}" stroke-width="2"/>`;
  const press = prog(t, sendAt, 0.18);
  const bs = 1 - 0.1 * Math.sin(Math.PI * press);
  const bx = x + 40, by = y + h - 84, bw = 190, bh = 58;
  const button = `<g transform="translate(${n(bx + bw / 2)} ${n(by + bh / 2)}) scale(${n(bs)}) translate(${n(-bx - bw / 2)} ${n(-by - bh / 2)})">
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="29" fill="${press > 0 && press < 1 ? P.greenDark : C.teal}" ${ink(2.5)}/>
      <path d="M${bx + 30} ${by + 30} l34 -14 l-10 30 l-7 -10 Z" fill="${P.paper}" ${ink(1.5)}/>
      ${text('SEND', bx + 120, by + 40, { size: 30, font: 'display', fill: P.paper, anchor: 'middle' })}</g>`;
  const cursorOn = t >= typeAt && t < sendAt && Math.floor(t * 2.5) % 2 === 0;
  let cur = '';
  if (cursorOn) {
    let left = Math.max(0, Math.floor((t - typeAt) * cps));
    let li = 0;
    while (li < lines.length - 1 && left > lines[li].length) { left -= lines[li].length + 1; li++; }
    const cx = x + 50 + measure(lines[li].slice(0, left), size);
    cur = `<rect x="${n(cx + 3)}" y="${n(y + 300 + li * lh - size * 0.8)}" width="3" height="${size}" fill="${P.ink}"/>`;
  }
  const win = `${windowChrome(x, y, w, h, { title: 'New Message' })}
    ${field('From', spec.from || 'me@mail.com', y + 110)}
    ${field('To', spec.to || 'everyone@mail.com', y + 168)}
    ${field('Subject', spec.subject || '(no subject)', y + 226, true)}
    ${qa('email body', typedLines(lines, x + 50, y + 300, lh, t, typeAt, cps, { size, font: 'hand' }) || '')}${cur}
    <path d="M${x + 30} ${y + h - 106} H${x + w - 30}" stroke="${C.line}" stroke-width="2"/>
    ${button}
    <path d="M${x + 270} ${y + h - 72} l-10 18 a10 10 0 0 0 16 10 l16 -26" stroke="${C.muted}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="${x + 310}" y="${y + h - 72}" width="28" height="30" rx="4" fill="none" stroke="${C.muted}" stroke-width="3"/>`;
  // swoosh: shrink and fly to the top right, with speed lines
  // by default the message stays on screen and SENT lands on it (an empty frame after the swoosh reads as a mistake);
  // fly: true sends it off to the top right instead, for a short shot that ends right after
  const sw = spec.fly ? ease.in(prog(t, sendAt + 0.2, 0.5)) : 0;
  const ccx = x + w / 2, ccy = y + h / 2;
  const flown = sw >= 1 ? '' : `<g opacity="${n(1 - sw * sw)}" transform="translate(${n(sw * 760)} ${n(-sw * 520)}) translate(${ccx} ${ccy}) rotate(${n(-10 * sw)}) scale(${n(1 - 0.75 * sw)}) translate(${-ccx} ${-ccy})">${win}</g>`;
  const streaks = sw > 0 && sw < 1 ? [0, 1, 2].map((i) => {
    const sx = ccx + sw * 760 - 260 - i * 50, sy = ccy - sw * 520 + 90 + i * 60;
    return `<path d="M${n(sx - 220 * (1 - sw * 0.5))} ${n(sy + 150)} L${n(sx)} ${n(sy)}" stroke="${C.muted}" stroke-width="${6 - i}" stroke-linecap="round" opacity="${n(0.6 * (1 - sw))}"/>`;
  }).join('') : '';
  const sentPop = popAt(t, sendAt + (spec.fly ? 0.6 : 0.25), 640, 360, `<rect x="490" y="318" width="300" height="84" rx="42" fill="${C.teal}" ${ink(3)}/>
    <path d="M532 362 l14 14 l28 -30" stroke="${P.paper}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${qa('sent', text('SENT', 670, 373, { size: 40, font: 'display', fill: P.paper, anchor: 'middle' }))}`, 0.22);
  const sent = spec.fly || !sentPop ? sentPop : `<g transform="translate(${x + w - 360 - 490} ${y + h - 84 - 318 - 14})">${sentPop}</g>`;
  return backdrop({ desk: false }) + rise(t, at, flown + streaks, { dy: 30 }) + sent;
}

// ---------- videoPage ----------
function videoPage(spec, t) {
  const at = spec.at ?? 0.2;
  const viewsAt = spec.viewsAt ?? at + 0.8;
  const x = 70, y = 28, w = 1140, h = 664;
  const vx = 100, vy = 112, vw = 740, vh = 416;
  const channel = spec.channel || 'Money Channel';
  const letters = spec.emblem || initials(channel);
  const playing = t >= at + 0.6;
  const zoom = 1 + 0.03 * clamp((t - at) / 6);
  const thumb = `<defs><clipPath id="vpClip"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="12"/></clipPath></defs>
    <g clip-path="url(#vpClip)"><g transform="translate(${vx + vw / 2} ${vy + vh / 2}) scale(${n(zoom)}) translate(${-vx - vw / 2} ${-vy - vh / 2})">
      <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${C.tvBlue}"/>
      <circle cx="${vx + 560}" cy="${vy + 170}" r="250" fill="#2b3d59"/>
      <path d="M${vx + 40} ${vy + 120} L${vx + 200} ${vy + 160} L${vx + 300} ${vy + 140} L${vx + 420} ${vy + 260} L${vx + 500} ${vy + 240} L${vx + 600} ${vy + 307}" stroke="${P.red}" stroke-width="14" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M14 0 L-26 -22 L-26 22 Z" transform="translate(${vx + 610} ${vy + 314}) rotate(33.7)" fill="${P.red}" stroke-linejoin="round"/>
      ${[0, 1, 2, 3].map((i) => `<ellipse cx="${vx + 150}" cy="${vy + 320 - i * 22}" rx="62" ry="18" fill="${P.gold}" ${ink(3)}/>`).join('')}
      ${emblem(vx + 120, vy + 92, 96, letters, { color: P.redDark, round: true })}
    </g></g>`;
  const playBtn = playing ? '' : `<circle cx="${vx + vw / 2}" cy="${vy + vh / 2}" r="54" fill="${P.ink}" opacity=".75"/><path d="M${vx + vw / 2 - 16} ${vy + vh / 2 - 26} l44 26 l-44 26 Z" fill="${P.paper}"/>`;
  const progress = clamp((spec.progress ?? 0.12) + Math.max(0, t - at) * 0.012);
  const len = spec.length || '12:08';
  const [lm, ls] = len.split(':').map(Number);
  const secs = Math.floor(((lm || 0) * 60 + (ls || 0)) * progress);
  const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const bar = `<rect x="${vx}" y="${vy + vh - 52}" width="${vw}" height="52" fill="${P.ink}" opacity=".55" clip-path="url(#vpClip)"/>
    <rect x="${vx + 20}" y="${vy + vh - 60}" width="${vw - 40}" height="8" rx="4" fill="${P.greyLight}" opacity=".6"/>
    <rect x="${vx + 20}" y="${vy + vh - 60}" width="${n((vw - 40) * progress)}" height="8" rx="4" fill="${P.red}"/>
    <circle cx="${n(vx + 20 + (vw - 40) * progress)}" cy="${vy + vh - 56}" r="10" fill="${P.red}" stroke="${P.paper}" stroke-width="2"/>
    ${playing ? `<rect x="${vx + 24}" y="${vy + vh - 38}" width="7" height="22" fill="${P.paper}"/><rect x="${vx + 37}" y="${vy + vh - 38}" width="7" height="22" fill="${P.paper}"/>`
      : `<path d="M${vx + 24} ${vy + vh - 38} l20 11 l-20 11 Z" fill="${P.paper}"/>`}
    ${text(`${elapsed} / ${len}`, vx + 62, vy + vh - 18, { size: 22, font: 'hand', fill: P.paper })}`;
  const title = String(spec.title || 'Untitled video');
  const tl = wrap(title, vw, 34, 'display').slice(0, 2);
  const tsize = tl.length > 1 ? 30 : 34;
  const titleSvg = qa('video title', wrap(title, vw, tsize, 'display').slice(0, 2).map((l, i) => text(l, vx, vy + vh + 44 + i * 36, { size: tsize, font: 'display' })).join(''));
  const rowY = vy + vh + (tl.length > 1 ? 112 : 92);
  const views = spec.views;
  const shownViews = typeof views === 'number' ? (t >= viewsAt ? commas(lerp(spec.viewsFrom || 0, views, ease.out(prog(t, viewsAt, 1.4)))) : commas(spec.viewsFrom || 0)) : String(views || '');
  const viewsTxt = `${shownViews} views`;
  const counting = typeof views === 'number' && t >= viewsAt && t < viewsAt + 1.4;
  const chRow = `${emblem(vx + 24, rowY - 8, 46, letters.slice(0, 2), { color: P.redDark, round: true })}
    ${qa('channel', text(channel, vx + 60, rowY + 2, { size: n(fitSize(channel, 230, 30)), font: 'hand' }))}
    <rect x="${vx + 300}" y="${rowY - 30}" width="150" height="44" rx="22" fill="${P.ink}"/>
    ${text('SUBSCRIBE', vx + 375, rowY + 0, { size: 22, font: 'display', fill: P.paper, anchor: 'middle' })}
    ${qa('views', text(viewsTxt, vx + vw, rowY + 4, { size: n(fitSize(viewsTxt, 270, 34, 'display')), font: 'display', anchor: 'end', fill: counting ? P.greenDark : P.ink }))}`;
  const side = [0, 1, 2, 3].map((i) => {
    const sy = vy + 40 + i * 118;
    return `<rect x="866" y="${sy}" width="150" height="86" rx="8" fill="${[C.tealLight, '#e3e5e0', C.tealLight, '#e3e5e0'][i]}" ${ink(2)}/>
      <rect x="1030" y="${sy + 10}" width="150" height="14" rx="7" fill="${C.line}"/><rect x="1030" y="${sy + 34}" width="110" height="14" rx="7" fill="${C.line}"/>
      <rect x="1030" y="${sy + 60}" width="80" height="12" rx="6" fill="${C.line}" opacity=".7"/>`;
  }).join('');
  const page = `${windowChrome(x, y, w, h, { bar: 62 })}
    <rect x="${x + 150}" y="${y + 12}" width="${w - 300}" height="38" rx="19" fill="${C.card}" ${ink(2)}/>
    ${text('videos.example/watch', x + 176, y + 39, { size: 22, font: 'hand', fill: C.muted })}
    ${thumb}${playBtn}${bar}
    <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="12" fill="none" ${ink(3)}/>
    ${titleSvg}${chRow}
    ${text('Up next', 866, vy + 24, { size: 24, font: 'hand', fill: C.muted })}${side}`;
  return backdrop({ desk: false }) + rise(t, at, page, { dy: 24 });
}

// ---------- cctv ----------
function tickClock(str, add) {
  const m = String(str).match(/(\d{1,2}):(\d{2}):(\d{2})\s*$/);
  if (!m) return String(str);
  let s = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + add;
  s %= 86400;
  const p2 = (v) => String(v).padStart(2, '0');
  return str.slice(0, m.index) + `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}

function cctvHallway() {
  const vx = 640, vy = 320; // vanishing point
  const bw = { x0: 520, x1: 760, y0: 230, y1: 430 }; // back wall
  const persp = (fx, fy, k) => [lerp(fx, vx, k), lerp(fy, vy, k)];
  const tiles = [];
  for (let i = -6; i <= 6; i++) tiles.push(`<path d="M${n(640 + i * 230)} 720 L${n(lerp(bw.x0, bw.x1, (i + 6) / 12))} ${bw.y1}" stroke="#55595a" stroke-width="2"/>`);
  [0.12, 0.3, 0.48, 0.64, 0.78].forEach((k) => { const y = lerp(720, bw.y1, k); const xl = lerp(0, bw.x0, k), xr = lerp(1280, bw.x1, k); tiles.push(`<path d="M${n(xl)} ${n(y)} H${n(xr)}" stroke="#55595a" stroke-width="2"/>`); });
  const lights = [0.15, 0.45, 0.7].map((k) => {
    const a = persp(470, 0, k), b = persp(810, 0, k), c = persp(810, 0, k + 0.12), d = persp(470, 0, k + 0.12);
    return `<path d="M${n(a[0])} ${n(Math.max(a[1], 8))} L${n(b[0])} ${n(Math.max(b[1], 8))} L${n(c[0])} ${n(c[1])} L${n(d[0])} ${n(d[1])} Z" fill="#e9ebe6" stroke="#7d8180" stroke-width="2"/>`;
  }).join('');
  const sideDoor = (side, k0, k1) => {
    const xA = side < 0 ? lerp(0, bw.x0, k0) : lerp(1280, bw.x1, k0), xB = side < 0 ? lerp(0, bw.x0, k1) : lerp(1280, bw.x1, k1);
    const topA = lerp(110, bw.y0 + 40, k0), topB = lerp(110, bw.y0 + 40, k1);
    const botA = lerp(720, bw.y1, k0), botB = lerp(720, bw.y1, k1);
    return `<path d="M${n(xA)} ${n(topA)} L${n(xB)} ${n(topB)} L${n(xB)} ${n(botB)} L${n(xA)} ${n(botA)} Z" fill="#6f7372" stroke="#3e4142" stroke-width="3"/>
      <circle cx="${n(lerp(xA, xB, 0.8))}" cy="${n(lerp((topA + botA) / 2, (topB + botB) / 2, 0.8))}" r="${n(lerp(8, 4, k0))}" fill="#c9cccb"/>`;
  };
  return `<rect width="1280" height="720" fill="#8f9392"/>
    <path d="M0 0 H1280 L${bw.x1} ${bw.y0} H${bw.x0} Z" fill="#b5b8b6"/>
    <path d="M0 0 L${bw.x0} ${bw.y0} V${bw.y1} L0 720 Z" fill="#9a9e9c"/>
    <path d="M1280 0 L${bw.x1} ${bw.y0} V${bw.y1} L1280 720 Z" fill="#8a8e8d"/>
    <path d="M0 720 L${bw.x0} ${bw.y1} H${bw.x1} L1280 720 Z" fill="#6c706f"/>
    <defs><clipPath id="cctvFloor"><path d="M0 720 L${bw.x0} ${bw.y1} H${bw.x1} L1280 720 Z"/></clipPath></defs>
    <g clip-path="url(#cctvFloor)">${tiles.join('')}</g>${lights}
    <rect x="${bw.x0}" y="${bw.y0}" width="${bw.x1 - bw.x0}" height="${bw.y1 - bw.y0}" fill="#a9acaa" stroke="#555958" stroke-width="2"/>
    <rect x="596" y="282" width="88" height="148" fill="#3f4243" stroke="#2c2e2f" stroke-width="4"/>
    <rect x="602" y="288" width="76" height="142" fill="#56595a"/>
    <rect x="610" y="252" width="60" height="22" fill="#d9dcda" stroke="#555958" stroke-width="2"/>
    ${text('EXIT', 640, 270, { size: 18, font: 'display', fill: '#3f4243', anchor: 'middle' })}
    ${sideDoor(-1, 0.18, 0.36)}${sideDoor(-1, 0.6, 0.72)}${sideDoor(1, 0.3, 0.48)}
    <path d="M0 640 L${bw.x0} ${bw.y1 - 8}" stroke="#7a7e7d" stroke-width="6"/><path d="M1280 640 L${bw.x1} ${bw.y1 - 8}" stroke="#727675" stroke-width="6"/>`;
}

function cctvDoorway() {
  const bricks = [];
  for (let r = 0; r < 16; r++) for (let c = -1; c < 22; c++) bricks.push(`<rect x="${c * 64 + (r % 2) * 32}" y="${r * 32}" width="62" height="30" fill="${(r * 7 + c * 3) % 5 ? '#8d9190' : '#858988'}"/>`);
  return `<rect width="1280" height="720" fill="#6d7170"/>${bricks.join('')}
    <rect y="510" width="1280" height="210" fill="#6a6e6d"/><path d="M0 510 H1280" stroke="#4c4f50" stroke-width="4"/>
    <rect x="470" y="470" width="340" height="44" fill="#9da09e" stroke="#4c4f50" stroke-width="3"/>
    <rect x="500" y="120" width="280" height="352" fill="#5b5e5f" stroke="#2f3132" stroke-width="6"/>
    <rect x="516" y="136" width="248" height="336" fill="#4a4d4e"/>
    <rect x="546" y="168" width="188" height="120" fill="#55585a" stroke="#3a3c3d" stroke-width="3"/>
    <rect x="546" y="314" width="188" height="130" fill="#55585a" stroke="#3a3c3d" stroke-width="3"/>
    <circle cx="738" cy="320" r="9" fill="#c9cccb"/>
    <rect x="590" y="72" width="100" height="34" fill="#c4c7c5" stroke="#4c4f50" stroke-width="2"/>
    ${text('12', 640, 98, { size: 26, font: 'display', fill: '#3f4243', anchor: 'middle' })}
    <rect x="846" y="190" width="30" height="50" rx="6" fill="#c7cac8" stroke="#3a3c3d" stroke-width="3"/>
    <path d="M846 240 L760 520 H1000 L876 240 Z" fill="#fff" opacity=".1"/>
    <rect x="530" y="540" width="220" height="44" rx="6" fill="#585b5c"/>`;
}

function cctv(spec, t) {
  const at = spec.at ?? 0.1;
  const seed = Math.floor(t * 12) % 30;
  const scene = spec.scene === 'doorway' ? cctvDoorway() : cctvHallway();
  const live = Math.max(0, t - at);
  const burst = t < at ? 1 : clamp(1 - (t - at) / 0.25);
  const band = (t * 90) % 820 - 100;
  const frameStr = spec.frame == null ? '' : typeof spec.frame === 'number' ? `FRAME ${spec.frame}/${spec.frames || spec.frame}` : `FRAME ${String(spec.frame).replace(/^FRAME\s*/i, '')}`;
  const time = tickClock(spec.time || '07/24/2026 02:14:07', Math.floor(live));
  const osd = (s, x, y, anchor = 'start', name = s) => qa(name, text(s, x, y, { size: 30, font: 'type', fill: C.cctvText, anchor }));
  const rec = Math.floor(t * 1.6) % 2 === 0;
  return `<defs>
      <filter id="cctvGray"><feColorMatrix type="saturate" values="0"/></filter>
      <filter id="cctvNoise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <pattern id="cctvScan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity=".16"/></pattern>
      <radialGradient id="cctvVig" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <filter id="cctvSoft"><feGaussianBlur stdDeviation="1.1"/></filter>
    </defs>
    <g filter="url(#cctvGray)"><g filter="url(#cctvSoft)">${scene}</g></g>
    <rect width="1280" height="720" filter="url(#cctvNoise)" opacity="${n(0.2 + 0.7 * burst)}"/>
    <rect y="${n(band)}" width="1280" height="70" fill="#fff" opacity=".06"/>
    <rect width="1280" height="720" fill="url(#cctvScan)"/>
    <rect width="1280" height="720" fill="url(#cctvVig)"/>
    <g opacity="${n(1 - burst * 0.7)}">
      ${rec ? `<circle cx="52" cy="54" r="11" fill="${P.red}"/>` : ''}
      ${osd('REC', 74, 64)}
      ${osd(spec.label || 'CAM 03 · HALLWAY', 160, 64, 'start', 'cctv label')}
      ${osd(time, 1240, 64, 'end', 'cctv time')}
      ${frameStr ? osd(frameStr, 1240, 686, 'end', 'cctv frame') : ''}
      <path d="M30 100 V30 H100 M1180 30 H1250 V100 M30 620 V690 H100 M1250 620 V690 H1180" stroke="${C.cctvText}" stroke-width="3" fill="none" opacity=".7"/>
    </g>`;
}

// ---------- radar ----------
function radar(spec, t) {
  const at = spec.at ?? 0.2;
  const cx = 640, cy = 330, R = 250;
  const period = spec.period ?? 2.6;
  const on = clamp((t - at) * 4);
  const sweeping = t >= at;
  const th = sweeping ? (((t - at) / period) * Math.PI * 2) % (Math.PI * 2) : 0; // 0 = up, clockwise
  const ring = !!spec.ring;
  const rIn = ring ? R * (spec.inner ?? 0.55) : 0;
  const polar = (a, r) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
  const wedge = (a0, a1, r0, r1) => {
    const p1 = polar(a0, r1), p2 = polar(a1, r1);
    if (r0 <= 0) return `M${cx} ${cy} L${n(p1[0])} ${n(p1[1])} A${r1} ${r1} 0 0 1 ${n(p2[0])} ${n(p2[1])} Z`;
    const q1 = polar(a1, r0), q2 = polar(a0, r0);
    return `M${n(p1[0])} ${n(p1[1])} A${r1} ${r1} 0 0 1 ${n(p2[0])} ${n(p2[1])} L${n(q1[0])} ${n(q1[1])} A${r0} ${r0} 0 0 0 ${n(q2[0])} ${n(q2[1])} Z`;
  };
  const trail = sweeping ? Array.from({ length: 16 }, (_, i) => {
    const a1 = th - i * 0.05, a0 = a1 - 0.05;
    return `<path d="${wedge(a0, a1, rIn, R)}" fill="${C.radarLine}" opacity="${n(0.42 * (1 - i / 16))}"/>`;
  }).join('') : '';
  const sp0 = polar(th, rIn), sp1 = polar(th, R);
  const sweepLine = sweeping ? `<path d="M${n(sp0[0])} ${n(sp0[1])} L${n(sp1[0])} ${n(sp1[1])}" stroke="${C.radarBright}" stroke-width="4" stroke-linecap="round"/>` : '';
  const grid = [0.25, 0.5, 0.75, 1].map((k) => `<circle cx="${cx}" cy="${cy}" r="${R * k}" fill="none" stroke="${C.radarLine}" stroke-width="2" opacity=".45"/>`).join('')
    + `<path d="M${cx - R} ${cy} H${cx + R} M${cx} ${cy - R} V${cy + R}" stroke="${C.radarLine}" stroke-width="2" opacity=".35"/>`
    + Array.from({ length: 36 }, (_, i) => { const a = (i * Math.PI) / 18; const p = polar(a, R), q = polar(a, R - (i % 3 ? 8 : 16)); return `<path d="M${n(p[0])} ${n(p[1])} L${n(q[0])} ${n(q[1])}" stroke="${C.radarLine}" stroke-width="2" opacity=".6"/>`; }).join('');
  const hole = ring ? `<circle cx="${cx}" cy="${cy}" r="${n(rIn)}" fill="${C.radarDeep}"/>
      <circle cx="${cx}" cy="${cy}" r="${n(rIn)}" fill="none" stroke="${C.radarLine}" stroke-width="3" stroke-dasharray="10 9" opacity=".8"/>
      ${qa('radar hole', text(spec.innerLabel || 'NO COVERAGE', cx, cy + 10, { size: n(fitSize(spec.innerLabel || 'NO COVERAGE', rIn * 1.6, 30)), font: 'hand', fill: C.radarLine, anchor: 'middle', spacing: 1 }))}` : '';
  const blips = (spec.blips || []).map((b, i) => {
    const ba = b.at ?? at;
    if (t < ba) return '';
    let a, d;
    if (b.angle != null) { a = (b.angle * Math.PI) / 180; d = b.dist ?? 0.6; } else { a = Math.atan2(b.x ?? 0, -(b.y ?? 0)); d = Math.hypot(b.x ?? 0, b.y ?? 0); }
    d = clamp(d, 0, 0.97);
    const [bx, by] = polar(a, d * R);
    const seen = !ring || d * R >= rIn;
    if (!seen) return b.ghost ? `<circle cx="${n(bx)}" cy="${n(by)}" r="12" fill="none" stroke="${C.radarLine}" stroke-width="2" stroke-dasharray="4 4" opacity=".55"/>` : '';
    // brightness: 1 just after the sweep passes, fading over one turn; dimly visible otherwise
    const since = (((th - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const passed = (t - at) / period * Math.PI * 2 >= (((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
    const br = sweeping && passed ? Math.max(0.25, 1 - (since / (Math.PI * 2)) * 1.1) : 0;
    if (br <= 0) return '';
    return `<g opacity="${n(br)}"><circle cx="${n(bx)}" cy="${n(by)}" r="16" fill="${C.radarBright}" opacity=".35" filter="url(#glow)"/>
      <circle cx="${n(bx)}" cy="${n(by)}" r="9" fill="${C.radarBright}"/>
      ${b.label ? qa(`blip ${i}`, text(b.label, bx + 18, by - 12, { size: 26, font: 'hand', fill: C.radarBright })) : ''}</g>`;
  }).join('');
  const label = spec.label ? (() => {
    const lw = Math.min(520, measure(spec.label, 28, 'hand') + 60);
    return `<rect x="${n(cx - lw / 2)}" y="${cy + R + 34}" width="${n(lw)}" height="46" rx="8" fill="${P.paperDim}" ${ink(2.5)}/>
      ${qa('radar label', text(spec.label, cx, cy + R + 66, { size: n(fitSize(spec.label, lw - 30, 28)), font: 'hand', anchor: 'middle' }))}`;
  })() : '';
  const scope = `<defs><clipPath id="radarClip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>
    <circle cx="${cx}" cy="${cy}" r="${R + 18}" fill="${P.greyDark}" ${ink(4)}/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.radar}" ${ink(3)}/>
    <g opacity="${n(on)}" clip-path="url(#radarClip)">
      ${ring ? `<path d="${wedge(0, Math.PI * 2 - 1e-3, rIn, R)}" fill="${C.radarLine}" opacity=".08"/>` : ''}
      ${grid}${trail}${hole}${sweepLine}${blips}
    </g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" ${ink(3)}/>`;
  const console_ = `<g filter="url(#softShadow)"><rect x="300" y="30" width="680" height="${R * 2 + 140}" rx="36" fill="${P.charcoal}" ${ink(4)}/></g>
    ${[[350, 640], [930, 640]].map(([kx, ky]) => `<circle cx="${kx}" cy="${ky}" r="22" fill="${P.greyDark}" ${ink(3)}/><path d="M${kx} ${ky} L${kx + 10} ${ky - 16}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`).join('')}
    ${[0, 1, 2].map((i) => `<circle cx="${350}" cy="${90 + i * 40}" r="8" fill="${i === 0 ? C.radarLine : P.greyDark}" ${ink(2)}/>`).join('')}`;
  return backdrop() + console_ + scope + label;
}

module.exports = { measure, socialPost, phoneNotification, browserArticle, appPage, newsLive, terminal, chatThread, email, videoPage, cctv, radar, emblem, avatar, SCREEN_COLORS: C };
