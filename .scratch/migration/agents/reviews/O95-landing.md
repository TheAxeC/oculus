# O95 landing

Position: the cockpit-to-oculus migration, step O95 (Focus, what a press opens) landed. Next: O98 is building; O99 waits for O98, then O97.

## Open items

None.

## Check of Steps 1

The runner's agent listing shows no agent of O95 left: only O98's builder a8cc0514e57924553 runs.

## NOT DONE

- The look did not open a "Waiting on" person's board, the Blocked board, the palette's Awaiting view or a command center deadline line; the round report's "Before and after" covers them, and the rows of G124 cover the boards' contents.

## What landed

The whole range from base 046e0debc (one wip commit 1848d5dda of the builder's work, its round-0 ruling and its repair round 1), 28 paths, 1704 insertions and 1094 deletions:

- Every name of Focus's Awaiting box a button: an application or a grant opens its entry's page; a venue, a person or project waited on and Blocked each open a transient board of the projects counted.
- A name counts its distinct projects (ruling 513 (a)): a project naming one person twice reads "Maryam", where it read "Maryam (2)", and the box's hidden count counts it once. Two awaited entries of one title read "Title, Title", two buttons.
- A command center line, a Tasks line (a funding scheme's subtask line included) and a band card's title naming a collection entry open the entry's page; a line naming no entry opens its collection as before.
- `docs/HELP.md:294`, the `docs/palette.md` row `| Awaiting | awaiting_board |`, `flaggedEntries` removed from `src/lib/data/helpers/hub-names.ts`, G124's rows in `tests/state/boards/board/board-new-project.test.ts`.

## Checks

In the gate worktree at main's head 01bb90248, `git cherry-pick -n 046e0debc..migration-O95` applied with no conflict. `npm run diagrams && npm run docs:palette && npm run test:quick` there, twice: 28 changed files, 158 test files; prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (0 errors, 0 warnings) and vitest checks ok in both runs; vitest and vitest slow failed only by timeouts (11 tests in each run, a different set each time, none in a file O95 changes) under a load average of 10 to 14 from O98's builder and the 8790 server; each of those test files run alone with the configured timeouts passed (8 files, 170 tests; 4 files, 99 of 99, and `tests/routes/edit/config-key.test.ts` 14 of 14); the diagrams and the palette page unchanged.

On main the same range was cherry-picked with the two fixed files copied over, and `git diff --cached --binary` of main and the gate compared under `cmp`: same.

## The look, on 8790

- Focus, the Awaiting box: Waiting on, Under review, Applications and Grants drawn as buttons.
- "BSPC": the tab "Under review: BSPC", 1 project (ECG-Repr).
- "NWO Veni - The Self-Explaining Hospital": its entry's page.
- The Funding band card "FWO Senior Postdoctoral Fellowship 2026": its entry's page.
- The Tasks subtask line of "MSc supervision - Statistics & Data Science (2026-2027)": its entry's page.
- The tabs opened were closed after.

## Found

- First review: S1 (raised as open item 523, ruled (a): the case-run program's output is not used), S2, P1, T1, T2, B1, B2, B3 and B4, closed in repair round 1 or by ruling 523 (a).
- Review over round 1: Standards 1 fixed at landing (the `registerBoards` comment of `src/routes/views.ts` and the `waiting` comment of `src/lib/state/boards/focus.ts` refilled to 100 columns, no word changed); Proof 1, Behaviour 1 and Behaviour 2 closed in the booking and the look.

## Agents

- Builder a8009799d26d93fad (claude-opus-5-5): round 0 hand-back 270291 tokens, 64 tool uses, 8 min 52 s; build after the round-0 ruling 260477 tokens, 226 tool uses, 42 min 32 s; round 1 289522 tokens, 38 tool uses, 6 min 16 s. The first report did not pass its bar (seven findings sent back). Fixes at landing: the two comment refills.
- Brief check ac93e98b3cfcb9328 (claude-opus-5-5): 208248 tokens, 66 tool uses, 9 min 2 s.
- Reviewer a2941302c62abd230 (claude-opus-5-5): tokens not read, 82 tool uses, 20 min 42 s.
- Reviewer over round 1 a93342c9c8025f2d6 (claude-opus-5-5): 193784 tokens, 49 tool uses, 7 min 48 s.

## Next

O98's report, its review, its rounds and its landing with its look on 8790; then `/spec migration O99`, then O97.
