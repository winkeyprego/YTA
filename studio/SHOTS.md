# Shot list reference (`shots.json`)

A video is one folder in `episodes/` containing:

| File | What it is |
|---|---|
| `shots.json` | the shot list: one entry per beat of narration (this document) |
| `vo.mp3` (or .wav) | the narration (optional until the voice exists) |
| `words.json` | word timings made by `python3 tools/transcribe.py episodes/<ep>/vo.mp3` |
| `SCRIPT.md` | the script, plus sources for every fact shown on screen |

Without `words.json`, shots are timed as if read at 165 words per minute, which is fine for previews.
With it, every shot lasts exactly as long as its line, and anything with `"on": "word"` pops when that word is spoken.

```json
{
  "title": "Why the 2008 Crash Was COMPLETELY Avoidable",
  "style": "war",
  "fps": 24,
  "audio": "vo.mp3",
  "cast": { "fuld": { "base": "ceo", "hair": "bald", "glasses": false } },
  "shots": [ { "template": "talk", "vo": "...", ... } ]
}
```

**`style`**: a **preset of defaults**, not a separate style. Every template and graphic works under either preset.
- `"war"` (default): taped date tags, speech bubbles, strong vignette, serif chapter cards.
- `"finance"`: handwritten corner captions, floating handwritten dialogue, light vignette, handwritten chapter cards.

**Per-shot overrides** (mix freely):
- dialogue: `"dialogue": "bubble"` or `"float"` on a `talk` shot
- tag: `"tag": { "text": "...", "style": "tape" }` or `"script"`
- chapter card: `"style": "serif"` or `"script"` on a `chapter` shot
- vignette: `"vignette": 0.25` (light) or `true` (strong) on any shot

Starters: `episodes/finance-starter` (money topics) and `episodes/template-starter` (history topics).
`episodes/test-mixed` shows the two mixed.
**Which visual for which sentence: see `RECIPES.md`.**

## Fields every shot can use

| Field | Meaning |
|---|---|
| `template` | **required**: `talk`, `versus`, `document`, `chart`, `stat`, `fuse`, `pipes`, `case`, `compose`, `map`, `money`, `title`, `chapter`, `card`, `screen`, `data`, `diagram` |
| `id` | optional label for the shot (shown by `--plan`) |
| `vo` | the narration spoken during this shot, copied exactly from the script. The shot's length comes from it. Shots without `vo` (chapter cards) last `dur` seconds, and the narration pauses for them |
| `dur` | force a length in seconds (normally leave it out) |
| `tag` | date tag top-left: `"NEW YORK · SEPT 2008"`. Use one on every new place or time |
| `plate` | name plate: `{ "name": "Dr. John Eng", "role": "Endocrinologist", "on": "john" }` |
| `stickers` | key words popping on screen: `[{ "text": "GONE IN ONE NIGHT", "on": "gone" }]`. Optional `x`, `y`, `rot`, `size`, `color` (`red` default, `ink`, `gold`, `green`, `blue`), `font` (`hand` default, `display`) |
| `stat` | big number overlay: `{ "value": "158 YEARS", "caption": "ON WALL STREET", "on": "hundred" }` |
| `source` | small source line bottom-right on data shots |
| `camera` | `"locked"`, `"creep"` (slow push), `{ "mode": "punch", "on": "word" }` (quick push onto a key word), `{ "mode": "push", "on": "word" }` (late 1.2× push for charts and maps), `"steps"` |

**Cues:** `"on": "word"` means the first time that word is said in this shot. `"on": "one injection"` matches a phrase.
`"on": "the#1"` matches the second "the". `"at": 1.5` is seconds from the start of the shot. Fields ending in `On` (`poseOn`, `lineOn`, …) take the same values.

## Templates

### `talk`: people on a set
```json
{ "template": "talk", "set": "office", "vo": "And it all rested on one idea...",
  "chars": [ { "who": "banker", "spot": "center", "mood": "smug", "pose": "pointLeft", "poseOn": "idea" } ],
  "frame": "wide", "speaker": "banker", "line": "House prices never fall.", "lineOn": "house" }
```
- `set` (33 sets; contact sheets: `episodes/test-sets*`). Options go in `setOpts`.
  **Money world** (`lib/sets.js`):
  - `office` `{chart, hour, night}` · `boardroom` `{screen, headline}` · `tradingFloor` · `factory` · `courtroom` `{judge}`
  - `bankExterior` / `towerNight` `{name}`; `towerNight` also `{darkFrom, darkTo}` (seconds over which the windows go dark)
  - `streetDay` `{signs: [a, b, c]}` · `hall` `{neutral}` (wall lamps instead of flags and seal)
  - `home` / `studioNews` `{tvContent | screen, finance, tvHeadline}`: the screen shows `tvContent`/`screen`, else the red
    falling bars when `finance: true`, else a headline, else a neutral picture
  - `stage` `{banner, panel, podium:false}` (keynote/conference; with `panel` the table covers right/farRight)
  - `weddingGarden` `{dusk}` · `resort` `{laptop:false}` · `dataCenter` · `carNight` `{speed}` (center only: back-seat passenger)
  - `classroom` `{board: "chalk text\nline two"}` · `podcast` `{headphones, onAir:false}` (left/center/right)
  - `airportGate` `{flights, gate}` · `prisonExterior` `{name}`
  **History and places** (`lib/sets-history.js`; calm establishing places, never damage):
  - `skylineWTC` `{towers:true|false, dusk, night, light}` (`towers:false` = only the empty sky; `light` = the memorial beams, night only)
  - `memorial` `{night, light}` · `fieldPA` · `pentagon` (aerial, **no cast**) · `capitol` · `courthouse` `{name}` · `embassy` `{name, flagColor}`
  - `controlRoom` `{mapLabel}` (left/center/right = seated operators) · `ovalOffice` (center = behind the desk)
  - `cinema` `{title, festival}` (festival front at night) · `cinemaInside` `{title}` (screening room, stage spots)
  - `balcony` `{skyline: 'generic'|'wtc', time: 'day'|'dusk'|'night', towers, light}` · `gulfSkyline`
  Exteriors (`towerNight`, `bankExterior`, `skylineWTC`, `memorial`, `fieldPA`, `pentagon`, `capitol`, `courthouse`, `embassy`,
  `gulfSkyline`, `prisonExterior`) default to the full frame.
- `chars[]`: `who` (a cast key, see below), `spot` (`left`, `center`, `right`, `farLeft`, `farRight`), `mood`, `pose`, `poseOn`,
  `mood2` + `mood2On` (change of expression), `pose2` + `pose2On` (second gesture), `holding` (`phone`, `paper`, `money`, `mic`,
  `briefcase`, `sign`, `glass`, `camera`, `laptop`, `book`), `carry: "box"`, `walk: "in"|"out"`.
- `frame`: `wide` (default) or `close` (head and shoulders of `focus` or `speaker`).
- `speaker` + `line`: the speaker says a line while the mouth moves. In finance it's a floating handwritten line; in war, a speech bubble. Add `"bubble": true` to force a bubble.
- `lines: [{ "who", "text", "on" }]`: a conversation. Each line replaces the previous one. With `"frame": "reverse"`, the camera cuts close to whoever is speaking (shot / reverse shot).
- `speaking: true`: mouth movement only, for narrated or reported speech.
- `light: true`: a spotlight pool on the focus character (drama, a lone figure).
- `nameArrow: { "who", "text", "on" }`: a handwritten name with a curved arrow, for someone's first appearance.
- **Moods:** `neutral`, `confident`, `smug`, `happy`, `excited`, `worried`, `sad`, `angry`, `shocked`, `sleepy`.
- **Poses:** `idle`, `pointLeft`, `pointRight`, `pointUp`, `present`, `presentLeft`, `shrug`, `armsUp`, `hips`, `think`, `wave`,
  and acting poses `give`, `giveLeft`, `typing`, `armsCrossed`, `facepalm`, `phoneEar`, `headInHands`, `explain`.
- **Staging per person:** `turn` (-1..1, three-quarter view toward screen left/right; `turn2` + `turnOn` turns on a word),
  `sit: true` (on a chair; behind a desk people already read as seated), `back: true` (seen from behind).
- `frame: "ots"` (over the shoulder): `over` names the listener, drawn from behind, big, in the foreground; the camera frames
  the other person beyond. See RECIPES "Staging".

### `versus`: two sides, split screen
```json
{ "template": "versus", "vo": "...", "left": { "who": "banker", "label": "WALL STREET", "mood": "smug", "line": "optional bubble" },
  "right": { "who": "homeowner", "label": "MAIN STREET", "mood": "worried" } }
```

### `document`: paper on a desk
```json
{ "template": "document", "vo": "...", "lines": ["UNITED STATES BANKRUPTCY COURT", "", "In re: LEHMAN BROTHERS"],
  "highlight": "LEHMAN", "highlightOn": "lehman", "pencil": "Chapter 11", "pencilOn": "chapter",
  "stamp": { "text": "$613 BILLION IN DEBT", "on": "billion" } }
```

Also: `redact: ["phrase", ...]` (black bars), `unredactOn` (the bars lift on that word), `classified: "TOP SECRET"` (a red band).

### `chart`: a line that rises (and optionally falls)
```json
{ "template": "chart", "vo": "...", "title": "U.S. HOME PRICES", "data": [[2000, 100], [2006.5, 184], [2012, 134]],
  "turn": 2006.5, "turnLabel": "PEAK · JULY 2006", "fallOn": "then", "change": { "text": "−27%", "on": "quarter" },
  "source": "S&P/Case-Shiller U.S. National Home Price Index" }
```
`rising: true` draws a green line; without `turn`, the whole line draws over 2.5s.

### `stat`: one huge number
```json
{ "template": "stat", "vo": "...", "value": 1000000000, "suffix": "+", "caption": "ADULTS CLASSIFIED AS OBESE", "on": "billion", "set": "home" }
```
A numeric `value` counts up. A text `value` just pops. Without `set`, the background is the chalkboard.

### `fuse`: the house device
```json
{ "template": "fuse", "vo": "...", "heading": "THE FUSE", "sub": "every point where someone could have cut it",
  "stops": [ { "year": "2003", "title": "RATES AT 1%", "lines": ["Money gets cheap"], "on": "2003" } ],
  "end": { "label": "LEHMAN", "sub": "SEPT 2008", "on": "lehman" }, "tallyLabel": "CHANCES TO CUT IT" }
```
Up to 5 stops. The spark reaches each stop on its word. `endStyle`: `bomb` (default), `card`, `flag`; `rope`: `fuse` (default) or
`thread` (a red string; defaults the heading to THE RECORD). For tragedies use `"endStyle":"card","rope":"thread"`, or `case`.

### `pipes`: two supply pipelines feeding one front (Eastern Front house device)
```json
{ "template": "pipes", "vo": "...", "heading": "TWO PIPES, ONE FRONT", "sub": "what kept the Red Army moving",
  "front": { "label": "THE FRONT", "on": "front" },
  "a": { "label": "SOVIET PIPE", "sub": "from behind the Urals", "on": "soviet" },
  "b": { "label": "ALLIED PIPE", "sub": "from three oceans", "on": "allied", "share": 0.3 },
  "shut": [ { "pipe": "b", "on": "closes", "label": "CUT" } ] }
```
On the dark device board: a reservoir with a needle gauge (`front`, there at the cut unless cued), pipe `a` (red) from the
left edge and pipe `b` (blue steel) from the top right. Each pipe draws on from its edge on its word, its valve wheel spins
open and liquid runs in, filling the reservoir. A `shut` turns that valve: its flow stops, the pipe drains and the needle drops
by that pipe's share (`label` = optional stamp). `level` (0..1, default 0.9) = the reading with both open; `share` (default 0.5
each) splits it. For a follow-up shot with the pipes already running, give both pipes `"at": -5`.

### `case`: the investigation board (mysteries, disputed claims, tragedies)
```json
{ "template": "case", "vo": "...", "heading": "THE CLAIMS", "sub": "and what the record shows",
  "cards": [ { "title": "THE CLAIM", "lines": ["short line", "short line"], "verdict": "FALSE", "on": "claim", "verdictOn": "false" } ] }
```
Up to 6 cards pin up in order, joined by red thread; each verdict stamp lands on its own word.
Verdicts: `FALSE`, `UNPROVEN`, `STILL OPEN`, `TRUE`, `MISLEADING` (or any text, with `verdictColor`).

### `compose`: free placement (metaphors, one-off scenes)
```json
{ "template": "compose", "vo": "...", "bg": "board",
  "items": [ { "prop": "balanceScale", "x": 640, "y": 600, "tip": 1, "left": "RISK", "right": "REWARD", "on": "risk" },
             { "who": "leo", "x": 300, "y": 640, "mood": "worried", "on": "leo" },
             { "text": "Words", "x": 640, "y": 140, "size": 60, "on": "words" },
             { "sticker": "KEY PHRASE", "x": 900, "y": 300, "on": "key" } ] }
```
`bg`: `board`, `paper`, `wall`, `desk`, `night`, or any set name (with `setOpts`); `front: true` draws that set's foreground.
Anchors are bottom-centre (people and props; `jet` is centred). Items pop in on their cue. Props:
- Money: `cashStack` (height, w), `moneyBag` (label), `coinPile` (count), `goldBars` (rows), `banknote` (value, rot), `piggyBank` (shake),
  `vault` (opens from its cue), `moneyRain`
- Furniture: `desk`, `clock` (hour), `wallClock` (time "9:30"), `paperStack` (label), `phone`, `monitor` (kind bars|line|text),
  `chair`, `plant`, `bookshelf`, `flagPole` (kind us|plain), `podium` (seal), `couch`, `tv`, `column`, `machine`
- Moving objects: `balanceScale` (tip -1..1, left, right), `bell` (ringAt), `countdownClock` (from, to, unit, rate, label),
  `invitation` (title, date), `doorsRow` (count, every), `sharkFins` (count, speed), `circuitBreaker` (tripAfter),
  `weather` (kind sun|storm|hurricane), `photocopier` (pages, every), `badge` (name, role), `van` (dir, drive),
  `radarScope` (blips, ring), `blackBox` (ping), `jet` (kind business|fighter, dir, fly; open sky only), `thermometer` (value, max, unit, label),
  `pokerTable` (cards), `puzzle` (cols, rows, missing), `coffeeCup` (color), `clipboard` (title, count <= 10),
  `evidenceTray` (items), `houseOfCards` (levels, fallAt), `rocket` (launch)
- WW2 (no Nazi symbols; red star = Soviet, white star = American): `tank` (dir, drive, star, color), `tankColumn` (count 3-6,
  speed, dir, gap; x = lead tank), `truck` (cargo canvas|crates|rockets|bread, dir, drive, star), `cargoShip` (dir, sail, water;
  full-width water strip, use s ~0.7), `book` (title, color, tilt, or open: true)
One-line descriptions of every prop: `DOCS` at the bottom of `lib/propkit.js`.

### `map`: real geography
```json
{ "template": "map", "vo": "...", "view": { "center": [-40, 45], "zoom": 2.2,
  "highlight": { "United States of America": "#4f6f8f" }, "cities": [ { "name": "New York", "lon": -74, "lat": 40.7, "on": "york" } ],
  "arrows": [ { "from": [-74, 40.7], "to": [-0.1, 51.5], "on": "london", "label": "CONTAGION" } ] } }
```
`view.rings: [{ lon, lat, miles | km, label, on }]` draws dashed range circles. `view.fit: ["Germany", "Poland"]` frames countries.
Places too small for the world map (a few blocks, a town, a field): `"city": { "name": "LOWER MANHATTAN", "sub": "...", "water": ["left", "bottom"],
"grid": true, "pins": [{ "label": "...", "x": 0.6, "y": 0.4, "on": "word" }] }` draws a generic, labelled-illustrative city plate.
See the top of `lib/maps.js` for every option.

### `money`: money graphics (`lib/money.js`)
```json
{ "template": "money", "vo": "...", "items": [ { "kind": "cashStack", "args": [640, 560, 260, "$t", "$at"], "on": "billion" } ] }
```
`"$t"` is replaced with the shot time, and `"$at"` with the item's cue time.

### `card`: black narration card (pivot sentences)
```json
{ "template": "card", "vo": "But nobody asked the obvious question.", "text": "But nobody asked the obvious question." }
{ "template": "card", "vo": "...", "lines": [{ "text": "First line", "on": "first" }, { "text": "Then this", "on": "then" }] }
```
White handwritten script on black, typed. A later line replaces the earlier one (add `"stack": true` to keep both). Finance: about 1 in every 10–12 shots.

### `screen` / `data` / `diagram`: the finance kits
A `kind` picks the graphic; the remaining fields belong to that kind. Any `"on": "word"` (or `xxxOn`) inside is timed to the narration.
The graphic itself is always on screen at the cut. A shot-level `on` on a later word moves to the kind's key moment where it
has one (browserArticle highlight, socialPost likes, email send, videoPage views, cheque signature, leverage move, dualChart
split, winnersLosers verdict); the first element of a build (nodes, terms, rows, people...) is shown at the cut.
The full field lists are at the top of `lib/screens.js`, `lib/datakit.js` and `lib/diagrams.js`. Ready-to-copy examples are in RECIPES.md.

| template | kinds |
|---|---|
| `screen` | `socialPost`, `phoneNotification`, `browserArticle`, `appPage`, `newsLive`, `terminal`, `chatThread`, `email`, `videoPage`, `cctv` (scene hallway/doorway), `radar` |
| `data` | `stockChart`, `rankingBoard`, `winnersLosers`, `calendarFlip`, `cheque`, `countUp`, `countDown`, `ledger`, `donut`, `dualChart`, `leverage`, `tickerChip` |
| `diagram` | `equation`, `loop`, `funnel`, `orgTree`, `portraits`, `steps` (`style: "book"` or `"notes"`), `section` (abstract structural schematic), `split`, `montage` |

**Field names come from the kit file headers** and `--plan` checks them (also one level down: `rows[]`, `slices[]`, `a`/`b`...).
A misspelled field is a warning ("dualChart a has no field "points" (a takes label, data, color)"), and `--qa` flags any frame
that renders almost empty, so a wrong field never reaches the render unnoticed. The new kinds at a glance:
- `countDown {from, to, prefix, suffix, caption}` red count with a down arrow; lands on its cue like `countUp`
- `ledger {title, rows: [{date, name, amount, note, on}], total}` handwritten book; negative amounts in red
- `donut {title, slices: [{label, value, color, on}], center, centerSub, unit, hole}` (hole: false = pie)
- `dualChart {title, a: {label, data, color}, b: {...}, splitOn, splitLabel, rebase}` two lines from 100, the split lands on its cue
- `leverage {own, borrowed, move, moveOn, prefix}` own money + borrowed bricks, then the move wipes it out (or gains)
- `calendarFlip {from: "JULY 24", to: "JULY 29"}` flips day by day and circles the last (month/year mode as before)
- `email {from, to, subject, body, sendOn, fly}` typed, sent, SENT lands on it · `videoPage {title, channel, views, viewsFrom, viewsOn, emblem}`
- `cctv {label, time: "08:46:00", scene: "hallway"|"doorway"}` grey security frame, ticking clock
- `radar {blips: [{x, y} | {angle, dist}], ring, inner, innerLabel, label}` (ring: true = only the rim is covered)

`split` panels and `montage` frames can hold a whole shot: `{ "label": "2007", "on": "2007", "shot": { "template": "talk", ... } }`.
Montage frames without `at`/`on` spread evenly over the shot. Diagram builds hold tight on the first element and pull back at the end automatically.
No real logos: companies are lettered emblems (`"emblem": "G"`) plus their names.

### `title` and `chapter`
```json
{ "template": "title", "vo": "So why didn't anyone?", "text": "WHY THE [2008 CRASH] WAS COMPLETELY AVOIDABLE", "set": "towerNight" }
{ "template": "chapter", "label": "Part One", "sub": "Cheap Money", "dur": 2 }
```
Chapter cards follow the style: serif small caps (war) or a handwritten title (finance).
Words in `[brackets]` turn gold. Keep the `vo` on a title short (under 5s).

## Cast (`who`)
**Built in:**
- Money and business: `banker`, `oldBanker`, `robberBaron`, `ceo`, `founder`, `founderTurtle`, `investor`, `trader`, `analyst`
- Officials: `regulator`, `regulatorWoman`, `politician`, `judge`, `reporter`
- Uniforms and jobs: `officer` (military), `pilot`, `fighterPilot`, `controller` (headset), `policeOfficer`, `firefighter`,
  `scientist`, `engineer`
- Ordinary people: `homeowner`, `homeownerWoman`, `worker`, `child`, `elderly`, `elderlyWoman`, `student`, `shopkeeper`, `passerby`,
  `neighbor`, `groom`, `bride`, `crowdA`, `crowdB`, `crowdC`
- `unknown`: a dark faceless silhouette (someone not yet revealed, or a person we shouldn't draw)

**The finance host:** `host` (detailed face, from the owner's illustration) or `hostHouse` (the same person in house style).
She is an occasional character, not a presenter on every shot. See RECIPES.md, "The host".

**Named people** go in the episode's `cast`, built from a base plus one or two signature features:
```json
"cast": { "musk": { "base": "founder", "hair": "side", "hairColor": "#3a2d25" } }
```
- Hair: `slick`, `side`, `bald`, `bob`, `curly`, `bun`, `long`, `spiky`, `ponytail`
- Extras: `glasses`, `moustache` (`brush`, `walrus`, `thin`), `beard` (`short`, `full`), `hat` (`tophat`, `fedora`, `cap`, `service`,
  `police`, `hardhat`, `helmet`, `pilotHelmet`, `ushanka` (Soviet fur hat, small red star), `stahlhelm` (plain grey WW2 German
  helmet, no insignia), `peaked` (officer's peaked cap; `hatColor` crown, `hatBand` band)), `cigar`, `pin`, `badge`, `lanyard`, `headset`, `veil`
- Outfits: `suit`, `shirt`, `dress`, `coat`, `hoodie`, `turtleneck`, `vest`, `robe`, `overalls`, `blazer`, `uniform`, `police`,
  `firefighter`, `flightsuit`, `labcoat`, `tuxedo`, `weddingDress`, `tshirt` (+ `print`: 1-3 letters on the chest),
  `greatcoat` (long double-breasted military coat with belt; colour from `suit`, default Soviet grey-brown; `"suit": "fieldGrey"`
  for German), `tunic` (high-collared military tunic with breast pockets; colour from `suit`, default olive)
- Colours: `hatColor`, `hatBand` also take palette names. Eastern Front examples: Soviet soldier `{ "outfit": "greatcoat", "hat": "ushanka" }`,
  German soldier `{ "outfit": "greatcoat", "suit": "fieldGrey", "hat": "stahlhelm" }`, officer `{ "outfit": "tunic", "hat": "peaked" }`
- Colours (palette names or hex): `suit`, `shirt`, `tie`, `hairColor`, `beardColor`, `printColor`, `skin` (`skin1` light … `skin6` deep)
- `--plan` lists every valid value and suggests the nearest one for a typo.

## Pacing rules (checked by `node render.js episodes/<ep> --plan`)
- War: shots about 3.5s, with anything over 8s split. Finance: story shots about 3s, split over 7s.
  Built shots (`fuse`, `pipes`, `chart`, `map`, `data`, `diagram`, `screen`) can run to ~13s (war) or ~15s (finance) if elements keep landing.
- Something must happen every 1–1.5s: a sticker, a pose, an expression change, a bubble, a stat.
  The checker warns when nothing happens for more than 4s.
- Cut wide → close on the same set to keep the pace up.
- Keep title cards short. Use chapter cards (`dur: 2`) between parts.
