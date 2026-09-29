# Q82 report: the tree on zag's tree-view machine, the three long lists virtualized

Everything in the brief is done. The cases that need a browser (case 10, and the key, focus and scroll behaviour of items 2 to 5) are left to the landing's look, as item 7 says; they are listed under "Cases left to the look".

## Open items of the state file (verbatim)

`orchestrator-state.md:94-98`:

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> - None.

## The cases' first run, on the unchanged source

The case tests were written first and run against the unchanged source, with only the three dependencies installed (item 1): `npx vitest run tests/ui/tree tests/views/sources/files/files.test.ts tests/views/sources/repositories/repositories.test.ts` printed `Test Files  5 failed (5)`, `Tests  12 failed | 85 passed (97)`.

| Case | Test | First run |
|---|---|---|
| 1 | `tree.test.ts` "is a tree named by its label" | passed (the old TreeView had `role="tree"` and its label) |
| 1 | `tree.test.ts` "draws each row as a treeitem at the level its parent gives it" | failed: `expected [ '1', '1', '1' ] to deeply equal [ '1', '2', '1' ]` (the old row drew the level its caller handed it) |
| 2 | `tree.test.ts` "gives exactly one row the stop" | passed (the old `stopOf` gave the same stops) |
| 3 | `tree.test.ts` "says a closed row is closed, and says nothing of a row that does not open" | passed (the harness hands `expanded` from `open`) |
| 4 | `tree-keys.test.ts` four cases of the collection | failed: `TypeError: treeNodes is not a function` |
| 5, 6 | `tree-keys.test.ts` three cases of `toggledBy`, one of `expandedOf`, one of `focusOf` | failed: `toggledBy`, `expandedOf`, `focusOf` "is not a function" |
| 7 | `virtual.test.ts` | failed: `Cannot find module '../../../src/lib/ui/tree/virtual.ts'` |
| 8 | `files.test.ts` and `repositories.test.ts` audits of the spacers | failed: `expected -1 to be greater than -1`, `expected +0 to be 3` |
| 9 | grep commands, not tests | run at the end, below |
| 10 | browser only | left to the look |

No case turned out wrong under the brief's rules, so nothing was handed back. One reading is recorded: case 7 says "draws rows 95 to 125"; the virtualizer draws 30 rows, indexes 95 through 124, which is 95 to 125 read as a half-open range (visible rows 100 to 119 in 440 px, five past each edge). The test asserts first index 95, last index 124, 30 rows, and passes.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Dependencies | DONE | `grep -n "zag\|virtual-core" package.json` prints `40:        "@tanstack/virtual-core": "^3.17.11",`, `45:        "@zag-js/svelte": "^1.44.0",`, `46:        "@zag-js/tree-view": "^1.44.0",`, all in `dependencies`; installed versions read from `node_modules/<pkg>/package.json`: 1.44.0, 1.44.0, 3.17.11; `package-lock.json` written by `npm install` |
| 2 TreeView on the machine | DONE | `tests/ui/tree/tree.test.ts` cases 1 to 3 (server render through `useMachine`, `connect`, `normalizeProps`); keys, focus and type-ahead left to the look |
| 3 TreeNav and TreeItem | DONE | `tree.test.ts` cases; `grep -rn "rowMove\|stopOf" src` prints nothing (exit 1) |
| 4 Virtualized lists | DONE | `tests/ui/tree/virtual.test.ts` (case 7); the audits of case 8 in `files.test.ts` and `repositories.test.ts`; windowing, scroll and reveal left to the look |
| 5 Drag | DONE | Files rows keep `draggable` and `ondragstart` on the `li` (`Tree.svelte`); the tree spreads no pointer or click handler of the machine (`TreeView.svelte` `rowProps` spreads only attributes and `onfocus`); a drag itself left to the look |
| 6 Documents | DONE | DESIGN.md:309 and HELP.md's key table rewritten; `npm run diagrams` rerun, which rewrote `docs/diagrams/layers.{dot,svg}` and `layer-views.{dot,svg}` (`diff -rq` against the main checkout) |
| 7 Tests | DONE | every new or changed case names its revert; case 8 is named an audit |
| Verify list | DONE | below |

The verify list, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q82/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null` from `tools/oculus`, exit 0; its lines:

```
$ npm test
 Test Files  354 passed (354)
      Tests  5671 passed | 1 skipped (5672)
$ npm run check
COMPLETED 1572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
[check mark] built in 1.85s
[check mark] built in 6.11s
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

(The build's check mark glyph is written `[check mark]` to keep this file ASCII. The `npm test` output also carries three `Rebasing (1/1)error: could not apply ...` lines, printed by git inside tests that build throwaway repositories; the suite passed.) Also run: `sh bin/folder-check.sh` exit 0; the spec's ASCII gate (`LC_ALL=C perl ...` over `src tests bin config`) printed nothing.

## Files, with line counts before and after

Before counts are the brief's (`wc -l` on main at 8a98ede3) where it gives them, and otherwise `wc -l` on the main checkout.

| File | Before | After |
|---|---|---|
| `package.json` | 56 | 59 |
| `package-lock.json` | (regenerated by `npm install`) | |
| `src/lib/ui/tree/TreeView.svelte` | 81 | 211 |
| `src/lib/ui/tree/TreeItem.svelte` | 454 | 457 |
| `src/lib/ui/tree/tree-keys.ts` | 72 | 115 |
| `src/lib/ui/tree/VirtualRows.svelte` | new | 230 |
| `src/lib/ui/tree/virtual.ts` | new | 46 |
| `src/lib/ui/tree/TreeSection.svelte`, `Disclosure.svelte`, `roving.ts` | 86, 64, 50 | unchanged |
| `src/lib/views/sources/files/tree/Tree.svelte` | 278 | 300 |
| `src/lib/views/sources/repositories/Changes.svelte` | 280 | 310 |
| `src/lib/views/sources/repositories/graph/Graph.svelte` | 318 | 372 |
| `src/lib/views/sources/repositories/Repo.svelte` | 279 | 279 |
| `src/lib/state/sources/repositories/repositories.ts` | 465 | 469 |
| `DESIGN.md` | 322 | 322 (line 309 rewritten) |
| `HELP.md` | 294 | 295 |
| `docs/diagrams/layers.dot`, `.svg`, `layer-views.dot`, `.svg` | | regenerated |
| `tests/ui/tree/tree.test.ts` | 242 | 287 |
| `tests/ui/tree/tree-keys.test.ts` | 79 | 141 |
| `tests/ui/tree/virtual.test.ts` | new | 74 |
| `tests/ui/tree/TreeHarness.svelte` | new | 32 |
| `tests/views/sources/files/files.test.ts` | 886 | 900 |
| `tests/views/sources/repositories/repositories.test.ts` | 670 | 690 |
| `tests/state/sources/repositories/repositories.test.ts` | 824 | 829 |
| `tests/state/sources/explorer.test.ts` | 438 | 439 |
| `tests/views/whole/type-scale.test.ts` | 349 | 350 |

Paths outside the brief's list, each for a line the change made wrong: `Repo.svelte` (`graphRows` is now `KeyRow[]`), `state/sources/repositories/repositories.ts` (`KeyRow` gains `fixed`; `repositoryKeyRows` takes the graph's rows rather than ids), its test, `explorer.test.ts` (its head comment named `tree-keys.ts` as where a key moves), `type-scale.test.ts` (its audit lists every `ui` component, and `VirtualRows.svelte` is one). The rename grep: `grep -rn "rowMove\|stopOf\|onkeydown(id\|tabindex(" DESIGN.md HELP.md README.md src tests config` prints nothing outside the new code.

## What was built, in code

The rows a caller hands become the machine's collection, and the machine's expanded change becomes the caller's `ontoggle`:

```ts
// ui/tree/TreeView.svelte
const service = useMachine(tree.machine, () => ({
    id: uid,
    collection,                                   // tree.collection({ rootNode: treeNodes(rows), nodeToString })
    expandedValue: expanded,                      // expandedOf(rows)
    focusedValue: focusOf(rows, current ?? held),
    onExpandedChange: (details) => {
        for (const id of toggledBy(rows, expanded, details.expandedValue)) ontoggle?.(id);
    },
    onFocusChange: (details) => { /* held = id; onfocusrow(id) when a key moved it */ },
    scrollToIndexFn: (details) => { for (const list of lists) if (list.reveal(details.node.value)) return; }
}));
```

`TreeNav` is now `{ row(id, label), list(list), focus(id) }`. `TreeItem` spreads `nav.row(id, label)` after its own attributes, so a row in a tree takes the machine's id, `data-part` (`item`, or `branch-control` for a row that opens), role, `aria-level`, `aria-expanded` and tabindex. A list is drawn through `VirtualRows`, whose snippet gets each item's index and a measuring attachment:

```svelte
<VirtualRows count={rows.length} key={(at) => rowKey(rows[at])} {nav} owns={...} label={...}>
    {#snippet item(at, measure)}
        <li class="row" ... {@attach measure}>...</li>
    {/snippet}
</VirtualRows>
```

## Judgment calls the brief left open (each reversible)

1. The machine's click handlers are not spread on a row, and neither is its `onFocus` as written: zag's item `onClick` sends `NODE.CLICK` with `stopPropagation`, and its branch control's toggles the branch, which would call `ontoggle` a second time after the row's own press; zag's `onFocus` maps to `onfocusin` with `stopPropagation`, which would fire for a control inside the row and stop the event for the page. The row spreads its own `onfocus`, which sends the machine's `NODE.FOCUS` only when the row element itself takes the focus.
2. `aria-selected` stays the row's `selected` (brief decision 3); the machine's selection is not spread.
3. The machine's keys reach it only from a row element (`data-part` `item` or `branch-control`), never from a control or a menu inside a row, as the old tree did. `*` (open every sibling) is not passed on, and Space only while a type-ahead is in progress (so "my file" matches); outside one, Space does what it did before (nothing in the tree). These keep the brief's "no other visible change".
4. Left on a `fixed` row sends the machine's `NODE.ARROW_LEFT` (step to the parent): the machine alone would ask to close an open row, which the tree ignores for a `fixed` one, and the row would not be stepped through.
5. `onfocusrow` is called for a focus move made by a key of the tree, as before, not for a pointer or a Tab landing on a row (a flag set by a key, cleared by a pointer press in the tree or the focus leaving it).
6. The Graph hands up `KeyRow`s rather than ids: a commit row is `{ parent: 'graph', open: commit === hash, fixed: true }` and the open commit's files sit under it. Before, the files were listed under the Graph head, so the machine's level for them would have been 2 while they draw at 3. This changes two keys, listed below.
7. The type-ahead reads the label a drawn row hands `nav.row`, else the label its list gives for a row not drawn, else the id. The open commit's file rows are labelled only once drawn (they belong to `CommitFiles`, not to the list).
8. A virtualized list draws every row until it has found its scroll box (`[data-scroll]`, the Pane body), so the server render and the first pass on mount draw all rows; the window replaces them in the mount effect. A list with no `[data-scroll]` ancestor draws every row.
9. Every drawn item is measured (`measureElement`), the estimate being the probe's height. The Files root head's 6 px gap moved from `margin-top` (on `:not(:first-child)`, which the spacer now always is) to `padding-top` on a row `class:apart` (a root head at index above 0), so the gap is part of the measured row.
10. The graph's list item is one `li` holding a `ul role="none"` with the commit row and, when it is open, its files, so a commit and its files are measured as one item.
11. The tree box takes the machine's `tabindex="-1"` (svelte-check warns on a keyed `role="tree"` without one).
12. The test "keeps the branch line and the path above the error row" in `repositories.test.ts` looked for the word `branch` anywhere in the page; the machine's `data-part="branch-control"` on the repository list's head now contains it. The check now looks for the word as drawn, `>branch<`, and a new line asserts the named case draws it, so the check still fails if the heading appears.

## Every user-visible change, before and after (for the look)

| View and state | Before | After |
|---|---|---|
| Any tree (Files, Repositories, the repository list, Notes, Bookmarks, Workspaces, Pages), focus on a row, type a letter | nothing | the focus moves to the next row whose name starts with it |
| Files, a folder of several hundred files open | every row in the DOM | only the rows in view plus five each side; the scrollbar and the sections after the tree unchanged |
| Repositories, a group with many changed files | every row in the DOM | only the rows in view plus five each side |
| Repositories, Graph after several "more" presses | every loaded commit in the DOM | only the commits in view plus five each side; "more" after them |
| Graph, a commit open, focus on one of its files, Left | focus to the Graph head | focus to the commit |
| Graph, a commit open, focus on it, Right | nothing | focus to its first file |
| A pointer press on the blank space inside a tree | the focus leaves to the page | the focus stays on the tree box (tabindex -1) |

## Cases left to the look (browser only)

Case 10 whole: Up, Down, Home, End, Right, Left and type-ahead in the Files tree and the Repositories tree; a `fixed` folder under a filter stepped through by Right and Left and not closed; Enter opening a row; Tab from a row reaching its controls; a folder of several hundred files scrolled smoothly with only the rows in view in the DOM; End in a long tree scrolling to the last row and focusing it; a row dragged to a pane. Also: the Files root heads' gap looking as before; the Graph's lanes drawing across the windowed commits; the two Graph key changes above; a text scale change keeping the window right.

## Limitations and sharp edges

- Not verified in a browser: every key, focus move, scroll, reveal and drag above; the tests render on the server.
- Mounting a virtualized list builds every row once before windowing (judgment call 8); on a folder of thousands of files that is one full build per mount (a tab coming back). Not measured.
- In a pane hidden while it mounts, the probe measures 0 px, so the list draws every row until the probe is resized when the pane is shown. Not verified.
- `VirtualRows`'s pending focus (a key moving to a row not drawn) is asynchronous: superseded by a later key it gives way (`pending !== id`), but no test covers it; it needs a DOM.
- The machine keeps its own selected value internally (Enter on a row with no button selects it there); nothing reads or draws it.

## Anything in the brief wrong or impossible

Nothing impossible. Case 7's "95 to 125" is read as a half-open range (above). Item 3's "the item or branch-control attributes and handlers": the attributes are spread; of the handlers, only focus is taken, re-sent as the machine's own event (judgment call 1), since the machine's click and focusin handlers as written would toggle twice and stop events for the page.
