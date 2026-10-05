# Diagnosis: a Files-view Delete takes about five seconds and its rows stay meanwhile

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says; no output below held one. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding.

Step X3e of plan oculus/migration, ruling Z441 (`agents/briefs/X3e.md:23`, `:187`). Brief-check form, no person present: Steps 2 to 7, 11 to 19, 22 and 23 of the `diagnose` skill. The rest of X3a-1 (the tree not following the disk) is X3e's item C1 and is not diagnosed here.

## Symptom

`tools/oculus/.scratch/migration/agents/reviews/owed-looks.md:122`, X3a-1, its last sentence: "Delete took about five seconds and the deleted rows stayed meanwhile." The Delete was taken from the Files view's tree on TEST, over two files of the throwaway folder `zz-look-files` in the hub root (`owed-looks.md:120`: "the Delete question naming both files with "Move to Trash"").

The change log the server kept of that Delete (read-only, `grep -n '"trash"\|zz-look-files' ~/.oculus/changes.jsonl`, and `cat ~/.oculus/history/deletes.json`):

```
35:{"at":"2026-10-02T15:57:14.990Z","kind":"files","file":"zz-look-files/one.txt","key":"files","field":"trash","before":[{"path":"/Users/axelfaes/workspace/research-hub/zz-look-files/one.txt",...,"kept":"20261002T155702868"},{"path":"/Users/axelfaes/workspace/research-hub/zz-look-files/two.txt",...
{"deletes":[{"folder":"972503d9248700e3","id":"20261002T155702868","at":1790956622868},{"folder":"fb70c3ee2035c23a","id":"20261002T155711256","at":1790956631256}]}
```

`removeItems` (`src/lib/server/files/fs/ops.ts:480-505` at main's head) keeps a copy of an item (`stampKept`, which names the copy by the time it is made) and then awaits its trash call, item by item, and the record is appended when the operation ends (`handleOps`, `:668-702`). So on the server: one.txt's copy at 15:57:02.868, two.txt's copy at 15:57:11.256 (8.4 s later, the trash call of one.txt in between), the record at 15:57:14.990 (3.7 s after, the trash call of two.txt). Builders were running in worktrees under the hub at that hour (`git log --since='2026-10-02 16:30' --until='2026-10-02 19:30' --format='%ad %h %s' --date=iso`: "Launch S4's builder" 16:44, "Launch D17's builder" 16:37, "Launch D14's builder" 16:33, "Send D32's repair round 1" 17:14; 15:57 UTC is 17:57 local). The server serving 8790 is `vite dev` (`ps -axo pid,ppid,lstart,command`: `89237 ... node .../tools/oculus/node_modules/.bin/vite dev`), started 2026-10-03, after the look; its output goes to a terminal (`lsof -p 89237`: fd 1 and 2 are `/dev/ttys003`), so no server log of the look exists to read.

## Where the probes run

A detached worktree of main's head 6dd4684a45ca649533cf94e11e85662a83c2e737 at `$tmp/tree`, `tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.TMUguI`, made by `git worktree add --detach "$tmp/tree" HEAD` from the main checkout; nothing applied. Its `tools/oculus/node_modules` is a real folder of links to each entry of the main checkout's `node_modules`, the cache folders (`.vite`, `.cache`, `.vite-temp`, `.experimental-vitest-cache`, `.svelte2tsx-language-server-files`) left out, so no run wrote into the main checkout. Four scratch clones of the hub at the same commit stand for the builders' worktrees, inside the scratch tree where the hub keeps its worktrees: `git clone -q --shared --no-checkout /Users/axelfaes/workspace/research-hub $tmp/tree/.agents/worktrees/w<n>` and `git -C ... checkout -q --detach 6dd4684a4`, n = 1 to 4. The paths redirected under `$TMPDIR`: HOME (`HOME=$tmp/home` on every node and npx run, so `~/.oculus` was never written); `GIT_CONFIG_GLOBAL=/Users/axelfaes/.gitconfig` keeps git reading the real global config, which it only reads. ORDO_STABLE and ORDO_SKILL_DIRS: not touched by these runs. The scratch files the Delete moves are made under `$tmp/tree/zz-diag-x3e/` and go to the real macOS Trash (the program `node_modules/trash/lib/macos-trash` moves to the user's Trash whatever HOME says).

A brief-check finding: no step worktree is read, so no `git status --short` or diff hash is taken.

## Red command

The harness `$tmp/red2.mjs` (quoted whole under "The red command's harness" below) runs the server's own code in one node process as the server runs it: the git watcher (`watchGit` of `src/lib/server/root/watch/git.ts`) over the scratch hub as its `always` root and over the scratch clones as further roots, a writer in its own process appending to a tracked file of each clone every 200 ms (a builder's edits), and `handleOps` (`src/lib/server/files/fs/ops.ts`, what `POST /api/ops` calls) with `{ op: 'trash', root, paths }` over scratch files in a folder of the scratch hub, the Trash call the library's own (wrapped only to time it). After the answer it asks for the folder's listing (`listShown` of `src/lib/server/files/fs.ts`, what the page's relist reaches) as a macrotask, as a request arriving behind the event loop is served. It prints the answer's time, each trash call, the relist, and the longest stall of the event loop (a 10 ms interval timer that notes how late it ran).

```
cd $tmp/tree/tools/oculus && W=$tmp/tree/.agents/worktrees && env HOME=$tmp/home GIT_CONFIG_GLOBAL=/Users/axelfaes/.gitconfig DIAG_TMP=$tmp DIAG_ROOTS=$W/w1,$W/w2,$W/w3,$W/w4 DIAG_WRITE_MS=200 node $tmp/red2.mjs
```

Red is the answer's mean over the runs above 1000 ms (exit 1, the last line `RED: ...`). The baseline it is stated from: the same harness with the watcher over the scratch hub alone and no writer, 5 runs, mean 370 ms, sd 42 ms (`node $tmp/red2.mjs` with `DIAG_N=2 DIAG_RUNS=5`, no `DIAG_ROOTS`: "N=2 runs=5 answer mean 370 ms sd 42 min 323 max 437"); the requirement, a Delete that answers as VS Code's does, is under a second; 1000 ms is about fifteen standard deviations above the quiet mean and a fifth of the five seconds seen.

Runs, with the output of each quoted (two files per Delete, the copy kept and the change log written, five Deletes per run):

```
run 1:
watcher on, first read 15817 ms
run 0: ok=true gone=true answer 5552 ms; relist 1269 ms; trash calls 2767, 2735 ms; longest loop stall 2491 ms
run 1: ok=true gone=true answer 5612 ms; relist 1724 ms; trash calls 2795, 2784 ms; longest loop stall 1583 ms
run 2: ok=true gone=true answer 5859 ms; relist 1115 ms; trash calls 2929, 2900 ms; longest loop stall 1585 ms
run 3: ok=true gone=true answer 6104 ms; relist 1485 ms; trash calls 2974, 3101 ms; longest loop stall 1775 ms
run 4: ok=true gone=true answer 6189 ms; relist 1999 ms; trash calls 3247, 2900 ms; longest loop stall 2144 ms
N=2 runs=5 answer mean 5863 ms sd 255 min 5552 max 6189; files messages 139
RED: answer mean 5863 ms over 1000 ms

run 2:
watcher on, first read 10416 ms
run 0: ok=true gone=true answer 8206 ms; relist 1812 ms; trash calls 4945, 3177 ms; longest loop stall 3331 ms
run 1: ok=true gone=true answer 5729 ms; relist 1339 ms; trash calls 2898, 2784 ms; longest loop stall 1593 ms
run 2: ok=true gone=true answer 7137 ms; relist 1800 ms; trash calls 3728, 3354 ms; longest loop stall 1989 ms
run 3: ok=true gone=true answer 8118 ms; relist 1045 ms; trash calls 4254, 3817 ms; longest loop stall 4243 ms
run 4: ok=true gone=true answer 6887 ms; relist 1922 ms; trash calls 3280, 3548 ms; longest loop stall 2123 ms
N=2 runs=5 answer mean 7215 ms sd 908 min 5729 max 8206; files messages 137
RED: answer mean 7215 ms over 1000 ms
exit 1

run 3:
watcher on, first read 3519 ms
run 0: ok=true gone=true answer 9026 ms; relist 4296 ms; trash calls 2830, 6122 ms; longest loop stall 3607 ms
run 1: ok=true gone=true answer 4341 ms; relist 2490 ms; trash calls 1556, 2748 ms; longest loop stall 1746 ms
run 2: ok=true gone=true answer 6047 ms; relist 1536 ms; trash calls 2533, 3462 ms; longest loop stall 2549 ms
run 3: ok=true gone=true answer 5675 ms; relist 1867 ms; trash calls 2757, 2887 ms; longest loop stall 1780 ms
run 4: ok=true gone=true answer 5598 ms; relist 1016 ms; trash calls 2721, 2844 ms; longest loop stall 1858 ms
N=2 runs=5 answer mean 6137 ms sd 1555 min 4341 max 9026; files messages 126
RED: answer mean 6137 ms over 1000 ms
exit 1
```

Over the fifteen Deletes the answer's mean is 6405 ms (5863, 7215, 6137 per run), the relist after it 1.0 to 4.3 s, each trash call 1.6 to 6.1 s: the five seconds seen, and the rows' stay after the answer.

Runs after the tightening (three Deletes per run, a 2.5 s gap: `DIAG_RUNS=3 DIAG_GAP_MS=2500`; every file under `$tmp`; no network is used; nothing random):

```
== tightened, full case
N=2 runs=3 answer mean 6450 ms sd 1255 min 5076 max 8110; files messages 76
RED: answer mean 6450 ms over 1000 ms
```

## No red command

Not applicable.

## Shrunk case

Each cut is one change of the environment variables of the tightened command, the rest as it was.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The git watcher (`DIAG_WATCH=0`; the first harness, `$tmp/red.mjs`, a bare folder with no watcher, gave the same: "N=2 runs=5 mean 111 ms sd 73 ms", "GREEN") | green: "N=2 runs=3 answer mean 146 ms sd 39 min 93 max 187; files messages 0" | put back |
| The writers (`DIAG_WRITE_MS=0`, four roots still watched) | green: "N=2 runs=3 answer mean 308 ms sd 133 min 122 max 420; files messages 8" | put back |
| The four clones as watched roots (`DIAG_ROOTS=` with the writes kept, which the hub root's recursive watch still sees) | green: "N=2 runs=3 answer mean 120 ms sd 28 min 86 max 155; files messages 8" | put back |
| Three of the four roots (one written root) | green: "N=2 runs=3 answer mean 123 ms sd 40 min 90 max 180; files messages 18" | put back |
| The kept copy and the change log (`DIAG_NOKEEP=1`) | red: "N=2 runs=3 answer mean 6848 ms sd 1279 min 5250 max 8381; files messages 76" | cut |
| The second file (`DIAG_N=1`) | red: "N=1 runs=3 answer mean 3459 ms sd 181 min 3219 max 3653; files messages 64" | cut |
| Two of the four roots, on the case with both cuts above | red once: "N=1 runs=3 answer mean 2134 ms sd 1144 min 1095 max 3728"; green on the next run: "N=1 runs=3 answer mean 297 ms sd 379 min 25 max 833" | put back: two written roots are red only sometimes |
| On the shrunk case below: one of two roots | green: "N=1 runs=3 answer mean 42 ms sd 19" | put back |
| On the shrunk case below: the writers | green: "N=1 runs=3 answer mean 212 ms sd 102" | put back |
| On the shrunk case below: the watcher | green: "N=1 runs=3 answer mean 91 ms sd 92" | put back |

The shrunk case, as it stands: the git watcher over the scratch hub and four scratch clones as further roots, each clone written every 200 ms by another process, and a Delete of one scratch file in a folder of the hub; no kept copy and no change log. Its runs:

```
== shrunk case: one file, no kept copy or log, four written roots
run 0: ok=true gone=true answer 2647 ms; relist 1546 ms; trash calls 2643 ms; longest loop stall 1455 ms
run 1: ok=true gone=true answer 4847 ms; relist 2275 ms; trash calls 4846 ms; longest loop stall 4111 ms
run 2: ok=true gone=true answer 4226 ms; relist 2464 ms; trash calls 4225 ms; longest loop stall 3008 ms
N=1 runs=3 answer mean 3907 ms sd 926 min 2647 max 4847; files messages 61
RED: answer mean 3907 ms over 1000 ms
```

## Hypotheses

1. If the git watcher's re-read of a root runs its git commands synchronously on the server's one event loop (`statusFor` at `root/watch/git.ts:239`, about ten `spawnSync` calls through `run` at `core/git/run.ts:145-180`), and while builders write under several roots those reads come back to back and hold the loop while the Trash program's exit and the answer wait to be handled, then running the same reads off the event loop turns the red command green. Falsified by: the answer's mean still over 1000 ms with the reads off the loop. More written roots make it worse (seen: four roots red every run, two red only sometimes, one green).
2. If the git processes the watcher starts slow the Trash program itself (CPU and disk contention), then the program's own time, timed around a blocking `spawnSync` of `node_modules/trash/lib/macos-trash` so that no wait on the loop is counted, is over 1000 ms on the shrunk case. Falsified by: the program's own time well under 1000 ms on the shrunk case.
3. If the rows stay after the answer because the listing the page asks for (`relistFolder` then `GET /api/fs`, whose `listShown` runs `git check-ignore` synchronously) is slow in itself, then the listing's own time accounts for the relist. Falsified by: the listing's own time, from the moment its callback starts to its end, under 100 ms while the relist takes seconds.

No other cause is live: the shrink kept the case red with the kept copy, the change log and the second file cut, so neither the local-history copy (`stampKept`) nor the change log nor a Delete of several items is one. The `files` message's throttle (`THROTTLE = 2000`, `root/watch/git.ts:77`) is not on the path of the rows: the page takes the rows out only by relisting the parent folder once the server has answered (`remove` and `landed`, `state/sources/explorer/ops.svelte.ts:380-386` and `:413-423`), and the fs store hears a `files` message only when it names `bookmarks` (`state/sources/fs.svelte.ts:393-398`), so no `files` message relists a folder at main's head. The page removes no row before the answer (no optimistic removal; `trash` at `ops.svelte.ts:425-450` awaits `remove`, which awaits `send` and then `landed`), so the rows stay exactly as long as the answer and the relist take.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | The watcher's re-read sends `statusFor` to a worker thread (diff P1 below, tag `DIAG-7e3a`) | Shrunk case with two roots: "N=1 runs=3 answer mean 113 ms sd 77 min 36 max 219", GREEN. Original case (two files, kept copy, log, four roots): "N=2 runs=3 answer mean 273 ms sd 88 min 153 max 362", GREEN. Shrunk case with four roots: "run 0 answer 41 ms; relist 19 ms; ... longest loop stall 2 ms", "N=1 runs=3 answer mean 55 ms sd 27 min 31 max 92", GREEN. The same git reads still ran (files messages 24, 45, 40). Without the change: red, as above. | still standing |
| 2 | The harness's trash call runs the Trash program with a blocking `spawnSync` and times it (`DIAG_SYNC_TRASH=1`, harness lines tagged `DIAG-7e3a probe 2`) | Shrunk case with four roots: "trash calls 89 ms", "84 ms", "30 ms"; on two roots "25 ms", "28 ms", "22 ms". The answer, with nothing left to wait on the loop for, "N=1 runs=3 answer mean 69 ms sd 27" | falsified: the program takes 22 to 92 ms under the same load |
| 3 | The harness splits the relist into the wait before its callback starts and the listing's own time (`DIAG_SPLIT=1`, a folder holding a file the Delete leaves, so the listing asks git) | Shrunk case with four roots: "relist 4159 ms = wait 4149 ms + listing's own 10 ms", "relist 2784 ms = wait 2771 ms + listing's own 13 ms", "relist 2130 ms = wait 2121 ms + listing's own 9 ms"; the answers 4273, 4420, 3354 ms, RED | falsified: the listing takes 9 to 13 ms; the relist's seconds are the wait for the event loop, the cause of hypothesis 1 |

Diff P1 (applied to the scratch copy, run, and undone with `git checkout -- tools/oculus/src/lib/server/root/watch/git.ts` and the worker file removed):

```diff
--- a/tools/oculus/src/lib/server/root/watch/git.ts
+++ b/tools/oculus/src/lib/server/root/watch/git.ts
@@ -52,6 +52,7 @@
 import { existsSync, lstatSync, readdirSync, watch } from 'node:fs';
 import type { FSWatcher, Stats } from 'node:fs';
 import { dirname, join } from 'node:path';
+import { Worker } from 'node:worker_threads'; // DIAG-7e3a
 import { byKey } from '../../../data/helpers/guards.ts';
@@ -235,17 +236,18 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         if (rescan.delete(root) && scan(root)) follow();
         const began = Date.now();
         hub.publish('files', { root } satisfies FilesPayload);
-        try {
-            const next = byKey(statusFor([root], timeout), root);
+        const worker = new Worker(new URL('./diag-7e3a-worker.mjs', import.meta.url), { workerData: { root, timeout } }); // DIAG-7e3a
+        worker.once('message', (all: Record<string, GitState>) => { // DIAG-7e3a
+            void worker.terminate(); // DIAG-7e3a
+            if (closed) return; // DIAG-7e3a
+            const next = byKey(all, root);
             if (next === undefined) return;
             answered(root, began, next);
             const held = byKey(state, root);
             if (held !== undefined && JSON.stringify(held) === JSON.stringify(next)) return;
             state[root] = next;
             publish();
-        } catch (error) {
-            console.error(`git watch: reading ${root} failed: ${reason(error)}`);
-        }
+        }); // DIAG-7e3a
     };
--- /dev/null
+++ b/tools/oculus/src/lib/server/root/watch/diag-7e3a-worker.mjs
+// DIAG-7e3a probe: one root's git state read in a worker thread, off the server's event loop.
+import { parentPort, workerData } from 'node:worker_threads';
+const { statusFor } = await import('../../core/git/state.ts'); // DIAG-7e3a
+parentPort.postMessage(statusFor([workerData.root], workerData.timeout)); // DIAG-7e3a
```

## Cause

Hypothesis 1. The git watcher reads a root's git state with about ten synchronous git processes (`statusFor` to `state` in `src/lib/server/core/git/state.ts:95-180`, each command through `run`, whose `spawnSync` is at `src/lib/server/core/git/run.ts:156`), called from the watcher's re-read (`src/lib/server/root/watch/git.ts:239`) and its first read of new roots (`:431`), on the server's one event loop. A root is re-read on every write under it, at most once per two seconds per root. While builders write in several worktrees, each a watched root (a session's workspace), the reads of those roots come back to back and the loop is busy with them for seconds at a time (longest stall 1.5 to 4.2 s in the red runs). A Delete's Trash program finishes in 22 to 92 ms (probe 2), but its exit is handled only when the loop is free, so each trash call takes 1.6 to 6.1 s, item after item; and the listing the page asks for after the answer waits behind the same reads (probe 3: 2.1 to 4.1 s of wait, 9 to 13 ms of work). The probe that shows it: P1, the same reads run off the loop, turns the red command green (answer mean 55 ms on the shrunk case, 273 ms on the original case) and without it the red command is red (3907 ms, 5863 ms).

Which part of the five seconds each cause takes, on the original case (two files, four written roots, `$tmp/red2.mjs`, fifteen Deletes, answer mean 6405 ms): the Trash program's own work about 0.1 s (two calls of 22 to 92 ms, probe 2); the local-history copy and the change log nothing measurable (cutting them left the mean at 6848 ms against 6450 ms); the wait for the event loop behind the watcher's synchronous git reads the rest of the answer, about 6.3 s. After the answer the rows stay for the relist, 1.0 to 4.3 s, of which the listing's own work is 9 to 13 ms and the rest the same wait. The page's lack of an optimistic removal is why the rows are on screen for the whole of both; it costs nothing of its own (with the fix the answer and the relist together take about 0.17 s). The `files` message's throttle takes no part of it at main's head (Hypotheses, last paragraph). On TEST the server's own record of the look gives 8.4 s and 3.7 s for the two trash calls (Symptom).

The same cause holds every other request the server answers while the reads run: the first read of every root at start held the loop for 15.8, 10.4 and 3.5 s in the three red runs ("watcher on, first read 15817 ms"), and with the fix it returns in 2 to 7 ms. Whether the hub Graph's 10 s first wait, which X3e diagnoses in `X3e-diagnosis-graph.md`, shares it is not verified here.

## Fix and test

The fix makes the git watcher's state read asynchronous at the place that runs git: `run.ts` gains `runAsync`, which runs the same argument list with `execFile` and answers the same `Outcome` through one shared reading (`outcomeOf`); `statusFor` and the readers it calls in `state.ts` await `runAsync`, one command after another; the watcher queues every read (re-reads and first reads) on one chain (`chained` and `fsWrites` of `server/core/json.ts`), one at a time, so at most one git process runs for it as before, and a root already queued and not begun is queued once. A read that answers for a root dropped, or a watcher closed, while it ran keeps nothing (`live`). `worktrees`, which `compare.ts:344` reads on demand and synchronously, keeps its synchronous form; the state read takes the same list through `worktreesAsync`, both reading the answer through `worktreesOf`. The other synchronous git reads (`reads.ts`, `files.ts` with the listing's `check-ignore`, `compare.ts`) are on demand, one command per request, and are not the cause measured here (probe 3: 9 to 13 ms); they stay.

Files and lines at main's head (6dd4684a4) the fix changes:

- `tools/oculus/src/lib/server/core/git/run.ts`: head comment `:1-4`; the import `:79`; `run` `:138-180`; the slow-mount paragraph `:71-73`, split into `argvOf`, `outcomeOf`, `run`, and the new `runAsync` and `finishedOf`.
- `tools/oculus/src/lib/server/core/git/state.ts`: head comment `:1-4`; the import of `run.ts` `:33-43`; the new `WORKTREE_LIST` before `:44`; `statusFor` `:84-108`; `state` `:112-180`; `checkedOut` `:183-197`, `log` `:204`, `refs` `:220`, `stashes` `:235`, `remotes` `:241`, `worktrees` `:276-292`, `upstream` `:325-337` made asynchronous (`worktrees` kept synchronous beside `worktreesAsync` and `worktreesOf`).
- `tools/oculus/src/lib/server/root/watch/git.ts`: head comment after `:4`; the import `:63`; `refresh`'s doc comment `:183`; the queue beside `closed` `:218`; `live` before `publish` `:221`; `reread` `:225-249`; `follow`'s first read `:429-441`, moved into the new `readFresh` before `:449`.
- `tools/oculus/tests/server/git/refs/cherry-pick.test.ts:38` and `tools/oculus/tests/data/real-hub.probe.ts:128`: await `statusFor`.
- `tools/oculus/docs/diagrams/layer-server.dot` and `.svg`: regenerated by `npm run diagrams` (the edge from `server/root` to `server/core` counts 14 imports, was 13), which `tests/checks/diagrams/diagrams.test.ts` asks for.
- New: `tools/oculus/tests/server/root/watch/git-reread.test.ts`.

The test (the new file, in the fix diff below) starts the watcher over a scratch repository, waits for its first publish, writes a file, calls `watcher.refresh(root)` and sets an immediate timer; it asserts that the timer runs before the `git` channel's publish of the re-read. A read held on the loop publishes before the timer can run. It runs real git processes, so it is tagged slow (`agents/spec.md:57`).

Test, run on the tree without the fix (the fix stashed in the scratch copy, the test file kept):

```
$ HOME=$tmp/home npx vitest run tests/server/root/watch/git-reread.test.ts
   x re-reads a root off the event loop: a timer set at the refresh runs before the state is published 265ms
AssertionError: expected 'git' to be 'timer' // Object.is equality
Expected: "timer"
Received: "git"
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Fix:

```diff
diff --git a/tools/oculus/src/lib/server/core/git/run.ts b/tools/oculus/src/lib/server/core/git/run.ts
index 1d5d6fc40..01486cb72 100644
--- a/tools/oculus/src/lib/server/core/git/run.ts
+++ b/tools/oculus/src/lib/server/core/git/run.ts
@@ -1,7 +1,9 @@
-// Layer 2, server. The one place a git command is run: the call site every read-only git form of
-// this folder goes through (state.ts, reads.ts, files.ts, compare.ts), the outcome it answers with
-// and the small helpers they share. The git watcher, the file browser's listing and the git writes
-// all run git through this folder, so it sits in server/core, below every folder that reads git.
+// Layer 2, server. The one place a git command is run: the two call sites every read-only git form
+// of this folder goes through (state.ts, reads.ts, files.ts, compare.ts), `run`, which answers
+// while the caller waits, and `runAsync`, which the git watcher's state read uses so the event loop
+// goes on serving requests meanwhile, the outcome they answer with and the small helpers they
+// share. The git watcher, the file browser's listing and the git writes all run git through this
+// folder, so it sits in server/core, below every folder that reads git.
 //
 // What a session touched comes from its transcript. What the checkout looks like right now only git
 // can say, and that is state.ts: whether the root is a repository at all, the branch, the distance
@@ -68,7 +70,7 @@
 // dashboard watcher must never be the thing that runs one. compare.ts lists its own forms in its
 // head.
 //
-// A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
+// A repository on a slow mount must not stall a watcher, so each call site takes a list argument
 // (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
 // short reason. Data only, no rendered strings: the wording comes from the text catalog.
 //
@@ -76,7 +78,7 @@
 // `status --porcelain=v1 -z` are split by parse.ts's `statusRecords` and sorted into the change
 // lists by its `statusLists`.
 
-import { spawnSync } from 'node:child_process';
+import { execFile, spawnSync, type ExecFileException } from 'node:child_process';
 import { isUtf8 } from 'node:buffer';
 import { lstatSync, statSync } from 'node:fs';
 import { isAbsolute, join } from 'node:path';
@@ -136,29 +138,23 @@ export function readDiff(root: string, args: string[], timeout: number): Outcome
     return run(root, ['diff', ...args], timeout);
 }
 
+/** What a finished git process left that an outcome is read from, as spawnSync answers it. */
+type Finished = { error?: Error; status: number | null; stdout: unknown; stderr: unknown };
+
 /**
- * One git command, as a list, with a timeout. A non-zero exit, a broken git, or a repository too
- * slow to answer all come back as not ok with a short reason, and only the non-zero exit as
- * answered. The output is read as bytes, `utf8` says whether they were UTF-8, and `text` is them
- * decoded as UTF-8. This is the module's one call site.
+ * Every read runs without optional locks, so a status refresh never writes .git/index.lock and
+ * never collides with a commit the owner is making in the same repository.
  */
-export function run(
-    root: string,
-    args: string[],
-    timeout: number,
-    input?: string,
-    env?: Record<string, string>
-): Outcome {
-    // Every read runs without optional locks, so a status refresh never writes .git/index.lock and
-    // never collides with a commit the owner is making in the same repository.
-    const argv = ['-C', root, '--no-optional-locks', ...args];
-    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
-    const done = spawnSync(GIT, argv, {
-        timeout,
-        input,
-        maxBuffer: MAX_OUTPUT,
-        ...(env === undefined ? {} : { env: { ...process.env, ...env } })
-    });
+function argvOf(root: string, args: string[]): string[] {
+    return ['-C', root, '--no-optional-locks', ...args];
+}
+
+/**
+ * A non-zero exit, a broken git, or a repository too slow to answer all come back as not ok with a
+ * short reason, and only the non-zero exit as answered. The output is read as bytes, `utf8` says
+ * whether they were UTF-8, and `text` is them decoded as UTF-8.
+ */
+function outcomeOf(done: Finished): Outcome {
     if (done.error !== undefined) {
         const failure = done.error as NodeJS.ErrnoException;
         const text = failure.code === 'ETIMEDOUT' ? 'git timed out' : short(failure);
@@ -178,6 +174,58 @@ export function run(
     };
 }
 
+/**
+ * One git command, as a list, with a timeout, answered while the caller waits. This and runAsync
+ * are the module's two call sites.
+ */
+export function run(
+    root: string,
+    args: string[],
+    timeout: number,
+    input?: string,
+    env?: Record<string, string>
+): Outcome {
+    // A list, never a shell, and a timeout: a hung git must not hang a watcher.
+    const done = spawnSync(GIT, argvOf(root, args), {
+        timeout,
+        input,
+        maxBuffer: MAX_OUTPUT,
+        ...(env === undefined ? {} : { env: { ...process.env, ...env } })
+    });
+    return outcomeOf(done);
+}
+
+/**
+ * The same command as run, answered without holding the event loop while git works. The git
+ * watcher reads every root this way: its reads run on every write under a root, and a read held
+ * on the loop holds every request the server is answering meanwhile, a Delete waiting on the Trash
+ * among them. A process the timeout killed is a timeout; one a signal ended otherwise is a git that
+ * failed, as spawnSync reports them.
+ */
+export function runAsync(root: string, args: string[], timeout: number): Promise<Outcome> {
+    return new Promise((answer) => {
+        execFile(
+            GIT,
+            argvOf(root, args),
+            { timeout, maxBuffer: MAX_OUTPUT, encoding: 'buffer' },
+            (error, stdout, stderr) => {
+                answer(outcomeOf(finishedOf(error, stdout, stderr)));
+            }
+        );
+    });
+}
+
+/** What execFile answered, in the shape spawnSync answers with. */
+function finishedOf(error: ExecFileException | null, stdout: Buffer, stderr: Buffer): Finished {
+    if (error === null) return { status: 0, stdout, stderr };
+    if (typeof error.code === 'string') return { error, status: null, stdout, stderr };
+    if (error.killed === true) {
+        const timedOut = Object.assign(new Error('git timed out'), { code: 'ETIMEDOUT' });
+        return { error: timedOut, status: null, stdout, stderr };
+    }
+    return { status: typeof error.code === 'number' ? error.code : null, stdout, stderr };
+}
+
 // ---------------------------------------------------------------- small stuff
 
 /**
diff --git a/tools/oculus/src/lib/server/core/git/state.ts b/tools/oculus/src/lib/server/core/git/state.ts
index 550cb28e6..801a41683 100644
--- a/tools/oculus/src/lib/server/core/git/state.ts
+++ b/tools/oculus/src/lib/server/core/git/state.ts
@@ -1,7 +1,10 @@
 // Layer 2, server. Read-only git state for a root: whether it is a repository, its branch, its
 // distance from the upstream, and the staged, changed and untracked lists, with the log, the refs,
 // the stashes, the worktrees and the sequencer the `git` channel carries. Every command goes
-// through run.ts; this file only decides which to ask and how to read the answers.
+// through run.ts; this file only decides which to ask and how to read the answers. The channel's
+// read, statusFor, runs its commands through runAsync, one after another, so it never holds the
+// server's event loop while git works. `worktrees`, which compare.ts reads on demand, answers
+// while the caller waits, and statusFor takes the same list through `worktreesAsync`.
 //
 // A repository on a slow mount must not stall a watcher: a read that fails is collapsed into the
 // empty shape with a short reason, and nothing here throws.
@@ -36,11 +39,16 @@ import {
     exists,
     milliseconds,
     run,
+    runAsync,
     seen,
     short,
-    whole
+    whole,
+    type Outcome
 } from './run.ts';
 
+/** The one form of `worktree` run here. */
+const WORKTREE_LIST = ['worktree', 'list', '--porcelain'];
+
 /** One workspace with 4000 untracked files, or 4000 branches, must not become the payload. */
 export const MAX_ENTRIES = 200;
 /**
@@ -82,24 +90,27 @@ export function empty(error: string | null = null): GitState {
 }
 
 /**
- * Read-only git state for each root, keyed by root. Never throws. A root with nothing at its path,
- * or that git answered is not a repository, comes back as the empty shape with `error` set and
- * `repository` false; `present` is false for the first of those two alone, read at the path each
- * time the answer is made, so a caller can say the folder is not there rather than that it is no
- * repository. A root whose check did not answer (a timeout, a git that would not start), a root git
- * refused for a reason other than holding no repository, and a repository where a later read fails
- * all keep `repository` true and say why in `error`, so neither a slow mount nor an unreadable
- * config makes a repository disappear. A caller renders every workspace without a special case. A
- * repeated root is read once.
+ * Read-only git state for each root, keyed by root, the roots read one after another. Never
+ * rejects. A root with nothing at its path, or that git answered is not a repository, comes back as
+ * the empty shape with `error` set and `repository` false; `present` is false for the first of
+ * those two alone, read at the path each time the answer is made, so a caller can say the folder is
+ * not there rather than that it is no repository. A root whose check did not answer (a timeout, a
+ * git that would not start), a root git refused for a reason other than holding no repository, and
+ * a repository where a later read fails all keep `repository` true and say why in `error`, so
+ * neither a slow mount nor an unreadable config makes a repository disappear. A caller renders
+ * every workspace without a special case. A repeated root is read once.
  */
-export function statusFor(roots: string[], timeout: number = TIMEOUT_MS): Record<string, GitState> {
+export async function statusFor(
+    roots: string[],
+    timeout: number = TIMEOUT_MS
+): Promise<Record<string, GitState>> {
     const out: Record<string, GitState> = {};
     if (!Array.isArray(roots)) return out;
     const ms = milliseconds(timeout);
     for (const root of roots) {
         if (typeof root !== 'string' || root === '' || root in out) continue;
         try {
-            out[root] = state(root, ms);
+            out[root] = await state(root, ms);
         } catch (error) {
             out[root] = empty(short(error));
         }
@@ -109,7 +120,7 @@ export function statusFor(roots: string[], timeout: number = TIMEOUT_MS): Record
 
 // ---------------------------------------------------------------- one root
 
-function state(root: string, timeout: number): GitState {
+async function state(root: string, timeout: number): Promise<GitState> {
     // A path with nothing at it is the one root git is never asked about. A path that is there and
     // is no directory, and one nothing may enter, are handed to git like any other, so the reader
     // gets git's own reason for them instead of being told the folder is gone.
@@ -122,7 +133,7 @@ function state(root: string, timeout: number): GitState {
     // none yet answers it like any other. Only a check that timed out says nothing about the root,
     // which is then kept as the repository it was taken for; a git that cannot start or is killed
     // is taken at its word, so a plain folder never becomes a repository because git is missing.
-    const gitDir = run(root, ['rev-parse', '--git-dir'], timeout);
+    const gitDir = await runAsync(root, ['rev-parse', '--git-dir'], timeout);
     if (!gitDir.ok && gitDir.answered) {
         const reason = gitDir.text || NO_REPOSITORY;
         const refused = empty(reason);
@@ -146,21 +157,21 @@ function state(root: string, timeout: number): GitState {
         found.error = gitDir.text || 'git failed';
         return found;
     }
-    if (!checkedOut(root, found, timeout)) return found;
-    upstream(root, found, timeout);
-    found.log = log(root, timeout);
-    const listed = refs(root, timeout);
+    if (!(await checkedOut(root, found, timeout))) return found;
+    await upstream(root, found, timeout);
+    found.log = await log(root, timeout);
+    const listed = await refs(root, timeout);
     found.branches = listed.branches;
     found.tags = listed.tags;
     // The reflog is walked only where a stash is kept, and the remotes are read only where Publish
     // Branch can be offered, a branch that tracks nothing; either read is a process per root on
     // every event, which the repositories that have no use for it do not pay.
-    found.stashes = listed.stash ? stashes(root, timeout) : [];
-    found.remotes = found.upstream || found.detached ? [] : remotes(root, timeout);
-    found.worktrees = worktrees(root, timeout);
+    found.stashes = listed.stash ? await stashes(root, timeout) : [];
+    found.remotes = found.upstream || found.detached ? [] : await remotes(root, timeout);
+    found.worktrees = await worktreesAsync(root, timeout);
     found.ignoresWorktrees = ignored(root);
     sequenceOf(root, gitDir.text.trim(), found);
-    const listing = run(
+    const listing = await runAsync(
         root,
         ['status', '--porcelain=v1', '-z', '--untracked-files=normal', '--renames'],
         timeout
@@ -169,7 +180,7 @@ function state(root: string, timeout: number): GitState {
         found.error = listing.text || 'git status failed';
         return found;
     }
-    const counts = run(root, ['diff', '--numstat', '-z'], timeout);
+    const counts = await runAsync(root, ['diff', '--numstat', '-z'], timeout);
     const lines = parseNumstat(counts.ok ? counts.text : '');
     Object.assign(found, statusLists(statusRecords(listing.text), lines, MAX_ENTRIES));
     return found;
@@ -180,14 +191,14 @@ function state(root: string, timeout: number): GitState {
  * when nothing is checked out. A repository with no commit yet has a HEAD that resolves to nothing,
  * so the branch it will make is read from HEAD itself: that repository is ordinary, not an error.
  */
-function checkedOut(root: string, found: GitState, timeout: number): boolean {
-    const head = run(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
+async function checkedOut(root: string, found: GitState, timeout: number): Promise<boolean> {
+    const head = await runAsync(root, ['rev-parse', '--abbrev-ref', 'HEAD'], timeout);
     if (head.ok) {
         found.branch = head.text.trim();
         found.detached = found.branch === 'HEAD';
         return true;
     }
-    const unborn = run(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
+    const unborn = await runAsync(root, ['symbolic-ref', '--short', 'HEAD'], timeout);
     if (unborn.ok) {
         found.branch = unborn.text.trim();
         return true;
@@ -201,8 +212,8 @@ function checkedOut(root: string, found: GitState, timeout: number): boolean {
  * failure rather than an empty log, which is an empty list here like every other unreadable list:
  * the branch line above it is what says the repository is there.
  */
-function log(root: string, timeout: number): GitCommit[] {
-    const done = run(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
+async function log(root: string, timeout: number): Promise<GitCommit[]> {
+    const done = await runAsync(root, ['log', `-${LOG_ENTRIES}`, LOG_FORMAT], timeout);
     return done.ok ? parseLog(done.text) : [];
 }
 
@@ -217,8 +228,8 @@ export function capped<Row>(rows: Row[]): Row[] {
  * list capped like the change lists. One process reads all three, where a listing each would be
  * three processes per root on every event.
  */
-function refs(root: string, timeout: number): RefRows {
-    const done = run(
+async function refs(root: string, timeout: number): Promise<RefRows> {
+    const done = await runAsync(
         root,
         ['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash'],
         timeout
@@ -232,14 +243,18 @@ function refs(root: string, timeout: number): RefRows {
  * Every stash, newest first, read from the stash's reflog as `stash list` reads it. A repository
  * with no stash has no such reflog and answers with a failure, which is the empty list.
  */
-function stashes(root: string, timeout: number): GitStash[] {
-    const done = run(root, ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'], timeout);
+async function stashes(root: string, timeout: number): Promise<GitStash[]> {
+    const done = await runAsync(
+        root,
+        ['log', '--walk-reflogs', STASH_FORMAT, 'refs/stash', '--'],
+        timeout
+    );
     return done.ok ? capped(parseStashes(done.text)) : [];
 }
 
 /** The repository's remotes by name. */
-function remotes(root: string, timeout: number): string[] {
-    const done = run(root, ['remote'], timeout);
+async function remotes(root: string, timeout: number): Promise<string[]> {
+    const done = await runAsync(root, ['remote'], timeout);
     return done.ok ? capped(done.text.split('\n').filter((one) => one.trim() !== '')) : [];
 }
 
@@ -281,7 +296,16 @@ function sequenceOf(root: string, gitDir: string, found: GitState): void {
  * one vocabulary reaches the page and the checks a write makes.
  */
 export function worktrees(root: string, timeout: number = TIMEOUT_MS): GitWorktree[] {
-    const done = run(root, ['worktree', 'list', '--porcelain'], timeout);
+    return worktreesOf(root, run(root, WORKTREE_LIST, timeout));
+}
+
+/** The same list read without holding the event loop, as the `git` channel's state read asks. */
+async function worktreesAsync(root: string, timeout: number): Promise<GitWorktree[]> {
+    return worktreesOf(root, await runAsync(root, WORKTREE_LIST, timeout));
+}
+
+/** The worktrees `worktree list --porcelain` answered for a root, each under the root as asked. */
+function worktreesOf(root: string, done: Outcome): GitWorktree[] {
     if (!done.ok) return [];
     const real = realpath(root);
     return capped(parseWorktrees(done.text)).map((one) => ({
@@ -322,8 +346,12 @@ function ignored(root: string): boolean {
  * Distance from the tracking branch. `--left-right --count` prints behind, then ahead. A branch
  * with no upstream is ordinary, not an error, and leaves both counts at zero.
  */
-function upstream(root: string, found: GitState, timeout: number): void {
-    const done = run(root, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'], timeout);
+async function upstream(root: string, found: GitState, timeout: number): Promise<void> {
+    const done = await runAsync(
+        root,
+        ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
+        timeout
+    );
     // The command git answers here is the one that knows: it resolves @{upstream}, so a failure is
     // the branch having none. That fact travels with the state, which is on the page before the
     // branch listing is, so the push control never has to read a listing that has not answered as
diff --git a/tools/oculus/src/lib/server/root/watch/git.ts b/tools/oculus/src/lib/server/root/watch/git.ts
index 66ca439c9..d541f8fd4 100644
--- a/tools/oculus/src/lib/server/root/watch/git.ts
+++ b/tools/oculus/src/lib/server/root/watch/git.ts
@@ -3,6 +3,11 @@
 // "Watchers": git watches each workspace's .git and worktree and re-reads on change, no more often
 // than every two seconds.
 //
+// A read runs git without holding the event loop (state.ts reads through run.ts's runAsync), and
+// the reads of every root wait on one queue, one at a time. While builders write under several
+// roots, their reads come back to back; held on the loop they would hold every request meanwhile,
+// a Delete waiting on the Trash and the listing after it among them.
+//
 // The file browser's roots are the second source because the Repositories view is over every
 // repository the reader has told oculus about, not only the ones an agent happens to be working in.
 // They are read through the `roots` option at start, again on a `config` push, which is what says
@@ -61,6 +66,7 @@ import type {
     SessionsPayload
 } from '../../../data/model/index.ts';
 import type { Hub, Sink } from '../../core/channels.ts';
+import { chained, fsWrites } from '../../core/json.ts';
 import {
     POLL,
     pollFile,
@@ -180,7 +186,7 @@ function statOf(path: string): Stats | undefined {
  */
 /** A git watcher: a portfolio watcher that can also be told to re-read one root at once. */
 export type GitWatcher = Watcher & {
-    /** Re-read one root now, for a write that has just changed it. */
+    /** Re-read one root, queued behind the reads before it, for a write that just changed it. */
     refresh(root: string): void;
 };
 
@@ -216,6 +222,16 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     const readFrom = new Map<string, number>();
     let state: GitPayload = {};
     let closed = false;
+    /**
+     * The reads, one after another: each runs git without holding the event loop, and one at a time
+     * keeps the number of git processes where a synchronous read kept it.
+     */
+    const reads = fsWrites();
+    /** The roots whose re-read is queued and not begun, so a burst of events queues one read. */
+    const queued = new Set<string>();
+
+    /** Whether a root is still watched: a read that answers for one that is not keeps nothing. */
+    const live = (root: string): boolean => !closed && handles.has(root);
 
     /** Publish a copy, so a later re-read cannot change a payload already on the wire. */
     const publish = (): void => {
@@ -230,22 +246,30 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
     // a write that landed under this root, and the file listings taken under it are stale whether
     // or not git's answer moved. Nothing else on the wire says so for a file inside a project
     // folder.
+    //
+    // The read is queued behind the reads before it and answers later, so a root dropped or a
+    // watcher closed while it ran keeps nothing from it.
     const reread = (root: string): void => {
-        if (closed || !handles.has(root)) return;
-        if (rescan.delete(root) && scan(root)) follow();
-        const began = Date.now();
-        hub.publish('files', { root } satisfies FilesPayload);
-        try {
-            const next = byKey(statusFor([root], timeout), root);
-            if (next === undefined) return;
-            answered(root, began, next);
-            const held = byKey(state, root);
-            if (held !== undefined && JSON.stringify(held) === JSON.stringify(next)) return;
-            state[root] = next;
-            publish();
-        } catch (error) {
-            console.error(`git watch: reading ${root} failed: ${reason(error)}`);
-        }
+        if (!live(root) || queued.has(root)) return;
+        queued.add(root);
+        void chained(reads, async () => {
+            queued.delete(root);
+            if (!live(root)) return;
+            if (rescan.delete(root) && scan(root)) follow();
+            const began = Date.now();
+            hub.publish('files', { root } satisfies FilesPayload);
+            try {
+                const next = byKey(await statusFor([root], timeout), root);
+                if (next === undefined || !live(root)) return;
+                answered(root, began, next);
+                const held = byKey(state, root);
+                if (held !== undefined && JSON.stringify(held) === JSON.stringify(next)) return;
+                state[root] = next;
+                publish();
+            } catch (error) {
+                console.error(`git watch: reading ${root} failed: ${reason(error)}`);
+            }
+        });
     };
 
     /**
@@ -426,19 +450,7 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         }
         const fresh = roots.filter((root) => !handles.has(root));
         for (const root of fresh) open(root);
-        if (fresh.length > 0) {
-            try {
-                const found = statusFor(fresh, timeout);
-                for (const root of fresh) {
-                    const one = byKey(found, root);
-                    if (one !== undefined) state[root] = one;
-                    if (one !== undefined) answered(root, opening.get(root) ?? 0, one);
-                    last.set(root, Date.now());
-                }
-            } catch (error) {
-                console.error(`git watch: first read failed: ${reason(error)}`);
-            }
-        }
+        if (fresh.length > 0) void chained(reads, () => readFresh(fresh));
         reorder(roots);
         const after = Object.keys(state);
         if (before.length === after.length && before.every((root, at) => root === after[at]))
@@ -446,6 +458,29 @@ export function watchGit(hub: Hub, options: GitWatchOptions = {}): GitWatcher {
         publish();
     };
 
+    /**
+     * The first read of roots just opened, queued with the re-reads. A root dropped while it ran is
+     * left out; the payload is put in the order of the roots wanted when it answers.
+     */
+    const readFresh = async (fresh: string[]): Promise<void> => {
+        if (!fresh.some(live)) return;
+        try {
+            const found = await statusFor(fresh, timeout);
+            if (!fresh.some(live)) return;
+            for (const root of fresh) {
+                const one = byKey(found, root);
+                if (one === undefined || !live(root)) continue;
+                state[root] = one;
+                answered(root, opening.get(root) ?? 0, one);
+                last.set(root, Date.now());
+            }
+            reorder(wanted());
+            publish();
+        } catch (error) {
+            console.error(`git watch: first read failed: ${reason(error)}`);
+        }
+    };
+
     // The sink is this watcher's own end of the `sessions` channel. It sends nothing back and is
     // never closed by the hub, so `close` below is what removes it.
     const sink: Sink = {
diff --git a/tools/oculus/tests/data/real-hub.probe.ts b/tools/oculus/tests/data/real-hub.probe.ts
index 06dcfbc66..c7f409052 100644
--- a/tools/oculus/tests/data/real-hub.probe.ts
+++ b/tools/oculus/tests/data/real-hub.probe.ts
@@ -125,7 +125,7 @@ for (const workspace of first.workspaces) {
 
 // The hub's own git state, through server/core/git/state.ts's four read-only commands and nothing
 // else. It reads the repository and changes nothing in it, like everything else in this file.
-const state = statusFor([hub])[hub];
+const state = (await statusFor([hub]))[hub];
 console.log(
     `git ${hub}: branch ${state.branch || '(none)'}, ahead ${state.ahead}, behind ${state.behind}, ` +
         `staged ${state.staged.length}, unstaged ${state.unstaged.length}, ` +
diff --git a/tools/oculus/tests/server/git/refs/cherry-pick.test.ts b/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
index 1ffaa545f..30aac1b1d 100644
--- a/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
+++ b/tools/oculus/tests/server/git/refs/cherry-pick.test.ts
@@ -35,6 +35,6 @@ describe('cherryPick', () => {
         expect(git(root, 'log', '-1', '--format=%s').trim()).toBe('Other file');
         expect(git(root, 'rev-parse', 'HEAD').trim()).not.toBe(pick);
         expect(git(root, 'show', '--name-only', '--format=', 'HEAD').trim()).toBe('o.txt');
-        expect(statusFor([root])[root].sequence).toBe('');
+        expect((await statusFor([root]))[root].sequence).toBe('');
     });
 });
diff --git a/tools/oculus/tests/server/root/watch/git-reread.test.ts b/tools/oculus/tests/server/root/watch/git-reread.test.ts
new file mode 100644
index 000000000..6dade4e17
--- /dev/null
+++ b/tools/oculus/tests/server/root/watch/git-reread.test.ts
@@ -0,0 +1,44 @@
+// Layer 2, server test. The git watcher (server/root/watch/git.ts) reads a root's git state without
+// holding the server's event loop, so a request the server is answering meanwhile, a Delete waiting
+// on the Trash or the listing the Files view asks for after it, is not held behind the read.
+// @module-tag slow: the case runs git in a scratch repository.
+//
+// What this does NOT cover: how long a read takes, the throttle, the `files` channel, and the order
+// of the sections on the `git` channel.
+
+import { execFileSync } from 'node:child_process';
+import { writeFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { expect, vi } from 'vitest';
+import { it, scratchDir } from '../../../fixtures/scratch.ts';
+import { Hub } from '../../../../src/lib/server/core/channels.ts';
+import { watchGit } from '../../../../src/lib/server/root/watch/git.ts';
+
+it('re-reads a root off the event loop: a timer set at the refresh runs before the state is published', async () => {
+    const root = scratchDir('oculus-watch-git-');
+    execFileSync('git', ['init', '-q', root]);
+    const hub = new Hub();
+    const seen: string[] = [];
+    hub.subscribe(
+        {
+            send: (text) => {
+                if ((JSON.parse(text) as { channel: string }).channel === 'git') seen.push('git');
+                return Promise.resolve();
+            },
+            close: () => undefined
+        },
+        ['git']
+    );
+    const watcher = watchGit(hub, { always: root, throttle: 60_000 });
+    try {
+        await vi.waitFor(() => expect(seen).toContain('git'), { timeout: 10_000 });
+        writeFileSync(join(root, 'new.txt'), 'new\n');
+        seen.length = 0;
+        watcher.refresh(root);
+        setImmediate(() => seen.push('timer'));
+        await vi.waitFor(() => expect(seen).toContain('git'), { timeout: 10_000 });
+        expect(seen[0]).toBe('timer');
+    } finally {
+        watcher.close();
+    }
+});
```

Runs after the fix:

```
$ HOME=$tmp/home npx vitest run tests/server/root/watch/git-reread.test.ts      (five runs)
      Tests  1 passed (1)
      Tests  1 passed (1)
      Tests  1 passed (1)
      Tests  1 passed (1)
      Tests  1 passed (1)

== final fix: red command (shrunk case)          DIAG_RUNS=3 DIAG_N=1 DIAG_NOKEEP=1, four written roots
watcher on, first read 7 ms
DIAG-7e3a probe 3: relist 13 ms = wait 1 ms + listing's own 11 ms
run 0: ok=true gone=true answer 292 ms; relist 13 ms; trash calls 290 ms; longest loop stall 100 ms
DIAG-7e3a probe 3: relist 10 ms = wait 1 ms + listing's own 9 ms
run 1: ok=true gone=true answer 23 ms; relist 10 ms; trash calls 22 ms; longest loop stall 1 ms
DIAG-7e3a probe 3: relist 13 ms = wait 1 ms + listing's own 12 ms
run 2: ok=true gone=true answer 35 ms; relist 13 ms; trash calls 34 ms; longest loop stall 2 ms
N=1 runs=3 answer mean 117 ms sd 124 min 23 max 292; files messages 2, git messages 1
GREEN: answer mean 117 ms within 1000 ms
exit 0

== final fix: original case                      DIAG_RUNS=5 DIAG_N=2, kept copy and log, four written roots
watcher on, first read 2 ms
run 0: ok=true gone=true answer 201 ms; relist 33 ms; trash calls 55, 48 ms; longest loop stall 42 ms
run 1: ok=true gone=true answer 158 ms; relist 20 ms; trash calls 43, 34 ms; longest loop stall 35 ms
run 2: ok=true gone=true answer 126 ms; relist 18 ms; trash calls 25, 36 ms; longest loop stall 25 ms
run 3: ok=true gone=true answer 142 ms; relist 20 ms; trash calls 37, 31 ms; longest loop stall 33 ms
run 4: ok=true gone=true answer 162 ms; relist 21 ms; trash calls 53, 35 ms; longest loop stall 32 ms
N=2 runs=5 answer mean 158 ms sd 25 min 126 max 201; files messages 19, git messages 4
GREEN: answer mean 158 ms within 1000 ms
exit 0
```

That the watcher still reads every root as often, measured over the same fixed 30 s window with four clones written every 200 ms (`$tmp/cadence.mjs`, the watcher alone, the first 10 s left out):

```
== with the fix
30 s window: reads per root /.agents/worktrees/w3 10, tree 14, /.agents/worktrees/w1 11, /.agents/worktrees/w4 7, /.agents/worktrees/w2 9; git messages 0; longest loop stall 7 ms
== without the fix
30 s window: reads per root /.agents/worktrees/w2 11, /.agents/worktrees/w3 11, /.agents/worktrees/w4 11, tree 10, /.agents/worktrees/w1 10; git messages 0; longest loop stall 1780 ms
```

51 reads with the fix and 53 without; the state read itself takes as long either way (`$tmp/async-time.mjs`: `status` through `run` 145 to 154 ms and through `runAsync` 150 to 162 ms on the scratch hub; `statusFor` on the scratch hub 217 to 269 ms asynchronous against 206 to 242 ms synchronous after its first, cold read, `$tmp/status-time.mjs`; on the real hub, read-only, 201 to 257 ms synchronous). Under this load each root is read every 2 to 4 s with or without the fix; the fix leaves that as it is.

The project's gates in the scratch copy with the fix: `npm test`: "Test Files 76 passed | 17 skipped (93)", "Tests 185 passed | 59 skipped (244)", exit 0; `npm run test:checks`: "Test Files 15 passed | 1 skipped (16)", "Tests 223 passed | 4 skipped (227)", exit 0; `npx vitest run tests/server/root/watch/git-reread.test.ts tests/server/git/refs tests/server/git/git-write.test.ts tests/server/git/git-ops.test.ts` (the slow git tests, G33's among them): "Test Files 6 passed (6)", "Tests 30 passed (30)"; `npx svelte-check --tsconfig ./tsconfig.json --threshold error`: "COMPLETED 2777 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"; `npx prettier --check` and `npx eslint` over the six changed files: clean, exit 0.

No test reaches it: not applicable. No test is written: not applicable; the test above is written and run, and it lands only under a ruling, since `agents/spec.md:57` allows a test only as the test of an `agents/guarded.md` entry and no entry covers the watcher (`grep -n "watch/git\|core/git/state\|core/git/run\|statusFor" agents/guarded.md` prints nothing). A slow Delete loses no work and accepts no wrong configuration, so the rules file does not by itself ask for this test. Whether to add an entry ("the git watcher's reads never hold the server's event loop", Code `src/lib/server/root/watch/git.ts`, `src/lib/server/core/git/state.ts`, Test the file above) is Axel's ruling; without it the builder lands the fix and not the test.

What the fix changes that a reader can see, and what it leaves:

- The first read of the roots at start, and the first read of a root added later, publish when they answer and not before the watcher returns: the `git` channel's first message after a start comes once every new root has been read, and a root dropped while its read ran is left out. Under `follow`, a set of roots that only changed order is still published at once, as before.
- X3e's item C1 rewrites the same `reread` (`agents/briefs/X3e.md:127`: the folders collected per root and published with the re-read). The builder writes C1 into the queued form above: the folders are collected as now and published when the queued read begins, where `hub.publish('files', ...)` stands in the fix.
- The `refresh` the autofetch timer calls (`server/root/context.ts`, `owned().git.refresh(root)`) now queues the read and returns at once; it returned after the read before. Its caller calls it last in a fetch's handler and reads nothing after it (`server/root/watch/autofetch.ts:183`, `options.refresh(root)`, typed `(root: string) => void` at `:52`), so nothing waits on it.

Doc text for the landing (`DESIGN.md:116`, the Watchers paragraph), after "so it re-reads on change no more often than every two seconds.": "Its reads run git through `runAsync` of `server/core/git/run.ts`, every root's on one queue and one at a time, so a read never holds the event loop and a request the server answers meanwhile, a Delete waiting on the Trash among them, is not held behind it."

## The red command's harness

`$tmp/red2.mjs` as it stood for the runs above (the probe lines tagged `DIAG-7e3a`, outside the tree the probes changed):

```js
// Red command for X3e's five-second Delete: the server path of a Files-view Delete, in one process
// as the server runs it: the git watcher over the root (a copy of the hub) and POST /api/ops `trash`
// of DIAG_N scratch files in a folder of that root. Times the answer, each trash call, and the
// longest stall of the event loop meanwhile.
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const T = process.env.DIAG_TMP;
const N = Number(process.env.DIAG_N ?? 2);
const RUNS = Number(process.env.DIAG_RUNS ?? 5);
const LIMIT = Number(process.env.DIAG_LIMIT_MS ?? 1000);
const WATCH = process.env.DIAG_WATCH !== '0';
const GAP = Number(process.env.DIAG_GAP_MS ?? 3000);
const src = join(T, 'tree/tools/oculus/src/lib');
const { handleOps } = await import(join(src, 'server/files/fs/ops.ts'));
const { watchGit } = await import(join(src, 'server/root/watch/git.ts'));
const { Hub } = await import(join(src, 'server/core/channels.ts'));
const trashLib = (await import(join(T, 'tree/tools/oculus/node_modules/trash/index.js'))).default;
const root = process.env.DIAG_ROOT ?? join(T, 'tree');
const { listShown } = await import(join(src, 'server/files/fs.ts'));
const { spawn } = await import('node:child_process');
const extra = (process.env.DIAG_ROOTS ?? '').split(',').filter((one) => one !== '');
const WRITE_MS = Number(process.env.DIAG_WRITE_MS ?? 0);
const LOAD = Number(process.env.DIAG_LOAD ?? 0);
const children = [];
// Writers in their own process, as builders are: each appends to a tracked file of each extra root.
const writeDirs = (process.env.DIAG_WRITE_DIRS ?? process.env.DIAG_ROOTS ?? '').split(',').filter((one) => one !== '');
if (WRITE_MS > 0 && writeDirs.length > 0) {
  const code = 'const fs=require("fs");const r=JSON.parse(process.argv[1]);setInterval(()=>{for(const x of r)fs.appendFileSync(x+"/README.md","x ")},' + WRITE_MS + ')';
  children.push(spawn(process.execPath, ['-e', code, JSON.stringify(writeDirs)], { stdio: 'ignore' }));
}
// CPU load in its own processes, as a builder's tests and checks are.
for (let i = 0; i < LOAD; i++) children.push(spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
const hub = new Hub();
let filesMsgs = 0;
const start = performance.now();
let gitMsgs = 0;
hub.subscribe({ send: (t) => { const m = JSON.parse(t); if (m.channel === 'files') { filesMsgs++; if (process.env.DIAG_TIMELINE === '1') console.log(`DIAG-7e3a files ${(performance.now() - start).toFixed(0)} ms ${m.payload.root.slice(T.length)}`); } if (m.channel === 'git') gitMsgs++; return Promise.resolve(); }, close() {} }, ['files', 'git']);
const t0w = performance.now();
const watcher = WATCH ? watchGit(hub, { always: root, roots: () => extra }) : null;
console.log(`watcher ${WATCH ? 'on' : 'off'}, first read ${(performance.now() - t0w).toFixed(0)} ms`);
// The longest stall of the event loop: a 10 ms tick that notes how late it ran.
let stall = 0, prev = performance.now();
const tick = setInterval(() => { const now = performance.now(); stall = Math.max(stall, now - prev - 10); prev = now; }, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(GAP);
const times = [];
for (let r = 0; r < RUNS; r++) {
  const rel = `zz-diag-x3e/run-${process.pid}-${r}`;
  mkdirSync(join(root, rel), { recursive: true });
  const paths = [];
  for (let i = 0; i < N; i++) {
    const p = `${rel}/diag-x3e-${process.pid}-${r}-${i}.txt`;
    writeFileSync(join(root, p), `scratch ${r} ${i}\n`);
    paths.push(p);
  }
  writeFileSync(join(root, rel, 'keep.txt'), 'kept\n'); // a row the Delete leaves, so the listing asks git
  await sleep(GAP); // the creation's own watcher read passes before the Delete, as on TEST
  const calls = [];
  const trash = async (path, options) => {
    const a = performance.now();
    if (process.env.DIAG_SYNC_TRASH === '1') {
      // DIAG-7e3a probe 2: the trash program run blocking, so its time is its own and no wait on the loop.
      const { spawnSync } = await import('node:child_process');
      const done = spawnSync(join(T, 'tree/tools/oculus/node_modules/trash/lib/macos-trash'), [path]);
      if (done.status !== 0) throw new Error(String(done.stderr));
    } else await trashLib(path, options);
    calls.push(performance.now() - a);
  };
  const into = {
    roots: [{ key: 'scratch', dir: root }],
    writes: { chain: Promise.resolve() },
    ...(process.env.DIAG_NOKEEP === '1' ? {} : {
      changes: { file: join(T, 'changes.jsonl'), keep: 1000, writes: { chain: Promise.resolve() } },
      history: join(T, 'history') }),
    hub: root, searchTimeout: 5000
  };
  const req = new Request('http://x/api/ops', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-oculus-token': 'tok' },
    body: JSON.stringify({ op: 'trash', root: 'scratch', paths })
  });
  stall = 0; prev = performance.now();
  const a = performance.now();
  const res = await handleOps(req, 'tok', into, { trash });
  const ms = performance.now() - a;
  const body = await res.json();
  // The page's relist after the answer: a listing of the folder, asked as a request arrives, behind
  // whatever the event loop is running.
  const b = performance.now();
  let own = 0;
  await new Promise((done) => setTimeout(() => { const c = performance.now(); listShown(into.roots, 'scratch', rel); own = performance.now() - c; done(); }, 0));
  const relist = performance.now() - b;
  if (process.env.DIAG_SPLIT === '1') console.log(`DIAG-7e3a probe 3: relist ${relist.toFixed(0)} ms = wait ${(relist - own).toFixed(0)} ms + listing's own ${own.toFixed(0)} ms`);
  const gone = paths.every((p) => !existsSync(join(root, p)));
  times.push(ms);
  console.log(`run ${r}: ok=${body.ok} gone=${gone} answer ${ms.toFixed(0)} ms; relist ${relist.toFixed(0)} ms; trash calls ${calls.map((c) => c.toFixed(0)).join(', ')} ms; longest loop stall ${stall.toFixed(0)} ms`);
  rmSync(join(root, rel), { recursive: true, force: true });
  await sleep(GAP);
}
clearInterval(tick);
watcher?.close();
for (const c of children) c.kill();
rmSync(join(root, 'zz-diag-x3e'), { recursive: true, force: true });
const mean = times.reduce((x, y) => x + y, 0) / times.length;
const sd = Math.sqrt(times.reduce((x, y) => x + (y - mean) ** 2, 0) / times.length);
console.log(`N=${N} runs=${RUNS} answer mean ${mean.toFixed(0)} ms sd ${sd.toFixed(0)} min ${Math.min(...times).toFixed(0)} max ${Math.max(...times).toFixed(0)}; files messages ${filesMsgs}, git messages ${gitMsgs}`);
console.log(mean > LIMIT ? `RED: answer mean ${mean.toFixed(0)} ms over ${LIMIT} ms` : `GREEN: answer mean ${mean.toFixed(0)} ms within ${LIMIT} ms`);
process.exit(mean > LIMIT ? 1 : 0);
```

## Cleanup

```
$ grep -rn "DIAG-7e3a" $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests $tmp/tree/tools/oculus/docs; echo "grep exit $?"
grep exit 1
$ git worktree remove --force "$tmp/tree"; echo "remove exit $?"          (from the main checkout)
remove exit 0
$ ls $tmp/tree
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.TMUguI/tree: No such file or directory
$ rm -rf "$tmp"; ls -d "$tmp"
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.TMUguI: No such file or directory
```

The scratch tree went with its four clones (inside it), its `node_modules` links and the probe and fix changes; `$tmp` went with the harnesses (`red.mjs`, `red2.mjs`, `cadence.mjs`, `status-time.mjs`, `async-check.mjs`, `async-time.mjs`), the logs, the diffs, the scratch HOME (`$tmp/home`, which held npx's cache), the scratch history folder and change log. No credential or `.env` file was copied. The `git stash` used inside the scratch tree to run the test without the fix was popped each time; the shared stash list holds only its three earlier entries (`git stash list`: "stash@{0}: On main: xss", "stash@{1}: On main: sss", "stash@{2}: On main: ddd").

Not done: the scratch files the Deletes moved to the macOS Trash are still there. They are named `diag-x3e-<pid>-<run>-<n>.txt` (a line "scratch <run> <n>" each), but the Trash cannot be read from this session (`ls ~/.Trash`: "Operation not permitted"), so their exact paths cannot be named, and the Trash is not emptied.

The red command run again on the original case: carried by the builder's round as its check.

Agent usage: a6cc8344f6841003b, claude-opus-5-5, 292,313 tokens, 148 tool uses, 51.7 min.
