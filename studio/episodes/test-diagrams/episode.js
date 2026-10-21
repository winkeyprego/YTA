// Showcase for lib/diagrams.js (finance pack explainer builds).
const P = require('../../lib/palette');
const { camera } = require('../../lib/svg');
const D = require('../../lib/diagrams');

const FO = { vignette: 0.25 };
const build = (name, fn, spec, dur) => ({
  name, dur, frameOpts: FO,
  render: (t) => camera(fn(spec, t), D.buildCamera(t, dur, fn.focus ? fn.focus(spec) : [640, 360])),
});

const EQ = { title: 'How a bubble gets made', terms: [{ label: 'Cheap money', icon: 'cash', at: 0.4 }, { label: 'Hype', icon: 'rocket', at: 2.0 }], result: { label: 'Bubble', value: 'BUBBLE', at: 3.6, color: P.red } };
const EQ2 = { title: 'Buying on margin', terms: [{ label: 'Your cash', value: 100, at: 0.4, icon: 'cash' }, { label: 'Loan', emblem: 'BK', at: 1.9 }], result: { label: 'Buying power', value: 500, prefix: '$', at: 3.4, color: P.greenDark } };
const LOOP = { title: 'The margin-call spiral', center: 'repeat', nodes: [{ label: 'Prices fall', icon: 'chartDown', at: 0.4 }, { label: 'Margin call', emblem: '!', color: P.red, at: 1.9 }, { label: 'Forced selling', icon: 'cash', at: 3.4 }] };
const FUN = { title: 'Where the money went', stages: [{ label: 'Raised', value: 7300000000, prefix: '$', at: 0.4 }, { label: 'Spent on chips', value: 4100000000, prefix: '$', at: 2.0 }, { label: 'Left in the bank', value: 900000000, prefix: '$', at: 3.6 }] };
const TREE = { title: 'Who funds whom', root: { label: 'The startup', emblem: 'AI', at: 0.4 }, children: [
  { label: 'Big tech', emblem: 'BT', at: 1.8, children: [{ label: 'Cloud deal', icon: 'chip', at: 2.6 }, { label: 'Equity', icon: 'chartUp', at: 3.1 }] },
  { label: 'Investors', who: 'investor', at: 3.8, children: [{ label: 'VC fund', who: 'founder', at: 4.4 }] }] };
const PORT = { title: 'The people behind it', people: [{ who: 'founder', label: 'Founders', sub: 'ex-research lab', at: 0.4 }, { who: 'host', label: 'The host', sub: 'explains it all', at: 1.7 }, { who: 'ceo', label: 'Former CEO', sub: 'of a payments co.', at: 3.0 }, { who: 'investor', label: 'Big investors', sub: 'Wall Street', at: 4.3 }] };
const STEPS = { title: 'The playbook', steps: [{ label: 'Buy the picks and shovels', at: 0.4 }, { label: 'Short the victims', at: 2.2 }, { label: 'Wait for the crash', at: 4.0 }] };
const NOTES = { style: 'notes', title: 'Three rules', steps: [{ label: 'Never borrow to buy', at: 0.4 }, { label: 'Know what you own', at: 1.9 }, { label: 'Hype fades', at: 3.4 }] };

module.exports = {
  fps: 24,
  shots: [
    build('equation', D.equation, EQ, 6),
    build('equation-values', D.equation, EQ2, 5.5),
    build('loop', D.loop, LOOP, 6.5),
    build('funnel', D.funnel, FUN, 6),
    build('org-tree', D.orgTree, TREE, 6.5),
    build('portraits', D.portraits, PORT, 6.5),
    build('steps-book', D.steps, STEPS, 6.5),
    build('steps-notes', D.steps, NOTES, 5.5),
    { name: 'split', dur: 4.5, frameOpts: FO, render: (t) => D.split({ panels: [
      { svg: D.portraits({ people: [{ who: 'banker', label: 'Wall Street', at: 0 }] }, 9), label: 'Wall Street', at: 0 },
      { svg: D.equation(EQ, 9), label: 'The bubble', at: 1.2 },
      { bg: '#c9b8a8', svg: D.steps(NOTES, 9), label: 'Main Street', at: 2.4 }] }, t) },
    { name: 'montage', dur: 3, frameOpts: FO, render: (t) => D.montage({ flash: 0.3, frames: [
      D.equation(EQ, 9), D.loop(LOOP, 9), D.funnel(FUN, 9), D.orgTree(TREE, 9), D.portraits(PORT, 9), D.steps(NOTES, 9),
      D.equation(EQ2, 9), D.loop(LOOP, 9), D.funnel(FUN, 9)].map((svg) => ({ svg }))}, t) },
  ],
};
