# Q123 landing

oculus/migration (the cockpit's replacement), step Q123, a terminal pane attached as its program left it, landed; step 301 of 350 ticked. Next: Q125 into the free slot.

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Z644 (2026-10-06, raised from PR1's brief check): does the desktop app's window-file rule get a guarded entry and a test? PR1 makes the main window never keep a page's full screen as its own, so `~/.oculus/window.json` is written with the window's state from before a deck went full screen. If that rule is wrong, the window reopens in full screen at every start, or loses the full screen the reader set. PR1 writes the rule as a pure function in `src/desktop/decide/window-file.ts` (the event order to the recorded state), which a unit table can test for both macOS event orders. (a) A new entry G53 in `agents/guarded.md`: "The desktop app's window file keeps the window's own state: a full screen a page asked for is never written as the window's full screen, and a full screen the reader set before is kept." PR1 writes its test, a table over the event orders of cases 15, 16 and 21. Pros: the rule is checked on every run, and its failure is seen at every start of the app. Cons: one more test file. (b) No entry: the rule is checked by reading and at the landing look only. Pros: nothing added. Cons: a later change to `keepState` can break it unseen until a start opens the window wrong. (b) is the lazy option. Recommendation: (a). PR1 is dispatched with (b)'s scope and gains the test on a ruling of (a), at its landing or in a repair round.

- Z645 (2026-10-06, raised from E4g's review): does every page arrangement shipped in `config/layout.yml` get a guarded entry and a test that parses it? On main the Help page's arrangement is a split with one child, which `parseArrangement` refuses, so the Help page opens nothing, and no check saw it (`grep -rn parseArrangement tests` prints nothing); E4g makes it one pane. (a) A new entry G54: "Every page arrangement in config/layout.yml parses, so every rail page opens what its arrangement names." Q125, which edits that file next, writes its test: one row per page, each parsed by `parseArrangement`. Pros: a broken arrangement fails the checks the day it is written. Cons: one more test. (b) No entry: arrangements are seen only at a look. Cons: a page that opens nothing ships unseen, as this one did. (b) is the lazy option. Recommendation: (a).

## The check of Steps 1

The builder (aaad76d3aba1c8ed9) and the reviewer (a4d132c79107eead5) are listed as completed by ListAgents; neither is running.

## Not done

- The look on TEST's Terminal tab: a new shell was refused with HTTP 403 on the viewing port, so the attach was looked at on a tmux stand-in grid instead (below).
- `tests/checks/diagrams/diagrams.test.ts` 'are named stale, every one at once, ...' times out at its own 60 s limit at load average 19, alone as well; Q124, in flight, removes that limit.

## What landed

A page that attaches to a terminal pane is given the modes the pane's program set (G51), and a pane whose program is in its alternate screen is given as the shell's history and saved screen in the grid's normal buffer, then `ESC[?1049h`, a move to the top left and the program's screen (G52), so the program draws full screen and leaving it brings the shell's text back. The pane readers are in `server/machine/pty/capture.ts`; `chat.ts`, `compose.ts` and `context.ts` are under `pty/start/`. 14 paths.

## What was found

Five fixes at landing from the review: the program's top row shifted by the shell's saved column (B1, fixed by the move to the top left), comment lines over 100 columns, a false reason in a doc comment, a fixture comment, and the test rows that asserted the shifted bytes.

## Checks

`npm run test:landing` in the gate: ASCII gate, format:check, lint, and check then build then test:slow passed; test:checks (3) and npm test (4) failed on timeouts only, at load average 19, in files the step does not change; alone, comment-width 2 passed, manifest 65 passed, watch 1 passed, undo 11 passed, diagrams 44 passed and the one stale-diagrams test timed out (booked to Q124). Main's staged diff `cmp`-equal to the gate's. The stand-in look: vim started at saved column 8 on a 40x6 pane, and the grid built from the message equal to the pane row for row.

## Agents

Builder aaad76d3aba1c8ed9 (claude-sonnet-5-5; hand-back 165,442 tokens, 30 tool uses, 9.0 min; final run not recorded). Brief check aa96e2257854c7ff2 (claude-opus-5-5, 181,338 tokens, 47 tool uses, 9.0 min), closed by a8ea7076e2eefc9f5 (claude-opus-5-5, 146,933 tokens, 29 tool uses, 6.8 min). Reviewer a4d132c79107eead5 (claude-opus-5-5, 210,694 tokens, 59 tool uses, 18.6 min). The first report passed its bar but for its first line; five fixes at landing.
