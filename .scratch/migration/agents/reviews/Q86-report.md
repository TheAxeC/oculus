# Q86 report: the Map laid out by Graphviz's neato in the page (after repair round 1)

Everything in the brief, the cases ruling and repair round 1 is done. The verify list's `checks.sh` stops at `npm test` on `tests/checks/tree/scratch.test.ts`, a file this step does not change. It fails when run alone on a file in the system temporary directory that this step did not write (cases ruling item 5). Every command after it was run one by one and is quoted below.

## Open items of the main checkout's state file (verbatim)

### Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z45, Q87's import-graph half cannot rest on dependency-cruiser as LA11 (a) assumed (raised 2026-09-29, by the orchestrator at `/spec` Q87). Probed on main at 703aec66 with dependency-cruiser 18.4.0 (MIT, 2026-09-20) in a scratch folder: it resolves `$lib` (with the alias given) and reads an `import()` in a component's markup as a dynamic import, as the plan asked to prove. But it compiles every `.svelte` file with the Svelte compiler before reading it (`src/extract/transpile/svelte-wrap.mjs`), so a component's type-only imports never reach it. Over `src/lib` the hand reader (`tests/checks/imports/graph.ts` `importGraph(..., true)`) finds 2877 import edges and dependency-cruiser finds every one of them except 199, all from `.svelte` files, 198 of them `import type` and one an inline `{ type Tab }` (`ui/tabs/TabFace.svelte:19`). The folder order (`order.ts`) and the boundary rows (`boundaries.test.ts`) read type-only imports, by DESIGN.md:174 ("a type a folder takes from a folder above it ties the two as an import does"). The runtime edges agree. `bin/diagrams/imports.mjs` stays whichever way, since `code.mjs` and `parsed.mjs` read comments and calls through its parses. The jscpd half works: jscpd 5.3.3 read 1255 files of `src/lib` in 1.6 s and found 132 clones at eight lines, a component split into its script, markup and style blocks. Options:
  - (a) Keep the import checks hand-written (LA11 (c)), and Q87 is the duplication check on jscpd alone (LA12 (a)); Q72's measures run through the hand checks. Pros: every check keeps reading every import, types in components included, through one reader for the checks and the diagrams, as DESIGN.md:174 requires. Cons: about 740 lines of the import checks stay, among them the cycle finder (`graph.ts` `findCycles` and `walk`, about 75 lines).
  - (b) dependency-cruiser for what reads runtime imports only (the cycle check and the diagrams' import edges), the hand reader for the folder order, the boundary rows and the augmentation check. Pros: the cycle finder goes, and the cycle rule is dependency-cruiser's `no-circular`. Cons: two readers and two resolvers of one module, which DESIGN.md:174 rules out so that the checks and the diagrams cannot read a module apart; about 75 lines removed against a new dependency and its configuration.
  - Not offered: dependency-cruiser alone with the components' type-only imports left out of the folder order and the boundary rows, which drops 199 checked imports, a loosened check.
  - Recommendation: (a). The library cannot see what the order and the boundary rows hold, and (b) buys the cycle finder's 75 lines with a second reader the design forbids. (a) is also the cheaper option; it is recommended because it keeps the checks whole, not for its cost.
- Z46, D13 as one step or three (raised 2026-09-29, by the orchestrator at `/spec` D13). D13 replaces the source tab's editor, X3b's diff pane and the merge view with Monaco. Counted on main at c9d79698 with `wc -l`: the code it rewrites or removes is 3,272 lines (`views/sources/source/` Editor 431, Source 421, Gutter 185, Preview 79; `views/sources/repositories/diff/` Diff 402, DiffFile 391; `merge/` Merge 290, MergeSide 177; `views/shared/code/Code.svelte` 151; `state/sources/repositories/` diff-rows 295, merge-regions 242, diff-words 132, diff-patch 76). The library audit's spike estimates 1,500 to 2,100 new hand-written lines (`library-audit.md` LA9). The step also changes the `api/git` answer to carry both versions of a file (a wire change), adds the `code_theme:` key to `config/appearance.yml` with a Settings control (LA22 (a)), and starts with a proof that `@shikijs/monaco` 4.4.3 works with monaco-editor 0.57, which the spike did not prove. As one step that is one builder for many hours and a diff of several thousand lines that must be read whole, sharing files with the repositories, Settings and key-handling steps. Options:
  - (a) Split D13 into three steps, each with its own brief, review and landing. D13a: the source tab on Monaco, meaning the `ui/editor/` primitive, the theme read from the tokens with 3-digit hex expanded, `typingIn` treating Monaco's EditContext as typing, Cmd+K kept for the palette with Monaco's Cmd+K chords removed and their actions listed in the palette (LA21 (a)), the languages through `@shikijs/monaco` with its fit proven first, and the gutter D11 needs. D13b, after D13a: every single-file diff in Monaco's diff editor, `api/git` answering both versions, hunk and line staging over `diff-patch.ts`, X3b's hand diff removed, and the three-way regions from `node-diff3` drawn as Monaco editors. D13c, after D13a and beside D13b: the `code_theme:` key and its Appearance control. D23 then waits on D13a. Pros: each diff can be read whole and reviewed, and a failed fit (the Shiki proof) stops only D13a. Cons: three dispatches, three landings.
  - (b) D13 as one step, as the plan has it. Pros: one landing. Cons: the review and the landing read a diff of several thousand lines, and nothing that touches the repositories views, Settings or the keys can run beside it.
  - Recommendation: (a), for the same reason Q79 was split (Z37). (b) is the lazy option.
- Z47, X3c's order and three names and settings it would otherwise choose (raised 2026-09-29, by the orchestrator at `/spec` X3c). X3c is every row of the Editor tabs table of `agents/reviews/vscode-parity.md` (pinned tabs, the tab context menu with close others, to the right and all, editor actions at the strip's end, breadcrumbs, wrapped tabs). On main at 3ca25c13: the tab strip has no context menu (`grep -rn contextmenu src/lib/ui/tabs src/lib/shell/panes` prints nothing); the strip scrolls (`ui/tabs/tab-scroll.svelte.ts`) and nothing wraps it; `ui/tabs/Breadcrumb.svelte` has one user, the Files view; and oculus's "pin" ties a view to a session (`state/workbench/layout/instances.ts:99` `pinInstance`, labelled "Pin this pane" at `config/text/views/sessions/session-list.yml:43`), which is not VS Code's pinned tab (a tab kept at the strip's start that Close Others leaves open). Q88 also builds a right-click menu for tabs, on the menus Q81 moves to bits-ui. Questions:
  1. Order. (a) X3c after Q81 lands, so the tab menu is built once, on bits-ui, as Q96 waits for Q81; Q88 then leaves the tab menu to X3c. (b) X3c now, with the tab menu on the hand-written `ui/menu`, which Q81 then moves to bits-ui with the other menus. Recommendation (a). (b) is the lazy option: it starts sooner and builds the menu twice.
  2. The two pins. (a) VS Code's pinned tab is called "Pin", as in VS Code, and oculus's session pin is renamed "Lock to this session" (labels only, the state unchanged). (b) VS Code's pinned tab is called "Keep at start", and the session pin keeps "Pin this pane". Recommendation (a), since the migration copies VS Code's words. (b) is the lazy option.
  3. Wrapped tabs. VS Code has it as a setting, off by default. (a) A key in `config/appearance.yml`, `wrap_tabs: false` by default, with a toggle in the Settings view's Appearance section. (b) The strip always wraps. (c) The strip always scrolls, and the row is dropped from X3c. Recommendation (a), as VS Code has it; the key's name is yours to rule. (c) is the lazy option.
  4. Breadcrumbs. (a) The path of a file tab (the source tab, a document, a PDF) shown above its body as `Breadcrumb.svelte` segments, a segment opening the Files view at that folder; symbols in the path wait for D23's language servers. (b) Breadcrumbs only after D23, with symbols. Recommendation (a). (b) is the lazy option.
- Z48, the verify list on main is red at Q101's landing on a file no step wrote (raised 2026-09-29, by the orchestrator at `/land` Q101). Q101's range and the round's review fixes are staged on main, and the verify list ran once: `Test Files  2 failed | 350 passed (352)`, `Tests  2 failed | 5640 passed | 1 skipped (5643)`. `tests/server/git/git-ops.test.ts` passes alone (`Tests  37 passed (37)`), so under the standing demand it is named and the landing goes on. `tests/checks/tree/scratch.test.ts` fails alone too (`Tests  1 failed | 9 passed (10)`): its line 239, `expect(existsSync(join(dir, '..', 'out.txt'))).toBe(false)`, reads the system temporary directory, where `$TMPDIR/out.txt` (38 bytes, 2026-09-29 01:16) holds the line "PASS: check_coverage.py scratch tests", written by a process outside oculus. The standing demand covers a test that passes alone, so this case is not covered. Neither Q101 nor Q86 touches the file. Options:
  - (a) Change the test so the refused plant names a file unique to the run (a name built from the scratch directory's own name, `../<dir name>-out.txt`), and landing Q101 carries that two-line change as a fix at landing. The test then checks the refusal without depending on what other programs leave in the temporary directory. Recommended.
  - (b) Remove `$TMPDIR/out.txt` and land. It removes a file another session wrote, and the test stays open to the same failure from any other program; this is the lazy option.
  - (c) Land with the red line named in the booking, as for a test that passes alone.
## The cases' first run, on the unchanged tree

Commands: `npx vitest run tests/state/boards/structure/layout.test.ts tests/state/boards/structure/graph.test.ts`, then `npm run build` and `grep -rl "viz-js" build/server`.

| Case | Result on the unchanged tree |
| --- | --- |
| Same graph and seed, same positions | red: `Cannot find module .../layout.ts` |
| Different seeds move a node (8-node and 3-node graphs) | red: same import failure |
| Every node inside the box less its padding | red: same import failure |
| One node, and an empty graph | red: same import failure |
| An id with a quote, a space or a backslash | red: same import failure |
| `parseMapState` keeps `start`, drops a malformed one, ignores `tuned` | red: `expected undefined to deeply equal { key: 'k', seed: 3 }` |
| `startFor` answers the saved seed or `layoutSeed` | red: `startFor is not a function` |
| Re-tune writes the seed one above | red: `nextStart is not a function` |
| A drag tick moves a linked partner toward the held node | green (the `physics` of the base) |
| Build passes and `build/server` holds no `@viz-js/viz` | build exit 0; the grep printed nothing (no layout module yet) |

No case showed a rule of the brief wrong. `@viz-js/viz` runs under vitest in node. Whether it runs in the browser page is not verified: no browser test is allowed, and the look is the first run in a page.

## Rulings carried

From `briefs/Q86-cases.md`:
1. One Graphviz instance per page, as option (a). `createGraphviz()` in `layout.ts` returns a loader that keeps the promise and the instance in its closure. `src/lib/state/client/context.ts` gets the import, the `graphviz: GraphvizLoader` field of `ClientState` and `graphviz: createGraphviz()` in what `createClientState` returns. `Graph.svelte` reads it through `useState()`. The lazy option was (b), one instance per pane.
2. `Graph.svelte` under 540 lines with no rule of the size check changed (531 lines).
3. `seededRandom` and `Rng` removed.
4. Verify item 2 is the two greps below.
5. `scratch.test.ts` is named with its one-file run, the file in the temporary directory is left alone, and the commands after it are run one by one.

From `briefs/Q86-round1-sent.md`:
6. The node's index is ruled: each node is written to Graphviz under its index (`n<at>`, `layout.ts` `graphDot`), as built, in place of the id brief item 1 named. The odd-id case holds under it.
7. The `'graphviz'` line of `tests/state/client/client-state.test.ts` stays, as a direct consequence of the ruled key, since its `STORES` list names every key of `ClientState`.

## What repair round 1 changed

- **The drag moves only the dragged node's direct neighbours, at the drawn link length.**
  - `physics(nodes, edges, alpha, params, bounds, movers?)` in `graph.ts` takes the set of nodes that may move, in place of the single `fixed` id. A node outside the set takes no force and no collision push and keeps its position; without a set every node moves.
  - `neighbours(edges, id)` answers the nodes an edge joins to the dragged node.
  - `dragPhysics(scale)` answers the tick's parameters for the fitted picture: the link length is `DEFAULT_PHYSICS.linkLength * scale`.
  - `placeGraph` answers `{ nodes, scale }`, and `mapPlacement` passes the scale to the view.
  - `Graph.svelte` sets the movers to the dragged node's neighbours on press and ticks with `dragPhysics(chosen.scale)`. The dragged node is held because it is not a mover, and its position follows the pointer as before.
- **The comment at `layout.ts:96-99`** now says that neato lays edges out at the tick's link length, `placeGraph` scales the picture to fit the box, and the drag tick runs at the drawn length.
- **`DESIGN.md:290`** now says the drag moves the neighbours alone at the drawn length.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. `layout.ts` places by neato through `@viz-js/viz` (index-named nodes, radius sizes, undirected edges, JSON, fit into `DEFAULT_BOUNDS`, y flipped, `start=<seed>`, `ENGINE = 'neato'`) | DONE | `layout.test.ts` cases green (run below) |
| 1. One instance per page, shared by every pane (cases ruling 1) | DONE | layout.test "loads Graphviz once per loader ..." and "hands a load cancelled ... nothing"; `boundaries.test.ts` green in the full run |
| 2. The search removed from `graph.ts`; `physics` and `DEFAULT_PHYSICS` kept as the drag tick | DONE | grep (a) below prints nothing |
| Round 1 item 1: the drag moves only direct neighbours, at the drawn link length, through one `physics` taking the movers | DONE | graph.test "moves only the movers of a drag ..." and "leaves a neighbour at the drawn link length ... where it is"; the wiring in `Graph.svelte` is an audit, seen at the look |
| 3. `MapState.start`, `parseMapState`, `startFor` | DONE | graph.test and map.test cases green |
| 4. `Graph.svelte` on `seed`; no node before the load; the `map.layout_failed` line; the drag tick | DONE | map.test "draws no node before Graphviz has loaded" and "says in one catalogued line why the engine refused" |
| 5. Re-tune moves to the next seed; tip reworded | DONE | `nextStart` is the proof (graph.test "re-tunes to the seed one above"). The press itself (`Map.svelte` `retune`, `write({ start: nextStart(held, graph.nodes) })`) is covered by no test and is an audit, seen at the look |
| 6. `@viz-js/viz` 3.30.0 in `dependencies`, lock updated | DONE | `package.json` `dependencies`; the lock's `node_modules/@viz-js/viz` entry carries no `dev` flag |
| 7. `DESIGN.md:290`, head comments, `npm run diagrams` | DONE | `npm run diagrams` exit 0; it rewrote `layer-state`, `layer-views` and `layers` `.dot` and `.svg` (the edge counts of the new imports, as the refuter's read of the worktree showed) |
| Cases ruling 2: `Graph.svelte` under 540 | DONE | `wc -l`: 531 |
| Cases ruling 3: `seededRandom`, `Rng` gone | DONE | grep (a) below |

### The verify list

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, from the worktree's `tools/oculus`, exit 1:

```
$ npm test
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is planted with the files given, and refuses one whose path leaves it
 Test Files  1 failed | 351 passed (352)
      Tests  1 failed | 5611 passed | 1 skipped (5613)
checks: failed with exit 1: npm test
```

`npx vitest run tests/checks/tree/scratch.test.ts` alone gives `Tests  1 failed | 9 passed (10)`. It fails on `$TMPDIR/out.txt`, which this step did not write.

Then each command after it, one by one through `bash -o pipefail -c`:

```
$ npm run check
... COMPLETED 1491 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
exit 0
$ npm run build
exit 0
$ npm run format:check
All matched files use Prettier code style!
exit 0
$ npm run lint
exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
exit 0
```

The brief's other checks:
- (a) `grep -rn "optimize\|bestLayout\|placeInit\|isPhysics\|tunedFor\|ontuned\|seededRandom" src tests` printed nothing (exit 1).
- (b) `grep -rn "settle(" src/lib/state/boards/structure src/lib/views/structure tests/state/boards/structure tests/views/structure` printed nothing (exit 1).
- `grep -rl viz-js build/server` after `npm run build` printed nothing (exit 1).
- `npm run diagrams` exit 0.
- The spec's ASCII gate (`LC_ALL=C perl ... $(find src tests bin config -type f ! -name local.yml)`) printed nothing, and `bash bin/folder-check.sh` exit 0.
- The step's test files: `npx vitest run tests/state/boards/structure/layout.test.ts tests/state/boards/structure/graph.test.ts tests/views/structure/map.test.ts tests/state/client/client-state.test.ts` gives `Tests  62 passed (62)`.

### The revert that turns each test red

Every revert in this table was applied, the test was run and seen red, and the file was restored (`diff` against a saved copy printed nothing).

| Test | Revert that turns it red |
| --- | --- |
| layout: moves a node when the seed changes (and the map.test seed cases) | drop `start=` from the graph line |
| layout: id with a quote, a space or a backslash | write `node.id` as the Graphviz name in place of `n<index>` |
| layout: inside the box | drop the fit (scale without the box terms) |
| layout: one node at the centre of the box | anchor the fit at the box's corner (`bounds.pad + (x - minX) * scale`) in place of centring it; red |
| layout: an empty graph | an audit: it holds while `placeGraph` returns early on no node |
| layout: y flip and the answered scale | `+` for `-` in the y mapping; answer `scale: 1` in place of the fitted scale; both red |
| layout: loads once per loader | `loading = import(...)` for `loading ??=` |
| layout: cancelled load gets nothing | call `done` without the `live` guard |
| layout: `mapPlacement` | answer a failure before the load |
| layout: `edgeEnds` | drop the mutual source pad |
| layout: `placement` answers the error | remove its `try` |
| graph: moves only the movers | ignore the movers set (every node moves); red |
| graph: a neighbour at the drawn link length stays | `dragPhysics` without `* scale` on the link length; keep the centre pull; both red |
| graph: `dragPhysics` and `neighbours` | the same two reverts; red |
| graph: `parseMapState` start, map.test audit of malformed seeds | drop the whole-number check in `savedStart` |
| graph: `startFor`; map.test seed for another node set | ignore the key in `startFor` |
| graph: re-tune seed + 1 (`nextStart`) | `startFor(...)` without `+ 1` |
| map.test: placed nodes on the first render | `$state(null)` for `$state(graphviz.loaded())` in `Graph.svelte` |
| map.test: catalogued failure line | remove the `map.layout_failed` line from `Graph.svelte` |
| map.test: no node before the load | an audit: no revert of the tree was run for it |
| map.test: old `tuned` pane lays out from its default | an audit; it holds while `parseMapState` ignores `tuned` |
| The press of re-tune (`Map.svelte` `retune`) | an audit: no test renders the press; a revert to `write({ start: undefined })` leaves every test green. Seen at the look |
| The drag wiring in `Graph.svelte` (movers on press, `dragPhysics(chosen.scale)`) | an audit: the unit suite runs no pointer event. Seen at the look |

## Files, with line counts (`wc -l`)

- `src/lib/state/boards/structure/layout.ts` (new) 240
- `src/lib/state/boards/structure/graph.ts` 600
- `src/lib/views/structure/map/Graph.svelte` 531
- `src/lib/views/structure/map/Map.svelte` 162
- `src/lib/state/client/context.ts` 325 (the import, one type field, one returned key)
- `config/text/views/structure/map.yml` 34
- `tests/state/boards/structure/layout.test.ts` (new) 237
- `tests/state/boards/structure/graph.test.ts` 473
- `tests/views/structure/map.test.ts` 505
- `tests/state/client/client-state.test.ts` 103 (one line, ruled to stay)
- `package.json`, `package-lock.json`
- `DESIGN.md` line 290 (edited by a string replace of that line's text alone; the worktree has no git, and main has moved past the base, so a diff against main also shows main's own later lines)
- `docs/diagrams/`: `layer-state`, `layer-views` and `layers` `.dot` and `.svg`
- `Controls.svelte` is unchanged, since its props did not change.

## Judgment calls the brief left open (each reversible)

- Graph attributes: `overlap=false`, `splines=false`. Node size is `2 * radius / 72` inches, `fixedsize`. Edge `len` is `DEFAULT_PHYSICS.linkLength / 72` inches.
- neato lays edges out at the tick's link length. `placeGraph` then scales the picture evenly to fit the box and centres it, capped at `MAX_SCALE = 1.5` so a small graph is not spread across the whole box, and answers that scale.
- The drag tick runs at the drawn length, `linkLength * scale`, through `dragPhysics(scale)`. Two further choices in `dragPhysics`:
  - The repulsion is scaled by `scale^3` and the collision gap by `scale`, so the pull and the push balance at the drawn spacing as they do at the unscaled one.
  - The centre pull is 0, so a dragged node's neighbours are not drawn toward the middle of the box.
- The movers of a drag stay those of the last node pressed while the tick cools after the release.
- `parseMapState` keeps a seed only when it is a non-negative safe integer.
- The placement no longer runs the tick after it is drawn; the tick runs only from a drag.
- Load and placement failures are logged by an `$effect` in `Graph.svelte`.
- `edgeEnds()` sits in `layout.ts`, moved there from `Graph.svelte` to bring the component under 540 lines, as the cases ruling allowed.
- `map.head` no longer says "a self-tuning spring layout"; it says the layout is Graphviz's neato and re-tune lays it out again from another start.
- New key `map.layout_failed`: "The map could not be laid out: {0}".

## User-visible changes, before and after (for the look)

- **The Map's picture.** Before: a spring layout tuned by a random parameter search. After: neato's layout, fitted into the box. `fdp` is one word away (`ENGINE` in `layout.ts`) if neato reads worse.
- **The drag.** Before: the picture on screen was the tick's own settled output, and a drag reheated the tick over every node. Since the picture was at rest, mostly the dragged node's neighbourhood moved. After: only the dragged node's direct neighbours move, toward the drawn link length from it. Every other node stays exactly where it is, whether neato placed it or an earlier drag moved it. To look: drag a pillar node; its projects follow and nothing else moves.
- **Re-tune.** Tip before: "Re-optimise the layout for this graph". After: "Lay the map out again from another start". Each press gives a new picture that stays when the page is reopened.
- **The failure line.** Before: there was no failure path; the old placement could not fail. After: one status line "The map could not be laid out: <reason>" above an empty drawing, logged to the console. It is not provokable at the look without a code change.
- **The first paint.** Before: the server render drew the placed nodes. After: every page load draws no node until the Graphviz chunk has loaded (1356054 bytes, 484070 gzipped; `ls -la build/client/_app/immutable/chunks/` shows the 1356054-byte chunk). A Map pane opened after that places at once.
- **An old pane saved with `tuned`.** It lays out on its first open from its node set's default seed; the old tuning is ignored.

## Limitations and sharp edges

- The browser run of `@viz-js/viz` (WebAssembly in the page) is not verified by any test here.
- The drag's neighbours still feel the repulsion of every node, including the ones that do not move, so a neighbour settles where the link pull and those pushes balance. That is close to the drawn length but not exactly on it.
- The server-rendered unit suite runs no effect and no pointer event. The pane's wait for the load, the cancel on close, the drag and the re-tune press are covered only through the pure functions they call, and are seen at the look.
- `context.ts` is shared with Q101; this step adds three lines there, a hand merge at landing.
