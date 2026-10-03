Everything in the brief is done.

## Open items of the state file (`orchestrator-state.md:148-154`, verbatim)

- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. It shows only while `tasks.skip_permissions` is on in `config/behavior.yml`. Axel allowed the edit for the look (2026-10-03); the Claude Code auto-mode classifier refused it again with his permission given, so the session cannot make it. Options: (a) Axel sets `skip_permissions: true` himself, the look is taken, and Axel sets it back (the session checks `git diff --exit-code -- tools/oculus/config/behavior.yml` after); (b) the point is dropped from the look. Recommendation: (a), one line each way and (b) is the lazy option.
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-03: 10 of 10 (X3a, A1, Q88c, M3, D18, D32, D14, S4, D17, Q91; `git log` of the landing commits), so Z251 is Axel's to rule now. Every one of the ten had a repair round, S4 and D17 two (`grep -c '^## Repair round' agents/reviews/<step>-refuter.md`); the runs over rounds kept finding real defects: D14's 18 numbered findings, D17's 16 and 12, Q91's an undo that dropped a note (B-R1-1).

## The cases' first run on the unchanged tree

The cases of item 1 are the four rows of the new test in `tests/state/system/lines.test.ts`; item 6's two assertions are the updated ones in `tests/views/system/status.test.ts`. Both were run in their final form on the tree before any source change.

`npx vitest run tests/state/system/lines.test.ts` (function missing), the four rows red:

```
 × sums every row under src and no row beside them 2ms
 × sums only a folder that is src or starts with src/ 0ms
 × gives null for rows with none under src and for no rows 0ms
 × gives zeros for a row under src that holds no files 0ms
TypeError: underSource is not a function
 Tests  4 failed | 75 passed (79)
```

`npx vitest run tests/views/system/status.test.ts` (updated assertions, unchanged `LineCounts.svelte`):

```
 × draws one row per folder with its languages under it, the src/ sum above the first folder under src, and the total last
 × keeps the last table under the sentence when a later count failed
AssertionError: expected [ ...(6) ] to deeply equal [ ...(7) ]
AssertionError: expected [ ...(6) ] to have a length of 7 but got 6
 Tests  2 failed | 9 passed (11)
```

Each case of the brief has a result under its rule after the change (second table below). No case gave a result the brief's rules get wrong: the ten `src` rows sum to 932 files (`find src -type f | wc -l` prints 932; per-folder `find` counts 6 + 1 + 66 + 181 + 38 + 207 + 5 + 101 + 289 + 38), `srcx` and `src-old` are left out, no row under `src` gives null, an empty list gives null, a zero-file row under `src` gives zeros, and `-` (0x2d) sorts before `/` (0x2f) so `src`, `src-old`, `src/lib/...` is the server's order. The real-tree figures were not taken from `countLines` (it runs git, which this step may not); the test's ten rows carry the brief's file counts with distinct per-field sums I chose.

Cases read, not run (no test, per the brief):

- No row under `src`: `drawn` (`LineCounts.svelte:63-67`) pushes the `src/` row only when `source !== null`, and `underSource` returns null when no row passes `isUnderSource`. No `src/` row is drawn.
- Keys: the `src/` row's key is `sum:src/` (`LineCounts.svelte:67`); folder keys start `folder:`, language keys `language:`, the total is `total`. A crafted folder `src/` has key `folder:src/`, which differs from `sum:src/`.
- A crafted `src-old` row: rows arrive `src`, `src-old`, `src/lib/...`; the `src/` row is pushed when the loop reaches the first row for which `isUnderSource` holds, which is `src`, so it sits before `src` and `src-old` stays between `src` and `src/lib/...`.

## DONE / NOT DONE

| Row | State | Proof |
|---|---|---|
| 1. `underSource` and `SOURCE_FOLDER` in `lines.svelte.ts`, head comment names the function | DONE | `src/lib/state/system/lines.svelte.ts:14-16` (head comment), `:95` (constant), `:98-100` (`isUnderSource`), `:103-114` (`underSource`); `npx vitest run tests/state/system/lines.test.ts tests/views/system/status.test.ts` prints `Tests  90 passed (90)` |
| 2. `drawn` adds the `src/` row (key `sum:src/`, folder kind, no languages, null gives none, total untouched), doc comment and head comment updated | DONE | `LineCounts.svelte:2-11` (head comment), `:56-80` (`drawn` and its doc comment, pushing the row at `:67`); the updated assertion in `status.test.ts` passes |
| 3. `lines_help` gains the sentence | DONE | `config/text/views/system/status.yml:27` ends "The src/ row sums every file under src/ at every depth, the rows beneath it included."; the scalar holds no `: `; the whole suite loads the catalog (`npm test` green) |
| 4. `HELP.md:137` | DONE | the row now ends "with a TODO count and one row for everything under `src/`." |
| 5. One table-driven test of item 1, head comment names it | DONE | `tests/state/system/lines.test.ts:1-5` (head comment), `:408-471` |
| 6. `status.test.ts` assertions updated, head comment | DONE | `tests/views/system/status.test.ts:1-5`, `:133` (`'src/|1|1|0|4|0|5'`), the length expectation now 7 |
| Verify 1: the plan's verify list | DONE | quoted below |
| Verify 2: both test files | DONE | `Test Files  2 passed (2)`, `Tests  90 passed (90)` |
| Verify 3: red before, green after, the `startsWith('src')` run | DONE | quoted below |

### Verify 1, the lines `checks.sh` printed (`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0, run after `npm run diagrams`)

```
$ npm test
 Test Files  569 passed | 26 skipped (595)
      Tests  13978 passed | 661 skipped (14639)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
$ npm run check
$ npm run build
.svelte-kit/output/server/entries/fallbacks/error.svelte.js    2.77 kB | gzip:   1.15 kB
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The spec's ASCII gate (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)`) printed nothing. `grep -n '[^ -~]' HELP.md` printed nothing.

### Verify 3, before and after

New test, before the change: the four-row run quoted above (`Tests  4 failed | 75 passed (79)`). After: `npx vitest run tests/state/system/lines.test.ts` prints `Tests  79 passed (79)`.

`isUnderSource` changed to `return folder.startsWith(SOURCE_FOLDER);` on a scratch edit, run on `lines.test.ts`:

```
 × sums every row under src and no row beside them 4ms
 × sums only a folder that is src or starts with src/ 0ms
 × gives null for rows with none under src and for no rows 0ms
AssertionError: expected { files: 934, blank: 1528, ...(3) } to strictly equal { files: 932, blank: 1524, ...(3) }
AssertionError: expected { files: 108, blank: 152, ...(3) } to strictly equal { files: 101, blank: 141, ...(3) }
```

Two more scratch edits of `underSource`, each run on `lines.test.ts` (the file was restored to the final form after each, `Tests  79 passed (79)`):

- `sum.blank += row.comment;` (a field swapped): `sums every row under src and no row beside them` and `sums only a folder that is src or starts with src/` fail (`Tests  2 failed | 77 passed (79)`).
- The sum starting as zeros instead of null (`let sum: LineTally | null = { files: 0, ... }`): `gives null for rows with none under src and for no rows` fails (`Tests  1 failed | 78 passed (79)`).

The view assertions, before the change (unchanged `LineCounts.svelte`, quoted above): `expected [ ...(6) ] to deeply equal [ ...(7) ]` and `expected [ ...(6) ] to have a length of 7 but got 6`. After: `npx vitest run tests/state/system/lines.test.ts tests/views/system/status.test.ts` prints `Tests  90 passed (90)`.

## Files with line counts (`wc -l` after the last change)

| File | Lines |
|---|---|
| `src/lib/state/system/lines.svelte.ts` | 168 |
| `src/lib/views/system/status/LineCounts.svelte` | 186 |
| `tests/state/system/lines.test.ts` | 471 |
| `tests/views/system/status.test.ts` | 209 |
| `config/text/views/system/status.yml` | 34 |
| `HELP.md` | 342 |

All are inside the brief's write list. `npm run diagrams` rewrote the files under `docs/diagrams/` (it ran before the full list, as the spec says); whether any of them differs from main is not verified, since I run no git command. My change adds no import edge between files that was not already there (`LineCounts.svelte` already imported from `lines.svelte`), so I expect no difference; the orchestrator's diff shows it.

## Tests added and removed

Added (one): `tests/state/system/lines.test.ts`, `describe('the sum of the rows under src/')`, one `it.each` of four rows guarding the sum behind the `src/` row of the Status view (a wrong count in a view Axel relies on): all ten real-tree rows summed with five distinct nonzero fields each and no row outside `src` counted; `srcx` and `src-old` left out beside `src/lib/ui`; null for rows with none under `src` and for an empty list (two inputs of one row); zeros, not null, for a `src` row with zero files. Each row fails under the scratch edits listed in verify 3 (prefix check, a swapped field, null versus zeros).

Removed: none. The view test keeps its existing cases; the `src/` row, its place, its sums and the unchanged total are covered by the updated assertion, and no test of the markup, the label or the help string was added.

## Edits to existing assertions

| Where | Before | After |
|---|---|---|
| `status.test.ts` `draws one row per folder ...` (title and rows list) | title `draws one row per folder with its languages under it, and the total last`; rows list went from `TypeScript|1|2|5|34|1|41` straight to `src/lib/x|1|1|0|4|0|5` | title `draws one row per folder with its languages under it, the src/ sum above the first folder under src, and the total last`; the row `src/|1|1|0|4|0|5` sits between them |
| `status.test.ts` `keeps the last table under the sentence ...` | `expect(rows(body)).toHaveLength(6)` | `toHaveLength(7)` |
| `status.test.ts` head comment | "Its line counts draw one row per folder with that folder's languages under it and the total last, ..." | adds that the src/ row sums everything under src and sits above the first folder under it |
| `lines.test.ts` head comment | store description only | one sentence added naming `underSource` |
| `lines.test.ts` imports | `import { COUNT } from ...line-counts.ts` and no `underSource` | adds `folder`, `tally`, `type Sums` from the helper file, and `underSource` from the store |

No threshold, allow list or predicate was loosened.

## Documents and comments re-read

- `lines.svelte.ts` head comment: rewritten (sentence naming `underSource` added); the remaining sentences are still true. `readCount`, `createLines` and their doc comments: still true.
- `LineCounts.svelte` head comment and `drawn` doc comment: rewritten. `row` doc comment: still true.
- `status.yml` `lines_help`: rewritten. `HELP.md:137`: rewritten.
- `README.md:5` (the line counts need Perl), `DESIGN.md` (no paragraph on the Status line count; `grep -n -i -e 'lines of code' -e 'line count' -e 'cloc' DESIGN.md` hits only unrelated lines): still true.
- `src/lib/server/machine/lines.ts` and `src/lib/data/model/index.ts` doc comments: unchanged and still true, since the server answer is unchanged.

## Grep of the names introduced

`grep -rn -e 'underSource' -e 'isUnderSource' -e 'SOURCE_FOLDER' src tests config HELP.md DESIGN.md README.md` hits only `lines.svelte.ts` (definitions), `LineCounts.svelte` (import and use) and `tests/state/system/lines.test.ts`. The key `sum:` has no other user; grep of `sum:` finds no existing key with that prefix in the view.

## Keys and asynchronous paths

- The key `sum:src/` is built once per draw. Empty: not possible (it is literal text). Duplicated: only one `src/` row is drawn per count (`sourceDrawn`). Colliding: folder keys start `folder:`, language keys `language:`, the total is `total`; a crafted folder named `src/` is `folder:src/`.
- No asynchronous path is added. `drawn` runs inside `$derived` over the count the store already holds, so a recount (in flight, after close, superseded) replaces the count and the `src/` row is derived from whichever count is held.

## Judgment calls the brief left open (each reversible)

1. `isUnderSource(folder)` is exported beside `underSource` and `SOURCE_FOLDER`. The view needs the same test to find the first row under `src`; one predicate used by both keeps a single definition of "under `src`". The brief named the function and the constant only.
2. The label and the key both use `${SOURCE_FOLDER}/` in `LineCounts.svelte:67`; I did not add a second constant for the label.
3. The test's null row carries two inputs (rows with none under `src`, and an empty list) and the test loops over a row's inputs, so the empty list is part of the null row as the brief says and is not a row of its own.

## User-visible change

View: Status, section Lines of code, after Count again has produced a count. Before: rows run top level (with its languages), then `src` (the six files directly in `src/` and `src/lib/`), `src/lib/assets`, ..., `src/routes`, then the total. After: one more row labelled `src/` sits directly above the `src` row, with files, blank, comment, code, TODO and lines columns equal to the sum of `src`, `src/lib/*` and `src/routes`, drawn as an ordinary (not bold) folder row with no languages under it; the total row is unchanged; the help line under the heading ends with "The src/ row sums every file under src/ at every depth, the rows beneath it included." The Status row of the Views table in `HELP.md` says the same.

## Anything in the brief that was wrong or impossible

Nothing found. The behaviours that need the page (the row's place among the real rows and its figures against the real count) are seen at the look on landing; the unit suite renders the view to a string and covers the row, its place, its sums and the total on the fixture.

## Libraries

None found that cover the work; no dependency added.
