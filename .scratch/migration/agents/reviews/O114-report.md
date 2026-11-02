Everything in the brief is done. Page cases 14-19 were not run: the brief makes them the orchestrator's look at landing, and no page, scratch server or browser was used here, so the merged view has been read and tested but never seen.

## Open items of the state file, verbatim

`## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)`

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

The list under that paragraph is empty.

## Cases' first run, on the unchanged tree

Tests, written first and run before any code changed: both files failed at import, so no case ran.

- `tests/server/machine/pty/agent-pane.test.ts:14:1`: import of `pty/panes/driver.ts`, which did not exist.
- `Error: Cannot find module '../../../../src/lib/state/sessions/terminal/session/session-link.ts' imported from .../reading-tab.test.ts`
- `Test Files  2 failed (2)`, `Tests  no tests`

By reading, cases 1 to 13 have no rule the brief gets wrong, so the step went on. Cases 14 to 19 are the look.

The same two files after the last change (`npx vitest run tests/server/machine/pty/agent-pane.test.ts tests/state/sessions/terminal/reading-tab.test.ts`):

```
 Test Files  2 passed (2)
      Tests  65 passed (65)
```

Where each case stands: 1-5 `an agent in a pane` table and `names claude in a pane tmux reports by its version`; 6 `lists a pane of a session oculus did not start...` and `keeps one row when a session is named as a by-hand id...`; 7, 7a `the actions on a by-hand terminal`; 7b `the output of one pane` (slow, a private `-S` tmux socket); 8, 9 `the timer of the table`; 10-13 `a tab that reads a session`.

## DONE / NOT DONE

The final run is the verify list's third, after the last change: `npm run diagrams && npm run docs:palette && npm run test:quick`, last line `test:quick: 392.5 s; every command passed`, exit 0. Its lines as printed:

```
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (14.0 s): 1793573016688 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (14.4 s)
ok      vitest checks (236.5 s): Duration  218.03s (transform 91.61s, setup 0ms, import 219.38s, tests 626.71s, environment 6ms)
ok      vitest (297.9 s): Duration  281.54s (transform 281.18s, setup 0ms, import 515.38s, tests 577.77s, environment 13.77s)
ok      vitest slow (389.5 s): Duration  373.32s (transform 28.50s, setup 0ms, import 177.60s, tests 1300.43s, environment 20ms)
test:quick: 392.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

| Item | State | Command | Output |
| --- | --- | --- | --- |
| 1 One view | DONE | `ls src/lib/views/sessions/transcript`; `grep -rn "turn_bar\|turn_toolbar" config src tests --exclude=local.yml \| wc -l`; `grep -n "view: transcript\|transcript" config/defaults/layout.yml` | `No such file or directory`; `0`; no line |
| 2 Tab state | DONE | the two test files | `Tests  65 passed (65)` |
| 3 Detection | DONE | the two test files; `grep -n "pane_current_command" src/lib/server/machine/processes/agents.ts` | `Tests  65 passed (65)`; no line |
| 4 Session and terminal | DONE | the two test files | `Tests  65 passed (65)` |
| 5 The switch | DONE, not seen | `npm run test:quick`; the look's cases 14-16 are the orchestrator's | `test:quick: 392.5 s; every command passed` |
| 6 The box | DONE, not seen | as item 5 | as item 5 |
| 7 The lock | DONE, not seen | `grep -n "disableStdin" src/lib/views/sessions/terminal/grid/TerminalGrid.svelte`; `grep -n "composer.locked\|composer.ended" src/lib/views/shared/sessions/SteerBox.svelte` | `282:        grid.options.disableStdin = locked;`; lines 47 and 48 |
| 8 Opening a session | DONE | the two test files; `grep -n "SessionPicker" -r src/lib/views/sessions/terminal \| wc -l` | `Tests  65 passed (65)`; `0` |
| 9 Follow state | DONE | `npm run test:quick` | `test:quick: 392.5 s; every command passed` |
| 10 Ended terminals | DONE | the two test files | `Tests  65 passed (65)` |
| 11 Placement | DONE | `sh utils/folder-check.sh`; `wc -l` | exit 0; `Terminal.svelte` 485, `TerminalGrid.svelte` 517, `channel.ts` 740, `sessions.ts` 814, `terminals.svelte.ts` 878, `context.ts` 873 |
| 12 Words | DONE | `npm run docs:palette`, `npm run diagrams` in the final run; `grep -n "transcript" docs/palette.md` | exit 0; no line |
| Character gate | DONE | the perl gate of `spec.md`'s last section over the 72 files changed or added under `src`, `tests` and `config` | prints nothing, exit 0 |

## Red lines in the three runs

- Run 1 printed `FAILED vitest` (zenodo.test.ts four timeouts, clone-after.test.ts one) and `FAILED vitest slow` (hub-portfolio.test.ts one timeout, credentials.test.ts two). None of the four files is changed by the step, each passed when rerun alone under that run, and run 3 prints `ok` for both commands. The run took 506 s under load.
- Run 2 printed `FAILED prettier` on `grid-look.ts` and `FAILED vitest checks` on `comment-width.test.ts` at `terminal-ids.ts:1`, `TerminalGrid.svelte:14` and `tab-actions.svelte.ts:1`. All are files of the step; each was fixed and the two checks rerun alone before run 3.
- `tests/checks/imports/cycles.test.ts`, which `test:quick` does not choose, fails on a direct run, `Tests  1 failed | 6 passed (7)`, on `lib/views/system/workbench/editors/Cards.svelte -> .../NestedCards.svelte -> ...Cards.svelte`. `diff -q` of both files against the base prints nothing, so the step neither made nor touched it. It reaches landing through the plan's whole verify list if that list runs this test.

## Files, line counts base -> after, from `diff -rq` against the base

Paths outside the brief's write list are marked with the reason.

| File | Lines |
| --- | --- |
| `src/lib/data/model/index.ts` | 854 -> 859 |
| `src/lib/data/model/machine/model-machine.ts` | 845 -> 842 |
| `src/lib/data/model/machine/terminal-ids.ts` | new, 56. OUTSIDE: model-machine.ts would have passed 880; split by concern |
| `src/lib/data/model/model-sessions.ts` | 776 -> 776 |
| `src/lib/server/machine/apps/tools/run/stream-terminals.ts` | 362 -> 363 |
| `src/lib/server/machine/processes/agents.ts` | new, 83 |
| `src/lib/server/machine/processes/live.ts` | 17 -> 17. OUTSIDE: import path of `listPanes` |
| `src/lib/server/machine/processes/read.ts` | 124 -> 124. OUTSIDE: import path of `Pane` |
| `src/lib/server/machine/pty/capture.ts` | removed, 315, moved to `panes/capture.ts` |
| `src/lib/server/machine/pty/channel.ts` | 876 -> 740 |
| `src/lib/server/machine/pty/edit.ts` | 159 -> 161 |
| `src/lib/server/machine/pty/routes.ts` | 517 -> 518 |
| `src/lib/server/machine/pty/sessions.ts` | 863 -> 814 |
| `src/lib/server/machine/pty/tmux.ts` | 525 -> 525 |
| `src/lib/server/machine/pty/panes/agent-watch.ts` | new, 102 |
| `src/lib/server/machine/pty/panes/capture.ts` | moved, 315 |
| `src/lib/server/machine/pty/panes/driver.ts` | new, 206 |
| `src/lib/server/machine/pty/panes/listing.ts` | new, 175 |
| `src/lib/server/machine/pty/panes/steer.ts` | new, 46 |
| `src/lib/server/machine/pty/panes/target.ts` | new, 23 |
| `src/lib/server/machine/runs/commands/run.ts` | 272 -> 273 |
| `src/lib/server/sessions/stores/turns.ts` | 304 -> 304 |
| `src/lib/state/sessions/folds.ts` | 321 -> 323 |
| `src/lib/state/sessions/terminal/composer/opening.svelte.ts` | 205 -> 211. Inside `state/sessions/` but not named: New in a reading tab clears `transcript` (item 8) |
| `src/lib/state/sessions/terminal/pty/pty-subscribe.ts` | 139 -> 139. Not named: a path in a comment |
| `src/lib/state/sessions/terminal/pty/pty-wire.ts` | 131 -> 138. Not named: the by-hand size on the wire |
| `src/lib/state/sessions/terminal/session/open-session.ts` | new, 133 |
| `src/lib/state/sessions/terminal/session/session-link.ts` | new, 65 |
| `src/lib/state/sessions/terminal/session/workbench-shape.ts` | moved, 48 |
| `src/lib/state/sessions/terminal/terminal-lists.ts` | 239 -> 223 |
| `src/lib/state/sessions/terminal/terminal-payloads.ts` | 105 -> 107 |
| `src/lib/state/sessions/terminal/terminal-tabs.ts` | 445 -> 435 |
| `src/lib/state/sessions/terminal/workbench-shape.ts` | removed, 48, moved to `session/` |
| `src/lib/state/sessions/terminals.svelte.ts` | 870 -> 878 |
| `src/lib/state/sessions/transcript.svelte.ts` | 300 -> 292 |
| `src/lib/state/shared/answers/terminal-words.ts` | 97 -> 99. OUTSIDE: the word of the new refusal |
| `src/lib/state/system/machine/processes/processes.ts` | 149 -> 149 |
| `src/lib/state/workbench/layout/tabs/terminal-host.ts` | 66 -> 67. OUTSIDE: `paneTab` leaves out a reading tab, the second half of `pageTarget`'s rule (item 8) |
| `src/lib/state/workbench/selection.svelte.ts` | 114 -> 114 |
| `src/lib/views/sessions/session-detail/AgentRows.svelte` | 173 -> 173 |
| `src/lib/views/sessions/session-detail/DetailsBody.svelte` | 422 -> 421 |
| `src/lib/views/sessions/session-detail/SessionDetail.svelte` | 214 -> 215 |
| `src/lib/views/sessions/session-list/SessionList.svelte` | 455 -> 459 |
| `src/lib/views/sessions/session-list/TerminalRows.svelte` | 223 -> 225 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 517 -> 485 |
| `src/lib/views/sessions/terminal/TerminalFontTools.svelte` | removed, 39, moved to `bar/` (item 11) |
| `src/lib/views/sessions/terminal/bar/SessionTools.svelte` | new, 43 |
| `src/lib/views/sessions/terminal/bar/ShowSwitch.svelte` | new, 38 |
| `src/lib/views/sessions/terminal/bar/TerminalBar.svelte` | 121 -> 128 |
| `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte` | moved, 39 |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | 520 -> 517 |
| `src/lib/views/sessions/terminal/grid/grid-look.ts` | 155 -> 217 |
| `src/lib/views/sessions/terminal/list/TerminalList.svelte` | 497 -> 500 |
| `src/lib/views/sessions/terminal/list/tab-actions.svelte.ts` | new, 148 |
| `src/lib/views/sessions/terminal/terminal-list.ts` | 719 -> 730 |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | new, 310 |
| `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts` | new, 72 |
| `src/lib/views/sessions/transcript/Transcript.svelte` | removed, 351 |
| `src/lib/views/shared/card/card.ts` | 244 -> 244 |
| `src/lib/views/shared/sessions/SteerBox.svelte` | 183 -> 194 |
| `tests/checks/tree/boundaries.test.ts` | 528 -> 528. OUTSIDE "tests for the files above" by a strict reading: the frozen entry names a moved file |
| `tests/fixtures/doubles.ts` | 109 -> 109 |
| `tests/fixtures/sessions-fixture.ts` | 152 -> 153 |
| `tests/server/machine/apps/world/terminals-double.ts` | 77 -> 78 |
| `tests/server/machine/pty/agent-pane.test.ts` | new, 414 |
| `tests/server/machine/pty/channel.test.ts` | 565 -> 562 |
| `tests/server/machine/pty/pane-screen.test.ts` | 100 -> 100 |
| `tests/state/client/terminal/terminal-close.test.ts` | 180 -> 181 |
| `tests/state/sessions/terminal/reading-tab.test.ts` | new, 278 |
| `tests/state/sessions/terminal/show-focus.client.test.ts` | 64 -> 64 |
| `tests/state/sessions/transcript-follow.client.test.ts` | 150 -> 150 |
| `tests/state/sessions/transcript-tab.svelte.ts` | 31 -> 32 |
| `config/defaults/layout.yml` | 346 -> 339 |
| `config/text/views/sessions/composer.yml` | 63 -> 65 |
| `config/text/views/sessions/terminal.yml` | 119 -> 127 |
| `config/text/views/sessions/transcript.yml` | 19 -> 17 |
| `docs/HELP.md` | 605 -> 610 |
| `docs/palette.md` | 205 -> 204 |
| `docs/diagrams/layer-server.dot`, `.svg`; `layer-state.dot`, `.svg`; `layer-views.dot`, `.svg`; `layers.dot`, `.svg` | regenerated, 162, 798, 173, 855, 179, 809, 101, 556, each equal in count to the base |

## Edits to existing assertions, allow lists and test support, one row per changed line (from `diff` against the base)

| File | Before | After |
| --- | --- | --- |
| `tests/checks/tree/boundaries.test.ts:152` (FROZEN allow list) | `'lib/server/machine/pty/channel.ts:CHANGE_EVENTS',` | `'lib/server/machine/pty/panes/driver.ts:CHANGE_EVENTS',` |
| `tests/fixtures/doubles.ts:12` | `import type { TerminalDriver } from '../../src/lib/server/machine/pty/channel.ts';` | `import type { TerminalDriver } from '../../src/lib/server/machine/pty/panes/driver.ts';` |
| `tests/fixtures/sessions-fixture.ts:81` | absent | `agent: null,` |
| `tests/server/machine/apps/world/terminals-double.ts:54` | `job: request.job ?? null` | `job: request.job ?? null,` and `agent: null` |
| `tests/server/machine/pty/channel.test.ts:12` | the import of `Terminals`, `ptyChannel` and `type TerminalDriver` from `channel.ts` | `Terminals, ptyChannel` from `channel.ts`, `type TerminalDriver` from `panes/driver.ts` |
| `tests/server/machine/pty/pane-screen.test.ts:1` | comment, `src/lib/server/machine/pty/capture.ts` | comment, `server/machine/pty/panes/capture.ts` |
| `tests/server/machine/pty/pane-screen.test.ts:17` | import from `pty/capture.ts` | import from `pty/panes/capture.ts` |
| `tests/state/client/terminal/terminal-close.test.ts:54` | absent | `agent: null,` |
| `tests/state/sessions/terminal/show-focus.client.test.ts:11` | type import from `terminal/workbench-shape.ts` | type import from `terminal/session/workbench-shape.ts` |
| `tests/state/sessions/transcript-follow.client.test.ts:2-7` | head comment naming the Transcript view | head comment naming a Terminal tab's transcript body |
| `tests/state/sessions/transcript-tab.svelte.ts:1-5` | head comment naming `Transcript.svelte` | head comment naming `TranscriptBody.svelte` |

No threshold, tolerance or expected value moved.

## Unused exports (`sh utils/unused-exports.sh` against the base)

The lines of the file that the step added, from `diff` of the two outputs:

- `src/lib/state/sessions/terminal/session/open-session.ts: openSessionIn`: kept, imported by `tests/state/sessions/terminal/reading-tab.test.ts:34`, which asserts the rule without a store.
- `src/lib/state/sessions/terminal/session/open-session.ts: SessionAsk`: kept, imported by the same test at line 35.

The `channel.ts` and `sessions.ts` lines changed by names leaving those files. `kindOf` stands in the base's line.

## Helpers, grep before writing

`grep -rlw <name> <base>/src <base>/tests | wc -l` for each name the step exports from a new module: 0 for `AgentWatchOptions`, `createSessionOpening`, `interruptAgent`, `LinkRecord`, `LinkTerminal`, `openSessionIn`, `paneAgent`, `paneListArgs`, `paneTarget`, `SessionAsk`, `SessionOpening`, `steerAgent`, `SteerOptions`, `tabSession`, `terminalSession`, `withAgents`. Moved names (`listPanes`, `Pane`, `sessionName`, `sessionTerminal`, `TerminalDriver`, `terminalsOf`, `tmuxDriver`) hit their own sources. `targetOf` and `childrenOf` have other local or module-level functions of the same name with other subjects (`views/shared/explorer/tree/drag.ts:37`, `data/helpers/files/nesting.ts:33` and others). `tabActions` is the name two other views give their own tab's actions (`views/shared/explorer/control/tab-actions.ts:40`, `views/sources/source/status/ask-perform.ts:58`); no module imports two of them.

New ids: the by-hand id `h<server pid>p<pane>-<tool>` cannot be empty, cannot equal an oculus-minted id (a different regular expression, `terminal-ids.ts`), and a tmux session named like one is `foreign` (case 6). Its collision with a Claude UUID or a Codex day path is ruled out by the shape; the comment at `isTerminalId` says so.

## Docs and comments

Rewritten: the head comments of `Terminal.svelte`, `TerminalGrid.svelte` (the stylesheet sentence moved to `buildGrid`), `channel.ts`, `sessions.ts`, `terminal-lists.ts`, `terminal-tabs.ts`, `terminals.svelte.ts`, `transcript.svelte.ts`, `pty-subscribe.ts`, `terminal-host.ts`, `tmux.ts`; `transcript.yml`'s head and `transcript_open_tip`; `layout.yml`; `docs/HELP.md` rows at the chord table, `session-list`, `terminal`, the Session bullet, and six new Terminal bullets; the two test comments above.

Still true, read and left: `card.ts`'s comment above `SESSION_VIEWS`; `state/client/context.ts`, unchanged; `model-machine.ts` as named by `terminal-words.ts:2`, `schedule-words.ts:2`, `terminal-kinds.ts:5` and `data/helpers/run/tasks.ts:2`, each for a name still defined there.

Grep of the moved paths: `grep -rln "pty/capture.ts\|views/sessions/transcript\|terminal/workbench-shape" src tests docs config --exclude=local.yml` prints one file, `tests/checks/config/config-folder.test.ts`, whose line 329 is `'views/sessions/transcript.yml',`, the config file that stays.

Each new string and bullet was read against `spec.md`'s prose rules (plain, one line, no history). No departure found.

History words in new and rewritten text (`before|used to|no longer|still|...`), judged by reading as run-time order or a physical state, none as history: `channel.ts` "ended with before is another process"; `agent-watch.ts:17,41,93`; `driver.ts:17,82,161`; `panes/capture.ts:61,101,201,232` (moved text); `steer.ts:22` "no longer holds the agent"; `open-session.ts:5` "no longer says"; `TranscriptBody.svelte:14,69,85,117`. `tests/checks/source/history.test.ts` passed in the final run's `vitest checks`.

## Judgment calls, each reversible

1. The switch and the lock are two components, since the brief puts them in two places: `bar/ShowSwitch.svelte` on the bar, `bar/SessionTools.svelte` (lock and End) in the header.
2. `ShowSwitch` is two `ToolButton`s, since `Segment` has no disabled item and Live must disable.
3. The lock tool stays while the tab is locked, even after the agent quit, so a lock can be taken off. The brief draws it "while a terminal with a session shows".
4. A lock binds a tab with a terminal of its own (`tab.locked && tab.shown !== null`). A reading tab with no terminal has no lock and is read-only by item 7.
5. A null record in the body shows `Empty` with `detail_empty`, since `SessionPicker` is not drawn.
6. Split stays offered on a by-hand terminal: the brief's menu list leaves out Kill, Rename, Change Icon, Change Color and Clear, not Split. Split starts a new oculus terminal in the pane's folder.
7. `m1-m3` in `docs/HELP.md`: the Sessions group holds three views now, `m4` and `m5` gone.
8. `terminal-ids.ts` holds the id shapes and the two agent types, split from `model-machine.ts` for the 880 limit.
9. `list/tab-actions.svelte.ts` holds the tab's menu actions, the rename field and the icon dialog state, split from `Terminal.svelte` for the 520 limit. The handlers keep their behaviour; only their home changed. `reflowLook` in `grid-look.ts` holds the theme effect's frame work for the same limit on `TerminalGrid.svelte`.
10. `gridLook`, `applyLook` and `GridLook` are now local to `grid-look.ts`, and `IDLE_MS` local to `driver.ts`, since nothing else imports them.
11. `transcript.yml` keeps `transcript_open_tip`'s key with new words.

## Limitations, by reading

- Nothing of the view has been drawn in a browser, so every line of "Before and after" below is from the code, not from a look.
- A by-hand grid larger than the tab scrolls (`.grid.pane { overflow: auto }`), which HELP states; its look is case 18.
- Detection is one tick behind reality; the steer's check of `pane_current_command` covers that gap, and case 7a tests it.
- A review comment sent from a diff to a locked session goes, as the brief decides, and HELP says so.
- If the first table read after a server start fails, a tab holding a by-hand terminal closes, as the brief decides.

## Before and after, the look

| View | State | What differs |
| --- | --- | --- |
| Sessions page | default layout | Before: a column split of Terminal over Transcript, 0.6 and 0.4. After: one Terminal pane. |
| Terminal tab | shown terminal has a session | New on the bar: Live and Transcript. New in the header: Lock, and End while on Transcript. |
| Terminal tab, Transcript | body | Same turn list and padding (`.frame` 6/6/4 plus `.terminal` 4/6/6 equals `Pane`'s 10/12). The surface differs: the pane has `share="terminal"`, so over a wallpaper it takes the terminal's opacity, where the Transcript pane took the pane's. |
| Terminal tab, Transcript | moved `.chat` | `data-instance` is on `.terminal`, and `.chat` carries none. |
| Terminal tab | plain shell, no session | No difference: no switch, no box. |
| Shell terminal | agent running in it | Icon and title follow the agent, box appears. |
| Grid | locked | Takes no typing, paste or drop. Box read-only with `composer.locked`. |
| Grid | by-hand | Drawn at the pane's size, scrolls if larger, sends no resize. Menus lack Kill, Rename, Change Icon, Change Color and Clear. Rows in the list lack Kill and Stop. |
| Steer box | session with no terminal | Running: `composer.elsewhere`. Ended: `composer.ended`, new. |
| Session list | press | Opens the session; a transcript tab no longer follows the selection. |

## Runs

- Full verify-list runs: 3 ran to their end. Run 1 and run 2 are under "Red lines"; run 3 is the final run and every command passed.
- No whole-suite command. `npx vitest run tests/state tests/views tests/checks tests/ui` ran twice while working, as a scoped choice of folders of the step; `tests/server` and `tests/routes` were not in it.
- Scripts: none written.
- Nothing is left running: `ps -eo pid,command | grep -E "worktrees/migration-O114|test:quick"` printed nothing after the final run.

# Repair round 1

Every ruling of `briefs/O114-round1.md` is done. Page cases 14-19 stay the orchestrator's look.

This section supersedes three things above: the limitation that names `pane_current_command` for the steer (the check is now the pane's tty, ruling 4), the unused-exports lines for `openSessionIn` and `SessionAsk` (ruling 6), and the line counts of the files listed under "Files of this round".

## Final run

`npm run diagrams && npm run docs:palette && npm run test:quick`, after the last change, exit 0:

```
ok      ASCII gate (1.1 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.7 s)
ok      svelte-check (11.5 s): 1793575846430 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (11.8 s)
ok      vitest checks (182.5 s): Duration  165.53s (transform 58.66s, setup 0ms, import 159.49s, tests 462.59s, environment 5ms)
ok      vitest (243.5 s): Duration  229.39s (transform 225.77s, setup 0ms, import 421.73s, tests 475.41s, environment 11.00s)
ok      vitest slow (330.6 s): Duration  316.78s (transform 23.42s, setup 0ms, import 156.40s, tests 1096.88s, environment 20ms)
test:quick: 333.4 s; every command passed
```

Full-list runs in this round: 2. The first printed `FAILED vitest checks`, `comment-width.test.ts` at `processes/ps.ts:84` and `Terminal.svelte:30`, both files of this round; both lines were rewrapped and the check passed alone (`Tests  2 passed (2)`) before the second run. `tests/checks` was not run whole.

Scoped, before those two comment edits: `npx vitest run tests/server/machine/pty/agent-pane.test.ts tests/state/client/terminal/terminal-close.test.ts tests/state/sessions/terminal/reading-tab.test.ts` printed `Tests  85 passed (85)`, and `npx vitest run --tagsFilter slow --testTimeout 20000 tests/server/machine/pty/agent-pane.test.ts` printed `Tests  3 passed | 48 skipped (51)`. Those two edits touched comments alone, and the final run's `ok vitest` and `ok vitest slow` came after them.

`sh utils/folder-check.sh`: exit 0. The perl gate over the 74 files changed or added under `src`, `tests` and `config`: prints nothing, exit 0.

## Rulings

| Ruling | Result | Proof |
| --- | --- | --- |
| 1 S1, B2 | `AgentWatch`'s tick after the first lists the panes by one `driver.run(paneListArgs())`; `panesOf` (`channel.ts`) compares id, agent, by-hand cols and rows with the last list taken; a difference starts one `refresh()`, with or without a live client | `publishes $name once, a control client: $client`, six rows |
| 2 S2 | A by-hand id's client attaches with `-E` (`driver.ts`, `control`'s new `attach` argument); an oculus terminal's arguments are unchanged | `leaves the environment of the session as it stood before the attach`, private `-S` socket |
| 3 S3 | `onePerPane` (`listing.ts`) folds rows by pane id; a pane an oculus session holds stays that session's; every session holding a shown pane gives up its `foreign` row | `lists a pane held by %s once`, three rows |
| 4 B1 | `checkPane` asks tmux for `#{pid}\t#{pane_tty}`, then `readTty` (`ps -ww -t <tty> -o pgid=,tpgid=,command=`, argument list, no shell, `processes/ps.ts`), then `foregroundAgent` (`agents.ts`, `runsAgent`). No agent, or a failed read: `no-agent`, nothing typed | `refuses a steer into %s and types nothing`, seven rows; `types into a shell terminal whose foreground runs claude`; `reads what the foreground of a real pane runs` |
| 5 P2 | Test added | `a tab that owns a by-hand terminal asks nothing, stops nothing and says nothing when it closes` |
| 6 ST1 | `SessionAsk` and `openSessionIn` are local; the test goes through `createSessionOpening` | `diff` of `sh utils/unused-exports.sh` against the base names neither |
| 7 ST2 | See "Sentences" | read, listed below |
| 8 S4, P1, ST3 | See "Cases on the unchanged tree" and "Asynchronous paths" | below |

HELP's sentence "Send after a quit, while the list has not caught up, types nothing and says no agent is running." stays true: a quit agent has given the foreground back, which case `at zsh` and the suspended case cover.

Run before writing, on a private socket with tmux 3.7c: `ps -ww -t /dev/ttys008 -o pgid=,tpgid=,command=` printed `64525 64525 cat`; the same with `ttys008` printed the same; `ps -ww -t /dev/ttys999 ...` printed `ps: /dev/ttys999: No such file or directory`, exit 1, which is the sentence on `readTty`; `attach-session -E` left `PROBE_MARK` out of `show-environment`, and the plain attach printed `PROBE_MARK=one`; `list-panes -a` after `new-session -t work -s view2` printed `%0 view2 $1` and `%0 work $0`.

## Failing lines before the fixes

From the tree as it stood, the commands of the two runs above:

| Test | Failing line |
| --- | --- |
| `lists a pane held by two sessions once`, and `... named under the prefix once` | `AssertionError: expected [ 'h900p0-claude', 'h900p0-claude' ] to deeply equal [ 'h900p0-claude' ]` |
| `lists a pane held by an oculus session and another once` | `AssertionError: expected [ 'a1b2c3-shell', 'h900p0-claude' ] to deeply equal [ 'a1b2c3-shell' ]` |
| `refuses a steer into %s and types nothing`, all seven rows | `AssertionError: expected [ 200, undefined ] to deeply equal [ 400, 'no-agent' ]` |
| `publishes nothing for the same table and once for a new agent` (expected counts edited, below) | `AssertionError: expected [ +0, 1 ] to deeply equal [ +0, 2 ]` |
| `publishes ... once, a control client: true` and `: false`, all six rows | `AssertionError: expected "vi.fn()" to be called once, but got 0 times` |
| `starts no second list while the tick has one out` | `AssertionError: expected 1 to be 2 // Object.is equality` |
| `leaves the environment of the session as it stood before the attach` | `AssertionError: expected '-DISPLAY\n-KRB5CCNAME\n-MSYSTEM\nOCUL...' to be '-DISPLAY\n-KRB5CCNAME\n-MSYSTEM\n-SSH...' // Object.is equality` |
| `reads what the foreground of a real pane runs` | `TypeError: readForeground is not a function`, the function's name then; it is `readTty` now |
| the by-hand close test in `terminal-close.test.ts` | none: it passed on the tree as it stood, since `runningOf` and `endTerminals` already filtered by `isOwnTerminal`. The ruling asks a test of that behaviour |
| `reading-tab.test.ts`, rewritten through `createSessionOpening` | none: the function existed, and every case passed before and after ruling 6 |

`types into a shell terminal whose foreground runs claude` also passed before the fix: the old check typed for any word but the shell's. The ruling's "tmux word `2.1.316`" no longer reaches the check, since tmux is asked for the tty alone, so the case has no such word to hand it.

## Edits in this round to a test or an allow list

| File | Before | After |
| --- | --- | --- |
| `agent-pane.test.ts`, `publishes nothing...` | `toEqual([0, reads])` | `toEqual([0, reads + 1])`: a tick now makes one list call |
| same | `toEqual([1, reads + 1])` | `toEqual([1, reads + 3])`: two ticks and one refresh |
| same, `post` | second parameter, tmux's word | a `foreground` answer; `display-message` answers the tty |
| same, head comment | named the closed tab as not covered | names the grid alone, since `terminal-close.test.ts` covers the close |

No line of a base test's assertion changed; `terminal-close.test.ts` gains one describe.

## Sentences

Rewritten: `folds.ts` at `terminalChoices` (a `foreign` terminal is left out, a by-hand one is not); `SteerBox.svelte` head and the `terminal` prop; `SessionList.svelte` head; `Terminal.svelte` head (the body's paragraph follows the Transcript one). From the grep, also false and rewritten: `model-sessions.ts` at `terminals`; `model-machine.ts` at the section head, at `Terminal` and at its `id`; the head comments of `steer.ts`, `agent-watch.ts`, `driver.ts`, `channel.ts`, `ps.ts` and `table.ts`, which the rulings changed.

`grep -rn "did not start\|oculus started" src docs config --exclude=local.yml`, the hits about terminals read and still true: `tmux.ts:332`, `driver.ts:2`, `sessions.ts:3`, `listing.ts:7,76,81`, `edit.ts:6`, `schedules/watch.ts:103`, `terminals.svelte.ts:29`, `folds.ts:252`, `terminal-ids.ts:10,49`, `model-machine.ts` at `byHand`, `Processes.svelte:21`, `Terminal.svelte:21`, `HELP.md:260`, `terminal.yml:65`. The other hits are about the desktop app, workers, runs and fetches, which the step does not touch.

## Cases on the unchanged tree, by reading the base copy

| Case | Base gives | Verdict |
| --- | --- | --- |
| 1 | `kindOf` returns `shell` for the suffix, and `Terminal` has no `agent` | fail |
| 2 | `kind` claude by the suffix passes; `agent` has no field | fail |
| 3 | `shell` by the suffix | fail |
| 4 | `kind` shell passes; `agent` is undefined, not null | fail |
| 5 | no `agent` | fail |
| 6 | `parseTerminal` returns null without the prefix, so `work` is not listed, nor `oculus-work` by pane. The rows that stay out or read `foreign` pass: `work` on zsh, the usage session, `oculus-work` on zsh, `oculus-h1p1-claude` | fail |
| 7 | Stop, rename, restyle, clear, resize and restart pass: `isTerminalId` refuses the id, `not-ours`, no tmux. Steer and interrupt fail, refused where the keys should go to `%3` | fail |
| 7a | A `-shell` steer types with no check, so the refusal fails; a steer at `2.1.316` into `-shell` passes | fail |
| 7b | `output: (_pane, bytes) => outputs(id, bytes)` forwards every pane | fail |
| 8 | No table is read; there is no `agent` to keep. No throw holds vacuously | fail |
| 9 | No timer of the table, and a `live` driver polls nothing | fail |
| 10 | `resumes.id` passes; `agent.pid` has no field, the inverse function does not exist, and no Codex rule | fail |
| 11 | `readTab` holds none of the keys | fail |
| 12 | `closeEnded` closes a tab left with none unless it composes: Live passes, Transcript fails, and a by-hand id is no id | fail |
| 13 | No opening function; a start lands on `pageTarget`'s active tab | fail |

## Asynchronous paths

**`AgentWatch`'s tick.**

- In flight: `#reading` is true from the start of the `ps` to the end of the list call, so a timer tick and `watched(true)` return at once. A `ps` is killed at 10 s and a tmux call at `TIMEOUT_MS`, 5 s, so a turn ends. The first tick lists nothing: the server's own first read waits on it.
- After close: `close()` aborts, so the `ps` is killed and its failure settles when the child has gone; `#closed()` then starts no list and calls no `answered`. A list out at the close is not cancelled; its answer or failure is dropped by the check after it.
- Superseded: two ticks never overlap. A tick's list older than a list a refresh took is compared with the newer `#listing`; a difference starts one refresh, whose signature then publishes nothing. `watched(false)` during a tick clears the timer and that tick runs out. A failed `ps` leaves the last table and the list still runs; a failed list answers null, and the table is compared over the last list taken.

**The wait in `#attach`, a by-hand id.**

- In flight: `await this.#listed.promise` holds until the first list is taken, an empty one included; a tmux that only ever fails with another reason holds it until close. No attached entry exists during the wait, so an `input` is dropped and a `resize` is kept in `#asked`, which `#resize` then ignores for a by-hand id.
- After close: `close()` resolves `#listed` and clears `#pages`, so `!this.#pages.has(sink)` returns before anything is attached. `remove(sink)` during the wait does the same for that sink.
- Superseded: the check reads the current list, not the one the wait began with, so an id gone by then attaches nothing. Nothing retries: a list that later holds the id attaches nobody until the page subscribes again. Two subscribes of one sink both pass and each reads a screen, as two subscribes of an oculus id do.

**The steer check followed by the typing.**

- In flight: `display-message`, then `ps`, then `steerTerminal`'s `send-keys` calls, each awaited. They are three steps and no lock holds them together, so an agent that quits between the `ps` answer and the `send-keys` has the text typed into the shell. That gap is the length of one process start; no tmux call closes it, and the check cannot be made atomic from here.
- After close: the steer is an HTTP request with no signal. A page that goes does not cancel it, and the check and the typing run to their end. `readTty` carries the 10 s limit, `run` the 5 s one.
- Superseded: a later steer cancels no earlier one. Two steers at once each check and each type, in the order their checks end, with no chain per terminal, as `steerTerminal` has at the base.

## Files of this round, base -> after

| File | Lines |
| --- | --- |
| `src/lib/server/machine/processes/ps.ts` | 149 -> 172. OUTSIDE the first list, named by ruling 4 |
| `src/lib/server/machine/processes/table.ts` | 78 -> 96. OUTSIDE: `TtyProcess` and its line reader sit beside `entryOf`, since this file reads the lines `ps` prints |
| `src/lib/server/machine/processes/agents.ts` | new, 91 |
| `src/lib/server/machine/pty/channel.ts` | 876 -> 749 |
| `src/lib/server/machine/pty/routes.ts` | 517 -> 519 |
| `src/lib/server/machine/pty/tmux.ts` | 525 -> 527 |
| `src/lib/server/machine/pty/panes/agent-watch.ts` | new, 119 |
| `src/lib/server/machine/pty/panes/driver.ts` | new, 208 |
| `src/lib/server/machine/pty/panes/listing.ts` | new, 194 |
| `src/lib/server/machine/pty/panes/steer.ts` | new, 54 |
| `src/lib/state/sessions/folds.ts` | 321 -> 324 |
| `src/lib/state/sessions/terminal/session/open-session.ts` | new, 133 |
| `src/lib/data/model/model-sessions.ts` | 776 -> 776 |
| `src/lib/data/model/machine/model-machine.ts` | 845 -> 846 |
| `src/lib/views/shared/sessions/SteerBox.svelte` | 183 -> 195 |
| `src/lib/views/sessions/session-list/SessionList.svelte` | 455 -> 460 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 517 -> 485 |
| `tests/server/machine/pty/agent-pane.test.ts` | new, 540 |
| `tests/state/sessions/terminal/reading-tab.test.ts` | new, 282 |
| `tests/state/client/terminal/terminal-close.test.ts` | 180 -> 194 |

## Judgment calls of this round

1. `-ww` is added to the ruling's `ps` line, as `PS_ARGS` has it, so a long command line is not cut.
2. A `ps` that fails refuses with `no-agent`, by the ruling's "otherwise".
3. A `-shell` id whose pane answers no tty refuses with `no-agent`; a by-hand id in that state keeps `terminal-ended`.
4. The check also runs for a by-hand interrupt, since `interruptAgent` shares `checkPane`. A suspended agent's Stop on a by-hand pane is refused.
5. A fold keeps the first row of a pane, so `byHand.session` is the first session tmux lists; either session's client carries that pane's output.
6. The tick's list is compared and not taken: a difference starts the ruling's refresh, and that refresh's list is what pages get. Each tick is one tmux call more, and a tick with a change is two.
7. `readRows` in `ps.ts` is the one spawn site for both reads, so its time limit, bound and failure words hold for `readTty`.
8. Beyond the ruling's two: the `tmux session missing` row, and `starts no second list while the tick has one out`, which extends case 9's "no second child" to the list call.

Limitation by reading: the gap between the `ps` answer and the `send-keys`, stated under "Asynchronous paths", stays. A program named `claude` by its second word under `node` or `bun` is an agent, and one started as `node /path/cli.js` is not, by `agents.ts`'s rule, so both detection and the steer treat it as no agent.
