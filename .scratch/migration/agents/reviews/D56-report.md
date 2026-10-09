Round 1 is done: items 1 to 13 hold after the last change, each with the command named in the table below. Not exercised by a run: the Enter-key and button handlers of Search's not-served guard (read at `Search.svelte:140,148,167,174`) and everything only the page shows (listed under "Left to the look at landing"). No check in this report is a render of the page in a browser; the components are covered by `svelte-check` (0 errors), `eslint`, the server renders of RUN 7, and reading.

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

None. Read from `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout (`grep -n "^## Open items" -A6`), whose list reads `None.`

## Disclosures

One read-only git command ran in the worktree during this round (a `git status`), against the rule that no git command is run. Its output was discarded and it edited no file; it may have refreshed the worktree's index stat cache.

Every command of this round set `HOME` under `$TMPDIR` (`${TMPDIR}d56c-home`, and `${TMPDIR}d56b-home` for the older scratch set). The earlier builder's first scratch runs and its first run of verify item 2 on the unchanged tree used the real HOME, and whether any of them read `~/.oculus` is not known.

The unchanged-tree runs of this round were made in a copy of `.agents/worktrees/D56-base/tools/oculus` under `$TMPDIR/d56c/basecopy` (the base copy is read-only), with the worktree's `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc` and `package-lock.json`, and links to its `assets`, `demo` and `node_modules`. `diff -rq` of its `src` against the base's `src` printed nothing. A copy outside the hub skips the tests that read the real hub, so its skipped count differs from the worktree's.

## Round 1, item by item

Commands run from `tools/oculus` in the worktree with `HOME=${TMPDIR}d56c-home` and the Node 24 `bin` first on `PATH`. "tree checks" is `npm run test:checks`, whose last run printed `Test Files  17 passed (17)` and `Tests  265 passed | 1 skipped (266)`; it includes `tests/checks/tree` (`boundaries`, `duplication`, `size`), `tests/checks/source` (`comment-width`, `history`) and `tests/checks/imports` (`order`, `cycles`).

| Item | What exists now | Proof |
|---|---|---|
| 1 Layer boundaries | `data/helpers/code-themes.ts:28` holds the 19 classes as `VSCODE_THEMES` and imports nothing outside `data/`; `themes/vscode-rules.json` is read only by the ui `theme.ts`; `utils/migrations/convert-vscode-themes.ts:774` (`listProblems`) makes `--check` fail when the list and the rules differ. `session-list.ts:11` and `view-menu.ts:7` take `Workspace` and `GitState` from `state/client/selectors.svelte`; `problem-rows.ts:14` takes `pathUnder` from `state/sources/fs` (`fs.ts:25` re-exports it). The rail reaches the reset function through `shell/rail/workbench-reset.ts` (`+page.svelte:239` calls `provideWorkbenchReset`), so no shell file reads `folders`. `tests/checks/tree/boundaries.test.ts` is unchanged. | tree checks pass; `node utils/migrations/convert-vscode-themes.ts --check` printed `19 themes up to date` |
| 2 Folder order | The opener is `state/workbench/layout/open/float/folder-opener.ts` (`createFolderPages`); `state/sources/explorer/view/folder-pages.ts` no longer exists; `float/folder-pages.ts` is the pure half, `float/folder-store.ts` the store. | tree checks pass (`imports/order`); `sh utils/folder-check.sh` exit 0 |
| 3 One close question | `ui/tabs/CloseQuestions.svelte` (props `closing`, `question`, `onclose`, `onclear`) is drawn by `WorkbenchMenu.svelte:109` and `Pages.svelte:313`. | tree checks pass (`tree/duplication`) |
| 4 Comments | Every added or edited comment paragraph is rewrapped whole by column 100. | tree checks pass (`source/comment-width`); the rewrap finder (`python3 $TMPDIR/d56c/wrapcheck.py`) over the touched files printed `0` |
| 5 Docs | `docs/window.md:55` ("Where an opened tab lands"), `DESIGN.md:482` and `DESIGN.md:234,238` state the `document` option and the documents pane of a workbench; the grep `grep -rniE "\blands?\b|landing|documents pane|beside the tools|opened for something|cover the tool" docs DESIGN.md HELP.md README.md config/text` was read in full, and no other sentence it printed is made false (`docs/window.md:21,39`, `DESIGN.md:504,515,559` use "lands" for other things). `docs/views.md` and `docs/window.md` carry the Code theme and not-served sentences. | the grep above |
| 6 Code theme labels | `themeClassLabel` (`state/shared/words/appearance.ts:286`) words a VS Code theme by the `themes:` row whose `class` matches, else the class; `BrowserControl.svelte:63,124` pass it to `codeThemeMenu` and `codeThemeLabel`. | RUN 6 |
| 7 Not-served Search, Problems, TeX | `servesRoot` (`state/sources/fs-transport.ts:103`) is shared; `Search.svelte:111` (`served`), `:140,148,167,174` (no search sent), `:230` (Run disabled), `:282` (the words); `Problems.svelte:102,302`; `tex-root.svelte.ts:89` (`gone`), `Latex.svelte:185` (the words); texts `search.root_gone` (search.yml:162), `problems.root_gone` (search.yml:27), `latex.root_gone` (latex.yml:151). `servesRoot` answers yes while the workspaces are being read or failed to read. | RUN 7 |
| 8 `pageInstanceIds` | exported from `navigation/pages.ts:84`; `tests/state/workbench/navigation/pages.test.ts` is identical to the base file and reads it. | `diff` of the test against the base printed nothing; the two runs under "The changed tests" |
| 9 Adoption | `adoptedPage` (`float/pages.ts:63`) takes a page only with no `rail`, no `folder` and the same label; `layout.svelte.ts` `openRailPage` uses it. | RUN 9 |
| 10 Documents mark | `Pane.documents?: true` (`model.ts:66`), carried by `repane` (`model.ts:306`), set by `markDocuments` (`tree.ts:383`) from `folder-opener.ts:97`, read by `saved.ts:389` (absent reads as absent), removed from a float's pane (`saved.ts:653`); `landing.ts:73` lands in the marked pane first for a page with `folder` (`opening.ts:330`). G29 row for a saved pane with the mark. | RUN 10; the G29 row fails on the base copy and passes after |
| 11 Reset all pages | `resetAll` passes the workbench pages as `fixed` to `createClaims` (`float/pages.ts:198-221`), so a unique view a workbench holds stays and the rail page is built without it; `DESIGN.md` and `docs/window.md` state it in one clause. | RUN 11 |
| 12 Two kept changes | Problems `root_gone` on every Problems tab, and Search's clear tooltip `Search every folder of the root again` outside a workbench too. | both in the visible changes table |
| 13 Report | this file, handed back as the final message. | |

## The runs the items quote

Scratch files `menu.scratch.ts`, `views.scratch.ts` and `store.scratch.ts` in `$TMPDIR/d56c-scratch`, none in the tree, run after the last code change with `npx vitest run --config $TMPDIR/d56c-scratch/vitest.scratch.config.mjs --silent=false`; the output is saved at `$TMPDIR/d56c/scratch-c2.out`. The lines as printed:

```
RUN 6-shipped: {"menu":{"vscode-dark-2026":"vscode dark 2026","vscode-light-modern":"vscode light modern","vscode-red":"vscode red"},"current":"vscode dark 2026"}
RUN 6-renamed-row-and-no-red-row: {"menu":{"vscode-dark-2026":"My dark","vscode-light-modern":"vscode light modern","vscode-red":"vscode-red"},"current":"My dark"}
RUN 7-search-gone: {"says":true,"runs":0,"disabledAttributes":1,"emptyStateDrawn":true}
RUN 7-search-served: {"says":false,"runs":0,"disabledAttributes":0,"emptyStateDrawn":true}
RUN 7-latex-gone: {"says":true,"stateAsked":[]}
RUN 7-latex-served: {"says":false,"stateAsked":[]}
RUN 7-loading: {"searchSays":false,"latexSays":false}
RUN 9: {"railPageShown":true,"workbenchStillFolderPageWithoutRail":true,"onScreenIsWorkbench":false,"pages":[{"label":"Page 1","rail":null,"folder":null},{"label":"Apps","rail":null,"folder":"projects/apps"},{"label":"Apps","rail":"apps","folder":null}]}
RUN 10-built: {"documentsMark":[1],"panes":[["files","search","repositories","latex","problems","session-list"],[]]}
RUN 10-before-save: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s1"]],"mark":[1]}
RUN 10-read-back: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s1"]],"mark":[1],"savedPaneMarks":1}
RUN 10-after-pick: {"panes":[["files","search","repositories","latex","problems","session-list"],["transcript:s1","transcript:s2","timeline:s2"]],"paneCount":[2,2],"mark":[1]}
RUN 11: {"before":{"sys":0,"wb":1},"after":{"sys":0,"wb":1},"changed":true,"systemTabs":["status"],"workbenchTabs":["files","settings"]}
```

- RUN 6: a `themes:` row `{ name: my-dark, class: vscode-dark-2026, label: "My dark" }` (and no `vscode-red` row) gives the menu and the current-theme label `My dark` for `vscode-dark-2026`; `vscode-red`, which no row carries, keeps its class name; the shipped config gives the class words of the theme list.
- RUN 7: server renders of `Search` and `Latex` (`svelte/server` with `clientContext(emptyClient())` from `tests/fixtures/client.ts`), not a browser. `says` is whether the sentence is drawn: true for the root `gone`, false for the served root `hub`; the Search Run button carries one `disabled` attribute for `gone` and none for `hub`; `runs` is 0 in both because a render fires no event; `stateAsked` is empty in both TeX lines and shows nothing; with the workspaces still being read, neither view says the root is gone. The handlers' early returns are read at the lines given, not run.
- RUN 9: a workbench titled `Apps` open with no rail key, no Apps rail page, then `openRailPage('apps', 'Apps', ...)`: a third page is made with `rail: apps`, the workbench keeps its folder and has no rail key, and it is not the page on screen.
- RUN 10: a workbench for `projects/x` is built with the mark on pane 1; a Transcript for session s1 is opened with the `document` option and lands in pane 1; the saved string holds one `"documents":true`; a second client built over that string has the same panes and the mark; opening a Transcript and a Timeline of session s2 with the `document` option lands both in pane 1 and the pane count stays 2.
- RUN 11: an envelope with a `system` rail page (one `status` tab) and a workbench holding Files and Settings, then `resetPages` with a `system` arrangement naming `status` and `settings`: the workbench still holds Settings (1 before, 1 after), and the System page is built with `status` only.

The older scratch set (`store`, `config`, `saved`, `sessions` and `reload` in `$TMPDIR/d56b-scratch`) was run again after the last code change: `Test Files  5 passed (5)`, `Tests  15 passed (15)`; its 33 `CASE` lines are under "The cases after the change".

## The changed tests, on the unchanged tree and after

Command in both trees: `npx vitest run tests/checks/config/arrangements.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/navigation/pages.test.ts --testTimeout 300000`. The unchanged tree is the base copy with those five current test files copied in (`cmp` against the worktree's files printed equal for all five). It printed `Test Files  4 failed | 1 passed (5)` and `Tests  7 failed | 75 passed | 2 skipped (84)`, with these failures as printed:

```
FAIL tests/checks/config/arrangements.test.ts > the arrangements of config/layout.yml > the workbench page parses and names only views the catalogue knows   -> expected null not to be null
FAIL tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more   -> expected [ 'agents', 'apps', ...(113) ] to deeply equal [ 'agents', 'apps', ...(114) ]
FAIL tests/checks/config/config-folder.test.ts > oculus's own config directory > reads each file on its own and finds its own keys there and nowhere else   -> expected [ 'archive_label_mode', ...(13) ] to deeply equal [ 'archive_label_mode', ...(14) ]
FAIL tests/checks/config/config.test.ts > themeFindings > names a code theme that is no listed id, one finding per value, case included   -> expected [ Array(1) ] to deeply equal [ Array(1) ]
FAIL tests/checks/config/config.test.ts > themeFindings > names a bad code theme in a config that has no themes list   -> expected [ Array(1) ] to deeply equal [ Array(1) ]
FAIL tests/checks/config/config.test.ts > themeFindings > says nothing for an absent code_theme, tokens or a listed id   -> expected [ Array(1) ] to deeply equal []
FAIL tests/state/workbench/layout/saved/layout-saved.test.ts > a saved envelope, read as pages of one tree > migrates every page, and reads which one was current   -> expected [ { root: { kind: 'split', ...(3) } } ] to deeply equal [ { root: { kind: 'split', ...(3) } } ]
```

The G54 row fails because the key is absent; the G13 failures are the new sentence (first two tests) and the rows for `vscode-dark-2026` and `vscode-light-high-contrast` (third); the two `config-folder` failures are the key list that now names `workbench`; the G29 failure is the missing line `"documents": true` in the received tree of the third row (the version 3 and version 6 rows pass). Vitest prints the elided array elements with an ellipsis character; here they are written `...(113)`. `pages.test.ts` passes on the unchanged tree, as the next run shows. After the change, in the worktree, the same command printed `Test Files  5 passed (5)` and `Tests  83 passed | 1 skipped (84)`.

The G28 test alone, `npx vitest run tests/state/workbench/navigation/pages.test.ts --reporter=verbose`, in the base copy and then in the worktree, as printed (the test file is identical in both, and `pageInstanceIds` is exported from `pages.ts:84` in both):

```
### $TMPDIR/d56c/basecopy
 ok |unit| tests/state/workbench/navigation/pages.test.ts > the question a close asks > lists every instance of every pane of a page, in the tree's own order 1ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once a busy terminal is known > asks one question over a pane with unsaved text and a busy terminal, the text first 0ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks nothing for a tab the save took, and answers no tab left unsaved 8m
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks the unsaved-text question for a tab whose save was refused 1ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks how many go when several tabs close, naming only the tabs left unsa
 Test Files  1 passed (1)
      Tests  5 passed (5)
84:export function pageInstanceIds(page: Host): string[] {
### /Users/axelfaes/workspace/research-hub/.agents/worktrees/D56/tools/oculus
 ok |unit| tests/state/workbench/navigation/pages.test.ts > the question a close asks > lists every instance of every pane of a page, in the tree's own order 1ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once a busy terminal is known > asks one question over a pane with unsaved text and a busy terminal, the text first 0ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks nothing for a tab the save took, and answers no tab left unsaved 8m
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks the unsaved-text question for a tab whose save was refused 1ms
 ok |unit| tests/state/workbench/navigation/pages.test.ts > what a close asks once the tabs the autosave mode saves were saved > asks how many go when several tabs close, naming only the tabs left unsa
 Test Files  1 passed (1)
      Tests  5 passed (5)
84:export function pageInstanceIds(page: Host): string[] {
```

## Edits to existing assertions, allow lists and predicates

From `diff` of each changed test file against `.agents/worktrees/D56-base`, one row per changed line or group. No threshold, tolerance or predicate is loosened; no allow list is widened except the one key named below. `tests/state/workbench/navigation/pages.test.ts` has no row because `diff` prints nothing.

| File:line | Before | After | Kind |
|---|---|---|---|
| `arrangements.test.ts:2-5` | head comment: "One row per arrangement of the file" | adds the `workbench:` key and its row to the comment | comment |
| `arrangements.test.ts:17-22` | none | `const pages: [string, unknown][] = [...Object.entries(arrangements), ['workbench', config.workbench]]` | table of pages gains one entry |
| `arrangements.test.ts:24-33` | `it.each(Object.keys(arrangements))('the %s page parses and names only views the catalogue knows', (page) => {... parseArrangement(arrangements[page]) ...})` | `it.each(pages)(` the same title, `(_page, node) => {... parseArrangement(node) ...})`; the three expectations are the same lines | table source; predicate unchanged |
| `config-folder.test.ts:170` | the allowed `layout.yml` keys list has no `workbench` | `'workbench',` added | allow list gains the key this step adds to `config/layout.yml` |
| `config.test.ts:609` | `...which is neither tokens nor the id of a Shiki theme; ...` | `...which is neither tokens, a VS Code theme nor the id of a Shiki theme; ...` | expected sentence follows `findings.yml:33` |
| `config.test.ts:619` | none | `expect(codeSaid({ code_theme: 'vscode-nope' })).toEqual([CODE('"vscode-nope"')]);` | assertion added |
| `config.test.ts:640-641` | none | `codeSaid({ code_theme: 'vscode-dark-2026' })` and `'vscode-light-high-contrast'` expect `[]` | assertions added |
| `layout-saved.test.ts:11-13` | imports `LAYOUT_VERSION`, `PAGES_VERSION` | adds `serialiseLayout` and `type Layout` | imports |
| `layout-saved.test.ts:18` | `describe('the version 3 envelope, read as pages of one tree'` | `describe('a saved envelope, read as pages of one tree'` | title, since a row now has the current version |
| `layout-saved.test.ts:19-26` | `saved(...held)` writes `version: PAGES_VERSION` | `saved(version, ...held)` writes `version` | helper |
| `layout-saved.test.ts:29-74` | one `it('migrates every page, and reads which one was current', ...)` over a version 3 envelope, expecting the two trees and `current` `page-0` | `it.each(rows)` with the same title over three rows: version 3 (the old envelope and trees), version 6, and `LAYOUT_VERSION` with a pane carrying `documents: true`; every row expects the trees and `current` `page-0`, plus two lines added to all rows: `read.kept ?? []` equals `[]` and the written version equals `LAYOUT_VERSION` | table; assertions added, none removed |

## History grep

Command: the lines added or changed in the touched files (`$TMPDIR/d56c/added.txt`, from `diff` against the base: the changed lines of every touched `.ts`, `.svelte`, `.js`, `.md` and `.yml` file and every line of a new file; a document paragraph is one line, so a hit there is a whole paragraph) searched with `grep -noE '.{0,70}\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b.{0,50}'`. 17 hits, each judged: none compares the code with an earlier state of it.

| Where | Hit | Judgment |
|---|---|---|
| `DESIGN.md:482` landing bullet | "whether or not the received list still names its tabs" | a condition on present state |
| `config/text/views/system/workbench.yml` `reset_all_tip` | "pages of buttons the rail no longer has" | the sentence is in the base; it names which pages the reset removes |
| `docs/views.md` Settings paragraph | "while that list is still being read" | a state the view draws; mine |
| `docs/views.md` Settings paragraph | "is refused before the write" | order of two steps, in the base paragraph |
| `docs/views.md` Settings paragraph | "a value the file no longer holds" | present state of the file, in the base paragraph |
| `docs/window.md` Pages paragraph | "pages of buttons the rail no longer has" | the same base sentence as `reset_all_tip` |
| `docs/window.md:55` | "while that tab is still there" | the landing rule's condition, in the base |
| `docs/window.md:55` | "the tab that was shown before it and is still open" | order of tabs, in the base |
| `config-value.ts` comment | "refused before anything is read" | order of two steps |
| `fs-transport.ts` `servesRoot` comment | "called gone before the workspaces are known" | the state in which the answer is yes |
| `layout.svelte.ts` comment | "opened by name before the rail had buttons" | the base sentence naming the case the adoption serves |
| `layout.svelte.ts` comment | "is still in the list" | present state |
| `landing.ts` doc comment | "while one of them is still on it" | the landing rule's condition, in the base |
| `kit/load.ts` comment | "disposes the highlighter before it" | order of two steps |
| `kit/load.ts` comment | "leaves the theme before it in force" | the theme in force ahead of the rejected paint |
| `session-list.ts` comment | "list's own filter still reaches it" | present behaviour |
| `Pages.svelte` comment | "The same ask before a workbench is made again" | order of the ask and the remake |

## Visible changes, before and after

"Read" marks a before taken from the base code and not run.

| View | State to put it in | Before | After |
|---|---|---|---|
| Rail button of a page | A workbench titled `Apps` open, no Apps rail page, press Apps | Read: `openRailPage` takes any page with the same label and no `rail`, so the workbench would get `rail: apps` and the next Reset all pages would rebuild it from the arrangement | A new Apps rail page is made and shown; the workbench keeps its folder and no rail key (RUN 9) |
| Workbench documents pane | A workbench with a Transcript in its documents pane, reload, pick another session | Read (`landing.ts`): after a reload the Transcript is a tool view because the received list is gone, so a pick splits a third pane off | Transcript and Timeline land in the documents pane and the pane count stays 2 (RUN 10) |
| Reset all pages | A workbench holding Settings, then Reset all pages | Read: a unique view a rail arrangement names moved out of the workbench holding it, as out of any page without a rail key | The workbench keeps Settings and the System page is built without it (RUN 11) |
| Problems, every tab | A Problems tab (the one TeX Show Problems opens included) limited to a root that left the workspace | Read: the empty list or the filtered sentence (`problems.empty`: "No problems have been detected in the workspace.", or `problems.filtered_empty`) | `<root> is not a root this workspace serves, so it has no problems to list.` (`Problems.svelte:302-303`); not said while the workspaces are being read |
| Search clear control | A Search tab limited to a folder, in a workbench or outside one | Read: a compact icon `ToolButton` labelled "Search the whole root", glyph `dismiss`, in a `p.scope` line | The shared `FolderLine` (`views/shared/links/FolderLine.svelte`) with the same label and the tooltip `Search every folder of the root again` (`search.yml:91`), also outside a workbench |
| Search | A Search tab whose root left the workspace | Read: the search was sent for that root | The sentence `<root> is not a root this workspace serves, so it has nothing to search.` in place of the results, Run disabled, no search sent (RUN 7) |
| TeX view | A TeX tab pinned to a root that left the workspace | Read: the view asked the LaTeX store for the pin's mains | The sentence `<root> is not a root this workspace serves, so it has no LaTeX root to list.` and nothing asked (RUN 7) |
| Settings, Code theme | A `themes:` row whose `class` is a VS Code class | Read: a VS Code theme was worded by its class in the theme list | Worded by the row whose `class` matches, else the class (RUN 6) |
| Workbenches menu, Pages view | Close a workbench | the first build, unchanged by this round except that the question is now drawn by one component | one `CloseQuestions` component in both |

The earlier visible-changes table of the step is under "Visible changes of the step" below.

Left to the look at landing (the state to put the page in and what should differ): (a) two workbenches open (open a project card's Open Workbench, then a folder's Open in New Files), press the Workbenches button at the foot of the rail: both listed, the one on screen marked, each with a Close button at the row's end that does not pick the row, and a Reset layout group below; (b) a workbench with a source tab holding unsaved text, Close in that menu: the question names the text, and the Pages view asks the same; (c) a workbench for `projects/x`: Search, Problems, Repositories and the sessions list draw `In hub/projects/x` with a clear control; (d) Settings, Code theme: the 19 VS Code themes first, dark then light, under the words of the UI theme list, then Shiki's; pick one under a light UI theme and a source tab colours with that theme's rules; (e) the Pages view: a workbench row carries Reset layout; (f) a workbench whose root is then removed from the workspace: Search, TeX and Problems tabs say the root is not served and the Search Run button is disabled; (g) a Code theme menu with a renamed `themes:` row: the row's label.

## Ids and keys

`documents` is the one saved key this round adds: `true` or absent; any other value reads as absent (`saved.ts:389`); a float's pane never carries it (`saved.ts:653`); with two marked panes in one saved tree the first in tree order takes the landing (`landing.ts:73`, `find`); `markDocuments` marks the first empty pane that keeps no kind (`tree.ts:379-388`). The context key in `workbench-reset.ts` is a module-private `Symbol`; with no provider the rail's reset function answers `false`. This round adds no asynchronous path: `servesRoot` is a synchronous read of the workspaces store and flips when the workspaces load.

## DONE / NOT DONE, the verify list after the last change

Nothing in the brief of this round is NOT DONE. Commands run from `tools/oculus` in the worktree with `HOME=${TMPDIR}d56c-home` and the Node 24 `bin` first on `PATH`; the list ran as one script (`$TMPDIR/d56c/final.sh`) and printed:

```
diagrams exit 0
quick exit 0
ascii lines        0
scoped exit 0
checks exit 0
folder-check exit 0
unused exit 0
done
```

**1. `npm run diagrams`, `npm run test:quick`** (summary lines as printed in `$TMPDIR/d56c/final/quick.out`):

```
test:quick: 106 changed file(s), from git since HEAD
test:quick: 80 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      eslint (7.9 s)
ok      svelte-check (9.1 s): 1791587189328 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.1 s): Duration  18.89s (transform 30.30s, setup 0ms, import 49.83s, tests 23.29s, environment 431ms)
test:quick: 23.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

**ASCII grep** over every touched `.ts`, `.svelte`, `.md`, `.yml`, `.js`, `.json`, `.css` and `.dot` file and `workbench-reset.ts` (`LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x00-\x7F]/'`, `docs/diagrams` filtered out): `ascii lines        0`.

**2. `npx vitest run tests/state/workbench tests/checks/config tests/data/sources/config tests/shell/panes/strip/tab-menu.test.ts tests/server/machine/runs/lint/eslint-trust.test.ts tests/server/machine/runs/lint/lint-route.test.ts --testTimeout 300000`**: `Test Files  16 passed (16)`, `Tests  233 passed | 1 skipped (234)`. This run does not cover `tests/views`, `tests/ui` or the render of a changed component outside RUN 7.

**3. The scratch runs** and **4. the changed tests on the unchanged tree and after**: above.

**5. Prose.** The new and changed sentences of the docs, comments and catalogue were read against `agents/spec.md`; the history grep is above; the departures from the prose rules: none known.

**6. `sh utils/folder-check.sh`** printed nothing, `folder-check exit 0`. **`sh utils/unused-exports.sh`** printed `Unused exports (245)` and 364 lines; the base file `D56-base/tools/oculus/unused-exports.txt` has the header `Unused exports (245)` and 364 lines. A `diff` of the two files, token by token, shows three differences: `pageInstanceIds` is listed under `navigation/pages.ts` (the production importer is gone and the G28 test reads it, as item 8 requires), and `restate` (`layout/index.ts`) and `Workspace` (`selectors.svelte.ts`) are no longer listed because the step imports them. I did not reconcile the header count with those three differences (not verified).

**7. Reuse and importers.** Each new function was searched for before it was written (`grep -rn "<name>\|<what it does>" src/lib`). The importers of this round's new exports, from `grep -rlw <name> src`: `markDocuments` (`layout/index.ts`, `folder-opener.ts`), `adoptedPage` (`layout/index.ts`, `layout.svelte.ts`), `servesRoot` (`Search.svelte`, `Problems.svelte`, `tex-root.svelte.ts`), `themeClassLabel` (`BrowserControl.svelte`), `CloseQuestions` (`WorkbenchMenu.svelte`, `Pages.svelte`), `provideWorkbenchReset` (`+page.svelte`) and `useWorkbenchReset` (`WorkbenchMenu.svelte`).

**Tree checks** (`npm run test:checks`, once, after the last change): `Test Files  17 passed (17)`, `Tests  265 passed | 1 skipped (266)`.

Number of full runs of the verify list: 3. The quoted run is the third, with no change after it. Over the round `test:quick` ran 5 times, `test:checks` 4 times and the scoped vitest 5 times; the other runs were partial and are not counted.

## Visible changes of the step

| View | Before | After |
|---|---|---|
| Rail foot | Bookmarks, Search, Update | Bookmarks, Workbenches, Search, Update; the Workbenches menu lists open workbenches with a Close button per row and a Reset layout group, or says none is open |
| Project card, project view, Projects board | Show in Files beside Show in Finder | Open Workbench beside Show in Files (not offered when the hub root is not served) |
| Entry page | Toolbar: Show in collection, source button | Open Workbench added when the entry has a folder |
| Collection card, Personal board card, folder block | Show in Files | Open Workbench beside it |
| Files view, right-click on a folder or root | Reveal in Finder, Open in Integrated Terminal | Open in New Files between them |
| Search, Problems, Repositories, sessions list in a workbench | Not limited to a folder | Limited to the folder, with the line `In <root>/<path>` and a clear control that widens that tab; elsewhere unchanged |
| Pages view | Reset for a rail page | Reset layout for a workbench page |
| Settings, Code theme | tokens, then Shiki's themes | tokens, the 19 VS Code themes by the UI theme list's words (dark, then light), then Shiki's |
| Editors | A VS Code class as the code theme was read as a finding | Painted with that theme's rules under any UI theme |
| Browser storage | Layout envelope version 6 | Version 7, with `kept`; version 6 and older are read in with every page and tab kept |

## Items of the step, as built

| Row | Check | Output |
|---|---|---|
| Item 1, the workbench page | `Page.folder`, `Page.item` in `model.ts`; `folder-store.ts`; CASE 1, 3, 4, 5, 6, 25 | DONE |
| Item 2, the arrangement | `config/layout.yml` `workbench:`; `options.yml` entry; G54 row | DONE; the `arrangements.test.ts` row passes after the change and fails on the unchanged tree (above) |
| Item 3, each tab limited | `folder-opener.ts` `startOf`; `limit.ts`; `problem-rows.ts` `under`; CASE 7, 8, 9-states | DONE |
| Item 4, the documents pane | `folder-opener.ts` `open`/`reset`; `SessionList.svelte`; CASE 1, 4, 5, 8; RUN 10 | DONE |
| Item 5, the openers | ProjectCard, Entry (toolbar), EntryCard, Personal, FolderFiles, `row-menu.ts` `ROW_WORKBENCH` after Reveal in Finder | DONE; none offered when `folders.served(root)` is false; none on the venue card or the worktree opening |
| Item 6, the Workbenches button | `RailFoot.svelte:82`, `WorkbenchMenu.svelte`, `ActivityRail.svelte:184` | DONE |
| Item 7, the kept layout | `saved/kept.ts`, `saved.ts`, `folder-store.ts`; CASE 11, 12, 20, 24, 26; G29 rows | DONE; `LAYOUT_VERSION` 7 |
| Item 8, unique views | CASE 13, 15, 16; RUN 11 | DONE |
| Item 9, the VS Code themes as code themes | `code-themes.ts`, `load.ts` `paintNow`, `code-theme-menu.ts`, `findings.yml:33`, `appearance.yml`, `options.yml`; CASE 18, 19; RUN 6 | DONE |
| Item 10, the docs | `docs/window.md`, `docs/views.md`, `docs/files-and-search.md`, `docs/configuration.md`, `DESIGN.md`, `HELP.md` | DONE |

## The cases' first run, on the unchanged tree

This part is the earlier builder's, copied from its first-run file, and was not rerun. The two cases the brief's rules got wrong are A and B below, with the orchestrator's rulings (`agents/briefs/D56-cases.md`).

- **A (case 11, items 3 and 7).** The brief keeps a closed workbench in the layout envelope, which holds only each tab's layout state; the view state of the six tabs (the folder limit included) lives in the ui record `oculus.ui.v1`, which `closePage` clears through `forgetTabs`. First run: `CASE 11: {"uiStateBeforeClose":{"top":{"root":"hub","path":"projects/x"},"expanded":["a"]},"uiStateAfterClose":null,"envelopeKeys":["version","pages","current","floats"],"version":6}". Ruling: each kept entry carries `states: { <instanceId>: <state> }`, snapshotted at close and written back at reopen; a source tab with unsaved text is left out; a malformed `states` drops the entry; an added case checks the unsaved text.
- **B (item 6, case 10).** `MenuItem` has no second control on a row. Ruling: `MenuItem` gains an optional trailing action drawn by `MenuList.svelte` as its own button and passed through `Menu.svelte`; the Workbenches menu uses it for Close; the path list widens to `src/lib/ui/menu/`.

## First run of every case, on the unchanged tree

The probe files are `store.scratch.ts`, `config.scratch.ts` and `saved.scratch.ts` in `$TMPDIR/d56-scratch`, run with:
`HOME=$TMPDIR/d56-home npx vitest run --config $TMPDIR/d56-scratch/vitest.scratch.config.mjs --reporter=verbose`
Output below is as printed. All 14 probe tests pass, so the printed lines are the observed behaviour, not assertions of the feature.

Cases 1, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21, 25 and 26: the feature is absent.
- `grep -rn "folderPage\|openFolderPage\|FolderPage" src config tests docs DESIGN.md HELP.md` prints 0 lines.
- `grep -n folder src/lib/state/workbench/layout/model.ts` prints nothing.
- `grep -rniE "open workbench|workbenches|open in new files" src config tests docs DESIGN.md HELP.md --exclude=local.yml` hits only `saved.ts:407` and `layout-saved.test.ts:17`, both the word in another sense.
- `RailFoot.svelte` holds three controls (the Bookmarks `Menu`, `app.search`, `app.update`).
- `CASE store-names: ["workbench","keepPreview","keepDefaultPage","showFolderInFiles","armedKeep","armKeep","disarmKeep"]`. `workbench` is the existing accessor for a page's tree, and nothing opens a folder page.
- `CASE envelope-keys: ["version","pages","current","floats"]`, so there is no kept store (20, 26). I took no envelope size because there is nothing to measure.
- Case 9: the "In {0}/{1}" line and its clear control exist for Search only (`Query.svelte:118-128`, `search.yml:86,102`). `problem-rows.ts:92` filters Problems by `scope` alone, so there is no `under`.
- Case 8: `sessionsForProject` exists (`selectors.svelte.ts:515-521`), and `SessionList.svelte` has no folder state.
- Case 21: nothing to open, so nothing was observed.

Cases with a probe:
- 2: `CASE 2: {"arrangementKeys":12,"workbenchTopLevelKey":false,"workbenchInArrangements":false,"parseArrangementOfAbsentKey":"null"}`. The top-level keys of `layout.yml` are rail, nav_groups, direct_chord, arrangements, floats, board, tab_split, tab_rollup, nav_live, the four `*_label_mode` keys and docs.
- 11: see A.
- 12 (the part that holds today): `CASE 12: {"rebuilt":["r"],"removed":[]}`. `r` is a page with a rail key; the page without one is in neither list. Reset layout is absent.
- 13: `CASE 13: {"opened":"s","pageOnScreen":"other","statusTabs":1}`. A unique view held by an off-screen page is shown there, with no second copy.
- 14: `CASE 14: {"LAYOUT_VERSION":6,"readPages":1,"tabs":2,"writtenVersion":6}`. A version 6 envelope is read with every tab and written back at 6.
- 15: `CASE 15: {"loaded":true,"settingsTabsPerPage":[["system",1],["restored",1]]}`. Loading does not remove a duplicate unique view, so the restore needs its own rule.
- 16: `CASE 16: {"opened":true,"pageOnScreen":"p"}`.
- 17: `CASE 17: {"afterClose":[["w",null]],"afterNew":[["w",null],["New",null]],"current":"New"}`.
- 18:
  - `isCodeTheme` gives `{"vscode-dark-2026":false,"vscode-nope":false,"tokens":true,"github-light":true}`.
  - The code theme source of the write check and the schema does not hold `vscode-dark-2026` (false). `codeThemeIds()` starts `["andromeeda","aurora-x"]`.
  - `themeFindings` gives one finding each for `vscode-dark-2026` and `vscode-nope` ("code_theme is ..., which is neither tokens nor the id of a Shiki theme; ..."), and none for `tokens` or `github-light`.
  - Paint through `painter` with code theme `vscode-dark-2026` under a `vscode-light-modern` body: `{"paintedWithDark2026Rules":false,"paintedWithTheUiThemeRules":true}`. This is the `load.ts` `paintNow` behaviour that item 9 changes.
- 19: `CASE 19: {"count":66,"first":["ui.code_theme_tokens","Andromeeda","Aurora X","Ayu Dark"],"vscodeEntries":0}`.
- 22: `CASE 22: {"read":true,"views":["removed-view","files"]}`. A tab of an unknown view is kept.
- 23: `CASE 23: {"entries":0,"problems":[{"index":0,"why":"page_unknown","page":"workbench"}],"railEditorOffersWorkbench":false}`.
- 24: `CASE 24: {"read":true,"pages":1,"keptField":false}`. An unknown `kept` field is ignored today.

Verify item 2 on the unchanged tree (HOME under `$TMPDIR`): `Test Files  16 passed (16)` and `Tests  230 passed | 1 skipped (231)`. The earlier run with the real HOME printed `231 passed`. I did not look into which test skipped.

The earlier builder also checked three premises of the brief against the tree, and they hold: the unique views are status, audit, settings, pages, findings, processes, usage, hpc, history and focus, and none of the six workbench tabs, Transcript or Timeline is unique; the hub root is always on the `git` channel (`server/root/watch/git.ts` head comment), so Repositories can list the hub repository for a hub project folder; rail buttons are drawn from the `rail:` entries, so a page with no `rail` key never gets a button.

## The cases after the change

Command for every `CASE` line (the scratch files are `store.scratch.ts`, `config.scratch.ts`, `saved.scratch.ts`, `sessions.scratch.ts` and `reload.scratch.ts` in `$TMPDIR/d56b-scratch`, none in the tree): `HOME=${TMPDIR}d56b-home npx vitest run --config $TMPDIR/d56b-scratch/vitest.scratch.config.mjs --reporter=verbose`, which printed `Test Files  5 passed (5)` and `Tests  15 passed (15)` after the last code change (`$TMPDIR/d56c/scratch-b2.out`). The store cases drive `createClientState` with `createFolderPages` over the shipped `config/layout.yml` and the served root `hub`; the lines are the cases' output as printed, in the order of the case table.

```
CASE 1: {"id":true,"label":"X Title","folder":{"root":"hub","path":"projects/x"},"item":{"view":"project","state":{"id":"x","label":"X"}},"rail":null,"onScreen":true,"panes":[["files","search","repositories","latex","problems","session-list"],["project"]]}
CASE 2: {"arrangementKeys":12,"workbenchTopLevelKey":true,"workbenchInArrangements":false,"parseArrangementOfAbsentKey":"parsed"}
CASE 3: {"same":true,"pages":[2,2],"onScreen":true}
CASE 4: {"label":"Fund Title","panes":[["files","search","repositories","latex","problems","session-list"],["entry"]]}
CASE 5: {"label":"Side","panes":[["files","search","repositories","latex","problems","session-list"],["source"]]}
CASE 6: {"label":"code","panes":[["files","search","repositories","latex","problems","session-list"],[]],"filesTop":{"layout":{"root":"hub","path":"projects/x/code","label":"code"},"ui":{"top":{"root":"hub","path":"projects/x/code"},"expanded":["hub:projects/x/code"],"selected":{"root":"hub","path":"projects/x/code"},"selection":[],"filter":""}}}
CASE 7: {"label":"hub","search":{"layout":{},"ui":{"root":"hub","under":""}},"problems":{"layout":{},"ui":{"scope":"hub","under":""}},"repositories":{"layout":{},"ui":{"folder":{"root":"hub","path":""}}},"sessions":{"layout":{},"ui":{"folder":{"root":"hub","path":""}}}}
CASE 8: {"kept":["in-cwd","in-area"],"terminalsInFolder":1,"unservedKeepsNone":0}
CASE 9-states: {"files":{"layout":{"root":"hub","path":"projects/x","label":"x"},"ui":{"top":{"root":"hub","path":"projects/x"},"expanded":["hub:projects/x"],"selected":{"root":"hub","path":"projects/x"},"selection":[],"filter":""}},"search":{"layout":{},"ui":{"root":"hub","under":"projects/x"}},"problems":{"layout":{},"ui":{"scope":"hub","under":"projects/x"}},"repositories":{"layout":{},"ui":{"folder":{"root":"hub","path":"projects/x"}}},"sessions":{"layout":{},"ui":{"folder":{"root":"hub","path":"projects/x"}}},"latex":{"layout":{"root":"hub","path":"projects/x","label":"x"}}}
CASE 11-closed: {"version":7,"envelopeKeys":["version","pages","current","floats","kept"],"kept":1,"keptFolder":{"root":"hub","path":"projects/x"},"keptStateIds":5,"uiAfterClose":null}
CASE 11-reopened: {"label":"x","filesIdSame":true,"filesUi":{"top":{"root":"hub","path":"projects/x"},"expanded":["a"]},"tabViews":["files","search","repositories","latex","problems","session-list","project","source","terminal"],"sourceKept":true,"sourceStateBeforeClose":"draft: unsaved text","sourceUiAfterReopen":null,"terminalUiAfterReopen":null,"keptNow":0}
CASE 12-after-close: {"tabViews":["files","search","repositories","latex","problems","session-list"]}
CASE 12-reset: {"ok":true,"tabViews":["files","search","repositories","latex","problems","session-list"],"filesUi":{"top":{"root":"hub","path":"projects/x"},"expanded":["hub:projects/x"],"selected":{"root":"hub","path":"projects/x"},"selection":[],"filter":""},"label":"x"}
CASE 12-resetall: {"rebuilt":[],"removed":[],"workbenchTouched":false}
CASE 13: {"sameTab":true,"pageOnScreen":"wb","statusActive":true,"statusTabs":1}
CASE 15: {"settingsTabsPerPage":[["other",1],["restored",0]],"heldSettingsStillThere":true}
CASE 16: {"opened":true,"pageOnScreen":"Page 1","keptUnchanged":true}
CASE 17: {"afterClose":[["x","folder"]],"afterNew":[["x","folder"],["New",null]],"current":"New"}
CASE 18-findings: {"vscode-dark-2026":[],"vscode-nope":["code_theme: code_theme is \"vscode-nope\", which is neither tokens, a VS Code theme nor the id of a Shiki theme; the editor colours code from the tokens instead"],"tokens":[],"github-light":[]}
CASE 18-paint: {"codeTheme":"vscode-dark-2026","bodyClasses":"vscode-light-modern","paintedWithDark2026Rules":true,"paintedWithTheUiThemeRules":false}
CASE 18-readers: {"isCodeTheme":{"vscode-dark-2026":true,"vscode-nope":false,"tokens":true,"github-light":true},"writeCheckAndSchemaSourceHoldsVscodeDark2026":true,"codeThemeIdsFirst":["vscode-light-2026","vscode-light-modern"]}
CASE 18-sentence: "code_theme is \"x\", which is neither tokens, a VS Code theme nor the id of a Shiki theme; the editor colours code from the tokens instead"
CASE 19: {"count":85,"first":["ui.code_theme_tokens","vscode-abyss","vscode-dark-2026","vscode-dark-modern"],"vscodeEntries":19}
CASE 19-reload: {"before":"vscode-dark-2026","afterReload":"vscode-dark-2026"}
CASE 21: {"pageKept":true,"tabs":6,"offered":false,"openGivesEmpty":true,"reopenOpen":true}
CASE 22: {"read":true,"views":["removed-view","files"]}
CASE 22: {"views":[["removed-view","search","repositories","latex","problems","session-list"],[]]}
CASE 23: {"entries":0,"problems":[{"index":0,"why":"page_unknown","page":"workbench"}],"railEditorOffersWorkbench":false}
CASE 24: {"loaded":true,"aTabs":6,"bTabs":7}
CASE 24: {"read":true,"pages":1,"keptAfter":["b"]}
CASE 25: {"same":true,"label":"X Title","pages":2}
CASE 26: {"kept":20,"firstKept":"projects/p1","lastKept":"projects/p20","droppedFirst":true,"envelopeBytes":29537}
CASE 26-per-layout-bytes: 1407
```

Case by case, with what each line shows or what was read instead:

| Case | Checked by | Result |
|---|---|---|
| 1 | CASE 1 and CASE 9-states | A page named by the project title, on screen, `folder` set, no `rail` key, six left tabs in order, the project view in the second pane. |
| 2 | CASE 2; `arrangements.test.ts` row | `workbench` is a top-level key, not an `arrangements` key, and parses. The rail draws one button per `rail:` entry (`ActivityRail.svelte`), so none is drawn for it. |
| 3 | CASE 3 | Same page id, still 2 pages, on screen. |
| 4 | CASE 4 | Named `Fund Title`, the entry view in the documents pane. |
| 5 | CASE 5 | Named `Side`, a source tab in the documents pane. |
| 6 | CASE 6 | Named `code`, Files rooted at `projects/x/code`, documents pane empty. |
| 7 | CASE 7 | Named `hub`; Search `under` `''`, Problems `under` `''`, Repositories and the sessions list `folder` `{hub, ''}`. By reading: `Repositories.svelte:381` draws the line only for `folder.path !== ''`; `Query.svelte:120` and `Problems.svelte:290` likewise; `SessionList.svelte:293-295` draws it with the root's key (`sessions.in_root`). |
| 8 | CASE 8; `SessionList.svelte:151,160-161` | Sessions working in the folder or filed into it are kept, a sibling folder with the same prefix and a session in neither are not, an unserved folder keeps none. New calls `composeAt({ cwd: dir, agent: 'claude', documents: true })`; a pick opens `transcript` and `timeline` with `{ document: true }`. |
| 9 | CASE 9-states; reading | Each tab holds its folder in its own state. The shared line is `views/shared/links/FolderLine.svelte`, drawn by Search, Problems, Repositories and the sessions list with their own words. Left to the look at landing. |
| 10 | reading; RUN 10 | `WorkbenchMenu.svelte:76-79` gives each row `action.run: () => flows.close(one.id)`, and `createPageFlows.close` (`navigation/pages.ts`) asks through `closeAsk`, drawn by `CloseQuestions`; G28's tests cover `closeAsk`. Left to the look at landing. |
| 11 | CASE 11-closed, CASE 11-reopened | The kept entry holds 5 ui states; reopened, Files has the same tab id and its `top` and `expanded`, the six tabs plus project, source and terminal come back, the source tab is there and its ui state is null (its unsaved text is not brought back), the terminal tab is there with no state, and the kept entry is consumed. |
| 12 | CASE 12-reset, 12-after-close, 12-resetall; RUN 11 | Reset gives the six arrangement tabs with the folder on each, keeps the label; after a close the next open is the arrangement; Reset all pages touches no workbench (`rebuilt` and `removed` empty, `workbenchTouched` false), and a unique view a workbench holds stays (RUN 11). The question asked before Reset is `createPageFlows.reset` with `workbench.reset_page_confirm`; left to the look at landing. |
| 13 | CASE 13 | Status opened while a workbench holds it: one status tab, the workbench on screen, status active. |
| 14 | `layout-saved.test.ts` rows | The version 6 row reads two pages, no kept layout, and writes version 7 (`LAYOUT_VERSION`); the version 7 row reads a pane with `documents: true`. |
| 15 | CASE 15 | The restored page has 0 settings tabs; the other page keeps its 1. |
| 16 | CASE 16 | A unique view held only by a kept layout opens as any view opens; the kept list is unchanged. |
| 17 | CASE 17 | Only the workbench left: it stays a workbench; New page adds `New`, which is on screen. |
| 18 | CASE 18-* | `vscode-dark-2026` is accepted by `isCodeTheme`, the write-check source and the schema source, no finding; `vscode-nope` gives one finding in the new sentence; `tokens` and `github-light` none; the paint under a `vscode-light-modern` body uses the rules of `vscode-dark-2026`. |
| 19 | CASE 19, 19-reload | 85 entries, 19 of them VS Code classes, listed before Shiki's, grouped dark then light in the menu; a picked class is read back by a second client over the same storage. |
| 20 | reading | The kept list is part of the string under `LAYOUT_KEY = 'oculus.layout.v1'` (`saved/storage.ts:28`; CASE 11-closed shows `kept` in that envelope), which is one browser's localStorage. |
| 21 | CASE 21; reading | The page and its 6 tabs stay, `served` answers false, `open` answers the empty text. `Problems.svelte:302`, `Repositories.svelte:388` (`repositories.folder_gone`) and `SessionList.svelte:113` (`sessions.folder_gone`) say the root is not served; every opener checks `folders.served` first. |
| 22 | CASE 22 (both) | A saved tab of an unknown view is read and kept in both a plain envelope and a kept layout. |
| 23 | CASE 23 | `page_unknown` for `workbench`, no entry, the rail editor does not offer it. |
| 24 | CASE 24 (both) | In a kept list the entry whose tree does not read is dropped and the other restored (aTabs 6 from the arrangement, bTabs 7 from the kept layout); a saved version 6 envelope with a bad and a good entry keeps `["b"]`. |
| 25 | CASE 25 | The same page, the project title kept. |
| 26 | CASE 26 | 20 kept, `projects/p0` dropped, `projects/p1` to `projects/p20` kept; the envelope is 29537 characters (1407 per layout made from the shipped arrangement, which now carries the `documents` mark, 20 layouts and Page 1). |

## Head comments and doc paragraphs

| Where | State |
|---|---|
| `RailFoot.svelte`, `ActivityRail.svelte` head comments | rewritten (the Workbenches menu) |
| `shell/rail/workbench-reset.ts` head comment | added (the context key for the reset function) |
| `ui/tabs/CloseQuestions.svelte` head comment | added |
| `saved.ts` head comment, the `documents` comment and the `parseLayout` comment | rewritten (kept list, folder, item, versions, `documents`) |
| `model.ts` comments of `Page`, `FolderRef`, `Pane.documents`, `KeptWorkbench`, the version constants | rewritten |
| `tree.ts` `markDocuments`, `landing.ts` doc comment, `opening.ts` head comment | rewritten (the marked pane first, the `document` option) |
| `float/pages.ts` `adoptedPage` and `resetAll`, `layout.svelte.ts` `openRailPage` | rewritten |
| `folder-opener.ts`, `float/folder-pages.ts`, `folder-store.ts` head comments | written |
| `fs-transport.ts` `servesRoot` comment, `Search.svelte`, `Problems.svelte`, `tex-root.svelte.ts`, `Latex.svelte` | written or rewritten (the not-served state) |
| `code-themes.ts` head comment and `VSCODE_THEMES`, `convert-vscode-themes.ts` `listProblems`, `appearance.ts` `themeClassLabel`, `code-theme-menu.ts`, `BrowserControl.svelte` | rewritten |
| `load.ts`, `theme.ts`, `themes.ts` head comments on code themes | rewritten |
| `Query.svelte`, `Repositories.svelte`, `SessionList.svelte`, `Pages.svelte` | rewritten |
| `ProjectCard.svelte`, `EntryCard.svelte`, `Entry.svelte`, `Personal.svelte`, `FolderFiles.svelte`, `row-menu.ts` | rewritten (the Open Workbench and Open in New Files controls) |
| `docs/window.md` (the foot of the rail, Workbenches, Where an opened tab lands, Pages) | rewritten and added; the not-served sentence added |
| `docs/views.md` | added (Views limited to a folder), the Code theme sentence and the not-served sentence rewritten |
| `docs/files-and-search.md:43`, `docs/configuration.md`, `HELP.md` | rewritten |
| `DESIGN.md` (Pages bullet, unique views bullet, landing bullet, editor primitive bullet) | rewritten; a bullet on workbench pages added |

## Judgment calls the brief left open (each reversible)

- The Workbenches button's glyph is `app_view` (`ui.workbenches_glyph`).
- Reset layout is offered as a second group of the Workbenches menu (each open workbench listed again) and as a control on a workbench's row in the Pages view; both ask first through `createPageFlows.reset`. The menu's reset reaches the page's workbench store through the context key in `shell/rail/workbench-reset.ts`, provided by `+page.svelte`, because `Workbench.svelte` is at 520 of 520 lines and the shell may not read `folders`.
- The clear controls are worded "Show every root" (Problems) and "Show every repository" (Repositories); Search keeps "Search the whole root" with the tooltip "Search every folder of the root again". The sessions list says "In {root}/{path}" and, for a root, "In {root}".
- Terminals started in the folder are listed beside its sessions, by their working folder.
- Archived sessions are included in the limited sessions list so the list's own filter still reaches them.
- A workbench of a root itself keeps Problems' root chip (the line is drawn for a path only).
- The 19 VS Code themes are a static list `VSCODE_THEMES` in `code-themes.ts`, because `data/` cannot read `themes/vscode-rules.json`; `convert-vscode-themes.ts --check` fails when the list and the rules differ. A theme is dark when its class does not contain `light`.
- The Code theme menu has five groups: tokens, VS Code dark, VS Code light, Shiki dark, Shiki light, with a rule between each. A VS Code theme is worded by `themeClassLabel`: the `themes:` row whose `class` matches, else the class.
- The page's saved shape for the item it was opened for is `item: { view, state }`.
- `kept` is read from an envelope of any version, and `serialiseFloatless` writes it too.
- A kept entry with no `states` is malformed and drops the entry (ruling A).
- `openView` takes a `document: true` option and `composeAt` a `documents: true` option, so a Transcript, a Timeline and the composer's Terminal tab land in the documents pane of a workbench without being counted as tool views there.
- The documents pane of a workbench is the pane saved with `documents: true`; `markDocuments` marks the first empty pane of the `workbench:` arrangement that keeps no kind, and `repane` carries the mark.
- A picked session's Transcript and Timeline tabs are pinned to that session (`{ session, label }`).
- Open Workbench on a collection card is offered for each hub path that is a folder, and opens the entry page in the documents pane only when that folder is the one the entry's page is for.
- Open in New Files sits in the same group as Reveal in Finder and Open in Integrated Terminal, on a folder and on a root, and is not drawn on the up row.
- The Personal board's workbench shows the side project's `project.yml` in a source tab, built with `sourceFileState`, so the saved item holds the tab's `asked` stamp.
- Reset all pages leaves every workbench as it is: a unique view a workbench holds stays there and the rail page is built without it.
- `servesRoot` treats a workspace list that is still being read or failed to read as serving every root, so a tab of a root does not flash the not-served state while the workspaces load.
- `CloseQuestions` takes `closing` and `onclear` props in place of a bindable, and a yes calls `onclear()` then `onclose(id)`.
- `config-value.ts` `OWN_WRITE`, the `OWN_READER` of the options schema, the `config-folder.test.ts` layout key list and the `server.yml` `own_write` sentence name the `workbench` key; the G29 `describe` is worded "a saved envelope, read as pages of one tree" and its `it` keeps its title.

## Anything in the brief that was wrong or impossible

- Rules A and B (the kept layout loses the tabs' view state; the menu primitive has no second control), ruled before the build.
- `layout.svelte.ts` ends at 877 of 880 lines (base 866), so the store holds no further addition. `Workbench.svelte` is unchanged at 520 of 520, which is why the reset function reaches the rail by context. `ProjectCard.svelte` ends at 519 of 520 (base 495).
- `Graph.svelte` (524 lines) is over 520 and is identical to the base file (`cmp` printed nothing).
- `test:quick` printed `23.7 s (limit 45.0 s)` in the quoted last run; the time depends on the machine's load and was not compared with the unchanged tree (not verified).

## The terms

No glossary: `ls docs` prints `apps.md configuration.md debugging.md diagrams files-and-search.md source-control.md terminals.md views.md window.md`.

## Files with line counts

`wc -l`, new then base (`new` is a file the step adds). The 12 files `channels`, `layer-shell`, `layer-state`, `layer-ui`, `layer-views` and `layers` (each `.dot` and `.svg`) under `docs/diagrams` differ from the base and are regenerated by `npm run diagrams`. The largest touched source is `layout.svelte.ts` at 877 (limit 880) and the largest touched Svelte component is `ProjectCard.svelte` at 519 (limit 520); `awk` over this table prints no `.ts` over 880 and no `.svelte` over 520.

```
     589      587  DESIGN.md
     188      188  HELP.md
      97       97  config/appearance.yml
    1468     1462  config/catalogs/options.yml
     195      184  config/layout.yml
     240      240  config/text/findings.yml
     300      300  config/text/server.yml
     140      135  config/text/ui.yml
     213      212  config/text/views/academic/latex.yml
      66       64  config/text/views/boards/collection.yml
      25       23  config/text/views/boards/entry.yml
      21       19  config/text/views/boards/personal.yml
     132      130  config/text/views/boards/project.yml
      73       68  config/text/views/sessions/session-list.yml
      12       10  config/text/views/shared/folder-files.yml
     290      289  config/text/views/sources/files.yml
     296      291  config/text/views/sources/repositories.yml
     181      176  config/text/views/sources/search.yml
     211      210  config/text/views/system/workbench.yml
      69       69  docs/configuration.md
     154      154  docs/files-and-search.md
     287      283  docs/views.md
      98       86  docs/window.md
      76       33  src/lib/data/helpers/code-themes.ts
     245      244  src/lib/data/sources/config/catalog/schemas/options.ts
      75       74  src/lib/data/sources/config/themes.ts
     212      212  src/lib/server/edit/writes/config/config-value.ts
     365      363  src/lib/shell/rail/ActivityRail.svelte
     121      116  src/lib/shell/rail/RailFoot.svelte
     114      new  src/lib/shell/rail/WorkbenchMenu.svelte
      23      new  src/lib/shell/rail/workbench-reset.ts
     865      877  src/lib/state/client/context.ts
     334      308  src/lib/state/client/queries.svelte.ts
     561      561  src/lib/state/client/selectors.svelte.ts
     205      201  src/lib/state/sessions/terminal/composer/opening.svelte.ts
      45       44  src/lib/state/sessions/terminal/workbench-shape.ts
     869      868  src/lib/state/sessions/terminals.svelte.ts
     402      388  src/lib/state/shared/words/appearance.ts
      71      new  src/lib/state/sources/explorer/view/limit.ts
     455      445  src/lib/state/sources/fs-transport.ts
      65       63  src/lib/state/sources/fs.ts
     695      695  src/lib/state/system/config/editors/draft.ts
     313      309  src/lib/state/system/config/groups.ts
     877      866  src/lib/state/workbench/layout.svelte.ts
     154      148  src/lib/state/workbench/layout/index.ts
     361      309  src/lib/state/workbench/layout/model.ts
     132      new  src/lib/state/workbench/layout/open/float/folder-opener.ts
      71      new  src/lib/state/workbench/layout/open/float/folder-pages.ts
     186      new  src/lib/state/workbench/layout/open/float/folder-store.ts
     661      626  src/lib/state/workbench/layout/open/float/pages.ts
      97       74  src/lib/state/workbench/layout/open/landing.ts
     467      447  src/lib/state/workbench/layout/open/opening.ts
      99      new  src/lib/state/workbench/layout/saved/kept.ts
     136      137  src/lib/state/workbench/layout/saved/load.ts
     749      708  src/lib/state/workbench/layout/saved/saved.ts
     550      537  src/lib/state/workbench/layout/tree.ts
     603      522  src/lib/state/workbench/navigation/pages.ts
     499      498  src/lib/ui/controls/editor/kit/load.ts
     210      209  src/lib/ui/controls/editor/kit/theme/theme.ts
     184      174  src/lib/ui/menu/Menu.svelte
     384      312  src/lib/ui/menu/MenuList.svelte
     174      162  src/lib/ui/menu/menu-items.ts
      38      new  src/lib/ui/tabs/CloseQuestions.svelte
     240      237  src/lib/views/academic/latex/Latex.svelte
     176      166  src/lib/views/academic/latex/tex-root.svelte.ts
     302      279  src/lib/views/boards/entry/Entry.svelte
     328      295  src/lib/views/boards/personal/Personal.svelte
     365      319  src/lib/views/sessions/session-list/SessionList.svelte
     349      338  src/lib/views/sessions/session-list/SessionWorkspace.svelte
     145      115  src/lib/views/sessions/session-list/session-list.ts
     519      495  src/lib/views/shared/card/ProjectCard.svelte
     255      254  src/lib/views/shared/explorer/tree/control/picks.svelte.ts
     611      594  src/lib/views/shared/explorer/tree/menu/row-menu.ts
     513      486  src/lib/views/shared/forms/entry/EntryCard.svelte
     143      131  src/lib/views/shared/links/FolderFiles.svelte
      37      new  src/lib/views/shared/links/FolderLine.svelte
     481      499  src/lib/views/sources/repositories/Repositories.svelte
      73      new  src/lib/views/sources/repositories/menus/view-menu.ts
     446      425  src/lib/views/sources/search/Problems.svelte
     126      140  src/lib/views/sources/search/Query.svelte
     324      313  src/lib/views/sources/search/Search.svelte
     200      190  src/lib/views/sources/search/problem-rows.ts
     350      395  src/lib/views/system/workbench/Pages.svelte
     116      116  src/lib/views/system/workbench/PagesReset.svelte
      48       26  src/lib/views/system/workbench/code-theme-menu.ts
     207      207  src/lib/views/system/workbench/settings/BrowserControl.svelte
     331      330  src/lib/views/system/workbench/settings/Item.svelte
     294      287  src/routes/+page.svelte
      34       30  tests/checks/config/arrangements.test.ts
     632      631  tests/checks/config/config-folder.test.ts
     672      669  tests/checks/config/config.test.ts
     183      145  tests/state/workbench/layout/saved/layout-saved.test.ts
     832      810  utils/migrations/convert-vscode-themes.ts
```
