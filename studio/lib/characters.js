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
    default: // suit
      return `<path d="${torso}" fill="${spec.suit || P.navy}" ${o}/>
        <path d="M-14 -168 L0 -120 L14 -168 Z" fill="${spec.shirt || '#f2efe6'}" stroke="${P.ink}" stroke-width="3"/>
        ${spec.tie === null ? '' : `<path d="M0 -160 L-6 -146 L0 -114 L6 -146 Z" fill="${spec.tie || P.red}" stroke="${P.ink}" stroke-width="2.5"/>`}
        <path d="M-26 -168 L-6 -126 M26 -168 L6 -126" stroke="${P.ink}" stroke-width="3" fill="none"/>
        <circle cx="0" cy="-96" r="3" fill="${P.ink}"/>`;
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
  const head = `<circle cx="0" cy="${HEAD_Y}" r="${HEAD_R}" fill="${spec.skin || P.skin}" stroke="${P.ink}" stroke-width="${OUT}"/>
    ${hair(spec.hair, spec.hairColor || '#4a4038')}
    <ellipse cx="-38" cy="-210" rx="12" ry="7" fill="${P.blush}" opacity=".75"/>
    <ellipse cx="38" cy="-210" rx="12" ry="7" fill="${P.blush}" opacity=".75"/>
    ${eyes(eyesKind, st.look || 0)}${glasses(spec.glasses)}${brows(st.brows || 'flat')}
    ${moustache(spec.moustache, spec.moustacheColor)}${mouth(mouthKind)}
    ${spec.cigar ? `<rect x="10" y="-206" width="34" height="9" rx="3" fill="#8a5a3c" stroke="${P.ink}" stroke-width="2.5"/>` : ''}
    ${hat(spec.hat, spec.hatColor, spec.hatBand)}`;
  const headTilt = st.tilt ? `transform="rotate(${n(st.tilt)} 0 ${SHOULDER_Y - 20})"` : '';
  return `<g transform="translate(0 ${n(bob)})">
    ${st.legs === false ? '' : legs(st.walk)}
    <g transform="translate(0 ${HIP_Y}) scale(1 ${n(b)}) translate(0 ${-HIP_Y})">
      ${body(spec)}
      ${carry ? '' : arm(-1, armL) + arm(1, armR)}
      ${carry}
      ${carry ? arm(-1, [28, -70]) + arm(1, [28, -70]) : ''}
      <g ${headTilt}>${head}</g>
    </g>
  </g>`;
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
};

module.exports = { character, handPosition, ANCHOR, CAST, HEAD_Y, HEAD_R };
