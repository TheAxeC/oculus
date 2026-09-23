Verification (run from .agents/worktrees/O32/tools/oculus, Node v24.21.0)

1. `npx vitest run --reporter=dot`: `Test Files  283 passed (283)` / `Tests  4562 passed (4562)` / `Duration  102.77s`
2. `npm run check`: `COMPLETED 1310 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. The brief's `LC_ALL=C perl ...` ASCII gate: printed nothing.
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
8. `node bin/revert-check.mjs tests/server/sessions/registry.test.ts tests/server/sessions/stores/dispatches.test.ts tests/checks/bin/dispatch-note.test.ts`: `33 reverts, 0 unproven, 1 unchecked`. The unchecked one is the existing audit case `audits that a builder older than the window is not listed and its row opens nothing`. Every new case was red. I then ran `node bin/revert-check.mjs tests/checks/bin/dispatch-note.test.ts` 6 more times (14:00 to 14:13). All 6 printed `16 reverts, 0 unproven, 0 unchecked`. The 150-round race case was red in 7 of my 7 runs; the report says it was green in 1 of 7 of the builder's runs.
9. `ls -d $TMPDIR/oculus-* | wc -l`: `7060` before and `7015` after the suite. L3 was running beside this at the same time, so the count proves nothing about this step either way; it did not grow.
`git status --short` was the same before and after every run: the 6 modified files plus `?? tests/server/sessions/registry.test.ts`. The new test file is untracked, so `git diff 138afb83 --stat` does not list it.

## Spec

S1. The launch command lines in the report do not fit how the recipes launch a builder, and `end` cannot run as written.
- The brief asks for the lines "as the launch recipes will call them". The report gives `codex exec ... &` with `builder_pid=$!` and `note_id=$(... start ...)`, then later `... end "$note_id"`.
- The plan-orchestration skill's recipes (`~/workspace/ordo/skills/plan-orchestration/SKILL.md:59-72`) launch detached with `nohup sh -c '...; echo "exit $?" > <exit file>' &` and `echo $! > <pid file>`. A monitor then watches the exit file from a later shell call.
- A runner's shell does not keep variables from one call to the next. So `$note_id` is gone by the time `end` is due, and the report names no file to keep the id in.
- `launch_note: node tools/oculus/bin/dispatch-note.mjs` is a path relative to the current folder, and the recipe `cd`s into the worktree.
- A form that works: an absolute script path, and `start --pid $$`, the builder, then `end` all run inside the `sh -c` wrapper. Or write the id to a file beside the pid file.
- The orchestrator writes the recipes at landing from these lines, so this has to be corrected before landing.

S2. The `registry.ts` change (`:61-67`, `env: { ...process.env, LC_ALL: 'C' }`) is not asked for by any brief item, but it is needed.
- I reproduced the premise. `LC_ALL=nl_NL.UTF-8 ps -o lstart= -p $$` printed `wo 23 sep. 13:59:56 2026`. `parseStamp` (`registry.ts:89-104`) rejects that.
- Without the change, the reader's `starts` would return nothing under such a locale. `sameBuilder` (`dispatches.ts:143-147`) then trusts the running pid alone, so item 1's promise that "a pid later reused ... is never taken for the builder" would quietly fail.
- It is also a behaviour change for Claude session liveness, which the report states only as a judgment call. See B3.
- Axel's locale is `LANG="en_US.UTF-8"` (`locale`), so nothing changes on this machine today.

S3. The `transcripts.ts` change (`:243`, `:282-283`) sits outside the brief's path list and is needed: without it the reader never gets the probe. The report names it. Not a finding.

S4. The change to the existing case "is taken fresh by a writer that waited" (`dispatch-note.test.ts:320-333`) only moves the `await import(SCRIPT)` ahead of `writeFileSync(lock, ...)`. The lock's age then measures only the wait. It sharpens that case's revert and does not weaken the check. Not a finding.

S5. The process check does go through the registry's `Probe` interface (`dispatches.ts:155-165` uses `probe.running` and `probe.starts`). The writer (`bin/dispatch-note.mjs:103-114`) makes its own `ps` call, since it is a separate plain `.mjs` script that cannot import the TypeScript probe. The brief's item 3 is about the sessions layer. Not a finding.

S6. The writer refuses a live pid whose `ps` fails or times out, with the message `--pid <n> names no running process` (`bin/dispatch-note.mjs:330-332`, together with `startOf` returning `''` on a `ps` error). That message is false in that case. The refusal goes beyond the brief, which says to refuse a pid that "names no running process". The report does not state it as a judgment call.

## Proof

P1. No case proves judgment call 4: a running pid for which `ps` gives no start time reads running. Nothing tests `sameBuilder` returning true when `actual === undefined` or when the stamp does not parse (`dispatches.ts:145`). If that branch is reverted to `return false`, every current case stays green. I did not run that revert; I read each case's fixture: `f.builder` always sets `startOf`.

P2. The reused-pid rule is proven in two halves, and both halves hold.
- The reader half: "reads done when the pid now names a process with another start time", revert `dispatches.ts:147 => return true`, was red.
- The writer half: the pid 1 case checks that the stamp the writer records parses to exactly what `systemProbe.starts([1])` returns. Its revert (`:107`) was red.
- No test covers the writer and the reader having different time zones (see B4).

P3. Judgment call 5 (compare only the local-time reading) is correct against how the writer records the stamp. The writer stores `ps` text, which is local time. The reader compares `parseStamp(...).local` with the probe's `clock.local` (`registry.ts:77`), both read by the one parser. Also taking the UTC reading, as the registry does, would only let a pid reused exactly one UTC offset later pass as the builder. Recording raw local text still makes the result depend on the time zone (B4).

P4. The 150-round race case (`dispatch-note.test.ts:172-190`).
- Its revert comes from an earlier step: this step changed only the revert's line number (`:126-142` to `:172-188`).
- I measured it red in 7 of 7 runs; the builder's report says green in 1 of 7. The case is sound in design: it looks for a race, and its own comment says the defect shows in "a few rounds of a hundred".
- It is not this step's defect. But brief item 8 asks for "0 unproven" over the changed file, and the report's first line says "Everything in the brief is done" with the exception tucked into a caveat.
- The fair wording is: item 8 holds except for a flaky revert this step inherited, booked for its owner. The orchestrator should book it rather than accept the caveat.

P5. The report's counts match my runs: 4562 cases, 283 files, 1310 files checked, 16 reverts in the writer file, and the line counts from `wc -l` (404, 226, 200, 304, 352, 446, 30). The report's "7015 before, 7015 after" temp-folder count is not reproducible while L3 runs.

P6. The new `registry.test.ts` can only fail on a machine that has `nl_NL.UTF-8`; elsewhere it passes whatever the code does. The report says so. It is red here.

## Standards

T1. A head comment is now false. `src/lib/server/watch/sessions.ts:18`: "The 15 s liveness re-check covers the one change to the payload no file event announces." A builder process that exits without its launcher stamping the end is now a second such change (see B1). This line is in no Doc text.

T2. The report's Doc text elides the current lines with "..." for DESIGN.md:115 and HELP.md:183. The brief asks for each "as `grep -n` prints it now". The replacement text itself matches the code as far as I checked: the DESIGN.md:114 locale clause, the field list and the pid rule in DESIGN.md:115, and HELP.md:183. The Doc text does not cover the watcher's re-check wording (T1, B1).

T3. Two items are borderline history, not the code's own facts:
- the test name "reads a record without a pid, or with one that is not a pid, exactly as before" (`dispatches.test.ts:406`);
- the comment "A record as the writer wrote it before it took a pid" (`dispatches.test.ts:409`).
Both describe an earlier version. "A record without the pid fields" says the same fact without history.

T4. Checked and clean: ASCII, file sizes (all under 450 lines), folder counts (`tests/server/sessions` has 5 entries), and the new file's head comment ("Layer 4, test."). Every comment line over 100 columns is a single-line revert directive, the same as the existing ones.

## Behaviour

B1. A launch whose builder exits unstamped can read running on the page for up to five minutes.
- The watcher's 15 s re-check publishes only when `liveSignature` changes (`watch/sessions.ts:106-113` for the signature, `:202-209` for the re-check). The signature holds only live session ids and their states; the status of a launched agent is not in it.
- When a pid-carrying builder exits with nothing written and no watched session changing state (the brief's case: no transcript, launcher gone), the scan knows the launch is done, but nothing publishes it. The row keeps reading running until the 5-minute sweep (`RESCAN = 300000`, `:52`) or an unrelated file event.
- The brief's "known done once its process is gone" therefore reaches the reader late by up to 300 s. The fix is to add each launched agent's id and status to `liveSignature`. That touches `watch/sessions.ts`, outside the listed paths, but it is inside what this step exists to deliver.

B2. Cost of the added `ps` call.
- Each scan runs one more `ps` while any joined launch with no end stamp has a pid that answers signal 0. Scans run on every file event and every 15 s re-check.
- Measured with a node `spawnSync` loop of 20 runs (`ps -o pid=,lstart= -p 1 -p <pid>`, `LC_ALL=C`): median 25.3 ms, max 118.8 ms, with L3 loading the machine.
- It is synchronous, so it blocks the server's event loop, on top of the registry's own `ps` in the same scan. The two calls could be merged into one `probe.starts` call. The report says "not measured".

B3. The registry now runs `ps` under the C locale. Under a non-English locale this turns the registry's check for a reused pid back on.
- Before: a session whose registry pid had been reused by another process read live under such a locale.
- After: it reads ended.
- The report states this only as judgment call 2, with no before and after. No change on Axel's `en_US` machine.

B4. A time-zone difference makes a live builder read done. The writer records the `ps` text in the launcher's time zone (it inherits the launcher's `TZ`). The server reads its own `ps` and parses both stamps in the server's time zone. If the launcher runs with a different `TZ` than the server, the two differ by the offset, and a running builder reads done. Recording epoch seconds instead would remove this. The report does not state it.

B5. What a row reads when `ps` fails or times out (judgment call 4): the pid alone decides. The row reads running while signal 0 answers, which matches the registry's `sameProcess`. In that window a reused pid reads as the builder. This matches the report and is untested (P1).

B6. Reader-visible change the report does state: a record with a pid now ignores the launcher and the builder's session. A row whose launcher is alive but whose pid is gone now reads done where it read running before. It shows only for records written with `--pid`. The report gives no view, state or before-and-after for the landing look; the Agents view with a launched row whose pid exits is the state to check.

## Not checked

- The browser suite, including `tests/browser/sessions/agents.spec.ts`.
- The look at the Agents view on the TEST page.
- A run on a machine without `nl_NL.UTF-8`.
- The P1 revert (`dispatches.ts:145 => return false`): stated from reading the fixtures, not run.
- A real detached launch through the skill's `nohup sh -c` recipe with `--pid $!`.
- The builder's 1-in-7 green for the race case: my 7 runs did not reproduce it.

## Usage

About 25 tool calls. Wall time about 25 minutes, most of it the full suite (103 s) and 7 revert-check runs of the writer test file (about 2 minutes each).
