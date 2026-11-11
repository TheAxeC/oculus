# O183 landing

Position: the oculus migration, step O183 (a running agent's terminal takes the whole height in the Live view) landed. Next: O182 lands, then the whole suite once and `npm run app:release` for v1.1.0; O184 after that.

Open items: none.

## Check of Steps 1

The runner's agent listing (ListAgents) showed no subagent of this session, so no builder, reviewer or brief-check agent of the step was running.

## Not done

Everything in the brief is done. `docs/HELP.md:257` still says Lock keeps "the tab's boxes and grids" from taking typing, one word off the new tooltip; the brief left that page to Axel.

## What landed

The whole range `04ffd50a4..migration-O183` (one wip commit 8fc91949f), 9 paths, 25 insertions and 35 deletions. `TerminalGrid.svelte` draws no `SteerBox`, so an agent's grid takes the whole height of the Live view. The box stays under the Transcript view at one size: the `small` prop is gone and the field and its line are at `--fs-sm`, as on main. The lock's sentences say the tab's box and its grids (`config/text/views/sessions/terminal.yml:106`, `SessionTools.svelte:3-4`, `terminal-tabs.ts:51`, `tab-session.svelte.ts:84`).

## Fixes at landing

- G146 in `agents/guarded.md` names the terminal the Transcript view's box steers into, found by the agent's pid, and `src/lib/state/sessions/terminal/session/session-link.ts` (first review S3).
- The report cites `term.onData` at `TerminalGrid.svelte:322` (round 1 P1) and gives the selector weights as (0,3,0) and (0,2,1) (round 1 P2).

## Found

- Premise correction: the brief's reason that the terminal's kind decides the Transcript box was wrong; the box shows on `record !== null && agent === ''` and finds its terminal through `session-link.ts` (S3).
- Look flaw, outside this step's paths and on main before it: when a terminal's session links, the tab's bar gains the Live and Transcript switches, 26px against the other tools' 20px, so the bar grows from 33 to 39px and the grid moves down 6px. Booked as O184 (ruling Look flaws).

## Verification

In the gate at main's head with the range: `npm run diagrams && npm run docs:palette && npm run test:quick`, "test:quick: 63.1 s; every command passed", 9 changed files, 17 test files, svelte-check 591 files 0 errors. The diagrams and the palette regenerate to the staged copies. Main's index and the gate give the same tree under `git write-tree`, `91bee94d9c60c51963e04ce7976e267323cdcad3`. No benchmark is on this plan's list, so there is no A/B.

## Look

Scratch server 8797 from the gate. A real agent is not started for a look, so a stand-in served as the agent: a node script named `claude` or `codex` that draws an input box on the terminal's last rows and, given a session id, registers itself in the account's session registry.

- Claude and Codex terminals on Live: the grid reaches the terminal's inset with no box under it (grid 99 to 824, the terminal's bottom 830 less its 6px padding).
- A split of an agent and a shell: both grids end at 824.
- A by-hand tmux pane of 12 rows: drawn at the top of the taller grid, with no box.
- A foreign tmux session on Live: drawn at its own size, with no line.
- Locked: the Live grid takes no typing and draws no locked line. Unlocked: typing and Escape reach the agent.
- Tab stays in the grid, the only focusable element of the terminal body.
- The Transcript view of the live linked session draws the box with Stop and Send, its field at 12px (`--fs-sm`); of the ended session, the line "This session has ended, so it cannot be typed into." at 12px.
- The Lock tooltip reads "Lock this tab: its box and its grids take no typing until it is unlocked".
- An agent starting in or quitting from an unlinked shell terminal leaves the grid in place (99 to 819 before and after); the 6px move when the session links is the flaw above.

The stand-ins were ended, the scratch HOME's added transcript copy and registry entries removed, the foreign tmux session ended on the scratch socket, the server stopped and its tab closed.

## Agents and fixes

Builder abda66a3208c14d3e: 143393 tokens, 56 tool uses, 431 s; round 1 182046 tokens, 89 tool uses, 409 s. Brief check ac94e9d0644cf48ec: 133797 tokens, 32 tool uses, 278 s. Reviewer a099bdd2e603b13e4: 150126 tokens, 44 tool uses, 474 s; over round 1 a5028306cd31add3e: 142863 tokens, 35 tool uses, 447 s. All on claude-opus-5-5. The first report did not pass its bar; repair round 1 and the fixes at landing above closed it.
