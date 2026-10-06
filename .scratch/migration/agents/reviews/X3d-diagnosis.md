# Diagnosis: the page hangs in the Repositories view after collapsing Outgoing and hovering a commit row

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

## Symptom

From X3d's Step 0 in `plan.md` (line 174), the red line of the step's landing:

"landing 2026-09-30 22:10, backed out: checks passed on main (7 commands), then the look on TEST hung the page (renderer at 100% of a core) after collapsing Outgoing and hovering a commit row, and again on reload; gone with the step off main."

The state file's dispatch entry for X3d reads `landing: backed-out (2026-09-30 22:10: the TEST page hung with the Repositories view on screen, main with the step staged; saved as agents/reviews/X3d-landing-attempt.patch with the landing fixes; see Step 0)`. No open item was booked for it.

## Where the probes run

A scratch copy made from the main checkout: `git worktree add --detach "$tmp/tree" HEAD` (HEAD was `87bcdbe4`), then from inside `$tmp/tree` `git apply --3way --allow-empty tools/oculus/.scratch/migration/agents/reviews/X3d-landing-attempt.patch` (the patch's `shasum` is `97fb66661a6a064692851e80f9cc731305d378d6`; 76 paths staged, `git status --short | wc -l`). This is the tree that hung: main with the step and the landing fixes. `$tmp` is `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.EZg3cw`. The step's worktree `.agents/worktrees/X3d` was not touched.

A second scratch copy for the comparison the symptom names ("gone with the step off main"): `git worktree add --detach "$tmp/base" 87bcdbe4`, nothing applied.

The servers: `vite dev` from each copy's `tools/oculus`, the step on port 8799 and the base on 8798, each started as `env -i HOME=$tmp/home TMUX_TMPDIR=$tmp/tmux PATH=$tmp/bin:<node 24>:/usr/bin:/bin:/usr/sbin:/sbin npx vite dev --port <port> --strictPort`. `$tmp/bin/ssh` is a stub that prints "ssh disabled in the diagnosis scratch server" and exits 255, so the server's HPC poll reaches no host. `node_modules` in each copy is a folder of symbolic links to each entry of the main checkout's `tools/oculus/node_modules` except `.vite`, so Vite's dependency cache is the copy's own (svelte 5.57.1 and @zag-js/tree-view 1.44.0, as `package-lock.json` pins them). The copies have no `config/local.yml`, so the hub is the copy itself and the configured roots resolve under `$tmp/home`; `~/workspace/cathedra` is a scratch repository made for the probes (the Shrunk case section says which).

The browser: `Google Chrome --headless=new --user-data-dir=$tmp/profiles/<run> --remote-debugging-port=9399`, a new profile folder for every run of the red command, driven over the DevTools protocol by Node scripts in `$tmp` (`cdp.mjs`, `drive.mjs`, `chrome.mjs`, `steps.mjs`, `red.mjs`). Neither port 8787 nor 8790 nor the user's Chrome was used.

The paths redirected under `$TMPDIR`: HOME and TMUX_TMPDIR for the two servers; ORDO_STABLE and ORDO_SKILL_DIRS are not read by this code and were not set.

Two side effects outside `$tmp`, from the first two server starts, before the redirections above were complete: with `node_modules` as one symbolic link to the main checkout's folder, the first start rebuilt the main checkout's `tools/oculus/node_modules/.vite/deps` at 22:16 (Vite's dependency cache, gitignored, the same package versions); and OpenSSH reads its configuration from the account's home directory and not from `HOME`, so those two starts ran the HPC poll once each (`squeue`, `sacct`, `sinfo`, `quota`, `df` on the login node; no compute). Every later start ran with the private `node_modules` folder and the ssh stub.

## Red command

```
cd $tmp && NTH=2 node red.mjs
```

What it does: a fresh Chrome profile; the page at `http://127.0.0.1:8799/` (`APP=8798` for the base); the rail's Explorer; the Repositories tab; the repository `cathedra`; the commit row NTH of the Graph (`li[data-commit] button.main`, counted from 0) scrolled to the pane's centre and pressed, which opens its changed files under it; 1.5 s; then a screenshot (the page draws a frame) and `Runtime.evaluate('1')`, each bounded at 5000 ms. No answer within the bound is the hang. The renderer's CPU is read with `ps` while it hangs. Part 2 closes the browser through `Browser.close` (which writes its storage), starts it again on the same profile and opens the page again, the symptom's reload, and asks the same question once the page has loaded. `STEPS=` runs other actions in place of the press (`outgoing` presses the Outgoing row, `hover` moves the pointer over a commit row, `tree` presses View as Tree, `opentop`/`openmid`/`openlast` press commit NTH at the top, centre or bottom of the pane).

Runs on the step's tree, the shrunk case (`runs-step.txt`):

```
$ NTH=2 node red.mjs   (run 1)
  pressed "commit 3 TheAxeC TheAxeC" at y 439
part 1 openmid: HUNG, no answer within 5000 ms
part 1 the busiest renderer of this profile: 102.9% then 0.0% of a core
part 2 reload: HUNG while the page loads (TIMEOUT Runtime.evaluate after 5000 ms)
part 1 HUNG; part 2 HUNG
RED
$ NTH=2 node red.mjs   (run 2)
  pressed "commit 3 TheAxeC TheAxeC" at y 439
part 1 openmid: HUNG, no answer within 5000 ms
part 1 the busiest renderer of this profile: 101.1% then 0.1% of a core
part 2 reload: HUNG while the page loads (TIMEOUT Runtime.evaluate after 5000 ms)
part 1 HUNG; part 2 HUNG
RED
$ NTH=2 node red.mjs   (run 3)
  pressed "commit 3 TheAxeC TheAxeC" at y 439
part 1 openmid: HUNG, no answer within 5000 ms
part 1 the busiest renderer of this profile: 102.7% then 0.0% of a core
part 2 reload: HUNG while the page loads (TIMEOUT Runtime.evaluate after 5000 ms)
part 1 HUNG; part 2 HUNG
RED
```

The same command on the base, main at `87bcdbe4` without the step (`runs-base.txt`):

```
$ APP=8798 NTH=2 node red.mjs   (run 1, main at 87bcdbe4 without the step)
  pressed "commit 3 TheAxeC de524d0" at y 530
part 1 openmid: HUNG, no answer within 5000 ms
part 1 the busiest renderer of this profile: 101.9% then 0.0% of a core
part 2 reload: HUNG while the page loads (TIMEOUT Runtime.evaluate after 5000 ms)
part 1 HUNG; part 2 HUNG
RED
(runs 2 and 3 the same: 102.2% and 106.5% of a core, part 1 HUNG, part 2 HUNG, RED)
```

With a bound of 60 s (`BOUND=60000`), the step's renderer answered after 51,292 ms and the base's did not answer within 60,000 ms; both reloads hung.

How the red command relates to the symptom, which the reader of this record needs before anything below:

- It reproduces three parts of the symptom: the page stops answering with the Repositories view on screen, the renderer at 100% of a core, and again on reload (the open commit is kept in the view's instance state, so the reloaded page opens it again and hangs while it loads).
- It does not reproduce "gone with the step off main": main at `87bcdbe4` without the step hangs the same way on the same press. Main's head now (`eb553cde`) carries the same code: `git diff --stat 87bcdbe4 HEAD -- tools/oculus/src/lib/ui/tree/ tools/oculus/src/lib/views/sources/repositories/` prints nothing.
- It does not reproduce a hang on hovering. On the step's tree, with the scratch repository built to the TEST hub's shape (75 outgoing commits, the 76 staged paths of the step, the local branches `origin`, `Q111` and `U2`, three stashes, two worktrees), no hover hung the page: `sweep.mjs` moved the pointer over every row of the Graph in 11 px steps, and down six pages of scrolling, at 1600x1000, 1512x860 and 1280x800 and 1920x1080 at two device pixels per CSS pixel, and 1000x800 (5 runs, each "no hang"); `sweep2.mjs` moved it across every part of each row (lanes, name, author, pills, actions) with a 0.8 s rest on each row, on `cathedra` and on the hub (2 runs, "no hang"); the red command with `STEPS=outgoing,hover`, `outgoing,outgoing,hover`, `tree,hover` and `tree,outgoing,hover` (each GREEN). `grep -rn "pointerenter\|mouseenter\|pointerover\|mouseover\|onhover"` over `views/sources/repositories` and `ui/tree` prints nothing, so no hover in this code opens a commit. Pressing the Outgoing row changes nothing on screen (it is a row with no press of its own, `graph/GraphHead.svelte`).
- What the look on TEST did between "collapsing Outgoing" and the hang is not in the ledger, and the TEST page's saved view state (in that browser's localStorage) was not read. A press on a commit row of the Graph, or a commit held open in the TEST page's saved Repositories state, would give exactly the hang and the hang on reload; that this is what happened on TEST is not verified.

## No red command

Not applicable.

## Shrunk case

The first red was on the scratch repository built to the TEST hub's shape (a clone of the hub at `87bcdbe4`, `refs/remotes/origin/main` set to `d43564c4` so 75 commits are outgoing, the step's patch applied and staged, local branches `origin`, `Q111`, `U2`, three stashes, two worktrees), with the actions `outgoing` then a press on the 28th commit row, scrolled to the pane's bottom edge.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The press on Outgoing before the commit | `STEPS=opengraph`, 10 of 10 RED (`opengraph red 10 of 10`) | cut |
| The commit row's place in the pane (bottom edge, centre, top) | `openlast` RED at y 962, `openmid` RED at y 524 (3 of 3), `opentop` RED at y 87 (2 of 2) | cut |
| Tree mode | red in list mode (the runs above are list mode) | cut |
| The staged changes, the 75 outgoing commits, the extra branches, the stashes and the worktrees of the repository | all removed from the clone: `part 1 HUNG; part 2 HUNG`, RED, 2 of 2 | cut |
| The repository itself: replaced by one of five commits, each adding one file (`git init`, five commits) | `NTH=2`: RED 3 of 3 (the runs quoted above) | cut |
| The press on a commit | `STEPS=hover` on the same repository: `part 1 hover: answers in 1 ms ... GREEN` | put back: the press is needed |
| The commit pressed being a row of the Graph's list (`VirtualRows`) rather than a row under Outgoing | pressing an Outgoing commit (`Launch Q111's builder`, drawn outside `VirtualRows`) answered in five runs of `STEPS=tree,outgoing,opencommit` and `opencommit`, while every Graph row pressed hung; the probes below show why | kept: needed |

The shrunk case, as it stands: a repository with at least one commit, the Repositories view showing it, and a press on a commit row of the Graph's list, which opens that commit's files; the reload needs nothing more, since the open commit is kept in the view's state.

## Hypotheses

Formed after the red command, from the stack `Debugger.pause` gave while the page hung (`PAUSE=1 STEPS=opengraph node steps.mjs`): on the step, `set` in `onrows` of `Repo.svelte`, called from the `$effect` of `graph/Graph.svelte`, under 117 nested calls of Svelte's batch `#process`; on the base, `@zag-js/tree-view`'s `getIndexPath` reached from `TreeView.svelte`'s `rowProps` under the same batch recursion. A press or a focus is not needed, since part 2 hangs on load with no press, so a focus loop is not among them.

1. If the open commit's file rows go round a cycle of effects with no fixed point (CommitFiles' rows effect hands a new array to the Graph's `fileRows`; something the Graph and the list derive from `fileRows` changes what CommitFiles' effect reads, so it runs again and hands another new array), then cutting one link of that cycle turns the red command green. Falsified by: a trace of the two effects during the hang that shows them re-run by anything other than each other's writes, or a cut link that leaves the hang.
2. If the tree's zag machine and `TreeView.svelte` feed back (the open commit row is a branch held `open` and `fixed`; the machine's `onExpandedChange` calls `ontoggle`, which changes the view's `collapsed`, which changes the key rows, which change the machine's props), then stopping that `ontoggle` turns the red command green. Falsified by: a trace during the hang that shows no change to `collapsed` or the view's state.
3. If `VirtualRows.svelte` measures the open commit's item, whose height changes with its files, and the measure, the virtualizer's `onChange` and the redraw keep feeding each other, then the loop runs through `onChange`. Falsified by: a count during the hang that shows `onChange` idle while the window is written by another path.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 and 2 (logging at the boundary that separates them) | `+ $inspect.trace('DIAG-7c3e graph rows');` as the first line of the rows `$effect` of `graph/Graph.svelte`, and `+ $inspect.trace('DIAG-7c3e commit files rows');` as the first line of the rows `$effect` of `graph/CommitFiles.svelte` | `TRACE=1 LOGS=DIAG LOGN=30 NTH=2 STEPS=openmid node red.mjs`: `traced runs: 156`; after the load, every run alternates `DIAG-7c3e commit files rows: changed $derived drawn, $state windowed` and `DIAG-7c3e graph rows: changed $state fileRows`, to the last run caught; no run shows `collapsed` or the view's state changed | 1 still standing; 2 falsified (nothing the zag machine's toggle writes changes during the loop) |
| 3 (logging) | `+ console.debug('DIAG-7c3e onChange');` in the virtualizer's `onChange`, and `+ console.debug('DIAG-7c3e configure');` before `windowed = rowWindow(virtualizer);` in `configure`, both in `ui/tree/VirtualRows.svelte` | `LOGS=DIAG-7c3e LOGN=20000 NTH=2 STEPS=openmid node red.mjs`: `567 debug DIAG-7c3e configure`, `17 debug DIAG-7c3e onChange`, the last twelve messages all `configure`; RED | 3 falsified (the measure path is idle during the loop); 1 still standing: the window is written by `configure` |
| 1 (the change it names: the list's window is not written again when it did not move) | in `configure` of `ui/tree/VirtualRows.svelte`: `- windowed = rowWindow(virtualizer);` `+ const next = rowWindow(virtualizer); // DIAG-7c3e probe 3` `+ if (JSON.stringify(next) !== JSON.stringify(untrack(() => windowed))) windowed = next; // DIAG-7c3e probe 3` | `NTH=2 node red.mjs`, three runs: `part 1 openmid: answers in 1 ms`, `part 2 reload: the page loaded and answers`, GREEN, each; the screenshot shows commit 3 open with `f3.txt d3/f3.txt A` under it | still standing: green with the change, red without it |
| 1 (another link of the same cycle, to name the cycle) | in `commitAt` of `graph/Graph.svelte`: `- const held = fileRows.some(...)` `+ const held = untrack(() => fileRows).some(...) // DIAG-7c3e probe 4` | `NTH=2 node red.mjs`, two runs: `part 1 openmid: answers in 0 ms` and `1 ms`, `part 2 reload: the page loaded and answers`, GREEN, each | still standing: the cycle closes through `commitAt` reading `fileRows` |

Each probe was undone before the next (`git diff --stat -- tools/oculus/src` printed nothing after each undo).

## Cause

Hypothesis 1, with probes 3 and 4. Opening a commit of the Repositories view's Graph starts a cycle of effects that never settles, on main as it is and with the step alike:

1. `graph/CommitFiles.svelte`'s rows `$effect` hands its key rows to the Graph as a new array (`onrows(keys)`, which the Graph passes as `(rows) => (fileRows = rows)`, `graph/Graph.svelte:270` on the step's tree).
2. The Graph's `commitAt` (`graph/Graph.svelte:179-183`), which it hands to `VirtualRows` as `owns`, reads `fileRows`, so `VirtualRows`' `kept` (`ui/tree/VirtualRows.svelte`, `const kept = $derived([...keep, ...(nav?.kept() ?? []).map((id) => owns?.(id) ?? -1)...])`) is computed again, as a new array.
3. `VirtualRows`' `$effect.pre` reads `kept`, so `configure` runs again and writes `windowed = rowWindow(virtualizer)`: a new object for the same window, every time.
4. `drawn` follows `windowed`, the keyed `{#each drawn.rows ...}` hands each item its new row, and the open commit's CommitFiles, drawn inside that item (the Graph's `entry` snippet reads `commits[at]` for `hash={one.hash}`), reads its props again in its rows effect, which therefore runs again: back to 1.

No link ever sees an equal value, since each writes a new array or object, so the flush does not end: 567 calls of `configure` against 17 of `onChange` in probe 2, the renderer at 100% of a core. Probe 3 gives the cycle a fixed point at step 3 and the red command is green; probe 4 cuts step 2 and it is green too. The fix is made at step 3, since that is the one link whose output is wrong by itself: `rowWindow` reports the window as changed when nothing in it moved, and every reader of every virtualized list pays for that. Step 2 is correct as it stands (the kept items must follow when the focus moves into the open commit's files), and cutting it is not the fix.

A commit under Outgoing or Incoming is drawn outside `VirtualRows`, so opening it runs steps 1 to 3 once and stops at 4: that is why pressing an outgoing commit did not hang.

What the cause does not explain, stated again for whoever rules: the symptom's "gone with the step off main" (main without the step hangs the same way; the look off main presumably did not open a commit) and "hovering" (no hover in this code opens a commit, and no hover hung the page here). The file history points at `d8c3689e Land Q82: the explorer tree on zag's tree-view, the long lists virtualized` (2026-09-29, the last change to `graph/Graph.svelte` before `40c555c2`, and the commit that put the Graph's list into `VirtualRows`) as where the cycle began; that is not verified by a bisect.

## Fix and test

Test, run on the tree without the fix (the tree Steps 13 left, every probe undone, only the test file changed):

```
$ cd $tmp/tree/tools/oculus && npx vitest run tests/ui/tree/virtual.test.ts
 ❯ tests/ui/tree/virtual.test.ts (9 tests | 1 failed) 10ms
     × hands back the window the list holds when the virtualizer draws the same rows 5ms
 FAIL  tests/ui/tree/virtual.test.ts > a window read again > hands back the window the list holds when the virtualizer draws the same rows
AssertionError: expected { rows: [ …(30) ], after: 19250, …(1) } to be { rows: [ …(30) ], after: 19250, …(1) } // Object.is equality
If it should pass with deep equality, replace "toBe" with "toStrictEqual"
Received: serializes to the same string
    146|         const held = rowWindow(virtualizer);
    148|         expect(rowWindow(virtualizer, held)).toBe(held);
      Tests  1 failed | 8 passed (9)
```

That failure is step 3 of the cause: the window read again for rows that did not move is a new object equal to the one held.

Fix (against the tree that hung, main at `87bcdbe4` with `X3d-landing-attempt.patch` applied; neither file is changed by the patch, so it applies to main as it is and to the step's worktree alike), formatted with Prettier:

```diff
diff --git a/tools/oculus/src/lib/ui/tree/VirtualRows.svelte b/tools/oculus/src/lib/ui/tree/VirtualRows.svelte
--- a/tools/oculus/src/lib/ui/tree/VirtualRows.svelte
+++ b/tools/oculus/src/lib/ui/tree/VirtualRows.svelte
@@ -90,7 +90,10 @@
         scrollToFn: elementScroll,
         onChange: () => {
             place();
-            windowed = rowWindow(virtualizer);
+            windowed = rowWindow(
+                virtualizer,
+                untrack(() => windowed)
+            );
         }
     });
 
@@ -120,7 +123,10 @@
             scrollMargin: offset,
             rangeExtractor: (range: Range) => keptRange(range, held)
         });
-        windowed = rowWindow(virtualizer);
+        windowed = rowWindow(
+            virtualizer,
+            untrack(() => windowed)
+        );
     }
 
     $effect.pre(() => {
diff --git a/tools/oculus/src/lib/ui/tree/virtual.ts b/tools/oculus/src/lib/ui/tree/virtual.ts
--- a/tools/oculus/src/lib/ui/tree/virtual.ts
+++ b/tools/oculus/src/lib/ui/tree/virtual.ts
@@ -31,9 +31,15 @@ export function keptRange(range: Range, kept: readonly number[]): number[] {
  * The rows the virtualizer draws now and the height held around them. The virtualizer counts a
  * row's start from the top of the scroll box, the list's own offset in it being its scroll margin,
  * so each gap is measured from the list's top or from the end of the row drawn before it.
+ *
+ * Handed the window the list holds, it gives that same window back when nothing in it moved, so
+ * the list writes nothing and the rows drawn from it are not run again. A row whose effect makes
+ * the list configure itself again (the open commit's files, whose rows the Graph's kept items are
+ * counted from) would otherwise be run again by the window it caused, and again, without end.
  */
 export function rowWindow<S extends Element | Window, I extends Element>(
-    virtualizer: Virtualizer<S, I>
+    virtualizer: Virtualizer<S, I>,
+    held?: RowWindow
 ): RowWindow {
     const items = virtualizer.getVirtualItems();
     const total = virtualizer.getTotalSize();
@@ -44,7 +50,20 @@ export function rowWindow<S extends Element | Window, I extends Element>(
         end = item.end;
         return { index: item.index, gap };
     });
-    return { rows, after: Math.max(0, total - (end - margin)), total };
+    const next = { rows, after: Math.max(0, total - (end - margin)), total };
+    return held !== undefined && sameWindow(held, next) ? held : next;
+}
+
+/** Whether two windows draw the same rows with the same heights held around them. */
+export function sameWindow(one: RowWindow, two: RowWindow): boolean {
+    return (
+        one.after === two.after &&
+        one.total === two.total &&
+        one.rows.length === two.rows.length &&
+        one.rows.every(
+            (row, at) => row.index === two.rows[at].index && row.gap === two.rows[at].gap
+        )
+    );
 }
 
 /**
```

`windowed` is a `$state`, so the value read back is Svelte's proxy of the window; handing that same proxy back makes the assignment an `Object.is`-equal write, which notifies nothing. Both reads of `windowed` are in `untrack`, since `onChange` can run inside the measuring attachment's effect (`virtualizer.measureElement` in `measureAt`), which must not come to depend on the window it causes.

The test, added to `tests/ui/tree/virtual.test.ts` (its head comment gains the paragraph on a window read again, and its "What this does NOT cover" line gains "or the list's effects settling in a page"):

```ts
describe('a window read again', () => {
    // Revert: return the window computed in rowWindow, whatever it is handed as the one held.
    it('hands back the window the list holds when the virtualizer draws the same rows', () => {
        const virtualizer = windowed(1000, 22, 440, 2200);
        const held = rowWindow(virtualizer);

        expect(rowWindow(virtualizer, held)).toBe(held);
    });

    // Revert: compare only the indexes of the rows drawn in sameWindow.
    it('hands back a new window when the rows drawn move, or the heights around them change', () => {
        const held = rowWindow(windowed(1000, 22, 440, 2200));
        const moved = rowWindow(windowed(1000, 22, 440, 2200 + 22), held);
        const longer = rowWindow(windowed(1001, 22, 440, 2200), held);

        expect(moved).not.toBe(held);
        expect(moved.rows[0].index).toBe(96);
        expect(longer).not.toBe(held);
        expect(indexesOf(longer)).toEqual(indexesOf(held));
        expect(longer.after).toBe(held.after + 22);
    });
});
```

The second case's revert line was checked: with `one.after === two.after && one.total === two.total &&` removed from `sameWindow`, `× hands back a new window when the rows drawn move, or the heights around them change`, `Tests 1 failed | 8 passed (9)`; the fix put back after (`diff` of `git diff` against the saved fix printed nothing).

Runs after the fix:

```
$ npx vitest run tests/ui/tree/
 Test Files  3 passed (3)
      Tests  51 passed (51)

$ NTH=2 node red.mjs   (runs 1 to 3, with the fix; runs-fixed.txt)
  pressed "commit 3 TheAxeC TheAxeC" at y 439
part 1 openmid: answers in 1 ms        (0 ms, 1 ms in runs 2 and 3)
part 2 reload: the page loaded and answers
part 1 answers; part 2 answers
GREEN                                  (each of the three)

The original, unshrunk case: the repository rebuilt to the TEST hub's shape (75 outgoing,
76 staged, branches origin, Q111, U2, three stashes, two worktrees), NTH=20 (runs-original.txt);
without the fix this was "part 1 openmid: HUNG ... part 2 reload: HUNG ... RED", 3 of 3:
== outgoing,hover,openmid,hover
part 1 outgoing: answers in 0 ms / hover: 1 ms / openmid: 0 ms / hover: 1 ms
part 2 reload: the page loaded and answers
GREEN
== tree,outgoing,openmid,hover
part 1 tree: 0 ms / outgoing: 0 ms / openmid: 0 ms / hover: 0 ms
part 2 reload: the page loaded and answers
GREEN
== outgoing,hover,opentop,openlast   (the same commit pressed at y 87, then at y 962)
part 1 outgoing: 0 ms / hover: 0 ms / opentop: 0 ms / openlast: 1 ms
part 2 reload: the page loaded and answers
GREEN

$ npx prettier --check (the three files)      All matched files use Prettier code style!
$ npx eslint (the three files)                exit 0
$ npx svelte-check --threshold error          COMPLETED 2497 FILES 0 ERRORS 0 WARNINGS
$ npm test                                    Test Files 363 passed | 19 skipped (382); Tests 5586 passed | 559 skipped (6145)
```

No test reaches it: the cycle itself, which runs only when `VirtualRows` has found its scroll box and a commit's files are drawn inside its item, needs a page. The unit suite renders to a string and runs no effect (`vite.config.ts`, `environment: 'node'`), and the `client` project Z113 (a) rules into Q106 runs Svelte's client runtime with a stubbed `document` and no DOM, which cannot mount `VirtualRows` (it binds elements, reads `getBoundingClientRect` and needs a `[data-scroll]` ancestor); a DOM library is a dependency only Axel may rule. The test above reaches the defect's own link (the window reported as changed when it did not move) in node; the red command in `$tmp` reaches the cycle and was run green with the fix and red without it. No test is written: not applicable.

## Cleanup

```
$ grep -rn "DIAG-7c3e" $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests $tmp/base/tools/oculus/src $tmp/base/tools/oculus/tests
(no output; grep exit 1)
```

The two dev servers stopped, every Chrome started for the runs closed, the scratch worktrees removed with `git worktree remove --force` from the main checkout, and `$tmp` deleted with every throwaway file in it (the scratch repositories, the Chrome profiles, the scripts and their outputs); no credential or `.env` file was copied into it. The red command itself is carried by the step's next brief as its check, from this record.

## Appendix: the red command's scripts

The five files the red command runs, as they stood at the last run, kept here since `$tmp` is removed. They go in one folder beside a `profiles/` folder; `serve.sh` below is the server line with the scratch paths written as `$tmp`. The scratch repository of the shrunk case is `git init -q -b main` in `$HOME/workspace/cathedra` of the server's `HOME`, then five times: `mkdir -p d$i; echo $i > d$i/f$i.txt; git add -A; git -c user.name=TheAxeC -c user.email=t@t commit -qm "commit $i TheAxeC"`.

```sh
# serve.sh
cd $tmp/tree/tools/oculus && exec env -i HOME=$tmp/home TMUX_TMPDIR=$tmp/tmux PATH=$tmp/bin:$HOME/.nvm/versions/node/v24.21.0/bin:/usr/bin:/bin:/usr/sbin:/sbin npx vite dev --port 8799 --strictPort
# $tmp/bin/ssh
#!/bin/sh
echo "ssh disabled in the diagnosis scratch server" >&2
exit 255
```

`cdp.mjs`:

```js
// A small DevTools-protocol client over Node 24's WebSocket, for the private headless Chrome on 9399.
export const PORT = 9399;
export const BASE = `http://127.0.0.1:${process.env.APP ?? 8799}/`;

export async function newPage() {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
    const t = await r.json();
    return connect(t);
}

export async function closeTarget(id) {
    await fetch(`http://127.0.0.1:${PORT}/json/close/${id}`);
}

export function connect(target) {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    const listeners = [];
    ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id && pending.has(m.id)) {
            const { resolve, reject } = pending.get(m.id);
            pending.delete(m.id);
            if (m.error) reject(new Error(JSON.stringify(m.error)));
            else resolve(m.result);
        } else if (m.method) {
            for (const l of listeners) l(m);
        }
    };
    const ready = new Promise((res) => (ws.onopen = res));
    const send = async (method, params = {}, timeoutMs = 10000) => {
        await ready;
        const my = ++id;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(my);
                reject(new Error(`TIMEOUT ${method} after ${timeoutMs} ms`));
            }, timeoutMs);
            pending.set(my, {
                resolve: (v) => (clearTimeout(timer), resolve(v)),
                reject: (e) => (clearTimeout(timer), reject(e))
            });
            ws.send(JSON.stringify({ id: my, method, params }));
        });
    };
    const evaluate = async (expression, timeoutMs = 5000) => {
        const r = await send(
            'Runtime.evaluate',
            { expression, returnByValue: true, awaitPromise: true },
            timeoutMs
        );
        if (r.exceptionDetails) throw new Error('EVAL ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
        return r.result.value;
    };
    const on = (fn) => listeners.push(fn);
    return { ws, send, evaluate, on, target, close: () => ws.close() };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
```

`drive.mjs`:

```js
// Helpers to drive the scratch page with real mouse events.
import { newPage, closeTarget, BASE, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

export async function open(url = BASE) {
    const p = await newPage();
    await p.send('Page.enable');
    await p.send('Runtime.enable');
    p.scripts = new Map();
    p.logs = [];
    p.on((m) => {
        if (m.method !== 'Runtime.consoleAPICalled' || p.logs.length >= 20000) return;
        p.logs.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ').replace(/\s+/g, ' ').slice(0, 300));
    });
    p.on((m) => m.method === 'Debugger.scriptParsed' && p.scripts.set(m.params.scriptId, m.params.url));
    if (process.env.PAUSE === '1') await p.send('Debugger.enable', {}, 20000);
    await p.send('Emulation.setDeviceMetricsOverride', { width: +(process.env.W ?? 1600), height: +(process.env.H ?? 1000), deviceScaleFactor: +(process.env.DPR ?? 1), mobile: false });
    await p.send('Page.navigate', { url });
    return p;
}

/** The centre of the first element the expression returns, or null. */
export async function centre(p, expr) {
    return p.evaluate(`(() => { const e = (${expr}); if (!e) return null; e.scrollIntoView({block:'nearest'}); const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height }; })()`);
}

export async function move(p, x, y, timeoutMs = 10000) {
    await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, timeoutMs);
}

export async function click(p, x, y, timeoutMs = 10000) {
    await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, timeoutMs);
    await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, timeoutMs);
    await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, timeoutMs);
}

export async function clickOn(p, expr) {
    const c = await centre(p, expr);
    if (!c) throw new Error('not found: ' + expr);
    await click(p, c.x, c.y);
    return c;
}

export async function shot(p, name) {
    const s = await p.send('Page.captureScreenshot', { format: 'png' }, 20000);
    writeFileSync(new URL(`./${name}.png`, import.meta.url), Buffer.from(s.data, 'base64'));
}

/** Whether the renderer answers a trivial evaluate within `ms`. */
export async function alive(p, ms = 3000) {
    const t0 = Date.now();
    try {
        await p.evaluate('1', ms);
        return { alive: true, ms: Date.now() - t0 };
    } catch (e) {
        return { alive: false, ms: Date.now() - t0, error: String(e.message) };
    }
}

export async function done(p) {
    p.close();
    await closeTarget(p.target.id);
}

export { sleep };

export const byText = (sel, text) =>
    `[...document.querySelectorAll(${JSON.stringify(sel)})].find(e => e.innerText && e.innerText.trim() === ${JSON.stringify(text)})`;
export const byLabel = (label) => `document.querySelector('[aria-label=${JSON.stringify(label)}]')`;

export async function toRepositories(p) {
    await sleep(5000);
    await clickOn(p, byLabel('Explorer'));
    await sleep(1500);
    await clickOn(p, `[...document.querySelectorAll('[role=tab]')].find(e => e.innerText.includes('Repositories'))`);
    await sleep(4000);
}
```

`chrome.mjs`:

```js
// Start and stop a private headless Chrome on 9399 with its own profile folder under the scratch
// folder, so no run shares a renderer or storage with an earlier one unless it asks to.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { PORT, connect } from './cdp.mjs';

const BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function startChrome(profile) {
    mkdirSync(profile, { recursive: true });
    const child = spawn(
        BIN,
        [
            '--headless=new',
            `--user-data-dir=${profile}`,
            `--remote-debugging-port=${PORT}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--window-size=1600,1000',
            'about:blank'
        ],
        { stdio: 'ignore' }
    );
    for (let i = 0; i < 100; i++) {
        try {
            const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
            if (r.ok) return { child, version: await r.json() };
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('chrome did not start');
}

/** Close the browser through the protocol, which flushes its storage, then make sure it is gone. */
export async function stopChrome({ child, version }) {
    try {
        const b = connect({ webSocketDebuggerUrl: version.webSocketDebuggerUrl });
        await b.send('Browser.close', {}, 5000).catch(() => {});
    } catch {
        /* already gone */
    }
    await new Promise((r) => setTimeout(r, 1500));
    try {
        child.kill('SIGKILL');
    } catch {
        /* already gone */
    }
    await new Promise((r) => setTimeout(r, 500));
}
```

`steps.mjs`:

```js
// Run a list of reader actions on the Repositories view and report, after each, whether the
// renderer answers Runtime.evaluate('1') within BOUND ms.
//   STEPS=a,b,c  node steps.mjs          (FRESH=1 clears localStorage first; FRESH=0 keeps it)
import { open, toRepositories, clickOn, click, centre, move, alive, sleep, shot, byLabel } from './drive.mjs';
import { closeTarget, BASE } from './cdp.mjs';

export const BOUND = +(process.env.BOUND ?? 5000);
const leaf = (text) =>
    `[...document.querySelectorAll('*')].find(e => e.children.length===0 && e.innerText && e.innerText.trim()===${JSON.stringify(text)})`;
const buttonWith = (text) => `[...document.querySelectorAll('button')].find(b => b.innerText.includes(${JSON.stringify(text)}))`;

const actions = {
    tree: (p) => clickOn(p, byLabel('View as Tree')),
    list: (p) => clickOn(p, byLabel('View as List')),
    outgoing: (p) => clickOn(p, leaf('Outgoing')),
    // an outgoing commit (no lanes) and a commit of the graph proper (with lanes)
    opencommit: (p) => clickOn(p, buttonWith('Launch Q111')),
    opengraph: (p) => clickOn(p, buttonWith('Book Q109 and Q110')),
    // the commit row nearest the bottom of the window that is drawn whole, and one in the middle
    openlast: (p) => pressCommit(p, 'end'),
    openmid: (p) => pressCommit(p, 'center'),
    opentop: (p) => pressCommit(p, 'start'),
    hover: async (p) => {
        const c = await p.evaluate(`(() => { const b = [...document.querySelectorAll('li[data-commit] button.main')][${+(process.env.NTH ?? 20)}]; if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + Math.min(r.width / 2, 150), y: r.y + r.height / 2 }; })()`);
        if (!c) throw new Error('no commit row to hover');
        for (const dx of [-40, 0, 40, 80]) await move(p, c.x + dx, c.y).catch(() => {});
    }
};

/** Pause the looping script and print its stack, top frame first. */
async function pauseStack(p, lines) {
    const paused = new Promise((resolve) => p.on((m) => m.method === 'Debugger.paused' && resolve(m.params)));
    await p.send('Debugger.pause', {}, 20000).catch((e) => lines.push('pause: ' + e.message));
    const got = await Promise.race([paused, new Promise((r) => setTimeout(() => r(null), 20000))]);
    if (!got) { lines.push('no Debugger.paused within 20 s'); return; }
    const frames = got.callFrames;
    lines.push(`  ${frames.length} frames; the top 6, then every frame whose function is not #process`);
    const shown = frames.filter((f, i) => i < 6 || f.functionName !== '#process');
    for (const f of shown) {
        const url = p.scripts.get(f.location.scriptId) ?? f.url;
        lines.push(`  at ${f.functionName || '(anonymous)'} ${url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')}:${f.location.lineNumber + 1}:${f.location.columnNumber + 1}`);
    }
}

/** Press a commit row of the graph, chosen by where it is on screen, without scrolling. */
async function pressCommit(p, which, nth = +(process.env.NTH ?? 20)) {
    // The nth commit row of the graph, scrolled to the bottom edge ('end') or the centre of its
    // scroller, then pressed where its words are.
    const c = await p.evaluate(`(() => {
        const b = [...document.querySelectorAll('li[data-commit] button.main')][${nth}];
        if (!b) return null;
        b.scrollIntoView({ block: '${which}' });
        const r = b.getBoundingClientRect();
        return { x: r.x + Math.min(r.width / 2, 150), y: r.y + r.height / 2, text: b.innerText.slice(0, 40) };
    })()`);
    if (!c) throw new Error('no commit row');
    await sleep(300);
    await click(p, c.x, c.y);
    console.log(`  pressed "${c.text}" at y ${Math.round(c.y)}`);
}

export async function run(steps, { fresh = true, repo = 'cathedra', tag = '' } = {}) {
    const lines = [];
    // A same-origin JSON answer runs none of the app, so the storage is cleared before the app
    // reads it, whatever state an earlier run left.
    const p = await open(fresh ? BASE + 'api/hpc' : undefined);
    await sleep(1000);
    if (fresh) {
        await p.evaluate('localStorage.clear(); sessionStorage.clear(); true');
        await p.send('Page.navigate', { url: BASE });
    }
    await toRepositories(p);
    const repoRow = await centre(p, leaf(repo));
    if (repoRow) {
        await clickOn(p, leaf(repo));
        await sleep(3000);
    }
    let hung = false;
    for (const s of steps) {
        try {
            await actions[s](p);
        } catch (e) {
            lines.push(`${tag}${s}: action failed (${e.message.slice(0, 120)})`);
            hung = e.message.startsWith('TIMEOUT');
            if (hung) break;
            continue;
        }
        // The hang starts at the next frame the page draws, so a frame is asked for (a screenshot)
        // before the renderer is asked for an answer; a screenshot with no answer is the hang too.
        await sleep(1500);
        const framed = await p.send('Page.captureScreenshot', { format: 'png' }, BOUND).then(() => true, () => false);
        const a = framed ? await alive(p, BOUND) : { alive: false, ms: BOUND };
        lines.push(`${tag}${s}: ${a.alive ? 'answers in ' + a.ms + ' ms' : 'HUNG, no answer within ' + BOUND + ' ms'}`);
        if (!a.alive) {
            hung = true;
            if (process.env.PAUSE === '1') await pauseStack(p, lines);
            break;
        }
    }
    if (!hung) await shot(p, 'steps-' + (tag.replace(/\W/g, '') || 'last'));
    if (process.env.LOGS) {
        const want = new RegExp(process.env.LOGS);
        const kept = p.logs.filter((l) => want.test(l));
        lines.push(`${tag}console lines matching /${process.env.LOGS}/: ${kept.length} (of ${p.logs.length} kept, at most 20000)`);
        if (process.env.TRACE) {
            // One line per traced run: its label, then the dependencies marked as changed.
            let cur = null;
            const runs = [];
            for (const l of p.logs) {
                const m = l.match(/startGroup (DIAG-\w+ [^%]+)/);
                if (m) { cur = { label: m[1].trim(), changed: [] }; runs.push(cur); continue; }
                const c = l.match(/startGroupCollapsed %c\$(state|derived)%c ?(.*?) color: CornflowerBlue/);
                if (cur && c) cur.changed.push('$' + c[1] + ' ' + (c[2] || '(unnamed)'));
            }
            lines.push(`${tag}traced runs: ${runs.length}`);
            for (const r of runs.slice(0, +(process.env.LOGN ?? 40))) lines.push(`  ${r.label}: changed ${r.changed.join(', ') || '(none marked)'}`);
            if (runs.length > (+(process.env.LOGN ?? 40))) for (const r of runs.slice(-10)) lines.push(`  ... ${r.label}: changed ${r.changed.join(', ') || '(none marked)'}`);
        } else for (const l of kept.slice(0, +(process.env.LOGN ?? 40))) lines.push('  ' + l);
    }
    p.close();
    await closeTarget(p.target.id);
    return { lines, hung };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const steps = (process.env.STEPS ?? '').split(',').filter(Boolean);
    const r = await run(steps, { fresh: process.env.FRESH !== '0', repo: process.env.REPO ?? 'cathedra' });
    for (const l of r.lines) console.log(l);
    console.log(r.hung ? 'RED' : 'GREEN');
    process.exit(r.hung ? 1 : 0);
}
```

`red.mjs`:

```js
// The red command. Each run gets a fresh Chrome profile.
// Part 1: the Repositories view on the repository with 75 outgoing commits, then the actions of
// STEPS (by default `openmid`: press the commit row NTH (default 20) of the graph, scrolled to the
// pane's centre, which opens its files), and ask whether the renderer answers
// Runtime.evaluate('1') within 5000 ms.
// Part 2: the browser closed and started again on the same profile, the page opened again (the
// reload of the symptom), the same question once the page has loaded.
// Exit 1 when either part hangs.
import { run } from './steps.mjs';
import { startChrome, stopChrome } from './chrome.mjs';
import { execSync } from 'node:child_process';

const profile = new URL(`./profiles/${Date.now()}`, import.meta.url).pathname;
let chrome = await startChrome(profile);
const one = await run((process.env.STEPS ?? 'openmid').split(','), { fresh: false, tag: 'part 1 ' }).catch((e) => ({
    lines: [`part 1: failed before the actions (${e.message})`],
    hung: e.message.startsWith('TIMEOUT'),
    failed: true
}));
// The renderer's share of a core while it hangs, sampled twice, one second apart.
const cpu = () =>
    execSync(`ps -A -o %cpu=,command= | grep -- '--type=renderer' | grep -- '${profile}' | grep -v grep | awk '{print $1}' | sort -rn | head -1`).toString().trim();
if (one.hung) {
    const a = cpu();
    await new Promise((r) => setTimeout(r, 1000));
    one.lines.push(`part 1 the busiest renderer of this profile: ${a}% then ${cpu()}% of a core`);
}
await stopChrome(chrome);
chrome = await startChrome(profile);
const two = await run([], { fresh: false, tag: 'part 2 ' }).catch((e) => ({
    lines: [`part 2 reload: ${e.message.startsWith('TIMEOUT') ? 'HUNG while the page loads' : 'failed'} (${e.message})`],
    hung: e.message.startsWith('TIMEOUT')
}));
await stopChrome(chrome);
for (const l of [...one.lines, ...two.lines]) console.log(l);
if (!two.hung && two.lines.length === 0) console.log('part 2 reload: the page loaded and answers');
const red = one.hung || two.hung;
console.log(`part 1 ${one.hung ? 'HUNG' : 'answers'}; part 2 ${two.hung ? 'HUNG' : 'answers'}`);
console.log(red ? 'RED' : 'GREEN');
process.exit(red ? 1 : one.failed ? 2 : 0);
```
