# Sample: "Why the 2008 Crash Was COMPLETELY Avoidable" (cold open)

Status: style test, ~37s, no audio yet. In the VO pass, shot durations get re-timed to the recorded narration.
Shots in episode.js: tower-wide, street-close (= row 1), bankruptcy-filing (2), office-wide, office-close (3), the-crash (4), the-fuse (5), title (6).

## Narration (draft, for the VO pass)

| # | Shot | Narration | Graphics cue (lands on the word in **bold**) |
|---|------|-----------|-----------------------------------------------|
| 1 | lehman-night | At a quarter to two in the morning, on the fifteenth of September 2008, **Lehman Brothers** filed for bankruptcy. **A hundred and fifty-eight years** on Wall Street, **gone in one night**. | name sticker, "158 YEARS", "GONE IN ONE NIGHT"; windows go dark across the shot; a banker walks out with a box |
| 2 | bankruptcy-filing | The filing listed **six hundred and thirteen billion dollars** of debt. It's still **the biggest bankruptcy in American history**. | highlight on the debtor line, stamp slam, sticker |
| 3 | the-assumption | And it all rested on one idea that almost everyone on Wall Street believed in 2006. **House prices don't fall.** Not across the whole country. Not ever. | banker points at the rising chart, bubble types, "THE ONE ASSUMPTION" |
| 4 | the-crash | Then they did. From the **peak in the summer of 2006**, American home prices fell by **more than a quarter**. | line draws up, holds at the peak, crashes with a shake, "−27%" |
| 5 | the-fuse | But this wasn't a bolt from the blue. It was a fuse, and it burned for years. In **2003**, interest rates hit one percent. In **2004**, the big investment banks were allowed to borrow more. In **2006**, prices peaked. In **2007**, two Bear Stearns funds collapsed. **Four chances** to cut it. | fuse burns, each card lands as its year is said, tally counts up, Lehman bomb lights at the end |
| 6 | title | So why didn't anyone? | title card |

## Facts on screen: verify before publishing

| Claim | Source to check | Status |
|---|---|---|
| Lehman filed around 1:45 a.m., 15 Sept 2008 | Contemporary press (NYT, WSJ, Reuters, 15 Sept 2008) | widely reported; verify |
| Founded 1850, so 158 years | Lehman Brothers corporate history | verify |
| Filing listed about $613 billion in debt | Chapter 11 petition, *In re Lehman Brothers Holdings Inc.*, Case No. 08-13555 (Bankr. S.D.N.Y.) | verify exact wording (bank debt vs total liabilities) |
| Largest U.S. bankruptcy filing | BankruptcyData / court records | verify it still holds |
| Case No. 08-13555 | Court docket | verify |
| Home prices peaked July 2006 and fell about 27% to Feb 2012 | S&P CoreLogic Case-Shiller U.S. National Home Price Index (NSA), FRED series CSUSHPINSA | chart path in episode.js is approximate; replace with the FRED series |
| Fed funds target 1% (June 2003 to June 2004) | Federal Reserve FOMC history | verify |
| 2004: investment banks allowed to borrow more | SEC 2004 Consolidated Supervised Entities / net capital rule change | **contested**: how much it raised leverage is debated; soften the wording if needed |
| 2007: two Bear Stearns hedge funds collapsed | Bear Stearns High-Grade Structured Credit funds, June–July 2007 | verify |

## Characters
- "A Wall Street Banker": generic archetype (`CAST.banker`), not a real person.
