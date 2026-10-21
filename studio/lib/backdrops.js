// Illustrated rooms behind the graphics kits (screens, data, diagrams), so a chart or a phone sits IN a scene
// (a wall, a desk, a plant, a window) the way the reference videos do it, never on a flat grey card.
//
//   room(v, { desk: true })   full-frame room; v picks one of ROOMS (the kit template picks it per shot)
//   board(v, title, t)        the same room with a big framed paper board almost filling the frame (diagram builds)
//
// Everything decorative stays in the outer margins (x < 140, x > 1140, y < 40, y > 620) so it never covers content.
// Pure: no randomness beyond rng(seed); no time dependence except the clock hands.

const P = require('./palette');
const { n, text } = require('./svg');
const props = require('./props');

// wall, its darker shade, trim, desk wood, and what sits at the edges
const ROOMS = [
  { name: 'study', wall: P.wall, wallDark: P.wallDark, trim: P.wallTrim, desk: P.wood, deskDark: P.woodDeep, left: 'plant', right: 'window' },
  { name: 'evening', wall: P.nightMid, wallDark: P.night, trim: P.nightDeep, desk: P.woodMid, deskDark: P.woodDark, left: 'shelf', right: 'lamp', night: true },
  { name: 'office', wall: P.paperShade, wallDark: P.paperDim, trim: P.greyDark, desk: P.woodMid, deskDark: P.woodDeep, left: 'window', right: 'plant' },
  { name: 'den', wall: P.greyDark, wallDark: P.charcoal, trim: P.charcoal, desk: P.wood, deskDark: P.woodDark, left: 'shelf', right: 'clock', night: true },
  { name: 'warm', wall: P.tape, wallDark: P.paperShade, trim: P.woodMid, desk: P.wood, deskDark: P.woodDeep, left: 'clock', right: 'shelf' },
];
// Light rooms only, for kinds that draw dark text straight onto the background (counts, captions, bars).
const LIGHT = [0, 2, 4];

let current = 0;
// The kit template sets the room for the shot it's rendering (a stable pick per shot, so neighbours differ).
function use(v, { light = false } = {}) { const list = light ? LIGHT : ROOMS.map((_, i) => i); current = list[((v % list.length) + list.length) % list.length]; }

function edge(kind, side, R, t, deskY = 628) {
  const L = side === 'left';
  switch (kind) {
    case 'plant': return props.plant(L ? 70 : 1210, deskY + 12, { s: 1.15 });
    case 'window': {
      const x = L ? -150 : 1150;
      return `<g>${props.windowCity(x, 70, 290, 330, { night: !!R.night, seed: L ? 3 : 8 })}</g>`;
    }
    case 'shelf': return props.bookshelf(L ? -120 : 1150, 250, 250, 380, L ? 5 : 9);
    case 'lamp': return `<ellipse cx="${L ? 90 : 1190}" cy="${deskY - 28}" rx="260" ry="130" fill="${P.windowLit}" opacity=".10"/>` + props.deskLamp(L ? 90 : 1190, deskY + 12, { flip: !L, color: P.charcoal });
    case 'clock': return props.clock(L ? 70 : 1210, 110, t, { r: 40, hour: 10 });
    default: return '';
  }
}

function room(v = current, { desk = true, t = 0, deskY = 628, rail = true } = {}) {
  const R = ROOMS[((v % ROOMS.length) + ROOMS.length) % ROOMS.length];
  // wall with soft vertical wallpaper stripes and a chair rail, then the desk across the bottom
  let stripes = '';
  for (let x = -200; x < 1480; x += 48) stripes += `<rect x="${x}" y="-200" width="22" height="1200" fill="${R.wallDark}" opacity=".18"/>`;
  return `<rect x="-200" y="-200" width="1680" height="1120" fill="${R.wall}"/>${stripes}
    ${rail ? `<rect x="-200" y="${deskY - 108}" width="1680" height="400" fill="${R.wallDark}" opacity=".35"/>
    <path d="M-200 ${deskY - 108} H1480" stroke="${R.trim}" stroke-width="10"/>` : ''}
    ${edge(R.left, 'left', R, t, deskY)}${edge(R.right, 'right', R, t, deskY)}
    ${desk ? `<rect x="-200" y="${deskY}" width="1680" height="400" fill="${R.desk}"/>
      <path d="M-200 ${deskY} H1480" stroke="${P.ink}" stroke-width="4"/><path d="M-200 ${deskY + 22} H1480" stroke="${R.deskDark}" stroke-width="3" opacity=".7"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${-120 + i * 290} ${deskY + 40} q90 -6 180 0" stroke="${R.deskDark}" stroke-width="2" fill="none" opacity=".35"/>`).join('')}` : ''}
    <rect x="-200" y="-200" width="1680" height="1120" fill="url(#vignette)" opacity=".35"/>`;
}

// A framed paper board on the wall, nearly full-frame: diagram builds draw on it. At the end-of-build pull-back
// (zoom < 1) the frame, the wall and the desk edge show, so the diagram reads as a real board in a room.
function board(v = current, title = '', t = 0, { titleAt = 0 } = {}) {
  let grid = '';
  for (let x = 40; x < 1240; x += 40) grid += `M${x} 30 V690 `;
  for (let y = 40; y < 690; y += 40) grid += `M30 ${y} H1250 `;
  const tape = (x, y, r) => `<rect x="${x - 34}" y="${y - 11}" width="68" height="22" fill="${P.tape}" opacity=".85" transform="rotate(${r} ${x} ${y})"/>`;
  return room(v, { desk: true, t })
    + `<rect x="14" y="14" width="1252" height="692" rx="6" fill="${P.woodDeep}" stroke="${P.ink}" stroke-width="4"/>
    <rect x="28" y="28" width="1224" height="664" fill="${P.paper}"/>
    <path d="${grid}" stroke="${P.paperShade}" stroke-width="1.2" opacity=".6"/>
    <rect x="28" y="28" width="1224" height="664" fill="none" stroke="${P.ink}" stroke-width="2" opacity=".5"/>
    ${tape(60, 40, -8)}${tape(1220, 40, 7)}
    ${title && t >= titleAt ? text(title, 640, 84, { size: 52, font: 'script', anchor: 'middle', opacity: Math.min(1, Math.max(0, (t - titleAt) * 5)) }) : ''}`;
}

module.exports = { ROOMS, LIGHT, use, room, board, get current() { return current; } };
