# Playbook: script → finished video

> A Claude session should use the **make-video** skill (`.claude/skills/make-video/SKILL.md`), which follows this playbook.

This is the routine for making an episode. A Claude session runs these steps; the owner supplies the topic
or script, picks the voice, and approves the result.

## 0. One-time setup (on a new computer)
```bash
cd studio
npm install
npx playwright install chromium
pip install faster-whisper numpy
```
You also need ffmpeg (`brew install ffmpeg` on Mac, `winget install ffmpeg` on Windows).

## 1. Style
- `"style": "finance"` (money, companies, scams, tech; Crayon-informed look) or `"style": "war"` (history and war; Two Sides look).
- Copy the starter for that style: `episodes/finance-starter` or `episodes/template-starter`.

## 2. Script
- Write or receive the script in `episodes/<ep>/SCRIPT.md`.
- Format: "Why ___ Was COMPLETELY Avoidable" / "Did ___ REALLY…?". Open cold on one exact moment
  (a date, a time, a place), state the popular myth, then test it against the documents.
- About **165 words per minute**, so 10 minutes is about 1,650 words.
- List every number, date and quote shown on screen in a sources table. Mark anything unverified.

## 3. Voice
- Record or generate `episodes/<ep>/vo.mp3`. It must be the owner's own voice, an AI voice reading our script,
  or another voice we have the rights to. Never another channel's audio.
- Run `python3 tools/transcribe.py episodes/<ep>/vo.mp3` to make `words.json`.
- No voice yet? Skip this step. Timing is estimated, and the voice can be added later without changing the shot list.

## 4. Shot list
- Create `episodes/<ep>/shots.json` (see `SHOTS.md`, and copy `episodes/template-starter/shots.json`).
- Split the narration into beats of 8–11 words. **Label each beat with its type and pick a recipe from `RECIPES.md`.**
  The templates, briefly:
  - **talk:** someone does or says something
  - **document:** a filing, letter or memo
  - **chart:** a number moving over time
  - **stat:** one striking number
  - **map:** a place or a spread
  - **fuse:** the chain of missed chances (the spine of an "Avoidable" episode)
  - **versus:** two sides
  - **money:** a sum of money
  - **title** / **chapter:** cards
  - **card:** a black narration card for pivot sentences (finance)
  - **screen:** a social post, phone alert, article, app page, live news, terminal or chat (finance)
  - **data:** a stock chart with tabs, ranking board, winners vs losers, calendar flip, cheque or count-up (finance)
  - **diagram:** an equation, loop, funnel, org tree, portraits, steps, split screen or montage (finance)
- Give every beat at least one cue on a spoken word: a sticker, pose, expression or stat.
- Use a date tag on every new place or time, and a name plate the first time a person appears.

## 5. Check
```bash
node render.js episodes/<ep> --plan                 # timings + pacing warnings: fix them all
node render.js episodes/<ep> --sheet 1 --scale 1    # contact sheet: look at it
node render.js episodes/<ep> --still 42 --scale 1   # zoom in on anything odd
```
On the contact sheet, look for: text spilling out of its label, bubbles or stickers covering faces or headlines,
empty-looking frames, the same set used for too many shots in a row, and anything off-palette.

## 6. Render
```bash
node render.js episodes/<ep>              # renders/<ep>.mp4, 1920x1080, with the narration
node render.js episodes/<ep> --from 60 --to 120   # re-render just one part
```
About 2s of render per 1s of video on a 4-core machine.

## 7. Before publishing
- Facts table in SCRIPT.md is complete and checked.
- No real person is shown saying a quote they didn't say.
- Audio is ours. (A music bed and sound effects are on the roadmap; until then, add them in an editor.)
- Watch the whole thing once at normal speed.

## When something is missing
- **A new set, prop or person:** add it to the lib (`lib/sets.js`, `lib/props.js`, the `CAST` in `lib/characters.js`),
  following `STYLE-GUIDE.md`. Then it's available to every future episode.
- **A new kind of shot:** add a template to `lib/templates.js` and document it in `SHOTS.md`.
- **Update `HANDOFF.md`** at the end of the session with what changed.
