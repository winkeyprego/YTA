# HANDOFF: start here

This file is the memory of the project. Any Claude session (cloud or desktop, any account) continuing
this work should read it first, then `CLAUDE.md`, then do the "Next steps" in order.
**Update this file at the end of every working session.**

_Last updated: 2026-10-21 (cloud session): the per-story method is proven on two 3-minute samples; a blind test of the
written procedure is running. Read "Where we are" first._

## Where we are (read this first)
**What the owner wants:** a SYSTEM, not videos. Topic + script + voiceover in → a full documentary out, in the style of
Two Sides of War / War Unspun, that is clear, smooth, never empty, and above all **not templated**: every scene intentional,
something new to look at all the way through. Low usage and time per video. Finance (Crayon Capital topics) and
history/war, one interchangeable style.

**What we learned the hard way (don't repeat it):**
1. A library + recipes alone produce a video that looks fine for 10 minutes and then **recycles the same ~80 looks** for
   the next 27 (measured: 32 new looks in the first 60 shots, then 2-6 per 60 shots). The owner called it "the same shit
   for 27 minutes". Checks for errors and timing don't catch that.
2. What fixed it (two samples the owner liked, "a lot better", "pretty decently planned with novelty"):
   - a **director pass** that writes a scene plan per beat before any storyboard line;
   - a **story device** built for this story that returns and builds (the pipes; the extrapolated trend line);
   - **story-specific pieces** built per video (places, objects, costumes): one lean builder agent;
   - **staged people** (turns, sitting, over-the-shoulder, handing things over), not people standing front-on;
   - **clips/quotes of other people in the news look**, big clear text, few stickers;
   - checks that enforce it: `--plan` freshness (~6 new looks per 3 min), repetition caps, sticker share, staging share;
     `--qa` empty openings, small/busy-background text, faces covered.
   All of this is in `.claude/skills/make-video/SKILL.md` (steps 4, 5, 8), `RECIPES.md` ("Staging", "Keep it fresh"),
   and the checks. **Follow the skill exactly.**
3. Eight parallel writers for one video was far too expensive (~300k tokens each). Use: you (director + writer) + ONE
   builder agent for the story's pieces. Render cost is negligible (CPU time only).

**The owner's latest feedback on the samples (to act on):**
- Keep the news-live look for clips and interviews (done: RECIPES Q default).
- Name labels pointed at the air or the wrong person (fixed: `arrow` targets the named person; `>who` forces it).
- The added nose looked unnatural (removed).
- Still lacking (owner agreed): (a) characters need bigger, readable ACTIONS (slam a desk, run, collapse in a chair,
  handshake, pointing at each other); (b) placeholder data ("FUND B") reads fake; use real numbers or another picture;
  (c) pacing ~4.2s/shot vs ~3.3 target; (d) "simple" shots need one extra touch (a hand stamping, a push on the key line);
  (e) transitions are all hard cuts (try a pan/zoom carried across a cut at chapter turns). Sound is for later.
- Real people: **draw a likeness, don't paste photos** (rights, style, YouTube reuse). Likeness features now exist
  (face shapes, brows, hair styles, age lines, glasses shapes); procedure in SHOTS.md "Likeness".

**Blind test #1 (done, 2026-10-21):** a fresh agent with only the repo made a middle 3 minutes of the Soviets voiceover
by following the skill. Result: clearly on-method (own device that builds, story-specific places, staged scenes, clean
checks). Gaps it exposed, now in the skill: device and sets repeated too often within 3 minutes, a few plain frames, small
people in some wides, transcript ending silently dropped, compose/montage timing undocumented. **Next: blind test #2**
on another random stretch to confirm the fixes.

**How a blind test works:** A fresh agent with only the repo makes 3 minutes from a middle stretch of
the private Soviets voiceover (owner's local copy; not in the repo) by following the skill. Compare it with the samples;
everything it gets wrong is something missing from the docs: fix the docs/skill, then repeat on another random stretch.
Its notes and output were in the cloud session's scratchpad (`episodes/blind-soviets/`), which may be gone; if so, rerun:
cut any 3 minutes of a voiceover, give a fresh agent the one-paragraph brief "make a video from this voiceover with the
studio; follow the make-video skill", and compare.

**Private test material (never commit, never publish):** the owner's MP3s (Ozempic, "24-Year-Old Genius", "9/11 Inside
Job", "Soviets Alone") and every storyboard/render made from them. The owner has the MP3s and a zip of the storyboards.


## The goal (in the owner's words, summarised)
Build faceless YouTube documentaries about **money, companies, scams and crashes, and history/war** (the topics of
[@Crayon_Capital](https://www.youtube.com/@Crayon_Capital)), animated in the **style** of
[@TwoSidesOfWar](https://www.youtube.com/@TwoSidesOfWar) and [@WarUnspun](https://www.youtube.com/@WarUnspun),
and **automate as much as possible with Claude**: script in → finished video out.
We copy the *style rules*, never their videos, art, audio or scripts.

The owner is not a developer. Explain things step by step in plain words, and show results as images or video.

## Decisions made so far
- **Format:** their "myth vs the documents" format on money topics. Titles like
  "Why ___ Was COMPLETELY Avoidable", "Did ___ REALLY…?".
- **House device:** THE FUSE: a lit fuse burning along a timeline, with each stop a moment someone could have cut it (`lib/devices.js`).
- **Everything is drawn in code** (SVG → Chromium → ffmpeg). No image generator, no hand animation.
- **Fonts:** Lilita One, Patrick Hand, Special Elite, Cormorant SC (open licences, in `fonts/`).
- **Style numbers were measured from the reference videos** and are the lib defaults
  (`docs/REFERENCE-ANALYSIS.md`, `STYLE-GUIDE.md`, `MOTION.md`).
- **Render output (`renders/`) is not committed.** Regenerate it with `node render.js …`.
- **ONE interchangeable style (owner's rule).** History and finance are not separate styles. Everything (characters, sets,
  templates, screens, data, diagrams, maps, the fuse) works in every video. `"style": "war" | "finance"` is only a preset of
  defaults (vignette, dialogue as bubble or handwritten line, tag look, chapter card look, camera, pacing numbers), and each shot
  can override any of them. The finance additions exist because some things (apps, markets, money, org charts) are better
  illustrated that way; use them wherever they fit, including in history videos.
- **Finance pack decisions** come from `docs/CRAYON-ANALYSIS.md` ("Rules for our FINANCE pack"). No real logos: lettered emblems instead.
- **The finance host** (`CAST.host`, `lib/host.js`, from the owner's illustration) is an occasional recurring character:
  she appears sometimes, as a shot or inside an explanation. She is NOT a presenter on every shot; most scenes use the
  regular cast, as in the history style. The owner chose the detailed "hero" head (`host`), lightly refined; a house-style
  twin, `hostHouse`, exists for crowd shots.
- **Validation:** `lib/validate.js` checks every shots.json before rendering (unknown names, typos with suggestions,
  cue words missing from the narration, long labels, repetition).
- **Copyright:** never commit reference frames or footage, or other channels' audio. The Ozempic MP3 the owner
  uploaded appears to be Crayon Capital's own narration (same title, same 12:41 length). It may be used **only as
  private test material** for VO timing, never in a published video, and it is not in the repo.

## Status: ready to make videos in two styles
| Piece | State |
|---|---|
| **Presets** `war` / `finance` (defaults only; everything interchangeable; per-shot overrides) | done (`lib/styles.js`) |
| Core templates: talk, versus, document, chart, stat, fuse, case, compose, map, money, title, chapter, card | done |
| Kits: screens (11), data (12), diagrams (9) | done (`lib/screens.js`, `lib/datakit.js`, `lib/diagrams.js`) |
| Finance dialogue: floating lines, conversations cutting to the speaker, spotlight, name + arrow, black cards | done |
| **Visual vocabulary:** beat type → recipes (`RECIPES.md`) | done |
| Finance host (`CAST.host`, from the owner's illustration) | done; occasional cast member |
| Library: ~42 cast (uniforms, jobs, silhouette, 6 skin tones), 33 sets (money world + history/places), ~45 compose props, money graphics, real maps + city plates + range rings | done |
| Validator (typos, unknown names, cue words, kit field names read from the kit headers, repetition) + pacing + rhythm | done; `--plan` |
| Layout QA (text overlaps, faces covered, off screen, **almost-empty frames**), per range | done; `--qa [--from --to]` |
| Long episodes: storyboard part files for parallel writers | done (STORYBOARD.md) |
| Voiceover → word timings → shot timing | done (`tools/transcribe.py`) |
| **Skills:** `make-video`, `add-to-library` (`.claude/skills/` at the repo root) | done |
| Starters: `finance-starter` (GameStop), `template-starter` (2008, war look) | done |
| Sound kit (music bed, sparse SFX, loudness) | **not yet**: add in an editor for now |

## How to make a video now
Use the **make-video** skill. In short: style → script → (voice → `words.json`) → `shots.json` from `RECIPES.md`
→ `node render.js episodes/<ep> --plan` (fix everything) → `--sheet 1 --scale 1` (look) → `node render.js episodes/<ep>`.

## Next steps (in order)
1. **Finish the blind test** (above) and fold its lessons into the skill/docs. Repeat once on another random stretch.
2. **Character actions** (the biggest visual gap): a small set of big readable actions with motion over time (stand up from
   a chair, slam a fist on a desk, run in/out, collapse into a chair, handshake, two people pointing at each other,
   throw papers), usable from `talk`/`compose` with a cue word. Test with a before/after clip.
3. **Validator: flag placeholder data** (labels like "FUND B", "COMPANY X") and push writers toward real numbers.
4. **Pacing:** aim ~3.3s (finance) / ~3.8s (war); split long beats on pauses (beats.js) and cue a second event in long shots.
5. **Transitions:** a camera move that carries across a cut (pan into the next room, zoom into a map) for chapter turns.
6. **Sound kit** when the owner picks a music source: a bed ~17 dB under the voice, sparse pops/whooshes, -14 LUFS.
7. Small bugs: see "Known issues" below.

## Known issues from the stress test (fix these next; each is small)
Eight writers storyboarded two full documentaries from the docs alone. Fixed already: kit field checks, empty-frame QA,
graphics on screen at the cut, follow camera for builds, rooms behind every graphic, per-part timing (`_t0`), cue matching
(`$`, `%`, endings), the `beat` alias, stat timing, rankingBoard labels, framing/sticker docs. Still open:
1. **One part's error blocks `--plan` for every part.** Errors should be grouped per file and the rest still checked.
2. **Stickers on non-talk shots land on content** (stat numbers, posts, notes). Give each kit a free-zone map like `talk`.
3. **Card length:** cards warn over 4s, so a one-sentence pivot card only fits a short beat; let a card's limit scale with its text.
4. **Average shot ~4.5s vs ~3.3s target:** the VO has long gaps between sentences; consider splitting a beat on a long pause.
5. **Small bugs:** `stockChart` text `change` ignores the data's direction; `calendarFlip` backwards shows "undefined";
   `card` text doesn't wrap; `document` highlight marks the first match, not the phrase position; `newsLive` always shows a
   red market zig-zag; `radar` `ghost` blips trip a field warning; `browserArticle` turns `site` into a fake domain;
   `split` crops its panels; `fuse` always burns to the end (no stop-at option); compose prop sizes vary a lot (document `s`).
6. **PLAN.md written before a library update goes stale:** the director should re-read NEEDS "LIBRARY UPDATE" before writers start.
7. QA reports for episodes outside the repo still go to `studio/renders/`; write them next to the episode instead.

## Open questions for the owner
- Voice: the owner will use ElevenLabs or another AI voice (decided). Music: Epidemic Sound or a local generator, later.
- First real episode topic and script? (Claude offered to write "Why the 2008 Crash Was COMPLETELY Avoidable".)

## How to resume

### On your own computer (Claude Desktop app → Code)
1. Get the project. Either:
   - download the zip Claude sent you and unzip it, **or**
   - on GitHub: repo `winkeyprego/yta`, branch `claude/awesome-rubin-m5w8ya` → **Code** → **Download ZIP**.
2. Install the tools once:
   - **Mac:** install [Homebrew](https://brew.sh), then run `brew install node ffmpeg python`.
   - **Windows:** install Node.js LTS from nodejs.org, Python from python.org, and ffmpeg (`winget install ffmpeg`).
3. Open the Claude Desktop app → **Code** → choose the unzipped folder.
4. Paste this as your first message:
   > Read `studio/HANDOFF.md` and `studio/CLAUDE.md`, set up the project (npm install in studio/,
   > npx playwright install chromium, pip install faster-whisper), render the sample to check it works,
   > then continue with the next steps in HANDOFF.md.

### In a Claude cloud session
The environment's **Network access → Allowed domains** needs:
`youtube.com`, `www.youtube.com`, `youtubei.googleapis.com`, `i.ytimg.com`, `*.googlevideo.com` (reference research),
`drive.google.com`, `drive.usercontent.google.com`, `*.googleusercontent.com` (owner uploads via Drive links),
`huggingface.co`, `*.huggingface.co`, `*.hf.co` (Whisper speech-to-text models), and
`api.elevenlabs.io` (only if the owner picks ElevenLabs).
Package managers (npm, PyPI) are allowed by default.

## Reference material (not in the repo; re-download if needed)
- Two Sides of War: "Why Operation Barbarossa Was COMPLETELY Avoidable" (QoQWBiujfkA),
  "What Was The REAL Turning Point of WW2?" (UOp68huRY_I)
- War Unspun: "What If America Had Nuked Germany Instead of Japan?" (L0P40aJ9lHM)
- Crayon Capital: topic and direction reference (top videos: Wolf of Wall Street, Great Depression, 2008 crisis).

## Session log
- **2026-10-21 (cloud), the method that works:** the 37-min finance test showed the real failure: after ~10 minutes it
  recycled ~80 looks (2-6 new looks per 4 minutes). Fixed in the system, then proven on two 3-minute samples (Soviets/WW2
  and the finance story): every beat planned as its own scene, a few story-specific pieces built per video (sets, props,
  costumes and one house device per story: the pipes, the extrapolated trend line), people staged (turns, sitting,
  over-the-shoulder, handing things over), text big and clear. `--plan` now enforces freshness (~6 new looks per 3 min),
  graphic and set repetition caps, the sticker share, and staging; `--qa` flags small or busy-background text, empty
  openings and unparseable frames. Cost stays low: one lean builder for the story's pieces plus one writer.
- **2026-10-21 (cloud), stress test:** two full-length private test VOs (a 37-min finance story, a 41-min 9/11-theories
  story) were run through the whole pipeline to find what's missing. Fresh "director" agents wrote PLAN.md + NEEDS.md from the
  docs alone; five library workers then built what they asked for (22 sets, uniforms and jobs, beards, skin tones, the
  `unknown` silhouette, 24 compose props, 10 kit kinds, `case`, `section`, map rings and city plates, redaction, stamps on any
  shot). The validator now reads kit field names from the kit file headers and `--qa` flags near-empty frames, the two
  silent failure modes the test exposed. Eight parallel writers then storyboarded both episodes from the docs (their
  FRICTION notes feed the next fixes). The test audio and storyboards stay private (scratchpad), never in the repo.
  Visual pass against the references: every graphic now sits in an illustrated room (lib/backdrops.js), cuts always land on
  content, diagram builds open tight and widen. The 37-min finance test (499 shots) passes --plan and --qa and was rendered
  in full; the owner has the storyboards as a zip (no audio).
- **2026-10-21 (cloud), final:** the owner confirmed the hero host (refined: hair shine, curled ends, lashes, lips, collar)
  and that history and finance must be ONE interchangeable style. The presets were reworked to be defaults only, with per-shot
  overrides; `episodes/test-mixed*` prove the mixing.
- **2026-10-21 (cloud), latest:** the owner wants a finance style next to the war style, their host character, more variety for
  any kind of script, and no rebuilding on the main account. Measured two Crayon Capital videos (`docs/CRAYON-ANALYSIS.md`).
  Built: style packs, finance dialogue and cards, the host, screens, data and diagram kits, RECIPES.md (beat → visual),
  the validator, the make-video and add-to-library skills, and finance-starter.
- **2026-10-21 (cloud), later:** the owner clarified that the deliverable is the TOOLKIT, so any script can become a video
  on their main account. Built: the shot templates, shots.json, voice timing (faster-whisper), the pacing checker, 11 sets,
  ~25 cast, money graphics, a real-map kit, SHOTS.md and PLAYBOOK.md, and a starter episode. Tested end-to-end on 90s of the
  private Ozempic test audio (kept out of the repo).
- **2026-10-20/21 (cloud):** researched the three channels; measured the style (pacing, camera, type, colour,
  sound); built the studio library and renderer; made sample clip v1, then v2 tuned to the measurements; wrote the
  style and motion guides. The owner pointed out the real need: **any script → video**. Next is the VO-timed,
  template-driven pipeline above. The owner uploaded an Ozempic MP3 (test only).
