# Step O157 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O157, base 8a157c780)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All of these ran from the worktree root with `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin` first on PATH (`node --version` printed `v24.21.0`).

```
# Verify 1. Hashes of docs/diagrams/* and docs/palette.md taken before and after, then compared
npm run diagrams ... npm run docs:palette ... shasum ... | diff <before> -
diagrams and palette unchanged

npm run test:quick -- --base 8a157c780
test:quick: 17 changed file(s), from git since 8a157c780
test:quick: 10 test file(s)
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      ASCII gate (3.0 s)
ok      svelte-kit sync (5.8 s)
ok      eslint (5.8 s)
ok      svelte-check (19.7 s): 1793975191879 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (26.5 s): Duration  4.07s (transform 2.36s, setup 0ms, import 3.83s, tests 0ms, environment 1ms)
ok      vitest slow (30.6 s): Duration  7.99s (transform 2.22s, setup 0ms, import 3.71s, tests 4.07s, environment 0ms)
ok      vitest checks (57.8 s): Duration  34.86s (transform 15.05s, setup 0ms, import 30.23s, tests 44.60s, environment 3ms)
test:quick: 64.0 s; every command passed

# Verify 2. The grep lists 26 files; 19 are .test.ts, the others are fixtures and helpers
npx vitest run <the 19 .test.ts files> --reporter=dot
run 1:  Test Files  1 failed | 18 passed (19)   Tests  1 failed | 352 passed | 2 skipped (355)   (the failing test's name was not captured)
run 2:  no FAIL line printed
run 3:  Test Files  19 passed (19)   Tests  353 passed | 2 skipped (355)
npx vitest run tests/checks/tree/boundaries.test.ts --reporter=verbose
 <check mark> ... layer boundaries > holds across src/lib 2993ms     (alone, load average 8.24; the default timeout is 5000 ms)
 Test Files  1 passed (1)  Tests  11 passed (11)

# Verify 2a. The builder's quoted command, rerun byte for byte
node --input-type=module -e "const m = await import('./src/lib/views/academic/present/screen/slide-layout.ts'); ... show('C9 portrait C3', T, [3.75], 120);"
C1 one tall block 405x418 at (618,0) figures 405x418 text 592x418 area 169482 inside true
C2 one tall block 637x334 at (386,42) figures 637x334 text 360x418 area 212445 inside true
C3 one wide block 1023x273 at (0,145) figures 1023x273 text 1023x145 area 279074 inside true
C4 one alone block 1040x102 at (0,216) figures 1040x102 text none area 106039 inside true
C5 side wide block 1023x254 at (0,164) figures 246x254 777x254 text 1023x164 area 259685 inside true
C5 side as one block one wide block 1023x254 at (0,164) figures 1023x254 text 1023x164 area 259685 inside true
C5 stacked as one block one tall block 308x418 at (715,0) figures 308x418 text 689x418 area 128689 inside true
C6 side tall block 585x418 at (438,0) figures 293x418 293x418 text 412x418 area 244614 inside true
C6 stacked as one block one tall block 146x418 at (877,0) figures 146x418 text 851x418 area 61153 inside true
C7 side wide block 1023x192 at (0,226) figures 186x192 250x192 587x192 text 1023x226 area 196347 inside true
C7 stacked as one block one tall block 197x418 at (826,0) figures 197x418 text 800x418 area 82147 inside true
C8 one alone block 267x534 at (387,0) figures 267x534 text none area 142578 inside true
C9 4:3 C1 one tall block 452x466 at (425,0) figures 452x466 text 399x466 area 210641 inside true
C9 4:3 C3 one wide block 877x234 at (0,232) figures 877x234 text 877x232 area 205101 inside true
C9 portrait C1 one wide block 573x591 at (0,387) figures 573x591 text 573x387 area 338484 inside true
C9 portrait C3 one wide block 573x153 at (0,825) figures 573x153 text 573x825 area 87554 inside true
(identical to the report's output, line for line)

# Verify 3
LC_ALL=C perl -ne '<the rules file's gate>' $(find src tests bin config -type f ! -name local.yml)   -> nothing; gate exit 0
LC_ALL=C perl -ne 'print ... if /[^\x20-\x7E\n]/' <the 16 changed files and the report>          -> nothing; touched exit 0

# Verify 4. wc -l output
434 docs/decks.md | 101 layers.dot | 556 layers.svg | 69 slide.css | 229 Panel.svelte | 404 Slide.svelte | 66 Equation.svelte | 123 Plain.svelte | 68 Words.svelte | 354 Project.svelte | 52 Framed.svelte | 155 Stage.svelte | 214 print/+page.svelte | 318 show/+page.svelte | 18 formula.ts | 233 slide-layout.ts   (each at or under 520 / 880)

# Verify 5
sh utils/unused-exports.sh > <scratchpad>; diff O157-base/unused-exports.txt <scratchpad>  -> unused diff exit 0

# Verify 6
sh utils/folder-check.sh -> folder-check exit 0; ls screen | wc -l -> 7

# Verify 7. The history-word grep over the added lines and both new files
+    // out (Slide.svelte lays a slide out again when one of its images loads or fails, before the
(the one hit; it states an order of events, not history)

# The report's other quoted evidence
diff -rq O157-base/tests migration-O157/tests  -> nothing (tests diff exit 0)
diff -rq of src and config against the base copy: the 13 changed and 2 new paths of the report's file table, nothing else
```

A further check outside the brief's list: `npx vitest run tests/checks/diagrams/diagrams.test.ts tests/checks/diagrams/palette.test.ts` printed `4 failed | 44 passed`, every failure `Test timed out in 5000ms` (uptime at the time: load averages 14.77 15.40 12.13). The regeneration above produced the same bytes, and that sameness is the fact those tests check. test:quick does not run these two files.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1. `slide-layout.ts` computes the rule as the brief states it, and the C1 to C9 run reproduces. But the caption and explanation height that Slide.svelte gives the module is measured at the wrong width, so a caption can run past the room.
- 2: holds by reading. One `--slide-fit` sits on `.content` (`Slide.svelte`), and `slide.css` multiplies every `--slide-fs-*` by it. The search is bounded at 8 tries plus a final draw and starts from 1.25 on every trigger. Its triggers are the effect on row, frame and strip, an image's load or error, the probe's resize, and a font's loadingdone. The probe sits outside `.content`, so nothing the search changes starts a new search. The foot sits outside `.content`, so it stays at factor 1. The equation is fitted at every try. Cost not measured (Declined to judge).
- 3: violated, Spec 2 (a deck's first slide in the pane scrolls when its text fits) and Spec 3 (a Markdown image on a text slide makes the slide Too tall).
- 4: holds by reading, with Behaviour 1. The bare Stage and the print `.page` now have `border-color: transparent`. The print page's `.fit` is `height: 100%`, so each surface's parent gives an inner height of 590 (`Slide.svelte:139-143`). Both routes set `--text-scale` from `configuredLook().textSize`. `data-ready` waits on `layoutsSettled()` after `imagesSettled()`.
- 5: violated, Spec 3 (`Words.svelte:45` caps a Markdown image at the whole content height, title included, where the brief caps it at the room under the title). Project, Panel and Plain place by the layout's boxes. The html-sites line is unchanged and the test passes.
- 6: holds for the paragraphs listed, with Standards 1: the new sentences of the `Stage.svelte` head comment and of `docs/decks.md` are false in the cases of Spec 2 and Spec 3.
- 7: holds. No test is added or changed (the `diff -rq` of `tests` prints nothing). `slide-layout.ts` imports nothing, and the quoted run reproduces.

Cases of the brief's "Cases":

- C1: met, run line C1 (405x418, text 592).
- C2: met, run line C2 (637x334, text 360).
- C3: met, run line C3 (1023x273 under text 145).
- C4: met, run line C4 (1040x102, centred at y 216).
- C5: met, run lines C5 (side 259685 against stacked 128689).
- C6: met, run lines C6 (side, tall, 585x418, text 412).
- C7: met, run lines C7 (side 196347 against stacked 82147).
- C8: met, run line C8 (267x534, centred at x 387).
- C9: met, run lines C9 (each box inside its room; tall C1 in 4:3 keeps 399 px of text, the rest wide).
- C10: partial by reading, Spec 1. The figure becomes a column, whole, with no Too tall. A caption or explanation that wraps to more lines at the final, narrower box width runs past the room into the facts strip, and nothing measures it.
- C11: met by reading. Short text draws at 1.25. Dense text is searched down to 0.75. Text that does not fit at 0.75 overflows `.content`, and Stage's measure reports it.
- C12: met by reading (one inner box of 1150 by 590 and one `--text-scale` source on all six surfaces); for an audience window already open see Behaviour 1.
- C13: met by reading. `onloadcapture`/`onerrorcapture` on `.content` run in the capture phase, before the image's own listeners from `imagesSettled`. A broken image is caught by `complete && naturalWidth === 0` and drawn as gap words, and `onlaid` still fires.
- C14: met by reading (every kind sits inside `.content` and takes the factor; `Title`'s `flex: 1 0 auto` still fills the flex column).
- C15: met by reading for placement (a diagram or missing words goes into the text's right column, a figure is placed); the caption overflow of Spec 1 applies to the figure panel.
- C16: partial, Behaviour 1 (an audience window that is already open keeps the text size it opened with).
- C17: met by reading (`body.rice .slide-frame` sets the `--slide-design-*` values; `.slide-fit` inherits them and multiplies by the factor).
- C18: partial, Spec 3. Image slides: met (`alone`, centred, whole). A text slide with a heading and a tall Markdown image runs past the frame.
- C19: partial, Spec 2. The factor is the same on every surface. In the pane the first slide scrolls.
- C20: met by reading. A pane resize changes only the Stage's `transform: scale`, which changes neither `offsetWidth` nor the probe, so nothing reruns.
- C21: not verifiable here. It needs the orchestrator's count in the Findings view at the look.

## 1. Spec

- `src/lib/views/academic/present/Slide.svelte:193-200`:
  - Quoted hunk: "show(layOut({ room: size, figures, text: least, between: FIGURE_GAP })); // What is drawn under each figure is measured at the width the figure has. const under = known.map(...tall(holder) - tall(one.image)); ... show(layOut({ room: size, figures: measured, ... }))".
  - What is wrong: `under` is measured once, at the box widths of a layout that counted no caption. The second layout takes that height off the figure's room, so each box gets narrower, and at the narrower width the caption and explanation can wrap to more lines than were measured. No pass measures them again. `fits()` (`:206-212`) checks only the text and `.content`, and the panels are `position: absolute`, so a block that overflows the room changes no measured height. Stage's measure (`Stage.svelte:68-78`) reads `.reading`'s children and misses it as well. The comment at `:194` is false too: the measure is not taken at the width the figure is drawn at.
  - What the brief asks: item 1 says "each figure's caption and explanation height" is measured from the drawn slide and "taken from the figure's room", and "every figure stays inside the frame".
  - Failure scenario: a project slide in a 1280 by 720 frame, one figure of ratio 0.97 with a caption of about 80 characters and an explanation. At the first box width (about 405 px) the caption takes 2 lines. With that height subtracted the box narrows to about 340 px, where the caption takes 3 lines and the explanation one more. The panel then runs about 25 to 50 px past the room, over the facts strip, with no Too tall raised.
  - Fix inside the brief: measure `under` again after the second layout and lay out again until it stops growing (bounded, for example 3 passes), and make `fits()` compare the bottom of each `[data-figure-box]` with the room's bottom.
  - Verdict: item 1 violated; C10 and C15 partial.
- `src/lib/views/academic/present/Slide.svelte:142` with `:337-340` and `Stage.svelte:76-78`:
  - Quoted hunk: "const kept = (foot === null ? 0 : tall(foot)) - (hint === null ? 0 : tall(hint));".
  - What is wrong: the room includes the key hint's height, as the brief asks, but the hint is still drawn in the flow of the foot. Two kinds of first slide fill that room by construction: one with a figure (`.room` gets `min-height: layout.height`) and one whose text the search grows to the edge. On such a slide the reading column comes out one hint (about 44 px) taller than the frame. The pane's frame (`overflow-y: auto`) scrolls, and Stage subtracts the hint, so no Too tall is raised. Because the foot draws the hint above the strip (`:337` before `:340`), on a project deck the bottom 44 px of the facts strip end up below the fold. The report says "the hint is below the fold", which holds only for a deck with no strip. The builder called this a limitation and left it, though the brief's words cover it. Item 3 reads "the finding, the tile's mark and the pane's scroll are as now in that case", which is the case of text that does not fit, and the step line says no slide is drawn past its frame. The brief does not require the hint to take room in the flow: "the key hint left out" of the room is met by drawing the hint out of the flow.
  - Fix inside the write list:
    - In `Slide.svelte`, position `.keys` absolutely at the top of the frame's bottom padding (`position: absolute; top: 100%` of `.reading`, with its own `padding-top` reduced so the hint fits the 64 px at a raised text size). Then nothing is subtracted from `kept`.
    - In `Stage.svelte`, drop the hint subtraction (`:76-78`), since an absolute hint is not part of `.reading`'s box.
    - Rewrite both head comments to match.
  - Failure scenario: Present pane, a project deck, slide 1 with a figure (including the full-screen bare pane in front of an audience). The frame scrolls by about 44 px and the strip's words are cut at the bottom.
  - Verdict: item 3 violated; C19 partial.
- `src/lib/views/academic/present/parts/Words.svelte:45` with `Slide.svelte:149`:
  - Quoted hunk: "max-height: var(--slide-room-height, none);" and "room = above;".
  - What is wrong: `--slide-room-height` is the whole height of the content above the foot, title included. Item 5 asks that a Markdown image be "no taller than the room", and item 1 defines the room as "the box the slide's content has under its title and above its foot".
  - Failure scenario: a `kind: text` slide with a heading and one tall image (natural height over 590 px). The image is drawn about 590 px tall under a heading of about 60 px. No factor fits, the slide is drawn at 0.75 and is Too tall, its only text is the heading, and the image runs past the frame. This breaks item 3 ("Too tall only for text that does not fit") and C18 ("every image inside the frame"). The builder names it under Limitations and does not fix it.
  - Fix: set the variable per try from the measured top of the body box (the text slide's `.body`, or a `data-room` on it), as `draw` already does for `[data-room]`. Or set it to the room under the heading.
  - Verdict: item 5 violated, item 3 violated; C18 partial.

## 2. Proof

- none. Every count and output the report quotes was reproduced (the case run, test:quick, the 19-file batch, the gates, `wc -l`, the unused-exports diff, folder-check, the history grep). The one failure in the batch reproduced in my own first run and not in the two runs after it. `holds across src/lib` takes 2993 ms alone against a 5000 ms timeout. My judgment is that it is a timeout under load and not a content failure of the step. The failing test's message was not captured in either session.

## 3. Standards

- `src/lib/views/academic/present/screen/Stage.svelte:10-11` and `docs/decks.md:168` / `:434`:
  - Quoted hunks: "A slide taller than the frame, one whose text does not fit at its least size, scrolls inside it." and "A slide is too tall only when its text does not fit the room its figures leave at the least size."
  - What is wrong: both sentences are false in the cases of Spec 2 (the pane scrolls a fitting first slide) and Spec 3 (an image makes a text slide too tall). The rules file's rule on grepping changed names reads: "a sentence in a document or a head comment that the change makes false is a defect of the change".
  - Failure scenario: a reader of `docs/decks.md` takes a scrolling first slide, or a Too tall image slide, for a text problem and cuts text that fits.
  - Verdict: item 6, closed with Spec 2 and Spec 3.
- `src/lib/views/academic/present/Slide.svelte:71`, `:74`:
  - Quoted hunk: "const FIGURE_FRAME = 14;" and "const FIGURE_GAP = 14;".
  - What is wrong: the figure box's padding and border are written twice, as CSS in `Panel.svelte` `.fig` and `Plain.svelte` `.figure`, and as a number in Slide.svelte. The rules file's principles say a rule exists once. The value could be read from the drawn image's computed padding and border, which also follows the brief's "inputs are measured from the drawn slide, never assumed".
  - Failure scenario: a later change to `.fig`'s padding leaves the layout's ratio arithmetic off by the difference. `object-fit: contain` then letterboxes each image inside a box of the wrong shape.
  - Verdict: none.
- `src/lib/views/academic/present/screen/slide-layout.ts:17-18`:
  - Quoted hunk: "so the slide is measured too tall rather than drawn without its figures."
  - What is wrong: a contrast construction of the kind the rules file's prose rule bans ("no 'not X but Y' construction (state the thing directly)"). The report's "Prose" section says there is no departure.
  - Failure scenario: none for behaviour. It is a prose departure from the rule.
  - Verdict: none.

## 4. Behaviour

- `src/routes/present/show/+page.svelte:211-212` (also `print/+page.svelte:136-137`):
  - Quoted hunk: "const scale = String(configuredLook().textSize); document.documentElement.style.setProperty('--text-scale', scale);".
  - What is wrong: the audience window reads the text size once, at mount, from the config that `+page.ts` installs at load. Raising the text size in Settings while the window is open therefore does not resize its slide, while the pane and the presenter screen resize at once through the shell's effect. The report's C16 look line says "the same on the presenter screen, a tile, the audience window and the print page" and does not say the window must be reopened. The print page is opened fresh for each export, so it is not affected.
  - Failure scenario: presenting with the audience window open, Axel raises the text size. The pane and the presenter screen re-lay out, the audience window keeps the old size and line breaks, and the presenter's view no longer matches the audience's.
  - Fix: either the report states it as a before and after for the look, or the window reacts to the config's change, if the page receives one (not verified whether it does).
  - Verdict: C16 partial.

## Declined to judge

- The cost of the search on a large Overview. It was not measured, since measuring needs a page. By my reading of `Slide.svelte:131-235`, a dense slide without figures runs up to 9 `flushSync` calls, each followed by forced layout reads. A slide with figures runs about 3 `flushSync` calls and 4 to 5 forced layouts per try over up to 9 tries, about 30 flushes and 40 forced layouts, plus the same again for every tile on each font `loadingdone` (one listener per slide). Every tile of an Overview runs this back to back in microtasks of one task when the view opens. It would be settled by timing the Overview's open on the hub's largest project deck at the look. The builder states the risk as unmeasured in its first line.
- Decision 15, an image with `naturalWidth` 0 treated as failed (an SVG with only a `viewBox`). This contradicts the brief's decision 4 premise that every format gives a ratio. Settling it needs a browser. The hub holds PNGs only (the brief's count, not re-run here).
- The builder's other 14 decisions, judged by reading:
  - Acceptable inside the brief: 2, 3, 4, 5, 7, 9, 10, 11, 12, 13 and 14.
  - Acceptable, but with visible consequences the look should know:
    - 6: the chips and table scale with the factor. In the rice theme at factor 1, `--chip-text: var(--fs-xs)` makes `--chip-px` 10/11 of the base, so chip measures shrink slightly.
    - 8: the title of an image slide is always drawn at 1.25, which takes room from its image.
  - 1 is covered under Standards (the duplicated frame constant).
- `formula.ts` outside the write list. I judge it necessary and in its place: `slide-layout.ts` may hold neither DOM code nor `$lib` imports, and `parts/` is full at 10 entries. The report names it with its reason. The eslint error the report quotes as the reason was not reproduced, since reproducing it would mean editing code.
- Whether the builder ran any program other than the brief's case run. The case run is approved by brief item 7 and is a case-run program under the rules file. The report names no other program, and the diff shows no sign of a scripted edit. The builder's transcript is not among my inputs, so a command that is not in the report cannot be checked.
- Whether classic, space-taking scrollbars can make the search oscillate. My reading: it converges. A try that overflows shows a scrollbar only during that try, and the probe's size is compared only at the observer's delivery, after the search has ended. A too-tall result triggers at most one more run, which gives the same result. Not verified on a page.
- Cases C10 to C21 on screen: the orchestrator's look at landing. The verdicts above are by reading.

Reviewer usage: a90de74f922bc0f23, claude-opus-5-5, 238527 tokens, 66 tool uses, 28.8 min.

## Repair round 1, refuted

The round's delta: `files.txt` lists 16 paths. A `diff -u` of each path's snapshot copy against the worktree shows changes in 12 of them: `docs/decks.md`, `slide.css`, `Panel.svelte`, `Slide.svelte`, `Plain.svelte`, `Words.svelte`, `Project.svelte`, `Framed.svelte`, `Stage.svelte`, the print and show routes, and `slide-layout.ts`. The other 4 are unchanged: `layers.dot`, `layers.svg`, `Equation.svelte` and `formula.ts`. `git status --short` lists no other changed path except the two ledger files.

```
# Before each vitest run: ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep
At the first look the O155 worktree's test:quick was running. I read code and ran the non-vitest checks, then waited (15 s per look, at most 40 looks): "clear after 1 checks". The same command printed nothing before each later run.

# Verify 1 (PATH with /Users/axelfaes/.nvm/versions/node/v24.21.0/bin first)
npm run test:quick -- --base 8a157c780
test:quick: 18 changed file(s), from git since 8a157c780
test:quick: 10 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (3.1 s)
ok      svelte-check (11.3 s): 1793978489218 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (17.0 s): Duration  3.62s (transform 2.27s, setup 0ms, import 3.45s, tests 0ms, environment 1ms)
ok      vitest slow (21.5 s): Duration  7.95s (transform 1.99s, setup 0ms, import 3.34s, tests 4.45s, environment 1ms)
ok      vitest checks (44.7 s): Duration  31.01s (transform 12.73s, setup 0ms, import 25.94s, tests 45.74s, environment 2ms)
test:quick: 47.3 s; every command passed

# Verify 2. The brief's grep lists 26 files, 19 of them .test.ts
npx vitest run <the 19 .test.ts files> --reporter=dot      (no other vitest or svelte-check at its start; load average 9.49)
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
Error: Test timed out in 5000ms.
 Test Files  1 failed | 18 passed (19)
      Tests  1 failed | 352 passed | 2 skipped (355)
npx vitest run tests/checks/tree/boundaries.test.ts --reporter=verbose
 <check mark> |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib 3683ms
 Test Files  1 passed (1)
      Tests  11 passed (11)

# Verify 2a. The report's command, byte for byte (node v24.21.0)
node --input-type=module -e "const m = await import('./src/lib/views/academic/present/screen/slide-layout.ts'); ... show('C9 portrait C3', T, [3.75], 120);"
C1 one tall block 405x418 at (618,0) figures 405x418 text 592x418 area 169482 inside true
C2 one tall block 637x334 at (386,42) figures 637x334 text 360x418 area 212445 inside true
C3 one wide block 1023x273 at (0,145) figures 1023x273 text 1023x145 area 279074 inside true
C4 one alone block 1040x102 at (0,216) figures 1040x102 text none area 106039 inside true
C5 side wide block 1023x254 at (0,164) figures 246x254 777x254 text 1023x164 area 259685 inside true
C5 side as one block one wide block 1023x254 at (0,164) figures 1023x254 text 1023x164 area 259685 inside true
C5 stacked as one block one tall block 308x418 at (715,0) figures 308x418 text 689x418 area 128689 inside true
C6 side tall block 585x418 at (438,0) figures 293x418 293x418 text 412x418 area 244614 inside true
C6 stacked as one block one tall block 146x418 at (877,0) figures 146x418 text 851x418 area 61153 inside true
C7 side wide block 1023x192 at (0,226) figures 186x192 250x192 587x192 text 1023x226 area 196347 inside true
C7 stacked as one block one tall block 197x418 at (826,0) figures 197x418 text 800x418 area 82147 inside true
C8 one alone block 267x534 at (387,0) figures 267x534 text none area 142578 inside true
C9 4:3 C1 one tall block 452x466 at (425,0) figures 452x466 text 399x466 area 210641 inside true
C9 4:3 C3 one wide block 877x234 at (0,232) figures 877x234 text 877x232 area 205101 inside true
C9 portrait C1 one wide block 573x591 at (0,387) figures 573x591 text 573x387 area 338484 inside true
C9 portrait C3 one wide block 573x153 at (0,825) figures 573x153 text 573x825 area 87554 inside true
sed -n '126,141p' <the report> | diff - <this output>   -> identical to report

# Verify 3
LC_ALL=C perl -ne '<the rules file's gate>' $(find src tests bin config -type f ! -name local.yml)   -> nothing; gate exit 0
the same perl check, file by file, over every path git status --short lists                        -> nothing

# Verify 4. wc -l
434 docs/decks.md | 101 layers.dot | 556 layers.svg | 69 slide.css | 231 Panel.svelte | 506 Slide.svelte | 66 Equation.svelte | 129 Plain.svelte | 68 Words.svelte | 357 Project.svelte | 53 Framed.svelte | 150 Stage.svelte | 221 print/+page.svelte | 325 show/+page.svelte | 18 formula.ts | 238 slide-layout.ts   (each at or under 520 / 880)

# Verify 5
sh utils/unused-exports.sh > <scratchpad>; diff ../O157-base/unused-exports.txt <scratchpad>   -> unused diff exit 0

# Verify 6
sh utils/folder-check.sh   -> folder-check exit 0; ls src/lib/views/academic/present/screen | wc -l -> 7

# Verify 7. History words
over the round's added lines: nothing (grep exit 1)
over the whole diff's added lines and the two new files: one hit
+    // out (Slide.svelte lays a slide out again when one of its images loads or fails, before the
(an order of events, not history)

# Verify 8 / round item 6. Contrast words (rather|instead|, not | but |not only| and not ) over the round's added lines
nothing (grep exit 1)

# The report's other quoted evidence
grep -rn "data-key-hint\|bind:this={hint}" src tests            -> nothing
grep -rn "FIGURE_FRAME\|FIGURE_GAP" src                         -> nothing
grep -n "key hint\|hint" docs/HELP.md                           -> lines 277 and 437, neither about the Present view
grep -n "taller than its frame" docs/HELP.md                    -> line 331
grep -rn "socket.svelte" src/routes/present                     -> nothing
grep -rn "holderOf\|frameOf\|gapOf\|capTopOf" src tests (outside Slide.svelte) -> same names in json.ts, opening.ts, deck/read.ts, FoldRun.svelte, literature/handler.ts, tab-frames.svelte.ts, Document.svelte, present.svelte.ts, each for something else
diff -rq ../O157-base/tests tests                               -> nothing (exit 0)
diff -rq ../O157-base/src src; diff -rq ../O157-base/config config -> the 11 changed and 2 new paths of the report's table; config: nothing
show/+page.ts:8 installPageConfig(data); install.ts:38 configInstalled(); show/+page.server.ts:11-23 a load with no socket; socket.svelte.ts:383-388 the push that calls configInstalled() on the main page's socket
```

### Verdicts

Items of the brief's "What to build":

- 1: holds.
  - The case run reproduces.
  - The caption re-measure at `Slide.svelte:276-285` is bounded at `UNDER_PASSES = 3`. Each height is kept at the largest measured, so the heights only grow and cannot oscillate.
  - A caption still growing after the third pass is caught by `fits()`. At `:306` every `[data-figure-box]` bottom is held to `above + SLACK`.
  - `depth` (`:288-292`) reaches the Stage's measure. `Project.svelte:83-85,176` and `Plain.svelte:47-50` draw `.room`'s `min-height` as `max(layout.height, depth)`. That grows `.content` and `.reading`, the frame child `Stage.svelte:68-70` reads.
  - `frameOf` (`:132-149`) and `gapOf` (`:152-155`) read the computed padding, border and bottom margin.
  - `.placed` now keeps `margin-bottom: 14px`. An absolute box placed by `top` and `left` is not moved by its bottom margin.
- 2: holds by reading. The key hint is drawn at `--fs-md` (13 px times the text size, the tokens.css step outside `.slide-fit`). Brief item 2 and round item 2 had it keep the slide's small size. This departure is named under "Declined to judge".
- 3: violated, Spec 1 (a text slide with a heading and a tall Markdown image is Too tall although its text fits).
  - The figure case holds.
  - The first slide's hint takes no room. `.keys` is absolute at `top: 100%`, and `getBoundingClientRect` of `.reading` leaves an absolute descendant out. Removing the Stage's hint subtraction therefore removes no guard.
- 4: holds by reading.
  - Both routes set `--text-scale` in an `$effect` over `configuredLook()`. Each route installs its config once, at load (`+page.ts:8`), and opens no socket, as the head comments now say.
  - `data-ready` and the print scale-down (`fit.scrollHeight`) see `depth`.
- 5: violated, Spec 1 and Spec 2. Project, Panel and Plain place figures by the layout's boxes. The html-sites line is unchanged, and `html-sites.test.ts` passed in test:quick.
- 6: violated, Spec 2. `docs/decks.md:168` and `:434` state rules that Spec 1 and Spec 2 make false. The head comments rewritten in the round match the code by reading.
- 7: holds. No test was added or changed (`diff -rq` of `tests` printed nothing), and the case run reproduces.

Cases of the brief's "Cases":

- C1 to C9: met, by the run lines above, identical to the report.
- C10: met by reading. Captions are measured again at the drawn width, every figure box is held to the room, and figures that do not fit at 0.75 grow the room through `depth`, so the Stage reports them.
- C11: met by reading (unchanged in the round).
- C12: met by reading. One inner box and one `--text-scale` source.
- C13: met by reading (unchanged in the round).
- C14: met by reading.
- C15: met by reading (a figure is placed and its caption is held inside the room).
- C16: met under round ruling 7. An audience window already open keeps the size it opened with. The report's C16 line states this with its before and after, and the claim that no config reaches an open window reproduces (`show/+page.ts:8`, `install.ts:38`, `show/+page.server.ts`, no socket under `src/routes/present`).
- C17: met by reading.
- C18: partial, Spec 1. Image slides are met. A text slide with a heading and a tall image is still Too tall by reading.
- C19: met by reading in the default frame. The hint is out of the flow and the factor is the same on every surface. Behaviour 1 covers narrow frames.
- C20: met by reading.
- C21: not verifiable here. It needs the orchestrator's count in the Findings view at the look.

### Findings

How each ruling of the round closed, by reading and by the reruns above:

- Ruling 1 (first review's Spec 1): closed.
- Ruling 2 (Spec 2): closed, with the type-step departure noted under "Declined to judge".
- Ruling 3 (Spec 3): not closed; see Spec 1 below.
- Ruling 4 (Standards 1): closed for `Stage.svelte:10-12` and `Framed.svelte:5-7`. `docs/decks.md:168` and `:434` are false again through Spec 1 and Spec 2 below.
- Ruling 5 (Standards 2): closed.
- Ruling 6 (Standards 3): closed; the grep printed nothing.
- Ruling 7 (Behaviour 1): closed by the statement the ruling allows.

#### 1. Spec

- Spec 1. `src/lib/views/academic/present/Slide.svelte:258` with `capTopOf` (`:163-175`) and `parts/Words.svelte:43-46`:
  - Quoted hunk: "const cap = Math.max(0, above - capTopOf(space, top, tall));" and "max-height: var(--slide-room-height, none);".
  - What is wrong: the round closes Spec 3 by claiming "a text slide with a heading and a tall image then fits". A read of the CSS does not reproduce that claim.
    - The cap is the whole height from under the heading (its bottom margin included) to `above`.
    - A Markdown image alone on its line is drawn by marked (`ui/html.ts` imports `marked`) as `<p><img></p>`.
    - No rule of the slide resets a paragraph's margin. `margin` greps over `Words.svelte`, `Plain.svelte` and `src/lib/themes` show none for `p`.
    - The paragraph's bottom margin (1 em, 24 px times the factor) stays inside `section.slide`. That section is a flex item of `.content`, so the margin does not collapse out of it.
    - The inline image's line box adds the strut's share below the baseline (line-height 1.45).
    - So the content passes `above` by about 1 em plus that share at every factor. `fits(1.25)` and `fits(0.75)` both fail, the slide is drawn at 0.75 and runs about 20 to 25 px past its frame (a judgment from the CSS, not measured), and the Stage reports it.
    - The same cap gives a paragraph between the heading and the image no room at all. A columns slide with an image fails the same way.
  - Failure scenario: a `kind: text` slide holds `# Results` and one `![](tall.png)` whose natural height is over 590 px. It is listed as "slide too tall", its tile is marked and the pane scrolls, though its only text is a heading that fits. Axel cuts words that were never the cause. The report's C18 look line ("so the slide fits") sends the look to expect the opposite.
  - Fix inside the brief: hold the image to what the room leaves once everything else is drawn. For example, per try, lower the cap once by the overrun `tall(box) - above` measured with the cap applied, bounded as the caption passes are. Or set the cap from the image's own top less the height drawn after it.
  - Verdict: items 3 and 5 violated; C18 partial.
- Spec 2. `parts/Title.svelte:32`, `parts/Section.svelte:29`, `parts/Grid.svelte:36` and `:48` (no `data-room`), with `docs/decks.md:168`:
  - Quoted hunk: "An image in a slide's Markdown is drawn no taller than the room under the slide's heading."
  - What is wrong: the ledes of the title, section and grid kinds and a grid card's description are Markdown blocks (`<Words ... block />`) that mark no room. For these, `capTopOf(null, ...)` returns 0, so an image there is capped at the whole content height above the foot, heading included. The builder names this as its decision 6.
    - Brief item 5 covers every Markdown image in text, "no taller than the room".
    - The new docs sentence states the rule for every kind.
    - The rules file says a sentence in a document that the change makes false is a defect of the change.
    - `:168` and `:434`, "too tall only when its text, or a figure with its caption, does not fit", are false with Spec 1 and this finding.
  - Failure scenario: a section slide whose lede holds a tall image draws it up to 590 px tall under its heading, runs past the frame and is Too tall. A reader of `docs/decks.md` expects the image to be held under the heading and looks for a text problem.
  - Fix: mark the lede box as the room (`data-room`) in Title, Section and Grid. That work is inside item 5, so the path list is widened as the rules file says. The other option is to narrow the sentence to the kinds that hold the image.
  - Verdict: items 5 and 6 violated.

#### 2. Proof

- `.scratch/migration/agents/reviews/O157-report.md`, "Limitations and sharp edges":
  - Quoted: "each factor tried for a figure slide now runs up to five flushes (the factor, the room's cap when it changes, the first layout, up to three relayouts when a caption grows, the room's depth when a figure ends low)".
  - What is wrong: the list the report gives itself adds up to seven. Reading `draw` gives the same: `:256`, `:261`, `:272` through `show` (`:229`), up to three at `:284` through `show`, and `:291`. Over up to 9 drawn tries (two ends, six halvings, the final draw), that is up to 63 flushes per figure slide, plus `:213` and `:243` before the search.
  - The decision resting on it: the cost of an Overview open, which the round rules is timed at the look against this report.
  - Failure scenario: the orchestrator sizes the Overview timing from 5 flushes a try. It undercounts the forced layouts per tile by two-sevenths and may judge a slow open acceptable.
  - Verdict: none.

#### 3. Standards

- `.scratch/migration/agents/reviews/O157-report.md`, DONE table paragraph "How many times the list ran":
  - Quoted: "two earlier runs of `npm run test:quick` (each `every command passed`) and one of the 19 files ... preceded comment-only edits", and "The first, right after `npm run test:quick` and while the case run, the ASCII gates, `utils/unused-exports.sh` and `utils/folder-check.sh` ran beside it".
  - What is wrong:
    - The round brief says to run "the brief's 'Verify before you report' once, at the end of the round ... no other run of the list". The rules file's "Token discipline" says a run of the list beyond what that paragraph allows is a finding of the review.
    - The list ran three times in the round, and the 19 files ran three times.
    - A red batch was rerun whole, where the rules file has a red line in a file the step does not change rerun alone and named.
    - That batch ran beside the builder's own other commands, which is load of the builder's making, and the report then cannot name its failure.
  - Failure scenario: three times the tokens and minutes of the verify list, and a red result the report leaves unnamed. My own run named it as the `boundaries.test.ts` timeout.
  - Verdict: none.
- The comment at `Slide.svelte:477-480` ("so its two lines at a text size of 1.6 ... fit the padding") states unconditionally a fit that holds only in a wide reading column. See Behaviour 1.

#### 4. Behaviour

- Behaviour 1. `Slide.svelte:481-492` with its comment `:477-480`:
  - Quoted hunk: "position: absolute; top: 100%; ... padding-top: 0.5em; ... font-size: var(--fs-md); line-height: 1.25;".
  - What is wrong:
    - Reading the CSS: in the 1280 by 720 frame (reading column 1040 px), one line is 22.75 px at text size 1. Two lines are 39 px at 1, 58.5 px at 1.5 and 62.4 px at 1.6. Each fits the 64 px padding.
    - The fit does not overlap the facts strip: the strip ends at `.reading`'s bottom, where the hint begins. It does not reach the 1 px border either.
    - The number of lines follows the column width, and `deck.frame` may be 320 to 3840 px wide (`docs/decks.md:101`).
    - The 120 characters of `present.key_hint` take about 780 px times the text size. That figure is a judgment at about half an em a glyph of `--font-ui`, not measured.
    - In the portrait frame the brief's C9 names (720 wide, column 590 px), at text size 1.5 that is about 1170 px. It takes three lines once the breaks fall short: 3 x 24.4 + 9.75 = 82.9 px, past the padding and the border.
    - The pane's frame (`overflow-y: auto`) then scrolls the first slide by the overrun. The Stage reads `.reading`'s box and raises no Too tall.
    - The report gives the hint's px for the 1040 px column only.
  - Failure scenario: a portrait deck opened in the pane at text size 1.5 shows a scrollable first slide with the hint's last line cut by the frame's edge.
  - Fix: state the column width the fit holds for in the comment and in the C19 look line, or keep the hint inside the padding whatever the column, for example by a line clamp. The second is the orchestrator's choice.
  - Verdict: none (C19 is met in the default frame).

### Declined to judge

- The key hint at `--fs-md` in place of `--slide-fs-small`. This departs from the letter of brief item 2 and round item 2, which is the orchestrator's ruling. The builder's arithmetic holds by reading:
  - two lines of 27 px type at line-height 1.25 are 67.5 px, more than 64 px with no padding at all;
  - one line of 120 characters in 1040 px at 27 px needs under 0.33 em a glyph.
- How many lines the hint takes in a given font. Reading cannot settle it; the look at C19 at text size 1.5, and in a portrait deck, settles it.
- The cost per try. It was not measured, since measuring needs a page; the round rules it timed at the look. Proof gives the count by reading.
- The 19-file batch failure. My run names it: `tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib`, timed out at 5000 ms, with no other vitest or svelte-check at the run's start and a load average of 9.49. Alone it passes in 3683 ms. My judgment is a timeout under load in a file the step does not change, which the round closed. Whether the builder's unnamed failure was the same test is not verifiable, since its output was not kept.
- Classic, space-taking scrollbars during an overrun such as Behaviour 1. A scrollbar narrows `.reading` and the probe, which runs the layout once more. That run yields the same result, by my reading. Not verified on a page.
- Whether the builder ran any program other than the case run. The transcript is not among my inputs, and the report names none.
- Cases C10 to C21 on screen are the orchestrator's look at landing. The verdicts above are by reading.

Reviewer usage: ae1d580808535f263, claude-opus-5-5, 246421 tokens, 50 tool uses, 14.4 min.
