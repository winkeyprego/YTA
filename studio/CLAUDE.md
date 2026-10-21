# CLAUDE.md: studio

You are continuing an animation pipeline that produces faceless YouTube explainers about money,
companies, scams and crashes, drawn in the style of the "Two Sides of War" and "War Unspun"
channels. The owner is not a developer: explain in plain words, show results as images/video,
and keep the pipeline runnable with one command.

## Read before changing anything
1. `STYLE-GUIDE.md`: what things look like. Stay on-model.
2. `MOTION.md`: how things move and how long they stay.
3. `docs/REFERENCE-ANALYSIS.md`: measured numbers from the reference videos. Prefer these numbers over guesses.
4. `episodes/sample-2008-cold-open/episode.js`: the working example of every library piece.

## Rules
- **Colours only from `lib/palette.js`.** Need a new one? Add it there with a comment.
- **Fonts:** `display` = Lilita One (titles, big numbers), `hand` = Patrick Hand (date tags, bubbles,
  stickers, name plates, map labels), `type` = Special Elite (documents), `serif` = Cormorant SC
  (chapter cards). Nothing else.
- **Characters come from `character(spec, state)`.** Never draw a person freehand in a shot.
  New recurring person, such as a real CEO: add a `CAST` entry with ONE or TWO signature features
  (hair shape, glasses, hat, moustache, outfit colour). Keep the round head and dot eyes.
- **Entrances come from `lib/ui.js`.** A shot decides WHEN (`at` times), the lib decides HOW.
  To change how stickers pop everywhere, change it once in the lib.
- **Every render function is pure in `t`.** No `Math.random()`. Use `rng(seed)` from `lib/motion.js`.
- **The world layer goes inside `camera()`. Overlays go outside**: date tag, name plate, tally, source line.
- **Every new place or time gets a date tag** (place · date). Camera: mostly locked-off, linear moves, no shake.
- **Pacing:** shots of about 3.5s, an event every 1–1.5s, nothing still for more than 4s (see MOTION.md).
- **Facts:** every number on screen needs a source in the episode's SCRIPT.md. Mark unverified items.
- **No copyrighted material:** never put frames, logos or footage from other channels into the repo.
- **Real people:** caricature allowed only through the cast system (signature features, no photo
  likeness). Keep depictions factual and fair; no invented quotes presented as real. Quotes in
  bubbles must be real and sourced, or clearly framed as a paraphrase in SCRIPT.md.

## Checking your work
- `node render.js episodes/<ep> --sheet 1 --scale 1` gives a contact sheet; look at it (Read the jpg).
- `node render.js episodes/<ep> --still <sec> --scale 1` renders a single frame for close checks.
- Look for: text overflowing its label, bubbles covering faces, stickers colliding with lines,
  characters standing on furniture, empty frames held over 6s, and anything off-palette.

## Where things are going
See the README roadmap. Next up: render speed, VO-driven timing, map kit, sound kit, JSON shot lists.
