// Shot templates: turn one plain-data entry of shots.json into a renderable shot.
// A template gets (shot, ctx) and returns render(t) -> SVG. ctx = { dur, cue, cast }:
//   cue('word') -> local seconds when that word is spoken (or a number of seconds), see lib/timing.js
//
// Templates: talk, versus, document, chart, stat, fuse, pipes, case, compose, map, money, title, chapter, card (+ kits).
// Every template also accepts the common overlay fields (see `overlays` below):
//   tag, plate, stickers, stat, source, camera.
// Shot-list reference with examples: SHOTS.md.

const P = require('./palette');
const { g, tr, text, textWidth, camera: cam, W, H, n } = require('./svg');
const M = require('./motion');
const { character, CAST } = require('./characters');
const props = require('./props');
const ui = require('./ui');
const dev = require('./devices');

// Special Elite (documents) is monospaced: measured ~0.535em per character.
const TYPE_EM = 0.535;
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
  // acting poses (use with turn/sit/back for staged scenes)
  give: { L: [12, -8], R: [82, 4] },          // hands something across to screen right (pair with holding)
  giveLeft: { L: [82, 4], R: [12, -8] },
  typing: { L: [24, -100], R: [24, -100] },   // both hands forward on a desk/keyboard
  armsCrossed: { L: [42, -138], R: [42, -138] },
  facepalm: { L: [12, -8], R: [130, 107] },     // hand over the face
  phoneEar: { L: [12, -8], R: [130, 64] },      // hand at the ear; with holding: "phone"
  headInHands: { L: [130, 107], R: [130, 107] },
  explain: { L: [55, -60], R: [70, -40] },    // both hands open, mid-sentence
};

const STICKER_COLORS = { red: P.red, ink: P.ink, gold: P.goldDark, green: P.greenDark, blue: P.blue };

// Cast colours may be palette names ("navy", "red", "gold") or hex.
const COLOR_FIELDS = ['suit', 'shirt', 'tie', 'hairColor', 'skin', 'hatColor', 'hatBand', 'moustacheColor', 'blushColor', 'beardColor', 'necklace'];
const resolveCast = (who, ctx) => {
  const c = (ctx.cast && ctx.cast[who]) || who;
  if (typeof c === 'string') return CAST[c] || CAST.banker;
  const base = c.base ? CAST[c.base] || {} : {};
  const out = { ...base, ...c };
  COLOR_FIELDS.forEach((k) => { if (typeof out[k] === 'string' && P[out[k]]) out[k] = P[out[k]]; });
  return out;
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
// Sets with busy tops (ticker boards, screens, signs): finance captions go bottom-left instead.
const CAPTION_LOW = new Set(['tradingFloor', 'studioNews', 'streetDay', 'bankExterior', 'hall']);
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
function overlays(shot, t, ctx, { side = 'left', skipStickers = false, obstacles = null } = {}) {
  ctx = { ...ctx, setName: shot.set, obstacles };
  let out = '';
  if (shot.stat) {
    const s = shot.stat;
    out += ui.bigStat(s.value, s.caption, s.x ?? 64, s.y ?? 300, t, ctx.cue(s.on, s.at ?? 0.4), { size: s.size || 84 });
  }
  if (!skipStickers) out += stickersSvg(shot.stickers, t, ctx, side);
  if (shot.tag) {
    const tg = typeof shot.tag === 'string' ? { text: shot.tag } : shot.tag;
    out += (tg.style || (ctx.style && ctx.style.tag)) === 'script'
      ? ui.scriptCaption(tg.text, t, ctx.cue(tg.on, tg.at ?? 0.1), CAPTION_LOW.has(shot.set) || tg.low ? { y: 692 } : {})
      : ui.dateTag(tg.text, t, ctx.cue(tg.on, tg.at ?? 0.1));
  }
  if (shot.plate) out += ui.namePlate(shot.plate.name, shot.plate.role || '', t, ctx.cue(shot.plate.on, shot.plate.at ?? 0.5));
  if (shot.source) out += text(shot.source, 1250, 702, { size: 17, anchor: 'end', fill: P.paper, opacity: 0.75 });
  // a verdict stamp on any shot: { text, on, color: red|ink|blue|green, x, y, rot, size } (documents draw their own)
  if (shot.stamp && shot.template !== 'document') {
    const st = typeof shot.stamp === 'string' ? { text: shot.stamp } : shot.stamp;
    out += ui.stamp(st.text, st.x ?? 640, st.y ?? 380, t, ctx.cue(st.on, st.at ?? ctx.dur * 0.5), { rot: st.rot ?? -8, size: st.size || 52, color: STICKER_COLORS[st.color] || st.color || P.red });
  }
  return out;
}

// Free-space placement: try candidate spots (preferred side first) and take the first one that clears every
// obstacle (faces, dialogue, tag, plate) and the stickers already placed. Used when a talk shot passes obstacles.
const rectsHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function freeSpot(w, h, side, taken) {
  const xs = side === 'right' ? [980, 1090, 800, 640, 300, 190] : [300, 190, 470, 640, 980, 1090];
  const ys = [400, 484, 316, 568, 232, 150];
  for (const y of ys) for (const x of xs) {
    const r = { x: x - w / 2 - 8, y: y - h / 2 - 8, w: w + 16, h: h + 16 };
    if (r.x < 10 || r.x + r.w > 1270 || r.y < 10 || r.y + r.h > 710) continue;
    if (!taken.some((o) => rectsHit(r, o))) return [x, y, r];
  }
  return null;
}

function stickersSvg(list, t, ctx, side = 'left') {
  const taken = ctx.obstacles ? [...ctx.obstacles] : null;
  return (list || []).map((s, i) => {
    let [ax, ay] = stickerXY(i, side, ctx.setName);
    if (taken && (s.x == null || s.y == null)) {
      const size = s.size || 34;
      const spot = freeSpot(textWidth(s.text, size, s.font || 'hand') + 36, size + 24, side, taken);
      if (spot) { [ax, ay] = spot; taken.push(spot[2]); }
    }
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
    look: c.look,
    tilt: c.tilt || 0,
    turn: c.turn2 != null && t >= ctx.cue(c.turnOn, c.turnAt ?? ctx.dur / 2) ? M.keys(t, [[ctx.cue(c.turnOn, c.turnAt ?? ctx.dur / 2), c.turn || 0], [ctx.cue(c.turnOn, c.turnAt ?? ctx.dur / 2) + 0.35, c.turn2]]) : c.turn || 0,
    sit: !!c.sit,
    back: !!c.back,
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

// ---------- talk: characters on a set, optionally speaking ----------
// { template: 'talk', set, setOpts, frame: 'wide'|'close'|'reverse', focus: who, light: true,
//   chars: [{ who, spot, mood, pose, poseOn, mood2, mood2On, pose2, pose2On, holding, carry, walk }],
//   speaker + line (+ lineOn)           one line of dialogue, or
//   lines: [{ who, text, on, bubble }]  a conversation; frame 'reverse' cuts close to whoever is speaking
//   speaking: true                      mouth moves for `speaker`/`focus` with no text (narrated speech)
//   bubble: true                        force speech bubbles (finance style defaults to floating lines)
//   nameArrow: { who, text, on }        handwritten name + curved arrow (first appearance) }
function talk(shot, ctx) {
  const set = sets()[shot.set || 'office'];
  if (!set) throw new Error(`unknown set "${shot.set}" (see lib/sets.js)`);
  const style = ctx.style;
  const chars = shot.chars || [];
  const byWho = (w) => chars.find((c) => c.who === w);
  const spotOf = (c) => set.spots[c.spot || 'center'] || set.spots.center;

  // dialogue, normalised: [{ who, text, at, end, mode, cps }]
  const raw = shot.lines || (shot.line ? [{ who: shot.speaker, text: shot.line, on: shot.lineOn, at: shot.lineAt }] : []);
  const dlg = [];
  raw.forEach((l, i) => {
    const pick = l.dialogue || shot.dialogue || (l.bubble || shot.bubble ? 'bubble' : (shot.bubble === false ? 'float' : style.dialogue));
    const mode = pick === 'bubble' ? 'bubble' : 'float';
    const cps = shot.cps || (mode === 'bubble' ? (style.name === 'war' ? 18 : 24) : 30);
    const prevEnd = i ? dlg[i - 1].end + 0.4 : 0.3;
    const at = ctx.cue(l.on, l.at ?? prevEnd);
    dlg.push({ ...l, who: l.who || shot.speaker, at, mode, cps, end: at + 0.2 + l.text.length / cps });
  });
  const current = (t) => { let c = null; dlg.forEach((d) => { if (t >= d.at) c = d; }); return c; };
  // over-the-shoulder: `over` (default: the first person who isn't the focus) is drawn from behind, big, in the foreground
  const ots = shot.frame === 'ots' && chars.length > 1;
  const overChar = ots ? byWho(shot.over) || chars.find((ch) => ch.who !== (shot.focus || shot.speaker)) : null;
  const focusOf = (t) => {
    if (shot.frame === 'reverse' && dlg.length) return byWho((current(t) || dlg[0]).who) || chars[0];
    if (ots) return byWho(shot.focus || shot.speaker) || chars.find((ch) => ch !== overChar);
    return byWho(shot.focus || shot.speaker) || chars[0];
  };
  const closeFrame = shot.frame === 'close' || shot.frame === 'reverse';
  // "wide" (default) frames the cast at a medium size like the references; "full" shows the whole set.
  // Establishing sets (exteriors, the night tower) default to full.
  const ESTABLISHING = ['towerNight', 'bankExterior', 'skylineWTC', 'memorial', 'fieldPA', 'pentagon', 'capitol', 'courthouse', 'embassy', 'gulfSkyline', 'prisonExterior'];
  const fitCast = () => {
    if (shot.frame === 'full' || (!shot.frame && ESTABLISHING.includes(shot.set)) || !chars.length) return { zoom: 1, fx: 640, fy: 360 };
    const boxes = chars.map((ch) => { const [x, y, s] = spotOf(ch); return { x0: x - 110 * s, x1: x + 110 * s, y0: y - (ch.sit ? 290 : 330) * s, y1: y + 10 }; });
    const x0 = Math.min(...boxes.map((b) => b.x0)), x1 = Math.max(...boxes.map((b) => b.x1));
    const y0 = Math.min(...boxes.map((b) => b.y0)), y1 = Math.max(...boxes.map((b) => b.y1));
    // sets with small, low-standing people (outdoor wides, scale ~0.6) may zoom further; the view stays inside the set
    const minS = Math.min(...chars.map((ch) => spotOf(ch)[2]));
    const zoom = Math.max(1, Math.min(Math.min(2.4, 1.55 / Math.min(1, minS)), (720 * 0.78) / (y1 - y0), (1280 * 0.8) / (x1 - x0)));
    const hw = 640 / zoom, hh = 360 / zoom;
    return { zoom, fx: Math.min(Math.max((x0 + x1) / 2, hw), 1280 - hw), fy: Math.min(Math.max(y0 + (y1 - y0) * 0.42, hh), 720 - hh) };
  };

  return (t) => {
    const focusChar = focusOf(t);
    let c;
    if ((closeFrame || ots) && focusChar) {
      const [x, y, s] = spotOf(focusChar);
      const hx = x, hy = y - (focusChar.sit ? 196 : 236) * s;
      const z0 = shot.zoom || (ots ? Math.min(2.2, Math.max(1.25, 170 / (132 * s))) : Math.min(3, Math.max(1.3, 220 / (132 * s))));
      const zoom = cameraZoom(shot.camera || style.camera, t, ctx, z0);
      // head off-centre; dialogue and stickers get the other side (over the shoulder: away from the foreground person)
      const sx = ots ? (spotOf(overChar)[0] < x ? 800 : 480) : hx < 640 ? 470 : 810;
      c = { zoom, fx: hx, fy: hy, x: sx - hx, y: 330 - hy };
      // never look past the edge of the set: world x 0..1280 / y 0..720 must cover the screen
      c.x = Math.min(Math.max(c.x, 1280 - hx - (1280 - hx) * zoom), -hx + hx * zoom);
      c.y = Math.min(Math.max(c.y, 720 - hy - (720 - hy) * zoom), -hy + hy * zoom);
    } else {
      const fit = fitCast();
      const zoom = cameraZoom(shot.camera || style.camera, t, ctx, shot.zoom || fit.zoom);
      const [fx, fy] = shot.focusXY || (shot.zoom || fit.zoom === 1 ? (focusChar ? [spotOf(focusChar)[0], spotOf(focusChar)[1] - 200] : [640, 360]) : [fit.fx, fit.fy]);
      c = { zoom, fx, fy };
      // a fitted medium shot centres the cast (the anchor goes to the frame centre; fitCast keeps the view inside the set)
      if (!shot.focusXY && !shot.zoom && fit.zoom > 1) { c.x = 640 - fx; c.y = 360 - fy; }
    }
    const people = chars.filter((ch) => ch !== overChar).map((ch) => {
      const [x, y, s] = spotOf(ch);
      const mine = dlg.filter((d) => d.who === ch.who);
      const live = mine.find((d) => t >= d.at && t <= d.end);
      const speaksFree = shot.speaking && ch.who === (shot.speaker || shot.focus || chars[0].who);
      const talkFrom = live ? live.at + 0.1 : speaksFree ? 0.1 : null;
      const talkTo = live ? live.end : speaksFree ? ctx.dur - 0.3 : null;
      let px = x;
      if (ch.walk) px = M.tween(t, ch.walkAt ?? 0, ch.walkDur ?? ctx.dur, x + (ch.walk === 'in' ? -420 : 0), x + (ch.walk === 'out' ? 420 : 0), M.ease.linear);
      return g(tr(px, y, s), character(resolveCast(ch.who, ctx), actor(ch, t, ctx, { talkFrom, talkTo })));
    }).join('');
    const world = set.draw(t, shot.setOpts || {}) + people + (set.front ? set.front(t, shot.setOpts || {}) : '');
    let out = cam(world, c);
    if (overChar) {
      // the foreground shoulder: big, cropped by the frame edge, seen from behind
      const left = spotOf(overChar)[0] < spotOf(focusChar)[0];
      const st = { ...actor(overChar, t, ctx), back: true, legs: false };
      out += g(tr(left ? 170 : 1110, 1040, 2.05), character(resolveCast(overChar.who, ctx), st));
    }

    const headOf = (ch) => {
      const [x, y, s] = spotOf(ch);
      const [hx, hy] = toScreen(x, y - (ch.sit ? 196 : 236) * s, c);
      return { hx, hy, hr: 66 * s * c.zoom };
    };
    if (shot.light && focusChar) {
      const { hx, hy, hr } = headOf(focusChar);
      out += ui.spotlight(hx, hy + hr * 1.2, { r: Math.max(280, hr * 4) });
    }

    // dialogue: the line currently being said (earlier lines are replaced, as in both references)
    let side = focusChar && headOf(focusChar).hx < 640 ? 'right' : 'left';
    const d = current(t);
    const sp = d && byWho(d.who);
    if (d && sp) {
      const { hx, hy, hr } = headOf(sp);
      if (d.mode === 'bubble') {
        const lines = wrap(d.text, shot.lineWidth || 24);
        const size = 30;
        const w = Math.min(500, Math.max(250, Math.max(...lines.map((l) => l.length)) * size * 0.47 + 56));
        const h = lines.length * size * 1.28 + 34;
        const right = hx < 640;
        let bx = right ? hx + hr * 1.0 : hx - hr * 1.0 - w;
        let by = Math.max(84, Math.min(560 - h, hy - hr * 0.6 - h / 2));
        if (bx < 20 || bx + w > 1260) { bx = Math.max(20, Math.min(1260 - w, hx - w / 2)); by = Math.max(84, hy - hr * 1.15 - h - 30); }
        const ang = Math.atan2(by + h / 2 - hy, (bx + w / 2) - hx);
        const tail = [hx + Math.cos(ang) * hr * 1.12, hy + Math.sin(ang) * hr * 1.12];
        out += ui.bubble({ x: bx, y: by, w, lines, tail, size, cps: d.cps }, t, d.at).svg;
        side = right ? 'right' : 'left';
      } else {
        const lines = wrap(d.text, 34);
        const size = closeFrame ? 46 : 40;
        let lt = d.at;
        lines.forEach((ln, i) => {
          const w = ln.length * size * 0.42;
          const y = Math.max(64 + size * 0.8 + i * size * 1.3, hy - hr * 1.2 - 34 - (lines.length - 1 - i) * size * 1.3);
          const x = Math.max(30 + w / 2, Math.min(1250 - w / 2, hx));
          out += ui.floatLine({ x, y, text: ln, tail: i === lines.length - 1 ? [hx, hy - hr * 1.08] : null, size, cps: d.cps }, t, lt).svg;
          lt += ln.length / d.cps;
        });
      }
    }
    if (shot.nameArrow) {
      const na = shot.nameArrow;
      const who = byWho(na.who) || focusChar;
      if (who) {
        const { hx, hy, hr } = headOf(who);
        const nx = hx < 640 ? Math.min(1100, hx + hr + 190) : Math.max(180, hx - hr - 190);
        const ny = Math.max(90, hy - hr * 0.9);
        out += ui.nameArrow(na.text, nx, ny, hx + (nx > hx ? hr * 1.05 : -hr * 1.05), hy - hr * 0.2, t, ctx.cue(na.on, na.at ?? 0.5));
      }
    }
    // obstacles for sticker placement: every visible face, the dialogue, and the tag/plate corners
    const obstacles = chars.map((ch) => { const { hx, hy, hr } = headOf(ch); return { x: hx - hr * 1.1, y: hy - hr * 1.25, w: hr * 2.2, h: hr * 2.5 }; })
      .filter((r) => r.x < 1280 && r.x + r.w > 0 && r.y < 720 && r.y + r.h > 0);
    if (d && sp) {
      const { hx, hy, hr } = headOf(sp);
      obstacles.push(d.mode === 'bubble'
        ? { x: Math.min(hx, 640) - 520, y: Math.max(60, hy - hr - 260), w: 1040, h: 300 } // generous: the bubble sits beside/above the head
        : { x: hx - 360, y: Math.max(40, hy - hr * 1.2 - 34 - 110), w: 720, h: 140 });
    }
    if (shot.tag) obstacles.push({ x: 0, y: 0, w: 560, h: 96 });
    if (shot.plate) obstacles.push({ x: 0, y: 580, w: 560, h: 140 });
    if (shot.nameArrow) obstacles.push({ x: 0, y: 40, w: 1280, h: 90 });
    return out + overlays(shot, t, ctx, { side, obstacles });
  };
}

// ---------- versus: two sides, split screen ----------
// { template: 'versus', left: { who, label, mood, pose, line, color }, right: {...}, title, lineOn }
function versus(shot, ctx) {
  const sides = [shot.left || {}, shot.right || {}];
  return (t) => {
    const panels = sides.map((sd, i) => {
      const x0 = i * 640;
      // panel colours: palette names map to muted tints (a whole panel of pure red/blue is garish)
      const TINT = { red: '#c09a8f', blue: '#8fa3b5', green: '#a3b59a', gold: '#cdb98f', grey: '#b5b5ad', navy: '#8f97a8' };
      const bg = TINT[sd.color] || P[sd.color] || sd.color || (i === 0 ? '#8fa3b5' : '#c09a8f');
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
//   stamp: { text, on }, pencil: 'text to circle', pencilOn,
//   redact: ['phrase', ...] (black bars over those phrases), unredactOn (bars lift on that word),
//   classified: 'TOP SECRET' | 'DECLASSIFIED' (a red band across the top) }
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
    const liftAt = shot.unredactOn != null ? ctx.cue(shot.unredactOn, 1e9) : 1e9;
    // Redaction: the phrase is drawn with a thick ink outline that covers exactly its glyphs (the browser lays it out,
    // so it's exact for any font), and the outline fades when the bars lift.
    const docLine = (r, tt) => {
      const phrases = (shot.redact || []).filter((ph) => r.text.includes(ph));
      if (!phrases.length) return text(r.text, 400, r.y, { size: r.size, font: 'type' });
      const k = M.ease.inOut(M.prog(tt, liftAt, 0.5));
      const re = new RegExp(`(${phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
      const spans = r.text.split(re).map((part) => (phrases.includes(part)
        ? `<tspan stroke="${P.ink}" stroke-width="${n(r.size * 0.95)}" stroke-linejoin="round" stroke-opacity="${n(1 - k)}" paint-order="stroke">${ui.esc(part)}</tspan>`
        : ui.esc(part))).join('');
      return `<text x="400" y="${n(r.y)}" class="t-type" font-size="${r.size}" fill="${P.ink}" xml:space="preserve">${spans}</text>`;
    };
    const world = props.deskTop(4)
      + `<g filter="url(#softShadow)"><rect x="360" y="70" width="600" height="700" fill="${P.paper}" transform="rotate(-1.5 660 420)"/></g>`
      + `<g transform="rotate(-1.5 660 420)">`
      + (hl ? ui.highlight(396, hl.y - 4, Math.min(520, hl.text.length * hl.size * TYPE_EM), t, ctx.cue(shot.highlightOn, 0.6), { h: hl.size + 6 }) : '')
      + rows.map((r) => (r.text ? docLine(r, t) : '')).join('')
      + (pc ? ui.pencilCircle(400 + pc.text.indexOf(shot.pencil) * pc.size * TYPE_EM + shot.pencil.length * pc.size * 0.3, pc.y - pc.size * 0.35, shot.pencil.length * pc.size * 0.34 + 18, pc.size * 0.75, t, ctx.cue(shot.pencilOn, 1.2)) : '')
      + `<path d="M400 112 H900" stroke="${P.ink}" stroke-width="2"/>`
      + (shot.classified ? `<rect x="360" y="70" width="600" height="34" fill="${P.red}" opacity=".9"/>${text(shot.classified, 660, 95, { size: 24, font: 'display', fill: P.paper, anchor: 'middle', spacing: 4 })}` : '')
      + `</g>`
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
    // the number is on screen at the cut; a count runs from the cut and lands on its cue word
    const cue = ctx.cue(shot.on, shot.at ?? 0.3);
    const at = Math.min(cue, -0.1);
    let value = shot.value;
    if (typeof value === 'number') {
      const k = M.ease.out(M.prog(t, at, Math.max(shot.countDur || 1.1, cue - at)));
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
      ${text(shot.heading || (shot.rope === 'thread' ? 'THE RECORD' : 'THE FUSE'), 640, 110, { size: 54, font: 'display', fill: P.paper, anchor: 'middle', opacity: 0.9 })}
      ${text(shot.sub ?? (shot.rope === 'thread' ? '' : 'every point where someone could have cut it'), 640, 150, { size: 28, fill: P.paperDim, anchor: 'middle' })}`;
    return cam(board + dev.fuse({ x0, x1, base: 470, stops: stopDefs, end: shot.end ? { ...shot.end, at: endAt } : undefined, endStyle: shot.endStyle, rope: shot.rope, k, t }) + cards, { zoom: cameraZoom(shot.camera || 'locked', t, ctx) })
      + dev.tally(shot.tallyLabel || (shot.rope === 'thread' ? 'MISSED CHANCES' : 'CHANCES TO CUT IT'), reached, 930, 48, { w: 290 })
      + overlays(shot, t, ctx, { side: 'left' });
  };
}

// ---------- case: the investigation board (no fire; suits tragedies, mysteries, debates) ----------
// { template: 'case', heading, sub, cards: [{ title, lines, verdict: 'FALSE'|'UNPROVEN'|'STILL OPEN'|..., verdictColor, on, verdictOn }] }
// Cards pin up in order with red thread drawing between them; each verdict stamp slams on its own cue. Up to 6 cards.
function caseShot(shot, ctx) {
  const raw = shot.cards || [];
  const cards = raw.map((c, i) => ({ ...c, at: ctx.cue(c.on, c.at ?? 0.5 + i * 1.6), verdictAt: c.verdict ? ctx.cue(c.verdictOn, c.verdictAt ?? (c.on ? ctx.cue(c.on, 0.5 + i * 1.6) + 0.9 : 1.4 + i * 1.6)) : undefined }));
  return (t) => cam(dev.caseBoard({ heading: shot.heading, sub: shot.sub, cards, t }), { zoom: cameraZoom(shot.camera || 'locked', t, ctx) })
    + overlays(shot, t, ctx, { side: 'left' });
}

// ---------- pipes: two supply pipelines feeding one front (house device, like the fuse) ----------
// { template: 'pipes', heading, sub, a: { label, sub, on, share }, b: { label, sub, on, share }, front: { label, sub, on },
//   shut: [{ pipe: 'a'|'b', on, label }], level }
// The reservoir is there at the cut; each pipe draws on from its edge on its cue, its valve opens and the gauge rises;
// a shut turns that pipe's wheel, its flow stops and drains and the needle drops by its share.
function pipesShot(shot, ctx) {
  const a = shot.a || {}, b = shot.b || {}, fr = shot.front || {};
  const frontAt = ctx.cue(fr.on, fr.at ?? 0);
  const aAt = ctx.cue(a.on, a.at ?? 0.5);
  const bAt = ctx.cue(b.on, b.at ?? aAt + 1.8);
  const shut = (shot.shut || []).map((s) => ({ ...s, at: ctx.cue(s.on, s.at ?? Math.max(bAt + 3, ctx.dur - 2.5)) }));
  const view = { heading: shot.heading ?? 'TWO PIPES, ONE FRONT', sub: shot.sub, a: { ...a, at: aAt }, b: { ...b, at: bAt }, front: { ...fr, at: frontAt }, shut, level: shot.level };
  return (t) => cam(dev.pipes({ ...view, t }), { zoom: cameraZoom(shot.camera || 'locked', t, ctx) })
    + overlays(shot, t, ctx, { side: 'left' });
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
    labels: cueAll(v.labels), cities: cueAll(v.cities), arrows: cueAll(v.arrows), rings: cueAll(v.rings) };
  delete view.fit;
  const [fx, fy] = shot.focus ? maps.project(shot.focus[0], shot.focus[1], view) : [640, 360];
  const legend = (shot.legend || []).map((l) => ({ ...l, color: color(l.color) }));
  // "city": a stylised city-scale inset (illustrative, not a real street map) for places too small for the world map
  if (shot.city) {
    const city = { ...shot.city, pins: cueAll(shot.city.pins), at: ctx.cue(shot.city.on, shot.city.at ?? 0.3) };
    return (t) => cam(maps.cityPlate({ ...city, t }), { zoom: cameraZoom(shot.camera || 'creep', t, ctx) }) + overlays(shot, t, ctx, { side: 'right' });
  }
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
    const items = (shot.items || []).map((it, i) => {
      const fn = m[it.kind];
      if (!fn) return '';
      const cue = ctx.cue(it.on, it.at ?? -0.1);
      const at = i === 0 && cue > 0.15 ? 0.05 : cue; // the first graphic is there at the cut
      const args = (it.args || []).map((a) => (a === '$t' ? t : a === '$at' ? at : a));
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
const chapter = (shot, ctx) => (t) => ((shot.style || ctx.style.chapter) === 'script' ? ui.chapterScript(shot.label, shot.sub, t) : ui.chapterCard(shot.label, shot.sub, t));

// ---------- card: black narration card for pivot sentences (finance pack; works in war too) ----------
// { template: 'card', vo: '...', text: 'But there was a problem.' | lines: [{ text, on }], stack: false }
// Each line types in (~28 cps); a later line replaces the previous one unless stack: true.
function card(shot, ctx) {
  const lines = (shot.lines || [{ text: shot.text }]).map((l, i) => ({ text: l.text, at: ctx.cue(l.on, l.at ?? 0.35 + i * 1.6) }));
  // "by": attribution under a quote ("— David Faber, CNBC"), fades in after the last line
  const lastAt = lines.length ? lines[lines.length - 1].at : 0.3;
  return (t) => ui.blackCard(lines, t, { stack: !!shot.stack, size: shot.size || 58 })
    + (shot.by && t > lastAt + 0.6 ? text(shot.by, 640, 470, { size: 30, font: 'hand', fill: '#a9a49a', anchor: 'middle', opacity: M.clamp((t - lastAt - 0.6) * 3) }) : '')
    + (shot.stamp ? overlays({ stamp: shot.stamp, template: 'card' }, t, ctx) : '');
}

// ---------- kit templates: screen (lib/screens.js), data (lib/datakit.js), diagram (lib/diagrams.js) ----------
// { template: 'screen' | 'data' | 'diagram', kind: '<function name>', ...that function's fields }
// Word cues anywhere inside are converted to seconds: { on: 'word' } -> { at: s }, { likesOn: 'word' } -> { likesAt: s }.
// Fields that hold people (who) are resolved through the episode cast.
function resolveCues(obj, ctx) {
  if (Array.isArray(obj)) return obj.map((x) => resolveCues(x, ctx));
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'on') out.at = ctx.cue(v, obj.at ?? 0.4);
    else if (/On$/.test(k)) out[k.replace(/On$/, 'At')] = ctx.cue(v, obj[k.replace(/On$/, 'At')] ?? 0.4);
    else if (k === 'who' && typeof v === 'string' && ctx.cast && ctx.cast[v]) out.who = resolveCast(v, ctx);
    else out[k] = resolveCues(v, ctx);
  }
  return out;
}
const KIT_FILES = { screen: './screens', data: './datakit', diagram: './diagrams' };
// The kinds each kit offers (other exports are helpers).
const KIT_KINDS = {
  screen: ['socialPost', 'phoneNotification', 'browserArticle', 'appPage', 'newsLive', 'terminal', 'chatThread', 'email', 'videoPage', 'cctv', 'radar'],
  data: ['stockChart', 'rankingBoard', 'winnersLosers', 'calendarFlip', 'cheque', 'countUp', 'tickerChip', 'countDown', 'ledger', 'donut', 'dualChart', 'leverage'],
  diagram: ['equation', 'loop', 'funnel', 'orgTree', 'portraits', 'steps', 'split', 'montage', 'section'],
};
const KIT_SKIP = ['template', 'kind', 'vo', 'dur', 'minDur', 'tail', 'id', 'vignette', 'fill', 'stamp', 'tag', 'plate', 'stickers', 'stat', 'source', 'camera', 'note', '_t0'];

// split panels / montage frames may carry a whole sub-shot: { shot: { template: 'talk', ... }, at }.
// The sub-shot renders with its own clock starting at the panel's `at`.
function subShots(list, ctx) {
  return (list || []).map((p) => {
    if (!p.shot) return { ...p, render: null };
    const tpl = TEMPLATES[p.shot.template];
    if (!tpl) throw new Error(`sub-shot: unknown template "${p.shot.template}"`);
    const render = tpl(p.shot, { ...ctx, dur: ctx.dur });
    return { ...p, render };
  });
}

const OPEN_AT = -0.12; // entrances start just before the cut, so the first frames already show the graphic
const KEY_MOMENT = { browserArticle: 'highlightAt', socialPost: 'likesAt', email: 'sendAt', videoPage: 'viewsAt', cheque: 'signAt',
  leverage: 'moveAt', dualChart: 'splitAt', winnersLosers: 'verdictAt' };
const BUILD_LISTS = ['terms', 'nodes', 'stages', 'people', 'steps', 'rows', 'slices', 'cards', 'messages', 'lines', 'blips', 'items'];
function leadFirst(list) {
  if (Array.isArray(list) && list[0] && typeof list[0] === 'object' && typeof list[0].at === 'number' && list[0].at > 0.15) list[0] = { ...list[0], at: 0.05 };
  return list;
}
function kitTemplate(which) {
  return (shot, ctx) => {
    const kit = lazy(KIT_FILES[which]);
    if (!kit) throw new Error(`${KIT_FILES[which]}.js missing`);
    const fn = kit[shot.kind];
    if (!KIT_KINDS[which].includes(shot.kind) || typeof fn !== 'function') throw new Error(`${which}: unknown kind "${shot.kind}" (${KIT_KINDS[which].join(', ')})`);
    const spec = resolveCues(Object.fromEntries(Object.entries(shot).filter(([k]) => !KIT_SKIP.includes(k) && k !== 'panels' && k !== 'frames')), ctx);
    // The cut lands on content, never on an empty backdrop: the graphic is (almost) fully in at 0.2s. A cue on a later word
    // moves to the kind's key moment (the send, the signature, the split...) instead of delaying the whole graphic.
    if (spec.at == null || spec.at <= 0.6) spec.at = OPEN_AT;
    else if (KEY_MOMENT[shot.kind] && spec[KEY_MOMENT[shot.kind]] == null) { spec[KEY_MOMENT[shot.kind]] = spec.at; spec.at = OPEN_AT; }
    // builds (nodes, terms, rows, people...): the first element is there at the cut; the rest land on their words
    BUILD_LISTS.forEach((k) => leadFirst(spec[k]));
    if (spec.root && typeof spec.root.at === 'number' && spec.root.at > 0.15) spec.root = { ...spec.root, at: 0.05 };
    // Never hold a blank frame waiting for a cue word:
    if (shot.kind === 'countUp') {
      // big sums read as "$45 BILLION" / "$225 MILLION"; the count starts at the cut and lands on the spoken word
      if (typeof spec.value === 'number' && !shot.suffix && Math.abs(spec.value) >= 1e6) {
        const big = Math.abs(spec.value) >= 1e9 ? [1e9, ' BILLION'] : [1e6, ' MILLION'];
        spec.value = Math.round((spec.value / big[0]) * 10) / 10;
        spec.suffix = big[1];
      }
    }
    if (shot.kind === 'countUp' || shot.kind === 'countDown') {
      const land = spec.at;
      spec.at = Math.min(land, 0);
      if (shot.dur == null && land > 0.8) spec.dur = Math.max(1.2, land - spec.at + 0.3);
    }
    const panels = shot.panels ? subShots(resolveCues(shot.panels, ctx), ctx) : null;
    // montage frames without an `at` are spread evenly over the shot (no long hold on the last frame)
    const evenFrames = (shot.frames || []).map((f, i, all) => (f.at == null && f.on == null ? { ...f, at: (i * ctx.dur) / all.length } : f));
    const frames = shot.frames ? subShots(resolveCues(evenFrames, ctx), ctx) : null;
    const focus = which === 'diagram' && typeof fn.focus === 'function' ? fn.focus(spec) : null;
    const builds = focus && typeof kit.buildCamera === 'function' && !shot.camera;
    // builds with known element boxes get the follow camera: tight on what's there, widening as each element lands
    const els = builds && typeof fn.elements === 'function' && typeof kit.followCamera === 'function' ? fn.elements(spec) : null; // null: keep buildCamera
    // a stable room per shot (from its words), light rooms for data graphics that draw text straight onto the wall
    const roomSeed = [...String(shot.vo || shot.kind)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    return (t) => {
      lazy('./backdrops').use(roomSeed, { light: which === 'data' });
      const fill = (list) => list && list.map((p) => ({ ...p, svg: p.render ? p.render(Math.max(0, t - (p.at || 0))) : p.svg || '' }));
      const world = fn({ ...spec, ...(panels ? { panels: fill(panels) } : {}), ...(frames ? { frames: fill(frames) } : {}) }, t);
      const c = els ? kit.followCamera(t, ctx.dur, els, { title: spec.title }) : builds ? kit.buildCamera(t, ctx.dur, focus) : { zoom: cameraZoom(shot.camera || 'locked', t, ctx) };
      return cam(world, c) + overlays(shot, t, ctx, { side: 'left' });
    };
  };
}

// ---------- compose: free placement of props, people, text and stickers (metaphors, one-off scenes) ----------
// { template: 'compose', bg: 'board'|'paper'|'wall'|'desk'|'night'|<set name>, setOpts, front: true, light: [x, y],
//   items: [ { prop: 'cashStack', x, y, s, on, ...prop options },          // lib/propkit.js
//            { who: 'leo', x, y, s, mood, pose, poseOn, mood2, mood2On },   // a character standing at (x, y)
//            { text: 'Words', x, y, size, font, color, on },                 // plain text
//            { sticker: 'KEY PHRASE', x, y, on, color, rot, size } ] }       // a sticker
// Items appear on their cue with the standard pop; anchors are bottom-centre for props and people.
const COMPOSE_BG = {
  board: () => boardBg(),
  paper: () => `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${P.paper}"/>` + Array.from({ length: 30 }, (_, i) => `<path d="M-200 ${i * 40 - 180} H${W + 200}" stroke="${P.paperShade}" stroke-width="1" opacity=".5"/>`).join(''),
  wall: () => props.office(),
  desk: () => props.deskTop(4),
  night: () => props.nightSky(3) + props.skyline(11, 650, { color: '#253247', minH: 140, maxH: 330, lit: 0.06 }) + `<rect y="650" width="${W}" height="70" fill="#1a222e"/>`,
};
function compose(shot, ctx) {
  const kit = lazy('./propkit');
  const PROPS = (kit && kit.PROPS) || {};
  const items = (shot.items || []).map((it, i) => ({ ...it, at: ctx.cue(it.on, it.at ?? (i === 0 ? -0.1 : 0.2 + i * 0.5)) }));
  leadFirst(items);
  return (t) => {
    const set = sets()[shot.bg];
    const bg = set ? set.draw(t, shot.setOpts || {}) : (COMPOSE_BG[shot.bg || 'paper'] || COMPOSE_BG.paper)();
    const body = items.map((it, i) => {
      if (t < it.at) return '';
      const x = it.x ?? 640, y = it.y ?? 600;
      if (it.prop) {
        const fn = PROPS[it.prop];
        if (!fn) return '';
        const p = M.pop(t, it.at, 0.25);
        return `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${fn({ ...it, x, y }, t)}</g>`;
      }
      if (it.who) {
        const p = M.pop(t, it.at, 0.25);
        return `<g opacity="${n(p.o)}">${g(tr(x, y, it.s ?? 0.9), character(resolveCast(it.who, ctx), actor({ ...it, seed: i }, t, ctx)))}</g>`;
      }
      if (it.text) {
        const k = M.clamp((t - it.at) * 5);
        const fill = STICKER_COLORS[it.color] || P[it.color] || it.color || (['board', 'night'].includes(shot.bg || 'board') ? P.paper : P.ink);
        // plain text always gets a contrasting outline so it stays readable over any picture
        const m = /^#([0-9a-f]{6})$/i.exec(fill);
        const lum = m ? (0.299 * parseInt(m[1].slice(0, 2), 16) + 0.587 * parseInt(m[1].slice(2, 4), 16) + 0.114 * parseInt(m[1].slice(4, 6), 16)) / 255 : 0.3;
        const size = it.size || 40;
        const t1 = text(it.text, x, y, { size, font: it.font || 'hand', fill, anchor: it.anchor || 'middle' })
          .replace('<text ', `<text paint-order="stroke" stroke="${lum < 0.55 ? P.paper : P.ink}" stroke-width="${n(size * 0.16)}" stroke-linejoin="round" `);
        return `<g opacity="${n(k)}" data-qa="text" data-qn="text '${ui.esc(String(it.text).slice(0, 20))}'">${t1}</g>`;
      }
      if (it.sticker) return ui.sticker(it.sticker, x, y, t, it.at, { size: it.size || 34, rot: it.rot ?? (i % 2 ? 2 : -3), color: STICKER_COLORS[it.color] || P.red });
      return '';
    }).join('');
    const front = set && shot.front && set.front ? set.front(t, shot.setOpts || {}) : '';
    const light = Array.isArray(shot.light) ? ui.spotlight(shot.light[0], shot.light[1], { r: 300 }) : '';
    return cam(bg + body + front, { zoom: cameraZoom(shot.camera || 'creep', t, ctx) }) + light + overlays(shot, t, ctx, { side: 'left' });
  };
}

const TEMPLATES = { case: caseShot, compose, talk, versus, document: documentShot, chart, stat, fuse, pipes: pipesShot, map: mapShot, money, title, chapter, card,
  screen: kitTemplate('screen'), data: kitTemplate('data'), diagram: kitTemplate('diagram') };

module.exports = { TEMPLATES, MOODS, POSES, KIT_KINDS, wrap };
