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
