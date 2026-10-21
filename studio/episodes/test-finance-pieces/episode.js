// Library test: the `extrapolate` data kind (lib/datakit.js) through its whole build, the `staircase` prop
// (lib/props-extra.js via lib/propkit.js PROPS) climbing, and the costume pieces hat 'mortarboard' + outfit 'gown'.
// Render: node render.js episodes/test-finance-pieces --sheet 1 --scale 0.5
const P = require('../../lib/palette');
const { g, tr, text, n } = require('../../lib/svg');
const M = require('../../lib/motion');
const D = require('../../lib/datakit');
const { character } = require('../../lib/characters');
const { PROPS } = require('../../lib/propkit');

const fo = { vignette: 0.25 };
const shot = (name, dur, render) => ({ name, dur, render, frameOpts: fo });
const bg = (fill = '#e9e4d8') => `<rect width="1280" height="720" fill="${fill}"/><rect y="640" width="1280" height="80" fill="${P.paperShade}"/>`;

// props with the compose-style entrance pop at `at`
const popProp = (name, o, t) => {
  const at = o.at ?? 0;
  if (t < at) return '';
  const p = M.pop(t, at, 0.25);
  const x = o.x ?? 640, y = o.y ?? 600;
  return `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${PROPS[name]({ ...o, x, y }, t)}</g>`;
};

const grads = [
  ['gown + mortarboard', { outfit: 'gown', hat: 'mortarboard', hair: 'bob', hairColor: '#3a2d25', skin: P.skin3 }, { eyes: 'happy', mouth: 'grin', brows: 'raised' }],
  ['green gown, red stole', { outfit: 'gown', suit: P.greenDark, tie: P.red, hat: 'mortarboard', hatColor: P.charcoal, hair: 'side', hairColor: '#2f2a26', glasses: true, skin: P.skin5 }, { eyes: 'dot', mouth: 'smile', armR: [150, -40] }],
  ['seen from behind', { outfit: 'gown', hat: 'mortarboard', hair: 'side', hairColor: '#6b3f2a', skin: P.skin1 }, { back: true }],
];

module.exports = {
  fps: 24,
  shots: [
    // the full build: dots (0.3-1.8s), ruler (~2.2s), extension (~3.0s), target lands (~4.0s), doubt (5.0s)
    shot('extrapolate', 6, (t) => D.extrapolate({
      title: 'Grade level by age', yLabel: 'grade', at: 0.3,
      points: [[6, 1], [7, 2.4], [8, 3.6], [9, 5.2], [10, 6.4], [11, 8]],
      xLabels: ['AGE 6', 'AGE 7', 'AGE 8', 'AGE 9', 'AGE 10', 'AGE 11'],
      target: { label: 'PhD BY 16', sub: 'if the line holds' }, doubt: '?', doubtAt: 5.0,
    }, t)),
    // falling trend, word stamp, cue-squeezed dots (ruler at 1.4s)
    shot('extrapolate-falling', 4.6, (t) => D.extrapolate({
      title: 'Savings left', yLabel: '$ thousands', at: 0.2, rulerAt: 1.4, extendAt: 2.0,
      points: [[2019, 48], [2020, 41], [2021, 37], [2022, 29], [2023, 24]],
      xLabels: ['2019', '2020', '2021', '2022', '2023'],
      target: { label: 'BROKE BY 2027', sub: 'straight-line math' }, doubt: 'NOT SO FAST', doubtAt: 3.6,
    }, t)),
    // defaults only (no cues, no fields)
    shot('extrapolate-defaults', 5, (t) => D.extrapolate({}, t)),
    shot('staircase', 5, (t) => bg() + popProp('staircase', { x: 640, y: 640, at: 0.1, every: 1 }, t)
      + text('staircase', 30, 44, { size: 30 })),
    shot('staircase-plain', 3.5, (t) => bg('#dfe4dc') + popProp('staircase', { x: 640, y: 640, at: 0, every: 0.6, steps: ['SAVE', 'INVEST', 'COMPOUND', 'RETIRE', 'ESCAPE'] }, t)
      + text('staircase (5 steps, no numbers)', 30, 44, { size: 30 })),
    shot('graduates', 2, (t) => bg() + grads.map(([label, spec, st], i) => {
      const x = 640 + (i - 1) * 320;
      return g(tr(x, 620, 1), character(spec, { breathe: M.breathe(t, i), blink: M.blinking(t, i + 2), ...st }))
        + text(label, x, 684, { size: 30, anchor: 'middle' });
    }).join('') + text('gown + mortarboard', 30, 44, { size: 30 })),
  ],
};
