---
name: make-video
description: Turn a topic, script or voiceover into a finished animated YouTube documentary with the studio toolkit (studio/). Use whenever the owner asks to make, draft, preview, re-time or render an episode (money or history topics; one shared style).
---

# Make a video

The studio is a finished toolkit. **Do not write rendering code for a normal episode.** An episode is data, assembled
from existing recipes. Only touch `studio/lib/` when a beat truly needs something that doesn't exist (use `add-to-library`).

## Read first (every time)
1. `studio/HANDOFF.md`: current status and the owner's decisions.
2. `studio/RECIPES.md`: which visual for which kind of sentence. This is your menu.
3. `studio/STORYBOARD.md`: the compact format you'll write.
4. `studio/SHOTS.md`: the full field reference, when a recipe needs a field.

## Steps (full-length episode)
1. **Folder:** `studio/episodes/<short-name>/` with `vo.mp3` (and `SCRIPT.md` if the owner gave a script).
   Pick a preset: `"finance"` for money topics, `"war"` for history. It only sets defaults; any recipe works in any video.
2. **Words:** `python3 studio/tools/transcribe.py studio/episodes/<ep>/vo.mp3`, which makes `words.json`.
3. **Beats:** `node studio/tools/beats.js studio/episodes/<ep>`, which makes `beats.txt` (numbered beats, ~3s each).
4. **Director pass (the most important step; do it before any storyboard line):** read ALL of beats.txt once, then write
   `PLAN.md` with these sections:
   - **The story's device:** one visual metaphor that belongs to THIS story and returns 3-5 times as a callback, building
     each time (the fuse for an avoidable disaster; two pipes feeding one front for a supply war; a ruler extending a trend
     line for a man who bets on extrapolation). Not a generic chart. It usually needs building in step 5.
   - **People:** every recurring person in the header `cast`. **Likeness:** for real people, look at a reference photo if
     one is available and pick 2-3 signature features (hair shape and colour, glasses, beard/moustache, face shape, brows,
     skin tone, typical clothing). One-off people get a name plate, initials or a silhouette, not a face.
   - **Places:** the specific places of this story (Red Square in snow, a resort in Nassau, Columbia's commencement stage),
     not generic offices. Each chapter debuts at least one new place.
   - **Scene plan table:** one row per beat (or tight beat range): `beat | what happens | who does what to whom | where |
     shot type`. Write the moment first ("he walks out carrying a box", "the aide hands Stalin the report, seen over
     Stalin's shoulder"), then the shot. About 1 beat in 4 is a scene invented for that sentence; kit graphics only for real
     numbers, documents and screens. No placeholder data ("FUND B"): use the script's numbers or a different picture.
   - **Clips and quotes from someone else** (a trader, a TV clip, an interview): the news look (`screen:newsLive`) or an
     interview set with a name plate. Not a staged scene.
   - **Fresh visuals budget:** which sets, props, devices and graphics DEBUT in each ~3 minutes (`--plan` checks for ~6+
     looks never shown before per 3 minutes); keep some of the library for late chapters.
   - **Text:** at most one sticker or label per shot, big and in a clean area; stickers on under ~35% of shots.
   List what the library is missing (story places, objects, costumes, the device) in `NEEDS.md`.
5. **Library pass:** build the NEEDS items (use the `add-to-library` skill), the device and the most-used places first,
   spread so every chapter debuts something. They stay in the library, so later videos get cheaper. One builder agent with a
   precise spec (field names, look, a test contact sheet it must read) is enough; write the storyboard meanwhile against
   the spec'd names.
6. **Storyboard:** write `storyboard.txt`, one line per beat or small beat range, by type:
   - **Stage the moment first** (RECIPES "Staging"): who is doing what, to whom, where? People sit, turn to each other,
     hand things over, take calls; use over-the-shoulder and three-quarter close-ups. About 1 beat in 4 is a scene designed
     for that sentence. Kit graphics are for numbers and documents, not a default.
   - Pick a recipe for each beat's type (RECIPES A–P). Rotate them: never the same recipe three times running.
   - Give every shot a cue on one of its own words.
   - Use the host only occasionally. Use a black card about every 10–12 shots (finance) and a metaphor every 1–2 minutes.
   - **Rhythm:** alternate busy scenes with simple ones (RECIPES "Rhythm"). Key numbers and phrases get a simple shot so they
     land. Aim for ~25–35% simple shots; never 5+ busy or 4+ simple in a row.
   - Long episodes: write chapters in parallel part files (`storyboard.01.txt`, `storyboard.02.txt`, ...).
   - Write it in chunks of about 40 beats. After each chunk, run `--plan` and fix what it reports.
7. **Check:** `cd studio && node render.js episodes/<ep> --plan`, then fix everything until it says `checks: OK`
   (errors name the storyboard line). Then `node render.js episodes/<ep> --qa` and fix every layout issue
   (`--still <t> --scale 1` shows the frame).
8. **Look (taste review):** `node render.js episodes/<ep> --sheet 4 --scale 0.4`, then Read the jpg and go through:
   - Would a viewer know what is happening in each frame without the narration? Is the right person doing it?
   - Any two frames that look alike? Any person standing front-on doing nothing? Any frame mostly empty wall or paper?
   - Is every word on screen big, clear, on a clean area, and pointing at the right person (name arrows)?
   - People small at the bottom of a wide set? (frame them: `"f":"w"` medium shot is the default; `"F"` only for places)
   - Does the device appear and build? Do the chapters each show a new place?
   Fix, re-check, look again. Then render a 20-30s stretch first (`--from/--to`) before the whole video.
9. **Render:** `node render.js episodes/<ep>` gives `studio/renders/<ep>.mp4` (1080p, with the voice).
10. **Report** in plain words, list unverified facts, update `studio/HANDOFF.md`, then commit and push.

## Never
- Copy other channels' frames, art, audio, scripts or logos.
- Draw a person freehand. Use the cast, and add named people to the header `cast`.
- Render with `--plan` errors or `--qa` issues outstanding.
- Retype narration in the storyboard. Reference beats with `"b"`.
