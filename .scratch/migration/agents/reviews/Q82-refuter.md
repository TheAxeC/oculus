# Step Q82 refuter report (reviewer a6d13a2b6f68312ca, on .agents/worktrees/Q82, base 3fefa8ff)

## Verification

checks.sh, from `.agents/worktrees/Q82/tools/oculus`, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../Q82/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, exit 0 (3:22 wall). Lines printed:

```
$ npm test
 Test Files  354 passed (354)
      Tests  5671 passed | 1 skipped (5672)
   Duration  91.23s (transform 12.45s, setup 0ms, import 91.97s, tests 237.57s, environment 78ms)
$ npm run check
1790672268422 COMPLETED 1572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 1.89s
built in 7.85s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

The `npm test` output carries 3 `Rebasing (1/1)error: could not apply ...` lines (`grep -c Rebasing` = 3), as the report says.

Other commands, from the worktree's `tools/oculus`:

- `grep -n "zag\|virtual-core" package.json`: `40: "@tanstack/virtual-core": "^3.17.11",` `45: "@zag-js/svelte": "^1.44.0",` `46: "@zag-js/tree-view": "^1.44.0",` (all under `dependencies`).
- Installed versions (`require('./node_modules/<pkg>/package.json').version`): tree-view 1.44.0, svelte 1.44.0, virtual-core 3.17.11.
- `grep -rn "rowMove\|stopOf" src`: no output, exit 1.
- `sh bin/folder-check.sh`: exit 0. The spec's `LC_ALL=C perl ...` ASCII gate over `src tests bin config`: no output, exit 0.
- Rename grep `grep -rn "rowMove\|stopOf\|RowMove\|tabindex(\|onkeydown(id\|data-row-id\|focusRow\|\bentered\b\|dataset.rowId" DESIGN.md HELP.md README.md docs bin src tests config .scratch/migration/agents/spec.md`: only unrelated hits (`ActivityRail.svelte:265` has its own `entered`, `Changes.svelte:88` a new `rowId`, a comment in `git.test.ts:605`). Nothing reads `data-row-id`.
- `git diff 3fefa8ff -- tools/oculus/package-lock.json | grep '^+.*"node_modules/'`: adds `@tanstack/virtual-core`, `@zag-js/anatomy`, `collection`, `core`, `dom-query`, `svelte`, `tree-view`, `types`, `utils`, and `csstype`. The six other `@zag-js/*` packages and `csstype` come in as dependencies of the two packages the brief names. Nothing is removed.
- Diagrams sample: `layers.dot/.svg` "views to ui" 545 to 548, `layer-views.dot/.svg` "folder views/sources to layer ui" 134 to 137. Those are the three new `VirtualRows` imports.
- Line counts before and after: `wc -l` on a base copy and on the worktree match the report's table (for example Tree.svelte 278/300, Graph.svelte 318/372, repositories.ts 465/469).
- The first run, reproduced. I copied the project to my scratch folder, reversed `git diff 3fefa8ff -- tools/oculus/src` with `patch -R` and removed `VirtualRows.svelte` and `virtual.ts`, then ran `npx vitest run tests/ui/tree tests/views/sources/files/files.test.ts tests/views/sources/repositories/repositories.test.ts`: `Test Files 5 failed (5)`, `Tests 15 failed | 82 passed (97)`. The report says 12 failed | 85 passed. The same five files on the delivered source: `Tests 100 passed (100)`.
- Revert runs. Each was made in the scratch copy and restored after, with `npx vitest run <file>`. Each named revert turns its test red:
  - tree.test.ts, 1 failed | 12 passed each time: `aria-level={level}` after `{...fromTree}` turns "draws each row as a treeitem at the level its parent gives it" red. `focusedValue: current ?? held` turns "gives exactly one row the stop" red. `'aria-expanded': state.expanded` turns "says a closed row is closed" red. Dropping `role="tree"` turns "is a tree named by its label" red.
  - virtual.test.ts: `after` from `first.start` turns 2 tests red. `before: first.start` turns 1 red. Removing the early return turns 1 red.
  - tree-keys.test.ts: every root push to `root` turns 2 red. Dropping `fixed` from `toggledBy` turns 1 red. Keeping only added ids turns 1 red. `expandedOf` with only `open === true` turns 1 red. Parent looked up among every row turns 2 red. `childrenCount` on every row turns 1 red. Dropping `seen` turns 1 red. `focusOf` returning `wanted` turns 1 red.
  - type-scale.test.ts: removing the `VirtualRows.svelte` entry turns "audits that every ui component is listed" red (`expected [ ...(41) ] to deeply equal [ ...(40) ]`), so that entry is required.
  - repositories.test.ts (views): restoring the old `expect(unnamed).not.toContain(catalog['sessions.ch_branch'])` on the new code fails (`expected '<!--[--><section class="pane svelte-b...' not to contain 'branch'`), so the premise of judgment call 12 holds. I added two temporary asserts: `above.includes('>branch<')` is true and `above.includes('branch-control')` is false. So the positive check at line 510 still reads the drawn heading, not the attribute.
- zag probes (node scripts in the scratch folder calling `tree.connect(...).getTreeProps().onKeyDown` with a stub service):
  - key `"a"` sends `[]`, `"b"` sends `TREE.TYPEAHEAD`, `"A"` sends `TREE.TYPEAHEAD`.
  - `"a"`+meta sends `SELECTED.ALL` with `preventDefault: true`.
  - `"Enter"` on a branch-control sends `BRANCH_NODE.CLICK`.
- virtual-core probe, 1000 rows: row size 0 in a box 0 px tall draws 0 rows. Row size 0 in a box 440 px tall draws 506 rows. Row size 22 in a box 0 px tall draws 0 rows.

## Spec

1. The case 7 reading was not handed back. The brief's case 7 says "draws rows 95 to 125". virtual-core draws 95 through 124 (30 rows), which the test asserts (`virtual.test.ts:46-55`). Nothing in the brief supports a half-open reading: it uses no half-open ranges anywhere, and "95 to 125" in plain prose is inclusive (31 rows). The brief's rule for this case is: "When the first run finds a case the brief's own rules get wrong, the builder stops there ... and hands back". The report instead records "No case turned out wrong ... One reading is recorded". The number the test asserts is correct for the library. The brief's figure is off by one, and the orchestrator should rule on it and record the ruling, which the report cannot do for itself.
2. The Graph's key rows were restructured (judgment call 6). This is a decision the brief did not leave open, and it causes two visible key changes. `Graph.svelte:106-128` hands up `KeyRow`s: commits are `{ parent: 'graph', open, fixed: true }` and the open commit's files sit under the commit. The brief says "The visible changes are these and no others: type-ahead in every tree; the three long lists draw only the rows in view". The change has grounds in item 3: the machine's `aria-level` from collection depth overrides the row's `level`, so flat file rows would have announced level 2 while drawn at level 3. It is still a ruling for the orchestrator. The two key changes are Left from a file (to the commit, before to the Graph head) and Right on an open commit (into its first file, before nothing). The change also takes paths outside "Paths this step writes": `state/sources/repositories/repositories.ts` (`KeyRow` gains `fixed`; `repositoryKeyRows` takes rows); `tests/state/sources/repositories/repositories.test.ts`; `Repo.svelte`, which imports `TreeNav`, but whose change is the `KeyRow` type, not a line the new `TreeNav` made wrong. Every one of these follows from call 6, not from an item of the brief. `explorer.test.ts` and `type-scale.test.ts` are in the brief's list (both are named under "What is on the tree"), and the type-scale entry is required (revert run above).
3. The tree box takes `tabindex="-1"` (`TreeView.svelte:290-295`, from `treeProps.tabindex`). This is a visible change outside the brief's list. The report states the focus half. It does not state that the indent guides then stay drawn: `TreeItem.svelte:328-329` shows them under `:global([role='tree']:focus-within)`, which holds while the box itself has focus after a press on blank space.
4. Item 3 asks for "the item or branch-control attributes and handlers" to be spread. The builder spreads a filtered set of attributes and its own `onfocus` that re-sends `NODE.FOCUS` (`TreeView.svelte:304-330`). I checked the reason given: zag's `onFocus` calls `event.stopPropagation()` (`tree-view.connect.mjs:271-274`), `@zag-js/svelte` maps `onFocus` to `onfocusin` (`normalize-props.js:9`), and `onClick` sends `NODE.CLICK`/`BRANCH_NODE.CLICK` with `stopPropagation`. The call is disclosed and its reason holds. It is still a substitute mechanism for part of the item, for the orchestrator to accept.
5. `package.json:40,45,46` records `^3.17.11` and `^1.44.0`, where the brief names exact versions. The lock pins them exactly. The tree mixes both styles (`@viz-js/viz` "3.30.0", `@event-calendar/core` "^5.15.0").
6. Every case has a test except case 9 (commands, reproduced above) and case 10 (left to the look). Cases 1 to 8 each have a first-run result in the report. Case 5 is proven at `toggledBy`, as the brief allows. The wiring in `onExpandedChange` (`TreeView.svelte:268-270`) has no test (DOM only).

I reproduced the premises in "What is on the tree": base `wc -l` gives TreeView 81, TreeItem 454, tree-keys 72, and TreeSection, Disclosure and roving are unchanged (86, 64, 50).

## Proof

1. The first-run counts are not reproduced. The report gives `Tests 12 failed | 85 passed (97)`. The delivered tests on the base source give `15 failed | 82 passed (97)`. The three extra failures are the unchanged "one explorer row" cases in `tree.test.ts`: "is a treeitem with its level...", "takes the stop only when it is the tree stop" and "keeps its controls out of the focus order...". They fail on the base source because `navAt` (`tree.test.ts:49-55`) now builds the new `TreeNav` shape (`row`/`list`/`focus`), which the old `TreeItem` cannot call. The report's first run was taken on a different `tree.test.ts` than the one delivered.
2. The hidden-pane limitation is stated wrongly. The report says "In a pane hidden while it mounts, the probe measures 0 px, so the list draws every row". Once the list has found its box, `drawn` is the virtualizer's window (`VirtualRows.svelte:82`). With a box 0 px tall, virtual-core draws 0 rows (probe above), not every row. The effect when the pane is shown is not verified by either of us.
3. `virtual.test.ts:27` hard-codes `overscan: 5` rather than importing `OVERSCAN`. A change to `OVERSCAN` in `virtual.ts:9` keeps every test green. The list's own wiring has no unit test (DOM only, disclosed in general terms): `estimateSize` from the probe, `scrollMargin` from `offsetIn`, `onChange` and `measureElement`.
4. The `repositories.test.ts` assertion was narrowed from any `branch` to `>branch<`. This narrows a predicate. It is disclosed (call 12), and a positive check was added (`expect(named).toContain('>branch<')`). My probe shows the section slice still holds the drawn heading and no `branch-control` attribute, so the narrowing hides nothing today.
5. The two case 8 audits are named as audits in their titles and comments (`files.test.ts:256-268`, `repositories.test.ts:305-321`), as the brief allows.

No test asserts a known defect. No allow-list entry was added except the `type-scale.test.ts` pass-through line, which the audit requires. No file-scope mutable was added: `labels`, `lists` and `keyed` are per-instance (`TreeView.svelte:217-224`).

## Standards

1. `DESIGN.md:309` now has a sentence with no clear subject. The builder inserted the virtualization sentences between "Each row is a `treeitem` ... and Enter presses it." and "Its controls take tabindex 0 only while the focus is inside the row", so "Its" refers to the list, not the row. `agents/spec.md` counts a document sentence the change makes false as a defect.
2. `DESIGN.md:309` ("a letter moves to the next row whose label starts with it"), `HELP.md:57` ("a letter ... the next row whose name starts with that letter") and the `TreeView.svelte:5` head comment are all false for the lowercase letter `a` (Behaviour 1).
3. `nav.row` (`TreeView.svelte:304-305`) returns a row's props and also writes the label map. It runs inside `TreeItem.svelte:125-126`'s `$derived`, so a derived computation carries a write as a side effect. The map is never pruned, so a long Files session keeps every label ever drawn. The objects are instance-scoped, so the spec's no-globals rule does not bite. A separation-of-concerns note (spec "The principles"), low.
4. `KeyRow` is declared twice, identically: `ui/tree/tree-keys.ts:11` and `state/sources/repositories/repositories.ts:281`. `state/sources/fs.ts:538` has a third inline structural copy. The duplicate existed before the step, and the step widened it to match. The state layer cannot import `ui`, so removing it is a layering question, not a fix inside this brief (DRY, spec "The principles").
5. Removing `svelte-ignore a11y_no_noninteractive_tabindex` and `data-row-id` from `TreeItem.svelte` leaves nothing reading `data-row-id` (grep above), and `npm run check` reports 0 warnings.

The rest of the diff meets the standards: no non-ASCII (perl gate); every file under the size limits (TreeView 211, VirtualRows 230, Graph 372); folder counts within the limit (`src/lib/ui/tree` 8, `tests/ui/tree` 4); no history wording in the added comments; the `// Revert:` lines are the prose the brief's item 7 asks for, in the file's existing form.

## Behaviour

1. Type-ahead never answers a lowercase `a`. zag's key map has an `a` entry (`tree-view.connect.mjs:213-216`) that only acts with Meta and otherwise returns. Because `exec` exists, the typeahead branch at `:233-240` is never reached for `a`. The probe proves it: `"a" -> []`, `"b" -> TREE.TYPEAHEAD`. `TreeView.svelte`'s `pressedKey` (`:342-361`) forwards `a` unchanged. A letter press of `a` never moves to a row starting with `a`, and a run such as `ma` loses its `a`. This breaks item 2's type-ahead in common use. The fix belongs in `pressedKey`: send `TREE.TYPEAHEAD` for an unmodified `a` and call `preventDefault`.
2. Tab can skip a virtualized tree entirely. zag gives `tabIndex: 0` only to the focused node, or to the first visible node when none is focused (`tree-view.connect.mjs:255`, `getNodeState` `focused`). The box is `-1`. When that node's row is outside the window it has no element, so no element in the tree is tabbable. The common case is the Files tree with nothing selected: after scrolling more than the window plus 5 rows, Tab from the header passes over the tree. The same holds for a selected row scrolled away, and for a changed file in the Repositories tree. This breaks item 2 ("the tree one stop of the focus order"). Found by reading the code; not browser-verified.
3. Focus is lost when the focused row is scrolled out. `VirtualRows.svelte:205` draws only `drawn.indexes`, and no `rangeExtractor` keeps the focused or stop index. A wheel scroll that takes the focused row out of the window unmounts it, the browser moves the focus to `body`, and the arrow keys stop answering until a press. Before the step every row stayed in the page. The brief says "with no visible difference in their scrolling". A range that always includes the stop row would fix both this and item 2. Found by code reading, not browser-verified.
4. Cmd+A on a focused row is taken by the machine. zag sends `SELECTED.ALL` and calls `preventDefault` (probe). `pressedKey` passes it through, so the browser's select-all no longer works while a tree row has focus. The report does not state this change.
5. The open commit's files are read again on every scroll-in. `CommitFiles` is drawn inside the virtualized item (`Graph.svelte:227-229`) and reads `GET /api/git` when it mounts (`CommitFiles.svelte:34-36`). Scrolling the open commit out and back in unmounts and remounts it, which issues a new request and shows the pending row again. A key move to one of those file rows while the commit is not drawn has a related problem: `reveal` scrolls the commit in, the pending focus fires once the commit index is drawn, the files are still loading, so `nav.focus` finds no element and the focus does not move. The report states neither.
6. Every mount builds every row first. The report states this as a limitation rather than fixing it: `drawn = wholeWindow(count)` while `box === null` (`VirtualRows.svelte:82`), so each mount of the Files tree, the changed files or the graph builds every row once and then windows it. Each drawn row's `nav.row` also calls `collection.getIndexPath(id)` (`TreeView.svelte:306`), which walks the collection, so the mount of an N-row folder is about N-squared node visits. Neither cost is measured. Under `agents/spec.md` ("a limitation written instead of a fix" is the lazy option), windowing from the first client render is inside item 4.
7. The report's table of visible changes misses: the indent guides staying drawn after a press on blank tree space (Spec 3), Cmd+A (item 4), and the Graph markup change (loaded commits now sit one level deeper, in `li.entry > ul.entry-rows > li.commit`, `Graph.svelte:307-314`, styles `:332-344`, while the missing, incoming and outgoing commit rows stay direct children of the section list).
8. The Files heads' 6 px gap moved from `margin-top` on `:not(:first-child)` to `padding-top` on `class:apart` (`Tree.svelte:219,295-297`). Reading the code, the two are equivalent. The look should confirm it.

The other keys match the old `rowMove` by reading the machine's transitions (`tree-view.machine.mjs:177-197`) against `pressedKey`: Up, Down, Home and End; Right on closed and on open rows; Left on open and on `fixed` rows (via `NODE.ARROW_LEFT`); Enter pressing the button. Every `TreeSection` in the views passes `ontoggle`, so the machine's Enter path on a branch with no button is not reached today.

## Not checked

- Anything in a browser: keys, focus moves, scrolling, reveal, drag, the look of the Graph wrappers and of the 6 px gap, text-scale changes. Behaviour 2 and 3 come from code reading.
- Whether zag's controlled `focusedValue` (fed from `held`/`current`) updates before a quick second key.
- Whether a Files drag survives its source row being unmounted by autoscroll during the drag.
- Whether `npm run diagrams` is stable on the worktree.
- Timings or memory of mounting a large folder (Behaviour 6).
- Every line of the svg diagrams beyond the sampled hunk.

## Usage

Reviewer: 246,225 tokens, 72 tool uses, 1,008 s (from its completion notice).

## Repair round 1, refuted

### Verification

**The verify list is red.** I ran it from the worktree's `tools/oculus` as `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q82/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`. It exits 1. Log: `scratchpad/Q82-round1-refute/checks.log`.

```
 FAIL  tests/checks/tree/negatives.test.ts > an absence asserted with no reason > is held to the counts the tree had when the check landed
+   "views/sources/files/files.test.ts asserts an absence with no reason: data-fs-row=\"big:f${String(shown - 1).padStart(2, '0')}.txt\"",
+   "views/sources/repositories/repositories.test.ts asserts an absence with no reason: data-entry=\"loose/f${String(shown).padStart(2, '0')}.txt\"",
 FAIL  tests/checks/tree/size.test.ts > a file over the size line > is on the list with a count it has not passed
+   "tests/views/sources/files/files.test.ts is 928 lines, over the line and not on the list",
 FAIL  tests/checks/tree/size.test.ts > a file over the size line > audits the awk of the verification list against this rule, over the tree as it stands
 Test Files  2 failed | 352 passed (354)
      Tests  3 failed | 5679 passed | 1 skipped (5683)
checks: failed with exit 1: npm test
```

The step does not change either failing file, but both fail because of the round's changes, and both fail when run alone:
- `npx vitest run tests/checks/tree/size.test.ts`: `Tests  2 failed | 8 passed (10)`.
- `npx vitest run tests/checks/tree/negatives.test.ts`: `Tests  1 failed | 9 passed (10)`.

The remaining commands, run one by one:
- `npm run check`: `COMPLETED 1572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
- `npm run build`: `built in 1.66s`, `built in 8.57s`, exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`, exit 0.
- `npm run lint`: `> eslint .` with no findings, exit 0.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0.
- `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md`: prints nothing.
- `npm run diagrams`: exit 0. `git status --short` afterwards shows the same 12 modified files and the report, and nothing under `docs/diagrams`, so the diagrams leave no change.

Reruns of the builder's quoted commands:
- `npx vitest run tests/ui/tree tests/views/sources/files/files.test.ts tests/views/sources/repositories/repositories.test.ts tests/state/sources/repositories/repositories.test.ts tests/checks/source/comment-width.test.ts tests/views/whole/type-scale.test.ts`: `Tests  399 passed (399)`, which matches the report.
- `grep -rn "rowMove\|stopOf" src`: no output, exit 1.
- `grep -n "zag\|virtual-core" package.json`: lines 40, 45 and 46, all under `dependencies`.
- `wc -l`: TreeView 251, VirtualRows 270, tree-keys 150, virtual.ts 67, Graph 379, files.test.ts 928, repositories.test.ts (views) 708, tree-keys.test 199, tree.test 288, virtual.test 134. These match the report's table.
- The label-pruning effect is at `TreeView.svelte:93-98`, as the report cites.
- The report's first-run count ("15 failed | 82 passed (97)") is quoted from the first refuter and marked not re-run, as the round asked. I ran the tests as delivered now against the base source, with `git diff 3fefa8ff -- tools/oculus/src` reversed by `patch -R` in `scratchpad/.../base`: `Test Files 5 failed (5)`, `Tests 20 failed | 9 passed (29)`. The count differs because `virtual.test.ts`, `tree-keys.test.ts` and `files.test.ts` now fail at import. No decision rests on this number.

The report's reverts, each reproduced on the copy in `scratchpad/Q82-round1-refute/copy` with `rev.py` (apply the change, run the one file, restore, and assert the file is back byte for byte):
- `indexPaths`, `paths.set(child.value, path)`: "is its place among its parent's children..." `AssertionError: expected [] to deeply equal [ +0 ]`, 1 failed | 15 passed.
- `keyRoute`, `a` returns `'machine'`: `expected 'machine' to be 'type-ahead'`, 1 failed.
- `keyRoute`, every letter returns `'type-ahead'`: `expected 'type-ahead' to be 'machine'`, 1 failed.
- `keyRoute`, the Meta/Ctrl line dropped: `expected 'type-ahead' to be 'withhold'`, 1 failed.
- `keyRoute`, the `*` line dropped: `expected 'machine' to be 'withhold'`, 1 failed.
- `keyRoute`, Space always `'machine'`: `expected 'machine' to be 'withhold'`, 1 failed.
- `keyRoute`, last line `'withhold'`: 2 failed ("hands every other letter..." and "hands the tree's own keys...").
- `rowWindow`, `after` from the first drawn row's start: 4 failed, first `expected 19910 to be 19250`.
- `rowWindow`, `let end = 0`: `expected 2390 to be 2090`, 1 failed.
- `keptRange`, `defaultRangeExtractor(range)` alone: `expected [ 95, 96, ... ] to deeply equal [ 3, 95, 96, ... ]`, 1 failed.
- `keptRange`, an array with each kept index pushed: `expected [ 95, ..., 100, 100, ... ] ...`, 1 failed.
- `keptRange`, the bounds test dropped: "ignores a kept index the list does not hold" failed.
- `firstWindow`, `shown = count`: `virtual.test.ts` `expected [ +0, 1, ..., …(991) ] to deeply equal [ +0, ..., 9 ]`; `files.test.ts` `expected 31 to be 10`; `repositories.test.ts` `expected 30 to be 10`.
- `firstWindow`, `shown = OVERSCAN * 2` always: `expected [ +0, ..., 9 ] to deeply equal [ +0, 1, 2 ]`, 1 failed.

Every revert the report claims turns its test red as the report says.

Probes with the real virtual-core, in a scratch test file removed after:
- A 0 px box with index 3 kept draws `[]`, after 22000. So kept rows are not drawn in a box with no height, and the report's sentence "a box 0 px tall draws no rows until it has a height" holds.
- An empty list gives `{"rows":[],"after":0,"total":0}`.
- A window at the list's end with index 3 kept gives rows `3 (gap 66), 985 (gap 21582), 986...`, and the gaps and rows sum to 22000.

### Spec

1. The round is closed item by item against the round brief:
   - `keyRoute` (`tree-keys.ts:66-76`) is called from `pressedKey` (`TreeView.svelte:195-203`). Meta and Ctrl are withheld. `a` is sent as `{ type: 'TREE.TYPEAHEAD', key, id }`, the shape zag's own `onKeyDown` sends (`tree-view.connect.mjs:236`). Space inside a type-ahead goes to the machine, whose `Space` handler sends the type-ahead (`:192-198`, `isTypingAhead` from `tree-view.machine.mjs:97`).
   - `TreeNav.kept` exists. `keptRange` sits in `rangeExtractor`. `rowWindow` returns per-row gaps. The gap `li` is drawn for `at > 0`, with the first gap in the before spacer. The Graph passes `keep={opened}`. All three lists pass `owns`: `Tree.svelte:210`, `Changes.svelte:186`, `Graph.svelte` `commitAt`, which maps a file row of the open commit to that commit.
   - `firstWindow` is used while `box === null`, with the after spacer at `calc(rest * var(--tree-row) * var(--text-scale, 1))`.
   - `indexPaths` is derived once per `root`, and labels are pruned in `$effect.pre`.
   - The DESIGN.md "Its" sentence is back after "Enter presses it."

   I found no change beyond the round's items.
2. The removed empty-list case in `virtual.test.ts` did not close a finding by deleting its check. The early return it guarded is gone from `rowWindow`, so the function has no dead early return, and the empty input still computes the right window (probe above). No finding.

### Proof

1. **The round's wiring has no test that fails without it.** Each of these reverts, run on the copy over `tests/ui/tree`, the Files and Repositories view tests, `tests/state/sources/repositories/repositories.test.ts`, `explorer.test.ts`, `type-scale.test.ts`, `primitives.test.ts` and `wall.test.ts`, leaves `Tests 495 passed (495)`:
   - `kept: () => []` in `TreeView.svelte:184`;
   - the stop fallback changed to `root.children.at(-1)` (`:91`);
   - `keep={opened}` removed from `Graph.svelte:312`;
   - `keptRange(range, [])` in place of `held` in `VirtualRows.svelte:121`;
   - the `service.send({ type: 'TREE.TYPEAHEAD', ... })` line removed from `pressedKey`;
   - `* var(--text-scale, 1)` removed from the first-render after spacer.

   Most of this needs a DOM and is left to the look. The choice of the stop row is not DOM-only: `stop` is a `$derived` value that a server render computes, and a `TreeHarness` snippet printing `nav.kept()` would show it. Brief item 7 asks for a test of every case a server render or a pure function can show. The first-render after spacer's `calc(... * var(--tree-row)` is asserted in both audits, but the text-scale factor is not.
2. The two audits in `files.test.ts:262-296` and `repositories.test.ts:306-333` are named as audits, with their reverts reproduced above.

### Standards

1. **`tests/views/sources/files/files.test.ts` is 928 lines**, over the tree's 900-line check line (`tests/checks/tree/size.test.ts:30`, and `bin/size-allow.txt` lists no file). The round took it from 900 (+37 −9 per `git diff ec1939ba --numstat`) to 928 with the rewritten case 8 audit. This is the red line in `size.test.ts`. The file should be split. `tests/views/sources/files/` holds 2 files, so there is room for a new file beside it. Adding it to `size-allow.txt` would be an exemption.
2. **Two new absence assertions carry no reason comment**, which `tests/checks/tree/negatives.test.ts` requires directly above each. This is the red line in `negatives.test.ts`.
   - `files.test.ts:290-291`:
     ```
     expect(body).toContain(`data-fs-row="big:f${String(shown - 2).padStart(2, '0')}.txt"`);
     expect(body).not.toContain(`data-fs-row="big:f${String(shown - 1).padStart(2, '0')}.txt"`);
     ```
   - `repositories.test.ts:327-328`:
     ```
     expect(changes).toContain(`data-entry="loose/f${String(shown - 1).padStart(2, '0')}.txt"`);
     expect(changes).not.toContain(`data-entry="loose/f${String(shown).padStart(2, '0')}.txt"`);
     ```

   Neither red line is in the builder's report. It says "Full verify list NOT RUN" because the round said so, and it opens with "Everything in the brief and in repair round 1 is built."
3. Names the round changed, grepped across `src`, `tests`, `DESIGN.md`, `HELP.md` and `README.md` (`wholeWindow`, `drawn.before`, `drawn.indexes`, `.indexes`, "every row", "two spacers", "spacer above", "between the spacers"): no stale hit. `grep -rn "rowMove\|stopOf" src` prints nothing.
4. Checked against the code, each claim true as far as reading shows:
   - DESIGN.md:309 "a key with Cmd or Ctrl held is left to the browser", "draws its first ten rows" (`OVERSCAN * 2` = 10) and "The row holding the tree's stop, the row the focus is in and the graph's open commit stay drawn wherever the list is scrolled".
   - HELP.md:57 "Cmd or Ctrl with a letter is the browser's".
   - The head comments of `TreeView.svelte:6-9,28-32`, `VirtualRows.svelte:4-27`, `virtual.ts:1-5` and `Graph.svelte:21-25`.

   One caveat: the kept rows are not drawn while the scroll box has no height (probe), which DESIGN.md's "wherever the list is scrolled" does not mention. The report states it.
5. The round's added comment lines carry no step number, date or wording about an earlier state (grep over the `+` lines of `git diff ec1939ba -- src tests`: only spatial "before"). Every file is ASCII.

### Behaviour

1. **Withholding every key with Cmd or Ctrl held reaches further than Cmd+A and Ctrl+A.** The report's table states only those two. zag's `Enter` handler acts with a modifier on everything except an anchor (`tree-view.connect.mjs:200-205`). So Cmd+Enter and Ctrl+Enter on a tree row that draws no button (`TreeItem.svelte:198`, `onclick === undefined`, where Enter reaches the machine's `NODE.CLICK` or `BRANCH_NODE.CLICK`) now do nothing, and before this round they clicked. A row with a button is unchanged, since `TreeItem`'s own `keyed` presses the button and the machine's handler returns on `defaultPrevented`. zag already ignores arrows, Home and End with a modifier (`isModifierKey`), so they do not change. Which rows draw no button was not enumerated.
2. The report states, each with before and after: the `a` type-ahead, Cmd+A and Ctrl+A, the indent guides, the Graph markup, the Graph's Left and Right, the kept rows, the open commit read once, and the first render drawing ten rows.

### Not checked

- Anything in a browser: the keys, the type-ahead on `a`, focus kept on a wheel scroll, Tab reaching a scrolled-away stop, the open commit not re-reading its files, the first render's switch from ten rows to the window, the text-scale factor in the after spacer, drag. Everything here about these comes from reading the code.
- Whether a focus that leaves the window (`relatedTarget` null, which clears `inside`) and comes back can find its row unmounted when that row is not also the stop.
- Whether a restored scroll position in a long Files tree lands right given the first render's ten-row window.
- Which tree rows draw no button (Behaviour 1).
- Timing and memory of large mounts.

### Usage

About 45 tool calls; tokens and wall time not measured.

## Closed

Round 1 was the step's last. Each finding of the two reviews:
- First review: closed by round 1, as the round 1 review's verification and reverts show.
- Round 1, Standards 1 (`tests/views/sources/files/files.test.ts` at 928 lines, over the 900-line check line): fixed on main at landing. The long-tree audit moved to `tests/views/sources/files/tree-window.test.ts` with its own setup, and `files.test.ts` is 886 lines. `size.test.ts` passes.
- Round 1, Standards 2 (two absences with no reason): fixed on main at landing, a reason directly above each. `negatives.test.ts` passes.
- Round 1, Proof 1 (the stop row kept with no test): fixed on main at landing. `TreeHarness.svelte` writes `nav.kept()` on a hidden line, and `tests/ui/tree/tree.test.ts` "keeps drawn the row holding the stop" fails with `kept: () => []` and with the stop falling back to the last row (`Tests 1 failed | 13 passed (14)` each), and passes with the code (`Tests 38 passed (38)` over `tests/ui/tree`). The other wiring the review names (the Graph's `keep`, the range extractor's kept indexes, the type-ahead send, the text-scale factor) runs only in a browser and goes to the look.
- Round 1, Behaviour 1 (Cmd+Enter and Ctrl+Enter on a row with no button did nothing): fixed on main at landing. `keyRoute` withholds only a character with Meta or Ctrl held, so Enter and the arrows with a modifier are the machine's again, and `DESIGN.md:309` says a letter with Cmd or Ctrl held is left to the browser. The case "hands a named key with Meta or Ctrl held to the machine" fails with every modified key withheld (`Tests 1 failed | 16 passed (17)`).
- Round 1, Standards 4's caveat (no kept row drawn while the scroll box has no height): stated in the report, as the round asked.
