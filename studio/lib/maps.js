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
//     rings: [{ lon: 13.4, lat: 52.5, miles: 200 | km: 300, label: '200 MILES', at: 2.0, color: P.blue }],  // dashed range circles
//   });
//   const [x, y] = maps.project(13.4, 52.5, view);   // pin a sticker to Berlin
//   return camera(world, { zoom: M.punch(t, 2.5, { rate: 0.08, dur: 2.5 }), fx: x, fy: y })
//     + maps.legend([{ color: P.charcoal, label: 'GERMANY' }, { color: P.red, label: 'POLAND' }], t, 0.3);
//
//   maps.cityPlate({ name, sub, water: 'left' | ['left', 'bottom'] | 'none', grid: true, pins: [{ label, x, y, at }], at, t })
//       a stylised city-scale inset (blocks, street grid, water, pins, name plate) for places too small for Natural
//       Earth (a few blocks, a small town, a field: grid: false). Generic and labelled ILLUSTRATIVE, never a real street map.
//
// View: center = [lon, lat] (screen centre), zoom = 1 shows 360° of longitude across 1280 px
// (whole world); zoom 4 ≈ a continent, 10 ≈ a country the size of Germany.
// For pushes and pans, prefer wrapping a STATIC view in camera(): projected land paths are cached
// per view, so a static view costs almost nothing per frame.

const P = require('./palette');
const { W, H, n, text, textWidth } = require('./svg');
const { pop, prog, ease, clamp, rng } = require('./motion');

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
function mapArrow(a, b, t, at, { dur = 0.8, color = P.red, width = 14, bend = 0.18, label, labelSize = 32 } = {}) {
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
    ${text(it.label, x + 56, y + 30 + i * 34, { size: 26 })}`).join('');
  return `<g opacity="${n(p.o)}" filter="url(#shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/>${rows}</g>`;
}

// Dashed distance ring (a true geodesic circle, so it stretches correctly with Mercator), drawing on clockwise
// from north over `dur`, with a centre dot and a label at the top. ring = { lon, lat, miles | km, label, at, dur, color }.
const EARTH_KM = 6371.0088, KM_PER_MILE = 1.609344;
function ringPoints(lon, lat, km, steps = 96) {
  const d = km / EARTH_KM, p1 = lat * RAD, l1 = lon * RAD;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const b = (i / steps) * Math.PI * 2;
    const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
    const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    return [l2 / RAD, p2 / RAD];
  });
}
function mapRing(r, view, t) {
  const at = r.at ?? 0, k = ease.inOut(prog(t, at, r.dur ?? 0.9));
  if (k <= 0) return '';
  const km = r.km != null ? r.km : (r.miles || 0) * KM_PER_MILE;
  const color = r.color || P.red;
  const pts = ringPoints(r.lon, r.lat, km).map(([lo, la]) => project(lo, la, view));
  const end = Math.max(1, Math.round((pts.length - 1) * k));
  const d = pts.slice(0, end + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
  const [cx, cy] = project(r.lon, r.lat, view);
  const top = pts[0];
  const label = r.label || (r.miles != null ? `${r.miles} MILES` : `${r.km} KM`);
  const fill = k >= 1 && r.fill !== false ? `<path d="${d}Z" fill="${color}" opacity=".08"/>` : '';
  return `${fill}<path d="${d}" fill="none" stroke="${P.paper}" stroke-width="${(r.width || 3.5) + 3}" stroke-linecap="round" stroke-dasharray="14 10" opacity=".7"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="${r.width || 3.5}" stroke-linecap="round" stroke-dasharray="14 10"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="5" fill="${color}" stroke="${P.ink}" stroke-width="2"/>
    ${k > 0.6 ? haloText(label, top[0], top[1] - 12, { size: r.size || 30, anchor: 'middle', fill: color === P.red ? P.redDark : P.ink, opacity: clamp((k - 0.6) * 4) }) : ''}`;
}

// ---------- the map ----------
// highlight / hatch values: a colour string, or { color, at, dur }.
// coast: soft ocean-coloured band along every coastline. Pretty, but it doubles raster cost
// (~+350 ms/frame at 1080p on dense views), so it's off by default; use it on short hero shots.
// detail: path simplification in design px (higher = faster, coarser).
// One mapView per frame (it defines the element id "mapLand").
function mapView({ t = 0, center = [0, 20], zoom = 1, res, highlight = {}, hatch = {}, dim = false, labels = [], cities = [],
  arrows = [], rings = [], graticule = true, coast = false, detail = 1.6, margin = 120 } = {}) {
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
    const s = l.size || 32;
    const fill = l.color || P.ink;
    const halo = l.halo || (fill === P.paper ? P.ink : P.paper);
    return popAt(x, y, t, l.at ?? 0, haloText(l.text, x, y + s * 0.35, { size: s, anchor: 'middle', fill, halo, spacing: l.spacing ?? 2 }));
  }).join('');
  const citySvg = cities.map((c) => {
    const [x, y] = project(c.lon, c.lat, view);
    const s = c.size || 30;
    const right = c.side !== 'left';
    return popAt(x, y, t, c.at ?? 0, `<circle cx="${n(x)}" cy="${n(y)}" r="7" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/><circle cx="${n(x)}" cy="${n(y)}" r="2.5" fill="${P.ink}"/>
      ${haloText(c.name, x + (right ? 14 : -14), y + s * 0.33, { size: s, anchor: right ? 'start' : 'end' })}`);
  }).join('');
  const arrowSvg = arrows.map((a) => mapArrow(project(a.from[0], a.from[1], view), project(a.to[0], a.to[1], view), t, a.at ?? 0, a)).join('');
  const ringSvg = (rings || []).map((rg) => mapRing(rg, view, t)).join('');

  return `<rect width="${W}" height="${H}" fill="${C.ocean}"/>${grat}
    <defs><path id="mapLand" d="${land}"/></defs>
    ${coast ? `<use href="#mapLand" fill="none" stroke="${C.oceanLine}" stroke-width="9" stroke-linejoin="round" opacity=".7"/>` : ''}
    <use href="#mapLand" fill="${base}" fill-rule="evenodd" stroke="${C.border}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>
    ${fills}${hatches}
    ${ringSvg}${arrowSvg}${citySvg}${labelSvg}`;
}

// ---------- city plate: a stylised city-scale inset ----------
// For places Natural Earth can't zoom to (a few city blocks, a small town, a field). Generic and illustrative,
// NOT a real street map: flat blocks, a street grid, water on the chosen side(s), pins, a name plate.
//   cityPlate({ name, sub, water: 'left'|'right'|'top'|'bottom'|['left','bottom']|'none', grid: true, angle, parks,
//               pins: [{ label, x, y, at, color, side }], at, t, seed })
// Pin x/y: 0..1 fractions of the frame, or design pixels (> 1). grid: false gives open country (fields, one road).
function cityPlate({ name, sub, water = 'none', pins = [], grid = true, angle = -9, parks = 2, at = 0, t = 0, seed = 3, note = 'ILLUSTRATIVE · NOT TO SCALE' } = {}) {
  const sides = (Array.isArray(water) ? water : [water]).filter((w) => w && w !== 'none');
  const r = rng(seed);
  const k = ease.out(prog(t, at, 0.5));
  const land = grid ? P.paperShade : '#cdd2a8';
  let out = `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${land}"/>`;
  if (grid) {
    // blocks are the land colour; streets are paper lines over it; every 4th street is an avenue
    const step = 74, lines = [];
    for (let i = -14; i <= 14; i++) {
      const o = i * step;
      lines.push(`<path d="M${640 + o} -400 V1120" stroke="${P.paper}" stroke-width="${i % 4 ? 9 : 18}"/>`);
      lines.push(`<path d="M-400 ${360 + o * 0.78} H1680" stroke="${P.paper}" stroke-width="${i % 3 ? 8 : 15}"/>`);
    }
    const parkSvg = Array.from({ length: parks }, () => {
      const cx = 640 + Math.floor(r() * 10 - 5) * step, cy = 360 + Math.floor(r() * 8 - 4) * step * 0.78;
      return `<rect x="${cx + 6}" y="${n(cy + 5)}" width="${step * (r() < 0.5 ? 2 : 1) - 12}" height="${n(step * 0.78 - 10)}" fill="${P.green}" opacity=".55"/>`;
    }).join('');
    // one diagonal avenue for character
    const diag = `<path d="M${640 - 900} ${360 + 700} L${640 + 900} ${360 - 700}" stroke="${P.paper}" stroke-width="16" transform="rotate(${-angle * 3} 640 360)"/>`;
    out += `<g opacity="${n(0.35 + 0.65 * k)}" transform="rotate(${angle} 640 360)">${parkSvg}${lines.join('')}${diag}</g>`;
  } else {
    const fields = Array.from({ length: 10 }, (_, i) => `<path d="M${-200 + i * 180} -200 L${-60 + i * 180} 920" stroke="${P.greenDark}" stroke-width="2" opacity=".25"/>`).join('');
    out += `<g opacity="${n(0.35 + 0.65 * k)}">${fields}<path d="M-200 470 Q400 420 700 480 T1480 440" stroke="${P.paper}" stroke-width="16" fill="none"/>
      <path d="M-200 470 Q400 420 700 480 T1480 440" stroke="${P.paperShade}" stroke-width="2" fill="none" stroke-dasharray="14 12"/></g>`;
  }
  // water: a soft wavy shoreline on each chosen side
  const wave = (u, ph) => Math.sin(u * 0.011 + ph) * 18 + Math.sin(u * 0.027 + ph * 2) * 8;
  sides.forEach((side, si) => {
    const ph = si * 1.7 + seed;
    const depth = { left: 250, right: 250, top: 170, bottom: 170 }[side] || 220;
    let d = '';
    if (side === 'left' || side === 'right') {
      const xs = (y) => (side === 'left' ? depth + wave(y, ph) : W - depth + wave(y, ph));
      const edge = side === 'left' ? -200 : W + 200;
      d = `M${edge} -200 ` + Array.from({ length: 30 }, (_, i) => { const y = -200 + i * 40; return `L${n(xs(y))} ${y}`; }).join(' ') + ` L${edge} 1000 Z`;
    } else {
      const ys = (x) => (side === 'top' ? depth + wave(x, ph) : H - depth + wave(x, ph));
      const edge = side === 'top' ? -200 : H + 200;
      d = `M-200 ${edge} ` + Array.from({ length: 44 }, (_, i) => { const x = -200 + i * 40; return `L${x} ${n(ys(x))}`; }).join(' ') + ` L1680 ${edge} Z`;
    }
    out += `<path d="${d}" fill="${C.ocean}" stroke="${C.oceanLine}" stroke-width="14" stroke-linejoin="round" paint-order="stroke"/>
      <path d="${d}" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  });
  // compass + note
  out += `<g transform="translate(1196 92)" opacity="${n(k)}"><circle r="30" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/><path d="M0 -22 L7 0 L0 22 L-7 0 Z" fill="${P.ink}"/><path d="M0 -22 L7 0 L-7 0 Z" fill="${P.red}"/>${text('N', 0, -36, { size: 20, font: 'hand', anchor: 'middle' })}</g>`
    + (note ? haloText(note, 1250, 696, { size: 17, anchor: 'end', fill: P.inkSoft }) : '');
  // pins
  pins.forEach((p, i) => {
    const x = p.x <= 1 ? p.x * W : p.x, y = p.y <= 1 ? p.y * H : p.y;
    const color = p.color || P.red;
    const right = p.side ? p.side !== 'left' : x < W - 260;
    const lw = textWidth(String(p.label || ''), 26, 'hand') + 26;
    const lx = right ? x + 22 : x - 22 - lw;
    out += popAt(x, y, t, p.at ?? at + 0.5 + i * 0.5, `<ellipse cx="${n(x)}" cy="${n(y + 2)}" rx="11" ry="4" fill="#000" opacity=".25"/>
      <path d="M${n(x)} ${n(y)} C${n(x - 6)} ${n(y - 16)} ${n(x - 18)} ${n(y - 24)} ${n(x - 18)} ${n(y - 38)} A18 18 0 1 1 ${n(x + 18)} ${n(y - 38)} C${n(x + 18)} ${n(y - 24)} ${n(x + 6)} ${n(y - 16)} ${n(x)} ${n(y)} Z" fill="${color}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="${n(x)}" cy="${n(y - 38)}" r="7" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>
      ${p.label ? `<g filter="url(#shadow)"><rect x="${n(lx)}" y="${n(y - 58)}" width="${n(lw)}" height="38" rx="5" fill="${P.paper}" stroke="${P.ink}" stroke-width="2.5"/></g>${text(p.label, lx + lw / 2, y - 31, { size: 26, font: 'hand', anchor: 'middle' })}` : ''}`);
  });
  // name plate, top-left under where a date tag would sit
  if (name) {
    const nw = Math.max(textWidth(String(name).toUpperCase(), 40, 'display') * 1.08, sub ? textWidth(sub, 24, 'hand') : 0) + 60;
    out += popAt(40 + nw / 2, 150, t, at + 0.2, `<g filter="url(#shadow)"><rect x="40" y="${sub ? 104 : 110}" width="${n(nw)}" height="${sub ? 92 : 70}" fill="${P.paper}" stroke="${P.ink}" stroke-width="3"/></g>
      <rect x="40" y="${sub ? 104 : 110}" width="10" height="${sub ? 92 : 70}" fill="${P.red}"/>
      ${text(String(name).toUpperCase(), 66, sub ? 150 : 158, { size: 40, font: 'display' })}
      ${sub ? text(sub, 66, 182, { size: 24, font: 'hand', fill: P.inkSoft }) : ''}`);
  }
  return out;
}

module.exports = { mapView, project, fitTo, legend, mapArrow, mapRing, ringPoints, cityPlate, haloText, findCountry, MAP_COLORS: C };
