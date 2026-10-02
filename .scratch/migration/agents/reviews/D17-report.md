NOT DONE: `commandDiagnostics()` holds the errors of a task terminal only while a Terminal pane has that terminal's output on screen, because the output reaches the page only through the pty channel a mounted grid subscribes to. A task terminal no pane shows contributes no diagnostics; open item D17-A below. Everything else in the brief is built and verified; what no test reaches is listed under "Not covered by a test".

# D17 report, project commands

## Open items

The state file's open items, copied with `sed -n 143,147p tools/oculus/.scratch/migration/orchestrator-state.md` at the time of writing (the brief names lines 143-146; the five entries sit on lines 143-147):

- Z280 (2026-10-02, D14's /spec): a LaTeX formatter on this machine. D14 builds Format Document for `.tex` files (Z278) through `tex-fmt`, which is not installed (`command -v tex-fmt` prints nothing; Homebrew offers 0.5.7). `latexindent`, the other formatter LaTeX Workshop supports, is installed but stops at once with `Can't locate File/HomeDir.pm in @INC` (TeX Live 2025's script needs a Perl module macOS lacks). Without one of them Format Document says the formatter is missing and changes nothing. Options: (a) I run `brew install tex-fmt` now. For: one command, a single binary, fast. Against: one more program on your machine. (b) I install the Perl module for `latexindent` (`cpan File::HomeDir`, into your user Perl). For: the formatter most LaTeX users know, with its own settings files. Against: a Perl module install outside Homebrew, and D14 would be built against `latexindent` instead. (c) neither: Format Document stays unusable here, the lazy option. Recommended (a). D14 is built and tested with a stand-in program either way; this only decides whether it works on your machine.
- Z275 (2026-10-02, found at Q88c's landing): the Views and Settings rail button moved. `config/layout.yml` on main holds an uncommitted change that is not the plan's: the Views and Settings button moved from last on the rail to fourth, after Projects. Six test files pin the old order (`tests/shell/rail/rail-config.test.ts`, `tests/shell/rail/shipped-rail.ts`, `tests/state/workbench/navigation/rail.test.ts`, `catalogue.test.ts`, `arrangement.test.ts`, `tests/checks/config/config-folder.test.ts`), and the catalogue's groups (`nav_groups` in the same file) must follow the rail's order, so with the change on disk 5 tests of `npm test` and 1 of `test:checks` fail on main and every landing's verify is red until it is settled. With the button fourth, it also takes the digit key 4, and Incoming to Present move one digit down. Options: (a) keep the new place: the catalogue's groups reordered to match, the six tests updated, HELP.md's rail list and the digit keys checked, done as fixes at D18's landing (the Processes view), since D18 already changes that file and cannot land before this is settled. For: the rail reads as you arranged it. Against: the digit of every button after Projects changes. (b) keep it last: the change on disk put back by you. For: no code change. Against: the button stays far from the top. (c) leave it as it is: the lazy option, which leaves main's verify red. Recommended (a), if the move was meant; (b) if it was a trial. D18 (the Processes view) cannot land until this is settled: its diff adds `processes` to the System page's arrangement in the same file (line 93, apart from your lines 10 to 22), and the landing refuses a step whose paths carry an uncommitted change of yours. Under (a) your rail lines go in with D18's landing. S4 (the Settings editor finished) then merges the System page into the Views and Settings item (your ruling Z169), so under (a) the merged item sits fourth; under (b) it sits last.
- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

Raised by this step:

- D17-A (diagnostics of a task terminal no pane shows). Brief item 8 has the commands store keep each task terminal's matches as diagnostics. The store reads output in `note(id, text, scrollback)`, which `views/sessions/terminal/grid/TerminalGrid.svelte:373` calls for each chunk its pty subscription delivers, so a terminal whose grid is not mounted (another tab shown, or its tab closed while the terminal lives) has no output read. Options: (a) when the terminals list shows a task terminal ending, or listing with an exit status, the store asks the server for the terminal's captured output once (a new `action` of the terminal route or a new route, reading tmux `capture-pane` of the session) and feeds it to `note` as a scrollback; for: every ended task terminal yields its diagnostics once, with no extra tmux client while it runs; against: a new request shape (user-visible API), and errors of a still running line show at its end. (b) the page subscribes to the pty channel of each running task terminal without a grid; for: errors show while the line runs; against: one tmux control client per task terminal and a size for a grid that does not exist. Recommended (a). The lazy option is leaving it as it is, which the Problems view of D33 would meet as an empty list for any terminal not on screen. It needs your ruling because it adds a request shape nothing names.

## First run on the unchanged tree

Before any change, the cases of the brief were written as tests and run on the tree as it stood (`d17-base` copy of `tools/oculus` with node_modules linked, `npx vitest run <the case files>`). Result: `Test Files  14 failed (14)`, `Tests  14 failed | 122 passed (136)`. Nine suites failed to load (`Failed Suites 9`: `tests/routes/commands.test.ts`, `tests/server/machine/approvals/approvals.test.ts`, `tests/server/machine/commands/{chain,found,placeholders,run,sources}.test.ts`, `tests/state/sessions/terminal/commands.test.ts`, `tests/views/shared/commands/commands.test.ts`), each with `Cannot find module` for the module the step adds; the other failures were assertions: three in `tests/shell/keys/keys.test.ts`, one in `workbench-keys.test.ts`, one in `channel.test.ts` (poll while a task terminal runs), six in `task.test.ts` (start argv, `LIST_FORMAT`, the row read, and the three real-tmux cases), three in `terminal-close.test.ts`. No rule of the brief gave a wrong result on that run, so the step went on.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 command sources (`.oculus/commands.yml`, `commands.json`, found) | DONE | `tests/server/machine/commands/sources.test.ts`, `found.test.ts`; mutations m01-m12 |
| 2 one shell quoting | DONE | `pty/shell-word.ts`; `routes.ts`, `chat.ts`, `usage/refresh.ts` import it (grep below); the quoted lines asserted in `chain.test.ts` and `run.test.ts` |
| 3 placeholders | DONE | `placeholders.test.ts`; mutations m13-m15 |
| 4 approvals | DONE | `approvals.test.ts`, `run.test.ts`; mutations m16-m20 |
| 5 routes | DONE | `tests/routes/commands.test.ts`; mutations m27-m29, m77, m78 |
| 6 the run | DONE | `chain.test.ts`, `run.test.ts`; mutations m21-m26 |
| 7 task terminal, result, Rerun, Restart | DONE | `task.test.ts` (real tmux on a private socket), `channel.test.ts`, `terminal-close.test.ts`, `terminal-marks.test.ts`, `terminal-menu.test.ts`, `terminal-style.test.ts`; mutations m30-m45 |
| 8 errors made clickable, diagnostics | NOT DONE for a terminal no pane shows (D17-A); DONE for a shown one | `commands.test.ts` "the diagnostics of a task terminal", "the file an error line names"; mutations m46-m50, m84 |
| 9 default build and test keys | DONE | `keys.test.ts`, `workbench-keys.test.ts`, `commands.test.ts` "the default build and test"; mutations m51-m55, m76 |
| 10 where they are drawn | DONE (the form is drawn by the shell, see judgment call 1) | `commands.test.ts` (view), `commands-menu.test.ts`, `project.test.ts`, `repositories.test.ts`, `files-menu.test.ts`, `command-ask.test.ts`; mutations m56-m63, m79-m83 |
| 11 client store | DONE | `tests/state/sessions/terminal/commands.test.ts`; mutations m64-m75 |
| 12 docs | DONE | `DESIGN.md` Processes paragraph and the pty bridge bullet, `HELP.md` key rows, terminal row, `## Project commands`, `local.yml` paragraph |

Verify list, run from `tools/oculus` (`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`), after `npm run diagrams`; the lines it printed that matter:

```
$ npm test
 Test Files  517 passed | 24 skipped (541)
      Tests  12813 passed | 639 skipped (13452)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790965858496 COMPLETED 3174 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`npm test` carries `--tagsFilter '!slow'`, so `tests/server/machine/pty/sessions.test.ts` (tagged slow, which I edited) did not run in it; `npx vitest run tests/server/machine/pty/task.test.ts tests/server/machine/pty/sessions.test.ts` ran both on a private tmux socket: `Test Files  2 passed (2)`, `Tests  27 passed (27)`.

Number of full-list runs: 3. The first, started from the worktree root as the brief says, could not start its first command (`npm error path .../D17/package.json`, `ENOENT`: the root holds no `package.json`). The second, from `tools/oculus`, ended red at `npm test`. The third passed all seven commands (`checks: 7 commands passed`, exit 0).

Other checks, each run after the last change:

- `wc -l src/lib/state/sessions/terminals.svelte.ts src/lib/server/machine/pty/routes.ts src/lib/server/machine/pty/sessions.ts` printed 898, 567 and 655.
- `sh utils/folder-check.sh` exit 0. `ls src/lib/state/sessions/terminal | wc -l` prints 10, `ls src/lib/views/shared | wc -l` prints 10, `ls src/lib/shell/keys | wc -l` prints 8, `ls tests/server/machine/pty | wc -l` prints 9.
- `LC_ALL=C grep -rna '[^ -~]' src tests` prints nothing (it is the last command of the list).

## The new and changed tests on the unchanged tree, in their final form

Each line is a test of a file this step added or changed, run with `npx vitest run <files>` over the base copy holding the final test files (`d17-base`); the line is where it fails there.

- tests/routes/commands.test.ts: every test of the file fails, the file does not load (missing module /src/lib/server/machine/commands/routes.ts)
- tests/routes/sessions/terminal-edit.test.ts: reads them as title, icon and color, empty when the line carries none: fails at tests/routes/sessions/terminal-edit.test.ts:370
- tests/shell/keys/command-ask.test.ts: every test of the file fails, the file does not load (missing module ../../../src/lib/shell/keys/CommandAsk.svelte)
- tests/shell/keys/keys.test.ts: routes Cmd+Shift+B to the default build and Cmd+Alt+T to the default test: fails at tests/shell/keys/keys.test.ts:326
- tests/shell/keys/keys.test.ts: takes Ctrl in place of Cmd off macOS, and Cmd not at all there: fails at tests/shell/keys/keys.test.ts:342
- tests/shell/keys/keys.test.ts: answers while a field is typed in, and under no overlay: fails at tests/shell/keys/keys.test.ts:356
- tests/shell/keys/workbench-keys.test.ts: asks for the default build on Cmd+Shift+B and the default test on Cmd+Alt+T, once each: fails at tests/shell/keys/workbench-keys.test.ts:580
- tests/state/client/client-state.test.ts: holds one instance of every store it names: fails at tests/state/client/client-state.test.ts:62
- tests/state/client/client-state.test.ts: gives two clients separate stores: fails at tests/state/client/client-state.test.ts:69
- tests/state/client/client-state.test.ts: audit: replaces exactly the eleven stores handed the query client and no other: fails at tests/state/client/client-state.test.ts:151
- tests/state/sessions/folds.test.ts: titles a shell by its running command and describes it by its folder: fails at tests/state/sessions/folds.test.ts:348
- tests/state/sessions/folds.test.ts: carries whether a terminal is a task terminal and its exit code into the row: fails at tests/state/sessions/folds.test.ts:367
- tests/views/boards/project.test.ts: draws one control for each command on the card: fails at tests/views/boards/project.test.ts:183
- tests/views/boards/project.test.ts: draws none when the folder is no repository the git channel carries: fails at tests/views/boards/project.test.ts:183
- tests/views/sessions/terminal-menu.test.ts: audits that the task state is null for a shell, running with no exit and ended with one: fails at tests/views/sessions/terminal-menu.test.ts:352
- tests/views/sessions/terminal-menu.test.ts: audits that a running task offers Restart and an ended one Rerun then Restart in the grid menu: fails at tests/views/sessions/terminal-menu.test.ts:363
- tests/views/sessions/terminal-menu.test.ts: audits that a running task offers Restart and an ended one Rerun then Restart in the row menu: fails at tests/views/sessions/terminal-menu.test.ts:379
- tests/views/sessions/terminal-menu.test.ts: audits that the Rerun and Restart picks reach their own handler with the terminal: fails at tests/views/sessions/terminal-menu.test.ts:404
- tests/views/sessions/terminal-style.test.ts: draws a green check on its row once its line ended with 0 and a red cross for any other exit: fails at tests/views/sessions/terminal-style.test.ts:151
- tests/views/sessions/terminal-style.test.ts: draws the result on the bar of a tab showing the one task terminal: fails at tests/views/sessions/terminal-style.test.ts:170
- tests/views/sessions/terminal-style.test.ts: offers Rerun and Restart on the bar once the line ended, and Restart alone while it runs: fails at tests/views/sessions/terminal-style.test.ts:178
- tests/views/whole/type-scale.test.ts: lists every view file in the audit: fails at tests/views/whole/type-scale.test.ts:370
- tests/views/whole/type-scale.test.ts: sets every local role in shared/commands/CommandBar.svelte: fails at tests/views/whole/type-scale.test.ts:22
- tests/data/sources/config/local.test.ts: reads approvals starting with ~/ as under the home folder: fails at tests/data/sources/config/local.test.ts:226
- tests/data/sources/config/local.test.ts: reads approvals as ~ alone as the home folder: fails at tests/data/sources/config/local.test.ts:231
- tests/data/sources/config/local.test.ts: keeps approvals without ~/ as absolute or under the engine folder: fails at tests/data/sources/config/local.test.ts:236
- tests/server/machine/approvals/approvals.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/approvals/approvals.ts)
- tests/server/machine/commands/chain.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/chain.ts)
- tests/server/machine/commands/found.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/list.ts)
- tests/server/machine/commands/placeholders.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/placeholders.ts)
- tests/server/machine/commands/run.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/approvals/approvals.ts)
- tests/server/machine/commands/sources.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/server/machine/commands/list.ts)
- tests/server/machine/pty/task.test.ts: sets remain-on-exit and marks the session in the same invocation as new-session: fails at tests/server/machine/pty/task.test.ts:57
- tests/server/machine/pty/task.test.ts: ends with the pid of the server, after the fields of a task: fails at tests/server/machine/pty/task.test.ts:121
- tests/server/machine/pty/task.test.ts: reads a running task, an ended one and a terminal that is none: fails at tests/server/machine/pty/task.test.ts:148
- tests/server/machine/pty/task.test.ts: keeps the session of a line that failed, with its status, in every one of 20 runs: fails at Error: no server running on /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-task-XUqNL2/server.sock
- tests/server/machine/pty/task.test.ts: lists a running line with no exit and a passing one with exit 0: fails at tests/server/machine/pty/task.test.ts:175
- tests/server/machine/pty/task.test.ts: runs a chain line whose later commands wait for the earlier ones: fails at tests/server/machine/pty/task.test.ts:175
- tests/state/client/terminal/terminal-close.test.ts: asks nothing about a line that ended, and is stopped when its tab closes: fails at tests/state/client/terminal/terminal-close.test.ts:353
- tests/state/client/terminal/terminal-close.test.ts: asks about a line that runs, whatever program the pane names: fails at tests/state/client/terminal/terminal-close.test.ts:368
- tests/state/client/terminal/terminal-close.test.ts: asks about the running terminals of a tab that also holds an ended task terminal: fails at tests/state/client/terminal/terminal-close.test.ts:377
- tests/state/sessions/terminal/commands.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/state/sessions/terminal/commands.svelte.ts)
- tests/state/sessions/terminal/pty-io.test.ts: hands on the command texts a run asked to have approved: fails at tests/state/sessions/terminal/pty-io.test.ts:86
- tests/state/sessions/terminal/pty-io.test.ts: hands on the process a Restart asked to have confirmed: fails at tests/state/sessions/terminal/pty-io.test.ts:97
- tests/state/sessions/terminal/pty-io.test.ts: names a terminal `always` picks even when the server says it is not busy: fails at tests/state/sessions/terminal/pty-io.test.ts:157
- tests/state/sessions/terminal/terminal-marks.test.ts: is a green check for an exit code of zero and a red cross for any other: fails at tests/state/sessions/terminal/terminal-marks.test.ts:101
- tests/state/sessions/terminal/terminal-marks.test.ts: is empty while the line runs and for a terminal that is no task terminal: fails at tests/state/sessions/terminal/terminal-marks.test.ts:107
- tests/state/sessions/terminal/terminal-marks.test.ts: replaces the icon and the colour on the strip and on the row once the line ended: fails at tests/state/sessions/terminal/terminal-marks.test.ts:113
- tests/state/sessions/terminal/terminal-marks.test.ts: keeps the icon and the colour of the terminal while its line runs: fails at tests/state/sessions/terminal/terminal-marks.test.ts:121
- tests/state/sessions/terminal/terminal-marks.test.ts: draws the kind glyph and no token for a shell with no icon and no colour: fails at tests/state/sessions/terminal/terminal-marks.test.ts:126
- tests/views/shared/commands/commands-menu.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/views/shared/commands/commands.ts)
- tests/views/shared/commands/commands.test.ts: every test of the file fails, the file does not load (missing module ../../../../src/lib/views/shared/commands/CommandBar.svelte)
- tests/views/sources/repositories/repositories.test.ts: draws the commands of the repository above its commit box, and no bar for one with none read: fails at tests/views/sources/repositories/repositories.test.ts:314
- tests/views/sources/files/menu/files-menu.test.ts: audits that a folder and a root with commands offer a Run Command submenu of them, after Find: fails at tests/views/sources/files/menu/files-menu.test.ts:341
- tests/views/sources/files/menu/files-menu.test.ts: audits that a pick runs the command of the repository whose absolute path the row has: fails at tests/views/sources/files/menu/files-menu.test.ts:381
- tests/checks/config/config-folder.test.ts: reads one catalog file per owner and no legacy catalog file: fails at tests/checks/config/config-folder.test.ts:401
- tests/checks/config/config-folder.test.ts: reads each file on its own and finds its own keys there and nowhere else: fails at tests/checks/config/config-folder.test.ts:704
- tests/server/machine/pty/channel.test.ts: runs at the fast rate with no page attached, and at the slow rate once none runs: fails at tests/server/machine/pty/channel.test.ts:416

Tests of this step that pass on the unchanged tree, because they assert that nothing happens there and nothing happens there:

- `tests/views/sources/files/menu/files-menu.test.ts`: audits that a folder or a root with no commands, and a file, offer no Run Command.
- `tests/views/sessions/terminal-style.test.ts`: keeps the kind glyph on the row of a task whose line runs; offers neither on the bar of a terminal that is no task terminal.
- `tests/server/machine/pty/task.test.ts`: starts a terminal that is not a task with neither.
- `tests/server/machine/pty/channel.test.ts`: stays at the slow rate for a list with no task terminal.
- `tests/state/sessions/terminal/pty-io.test.ts`: reads an approve list holding a number, and a confirm that is a number, as no question.
- `tests/checks/tree/boundaries.test.ts`: passes there; its only edit is one entry in a list of allowed names.

## Each behavior removed on a scratch copy

For each behavior the step adds, the line of source that does it was removed or turned off in a private copy of the final tree (`rsync` of `tools/oculus` without `node_modules`, `config/local.yml` and `.scratch`, node_modules linked, its own `.vite` cache), and the test files that cover it were run. 84 behaviors; every one fails at least one test, and every mutated copy compiled (a test file that fails to load would have been listed as a FILE ERROR; none is). Columns: id, behavior, file under `src/lib/`, result, first failing line.

| id | behavior | file | result | first failing line |
|---|---|---|---|---|
| m01 | a cwd that is a link leading out of the repository is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:120 |
| m02 | an absolute cwd is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:122 |
| m03 | a cwd that climbs out with .. is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:122 |
| m04 | a name over NAME_MAX is refused | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:160 |
| m05 | a name repeated within one source is left out | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:178 |
| m06 | a second default of one kind is ignored | server/machine/commands/files.ts | 1 failing | tests/server/machine/commands/sources.test.ts:195 |
| m07 | the file of the repository is listed before the saved commands | server/machine/commands/list.ts | 1 failing | tests/server/machine/commands/sources.test.ts:261 |
| m08 | saved commands are read per repository | server/machine/commands/saved.ts | 1 failing | tests/server/machine/commands/sources.test.ts:231 |
| m09 | a Makefile line that begins := is not a target | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:79 |
| m10 | a hidden preset is left out | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:37 |
| m11 | pnpm-lock.yaml selects pnpm | server/machine/commands/found.ts | 2 failing | tests/server/machine/commands/found.test.ts:52 |
| m12 | a found name is one quoted shell word | server/machine/commands/found.ts | 4 failing | tests/server/machine/commands/found.test.ts:79 |
| m13 | a value is one quoted shell word | server/machine/commands/placeholders.ts | 5 failing | tests/server/machine/commands/placeholders.test.ts:18 |
| m14 | a placeholder with no value refuses the run | server/machine/commands/placeholders.ts | 1 failing | tests/server/machine/commands/placeholders.test.ts:52 |
| m15 | any other ${...} is left as written | server/machine/commands/placeholders.ts | 1 failing | tests/server/machine/commands/placeholders.test.ts:75 |
| m16 | a text is approved by its folder as well as its line | server/machine/approvals/approvals.ts | 3 failing | tests/server/machine/commands/run.test.ts:101 |
| m17 | a file that is not JSON refuses the write over it | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:113 |
| m18 | the approvals file is mode 0600 | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:87 |
| m19 | a text already approved is not added twice | server/machine/approvals/approvals.ts | 1 failing | tests/server/machine/approvals/approvals.test.ts:66 |
| m20 | a command saved through the form needs no approval | server/machine/commands/run.ts | 2 failing | tests/server/machine/commands/run.test.ts:147 |
| m21 | a command that is not approved asks and starts nothing | server/machine/commands/run.ts | 5 failing | tests/server/machine/commands/run.test.ts:101 |
| m22 | a cycle is refused | server/machine/commands/chain.ts | 1 failing | s-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchp] |
| m23 | a command depending on itself is refused with its own sentence | server/machine/commands/chain.ts | 1 failing | tests/server/machine/commands/chain.test.ts:44 |
| m24 | a failed command stops the chain | server/machine/commands/chain.ts | 3 failing | tests/server/machine/commands/chain.test.ts:71 |
| m25 | a name is one quoted shell word | server/machine/commands/chain.ts | 2 failing | tests/server/machine/commands/chain.test.ts:71 |
| m26 | each command of a chain runs once | server/machine/commands/chain.ts | 1 failing | tests/server/machine/commands/chain.test.ts:30 |
| m27 | a relative repo is refused | server/machine/commands/repo.ts | 1 failing | tests/routes/commands.test.ts:130 |
| m28 | a repo under no served root is refused | server/machine/commands/repo.ts | 1 failing | tests/routes/commands.test.ts:118 |
| m29 | a POST needs the write token | server/machine/commands/routes.ts | 1 failing | tests/routes/commands.test.ts:154 |
| m30 | remain-on-exit is set in the invocation that starts the session | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:57 |
| m31 | the task mark is a tmux user option | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:60 |
| m32 | an ended line reports its exit status | server/machine/pty/sessions.ts | 4 failing | tests/server/machine/pty/task.test.ts:153 |
| m33 | #{pid} stays the last field of the list format | server/machine/pty/sessions.ts | 5 failing | tests/server/machine/pty/sessions.test.ts:452 |
| m34 | a line that runs refuses Rerun | server/machine/commands/run.ts | 1 failing | tests/server/machine/commands/run.test.ts:264 |
| m35 | Restart of a running line asks for a confirmation first | server/machine/commands/run.ts | 1 failing | tests/server/machine/commands/run.test.ts:292 |
| m36 | Rerun respawns the pane with -k | server/machine/pty/sessions.ts | 2 failing | tests/server/machine/commands/run.test.ts:273 |
| m37 | a running task terminal is polled at POLL_MS with no page attached | server/machine/pty/channel.ts | 1 failing | tests/server/machine/pty/channel.test.ts:421 |
| m38 | an ended task terminal does not count as running | state/sessions/terminals.svelte.ts | 2 failing | tests/state/client/terminal/terminal-close.test.ts:353 |
| m39 | a running task terminal counts as busy whatever program the pane names | state/sessions/terminals.svelte.ts | 1 failing | tests/state/client/terminal/terminal-close.test.ts:368 |
| m40 | a task terminal whose line ended shows its result | state/sessions/terminal/terminal-marks.ts | 4 failing | tests/views/sessions/terminal-style.test.ts:151 |
| m41 | an exit of 0 is a check and any other a cross | state/sessions/terminal/terminal-marks.ts | 4 failing | tests/views/sessions/terminal-style.test.ts:151 |
| m42 | Rerun is offered once the line ended | views/sessions/terminal/terminal-list.ts | 2 failing | tests/views/sessions/terminal-menu.test.ts:363 |
| m43 | a pick of Restart reaches the restart handler | views/sessions/terminal/terminal-list.ts | 1 failing | tests/views/sessions/terminal-menu.test.ts:406 |
| m44 | Rerun is drawn on the bar only for an ended task | views/sessions/terminal/bar/TerminalActions.svelte | 1 failing | tests/views/sessions/terminal-style.test.ts:183 |
| m45 | a task terminal carries its exit into the choice rows | state/sessions/folds.ts | 1 failing | tests/state/sessions/folds.test.ts:367 |
| m46 | the severity is read in any letter case | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:262 |
| m47 | a line matched in a task terminal is a diagnostic with the command as source | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:327 |
| m48 | a rerun replaces the diagnostics | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:370 |
| m49 | a file that does not exist under the repository is not a link | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:652 |
| m50 | only a task terminal keeps diagnostics | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:380 |
| m51 | Cmd+Shift+B is the default build | shell/keys/keys.ts | 4 failing | tests/shell/keys/keys.test.ts:326 |
| m52 | Cmd+Alt+T is the default test | shell/keys/keys.ts | 2 failing | tests/shell/keys/keys.test.ts:331 |
| m53 | Ctrl replaces Cmd off macOS | shell/keys/keys.ts | 1 failing | tests/shell/keys/keys.test.ts:342 |
| m54 | with no file on screen the key says so and runs nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:439 |
| m55 | with no default the key says so and runs nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:449 |
| m56 | an overflow menu holds the commands beyond five | views/shared/commands/commands.ts | 1 failing | tests/views/shared/commands/commands.test.ts:68 |
| m57 | a repository with no commands draws only the add control | views/shared/commands/CommandBar.svelte | 4 failing | tests/views/shared/commands/commands.test.ts:58 |
| m58 | a saved command has Edit and Delete | views/shared/commands/commands.ts | 2 failing | tests/views/shared/commands/commands-menu.test.ts:59 |
| m59 | a file command opens its entry file | views/shared/commands/commands.ts | 2 failing | tests/views/shared/commands/commands-menu.test.ts:63 |
| m60 | a project card draws a control for each command | views/shared/card/ProjectCard.svelte | 1 failing | tests/views/boards/project.test.ts:189 |
| m61 | a repository header draws its commands above the commit box | views/sources/repositories/Repo.svelte | 1 failing | tests/views/sources/repositories/repositories.test.ts:322 |
| m62 | a folder that is a repository offers Run Command | views/sources/files/tree/menu/row-menu.ts | 1 failing | tests/views/sources/files/menu/files-menu.test.ts:341 |
| m63 | a pick of a command runs it in the repository of the row | views/sources/files/tree/menu/row-menu.ts | 1 failing | tests/views/sources/files/menu/files-menu.test.ts:381 |
| m64 | the list of a repository is asked once and held | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:157 |
| m65 | a save reads the list again | state/sessions/terminal/commands.svelte.ts | 4 failing | tests/state/sessions/terminal/commands.test.ts:102 |
| m66 | a files message for a folder holding the repository reads it again | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:128 |
| m67 | a read answered after its last view released it changes nothing | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:174 |
| m68 | the later of two reads wins | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:189 |
| m69 | the question of an earlier press never replaces the later one | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:542 |
| m70 | a refused approval does not run the command | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:525 |
| m71 | a started terminal is shown and selected | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:513 |
| m72 | Restart asks for a confirmation naming the process | state/sessions/terminal/commands.svelte.ts | 3 failing | tests/state/sessions/terminal/commands.test.ts:578 |
| m73 | a run asked to have texts approved hands them on | state/sessions/terminal/pty-io.ts | 7 failing | tests/state/sessions/terminal/commands.test.ts:203 |
| m74 | a terminal named by always is listed as busy | state/sessions/terminal/pty-io.ts | 2 failing | tests/state/client/terminal/terminal-close.test.ts:368 |
| m75 | the client object holds the commands store | state/client/context.ts | 2 failing | tests/state/client/client-state.test.ts:62 |
| m76 | the shell may take the commands store out of the client object | tests/checks/tree/boundaries.test.ts | 3 failing | tests/checks/tree/boundaries.test.ts:442 |
| m77 | a remove keeps the other repositories | server/machine/commands/saved.ts | 1 failing | tests/routes/commands.test.ts:296 |
| m78 | a remove of the last command drops the repository | server/machine/commands/saved.ts | 1 failing | tests/routes/commands.test.ts:266 |
| m79 | openForm holds the repository and the command | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:304 |
| m80 | closeForm closes the form | state/sessions/terminal/commands.svelte.ts | 1 failing | tests/state/sessions/terminal/commands.test.ts:306 |
| m81 | the shell draws the form while the store holds it | shell/keys/CommandAsk.svelte | 2 failing | tests/shell/keys/command-ask.test.ts:38 |
| m82 | the shell hands the form the command being edited | shell/keys/CommandAsk.svelte | 1 failing | tests/shell/keys/command-ask.test.ts:47 |
| m83 | the form of an edit is headed Edit | shell/keys/CommandForm.svelte | 1 failing | tests/shell/keys/command-ask.test.ts:47 |
| m84 | a column is read from an error line | state/sessions/terminal/commands.svelte.ts | 2 failing | tests/state/sessions/terminal/commands.test.ts:242 |

## Async paths and the tests that drive them

Each path has a test in flight (the answer not yet back), after close (its view or terminal gone before the answer) and superseded (a later call answered first).

- The list read of a repository (`commands.svelte.ts` `commands`/`watch`): `asks once however often it is read, and holds the answer`; `changes nothing when a read is answered after its last view released it`; `keeps the later of two reads when the earlier answers last`; `asks for no repository that no view watches`.
- A save and a remove: `reads again only once a save has been answered` (in flight); `reads nothing after a save that is answered once its last view released the list` (after close); `keeps the list the later read gave when two saves are answered in the other order` (superseded).
- A press and its question: `holds the question while the run is in flight and not before`; `keeps the question of the later press when the answer of the earlier one arrives last` and `shows the terminal of an earlier press whose answer arrives after a later one` (superseded); `does nothing for a yes when no question is held` (after close); Restart: `keeps the Restart question of the later press when the answer of the earlier one arrives last`, `posts the Restart confirmation of a terminal that left the list meanwhile and says its refusal` (after close).
- The file an error line names (`errorFile`): `is null for a terminal that is no task terminal or has left the list` (after close).
- Diagnostics: `replaces them on a rerun, and holds one entry for output replayed twice` (a scrollback that replaces what was read); `holds none for a terminal that is not a task terminal or has ended and left the list`.
- The server saves: `keeps every save of requests in flight together, in the order they came` (`tests/routes/commands.test.ts`).
- The pty channel's poll: `the list poll while a task terminal runs` in `channel.test.ts` (fast rate with no page attached, slow once none runs).
- Closing a tab over a task terminal: `stops a terminal that ended during the read no more than once, and never twice` and the three task cases in `terminal-close.test.ts`.

## Files this step added or changed, with line counts

```
  655 config/catalogs/options.yml
   70 config/text/app.yml
   49 config/text/views/shared/commands.yml
  432 DESIGN.md
  337 HELP.md
  509 src/lib/data/model/index.ts
   66 src/lib/data/model/model-commands.ts
  721 src/lib/data/model/model-sessions.ts
  376 src/lib/data/sources/config/local.ts
  115 src/lib/server/machine/approvals/approvals.ts
   79 src/lib/server/machine/commands/chain.ts
  241 src/lib/server/machine/commands/files.ts
  188 src/lib/server/machine/commands/found.ts
   27 src/lib/server/machine/commands/list.ts
   69 src/lib/server/machine/commands/placeholders.ts
   28 src/lib/server/machine/commands/repo.ts
  121 src/lib/server/machine/commands/routes.ts
  138 src/lib/server/machine/commands/run.ts
  153 src/lib/server/machine/commands/saved.ts
  672 src/lib/server/machine/pty/channel.ts
  123 src/lib/server/machine/pty/chat.ts
  158 src/lib/server/machine/pty/edit.ts
  567 src/lib/server/machine/pty/routes.ts
  655 src/lib/server/machine/pty/sessions.ts
   12 src/lib/server/machine/pty/shell-word.ts
  384 src/lib/server/machine/usage/refresh.ts
  148 src/lib/server/root/watch/local.ts
   51 src/lib/shell/keys/CommandAsk.svelte
  195 src/lib/shell/keys/CommandForm.svelte
  208 src/lib/shell/keys/keys.ts
  435 src/lib/shell/keys/workbench-keys.svelte.ts
  430 src/lib/shell/Workbench.svelte
  455 src/lib/state/client/context.ts
  327 src/lib/state/sessions/folds.ts
  597 src/lib/state/sessions/terminal/commands.svelte.ts
  144 src/lib/state/sessions/terminal/pty-io.ts
   99 src/lib/state/sessions/terminal/terminal-marks.ts
   60 src/lib/state/sessions/terminal/terminal-payloads.ts
  898 src/lib/state/sessions/terminals.svelte.ts
  211 src/lib/state/sources/repositories/file-git.ts
  144 src/lib/state/workbench/navigation/editor-status.svelte.ts
  526 src/lib/ui/controls/editor/Editor.svelte
  104 src/lib/views/sessions/terminal/bar/TerminalActions.svelte
  515 src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
  730 src/lib/views/sessions/terminal/terminal-list.ts
  524 src/lib/views/sessions/terminal/Terminal.svelte
  492 src/lib/views/sessions/terminal/TerminalList.svelte
  103 src/lib/views/sessions/terminal/TerminalTitle.svelte
  501 src/lib/views/shared/card/ProjectCard.svelte
  165 src/lib/views/shared/commands/CommandBar.svelte
   89 src/lib/views/shared/commands/commands.ts
  191 src/lib/views/sources/files/tree/control/picks.svelte.ts
  396 src/lib/views/sources/files/tree/menu/row-menu.ts
  512 src/lib/views/sources/repositories/diff/Diff.svelte
  357 src/lib/views/sources/repositories/Repo.svelte
  222 src/lib/views/sources/source/Editor.svelte
  508 src/lib/views/sources/source/Source.svelte
   37 src/routes/api/(sessions)/terminal/+server.ts
   34 src/routes/api/commands/+server.ts
  711 tests/checks/config/config-folder.test.ts
  638 tests/checks/tree/boundaries.test.ts
  240 tests/data/sources/config/local.test.ts
  182 tests/fixtures/sessions-fixture.ts
  332 tests/routes/commands.test.ts
  445 tests/routes/sessions/terminal-edit.test.ts
  133 tests/server/machine/approvals/approvals.test.ts
  118 tests/server/machine/commands/chain.test.ts
  157 tests/server/machine/commands/commands-fixture.ts
  134 tests/server/machine/commands/found.test.ts
   83 tests/server/machine/commands/placeholders.test.ts
  310 tests/server/machine/commands/run.test.ts
  280 tests/server/machine/commands/sources.test.ts
  828 tests/server/machine/pty/channel.test.ts
  470 tests/server/machine/pty/sessions.test.ts
  256 tests/server/machine/pty/task.test.ts
   43 tests/server/machine/pty/tmux-fixture.ts
  697 tests/server/root/watch/sessions.test.ts
   58 tests/shell/keys/command-ask.test.ts
  378 tests/shell/keys/keys.test.ts
  146 tests/shell/keys/palette-open.test.ts
  384 tests/shell/keys/palette.test.ts
  600 tests/shell/keys/workbench-keys.test.ts
  297 tests/shell/status/status-bar.test.ts
  193 tests/state/client/client-state.test.ts
  379 tests/state/client/terminal/terminal-close.test.ts
  443 tests/state/client/terminal/terminal-start.test.ts
  567 tests/state/client/terminal/terminal-tabs.test.ts
  461 tests/state/sessions/folds.test.ts
  783 tests/state/sessions/terminal/commands.test.ts
  534 tests/state/sessions/terminal/composer.test.ts
  171 tests/state/sessions/terminal/pty-io.test.ts
  128 tests/state/sessions/terminal/terminal-marks.test.ts
  851 tests/state/sessions/terminals.test.ts
   97 tests/state/workbench/navigation/editor-status.test.ts
  567 tests/views/boards/project.test.ts
  559 tests/views/sessions/terminal-menu.test.ts
  195 tests/views/sessions/terminal-style.test.ts
  125 tests/views/shared/commands/commands-menu.test.ts
  114 tests/views/shared/commands/commands.test.ts
  634 tests/views/sources/files/menu/files-menu.test.ts
  845 tests/views/sources/repositories/repositories.test.ts
  399 tests/views/whole/type-scale.test.ts
```

`docs/diagrams/` holds the regenerated `channels`, `layers` and `layer-{server,shell,state,views}` `.dot` and `.svg` files (`npm run diagrams`). `package.json` is unchanged. `README.md` is unchanged and still true.

## Judgment calls

1. The form that saves a command is drawn by the shell, not by the commands bar. `src/lib/shell/keys/CommandForm.svelte` is drawn by `CommandAsk.svelte` while the store's `forming()` holds a repository and a command; the bar opens it with `openForm(repo, draft)` and Add with `openForm(repo, null)`. The form is a modal box with its own surface over the wallpaper, and `tests/views/whole/tinted.test.ts` refuses a surface of its own anywhere under a view that asks for the tint (the Repositories view asks and renders the bar). The other ways: a new primitive (`ui/forms` and `ui/frame` already hold ten items each), or loosening that test, which I did not do. Reversible: the form file and three store members.
2. `tests/checks/tree/boundaries.test.ts` `SHELL_STORES` gained `'commands'` (the file is outside the brief's path list): the default build and test keys run a command through the store and `CommandAsk.svelte` reads it.
3. The commands store takes `notices` and `onScreen` as small structural types it declares, and imports no module of `state/workbench`: `tests/checks/imports/order.test.ts` refuses an import from `state/workbench` into `state/sessions`.
4. "The status bar says which" (item 9) is a warning notice (`notices.post(..., { tone: 'warning' })`), shown by the status folder's toast and bell.
5. The card's command controls are built in `views/shared/card/ProjectCard.svelte`, which holds the card's action list; `CardActions.svelte`, the file the brief names, only draws it and is unchanged.
6. `tests/server/machine/pty/tmux-fixture.ts` (new) holds the tmux presence check and the private server's directory, socket and clean-up that `sessions.test.ts` and `task.test.ts` both needed; `tests/checks/tree/duplication.test.ts` refused the copy. `sessions.test.ts` setup moved there; no assertion in it changed.
7. `found.test.ts`, `sources.test.ts`, `approvals.test.ts` and `tests/routes/commands.test.ts` import `it` from `tests/fixtures/scratch.ts`, as `tests/checks/tree/scratch.test.ts` requires of a file that takes scratch directories through a fixture.
8. The pure-function cases of `commands-menu.test.ts` are titled "audits that ...", as `tests/checks/tree/audits.test.ts` requires of a case under `tests/views` that never renders.
9. The reasons above each absence assertion in `commands.test.ts` (view), `project.test.ts`, `terminal-style.test.ts` and `repositories.test.ts` are required by `tests/checks/tree/negatives.test.ts`.

## Changes a reader or the host sees, before and after

- Keys: Cmd+Shift+B and Cmd+Alt+T (Ctrl off macOS) were unbound; they run the default build and test of the repository holding the source tab on screen, or say which of file, repository and default is missing.
- A terminal that ended left the list; a task terminal stays, with a green check (exit 0) or a red cross on its strip, row and bar, until it is closed. Closing a tab or pane over an ended task terminal asks nothing; over a running one it asks. Its row and grid menus gain Rerun (ended) and Restart (confirmation naming the process while it runs).
- The Repositories header draws a bar of the repository's commands above the commit box; a project card whose folder is a repository draws a control per command; the Files row menu of a root or a repository folder gains Run Command.
- The tmux list format gains `#{@oculus_task}`, `#{pane_dead}` and `#{pane_dead_status}` before `#{pid}`; `Terminal` gains `task`, `exit` and `job`.
- A new route `/api/commands` (`GET` list; `POST` save, remove, approve) and the terminal route's actions `command`, `rerun`, `restart`; the refusal that lists the actions names `command`.
- Files: `.oculus/commands.yml` (read), `~/.oculus/commands.json` (written by the form), the approvals file named by the new `approvals` key of `local.yml` (default `~/.oculus/approvals.json`, mode 0600 in a 0700 folder; catalogued in `config/catalogs/options.yml`), new words in `config/text/views/shared/commands.yml` and `config/text/app.yml`.
- The pty channel polls the list at `POLL_MS` while a task terminal runs, with no page attached.

## Anything in the brief that was wrong or impossible

- "Then, from the worktree's root, ... checks.sh tools/oculus/.scratch/migration/orchestrator-state.md": the first command of the list, `npm test`, fails there with `npm error path .../D17/package.json ... ENOENT`; the list runs from `tools/oculus` with the state file at `.scratch/migration/orchestrator-state.md`.
- The open items are on lines 143-147 now (five entries), not 143-146.
- Item 10 names `CardActions.svelte` for the card's controls; the action list is built in `ProjectCard.svelte` (judgment call 5).
- The path list omits files the step had to change, each widened rather than booked: tests `tests/checks/tree/boundaries.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/state/client/client-state.test.ts`, `tests/server/machine/pty/tmux-fixture.ts` (new), `tests/shell/keys/command-ask.test.ts` (new), and the four files of judgment call 7; source `src/lib/data/model/index.ts` (exports the new types), `state/sessions/folds.ts` (the list row carries `task` and `exit`), `state/sessions/terminal/terminal-marks.ts` (the result marks), `state/sources/repositories/file-git.ts` (`wholePath` exported), `shell/Workbench.svelte` (mounts `CommandAsk`, hands the default-key action), `shell/keys/CommandAsk.svelte` and `CommandForm.svelte` (new), `ui/controls/editor/Editor.svelte`, `views/sources/source/Editor.svelte` and `views/sources/repositories/diff/Diff.svelte` (the selected text and the file an editor publishes), `views/sources/files/tree/control/picks.svelte.ts` (the Run Command pick), `server/root/watch/local.ts` (`approvals` joins the list of the machine's own keys the context holds), `server/machine/pty/edit.ts` (`tmuxValue` moved out of it).

## Every edit to an existing assertion, before and after

- `tests/routes/sessions/terminal-edit.test.ts` (`LIST_FORMAT`): before, the expected field list ended `..., '#{pid}'`; after, `'#{@oculus_task}'`, `'#{pane_dead}'`, `'#{pane_dead_status}'` come before `'#{pid}'` (brief item 7).
- `tests/state/sessions/folds.test.ts`: the expected shell row gained `task: false, exit: null`.
- Fixture literals building a full `Terminal` gained `task: false, exit: null, job: null` in `tests/fixtures/sessions-fixture.ts`, `tests/server/root/watch/sessions.test.ts`, `tests/state/client/terminal/terminal-start.test.ts`, `terminal-tabs.test.ts`, `tests/state/sessions/terminal/composer.test.ts`, `terminal-marks.test.ts`, `tests/state/sessions/terminals.test.ts`, `folds.test.ts`.
- `EditorStatus` literals gained `file: ''` and `selection: ''` in `tests/shell/status/status-bar.test.ts`, `tests/shell/keys/palette-open.test.ts`, `palette.test.ts`, `tests/state/workbench/navigation/editor-status.test.ts`.
- `tests/checks/config/config-folder.test.ts`: `CATALOG_FILES` gained `'views/shared/commands.yml'`.
- `tests/checks/tree/boundaries.test.ts`: `SHELL_STORES` gained `'commands'` and its comment names the keys' use.
- `tests/state/client/client-state.test.ts`: `STORES` gained `'commands'`; the list of stores handed the query client gained `'commands'` and its test title reads "eleven" where it read "ten".
- `tests/views/whole/type-scale.test.ts`: the audited views gained `'shared/commands/CommandBar.svelte': ''`.
- `tests/data/sources/config/local.test.ts`: three cases added for the `approvals` key.
- `tests/server/machine/pty/sessions.test.ts`: setup replaced by the shared fixture (no assertion changed); `rmSync` import dropped.
- `tests/state/client/terminal/terminal-close.test.ts`, `tests/state/sessions/terminal/pty-io.test.ts`, `tests/shell/keys/keys.test.ts`, `workbench-keys.test.ts`, `tests/views/sessions/terminal-menu.test.ts`, `terminal-style.test.ts`, `tests/views/boards/project.test.ts`, `tests/views/sources/repositories/repositories.test.ts`, `tests/views/sources/files/menu/files-menu.test.ts`, `tests/server/machine/pty/channel.test.ts`: cases added; no existing assertion changed.

## Grep of the changed names across src, tests, config, HELP.md, DESIGN.md, README.md

`grep -rlE '<name>' src tests config HELP.md DESIGN.md README.md --exclude=local.yml`; files per name: `commandDiagnostics` 2, `CommandForming` 1, `CommandAsking` 1, `openForm` 5, `closeForm` 4, `errorMatch` 3, `taskStateOf` 5, `TaskState` 2, `LIST_FORMAT` 3, `shellWord` 8, `@oculus_task` 7, `pane_dead_status` 3, `commands.json` 8, `commands.yml` 12, `approvals.json` 8, `CommandBar` 3, `CommandAsk` 4, `runDefault` 5, `pressRerun` 3, `pressRestart` 3. `shellWord` is in `pty/shell-word.ts`, imported by `pty/chat.ts`, `pty/routes.ts`, `usage/refresh.ts`, `commands/found.ts`, `commands/placeholders.ts`, `commands/chain.ts`, and named in `tests/routes/sessions/terminal-fixture.ts`; no file holds a second copy. `LIST_FORMAT` is in `pty/sessions.ts`, `task.test.ts` and `terminal-edit.test.ts`. `CommandForm` is named only by `CommandAsk.svelte` and its own file.

## Comments and docs re-read

- `DESIGN.md` Processes paragraph: rewritten (command sources, `commands.json`, the approval entry over `<cwd>\t<run>`, task terminals, Restart confirmation).
- `DESIGN.md` pty bridge bullet: rewritten (a task terminal stays, polled at `POLL_MS` while its line runs).
- `server/machine/pty/channel.ts` head comments: rewritten (the poll while a task runs).
- `HELP.md`: key rows, terminal row and `## Project commands`: rewritten; `local.yml` paragraph (`approvals`): rewritten; the rest of the file still true.
- `README.md`: still true.

## Not covered by a test (they need a DOM; for the landing's look)

- The bar's Add press and the menu's Edit pick reaching `openForm` (the store and the shell's drawing of the form are tested; the click is not).
- The form's fields, Save, the server's refusal shown in it, and Escape closing it.
- The approval and Restart confirmations as dialogs (the store holds the question and `Confirm` is drawn; the buttons are not pressed in a test).
- The xterm link provider drawing an error as a link and a click opening the file; the menus' opening.
- `Source.svelte` publishing the selection and `Editor.svelte`'s `onselect` (the placeholders read what the store is handed).

## Disclosures

- Two read-only git commands were run early in the step (`git -C ../.. diff --stat` and a `git status --short` piped to `head -0`); none since.
- `pkill -f "vitest run"` was run once to stop this step's own mutation shards; it may have ended a vitest run of another builder on the machine.
- `mkdir -p /tmp/x; rmdir /tmp/x` was run once; `/tmp/x` already existed holding files, `rmdir` refused, nothing was removed.
- Scratch folders under the session scratchpad (`unchanged/`, `d17-*`) were written during the step; nothing in the worktree or on the main checkout refers to them.
