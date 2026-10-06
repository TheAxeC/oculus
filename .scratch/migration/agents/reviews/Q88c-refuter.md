# Step Q88c refuter report (on .agents/worktrees/Q88c, base 5cf40f03)

Pages this report cites are named with their section. Findings in code keep `file:line`. Paths are relative to `tools/oculus` in the worktree. Nothing was changed or written by the reviewer. The only git commands run were `git diff 5cf40f03` and `git status --short`. No part of `config/local.yml` was opened, and no port or dev server was touched.

## Headline

Two items of the brief do not work end to end: Cherry Pick (item 9), because the page sends a field the server does not read, and Delete Branch in the Branches section (item 11), which has no control. Items 4, 6, 12, 14 and 21 each have a defect named below. Everything else in the brief holds on the reads and reruns listed.

## Verification (rerun by the reviewer)

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, run from the worktree's `tools/oculus` with node v24.21.0 first on PATH. Exit status 0. The lines it printed:

```
$ npm test
 Test Files  458 passed | 22 skipped (480)
      Tests  11738 passed | 621 skipped (12359)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  444 passed | 9 skipped (453)
$ npm run check
... COMPLETED 3015 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Separate runs:

- `npm run build`, `npm run lint` and `npm run check` each exit 0 (`build exit 0`, `lint exit 0`, `check exit 0`).
- `grep -c useConfigOnly src/lib/server/git/git-write.ts` prints `3`.
- `grep -rn -- "--force" src/lib/server/git` prints `src/lib/server/git/deposit-git.ts:257:    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);`. The brief expects no output. See finding 2.1.
- `wc -l` over `src/lib/server/core/git/*.ts src/lib/server/git/*.ts` prints a largest file of 837 lines (`core/git/git.ts`), then 828 (`server/git/deposit.ts`), then 799 (`git-write.ts`). `wc -l src/lib/shell/panes/PaneView.svelte` prints 489. `ls src/lib/server/core | wc -l` prints 9. `tests/server/core/git/git.test.ts` is 899 lines.
- Folders at ten items after the step: `src/lib/server/git`, `src/lib/shell/panes`, `src/lib/state/sources/repositories`, `tests/server/git`, `tests/shell/panes`, `tests/views/sources/repositories`. None holds more than ten. `src/lib/views/sources/repositories` holds 9.
- `diff` of the base `tests/server/core/git.test.ts` against `tests/server/core/git/git.test.ts` prints only import-path lines and re-wrapped "Revert:" comment lines, plus the header comment's path. No assertion changed.

Observation about load: one earlier checks.sh run, at load average about 18, printed six 5000 ms timeouts in `npm test`. Those timeouts were in four test files, which passed alone (4 files, 55 tests). Two later full runs, at load about 14, passed without a timeout. I did not re-identify which files timed out, so I do not say whether the step changed them. The git-running cases are sensitive to machine load.

## Judgments on the points the builder admits

- checks.sh never printed the pass line (report "NOT done" 1): the pass line is printed on the tree as it stands (output above). The builder's stop was `tests/server/core/git/git.test.ts` at 901 lines; it is now 899. The report could not quote the line, which the brief requires. The tree is fine, and the report's first line is out of date against it.
- The `--force` grep hitting `deposit-git.ts:257` (report "NOT done" 2): the hit is not introduced by this step. The line is the deposit snapshot push, and the brief's expected output is wrong on its premise. The builder is right that no Q88c form carries it. Finding 2.1 covers the new sentence that says otherwise.
- Heavy git cases timing out in a batch: load related, see above. No code defect found.
- Five test files with no unchanged-tree run (`graph/graph-picks.test.ts`, `state/workbench/ui.test.ts`, `views/sources/repositories/graph-row.test.ts`, `state/shared/instance-state-sources.test.ts`, `state/shared/words/tones.test.ts`): brief verify item 4 asks for the run where it can run there. Three of the five (the last three) are preserved-behaviour files for which it could. I cannot run them on the base either, since my git commands are limited. Finding 2.2.
- Files changed outside the path list: finding 3.5.

## Verdicts

Items of "What to build":

- 1 (Discard on untracked, `trashUntracked`): violated in one point. The menus, the head, the inline control, the guard, the tracked-path refusal and the folder-as-one case are built and tested (`tests/server/git/untracked/`, `tests/routes/git/untracked.test.ts`). A leaf that is a symbolic link out of the repository is not refused (finding 1.2). The question names the repository-relative path where VS Code names the file (finding 4.4).
- 2 (Add to .gitignore): holds. `git-index.ts` `addToGitignore`/`appendIgnored` read in full: relative path, `\` to `/`, `[` escaped, no deduplication, line ending kept, atomic write, symlink refused.
- 3 (Open File (HEAD)): holds. See finding 3.2 for a duplicated rule.
- 4 (Compare with Workspace): violated in one point. The main worktree is not checked with `permitted` (finding 1.3).
- 5 (Close Repository, Close Others, Reopen): holds on the list and the quick-pick items. The pick itself needs a DOM and is not verifiable (see "Declined to judge").
- 6 (Open Worktree, in New Window): violated in one point. The new window gets the page's address with no Files reveal at the worktree's folder (finding 1.4).
- 7 (Checkout (Detached)): holds. `checkoutDetached` is sent as `{ ref }` and read as `fields.ref` (`git-routes.ts:308`).
- 8 (Create Branch/Tag from a commit): holds. Finding 4.3 notes an added field.
- 9 (Cherry Pick): violated (finding 1.1).
- 10 (Compare with Remote, Merge Base, with...): holds. `git-compare.ts` read in full.
- 11 (Delete Branch): violated in one point. No Delete Branch control exists in the Branches section (finding 1.5). The graph menu and the server action hold.
- 12 (Lock Group): holds on the pane of a page. Floats cannot be locked (finding 4.2).
- 13 (New Text File): holds.
- 14 (Tab Bar, Editor Actions Position): violated in one point. Under `editor_actions: hidden` the pane menu's items beyond the strip menu are unreachable (finding 1.6).
- 15 (page-wide handler): holds. See finding 2.3.
- 16 (`user.useConfigOnly` through env): holds. `grep -c useConfigOnly git-write.ts` prints 3; the vector is unchanged.
- 17 (200-entry cut said): holds.
- 18 (rail count): holds.
- 19 (repositories one folder deep): holds.
- 20 (module split): holds. `server/core` holds 9 items, `core/git/` holds 4, importers are updated, and the moved test differs from the base only in paths and comments.
- 21 (words and docs): violated in two points (findings 1.7 and 2.1).

Cases:

- 1: met, by the untracked tests and the route test. The symlink leaf is not a case of the brief and is finding 1.2.
- 2: met, by the `addToGitignore` tests and the read of the code.
- 3: met.
- 4: met for the diff sides. The `permitted` check is not part of the case (finding 1.3).
- 5: partial. The list, the separator, "All Repositories" and the per-tab state are met; the quick pick pick is not verifiable.
- 6: partial. The root is added and the Files view shows the folder in the current window; the new window does not reveal it (finding 1.4).
- 7: met.
- 8: met.
- 9: unmet through the page (finding 1.1). Met when the server action is called with `ref`, which is all the unit test does.
- 10: met.
- 11: partial. The graph menu and the server meet it; the Branches section has no control (finding 1.5).
- 12: met on a page pane. Floats are outside the pane menu's Lock Group (finding 4.2).
- 13: met.
- 14: partial (finding 1.6). Single, none, the vocabulary fallback and the Tab Bar writes are met.
- 15: met.
- 16: met.
- 17: met.
- 18: met.
- 19: met.
- 20: met. `trashUntracked`, `cherryPick`, `checkoutDetached` and `deleteBranch` are in `CONFIRMED`. The route test for a name starting with `-` posts `{ action: 'deleteBranch', name: '-D' }` and the other refusals.
- 21: met. The changed tests are named in the builder's report with before and after, and the moved `git.test.ts` differs only in paths and comments.

## 1. Spec

1.1 Cherry Pick sends the wrong field name. `src/lib/state/sources/repositories/repositories.svelte.ts:340-341`: "async cherryPick(root, hash) { await act(root, 'cherryPick', { hash }, true); }". The server reads `src/lib/server/git/git-routes.ts:307`: "cherryPick: (root, fields, roots) => cherryPick(root, fields.ref, roots),". `checkoutDetached` on the same table sends `{ ref }` (`repositories.svelte.ts:339`), so the two actions differ. Nothing in `src/routes/api/(git)/git/+server.ts` renames `hash` to `ref` (`gitBodyShape` carries `ref`). The store test pins the mistake: `tests/state/sources/repositories/capabilities/store-actions.test.ts` expects `['cherryPick', { hash: HASH, confirm: true }]`, while the route and server tests post `ref` (`tests/routes/git/refs.test.ts:122`). No test runs the store against the route, so every test is green. Failure scenario: a reader right-clicks a graph commit and picks Cherry Pick, confirms, and the server receives no `ref`, so the action is refused or does nothing. The conflict banner and Abort path, which the page builds, are never reached from the page. Verdict: item 9 violated, case 9 unmet through the page. The fix is one field name in the store and its test.

1.2 `trashUntracked` resolves the parent folder only. `src/lib/server/git/git-index.ts:300`: "const folder = realPath(dirname(join(root, bare)));", then `items.push({ path, real: join(folder, basename(bare)) })`. The brief: "a path whose real path leaves it ... refused before the Trash is called". An untracked symbolic link inside the repository that points outside it passes: the link itself, not its target, goes to the Trash. Failure scenario: the Trash receives the link; the target is untouched, so nothing is lost, but the refusal the brief names does not happen, and the report does not list the difference. Verdict: item 1 violated in this point.

1.3 Compare with Workspace does not check the main worktree with `permitted`. `src/lib/server/core/git/git-compare.ts:332-334`: "const main = listed.at(0)?.path; ... if (realOf(main) === realOf(root)) return refused('this is the main worktree');". The brief: "the main worktree is `GitState.worktrees[0]`, checked with `permitted`, `pathInside` and its real path". `git-reads.ts` checks `permitted` on the request's root only. Failure scenario: a linked worktree of a repository whose main worktree is outside the published roots is read from disk at the same relative path, and its text is returned. Verdict: item 4 violated in this point.

1.4 Open Worktree in New Window does not reveal the folder. `src/lib/state/sources/repositories/repositories.ts:845` (`openWorktree`): "if (newWindow) opening.openWindow(opening.address());". The brief: "opens a new browser window of oculus ... with the Files view revealed at the worktree's folder". `showInFiles(dir)` acts on the current window only, and the new window is opened at the page's own address. The test pins `'window:http://127.0.0.1:8787/'` as a fake's value (a string in the test, not a request). Whether the new window picks up the reveal through the persisted layout I did not verify. Failure scenario: the reader picks Open Worktree in New Window and gets a second oculus window showing whatever it showed last. Verdict: item 6 violated in this point, case 6 partial.

1.5 No Delete Branch in the Branches section. `grep -n "deleteBranch" -r src` finds it in `graph-menu.ts:214,222`, `graph-picks.ts:16,55`, `git-refs.ts:152`, `git-routes.ts` and `repositories.svelte.ts` only. `src/lib/views/sources/repositories/refs/Branches.svelte` (129 lines) has a Switch control (`:97-103`) and the New Branch row (`:111-123`) and nothing else, while `Tags.svelte:62` has `repositories.tag_delete`. The brief: "On a local branch name in the graph and in the Branches section". Failure scenario: a reader looks for Delete Branch on the branch list in the Repositories view and finds none. Verdict: item 11 violated in this point, case 11 partial.

1.6 With `editor_actions: hidden`, pane menu items are unreachable. The builder's report ("Beyond the path list and design points") says Maximise, Fold and the page items live only in the `...` menu. `src/lib/shell/panes/pane-view.ts` `stripMenu` (`:215-282`) holds Open File, New Text File, the splits, Float, Lock, the two submenus, Close and New Terminal, and no Maximise, Fold or move-to-page items. `PaneView.svelte:40` says "With editor_actions hidden this menu is how the pane menu is reached", which is not true for those items. The brief: "`hidden`: the editor actions are not drawn, the pane menu still reachable by the strip's right click." Failure scenario: a reader sets Editor Actions Position to Hidden and cannot Maximise, Fold or move a pane until the setting is set back through the strip menu or the Settings view. Verdict: item 14 violated in this point, case 14 partial.

1.7 DESIGN.md names the wrong home for `trashUntracked`. `DESIGN.md:128`: "`trashUntracked` (`server/files/fs/ops.ts`) moves untracked paths to the operating system's Trash". The function is `src/lib/server/git/git-index.ts:286`; `ops.ts` only gained `export` on four declarations. Failure scenario: a reader who follows the page to `ops.ts` finds no such function. Verdict: item 21 violated in this point.

## 2. Proof

2.1 "Nothing is ever forced" is false against the tree. `DESIGN.md:129` (the new "Fixed git choices" paragraph) ends: "Nothing is ever forced." `src/lib/server/git/deposit-git.ts:257` is "return pushCmd(at, ['--force', 'origin', 'HEAD:main']);" (the deposit snapshot push, whose comment at `:250-255` says it is "the one call in oculus that forces a push"). The same sentence stands in older comments (`git-write.ts:301`, `git-remote.ts:9`), and `git-refs.ts` `deleteBranch`'s new comment says "Nothing is deleted by force". The brief asked to keep "no form carries `--force`" at `DESIGN.md:128`, which in its context speaks of `git-write.ts` and its siblings and is accurate for the Q88c forms. The new sentence at `:129` is the builder's own and is wider than what the tree does. Failure scenario: a reader trusts the page and believes oculus has no forced push. Verdict: item 21 violated in this point.

2.2 Five tests have no unchanged-tree run (report, "Those five were not run on the unchanged tree"). Brief verify item 4 asks for it "where it can run there". `graph-picks.test.ts` covers a new file and could not run there; `ui.test.ts`, `graph-row.test.ts`, `instance-state-sources.test.ts` and `tones.test.ts` change existing files and could. I cannot run them on the base either. Verdict: not verifiable by the reviewer; the brief's proof requirement is partly unmet for four of the five.

2.3 Two tests read source text instead of running the behaviour. `tests/routes/page.test.ts:71,101` reads `src/routes/+page.svelte` through `readFileSync(join(ROUTES, '+page.svelte'), 'utf8')` and asserts on its text for the listener; a diff-pane test reads `src/lib/views/sources/repositories/diff/Diff.svelte` the same way. A listener added in a different form passes or fails by wording, and a listener that is present but never reached passes. The brief rules out a browser test, so the behaviour check is `shouldCancel` itself (`tests/shell/context-guard.test.ts`), which is met. Failure scenario: `+page.svelte` renames the import and the test fails with no behaviour changed; or the call is removed behind a wrapper and the test still matches. Verdict: none (the pure function is covered).

2.4 The Cherry Pick store test pins the defect (finding 1.1). `store-actions.test.ts` expects `{ hash: HASH, confirm: true }`. Under the project's rule that a test never asserts a known defect, this line must change with the fix.

## 3. Standards

3.1 Module-level state added to the frozen list. `tests/checks/tree/boundaries.test.ts:295-296` gains "'lib/state/shared/words/appearance.ts:tabBar'," and "'lib/state/shared/words/appearance.ts:actionsAt',". The `FROZEN` list exempts a module-level mutable declaration from the layer check; the file already lists `crt`, `codeTheme` and `terminal` in the same module, so the additions follow an existing pattern. Under the rules file's "a check that only passes after the rule is widened is a finding", the widening is reported here for the orchestrator to rule on, not as a defect.

3.2 A rule exists once: the binary test is written twice in one file. `src/lib/server/core/git/git-compare.ts:72`: "if (!done.utf8 || done.text.includes('\0')) return { ok: true, value: { binary: true } };" and `:389`: "const binary = bytes.includes(0) || !isUtf8(bytes);". They agree today, but the order and the form differ. The brief names `isBinaryFile` for the rule (`server/files/source.ts:54`, a path-based test); neither site uses it. Failure scenario: one site changes and a file reads as text at HEAD and as binary from disk. Verdict: item 3 holds, with this finding.

3.3 Exports beyond the brief. `src/lib/server/files/fs/ops.ts` gained `export` on `Scope` (`:72`) and `Guard` (`:226`) as well as on `protectedFiles` and `holdsProtected`. The brief: "the word `export` added" to those two functions. The two types appear in the exported signatures, so the extra exports follow from them, but the report does not say so.

3.4 Size and folder limits. `git.test.ts` at 899 lines is one under the limit, reached by re-wrapping comments. All other files in the diff are under their limits (largest `core/git/git.ts` 837, `PaneView.svelte` 489).

3.5 Files changed outside the path list without a mention in "Beyond the path list": `src/lib/server/files/search.ts`, `src/lib/server/machine/lines.ts`, `src/lib/server/machine/pty/tmux.ts`, `src/lib/server/root/watch/autofetch.ts`, `utils/cited-lines.mjs`, and `src/lib/shell/Workbench.svelte`. By their diffs the first five are comment text and import lines that name the moved `core/git` modules (lines.ts and autofetch.ts also change an import path), and `Workbench.svelte` changes two import lines for the `leaf/` split. `src/lib/state/workbench/ui.svelte.ts` (`setPaneStrip`), `views/shared/ask.ts`, `AskConfirm.svelte` and `ChangesRepo.svelte` are listed by the builder. No behaviour change in the first group. Verdict: none.

## 4. Behaviour

4.1 Cherry Pick does not work from the page (finding 1.1), a user-visible defect in a capability the step exists to add.

4.2 A float cannot be locked, and the strip menu offers no Lock Group on a float pane (`pane-view.ts` `stripMenu`: `floated ? []`; the builder's report says so). The brief says "the strip menu of a pane". This is a narrowing the brief did not authorise; a float pane is built from literals at `open/floats.ts:106,147,222,258` that carry no `locked`. Verdict: none on its own; item 12 holds on a page pane.

4.3 Create Branch and Create Tag from a commit ask a third field. `graph-picks.ts:62-89` `namePrompt` adds a field labelled `repositories.start_point` with the placeholder of the commit's short hash, and the server accepts only `^[0-9a-f]{4,64}$`. VS Code asks the name only. A new user-visible field is a design choice the brief did not name ("the name asked as the Branches and Tags sections ask it"). Failure scenario: a reader types `main` as the start point and the server refuses it. Verdict: item 8 holds, with this unnamed addition.

4.4 The Trash question names the repository-relative path. `src/lib/views/sources/repositories/menus/change-menu.ts:164-170`: `t('git.trash_confirm', paths[0] ?? '')`, with the path as the store passes it (for example `a/b/u.txt`). VS Code names the file's basename. The brief says "VS Code's question". Verdict: none on its own.

4.5 Worktrees and deposit docs: see findings 1.7 and 2.1.

## Readiness for Z241 (Delete Anyway with `branch -D`), not filed as a finding

Nothing in the diff stops adding it, and these places would change:

- `src/lib/server/git/git-refs.ts:152` `deleteBranch` calls `branchIn(root, ['-d', name])`. A `-D` form is a second vector through the same `branchIn` call site, so `ALLOWED` and the one-call-site rule are unaffected, and the `--force` gate in `git-write.test.ts` looks for the text `--force`, which `-D` is not.
- The text must change: `DESIGN.md:128` ("no form carries `--force`"), `DESIGN.md:129` ("Nothing is ever forced."), the comment above `deleteBranch` ("Nothing is deleted by force"), and the `git-write.ts` head comment.
- `Outcome` carries no error code, so the page cannot tell "not fully merged" from another refusal except by parsing git's message. The store's `deleteBranch` returns `void` (`repositories.svelte.ts`), so the retry question has nothing to branch on.
- `CONFIRMED` already lists `deleteBranch` and the question text in `config/text/` says `-d` only.

## Declined to judge

- Whether each new or changed test fails on the base tree (brief verify item 4): I cannot check out the base, and my git commands are limited to the two named. The builder's table of first-run results is a lead I did not reproduce.
- The Reopen Closed Repositories quick pick itself, and every look row of the builder's "Before and after": the report says none was looked at, and I started no server and opened no browser.
- Whether a new window opened by Open Worktree in New Window shows the worktree through the persisted layout (finding 1.4).
- Which files the six load timeouts hit in the earlier run, and so whether they belong to files the step changed.
- The choice between keeping and widening the `FROZEN` list (finding 3.1), and whether Z241 should be built: both are Axel's.

Reviewer usage: tokens not available to the reviewer, tool uses not counted, minutes not timed.

## Repair round 1, refuted

Worktree `.agents/worktrees/Q88c`, base `5cf40f03`. I changed no file in the worktree or the ledger. The only git commands I ran were `git diff 5cf40f03` and `git status --short`, and `git status --short | wc -l` printed 189 before and after my reruns. I never opened, printed, grepped, hashed or copied `config/local.yml`.

**The two points you asked me to judge:**

- **(1) `floatTab` (`floats.ts:258`).** It leaves a float made from one tab unlocked, and that is what VS Code does. This item should not be raised to Axel. Details are under "Point (1)" below.
- **(2) The verify list.** It is green on the repaired tree. My second run printed `checks: 7 commands passed` and exited 0. My first run was red, on two 5000 ms timeouts while the load average was 18.7. Both are files this step touches, and both pass when run alone.

**Rulings.** 15 of the 17 rulings are closed. Two are not:

- **Ruling 8.** `HELP.md:215` is still false.
- **Ruling 16.** The two head comments still describe the start-point field that the code no longer has.

There are seven smaller findings after those two.

```
$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
  (run 1, 13:46-13:52, from tools/oculus of the worktree, node v24.21.0; load average 5.44 at the start, 18.71 at the end)
$ npm test
 FAIL  |unit| tests/server/git/autofetch.test.ts > a real fetch through the module > moves origin/main and prunes a branch deleted on the remote
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/server/core/git/compare-gate.test.ts > the commands the compare reads ran > are only the forms written in the module, each without optional locks
Error: Test timed out in 5000ms.
 Test Files  2 failed | 458 passed | 23 skipped (483)
      Tests  2 failed | 11771 passed | 622 skipped (12395)
checks: failed with exit 1: npm test

$ npx vitest run tests/server/git/autofetch.test.ts tests/server/core/git/compare-gate.test.ts   (alone, load 16.81)
 Test Files  2 passed (2)
      Tests  48 passed (48)

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
  (run 2, 14:00-14:09, load average 8.57 at the start, 17.39 at the end; exit 0)
$ npm test
 Test Files  460 passed | 23 skipped (483)
      Tests  11773 passed | 622 skipped (12395)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  444 passed | 9 skipped (453)
$ npm run check
1790942706248 COMPLETED 3019 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Every command the report quotes as evidence, rerun in the same form, with the count each printed (it matches the report in every row):
row 1  trash, untracked route, trash-and-cuts, change-rows        4 passed / 55 passed
row 2  ignore, store-actions                                      2 / 32
row 3  head, source, repositories-menu                            3 / 97
row 4  compare, diff-pane                                         2 / 52
row 5  view-state, repositories                                   2 / 55
row 6  store-actions, open-worktree                               2 / 21
row 7  detached, routes refs, graph-picks                         3 / 38
row 8  detached, graph-picks                                      2 / 22
row 9  cherry-pick, commit-action                                 2 / 17
row 10 compare, graph-row                                         2 / 59
row 11 delete-branch, writes, repositories, store-wire            4 / 87
row 12 locked, layout-locked, strip-render, floats, floats-store  5 / 115
row 13 pane-strip-menu                                            1 / 26
row 14 appearance, tones, ui, config-folder                       4 / 307
row 15 context-guard, page                                        2 / 22
row 16 identity                                                   1 / 3
row 17 held, view-state                                           2 / 15
row 18 repositories-badge, rail-badges                            2 / 111
row 19 scan, watch git                                            2 / 27
git-write.test.ts 47; core git.test.ts 38; git-gate.test.ts 6; duplication.test.ts 18; boundaries.test.ts 11; compare-gate.test.ts 4; git-ssh.test.ts 5
docs.test.ts, routes docs.test.ts, integrity.test.ts, pages.test.ts (the report's NOT-done item 4)   4 passed / 184 passed
$ grep -c "useConfigOnly" src/lib/server/git/git-write.ts
3
$ grep -rn -- "--force" src/lib/server/git
src/lib/server/git/deposit-git.ts:257:    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
$ ls src/lib/server/core | wc -l
       9
$ wc -l (largest)   core/git/git.ts 837, git/deposit.ts 828, git/git-write.ts 797, PaneView.svelte 482, Diff.svelte 519, Graph.svelte 536
$ rename grep (core/git\.ts|core/git-parse|repositories/Worktrees|repositories/pick)   (no output)
$ grep -rn start_point src tests config --exclude=local.yml                            (no output)
$ the spec's ASCII gate (perl over src tests bin config, ! -name local.yml)            no line printed (bin does not exist)
Ruling 9, the four files in their final form run on a reviewer-owned copy of the base (Q88c-base copied without local.yml, the four test files dropped in):
ui.test.ts 2 failed | 38 passed (ui.test.ts:689:12, :698:72, "ui.setPaneStrip is not a function")
graph-row.test.ts 35 passed
instance-state-sources.test.ts 64 failed | 290 passed (instance-fixture.ts:99:32)
tones.test.ts 1 failed | 98 passed (tones.test.ts:214:43)
```

### Point (1): VS Code and an editor moved out of a locked group

I read VS Code's source on main, fetched with `curl` from raw.githubusercontent.com/microsoft/vscode/main.

- **Move Editor into New Window** (`editorActions.ts`, `BaseMoveCopyEditorToNewWindowAction.run`):
  - It calls `editorGroupsService.createAuxiliaryEditorPart()`.
  - It then calls `group.moveEditors(..., auxiliaryEditorPart.activeGroup)`.
  - So the editor goes into the new window's fresh group.
- **Move Editor Group into New Window:** it calls `mergeGroup(activeGroup, auxiliaryEditorPart.activeGroup, ...)`. This merges into the fresh group, and nothing passes the lock on.
- **Split an editor** (`editorCommands.ts:757`): `editorGroupsService.addGroup(group, direction)` makes a fresh group.
- **Drop an editor beside a group** (`editorDropTarget.ts:258`): `addGroup`.
- **Copy a whole group** (`editorDropTarget.ts:280`, `copyGroup`): the new group's model comes from `EditorGroupModel.clone()` (`editorGroupModel.ts:1145-1161`). `clone()` copies `editors`, `mru`, `preview`, `selection` and `sticky`, but not the lock.
- There is no lock handling in `editorPart.ts`, `editorParts.ts` or `editorDropTarget.ts`. The only call that locks a group outside the lock commands is the auto-lock for editors listed in `workbench.editor.autoLockGroups` (`editorGroupView.ts:1271`).

So in VS Code, an editor moved out of a locked group into a new group or a new window lands in an unlocked group, and the group it left keeps its lock. Oculus's `floatTab` does the same: it builds the new float with `{ kind: 'pane', tabs: [kept(instance)], active }`, and the pane the tab left keeps its lock.

The report's first NOT-done item therefore needs no ruling from Axel. Ruling 15 listing `:258` was an over-listing, and it is closed by VS Code's behaviour.

For the orchestrator's information: `floatPane` and `dockFloat` keep the lock when a whole pane is floated, as ruling 15 ordered. That differs from VS Code's Move Editor Group into New Window, which lands in an unlocked group. It is a choice already ruled, not a finding of this run.

### Point (2): the verify list

My second full run is green over the tree as it stands, including the three files changed after the builder's last full run (`git-ssh.test.ts`, `DESIGN.md:371`, `HELP.md:44`).

My first run was red, with two 5000 ms timeouts at a load average of about 18.7:

- `compare-gate.test.ts` is a file this step added.
- `autofetch.test.ts` is a file this step changed (one import path, `git diff --stat` 8 lines).

Both pass alone. Run alone with the verbose reporter at load 14.8, the compare-gate case took 1456 ms. See Proof finding 3.

### Rulings of round 1

| Ruling | Closed? | Evidence |
|---|---|---|
| 1. Cherry Pick sends `ref` | Closed | `repositories.svelte.ts` sends `{ ref: hash }`. `store-wire.test.ts` drives every store method through `gitBodyShape` and `OPERATIONS` with a recording Proxy. Every operation reads its fields as call arguments, so a misspelt field is caught. |
| 2. Untracked symlink leaving the repository | Closed | `git-index.ts` `trashUntracked` refuses a leaf whose `realPath` target is outside the repository. Tests at `trash.test.ts:126,147,159`. Goes further than the ruling (finding 1). |
| 3. Main worktree checked | Closed | `git-compare.ts` `workspaceSides` checks `permitted(realOf(main), roots.map(realOf))` and `pathInside`. `git-reads.ts` passes the request's roots. |
| 4. Open Worktree in New Window shows the folder | Closed | `repositories.ts:844-845` reveals the folder in Files, then opens the window. `open-worktree.test.ts` loads the stored records into a second client at `openWindow` time and finds the reveal. |
| 5. Delete Branch in Branches, Delete Anyway (Z241 (b)) | Closed | `Branches.svelte:118-126` (control), `Repo.svelte` wired to `askBranchDelete`, `git-refs.ts` `deleteBranch` with code `not-merged` and `deleteBranchAnyway` (`-D` through `branchIn`), in `ACTIONS` and `CONFIRMED`. Findings 4 and 5 are on its words and an edge case. |
| 6. Hidden editor actions | Closed | `pane-view.ts` `PANE_ONLY` and `paneOnly` in `stripMenu`; `PaneView.svelte` sends pane items to `pick`. The head comment is true. |
| 7. `DESIGN.md:128` names `git-index.ts` | Closed | `grep -n "git-index.ts" DESIGN.md` prints 128. |
| 8. "Nothing is ever forced" | **Not closed** | `HELP.md:215` (finding 2). `DESIGN.md:128-129`, `git-write.ts:299`, `git-remote.ts:9` and the `git-refs.ts` comments are true. |
| 9. First runs of four files | Closed | Reproduced on my own copy of the base (block above), the same failing lines as the report. |
| 10. Source-text tests titled as audits | Closed | `page.test.ts:80,84,104,111,117,122,135,140,145` and the six `diff-pane.test.ts` cases. Six existing cases were also retitled; titles only, harmless. |
| 11. `tabBar` and `actionsAt` | Closed | `appearance.ts:81-89` keeps separate bindings, so the two `FROZEN` rows at `boundaries.test.ts:295-296` follow the existing pattern. |
| 12. Binary rule once | Closed | `git-compare.ts` `isBinary` called from `headFile` and `onDisk`. |
| 13. `Scope`, `Guard` exports | Closed | Report text only. |
| 14. `git.test.ts` split | Closed | Base has 43 cases in 900 lines. Now `git.test.ts` 38 (618 lines) plus `git-gate.test.ts` 6 (165) plus `git-fixture.ts` (224). The sorted `expect(` lines of base and new are identical (`diff` printed nothing). The one added case calls the shared `ranOnlyThese()` so the 37 state cases stay held to the allowed list. |
| 15. Lock Group on a float | Closed | `floats.ts:106,147,222,309` go through `repane`. The strip menu offers Lock or Unlock on a float. Tests in `floats.test.ts` and `floats-store.test.ts`. `:258` is correct as it stands (Point 1). |
| 16. Start-point field removed | Closed in code; **comments not** | `graph-picks.ts` `namePrompt` asks name and message only. Two head comments are now false (finding 3). |
| 17. Trash question names the base name | Closed | `change-menu.ts` `askTrash` with `baseName`. |

### Verdicts (whole diff since the base)

**Items of the brief's "What to build":**

- **1:** holds. Untracked discard to the Trash, symlink refusal, VS Code's strings with the base name. See Behaviour finding 1.
- **2:** holds. `addToGitignore`.
- **3:** holds. `head=` read and the HEAD or Index tab.
- **4:** holds. `workspaceSides` with `permitted`, `pathInside` and real paths.
- **5:** holds. `closed`, Close and Close Others, the Reopen pick's choices.
- **6:** holds. Root added, reveal stored before `window.open`.
- **7:** holds. `switchDetached`.
- **8:** holds. Start point from the commit picked, hash checked on the server. See Standards finding 1 on the comments.
- **9:** holds. `{ ref }` sent and read.
- **10:** holds.
- **11:** holds. Graph menu, Branches section, Delete Anyway. See findings 4 and 5.
- **12:** holds. `floatTab` matches VS Code.
- **13:** holds.
- **14:** holds. Under `hidden` the strip menu repeats every pane menu item.
- **15:** holds.
- **16:** holds.
- **17:** holds.
- **18:** holds.
- **19:** holds.
- **20:** holds. `server/core` holds 9 items, the largest read file is 837 lines.
- **21:** violated in one point (Standards finding 2, `HELP.md:215`).

**Cases of the brief's "Cases":**

- **Case 1:** met. `trash.test.ts`, `untracked.test.ts`, `repositories-menu.test.ts`.
- **Case 2:** met.
- **Case 3:** met.
- **Case 4:** met, including the main worktree refused outside the roots.
- **Case 5:** met for the list, the separator, All Repositories and the per-tab state. Whether the quick pick draws correctly is not verifiable without a browser; the look settles it.
- **Case 6:** met. Root added, stored reveal, `window.open` called after it. Whether the new window draws the folder is the look's to see.
- **Case 7:** met.
- **Case 8:** met.
- **Case 9:** met through the page.
- **Case 10:** met.
- **Case 11:** met. Merged deleted with `-d`, the current branch not offered, unmerged asks the second question, a branch held by a worktree refused.
- **Case 12:** met on page panes and floats.
- **Case 13:** met.
- **Case 14:** met, including `hidden`.
- **Case 15:** met (the pure function).
- **Case 16:** met.
- **Case 17:** met.
- **Case 18:** met.
- **Case 19:** met.
- **Case 20:** met. Dash names refused for every new action (`routes/git/refs.test.ts:124-140`).
- **Case 21:** met. Both full-list runs reached past every existing case; the only reds were the two load timeouts, which pass alone.

### Findings

**Spec**

1. **`trashUntracked` refuses a dangling untracked link, with a misleading message.** At `git-index.ts`: `const target = realPath(join(root, bare)); if (folder === null || ... || target === null || ...) return failed(\`the path ${path} is not inside the workspace\`)`.
   - What is wrong: ruling 2 asked for a link whose target leaves the repository to be refused. The fix also refuses a link whose target does not exist, and tells the reader the path "is not inside the workspace", which is not true of it.
   - Failure scenario: a reader has an untracked broken symlink inside the repository and picks Discard Changes. Nothing goes to the Trash, and the reason given is wrong. Moving the link itself would touch nothing outside the repository.
   - The report lists this under "Beyond the path list". It is a fix that reaches beyond its finding.

**Standards**

1. **Two head comments still describe the removed start-point field.**
   - `graph-picks.ts:2-3`: "the prompt of Create Branch and Create Tag, which asks for the name and for the start point (the commit, when left empty)".
   - `Graph.svelte:24-25`: "Create Branch and Create Tag in a prompt that asks for the start point (the commit, when left empty)".
   - What is wrong: ruling 16 removed the field. Under the spec's rule, a head comment the change makes false is a defect of the change.
   - Failure scenario: a reader of either file looks for a start-point field that no longer exists.
   - It is a two-line fix at landing.
2. **`HELP.md:215` says "No write ever carries `--force`."**
   - What is wrong: `deposit-git.ts:257` (`forcePushSnapshot`) pushes with `--force`. `DESIGN.md:129` says so correctly. Ruling 8 asked the force grep to be carried across `HELP.md`, and the report's list of hits leaves this line out.
   - Failure scenario: a reader of the help page believes oculus never force-pushes and presses the deposit snapshot without expecting it to replace the remote's `main`.
   - Item 21 is violated in this point.
3. **`Graph.svelte` is 536 lines against the component cap of 540** (`size.test.ts:29`). It was 457 on the base.
   - What is wrong: the spec says "A file within 20 lines of its cap is split".
   - Failure scenario: the next step that touches the graph turns `size.test.ts` red, or is pushed to compact code to stay under the cap.
   - This dates from the first build; the first review did not raise it.
4. **Exports with no importer outside their own file.**
   - `git-routes.ts:270` `export type GitOperation`.
   - `git-write.ts:116` `export type Extra`, which is also the same type `git-run.ts:32` declares.
   - The spec's rule: an export with no importer outside its own file and its tests is made local.
   - `gitBodyShape` and `OPERATIONS` are exported only for `store-wire.test.ts`, but ruling 1 named them, so those two are not findings.
   - Failure scenario: a reader treats these types as public surface. The two `Extra` types can drift apart.
5. **Delete Branch's detail texts describe `branch -d` wrongly.** At `repositories.yml`: `branch_delete_detail: git deletes the branch without more questions when its commits are reachable from another branch` and `branch_unmerged_detail: No other branch holds its commits; after the delete they stay reachable only through the reflog.` The same wording is in the comments of `repositories.svelte.ts` (`deleteBranch`) and `git-refs.ts` (`deleteBranch`).
   - What is wrong: `git branch -d` checks only that the branch is merged into its upstream, or into HEAD when it has none. A branch whose commits sit on a third branch is still "not fully merged".
   - Failure scenario: a reader asked "Delete anyway?" reads that no other branch holds the commits and that they will survive only in the reflog, when another branch does hold them. The reader is told the risk is worse than it is.
   - VS Code shows the question with no detail.

**Proof**

1. **The report's file table contradicts its own ruling 9 section.** The table for `ui.test.ts`, `graph-row.test.ts`, `instance-state-sources.test.ts` and `tones.test.ts` says "new file or added after the first run, so it has no first run". All four files exist on the base, and ruling 9 quotes their base runs, which I reproduced.
   - Failure scenario: a reader of the table concludes these tests were never run on the base.
   - No decision rests on it beyond the booking. It is a fix to the report text.
2. **`git-fixture.ts:119,126,133` exports module-level mutables** (`ran`, `unanswered`, `between`).
   - What is wrong: the spec's "No globals" principle extends to test fixtures. The base kept these as file-scope `vi.hoisted` values inside `git.test.ts`; the split moved them into an exported fixture module that two test files import.
   - Vitest's default isolation (`vite.config.ts` sets no `isolate`) gives each file its own copy, so the two files share nothing today. A change to `isolate: false` would make the gate in `git-gate.test.ts` judge the calls `git.test.ts` made.
   - The fix: a factory in the fixture that returns a fresh recorder for each file.
3. **The step's own `compare-gate.test.ts` times out in the full list under load.** Its case "are only the forms written in the module" runs about 25 git processes in one `it`. It took 1456 ms alone at load 14.8, and over 5000 ms in my first full run at load 18.7. The builder hit the same timeout ("compare-gate.test.ts (4 passed) and held.test.ts (5 passed) were run alone, since a 5000 ms timeout hit them").
   - What is wrong: under the spec, a timeout in a file the step adds is the step's, unlike one in a file the step does not touch.
   - Failure scenario: the landing's verify run on main goes red on this case whenever five agents are running.
   - The cure: split the case so each part spawns fewer processes. A longer timeout would be a threshold loosened, which the spec forbids.

**Behaviour**

1. **Delete Anyway recognises git's refusal by its English text, cut to the first 200 characters** (`git-refs.ts`: `if (done.ok || !done.error.includes('is not fully merged')) return done;`).
   - What is wrong: `done.error` is `short(stderr)`, git's first line cut to `REASON_WIDTH = 200` (`git-write.ts:94`). With a branch name longer than about 160 characters, the cut drops "is not fully merged".
   - Failure scenario: such a branch gets git's refusal and no second question.
   - The report names the English matching as a limitation, but not the length cut. Matching on the full stderr would end it.

### Declined to judge

- **How the delta was taken.** No tree state was recorded when the round was sent at 10:49, so the delta is the 50 files modified after the round's rulings file, listed in `q88c-round1-files.txt`. I read each through `git diff 5cf40f03 -- <file>`, against the whole diff since the base. A file changed in the round that was also changed before 10:49 shows its whole change since the base, not the round's part alone.
- **Whether each round test fails with its behaviour removed.** I did not run any test with the code taken out. Doing so needs an edited copy of the worktree, which my rules exclude. I judged each test by reading it:
  - `store-wire`, `trash` (symlink), `compare` (main outside roots), `open-worktree` (order and stored reveal), `delete-branch` (code), `pane-strip-menu` (hidden) and `floats` (lock) each assert the behaviour itself, not source text.
  - The builder's quoted failing lines are leads I did not reproduce, except ruling 9's, which I ran.
- **Ruling 9's base runs.** I ran them on a copy of `Q88c-base` I made in my scratchpad (`r1-review-base`, copied without `local.yml`, with the four test files in their final form). The orchestrator's base copy was left unchanged.
- **The look rows.** I started no server and opened no browser.
- **Whether `window.open` after the awaited add-root write is let through by the browser's popup blocker.** Only the look can show it.
- **`autofetch.test.ts`'s timeout.** The case is not the step's (the step changed one import path in that file), and it passed alone.

Reviewer usage: tokens not available to me; about 60 tool uses; about 45 minutes (13:42 to 14:26).


## Closed

Every finding of the run over repair round 1, closed at landing on main (2026-10-02), none sent to the builder:

- Ruling 8, `HELP.md` "No write ever carries `--force`": the sentence now reads that no Source Control action carries `--force` and that the push of a deposit snapshot is the one forced push in oculus.
- Ruling 16 and Standards 1, the two head comments: `graph-picks.ts` and `Graph.svelte` say the prompt asks for the name, and for a tag its message, the new ref starting at the commit.
- Spec 1, a dangling untracked link: `trashUntracked` (`git-index.ts`) moves a link whose target is missing as the link, through `linkAt`, and a path it cannot find says so; `trash.test.ts` "moves an untracked link whose target is missing as the link, wherever it pointed" failed on the unfixed tree with "expected false to be true" and passes; `DESIGN.md` says so.
- Standards 2: as ruling 8.
- Standards 3, `Graph.svelte` near its cap: the section head's actions moved to `graph/GraphActions.svelte`; `Graph.svelte` is 473 lines.
- Standards 4, exports with no importer: `GitOperation` (`git-routes.ts`) and `Extra` (`git-write.ts`) are local; `git-run.ts`'s `Extra` no longer exists (the merge with X3a's split of the git folder keeps main's `run.ts`).
- Standards 5, the `branch -d` wording: `branch_delete_detail`, `branch_unmerged_detail` and the comments of `git-refs.ts`, `repositories.svelte.ts` and `git-write.ts` (`removeWorktree`) say git refuses a branch not merged into its upstream, or into HEAD when it has none.
- Proof 1, the report's file table: the booking states that `ui.test.ts`, `graph-row.test.ts`, `instance-state-sources.test.ts` and `tones.test.ts` exist on the base and ran there; the builder's report is left as written.
- Proof 2, module-level mutables in `git-fixture.ts`: the fixture is gone. The merge keeps main's `tests/server/core/git/git.test.ts` and `git-gates.ts`, whose recorder is file-scope `vi.hoisted` state, and drops Q88c's `git-gate.test.ts` and `git-fixture.ts`, which repeated that gate.
- Proof 3, `compare-gate.test.ts` timing out: its run case is split into three cases, one per group of reads, each asserting its vectors against the forms, and a last case asserting that the file ran every listed subcommand.
- Behaviour 1, Delete Anyway's match on a cut reason: `git-write.ts`'s `run` takes `codes`, a phrase of git's whole error stream per refusal code, and `deleteBranch` passes `is not fully merged`; `delete-branch.test.ts` "gives the code not-merged for a branch whose long name pushes the phrase past the reason" failed on the unfixed tree with "expected undefined to be 'not-merged'" and passes.
