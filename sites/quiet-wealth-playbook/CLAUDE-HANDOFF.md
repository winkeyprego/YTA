# Claude handoff: Alicia Invests website

Prepared 21 October 2026, Asia/Seoul. This document covers ONLY the Quiet Wealth Playbook website. It is not a handoff for video production, voice generation, media collection or the Aunt June channel.

## Start here

Continue the existing **edition 8** website. The owner likes its current direction and wants to continue developing the website with Claude. Do not restart from the original brief or an older edition by accident.

- Working folder on this Windows computer: `C:\FrameFact\App\sites\quiet-wealth-playbook`
- Local preview: <http://127.0.0.1:8893/?edition=8#hero>
- Ready-to-serve website: `dist/`
- Current source and artwork are included in the accompanying handoff ZIP.
- Other computers: extract the ZIP, open its `quiet-wealth-playbook` folder, and use the relative paths below. The localhost link works only on the computer running the preview server.

Read this file, `README.md`, `LAUNCH-CHECKLIST.md`, and the CURRENT section of `qa/REPORT.md`. Then inspect the desktop and mobile page before changing it. `BRIEF.md` and `ART-DIRECTION.md` contain useful history but include older instructions and rejected approaches. This handoff, the current implementation and the owner's latest feedback take precedence over those historical sections.

## Product and audience

- Brand: **Alicia Invests**, with Alicia as the familiar illustrated host.
- Product: **The Quiet Wealth Playbook**; slogan **The Boring Money System**.
- Current configured price: **$27 USD**. The configuration also retains an older $37 regular-price field; do not turn that into a fabricated discount or deadline.
- Audience in the original brief: US adults, roughly 30 to 60+, arriving mainly on phones from YouTube. Some feel stressed about money. The voice should be clear, warm, practical and free of shame or pressure.
- Commercial goal: sell the complete digital collection through a trustworthy, enjoyable explanation led by Alicia.

## The owner's design feedback, in order

1. The early page looked basic, cheap and insufficiently interactive. The owner wanted a very polished, aesthetic, premium website.
2. Use the **actual Alicia character**, not generic placeholders. They requested useful poses such as holding a workbook, a teacup, coins and notes, and a gentle shh gesture.
3. The page should feel alive while scrolling. Basic fades alone were not satisfying.
4. An experiment with separate moving head/body/arm pieces looked unnatural. The owner explicitly disliked the disconnected body parts. That rig was removed from the active page.
5. A later sales-focused rebuild made the offer clearer but removed too much of the enjoyable journey. The owner said it felt too salesy and insufficiently told by Alicia.
6. **Edition 8 restored the longer interactive experience**, keeping the clearer product explanation and honest labels. This is the current baseline.

Preserve that balance: a beautiful, guided conversation with Alicia and genuinely useful interactions, with an understandable offer. Do not shorten everything into a generic hard-sell landing page. Also avoid length made only of repetitive claims, decorative widgets or empty scrolling.

## Current visual and interaction direction

The active palette is warm paper `#faf7f1`, ivory `#fffdf9`, navy `#19273d`, ink `#1b293e`, muted gold `#755b36`, cream `#ecd4b5` and sage `#e7ece3`. Headings use local **Libre Caslon Display**; body copy uses local **DM Sans**.

Current features:

- First-person Alicia invitation; primary hero action is **Walk through it with me**. Buying remains available as a secondary opening action.
- Three-step sticky scroll conversation switching among complete Alicia illustrations.
- A clearly explained collection and expandable inventory of eleven resources.
- A usable three-cost worksheet with editable amounts, monthly/weekly/yearly frequencies, annual totals and selected-for-review totals.
- CSV export and a printable alternative.
- Three complete, readable website examples with standalone printable pages.
- A twelve-chapter interactive journey with a changing chapter number.
- Five reader-situation choices with contextual answers.
- Alicia's personal note, complete offer, seven FAQs and closing invitation.
- Gentle whole-illustration movement, offscreen/hidden-tab pauses, reduced-motion support and a footer motion-pause control.

Motion currently moves complete artwork; it is not real head/hand character animation. Do not misdescribe it. If proposing more advanced character animation, first prove that it preserves anatomy and looks natural; do not restore the rejected cut-up rig. Keep normal scrolling, mobile reading space and keyboard usability.

## Source map

| File | Purpose |
|---|---|
| `content.json` | Editable copy, price, URLs, resources, examples and settings. `sales`, `conversationJourney` and `scrollStory` are relevant current areas. Some older keys remain for history. |
| `sales.py` | Active page composition and printable examples. |
| `guided.py` | Current conversation, chapter journey and reader-choice markup. |
| `source/sales.css` | Active stylesheet, including responsive layouts and motion. |
| `source/sales.js` | Purchase links/UTMs, FAQs, chapter controls, cost worksheet, CSV export and motion preference. |
| `source/guided.js` | Scroll conversation and reader-choice behavior. |
| `source/character.js` | Whole-illustration visibility and animation pausing. |
| `character.py` | Displays the COMPLETE teacup pose from the preserved atlas. |
| `prepare.py` | Generates HTML, optimized images, local fonts, legal pages, printables and combined JavaScript into `dist/`. |
| `verify.py`, `verify-client.mjs`, `verify-starter.mjs` | Static/content checks, checkout attribution tests and calculator/CSV tests. |
| `source/assets/` | Original reference and generated PNG artwork, fonts and site/share assets. |
| `qa/` | Screenshots, historical Lighthouse reports and verification notes. |
| `history/edition-6/` | Recovery material only, not the current implementation. |

`presentation.py`, `experience.py`, `motion_sections.py` and several older CSS/JS files are historical. **They are not the active build.** Do not make changes there expecting edition 8 to update. Do not edit only `dist/`; regeneration will overwrite those edits.

## Alicia assets and identity

Identity reference: `source/assets/alicia-reference.jpg`. Original PNGs and full generation prompts are preserved; see `ART-DIRECTION.md`.

- `alicia-shh-v3.png`: intact shh pose.
- `alicia-money-v3.png`: coins/notes pose.
- `alicia-desk-v3.png`: table/workbook scene.
- `alicia-workbook-v5.png`: open workbook pose.
- `alicia-puppet-v5.png`: old four-quadrant atlas. The complete teacup pose is reused; the detached components are **not** used as a rig.

Keep the established identity: warm brown skin, dark side-parted bob, expressive dark eyes, small gold earrings, navy blazer and white blouse. Generate any new artwork from the identity reference with genuine transparency and intact anatomy. Do not substitute a different woman or stock avatar. Preserve original source images when deriving optimized assets.

## Facts confirmed by the owner and launch blockers

**The paid book/workbook and final deliverables are NOT finished.** There are no final product files to connect yet.

**Jess and Tanya are composites of real people.** They are teaching characters, not verified customers or testimonials. The owner's comment about using other testimonials did not supply any real customer quotes. Do not invent names, reviews, ratings, results or social proof.

**There is no checkout URL or public support email yet.** The owner explicitly confirmed that. The page is a local preview, has not been published and currently cannot accept payments.

Other incomplete launch inputs:

- Actual final cover and finished product samples. The current cover is a concept.
- Verified resource/page/script counts and actual deliverable formats. Earlier brief counts are not proof the material exists.
- Real Lemon Squeezy checkout and end-to-end purchase/download test.
- Public support email, confirmed YouTube link, domain and share metadata.
- Seller-specific, approved privacy/terms/refund text. Current policy pages are drafts.
- Operational refund process matching any advertised 30-day promise.
- Optional email provider AND actual fulfilment of the promised free resources.
- Optional analytics setup and final hosted/mobile testing.

The three website examples are genuine completed **website content**, explicitly **not excerpts from the unfinished paid product**. Do not relabel them as paid-product previews. A free printable works now without requiring an email address. No disabled signup form is shown.

When real samples arrive, use the supported `productSamples` entries in `content.json` and local files under `source/assets/product/`; the README documents the schema. This adds finished samples separately from the website examples.

## Existing behavioral safeguards to preserve

- Specific, calm copy; no invented testimonials, subscriber counts, income promises, urgency or countdowns.
- The original copy rules prohibit em dashes and hype phrases such as secret/hack/crush/explode.
- Required educational disclaimer remains near the offer and in the footer.
- The worksheet annualizes payment costs using 12, 52 or 1. Selected-for-review totals are **not promised savings** or investment returns.
- The worksheet stays local in browser memory; no account, backend or transmission of its entries.
- CSV output escapes formula prefixes and quotes, includes the example disclosure, and blocks invalid values.
- Checkout forwards only the four supported UTMs and preserves existing checkout parameters. Unrelated URL data is not forwarded.
- Analytics, if later connected, must not receive entered financial values, worksheet labels or email addresses.
- Keep substantive information, examples and checkout fallback readable without JavaScript; retain printable alternatives.

## Build, preview and checks

This is a small static website, not a React/Next application. It has no production server dependency. Python plus Pillow is needed only for authoring/building; Node is used for local checks. Deploy the **contents** of `dist/`. `netlify.toml` is included, but no hosting account/domain is connected. A framework migration is not required to continue improving the page.

On the current Windows computer, in PowerShell:

```powershell
Set-Location 'C:\FrameFact\App\sites\quiet-wealth-playbook'
& 'C:\FrameFact\App\backend\.venv\Scripts\python.exe' prepare.py
& 'C:\FrameFact\App\backend\.venv\Scripts\python.exe' verify.py
& 'C:\FrameFact\App\.runtime\node-v22.23.2-win-x64\node.exe' verify-client.mjs
& 'C:\FrameFact\App\.runtime\node-v22.23.2-win-x64\node.exe' verify-starter.mjs
& 'C:\FrameFact\App\.runtime\node-v22.23.2-win-x64\node.exe' --check dist/site.js
```

Elsewhere, use your available `python` and `node`, with Pillow installed for `prepare.py`.

To serve the built page, only if port 8893 is not already serving it:

```powershell
python -m http.server 8893 --bind 127.0.0.1 --directory dist
```

The `?edition=8` URL parameter identifies the review link/cache variant; it is not a server-side switch between implementations. `dist/index.html` is the current page.

Checks rerun on 21 October 2026: static verification, checkout/UTM fixture, calculator/CSV fixture and JavaScript syntax all passed. These do not certify the unconnected payment system or a future hosted deployment.

Existing browser evidence: `qa/guided-hero.png`, `qa/guided-story.png`, `qa/guided-mobile-story.png`, `qa/guided-chapters.png`. Prior browser checks recorded all three pose states, chapter selection/counter, reader choices, motion pause and no horizontal overflow at widths 320, 375 and 1200.

Edition 8's recorded Lighthouse result was performance 93 and accessibility/best-practices/SEO 100, measured **before** its final inactive-image loading improvement. Do not present edition 7's historical 97 performance result as edition 8's score. Rerun browser checks after changes rather than treating old evidence as current.

## Recommended continuation

1. Inspect edition 8 and preserve a recoverable copy before significant changes.
2. Improve the polish within the established direction: typographic hierarchy, composition, transitions, art placement and variation between sections. Keep the enjoyable longer Alicia-led journey.
3. Trim genuinely repetitive persuasion while preserving useful interactive sections. Make every interaction help understanding or navigation.
4. Test real mobile reading/scrolling, keyboard focus, reduced motion, touch controls, all chapter/reader states and actual CSV/printable output.
5. When the owner supplies finished product and business inputs, connect them and complete `LAUNCH-CHECKLIST.md`. Until then keep the preview honest and functional.

Do not publish, set up paid services, accept payments or invent missing business details as part of merely receiving this handoff.

## Scope boundary

The website happens to live inside the FrameFact checkout, but is independent. Keep website changes under `sites/quiet-wealth-playbook`. Do not modify FrameFact backend/frontend services, AI model settings, video projects, pCloud video delivery, media libraries or unrelated channels for this website task. No API keys or `.env` files are required or included in this handoff.
