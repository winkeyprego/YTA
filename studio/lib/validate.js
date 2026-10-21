// Shot-list validator. Catches the mistakes that otherwise fail silently: unknown templates, sets,
// characters, moods or poses; misspelled fields; cue words that are not in the shot's narration;
// labels too long to fit; repetitive shots. Run automatically by lib/episode.js (errors stop the render),
// and printed by `node render.js episodes/<ep> --plan`.

const { tokens } = require('./timing');
const { CAST } = require('./characters');
const { MOODS, POSES } = require('./templates');

const lazy = (m) => { try { return require(m); } catch (e) { return {}; } };

const COMMON = ['template', 'vo', 'dur', 'minDur', 'tail', 'id', 'tag', 'plate', 'stickers', 'stat', 'source', 'camera', 'note'];
const FIELDS = {
  talk: ['set', 'setOpts', 'chars', 'frame', 'focus', 'focusXY', 'zoom', 'speaker', 'line', 'lineOn', 'lineAt', 'lineWidth', 'cps', 'speaking', 'lines', 'bubble', 'light', 'nameArrow'],
  versus: ['left', 'right', 'title'],
  document: ['lines', 'highlight', 'highlightOn', 'pencil', 'pencilOn', 'stamp'],
  chart: ['title', 'data', 'turn', 'turnLabel', 'riseOn', 'fallOn', 'change', 'xLabels', 'color', 'rising', 'drawDur'],
  stat: ['value', 'prefix', 'suffix', 'caption', 'on', 'at', 'set', 'setOpts', 'size', 'countDur'],
  fuse: ['heading', 'sub', 'stops', 'end', 'tallyLabel'],
  map: ['view', 'legend', 'legendOn', 'focus', 'fx', 'fy'],
  money: ['items', 'set', 'setOpts'],
  title: ['text', 'set', 'setOpts', 'size'],
  chapter: ['label', 'sub'],
  card: ['text', 'lines', 'stack', 'size'],
  screen: null, data: null, diagram: null, // kit templates: fields depend on `kind` (see the kit file's header)
};
const REQUIRED = {
  talk: ['chars'], versus: ['left', 'right'], document: ['lines'], chart: ['data'], stat: ['value'],
  fuse: ['stops'], map: ['view'], money: ['items'], title: ['text'], chapter: ['label'],
};
const CHAR_FIELDS = ['who', 'spot', 'mood', 'mood2', 'mood2On', 'mood2At', 'pose', 'poseOn', 'poseAt', 'pose2', 'pose2On', 'pose2At',
  'holding', 'carry', 'walk', 'walkAt', 'walkDur', 'look', 'tilt', 'seed'];
const HOLDING = ['phone', 'paper', 'money', 'mic', 'briefcase', 'sign'];
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
  if (!Array.isArray(spec.shots) || !spec.shots.length) return { errors: ['shots.json has no "shots" list'], warnings };

  Object.entries(spec.cast || {}).forEach(([k, c]) => {
    if (c && c.base && !CAST[c.base]) errors.push(`cast "${k}": unknown base "${c.base}"${suggest(c.base, Object.keys(CAST))}`);
  });

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
      else if (!kinds.includes(shot.kind)) errors.push(`${at}: unknown kind "${shot.kind}"${suggest(shot.kind, kinds)} (${kinds.join(', ')})`);
    }
    (REQUIRED[tpl] || []).forEach((k) => { if (shot[k] == null) errors.push(`${at}: missing "${k}"`); });

    const voToks = tokens(shot.vo);
    if (tpl !== 'chapter' && !shot.vo && !shot.dur) warnings.push(`${at}: no "vo" and no "dur". It will last 2s with the narration paused`);
    if (tpl === 'card' && !shot.text && !shot.lines) errors.push(`${at}: card needs "text" or "lines"`);
    if (spec.style && !['war', 'finance'].includes(spec.style) && i === 0) errors.push(`unknown style "${spec.style}" (war, finance)`);
    if (tpl === 'chapter' && shot.vo) warnings.push(`${at}: chapter cards normally have no "vo" (narration pauses for them)`);
    if (tpl === 'title' && voToks.length > 14) warnings.push(`${at}: ${voToks.length} words on a title card. Keep it under ~12 and move the rest to the next shot`);

    // every word cue must be in this shot's narration
    const checkCue = (where, cue) => {
      if (cue == null || typeof cue === 'number') return;
      const target = tokens(String(cue).split('#')[0]);
      const found = target.length && voToks.some((_, k) => target.every((w, m) => voToks[k + m] && (voToks[k + m] === w || voToks[k + m].startsWith(w) || w.startsWith(voToks[k + m]))));
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
      if (shot.frame && !['wide', 'close', 'reverse'].includes(shot.frame)) errors.push(`${at}: frame must be "wide", "close" or "reverse"`);
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
    if (tpl === 'fuse' && (shot.stops || []).length > 5) errors.push(`${at}: the fuse fits at most 5 stops`);
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
