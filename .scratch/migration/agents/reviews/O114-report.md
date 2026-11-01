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
