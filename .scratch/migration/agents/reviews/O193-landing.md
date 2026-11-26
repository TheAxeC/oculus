# O193 landing

Position: the migration plan, step O193, three screenshots in the README, landed (496 of the plan's 540 step lines ticked). Next: the app rebuilt from main and copied over `~/Applications/oculus.app`.

## Open items

None.

## Landed

- Check of Steps 1: the builder a204168451b37a205 and the reviewers af103e2f15603e431, ab8a03aa7a028303f and a5b0ce761f8719e2b had all completed; no subagent of this session is left running.
- NOT DONE: nothing of the brief.
- What landed: the whole range from base b4c4dd9d9 (wip commits a7f45d5ed and 160b4c93e: the build, repair rounds 1 and 2 and the fixes of the look) with the three screenshots of the last look, 18 paths, 1386 insertions and 17 deletions. `npm run docs:shots` runs the capture command in `utils/shots/`: it builds oculus, copies the demo hub into a scratch folder with a scratch HOME, starts the server, takes the Focus page, the Projects board and the Explorer in a hidden Electron window, and writes `docs/images/focus.png`, `projects-board.png` and `explorer.png` as a whole set. The three tree-check files moved to `utils/tree/`. `README.md` shows the board under "Why a researcher would use it", the Explorer under "Why a software engineer would use it" and the Focus page under "What it shows", each with alt text, and says how to take them again.
- Fixes at landing: `freshManifests` in `utils/shots/hub.mjs` sets every `project.yml` of the copy to the run's time, so the Focus page shows no "manifests behind their documents" line (F1 of the review over round 2); `agents/spec.md` names `utils/tree/folder-check.sh` and `tests/checks/tree/size.test.ts:30-31`; the fixes of the first look (the research hub's theme, the Explorer's left pane at 0.3, `status_bar.quiet` with `bell` and `blame` hidden) were carried into round 2 as `agents/reviews/O193-landing-fixes.patch`.
- Verification in the gate at main's head 071eb592b with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick`: `14 changed file(s)`, `12 test file(s)`; prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (595 files, 0 errors, 0 warnings) and vitest checks ok; `test:quick: 313.5 s; every command passed`. Main's staged diff, the PNGs included, equals the gate's. Not covered: tests that reach no changed file within the import depth, the build and the lint of unchanged files.
- Look: `npm run docs:shots` in the gate, exit 0, the scratch folder gone after it. Focus: the Command center, Tasks, Awaiting a response and the Funding and Now lanes in view, no "manifests behind" line, no error box. Board: the pillar tag stops at its card's edge. Explorer: main.tex beside its PDF, the left pane at 0.3. Status bar on all three: demo, main, the counts, no cluster, up. Only the demo hub's made-up data. The day-dependent parts are the demo hub's dated rows (the overdue and days-ago counts, the follow-up due), which move by one each day.
- Axel approved the three screenshots (2026-11-26: "Yes I approve them").

## Found

- First review: B1, B2, B3, T1 and T2 sent in repair round 1 and closed there; S1, S2 and P1 not sent.
- Review over round 1: P-R1 recorded; B-R1 and B-R2 fixed at landing.
- Review over round 2: F1 fixed at landing; F2 checked at the look; F3 accepted.
- The builder's first report did not pass its bar.

## Agents

- Builder a204168451b37a205 (claude-opus-5-5): 167790 tokens, 195 tool uses, 2391 s; round 1 226845 tokens, 43 tool uses, 525 s; round 2 325093 tokens, 55 tool uses, 514 s.
- Brief check ac32c8c7d99fe4d01 (claude-opus-5-5): 209538 tokens, 57 tool uses, 627 s.
- Reviewer af103e2f15603e431 (claude-opus-5-5): 268285 tokens, 110 tool uses, 1128 s.
- Reviewer over round 1 ab8a03aa7a028303f (claude-opus-5-5): 193688 tokens, 61 tool uses, 623 s.
- Reviewer over round 2 a5b0ce761f8719e2b (claude-opus-5-5): 234536 tokens, 61 tool uses, 646 s.
