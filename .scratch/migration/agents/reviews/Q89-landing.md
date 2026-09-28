# Q89 landing

Oculus migration (tools/oculus/.scratch/migration). Plan step Q89: the terminal as VS Code's terminal. Next: `/spec` Q79a and Q79c, with Q92 in its repair round.

## Open items

None.

## The check before the landing

The runner's agent listing (ListAgents) showed one subagent of this session running, Q92's builder (a137b223fbd2bd7e2). Q89's builder (a905babf491651d99) and its three reviewers (a116360e9ab07e528, a38991e425707e8b4, aefceffa630f486a8) were not listed.

## Not done

- The keyboard paths (Delete and Backspace on a row, a held key, Shift+Enter, the arrow keys), the focus hand-off to the grid after a row press, the paste question, the file drop and the drag were not exercised on screen. `rowKey`, `armKept`, `pasteLines` and `movedOrder` have their cases; the list's `focusout` clear and the pointer hand-off have none, since the suite mounts no DOM.
- Split of a terminal outside every place was not seen on screen: a terminal's folder is the one it started in, and no terminal on this machine starts outside the composer's places. `splitState`'s case proves the state such a Split writes.

## What landed

- `TerminalList.svelte` and `terminal-list.ts`: the list of terminals on the right of the view, from two terminals on or one with the composer; one focus stop; Enter, Shift+Enter, Delete and Backspace; Split and Kill on hover; the drag order kept in the page's layout state.
- `state/sessions/composer.ts`: `splitRecord`, `offeredPlaces`, `composerWorkspace` and `splitState`; `Composer.svelte` offers the split folder first when no place holds it (Z39 (a)).
- `Terminal.svelte`: no message box under a shell; a pointer press on a row focuses the grid; the paste of several lines asks first; a file from the Files view drops its path.
- `state/client/context.ts`: the saved-layout rule registered beside `registerOpened`.
- HELP.md and DESIGN.md sentences for the Terminal view; the diagrams rerun.
- Fixes at landing, from the review over round 2: an `$effect` on the stop disarms a Kill armed on another row; `armKept(armed, stop)`; `splitState` and its case; `WorkspacePicker.svelte`'s comments.

## What was found

- Z39 (a) says the split folder is "listed first by its path". The picker labels every place by the last segment of its folder with the whole path as its tooltip, and the split folder follows that rule. If the ruling meant the whole path as the label, that is a change of one line in `WorkspacePicker.svelte`.
- A Kill armed by the pointer is disarmed when focus leaves the list, so a press in the grid between the two Kill presses means the next Kill press arms again.
- A tab opened by Split keeps offering its split folder in every composer it shows.

## Checks on main

```
$ sh /Users/axelfaes/.claude/skills/land/templates/verify.sh .../orchestrator-state.md   (from tools/oculus), exit 0
 Test Files  343 passed (343)
      Tests  5408 passed (5408)
verify: 6 commands passed
$ npx vitest run tests/state/sessions/composer.test.ts -t 'outside every place'   with splitState writing no split field
AssertionError: expected [ '/hub', '/hub/tools' ] to deeply equal [ '/tmp/elsewhere', '/hub', ...(1) ]
$ npm run diagrams, exit 0
```

## The look (the page named TEST on 8790, Axel's Chrome, vscode dark modern)

- A Terminal tab with the composer and a shell of the orchestrator's own (`cd /tmp` as its first command) drew the list on the right with one row, "zsh research-hub"; hover showed Split and Kill.
- Split opened a Terminal pane beside, its composer on Shell in the row's folder (hub).
- Kill pressed twice ended that shell, and the list left both panes.

## Next

`/spec` Q79a and Q79c in the two free slots; Q92's builder is in its repair round.
