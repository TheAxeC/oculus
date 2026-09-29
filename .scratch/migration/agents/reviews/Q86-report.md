# Q86 report: the Map laid out by Graphviz's neato in the page

Everything in the brief and in the cases ruling is done. One path outside both lists was changed, because the ruled `ClientState` key makes its test red otherwise: `tests/state/client/client-state.test.ts` gains `'graphviz'` in its `STORES` list (one line). The orchestrator may keep or drop it. The verify list's `checks.sh` stops at `npm test` on `tests/checks/tree/scratch.test.ts`, which fails on a file this step did not write (ruling item 5). Every command after it was run one by one and is quoted below.

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
| A drag tick moves a linked partner toward the held node | green (the existing `physics` behaviour is kept) |
| Build passes and `build/server` holds no `@viz-js/viz` | build exit 0; the grep printed nothing (no layout module yet) |

No case showed a rule of the brief wrong. `@viz-js/viz` runs under vitest in node. Whether it runs in the browser page is not verified, since no browser test is allowed; it is seen at the landing's look.

## The ruling carried (`briefs/Q86-cases.md`)

The builder handed back a clash: the brief's "loaded once per page and shared by every Map pane", built as module-level variables in `layout.ts`, broke the spec's no-globals rule and `tests/checks/tree/boundaries.test.ts` "holds no process-wide state under src". Ruled:

1. Option (a). `layout.ts` exports `createGraphviz()`, a factory whose returned loader keeps the promise and the loaded instance in its closure. `src/lib/state/client/context.ts` adds the import, the `graphviz: GraphvizLoader` field of `ClientState` and `graphviz: createGraphviz()` in what `createClientState` returns, and nothing else. `Graph.svelte` reads it through `useState()`. The lazy option was (b), one instance per pane.
2. `Graph.svelte` under 540 lines, with no rule of the size check changed. It is 522 lines: the load moved into the loader's `load(done)` (with its cancel), the placement plumbing into `mapPlacement()`, and the edge geometry into `edgeEnds()`, all in `layout.ts`.
3. `seededRandom` and `Rng` are removed from `graph.ts`. The head comment of `graph.ts` lists what the file holds (`layoutKey`, `layoutSeed`, `startFor`, `nextStart`, `physics`) and names neither.
4. Verify item 2 is the two greps below.
5. `tests/checks/tree/scratch.test.ts` fails on `$TMPDIR/out.txt` (`ls -la` shows it dated Sep 29 01:16), which this step did not write. It was left alone.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. `layout.ts` places by neato through `@viz-js/viz` (index-named nodes, radius sizes, undirected edges, JSON, fit into `DEFAULT_BOUNDS`, y flipped, `start=<seed>`, `ENGINE = 'neato'`) | DONE | `npx vitest run tests/state/boards/structure/layout.test.ts`: `Tests  11 passed (11)` |
| 1. One instance per page, shared by every pane (ruling 1) | DONE | layout.test "loads Graphviz once per loader and shares it ..." and "hands a load cancelled ... nothing"; `boundaries.test.ts` green in the full run |
| 2. The search removed from `graph.ts`, `physics` and `DEFAULT_PHYSICS` kept | DONE | `grep -rn "optimize\|bestLayout\|placeInit\|isPhysics\|tunedFor\|ontuned\|seededRandom" src tests` printed nothing (exit 1) |
| 3. `MapState.start`, `parseMapState`, `startFor` | DONE | graph.test and map.test cases green |
| 4. `Graph.svelte` on `seed`, draws nothing before the load, failure line `map.layout_failed`, drag tick kept | DONE | map.test "draws no node before Graphviz has loaded", "says in one catalogued line why the engine refused"; graph.test drag case |
| 5. Re-tune saves `nextStart` (seed + 1); tip reworded | DONE | graph.test "re-tunes to the seed one above"; map.test "re-tune lays the map out from the next seed" |
| 6. `@viz-js/viz` 3.30.0 in `dependencies`, lock updated | DONE | `package.json:40`; `package-lock.json` root `dependencies` holds it and its node carries no `dev` flag |
| 7. `DESIGN.md:290`, head comments, `npm run diagrams` | DONE | `diff` of `DESIGN.md` against main with line 290 removed prints nothing; `npm run diagrams` exit 0 |
| Ruling 3: `seededRandom`, `Rng` gone | DONE | `grep -rn "seededRandom\|\bRng\b" src tests bin` prints nothing |
| Ruling 2: `Graph.svelte` under 540 | DONE | `wc -l`: 522 |

### The verify list

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null` printed, in its summarised form:

```
$ npm test
     × is planted with the files given, and refuses one whose path leaves it 13ms
     × holds one instance of every store it names 9ms
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is planted with the files given, and refuses one whose path leaves it
 FAIL  tests/state/client/client-state.test.ts > the client object > holds one instance of every store it names
 Test Files  2 failed | 350 passed (352)
      Tests  2 failed | 5608 passed | 1 skipped (5611)
checks: failed with exit 1: npm test
```

`client-state.test.ts` failed because its `STORES` list did not name the new `graphviz` key. Adding `'graphviz'` made it green: `npx vitest run tests/state/client/client-state.test.ts` gave `Tests  5 passed (5)`. This is the one path outside the lists; see the first line.

Then each command of the list, run one by one:

```
$ npm test
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is planted with the files given, and refuses one whose path leaves it
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
 Test Files  2 failed | 350 passed (352)
      Tests  2 failed | 5608 passed | 1 skipped (5611)
$ npm run check
... COMPLETED 1491 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (exit 0)
$ npm run build
exit 0
$ npm run format:check
All matched files use Prettier code style!   (exit 0)
$ npm run lint
exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
exit 0
```

The two `npm test` failures are in files this step does not change:
- `tests/checks/tree/scratch.test.ts`: fails when run alone too (`npx vitest run tests/checks/tree/scratch.test.ts`: `1 failed | 9 passed (10)`), on `$TMPDIR/out.txt` (ruling 5).
- `tests/server/git/git-ops.test.ts`: passes when run alone (`npx vitest run tests/server/git/git-ops.test.ts`: `Tests  37 passed (37)`).

The brief's other checks:
- `grep -rn "optimize\|bestLayout\|placeInit\|isPhysics\|tunedFor\|ontuned\|seededRandom" src tests` printed nothing (exit 1).
- `grep -rn "settle(" src/lib/state/boards/structure src/lib/views/structure tests/state/boards/structure tests/views/structure` printed nothing (exit 1).
- `grep -rl "viz-js" build/server` after `npm run build` printed nothing (exit 1). The client build holds the library as its own dynamically loaded chunk (`build/client/_app/immutable/chunks/*.js`, about 1.36 MB).
- `npm run diagrams` exit 0. The diagrams are drawn at folder level, so none of them changed.
- The spec's ASCII gate (`LC_ALL=C perl ... $(find src tests bin config -type f ! -name local.yml)`) printed nothing. `bash bin/folder-check.sh` exit 0.

### The revert that turns each test red

Each revert was applied, the test run and seen red, and the file restored:

| Test | Revert that turns it red |
| --- | --- |
| layout: moves a node when the seed changes (and the three map.test seed cases) | drop `start=` from the graph line |
| layout: id with a quote, a space or a backslash | write `node.id` as the Graphviz name instead of `n<index>` |
| layout: inside the box; one node | drop the fit (`scale` without the box terms) |
| layout: y flip | `+` for `-` in the y mapping |
| layout: loads once per loader | `loading = import(...)` for `loading ??=` |
| layout: cancelled load gets nothing | call `done` without the `live` guard |
| layout: `mapPlacement` | answer a failure before the load |
| layout: `edgeEnds` | drop the mutual source pad |
| layout: `placement` answers the error | remove its `try` |
| graph: `parseMapState` start / map.test audit of malformed seeds | drop the whole-number check in `savedStart` |
| graph: `startFor`; map.test seed for another node set | ignore the key in `startFor` |
| graph: re-tune seed + 1 | `startFor(...)` without `+ 1` in `nextStart` |
| graph: drag moves a linked partner | drop the `fixed` branch of `physics` |
| map.test: placed nodes on the first render | `$state(null)` for `$state(graphviz.loaded())` in `Graph.svelte` |
| map.test: catalogued failure line | remove the `map.layout_failed` line from `Graph.svelte` |
| map.test: no node before the load | an audit: no revert of the tree was run for it; a fallback placement drawn before the load would turn it red |
| map.test: old `tuned` pane lays out from its default | an audit; it holds while `parseMapState` ignores `tuned` |

## Files, with line counts (`wc -l`)

- `src/lib/state/boards/structure/layout.ts` (new) 232
- `src/lib/state/boards/structure/graph.ts` 566
- `src/lib/views/structure/map/Graph.svelte` 522
- `src/lib/views/structure/map/Map.svelte` 162
- `src/lib/state/client/context.ts` 325 (the import, one type field, one returned key)
- `config/text/views/structure/map.yml` 34
- `tests/state/boards/structure/layout.test.ts` (new) 228
- `tests/state/boards/structure/graph.test.ts` 442
- `tests/views/structure/map.test.ts` 505
- `tests/state/client/client-state.test.ts` 103 (one line, outside the lists)
- `package.json`, `package-lock.json`, `DESIGN.md` line 290
- `docs/diagrams/`: rerun, no file changed
- `Controls.svelte` is unchanged, since its props did not change.

## Judgment calls the brief left open (each reversible)

- Graphviz names every node `n<index>` and maps the positions back by index, so no id is escaped.
- Graph attributes: `overlap=false`, `splines=false`. Node size is `2 * radius / 72` inches, `fixedsize`. Edge `len` is `DEFAULT_PHYSICS.linkLength / 72`, so neato's spacing matches what the drag tick pulls a link to.
- Fit: an even scale, centred, capped at `MAX_SCALE = 1.5` so a small graph is not spread across the whole box. A large graph is scaled down, and nodes then draw at their full radius closer together.
- `parseMapState` keeps a seed only when it is a non-negative safe integer.
- The placement no longer runs the force tick after it is drawn; the tick runs only while a node is dragged. A drag reheats the tick over the whole graph (as before), so after a drag the picture relaxes toward the tick's equilibrium and away from neato's placement until the map is laid out again.
- The load and placement failures are logged by an `$effect` in `Graph.svelte` (`console.error("map: the layout failed for N nodes: ...")`).
- `edgeEnds()` moved from `Graph.svelte` into `layout.ts` to bring the component under 540 lines. The ruling allowed placement plumbing there.
- The head text `map.head` said "a self-tuning spring layout"; it now says the layout is Graphviz's neato and re-tune lays it out again from another start.
- A new key `map.layout_failed`: "The map could not be laid out: {0}".

## User-visible changes, before and after (for the look)

- The Map's picture (the Map view on any page with a graph): before, a spring layout tuned by a random parameter search. After, neato's layout fitted into the box. Opening a second Map pane after the first should place at once; the first pane may show an empty canvas for a moment while the library loads.
- Re-tune (the re-tune control's tip on hover): before, "Re-optimise the layout for this graph". After, "Lay the map out again from another start". Each press gives a new picture that stays when the page is reopened.
- An old pane saved with `tuned`: on its first open it lays out from its node set's default seed, and the old tuning is ignored.
- Dragging a node still pulls its neighbours.
- `fdp` is tried by changing `ENGINE` in `layout.ts` if neato's picture reads worse.

## Limitations and sharp edges

- The browser run of `@viz-js/viz` (WebAssembly in the page) is not verified by any test here; the look is the first time it runs in a page.
- After a drag, the tick moves the whole graph toward its own equilibrium, as it did before the step; the saved seed then no longer describes what is on screen until the map is laid out again.
- The server-rendered unit suite cannot run effects, so the pane's wait for the load, and the cancel when the pane closes, are covered only through the loader's own tests, not through a rendered pane.
- `context.ts` is shared with Q101; this step adds three lines there (an import, a type field, a returned key), a hand merge at landing.
