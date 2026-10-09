Everything in the brief is done.

Not looked at: the brief's cases that only the page shows were not looked at, because a builder starts no app and no dev server. They are listed under "Left to the look at landing" with the state to put the page in. No check in this report is a render of a Svelte component; the components are covered by `svelte-check` (0 errors), `eslint`, and reading.

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.

## Disclosures

The earlier builder's first scratch runs and its first run of verify item 2 on the unchanged tree used the real HOME. Whether any of them read `~/.oculus` is not known. Every run of this report's builder set `HOME` under `$TMPDIR` (`${TMPDIR}d56b-home`), and `$TMPDIR/d56b-home` holds only `.npm`.

The unchanged-tree runs of the three changed test files and of verify item 2 in this report were made in a copy of `.agents/worktrees/D56-base/tools/oculus` under `$TMPDIR/d56b-pre` (the base copy is read-only), with the worktree's `vite.config.ts`, `tsconfig.json`, `package-lock.json`, `assets` and a link to its `node_modules`. A copy outside the hub skips the 8 tests that read the real hub (`tests/checks/config/integrity.test.ts` and two of `config-folder.test.ts`), so the copy prints `222 passed | 9 skipped (231)` where the earlier builder's run in the worktree printed `230 passed | 1 skipped (231)`.

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

Command for every `CASE` line (the scratch files are `store.scratch.ts`, `config.scratch.ts`, `saved.scratch.ts`, `sessions.scratch.ts` and `reload.scratch.ts` in `$TMPDIR/d56b-scratch`, none in the tree): `HOME=${TMPDIR}d56b-home npx vitest run --config $TMPDIR/d56b-scratch/vitest.scratch.config.mjs --reporter=verbose`, which printed `Test Files  5 passed (5)` and `Tests  15 passed (15)`. The store cases drive `createClientState` with `createFolderPages` over the shipped `config/layout.yml` and two served roots (`hub`, `other`); the lines are the cases' output as printed, sorted by case number.

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
CASE 26: {"kept":20,"firstKept":"projects/p1","lastKept":"projects/p20","droppedFirst":true,"envelopeBytes":29197}
CASE 26-per-layout-bytes: 1390
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
| 7 | CASE 7 | Named `hub`; Search `under` `''`, Problems `under` `''`, Repositories and the sessions list `folder` `{hub, ''}`. By reading: `Repositories.svelte:381` draws the line only for `folder.path !== ''`; `Query.svelte` and `Problems.svelte` likewise; `SessionList.svelte:295` draws it with the root's key (`sessions.in_root`). |
| 8 | CASE 8; `SessionList.svelte:151,160-161` | Sessions working in the folder or filed into it are kept, a sibling folder with the same prefix and a session in neither are not, an unserved folder keeps none. New calls `composeAt({ cwd: dir, agent: 'claude', documents: true })`; a pick opens `transcript` and `timeline` with `{ document: true }`. |
| 9 | CASE 9-states; reading | Each tab holds its folder in its own state. The shared line is `views/shared/links/FolderLine.svelte`, drawn by Search, Problems, Repositories and the sessions list with their own words. Left to the look at landing. |
| 10 | reading | `WorkbenchMenu.svelte:73-76` gives each row `action.run: () => flows.close(one.id)`, and `createPageFlows.close` (`navigation/pages.ts`) asks through `closeAsk`; G28's tests cover `closeAsk`. Left to the look at landing. |
| 11 | CASE 11-closed, CASE 11-reopened | The kept entry holds 5 ui states; reopened, Files has the same tab id and its `top` and `expanded`, the six tabs plus project, source and terminal come back, the source tab is there and its ui state is null (its unsaved text is not brought back), the terminal tab is there with no state, and the kept entry is consumed. |
| 12 | CASE 12-reset, 12-after-close, 12-resetall | Reset gives the six arrangement tabs with the folder on each, keeps the label; after a close the next open is the arrangement; Reset all pages touches no workbench (`rebuilt` and `removed` empty). The question asked before Reset is `createPageFlows.reset` with `workbench.reset_page_confirm`; left to the look at landing. |
| 13 | CASE 13 | Status opened while a workbench holds it: one status tab, the workbench on screen, status active. |
| 14 | `layout-saved.test.ts` rows | The version 6 row reads two pages, no kept layout, and writes version 7 (`LAYOUT_VERSION`). |
| 15 | CASE 15 | The restored page has 0 settings tabs; the other page keeps its 1. |
| 16 | CASE 16 | A unique view held only by a kept layout opens as any view opens; the kept list is unchanged. |
| 17 | CASE 17 | Only the workbench left: it stays a workbench; New page adds `New`, which is on screen. |
| 18 | CASE 18-* | `vscode-dark-2026` accepted by `isCodeTheme`, the write-check source and the schema source, no finding; `vscode-nope` one finding in the new sentence; `tokens` and `github-light` none; the paint under a `vscode-light-modern` body uses the rules of `vscode-dark-2026`. |
| 19 | CASE 19, 19-reload | 85 entries, 19 of them VS Code classes, listed before Shiki's, grouped dark then light; a picked class is read back by a second client over the same storage. |
| 20 | reading | The kept list is part of the string under `LAYOUT_KEY = 'oculus.layout.v1'` (`saved/storage.ts:28`, CASE 11-closed shows `kept` in that envelope), which is one browser's localStorage. |
| 21 | CASE 21; reading | The page and its 6 tabs stay, `served` answers false, `open` answers the empty text. `Problems.svelte:302` (`problems.root_gone`), `Repositories.svelte:388` (`repositories.folder_gone`) and `SessionList.svelte:113` (`sessions.folder_gone`) say the root is not served; every opener checks `folders.served` first. |
| 22 | CASE 22 (both) | A saved tab of an unknown view is read and kept in both a plain envelope and a kept layout. |
| 23 | CASE 23 | `page_unknown` for `workbench`, no entry, the rail editor does not offer it. |
| 24 | CASE 24 (both) | In a kept list the entry whose tree does not read is dropped and the other restored (aTabs 6 from the arrangement, bTabs 7 from the kept layout); a saved version 6 envelope with a bad and a good entry keeps `["b"]`. |
| 25 | CASE 25 | The same page, the project title kept. |
| 26 | CASE 26 | 20 kept, `projects/p0` dropped, `projects/p1` to `projects/p20` kept; the envelope is 29197 characters (1390 per layout made from the shipped arrangement, 20 layouts and Page 1). |

Left to the look at landing (the state to put the page in and what should differ): (a) two workbenches open (open a project card's Open Workbench, then a folder's Open in New Files), press the Workbenches button at the foot of the rail: both listed, the one on screen marked, each with a Close button at the row's end that does not pick the row, and a Reset layout group below; (b) a workbench with a source tab holding unsaved text, Close in that menu: the question names the text; (c) a workbench for `projects/x`: Search, Problems, Repositories and the sessions list draw `In hub/projects/x` with a clear control; (d) Settings, Code theme: the 19 VS Code themes first, dark then light, under the words of the UI theme list, then Shiki's; pick one under a light UI theme and a source tab colours with that theme's rules; (e) the Pages view: a workbench row carries Reset layout.

## DONE / NOT DONE

Commands run from `tools/oculus` in the worktree with `HOME=${TMPDIR}d56b-home` and the Node 24 `bin` first on `PATH`.

| Row | Check | Output |
|---|---|---|
| Item 1, the workbench page | `Page.folder`, `Page.item` in `model.ts`; `folder-store.ts`; CASE 1, 3, 4, 5, 6, 25 | DONE |
| Item 2, the arrangement | `config/layout.yml` `workbench:`; `options.yml` entry; G54 row | DONE; `arrangements.test.ts` row passes after the change and fails on the unchanged tree (below) |
| Item 3, each tab limited | `folder-pages.ts` `startOf`; `limit.ts`; `problem-rows.ts` `under`; CASE 7, 8, 9-states | DONE |
| Item 4, the documents pane | `folder-pages.ts` `open`/`reset`; `SessionList.svelte`; CASE 1, 4, 5, 8 | DONE |
| Item 5, the openers | ProjectCard, Entry (toolbar), EntryCard, Personal, FolderFiles, `row-menu.ts` `ROW_WORKBENCH` after Reveal in Finder | DONE; none offered when `folders.served(root)` is false; none on the venue card or the worktree opening |
| Item 6, the Workbenches button | `RailFoot.svelte:81`, `WorkbenchMenu.svelte`, `ActivityRail.svelte:184` | DONE |
| Item 7, the kept layout | `saved/kept.ts`, `saved.ts`, `folder-store.ts`; CASE 11, 12, 20, 24, 26; G29 row | DONE; `LAYOUT_VERSION` 7 |
| Item 8, unique views | CASE 13, 15, 16 | DONE |
| Item 9, the VS Code themes as code themes | `code-themes.ts`, `load.ts` `paintNow`, `code-theme-menu.ts`, `findings.yml:33`, `appearance.yml`, `options.yml`; CASE 18, 19 | DONE |
| Item 10, the docs | `docs/window.md` (Workbenches section and the foot of the rail), `docs/views.md` (Views limited to a folder), `docs/files-and-search.md` (Open in New Files), `docs/configuration.md`, `DESIGN.md`, `HELP.md` | DONE |

Verify list:

**1. `npm run diagrams && npm run test:quick`**, after the last change (`diagrams exit 0`, `quick exit 0`):

```
test:quick: 94 changed file(s), from git since HEAD
test:quick: 67 test file(s), 10 essential
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (2.2 s)
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      svelte-check (23.2 s): 1791581213788 COMPLETED 453 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (24.3 s)
ok      vitest (32.8 s): Duration  28.88s (transform 72.29s, setup 0ms, import 87.64s, tests 22.87s, environment 372ms)
test:quick: 34.6 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

**2. `npx vitest run tests/state/workbench tests/checks/config tests/data/sources/config tests/shell/panes/strip/tab-menu.test.ts tests/server/machine/runs/lint/eslint-trust.test.ts tests/server/machine/runs/lint/lint-route.test.ts --testTimeout 300000`.** After the change, in the worktree:

```
Test Files  16 passed (16)
     Tests  232 passed | 1 skipped (233)
```

On the unchanged tree, in the worktree before any change (the earlier builder): `Test Files  16 passed (16)`, `Tests  230 passed | 1 skipped (231)`. On the unchanged tree in the copy (see Disclosures): `Test Files  16 passed (16)`, `Tests  222 passed | 9 skipped (231)`. The two tests added are the G54 and G29 rows. This run does not cover `tests/views`, `tests/ui` or the render of any changed component; `test:quick` ran 67 test files chosen from the changed files, and its not-covered line is printed above.

**3. The scratch runs**: above, after the change; the unchanged-tree runs are the earlier builder's, above.

**4. The changed tests, on the unchanged tree (copy) and after the change (worktree).** On the unchanged tree, with the changed test files copied into the base copy (`vitest run` of the five files, 6 failed | 75 passed | 2 skipped), as printed:

```
FAIL tests/checks/config/arrangements.test.ts > the arrangements of config/layout.yml > the workbench page parses and names only views the catalogue knows   -> expected null not to be null
PASS tests/state/workbench/layout/saved/layout-saved.test.ts > an envelope of an earlier version, read as pages of one tree > migrates every page, and reads which one was current   (both rows)
FAIL tests/checks/config/config.test.ts > themeFindings > names a code theme that is no listed id, one finding per value, case included   -> expected [ Array(1) ] to deeply equal [ Array(1) ]
FAIL tests/checks/config/config.test.ts > themeFindings > names a bad code theme in a config that has no themes list   -> expected [ Array(1) ] to deeply equal [ Array(1) ]
FAIL tests/checks/config/config.test.ts > themeFindings > says nothing for an absent code_theme, tokens or a listed id   -> expected [ Array(1) ] to deeply equal []
FAIL tests/checks/config/config-folder.test.ts > oculus's own config directory > holds exactly the expected top-level keys, and no more   -> expected [ 'agents', 'apps', ...(113) ] to deeply equal [ 'agents', 'apps', ...(114) ]
FAIL tests/checks/config/config-folder.test.ts > oculus's own config directory > reads each file on its own and finds its own keys there and nowhere else   -> expected [ 'archive_label_mode', ...(13) ] to deeply equal [ 'archive_label_mode', ...(14) ]
```

Vitest prints the elided array elements with the ellipsis character and a count; here that is written `...(113)`, and the arrow vitest prints before the reason is written `->`. The G54 row fails because the key is absent; the G29 version 6 row passes on the unchanged tree; the G13 failures are the new sentence (first two tests) and the row for `vscode-dark-2026` (the third, `[ Array(1) ]` against `[]`); the two `config-folder` failures are the key list that now names `workbench`. After the change the same five files print `Test Files  5 passed (5)` and `Tests  82 passed | 1 skipped (83)`.

**5. Prose.** The new and changed sentences of the docs, comments and catalogue were read against `agents/spec.md`. A grep of the added comment lines for history words (`previous`, `used to`, `no longer`, `formerly`, `revert`, `original`, `instead of`, `earlier`, `legacy`, `old`, `now`, `was`, ids of steps and rulings) printed lines that describe behaviour ("the item the page was opened for", "an earlier entry"), none a history. The ASCII gate (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)`, `bin` does not exist in this tree) printed no line, `ASCII gate exit 0`; the same pattern over `docs/window.md`, `docs/views.md`, `docs/files-and-search.md`, `docs/configuration.md`, `HELP.md` and `DESIGN.md` printed no line. `npx prettier --check .` printed `All matched files use Prettier code style!`. The departures from the prose rules: none known.

**6. `sh utils/folder-check.sh`** printed nothing, `folder-check exit 0`. **`sh utils/unused-exports.sh`** against `.agents/worktrees/D56-base/tools/oculus/unused-exports.txt`: `Unused exports (245)` became `(244)`; no line was added; two entries left the list because the step now uses them (`themeLabel` in `state/shared/words/appearance.ts`, `restate` in `layout/index.ts`). New exports that had no importer outside their file (`folderName`, `repositoryInLimit`, `ROW_WORKBENCH`, `MenuAction`, `FolderSpec`, `FolderOpened`, `pageInstanceIds`, and the re-exports `KEPT_MAX`, `PINS_VERSION`, `sameFolder`, `KeptWorkbench` of `layout/index.ts`) are not exported; `tests/state/workbench/navigation/pages.test.ts` reads the page's instance ids through `instancesOfPages`, which has the same three expectations.

**7. Reuse and importers.** Each new function was searched for before it was written (`grep -rn "<name>\|<what it does>" src/lib`); the importers of each new export, from `grep -rlw <name> src`: `FolderLine` (Query, Problems, Repositories, SessionList), `viewMenu` (Repositories), `sessionsInFolder` and `terminalsInFolder` (SessionList), `limitedRepositories` (Repositories), `limitOf`/`withLimit` (limit.ts, folder-pages.ts, Repositories, SessionList), `createPageFlows` (WorkbenchMenu, Pages), `scopedStore` (context.ts), `createFolderPages` (context.ts), `createFolderOps` (layout.svelte.ts), `folderPageOf`/`keptFor`/`withKept`/`withoutKept`/`pageFromKept` (folder-store.ts), `keptOf` (saved.ts), `WorkbenchMenu` (RailFoot), `codeThemeInfo` (code-theme-menu.ts), `inFolder` (selectors, session-list.ts). `inFolder` in `views/shared/latex/places.ts` is a different function (it joins a path).

Number of full verify-list runs: item 1 three times (the quoted one is the last, after the last change), item 2 three times in the worktree after the change (the quoted one is the last) and once in the copy on the unchanged tree.

## The terms

No glossary: `ls docs` prints `apps.md configuration.md debugging.md diagrams files-and-search.md source-control.md terminals.md views.md window.md`.

## Files with line counts

`wc -l`, new then base (`new` is a file the step adds); `docs/diagrams/*` are regenerated by `npm run diagrams` (`channels`, `layer-data`, `layer-shell`, `layer-state`, `layer-views`, `layers`, each `.dot` and `.svg`, and `writes`). Every source is under 880 lines and every Svelte component under 520; `layout.svelte.ts` is at 879 of 880.

```
      97       97  config/appearance.yml
    1468     1462  config/catalogs/options.yml
     195      184  config/layout.yml
     240      240  config/text/findings.yml
     300      300  config/text/server.yml
     140      135  config/text/ui.yml
      66       64  config/text/views/boards/collection.yml
      25       23  config/text/views/boards/entry.yml
      21       19  config/text/views/boards/personal.yml
     132      130  config/text/views/boards/project.yml
      73       68  config/text/views/sessions/session-list.yml
      12       10  config/text/views/shared/folder-files.yml
     290      289  config/text/views/sources/files.yml
     296      291  config/text/views/sources/repositories.yml
     180      176  config/text/views/sources/search.yml
     211      210  config/text/views/system/workbench.yml
      69       69  docs/configuration.md
     154      154  docs/files-and-search.md
     287      283  docs/views.md
      98       86  docs/window.md
      58       33  src/lib/data/helpers/code-themes.ts
     245      244  src/lib/data/sources/config/catalog/schemas/options.ts
      75       74  src/lib/data/sources/config/themes.ts
     212      212  src/lib/server/edit/writes/config/config-value.ts
     365      363  src/lib/shell/rail/ActivityRail.svelte
     121      116  src/lib/shell/rail/RailFoot.svelte
     121    new  src/lib/shell/rail/WorkbenchMenu.svelte
     862      877  src/lib/state/client/context.ts
     334      308  src/lib/state/client/queries.svelte.ts
     561      561  src/lib/state/client/selectors.svelte.ts
     205      201  src/lib/state/sessions/terminal/composer/opening.svelte.ts
      45       44  src/lib/state/sessions/terminal/workbench-shape.ts
     869      868  src/lib/state/sessions/terminals.svelte.ts
     393      388  src/lib/state/shared/words/appearance.ts
     130    new  src/lib/state/sources/explorer/view/folder-pages.ts
      72    new  src/lib/state/sources/explorer/view/limit.ts
     695      695  src/lib/state/system/config/editors/draft.ts
     313      309  src/lib/state/system/config/groups.ts
     152      148  src/lib/state/workbench/layout/index.ts
     358      309  src/lib/state/workbench/layout/model.ts
      71    new  src/lib/state/workbench/layout/open/float/folder-pages.ts
     186    new  src/lib/state/workbench/layout/open/float/folder-store.ts
     627      626  src/lib/state/workbench/layout/open/float/pages.ts
      88       74  src/lib/state/workbench/layout/open/landing.ts
     464      447  src/lib/state/workbench/layout/open/opening.ts
      99    new  src/lib/state/workbench/layout/saved/kept.ts
     136      137  src/lib/state/workbench/layout/saved/load.ts
     744      708  src/lib/state/workbench/layout/saved/saved.ts
     879      866  src/lib/state/workbench/layout.svelte.ts
     603      522  src/lib/state/workbench/navigation/pages.ts
     500      498  src/lib/ui/controls/editor/kit/load.ts
     210      209  src/lib/ui/controls/editor/kit/theme/theme.ts
     184      174  src/lib/ui/menu/Menu.svelte
     384      312  src/lib/ui/menu/MenuList.svelte
     174      162  src/lib/ui/menu/menu-items.ts
     302      279  src/lib/views/boards/entry/Entry.svelte
     327      295  src/lib/views/boards/personal/Personal.svelte
     365      319  src/lib/views/sessions/session-list/SessionList.svelte
     349      338  src/lib/views/sessions/session-list/SessionWorkspace.svelte
     146      115  src/lib/views/sessions/session-list/session-list.ts
     518      495  src/lib/views/shared/card/ProjectCard.svelte
     255      254  src/lib/views/shared/explorer/tree/control/picks.svelte.ts
     612      594  src/lib/views/shared/explorer/tree/menu/row-menu.ts
     512      486  src/lib/views/shared/forms/entry/EntryCard.svelte
     143      131  src/lib/views/shared/links/FolderFiles.svelte
      37    new  src/lib/views/shared/links/FolderLine.svelte
     481      499  src/lib/views/sources/repositories/Repositories.svelte
      73    new  src/lib/views/sources/repositories/menus/view-menu.ts
     445      425  src/lib/views/sources/search/Problems.svelte
     126      140  src/lib/views/sources/search/Query.svelte
     200      190  src/lib/views/sources/search/problem-rows.ts
     367      395  src/lib/views/system/workbench/Pages.svelte
      48       26  src/lib/views/system/workbench/code-theme-menu.ts
     207      207  src/lib/views/system/workbench/settings/BrowserControl.svelte
     332      330  src/lib/views/system/workbench/settings/Item.svelte
      34       30  tests/checks/config/arrangements.test.ts
     632      631  tests/checks/config/config-folder.test.ts
     672      669  tests/checks/config/config.test.ts
     168      145  tests/state/workbench/layout/saved/layout-saved.test.ts
     118      117  tests/state/workbench/navigation/pages.test.ts
DESIGN.md 589 (base 587)
HELP.md 188 (base 188)
```

Outside the brief's path list, widened because each carries part of what the step builds: `state/client/queries.svelte.ts` and `selectors.svelte.ts` (`scopedStore` moved out of `context.ts` to keep it under 880; `inFolder` exported), `state/sessions/terminals.svelte.ts`, `composer/opening.svelte.ts` and `workbench-shape.ts` (the composer opens in the documents pane), `state/sources/explorer/view/folder-pages.ts` and `limit.ts` (new), `state/shared/words/appearance.ts` (the type `CodeThemeInfo` re-exported), `data/sources/config/catalog/schemas/options.ts` (`OWN_READER`), `server/edit/writes/config/config-value.ts` (`OWN_WRITE`), `config/text/server.yml` (the `own_write` sentence names the workbench key), `views/sessions/session-list/session-list.ts` and `SessionWorkspace.svelte`, `views/sources/repositories/menus/view-menu.ts` (new, the `...` menu moved out of `Repositories.svelte`), `views/shared/links/FolderLine.svelte` (new, the lifted line), `views/system/workbench/Pages.svelte` and `settings/Item.svelte`, `views/shared/explorer/tree/control/picks.svelte.ts`, `src/lib/ui/menu/` (ruling B), `docs/configuration.md`, and the test `tests/state/workbench/navigation/pages.test.ts` and `tests/checks/config/config-folder.test.ts`. `ActivityRail.svelte` gained `'workbenches'` in `stops` (line 184), in the region the brief says D50 writes (161-171 at the base).

## Head comments and doc paragraphs

| Where | State |
|---|---|
| `RailFoot.svelte` head comment | rewritten (names the Workbenches menu) |
| `ActivityRail.svelte` head paragraph | rewritten |
| `saved.ts` head comment and the `parseLayout` comment | rewritten (kept list, folder, item, versions) |
| `model.ts` comments of `Page`, `FolderRef`, `KeptWorkbench`, the version constants | rewritten |
| `opening.ts` head comment | rewritten (the `document` option) |
| `load.ts` head comment on code themes | rewritten |
| `theme.ts` head comment on code themes and the `ownRules` comment | rewritten |
| `code-themes.ts` head comment | rewritten |
| `themes.ts` head comment | rewritten |
| `code-theme-menu.ts` head comment | rewritten |
| `BrowserControl.svelte` head comment | rewritten |
| `Query.svelte`, `Problems.svelte`, `Repositories.svelte`, `SessionList.svelte`, `Pages.svelte` | rewritten |
| `ProjectCard.svelte`, `EntryCard.svelte`, `Entry.svelte`, `Personal.svelte`, `FolderFiles.svelte`, `row-menu.ts` | rewritten (the Open Workbench and Open in New Files controls) |
| `tex-root.svelte.ts`, `Files.svelte`, `Latex.svelte`, `Project.svelte`, `Search.svelte` | not changed, still true |
| `docs/window.md` (the foot of the rail, the Workbenches section) | rewritten and added; the Pages paragraph and the unique-view paragraph are still true |
| `docs/views.md` | added (Views limited to a folder) |
| `docs/files-and-search.md:43` | rewritten (Open in New Files) |
| `docs/configuration.md` (`layout.yml`, `appearance.yml` rows) | rewritten |
| `DESIGN.md` (Pages bullet, unique views bullet, editor primitive bullet) | rewritten; a bullet on workbench pages added with the naming sentence |
| `HELP.md` (rail and page paragraphs) | rewritten |
| `docs/DATA-MAP.md` (lines 232 and 234) | still true; grepped for `workbench`, `code_theme`, `layout.yml`, `oculus.layout` |

## Judgment calls the brief left open (each reversible)

- The Workbenches button's glyph is `app_view` (`ui.workbenches_glyph`).
- Reset layout is offered as a second group of the Workbenches menu (each open workbench listed again) and as a control on a workbench's row in the Pages view; both ask first through `createPageFlows.reset`.
- The clear controls are worded "Show every root" (Problems) and "Show every repository" (Repositories); Search keeps "Search the whole root". The sessions list says "In {root}/{path}" and, for a root, "In {root}".
- Terminals started in the folder are listed beside its sessions, by their working folder.
- Archived sessions are included in the limited sessions list so the list's own filter still reaches them.
- A workbench of a root itself keeps Problems' root chip (the line is drawn for a path only).
- The 19 VS Code themes are dark or light by name: light when the class contains `light`. A script over `vscode.css` found the 12 classes with `color-scheme: dark` to be exactly the 12 classes without `light` in the name (the 7 light classes set no `color-scheme`).
- The Code theme menu has five groups: tokens, VS Code dark, VS Code light, Shiki dark, Shiki light, with a rule between each. `codeThemeIds` returns the 19 classes in the order of `vscode-rules.json` (the light ones first), then Shiki's.
- The page's saved shape for the item it was opened for is `item: { view, state }`.
- `kept` is read from an envelope of any version, and `serialiseFloatless` writes it too.
- A kept entry with no `states` is malformed and drops the entry (ruling A).
- `openView` takes a `document: true` option and `composeAt` a `documents: true` option, so a Transcript, a Timeline and the composer's Terminal tab land in the documents pane of a workbench without being counted as tool views there (`landing.ts` `holdsTool` and `holdsOpened`).
- A picked session's Transcript and Timeline tabs are pinned to that session (`{ session, label }`).
- Open Workbench on a collection card is offered for each hub path that is a folder, and opens the entry page in the documents pane only when that folder is the one the entry's page is for.
- Open in New Files sits in the same group as Reveal in Finder and Open in Integrated Terminal, on a folder and on a root, and is not drawn on the up row.
- The Personal board's workbench shows the side project's `project.yml` in a source tab, built with `sourceFileState`, so the saved item holds the tab's `asked` stamp.
- Reset all pages keeps its existing rule: it rebuilds the pages that have a `rail` key, so a unique view that such an arrangement names moves out of a workbench that holds it, as it moves out of any page without a rail key.
- `code-themes.ts` imports `vscode-rules.json` with `with { type: 'json' }`, because `vite.config.ts` loads that module through Node, which refuses a JSON import without the attribute.
- `config-value.ts` `OWN_WRITE`, the `OWN_READER` of the options schema, the `config-folder.test.ts` layout key list and the `server.yml` `own_write` sentence name the `workbench` key; the G29 `describe` is worded "an envelope of an earlier version, read as pages of one tree" and its `it` keeps its title.

## Visible changes, before and after

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

## Anything in the brief that was wrong or impossible

- Rules A and B above (the kept layout loses the tabs' view state; the menu primitive has no second control), ruled before the build.
- The brief puts `layout.svelte.ts` at 866 lines with "only wiring"; it ends at 879 of 880, so the store holds no further addition.
- `ProjectCard.svelte` ends at 518 of 520 (base 495).
- The brief's `.agents/worktrees/D56-base/tools/oculus/unused-exports.txt` has 364 lines; `sh utils/unused-exports.sh` prints 363 now.
- `test:quick` printed `63.8 s (limit 45.0 s)` and `over the time limit` in its first run and `34.6 s (limit 45.0 s)` in the quoted last run; the time depends on the machine's load and was not compared with the unchanged tree (not verified).
