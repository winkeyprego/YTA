# Current: edition 9 editorial redesign (Claude, 21 October 2026)

Rebuilt the presentation in `edition9.py`, `source/edition9.css` and `source/edition9.js`; copy, offer and honesty labels are unchanged. `verify.py` now expects seven `data-life` elements (hero portrait, turning seal, chapter ribbon, conversation poses, workbook, money and teacup poses). Static, checkout/UTM, worksheet/CSV and JS syntax checks pass. In Chromium: no page errors; no horizontal overflow at 320, 375, 768, 1024 and 1360; cover open/close, dial selection, sheet tabs, reader answers, worksheet bar and note, and the scroll conversation were exercised. Lighthouse was not rerun.

# Previous: edition 8 guided experience

## Edition 8.1 polish (Claude, 21 October 2026)

Small changes within the edition 8 direction. Removed the hero line "A little reading. Your own numbers. One next move.", which repeated the three ticks above it. Raised desktop small print (labels, notes, worksheet text, disclosures, footer, offer list) from 9-11px to 11-15px for readability. Rebalanced the refund row under the offer. On phones, the "Let's start where you are." caption now stays on one line inside the artwork. Static, checkout/UTM, worksheet/CSV and JS syntax checks pass. No horizontal overflow at 375 or 1280. Lighthouse was not rerun.

Restored the longer interactive pacing at the owner’s request. Alicia narrates the hero, approach, tools, note and offer in first person. The hero invites “Walk through it with me”; the purchase link is still available but secondary. A three-step sticky scroll conversation changes among complete Alicia poses. The twelve chapter details and large current chapter number are visible again; five situation buttons update a live answer. The clear collection, useful cost tool and honest product/composite labels remain.

Browser checks: all three pose states observed; chapter 05 opened and updated the counter with only that chapter open; Irregular income updated the reader answer; motion pause froze the pose while navigating to a different step. The phone stage is 285px tall, leaving space to read. No document horizontal overflow at actual CSS widths 320, 375 or 1200. All copy remains in native HTML; reader alternatives have a no-JS list. The inactive story images are requested only as the conversation approaches the viewport. No scroll interception or detached body parts.

Static, syntax, checkout UTM and starter-tool checks pass. Final JS 8,095 bytes and CSS 38,213 bytes. A local Lighthouse check before the final inactive-image loading improvement measured performance 93, accessibility 100, best practices 100 and SEO 100; report lighthouse-guided.json. Edition 7’s 97 score below is historical, not claimed for this version. Product/checkout/legal limitations remain unchanged.

Screenshots: guided-story.png, guided-mobile-story.png, guided-chapters.png and guided-hero.png.

---

## Historical edition 7 evidence

# Edition 7 sales rebuild: verification

## What changed

Replaced the atmosphere-led page with a product-first structure. The benefit, offer, included tools and channel/pack distinction now appear early. Removed the long scroll-pose sequence, old generic demo, skeleton sample pages and disabled signup form. Kept three intact Alicia illustrations with restrained motion. Removed unverified channel metrics. The owner confirmed Jess and Tanya are composites of real people; their summaries explicitly avoid testimonial/result claims.

## Measured layout

At actual CSS width 1200, before the last shortening of one supporting sentence, page height was 7,194px versus 13,086px in edition 6, about 45% shorter. The collection began at y=832px versus about y=5,487px. These measurements refer to the default collapsed state. Expanded resources and chapters deliberately add content.

At actual width 375 and height 812, the hero CTA ended at y=605 before that same copy shortening, so the purchase action was visible on the first screen. Actual widths 320, 375, 768 and 1200 showed no document horizontal overflow.

## Functional evidence

- Static check passed: one h1, four purchase links, eleven resources, twelve chapters, seven FAQs, local accessible images, three intact moving illustrations, transparent composite/sample labels, working printable destinations, no unsupported social proof and no em dash copy.
- Browser changed an amount to 10.50/year, selected another cost and changed the third to yearly: total $163.50, selected $154.50, as expected.
- Actual browser CSV download completed to `C:/Users/User/Downloads/quiet-wealth-starter-worksheet.csv`. Inspected file: correct header/disclosure, all three default entries, total 912 and selected 300.
- Actual JavaScript fixture verified default and changed totals, invalid/empty amounts, blocking export for invalid input, CSV quote/formula escaping and analytics excluding entered data.
- Checkout UTM fixture verified all four links, retaining existing checkout parameters, forwarding only the four UTMs and keeping the honest unavailable fallback.
- Browser opened the full eleven-resource inventory and readable bill-script example. Printable worksheet content and table were inspected.
- Footer pause stopped all three complete illustrations. Offscreen/hidden-tab and OS-reduced-motion paths remain in the code/CSS. No OS preferences were changed.
- Substantive content, examples, resource inventory, chapter details, FAQs, printable pages and checkout fallback are native HTML. The dynamic calculator requires JS and has a no-JS explanation and printable alternative.

## Quality check

`lighthouse-sales-optimized.json`: mobile synthetic performance 97, accessibility 100, best practices 100, SEO 100; LCP 2.6s, CLS 0.041. Small later changes only omitted unconfigured footer labels and added native validation before CSV download. No broad performance claims are made for third-party hosting or checkout. The home stylesheet is embedded to eliminate its render-blocking request; fonts are local and preloaded, and artwork sized for its display.

Current JS is about 5.5KB, down from about 19KB. CSS is about 30KB, down from about 88KB across stacked historical styles. Current assets are self-contained; unused generated mockups are archived instead of shipped.

## Limitations requiring owner inputs

The product is not finished. The cover is a concept; readable examples were written for this website and are not paid-product excerpts. No testimonials are invented. There is no real checkout URL, delivery setup, support address, domain, analytics or approved final legal text. Purchases remain unavailable and policies remain drafts. No real purchase or signup was attempted. See LAUNCH-CHECKLIST.md.

Final generated JS: 5,476 bytes. Deploy folder: 473,998 bytes. Screenshots: sales-desktop.png, sales-collection.png, sales-mobile.png and sales-printable.png. The final downloaded example CSV remains in Downloads for inspection.
