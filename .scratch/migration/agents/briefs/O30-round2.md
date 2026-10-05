# O30, repair round 2 (the plan's extra round)

The review over round 1 is the section "Repair round 1, refuted" of `agents/reviews/O30-refuter.md` (main checkout ledger); read it whole first. This round exists because G48's test cannot run without showing windows on Axel's screen and is unverified, a fix too large for landing (Z607); the review's other findings go in the same round so the run over it reviews them together. Your brief `agents/briefs/O30.md`, the cases ruling `agents/briefs/O30-cases.md`, the round 1 brief and `agents/spec.md` still hold in full. Line numbers are the reviewer's; check each with `grep -n` before you change it.

Never use breakage testing of any kind: no mutation, no revert or removal of code to watch a test fail, no injected fault, no scratch copy with a block removed. A test is judged by reading it. You run no git command of any kind, `git -C . rev-parse` included. Never take focus on Axel's screen: no `app.focus`, no `osascript activate`, no `Page.bringToFront`, no `focus()` or `show()` called from outside the app's code. Start the app at most once this round for any run outside the tests, on the scratch HOME, and close it by its pid. A run that does not show after one honest try is reported not verified; never rerun a case to tune a harness.

## Items

1. **Z607, `tests/server/desktop/start.test.ts` (G48).** No row shows a window or takes focus: what a row asserts about windows is read from the main process (a recorder on `BrowserWindow.prototype.show` and `focus`, as the standing demand says), and the app under test creates its windows unshown for that run. The cleanup waits on `exit` and falls back to ending the process by its pid when no `exit` comes, so a dialog of no window cannot hang it. The Quit row reads the server process's pid before Quit and checks after `exit` that the pid is gone (`process.kill(pid, 0)` throws `ESRCH`), beside the port check. The file keeps its `slow` tag. Run the file once after the last change and quote it; this run is the one start of the app the tests make, and the report states that no window appeared and no focus moved (the recorder's record).
2. **Z606, Restart without a reload.** `app.ts:232-235` reloads no window. The page recovers on its own: `socket.svelte.ts`, on reconnecting to a new server process, re-runs the page load (`invalidateAll`) and subscribes again with the token it then holds; `postTerminal` (`pty-io.ts:125-131`) and `postCommand` (`writes.svelte.ts:158-176`) re-run the load and retry once after a 403, as `exchange` does at `writes.svelte.ts:497-509`. The paths widen to those three files. HELP.md:13 says what a Restart keeps. The run: the scratch server killed, Restart, then New Terminal and a typed line in an open terminal, with `performance.timeOrigin` unchanged.
3. **S-a.** `origin` follows a port move of a server the app did not start: a `followed(origin)` dependency of `WindowsDeps`, called in `follow()` for a main entry (`windows.ts:49-57,131-139`), sets `origin` in `app.ts` when there is no own server.
4. **P-a.** `window-file.ts:1-4` rewrapped at 100 columns; `installPageConfig` moves to `state/shared/page/install.ts` (Z608), registered in `INNER` at `tests/checks/imports/order.ts:100` above `words`, its two importers changed. `npx vitest run tests/checks` passes and is quoted.
5. **St-a.** `Source.svelte` ends at or under 520 lines with this step's lines in it: split one concern out into its own component, never by compacting code.
6. **B-a.** `bridge.ts:136` reads `getContentBounds()`; the target window answers whether it took the drop, and the source opens a new window when the target took nothing, so a release on another window's title bar or on no pane never leaves the tab where it was. Case 27's run, quoted once.
7. **B-b.** `followFirstLine` (`commands.ts:68-93`) reports the line once the scroll has rested, not on every line passed.
8. **St-c.** HELP.md:353 says the login shell's environment applies to a start from the Dock, as DESIGN.md:396 says.
9. **P-c and P-d.** `wordAt`'s outcomes for punctuation, an apostrophe inside a word and the pointer on a space, and case 21's terminal Cmd+A, Cmd+C, Cmd+X and Cmd+Z, each run once in the one app start of this round, without focus; one that does not show is reported not verified.
10. **P-e and P-f.** The report's opening lines state the end state after round 2; the before and after section names S1's reopen at the saved first line, in Chrome too.

## Verify before you report

The brief's list, once, after the last change: from the worktree's `tools/oculus`, `bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, the lines quoted; then `npx vitest run tests/checks` and the `start.test.ts` run of item 1. While working, run only the test files you changed.

## Report

Append "# Repair round 2" to your report: one row per item, DONE or NOT DONE with its command or run, NOT DONE first; the runs; every test changed by file and title; the verify lines.
