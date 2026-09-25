Everything in the brief is done. One finding outside the brief is open: the writes diagram sets 4 labels across other arrows, and no node or rank spacing clears it (details at the end).

**Open items of the state file:** none at this brief's writing. I did not read the state file, since the rules keep me out of `.scratch/` apart from the brief.

## DONE / NOT DONE (every command run from `.agents/worktrees/Q73/tools/oculus`)

| # | Check | Output |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 311 passed (311)`, `Tests 4873 passed (4873)` |
| 2 | `npm run check` | `COMPLETED 1394 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | rc=0 |
| 4 | `npm run format:check` (run as `npx prettier --check .`) | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | exits 0, no problems |
| 6 | `LC_ALL=C grep -rna '[^ -~]' src tests bin DESIGN.md HELP.md` | prints nothing (count 0) |
| 7 | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | both exit 0 |
| 8 | `npm run diagrams` twice, then `diff -r` of the two outputs | `SAME` |
| 9 | `npm run build`, then `npx playwright test` | `386 passed (6.9m)`, rc=0. Port 8792 was free, and nothing listens on it now. |
| 10 | `node bin/revert-check.mjs <112 changed test files>` | unit files: `392 reverts, 0 unproven, 1455 unchecked`; the five changed browser specs: `31 reverts, 0 unproven, 19 unchecked`; `diagrams.test.ts` after its last edit: `47 reverts, 0 unproven, 0 unchecked` |
| 11 | measuring script, before and after | quoted below: `module cycles 0`, `folder rings []` both times |
| 12 | `ls -d $TMPDIR/oculus-* \| wc -l` | 7015 before, 7015 after |

On row 10: every unchecked case is a case that already existed in a file this step touched only by a moved path or a shifted directive line. The script's exit is 1 because of those unchecked cases. Every case this step adds or changes carries a directive, and each one went red.

## Measures (the Q71 script)

Before:
```
modules 563 edges 2098
module cycles 0 []
folder rings []
views->state 477 files 155 targets 65
```
After:
```
modules 563 edges 2099
module cycles 0 []
folder rings []
views->state 478 files 155 targets 65
```
The one new edge is `CommandCenterView.svelte` importing `hasCommandRows` at run time from `state/boards/ticker.ts`, which it imported type-only before.

## Per item: what changed, and the revert that proves it

**1. State folders**
- Moves: `state/feeds/life` → `state/life`; `state/words` → `state/shared/words`; `state/stores` → `state/shared/stores`. The tests moved the same way: `tests/state/life`, `tests/state/shared/words`.
- A script (kept in the scratchpad, not in the tree) rewrote every specifier by resolving it against its old location: 340 files. Path text in comments, revert directives, `FROZEN`, `ALLOWED`, `allow-duplication.txt`, `DESIGN.md` and `HELP.md` follows.
- Grep: `grep -rnE "state/words|state/stores|feeds/life" src tests config DESIGN.md HELP.md README.md | wc -l` → `0`.
- `order.ts:48-59`: the state order is client, workbench, feeds, life, sessions, system, boards, sources, forms, shared (10 folders). `life` sits above `boards` because `life/slides.ts` imports `boards/collection.ts`.
- `order.ts:88-90`: new `INNER = { 'state/shared': ['state/shared/words', 'state/shared/stores'] }`. `findUpward` checks it, including placement (`order.ts:123-176`), and the head comment says `state/shared` is the one folder that carries an inner order.
- Cases:
  - `order.test.ts` "names an import that climbs the inner order…", revert `order.ts:169 => if (true) continue;`.
  - Placement case, revert `order.ts:89 => 'state/shared': ['state/shared/words']`.
  - Unplaced sub-folder case, revert `order.ts:126 => .filter(() => false)`.

**2. The import reader reads code only**
- `graph.ts:62-181`: new `codeOnly()`. It blanks line and block comments character for character, so indexes and lines hold. Strings, templates (with `${}` read as code again) and regex literals are kept. For a `.svelte` file only the `<script>` blocks are read.
- `runtimeImports` matches `STATEMENT` over that text (`graph.ts:196`).
- One rule for both readers: `bin/diagrams/source.mjs:10` imports `STATEMENT` and `codeOnly` from `graph.ts`, and there is no copy. `graphs.mjs:147` reads imports through it.
- `boundaries.test.ts` also now reads through `runtimeImports(..., true)`; its own raw-text `IMPORT` pattern is gone.
- Cases:
  - `cycles.test.ts` comment case, revert `graph.ts:196 => const code = text;`.
  - `cycles.test.ts` string/template/pattern case, revert `graph.ts:152 => if (previous === '') return true;`.
  - `diagrams.test.ts` "counts no import a comment names", revert `graphs.mjs:147 => const code = text;`.
  - `diagrams.test.ts` identity case, revert `source.mjs:10 =>` a local copy of the pattern.

**3. Augmentation refused whichever way it runs**
- New `tests/checks/imports/augments.ts` (`findAugments`) over `augmentations()` in `graph.ts:201-220`. It refuses any `declare module` naming a tree module (read in code-only text) and any `/// <reference path>` to one.
- The augmentation handling in `order.ts` is removed.
- `augments.test.ts` has one case per form:

| Case | Revert |
|---|---|
| src holds none | `highlight-languages.d.ts:5 => declare module './state/client/context.ts' {` |
| upward | `graph.ts:216 => ...matchAll(/(?!)/g)` |
| downward, filling an empty interface below | `graph.ts:216 => ...matchAll(/(?!)/g)` |
| across layers (component and `.d.ts`) | `graph.ts:216 => ...matchAll(/(?!)/g)` |
| reference path | `graph.ts:220 => const reference = /(?!)/gm;` |
| comment not read | `graph.ts:215 => const code = text;` |
| package allowed | `graph.ts:217 => const id = match[1];` |

**4. `BadgeClient`**
- `registry.ts:24-54`: built from `Pick<CalendarStore, 'badgeText'>`, `Pick<HpcStore, 'badgeText'>` and a 15-member `Pick<RailBadgesStore, ...>`.
- Its type imports are `../rail-badges.svelte.ts` (same folder), `../../life/...` and `../../system/...` (both below workbench).
- The duplicate `BadgeCell` declaration is dropped; it is now imported from `rail-badges`.
- No cast: `npm run check` reports 0 errors at the three `badgeOf(found, client)` call sites.

**5. The overview**
- `graphs.mjs:81-165`: `urlConstants()` follows `import(built)` where `built = new URL('../build/handler.js', import.meta.url).href`. A path under `BUILT = '../build/'` counts as an import of `routes`.
- `layers.dot` now has `"src" -> "routes" [label="1"]`, `"routes" -> "files: assets" [label="1"]` and no dashed box.
- `labels.mjs` (new): `labelsAcross()` measures each label's box against every other edge's curve and arrowhead in the rendered SVG. `settle()` tries `SPACINGS` in order, writes the first clearing spacing into the `.dot`, and throws naming the labels when none clears.
- `SETTLED` (the overview and the six layer diagrams) is laid out this way (`diagrams.mjs:69`).
- How it was checked:
  - The probe names `views->ui label 467 across shell->state` on the old committed overview.
  - It names nothing on any of the seven committed SETTLED diagrams.
  - The overview was rasterized with `rsvg-convert` and looked at.
- Cases:
  - Entry-to-routes case, revert `graphs.mjs:150 => const spec = undefined;`.
  - Asset case, revert `graphs.mjs:189 => ... return null;`.
  - `labelsAcross` case, revert `labels.mjs:100 => if (true) continue;`.
  - `settle` case, revert `labels.mjs:125 => if (across.length === -1) ...`.
  - Committed SVGs clear, revert `diagrams.mjs:69 => export const SETTLED = [];`.
- `DESIGN.md` (repository layout, Boundaries rows, order paragraph, diagrams paragraph) and `HELP.md` (lines 199-205) say what is drawn now.

**6. The last view fold**
- `anything` → `hasCommandRows(groups, week)` at `ticker.ts:600-616`. Case in `view-reads.test.ts`, revert `ticker.ts:615 => return rows > 0;`.

Moved out of the four wide ranges:

| Where | Fold | Now | Revert |
|---|---|---|---|
| `Files.svelte:173` | root keys of the current workspace, null while loading or failed | `fs-transport.ts` `rootKeysOf` | `:252`, `:253` |
| `Files.svelte:262` | bookmark titles | `bookmarkTitles` | `:258` |
| `Files.svelte:377` | workspace names | `workspaceNames` | `:244` |
| `Slides:66`, `:81` | catalog keys | `life/slides.ts` `slideKeys` | `:137` |
| `Slides:104-107` | title by key | `slideTitle` | `:143` |
| `Pages:69`, `:146` | `findIndex` of a page by id | `navigation/pages.ts` `pageAt`; `pageNameOf` reuses it | `:93` |

What stays, one reason per item:

| Where | Item | Reason |
|---|---|---|
| `Usage:103-118` | `historyRows` | Builds table rows with a row key and the catalog word "total"; the sum is already `usageTotals` in state. |
| `Usage:120` | `hasStatus` | A one-line call to the state function `hasUsageStatus`. |
| `Usage:124` | `accountId` | A card id for drawing. |
| `Usage:128-135` | `refresherReason` | Words. |
| `Usage:137-159` | `refresherText` (with its `stale` test) | Picks the words the card shows; a single field test, not a filter, sort, group, count or join. |
| `Usage:165-171` | `healthyText` | Clock arithmetic for a sentence. |
| `Usage:211-250` | markup | Percent rounding, cost `toFixed`, session id `slice`, `basename`: formatting for display. |
| `Files:268-270` | refusal reasons joined | Words from a write answer, not a store payload. |
| `Files:413` | `current.roots[0]?.key` | The form's default value, one field read; no fold. |
| `Files:443-446` | crumbs mapped to segments, and `find` by id | Segments for the Breadcrumb primitive, and the press handler. |
| `Slides:136` | `ends` | Keyboard focus interaction. |
| `Slides:155` | `indexOf` in `drop` | Drag interaction over the pane's own picks. |
| `Slides:165` | `picked.length === 0` | Guards the save press. |
| `Slides:224` | `picked.includes` | A row's checkbox state over the pane's picks. |
| `Slides:244` | `shown.length - 1` | Disables a control. |
| `Pages:96` | `shown.length + 1` | The default name's words. |

**7. The checks' own rules**
- `boundaries.test.ts` "admits the index module…" plants `$lib/data/model/index`, `../data/model/index.ts`, `model-entities` and `indexes`, and expects only the last two refused. Revert `boundaries.test.ts:147 => ... id.startsWith(...)`.
- `graph.ts:229-246`: `moduleOf` resolves `./x.js` to `x.js` when that file exists and otherwise to `x.ts`, as Vite does; the comment says so. Case in `order.test.ts`, revert `graph.ts:244 => : \`${id}.js\`;`.
- `source.mjs` `moduleFile` does the same.

## Files (line counts after)

| Status | File | Lines |
|---|---|---|
| New | `tests/checks/imports/augments.ts` | 30 |
| New | `tests/checks/imports/augments.test.ts` | 116 |
| New | `bin/diagrams/labels.mjs` | 130 |
| Changed | `tests/checks/imports/graph.ts` | 340 |
| Changed | `tests/checks/imports/order.ts` | 179 |
| Changed | `tests/checks/imports/order.test.ts` | 160 |
| Changed | `tests/checks/imports/cycles.test.ts` | 93 |
| Changed | `tests/checks/tree/boundaries.test.ts` | 592 |
| Changed | `tests/checks/diagrams/diagrams.test.ts` | 750 |
| Changed | `bin/diagrams/source.mjs` | 189 |
| Changed | `bin/diagrams/graphs.mjs` | 484 |
| Changed | `bin/diagrams/diagrams.mjs` | 193 |
| Changed | `src/lib/state/workbench/navigation/registry.ts` | 203 |
| Changed | `src/lib/state/boards/ticker.ts` | 616 |
| Changed | `src/lib/state/sources/fs-transport.ts` | 259 |
| Changed | `src/lib/state/life/slides.ts` | 144 |
| Changed | `src/lib/state/workbench/navigation/pages.ts` | 94 |
| Changed | `CommandCenterView.svelte` | 281 |
| Changed | `Files.svelte` | 531 |
| Changed | `Slides.svelte` | 324 |
| Changed | `Pages.svelte` | 299 |
| Changed | `tests/state/boards/view-reads.test.ts` | 120 |
| Changed | `tests/state/sources/fs-shape.test.ts` | 318 |
| Changed | `tests/state/life/slides.test.ts` | 190 |
| Changed | `tests/state/workbench/navigation/pages.test.ts` | 148 |
| Changed | `DESIGN.md` | 317 |
| Changed | `HELP.md` | 240 |

Also changed:
- Every `docs/diagrams/*` file.
- `tests/checks/tree/allow-duplication.txt` (paths).
- About 340 files whose specifiers or comment paths were rewritten. Comments that went past column 100 were rewrapped: tones, appearance, text, generation, glyphmode, context, socket, catalogs, themes, finding-text, hooks, Meter, Dot, theme.test, chips.test, focus-look.spec, words.ts, boundaries.test.
- Directive line numbers updated wherever a target file's lines shifted.
- `tests/state/shared/words/generation.test.ts` has its path depth fixed.

## Judgment calls (each reversible)
- The foot folder's inner order is `words` above `stores`. Neither imports the other today, so the real-tree case holds by placement, and the planted case holds the climb.
- The asset is drawn as a plain box, id `files: assets`, labelled by its folder (`assets`), outside the dashed "not placed" group, because it is a file and not an unplaced module.
- The built app is recognised by the literal folder `../build/` (adapter-node's default output) in `graphs.mjs` (`BUILT`). It is not read from the adapter configuration.
- Label spacing is searched only for the overview and the layer diagrams (`SETTLED`). The label box is estimated as 0.6 em per character. `layer-server` needed the last spacing in the list (0.7/0.8), so a future change may exhaust the list and stop `npm run diagrams` with the labels named.
- The augmentation check runs over all of `src`, not only `lib`. A `/// <reference path>` is refused on any line, not only at the top of a file.
- `boundaries.test.ts` now reads imports through the shared reader instead of its own pattern (the same defect class).
- `uncomment()` in `source.mjs` (used by the channel and write readers) is kept separately from `codeOnly()`, because channel reads are also taken from Svelte markup, which `codeOnly()` blanks.

## Host- and user-visible changes (the Help view's diagrams)
- **Overview**, before: a dashed box `src/server.ts:40 import(built)` with a dashed arrow from entry; no assets box; the 467 label across the `shell -> state` arrow. After: `entry -> routes 1`, `routes -> assets 1`, no dashed box, and no label on another arrow. The views→state count is 478 (was 477).
- **State layer diagram**: shows `state/life` and one `state/shared` box in place of `state/words` and `state/stores`.
- **Layer diagrams**: `layer-server`, `layer-state`, `layer-shell` and `layer-views` are drawn wider (nodesep/ranksep 0.7/0.8, 0.5/0.5, 0.3/0.5 and 0.3/0.5 respectively).
- To look: open Help, find the diagrams section, and check that no count sits on an arrow other than its own.

## Wrong or impossible in the brief
- Fact 3's example file `state/words/stores.ts` does not exist at this head; the tree has only `state/stores/shapes.ts`.
- The code-only reader changes no edge count in today's tree. A node run comparing raw and code-only reads found only one difference: a package name read out of a comment in `routes/views.ts`, which draws no edge.
- The reader defect itself was real; the probe cases prove it.

## Limitations
- **Writes diagram:** it sets 4 labels across other arrows, for example `feeds.ts -> file on disk` "renameSync, writeFileSync" across three `-> changes.ts` edges. No node or rank spacing up to 1.0/2.0, no xlabel/headlabel/taillabel variant and no ortho/polyline splines cleared it. `concentrate=true` does clear it, but it merges a dashed edge into solid ones, which misreads. The writes diagram is outside item 5 and is not in `SETTLED`. This needs a decision.
- **Regex literal detection:** `codeOnly()` guesses a regex literal from the preceding token. A `/` after `)`, as in `if (x) /re/.test(y)`, is read as division. Nothing in src does this today.
