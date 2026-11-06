# O157 report: a slide laid out from its content

Everything in the brief is done. Cases C10 to C21 are the orchestrator's look at landing; each is given below with the view, the deck and slide, the state and what should be seen. Two sharp edges of the brief's own design are under "Limitations": the pane's first slide scrolls by the key hint's height when its content fills its room, and the cost of the measured search on a large Overview is not measured.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:163-167`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The cases' first run, on the unchanged tree

C1 to C9, run before any change, in the worktree at the base (the module did not exist yet), with the same command quoted whole under the DONE table:

```
node:internal/modules/esm/resolve:272
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O157/src/lib/views/academic/present/screen/slide-layout.ts' imported from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O157/[eval1]
```

So every one of C1 to C9 failed on the base: there is no layout rule to place a figure. C10 to C21 read on the base (`.agents/worktrees/O157-base`):

- C10. `Panel.svelte:52-58` (base) draws `.fig { width: 100% }` with padding 6 and border 1 and no height limit, content-box sizing (no box-sizing rule anywhere under `src/lib/themes`), so a figure of ratio 0.97 in the right column of about 498 px is drawn about 513 px tall plus its caption, past a project slide's room of about 418 px: Too tall (open item 693's 16 slides).
- C11. `themes/slide.css:9-13` (base): one fixed size per role, `56px * var(--text-scale, 1)` and so on; no factor, so three short lines draw at the design size and a long text runs past the frame and is Too tall at once.
- C12. Base: the print page's `.page { border: none }` (`print/+page.svelte:164`) and the bare Stage (`Stage.svelte:134-136`) give an inner box of 1152 by 592 against the bordered Stage's 1150 by 590; the print page's `.fit` has no height, so `.reading { min-height: 100% }` (`Slide.svelte:107`) resolves against an auto height and the foot follows the content on a PDF page instead of standing at its bottom (a reading of the CSS, not seen on screen); neither route sets `--text-scale` (only `appearance.svelte.ts:109` does), so both draw at 1.
- C13. Base: the print page waits for fonts and images (`print/+page.svelte:119-123`) and has no layout to wait for; a failed image is drawn as a broken image by `Panel.svelte:32` and `Plain.svelte:29`.
- C14. Base: every kind draws at the design sizes, no factor.
- C15. Base: a diagram and the missing-figure words stand in the right column with the figures (`Project.svelte:109-116`), the figure at its column's full width.
- C16. Base: a raised text size grows every size with no bound but the frame; a slide that no longer fits is Too tall.
- C17. Base: the rice sizes 52/33/26/22/17 at factor 1 (`slide.css:34-40`).
- C18. Base: an image slide's image is `max-width: 100%; max-height: 480px` (`Plain.svelte:58-67`), so in a 534 px room a tall image is drawn 480 px tall plus its 14 px of frame and a wide image at the column's width; a Markdown image is `max-width: 100%` with no height limit (`Words.svelte:40-43`).
- C19. Base: the hint is drawn in the pane's first slide only and the Stage's measure leaves it out (`Stage.svelte:73-75`); there is no factor to compare.
- C20. Base: no factor, so nothing to flicker.
- C21. Base: open item 693 counts 16 Too tall figure slides in the hub's decks after O151.

No case of the brief's rules was found wrong. Three of the brief's figures are rounded differently, with the rule unchanged: C2's figure is 637 by 333.5, which the brief writes 333 and the run prints 334; C5's stacked block is 307.9 by 418 at the unrounded ratio 0.7365, which the brief writes 309 from the rounded 0.74 and the run prints 308; C7's stacked block is 196.5 by 418, which the brief writes 196 and the run prints 197.

## DONE / NOT DONE

| Item | State | Proof (command) | Last line of its final run |
|---|---|---|---|
| 1. The layout rule, one pure module | DONE | the `node --input-type=module -e` run below | `C9 portrait C3 one wide block 573x153 at (0,825) figures 573x153 text 573x825 area 87554 inside true` |
| C1 to C9 | DONE (each row of the run below matches its case) | same run | as above |
| 2. The text sized to its room (factor 0.75 to 1.25 on `.slide-fit`, bounded search, foot at factor 1) | DONE by reading; seen at the look | `npm run test:quick` (types, lint, the source checks) | `test:quick: 62.1 s; every command passed` |
| 3. Too tall only for text that does not fit | DONE by reading; C11 and C21 at the look | same | same |
| 4. Every surface the same (bare and print borders transparent, print `.fit` full height, text scale on both routes, `data-ready` after the layouts) | DONE by reading; C12, C13 and C19 at the look | same | same |
| 5. The parts follow it (Project, Panel, Plain, Words; html-sites line unchanged) | DONE by reading; C10, C15 and C18 at the look | `npx vitest run tests/checks/source/html-sites.test.ts` inside the batch below | `Test Files  19 passed (19)` |
| 6. The docs and comments | DONE | read; list under "Head comments" | not a run |
| 7. No new test | DONE: the step adds and changes no test | `git status --short` lists no file under `tests/` | not a run |
| Verify 1: `npm run diagrams && npm run docs:palette`, then `npm run test:quick` once | DONE, the list run once | `npm run test:quick` | `test:quick: 62.1 s; every command passed` |
| Verify 2: every test file the grep names | DONE | `npx vitest run <the 19 test files> --reporter=dot` | `Test Files  19 passed (19)` |
| Verify 2a: the case run | DONE | below | below |
| Verify 3: the ASCII gate over `src tests bin config` and over every touched file | DONE, both print nothing | the perl gate of the rules file; the same perl check over the 14 touched files and `docs/decks.md` | `gate exit 0` and `touched exit 0` (and `find: bin: No such file or directory`, the worktree has no `bin`) |
| Verify 4: `wc -l` of every changed file | DONE, each under its limit | `wc -l` (table below) | `404 src/lib/views/academic/present/Slide.svelte` is the largest component, 520 the limit |
| Verify 5: unused exports against the base | DONE, no line added | `sh utils/unused-exports.sh` then `diff` against `O157-base/unused-exports.txt` | `unused diff exit 0` |
| Verify 6: `sh utils/folder-check.sh` | DONE | `sh utils/folder-check.sh` | `folder-check exit 0` |
| Verify 7: history words | DONE | grep below | one hit, judged |
| Verify 8: prose | DONE | read | see "Prose" |

The verify list (`npm run test:quick`) ran once, after the last change. No whole-suite command was run. The batch of the brief's 19 test files ran twice: the first run printed `Test Files  1 failed | 18 passed (19)`, the failure in `tests/checks/tree/boundaries.test.ts` at `expect(findViolations(LIB)).toEqual([]);` (line 338); that file alone then printed `Tests  11 passed (11)`, and the whole batch rerun with no change between printed `Test Files  19 passed (19)`; the first failure's message was not captured, so its cause is not verified, and `boundaries.test.ts` passed again inside `npm run test:quick`.

The case run, typed on the command line, quoted whole (the project room 1023 by 418 and the image slide's 1040 by 534 from the brief; C9's rooms are read from the CSS the way the brief reads 418: a 4:3 frame's reading column 894 less the project slide's 17 px, and its inner height 768 - 130 less the 172 px a project slide's title and strip take, 877 by 466; a portrait frame's 720 - 130 = 590 less 17, and 1280 - 130 - 172, 573 by 978; "with text" is a text of 120 px in every case, which only a wide block reads; the "as one block" rows give each arrangement's block alone, the brief's comparison):

```
node --input-type=module -e "const m = await import('./src/lib/views/academic/present/screen/slide-layout.ts'); const px = (b) => Math.round(b.width) + 'x' + Math.round(b.height); const at = (b) => '(' + Math.round(b.x) + ',' + Math.round(b.y) + ')'; const area = (l) => Math.round(l.figures.reduce((s, f) => s + f.width * f.height, 0)); const inside = (l, room) => [l.block, ...l.figures, ...(l.text ? [l.text] : [])].every((b) => b.x >= -0.001 && b.y >= -0.001 && b.x + b.width <= room.width + 0.001 && b.y + b.height <= room.height + 0.001); const show = (name, room, ratios, text) => { const l = m.layOut({ room, figures: ratios.map((ratio) => ({ ratio })), text }); console.log(name, l.arrangement, l.shape, 'block', px(l.block), 'at', at(l.block), 'figures', l.figures.map(px).join(' '), 'text', l.text ? px(l.text) : 'none', 'area', area(l), 'inside', inside(l, room)); }; const P = { width: 1023, height: 418 }; const I = { width: 1040, height: 534 }; const Q = { width: 877, height: 466 }; const T = { width: 573, height: 978 }; show('C1', P, [0.97], 120); show('C2', P, [1.91], 120); show('C3', P, [3.75], 120); show('C4', I, [10.2], null); show('C5', P, [0.97, 3.06], 120); show('C5 side as one block', P, [0.97 + 3.06], 120); show('C5 stacked as one block', P, [1 / (1 / 0.97 + 1 / 3.06)], 120); show('C6', P, [0.7, 0.7], 120); show('C6 stacked as one block', P, [0.35], 120); show('C7', P, [0.97, 1.3, 3.06], 120); show('C7 stacked as one block', P, [1 / (1 / 0.97 + 1 / 1.3 + 1 / 3.06)], 120); show('C8', I, [0.5], null); show('C9 4:3 C1', Q, [0.97], 120); show('C9 4:3 C3', Q, [3.75], 120); show('C9 portrait C1', T, [0.97], 120); show('C9 portrait C3', T, [3.75], 120);"
```

```
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
```

The lines of `npm run test:quick`, verbatim:

```
test:quick: 16 changed file(s), from git since HEAD
test:quick: 10 test file(s)
        tests/data/hubs/decks.test.ts: named for a changed file
        tests/checks/source/catalog-file-keys.test.ts: scans the source text of a changed file
        tests/checks/source/comment-width.test.ts: scans the source text of a changed file
        tests/checks/source/history.test.ts: scans the source text of a changed file
        tests/checks/source/html-sites.test.ts: scans the source text of a changed file
        tests/checks/source/keys.test.ts: scans the source text of a changed file
        tests/checks/source/strip-types.test.ts: scans the source text of a changed file
        tests/checks/tree/boundaries.test.ts: scans the source text of a changed file
        tests/checks/tree/duplication.test.ts: scans the source text of a changed file
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (16.1 s)
ok      vitest (28.1 s): Duration  10.77s (transform 8.05s, setup 0ms, import 10.60s, tests 0ms, environment 0ms)
ok      vitest slow (33.0 s): Duration  15.63s (transform 4.45s, setup 0ms, import 6.89s, tests 8.56s, environment 1ms)
ok      svelte-check (43.8 s): 1793974137420 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (59.0 s): Duration  41.55s (transform 28.35s, setup 0ms, import 51.08s, tests 71.15s, environment 3ms)
test:quick: 62.1 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The 19 test files of the brief's grep (`grep -rln "Slide.svelte\|Stage.svelte\|Panel.svelte\|Words.svelte\|Equation.svelte\|appearance\|present/print\|present/show" tests`, its `.test.ts` files; the grep also lists 7 fixtures and helpers, which hold no test): `tests/shell/keys/theme-rows.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/config/config.test.ts`, `tests/checks/config/config-folder.test.ts`, `tests/checks/source/html-sites.test.ts`, `tests/server/desktop/window-guard.test.ts`, `tests/server/desktop/app-theme-start.test.ts`, `tests/server/edit/config-value.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/server/root/hooks-server.test.ts`, `tests/state/system/settings/theme-groups.test.ts`, `tests/state/system/settings/row-writer.test.ts`, `tests/state/workbench/options-pages.test.ts`, `tests/state/client/held-unsaved.test.ts`, `tests/data/sources/config/catalog/options.test.ts`, `tests/data/helpers/code-theme-pairs.test.ts`, `tests/routes/docs/wallpaper.test.ts`, `tests/routes/edit/config-key.test.ts`, `tests/routes/edit/apps/app-setting.test.ts`. The final run:

```
 Test Files  19 passed (19)
      Tests  353 passed | 2 skipped (355)
   Start at  15:04:43
   Duration  54.07s (transform 23.38s, setup 0ms, import 56.09s, tests 152.24s, environment 4ms)
```

The history-word grep over every added line of `src` and `docs/decks.md` and the two new files (`git diff -U0 -- src docs/decks.md` and the new files, grepped for before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package, a step id and a date):

```
+    // out (Slide.svelte lays a slide out again when one of its images loads or fails, before the
```

Judged: the order of two things the code does (the layout runs before the image's wait ends), not history.

## Files, from `diff -rq` against the base copy and `git status --short`

| Path | Lines | In the write list |
|---|---|---|
| `src/lib/views/academic/present/screen/slide-layout.ts` (new, item 1's module) | 233 | yes |
| `src/lib/views/academic/present/screen/formula.ts` (new) | 18 | no: `fitFormula`, the equation card's fit, moved out of `parts/Equation.svelte` so the slide's layout can run it at each size it tries; eslint refuses a call of a function exported from a component's `<script module>` (`@typescript-eslint/no-unsafe-call`, "Unsafe call of a type that could not be resolved", on `Slide.svelte:120` when it imported it from the component), and `parts/` holds ten entries. Internal: it changes nothing a reader sees. |
| `src/lib/views/academic/present/Slide.svelte` | 404 | yes |
| `src/lib/views/academic/present/Panel.svelte` | 229 | yes |
| `src/lib/views/academic/present/screen/Stage.svelte` | 155 | yes |
| `src/lib/views/academic/present/screen/Framed.svelte` | 52 | yes |
| `src/lib/views/academic/present/parts/project/Project.svelte` | 354 | yes |
| `src/lib/views/academic/present/parts/Plain.svelte` | 123 | yes |
| `src/lib/views/academic/present/parts/Words.svelte` | 68 | yes |
| `src/lib/views/academic/present/parts/Equation.svelte` | 66 | yes (its fit runs inside the text's box: the layout fits each formula at each size) |
| `src/lib/themes/slide.css` | 69 | yes |
| `src/routes/present/print/+page.svelte` | 214 | yes |
| `src/routes/present/show/+page.svelte` | 318 | yes |
| `docs/decks.md` | 434 | yes: one paragraph at the end of "Slides" (after line 166), one sentence pair in `image`, two sentences in `project`, the Too tall bullet of "Slide findings"; lines 80-140 untouched |
| `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg` | 101, 556 | yes (by `npm run diagrams`: the routes-to-state count 29 to 31, the two routes' import of `state/shared/words/appearance`) |
| `.scratch/migration/agents/reviews/O157-report.md` | this file | yes |

Not changed: `appearance.svelte.ts` (the routes read `configuredLook().textSize` themselves), `present.ts`, `present.svelte.ts`, `Facts.svelte`, `tests/checks/source/html-sites.test.ts` (the site `Panel.svelte:diagram` keeps its expression), the other parts.

## What changed for a reader, before and after, for the look (C10 to C21)

Open each on a scratch server from the step's checkout. "The project room" is a project slide's room under its headline.

- C10. Present view, one of open item 693's 16 slides (listed in `.scratch/migration/agents/reviews/O151-report.md`, "Fixes at landing"), text scale 1. Before: the figure runs past the frame, Too tall. After: the figure is a column at the right of the room, its whole image inside its padded, bordered box at its own proportions, its caption under it in the column, the text beside it at least 360 px wide; the slide fits, no Too tall mark on its tile, no finding.
- C11. Any deck with a text slide of three short lines: the text is drawn at 1.25 of its design size (a body line about 30 px at text scale 1). A text slide with many lines: smaller, down to 0.75 (a body line 18 px). One with more text than fits at 0.75: drawn at 0.75, runs past the frame, scrolls in the pane, the Too tall mark on its Overview tile and the "slide too tall" finding in the Findings view.
- C12. One slide with a figure and one text slide, each in the pane, its Overview tile, both slides of the presenter screen (current and the small next one), the audience window (`P`, then the window) and the print page in the browser (Export to PDF in a browser tab, look at the print preview, never Word): the same layout (the figure's column the same width share, the same line breaks) and the same text size on all six, at text scale 1 and at a raised text size (Settings, text size 1.3). On the print page the foot (the facts strip) stands at the page's bottom and a title slide is centred on its page as in the pane.
- C13. A deck whose slide names a large figure, opened in a fresh print tab: the page's root gets `data-ready` only after the figure has loaded and the slide is laid out, so the PDF holds the placed figure. A panel whose image file is corrupt (an existing `.png` whose bytes are not an image, in a look copy): the panel is drawn as "figure missing" words among the text, and `data-ready` still comes.
- C14. A deck with every kind without figures (title, section, closing, a summary of many rows, a grid, an idea, text, columns, equation, code) and a project slide whose panels hold no image: each looks as on the base, its text at the largest factor that fits (a short slide visibly larger than on the base, a dense one smaller), the chips, tags and the summary's table moving with the text; the project slide without figures keeps its two columns (lists left, equation and diagrams right).
- C15. A project slide with one panel of `diagram_html`, one with a figure the folder lacks, and a project slide with a figure panel and a diagram panel: the diagram and the missing words drawn with the text (in its right column when the text is wide enough for two columns), the figure placed as a block, nothing past the frame.
- C16. Settings, raise the text size step by step on a dense slide: the text grows until the factor reaches 0.75 of the larger design sizes, then the slide turns Too tall; the same on the presenter screen, a tile, the audience window and the print page.
- C17. The rice theme on the C10 and C11 slides: the same boxes, the type at a factor of the rice sizes (52/33/26/22/17) between 0.75 and 1.25.
- C18. An image slide (`kind: image`) with a tall image (ratio about 0.5) and one with a wide image (an `eq_*.png`, ratio about 10): the tall one fills the room's height, centred; the wide one the room's width, centred; both whole, inside the frame. A text slide whose Markdown holds a large image: the image no wider than the text and no taller than the room above the foot.
- C19. A deck's first slide in the pane (the key hint under the content) and the same slide on the presenter screen, a tile and the print page: the same factor (the same line breaks and sizes). Where the first slide's content fills its room (any first slide with a figure), the pane's frame scrolls by the hint's height and the hint is below the visible frame; see "Limitations".
- C20. A slide whose text sits at the edge of fitting: resize the pane (drag its sash) several times; the slide scales with the pane and its line breaks do not change, no flicker.
- C21. The research hub's decks, read only: count the "slide too tall" findings in the Findings view against open item 693's 16, and look at every figure on the Overview's tiles inside its frame.

## Edits to existing assertions

None: no test file and no allow list changed (`diff -rq O157-base/tests migration-O157/tests` printed nothing). The step adds and changes no test, so there is no failing line on the unchanged tree to quote.

## Head comments, doc comments and docs paragraphs that describe the changed behaviour

- `Slide.svelte` head: rewritten (the layout, the factor, the search and its triggers, the hidden content until the first layout, the foot at factor 1).
- `Stage.svelte` head: rewritten (the slide's own layout, the bare frame's transparent border, too tall only for text); its measure paragraph: still true.
- `Framed.svelte` head: rewritten (too tall only when the text does not fit at the least size).
- `Panel.svelte` head: rewritten (a figure at its box, waiting while its image loads, a failed image drawn as the missing words).
- `Project.svelte` head: rewritten (the room, the text box, the figure block, the base look with no figure).
- `Plain.svelte` head: rewritten (the image slide's image at its box).
- `Equation.svelte` head: rewritten (the fit inside the text's box, run by the layout too); `fitted`'s doc comment: rewritten.
- `Words.svelte` head: still true; the CSS comment over the image rule: added.
- `themes/slide.css` head: rewritten (the transparent border, the factor, the design sizes, the app type steps inside the content).
- `routes/present/print/+page.svelte` head: rewritten (the text size, the transparent border, the too-tall scale-down, `data-ready` after the layouts).
- `routes/present/show/+page.svelte` head: rewritten (the text size).
- `parts/project/Facts.svelte:14` ("scales with the slide, the text size and the theme"): still true, the strip is at factor 1.
- `themes/tokens.css:159` ("the slide scale in `slide.css`") and `themes/themes.css:55`: still true.
- `state/life/present.svelte.ts:168-172` (`measured`): still true.
- `arrange/Tile.svelte` head (the Too tall mark): still true.
- `docs/decks.md` "Slides", `image`, `project`, "Slide findings": rewritten as listed in the files table; lines 101-102 (the frame): still true.
- `docs/HELP.md:331` and `:345`: still true (see "Doc text").
- The `ALLOWED` line `'views/academic/present/Panel.svelte:diagram'` (`html-sites.test.ts:37`): still true; the site's expression is `diagram` and it is derived through `sanitiseDiagram()` in the script.

## Decisions the brief did not cover, each reversible

1. The gap between two figures of a block is 14 px (`FIGURE_GAP`, `Slide.svelte`), the margin a panel had under it; the module takes it as `between`, which the case run leaves at 0 as the brief's cases do.
2. The module adds no height between the text and a wide block (C3's `273 <= 418 - 120`); the text's box carries the 26 px gap as its bottom padding while it is measured and when the block is wide, so the gap is inside the text's measured height.
3. A tall block stands at the room's right (where the figures stood), centred in the room's height when it is narrowed; a wide block is centred across the room at its bottom, the text getting the height above it.
4. Where the text at its least size leaves a wide block no height, the block is drawn whole under the text and the slide is Too tall, rather than drawn at no size; a room narrower than 360 + 26 px takes a tall block wide.
5. Two arrangements of equal area: side by side.
6. Inside the content's box, the app's type steps `--fs-xs`, `--fs-sm`, `--fs-md` and `--chip-text` are set at the factor (`slide.css`), so the project chips, the legend's tags and the summary's table move with the text, as item 2 lists them; at factor 1 they are their own sizes.
7. On a slide with a figure, the sub line, the hook and the specs move into the text's box beside or above the figures; on a project slide with no figure the text is as on the base, its empty right column kept.
8. A slide with no text (an image slide, a project slide of figures alone) always fits, so its title is drawn at 1.25 and the figures take the room under it.
9. The slide's content is hidden until it has been laid out once (a microtask after it is drawn, before a paint).
10. A change of the text size or the theme is seen by a hidden probe, one line of the frame's body type outside the content (`.probe`, `Slide.svelte`), observed for its size; the search's own changes never change it.
11. The print page and the bare Stage keep a transparent 1 px border, so the inner box is 1150 by 590 on every surface (item 4's requirement), and the print page's `.fit` takes the page's full inner height, so the foot stands at the page's bottom and a title slide is centred as in the pane: a visible change of the PDF (C12).
12. The routes draw the saved `text_size` (`configuredLook().textSize`); the shell also draws a size whose write is still on its way, which the routes never see.
13. A figure's load failure is remembered by its index and forgotten when the slide, its deck's frame or its strip changes, so a corrected file is tried again.
14. The search tries 1.25, then 0.75, then halves the span six times (`HALVINGS`), a factor exact to 0.008; a height may pass its room by 0.5 px (`SLACK`) for rounding.
15. An image whose `naturalWidth` is 0 once complete (an SVG with no size of its own among them) counts as failed; the hub's decks hold PNGs alone (the brief's count).

## Wrong or impossible in the brief

Nothing found wrong in the rules. The three rounding differences of C2, C5 and C7 are under the first run. `fitFormula` could not stay in `Equation.svelte` (the files table gives the lint error), so the step has a second new file.

## Limitations and sharp edges

- The pane's first slide: the room is measured above the foot with the key hint left out, as the brief asks, so a first slide whose content fills its room (every first slide with a figure) is as tall as the frame plus the hint; the pane's frame then scrolls by the hint's height (about 44 px) with the hint below the fold, and no Too tall is raised. A fix the orchestrator may take: draw the hint in the frame's bottom padding (64 px), where it takes no room, and drop its subtraction from the Stage's measure; it moves the hint under the facts strip. Not done, since the brief rules the hint stays in the foot and out of the measure.
- Cost, not measured: each layout runs up to eight sizes, each one `flushSync` and one forced layout for a slide without figures and three for a slide with figures, again on every trigger; an Overview of many project slides runs that for every tile when it opens.
- With classic, space-taking scrollbars (not macOS's overlay ones), a size the search tries that runs past the frame shows the frame's scrollbar during that try and narrows the reading column, which can shift that try's measure; not verified.
- The desktop host's hidden print window: the first layout runs from a microtask and an image's load or error event, never from a frame callback; a later text size or theme change needs the probe's ResizeObserver; not verified in the hidden window.
- A Markdown image is capped at the content's height above the foot, which includes the heading; an image with its heading on a text slide can still leave the text unable to fit, and then the slide is drawn at 0.75 and is Too tall.
- The first batch run of the brief's test files had one failure in `boundaries.test.ts`, whose message was not captured (see the DONE table).

## Prose

Every new and changed comment and doc sentence was read against the rules file's prose rule: plain ASCII, no em dash, no "not X but Y", the actual names. The case-run line labels ("C5 side as one block") are output of the run, not prose. No departure.

## Doc text for `docs/HELP.md`

No line becomes false. `grep -n "taller than its frame" docs/HELP.md` prints line 331, whose sentence "A slide the Present view has drawn taller than its frame is listed under Findings as "slide too tall" and marked Too tall on its Overview tile, until it fits, leaves the deck or the page is reloaded." stays true, and line 345 ("The strip keeps its room while hidden, so the slide's layout and its Too tall finding do not change with the toggle.") stays true. A sentence the orchestrator may add to line 331 after its frame sentence: "A slide lays itself out in its frame: its figures by their proportions, its text as large as fits, between three quarters and one and a quarter of its design size; it is too tall only when its text does not fit at the least size."
