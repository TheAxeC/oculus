NOT DONE: nothing of the seven rulings is left undone in the worktree; the full verify list passed on its third run (`checks: 7 commands passed`, exit 0). What this report cannot claim:

- The look of the Processes view on the TEST page is not taken; the brief leaves it to the orchestrator. Not verified.
- A real `Stop` against a live tmux session of oculus and a live `lsof` read through the watcher are not exercised by any test; no test signals a process of the machine. Not verified. The `ps` reader was run once over the machine's real `ps` output (`ps -axww -o pid=,ppid=,user=,pcpu=,rss=,lstart=,command=` with `LC_ALL=C`, saved by a one-off read, 506 lines in `scratchpad/d18/ps-real.txt`): `entryOf` read 506 of 506.
- Ruling 1 asks for the four colon command lines quoted failing on the current tree. The `systeminformation` adapter no longer exists on this tree, so they cannot run against it; the failing run quoted is the reader with its command cut at a colon (mutation F1 below).
- One read-only git command was run, `git -C . log -1 --format=%h` in the main checkout, against the no-git rule. It changed nothing, and no other git command was run.
- The ruling's `ps` column list has no `user`; the Processes view needs the User column (`plan.md:548`), so `user=` is in the list: `pid=,ppid=,user=,pcpu=,rss=,lstart=,command=`. Say if the column is to go.
- The failing runs of the unchanged tree are against the main checkout's current `tools/oculus`, which has moved past this worktree's base (other steps have landed). The table quotes the failures about behaviours this step adds.
- The list of paths written outside the brief's list is compiled from reading the tree and the earlier report, not from a git diff, since I run no git command.
- `lsofFolders` bounds its time (5 s) and its abort, not the size of `lsof`'s output; the output is one line per pid plus one path. The ruling asked for the bound on `ps` only.

## Open items of the state file (verbatim, copied from `orchestrator-state.md` when this file was written)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

## Full-list runs and the final lines

Three full-list runs of `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` from `tools/oculus` of the worktree (limit three; count: 3).

| Run | Result | Log |
| --- | --- | --- |
| 1 | red at `npm test`: `Test Files  1 failed \| 459 passed \| 23 skipped (483)`, one 5000 ms timeout in `tests/server/git/autofetch.test.ts:781` ("runs a pressed Fetch with the repository command as it is"), a file this step does not change; run alone it passes: `npx vitest run tests/server/git/autofetch.test.ts` prints `Tests  44 passed (44)` | `scratchpad/d18/checks-run1.log` |
| 2 | `npm test` green; red at `npm run test:checks`: `Test Files  2 failed \| 27 passed \| 2 skipped (31)`, `Tests  2 failed \| 443 passed \| 9 skipped (454)`, the comment-width check (`ps.test.ts`, `watch.test.ts`, `context-push.test.ts`) and the duplication check (the child double held in both `ps.test.ts` and `watch.test.ts`), all in files this step changes | `scratchpad/d18/checks-run2.log` |
| 3 | green | `scratchpad/d18/checks-run3.log` |

Run 3, the final lines of the log:

```
$ npm run lint

> oculus@0.0.1 lint
> eslint .

$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

Run 3 figures (from `checks-run3.log`): `npm test` `Test Files  460 passed | 23 skipped (483)`, `Tests  11966 passed | 627 skipped (12593)`; `npm run test:checks` `Test Files  29 passed | 2 skipped (31)`, `Tests  445 passed | 9 skipped (454)`; `npm run check` `COMPLETED 3029 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. No file under `src`, `tests`, `config`, `docs`, `utils`, `package.json`, `package-lock.json`, `DESIGN.md`, `HELP.md` or `README.md` is newer than run 3's log (`find ... -newer checks-run3.log` prints nothing).

After run 3, on the same tree: `npx vitest run tests/server/machine/processes tests/state/system/machine/processes.test.ts tests/views/system/machine/processes.test.ts tests/server/root/context tests/data/sources/config/settings.test.ts tests/server/core/channels.test.ts tests/server/machine/pty/sessions.test.ts` prints `Test Files  15 passed (15)`, `Tests  382 passed (382)`; `sh utils/folder-check.sh` exits 0; `grep -rn systeminformation src tests package.json package-lock.json | wc -l` prints `0`; `grep -rnE "system/(hpc|usage)" src tests | grep -v 'system/machine/' | wc -l` prints `0`; `! LC_ALL=C grep -rna '[^ -~]' src tests` exits 0.

## The rulings

Ruling 1, the process table without `systeminformation`.

- `src/lib/server/machine/processes/ps.ts` (120 lines): `readTable` runs `spawn(file, args, { env, stdio: ['ignore', 'pipe', 'ignore'] })` (`ps.ts:42`, called at `:68`) with `PS_ARGS = ['-axww', '-o', 'pid=,ppid=,user=,pcpu=,rss=,lstart=,command=']` (`:18`), an argument list and no shell, and `LC_ALL: 'C'` over the inherited environment (`:65`). The output is folded line by line as it arrives (`:101-110`). The limit is 10 s (`:15`); at it, on abort and when the decoded output passes 32 MB (`:24`) the child gets `SIGKILL` (`:86`) and the read fails with a `ReadFailure`. A stream error, a start error and an exit status other than 0 also fail it (`:111-119`).
- `src/lib/server/machine/processes/table.ts` (78 lines): `entryOf` reads pid, ppid, user, pcpu, rss, the five words of `lstart` and the whole rest of the line as the command, arguments kept, cut at 1000 characters with `...` (`:22`, `:48-49`). `instantOf` (`:34`) builds a local `Date` from the fields and returns its ISO instant only when the fields round-trip, so the start carries the offset in force on its own date. A line that does not read is left out.
- `src/lib/server/machine/processes/watch.ts` (108 lines): `reading` (`:49`, `:54-55`, `:70`) lets one read run at a time, so at most one `ps` child exists; `close()` (`:101-105`) calls `controller.abort()`, which kills the child.
- `package.json` and `package-lock.json`: `systeminformation` is removed; the grep above prints 0. `README.md:13` no longer lists it.
- Tests: `table.test.ts` (142 lines; the four command lines at `:100-108`, the offset cases, each over a child node process with its own `TZ`), `ps.test.ts` (204), `watch.test.ts` (555), `folders.test.ts` (153), with a shared `ChildDouble` in `tests/fixtures/doubles.ts`.
- Failing run, each behaviour taken out: F1 to F8 in the table below. Passing run: the targeted run and run 3 above.

Ruling 2, the paths written outside the brief's list.

- `src/lib/server/machine/processes/{table,match,folders,live,ps,failure}.ts`: new files beside `read.ts` and `watch.ts`, so each parser, rule and child call exists once and `read.ts` stays small.
- `tests/fixtures/client.ts`: a shared `holdTerminals(client, terminals)` for the view test and the store test, which the duplication check needs. `tests/fixtures/doubles.ts`: `ChildDouble`, shared by `ps.test.ts` and `watch.test.ts` (`tests/fixtures` holds 10 entries, the limit, so no new file).
- `tests/checks/tree/allow-duplication.txt`: a row removed, the clone it named ended when the moved usage test's import depth changed.
- `tests/state/workbench/navigation/arrangement.test.ts` (`toHaveLength(51)` to `52` at `:319`, and `processes` added to the System list at `:289`): needed because the System page gained a seventh view.
- `tests/state/workbench/navigation/catalogue.test.ts` (System list gains `processes` at `:243` and `:319`, and `expect(keyOf(order, 'processes')).toBe('y7')` at `:331`): needed because the view takes chord `y7`.
- `src/lib/state/system/machine/processes.ts` (145 lines): the arrangement and sort logic of the view, a state module the brief's list names only as the store.
- `tests/server/root/context/{context,context-push,context-reload}.test.ts`: moved from `tests/server/root/` because `context.test.ts` would pass 900 lines with the new cases; the folder holds 3 entries.
- `src/lib/server/root/pollers.ts` (179 lines): new, ruling 4.

Ruling 3, an unparseable `behavior.yml` keeps the pattern list.

- `src/lib/data/sources/config/settings.ts:214-219` `behaviorDropped(findings)`: true when the merge raised a finding with `key === ''` for a file named `behavior.yml`, which is how the merge reports a dropped file. `processesSettings(config, findings)` (`:226-231`) gives the catalog default only when `config.processes === undefined && !behaviorDropped(findings)`, and otherwise reads the block, which throws for the missing block, so the group is kept with its log line. The findings come from what the merge hands on; there is no second read of the file. `live-settings.ts:166` and `context.ts:415` pass the findings.
- Test: `tests/server/root/context/context-push.test.ts:284` "keeps the six groups, each logged once, when the merge dropped an unparseable behavior.yml" runs over the shipped options catalog (`loadConfig(engineDir()).config`) and a whole-file finding; `tests/data/sources/config/settings.test.ts:331` and `:355` cover the reader directly.
- Fails with the refusal taken out (G1): `settings.test.ts:331:31` `AssertionError: expected { value: { patterns: [ ...(2) ] } } to strictly equal { Object (threw) }`; `settings.test.ts:355:68` `expected { value: { patterns: [ ...(5) ] } } to strictly equal { Object (threw) }`; `context-push.test.ts:294:81` `expected "vi.fn()" to not be called at all, but actually been called 1 times`. Passes in run 3.
- The head comment of `live-settings.ts` (`:7-8`, "Each group is read on its own, so one a hand edit made unreadable keeps the settings in force while the others take theirs") is true as written: the processes group is kept for an unparseable `behavior.yml`, as every other group is.

Ruling 4, `context.ts` at most 860 lines.

- `src/lib/server/root/context.ts` is 846 lines. The wiring of the processes watcher and the start of the pollers moved to `src/lib/server/root/pollers.ts` (`startPollers` at `:67`, `usageStarters` at `:149`); `context.ts:511` calls `startPollers(...)` and closes `polled.processes` at `:595`.
- Test: `tests/server/root/context/context.test.ts` builds the context with 13 closes (`:34`, `length: 13`) and expects the processes watcher built once, given the patterns, and closed once. Fails with the watcher not closed (G9): `context.test.ts:224:51` `expected "vi.fn()" to be called 1 times, but got 0 times`; fails with the patterns not handed (G10): `context.test.ts:195:58` `expected [] to deeply equal [ 'node' ]`.

Ruling 5, the English sentences mapped to catalog keys.

- `src/lib/server/machine/processes/failure.ts` (40 lines): `ReadFailure(reason, detail)` with the reasons timeout, start, status, output, empty and cancelled; `failureLine(error, text)` (`:24`) maps each to a key of `config/text/views/system/machine/processes.yml` through `words(...)` from `server/core/words.ts`: `processes.failed_timeout` ("the process table did not answer within {0} seconds"), `failed_start`, `failed_status` ("ps ended with status {0}"), `failed_output`, `failed_empty`, `failed_cancelled`, and `failed_other` for an error that is no `ReadFailure`. `read.ts:70` throws `new ReadFailure('empty')`; `watch.ts:67` publishes `failureLine(error, text)`, so no `error.message` reaches the reader. The only other `new Error` in the folder is `folders.ts:35`, caught in `lsofFolders` (`:78-85`) and never published.
- Fails with the raw message published (G2): `watch.test.ts:206:27` `AssertionError: expected { status: 'failed', rows: [], ...(4) } to match object { status: 'failed', rows: [], ...(3) }` and eleven more in the file. Passes in run 3.

Ruling 6, the terminal label.

- `src/lib/state/system/machine/processes.ts:76-79` `arrange(rows, terminalById, label)` names a group `label(record)` (`:99`); `processes.svelte.ts` `TerminalEnding` carries `label`; `src/lib/state/client/context.ts:322-326` passes `label: terminalLabel`. The copy of the rule is gone.
- Tests in `tests/state/system/machine/processes.test.ts`: a titled terminal (the label is `My shell`; the group name and the Stop question equal it) and an untitled one (`shell one`), `:341` and `:354`.
- Fails with the label not handed (G3): `processes.test.ts:232:60` `expected [ 'My shell', 'ffffff-shell' ] to deeply equal [ 'tab label', 'ffffff-shell' ]`; with the client wiring taken out (G4): `processes.test.ts:314:41` `expected 'shell one' to be 'My shell'`. Passes in run 3.

Ruling 7, the newer rule sentences, each applied to this step's changes.

- Waits: `grep -n 'setTimeout(resolve' tests/server/machine/processes/folders.test.ts` prints nothing; the abort test waits on two named pipes (`ready`, `held`) and the timeout test on the call's own settle.
- Titles: `grep -nE "(it|describe)\(.*\bstill\b"` over the processes tests, `channels.test.ts`, the state and view tests, the context tests and `settings.test.ts` prints nothing.
- Shared fallbacks: `watch.ts:38` `nothing()` and `processes.ts:128` `defaultSort()` are built per call. Fail with the shared object back (G7): `watch.test.ts:229:27` `expected [] not to be []`; (G8): `processes.test.ts:261:32` `expected { key: 'cpu', direction: 'desc' } not to be { key: 'cpu', direction: 'desc' }`.
- Edits to existing assertions (the main checkout has moved on from this worktree's base, so these are the hunks that belong to this step):

| File | Before | After |
| --- | --- | --- |
| `tests/state/workbench/navigation/arrangement.test.ts:319` | `toHaveLength(51)` | `toHaveLength(52)` |
| `arrangement.test.ts:289` | `info: [['status', 'findings', 'audit', 'history', 'config', 'gallery']]` | the same list with `'processes'` last |
| `tests/state/workbench/navigation/catalogue.test.ts:243, :319` | System list ends at `'gallery'` | ends at `'gallery', 'processes'` |
| `catalogue.test.ts:331` | none | `expect(keyOf(order, 'processes')).toBe('y7')` |
| `tests/server/root/context/context.test.ts:34` (was `tests/server/root/context.test.ts:34`) | `Array.from({ length: 12 }, ...)` | `length: 13` |
| `tests/server/root/context/context-push.test.ts:284` (was `context.test.ts:733`) | "keeps the five groups, each logged once, when behavior.yml was saved unparseable" over an inert catalog | "keeps the six groups, each logged once, when the merge dropped an unparseable behavior.yml" over the shipped catalog and a whole-file finding |
| `tests/checks/config/config-folder.test.ts:382-384` | the catalog-file list read one level of `views/<group>/` by hand | `readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(...)`; the expected list names `views/system/machine/{hpc,processes,usage}.yml` |
| `config-folder.test.ts:121` | no `processes` key in the top-level list | `'processes'` added |
| `tests/checks/tree/allow-duplication.txt` | a row for `tests/views/system/status.test.ts` and `usage.test.ts`, and rows keyed by the old paths | the `usage.test.ts` row removed, the rest re-keyed to the `machine/` paths |

- Exports: `AGENTS` (`match.ts:8`), `COMMAND_LIMIT` (`table.ts:22`), `SORT_KEYS` (`processes.ts:119`), `paneArgs` (`pty/sessions.ts:341`) and `parsePanes` (`:350`) are `const` or `function` without `export`, and `Read` (`read.ts:27`) and `execute` (`folders.ts:23`) are local too. `listPanes` stays exported: `processes/live.ts` imports it. Every other export this step adds has an importer in `src` outside its own file: `liveDeps` (`pollers.ts`), `lsofFolders` and `readTable` (`live.ts`), `matches` and `agentOf` (`read.ts`), `Entry` (`read.ts`, `ps.ts`), `entryOf` (`ps.ts`), `ReadFailure` (`ps.ts`, `read.ts`), `failureLine` (`watch.ts`), `ReadDeps` (`live.ts`, `watch.ts`), `readProcesses` (`watch.ts`), `ProcessesOptions` and `ProcessesWatcher` (`context.ts`, `pollers.ts`), `watchProcesses` (`context.ts`), `startPollers` and `usageStarters` (`context.ts`), `createProcesses` and `ProcessesStore` (`client/context.ts`), `readRows`, `arrange`, `headLine`, `Arranged` and `ProcessGroup` (`processes.svelte.ts`), `ProcessesSort`, `parseProcessesState` and `pressed` (`Processes.svelte`, `ProcessTable.svelte`). Source of this list: the `grep -nE "from '\./"` and `grep -rnE "from '.*machine/processes"` runs over `src` and `tests`.

## Each behaviour taken out, per file

Method: a scratch copy of the worktree's `tools/oculus` (`node_modules` symlinked, `config/local.yml` not copied), one change at a time, only the test files named run with `npx vitest run`. Output in `scratchpad/d18/`.

| Run | Taken out | File | Failing line |
| --- | --- | --- | --- |
| F1 | arguments after a colon dropped from the command | `table.test.ts` | `:108:80` `AssertionError: expected [ Array(4) ] to deeply equal [ ...(4) ]` (1 failed) |
| F2 | today's offset in place of the offset on the start's date | `table.test.ts` | `:74:64` `expected [ '2026-03-07T16:00:00.000Z', ... ] to deeply equal [ '2026-03-07T17:00:00.000Z', ... ]` (4 failed) |
| F3 | kill at the time limit, abort and bound | `ps.test.ts`, `watch.test.ts` | `ps.test.ts:112:41` `expected [] to deeply equal [ 'SIGKILL' ]` (10 failed) |
| F4 | kill at `close()` | `watch.test.ts` | `:395:41` `expected [] to deeply equal [ 'SIGKILL' ]` (2 failed) |
| F5 | one read at a time | `watch.test.ts` | `:361:32` `expected [ ChildDouble{...}, ...(1) ] to have a length of 1 but got 2` (4 failed) |
| F6 | `LC_ALL=C` | `ps.test.ts` | `:53:29` `expected [ { file: 'ps', ... } ] to deeply equal [ { file: 'ps', ... } ]` (1 failed) |
| F7 | output bound | `ps.test.ts` | `:155:41` `expected [] to deeply equal [ 'SIGKILL' ]` (1 failed) |
| F8 | the `timeoutMs` option of `lsofFolders` | `folders.test.ts` | `:98:39` `expected { timeout: 5000 } to deeply equal { timeout: 300 }` (2 failed) |
| G1 | the refusal for a dropped `behavior.yml` | `settings.test.ts`, `context-push.test.ts` | `settings.test.ts:331:31`, `:355:68`, `context-push.test.ts:294:81` (3 failed) |
| G2 | catalog sentences (raw message published) | `watch.test.ts` | `:206:27` (12 failed) |
| G3 | the label function handed to `arrange` | `processes.test.ts` | `:232:60` (1 failed) |
| G4 | the label wiring of `client/context.ts` | `processes.test.ts` | `:314:41` (2 failed) |
| G5 | the time limit of the `lsof` child | `folders.test.ts` | `:132:5` `Test timed out in 5000ms` (1 failed) |
| G6 | the abort of the `lsof` child | `folders.test.ts` | `:137:5` `Test timed out in 5000ms` (1 failed) |
| G7 | per-call `nothing()` replaced by a shared object | `watch.test.ts` | `:229:27` (1 failed) |
| G8 | per-call `defaultSort()` replaced by a shared object | `processes.test.ts` | `:261:32` (1 failed) |
| G9 | the processes watcher not closed by the context | `context.test.ts` | `:224:51` (1 failed) |
| G10 | the patterns not handed to the watcher | `context.test.ts` | `:195:58` (1 failed) |
| G11 | `ps.ts` removed | whole build | `Error: Build failed with 1 error:` at `vite.config.ts` load |

## The cases on the unchanged tree

Method: the main checkout's `tools/oculus` (`config/local.yml` not copied, `node_modules` symlinked) with every new or changed test of this step in its final form laid over it, each file run alone (`scratchpad/d18/unchanged-summary.txt`, `unchanged.sh`). 29 files run, 27 fail, 2 pass (`tests/state/system/machine/usage-refresh.test.ts` 21 tests, `tests/server/root/context/context-reload.test.ts` 41 tests). 12 of the 27 fail at import (`Cannot find module '.../src/lib/server/machine/processes/{folders,match,ps,read,table,watch}.ts'` or `failure.ts`, `.../state/system/machine/processes.ts`, `.../views/system/machine/processes/Processes.svelte`, and the moved `hpc` and `usage` state and view tests); the other 15 fail 89 tests:

| Test file | Failing | First line |
| --- | --- | --- |
| `tests/server/machine/processes/panes.test.ts` | 12 | `TypeError: listPanes is not a function` (`:15:22`) |
| `tests/server/machine/pty/sessions.test.ts` | 1 | `TypeError: listPanes is not a function` (`:174:29`) |
| `tests/server/core/channels.test.ts` | 8 | `TypeError: hub.hasSubscriber is not a function` (`:176:20`) |
| `tests/data/sources/config/settings.test.ts` | 28 | `AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }` (`:271:33`) |
| `tests/server/root/context/context.test.ts` | 1 | `expected "vi.fn()" to be called 1 times, but got 0 times` |
| `tests/server/root/context/context-push.test.ts` | 5 | `expected "vi.fn()" to be called once with arguments: [ { patterns: [ 'claude', ...(1) ] } ]` (`:123:43`) |
| `tests/routes/page.test.ts` | 1 | `expected [ 'portfolio', 'config', ...(9) ] to deeply equal [ 'portfolio', 'config', ...(10) ]` |
| `tests/state/client/client-state.test.ts` | 2 | `expected [ 'processes' ] to deeply equal []` |
| `tests/checks/config/config-folder.test.ts` | 3 | `expected [ 'agents', 'arch_color', ...(98) ] to deeply equal [ 'agents', 'arch_color', ...(97) ]` |
| `tests/state/workbench/navigation/arrangement.test.ts` | 2 | `expected [ 'account-setup', 'agents', ...(49) ] to have a length of 52 but got 51` |
| `tests/state/workbench/navigation/catalogue.test.ts` | 2 | `expected [ 'status', 'findings', 'audit', ...(3) ] to deeply equal [ 'status', 'findings', 'audit', ...(4) ]` |
| `tests/state/workbench/navigation/registry.test.ts` | 2 | `expected [ 'account-setup', 'agents', ...(59) ] to deeply equal [ 'account-setup', 'agents', ...(60) ]` |
| `tests/views/system/workbench/catalogue.test.ts` | 1 | `expected [ 'y1', 'y2', 'y3', 'y4', 'y5', 'y6' ] to deeply equal [ 'y1', ... ]` |
| `tests/ui/theme/wall.test.ts` | 1 | `expected [ ...(42) ] to deeply equal [ ...(42) ]` |
| `tests/views/whole/type-scale.test.ts` | 20 | `expected [ ...(213) ] to deeply equal [ ...(210) ]` |

The tests that exercise this round's behaviours (the `ps` child, the table reader, the `lsof` child, the failure sentences, the label, the dropped-file refusal, the per-call fallbacks) are quoted from the mutation runs above, because the earlier adapter no longer exists to run them against.

## DONE / NOT DONE

| Row | Command | Last line of the final run |
| --- | --- | --- |
| 1 `ps` run, bounded, 10 s kill, `close()` kills, one child, `lstart` offset, arguments, package removed | `npx vitest run tests/server/machine/processes` and `grep -rn systeminformation src tests package.json package-lock.json \| wc -l` | `Tests  382 passed (382)` for the targeted run; the grep prints `0` |
| 2 paths outside the list | the section above | DONE, compiled from reading |
| 3 dropped `behavior.yml` keeps the list | `npx vitest run tests/data/sources/config/settings.test.ts tests/server/root/context` | inside the targeted run above |
| 4 `context.ts` at most 860 | `wc -l src/lib/server/root/context.ts` | `846 src/lib/server/root/context.ts` |
| 5 catalog sentences | `npx vitest run tests/server/machine/processes/watch.test.ts` | inside the targeted run above |
| 6 terminal label | `npx vitest run tests/state/system/machine/processes.test.ts` | inside the targeted run above |
| 7 spec sentences | the greps and the tables above | DONE |
| `npm test` | run 3 | `Tests  11966 passed \| 627 skipped (12593)` |
| `npm run test:checks` | run 3 | `Tests  445 passed \| 9 skipped (454)` |
| `npm run check` | run 3 | `COMPLETED 3029 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build`, `format:check`, `lint` | run 3 | `All matched files use Prettier code style!`; lint prints nothing after `> eslint .` |
| ASCII | `! LC_ALL=C grep -rna '[^ -~]' src tests` | exit 0, no output |
| Folder limit | `sh utils/folder-check.sh` | exit 0, no output |
| Whole list | `checks.sh` | `checks: 7 commands passed` |

## Line counts after

`src/lib/server/root/context.ts` 846, `src/lib/server/root/pollers.ts` 179, `src/lib/server/root/live-settings.ts` 249, `src/lib/server/machine/processes/{failure 40, folders 87, live 17, match 34, ps 120, read 136, table 78, watch 108}.ts`, `src/lib/state/system/machine/processes.ts` 145, `processes.svelte.ts` 67, `src/lib/data/sources/config/settings.ts` 243, `tests/fixtures/doubles.ts` 53, `tests/server/machine/processes/{folders 153, match 78, panes 72, ps 204, read 545, table 142, watch 555}.test.ts`, `tests/state/system/machine/processes.test.ts` 403, `tests/server/root/context/{context 475, context-push 436, context-reload 854}.test.ts`.

## Head comments and doc paragraphs the step touches

| Place | State |
| --- | --- |
| `server/machine/processes/table.ts:1-8`, `table.test.ts:1-8` | rewritten: the reader of one `ps` line, its columns, units and the local-date offset |
| `server/machine/processes/ps.ts:1-8`, `ps.test.ts:1-4`, `failure.ts:1-4` | rewritten (new files) |
| `server/machine/processes/watch.ts:1-10`, `folders.ts` head | rewritten: one read at a time, the child killed at `close()`, no folder for a failure, a timeout or an abort |
| `server/root/live-settings.ts:1-12` | still true: the processes group is kept for an unparseable `behavior.yml` |
| `server/machine/pty/sessions.ts` head | rewritten, wrapped to 100 columns, names `tmux list-panes` |
| `tests/fixtures/doubles.ts` head | rewritten: names `ChildDouble` |
| `tests/server/root/context/context-push.test.ts:1-2`, `:199` | rewritten: re-wrapped to 100 columns, same content |
| `DESIGN.md:134` (Processes view) | rewritten; read against `ps.ts`, `folders.ts`, `watch.ts`: the `ps -axww` run, argument list, no shell, `LC_ALL=C`, the 10 s kill, the `close()` kill, the `lsof` call with a 5 s timeout, the 10 s cadence and the `processes.failed_*` sentences all hold |
| `DESIGN.md:114` (channel list), `:152` (approval of started processes) | still true |
| `HELP.md:146` (the Processes row) | rewritten; the columns (PID, parent PID, user, start time, CPU, memory, command, folder), the 10 s reads and Stop on a terminal row only match the code |
| `README.md:13` (runtime dependencies) | rewritten: `systeminformation` is gone from the list |

## The asynchronous paths

| Path | In flight | After close | Superseded |
| --- | --- | --- | --- |
| `ps` table read (`ps.ts`, `watch.ts`) | `watch.test.ts:355` and `:370` start no second child while one runs, however many ticks pass; `:338` kills a child that never answers | `:386` kills the child at `close()` and publishes nothing after; `:438` leaves no timer and aborts the read; `:460` starts no read for a first subscriber after `close()` | `:532` drops the result of a read in flight and publishes a fresh read of the new list; `:493` shows no row of the old list under a failed read of the new one |
| `lsof` folder read (`folders.ts`) | `folders.test.ts:132` a child past its limit is killed and gives no folder | `folders.test.ts:137` an aborted signal kills the child (the held pipe closes) and `:88` passes the signal on | the watcher's `:532` case above covers the read that carries the folders |
| Stop (`processes.svelte.ts` `stopAsk`) | the store holds no promise, timer or request of its own (`grep -nE 'async\|await\|Promise\|setTimeout\|setInterval\|fetch\('` over the state and view files prints 0); the POST belongs to `endTerminals` in the terminals store, not to this step | the same: nothing of the step runs after the answer | `processes.test.ts:383` sends the one stop of a terminal that left the list while the question was open: exactly one `POST /api/terminal` with `{ action: 'stop', id }` |

## Judgment calls

- `user=` is in the `ps` column list; the ruling's command omits it and the view needs the User column.
- `ps.ts` keeps its own 32 MB constant, as `git.ts` and `tmux.ts` keep theirs, rather than importing the constant of `server/files/search.ts`; `server/machine` may not import `server/files`.
- `lsofFolders` takes the options `program` and `timeoutMs`, which exist for the tests that run a real child script (and the time limit test); the defaults are `lsof` and 5000 ms.
- The memory column is `rss * 1024` bytes: `ps` prints `rss` in kilobytes. `pcpu` is the percentage `ps` prints, per core, so it can pass 100. `lstart` is the machine's local wall-clock time in the C locale form `Thu Oct  2 11:53:00 2026`.
- The context tests are split into `tests/server/root/context/` to keep each file under the 900-line cap and the folder at 3 entries.

## What the brief got wrong

- The ruling's column list lacks `user` (above).
- The verify grep `grep -rnE "system/(hpc|usage)" src tests | grep -v 'system/machine/'` filters on the whole output line, path prefix included; on this tree the unfiltered grep also prints nothing, so nothing was hidden.

## User-visible before and after

- Process table: before, read through `systeminformation`, whose entry carried a split command; after, one `ps` run oculus starts itself, and a row's command is the whole command line with its arguments.
- A failed read: before, a library or system message could reach the reader; after, one of the seven `processes.failed_*` sentences of `config/text/views/system/machine/processes.yml`.
- A group's name and its Stop question: before, a copy of the terminals store's naming rule; after, the terminals store's own `terminalLabel`.
- `behavior.yml` saved unparseable: before, the processes list fell back to the catalog default while the other groups kept theirs; after, the list in force is kept, with its log line.
- Look on the TEST page (System page, chord y7): not taken, the orchestrator's.
