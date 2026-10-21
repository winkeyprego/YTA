# Studio: animated explainer pipeline

Code-drawn 2D animation in the style of the "Two Sides of War" / "War Unspun" channels
(round-headed cartoon people, muted paper palette, taped date tags, maps, documents, stickers),
pointed at money and business history topics.

Everything is drawn with code (SVG), animated with pure time functions, and rendered to MP4
by headless Chromium + ffmpeg. No hand animation and no image generator are needed, and any frame can
be re-rendered on its own.

## Quick start

Needs Node 18+, ffmpeg, and Playwright's Chromium.

```bash
cd studio
npm install                     # installs playwright
npx playwright install chromium # skip if Chromium is already available
node render.js episodes/sample-2008-cold-open --sheet 1.5 --scale 1   # contact sheet (fast check)
node render.js episodes/sample-2008-cold-open --still 15              # one frame as PNG
node render.js episodes/sample-2008-cold-open                         # full MP4, 1920x1080
node render.js episodes/sample-2008-cold-open --fps 12 --scale 1      # quick low-res preview
```

Output goes to `renders/`.

## Layout

```
studio/
  CLAUDE.md            rules for any Claude session continuing this work: read first
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
    stage.html         the page Chromium renders into (loads fonts)
  fonts/               Lilita One, Patrick Hand, Special Elite (open licences included)
  episodes/
    sample-2008-cold-open/
      episode.js       six shots, ~37s
      SCRIPT.md        narration + shot list + facts to verify
  renders/             output (git-ignored; regenerate with render.js)
```

## How an episode works

`episodes/<name>/episode.js` exports:

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
Shots play back to back with hard cuts, as in the references.

## Workflow for a new episode

1. Script: write narration in `SCRIPT.md`, split into beats of about 3 to 6 seconds (see MOTION.md, "Pacing").
2. Voiceover: record or generate it, then get word timings (step 3 of the roadmap).
3. Shot list: one shot per beat, with set, cast, graphics and entrances, timed to the VO.
4. Build: each shot is one object in `episode.js`, reusing the lib. New reusable pieces go into the lib.
5. Check: `--sheet 1` contact sheet, then `--still` on anything suspicious, then the full render.

## Roadmap

- [x] Style library v1 (characters, props, UI, fuse device), renderer, 37s sample
- [ ] Faster render path (grain/vignette in ffmpeg, JPEG frames)
- [ ] VO pass: narration audio, word timestamps, and shots timed to the words
- [ ] Map kit (countries/regions as flat shapes, arrows, legend, fronts)
- [ ] Sound kit (pops, typewriter ticks, paper, whoosh, low music bed)
- [ ] Shot templates driven from a JSON shot list, so Claude writes data, not code
