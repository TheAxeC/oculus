Reviewer report, step O114, worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O114, base 9b96a1b78. Nothing was changed.

VERIFICATION LINES, VERBATIM

`npm run test:quick -- --base 9b96a1b78` ran twice. The first run's output went through `tail -30`, so its lines above the last 30 are lost. It ended `test:quick: 346.8 s; failed: vitest, vitest slow`. The only failure visible in the kept tail is `tests/server/machine/apps/tools/languages.test.ts`, "Test timed out in 40000ms", a file the step does not change. The failure behind the `vitest` line of that run was cut off and is not known. The second run, with its whole output kept in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/quick-o114.log, printed:

```
test:quick: 87 changed file(s), from git since 9b96a1b78
test:quick: 332 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.9 s)
ok      svelte-check (9.9 s): 1793574207634 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (182.1 s): Duration  169.06s (transform 74.10s, setup 0ms, import 183.18s, tests 476.15s, environment 5ms)
ok      vitest (223.7 s): Duration  211.73s (transform 82.89s, setup 0ms, import 282.25s, tests 544.26s, environment 11.20s)
ok      vitest slow (342.8 s): Duration  331.08s (transform 22.91s, setup 0ms, import 171.59s, tests 1136.91s, environment 21ms)
test:quick: 345.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

Perl character gate over every changed and new path (75 status entries, svg left out, `.svg` checked by `LC_ALL=C grep -c '[^ -~]'`: 0 in each): printed nothing, `perl gate exit 0`.

Report's commands rerun:
- `npx vitest run tests/server/machine/pty/agent-pane.test.ts tests/state/sessions/terminal/reading-tab.test.ts`: `Test Files  2 passed (2)`, `Tests  65 passed (65)`. Matches.
- `ls src/lib/views/sessions/transcript`: `No such file or directory`. Matches.
- `grep -rn "turn_bar\|turn_toolbar" config src tests --exclude=local.yml | wc -l`: 0. Matches.
- `grep -n "view: transcript\|transcript" config/defaults/layout.yml`: no line. Matches.
- `grep -n "pane_current_command" src/lib/server/machine/processes/agents.ts`: no line. Matches.
- `grep -n "disableStdin" .../TerminalGrid.svelte`: `282:        grid.options.disableStdin = locked;`. Matches.
- `grep -n "composer.locked\|composer.ended" .../SteerBox.svelte`: lines 47, 48. Matches.
- `grep -n "SessionPicker" -r src/lib/views/sessions/terminal | wc -l`: 0. Matches.
- `sh utils/folder-check.sh`: exit 0. `wc -l`: Terminal.svelte 485, TerminalGrid.svelte 517, channel.ts 740, sessions.ts 814, terminals.svelte.ts 878, context.ts 873. Matches.
- `grep -n "transcript" docs/palette.md`: no line. Matches.
- `grep -rln "pty/capture.ts\|views/sessions/transcript\|terminal/workbench-shape" src tests docs config --exclude=local.yml`: one file, `tests/checks/config/config-folder.test.ts`. Matches.
- `sh utils/unused-exports.sh`: lines 155 and 297 name `openSessionIn` and `SessionAsk`; no other export of the step's new modules is listed. Matches.
- `npx vitest run tests/checks/imports/cycles.test.ts`: `Tests  1 failed | 6 passed (7)`, on `lib/views/system/workbench/editors/Cards.svelte -> .../NestedCards.svelte -> .../Cards.svelte`. Matches. `git diff 9b96a1b78 --stat -- src/lib/views/system/workbench/editors/` prints nothing, and `git show 9b96a1b78:` of both files holds both imports (`Cards.svelte:71`, `NestedCards.svelte:26`), so the cycle stands at the base and the diff does not touch those files.

ITEM VERDICTS

1 One view: holds. View file, registration, palette row, `SESSION_VIEWS` entry and `turn_bar`/`turn_toolbar` are gone; the body is `terminal/transcript/TranscriptBody.svelte`; `layout.yml` is one Terminal pane.
2 Tab state: holds. `savedTabShape` reads the three keys, `settled` spreads them, the older branches are gone.
3 Detection: violated. See Spec S1, S2, S3.
4 Session and terminal: holds. `session-link.ts`, `terminalChoices` uses `terminalSession`, `SteerBox` has `locked`, `foreign` refuses and `byHand` does not.
5 The switch: holds by reading.
6 The box: holds by reading.
7 The lock: holds by reading. `send` and `stop` in `SteerBox` check `usable`, so Enter with a draft in a locked box sends nothing.
8 Opening a session: holds by reading and tests. `openSession` has all five callers, `pageTarget` and `paneTab` leave out a reading tab, New goes through `liveTab`. See Standards ST1 for the shape.
9 Follow state: holds. `followTab` and `showing` are unchanged and the body is mounted only while `session.reading`.
10 Ended terminals: holds. `closeEnded` runs before `linkTerminals`, so `linkedSession` answers from the previous message.
11 Placement: holds.
12 Words: holds on what was read, with stale sentences under Standards ST2. `npm run diagrams` and `npm run docs:palette` not rerun (Declined).

CASE VERDICTS

1 met. 2 met. 3 met. 4 met. 5 met.
6 partial. The fixed text passes in `terminalsOf`, but a second agent in a pane created after the last list is not listed by the running `Terminals`. Finding S1.
7 met. 7a met. 7b met (slow test, in the green `vitest slow`). 8 met. 9 met.
10 met. 11 met.
12 met for the two tests; the by-hand half is by reading: `closeEnded` treats every id alike and calls no tmux, and `runningOf` and `endTerminals` filter by `isOwnTerminal`. No test covers those two filters.
13 met.
14 not verifiable by reading: Transcript replaces the row and unmounts the grids, Live remounts them. Text intact on return is for the look.
15 not verifiable by reading: the code path is complete for a `-shell` terminal, whose session is in the listing.
16 not verifiable by reading: `tabSession.live` is false with no terminal, `ended={!record.live}` gives `composer.ended`. Code agrees.
17 not verifiable by reading: `locked={session.locked}` reaches every grid and the body; the key persists in tab state. Code agrees.
18 partial. `targetOf`, the `%output` filter, `sized()` and the `isOwnTerminal` filter on close agree with the case. On a private socket, a control client with no size left `80x24` and no `window-size` line in `show-window-options`. But a session made by hand after the last list shows only at the next list (S1), and the attach rewrites the session's environment (S2).
19 not verifiable by reading: `layout.yml` holds no transcript tab, and `ui.unknown_view` is `'Unknown view: {0}'`, read by `strip-tab.ts:45` and `workbench-title.ts:21`. Code agrees.

SPEC

S1. `src/lib/server/machine/pty/channel.ts:267`, with `:299` and `src/lib/server/machine/pty/panes/driver.ts:21-31`.
```
if (agentsOf(this.#listing, before) !== agentsOf(this.#listing, after)) {
    this.refresh();
```
Wrong: a tick compares both tables over the last list's text, so a pane absent from that text can never change the comparison and starts no refresh. The list poll at `:299` runs only when no control client is live, and `%layout-change` is not in `CHANGE_EVENTS`. Item 3 says "`claude` typed in a shell shows within one tick", and the step's line says the same of a tmux session started by hand.
Failure 1: a page has an oculus terminal attached (control client live). In a listed session `work` the user runs `tmux split-window`, then `claude` in the new pane. No listed event fires, the listing has no row for the pane, and the terminal never appears until an unrelated tmux event.
Failure 2: no control client is open and the page is subscribed. The user runs `tmux new -s work` and `claude`. It appears at the idle poll, up to 60 s later, where `IDLE_POLL_MS` is 60000.
No test covers a pane missing from the listing; `publishes nothing for the same table and once for a new agent` uses a listed session.

S2. `src/lib/server/machine/pty/tmux.ts:344`, reached for a by-hand id from `panes/driver.ts:102-103`.
```
const argv = [...socketArgs(options), '-C', 'attach-session', '-t', session];
```
Wrong: `attach-session` without `-E` applies `update-environment` to the session, so opening a by-hand grid writes to a tmux session oculus did not start. Item 3 says "No path ends, renames, resizes or marks a session oculus did not start", and Z1100 says the terminal is "written to only by keys".
Run on a private `-S` socket, tmux 3.7c, `SSH_AUTH_SOCK=/tmp/o114-marker DISPLAY=:o114 tmux -S ... -C attach-session -t '$0'`, then `show-environment -t work`:
before `-DISPLAY`, `SSH_AUTH_SOCK=/private/tmp/com.apple.launchd.cWLA85wdVR/Listeners`
after `DISPLAY=:o114`, `SSH_AUTH_SOCK=/tmp/o114-marker`
Failure: a user with a forwarded agent in `work` opens that pane in oculus; every new window of `work` then gets oculus's `SSH_AUTH_SOCK` and `DISPLAY`, and git over ssh in it uses the wrong agent. Not in the report, and G146's tests do not reach it.

S3. `src/lib/server/machine/pty/panes/listing.ts:115-121`.
```
const panes = text.split('\n').flatMap((line) => paneRow(line) ?? []);
const shown = panes
    .filter((row) => !isOculusSession(row.name))
    .flatMap((row) => {
        const terminal = byHandRow(row, table, children);
```
Wrong: `list-panes -a` prints a shared pane once per session holding its window, and nothing folds rows by pane. Item 3 says each pane is one terminal.
Run on a private socket, `new-session -d -s work`, `new-session -d -t work -s view2`, `list-panes -a -F '#{pane_id} #{session_id} #{session_name}'`:
`%0 $1 view2`
`%0 $0 work`
Failure: claude in a pane of a grouped session or a linked window gives two terminals with the one id `h<pid>p0-claude`. The rows go into `{#each}` blocks keyed on the id, which is a duplicate-key error in Svelte's dev runtime and a broken list otherwise. No test covers it.

S4. `.scratch/migration/agents/reviews/O114-report.md:13-19`.
```
Tests, written first and run before any code changed: both files failed at import, so no case ran.
```
Wrong: the brief asks for the first run of every case on the unchanged tree "with each case's result noted". An import failure gives no case a result, and line 19's "By reading, cases 1 to 13 have no rule the brief gets wrong" notes none. Failure: a case that already passed at the base stays unknown, such as a by-hand id refused `not-ours` at the routes, which the base's `isTerminalId` already refused for that shape.

S5. `.scratch/migration/agents/reviews/O114-report.md:243`.
```
`npx vitest run tests/state tests/views tests/checks tests/ui` ran twice while working
```
Wrong: `agents/spec.md:26` allows only "the test files that cover what you are changing" while working and bans `npm run test:checks`; `tests/checks` whole is that suite, under another command. Run twice.

PROOF

P1. `.scratch/migration/agents/reviews/O114-report.md:15-17`. The failing line is one import per file for 65 rows.
```
`Test Files  2 failed (2)`, `Tests  no tests`
```
Wrong: `agents/spec.md:69` asks the report to quote each added test's failing line on the unchanged tree. Failure: the rows `a shell whose child went`, `a process that is its own parent` and the `readTab` default rows may pass at the base through existing code, and an import failure cannot show which rows fail without the change.

P2. `src/lib/state/sessions/terminals.svelte.ts:792` and `endTerminals` at `:818`: the filters that keep a close from stopping a by-hand terminal have no test. `tests/state/client/terminal/terminal-close.test.ts` changed by one `agent: null` line.
```
return [...new Set(ids)].filter((id) => isOwnTerminal(id) && running(id));
```
Wrong: G146 covers "never ended", and its test header places this at the look. The server refuses the stop as well, so the session stays either way, and only the words "says nothing" depend on the filter. Failure if the filter went: a close of a by-hand tab would raise the busy question or a refusal on the bar and the unit suite would stay green. Case 18 at the look is then the only proof.

STANDARDS

ST1. `src/lib/state/sessions/terminal/session/open-session.ts:13,44`.
```
export type SessionAsk = {
export function openSessionIn(
```
Wrong: `agents/spec.md:89` says an export with "no importer outside its own file and its tests is removed or made local". Report line 180-181 says "kept" because the test imports them. Failure: two exports stay open with no production reader; `createSessionOpening` is the module's surface.

ST2. Sentences the diff makes false:
- `src/lib/state/sessions/folds.ts:270-271`: "A terminal oculus did not start is left out, since the tab cannot attach to it." `terminalChoices` now holds by-hand terminals and the tab attaches to them.
- `src/lib/views/shared/sessions/SteerBox.svelte:4-5`: "A session that runs in a terminal oculus did not start cannot be typed into from here". A by-hand terminal is exactly that and is typed into. `:20`, "The oculus terminal the session runs in", is false for the same reason.
- `src/lib/views/sessions/session-list/SessionList.svelte:22`: "every terminal oculus started": `TerminalRows` lists by-hand terminals with `entry.byHand`.
- `src/lib/views/sessions/terminal/Terminal.svelte:30`: "The body draws start/TerminalStart.svelte alone while the tab shows no terminal": a reading tab shows no terminal and draws `TranscriptBody`.
Failure: a reader of `SteerBox` removes `byHand` from `usable` to match its comment, or relies on `terminalChoices` leaving a pane out. The report's "still true" list at line 195 does not name these.

ST3. `.scratch/migration/agents/reviews/O114-report.md:189`: the id paragraph has no matching statement for asynchronous paths. `agents/spec.md:73` asks what the code does for every asynchronous path in flight, after close and superseded. Not stated for `AgentWatch.#tick`, the `#listed` wait in `#attach`, and `checkPane` followed by `steerTerminal`. By reading the first two are handled (`#closed()`, `#pages.has(sink)`); the third is the window under B1.

BEHAVIOUR

B1. `src/lib/server/machine/pty/panes/steer.ts:30-31`, and the report's line 221.
```
const shell = basename(options.shell ?? fallbackShell());
if (command.replace(/^-/, '') === shell) throw new TerminalRefused('no-agent');
```
Wrong: the brief's rule is carried out, but the report says the check "covers that gap", and that holds only for the login shell. Failure: `$SHELL` is zsh, a hand-made pane runs `bash`, claude quits there, and within the tick before the list drops the terminal the user presses Send. `pane_current_command` is `bash`, the check passes, and the box's text runs in bash followed by Enter. The goal "a steer never types into a shell" does not hold for a shell other than the login shell, and neither the report nor HELP's "types nothing and says no agent is running" says so.

B2. `src/lib/server/machine/pty/channel.ts:299` with `panes/driver.ts:21-31` and `TerminalGrid.svelte:279-284`.
```
if (terminal?.byHand !== undefined) grid.resize(terminal.byHand.cols, terminal.byHand.rows);
```
Wrong: `#took`'s signature carries `byHand`, but nothing refreshes the list when a pane changes size: a by-hand attach means a live control client, so the poll skips, `%layout-change` is no `CHANGE_EVENTS` member, and a tick compares only `[id, agent]`. The report's "Drawn at the pane's size" states no limit. Failure: the user grows the terminal window, the pane goes from 80x24 to 200x50, tmux's output is laid out for 200 columns and the grid stays 80, so the agent's screen is drawn wrapped and misplaced until an unrelated tmux event.

DECLINED TO JUDGE

- `grep -rlw <name> <base>/src <base>/tests | wc -l` (report line 187) and `diff -q` against a base copy: no base copy was named to me, and `git diff` and `git show` are the only git reads I may run. The cycle files were checked that way.
- `npm run diagrams` and `npm run docs:palette` (report row 12): both write to the worktree and I change nothing. Not run.
- `ps -eo pid,command | grep -E "worktrees/migration-O114|test:quick"` (report line 245): my own runs of test:quick share that pattern, so it cannot reproduce a builder's end state.
- Whether list run 2 was within `agents/spec.md:26`: run 1's reds were in files the step does not change, and report line 68 names no change between runs 1 and 2. If run 2 followed only those reds it was one run too many; the report does not say.
- The failure behind the first run's `vitest` line: its text was cut by `tail`. The second run prints `ok` for that command.
- Page cases 14 to 19 as seen on screen: reading only.

Usage: a10980e905992663c, claude-opus-5-5, 333851 tokens, 57 tool uses, 1051.8 s