# Q36, repair round 1: the instructions as sent

One message to the builder, verbatim below, sent after `agents/reviews/Q36-refuter.md`. Six rulings. The builder was stopped partway through, so its worktree holds some of these done and some not; a continuation builder reads this file, finds out which, and finishes the rest.

## The six rulings (sent 2026-09-18 13:41:29)

Repair round for Q36. A reviewer reran your work and reproduced every check you quoted, plus the load runs. Six things to close. Everything below is inside your brief and your one path, `tests/server/hpc/ssh.test.ts`; `src/lib/server/hpc/ssh.ts` stays byte-unchanged.

First, the finding in your favour, so you do not weaken anything by accident: the bound is much stronger than your own 3x revert showed. Measured by the reviewer at load 14 to 20, a `KILL_GRACE_MS * 1.1` escalation was red in 5 runs of 5 and `* 1.05` was red in 2 of 3. Keep that strength.

1. **Remove the history from the comment at `:11-12`.** "The fork and the exec that get a stub as far as recording its pid cost more than the budget the case used to give them" names the earlier version of this test. The rule is that a comment says what the code does and why, never an earlier attempt. The sentence works without it: they cost more than a fixed 250 ms budget on a loaded machine.

2. **`:18-19` is false and must state the coverage as measured.** It says what the bound misses is "around a tenth of the grace" on an idle machine. A tenth of the grace is 200 ms. Measured at load 14 to 27 the terms came to 29, 33, 37, 38, 38, 51, 59, 66, 70, 99 ms, so the check is two to four times stronger than your sentence claims. Rewrite it with the measured range, and say it as a property of the machine, not of the file.

3. **The blind spot scales with the load, and nothing says so.** At load 48 to 91 the reviewer measured `bound - afterMs` at 129, 205, 213, 229, 232, 243, 248, 307 ms, because `killSlack` reached 36 to 239 ms and `:208` doubles the max of the two slack terms. At that load a 200 ms late escalation, exactly the regression class the brief's item 3 names, passed 3 runs of 5. Your report's "97 ms under load" was taken at load 24 and understates the loaded blind spot about threefold.

   The ruling: **do not widen anything, and do not accept a weak green.** When the measured slack pushes `killBound` past a ceiling you name in terms of the grace, the machine was too loaded to prove the rule, and the case says so loudly and fails rather than passing. A green run must mean the bound was tight enough to be worth something. Pick the ceiling from your own measurements, state it in the head comment with the numbers behind it, and give it its own case with a revert. A case that goes red because the machine is too loaded to prove anything is the honest outcome; a case that goes green while it could not have caught a 1.1x regression is not.

4. **Two shared helpers have no case of their own.** `stubFile` at `:57` and `recordsPid` at `:70`. The brief's Tests item 3 asks for a case per shared helper; `slackMeter`, `killSeen`, `machineCost` and `killAfterBudget` each got one. Give these two theirs, each with a revert directive that reddens it.

5. **The "never returns" case's bound assertion proves nothing, and your report says it does.** At `:241` the measured values were `after=24 bound=2045`, `after=26 bound=2051`, `after=45 bound=2072`, `after=156 bound=2166`: a two-second margin over an event taking tens of milliseconds. That child honours SIGTERM, so the escalation is never exercised there and only `expect(kill.seen).toBe(true)` is load-bearing. Your DONE row 2 said both cases go through the bound, which is true of the code and overstates what that case proves. Say in the case's own comment which case proves the escalation bound and which does not, and correct that row in your report.

6. **Name the residual flake you moved.** `machineCost` can spend up to `WATCH_MS` waiting for the probe's pid and another `WATCH_MS` in `killSeen`, and `killAfterBudget` then starts at `2 * execMs`. On a slow enough machine those add past the case timeout and the file still goes red for a machine reason. That is red rather than green, so it is honest, but it is why this file will still go red occasionally under the plan's parallel runs and neither the comment nor the report names it. Name it in both.

Not yours, do not touch: the three untouched cases with no revert directive, and the three real-hub reds you reported. You were right about both. The real-hub reds were a defect in their own guard, fixed on main since you started: `tests/real-hub.ts` now asks whether the hub carries data instead of whether the repository root exists, and the three skip in a sparse checkout. Your count was one low, by the way: four things read the real hub, not three, and the spec has been corrected to name all four.

Rerun the whole verification list, `node bin/revert-check.mjs tests/server/hpc/ssh.test.ts` with `0 unproven`, and at least five loaded runs with `uptime` quoted before and after. Report the end state only.
