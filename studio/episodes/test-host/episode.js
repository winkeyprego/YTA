// Host look test: hero build vs house build, moods, talking, wide and close.
const P = require('../../lib/palette');
const { g, tr, text, camera } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const { SETS } = require('../../lib/sets');

const MOODS = [
  ['neutral', { eyes: 'dot', brows: 'flat', mouth: 'neutral' }],
  ['smile', { eyes: 'dot', brows: 'raised', mouth: 'smile' }],
  ['smug', { eyes: 'smug', brows: 'smug', mouth: 'smirk' }],
  ['worried', { eyes: 'sad', brows: 'worried', mouth: 'frown' }],
  ['shocked', { eyes: 'wide', brows: 'raised', mouth: 'o' }],
  ['happy', { eyes: 'happy', brows: 'raised', mouth: 'smile' }],
];
const lineup = (who) => ({
  name: `lineup-${who}`,
  dur: 1,
  render: () => `<rect width="1280" height="720" fill="#e9e4d8"/>` + MOODS.map(([label, st], i) =>
    g(tr(110 + i * 212, 640, 0.95), character(CAST[who], { ...st, armL: [10, -6], armR: i === 1 ? [75, -35] : [10, -6] }))
    + text(label, 110 + i * 212, 690, { size: 24, anchor: 'middle' })).join('') + text(who, 30, 40, { size: 30 }),
});
const close = (who) => ({
  name: `close-${who}`,
  dur: 1.5,
  render: (t) => {
    const set = SETS.studioNews;
    const st = { eyes: 'dot', brows: 'raised', mouth: M.mouthCycle(t, 0.2, 1.4) || 'smile', armL: [12, -8], armR: [75, -35], breathe: M.breathe(t) };
    return camera(set.draw(t, { headline: 'MARKETS TODAY' }) + g(tr(640, 640, 1), character(CAST[who], st)) + set.front(t, {}), { zoom: 1.9, fx: 640, fy: 400, x: -130, y: -40 });
  },
});
module.exports = { fps: 24, shots: [lineup('host'), lineup('hostHouse'), close('host'), close('hostHouse')] };
