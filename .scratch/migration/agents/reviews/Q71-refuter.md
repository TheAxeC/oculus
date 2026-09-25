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

## Repair round 1, refuted

I ran every command from `.agents/worktrees/Q71/tools/oculus`.

- `npx vitest run --reporter=dot`: `Test Files  310 passed (310)` / `Tests  4852 passed (4852)`
- `npm run check`: `COMPLETED 1391 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md | wc -l`: `0`. The spec's perl gate over src, tests, bin and config also prints 0 lines.
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
- `npm run diagrams`, twice. I copied `docs/diagrams` before run 1 and after it; `diff -r` of the before copy against run 1, and of run 1 against run 2, both print nothing (`identical`).
- `npm run build`, then `npx playwright test --reporter=line`: `386 passed (6.1m)`. Port 8792 was free before and after the run.
- `node bin/revert-check.mjs` over the 132 test files the round changed or added (`git diff 66e11387 --name-only` plus the untracked `view-reads.test.ts`):
  - Unit files, 8 batches: 90 + 30 + 71 + 39 + 19 + 98 + 45 + 15 = **407 reverts, 0 unproven**, 0 GREEN.
  - Browser specs, one at a time: rail 27, notices 7, repositories 2, files-forms 14, files 7, unsaved-forms 13 = **70 reverts, 0 unproven**, 0 GREEN.
  - Every closure the reply names is red: `order.test.ts` data (`career.ts:12`), server (`poll.ts:38`), type-only (`order.ts:114`) and module-ending (`graph.ts:87`); `cycles.test.ts` walk order (`graph.ts:169`); `graph.test.ts` (`graph.ts:353`); `diagrams.test.ts` template literal (`graphs.mjs:107`), lost-import arrow (`graphs.mjs:173`) and entry node (`graphs.mjs:148,154`); `view-reads.test.ts` all six; `card.test.ts` (`card.ts:31`).
- The measuring script, saved in the scratchpad: `modules 563 edges 2099` / `module cycles 0 []` / `folder rings []` / `views->state 477 files 155 targets 65`. This matches the reply.
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before all runs and 7015 after.

I reran every command the reply quotes as evidence:
- `ls src/lib/data/model.ts`: "No such file or directory".
- `grep -rlE "model/index(\.ts)?['\"]" src tests bin | wc -l`: 245.
- `grep -rlE "words/stores" src tests | wc -l`: 23.
- `node bin/cited-lines.mjs <note citing src/lib/server/core/git.ts:121>`: `src/lib/server/core/git.ts:121 | export function statusFor(...)` and `1 cited lines, 0 missing`.
- `duplication.test.ts`: `Tests  9 passed (9)`.
- `writes.svg` is `1296pt` x `569pt`; `layers.svg` is `436pt` x `298pt`.
- Main's `tests/browser/sources/files-forms.spec.ts:416,555,588` name `fs.svelte.ts:682`. On main, :679 is the `for (const one of forms.browsers())` loop and :682 is `forms.shift(...)`. The claim holds. In the worktree the loop is at :678 and the directives say 678.

### 1. Spec
- **`src/lib/state/words/stores.ts`: it is not a words concern.**
  - It holds the shapes of `EntitiesStore`, `ClockStore`, `SocketStore`, `WritesStore` (about 30 methods), `SessionFields`, `SubtaskTarget` and `InstanceStates`.
  - Everything else in `state/words` is catalogs, text, tones, themes, format and generation.
  - The head comment (`stores.ts:7-8`) justifies the placement only by the folder order: "They sit in state/words, the foot of the state layer's folder order".
  - `src/lib/state` holds ten folders (`ls src/lib/state`), the folder limit, so a store-shapes folder at the foot of the order would need a split. The reply does not raise this as a judgment call.
  - DESIGN.md and HELP.md were rewritten to call "the shapes of the stores" part of `state/words`, so the documents now describe the misplacement as the design.
- **`state/workbench/navigation/registry.ts:25-26` with `state/client/context.ts:83-86`: the `BadgeClient` declaration merge meets finding 2 only in its letter.**
  - The round asked the lower folder to declare the shape it needs and the upper store to satisfy it.
  - Instead, the registry declares an empty `interface BadgeClient {}`. The composition root augments it (`declare module '../workbench/navigation/registry.ts' { interface BadgeClient extends ClientState {} }`), so the registry's hook type is again the whole `ClientState`.
  - The dependency on `state/client` is still there. The order check cannot see it, because it reads import statements and a `declare module` block is not one.
  - It needed two eslint exemptions (`consistent-type-definitions`, `no-empty-object-type`) at `context.ts:84` and `registry.ts:25`.
  - The hooks read a few stores (for example `client.calendar`, `client.railBadges`). A declared shape of those stores in the lower folder was the fix asked for.
- **`bin/diagrams/graphs.mjs:171-176` and `docs/diagrams/layers.dot`: the overview still draws a node that is not a layer.**
  - The node is `"? src/server.ts:40" [label="src/server.ts:40 import(built)", style=dashed]`, with the dashed arrow `"src" -> "? src/server.ts:40"`.
  - The round asked for one node per layer, with an entry node allowed. This is the item the first refuter called clutter, moved out of the "not placed" group into a dashed box of its own. It is not removed.
  - The overview now draws a lost import one way and the channel and write diagrams another (DESIGN.md:174, HELP.md:199).
  - The target is the built Kit handler (`src/server.ts:39`, `../build/handler.js`), which is the routes. An entry-to-routes arrow was available and was not considered in the reply.
  - The entry node itself (`"src" [label="entry"]`) is as the round allowed, and the reply reports the choice.
- **`layers.dot`: the `routes -> assets` import (count 1) is no longer drawn, because `end()` returns null for a non-module file (`graphs.mjs:148`).**
  - The round's premise called `assets` "a node with no arrow", but it had one.
  - Dropping a real import from the counts is a choice. The reply states it as "the favicon draws nothing" without saying that an arrow went with it.
- **The "stays in a view" list treats the same construct two ways.** `Tasks.svelte`'s `anything` was moved to `hasTasks` (finding 3). `CommandCenterView.svelte:53-63` `anything` is kept under "Rows built for drawing from state's own groupings", although it sums `.length` over the week groupings and tests `week?.behind`, a payload field.
- **The sweep's line ranges are too wide to check.** The kept list gives `Usage.svelte:104-249`, `Files.svelte:174-445`, `Slides:66-244` and `Pages:69-146` as single rows with one reason each. The quoted "463 hits" cannot be reproduced, because the reply does not give its pattern; my closest grep gives 455.
- **The disclosed `git -C . status >/dev/null 2>&1` breaks `spec.md`** ("You never run a git command. Not ... `status`"). It was read-only and discarded, and the reply discloses it.
- **The views per-layer case (`order.test.ts:66`) still reverts an edit of the list (`order.ts:62`), not a move.** The round did not reopen it, so this is noted only.

### 2. Proof
- **The type-only server revert (`order.test.ts:42`) is honest as far as it goes.**
  - It names the pre-move folder (`server/root/watch`, where `server/watch` now sits) and is red.
  - It is `import type` of three values (`POLL`, `pollFile`, `systemClock`), so the revert does not compile. It proves the order check sees a type-only upward edge, not that a runtime import back would be refused.
  - The comment above it gives the reason. `vite.config.ts:8-9` loads `server/root/vite-plugin.ts`, which imports `../accounts/mail/poll.ts` at :35, which supports that reason.
- **`boundaries.test.ts:148`: `matches()` gained `|| id === \`${pattern}/index\``.**
  - This widens every row, not only `data/model`. For example, the shell row `state/workbench/layout` now also admits `state/workbench/layout/index`.
  - It is equivalent to what a bare `.../layout` specifier already resolved to, so I found no import it newly lets through.
  - No case plants an `/index` specifier to prove the widening covers only the index module. The comment above says it does.
- **`graph.ts:87` `moduleOf`'s new ending rule has a case (`order.test.ts:108-121`, red).** It turns `.js` into `id.js` as well, and nothing tests that half. Its comment's "as the bundler reads it" is false for `.js`: Vite resolves `./x.js` to `x.ts`. No import under src writes `.js` (`grep -rnE "from '[^']*\.js'" src` finds only the `highlight.js` package).

### 3. Standards
- **Sentences the round made false (the round deleted `data/model.ts`):**
  - `src/lib/data/model/model-collections.ts:2` "while model.ts remains the public facade"
  - `model-entities.ts:2`, same words
  - `model-mail.ts:4` and `model-calendar.ts:5` "through the model.ts facade"
  - `src/lib/data/snapshot/normalise.ts:6` "the fields model.ts declares"
  - `src/lib/data/sources/registries.ts:19` "declared with the other types in model.ts"
  - The command is `grep -rnE "\bmodel\.ts\b" src` minus the `workbench/layout` hits. The reply quotes no grep of the old name.
- **`tests/state/boards/view-reads.test.ts:6-7`, the head of a new file:**
  - It names `tests/views/boards/collection.test.ts`, which does not exist (`ls`: "No such file or directory"; it is the folder `tests/views/boards/collection/`).
  - It lists what the file covers without `unfundedBy`, whose case "counts a live project no entry of the funding file covers" is in the file.
- **History in comments:**
  - `order.test.ts:36` "The model's facade moved to data/model/index.ts, ..."
  - `order.test.ts:39` "... where it sat before the move."
- **Comments past column 100:** `src/lib/state/client/context.ts:84` (193 columns) and `src/lib/state/workbench/navigation/registry.ts:25` (193 columns), both the eslint-disable lines of the declaration merge. Other eslint-disable lines of that length are already in the tree.
- **`src/lib/server/core/json.ts:1-4`:** the head describes JSON reading and writing and the type guards. It does not mention the write chain (`FsWrites`, `fsWrites()`) the round moved in at :108-119.
- **`src/lib/server/files/open.ts:30-32`:** `import type { Opener }` sits after a blank line below the other imports and is re-exported with `export type { Opener }`, a form the head comment does not explain.
- **The saved `Q71-report.md` still carries the old figures in the step body:** `writes.svg 1225 x 519 pt` at :179, and 360 unit / 118 browser reverts at :26. The corrections are only in the reply. The host before/after is under reply item 11, not in the "Changes a host or user can see" section at :151.
- No non-ASCII, no file over 900 lines, and no folder over ten items. Commands: the perl gate, `size-check`, `folder-check`, and `wc -l` of the grown state modules, the largest being `collection.ts` at 815.

### 4. Behaviour
- **The Help view's overview diagram changed in the round, and the reply gives the new dot but no before and after for the view.**
  - Before: a "not placed" group with `assets`, `highlight-languages.d.ts` and the lost import, and an unlabelled `src` node.
  - After: an `entry` node, a dashed lost-import box with a dashed arrow, and no `routes -> assets` arrow.
  - Counts also moved: `views -> state` 471 to 477, `views -> ui` 470 to 467, `state -> data` 53 to 54.
- The per-layer diagrams `layer-server`, `layer-state` and `layer-views` changed labels only (for example `server/root -> server/core` 6 to 7, `views/structure -> ui` 33 to 29). The reply does not list them.
- The Domains and Pillars fold (`RegistryHead.svelte`, `SourceToolbar.svelte`, also used by `Data.svelte`) keeps the same markup order and the same `.said` rules: colour and font size, plus `margin: 6px 0 0` in Pillars through `spaced`. I found no visible change, and the browser suite passes.
- The host info is read once at server start (`server/root/context.ts:212`; `+page.server.ts:42` reads `locals.server.host`). The reply states this with before and after. No route imports `root/context` (`grep -rn "root/context" src/routes` prints nothing).

### Not checked
- The builder's revert totals over all 190 test files since main (525 unit, 158 browser). I ran revert-check only over the 132 files the round changed.
- The rendered look of the redrawn overview and the per-layer diagrams in the Help view, in either theme.
- A full reread of every kept item in the sweep list. I sampled Recent, Capacity, Summary, Venues, Data, Leads, CardLinks, CommandCenterView, Tasks, Repositories and sessions Changes, and grepped for view files with folds that the list never names; that grep found only `LaneCard.svelte:93`, a markup slice.
- The first 56 and the 38 upward type imports. The reply says they cannot be rerun. The present 0 rests on `order.test.ts` passing with type-only imports counted.

Reviewer usage: tokens not known; about 50 tool uses; about 75 minutes, most of it the revert-check and browser runs.
