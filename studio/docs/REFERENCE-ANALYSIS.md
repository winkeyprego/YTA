# Reference analysis

These measurements come from three reference videos the owner supplied. The goal is to copy their *craft*: pacing, camera, motion, colour, typography and graphics. Their content and artwork are not copied. No reference frames are stored in this repo.

| ID | Video | Length | Format |
|---|---|---|---|
| v1 | Two Sides of War: "Why Operation Barbarossa Was COMPLETELY Avoidable" | 26:47 | 1280×720, 24 fps, audio |
| v2 | War Unspun: "What If America Had Nuked Germany Instead of Japan?" | 32:54 | 1280×720, 30 fps, no audio in copy |
| v3 | Two Sides of War: "What Was The REAL Turning Point of WW2?" | 40:34 | 854×480, 24 fps, audio |

**Method.** ffmpeg scene detection (threshold 0.25) gave the cut points. Camera moves were measured by registering frames against each other (zoom search plus FFT phase correlation, 0.25 s steps, 30 shots per video). Typing and pop-in speeds were counted by hand from frames at 8–24 fps. Colours come from median-cut/k-means palettes over labelled frames. Audio was measured with EBU R128 loudness, 100 ms RMS windows and high-frequency onset tests. All numbers are also in `reference-metrics.json`.

---

## 1. Pacing

Each scene-detector hit is a "visual change". A manual check of 16 random hits showed about 85% are real cuts in v1/v2 and about 70% in v3. The rest are large pop-ins, or fast punch-ins in v3.

| | v1 | v2 | v3 |
|---|---|---|---|
| Visual changes | 292 | 348 | 711 |
| Shot length median | **3.9 s** | **4.1 s** | **2.8 s** |
| Mean | 5.5 s | 5.7 s | 3.4 s |
| p10 / p90 | 2.0 / 9.9 s | 1.4 / 11.6 s | 1.5 / 5.9 s |
| Changes/min, first 60 s | 8 | **21** | **37** |
| Changes/min, rest | 11.0 | 10.3 | 17.0 |
| Changes/min by 5-min block | 12, 10, 14, 10, 11 | 13, 11, 9, 9, 11, 10, 7 | 21, 20, 19, 19, 17, 18, 14, 13 |

- **The cold open is 2× faster** in v2 and v3. v1 opens slower but leans on big-number overlays.
- **Pace slows gently** toward the end: v3 goes from 21 to 13 changes/min and v2 from 13 to 7.
- **Long shots are built up, not held.** A 13 s map shot in v1 adds, about 1 s apart: date tag typing, a "2,000+ KM OF FRONT" caption, three arrows one after another, a leader icon, four stacked captions, then a push-in with explosions and a final caption.
- **Significant visual events** (pop-in, caption, cut, arrow) arrive **40–60 per minute**, about one every 1.0–1.5 s. The p90 gap is 2.0–3.5 s.
- **Longest fully still stretch:** 3.7–4.8 s. Something always moves within ~4 s.
- **Words per shot:** about 11 (v1) and about 8 (v3).

### Chapter cards

| | Style | Hold | In / out | Frequency |
|---|---|---|---|---|
| v1 | Pure black (#030303), centred **serif small caps**, white: "February 1940", "21 June 1941 — 9 PM / River Bug, near Sokal" (smaller spaced sub-line) | **2.0 s** (25 cards, nearly all exactly 2.0) | Fade to black ~0.4 s (10 frames), or hard cut; **hard cut out** | About 1 per minute: a time-jump marker more than a chapter |
| v3 | Black, numbered serif small caps: "1. The Scale, 1939" | **1.25–1.45 s** | Hard cut in and out | About every 3 min (one per candidate) |
| v2 | Dark warm (#1a1512) with a soft central glow. Tiny letter-spaced caps ("FIRST PHRASE"), an italic serif phrase that is **written then underlined by an animated red pencil**, and a 5-box progress row with the current box outlined | **~6 s** | Fade ~1 s in and ~1 s out | Exactly at the YouTube chapter timestamps (2:51, 8:18, 15:49, 20:53, 23:57) |

Both channels also use **big-number cards** on dark: "BY THE END OF 1941 / ≈ 2,408,699" in a heavy rounded display face, cream on near-black, with a small spaced caps kicker above.

---

## 2. Camera

Sample of 30 shots per video, keeping only reliable registrations.

| | v1 | v2 | v3 |
|---|---|---|---|
| Static (locked-off) | **60%** | **6%** | **73%** |
| Push-in (incl. +pan) | 23% | 63% | 23% |
| Pull-out (incl. +pan) | 13% | 30% | 3% |
| Push-in rate, median (range) | 0.85 %/s (0.65–2.5) | 3.3 %/s (0.14–5.8) | 2.3 %/s (0.5–3.5) |
| Total zoom per moving shot, median | 1.067 (1.03–1.21) | 1.131 (1.02–1.25) | 1.080 (1.02–1.12) |
| Pan speed, median (px/s at 1280) | 31 | 19 | 48 |

### Move profiles (zoom measured every 0.25 s)

- **Two Sides, "creep":** constant-speed linear push from the first frame. For example, v1 879 s goes 1.004, 1.008, 1.012 … 1.070 over 5.8 s (≈1.2 %/s), with no easing at either end.
- **Two Sides, "punch-in on a beat":** the shot holds still, then pushes partway through. For example, v3 2250 s holds 5.0 s, then goes 1.006 → 1.094 in 2 s (≈4.5 %/s, near-linear) and lands on the key phrase. Map shots get a late push-in of about 1.2–1.25 toward the action (seen in v1's 22 June map).
- **War Unspun, "stepped glide":** ease-out steps with holds in between. For example, v2 1150 s goes 1.00 → 1.093 in 1.0 s (steps of +2.2, +3.1, +2.5, +0.9, +0.6%), holds 0.5 s, steps again to 1.207 in 1.25 s, then holds. v2 1553 s does 1.0 → 1.107 in 2 s, holds 1.5 s, then → 1.20. Moves usually start at or just after the cut.
- **Pans:** slow lateral drifts of 20–50 px/s, usually combined with zoom. One v2 map shot pans across the whole map (about 4,300 px over 28 s ≈ 156 px/s).
- **No handheld shake** anywhere. Impacts use explosion puffs and red stickers, not camera shake.

---

## 3. Text reveal

| Element | Reveal | Speed | Notes |
|---|---|---|---|
| Speech bubble | Character by character, words never reflow (lines are laid out in advance) | **16–20 cps**, roughly matching the voice (v3 Churchill ≈16 cps, v1 Zhukov ≈20 cps) | The bubble appears with the first characters (snap, no slow scale). It **stays fully typed until the cut**. The speaking character's mouth flaps while it types. |
| Date / place tag | Character by character | **≈29 cps** (22 chars in 0.75 s) | The paper slides or wipes into place in about 2 frames (0.08 s), then types about 1 frame later. It holds for the whole shot. Its corner moves: top-left mostly, bottom-left in some shots, top-right on maps. |
| Sticker label | Whole word appears with the paper | n/a | See pop-in below. |
| Stacked trait words ("CAREFUL / STUBBORN / NEVER SHY") | One word at a time, about 1 s apart | n/a | Floating coloured hand caps, no paper. |
| Bottom-centre emphasis caption ("MANY NEVER LEFT THE GROUND", "WAR OF ANNIHILATION — BY CHOICE") | Fades or pops in | n/a | Cream, letter-spaced hand caps with a dark shadow. |
| v2 chapter phrase | Written left to right, then a red pencil underline draws under it | ~1 s write + ~0.8 s underline | |

---

## 4. Pop-ins and transitions

- **Sticker / label pop:** frame 1 shows the paper at about 50% scale, frame 2 is at full size with its text, then a slight overshoot settles by frames 4–5. Total **≈0.15–0.2 s at 24 fps**: very snappy, never floaty.
- **Name plate (lower third):** slides in from the left edge over about 0.3–0.4 s and stays for the shot. It uses a paper card with a red underline under the name and a smaller grey role line ("German Foreign Minister").
- **Arrows:** grow along their path from base to head over about 0.6–1 s. Multiple arrows are staggered about 0.7–1 s apart, and each label appears as its arrow completes.
- **Cuts:** almost all **hard cuts**. Fades happen only into or out of chapter cards (v1 fade-out 0.4 s; v2 fades 1 s). No wipes or whips were found.
- **Light changes inside a shot:** window lights or explosion flashes add motion without cutting.

---

## 5. Character animation

- **Mouth:** while a character talks, its mouth swaps between 2–3 small shapes (dot, small "o", short line) about **4–8 times a second**. Silent characters keep a fixed small mouth.
- **Eyes:** mostly expression shapes (squint lines, dots, smug arcs, wide circles) rather than regular blinking. Occasional single-frame shape swaps read as blinks.
- **Arms:** one deliberate gesture per line or about every 1.5–2 s (pointing at a map, pipe to mouth, arms raised), then a hold. Arms are thin ink noodles with round hands.
- **Bodies:** essentially rigid. No head turns. Characters are placed in pose rather than animated walking; small figures cross exterior scenes occasionally.
- **Reaction tricks:** sweat drops, blush, a red-tinted full-body character for anger (v3 Hitler in red), and thought bubbles holding small icons.

---

## 6. Colour

The overall look is muted: mean saturation is **0.27** in all three videos, with only 6–10% of pixels above 0.6 saturation. Saturated colour is reserved for flags, the USSR red on maps, red stickers and gold highlights. Mean brightness is 0.55–0.58 (v3 is darker at 0.41).

| Scene type | Dominant palette (by area) |
|---|---|
| Interior (offices, war rooms, parliament) | `#c9c2ac` (warm stone wall) · `#2d221c` (ink/shadow) · `#513929` (dark wood) · `#efe8d7` (paper/bubbles) · `#7c7a6b` · `#45584e` (deep green) · `#9ba092` (sage) · `#755139` (wood) |
| Night exterior | `#222f3f` · `#152031` · `#2e2627` · `#30404c` · `#0f141c` · moon/highlights `#d6cdc2` |
| Map | sea `#8bafc3` · land paper `#e5dcc3` · greens `#98be60`/`#7d9b4f` · ink `#2c2725` · neutral `#bfb8a2` · USSR red ≈`#c7584b` · Germany grey ≈`#6f6f6f` |
| Document / desk | paper `#e4ddcc`/`#efe7ca`/`#ebe5d7` · dark surround `#171114` · oxblood backdrop `#61151c` · wood `#6d4f39` |
| Dark device board / chapter | `#221d1e` · `#302726` · `#181416` · warm glow `#4a342f` · chalk text `#e6e3de` |
| Accents (all saturated pixels) | reds `#c7584b` · `#ad4b3e` · `#923c33` · `#6c2621` · flag red `#b92527` · navy `#2d577f` · gold `#cfa34d` · olive-gold `#97853a` · browns `#664228`/`#7a5830` |

- **Vignette: strong.** Median corner-to-centre brightness is 0.64 / 0.68 / 0.56 (p25 0.38–0.49). Interiors often add pools of lamp or window light that act as a second vignette.
- **Grain: none measurable** (flat-area high-pass noise under 0.2 levels). The "paper" feel comes from soft gradients, faint wall stains and cracks, and paper textures on labels, not noise.
- **Outlines:** dark warm ink (≈`#2b2622`), never pure black. They are about 4–5 px thick at 720p on characters and bubbles and thinner (2–3 px) on props and labels.

---

## 7. Typography and layout

Sizes are given as cap height relative to frame height and are approximate (±20%), taken from frame inspection.

| Style | Look | Free look-alike | Cap height | Position |
|---|---|---|---|---|
| Date / place tag | Hand-lettered comic caps, slightly uneven, dark ink on cream paper. Taped corner, thin ink border, small shadow, ~1° tilt | **Patrick Hand** (caps); alternates: Gochi Hand, Kalam Bold | ≈3.5% | Top-left at x≈2%, y≈2–3% (also bottom-left; top-right on maps) |
| Name plate | Name in hand caps/mixed case, red rule under the name, smaller grey role line | Patrick Hand | Name ≈5%, role ≈2.5% | Bottom-left, x≈2–4%, card spans ≈75–92% of height |
| Speech bubble | Rounded hand print, mixed case, dark ink; thick ink outline (4–5 px), white with a faint inner shade | Patrick Hand (alt: Itim) | ≈3.5–3.8% | Above the speaker, tail to the mouth |
| Sticker | Hand or heavy caps in red or ink on cream paper, red or ink border, −4° to +4° tilt | Patrick Hand / Lilita One | ≈4–5% | Next to the thing it labels |
| Big number / headline overlay | Heavy rounded display, white or cream, thick dark outline + shadow ("26 MAY", "3,000,000+"), gold for numbers, small spaced caps line below | **Lilita One** (alt: Luckiest Guy) | 10–16% | Centre or left third |
| Title card | Heavy rounded caps, white with **gold/yellow highlighted words**, on a dark band with a red underline | Lilita One | ≈6–7% | Centred |
| Chapter / time card | Classic serif small caps, white on black; letter-spaced sub-line | **Cormorant SC**, EB Garamond SC (v2: EB Garamond Italic + tiny spaced caps) | ≈3% | Dead centre |
| Map labels | Hand print for cities (dot marker + label), letter-spaced hand caps for regions and armies, spaced italic for seas | Patrick Hand | 2.5–3.5% | On map |
| Documents | Typewriter for memos ("WEISUNG NR. 21", "NKGB USSR — TOP SECRET"); serif for quoted sentences (v2) | **Special Elite** / Courier Prime; Libre Baskerville or EB Garamond for serif | 3–4% | Paper sheet centred, slight tilt |
| Source / citation tag | "according to interpreter / Valentin Berezhkov (memoir)", or a red sticker "ZHUKOV'S MEMOIRS" | Patrick Hand | ≈3% | Bottom-left or bottom-right |

---

## 8. Graphics catalogue

| Graphic | Animation |
|---|---|
| Date / place tag | Slides in ~0.08 s, types at 29 cps |
| Name plate | Slides from the left ~0.35 s |
| Speech bubble | Snaps in, types at 16–20 cps, mouth flaps; stays until cut |
| Thought bubble (cloud with trailing circles) holding words or an icon ("GRAIN = PEACE", plane) | Pops |
| Shout bubble: red spiky burst, white text ("At dawn. They attack at dawn!") | Pops + types |
| Paper stickers ("HUGE", "…BUT CLUMSY", "FEET OF CLAY", "SECRET PROTOCOL", "CUT OFF", "JUST AS PLANNED", "GRAB!") | Pop 0.15–0.2 s with overshoot, stagger ~0.7–1 s |
| Floating word stacks / labels ("A COMMUNIST", trait lists, red "WARN THEM!") | Appear one at a time ~1 s apart |
| Big-number overlays ("3,000,000+ / GERMAN SOLDIERS", "26 MAY / OPERATION DYNAMO") | Pop / fade in over a live scene |
| Maps: flat country fields, flags as icons, hatched contested areas, city dots, legend box with flags, date tag, thick arrows with labels, target reticle, explosion puffs, leader head tokens | Arrows grow staggered, tokens and labels pop, late push-in |
| Scoreboard ("MISSED EXITS — Berlin 5 / Moscow 7") | Counter increments, with a "MOSCOW: 1" red label popping on screen |
| Running devices: road race past green "EXIT" signs (v1), brass balance scale with labelled weights (v3), timeline list board "WHEN DID SPEED STOP BEING ENOUGH?" with the current row highlighted and red verdict tags (v3), evidence desk with index cards + HOLDS/BENDS/BREAKS stamps + sentence parsing with numbered red circles (v2) | Recurring every chapter; state carries over |
| Documents: typed memo, yellow highlighter swipe, red strike-through + handwritten correction, red pencil circle, rubber stamp, ink blot, red "STALIN'S REAL NOTE" sticker | Highlighter draws left to right; pencil draws; stamp slams |
| Calendars (tear-off "MAY 1945 / 8", wall month with circled date), clocks, on-screen timers ("02:00", "21:00" bottom-right) | Hands move; dates flip |
| Circular insets with labels ("WORN-OUT TANKS", "MARSHY GROUND") | Pop |
| Paper bar chart ("SIXTH ARMY — SUPPLIES PER DAY": needed vs got, dashed outline for the gap) | Bars grow |
| Spotlight object shots: dark room, lamp cone, object plus a museum-style caption card ("LEND-LEASE, 1941 / America already helping Britain") | Static + slow push |
| Dossier card (polaroid portrait + bullet facts) | Pops onto a board |
| Chapter / time cards; big-number cards | See §1 |

---

## 9. Sound (v1, v3)

- **Loudness:** −14.1 / −14.2 LUFS integrated (YouTube target), with a tight loudness range of 4–5 LU, so the narration is clearly compressed.
- **Narration pace:** **169 wpm (v1), 163 wpm (v3)**. v2's transcript implies about 155 wpm.
- **Bed:** speech sits at a median of −19.5 dBFS RMS. Pauses fall to about −37 dBFS, not silence, and the noise is broad-band with no tones. So there is a quiet bed (music or ambience) **about 17 dB under the voice**. Only 57 dips below −40 dB occur in 27 minutes, so the bed runs almost continuously.
- **Sound effects:** sparse and subtle. In v1, high-frequency onsets at cuts are 3.7 dB stronger than at random times, which suggests occasional whooshes, pops or impacts on some cuts. v3 shows no measurable difference. The voice carries the video.

---

## Rules to copy (defaults for our renderer)

**Pacing**
1. Shot length: median **3.5 s** (2–6 s typical); allow 8–13 s only for built-up map or device shots.
2. Cold open (first 60 s): about **2× faster**, roughly 20–35 changes/min. Body: 11–17 changes/min. Ease off slightly in the last third.
3. A **significant visual event every 1–1.5 s** (sticker, caption, arrow, cut). Nothing may sit fully still for more than **4 s**.
4. About 8–11 narration words per shot.

**Camera**
5. Default to **locked-off**: 60–70% of shots.
6. "Creep": linear push from the first frame, **~0.9–1.2 %/s**, about 1.00 → 1.06–1.07 over a shot, no easing.
7. "Punch-in": hold, then a **linear push of ~4–5 %/s for ~2 s** to land on the key phrase, about 1.00 → 1.08–1.10.
8. Map shots: build first, then a late push of **~1.2×** toward the action.
9. Pans: 20–50 px/s at 1280 width, usually with a slight zoom. **No camera shake.**
10. Optional War Unspun mode: stepped **ease-out** pushes (+9% over 1 s, hold 0.5–2 s, repeat) on almost every shot.

**Text and motion**
11. Speech bubbles type at **16–20 cps**, synced to the voice line. Mouth flaps 4–8 times per second while typing. The bubble stays until the cut.
12. Date tags slide in over **0.08 s**, then type at **~30 cps**. One per new location or time.
13. Stickers pop in **0.15–0.2 s**: 50% scale, overshoot, settle. Stagger multiple stickers 0.7–1 s apart.
14. Name plates slide from the left in **~0.35 s**, bottom-left.
15. Arrows grow over 0.6–1 s, staggered ~0.8 s apart.
16. Hard cuts everywhere. Fades only into or out of chapter cards.

**Chapters**
17. Time-jump cards: black, serif small caps, **2.0 s**; fade in 0.4 s, hard cut out.
18. Chapter cards on the YouTube chapter marks: about 1.3 s hard cut (Two Sides style) or about 6 s with 1 s fades plus an animated pencil underline and a progress row (War Unspun style).

**Look**
19. Muted palette: mean saturation about 0.27. Save saturated red and gold for accents, flags and money.
20. **Strong vignette:** corners at about 0.6 of centre brightness, plus local light pools.
21. **No visible film grain.** Keep any noise at or below 1–2% opacity; texture comes from gradients, stains and paper.
22. Ink lines in warm near-black `#2b2622`: 4–5 px on characters and bubbles, 2–3 px on props and labels.

**Type**
23. Hand comic caps (Patrick Hand) for tags, plates, bubbles, stickers and map labels. Heavy rounded display (Lilita One) for big numbers and titles, with highlight words in gold. Serif small caps (Cormorant SC) for chapter cards. Typewriter (Special Elite) for documents.
24. Sizes: date tag ≈3.5% of frame height, bubble ≈3.6%, name ≈5%, big numbers 10–16%.

**Sound**
25. Narration at about **165 wpm**, mastered to **−14 LUFS** with an LRA of 4–5 LU. A continuous music or ambience bed **~17 dB under the voice**. Sound effects are sparse: a soft pop or whoosh on a minority of pops and cuts, never on every one.
