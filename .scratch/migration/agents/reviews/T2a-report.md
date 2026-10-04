# T2a report: the deletion sweep of tests/state

Everything in the brief is done. Nothing was run: no test, verify list, build, lint, format or npm command, so none of the checks the landing runs is verified here.

The report is written at `tools/oculus/.scratch/migration/agents/reviews/T2a-report.md`.

## Open items for the orchestrator

1. board-fixture.ts: the word `export` is removed from `EMPTY_RELATIONS`, `project` and `venue` (Z410). Lines 52 and 53 of `tests/checks/tree/allow-duplication.txt` name clones that include those declarations, and the brief did not allow changing other lines; they are fixed at landing with the duplication check run, as Z410 says. Not verified: whether the duplication check passes now, because it was not run.
2. Judgment calls in the choice of tests, each reversible at landing (details under "Per entry"): G12 holds one test (`rail.test.ts`); G29 holds one test in `layout-saved.test.ts` and none for the two same-version retirements read by `fold.ts` and `migrate.ts`; G28 keeps three tests for the form and the manifest editor (tab switch, reload, close question) and fewer for the file editor and the review comment box where no test exists; the two restored files (`commands-pane.test.ts`, `store-wire.test.ts`) hold no unit of G6 or G33 to G35 and are deleted (details under G6 and G35).
3. Text outside `tests/state/` names tests this step deleted. These are outside the write list and are listed at the end for the orchestrator.

## DONE / NOT DONE

- DONE. An entry keeps one test per unit it covers. Proof: `find tests/state -name '*.test.ts' | wc -l` prints 8; the 8 files and 18 cases are listed under "Per entry".
- DONE. Every other test, describe block and test file in the folder is deleted, the two slow-tagged files included. Proof: `grep -rl '@module-tag slow' tests/state` prints nothing; the base had `tests/state/sessions/terminal/commands-pane.test.ts` and `tests/state/sources/repositories/diff/hunks-git.test.ts`, both deleted.
- DONE. Helpers: 12 deleted (the restored `layout-recorder.ts` included), 8 kept. Proof: `find tests/state -name '*.ts' | wc -l` prints 16 (8 tests and 8 helpers); the importer scan (a script that resolves every quoted relative path in `tests`, `utils`, `src`, `vite.config.ts` and `package.json`) printed an empty importer list for each of the 12 deleted helpers before the `rm`.
- DONE. Kept helpers lose the exports nothing imports. Proof: an export scan (a script that lists, for each kept helper, which scanned file imports each export) over the 8 kept helpers prints no `UNIMPORTED` line.
- DONE. No file that is not a test or a test helper was deleted. Proof: `grep -c probe` over the list of 210 deleted paths prints 0, and `tests/state` held no script.
- DONE. Each file was deleted by an explicit path: `rm -- '<path>'` lines in scripts printed first, 198 test files then 10 helpers then 2 helpers, each checked against the 8 kept tests and the 8 kept helpers with `grep -F` (no hit), then 24 `rmdir -- '<path>'` lines for the folders that became empty.
- DONE. Comments naming a deleted test or case are removed in the folder. Proof: `grep -rn "^\s*//\|^\s*\*\|/\*\*" tests/state` was read in full; the edits are listed under "Every change that is not a deletion".
- DONE. `tests/checks/tree/allow-duplication.txt`: 39 lines naming a deleted file are deleted. Proof: `wc -l` prints 74 against 113 in the base copy, and `diff <base copy> tests/checks/tree/allow-duplication.txt | grep -c '^>'` prints 0.
- DONE. No assertion, title or table row of a kept test was changed. Proof: `diff <base copy> <file> | grep '^>'` over the 13 changed files prints only the comment, import, destructuring and `export` lines in the last section.
- DONE. ASCII: `LC_ALL=C grep -rn '[^ -~]' tests/state tests/checks/tree/allow-duplication.txt | wc -l` prints 0.
- DONE. History words: the added comment lines were grepped for `before`, `used to`, `no longer`, `still`, `always`, `as before`, `previously`, `the step adds`, `after this package`, `earlier`; no hit.
- DONE. A syntax and unused-name pass over `tests/state` with the TypeScript compiler API (`noUnusedLocals`, codes 2304, 2552, 6133, 6192, 6196, 6198, 6199, 6205, 1005, 1109, 1128, 1003, 1068) prints one line: `rooted.svelte.ts:7 TS2304 Cannot find name '$effect'`, a Svelte rune in a file this step did not change.
- NOT RUN, by the brief: `npm test`, `npm run test:checks`, `npm run check`, `npm run build`, `npm run format:check`, `sh utils/unused-exports.sh`, the lint. The scripts used for counting, pruning and the pass above are node scripts in the session scratchpad that read the TypeScript package from `/Users/axelfaes/workspace/officium/node_modules`; no test runner, `tsc` build or npm command was started.
- This step adds or changes no test, so there is no revert run to quote. The visible-change section does not apply: no view changed.

## Per entry

Kept tests are named by file and title. Paths are under `tools/oculus/`.

- G1 (write, ops, open, git, deposit, terminal, commands, hpc, mail, calendar routes): none in my folders. No test in `tests/state` calls a route.
- G2 (fs, ops, open, source, search, history, project-files, file/[root]): none in my folders.
- G3 (the content of `config/local.yml` never served, read into a page or written; the server modules that name it): none in my folders. `tests/state/system/config-files.test.ts` held only the Settings view's file names and was deleted; `grep -rln "local.yml" tests/state | wc -l` prints 0.
- G4 (calendar/callback, mail/callback): none in my folders.
- G5 (`src/lib/ui/html.ts`): none in my folders.
- G6 (each action of the `CONFIRMED` lists in git-routes.ts and deposit-routes.ts is a unit): none in my folders, for every action. No test in `tests/state` sends a request to the git or deposit route without `confirm: true` and reads the refusal. `tests/state/sources/repositories/capabilities/store-wire.test.ts` calls each store method with a stub that records the body (`writeGit` is replaced) and compares the field names with those `OPERATIONS` reads; it never reaches `CONFIRMED` or an action's effect, so it shows what the page sends, not what a server unit refuses, and is deleted. `store-actions.test.ts` is deleted for the same reason.
- G7 (commands, hpc, open): none in my folders.
- G8 (each write kind): none in my folders.
- G9 (changes.ts, file-undo.ts, source route, history.ts): none in my folders.
- G10 (ops route, ops.ts, file-changes.ts): none in my folders. The explorer tests held the page's store, not the server's operation.
- G11 (`hooks.server.ts`): none in my folders.
- G12 (shipped config files): `tests/state/workbench/navigation/rail.test.ts`, "finds nothing wrong with the shipped rail list", for the rail list of `layout.yml`. Judgment call: `tests/checks/config/config.test.ts` and `config-folder.test.ts` are the entry's held tests for every file, so this one is a second test for one file.
- G13 (config readers): none in my folders. The state readers of `appearance.yml`, `vocab.yml` and the rail list read values for the page and raise no finding; the finding is `tests/data/sources/config/`'s.
- G14 (`src/lib/data/index.ts`): none in my folders. `focus-side-project.test.ts` and `schema-modelled.test.ts` call `buildPortfolio` over a synthetic hub as a fixture for state rules and were deleted.
- G15 (`src/lib/data/snapshot/`): none in my folders.
- G32 (parsers of the hub's files): none in my folders. No test in `tests/state` reads a well-formed file into the values it holds.
- G28, by part and editor:
  - Form, survives a tab switch: `tests/state/forms/form-drafts.test.ts`, "keeps a typed value and reads it back by instance and form".
  - Form, survives a reload: same file, "reads the drafts back out of the storage the ui store saved them to".
  - Form, closing asks: same file, "registers the client own drafts with the close guard".
  - Manifest editor, survives a tab switch: `tests/state/forms/manifest-draft.test.ts`, "keeps an edit per instance and reports it unsaved while it differs".
  - Manifest editor, survives a reload: same file, "reads the edits back out of the storage the ui store saved them to".
  - Manifest editor, closing asks: same file, "registers the client's own manifest draft with the close guard".
  - File editor, survives a tab switch: `tests/state/sessions/source.test.ts`, "keeps the typed text when it is opened again".
  - File editor, survives a reload: none in my folders. The one case that reads a draft from a held instance state is a row of a table of wrong shapes, which I judged not to be a reload test.
  - File editor, closing asks: same file, "is unsaved once the reader types, which is what closing it asks about".
  - Review comment box, keeps the text: `tests/state/sources/repositories/diff/comment-draft.client.test.ts`, "closes keeping the text, and drops the text on Cancel".
  - Review comment box, survives a reload and closing asks: none in my folders. `review-comment.ts` itself carries the prompt, the refusal and the send and no draft, so `review-comment.test.ts` was deleted.
  - Close question for a tab, a pane and a page (`pages.ts`, which `close-question.svelte.ts` calls; the shell file's own test is in `tests/shell`): `tests/state/workbench/navigation/pages.test.ts`, "keeps the unsaved question for one tab holding unsaved text" (tab), "asks one question over a pane with unsaved text and a busy terminal, the text first" (pane), "lists every instance of every pane of a page, in the tree's own order" (page).
  - Closing a Terminal tab whose terminals run asks first: same file, "asks the busy question over one tab, naming the terminal and its program" (the words); `tests/state/client/terminal/terminal-close.test.ts`, "names a terminal running a program, and not an idle shell" (the fresh busy read).
  - A move, a split or a reload stops no terminal: `terminal-close.test.ts`, "ends no terminal when it moves to another pane, to another page, or is split" and "ends no terminal when the layout is loaded again".
  - `terminal-tabs.ts`: covered through the `terminal-close.test.ts` cases above; the two files that test its layout rules were deleted because their failure does not break the guarantee.
  - `context.ts`: covered by the two "registers ... with the close guard" cases; `client-state.test.ts` was deleted.
  - A page that detaches stops the delivery and leaves the tmux session running (`pty/channel.ts`): none in my folders.
- G33 (each git action does only what it names; `ACTIONS` in git-routes.ts, `git-write.ts`, `git-refs.ts`, `git-index.ts`, `git-remote.ts`): none in my folders, for every action (stage, discard, branch actions, stash drop and the rest). The only test in `tests/state` that touches `ACTIONS` and `OPERATIONS` was `store-wire.test.ts`; it calls `OPERATIONS[action]` with a recording proxy over a body and a stub `options` (`guard`, `trash`), catches the result and reads which fields were looked at. No repository is made and no action runs to an effect, so a stage that staged other paths would not fail it. Deleted, with its helper `layout-recorder.ts`, which only it imported.
- G34 (`cancel` and `log` in `machine/hpc/actions.ts`, `machine/hpc/routes.ts`; an id or path failing `validId` or `safePath` never reaches the remote command): none in my folders. No test in `tests/state` imports a module under `src/lib/server/machine/hpc/` (`grep -rln "machine/hpc" tests/state | wc -l` prints 0).
- G35 (each terminal operation in `machine/pty/routes.ts` that starts or ends a process or sends it input: start, recover, task, latex, command, rerun, restart, chat, compose, steer, interrupt, fork, stop, clear, resume; `tmux.ts`, `sessions.ts`, `channel.ts`): none in my folders, for every operation. `tests/state/sessions/terminal/commands-pane.test.ts` (slow-tagged) starts one task through `startTerminal` on a private tmux server, reads `paneOutput`, and ends it with `stopTerminal`, but its assertion is the list of diagnostics the commands store derives from the captured text, with the folder of each command; it checks neither that an operation acted on the terminal it names nor that it ended only what it says: its only assertions are the diagnostics list and the capture count. Deleted. Its import `captureTask` of `commands/run.ts` is not a unit of G35.
- G29 (`saved/`): `tests/state/workbench/layout/saved/layout-saved.test.ts`, "migrates every page, and reads which one was current". Judgment call: the tests of `fold.ts` and `migrate.ts` (`layout-system.test.ts`) read an envelope of the current version with a retired page or tab, not an earlier version, and the tests of the version 4 and 5 envelopes (`layout-floats.test.ts`, `layout-pinned.test.ts`) read the same parser (`saved.ts`) as the kept test, so they were deleted.
- G30 (`deposit.ts`): none in my folders. `tests/state/system/deposit.test.ts` held the page's store.
- G31 (saved commands, approvals file): none in my folders. The saved layout's tests are Q117's.
- G16 to G27: not in `tests/state`.

No reading of the restored files changes the 8 kept test files: every case of `commands-pane.test.ts` and `store-wire.test.ts` was read against G6 and G33 to G35 and none holds a unit.

Cases in the 8 test files: `form-drafts.test.ts` 3, `manifest-draft.test.ts` 3, `source.test.ts` 2, `comment-draft.client.test.ts` 1, `terminal-close.test.ts` 3, `pages.test.ts` 4, `layout-saved.test.ts` 1, `rail.test.ts` 1.

## Counts of tests/state, before and after

| | before | after |
| --- | --- | --- |
| test files (`find tests/state -name '*.test.ts' \| wc -l`) | 206 | 8 |
| .ts files (`find tests/state -name '*.ts' \| wc -l`) | 226 | 16 |
| lines (`find tests/state -name '*.ts' -exec cat {} + \| wc -l`) | 58446 | 1118 |
| test cases (count script: `it(` and `test(` calls, an `it.each` table counted by its rows) | 4733 | 18 |
| files tagged slow | 2 | 0 |

The before figures are taken on the base copy of the folder and match the brief (206, 226, 58,446, 2). In the before count two `it.each` tables in `fs-answers.test.ts` are built from a computed list and are counted as one row each; that file is deleted, so the after count has no such table. `tests/checks/tree/allow-duplication.txt` went from 113 to 74 lines.

## Helpers kept because a file outside tests/state imports them

- `tests/state/boards/board/board-fixture.ts`: `tests/views/boards/editor/editor-saving.client.test.ts`, `tests/views/shared/card/card-commands.client.test.ts`, `tests/views/shared/card/card-details.test.ts`, `tests/views/shared/explorer/card-tree.client.test.ts`, `tests/views/shared/explorer/card-tree.test.ts`.
- `tests/state/boards/board/side-fixture.ts`: `tests/views/boards/personal.test.ts`.
- `tests/state/sessions/terminal/commands-fixture.ts`: `tests/views/shared/card/card-commands.client.test.ts`, `tests/views/shared/commands/commands-fixture.ts`, `tests/views/shared/commands/commands-keys.client.test.ts`.
- `tests/state/system/settings/fixture.ts`: `tests/views/system/workbench/settings-editors.test.ts`.
- `tests/state/workbench/layout/layout-fixture.ts`: `tests/shell/keys/language-picker.test.ts`, `palette-open.test.ts`, `palette-pin.test.ts`, `palette.test.ts`, `workbench-keys.test.ts`; `tests/shell/panes/floats/float-geometry.test.ts`, `floatlayer.test.ts`; `tests/shell/panes/paneview.test.ts`; `tests/shell/panes/strip/editor-actions-menu.test.ts`, `source-actions.test.ts`, `tab-menu.test.ts`; `tests/shell/rail/rail.test.ts`; `tests/shell/status/status-bar.test.ts`; `tests/ui/frame/give-back.client.test.ts`; `tests/views/sources/files/sections/sections.test.ts`; `tests/views/system/workbench/pages.test.ts`.
- `tests/state/workbench/rail-badges-fixture.ts`: `tests/shell/workbench.test.ts`, `tests/views/boards/personal.test.ts`.

Kept because a kept test imports them: `tests/state/client/terminal/terminal-tabs-fixture.ts` (`terminal-close.test.ts`) and `tests/state/sources/repositories/diff/rooted.svelte.ts` (`comment-draft.client.test.ts`).

Deleted helpers (nothing outside or inside the folder imports them any more): `boards/structure/map-fixture.ts`, `client/socket-stub.ts`, `client/fetch-record.ts`, `sessions/latex/latex-fixture.ts`, `sessions/terminal/pty/pty-fixture.ts`, `shared/arrival.ts`, `shared/instance-fixture.ts`, `sources/explorer/watch.svelte.ts`, `sources/fs/fs-fixture.ts`, `sources/repositories/layout-recorder.ts`, `sources/search/search-fixture.ts`, `workbench/layout/saved/refusals/refusal-fixture.ts`.

Exports removed from kept helpers (base file : export):
- `board-fixture.ts`: `ids` and `facet` deleted with the import lines only they used; `ENGINE_CONFIG`, `CONFIG`, `jointWork`, `snapshot`, `PROJECTS`, `EMPTY_RELATIONS`, `project`, `venue` lose the word `export` (each is still used inside the file).
- `terminal-tabs-fixture.ts`: `tabOf` deleted with its `readTab` import.
- `commands-fixture.ts` (only `Asked` and `serveInto` remain, the two names a file outside `tests/state` imports): `REPO`, `task`, `listTasks`, `captured`, `servedRoots`, `Case` and `freshCase` are deleted (no file imports them now that `commands-pane.test.ts` is deleted), with the imports only they used (`afterEach`, `beforeEach`, `Terminal`, `createClientState`, `json`, `ClientState`).
- `settings/fixture.ts`: `shippedRows` and `rowOf` deleted with their imports; `config` loses `export`; the function `text` was used only by `shippedRows` and is deleted with the `FileText` import.
- `layout-fixture.ts`: `three`, `envelope`, `saveBench`, `savedBench`, `foldedOf`, `resetPagesFixture` and `FOCUS_NODE` deleted with the imports only they used; `paneOf`, `FREE_PLACE`, `folded` lose `export`.

## Every change that is not a deletion

All of these are consequences of a deletion; no assertion, test title, table row or tag was edited.

- Head comments, edited by deleting the clauses that name a deleted test or case, with the sentence rejoined and rewrapped at 100 columns: `form-drafts.test.ts`, `manifest-draft.test.ts`, `source.test.ts`, `comment-draft.client.test.ts`, `terminal-close.test.ts`, `pages.test.ts`, `layout-saved.test.ts`, `rail.test.ts`, `board-fixture.ts`, `terminal-tabs-fixture.ts`, `commands-fixture.ts`, `settings/fixture.ts`, `layout-fixture.ts`. In `layout-saved.test.ts` "the two older envelopes" reads "the older envelope" and in `layout-fixture.ts` "the two suites" reads "the suites"; in `terminal-close.test.ts` and `pages.test.ts` two clauses were joined with an "and" the sentence already had. The comment above `describe('the question a close asks')` in `pages.test.ts` described the deleted `closeQuestion` cases and is deleted. Two doc comments in `board-fixture.ts` lose the clauses "which is what the search cases below look for" and "for the counting cases".
- Import lines regenerated with fewer names, and written on one line where that fits in 100 columns, as Prettier writes them: `form-drafts.test.ts`, `manifest-draft.test.ts`, `source.test.ts`, `comment-draft.client.test.ts` (now `import { type DiffSide } from ...`), `terminal-close.test.ts`, `pages.test.ts`, `layout-saved.test.ts`, `board-fixture.ts`, `layout-fixture.ts`, `commands-fixture.ts`, `terminal-tabs-fixture.ts`, `settings/fixture.ts`.
- `source.test.ts`: the `let` declarations `saveSource`, `loadSourceDraft`, `saveSourceDraft`, `setToken` and the two destructuring lines are cut down to the three names still used, and `afterEach(() => vi.unstubAllGlobals())` is deleted with its imports, since no kept case stubs a global.
- The word `export` removed in `board-fixture.ts` (8 declarations), `settings/fixture.ts` (1) and `layout-fixture.ts` (3), listed above.
- Trailing blank lines at the end of files cut to one newline.

## Text outside tests/state that names a deleted test (outside the write list, not touched)

- In `src`: `src/lib/state/workbench/navigation/registry.ts:13` and `:102` (`registry.test.ts` as the gate for keys, `rail-badges.test.ts`), `src/lib/state/shared/words/text.ts:47` (`registry.test.ts`), `src/lib/state/life/present.ts:10` (`present.test.ts`), `src/lib/state/system/config/config-files.ts:13` (`config-files.test.ts`).
- In `tests`, comments: `tests/shell/workbench.test.ts:9`, `tests/shell/panes/strip-mark.test.ts:4-5`, `tests/shell/status/status-bar.test.ts:8`, `tests/shell/panes/paneview.test.ts:7`, `tests/shell/panes/strip/strip-render.test.ts:7`, `tests/shell/panes/strip/strip-shape.test.ts:7`, `tests/shell/keys/palette-workspaces.test.ts:9`, `tests/server/machine/pty/tmux-fixture.ts:4` (its only importer was the deleted `commands-pane.test.ts`; `grep -rn tmux-fixture tests utils src vite.config.ts package.json` now finds no importer, so the file is a helper nobody imports and belongs to the sweep of `tests/server`), `tests/server/machine/pty/channel-list.test.ts:14`, `tests/server/machine/commands/run.test.ts:7`, `tests/server/files/ops.test.ts:12` and `ops-paste.test.ts:11` (folder `tests/state/sources/explorer/`), `tests/data/file-ops.test.ts:7`, `tests/data/helpers/files/languages.test.ts:6`, `tests/routes/machine/commands.test.ts:9`, `tests/routes/git/refs.test.ts:7`, `tests/views/boards/projects.test.ts:513`, `tests/views/boards/personal.test.ts:9`, `tests/views/boards/collection/collection-form.test.ts:202`, `tests/views/boards/collection/collection.test.ts:9`, `tests/views/sources/note.test.ts:7`, `tests/views/sources/repositories/diff-pane.test.ts:15`, `tests/views/sources/files/sections/sections.test.ts:3`, `tests/views/sources/files/menu/files-ops.test.ts:11`, `tests/views/sources/files/menu/row-actions.test.ts:9`, `tests/views/academic/slides.test.ts:11`, `tests/views/academic/latex.test.ts:9`, `tests/views/sessions/terminal.test.ts:12-13`, `tests/views/system/machine/processes.test.ts:9`, `tests/views/system/workbench/settings-editors.test.ts:11-12`. Found with `grep -rnF "tests/state/<path>"` over `tests utils src docs DESIGN.md HELP.md README.md config vite.config.ts package.json` for each deleted path.
- `tests/checks/utils/outside-paths.test.ts:243-294` names deleted `tests/state` paths inside synthetic brief text and an expected list; the test never reads those files from disk (not verified by running it).
- Other sweeps delete in parallel; if one deletes an importer of a kept helper, the helper's export list needs one more look at landing.
