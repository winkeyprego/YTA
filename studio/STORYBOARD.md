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
| `b` | beat(s) this shot covers | `"b":12` or `"b":"12-13"` |
| `who` | character(s): `name:spot:mood:pose`. Mood can change on a word (`smug>shocked@lost`); pose can land on a word (`present@genius`) | `"who":"sbf:center:smug>shocked@lost:present@genius"`, or a list for several people |
| `say` | the first character says a line (floating line or bubble per preset) | `"say":"We're fine.@fine"` |
| `talk` | a conversation; use with `"f":"r"` to cut to each speaker | `"talk":["ceo\|How bad?@bad","sbf\|Worse.@worse"]` |
| `st` | stickers on words; optional colour after a colon | `"st":["GENIUS@genius","$32 BILLION@billion:gold"]` |
| `arrow` | handwritten name + arrow on the first character | `"arrow":"Sam Bankman-Fried@sam"` |
| `f` | framing: `w` wide, `c` close, `r` conversation cuts | `"f":"c"` |
| `cam` | camera: `locked`, `creep`, `punch@word`, `push@word`, `steps` | `"cam":"punch@collapse"` |

Everything else is a normal `shots.json` field (see SHOTS.md) and passes straight through: `set`, `setOpts`, `tag`, `plate`,
`light`, `bubble`, `value`, `caption`, `on`, `view`, `stops`, kit fields, and so on.

**Cue words** (`@word`, `"on"`) must be words from that shot's beats. The validator stops you if not, and names the storyboard line.

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
