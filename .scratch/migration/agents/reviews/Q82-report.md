# Q82 report: the tree on zag's tree-view machine, the three long lists virtualized (with repair round 1)

Everything in the brief and in repair round 1 is built. The cases that need a browser (case 10, and the key, focus and scroll behaviour, including the kept rows) are left to the landing's look, as item 7 says; they are listed under "Cases left to the look". The full verify list was not run in this round, as the round says; the commands that were run are named under DONE / NOT DONE.

## Open items of the state file (verbatim)

`sed -n 125,130p` of the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, read at finish:

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> - None.

## The cases' first run, on the unchanged source

The first run is the delivered case tests against the base source: `npx vitest run tests/ui/tree tests/views/sources/files/files.test.ts tests/views/sources/repositories/repositories.test.ts` gives `Tests  15 failed | 82 passed (97)` (the count the review reproduced, `agents/reviews/Q82-refuter.md:36` and `:62`; not re-run in this round). Three of the fifteen are the unchanged "one explorer row" cases of `tree.test.ts`, which failed because `navAt` in that file builds the new `TreeNav` shape the base source does not read.

| Case | Test | First run |
|---|---|---|
| 1 | `tree.test.ts` "is a tree named by its label" | passed |
| 1 | `tree.test.ts` "draws each row as a treeitem at the level its parent gives it" | failed: `expected [ '1', '1', '1' ] to deeply equal [ '1', '2', '1' ]` |
| 2 | `tree.test.ts` "gives exactly one row the stop" | passed |
| 3 | `tree.test.ts` "says a closed row is closed, and says nothing of a row that does not open" | passed |
| 1-3 | `tree.test.ts` the three "one explorer row" cases | failed on `navAt`'s new shape |
| 4 | `tree-keys.test.ts` four cases of the collection | failed: `treeNodes is not a function` |
| 5, 6 | `tree-keys.test.ts` cases of `toggledBy`, `expandedOf`, `focusOf` | failed: "is not a function" |
| 7 | `virtual.test.ts` | failed: `Cannot find module '../../../src/lib/ui/tree/virtual.ts'` |
| 8 | the audits in `files.test.ts` and `repositories.test.ts` | failed |
| 9 | grep commands | run at the end, below |
| 10 | browser only | left to the look |

Case 7: the brief's "rows 95 to 125" is off by one. By the round-1 ruling (`briefs/Q82-round1-sent.md:7`) the window is rows 95 through 124, 30 rows, and the test asserts exactly those indexes.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Dependencies | DONE | `grep -n "zag\|virtual-core" package.json` (round 0): `@tanstack/virtual-core ^3.17.11`, `@zag-js/svelte ^1.44.0`, `@zag-js/tree-view ^1.44.0` under `dependencies`; carets ruled in |
| 2 TreeView on the machine | DONE | `tree.test.ts` cases 1 to 3; keys left to the look |
| 3 TreeNav and TreeItem | DONE | `tree.test.ts`; `grep -rn "rowMove\|stopOf" src` printed nothing in round 0 (not re-run) |
| 4 Virtualized lists | DONE | `virtual.test.ts`; the case 8 audits |
| 5 Drag | DONE | unchanged from round 0; left to the look |
| 6 Documents | DONE | DESIGN.md:309, HELP.md:57, head comments; `npm run diagrams` exit 0 |
| 7 Tests | DONE | every new or changed case names its revert and was run red with it (below) |
| R1.1 type-ahead on every letter, Cmd/Ctrl withheld | DONE | `keyRoute` in `tree-keys.ts`, six cases in `tree-keys.test.ts` |
| R1.2 stop, focused row and open commit kept drawn | DONE | `keptRange`, `rowWindow` gaps, `TreeNav.kept`, Graph `keep`; three cases in `virtual.test.ts` |
| R1.3 window from the first render | DONE | `firstWindow`; two cases in `virtual.test.ts`; case 8 audits rewritten |
| R1.4 index-path map, label pruning | DONE | `indexPaths` with a case; `TreeView.svelte:93-98` prunes `labels` |
| R1.5 documents | DONE | below |
| R1.6 report corrections | DONE | this file |
| Full verify list | NOT RUN | the round says the orchestrator runs it on main at landing |

Commands run at finish, from the worktree's `tools/oculus` with node 24.21.0 first on PATH:

```
$ npx vitest run tests/ui/tree tests/views/sources/files/files.test.ts tests/views/sources/repositories/repositories.test.ts tests/state/sources/repositories/repositories.test.ts tests/checks/source/comment-width.test.ts tests/views/whole/type-scale.test.ts
      Tests  399 passed (399)
$ npm run check
COMPLETED 1572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
(no findings, exit 0)
$ npm run diagrams
(exit 0)
$ LC_ALL=C grep -rna '[^ -~]' src tests DESIGN.md HELP.md
(nothing)
```

`npm run diagrams` leaves `docs/diagrams/layers.{dot,svg}` and `layer-views.{dot,svg}` differing from the main checkout (`cmp` over the folder): the views-to-ui import counts go from 134 to 137 and 545 to 548, the three `VirtualRows` imports.

## Each new or changed case, red with its change undone

Each change below was applied to the source, the named test file run, and the file written back (a Python loop holding the original text in memory; `grep` after it found each original line back, and the six test files above then passed 399 of 399).

| Change undone | Failure quoted |
|---|---|
| `indexPaths`: `paths.set(child.value, path)` | "is its place among its parent's children, under its parent's own path": `expected [] to deeply equal [ +0 ]` |
| `keyRoute`: `a` returns `'machine'` | "sends a lowercase a as a type-ahead letter, since the machine drops it": `expected 'machine' to be 'type-ahead'` |
| `keyRoute`: every letter returns `'type-ahead'` | "hands every other letter to the machine, which reads it as a type-ahead": `expected 'type-ahead' to be 'machine'` |
| `keyRoute`: Meta/Ctrl test dropped | "withholds a key with Meta or Ctrl held, so Cmd+A and Ctrl+A stay the page's": `expected 'type-ahead' to be 'withhold'` |
| `keyRoute`: `*` test dropped | "withholds the key that opens every sibling": `expected 'machine' to be 'withhold'` |
| `keyRoute`: Space always `'machine'` | "withholds Space outside a type-ahead and hands it to the machine inside one": `expected 'machine' to be 'withhold'` |
| `keyRoute`: last line `'withhold'` | "hands the tree's own keys to the machine": `expected 'withhold' to be 'machine'` |
| `rowWindow`: `after` from the first drawn row's start | "draws rows 95 to 124 of 1,000 ...": `expected 19910 to be 19250` (and three more cases) |
| `rowWindow`: `let end = 0` | "measures the gaps from the list, not from the top of the scroll box it sits in": `expected 2390 to be 2090` |
| `keptRange`: `defaultRangeExtractor(range)` alone | "draws a kept row far above the window at its place, with the gaps around it": `expected [ 95, 96, ... ] to deeply equal [ 3, 95, 96, ... ]` |
| `keptRange`: an array with each kept index pushed | "draws a kept row already inside the window once": `expected [ 95, ..., 100, 100, ... ] to deeply equal [ 95, ..., 100, 101, ... ]` |
| `keptRange`: bounds test dropped | "ignores a kept index the list does not hold": failed |
| `firstWindow`: `shown = count` | "draws the first two overscans of rows of a longer list": `expected [ +0, 1, ..., ...(991) ] to deeply equal [ +0, 1, ..., 9 ]`; Files audit `expected 31 to be 10`; Repositories audit `expected 30 to be 10` |
| `firstWindow`: `shown = OVERSCAN * 2` always | "draws every row of a list shorter than that": `expected [ +0, 1, ..., 9 ] to deeply equal [ +0, 1, 2 ]` |

The two case 8 tests are audits of the markup, named so: a server rendering has no scroll box, so they show the first window and the after spacer, and say nothing of which rows a browser draws once scrolled. `virtual.test.ts` has no empty-list case: `rowWindow` has no branch for it (an empty window holds the whole height after it, which is 0 for an empty list), so no revert could turn such a case red.

## Files, with line counts before and after

Before is the brief's count on main at 8a98ede3, or new; after is `wc -l` at finish.

| File | Before | After |
|---|---|---|
| `package.json` | 56 | 59 |
| `src/lib/ui/tree/TreeView.svelte` | 81 | 251 |
| `src/lib/ui/tree/TreeItem.svelte` | 454 | 457 |
| `src/lib/ui/tree/tree-keys.ts` | 72 | 150 |
| `src/lib/ui/tree/VirtualRows.svelte` | new | 270 |
| `src/lib/ui/tree/virtual.ts` | new | 67 |
| `src/lib/views/sources/files/tree/Tree.svelte` | 278 | 300 |
| `src/lib/views/sources/repositories/Changes.svelte` | 280 | 310 |
| `src/lib/views/sources/repositories/graph/Graph.svelte` | 318 | 379 |
| `src/lib/views/sources/repositories/Repo.svelte` | 279 | 279 |
| `src/lib/state/sources/repositories/repositories.ts` | 465 | 469 |
| `DESIGN.md` | 322 | 322 (line 309) |
| `HELP.md` | 294 | 295 |
| `tests/ui/tree/tree.test.ts` | 242 | 288 |
| `tests/ui/tree/tree-keys.test.ts` | 79 | 199 |
| `tests/ui/tree/virtual.test.ts` | new | 134 |
| `tests/ui/tree/TreeHarness.svelte` | new | 32 |
| `tests/views/sources/files/files.test.ts` | 886 | 928 |
| `tests/views/sources/repositories/repositories.test.ts` | 670 | 708 |
| `tests/state/sources/repositories/repositories.test.ts` | 824 | 829 |
| `tests/state/sources/explorer.test.ts` | 438 | 439 |
| `tests/views/whole/type-scale.test.ts` | 349 | 350 |

`src/lib/ui/tree/` holds 8 files (`ls | wc -l`). `Repo.svelte`, `state/sources/repositories/repositories.ts` and its test are in the step's paths by the round-1 ruling.

## What was built, in code

Where a key goes (`tree-keys.ts`), called from `TreeView.svelte`'s `pressedKey`:

```ts
export function keyRoute(key, held: { meta: boolean; ctrl: boolean }, typingAhead: boolean) {
    if (held.meta || held.ctrl) return 'withhold';
    if (key === '*') return 'withhold';
    if (key === ' ') return typingAhead ? 'machine' : 'withhold';
    if (key === 'a') return 'type-ahead';   // zag's map reads `a` as select-all and drops it
    return 'machine';
}
// pressedKey: 'type-ahead' => event.preventDefault(); service.send({ type: 'TREE.TYPEAHEAD', key: event.key, id: row.id })
```

The rows kept drawn, and the window with a gap before each drawn row (`virtual.ts`):

```ts
export function keptRange(range: Range, kept: readonly number[]): number[] {
    const drawn = new Set(defaultRangeExtractor(range));
    for (const index of kept) if (index >= 0 && index < range.count) drawn.add(index);
    return [...drawn].sort((one, two) => one - two);
}
// rowWindow: gap = item.start - end of the previous drawn row (or the list's top); after = total - last end
// firstWindow(count): rows 0 .. min(count, OVERSCAN * 2) - 1
```

`TreeNav.kept` is `[stop, inside]` (the row at the stop, and the row the focus is in, read by an `onfocusin` on the tree box); `VirtualRows` maps those ids through `owns`, adds the caller's `keep` (the Graph passes the open commit's index) and hands `rangeExtractor: (range) => keptRange(range, held)` to the virtualizer. It draws a `data-virtual="gap"` spacer `li` before each drawn row after the first whose gap is above 0; the before spacer holds the first row's gap. Until the list finds its scroll box it draws `firstWindow(count)` and the after spacer is `calc(<rows not drawn> * var(--tree-row) * var(--text-scale, 1))`.

`nav.row` reads the index path from `indexPaths(root)`, a map built once per collection, then `collection.at(path)`. A `$effect.pre` deletes from `labels` every id not in `rows`.

## Judgment calls (each reversible)

1. The machine's click handlers are not spread on a row, and its `onFocus` (mapped to `onfocusin` with `stopPropagation`) is replaced by the row's own `onfocus`, which sends `NODE.FOCUS` only when the row element itself takes the focus. Ruled in.
2. `aria-selected` stays the row's `selected` (brief decision 3).
3. The machine's keys reach it only from a row element, never from a control inside a row. Which keys is `keyRoute`.
4. Left on a `fixed` row sends `NODE.ARROW_LEFT` (step to the parent).
5. `onfocusrow` is called for a focus move made by a key of the tree, as before.
6. The Graph hands up `KeyRow`s with the open commit's files under the commit. Ruled in.
7. The type-ahead reads the label a drawn row hands `nav.row`, else its list's `label` for a row not drawn, else the id. The open commit's file rows are labelled once drawn; with the open commit kept drawn, they stay drawn with it.
8. Every drawn item is measured. The Files root head's gap is `padding-top` on a row `class:apart`, so it is part of the measured row.
9. The Graph's item is one `li.entry` holding `ul.entry-rows` with the commit row and its files, measured as one item.
10. The tree box takes the machine's `tabindex="-1"`. Ruled in.
11. The `>branch<` check in `repositories.test.ts`, with a positive assertion beside it.
12. The duplicate `KeyRow` in the state layer stays (ruled).
13. The "stop" kept for a tree is the row carrying tabindex 0 (`current` when drawn, else the machine's last focused row, else the first row); the machine's focused value is the same row, so one id covers both.

## Every user-visible change, before and after (for the look)

| View and state | Before | After |
|---|---|---|
| Any tree, focus on a row, type a letter (`a` included) | nothing | the focus moves to the next row whose name starts with it |
| Any tree, focus on a row, Cmd+A or Ctrl+A | the browser selects all | the browser selects all (the machine never sees a key with Meta or Ctrl) |
| A pointer press on the blank space inside a tree, then the pointer leaves the tree | the focus leaves to the page and the indent guides hide | the tree box holds the focus (tabindex -1), `[role='tree']:focus-within .guide` (`TreeItem.svelte:329`) matches, and the indent guides stay drawn |
| Graph, the loaded commits' markup | each commit `li` a direct child of the Graph section's list | each commit one level deeper, in `li.entry > ul.entry-rows`, with its files in the same `ul` when open |
| Graph, a commit open, focus on one of its files, Left | focus to the Graph head | focus to the commit |
| Graph, a commit open, focus on it, Right | nothing | focus to its first file |
| Files, a folder of several hundred files open | every row in the DOM | the rows in view plus five each side, the kept rows, and spacers; the scrollbar and the sections after the tree unchanged |
| Repositories, a group with many changed files | every row in the DOM | the rows in view plus five each side, the kept rows, and spacers |
| Graph after several "more" presses | every loaded commit in the DOM | the commits in view plus five each side, the kept rows and the open commit; "more" after them |
| A long list scrolled so the row at the stop, or the focused row, leaves the view | (every row drawn) | that row stays drawn at its place, so Tab still reaches the tree and the focus stays on the row |
| Graph, a commit open, scrolled away and back | (every row drawn) | the open commit stays drawn, so its files are read once |
| First render of a long list, and a server render | every row drawn | the first ten rows, the rest held at `--tree-row` times the text scale until the list finds its scroll box |

## Cases left to the look (browser only)

Case 10 whole: Up, Down, Home, End, Right, Left and type-ahead in the Files tree and the Repositories tree, `a` included; Cmd+A on a row selecting the page; a `fixed` folder under a filter stepped through and not closed; Enter opening a row; Tab from a row reaching its controls; a folder of several hundred files scrolled smoothly with only the rows in view in the DOM; End in a long tree scrolling to the last row and focusing it; a row dragged to a pane. Also: the stop row and the focused row staying drawn when scrolled out, and Tab into the tree after it; the open commit staying drawn with no second read of its files; the first render's window with no visible jump when the window replaces it; the indent guides after a press on blank tree space; the Files root heads' gap; the Graph's lanes across the windowed commits; the two Graph key changes; a text scale change keeping the window right.

## Limitations and sharp edges

- Not verified in a browser: every key, focus move, scroll, reveal, kept row and drag above; the tests render on the server.
- A box 0 px tall draws no rows until it has a height. Not verified in a browser.
- The first render's after spacer holds the rows at the tokens' row height; a list whose rows are taller (a Files root head's gap, an open commit with files) is a few px off until the window is measured on mount. Not measured.
- `VirtualRows`'s pending focus (a key moving to a row not drawn) is asynchronous and superseded by a later key; no test covers it, since it needs a DOM.
- The machine keeps its own selected value internally (Enter on a row with no button selects it there); nothing reads or draws it.
- The type-ahead's reading of labels of rows not drawn goes through `nav.list`, registered in an effect, so no server test shows it.

## Anything in the brief wrong or impossible

Case 7's "95 to 125" is off by one, as ruled; the window is 95 through 124. Item 3's "handlers": only focus is taken from the machine's row handlers, re-sent as its own event (judgment call 1, ruled in).
