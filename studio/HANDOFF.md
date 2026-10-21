# HANDOFF: start here

This file is the memory of the project. Any Claude session (cloud or desktop, any account) continuing
this work should read it first, then `CLAUDE.md`, then do the "Next steps" in order.
**Update this file at the end of every working session.**

_Last updated: 2026-10-21 (cloud session, after sample clip v2)._

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

## Status
| Piece | State |
|---|---|
| Style library (characters, props, UI, fuse, camera presets) | done, v1 |
| Renderer (MP4 / still / contact sheet, parallel workers) | done, ~2s render per 1s of video on 4 CPUs |
| Reference measurements | done (`docs/`) |
| Sample clip: 2008 cold open, 8 shots, 37s, no audio | done, v2 (`episodes/sample-2008-cold-open`) |
| Speech-to-text with word timestamps | **next**, blocked in the cloud on network access (see below) |
| Shot templates + plain-data shot list | **next** |
| VO-timed video | **next** |
| Map kit, sound kit (music bed, sparse SFX) | later |

## Next steps (in order)
1. **Word-timed transcription.** Install `faster-whisper` (`pip install faster-whisper`), transcribe the VO with
   `word_timestamps=True`, and save `episodes/<ep>/words.json` ([{word, start, end}]). Add this as `tools/transcribe.py`.
2. **Shot templates.** Turn the sample's shot types into reusable templates in `lib/templates.js`:
   `talk` (character in a set says a line), `document` (paper + highlight + stamp), `chart` (rise/fall),
   `bigStat`, `fuse`, `title`, `chapter`, `streetNight`/`exterior`. Each template takes plain data plus the shot time.
3. **Shot list format.** `episodes/<ep>/shots.json`: one entry per beat:
   `{ template, words: [startWord, endWord] or text, cast, set, stickers: [{text, onWord}], ... }`.
   The renderer computes each shot's duration from the word timings, and each sticker pops on its word.
4. **Script → shot list.** Claude reads the script and timings, splits it into beats of ~3.5s (8–11 words),
   picks a template per beat, and writes `shots.json`. Follow `MOTION.md` pacing rules.
5. **Test:** first 1–2 minutes of the Ozempic test VO (private test only), rendered and shown to the owner.
6. **Real voice:** the owner still has to choose: ElevenLabs (paid, needs an API key), their own recording,
   or a free local TTS.

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
- **2026-10-20/21 (cloud):** researched the three channels; measured the style (pacing, camera, type, colour,
  sound); built the studio library and renderer; made sample clip v1, then v2 tuned to the measurements; wrote the
  style and motion guides. The owner pointed out the real need: **any script → video**. Next is the VO-timed,
  template-driven pipeline above. The owner uploaded an Ozempic MP3 (test only).
