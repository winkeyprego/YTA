// On-screen graphics: date tags, name plates, stickers, speech bubbles, index cards,
// stamps, arrows and title cards. Each takes the shot time `t` and an appear time `at`
// and handles its own entrance animation, so shots only decide WHEN, never HOW.

const P = require('./palette');
const { n, text, textWidth, esc } = require('./svg');
const { pop, typed, tween, ease, clamp, prog } = require('./motion');

const popAround = (cx, cy, p, inner, rot = 0) =>
  p.on ? `<g opacity="${n(p.o)}" transform="translate(${n(cx)} ${n(cy)}) rotate(${n(rot)}) scale(${n(p.s)}) translate(${n(-cx)} ${n(-cy)})">${inner}</g>` : '';

// Taped paper tag, top-left. Slides in over 0.08s, then the text types at ~30 cps (measured).
// Use for place + date on every new location or time.
function dateTag(label, t, at = 0.1, { x = 26, y = 22, rot = -1.2, size = 25 } = {}) {
  if (t < at) return '';
  const w = textWidth(label, size) + 44;
  const shown = typed(label, t, at + 0.08, 30);
  const sx = tween(t, at, 0.08, -w - 40, x, ease.out);
  return `<g transform="translate(${n(sx)} ${y}) rotate(${rot})" filter="url(#shadow)">
    <rect width="${n(w)}" height="48" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>
    <rect x="-12" y="-8" width="40" height="18" fill="${P.tape}" opacity=".85" transform="rotate(-24 8 1)"/>
    ${text(shown, 20, 34, { size, font: 'hand' })}
  </g>`;
}

// Lower-third name plate. Slides in from the left in ~0.35s (measured).
function namePlate(name, role, t, at = 0.5, { y = 592 } = {}) {
  if (t < at) return '';
  const w = Math.max(textWidth(name, 34), textWidth(role, 20)) + 60;
  const x = tween(t, at, 0.35, -w - 20, 40, ease.out);
  return `<g transform="translate(${n(x)} ${y})" filter="url(#shadow)">
    <rect width="${n(w)}" height="84" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>
    <rect width="10" height="84" fill="${P.red}"/>
    ${text(name, 26, 40, { size: 34, font: 'hand' })}
    <path d="M26 50 H${n(w - 30)}" stroke="${P.red}" stroke-width="2.5"/>
    ${text(role, 26, 74, { size: 20, font: 'hand', fill: P.inkSoft })}
  </g>`;
}

// Pop-in paper sticker. The main way the narration's key words land on screen.
// Hand-lettered caps like the references. Stagger several stickers 0.7-1s apart.
function sticker(label, x, y, t, at, { rot = -3, size = 32, color = P.red, fill = P.paper, font = 'hand' } = {}) {
  const w = textWidth(label, size, font) + 36;
  const h = size + 24;
  const inner = `<g filter="url(#shadow)"><rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${h}" fill="${fill}" stroke="${color}" stroke-width="3"/>
    ${text(label, x, y + size * 0.36, { size, font, fill: color, anchor: 'middle' })}</g>`;
  return popAround(x, y, pop(t, at), inner, rot);
}

// Speech bubble: pops from its tail, then types at 16-20 cps (measured; sync to the VO line).
// Stays until the cut. Returns { svg, end } (end = when typing finishes).
function bubble({ x, y, w, lines, tail, size = 27, cps = 18 }, t, at) {
  const lineH = size * 1.28;
  const h = lines.length * lineH + 34;
  const p = pop(t, at, 0.18);
  const full = lines.join('\n');
  const end = at + 0.2 + full.length / cps;
  if (!p.on) return { svg: '', end };
  const [tx, ty] = tail;
  const below = ty > y + h;
  const baseY = below ? y + h : y;
  const bx = clamp(tx, x + 50, x + w - 50);
  const tailPath = `M${n(bx - 26)} ${n(baseY)} L${n(tx)} ${n(ty)} L${n(bx + 14)} ${n(baseY)} Z`;
  let remaining = typed(full, t, at + 0.2, cps).length;
  const textLines = lines.map((ln, i) => {
    const show = ln.slice(0, Math.max(0, remaining));
    remaining -= ln.length + 1;
    return text(show, x + 26, y + 22 + size * 0.95 + i * lineH, { size, font: 'hand' });
  }).join('');
  const shape = `<g filter="url(#shadow)">
      <path d="${tailPath}" fill="${P.bubble}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="${x}" y="${y}" width="${w}" height="${n(h)}" rx="${n(Math.min(40, h / 2))}" fill="${P.bubble}" stroke="${P.ink}" stroke-width="4"/>
    </g>
    <path d="M${n(bx - 22)} ${n(baseY + (below ? -3 : 3))} L${n(bx + 10)} ${n(baseY + (below ? -3 : 3))}" stroke="${P.bubble}" stroke-width="7"/>`;
  return { svg: popAround(tx, ty, p, shape + textLines), end };
}

// Index card (evidence, timeline stops). Pops in.
function indexCard({ x, y, w = 230, h = 130, title, lines = [], rot = 0, accent = P.red }, t, at) {
  const inner = `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>
    <path d="M${x} ${y + 40} H${x + w}" stroke="${accent}" stroke-width="2"/>
    ${[1, 2, 3].map((i) => `<path d="M${x + 12} ${y + 40 + i * 26} H${x + w - 12}" stroke="${P.paperShade}" stroke-width="1.5"/>`).join('')}
    ${text(title, x + 14, y + 30, { size: 24, font: 'display', fill: accent })}
    ${lines.map((ln, i) => text(ln, x + 14, y + 64 + i * 26, { size: 22, font: 'hand' })).join('')}
  </g>`;
  return popAround(x + w / 2, y + h / 2, pop(t, at), inner, rot);
}

// Rubber stamp that slams down (scale 1.8 -> 1 with a quick settle).
function stamp(label, x, y, t, at, { rot = -8, size = 44, color = P.red } = {}) {
  if (t < at) return '';
  const k = prog(t, at, 0.18);
  const s = 1.8 - 0.8 * ease.out(k);
  const o = clamp(k * 2) * 0.92;
  const w = textWidth(label, size, 'display') + 44;
  const h = size + 30;
  return `<g opacity="${n(o)}" transform="translate(${x} ${y}) rotate(${rot}) scale(${n(s)})">
    <rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${h}" rx="6" fill="none" stroke="${color}" stroke-width="6"/>
    <rect x="${n(-w / 2 + 7)}" y="${n(-h / 2 + 7)}" width="${n(w - 14)}" height="${h - 14}" rx="3" fill="none" stroke="${color}" stroke-width="2"/>
    ${text(label, 0, size * 0.36, { size, font: 'display', fill: color, anchor: 'middle' })}
  </g>`;
}

// Big overlay number + caption, like "3,000,000+ / GERMAN SOLDIERS". 10-16% of frame height.
function bigStat(value, caption, x, y, t, at, { size = 84, color = P.gold, capColor = P.paper, anchor = 'start' } = {}) {
  if (t < at) return '';
  const k = ease.out(prog(t, at, 0.4));
  return `<g opacity="${n(k)}" transform="translate(0 ${n((1 - k) * 18)})">
    ${text(value, x, y, { size, font: 'display', fill: color, anchor })}
    ${caption ? text(caption, x + (anchor === 'middle' ? 0 : 4), y + size * 0.55, { size: size * 0.4, font: 'display', fill: capColor, anchor, spacing: 1 }) : ''}
  </g>`;
}

// Highlighter swipe behind a line of text (documents). Draws left to right.
function highlight(x, y, w, t, at, { dur = 0.4, color = P.gold, h = 26 } = {}) {
  const k = ease.inOut(prog(t, at, dur));
  if (k <= 0) return '';
  return `<rect x="${x}" y="${y - h + 6}" width="${n(w * k)}" height="${h}" fill="${color}" opacity=".55"/>`;
}

// Red pencil circle drawn around something.
function pencilCircle(cx, cy, rx, ry, t, at, { dur = 0.45, color = P.red } = {}) {
  const k = ease.inOut(prog(t, at, dur));
  if (k <= 0) return '';
  const len = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.08;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"
    stroke-dasharray="${n(len)}" stroke-dashoffset="${n(len * (1 - k))}" transform="rotate(-6 ${cx} ${cy})"/>`;
}

// Thick map/diagram arrow that grows from start to end over 0.6-1s. Stagger arrows ~0.8s apart.
function arrow(x1, y1, x2, y2, t, at, { dur = 0.8, color = P.red, width = 16, label } = {}) {
  const k = ease.inOut(prog(t, at, dur));
  if (k <= 0) return '';
  const ex = x1 + (x2 - x1) * k, ey = y1 + (y2 - y1) * k;
  const ang = (Math.atan2(ey - y1, ex - x1) * 180) / Math.PI;
  return `<g filter="url(#shadow)">
    <path d="M${n(x1)} ${n(y1)} L${n(ex)} ${n(ey)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
    <path d="M0 0 L-30 -22 L-30 22 Z" fill="${color}" transform="translate(${n(ex)} ${n(ey)}) rotate(${n(ang)})"/>
    ${label && k > 0.6 ? text(label, (x1 + x2) / 2, (y1 + y2) / 2 - 22, { size: 26, font: 'display', fill: color, anchor: 'middle' }) : ''}
  </g>`;
}

// Episode title card: dark band, two lines, highlighted words in gold, red underline.
// lines = [[['WHY THE ', false], ['2008 CRASH', true]], [['WAS COMPLETELY AVOIDABLE', false]]]
function titleCard(lines, t, at, { y = 250, size = 64 } = {}) {
  if (t < at) return '';
  const k = ease.out(prog(t, at, 0.5));
  const bandH = lines.length * size * 1.18 + 70;
  // tspans let the browser lay out mixed colours, so spacing is exact
  const rows = lines.map((segs, i) => {
    const ly = y + 70 + i * size * 1.18;
    const spans = segs.map(([str, hl]) => `<tspan fill="${hl ? P.gold : P.paper}">${esc(str)}</tspan>`).join('');
    return `<text x="640" y="${n(ly)}" class="t-display" font-size="${size}" text-anchor="middle" xml:space="preserve">${spans}</text>`;
  }).join('');
  const lineK = ease.inOut(prog(t, at + 0.45, 0.5));
  return `<g opacity="${n(k)}">
    <rect x="0" y="${n(y - 10 + (1 - k) * 30)}" width="1280" height="${n(bandH)}" fill="${P.board}" opacity=".94"/>
    <g transform="translate(0 ${n((1 - k) * 30)})">${rows}
      <path d="M${n(640 - 300 * lineK)} ${n(y + bandH - 34)} H${n(640 + 300 * lineK)}" stroke="${P.red}" stroke-width="6" stroke-linecap="round"/>
    </g>
  </g>`;
}

// Chapter / time-jump card: black, serif small caps, held 2.0s; fades in over 0.4s, hard cut out.
// Give the shot dur 2.0 and call with at = 0.
function chapterCard(label, sub, t, at = 0) {
  const k = ease.out(prog(t, at, 0.4));
  return `<rect width="1280" height="720" fill="#0d0d0e"/>
    <g opacity="${n(k)}">
      ${text(label, 640, 360, { size: 54, font: 'serif', fill: P.paper, anchor: 'middle', spacing: 3 })}
      ${sub ? text(sub, 640, 410, { size: 26, font: 'serif', fill: P.paperShade, anchor: 'middle', spacing: 2 }) : ''}
    </g>`;
}

module.exports = { chapterCard, dateTag, namePlate, sticker, bubble, indexCard, stamp, bigStat, highlight, pencilCircle, arrow, titleCard, popAround, esc };
