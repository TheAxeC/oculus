Everything in the brief is done. Two things outside it are open. Under the same file-event load, two other watcher cases fail: `tests/server/accounts/mail/poll.test.ts` (2 cases, in 2 of the 10 loaded runs) and `tests/checks/tree/scratch.test.ts` (a 5000 ms timeout, in 2 of the 10). Both are outside this step's paths and neither is fixed; see Findings.

## Cause, and the run that shows it

On darwin, `fs.watch` on a folder is an FSEvents stream, and the stream registers asynchronously. When the machine is under a load of file events, a write that lands while the stream is still registering is never delivered. The old `watchWorkspaces` (`git.ts:321-334` on main) had no other way to read the file again, so the added root stayed off the channel.

Git's speed is not the cause. Under CPU-only load (33 `yes` processes) I instrumented the `roots` callback. The event arrived 7 to 88 ms after the write, and git's read of the added root took up to 12 s, yet every case still passed. The reason is in the code: the watch callback reads git synchronously, so `until` sees the publish as soon as the event runs. The case can fail only when the event itself never comes.

How to make it happen on demand, against the unfixed watcher: a temporary test (deleted afterwards) started `watchGit` with `workspacesFile`, wrote the file right after it returned, and waited 20 s. It ran with 8 file-churn processes going beside it (`scratchpad/churn.mjs`: write, rename and remove small files in a loop).
```
REPRO 3 event after never publish after 20030 got added false git msgs 1
REPRO 8 event after never publish after 20023 got added false git msgs 1
Tests  2 failed | 8 passed (10)
```
The same run with a 1500 ms pause between the start and the write passed 10 of 10 (every event arrived in 1 to 22 ms). So only a write made while the stream registers is lost.

After the fix, the same immediate-write reproduction under the same churn passed 20 of 20. Each root read came at the next poll tick: `REPRO 0 roots read after 508 added true` ... `REPRO 19 roots read after 499 added true`, `Tests 20 passed (20)`.

## The fix (`src/lib/server/watch/git.ts`)

The workspaces file is now polled instead of watched:
- `signature(file)` returns the inode, size, mtime and ctime from a stat. A missing file gives `absent`; a refused stat gives `unreadable:<reason>`.
- `readRoots` takes the signature before it reads the roots (`git.ts:293`), so a write that lands between the stat and the read is picked up at the next tick instead of being missed.
- `pollWorkspaces` stats the file once per tick on the injected clock. When the signature has moved it runs `readRoots(); follow()`.
- `close` clears the tick (`git.ts:413`).

This leaves no window in which an arming watch can lose a write. It also fixes something the old code missed: when the folder did not exist at start, `watchWorkspaces` returned early and the first save was never seen. Now it is.

## DONE / NOT DONE

| Item | Status | Command and output |
|---|---|---|
| Cause found and made to happen on demand | DONE | reproduction above: `Tests 2 failed \| 8 passed (10)`, event `never` |
| Fix in the watcher | DONE | `git.ts`, poll with the signature taken before the read |
| Test that reproduces the cause, red under its revert | DONE | "reads a root written to the workspaces file the moment it starts": writes at start, fires the manual clock, then asserts `asked === 2` in the same turn, so no file event can have done the read |
| Cases for no change, a change and after close | DONE | four new cases plus a revert on the existing case |
| 1. `npx vitest run --reporter=dot` | DONE | `Test Files 292 passed (292)`, `Tests 4652 passed (4652)` (unloaded run) |
| 2. `npm run check` | DONE | `COMPLETED 1339 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3. `npm run build` | DONE | `build exit 0` |
| 4. `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| 5. `npm run lint` | DONE | `lint exit 0` |
| 6. `LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | prints nothing (`wc -l` gives 0) |
| 7. `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | both exit 0 |
| 8. `node bin/revert-check.mjs tests/server/watch/git.test.ts` | DONE | `5 reverts, 0 unproven, 21 unchecked`, all 5 `red` (the 21 unchecked are cases that were there before) |
| 9. Ten whole node runs under load | DONE | see below |
| 10. `ls -d $TMPDIR/oculus-* \| wc -l` | DONE | 7015 before, 7015 after the load runs, 7015 after the last full run |

**Item 9, the load runs.** The load was 8 `churn.mjs` file-churn processes per run, the load that reproduced the drop. I ran this load instead of the browser suite because port 8792 belongs to the other builder. The script is `scratchpad/loadruns.sh` and each run's verbose output is in `scratchpad/runs/run1..10.txt`.
- "reads a root added to the workspaces file while it is running" passed 10 of 10, in 1594 to 3455 ms.
- All five workspaces cases passed in every run (the count is 5 in each of run1 to run10).
- Whole-run totals: runs 3, 5, 6, 7, 8 and 10 passed 4652 of 4652. Runs 1 and 2 failed only `scratch.test.ts`. Runs 4 and 9 failed only the two `mail/poll.test.ts` cases.

## Judgment calls the orchestrator may reverse

- **Poll instead of watch.** I replaced the folder watch with a poll and kept no `fs.watch` beside it. A watch kept for speed would still depend on the event, and the poll alone is enough. The bookmarks watcher (`bookmarks.ts:16-18`) already polls a file in the same folder.
- **Tick length.** `POLL = 500` ms, exported with a `poll` option. It follows the module's `THROTTLE` constant; no config key exists for it and I added none. The effect a reader sees: a root added in the page reaches the Repositories view within half a second plus git's read time.
- **Clock.** The poll runs on the injected `Clock`, whose doc comment now covers both the throttle and the poll. That is what makes the new cases deterministic.
- **Directive length.** One revert directive is 157 characters long, because `revert-check` requires a single line. 192 directives in the tree are already over 100.

## Files changed

- `src/lib/server/watch/git.ts`: 384 to 419 lines.
- `tests/server/watch/git.test.ts`: 703 to 836 lines (four new cases and one revert directive on the existing case).
- No path outside the brief. The temporary reproduction file was removed; `ls tests/server/watch` shows the original five files.
- `grep -rn "watchWorkspaces\|workspacesWatch" src tests config HELP.md DESIGN.md README.md` prints nothing.

## Doc text

- `DESIGN.md:106` ("Watchers") says each channel "owns its `fs.watch` handles", and for git names only `.git/index` and the worktree. It does not say that git now polls the saved workspaces file. Suggested addition: "and polls the saved workspaces file, so a root added in the page is read at the next tick".
- `DESIGN.md:266` ("read again ... when the saved workspaces file changes") is still true.
- `HELP.md` has no line about this.

## Findings outside the brief (not fixed)

1. **`src/lib/server/accounts/mail/poll.ts:304`** has the same defect: an `fs.watch` on a folder. Its cases "republishes when the triage skill writes the notes file from outside" and "makes the mail folder when it is not there, so the first write from outside is seen" failed in loaded runs 4 and 9. They fail with `AssertionError` at `poll.test.ts:57`, where the readiness wait saw no event. I left it alone because it is a different module outside this step's paths, and another builder is working in parallel. It needs its own step.
2. **`tests/checks/tree/scratch.test.ts`**, "is swept by every file under tests that takes one", timed out at 5008 ms in loaded runs 1 and 2. It also failed alone while the load runs were going (5692 ms), and passed alone afterwards (`Tests 9 passed (9)`). It is a CPU-bound walk with the default 5 s test timeout and does not involve any watcher.

## Limitations

- The new cases prove the poll by the clock and the roots read count. They do not re-create the FSEvents drop, which needs system-wide load; the churn reproduction above is the evidence for that.
- The signature misses a write that keeps the same inode and size inside one mtime and ctime tick. APFS records times in nanoseconds, so I consider this out of reach.
- The server now runs a stat of `~/.oculus/workspaces.json` every 500 ms on the main thread.

# Repair round 1

Everything in the brief and in the seven rulings is done. Still open outside this step's paths:
- `src/lib/server/accounts/mail/poll.ts:303` has the same folder `fs.watch` defect. Its case "makes the mail folder when it is not there, so the first write from outside is seen" failed once in the ten loaded runs of this round.
- The three git.test.ts cases the reviewer saw fail did not fail once in 24 paired runs or 10 whole runs here, so I have no failing run of them. Their failure values point to a surplus event, not a lost one (ruling 1 below).

## One line per ruling

1. **Not caused by the change, and not the same race; no fix could be proven.**
   - Probe: a copy of Q68 in which `signature` and `pollWorkspaces` throw on entry passes all 3 cases and fails only the 5 workspaces cases. So none of the 3 reaches the poll or the stat.
   - Paired alternating runs of `git.test.ts` alone, base (main's `git.ts` and `git.test.ts`) against Q68 (`scratchpad/paired.sh`):

     | Load | Runs per side | The 3 cases, base | The 3 cases, Q68 | Booked case, base | Booked case, Q68 |
     |---|---|---|---|---|---|
     | 16 churn processes | 8 | 0 fails | 0 fails | 2 fails | 0 fails |
     | 8 churn + 11 `yes` | 6 | 0 | 0 | 3 | 0 |
     | natural, load average 16 to 22 | 10 | 0 | 0 | 3 | 0 |

   - Their shape differs from the booked cause. Each failure value the reviewer quotes is an extra event: `expected 8 to be +0` means the second root was read, `expected 1 to be +0` means a timer is pending after the drop. The booked cause was a lost event.
   - A probe (`scratchpad/stale.mjs`) opened a recursive watch right after a repository's init and commit. The only event delivered for writes made before the watch was `.git/objects/maintenance.lock`: 10 of 10 unloaded, 11 of 15 under 22 `yes`. `relevant()` already filters it.
   - Without a failing run I cannot name their cause, so I made no change for them. They stay a finding.
2. **Case renamed and commented.** It is now "reads a write no file event announced, at the next tick" (`tests/server/watch/git-workspaces.test.ts:97-123`). The comment says a case cannot make FSEvents drop an event, only show that a write made while no file event is delivered is still read at the next tick. The churn evidence is under Cause below.
3. **Comment beside the poll.** `git.ts:356-363` now says the tick is the module's own timer on the injected clock instead of node's `watchFile` (which `bookmarks.ts` uses), because a clock the caller holds cannot drive `watchFile`.
4. **Six cases added, each red under its revert.** `node bin/revert-check.mjs tests/server/watch/git-workspaces.test.ts tests/server/watch/git.test.ts` prints `10 reverts, 0 unproven, 21 unchecked`, all 10 `red`:
   - file deleted after start (revert `git.ts:370`);
   - a stat that throws EACCES on a folder with mode 000 (revert `git.ts:149` => `throw error;`). Node returns `undefined` for ENOTDIR under `throwIfNoEntry: false`, so ENOTDIR does not exercise the unreadable branch;
   - a tick that runs after close, on a clock whose `clearTimeout` does nothing (revert `git.ts:369`);
   - a tick in flight when the roots it reads close the watcher (revert `git.ts:366`);
   - a tick after a config push has already taken the new signature (revert `git.ts:294`).
   The in-flight case found a real defect: a tick that closed the watcher still scheduled one more timer. It is fixed: `pollWorkspaces` now opens with `if (closed) return;` (`git.ts:366`).
5. **`signature` is no longer exported** (`grep -rn "export function signature" src tests` prints nothing). The head comment (`git.ts:12-23`) puts the poll paragraph first and opens the next one with "The recursive watch over each root answers a second question, on the `files` channel".
6. **Behaviour** is stated in its own section below.
7. **Line number corrected:** the mail poller's `watch(options.dir, ...)` call is at `poll.ts:303`.

## Cause and evidence

A darwin `fs.watch` on a folder registers asynchronously. Under a load of file events, a write that lands while it registers is never delivered, and the old watcher had no other way to read the file again.

The evidence is the churn reproduction. It starts `watchGit` with `workspacesFile`, writes the file right after, and waits 20 s, beside 8 `node scratchpad/churn.mjs` processes:
- Unfixed watcher: `REPRO 3 event after never ... got added false`, `REPRO 8 event after never ...`, `Tests 2 failed | 8 passed (10)`.
- Unfixed watcher, write made 1500 ms after the start: `Tests 10 passed (10)`, every event within 1 to 22 ms.
- Fixed watcher: `Tests 20 passed (20)`, each read at the tick, 499 to 508 ms after the write.

## DONE / NOT DONE

| Item | Status | Command and output |
|---|---|---|
| 1. whole node suite | DONE | `npx vitest run --reporter=dot`: `Test Files 293 passed (293)`, `Tests 4657 passed (4657)` |
| 2. type check | DONE | `npm run check`: `COMPLETED 1341 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3. build | DONE | `npm run build`: exit 0 |
| 4. formatting | DONE | `npm run format:check`: `All matched files use Prettier code style!` |
| 5. lint | DONE | `npm run lint`: exit 0 |
| 6. ASCII | DONE | `LC_ALL=C grep -rna '[^ -~]' src tests \| wc -l`: 0 |
| 7. size and folder | DONE | `sh bin/size-check.sh` and `sh bin/folder-check.sh`: both exit 0 |
| 8. revert check | DONE | `10 reverts, 0 unproven, 21 unchecked` (the 21 are cases that were there before) |
| 9. ten whole runs under 8 churn processes | DONE | `scratchpad/loadruns2.sh`, output in `scratchpad/runs2/` |
| 10. temp folder count | DONE | 7015 before the round, 7016 at the end |

**Item 9:** all 10 workspaces cases and all 3 reviewer-flagged cases passed in every run. "reads a root added to the workspaces file while it is running" took 2046, 1287, 1349, 1207, 1662, 1826, 1597, 2635, 1688 and 1888 ms. Runs 2 to 10 passed 4657 of 4657. Run 1 was `1 failed | 4656 passed`, and the one failure is the mail poller case above.

**Item 10:** the extra folder at the end is `oculus-revert-r01Gz1` (15:30:52), which belongs to the L6 builder's `revert-check` (pid 35451, still running at the time). `find $TMPDIR -maxdepth 1 -name 'oculus-*' -newermt '2026-09-24 14:00'` finds only that one. My whole run that I stopped left 45 `oculus-hub-`, `oculus-engine-` and `oculus-dispatch-note-` folders from `portfolio.test.ts` and `dispatch-note.test.ts`, made between 15:07:49 and 15:08:44. I removed them, and the count went back to 7016.

## Behaviour: before and after

**The view:** Repositories, with a root added through the page's workspaces save while the server runs.
- **Before:** the root was read when the folder `fs.watch` event arrived, 7 to 88 ms after the write under CPU load (measured earlier in this step). Under file-event load that event can be lost, and the root then never appears until something else moves the roots.
- **After:** the root is read at the next 500 ms tick (`POLL`, `git.ts:54`), 499 to 508 ms after the write in the churn run, plus git's read of the root. It is not lost under load.
- **Cost:** the server now runs `statSync` on the workspaces file every 500 ms on the main thread for as long as it runs.
- **Also changed:** a machine whose `~/.oculus` folder does not exist at start now sees the first save. Before, it was not seen until a restart.

## Judgment calls the orchestrator may reverse

- **Test split and path widening.** The workspaces cases now live in `tests/server/watch/git-workspaces.test.ts`, because `git.test.ts` would otherwise have gone over the brief's 900-line limit. The helpers both files need moved into `tests/server/watch/repos.ts`. That moved a clone listed in `tests/checks/tree/allow-duplication.txt`, so I widened the paths to that file: the entry's pair is renamed to `tests/server/git/git.test.ts tests/server/watch/repos.ts c81eea90e56f ... at 186 and 19`. `npx vitest run tests/checks/tree/` passes 59 of 59.
- **Booked case moved.** The brief's case, "reads a root added to the workspaces file while it is running", is now at `git-workspaces.test.ts:72-95` instead of `git.test.ts:655-680`.
- **One small wait.** The config-push case waits with `until` for the hub to deliver the push to the watcher's sink, since the hub delivers after the current turn. The tick itself is fired by hand.

## Files changed

| File | Lines |
|---|---|
| `src/lib/server/watch/git.ts` | 384 to 426 |
| `tests/server/watch/git.test.ts` | 703 to 575 |
| `tests/server/watch/git-workspaces.test.ts` | new, 319 |
| `tests/server/watch/repos.ts` | new, 118 |
| `tests/checks/tree/allow-duplication.txt` | one line changed |

## Doc text

`DESIGN.md:106` ("Watchers") says each channel "owns its `fs.watch` handles", and for git names only `.git/index` and the worktree. It does not say that git also polls the saved workspaces file every 500 ms. Suggested addition: "and polls the saved workspaces file, so a root added in the page is read at the next tick". `DESIGN.md:266` is still true. `HELP.md` has no line about this.

## Limitations

- No unit case can make FSEvents drop an event; the churn reproduction above is the only evidence of the cause.
- The signature misses a write that keeps the same inode and size within one mtime and ctime tick.
- The in-flight case models a close from inside the `roots` callback; no caller in `src` does that today.
