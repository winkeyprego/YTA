// Screens kit showcase (finance pack). One shot per lib/screens.js export.
const S = require('../../lib/screens');

const shot = (name, fn, spec, dur = 3) => ({ name, dur, frameOpts: { vignette: 0.25 }, render: (t) => fn(spec, t) });

module.exports = {
  fps: 24,
  shots: [
    shot('social', S.socialPost, { name: 'Sam Founder', handle: '@samfounder', text: 'Today we launched our chatbot. Try talking with it here.', avatar: 'founder', likes: 48200, reposts: 9100, time: 'Dec 1, 2022', verified: true, at: 0.2 }),
    shot('notification', S.phoneNotification, { app: 'Broker', title: 'MARGIN CALL', body: 'Add more collateral to your account by 4:00 PM.', time: '9:41', urgent: true, count: 3, at: 0.4 }),
    shot('browser', S.browserArticle, { site: 'Market Daily', headline: 'Chipmaker shares plunge as the AI bubble fears grow', sub: 'Investors pull billions in a single afternoon', lines: 6, highlight: 'AI bubble', at: 0.2 }),
    shot('app', S.appPage, { name: 'ChatBot', category: 'Productivity', rating: 4.7, rank: '#1 FREE', downloads: 10000000, at: 0.2 }),
    shot('news', S.newsLive, { channel: 'Money News', headline: 'Bank shares crash on Monday', ticker: 'Markets fall 4% • Bond yields jump • Regulators call emergency meeting', anchor: 'reporter', at: 0.4 }),
    shot('terminal', S.terminal, { title: 'TERMINAL', lines: [
      { text: '> run model --task "summarise report"', at: 0.2 },
      { text: '[model] reading 412 pages...', at: 1.2 },
      { text: '[model] done in 3.2s', at: 2.0, color: '#e9c46a' },
    ] }),
    shot('chat', S.chatThread, { title: 'Dad', avatar: 'elderly', messages: [
      { from: 'right', text: 'I just bought the dip!', at: 0.2 },
      { from: 'left', text: 'Which dip?', at: 1.2 },
      { from: 'right', text: 'All of them.', at: 2.1 },
    ] }),
  ],
};
