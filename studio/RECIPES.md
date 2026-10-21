# Recipes: the visual vocabulary

**Use this to turn any script into a shot list.** Every sentence in a script is one of the beat types below.
For each beat, pick one of its recipes, fill in the words, and move on. Rotate recipes so the same visual
never repeats three times in a row (the validator warns about that).

How to use it:
1. Split the script into beats of 8–11 words (finance story beats ~3s; war ~3.5s).
2. Label each beat with a type (A–P below).
3. Pick a recipe for that type. Prefer one not used in the last two beats.
4. Put at least one cue on a spoken word in every beat: a sticker, pose, expression, stat, or line.
5. Check with `node render.js episodes/<ep> --plan`, then look at the `--sheet`.

The recipes are written as `shots.json` entries; `"vo"` is always the beat's narration. Fields are explained in `SHOTS.md`.

**Every recipe works in every video.** History and finance share ONE style. The `"style"` preset only changes defaults
(and every shot can override them). Tags just say where a recipe came from: **F** = first measured on money videos, **W** = on
history/war videos. Use whichever illustrates the sentence best: a social post works in a 1929 story, and the fuse works in a crypto story.

---

## A. Introduce a person
1. **Name + arrow on a set (F):** the person on a fitting set, with a handwritten name and an arrow on their first appearance.
   `{ "template": "talk", "set": "office", "chars": [{ "who": "ceo", "spot": "center", "mood": "confident", "pose": "present", "poseOn": "<word>" }], "nameArrow": { "who": "ceo", "text": "Dick Fuld", "on": "<name>" } }`
2. **Name plate (W):** the same, with `"plate": { "name": "...", "role": "...", "on": "<name>" }`.
3. **Portrait row:** when several people are introduced together.
   `{ "template": "diagram", "kind": "portraits", "title": "The people behind it", "people": [{ "who": "founder", "label": "FOUNDER", "sub": "ex-Google", "on": "<word>" }] }`
4. **Close-up with an expression change** on a telling word: `"frame": "close"`, `"mood": "neutral"`, `"mood2": "smug"`, `"mood2On": "<word>"`.

## B. Introduce a company, product or app
1. **Exterior with a sign:** `{ "template": "talk", "set": "bankExterior", "setOpts": { "name": "LEHMAN BROTHERS" }, "tag": "New York, 1850", "chars": [...] }`. For an office tower, use `towerNight` with `setOpts.name`.
2. **App page (F):** `{ "template": "screen", "kind": "appPage", "name": "ChatBot", "emblem": "C", "rating": 4.7, "rank": "#1 FREE", "downloads": "100M+", "on": "<word>" }`
3. **Browser or press article:** `{ "template": "screen", "kind": "browserArticle", "site": "...", "headline": "...", "highlight": "<phrase>", "highlightOn": "<word>" }`
4. **Social post announcing it:** `{ "template": "screen", "kind": "socialPost", "name": "...", "handle": "...", "text": "...", "likes": 48000, "likesOn": "<word>" }`

Never draw real logos. Companies are lettered emblems (`emblem: "G"`) plus their name in our fonts.

## C. Big number or sum of money
1. **Count-up (F):** `{ "template": "data", "kind": "countUp", "value": 613000000000, "prefix": "$", "caption": "IN DEBT" }`.
   War style: `{ "template": "stat", "value": 613, "prefix": "$", "suffix": "B", "caption": "IN DEBT", "on": "<word>" }`
2. **Cheque (F):** for money changing hands: `{ "template": "data", "kind": "cheque", "payer": "...", "payee": "...", "amount": "$2,750,000,000", "signOn": "<word>" }`
3. **Cash pile with a person:** `{ "template": "money", "items": [{ "kind": "cashStack", "args": [640, 600, 300, "$t", "$at"], "on": "<word>" }], "stickers": [...] }`
4. **Stamp on a document:** for debts, fines and settlements (see J).

## D. Comparison or two sides
1. **Winners vs losers cards (F):** `{ "template": "data", "kind": "winnersLosers", "left": { "title": "...", "items": [...], "trend": "up", "caption": "..." }, "right": { ..., "trend": "down" }, "verdictOn": "<word>" }`
2. **Versus split:** `{ "template": "versus", "left": { "who": "banker", "label": "WALL STREET", "mood": "smug" }, "right": { "who": "homeowner", "label": "MAIN STREET", "mood": "sad" } }`
3. **Slide-in split panels (F):** `{ "template": "diagram", "kind": "split", "panels": [{ "label": "2007", "shot": { ...any shot... }, "on": "<word>" }, { "label": "2008", "shot": {...}, "on": "<word>" }] }`
4. **Ranking board:** for "the biggest", "top five", league tables: `{ "template": "data", "kind": "rankingBoard", "title": "...", "rows": [{ "label": "...", "value": 10, "emblem": "A" }], "unit": "$B" }`

## E. Cause and effect, or a chain of events
1. **The fuse (house device):** a timeline of missed chances. `{ "template": "fuse", "stops": [{ "year": "2003", "title": "...", "lines": ["..."], "on": "2003" }], "end": { "label": "...", "on": "<word>" } }`
2. **Equation (F):** `{ "template": "diagram", "kind": "equation", "title": "...", "terms": [{ "label": "CHEAP MONEY", "icon": "cash", "on": "cheap" }, { "label": "HYPE", "icon": "rocket", "on": "hype" }], "ops": ["+", "="], "result": { "label": "BUBBLE", "on": "bubble" } }`
3. **Feedback loop or flywheel (F):** `{ "template": "diagram", "kind": "loop", "title": "...", "center": "repeat", "nodes": [{ "label": "...", "icon": "chartUp", "on": "<word>" }] }`
4. **Map with arrows (W):** for anything that spreads across places: `{ "template": "map", "view": { "fit": ["United States of America", "United Kingdom"], "arrows": [{ "from": [-74, 40.7], "to": [-0.1, 51.5], "on": "<word>", "label": "PANIC" }] } }`

## F. A date or time jump
1. **Calendar flip (F):** `{ "template": "data", "kind": "calendarFlip", "from": "MARCH 2007", "to": "SEPT 2008" }`
2. **Establishing exterior with a caption:** any `talk` on an exterior set with `"tag": "New York, 2008"`. Finance shows it as a handwritten corner caption; war as a taped tag.
3. **Black card (F):** for "Two years later…": `{ "template": "card", "text": "Two years later." }`

## G. Dialogue or a quote
1. **Floating line (F):** `{ "template": "talk", "set": "...", "chars": [...], "speaker": "ceo", "line": "Is it bad?", "lineOn": "is" }`. Finance draws a handwritten floating line; war draws a bubble.
2. **Conversation, cutting to whoever speaks:** `"frame": "reverse"`, `"lines": [{ "who": "ceo", "text": "Is it bad?", "on": "is" }, { "who": "trader", "text": "Worse.", "on": "worse" }]`
3. **Speech bubble for emphasis:** add `"bubble": true`.
4. **Group chat or text message (F):** `{ "template": "screen", "kind": "chatThread", "title": "Family", "messages": [{ "from": "right", "text": "...", "on": "<word>" }] }`

Quotes from real people must be real and sourced in SCRIPT.md. Otherwise paraphrase, and make it clear on screen.

## H. How something works
1. **Equation** (E2), **loop** (E3), or **funnel (F):** `{ "template": "diagram", "kind": "funnel", "title": "...", "stages": [{ "label": "RAISED", "value": 7300000000, "prefix": "$", "on": "<word>" }] }`
2. **Org tree (F):** for who owns, funds or controls whom: `{ "template": "diagram", "kind": "orgTree", "root": { "label": "...", "who": "ceo" }, "children": [{ "label": "...", "emblem": "BT" }] }`
3. **Steps notebook (F):** `{ "template": "diagram", "kind": "steps", "style": "book", "title": "The playbook", "steps": [{ "label": "Buy the picks and shovels", "on": "<word>" }] }`
4. **Document with highlight (W):** see J.

## I. A list of things
1. **Sticky notes (F):** `{ "template": "diagram", "kind": "steps", "style": "notes", ... }`
2. **Index cards on the fuse board:** a `fuse` with up to 5 stops.
3. **Ranking board** (D4).

## J. A document or record
1. **Document with highlighter and stamp:** `{ "template": "document", "lines": ["...", "..."], "highlight": "<text>", "highlightOn": "<word>", "stamp": { "text": "...", "on": "<word>" }, "pencil": "<text>", "pencilOn": "<word>" }`
2. **Browser article with a highlighted phrase (F)** (B3).
3. **Terminal or code (F),** for tech stories: `{ "template": "screen", "kind": "terminal", "lines": [{ "text": "> run model", "on": "<word>" }] }`

## K. Data moving over time
1. **Stock chart with timeframe tabs (F):** `{ "template": "data", "kind": "stockChart", "name": "...", "ticker": "...", "data": [[1, 17], [24, 483]], "activeTab": "1M", "price": 483, "change": "+2,700%", "on": "<word>" }`
2. **Rise and fall line chart:** `{ "template": "chart", "data": [...], "turn": 2006.5, "turnLabel": "PEAK", "fallOn": "<word>", "change": { "text": "−27%", "on": "<word>" } }`
3. **Count-up** (C1), or a **ticker chip** inside a montage.

## L. A reaction or consequence
1. **Close-up with a mood change:** `"frame": "close"`, `"mood": "neutral"`, `"mood2": "shocked"`, `"mood2On": "<word>"`
2. **Spotlight on a lone figure (F):** `"light": true` on a `talk` shot (a sad CEO alone, someone staring at a phone).
3. **Phone notification (F):** bad news arriving: `{ "template": "screen", "kind": "phoneNotification", "app": "Brokerage", "title": "Margin call", "body": "...", "urgent": true, "on": "<word>" }`
4. **Walk out with a box:** `"chars": [{ "who": "banker", "carry": "box", "walk": "out", "mood": "sad" }]` on `towerNight` or `streetDay`.

## M. A pivot sentence, punchline or question to the viewer
1. **Black card (F):** about 1 in every 10–12 shots: `{ "template": "card", "text": "But nobody was asking the obvious question." }`
2. **Title card (W):** for the episode title only.
3. **Host aside:** the host on a set saying the line (see "The host" below).

## N. News, hype or public reaction
1. **TV news, live (F):** `{ "template": "screen", "kind": "newsLive", "channel": "MN", "headline": "...", "ticker": "...", "anchor": "reporter" }`
2. **Social post (F)** (B4), with likes counting up on a word.
3. **News studio set:** `{ "template": "talk", "set": "studioNews", "setOpts": { "headline": "..." }, "chars": [{ "who": "reporter", "spot": "center" }], "speaking": true }`
4. **Hearing room:** officials grilling someone: `set: "hall"`.

## O. Metaphor or analogy (about once every 1–2 minutes)
Build it from labelled props on a set. For example:
- "Picks and shovels": a `worker` on `factory`, with stickers PICKS and SHOVELS.
- "A house of cards": stacked index cards.
- "The music stopped": a crowd on `hall`.

When a metaphor needs a prop that doesn't exist yet, add the prop to `lib/props.js` (see PLAYBOOK, "When something is missing").

## P. Cold open, chapters, ending
- **Cold open (F):** a flash montage, 6–10 frames (`{ "template": "diagram", "kind": "montage", "frames": [{ "shot": {...} }, ...] }`), then a headline or document, then the hook line on a black card.
- **Cold open (W):** a date tag on one exact moment, the myth, then the device.
- **Chapters:** `{ "template": "chapter", "label": "The Squeeze", "sub": "part one", "dur": 2 }`, every 4–5 minutes, named with a story phrase.
- **Ending:** a quote card (`card` with the quote and source), then the subscribe line.

---

## Q. A clip of someone else talking (interview audio, a TV clip, an archive quote)
The narration sometimes cuts to another voice: a trader, a reporter, a politician.
1. **TV clip:** `{ "t":"screen","k":"newsLive","channel":"MN","headline":"...","anchor":"reporter" }`. The anchor's mouth moves.
2. **Interview on a set:** `talk` with `"speaking": true` on the speaker, plus a `plate` (name + role) or `arrow` on first appearance,
   and the tag `"ARCHIVE"` or a date.
3. **Podcast:** the `podcast` set with two people and `"speaking": true`.
Show the speaker's real words only (the clip is the narration). Keep it to the clip's own beats.

## R. Disputed accounts (two parties tell it differently)
1. **Versus:** `{ "t":"versus","left":{ "who":"leo","label":"HIS VERSION" },"right":{ "label":"THEIR VERSION","who":"ceo" } }`
2. **Document vs document:** a `diagram:split` with two `document` shots and labels.
3. **Stamps:** `"stamp": { "text": "DISPUTED", "color": "ink" }` on the shot. Never pick a side the narration doesn't.

## People: who gets a face
- **Recurring people** (2+ appearances): a header `cast` entry with 1–2 signature features.
- **One-off named people:** no face. Use a name card (`portraits` with `emblem`/initials), a `plate`, or their name on a document or screen.
- **Not yet revealed:** the `unknown` silhouette.
- **Perpetrators of atrocities** (terrorists, mass killers): names on documents only. No cartoon faces.

## The host
The host (`"who": "host"`) works in **any** preset. She is an **occasional** recurring character, not a presenter on every shot
(a handful of appearances per episode, e.g. on the narrator's "we"/"let's" lines).
She appears now and then: as an aside (M3), introducing a breakdown ("Let's break it down"), or as one of the people
in an explanation (for example, a portrait in a `portraits` row, or a character in a `talk` scene). Most beats use the regular cast.

## Staging: draw the moment, not a recipe (the most important section)
The reference videos feel hand-made because almost every beat is **its own little scene**: people do something, to someone,
somewhere specific. A recipe filled with new text (another countUp, another person standing front-on) is what makes a
video feel templated. Before writing a beat, ask: *what is happening in this sentence, and who is doing it?* Then stage it.
- **People act.** Sit them (`"sit":true`), turn them toward each other (`"turn":0.7` / `-0.7`, or `"turn2"` + `"turnOn"` to
  turn on a word), give them an action pose: `give`/`giveLeft` (+ `holding`), `typing`, `phoneEar` (+ `holding:"phone"`),
  `facepalm`, `headInHands`, `armsCrossed`, `explain`, `shrug`, `think`, walk in/out.
- **Vary the camera on people:** wide two-shot facing each other; close-up turned three-quarter; **over the shoulder**
  (`"f":"o"`, `"over":"who"`: the listener's back big in the foreground, the speaker beyond); a full set for a place.
- **Make the object the subject:** the email being typed, the paper handed over, the phone ringing on the desk (`compose`
  with a set as `bg` and props + people placed by hand).
- **One-off ideas beat reused graphics.** About 1 beat in 4 should be a scene you designed for that sentence (a compose
  with people and props), not a kit graphic.
- **Keep it fresh to the end.** The first minutes always look good because everything is new; the risk is minute 15 to 35.
  Every 3 minutes should debut ~6 looks never shown before (`--plan` warns), stickers stay under ~35% of shots, and a
  recurring device (the fuse, the ledger) comes back as a deliberate callback, not as the default.
- **Limits `--plan` enforces** (warnings): any one graphic kind ~2% of shots (min 5; e.g. 10 for a 500-shot video), any one
  set ~5% of shots (min 8), and at most 35% of people shots may be one person facing the camera doing nothing.

## Rhythm: busy vs simple (balance, never empty)
The reference videos alternate **busy, information-rich scenes** (a set with several people, a montage, a map with arrows,
a diagram building up) with **simple scenes that are easy to follow**: one big number, one key phrase, a black card, a clean
close-up with a single sticker. Simple is not empty: it's one clear idea, big, with nothing competing.
- **Every cut lands on something.** Graphics are already in at the cut (the templates do this): the screen, card, chart frame
  or first build element is on screen within 0.2s, and the cue word drives the key moment (the count landing, the send, the
  stamp, the next node), not the whole graphic's arrival. `--qa` flags a shot that opens on an almost empty frame, or holds
  one mid-shot. Fix it by cueing earlier, adding a caption/sticker, or picking a fuller recipe. One small object on a big board
  is not a simple shot, it's an empty one: make the object big, or pair it with its number or phrase.
- Give **key information a simple shot so it lands**: the big number (`data:countUp`, `stat`), the key phrase (`card`, or a close-up with ONE sticker), the date (`data:calendarFlip`).
- Aim for **~25–35% simple shots**. Never put 5+ busy shots in a row, and never 4+ simple shots in a row.
- After a busy build (diagram, map, montage), the next beat is usually simple. After 2–3 simple beats, open up again.
- `--plan` prints the rhythm (simple / medium / busy) and warns when the balance is off.

## Rotation rules (any preset)
- **Black cards** suit both presets: about 1 per 10–12 shots (finance) or 1 per 12–15 (history), on pivot lines.
- **House formats are a default, not a rule.** "Why X Was COMPLETELY Avoidable" and the fuse fit "avoidable disaster" stories.
  For a biography, a mystery or a debate, use the story's own shape (its own title format, a different device:
  the `case` template, a `data:ledger`, a `balanceScale` in `compose`).

## Kit limits (so nothing gets cut off)
| Kit | Limit |
|---|---|
| `fuse` | stops: 5 max |
| `diagram:steps` | notes: up to 8 (2 rows); book: 4 |
| `diagram:portraits` | 5 people |
| `diagram:orgTree` | 2 levels, 6 leaves |
| `diagram:loop` | 3–5 nodes |
| `diagram:split` | 3 panels |
| `talk` | up to 5 people (spots); `carNight` 1, `podcast` 3, `pentagon` none |
| `case` | 6 cards |
| `data:ledger` | ~8 rows |
| `data:donut` | ~6 slices |
| `compose` `clipboard` | 10 signatures |
| stickers | 3 per shot, ~22 characters each |
Over a limit? Split the beat into two shots.

- Never three beats of the same recipe in a row. Change the set at least every three beats.
- Finance: a black card about every 10–12 shots, a metaphor every 1–2 minutes, the host at most every ~2 minutes.
- War: date tags on every place or time change, the fuse as the spine, chapter cards every 4–5 minutes.

## Sensitive topics (always)
- **Real tragedies** (terror attacks, disasters, war casualties): never depict the violence, impacts, injuries or victims.
  Show them through **news screens, maps, documents, calendars, skyline silhouettes, memorial imagery** (candles, a lit
  skyline, a flag at half-mast), and people's reactions (worried, sad), at a respectful pace. No jokes or comic metaphors
  on those beats.
- **Claims and theories** (conspiracies, accusations, rumours): frame them as claims, not facts. Use stickers like
  "THE CLAIM", "WHAT PEOPLE SAY", "THE THEORY", "THE EVIDENCE", or a `versus` of claim vs record. Social posts are illustrative.
  Mark them with a source line.
- **Hateful claims** (antisemitic, racist or religious conspiracy myths): name them as claims in plain text, debunked by
  the narration. Never use ethnic or religious symbols, stereotyped features or "evidence" visuals that make them look credible,
  and never give them a realistic broadcast look.
- **Maps on tragedy topics:** no arrows tracing the attackers' routes into targets. Use pins and neutral labels.
- **The fuse on tragedies:** its default end is a lit bomb, so don't use it. Use the `case` template, or the fuse with a
  card end and thread (`"endStyle":"card","rope":"thread"`).
- **Skylines and memorials:** `skylineWTC` with `towers:false` shows only absence (empty sky); the light beams only at night.
  Never add smoke, glow or damage to a set. Aircraft (`jet`) only in open sky, never near a building. A structural point is a
  `diagram:section` schematic, never a picture of the real building. Small places are a `map` with `city` (labelled illustrative).
- **Never the 'brush' (toothbrush) moustache on a generic character**, especially with a side parting or a peaked cap: it reads as
  a Hitler caricature. Use it only on the cast entry for that real person, when the story is about him.
- **Real people:** caricature only through the cast's signature features. Never show them doing something the narration
  doesn't say they did, and never put invented quotes in their mouths. Quotes on screen must be the narration's own words.
