# O157 report: a slide laid out from its content

Everything in the brief and in repair round 1 is done. One ruling departs from its letter: item 2's hint is drawn in the app's type step at the frame (`--fs-md`, 13 px times the text size) instead of the slide's small step (18 px times the text size), since at the slide's small step the hint cannot fit the 64 px padding at a text size of 1.5 (the arithmetic is under "Wrong or impossible in the brief"). C10 to C21 are the orchestrator's look at landing; each is given below with the view, the deck and slide, the state and what should be seen.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:163-167`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## Repair round 1, each ruling

| Ruling | State | The check that shows it |
|---|---|---|
| 1. Spec 1: a figure's caption measured at the width it is drawn at, `fits()` holds every figure box to the room, the room as tall as the lowest figure box | DONE | Read: `Slide.svelte:268-292` (the layout, then up to `UNDER_PASSES = 3` relayouts with the heights measured under each figure, each height kept at the largest measured, until none grows by more than `SLACK`); `:233-237` and `:306` (`bottoms()`, every `[data-figure-box]` or placed image bottom held to `above + SLACK`); `:286-292` sets `depth` when the lowest figure box ends below `layout.height`; `slide-layout.ts:77-81` (`SlidePlace.depth`); `Project.svelte:83-85,176` and `Plain.svelte:47-50` draw the room's `min-height` as `max(layout.height, depth)`, which the Stage's measure (`Stage.svelte:61-75`) reads through `.reading`'s height. Types and lint: `npm run test:quick`, last line `test:quick: 90.3 s; every command passed`. Seen at the look: C10. |
| 2. Spec 2: the key hint takes no room | DONE, with the type step named above | Read: `Slide.svelte:438-440` (the hint out of `.foot`, a child of `.reading`), `:477-492` (`.keys` absolute at `top: 100%`, `left: 0; right: 0`, `padding-top: 0.5em`, `font-size: var(--fs-md)`, `line-height: 1.25`); `:202` (`kept` is the foot's height alone); `bind:this={hint}`, the `hint` state and `data-key-hint` are gone (`grep -rn "data-key-hint\|bind:this={hint}" src tests` prints nothing); `Stage.svelte:73` (`const over = Math.round(content) - element.clientHeight;`, no hint subtraction). The head comments of `Slide.svelte:30-37` and `Stage.svelte:17-19`, the CSS comments of `Slide.svelte:467-480`, the prop docs `Slide.svelte:64` and `Framed.svelte:24`, and `themes/slide.css:13-14` say where the hint is drawn. Px by reading the CSS: at a text size of 1 the hint is 13 px type in 16.25 px lines and a 6.5 px padding, 22.75 px for one line and 39 px for two; at 1.5, 19.5 px type in 24.4 px lines and a 9.75 px padding, 34.1 px for one line and 58.5 px for two; at 1.6, the option's top, 62.4 px for two lines; each inside the frame's 64 px bottom padding. How many lines the 120 characters take is a matter of the font's widths, which reading the CSS does not give: by a judgment from typical sans widths (about half an em a character), one line at 1 (780 px against the 894 or 1040 px column) and two at 1.5. Docs: `docs/decks.md:168` now says the hint is drawn under the slide in the frame's margin and takes no room; no sentence of `docs/HELP.md` places the hint (`grep -n "key hint\|hint" docs/HELP.md` lists lines 277 and 437, neither about the Present view). Seen at the look: C19. |
| 3. Spec 3: a Markdown image no taller than the room under the title | DONE | Read: `Slide.svelte:254-262`, `draw` sets `room` (which `--slide-room-height` carries, `:381`) at each factor tried to `above` less `capTopOf(...)`; `capTopOf` (`:157-175`) is the top of the part's `[data-room]`, or, when that room is one Markdown field that opens with a heading (`:scope > .block` whose first element is an `H1` to `H6`), the bottom of that heading plus its bottom margin. A text slide's body is its whole Markdown, heading included (`data/sources/deck/kinds.ts:309-310`, `body` against `rest` for the other kinds), so its room starts under its own heading. `data-room` is on every Plain kind's Markdown box: text (`Plain.svelte:40`), columns (`:66`), the equation's rest (`:73`), code (`:76`), the image slide's room (`:47`), and on the project slide that draws its Markdown alone (`Project.svelte:158`). Seen at the look: C18. |
| 4. Standards 1: `Stage.svelte:10-11`, `docs/decks.md:168` and `:434` against the code | DONE | `Stage.svelte:10-12` now reads "A slide taller than the frame, one whose text or whose figures with their captions do not fit at its least size, scrolls inside it."; `docs/decks.md:168` names the figure's caption inside the room, the Markdown image under the heading, the hint in the margin and "A slide is too tall only when its text, or a figure with its caption, does not fit the room at the least size."; `docs/decks.md:434` reads "so a slide is too tall only when its text, or a figure with its caption, does not fit that room at its least size". The same sentence in `Framed.svelte:5-7` and `print/+page.svelte:14` follows it. |
| 5. Standards 2: the figure frame and gap read from the drawn slide | DONE | `FIGURE_FRAME` and `FIGURE_GAP` are gone (`grep -rn "FIGURE_FRAME\|FIGURE_GAP" src` prints nothing). `frameOf` (`Slide.svelte:127-149`) reads the drawn image's computed padding and border, left plus right and top plus bottom, and takes the larger of the two axes, the module's `frame` staying one number (named in its doc comment). `gapOf` (`:151-155`) reads the computed bottom margin of the first figure's box: `Panel.svelte`'s placed panel now keeps the panel's `margin-bottom: 14px` (`Panel.svelte:91-97`, `margin: 0` removed; an absolute box's bottom margin moves nothing), so the gap is the value the CSS holds. An image slide's one figure is its image, whose margin is 0, and a single figure reads no gap. Before writing them: `grep -rn "holderOf\|frameOf\|gapOf\|capTopOf" src tests` lists functions of those names in other modules for other things (a JSON lock holder, a deck frame reader, a toolbar's column gap) and `grep -rln "borderLeftWidth\|paddingLeft" src tests` lists `CardActions.svelte`'s content width, local to that component; nothing to reuse. |
| 6. Standards 3: prose | DONE | `slide-layout.ts:15-18` now reads "the block is drawn whole under the text, at the size the room's full width and height allow, and the layout is taller than the room, so the slide is measured too tall with its figures drawn." Other contrast constructions in comment lines the step added or rewrapped, each rewritten: `slide-layout.ts:58` ("without what is under it" to "what is under it left out"), `slide-layout.ts:208` ("is never chosen over one that has room" to "a block that has room is chosen over one the text leaves no room"), `Panel.svelte:9-13` ("named in its place rather than left as a dead image" to "drawn as its name in its place"), `Slide.svelte` probe comment ("and never with the layout itself" to "and the factor the layout sets is outside it"), `print/+page.svelte:14-16` ("the Present pane scrolls such a slide instead" and "no slide is cut or split" to "every slide is printed whole on one page; the Present pane scrolls such a slide"), `print/+page.svelte:30-31` ("`data-failed` instead, so the host answers at once and not after its wait" to "`data-failed`, so the host answers at once"), `docs/decks.md:168` ("drawn whole, never cropped" to "drawn whole"). The scan: `git diff -U0 -- src docs/decks.md` and the two new files grepped for `rather\|instead\|, not \| but \|never\|not only\|no longer\|without\| and not `; its remaining hits are "whenever" in the two text-size effects and the base sentence "draws its body instead" of `docs/decks.md:316`, which the step did not write. |
| 7. Behaviour 1: the routes follow the text size | DONE | `show/+page.svelte:211-216` and `print/+page.svelte:136-141` set `--text-scale` in an `$effect` that reads `configuredLook().textSize`; `configuredLook` reads `configGeneration()` (`appearance.ts:577-580`), the rune `configInstalled()` raises (`generation.svelte.ts:34-36`). Whether an open audience window receives a text-size change: no. The page installs its config once, in its load (`show/+page.ts:8`, `installPageConfig`, which raises the generation at `install.ts:38`), from the server's read at its request (`show/+page.server.ts:11-23`); it opens no socket (`show/+page.server.ts:9-10`, and `grep -rn "socket.svelte" src/routes/present` prints nothing), and the config push that installs a new config (`socket.svelte.ts:383-388`) runs on the main page's socket alone. Its theme is drawn once in `onMount` (`show/+page.svelte:219`). So the window takes the text size the config holds when it opens, as its theme does; the effect follows any later install. The head comments of both routes say so. Seen at the look: C16. |

## The cases' first run, on the unchanged tree

C1 to C9, run before any change, in the worktree at the base (the module did not exist yet), with the command quoted whole under the DONE table:

```
node:internal/modules/esm/resolve:272
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O157/src/lib/views/academic/present/screen/slide-layout.ts' imported from /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O157/[eval1]
```

So every one of C1 to C9 failed on the base: there is no layout rule to place a figure. C10 to C21 read on the base (`.agents/worktrees/O157-base`):

- C10. `Panel.svelte:52-58` (base) draws `.fig { width: 100% }` with padding 6 and border 1 and no height limit, content-box sizing, so a figure of ratio 0.97 in the right column of about 498 px is drawn about 513 px tall plus its caption, past a project slide's room of about 418 px: Too tall (open item 693's 16 slides).
- C11. `themes/slide.css` (base): one fixed size per role, `56px * var(--text-scale, 1)` and so on; no factor, so three short lines draw at the design size and a long text runs past the frame and is Too tall at once.
- C12. Base: the print page's `.page { border: none }` (`print/+page.svelte:164`) and the bare Stage (`Stage.svelte:134-136`, `border: none`) give an inner box of 1152 by 592 against the bordered Stage's 1150 by 590; the print page's `.fit` has no height, so `.reading { min-height: 100% }` (`Slide.svelte:107`) resolves against an auto height and the foot follows the content on a PDF page (a reading of the CSS); neither route sets `--text-scale`, so both draw at 1.
- C13. Base: the print page waits for fonts and images and has no layout to wait for; a failed image is drawn as a broken image by `Panel.svelte` and `Plain.svelte`.
- C14. Base: every kind draws at the design sizes, no factor.
- C15. Base: a diagram and the missing-figure words stand in the right column with the figures, the figure at its column's full width.
- C16. Base: a raised text size grows every size with no bound but the frame; the audience window draws at 1 whatever the text size.
- C17. Base: the rice sizes 52/33/26/22/17 at factor 1.
- C18. Base: an image slide's image is `max-width: 100%; max-height: 480px` (`Plain.svelte:58-67`); a Markdown image is `max-width: 100%` with no height limit.
- C19. Base: the hint is in the pane's first slide's foot, above the strip (`Slide.svelte:90`), and the Stage's measure subtracts it (`Stage.svelte:73-75`).
- C20. Base: no factor, so nothing to flicker.
- C21. Base: open item 693 counts 16 Too tall figure slides in the hub's decks.

No case of the brief's rules was found wrong. Three of the brief's figures are rounded differently, with the rule unchanged: C2's figure is 637 by 333.5, which the brief writes 333 and the run prints 334; C5's stacked block is 307.9 by 418 at the unrounded ratio 0.7365, which the brief writes 309 from the rounded 0.74 and the run prints 308; C7's stacked block is 196.5 by 418, which the brief writes 196 and the run prints 197.

## DONE / NOT DONE

| Item | State | Proof (command) | Output |
|---|---|---|---|
| Brief items 1 to 7 and round items 1 to 7 | DONE | the rows above and below | |
| C1 to C9 | DONE (each row matches its case) | the `node --input-type=module -e` run below | `C9 portrait C3 one wide block 573x153 at (0,825) figures 573x153 text 573x825 area 87554 inside true` |
| Verify 1: `npm run diagrams && npm run docs:palette`, then `npm run test:quick` | DONE | `npm run diagrams`, `npm run docs:palette`, `npm run test:quick` | `diagrams exit 0`, `palette exit 0`, `test:quick: 90.3 s; every command passed` |
| Verify 2: every test file the grep names | DONE | `npx vitest run <the 19 files> --reporter=dot` | below |
| Verify 2a: the case run | DONE | below | below |
| Verify 3: the ASCII gate over `src tests bin config`, and over every touched file | DONE, both print nothing | the perl gate of `spec.md:103`; the same perl check over every path `git status --short` lists but this report | `gate exit 0` (and `find: bin: No such file or directory`, the worktree has no `bin`), `touched exit 0` |
| Verify 4: `wc -l` | DONE, each at or under its limit | `wc -l` (files table) | `506 src/lib/views/academic/present/Slide.svelte`, the largest component, 520 the limit |
| Verify 5: unused exports against the base | DONE, no line added | `sh utils/unused-exports.sh` into the scratchpad, then `diff ../O157-base/unused-exports.txt` | `unused diff exit 0` |
| Verify 6: `sh utils/folder-check.sh` | DONE | same | `folder-check exit 0` |
| Verify 7: history words | DONE | grep below | one hit, judged |
| Verify 8: prose | DONE | read; round item 6 | see "Prose" |

How many times the list ran in this round: once over the final tree, after the last change, with the 19 files run twice (below). In the round, two earlier runs of `npm run test:quick` (each `every command passed`) and one of the 19 files (`Test Files  19 passed (19)`) preceded comment-only edits: a word in the `UNDER_PASSES` doc comment that the history grep matched ("before"), the prop docs of `Slide.svelte:64` and `Framed.svelte:24`, which still said the hint is in the foot, `themes/slide.css:13-14`, and the too-tall sentence of `Framed.svelte:5-7`; the run quoted here is the one after them.

The lines of `npm run test:quick`, verbatim:

```
test:quick: 18 changed file(s), from git since HEAD
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
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      ASCII gate (3.2 s)
ok      svelte-kit sync (5.8 s)
ok      eslint (27.3 s)
ok      svelte-check (28.0 s): 1793977722236 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (36.4 s): Duration  4.76s (transform 2.92s, setup 0ms, import 4.52s, tests 0ms, environment 0ms)
ok      vitest slow (42.8 s): Duration  10.94s (transform 2.98s, setup 0ms, import 4.79s, tests 5.94s, environment 0ms)
ok      vitest checks (84.0 s): Duration  51.86s (transform 21.62s, setup 0ms, import 43.79s, tests 70.61s, environment 3ms)
test:quick: 90.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The 18 changed files are the 16 source and doc paths of the files table and the two ledger files of the worktree (`agents/briefs/O157-round-1.md`, this report).

The 19 test files of the brief's grep (`grep -rln "Slide.svelte\|Stage.svelte\|Panel.svelte\|Words.svelte\|Equation.svelte\|appearance\|present/print\|present/show" tests`, its `.test.ts` files; the grep also lists 7 fixtures and helpers, which hold no test): `tests/checks/config/config-folder.test.ts`, `tests/checks/config/config.test.ts`, `tests/checks/source/html-sites.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/data/helpers/code-theme-pairs.test.ts`, `tests/data/sources/config/catalog/options.test.ts`, `tests/routes/docs/wallpaper.test.ts`, `tests/routes/edit/apps/app-setting.test.ts`, `tests/routes/edit/config-key.test.ts`, `tests/server/desktop/app-theme-start.test.ts`, `tests/server/desktop/window-guard.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/server/edit/config-value.test.ts`, `tests/server/root/hooks-server.test.ts`, `tests/shell/keys/theme-rows.test.ts`, `tests/state/client/held-unsaved.test.ts`, `tests/state/system/settings/row-writer.test.ts`, `tests/state/system/settings/theme-groups.test.ts`, `tests/state/workbench/options-pages.test.ts`. The final run:

```
 Test Files  19 passed (19)
      Tests  353 passed | 2 skipped (355)
   Start at  16:12:20
   Duration  55.70s (transform 24.31s, setup 0ms, import 61.05s, tests 151.94s, environment 4ms)
```

This is the second run of the 19 files over the final tree. The first, right after `npm run test:quick` and while the case run, the ASCII gates, `utils/unused-exports.sh` and `utils/folder-check.sh` ran beside it, printed `Test Files  1 failed | 18 passed (19)` and `Tests  1 failed | 352 passed | 2 skipped (355)` in 74.98 s; its output was cut to its last lines, so which test failed and why is not verified. The second run, alone, with no change between, passed. The round closed the `boundaries.test.ts` timeout under load as outside the step; whether this was that test is not verified.

The case run, quoted whole (the project room 1023 by 418 and the image slide's 1040 by 534 from the brief; C9's rooms read from the CSS as the brief reads 418: a 4:3 frame's reading column 894 less the project slide's 17 px, and its inner height 768 - 130 less the 172 px a project slide's title and strip take, 877 by 466; a portrait frame's 720 - 130 = 590 less 17, and 1280 - 130 - 172, 573 by 978; "with text" is a text of 120 px in every case, which only a wide block reads; the "as one block" rows give each arrangement's block alone, the brief's comparison):

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

The history-word grep over every added line of `src` and `docs/decks.md` and the two new files (`git diff -U0 -- src docs/decks.md` and the new files, grepped for before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package, a step id and a date):

```
813:+    // out (Slide.svelte lays a slide out again when one of its images loads or fails, before the
```

Judged: the order of two things the code does (the layout runs before the image's wait ends), not history.

## Files, from `diff -rq` against the base copy and `git status --short`

| Path | Lines | In the write list |
|---|---|---|
| `src/lib/views/academic/present/screen/slide-layout.ts` (new) | 238 | yes |
| `src/lib/views/academic/present/screen/formula.ts` (new) | 18 | no: `fitFormula` moved out of `parts/Equation.svelte` so the slide's layout can run it at each size it tries, since eslint refuses a call of a function exported from a component's `<script module>` (`@typescript-eslint/no-unsafe-call`); the reviewer judged it needed, and it stands (round 1, "Closed, not sent"). |
| `src/lib/views/academic/present/Slide.svelte` | 506 | yes |
| `src/lib/views/academic/present/Panel.svelte` | 231 | yes |
| `src/lib/views/academic/present/screen/Stage.svelte` | 150 | yes |
| `src/lib/views/academic/present/screen/Framed.svelte` | 53 | yes |
| `src/lib/views/academic/present/parts/project/Project.svelte` | 357 | yes |
| `src/lib/views/academic/present/parts/Plain.svelte` | 129 | yes |
| `src/lib/views/academic/present/parts/Words.svelte` | 68 | yes |
| `src/lib/views/academic/present/parts/Equation.svelte` | 66 | yes |
| `src/lib/themes/slide.css` | 69 | yes |
| `src/routes/present/print/+page.svelte` | 221 | yes |
| `src/routes/present/show/+page.svelte` | 325 | yes |
| `docs/decks.md` | 434 | yes: the paragraph at line 168, the sentence pair in `image`, the sentences in `project`, the Too tall bullet at 434; lines 80-140 untouched |
| `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg` | 101, 556 | yes (by `npm run diagrams`: the routes-to-state count 29 to 31) |
| `.scratch/migration/agents/reviews/O157-report.md` | this file | yes |

`diff -rq ../O157-base/tests tests` prints nothing: no test file and no allow list changed.

## What changed for a reader, before and after, for the look (C10 to C21)

Open each on a scratch server from the step's checkout.

- C10. Present view, one of open item 693's 16 slides (listed in `.scratch/migration/agents/reviews/O151-report.md`, "Fixes at landing"), text scale 1. Before: the figure runs past the frame, Too tall. After: the figure is a column at the right of the room, its whole image inside its padded, bordered box at its own proportions, its caption and explanation under it in the column and the whole box, caption included, above the foot; the text beside it at least 360 px wide; no Too tall mark on its tile, no finding. A slide whose figures with their captions do not fit at the least factor (a long explanation under a tall figure) is drawn at 0.75, its room as tall as its lowest figure box, scrolls in the pane and is marked Too tall.
- C11. A text slide of three short lines: the text at 1.25 of its design size (a body line about 30 px at text scale 1). A text slide with many lines: smaller, down to 0.75 (a body line 18 px). One with more text than fits at 0.75: drawn at 0.75, runs past the frame, scrolls in the pane, the Too tall mark on its Overview tile and the "slide too tall" finding.
- C12. One slide with a figure and one text slide, each in the pane, its Overview tile, both slides of the presenter screen, the audience window (`P`, then the window) and the print page in a browser tab (Export to PDF, the print preview): the same layout and the same text size on all six, at text scale 1 and at a text size of 1.3 set before the audience window and the print tab open. On the print page the foot stands at the page's bottom and a title slide is centred as in the pane.
- C13. A deck whose slide names a large figure, opened in a fresh print tab: the root gets `data-ready` only after the figure has loaded and the slide is laid out. A panel whose image file is corrupt (a `.png` whose bytes are no image, in a look copy): the panel is drawn as "figure missing" words with the text, and `data-ready` still comes.
- C14. A deck with every kind without figures (title, section, closing, a summary of many rows, a grid, an idea, text, columns, equation, code) and a project slide whose panels hold no image: each at the largest factor that fits, the chips, tags and the summary's table moving with the text; the project slide without figures keeps its two columns.
- C15. A project slide with a panel of `diagram_html`, one with a figure the folder lacks, and one with a figure panel and a diagram panel: the diagram and the missing words drawn with the text, the figure placed as a block with its caption under it inside the room, two figures 14 px apart (the panel's bottom margin), nothing past the frame.
- C16. Settings, raise the text size step by step on a dense slide in the pane: the text grows until the factor reaches 0.75, then the slide turns Too tall; the same on the presenter screen and a tile. The audience window and the print page take the text size the config holds when they open, as their theme does: before, both drew at 1 whatever the size; after, a window opened at 1.3 draws at 1.3, and a window already open keeps the size it opened with until it is opened again.
- C17. The rice theme on the C10 and C11 slides: the same boxes, the type at a factor of the rice sizes (52/33/26/22/17).
- C18. An image slide (`kind: image`) with a tall image (ratio about 0.5) and one with a wide image (an `eq_*.png`, ratio about 10): the tall one fills the room's height, the wide one the room's width, both centred and whole. A text slide whose Markdown opens with a level-1 heading and holds one tall image: the image no wider than the text and no taller than the room from under the heading to the foot, so the slide fits, at the factor its heading allows; before, the image ran past the frame. A columns slide with a tall image in a column: the image no taller than the room under the slide's heading.
- C19. A deck's first slide in the pane: the key hint is drawn under the slide's content in the frame's bottom margin, below the strip on a project deck's first slide, in the app's 13 px type at text scale 1, centred; a first slide with a figure fills the frame and the frame does not scroll. Before: the hint stood in the foot above the strip, at the slide's 18 px small size, and a first slide with a figure scrolled by about 44 px with the hint below the fold. The same slide on the presenter screen, a tile and the print page: the same factor and line breaks, no hint. At a text size of 1.5 the hint takes at most two lines inside the margin.
- C20. A slide whose text sits at the edge of fitting: resize the pane several times; the slide scales with the pane and its line breaks do not change, no flicker.
- C21. The research hub's decks, read only: count the "slide too tall" findings in the Findings view against open item 693's 16, and look at every figure with its caption on the Overview's tiles inside its frame.

## Edits to existing assertions

None: `diff -rq ../O157-base/tests tests` prints nothing. The step adds and changes no test.

## Head comments, doc comments and docs paragraphs that describe the changed behaviour

- `Slide.svelte` head: rewritten (the frame and gap read from the drawn figure, the caption measured at the figure's width, every figure box held to the room, the Markdown image held under the heading, the hint out of the flow in the padding); the foot and hint CSS comments: rewritten; `UNDER_PASSES`, `frameOf`, `gapOf`, `capTopOf`, `holderOf`: new doc comments.
- `Stage.svelte` head: rewritten (the hint takes no room; a slide too tall for its text or its figures with captions).
- `Framed.svelte` head and its `first` prop doc: rewritten.
- `Panel.svelte` head and `.placed` CSS comment: rewritten (the margin read as the gap).
- `Project.svelte` head: rewritten (the room's height from `place.depth`, the Markdown-only body as its room).
- `Plain.svelte` head: rewritten (every kind's Markdown box as its room).
- `Words.svelte` image CSS comment: rewritten (the room under the heading at the factor tried); head: still true.
- `slide-layout.ts` head lines 15-18, the `figures` and area comments: rewritten; `SlidePlace.depth`: new.
- `themes/slide.css` head: rewritten (the foot holds the strip; the hint keeps the factor 1).
- `routes/present/print/+page.svelte` and `routes/present/show/+page.svelte` heads: rewritten (the config installed once at opening; the text size followed by an effect).
- `Equation.svelte`, `Facts.svelte:14`, `themes/tokens.css:159`, `themes/themes.css:55`, `state/life/present.svelte.ts` (`measured`), `arrange/Tile.svelte` head: still true.
- `docs/decks.md:168` and `:434`: rewritten (round item 4).
- `docs/HELP.md:331` and `:345`: still true (see "Doc text").

## Decisions the brief did not cover, each reversible

1. A caption height is kept at the largest measured across the passes (`Slide.svelte:280-283`), so the passes only grow the heights and end; the figures are drawn at least as small as the last caption measured asks.
2. The figure frame given to the layout is the larger of the image's two axes (round item 5's choice); with the theme's equal padding and border both axes are 14 px.
3. The gap between two figures is the computed bottom margin of the first figure's box; all panels share one CSS rule.
4. The room for a Markdown image starts under the Markdown's opening heading only where the room is one Markdown field (`:scope > .block`); in a columns slide it starts at the columns' top, under the slide's heading.
5. The hint is in the app's type step `--fs-md` at the frame (13 px times the text size), its line height 1.25 and its top padding 0.5 em, so it fits the 64 px padding up to the option's top size, 1.6 (see "Wrong or impossible in the brief").
6. The project slide that draws its Markdown alone marks its body as its room, as a text slide does; Title, Section and Grid ledes and card descriptions mark none, so an image there is held to the content's room above the foot.
7. The gap between two figures, the text gap of 26 px, the text's least width of 360 px, the search's six halvings and the 0.5 px slack, the content hidden until its first layout, the probe and the transparent borders stand as in the first report.
8. Decisions 6, 8 and 15 of the first report (the chips at the factor, an image slide's title at 1.25, an image with no natural width counted as failed) stand by the round's rulings.

## Wrong or impossible in the brief

Round item 2 asks for the hint "at the frame's type scale (factor 1)" and that "it fits there at a raised text size up to 1.5". The frame's slide type scale gives the hint `--slide-fs-small`, 18 px times the text size, 27 px at 1.5. The hint is 120 characters (`config/text/views/academic/present.yml:88`); at 27 px one line of it would need an average glyph narrower than 0.33 em to fit the 1040 px column, which no sans text face has (a judgment from typical font widths, not measured), so it takes two lines, and two lines of 27 px type need at least 2 x 27 x 1.2 = 64.8 px with no padding, more than the frame's 64 px. The two conditions cannot both hold at that step, so the hint takes the app's type step at the frame, `--fs-md`, which keeps the factor 1 and follows the text size, and fits (58.5 px for two lines at 1.5). The orchestrator may rule the other way: keep `--slide-fs-small` and let the hint run past the padding at high text sizes, or cut the hint's words.

The three rounding differences of C2, C5 and C7 are under the first run.

## Limitations and sharp edges

- How many lines the hint takes depends on the font's widths, which reading the CSS does not give: two lines at 1.5 is a judgment; three lines would not fit (the look at C19 at a text size of 1.5 shows it).
- Cost, not measured: each factor tried for a figure slide now runs up to five flushes (the factor, the room's cap when it changes, the first layout, up to three relayouts when a caption grows, the room's depth when a figure ends low); an Overview of many project slides runs that for every tile when it opens. The round rules it timed at the look.
- With space-taking scrollbars, a factor tried that runs past the frame shows the frame's scrollbar during that try and narrows the reading column, which can shift that try's measure; not verified.
- The desktop host's hidden print window: the first layout runs from a microtask and an image's load or error event; not verified in the hidden window.
- An open audience window keeps the text size it opened with (round item 7's finding); a change reaches it when it is opened again.
- The first run of the 19 test files over the final tree had one failure, run under the load of other commands; its message was not kept, and the second run passed (DONE table).

## Prose

Every new and changed comment and doc sentence was read against the prose rule of `spec.md`: plain ASCII, the actual names, no contrast construction (each one found is listed under round item 6). The case-run labels ("C5 side as one block") are output of the run.

## Doc text for `docs/HELP.md`

No line becomes false. `grep -n "taller than its frame" docs/HELP.md` prints line 331, "A slide the Present view has drawn taller than its frame is listed under Findings as "slide too tall" and marked Too tall on its Overview tile, until it fits, leaves the deck or the page is reloaded.", which stays true; line 345, "The strip keeps its room while hidden, so the slide's layout and its Too tall finding do not change with the toggle.", stays true; no line of HELP places the key hint. A sentence the orchestrator may add to line 331 after its frame sentence: "A slide lays itself out in its frame: its figures by their proportions with their captions, its text as large as fits, between three quarters and one and a quarter of its design size; it is too tall only when its text, or a figure with its caption, does not fit at the least size."
