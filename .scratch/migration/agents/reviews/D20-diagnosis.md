# Diagnosis: a cancelled merge left without MERGE_HEAD

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding.

Run unattended inside the plan (no person present), for step D20, finding "round 1 Behaviour 4.1".

## Symptom

From `agents/reviews/D20-refuter.md`, "Repair round 1, refuted", finding Behaviour 4.1:

"Behaviour 4.1. A real Cancel of a merge whose pre-merge-commit hook hangs answers `Git was stopped by Cancel` with no "left in progress" in 5 of 5 runs; the index holds the merge's result with no `MERGE_HEAD` (2 runs) or an empty one (3 runs), so `inProgress` reads nothing and Abort Merge is not offered, and a commit records the merge as a one-parent commit."

## Where the probes run

A scratch copy at `$TMPDIR/diagnose.aGxFX2/tree` (`/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.aGxFX2/tree`), a detached worktree made from the main checkout at the dispatch entry's base `87c0a7a81`, with the step's diff (`git diff --binary 87c0a7a81` from inside `.agents/worktrees/D20`) applied by `git apply --allow-empty` and each `??` file of the step's worktree copied to the same path. `tools/oculus/node_modules` in the copy is a symlink to the main checkout's `node_modules`, read only. Every repository the probes made lives under `$TMPDIR`. The paths redirected under `$TMPDIR`: none (nothing touches the home, the installed skills or the pinned checkout). git 2.49.0 (`/opt/homebrew/bin/git`), node v24.21.0.

Taken before the copy was made, from inside the step's worktree:

```
$ git status --short     (93 tracked files changed or deleted, and these untracked)
?? tools/oculus/.scratch/migration/agents/briefs/D20-round1.md
?? tools/oculus/.scratch/migration/agents/reviews/D20-report.md
?? tools/oculus/src/lib/server/core/git/running.ts
?? tools/oculus/src/lib/server/files/fs/collections.ts
?? tools/oculus/src/lib/server/machine/seeds/
?? tools/oculus/src/lib/state/sessions/terminal/composer/
?? tools/oculus/src/lib/ui/controls/segment/
?? tools/oculus/src/lib/ui/controls/tool-button.ts
?? tools/oculus/src/lib/views/boards/collection/task-card.ts
?? tools/oculus/src/lib/views/sessions/terminal/start/
?? tools/oculus/src/lib/views/shared/changes/change-actions.ts
?? tools/oculus/tests/server/core/git-failure.test.ts
?? tools/oculus/tests/server/sessions/transcripts.test.ts
?? tools/oculus/tests/state/workbench/layout/tree-keep.test.ts
$ git diff --binary 87c0a7a81 | shasum
a2cc1cdb371d9b0fc9aa930fcd9fd11b894bcb49  -
```

## Red command

A vitest file of the scratch copy, `tools/oculus/tests/server/git/diagred.test.ts` (way 1, at the level that reaches the defect: `merge` of `server/git/git-index.ts` with the signal the route's `running.begin` hands it). Each of its five runs makes a fresh repository under `$TMPDIR` (main and `other` diverged, so the merge makes a merge commit), installs a `pre-merge-commit` hook that touches a marker and runs `exec sleep 600`, calls `merge(repo, 'other', roots, signal)`, aborts the signal once the marker exists, and reads, after the answer: the answer's `failure.code` and `failure.left`, `.git/MERGE_HEAD` (absent, empty or set), whether `git rev-parse --verify MERGE_HEAD` succeeds, whether the index equals HEAD and whether HEAD moved. A run is green when the answer names the merge left in progress and `MERGE_HEAD` verifies, or when the repository is as it was (HEAD unmoved, index equal to HEAD, no `MERGE_HEAD`), which is the goal of D20 item 17; the file fails when any run is red.

```
cd $TMPDIR/diagnose.aGxFX2/tree/tools/oculus && npx vitest run tests/server/git/diagred.test.ts --tagsFilter slow --silent=false --reporter=verbose 2>&1 | grep -E "^RUN [0-9]|^RED |Tests  "
```

Runs, with the output of each quoted (vitest's check, cross and pointer glyphs are written PASS, FAIL and at throughout this record):

```
== run 1
RUN 1: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 2: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 3: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 4: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 5: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RED 5 of 5
      Tests  1 failed (1)
== run 2
RUN 1: code=cancelled left=none MERGE_HEAD=empty verifies=false indexIsHead=false headMoved=false => RED
RUN 2: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 3: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 4: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 5: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RED 5 of 5
      Tests  1 failed (1)
== run 3
RUN 1: code=cancelled left=none MERGE_HEAD=empty verifies=false indexIsHead=false headMoved=false => RED
RUN 2: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 3: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 4: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RUN 5: code=cancelled left=none MERGE_HEAD=absent verifies=false indexIsHead=false headMoved=false => RED
RED 5 of 5
      Tests  1 failed (1)
```

15 of 15 cancelled merges red over the three runs. The red is every time; `MERGE_HEAD` empty against absent varies (2 of 15 empty).

Runs after the tightening: the command was already isolated under `$TMPDIR`, with no network and no random input, and runs in 8.8 s for five merges (`time`: `3.13s user 2.00s system 58% cpu 8.758 total`, output `RED 5 of 5`). No further tightening was needed.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| `killWithDescendants(child)` in `run` of `git-write.ts` (git signalled alone by `execFile`, the hook left running) | red 5 of 5: `code=cancelled left=none MERGE_HEAD=absent ... => RED`; five orphaned `sleep 600` left, ended by pid afterwards | cut |
| oculus as a whole: `$TMPDIR/diagnose.aGxFX2/shell.sh git`, the same repository and hook driven by a shell, `git merge --no-edit other &`, then `kill -TERM` of git once the hook has started | red 5 of 5: `MODE=git git-exit=143 MERGE_HEAD=absent index=merged hook-alive=yes` | cut |
| the diverged main commit (a fast-forward merge instead) | git makes no merge commit and runs no hook, so nothing waits to be cancelled: `Fast-forward ... exit=0 hook-ran=no` | put back |
| the pre-merge-commit hook | the merge completes before anything can cancel it, the same as the fast-forward row | put back |

The shrunk case, as it stands: real git, a merge that makes a merge commit, a pre-merge-commit hook that waits, and git signalled while the hook waits. oculus is not needed for the red: plain git leaves the merge's result in the index with no `MERGE_HEAD` when it is signalled at that point.

The same shell harness with the other two orderings, five runs each:

```
MODE=hook git-exit=1 MERGE_HEAD=set index=merged hook-alive=no          (5 of 5: only the hook signalled)
MODE=hookthengit git-exit=143 MERGE_HEAD=absent index=merged hook-alive=no   (5 of 5: the hook, then git at once)
```

So git, when its hook fails and nothing else signals it, takes its own failure path, writes `MERGE_HEAD` and exits 1 ("Not committing merge; use 'git commit' to complete the merge."), which is a merge left in progress that Abort Merge takes back. The reviewer's guess, that the order (hook first, then git) is the cause, is falsified by the first two cut rows: git signalled first or alone is red 5 of 5 too, so it is not one of the hypotheses below.

Scope checks on the other two operations of item 17, by the same shell method: a cherry-pick runs only `prepare-commit-msg` before it commits, and `CHERRY_PICK_HEAD` is set by then (`hook=prepare-commit-msg ran=yes git-exit=143 CHERRY_PICK_HEAD=set index=picked`; `commit-msg` and `pre-commit` do not run: `ran=no`). A rebase keeps its `rebase-merge` folder for its whole run. A pull is a merge: `git pull` starts a second git for the merge, which runs the same hook (process tree under a waiting pull: `git` -> `/opt/homebrew/opt/git/libexec/git-core/git` -> `sleep`; with only the hook signalled, `pull exit=1`, `MERGE_HEAD set`).

## Hypotheses

1. If Cancel signals git itself while git waits on its pre-merge-commit hook, at which point git has written the merge's result to the index and writes `MERGE_HEAD` only after the hook has failed, then signalling only the processes below git (the hook) and leaving git to end on its own turns the red command green. Falsified by: with git left unsignalled and only its hook ended, `MERGE_HEAD` absent or empty, or `left=none`, in any of the five runs. Makes it worse: none expected; signalling git first leaves it as red (the shrink shows this).
2. If the answer is read before git has exited (on an abort `execFile` calls back at once, from its `error` handler, not at git's exit), so `stoppedOn`'s `inProgress` reads the repository while git still runs, then the answer comes at git's exit once hypothesis 1's change is made and the red command goes green. Falsified by: git already exited when `run`'s callback runs on a Cancel (logged), or with the answer settled at git's exit the red unchanged.

Only these two stand: the shrink places the defect at the moment git is signalled during its hook, and the code read (`run` of `git-write.ts`, `killWithDescendants` of `running.ts`, `leftInProgress` and `inProgress` of `git-index.ts`) has no other step between the abort and the read of the repository. `inProgress` itself reads git's own state (`rev-parse --verify MERGE_HEAD`), and the red command reads the same state directly, so a defect in the reader is not live.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, formed after probes 1 to 3 left the red standing (probe 3 made both changes of the first list and was red 14 of 15):

S1. If `execFile`, on an abort, closes git's stdout and stderr (its `errorhandler` destroys both streams), so that git, once its hook has failed, dies of SIGPIPE writing "Not committing merge" to stderr before it writes the merge state, then listening for Cancel in `run` instead of passing the signal to `execFile` (so the pipes stay open and the callback comes at git's close) turns the red command green with hypothesis 1's change in place. Falsified by: git's end under probe 3's tree not SIGPIPE (logged), or the red unchanged with the signal handled in `run`.
S2. If `killWithDescendants` signals every process below the root, a git included, then a pull, whose merging git is a child of the pulling git, is signalled during its hook and left the same way, and the change of S1 is red on a pull; passing over git processes in the walk and signalling the first process below them that is not git (the hook, with everything under it) turns a pull green. Falsified by: the pull variant `$TMPDIR/diagnose.aGxFX2/tree/tools/oculus/tests/server/git/diagpull.test.ts` (same assertions, the merge made by `pull` of `git-remote.ts` from a local upstream with `pull.rebase false`) green under S1's tree.

## Probes

Each probe's change is undone after its run (the file restored from its copy, checked by `diff` against the copy). The tag of this diagnosis is `DIAG-7c3e`.

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 2 | logging in `run`'s callback of `git-write.ts`, on the base tree: one line, for a merge, printing `DIAG-7c3e merge answered:` with the error's code and whether `child.exitCode` or `child.signalCode` is set | `DIAG-7c3e merge answered: error=ABORT_ERR gitExited=false` on all five; `RED 4 of 5` (one run green: the log's delay let git finish its writes before its SIGTERM) | still standing: the answer comes before git has exited, on every Cancel |
| 1 | `running.ts`, `killWithDescendants`: `- return kill(signal);` `+ return below.length === 0 ? kill(signal) : true;` (signal the processes below git, and git only when there are none) | `RED 5 of 5`, all `left=none MERGE_HEAD=absent` | not green alone; consistent with hypothesis 2 (the repository is read at the abort, before git, now unsignalled, has written anything) |
| 2 (on probe 1's change) | `git-write.ts`, `run`: when the callback comes while git has not exited, wait for the child's `exit` before answering (`if (child.exitCode === null && child.signalCode === null) { child.once('exit', () => answer(...)); return; }`) | three runs: `RED 4 of 5`, `RED 4 of 5`, `RED 5 of 5`, mostly `left=none MERGE_HEAD=absent` | falsified as the whole cause: git, unsignalled and waited for, still writes no `MERGE_HEAD` |
| S1 | logging on probe 3's tree, in the answer of `run`: one line, for a merge, printing `DIAG-7c3e merge exited:` with `child.exitCode`, `child.signalCode` and the error's code | `DIAG-7c3e merge exited: exitCode=null signalCode=SIGPIPE error=ABORT_ERR` on all five; `RED 5 of 5` | still standing: git dies of SIGPIPE |
| S1 | on probe 1's change, `git-write.ts`, `run`: drop `signal: extra.signal` from the `execFile` options; `+ const cancel = (): void => void child.kill(); if (extra.signal?.aborted === true) cancel(); else extra.signal?.addEventListener('abort', cancel, { once: true });`; in the callback `+ extra.signal?.removeEventListener('abort', cancel);` and `classifyFailure(extra.signal?.aborted === true ? extra.signal.reason : error, ...)` | three runs: `Tests 1 passed (1)` each; a verbose run: `RUN 1` to `RUN 5: code=cancelled left=merge MERGE_HEAD=set verifies=true ... => GREEN`, `RED 0 of 5` | still standing; the red command green |
| S2 | none: the pull variant run on probe 5's tree | `PULL 1` to `PULL 5: code=cancelled left=none MERGE_HEAD=absent ... => RED`, `PULLRED 5 of 5` | still standing (a pull is red with S1's change alone) |

## Cause

Three things, each needed, found by probes 1 to 5 and the pull variant:

1. git writes a merge's result to the index and the worktree before it runs the pre-merge-commit hook, and writes `MERGE_HEAD` only on its failure path after the hook (the shrink: `MODE=git` red 5 of 5, `MODE=hook` green 5 of 5). Any Cancel that signals git itself while the hook runs (`killWithDescendants` signals the hook and then git; `execFile` alone signals git) leaves the result with no merge in progress.
2. `run` of `git-write.ts` (and `execute` of `deposit-git.ts`) hands Cancel's signal to `execFile`. On an abort `execFile` closes the command's stdout and stderr and calls back at once. So a git left to end on its own dies of SIGPIPE writing its reason, before it writes `MERGE_HEAD` (probe 4: `signalCode=SIGPIPE` 5 of 5), and `stoppedOn` reads the repository while git still runs (probe 1 of rank 2: `gitExited=false` 5 of 5).
3. The descendant walk signals every process below the root, so the merging git that a pull starts is signalled itself during its hook (the pull variant: `PULLRED 5 of 5` under probe 5's tree).

The probe that shows it: the fix below, which makes all three changes, turns the red command green on 5 of 5 runs, three times, and the red command is red without it (`RED 5 of 5`).

## Fix and test

The failure costs something: a user who cancels a merge and goes on working commits the merge as a one-parent commit, so the merged branch's history is lost from the commit (the original case below, `parents=1`). By the test rule (`agents/spec.md:57`), a test exists only as the test of a `guarded.md` entry. The entry for item 17's behaviour is G44, proposed in open item Z543 and not yet ruled. The test below is G44's test. It replaces the row of `tests/server/git/git-write.test.ts` that Z543's proposal names, 'names the merge a cancelled run left in progress, and nothing once it is aborted'. That row builds a cancelled outcome by hand and passes on the defective tree. If Z543 is ruled (a), G44's Test line names the two new titles, and its Code line names `endWith` of `src/lib/server/core/git/running.ts`, `run` of `src/lib/server/git/git-write.ts`, `execute` of `src/lib/server/git/deposit-git.ts` and `pull` of `src/lib/server/git/git-remote.ts` besides what it names now. If Z543 is ruled (b), no test is kept, and the fix stands without one.

Test, run on the tree without the fix (the step's three source files as they are in its worktree):

```
$ npx vitest run tests/server/git/git-write.test.ts --tagsFilter slow -t "cancelled" --reporter=verbose
 FAIL |unit| tests/server/git/git-write.test.ts > the merge back > names the merge a cancelled merge left in progress, and Abort Merge takes it back 1272ms
 FAIL |unit| tests/server/git/git-write.test.ts > the merge back > names the merge a cancelled pull left in progress, and Abort Merge takes it back 918ms
AssertionError: expected undefined to be 'merge' // Object.is equality
 at tests/server/git/git-write.test.ts:239:40
AssertionError: expected undefined to be 'merge' // Object.is equality
 at tests/server/git/git-write.test.ts:239:40
      Tests  2 failed | 9 skipped (11)
```

The test, as a diff against the step's `tests/server/git/git-write.test.ts` (it applies to the step's file: `git apply --check` passed):

```diff
--- a/tools/oculus/tests/server/git/git-write.test.ts
+++ b/tools/oculus/tests/server/git/git-write.test.ts
@@ -8,9 +8,9 @@
 // @module-tag slow: its cases start real git processes, so npm test leaves it out.
 
 import { execFileSync } from 'node:child_process';
-import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
+import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
 import { join, resolve, sep } from 'node:path';
-import { describe, expect } from 'vitest';
+import { describe, expect, vi } from 'vitest';
 import {
     allowedRoots,
     commit,
@@ -25,6 +25,7 @@
 } from '../../../src/lib/server/git/git-write.ts';
 import { worktreePath } from '../../../src/lib/data/helpers/worktrees.ts';
 import { abortMerge, merge, stoppedOn } from '../../../src/lib/server/git/git-index.ts';
+import { pull } from '../../../src/lib/server/git/git-remote.ts';
 import { it, scratchDir, test } from '../../fixtures/scratch.ts';
 
 let dir = '';
@@ -189,19 +190,67 @@
         expect(readFileSync(join(repo, 'kept.txt'), 'utf8')).toBe('from main\n');
     });
 
-    it('names the merge a cancelled run left in progress, and nothing once it is aborted', async () => {
-        const cancelled = {
-            ok: false,
-            output: '',
-            error: 'x',
-            failure: { code: 'cancelled' as const, detail: '', program: 'git' }
-        };
-        expect((await merge(repo, 'other', ROOTS)).ok).toBe(false);
-        expect((await stoppedOn(repo, cancelled, 'the merge')).failure?.left).toBe('merge');
-        expect((await abortMerge(repo, ROOTS)).ok).toBe(true);
-        expect((await stoppedOn(repo, cancelled, 'the merge')).failure?.left).toBeUndefined();
-    });
+    // A Cancel while the merge's pre-merge-commit hook runs: git has the merge's result in the
+    // index by then and writes MERGE_HEAD only once the hook has failed, so the answer must come
+    // from a git that ran that path to its end. One row merges directly, one through a pull,
+    // whose own git starts the merging git.
+    it.each(['merge', 'pull'] as const)(
+        'names the merge a cancelled %s left in progress, and Abort Merge takes it back',
+        async (how) => {
+            const at = scratchDir('oculus-git-cancel-');
+            const up = join(at, 'up');
+            const here = join(at, 'here');
+            execFileSync('git', ['init', '-q', '-b', 'main', up]);
+            git(up, 'config', 'user.email', 'nobody@example.invalid');
+            git(up, 'config', 'user.name', 'Nobody');
+            write(up, 'kept.txt', 'one\n');
+            git(up, 'add', 'kept.txt');
+            git(up, 'commit', '-q', '-m', 'First');
+            execFileSync('git', ['clone', '-q', up, here]);
+            git(here, 'config', 'user.email', 'nobody@example.invalid');
+            git(here, 'config', 'user.name', 'Nobody');
+            git(here, 'config', 'commit.gpgsign', 'false');
+            git(here, 'config', 'pull.rebase', 'false');
+            write(up, 'theirs.txt', 'theirs\n');
+            git(up, 'add', 'theirs.txt');
+            git(up, 'commit', '-q', '-m', 'Theirs');
+            git(here, 'fetch', '-q');
+            git(here, 'branch', 'other', 'origin/main');
+            write(here, 'ours.txt', 'ours\n');
+            git(here, 'add', 'ours.txt');
+            git(here, 'commit', '-q', '-m', 'Ours');
+            const before = git(here, 'rev-parse', 'HEAD');
+            const started = join(at, 'hook-started');
+            const hook = join(here, '.git', 'hooks', 'pre-merge-commit');
+            writeFileSync(hook, `#!/bin/sh\ntouch '${started}'\nexec sleep 600\n`);
+            chmodSync(hook, 0o755);
+            const roots = allowedRoots([], here);
 
+            const run = new AbortController();
+            const answer =
+                how === 'merge'
+                    ? merge(here, 'other', roots, run.signal)
+                    : pull(here, roots, run.signal);
+            await vi.waitUntil(() => existsSync(started), { timeout: 10000, interval: 20 });
+            run.abort();
+            const done = await answer;
+
+            expect(done.failure?.code).toBe('cancelled');
+            expect(done.failure?.left).toBe('merge');
+            expect(git(here, 'rev-parse', '--verify', '--quiet', 'MERGE_HEAD').trim()).toBe(
+                git(here, 'rev-parse', 'other').trim()
+            );
+            expect((await abortMerge(here, roots)).ok).toBe(true);
+            const stopped = {
+                ...done,
+                failure: { code: 'cancelled' as const, detail: '', program: 'git' }
+            };
+            expect((await stoppedOn(here, stopped, 'the merge')).failure?.left).toBeUndefined();
+            expect(git(here, 'rev-parse', 'HEAD')).toBe(before);
+            expect(git(here, 'status', '--porcelain', '--untracked-files=no')).toBe('');
+        }
+    );
+
     it('removes a worktree that is clean, and its branch with it', async () => {
         const path = worktreePath(repo, name);
         const answer = await removeWorktree(repo, path, ROOTS);
```

Fix, as a diff against the step's files (it applies to them: `git apply --check` passed from the root of the scratch copy):

```diff
--- a/tools/oculus/src/lib/server/core/git/running.ts
+++ b/tools/oculus/src/lib/server/core/git/running.ts
@@ -11,6 +11,7 @@
 // git ran does not outlive the command.
 
 import { execFileSync, type ChildProcess } from 'node:child_process';
+import { basename } from 'node:path';
 
 /** The runs in flight, by the root (git) or the mirror (deposit) each is about. */
 export type RunningGit = {
@@ -44,47 +45,94 @@
     };
 }
 
+/** How long a process asked to end is given before it is sent SIGKILL. */
+const GRACE_MS = 2000;
+
+/** The error a command ended by Cancel answers, which `classifyFailure` reads as `cancelled`. */
+function cancelled(): Error {
+    return Object.assign(new Error('cancelled'), { name: 'AbortError', code: 'ABORT_ERR' });
+}
+
 /**
- * Make every kill of `child` end the processes it started first: git's hooks, the ssh a fetch runs.
- * `execFile` ends a command that timed out or whose signal aborted with `child.kill`, which signals
- * the child alone, and what the child started would run on with no parent. The descendants are
- * read from the process table at the moment of the kill, then signalled, then the child.
+ * Make a kill of `child` (Cancel, its time limit, its output limit) end the processes it started
+ * and leave git to end on its own, and end `child` that way when `signal` aborts. Answers the
+ * error the command's answer classifies: the one `execFile` gave, or `cancelled` when Cancel ended
+ * the command.
+ *
+ * A merge whose pre-merge-commit hook is running already holds the merge's result in the index,
+ * and git writes MERGE_HEAD only once the hook has failed. So a kill signals the processes below
+ * git's own (a hook, the ssh of a fetch), passing over the git processes between them (the merge
+ * a pull runs), and git, seeing its hook fail, writes the merge state and exits; a git signalled
+ * itself there would leave the result with no merge in progress. A process still running
+ * `GRACE_MS` later is sent SIGKILL, and `child` is signalled itself when nothing below it is left.
+ * A command that started nothing is signalled at once.
+ *
+ * Cancel is listened for here rather than handed to `execFile` as its `signal`: on an abort
+ * `execFile` answers at once and closes the command's pipes, so git would die of SIGPIPE writing
+ * its reason, before it writes the merge state, and the answer would read the repository while git
+ * still runs. Handled here, the answer comes when git has exited.
  */
-export function killWithDescendants(child: ChildProcess): void {
+export function endWith(
+    child: ChildProcess,
+    signal?: AbortSignal
+): (error: Error | null) => Error | null {
     const kill = child.kill.bind(child);
-    child.kill = (signal) => {
-        for (const pid of descendantsOf(child.pid)) {
-            try {
-                process.kill(pid, 'SIGTERM');
-            } catch {
-                // The process has already ended.
-            }
-        }
-        return kill(signal);
+    child.kill = (sent) => {
+        if (endBelow(child.pid, 'SIGTERM') === 0) return kill(sent);
+        const late = setInterval(() => {
+            if (endBelow(child.pid, 'SIGKILL') === 0) kill(sent);
+        }, GRACE_MS);
+        late.unref();
+        child.once('exit', () => clearInterval(late));
+        return true;
     };
+    const cancel = (): void => void child.kill();
+    if (signal?.aborted === true) cancel();
+    else signal?.addEventListener('abort', cancel, { once: true });
+    child.once('exit', () => signal?.removeEventListener('abort', cancel));
+    return (error) => (error !== null && signal?.aborted === true ? cancelled() : error);
 }
 
 /**
- * The pids below `root` in the process table, nearest first; none when the table cannot be read.
+ * Signal the processes below `root` that are not git, each with every process below it, passing
+ * over the git processes on the way, as the process table holds them at this moment. Answers how
+ * many were signalled; none when the table cannot be read.
  */
-function descendantsOf(root: number | undefined): number[] {
-    if (root === undefined) return [];
+function endBelow(root: number | undefined, sent: NodeJS.Signals): number {
+    if (root === undefined) return 0;
     let table: string;
     try {
-        table = execFileSync('ps', ['-A', '-o', 'pid=', '-o', 'ppid='], { encoding: 'utf8' });
+        table = execFileSync('ps', ['-A', '-o', 'pid=', '-o', 'ppid=', '-o', 'comm='], {
+            encoding: 'utf8'
+        });
     } catch {
-        return [];
+        return 0;
     }
     const children = new Map<number, number[]>();
+    const names = new Map<number, string>();
     for (const row of table.split('\n')) {
-        const [pid, parent] = row.trim().split(/\s+/).map(Number);
-        if (!Number.isInteger(pid) || !Number.isInteger(parent)) continue;
+        const found = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(row);
+        if (found === null) continue;
+        const [pid, parent] = [Number(found[1]), Number(found[2])];
         children.set(parent, [...(children.get(parent) ?? []), pid]);
+        names.set(pid, basename(found[3].trim()));
     }
-    const found: number[] = [];
-    for (let next = [root]; next.length > 0;) {
-        next = next.flatMap((pid) => children.get(pid) ?? []);
-        found.push(...next);
+    const ending: number[] = [];
+    const below = (pid: number): number[] => children.get(pid) ?? [];
+    for (let next = below(root); next.length > 0;) {
+        const gits = next.filter((pid) => names.get(pid) === 'git');
+        for (let tree = next.filter((pid) => names.get(pid) !== 'git'); tree.length > 0;) {
+            ending.push(...tree);
+            tree = tree.flatMap(below);
+        }
+        next = gits.flatMap(below);
     }
-    return found;
+    for (const pid of ending) {
+        try {
+            process.kill(pid, sent);
+        } catch {
+            // The process has already ended.
+        }
+    }
+    return ending.length;
 }
--- a/tools/oculus/src/lib/server/git/git-write.ts
+++ b/tools/oculus/src/lib/server/git/git-write.ts
@@ -87,7 +87,7 @@
     statusRecords,
     type CommandFailure
 } from '../core/git/parse.ts';
-import { killWithDescendants } from '../core/git/running.ts';
+import { endWith } from '../core/git/running.ts';
 import { GIT, pathInside } from '../core/git/run.ts';
 import { permitted, realPath } from '../core/paths.ts';
 
@@ -157,13 +157,12 @@
                 encoding: 'utf8',
                 timeout,
                 maxBuffer: MAX_OUTPUT,
-                signal: extra.signal,
                 env: extra.env === undefined ? process.env : { ...process.env, ...extra.env }
             },
             (error, stdout, stderr) => {
                 if (error !== null) {
                     const said = classifyFailure(
-                        error,
+                        ended(error),
                         stdout,
                         stderr,
                         { timeoutMs: timeout, maxBytes: MAX_OUTPUT },
@@ -186,7 +185,7 @@
                 settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
             }
         );
-        killWithDescendants(child);
+        const ended = endWith(child, extra.signal);
         child.stdin?.end(extra.input ?? '');
     });
 }
--- a/tools/oculus/src/lib/server/git/deposit-git.ts
+++ b/tools/oculus/src/lib/server/git/deposit-git.ts
@@ -29,7 +29,7 @@
 import { execFile } from 'node:child_process';
 import { homedir } from 'node:os';
 import { isAbsolute, join } from 'node:path';
-import { killWithDescendants } from '../core/git/running.ts';
+import { endWith } from '../core/git/running.ts';
 import { GIT } from '../core/git/run.ts';
 import { inside } from '../core/paths.ts';
 import {
@@ -172,13 +172,12 @@
             {
                 encoding: 'utf8',
                 timeout,
-                maxBuffer: MAX_OUTPUT,
-                signal
+                maxBuffer: MAX_OUTPUT
             },
             (error, stdout, stderr) => {
                 if (error !== null) {
                     const said = classifyFailure(
-                        error,
+                        ended(error),
                         stdout,
                         stderr,
                         { timeoutMs: timeout, maxBytes: MAX_OUTPUT },
@@ -195,7 +194,7 @@
                 settle({ ok: true, output: typeof stdout === 'string' ? stdout : '', error: '' });
             }
         );
-        killWithDescendants(child);
+        const ended = endWith(child, signal);
     });
 }
 
```

What the fix leaves for the builder, which the diff does not carry:
- `DESIGN.md:366` describes `killWithDescendants`, the order "the processes it started with it" and the two limits (one `ps` read; `setsid`). It is rewritten for `endWith`: a kill ends the processes below git's own and leaves git to end through its failure path, so a merge cancelled during its hook is left in progress; a process still running after `GRACE_MS` gets SIGKILL, and git is signalled when nothing below it is left; the table is read again at each grace tick, so the first limit narrows to a child started and ended between two reads; the `setsid` limit stands. The head comment of `running.ts` (lines 9 to 11) names `killWithDescendants` and is rewritten the same way. HELP.md's Cancel paragraph (`:205` in the brief) is read and marked 'still true' or 'rewritten'.
- D20 round-1 item 19's ruling, that Cancel "ends the git process and its descendants", still holds. git now ends through its own exit once its hook has ended, and is signalled itself only when nothing below it is left or after the grace.
- `npm run diagrams` runs before the verify list, since the export of `running.ts` changes name.

Runs after the fix, in the scratch copy:

```
$ npx vitest run tests/server/git/git-write.test.ts --tagsFilter slow --reporter=verbose      (the whole file)
 PASS ... > the merge back > names the merge a cancelled merge left in progress, and Abort Merge takes it back 1194ms
 PASS ... > the merge back > names the merge a cancelled pull left in progress, and Abort Merge takes it back 888ms
      Tests  11 passed (11)
(after the abort-state assertion was added to the test: 2 passed | 9 skipped (11) with the fix, 2 failed without it, as quoted above)

red command, three runs:
RUN 1 to RUN 5: code=cancelled left=merge MERGE_HEAD=set verifies=true indexIsHead=false headMoved=false => GREEN   (each run)
RED 0 of 5 / Tests  1 passed (1)   (run 1, run 2, run 3)

pull variant (tests/server/git/diagpull.test.ts):
PULL 1 to PULL 5: code=cancelled left=merge MERGE_HEAD=set verifies=true ... => GREEN
PULLRED 0 of 5

the original, unshrunk case (tests/routes/git/diagorig.test.ts: POST merge through handleGit with the real operations and a running registry, POST cancel once the hook has started, then POST commit with the hook removed), five runs:
ORIG 1: cancel={"ok":true,"output":""} merge={"error":"Git was stopped by Cancel; the merge is left in progress"} commit={"ok":true,"output":"[main a4a87e5] Merge other\n"} parents=2 => GREEN
(ORIG 2 to ORIG 5 the same, with their own commit ids)
ORIGRED 0 of 5

a hook that ignores SIGTERM (`trap '' TERM; sleep 600`), three runs: each GREEN, about 3 s each (the 2 s grace, then SIGKILL); RED 0 of 3

$ npx vitest run tests/server/git tests/server/core tests/routes/git --reporter=dot
 Test Files  18 passed (18) /  Tests  69 passed (69)
$ npx vitest run tests/server/git tests/server/core tests/routes/git --tagsFilter slow --exclude 'tests/**/diag*.test.ts' --reporter=dot
 Test Files  11 passed | 4 skipped (15) /  Tests  43 passed | 23 skipped (66)
$ npx eslint (the three source files and the test file): exit 0; npx prettier --write over the changed files before the diffs were taken
```

Without the fix, the same runs: red command `RED 5 of 5`; pull variant `PULLRED 5 of 5`; original case `ORIG 1` to `ORIG 5: ... merge={"error":"Git was stopped by Cancel"} commit={"ok":true,"output":"[main ...] Merge other\n 1 file changed, 1 insertion(+)\n create mode 100644 b.txt\n"} parents=1 => RED`, `ORIGRED 5 of 5`.

No test reaches it: not applicable. No test is written: not applicable (the test is G44's, held by Z543's ruling as above).

## Cleanup

```
grep -rn "DIAG-7c3e" over the scratch copy's src and tests, before its removal: no output
git worktree remove --force "$TMPDIR/diagnose.aGxFX2/tree" (from the main checkout), then rm -rf "$TMPDIR/diagnose.aGxFX2"
```

The probe files (`diagred.test.ts`, `diagpull.test.ts`, `diagorig.test.ts`, `diagtrap.test.ts`, `shell.sh`, the copies of the original files) lived only in the scratch copy and its folder and went with it. No credential or `.env` file was copied. No `sleep 600` from a probe is left running (`pgrep -fl "sleep 600"` printed nothing after each run with the fix and after the last run without it). The step's worktree is unchanged; see the two outputs below. The red command run again on the original case: carried by the round as its check.

From inside the step's worktree, after the cleanup, the same as before the copy was made:

```
$ git status --short | wc -l
     107
(the same 14 `??` paths as listed under "Where the probes run")
$ git diff --binary 87c0a7a81 | shasum
a2cc1cdb371d9b0fc9aa930fcd9fd11b894bcb49  -
$ git worktree list | grep -c diagnose
0
```
