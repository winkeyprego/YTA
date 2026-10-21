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
  "fps": 24,
  "audio": "vo.mp3",
  "cast": { "fuld": { "base": "ceo", "hair": "bald", "glasses": false } },
  "shots": [ { "template": "talk", "vo": "...", ... } ]
}
```

## Fields every shot can use

| Field | Meaning |
|---|---|
| `template` | **required**: `talk`, `versus`, `document`, `chart`, `stat`, `fuse`, `map`, `money`, `title`, `chapter` |
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
- `set`: `office`, `boardroom`, `tradingFloor`, `bankExterior`, `towerNight`, `streetDay`, `home`, `hall`, `courtroom`, `factory`, `studioNews`.
  Options go in `setOpts`:
  - `office`: `{chart, hour}`
  - `boardroom` / `studioNews`: `{screen, headline}`
  - `bankExterior` / `towerNight`: `{name}`; `towerNight` also takes `{darkFrom, darkTo}` (seconds over which the windows go dark)
  - `streetDay`: `{signs: [a, b, c]}`
  - `home`: `{tvContent}`
  - `courtroom`: `{judge}`
- `chars[]`: `who` (a cast key, see below), `spot` (`left`, `center`, `right`, `farLeft`, `farRight`), `mood`, `pose`, `poseOn`,
  `mood2` + `mood2On` (change of expression), `pose2` + `pose2On` (second gesture), `holding` (`phone`, `paper`, `money`, `mic`,
  `briefcase`, `sign`), `carry: "box"`, `walk: "in"|"out"`.
- `frame`: `wide` (default) or `close` (head and shoulders of `focus` or `speaker`).
- `speaker` + `line`: a speech bubble that types out while the mouth moves. `speaking: true` gives mouth movement only (narrated or reported speech).
- **Moods:** `neutral`, `confident`, `smug`, `happy`, `excited`, `worried`, `sad`, `angry`, `shocked`, `sleepy`.
- **Poses:** `idle`, `pointLeft`, `pointRight`, `pointUp`, `present`, `presentLeft`, `shrug`, `armsUp`, `hips`, `think`, `wave`.

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
Up to 5 stops. The spark reaches each stop on its word.

### `map`: real geography
```json
{ "template": "map", "vo": "...", "view": { "center": [-40, 45], "zoom": 2.2,
  "highlight": { "United States of America": "#4f6f8f" }, "cities": [ { "name": "New York", "lon": -74, "lat": 40.7, "on": "york" } ],
  "arrows": [ { "from": [-74, 40.7], "to": [-0.1, 51.5], "on": "london", "label": "CONTAGION" } ] } }
```
See the top of `lib/maps.js` for every option.

### `money`: money graphics (`lib/money.js`)
```json
{ "template": "money", "vo": "...", "items": [ { "kind": "cashStack", "args": [640, 560, 260, "$t", "$at"], "on": "billion" } ] }
```
`"$t"` is replaced with the shot time, and `"$at"` with the item's cue time.

### `title` and `chapter`
```json
{ "template": "title", "vo": "So why didn't anyone?", "text": "WHY THE [2008 CRASH] WAS COMPLETELY AVOIDABLE", "set": "towerNight" }
{ "template": "chapter", "label": "Part One", "sub": "Cheap Money", "dur": 2 }
```
Words in `[brackets]` turn gold. Keep the `vo` on a title short (under 5s).

## Cast (`who`)
**Built in:**
- Money and business: `banker`, `oldBanker`, `robberBaron`, `ceo`, `founder`, `founderTurtle`, `investor`, `trader`, `analyst`
- Officials: `regulator`, `regulatorWoman`, `politician`, `judge`, `reporter`
- Ordinary people: `homeowner`, `homeownerWoman`, `worker`, `child`, `elderly`, `elderlyWoman`, `crowdA`, `crowdB`, `crowdC`

**Named people** go in the episode's `cast`, built from a base plus one or two signature features:
```json
"cast": { "musk": { "base": "founder", "hair": "side", "hairColor": "#3a2d25" } }
```
- Hair: `slick`, `side`, `bald`, `bob`, `curly`, `bun`, `long`, `spiky`, `ponytail`
- Extras: `glasses`, `moustache` (`brush`, `walrus`, `thin`), `hat` (`tophat`, `fedora`, `cap`), `cigar`, `pin`, `badge`, `lanyard`
- Outfits: `suit`, `shirt`, `dress`, `coat`, `hoodie`, `turtleneck`, `vest`, `robe`, `overalls`
- Colours: `suit`, `shirt`, `tie`, `hairColor`

## Pacing rules (checked by `node render.js episodes/<ep> --plan`)
- Shots about 3.5s (8–11 words of narration). Split anything over 8s, except `fuse`, `chart` and `map`, which can run to ~13s.
- Something must happen every 1–1.5s: a sticker, a pose, an expression change, a bubble, a stat.
  The checker warns when nothing happens for more than 4s.
- Cut wide → close on the same set to keep the pace up.
- Keep title cards short. Use chapter cards (`dur: 2`) between parts.
