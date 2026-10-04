# T2a: the deletion sweep of `tests/state/`

Rules: `tools/oculus/.scratch/migration/agents/spec.md`, and `agents/guarded.md` beside it, which is the list of the only tests that may exist. This step deletes; it writes nothing else.

## What is on the tree (main at the preparation commit)

- Your folders hold 206 test files, 226 `.ts` files, 58,446 lines, 2 files tagged slow (from `tools/oculus`: `find tests/state -name '*.test.ts' | wc -l`; the same with `-name '*.ts'`; the lines by `find ... -name '*.ts' -exec cat {} + | wc -l`; the tagged files by `grep -rl '@module-tag slow'`).
- `agents/guarded.md` lists G1 to G31. G16 to G27 name their test already; the others name none yet. G31's tests for the workspaces file, the session overrides file and the saved layout are written later by step Q117; keep only an existing case of G31 for the saved commands or the approvals file.
- `vite.config.ts:57` and `:66` include every `tests/**/*.test.ts`; `:65` names `tests/ui/frame/client-runtime.ts`. `utils/diagrams/source.mjs:12` and `:15` read `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.ts`.
- `tests/checks/tree/allow-duplication.txt` is read by the G21 check; each of its lines names two files. The three other sweeps run at the same time and delete lines of it too.
- Three other sweeps run at the same time over the other test folders. Files in other folders import some helpers in yours.
- The shell is zsh: an unquoted variable is not split into words.
- No ADR folder exists, so no ADR touches the step.

## What to build

1. For each entry of `agents/guarded.md`, look in your folders for the test that holds it: the test whose failure would mean that guarantee is broken. An entry whose text names several parts (several kinds, files or behaviours) keeps one test per part. Read; do not run anything. When your folders hold several tests for one part, keep the one closest to the entry as written. When they hold none, write "none in my folders" for that entry.
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
- A file with one test that holds an entry and nine that do not: the one stays, the nine go, and so do the imports only the nine used.
- A helper imported by a file outside your folders: kept.
- `tests/ui/frame/client-runtime.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/checks/imports/order.ts`: kept, wherever they fall.
- A head comment that says "the first describe reads X; the second reads Y", the second deleted: "the first describe reads X" stays and the clause about Y goes.
- A line of `allow-duplication.txt` naming a deleted file: deleted. A line naming two kept files: unchanged.
- A script under `utils/` whose only test you deleted: the script stays.
- Tests in your folders that hold the widened entries, found by reading the tree before this brief; read each and keep it when it holds its part:
  - G28: `tests/state/forms/form-drafts.test.ts` and `tests/state/forms/manifest-draft.test.ts` (an edit kept across a tab switch and a reload, a draft registered with the close question), `tests/state/sessions/source.test.ts` ("is unsaved once the reader types, which is what closing it asks about"), `tests/state/sources/repositories/diff/comment-draft.client.test.ts` ("closes keeping the text, and drops the text on Cancel"), `tests/state/client/terminal/terminal-close.test.ts` (the busy read a close asks first; a move, a split or a reload ends no terminal).
  - G29: `tests/state/workbench/layout/saved/layout-saved.test.ts`, "migrates every page, and reads which one was current".

## Paths this step writes

- `tools/oculus/tests/state/`
- `tools/oculus/tests/checks/tree/allow-duplication.txt` (the lines naming a file this step deletes)
- `tools/oculus/.scratch/migration/agents/reviews/T2a-report.md`

## Decisions taken in this brief

1. The test named for an entry is chosen by reading, not by running (Z399). Two sweeps that each name a test for the same part of an entry are settled at landing, keeping one.

## Libraries checked

The step adds no dependency.

## Report

Write `agents/reviews/T2a-report.md` in the worktree's ledger. First line: anything not done, or "Everything in the brief is done". Then:

1. One line per entry G1 to G31, one per part where the entry names several: the file and the test title kept for it, or "none in my folders".
2. The counts of your folders before and after: test files, `.ts` files, lines, and the number of test cases (`it(` and `test(` calls, an `.each` table counted by its rows).
3. The helpers kept because a file outside your folders imports them, each with that importer.
4. Every change that is not a deletion, which should be none.

Folders: state.
