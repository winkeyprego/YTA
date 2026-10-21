// Shot-list validator. Catches the mistakes that otherwise fail silently: unknown templates, sets,
// characters, moods or poses; misspelled fields; cue words that are not in the shot's narration;
// labels too long to fit; repetitive shots. Run automatically by lib/episode.js (errors stop the render),
// and printed by `node render.js episodes/<ep> --plan`.

const { tokens, matchAt } = require('./timing');
const { CAST } = require('./characters');
const { MOODS, POSES } = require('./templates');

const lazy = (m) => { try { return require(m); } catch (e) { return {}; } };

const COMMON = ['template', 'vo', 'dur', 'minDur', 'tail', 'id', 'vignette', 'fill', 'stamp', 'tag', 'plate', 'stickers', 'stat', 'source', 'camera', 'note', '_t0'];
const FIELDS = {
  talk: ['set', 'setOpts', 'chars', 'frame', 'over', 'focus', 'focusXY', 'zoom', 'speaker', 'line', 'lineOn', 'lineAt', 'lineWidth', 'cps', 'speaking', 'lines', 'bubble', 'dialogue', 'light', 'nameArrow'],
  versus: ['left', 'right', 'title'],
  document: ['lines', 'highlight', 'highlightOn', 'pencil', 'pencilOn', 'stamp', 'redact', 'unredactOn', 'classified'],
  chart: ['title', 'data', 'turn', 'turnLabel', 'riseOn', 'fallOn', 'change', 'xLabels', 'color', 'rising', 'drawDur'],
  stat: ['value', 'prefix', 'suffix', 'caption', 'on', 'at', 'set', 'setOpts', 'size', 'countDur'],
  fuse: ['heading', 'sub', 'stops', 'end', 'tallyLabel', 'endStyle', 'rope'],
  case: ['heading', 'sub', 'cards'],
  pipes: ['heading', 'sub', 'a', 'b', 'front', 'shut', 'level', 'ground', 'feeds'],
  map: ['view', 'legend', 'legendOn', 'focus', 'fx', 'fy', 'city'],
  money: ['items', 'set', 'setOpts'],
  title: ['text', 'set', 'setOpts', 'size'],
  chapter: ['label', 'sub', 'style'],
  card: ['text', 'lines', 'stack', 'size', 'by'],
  compose: ['bg', 'setOpts', 'items', 'front', 'light'],
  screen: null, data: null, diagram: null, // kit templates: fields depend on `kind` (see the kit file's header)
};
// Kit fields come from each kit file's header, where every kind is documented as `//   name({ field, field: ..., })`
// (diagrams: `//   D.name({ ... }, t)`), so the docs and the check can't drift apart.
const KIT_FILE = { screen: './screens', data: './datakit', diagram: './diagrams' };
const kitCache = {};
function kitFields(tpl) {
  if (kitCache[tpl]) return kitCache[tpl];
  const out = {};
  const src = require('fs').readFileSync(require.resolve(KIT_FILE[tpl]), 'utf8');
  src.split('\n').forEach((line) => {
    const m = line.match(/^\/\/\s+(?:D\.)?(\w+)\(\{(.*)\}/);
    if (!m) return;
    const keys = [];
    let depth = 0, cur = '';
    for (const ch of m[2]) {
      if ('{['.includes(ch)) depth++;
      if ('}]'.includes(ch)) depth--;
      if (ch === ',' && depth === 0) { keys.push(cur); cur = ''; } else cur += ch;
    }
    keys.push(cur);
    const fields = keys.map((k) => (k.trim().match(/^(\w+)/) || [])[1]).filter(Boolean);
    // nested shapes documented as `rows: [{ date, name }]` or `a: { label, data }` are checked one level down
    fields.nested = {};
    keys.forEach((k) => {
      const n = k.trim().match(/^(\w+)\??:\s*(\[?\s*\{.*)$/);
      if (!n) return;
      const body = n[2].replace(/'[^']*'/g, '');
      fields.nested[n[1]] = [...new Set([...body.matchAll(/[{,|]\s*(\w+)\??(?=\s*[,}:|])/g)].map((x) => x[1]))];
    });
    out[m[1]] = fields;
  });
  return (kitCache[tpl] = out);
}
const REQUIRED = {
  versus: ['left', 'right'], document: ['lines'], chart: ['data'], stat: ['value'],
  fuse: ['stops'], case: ['cards'], pipes: ['a', 'b'], map: [], money: ['items'], title: ['text'], chapter: ['label'], compose: ['items'],
};
const CHAR_FIELDS = ['who', 'spot', 'mood', 'mood2', 'mood2On', 'mood2At', 'pose', 'poseOn', 'poseAt', 'pose2', 'pose2On', 'pose2At',
  'holding', 'carry', 'walk', 'walkAt', 'walkDur', 'look', 'tilt', 'seed', 'turn', 'turn2', 'turnOn', 'turnAt', 'sit', 'back'];
const HOLDING = require('./characters').FEATURES.holding || ['phone', 'paper', 'money', 'mic', 'briefcase', 'sign'];
const STICKER_FIELDS = ['text', 'on', 'at', 'x', 'y', 'rot', 'size', 'color', 'font'];

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}
const suggest = (x, list) => {
  const best = list.map((k) => [k, lev(String(x).toLowerCase(), k.toLowerCase())]).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] <= Math.max(2, String(x).length / 3) ? ` (did you mean "${best[0]}"?)` : '';
};

function validate(spec) {
  const errors = [];
  const warnings = [];
  const SETS = lazy('./sets').SETS || {};
  const money = lazy('./money');
  const castKeys = [...Object.keys(CAST), ...Object.keys(spec.cast || {})];
  // cast first, so a header-only storyboard (director's pass) can be validated on its own
  const { FEATURES } = require('./characters');
  const P = require('./palette');
  const ENUMS = FEATURES.enums || ['hair', 'outfit', 'hat', 'moustache', 'beard'];
  const castKeysAllowed = ['base', ...ENUMS, ...FEATURES.colors, ...FEATURES.flags, ...FEATURES.numbers, ...(FEATURES.strings || [])];
  Object.entries(spec.cast || {}).forEach(([k, c]) => {
    if (!c || typeof c !== 'object') { errors.push(`cast "${k}": must be an object like { "base": "ceo", "glasses": true }`); return; }
    if (c.base && !CAST[c.base]) errors.push(`cast "${k}": unknown base "${c.base}"${suggest(c.base, Object.keys(CAST))}`);
    if (!c.base && !c.outfit) warnings.push(`cast "${k}": no "base" or "outfit", so it will look like the default banker`);
    Object.entries(c).forEach(([f, v]) => {
      if (!castKeysAllowed.includes(f)) { errors.push(`cast "${k}": unknown feature "${f}"${suggest(f, castKeysAllowed)}`); return; }
      if (ENUMS.includes(f) && v != null && !FEATURES[f].includes(v)) {
        errors.push(`cast "${k}": ${f} "${v}" doesn't exist${suggest(v, FEATURES[f])} (${FEATURES[f].join(', ') || 'none yet'})`);
      }
      const range = (FEATURES.ranges || {})[f];
      if (range && v != null && (typeof v !== 'number' || v < range[0] || v > range[1])) {
        warnings.push(`cast "${k}": ${f} ${JSON.stringify(v)} should be a number from ${range[0]} to ${range[1]}`);
      }
      if (FEATURES.colors.includes(f) && typeof v === 'string' && !/^#[0-9a-f]{3,8}$/i.test(v) && !P[v]) {
        errors.push(`cast "${k}": ${f} "${v}" is not a hex colour or a palette name${suggest(v, Object.keys(P))}`);
      }
    });
  });
  if (!Array.isArray(spec.shots) || !spec.shots.length) {
    if (spec.cast && !errors.length) warnings.push('header OK: no shots yet');
    return { errors: errors.length ? errors : (spec.cast ? [] : ['no shots yet (and no cast)']), warnings };
  }

  spec.shots.forEach((shot, i) => {
    const at = `shot ${i + 1}${shot.template ? ` (${shot.template})` : ''}`;
    const tpl = shot.template;
    if (!(tpl in FIELDS)) { errors.push(`${at}: unknown template "${tpl}"${suggest(tpl, Object.keys(FIELDS))}`); return; }
    if (FIELDS[tpl]) {
      const allowed = [...COMMON, ...FIELDS[tpl]];
      Object.keys(shot).forEach((k) => { if (!allowed.includes(k)) warnings.push(`${at}: unknown field "${k}"${suggest(k, allowed)}. It will be ignored`); });
    } else {
      const kinds = require('./templates').KIT_KINDS[tpl];
      if (!shot.kind) errors.push(`${at}: missing "kind" (${kinds.join(', ')})`);
      else if (shot.kind === 'tickerChip') warnings.push(`${at}: tickerChip is a small overlay; on its own it leaves an almost empty frame. Use stockChart, or a montage of fuller frames`);
      if (shot.kind && !kinds.includes(shot.kind)) errors.push(`${at}: unknown kind "${shot.kind}"${suggest(shot.kind, kinds)} (${kinds.join(', ')})`);
      const sig = kitFields(tpl)[shot.kind];
      if (sig) {
        const allowed = [...COMMON, 'kind', 'panels', 'frames', 'on', ...sig, ...sig.filter((k) => k.endsWith('At')).map((k) => k.slice(0, -2) + 'On')];
        Object.keys(shot).forEach((k) => { if (!allowed.includes(k)) warnings.push(`${at}: ${shot.kind} has no field "${k}"${suggest(k, sig)} (it takes ${sig.join(', ')}). It will be ignored`); });
        Object.entries(sig.nested).forEach(([key, sub]) => {
          const okSub = [...sub, 'on', ...(key === 'frames' || key === 'panels' ? ['shot'] : []), ...sub.filter((k) => k.endsWith('At')).map((k) => k.slice(0, -2) + 'On')];
          const list = Array.isArray(shot[key]) ? shot[key] : shot[key] && typeof shot[key] === 'object' ? [shot[key]] : [];
          const bad = new Set();
          list.forEach((o) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).forEach((k) => { if (!okSub.includes(k)) bad.add(k); }));
          bad.forEach((k) => warnings.push(`${at}: ${shot.kind} ${key} has no field "${k}"${suggest(k, sub)} (${key} takes ${sub.join(', ')}). It will be ignored`));
        });
      }
    }
    (REQUIRED[tpl] || []).forEach((k) => { if (shot[k] == null) errors.push(`${at}: missing "${k}"`); });

    if (shot.set === 'pentagon' && (shot.chars || []).length) warnings.push(`${at}: "pentagon" is an aerial view; people would be out of scale. Use it with no chars (add a tag or plate instead)`);
    if (shot.set === 'carNight' && (shot.chars || []).some((c) => c.spot && c.spot !== 'center')) warnings.push(`${at}: "carNight" only has the center spot (the back-seat passenger)`);
    const voToks = tokens(shot.vo);
    if (tpl !== 'chapter' && !shot.vo && !shot.dur && !shot.fill) warnings.push(`${at}: no "vo" and no "dur". It will last 2s with the narration paused`);
    if (tpl === 'card' && !shot.text && !shot.lines) errors.push(`${at}: card needs "text" or "lines"`);
    if (spec.style && !['war', 'finance'].includes(spec.style) && i === 0) errors.push(`unknown style "${spec.style}" (war, finance)`);
    if (tpl === 'chapter' && shot.vo) warnings.push(`${at}: chapter cards normally have no "vo" (narration pauses for them)`);
    if (tpl === 'title' && voToks.length > 14) warnings.push(`${at}: ${voToks.length} words on a title card. Keep it under ~12 and move the rest to the next shot`);

    // every word cue must be in this shot's narration
    const checkCue = (where, cue) => {
      if (cue == null || typeof cue === 'number') return;
      const target = tokens(String(cue).split('#')[0]);
      const found = target.length && matchAt(voToks, target) >= 0;
      if (!found) errors.push(`${at}: ${where} cue "${cue}" is not in this shot's vo`);
    };
    const walkCues = (o, path) => {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        if (k === 'on' || /On$/.test(k)) checkCue(`${path}${k}`, v);
        else if (v && typeof v === 'object' && k !== 'data') walkCues(v, Array.isArray(o) ? `${path.replace(/\.$/, '')}[${k}].` : `${path}${k}.`);
      }
    };
    walkCues(shot, '');

    // sets, spots, characters
    if (shot.set && !SETS[shot.set]) errors.push(`${at}: unknown set "${shot.set}"${suggest(shot.set, Object.keys(SETS))}`);
    if (tpl === 'talk' && !shot.set) warnings.push(`${at}: no "set" given, so it defaults to "office"`);
    const set = SETS[shot.set || 'office'];
    (shot.chars || []).forEach((c, k) => {
      const ca = `${at} chars[${k}]`;
      Object.keys(c).forEach((f) => { if (!CHAR_FIELDS.includes(f)) warnings.push(`${ca}: unknown field "${f}"${suggest(f, CHAR_FIELDS)}`); });
      if (!castKeys.includes(c.who)) errors.push(`${ca}: unknown character "${c.who}"${suggest(c.who, castKeys)}`);
      if (c.spot && set && !set.spots[c.spot]) errors.push(`${ca}: set "${shot.set}" has no spot "${c.spot}" (has: ${Object.keys(set.spots).join(', ')})`);
      ['mood', 'mood2'].forEach((f) => { if (c[f] && !MOODS[c[f]]) errors.push(`${ca}: unknown ${f} "${c[f]}"${suggest(c[f], Object.keys(MOODS))}`); });
      ['pose', 'pose2'].forEach((f) => { if (c[f] && !POSES[c[f]]) errors.push(`${ca}: unknown ${f} "${c[f]}"${suggest(c[f], Object.keys(POSES))}`); });
      if (c.holding && !HOLDING.includes(c.holding)) errors.push(`${ca}: unknown holding "${c.holding}" (${HOLDING.join(', ')})`);
    });
    if (tpl === 'talk') {
      const spots = (shot.chars || []).map((c) => c.spot || 'center');
      const dup = spots.find((s, k) => spots.indexOf(s) !== k);
      if (dup) errors.push(`${at}: two characters on spot "${dup}"`);
      if (shot.speaker && !(shot.chars || []).some((c) => c.who === shot.speaker)) errors.push(`${at}: speaker "${shot.speaker}" is not in chars`);
      if (shot.line && !shot.speaker) errors.push(`${at}: "line" needs a "speaker"`);
      if (shot.line && shot.line.length > 90) warnings.push(`${at}: bubble line is ${shot.line.length} characters. Keep bubbles under ~90`);
      if (shot.frame && !['wide', 'full', 'close', 'reverse', 'ots'].includes(shot.frame)) errors.push(`${at}: frame must be "wide", "full", "close", "reverse" or "ots"`);
      if (shot.frame === 'ots' && (shot.chars || []).length < 2) errors.push(`${at}: frame "ots" (over the shoulder) needs two people`);
      (shot.lines || []).forEach((l, k) => {
        if (!l.text) errors.push(`${at} lines[${k}]: missing "text"`);
        if (!(shot.chars || []).some((c) => c.who === (l.who || shot.speaker))) errors.push(`${at} lines[${k}]: speaker "${l.who}" is not in chars`);
      });
      if (shot.frame === 'reverse' && !(shot.lines || []).length) errors.push(`${at}: frame "reverse" needs a conversation in "lines"`);
      if (shot.nameArrow && !(shot.chars || []).some((c) => c.who === shot.nameArrow.who)) errors.push(`${at}: nameArrow.who "${shot.nameArrow.who}" is not in chars`);
    }
    ['left', 'right'].forEach((side) => {
      const sd = shot[side];
      if (tpl === 'versus' && sd && sd.who && !castKeys.includes(sd.who)) errors.push(`${at} ${side}: unknown character "${sd.who}"${suggest(sd.who, castKeys)}`);
    });
    (shot.stickers || []).forEach((st, k) => {
      Object.keys(st).forEach((f) => { if (!STICKER_FIELDS.includes(f)) warnings.push(`${at} stickers[${k}]: unknown field "${f}"${suggest(f, STICKER_FIELDS)}`); });
      if (!st.text) errors.push(`${at} stickers[${k}]: missing "text"`);
      else if (st.text.length > 26) warnings.push(`${at} stickers[${k}]: "${st.text}" is long (${st.text.length} chars). Stickers read best under ~22`);
    });
    if ((shot.stickers || []).length > 3) warnings.push(`${at}: ${shot.stickers.length} stickers. More than 3 crowds the frame`);
    if (tpl === 'compose') {
      const PROPS = (lazy('./propkit').PROPS) || {};
      const bgs = ['board', 'paper', 'wall', 'desk', 'night', 'sky', ...Object.keys(SETS)];
      if (shot.bg && !bgs.includes(shot.bg)) errors.push(`${at}: unknown bg "${shot.bg}"${suggest(shot.bg, bgs)}`);
      (shot.items || []).forEach((it, k) => {
        if (it.prop && !PROPS[it.prop]) errors.push(`${at} items[${k}]: unknown prop "${it.prop}"${suggest(it.prop, Object.keys(PROPS))}`);
        if (it.who && !castKeys.includes(it.who)) errors.push(`${at} items[${k}]: unknown character "${it.who}"${suggest(it.who, castKeys)}`);
        if (!it.prop && !it.who && !it.text && !it.sticker) errors.push(`${at} items[${k}]: needs one of prop, who, text or sticker`);
        ['mood', 'mood2'].forEach((f) => { if (it[f] && !MOODS[it[f]]) errors.push(`${at} items[${k}]: unknown ${f} "${it[f]}"${suggest(it[f], Object.keys(MOODS))}`); });
        ['pose', 'pose2'].forEach((f) => { if (it[f] && !POSES[it[f]]) errors.push(`${at} items[${k}]: unknown ${f} "${it[f]}"${suggest(it[f], Object.keys(POSES))}`); });
      });
    }
    if (tpl === 'map' && !shot.view && !shot.city) errors.push(`${at}: map needs "view" (world map) or "city" (city inset)`);
    if (tpl === 'case' && (shot.cards || []).length > 6) errors.push(`${at}: the case board fits at most 6 cards`);
    if (tpl === 'fuse' && shot.endStyle && !['bomb', 'card', 'flag'].includes(shot.endStyle)) errors.push(`${at}: endStyle must be bomb, card or flag`);
    if (tpl === 'fuse' && shot.rope && !['fuse', 'thread'].includes(shot.rope)) errors.push(`${at}: rope must be fuse or thread`);
    if (tpl === 'fuse' && (shot.stops || []).length > 5) errors.push(`${at}: the fuse fits at most 5 stops`);
    if (tpl === 'pipes') {
      const PIPE_SUB = { a: ['label', 'sub', 'on', 'at', 'share', 'open', 'widen', 'off'], b: ['label', 'sub', 'on', 'at', 'share', 'open', 'widen', 'off'],
        front: ['label', 'sub', 'on', 'at'], ground: ['label', 'on', 'at'] };
      Object.entries(PIPE_SUB).forEach(([key, okSub]) => {
        const v = shot[key];
        if (v == null) return;
        if (typeof v !== 'object' || Array.isArray(v)) { errors.push(`${at}: "${key}" must be an object like { "label": "...", "sub": "...", "on": "word" }`); return; }
        Object.keys(v).forEach((k) => { if (!okSub.includes(k)) warnings.push(`${at}: ${key} has no field "${k}"${suggest(k, okSub)} (${key} takes ${okSub.join(', ')}). It will be ignored`); });
        if (v.share != null && !(v.share >= 0 && v.share <= 1)) errors.push(`${at}: ${key}.share must be between 0 and 1`);
      });
      if (shot.shut != null && !Array.isArray(shot.shut)) errors.push(`${at}: "shut" must be a list like [{ "pipe": "b", "on": "word" }]`);
      (Array.isArray(shot.shut) ? shot.shut : []).forEach((s, k) => {
        if (!s || !['a', 'b'].includes(s.pipe)) errors.push(`${at} shut[${k}]: "pipe" must be "a" or "b"`);
        Object.keys(s || {}).forEach((f) => { if (!['pipe', 'on', 'at', 'label'].includes(f)) warnings.push(`${at} shut[${k}]: unknown field "${f}"${suggest(f, ['pipe', 'on', 'at', 'label'])}. It will be ignored`); });
      });
      if (shot.level != null && !(shot.level >= 0 && shot.level <= 1)) errors.push(`${at}: "level" must be between 0 and 1`);
      ['a', 'b'].forEach((key) => {
        const v = shot[key] || {};
        if (v.open != null && !(v.open >= 0 && v.open <= 1)) errors.push(`${at}: ${key}.open must be between 0 and 1`);
        if (v.widen != null && (typeof v.widen !== 'object' || !(v.widen.to >= 0 && v.widen.to <= 1))) errors.push(`${at}: ${key}.widen must be like { "to": 0.8, "on": "word" }`);
      });
      if (shot.a && shot.a.off && shot.b && shot.b.off) errors.push(`${at}: both pipes are "off"`);
      if (shot.feeds != null && (!Array.isArray(shot.feeds) || shot.feeds.length > 3)) errors.push(`${at}: "feeds" must be a list of up to 3 like [{ "label": "...", "sub": "...", "on": "word" }]`);
      (Array.isArray(shot.feeds) ? shot.feeds : []).forEach((f, k) => Object.keys(f || {}).forEach((x) => { if (!['label', 'sub', 'on', 'at'].includes(x)) warnings.push(`${at} feeds[${k}]: unknown field "${x}"${suggest(x, ['label', 'sub', 'on', 'at'])}. It will be ignored`); }));
    }
    if (tpl === 'chart' && (!Array.isArray(shot.data) || shot.data.length < 2)) errors.push(`${at}: chart needs at least 2 data points`);
    if (tpl === 'money') (shot.items || []).forEach((it, k) => { if (!money[it.kind]) errors.push(`${at} items[${k}]: unknown money kind "${it.kind}"${suggest(it.kind, Object.keys(money))}`); });
  });

  // variety
  for (let i = 3; i < spec.shots.length; i++) {
    const run = spec.shots.slice(i - 3, i + 1);
    const key = (s) => s.template + (s.kind ? `:${s.kind}` : '');
    if (run.every((s) => key(s) === key(run[0]) && s.template !== 'talk')) warnings.push(`shots ${i - 2}-${i + 1}: four "${key(run[0])}" shots in a row. Vary the visuals`);
    if (run.every((s) => s.set && s.set === run[0].set)) warnings.push(`shots ${i - 2}-${i + 1}: four shots on the "${run[0].set}" set in a row. Cut away (chart, document, stat, map)`);
  }
  if (!spec.shots[0].tag) warnings.push('shot 1: the opening shot has no date tag. Cold opens start on a place and time');
  return { errors, warnings };
}

module.exports = { validate };
