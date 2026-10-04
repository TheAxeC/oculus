Everything in the brief and the G28 task is done. Nothing was run (no test, no verify list, no build, no git command). Items outside my write list that name deleted files, and the stale head comments, are in section 5.

## 1. Entries G1 to G27

Method: I read the candidate tests in `tests/state/` for each entry (grep for token, confirm, trash, local.yml, sanitiser, outside-root, finding, refus; then read the hits). The test of an entry is one whose failure would mean the harm the guarantee prevents reaches the user. The code of G1 to G15 is server or data code (`src/routes/api/`, `src/lib/server/`, `src/lib/data/`); the tests in `tests/state/` run client stores against a doubled `fetch`, so a failure of one of them cannot show a server regression. Two tests came closest on that standard and are kept for G3 and G10; G28 has its own kept cases; every other entry has none in this folder.

- G1. none in my folders (the client tests only show the token being sent; no test shows a route refusing without it).
- G2. none in my folders (the "outside every root" cases, e.g. `sources/explorer/acts/undo.test.ts`, map client records and refuse nothing).
- G3. kept: `tests/state/system/settings/rows.test.ts`, "makes the rows of local.yml from the catalog alone, with no value, line or state". Failure means the Settings page rows for local.yml carry a value, line or state, that is local.yml content read into a page. Judgment call, may be reversed at landing (Z399): it covers only the page half of G3 ("read into a page"), not "served" or "written".
- G4. none in my folders.
- G5. none in my folders (grep for sanitise, escapeHtml, innerHTML, `{@html` over `tests/state` finds nothing).
- G6. none in my folders. `sources/repositories/capabilities/store-actions.test.ts` shows the client sending `confirm: true`; if that failed, the server would refuse the action, so the guarantee (the route refuses without it) would hold. Not kept.
- G7. none in my folders.
- G8. none in my folders.
- G9. none in my folders (`sources/explorer/acts/undo.test.ts` picks which record to undo; it puts no file back).
- G10. kept: `tests/state/sources/explorer/ops.test.ts`, "a delete" > "posts the trash for the paths of a root". Failure means the Files view posts something other than `trash` for a delete, which the server would carry out as written. Judgment call, may be reversed at landing. The sibling cases in that describe (permanent-delete question on `trash_failed`, answered no, other refusal) were deleted as the second test of one entry.
- G11. none in my folders.
- G12. none in my folders.
- G13. none in my folders (`client/config-seed.test.ts` refuses a pushed config that fails its schema on the page; it does not read a config file or name a key).
- G14. none in my folders.
- G15. none in my folders.
- G16 to G27. none in my folders (their tests are under `tests/checks/`, not here).
- G28. kept, by deletion only, in the files where they sit (the worktree's `agents/guarded.md` has no G28 entry yet: `grep -n G28` over it prints nothing; I worked from the text in the coordinator's message). Parts and their cases:
  - Unsaved edit kept across a tab switch (state held per view instance in the ui store, not in the view): `tests/state/forms/form-drafts.test.ts`, "one form draft" > "keeps a typed value and reads it back by instance and form"; `tests/state/forms/manifest-draft.test.ts`, "the edits" > "keeps an edit per instance and reports it unsaved while it differs".
  - Unsaved edit kept across a reload: `form-drafts.test.ts`, "a reload" > "reads the drafts back out of the storage the ui store saved them to"; `manifest-draft.test.ts`, "a reload" > "reads the edits back out of the storage the ui store saved them to".
  - Close question asked for a tab, pane or page holding an edit (the draft registers with the close guard `client.ui.unsaved`, which the tab, pane and page close read): `form-drafts.test.ts`, "what counts as unsaved" > "registers the client own drafts with the close guard"; `manifest-draft.test.ts`, "the wiring" > "registers the client's own manifest draft with the close guard".
  - Closing a Terminal tab whose terminals run asks first: `tests/state/client/terminal/terminal-close.test.ts`, "the busy read a close asks first" > "names a terminal running a program, and not an idle shell", "asks for every terminal when the read fails" (the question is still asked when the read fails), "ends nothing while the question waits: a read alone stops no terminal".
  - A move, a split or a reload stops none: `terminal-close.test.ts`, "a tab that is moved, split or reloaded" > "ends no terminal when it moves to another pane, to another page, or is split", "ends no terminal when the layout is loaded again".
  Deleted from the restored files: `tests/state/forms/form-values.test.ts` whole (value rules for controls, no part of G28); in `form-drafts.test.ts` the save, form-close, key, snapshot-lookup, tab-close, outside-pane, added-entry, wrong-shape and property-name cases and the "what counts as unsaved" comparison cases; in `manifest-draft.test.ts` the unsaved-comparison, instance-apart, Revert and save cases and the saved-record shape table; in `terminal-close.test.ts` the stop-on-close cases of a tab, pane and page (they show terminals ended after the answer, not the question), the ended-on-its-own case, the moved-last-terminal and view-leaves-registry cases, the "reads nothing" and "ended during the read" busy cases and the task-terminal cases. If the coordinator wants a task-terminal case (`asks about a line that runs, whatever program the pane names`) as a row of the Terminal part, it sits in the base copy of the file. Helpers, constants (`C`, `D`) and imports left unused were deleted with them (`readTab` import and `tabOf` in `terminal-tabs-fixture.ts`; `Snapshot`, `addedKey`, `draftTarget`, `formsKey`, `localDrafts`, `parseAdded`, `parseDrafts`, `parseFormKey`, `snapshotEntries` imports in `form-drafts.test.ts`; `editDiffers`, `parseManifestDraft` in `manifest-draft.test.ts`).

## 2. Counts of `tests/state/` before and after

Before from a copy of the folder taken before the first deletion; after from the worktree after my last change.

| | before | after |
|---|---|---|
| test files (`*.test.ts`) | 206 | 5 |
| `.ts` files | 226 | 12 |
| lines (`cat` of all `.ts`) | 58,446 | 1,039 |
| `it(` or `test(` calls (`grep -oE '\b(it|test)\('`) | 2,986 | 13 |
| `it.each` or `test.each` | 250 | 0 |
| files tagged `@module-tag slow` | 2 | 0 |

Kept test files (lines, `it(` calls): `tests/state/client/terminal/terminal-close.test.ts` (188, 5), `tests/state/forms/form-drafts.test.ts` (93, 3), `tests/state/forms/manifest-draft.test.ts` (81, 3), `tests/state/sources/explorer/ops.test.ts` (102, 1), `tests/state/system/settings/rows.test.ts` (39, 1). Kept helper files: the six in section 3 and `tests/state/client/terminal/terminal-tabs-fixture.ts` (used by `terminal-close.test.ts`). The counts come from `find tests/state -name '*.test.ts'`, `find ... -name '*.ts'`, `cat | wc -l`, `grep -oE` and `grep -rl '@module-tag slow'`, run after my last change. Empty folders left by the deletions were removed (`find tests/state -type d -empty` prints nothing).

Within the two kept test files I deleted every other test and describe, the helpers and constants only those used (in `ops.test.ts`: `refused`, `listingsOf`, `YES`; in `rows.test.ts`: `BEHAVIOR`, `APPEARANCE`, their two lines in `FIXTURE`, `behaviorRows`, `rowOf`) and the imports only they used. The `serve()` stub of `ops.test.ts` and its `written`, `asked`, `bookmarks` variables are kept whole because the kept test runs under that stub.

## 3. Helpers kept because a file outside `tests/state/` imports them

Found by resolving every relative import under `tests/`, `utils/` and `src/` (a script in my scratchpad, not in the tree) and confirmed by grep of the import lines.

- `tests/state/workbench/layout/layout-fixture.ts`: imported by `tests/shell/keys/*.test.ts`, `tests/shell/panes/*`, `tests/shell/rail/rail.test.ts`, `tests/shell/status/status-bar.test.ts`, `tests/ui/frame/give-back.client.test.ts`, `tests/views/sources/files/sections/sections.test.ts`, `tests/views/system/workbench/pages.test.ts`, and by the kept `ops.test.ts`. Kept exports: `instance`, `pane`, `paneOf`, `FREE_PLACE`, `floating`, `pageAround`, `heldPages`, `split`, `bench`, `viewsOf`, `fakeStorage`. Deleted exports: `three`, `folded`, `docked`, `envelope`, `saveBench`, `savedBench`, `foldedOf`, `FOCUS_NODE`, `resetPagesFixture` (no importer left).
- `tests/state/workbench/rail-badges-fixture.ts`: `tests/shell/workbench.test.ts`, `tests/views/boards/personal.test.ts`. Unchanged.
- `tests/state/boards/board/board-fixture.ts`: `tests/views/boards/editor/editor-saving.client.test.ts`, `tests/views/shared/card/card-commands.client.test.ts`, `tests/views/shared/card/card-details.test.ts`, `tests/views/shared/explorer/card-tree.test.ts`, `tests/views/shared/explorer/card-tree.client.test.ts`. They import `SNAPSHOT`, `ITEMS`, `item`, `over`. Deleted `ids` and `facet` and the import names only they used.
- `tests/state/boards/board/side-fixture.ts`: `tests/views/boards/personal.test.ts`. Unchanged.
- `tests/state/sessions/terminal/commands-fixture.ts`: `tests/views/shared/card/card-commands.client.test.ts`, `tests/views/shared/commands/commands-keys.client.test.ts`, `tests/views/shared/commands/commands-fixture.ts`. They import `serveInto` and `Asked`. Deleted `REPO`, `task`, `listTasks`, `captured`, `servedRoots`, `Case`, `freshCase` and the imports only they used.
- `tests/state/client/terminal/terminal-tabs-fixture.ts`: no file outside `tests/state/` imports it; kept because the kept `terminal-close.test.ts` does (`openOwning`, `terminalTabsOf`). Deleted `tabOf` and the `readTab` import.
- `tests/state/system/settings/fixture.ts`: `tests/views/system/workbench/settings-editors.test.ts` (imports `dir`, `file`, `shipped`). Deleted `text`, `shippedRows`, `rowOf` and the imports only they used.

Deleted helpers (no importer inside or outside): `shared/arrival.ts`, `shared/instance-fixture.ts`, `client/fetch-record.ts`, `client/socket-stub.ts`, `sessions/latex/latex-fixture.ts`, `sessions/terminal/pty/pty-fixture.ts`, `sources/explorer/watch.svelte.ts`, `sources/fs/fs-fixture.ts`, `sources/repositories/layout-recorder.ts`, `sources/repositories/diff/rooted.svelte.ts`, `sources/search/search-fixture.ts`, `boards/structure/map-fixture.ts`, `workbench/layout/saved/refusals/refusal-fixture.ts`.

## 4. Changes that are not a deletion

None as a rewrite. Where a deleted name sat in a multi-name import, the name was cut out of the import line, and nothing was added; `diff` of each changed file against the base copy shows these lines on the new side and nothing else:

- `board-fixture.ts`: `type BoardItem,` became `type BoardItem` (last name of the import, comma removed).
- `commands-fixture.ts`: `import { afterEach, beforeEach, vi }` became `import { vi }`.
- `ops.test.ts`: `import { createClientState, json, settle, type ClientState }` lost `settle`.
- `rows.test.ts`: the three imports from `options.ts` and `rows.ts` were reduced to `import { type Catalog }` and `import { localRows }`, one line each.
- `layout-fixture.ts`: the `WORKBENCH_VERSION, panes, parseLayout` import became `import { panes }`.
- `form-drafts.test.ts`, `manifest-draft.test.ts`, `terminal-close.test.ts`: import lists reduced to the names still used (`Entry` kept, `Snapshot` and eight form-drafts names removed; `createManifestDraft` and `ManifestDraftStore` kept; `readTab` removed). Blank lines between the remaining blocks were kept as in the base.

## 5. For the landing (nothing here is mine to edit)

- Comments left standing because they name kept and deleted things in the same sentence, which I could not cut without rewriting: the head comments of `rows.test.ts` (describes the groups, shipped catalog and "This browser" rows it no longer holds), `ops.test.ts` (clipboard, listings, tabs and bookmarks), `layout-fixture.ts` (names `layout.test.ts`, `saved/layout-saved.test.ts`, `arrangement.test.ts`), `board-fixture.ts` (names `tests/state/shared/words/tones.test.ts`), `commands-fixture.ts` (task terminal, sessions message), `settings/fixture.ts` (file text, shipped rows), `form-drafts.test.ts`, `manifest-draft.test.ts` and `terminal-close.test.ts` (describe the cases removed; `terminal-close.test.ts` also points at `tests/state/workbench/navigation/pages.test.ts`, which is deleted), `terminal-tabs-fixture.ts` (mentions the tab reader whose helper was removed), and the doc comment on `FIXTURE` in `rows.test.ts` ("two tracked files and the machine's own").
- `tests/checks/tree/allow-duplication.txt` has entries naming deleted `tests/state/` files (for example lines 52 to 60, `board-fixture.ts` against `board-software.test.ts`, `focus.test.ts`, `focus-lanes.test.ts`). Its owner is the `tests/checks/` sweep or the landing; grep: `grep -n "tests/state" tests/checks/tree/allow-duplication.txt`.
- `tests/checks/utils/outside-paths.test.ts` lines 265 to 267 and 292 to 294 name `tests/state/sources/search/search.test.ts`, `.../diff-view.test.ts` and `shared/instance-state-sources.test.ts` as strings in an expected-output list. They are not imports and no file is read, so they pass unchanged.
- Other files under `tests/` carry comments that name deleted `tests/state/...` test files (found by `grep -rhoE "tests/state/[A-Za-z0-9_./-]+\.ts"` and `[ -e ]`); 48 distinct deleted paths are named, outside `.scratch/`, for example in `tests/views/boards/projects.test.ts`, `tests/shell/workbench.test.ts`, `tests/routes/machine/commands.test.ts`. They belong to the other sweeps' folders.
- The six helper files in section 3 are kept for importers in folders the other sweeps are cutting; once those sweeps land, a helper file or export with no importer left is deleted in the landing's final pass.
- Not verified, because the brief forbids running anything: that `npm run check`, lint and `format:check` pass on the two kept test files and the six helpers. `unused-exports.sh` may report `config` in `settings/fixture.ts` and exports in the kept helpers that are now used only inside their own file.
