// Storyboard compiler: the compact way to write an episode (STORYBOARD.md).
//
// episodes/<ep>/storyboard.txt is JSON Lines, one shot per line, referring to numbered beats from tools/beats.js
// instead of retyping narration. The compiler fills in each shot's `vo` from the beats, expands shorthands,
// adds framing/camera variety, and returns a normal shots.json spec (validated and rendered as usual).
//
//   # comment
//   {"style":"finance","cast":{"sbf":{"base":"founder","hair":"curly"}}}          <- header (no "t")
//   {"b":12,"t":"talk","set":"office","who":"sbf:center:smug>shocked@lost:present@genius","st":["GENIUS@genius"]}
//   {"b":"13-14","t":"data","k":"countUp","value":32000000000,"prefix":"$","caption":"VALUATION","on":"billion"}
//   {"t":"chapter","label":"The Fall","dur":2}                                       <- no beat: a card
//
// Shorthands (everything else passes straight through to the template):
//   t, k        template, kind
//   b           beat number or "a-b" range (vo = those beats' text)
//   who         "name:spot:mood:pose" or a list of them. mood may be "mood>mood2@word", pose may be "pose@word".
//   say         "line text@cueword": the first character says it (floating line or bubble per preset)
//   talk        ["name|line text@cue", ...]: a conversation (use with "f":"r" to cut to each speaker)
//   st          ["STICKER TEXT@word", "TEXT@word:ink", ...] (colour after the last colon: red ink gold green blue)
//   arrow       "Name@word": handwritten name + arrow pointing at the first character
//   f           "w" wide, "c" close, "r" reverse (conversation)
//   cam         camera: "locked", "creep", "punch@word", "push@word", "steps"

const fs = require('fs');
const path = require('path');

const COLORS = ['red', 'ink', 'gold', 'green', 'blue'];

function cueSplit(s) {
  const i = String(s).lastIndexOf('@');
  return i < 0 ? [String(s), null] : [String(s).slice(0, i), String(s).slice(i + 1)];
}

function parseWho(str) {
  const parts = String(str).split(':');
  // segments with "=" are extra fields: "leo:center:sad:idle:holding=phone,walk=out"
  const extras = {};
  const plain = parts.filter((p) => {
    if (!p.includes('=')) return true;
    p.split(',').forEach((kv) => { const [k, v] = kv.split('='); extras[k.trim()] = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v); });
    return false;
  });
  const [name, spot, mood, pose] = plain;
  const c = { who: name.trim(), ...extras };
  if (spot) c.spot = spot;
  if (mood) {
    const [m1, m2] = mood.split('>');
    c.mood = m1;
    if (m2) { const [mm, on] = cueSplit(m2); c.mood2 = mm; if (on) c.mood2On = on; }
  }
  if (pose) {
    const [p1, p2] = pose.split('>');
    const [pp, on] = cueSplit(p1);
    c.pose = pp; if (on) c.poseOn = on;
    if (p2) { const [q, on2] = cueSplit(p2); c.pose2 = q; if (on2) c.pose2On = on2; }
  }
  return c;
}

function subShorthand(list) {
  return (list || []).map((p) => {
    if (!p || !p.shot) return p;
    const sh = { ...p.shot };
    if (sh.t) { sh.template = sh.t; delete sh.t; }
    if (sh.k) { sh.kind = sh.k; delete sh.k; }
    if (sh.who) { sh.chars = (Array.isArray(sh.who) ? sh.who : [sh.who]).map(parseWho); delete sh.who; }
    return { ...p, shot: sh };
  });
}

function expand(line, beats, lineNo) {
  const s = { ...line };
  if (s.frames) s.frames = subShorthand(s.frames);
  if (s.panels) s.panels = subShorthand(s.panels);
  const out = {};
  if (s.t) { out.template = s.t; delete s.t; }
  if (s.k) { out.kind = s.k; delete s.k; }
  if (s.beat != null) { s.b = s.beat; delete s.beat; } // "beat" = "b", for kits with their own "b" field (dualChart)
  if (s.b != null && typeof s.b !== 'object') { // (an object "b" is a kit field, e.g. dualChart's second line)
    const [a, b] = String(s.b).split('-').map(Number);
    const list = beats.filter((x) => x.n >= a && x.n <= (b || a));
    if (!list.length) throw new Error(`storyboard ${lineNo}: beat "${s.b}" not found (beats.txt has 1-${beats.length})`);
    if (list.every((x) => x.pause)) { out.fill = +(list[list.length - 1].e - list[0].s).toFixed(2); out._pause = true; } // uses an existing silence
    else out.vo = list.filter((x) => !x.pause).map((x) => x.text).join(' ');
    out._beats = [a, b || a];
    const voiced = list.find((x) => !x.pause);
    if (voiced) out._t0 = voiced.s;
    delete s.b;
  }
  if (s.who) {
    out.chars = (Array.isArray(s.who) ? s.who : [s.who]).map(parseWho);
    delete s.who;
  }
  if (s.say) {
    const [text, on] = cueSplit(s.say);
    out.speaker = (out.chars || s.chars || [{}])[0].who;
    out.line = text; if (on) out.lineOn = on;
    delete s.say;
  }
  if (s.talk) {
    out.lines = s.talk.map((x) => {
      const [who, rest] = String(x).split('|');
      const [text, on] = cueSplit(rest || '');
      return { who: who.trim(), text: text.trim(), ...(on ? { on } : {}) };
    });
    delete s.talk;
  }
  if (s.st) {
    out.stickers = s.st.map((x) => {
      if (typeof x !== 'string') return x;
      let str = x, color;
      const m = str.match(/:(\w+)$/);
      if (m && COLORS.includes(m[1])) { color = m[1]; str = str.slice(0, -m[0].length); }
      const [text, on] = cueSplit(str);
      return { text, ...(on ? { on } : {}), ...(color ? { color } : {}) };
    });
    delete s.st;
  }
  if (s.arrow) {
    const [text, on] = cueSplit(s.arrow);
    out.nameArrow = { who: (out.chars || s.chars || [{}])[0].who, text, ...(on ? { on } : {}) };
    delete s.arrow;
  }
  if (s.f) { out.frame = { w: 'wide', c: 'close', r: 'reverse', F: 'full' }[s.f] || s.f; delete s.f; }
  if (s.cam) {
    const [mode, on] = cueSplit(s.cam);
    out.camera = on ? { mode, on } : mode;
    delete s.cam;
  }
  return { ...out, ...s };
}

// Variety for talk shots that don't specify framing/camera: alternate wide/close within a run on the same set,
// and rotate camera moves, so consecutive shots never look stamped from one template.
function vary(shots) {
  let run = 0;
  const camsWide = ['creep', 'locked', { mode: 'punch' }];
  shots.forEach((s, i) => {
    if (s.template !== 'talk') { run = 0; return; }
    const prev = shots[i - 1];
    run = prev && prev.template === 'talk' && prev.set === s.set ? run + 1 : 0;
    if (s.frame == null && !(s.lines && s.lines.length > 1)) s.frame = run % 2 === 1 ? 'close' : 'wide';
    if (s.camera == null) s.camera = s.frame === 'close' ? (i % 2 ? 'creep' : 'locked') : camsWide[i % camsWide.length];
  });
  return shots;
}

function compileStoryboard(dir) {
  const beatsFile = path.join(dir, 'beats.json');
  const beats = fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')) : [];
  // storyboard.txt, then any part files (storyboard.01.txt, storyboard.02.txt, ...) in name order, so several
  // people/agents can write chapters in parallel. Line numbers in messages are "file:line".
  const files = ['storyboard.txt', ...fs.readdirSync(dir).filter((f) => /^storyboard\..+\.txt$/.test(f)).sort()]
    .filter((f) => fs.existsSync(path.join(dir, f)));
  const lines = [];
  const origin = [];
  files.forEach((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, k) => { lines.push(l); origin.push(`${f}:${k + 1}`); }));
  let header = {};
  const shots = [];
  const lineOf = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) return;
    let obj;
    try { obj = JSON.parse(line); } catch (e) { throw new Error(`storyboard ${origin[i]} is not valid JSON: ${e.message}\n  ${line.slice(0, 160)}`); }
    if (!obj.t && !obj.template) {
      if (!origin[i].startsWith('storyboard.txt:')) throw new Error(`storyboard ${origin[i]}: a line without "t" is a header line, and headers belong only in storyboard.txt (part files hold shots only). Add "t" or move it.`);
      header = { ...header, ...obj }; return;
    }
    shots.push(expand(obj, beats, origin[i]));
    lineOf.push(origin[i]);
  });
  // every beat should be covered exactly once
  const covered = new Map();
  shots.forEach((s, k) => { if (s._beats) for (let b = s._beats[0]; b <= s._beats[1]; b++) covered.set(b, (covered.get(b) || []).concat(lineOf[k])); });
  const missing = beats.filter((b) => !covered.has(b.n)).map((b) => b.n);
  const isPause = new Set(beats.filter((b) => b.pause).map((b) => b.n));
  const doubled = [...covered.entries()].filter(([b, v]) => v.length > 1 && !isPause.has(b)).map(([b]) => b);
  const mixedMontage = shots.map((s, k) => (s.frames && s.frames.some((f) => f.at != null || f.on) && s.frames.some((f) => f.at == null && !f.on) ? lineOf[k] : null)).filter(Boolean);
  shots.forEach((s) => { delete s._beats; delete s._pause; });
  return { spec: { ...header, shots: vary(shots) }, lineOf, missing, doubled, mixedMontage };
}

module.exports = { compileStoryboard, parseWho };
