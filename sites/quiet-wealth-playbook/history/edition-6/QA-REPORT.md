# Current campaign edition 3

Verified on 2026-10-20. Earlier edition reports below are historical.

- Generated and inspected three transparent Alicia illustrations with the built-in image tool, using the original channel character as the reference. The original PNGs and exact prompt set are included in `ART-DIRECTION.md`; the page uses WebP variants with preserved alpha.
- New midnight, ivory, apricot and gold palette. The hero shows the shh pose; the live demo uses the coins-and-notes pose; Alicia's note uses the workbook-at-a-table scene.
- The cost demo was checked in the browser: $40 monthly gives $480 annually and $240 retained at half; $40 weekly gives $2,080 and $1,040; Keep it gives $0 retained; the $200 weekly upper limit gives $10,400; the zero limit gives $0. Monthly and weekly switches and the slider were exercised with keyboard and pointer actions.
- Two checklist choices produced “2 of 3 starting steps chosen”. The Save button created `my-quiet-money-starting-point.txt` in Downloads. Its actual contents were inspected: $25 monthly, $300 yearly cost, $150 retained, correct checked and unchecked steps, and the educational-demo note. No email or provider was used.
- Existing static-content and checkout-UTM checks passed. JavaScript syntax passed. The script is 11,955 bytes, below 30KB.
- Final mobile Lighthouse run: Performance 95, Accessibility 100, Best Practices 100, SEO 100. LCP 2.4 seconds and CLS 0. Full result: `lighthouse-campaign.json`. This score is for the local preview, not a live checkout or deployed store.
- All three WebP illustrations total about 279KB. Transparent originals remain in the source folder. These generated poses are distinct new illustrations, not an untouched reuse of the reference.
- Phone, tablet and desktop responsiveness is checked in the browser. The cost inputs and resulting figures were exercised at a 375px CSS viewport.

Screenshots for this edition are `campaign-desktop.png`, `campaign-mobile.png`, `campaign-demo.png` and `campaign-note.png`. Small-phone 320px and tablet 768px layouts also passed overflow checks; the 320px check used the largest $10,400 result. The full resource inventory opened with all 11 items. Checkout, email, legal completion and final product pages still require owner details. No real purchase was attempted. The demo is explicitly illustrative and promises no financial result.

---

# Second edition: actual Alicia and interactive redesign

Verified on 2026-10-20. This section describes the current site; the first-edition report below is historical.

- Hero and personal note use the actual Alicia reference, copied byte-for-byte from FrameFact. No character regeneration or retouching was used. CSS crops and blends the original white-background illustration.
- New green, ivory and navy art direction includes a larger character composition, layered book presentation, a reader-progress line, revised resource cards and a darker chapter journey.
- The three product-explorer buttons were exercised in the browser. Selecting Workbook changed the image to page 6 and selecting Scripts changed the title, copy, image and pressed state correctly.
- Opening month 9 closed the previous chapter, displayed its description and changed the large marker to 09. Native chapter details continue to work without JavaScript.
- Selecting the 50-and-over reader option updated the descriptive text and pressed state.
- Actual CSS viewport widths 320, 375, 768 and 1200 were checked for document-level horizontal overflow: none after the decorative hero clipping fix.
- Actual Alicia images loaded successfully in both locations. The illustration is a small 34KB JPEG shared by both uses.
- Static content, checkout attribution fixtures and JavaScript syntax checks passed. The browser script is 7,972 bytes, below the 30KB budget.
- Current final mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100. Largest contentful paint was 2.0 seconds, cumulative layout shift was 0. Full result: `lighthouse-redesign-final.json`.
- Final visual references: `redesign-desktop.png`, `redesign-mobile.png`, `redesign-toolkit.png` and `redesign-note.png`.

Payment and email integrations still need owner details. Sample pages and the CSS book remain labelled design concepts; Alicia is now the actual character. Real payment, email delivery and production-domain scores remain unverified.

---

# Verification and handoff

Verified on 2026-10-20 against the local prepared static site.

## Final mobile Lighthouse run

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

The complete machine-readable result is `lighthouse-final.json`. First contentful paint was 1.2 seconds, largest contentful paint 1.7 seconds, and cumulative layout shift 0. The first run scored 90/95/100/100. Local font files removed the remote stylesheet dependency, and contrast, mockup heading semantics and preview-button names were corrected before the final run.

These are local, simulated-mobile results for the current preview. Real hosting, checkout, analytics and final images can change the scores. A Lighthouse accessibility score is not a substitute for a complete human WCAG or assistive-technology audit.

## Browser checks

- Actual CSS viewport widths of 320, 375 and 768 pixels showed no document-level horizontal overflow after the small-phone story-card fix. The carousel intentionally scrolls inside its own container.
- The desktop composition was visually inspected in the in-app browser.
- The mobile hero uses 18px supporting body copy.
- Carousel arrow navigation moved the track; sample previews opened with their corresponding images.
- The lightbox received focus, closed with Escape, and returned focus to the original sample button.
- The native FAQ expanded and exposed its answer.
- The navigation bar appeared after leaving the hero.
- All unconfigured purchase buttons point to a truthful checkout-setup notice. The pricing button was exercised in the browser.
- Screenshots: `desktop.png` and `mobile.png`.

## Static and client checks

`python verify.py` passed: four purchase links, eleven resources, twelve months, seven FAQs, six valid local image previews, all three legal pages, two education disclaimers, image dimensions and alt text, copy restrictions, reduced-motion styles and the JavaScript size limit.

`node verify-client.mjs` passed against the actual browser script in an isolated DOM fixture: all four UTM values reach every checkout link, existing checkout parameters remain, unrelated query fields are not forwarded, click locations are tracked, and the unconfigured fallback remains valid.

The client JavaScript is 4,800 bytes, well below the 30KB requirement. All substantive content is already in the HTML. Checkout hrefs and native details/summary FAQs work without client rendering. This no-JavaScript fallback was checked by source inspection, rather than by globally disabling JavaScript in the user's browser. Reduced-motion behavior was checked in CSS and in the client fixture; no browser preference was changed.

## Inputs still needed

This is a complete working page preview, not a live store. Checkout, signup, support and channel URLs, domain, analytics, final policy text and final artwork still need owner input. No real purchase or subscription was attempted. The official Lemon Squeezy overlay is only loaded after a real checkout URL is configured, so provider integration still needs a store test.

The channel numbers and product promises are supplied copy and were not independently authenticated. All sample layouts and mockups are explicitly labelled concepts. The launch date remains blank; no artificial deadline or unverified $37 strikeout is shown.

## Claude continuation

Start with `README.md` and `LAUNCH-CHECKLIST.md`. `content.json` owns the editable content. `prepare.py` creates real static HTML from it, so the page stays readable without JavaScript. `source/styles.css` and `source/site.js` own presentation and progressive enhancement. The deployable files are in `dist/`; the FrameFact application is separate.


## Edition 4 verification, 2026-10-20

- Static verification, JavaScript syntax and actual checkout-script fixture all pass. Combined JavaScript: 18,288 bytes. Static deploy folder before archive: approximately 628 KB.
- Browser checked the hero transform changing from identity to a small translation/rotation with scroll. The sticky approach section selected poses 01, 02 and 03 with the corresponding image loaded.
- Pause motion froze pose 03 while scrolling back to chapter 01 and removed the stage transform. Resume re-enabled motion. OS reduced-motion is covered by the media-query/controller paths; the user's OS preference was not changed.
- The new product-preview button opened the matching sample dialog and Escape closed it.
- Actual CSS widths 320, 375, 768 and 1200 had no document horizontal overflow. The phone's sticky pose and chapter copy were visually inspected.
- Lighthouse measured: performance 93, accessibility 100, best practices 100, SEO 100; LCP 2.6 seconds and CLS 0. Report: lighthouse-atelier.json. These are local synthetic results, not a guarantee for hosting or a configured checkout.
- Screenshots: atelier-desktop.png, atelier-story.png, atelier-mobile.png and atelier-mobile-story.png.
- Real payment, email submission, final legal copy and finished product page samples remain unconfigured. No payment or signup was attempted. The sample images continue to be labelled illustrative layouts.


## Edition 5 checks, 2026-10-20

The hero now uses independent head and shoulder joints, not a fade between flat poses. The in-app browser confirmed two different running animation names and distinct changing transforms after Say hello. Hero animation paused when offscreen. The footer pause control stopped both joints; resuming restored motion. The reduced-motion CSS explicitly removes the joint animation. No OS preference was changed.

Visually inspected the neck/shoulder assembly, wave, new workbook pose and complete teacup pose. Adjusted SVG viewport edges to remove bleed from adjacent atlas cells, and reduced the mobile rig width to keep the raised hand inside the page. Actual CSS widths 320, 375 and 1200 showed no horizontal overflow.

Static checks, checkout UTM client fixture and JavaScript syntax passed. Combined JavaScript 19,027 bytes; deploy folder about 836 KB. Lighthouse local mobile simulation: performance 89, accessibility 100, best practices 100, SEO 100, CLS 0, LCP 3.2s. Rendering-blocking CSS remains a measured performance limitation of the uncompressed local static server; these are synthetic results, not production promises. Report: lighthouse-alive.json.

Screenshots: alive-hero.png, alive-mobile.png, alive-workbook.png and alive-tea.png. Checkout and email service remain unconfigured. No purchase or signup attempted.


## Edition 6 correction

Removed the head/arm assembly and greeting control after user feedback. Browser inspection confirms zero `.alicia-joint` elements. Workbook and teacup independently verified as in view with running whole-image drift, about 3px translation during observation. Offscreen images were paused. Footer pause returned all four images to paused state, no translation and no rotation. Desktop showed no horizontal overflow. Screenshot: whole-workbook.png. Static verification, JS syntax and checkout client fixture passed; final combined JS 19,039 bytes. No new Lighthouse run: edition 5 measurements are historical and not claimed for edition 6.
