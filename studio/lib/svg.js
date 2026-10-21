// SVG building blocks shared by every shot.
const P = require('./palette');

const W = 1280;
const H = 720;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 100) / 100;

const g = (attrs, ...children) => `<g ${attrs}>${children.join('')}</g>`;
const tr = (x, y, s = 1, r = 0) => `transform="translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)})"`;

// Text. `font` is one of: display (titles, big numbers), hand (tags, bubbles, stickers, plates),
// type (documents), serif (war chapter cards), script (finance dialogue, black cards, captions).
function text(str, x, y, { font = 'hand', size = 24, fill = P.ink, anchor = 'start', weight, spacing, opacity } = {}) {
  const extra = [
    weight ? `font-weight="${weight}"` : '',
    spacing != null ? `letter-spacing="${spacing}"` : '',
    opacity != null ? `opacity="${n(opacity)}"` : '',
  ].join(' ');
  return `<text x="${n(x)}" y="${n(y)}" class="t-${font}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(str)}</text>`;
}

// Approximate rendered width of a string, for sizing labels around text.
const FONT_EM = { display: 0.56, hand: 0.47, type: 0.6, serif: 0.62, script: 0.42 };
const textWidth = (str, size, font = 'hand') => String(str).length * size * (FONT_EM[font] || 0.5);

// Camera: zoom around a focus point plus a pan offset. Wrap the "world" layer of a shot in this;
// overlays (date tags, name plates, captions) stay outside so they don't move.
function camera(content, { zoom = 1, fx = W / 2, fy = H / 2, x = 0, y = 0, rot = 0 } = {}) {
  return `<g transform="translate(${n(fx + x)} ${n(fy + y)}) rotate(${n(rot)}) scale(${n(zoom)}) translate(${n(-fx)} ${n(-fy)})">${content}</g>`;
}

const DEFS = (seed) => `
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".25"/>
  </filter>
  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity=".3"/>
  </filter>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="6"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed}"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .018 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <!-- references: corners at ~0.6 of centre brightness -->
  <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
    <stop offset="45%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity=".55"/>
  </radialGradient>
  <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="10" height="10" fill="none"/><path d="M0 0 V10" stroke="${P.red}" stroke-width="3" opacity=".5"/>
  </pattern>
</defs>`;

// Wrap a finished shot. Grain is near-invisible on purpose (references show none measurable);
// it re-seeds 12x a second so flat fields don't band.
// vignette: true = war strength (corners ~0.6 of centre); a number 0..1 scales it (finance uses ~0.25, corners ~0.9).
function frame(content, t, { grain = true, vignette = true } = {}) {
  const seed = Math.floor(t * 12) % 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS(seed)}
<rect width="${W}" height="${H}" fill="${P.nightDeep}"/>
${content}
${vignette ? `<rect width="${W}" height="${H}" fill="url(#vignette)"${typeof vignette === 'number' ? ` opacity="${vignette}"` : ''}/>` : ''}
${grain ? `<rect width="${W}" height="${H}" filter="url(#grain)" fill="#fff"/>` : ''}
</svg>`;
}

module.exports = { W, H, esc, n, g, tr, text, textWidth, camera, frame };
