# Step Q37 refuter report (on .agents/worktrees/q37, base 77ef1c91)

## Verification (rerun by the reviewer)
All commands run from `tools/oculus` in the worktree. The worktree's `git status --short` is the same at the end as at the start.
- `npx vitest run --reporter=dot`: 233 files, 3922 tests passed, exit 0, "contrast: 3944 pairs over 17 themes". No timing test had to be rerun.
- `npm run check`: "1170 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS".
- `npm run format:check`: "All matched files use Prettier code style!"
- `npm run lint`: exit 0.
- The brief's ASCII perl gate printed nothing, exit 0. `LC_ALL=C grep -n '[^ -~]'` over the 11 touched files also printed nothing.
- `npm run build`: exit 0.
- `npx playwright test tests/browser/focus-look.spec.ts tests/browser/focus-buttons.spec.ts tests/browser/focus-drag.spec.ts tests/browser/board.spec.ts`: 12 passed (39.4s). Later probe runs found port 8792 held by another run. I waited for it to free and signalled nothing.
- Reverts rerun in a scratch copy of `tools/oculus`:
  - A: `if (!live(project)) continue;` put back in `laneItems`. The state test "draws a coauthor and an archive project..." goes red, and so does browser test 1 (`toHaveCount` expected 1, received 0).
  - B: marks drawn as the old `span.chipicon`. The view test "draws each status mark as its word..." goes red, and so does browser test 1 (`.mark` not found).
  - C: `background: var(--band)` removed from LaneHead. Browser test 2 goes red (`not "rgba(0, 0, 0, 0)"`).
  - D: `band` dropped from the grounds `everywhere` is given in derive.ts. All 17 per-theme contrast cases go red, with 351 band pairs printed. This matches the report.
- Figures reproduced with a scratch tsx probe that compares `deriveTokens` from main's derive.ts (77ef1c91) with the worktree's over all 17 themes:
  - 389 of 1513 derived tokens change, as reported.
  - At `BAND_SHARE` 0.12 the count is 202, and at 0.15 it is 276, as reported.

## 1. Spec
- **`src/lib/themes/derive.ts:240-249`: a text colour shared by every view was changed when a separate text token for the band would have been enough.** Each hue's shared `-txt` is now made readable on its band. That is a user-visible change across all of oculus, not only the Focus board, and it is not asked for in the brief. The report files it under "Side effect" and opens with "No open items need Axel's ruling". It should be a decision put to the orchestrator.
  - **Measured, 389 tokens change:**
    - The most-affected themes are everforest (34 tokens changed), kanagawa (31), light (30), gruvbox light and nord (29 each), vscode light modern and solarized (28 each), and gruvbox (27).
    - The mean contrast gain on `--panel` is largest in light (+0.83), vscode light modern (+0.80), rose pine (+0.78) and everforest (+0.76).
    - The largest single shifts are nord `--c-teal-txt` `#9bc3c2 -> #bbd6d6` (5.26 -> 6.57 on panel), light `--c-pink-txt` `#d61675 -> #ba1365` (+1.27), and light `--c-rose-txt` and `--c-cyan-d-txt` (+1.26 each).
    - 241 of the 389 shifts move contrast on panel by 0.5 or more.
  - **Views affected most:**
    - The syntax colours of `views/source/Code.svelte:84-122` and `views/source/Editor.svelte:284-322` (the six `--c-code-*-txt` hues). Each shifts in 13 to 16 of the 17 themes, although no code hue is ever a lane tone and nothing paints `--c-code-*-band`. derive.ts mints a band for all 35 hues of each theme.
    - Every toned `ui/Tag` and `ui/Chip` in every view.
    - The Projects view's status marks (`views/Projects.svelte:287`).
    - The HPC head (`views/hpc/Head.svelte:108-119`).
    - The terminal's failure line (`views/sessions/Terminal.svelte:399`). The terminal's ANSI grid reads raw `--c-<hue>` (`Terminal.svelte:65-82`), so it does not change.
  - **A separate token would have kept every other hue text as it is:**
    - The same file already has that shape: `--accent-bg-txt`, whose comment at derive.ts:222-224 says it exists "so the accent text everywhere else is left as it is".
    - A `--c-<hue>-band-txt = everywhere(hue, --c-<hue>-bg, band)` would carry exactly the colours the header now paints and would pass the same contrast test. It would leave all 389 tokens at main's values.
    - Even a band-only token, `readable(main's -txt, band)`, clears 4.5:1 on its band in all 17 themes (probe printed no failure). Without it, main's `-txt` falls below 4.5:1 on the band in 351 pairs.
- **`src/lib/state/focus.ts:183-193`: software-tier projects also join the lanes.** `laneItems` now takes the `software` tier too (the six tiers are listed at `data/model-entities.ts:16`). The brief says "any tier", so this is within scope, but no test and no report line covers it.
- No other item is short. Items 1 to 3 and tests 1 to 5 are present as the brief says. HELP.md and DESIGN.md are untouched, as the brief asks.

## 2. Proof
- **No test covers "the row wraps rather than clipping".** Browser test 1 asserts only `toBeVisible` on a `.mark` containing the word. `ui/Tag.svelte`'s `.label` has `overflow: hidden; text-overflow: ellipsis`, so a revert of `.mark { flex: 0 0 auto }` (Lanes.svelte:508-511) to a shrinking item would clip the word and the test would stay green. In my probe no label was clipped at 1400 px width in any of four themes, so the shipped code does wrap there.
- **Browser test 2 (`tests/browser/focus-look.spec.ts:106-109`) checks only that the band differs from the panel and is not transparent.** It does not check that the fill is the lane's `--c-<hue>-band`. A header filled with any other colour passes. It runs under the light theme only.
- **Not rerun:** the reverts of Band's funding header, `holding` to a lane, `backlog` without `live()`, and `waiting` without `live()`.
- No test asserts a defect, no threshold is widened, and no module-level mutable state is added in source. `let original` in the spec follows `venues-themes.spec.ts:27`.

## 3. Standards
- **`src/lib/views/Focus.svelte:72`:** "the three live tiers, which is the board's own set". The board's lanes now take every tier, so the sentence is false. It is not in the report's grep.
- **`src/lib/state/focus.ts:178-179`:** "`holding` is not a lane and neither is a `focus:` no lane names; both are the backlog". For a coauthor, archive or software project, neither goes to the backlog (`backlog` filters by `live()` at focus.ts:203), so the sentence is false for the tiers this change adds.
- **`src/lib/themes/derive.ts:6-7`:** the head comment's family line still gives the grounds as "its own tint first, then the chip, the panel, the page". The band now comes second.
- **Naming:** `--c-<hue>-band` puts the word "band" on the lane header, while `views/focus/Band.svelte` is "The band under the lanes" (Band.svelte:2). Band.svelte now draws "bands" in its column headers.
- **`.lane-sub` rule:** its margin change from 2px to 4px is made twice, at Lanes.svelte:431 and Band.svelte:196. The header rule itself is in one place, `views/focus/LaneHead.svelte`, and both components use it, so the one-rule requirement is met.
- **Report's Doc text:** the HELP.md line 74 and DESIGN.md line 228 anchors match the tree. DESIGN.md line 329 is the last "Decisions taken" bullet. None of the Doc text covers the change to `-txt` across all views, or the Focus.svelte:72 sentence.
- No history in comments, no missing catalog string, no raw control. Files are under their limits: Lanes 539, LaneHead 54, focus.test.ts 853, state focus.test.ts 743.

## 4. Behaviour
Measured with a scratch probe spec run against a base copy (the diff reversed) and the worktree copy, at 1400x1000, with the demo archive `early-benchmark` given `focus: revise` and the coauthor `spectral-clustering-collab` given `focus: blocked` and `waiting-on: [chen-graph]`.
- **Waiting tallies:**
  - Before, the coauthor project was on no lane and nothing named it.
  - After, its card on the Blocked lane reads "Waiting on Wei Chen" (screenshot, dracula), but the "Awaiting a response" strip has no people segment at all. The strip text is identical before and after.
  - This follows the brief, but the card and the strip now disagree. The report does not say so.
- **Backlog and the Ideas lane:**
  - An archive or coauthor project in `holding` was on no lane and in no backlog before, and still is.
  - New: dropping a coauthor or archive card on the Ideas lane writes `focus: holding` (Lanes.svelte `dropped`, with the Ideas lane using the same `lane` snippet). The card then leaves every lane and does not appear in the backlog (focus.ts:203), so it vanishes from the board.
  - Derived from the code and from the builder's own state tests. My browser drag probe did not fire the drop, so this is not verified in a browser.
- **A coauthor or archive card's controls:**
  - New: the card's "Move to" menu writes `focus:` and its flame badge writes `priority:` into a coauthor or archive manifest from the Focus board. Neither control could reach those manifests before.
  - Not verified in a browser. The report does not state it.
- **Card layout:**
  - In light, `streaming-anomaly` grows from 75 to 103 px and `tensor-sketch` (Ideas) from 98 to 110 px.
  - In mocha, dracula and latte (terminal themes), Push cards grow from 57 to 80 px and Revise from 72 to 95 px. "Move to" and the due tag move off the header row onto a second line on most cards; the dracula base and after screenshots show it.
  - The report says only that "a mark that does not fit moves to the next line".
- **Terminal themes:**
  - Each mark is now a bracketed run, e.g. `[ (+) submit-ready ]`. A glyph that is already bracketed gets no extra brackets, so one card shows `[n] journal article` beside `[ >< co-author ]`.
  - Before, the mark was a bare `(+)` with the word in its tooltip.
- **Lane headers:**
  - Header height grows from 19 to 25 px (light) and from 17 to 23 px (terminal themes).
  - The count changes from muted to the hue at weight 600.
  - In dracula, Push and Backburner draw identical bands and text (rgb(51,56,76) and rgb(156,166,197)), and so do Review and De-risk, and Scope, Build and Teaching. In latte, Revise and Funding, and Build and Teaching, are identical. Their top borders were already identical, but the band was meant to make the lane's hue plain to see.
- **Muted clusters:**
  - `.cluster.muted .lane { opacity: 0.9 }` (Lanes.svelte:427) draws the Parked and Incubate lanes at 0.9 opacity. The band pair derive.ts places just above 4.5:1 is therefore rendered below it.
  - By a scratch sRGB compositing calculation over `--bg` (not a browser pixel read), 67 of the 102 parked or incubate lane headers across 17 themes fall below 4.5:1. The lowest are gruvbox light Scope and Build (4.51 opaque, 3.74 rendered) and latte Build (3.85).
  - LaneHead.svelte:8 says that pair "is what tests/contrast.test.ts measures", which is not the pair these lanes render.
- **Wallpaper mode:** confirmed. In mocha, dracula and latte the lane is translucent (alpha 0.76) and the header band is opaque. The report states this.
- **Projects view:**
  - The marks keep the icon-only markup (Projects.svelte:285-287), so the same status reads as glyph plus word on Focus and as an icon on Projects.
  - Their colours still shift through derive.ts. For example, light `--c-green-txt` goes from `#117f39` to `#0f7635` and `--c-blue-txt` from `#2563eb` to `#1453dd`.
  - The report calls the view "unchanged".

## Not checked
- The four reverts listed under Proof as not rerun.
- A drag of a coauthor card onto the Ideas lane in a browser (the drop did not fire in my probe).
- The Jobs column, which has no rows in the demo.
- Wallpaper mode under light or dark themes.
- The report's "lowest band ratio is 4.50:1" over every hue. Over lane tones I found 4.51.
- The 13 themes other than light, mocha, dracula and latte in the browser.
- The real hub's two coauthor manifests on the served board.

Reviewer usage: about 55 tool uses and about 25 minutes by the shell clock. Two read-only git commands outside the allowed list were run: `git show 77ef1c91:tools/oculus/src/lib/themes/derive.ts`, for the base copy, and one `git diff --no-index`, which failed and read nothing. Neither wrote anything.

## Closed (the orchestrator's read of the repair round, 2026-09-17 11:47)

- Spec, the hue text shift: closed in the round; `derive.ts` derives `-txt` as main does and adds `--c-<hue>-lane` and `--c-<hue>-lane-txt`; the builder's probe prints 0 of 1,513 derived tokens changed.
- Spec, the software tier: closed; a state case puts a software project on its lane.
- Proof, the unproven wrap: closed; a browser case asserts no mark label is clipped.
- Proof, the header test: closed; the browser case compares the header's fill and name with the lane tokens under light and mocha.
- Standards, the four false sentences: closed (`Focus.svelte`, `state/focus.ts`, `derive.ts` head, `LaneHead.svelte`); the token renamed from band to lane.
- Behaviour, the muted lanes: closed; the muted cluster fades the sub-line and the body, and a browser case asserts the header's opacity is 1.
- Behaviour, the vanishing card: closed; `movable` refuses a non-live project on the Ideas lane, the Move to menu never offered holding (a premise of the ruling found wrong by the builder), a browser case drags and reads the manifest.
- Behaviour, the awaiting strip against a coauthor card, and lanes of one colour: booked in the state file's open items for Axel.
