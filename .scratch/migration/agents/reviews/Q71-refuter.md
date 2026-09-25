# Step Q71 refuter report (on .agents/worktrees/Q71, base 28a63283)

## Verification (rerun by the reviewer)
All commands were run from `.agents/worktrees/Q71/tools/oculus`.
- `npx vitest run --reporter=dot`: `Test Files  309 passed (309)` / `Tests  4829 passed (4829)`
- `npm run check`: `COMPLETED 1387 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md | wc -l`: `0`. The spec's perl gate over src, tests, bin and config also prints 0 lines.
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0. Both scripts count untracked files (`git ls-files -co`).
- `npm run diagrams` run twice: I copied `docs/diagrams` before the first run and after it. Both `diff -r` comparisons print nothing, so the committed tree equals run 1, which equals run 2.
- `npm run build`, then `npx playwright test --reporter=line`: `386 passed (6.0m)`. Port 8792 was free before and after the run.
- Measuring script, saved in the scratchpad:
  - On main at b282238f, whose src is identical to 28a63283 (`git diff --stat 28a63283 b282238f` touches only `orchestrator-state.md`): `modules 557 edges 2069`, `module cycles 2 [...local.ts, merge.ts], [...focus-lanes, ticker, feeds, rail-badges]`, the three folder rings as the report quotes them, `views->state 449 files 153 targets 57`.
  - On the worktree: `modules 560 edges 2094` / `module cycles 0 []` / `folder rings []` / `views->state 471 files 153 targets 64`. Both runs match the report.
- `node bin/revert-check.mjs` over every added or changed test file (124 files), in batches:
  - unit: 12 + 32 + 31 + 38 + 124 + 129 = **366 reverts, 1 unproven**. The one is `GREEN tests/state/boards/structure/graph.test.ts :: list the configured types first, then the rest by name, each counted over the drawn graph (revert src/lib/state/boards/structure/graph.ts:353)`. A rerun of that file alone reproduced it: `4 reverts, 1 unproven`.
  - browser: 8 + 36 + 21 + 25 + 28 = 118 reverts, 0 unproven.
- `npx vitest run tests/checks/imports`: `Tests  11 passed (11)`.
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before all runs and 7015 after.
- Brief facts rechecked against base: 374 arrows in `layers.dot`, 58 views-to-state arrows, `layers.svg` 4981x986, `boundaries.test.ts` 600 lines, 10 items in `tests/checks/tree`. All reproduce.

## 1. Spec
- **`tests/checks/imports/order.ts:24`: the data order puts `data` (`index.ts` and `model.ts`) at the top and `data/model` at the bottom.**
  - The barrel `index.ts` belongs at the top, since it runtime-imports sources, snapshot and helpers.
  - `data/model.ts` is a 419-line type-only facade that every lower data folder imports: `data/sources` 14 times, `data/snapshot` 3, `data/helpers` 1 (my type-edge walk).
  - So the shared model sits above its importers, and the order holds only because type-only imports are not counted.
  - The head comment at `order.ts:8-10` says the shared modules "sit at its foot (... `data/model` ...)". That is true of the folder but false of `model.ts`. `DESIGN.md` now says "LAYER 1, top down: index.ts and model.ts, sources/, ...".
  - An honest order needs `model.ts` moved into `data/model/` (for example `data/model/index.ts`) and its about 270 import specifiers rewritten. That is mechanical work of the kind this step already did.
- **`order.test.ts:33` (data) and `:63` (views): the per-layer revert is an edit of the check's own list, not the revert of a move, as brief item 2 asked.** The builder's comment says no move was needed in either layer. I checked the views layer: its groups have no edges between them, so any order of the groups passes. This is disclosed in the test comment but not in the report's DONE row.
- **Item 3: the measure is not complete.** Computations over store payloads with nothing of drawing in them, listed neither as moved nor as kept:
  - `src/lib/views/system/findings/Findings.svelte:31`: `found` joins `portfolio().findings` and `config().findings`.
  - `src/lib/views/sources/repositories/Changes.svelte:58`: `total` counts staged, unstaged and untracked over the git payload.
  - `src/lib/views/boards/focus/Tasks.svelte:40-55`: `groupOf` and `view` group the ticker's `week.tasks` into followups, subtasks and tasks; `anything` counts them.
  - `src/lib/views/boards/focus/Focus.svelte:64` and `focus/lanes/Lanes.svelte:59`: `Object.values(snapshot.entities.projects)`, the same reshape in two views.
  - `src/lib/views/shared/changes/repo-shape.ts:24`: `repoShape` classifies a `GitState` payload.
- **Item 3: one "stays in a view" reason does not hold.** `src/lib/views/system/gallery/Gallery.svelte:77-87` (`rows`) groups `chipKeys()` by tone and counts each group. The chip label is incidental, so this is a group-and-count over the vocabulary payload, not "words or pixels".
- **`vite.config.ts` is edited outside the step's path list** (import lines :8-9 and the head comment :3). The edit was needed for the move and the report states it.
- **The overview keeps a dashed "not placed" group** (`docs/diagrams/layers.dot`): `assets`, `highlight-languages.d.ts` (a node with no arrow) and `src/server.ts:40 import(built)`, plus nodes for `routes`, `src` and `themes`. The brief asked for one node per layer. These nodes are clutter of the kind Axel asked removed from the writes diagram. The report does not mention them.
- `+page.server.ts` and the routes are clean of the composition root. `grep -rn "server/root" src/routes` finds only `config-seed` (`+page.server.ts:2`) and `root/hooks` (`api/(sessions)/hook/+server.ts:5,7`); nothing imports `root/context` except `hooks.server.ts`, `app.d.ts` (type) and `server.ts`.

## 2. Proof
- **`tests/state/boards/structure/graph.test.ts:429-441` stays green under its own revert** (`graph.ts:353`, which drops `.sort()`). The report claims 0 unproven across the unit files; my run gives 1. The fixture's leftover types, `active` and `dropped`, are already in name order, so "the rest by name" is not proven. This case is new: `typeFilters` moved here under item 3.
- **The report's revert total is 360 unit reverts; my run gives 366.**
- **`tests/checks/diagrams/diagrams.test.ts`: the case "names an import through a template literal with its file and line" was deleted.**
  - The behaviour still exists: `bin/diagrams/graphs.mjs:101` now matches `(?!['"])`, which catches a backtick specifier.
  - No other case plants a template-literal `import()`, so that path lost its only coverage. The report does not say so.
- **`order.test.ts:39`: the "server" revert plants a new upward import** (`import '../../root/watch/git.ts'`) rather than pointing `file-poll` back at its old folder. It is red, but it proves the order check, not the `file-poll` move.
- **`tests/checks/imports/cycles.test.ts:36-50`: the only revert of the cycle-naming case is the type-only skip** (`graph.ts:61`). Nothing reverts the walk order in `walk()` at `graph.ts:147-166`, so "names the modules ... in order" is not proven under a revert.

## 3. Standards
- **`bin/cited-lines.mjs:13`** still gives `src/lib/server/git/git.ts:350` as its example citation, a path the step removed. The report states it and left it because it is outside the step's paths. It is still a sentence the step made false.
- `docs/diagrams/writes.svg` is 1296 x 569 pt (`width="1296pt" height="569pt"` on its root element). The report says 1225 x 519 pt. I found no other size mismatch: `layers.svg` 566x337 and `layer-state.svg` 577x680 match the report.
- **`tests/checks/tree/allow-duplication.txt`: a new duplicate is allowed, not folded.** The Domains/Pillars entry was rehashed from `cfb838b73c14` to `faabb7977ab6 ... at 61 and 79`, and that block is the item-3 `entryFor` wrapper in both views. Item 3 could have folded it (both views call `entryById`). The report presents this as the existing pair "updated".
- No other standards finding:
  - Head comments: all 14 new test files without a "Layer" head carried the same head on main.
  - Old module paths: grepping every old path across src, tests, bin, `DESIGN.md`, `HELP.md` and `vite.config.ts` leaves only `bin/cited-lines.mjs:13`. The `client/instance` hits are `client/instance-context`, which did not move.
  - Comment lines over column 100 on added lines are all `revert:` directives.
  - No package ids or dates appear in added comments.

## 4. Behaviour
- **The status bar's host moved from per request to once per server start** (`server/root/context.ts:217`, `hostInfo(local.port)` in context creation; before, `+page.server.ts` called `hostInfo(locals.server.local.port)` on every load). The machine name is now read once at startup. The report's before/after section does not say so; in practice it has no visible effect.
- **The tooltip counter is now made by `+page.svelte:44`** (`provideTipIds(createTipIds())`) instead of being held on `ClientState`. The lifetime is the same (one per page mount), and the report states the change.
- The Help view's diagrams go from 3 to 9, as the report states. The browser case at `system.spec.ts:70` asserts `NAMES.length` figures and passes.

## Not checked
- The rendered look of the nine diagrams, including legibility at the Help view's width, in either theme. The report did not view them either.
- Whether each folder of the per-layer diagrams shows exactly one labelled arrow per other layer it reaches. I read `layer-server.dot` whole; for data, state, ui, shell and views I grepped the layer arrows only.
- A full inventory of item 3 over every `.svelte` script. My sweep was a grep for filter/sort/reduce/find/some/every/groupBy/fromEntries calls and for `$derived` expressions over collections (`.length`, `.map`, `Object.values` and the like). A loop-based fold outside those patterns could still be missed.

Reviewer usage: tokens not known; about 75 tool uses; about 95 minutes, most of it the revert-check and browser runs.
