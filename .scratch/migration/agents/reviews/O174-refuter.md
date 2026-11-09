# Step O174 refuter report (on .agents/worktrees/migration-O174, base abe602359)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
(unset TMPDIR; npm run test:quick -- src/lib/views/shared/card/text/Clamp.svelte src/lib/views/shared/card/card-layout.ts)
test:quick: 2 changed file(s), from the given paths
test:quick: 9 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (1.8 s)
ok      svelte-check (7.7 s): 1794182102552 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (40.8 s): Duration  30.86s (transform 11.83s, setup 0ms, import 25.32s, tests 44.05s, environment 2ms)
test:quick: 43.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

node .agents/scratch/cases.ts  (the reviewer's own program against clampCutHeight, removed; `ls .agents/scratch` prints No such file or directory)
C1: 76 (want 76) ok
C2: 57 (want 57) ok
C3: 38 (want 38) ok
C4: 70 (want 70) ok
C5: 76 (want 76) ok
C6: 64 (want 64) ok
C7: 76 (want 76) ok
C8: 57 (want 57) ok
C9: 75.4 (want 75.4) ok
C10: 76 (want 76) ok
C11: 57 (want 57) ok
C12: 70 (want 70) ok
C13: 40 (want 40) ok
C14: 76 (want 76) ok
extra: last line 1 px short of the clamp: 76
extra: last line 1.1 px short of the clamp: 74.9
extra: last box 1 px past the clamp: 76
extra: last box 1.1 px past the clamp: 57
extra: a NaN box beside lines: 38

sh utils/unused-exports.sh > .agents/scratch/unused.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O174-base/unused-exports.txt .agents/scratch/unused.txt
(no line) exit 0; wc -l: 334 and 334

grep -rn "clamp-lines" src tests docs
(no line) exit 1

grep -rn "clamp-lines\|--clamp-cut\|clampCutHeight\|ClampBox" src tests docs
card-layout.ts:33 and :43; Clamp.svelte:12, :25, :28, :61, :63, :112, :136, :172. The same ten hits as the report, each true.

grep -rn --exclude=local.yml "clamp-lines\|clamp-cut\|clampCut\|ClampBox" config README.md
(no line) exit 1

LC_ALL=C grep -n '[^ -~]' src/lib/views/shared/card/text/Clamp.svelte src/lib/views/shared/card/card-layout.ts
(no line) exit 1

npx eslint src/lib/views/shared/card/text/Clamp.svelte
exit 0

git diff abe602359 | grep -nE "^\+.*\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"
10:+// before the rest go behind the More menu, whether a description is longer than its clamp, at what
11:+// height its cut ends, and which measurement is still wanted once a newer one has started or the
209:+       nothing is sliced above the control, and it is set before this class first applies. Its
(The same three lines the report quotes; the line numbers differ because the report used `git diff -U0`, a form this review does not run.)

grep -rn "createTreeWalker\|getClientRects\|drawnBoxes" src tests
The hits the report names (FoldRun.svelte:70, Toolbar.svelte:109, FrameLayer.svelte:95, keys.ts:52) and Clamp.svelte:61, :70, :76, :112.

grep -rn "clampCut\|ClampBox\|cutHeight" <base copy>/src <base copy>/tests <base copy>/docs
(no line)

grep -rn "\bClamp\b" src tests docs
Hits under src only (CardBrief.svelte:3, :12, :42, :44; FieldMarkdown.svelte:13; EntryFields.svelte:41, :48, :213, :215).

grep -rn "overflowsClamp\|CLAMP_LINES\|Clamp\b" tests
(no line) exit 1

grep -n "katex-base" node_modules/katex/dist/katex.css
172:  /* \newline is an empty block at top level, between .katex-base elements */
177:.katex .katex-base {
(Also node_modules/katex/dist/katex.mjs:5654 `makeSpan(["katex-base"], children, options)`; package version 0.18.7.)

diff -rq <base copy>/<d> <d> for src docs tests utils, and config with --exclude=local.yml
Files .../src/lib/views/shared/card/card-layout.ts and src/lib/views/shared/card/card-layout.ts differ
Files .../src/lib/views/shared/card/text/Clamp.svelte and src/lib/views/shared/card/text/Clamp.svelte differ

wc -l: Clamp.svelte 175, card-layout.ts 130; git show abe602359:<path> | wc -l: 105 and 104

awk over `## Open items` of the main checkout's orchestrator-state.md: the paragraph the report quotes, then "None."

ls docs/adr
ls: docs/adr: No such file or directory

git status --short
 M src/lib/views/shared/card/card-layout.ts
 M src/lib/views/shared/card/text/Clamp.svelte
?? .scratch/migration/agents/reviews/O174-report.md
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `card-layout.ts:43-52` is the rule as written: a bottom no more than 1 px past the clamp, more than 1 px inside no box, the largest kept, within 1 px becomes the clamp, none found gives the clamp. The case run above gives each expected answer.
- 2: holds by reading; what a page shows is C15. `Clamp.svelte:112` runs between the `setProperty` at :110 and the `removeProperty` at :113. `WHOLE` at :47 names the five kinds the item names. The value is `$state` at :94 and written at :136.
- 3: holds. `Clamp.svelte:172` is `max-height: var(--clamp-cut)`, and the `clamp-lines` grep prints nothing.
- 4: holds as built. The plain `div` is at `Clamp.svelte:139`, the `ResizeObserver` on it at :121, the `MutationObserver` on the box at :123. The sentence of item 4 that the `div` keeps its size is wrong, as the report says; see below.
- 5: holds. `overflowsClamp` changes only by naming its literal 1 as `ROUNDING`, value 1 (`card-layout.ts:14`, :29). `clampControl`, the open state and both callers have no change in the diff; `diff -rq` lists only the two files.
- 6: violated, Standards 1. The head comment and the `.text.cut` comment say more than the code does; the head comment of `card-layout.ts` is true.

Cases of the brief's "Cases":

- C1 Plain lines: met, the run above answers 76.
- C2 A display formula crossing: met, 57.
- C3 A table: met, 38.
- C4 A whole block inside: met, 70.
- C5 The first box taller than the clamp: met, 76.
- C6 A tall inline line: met, 64.
- C7 A box ending exactly at the clamp: met, 76.
- C8 Boxes out of order and overlapping: met, 57.
- C9 A line whose rounding drifts: met, 75.4.
- C10 A first block opening below its margin: met, 76.
- C11 Space before a crossing box: met, 57.
- C12 The clamp in a gap: met, 70.
- C13 A line bottom inside a taller formula on its line: met, 40.
- C14 No boxes: met, 76.
- C15 On a page: not verifiable here, since a reviewer runs no page; the look at landing settles it, with the views and states the report's "Host- or user-visible changes" table names.

The points the dispatch asked to have judged, by reading:

- `drawnBoxes` collects every kind item 2 names and only those. `WHOLE` is `.katex-display`, `.katex-base` outside a display, `pre`, `tr` and `img`. `.katex-base` is the class the installed KaTeX 0.18.7 emits (`katex.mjs:5654`). `NO_LINE` is `.katex, pre, tr`, tested with `closest` at :73, so text inside `.katex-mathml` is skipped (its element sits inside `.katex`). So is text inside a `.katex-display` (every text node there sits inside `.katex`), a `pre` and a `tr`. Nested lists give line boxes through the same walker, and a whitespace text node between `tr`, `li` or block elements gives no rectangle, or a zero-width one that :77 drops.
- One text node that wraps gives one box per line, since `range.getClientRects()` at :76 returns one rectangle per line fragment and each is centred on its own middle at :78-79.
- `scrollTop` is added correctly. `origin` at :62 is the box's top less `scrollTop`, so a viewport `y` minus `origin` is the offset from the top of the text at any scroll position.
- The report lists six judgment calls, where the dispatch says five. I read all six and raise no finding.
  - 1, the parent's line height: a line wholly of `code` at `--fs-sm` (12 px against 13 px) has a box whose bottom falls short of the line's by an amount I estimate at under 1 px, an estimate from font metrics that a page would settle. The answer is then the clamp, or a bottom that keeps the whole line.
  - 2, `ROUNDING` as one value: correct.
  - 3, a box with no height skipped: correct, and an image that loads later runs `measure` through the observer on the `div`.
  - 4, the name and the always-written style: correct.
  - 5, no branch for a text that fits: matches item 2.
  - 6, `?? node`: written for the type check, and the walker cannot reach it. I raise no finding because it is the shortest form the type accepts.
- The builder's statement on item 4 is right, and `measure` cannot run without end. `.text.cut` sets `--field-gap: 0` (:171) and `FieldMarkdown.svelte:68` spaces blocks by it, so the `div` of a field of several blocks changes height when the cut goes on or off. That runs `measure` once more. `measure` reads at a gap of 0 in both states and with `scrollTop` added, so it writes the same numbers. A `$state` set to the same value changes nothing, so the observer has nothing to fire on. The gap written and removed inside `measure` is undone in the same task, before the observer's turn. The attribute write is not watched by the `MutationObserver` (:123 has no `attributes`). The one loop left is a page scrollbar that comes and goes, which the brief's decision 3 accepts.
- `--clamp-cut: 0px` cannot show a zero-height text. `.cut` needs `long` (:135), `long` starts false (:91), and only `measure` sets it (:114), after it has written `cutHeight` (:112). Both writes reach the DOM in the same flush. With `lineHeight` above 0, the only case `overflowsClamp` answers true, the clamp is above 0 and the answer is either the clamp or a bottom of a box that fits, and a box bottom at or below 0 has no source in the allowed tags, whose `style` attribute is stripped.
- The extra `div` changes no block's layout. It is a static block with no margin, padding or class. `.text` is a flex item, so it was and stays a block formatting context. Margins collapse through the `div` as they collapsed through `.field`. No rule selects `.text >` (`grep` over the callers and `Clamp.svelte`), and `.field`'s `:first-child` rules apply inside `.field`, whose own position does not matter to them.

## 1. Spec

none

## 2. Proof

none

## 3. Standards

- `src/lib/views/shared/card/text/Clamp.svelte:11-13` and `:166-167`: "so no line, formula, table row, code block or image is sliced above the control" and "so nothing is sliced above the control"; what is wrong: the rules file's section "The principles every package is judged on" and the skill's Standards heading treat a head comment or comment the diff makes false as a defect, and item 6 asks the comments to say what the code does. The code answers the clamp when no box fits whole (`card-layout.ts:49`), so a note opening with a formula, code block, table row or image taller than the cut is sliced at four lines. The plan's line, C5, C10 and the report's own table ("Sliced at four lines") all say this. The doc comment of `clampCutHeight` at `card-layout.ts:40-41` states the exception and these two comments do not; failure scenario: a maintainer who sees a note opening with `$$...$$` sliced at four lines reads the head comment, takes the slice for a defect of `drawnBoxes` and changes the no-fit answer, which undoes the plan's requirement that such a text keeps the cut height it has now; verdict: item 6 violated.

## 4. Behaviour

none

## Declined to judge

- What the page shows for C15 in light and dark, the widths and the text sizes: a reviewer runs no page, and the look at landing settles it.
- The report's sharp edge "A collapsed `details` draws no rectangles and gives no box": I did not verify it. A `summary` draws its own line by reading, and whether a closed `details` body returns rectangles from `getClientRects` depends on the browser's handling of the hidden content. A note holding a collapsed `details` at the look settles it.
- Whether a cut at a `tr`'s bottom removes the collapsed border of that row (`border-collapse: collapse` in `FieldMarkdown.svelte`), which the report names as not verified: a wide-table note at the look settles it.
- A plain text's cut within the pixel: the rule gives the clamp when a line's box ends within 1 px of it, and whether the browser's rounding of a text rectangle stays inside that pixel at every `--text-scale` needs a page; the plain card at a text size change at the look settles it.
- The report's line numbers 8, 9 and 151 for the comparing words: they come from `git diff -U0`, which this review does not run; the three lines themselves match. `git diff -U0` settles the numbers, and no decision rests on them.
- The report's statement that the list ran twice, the first time red on an eslint line, and its other run counts: nothing here can rerun a past run, and the second run is allowed by the rules file's section "Token discipline" for a red line in a changed file.
- The first run of C1 to C14 on the unchanged tree was not rerun; the grep of the base copy for `clampCut` prints nothing, so a call there has no function to reach, as the report prints.

Reviewer usage: <the session fills this from the completion notice: agent id, served model, tokens, tool uses, minutes>.
