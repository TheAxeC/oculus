# T2b: the deletion sweep of `tests/server/`

Rules: `tools/oculus/.scratch/migration/agents/spec.md`, and `agents/guarded.md` beside it, which is the list of the only tests that may exist. This step deletes; it writes nothing else.

## What is on the tree (main at the preparation commit)

- Your folders hold 139 test files, 161 `.ts` files, 47,452 lines, 27 files tagged slow (from `tools/oculus`: `find tests/server -name '*.test.ts' | wc -l`; the same with `-name '*.ts'`; the lines by `find ... -name '*.ts' -exec cat {} + | wc -l`; the tagged files by `grep -rl '@module-tag slow'`).
- `agents/guarded.md` lists G1 to G32. G16 to G27 name their test already; the others name none yet. G31's tests for the workspaces file, the session overrides file and the saved layout are written later by step Q117; keep only an existing case of G31 for the saved commands or the approvals file.
- `vite.config.ts:57` and `:66` include every `tests/**/*.test.ts`; `:65` names `tests/ui/frame/client-runtime.ts`. `utils/diagrams/source.mjs:12` and `:15` read `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.ts`.
- `tests/checks/tree/allow-duplication.txt` is read by the G21 check; each of its lines names two files. The three other sweeps run at the same time and delete lines of it too.
- Three other sweeps run at the same time over the other test folders. Files in other folders import some helpers in yours.
- The shell is zsh: an unquoted variable is not split into words.
- No ADR folder exists, so no ADR touches the step.

## What to build

1. For each entry of `agents/guarded.md`, look in your folders for the tests that hold it: a test whose failure would mean that guarantee is broken for one unit. An entry keeps one test per unit it covers: each API route, write kind, config reader, parser, client store or other file its text and its Code line name, and each part where its text names several behaviours. A table that covers a unit keeps one row per input that gives a different outcome. Read; do not run anything. When your folders hold several tests for one unit, keep the one closest to the entry as written. When they hold none, write "none in my folders" for that entry.
2. In a file that holds a kept test, delete every other test, describe block and table row; keep the rows of a kept table that give different outcomes for the entry.
3. Delete every other test file in your folders, slow-tagged files included. Leave the slow tags of kept tests as they are.
4. Delete a helper file (a `.ts` file that is not a test) in your folders when nothing kept in your folders imports it and no file outside your folders imports it (`grep -rl` over `tests/`, `utils/`, `src/`, `bin/`, `vite.config.ts` and `package.json`). Keep it otherwise. Inside a kept helper, delete the exports nothing imports any more.
5. Never delete a file that is not a test or a test helper: a script under `utils/` or anywhere else, and a hand-run probe such as a `*.probe.ts` file, stay.
6. Delete each file by its explicit path. Never pass a list of paths to `rm` through a shell variable. Before each `rm`, print the paths it will remove and check that no kept file is among them.
7. Comments: in your folders, delete the words, clauses or sentences of a comment that name or describe a test or a case you deleted, and add no word. A comment that names only deleted things is deleted whole.
8. `tests/checks/tree/allow-duplication.txt`: delete each line that names a file you deleted. Change no other line.
9. Deletion only. No folding, retitling, moving, tagging, rewriting or new test, no edit of an assertion, no new file other than your report. An import line or a helper function that names only what you deleted is deleted with it.
10. Run no test, no verify list, no build and no git command. The landing runs the verify list once on main.

## Cases

- A test file in your folders whose tests hold no entry: deleted whole.
- A slow-tagged test that holds no entry: deleted.
- An entry that covers 32 routes, with a test for 20 of them in your folders: 20 tests kept, one per route; the routes with none are reported as "none in my folders".
- A unit with three tests of the same outcome: one kept. A table of eight rows where five give the same outcome as another row: the three distinct rows kept, the five deleted.
- A file with one test that holds an entry and nine that do not: the one stays, the nine go, and so do the imports only the nine used.
- A helper imported by a file outside your folders: kept.
- `tests/ui/frame/client-runtime.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/imports/order.ts`: kept, wherever they fall.
- A head comment that says "the first describe reads X; the second reads Y", the second deleted: "the first describe reads X" stays and the clause about Y goes.
- A line of `allow-duplication.txt` naming a deleted file: deleted. A line naming two kept files: unchanged.
- A script under `utils/` whose only test you deleted: the script stays.
- Tests in your folders that hold the widened entries, found by reading the tree before this brief; read each and keep it when it holds its part:
  - G8, the stale base: `tests/server/edit/config-value.test.ts`, "refuses a base the file no longer holds, with the sentence that it changed since it was read".
  - G10, Replace: `tests/server/files/ops-paste.test.ts`, cases 16 and 22 (a replaced item goes to the Trash first; nothing moves when the Trash fails).
  - G28, the server half: `tests/server/machine/pty/channel.test.ts`, "stops the delivery and leaves the tmux session alone".
  - G30: `tests/server/git/deposit.test.ts`, "finds a secret and refuses the commit while it stands".
  - G31: `tests/server/machine/approvals/approvals.test.ts`, the case where a save over a file that does not read is refused, when it has one.

## Paths this step writes

- `tools/oculus/tests/server/`
- `tools/oculus/tests/checks/tree/allow-duplication.txt` (the lines naming a file this step deletes)
- `tools/oculus/.scratch/migration/agents/reviews/T2b-report.md`

## Decisions taken in this brief

1. The test named for an entry is chosen by reading, not by running (Z399). Two sweeps that each name a test for the same part of an entry are settled at landing, keeping one.

## Libraries checked

The step adds no dependency.

## Report

Write `agents/reviews/T2b-report.md` in the worktree's ledger. First line: anything not done, or "Everything in the brief is done". Then:

1. Per entry G1 to G32: each unit or part, with the file and the test title kept for it, or "none in my folders".
2. The counts of your folders before and after: test files, `.ts` files, lines, and the number of test cases (`it(` and `test(` calls, an `.each` table counted by its rows).
3. The helpers kept because a file outside your folders imports them, each with that importer.
4. Every change that is not a deletion, which should be none.

Folders: server.

## plan.md lines in full (each line of plan.md shortened to the 400-character rule, whole, under the P number its short line ends with)
- P274 (under: - ✅ T2b the deletion sweep of `tests/server/` under `agents/): - Booked 2026-10-04: the deletion sweep of `tests/server/` landed from base 753131ee6, /spec, built deletion only with round 1 putting back the files of G6 and G33 to G35 (Z413) and round 2 keeping one case of `tmux.test.ts` for `tmux.ts` (Z414), no brief check (Z401), no reviewer (Z402), counts reported to the user before landing (Z408), /land: 139 test files, 161 files and 47,452 lines before, 38 test files, 48 files and 4,474 lines after, 2,150 `it`/`test` calls before and 98 after (`find tests/server -name '*.test.ts'`, `find tests/server -type f -exec cat {} + | wc -l` and `grep -rhoE '\b(it|test)(\.each)?\(' tests/server | wc -l`, on main after the fixes, against `git archive 753131ee6`); kept tests per entry in `agents/reviews/T2b-report.md`, named under G1 to G4, G7 to G11, G28, G30, G31 and G33 to G35 in `agents/guarded.md`. The first report did not pass its bar: it missed the `tmux.ts` unit (round 2), and its cuts left five defects the verify list found. Six fixes at landing: the conflict in `tests/checks/tree/allow-duplication.txt` resolved to the lines both sides kept plus main's entry 90416d85f4a4; `tests/server/edit/deck-edit.test.ts` held five lines of the deleted constant `NEITHER` without its head and did not parse (npm test failed), deleted; `allow-duplication.txt` entries 7c6b62f0e236 and b9e79a8b99aa named clones the cuts ended ('holds the lists to clones that are still shared'), deleted; `tests/server/machine/pty/channel.test.ts` kept `instanceof Error` branches over `list` and `cursor` that nothing can set to an Error any more (svelte-check, 2 errors), the branches and the `string | Error` annotations deleted, and its four never-reassigned `let` made `const` (prefer-const), which the round-1 message had said to leave as `let`; `tests/server/files/ops-fixture.ts` reformatted by prettier (format:check); `remove` in `tests/server/files/ops.test.ts` and the `overrides` import in `tests/server/sessions/overrides.test.ts` left unused, deleted (lint). Verify list on main from `tools/oculus`: npm test 114 files passed, 19 skipped, 1837 tests passed, 183 skipped; test:checks 30 files passed, 2 skipped, 412 tests passed, 33 skipped; check 2835 files, 0 errors, 0 warnings; `checks: 7 commands passed`. No look (tests only), no A/B (no `bench:`). Usage: builder claude-sonnet-5-5 296,409 tokens, 188 tool uses, 28.6 min, round 1 306,466 tokens, 105 tool uses, 18.9 min, round 2 292,468 tokens, 6 tool uses, 1.0 min.
