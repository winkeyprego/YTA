// Visual test of every set in lib/sets.js with cast placed on its spots, plus money graphics.
// Render: node render.js episodes/test-sets --sheet 1.25 --scale 1

const P = require('../../lib/palette');
const { g, tr, text, camera, W, H } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const { SETS } = require('../../lib/sets');
const money = require('../../lib/money');
const ui = require('../../lib/ui');

const place = (set, spot, spec, state = {}) => {
  const [x, y, s] = SETS[set].spots[spot];
  return g(tr(x, y, s), character(spec, state));
};

// One shot = set + cast list [[spot, castKey, state]]. Wide for the first half, close-up for the second.
function setShot(name, cast, opts = {}, label = name) {
  return {
    name,
    dur: 2.5,
    render(t) {
      const S = SETS[name];
      const people = cast.map(([spot, key, st]) => place(name, spot, CAST[key], { breathe: M.breathe(t), ...(st || {}) })).join('');
      const world = S.draw(t, opts) + people + S.front(t, opts);
      const cam = t < 1.25 ? { zoom: 1 } : S.close;
      return camera(world, cam) + ui.dateTag(`SET · ${label}`, t, 0);
    },
  };
}

const shots = [
  setShot('office', [['center', 'ceo', { armL: [115, 10], mouth: 'smirk' }], ['left', 'analyst', { holding: 'paper', armR: [40, -60] }], ['right', 'investor', { eyes: 'wide', mouth: 'o' }]]),
  setShot('boardroom', [['farLeft', 'investor'], ['left', 'banker'], ['center', 'ceo', { mouth: 'open', armR: [100, 20] }], ['right', 'regulatorWoman'], ['farRight', 'oldBanker']]),
  setShot('tradingFloor', [['left', 'trader', { holding: 'phone', armR: [150, 30], mouth: 'open' }], ['center', 'trader', { brows: 'angry', mouth: 'grin', armL: [160, 10], armR: [160, 10] }], ['right', 'analyst', { eyes: 'wide' }]]),
  setShot('bankExterior', [['left', 'homeowner', { brows: 'worried', mouth: 'frown' }], ['center', 'homeownerWoman', { brows: 'worried' }], ['right', 'robberBaron', { mouth: 'smirk', eyes: 'smug' }]], { name: 'FIRST NATIONAL BANK' }, 'bankExterior'),
  setShot('towerNight', [['center', 'banker', { carry: 'box', eyes: 'sad', mouth: 'frown' }], ['right', 'reporter', { holding: 'mic', armR: [150, 25] }]], { name: 'LEHMAN BROTHERS', darkFrom: 0.2, darkTo: 2.4 }),
  setShot('streetDay', [['left', 'worker', { holding: 'briefcase', armR: [5, 0] }], ['center', 'child', { mouth: 'grin', eyes: 'happy' }], ['right', 'elderlyWoman', { holding: 'money', armR: [60, -30] }]]),
  setShot('home', [['left', 'homeowner', { mouth: 'open', eyes: 'wide' }], ['center', 'homeownerWoman', { holding: 'paper', armR: [50, -50], brows: 'worried' }], ['right', 'child']]),
  setShot('hall', [['center', 'ceo', { mouth: 'open', brows: 'worried' }], ['left', 'founder'], ['farRight', 'politician', { holding: 'paper', armR: [40, -50] }]]),
  setShot('courtroom', [['left', 'politician'], ['center', 'founderTurtle', { eyes: 'sad', brows: 'worried' }], ['right', 'elderly']], { judgeState: { brows: 'angry' } }),
  setShot('factory', [['left', 'worker', { armL: [70, 20] }], ['center', 'worker', { mouth: 'smile' }], ['right', 'ceo', { holding: 'briefcase' }]]),
  setShot('studioNews', [['center', 'reporter', { mouth: 'open' }], ['left', 'crowdA'], ['farRight', 'crowdB']], { headline: 'MARKETS CRASH' }),
  {
    name: 'money',
    dur: 4,
    render(t) {
      return `<rect width="${W}" height="${H}" fill="${P.wall}"/>`
        + money.cashStack(140, 360, 220, t, 0.2)
        + money.moneyBag(330, 360, { s: 1 })
        + money.coinPile(520, 360)
        + money.goldBars(720, 360)
        + money.piggyBank(960, 360, t, { shake: t > 2 ? 1 : 0 })
        + money.coinDrop(965, 238, t, 1.0)
        + money.banknote(1170, 220, { rot: -8 })
        + money.priceTag(1120, 320, '$99', t)
        + money.vault(200, 560, { r: 110, open: M.tween(t, 1, 2, 0, 1) })
        + money.stockBars([3, 4, 3.4, 5, 4.2, 6, 2.5], t, 0.5, { x: 420, y: 420, w: 360, h: 220 })
        + money.tickerBoard(820, 420, 420, 120, t)
        + money.moneyRain(t, 2.5, { x: 820, y: 540, w: 420, h: 160, count: 6 })
        + money.ticker('DOW −777 • LEHMAN FILES • AIG BAILOUT', t, { y: 674 })
        + ui.dateTag('MONEY GRAPHICS', t, 0);
    },
  },
];

module.exports = { fps: 24, shots };
