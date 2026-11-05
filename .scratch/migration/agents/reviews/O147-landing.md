# O147 landing

Position: roadmap entry "migration" (the oculus migration plan), step O147, the Present view's filter bar, landed; next: O148 (the Project facts strip).

Open items: none.

Check of Steps 1: the runner's agent listing (ListAgents) showed no subagent: the builder a700c9cd6e18ea451 and the reviewers a531dbf1711f69533 and a1ab16e604f88d09e had ended.

NOT DONE: Export in a browser tab was not looked at, since the print page opens the browser's print dialog, which stops the browser tools; whether a real browser's popup rule lets the print tab open is not verified. The presenter screen and the audience window were not looked at.

What landed: the boards' filters on the Present view over a deck holding a group of project decks, held in the pane's saved state; the deck read under the kept list narrows every group's member decks, the summary and grid slides, the counts and the legend, in the Overview, on screen, in the presenter screen, the audience window and the PDF; no pick writes a file. Fixes at landing: a print tab the browser blocks takes no lock and says "The browser blocked the print tab; allow pop-ups for this page and press Export again." (`present.export_blocked`); the deck's channel answers a print page only once the export lock is granted (`answerPrint`'s `grant` in `acts/export.ts`); the HELP Present paragraph says so; G32's Test line names the narrowing's test.

Verification, in the gate worktree at main's head 6a2b38d06 (`.agents/worktrees/gate-O147.log`):

```
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (19.4 s)
ok      svelte-check (49.4 s): 1793919128513 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (148.4 s): Duration  129.07s (transform 63.92s, setup 0ms, import 139.32s, tests 358.75s, environment 4ms)
FAILED  vitest (163.0 s)
ok      vitest slow (173.8 s): Duration  155.93s (transform 57.28s, setup 0ms, import 141.15s, tests 475.12s, environment 6ms)
```

The one failure: `tests/server/machine/runs/schedules/commands.test.ts` 'reads a hand change of the commands file into the payload', "Test timed out in 5000ms" (1 failed, 1755 passed), a file the step does not reach; alone right after, `npx vitest run tests/server/machine/runs/schedules/commands.test.ts` printed "Tests 3 passed (3)" at a load average of 13.44. On main the same range with the gate's resolved and fixed files; `cmp` of the two staged diffs printed SAME.

The look, on 8797: Stage, Tier, Pillar and Form under the toolbar of the portfolio deck; "submitted / under review" gives "Filtered: 11 of 24 decks", 18 slides of 22, the title slide's summary "5 pillar projects and 6 more"; Next under the pick goes to 2 / 18; Clear gives 22 slides on slide 2; the scratch hub folder equals its backup. Seen outside this step: two "Unknown view: slides" tabs in the scratch layout, saved before O145 retired the Slides view.

Found: the first review's findings closed in repair round 1; the review over round 1 found a blocked tab reported as opened and a refused export able to answer another export's print page, both fixed at landing, and the verify list run twice in the round, recorded. The builder's first report did not pass its bar.

Agents: builder a700c9cd6e18ea451 (claude-opus-5-5, 171430 tokens, 366 tool uses, 65 min 31 s; round 1: 359177 tokens, 140 tool uses, 28 min 7 s); brief check a5ec4b5cba21b2e92 (claude-opus-5-5, 286289 tokens, 113 tool uses, 16 min 3 s); reviewer a531dbf1711f69533 (claude-opus-5-5, 297296 tokens, 94 tool uses, 19 min 37 s); reviewer over round 1 a1ab16e604f88d09e (claude-opus-5-5, 226514 tokens, 64 tool uses, 14 min 55 s).

Next: O148, the Project facts strip.
