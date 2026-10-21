// Character builder. One construction for every person in every episode:
// big round head, thick ink outline, dot eyes, blush, small body, noodle limbs.
// Identity comes from ONE OR TWO signature features (hair, hat, glasses, moustache, outfit colour).
//
// Local coordinates: origin = midpoint between the feet, y grows downward.
// Full height is ~370 units at scale 1 (head top at about y = -302).
// Position with: g(tr(x, y, scale), character(spec, state))

const P = require('./palette');
const { n } = require('./svg');

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

function hat(kind, color = P.charcoal, band = P.redDark) {
  const o = `stroke="${P.ink}" stroke-width="3.5" stroke-linejoin="round"`;
  switch (kind) {
    case 'tophat':
      return `<rect x="-42" y="-392" width="84" height="98" rx="6" fill="${color}" ${o}/><rect x="-42" y="-316" width="84" height="14" fill="${band}" ${o}/><ellipse cx="0" cy="-298" rx="72" ry="13" fill="${color}" ${o}/>`;
    case 'fedora':
      return `<path d="M-50 -296 Q-48 -352 0 -350 Q48 -352 50 -296 Z" fill="${color}" ${o}/><path d="M-50 -310 H50 V-298 H-50 Z" fill="${band}" ${o}/><ellipse cx="0" cy="-296" rx="84" ry="14" fill="${color}" ${o}/>`;
    case 'cap':
      return `<path d="M-62 -270 Q-60 -330 0 -330 Q60 -330 62 -270 Z" fill="${color}" ${o}/><path d="M-66 -272 Q0 -262 92 -268 Q80 -252 0 -256 Q-60 -258 -66 -272 Z" fill="${color}" ${o}/>`;
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
function character(spec = {}, st = {}) {
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
  // Hero characters (e.g. the finance host, lib/host.js) bring their own detailed head via spec.drawHead.
  const head = spec.drawHead ? spec.drawHead(st, spec) : `<circle data-qa="face" cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${skin}" stroke="${P.ink}" stroke-width="${OUT}"/>
    ${hair(spec.hair, spec.hairColor || '#4a4038')}
    ${spec.earrings ? `<circle cx="-64" cy="-212" r="5" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/><circle cx="64" cy="-212" r="5" fill="${P.gold}" stroke="${P.ink}" stroke-width="2"/>` : ''}
    <ellipse cx="-38" cy="-210" rx="12" ry="7" fill="${spec.blushColor || P.blush}" opacity=".75"/>
    <ellipse cx="38" cy="-210" rx="12" ry="7" fill="${spec.blushColor || P.blush}" opacity=".75"/>
    ${eyes(eyesKind, st.look || 0)}${glasses(spec.glasses)}${brows(st.brows || 'flat')}
    ${moustache(spec.moustache, spec.moustacheColor)}${mouth(mouthKind)}
    ${spec.cigar ? `<rect x="10" y="-206" width="34" height="9" rx="3" fill="#8a5a3c" stroke="${P.ink}" stroke-width="2.5"/>` : ''}
    ${hat(spec.hat, spec.hatColor, spec.hatBand)}`;
  const headTilt = st.tilt ? `transform="rotate(${n(st.tilt)} 0 ${SHOULDER_Y - 20})"` : '';
  const held = st.holding && !carry ? heldProp(st.holding, handPosition(1, armR)) : '';
  // re-draw the hand on top of held items so fingers overlap the prop
  const handTop = held && st.holding !== 'briefcase' && st.holding !== 'sign'
    ? (() => { const [hx, hy] = handPosition(1, armR); return `<circle cx="${n(hx)}" cy="${n(hy)}" r="9" fill="${skin}" stroke="${P.ink}" stroke-width="3.5"/>`; })()
    : '';
  const size = spec.size && spec.size !== 1 ? `transform="scale(${n(spec.size)})"` : '';
  return `<g ${size}><g transform="translate(0 ${n(bob)})">
    ${st.legs === false ? '' : legs(st.walk)}
    <g transform="translate(0 ${HIP_Y}) scale(1 ${n(b)}) translate(0 ${-HIP_Y})">
      ${body(spec)}${bodyExtras(spec)}
      ${carry ? '' : arm(-1, armL, skin) + arm(1, armR, skin)}
      ${held}${handTop}
      ${carry}
      ${carry ? arm(-1, [28, -70], skin) + arm(1, [28, -70], skin) : ''}
      <g ${headTilt}>${head}</g>
    </g>
  </g></g>`;
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
  outfit: ['suit', 'shirt', 'dress', 'coat', 'hoodie', 'turtleneck', 'vest', 'robe', 'overalls', 'blazer'],
  hat: ['tophat', 'fedora', 'cap'],
  moustache: ['brush', 'walrus', 'thin'],
  beard: [],
  colors: ['suit', 'shirt', 'tie', 'hairColor', 'skin', 'hatColor', 'hatBand', 'moustacheColor', 'blushColor', 'beardColor', 'necklace'],
  flags: ['glasses', 'cigar', 'pin', 'badge', 'lanyard', 'earrings', 'necklace'],
  numbers: ['size'],
};

module.exports = { FEATURES, character, handPosition, crowd, ANCHOR, CAST, HEAD_Y, HEAD_R };
