# O170 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O170.md` and the ruling `agents/briefs/O170-cases.md` stay in force. The review is `.scratch/migration/agents/reviews/O170-refuter.md`, also in the worktree's ledger at the same path. Every finding of the review is ruled below, except Standards S2, which is not sent: `tests/routes/hubs/hub-writes.test.ts` carries `// @module-tag slow`, and the report quotes the file run alone, as the rules file asks of a slow test.

## 1. The test file over the size line (Standards S1, Proof P1)

`tests/routes/hubs/hub-writes.test.ts` is 890 lines and the rules file's line is 880. Split it by concern: `describe('a deck write to the second hub')` and its helper `twoDeckHubs` go to a new file `tests/routes/hubs/hub-deck-writes.test.ts`, which carries the `// @module-tag slow` line and a head comment of its own in the file's style. The titles do not change. A helper both files need is not copied: it moves to a fixture file beside them that both import. `hub-writes.test.ts` then ends at or under 880 lines. Grep `agents/guarded.md` in the worktree's ledger for the moved titles and give any `Test:` line that names the old file under "Doc text". Both paths are added to the step's write list, with the fixture file if one is made.

The report's row "Size limits" then states what `wc -l` prints.

## 2. The shared empty line (Proof P2)

`SAID_NOTHING` at `src/lib/views/academic/present/acts/acts.svelte.ts:58` is `Object.freeze`d, as `NO_SETTLE` in `writes.svelte.ts` is. The identity comparison at `:73` stays.

## 3. A short comment line (Standards S3)

The head comment of `src/lib/views/academic/present/Bar.svelte` is rewrapped as a whole paragraph at 100 columns.

## 4. An export nothing imports (Standards S4)

`Unwritten` in `src/lib/state/client/shapes/unwritten.ts:14` loses its `export`. `createUnwritten` keeps its return type.

## 5. The report (Standards S5, S6, S7)

The final report holds what the first one lacked:

- S5: the grep of `src` and `tests` made before writing each of `configuredSources`, `leastOf`, `sayFor`, `createUnwritten`, `nextRead`, `nextBuild` and `Candidate`, for its name and its key call, each hit judged.
- S6: for the saved key `listed` and the wire keys `build` and `read`, what the code does when each is empty, duplicated and colliding with a configured or reserved key. A saved `listed: []` is named, with what is drawn from the first paint until the listing answers.
- S7: "Every edit to an existing test" is a table with one row per changed line, made from a `diff` of each changed test file, with the line before and after.

## Verify

Scoped tests while you work. Then, once after the last change, the brief's "Verify before you report" in full; a failed command is rerun alone and then the full list runs once more. The report states the number of full-list runs, the results of the cases again through the real code where a run reaches them, and G152's replacement lines with any `Test:` line item 1 changes as "Doc text".
