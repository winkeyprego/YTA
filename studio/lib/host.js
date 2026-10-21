// The finance host: a recurring character, NOT a presenter who carries the show.
// Use her occasionally (a shot here and there, or as part of an explanation), the same way any other cast member
// is used; most scenes use the regular cast, exactly as in the history style. Nothing else changes because of her.
// Based on the owner's reference illustration: brown skin, dark straight bob with a side part tucked behind one ear,
// big expressive eyes with lashes, warm smile, navy blazer over an open-neck white shirt, thin gold necklace,
// gold stud earrings.
//
// Two builds share the same body, arms, poses and state as every other character (lib/characters.js):
//   CAST.host       "hero" head: detailed face (eye whites, lashes, nose, lips, ear). Use for the host.
//   CAST.hostHouse  the same person in the plain house style (round head, dot eyes), for wide crowd shots.
// The state vocabulary is the same as everyone else's: eyes (dot|smug|happy|wide|sad|closed),
// brows (flat|raised|angry|worried|smug), mouth (neutral|smile|grin|smirk|open|o|frown|flat), look (-1..1).

const P = require('./palette');
const { n } = require('./svg');

const LOOK = {
  skin: '#8f5d3e',
  skinShade: '#7a4c31',
  hair: '#2a221e',
  hairLight: '#4d4038',
  hairShine: '#5e4f46',
  lips: '#7d4436',
  blush: '#a85b48',
  blazer: '#2d3a5a',
  shirt: '#f7f5ef',
  mouthDark: '#3a1f1a',
};

const CY = -238; // face centre (local coords, feet at 0)
const ink = (w = 3.5) => `stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

function eyesHero(kind, look) {
  const lx = -22, rx = 22, y = CY - 2;
  const px = 3 + look * 5; // she naturally glances slightly to screen-right
  const one = (x, s) => {
    const outer = x + 15 * s;
    const lashes = `<path d="M${outer + s} ${y - 2} l${8 * s} -2 M${outer - s} ${y - 7} l${8 * s} -6 M${outer - 4 * s} ${y - 11} l${5 * s} -8" ${ink(2.8)} fill="none"/>`;
    switch (kind) {
      case 'closed':
        return `<path d="M${x - 14} ${y} Q${x} ${y + 7} ${x + 14} ${y}" ${ink(4)} fill="none"/>${lashes}`;
      case 'happy':
        return `<path d="M${x - 14} ${y + 4} Q${x} ${y - 10} ${x + 14} ${y + 4}" ${ink(4.5)} fill="none"/>${lashes}`;
      case 'smug': // heavy lids
        return `<ellipse cx="${x}" cy="${y}" rx="15" ry="12" fill="#fff" ${ink(3)}/>
          <circle cx="${n(x + px)}" cy="${y + 2}" r="6.5" fill="${P.ink}"/>
          <path d="M${x - 16} ${y - 1} Q${x} ${y - 6} ${x + 16} ${y - 1} L${x + 16} ${y - 14} L${x - 16} ${y - 14} Z" fill="${LOOK.skin}"/>
          <path d="M${x - 15} ${y - 1} Q${x} ${y - 5} ${x + 15} ${y - 1}" ${ink(4)} fill="none"/>${lashes}`;
      case 'wide':
        return `<ellipse cx="${x}" cy="${y - 1}" rx="17" ry="15" fill="#fff" ${ink(3)}/>
          <circle cx="${n(x + px * 0.6)}" cy="${y - 1}" r="5" fill="${P.ink}"/>
          <path d="M${x - 17} ${y - 3} Q${x} ${y - 20} ${x + 17} ${y - 3}" ${ink(4)} fill="none"/>${lashes}`;
      case 'sad':
        return `<ellipse cx="${x}" cy="${y + 1}" rx="14" ry="11" fill="#fff" ${ink(3)}/>
          <circle cx="${n(x + px * 0.5)}" cy="${y + 3}" r="6" fill="${P.ink}"/>
          <path d="M${x - 14} ${y - 2 + (s > 0 ? 4 : 0)} Q${x} ${y - 10} ${x + 14} ${y - 2 + (s < 0 ? 4 : 0)}" ${ink(4)} fill="none"/>${lashes}`;
      default: // 'dot': open, friendly
        return `<ellipse cx="${x}" cy="${y}" rx="16" ry="14" fill="#fff" ${ink(3)}/>
          <circle cx="${n(x + px)}" cy="${y + 1}" r="7.5" fill="${P.ink}"/>
          <circle cx="${n(x + px + 2.8)}" cy="${y - 2.5}" r="2.2" fill="#fff"/>
          <path d="M${x - 16} ${y - 2} Q${x} ${y - 19} ${x + 16} ${y - 3}" ${ink(4.5)} fill="none"/>${lashes}`;
    }
  };
  return one(lx, -1) + one(rx, 1);
}

function browsHero(kind) {
  const c = `stroke="${LOOK.hair}" stroke-width="5.5" stroke-linecap="round" fill="none"`;
  const pair = (l, r) => `<path d="${l}" ${c}/><path d="${r}" ${c}/>`;
  const y = CY - 24;
  switch (kind) {
    case 'raised': return pair(`M-38 ${y - 4} Q-24 ${y - 16} -9 ${y - 10}`, `M9 ${y - 10} Q24 ${y - 16} 38 ${y - 4}`);
    case 'angry': return pair(`M-38 ${y - 6} Q-24 ${y - 6} -9 ${y + 4}`, `M9 ${y + 4} Q24 ${y - 6} 38 ${y - 6}`);
    case 'worried': return pair(`M-38 ${y + 2} Q-24 ${y - 6} -9 ${y - 8}`, `M9 ${y - 8} Q24 ${y - 6} 38 ${y + 2}`);
    case 'smug': return pair(`M-38 ${y + 2} Q-24 ${y - 4} -9 ${y}`, `M9 ${y - 6} Q24 ${y - 16} 38 ${y - 8}`);
    case 'none': return '';
    default: return pair(`M-38 ${y} Q-24 ${y - 10} -9 ${y - 4}`, `M9 ${y - 4} Q24 ${y - 10} 38 ${y}`);
  }
}

function mouthHero(kind) {
  const y = CY + 46; // ~ -192
  const lipLower = (w = 14, d = 10) => `<path d="M${-w} ${y + d} Q0 ${y + d + 9} ${w + 2} ${y + d - 2}" stroke="${LOOK.lips}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  switch (kind) {
    case 'grin':
    case 'smile': // the reference smile: open, teeth showing
      return `<path d="M-20 ${y - 2} Q0 ${y + 2} 21 ${y - 3} Q6 ${y + 18} -2 ${y + 17} Q-14 ${y + 14} -20 ${y - 2} Z" fill="#fff" ${ink(3)}/>
        <path d="M-21 ${y - 2} Q-9 ${y - 9} 0 ${y - 5} Q9 ${y - 9} 22 ${y - 3} Q9 ${y - 3} 0 ${y - 2} Q-10 ${y - 2} -21 ${y - 2} Z" fill="${LOOK.lips}" stroke="${P.ink}" stroke-width="2"/>
        <path d="M-12 ${y + 19} Q0 ${y + 27} 14 ${y + 17}" stroke="${LOOK.lips}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
    case 'open':
      return `<path d="M-15 ${y - 1} Q0 ${y - 5} 15 ${y - 1} Q13 ${y + 17} 0 ${y + 18} Q-13 ${y + 17} -15 ${y - 1} Z" fill="${LOOK.mouthDark}" ${ink(3)}/>
        <path d="M-12 ${y + 1} Q0 ${y - 2} 12 ${y + 1} L11 ${y + 5} Q0 ${y + 3} -11 ${y + 5} Z" fill="#fff"/>
        <path d="M-7 ${y + 14} Q0 ${y + 10} 7 ${y + 14}" stroke="#a5574a" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    case 'o':
      return `<ellipse cx="0" cy="${y + 6}" rx="8" ry="10" fill="${LOOK.mouthDark}" ${ink(3)}/>`;
    case 'frown':
      return `<path d="M-13 ${y + 8} Q0 ${y - 1} 13 ${y + 8}" ${ink(3.5)} fill="none"/>${lipLower(9, 12)}`;
    case 'flat':
      return `<path d="M-12 ${y + 4} H12" ${ink(3.5)}/>${lipLower(9, 8)}`;
    case 'smirk':
      return `<path d="M-12 ${y + 4} Q4 ${y + 8} 17 ${y - 3}" ${ink(3.5)} fill="none"/>${lipLower(9, 9)}`;
    default: // 'neutral': closed warm smile
      return `<path d="M-16 ${y - 1} Q-6 ${y - 5} 0 ${y - 2} Q7 ${y - 5} 16 ${y - 2} Q0 ${y + 1} -16 ${y - 1} Z" fill="${LOOK.lips}" opacity=".85"/>
        <path d="M-15 ${y} Q0 ${y + 9} 15 ${y - 1}" ${ink(3.5)} fill="none"/>
        <path d="M-9 ${y + 8} Q0 ${y + 14} 10 ${y + 7}" stroke="${LOOK.lips}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }
}

// The detailed head. Called by character() through spec.drawHead.
function heroHead(st) {
  const eyesKind = st.blink ? 'closed' : st.eyes || 'dot';
  const mouthKind = st.talk ? (st.talkMouth || 'open') : st.mouth || 'neutral';
  const look = st.look || 0;
  const hairO = `stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"`;
  return `
    <!-- back of the bob, falling to the collar -->
    <path d="M-62 -286 Q-90 -232 -82 -172 Q-74 -160 -58 -164 Q-52 -170 -50 -172 L50 -172 Q54 -168 60 -164 Q76 -160 81 -172 Q90 -232 62 -286 Q0 -334 -62 -286 Z" fill="${LOOK.hair}" ${hairO}/>
    <!-- neck -->
    <path d="M-13 -192 V-160 Q0 -154 13 -160 V-192 Z" fill="${LOOK.skin}" stroke="${P.ink}" stroke-width="3.5"/>
    <path d="M-13 -176 Q0 -170 13 -176" stroke="${LOOK.skinShade}" stroke-width="3" fill="none"/>
    <!-- ear (screen-right, hair tucked behind it) with gold stud -->
    <ellipse cx="55" cy="${CY + 4}" rx="10" ry="15" fill="${LOOK.skin}" ${ink(3.5)}/>
    <path d="M53 ${CY - 4} Q60 ${CY + 4} 54 ${CY + 12}" stroke="${LOOK.skinShade}" stroke-width="2.5" fill="none"/>
    <circle cx="57" cy="${CY + 22}" r="4.5" fill="${P.gold}" stroke="${P.ink}" stroke-width="1.8"/>
    <!-- face -->
    <ellipse cx="0" cy="${CY}" rx="56" ry="66" fill="${LOOK.skin}" stroke="${P.ink}" stroke-width="4.5"/>
    <ellipse cx="-34" cy="${CY + 26}" rx="12" ry="7" fill="${LOOK.blush}" opacity=".35"/>
    <ellipse cx="34" cy="${CY + 26}" rx="12" ry="7" fill="${LOOK.blush}" opacity=".35"/>
    ${eyesHero(eyesKind, look)}
    ${browsHero(st.brows || 'flat')}
    <!-- nose -->
    <path d="M2 ${CY + 2} Q-7 ${CY + 20} -3 ${CY + 27} Q4 ${CY + 31} 11 ${CY + 26}" ${ink(3)} fill="none"/>
    ${mouthHero(mouthKind)}
    <!-- front hair: side part on screen-right, sweeping across to cover the screen-left cheek -->
    <path d="M22 -306 Q-40 -320 -70 -270 Q-88 -226 -80 -176 Q-72 -162 -56 -170 Q-50 -176 -52 -184 Q-50 -208 -48 -232 Q-38 -264 -10 -282 Q8 -292 22 -300 Z" fill="${LOOK.hair}" ${hairO}/>
    <path d="M22 -306 Q64 -304 64 -252 Q60 -268 46 -278 Q32 -290 22 -300 Z" fill="${LOOK.hair}" ${hairO}/>
    <path d="M-26 -300 Q-56 -280 -64 -228" stroke="${LOOK.hairShine}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M-8 -302 Q-30 -290 -42 -266 M38 -300 Q54 -290 58 -272 M-70 -214 Q-72 -196 -68 -184" stroke="${LOOK.hairLight}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  `;
}

const HOST_CAST = {
  host: { outfit: 'blazer', suit: LOOK.blazer, shirt: LOOK.shirt, skin: LOOK.skin, necklace: true, drawHead: heroHead },
  hostHouse: { outfit: 'blazer', suit: LOOK.blazer, shirt: LOOK.shirt, skin: LOOK.skin, hair: 'bob', hairColor: LOOK.hair,
    earrings: true, necklace: true, blushColor: LOOK.blush },
};

module.exports = { HOST_CAST, heroHead, LOOK };
