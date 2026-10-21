# Claude handoff: Alicia Invests website (edition 9)

Updated 21 October 2026. This covers ONLY the Quiet Wealth Playbook sales website. Read this file, then `README.md` and `LAUNCH-CHECKLIST.md`, then look at the page on desktop and phone before changing anything.

## Where things are

- **Code:** GitHub `winkeyprego/YTA`, branch `claude/ecstatic-bardeen-8bxual`, folder `sites/quiet-wealth-playbook/`. The same folder is in the handoff ZIP.
- **Built site:** `dist/` (static HTML, CSS, JS and assets). Deploy the contents of `dist/`. No server or framework.
- **Build and checks:** `python prepare.py`, then `python verify.py`, `node verify-client.mjs`, `node verify-tools.mjs`, `node --check dist/site.js`. Python needs Pillow. All pass at handoff.
- **Local preview:** `python -m http.server 8893 --bind 127.0.0.1 --directory dist`, then open http://127.0.0.1:8893/
- **History:** commit messages on the branch explain each step. Edition 8 (the Codex build) is the first commit if anything needs recovering.

## Product, audience and voice

- Brand **Alicia Invests** (YouTube @AliciaInvestsUS, about 105,000 subscribers, 261 videos). Product **The Quiet Wealth Playbook**, slogan **The Boring Money System**, $27 USD, one payment.
- Audience: US adults, roughly 30 to 60+, mostly on phones, arriving from YouTube. Some are stressed about money.
- Voice: Alicia in first person; calm, warm, practical, no shame, no pressure. No em dashes, no hype words (secret, hack, crush, explode), no urgency or fake discounts.

## What the owner asked for, in order

1. Edition 8 (from Codex) felt plain and template-like, not interactive enough, and did not use Alicia well. The owner chose an **editorial luxury** direction: cream paper, navy ink, muted gold, big serif type, Alicia framed in arched windows.
2. More and better Alicia artwork: the owner generated eight new poses and a kitchen scene from `ASSET-PROMPTS.md`.
3. A signature for Alicia, and a section of real YouTube comments.
4. Up to 30 comments, ideally long, detailed and genuine, about how the videos helped and thanking Alicia or the channel.
5. The free tool felt too basic ("anyone can do that in Google Sheets"). Replaced with a **Money check-up** and a **Leak Hunt**.

The owner said the edition 9 redesign is "a lot better". Keep the direction; refine rather than restart.

## Page, top to bottom

Hero with a 3D concept cover that tilts with the pointer and opens to its contents as it scrolls past mid-screen (button overrides); chapter ribbon; **Money check-up** (8 questions, result with stage, steps, chapters, printable plan); Alicia's three-step conversation (arched window, poses change on scroll); collection as book-style volumes plus all 11 resources; **Leak Hunt** (29 common costs, keep / ask about / cancel, yearly total, hours of work, call scripts, print, CSV); tabbed paper-stack website examples; where to begin plus the Jess and Tanya composites; clock-face chapter dial; reader situations with Alicia's speech bubble; letter over the kitchen scene, signed; **30 viewer comments**; offer with Alicia holding the concept cover; FAQ; closing section with Alicia walking in.

## Source map

| File | Purpose |
|---|---|
| `content.json` | All copy, price, links, resources, chapters, check-up and Leak Hunt text, viewer comments. CRLF line endings, 2-space indent: keep them. |
| `edition9.py` | Renders the page from `content.json` (called by `prepare.py`). |
| `source/edition9.css` | The only active stylesheet. |
| `source/sales.js` | Checkout links and UTMs, FAQ events, email form, motion toggle. |
| `source/checkup.js`, `source/leakhunt.js` | The two free tools; pure functions are tested in `verify-tools.mjs`. |
| `source/edition9.js` | Book, scroll conversation, dial, sheets, reader bubble, signature, comments "show more", reveals. |
| `sales.py` | Still writes the three printable example pages. |
| `tools/fetch_comments.py` | Pulls all channel comments via the YouTube Data API and shortlists them, filtering spam bots, promo accounts and machine-written comments. `--rescore` re-filters a previous download. Output goes to `comments-export/` (git-ignored, contains viewer data). |
| `source/assets/` | Artwork. `originals/` holds the owner's unmodified new PNGs; `site/alicia-signature.svg` and `site/signature/` hold the signature. |
| `ASSET-PROMPTS.md`, `ART-DIRECTION.md` | How the artwork was made and how to make more. |

`presentation.py`, `experience.py`, `motion_sections.py`, `guided.py`, `character.py` and the other CSS/JS files in `source/` are historical and not part of the build.

## Honesty rules that must stay

- **The product is not finished.** No checkout URL, support email, domain, final cover or product samples yet. The page says so ("Checkout is being prepared", "Cover concept. Product in development.").
- **Jess and Tanya are composites,** not customers. Never invent testimonials, ratings, results or subscriber claims.
- **Comments are about the free videos,** not the Playbook, and the page says so. They are copied word for word. Leave out money results ("paid off my home"), private details (illness, divorce) and spam. The owner should ask each commenter before the site goes public.
- **Free tools:** entries never leave the browser; analytics (none configured) may only receive event names and the check-up stage, never amounts or names. Leak Hunt totals are "amounts to look at, not a promise of savings". The check-up says "Not personal financial advice."
- Educational disclaimer appears by the offer and in the footer. Legal pages are drafts.

## Still to do before launch

See `LAUNCH-CHECKLIST.md`. In short: finish the product and final cover; add real samples via `productSamples`; set `checkoutUrl` (Lemon Squeezy), `supportEmail`, `youtubeUrl`, `siteUrl`; replace draft legal pages; get permission from the 30 commenters; host `dist/` (for example Netlify) and test on a phone, including print and CSV, which the claude.ai preview blocks.

## Accounts and secrets

- No API keys are stored in the project. The YouTube API key used for comments lived only in the old environment's network secret (header `X-goog-api-key` for `www.googleapis.com`). To run `tools/fetch_comments.py` again, add a key the same way or set `YOUTUBE_API_KEY`.
- The private claude.ai preview link belongs to the old account; publish a new preview from the new session.
