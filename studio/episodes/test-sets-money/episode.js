// Visual test of the newer sets in lib/sets.js (stage, weddingGarden, resort, dataCenter, carNight, classroom,
// podcast, airportGate, prisonExterior) and the new options on older sets (office night, hall neutral,
// home / studioNews tvHeadline + finance).
// Render: node render.js episodes/test-sets-money --sheet 1.25 --scale 1

const M = require('../../lib/motion');
const { g, tr, camera } = require('../../lib/svg');
const { character, CAST } = require('../../lib/characters');
const { SETS } = require('../../lib/sets');
const ui = require('../../lib/ui');

// One shot = set + cast list [[spot, castKey, state]] + setOpts. Wide for the first half, close-up for the second.
function setShot(name, cast, opts = {}, label = name) {
  return {
    name: label.replace(/[^a-z0-9]+/gi, '-'),
    dur: 2.5,
    render(t) {
      const S = SETS[name];
      const people = cast.map(([spot, key, st]) => {
        const [x, y, s] = S.spots[spot];
        return g(tr(x, y, s), character(CAST[key], { breathe: M.breathe(t), ...(st || {}) }));
      }).join('');
      const world = S.draw(t, opts) + people + S.front(t, opts);
      const cam = t < 1.25 ? { zoom: 1 } : S.close;
      return camera(world, cam) + ui.dateTag(`SET · ${label}`, t, 0);
    },
  };
}


const shots = [
  setShot('stage', [['center', 'ceo', { armR: [110, 20], mouth: 'open' }], ['left', 'founder']], { banner: 'CLASS OF 2024' }),
  setShot('stage', [['left', 'reporter', { holding: 'mic', armR: [150, 25] }], ['right', 'analyst'], ['farRight', 'investor', { mouth: 'smile' }]], { banner: 'FINTECH SUMMIT', panel: true }, 'stage panel'),
  setShot('weddingGarden', [['center', 'homeownerWoman', { eyes: 'happy', mouth: 'smile' }], ['left', 'homeowner', { mouth: 'grin' }], ['right', 'elderlyWoman']]),
  setShot('weddingGarden', [['center', 'banker', { mouth: 'smirk', eyes: 'smug' }], ['right', 'founderTurtle']], { dusk: true }, 'weddingGarden dusk'),
  setShot('resort', [['center', 'founder', { mouth: 'smirk', eyes: 'smug', armR: [60, -20] }], ['right', 'crowdB', { holding: 'phone', armR: [150, 30] }]]),
  setShot('dataCenter', [['center', 'analyst', { eyes: 'wide' }], ['right', 'worker', { holding: 'paper', armR: [40, -50] }]]),
  setShot('carNight', [['center', 'ceo', { eyes: 'sad', brows: 'worried', mouth: 'frown' }]]),
  setShot('classroom', [['center', 'regulatorWoman', { armR: [150, 20], mouth: 'open' }], ['left', 'child', { mouth: 'o' }], ['right', 'child', { eyes: 'happy' }]], { board: 'COMPOUND INTEREST\nA = P(1 + r)ⁿ' }),
  setShot('podcast', [['left', 'host', { mouth: 'grin', armL: [40, 20] }], ['right', 'trader', { mouth: 'smile' }]], {}, 'podcast'),
  setShot('podcast', [['left', 'founder', { mouth: 'open' }], ['right', 'investor', { eyes: 'smug' }]], { headphones: true }, 'podcast headphones'),
  setShot('airportGate', [['center', 'banker', { holding: 'briefcase', armR: [5, 0] }], ['left', 'elderly'], ['right', 'crowdA', { holding: 'phone', armR: [150, 30] }]]),
  setShot('prisonExterior', [['center', 'robberBaron', { brows: 'worried', mouth: 'frown' }], ['right', 'reporter', { holding: 'mic', armR: [150, 25], mouth: 'open' }]]),
  setShot('office', [['center', 'analyst', { eyes: 'sad' }], ['right', 'banker']], { night: true }, 'office night'),
  setShot('hall', [['center', 'ceo', { mouth: 'open' }], ['left', 'founder'], ['farRight', 'regulator', { holding: 'paper', armR: [40, -50] }]], { neutral: true }, 'hall neutral'),
  setShot('home', [['left', 'homeowner', { eyes: 'wide', mouth: 'o' }], ['center', 'homeownerWoman']], {}, 'home default'),
  setShot('home', [['center', 'homeownerWoman', { brows: 'worried' }]], { tvHeadline: 'Rates rise again' }, 'home tvHeadline'),
  setShot('home', [['center', 'homeowner', { brows: 'worried' }]], { finance: true }, 'home finance'),
  setShot('studioNews', [['center', 'reporter', { mouth: 'open' }]], { headline: 'TONIGHT' }, 'studioNews default'),
  setShot('studioNews', [['center', 'reporter', { mouth: 'open' }]], { tvHeadline: 'Election night special', headline: 'LIVE' }, 'studioNews tvHeadline'),
  setShot('studioNews', [['center', 'reporter', { mouth: 'open' }]], { finance: true, headline: 'MARKETS CRASH' }, 'studioNews finance'),
];

module.exports = { fps: 24, shots };
