// Data kit showcase (finance pack): one shot per lib/datakit.js export.
const D = require('../../lib/datakit');

const fo = { vignette: 0.25 };
const shot = (name, dur, render) => ({ name, dur, render, frameOpts: fo });

module.exports = {
  fps: 24,
  shots: [
    shot('stock-chart', 3.6, (t) => D.stockChart({
      name: 'Nimbus Systems', ticker: 'NMBS', activeTab: '1Y', price: 412.37, change: -27, at: 0.2, drawDur: 2.2, endLabel: 'TODAY',
      data: [[0, 520], [1, 560], [2, 548], [3, 610], [4, 590], [5, 520], [6, 470], [7, 455], [8, 430], [9, 412]],
      xLabels: [[0, 'JAN'], [4.5, 'JUN'], [9, 'DEC']],
    }, t)),
    shot('ticker-chip', 3, (t) => `<rect width="1280" height="720" fill="#c9cfcf"/>`
      + D.tickerChip({ ticker: 'NMBS', change: -27, price: 412.37, x: 640, y: 300, at: 0.3 }, t)
      + D.tickerChip({ ticker: 'ORBT', change: '+439%', x: 640, y: 420, at: 0.9 }, t)),
    shot('ranking', 4, (t) => D.rankingBoard({
      title: 'LARGEST TRADING LOSSES', unit: '$B', at: 0.3, stagger: 0.45,
      rows: [{ label: 'Archegos', value: 10 }, { label: 'Amaranth', value: 6.6 }, { label: 'LTCM', value: 4.6, highlight: true }, { label: 'Societe Gen.', value: 7.2, emblem: 'SG' }, { label: 'JPMorgan', value: 6.2 }],
    }, t)),
    shot('winners-losers', 3.6, (t) => D.winnersLosers({
      left: { title: 'AI WINNERS', items: ['Chip makers', 'Cloud giants'], caption: 'OUTPERFORM' },
      right: { title: 'AI VICTIMS', items: ['Call centres', 'Stock photos'], caption: 'UNDERPERFORM' },
      at: 0.3, verdictAt: 1.6,
    }, t)),
    shot('calendar', 3.2, (t) => D.calendarFlip({ from: 'MARCH 2007', to: 'SEPT 2008', at: 0.4, dur: 1.8 }, t)),
    shot('cheque', 3.8, (t) => D.cheque({ payer: 'ORBIT CAPITAL', payee: 'Nimbus Systems', amount: 4000000000, memo: 'Series C', at: 0.3, signAt: 2.4 }, t)),
    shot('count-up', 3, (t) => D.countUp({ value: 613, prefix: '$', suffix: ' BILLION', caption: 'IN DEBT', at: 0.3, dur: 1.2 }, t)),
  ],
};
