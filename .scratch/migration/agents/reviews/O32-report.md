Everything in the brief is done. One caveat on item 8: a writer-test case this step did not change, "lands every record of many writers started at once against a lock a dead writer left", has a revert that fails by chance. It went GREEN (unproven) in 1 of the 7 revert-check runs over `tests/checks/bin/dispatch-note.test.ts` made after the final edit to that file. The other 6 runs reported 0 unproven. That case's only change in this step is its revert line number.

## DONE / NOT DONE

All commands were run from `.agents/worktrees/O32/tools/oculus` with Node v24.21.0 first on PATH.

| # | Item | Command | Output |
|---|---|---|---|
| 1 | Suite | `npx vitest run --reporter=dot` | `Tests  4562 passed (4562)` (last run 13:48:39, Duration 85.35s); the earlier full run printed `Test Files  283 passed (283)` |
| 2 | Check | `npm run check` | `COMPLETED 1310 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | Build | `npm run build` | `build exit 0` |
| 4 | Format | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | Lint | `npm run lint` | `lint exit 0` |
| 6 | ASCII | the brief's `LC_ALL=C perl ...` over `src tests bin config` | printed nothing |
| 7 | Size and folders | `sh bin/size-check.sh`; `sh bin/folder-check.sh` | `size exit 0`, `folder exit 0` |
| 8 | Reverts | `node bin/revert-check.mjs tests/server/sessions/registry.test.ts tests/server/sessions/stores/dispatches.test.ts tests/checks/bin/dispatch-note.test.ts` | Reader and registry files: every case red except one, and every new case red. The exception is `unchecked ... audits that a builder older than the window is not listed and its row opens nothing`, an audit case that already existed and is named as one. Writer file, 7 runs after its last edit: 6 printed `16 reverts, 0 unproven, 0 unchecked`, 1 printed `GREEN ... lands every record of many writers ... (revert bin/dispatch-note.mjs:172)` and `16 reverts, 1 unproven` |
| 9 | Temp folders | `ls -d $TMPDIR/oculus-* \| wc -l` before and after | `7015` before, `7015` after |

## The record's new fields

- `pid` (number): the builder's process id, or `0` when `--pid` was not given.
- `pidStart` (string): that process's start time exactly as `ps -o lstart= -p <pid>` prints it under `LC_ALL=C`, for example `Mon Jul 20 23:01:59 2026`. It is `''` when there is no pid.

`start` now always writes both fields. A record written before this change, with neither field, reads as `pid: 0, pidStart: ''`. So does a `pid` that is not a safe whole number above zero.

## What was built

**Writer, `bin/dispatch-note.mjs`:**
- `START_FLAGS` gains `'pid'`.
- `pidOf` accepts digits only, `/^[1-9][0-9]*$/` plus `Number.isSafeInteger`. Anything else is refused with `--pid must be a process id: <value>`.
- `startOf(pid)` asks with signal 0 (the existing `alive`), then runs `spawnSync('ps', ['-o','lstart=','-p',pid])` with list arguments, a 3 s timeout and `LC_ALL=C`. It accepts only the lstart shape.
- A pid with no running process, or with no readable start time, is refused with `--pid <n> names no running process` before any lock is taken, so nothing is written.

**Reader, `src/lib/server/sessions/stores/dispatches.ts`:**
- `builderProcesses(notes, probe)` asks the registry's `Probe`: `running(pid)` for every note with a pid and no end stamp, then one `starts([...])` call.
- `sameBuilder` compares `parseStamp(pidStart).local` with the start time `ps` gives now, within `PROC_START_SLACK`.
- `dispatchedAgent(note, child, launcherLive, builderLive)`: the end stamp wins. Otherwise a note with a pid reads running exactly while its process runs with its recorded start time. A note without a pid (`builderLive` null) uses the old rule unchanged.
- `joinDispatches` takes the probe and asks it only about notes whose parent the scan holds.

**The test cases the brief asks for:** live pid with the launcher gone reads running; dead pid reads done; reused pid (start time 3600 s later) reads done, and a start 1 s off still reads running; a record without a pid, or with a pid that is not one, reads as before and the probe is never asked; `start --pid` with a dead pid is refused and no `.oculus` folder is created.

**Added cases:** pid 1's recorded stamp parses to the same time `systemProbe.starts([1])` returns; the writer records a C-locale stamp when it runs under `nl_NL.UTF-8`; bad `--pid` values (empty, `0`, `-3`, `abc`, `12x`, `1.5`, ` 7`, `0x10`, a number past safe-integer range) and `--pid` given twice are refused; an ended launch is never asked about. Every new case carries a revert and was red under it.

## Command lines a launcher runs through `launch_note:`

With `launch_note: node tools/oculus/bin/dispatch-note.mjs` (any path to the script works; it uses Node's own modules only):

```sh
# at the launch, after starting the builder in the background, e.g. `codex exec ... &`
builder_pid=$!
note_id=$(node tools/oculus/bin/dispatch-note.mjs start --launcher plan-orchestration --label O32 --harness codex --model gpt-5.6-sol --parent "$SESSION_ID" --cwd "$WORKTREE" --pid "$builder_pid")
# when the builder's transcript or rollout path is known
node tools/oculus/bin/dispatch-note.mjs transcript "$note_id" "$TRANSCRIPT_PATH"
# when the builder exits
node tools/oculus/bin/dispatch-note.mjs end "$note_id"
```

`start` prints the id on stdout and exits 0. Any refusal exits 1 with `dispatch-note: <reason>` on stderr. `--pid` must be given while the builder runs; a recipe that starts the builder in the foreground has no pid to give and leaves the flag out.

## Judgment calls (each reversible)

1. **Field names and format.** The fields are `pid` and `pidStart`, and `pidStart` keeps the raw `ps` text rather than epoch seconds. The writer then needs no second copy of `parseStamp`, and both sides turn the same text into a number with the one parser at read time.
2. **The registry's probe now runs `ps` under `LC_ALL=C`** (`registry.ts:67`, the `env` line). Under a non-English locale `ps` prints `wo 23 sep. 13:11:54 2026` (shown by `LC_ALL=nl_NL.UTF-8 ps -o lstart= -p $$`), which `parseStamp` rejects. That silently switched off the reused-pid check for the registry, and would have for launch records too. The new test `tests/server/sessions/registry.test.ts` is red without the line. On a machine with no `nl_NL` locale, `ps` falls back to C and that test cannot fail.
3. **`transcripts.ts` is outside the brief's path list.** It changes by two lines so `scan` passes its own probe (`options.probe ?? systemProbe`) to `joinDispatches`. Without this, the tests' stub probe would not reach the pid check, and the real `systemProbe` would be asked about fixture pids.
4. **A running pid with no start time available is kept as the builder.** If `ps` gives no start time (timeout or failure), or `pidStart` was hand-edited into something unreadable, the running pid alone keeps the row running. This is the registry's `sameProcess` rule. In that window a reused pid would read as the builder.
5. **The comparison reads the stamp as local time only.** The registry's `sameProcess` also accepts the UTC reading. That extra reading would let a pid reused exactly one timezone offset later count as the builder.
6. **Test fix in "is taken fresh by a writer that waited".** The case now loads the script before it writes the lock. Before, the import's time counted toward the lock's age, and the case's revert could stay green: this happened in 1 of 2 revert-check runs.
7. **Reverts renumbered.** Every existing revert directive in both test files was moved to its line's new number. The `transcripts.ts:282` revert now reads `() => null,` because an argument follows it.

## Limitations

- **The 150-round race case's revert is probabilistic.** Its own comment says the revert loses a record "in a few rounds of a hundred", and it stayed green in 1 of 7 runs. This is not repaired here.
- **One `ps` call is added per scan** while any joined launch has a pid and no end stamp. It is not measured.

## Files changed (line counts from `wc -l`)

- `bin/dispatch-note.mjs`: 404 (was 349)
- `src/lib/server/sessions/stores/dispatches.ts`: 200 (was 130)
- `src/lib/server/sessions/registry.ts`: 226 (was 223)
- `src/lib/server/sessions/stores/transcripts.ts`: 304 (was 302)
- `tests/server/sessions/stores/dispatches.test.ts`: 446 (was 335)
- `tests/checks/bin/dispatch-note.test.ts`: 352 (was 286)
- `tests/server/sessions/registry.test.ts`: 30 (new)

Nothing under `src/lib/shell/`, `src/lib/views/` or `config/` was touched. `grep -rn "pidStart\|--pid" src tests bin config DESIGN.md HELP.md README.md` has no hits outside the writer, the reader and the tests.

## Doc text

DESIGN.md:114, now:
`114:- The live registry: \`<dir>/sessions/<pid>.json\` of each Claude account, with \`sessionId\`, \`status\` (\`busy\` or \`idle\`), \`name\`, \`cwd\`. Liveness is \`kill(pid, 0)\` plus a \`procStart\` match; the registry writes that stamp in UTC and \`ps\` reports local time, so the match parses both and allows two seconds.`
Replacement:
`- The live registry: \`<dir>/sessions/<pid>.json\` of each Claude account, with \`sessionId\`, \`status\` (\`busy\` or \`idle\`), \`name\`, \`cwd\`. Liveness is \`kill(pid, 0)\` plus a \`procStart\` match; the registry writes that stamp in UTC and \`ps\`, run under the C locale so its stamp is readable, reports local time, so the match parses both and allows two seconds.`

DESIGN.md:115, now:
`115:- Launched builders: \`~/.oculus/dispatches.json\`, one record per launch (\`id\`, \`launcher\`, \`label\`, \`harness\`, \`model\`, \`parent\`, \`cwd\`, \`transcript\`, \`startedAt\`, \`endedAt\`), written by ... With no end stamp the row reads running while the launcher's session is live, and follows the builder's session once the launcher's is not.`
Replacement:
`- Launched builders: \`~/.oculus/dispatches.json\`, one record per launch (\`id\`, \`launcher\`, \`label\`, \`harness\`, \`model\`, \`parent\`, \`cwd\`, \`transcript\`, \`startedAt\`, \`endedAt\`, \`pid\`, \`pidStart\`), written by \`bin/dispatch-note.mjs\` under a lock with an atomic replace, a dead lock cleared only under a second lock that re-checks it; each record whose \`parent\` is a scanned session joins that session's \`agents\` as \`dispatch:<id>\`, and its row names the builder's own session when the scan found that transcript. \`pid\` is the builder's process as \`start --pid\` gave it (0 when none), and \`pidStart\` its start time as \`ps\` printed it under the C locale; a pid that names no running process is refused. With no end stamp, a row with a pid reads running while that pid runs with that start time, asked through the registry's probe, and done once it does not; a row without one reads running while the launcher's session is live, and follows the builder's session once the launcher's is not.`

HELP.md:183, now:
`183:A launcher that starts an agent as a process of its own (a Codex worker, or \`claude -p\`) records it with \`node bin/dispatch-note.mjs start --launcher <what> --label <work> --harness claude|codex --parent <session id> --cwd <dir> [--model <m>] [--transcript <path>]\`, which prints an id; ... once the launcher's session is not live, it follows its builder's own session when the scan holds it.`
Replacement:
`A launcher that starts an agent as a process of its own (a Codex worker, or \`claude -p\`) records it with \`node bin/dispatch-note.mjs start --launcher <what> --label <work> --harness claude|codex --parent <session id> --cwd <dir> [--model <m>] [--transcript <path>] [--pid <n>]\`, which prints an id; \`transcript <id> <path>\` adds the transcript once known and \`end <id>\` stamps the end. \`--pid\` names the builder's running process, and a pid no process has is refused. The Agents view draws each record under the session named as its parent. A launched row reads done once its end is stamped. Before that, a row with a pid reads running while that process runs and done once it is gone or its pid names a later process; a row without one reads running while its launcher's session is live, and once the launcher's session is not live, it follows its builder's own session when the scan holds it.`
