# Q35 landing report

Position: oculus/migration, step Q35 (Changes, Customizations, Audit, Present) landed. In flight: L4 (round review), D35 (review), Q66 (ready to land), M4 (round 1 to send), X3a and D24 (building). Next: send M4's round 1, then /land Q66.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

Q35's builders (a4808d97d811f004d, then the continuation a7e830c8a488197ee) and both reviewers (a20db24a8714e7263, ab7c2138359bae05d) had finished before the landing. `ListAgents` lists four subagents running: acf8c525dec67af39 (X3a), aad5c8302bdcacd63 (D24), a1fc727999ec8d0d1 (D35's reviewer) and af927a2e2e0450a91 (L4's round reviewer). None of them is Q35's.

## NOT DONE

Nothing in the brief.

## What landed

- Changes: `elide`, `PATH_MAX` and `sessions.ch_elide` are removed. Each path is drawn whole on one line, cut at its end. The verb and count columns are aligned by a grid with subgrid in `ChangesTouched.svelte` and `ChangeGroups.svelte`.
- Customizations: a listed item carries the real path of its file, so the roots boundary decides where it opens. `customizationFile` follows the asked path to its real file before comparing it with the listing.
- Audit: findings are drawn as a list of rows (scope, message, place, the mute control on hover). Rows are keyed `${finding.signature}:${index}`.
- Present: the deck fills its pane in a 1280 by 720 frame, scaled and letterboxed. The slide is laid out for that frame, with a slide type scale, 64 px padding and reading widths in frame px. A slide taller than the frame scrolls inside it, and `jump.ts` divides by the frame's scale.
- Docs: `DESIGN.md` and `HELP.md` describe the new behaviour.

On main: 38 files, 870 insertions and 334 deletions, with the fixes at landing (`git diff --cached --shortstat` before the commit).

## Premise correction

The brief said `Repo.svelte`'s `.path` gains the three cut rules. The base already held them (`git show b89702b9:tools/oculus/src/lib/views/sources/repositories/Repo.svelte`, lines 291-299), so no change was needed there.

## Fixes at landing

1. `land.sh` stopped on a conflict in the worktree's cherry-pick, in four diagram files (`layer-views` and `layers`, `.dot` and `.svg`). They were taken from the step's side and regenerated with `npm run diagrams`, then the cherry-pick was continued and the range staged on main with `git cherry-pick -n main..Q35-land`.
2. A merge fix: Q85d's three cases "the pane state the view reads" in `tests/views/system/audit.test.ts` called `cards()`, which Q35 renamed `rows()`. On main they failed with `ReferenceError: cards is not defined`. They now call `rows()`.
3. Proof P1 of the run over round 1: a test in `tests/server/sessions/stores/customizations.test.ts`, "serves nothing for a link the listing does not give whose target it does not hold". It was red against a `customizationFile` that serves any path (`AssertionError: expected '# other' to be null`) and green with the code as landed. The whole file now prints `Tests 32 passed (32)`.

## Verification on main

The commands ran from `tools/oculus` after the fixes. This was the third run of the list.

```
$ npm test
 Test Files  427 passed | 22 skipped (449)
      Tests  11211 passed | 621 skipped (11832)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2961 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The two earlier runs stopped at `npm test`, at a load average of 19 to 21.

- **First run:** 10 failures.
  - 3 of them were the merge fix above.
  - The rest were 5000 ms timeouts in `tests/server/edit/config-key.test.ts`, `tests/routes/edit/config-key.test.ts` and `tests/server/root/dev-server.test.ts`.
- **Second run:** 9 failures, all 5000 ms timeouts, in:
  - `tests/routes/edit/config-key.test.ts`;
  - `tests/routes/edit/undo-removed.test.ts`;
  - `tests/routes/edit/undo.test.ts`;
  - `tests/server/edit/config-key.test.ts`;
  - `tests/server/git/autofetch.test.ts`.

Q35 changes none of those files. Run alone, each passed: 14, 37, 36, 38 and 44 tests.

There was no A/B: the configuration has no `bench:` line.

## The look

Looked at on TEST (localhost:8790), with the dev server serving main's tree with Q35 staged:

- **Present:**
  - The title slide is letterboxed and centred in its pane.
  - Slide 3 (HCCNet) is laid out on the slide scale, with its equation image and figure.
  - The slide scrolls inside its frame to the pipeline figure and caption at its foot.
- **Audit:** the open-items row reads scope, message and place. The mute control shows on hover.
- **Changes** for the session "Step 9a rulings revert":
  - Each path is on one line, cut at its end with an ellipsis.
  - Verbs and counts sit in aligned columns, the count right-aligned in its column.
- `read_console_messages` with errors only reported none.

Not looked at:
- a Customizations row opened from a link;
- Audit with the arrow keys;
- the Present `#` link jump in a scaled frame;
- a narrow pane.

## Findings and their dispositions

Every finding of the first run was closed by repair round 1. Every finding of the run over round 1 was closed at landing, as `agents/reviews/Q35-refuter.md`'s Closed heading says:

- **S1:** the overlap with M4 on `Equation.svelte` is merged at M4's landing.
- **S2:** the premise above.
- **S3:** two linked rows that point at one file now share one viewer tab.
- **P1:** the test above.
- **P2 and P3:** stale counts. The reviewer's first-run figure is `Tests 17 failed | 184 passed (201)`.
- **P4:** as ruled.
- **B1:** these changes the report did not state:
  - Audit rows carry no row cursor, as before.
  - The Present frame is a scroll container.
  - The Touched columns use cell margins.

## Agents' usage

- **Brief check:** claude-sonnet-5-5, 283,148 tokens, 102 tool uses, 16.1 min.
- **Builder (claude-sonnet-5-5):**
  - first run of the cases: 260,277 tokens, 65 tool uses, 12.7 min;
  - continuation builder to the report: 219,390 tokens, 63 tool uses, 42.7 min (5 full-list runs);
  - repair round 1: 262,004 tokens, 33 tool uses, 45.9 min (4 full-list runs, the first three red on timeouts under load).
- **Reviewer, first run:** claude-sonnet-5-5, 190,538 tokens, 61 tool uses, 36.9 min. Findings: 3 Spec, 4 Proof, 1 Standards, 3 Behaviour.
- **Reviewer over round 1:** claude-sonnet-5-5, 207,483 tokens, 56 tool uses, 30.7 min. Findings: 3 Spec, 4 Proof, 0 Standards, 2 Behaviour, all closed at landing.

The builder's first report did not pass its bar: the review found 11 findings and a repair round was sent. There were three fixes at landing: the merge fix, the added test and the diagram regeneration.
