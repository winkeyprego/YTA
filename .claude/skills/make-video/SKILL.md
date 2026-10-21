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
4. **Plan the cast and sets once:** list the recurring people (header `cast`, 1–2 signature features each), places and
   devices. Put a `# chapter` comment roughly every 4–5 minutes.
5. **Storyboard:** write `storyboard.txt`, one line per beat or small beat range, by type:
   - Pick a recipe for each beat's type (RECIPES A–P). Rotate them: never the same recipe three times running.
   - Give every shot a cue on one of its own words.
   - Use the host only occasionally. Use a black card about every 10–12 shots (finance) and a metaphor every 1–2 minutes.
   - Write it in chunks of about 40 beats. After each chunk, run `--plan` and fix what it reports.
6. **Check:** `cd studio && node render.js episodes/<ep> --plan`, then fix everything until it says `checks: OK`
   (errors name the storyboard line). Then `node render.js episodes/<ep> --qa` and fix every layout issue
   (`--still <t> --scale 1` shows the frame).
7. **Look:** `node render.js episodes/<ep> --sheet 3 --scale 1`, then Read the jpg. Look for sameness, empty frames, and
   anything ugly the checks can't know about.
8. **Render:** `node render.js episodes/<ep>` gives `studio/renders/<ep>.mp4` (1080p, with the voice).
9. **Report** in plain words, list unverified facts, update `studio/HANDOFF.md`, then commit and push.

## Never
- Copy other channels' frames, art, audio, scripts or logos.
- Draw a person freehand. Use the cast, and add named people to the header `cast`.
- Render with `--plan` errors or `--qa` issues outstanding.
- Retype narration in the storyboard. Reference beats with `"b"`.
