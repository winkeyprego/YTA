// Shot templates: turn one plain-data entry of shots.json into a renderable shot.
// A template gets (shot, ctx) and returns render(t) -> SVG. ctx = { dur, cue, cast }:
//   cue('word') -> local seconds when that word is spoken (or a number of seconds), see lib/timing.js
//
// Templates: talk, versus, document, chart, stat, fuse, map, money, title, chapter.
// Every template also accepts the common overlay fields (see `overlays` below):
//   tag, plate, stickers, stat, source, camera.
// Shot-list reference with examples: SHOTS.md.

const P = require('./palette');
const { g, tr, text, camera: cam, W, H, n } = require('./svg');
const M = require('./motion');
const { character, CAST } = require('./characters');
const props = require('./props');
const ui = require('./ui');
const dev = require('./devices');

const lazy = (name) => { try { return require(name); } catch (e) { return null; } };
const sets = () => (lazy('./sets') || {}).SETS || {};

// ---------- presets ----------
const MOODS = {
  neutral: { eyes: 'dot', brows: 'flat', mouth: 'neutral' },
  confident: { eyes: 'dot', brows: 'flat', mouth: 'smile' },
  smug: { eyes: 'smug', brows: 'smug', mouth: 'smirk' },
  happy: { eyes: 'happy', brows: 'raised', mouth: 'smile' },
  excited: { eyes: 'wide', brows: 'raised', mouth: 'grin' },
  worried: { eyes: 'dot', brows: 'worried', mouth: 'frown' },
  sad: { eyes: 'sad', brows: 'worried', mouth: 'frown' },
  angry: { eyes: 'dot', brows: 'angry', mouth: 'flat' },
  shocked: { eyes: 'wide', brows: 'raised', mouth: 'o' },
  sleepy: { eyes: 'closed', brows: 'flat', mouth: 'flat' },
};

// [shoulderAngle, elbowBend] for the screen-left arm (L) and screen-right arm (R).
const IDLE = [10, -6];
const POSES = {
  idle: { L: IDLE, R: IDLE },
  pointLeft: { L: [115, 10], R: [12, -8] },
  pointRight: { L: [12, -8], R: [115, 10] },
  pointUp: { L: [12, -8], R: [165, 5] },
  present: { L: [12, -8], R: [75, -35] },
  presentLeft: { L: [75, -35], R: [12, -8] },
  shrug: { L: [62, -105], R: [62, -105] },
  armsUp: { L: [150, 12], R: [150, 12] },
  hips: { L: [38, -125], R: [38, -125] },
  think: { L: [12, -8], R: [28, -150] },
  wave: { L: [12, -8], R: [150, -40] },
};

const STICKER_COLORS = { red: P.red, ink: P.ink, gold: P.goldDark, green: P.greenDark, blue: P.blue };

const resolveCast = (who, ctx) => {
  const c = (ctx.cast && ctx.cast[who]) || who;
  if (typeof c === 'string') return CAST[c] || CAST.banker;
  const base = c.base ? CAST[c.base] || {} : {};
  return { ...base, ...c };
};

// ---------- common pieces ----------
function cameraZoom(spec, t, ctx, base = 1) {
  const c = typeof spec === 'string' ? { mode: spec } : spec || { mode: 'locked' };
  switch (c.mode) {
    case 'creep': return M.creep(t, c.rate || 0.011, base);
    case 'punch': return M.punch(t, ctx.cue(c.on, c.at ?? Math.max(0.6, ctx.dur * 0.45)), { rate: c.rate || 0.045, dur: c.dur || 2, from: base });
    case 'push': return M.punch(t, ctx.cue(c.on, c.at ?? Math.max(0.6, ctx.dur * 0.5)), { rate: c.rate || 0.08, dur: c.dur || 2.5, from: base });
    case 'steps': return M.steps(t, { from: base });
    default: return base * (c.zoom || 1);
  }
}

// Sticker slots used when a sticker has no x/y: a column on the free side of the frame.
// Sets whose busy areas collide with the default columns get their own safe zones.
const SET_ZONES = {
  studioNews: { left: [1000, 470], right: [1000, 470] }, // keep clear of the TV screen and headline
  streetDay: { left: [300, 560], right: [980, 560] },     // below the shop signs
  bankExterior: { left: [240, 470], right: [1040, 470] },
};
function stickerXY(i, side, setName) {
  const z = SET_ZONES[setName];
  const [x, y0] = (z && z[side]) || [side === 'right' ? 980 : 300, 400];
  return [x, y0 + i * 84];
}

// Overlays shared by all templates. Fields:
//   tag: 'NEW YORK · 2006' | { text, at }
//   plate: { name, role, on }
//   stickers: [{ text, on | at, x, y, rot, size, color: red|ink|gold|green|blue, font: hand|display }]
//   stat: { value, caption, on, x, y }
//   source: 'small source line, bottom-right'
function overlays(shot, t, ctx, { side = 'left', skipStickers = false } = {}) {
  ctx = { ...ctx, setName: shot.set };
  let out = '';
  if (shot.stat) {
    const s = shot.stat;
    out += ui.bigStat(s.value, s.caption, s.x ?? 64, s.y ?? 300, t, ctx.cue(s.on, s.at ?? 0.4), { size: s.size || 84 });
  }
  if (!skipStickers) out += stickersSvg(shot.stickers, t, ctx, side);
  if (shot.tag) {
    const tg = typeof shot.tag === 'string' ? { text: shot.tag } : shot.tag;
    out += ui.dateTag(tg.text, t, ctx.cue(tg.on, tg.at ?? 0.1));
  }
  if (shot.plate) out += ui.namePlate(shot.plate.name, shot.plate.role || '', t, ctx.cue(shot.plate.on, shot.plate.at ?? 0.5));
  if (shot.source) out += text(shot.source, 1250, 702, { size: 17, anchor: 'end', fill: P.paper, opacity: 0.75 });
  return out;
}

function stickersSvg(list, t, ctx, side = 'left') {
  return (list || []).map((s, i) => {
    const [ax, ay] = stickerXY(i, side, ctx.setName);
    return ui.sticker(s.text, s.x ?? ax, s.y ?? ay, t, ctx.cue(s.on, s.at ?? 0.6 + i * 0.9), {
      rot: s.rot ?? (i % 2 ? 2 : -3),
      size: s.size || 34,
      color: STICKER_COLORS[s.color] || s.color || P.red,
      font: s.font || 'hand',
    });
  }).join('');
}

// Character state for this frame.
function actor(c, t, ctx, { talkFrom, talkTo } = {}) {
  const mood = MOODS[c.mood] || MOODS.neutral;
  const pose = POSES[c.pose] || POSES.idle;
  const pose2 = c.pose2 ? POSES[c.pose2] || POSES.idle : null;
  const at = ctx.cue(c.poseOn, c.poseAt ?? 0.5);
  const at2 = pose2 ? ctx.cue(c.pose2On, c.pose2At ?? at + 1.8) : 1e9;
  const arm = (side) => {
    let v = M.keys(t, [[at, IDLE], [at + 0.3, pose[side]]]);
    if (pose2) v = t < at2 ? v : M.keys(t, [[at2, pose[side]], [at2 + 0.3, pose2[side]]]);
    return v;
  };
  const mood2 = c.mood2 && t >= ctx.cue(c.mood2On, c.mood2At ?? ctx.dur / 2) ? MOODS[c.mood2] || mood : mood;
  const talkMouth = talkFrom != null ? M.mouthCycle(t, talkFrom, talkTo) : null;
  return {
    ...mood2,
    mouth: talkMouth || mood2.mouth,
    armL: arm('L'),
    armR: arm('R'),
    look: c.look || 0,
    tilt: c.tilt || 0,
    holding: c.holding,
    carry: c.carry,
    walk: c.walk ? t * 9 : null,
    breathe: M.breathe(t, (c.seed || 0) + 1),
  };
}

// Wrap long text into lines of about `max` characters.
function wrap(str, max = 24) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// Screen position of a world point under camera(zoom, fx, fy, x, y).
const toScreen = (px, py, c) => [(px - c.fx) * c.zoom + c.fx + (c.x || 0), (py - c.fy) * c.zoom + c.fy + (c.y || 0)];

// ---------- talk: characters on a set, optionally one of them speaking a line ----------
// { template: 'talk', set, setOpts, frame: 'wide'|'close', focus: who, chars: [{ who, spot, mood, pose, poseOn,
//   mood2, mood2On, pose2, pose2On, holding, carry, walk }], speaker, line, lineOn, speaking: true }
function talk(shot, ctx) {
  const set = sets()[shot.set || 'office'];
  if (!set) throw new Error(`unknown set "${shot.set}" (see lib/sets.js)`);
  const chars = shot.chars || [];
  const speaker = chars.find((c) => c.who === shot.speaker) || null;
  const focusChar = chars.find((c) => c.who === (shot.focus || shot.speaker)) || chars[0];
  const spotOf = (c) => set.spots[c.spot || 'center'] || set.spots.center;
  const lines = shot.line ? wrap(shot.line, shot.lineWidth || 24) : null;
  const lineAt = ctx.cue(shot.lineOn, shot.lineAt ?? 0.3);
  const typing = lines ? { from: lineAt + 0.2, to: lineAt + 0.2 + lines.join(' ').length / (shot.cps || 18) } : null;

  return (t) => {
    // camera
    let c;
    if (shot.frame === 'close' && focusChar) {
      const [x, y, s] = spotOf(focusChar);
      const hx = x, hy = y - 236 * s;
      const z0 = shot.zoom || Math.min(3, Math.max(1.3, 220 / (132 * s)));
      const zoom = cameraZoom(shot.camera || 'creep', t, ctx, z0);
      const sx = hx < 640 ? 470 : 810; // head off-centre so the bubble/stickers get the other side
      c = { zoom, fx: hx, fy: hy, x: sx - hx, y: 330 - hy };
    } else {
      const zoom = cameraZoom(shot.camera || 'creep', t, ctx, shot.zoom || 1);
      const [fx, fy] = shot.focusXY || (focusChar ? [spotOf(focusChar)[0], spotOf(focusChar)[1] - 200] : [640, 360]);
      c = { zoom, fx, fy };
    }
    const people = chars.map((ch) => {
      const [x, y, s] = spotOf(ch);
      const isSpeaker = speaker && ch.who === speaker.who;
      const talkFrom = isSpeaker && typing ? typing.from : shot.speaking && isSpeaker ? 0.1 : null;
      const talkTo = isSpeaker && typing ? typing.to : shot.speaking && isSpeaker ? ctx.dur - 0.3 : null;
      let px = x;
      if (ch.walk) px = M.tween(t, ch.walkAt ?? 0, ch.walkDur ?? ctx.dur, x + (ch.walk === 'in' ? -420 : 0), x + (ch.walk === 'out' ? 420 : 0), M.ease.linear);
      return g(tr(px, y, s), character(resolveCast(ch.who, ctx), actor(ch, t, ctx, { talkFrom, talkTo })));
    }).join('');
    const world = set.draw(t, shot.setOpts || {}) + people + (set.front ? set.front(t, shot.setOpts || {}) : '');
    let out = cam(world, c);

    // speech bubble in screen space, beside the speaker's head
    let side = 'left';
    if (speaker && lines) {
      const [x, y, s] = spotOf(speaker);
      const [hx, hy] = toScreen(x, y - 236 * s, c);
      const hr = 66 * s * c.zoom;
      const size = 30;
      const w = Math.min(500, Math.max(250, Math.max(...lines.map((l) => l.length)) * size * 0.47 + 56));
      const h = lines.length * size * 1.28 + 34;
      const right = hx < 640;
      // beside the head and clear of it; if there's no room at the side, sit above the head
      let bx = right ? hx + hr * 1.0 : hx - hr * 1.0 - w;
      let by = Math.max(84, Math.min(560 - h, hy - hr * 0.6 - h / 2));
      if (bx < 20 || bx + w > 1260) { bx = Math.max(20, Math.min(1260 - w, hx - w / 2)); by = Math.max(84, hy - hr * 1.15 - h - 30); }
      const ang = Math.atan2(by + h / 2 - hy, (bx + w / 2) - hx);
      const tail = [hx + Math.cos(ang) * hr * 1.12, hy + Math.sin(ang) * hr * 1.12];
      out += ui.bubble({ x: bx, y: by, w, lines, tail, size, cps: shot.cps || 18 }, t, lineAt).svg;
      side = right ? 'right' : 'left'; // stickers stack under the bubble, on the side away from the speaker
    } else if (focusChar) {
      side = spotOf(focusChar)[0] < 640 ? 'right' : 'left';
    }
    return out + overlays(shot, t, ctx, { side });
  };
}

// ---------- versus: two sides, split screen ----------
// { template: 'versus', left: { who, label, mood, pose, line, color }, right: {...}, title, lineOn }
function versus(shot, ctx) {
  const sides = [shot.left || {}, shot.right || {}];
  return (t) => {
    const panels = sides.map((sd, i) => {
      const x0 = i * 640;
      const bg = sd.color || (i === 0 ? '#8fa3b5' : '#c09a8f');
      const lab = sd.label ? ui.sticker(sd.label, x0 + 320, 92, t, ctx.cue(sd.labelOn, 0.2 + i * 0.5), { size: 40, rot: i ? 2 : -2, color: P.ink }) : '';
      const who = sd.who ? g(tr(x0 + 320, 640, 0.95), character(resolveCast(sd.who, ctx), actor(sd, t, ctx, sd.line ? { talkFrom: ctx.cue(sd.lineOn, 1 + i) + 0.2, talkTo: ctx.cue(sd.lineOn, 1 + i) + 0.2 + sd.line.length / 18 } : {}))) : '';
      const bub = sd.line ? ui.bubble({ x: x0 + 60, y: 140, w: 520, lines: wrap(sd.line, 28), tail: [x0 + 320, 320], size: 28 }, t, ctx.cue(sd.lineOn, 1 + i)).svg : '';
      return `<rect x="${x0}" y="0" width="640" height="720" fill="${bg}"/><rect x="${x0}" y="600" width="640" height="120" fill="${P.floor}" opacity=".55"/>${who}${bub}${lab}`;
    }).join('');
    const divider = `<path d="M640 0 V720" stroke="${P.ink}" stroke-width="8"/><circle cx="640" cy="360" r="44" fill="${P.paper}" stroke="${P.ink}" stroke-width="5"/>${text('VS', 640, 375, { size: 40, font: 'display', anchor: 'middle', fill: P.red })}`;
    return cam(panels + divider, { zoom: cameraZoom(shot.camera || 'locked', t, ctx) }) + overlays(shot, t, ctx, { side: 'left' });
  };
}

// ---------- document: typed paper on a desk, highlight + stamp ----------
// { template: 'document', lines: ['LINE', { text, size }], highlight: 'text in a line', highlightOn,
//   stamp: { text, on }, pencil: 'text to circle', pencilOn }
function documentShot(shot, ctx) {
  const lines = (shot.lines || []).map((l) => (typeof l === 'string' ? { text: l } : l));
  const base = lines.length > 10 ? 24 : 28;
  return (t) => {
    let y = 150;
    const rows = lines.map((l) => {
      const size = l.size || (l.big ? base + 6 : base);
      const row = { ...l, y, size };
      y += l.text ? size * 1.32 : size * 0.8;
      return row;
    });
    const hl = shot.highlight != null ? rows.find((r) => r.text && r.text.includes(shot.highlight)) : null;
    const pc = shot.pencil != null ? rows.find((r) => r.text && r.text.includes(shot.pencil)) : null;
    const stampAt = shot.stamp ? ctx.cue(shot.stamp.on, shot.stamp.at ?? ctx.dur * 0.45) : null;
    const world = props.deskTop(4)
      + `<g filter="url(#softShadow)"><rect x="360" y="70" width="600" height="700" fill="${P.paper}" transform="rotate(-1.5 660 420)"/></g>`
      + `<g transform="rotate(-1.5 660 420)">`
      + (hl ? ui.highlight(396, hl.y - 4, Math.min(520, hl.text.length * hl.size * 0.6), t, ctx.cue(shot.highlightOn, 0.6), { h: hl.size + 6 }) : '')
      + rows.map((r) => (r.text ? text(r.text, 400, r.y, { size: r.size, font: 'type' }) : '')).join('')
      + (pc ? ui.pencilCircle(400 + pc.text.indexOf(shot.pencil) * pc.size * 0.6 + shot.pencil.length * pc.size * 0.3, pc.y - pc.size * 0.35, shot.pencil.length * pc.size * 0.34 + 18, pc.size * 0.75, t, ctx.cue(shot.pencilOn, 1.2)) : '')
      + `<path d="M400 112 H900" stroke="${P.ink}" stroke-width="2"/></g>`
      + `<g transform="translate(1040 520) rotate(-35)"><rect width="230" height="16" fill="${P.red}" stroke="${P.ink}" stroke-width="3"/><path d="M230 0 L262 8 L230 16 Z" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="3"/></g>`
      + `<circle cx="190" cy="180" r="70" fill="none" stroke="#5a3a26" stroke-width="9" opacity=".5"/>`
      + (shot.stamp ? ui.stamp(shot.stamp.text, 650, Math.min(640, y + 50), t, stampAt, { rot: -7, size: shot.stamp.size || 46 }) : '');
    const camSpec = shot.camera || (shot.stamp ? { mode: 'punch', at: Math.max(0.3, stampAt - 0.6) } : 'creep');
    return cam(world, { zoom: cameraZoom(camSpec, t, ctx), fx: 650, fy: shot.stamp ? 560 : 360 })
      + overlays(shot, t, ctx, { side: 'left' });
  };
}

// ---------- chart: line rises, turns, falls ----------
// { template: 'chart', title, data: [[x, y], ...], turn: xValue, turnLabel, riseOn, fallOn,
//   change: { text: '−27%', on }, xLabels: [[x, 'label']], color, rising: true (green) }
function chart(shot, ctx) {
  const data = shot.data;
  const xs = data.map((d) => d[0]), ys = data.map((d) => d[1]);
  const pad = (Math.max(...ys) - Math.min(...ys)) * 0.12 || 1;
  const box = { x: 140, y: 70, w: 1000, h: 560, xRange: [xs[0], xs[xs.length - 1] + (xs[xs.length - 1] - xs[0]) * 0.01], yRange: [Math.min(...ys) - pad, Math.max(...ys) + pad] };
  const map = props.chartMap(box);
  const color = shot.color === 'green' || shot.rising ? P.green : P.red;
  const xLabels = shot.xLabels || [xs[0], shot.turn, xs[xs.length - 1]].filter((v) => v != null).map((v) => [v, String(Math.round(v))]);
  return (t) => {
    const riseAt = ctx.cue(shot.riseOn, 0.3);
    const end = xs[xs.length - 1];
    let upTo;
    if (shot.turn != null) {
      const riseEnd = riseAt + 2.1;
      const fallAt = Math.max(riseEnd + 0.4, ctx.cue(shot.fallOn, riseEnd + 0.5));
      upTo = M.keys(t, [[riseAt, xs[0]], [riseEnd, shot.turn], [fallAt, shot.turn], [fallAt + 1.0, end]]);
    } else {
      upTo = M.keys(t, [[riseAt, xs[0]], [riseAt + (shot.drawDur || 2.5), end]]);
    }
    const turnY = shot.turn != null ? data.reduce((best, d) => (Math.abs(d[0] - shot.turn) < Math.abs(best[0] - shot.turn) ? d : best))[1] : 0;
    const world = `<rect width="${W}" height="${H}" fill="${P.wall}"/>`
      + g(`filter="url(#softShadow)"`, props.lineChart({ ...box, data, upTo, title: shot.title, xLabels, color }))
      + (shot.turnLabel && shot.turn != null ? ui.sticker(shot.turnLabel, map.px(shot.turn), map.py(turnY) - 58, t, riseAt + 2.1, { size: 28, color: P.ink, rot: 2 }) : '')
      + (shot.change ? ui.sticker(shot.change.text, shot.change.x ?? map.px(xs[0] + (end - xs[0]) * 0.85), shot.change.y ?? 200, t, ctx.cue(shot.change.on, ctx.dur - 1.6), { size: 64, rot: -4, font: 'display', color }) : '');
    const fallAt = shot.turn != null ? Math.max(riseAt + 2.5, ctx.cue(shot.fallOn, riseAt + 2.6)) : riseAt + 2.5;
    const camSpec = shot.camera || { mode: 'push', at: fallAt - 0.2 };
    const fx = map.px(shot.turn != null ? shot.turn + (end - shot.turn) * 0.6 : end), fy = map.py((Math.min(...ys) + Math.max(...ys)) / 2);
    return cam(world, { zoom: cameraZoom(camSpec, t, ctx), fx, fy }) + overlays(shot, t, ctx, { side: 'left' });
  };
}

// ---------- stat: one big number over a dimmed set ----------
// { template: 'stat', value: '1 BILLION+' or number, prefix, suffix, caption, on, set, setOpts }
function stat(shot, ctx) {
  return (t) => {
    const set = sets()[shot.set];
    const bg = set ? set.draw(t, shot.setOpts || {}) + (set.front ? set.front(t, shot.setOpts || {}) : '') : boardBg();
    const at = ctx.cue(shot.on, 0.3);
    let value = shot.value;
    if (typeof value === 'number') {
      const k = M.ease.out(M.prog(t, at, shot.countDur || 1.1));
      const v = value * k;
      value = (shot.prefix || '') + (value >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(value % 1 ? 1 : 0)) + (shot.suffix || '');
    }
    const world = bg + (set ? `<rect width="${W}" height="${H}" fill="${P.nightDeep}" opacity=".55"/>` : '');
    return cam(world, { zoom: cameraZoom(shot.camera || 'creep', t, ctx) })
      + ui.bigStat(value, shot.caption, 640, 380, t, at, { size: shot.size || 120, anchor: 'middle' })
      + overlays({ ...shot, stat: null }, t, ctx, { side: 'left' });
  };
}

// Default backdrop for stat/money shots without a set: chalkboard in a wooden frame.
const boardBg = () => `<rect width="${W}" height="${H}" fill="${P.woodDark}"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${P.board}" stroke="${P.ink}" stroke-width="5"/>
  <path d="M120 600 Q400 585 700 604 T1160 596" stroke="${P.paperDim}" stroke-width="3" fill="none" opacity=".12"/>
  <path d="M160 130 Q500 118 860 134" stroke="${P.paperDim}" stroke-width="3" fill="none" opacity=".1"/>`;

// ---------- fuse: the house device ----------
// { template: 'fuse', heading, sub, stops: [{ year, title, lines, on }], end: { label, sub, on } }
function fuse(shot, ctx) {
  const stops = shot.stops || [];
  const x0 = 110, x1 = 1040;
  const xs = stops.map((_, i) => x0 + ((i + 1) / (stops.length + 1)) * (x1 - x0));
  const ks = xs.map((x) => (x - x0) / (x1 - x0));
  const even = (i) => 0.6 + ((i + 1) / (stops.length + 1.4)) * (ctx.dur - 1.2);
  const arrive = stops.map((s, i) => ctx.cue(s.on, even(i)));
  const endAt = ctx.cue(shot.end && shot.end.on, Math.min(ctx.dur - 0.5, (arrive[arrive.length - 1] || 0.6) + 1.0));
  const keysList = [[Math.max(0, (arrive[0] || endAt) - 0.9), 0]];
  arrive.forEach((a, i) => {
    const prev = i ? arrive[i - 1] : keysList[0][0];
    keysList.push([Math.max(prev + 0.05, a - Math.min(0.9, a - prev - 0.1)), i ? ks[i - 1] : 0], [a, ks[i]]);
  });
  keysList.push([Math.max(keysList[keysList.length - 1][0] + 0.05, endAt - 0.9), ks[ks.length - 1] || 0], [endAt, 1]);
  const stopDefs = stops.map((s, i) => ({ ...s, x: xs[i] }));
  return (t) => {
    const k = M.keys(t, keysList);
    const reached = arrive.filter((a) => t >= a).length;
    const cards = stopDefs.map((s, i) => ui.indexCard({ x: s.x - 105, y: 236, w: 210, h: 124, title: s.title, lines: s.lines || [], rot: i % 2 ? 2 : -2 }, t, arrive[i])).join('');
    const board = `<rect width="${W}" height="${H}" fill="${P.woodDark}"/>
      <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${P.board}" stroke="${P.ink}" stroke-width="5"/>
      ${text(shot.heading || 'THE FUSE', 640, 110, { size: 54, font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.9 })}
      ${text(shot.sub || 'every point where someone could have cut it', 640, 150, { size: 28, fill: P.paperDim, anchor: 'middle' })}`;
    return cam(board + dev.fuse({ x0, x1, base: 470, stops: stopDefs, end: shot.end, k, t }) + cards, { zoom: cameraZoom(shot.camera || 'locked', t, ctx) })
      + dev.tally(shot.tallyLabel || 'CHANCES TO CUT IT', reached, 930, 48, { w: 290 })
      + overlays(shot, t, ctx, { side: 'left' });
  };
}

// ---------- map: real geography (lib/maps.js) ----------
// { template: 'map', view: { fit: ['Germany', 'Poland'] | center: [lon, lat], zoom, dim,
//     highlight: { Germany: 'red' | { color, on } }, hatch: { Czechia: { on } },
//     labels: [{ text, lon, lat, on }], cities: [{ name, lon, lat, on }], arrows: [{ from, to, on, label, color }] },
//   legend: [{ color, label }], focus: [lon, lat] (camera push target) }
// Colours may be palette names ('red', 'navy', 'gold', ...) or hex.
function mapShot(shot, ctx) {
  const maps = lazy('./maps');
  if (!maps) throw new Error('lib/maps.js missing');
  const color = (c) => (typeof c === 'string' && P[c] ? P[c] : c);
  const cueAll = (list) => (list || []).map((x) => ({ ...x, color: color(x.color), at: ctx.cue(x.on, x.at ?? 0.5) }));
  const cueMap = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => {
    if (v && typeof v === 'object') return [k, { ...v, color: color(v.color), at: ctx.cue(v.on, v.at ?? 0.3) }];
    return [k, typeof v === 'string' ? color(v) : v];
  }));
  const v = shot.view || {};
  const frameView = v.fit ? maps.fitTo(v.fit, { padding: v.padding ?? 90 }) : { center: v.center || [0, 20], zoom: v.zoom || 1 };
  const view = { ...v, ...frameView, highlight: cueMap(v.highlight), hatch: cueMap(v.hatch),
    labels: cueAll(v.labels), cities: cueAll(v.cities), arrows: cueAll(v.arrows) };
  delete view.fit;
  const [fx, fy] = shot.focus ? maps.project(shot.focus[0], shot.focus[1], view) : [640, 360];
  const legend = (shot.legend || []).map((l) => ({ ...l, color: color(l.color) }));
  return (t) => cam(maps.mapView({ ...view, t }), { zoom: cameraZoom(shot.camera || { mode: 'push' }, t, ctx), fx, fy })
    + (legend.length ? maps.legend(legend, t, ctx.cue(shot.legendOn, 0.3)) : '')
    + overlays(shot, t, ctx, { side: 'right' });
}

// ---------- money: money graphics from lib/money.js on a board or set ----------
// { template: 'money', set, items: [{ kind: 'cashStack'|..., args: [...], on }] }
function money(shot, ctx) {
  const m = lazy('./money');
  if (!m) throw new Error('lib/money.js missing');
  return (t) => {
    const set = sets()[shot.set];
    const bg = set ? set.draw(t, shot.setOpts || {}) : boardBg();
    const items = (shot.items || []).map((it) => {
      const fn = m[it.kind];
      if (!fn) return '';
      const args = (it.args || []).map((a) => (a === '$t' ? t : a === '$at' ? ctx.cue(it.on, it.at ?? 0.4) : a));
      return fn(...args);
    }).join('');
    return cam(bg + items, { zoom: cameraZoom(shot.camera || 'creep', t, ctx) }) + overlays(shot, t, ctx);
  };
}

// ---------- title: episode title card ----------
// { template: 'title', text: 'WHY THE [2008 CRASH] WAS COMPLETELY AVOIDABLE', set, setOpts, dur }
function title(shot, ctx) {
  // "[2008 CRASH]?" -> highlighted "2008 CRASH" + plain "?" with no space between
  const words = (String(shot.text).match(/\[[^\]]+\][^\s[]*|\S+/g) || []).flatMap((w) => {
    const m = w.match(/^\[([^\]]+)\](.*)$/);
    return m ? (m[2] ? [`[${m[1]}]`, `~${m[2]}`] : [w]) : [w];
  });
  const total = words.join(' ').length;
  const lines = [[], []];
  let len = 0;
  words.forEach((w) => { (len < total / 2 ? lines[0] : lines[1]).push(w); len += w.length + 1; });
  const segs = lines.filter((l) => l.length).map((l) => {
    const out = [];
    l.forEach((w, i) => {
      const hl = w.startsWith('[');
      const glued = l[i + 1] && l[i + 1].startsWith('~');
      const str = w.replace(/[[\]~]/g, '') + (i < l.length - 1 && !glued ? ' ' : '');
      if (out.length && out[out.length - 1][1] === hl) out[out.length - 1][0] += str; else out.push([str, hl]);
    });
    return out;
  });
  return (t) => {
    const set = sets()[shot.set];
    const bg = set ? set.draw(t + 20, shot.setOpts || {}) + (set.front ? set.front(t, shot.setOpts || {}) : '') : `<rect width="${W}" height="${H}" fill="${P.night}"/>`;
    return cam(bg, { zoom: 1.07 }) + `<rect width="${W}" height="${H}" fill="${P.nightDeep}" opacity=".45"/>`
      + ui.titleCard(segs, t, 0.2, { y: 250, size: shot.size || 66 });
  };
}

// ---------- chapter: black card, serif small caps ----------
// { template: 'chapter', label: 'PART ONE', sub: 'Cheap Money', dur: 2 }
const chapter = (shot) => (t) => ui.chapterCard(shot.label, shot.sub, t);

const TEMPLATES = { talk, versus, document: documentShot, chart, stat, fuse, map: mapShot, money, title, chapter };

module.exports = { TEMPLATES, MOODS, POSES, wrap };
