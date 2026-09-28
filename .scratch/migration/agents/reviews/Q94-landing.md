# Q94 landing (2026-09-28)

Plan oculus/migration. Step Q94, the launch note removed. Next: Q97 (its round is built, the review over the round running), then set 2, Q98 + Q92 + Q89.

## Open items

None.

## Agents of the step

The builder and the reviewer had finished before the landing; `ListAgents` listed only Q97's round reviewer.

## NOT DONE

Nothing of Q94.

## What landed

- Deleted: `bin/dispatch-note.mjs`, `src/lib/server/sessions/stores/dispatches.ts`, `tests/checks/bin/dispatch-note.test.ts`, `tests/checks/bin/dispatch-note-race.test.ts`, `tests/server/sessions/stores/dispatches.test.ts`.
- The session scan no longer reads `~/.oculus/dispatches.json` or asks about builders' pids; the sessions watcher no longer watches the note; `liveSignature` compares the live sessions alone.
- `SessionAgent.dispatch` and `AgentDispatch` removed from the model; the Agents view draws subagent rows alone; five words of `config/text/views/sessions/agents.yml` removed.
- `HELP.md` and `DESIGN.md` no longer describe the launch note; the diagrams follow.

## What a reader sees differently

- Before: a builder a launcher recorded in the note showed as a launched row, tagged `launched`, with its harness, Codex token totals, a "launched by" tooltip and an open-transcript control. After: the Agents view lists the subagents the session's transcript names, with the description as the tooltip. A write to `~/.oculus/dispatches.json` no longer rescans the sessions channel.

## Fixes at landing (4)

1. `Agents.svelte` head comment: the clause saying a row has nothing of its own to open, false, removed.
2. `DESIGN.md:124`: "together" removed.
3. `folds.ts` and `Agents.svelte`: the ordering comments reworded.
4. `background.test.ts`: the repeated `dispatch in` line removed.

## Checks on main

`sh ~/.claude-work/skills/land/templates/verify.sh <state file>` from `tools/oculus`: `Test Files 338 passed (338)`, `Tests 5306 passed (5306)`, `COMPLETED 1428 FILES 0 ERRORS 0 WARNINGS`, both builds, `All matched files use Prettier code style!`, `verify: 6 commands passed`.

## The look

On the TEST page of Axel's Chrome on 8790, light theme: the Agents view opened there from the Views catalogue, this session picked; subagent rows alone, with running, done, stopped and error statuses; no launched tag, no claude or codex kind, no open control. While the checks ran the page briefly drew "The rail has no button" with the status bar at "waiting"; a reload drew the page as before.

## Next

Q97 lands once the review over its round is in; then set 2.
