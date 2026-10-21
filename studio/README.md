# Studio: animated explainer pipeline

Code-drawn 2D animation in the style of the "Two Sides of War" / "War Unspun" channels
(round-headed cartoon people, muted paper palette, taped date tags, maps, documents, stickers),
pointed at money and business history topics.

Everything is drawn with code (SVG), animated with pure time functions, and rendered to MP4
by headless Chromium + ffmpeg. No hand animation and no image generator are needed, and any frame can
be re-rendered on its own.

**Continuing this project? Read [`HANDOFF.md`](HANDOFF.md) first. Making a video? Follow [`PLAYBOOK.md`](PLAYBOOK.md).**

A video is plain data: `episodes/<name>/shots.json` (one entry per line of narration, see [`SHOTS.md`](SHOTS.md))
plus an optional voiceover. Word timings from the voice decide every shot's length and when every graphic pops.

## Quick start

Needs Node 18+, ffmpeg, and Playwright's Chromium.

```bash
cd studio
npm install                     # installs playwright
npx playwright install chromium # skip if Chromium is already available
pip install -r tools/requirements.txt  # speech-to-text for voiceover timing
node render.js episodes/template-starter --plan            # shot timings + pacing check
node render.js episodes/template-starter --sheet 1 --scale 1   # contact sheet (fast check)
node render.js episodes/template-starter --still 15        # one frame as PNG
node render.js episodes/template-starter                   # full MP4, 1920x1080
python3 tools/transcribe.py episodes/<ep>/vo.mp3           # voiceover -> words.json
```

Output goes to `renders/`.

## Layout

```
studio/
  HANDOFF.md           project memory: status, decisions, next steps (read first)
  PLAYBOOK.md          script -> finished video, step by step
  SHOTS.md             shots.json reference: every template and field
  CLAUDE.md            rules for any Claude session continuing this work
  STYLE-GUIDE.md       the visual bible: characters, colour, type, layout, graphics
  MOTION.md            camera, pacing, entrances, character acting, timing numbers
  docs/
    REFERENCE-ANALYSIS.md   measurements taken from the reference videos
    reference-metrics.json  the same numbers, machine-readable
  render.js            renderer CLI (mp4 / still / contact sheet)
  lib/
    palette.js         every colour the studio may use
    motion.js          easing, tweens, keyframes, pop, typewriter, blink, talk, shake
    svg.js             frame wrapper (grain, vignette, shadows), camera, text
    characters.js      character builder + ready-made cast
    props.js           rooms, windows, desks, clocks, charts, night city, towers
    ui.js              date tags, name plates, stickers, bubbles, cards, stamps, titles
    devices.js         signature recurring device: THE FUSE (+ tally scoreboard)
    sets.js            11 sets (office, boardroom, trading floor, bank, tower at night, street,
                       home, hearing hall, courtroom, factory, news studio)
    money.js           cash stacks, bags, coins, gold, vault, piggy bank, tickers, bar charts
    maps.js            real maps (Natural Earth): highlights, hatching, cities, arrows, legend
    templates.js       shot templates: talk, versus, document, chart, stat, fuse, map, money, title, chapter
    timing.js          lines up narration with word timings; estimates timing without a voice
    episode.js         builds an episode from shots.json; pacing checker
    stage.html         the page Chromium renders into (loads fonts)
  data/                Natural Earth country shapes (world-atlas, ISC; data public domain)
  tools/transcribe.py  voiceover -> word timings (faster-whisper)
  fonts/               Lilita One, Patrick Hand, Special Elite, Cormorant SC (open licences included)
  episodes/
    template-starter/  shots.json-only example of every template: copy it for a new video
    sample-2008-cold-open/  hand-coded example (episode.js), the original style test
    test-sets/, test-maps/  library showcases
  renders/             output (git-ignored; regenerate with render.js)
```

## How an episode works

Normally: `episodes/<name>/shots.json`, built by templates (see SHOTS.md). For one-off custom shots,
an episode can instead be code, as `episodes/<name>/episode.js`, which exports:

```js
module.exports = {
  fps: 24,
  audio: 'vo.mp3',           // optional, muxed into the MP4
  shots: [
    { name: 'cold-open', dur: 6.2, render(t, ctx) { return '<svg markup>'; } },
    ...
  ],
};
```

`render(t)` gets the shot-local time in seconds and returns SVG markup for 1280x720 design units.
It must be pure: no state between frames. Everything animated is a function of `t`.
Shots play back to back with hard cuts, as in the references. Chapter cards (`ui.chapterCard`) are the only fades.

## Workflow for a new episode

See PLAYBOOK.md: script → voice → `words.json` → `shots.json` → `--plan` → `--sheet` → render.

## Roadmap

- [x] Style library v1 (characters, props, UI, fuse device), renderer, 37s sample
- [x] Reference videos measured; defaults tuned to the numbers (docs/REFERENCE-ANALYSIS.md)
- [x] Faster render path (parallel workers, JPEG frames, grain in ffmpeg): ~2s of render per 1s of video on 4 CPUs (a 30-min episode is about an hour)
- [x] VO timing: word timestamps (faster-whisper); shots and cues timed to words; silence inserted for cards
- [x] Map kit (Natural Earth countries, highlights, hatching, cities, arrows, legend)
- [x] Sets (11), cast (~25 archetypes), money graphics
- [x] Shot templates driven from shots.json, plus a pacing checker
- [ ] Sound kit (music bed ~17 dB under the voice, sparse pops/whooshes), loudness to −14 LUFS
- [ ] More templates: calendar flip, timeline, balance scale, ledger, newspaper headline, phone/chat screen
- [ ] Historical map borders (pre-1990) where episodes need them
