# Step D56 refuter report (on .agents/worktrees/D56, base dee635dbd)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

The finding that matters most: the step leaves five tree checks red, and `npm run test:landing` runs them at landing. They pass on the unchanged tree. The failing checks are `boundaries.test.ts` (two tests), `imports/order.test.ts`, `duplication.test.ts` and `comment-width.test.ts`. The brief's own verify list is green. The red checks are outside it, which is why the builder's report says "Everything in the brief is done".

## Verification (rerun by the reviewer)

All runs were made from `tools/oculus` in the worktree, with `HOME=$TMPDIR/d56rev/home` and the Node 24 `bin` first on `PATH`. The unchanged tree is a copy of `.agents/worktrees/D56-base` under `$TMPDIR/d56rev/base`, with the worktree's unchanged build files and a link to its `node_modules`.

```
1. npm run diagrams && npm run test:quick -- --base dee635dbd   (exit 0)
test:quick: 95 changed file(s), from git since dee635dbd
test:quick: 67 test file(s), 10 essential
ok      prettier (4.0 s): All matched files use Prettier code style!
ok      ASCII gate (4.5 s)
ok      svelte-kit sync (45.7 s)
ok      eslint (68.3 s)
ok      svelte-check (96.2 s): 1791582296679 COMPLETED 453 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (155.9 s): Duration  113.12s (transform 283.93s, setup 0ms, import 346.66s, tests 78.72s, environment 1.48s)
test:quick: 160.9 s (limit 45.0 s); every command passed
test:quick: over the time limit
(git diff dee635dbd --stat over docs/diagrams after the run: the same 12 files and line counts as before it)

2. npx vitest run tests/state/workbench tests/checks/config tests/data/sources/config tests/shell/panes/strip/tab-menu.test.ts tests/server/machine/runs/lint/eslint-trust.test.ts tests/server/machine/runs/lint/lint-route.test.ts --testTimeout 300000
   after the change (worktree):  Test Files  16 passed (16) / Tests  232 passed | 1 skipped (233)
   unchanged tree (copy):        Test Files  16 passed (16) / Tests  222 passed | 9 skipped (231)

4. The changed tests, copied into the unchanged-tree copy (arrangements, layout-saved, config, config-folder, pages):
   Test Files  3 failed | 2 passed (5) / Tests  6 failed | 75 passed | 2 skipped (83)
   x the workbench page parses and names only views the catalogue knows  -> expected null not to be null
   x names a code theme that is no listed id, one finding per value, case included
   x names a bad code theme in a config that has no themes list
   x says nothing for an absent code_theme, tokens or a listed id
   x holds exactly the expected top-level keys, and no more
   x reads each file on its own and finds its own keys there and nowhere else
   layout-saved.test.ts 'migrates every page, and reads which one was current': both rows pass on the unchanged tree (verbose run)

6. sh utils/folder-check.sh                       -> exit 0
   sh utils/unused-exports.sh vs D56-base list   -> "Unused exports (245)" became "(244)"; only removals (themeLabel; restate from layout/index.ts); no line added

ASCII gate (agents/spec.md form)                  -> no output, exit 0

The report's scratch runs: npx vitest run --config $TMPDIR/d56b-scratch/vitest.scratch.config.mjs --reporter=verbose
   Test Files  5 passed (5) / Tests  15 passed (15); the 33 CASE lines, sorted, are byte-identical to the report's block (diff printed nothing)

Tree checks the brief does not list. Run because of the comment and boundary rules in agents/spec.md:
   npx vitest run tests/checks/tree tests/checks/source   (worktree)
   Test Files  3 failed | 4 passed (7) / Tests  4 failed | 67 passed (71)
     comment-width: code-themes.ts:55, queries.svelte.ts:26, folder-store.ts:44, folder-store.ts:155,
       SessionList.svelte:98, SessionList.svelte:154, ProjectCard.svelte:8, EntryCard.svelte:36
     boundaries 'holds across src/lib': data/helpers/code-themes.ts imports themes/vscode-rules.json;
       views/sessions/session-list/session-list.ts imports data/model;
       views/sources/repositories/menus/view-menu.ts imports data/model;
       views/sources/search/problem-rows.ts imports data/helpers/files/paths
     boundaries 'keeps every shell file to the stores its row names': shell/rail/WorkbenchMenu.svelte reads store folders
     duplication: src/lib/shell/rail/WorkbenchMenu.svelte:112 and src/lib/views/system/workbench/Pages.svelte:326 hold the same 10 lines (0eed4591119e)
   npx vitest run tests/checks/imports tests/checks/diagrams   (worktree)
   Test Files  1 failed | 3 passed (4) / Tests  1 failed | 74 passed (75)
     order 'holds the state folders': state/sources/explorer/view/folder-pages.ts:16, :17, :23, :24 import state/workbench (above state/sources)
   Unchanged tree, the same boundaries, duplication, imports and diagrams files: Test Files  6 passed (6) / Tests  104 passed (104)
   Unchanged tree, comment-width alone: Test Files  1 passed (1) / Tests  2 passed (2)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Behaviour 1. The rest of the item holds, from CASE 1, 3, 17 and 25, which reproduce: a `folder` and `item` page with no `rail` key, one page per folder, and the words kept on a second opener.
- 2: holds. The top-level `workbench:` key is in `layout.yml:111` and has an options entry. The G54 row fails on the unchanged tree and passes after the change. CASE 23 shows the rail still refuses `page: workbench`.
- 3: holds, from CASE 7 and CASE 9-states, `problem-rows.ts:83` (`inScope`), `limit.ts` and FolderLine in four views. The layering of the code that does it breaks the boundary checks (Standards 1).
- 4: holds, from CASE 1, 4, 5 and 6, `folder-pages.ts:114-116`, and `SessionList.svelte:149-160` (pick and New in the documents pane). After a reload the landing does not hold (Behaviour 2).
- 5: holds. ProjectCard, the Entry toolbar, EntryCard, Personal, FolderFiles and `row-menu.ts` ROW_WORKBENCH are each gated on `folders.served`. The venue card and the worktree opening do not offer it.
- 6: holds. RailFoot draws WorkbenchMenu. The rows are marked active and show the page. Close goes through `createPageFlows.close`, which uses `closeAsk`, and the menu says when none is open. The shell store rule and the duplicate dialog block are Standards 1 and 3.
- 7: holds, from CASE 11, 12, 24 and 26 and the G29 table, with LAYOUT_VERSION at 7.
- 8: holds, from CASE 13, 15 and 16, and `pageFromKept` using `withoutHeld`.
- 9: violated, Spec 1. The rest holds: `codeThemeIds` puts the 19 classes first, `paintNow` uses `ownRules(code)` (CASE 18-paint), the finding sentence and the G13 rows are changed, and the menu groups are right.
- 10: violated, Standards 6. The other docs named by the item are written.

Cases of the brief's "Cases":

- 1: met, from CASE 1 and CASE 9-states. The drawn page is left to the look.
- 2: met, from CASE 2 and the G54 row.
- 3: met, from CASE 3.
- 4: met, from CASE 4.
- 5: met, from CASE 5.
- 6: met, from CASE 6.
- 7: met, from CASE 7. By reading, Problems keeps its existing root chip for a root workbench, which the report states as a judgment call.
- 8: met. CASE 8 covers the filter. Pick and New in the documents pane are shown by reading `SessionList.svelte:149-160`. Behaviour 2 limits this after a reload.
- 9: met, from CASE 9-states and reading of FolderLine in Query, Problems, Repositories and SessionList.
- 10: met by reading `WorkbenchMenu.svelte:63-89`. The rest is left to the look.
- 11: met, from CASE 11-closed and CASE 11-reopened.
- 12: met, from CASE 12-reset, 12-after-close and 12-resetall.
- 13: met, from CASE 13.
- 14: met, from the G29 version 6 row (it passes on the unchanged tree and after the change, and writes LAYOUT_VERSION).
- 15: met, from CASE 15.
- 16: met, from CASE 16.
- 17: met, from CASE 17.
- 18: met, from CASE 18-findings, -paint, -readers and -sentence.
- 19: met, from CASE 19, CASE 19-reload and reading `BrowserControl.svelte:63`. CASE 19 builds the menu with an identity labeler (`config.scratch.ts:73`), so the words come from reading and not from the run.
- 20: met, by reading (one envelope under LAYOUT_KEY in each browser's localStorage).
- 21: partial, Spec 2. Problems, Repositories and the sessions list say the root is not served. Search draws its line and says nothing until a run is refused.
- 22: met, from both CASE 22 lines.
- 23: met, from CASE 23.
- 24: met, from both CASE 24 lines.
- 25: met, from CASE 25.
- 26: met, from CASE 26. The envelope is 29197 characters with 20 kept layouts.
- The case added by ruling A (unsaved source text not brought back): met, from CASE 11-reopened (`sourceUiAfterReopen: null`).

## 1. Spec

- `src/lib/views/system/workbench/code-theme-menu.ts:73-75` with `src/lib/state/shared/words/appearance.ts:277-279`: `return theme.vscode ? label(theme.id) : theme.label;` and `return byKey(byName, name)?.label ?? name;`.
  - What is wrong: item 9 asks for each VS Code theme to be "labelled as the UI theme menu labels that class from appearance.yml themes:". `themeLabel` looks the class up by the row's `name`, not by its `class`. It works only because every shipped row has `name` equal to `class`.
  - Failure scenario: a reader's `themes:` row `{ name: my-dark, class: vscode-dark-2026, label: "My dark" }`. The Code theme menu shows `vscode-dark-2026` instead of "My dark", although `themes:` lists the class.
  - Verdict: item 9 violated.
- Case 21: Search has no unserved-root state (`grep -n "served\|gone" src/lib/views/sources/search/Search.svelte` finds only the head comment).
  - What is wrong: case 21 expects each limited view to say its folder is not served. The report's case 21 row names Problems, Repositories and the sessions list only. Search and LaTeX are not covered.
  - Failure scenario: a workbench of `other/x` after `other` leaves the workspace. Search still draws "In other/x" with no sentence, and a run is answered by the server's refusal.
  - Verdict: case 21 partial.

## 2. Proof

- `tests/state/workbench/navigation/pages.test.ts:27-30`: `const ids = (held: Page): string[] => instancesOfPages([held]).map((one) => one.id);`.
  - What is wrong: this G28 test, 'lists every instance of every pane of a page, in the tree's own order', guarded `pageInstanceIds`, the list the close question is asked over. The step made `pageInstanceIds` private (`navigation/pages.ts:84`) and still uses it in `createPageFlows.close` (`:1496` of the diff). The test now reads `instancesOfPages`, a different function, so it no longer reads the code the close runs.
  - Failure scenario: a change to `pageInstanceIds` that drops a pane's tabs makes the close question count the wrong tabs. This test stays green.

## 3. Standards

1. Layer boundaries (`agents/spec.md`, "What every package obeys": "`tests/checks/tree/boundaries.test.ts` enforces them and must pass"). The imports below fail the check, which passes on the unchanged tree:
   - `src/lib/data/helpers/code-themes.ts:12`: `import vscodeRules from '../../themes/vscode-rules.json'`. The data row allows `data/**` only.
   - `src/lib/views/sessions/session-list/session-list.ts`: `import type { Workspace } from '$lib/data/model';`.
   - `src/lib/views/sources/repositories/menus/view-menu.ts:7`: `import type { GitState } from '$lib/data/model';`.
   - `src/lib/views/sources/search/problem-rows.ts:14`: `import { pathUnder } from '$lib/data/helpers/files/paths';`. The views row allows neither `data/model` nor `data/helpers/files/paths`.
   - `src/lib/shell/rail/WorkbenchMenu.svelte:27`: destructures `folders`, which `SHELL_STORES` does not hold.
   - Failure scenario: `npm run test:landing` on main fails `npm run test:checks`, so the landing is red. The report's first line, "Everything in the brief is done", rests on a verify list that does not run this check.
2. Folder order (`tests/checks/imports/order.test.ts`, 'holds the state folders'). `src/lib/state/sources/explorer/view/folder-pages.ts:16-24` imports `state/workbench/navigation/arrangement.ts`, `state/workbench/layout/index.ts` and `state/workbench/layout.svelte.ts` from `state/sources`, which sits below `state/workbench`. The brief's path list puts "the workbench arrangement read and the page's words" in `state/workbench/navigation/`. Failure scenario: `test:checks` is red at landing.
3. DRY and the duplication check (`agents/spec.md`, "The principles every package is judged on": "a parser, a fold or a rule exists once and is reused"). `src/lib/shell/rail/WorkbenchMenu.svelte:106-114` repeats the 10-line `CloseQuestion` confirm block of `src/lib/views/system/workbench/Pages.svelte:326`, and `duplication.test.ts` names the pair. Failure scenario: `test:checks` is red at landing, and a later change to the close confirm is made in one copy only.
4. Comment width (`agents/spec.md`: "A comment edited by the step is rewrapped as a whole paragraph at 100 columns"; `tests/checks/source/comment-width.test.ts`). Eight added comment lines pass the hundredth column:
   - `src/lib/views/shared/card/ProjectCard.svelte:8` (119 columns): "that belongs to the folder, with the project view in its documents pane). A project whose folder is a repository".
   - `src/lib/views/shared/forms/entry/EntryCard.svelte:36` (156 columns).
   - `code-themes.ts:55`, `queries.svelte.ts:26`, `folder-store.ts:44` and `:155`, `SessionList.svelte:98` and `:154` (101 columns each).
   - Failure scenario: `test:checks` is red at landing.
5. Edited comments not rewrapped (the same rule). In each of these, a line inside a sentence ends short:
   - `src/lib/state/sessions/terminals.svelte.ts:218`: "* for it), with the agent's lists at the catalog's defaults. A task" (72 columns).
   - `src/lib/views/system/workbench/settings/Item.svelte:11`: "// "This browser" row has the control of the value the ui store keeps; a row of" (83 columns).
   - `src/lib/views/shared/explorer/tree/menu/row-menu.ts:10`: "// workbench of that folder (Open in New Files), a shell started in the folder" (78 columns).
   - Failure scenario: a reader sees a ragged paragraph, and the next step to touch it inherits the rewrap.
6. A docs sentence the diff makes false (`agents/spec.md`: "A sentence in a document or a head comment that the change makes false is a defect of the change"; item 10). `docs/window.md:55` says: "A pane holding a tool view takes one only when you are in it and it already holds opened tabs."
   - What is wrong: `landing.ts:138-156` now counts a tool view received with the new `document` option as a document. A Terminal, Transcript or Timeline tab that a workbench's sessions list opened therefore lets its pane take opened tabs when the reader is not in it.
   - Neither `docs/window.md` ("Where an opened tab lands") nor DESIGN.md ("Opened views land beside the tools") names the `document` option.
   - Failure scenario: a reader works out from the guide where a project will land in a workbench whose documents pane holds a Transcript, and gets it wrong.
   - Verdict: item 10 violated.
7. The report has no table of edits to existing assertions (`agents/spec.md`: "The report lists every edit to an existing assertion, allow list or predicate with its before and after, made from a diff of each changed test file"). The changed assertions are:
   - `config.test.ts:609` (the CODE sentence);
   - `config-folder.test.ts:167` (the key list gains `workbench`);
   - `pages.test.ts:27-30` (`pageInstanceIds` replaced by `instancesOfPages`);
   - `layout-saved.test.ts` (the `describe` title and the single `it` turned into a table);
   - `arrangements.test.ts` (the `it.each` source).
   The report mentions three of them in passing and gives no before and after. Failure scenario: the orchestrator cannot check from the report that no assertion was loosened.
8. The history grep is not quoted (`agents/spec.md`: "the report quotes the grep with each hit judged"). The report says the grep "printed lines that describe behaviour" and quotes none. The reviewer's own grep of the added comments and titles found 6 hits ("before", "still"), each a description of behaviour, so nothing is wrong in the code. Failure scenario: the hits cannot be audited from the report.

## 4. Behaviour

1. `src/lib/state/workbench/layout.svelte.ts:473`: `const named = held.find((page) => page.rail === undefined && page.label === label);`.
   - What is wrong: a workbench page carries no `rail` key, and its words are a project, entry or side project title, a folder's name or a Pages rename. When the rail page of a button is not open, pressing that button adopts any page without a `rail` key whose words equal the button's label (line 476-478 gives it `rail: key`).
   - Item 1 says a workbench has no `rail` key and every rail page stays as it is. The step did not exclude `page.folder !== undefined` here, and the report does not state the effect.
   - Failure scenario: a side project titled "Apps" is open as a workbench, and the Apps page has been closed. The reader presses the Apps rail button. The workbench is shown as the Apps page and gains `rail: 'apps'`, and the next Reset all pages rebuilds it from the `apps` arrangement, throwing away its folder tabs.
   - Verdict: item 1 violated.
2. `src/lib/state/workbench/layout/open/landing.ts:59-89` with `SessionList.svelte:149-160`.
   - What is wrong: Transcript, Timeline and Terminal are catalogue tool views (`group: 'sessions'`). They count as documents only while their ids are in the page's received list, which the attention store does not save (DESIGN.md, "Opened views land beside the tools"). After a reload, a workbench's documents pane holding one of them is a tool pane.
   - In `landingFor`: the reader's pane (the sessions list) holds no opened tab, no pane is empty, and no pane is free of tools. The next pick therefore splits a new pane off the left pane.
   - The report's before and after and `docs/window.md` ("a session picked in the sessions list opens its Transcript and Timeline in the documents pane") do not state this.
   - Failure scenario: a workbench has a Transcript in its documents pane. The reader reloads and picks another session. A third pane opens to the right of the left tool pane instead of the Transcript landing in the documents pane.
3. `src/lib/views/sources/search/Problems.svelte:2792-2794`: `{#if !served} <Empty message={t('problems.root_gone', scope)} ...`.
   - What is wrong: this applies to every Problems tab with a `scope`, including the one the TeX view's Show Problems opens, not only to a workbench's tab. Before the change such a tab showed the empty or filtered list. The visible-changes table names Problems only "in a workbench".
   - Failure scenario: the TeX view's Show Problems for a root that is then removed from the workspace now says "<root> is not a root this workspace serves, so it has no problems to list." The reader was not told of this change.
4. `config/text/views/sources/search.yml:88-91`: `clear_scope_glyph: dismiss` is removed and `clear_scope_title: Search every folder of the root again` is added.
   - What is wrong: Search's clear control outside a workbench now carries a new tooltip, drawn by FolderLine with a literal `dismiss`. The report's table does not list it.
   - Failure scenario: the look on landing does not check the Search clear control's tooltip, because nothing says it changed.

## Declined to judge

- Reset all pages moves a held unique view out of a workbench whose rail-page arrangement names it. The report lists this as a judgment call. It sits between Z757 (k) ("leaves workbenches ... as they are") and DESIGN.md's unique-view rule ("the builds from the config take a held instance in"). Which rule wins is the orchestrator's or Axel's call.
- Whether Transcript and Timeline tabs opened from a workbench pick are reused or added again on each pick. That needs the page, so it goes to the look.
- The "Open in New Files" words for an action that opens a page and not a Files tab. The plan line dictates the words.
- The test:quick time (160.9 s against the 45 s limit). Several suites were running on the machine at once, and nothing rests on the figure.
- The report's first-run section for the unchanged tree is the earlier builder's and was not rerun by the builder or by me. Its scratch files are under `$TMPDIR/d56-scratch`, and I did not run them.

Reviewer usage: a17e012de19ee2885, claude-opus-5-5, 346,450 tokens, 92 tool uses, 30.1 min.

## Repair round 1, refuted

Reviewer of D56 (the workbench) over repair round 1. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D56`, base dee635dbd. The round's delta is the 78 files newer than the round brief's mtime (2026-10-10 00:11:01), found with `find . -newer $TMPDIR/d56r1.ref` with `node_modules`, `.svelte-kit` and build folders left out. I read it against the whole `git diff dee635dbd` (95 tracked files changed and 11 untracked files). I changed nothing. Every run set `HOME=$TMPDIR/d56r1/home`. Port 8811 was free before and after (`lsof -iTCP:8811 -sTCP:LISTEN` exit 1 both times). `git status --short` printed 106 lines before and after my runs.

Two defects stop round items 7 and 10 from holding. Item 10 (Behaviour 1): the documents pane loses its mark when its last tab is closed, and after a reload a pick in the sessions list splits a new pane again. Item 7 (Spec 1): Repositories and the sessions list still tell a served root as not served while the workspaces load, and Search, LaTeX and Problems do not.

### Verification lines, verbatim

`npm run test:quick -- --base dee635dbd` (exit 0):
test:quick: 106 changed file(s), from git since dee635dbd
test:quick: 80 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (23.6 s)
ok      svelte-check (24.1 s): 1791588223162 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (30.7 s): Duration  26.53s (transform 62.73s, setup 0ms, import 78.63s, tests 23.03s, environment 436ms)
test:quick: 31.2 s (limit 45.0 s); every command passed

`npx vitest run tests/state/workbench tests/checks/config tests/data/sources/config tests/shell/panes/strip/tab-menu.test.ts tests/server/machine/runs/lint/eslint-trust.test.ts tests/server/machine/runs/lint/lint-route.test.ts --testTimeout 300000` (exit 0):
Test Files  16 passed (16)
Tests  233 passed | 1 skipped (234)

`npm run test:checks` (exit 0):
Test Files  17 passed (17)
Tests  265 passed | 1 skipped (266)

`sh utils/folder-check.sh`: no output, exit 0.

`sh utils/unused-exports.sh` against `D56-base/tools/oculus/unused-exports.txt`:
- Both print `Unused exports (245)`, and both files have 364 lines.
- `diff` shows three changes: `restate` is gone from the `layout/index.ts` line, `Workspace` is gone from the `selectors.svelte.ts` line, and `pageInstanceIds` is added to the `navigation/pages.ts` line.
- Counted by name, the lists hold 1039 names on the base and 1038 after.
- `pageInstanceIds` lost its importer `Pages.svelte`, because the close flow moved into `createPageFlows` in `pages.ts`. Round item 8 asks for it to stay exported.

ASCII gate in the `agents/spec.md` form, over `src tests bin config` with `! -name local.yml`: no output, exit 0. `bin` does not exist. `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, `docs/*.md`, the report and the changed `utils`, `shell/rail` and `ui/tabs` files: no output.

`node utils/migrations/convert-vscode-themes.ts --check`: `19 themes up to date`, exit 0.

The round's scratch runs (the builder's `d56c-scratch` copied to `$TMPDIR/d56r1/c-scratch`), `npx vitest run --config .../vitest.scratch.config.mjs --silent=false --reporter=verbose`:
- `Test Files  3 passed (3)` and `Tests  7 passed (7)`.
- The 13 `RUN` lines, sorted, are byte-identical to the report's block (`diff` printed nothing). That covers RUN 6, 7, 9, 10 and 11.
- I read the three scratch files. Each sets the state the report describes and prints what it reads.

The older scratch set (`d56b-scratch` copied to `$TMPDIR/d56r1/b-scratch`), same form:
- `Test Files  5 passed (5)` and `Tests  15 passed (15)`.
- The 33 `CASE` lines, sorted, are byte-identical to the report's "cases after the change" block.

The changed tests on the unchanged tree. My copy of `D56-base/tools/oculus` is under `$TMPDIR/d56r1/basecopy`, with the worktree's build files and links to `node_modules`, `assets` and `demo`; `diff -rq` of its `src` against the base printed nothing.
- `pages.test.ts` and `layout-saved.test.ts` as on the base: `Test Files  2 passed (2)`, `Tests  13 passed (13)`. This includes "lists every instance of every pane of a page, in the tree's own order".
- The five current test files copied in (`cmp` equal for all five):
  - `Test Files  4 failed | 1 passed (5)` and `Tests  7 failed | 75 passed | 2 skipped (84)`.
  - The 7 failure titles and their assertion lines are the ones the report quotes.
  - The G29 failure is at `layout-saved.test.ts:70:58`, on the missing `"documents": true`.
- After the change, in the worktree, the same five files pass inside the scoped run above. `git diff dee635dbd -- tests/state/workbench/navigation/pages.test.ts` prints nothing.

Line counts: `wc -l` of the 93 changed non-diagram files, against the base copy. Sorted, the rows are the same as the report's table, and no `.ts` file is over 880 and no `.svelte` file over 520.

History grep: my grep of the added lines (comments, docs, catalogue, test titles) for the spec's words gives 17 hits on 14 lines, the same set as the report's table. Each describes present behaviour.

Comment rewrap: my finder over the added and changed comment lines of `src`, `tests` and `utils` checks for a line that ends while the next word would fit by column 100. It printed `hits 0`. `terminals.svelte.ts:216-222`, `Item.svelte:8-13` and `row-menu.ts:1-16` read as rewrapped.

Two scratch runs of my own (`$TMPDIR/d56r1/r-scratch`), quoted under the findings: `LOADING ...` and `RUN M-*`.

Closures: checked that no check was loosened.
- `git diff dee635dbd --stat -- tests` names only `arrangements.test.ts`, `config-folder.test.ts`, `config.test.ts` and `layout-saved.test.ts`. None of them changed in this round.
- `tests/checks/tree/boundaries.test.ts` (which holds `SHELL_STORES`), the duplication, order and comment-width tests are unchanged.
- `pages.test.ts` is identical to the base.

### Verdicts

Items of the brief's "What to build", over the whole diff:
- 1 (the workbench page): holds. The adoption no longer takes a workbench (`float/pages.ts:63`, `adoptedPage`; RUN 9).
- 2 (the arrangement): holds.
- 3 (each tab limited to the folder): holds.
- 4 (the documents pane): partial, Behaviour 1.
- 5 (the openers): holds.
- 6 (the Workbenches button): holds. The close question is drawn by `ui/tabs/CloseQuestions.svelte`.
- 7 (the kept layout): holds.
- 8 (unique views): holds.
- 9 (the VS Code code themes): holds. The label comes from the `themes:` row whose `class` matches (RUN 6).
- 10 (the docs): holds, except that one `docs/window.md` sentence is made false by Behaviour 1's defect.

Cases of the brief:
- 1 to 7: met.
- 8: met as written (no reload in the case). Behaviour 1 limits it after the documents pane empties and the page is reloaded.
- 9 to 20: met.
- 21: met. Search and TeX now say the root is not served (RUN 7), as do Problems, Repositories and the sessions list.
- 22 to 26: met.
- The case ruling A added (unsaved source text not brought back): met.

Items of the round brief:
- 1 (layer boundaries): holds.
  - `code-themes.ts` holds a static class list, checked by the converter's `--check`, and imports nothing outside `data/`.
  - The views take `Workspace`, `GitState` and `pathUnder` through state modules, as the other views do.
  - The rail gets Reset layout through a context function the page provides (`workbench-reset.ts`). That follows the page-to-shell route `provideFileProblems` already uses, and `SHELL_STORES` is unchanged.
- 2 (folder order): holds. The module is now under `state/workbench/layout/open/float/`, and no reference to the old path is left.
- 3 (one close question): holds.
- 4 (comments): holds.
- 5 (the landing rule in the guide and the design): holds.
- 6 (Code theme label): holds (RUN 6).
- 7 (not-served Search and LaTeX): partial, Spec 1.
- 8 (`pageInstanceIds` and its test): holds.
- 9 (no adoption of a workbench): holds (RUN 9).
- 10 (the documents mark): partial, Behaviour 1.
- 11 (Reset all pages and a held unique view): holds (RUN 11; DESIGN.md:483, `docs/window.md`).
- 12 (two kept changes stated): holds.
- 13 (the report): holds, except that its first line says items 1 to 13 hold. Items 7 and 10 are partial, and Standards 1 applies.

Traces of the disclosed runs: I found no file of theirs in the worktree.
- The read-only `git status` touches only the index, which lives under the main repository's `.git/worktrees/`.
- For the earlier real-HOME runs: `git status --short` lists only the step's 95 tracked changes and 11 new files.
- `ls -la config` shows no `local.yml`.
- A `find` for stray names (`.oculus`, logs, scratch files, coverage, tmp) outside `node_modules` and `.svelte-kit` found only tracked files.
- The only directories newer than the round brief are the four the step writes.

### 1. Spec

1. `src/lib/state/sources/fs-transport.ts:103-106` against `src/lib/state/sources/explorer/view/limit.ts:41-48`, read by `Repositories.svelte:386-390` and `SessionList.svelte:98-115`, and the third rule at `folder-opener.ts:101`.
   - The hunks:
     - `export function servesRoot(saved: WorkspacesState, root: string): boolean { const roots = readRoots(saved); return roots === null || roots.some((one) => one.key === root); }`
     - `const root = roots.find((one) => one.key === folder.root); const base = root === undefined ? '' : (root.real ?? root.dir); return base === '' ? null : joinPath(base, folder.path);`
     - `message={folder !== null && limitDir(fsRoots(), folder) === null ? t('repositories.folder_gone', folder.root) ...`
   - What is wrong:
     - Round item 7 asks Search and LaTeX to use "the words and with the state Problems, Repositories and the sessions list use".
     - The builder added `servesRoot`, which counts a root as served while the workspaces are being read or failed to read. Search, LaTeX and Problems use it; this round also switched Problems to it, beyond the item's two views.
     - Repositories and the sessions list still decide from `fs.roots()`, which is empty while the workspaces load (`fs.svelte.ts:490-493`). So the five limited views run two rules with different answers.
     - A third copy of "is this root served" is `served` in `folder-opener.ts:101`, against the principle that a rule exists once.
   - Failure scenario: a workbench of `hub/projects/x` is open and the page reloads. While the workspaces are being read, the sessions list says "hub is not a root this workspace serves, so it lists no session." (and Repositories the same when no repository has arrived yet). Search, Problems and TeX say nothing. If the workspaces read fails, the two views keep saying it.
   - My scratch run (`$TMPDIR/d56r1/r-scratch`, server renders of `SessionList` and `Search` over an `emptyClient`) printed: `LOADING {"workspacesLoading":true,"rootsNow":0,"sessionsSaysGone":true,"searchSaysGone":false}`.
   - Verdict: round item 7 partial.

### 2. Proof

none

### 3. Standards

1. `.scratch/migration/agents/reviews/D56-report.md:209`: "Each new function was searched for before it was written (`grep -rn "<name>\|<what it does>" src/lib`)."
   - What is wrong: the brief's verify item 7 asks for the reuse grep before each new function, quoted. The report quotes none for this round's new functions (`servesRoot`, `themeClassLabel`, `adoptedPage`, `markDocuments`, `provideWorkbenchReset`, `useWorkbenchReset`). A grep for "served" would have found `readRoots` and the existing `served` of `folder-opener.ts:101`, and `limitDir`, which Spec 1 shows now disagree.
   - Failure scenario: the orchestrator cannot see from the report that the second served-root rule was written beside an existing one.
   - Verdict: brief verify item 7 not met in the report. This does not change the item verdicts above.

### 4. Behaviour

1. `src/lib/state/workbench/layout/tree.ts:178-185`.
   - The hunk: `function keptPane(pane: Pane, view: ViewId, keep?: KeepRule): Pane | null { ... const left = keep?.(view) === 'terminals' ? emptiedTerminals() : emptyPane(); if (pane.added === true) left.added = true; if (locked) left.locked = true; return left; }`
   - What is wrong:
     - Round item 10 asks for the documents mark to be "carried through every rebuild". `repane` carries it (`model.ts:306`).
     - The empty pane left when a pane's last tab is closed or dragged out is built by `keptPane`, which copies `added` and `locked` and drops `documents`. Closing the project view, or the last Transcript, in a workbench's documents pane therefore removes the mark for good: the saved layout no longer holds it.
     - Once a Transcript is opened there again and the page reloads, the documents pane holds a tool view the received list no longer names, and the next pick splits a new pane. That is the scenario item 10 was sent to end.
     - It makes false the `docs/window.md` Workbenches sentence "so a view opened from the workbench lands in it first, also after a reload, and splits no new pane", and brief item 4's documents-pane landing.
   - Failure scenario, from my scratch run built on the builder's store harness (`$TMPDIR/d56r1/r-scratch/mark.scratch.ts`): open a workbench for `hub/projects/x`; open Transcript s1 with `{ document: true }`; close that tab; open Transcript s2 with `{ document: true }`; read the saved string into a second client; open Transcript and Timeline of s3 with `{ document: true }`. It printed:
     - `RUN M-opened: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s1"]],"mark":[1]}`
     - `RUN M-closed: {"panes":[["files","search","repositories","latex","problems","session-list"],[]],"mark":[]}`
     - `RUN M-reopened: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s2"]],"mark":[]}`
     - `RUN M-after-reload-pick: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s3","timeline:s3"],["transcript:s2"]],"paneCount":[2,3],"mark":[]}`
   - Verdict: round item 10 partial; brief item 4 partial.

### Declined to judge

- Whether the documents mark should also come back when the documents pane is floated and returned to the page. `readFloat` (`saved.ts:653`) deletes it on read, and I did not run the in-memory path.
- The meaning of the `(245)` header of `unused-exports.sh`, which is the same on the base and after while the name count drops from 1039 to 1038. The report states it as not verified, and no decision rests on it.
- The report's first run of the cases on the unchanged tree is the earlier builder's. It was not rerun by the builder, by the first reviewer or by me.
- The test:quick time (31.2 s in my run). Other suites may have been running on the machine.
- Whether `CloseQuestions` belongs in `ui/tabs/`, since it asks about pages. The boundary and folder checks pass, and placement inside `ui/` is a judgment of naming.

Usage: ad867f75f854aa81e, claude-opus-5-5, 299,026 tokens, 88 tool uses, 15.3 min.

## Closed

- Repair round 1, Behaviour 1 (the documents mark dropped when the documents pane's last tab closes): fixed at landing; `keptPane` (`src/lib/state/workbench/layout/tree.ts`) carries `documents` to the empty pane it leaves, as it carries `added` and `locked`. The reviewer's scenario (open Transcript s1, close it, open s2, reload, pick s3) printed `"paneCount":[2,3],"mark":[]` on the round's tree and prints `"paneCount":[2,2],"mark":[1]` on the gate after the fix. No guarded entry covers a pane emptied by a close, so no test was added.
- Repair round 1, Spec 1 (Repositories and the sessions list calling a root not served while the workspaces load): fixed at landing; `Repositories.svelte` and `SessionList.svelte` decide the not-served sentence with `servesRoot(workspaces(), folder.root)`, the rule Search, LaTeX and Problems use, so all five views answer alike while the workspaces load. Checked by reading. `served` in `folder-opener.ts` stays: it decides whether an open can resolve the folder's directory now, a different question, and a workbench is not opened for a root that may not exist.
- Repair round 1, Standards 1 (the report quotes no reuse grep for the round's new functions): closed by the fix above, which removed the second served-root rule the grep would have found; named in the booking.
