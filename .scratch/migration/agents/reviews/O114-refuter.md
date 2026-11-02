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

Usage: a10980e905992663c, claude-opus-5-5, 333851 tokens, 45 tool uses, 1051.8 s

## Repair round 1, refuted

Reviewer report, step O114, repair round 1. Worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O114, base 9b96a1b78. Nothing in the worktree or the ledger changed: `git status --short` prints 82 lines, the same paths as at the start.

VERIFICATION LINES, VERBATIM

`npm run test:quick -- --base 9b96a1b78`, from the worktree root. I started it in the foreground; the harness moved it to the background after 180 s, and its log is whole:
```
test:quick: 90 changed file(s), from git since 9b96a1b78
test:quick: 332 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.4 s)
ok      svelte-check (8.8 s): 1793576508023 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (140.1 s): Duration  128.31s (transform 52.12s, setup 0ms, import 131.53s, tests 360.60s, environment 6ms)
ok      vitest (167.0 s): Duration  156.10s (transform 62.23s, setup 0ms, import 215.06s, tests 387.44s, environment 7.94s)
ok      vitest slow (264.4 s): Duration  253.73s (transform 17.75s, setup 0ms, import 130.55s, tests 873.18s, environment 18ms)
test:quick: 267.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```
Perl character gate of `agents/spec.md` over the 80 changed and new files, `.scratch` and `.svg` left out: printed nothing, exit 0. `.svg` by `LC_ALL=C grep -c '[^ -~]'`: 0 in each.

Commands the report quotes, rerun in the same form from the worktree root:
- `npx vitest run tests/server/machine/pty/agent-pane.test.ts tests/state/client/terminal/terminal-close.test.ts tests/state/sessions/terminal/reading-tab.test.ts`: `Test Files  3 passed (3)`, `Tests  85 passed (85)`. Matches.
- `npx vitest run --tagsFilter slow --testTimeout 20000 tests/server/machine/pty/agent-pane.test.ts`: `Tests  3 passed | 48 skipped (51)`. Matches.
- `sh utils/folder-check.sh`: exit 0. Matches.
- `sh utils/unused-exports.sh`: no line names `openSessionIn`, `SessionAsk` or any export of the step's new modules. Matches.
- `grep -rn "did not start\|oculus started" src docs config --exclude=local.yml`: read hit by hit; see ruling 7.
- `ls src/lib/views/sessions/transcript`: `No such file or directory`.
- `grep -rn "turn_bar\|turn_toolbar" config src tests --exclude=local.yml | wc -l`: 0.
- `grep -n "view: transcript\|transcript" config/defaults/layout.yml`: no line.
- `grep -n "pane_current_command" src/lib/server/machine/processes/agents.ts`: no line.
- `grep -n "disableStdin" .../TerminalGrid.svelte`: `282:        grid.options.disableStdin = locked;`.
- `grep -n "composer.locked\|composer.ended" .../SteerBox.svelte`: lines 48 and 49. The report says 47 and 48 in its first section, which SteerBox's round edit moved; that section predates the round and no decision rests on it.
- `grep -rn "SessionPicker" src/lib/views/sessions/terminal | wc -l`: 0.
- `grep -n "transcript" docs/palette.md`: no line.
- `grep -rln "pty/capture.ts\|views/sessions/transcript\|terminal/workbench-shape" src tests docs config --exclude=local.yml`: `tests/checks/config/config-folder.test.ts` alone. Matches.
- `wc -l`: Terminal.svelte 485, TerminalGrid.svelte 517, channel.ts 749, sessions.ts 814, terminals.svelte.ts 878, context.ts 873, ps.ts 172, table.ts 96, routes.ts 519, tmux.ts 527, folds.ts 324, SteerBox.svelte 195, SessionList.svelte 460, model-machine.ts 846, terminal-close.test.ts 194. Match the round's table.
- `npx vitest run tests/checks/imports/cycles.test.ts`: `Tests  1 failed | 6 passed (7)`. The report names this failure and the first refuter placed it at the base; the step does not change those files.
- Private socket, tmux 3.7c: `ps -ww -t <device> -o pgid=,tpgid=,command=` printed `33934 33934 zsh -c cat`, the same for the `ttysNNN` form; `/dev/ttys999` printed `ps: /dev/ttys999: No such file or directory`, exit 1. `attach-session -E` left `PROBE_MARK` out of `show-environment` (`after -E: []`); the plain attach printed `PROBE_MARK=one`. `list-panes -a` after `new-session -t work -s view2` printed `%0 view2 $1` and `%0 work $0`. All match.

Runs of mine, real tmux on private `-S` sockets under /tmp, each removed after. The programs are read-only over the step's code and live in the scratchpad:
- /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/steer-run.ts
- /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/tick-run.ts
- /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/fg-run.ts

VERDICTS FOR THE WHOLE DIFF, ITEMS

1 One view: holds.
2 Tab state: holds.
3 Detection: violated, finding B1 (the control client of a by-hand id keeps a tmux session the list no longer names). The rest of the item holds; the steer as ruling 4 replaced it holds.
4 Session and terminal: holds.
5 The switch: holds by reading.
6 The box: holds by reading.
7 The lock: holds by reading.
8 Opening a session: holds.
9 Follow state: holds.
10 Ended terminals: holds.
11 Placement: holds.
12 Words: holds on what was read. `npm run diagrams` and `npm run docs:palette` not rerun (Declined).

VERDICTS, CASES

1 to 5: met.
6: met, a new session and a new pane included (run below).
7: met.
7a: met. The ruling's wider form was also run: see ruling 4.
7b: met.
8: met. 9: met.
10: met. 11: met.
12: met. The by-hand half is by reading: `reading-tab.test.ts` has no by-hand row, and `closeEnded` treats every id alike and calls no tmux. The close of such a tab now has its test.
13: met.
14, 15, 16, 17, 19: not verifiable by reading; for the look. The code agrees.
18: not verifiable by reading. On a private socket a by-hand client left `show-window-options` empty, and the pane's output and environment hold as ruled.

VERDICTS, RULINGS OF THE ROUND

Ruling 1: holds. Run at poll 300 ms with real tmux:
- No client, nothing attached: `1500 ms: lists 5, told 0`, so one list per tick.
- Live client: `1500 ms idle: lists 5, told 0`.
- New session with an agent, no client: `told 1`.
- Split with an agent, live client: `told 1, ids 2`.
- Resize, live client: `told 1, sizes ["100x15","100x14"]`.
Cost with no tmux server, while any page is subscribed: one `ps -axww` and one failed tmux exec per tick, so 12 of each per minute at 5000 ms, against none of the first and one list a minute at the base. Measured here: tmux 13 ms, `ps` 39 ms over 466 processes. Run: `no server: 3000 ms at poll 300: lists 11, failed 13, tables 10, logged 0, socket made: false`. The list call starts no server and logs nothing. With an attached page and no live client the list poll runs beside the tick, so two lists a period, for the short time a client is down.

Ruling 2: holds. The test reads sound, and the run above shows `-E` keeps the environment. An oculus terminal's argv is unchanged.

Ruling 3: holds for what it asks, one row per pane. Report judgment 5 leaves finding B1.

Ruling 4: holds. Real panes, `steerAgent` on an id `a1b2c3-shell`, stand-in `claude`:
```
zsh at prompt | no-agent | marker in pane: false
bash under zsh | no-agent | marker in pane: false
claude foreground | typed | marker in pane: true
sh -c "claude; true" | typed | marker in pane: true
pipeline claude | cat | typed | marker in pane: true
pipeline sleep 30 | claude | typed | marker in pane: true
claude in background | no-agent | marker in pane: false
cat, another foreground program | no-agent | marker in pane: false
suspended claude | steer no-agent | interrupt sent | ps: 29418 29418 Ss+  zsh -f ; 29441 29418 T    claude
```
- The `ps` runs with an argument list and no shell (`startChild` in `ps.ts:55`, `ttyArgs` at `:22`).
- A pane whose `ps` fails refuses with nothing typed (test row, and the `/dev/ttys999` run for the exit).
- A pane gone and a later server each refuse `terminal-ended` (run).

The refusal of a by-hand interrupt on a suspended agent is right for the user. Run with a stand-in that survives a resume: `foreground sent`, `suspended no-agent`, `after fg sent`. The Escape would reach the shell at that moment and never the agent, and in a by-hand pane a stray Escape at the prompt prefixes the user's next key. What is wrong around it is findings B2 and B3, plus one inconsistency without a finding: a `-shell` id's interrupt is unchecked and sends Escape to the shell (`interrupt sent` above), so the two kinds differ.

The ruling's "foreground claude with tmux word `2.1.316`" has no row, since `checkPane` no longer reads that word. The report says so and the reading agrees.

Ruling 5: holds. The test is `terminal-close.test.ts`, "asks nothing, stops nothing and says nothing when it closes", and it reads sound: `reads`, `stops` and the tab's `refusal` are all checked empty.

Ruling 6: holds.

Ruling 7: holds for the four named sentences and the extra ones in `model-sessions.ts:239-241` and `model-machine.ts:241-244,426-431`, each true of the code and each from the grep's scope. Every `did not start` / `oculus started` hit about terminals is true. Two sentences the round made false use other words: ST1 and ST2.

Ruling 8: holds. Cases 1 to 13 agree with `git show 9b96a1b78:` where I checked them, namely `parseTerminal`'s usage line (`sessions.ts:406` at the base) and the `isTerminalId` refusals in the base lines the diff shows. The three asynchronous paths agree with `agent-watch.ts:98-118`, `channel.ts:588-592,641` and `steer.ts:28-54`. `TIMEOUT_MS` reaches `execFile` (`tmux.ts:101-112`) and `PS_TIMEOUT_MS` the timer in `readRows`.

Failing lines of the new tests: each is consistent with the snapshot's code by reading. Changed expected counts in "publishes nothing for the same table and once for a new agent": `[0, reads + 1]` then `[1, reads + 3]` is one tick, then a tick and one refresh, which matches ruling 1 and my run. The test was not fitted to a defect.

SPEC

none

PROOF

P1. `tests/server/machine/pty/agent-pane.test.ts:266-276` and `:278-306`, with `panes/steer.ts:50-53`.
```
export async function interruptAgent(id: string, options: SteerOptions): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    if (byHandPane(id) !== null) await checkPane(id, options);
```
Wrong: the outcome report judgment 4 names, a by-hand interrupt refused `no-agent`, has no row. The interrupt rows are the sent one and `terminal-ended`. `-shell` with no tty (`steer.ts:35`, judgment 3) has no row either. `agents/spec.md:60` asks one row per input that gives a different outcome.
Failure: `interruptAgent` loses the foreground half of the check, a by-hand Stop on a suspended agent then types Escape into the user's shell, and the unit suite stays green. My run above shows the behaviour holds today.

STANDARDS

ST1. `src/lib/server/machine/pty/channel.ts:65-71`, and `:14-18` of the head.
```
 * Milliseconds between two `list-sessions` calls while nothing is attached and no task terminal
 * runs. Nobody is looking at a terminal then, and the only thing the list can report is a session
 * started outside oculus, so a minute is soon enough and costs a twelfth of the calls the attached
 * rate does.
```
Wrong: ruling 1's tick lists every 5000 ms while any page is subscribed, attached or not, so that state costs twelve tick lists a minute plus the idle one, and the "twelfth" holds only with no page at all. The head's "a machine with no terminal open runs no tmux child" and "once a minute while none is" have the same fault. `agents/spec.md:72` makes such a sentence a defect of the change. The report's "Sentences" lists channel.ts's head as rewritten, and the new paragraph at `:30-32` does not correct these.
Failure: a reader weighing the cost of the terminal list reads one call a minute for an open page with no terminal, where `no client, idle: 1500 ms: lists 5` at poll 300 shows one per tick.

ST2. `tests/server/machine/pty/agent-pane.test.ts:4-5`.
```
// tmux double of terminal-fixture.ts, the timer from a fake clock, and one case from a private tmux
// server, since only tmux says which pane a control client's output came from.
```
Wrong: the describe at `:486` now holds three cases on a private server, and two of them are about something else, the environment and the foreground. Failure: a reader takes `leaves the environment...` and `reads what the foreground...` for cases the head does not name.

ST3. `tests/server/machine/pty/agent-pane.test.ts:238`.
```
            shell: '/bin/zsh',
```
Wrong: `post` still hands the option the steer no longer reads. `checkPane` has no shell, and none of the bodies this helper sends is a busy read. Failure: a reader takes the steer to depend on the login shell, which is what ruling 4 ended.

BEHAVIOUR

B1. `src/lib/server/machine/pty/channel.ts:541-575` with `:658-661`, `panes/driver.ts:103-104` and `panes/listing.ts:85-92`.
```
    #follow(): void {
        const ids = [...this.#attached.keys()].filter((id) => this.#streams?.has(id) !== true);
        this.#driver.attached(ids, this.#byHand());
    }
```
```
            byHand.get(id) ?? sessionName(id),
```
Wrong: `#follow` runs only from `#attach` and `remove` (`:519`, `:602`), never when a list is taken, so the driver keeps the tmux session of the last attach. Ruling 3's fold makes `byHand.session` the first session tmux prints, and tmux prints `view2` before `work`. Report judgment 5 says "either session's client carries that pane's output", which stops being true once that session goes.
Failure, run by `fg-run.ts`:
- `work` and `new-session -t work -s view2`, claude in the shared pane, the grid open, then `kill-session -t view2`.
- Output: `listed $1 view2 attaches so far 1`, then `after kill: listed $0 attaches in 5.8 s 5 TWO reached false`.
- Argv of the last attaches: `-C attach-session -E -t $1`.
The list says `$0`, the client retries the dead `$1` once a second for as long as the page stays attached, and the grid stops for good while the terminal stays listed with a box. By reading, `join-pane` or `move-pane` of a by-hand pane into another session has the same cause: the client stays on the old session and the pane's output stops. Not run.

B2. `src/lib/server/machine/pty/panes/steer.ts:36-39` reached from `:52`.
```
    // A read that fails says nothing of the pane, and what is not known to be an agent is not typed
    // into.
    const processes = await (options.foreground ?? readTty)(tty).catch(() => []);
    if (!foregroundAgent(processes)) throw new TerminalRefused('no-agent');
```
Wrong: the rule's reason is that text would run as a command, which is a steer's hazard. An interrupt shares it through judgment 4 and sends one Escape, so a failed `ps` refuses Stop for an agent that is running.
Failure: `ps` is killed at its 10 s limit under load, the user presses Stop on a runaway agent in a by-hand pane, waits 10 s, and reads that no agent is running, while the agent goes on. The same press on a `-shell` id goes through unchecked. A judgment for the orchestrator: on a failed read an interrupt should go on, with the server-pid and foreground refusals kept.

B3. `config/text/views/sessions/terminal.yml:58`.
```
        refused_no_agent: No agent is running in this terminal any more, so nothing was typed.
```
Wrong: ruling 4 makes this line answer a suspended agent, a background one and a failed read, and it is false for all three. `ps` shows `29441 29418 T    claude`, and `after fg sent` shows the agent is back. `paneAgent` reads the table with no process state, so the terminal stays listed as `claude` with its box while the box says no agent runs. The HELP sentence at `docs/HELP.md:453` is about a quit and stays true.
Failure: the user suspends claude in a shell terminal, presses Send and reads "any more", then concludes the agent quit and starts a second one over a job that is still held.

DECLINED TO JUDGE

- `npm run diagrams` and `npm run docs:palette` (the brief's verify line 1): both write to the worktree and I change nothing. Not run. The test:quick above ran without them.
- Whether the report's two full-list runs of this round were within `agents/spec.md:26`, and its printed lines: its transcript is not mine to read. The output format and the reds it names are consistent with the files.
- `grep -rlw <name> <base>/src <base>/tests` (first section of the report): no base copy was named to me. `git show 9b96a1b78:<path>` covers single files only.
- Page cases 14 to 19 as seen on screen: reading only, and spec forbids a page here.
- `ps -t` with `pgid=,tpgid=` on Linux: run on macOS only. Settled by the same probe on a Linux host.
- `agents/guarded.md`: G146's text still says "a steer into a pane whose foreground is the login shell types nothing" (line 429 on main). Ruling 4 widened that to any foreground that is no agent, and the new test in `terminal-close.test.ts` needs naming under its entry. That wording is the orchestrator's at landing, so it is noted here and not judged.
- The move of a by-hand pane between sessions in B1: by reading, not run.

Usage: a242434409dc8fcdf, claude-opus-5-5, 334737 tokens, 51 tool uses, 1019.3 s


## Closed

The first run's findings went to repair round 1 and each is closed there, as the run over the round gives per ruling; S4, P1, S5 and ST3 of the first run are report findings, stated in the round's report section (S5 as a breach of `agents/spec.md:26`).

The run over round 1, each fixed at landing:
- B1: `Terminals.#took` hands the driver the list's sessions, the tick compares a by-hand pane's session, and the driver reopens a client whose session moved (`panes/driver.ts`). Tests: 'hands the driver the session a by-hand pane moved to', 'forwards a pane through the session it moved to'.
- B2: `checkPane` takes `typing`; an interrupt goes on when the foreground cannot be read, a steer refuses. Test: 'sends an interrupt to a by-hand pane whose read fails'.
- B3: `sessions.refused_no_agent` says the foreground.
- P1: rows for a by-hand interrupt on a suspended agent and a steer with no tty.
- ST1: the head of `channel.ts` and `IDLE_POLL_MS`'s comment name the tick's list.
- ST2: the head of `agent-pane.test.ts`.
- ST3: the `shell` option left out of the test's route call.

Found by the look and fixed at landing: `forget` dropped a fetch waiting for its microtask with nothing to wake its reader, so a session opened in a new tab could stay blank (`queries.svelte.ts`, test 'asks for a transcript whose last viewer left while the first read waited'); a session with no terminal opened in the focused pane, over the sessions list (Z1103).
