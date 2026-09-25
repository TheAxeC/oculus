# Step Q73 refuter report (on .agents/worktrees/Q73, base 96786a24)

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/Q73/tools/oculus`.

| # | Command | Output |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 311 passed (311)`, `Tests 4873 passed (4873)` |
| 2 | `npm run check` | `COMPLETED 1394 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | exit 0 |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | exit 0 |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md` | prints nothing |
| 7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | both exit 0 |
| 8 | `npm run diagrams`, twice, each followed by `diff -r` against a copy taken before | no difference either time; `git status --short docs/` is unchanged |
| 9 | `npm run build`, then `npx playwright test` | `386 passed (6.4m)`. Port 8792 was free before and after (`lsof` exit 1). |
| 10 | `node bin/revert-check.mjs` over the 107 changed or added `*.test.ts` files, in three chunks | `209 reverts, 0 unproven, 418 unchecked`, then `127, 0, 613`, then `57, 0, 423`. Total: 393 reverts, 0 unproven, 1454 unchecked. |
| 10b | `node bin/revert-check.mjs` over the 5 changed browser specs | `31 reverts, 0 unproven, 19 unchecked` |
| 11 | Q71 measuring script, on a base tree rebuilt from `git diff 96786a24` and on the worktree | before: `modules 563 edges 2098`, `module cycles 0 []`, `folder rings []`, `views->state 477 files 155 targets 65`. After: `modules 563 edges 2099`, `module cycles 0 []`, `folder rings []`, `views->state 478 files 155 targets 65`. |
| 12 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before, 7015 after |

Commands I added:
- **Edge sets from the checks' own reader.** I ran `importGraph` from the base `graph.ts` over the base tree and from the new `graph.ts` over the worktree, with the moved paths mapped. The two sets differ by exactly four added edges and no removed one:
  - `R CommandCenterView.svelte -> state/boards/ticker.ts`
  - `T registry.ts` -> `life/calendar.svelte.ts`, `system/hpc.svelte.ts` and `workbench/rail-badges.svelte.ts`
- **Ground truth for the import reader.** I compared `runtimeImports(..., true)` with TypeScript's `ts.preProcessFile` over every file of src, using the `svelte/compiler` parse for the component scripts. All 2584 relative or `$lib` imports agree. The one miss is `../../../../../bin/dispatch-note.mjs` in `server/sessions/stores/dispatches.ts`, which lies above the root and is dropped by design. No component has an `import(` in its markup.
- **The report's evidence commands.** Its grep `grep -rnE "state/words|state/stores|feeds/life" src tests config DESIGN.md HELP.md README.md | wc -l` prints `0`, and the same grep over `bin`, `vite.config.ts` and `docs` also prints `0`. Its raw-read versus code-only comparison reproduces: the one difference is `routes/views.ts`, `R svelte` becoming `T svelte`. Its old-overview probe reproduces: `labelsAcross` on the base `layers.svg` gives `views->ui label 467 across shell->state`.

## 1. Spec

- **Premise 3 of the brief does not reproduce in the tree at 96786a24.**
  - Fact 3 says a comment turned a type import into a runtime edge, one edge of the overview's `state -> data` label. The base reader applied to the base tree produces no edge that the code-only reader drops: the edge-set diff above removes nothing, and `state -> data` is 53 before and after (`docs/diagrams/layers.dot`).
  - The synthetic probe does reproduce with the base `runtimeImports`, which returns `[{"spec":"../x.ts",...}]`.
  - The report says the same thing under "Wrong or impossible in the brief".
- **Item 3: a `/// <reference path>` directive gets past the check when another attribute comes before `path`.**
  - `tests/checks/imports/graph.ts:220` matches only `<reference\s+path`.
  - `augmentations()` returns `[]` for `/// <reference preserve="true" path="../shared/stores/slots.ts" />` and for `/// <reference resolution-mode="import" path="..." />`.
  - `tsc --listFiles --noEmit a.ts` follows both forms and pulls in `b.ts`. I ran it in a scratch directory with `a.ts` holding `/// <reference preserve="true" path="./b.ts" />`, and the same for `resolution-mode`.
  - Item 3 asks that "a `/// <reference path>` to a module of the tree" be refused, so this form is inside the brief.
- **Item 2: `codeOnly()` still reads some comments as code.** The brief asks that the reader stop "matching across or inside a comment". `opensPattern` (`graph.ts:151-156`) takes a `/` for a regular expression after `+`, `-` and `}`. Probes through `runtimeImports`:
  - `let i = 0; i++ / 2; // import { z } from './zz.ts';` yields `["./zz.ts"]`, an import read out of a comment.
  - `const o = { a: 1 }\n/ 2; // import './after-brace.ts'` yields `["./after-brace.ts"]`, again out of a comment.
  - A Svelte HTML comment holding a script block, `<!-- <script>import { h } from './html-comment.ts';</script> -->`, yields `./html-comment.ts`. The regex at `graph.ts:168` reads script blocks inside HTML comments, although the head comment at `graph.ts:159-162` says an HTML comment is blanked.
  - The report names only the `if (x) /re/` case as a limitation.
  - None of these forms occurs in src today (see the ground-truth comparison above).
- **Item 2: dynamic imports in Svelte markup are dropped.** `codeOnly(text, true)` blanks everything outside `<script>`, so `{#await import('./markup.svelte') then M}` reads as no import: the probe returns `["./a.ts"]` only. The comment at `graph.ts:160-161` says "no import is written there", which Svelte syntax does not guarantee. None occurs today. If one were written, the boundary and order checks would not see it, and neither would the diagrams.
- **Item 5 is marked done, but its criterion fails on two layer diagrams.** Item 5 asks for no edge label across another arrow, and the report applies it to every diagram in `SETTLED`. See Proof: `layer-server.svg` and `layer-views.svg` each carry a label across another arrow.
- **Item 6: the "stays" list is not complete item by item.** Folds and reads inside the four ranges that the list does not name:
  - `Slides.svelte:115` (`next.order.length`, in words)
  - `Slides.svelte:179` and `:187` (`rows.length === 0`)
  - `Usage.svelte:176`, `:209` and `:224` (`.length` conditions in the markup)
  - `Files.svelte:438` and `:452`

  The reasons given, judged:
  - `Usage:103-118` `historyRows` maps a store payload to rows with a joined key and appends a total row. That is a reshape of a payload. Only the word `t('usage.total')` belongs to drawing, and it could be passed in. The reason "builds table rows" does not cover the reshape.
  - `Usage:165-171` `healthyText` works out the next refresh time from `lastRefresh + cadence`. That is a fact about the payload, not formatting. The reason "clock arithmetic for a sentence" is weak.
  - `Usage:137-159` `refresherText`, with its `stale` test, is borderline and acceptable.
  - The remaining reasons (words, interaction state, a card id, a single-field default) hold.
- **A change no item names.** `tests/checks/tree/boundaries.test.ts:157` now reads through `runtimeImports(..., true)` instead of its own `IMPORT` pattern. This falls within item 2's aim and the report states it. I list it only because no item asks for it. The boundary result on src is unchanged (`[]`).
- **Item 4 holds.** `registry.ts:30-51` is built from Picks of `CalendarStore`, `HpcStore` and `RailBadgesStore`, with no cast (`grep -rn "as unknown as" src` has no hit in navigation). Its type imports point to the same folder (`rail-badges.svelte.ts`) or below it (`life`, `system`). `BadgeCell` had no importer from the registry in the base tree.
- **Item 7 holds.** The `/index` case is at `boundaries.test.ts:513-527`. For `./x.js`, `moduleOf` (`graph.ts:237-252`) picks `x.js` when that file exists and otherwise `x.ts`, as Vite does, and `moduleFile` in `source.mjs:127-133` does the same. `order.test.ts:147-158` covers it, and it went red under its revert.
- **The inner order for `state/shared` holds.** `INNER` is at `order.ts:88-90` and the check at `order.ts:161-175`. No real import runs between `words` and `stores` (`grep -rn "stores/\|words/" src/lib/state/shared` finds no cross import), so `words` above `stores` is a free choice. The planted climb goes red under `order.ts:169`, and the placement of sub-folders is checked. `innerOf` sends a file lying directly in `state/shared/` to `state/shared`, which the placement check reports as not placed.

## 2. Proof

- **`labelsAcross()` misses labels that do sit across an arrow.**
  - **Cause.** `bin/diagrams/labels.mjs:33-47` tests 41 sample points per Bezier segment against a label box about 5 pt wide. Graphviz segments here run 100 to 170 pt, so the points fall 4 to 5 pt apart and step over the box.
  - **Measurement.** I used the builder's own box (0.6 em per character, from 0.8 em above the baseline to 0.2 em below) with 400 points per segment and 20 per chord. Two committed diagrams in `SETTLED` fail:
    - `layer-server.svg`: `folder server/edit->folder server/files label 2 across folder server/machine->folder server/core`. The machine->core curve enters the label box at t=0.3055, point (327.58,-512.78); the box is x 324.4 to 329.2, y -512.8 to -504.8.
    - `layer-views.svg`: `folder views/boards->layer ui label 85 across folder views/sources->layer state`.
  - **Rasterised.** `rsvg-convert -z 6` and a crop show the machine->core line running through the top-left of the "2", and the views/sources->state dashed line touching the "85".
  - **Consequence.** The test "are clear of every other arrow in the committed overview and each layer diagram" (`diagrams.test.ts:701-710`) passes over both, and `settle()` accepted these layouts as clear.
  - **Fix.** Test each segment of the curve for intersection with the box, or sample by arc length. Either would turn this case red today.
- **`settle()` leaves little margin, so it will throw on a future change unrelated to the diagrams.**
  - **Measurement.** For each committed `.dot`, the number of crossed labels that `labelsAcross` reports at each of the ten `SPACINGS`:

    | Diagram | Crossed labels per spacing, in list order |
    |---|---|
    | `layer-server` | `3 1 2 3 2 2 1 1 2 0` |
    | `layer-state` | `2 2 1 0 2 2 0 0 1 0` |
    | `layer-views` | `3 0 1 0 1 1 1 1 0 0` |
    | `writes` | `4 5 5 5 4 5 5 5 5 4` |

  - `layer-server` clears only at the last spacing, and only because of the sampling fault above.
  - `generate()` feeds `staleFiles()` (`diagrams.mjs:164-176`), so a throw also breaks `npm test` through the freshness case.
  - The next import added to the server layer is likely to exhaust the list, and `npm run diagrams` plus the freshness test will then fail for a reason unrelated to that change.
  - The report records this as a judgment call. By the rules file it is a named risk left unfixed and not stated prominently.
  - The 0.6 em width is a sound conservative bound for digit labels (Helvetica digits are 0.556 em). The width is not what makes the check miss; the sampling is.
- **The unit revert-check counts in the report do not reproduce.** The report gives `392 reverts, 0 unproven, 1455 unchecked`. My run over the same 107 unit files gives 393, 0 and 1454. The browser count `31, 0, 19` reproduces, and so does `diagrams.test.ts` with 47 red.
- **The report cites wrong line ranges in `graph.ts`.**
  - It gives "graph.ts:62-181 new codeOnly()". `blankComments` is at 70-144 and `codeOnly` at 164-176.
  - It gives "augmentations() in graph.ts:201-220". The function is at 206-227.
- **Each new case I checked goes red under its named revert.** These are the cases in `augments.test.ts`, the `cycles.test.ts` reader cases, the `order.test.ts` inner, placement and `.js` cases, `boundaries.test.ts` `/index`, the `diagrams.test.ts` new cases, `view-reads`, `fs-shape`, `pages` and `slides`.
- **What the step's own cases do not cover.** None of them covers:
  - the `++` or `}` mis-lexing
  - the reference directive with a leading attribute
  - markup `import()`

## 3. Standards

- **DESIGN.md and HELP.md say something the drawings do not do.**
  - `DESIGN.md` says: "laid out at the first node and rank spacing that sets no count across an arrow other than its own", and that the test "fails on a committed overview or layer diagram that sets a label across another arrow".
  - `HELP.md:205` says: "The overview and the layer diagrams are spaced so that no count sits across an arrow other than its own."
  - Both are false for `layer-server.svg` and `layer-views.svg` (see Proof).
- **A DESIGN.md sentence is too broad.** DESIGN.md says: "Every check reads a module's code alone, its comments blanked". `findGlobalState` (`boundaries.test.ts:188-214`) still tests raw text for `globalThis` and `declare global`. The sentence holds only for the import, order, cycle and augmentation checks.
- **Comments in `graph.ts` claim more than the code does.**
  - `graph.ts:159-162` says an HTML comment is blanked and that no import is written in markup. Neither holds in general (see Spec).
  - `graph.ts:229-230` still says "in the order the bundler tries them", and this step rewrote that block. For an extensionless specifier `moduleOf` tries `''`, `.ts`, `.js`, `/index.ts`, while Vite's default order puts `.js` before `.ts`. `vite.config.ts` sets no `resolve.extensions` (grep prints nothing).
- **New asserted absences with no reason comment directly above them:**
  - `tests/checks/imports/cycles.test.ts:71` and `:72`
  - `tests/checks/diagrams/diagrams.test.ts:682` and `:709`
  - `tests/state/sources/fs-shape.test.ts:313` and `:314`
  - `tests/state/workbench/navigation/pages.test.ts:145`
- **`labels.mjs:30-31` does not explain its 0.6.** The comment names Helvetica's 0.556 but does not say why 0.6 is used instead.
- **Clean:**
  - No history in the added comments (grep of the added comment lines for was, previously, now, before, moved and renamed: no history hit).
  - No added comment past column 100 other than revert directives (awk over the added comment lines).
  - Every file is under 900 lines (`diagrams.test.ts` is the largest at 750).
  - Every folder is within ten items (`folder-check.sh` exits 0).
  - No old path is left (the greps above print 0).
  - The moved files are identical apart from path rewrites, rewrapped comments and the new `slideKeys` and `slideTitle` (`diff` of each deleted file's base text against its new location).
- **The `bin/` to `tests/` dependency.**
  - `bin/diagrams/source.mjs:10` imports `tests/checks/imports/graph.ts`, which imports only `node:fs` and `node:path`. `npm run diagrams` therefore runs without vitest.
  - The dependency is on Node's built-in type stripping instead: `node --no-experimental-strip-types bin/diagrams/diagrams.mjs` fails. `package.json` has no `engines` field. `bin/migrations/rename-program-to-pillar.ts` already relied on this.
  - As a direction, a Layer 4 tool depending on a Layer 4 test helper is acceptable. But the reader is shared code with two consumers and belongs somewhere neutral rather than under `tests/`.
  - The identity test (`diagrams.test.ts:118-123`) holds the two readers to one object.

## 4. Behaviour

- **The report states an "after" for the Help view's diagrams that does not hold.** For the overview, "no label on another arrow" holds: dense check, 0 crossings. The report's instruction "check that no count sits on an arrow other than its own" will fail on the server layer diagram (label "2" of edit->files over the machine->core arrow) and on the views layer diagram (label "85"). The report gives no before and after for these as crossings.
- **Unstated: `npm run diagrams` now needs a Node version with type stripping on by default.** It is on by default from 22.18 or 23.6 (not verified on older versions). Before this step the command imported no `.ts`.
- **Unstated: `npm run diagrams` and `npm test` can now fail on layout alone.** A new import can make `settle()` throw even when the drawing would be correct otherwise. The report mentions this as a judgment call, not as a host-visible change.
- **The writes diagram.** Its four crossed labels are outside item 5: the item is headed "The overview", and fact 9 names only the overview. The report states this.
  - I confirmed that spacing does not fix it. With `labelsAcross`: nodesep/ranksep 0.2/1.0 gives 4, 0.3/1.5, 0.4/2.0 and 0.5/3.0 give 3 each, `rankdir=TB` gives 3, `headlabel` gives 12, `xlabel` with `forcelabels` gives 19, and one sink node per edge gives 9.
  - A fix has to change what carries the label: draw each call list as a small plaintext node on its edge, which Graphviz routes around. A rough probe of that left 1 near-touch, so it is not verified. The builder reports that `concentrate=true` clears it but merges edge styles; I did not verify that.
- **The other visible changes the report states match the diff:**
  - `layers.dot` has `src -> routes 1` and `routes -> assets 1`, no dashed box, and `views -> state` at 478.
  - `layer-state` shows `state/life` and `state/shared`.
  - The spacings in the `.dot` headers: server 0.7/0.8, state 0.5/0.5, shell 0.3/0.5, views 0.3/0.5.

## Not checked

- I did not look at the drawings on the TEST page in Chrome. I only rasterised them with `rsvg-convert`.
- `concentrate=true` on the writes diagram, and the label-as-node fix, were not verified.
- Whether `npm run diagrams` runs on Node versions below 24 was not verified; only `--no-experimental-strip-types` on Node 24.21.0 was run.
- I did not open the orchestrator's state file.
- An `rc_ad.txt` file with a revert-check summary (`73 reverts, 0 unproven, 586 unchecked`) appeared in my scratchpad without my creating it. I excluded it from every count above.

Reviewer usage: about 75 tool uses and roughly 50 minutes, most of it the revert-check runs (about 20 minutes) and the playwright suite (6.4 minutes). I have no exact token count, only an estimate of about 230k tokens.
