---
name: add-to-library
description: Add a missing reusable piece to the studio library (a new set, prop, character type, real person, money graphic, screen, data graphic, diagram or template) so every future episode can use it. Use when a script needs a visual that RECIPES.md and the lib don't cover.
---

# Add to the library

First check that it's really missing: RECIPES.md, SHOTS.md, the `CAST` in `studio/lib/characters.js`, `SETS` in `studio/lib/sets.js`,
and the headers of `lib/screens.js`, `lib/datakit.js` and `lib/diagrams.js`. Often a recipe plus stickers is enough.

## Rules (from studio/STYLE-GUIDE.md and MOTION.md)
- Colours only from `studio/lib/palette.js`. Fonts: `hand`, `display`, `type`, `serif`, `script`.
- Ink outlines 4–5 px on characters and big shapes, 2–3 px on props. Flat, muted fills. Red, green and gold only for meaning.
- Pure functions of time `t`: no `Math.random()` (use `rng(seed)`), and never keep state between frames.
- Timing fields are `at` in seconds. Templates convert `"on": "word"` cues before calling the lib.
- No real logos or trademarks: companies are lettered emblems plus names.

## Where things go
| Need | Where | Then |
|---|---|---|
| Person type or real person | `CAST` in `lib/characters.js`: base outfit + 1–2 signature features | list it in SHOTS.md "Cast" |
| Set | `SETS` in `lib/sets.js`: `draw`, `front`, `spots`, `close`, `mood` | list it in SHOTS.md `talk` |
| Prop | `lib/props.js` | use it from a set or template |
| Screen, data graphic or diagram | the matching kit file, exporting `(spec, t) => svg` | add the name to `KIT_KINDS` in `lib/templates.js`, then document it in the kit header and RECIPES.md |
| New template | `lib/templates.js` + `FIELDS`/`REQUIRED` in `lib/validate.js` | document it in SHOTS.md and RECIPES.md |

## Test
Make a small test episode (`studio/episodes/test-<thing>/`), render a contact sheet with
`node render.js episodes/test-<thing> --sheet 0.75 --scale 1`, and Read it. Iterate until it's clean.
Then run `--plan` on both starters, to be sure nothing else broke. Update HANDOFF.md, commit and push.
