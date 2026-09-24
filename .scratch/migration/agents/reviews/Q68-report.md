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
