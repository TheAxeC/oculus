# Q86 landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q86: the Map laid out by Graphviz's neato in the page. Next: Q81 and Q82, then Q86b, the Map's drag after neato's placement.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

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

## NOT DONE

The look after the fix at landing to the labels, and the look at re-tune and at a drag, were not taken: Axel took the browser tab to his own page (a shell on the Focus page) during the look, and the look is taken only on TEST. The label fix is held by the source audit and by reading; the look is carried to Q86b's look on the Map.

## The check before landing

The runner's agent listing showed no builder or reviewer of Q86 running.

## What landed

The Map is placed by Graphviz's neato, run in the page through `@viz-js/viz` 3.30.0 (now a dependency). `state/boards/structure/layout.ts` writes the graph as Graphviz input and fits neato's answer into the box; the library loads once per page through `createGraphviz()`, held by the client state as `graphviz`. The pane saves its start seed as `start: { key, seed }` under `MapState`, so a saved page draws the same picture, and re-tune saves the next seed. The Map draws no node until the placement has come back, and a refused or failed layout shows one catalogued line. A drag moves only the dragged node's direct neighbours, pulled by springs held at the lengths their edges had when the press began. 19 files, 856 insertions, 476 deletions.

## What was found

- At the look, the labels in the dense middle of the picture were drawn over each other. Cause: the effect that measures the labels (`Graph.svelte`) read only the node set and the text size, and the labels are drawn only after Graphviz has loaded, so the one measurement ran with no label on the page; every label stayed unmeasured, and an unmeasured label overlaps nothing. Fixed at landing: the effect reads the placement too.
- The picture fills the box's height with empty bands above and below, because the drawing keeps its 1000 by 680 box inside a taller pane, as it did before the step.
- The builder's report called the drag a settled balance; the round 2 reviewer's probe shows it creeps across reheats of one held drag (60.4, 65.1, 68.5 px over one, two and three loops). Two of its tests are audits (the collision guard, the fields of `DRAG_PHYSICS`). The creep, circles left on top of each other after a drag, and the unused repulsion and centre pull are Q86b (ruling Z49).
- A click, or a press moved 3 px or less, now moves nothing and opens the node; before the step any movement while pressed moved the node and ran the tick. A press past the threshold jumps the node to the pointer.

## Verification on main

- `checks.sh` stopped at `npm test`: `Test Files  1 failed | 352 passed (353)`, `Tests  1 failed | 5659 passed | 1 skipped (5661)`. The one failure is `tests/server/machine/hpc/ssh.test.ts`, a file the step does not change, and it passes alone: `Tests  13 passed (13)`.
- The five commands after it, run one by one, each exit 0: `npm run check` (`COMPLETED 1492 FILES 0 ERRORS 0 WARNINGS`), `npm run build`, `npm run format:check`, `npm run lint`, the ASCII grep.
- After the label fix: `tests/views/structure/map.test.ts` `Tests  23 passed (23)`; `npm run check` `COMPLETED 1494 FILES 0 ERRORS 0 WARNINGS`; `npm run format:check`, `npm run lint` and the ASCII grep exit 0.

## The look

On TEST, the Map opened from the palette: the new head text, the filters, and neato's picture of the portfolio, pillars as squares with their projects around them; the labels in the middle drawn over each other (fixed at landing, not seen after the fix). No console error was read.

## Usage, the bar and the fixes at landing

- Builder: 66 tool uses, 249k tokens, 19 min with the cases hand-back; the build after the ruling 49 tool uses, 550k tokens, 18 min; round 1 20 tool uses, 320k tokens, 8 min; round 2 24 tool uses, 361k tokens, 8 min.
- Reviewers: 28 tool uses, 166k tokens, 11 min; round 1 30 tool uses, 154k tokens, 7 min; round 2 31 tool uses, 168k tokens, 8 min.
- The builder's first report did not pass its bar: the first drag moved every node.
- Fixes at landing (4): the diagrams merge, `context.ts` merged with Q101, the neato edge-length sentence in `layout.ts` and `DESIGN.md:290`, the labels measured again once Graphviz has placed the nodes.

## Next

`/spec` Q81 and Q82, which waited for Q101; then Q86b. Q87, D13 and X3c wait on Z45, Z46 and Z47.
