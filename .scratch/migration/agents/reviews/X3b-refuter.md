# Step X3b refuter report (on .agents/worktrees/X3b, base a8848c49)

## Verification (rerun by the reviewer)
All commands were run from .agents/worktrees/X3b/tools/oculus. The worktree diff was compared byte for byte before and after my runs (`git diff a8848c49 | cmp`) and is unchanged.
1. `npx vitest run --reporter=dot` gave `Test Files  319 passed (319)` and `Tests  5029 passed (5029)`, exit 0.
2. `npm run check` gave `COMPLETED 1438 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build` gave `build=0`.
4. `npm run format:check` gave `All matched files use Prettier code style!`
5. `npm run lint` gave `lint=0`.
6. ASCII perl gate: `0` lines. The added lines of DESIGN.md and HELP.md: 0 non-ASCII.
7. `sh bin/size-check.sh` gave `size=0`. `sh bin/folder-check.sh` gave `folder=0`.
8. `npm run diagrams` was run twice. Both exited 0, the shasum of docs/diagrams/* is the same after the second run, and the diff is unchanged.
9. `npx playwright test` over the whole suite, on an idle 8792: `397 passed (7.2m)`, `exit=0`.
10. revert-check:
   - The 35 changed or new unit test files: `276 reverts, 0 unproven, 249 unchecked` (exit 1 because of the unchecked cases). This matches the report's 276/0.
   - tests/browser/scm/*.spec.ts, first run under load: `11 reverts, 3 unproven`. Rerun alone on an idle port, diff.spec.ts and refs.spec.ts gave `8 reverts, 0 unproven, 0 unchecked`. merge.spec and history.spec were red on the first run.
   - tests/browser/shell/rail.spec.ts, two runs on an idle port: `27 reverts, 10 unproven, 3 unchecked` both times. Second run: 1 GREEN (see Proof 4).
11. `ls -d $TMPDIR/oculus-* | wc -l` gave `0` before and after.

## 1. Spec
- src/lib/server/git/git-index.ts:180-194 (`continueRebase`), git-write.ts:604-606 (`rebaseIn`, with `GIT_EDITOR: 'true'`), and the Continue control in Repo.svelte:108 are a control and a write the brief does not name: a `rebase --continue` that commits the rebased commits under their own messages. It follows from brief decision 2 (pull uses the repository's own `pull.rebase`), but the report's judgment calls and before/after never state it. The same holds for Mark Resolved (Changes.svelte:228, `repositories.merge_mark`) and for a Tags row opening its commit in the Graph (HELP.md:171). All are user-visible controls the brief does not list, and the report does not state them.
- git-index.ts:136-157 `resolveMerge` always writes a file and runs `add`. Brief item 6 names `DD` and the other unmerged pairs as Merge Changes rows. For DD, DU and UD, Complete Merge in the merge editor writes the Result (empty for a missing side, git.ts:662-666) over the path and stages it. That brings back as a file a path that one or both sides deleted, and the editor has no way to accept the deletion. Not exercised by any test (`grep -rn "'DD'" tests` finds only the key list in keys.test.ts).

## 2. Proof
- tests/server/core/git.test.ts, case "cuts every list it publishes at the cap, and takes both new lists through it": changed by this step (`toBe(2)` became `toBe(4)`, new comment) and has no revert directive. revert-check lists it as `unchecked`. This contradicts the report's "Every new or changed case has a directive". The case is also a source-text count (`source.match(/\bcapped\(parse/g)`), which is an audit under spec.md:56.
- Many press behaviours are proven only by node string renders or by store calls, never by a press in the browser (spec.md:56). Among the catalog keys the browser specs press (`grep -rhoE "t\('(repositories|git)\.[a-z_]+'" tests/browser`), none of the following appears:
   - Pull from the menu; Commit (Amend), Commit and Push and Commit and Sync from the dropdown; Ctrl/Cmd+Enter;
   - Stage All, Unstage All and Discard All; Revert Block and revert lines, including their confirm;
   - the inline layout toggle (only `pressed=` in a string render, repositories views test :661); Open File (only "is drawn", :675);
   - Abort Merge, Continue Rebase and Mark Resolved;
   - Stash Apply, Drop and View; Delete Tag; Push Tags; Load More; a commit's file opening its diff; Copy Commit ID and Copy Commit Message;
   - a sessions Changes row opening the diff (only an `aria-label` count, changes.test.ts "offers on each row what opens it").

  The defects under Behaviour 1 and 2 sit in exactly these untested presses.
- The report says every directive of the 13 browser specs was proven red on an idle port, except four rail directives that it proved by hand. That did not reproduce. Two runs of rail.spec.ts on a port checked free (three consecutive `lsof` misses before the start) both gave `10 unproven`, each `[the case did not run]`. The four named directives:
   - `tokens.css:90`: red.
   - `on-body.ts:14`: red.
   - `RailEditor.svelte:67`: did not run in either run.
   - `tokens.css:93`: did not run in either run.

  The hand-proof script (`scratchpad/rail-manual.sh`) is in the builder's scratchpad and could not be rerun.
- tests/browser/shell/rail.spec.ts:554, `revert: src/lib/shell/rail/RailPages.svelte:268 => font-size: var(--fs-sm);`: GREEN on my second run, which means the case stays green with its revert applied. RailPages.svelte and rail.spec.ts:540-600 are identical to the main checkout (`diff` printed nothing), so this does not come from X3b's code. It is a weak directive in a file this step changed, and the report does not name it.
- The report's file list leaves out src/lib/server/core/git.ts, which went from 495 to 778 lines (`wc -l`).

## 3. Standards
- src/lib/views/boards/deposit/Deposit.svelte:63: `/** What a confirm dialog is holding: what it says, and what pressing it does. */`. The `type Ask` this comment documented was removed, so the comment now stands alone above a blank line and the next doc comment.
- src/lib/views/sources/repositories/diff/DiffFile.svelte:121, src/lib/views/sources/source/Gutter.svelte:64 and :82: raw `<button>` elements in `views/` (the line-number chooser, the blame cell, the gutter mark). spec.md:46 says every control a reader presses is a `ui/` primitive. The report does not state these as a judgment call.
- src/lib/server/git/git-write.ts:28 head comment: `stash [push [--include-untracked | --staged] [-m <message>] ...`. git-refs.ts:67 runs `--message=<text>`.
- git-write.ts:25 head comment: `rev-parse [--abbrev-ref] <rev>`. git-index.ts:160-168 runs `rev-parse --verify --quiet MERGE_HEAD` and `rev-parse --git-path <name>`, which the list does not show.
- spec.md:58 (an asynchronous path superseded by a later one): src/lib/views/sources/repositories/diff/Diff.svelte:114-133. `load()` writes `text` and `failure` with no sequence guard. The effect at :148-160 starts a new load on every `git` channel move while an earlier load may still be in flight, so an older answer that lands later overwrites a newer one. Graph.svelte (`asked`) and Source.svelte (`reads`) carry the guard; Diff.svelte does not, and no test exercises the case.
- Git safety: no `--force` in git-write.ts or its three sibling modules (the git-write.test.ts gate passes). Every write goes through the one call site per subcommand, as tests/server/git/allowed.ts lists them. Every call is execFile with list arguments. A conflicting merge, pull or stash is left in progress and committed only from the commit box after a confirm. `rebase --continue` is behind CONFIRMED (git-routes.ts:108). No finding.

## 4. Behaviour
1. Diff.svelte:228-233 `openLine()` uses `changes.at(at)` while `at` is -1. This is the same defect the builder fixed for `shownAt` at :174 and described in the report. With no change current, which is how the pane opens (the report's own judgment call), Open File opens the file at the last change's line. It should use `held.line`, or the top of the file.
2. Diff.svelte:180-181 `go(next)` does `(next + n) % n`. From `at = -1`, Previous Change and Shift+Alt+F5 go to index n-2 rather than n-1 when n >= 2, so the first backward move skips the last change.
3. Diff.svelte:148-160 re-reads the diff on every channel move but leaves `chosen` (row indexes) in place, and resets it only on a new subject or after a successful apply. If the file changes on disk (a save in a source tab moves the git state) and lines shift, the chosen lines now point at other rows. A following Stage, Unstage or Revert of "the chosen lines" then acts on lines the reader did not choose.
4. The sessions Changes panel changes visibly and the report's "Before and after" does not state it:
   - the commit box moved from below the change groups to above them (ChangesRepo.svelte:105-107);
   - it gained the Commit dropdown with its four ways;
   - the group heads gained Stage All, Unstage All and Discard All;
   - a Merge Changes group was added;
   - rows gained open-diff and Open File controls.
5. git.ts:421-423: every read of a root on the `git` channel now runs three more git subprocesses (`for-each-ref`, `log --walk-reflogs`, `remote`), synchronously (spawnSync), per root per throttled event. The report does not state the cost, and it is not measured.
6. The report's stated judgment calls (the status bar sync runs the sync itself, pull follows the repository's own config, the diff pane opens with no change current) match the code: RepoItems.svelte:68-83, git-write.ts:595-597 `['pull']`, Diff.svelte:174. The status bar change is consistent with plan.md:160's ruling ("until X3 adds pull"). The consequence the report names (a divergent branch with no `pull.rebase` config fails the sync) is stated there. No further finding.

## Not checked
- Whether `git add -- <path>` (Mark Resolved) resolves a DD or UD conflict whose path is missing from the worktree. Checking it needs a scratch repository and git commands, which this review does not run.
- The builder's manual rail proof script, which is in the builder's scratchpad.
- An on-screen look at the views (the orchestrator's look on TEST).
- `stash push --staged` needs git 2.35 or later; the git version on the machine was not checked.
- The merge-regions algorithm against git's own conflict hunks on real conflicts beyond the tests' cases.

Reviewer usage: 268,477 tokens, 101 tool uses, 57 minutes (claude:opus, native Agent a8689ea922c90a936).
