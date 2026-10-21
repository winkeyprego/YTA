# HANDOFF: start here

This file is the memory of the project. Any Claude session (cloud or desktop, any account) continuing
this work should read it first, then `CLAUDE.md`, then do the "Next steps" in order.
**Update this file at the end of every working session.**

_Last updated: 2026-10-21 (cloud session): the script-to-video toolkit is ready to use._

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
- **Copyright:** never commit reference frames or footage, or other channels' audio. The Ozempic MP3 the owner
  uploaded appears to be Crayon Capital's own narration (same title, same 12:41 length). It may be used **only as
  private test material** for VO timing, never in a published video, and it is not in the repo.

## Status: ready to make videos
| Piece | State |
|---|---|
| Style library: characters (~25 archetypes), 11 sets, props, UI, money graphics, maps, fuse device | done |
| Shot templates: talk, versus, document, chart, stat, fuse, map, money, title, chapter | done (`lib/templates.js`, `SHOTS.md`) |
| `shots.json` episodes + pacing checker (`--plan`) | done |
| Voiceover → word timings (`tools/transcribe.py`, faster-whisper) | done; tested on 90s of audio, about 16s to process |
| Shots and cues timed to spoken words; silence inserted for cards | done |
| Renderer (MP4 / still / contact sheet, parallel) | done, ~2s render per 1s of video on 4 CPUs (maps ~3×) |
| Reference measurements + style and motion guides | done |
| Starter episode (`episodes/template-starter`, the 2008 cold open, all templates) | done |
| Sound kit (music bed, sparse SFX, loudness) | **not yet**: add in an editor for now |

## How to make a video now
Follow `PLAYBOOK.md`. In short: script → `vo.mp3` → `python3 tools/transcribe.py episodes/<ep>/vo.mp3`
→ write `episodes/<ep>/shots.json` (copy `template-starter`) → `node render.js episodes/<ep> --plan` (fix warnings)
→ `--sheet 1 --scale 1` (look) → `node render.js episodes/<ep>`.

## Next steps (improvements, not blockers)
1. **Sound kit:** a music bed about 17 dB under the voice, sparse pop/whoosh SFX, a −14 LUFS master (in render.js).
2. **More templates:** calendar flip, timeline, balance scale, ledger, newspaper headline, phone/chat screen.
3. **More sets** as episodes need them: lab or hospital, casino, White House or parliament exterior, ship or port.
4. **Historical map borders** (pre-1990) if an episode needs them.
5. **Move derived colours** from `lib/sets.js` (const `T`) and `lib/maps.js` (const `C`) into `palette.js`.

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
- **2026-10-21 (cloud), later:** the owner clarified that the deliverable is the TOOLKIT, so any script can become a video
  on their main account. Built: the shot templates, shots.json, voice timing (faster-whisper), the pacing checker, 11 sets,
  ~25 cast, money graphics, a real-map kit, SHOTS.md and PLAYBOOK.md, and a starter episode. Tested end-to-end on 90s of the
  private Ozempic test audio (kept out of the repo).
- **2026-10-20/21 (cloud):** researched the three channels; measured the style (pacing, camera, type, colour,
  sound); built the studio library and renderer; made sample clip v1, then v2 tuned to the measurements; wrote the
  style and motion guides. The owner pointed out the real need: **any script → video**. Next is the VO-timed,
  template-driven pipeline above. The owner uploaded an Ozempic MP3 (test only).
