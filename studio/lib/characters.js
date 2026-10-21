// Character builder. One construction for every person in every episode:
// big round head, thick ink outline, dot eyes, blush, small body, noodle limbs.
// Identity comes from ONE OR TWO signature features (hair, hat, glasses, moustache, outfit colour).
//
// Local coordinates: origin = midpoint between the feet, y grows downward.
// Full height is ~370 units at scale 1 (head top at about y = -302).
// Position with: g(tr(x, y, scale), character(spec, state))

const P = require('./palette');
const { n, text } = require('./svg');

const HEAD_Y = -236;
const HEAD_R = 66;
const SHOULDER_Y = -152;
const HIP_Y = -66;
const OUT = 4.5; // outline weight for heads/bodies
const LIMB = 7; // limb weight

const rad = (d) => (d * Math.PI) / 180;

// ---------- face ----------
function eyes(kind, look = 0) {
  const lx = -24, rx = 24, y = -232, dx = look * 6;
  const both = (fn) => fn(lx, -1) + fn(rx, 1);
  switch (kind) {
    case 'closed':
      return both((x) => `<path d="M${x - 9} ${y} H${x + 9}" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round"/>`);
    case 'smug':
      return both((x) => `<path d="M${x - 10} ${y - 2} Q${x} ${y + 5} ${x + 10} ${y - 2}" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`);
    case 'happy':
      return both((x) => `<path d="M${x - 10} ${y + 3} Q${x} ${y - 9} ${x + 10} ${y + 3}" stroke="${P.ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`);
    case 'wide':
      return both((x) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${P.ink}" stroke-width="3.5"/><circle cx="${n(x + dx)}" cy="${y}" r="5" fill="${P.ink}"/>`);
    case 'sad':
      return both((x, s) => `<circle cx="${n(x + dx)}" cy="${y + 2}" r="6" fill="${P.ink}"/><path d="M${x - 10 * s} ${y - 12} L${x + 8 * s} ${y - 8}" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`);
    default: // 'dot'
      return both((x) => `<circle cx="${n(x + dx)}" cy="${y}" r="6.5" fill="${P.ink}"/>`);
  }
}

function brows(kind) {
  const y = -254;
  const line = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`;
  switch (kind) {
    case 'angry': return line(-38, y - 6, -14, y + 4) + line(14, y + 4, 38, y - 6);
    case 'worried': return line(-38, y + 4, -14, y - 6) + line(14, y - 6, 38, y + 4);
    case 'raised': return line(-37, y - 8, -15, y - 12) + line(15, y - 12, 37, y - 8);
    case 'smug': return line(-36, y + 2, -14, y + 4) + line(14, y - 4, 36, y - 10);
    case 'none': return '';
    default: return line(-37, y, -15, y + 2) + line(15, y + 2, 37, y);
  }
}

function mouth(kind) {
  const y = -204;
  const s = `stroke="${P.ink}" stroke-width="4" stroke-linecap="round" fill="none"`;
  switch (kind) {
    case 'smile': return `<path d="M-12 ${y - 2} Q0 ${y + 8} 12 ${y - 2}" ${s}/>`;
    case 'grin': return `<path d="M-15 ${y - 4} Q0 ${y + 14} 15 ${y - 4} Z" fill="${P.ink}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    case 'smirk': return `<path d="M-10 ${y + 2} Q4 ${y + 8} 14 ${y - 2}" ${s}/>`;
    case 'frown': return `<path d="M-11 ${y + 6} Q0 ${y - 4} 11 ${y + 6}" ${s}/>`;
    case 'open': return `<ellipse cx="0" cy="${y + 2}" rx="9" ry="7" fill="${P.ink}"/>`;
    case 'o': return `<ellipse cx="0" cy="${y + 2}" rx="6" ry="8" fill="${P.ink}"/>`;
    case 'flat': return `<path d="M-9 ${y + 2} H9" ${s}/>`;
    default: return `<path d="M-8 ${y + 1} Q0 ${y + 5} 8 ${y + 1}" ${s}/>`;
  }
}

function moustache(kind, color = P.ink) {
  const y = -216;
  switch (kind) {
    case 'brush': return `<rect x="-14" y="${y - 6}" width="28" height="12" rx="4" fill="${color}"/>`;
    case 'walrus': return `<path d="M-30 ${y + 8} Q-24 ${y - 12} 0 ${y - 6} Q24 ${y - 12} 30 ${y + 8} Q14 ${y + 2} 0 ${y + 4} Q-14 ${y + 2} -30 ${y + 8} Z" fill="${color}"/>`;
    case 'thin': return `<path d="M-18 ${y + 2} Q0 ${y - 8} 18 ${y + 2}" stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    default: return '';
  }
}

function glasses(on) {
  if (!on) return '';
  const y = -232;
  return `<g fill="none" stroke="${P.ink}" stroke-width="3.2"><circle cx="-24" cy="${y}" r="15"/><circle cx="24" cy="${y}" r="15"/><path d="M-9 ${y - 2} Q0 ${y - 8} 9 ${y - 2}"/><path d="M-39 ${y - 3} L-62 ${y - 10} M39 ${y - 3} L62 ${y - 10}"/></g>`;
}

// Beards sit on the jaw and leave the mouth clear (draw the moustache separately if wanted).
function beard(kind, color = '#4a4038') {
  const o = `fill="${color}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"`;
  switch (kind) {
    case 'short': // a jaw band following the lower edge of the head
      return `<path d="M-65 -226 A66 66 0 0 0 65 -226 Q60 -206 44 -196 Q24 -186 0 -186 Q-24 -186 -44 -196 Q-60 -206 -65 -226 Z" ${o}/>`;
    case 'full': // bushy, past the chin onto the collar
      return `<path d="M-66 -238 Q-74 -176 -40 -150 Q-18 -132 0 -134 Q18 -132 40 -150 Q74 -176 66 -238 Q62 -210 46 -198 Q24 -184 0 -186 Q-24 -184 -46 -198 Q-62 -210 -66 -238 Z" ${o}/>
        <path d="M-30 -168 Q-24 -160 -16 -164 M18 -164 Q26 -160 32 -170 M-4 -150 Q2 -144 8 -150" stroke="${P.ink}" stroke-width="2" fill="none" opacity=".45"/>`;
    default:
      return '';
  }
}

// Air-traffic-controller headset: band over the head, ear cups, boom mic to the mouth (screen-left side).
function headset(on) {
  if (!on) return '';
  return `<g stroke="${P.ink}" stroke-linejoin="round">
    <path d="M-66 -238 Q-70 -318 0 -318 Q70 -318 66 -238" fill="none" stroke-width="8"/>
    <path d="M-66 -238 Q-70 -318 0 -318 Q70 -318 66 -238" fill="none" stroke="${P.greyDark}" stroke-width="3.5"/>
    <path d="M-62 -230 Q-50 -196 -18 -200" fill="none" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="-24" y="-206" width="12" height="9" rx="4" fill="${P.ink}" stroke-width="2"/>
    <rect x="-80" y="-254" width="22" height="36" rx="9" fill="${P.charcoal}" stroke-width="3.5"/>
    <rect x="58" y="-254" width="22" height="36" rx="9" fill="${P.charcoal}" stroke-width="3.5"/>
  </g>`;
}

// Bridal veil: the part behind the head and shoulders (drawn before the body) and a small comb on top.
function veilBack(on) {
  if (!on) return '';
  return `<path d="M-40 -296 Q-96 -250 -98 -120 Q-100 -70 -84 -40 L84 -40 Q100 -70 98 -120 Q96 -250 40 -296 Z" fill="${P.ivory}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round" opacity=".92"/>
    <path d="M-70 -200 Q-80 -130 -70 -50 M70 -200 Q80 -130 70 -50 M-40 -230 Q-52 -150 -46 -60 M40 -230 Q52 -150 46 -60" stroke="${P.paperShade}" stroke-width="2.5" fill="none"/>`;
}
function veilFront(on) {
  if (!on) return '';
  return `<path d="M-34 -298 Q0 -322 34 -298" stroke="${P.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-34 -298 Q0 -322 34 -298" stroke="${P.ivory}" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${[-22, 0, 22].map((x) => `<circle cx="${x}" cy="${x === 0 ? -314 : -306}" r="4" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="1.8"/>`).join('')}`;
}

// ---------- hair & hats ----------
function hair(kind, color) {
  const o = `stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"`;
  switch (kind) {
    case 'slick':
      return `<path d="M-62 -252 Q-60 -306 0 -304 Q58 -304 64 -250 Q50 -284 6 -282 Q-30 -280 -48 -262 Z" fill="${color}" ${o}/>`;
    case 'side':
      return `<path d="M-64 -240 Q-70 -300 -8 -306 Q60 -308 66 -244 Q56 -276 24 -282 Q-6 -272 -40 -280 Q-56 -268 -64 -240 Z" fill="${color}" ${o}/>`;
    case 'bald':
      return `<path d="M-66 -236 Q-70 -258 -58 -268 Q-56 -248 -60 -232 Z M66 -236 Q70 -258 58 -268 Q56 -248 60 -232 Z" fill="${color}" ${o}/>`;
    case 'bob':
      return `<path d="M-72 -196 Q-84 -306 0 -310 Q84 -306 72 -196 Q66 -186 56 -196 Q62 -258 30 -276 Q-10 -250 -54 -262 Q-62 -230 -56 -196 Q-66 -186 -72 -196 Z" fill="${color}" ${o}/>`;
    case 'curly': {
      const bumps = [-56, -36, -14, 8, 30, 52].map((x, i) => `<circle cx="${x}" cy="${-284 - (i % 2) * 8 + Math.abs(x) * 0.2}" r="20" fill="${color}" ${o}/>`).join('');
      return `<g>${bumps}</g>`;
    }
    case 'long':
      return `<path d="M-70 -170 Q-86 -308 0 -310 Q86 -308 70 -170 Q60 -160 52 -172 Q60 -256 22 -278 Q-16 -254 -52 -266 Q-60 -220 -52 -172 Q-60 -160 -70 -170 Z" fill="${color}" ${o}/>`;
    case 'spiky':
      return `<path d="M-60 -258 L-54 -300 L-34 -282 L-20 -314 L-2 -288 L16 -316 L30 -286 L50 -306 L54 -272 L64 -256 Q40 -280 0 -278 Q-40 -280 -60 -258 Z" fill="${color}" ${o}/>`;
    case 'ponytail':
      return `<path d="M54 -276 Q96 -262 92 -206 Q88 -188 78 -196 Q84 -240 50 -258 Z" fill="${color}" ${o}/><path d="M-64 -240 Q-66 -306 0 -306 Q66 -306 64 -240 Q50 -282 0 -284 Q-50 -282 -64 -240 Z" fill="${color}" ${o}/>`;
    case 'bun':
      return `<circle cx="0" cy="-312" r="24" fill="${color}" ${o}/><path d="M-64 -240 Q-64 -306 0 -306 Q64 -306 64 -240 Q50 -282 0 -284 Q-50 -282 -64 -240 Z" fill="${color}" ${o}/>`;
    default:
      return '';
  }
}

// Default colours for hats that have an obvious one (used when the spec gives no hatColor / hatBand).
const HAT_COLOR = { service: P.olive, police: P.policeNavy, hardhat: P.gold, helmet: P.redDark, pilotHelmet: P.greyLight,
  ushanka: P.furDark, stahlhelm: P.greyDark, peaked: P.olive };
const HAT_BAND = { service: P.oliveDark, police: P.policeNavy, pilotHelmet: P.red, ushanka: P.fur, peaked: P.redDark };
function hat(kind, color = P.charcoal, band = P.redDark, back = false) {
  const o = `stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"`;
  switch (kind) {
    case 'tophat':
      return `<rect x="-42" y="-392" width="84" height="98" rx="6" fill="${color}" ${o}/><rect x="-42" y="-316" width="84" height="14" fill="${band}" ${o}/><ellipse cx="0" cy="-298" rx="72" ry="13" fill="${color}" ${o}/>`;
    case 'fedora':
      return `<path d="M-50 -296 Q-48 -352 0 -350 Q48 -352 50 -296 Z" fill="${color}" ${o}/><path d="M-50 -310 H50 V-298 H-50 Z" fill="${band}" ${o}/><ellipse cx="0" cy="-296" rx="84" ry="14" fill="${color}" ${o}/>`;
    case 'cap':
      return `<path d="M-62 -270 Q-60 -330 0 -330 Q60 -330 62 -270 Z" fill="${color}" ${o}/><path d="M-66 -272 Q0 -262 92 -268 Q80 -252 0 -256 Q-60 -258 -66 -272 Z" fill="${color}" ${o}/>`;
    case 'service': // military peaked cap: wide crown, dark band, black visor, gold badge
      return `<path d="M-58 -292 Q-92 -324 -60 -342 Q0 -362 60 -342 Q92 -324 58 -292 Z" fill="${color}" ${o}/>
        <path d="M-58 -296 H58 V-278 Q0 -272 -58 -278 Z" fill="${band}" ${o}/>
        <path d="M-56 -280 Q0 -266 56 -280 Q44 -256 0 -254 Q-44 -256 -56 -280 Z" fill="${P.ink}" ${o}/>
        <path d="M-30 -268 Q0 -262 30 -268" stroke="${P.greyDark}" stroke-width="2" fill="none"/>
        <path d="M-14 -322 Q0 -308 14 -322 M-18 -330 Q0 -316 18 -330" stroke="${P.gold}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="0" cy="-322" r="8" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/>`;
    case 'police': // peaked cap, flatter crown, chequered band, shield badge
      return `<path d="M-60 -292 Q-80 -320 -56 -334 Q0 -346 56 -334 Q80 -320 60 -292 Z" fill="${color}" ${o}/>
        <path d="M-58 -298 H58 V-280 Q0 -274 -58 -280 Z" fill="${P.paper}" ${o}/>
        ${[-48, -24, 0, 24].map((x) => `<rect x="${x}" y="-298" width="12" height="8" fill="${band}"/><rect x="${x + 12}" y="-290" width="12" height="8" fill="${band}"/>`).join('')}
        <path d="M-58 -298 H58 V-280 Q0 -274 -58 -280 Z" fill="none" ${o}/>
        <path d="M-56 -282 Q0 -268 56 -282 Q44 -258 0 -256 Q-44 -258 -56 -282 Z" fill="${P.ink}" ${o}/>
        <path d="M-10 -330 H10 V-318 Q10 -308 0 -304 Q-10 -308 -10 -318 Z" fill="${P.gold}" stroke="${P.ink}" stroke-width="2.2"/>`;
    case 'hardhat': // construction helmet with a centre ridge
      return `<path d="M-62 -280 Q-62 -350 0 -352 Q62 -350 62 -280 Z" fill="${color}" ${o}/>
        <path d="M-14 -350 Q-16 -320 -12 -282 H12 Q16 -320 14 -350 Q0 -354 -14 -350 Z" fill="${color}" ${o}/>
        <path d="M-76 -286 Q0 -294 76 -286 Q80 -272 66 -270 Q0 -276 -66 -270 Q-80 -272 -76 -286 Z" fill="${color}" ${o}/>
        <path d="M-44 -334 Q-54 -316 -54 -296" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>`;
    case 'helmet': // firefighter helmet: domed shell, comb, front shield, long brim
      return `<path d="M-86 -282 Q-92 -262 -70 -264 Q0 -272 70 -264 Q92 -262 86 -282 Q0 -300 -86 -282 Z" fill="${color}" ${o}/>
        <path d="M-60 -284 Q-62 -352 0 -354 Q62 -352 60 -284 Z" fill="${color}" ${o}/>
        <path d="M-6 -354 Q0 -364 6 -354 V-292 H-6 Z" fill="${color}" ${o}/>
        <path d="M-20 -342 H20 V-316 Q20 -298 0 -292 Q-20 -298 -20 -316 Z" fill="${P.gold}" stroke="${P.ink}" stroke-width="2.8"/>
        <path d="M-10 -330 H10 M-10 -318 H10" stroke="${P.ink}" stroke-width="2.4"/>`;
    case 'pilotHelmet': // jet pilot helmet with the tinted visor raised
      return `<path d="M-72 -220 Q-80 -326 0 -330 Q80 -326 72 -220 Q66 -208 56 -218 Q60 -276 0 -282 Q-60 -276 -56 -218 Q-66 -208 -72 -220 Z" fill="${color}" ${o}/>
        <path d="M-60 -282 Q0 -310 60 -282 Q58 -264 0 -270 Q-58 -264 -60 -282 Z" fill="${P.charcoal}" ${o}/>
        <path d="M-36 -284 Q0 -298 30 -288" stroke="${P.greyLight}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
        <rect x="-8" y="-326" width="16" height="22" rx="4" fill="${band}" stroke="${P.ink}" stroke-width="2.5"/>`;
    case 'ushanka': { // Soviet fur hat: cloth crown (color), turned-up fur front and ear flaps (band), small red star
      const tufts = (pts) => pts.map(([x, y]) => `<path d="M${x} ${y} q3 -5 7 -1" stroke="${P.ink}" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`).join('');
      const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.2 : 10; return `${i ? 'L' : 'M'}${n(Math.cos(a) * r)} ${n(-298 + Math.sin(a) * r)}`; }).join(' ') + ' Z';
      return `<path d="M-76 -264 Q-84 -226 -78 -196 Q-66 -184 -52 -196 Q-48 -230 -50 -264 Z" fill="${band}" ${o}/>
        <path d="M76 -264 Q84 -226 78 -196 Q66 -184 52 -196 Q48 -230 50 -264 Z" fill="${band}" ${o}/>
        ${tufts([[-72, -240], [-68, -214], [64, -240], [62, -214]])}
        <path d="M-62 -296 Q-64 -350 0 -352 Q64 -350 62 -296 Z" fill="${color}" ${o}/>
        <path d="M-40 -330 Q0 -342 40 -330" stroke="${P.ink}" stroke-width="2" fill="none" opacity=".3"/>
        <path d="M-74 -300 Q-78 -326 -56 -326 Q0 -334 56 -326 Q78 -326 74 -300 Q76 -274 56 -272 Q0 -264 -56 -272 Q-76 -274 -74 -300 Z" fill="${band}" ${o}/>
        ${tufts([[-60, -312], [-40, -290], [-22, -316], [22, -316], [40, -290], [58, -310]])}
        ${back ? '' : `<path d="${star}" fill="${P.red}" stroke="${P.ink}" stroke-width="1.6" stroke-linejoin="round"/>`}`;
    }
    case 'stahlhelm': // plain WW2 German steel helmet: low dome over the brow, flared skirt at the sides. No insignia.
      return `<path d="M-62 -272 Q-66 -342 0 -344 Q66 -342 62 -272 Q70 -254 86 -232 Q76 -224 62 -234 Q56 -252 48 -264 Q0 -278 -48 -264 Q-56 -252 -62 -234 Q-76 -224 -86 -232 Q-70 -254 -62 -272 Z" fill="${color}" ${o}/>
        <path d="M-56 -272 Q0 -286 56 -272" stroke="${P.ink}" stroke-width="2.5" fill="none" opacity=".45"/>
        <path d="M-40 -326 Q-54 -310 -56 -290" stroke="#fff" stroke-width="6" fill="none" opacity=".25" stroke-linecap="round"/>
        <circle cx="-58" cy="-284" r="3" fill="${P.ink}" opacity=".5"/><circle cx="58" cy="-284" r="3" fill="${P.ink}" opacity=".5"/>`;
    case 'peaked': // WW2 officer's peaked cap: tall crown rising at the front, coloured band (hatBand), piping, black visor, cockade
      return `<path d="M-60 -292 Q-84 -314 -64 -330 Q-34 -356 0 -358 Q34 -356 64 -330 Q84 -314 60 -292 Z" fill="${color}" ${o}/>
        <path d="M-64 -326 Q-34 -350 0 -352 Q34 -350 64 -326" stroke="${band}" stroke-width="3" fill="none"/>
        <path d="M-58 -298 H58 V-280 Q0 -274 -58 -280 Z" fill="${band}" ${o}/>
        <path d="M-56 -282 Q0 -268 56 -282 Q46 -254 0 -252 Q-46 -254 -56 -282 Z" fill="${P.ink}" ${o}/>
        <path d="M-30 -268 Q0 -262 30 -268" stroke="${P.greyDark}" stroke-width="2" fill="none"/>
        <path d="M-50 -284 Q0 -276 50 -284" stroke="${P.goldDark}" stroke-width="2.5" fill="none"/>
        <circle cx="0" cy="-290" r="6.5" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/><circle cx="0" cy="-290" r="2.5" fill="${P.redDark}"/>`;
    default:
      return '';
  }
}

// ---------- body ----------
function body(spec) {
  const o = `stroke="${P.ink}" stroke-width="${OUT}" stroke-linejoin="round"`;
  const torso = `M-40 ${HIP_Y} Q-44 -150 -26 -168 L26 -168 Q44 -150 40 ${HIP_Y} Z`;
  switch (spec.outfit) {
    case 'shirt':
      return `<path d="${torso}" fill="${spec.shirt || P.blue}" ${o}/>
        <path d="M-16 -168 L0 -150 L16 -168" fill="none" stroke="${P.ink}" stroke-width="3"/>
        <path d="M-40 ${HIP_Y + 2} H40" stroke="${P.ink}" stroke-width="3"/>`;
    case 'dress':
      return `<path d="M-50 ${HIP_Y + 8} Q-40 -150 -24 -168 L24 -168 Q40 -150 50 ${HIP_Y + 8} Z" fill="${spec.shirt || P.red}" ${o}/>
        <path d="M-12 -168 Q0 -156 12 -168" fill="none" stroke="${P.ink}" stroke-width="3"/>`;
    case 'coat':
      return `<path d="M-44 ${HIP_Y + 12} Q-46 -150 -26 -168 L26 -168 Q46 -150 44 ${HIP_Y + 12} Z" fill="${spec.suit || P.charcoal}" ${o}/>
        <path d="M-14 -168 L0 -136 L14 -168 Z" fill="${spec.shirt || '#f2efe6'}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M0 -136 V${HIP_Y + 10}" stroke="${P.ink}" stroke-width="3"/>
        <circle cx="-8" cy="-112" r="3" fill="${P.ink}"/><circle cx="-8" cy="-88" r="3" fill="${P.ink}"/>`;
    case 'hoodie':
      return `<path d="M-44 ${HIP_Y} Q-48 -150 -28 -170 L28 -170 Q48 -150 44 ${HIP_Y} Z" fill="${spec.shirt || P.greyDark}" ${o}/>
        <path d="M-30 -170 Q0 -146 30 -170" fill="none" stroke="${P.ink}" stroke-width="3.5"/>
        <path d="M-8 -156 V-128 M8 -156 V-128" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M-24 -100 H24 V-76 H-24 Z" fill="none" stroke="${P.ink}" stroke-width="3"/>`;
    case 'turtleneck':
      return `<path d="${torso}" fill="${spec.shirt || P.ink}" ${o}/>
        <rect x="-20" y="-178" width="40" height="16" rx="6" fill="${spec.shirt || P.ink}" stroke="${P.ink}" stroke-width="3"/>
        ${spec.shirt && spec.shirt !== P.ink ? '' : `<path d="M-14 -172 H14" stroke="#4a4644" stroke-width="2"/>`}`;
    case 'vest':
      return `<path d="${torso}" fill="${spec.shirt || '#f2efe6'}" ${o}/>
        <path d="M-38 ${HIP_Y} Q-42 -150 -26 -166 L-6 -124 L0 ${HIP_Y + 6} L6 -124 L26 -166 Q42 -150 38 ${HIP_Y} Z" fill="${spec.suit || P.greyDark}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/>
        ${spec.tie === null ? '' : `<path d="M0 -164 L-5 -150 L0 -126 L5 -150 Z" fill="${spec.tie || P.blue}" stroke="${P.ink}" stroke-width="2.5"/>`}
        <circle cx="-8" cy="-104" r="2.5" fill="${P.ink}"/><circle cx="-8" cy="-86" r="2.5" fill="${P.ink}"/>`;
    case 'robe':
      return `<path d="M-52 ${HIP_Y + 30} Q-50 -150 -28 -170 L28 -170 Q50 -150 52 ${HIP_Y + 30} Z" fill="${spec.suit || P.ink}" ${o}/>
        <path d="M-12 -170 L0 -148 L12 -170 Z" fill="#f2efe6" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M-20 -150 V${HIP_Y + 26} M20 -150 V${HIP_Y + 26}" stroke="#4a4644" stroke-width="2"/>`;
    case 'overalls':
      return `<path d="${torso}" fill="${spec.shirt || P.paperDim}" ${o}/>
        <path d="M-30 -118 H30 V${HIP_Y} H-30 Z" fill="${spec.suit || P.blue}" stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M-24 -118 L-28 -166 M24 -118 L28 -166" stroke="${spec.suit || P.blue}" stroke-width="9"/>
        <path d="M-24 -118 L-28 -166 M24 -118 L28 -166" stroke="${P.ink}" stroke-width="2" opacity=".5"/>
        <rect x="-12" y="-110" width="24" height="18" fill="none" stroke="${P.ink}" stroke-width="2.5"/>`;
    case 'blazer': // open-neck shirt with collar points, no tie (the finance host)
      return `<path d="${torso}" fill="${spec.suit || P.navy}" ${o}/>
        <path d="M-18 -168 L0 -118 L18 -168 Z" fill="${spec.shirt || '#f7f5ef'}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M-10 -168 L0 -146 L10 -168 Z" fill="${spec.skin || P.skin}"/>
        <path d="M-20 -171 L-5 -148 L-27 -140 Z M20 -171 L5 -148 L27 -140 Z" fill="${spec.shirt || '#f7f5ef'}" stroke="${P.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M-30 -164 L-4 -112 M30 -164 L4 -112" stroke="${P.ink}" stroke-width="3" fill="none"/>
        <path d="M-27 -140 L-33 -132 L-22 -128 M27 -140 L33 -132 L22 -128" stroke="${P.ink}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
        <circle cx="-2" cy="-98" r="3" fill="${P.ink}"/>`;
    case 'uniform': { // military / airline tunic: shoulder boards, brass buttons, ribbons. suit = uniform colour
      const c = spec.suit || P.olive;
      return `<path d="${torso}" fill="${c}" ${o}/>
        <path d="M-14 -168 L0 -136 L14 -168 Z" fill="${spec.shirt || '#efe8d6'}" stroke="${P.ink}" stroke-width="3"/>
        ${spec.tie === null ? '' : `<path d="M0 -160 L-5 -148 L0 -136 L5 -148 Z" fill="${spec.tie || P.ink}" stroke="${P.ink}" stroke-width="2"/>`}
        <path d="M-26 -168 L-4 -132 L-20 -126 M26 -168 L4 -132 L20 -126" stroke="${P.ink}" stroke-width="3" fill="none" stroke-linejoin="round"/>
        <path d="M0 -132 V${HIP_Y + 2}" stroke="${P.ink}" stroke-width="2.5"/>
        ${[-118, -100, -82].map((y) => `<circle cx="0" cy="${y}" r="3.4" fill="${P.gold}" stroke="${P.ink}" stroke-width="1.5"/>`).join('')}
        ${[-1, 1].map((sd) => `<g transform="translate(${sd * 34} -164) rotate(${sd * 26})"><rect x="-12" y="-5" width="24" height="10" rx="3" fill="${P.ink}" stroke="${P.ink}" stroke-width="2"/><path d="M${sd * 2} -3 V3 M${sd * 7} -3 V3" stroke="${P.gold}" stroke-width="2.4"/></g>`).join('')}
        <g transform="translate(12 -126)"><rect width="9" height="5" fill="${P.red}"/><rect x="9" width="9" height="5" fill="${P.blue}"/><rect y="5" width="9" height="5" fill="${P.gold}"/><rect x="9" y="5" width="9" height="5" fill="${P.green}"/><rect width="18" height="10" fill="none" stroke="${P.ink}" stroke-width="1.5"/></g>
        <path d="M-38 -88 H-14 M14 -88 H38" stroke="${P.ink}" stroke-width="2.5" opacity=".6"/>`;
    }
    case 'police': { // police shirt: epaulettes, chest pockets, star badge, dark tie
      const c = spec.suit || P.policeNavy;
      return `<path d="${torso}" fill="${c}" ${o}/>
        <path d="M-16 -168 L0 -150 L16 -168" fill="${spec.skin || P.skin}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M0 -152 L-5 -140 L0 -112 L5 -140 Z" fill="${spec.tie || P.ink}" stroke="${P.ink}" stroke-width="2"/>
        <path d="M-44 -166 L-24 -160 M44 -166 L24 -160" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
        <path d="M-32 -130 H-12 V-110 H-32 Z M12 -130 H32 V-110 H12 Z" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M-32 -130 H-12 V-124 H-32 Z" fill="${P.ink}" opacity=".35"/>
        <path d="M22 -146 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="${P.gold}" stroke="${P.ink}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M-40 ${HIP_Y + 4} H40" stroke="${P.ink}" stroke-width="8"/><rect x="-7" y="${HIP_Y - 1}" width="14" height="10" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="2"/>`;
    }
    case 'firefighter': { // turnout coat with reflective bands
      const c = spec.suit || P.turnout;
      const band = (y) => `<rect x="-46" y="${y}" width="92" height="12" fill="${P.reflective}" stroke="${P.ink}" stroke-width="2.5"/><path d="M-46 ${y + 6} H46" stroke="${P.greyLight}" stroke-width="3"/>`;
      return `<path d="M-46 ${HIP_Y + 18} Q-50 -150 -28 -170 L28 -170 Q50 -150 46 ${HIP_Y + 18} Z" fill="${c}" ${o}/>
        <path d="M-22 -172 Q0 -160 22 -172 L18 -184 Q0 -176 -18 -184 Z" fill="${c}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
        ${band(-96)}${band(HIP_Y - 2)}
        <path d="M-46 ${HIP_Y + 18} Q-50 -150 -28 -170 L28 -170 Q50 -150 46 ${HIP_Y + 18} Z" fill="none" ${o}/>
        <path d="M4 -170 V${HIP_Y + 18}" stroke="${P.ink}" stroke-width="3"/>
        ${[-140, -116].map((y) => `<path d="M-2 ${y} H12" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`).join('')}`;
    }
    case 'flightsuit': { // one-piece flight suit: zip, chest pockets, name patch, shoulder patch
      const c = spec.suit || P.flight;
      return `<path d="M-42 ${HIP_Y + 4} Q-46 -150 -26 -168 L26 -168 Q46 -150 42 ${HIP_Y + 4} Z" fill="${c}" ${o}/>
        <path d="M-20 -170 L0 -148 L-12 -142 Z M20 -170 L0 -148 L12 -142 Z" fill="${c}" stroke="${P.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M0 -148 V${HIP_Y + 4}" stroke="${P.ink}" stroke-width="3"/>
        <circle cx="0" cy="-136" r="3" fill="${P.greyLight}" stroke="${P.ink}" stroke-width="1.5"/>
        <rect x="-34" y="-132" width="24" height="16" rx="2" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2"/><path d="M-30 -124 H-14" stroke="${P.inkSoft}" stroke-width="2"/>
        <path d="M10 -132 H32 V-110 H10 Z" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M-40 ${HIP_Y - 2} H40" stroke="${P.ink}" stroke-width="3" opacity=".7"/>`;
    }
    case 'labcoat': { // long white coat, open over shirt and tie, pens in the pocket
      const c = spec.suit || P.labWhite;
      return `<path d="${torso}" fill="${spec.shirt || P.blue}" ${o}/>
        ${spec.tie === null ? '' : `<path d="M0 -160 L-5 -148 L0 -120 L5 -148 Z" fill="${spec.tie || P.navy}" stroke="${P.ink}" stroke-width="2.2"/>`}
        <path d="M-46 ${HIP_Y + 34} Q-48 -150 -28 -170 L-10 -170 L-6 -100 L-14 ${HIP_Y + 34} Z" fill="${c}" ${o}/>
        <path d="M46 ${HIP_Y + 34} Q48 -150 28 -170 L10 -170 L6 -100 L14 ${HIP_Y + 34} Z" fill="${c}" ${o}/>
        <path d="M-28 -170 L-8 -128 M28 -170 L8 -128" stroke="${P.ink}" stroke-width="2.5" fill="none"/>
        <path d="M18 -132 H38 V-114 H18 Z" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M23 -132 V-144 M29 -132 V-142" stroke="${P.blue}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M23 -132 V-144 M29 -132 V-142" stroke="${P.ink}" stroke-width="1" opacity=".5"/>
        <path d="M-40 -84 H-20 M20 -84 H40" stroke="${P.ink}" stroke-width="2.5"/>`;
    }
    case 'tuxedo': { // black jacket, satin lapels, white shirt, bow tie
      const c = spec.suit || P.charcoal;
      return `<path d="${torso}" fill="${c}" ${o}/>
        <path d="M-16 -168 L0 -112 L16 -168 Z" fill="${spec.shirt || '#f7f5ef'}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M-26 -168 L-4 -116 L-16 -150 Z M26 -168 L4 -116 L16 -150 Z" fill="${P.ink}" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-15 -168 L-1 -159 L-15 -151 Z M15 -168 L1 -159 L15 -151 Z" fill="${spec.tie || P.ink}" stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="0" cy="-159" r="3.5" fill="${spec.tie || P.ink}" stroke="${P.ink}" stroke-width="1.5"/>
        <circle cx="0" cy="-142" r="2" fill="${P.ink}"/><circle cx="0" cy="-130" r="2" fill="${P.ink}"/>
        <circle cx="0" cy="-102" r="3" fill="${P.ink}" stroke="${P.greyDark}" stroke-width="1"/>
        <circle cx="-24" cy="-142" r="5" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/>`;
    }
    case 'weddingDress': { // long A-line gown to the floor, sweetheart neckline, waist sash
      const c = spec.shirt || P.ivory;
      return `<path d="M-74 -4 Q-58 -60 -34 -104 Q-40 -140 -26 -164 Q-14 -156 0 -162 Q14 -156 26 -164 Q40 -140 34 -104 Q58 -60 74 -4 Q0 8 -74 -4 Z" fill="${c}" ${o}/>
        <path d="M-34 -104 Q0 -96 34 -104 L32 -92 Q0 -84 -32 -92 Z" fill="${P.paperDim}" stroke="${P.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M-24 -86 Q-44 -46 -46 -6 M0 -84 V0 M24 -86 Q44 -46 46 -6" stroke="${P.paperShade}" stroke-width="2.5" fill="none"/>`;
    }
    case 'tshirt': { // crew-neck tee with short sleeves; spec.print = a letter/short word on the chest
      const c = spec.shirt || P.blue;
      const pr = spec.print ? text(String(spec.print).slice(0, 3), 0, -96, { font: 'display', size: String(spec.print).length > 1 ? 26 : 40, fill: spec.printColor || P.paper, anchor: 'middle' }) : '';
      return `<path d="M-46 -150 L-30 -170 L30 -170 L46 -150 L40 -134 L36 -136 Q38 -100 40 ${HIP_Y} H-40 Q-38 -100 -36 -136 L-40 -134 Z" fill="${c}" ${o}/>
        <path d="M-16 -170 Q0 -154 16 -170" fill="${spec.skin || P.skin}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M-36 -136 Q-34 -146 -32 -150 M36 -136 Q34 -146 32 -150" stroke="${P.ink}" stroke-width="2.5" fill="none"/>
        ${pr}`;
    }
    case 'greatcoat': { // long military greatcoat to the boots: fold-down collar, double-breasted brass buttons, belt. suit = colour
      const c = spec.suit || P.greatcoat;
      const btn = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="1.5"/>`;
      return `<path d="M-54 -16 Q-52 -150 -28 -170 L28 -170 Q52 -150 54 -16 Q0 -10 -54 -16 Z" fill="${c}" ${o}/>
        <path d="M-12 -170 L0 -152 L12 -170 Z" fill="${spec.shirt || P.oliveDark}" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M8 -146 V-14" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M-32 -60 L-36 -18 M32 -60 L36 -18" stroke="${P.ink}" stroke-width="2" opacity=".4"/>
        ${btn(-10, -132)}${btn(24, -132)}${btn(-10, -110)}${btn(24, -110)}${btn(-10, -64)}${btn(24, -64)}
        <rect x="-48" y="-96" width="96" height="13" fill="${P.leather}" stroke="${P.ink}" stroke-width="2.5"/>
        <rect x="-8" y="-99" width="18" height="19" rx="2" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="2"/>
        <path d="M-30 -172 L-8 -146 L-24 -132 L-40 -158 Z M30 -172 L8 -146 L24 -132 L40 -158 Z" fill="${c}" stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"/>
        ${[-1, 1].map((sd) => `<g transform="translate(${sd * 36} -163) rotate(${sd * 24})"><rect x="-11" y="-5" width="22" height="10" rx="3" fill="${c}" stroke="${P.ink}" stroke-width="2"/></g>`).join('')}`;
    }
    case 'tunic': { // high-collared military tunic: stand collar, short button placket, two flapped breast pockets, belt. suit = colour
      const c = spec.suit || P.olive;
      const pocket = (sd) => `<path d="M${sd * 12} -134 H${sd * 36} V-110 H${sd * 12} Z" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
        <path d="M${sd * 10} -138 H${sd * 38} L${sd * 36} -126 Q${sd * 24} -121 ${sd * 12} -126 Z" fill="${c}" stroke="${P.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="${sd * 24}" cy="-127" r="2.6" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="1.2"/>`;
      return `<path d="${torso}" fill="${c}" ${o}/>
        <rect x="-20" y="-176" width="40" height="18" rx="5" fill="${c}" stroke="${P.ink}" stroke-width="3"/>
        <path d="M0 -158 V-96" stroke="${P.ink}" stroke-width="2.5"/>
        ${[-148, -132, -116].map((y) => `<circle cx="0" cy="${y}" r="2.8" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="1.4"/>`).join('')}
        ${pocket(-1)}${pocket(1)}
        <rect x="-42" y="-94" width="84" height="12" fill="${P.leather}" stroke="${P.ink}" stroke-width="2.5"/>
        <rect x="-7" y="-97" width="14" height="18" rx="2" fill="${P.goldDark}" stroke="${P.ink}" stroke-width="2"/>
        ${[-1, 1].map((sd) => `<g transform="translate(${sd * 34} -164) rotate(${sd * 26})"><rect x="-12" y="-5" width="24" height="10" rx="3" fill="${c}" stroke="${P.ink}" stroke-width="2"/></g>`).join('')}`;
    }
    default: // suit
      return `<path d="${torso}" fill="${spec.suit || P.navy}" ${o}/>
        <path d="M-14 -168 L0 -120 L14 -168 Z" fill="${spec.shirt || '#f2efe6'}" stroke="${P.ink}" stroke-width="3"/>
        ${spec.tie === null ? '' : `<path d="M0 -160 L-6 -146 L0 -114 L6 -146 Z" fill="${spec.tie || P.red}" stroke="${P.ink}" stroke-width="2.5"/>`}
        <path d="M-26 -168 L-6 -126 M26 -168 L6 -126" stroke="${P.ink}" stroke-width="3" fill="none"/>
        <circle cx="0" cy="-96" r="3" fill="${P.ink}"/>`;
  }
}

// Small extras worn on the body (drawn over the outfit).
function bodyExtras(spec) {
  if (spec.necklace) return necklace(spec) + bodyExtrasRest(spec);
  return bodyExtrasRest(spec);
}
function necklace(spec) {
  return `<path d="M-15 -166 Q0 -152 15 -166" stroke="${spec.necklace === true ? P.gold : spec.necklace}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
}
function bodyExtrasRest(spec) {
  let out = '';
  if (spec.pin) out += `<g transform="translate(-24 -142)"><rect x="-7" y="-5" width="14" height="10" fill="#fff" stroke="${P.ink}" stroke-width="1.5"/><rect x="-7" y="-5" width="6" height="5" fill="${P.blue}"/><path d="M-1 -2 H7 M-7 2 H7" stroke="${P.red}" stroke-width="1.6"/></g>`;
  if (spec.badge) out += `<rect x="14" y="-146" width="18" height="12" rx="2" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/>`;
  if (spec.lanyard) out += `<path d="M-14 -166 L0 -118 L14 -166" fill="none" stroke="${P.red}" stroke-width="3"/><rect x="-10" y="-118" width="20" height="26" fill="#fff" stroke="${P.ink}" stroke-width="2"/>`;
  return out;
}

// Prop held in the screen-right hand (state.holding). Drawn over the hand position.
function heldProp(kind, [hx, hy]) {
  const o = `stroke="${P.ink}" stroke-width="3" stroke-linejoin="round"`;
  switch (kind) {
    case 'phone':
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(-12)"><rect x="-9" y="-30" width="20" height="36" rx="4" fill="${P.ink}"/><rect x="-6" y="-26" width="14" height="24" rx="2" fill="${P.blue}" opacity=".8"/></g>`;
    case 'paper':
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(6)"><rect x="-6" y="-56" width="44" height="58" fill="${P.paper}" ${o}/><path d="M2 -44 H30 M2 -34 H30 M2 -24 H24" stroke="${P.inkSoft}" stroke-width="2"/></g>`;
    case 'money':
      return `<g transform="translate(${n(hx)} ${n(hy)})"><rect x="-4" y="-34" width="56" height="28" rx="3" fill="${P.green}" ${o} transform="rotate(-18)"/><rect x="0" y="-30" width="56" height="28" rx="3" fill="#7fa577" ${o} transform="rotate(-6)"/><circle cx="28" cy="-17" r="7" fill="none" stroke="${P.greenDark}" stroke-width="2.5" transform="rotate(-6)"/></g>`;
    case 'mic':
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(-20)"><rect x="-5" y="-6" width="10" height="34" rx="3" fill="${P.ink}"/><circle cx="0" cy="-14" r="13" fill="${P.greyDark}" ${o}/><path d="M-8 -20 H8 M-9 -13 H9 M-8 -6 H8" stroke="${P.grey}" stroke-width="2"/></g>`;
    case 'briefcase':
      return `<g transform="translate(${n(hx)} ${n(hy)})"><path d="M-12 4 V-4 H12 V4" fill="none" stroke="${P.ink}" stroke-width="4"/><rect x="-34" y="4" width="68" height="48" rx="5" fill="${P.woodMid}" ${o}/><path d="M-34 22 H34" stroke="${P.woodDark}" stroke-width="2.5"/><rect x="-6" y="18" width="12" height="9" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/></g>`;
    case 'sign':
      return `<g transform="translate(${n(hx)} ${n(hy)})"><path d="M0 10 V-120" stroke="${P.woodMid}" stroke-width="7"/><rect x="-60" y="-190" width="120" height="76" fill="${P.paper}" ${o}/></g>`;
    case 'glass': // champagne flute, held by the stem
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(-6)"><path d="M-11 -64 L11 -64 Q12 -28 2 -14 H-2 Q-12 -28 -11 -64 Z" fill="${P.bubble}" opacity=".9"/>
        <path d="M-10 -50 L10 -50 Q11 -28 2 -16 H-2 Q-11 -28 -10 -50 Z" fill="${P.gold}"/>
        <circle cx="-3" cy="-36" r="1.8" fill="#fff"/><circle cx="3" cy="-28" r="1.5" fill="#fff"/><circle cx="-1" cy="-43" r="1.3" fill="#fff"/>
        <path d="M-11 -64 L11 -64 Q12 -28 2 -14 H-2 Q-12 -28 -11 -64 Z" fill="none" stroke="${P.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M0 -14 V10 M-10 12 Q0 6 10 12" stroke="${P.ink}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    case 'camera': // compact camera held up, lens facing the viewer
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(-4)"><rect x="-30" y="-44" width="62" height="40" rx="6" fill="${P.charcoal}" ${o}/>
        <rect x="-22" y="-52" width="18" height="9" rx="2" fill="${P.greyDark}" stroke="${P.ink}" stroke-width="2.5"/>
        <circle cx="4" cy="-24" r="14" fill="${P.greyDark}" stroke="${P.ink}" stroke-width="3"/><circle cx="4" cy="-24" r="7" fill="${P.nightMid}" stroke="${P.ink}" stroke-width="2"/>
        <circle cx="1" cy="-27" r="2.2" fill="#fff" opacity=".7"/><rect x="20" y="-39" width="8" height="5" fill="${P.paper}"/></g>`;
    case 'laptop': // open laptop carried flat, screen facing the viewer
      return `<g transform="translate(${n(hx)} ${n(hy)})"><path d="M-48 -6 H48 L40 6 H-40 Z" fill="${P.greyLight}" ${o}/>
        <rect x="-44" y="-62" width="88" height="56" rx="4" fill="${P.greyDark}" ${o}/>
        <rect x="-37" y="-55" width="74" height="42" rx="2" fill="${P.blue}" opacity=".85"/>
        <path d="M-30 -46 H10 M-30 -38 H22 M-30 -30 H0" stroke="${P.paper}" stroke-width="3" opacity=".7"/></g>`;
    case 'book': // hardback book
      return `<g transform="translate(${n(hx)} ${n(hy)}) rotate(8)"><rect x="-4" y="-62" width="44" height="60" fill="${P.paper}" ${o}/>
        <rect x="-8" y="-64" width="44" height="60" rx="2" fill="${P.redDark}" ${o}/>
        <path d="M-1 -64 V-4" stroke="${P.ink}" stroke-width="2.5"/>
        <rect x="6" y="-52" width="24" height="10" fill="${P.gold}" stroke="${P.ink}" stroke-width="1.5"/></g>`;
    default:
      return '';
  }
}

// One arm. side: -1 = character's right (screen left), +1 = screen right.
// pose = [shoulderAngle, elbowBend] in degrees. 0 = hanging straight down;
// positive swings outward/upward (180 = straight up). elbowBend adds to it.
function armPoints(side, pose) {
  const [a, b] = pose;
  const sx = side * 34, sy = SHOULDER_Y;
  const L1 = 50, L2 = 48;
  const ex = sx + side * Math.sin(rad(a)) * L1;
  const ey = sy + Math.cos(rad(a)) * L1;
  const hx = ex + side * Math.sin(rad(a + b)) * L2;
  const hy = ey + Math.cos(rad(a + b)) * L2;
  return { sx, sy, ex, ey, hx, hy };
}

function arm(side, pose, handColor = P.skin) {
  const { sx, sy, ex, ey, hx, hy } = armPoints(side, pose);
  // control point chosen so the curve passes through the elbow
  const cx = 2 * ex - (sx + hx) / 2;
  const cy = 2 * ey - (sy + hy) / 2;
  return `<path d="M${n(sx)} ${n(sy)} Q${n(cx)} ${n(cy)} ${n(hx)} ${n(hy)}" stroke="${P.ink}" stroke-width="${LIMB}" stroke-linecap="round" fill="none"/>
    <circle cx="${n(hx)}" cy="${n(hy)}" r="9" fill="${handColor}" stroke="${P.ink}" stroke-width="3.5"/>`;
}

function legs(walk) {
  const s = `stroke="${P.ink}" stroke-width="${LIMB}" stroke-linecap="round" fill="none"`;
  if (walk == null) {
    return `<path d="M-14 0 L-12 ${HIP_Y - 4} M14 0 L12 ${HIP_Y - 4}" ${s}/>
      <ellipse cx="-17" cy="0" rx="13" ry="6" fill="${P.ink}"/><ellipse cx="17" cy="0" rx="13" ry="6" fill="${P.ink}"/>`;
  }
  const sw = Math.sin(walk) * 18;
  const liftL = Math.max(0, Math.sin(walk)) * 8;
  const liftR = Math.max(0, -Math.sin(walk)) * 8;
  return `<path d="M${n(-10 + sw)} ${n(-liftL)} L-12 ${HIP_Y - 4} M${n(10 - sw)} ${n(-liftR)} L12 ${HIP_Y - 4}" ${s}/>
    <ellipse cx="${n(-10 + sw + 4)}" cy="${n(-liftL)}" rx="13" ry="6" fill="${P.ink}"/>
    <ellipse cx="${n(10 - sw + 4)}" cy="${n(-liftR)}" rx="13" ry="6" fill="${P.ink}"/>`;
}

// ---------- assemble ----------
// spec: identity (constant for a character). state: what they do this frame.
// Deep skin tones get a deeper blush (pink reads oddly on them).
function autoBlush(skin) {
  const m = /^#([0-9a-f]{6})$/i.exec(skin || '');
  if (!m) return P.blush;
  const v = parseInt(m[1], 16);
  const lum = (0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
  return lum < 0.62 ? P.blushDeep : P.blush;
}

function character(spec = {}, st = {}) {
  // The not-yet-revealed person: every fill goes dark and the face is left blank (and has no data-qa).
  if (spec.silhouette) {
    const S = typeof spec.silhouette === 'string' ? spec.silhouette : P.silhouette;
    spec = { ...spec, suit: S, shirt: S, tie: spec.tie === undefined ? null : S, skin: S, hairColor: S, hatColor: S, hatBand: S, print: null,
      drawHead: () => `<circle cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${S}" stroke="${P.ink}" stroke-width="${OUT}"/>${hair(spec.hair, S)}${hat(spec.hat, S, S)}` };
  }
  const eyesKind = st.blink ? 'closed' : st.eyes || 'dot';
  const mouthKind = st.talk ? (st.talkMouth || 'open') : st.mouth || 'neutral';
  const b = st.breathe || 1;
  const bob = st.walk != null ? -Math.abs(Math.sin(st.walk)) * 5 : 0;
  const armL = st.armL || [10, -6];
  const armR = st.armR || [10, -6];
  const carry = st.carry === 'box'
    ? `<g><rect x="-46" y="-140" width="92" height="64" fill="${P.paperShade}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/><path d="M-46 -124 H46" stroke="${P.ink}" stroke-width="3"/><rect x="-20" y="-118" width="40" height="14" fill="${P.paper}" stroke="${P.ink}" stroke-width="2"/></g>`
    : '';
  const skin = spec.skin || P.skin;
  // Staging (acting): turn -1..1 = three-quarter view toward screen left/right; back = seen from behind (over-the-shoulder
  // foregrounds); sit = seated on a chair (behind a desk the legs are hidden anyway).
  const T = Math.max(-1, Math.min(1, st.turn || 0));
  if (st.back) return backView(spec, st, skin);
  // Hero characters (e.g. the finance host, lib/host.js) bring their own detailed head via spec.drawHead.
  const head = spec.drawHead ? spec.drawHead(st, spec) : `<circle data-qa="face" cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${skin}" stroke="${P.ink}" stroke-width="${OUT}"/>
    ${hair(spec.hair, spec.hairColor || '#4a4038')}
    ${spec.earrings ? `<circle cx="-64" cy="-212" r="5" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/><circle cx="64" cy="-212" r="5" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/>` : ''}
    <g transform="translate(${n(T * 17)} 0)">
    ${T > 0.3 ? '' : `<ellipse cx="-38" cy="-210" rx="12" ry="7" fill="${spec.blushColor || autoBlush(skin)}" opacity=".75"/>`}
    ${T < -0.3 ? '' : `<ellipse cx="38" cy="-210" rx="12" ry="7" fill="${spec.blushColor || autoBlush(skin)}" opacity=".75"/>`}
    ${beard(spec.beard, spec.beardColor || spec.hairColor || '#4a4038')}
    ${eyes(eyesKind, st.look ?? T)}${glasses(spec.glasses)}${brows(st.brows || 'flat')}
    ${Math.abs(T) > 0.25 ? `<path d="M${n(T * 30)} -226 q${n(T * 12)} 8 0 14" stroke="${P.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : ''}
    ${moustache(spec.moustache, spec.moustacheColor)}${mouth(mouthKind)}
    ${spec.cigar ? `<rect x="10" y="-206" width="34" height="9" rx="3" fill="#8a5a3c" stroke="${P.ink}" stroke-width="2.5"/>` : ''}
    ${headset(spec.headset)}</g>${veilFront(spec.veil)}
    ${hat(spec.hat, spec.hatColor || HAT_COLOR[spec.hat], spec.hatBand || HAT_BAND[spec.hat])}`;
  const headTilt = st.tilt ? `transform="rotate(${n(st.tilt)} 0 ${SHOULDER_Y - 20})"` : '';
  const held = st.holding && !carry ? heldProp(st.holding, handPosition(1, armR)) : '';
  // re-draw the hand on top of held items so fingers overlap the prop
  const handTop = held && st.holding !== 'briefcase' && st.holding !== 'sign'
    ? (() => { const [hx, hy] = handPosition(1, armR); return `<circle cx="${n(hx)}" cy="${n(hy)}" r="9" fill="${skin}" stroke="${P.ink}" stroke-width="3.5"/>`; })()
    : '';
  const size = spec.size && spec.size !== 1 ? `transform="scale(${n(spec.size)})"` : '';
  const sitY = st.sit ? 40 : 0; // seated: the upper body drops onto the chair
  return `<g ${size}><g transform="translate(0 ${n(bob)})">
    ${st.sit ? chairBack(spec.chairColor) : ''}
    <g transform="translate(0 ${sitY}) translate(0 ${HIP_Y}) scale(1 ${n(b)}) translate(0 ${-HIP_Y})"><g ${headTilt}>${veilBack(spec.veil)}</g></g>
    ${st.legs === false ? '' : st.sit ? seatedLegs() : legs(st.walk)}
    <g transform="translate(0 ${sitY}) translate(0 ${HIP_Y}) scale(1 ${n(b)}) translate(0 ${-HIP_Y})">
      <g transform="scale(${n(1 - 0.1 * Math.abs(T))} 1)">${body(spec)}${bodyExtras(spec)}</g>
      ${carry ? '' : arm(-1, armL, skin) + arm(1, armR, skin)}
      ${held}${handTop}
      ${carry}
      ${carry ? arm(-1, [28, -70], skin) + arm(1, [28, -70], skin) : ''}
      <g ${headTilt}>${head}</g>
      ${carry ? '' : (armL[0] > 100 ? arm(-1, armL, skin) : '') + (armR[0] > 100 ? arm(1, armR, skin) + held + handTop : '')}
    </g>
  </g></g>`;
}

// Seated: an office chair behind the body, short foreshortened legs (knees toward the camera).
function chairBack(color = P.charcoal) {
  const o = `stroke="${P.ink}" stroke-width="${OUT}" stroke-linejoin="round"`;
  return `<rect x="-64" y="-150" width="128" height="132" rx="22" fill="${color}" ${o}/>
    <path d="M-52 0 L-46 -18 M52 0 L46 -18" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>`;
}
function seatedLegs() {
  const s = `stroke="${P.ink}" stroke-width="${LIMB}" stroke-linecap="round" fill="none"`;
  return `<rect x="-58" y="-24" width="116" height="16" rx="7" fill="${P.charcoal}" stroke="${P.ink}" stroke-width="3.5"/>
    <path d="M-18 -16 L-22 0 M18 -16 L22 0" ${s}/>
    <ellipse cx="-25" cy="0" rx="13" ry="6" fill="${P.ink}"/><ellipse cx="25" cy="0" rx="13" ry="6" fill="${P.ink}"/>`;
}

// Seen from behind (over-the-shoulder foregrounds): back of the head (hair), ears, the jacket's back, arms.
function backView(spec, st, skin) {
  const hc = ['bald', 'none'].includes(spec.hair) ? skin : spec.hairColor || '#4a4038';
  const backBody = body({ ...spec, tie: null, shirt: spec.outfit === 'shirt' || spec.outfit === 'tshirt' || spec.outfit === 'hoodie' ? spec.shirt : spec.suit || spec.shirt, print: null });
  const o = `stroke="${P.ink}" stroke-width="${OUT}"`;
  const armL = st.armL || [10, -6], armR = st.armR || [10, -6];
  const sitY = st.sit ? 40 : 0;
  return `<g ${spec.size && spec.size !== 1 ? `transform="scale(${n(spec.size)})"` : ''}>${st.sit ? chairBack(spec.chairColor) : ''}
    ${st.legs === false ? '' : st.sit ? seatedLegs() : legs(null)}
    <g transform="translate(0 ${sitY})">${backBody}${arm(-1, armL, skin)}${arm(1, armR, skin)}
    <circle cx="-64" cy="-226" r="11" fill="${skin}" stroke="${P.ink}" stroke-width="3.5"/><circle cx="64" cy="-226" r="11" fill="${skin}" stroke="${P.ink}" stroke-width="3.5"/>
    <circle cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${skin}" ${o}/>
    ${hc !== skin ? `<path d="M-64 -214 A66 66 0 1 1 64 -214 Q0 -190 -64 -214 Z" fill="${hc}" stroke="${P.ink}" stroke-width="3.5"/>` : ''}
    ${hat(spec.hat, spec.hatColor || HAT_COLOR[spec.hat], spec.hatBand || HAT_BAND[spec.hat], true)}</g></g>`;
}

// Where a hand ends up for a pose (useful for attaching props or aiming bubbles).
function handPosition(side, pose) {
  const { hx, hy } = armPoints(side, pose);
  return [hx, hy];
}

// Head-top / mouth anchor points (local coordinates) for bubbles and labels.
const ANCHOR = { mouth: [0, -204], headTop: [0, -302], head: [0, HEAD_Y], chest: [0, -130] };

// ---------- ready-made cast ----------
// Generic archetypes. Real public figures get their own entries with ONE signature feature.
const CAST = {
  banker: { outfit: 'suit', suit: P.navy, tie: P.red, hair: 'slick', hairColor: '#4a4038' },
  oldBanker: { outfit: 'suit', suit: P.charcoal, tie: P.gold, hair: 'bald', hairColor: P.greyLight, glasses: true, moustache: 'walrus', moustacheColor: P.greyLight },
  robberBaron: { outfit: 'coat', suit: P.charcoal, hair: 'bald', hairColor: P.greyLight, hat: 'tophat', moustache: 'walrus', moustacheColor: P.greyLight },
  regulator: { outfit: 'suit', suit: '#5b5f66', tie: P.blue, hair: 'side', hairColor: P.greyLight, glasses: true },
  trader: { outfit: 'shirt', shirt: '#c9d6e3', hair: 'side', hairColor: '#2f2a26' },
  homeowner: { outfit: 'shirt', shirt: P.green, hair: 'curly', hairColor: '#5a3e2b' },
  homeownerWoman: { outfit: 'dress', shirt: P.gold, hair: 'bob', hairColor: '#6b3f2a' },
  analyst: { outfit: 'suit', suit: '#4a4f45', tie: null, hair: 'bun', hairColor: '#3a2d25', glasses: true },

  ceo: { outfit: 'suit', suit: P.charcoal, tie: P.redDark, hair: 'slick', hairColor: P.greyLight },
  founder: { outfit: 'hoodie', shirt: P.greyDark, hair: 'curly', hairColor: '#3a2d25' },
  founderTurtle: { outfit: 'turtleneck', hair: 'bob', hairColor: '#d8c08a' },
  investor: { outfit: 'vest', suit: P.greyDark, shirt: '#e3ecf2', tie: P.blue, hair: 'side', hairColor: '#6b5a4a', glasses: true },
  politician: { outfit: 'suit', suit: '#2f3a52', tie: P.red, hair: 'side', hairColor: P.greyLight, pin: true },
  regulatorWoman: { outfit: 'suit', suit: '#55606b', tie: null, hair: 'bob', hairColor: P.greyLight, glasses: true, badge: true },
  worker: { outfit: 'overalls', suit: P.blue, shirt: P.paperDim, hair: 'none', hat: 'cap', hatColor: P.red },
  reporter: { outfit: 'suit', suit: '#6b4a3a', tie: null, shirt: '#f2efe6', hair: 'ponytail', hairColor: '#4a3020', lanyard: true },
  judge: { outfit: 'robe', hair: 'bald', hairColor: P.greyLight, glasses: true },
  child: { outfit: 'shirt', shirt: P.gold, hair: 'spiky', hairColor: '#6b3f2a', size: 0.72 },
  elderly: { outfit: 'vest', suit: '#7a6a55', shirt: '#efe8d6', tie: null, hair: 'bald', hairColor: '#e8e4dc', glasses: true, moustache: 'thin', moustacheColor: '#e8e4dc' },
  elderlyWoman: { outfit: 'dress', shirt: '#8a6b8a', hair: 'bun', hairColor: '#e8e4dc', glasses: true },
  crowdA: { outfit: 'suit', suit: '#4a4f58', tie: P.blue, hair: 'side', hairColor: '#3a2d25' },
  crowdB: { outfit: 'shirt', shirt: '#b8a07a', hair: 'long', hairColor: '#6b3f2a' },
  crowdC: { outfit: 'suit', suit: '#5a4a3a', tie: P.gold, hair: 'bald', hairColor: '#4a4038' },

  // uniforms & occupations
  officer: { outfit: 'uniform', suit: P.olive, hat: 'service', hair: 'side', hairColor: '#4a4038', skin: P.skin2 },
  pilot: { outfit: 'uniform', suit: P.navy, shirt: '#f2efe6', tie: P.ink, hat: 'service', hatColor: P.navy, hatBand: P.ink, hair: 'side', hairColor: P.greyLight, skin: P.skin1 },
  fighterPilot: { outfit: 'flightsuit', hat: 'pilotHelmet', hair: 'none', skin: P.skin4 },
  controller: { outfit: 'shirt', shirt: '#c9d6e3', hair: 'curly', hairColor: '#2f2a26', headset: true, skin: P.skin5 },
  policeOfficer: { outfit: 'police', hat: 'police', hair: 'side', hairColor: '#2f2a26', skin: P.skin5 },
  firefighter: { outfit: 'firefighter', hat: 'helmet', hair: 'none', beard: 'short', beardColor: '#6b3f2a', skin: P.skin3 },
  scientist: { outfit: 'labcoat', shirt: '#c9d6e3', tie: P.navy, hair: 'bun', hairColor: '#e8e4dc', glasses: true, skin: P.skin4 },
  engineer: { outfit: 'shirt', shirt: P.blue, hat: 'hardhat', hair: 'none', beard: 'full', beardColor: '#2f2a26', skin: P.skin6 },
  groom: { outfit: 'tuxedo', hair: 'slick', hairColor: '#2f2a26', skin: P.skin3 },
  bride: { outfit: 'weddingDress', veil: true, hair: 'bun', hairColor: '#6b3f2a', skin: P.skin2 },
  unknown: { outfit: 'coat', hair: 'side', silhouette: true },
  // everyday people, varied skin tones
  passerby: { outfit: 'tshirt', shirt: P.green, hair: 'spiky', hairColor: '#2f2a26', beard: 'short', beardColor: '#2f2a26', skin: P.skin5 },
  neighbor: { outfit: 'dress', shirt: P.blue, hair: 'curly', hairColor: '#2a221e', earrings: true, skin: P.skin6 },
  student: { outfit: 'tshirt', shirt: P.gold, print: 'U', printColor: P.ink, hair: 'ponytail', hairColor: '#4a3020', skin: P.skin2 },
  shopkeeper: { outfit: 'shirt', shirt: '#b8a07a', hair: 'bald', hairColor: '#2f2a26', glasses: true, beard: 'full', beardColor: P.greyLight, skin: P.skin4 },
};

// ---------- crowds ----------
// Simple seated crowd of head-and-shoulder busts (parliament, hearing, shareholder meeting).
// Rows go back -> front, front rows a little bigger. Pure in its seed.
// The finance host (detailed hero head + house-style twin), see lib/host.js.
Object.assign(CAST, require('./host').HOST_CAST);

function crowd(seed, rows, cols, x, y, w, h, scale = 0.3) {
  let a = seed >>> 0;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const suits = [P.navy, P.charcoal, '#4a4f58', '#5a4a3a', '#55606b', '#6b4a3a', P.greyDark];
  const hairs = ['slick', 'side', 'bald', 'bob', 'curly', 'bun', 'long', 'none'];
  const hairCols = ['#4a4038', '#2f2a26', P.greyLight, '#6b3f2a', '#3a2d25', '#d8c08a'];
  let out = '';
  for (let j = 0; j < rows; j++) {
    const k = rows === 1 ? 1 : j / (rows - 1);
    const s = scale * (0.85 + 0.3 * k);
    const yy = y + k * h;
    const step = w / cols;
    for (let i = 0; i < cols; i++) {
      const xx = x + step * (i + 0.5) + (j % 2 ? step * 0.25 : -step * 0.15) + (r() - 0.5) * step * 0.2;
      const suit = suits[Math.floor(r() * suits.length)];
      const hr = hairs[Math.floor(r() * hairs.length)];
      const hc = hairCols[Math.floor(r() * hairCols.length)];
      const glassesOn = r() < 0.2;
      const mood = r();
      const eyesK = mood < 0.15 ? 'closed' : 'dot';
      out += `<g transform="translate(${n(xx)} ${n(yy)}) scale(${n(s)})">
        <path d="M-46 0 Q-48 -70 -28 -84 L28 -84 Q48 -70 46 0 Z" fill="${suit}" stroke="${P.ink}" stroke-width="${OUT}" stroke-linejoin="round"/>
        <path d="M-12 -84 L0 -60 L12 -84 Z" fill="#f2efe6" stroke="${P.ink}" stroke-width="3"/>
        <g transform="translate(0 84)">
          <circle cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${P.skin}" stroke="${P.ink}" stroke-width="${OUT}"/>
          ${hair(hr, hc)}
          <ellipse cx="-38" cy="-210" rx="12" ry="7" fill="${P.blush}" opacity=".7"/><ellipse cx="38" cy="-210" rx="12" ry="7" fill="${P.blush}" opacity=".7"/>
          ${eyes(eyesK)}${glasses(glassesOn)}${mouth(mood > 0.8 ? 'frown' : 'flat')}
        </g>
      </g>`;
    }
  }
  return out;
}


// Every valid cast feature, for the validator (lib/validate.js). When you add a hair style, outfit, hat, moustache or
// beard above, add its name here too so shots.json / storyboard casts can use it.
const FEATURES = {
  hair: ['slick', 'side', 'bald', 'bob', 'curly', 'long', 'spiky', 'ponytail', 'bun', 'none'],
  outfit: ['suit', 'shirt', 'dress', 'coat', 'hoodie', 'turtleneck', 'vest', 'robe', 'overalls', 'blazer',
    'uniform', 'police', 'firefighter', 'flightsuit', 'labcoat', 'tuxedo', 'weddingDress', 'tshirt', 'greatcoat', 'tunic'],
  hat: ['tophat', 'fedora', 'cap', 'service', 'police', 'hardhat', 'helmet', 'pilotHelmet', 'ushanka', 'stahlhelm', 'peaked'],
  moustache: ['brush', 'walrus', 'thin'],
  beard: ['short', 'full'],
  colors: ['suit', 'shirt', 'tie', 'hairColor', 'skin', 'hatColor', 'hatBand', 'moustacheColor', 'blushColor', 'beardColor', 'necklace', 'printColor'],
  flags: ['glasses', 'cigar', 'pin', 'badge', 'lanyard', 'earrings', 'necklace', 'headset', 'veil', 'silhouette'],
  numbers: ['size'],
  strings: ['print'], // free text: tshirt chest print (1-3 characters)
  holding: ['phone', 'paper', 'money', 'mic', 'briefcase', 'sign', 'glass', 'camera', 'laptop', 'book'], // state.holding values
};

module.exports = { FEATURES, character, handPosition, crowd, ANCHOR, CAST, HEAD_Y, HEAD_R };
