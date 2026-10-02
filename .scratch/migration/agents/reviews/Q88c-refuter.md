# Step Q88c refuter report (on .agents/worktrees/Q88c, base d1bd21f1)

Pages this report cites are named with their section. Findings in code keep `file:line`. Paths are relative to `tools/oculus` in the worktree. Nothing was changed or written by the reviewer. The only git commands run were `git diff d1bd21f1` and `git status --short`. No part of `config/local.yml` was opened, and no port or dev server was touched.

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
