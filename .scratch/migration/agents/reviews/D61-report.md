Everything in the brief is done. Three things are not verified: no screen look was taken (no app, browser or Electron was started), so the Workbenches view, the rail menu and the repository item are checked by type check, lint, the store-level runs below and reading, not by sight; `npm run test:checks` has 3 failures (config-folder twice, integrity once) that read the hub's own `.oculus/` layer (its vocab and `sources.yml`), which this worktree does not hold, in files this step did not change, and they were not run on the base tree; the Manage Workbenches pick of the rail menu is a Svelte component, and its flow was run through the layout store (case 6), not through the component.

Two git commands were run by mistake (`git -C . status` and `git rm -q` with no path); neither changed anything.

## Open items of the state file, verbatim

- Open item 40 (2026-10-10, D62's preparation): where an app's secrets are kept. The ruling Apps as capable as VS Code extensions puts secret storage through the host in D62 (an app stores a token or a password under a key and reads it back), and oculus keeps no secret today: `grep -rln "safeStorage\|keychain\|secret-tool\|find-generic-password\|keytar" src` finds nothing. Choices about secrets are left to Axel, never closed in automode. Options: (a) the system's keychain: on a Mac the login Keychain through the `security` command, on Linux the Secret Service through `secret-tool` (libsecret), one item per app and key under the service `oculus-app:<view id>`; pro: encrypted at rest by the system, the way VS Code keeps an extension's secrets, and never in a file oculus writes; con: two code paths, and a machine with no Secret Service (a bare WSL2, a Linux without `secret-tool`) refuses the call with a word saying so. (b) one file per app, `~/.oculus/app-secrets/<name>.json`, mode 0600 in a 0700 folder, written as `approvals.json` is; pro: one code path on every machine; con: the secrets sit in plain text on disk, readable by any program run as you and copied by every backup. This is the lazy option. (c) a file as in (b) encrypted with a key kept in the system's keychain; pro: one file format; con: the keychain code of (a) and a cipher on top, for nothing (a) lacks. Recommendation: (a), since a secret is the one value that must not lie readable on disk, and the keychain is where the system already keeps the reader's passwords. D62 is prepared once this is ruled; D60 and D61 go on.

## The cases, first run on the unchanged tree

The runs are vitest files in a scratch folder outside the worktree (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d61b/first.cases.ts`, run with `npx vitest run --config <scratch>/vitest.config.ts <scratch>/first.cases.ts`), over the real layout store, folder pages, ui store, status rule and view registry. No case is a kept test (brief, "Cases"). Case 6 (a Svelte menu) and case 8 (a rule that did not exist) have no first run beyond reading the files.

- Case 1: the store has no reader of `Pages.kept` (`'keptWorkbenches' in layout` false) and no view `workbenches` is registered. The open workbenches (a, engine) are readable from `pages()`; the kept layout of c only by parsing the saved layout.
- Case 2: `folders.reset(id)` returned true, the Settings tab was gone and the kept list was empty. `createPageFlows.close` on a six-tab page held its question and closed nothing until a yes.
- Case 3: reopen of a kept layout gave the same tab ids and the kept list went from 1 to 0. `forgetKept`, `forget` and `keptWorkbenches` are not on the store (all false).
- Case 4: `folders.served('hub')` with no roots answered false, so `folders.open` answered the empty text before the workspaces were read.
- Case 5: `folderChoice` gave inside `{hub, projects/ideas/a}`, outside `/elsewhere/x`, none for a cancelled panel; `foldersToAdd` gave add `[/elsewhere/x]`; a root's top opened.
- Case 7: a file in A gave repoA; a Settings tab on a workbench of a folder in B gave the hub; nothing picked gave the hub.
- Case 9: a file in no repository gave null; a Files tab state of B gave repoB.
- Case 10: the hidden set kept `repository` over a reload (the ui store stores any name).
- Case 11: an envelope saved with `version: 2` and no repository field read with its hidden set and instance state intact.
- Case 12: the views group read `settings y1, account-setup y2, catalogue y3, pages y4, status y5, findings y6, audit y7, history y8, gallery y9, processes (no chord)`.

No case was found wrong under the brief's own rules. Case 12's wording differs from the tree: the brief says Settings to Processes keep `y1` to `y9`, and the tree gives Processes no chord (Gallery holds `y9`, because a chord reaches the first nine entries of a group). The rule "Workbenches has none and every existing chord stays" holds as written, and the ten existing views have the same chords after the build.

## The cases after the build

Run after the last code change with `npx vitest run --config <scratch>/vitest.config.ts <scratch>/after.cases.ts --reporter=verbose --silent=false`; the lines it printed, by case:

```
CASE 1 open rows [{"name":"a","place":"hub/projects/ideas/a","branch":"main"},{"name":"engine","place":"engine","branch":"cfg"}]
CASE 1 closed rows newest first [["d","hub/projects/ideas/d"],["c","hub/projects/ideas/c"]]
CASE 2 reset {"ok":true,"kept":0,"tabs":["files","search","repositories","latex","problems","session-list"]}
CASE 2 close asks first (a page of several tabs) {"question":["Close the page a and the 6 tabs on it?"],"forThisPage":[true],"closedBeforeYes":[]}
CASE 2 close of a one-tab page calls closePage with its id {"closed":["080974f0-b60e-447e-97b9-68f77cad7cbc"]}
CASE 3 reopen {"keptAfter":0,"sameIds":true}
CASE 3 state of a kept tab under its fresh id {"fresh":{"marker":"kept-state"}}
CASE 3 reopen with a held id {"opened":true,"keptAfter":[],"freshIds":true,"tabCount":[7,7],"unique":true}
CASE 3 forget {"answered":true,"keptInSavedLayout":[],"again":false}
CASE 3 open after forget {"how":"fresh","tabs":["files","search","repositories","latex","problems","session-list"]}
CASE 4 reading true
CASE 4 read, root served true
CASE 4 read, root not served false
CASE 4 forget works for any kept layout true
CASE 5 cancel {"folder":null,"line":""}
CASE 5 inside {"folder":{"root":"hub","path":"projects/ideas/a"},"line":""}
CASE 5 outside {"answer":{"folder":{"root":"new","path":""},"line":""},"adds":["/elsewhere/x"]}
CASE 5 outside refused {"folder":null,"line":"There is no folder at that path."}
CASE 5 panel failed {"folder":null,"line":"The folder panel could not be opened."}
CASE 5 root top opens true
CASE 5 new root top opens true
CASE 6 on a workbench {"current":{"root":"hub","path":"projects/ideas/a"},"group":"views","entry":"views","held":null}
CASE 6 after {"opened":true,"page":true,"pageIsWorkbench":false,"rail":"views","unique":true}
CASE 7 file in A (workbench on B) "repoA/file"
CASE 7 Settings tab on a workbench of B (C chosen) "repoB/workbench"
CASE 7 Settings tab on a page that is no workbench, C chosen "repoC/chosen"
CASE 7 nothing picked "hub/hub"
CASE 7 Files tab of B "repoB/file"
CASE 7 reload, chosen C, channel not delivered / delivered ["wait","use","wait"]
CASE 7 hub while waiting "hub/hub"
CASE 8 C removed from the roots {"state":"drop","picker":["/h/hub","/h/repoA","/h/repoB"]}
CASE 8 a session workspace outside the roots never listed ["/h/hub","/h/repoA","/h/repoB","/h/repoC"]
CASE 9 file in no repository on a workbench of B null
CASE 9 workbench folder in no repository, Settings tab null
CASE 11 old envelope {"statusRepository":null,"hidden":["sync"],"instance":{"a":1}}
CASE 10 after reload {"hidden":["sync","repository"],"chosen":"/h/repoC","leftItems":["host","repository","branch","sync"]}
CASE 12 views group [["settings",0,"y1"],["account-setup",1,"y2"],["catalogue",2,"y3"],["pages",3,"y4"],["status",4,"y5"],["findings",5,"y6"],["audit",6,"y7"],["history",7,"y8"],["gallery",8,"y9"],["processes",9,""],["workbenches",10,""]]
      Tests  9 passed (9)
```

Reading of the lines:

- Case 1: two open rows with folder and branch (`main`, `cfg`); two closed rows, newest first (d, then c).
- Case 2: Reset leaves the tabs of `workbench:` and no kept layout of the folder. Close goes through `createPageFlows.close`: a six-tab page asks first (its question names the page and 6 tabs; closePage is not called before a yes), a one-tab page calls `closePage` with its id.
- Case 3: Reopen returns the same ids and the kept list empties; with a kept tab id held by another page the workbench opens with fresh ids (`freshIds` true, 7 tabs of 7, no id appears twice in the page list) and the state of a kept tab is found under its fresh id (`marker: kept-state`); `forgetKept` answers true, the saved layout holds no kept entry, a second `forgetKept` answers false, and the next open of that folder makes a workbench from `workbench:`.
- Case 4: `servesRoot` answers true while the workspaces are being read, true for a served root and false for `gone`; Forget works on any kept layout. The view's row is dimmed only when `servesRoot` is false.
- Case 5: `pickWorkbenchFolder` answers no folder and no line for a cancelled panel, `{hub, projects/ideas/a}` for a folder inside a served root, the new root's key with path `''` for a folder outside every root (one `addRoot('/elsewhere/x')` made), "There is no folder at that path." for a refused add (no workbench), "The folder panel could not be opened." for a panel that failed. A root's top opens through `folders.open`.
- Case 6: on a workbench page with no holder, the view's group is `views`, the rail has an entry for it, and after `openRailPage` and `openView('workbenches', {}, currentPage().id)` the view is held once, on the page whose rail key is `views`, and the page on screen is no workbench.
- Cases 7 to 9: the order file, workbench folder, last chosen, hub; the chosen repository reads `wait` with no channel and with a channel that carries no state for it, `use` once the channel reports it, `drop` when no served root holds it (and the picker then lists three repositories, not C); a session workspace outside the roots is not listed; a file in no repository and a workbench folder in no repository answer null.
- Cases 10 and 11: an envelope with no repository field reads `statusRepository: null` with the hidden set and instance state intact; `repository` hidden and a chosen repository are both found after a reload; `repository` sits before `branch` in `LEFT_ITEMS`.
- Case 12: Settings to Gallery keep `y1` to `y9`; Processes (order 9) and Workbenches (order 10) have no chord.

## Done and not done, with the check

| Row | State | Check and its output |
|---|---|---|
| Workbenches view: Open and Closed sections, Reset layout, Close, Reopen, Forget, New workbench, empty lines | DONE | `src/lib/views/system/workbench/Workbenches.svelte` (360 lines); cases 1 to 5 above |
| Layout store reader and Forget, fresh ids on a collision | DONE | `keptWorkbenches`, `forgetKept` in `folder-store.ts`, `withFreshIds` in `folder-pages.ts`; case 3 |
| Split of `layout.svelte.ts` by concern | DONE | rail page operations in `layout/open/float/rail-pages.ts`; `layout.svelte.ts` 877 to 812 lines |
| Rail menu: list, close buttons, Manage Workbenches, no Reset layout group; `workbench-reset.ts` and its provide call deleted | DONE | `WorkbenchMenu.svelte`; `ActivityRail.svelte` `openWorkbenches`; case 6 |
| Status bar: repository rule, `repository` item, picker, kept choice in the ui store | DONE | `status.ts` `repoStatus`, `chosenState`, `repositoryChoices`; `ui.svelte.ts` `statusRepository`; cases 7 to 11 |
| HELP.md and DESIGN.md | DONE | HELP.md lines 35, 58, 59 (new bullet), 83 (new bullet), 84 and 219 (the view table row); DESIGN.md lines 476 and 578 |
| Screen look under the themes | NOT DONE | no app, browser or Electron may be started by the builder; the look at landing |
| Verify 2, the rename grep | DONE | `grep -rn "workbenches_reset_heading\|useWorkbenchReset\|provideWorkbenchReset\|workbench-reset" src config tests docs HELP.md DESIGN.md README.md` printed nothing (exit 1) |
| Verify 3, unused exports | DONE | `sh utils/unused-exports.sh` against the base `unused-exports.txt`: `diff` printed nothing (exit 0); no line is added |
| Verify 4, the ASCII gate of `spec.md` | DONE | the perl command over `src tests config` printed nothing (exit 0); the gate's `bin` folder does not exist in this worktree (`find` printed `bfs: error: bin: No such file or directory`), so it was run over the other three |
| Verify 5, folders and sizes | DONE | `sh utils/folder-check.sh` printed nothing (exit 0); `src/lib/views/system/workbench` holds 10 items, `layout/open/float` 7; largest changed files below |
| Verify 1, `npm run diagrams` then `npm run test:quick` | DONE | last run: `ok ASCII gate`, `ok prettier`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `ok vitest (17.0 s): ... tests 6.63s`, `test:quick: 17.5 s (limit 45.0 s); every command passed`. `test:quick` ran 3 times in all during the build; the quoted one is after the last change |
| `npm run test:checks` | 3 failures, not caused by this step | The worktree lacks the hub's own `.oculus/` layer (its vocab and `sources.yml`). The 239 findings of `integrity.test.ts` "validates with no findings" are `domain` and `themes` keys (25 `domain`, 214 `themes`) that the missing vocab does not define; the two `config-folder.test.ts` cases ("reads the roots of sources.yml without a finding" and "names a group of its own ...") read that layer. No file of this step is involved. Not run on the base tree |

The comment-width, import-cycle, boundary, text-key and folder checks of `tests/checks` pass after the last change (`Test Files  2 failed | 15 passed (17)`).

History words in the comments I added, `grep -n -i -E "(//|/\*|^> *\*|<!--|#).*\b(before|used to|no longer|still|previously|formerly|earlier|originally|D6[0-9]|Z7[0-9]{2}|2026|instead of the old|was moved|moved out|extracted|split out|now)\b"` over the added lines of every changed file: one hit remains, `Workbenches.svelte` "Ask before the layout kept for a folder is dropped.", where "before" orders the question and the drop; judged not history.

## Files and line counts

`diff -rq` of `src tests config utils` against `D61-base/tools/oculus` lists exactly these paths; the ones outside the brief's write list are marked.

- `src/lib/shell/rail/ActivityRail.svelte` 407 lines: OUTSIDE the write list: `openWorkbenches`, the rail's own opener for the view
- `src/lib/shell/rail/RailFoot.svelte` 124 lines: OUTSIDE the write list: passes the opener to the menu
- `src/lib/shell/rail/WorkbenchMenu.svelte` 118 lines
- `src/lib/shell/rail/workbench-reset.ts`: deleted
- `src/lib/shell/status/RepoItems.svelte` 240 lines
- `src/lib/shell/status/StatusBar.svelte` 361 lines
- `src/lib/shell/status/status-items.ts` 164 lines
- `src/lib/state/sources/explorer/acts/folders.ts` 110 lines
- `src/lib/state/sources/explorer/ops.svelte.ts` 742 lines
- `src/lib/state/sources/fs-transport.ts` 467 lines: `allRoots`, under `src/lib/state/`
- `src/lib/state/workbench/layout/index.ts` 152 lines
- `src/lib/state/workbench/layout/model.ts` 380 lines: `folderPlace`
- `src/lib/state/workbench/layout/open/float/folder-pages.ts` 92 lines
- `src/lib/state/workbench/layout/open/float/folder-store.ts` 227 lines
- `src/lib/state/workbench/layout/open/float/rail-pages.ts` 134 lines: new
- `src/lib/state/workbench/layout.svelte.ts` 812 lines
- `src/lib/state/workbench/navigation/rail.ts` 131 lines: `WORKBENCHES_VIEW`
- `src/lib/state/workbench/navigation/status.ts` 546 lines
- `src/lib/state/workbench/ui.svelte.ts` 781 lines
- `src/lib/views/system/workbench/Workbenches.svelte` 360 lines: new
- `src/routes/+page.svelte` 320 lines
- `config/text/statusbar.yml` 230 lines
- `config/text/ui.yml` 140 lines
- `config/text/views/system/workbench.yml` 230 lines
- `HELP.md` 458 lines: lines 35, 58, 59, 83, 84 and the view table row at 219 (the row is outside the listed line ranges)
- `DESIGN.md` 593 lines: lines 476 and 578
- `docs/diagrams/`: regenerated by `npm run diagrams`; which of its files differ from the base is not verified

Limits (880 for a file, 520 for a component): the largest is `layout.svelte.ts` at 812; the largest component is `ActivityRail.svelte` at 407.

## Judgment calls the brief left open

1. The rail menu opens the view from `ActivityRail.svelte` (`openWorkbenches`), which holds the rail's entries and the page store, and hands the opener to `RailFoot.svelte` and `WorkbenchMenu.svelte` as a prop. The menu cannot find the rail page itself because the shell may not read config. When no page or float holds the view and the page on screen is no workbench, the view opens on the page on screen. When the page on screen is a workbench, the view goes to the rail page of its catalogue group, else to the first page that is no workbench, and to a new page when every page is a workbench, so a Close or Reset from a row never takes the view with it.
2. A kept layout whose root is not served: the row is dimmed, a press does nothing, Reopen is disabled, and a warning mark at the row's end carries the tooltip. A row without a press has no tooltip in `TreeItem`, so the tooltip sits on the mark.
3. `chosenState` answers `none`, `use`, `wait` and `drop`. `wait` covers an undelivered `git` channel, the current workspace's roots not yet read, and a channel with no entry or a non-repository entry for the chosen root (the choice is kept, the hub is shown). `drop` is only the case where the current workspace's roots are read and none holds the chosen root, which is the brief's "no longer among the picker's repositories".
4. The last chosen repository is one value for the browser tab, in the ui store with the appearance, as the brief says; a newer field read with a `.catch(null)` fallback, no change of `UI_VERSION`.
5. The Open and Closed sections' open or closed state is held by the view component and starts open; it is not saved.
6. New workbench lists the roots of the current workspace (`fs.roots()`), by key.
7. A branch for a workbench row on a detached head is the short commit.
8. `pickWorkbenchFolder` is a new member of the explorer store beside `openFolder` and `addFolders`, sharing `addRoots` and `currentRoots` with them; its one new sentence ("The folder ... was added but this workspace does not serve it yet.") is `workbench.workbenches_unserved` in `workbench.yml`, since `files.yml` is outside the write list.
9. Glyphs: Reopen uses `folder`, Forget and Close use `dismiss`, Reset layout uses `refresh` as the Pages view does, New workbench uses `add`; no new glyph name.
10. `holdingRepository` and `repositoryStatus` in `status.ts` are module-private, since only `status.ts` calls them; the layout facade no longer re-exports `adoptFloats`, `adoptedPage`, `keptDefault`, `startedOn`, `withPage` or `giveDocuments`, which only the layout store used, and `rail-pages.ts` imports them from their own files (the facade's import cycle check forbids `rail-pages.ts` through the facade).

## Visible changes, before and after

- Rail Workbenches menu. Before: the open workbenches, then a second group "Reset layout" listing them again. After: the heading "Workbenches", the open workbenches with their close buttons, a rule, and "Manage Workbenches"; with none open, the heading, "No workbench is open" and "Manage Workbenches".
- Views catalogue, System group. Before: ten views. After: Workbenches as the eleventh, at order 10, with no chord; the ten chords are as before.
- Workbenches view. Before: none. After: Open and Closed sections of explorer rows, each with its controls, and a New workbench icon in the pane header.
- Reopening a closed workbench whose kept tab ids are held by a page or float. Before: a fresh workbench was made and the kept layout dropped. After: the kept tabs open under fresh ids with their states.
- Status bar. Before: branch and sync followed the active tab's file, else the hub. After: a `repository` item before `branch` shows the followed repository's name (its accessible label is "Repository {name}"), with a tooltip naming its folder and why; a press lists the Files view's repositories and a pick is kept for the browser tab. Branch and sync follow the file, else the workbench on screen, else the pick, else the hub. The right-click menu of the bar lists the item.
- Saved ui envelope. Before: no repository field. After: an optional `statusRepository`, read as none when absent.
- HELP.md and DESIGN.md: as listed above.

## Anything in the brief that was wrong or impossible

- Case 12 says Processes keeps `y9`; Processes has no chord and Gallery holds `y9` (evidence: the first-run line above).
- The ASCII gate names a `bin` folder this tree does not have (evidence in the Verify 4 row).
- The write list does not name `ActivityRail.svelte` and `RailFoot.svelte`, which the rail menu needs in order to reach the rail's entries (judgment call 1); widened, as the standing rule says.
- Items checked in the brief's premises and found as stated: `layout.svelte.ts` 877 lines before and 812 after; `pageFromKept` answering null on a held id; `createFolderPages.served` reading `fs.roots()`.

## Repair round 1

All seven items are closed. Open items: none. Not verified: the screen look (no app, browser or Electron was started), and the Svelte components `ActivityRail.svelte`, `WorkbenchMenu.svelte` and `RepoItems.svelte` are checked by type check, lint and reading, with the opener logic of item 1 run as a copy of `openWorkbenches` over the layout store, not through the component.

1. `openWorkbenches` opens the view on the page on screen unless that page is a workbench. `src/lib/shell/rail/ActivityRail.svelte` line 196 (head comment above it); `DESIGN.md` line 476; `HELP.md` line 59 unchanged. Check: case 6 below. With a page on screen that is no workbench, the view opens on that page (`sameAsOnScreen: true`, `pageCount: 1`). With a workbench on screen, it opens on the rail page `views`.
2. `chosenState` and `repositoryChoices` take the current workspace's roots, null while they are not read. `src/lib/state/workbench/navigation/status.ts` lines 310 and 333; `src/routes/+page.svelte` line 185 (`workspaceRoots = readRoots(workspaces())`), used at lines 192 and 218; `allRoots` stays at the root-key resolution of `repoStatus`. `DESIGN.md` line 578. Check: case 8 below. With two saved workspaces and the default current, a session repository under the root of `lab` is not listed and a choice under it is `drop`; with `lab` current it is listed and `use`; the roots not read give `wait` and an empty list; a workspace without roots gives `drop`.
3. One predicate, `readableState` (`status.ts` line 201), used by `readableRepositories` (line 208), `repositoryStatus` (line 238) and `chosenState` (line 333). Check: case 3 below. A chosen root whose git read carries an error is `wait`, is not listed, and `repoStatus` returns null for it.
4. `status.ts` lines 12 to 18 and the `holdingRepository` comment (line 220) name which functions ask `holdingRepository` (`repositoryOf` for the file, the folder, the hub and the Workbenches rows) and which ask `readableState`; `DESIGN.md` line 578 says the same. Check: reading both texts against the call sites in `status.ts`.
5. The `test:checks` row of this report (the row in the ledger above, and the first paragraph) names the cause: the worktree lacks the hub's own `.oculus/` layer (its vocab and `sources.yml`); the 239 integrity findings are 25 `domain` and 214 `themes` keys; the two config-folder cases read that layer; no file of the step is involved. Check: `grep -c '^+     "key":'` over the saved run printed 239, with `themes` 214 and `"domain"` 25.
6. `src/lib/shell/rail/WorkbenchMenu.svelte` line 72: one group headed `ui.workbenches` holds the open workbenches (or "No workbench is open"), then Manage Workbenches with a rule above it. Before: a flat list with no heading. After: the heading "Workbenches", the list, a rule, Manage Workbenches. The pick handler is unchanged.
7. `config/text/statusbar.yml` line 34 and `src/lib/shell/status/RepoItems.svelte` line 161. Before: the item's accessible label was "Repositories". After: "Repository {repo.name}", for example "Repository hub". `statusbar.repository_heading` ("Repositories") is unchanged.

Checks, from `tools/oculus` in the worktree, after the last change:

- `npm run diagrams`: finished, wrote `docs/diagrams/*`.
- `npm run test:quick`: `ok ASCII gate (0.6 s)`, `ok prettier (0.8 s)`, `ok svelte-kit sync (2.0 s)`, `ok eslint (8.3 s)`, `ok svelte-check (9.5 s): ... 459 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (17.6 s)`, `test:quick: 18.4 s (limit 45.0 s); every command passed`.
- `npm run test:checks`: `Test Files  2 failed | 15 passed (17)`, `Tests  3 failed | 268 passed (271)`; the three failures are the ones of item 5. The comment-width, import-cycle, boundary, text-key and folder checks pass.
- Rename grep over `src config tests docs HELP.md DESIGN.md`: printed nothing (exit 1).
- `sh utils/unused-exports.sh` against `D61-base/tools/oculus/unused-exports.txt`: `diff` printed nothing (exit 0).
- ASCII gate over `src tests config`: printed nothing (exit 0).
- `sh utils/folder-check.sh`: printed nothing (exit 0).
- `wc -l`: `WorkbenchMenu.svelte` 118, `ActivityRail.svelte` 407, `RepoItems.svelte` 240, `status.ts` 546, `+page.svelte` 320, `statusbar.yml` 230, `DESIGN.md` 593.
- Case 6: `CASE 6 page on screen is no workbench {"onScreenBefore":"805915ce-...","openedOn":"805915ce-...","sameAsOnScreen":true,"rail":null,"pageCount":1}`; `CASE 6 page on screen is a workbench {"group":"views","isWorkbench":false,"rail":"views"}`.
- Case 7: `["wait","use","wait"]` for the chosen root with the channel not delivered, delivered, and delivered without the root; `repoC/chosen`, `hub/hub`, `repoA/file`, `repoB/workbench` as before.
- Case 8: `CASE 8 default current, lab session repository {"listed":["/h/hub","/h/repoA","/h/repoB","/h/repoC"],"chosen":"drop"}`; `CASE 8 lab current {"listed":["/h/lab/tool"],"chosen":"use"}`; `CASE 8 workspaces loading / failed / empty ["wait",[],"drop"]`; `CASE 8 switch default to lab keeps then drops ["use","drop"]`; `CASE 8 C removed from the roots {"state":"drop","picker":["/h/hub","/h/repoA","/h/repoB"]}`.
- Case 3 (item 3): `CASE 3 chosen root git read with an error {"chosen":"wait","listed":["/h/hub","/h/repoA","/h/repoB"],"status":null}`.
- Case 10: `CASE 10 after reload {"hidden":["sync","repository"],"chosen":"/h/repoC","leftItems":["host","repository","branch","sync"]}`.
