NOT DONE: `checks.sh` does not print `checks: 7 commands passed`. On the third and last full-list run `npm test` passed (458 files, 11926 tests) and `npm run test:checks` failed on one test, `tests/checks/config/integrity.test.ts > reads every side project of the hub ...` (`AssertionError: expected 0 to be greater than or equal to 3`), because this worktree has no `side-projects/` folder (`ls .../worktrees/D18/side-projects` says no such file; the main checkout holds `gpu-game-boy`, `residual`, `scripted-os`). No file of this step touches that folder or that test. `checks.sh` stops at the first failing command, so `npm run check`, `build`, `format:check`, `lint` and the ASCII grep were not part of that list; I ran each alone on the final tree and all exit 0 (below). The brief's rule is that one full-list run follows the last change; with the side-projects folder missing that list cannot print the passed line from this worktree. Everything else in the brief is built.

## Open items of the state file (verbatim, `orchestrator-state.md:124-135`)

- **Z241 (2026-10-02 06:50, Q88c): Delete Branch on a branch git calls not fully merged.** VS Code runs `git branch -d`, and when git refuses because the branch is not fully merged it asks "The branch '{0}' is not fully merged. Delete anyway?" and runs `git branch -D`. Oculus's `DESIGN.md:128` says "no form carries `--force`", the `git-write.ts` comment on push says "Nothing is ever forced", and `tests/server/git/git-write.test.ts:571-575` asserts no file of `server/git` contains `--force`. `-D` is `--delete --force`, so VS Code's retry meets that rule. Q88c is built with `-d` only: an unmerged branch is refused with git's reason and kept.
  - (a) Keep `-d` only. Pro: the no-force rule stands as written; nothing that holds commits no other branch holds is deleted from a button. Con: VS Code's "Delete anyway?" path is absent; an unmerged branch is deleted at a terminal.
  - (b) Add VS Code's retry: after git's "not fully merged" refusal, VS Code's question, then `git branch -D <name>`, listed in `CONFIRMED`; `DESIGN.md:128` amended to "no form carries `--force` except `branch -D` after its question", and the gate's test keeps refusing the `--force` spelling. Pro: VS Code parity; the commits stay reachable through the reflog for git's expiry period. Con: a rule written for every write gets one exception.
  - Recommendation: (b), since the parity ruling asks for every capability VS Code has, the question stands between the reader and the loss, and the exception is one named form under its own confirmation. It would be added to Q88c in a repair round or at landing, with no new step.

Z241 is not about this step.

## The cases on the unchanged tree

Method: a copy of the main checkout's `tools/oculus` (its `src` equals this worktree's `src` before the step, checked with `diff -rq`; `config/local.yml` not copied), with every new or changed test of this step in its final form laid over it, run with `npx vitest run` on the changed files. Result: 74 failed, 1784 passed, in 26 failing files. Every case of new behaviour fails because the behaviour or its module does not exist.

| Test file | Failing | How it fails on the unchanged tree |
| --- | --- | --- |
| `tests/server/machine/processes/{table,match,folders,read,watch}.test.ts` | whole file | import: `Cannot find module '../../../../src/lib/server/machine/processes/<name>.ts'` (module does not exist) |
| `tests/server/machine/processes/panes.test.ts` | 13 | `TypeError: parsePanes is not a function`, `paneArgs is not a function` |
| `tests/server/machine/pty/sessions.test.ts` | 1 | `TypeError: listPanes is not a function` at `sessions.test.ts:174` |
| `tests/server/core/channels.test.ts` | 7 | `TypeError: hub.hasSubscriber is not a function` (`:176`), `hub.onFirstSubscriber is not a function` |
| `tests/data/sources/config/settings.test.ts` | 22 | `processesSettings is not a function`; `expected { Object (threw) } to strictly equal { value: { patterns: [ ...(2) ] } }` |
| `tests/server/root/context.test.ts` | 5 | `context.test.ts:155` `expected "vi.fn()" to be called 1 times, but got 0 times` (the processes watcher); `:584` `expected "vi.fn()" to be called once with arguments: [ { patterns: [ 'claude', ...(1) ] } ]  Number of calls: 0` (the `processes` live group) |
| `tests/state/system/machine/processes.test.ts` | whole file | import: `Cannot find module '.../src/lib/state/system/machine/processes.ts'` |
| `tests/views/system/machine/processes.test.ts` | whole file | import: `Cannot find module '.../views/system/machine/processes/Processes.svelte'` |
| `tests/checks/config/config-folder.test.ts` | 3 | top-level keys, one catalog per owner, each file on its own (the `processes` key, glyph, icon and text file are absent) |
| `tests/routes/page.test.ts` | 1 | `carries every channel the page reads` |
| `tests/state/client/client-state.test.ts` | 2 | `holds one instance of every store it names`, `gives two clients separate stores` |
| `tests/state/workbench/navigation/{arrangement,catalogue,registry}.test.ts` | 2, 2, 2 | the System page has no `processes` after `gallery`, no y7 |
| `tests/views/system/workbench/catalogue.test.ts` | 1 | `draws a key beside every entry of every group, System y1 to y7 ...` |
| `tests/ui/theme/wall.test.ts` | 1 | the Processes view rows are absent from the wall audit |
| `tests/views/whole/type-scale.test.ts` | 11 | the Processes view files are absent (`ENOENT ... machine/processes/Processes.svelte`) |

The moved tests (`tests/state/system/machine/{hpc,usage,usage-refresh}.test.ts`, `tests/views/system/machine/{hpc,usage}.test.ts`) cannot import their sources at the old place, so on the unchanged tree they fail at import (`Cannot find module '.../views/system/machine/hpc/Hpc.svelte'`); `usage-refresh.test.ts` imports only the config and the client fixture, so it passes in both places. In the final tree, `npx vitest run tests/state/system/machine tests/views/system/machine tests/server/machine/processes tests/server/root/context-reload.test.ts` prints `Test Files  14 passed (14)  Tests  361 passed (361)`. The cadence cases moved out of `context.test.ts` into `context-reload.test.ts` pass in their new place in the same run.

The first-run table above is the final form of each test on the unchanged tree. The help-manual test (`tests/views/system/help.test.ts`) also failed in that scratch copy because the copy leaves out `docs/`; that failure is the copy's and is not counted.

## DONE / NOT DONE

| Row | Command | Output |
| --- | --- | --- |
| `npm run diagrams` | `npm run diagrams` | exit 0, `docs/diagrams/*.dot,*.svg` rewritten (the committed diagrams test passes in the run below) |
| `npm test` | third `checks.sh` run | `Test Files  458 passed \| 23 skipped (481)`, `Tests  11926 passed \| 627 skipped (12553)` |
| `npm run test:checks` | third `checks.sh` run | `Test Files  1 failed \| 28 passed \| 2 skipped (31)`, `Tests  1 failed \| 444 passed \| 9 skipped (454)`; the one failure is the side-projects test, NOT DONE as above |
| `checks: 7 commands passed` | `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` | NOT DONE: prints `checks: failed with exit 1: npm run test:checks` |
| `npm run check` | alone, final tree | exit 0, `COMPLETED 3025 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | alone, final tree | exit 0 |
| `npm run format:check` | alone, final tree | exit 0, `All matched files use Prettier code style!` |
| `npm run lint` | alone, final tree | exit 0 |
| ASCII | `! LC_ALL=C grep -rna '[^ -~]' src tests` | exit 0, no output |
| Folder limit | `sh utils/folder-check.sh` | exit 0, no output |
| Old paths | `grep -rnE "system/(hpc\|usage)" src tests \| grep -v 'system/machine/'` | no output |
| Old relative paths | `grep -rnE "\.\./system/(hpc\|usage)\|\.\./\.\./system/hpc" src tests` | no output |
| New and changed tests fail on the unchanged tree | scratch copy, see the section above | 74 failed in 26 files, quoted above |
| Moved tests pass | `npx vitest run tests/state/system/machine tests/views/system/machine ...` | 14 files, 361 tests passed |
| `grep -n '^processes' config/behavior.yml` | | `82:processes:` then `83:  patterns: [python3, codex, claude, node, latexmk]` |

Not verified: the look of the view on TEST in a browser (the brief leaves the look to the orchestrator); a real `Stop` against a live tmux session of oculus (no test signals a process); a live `lsof` read of folders through the watcher (the `lsof` call is tested through an injected exec; `listPanes` is tested against a private tmux socket). One manual read of the live library was made and is reported under the library facts.

The earlier two full-list runs: run 1 failed in `npm test` on `tests/views/whole/tinted.test.ts` (fixed: the Processes pane does not ask for the tint, see the judgment calls); run 2 failed in `npm test` on one 5000 ms timeout of `tests/server/edit/config-key.test.ts > keeps every CRLF line end and the byte order mark` with the machine at load average 15 to 17 (the file passes alone, 54 of 54, twice, and in run 3).

## Files with line counts

New in `src/`:

| File | Lines |
| --- | --- |
| `src/lib/server/machine/processes/table.ts` | 71 |
| `src/lib/server/machine/processes/match.ts` | 34 |
| `src/lib/server/machine/processes/folders.ts` | 79 |
| `src/lib/server/machine/processes/read.ts` | 172 |
| `src/lib/server/machine/processes/watch.ts` | 97 |
| `src/lib/server/machine/processes/live.ts` | 21 |
| `src/lib/data/model/model-processes.ts` | 40 |
| `src/lib/state/system/machine/processes.ts` | 151 |
| `src/lib/state/system/machine/processes.svelte.ts` | 63 |
| `src/lib/views/system/machine/processes/Processes.svelte` | 104 |
| `src/lib/views/system/machine/processes/ProcessTable.svelte` | 190 |
| `config/text/views/system/machine/processes.yml` | 25 |

New tests: `tests/server/machine/processes/{folders 150, match 78, panes 76, read 555, table 136, watch 371}.test.ts`, `tests/state/system/machine/processes.test.ts` 346, `tests/views/system/machine/processes.test.ts` 244.

Changed (line counts after): `src/lib/server/root/context.ts` 896, `src/lib/server/root/live-settings.ts` 234, `src/lib/server/core/channels.ts` 200, `src/lib/server/machine/pty/sessions.ts` 595, `src/lib/data/sources/config/settings.ts` 222, `tests/server/root/context.test.ts` 878, `tests/server/root/context-reload.test.ts` 854, `tests/fixtures/client.ts` 100. Also changed: `config/behavior.yml`, `config/catalogs/{options,glyphs,icons}.yml`, `config/layout.yml`, `config/text/app.yml`, `DESIGN.md`, `HELP.md`, `README.md`, `package.json` (`"systeminformation": "5.33.15"`), `package-lock.json`, `src/lib/data/model/index.ts`, `src/lib/data/sources/config.ts`, `src/lib/state/client/{context.ts,entities.svelte.ts,payloads.ts}`, `src/lib/state/shared/stores/shapes.ts`, `src/lib/state/workbench/navigation/registry.ts`, `src/lib/state/workbench/rail-badges.svelte.ts`, `src/lib/views/boards/focus/CommandCenter.svelte`, `src/routes/+page.svelte`, `docs/diagrams/`, and the tests `tests/checks/config/config-folder.test.ts`, `tests/checks/tree/allow-audits.txt`, `allow-duplication.txt`, `tests/data/sources/config/settings.test.ts`, `tests/routes/page.test.ts`, `tests/server/core/channels.test.ts`, `tests/server/machine/pty/sessions.test.ts`, `tests/server/root/context-fixture.ts`, `tests/state/client/client-state.test.ts`, `tests/state/workbench/navigation/{arrangement,catalogue,registry}.test.ts`, `tests/ui/theme/wall.test.ts`, `tests/views/system/workbench/catalogue.test.ts`, `tests/views/whole/type-scale.test.ts`.

Moved with `mv`, only import lines, path strings and comments naming the path changed: `views/system/{hpc,usage}` to `views/system/machine/`; `state/system/{hpc.svelte.ts,hpc.ts,usage.ts,usage-refresh.svelte.ts}` to `state/system/machine/`; `config/text/views/system/{hpc,usage}.yml` to `.../machine/`; the five view and state tests to `tests/state/system/machine/` and `tests/views/system/machine/`.

Paths written outside the brief's list, reported here: `src/lib/server/machine/processes/{table,match,folders,live}.ts` (new files beside `read.ts` and `watch.ts`, so each parser or rule exists once and `read.ts` stays small); `tests/fixtures/client.ts` (a new `holdTerminals(client, terminals)` shared by the view test and the store test, so the two tests do not repeat the 8-line sessions payload the duplication check refuses); `tests/checks/tree/allow-duplication.txt` (one stale entry removed, the clone it named ended when the moved usage test's import depth changed).

## Judgment calls

- The default pattern list lives in `config/catalogs/options.yml` and `processesSettings` reads it when `processes:` is missing from `behavior.yml`; the spec forbids a default written in code. The shipped list in `behavior.yml` is `[python3, codex, claude, node, latexmk]`.
- A pattern is a program name: `^[^/\s]+$`. The refusal sentences are `config/behavior.yml: processes must be a map` and `processes.patterns must be a list of program names, each without a slash or a space`.
- The Processes pane does not ask for the tint (`<Pane title=...>`, no `tinted`). `tests/views/whole/tinted.test.ts` requires a view whose partial paints a surface of its own over the wallpaper not to ask for it, and the sticky column head in `ProcessTable.svelte` keeps the panel colour over the picture so the rows that scroll under it do not show through.
- `ProcessTable.svelte` draws its own bodies, one `<tbody data-terminal>` per terminal and a last one for the matched rows, because the Table primitive draws one sorted body and cannot group. It takes the ordering from the primitive's `order()`.
- `createProcesses(entities, terminals)` takes `terminals: { terminalById, endTerminals }`, a local structural type, because `state/system` may not import `state/sessions` (`tests/checks/imports/order.test.ts`). The Stop action calls `terminals.endTerminals([group.terminal])`.
- The cadence tests (the refresh cadence outside 1 to 35791) moved from `context.test.ts` to `context-reload.test.ts`: the processes cases lifted `context.test.ts` over the 900-line limit, and a new test file in `tests/server/root` would have made it 11 entries (the limit is 10).
- `context.ts` is at 896 lines; the live dependencies of the read are in `server/machine/processes/live.ts` so `context.ts` stays under 900. The library is imported dynamically in `live.ts`, so a server nobody opens a page on never loads it.
- The watcher starts its ten-second interval at the first subscriber of the `processes` channel (`hasSubscriber`, `onFirstSubscriber` on the hub) and stops it when none is left; `set()` replaces the pattern list, drops a read begun under the old list and clears the held rows; `close()` aborts the read and clears the timers.
- Errors a read publishes under the failed status: `the process table is empty`, `the process table did not answer within 10 seconds`. The `lsof` call has a 5 s timeout; an exit code 1 with output still yields folders.
- The view's default sort is CPU descending (`DEFAULT_SORT`), held per pane in the instance state and gone when the tab closes.

## User-visible before and after

- System page: before, six views and chords y1 to y6; after, a seventh view, Processes, after Gallery, chord y7 (`config/layout.yml`, `config/text/app.yml`, `HELP.md`).
- Processes view (new): a head line ("2 projects in flight, 3 agents running", singular forms for one), one group per oculus terminal (the terminal's title, else its name, over its pane process with a Stop button, then the terminal's other processes), then the matched local processes by CPU; columns PID, Parent, User, Started, CPU, Memory, Command, Folder; a long command is cut in its cell and whole in its title; "Read at hh:mm:ss"; three states while there is nothing to draw (reading, failed with the sentence over the kept rows, "No process matches the patterns.").
- Stop asks "End the terminal '{0}' ({1}, pid {2})? Every process under it ends with it, including any started there by hand." and, on yes, ends the terminal (tmux `kill-session` through the same `endTerminals` a terminal tab's close uses). It never signals a single pid.
- `config/behavior.yml` gains `processes: patterns: [...]`; a live change of the list reaches the watcher through `live-settings.ts` without a restart.
- HPC and Usage views, their state, their text and their tests sit one folder deeper (`machine/`); no user-visible change.
- `package.json` gains `systeminformation` 5.33.15 (MIT).

## Before and after for the look (TEST page, not taken)

Open the Processes view on the System page of a workbench page named TEST (chord y7) with at least one oculus terminal running. Expected: the head line above a table; a bold name row per oculus terminal, then its pane process in bold with Stop at the right end of that row only, then the terminal's other processes; the matched processes in a last group, highest CPU first; sticky column heads that stay opaque over the wallpaper. Before: no seventh view on the System page and no y7. Clicking a column head sorts within each group; Stop opens the question. I did not open a browser.

What a Terminal tab draws after the stop (read from `src/lib/state/sessions/terminals.svelte.ts:275-291` and `:791-796`, not exercised): `endTerminals` posts the stop and forgets the terminal's own start record; when the next `sessions` payload no longer lists the terminal, `closeEnded` takes it out of every tab that owned it on any page; a tab left owning none closes, unless the reader is composing in it, in which case it stays and shows the composer alone with what was typed; a selection on the ended terminal is cleared.

## Anything wrong in the brief

- The verify grep `grep -rnE "system/(hpc|usage)" src tests | grep -v 'system/machine/'` filters on the whole output line, path prefix included, so a stale reference inside a file that lives under `system/machine/` would be hidden. On this tree the unfiltered `grep -rnE "system/(hpc|usage)" src tests | wc -l` prints `0`, so nothing was hidden; a stricter form strips the `file:line:` prefix before the `grep -v`.
- Decision 6/7 numbering in "Decisions taken in this brief" is out of order (the list reads 5, 7, 6); no effect.
- The brief's rule for the verify list ("`checks: 7 commands passed`") assumes a worktree that holds `side-projects/`; this one does not, and `checks.sh` stops at the first failing command, so its later commands were not part of the list and were run alone.

## Library facts (`systeminformation` 5.33.15 `processes()`)

Fields of one entry, from one manual read of the live library on this machine (the only live read; no test reads the process table): `pid, parentPid, name, cpu, cpuu, cpus, mem, priority, memVsz, memRss, nice, started, state, tty, user, command, params, path`. Units and formats the adapter (`table.ts`) relies on:

- `cpu`: percent as `ps` reports it, per core, so it can pass 100 (a live node entry gave `134.3`); kept as a number at least 0, else 0.
- `memRss`: kilobytes (a live entry gave `537568`); the row's `memory` is `memRss * 1024`, bytes.
- `started`: the machine's local wall-clock time, `YYYY-MM-DD HH:MM:SS` (live: `"2026-10-02 10:09:17"`); the row carries it as a UTC ISO string made through the local `Date`, and an unparseable or non-existent local time (such as one skipped by a clock change) gives an empty string.
- `command`, `params`, `path`: the library splits the command line; the row's `command` is `path/command params` joined again (live: `path ""`, `command "node"`, `params "/Users/.../."`), cut at 1,000 characters with `...` as the last three.
- `parentPid` less than 1 or not a whole number gives `ppid` 0; an entry whose `pid` is not a positive whole number is left out.

## Full-list runs

Three full-list runs of `checks.sh` (limit three): run 1 and run 2 failed in `npm test` as described above; run 3 passed `npm test` and failed `npm run test:checks` on the side-projects test only.
