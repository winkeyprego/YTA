// Visual test of the WW2 Eastern Front sets in lib/sets-history.js (and their variants), empty and with cast on the spots.
// Render: node render.js episodes/test-sets-eastfront --sheet 1 --scale 0.5

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
  setShot('redSquare', [], {}, 'redSquare', { close: false }),
  setShot('redSquare', [['left', 'officer'], ['center', 'politician', { mouth: 'flat' }], ['right', 'worker', calm]], { tanks: true }, 'redSquare tanks'),
  setShot('redSquare', [], { snow: false, tanks: true }, 'redSquare snow:false tanks', { close: false }),
  setShot('kremlinStudy', [], {}, 'kremlinStudy', { close: false }),
  setShot('kremlinStudy', [['center', 'politician', { mouth: 'flat' }], ['left', 'officer', calm], ['right', 'officer']], {}, 'kremlinStudy cast'),
  setShot('kremlinStudy', [['center', 'politician']], { lamp: false }, 'kremlinStudy lamp:false', { close: false }),
  setShot('frontRoad', [], {}, 'frontRoad summer', { close: false }),
  setShot('frontRoad', [['left', 'officer'], ['right', 'worker', calm]], { trucks: true }, 'frontRoad trucks'),
  setShot('frontRoad', [], { season: 'winter', trucks: true }, 'frontRoad winter trucks', { close: false }),
  setShot('frontRoad', [['center', 'officer', calm], ['farRight', 'worker']], { season: 'winter' }, 'frontRoad winter cast'),
  setShot('arcticPort', [], {}, 'arcticPort', { close: false }),
  setShot('arcticPort', [['left', 'worker'], ['center', 'officer', { mouth: 'flat' }], ['right', 'politician', calm]], {}, 'arcticPort cast'),
  setShot('arcticPort', [], { ship: false, snow: false }, 'arcticPort ship:false snow:false', { close: false }),
];

module.exports = { fps: 24, shots };
