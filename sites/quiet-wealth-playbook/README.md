# Quiet Wealth Playbook: Alicia-led edition 9

## Edition 9 (current build)

An editorial redesign at the owner's request: the page looked plain, was not interactive enough and did not use Alicia well. Same copy, offer, honesty rules and checks as edition 8.

- `edition9.py` renders the page from `content.json`. `prepare.py` now calls it instead of `sales.py`'s `render_sales` (`sales.py` still writes the printables).
- `source/edition9.css` is the only active stylesheet (inlined into the home page, copied to `dist/styles.css` for legal pages and printables).
- `dist/site.js` is `source/sales.js` (checkout UTMs, FAQ events, worksheet, CSV, motion toggle) plus `source/edition9.js` (interactions below). `guided.js` and `character.js` are no longer bundled.
- New font: Libre Caslon Text italic, self-hosted under `source/assets/fonts/` (SIL OFL).
- `prepare.py` also writes `alicia-tea.webp`, the complete teacup pose cut from the preserved atlas.

Interactions: a 3D concept cover that follows the pointer and opens to its contents page; a scrolling ribbon of chapter titles; the three-step conversation with Alicia in an arched window whose background shifts per step; book-style collection volumes; a ledger worksheet with a proportional bar and Alicia's running note; tabbed paper-stack website examples; a clock-face year dial for the twelve chapters; reader situations answered in Alicia's speech bubble; a letter with a wax seal. Motion pauses offscreen, in hidden tabs, with the footer control and under reduced motion. Content below the first screen eases in only when motion is allowed.

Edition 8 notes follow for history.

# Edition 8 notes

This is a standalone static sales-page preview for Alicia Invests. FrameFact production services and routes are unchanged. The owner confirmed the product is unfinished, Jess and Tanya are composites of real people, and checkout/support details are not ready. This page does not accept payments.

## Preview and deploy

The current local preview is http://127.0.0.1:8893/?edition=8#hero. To serve separately, run `python -m http.server 8893 --bind 127.0.0.1 --directory dist` from this folder, only if the preview server is not already running.

After editing, run `python prepare.py`. Deploy the CONTENTS of `dist/` to static hosting. No Node runtime, framework or hosting build is required. This task did not publish the site. Static brand assets and locally hosted fonts are self-contained in the source folder.

## Current experience

The owner preferred the earlier longer, interactive experience to the abbreviated sales-led version. Edition 8 restores the three-step scroll conversation, visible twelve-chapter journey with changing chapter number, and reader-situation choices. Copy is narrated by Alicia in first person. The hero’s primary action invites exploration; its purchase action is a quieter text link. The large price badge and standalone channel/pack comparison are removed from the opening. The comparison is optional detail inside the collection. The useful starter worksheet, readable/printable website examples, honest composite labels and clear product offer remain.

Complete illustrations move as a whole and crossfade in the scroll conversation. There is no articulated head or hand rig. Motion is optional, respects reduced motion, pauses offscreen and can be stopped in the footer.

## Current source

- `content.json`: product copy, $27 USD price, URLs, examples, resource descriptions and editable labels. `sales` owns the new page copy. The old fields retained for previous editions are not all active.
- `sales.py`: current page structure and the three complete printable website examples.
- `source/sales.css`: the only active page stylesheet. Home CSS is embedded in the HTML to avoid a render-blocking stylesheet request; legal pages and printables link the same generated stylesheet.
- `source/sales.js`: checkout UTMs, FAQ events, chapter accordions, three-cost worksheet, CSV export and motion preference control.
- `guided.py` and `source/guided.js`: scroll conversation, chapter journey and reader-situation exploration. The chapter counter uses the native details enhancement in `source/sales.js`.
- `source/character.js`: pauses subtle whole-illustration motion out of view and in hidden tabs.
- `character.py`: shows the complete teacup illustration from the preserved atlas. There is no detached head or arm assembly.
- `prepare.py`: writes deployable HTML, optimizes artwork, copies fonts and emits the standalone files.
- `ART-DIRECTION.md`: original image provenance and prompts. Original PNGs are retained.

`presentation.py`, `experience.py`, `motion_sections.py` and the other CSS/JS files are historical and are not consumed by the current build. Edition 6 source/config and old generated placeholders are archived under `history/edition-6` for recovery.

## Page structure

Alicia’s invitation; three-step scroll conversation; clear collection; practical worksheet; readable examples; quick start and composite characters; twelve-chapter interactive journey; reader choices; personal note; complete offer; FAQ; closing invitation and free printable. There are no invented testimonials, unsupported channel metrics, skeleton excerpts or disabled signup forms.

## Actual samples and unfinished product

The starter worksheet, call script and weekly check-in are complete NEW WEBSITE EXAMPLES. They are explicitly not excerpts from the unfinished paid pack. Do not relabel them as product excerpts. The printable pages work without JavaScript except for the convenience Print button; users can also use the browser Print command.

When finished product samples exist, add objects to `productSamples` in `content.json`:

    {"image":"assets/product/sample-1.webp","width":900,"height":1200,"alt":"Describe this real page","title":"Name of actual sample","description":"What the reader can inspect"}

Put the corresponding file under `source/assets/product/`. Preparing the site copies it and displays a separate finished-samples section before the clearly labelled website examples. Only add actual finished material and accurate descriptions. Replace the cover concept when the final cover is ready.

## Checkout and email connections

Set `checkoutUrl` to the real Lemon Squeezy checkout URL. The official overlay script is then enabled; normal anchor navigation remains the fallback. Each of the four purchase links carries only the four supported UTM parameters and preserves existing checkout parameters. No unrelated query data is forwarded. Checkout with the real store still requires a test.

Set `supportEmail`, `youtubeUrl` and `siteUrl`. Unconfigured support/channel links are omitted. Replace and approve the legal text before launch. The 30-day refund and product promises must match the actual offer and delivery setup. The current date is not used to create urgency, and no artificial discount or deadline is shown.

Email signup is omitted until `emailFormAction` is supplied. Until then the free section offers a real printable worksheet, not a disabled form or a promised kit that is unavailable. Configuring the email form must be paired with fulfilment of the promised Reset Kit and checklist. No email is sent to analytics.

## Starter tool

Visitors can edit three costs, choose monthly/weekly/yearly and mark costs to review. Totals annualize using 12, 52 or 1. Selected-for-review totals are NOT predicted savings. Amount inputs are nonnegative, limited to $10,000 per payment and support cents. Invalid amounts block CSV export through native validity reporting. The tool works entirely in browser memory, with no account, storage or API transmission. CSV includes the visible example disclosure and the visitor's entries. Spreadsheet formula prefixes in user-entered names are escaped.

Optional analytics receives only event names and action locations, never worksheet names/amounts or emails. No analytics provider is configured in this preview.

## Checks

Run `python verify.py`, `node verify-client.mjs`, `node verify-starter.mjs` and `node --check dist/site.js` after preparing. Browser and performance evidence is in `qa/REPORT.md`. Before accepting payments, complete `LAUNCH-CHECKLIST.md`.
