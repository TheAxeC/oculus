# O184 landing

Position: the oculus migration, step O184 (a terminal tab's bar keeps its height when its session links) landed. Next: O185 (the whole suite runs green), its builder running; then the whole suite once with nothing else running, then `npm run app:release` for v1.1.0, the tag and upload waiting for Axel's word on the push.

Open items: none.

## Check of Steps 1

The runner's agent listing (ListAgents) showed one subagent running, O185's builder ad4d4274f77374e16; no builder or reviewer of O184 was running.

## Not done

Everything in the brief is done.

## What landed

The whole range `5d293bf5a..migration-O184` (one wip commit 4d44dbad4) with the fix at landing below, 3 paths. Live and Transcript (`src/lib/views/sessions/terminal/bar/ShowSwitch.svelte`) are `compact` icon buttons with their glyphs, 20px as the font buttons beside them, so the bar stays 33px when a session links; their accessible names are "Live" and "Transcript". The tooltips read 'Live: show the terminal this session runs in', 'Live: this session has no terminal to show' and 'Transcript: read the turns of this session' (`config/text/views/sessions/terminal.yml:110-112`). `docs/HELP.md:257` reads "the tab's box and its grids", the Lock tooltip's words.

## Fixes at landing

- `ShowSwitch.svelte:5`: the name "begins its tooltip", in place of "opens its tooltip", which read as the name making the bubble appear (review Standards 1).
- The report's history-word grep covers lines 2-7 of the head comment (Proof 1); its still-true list names the lines the brief named, each read at landing and still true (Standards 2); its before-and-after table holds the hover row, the border turning accent before and the chip fill after (Behaviour 1).

## Found

Nothing outside the brief.

## Verification

In the gate at main's head with the range and the fix: `npm run diagrams && npm run docs:palette && npm run test:quick`, "test:quick: 82.7 s; every command passed", svelte-check 592 files 0 errors. The diagrams and the palette changed no file. Main's index and the gate give the same tree under `git write-tree`, `75ce0f66322f78246a570f2ab1a997c5a104332d`. No benchmark is on this plan's list, so there is no A/B.

## Look

Scratch server 8797 from the gate, HOME in the session scratchpad; a stand-in agent run in a shell tab linked the tab to a session.

- No session: the Terminal bar 33px, the font buttons 20px.
- Session linked: the bar 33px with Live and Transcript, each 20px; the grid's top at 99.
- Live in force: accent fill, `aria-pressed="true"`; Transcript unfilled. After a press of Transcript, the other way round, the bar still 33px.
- Hover on the one not in force: the chip fill and the tooltip 'Transcript: read the turns of this session'.
- Lock pressed in the header beside the switches: the lighter accent tint against the switches' full fill. Lock is a toggle and the switches a choice of two, so the two looks are judged right side by side.
- A disabled ToolButton (the tab strip's 'Scroll tabs left') opens its tooltip; the switches use the same Tooltip wrapper, so a disabled Live opens its own.
- Catppuccin Mocha, brackets off: accent fill, 20px, bar 33px. Brackets on: each in brackets, the one in force in accent text with no fill, 20px, bar 33px. Icons off with brackets: '[>]' and '(@)' beside the font buttons' '[-]', '[+]' and '(r)', 20px, bar 33px.
- Text scale 1.25: every button of the bar 25px and the bar 38px with the switches.

The stand-in processes and the usage probes the scratch server started were ended and their registry entries removed, the copied transcript removed, the scratch workspace's theme and terminal-palette options and the Settings search text put back, the server stopped and its tab closed.

## Agents and fixes

Builder a297af9729e34af84: 170169 tokens, 55 tool uses, 452 s. Brief check aa2f320938434f843: 150981 tokens, 44 tool uses, 398 s. Reviewer a0bbb4de829304e8e: 147919 tokens, 35 tool uses, 318 s. All on claude-opus-5-5. The first report passed its bar; the review's four findings were fixed at landing.
