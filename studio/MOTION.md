# Motion guide: how things move, and for how long

All numbers were measured from the reference videos (see `docs/REFERENCE-ANALYSIS.md`) and are already
the defaults in `lib/motion.js` and `lib/ui.js`.

## Pacing
- **Shot length:** median **3.5s**, typically 2–6s. Allow 8–13s only for built-up device or map shots,
  where a new element must land about every second.
- **Cold open (first 60s): about 2× faster**, 20–35 visual changes per minute. Body: 11–17 per minute. Ease off slightly in the last third.
- **A visual event every 1–1.5s:** a sticker, caption, arrow, card, or cut.
- **Nothing sits fully still for more than 4s.**
- About **8–11 narration words per shot** (at 165 wpm, that's about 3–4s).
- Cut wide → close on the same set to keep the pace up without new art (see `office-wide` / `office-close` in the sample).

## Camera (`camera()` + `motion.creep / punch / steps`)
- **Default: locked-off** for 60–70% of shots.
- **Creep:** `zoom: M.creep(t)` gives a linear push of ~1.1%/s from the first frame (1.00 → ~1.07). Never eased.
- **Punch-in:** `zoom: M.punch(t, at)` holds, then pushes linearly at ~4.5%/s for 2s to land on the key phrase (→ ~1.09).
- **Map / chart / device shots:** build the graphic first, then a late push to about 1.2×:
  `M.punch(t, at, { rate: 0.08, dur: 2.5 })`.
- **Pans:** 20–50 px/s at 1280 width, usually with a slight zoom.
- **No camera shake.** `M.shake` exists only for rare in-world impacts; the references never use it.
- **War Unspun mode (optional):** `M.steps(t)` gives stepped ease-out pushes (+9% over 1s, then a hold, repeating).
- Keep overlays (date tag, name plate, tally, source line) **outside** `camera()` so they stay put.

## Entrances
| Element | Motion | Timing |
|---|---|---|
| Sticker | pop from 50% scale, overshoot, settle | 0.18s; stagger several by 0.7–1s |
| Date tag | slide in, then type | 0.08s slide, 30 cps |
| Name plate | slide from the left | 0.35s, ease-out |
| Speech bubble | pop from the tail, then type | 0.18s pop, 16–20 cps (18 default), synced to the VO line, stays until the cut |
| Arrow | grows from tail to head | 0.6–1s; stagger ~0.8s |
| Index card | pop | 0.18s, as the fuse spark arrives |
| Stamp | slam from 1.8× | 0.18s |
| Chart line | draws by year | rise in ~2s, hold 0.5s at the turning point, fall in ~1s |

## Transitions
- **Hard cuts everywhere.**
- Fades only into or out of chapter cards: `ui.chapterCard` fades in over 0.4s, holds 2.0s total, then a hard cut.
- Chapter cards land on the YouTube chapter marks.

## Character acting (`character(spec, state)`)
- **Mouth:** while a bubble types (or the character is voiced), cycle 2–3 shapes 4–8×/s:
  `mouth: M.mouthCycle(t, from, to) || 'smirk'`.
- **Gesture:** one arm gesture per line (about every 1.5–2s). Tween arm poses with `M.keys`.
- **No regular blinking** (not in the references). Use `blink` only as a deliberate beat.
- **Bodies are rigid.** At most a slight `tilt` of the head on a punchline, and `breathe` (0.7%) for idle life.
- **Expressions** change on story beats, e.g. `dot` → `smug` when a bad idea is stated.
- **Walking:** `walk: t * 9` (phase), with a small bob; used for entrances and exits.

## Sound (for the VO pass)
- Narration at about **165 wpm**, mastered to **−14 LUFS**, LRA 4–5 LU.
- A continuous low music or ambience bed **~17 dB under the voice**.
- **Sparse SFX:** a soft pop or whoosh on a minority of pops and cuts, never on every one.

## Checklist before rendering
- [ ] Every shot ≤ 6s unless it's a built-up device or map shot
- [ ] An event every 1–1.5s; no still stretch over 4s
- [ ] A date tag on every new place or time
- [ ] Camera: mostly locked-off; moves linear; no shake
- [ ] Bubbles type in sync with the VO; mouths flap only while talking
- [ ] Stickers don't cover faces or data lines; text fits inside its label
