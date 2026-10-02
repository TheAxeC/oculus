# D32 report (builder)

The report file `tools/oculus/.scratch/migration/agents/reviews/D32-report.md` is NOT written: the Write tool refused with "Subagents should return findings as text". The whole report is below instead. The three appendices are saved as data files and named in the last section. If the file is wanted, paste this text and append those three files.

## 1. What is not done

Not everything in the brief is done. Four things are not.

1. Case 20 is proved in the unit suite for the replace post, the search run and the reload of a clean tab (section 11). It is not proved for the Replace Preview read. That read lives in `views/sources/repositories/diff/Diff.svelte` (`load`, guarded by `taken === readKey`), which the unit suite cannot mount, so its three paths (in flight, after the tab closed, superseded) have no test. Cases 27 to 31 (the look) are the look's, as the brief says, and are not proved by the unit suite; the pure functions under them are tested in `tests/state/sources/search/hits.test.ts` and `tests/shell/keys/keys.test.ts`.
2. The Replace Preview address carries every hit the pane names, so one file with more than about 1500 hits in one answer (`search.max_hits` has no upper bound; its default is 500) gets a 431 from Node and the pane says its failure sentence. The fix is a wire-format decision, so it is Axel's and is not built (open item D32-1).
3. The third and last full run of the verify list passed on the tree as it stood then. After it, 16 exports were made local or removed (section 9), which changed `src/lib/data/helpers/search/query.ts`, `src/lib/state/sources/search/search.ts`, `src/lib/server/files/search.ts`, and the tests `tests/data/helpers/search.test.ts`, `tests/server/files/search.test.ts`, `tests/state/sources/search/search.test.ts`. Those edits were checked by single commands (section 3). `npm test` as a whole was not run on the final tree: not verified. The landing runs it.
4. 77 exports in 21 files this step edits for other reasons are flagged by `utils/unused-exports.sh` and were flagged on main under the same names. The step added none of them and removed the last caller of none of them, so they are not made local (listed in section 9). The script lists 238 exports across the tree; clearing them is a different concern from this step.

## 2. Open items

From `tools/oculus/.scratch/migration/orchestrator-state.md` lines 161 and 162, verbatim, then the item this step raises.

- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line).
- Z263 (2026-10-02 12:40, a new step): the Files view's order and Collapse Folders. Axel asked for reorderable bookmarks and roots, and whether Collapse Folders leaving the roots open is intended. The tree: `collapseAll` (`views/sources/files/control/tab-actions.ts:94-101`) closes every folder and leaves each root's row open on purpose (its comment says so); VS Code's Collapse Folders in a multi-root workspace closes the workspace folders too (from VS Code's behaviour as known, not checked here). No drag reorders the roots, the folder bookmarks (Files section and rail menu), or the notes (`grep -rln drag src/lib/views/sources/files/sections` lists only Outline and Timeline, which drag a row out, not along). The rail, the terminals list, the collection entries, the focus lanes and the slides already reorder. No open step owns the Files view (X3a landed). Options: (a) a new step X3e: drag to reorder the roots (written to the workspace in force, `sources.yml` for the default one), the folder bookmarks (written to `~/.oculus/bookmarks.yml`, the rail menu following), the notes and the Files view's sections (VS Code drags its view sections), and Collapse Folders closing the roots too. Pro: one step, every list of the Files view orderable as VS Code's. Con: a new step. (b) the roots and bookmarks only. Con: the notes and sections keep a fixed order. (c) nothing, the lazy option. Recommendation: (a).
- D32-1 (this step): the Replace Preview address and a large answer. `previewUrl` (`data/file-ops.ts`) puts every hit the pane names into the query string of `GET /api/ops?preview=1`. Measured with `previewUrl` over n hits of one file (`node /tmp/urllen.mjs`): 500 hits 4993 characters (all at column 4) and 5663 (at up to 200); 1000 hits 9994 and 11444; 2000 hits 20994 and 23894. Node's `http.maxHeaderSize` is 16384 (`node /tmp/hdr.mjs`): a request line of 16300 characters answers 200 and one of 17000 answers 431. So the preview fails when one file holds more than about 1400 to 1600 hits, which needs `search.max_hits` raised above the default 500; with the default the longest address is under 6000 characters. Options: (a) leave it, the failure sentence is shown and a narrower search works; (b) the preview becomes a POST with the hits in the body: no limit, one shape for the replace and its preview, nothing reads the shape yet; con: the read leaves the route every other compare uses; (c) refuse a replace answer past 1400 hits per file, the lazy option, since it lowers what the view does. Recommendation: (b).

## 3. DONE / NOT DONE

Full runs of `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md`: 3 (run 1 passed on an earlier tree, run 2 stopped at the comment-width check, run 3 passed). `npm run diagrams` ran before each.

| Row | Check | Result |
| --- | --- | --- |
| DONE | Verify 1, checks.sh, run 3 | last line `checks: 7 commands passed`, exit 0 |
| DONE | Verify 2, `grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui` | prints nothing, exit 1; one test per file of item 20 in the case 26 table (section 4) |
| DONE | Verify 3, `sh utils/unused-exports.sh` | exit 0; `cmp` equal to `npx --no-install knip --production --include exports,types --reporter compact --no-progress`; holds `codeThemeIds` (line 5 of the output), `languageNamed` (10, 172), `hostZone` (24); `grep -c 'FILE_FIELDS\|searchArgs'` of the output prints 0 |
| DONE | Verify 4, each changed test on the unchanged tree | appendix B |
| NOT DONE | Verify 6, cases 27 to 31 | the look's |
| NOT DONE | Case 20, the Replace Preview read | section 1, point 1 |
| NOT DONE | `npm test` on the final tree | section 1, point 3 |

Run 3, the lines checks.sh printed for each command (colour codes removed):

```
$ npm test
 Test Files  478 passed | 24 skipped (502)
      Tests  12294 passed | 637 skipped (12931)
$ npm run test:checks
 Test Files  30 passed | 2 skipped (32)
      Tests  461 passed | 9 skipped (470)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

After the last edit, each run alone from `tools/oculus`: `npm run check` (`COMPLETED 3106 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`); `npm run lint` (no output); `npm run format:check` (`All matched files use Prettier code style!`); `npm run test:checks` (`Test Files  30 passed | 2 skipped (32)`, `Tests  461 passed | 9 skipped (470)`); `npm run build` (exit 0); `LC_ALL=C grep -rna '[^ -~]' src tests` (no output, exit 1); `npx vitest run tests/data/helpers/search.test.ts tests/state/sources/search tests/server/files/search.test.ts tests/routes/files tests/routes/replace tests/views/sources/search.test.ts` (`Test Files  17 passed (17)`, `Tests  460 passed (460)`), and `npx vitest run tests/state/sources/search` after the last test edit (`Tests  148 passed (148)`).

Sizes and folders: `tests/state/sources/search/search.test.ts` is 899 lines of 900. `ls <folder> | wc -l`: `src/lib/data/helpers` 10, `tests/state/sources` 10, `tests/server/files` 10, `tests/routes` 10, `src/lib/server/files` 10, `utils` 10, none past the cap. `repositories.ts` is 866 lines (the brief asks under 870).

## 4. The cases on the unchanged tree

Each changed or new test file was copied onto a copy of main's tree (`scratchpad/d32b/basetree`) and run alone with `npx vitest run <file>`. Every test of a behaviour the step adds or changes failed or its file did not load; the per-file lines are appendix B. Tests of preserved behaviour passed there in the same runs, for example `pty-io.test.ts` 25 passed of 39, `fs-answers.test.ts` 65 of 135, `boundaries.test.ts` 11 of 11.

| Case | Test | Result on the unchanged tree |
| --- | --- | --- |
| 1 | `tests/routes/replace/ops-replace.test.ts`, `tests/state/sources/search/hits.test.ts` | neither loads (`Cannot find module .../data/helpers/search/query.ts`); the unchanged `hitOf` reads `submatches[0]` only, one hit per line |
| 2 to 6 | `tests/data/helpers/replace.test.ts`, `ops-replace.test.ts` | neither loads (`data/helpers/search/replace.ts` absent) |
| 7, 8, 13, 17, 18 | `ops-replace.test.ts` | does not load |
| 9 | `tests/state/sources/search/search.test.ts`, `tests/state/sessions/source.test.ts`, `tests/state/sources/explorer/ops.test.ts` | search test does not load; `source.test.ts` 7 failed (5 of them `TypeError: client.source.reloadSource is not a function`); `ops.test.ts` 3 failed |
| 10 | `tests/routes/replace/replace-undo.test.ts` | 5 failed of 5 |
| 11, 12, 19 | `search.test.ts` | does not load |
| 14 | `search.test.ts`, groups 'an answer read from stored or fetched data' and 'a saved tab read back' | does not load |
| 15 | `tests/routes/replace/preview.test.ts`, `diff-view.test.ts` | preview 6 failed of 6 (`TypeError: previewUrl is not a function`); diff-view does not load (`replace-preview.ts` absent) |
| 16 | `tests/server/files/search.test.ts`, `hits.test.ts` | neither loads |
| 20 | `search.test.ts`, `source.test.ts` | as 9 and 11; the Replace Preview read has no test |
| 21 | `replace.test.ts` | does not load |
| 22 | `tests/state/client/config-seed.test.ts` | 1 failed of 33: `expected { config: 'not a map', text: {}, ...(3) } to be null` at `config-seed.test.ts:68:42` |
| 23 | `search.test.ts`, group 'the answer of the endpoint' | does not load; the unchanged code words it `HTTP ${response.status}` at `state/sources/search.svelte.ts:125` and `:127` |
| 24 | `tests/state/sessions/terminal/pty-io.test.ts` | 14 failed of 39 (e.g. `pty-io.test.ts:86`: `text key not in the text catalog: ui.answer_unreadable`) |
| 25 | the existing tests of N2, N3, N4, N6 | section 13 |
| 26 | one test per file of item 20 | table below |
| 27 to 31 | the look | `grep -rli replac src/lib/views/sources/search` on the unchanged tree prints nothing: none of the controls exists |
| 32 | `tests/checks/utils/outside-paths.test.ts` | 14 failed, 1 passed of 15 (the script is absent) |
| 33 | by command | `sh utils/unused-exports.sh` from a scratch folder holding only the script: `node_modules is not here; run npm install in /tmp/d32-case33`, exit 2 |
| 34 | by command | `cmp` of the script output with the direct knip run: equal; the unchanged tree's list (`/tmp/unused-base.txt`) holds `FILE_FIELDS` and `searchArgs`, the final list holds neither |

Case 26, a test for each file of the 29 lines, with its first run:

| File | Test file | First run |
| --- | --- | --- |
| `state/life/memories.svelte.ts` | `tests/state/life/memories-message.test.ts` | 5 failed of 27 |
| `state/system/docs.svelte.ts` | `tests/state/system/docs.test.ts` | does not load (`ui.answer_refused` absent) |
| `state/system/deposit.svelte.ts` | `tests/state/system/deposit.test.ts` | 13 failed of 30 |
| `state/sessions/source.svelte.ts` | `tests/state/sessions/source.test.ts` | 'a file the route refuses' 2 failed (`:583`, `:590`) |
| `state/sessions/transcript.svelte.ts` | `tests/state/sessions/transcript.test.ts` | 4 failed of 27 |
| `state/sessions/latex.svelte.ts` | `tests/state/sessions/latex.test.ts` | does not load |
| `state/sessions/agents.svelte.ts` | `tests/state/sessions/agents.test.ts` | does not load |
| `state/sessions/terminal/pty-io.ts` | `pty-io.test.ts` | 14 failed of 39 |
| `state/sessions/changes.svelte.ts` | `tests/state/sessions/changes.test.ts` | 5 failed of 26 |
| `state/sources/fs.svelte.ts` | `tests/state/sources/fs/fs.test.ts`, `fs-answers.test.ts` | 6 failed of 43; 70 failed of 135 |
| `state/sources/search.svelte.ts` | `search.test.ts` | does not load |
| `state/sources/fs-transport.ts` (`readAnswer`) | `fs-answers.test.ts`, `tests/state/sources/files.test.ts` | as above; 15 failed of 49 |
| `state/sources/files.svelte.ts` (not edited; the other caller of `readAnswer`) | `files.test.ts` | 15 failed of 49 |
| `state/client/writes.svelte.ts` | `tests/state/client/writes.test.ts` | 7 failed of 27 |
| `views/system/help/Diagram.svelte` | `tests/views/system/help.test.ts` | 2 failed of 22 |
| the terminal start refusal | `tests/state/client/terminal/terminal-start.test.ts`, `tests/state/sessions/terminals.test.ts` | 1 failed of 20; 1 failed of 62 |

No case on the first run got a wrong result from the brief's own rules, so no stop was needed. One tension between two items is in section 13.

## 5. Files with line counts (`wc -l` of each path)

NEW: `src/lib/data/helpers/search/query.ts` 265; `.../search/replace.ts` 394; `src/lib/server/files/fs/replace.ts` 379; `src/lib/state/shared/answers/answers.ts` 94; `src/lib/state/sources/repositories/replace-preview.ts` 75; `src/lib/state/sources/search/hits.ts` 181, `keys.ts` 71, `search.svelte.ts` 413, `search.ts` 251, `walk.ts` 39, `words.ts` 83; `src/lib/views/sources/search/ReplaceRow.svelte` 87, `box-keys.ts` 43; `tests/checks/utils/outside-paths.test.ts` 197; `tests/data/helpers/replace.test.ts` 224; `tests/routes/replace/ops-replace.test.ts` 401, `preview.test.ts` 88, `replace-fixture.ts` 132, `replace-undo.test.ts` 97; `tests/state/sources/search/hits.test.ts` 147, `search-fixture.ts` 16, `search.test.ts` 899; `utils/outside-paths.mjs` 136; `utils/unused-exports.sh` 28.

REMOVED (moved): `src/lib/data/helpers/search.ts`, `src/lib/state/sources/search.svelte.ts`, `src/lib/state/sources/search.ts`, `tests/state/sources/search.test.ts`.

CHANGED: `DESIGN.md` 430; `HELP.md` 311; `config/catalogs/glyphs.yml` 189, `icons.yml` 188; `config/text/app.yml` 70, `ui.yml` 98, `views/sources/files.yml` 228, `views/sources/search.yml` 90, `views/system/history.yml` 64; `docs/diagrams/` `channels.dot` 218 / `.svg` 1181, `layer-server.dot` 150 / `.svg` 730, `layer-state.dot` 158 / `.svg` 770, `layer-views.dot` 169 / `.svg` 762, `layers.dot` 81 / `.svg` 441, `writes.dot` 152 / `.svg` 705; `package-lock.json` 7212; `package.json` 89 (knip 6.39.0 devDependency); `src/lib/data/file-ops.ts` 302; `data/model/model-search.ts` 58; `server/edit/writes/file-undo.ts` 292; `server/files/fs/history.ts` 346; `fs/ops.ts` 816; `server/files/search-routes.ts` 58; `server/files/search.ts` 493; `shell/Workbench.svelte` 426; `shell/keys/keys.ts` 202; `shell/keys/workbench-keys.svelte.ts` 435; `state/client/context.ts` 446; `entities.svelte.ts` 106; `socket.svelte.ts` 358; `writes.svelte.ts` 558; `state/life/memories.svelte.ts` 145; `state/sessions/agents.svelte.ts` 165; `changes.svelte.ts` 192; `latex.svelte.ts` 197; `source.svelte.ts` 385; `terminal/pty-io.ts` 143; `transcript.svelte.ts` 234; `state/sources/explorer/acts/undo.ts` 98; `follow.ts` 137; `ops.svelte.ts` 611; `sections/timeline-reads.ts` 52; `sections/timeline.ts` 48; `state/sources/fs-transport.ts` 352; `fs.svelte.ts` 877; `repositories/repositories.ts` 866; `state/system/deposit.svelte.ts` 150; `docs.svelte.ts` 287; `ui/controls/text/Search.svelte` 120; `ui/forms/TextInput.svelte` 131; `views/sources/files/sections/Timeline.svelte` 194; `files/tree/menu/row-ops.ts` 425; `repositories/diff/Diff.svelte` 537; `diff/compare-words.ts` 49; `views/sources/search/Query.svelte` 140, `Results.svelte` 301, `Search.svelte` 319; `views/system/help/Diagram.svelte` 71, `manual.ts` 28; `views/system/history/History.svelte` 352, `rows.ts` 86; `src/routes/api/(files)/ops/+server.ts` 55; tests: `tests/checks/imports/order.ts` 190, `tree/allow-duplication.txt` 163, `tree/boundaries.test.ts` 638, `tests/data/helpers/search.test.ts` 302, `tests/fixtures/client.ts` 110, `tests/routes/files/search.test.ts` 225, `tests/server/files/search.test.ts` 780, `tests/shell/keys/keys.test.ts` 378, `workbench-keys.test.ts` 609, `tests/state/client/config-seed.test.ts` 365, `terminal/terminal-start.test.ts` 440, `writes.test.ts` 262, `tests/state/life/memories-message.test.ts` 194, `tests/state/sessions/agents.test.ts` 265, `changes.test.ts` 290, `latex.test.ts` 414, `source.test.ts` 681, `terminal/pty-io.test.ts` 176, `terminals.test.ts` 845, `transcript.test.ts` 358, `tests/state/shared/instance-state-sources.test.ts` 579, `tests/state/sources/explorer/acts/undo.test.ts` 145, `explorer/ops.test.ts` 694, `sections/sections.test.ts` 234, `files.test.ts` 343, `fs/fs-answers.test.ts` 354, `fs/fs.test.ts` 892, `repositories/diff/diff-view.test.ts` 288, `tests/state/system/deposit.test.ts` 182, `docs.test.ts` 794, `tests/ui/theme/wall.test.ts` 229, `tests/views/boards/project.test.ts` 545, `tests/views/sources/files/files-stored.test.ts` 471, `menu/files-ops.test.ts` 388, `sections/sections.test.ts` 435, `tests/views/sources/note.test.ts` 248, `search.test.ts` 372, `tests/views/system/help.test.ts` 382, `history.test.ts` 268, `tests/views/whole/type-scale.test.ts` 396.

## 6. Folder splits and files moved

- `src/lib/data/helpers/` was full: `data/helpers/search.ts` became the folder `data/helpers/search/` holding `query.ts` (the old module with the group template and `at`) and `replace.ts` (new). Every importer follows; `boundaries.test.ts` lists `'data/helpers/search/**'`.
- `src/lib/state/sources/search.svelte.ts` and `search.ts` moved into the folder `src/lib/state/sources/search/`, which also holds the new `hits.ts`, `keys.ts`, `walk.ts`, `words.ts`. `state/sources/` holds 9 items.
- `src/lib/state/shared/answers/answers.ts` is new in its own folder, because a file directly in `state/shared` fails the folder-order check (`tests/checks/imports/order.ts`, `INNER`); the order is `answers`, `words`, `stores`.
- `tests/state/sources/search.test.ts` moved to `tests/state/sources/search/search.test.ts`, with `hits.test.ts` and `search-fixture.ts`. The brief says no file is added to or moved out of `tests/state/sources/`; the folder `search/` took the place of the file, so the folder still holds 10 items (`ls tests/state/sources | wc -l` prints 10).
- `tests/routes/replace/` is new (4 files), as the brief names. `src/lib/views/sources/search/` gained `ReplaceRow.svelte` and `box-keys.ts` (5 items). `src/lib/server/files/fs/replace.ts` is new (the folder holds 7 items).

## 7. Edits to an existing assertion, allow list or predicate (before, after)

| Where | Before | After |
| --- | --- | --- |
| `tests/checks/tree/boundaries.test.ts:149` | allow row `'data/helpers/search'` | `'data/helpers/search/**'`; head comment line 35 and lines 61 to 82 say `data/helpers/search/**` and name `query` and `replace` |
| `tests/checks/tree/boundaries.test.ts:317-321` | `SHELL_STORES` without `search` | gains `'search'`; the comment above names why (the key that finds or replaces in files asks the Search box of the pane in focus for the cursor through `search`) |
| `tests/checks/imports/order.ts:99` | `'state/shared': ['state/shared/words', 'state/shared/stores']` | `['state/shared/answers', 'state/shared/words', 'state/shared/stores']`; head comment lines 11 to 19 follow |
| `tests/checks/tree/allow-duplication.txt:136` | `tests/state/sources/search.test.ts tests/views/sources/search.test.ts 29fce2fb85d5 the same 10 lines at 38 and 51` | `tests/state/sources/search/search.test.ts tests/views/sources/search.test.ts 29fce2fb85d5 the same 10 lines at 60 and 54` (same hash, same 10 lines; the path and line numbers moved) |
| `tests/views/whole/type-scale.test.ts:98-101` | `Search.svelte` `''`; `Results.svelte` `'.count=fs-sm \| .row=fs-md \| .line=fs-sm'` | `Search.svelte` `'.said=fs-sm'`; new row `ReplaceRow.svelte` `''`; `Results.svelte` `'.count=fs-sm \| .line=fs-sm'` (the row is the tree's `TreeItem`, which carries its own size) |
| `tests/ui/theme/wall.test.ts` | allowed selector `src/lib/views/sources/search/Results.svelte .row:hover` | removed with the rule (the hover is the tree row's now) |
| `tests/state/sources/files.test.ts:299-340` | refused read `{ error: 'no such project' }` at 404 held `'no such project'`; `{ error: null }` at 404 `'404'`; `{}` at 500 `'500'`; `'x'` at 502 `'502'`; non-text error at 404 `'404'`; unreadable refused body `'503'`; unreadable successful body `'200'` | all hold `refused(status)` (`The server refused the request (HTTP 404).`), the unreadable ones `unreadable(status)` (`The server's answer could not be read (HTTP 503).`); new case: `{ error: 'missing' }` at 404 holds `t('files.refused_missing')`; the first case is renamed 'holds the refusal sentence the endpoint earned instead of the rows' and holds `refused(404)` |
| `fs/fs-answers.test.ts`, `fs/fs.test.ts`, `state/system/{docs,deposit}.test.ts`, `state/sessions/{agents,changes,latex,transcript,source,terminals}.test.ts`, `terminal/pty-io.test.ts`, `state/client/{writes,terminal/terminal-start}.test.ts`, `state/life/memories-message.test.ts` | a refusal held the server's own text (`'origin'`, `'boom'`, `'no mirror'`, `'document does not exist'`, `'cwd must be an absolute path'`), an empty one `''`, a non-text one the bare status `'500'`, an unreadable body `'200'`, `'500'` or `HTTP 500` | a refusal holds `refused(status)`, an unreadable body `unreadable(status)`, a refusal word of the catalog its own sentence (`files.refused_<word>`), an empty or non-text error `refused(status)` (Z265: the server's own text is shown only as a catalog word); the import line of `setCatalog` gains `t` where a case reads a sentence |
| `tests/views/sources/files/files-stored.test.ts`, `tests/views/sources/note.test.ts`, `tests/views/boards/project.test.ts` | `The roots could not be read: origin`, `hub could not be read: missing`, `The note could not be read: no-such-note`, the latex read failure carrying `the folder is locked` | the same sentences followed by `t('ui.answer_refused', 403)`, `t('files.refused_missing')` or `t('ui.answer_refused', 404)` |
| `tests/routes/files/search.test.ts` | the route answered `{ error: '<sentence>', refused: '<word>' }`; `{ error: 'error: unclosed group' }`; `{ error: 'the write token is missing or stale' }`; a hit `{ line, column, length, text }` | `{ error: '<word>' }` (`empty`, `too_long`, `unknown_root`, `token`), `{ error: 'pattern', reason: 'unclosed group' }`, a hit carries `at` |
| `tests/server/files/search.test.ts` | the fold tested by `foldStream` and `createFold`, the reason by `reasonOf`, the timeout by the exported `TIMED_OUT`; the route test expected a sentence per refusal; hits had no `at` | the same fold cases through `runSearch` over a prepared stream (`foldedBy`), the stop case through the runner's `onLine`, the reason through a failed run, the timeout by its sentence; the route test expects the refusal word; hits carry `at` |
| `tests/data/helpers/search.test.ts` | imported `MAX_QUERY`, `perFileCount`, `searchParams`, `searchArgs`; asserted `perFileCount(500)` is 501 | imports from `data/helpers/search/query.ts`; the args are read through `searchQuery(...).args`; the bound is `LONGEST_QUERY = 1000` in the test; the parameters are read from `searchUrl`; the `perFileCount(500)` line is dropped and the rule stays asserted by `argsOf(query({ max: 3 }))[2]` being `'4'` |
| `tests/views/sources/search.test.ts` | rows `<div class="row head">`, `<li class="row hit">`, `<strong class="match">`, 5 `cell` buttons | the rows are the tree's items (`data-search-file`, `data-search-hit`); the pure-function cases moved to `tests/state/sources/search/hits.test.ts` |
| `tests/views/sources/files/menu/files-ops.test.ts` | `compareSentence(word, t)` exported and called | `failureSentence(subject, word, t)` exported, `compareSentence` local; the same four words and two fallbacks through a `compared` helper; a new group for the Replace Preview words |
| `tests/shell/keys/workbench-keys.test.ts:150-173` | `handler(..., composeIn)` | `handler(..., composeIn, focusSearchBox)`, a new group 'Find in Files and Replace in Files' |

The lines removed from existing test files are in appendix C.

## 8. Head comments and doc paragraphs touched

- New head comments, written for the module: `data/helpers/search/{query,replace}.ts`, `server/files/fs/replace.ts`, `state/shared/answers/answers.ts`, `state/sources/repositories/replace-preview.ts`, `state/sources/search/*`, `views/sources/search/{ReplaceRow.svelte,box-keys.ts}`.
- Rewritten (head comment differs from the unchanged tree's): `server/files/search.ts` (one subprocess call site, now also reached by `fs/replace.ts` through `runRipgrep`), `server/files/search-routes.ts`, `data/model/model-search.ts`, `data/file-ops.ts`, `server/files/fs/ops.ts`, `fs/history.ts`, `server/edit/writes/file-undo.ts`, `routes/api/(files)/ops/+server.ts`, `state/client/socket.svelte.ts`, `state/sessions/source.svelte.ts`, `terminal/pty-io.ts`, `state/sources/explorer/{ops.svelte.ts,acts/undo.ts,sections/timeline.ts}`, `repositories/repositories.ts`, `ui/controls/text/Search.svelte`, `ui/forms/TextInput.svelte`, `views/sources/files/sections/Timeline.svelte`, `diff/compare-words.ts`, `views/sources/search/{Query,Results}.svelte`, `views/system/help/manual.ts`; `tests/checks/tree/boundaries.test.ts` lines 31 to 82; `tests/checks/imports/order.ts` lines 11 to 19.
- `Diff.svelte`: the component comment at lines 19 to 22 rewritten (adds the Replace Preview); the registration head comment is still true.
- Still true (head comment byte-identical to the unchanged tree and re-read against the file after the change): `shell/Workbench.svelte`, `shell/keys/keys.ts`, `workbench-keys.svelte.ts`, `state/client/{context,entities.svelte,writes.svelte}.ts`, `state/life/memories.svelte.ts`, `state/sessions/{agents,changes,latex,transcript}.svelte.ts`, `state/sources/{fs-transport.ts,fs.svelte.ts}`, `explorer/follow.ts`, `sections/timeline-reads.ts`, `state/system/{deposit,docs}.svelte.ts`, `views/system/history/{History.svelte,rows.ts}`, `files/tree/menu/row-ops.ts`, `views/system/help/Diagram.svelte`, `views/sources/search/Search.svelte`.
- `DESIGN.md` lines 130 (Search), 140 (the `replace` record and its undo), 148, 171 (layer table row), 176, 393 to 394: rewritten. `HELP.md`: the key table (two rows), line 115 (the `search` row), line 170 (case control and order), the two paragraphs at lines 174 to 177 (replace, and how the replace text is read): rewritten; lines 166 and 168 to 169 (ignore, hidden and skip rules, the toggles): still true.

## 9. Exports

Rule applied: an export the step adds, or whose last outside caller the step removes, is made local or removed unless something outside its own file and its tests imports it. Exports flagged on main that the step neither added nor emptied of callers are listed and left.

- Added by the step and present in the script output: none (`diff /tmp/unused-base.txt /tmp/unused.txt` shows only exports leaving the list or the module path changing).
- Made local or removed: `MAX_QUERY`, `MAX_FILESIZE`, `SKIP_GLOBS`, `SEARCH_PATH`, `perFileCount`, `searchParams`, `searchArgs` (`data/helpers/search/query.ts`); `emptySearchState`, `countHits`, the `SearchFailure` re-export (`state/sources/search/search.ts`); `MAX_OUTPUT`, `TIMED_OUT`, `reasonOf`, `createFold`, `Fold` made local and `foldStream` removed (`server/files/search.ts`); `compareSentence` local (`compare-words.ts`); `diagramUrl` local (`manual.ts`).
- Gained an importer through this step: `HIT_WIDTH` (`server/files/search.ts`), `FILE_FIELDS` (`server/edit/writes/file-undo.ts`), `SAVE_MAX_BYTES` (`fs/replace.ts`), `isReadonly` (`fs/replace.ts`), `RunOutcome`, `OnLine`, `SearchRunner` (`fs/replace.ts`, `fs/ops.ts`), `loadDiagram` and `DiagramFile` (`Diagram.svelte`), `refusalSentence` and `refusalWord` (`row-ops.ts`, `compare-words.ts`), `emptyQuery` (`state/sources/search/search.ts`, which builds the empty tab state from it).
- Flagged on main and left (31 script lines, 77 names, 21 files; `/tmp/left-flagged.txt`): `data/file-ops.ts` MAX_NAME_LENGTH; `server/files/fs/history.ts` DELETE_MAX_BYTES, SAVES_KEPT, DELETES_KEPT, historyFolder, savesOf, and the types HistorySave, HistoryEntries; `shell/keys/keys.ts` CHORD_MS, DOUBLE_G_MS; `shell/keys/workbench-keys.svelte.ts` typingIn; `state/client/socket.svelte.ts` addressAfterMove and the type Status; `state/client/writes.svelte.ts` OPEN_PATH, GIT_PATH, DEPOSIT_PATH, MEMORIES_PATH, writeTimeout, and the types SendOptions, SessionFields; `state/client/context.ts` TabScopeStore; `state/life/memories.svelte.ts` TILE_BOUND, Wall; `state/sessions/agents.svelte.ts` scopeQuery, exportUrl and 11 types; `changes.svelte.ts` haystack; `latex.svelte.ts` LatexState; `source.svelte.ts` sourceFileUrl, sourceInfoUrl, loadSource, loadSourceReadonly, SourceLoad, SourceDraft; `transcript.svelte.ts` TurnTool, TurnsState; `state/sources/explorer/follow.ts` followed; `explorer/ops.svelte.ts` freeName, Clipboard, ExplorerTab, FolderOpened; `state/sources/fs-transport.ts` fixedRootKeys, configuredRootKeys, workspaceNames; `fs.svelte.ts` FS_PATH, listingUrl and 8 types; `repositories/repositories.ts` validName, worktreePath, worktreesDir, stashUrl, worktreeDiffUrl, isConflict, currentBranch, GitGraphPage; `state/system/docs.svelte.ts` holds; `deposit.svelte.ts` Change, Held; `views/system/history/rows.ts` sentenceFor, UndoAnswer.

## 10. Host-visible and user-visible changes

- The Search view has a replace row (Toggle Replace chevron, replace box, the Preserve Case chip, Replace All), a Replace and a Dismiss on each hit and each file heading, a question before Replace All, and a count line saying how many hits would be replaced. Before: a query box and read-only results.
- A hit is one match. Before: one row per matching line, the first match only. A saved tab whose hits have no `at` runs again.
- Cmd+Shift+F opens the Search view with the cursor in the query box; Cmd+Shift+H with the replace row shown and the cursor in the replace box; Cmd+Alt+Enter is Replace All; Cmd+Shift+1 replaces the focused row; Delete and Cmd+Backspace dismiss it. The key sheet (`config/text/app.yml`) lists the two page keys. Before: none existed.
- With the replace row shown, a press on a hit opens a Replace Preview (a diff pane, the file against the file with the tab's replacements, one pane per file). Before: it opened the source tab.
- `POST /api/ops` accepts `{ op: 'replace' }` and `GET /api/ops?preview=1` reads the preview. A replace writes through the write chain, keeps a `replace` copy of each file, is one `files` record with the field `replace`, and is undone and redone from the History view ("Replaced in {n} files"). The Timeline lists a `replace` copy with its own word. A clean source tab on a replaced file reads the file again (`reloadSource`).
- New refusal words for the ops, each with a `files.refused_*` sentence: `bad-query`, `binary`, `marker`, `changed`, `search-failed`.
- Every bare-status error is a sentence: `The server refused the request (HTTP {0}).` and `The server's answer could not be read (HTTP {0}).` Before, the Files view, the note, document, memories, agents, transcript, latex, deposit, changes and terminal stores and the help diagram showed the server's own text, an empty line, `404`, `200` or `HTTP 500`. After, a refusal word of the catalog shows that word's sentence and any other text gives the refused sentence with the status (Z265). Write routes keep their `error` words because callers compare them.
- The search route answers refusal words (`{ error: 'empty' }`, `{ error: 'pattern', reason }`) and the page words them from `search.yml`. Before: an English sentence beside the word.
- A terminal start answered at 200 without a non-empty string id is a failed start with the unreadable sentence. Before: `{ ok: true, id: '' }`.
- The server's seed `config` payload is checked against its schema and not held when it fails (the config then comes from the socket's first frame). Before: held as it came.
- `HELP.md` says the fixed Search choices: results come in ripgrep's order, which is not sorted; `case` is the only case control, with no smart case.
- `knip` 6.39.0 is a devDependency; `utils/outside-paths.mjs` and `utils/unused-exports.sh` are new.

## 11. Asynchronous paths and their tests

| Path | In flight | After the tab closed | Superseded |
| --- | --- | --- | --- |
| The replace post | `tests/state/sources/search/search.test.ts` 'sends one request when Replace All is pressed twice while the first is in flight' | 'writes into no tab when the tab closed while the replace was out' | 'keeps the answer of a newer run when an older replace lands after it' |
| The search run | 'leaves a second press alone while a run is in flight' | 'writes into no tab when the tab closed while a search was out' | not possible: `runSearch` returns while `searchRunning(id)`, which is the first column's test |
| The reload of a clean tab | `tests/state/sessions/source.test.ts` 'keeps the text typed while the read was out, and moves the saved text to the disk' | 'writes nothing under a tab its pane closed while the read was out' | "leaves the next file's draft alone in a preview tab pointed at it" |
| The Replace Preview read | no test | no test | no test (section 1, point 1) |

## 12. Differences from VS Code found beyond the two listed

None. The two listed (a file with unsaved text left out; no Replace All on a folder) are built as the brief states them.

## 13. Judgment calls and what in the brief was wrong or in tension

The seven answers, judged on the brief's standard:

| N | Verdict | Evidence |
| --- | --- | --- |
| N1 | kept, seed checked | the cast stays at `state/client/entities.svelte.ts:68` and its comment (lines 60-65) names both callers; `socket.svelte.ts:316` refuses a seed that fails `payloadShapes.config`; test `config-seed.test.ts` (case 22) |
| N2 | kept, worded | `state/sessions/agents.svelte.ts:94-97` returns `failed(unreadableAnswer(response.status))` for a 200 body of the wrong type |
| N3 | kept | the panel reads `plan?.changes.length` and `one.files.length`; `mirrorStateShape...catch(null)` (`deposit.svelte.ts:68-81`) reads a partial state as none; the state-reader tests are unchanged |
| N4 | kept | a lookup by `constructor`, `toString`, `hasOwnProperty`, `__proto__` answers nothing; `selectors.svelte.ts` and its tests are unchanged |
| N5 | changed | the two bare statuses are item 20's sentences (`search.svelte.ts` `ask`) |
| N6 | kept | `busyShape` reads `busy: z.boolean().catch(false)`; the server sends a boolean; the busy tests are unchanged |
| N7 | changed | `pty-io.ts:89` and `:96` answer `{ ok: false, id: '', error: unreadableAnswer(status) }` for a start at 200 without a non-empty string id; the other 14 actions keep their reading |

Judgment calls the brief left open:

- `state/shared/answers/answers.ts` holds the sentences of an answer (`failedAnswer`, `refusedAnswer`, `unreadableAnswer`, `refusalSentence`) in a folder of its own because of the folder-order check. `refusalSentence(word, t = catalogText)` takes the words function as a parameter so a view passes its own `t`; the catalog reads inside are literal `t('files.refused_*')` calls, which `keys.test.ts` requires.
- `HISTORY_KEPT` is 20; `queries` and `replaces` are kept in `SearchState`.
- `reloadSource(id)` in `source.svelte.ts` reads a clean tab's file again and leaves a tab with unsaved text alone.
- `search` is on the shell's `SHELL_STORES` allow list because the page keys ask the store for the cursor.
- The Search state tests moved into `tests/state/sources/search/`; the pure-function cases went to `hits.test.ts`; the replace-row cases stayed in the view test.
- The fold, `reasonOf` and `TIMED_OUT` are tested through `runSearch` so none stays exported for the tests; the fold cases keep their assertions.
- 22 paths changed outside the brief's "Paths this step writes" list, computed with `entriesOf` and `outside` of `utils/outside-paths.mjs` over the paths of this report's section 5 (no git run): `config/catalogs/glyphs.yml`, `config/catalogs/icons.yml`, `config/text/views/sources/files.yml`, `config/text/views/system/history.yml`, `src/lib/shell/Workbench.svelte`, `src/lib/ui/controls/text/Search.svelte`, `src/lib/ui/forms/TextInput.svelte`, `.../diff/Diff.svelte`, `.../diff/compare-words.ts`, `src/lib/views/system/help/manual.ts`, `src/lib/views/system/history/History.svelte`, `tests/checks/imports/order.ts`, `tests/checks/tree/allow-duplication.txt`, `tests/fixtures/client.ts`, `tests/routes/files/search.test.ts`, `tests/shell/keys/workbench-keys.test.ts`, `tests/ui/theme/wall.test.ts`, `tests/views/boards/project.test.ts`, `tests/views/sources/files/files-stored.test.ts`, `.../menu/files-ops.test.ts`, `.../sections/sections.test.ts`, `tests/views/sources/note.test.ts`. Reasons: the catalogs hold the new glyphs, icons and sentences; `Workbench.svelte` carries the `focusSearchBox` call of the page keys; `Search.svelte` and `TextInput.svelte` take the `input` binding and the `onkey` hook of the two boxes; `Diff.svelte`, `compare-words.ts` and `History.svelte` word the preview and the record; `manual.ts` exports `loadDiagram` for `Diagram.svelte`; `order.ts` and `allow-duplication.txt` follow the new folders; `tests/fixtures/client.ts` holds `refused` and `unreadable` (the shared helpers the duplication check required); the other tests follow the sentence, key and folder changes they cover.

In the brief:

- Case 25 says the tests of N2, N3, N4 and N6 pass unchanged. That holds for N4, for N6 and for the state-reader tests of N3. The assertions about the text of the error in the N2 and N3 files held `'200'`, `'500'` or the server's text and now hold the sentence, because item 14 and item 20 require it (section 7). The judged behaviour is asserted by the same cases as before.
- Item 20 says a refusal whose body text is not a catalog word gives `answer_refused`; the write routes' tests compare the `error` word they send, so the write routes keep their words and only the display changed.
- The brief's wording for `tests/state/sources/` ("no file added or moved out") is met by a folder of the same name taking the file's place (section 6).
- Git: one read-only `git -C . status` was run by mistake, output discarded, nothing changed. No other git command was run except inside the scratch repositories of the outside-paths test. `config/local.yml` was not opened, printed, grepped or hashed in any checkout; `ops-replace.test.ts` names its path as a string for the `protected` refusal and reads nothing.

## Appendices (data files, whole)

- Appendix A, whole output of `sh utils/unused-exports.sh` (exit 0, equal to the direct knip run): `/tmp/unused.txt` (353 lines). The unchanged tree's list: `/tmp/unused-base.txt`.
- Appendix B, the first run of each changed or new test file on the unchanged tree (vitest's summary, then one line per failing case with its first error and location): `/tmp/firstrun-appendix2.txt` (397 lines, ASCII).
- Appendix C, the lines of existing test files this step removed or changed (the `-` lines of `diff -U0` against the unchanged tree): `/tmp/test-edits.txt` (357 lines).
- Also: `/tmp/filelist2.txt` (section 5 as tab-separated counts), `/tmp/left-flagged.txt` (section 9's left exports), `/tmp/outside2.txt` (the 22 paths), `/tmp/checks-run3.txt` (run 3, whole output).
