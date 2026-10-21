# Crayon Capital analysis: inputs for the finance preset (one shared style; see STYLE-GUIDE.md)

**Sources measured**
- **c1:** "The Rise of Anthropic Explained Like You're 5" (17:50)
- **c2:** "The First Big Victim of the AI Bubble" (18:45)

Both are 720p at 30fps, video only (no audio). Numbers are in `crayon-metrics.json`.

**Limitation:** no narration was available. YouTube captions were blocked (bot check, HTTP 429), and the files have no audio.
So beat types are inferred from the visuals and on-screen text, and narration speed could not be measured.
Assume the same ~165 wpm as the war references until a voiced example is measured.

We keep **our own illustration engine**. This document is about *what they show, when, and how it moves*, not about copying their art.
No frames from these videos are stored in the repo.

---

## 1. Pacing

| | c1 (Anthropic) | c2 (AI bubble) | War refs (for comparison) |
|---|---|---|---|
| Cuts per minute | 17.2 | 10.5 | 10.6–18 |
| Median shot | **3.0s** | 5.2s | 2.8–4.1s |
| p10 / p90 | 1.6s / 5.8s | 2.0s / 9.8s | |
| First 60s | 27 cuts (incl. flash montage) | 9 cuts (one long counter build) | ~2× the body |
| Shots over 7s | 16 of 308 (16% of runtime) | 56 of 198 (**50% of runtime**) | rare |

- **Two modes.** Story stretches cut every ~3s, like c1. Explainer stretches use long **build shots** (8–15s) in which a new element
  lands every ~1.5–2.5s: boxes, arrows, equations, list rows, counters. Those shots also slide in side panels and pull back to reveal
  context, so the real visual-change rate is close to c1's even though the cut count is lower.
- **Cold-open flash montage (c1):** the company name over 9 different images at **0.3s each** (2.5s total). A typed keyword over
  alternating images at 0.3s ("ARTIFICIAL INTELLIGENCE") is reused later as an emphasis device.
- **Location persistence:** a set usually holds for 2–7 cuts: wide → close → reverse angle → wide. Conversations run as
  shot/reverse-shot over the shoulder (4–7 cuts, ~2.5–4s each).
- Cuts per minute stay steady through the body (13–21 in c1, 7–15 in c2). The last minute slows for the quote and subscribe outro.

## 2. Camera and motion
- **Mostly locked framing.** 72% (c1) and 86% (c2) of sampled shots have no measurable zoom, yet **81–86% of shots change
  continuously**: characters talk and gesture, text types, elements pop, panels slide. A frame is never static for long.
- **Push-ins:** 1.04–1.21× over a shot (~1.5–6%/s) on emotional or close beats, e.g. a lone figure in lamplight at ~5%/s.
- **Pull-back reveals** on build shots: a chart pulls back to a monitor, then to a desk with a person, or an org diagram widens out.
- Small pans; **no camera shake**.
- **Transitions:** mostly hard cuts. **Slide/push panels** (a second or third panel slides in from the right into a split screen) are common
  inside long shots. Occasional **fades through black**, especially around black cards and chapters.
- **Characters:** mouth flaps while speaking; one gesture per line; turns between shots rather than within them; walks are
  used for entrances and exits; blinking isn't noticeable. Reaction close-ups (head and shoulders) are frequent.
- **Objects:** pop-in, slide-in, count-up numbers (e.g. $5,714,111 → $500,000,000 on a cash pile), lines drawing on, a highlighter sweep
  over typed text, a cursor clicking a button, phone notifications dropping in.

## 3. Text
| Element | Look | Timing |
|---|---|---|
| **Floating dialogue** (most common) | italic handwritten line above the speaker's head with a small tick pointing at them; no bubble | typed fast; stays to the cut |
| Speech bubble | white rounded bubble, italic text | for emphatic or quoted lines |
| Thought cloud | cloud bubble | inner thoughts ("I'm famous!") |
| **Black narration card** | black frame, centred white italic script, ~5% of frame height | types at **~24–31 cps** (full in 1.3–2.0s), holds 0.5–2.4s; several lines can replace each other on one card |
| Chapter card | black, larger script title (~6% of frame height), story phrase ("The Kid Who Read The Future") | ~2s, about every 4–5 min |
| Place / date caption | handwritten italic in a corner ("1980s San Francisco", "Germany, 2001") | on establishing shots |
| Name label | handwritten name plus a curved arrow pointing at the person; or a desk name plate | on first appearance |
| Labels in scenes | handwritten caps on signs, boxes, banners ("WALL STREET", "THE DOOM LOOP") | pop |

**Free font look-alikes:**
- Script italic: **Caveat** or **Kalam**
- Caps labels: **Patrick Hand** (we already have it) or Gochi Hand
- UI mockups: a clean sans (Inter)

## 4. Colour and look
- **Saturation:** mean 0.21–0.24, more muted than the war refs (0.27).
- **Brightness:** mean 0.47.
- **Vignette:** very light (corners 0.88–0.96 of centre), against **0.6** in the war style.
- **Palette:** neutral greys (office walls, often a seamless curved backdrop), warm wood desks, teal/cyan glowing screens, navy data panels,
  white "UI" frames (5–10% of runtime is bright white UI or data frames). Red and green appear only for down/up and losses/gains. Gold is for money.
- **Drama:** spotlight pools (a figure in a cone of light on a dark stage), lamp-lit desks, a night city, and space for "big picture" beats.
- **Line work:** thick dark outlines, soft cel shading and gentle gradients, no grain or crayon texture.
- **Black frames:** 7–10% of runtime is black (narration cards, chapter cards, fades).

## 5. Characters
- **Construction is close to ours:** big round heads with dot eyes and simple brows, a line mouth (open when talking), bean torsos,
  thin legs, noodle arms, thick outline. Skin tones vary (cream, tan, brown).
- **Recognisable people** come from hair shape and colour, glasses, signature clothing, and **name plates or arrow labels**.
  The protagonist, for example, is curly brown hair + glasses + suit, and keeps that look through every era.
- **Life-story arcs:** the same person is shown as a child, a student and an adult, keeping their signature hair and glasses.
- **Companies are personified:** characters in suits with the company emblem as their head; robots stand in for AI products.
  For us: an emblem disc with **lettered initials**, never a real logo.
- **Scale:** wide shots put people at ~35–50% of frame height. Close-ups fill 60–80%.

## 6. Graphics catalogue
| Graphic | How it animates |
|---|---|
| Stock / line chart | line draws; red when falling, green when rising; timeframe tabs (1D 1W 1M 6M YTD 1Y 5Y 10Y), the active one highlighted |
| Bar compare / winners vs losers cards | bars grow; two coloured cards side by side with ">" between |
| Ranking board / leaderboard | rows pop in one by one with amounts ("Largest trading losses") |
| Ticker card | name + "▼ −27%" chip pops |
| Donut chart | segments draw; a callout arrow with % |
| Big-number counter | digits roll up over a pile of cash or a chart (loss counter in the cold open) |
| Money | cash piles, a cheque handover with the amount, money bags, coins, money rain |
| Documents | newspaper headline with highlighter, research report with chart, letter, dismissal letter, CV, book cover, magazine cover |
| UI mockups | social post, phone notification ("MARGIN CALL / ADD MORE COLLATERAL"), app store page, browser, terminal, TV news with LIVE tag, chat app |
| Explainer diagram build | boxes + arrows + "+ / =" equations ($100 + $400 loan = $500 → +20% → $600); feedback loops (FALL → CALL → SELL); funnels; org trees of circle portraits with arrows |
| Circle portraits | round frame + caption plate ("FORMER CEO OF …"), used in org and investor diagrams |
| Checklists / rule boards | sandwich board or notebook; ticks or crosses pop per row |
| Calendar | desk flip calendar or wall calendar for date jumps |
| Metaphor scenes | gold rush with picks and shovels, a crystal ball, a block tower labelled SOFTWARE / MEMORY / DATA CENTERS / POWER, a "memory" gumball bowl, robots for AI models, a fire "DUMP" chart |
| Split screen | 2–3 panels with ink dividers, sliding in |
| Logos and wordmarks | full-screen name cards; logos as heads; logos on buildings. **We replace these with hand-lettered name cards and generic emblems** |

## 7. Beat → visual catalogue
Shares are estimates over ~240 viewed beats (c1 #0–59, #120–159, #230–249; c2 #0–79, #120–139, #150–169).

| Beat type (narration) | Share | Visual recipes (most → least common) | Typical length | What animates |
|---|---|---|---|---|
| Story action ("he spent his nights reading…") | 22% | (a) character in a set doing the action; (b) lone figure in a light pool; (c) object close-up (book, screen) | 2.5–4.5s | gesture, walk, light push-in |
| Quote / dialogue ("We'll call it this.") | 20% | (a) floating italic line over the speaker; (b) white bubble; (c) shot/reverse-shot over the shoulder; (d) thought cloud | 2–4s per line | typing, mouth flaps |
| Pivot / dramatic sentence ("Then comes the part that actually breaks him.") | 9% | black card, typed script text | 1.5–4.5s | typing; may chain lines |
| Data trend / ranking ("Its stock fell 27%.") | 10% | (a) line chart with tabs; (b) ticker chip; (c) ranking board; (d) winners vs losers cards | 3–15s (build) | line draw, rows pop, counters |
| Document / evidence ("a report claimed…") | 8% | (a) paper close-up with highlighter; (b) headline; (c) letter on a desk | 2–7s | highlight sweep, slow push |
| Place / time jump ("In June 2024…", "1980s San Francisco") | 8% | (a) exterior + corner caption; (b) flip calendar; (c) campus or city aerial | 2–4s | caption types |
| Product / company / social ("Then ChatGPT launched.") | 7% | (a) social post; (b) app store or browser; (c) TV news LIVE; (d) name card | 3–5s | UI pops, cursor |
| How it works ("You put in $100, borrow $400…") | 6% | equation boxes; loop diagram; funnel; org circles | 8–15s | element per 1.5–2.5s, pull-back |
| Metaphor ("It was a gold rush.") | 6% | a staged scene with labelled props | 3–7s | prop pops, labels |
| Two things at once / contrast | 6% | 2–3 panel split, sliding in | 3–11s | panel slides |
| Reaction ("He couldn't believe it.") | 5% | head-and-shoulders close-up, expression change | 1.5–3s | expression |
| Big money ("$500 million") | 4% | cash pile count-up; cheque handover; money bags | 3–10s | count-up |
| Emphasis keyword / cold-open hype | 3% | flash montage at 0.3s per image, with a typed keyword | 2.5–4s | cuts |
| Chapter start | 2% | black chapter card | ~2s | fade |

## 8. Sponsor segments
One block per video, about 40–50s, placed between 4:40 and 6:40. The structure:
1. A character hits the problem.
2. Screen recordings of the product, with brand-colour captions, then pricing cards.
3. A black card with the call to action, a URL typed into a search bar, a coupon card, a mascot card.
4. A black card: "Okay, back to the video."

We won't copy it, but our templates should support a **screen-recording slot** and an **"Okay, back to the video" card**.

**Outro:** a quote card (a portrait plus a typed quote with attribution), then a "Subscribe" black card (~8s).

---

## Comparison: FINANCE (Crayon) vs WAR/HISTORY (Two Sides / War Unspun)
| | Finance (Crayon) | War/History (our current defaults) |
|---|---|---|
| Median shot | 3.0s (story), plus 8–15s build shots | 3.5s |
| Camera | locked + push-ins 1.5–6%/s + pull-back reveals | locked + 1.1%/s creep / 4.5%/s punch |
| Transitions | hard cuts + slide-in panels + fades at cards | hard cuts only |
| Dialogue | floating italic lines (most), bubbles (some) | bubbles |
| Narration cards | black cards with typed script lines (~9% of beats) | none (date tags + stickers instead) |
| Chapter cards | black, script, story phrase, every 4–5 min | black, serif small caps, 2s |
| Place / time | corner caption, flip calendar | taped date tag top-left |
| Vignette | light (0.9) | strong (0.6) |
| Palette | neutral greys, wood, teal screens, white UI, navy data | sage, khaki, paper, night blue |
| Accent use | red/green = down/up; gold = money | red = danger, gold = highlight |
| Key graphics | charts with tabs, tickers, rankings, UI mockups, equation builds, money | maps, documents, stamps, devices (scale, ledger, fuse) |
| Characters | round heads, dot eyes; recognisable by hair, glasses, clothes; name plates or arrows; companies personified | same construction; date tags + name plates |

## Rules for our FINANCE pack
1. **Shot length:** median **3.0s** for story beats. Allow **8–15s build shots** for explainers, as long as an element lands every **1.5–2.5s**.
2. **Cold open:** 0–15s. A flash montage (8–10 images at **0.3s**) or a big-number counter, then a headline/document, then the hook line on a black card.
3. **Black narration cards** for pivot sentences, about **1 in every 10–12 shots**: centred white script, typed at **~28 cps**, hold **0.5–2.5s** after typing.
   Lines may replace each other on the same card.
4. **Chapter cards:** black, script title ~6% of frame height, **2.0s**, every **4–5 min**, titled with a story phrase.
5. **Dialogue defaults to a floating italic line** above the speaker, with a tick pointing at them, typed at ~30 cps. Use bubbles for emphatic or quoted lines,
   and thought clouds for inner thoughts. Conversations run as **shot/reverse-shot over the shoulder**, 2.5–4s per line.
6. **The host and recurring people** are fixed by signature hair, glasses and outfit. On first appearance they get a **handwritten name + curved arrow** or a desk name plate.
7. **Camera:** locked by default. **Push-in 1.5–5%/s** on emotional or close beats. **Pull-back reveals** (×0.85–0.9 over 2–3s) to end build shots. Never shake.
8. **Transitions:** hard cuts. **Slide-in split panels** (0.35s) for "meanwhile" or comparisons. **Fade through black** (0.3s) only into and out of black cards and chapter cards.
9. **Look:** neutral grey/wood/teal palette, saturation ~0.22, **light vignette** (corners ~0.9), spotlight pools for drama, no grain.
10. **Data:** line chart with **timeframe tabs**, red when falling and green when rising; **ticker chip** (▼ −27%); **ranking board**; **winners vs losers** cards;
    **count-up numbers** everywhere money appears.
11. **UI mockup kit:** social post, phone notification, browser, app page, TV news LIVE, terminal. Drawn simplified, **with no real logos**:
    use lettered emblems and name cards.
12. **Explainer builds:** equation boxes (A + B = C → %), loops, funnels, org trees of circle portraits, each element on its narration word.
13. **Place and time:** an establishing exterior with a corner script caption ("New York, 2008"), or a flip calendar for date jumps.
14. **Metaphor scene** about every 1–2 minutes, built from labelled props.
15. **Structure:** cold open (~30s) → title → chapters every 4–5 min → (sponsor slot after the first chapter) → quote card → subscribe card.
