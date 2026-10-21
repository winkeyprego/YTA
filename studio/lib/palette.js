// The only colours the studio uses. Muted, slightly warm, printed-paper feel.
// Add new colours here (never inline hex in scenes) so every episode stays on-model.
module.exports = {
  ink: '#2b2622',        // all outlines, limbs, text
  inkSoft: '#55504a',    // secondary text
  paper: '#f3ecda',      // labels, cards, documents
  paperDim: '#e6dcc3',
  paperShade: '#d6cbb0',
  tape: '#e3d6a8',
  bubble: '#fbf8f1',     // speech bubbles
  skin: '#f4ecdc',
  blush: '#e8988f',

  red: '#b8392e',        // accents, danger, falling lines, stickers
  redDark: '#8e2a22',
  gold: '#e9c46a',       // highlighter, money, sparks
  goldDark: '#c99a3a',
  green: '#5f8a5a',      // money, "safe", rising
  greenDark: '#44663f',
  blue: '#4f6f8f',

  navy: '#3b4250',       // banker suits
  charcoal: '#3a3a3c',
  grey: '#a7adad',
  greyLight: '#c9cfcf',
  greyDark: '#6c7272',

  wall: '#9aa89e',       // default office wall (sage)
  wallDark: '#7c8a80',
  wallTrim: '#66736b',
  wood: '#8c5c3d',
  woodMid: '#7a4e33',
  woodDeep: '#6e4730',
  woodDark: '#3a2618',
  floor: '#6b5a4a',
  floorLine: '#5e4f41',

  night: '#1f2a3a',      // exteriors at night
  nightDeep: '#141c28',
  nightMid: '#2c3a4f',
  windowLit: '#f1d98a',
  windowDark: '#3a4659',
  moon: '#f4efd8',

  // skin tones, light -> deep (warm, natural). Use as spec.skin; hands follow it. Deep tones get blushDeep automatically.
  skin1: '#f6e2cc',
  skin2: '#ebc8a2',
  skin3: '#d6a67c',
  skin4: '#b98559',
  skin5: '#94613f',
  skin6: '#6a4330',
  blushDeep: '#a85b48',  // blush for skin4..skin6

  // uniforms & work clothes (lib/characters.js)
  olive: '#6b6f47',      // military uniform, service cap
  oliveDark: '#4f5236',
  policeNavy: '#2e3a4f', // police shirt and cap
  turnout: '#b59c66',    // firefighter turnout coat (tan)
  reflective: '#d9d77a', // reflective bands (muted hi-vis)
  flight: '#7d8a6a',     // flight suit (sage green)
  labWhite: '#f2f0ea',   // lab coat
  ivory: '#f7f2e6',      // wedding dress, veil
  silhouette: '#35302c', // the not-yet-revealed person (all-dark figure)

  // objects (lib/props-extra.js)
  water: '#6f8e96',      // sea / pool surface
  waterDark: '#587780',
  felt: '#3f6b4f',       // card table felt
  feltDark: '#33583f',
  scope: '#7fbf86',      // radar sweep / blips (phosphor green)
  scopeDark: '#17261d',  // radar screen background
  flightOrange: '#d27a3c', // flight recorder ("black box") orange
  vanWhite: '#ebe8df',   // plain white van, jet fuselage
  steel: '#8e979a',      // machines, breaker panels

  board: '#2f3a34',      // chalkboard / dark device backgrounds
  boardDark: '#232b27',
};
