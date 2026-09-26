Everything in the brief is done.

Open items at dispatch: S2 (where the composer's choices live), X3a (file icons, nesting, local history), X3c (pinned tabs, wrapped tabs); none touches X3b.

All work is in /Users/axelfaes/workspace/research-hub/.agents/worktrees/X3b/tools/oculus. No git command was run on the worktree.

## Checks

| # | Check | Result (quoted output) |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 319 passed (319)` and `Tests 5029 passed (5029)`, on two runs in a row after the last edit |
| 2 | `npm run check` | `COMPLETED 1438 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | `build=0` (exit code, measured with pipefail) |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | `lint=0` |
| 6 | ASCII perl gate | `0` lines |
| 7 | `sh bin/size-check.sh` / `sh bin/folder-check.sh` | `size=0` / `folder=0` |
| 8 | `npm run diagrams` twice | both exit 0; the shasum of `docs/diagrams/*` is identical after the second run |
| 9 | `npx playwright test`, whole suite | `397 passed (6.4m)`, `exit=0` |
| 10 | `node bin/revert-check.mjs` | unit, over all 29 changed or new unit test files: `276 reverts, 0 unproven` (the run before the last edits). Git files: `41 reverts, 0 unproven`, then `5 reverts, 0 unproven` for git-write.test.ts. After the last edits: repositories view test `37 reverts, 0 unproven, 0 unchecked`, git-reads test `14 reverts, 0 unproven, 0 unchecked`, `tests/browser/scm/diff.spec.ts` `6 reverts, 0 unproven, 0 unchecked`. Browser: see the note under the table |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | `0` |

The browser revert-check needs the note. Other builders' Playwright runs take port 8792 in the middle of a run, and when they do, cases come back as "the case did not run" (the log shows `EADDRINUSE 127.0.0.1:8792`). I reran it until every directive in the 13 changed browser specs had been proven red on an idle port.

Four rail directives never got a clean run through revert-check: `tokens.css:90`, `tokens.css:93`, `on-body.ts:14` and `RailEditor.svelte:67`. I proved those by hand. For each one, the script copies the tree to the scratchpad, applies the revert, builds, and runs the case. All four came back `failed`, meaning red (`scratchpad/rail-manual.sh`). No single run of the whole browser file list came out at 0 unproven.

The unchecked cases left in the changed files all exist unchanged in the main checkout. Every new or changed case has a directive; I checked this by comparing case names against the main checkout.

## Per item: proof (file:line and its revert)

Each line below is a case that revert-check or the manual run showed red.

1. **Repositories list**
   - `RepoList.svelte:71` and `:84` (views test "lists every root in the Repositories section", "says on each row its branch...").
   - `tests/browser/sources/repositories.spec.ts` "lists every root..." with `repo-shape.ts:18 => delete`.
2. **Commit box (Commit, Amend, Commit and Push, Commit and Sync), shared with ChangesRepo**
   - `repositories.svelte.ts:238` "commits, amends, and commits then pushes or syncs".
   - `ChangesRepo.svelte:106` "draws the one commit box the Repositories view draws".
   - Amend: `git-write.ts:250 => delete`, `:245 => if (false) {`.
3. **Hunk and line actions, and section heads**
   - Patches: `diff-patch.ts:51` and `:52`.
   - Apply: `git-index.ts:39 => unstage: ['--cached'],`, `:40 => revert: []`, and `git-write.ts:559` (drops `--recount`).
   - Heads: `repositories.svelte.ts:281` and `ChangeGroups.svelte:78`.
   - Browser: `Diff.svelte:215 => return;` and `DiffFile.svelte:159`.
4. **Pull, fetch, sync, publish**
   - `git-remote.ts:34`, `:52`, `:36`, `:33`, `:81` and `:31`, and `git-write.ts:579` (prune) and `:574` (the repository's own pull config).
   - Status bar: `RepoItems.svelte:75`, `:81` and `:92` (browser), `:54` and `:135` (unit).
5. **Diff**
   - Word marks: `diff-words.ts:112` and `:129`.
   - Folds: `diff-rows.ts:181` and `:206`.
   - Layouts: `Diff.svelte:246 => pressed={false}`.
   - Open File: `Diff.svelte:272`.
   - Alt+F5 and Shift+Alt+F5: `Diff.svelte:194 => return;` and `:196 => go(at + 1);`.
   - Sessions rows: `ChangeGroups.svelte:64`.
6. **Merge**
   - Merge editor: `merge-regions.ts:110`, `:141`, `:167` and `:216`.
   - Complete Merge: `Merge.svelte:130` (browser) and `:140`.
   - Abort: `git-index.ts:175`. Server side: `git-write.ts:518` and `git-index.ts:154` and `:146`.
7. **Stash**
   - `git-refs.ts:33`, `:65`, `:80` and `:82`.
   - `Stashes.svelte:51`.
   - Browser: `Repositories.svelte:202 => delete`.
8. **Tags**
   - `git-refs.ts:88` (name check) and `:108` (annotated tag).
   - `git-remote.ts:95` (Push Tags).
   - `Tags.svelte:46`.
   - Browser: `Repositories.svelte:218 => delete`.
9. **Graph**
   - Lanes: `graph-lanes.ts:61`, `:68` and `:40`.
   - Page and Load More: `git.ts:260`.
   - Incoming: `git.ts:261` and `Graph.svelte:222 => {#if false}`.
   - Subjects: `Graph.svelte:152 => label={one.short}`.
10. **Blame**
    - `file-git.ts:110` (Not Committed Yet) and `:148`.
    - Toggle: `Source.svelte:340` (browser).
    - Status item: `SourceItems.svelte:117`.
    - Opening in the graph: `repositories.svelte.ts:347`.
11. **Gutter marks**
    - `file-git.ts:127`.
    - Opening the diff: `Gutter.svelte:90` (browser).

## Changes made since the last check run
- **Alt+F5 test and defect.** No test covered Alt+F5, so I added "moves to the next change by Alt+F5 and back by Shift+Alt+F5" to `tests/browser/scm/diff.spec.ts`. It found a defect: the diff pane marked the last change as current as soon as it opened, because `at` starts at -1 and `changes.at(-1)` is the last element. The fix is `Diff.svelte:174`, `const shownAt = $derived(at >= 0 ? changes.at(at) : undefined);`, used at `:322`. The check that fails without the fix is that case under `revert: Diff.svelte:174 => const shownAt = $derived(changes.at(at));` (red).
- **Git test directives.** I added revert directives to the 41 new cases in `git-ops.test.ts`, `routes/git/git.test.ts` and `git-write.test.ts`.
- **Gate cases now hold when run alone.** The gate cases that assert on everything the file ran now run a write of their own first, so they pass when run alone:
  - `git-ops.test.ts`: a sync, reverted by `git-write.ts:569`, which adds `--force` to the push.
  - `git-write.test.ts`: a stage, reverted by `git-write.ts:550`.
- **Weak routes test removed.** I removed the routes case "carries the amend with the commit". It only checked that the mocked runner received the field. The real mapping, `git-routes.ts:189`, is now proven inside the endpoint case of `git-ops.test.ts`.
- **Graph test timeout.** The graph-page case in `git-reads.test.ts` timed out under load because it made 51 commits, one process each. It now makes them in one `git fast-import` run.
- **Directives moved by my token, glyph and icon insertions.** These pointed at the wrong line after my insertions; I re-pointed them, and each was proven red afterwards:
  - `rail.spec.ts:150` and `:699`
  - `bar.spec.ts:23`
  - `show-in-files.spec.ts:88`
  - `status-bar.test.ts:273`
  - `config-folder.test.ts:494` and `:519`
  - `duplication.test.ts:266`

## Command lists (tests/server/git/allowed.ts)
- **Writes:** add, apply, branch, check-ref-format, commit, diff, fetch, merge, merge-base, pull, push, rebase, remote, restore, rev-parse, stash, status, switch, tag, worktree. Each has one call site in `git-write.ts`, and no form carries `--force`. The gates in `git-write.test.ts` and `git-ops.test.ts` check every vector the suite ran.
- **Reads:** DESIGN.md:128 lists every read form, including log pages, blame, `diff -U0`, the stash diff, `show :1/2/3:`, the commit files, the tags and the stashes.

## Files (line counts, from `wc -l`)
- **New server modules:** `git-index.ts` 194, `git-reads.ts` 154, `git-refs.ts` 121, `git-remote.ts` 96.
- **Changed server modules:** `git-write.ts` 699, `git-routes.ts` 291.
- **State (`state/sources/repositories/`):** `repositories.ts` 465, `repositories.svelte.ts` 351, `diff-rows.ts` 284, `merge-regions.ts` 224, `file-git.ts` 152, `diff-words.ts` 132, `diff-patch.ts` 76, `graph-lanes.ts` 75.
- **Views, diff and graph:** `Diff.svelte` 388, `DiffFile.svelte` 381, `Graph.svelte` 308, `Lanes.svelte` 71, `CommitFiles.svelte` 87.
- **Views, merge and refs:** `Merge.svelte` 242, `MergeSide.svelte` 177, `Stashes.svelte` 98, `Tags.svelte` 83.
- **Views, Repositories:** `Repositories.svelte` 335, `Repo.svelte` 279, `RepoList.svelte` 107.
- **Other views:** `CommitBox.svelte` 179, `Gutter.svelte` 194, `Source.svelte` 421.
- **Status bar:** `RepoItems.svelte` 172, `SourceItems.svelte` 193.
- **Shared controls:** `Prompt.svelte` 173, `AskConfirm.svelte` 36.
- **Tests:**
  - `tests/browser/scm/`: diff 133, history 93, merge 67, refs 66, scm.ts 102.
  - Server: `git-ops.test.ts` 675, `git-reads.test.ts` 273.
  - State and views: repositories state test 864, repositories views test 708.

Every file is under 900 lines and every component under 540 (size-check exit 0).

## Paths outside the brief
- `data/model/index.ts`, `model-sessions.ts`
- `state/client/context.ts`
- `state/sessions/source.svelte.ts`
- `state/workbench/navigation/status.ts`, `editor-status.svelte.ts`
- `shell/status/SourceItems.svelte`, `status-items.ts`
- `ui/forms/Prompt.svelte`, `prompt.ts`, `TextArea.svelte`
- `views/shared/AskConfirm.svelte`, `ask.ts`
- `views/boards/deposit/Deposit.svelte`
- `views/system/status/Status.svelte` (import path only)
- `routes/+page.svelte`
- `config/text/views/sources/source.yml`
- `themes/tokens.css`, and `themes.css` (the seven `--c-scm-*` tokens in all 16 colour themes)
- `tests/server/root/watch/repos.ts`
- `tests/checks/tree/allow-duplication.txt` (7 entries removed, because the duplications they allowed are gone)
- the re-pointed directives listed above

## Judgment calls
- The Editor draws its line numbers through Gutter.
- The status bar sync item runs the sync itself rather than opening Repositories.
- Blame is of the saved file.
- A changed word is filled with the hue and drawn in its on-colour; the `-bg` tint is 20% of the hue.
- Prompt moved to `ui/forms`.
- A deletion at the end of the file draws its wedge at the foot.
- Pull uses the repository's own configuration, so git refuses a pull of a divergent branch that has no pull config.
- The graph skips its read for a repository with no commit.
- The diff pane starts with no change current until Alt+F5 or Next Change moves to one.

## Before and after, visible
- **Repositories view.** Before: a list of changed files and branches. After: VS Code's Source Control layout:
  - a Repositories list;
  - the commit box with its four ways;
  - Merge Changes, Staged, Changes and Untracked, each with head actions;
  - Graph, Stashes, Tags, Branches and Worktrees;
  - the `...` menu with the remote, stash and tag actions.
- **Diff.** Before: a single inline pane. After: side-by-side or inline, with word marks, folds, change navigation, Open File, and hunk and line actions.
- **Source tab.** New gutter marks, a Blame toggle, and a blame status item.
- **Status bar.** Publish Branch, and a sync that pulls and then pushes.

## Problems I know of
- Browser revert-check results are unreliable while other builders use port 8792. Cases that the port clash stops from running are reported as unproven. This comes from the shared port, not from these changes.
- One earlier full vitest run had a single timeout (the graph-page case). That is now fixed, and the following runs were clean.

## Wrong in the brief
Nothing found.

## Repair round 1, the builder's report

All sixteen findings of repair round 1 are fixed in .agents/worktrees/X3b/tools/oculus, and each fix is proven red by revert-check.

**NOT done / not clean**
- `node bin/revert-check.mjs` over the 51 changed test files exits 1. Every directive is red (479 reverts, 0 unproven), but 353 cases are unchecked. They sit in the files X3b touched and carry no directive.
  - I compared each case with X3b's diff and main's copy. That check found five cases X3b had changed or added without a directive, and they now have one. The other unchecked cases are not ones X3b changed.
  - rail.spec.ts has 3 unchecked cases. main holds them unchanged.
- The full Playwright run in the verification script had 1 failure: boards/collection.spec.ts:130 "+ subtask adds a line and done ticks it". X3b does not touch that file (`cmp` with main: same). Its reruns:
  - alone, 5 of 5 passed;
  - the boards folder, 3 runs of 50 of 50;
  - the full suite again on a free port, 430 passed (lines below).
- Outside this brief: `grep -rn "<button\b" src/lib/views | wc -l` gives 14 raw buttons in 10 files outside the Source Control folders. The new gate tests/checks/source/controls.test.ts covers only sources/repositories, sources/source, shared/changes and sessions/changes.

Open items at dispatch: S2 (where the composer's choices live), X3a (file icons, nesting, local history), X3c (pinned tabs, wrapped tabs); none touches X3b.

**New test-harness knob, internal:** `OCULUS_BROWSER_PORT`.
- It is read by `layerPort()` in tests/browser/helpers/layer.ts:28, used by playwright.config.ts:22 and tests/browser/helpers/serve.ts:48.
- The default is still 8792. revert-check sets it to a free port per case run.
- Nothing outside the browser test layer reads it.

## Findings

**1. Unlisted controls.** Kept. What each one does:
- **Continue Rebase:** shown in the sequence bar while a rebase is stopped and nothing is unmerged. After a confirm it runs `git rebase --continue` under `GIT_EDITOR=true`.
  - Pressed in conflicts.spec.ts "carries a rebase on once its conflict is resolved", directive `Repo.svelte:108 => delete`.
- **Mark Resolved:** a row control on each Merge Changes row, in the Repositories view and the sessions Changes panel. It runs `git add -- <path>`, and git records a deletion that way too. A path that is not in conflict is refused: git-index.ts:213-214.
  - Pressed in conflicts.spec.ts "marks every conflict of a deletion resolved", directive `Changes.svelte:238 => ? undefined`.
  - Pressed in views/changes.spec.ts, directive `ChangeGroups.svelte:151`.
- **Tag row:** opens its commit in the Graph. It runs no git write, only the graph page read.
  - refs.spec.ts, directive `refs/Tags.svelte:55`.

**2. Deletions in a merge**
- git-index.ts:
  - `DELETIONS = ['DD','DU','UD']` at :160;
  - `acceptDeletion` at :183, which checks the pair at :192 and runs `git rm --quiet -- <path>` at :195;
  - `markResolved` at :204, with the refusal at :214 and `add` at :217.
- git-write.ts:554 is `removeIn`, the one `rm` call site. tests/server/git/allowed.ts:23 lists `'rm'`.
- git-routes.ts: the actions at :80-81; `acceptDeletion` asks for a confirm (:114); the handlers at :212-214.
- core/git.ts:371-377: `mergeSides` returns `deleted`, and a path not in conflict is refused at :372.
- merge-regions.ts:231: `takesDeletion`.
- Merge.svelte:
  - Complete Merge takes the deletion at :134;
  - `takeDeletion` at :141-143;
  - Accept Deletion and the note at :156 and :180.
- Unit cases in git-ops.test.ts:
  - DD, DU and UD each take the deletion: `git-index.ts:195 => return {ok:true...}`;
  - UU is refused: `:192 => if (false) {`;
  - Mark Resolved leaves `git ls-files -u` empty: `:217`;
  - a path not in conflict is refused: `:214`.
- Other unit cases:
  - git-reads.test.ts: `git.ts:371`, `:372`, `:374`;
  - merge.test.ts: `merge-regions.ts:231` (2 directives);
  - routes git.test.ts: `git-routes.ts:114`, `:214`.
- Browser cases in conflicts.spec.ts:
  - DD by Complete Merge: `Merge.svelte:134 => if (false) {`;
  - DU by Accept Deletion: `:143 => done = true;`;
  - UD keeping Current: `:156 => {#if false}`.

**3. Cap case.** git.test.ts "cuts every list it publishes at the cap" feeds more than the cap through every list. Directives:
- `git.ts:493` twice (branches, tags);
- `:502` (stashes);
- `:508` (remotes);
- `:549` (worktrees).

**4. Browser presses.** Each case asserts git state, the tab opened or the clipboard text.

| Press | Spec | Directive |
|---|---|---|
| Pull from the menu | commit.spec.ts | `Repositories.svelte:160` |
| Commit (Amend) | commit.spec.ts | `CommitBox.svelte:140` |
| Commit and Push | commit.spec.ts | `repositories.svelte.ts:245` |
| Commit and Sync | commit.spec.ts | `repositories.svelte.ts:246` |
| Ctrl+Enter | commit.spec.ts | `CommitBox.svelte:104` |
| Stage All, Stage All Untracked, Unstage All | commit.spec.ts | `Changes.svelte:142`, `:151`, `:125` |
| Discard All | commit.spec.ts | `Changes.svelte:90` |
| Revert block | diff.spec.ts | `Diff.svelte:234`, `DiffFile.svelte:178` |
| Revert lines | diff.spec.ts | `Diff.svelte:226` |
| Inline toggle | diff.spec.ts | `Diff.svelte:268` |
| Open File, at the current change and at the top | diff.spec.ts | `Diff.svelte:243`, `:246` |
| Abort Merge | conflicts.spec.ts | `Repo.svelte:102` |
| Continue Rebase | conflicts.spec.ts | `Repo.svelte:108` |
| Mark Resolved | conflicts.spec.ts | `Changes.svelte:238` |
| Stash Apply, Drop, View | refs.spec.ts | `Stashes.svelte:72`, `:88`, `:60` |
| Delete Tag | refs.spec.ts | `Tags.svelte:26` |
| Push Tags | refs.spec.ts | `Repositories.svelte:151` |
| Load More | history.spec.ts | `Graph.svelte:284` |
| A commit's file opening its diff | history.spec.ts | `CommitFiles.svelte:90` |
| Arrow keys to a commit's files | history.spec.ts | `Graph.svelte:101` |
| Copy Commit ID and Copy Commit Message | history.spec.ts | `Graph.svelte:146` |
| A sessions Changes row opening the diff | views/changes.spec.ts | `ChangeGroups.svelte:137` |

**Discard All test-helper fix.** The case failed about 1 run in 3. The cause: its own `git status` poll took `.git/index.lock` while the server's `git restore` ran. I found this with a git shim that timestamps every call.
- tests/browser/helpers/git.ts:27 now runs every spec git command with `--no-optional-locks`.
- The case holding it is layer.test.ts "leaves the index as it was", directive `helpers/git.ts:27 => delete`.
- After the fix, Discard All passes in all three full browser-suite runs.

**5. rail.spec.** 27 directives red in the final revert-check. Among them:
- `RailEditor.svelte:67`;
- `tokens.css:90` and `:93`;
- `RailPages.svelte:268`: the :554 case asserts the 9 px size, so the `var(--fs-sm)` revert turns it red.

Cause of "did not run" and false green: every case run shared port 8792 with other runs of the browser layer. When two runs passed the port check at the same moment, the losing server died and its Playwright tested the winner's build. That gave four false greens (rail.spec ×3, notices.spec ×1); by hand, each of the four is red.
- Fix: bin/revert-check.mjs gives each case run a free port.
  - `freePort()` at :286-290;
  - `browserEnv()` at :293-295;
  - run again on a new port if the server found it taken: :381-389.
  - The head comment is rewritten.
- Cases in revert-check.test.ts: `revert-check.mjs:289 => return 0;` and `:294 => ...` (no port).
- Cases in layer.test.ts: `layer.ts:29`, `playwright.config.ts:22`, `serve.ts:48`.
- The 20 older directives in revert-check.test.ts are re-pointed by content to the lines they name now.

**6. core/git.ts.** 495 lines on main, 792 now. It gained:
- the on-demand reads: graph page, commit files and diff, blame, line marks, merge sides with `deleted`, stash diff;
- `pathInside`;
- the merge and rebase sequence read;
- the conflicted list;
- the capped refs, stash, remote and worktree lists;
- the one `for-each-ref` refs read;
- a stash reflog read only when a stash exists;
- a `remote` read only for a branch with no upstream.

**7. Deposit.svelte.** The orphan doc comment of the removed `type Ask` is gone.

**8. Raw buttons.**
- ToolButton.svelte gains a `cell` variant (`named` at :127, the attribute spread at :164, `:not(.cell)` in the rice rule).
- DiffFile.svelte:122 and Gutter.svelte:70 and :91 use `<ToolButton cell>`.
- The gate tests/checks/source/controls.test.ts has directives `Gutter.svelte:70`, `:91`, `DiffFile.svelte:122`.
- primitives.test.ts has directives `ToolButton.svelte:127`, `:164`.

**9. git-write.ts head comment.**
- The stash line (:30) uses `--message=<text>`.
- The rev-parse lines (:25-26) list `--abbrev-ref`, `--verify --quiet MERGE_HEAD` and `--git-path`.
- An `rm` line is added.

**10. Load sequence guard.** Diff.svelte:128 `if (mine !== asked) return;`, with a second check in the catch branch. Case in diff.spec.ts "an older read landing late", `Diff.svelte:128 => delete`.

**11. Open File with no change current.**
- Diff.svelte:185 `shownAt` is `undefined` at `at = -1`, and `openLine` uses it at :243. With no current change it opens the file's first line (:246).
- Cases: `Diff.svelte:185`, `:243`, `:246`.

**12. Previous and Next from no current change.**
- diff-rows.ts:292-294 `stepChange`: Previous goes to n-1 and Next to 0.
- Unit directives: `diff-rows.ts:292`, `:293`, `:294`.
- Browser directives: `Diff.svelte:207`, `:276`.

**13. Chosen lines after a re-read.**
- Diff.svelte:141 `if (next !== text) chosen = {};`.
- The case changes the file on disk and asserts that Stage of the dropped choice stages the whole hunk, not other rows. Directive `Diff.svelte:141 => delete`.

**14. Sessions Changes panel, as the reader sees it now.**
- The commit box sits above the groups. Its Commit button has a list: Commit, Commit (Amend), Commit and Push, Commit and Sync.
- The group heads carry Stage All, Unstage All, Discard All (after a confirm) and Stage All Untracked.
- A Merge Changes group lists the conflicted paths, each with Mark Resolved.
- Each row opens its diff beside the panel, and has Open File.
- The git commands are the Repositories view's own, through the same store.

**15. Cost of one root read.**
- Subprocess counts, from the PATH shim `shim/git` with `count.mjs`:

  | Repository | Before | After | What changed |
  |---|---|---|---|
  | With an upstream | 8 | 8 | `branch` replaced by one `for-each-ref` |
  | With no upstream | 8 | 9 | `remote`, which Publish Branch needs |

  A kept stash adds `log --walk-reflogs`.
- Timings from `node measure.mjs <module> measure-up 30`, interleaved, at load average 18 to 25:

  | Run | Before, mean (sd) | After, mean (sd) |
  |---|---|---|
  | 1 | 69.3 ms (25.2) | 76.8 ms (26.5) |
  | 2 | 71.3 ms (23.3) | 78.8 ms (30.6) |
  | 3 | 127.9 ms (108.1) | 88.1 ms (40.1) |

  The differences are within one standard deviation.
- The watch count cases in root/watch/git.test.ts are 9 commands, directive `git.ts:421 => delete`.

**16. Stash Staged on old git.**
- `git --version` gives `git version 2.49.0`.
- git-refs.ts:72-76 refuses with "this git is older than 2.35, the first git that stashes only what is staged". The test that recognises git's error is `stagedUnknown` at :81-83.
- The case uses a shim git in git-ops.test.ts, directives `git-refs.ts:82 => return false;` and `:72 => if (false) {`.
- HELP.md notes that Stash Staged needs git 2.35.

**Directive fixes in older X3b cases**
- git-reads.test.ts: `git.ts:604` (was 595).
- git-reads.test.ts: "refuses a path outside" now asserts `pathInside` directly, so `git.ts:229 => return true;` turns it red.
- git-ops.test.ts, the stash refusal case: asserts "not a way to stash", with `git-refs.ts:62`, `:65`, `:94`.
- repositories.spec.ts, four cases X3b changed:
  - `repositories.ts:210`;
  - `Repo.svelte:133`;
  - `Repo.svelte:169` (the prose comment's path is corrected to Repo.svelte);
  - `TreeView.svelte:45`.

**Line counts, main to now:**

| File | Main | Now |
|---|---|---|
| core/git.ts | 495 | 792 |
| git-parse.ts | 86 | 315 |
| git-index.ts | new | 257 |
| git-write.ts | 543 | 712 |
| git-refs.ts | new | 136 |
| git-routes.ts | 303 | 300 |
| Diff.svelte | new | 402 |
| DiffFile.svelte | new | 380 |
| Gutter.svelte | new | 184 |
| ToolButton.svelte | 339 | 386 |
| Merge.svelte | new | 290 |
| Graph.svelte | new | 318 |
| CommitFiles.svelte | new | 107 |
| diff-rows.ts | new | 295 |
| merge-regions.ts | new | 232 |
| bin/revert-check.mjs | 516 | 545 |
| playwright.config.ts | 38 | 46 |
| tests/browser/helpers/git.ts | 30 | 52 |

## Verification, verbatim

This is the last run, over the final tree; no file changed after it.

```
== vitest
 Test Files  320 passed (320)
      Tests  5052 passed (5052)
== check
1790438737079 COMPLETED 1442 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
== build
build exit 0
== format
All matched files use Prettier code style!
== lint
lint exit 0
== ascii
ascii exit 0
== size/folder
size 0
folder 0
== diagrams
first e2517c24908a51ae28239c9aa1d09ab5ab00ef90  -
second e2517c24908a51ae28239c9aa1d09ab5ab00ef90  -
== build
build exit 0
== playwright   (port 8792, after three consecutive lsof misses)
  1 failed
    [chrome] › tests/browser/boards/collection.spec.ts:130:1 › + subtask adds a line and done ticks it
  429 passed (8.8m)
playwright exit 1
== revert-check   (the 50 changed test files plus tests/browser/shell/layer.test.ts)
revert-check exit 1
479 reverts, 0 unproven, 353 unchecked
```

The collection case alone, `npx playwright test tests/browser/boards/collection.spec.ts -g "subtask adds a line"`, 5 times: `1 passed (5.8s)`, `1 passed (4.2s)`, `1 passed (4.0s)`, `1 passed (4.1s)`, `1 passed (4.2s)`.

`npx playwright test tests/browser/boards/`, 3 times: `50 passed (48.0s)`, `50 passed (50.2s)`, `50 passed (52.3s)`.

The full suite again, `OCULUS_BROWSER_PORT=64347 npx playwright test`:
```
  430 passed (8.7m)
exit 0
```

**Scratch left behind:**
- `pre2/`, `shim2/` and several `*.txt` logs in the scratchpad;
- `test-results/` in the worktree, from the failing run.

No git command was run on the repository, nothing was written under .scratch, and port 8787 was not used.
