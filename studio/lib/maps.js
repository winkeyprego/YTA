// Map kit: real geography drawn in the studio style (paper ocean, flat muted land, ink borders,
// flat-colour highlights, hand-lettered labels, growing arrows, legend box).
//
// Data: Natural Earth (public domain) via the `world-atlas` package (ISC), vendored in data/.
// No runtime dependencies: TopoJSON decoding and a Mercator projection are implemented here.
//
// Usage (inside a shot's render(t)):
//
//   const maps = require('../../lib/maps');
//   const view = maps.fitTo(['Germany', 'France', 'Poland'], { padding: 80 });   // or { center: [lon, lat], zoom }
//   const world = maps.mapView({
//     t, ...view,
//     highlight: { Germany: { color: P.charcoal, at: 0.4 }, Poland: P.red },   // name or ISO numeric id
//     hatch: { Czechia: { at: 1.2 } },
//     dim: true,                                                                // mute everything else
//     labels: [{ text: 'GERMANY', lon: 10.4, lat: 51.2, at: 0.6 }],
//     cities: [{ name: 'Berlin', lon: 13.4, lat: 52.5, at: 0.8 }],
//     arrows: [{ from: [13.4, 52.5], to: [21, 52.2], at: 1.5, dur: 0.8, label: 'INVASION' }],
//   });
//   const [x, y] = maps.project(13.4, 52.5, view);   // pin a sticker to Berlin
//   return camera(world, { zoom: M.punch(t, 2.5, { rate: 0.08, dur: 2.5 }), fx: x, fy: y })
//     + maps.legend([{ color: P.charcoal, label: 'GERMANY' }, { color: P.red, label: 'POLAND' }], t, 0.3);
//
// View: center = [lon, lat] (screen centre), zoom = 1 shows 360° of longitude across 1280 px
// (whole world); zoom 4 ≈ a continent, 10 ≈ a country the size of Germany.
// For pushes and pans, prefer wrapping a STATIC view in camera(): projected land paths are cached
// per view, so a static view costs almost nothing per frame.

const P = require('./palette');
const { W, H, n, text } = require('./svg');
const { pop, prog, ease, clamp } = require('./motion');

// Map-only colours, derived from the palette (candidates for palette.js: ocean, oceanLine, land, landDim).
const C = {
  ocean: '#a3b6ba',      // soft blue-grey paper
  oceanLine: '#93a8ad',  // graticule / coast halo
  land: P.paperDim,      // flat muted land
  landDim: P.paperShade, // land when others are highlighted
  border: P.ink,
};

// ---------- data ----------
const DATA = {};
function dataset(res) {
  if (DATA[res]) return DATA[res];
  const topo = require(`../data/countries-${res}.json`);
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
  const ring = (idx) => {
    const out = [];
    for (const i of idx) {
      const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
      for (let k = out.length ? 1 : 0; k < a.length; k++) out.push(a[k]);
    }
    return out;
  };
  const countries = topo.objects.countries.geometries
    .filter((g) => g.id !== '010' && g.arcs) // skip Antarctica (wraps the pole)
    .map((g) => {
      const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
      const polygons = polys.map((p) => p.map(ring));
      return { id: g.id, name: g.properties.name, polygons };
    });
  const byKey = new Map();
  for (const c of countries) { byKey.set(c.name.toLowerCase(), c); if (c.id) byKey.set(String(c.id), c); }
  DATA[res] = { countries, byKey };
  return DATA[res];
}

const ALIASES = { usa: 'united states of america', 'united states': 'united states of america', us: 'united states of america',
  uk: 'united kingdom', britain: 'united kingdom', 'great britain': 'united kingdom', russia: 'russia', ussr: 'russia',
  'czech republic': 'czechia', 'south korea': 'south korea', 'north korea': 'north korea', uae: 'united arab emirates' };

function findCountry(key, res = '50m') {
  const d = dataset(res);
  const k = String(key).toLowerCase();
  return d.byKey.get(k) || d.byKey.get(ALIASES[k] || '') || d.byKey.get(String(key).padStart(3, '0'));
}

// ---------- projection ----------
const RAD = Math.PI / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + clamp(lat, -85, 85) * RAD / 2));
const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

function viewOf(v) {
  const k = (W / (2 * Math.PI)) * (v.zoom || 1);
  return { lon0: v.center[0], y0: merc(v.center[1]), k };
}

// Screen position of a lon/lat for a view ({ center, zoom }).
function project(lon, lat, view) {
  const { lon0, y0, k } = viewOf(view);
  return [W / 2 + k * wrap180(lon - lon0) * RAD, H / 2 - k * (merc(lat) - y0)];
}

// ---------- cached land paths per view ----------
const CACHE = new Map();
function projectedPaths(view, res, margin, minPx = 1.2) {
  const key = `${res}|${n(view.center[0])}|${n(view.center[1])}|${n(view.zoom)}|${margin}|${minPx}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const { lon0, y0, k } = viewOf(view);
  const paths = new Map();
  for (const c of dataset(res).countries) {
    let d = '';
    for (const poly of c.polygons) {
      for (const r of poly) {
        // unwrap longitudes relative to the view centre so rings never streak across the map
        const pts = new Array(r.length);
        let l = wrap180(r[0][0] - lon0);
        pts[0] = [l, r[0][1]];
        for (let i = 1; i < r.length; i++) {
          l += wrap180(r[i][0] - r[i - 1][0]);
          pts[i] = [l, r[i][1]];
        }
        let minL = Infinity, maxL = -Infinity;
        for (const p of pts) { if (p[0] < minL) minL = p[0]; if (p[0] > maxL) maxL = p[0]; }
        for (const off of [-360, 0, 360]) {
          const x0 = W / 2 + k * (minL + off) * RAD, x1 = W / 2 + k * (maxL + off) * RAD;
          if (x1 < -margin || x0 > W + margin) continue;
          let seg = '', lx = null, ly = null, minY = Infinity, maxY = -Infinity, count = 0;
          for (const [pl, pa] of pts) {
            const x = W / 2 + k * (pl + off) * RAD;
            const y = H / 2 - k * (merc(pa) - y0);
            if (lx !== null && Math.abs(x - lx) < minPx && Math.abs(y - ly) < minPx) continue;
            seg += `${lx === null ? 'M' : 'L'}${n(x)} ${n(y)}`;
            lx = x; ly = y; count++;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
          if (count < 3 || maxY < -margin || minY > H + margin) continue;
          d += seg + 'Z';
        }
      }
    }
    if (d) paths.set(c, d);
  }
  if (CACHE.size > 48) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(key, paths);
  return paths;
}

// Frame a set of countries: returns { center, zoom }. Uses each country's largest polygon
// unless all: true (so the USA means the lower 48, not Alaska + Hawaii).
function fitTo(keys, { padding = 70, all = false, maxZoom = 40 } = {}) {
  let minL = Infinity, maxL = -Infinity, minY = Infinity, maxY = -Infinity, ref = null;
  for (const key of keys) {
    const c = findCountry(key, '110m') || findCountry(key, '50m');
    if (!c) continue;
    let polys = c.polygons;
    if (!all) {
      const size = (p) => { let a = 0; const r = p[0]; for (let i = 1; i < r.length; i++) a += r[i - 1][0] * r[i][1] - r[i][0] * r[i - 1][1]; return Math.abs(a); };
      polys = [polys.slice().sort((a, b) => size(b) - size(a))[0]];
    }
    for (const poly of polys) for (const [lon, lat] of poly[0]) {
      if (ref === null) ref = lon;
      const l = ref + wrap180(lon - ref);
      minL = Math.min(minL, l); maxL = Math.max(maxL, l);
      minY = Math.min(minY, merc(lat)); maxY = Math.max(maxY, merc(lat));
    }
  }
  if (ref === null) throw new Error(`fitTo: no countries found for ${keys.join(', ')}`);
  const spanX = (maxL - minL) * RAD, spanY = maxY - minY;
  const k = Math.min((W - 2 * padding) / Math.max(spanX, 1e-6), (H - 2 * padding) / Math.max(spanY, 1e-6));
  const zoom = Math.min(maxZoom, k / (W / (2 * Math.PI)));
  const cy = (minY + maxY) / 2;
  const lat = (2 * Math.atan(Math.exp(cy)) - Math.PI / 2) / RAD;
  return { center: [wrap180((minL + maxL) / 2), lat], zoom };
}

// ---------- overlays ----------
// Growing curved arrow (map style: flat fill, ink outline, arrowhead), labelled at the midpoint.
function mapArrow(a, b, t, at, { dur = 0.8, color = P.red, width = 14, bend = 0.18, label, labelSize = 26 } = {}) {
  const k = ease.inOut(prog(t, at, dur));
  if (k <= 0) return '';
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const cx = mx - dy * bend, cy = my + dx * bend; // bulge to the left of travel
  const q = (s) => [(1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * cx + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * cy + s * s * b[1]];
  const N = 40, end = Math.max(1, Math.round(N * k));
  const pts = Array.from({ length: end + 1 }, (_, i) => q((i / end) * k));
  const head = pts[pts.length - 1], prev = pts[Math.max(0, pts.length - 3)];
  const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]) * 180 / Math.PI;
  // stop the shaft short of the tip so the head covers it
  const shaft = pts.slice(0, Math.max(2, pts.length - 2)).map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join('');
  const hs = width * 1.9;
  const headPath = `M0 0 L${n(-hs * 1.2)} ${n(-hs * 0.85)} L${n(-hs * 1.2)} ${n(hs * 0.85)} Z`;
  const [lx, ly] = q(0.5);
  return `<g filter="url(#shadow)">
    <path d="${shaft}" fill="none" stroke="${P.ink}" stroke-width="${width + 6}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${shaft}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${headPath}" fill="${color}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round" transform="translate(${n(head[0])} ${n(head[1])}) rotate(${n(ang)})"/>
  </g>${label && k > 0.55 ? haloText(label, lx, ly - width - 10, { size: labelSize, anchor: 'middle', spacing: 1, opacity: clamp((k - 0.55) * 4) }) : ''}`;
}

// Label with a paper halo so it reads on any fill (dark highlights, arrows, borders).
function haloText(str, x, y, { size = 24, anchor = 'start', fill = P.ink, halo = P.paper, spacing = 0, opacity = 1 } = {}) {
  const esc = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<text x="${n(x)}" y="${n(y)}" class="t-hand" font-size="${size}" text-anchor="${anchor}" letter-spacing="${spacing}" opacity="${n(opacity)}"
    fill="${fill}" stroke="${halo}" stroke-width="${n(size * 0.22)}" stroke-linejoin="round" paint-order="stroke">${esc}</text>`;
}

const popAt = (x, y, t, at, inner) => {
  const p = pop(t, at);
  if (!p.on) return '';
  return `<g opacity="${n(p.o)}" transform="translate(${n(x)} ${n(y)}) scale(${n(p.s)}) translate(${n(-x)} ${n(-y)})">${inner}</g>`;
};

// Legend box (screen overlay, top-left under the date tag). items = [{ color, label, hatch? }].
function legend(items, t, at = 0, { x = 26, y = 86 } = {}) {
  const p = pop(t, at);
  if (!p.on) return '';
  const w = Math.max(...items.map((i) => i.label.length)) * 11 + 70;
  const h = items.length * 34 + 18;
  const rows = items.map((it, i) => `
    <rect x="${x + 14}" y="${y + 12 + i * 34}" width="30" height="22" fill="${it.hatch ? 'url(#hatch)' : it.color}" stroke="${P.ink}" stroke-width="2"/>
    ${it.hatch ? `<rect x="${x + 14}" y="${y + 12 + i * 34}" width="30" height="22" fill="none" stroke="${P.ink}" stroke-width="2"/>` : ''}
    ${text(it.label, x + 56, y + 30 + i * 34, { size: 22 })}`).join('');
  return `<g opacity="${n(p.o)}" filter="url(#shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>${rows}</g>`;
}

// ---------- the map ----------
// highlight / hatch values: a colour string, or { color, at, dur }.
// coast: soft ocean-coloured band along every coastline. Pretty, but it doubles raster cost
// (~+350 ms/frame at 1080p on dense views), so it's off by default; use it on short hero shots.
// detail: path simplification in design px (higher = faster, coarser).
// One mapView per frame (it defines the element id "mapLand").
function mapView({ t = 0, center = [0, 20], zoom = 1, res, highlight = {}, hatch = {}, dim = false, labels = [], cities = [],
  arrows = [], graticule = true, coast = false, detail = 1.6, margin = 120 } = {}) {
  const view = { center, zoom };
  const r = res || (zoom < 2.6 ? '110m' : '50m');
  const paths = projectedPaths(view, r, margin, detail);
  const lookup = (obj) => Object.entries(obj).map(([key, v]) => {
    const c = findCountry(key, r);
    if (!c) throw new Error(`mapView: unknown country "${key}"`);
    const o = typeof v === 'string' ? { color: v } : v === true ? {} : v;
    return { c, ...o };
  });
  const hl = lookup(highlight);
  const ht = lookup(hatch);

  // all un-highlighted land as one path (fast), highlighted countries drawn on top
  let land = '';
  for (const d of paths.values()) land += d;
  const base = dim && hl.length ? C.landDim : C.land;
  const sw = clamp(1.2 + zoom * 0.08, 1.4, 2.4);

  let grat = '';
  if (graticule) {
    const step = zoom < 2 ? 30 : zoom < 6 ? 10 : 5;
    let d = '';
    for (let lon = -180; lon <= 180; lon += step) {
      const [x] = project(lon, 0, view);
      if (x > -10 && x < W + 10) d += `M${n(x)} 0V${H}`;
    }
    for (let lat = -80; lat <= 80; lat += step) {
      const [, y] = project(0, lat, view);
      if (y > -10 && y < H + 10) d += `M0 ${n(y)}H${W}`;
    }
    grat = `<path d="${d}" stroke="${C.oceanLine}" stroke-width="1.2" opacity=".55" fill="none"/>`;
  }

  const fills = hl.map((h) => {
    const d = paths.get(h.c);
    if (!d) return '';
    const k = h.at == null ? 1 : ease.out(prog(t, h.at, h.dur ?? 0.35));
    if (k <= 0) return '';
    return `<path d="${d}" fill="${h.color || P.red}" fill-rule="evenodd" opacity="${n(k)}" stroke="${P.ink}" stroke-width="${n(sw)}" stroke-linejoin="round"/>`;
  }).join('');
  const hatches = ht.map((h) => {
    const d = paths.get(h.c);
    if (!d) return '';
    const k = h.at == null ? 1 : ease.out(prog(t, h.at, h.dur ?? 0.35));
    if (k <= 0) return '';
    return `<path d="${d}" fill="url(#hatch)" fill-rule="evenodd" opacity="${n(k)}"/>`;
  }).join('');

  const labelSvg = labels.map((l) => {
    const [x, y] = project(l.lon, l.lat, view);
    const s = l.size || 26;
    const fill = l.color || P.ink;
    const halo = l.halo || (fill === P.paper ? P.ink : P.paper);
    return popAt(x, y, t, l.at ?? 0, haloText(l.text, x, y + s * 0.35, { size: s, anchor: 'middle', fill, halo, spacing: l.spacing ?? 2 }));
  }).join('');
  const citySvg = cities.map((c) => {
    const [x, y] = project(c.lon, c.lat, view);
    const s = c.size || 24;
    const right = c.side !== 'left';
    return popAt(x, y, t, c.at ?? 0, `<circle cx="${n(x)}" cy="${n(y)}" r="7" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/><circle cx="${n(x)}" cy="${n(y)}" r="2.5" fill="${P.ink}"/>
      ${haloText(c.name, x + (right ? 14 : -14), y + s * 0.33, { size: s, anchor: right ? 'start' : 'end' })}`);
  }).join('');
  const arrowSvg = arrows.map((a) => mapArrow(project(a.from[0], a.from[1], view), project(a.to[0], a.to[1], view), t, a.at ?? 0, a)).join('');

  return `<rect width="${W}" height="${H}" fill="${C.ocean}"/>${grat}
    <defs><path id="mapLand" d="${land}"/></defs>
    ${coast ? `<use href="#mapLand" fill="none" stroke="${C.oceanLine}" stroke-width="9" stroke-linejoin="round" opacity=".7"/>` : ''}
    <use href="#mapLand" fill="${base}" fill-rule="evenodd" stroke="${C.border}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>
    ${fills}${hatches}
    ${arrowSvg}${citySvg}${labelSvg}`;
}

module.exports = { mapView, project, fitTo, legend, mapArrow, haloText, findCountry, MAP_COLORS: C };
