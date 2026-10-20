# The Quiet Wealth Playbook

A standalone, mobile-first landing page for Alicia Invests. This folder is independent of the FrameFact app. No FrameFact routes, production settings or saved projects are used.

## Preview

Open `dist/index.html` directly, or serve it for the closest match to hosting:

```powershell
python -m http.server 8893 --bind 127.0.0.1 --directory dist
```

Visit `http://127.0.0.1:8893`. There are no frontend dependencies, installation steps or framework build requirements. The page contains its actual text and links in HTML; JavaScript adds the lightbox, tracking, sticky bar, reveal effects and checkout attribution.

## Edit the content in one place

`content.json` is the source of truth for copy, prices, dates, service URLs, SEO, policies and asset captions. Layout is in `prepare.py`, `presentation.py` and `experience.py`. Styling is in `source/styles.css`, `source/editorial.css` and the current `source/campaign.css`. Browser behavior is in `source/site.js`.

After editing content or source files, run:

```powershell
python -m pip install Pillow
python prepare.py
```

Pillow is only used by the optional authoring helper to create the raster placeholders. The finished `dist/` folder needs no Python or build step to deploy. Commit both the editable sources and the prepared HTML so future edits retain the no-JavaScript fallback. `prepare.py` regenerates placeholder artwork: integrate final assets into that helper, or replace the generated assets after the last preparation.

The supplied dollar amounts, pack details and channel statistics come from the brief. Confirm they describe the finished product before launch. No customer testimonials, income claims or urgency devices have been added.

## Connect purchases

Paste your public Lemon Squeezy product checkout URL into `checkoutUrl`, then prepare again. All four purchase links receive that real URL in static HTML. The official hosted `lemon.js` script is included only when checkout is configured. Its `lemonsqueezy-button` class enables the overlay; if the script is blocked, the links open the hosted checkout normally.

The four UTM values `utm_source`, `utm_medium`, `utm_campaign` and `utm_content` are copied from the landing URL to every checkout link. Existing checkout parameters remain intact. Attribution enhancement needs JavaScript; plain checkout navigation still works without it. Verify a test purchase, email delivery, refunds and attribution in your actual store before launch.

With a blank `checkoutUrl`, purchase links lead to an honest on-page setup notice. No fake checkout or successful purchase is displayed.

Reference: https://docs.lemonsqueezy.com/guides/developer-guide/lemonjs

## Price and launch offer

`price` is 27 USD by default. `launchEndDate` is blank because no date was supplied. The preview therefore shows $27 without a $37 strikeout or deadline. To use the actual launch offer, set a valid ISO date such as `2026-11-15`, confirm `regularPrice`, and prepare again. An expired date deliberately prevents preparing a stale offer. After launch, update the price, clear the date and prepare again. There is no resetting countdown.

## Email signup

Set `emailFormAction` to your provider's public subscription form endpoint and `emailFieldName` to the expected email input name. The form submits natively to the provider so validation, confirmation and double opt-in remain with that service. If the provider requires hidden fields, add them to the form template using values in the config. Never put a secret API key in this static site.

The unconfigured preview disables signup and says it is not yet available. It never claims to have sent an email. A submission event is not a confirmed subscriber; provider confirmation is the authoritative result. Test delivery with your real provider.

## Analytics

`analyticsSnippet` accepts your provider's official HTML snippet, inserted in the page head at preparation. Use a cookieless configuration if you want to avoid a consent banner, and describe it in the final Privacy Policy. The client calls `window.plausible` when available and also dispatches `quietwealth:analytics` DOM events.

Events:

| Event | Properties |
| --- | --- |
| Buy click | location: navigation, hero, pricing or final |
| FAQ open | question number |
| Carousel interaction | arrow direction, scroll, or preview page name |
| Email signup | state: submitted |

No email addresses are sent to analytics. For another analytics service, connect the custom event to that service in `source/site.js`. No analytics service runs in the unconfigured preview.

## Assets

- The book and workbook are HTML/CSS concept mockups, labelled as such. They do not depict a finished product.
- Edition 3 uses three newly generated, transparent Alicia illustrations, based on the original FrameFact reference. They show the shh gesture, coins and banknotes, and a table check-in. Originals, generation prompts and WebP placements are documented in `ART-DIRECTION.md`. The reference remains preserved unchanged in `source/assets/alicia-reference.jpg`.
- `assets/page-1.webp` through `page-6.webp` are small, explicitly labelled illustrative layouts. Replace them with final page samples at the same 540 x 720 aspect ratio. Adjust dimensions and lightbox data paths if the finished assets differ.
- `assets/og-image.png` is a 1200 x 630 social preview concept. Set `siteUrl` to make its metadata URL absolute.
- SVG source versions are included for editing; the page uses compressed WebP samples and a PNG share image.
- Transparent hero, money and desk poses are connected in `experience.py`. Product sample pages remain labelled concepts until the finished pages arrive. Keep transparency when replacing these illustrations.

## Deploy

Upload the **contents of `dist/`**, not the entire project folder.

- **Netlify:** drag the `dist` folder into Netlify's manual deploy interface, or use repository deployment with no build command and publish directory `sites/quiet-wealth-playbook/dist` when the repository starts at the FrameFact root.
- **Cloudflare Pages:** upload `dist` as a static site, or select no framework, no build command, and the appropriate output folder in a repository.
- **Vercel:** select Other as the framework, leave the build command empty, and use `dist` as the output directory when this folder is the project root.

For a root-folder checkout, `netlify.toml` is included. Set your domain in `siteUrl`, prepare, then upload. Fonts are bundled locally from Google Fonts with their OFL licenses, preloaded and displayed with `font-display: swap`. This avoids a remote stylesheet blocking the page. Google preconnect hints remain available if you later choose their hosted CSS.

## Legal pages

`privacy.html`, `terms.html` and `refunds.html` are deliberately marked placeholders. Replace their content in the `legal` section of the config, review the resulting pages and remove the review notice only after approval. The education disclaimer remains near pricing and in the footer.

## Handoff to Claude

Read `content.json`, `prepare.py`, `presentation.py`, `experience.py`, `source/styles.css`, `source/editorial.css`, `source/campaign.css`, `source/site.js`, `LAUNCH-CHECKLIST.md` and `qa/REPORT.md`. Continue in this folder. Do not move the landing page into FrameFact's Next app or change its services. Preserve static rendering, checkout fallback, explicit mockup labels, reduced-motion support and accessible native HTML. The finished assets and real service details are the main outstanding inputs.

Run `python verify.py` and `node verify-client.mjs` after preparing for static content and integration checks. Browser QA and measured limits are recorded in `qa/REPORT.md`; do not claim unmeasured Lighthouse scores or a completed payment/email flow.

## Interactive second edition

The product explorer switches among Playbook, Workbook and Scripts views. Chapter summaries are native expandable HTML and work without JavaScript; enhancement keeps one chapter open and updates the large month number. Reader-choice buttons reveal the corresponding content from `content.json`. The sticky bar has a reading-progress line. The second edition used a pointer-responsive book tilt; edition 3 presents Alicia holding a book in the new illustration. All substantive sales copy stays in static HTML.

## Campaign edition 3

The palette is midnight, ivory, apricot and gold. New original Alicia pose artwork was generated with the built-in image tool using her reference, then saved to this project. See `ART-DIRECTION.md` for every asset path and prompt.

A hands-on cost demo lets visitors enter a cost, switch monthly or weekly, and compare keeping it, halving it or skipping it. The result is cost multiplied by 12 or 52, then multiplied by the selected change fraction. No investment assumptions or return projections are used. Default values are only examples. Visitors can select three starting steps and download a text file containing their selections and example numbers. The download is generated locally with a Blob URL; input values are not transmitted or put in analytics events. With JavaScript off, the default example and a clear explanation remain in the HTML.

The full eleven-resource inventory now sits inside a native expandable panel under the product explorer. All resource text remains in static HTML. This shortens the initial reading path while retaining the full offer. The existing chapter journey, reader choices, lightbox, native FAQs, checkout fallback and UTM behavior remain available.


## Scroll edition 4

The new scroll chapter is authored in `motion_sections.py`, with content in `scrollStory` in `content.json`. `source/atelier.css` refines the page and `source/motion.js` provides illustration motion. `prepare.py` combines the CSS and JS into the standalone deployable folder.

Alicia has subtle scroll-linked translation, rotation and scale in the hero, demo and closing note. The sticky approach section transitions among the existing shh, money and desk illustrations as the corresponding chapter is reached. These are layered illustration transitions, not character video or independently animated limbs. The inactive poses load only when the section approaches the viewport; the current image remains visible until the next is ready. There is no scroll hijacking, automatic audio or continuously running animation loop.

The footer includes Pause motion / Resume motion. Operating-system reduced motion is respected and disables the movements and pose changes. All chapter copy remains readable with motion paused or JavaScript unavailable. Small landscape screens use a non-sticky stage to preserve reading space.

The product explorer now has a tactile page/spine presentation and an Open this sample control using the existing accessible lightbox. The final collection pricing uses a dark cover panel beside the complete inclusion list. Existing offer terms, checkout configuration, calculators, download and native FAQ behavior are retained.

For continuation, also read `motion_sections.py`, `source/atelier.css` and `source/motion.js`.


## Living character edition 5

Alicia now has independently articulated head and waving-arm groups in the hero. The transparent atlas is assembled with nested SVG viewports in `character.py`; no original image is cut up or overwritten. The head rotates around her neck, and the arm rotates around the shoulder. Small gestures occur early in each fifteen-second cycle with long quiet intervals, only while the hero is near the viewport. The optional Say hello button replays a slightly larger 1.9-second greeting, and returns to idle.

`source/alive.css` owns the joint animation and new workbook/teacup layouts. `source/character.js` owns the greeting and hidden-tab pause. The existing footer motion control and OS reduced-motion setting stop the joints, and the optional greeting is hidden when motion is off. The rig is a tasteful 2D puppet, not generative video, lip-sync or independent finger animation.

A new open-workbook pose introduces the sample layouts, and a teacup pose appears in the closing Alicia note with a sage palette. Original artwork and prompts are documented in `ART-DIRECTION.md`. Existing scroll pose changes, product explorer, cost demo and checkout configuration remain. Continue here without changing FrameFact production.


## Current edition 6: intact illustrations

Edition 5's separate head/arm puppet was rejected visually and is removed from the page. The hero uses the complete shh illustration again, with no greeting button or detached joints. Workbook, teacup, money and hero illustrations have very slow whole-image drift/tilt. No face, hand or body segment moves independently. `source/character.js` observes these four complete illustrations and runs their CSS animation only in view; hidden tabs, footer Pause motion and OS reduced motion stop it. `source/motion.js` also includes the workbook and teacup in its restrained scroll-linked motion. The teacup is one intact illustration shown from its atlas cell. Historical edition 5 descriptions above are no longer the active behavior.
