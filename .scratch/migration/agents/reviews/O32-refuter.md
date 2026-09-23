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

# Repair round 1, refuted

Verification (run from .agents/worktrees/O32/tools/oculus, Node v24.21.0, on the round's final tree; `git status --short` before and after: the 8 modified files plus `?? tests/checks/bin/dispatch-note-race.test.ts`)

1. `npx vitest run --reporter=dot`: `Test Files  284 passed (284)` / `Tests  4572 passed (4572)` / `Duration  97.27s`
2. `npm run check`: `COMPLETED 1311 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
3. `npm run build`: `build exit 0`
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit 0`
6. The brief's `LC_ALL=C perl ...` ASCII gate: printed nothing.
7. `sh bin/size-check.sh`: `size 0`. `sh bin/folder-check.sh`: `folder 0`. `wc -l` matches the report's counts (404, 197, 243, 315, 321, 487, 448, 64, 573).
8. `node bin/revert-check.mjs tests/server/sessions/registry.test.ts tests/server/sessions/stores/dispatches.test.ts tests/checks/bin/dispatch-note-race.test.ts tests/server/watch/sessions.test.ts`: `26 reverts, 0 unproven, 11 unchecked`. Every new case red, including the race case (`revert bin/dispatch-note.mjs:171`), the two `:145` cases, the one-ps case (`transcripts.ts:255`), and the watcher's `:130` and `:133` cases. The 11 unchecked are the existing audit case and 10 existing watcher cases without a directive.
8b. `node bin/revert-check.mjs tests/checks/bin/dispatch-note.test.ts`, 5 runs in a row (15:02 to 15:18): `20 reverts, 0 unproven, 0 unchecked` every time.
9. `ls -d $TMPDIR/oculus-* | wc -l`: `7015` before the suite and `7017` after. The two new entries are `oculus-browser.lock` (14:57:45) and `oculus-browser-VfFjl7` (14:57:46), made during my run. The lock named pid 78731, which was `node tests/browser/helpers/serve.ts`, and that process was gone moments later. This step's node suite starts no browser server, so the two entries most likely come from L3's browser run. Not verified.

The launch recipe, run for real in a scratch folder with `HOME=<scratch>` and `sleep 3` as the builder, launched detached with `nohup sh -c '... --pid $$ > id; sleep 3; status=$?; node <note> end "$(cat id)"; echo "exit $status" > exit' &` and `echo $! > pid`:
- The record's `pid` is `52304`, which is the pid file's value, and `ps` shows that pid as the `sh -c` wrapper.
- `pidStart` is `Wed Sep 23 12:56:36 2026`. That is exactly what `TZ=UTC LC_ALL=C ps -o lstart=` printed; the local `ps` printed 14:56:36.
- `transcript "$(cat id)" <path>` from a later Bash call exited 0 and set the transcript.
- The exit file read `exit 0`, and `endedAt` was `2026-09-23T12:56:39.825Z`.
- A second launch (`sleep 6`) was read with the reader's own functions under `TZ=Asia/Tokyo` through `node --experimental-strip-types`. It gave `live: true` while the wrapper ran. After I sent SIGTERM to that wrapper, which I had started, it gave `live: false` with `endedAt: ""`.

## Spec

none. Each of the ten rulings is addressed in the delta:
- S1: the recipe case plus the real run above.
- S6: `newRecord` at `bin/dispatch-note.mjs:331` refuses on signal 0 alone, and `startOf` no longer checks liveness itself.
- P1: two `:145` cases.
- P4: the race file, plus the new `:158` revert on the 150-round case.
- B1/T1: `liveSignature` and the head comment at `watch/sessions.ts:18-25`.
- B2: one `starts` call in `scan`.
- B4: `TZ: 'UTC'` at `:109` and the `.utc` reading at `dispatches.ts:148`.
- T2: the Doc text now quotes the current lines.
- T3: the test is renamed.
- B3/B6: the report gives a before and after.

Two edits go beyond the brief's path list: `watch/sessions.ts` (ruling 5 allowed it) and the refactor of `registry.ts` and `transcripts.ts` (ruling 6). The report names both.

## Proof

P1. The report's verification row 8 quotes `25 reverts, 0 unproven, 12 unchecked` for the four-file revert-check "on the final tree". My run of the same command on the final tree printed `26 reverts, 0 unproven, 11 unchecked`. The quoted line predates the signature case's new directive (`watch/sessions.ts:133`). The report's note mentions that directive, but the table still shows the stale output.

P2. `tests/checks/bin/dispatch-note.test.ts`, case "records a running pid whose start time `ps` cannot give, with an empty start":
`const path = { PATH: dirname(process.execPath) };`
The case relies on node's own folder holding no `ps`. That holds for this nvm install. On a machine where node is `/usr/bin/node` (a distro package on Linux, where `ps` is `/usr/bin/ps`), the writer finds `ps`, records a real stamp, and `expect(record.pidStart).toBe('')` fails. The case does not check its own premise, for example that `spawnSync('ps', ..., { env: { PATH } })` fails, so there it would fail rather than skip.

P3. No case checks that the liveness re-check stays quiet while a launched agent's status holds. "publishes nothing on a re-check that finds the same live sessions" builds no launch and carries no directive. From reading the code, the new `liveSignature` parts depend only on `agent.id` and `agent.status`. `status` in `dispatchedAgent` (`dispatches.ts:110-112`) comes from `endedAt`, `builderLive`, `launcherLive` and `child.live`, and none of these changes between scans unless the state really changes. So I see no churn in steady state; this is not run.

One exception exists. A record with a parseable `pidStart` whose pid has been reused flips between running and done whenever `ps` fails or times out on some scans and not others: `actual === undefined` gives `true` at `:145`, and a mismatch gives `false`. Each flip republishes. It needs a reused pid and a flaky `ps`.

The fixed-interleaving race case is sound. The real `breakStale` never renames, and the mocked `renameSync` makes the second writer's takeover certain under the aside revert, which was red in my run. The 150-round case's new revert (`:158 => return true;`) was red in 5 of 5 runs.

The two TZ cases are sound. The writer runs under `Pacific/Kiritimati` (+14) and the reader sets `process.env.TZ` to `America/Los_Angeles` in-process and restores it in `finally`. Each revert shifts the comparison by hours, and both were red in all 5 runs.

## Standards

T1. `src/lib/server/sessions/registry.ts:207-214`: `export function liveSessions(registries, probe = systemProbe)` now has no caller in `src`. `grep -rn "liveSessions(" src` hits only its own definition, and the only callers are in `tests/server/sessions/stores/transcripts.test.ts:747-793`. The function is kept for the tests alone, and those tests exercise a composition (`registryCandidates` then `probe.starts` then `liveFrom`) that `scan` does not run: `scan` passes a `starts` map that also holds builder pids. The spec's YAGNI line covers this. Either the registry cases move to `registryCandidates`/`liveFrom` or to `scan`, or the function is named as a test helper.

T2. Doc text, HELP.md:183 replacement: "a row with a pid reads running while that process runs and done within about 15 seconds of it exiting or its pid being taken by a later process". When `ps` gave no start time at `start`, `pidStart` is `''` (`bin/dispatch-note.mjs:332`, `dispatches.ts:145`), and a pid taken by a later process then reads running. The DESIGN.md:115 replacement states this exception ("or with no start time to compare"); the HELP sentence does not. Every other Doc text sentence I checked matches the code, and each "now reads" quote matches `grep -n` on DESIGN.md:114, DESIGN.md:115 and HELP.md:183 in full.

## Behaviour

B1. `src/lib/server/sessions/stores/transcripts.ts:253-254`:
`const pending = pendingBuilders(notes);`
`const answered = new Set(pending.map((note) => note.pid).filter((pid) => probe.running(pid)));`
Every scan now sends signal 0 to the pid of every unstamped record in the note, whether or not its parent is in the scan window. Any such pid that answers is passed to `ps`. The note is never pruned, so records whose launcher died without an end stamp pile up. The work grows with the note's lifetime, not with the window. The report states this as a judgment call. The cost is small per pid; how many pids a long-lived note would carry is not measured.

B2. The recipe records the `sh -c` wrapper (`--pid $$`), not the builder. If the wrapper dies while its child builder lives, the row reads done with the builder still running; the report's landing look (step 4, SIGTERM to the wrapper) produces exactly this. In my scratch run, the `sleep` child was not signalled when I killed the wrapper. A reader following that look should expect the `sleep 60` to keep running while the row reads done.

B3. The one-`ps` refactor keeps the registry's liveness: the body of `liveFrom` is the old loop unchanged. `systemProbe.starts` ignores `ps`'s exit status and reads every line, so adding builder pids to the call cannot drop a registry pid's answer. Every registry and watcher case passes. No finding.

## Not checked

- The browser suite and the look at the Agents view on the TEST page.
- The report's timing of one `ps` versus two per scan (median 24.4 vs 20.3 ms): not rerun.
- A watcher run showing that re-checks with a steady launched agent publish nothing: reasoned from the code, not run (P3).
- The P2 case on a machine where node's folder holds `ps`.
- Whether the two new `oculus-browser*` temp entries came from L3.
- The codex and claude forms of the launch lines with a real builder: only `sleep` stood in for the builder.

## Usage

About 25 tool calls, about 30 minutes of wall time. Most of it went to the full suite (97 s), one four-file revert-check and five writer-file revert-checks (about 3 to 4 minutes each).

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/O32-report.md`, "# Repair round 1") unless named otherwise:

- S1, launch lines that did not fit the recipes: the lines run inside the detached `sh -c` wrapper with an id file beside the pid file; a case runs them for real. Corrected at landing: the wrapper starts the builder in its background and records the builder's own pid (`--pid $builder`), not the wrapper's `$$`, so a killed wrapper cannot mark a live builder done; the case checks the recorded pid is a `sleep` whose parent is the wrapper.
- S2, S3, S4, S5: the locale fix, the `transcripts.ts` widening and the sharper wait case kept; the probe interface reused.
- S6, a live pid whose `ps` fails refused with a false message: signal 0 alone decides, and such a pid is recorded with an empty start.
- P1, the no-start-time branch unproven: two cases, red under `dispatches.ts:145`.
- P4, the race case's revert green by chance: a fixed-interleaving case in `dispatch-note-race.test.ts` carries the aside revert, and the 150-round case carries a revert that is red every time; five revert-check runs of the file, 0 unproven.
- T1 and B1, a builder that exits unstamped reaching the page up to five minutes late: `liveSignature` carries each launched agent's status, and the 15 s re-check publishes the change.
- T2, the Doc text quoting elided lines: quoted in full.
- T3, history wording in a test name: reworded.
- B2, two `ps` calls per scan: one `probe.starts` per scan answers both.
- B3, B6, the before and after: stated in the round's report.
- B4, a launcher and a server in different time zones: the writer runs `ps` with `TZ=UTC` and the reader compares the UTC reading; two cases.

The run over repair round 1, closed at landing on 2026-09-23:

- Proof P1, a stale revert count in the report's table: a record in the ledger, no change to the tree.
- Proof P2, the no-ps case relying on node's folder holding no `ps`: it now runs the writer with an empty folder as PATH and asserts first that `ps` cannot be found there.
- Proof P3, churn on re-checks: none in steady state, from the reading; a reused pid whose `ps` fails on some scans and not others flips its row and republishes, which needs both a reused pid and a failing `ps`. Not changed.
- Standards T1, `liveSessions` kept for the tests alone: removed from `registry.ts`; the tests build it from `registryCandidates` and `liveFrom` in a helper of their own.
- Standards T2, the HELP sentence missing the no-start-time exception: the applied HELP.md text states it.
- Behaviour B1, signal 0 for every unstamped record of a note that is never pruned: `pendingBuilders` takes the scan's window and leaves out launches started before it, which read as rows without a pid; a case is red under each of its three reverts.
- Behaviour B2, the wrapper's pid recorded instead of the builder's: closed under S1 above.
- Behaviour B3: no finding.
- Found at landing: the watcher case's fixture launch was dated 2026-09-10, outside the new window; it is dated at the moment the case runs.
