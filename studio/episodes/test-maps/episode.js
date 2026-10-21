// Map kit test: three shots exercising lib/maps.js (world, Atlantic with arrow, Europe close-up).
const P = require('../../lib/palette');
const { camera } = require('../../lib/svg');
const M = require('../../lib/motion');
const ui = require('../../lib/ui');
const maps = require('../../lib/maps');

const EU = ['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Netherlands', 'Belgium', 'Austria', 'Portugal', 'Sweden', 'Denmark', 'Ireland', 'Czechia', 'Greece', 'Finland', 'Romania', 'Hungary'];

const world = {
  name: 'world',
  dur: 4,
  render(t) {
    const highlight = { 'United States of America': { color: P.blue, at: 0.3 }, China: { color: P.red, at: 0.9 } };
    EU.forEach((c, i) => { highlight[c] = { color: P.gold, at: 1.5 + i * 0.03 }; });
    const map = maps.mapView({
      t, center: [10, 22], zoom: 1.05, highlight, dim: true,
      labels: [
        { text: 'UNITED STATES', lon: -100, lat: 39, at: 0.5 },
        { text: 'CHINA', lon: 103, lat: 34, at: 1.1 },
        { text: 'EUROPE', lon: 14, lat: 56, at: 1.8 },
      ],
    });
    return camera(map, { zoom: M.creep(t) }) + ui.dateTag('THE BIG THREE · 2024', t, 0.1);
  },
};

const VIEW2 = { center: [-38, 45], zoom: 3.1 };
const atlantic = {
  name: 'atlantic',
  dur: 4,
  render(t) {
    const map = maps.mapView({
      t, ...VIEW2, highlight: { 'United States of America': { color: P.blue, at: 0.2 }, 'United Kingdom': { color: P.red, at: 0.6 } },
      cities: [{ name: 'New York', lon: -74.0, lat: 40.7, at: 0.5 }, { name: 'London', lon: -0.13, lat: 51.5, at: 1.0, side: 'left' }],
      arrows: [{ from: [-72.5, 41.8], to: [-2.5, 51.0], at: 1.4, dur: 0.9, color: P.gold, label: 'MONEY FLOWS EAST' }],
    });
    return camera(map, { zoom: M.creep(t) }) + ui.dateTag('NEW YORK → LONDON', t, 0.1);
  },
};

const VIEW3 = maps.fitTo(['Germany', 'France', 'Poland', 'Italy', 'United Kingdom'], { padding: 40 });
const berlin = maps.project(13.4, 52.5, VIEW3);
const europe = {
  name: 'europe',
  dur: 4.5,
  render(t) {
    const map = maps.mapView({
      t, ...VIEW3,
      highlight: { Germany: { color: P.charcoal, at: 0.3 }, Poland: { color: P.red, at: 0.8 } },
      hatch: { Czechia: { at: 1.4 } },
      labels: [{ text: 'GERMANY', lon: 10.2, lat: 51.0, at: 0.5, color: P.paper }, { text: 'POLAND', lon: 19.4, lat: 53.4, at: 1.0, color: P.paper }],
      cities: [{ name: 'Berlin', lon: 13.4, lat: 52.5, at: 0.6 }, { name: 'Warsaw', lon: 21.0, lat: 52.23, at: 1.1 }, { name: 'Paris', lon: 2.35, lat: 48.86, at: 1.6 }],
      arrows: [{ from: [11.2, 50.3], to: [18.8, 50.9], at: 2.0, dur: 0.8, color: P.grey, label: 'EAST' }],
    });
    return camera(map, { zoom: M.punch(t, 2.4, { rate: 0.08, dur: 2.1 }), fx: berlin[0], fy: berlin[1] })
      + ui.dateTag('EUROPE · 1939', t, 0.1)
      + maps.legend([{ color: P.charcoal, label: 'GERMANY' }, { color: P.red, label: 'POLAND' }, { hatch: true, label: 'ANNEXED' }], t, 0.4);
  },
};

module.exports = { fps: 24, shots: [world, atlantic, europe] };
