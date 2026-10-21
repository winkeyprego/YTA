# HANDOFF: start here

This file is the memory of the project. Any Claude session (cloud or desktop, any account) continuing
this work should read it first, then `CLAUDE.md`, then do the "Next steps" in order.
**Update this file at the end of every working session.**

_Last updated: 2026-10-21 (cloud session): one interchangeable style with two presets; recipes, validator and skills are ready._

## The goal (in the owner's words, summarised)
Build a faceless YouTube channel about **money, companies, scams and crashes** (the topics of
[@Crayon_Capital](https://www.youtube.com/@Crayon_Capital)), animated in the **style** of
[@TwoSidesOfWar](https://www.youtube.com/@TwoSidesOfWar) and [@WarUnspun](https://www.youtube.com/@WarUnspun),
and **automate as much as possible with Claude**: script in → finished video out.
We copy the *style rules*, never their videos, art, audio or scripts.

The owner is not a developer. Explain things step by step in plain words, and show results as images or video.

## Decisions made so far
- **Format:** their "myth vs the documents" format on money topics. Titles like
  "Why ___ Was COMPLETELY Avoidable", "Did ___ REALLY…?".
- **House device:** THE FUSE: a lit fuse burning along a timeline, with each stop a moment someone could have cut it (`lib/devices.js`).
- **Everything is drawn in code** (SVG → Chromium → ffmpeg). No image generator, no hand animation.
- **Fonts:** Lilita One, Patrick Hand, Special Elite, Cormorant SC (open licences, in `fonts/`).
- **Style numbers were measured from the reference videos** and are the lib defaults
  (`docs/REFERENCE-ANALYSIS.md`, `STYLE-GUIDE.md`, `MOTION.md`).
- **Render output (`renders/`) is not committed.** Regenerate it with `node render.js …`.
- **ONE interchangeable style (owner's rule).** History and finance are not separate styles. Everything (characters, sets,
  templates, screens, data, diagrams, maps, the fuse) works in every video. `"style": "war" | "finance"` is only a preset of
  defaults (vignette, dialogue as bubble or handwritten line, tag look, chapter card look, camera, pacing numbers), and each shot
  can override any of them. The finance additions exist because some things (apps, markets, money, org charts) are better
  illustrated that way; use them wherever they fit, including in history videos.
- **Finance pack decisions** come from `docs/CRAYON-ANALYSIS.md` ("Rules for our FINANCE pack"). No real logos: lettered emblems instead.
- **The finance host** (`CAST.host`, `lib/host.js`, from the owner's illustration) is an occasional recurring character:
  she appears sometimes, as a shot or inside an explanation. She is NOT a presenter on every shot; most scenes use the
  regular cast, as in the history style. The owner chose the detailed "hero" head (`host`), lightly refined; a house-style
  twin, `hostHouse`, exists for crowd shots.
- **Validation:** `lib/validate.js` checks every shots.json before rendering (unknown names, typos with suggestions,
  cue words missing from the narration, long labels, repetition).
- **Copyright:** never commit reference frames or footage, or other channels' audio. The Ozempic MP3 the owner
  uploaded appears to be Crayon Capital's own narration (same title, same 12:41 length). It may be used **only as
  private test material** for VO timing, never in a published video, and it is not in the repo.

## Status: ready to make videos in two styles
| Piece | State |
|---|---|
| **Presets** `war` / `finance` (defaults only; everything interchangeable; per-shot overrides) | done (`lib/styles.js`) |
| Core templates: talk, versus, document, chart, stat, fuse, map, money, title, chapter, card | done |
| Finance kits: screens (7), data (7), diagrams (8) | done (`lib/screens.js`, `lib/datakit.js`, `lib/diagrams.js`) |
| Finance dialogue: floating lines, conversations cutting to the speaker, spotlight, name + arrow, black cards | done |
| **Visual vocabulary:** beat type → recipes (`RECIPES.md`) | done |
| Finance host (`CAST.host`, from the owner's illustration) | done; occasional cast member |
| Library: ~27 cast, 11 sets, money graphics, real maps | done |
| Validator (typos, unknown names, cue words, labels, repetition) + pacing checker | done; `--plan` |
| Voiceover → word timings → shot timing | done (`tools/transcribe.py`) |
| **Skills:** `make-video`, `add-to-library` (`.claude/skills/` at the repo root) | done |
| Starters: `finance-starter` (GameStop), `template-starter` (2008, war look) | done |
| Sound kit (music bed, sparse SFX, loudness) | **not yet**: add in an editor for now |

## How to make a video now
Use the **make-video** skill. In short: style → script → (voice → `words.json`) → `shots.json` from `RECIPES.md`
→ `node render.js episodes/<ep> --plan` (fix everything) → `--sheet 1 --scale 1` (look) → `node render.js episodes/<ep>`.

## Next steps (improvements, not blockers)
1. **Sound kit:** a music bed ~17 dB under the voice (war) and a light bed (finance), sparse pops/whooshes, a −14 LUFS master.
2. **A first real episode** with the owner's voice, then tune anything that looks off at full length.
3. **More metaphor props** (RECIPES O) as scripts need them: house of cards, rocket, gold-rush tools, sinking ship.
4. **More sets:** a lab or hospital, casino, government building exterior, port.
5. Move derived colours (`T` in sets.js, `C` in maps.js and diagrams.js, `SCREEN_COLORS`, `DATAKIT_COLORS`) into palette.js.

## Open questions for the owner
- Which voice for real episodes? (see step 6)
- First real episode topic and script? (Claude offered to write "Why the 2008 Crash Was COMPLETELY Avoidable".)

## How to resume

### On your own computer (Claude Desktop app → Code)
1. Get the project. Either:
   - download the zip Claude sent you and unzip it, **or**
   - on GitHub: repo `winkeyprego/yta`, branch `claude/awesome-rubin-m5w8ya` → **Code** → **Download ZIP**.
2. Install the tools once:
   - **Mac:** install [Homebrew](https://brew.sh), then run `brew install node ffmpeg python`.
   - **Windows:** install Node.js LTS from nodejs.org, Python from python.org, and ffmpeg (`winget install ffmpeg`).
3. Open the Claude Desktop app → **Code** → choose the unzipped folder.
4. Paste this as your first message:
   > Read `studio/HANDOFF.md` and `studio/CLAUDE.md`, set up the project (npm install in studio/,
   > npx playwright install chromium, pip install faster-whisper), render the sample to check it works,
   > then continue with the next steps in HANDOFF.md.

### In a Claude cloud session
The environment's **Network access → Allowed domains** needs:
`youtube.com`, `www.youtube.com`, `youtubei.googleapis.com`, `i.ytimg.com`, `*.googlevideo.com` (reference research),
`drive.google.com`, `drive.usercontent.google.com`, `*.googleusercontent.com` (owner uploads via Drive links),
`huggingface.co`, `*.huggingface.co`, `*.hf.co` (Whisper speech-to-text models), and
`api.elevenlabs.io` (only if the owner picks ElevenLabs).
Package managers (npm, PyPI) are allowed by default.

## Reference material (not in the repo; re-download if needed)
- Two Sides of War: "Why Operation Barbarossa Was COMPLETELY Avoidable" (QoQWBiujfkA),
  "What Was The REAL Turning Point of WW2?" (UOp68huRY_I)
- War Unspun: "What If America Had Nuked Germany Instead of Japan?" (L0P40aJ9lHM)
- Crayon Capital: topic and direction reference (top videos: Wolf of Wall Street, Great Depression, 2008 crisis).

## Session log
- **2026-10-21 (cloud), final:** the owner confirmed the hero host (refined: hair shine, curled ends, lashes, lips, collar)
  and that history and finance must be ONE interchangeable style. The presets were reworked to be defaults only, with per-shot
  overrides; `episodes/test-mixed*` prove the mixing.
- **2026-10-21 (cloud), latest:** the owner wants a finance style next to the war style, their host character, more variety for
  any kind of script, and no rebuilding on the main account. Measured two Crayon Capital videos (`docs/CRAYON-ANALYSIS.md`).
  Built: style packs, finance dialogue and cards, the host, screens, data and diagram kits, RECIPES.md (beat → visual),
  the validator, the make-video and add-to-library skills, and finance-starter.
- **2026-10-21 (cloud), later:** the owner clarified that the deliverable is the TOOLKIT, so any script can become a video
  on their main account. Built: the shot templates, shots.json, voice timing (faster-whisper), the pacing checker, 11 sets,
  ~25 cast, money graphics, a real-map kit, SHOTS.md and PLAYBOOK.md, and a starter episode. Tested end-to-end on 90s of the
  private Ozempic test audio (kept out of the repo).
- **2026-10-20/21 (cloud):** researched the three channels; measured the style (pacing, camera, type, colour,
  sound); built the studio library and renderer; made sample clip v1, then v2 tuned to the measurements; wrote the
  style and motion guides. The owner pointed out the real need: **any script → video**. Next is the VO-timed,
  template-driven pipeline above. The owner uploaded an Ozempic MP3 (test only).
