// Kits showcase 2: one shot per new or upgraded kind in lib/datakit.js and lib/screens.js.
const D = require('../../lib/datakit');
const S = require('../../lib/screens');

const fo = { vignette: 0.25 };
const shot = (name, dur, render) => ({ name, dur, render, frameOpts: fo });

module.exports = {
  fps: 24,
  shots: [
    shot('ledger', 4, (t) => D.ledger({
      title: 'Margin Account', at: 0.2, total: { label: 'BALANCE', amount: -500000 },
      rows: [
        { date: 'Jul 24', name: 'Own money in', note: 'savings', amount: 1000000 },
        { date: 'Jul 24', name: 'Loan from broker', note: '4 to 1', amount: 4000000 },
        { date: 'Jul 28', name: 'Shares fall 30%', note: 'margin call', amount: -1500000 },
      ],
    }, t)),
    shot('count-down', 3, (t) => D.countDown({ from: 45, to: 10, prefix: '$', suffix: ' BILLION', caption: 'GONE IN A WEEK', at: 0.3, dur: 1.4 }, t)),
    shot('donut', 3.6, (t) => D.donut({
      title: 'WHERE THE MONEY WENT', unit: '$B', at: 0.2, center: '$20B', centerSub: 'total',
      slices: [{ label: 'Tech stocks', value: 9 }, { label: 'Bonds', value: 4 }, { label: 'Crypto', value: 3 }, { label: 'Cash', value: 4 }],
    }, t)),
    shot('dual-chart', 3.8, (t) => D.dualChart({
      title: 'Same market, two stories', at: 0.2, splitAt: 1.6, splitLabel: 'JULY 24',
      a: { label: 'S&P 500 near record', data: [100, 101, 100.5, 102, 101.5, 102.5, 102, 103, 102.6, 103.2] },
      b: { label: 'Crowded trades', data: [100, 101.2, 100.4, 102.1, 101.4, 96, 90, 86, 84.5, 83] },
    }, t)),
    shot('calendar-days', 3.2, (t) => D.calendarFlip({ from: 'JULY 24', to: 'JULY 29', at: 0.3, dur: 1.6 }, t)),
    shot('calendar-months', 2.6, (t) => D.calendarFlip({ from: 'MARCH 2007', to: 'SEPT 2008', at: 0.3, dur: 1.5 }, t)),
    shot('leverage', 4.4, (t) => D.leverage({ own: 1, borrowed: 4, move: -30, at: 0.2, moveAt: 1.6 }, t)),
    shot('leverage-gain', 3.8, (t) => D.leverage({ own: 1, borrowed: 4, move: '+30%', at: 0.2, moveAt: 1.2 }, t)),
    shot('email', 4, (t) => S.email({
      from: 'risk@orbitcapital.com', to: 'all-traders@orbitcapital.com', subject: 'Cut positions by Friday',
      body: ['Team,', 'Reduce every crowded trade by half before the close on Friday.', 'No exceptions.'], at: 0.2, sendAt: 3.0,
    }, t)),
    shot('video-page', 3.4, (t) => S.videoPage({ title: 'Why the crowded trade blew up in one week', channel: 'Money Explained', views: 2418330, length: '14:32', at: 0.2, viewsAt: 0.8 }, t)),
    shot('cctv', 3, (t) => S.cctv({ label: 'CAM 03 · HALLWAY B', time: '07/24/2026 02:14:07', frame: '1/5', at: 0.1 }, t)),
    shot('cctv-door', 2.4, (t) => S.cctv({ label: 'CAM 07 · FRONT DOOR', time: '07/24/2026 02:16:41', frame: 2, frames: 5, scene: 'doorway', at: 0.1 }, t)),
    shot('radar-ring', 3.6, (t) => S.radar({
      ring: true, label: 'COVERAGE ONLY ON THE RIM', innerLabel: 'BLIND SPOT', at: 0.2,
      blips: [{ angle: 60, dist: 0.8, label: 'A' }, { angle: 200, dist: 0.85, label: 'B' }, { x: 0.15, y: -0.2, ghost: true }],
    }, t)),
    shot('radar', 3, (t) => S.radar({ label: 'SECTOR 7', at: 0.2, blips: [{ angle: 40, dist: 0.5, label: 'SHIP' }, { x: -0.5, y: 0.4 }] }, t)),
  ],
};
