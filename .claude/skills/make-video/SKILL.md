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
4. **Director pass:** read ALL of beats.txt once. Plan the recurring people (header `cast`, 1–2 signature features each),
   chapters (a card every 4–5 minutes), recurring sets and motifs, the biggest moments, and how each PAUSE beat is used.
   Write it to `PLAN.md`. List what the library is missing in `NEEDS.md`.
   **Fresh visuals budget:** the video must keep showing new pictures to the end (`--plan` checks every 3 minutes for ~6+
   looks never shown before). Plan, per chapter, which sets, props, scenes and graphics DEBUT there, and save some of the
   library for late chapters. Anything the story needs that the library lacks, especially story-specific places and
   objects, goes in NEEDS.md (a 30-40 min video typically needs 15-30 new episode-specific pieces).
5. **Library pass:** build the NEEDS items (use the `add-to-library` skill), most important first, spread so every chapter
   debuts something. They stay in the library, so later videos get cheaper. Only minor gaps use the closest existing visual.
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
8. **Look:** `node render.js episodes/<ep> --sheet 3 --scale 1`, then Read the jpg. Look for sameness, empty frames, and
   anything ugly the checks can't know about.
9. **Render:** `node render.js episodes/<ep>` gives `studio/renders/<ep>.mp4` (1080p, with the voice).
10. **Report** in plain words, list unverified facts, update `studio/HANDOFF.md`, then commit and push.

## Never
- Copy other channels' frames, art, audio, scripts or logos.
- Draw a person freehand. Use the cast, and add named people to the header `cast`.
- Render with `--plan` errors or `--qa` issues outstanding.
- Retype narration in the storyboard. Reference beats with `"b"`.
