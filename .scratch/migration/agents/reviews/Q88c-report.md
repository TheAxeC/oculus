# Q88c report

**NOT done, stated first.**

1. `floatTab` in `src/lib/state/workbench/layout/open/floats.ts` (the literal at line 258, a float made from one tab) still builds an unlocked pane. Ruling 15 names the four literals at 106, 147, 222 and 258; the first three now go through `repane`, which carries `locked`. The fourth makes a new pane from one tab taken out of another pane, so there is no lock of its own to carry, and the pane the tab left keeps its own lock. If a tab floated out of a locked pane should start a locked float, that is a change to the user-visible lock behaviour and is Axel's to rule; nothing else of ruling 15 is open.
2. The look section at the end is not verified in a browser. I have no browser; each row says what the tests that render it show.
3. Git run with a localised message catalogue is not verified. The refusal that starts Delete Anyway is recognised by git's English sentence (`is not fully merged`, `git-refs.ts:180`) with `LC_ALL=C` set on that one `-d` call (`git-refs.ts:179`); no test runs git under another language.
4. After the third full-list run I changed three files and ran the commands that cover them rather than a fourth full list: `tests/server/core/git/git-ssh.test.ts` (one comment line), `DESIGN.md:371` and `HELP.md:44` (the float lock sentences). Commands run after them: `npm run test:checks` (29 files passed, 444 tests passed), `npx prettier --check .` (All matched files use Prettier code style!), `! LC_ALL=C grep -rna '[^ -~]' src tests` (no output), `npx eslint tests/server/core/git/git-ssh.test.ts` (no output), and `npx vitest run tests/state/system/docs.test.ts tests/routes/docs/docs.test.ts tests/checks/config/integrity.test.ts tests/state/workbench/layout/pages.test.ts` (4 files, 184 tests passed).

Everything else in the brief and in the seventeen rulings is done; the sections below say how each is shown.

## Open items

Copied from `orchestrator-state.md` at 12:40 on 2026-10-02.

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line).
- Z263 (2026-10-02 12:40, a new step): the Files view's order and Collapse Folders. Axel asked for reorderable bookmarks and roots, and whether Collapse Folders leaving the roots open is intended. The tree: `collapseAll` (`views/sources/files/control/tab-actions.ts:94-101`) closes every folder and leaves each root's row open on purpose (its comment says so); VS Code's Collapse Folders in a multi-root workspace (`collapseAll`, `src/vs/workbench/contrib/files/browser/views/explorerView.ts:990-1007` on main, read with `curl`) closes every folder under the roots and leaves the roots open while any root has an open child, and a second press, with none open, closes the roots too. No drag reorders the roots, the folder bookmarks (Files section and rail menu), or the notes (`grep -rln drag src/lib/views/sources/files/sections` lists only Outline and Timeline, which drag a row out, not along). The rail, the terminals list, the collection entries, the focus lanes and the slides already reorder. No open step owns the Files view (X3a landed). Options: (a) a new step X3e: drag to reorder the roots (written to the workspace in force, `sources.yml` for the default one), the folder bookmarks (written to `~/.oculus/bookmarks.yml`, the rail menu following), the notes and the Files view's sections (VS Code drags its view sections), and a second Collapse Folders, with no folder under a root open, closing the roots, as VS Code's does. Pro: one step, every list of the Files view orderable as VS Code's. Con: a new step. (b) the roots and bookmarks only. Con: the notes and sections keep a fixed order. (c) nothing, the lazy option. Recommendation: (a).

## The seventeen rulings of round 1

Failing runs below are the failing assertion of the test on the tree as it stood before the change, or, where the case could not be written against that tree, the failing assertion with the change taken out of the source for the run. Every quoted passing run is from this turn.

**1. Cherry Pick sends `ref`, and a body test over every store action.** `src/lib/state/sources/repositories/repositories.svelte.ts:355-356` sends `{ ref: hash }` for `cherryPick`. `tests/state/sources/repositories/capabilities/store-actions.test.ts:144-150` expects `['cherryPick', { ref: HASH, confirm: true }]`. `tests/state/sources/repositories/capabilities/store-wire.test.ts:119` (every action the route knows is sent) and `:125` (the body the store builds for each action carries every field the route reads, read through `gitBodyShape` and the action table of `git-routes.ts`). Failing on the tree before the change: `store-wire.test.ts` `AssertionError: expected [ 'cherryPick reads ref' ] to deeply equal []`, and `store-actions.test.ts` `cherry picks a commit and deletes a branch behind the confirm` `AssertionError: expected [ [ 'cherryPick', ...(1) ], ...(1) ] to deeply equal [ [ 'cherryPick', ...(1) ], ...(1) ]` at the expected `['cherryPick', { ref: HASH, confirm: true }]`. Passing: `npx vitest run tests/state/sources/repositories/capabilities/store-wire.test.ts tests/state/sources/repositories/capabilities/store-actions.test.ts` is part of rows 2 and 6 below (store-wire: 2 passed, store-actions: 20 passed).

**2. An untracked symbolic link that leaves the repository.** `src/lib/server/git/git-index.ts:287` (`trashUntracked`) resolves the real path of each leaf's folder and of the leaf itself (`:301-302`), refuses a leaf whose real path, or a link target that cannot be resolved, is outside the repository (`:303`), and guards both the leaf and its target (`:309`) before the Trash is called. A link that points inside the repository is moved as the link. `tests/server/git/untracked/trash.test.ts` has `refuses an untracked link that points out of the repository, calling the Trash for none` and `refuses an untracked link whose target cannot be resolved`; a plain untracked file still goes (the existing cases of the file). Failing before: both new cases `AssertionError: expected true to be false`. Passing: `trash.test.ts` 14 passed (row 1).

**3. The main worktree checked.** `src/lib/server/core/git/git-compare.ts:326` (`workspaceSides(root, path, roots, timeout)`, the check at `:339`) refuses unless `permitted(realOf(main), roots.map(realOf))` and `pathInside(main, path)` hold, by real paths; `src/lib/server/git/git-reads.ts` hands it the roots. Tests: `tests/server/core/git/compare.test.ts` `refuses a main worktree outside the roots, returning none of its text` and `refuses a main worktree whose real location is outside the roots`; `tests/routes/git/refs.test.ts` `answers the main worktree file against this worktree file for workspace=` (the route refuses with 400 when the main worktree is outside the roots). Failing before: the compare case `AssertionError: expected true to be false`; the route case `AssertionError: expected 200 to be 400`. Passing: compare.test.ts 24 passed, refs.test.ts 16 passed.

**4. Open Worktree in New Window shows the folder.** The Files reveal is part of the saved instance state on this tree (`oculus.ui.v1`, written through the ui store), so the ruling's stop condition did not apply. `src/lib/state/sources/repositories/repositories.ts:844-845` calls `opening.showInFiles(dir)` and then `opening.openWindow(opening.address())`. `tests/state/sources/repositories/capabilities/open-worktree.test.ts:42` loads the storage as it stands when `openWindow` runs into a second client and finds the Files tab holding `reveal: { root: 'hub', path: '.agents/worktrees/Q1', settled: false }`; `store-actions.test.ts` holds the call order. Failing with `showInFiles` and `openWindow` swapped in the source: `open-worktree.test.ts` `AssertionError: expected [ 'window', 'files' ] to deeply equal [ 'files', 'window' ]`; `store-actions.test.ts` `Open Worktree > in a new window does the same, then opens the page address` `AssertionError: expected [ Array(3) ] to deeply equal [ Array(3) ]`. Passing: row 6 (21 passed).

**5. Delete Branch in the Branches section, and Delete Anyway (Z241 (b)).**

- Page: `src/lib/views/sources/repositories/refs/Branches.svelte:119-125` draws a Delete Branch control on each local branch row except the checked-out one, calling `ondelete` (`:36`, `:51`), which `Repo.svelte:142-148` wires to the same `askBranchDelete` flow and store action the graph menu uses (`menus/graph-menu.ts:213`, `graph/graph-picks.ts:57-66`).
- The second question: `askBranchDelete` asks the first question, then `deleteBranch`; when the answer is `not-merged` it asks `repositories.branch_unmerged_confirm` ("The branch '{0}' is not fully merged. Delete anyway?", `config/text/views/sources/repositories.yml:225`) with `branch_unmerged_detail`, and on yes calls `deleteBranchAnyway`; on no nothing more is sent.
- The code: `deleteBranch` (`src/lib/server/git/git-refs.ts:172-182`) runs `branch -d` with `LC_ALL=C` and, on git's `is not fully merged` refusal, answers `{ ..., code: 'not-merged' }` (`BRANCH_NOT_MERGED`, `src/lib/data/model/model-sessions.ts`, exported from `data/model/index.ts:459`). The store tells the refusal apart by that code (`repositories.svelte.ts:358-363`); the write store skips its toast for a code the caller asked about (`src/lib/state/client/writes.svelte.ts:123`, `SendOptions.asked`).
- `-D`: `deleteBranchAnyway` (`git-refs.ts:189-197`) runs `branch -D <name>` through `branchIn`, the call site `deleteBranch` uses; the action is in `ACTIONS` (`git-routes.ts:111`), in `CONFIRMED` (`:163`) and in the route table (`:320`). The same refusals come first for both forms: a name starting with `-`, the checked-out branch, a name that names no branch, a root no workspace names.
- Docs: `DESIGN.md:128` names `branch -D` after Delete Anyway's question as the one exception beside "no form carries `--force`"; `HELP.md:203` and the config texts `branch_unmerged_confirm` and `branch_unmerged_detail` say what the question does.
- Tests: `tests/server/git/refs/delete-branch.test.ts` (9 cases: merged deletes with `-d` and no code; unmerged refused with code `not-merged` and kept (`:37`); deleted on Delete Anyway (`:49`); a worktree-held branch refused (`:67`); a dash name refused before git runs for both forms (`:80`); the checked-out branch and a missing name refused for both forms (`:91`); an unlisted root refused for both (`:100`)). `tests/views/sources/repositories/graph/graph-picks.test.ts` `the second question of Delete Branch`, `tests/views/sources/repositories/menus/repositories-menu.test.ts` (the flow: first question then `-d`; unmerged asks the second question, yes sends `-D`, no sends nothing; merged sends no second question). `tests/views/sources/repositories/repositories.test.ts` `offers Delete Branch on each branch not checked out, as Delete Tag is offered on a tag`. `tests/state/client/writes.test.ts` (the asked code is not told; another code is). `tests/routes/git/refs.test.ts:132-133` (dash names refused for both actions) and `:170-190` (an unmerged branch is refused with code `not-merged` and kept; `deleteBranchAnyway` without `confirm` is refused with 400 and the branch kept; with `confirm` it answers 200). `tests/server/git/git-write.test.ts:571` keeps refusing the `--force` spelling.
- Failing with the code taken out of the source for each run: `git-refs.ts` without the code `delete-branch.test.ts` `AssertionError: expected undefined to be 'not-merged'`; `graph-menu.ts` without the second question `repositories-menu.test.ts` `AssertionError: expected [ Array(1) ] to deeply equal [ ...(2) ]`; `writes.svelte.ts` without the asked skip `writes.test.ts` `AssertionError: expected [ 'kept' ] to deeply equal []`; `Branches.svelte` without the control `repositories.test.ts` `AssertionError: expected +0 to be 1`; `store-wire.test.ts` `AssertionError: expected Set{ 'suggest', 'stage', ...(36) } to deeply equal Set{ 'stage', 'unstage', ...(37) }` with `deleteBranchAnyway` missing from the store. Passing: row 11 (87 passed) and `npx vitest run tests/server/git/git-write.test.ts` 47 passed.

**6. Hidden editor actions.** `src/lib/shell/panes/pane-view.ts:122-146` (`paneMenu`) is the pane menu as a function of facts; `:155` (`PANE_ONLY`: maximise, restore, fold and the two page lists) and `:158-160` (`isPaneItem`) name the pane items the strip menu repeats; `stripMenu` (`:276-280`) adds them when `editor_actions` is `hidden`, with Close always offered. `PaneView.svelte:217` builds the pane menu through `paneMenu`, `:248-251` sends a pick of a pane item to the pane's own `pick`, and the head comment at `:36-42` says what the code does. Test: `tests/shell/panes/pane-strip-menu.test.ts:396-445` holds every item of the pane menu of a page pane for maximised and foldable in all four combinations, and of a float. For a pane that holds no tab the pane menu also lists Split Right and Split Down, which call `splitInstance` with an empty active id and return at once (`state/workbench/layout/instances.ts:317-319`), so the strip menu offers the splits only while the pane holds a tab. Failing with the hidden branch of `stripMenu` removed: six cases, among them `AssertionError: close: expected false to be true`, `AssertionError: move-to-page: expected false to be true` and `expected [ '@ui.strip_open_file', ...(10) ] to include '@ui.strip_close'`. Passing: row 13 (26 passed).

**7. `DESIGN.md:128`.** Names `server/git/git-index.ts` as the home of `trashUntracked` (`grep -n "git-index.ts" DESIGN.md` prints line 128).

**8. "Nothing is ever forced".** `DESIGN.md:129` reads "No Source Control action pushes with `--force`; the deposit snapshot push (`deposit-git.ts:257`) is the one forced push"; `DESIGN.md:128` carries the `branch -D` exception; the comment above `deleteBranch` (`git-refs.ts:164-171`) and `deleteBranchAnyway` (`:184-188`), the `git-write.ts` head comment (`:21`, `:725-727`) and the push comment (`:297-301`) say the same. The grep over `src`, `DESIGN.md`, `HELP.md` and `tests/server/git` for `forced`, `force`, `--force`, `force-with`, `forcePush`, run in this turn, leaves these hits, each kept for its reason: `deposit-git.ts:17,19,245,253,256,257` and `deposit.ts:450` (the deposit snapshot push, the one forced push, held to one occurrence by `tests/server/git/deposit.test.ts`); `git-write.ts:237,252` ("a forced push, which nothing here runs", true); `git-remote.ts:9` ("No push here is forced", true); `git-write.ts:300` ("the force option of git appears nowhere in this file"); `rmSync(..., { force: true })` in `git-write.ts:277`, `deposit.ts` and other server files (the Node option to ignore a missing file, unrelated to git); `ssh.ts` `force` (a timer name); `sessions/group.ts` `forced` (an area override); `Modal.svelte` `forceMount`; `DESIGN.md:360` ("the deposit grows from a force-pushed snapshot", true of the deposit); `DESIGN.md:393` `forceManyBody`, `forceX`, `forceY` (d3). `grep -rn -- "--force" src/lib/server/git` prints only `deposit-git.ts:257`.

**9. First runs of four files.** The files of this tree run on the base copy of `5cf40f03`: `tests/state/workbench/ui.test.ts` 2 failed / 38 passed (`TypeError: ui.setPaneStrip is not a function`, `ui.test.ts:689:12` and `:698:72`); `tests/views/sources/repositories/graph-row.test.ts` 35 passed (the changes are fixture props and a `remotes` fact; no case changed behaviour); `tests/state/shared/instance-state-sources.test.ts` 64 failed / 290 passed (`instance-fixture.ts:99` `expect(answer).toStrictEqual(expected)` for the `compare`, `workspace` and `closed` fields: the base reader drops them); `tests/state/shared/words/tones.test.ts` 1 failed / 98 passed (`tones.test.ts:214:43` `AssertionError: expected [ 'code_theme', 'crt', ...(9) ] to deeply equal [ 'code_theme', 'crt', ...(11) ]`). Re-run in this turn with `npx vitest run --root <base copy> <file>` for each.

**10. Source-text cases are audits.** The nine cases of `tests/routes/page.test.ts` that read `+page.svelte` (`:80,84,104,111,117,122,135,140,145`) and the six of `tests/views/sources/repositories/diff-pane.test.ts` that read `Diff.svelte` (`:166,176,359,417,424,458`) are titled `audits that ...`: 15 audits. The behaviour they stand beside is proved by `tests/shell/context-guard.test.ts` (8 cases, row 15). Across the 61 files of the step, 78 cases carry the title `audits that`.

**11. `tabBar` and `actionsAt` in the frozen list.** `src/lib/state/shared/words/appearance.ts:82-90` keeps its other appearance values as separate module bindings: `let list`, `let byName`, `let paper`, `let crt = false`, `let codeTheme = CODE_TOKENS`, then `let tabBar: TabBar = 'multiple'`, `let actionsAt: EditorActions = 'strip'` and `let terminal`. `tests/checks/tree/boundaries.test.ts:289-296` lists `appearance.ts:list`, `byName`, `paper`, `crt`, `codeTheme`, `terminal`, `tabBar` and `actionsAt` as frozen bindings, so the two new values follow the pattern of the existing three (`crt`, `codeTheme`, `terminal`) unchanged. Passing: `boundaries.test.ts` 11 passed.

**12. The binary rule once.** `src/lib/server/core/git/git-compare.ts:379-381` defines `isBinary(text, utf8)` as `!utf8 || text.includes('\0')`; its two callers are `:73` (the committed and indexed read) and `:403` (the file read from disk), in the one order. Tests of both callers pass: `compare.test.ts` 24 passed, `refs.test.ts` 16 passed. No new case: the behaviour of both callers is unchanged.

**13. `Scope` and `Guard`.** No code change. `Scope` (`src/lib/server/files/fs/ops.ts:72`) and `Guard` (`:226`) are exported because they appear in the exported signatures of `protectedFiles` (`:242`) and `holdsProtected` (`:267`).

**14. `git.test.ts` split.** `tests/server/core/git/git.test.ts` was 899 lines with 43 cases (37 state cases and the 6 cases of the `read only` group). It is now `git.test.ts` (618 lines, 38 cases), `git-gate.test.ts` (165 lines, 6 cases: the group `read only` as it was, with its helper `everyRead`) and `git-fixture.ts` (224 lines, the repository builders and the allowed lists both files use); 38 + 6 = 44 cases. The one case more is `the commands the state reads ran > ran only the allowed subcommands ...` in `git.test.ts`, which holds the 37 state cases' own git calls to the allowed list now that the recorder of each test file sees only that file's calls. The comments of both files are restored to their full text with the path `server/core/git/git.ts`. `npx vitest run tests/server/core/git/git.test.ts` 38 passed, `git-gate.test.ts` 6 passed, `tests/checks/tree/duplication.test.ts` 18 passed (five stale entries removed from `allow-duplication.txt`). The largest file of `tests/server/core/git` is `git.test.ts` at 618 lines.

**15. Lock Group on a float.** `src/lib/state/workbench/layout/open/floats.ts:106,147,222` build the float's pane with `repane(...)` (`model.ts:183`), which carries `locked`; the dock merge at `:309` already used it. `src/lib/shell/panes/pane-view.ts` `stripMenu` offers Lock Group or Unlock Group on a float as on a page pane (the `floated ? []` branch is gone), and its head comment says so. `PaneView.svelte` already passes the float's `locked` and sends the pick through `change(..., page)`, which writes a float by its id. `DESIGN.md:371` and `HELP.md:44` no longer say a float cannot be locked. Tests: `tests/state/workbench/layout/open/floats.test.ts` `a locked pane made a float` (floated from a page, made from a shipped spec, kept through dock, free, move and return to a page); `tests/state/workbench/layout/open/floats-store.test.ts` `a float locked through the store` (a dock, a move and a save and read back; a float made from a locked page pane, saved and read back); `tests/shell/panes/pane-strip-menu.test.ts` `offers Lock Group on a float's strip, and Unlock Group once the pane is locked` and the two float menu lists. Failing before the change: `floats.test.ts` `a locked pane made a float` `AssertionError: expected undefined to be true` on `after.floats[0].pane.locked` and on `made[0].pane.locked`; `pane-strip-menu.test.ts` `AssertionError: expected [ '@ui.strip_open_file', ...(9) ] to include '@ui.strip_lock'`; on the base copy the two `floats-store.test.ts` cases fail on `expect(client.layout.floats()[0].pane.locked).toBe(true)`. Passing: row 12 (115 passed), row 13 (26 passed).

**16. Create Branch and Create Tag from a commit.** `src/lib/views/sources/repositories/graph/graph-picks.ts:70-97` (`namePrompt`) asks the name, and a tag's message, and starts the branch or tag at the commit picked; the start-point field and the keys `repositories.start_point` and `repositories.start_point_detail` are gone (`grep -rn start_point src tests config` prints nothing). The server's hash check on `start` stays. Tests: `graph-picks.test.ts` `asks a branch for a name alone and starts it at the commit picked`, `asks a tag for a name and a message and tags the commit picked`, `sends nothing for an empty name, but still closes`. Failing before: `graph-picks.test.ts` `AssertionError: expected [ '@repositories.branch_name', ...(1) ] to deeply equal [ '@repositories.branch_name' ]` at the `fields` line, and the same for the tag. Passing: row 8 (22 passed).

**17. The Trash question names the base name.** `src/lib/views/sources/repositories/menus/change-menu.ts:154-181` (`askTrash(root, paths, deps, t, named?)`) names the last segment of the path for one path, the folder's last segment for a folder (the folder row passes `target.folder`, `:195`), and the count for several paths with no folder. Tests in `repositories-menu.test.ts`: `names the base name of a nested untracked file`, `names the base name of a nested untracked folder`, and the folder case `sends an untracked folder to the Trash behind the question` now expects `@git.trash_confirm(d)`. Failing before: `repositories-menu.test.ts` `AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]` for the nested file (the question named the whole path `src/deep/u.txt`) and for the folder (the question worded with the count). Passing: row 3 (97 passed), row 1 (55 passed).

## Verification

Full-list runs of `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from `tools/oculus` of the worktree: 3. The third, after the last source edit (a comment in `git-write.ts`), printed `checks: 7 commands passed`. Its final lines:

```
$ npm test                      Test Files  460 passed | 23 skipped (483)   Tests  11773 passed | 622 skipped (12395)
$ npm run test:checks           Test Files  29 passed | 2 skipped (31)   Tests  444 passed | 9 skipped (453)
$ npm run check
$ npm run build
$ npm run format:check         All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`npm test` leaves out the files tagged `slow`, so the ones this step touches were run on their own in this turn, each passing: `tests/server/core/git/git.test.ts` (38), `git-gate.test.ts` (6), `git-reads.test.ts` (35), `tests/server/core/paths.test.ts` (9), `tests/server/git/deposit.test.ts` (32), `git-ops.test.ts` (39), `git-write.test.ts` (47), `tests/routes/git/changes.test.ts` (5), `tests/server/core/changes.test.ts` (21), `tests/shell/workbench.test.ts` (55), `tests/views/whole/chips.test.ts` (11), `tests/routes/docs/docs.test.ts` (38). `compare-gate.test.ts` (4 passed) and `held.test.ts` (5 passed) were run alone, since a 5000 ms timeout hit them when many files ran together.

What the green run does not cover: the browser (no case here renders in a browser), git under a language other than English, and the Trash call itself, which every test replaces with a recorder.

## The cases' first run on the unchanged tree

Command: `npx vitest run $(cat files.txt) --reporter=json`, run before any source change, over the 43 test files of the plan step that exist or were written for it. Result: 34 files failed and 9 passed; 189 tests failed and 557 passed (746). A row marked LOADFAIL is a file that does not load on the unchanged tree because the module or export it imports does not exist; it counts among the 34 failed files. Per file:

```
FAIL tests/routes/page.test.ts failed=3 passed=11
     1x AssertionError: Target cannot be null or undefined.
     1x AssertionError: expected '<script lang="ts">\n    // The page r...' to contain 'from \'$lib/shell/context-guard\
     1x AssertionError: expected '\n        connect([\n            \'po...' to contain 'document.removeEventListener(\'c
LOADFAIL tests/shell/context-guard.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../src/lib/shell/context-guard.ts' imported from tests/shell/context-guard.test.ts
FAIL tests/checks/config/config-folder.test.ts failed=2 passed=24
     1x AssertionError: expected [ 'agents', 'arch_color', ...(95) ] to deeply equal [ 'agents', 'arch_color', ...(97) ]
     1x AssertionError: expected [ 'code_theme', 'crt', ...(4) ] to deeply equal [ 'code_theme', 'crt', ...(6) ]
FAIL tests/routes/git/refs.test.ts failed=12 passed=2
     1x AssertionError: trashUntracked: expected [ Array(33) ] to include 'trashUntracked'
     1x AssertionError: trashUntracked: expected [ 'commit', 'push', 'pull', ...(16) ] to include 'trashUntracked'
     1x AssertionError: expected { Object (error) } to deeply equal { Object (error) }
     5x AssertionError: expected 400 to be 200 // Object.is equality
     1x AssertionError: expected 'b0d51b98415a882942f9bc3cd4ae87fd44641...' to be '758a587139a30cb4291ca9f97f9c76378a5e1
     1x AssertionError: {"action":"createBranch","name":"ok","start":"-x","confirm":true}: expected 200 to be 400 // O
     1x AssertionError: expected { status: 400, ...(1) } to deeply equal { status: 200, ...(1) }
     1x AssertionError: expected undefined to be 'origin/main' // Object.is equality
FAIL tests/routes/git/untracked.test.ts failed=4 passed=4
     1x AssertionError: expected { Object (error) } to deeply equal { Object (error) }
     3x AssertionError: expected 400 to be 200 // Object.is equality
FAIL tests/shell/panes/pane-strip-menu.test.ts failed=9 passed=9
     1x AssertionError: expected [ '@ui.strip_open_file', ...(7) ] to deeply equal [ '@ui.strip_open_file', ...(11) ]
     1x AssertionError: expected [ '@ui.strip_open_file', ...(1) ] to deeply equal [ '@ui.strip_open_file', ...(5) ]
     1x AssertionError: expected [ '@ui.strip_open_file', ...(7) ] to include '@ui.strip_unlock'
     1x AssertionError: expected undefined to deeply equal [ ...(3) ]
     1x AssertionError: expected [ null, 'top', 'bottom', 'left', ...(3) ] to deeply equal [ null, null, 'top', 'bottom'
     1x AssertionError: expected [] to deeply equal [ 'note:p:1', 'lock:p:1:true', ...(6) ]
     1x TypeError: (0 , __vite_ssr_import_1__.newNoteOpener) is not a function
     2x AssertionError: expected [ '@ui.strip_open_file', ...(6) ] to deeply equal [ '@ui.strip_open_file', ...(9) ]
FAIL tests/state/sessions/source.test.ts failed=4 passed=48
     1x TypeError: (0 , __vite_ssr_import_1__.headTabState) is not a function
     2x TypeError: (0 , __vite_ssr_import_1__.loadHeadFile) is not a function
     1x AssertionError: expected { Object (readIn, text, ...) } to match object { text: 'old\n', saved: 'old\n', ...(2) 
PASS tests/state/workbench/rail-badges.test.ts failed=0 passed=103
FAIL tests/ui/menu/menu-words.test.ts failed=2 passed=1
     2x TypeError: t is not a function
LOADFAIL tests/server/core/git/compare.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-compare.ts' imported from tests/server/core/git/compare.test.ts
LOADFAIL tests/server/core/git/git-parse.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-parse.ts' imported from tests/server/core/git/git-parse.test.ts
LOADFAIL tests/server/core/git/git-reads.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/git-reads.test.ts
LOADFAIL tests/server/core/git/git-ssh.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/git-ssh.test.ts
LOADFAIL tests/server/core/git/git.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '/src/lib/server/core/git/git.ts' imported from tests/server/core/git/git.test.ts
LOADFAIL tests/server/core/git/head.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-compare.ts' imported from tests/server/core/git/head.test.ts
LOADFAIL tests/server/core/git/held.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/held.test.ts
LOADFAIL tests/server/git/refs/cherry-pick.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/git/refs/cherry-pick.test.ts
FAIL tests/server/git/refs/delete-branch.test.ts failed=7 passed=0
     7x TypeError: (0 , __vite_ssr_import_2__.deleteBranch) is not a function
FAIL tests/server/git/refs/detached.test.ts failed=11 passed=3
     5x TypeError: (0 , __vite_ssr_import_1__.switchDetached) is not a function
     1x AssertionError: expected '315a64d47a1fe52330c2534a8f2dcbaaafa1b...' to be 'b50ed49565cac469ff87238f695575a6977f9
     2x AssertionError: -x: expected true to be false // Object.is equality
     1x AssertionError: expected true to be false // Object.is equality
     1x AssertionError: expected '29d0428da193e71afe069c3e8bbec8a80328a...' to be '513249ab98b65e6ac8cbad78baef04c594197
     1x AssertionError: expected 'f482b0122e32c6360e74c2327d98e06e77615...' to be '7241a2ef2340ca4f95a29d804a4ecd48269d9
PASS tests/server/git/refs/identity.test.ts failed=0 passed=3
FAIL tests/server/git/untracked/ignore.test.ts failed=12 passed=0
     12x TypeError: (0 , __vite_ssr_import_3__.addToGitignore) is not a function
FAIL tests/server/git/untracked/trash.test.ts failed=12 passed=0
     12x TypeError: (0 , __vite_ssr_import_3__.trashUntracked) is not a function
PASS tests/shell/panes/floats/float-geometry.test.ts failed=0 passed=27
PASS tests/shell/panes/floats/floatlayer.test.ts failed=0 passed=13
FAIL tests/shell/panes/strip/strip-render.test.ts failed=5 passed=3
     1x AssertionError: expected 3 to be 1 // Object.is equality
     1x AssertionError: expected 3 to be +0 // Object.is equality
     1x AssertionError: expected '<!--[--><div class="workbench svelte-...' not to contain 'aria-label="Split tab to the
     2x Error: text key not in the text catalog (config/text/): ui.strip_unlock
LOADFAIL tests/shell/panes/strip/strip-shape.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/shell/panes/strip/strip-shape.ts' imported from tests/shell/panes/strip/strip-shape.test.ts
FAIL tests/state/shared/words/appearance.test.ts failed=21 passed=121
     13x TypeError: (0 , __vite_ssr_import_3__.showTabs) is not a function
     8x TypeError: (0 , __vite_ssr_import_3__.editorActions) is not a function
FAIL tests/views/sources/repositories/diff-pane.test.ts failed=1 passed=27
     1x AssertionError: expected '<script module lang="ts">\n    // Lay...' to contain 'latestRead('
FAIL tests/views/sources/repositories/repositories.test.ts failed=1 passed=43
     1x AssertionError: expected 1 to be 2 // Object.is equality
FAIL tests/state/sources/repositories/capabilities/repositories-badge.test.ts failed=7 passed=1
     1x AssertionError: expected '' to be '7' // Object.is equality
     3x AssertionError: expected '' to be '2' // Object.is equality
     1x AssertionError: expected '' to be '250' // Object.is equality
     1x AssertionError: expected '' to be '5' // Object.is equality
     1x AssertionError: expected 'Repositories ' to contain '3'
LOADFAIL tests/state/sources/repositories/capabilities/store-actions.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../../src/lib/state/sources/repositories/compare.ts' imported from tests/state/sources/repositories/capabilities/store-actions.test.ts
FAIL tests/state/sources/repositories/capabilities/view-state.test.ts failed=10 passed=0
     1x AssertionError: expected undefined to deeply equal []
     2x TypeError: (0 , __vite_ssr_import_1__.visibleRoots) is not a function
     1x TypeError: (0 , __vite_ssr_import_1__.closeRepository) is not a function
     2x TypeError: (0 , __vite_ssr_import_1__.closeOthers) is not a function
     1x TypeError: (0 , __vite_ssr_import_1__.preparedMessage) is not a function
     3x TypeError: (0 , __vite_ssr_import_1__.cutGroups) is not a function
PASS tests/server/root/watch/git/git-events.test.ts failed=0 passed=6
PASS tests/server/root/watch/git/git-workspaces.test.ts failed=0 passed=10
PASS tests/server/root/watch/git/git.test.ts failed=0 passed=23
FAIL tests/server/root/watch/git/scan.test.ts failed=2 passed=2
     2x AssertionError: expected [ ...(2) ] to deeply equal [ ...(3) ]
FAIL tests/state/workbench/layout/open/locked.test.ts failed=24 passed=2
     3x TypeError: (0 , __vite_ssr_import_2__.setLocked) is not a function
     3x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'pane', path: [ 2 ] }
     1x AssertionError: expected { kind: 'pane', path: [ +0 ] } to deeply equal { kind: 'pane', path: [ 1 ] }
     1x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'split', path: [ 1 ] }
     1x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'split', path: [ +0 ] }
     1x TypeError: (0 , __vite_ssr_import_1__.renameInstance) is not a function
     4x AssertionError: expected [] to deeply equal [ '0' ]
     2x AssertionError: expected [ [ 'c' ] ] to deeply equal [ [], [ 'c' ] ]
     1x AssertionError: expected [ [ 'f' ], [] ] to deeply equal [ [ 'f' ], [], [] ]
     1x AssertionError: expected [ undefined, 'terminals' ] to deeply equal [ undefined, 'terminals', 'terminals' ]
     1x AssertionError: expected [ [ 'a', 'c' ] ] to deeply equal [ [], [ 'c', 'a' ] ]
     5x Error: text key not in the text catalog (config/text/): ui.page_default
PASS tests/state/sources/repositories/view/commit-action.test.ts failed=0 passed=11
FAIL tests/state/workbench/layout/saved/layout-locked.test.ts failed=3 passed=2
     1x AssertionError: expected { ...(3) } to deeply equal { ...(3) }
     1x AssertionError: expected { kind: 'pane', tabs: [], active: '' } to deeply equal { kind: 'pane', tabs: [], ...(2)
     1x AssertionError: expected { kind: 'pane', tabs: [], ...(2) } to deeply equal { kind: 'pane', tabs: [], ...(3) }
FAIL tests/views/sources/repositories/changes/change-rows.test.ts failed=3 passed=18
     1x AssertionError: expected [ 'Open File', 'Stage' ] to deeply equal [ 'Open File', 'Discard', 'Stage' ]
     1x AssertionError: expected [ 'Stage All Untracked' ] to deeply equal [ undefined, 'Stage All Untracked' ]
     1x AssertionError: expected undefined to be 'note_back' // Object.is equality
FAIL tests/views/sources/repositories/changes/trash-and-cuts.test.ts failed=9 passed=3
     3x TypeError: Cannot read properties of undefined (reading 'replace')
     1x AssertionError: expected undefined to be 'Too many changes were detected. Only ...' // Object.is equality
     1x AssertionError: expected '<!--[--><!--[-1--><!--]--> <div class...' to include undefined
     1x AssertionError: expected 3 to be 2 // Object.is equality
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'data-root="/other"'
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'aria-label="undefined"'
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to include undefined
PASS tests/views/sources/repositories/changes/tree-mode.test.ts failed=0 passed=30
FAIL tests/views/sources/repositories/menus/repositories-menu.test.ts failed=25 passed=7
     1x AssertionError: expected [ ...(5) ] to deeply equal [ ...(7) ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(4) ]
     1x AssertionError: expected [ false, false, true, false, true ] to deeply equal [ false, false, false, true, ...(3)
     1x AssertionError: expected '@repositories.menu_reveal' to be '@repositories.menu_compare_workspace' // Object.is
     1x AssertionError: expected [ 'openChange:/r,changed,a.ts', ...(3) ] to deeply equal [ 'openChange:/r,changed,a.ts'
     1x AssertionError: expected [] to deeply equal [ Array(1) ]
     1x TypeError: (0 , __vite_ssr_import_1__.askTrash) is not a function
     1x AssertionError: expected [] to deeply equal [ 'ignore:/r,dir/' ]
     1x AssertionError: expected [ '@repositories.menu_stage' ] to deeply equal [ '@repositories.menu_stage', ...(2) ]
     1x AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
     1x AssertionError: expected [ '@git.stage_all_untracked' ] to deeply equal [ '@git.stage_all_untracked', ...(1) ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(8) ]
     1x AssertionError: expected [] to deeply equal [ '@repositories.menu_compare_with' ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(6) ]
     1x AssertionError: expected [ { kind: 'open' }, ...(2) ] to deeply equal [ { kind: 'open' }, ...(9) ]
     1x AssertionError: expected 'none' to be 'remote' // Object.is equality
     1x AssertionError: expected { kind: 'checkout', ...(1) } to deeply equal { kind: 'detach-ref', ...(1) }
     1x TypeError: (0 , __vite_ssr_import_2__.askBranchDelete) is not a function
     3x TypeError: t is not a function
     1x AssertionError: expected [ '@repositories.menu_terminal', ...(1) ] to deeply equal [ '@repositories.menu_termina
     3x TypeError: (0 , __vite_ssr_import_3__.closedChoices) is not a function

```

## DONE / NOT DONE

Every row names the command run in this turn; the output is the vitest summary it printed. Cases titled `audits that` read a source file's text; they stand beside the behaviour cases named in the row.

| # | status | what | command | output |
|---|---|---|---|---|
| 1 | DONE | Server `trashUntracked` (src/lib/server/git/git-index.ts:287) behind the confirm, with the real-path refusals of ruling 2; store action; changed-file menu, folder menu, Untracked head 'Discard All Untracked Changes' and an inline Discard control on the row; VS Code's question strings naming the base name, button 'Move to Trash'. | `npx vitest run tests/server/git/untracked/trash.test.ts tests/routes/git/untracked.test.ts tests/views/sources/repositories/changes/trash-and-cuts.test.ts tests/views/sources/repositories/changes/change-rows.test.ts` | Test Files  4 passed (4) / Tests  55 passed (55) |
| 2 | DONE | `addToGitignore` (git-index.ts:336) appends one line per path, atomic, refuses a link or a folder as `.gitignore`; store `ignore` then opens `.gitignore` in a source tab; changed-file and folder menus. | `npx vitest run tests/server/git/untracked/ignore.test.ts tests/state/sources/repositories/capabilities/store-actions.test.ts` | Test Files  2 passed (2) / Tests  32 passed (32) |
| 3 | DONE | `head=` read, read-only source tab `<file> (HEAD)` / `<file> (Index)` (state/sources/repositories/file-git.ts headTabState); Open File (HEAD) on Changes and Staged rows, none on an Untracked row. | `npx vitest run tests/server/core/git/head.test.ts tests/state/sessions/source.test.ts tests/views/sources/repositories/menus/repositories-menu.test.ts` | Test Files  3 passed (3) / Tests  97 passed (97) |
| 4 | DONE | `workspace=` read (both sides from disk, each held inside its own worktree, the main worktree checked against the roots), a diff pane over it, and the menu item on a linked worktree only. | `npx vitest run tests/server/core/git/compare.test.ts tests/views/sources/repositories/diff-pane.test.ts` | Test Files  2 passed (2) / Tests  52 passed (52) |
| 5 | DONE | `closed: string[]` in `RepositoriesView`; Close Repository, Close Other Repositories, Reopen Closed Repositories (quick pick: title 'Reopen Closed Repositories', placeholder 'Pick a repository to reopen', 'All Repositories' after a separator when more than one is closed); 'all closed' empty state. | `npx vitest run tests/state/sources/repositories/capabilities/view-state.test.ts tests/views/sources/repositories/repositories.test.ts` | Test Files  2 passed (2) / Tests  55 passed (55) |
| 6 | DONE | Open Worktree and Open Worktree in New Window on a worktree row; the folder is added as a workspace root and shown in Files before the new window opens, so the saved records the new window loads hold the reveal; a refusal is one muted row. | `npx vitest run tests/state/sources/repositories/capabilities/store-actions.test.ts tests/state/sources/repositories/capabilities/open-worktree.test.ts` | Test Files  2 passed (2) / Tests  21 passed (21) |
| 7 | DONE | `switchDetached` (git-write.ts, `git switch --detach`, refused on a dirty tree); Checkout (Detached) on a graph commit and on a remote branch name; Cherry Pick sends `ref`. | `npx vitest run tests/server/git/refs/detached.test.ts tests/routes/git/refs.test.ts tests/views/sources/repositories/graph/graph-picks.test.ts` | Test Files  3 passed (3) / Tests  38 passed (38) |
| 8 | DONE | Create Branch and Create Tag from a commit: a prompt for the name (and a tag's message), the new ref starting at the commit picked (graph/graph-picks.ts `namePrompt`); the server takes `start` for `createBranch` and `createTag` and checks it is a hash. | `npx vitest run tests/server/git/refs/detached.test.ts tests/views/sources/repositories/graph/graph-picks.test.ts` | Test Files  2 passed (2) / Tests  22 passed (22) |
| 9 | DONE | `cherryPickIn` (git-write.ts); 'Cherry-picking' banner with Abort and no Continue; commit box prefilled from git's prepared message; Abort runs `cherry-pick --abort`; an empty pick is aborted and answered 'The changes are already present in the current branch.' | `npx vitest run tests/server/git/refs/cherry-pick.test.ts tests/state/sources/repositories/view/commit-action.test.ts` | Test Files  2 passed (2) / Tests  17 passed (17) |
| 10 | DONE | Compare with Remote, Compare with Merge Base (base on the first graph page), Compare with... (quick pick over `refs=`, placeholder 'Select a reference to compare with'), each opening a compare diff pane. | `npx vitest run tests/server/core/git/compare.test.ts tests/views/sources/repositories/graph-row.test.ts` | Test Files  2 passed (2) / Tests  59 passed (59) |
| 11 | DONE | Delete Branch in the graph menu and the Branches section (`git branch -d`, not offered for the checked-out branch) and Delete Anyway after VS Code's second question (`git branch -D`, in `CONFIRMED`, told apart by the outcome code `not-merged`). | `npx vitest run tests/server/git/refs/delete-branch.test.ts tests/state/client/writes.test.ts tests/views/sources/repositories/repositories.test.ts tests/state/sources/repositories/capabilities/store-wire.test.ts` | Test Files  4 passed (4) / Tests  87 passed (87) |
| 12 | DONE | `Pane.locked` (state/workbench/layout/model.ts), `setLocked` (layout/tree.ts:333), saved format, Lock Group / Unlock Group in the strip menu of a page pane and of a float, lock glyph at the strip's right end; a locked pane is skipped by where a new view opens; a tab opened from its own strip or dropped on it still goes in; a float keeps its lock through every float operation and a save and read back. | `npx vitest run tests/state/workbench/layout/open/locked.test.ts tests/state/workbench/layout/saved/layout-locked.test.ts tests/shell/panes/strip/strip-render.test.ts tests/state/workbench/layout/open/floats.test.ts tests/state/workbench/layout/open/floats-store.test.ts` | Test Files  5 passed (5) / Tests  115 passed (115) |
| 13 | DONE | New Text File in the strip menu; `newNoteOpener` (state/workbench/layout/open/new-note.ts) opens a fresh scratch Note in that pane; under `editor_actions: hidden` the strip menu holds every item of the pane menu. | `npx vitest run tests/shell/panes/pane-strip-menu.test.ts` | Test Files  1 passed (1) / Tests  26 passed (26) |
| 14 | DONE | `show_tabs: multiple|single|none` and `editor_actions: strip|hidden` in config/appearance.yml, options entries, `VOCAB_KEYS`, Tab Bar and Editor Actions Position submenus; the pick is written to appearance.yml through `ui.setPaneStrip`. | `npx vitest run tests/state/shared/words/appearance.test.ts tests/state/shared/words/tones.test.ts tests/state/workbench/ui.test.ts tests/checks/config/config-folder.test.ts` | Test Files  4 passed (4) / Tests  307 passed (307) |
| 15 | DONE | `shouldCancel(event)` (shell/context-guard.ts) and one document `contextmenu` listener (routes/+page.svelte); 8 behaviour cases in context-guard.test.ts, 3 audits of the listener's wiring in page.test.ts. | `npx vitest run tests/shell/context-guard.test.ts tests/routes/page.test.ts` | Test Files  2 passed (2) / Tests  22 passed (22) |
| 16 | DONE | `commitWith` passes `user.useConfigOnly` through `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_0` (git-write.ts). | `npx vitest run tests/server/git/refs/identity.test.ts` | Test Files  1 passed (1) / Tests  3 passed (3) |
| 17 | DONE | `GitState.held` keeps the pre-cut counts; `cutGroups(git)` names the cut groups; the warning row is drawn in the Repositories view and in `ChangeGroups.svelte`. | `npx vitest run tests/server/core/git/held.test.ts tests/state/sources/repositories/capabilities/view-state.test.ts` | Test Files  2 passed (2) / Tests  15 passed (15) |
| 18 | DONE | `repositoriesBadge()` (state/workbench/rail-badges.svelte.ts) sums held merge + staged + changes + untracked over `gitRoots()`; registered as the Repositories view's badge. | `npx vitest run tests/state/sources/repositories/capabilities/repositories-badge.test.ts tests/state/workbench/rail-badges.test.ts` | Test Files  2 passed (2) / Tests  111 passed (111) |
| 19 | DONE | `wanted()` in server/root/watch/git.ts scans each root one folder deep (skips links and `node_modules`); also runs on a workspaces-file change. | `npx vitest run tests/server/root/watch/git/scan.test.ts tests/server/root/watch/git/git.test.ts` | Test Files  2 passed (2) / Tests  27 passed (27) |
| 20 | DONE | `server/core/git.ts` and `git-parse.ts` moved to `server/core/git/`, with `git-compare.ts` and `git-run.ts` beside them; `server/core` holds 9 items. | see below | `ls src/lib/server/core | wc -l` printed `9`; `wc -l` printed git-compare.ts 407, git-parse.ts 586, git-run.ts 86, git.ts 837, deposit.ts 828, git-write.ts 797, deposit-git.ts 317, git-index.ts 396, git-refs.ts 197, git-routes.ts 395; the largest file of tests/server/core/git is git.test.ts at 618; `PaneView.svelte` 482, `Diff.svelte` 519, `Graph.svelte` 536. |
| 21 | DONE | Catalog keys in config/text/views/sources/repositories.yml, config/text/views/sessions/changes.yml and config/text/ui.yml; `HELP.md` sections 'Untracked files, ignoring and earlier versions', 'Repositories, closing and opening worktrees' and 'What oculus fixes'; `DESIGN.md:128` and a 'Fixed git choices' paragraph at :129; `DESIGN.md:371` and `HELP.md:44` for the float lock. | see below | `grep -n "no form carries" DESIGN.md` prints line 128; `grep -n "Fixed git choices" DESIGN.md` prints line 129; `grep -n "What oculus fixes" HELP.md` prints lines 187 and 213; the rename greps below print nothing. |

The greps and counts of the verify list, run in this turn:

```
$ grep -c "useConfigOnly" src/lib/server/git/git-write.ts
3
$ grep -rn -- "--force" src/lib/server/git
src/lib/server/git/deposit-git.ts:257:    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
$ ls src/lib/server/core | wc -l
       9
$ grep -rnE "core/git\.ts|core/git-parse|repositories/Worktrees|repositories/pick" src tests config HELP.md DESIGN.md README.md docs utils --exclude=local.yml --exclude-dir=diagrams
(no output)
$ grep -rn start_point src tests config --exclude=local.yml
(no output)
$ ! LC_ALL=C grep -rna "[^ -~]" src tests
(no output)
```

The `permitted` function now lives in `src/lib/server/core/paths.ts:22` and is imported by `git-compare.ts`, `git-routes.ts`, `git-remote.ts`, `git-refs.ts`, `git-reads.ts`, `git-write.ts` and `tests/server/git/git-write.test.ts`; `deleteBranch(root, name, roots)` is defined once (`git-refs.ts:172`) and called with that signature from `git-routes.ts:319` and `delete-branch.test.ts`; `grep -rn "git\.test\.ts" src tests` names `tests/server/core/git/git.test.ts` and `git-gate.test.ts` only where they exist.

## Every test file the step added or changed

Before is the run on the unchanged tree (LOADFAIL shown as 'file does not load'); after is the run in this turn, each file run alone through `npx vitest run <file> --reporter=json`. 61 files: 1996 passed, 0 failed.

| test file | on the unchanged tree | after |
|---|---|---|
| tests/checks/config/config-folder.test.ts | 2 failed / 24 passed | 26 passed / 0 failed |
| tests/checks/tree/boundaries.test.ts | new this round or added after the first run, so it has no first run | 11 passed / 0 failed |
| tests/checks/tree/duplication.test.ts | new this round or added after the first run, so it has no first run | 18 passed / 0 failed |
| tests/routes/git/refs.test.ts | 12 failed / 2 passed | 16 passed / 0 failed |
| tests/routes/git/untracked.test.ts | 4 failed / 4 passed | 8 passed / 0 failed |
| tests/routes/page.test.ts | 3 failed / 11 passed | 14 passed / 0 failed |
| tests/server/core/git/compare-gate.test.ts | new this round or added after the first run, so it has no first run | 4 passed / 0 failed |
| tests/server/core/git/compare.test.ts | file does not load | 24 passed / 0 failed |
| tests/server/core/git/git-gate.test.ts | new this round or added after the first run, so it has no first run | 6 passed / 0 failed |
| tests/server/core/git/git-parse.test.ts | file does not load | 8 passed / 0 failed |
| tests/server/core/git/git-reads.test.ts | file does not load | 35 passed / 0 failed |
| tests/server/core/git/git-ssh.test.ts | file does not load | 5 passed / 0 failed |
| tests/server/core/git/git.test.ts | file does not load | 38 passed / 0 failed |
| tests/server/core/git/head.test.ts | file does not load | 9 passed / 0 failed |
| tests/server/core/git/held.test.ts | file does not load | 5 passed / 0 failed |
| tests/server/git/git-write.test.ts | new this round or added after the first run, so it has no first run | 47 passed / 0 failed |
| tests/server/git/refs/cherry-pick.test.ts | file does not load | 6 passed / 0 failed |
| tests/server/git/refs/delete-branch.test.ts | 7 failed / 0 passed | 9 passed / 0 failed |
| tests/server/git/refs/detached.test.ts | 11 failed / 3 passed | 14 passed / 0 failed |
| tests/server/git/refs/identity.test.ts | 0 failed / 3 passed | 3 passed / 0 failed |
| tests/server/git/untracked/ignore.test.ts | 12 failed / 0 passed | 12 passed / 0 failed |
| tests/server/git/untracked/trash.test.ts | 12 failed / 0 passed | 14 passed / 0 failed |
| tests/server/root/watch/git/git-events.test.ts | 0 failed / 6 passed | 6 passed / 0 failed |
| tests/server/root/watch/git/git-workspaces.test.ts | 0 failed / 10 passed | 10 passed / 0 failed |
| tests/server/root/watch/git/git.test.ts | 0 failed / 23 passed | 23 passed / 0 failed |
| tests/server/root/watch/git/scan.test.ts | 2 failed / 2 passed | 4 passed / 0 failed |
| tests/shell/context-guard.test.ts | file does not load | 8 passed / 0 failed |
| tests/shell/panes/floats/float-geometry.test.ts | 0 failed / 27 passed | 27 passed / 0 failed |
| tests/shell/panes/floats/floatlayer.test.ts | 0 failed / 13 passed | 13 passed / 0 failed |
| tests/shell/panes/pane-strip-menu.test.ts | 9 failed / 9 passed | 26 passed / 0 failed |
| tests/shell/panes/strip/strip-render.test.ts | 5 failed / 3 passed | 8 passed / 0 failed |
| tests/shell/panes/strip/strip-shape.test.ts | file does not load | 11 passed / 0 failed |
| tests/state/client/writes.test.ts | new this round or added after the first run, so it has no first run | 31 passed / 0 failed |
| tests/state/sessions/source.test.ts | 4 failed / 48 passed | 52 passed / 0 failed |
| tests/state/shared/instance-state-sources.test.ts | new file or added after the first run, so it has no first run | 354 passed / 0 failed |
| tests/state/shared/words/appearance.test.ts | 21 failed / 121 passed | 142 passed / 0 failed |
| tests/state/shared/words/tones.test.ts | new file or added after the first run, so it has no first run | 99 passed / 0 failed |
| tests/state/sources/repositories/capabilities/open-worktree.test.ts | new this round or added after the first run, so it has no first run | 1 passed / 0 failed |
| tests/state/sources/repositories/capabilities/repositories-badge.test.ts | 7 failed / 1 passed | 8 passed / 0 failed |
| tests/state/sources/repositories/capabilities/store-actions.test.ts | file does not load | 20 passed / 0 failed |
| tests/state/sources/repositories/capabilities/store-wire.test.ts | new this round or added after the first run, so it has no first run | 2 passed / 0 failed |
| tests/state/sources/repositories/capabilities/view-state.test.ts | 10 failed / 0 passed | 10 passed / 0 failed |
| tests/state/sources/repositories/view/commit-action.test.ts | 0 failed / 11 passed | 11 passed / 0 failed |
| tests/state/sources/repositories/view/repositories.test.ts | new this round or added after the first run, so it has no first run | 48 passed / 0 failed |
| tests/state/workbench/layout/open/floats-store.test.ts | new this round or added after the first run, so it has no first run | 34 passed / 0 failed |
| tests/state/workbench/layout/open/floats.test.ts | new this round or added after the first run, so it has no first run | 42 passed / 0 failed |
| tests/state/workbench/layout/open/locked.test.ts | 24 failed / 2 passed | 26 passed / 0 failed |
| tests/state/workbench/layout/saved/layout-locked.test.ts | 3 failed / 2 passed | 5 passed / 0 failed |
| tests/state/workbench/rail-badges.test.ts | 0 failed / 103 passed | 103 passed / 0 failed |
| tests/state/workbench/ui.test.ts | new file or added after the first run, so it has no first run | 40 passed / 0 failed |
| tests/ui/menu/menu-words.test.ts | 2 failed / 1 passed | 3 passed / 0 failed |
| tests/ui/theme/wall.test.ts | new this round or added after the first run, so it has no first run | 4 passed / 0 failed |
| tests/views/sources/repositories/changes/change-rows.test.ts | 3 failed / 18 passed | 21 passed / 0 failed |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts | 9 failed / 3 passed | 12 passed / 0 failed |
| tests/views/sources/repositories/changes/tree-mode.test.ts | 0 failed / 30 passed | 30 passed / 0 failed |
| tests/views/sources/repositories/diff-pane.test.ts | 1 failed / 27 passed | 28 passed / 0 failed |
| tests/views/sources/repositories/graph-row.test.ts | new file or added after the first run, so it has no first run | 35 passed / 0 failed |
| tests/views/sources/repositories/graph/graph-picks.test.ts | new file or added after the first run, so it has no first run | 8 passed / 0 failed |
| tests/views/sources/repositories/menus/repositories-menu.test.ts | 25 failed / 7 passed | 36 passed / 0 failed |
| tests/views/sources/repositories/repositories.test.ts | 1 failed / 43 passed | 45 passed / 0 failed |
| tests/views/whole/type-scale.test.ts | new this round or added after the first run, so it has no first run | 278 passed / 0 failed |

Existing tests whose expectations changed, with the old and the new expectation:

| test | before | after |
|---|---|---|
| tests/views/sources/repositories/graph-row.test.ts | `row()` props had no `compare` or `ongraph`; `FACTS` had no `remotes` | props carry `compare` and `ongraph`; `FACTS` has `remotes: []` |
| tests/state/sources/repositories/view/repositories.test.ts | two expected view objects without `closed` | both carry `closed: []` |
| tests/state/sources/repositories/capabilities/view-state.test.ts | `closed: ['/b', 4]` read back as `closed: ['/b', 4]` | reads back as `['/b']` (the string survivors, as `collapsed` does) |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts | counted `data-entry=` rows (203); VirtualRows draws 13 under SSR | counts `data-cut=` rows (1) and checks the untracked group has none |
| tests/state/shared/instance-state-sources.test.ts | held-diff fixtures without `compare` and `workspace`; no `closed` | fixtures carry both; the repositories block reads `closed` |
| tests/ui/theme/wall.test.ts | no QuickPick entries | SOLID entries for `QuickPick.svelte .row.now` and `.row:hover` |
| tests/views/whole/type-scale.test.ts | `Worktrees.svelte` under `repositories/`; no QuickPick, no `.cut` | key moved to `refs/`; `ChangeGroups` has `.cut=fs-sm`; `ui/forms/choice/QuickPick.svelte` has `.heading=fs-xs | .row=fs-md` |
| tests/state/shared/words/tones.test.ts | the appearance key list without the two strip keys | thirteen keys, with `editor_actions` and `show_tabs` added |
| tests/shell/panes/pane-strip-menu.test.ts | `newNoteOpener` imported from `pane-view.ts`; no Lock Group on a float | imported from `state/workbench/layout/index.ts`; Lock Group and Unlock Group offered on a float, the two float menu lists carry `@ui.strip_lock` |
| tests/state/sessions/source.test.ts | `headTabState` imported from `sessions/source.svelte.ts` | imported from `state/sources/repositories/file-git.ts` |
| tests/routes/git/refs.test.ts and untracked.test.ts | each built its own POST request | both use `tests/routes/git/request.ts` (`gitPost`) |
| tests/state/sources/repositories/capabilities/store-actions.test.ts | `['cherryPick', { confirm: true }]`; the Open Worktree cases in one order | `['cherryPick', { ref: HASH, confirm: true }]`; the Files reveal comes before the new window |
| tests/views/sources/repositories/menus/repositories-menu.test.ts | the Trash question named the whole path or the count for a folder | names the base name, and the folder's name for a folder |
| tests/views/sources/repositories/graph/graph-picks.test.ts | a start-point field in the branch and tag prompts | name (and message) only; the start is the commit picked |
| tests/checks/tree/boundaries.test.ts | FROZEN list without the two new appearance names | adds `appearance.ts:tabBar` and `appearance.ts:actionsAt`, the same kind of entry as the existing `crt`, `codeTheme` and `terminal` |
| tests/checks/tree/allow-duplication.txt | five entries for the clones between `git.test.ts` and the git write tests | removed; the split leaves no such clone |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts, menus/repositories-menu.test.ts | twelve absences asserted with no reason above them (`tests/checks/tree/negatives.test.ts` failed) | each has a reason comment |
| tests/shell/context-guard.test.ts, tests/server/git/refs/repo.ts, tests/routes/git/refs.test.ts | lint errors (`delete`, a cast) | `Reflect.deleteProperty`, `as unknown`; lint exits 0 |

Every new case carries a `// Revert:` line naming the change that makes it fail, or sits in a group whose first case does, or is titled as an audit.

## Folder splits and moves

Each split keeps its folder at ten items or fewer.

- `src/lib/server/core/git.ts` and `git-parse.ts` moved to `src/lib/server/core/git/`, with the new `git-compare.ts` and `git-run.ts`; `server/core` holds 9 items; the rename greps above print nothing.
- `src/lib/shell/panes/` into `strip/` (PaneStrip.svelte, strip-shape.ts) and `leaf/` (FoldedPane.svelte, PageLeaf.svelte).
- `src/lib/views/sources/repositories/Worktrees.svelte` to `refs/Worktrees.svelte`, since `repositories/` held ten items.
- `QuickPick.svelte` and `quick-pick.ts` are in `src/lib/ui/forms/choice/`, not under `views/.../pick/`: a partial under `views/` that declares a wall surface is refused by `tests/views/whole/tinted.test.ts`.
- `src/lib/views/sources/repositories/graph/graph-picks.ts` split from `Graph.svelte`, which was 588 lines against the 540 line cap and is now 536.
- `src/lib/views/sources/repositories/diff/diff-reads.ts` split from `Diff.svelte` (now 519 lines).
- The key rows (`repositoryKeyRows`) moved from `state/sources/repositories/repositories.ts` to `change-tree.ts`.
- `src/lib/state/workbench/layout/open/new-note.ts` added and exported from `layout/index.ts`, because the shell may not import `state/life`.
- `tests/server/core/git/git.test.ts` split into `git.test.ts`, `git-gate.test.ts` and `git-fixture.ts` (ruling 14); `tests/server/core/git/compare-gate.test.ts` holds the gate over `git-compare.ts` and `git-run.ts`.
- Tests: `tests/views/sources/repositories/{changes,menus,graph}`, `tests/shell/panes/{floats,strip}`, `tests/server/core/git/`, `tests/server/root/watch/git/`.

## Beyond the path list and design points

- `git-run.ts` is an added file in `server/core/git/`; `cat-file` and `ls-files --stage` were added to the read forms (seventeen subcommands; `tests/server/core/git/compare-gate.test.ts` allows nine in `git-compare.ts` and `git-run.ts`).
- `permitted` moved from `git-write.ts` to `src/lib/server/core/paths.ts` so `git-compare.ts` (under `core/`) can use it without importing from `server/git`.
- `Ask.confirm` (`views/shared/ask.ts`, `AskConfirm.svelte`) and `views/sessions/changes/ChangesRepo.svelte` are outside the brief's path list: the Trash button needs a confirm label, and the session Changes panel draws `ChangeGroups`, which takes the held counts.
- `BadgeSelectors` in `rail-badges.svelte.ts` gained `gitRoots` and `gitFor`; the selectors store satisfies it structurally.
- `ui.setPaneStrip` (`state/workbench/ui.svelte.ts`) writes the two strip settings through the writes store, which the client context hands to `createUi`; the shell may not read the writes store itself.
- The outcome of a git write carries an optional `code` (`WriteAnswer.code` in `state/shared/stores/shapes.ts`, `Outcome.code` in `git-write.ts`); `SendOptions.asked` lists the codes a caller answers itself, for which the write store tells nothing. This is a wire field the page reads; it is added for `not-merged` only.
- A symbolic link in the repository that points to a path that cannot be resolved (a dangling link) is refused by Move to Trash, with the same message as a link that leaves the repository.
- Delete Anyway recognises git's refusal by the English text `is not fully merged`, with `LC_ALL=C` set on that one `-d` call; the page never matches text.
- With `editor_actions: hidden` the strip menu repeats Maximise or Restore, Fold and the two page lists of the pane menu (ruling 6); a pane that holds no tab has no Split items in the strip menu, as the pane menu's own splits do nothing there.
- The recorder of git calls in the gate tests is per test file: `git.test.ts` and `git-gate.test.ts` each hold the file's own calls to the allowed list.
- `sequenceOf` in the server reads `CHERRY_PICK_HEAD` with `existsSync`.
- The git scan also runs when the workspaces file changes.
- `ignore` is chained with the Files view's write chain like the Trash action.
- The session Changes panel's untracked rows have no Discard control; only the Repositories view has one.
- The Trash question for a folder uses the single-file wording of VS Code ("the following untracked file: 'dir'") with the folder's name, the strings VS Code uses for a resource of either kind.

## Before and after, the look

Not verified in a browser: I have no browser, so none of the rows below was looked at on a screen. "After" is what the item lists or components draw, read from the tests that render or list them; "before" is given only where the first run on the unchanged tree shows it, and says "not recorded" otherwise.

| item | before | after | shown by |
|---|---|---|---|
| Untracked row menu | not recorded | Open File, Stage Changes, Discard Changes, Add to .gitignore, Reveal in Explorer View | `repositories-menu.test.ts` |
| Untracked row inline controls | Open File, Stage | Open File, Discard (glyph `note_back`, tooltip 'Move this untracked file to the Trash'), Stage | `change-rows.test.ts`, `trash-and-cuts.test.ts` |
| Untracked folder row menu | Stage Changes only | Stage Changes, Discard Changes, Add to .gitignore | `repositories-menu.test.ts` |
| Untracked head | Stage All Untracked | Discard All Untracked Changes, then Stage All Untracked; the control is absent on an empty group | `repositories-menu.test.ts`, `trash-and-cuts.test.ts` |
| Trash question | none | "Are you sure you want to DELETE the following untracked file: 'x'?" (several: "Are you sure you want to DELETE the N untracked files?"), detail "You can restore this file from the Trash." (plural "these files"), button "Move to Trash" | `trash-and-cuts.test.ts` |
| Changes row menu | 5 items | Open Changes, Open File (HEAD), Open File, Stage Changes, Discard Changes, Add to .gitignore, Reveal in Explorer View; on a linked worktree Compare with Workspace last, after a rule | `repositories-menu.test.ts` |
| Staged row menu | not recorded | Open Changes, Open File (HEAD), Open File, Unstage Changes, Reveal in Explorer View | `repositories-menu.test.ts` |
| HEAD / Index tab | none | read-only source tab titled `<file> (HEAD)` for a Staged row or `<file> (Index)` for a Changes row, with the locked line | `source.test.ts`, `head.test.ts` |
| Compare with Workspace | none | diff pane of the main worktree's file against the linked worktree's, titled `<file> (Workspace)` | `compare.test.ts`, `diff-pane.test.ts` |
| Graph commit menu | not recorded | Open Changes, Copy Commit ID, Copy Commit Message, Checkout, Checkout (Detached), Create Branch..., Create Tag..., Delete Tag where tags exist, Cherry Pick, then Compare with Remote (upstream set), Compare with Merge Base (base known) and Compare with... | `repositories-menu.test.ts`, `graph-row.test.ts` |
| Compare diff tab | none | one diff pane over the files between the two refs, each file read when shown | `diff-pane.test.ts` |
| Cherry-pick banner | none | "Cherry-picking. N files are in conflict." with Abort and no Continue; Abort asks "Abort the cherry pick in progress?" | `trash-and-cuts.test.ts` |
| Branch name menu on the graph | not recorded | Checkout and Delete Branch for a local branch that is not checked out; none for the checked-out one | `repositories-menu.test.ts` |
| Remote branch name menu | no menu | Checkout (Detached) | `repositories-menu.test.ts` |
| Repository row menu | 2 items | adds Close Repository, and Close Other Repositories while more than one is listed | `repositories-menu.test.ts` |
| Reopen quick pick | none | titled Reopen Closed Repositories, placeholder "Pick a repository to reopen", one row per closed repository and "All Repositories" after a separator when more than one is closed | `repositories-menu.test.ts` lists the choices; the pick itself needs a DOM |
| Worktree row menu | not recorded | adds Open Worktree and Open Worktree in New Window | `repositories-menu.test.ts` |
| Strip menu on a page pane | 8 items | Open File..., New Text File, four splits, Float, Lock Group, Tab Bar and Editor Actions Position submenus, Close, New Terminal (12 items; Close is shown when the page has more than one pane) | `pane-strip-menu.test.ts` |
| Strip menu on an empty pane | 2 items | Open File..., New Text File, Lock Group, Tab Bar, Editor Actions Position, New Terminal | `pane-strip-menu.test.ts` |
| Locked pane | no lock | a lock glyph at the strip's right end, and Unlock Group in the menu | `strip-render.test.ts`, `pane-strip-menu.test.ts` |
| New Text File | none | a fresh scratch Note tab opened in that pane | `pane-strip-menu.test.ts` |
| `show_tabs` single / none | every tab drawn | single draws the active tab alone, none draws no tab and keeps a title row with the pane's actions | `strip-render.test.ts` |
| `editor_actions` hidden | not recorded | the split button and the menu opener are not drawn; a right click on the strip or an empty pane still opens the menu | `strip-render.test.ts` |
| Settings Appearance rows | none | Tab Bar and Editor Actions Position rows with choice controls (multiple / single / none, strip / hidden) | `config-folder.test.ts`, `tones.test.ts` |
| Rail badge | none on Repositories | the summed held count of merge, staged, changes and untracked over every repository | `repositories-badge.test.ts`, `rail-badges.test.ts` |
| Cut-list warning | none | a muted row "Too many changes were detected. Only the first 200 changes will be shown below." under a cut group in the Repositories view, and the same line in the session Changes panel | `trash-and-cuts.test.ts` |
| Scanned repository | only listed roots | a repository one folder below a root is also listed | `scan.test.ts` |
| Right click on a blank area | no page-wide handler | the browser's menu is cancelled | `context-guard.test.ts`, `routes/page.test.ts` |
| Right click in a Settings input, Monaco, the terminal | no page-wide handler | the control keeps its own menu (input, textarea, contenteditable, `.monaco-editor`, `[data-terminal]`) | `context-guard.test.ts` |
| Create Branch and Create Tag prompt on a commit | not recorded | Branch name (and Tag message) only; the ref starts at the commit picked | `graph-picks.test.ts` |
| Delete Branch in the Branches section | none | a Delete Branch control on each local branch except the checked-out one; the same question as the graph menu, and VS Code's second question "The branch '{0}' is not fully merged. Delete anyway?" when git refuses | `repositories.test.ts`, `repositories-menu.test.ts`, `graph-picks.test.ts` |
| Trash question | the whole path of the file, the count for a folder | the file's base name, and the folder's name for a folder | `repositories-menu.test.ts` |
| Strip menu on a float | docks, Return to Page, Tab Bar, Editor Actions Position, Close, New Terminal | the same with Lock Group (Unlock Group once locked) after the float items | `pane-strip-menu.test.ts` |
| Strip menu with `editor_actions: hidden` | Open File..., New Text File, splits, Lock Group, Tab Bar, Editor Actions Position, Close, New Terminal | also Maximise or Restore, Fold where it applies, and the page lists | `pane-strip-menu.test.ts` |
