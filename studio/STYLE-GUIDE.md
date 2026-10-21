# Style guide: how things look

**One style for everything.** History and finance videos share the same characters, sets, palette and every graphic,
and any piece can be used in any video. The `"style"` field in shots.json is only a **preset of defaults** (`lib/styles.js`):
- **war** (default): the look described below, measured from Two Sides of War / War Unspun.
- **finance**: "Finance preset" at the end, measured from Crayon Capital (`docs/CRAYON-ANALYSIS.md`).

Each shot can override any default (dialogue, tag, chapter card, vignette, camera); see SHOTS.md.

The look of the reference channels, adapted for a money channel. Measured numbers come from
`docs/REFERENCE-ANALYSIS.md`. Every rule here is already built into `lib/`, so follow the lib and you follow this guide.

## 1. The feel in one line
A printed, slightly faded paper world of round-headed cartoon people, flat muted colour, heavy
warm-black outlines, and hand-lettered labels taped onto the screen.

## 2. Colour (`lib/palette.js`)
- **Muted everywhere.** Mean saturation is about 0.27. Backgrounds are sage, khaki, wood, paper and night blue.
- **Accents are scarce and meaningful:**
  - `red`: danger, losses, falling lines, stamps, key stickers
  - `gold`: money, highlight words in titles, sparks, the highlighter
  - `green`: money, gains, "safe"
- **Ink** `#2b2622` (warm near-black) for every outline, limb and text. Never use pure black for lines.
- **Strong vignette** on every frame (corners at about 0.6 of centre brightness); `frame()` does this.
  Add local light pools (lamps, windows) on night and interior sets.
- **No visible film grain.** Texture comes from stains, wood grain, paper and gradients.

| Scene type | Base colours |
|---|---|
| Office interior | `wall` sage, `wallDark` dado, `floor`, wood desk |
| Night exterior | `nightDeep` → `nightMid` sky, `night` skyline, `windowLit` |
| Document / evidence desk | top-down `deskTop()` wood, `paper` sheets |
| Device board | `board` chalkboard in a `woodDark` frame |
| Charts | `paper` card on the `wall` background, line in `red` (falls) or `green` (rises) |

## 3. Line weight
- Characters, bubbles and big shapes: **4–5 px** (at 1280 design width).
- Props and labels: **2–3 px**.
- Limbs: **7 px** noodle strokes, round caps.

## 4. Characters (`lib/characters.js`)
Built the same way every time:
- Big round head (r = 66) with cream skin, a thick outline and two pink blush ovals.
- Dot eyes; expressions come from eye shapes (`dot`, `smug`, `happy`, `wide`, `sad`, `closed`) and brows (`flat`, `angry`, `worried`, `raised`, `smug`).
- Small body (suit, shirt, dress or coat) and thin noodle arms with round hands.
- **Identity = 1–2 signature features**: hair shape, hat, glasses, moustache, outfit colour.
  A real person gets a `CAST` entry. Example: a robber baron is a top hat plus a walrus moustache.
- **Scale:** in wide shots a character's head is about 18% of frame height; in close-ups, 30–35%.
- Characters stand **behind** furniture: draw the desk after the character.

## 5. Typography (`fonts/`)
| Use | Font | Size at 720 design height |
|---|---|---|
| Date tag (place · date), top-left | Patrick Hand (`hand`) | 25 (≈3.5%) |
| Speech bubble | Patrick Hand | 27–30 (≈3.6–4%) |
| Name plate: name / role | Patrick Hand | 34 / 20 (≈5%) |
| Stickers (key words) | Patrick Hand caps, red or ink | 30–38 |
| Big numbers and titles | Lilita One (`display`), highlight words gold | 64–110 (10–16%) |
| Documents | Special Elite (`type`) | 26–30 |
| Chapter / time-jump cards | Cormorant SC (`serif`) on black | 54 |

## 6. Layout
- **Date tag** top-left (x≈26, y≈22), slightly rotated, with a tape corner. One per new place or time.
- **Name plate** bottom-left (x 40, y≈592) with a red side bar and red underline.
- **Tally / scoreboard** top-right.
- **Source line** bottom-right, small and semi-transparent, on any data shot.
- Keep faces clear: bubbles sit beside the head with the tail aimed at the head edge.
  Stickers never cover a face or a data line.

## 7. Graphics catalogue (what exists in `lib/`)
| Graphic | Function | Notes |
|---|---|---|
| Date tag | `ui.dateTag` | slides in 0.08s, types at 30 cps |
| Name plate | `ui.namePlate` | slides from the left in 0.35s |
| Sticker | `ui.sticker` | pops from 50% with overshoot in 0.18s |
| Speech bubble | `ui.bubble` | pops from the tail, types at 18 cps |
| Index card | `ui.indexCard` | evidence and timeline stops |
| Stamp | `ui.stamp` | slams from 1.8× to 1× |
| Big number | `ui.bigStat` | number plus caption, rises in |
| Highlighter | `ui.highlight` | swipes left to right behind document text |
| Red pencil circle | `ui.pencilCircle` | draws around a word |
| Arrow | `ui.arrow` | grows over 0.8s |
| Title card | `ui.titleCard` | dark band, gold highlight words, red underline |
| Chapter card | `ui.chapterCard` | black, serif small caps, 2.0s |
| Line chart | `props.lineChart` | draws by year (`upTo`), with a head dot |
| Fuse device | `dev.fuse` + `fuseProgress` / `fuseSchedule` + `dev.tally` | the channel's signature device |
| Sets | `props.office`, `windowCity`, `clock`, `desk`, `nightSky`, `skyline`, `tower`, `streetLamp`, `deskTop` | |

| Sets (11) | `lib/sets.js` | each set has `draw`, `front` (furniture in front of people), `spots`, `close` |
| Money | `lib/money.js` | cash stack, bag, coins, gold bars, banknote, piggy bank, vault, ticker, stock bars, money rain |
| Maps | `lib/maps.js` | paper-blue ocean `#a3b6ba`, `paperDim` land, ink borders, flat highlight colours, hatching, cities, growing arrows, legend |

**Still to build** (seen in the references): calendars, a balance scale, a ledger, a scoreboard variant,
a progress row for chapters, and historical borders for maps.

## 8. The house device: THE FUSE
The references each carry a whole episode with one metaphor: exits on a road, a scale, an evidence desk.
Ours is **the fuse**: a lit fuse burning along a timeline toward the disaster. Each stop is a moment someone could have
cut it. A card lands at each stop and the "CHANCES TO CUT IT" tally counts up. Use it as the spine of
every "Why X Was COMPLETELY Avoidable" episode, and return to it between chapters.

## Finance preset
Same characters, sets, line weights and palette, with brighter, lighter-handed defaults. These pieces were added from the
money references, and all of them are usable in history videos too:
- **Look:** neutral grey, wood and teal backgrounds; saturation ~0.22; **light vignette** (corners ~0.9 of centre); spotlight pools for drama; no grain.
- **Text:**
  - Dialogue: a **floating handwritten line** (Caveat, `script`) above the speaker, with a tick; bubbles only for emphasis.
  - Place and time: a **handwritten corner caption** ("New York, 2008"), low on busy sets.
  - Pivot sentences: **black cards** with typed white script.
  - Chapter cards: black, with a handwritten title.
- **People:** a **handwritten name + curved arrow** on someone's first appearance. Conversations cut shot/reverse-shot.
- **Graphics:**
  - UI mockups (`lib/screens.js`): social post, phone notification, article, app page, live news, terminal, chat
  - Data (`lib/datakit.js`): stock chart with timeframe tabs, ticker chip, ranking board, winners vs losers, calendar flip, cheque, count-up
  - Diagrams (`lib/diagrams.js`): equation, loop, funnel, org tree, portraits, steps, split panels, flash montage
  - **No real logos**: lettered emblems plus names.
- **The host** (`CAST.host`, `lib/host.js`): brown skin, dark side-parted bob, navy blazer, white open collar, gold necklace and studs.
  A detailed "hero" face. An occasional recurring character, not a presenter.
- **Structure:** cold open (montage or big number → headline → hook card), title, chapters every 4–5 min, quote card, subscribe.
