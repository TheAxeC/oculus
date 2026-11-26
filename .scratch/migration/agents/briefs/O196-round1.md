Read `.scratch/migration/agents/spec.md` whole first (the rules file), then `agents/briefs/O196.md` (the step's brief), then `agents/reviews/O196-refuter.md` (the review this round answers), then `agents/reviews/O196-report.md` (the report you rewrite).

# O196, repair round 1

The step's work is in the worktree `.agents/worktrees/migration-O196` at base `c4dae5477`; the base copy is `.agents/worktrees/migration-O196-base/`. Every change of the round stays inside the step's part. Do each item, then the last round of checks once, then rewrite the report.

## How you run tests (spec.md, restated)

- While working, run a test file only when it covers a file you just changed. Never run the brief's list, or any wide list, before the last round.
- Vitest runs with `TMPDIR` unset, at `nice -n 10`, at most 4 workers, dot reporter, one command at a time, in the foreground.
- After your last change, run the last round once: the brief's item 1 test files plus `tests/state/system/settings/fold.test.ts` and `tests/state/workbench/options-pages.test.ts`, then prettier, eslint and the ASCII gate over the changed files, `npm run check`, and `sh utils/unused-exports.sh` diffed against `../migration-O196-base/unused-exports.txt`. Run it again only for a red file the step changed, once, after fixing it. No edit after the last round: if one is needed, the edited file's checks run once more and the report says so.
- Never `npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, `npm run docs:shots`, or `npx vitest run` with no file.
- Case-run files live under `.agents/scratch/O196/` inside the worktree and are removed before the report.

## What to change

1. (Behaviour 1) An edit back to the file's value while its Save is out is the reader's newer word, and it is kept, as item 1 of the brief keeps every edit made while a Save is out. Today the Editor ends the draft and the writer drops the change (`Editor.svelte:177-180`, `writer.ts:100`), so `saveFile` (`scopes.svelte.ts:203-211`) finds nothing to hold again, and the Save writes the earlier edit while the bar reads 'No unsaved change'. After the round:
   - Sequence: scout's `stale_days` 7 to 8, Save pressed, set back to 7 while the Save is out, the Save lands (the file now holds 8). End state: the row holds a change to 7, the bar reads '1 unsaved change', Save is on, and the editor draws 'Changed and not saved yet' and no stale sentence. A second Save writes 7.
   - The same holds for a top-level row (a number or text row of the row writer, `scopes/write.ts`) edited back to the file's value while its Save is out: the row holds a change back to the value it had before the first edit.
   - A row edited back while out is not told to the writer as written (`writtenSlots`), as a row edited again is not.
   - A Discard while the Save is out stays a Discard: the reader asked to drop the change, and nothing is held after the answer. Tell it apart from an edit back by how the change left the stage, not by its value.
   - Where: `scopes.svelte.ts` and whatever the writer or the stage needs to say that a change was withdrawn by an edit rather than discarded. The value to hold is the one the row held before the Save's change (a family change carries it as `base` when written whole; a top-level row's change needs its own record of it).
   - A row of the scopes table under G96 (`tests/views/system/workbench/scopes.client.test.ts`) for the family sequence, and one for a top-level row, each failing on the unchanged tree (the base copy) on an assertion about the held change, plus a row for the Discard while out (a test of preserved behaviour, passing on the base copy). Quote each run on the base copy before the code changes. The top-level row's behaviour was read, not run, by the orchestrator: if its run on the base copy already holds the change back, that row is a test of preserved behaviour, the code for top-level rows is left as it is, and the report says so.
2. (Standards 1) Rewrap the two 101-column doc comments to at most 100 columns: `src/lib/state/system/config/editors/writer.ts:56` and `tests/views/system/workbench/scopes.client.test.ts:221`. Then `awk 'length > 100'` over every changed file prints only the lines that were over 100 on the base (unbreakable strings or imports), each named in the report.
3. (Standards 3) The doc comment of `ScopesDeps.wrote` (`scopes.svelte.ts:56`) says that a row changed again, or edited back, while the Save was out is left out.
4. (Standards 2) The doc comment of `slotHub` (`scopes.svelte.ts:236-244`) names the three places that set `row.slot` and that it must agree with: `localRows` in `src/lib/state/system/config/rows.ts` (`slot` unless primary), `repoRow` in the same file (`slot: root`), and `withHubs` in `src/lib/state/system/config/view/hub-settings.svelte.ts` (`slot: of.hub`).
5. Nothing else in the code changes.

## The report

Rewrite `.scratch/migration/agents/reviews/O196-report.md` whole for the state after this round. Copy the open items from the state file at the moment you write it. Keep the first build's runs as they are and add this round's: the base-copy runs of item 1's rows, the last round's lines, and the before and after for the look of item 1's sequence (Settings, scope Primary hub, the brief's two rows). Give the titles of the new G96 rows. State how many times each test command ran, with its file count.

## Paths this round writes

- `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts`
- `src/lib/state/system/config/editors/writer.ts`
- `src/lib/state/system/config/scopes/write.ts`
- `src/lib/state/system/config/scopes/changes.ts`
- `src/lib/views/system/workbench/Settings.svelte`
- `src/lib/views/system/workbench/editors/Editor.svelte`
- `tests/views/system/workbench/scopes.client.test.ts`
- `.agents/scratch/O196/` (removed before the report)
- `.scratch/migration/agents/reviews/O196-report.md`
