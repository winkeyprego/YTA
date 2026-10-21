// Visual test of every set in lib/sets-history.js (and its variants) with cast on the spots.
// Render: node render.js episodes/test-sets-history --sheet 1.25 --scale 1

const { g, tr, camera } = require('../../lib/svg');
const M = require('../../lib/motion');
const { character, CAST } = require('../../lib/characters');
const { SETS } = require('../../lib/sets-history');
const ui = require('../../lib/ui');

// One shot = set + options + cast [[spot, castKey, state]]. Wide for the first half, the set's close framing after.
function setShot(name, cast, opts = {}, label = name, { close = true } = {}) {
  return {
    name: label,
    dur: 2.5,
    render(t) {
      const S = SETS[name];
      const people = cast.map(([spot, key, st], i) => {
        const [x, y, s] = S.spots[spot];
        return g(tr(x, y, s), character(CAST[key], { breathe: M.breathe(t, i), ...(st || {}) }));
      }).join('');
      const world = S.draw(t, opts) + people + S.front(t, opts);
      const cam = t < 1.25 || !close ? { zoom: 1 } : S.close;
      return camera(world, cam) + ui.dateTag(`SET · ${label}`, t, 0);
    },
  };
}

const calm = { brows: 'worried', mouth: 'flat' };
const shots = [
  setShot('skylineWTC', [['left', 'homeowner', calm], ['right', 'homeownerWoman']], {}, 'skylineWTC'),
  setShot('skylineWTC', [], { dusk: true }, 'skylineWTC dusk', { close: false }),
  setShot('skylineWTC', [], { night: true }, 'skylineWTC night', { close: false }),
  setShot('skylineWTC', [], { towers: false }, 'skylineWTC towers:false', { close: false }),
  setShot('skylineWTC', [['center', 'elderlyWoman', { eyes: 'sad', brows: 'worried' }]], { towers: false, light: true }, 'skylineWTC light'),
  setShot('pentagon', [], {}, 'pentagon'),
  setShot('memorial', [['left', 'elderly', { eyes: 'closed' }], ['right', 'homeownerWoman', calm]], {}, 'memorial'),
  setShot('memorial', [['center', 'crowdB', { eyes: 'sad' }]], { night: true }, 'memorial night'),
  setShot('fieldPA', [['center', 'elderly', calm]], {}, 'fieldPA'),
  setShot('controlRoom', [['left', 'analyst'], ['center', 'crowdA', { eyes: 'wide' }], ['right', 'trader']], { mapLabel: 'EN ROUTE TRAFFIC' }, 'controlRoom'),
  setShot('ovalOffice', [['center', 'politician', { mouth: 'flat' }], ['right', 'regulator']], {}, 'ovalOffice'),
  setShot('capitol', [['center', 'reporter', { holding: 'mic', armR: [150, 25] }]], {}, 'capitol'),
  setShot('courthouse', [['left', 'reporter', { holding: 'mic', armR: [150, 25] }], ['center', 'banker'], ['right', 'crowdA']], {}, 'courthouse'),
  setShot('cinema', [['center', 'founderTurtle', { mouth: 'smile', eyes: 'happy' }], ['right', 'crowdB']], { title: 'THE LONG DAY', festival: 'TRIBECA-STYLE FILM FEST' }, 'cinema'),
  setShot('cinemaInside', [['center', 'founderTurtle', { holding: 'mic', armR: [150, 25] }]], { title: 'THE LONG DAY' }, 'cinemaInside'),
  setShot('embassy', [['left', 'reporter', { holding: 'mic', armR: [150, 25] }], ['center', 'regulatorWoman']], { name: 'EMBASSY OF NORVALIA', flagColor: '#5f8a5a' }, 'embassy'),
  setShot('balcony', [['center', 'homeownerWoman', calm]], { skyline: 'wtc' }, 'balcony wtc'),
  setShot('balcony', [['center', 'homeowner']], { skyline: 'generic', time: 'dusk' }, 'balcony dusk', { close: false }),
  setShot('balcony', [['center', 'elderly', { eyes: 'sad' }]], { skyline: 'wtc', towers: false, light: true }, 'balcony wtc light', { close: false }),
  setShot('gulfSkyline', [['left', 'investor'], ['right', 'crowdC']], {}, 'gulfSkyline'),
];

module.exports = { fps: 24, shots };
