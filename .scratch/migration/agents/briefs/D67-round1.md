# D67, repair round 1

The review is `agents/reviews/D67-refuter.md` (in the main checkout's ledger, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D67-refuter.md`). Every rule of the brief `agents/briefs/D67.md` and of `agents/spec.md` still holds. This is the step's one repair round: every item below is done in it, and none is handed back as a later item.

## Rulings, one per finding

1. **Behaviour 1, the undo of a root's bookmark answers `moved`.** Fix it where the mismatch starts (the reviewer's option (b); option (a), sending no `path` key from `bookmark-actions.ts`, is the narrower fix and leaves every other collection with the same mismatch). `createEntry` (`src/lib/server/edit/writes/entries.ts:470-482`) records as `after` the values the file holds after the write: a field the renderer drops for its empty value (`server/edit/entry-edit/render.ts:30`) is left out of the record, so `same(now.value, change.after)` (`undo.ts:299`) holds and the undo of adding a root's bookmark takes it out again. `bookmark-actions.ts` keeps sending `path: ''`.
2. **The undo of a rename of a collection entry answers `gone`** (the reviewer's "Declined to judge", reproduced for a file bookmark, so the defect is older than D67; it is in this round because HELP.md:292, which this step rewrote, says History undoes a rename, and case 4 renames a root's bookmark). The cause, read from the code: a write that changes an entry's identity field records each change under `key: value`, the identity before the write (`entries.ts:296-303`), and the undo finds the entry by that key (`valueNow`, `undo.ts:297-298`), which after the rename names no entry. Required: the undo of a rename, alone or with other fields in the same write, puts the file back as it was before the write, for a bookmark and for any other collection whose label is its identity; the undo of the undo renames it again. The change is in how a write's records are keyed or how the undo of a `field` record finds its entry, whichever keeps one rule; it changes no record already in a change log (no migration code: an old record of a rename still answers `gone`).
3. **Standards 1, `bookmarkPlace` copies `placeOf`.** One rule says a place: `placeOf` (`state/sources/explorer/view/reveal.ts:148-150`, the root alone for the empty path, else the catalog line `files.reveal_place`) is exported once and used by the Bookmarks section (`Bookmarks.svelte`), the rail hover (`shell/rail/rail.ts`, through the re-export in `state/workbench/navigation/rail.ts` the boundaries rule needs) and the reveal outcome; `bookmarkPlace` is removed. Its name and the module it lives in are yours to choose; the reveal's outcome lines read as before.
4. **Standards 2, HELP.md:28.** Rewrite the sentence so it says what a press does: a file bookmark opens the file in a tab, a folder or a root's bookmark shows its row in the Files view.
5. **Standards 3, `files.bookmark_missing_title`.** Reword the line (`config/text/views/sources/files.yml:14`) so it is true for a path that is gone and for a root this workspace does not serve, for example "The path is gone, or its root is not in this workspace".

## Tests

Items 1 and 2 change code under G9 (`agents/guarded.md`), so they are cases of G9's tests, added as rows of the tests G9 names, and no other test is written:

- `tests/server/core/changes.test.ts`, 'records a collection entry field, a new entry, a reorder and a deletion': a row for a new entry given an empty field (the record's `after` holds no such field) and a row for a rename (the record keyed so its undo finds the entry).
- `tests/routes/edit/undo/undo.test.ts`, 'takes a created entry out again and puts a deleted one back': a row for an entry created with an empty field, taken out again; 'puts a collection entry field and a feed field back': a row for a rename of an entry's identity, put back, and the undo of that undo.

Each new row is run on the unchanged code of this round first (the worktree as the first build left it) and its failure is quoted, then run after the fix and its pass quoted. Every other test of G9 named in `agents/guarded.md` that `npm test` runs is run after the fix and passes. The reviewer's undo probe result for a root's bookmark (`undo of add answers => {"error":"moved"}`) is reproduced first, by the new row, and after the fix answers `changed`.

## Paths this round adds to the brief's list

- `tools/oculus/src/lib/server/edit/writes/entries.ts`
- `tools/oculus/src/lib/server/edit/writes/undo.ts` (only if the rename's undo is fixed there)
- `tools/oculus/src/lib/server/core/changes.ts` (only if the rename's record shape changes there)
- `tools/oculus/src/lib/state/sources/explorer/view/reveal.ts`
- `tools/oculus/tests/server/core/changes.test.ts`
- `tools/oculus/tests/routes/edit/undo/undo.test.ts`

## Verify before you report

The brief's checks again, after the last change: `npm run test:quick`; `wc -l` and `sh utils/folder-check.sh`; `npx vitest run tests/views/shared/explorer/opening-apps.test.ts`; `sh utils/unused-exports.sh` against the base's list; and `npx vitest run tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts`.

## Report

Append a section "Repair round 1" to `tools/oculus/.scratch/migration/agents/reviews/D67-report.md` in the worktree: the first line anything NOT done or "Everything in the round is done"; one row per ruling 1 to 5 with the change and its evidence; each new test row's failing run before the fix and passing run after, quoted; the checks' output as printed; the edits to existing test files as a `diff` against the base copy, one row per changed line; every visible change with its before and after; limitations and sharp edges.
