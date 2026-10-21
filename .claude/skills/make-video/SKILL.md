---
name: make-video
description: Turn a topic, script or voiceover into a finished animated YouTube video with the studio toolkit (studio/). Use whenever the owner asks to make, draft, preview, re-time or render an episode, in either the finance or the war/history style.
---

# Make a video

The studio is a finished toolkit. **Do not build new rendering code for a normal episode.** An episode is plain data
(`studio/episodes/<ep>/shots.json`) assembled from existing templates and recipes. Only touch `studio/lib/` when a beat
truly needs something that doesn't exist; in that case use the `add-to-library` skill.

## Read first (every time)
1. `studio/HANDOFF.md`: current status and the owner's decisions.
2. `studio/RECIPES.md`: which visual to use for which kind of sentence. This is your menu.
3. `studio/SHOTS.md`: the exact fields for every template.
4. The starter for the style you're making: `studio/episodes/finance-starter/shots.json` (finance) or
   `studio/episodes/template-starter/shots.json` (war/history). Copy its patterns.

## Steps
1. **Folder:** `studio/episodes/<short-name>/`. Decide the style (`"finance"` or `"war"`) with the owner if it isn't obvious.
2. **Script:** in `SCRIPT.md`, at ~165 words per minute. Add a sources table for every number, date and quote on screen,
   and mark anything unverified. Never invent quotes for real people.
3. **Voice (optional now):** if `vo.mp3` exists, run `python3 studio/tools/transcribe.py studio/episodes/<ep>/vo.mp3` to make `words.json`.
   Without it, timing is estimated, and you can add the voice later without changing the shot list.
4. **Shot list:** split the script into 8–11-word beats. For each beat: name its type from RECIPES.md (A–P), copy a recipe,
   set `"vo"` to the beat's exact words, and add at least one `"on"` cue on a word that is **in that beat's vo**.
   Rotate recipes. Use the host only occasionally. Start with a cold open (RECIPES P).
5. **Check:** run `cd studio && node render.js episodes/<ep> --plan`. **Fix every error and warning**, then run it again until it says `checks: OK`.
6. **Look:** run `node render.js episodes/<ep> --sheet 1 --scale 1`, then Read the jpg in `studio/renders/`.
   Fix any overlaps, empty-looking frames, labels covering faces, text spilling out of boxes, or the same set too many times.
   Use `--still <sec> --scale 1` to inspect a moment closely.
7. **Render:** run `node render.js episodes/<ep>`, which writes `studio/renders/<ep>.mp4` (1080p, with the voice if present).
   For a quick look at one section, use `--from 30 --to 60 --fps 12 --scale 1`.
8. **Report** to the owner in plain words, send the video or contact sheet, and list unverified facts.
9. **Update `studio/HANDOFF.md`** (session log, plus anything new in the library), then commit and push.

## Never
- Copy other channels' frames, art, audio, scripts or logos. Their audio can't be used even as a voice, except as private test material.
- Draw a person freehand in a shot. Use `who` from the cast; add new people via `"cast"` in shots.json.
- Skip `--plan`, or render with errors.
- Use a cue word that isn't in that shot's `vo` (the validator will stop you).
