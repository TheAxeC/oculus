# PR1 landing

Roadmap entry: the oculus migration. Step PR1, Present full screen, landed; 302 steps ticked, 30 open (`awk` over `plan.md`'s Packages). Next: E4g lands, then PR2 is prepared.

Open items: none (`orchestrator-state.md`, "Open items").

## NOT DONE

- The full-screen states were not looked at. On TEST the Present control and `F` left the pane as it was, because the browser refuses full screen to automated input: `requestFullscreen` run from the page answered "TypeError: Permissions check failed". The box on the page's background, the frame edge to edge, the click and the keys in full screen, the pointer hiding and the window file in the desktop app are verified by reading and by G53's test, not by a look.

## Stopped agents

`ListAgents` before the cherry-pick listed no PR1 agent running (the builder and both reviewers had completed).

## What landed

The Present control and `F` put the deck's box into full screen; Esc, F or the browser's own way leaves; arrows, Space and a click move; the pointer hides after 2 s; the box leaves full screen when its tab is hidden, the deck is empty, the view unmounts or the focus leaves the box. In full screen the shell's single keys are held back, the card cursor's keys pass over the grid and Tab wraps inside the box. The desktop app's window file keeps the window's own state through a page's full screen (G53), and a popped-out window's bounds are held until it is out of full screen. Paths: `DESIGN.md`, `HELP.md`, `config/catalogs/options.yml`, `config/present.yml`, `config/text/views/academic/present.yml`, `src/desktop/decide/window-file.ts`, `src/desktop/windows/windows.ts`, `src/lib/views/academic/present/Present.svelte`, `tests/server/desktop/window-file.test.ts`.

G53's test: `tests/server/desktop/window-file.test.ts`, "the window file during a page full screen > keeps the window's own state: $title", 11 rows, `Tests 11 passed (11)`.

## Fixes at landing

- B3: the focus leaving the box for an element outside it ends the full screen (`focusLeft`).
- B4: the card cursor's keys (`j`, `k`, `i`, `J`, `K`, ArrowUp, ArrowDown) pass while the grid is open, Enter on the cursor tile acts, Tab wraps inside the box (`keepTab`).
- Pr1: two rows added to G53's table, and case 16's window-menu row put in the order macOS emits.
- St6: the ledger id out of the test's head comment, and the title's possessive.
- Comment lines over 100 columns in `Present.svelte` rewrapped (`comment-width.test.ts` failed on them in the gate).

## Checks

Gate: `npm run diagrams` (no file changed), `npm run test:landing`: ok ASCII gate, ok format:check, ok lint, ok npm test, ok check then build then test:slow, `test:checks` 1 failed (comment width, fixed above); then `npm run test:checks`: `Test Files 15 passed | 1 skipped (16)`, `Tests 227 passed | 3 skipped (230)`. Main's staged diff `cmp`-equal to the gate's. No A/B (no `bench:`).

## The look

TEST, the Present view opened beside on the page: the toolbar shows Previous, Next, Overview, Present, Slides and `1 / 23`; the title slide's hint names "F for full screen". The Present tab was closed again after the look.

## Agents

Builder a9144e12c4f81cb07 (claude-sonnet-5-5; 201,688 tokens, 52 tool uses, 26.8 min; round 1 263,934 tokens, 28 tool uses, 11.3 min). Brief check a6a8c0abc5e9e3d71 (claude-opus-5-5, 176,558 tokens, 48 tool uses, 9.3 min). Reviewer aed7391d3da51eb81 (claude-opus-5-5, 224,203 tokens, 61 tool uses, 21.3 min); over round 1 a99e636de1d29873b (claude-opus-5-5, 179,880 tokens, 41 tool uses, 8.1 min). The first report passed its bar but for three wrong line numbers and one wrong import claim.
