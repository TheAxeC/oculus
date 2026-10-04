# T2b: the deletion sweep of `tests/server/`

Rules: `tools/oculus/.scratch/migration/agents/spec.md`, and `agents/guarded.md` beside it, which is the list of the only tests that may exist. This step deletes; it writes nothing else.

## What is on the tree (main at the preparation commit)

- Your folders hold 139 test files, 161 `.ts` files, 47,452 lines, 27 files tagged slow (`find <folders> -name '*.test.ts' | wc -l`; the same with `-name '*.ts'`, the lines by `cat | wc -l`; tagged files by `grep -rl '@module-tag slow'`).
- `agents/guarded.md` lists G1 to G27. G16 to G27 name their test already. G1 to G15 name none yet.
- `vite.config.ts:57` and `:66` include every `tests/**/*.test.ts`; `:65` names `tests/ui/frame/client-runtime.ts`. `utils/diagrams/source.mjs:12` and `:15` read `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.ts`.
- Three other sweeps run at the same time over the other test folders. Files in other folders import some helpers in yours.
- No ADR folder exists, so no ADR touches the step.

## What to build

1. For each entry of `agents/guarded.md`, look in your folders for the one test that holds it: the test whose failure would mean that guarantee is broken. Read; do not run anything. When your folders hold several, keep the one closest to the guarantee as written. When they hold none, write "none in my folders" for that entry.
2. In a file that holds a kept test, delete every other test, describe block and table row; keep the rows of a kept table that give different outcomes for the entry.
3. Delete every other test file in your folders, slow-tagged files included.
4. Delete a helper file (a `.ts` file that is not a test) in your folders when nothing kept in your folders imports it and no file outside your folders imports it (`grep -rl` over `tests/` and `utils/`). Keep it otherwise.
5. Deletion only. No folding, retitling, moving, tagging, rewriting or new test, no edit of an assertion, no new file other than your report. An import line, a helper function or a comment line that names only what you deleted is deleted with it.
6. Run no test, no verify list, no build and no git command. The landing runs the verify list once on main.

## Cases

- A test file in your folders whose tests hold no entry: deleted whole.
- A slow-tagged test that holds no entry: deleted.
- A file with one test that holds an entry and nine that do not: the one stays, the nine go, and so do the imports only the nine used.
- A helper imported by a file outside your folders: kept.
- `tests/ui/frame/client-runtime.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/imports/order.ts`: kept, wherever they fall.

## Paths this step writes

- `tools/oculus/tests/server/`
- `tools/oculus/.scratch/migration/agents/reviews/T2b-report.md`

## Decisions taken in this brief

1. The test named for an entry is chosen by reading, not by running (Z399). Two sweeps that each name a test for the same entry are settled at landing, keeping one.

## Libraries checked

The step adds no dependency.

## Report

Write `agents/reviews/T2b-report.md` in the worktree's ledger. First line: anything not done, or "Everything in the brief is done". Then:

1. One line per entry G1 to G27: the file and the test title kept for it, or "none in my folders".
2. The counts of your folders before and after: test files, `.ts` files, lines, and `it(` or `test(` calls.
3. The helpers kept because a file outside your folders imports them, each with that importer.
4. Every change that is not a deletion, which should be none.

Folders: server.
