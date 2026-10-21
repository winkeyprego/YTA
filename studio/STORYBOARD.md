# Storyboard format (`storyboard.txt`)

The fast way to build a full-length episode. Instead of writing `shots.json` by hand, you:
1. run `node tools/beats.js episodes/<ep>`, which turns `words.json` into numbered beats (`beats.txt`: number, time, length, text, tags);
2. write `storyboard.txt`, one short line per shot that **refers to beat numbers** (never retype the narration);
3. render as usual. The compiler fills in the narration, checks every beat is used exactly once, expands the shorthands,
   adds framing/camera variety, and writes `shots.compiled.json` so you can inspect the result.

It's about 3× less writing than shots.json, and cue words can't mismatch the narration, because the narration comes from the transcript itself.

## Lines
- `# ...` is a comment. Use comments to mark acts and chapters.
- The first JSON line without `"t"` is the **header**: `{"style":"finance","cast":{...},"title":"...","audio":"vo.mp3"}`.
- Every other line is **one shot**: a JSON object with `"t"` (template) and usually `"b"` (beat number or range `"12-14"`).
  Shots without `"b"` (chapter cards) need `"dur"`, and the narration pauses for them.

## Shorthands
| Key | Means | Example |
|---|---|---|
| `t` / `k` | template / kind | `"t":"data","k":"countUp"` |
| `b` | beat(s) this shot covers (`"beat"` works too; use it when a kit has its own `b` field, like `dualChart`) | `"b":12` or `"b":"12-13"` |
| `who` | character(s): `name:spot:mood:pose`. Mood can change on a word (`smug>shocked@lost`); pose can land on a word (`present@genius`) | `"who":"sbf:center:smug>shocked@lost:present@genius"`, or a list for several people |
| `say` | the first character says a line (floating line or bubble per preset) | `"say":"We're fine.@fine"` |
| `talk` | a conversation; use with `"f":"r"` to cut to each speaker | `"talk":["ceo\|How bad?@bad","sbf\|Worse.@worse"]` |
| `st` | stickers on words; optional colour after a colon. Use the object form to place one: `{"text":"GENIUS","on":"genius","x":900,"y":160}` | `"st":["GENIUS@genius","$32 BILLION@billion:gold"]` |
| `arrow` | handwritten name + arrow on the first character | `"arrow":"Sam Bankman-Fried@sam"` |
| `f` | framing: `w` wide (people at medium size), `F` full set (shows signs, boards, screens), `c` close, `r` conversation cuts, `o` over the shoulder (with `"over":"who"`) | `"f":"c"` |
| `cam` | camera: `locked`, `creep`, `punch@word`, `push@word`, `steps` | `"cam":"punch@collapse"` |

Everything else is a normal `shots.json` field (see SHOTS.md) and passes straight through: `set`, `setOpts`, `tag`, `plate`,
`light`, `bubble`, `value`, `caption`, `on`, `view`, `stops`, kit fields, and so on.

**Cue words** (`@word`, `"on"`) must be words from that shot's beats. The validator stops you if not, and names the storyboard line.

## Part files (several writers at once)
A long episode can be written in parallel: `storyboard.txt` holds the **header** (and optionally the first shots), and part
files `storyboard.01.txt`, `storyboard.02.txt`, … hold **shots only**. They're read in name order after `storyboard.txt`.
A line without `"t"` in a part file is an error, so a part can never overwrite the cast. Messages name `file:line`.
The director validates the header alone with `--plan` ("header OK: no shots yet").

## PAUSE beats, chapter cards and the title
`beats.txt` marks long silences in the narration (music, title stings, act breaks) as `PAUSE` beats.
- A shot on a pause beat (`"b": 24`) **uses the existing silence**: nothing is added, and it runs until the next voiced beat.
  It has no words, so time things with `"at"` (seconds), not `@word`.
- **Several shots can share one pause.** Give every one except the last a `"dur"`. Example for a 9s pause at a chapter break:
  `{"b":218,"t":"chapter","label":"The Films","dur":2}` then `{"b":218,"t":"talk","set":"cinema",...}` (the rest of the pause).
- **Convention:** put the chapter card ON the pause beat at its chapter break (first, with `"dur": 2`), then an establishing
  shot or montage for the rest. Only use a beat-less chapter card (`{"t":"chapter","dur":2}`, which adds 2s of silence)
  where there's no pause.
- **The episode title** usually sits on the first long pause (the intro music): a `title` or a `diagram:montage` ending on a
  `title` frame. Don't hold one static title card for more than ~5s; split the pause (montage first, title last).

## People
- **Recurring people** (2+ appearances) go in the header `cast`. Every feature is checked (`--plan` names typos and
  suggests fixes). Colours may be palette names (`"navy"`, `"skin4"`) or hex.
- **One-off named people** don't get a face. Show their name (a `portraits` card with `emblem`/initials, a `plate`, an
  `arrow` on a generic or silhouette figure, a document or screen with the name), so a generic face never reads as a likeness.
- A person who stays **unrevealed** until later: the `unknown` silhouette cast.
- The `who` shorthand takes extra fields after `=`: `"leo:center:sad:idle:holding=phone,walk=out"`, and staging:
  `"leo:left:worried:typing:sit=true,turn=0.7"`. For anything else,
  use the long `"chars":[{...}]` form (the two can't be mixed in one line).

## Cue words and the transcript
- Cue on the words **as they appear in beats.txt** (that's the transcript). Matching ignores case and punctuation,
  tolerates endings (`huang` matches `Huang's`), and copes with odd splits: `"9-11"` matches `9 -11`, `"$4.5"` matches `$4 .5`.
- The transcript often **misspells names**. Show the **correct spelling on screen** (stickers, arrows, plates) but cue on
  the transcript's token. Better still, transcribe with `--names "Aschenbrenner, Tyler Cowen"` to get them right.
- A beat with dropped words is still fine: cue on a word that is there.
- Montage frames: give **all** frames a time (`at`/`on`) or **none** (then they're spread evenly). A mix is a warning.
- Episode folders can live anywhere: `node render.js /any/path/to/episode` works.

## Automatic variety
Talk shots that don't set `f` or `cam` vary by themselves: consecutive shots on the same set alternate wide and close,
and wide shots rotate between a slow creep, locked-off, and a punch-in. Set `f`/`cam` yourself whenever a beat needs something specific.

## Example
```
{"style":"finance","cast":{"sbf":{"base":"founder","hair":"curly","hairColor":"#2b2018"}}}
# --- cold open ---
{"b":1,"t":"diagram","k":"montage","frames":[{"shot":{"t":"screen","k":"socialPost","name":"FTX","text":"We're fine.","at":0}}]}
{"b":2,"t":"talk","set":"office","who":"sbf:center:smug:present@genius","arrow":"Sam Bankman-Fried@sam","tag":"Bahamas, 2022"}
{"b":"3-4","t":"data","k":"countUp","value":32000000000,"prefix":"$","caption":"FTX VALUATION"}
{"b":5,"t":"card","text":"Eight days later, it was gone."}
{"t":"chapter","label":"The Kid From MIT","sub":"part one","dur":2}
```
(Inside `frames` and `panels`, sub-shots use the long field names: `"template"`/`"kind"`, or `"t"`/`"k"`.)

## Checks (run every time)
```bash
node render.js episodes/<ep> --plan    # beat coverage, field errors, pacing (with storyboard line numbers)
node render.js episodes/<ep> --qa      # layout: text overlapping text or faces, text off screen
node render.js episodes/<ep> --sheet 2 --scale 1   # visual spot check of the whole thing
```
