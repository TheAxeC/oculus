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

## Repair round 1: appendices (data files, whole)

### Appendix R1-A, first run of each changed or new test file on the unchanged tree (phase 1):

```
### tests_checks_imports_order.test.ts
- Test Files  1 failed (1); Tests  2 failed | 11 passed (13)
- the folder order of each layer > holds the state folders | AssertionError: expected [ Array(1) ] to deeply equal [] | tests/checks/imports/order.test.ts:41:35
- the order check > places every folder of every layer the tree holds, and every sub-folder of an inner order | AssertionError: expected [ Array(1) ] to deeply equal [] | tests/checks/imports/order.test.ts:106:76

### tests_checks_tree_boundaries.test.ts
- Test Files  1 passed (1); Tests  11 passed (11)

### tests_checks_utils_outside-paths.test.ts
- Test Files  1 failed (1); Tests  14 failed | 1 passed (15)
- the paths a step changed that its brief does not name > prints nothing for a changed file the section names | AssertionError: expected { out: [], ...(2) } to match object { out: [], status: +0 } | tests/checks/utils/outside-paths.test.ts:80:22
- the paths a step changed that its brief does not name > prints a changed file the section does not name | AssertionError: expected { out: [], ...(2) } to match object { out: [ 'src/b.ts' ], status: +0 } | tests/checks/utils/outside-paths.test.ts:88:22
- the paths a step changed that its brief does not name > prints an untracked file the section does not name, and not an ignored one | AssertionError: expected [] to deeply equal [ '.gitignore', 'src/new.ts' ] | tests/checks/utils/outside-paths.test.ts:97:26
- the paths a step changed that its brief does not name > prints a deleted file the section does not name | AssertionError: expected [] to deeply equal [ 'src/b.ts' ] | tests/checks/utils/outside-paths.test.ts:104:26
- the paths a step changed that its brief does not name > prints nothing for a file under a folder entry that ends with a slash | AssertionError: expected [] to deeply equal [ 'src/other.ts' ] | tests/checks/utils/outside-paths.test.ts:113:26
- the paths a step changed that its brief does not name > covers tools/oculus/<token> by a token written relative to tools/oculus | AssertionError: expected [] to deeply equal [ 'tools/oculus/src/b.ts' ] | tests/checks/utils/outside-paths.test.ts:121:26
- the paths a step changed that its brief does not name > prints the old and the new path of a rename when neither is named | AssertionError: expected [] to deeply equal [ 'src/new.ts', 'src/old.ts' ] | tests/checks/utils/outside-paths.test.ts:129:26
- the paths a step changed that its brief does not name > prints a path holding a space or a non-ASCII letter as it is | AssertionError: expected [] to deeply equal [ 'src/cafe?.ts', 'src/with space.ts' ] | tests/checks/utils/outside-paths.test.ts:137:26
- the paths a step changed that its brief does not name > lets a token of one segment cover only the path equal to it | AssertionError: expected [] to deeply equal [ 'tools/oculus/HELP.md' ] | tests/checks/utils/outside-paths.test.ts:145:26
- the paths a step changed that its brief does not name > lets a token of two segments cover the same two segments under any folder | AssertionError: expected [] to deeply equal [ 'other/b/x.ts' ] | tests/checks/utils/outside-paths.test.ts:154:26
- the paths a step changed that its brief does not name > reads only the backticked tokens of the section, and only up to the next heading | AssertionError: expected [] to deeply equal [ 'later/file.ts', 'prose/with.token' ] | tests/checks/utils/outside-paths.test.ts:171:26
- the report that cannot compare > exits 2 with a sentence for a brief with no such section | AssertionError: expected 1 to be 2 // Object.is equality | tests/checks/utils/outside-paths.test.ts:179:29
- the report that cannot compare > exits 2 with a sentence for a brief that cannot be read | AssertionError: expected 1 to be 2 // Object.is equality | tests/checks/utils/outside-paths.test.ts:187:29
- the report that cannot compare > exits 2 with a sentence for a base git does not know | AssertionError: expected 1 to be 2 // Object.is equality | tests/checks/utils/outside-paths.test.ts:194:29

### tests_data_helpers_replace.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../src/lib/data/helpers/search/replace.ts' imported from <unchanged tree>/tests/data/helpers/replace.test.ts

### tests_data_helpers_search.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../src/lib/data/helpers/search/query.ts' imported from <unchanged tree>/tests/data/helpers/search.test.ts

### tests_routes_files_search.test.ts
- Test Files  1 failed (1); Tests  7 failed | 4 passed (11)
- the gates > refuses a request without the write token | AssertionError: expected { Object (error) } to deeply equal { error: 'token' } | tests/routes/files/search.test.ts:98:39
- the answer > carries the files, the hits, the total, the cap word and the time | AssertionError: expected { ok: true, files: [ { ...(3) } ], ...(4) } to deeply equal { ok: true, files: [ { ...(3) } ], ...(4) } | tests/routes/files/search.test.ts:112:39
- what is refused > refuses an empty pattern with 400 and starts nothing | AssertionError: expected { ...(2) } to deeply equal { error: 'empty' } | tests/routes/files/search.test.ts:182:39
- what is refused > refuses a pattern past the bound with 400 | AssertionError: expected { ...(2) } to deeply equal { error: 'too_long' } | tests/routes/files/search.test.ts:189:39
- what is refused > refuses a root outside the served list with 400 and starts nothing | AssertionError: expected { ...(2) } to deeply equal { error: 'unknown_root' } | tests/routes/files/search.test.ts:195:39
- what is refused > answers 400 with the word and the one-line reason for a regex ripgrep would not read | AssertionError: expected { error: 'error: unclosed group' } to deeply equal { error: 'pattern', ...(1) } | tests/routes/files/search.test.ts:210:39
- what is refused > answers 400 with the word timed_out for a run that ran out of time | AssertionError: expected { error: 'the search timed out' } to deeply equal { error: 'timed_out' } | tests/routes/files/search.test.ts:223:39

### tests_routes_replace_ops-replace.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../src/lib/data/helpers/search/query.ts' imported from <unchanged tree>/tests/routes/replace/ops-replace.test.ts

### tests_routes_replace_preview.test.ts
- Test Files  1 failed (1); Tests  6 failed (6)
- the preview of a replace in one file > holds the file as it is on the left and the file with the named matches replaced on the right | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:25:30
- the preview of a replace in one file > leaves a match it was not named for unreplaced, which is how a dismissed hit stays | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:41:30
- the preview of a replace in one file > shows another replace text in a second preview of the same file | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:50:29
- the preview of a replace in one file > leaves a named match that is no longer in the file unreplaced instead of refusing the preview | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:57:30
- the preview of a replace in one file > applies the groups, the case and the line ends the write would | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:67:30
- the preview of a replace in one file > refuses with the word of the check: binary, missing, outside, protected and bad-query | TypeError: previewUrl is not a function | tests/routes/replace/preview.test.ts:82:22

### tests_routes_replace_replace-undo.test.ts
- Test Files  1 failed (1); Tests  5 failed (5)
- taking a replace back > writes each file back from its copy and records the undo as a replace that can be taken back | AssertionError: expected undefined to be true // Object.is equality | tests/routes/replace/replace-undo.test.ts:42:29
- taking a replace back > writes the replaced text back when the undo is taken back | AssertionError: expected undefined to be true // Object.is equality | tests/routes/replace/replace-undo.test.ts:56:29
- taking a replace back > refuses `moved` after a later edit of one file, and writes neither file | AssertionError: expected undefined to be true // Object.is equality | tests/routes/replace/replace-undo.test.ts:65:29
- taking a replace back > says `gone` for a file that is no longer there and `copy-gone` for a copy the history lost | AssertionError: expected undefined to be true // Object.is equality | tests/routes/replace/replace-undo.test.ts:72:22
- taking a replace back > lists the copy a replace kept under the kind `replace` in the file's history | AssertionError: expected undefined to be true // Object.is equality | tests/routes/replace/replace-undo.test.ts:83:23

### tests_server_files_search.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../src/lib/data/helpers/search/query.ts' imported from <unchanged tree>/tests/server/files/search.test.ts

### tests_shell_keys_keys.test.ts
- Test Files  1 failed (1); Tests  6 failed | 53 passed (59)
- Find in Files and Replace in Files > routes Cmd-Shift-f | AssertionError: expected null to deeply equal { kind: 'find-in-files' } | tests/shell/keys/keys.test.ts:292:11
- Find in Files and Replace in Files > routes Cmd-Shift-F | AssertionError: expected null to deeply equal { kind: 'find-in-files' } | tests/shell/keys/keys.test.ts:292:11
- Find in Files and Replace in Files > routes Cmd-Shift-h | AssertionError: expected null to deeply equal { kind: 'replace-in-files' } | tests/shell/keys/keys.test.ts:292:11
- Find in Files and Replace in Files > routes Cmd-Shift-H | AssertionError: expected null to deeply equal { kind: 'replace-in-files' } | tests/shell/keys/keys.test.ts:292:11
- Find in Files and Replace in Files > routes Ctrl-Shift-F, which is Cmd on a keyboard with no Cmd key | AssertionError: expected null to deeply equal { kind: 'find-in-files' } | tests/shell/keys/keys.test.ts:298:11
- Find in Files and Replace in Files > answers with a field being typed in | AssertionError: expected null to deeply equal { kind: 'replace-in-files' } | tests/shell/keys/keys.test.ts:307:11

### tests_shell_keys_workbench-keys.test.ts
- Test Files  1 failed (1); Tests  2 failed | 31 passed (33)
- Find in Files and Replace in Files > opens the Search view and asks for its f box | AssertionError: expected "vi.fn()" to be called once, but got 0 times | tests/shell/keys/workbench-keys.test.ts:575:27
- Find in Files and Replace in Files > opens the Search view and asks for its h box | AssertionError: expected "vi.fn()" to be called once, but got 0 times | tests/shell/keys/workbench-keys.test.ts:575:27

### tests_state_client_config-seed.test.ts
- Test Files  1 failed (1); Tests  1 failed | 32 passed (33)
- the page's config channel > does not hold a seed whose configuration fails its schema, and holds one that reads | AssertionError: expected { config: 'not a map', text: {}, ...(3) } to be null | tests/state/client/config-seed.test.ts:68:42

### tests_state_client_terminal_terminal-start.test.ts
- Test Files  1 failed (1); Tests  1 failed | 19 passed (20)
- New Terminal on the bar > says the refusal on the tab and leaves the tab as it was, with no composer | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/client/terminal/terminal-start.test.ts:218:51

### tests_state_client_writes.test.ts
- Test Files  1 failed (1); Tests  7 failed | 20 passed (27)
- a write's answer > is the refusal sentence with 500 for an error that is a number on a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/client/writes.test.ts:210:20
- a write's answer > is the refusal sentence with 500 for a body that is a list on a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/client/writes.test.ts:210:20
- a write's answer > is the refusal sentence with 500 for a refused that is a string on a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/client/writes.test.ts:210:20
- a write's answer > is a failed read with the unreadable sentence for JSON null on a 200 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/client/writes.test.ts:228:20
- a write's answer > is a failed read with the unreadable sentence for text that is not JSON on a 200 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/client/writes.test.ts:228:20
- a write's answer > is the unreadable sentence with 500 for JSON null on a 500 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/client/writes.test.ts:242:20
- a write's answer > is the unreadable sentence with 500 for text that is not JSON on a 500 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/client/writes.test.ts:242:20

### tests_state_life_memories-message.test.ts
- Test Files  1 failed (1); Tests  5 failed | 22 passed (27)
- the wall read from an answer of the wrong shape > reads a refused request as the refusal sentence, whatever text it carries | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/life/memories-message.test.ts:159:29
- the wall read from an answer of the wrong shape > reads a refusal that is a word of the catalog as that word sentence | AssertionError: expected { images: [], error: 'outside', ...(1) } to strictly equal { images: [], ...(2) } | tests/state/life/memories-message.test.ts:171:58
- the wall read from an answer of the wrong shape > reads a refusal whose error is a number as the refusal sentence | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/life/memories-message.test.ts:177:71
- the wall read from an answer of the wrong shape > reads a body that is JSON null or is not JSON as the unreadable sentence with its status | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/life/memories-message.test.ts:182:33
- the wall read from an answer of the wrong shape > reads a body that is JSON but no map as a list that is missing, or as the refusal sentence | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/life/memories-message.test.ts:191:66

### tests_state_sessions_agents.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: text key not in the text catalog (config/text/): ui.answer_refused

### tests_state_sessions_changes.test.ts
- Test Files  1 failed (1); Tests  5 failed | 21 passed (26)
- the change store > holds the refusal sentence for a refused request and stops waiting | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/changes.test.ts:175:36
- an answer whose fields are of the wrong type > answers a refusal as the refusal sentence, whatever text it carries | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/changes.test.ts:239:43
- an answer whose fields are of the wrong type > answers a refusal that is a word of the catalog as that word sentence | AssertionError: expected { rows: [], more: false, ...(2) } to strictly equal { rows: [], more: false, ...(2) } | tests/state/sessions/changes.test.ts:245:61
- an answer whose fields are of the wrong type > answers a refusal whose error is a number as the refusal sentence | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/changes.test.ts:269:57
- an answer whose fields are of the wrong type > answers a body that is null or not JSON as the unreadable sentence with its status | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/changes.test.ts:275:61

### tests_state_sessions_latex.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: text key not in the text catalog (config/text/): ui.answer_refused

### tests_state_sessions_source.test.ts
- Test Files  1 failed (1); Tests  7 failed | 48 passed (55)
- a file the route refuses > is a failed read that says the refused sentence with the status, and not the status alone | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/source.test.ts:583:20
- a file the route refuses > is a tab that says it cannot open the file, with the refused sentence | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/source.test.ts:590:71
- a tab with no unsaved text read again after its file was written > shows the text the disk holds now, as the saved text too | TypeError: client.source.reloadSource is not a function | tests/state/sessions/source.test.ts:608:29
- a tab with no unsaved text read again after its file was written > asks nothing for a tab holding text the reader typed, and keeps it | TypeError: client.source.reloadSource is not a function | tests/state/sessions/source.test.ts:621:29
- a tab with no unsaved text read again after its file was written > keeps the text typed while the read was out, and moves the saved text to the disk | TypeError: client.source.reloadSource is not a function | tests/state/sessions/source.test.ts:633:41
- a tab with no unsaved text read again after its file was written > writes nothing under a tab its pane closed while the read was out | TypeError: client.source.reloadSource is not a function | tests/state/sessions/source.test.ts:655:41
- a tab with no unsaved text read again after its file was written > leaves the next file's draft alone in a preview tab pointed at it | TypeError: client.source.reloadSource is not a function | tests/state/sessions/source.test.ts:672:41

### tests_state_sessions_terminal_pty-io.test.ts
- Test Files  1 failed (1); Tests  14 failed | 25 passed (39)
- the answer of an action posted to /api/terminal > fails a start answered at 200 with a terminal whose id is a number, in the unreadable sentence | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:86:20
- the answer of an action posted to /api/terminal > fails a start answered at 200 with a terminal whose id is empty, in the unreadable sentence | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:86:20
- the answer of an action posted to /api/terminal > fails a start answered at 200 with a terminal that is a string, in the unreadable sentence | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:86:20
- the answer of an action posted to /api/terminal > fails a start answered at 200 with no terminal beside an id, in the unreadable sentence | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:86:20
- the answer of an action posted to /api/terminal > fails a start answered at 200 with an empty map, in the unreadable sentence | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:86:20
- the answer of an action posted to /api/terminal > is the refusal sentence for an error that is a number in the body of a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/terminal/pty-io.test.ts:100:20
- the answer of an action posted to /api/terminal > is the refusal sentence for a sentence in the body of a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/terminal/pty-io.test.ts:100:20
- the answer of an action posted to /api/terminal > is the refusal sentence for an empty sentence in the body of a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/terminal/pty-io.test.ts:100:20
- the answer of an action posted to /api/terminal > is the refusal sentence for a list in the body of a 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/terminal/pty-io.test.ts:100:20
- the answer of an action posted to /api/terminal > is the catalog sentence for a refusal word in the body of a 400 | AssertionError: expected { ok: false, id: '', error: 'outside' } to strictly equal { ok: false, id: '', ...(1) } | tests/state/sessions/terminal/pty-io.test.ts:106:62
- the answer of an action posted to /api/terminal > is the unreadable sentence with its status for a body that is null on a refusal | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:125:24
- the answer of an action posted to /api/terminal > is the unreadable sentence with its status for a body that is text that is not JSON on a refusal | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:125:24
- the answer of an action posted to /api/terminal > is the unreadable sentence with its status for a body that is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:125:24
- the answer of an action posted to /api/terminal > is the unreadable sentence with its status for a body that is text that is not JSON | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/terminal/pty-io.test.ts:125:24

### tests_state_sessions_terminals.test.ts
- Test Files  1 failed (1); Tests  1 failed | 61 passed (62)
- the four actions of /api/terminal > reports a refusal in the refusal sentence, never in the text the server gave | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/terminals.test.ts:326:60

### tests_state_sessions_transcript.test.ts
- Test Files  1 failed (1); Tests  4 failed | 23 passed (27)
- an answer whose fields are of the wrong type > answers a refusal as the refusal sentence, whatever text it carries | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/transcript.test.ts:284:43
- an answer whose fields are of the wrong type > answers a refusal whose error is a number as the refusal sentence | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sessions/transcript.test.ts:325:20
- an answer whose fields are of the wrong type > answers a body that is null or not JSON as the unreadable sentence with its status | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/transcript.test.ts:331:81
- an answer whose fields are of the wrong type > keeps the turns it holds when a later read answers null or text that is not JSON | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sessions/transcript.test.ts:354:24

### tests_state_shared_instance-state-sources.test.ts
- Test Files  1 failed (1); Tests  35 failed | 313 passed (348)
- heldDiff > answers empty list | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers null | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers undefined | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers string | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers number | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers empty map | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers search 3, reveal empty | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers search s, reveal r, lead space | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers own __proto__ key | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers own __proto__ key alone | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers all wrong | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers valid | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong commit | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong id | AssertionError: expected { id: '', label: 'l', root: 'r', ...(9) } to strictly equal { Object (id, label, ...) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong label | AssertionError: expected { id: 'i', label: '', root: 'r', ...(9) } to strictly equal { Object (id, label, ...) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong root | AssertionError: expected { id: 'i', label: 'l', root: '', ...(9) } to strictly equal { Object (id, label, ...) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong path | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong staged | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong worktree | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong save | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong stash | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong group | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers group empty | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers group null | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong against | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong replace | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers wrong line | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers line zero | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers group changed | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers line NaN | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers line Infinity | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers line negative | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers line fractional | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers empty strings | AssertionError: expected { id: '', label: '', root: '', ...(9) } to strictly equal { id: '', label: '', root: '', ...(10) } | tests/state/shared/instance-fixture.ts:99:32
- heldDiff > answers no booleans | AssertionError: expected { id: 'i', label: 'l', ...(10) } to strictly equal { id: 'i', label: 'l', ...(11) } | tests/state/shared/instance-fixture.ts:99:32

### tests_state_sources_explorer_acts_undo.test.ts
- Test Files  1 failed (1); Tests  2 failed | 10 passed (12)
- the places a taken-back replace wrote > names each file the replace left, by its root and path, and skips one outside every root | TypeError: replacedPlaces is not a function | tests/state/sources/explorer/acts/undo.test.ts:138:13
- the places a taken-back replace wrote > names nothing for any other operation | TypeError: replacedPlaces is not a function | tests/state/sources/explorer/acts/undo.test.ts:143:16

### tests_state_sources_explorer_ops.test.ts
- Test Files  1 failed (1); Tests  3 failed | 35 passed (38)
- the source tabs a replace and its undo read again > shows the replaced text in a clean tab, and keeps the text typed in a tab with unsaved text | TypeError: client.explorer.replace is not a function | tests/state/sources/explorer/ops.test.ts:654:31
- the source tabs a replace and its undo read again > reads again the files a refused replace wrote before it stopped, and none it did not | TypeError: client.explorer.replace is not a function | tests/state/sources/explorer/ops.test.ts:668:31
- the source tabs a replace and its undo read again > shows the old text in a clean tab after the undo of a replace, and keeps typed text | AssertionError: expected { readIn: undefined, ...(13) } to match object { text: 'old', saved: 'old' } | tests/state/sources/explorer/ops.test.ts:691:50

### tests_state_sources_explorer_sections_sections.test.ts
- Test Files  1 failed (1); Tests  1 failed | 16 passed (17)
- the Timeline > keeps a copy a replace made as a row of its own kind, and drops a kind it does not know | AssertionError: expected [] to deeply equal [ { id: 'r', at: 3, size: 1, ...(1) } ] | tests/state/sources/explorer/sections/sections.test.ts:200:22

### tests_state_sources_files.test.ts
- Test Files  1 failed (1); Tests  15 failed | 34 passed (49)
- the files of a project > holds the refusal sentence the endpoint earned instead of the rows | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:175:43
- the answer of the project files endpoint > says the refusal sentence for a refused read {"error":"no such project"} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read {"error":""} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read {"error":null} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read {} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read "x" at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the refusal sentence for a refused read 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:307:80
- the answer of the project files endpoint > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { rows: [], truncated: false, ...(3) } to strictly equal { rows: [], truncated: false, ...(3) } | tests/state/sources/files.test.ts:311:61
- the answer of the project files endpoint > says the refusal sentence for a refused read whose error is not text: {"error":3} | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:320:81
- the answer of the project files endpoint > says the refusal sentence for a refused read whose error is not text: {"error":["a"]} | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/files.test.ts:320:81
- the answer of the project files endpoint > says the unreadable sentence for a refused read whose body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/files.test.ts:329:24
- the answer of the project files endpoint > says the unreadable sentence for a refused read whose body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/files.test.ts:329:24
- the answer of the project files endpoint > says the unreadable sentence for a successful read whose body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/files.test.ts:339:24
- the answer of the project files endpoint > says the unreadable sentence for a successful read whose body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/files.test.ts:339:24

### tests_state_sources_fs_fs-answers.test.ts
- Test Files  1 failed (1); Tests  70 failed | 65 passed (135)
- the answer of 'workspaces' > says the refusal sentence for a refused read: {"error":"origin"} at 403 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: {"error":""} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: {"error":3} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: {"error":["a"]} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: {"error":null} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: {} at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: "x" at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the refusal sentence for a refused read: 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {"error":"origin"} at 403 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {"error":""} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {"error":3} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {"error":["a"]} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {"error":null} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: {} at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: "x" at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'bookmarks' > says the refusal sentence for a refused read: 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {"error":"origin"} at 403 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {"error":""} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {"error":3} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {"error":["a"]} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {"error":null} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: {} at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: "x" at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'notes' > says the refusal sentence for a refused read: 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {"error":"origin"} at 403 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {"error":""} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {"error":3} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {"error":["a"]} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {"error":null} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: {} at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: "x" at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a note' > says the refusal sentence for a refused read: 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {"error":"origin"} at 403 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {"error":""} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {"error":3} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {"error":["a"]} at 404 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {"error":null} at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: {} at 502 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: [] at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: "x" at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'a folder listing' > says the refusal sentence for a refused read: 7 at 500 | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs-answers.test.ts:218:20
- the answer of 'workspaces' > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { current: '', workspaces: [], ...(3) } to strictly equal { current: '', workspaces: [], ...(3) } | tests/state/sources/fs/fs-answers.test.ts:223:71
- the answer of 'workspaces' > holds the unreadable sentence when a refused body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'workspaces' > holds the unreadable sentence when a refused body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'bookmarks' > holds the unreadable sentence when a refused body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'bookmarks' > holds the unreadable sentence when a refused body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'notes' > holds the unreadable sentence when a refused body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'notes' > holds the unreadable sentence when a refused body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'a note' > holds the unreadable sentence when a refused body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'a note' > holds the unreadable sentence when a refused body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'a folder listing' > holds the unreadable sentence when a refused body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'a folder listing' > holds the unreadable sentence when a refused body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:250:24
- the answer of 'workspaces' > holds the unreadable sentence when a successful body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'workspaces' > holds the unreadable sentence when a successful body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'bookmarks' > holds the unreadable sentence when a successful body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'bookmarks' > holds the unreadable sentence when a successful body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'notes' > holds the unreadable sentence when a successful body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'notes' > holds the unreadable sentence when a successful body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'a note' > holds the unreadable sentence when a successful body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'a note' > holds the unreadable sentence when a successful body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'a folder listing' > holds the unreadable sentence when a successful body is null | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'a folder listing' > holds the unreadable sentence when a successful body is <html>gateway</html> | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/sources/fs/fs-answers.test.ts:260:24
- the answer of 'bookmarks' > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { entries: [], schema: [], ...(2) } to strictly equal { entries: [], schema: [], ...(2) } | tests/state/sources/fs/fs-answers.test.ts:223:71
- the answer of 'notes' > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { notes: [], error: 'outside', ...(1) } to strictly equal { notes: [], loading: false, ...(1) } | tests/state/sources/fs/fs-answers.test.ts:223:71
- the answer of 'a note' > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { id: 'n1', title: '', body: '', ...(3) } to strictly equal { id: 'n1', title: '', body: '', ...(3) } | tests/state/sources/fs/fs-answers.test.ts:223:71
- the answer of 'a folder listing' > says the sentence of the catalog for a refused read whose error is one of its words | AssertionError: expected { entries: [], error: 'outside', ...(1) } to strictly equal { entries: [], loading: false, ...(1) } | tests/state/sources/fs/fs-answers.test.ts:223:71

### tests_state_sources_fs_fs.test.ts
- Test Files  1 failed (1); Tests  6 failed | 37 passed (43)
- the store reading the endpoints > holds the sentence of a refused read, rather than an empty folder | AssertionError: expected 'outside' to be 'It is not inside a served root.' // Object.is equality | tests/state/sources/fs/fs.test.ts:187:28
- the store reading the endpoints > holds the refusal sentence of a refused workspaces read | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs.test.ts:204:51
- the store reading the endpoints > keeps the bookmarks drawn and says why when the server refuses the read | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs.test.ts:555:20
- the store reading the endpoints > asks the bookmarks again when the reader asks, without a write to move the round | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs.test.ts:566:50
- the store reading the endpoints > asks the notes again when the reader asks, and the line goes when the read lands | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs.test.ts:584:46
- the store reading the endpoints > asks the workspaces again when the reader asks, and the line goes when the read lands | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/sources/fs/fs.test.ts:599:51

### tests_state_sources_repositories_diff_diff-view.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../../../src/lib/state/sources/repositories/replace-preview.ts' imported from <unchanged tree>/tests/state/sources/repositories/diff/diff-view.test.ts

### tests_state_sources_search_hits.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../../src/lib/data/helpers/search/query.ts' imported from <unchanged tree>/tests/state/sources/search/hits.test.ts

### tests_state_sources_search_search.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../../src/lib/data/helpers/search/query.ts' imported from <unchanged tree>/tests/state/sources/search/search.test.ts

### tests_state_system_deposit.test.ts
- Test Files  1 failed (1); Tests  13 failed | 17 passed (30)
- the mirror of a project > holds the refusal sentence for a refusal whose error is a text of its own | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is an empty text | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is a number | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is null | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is nothing | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is a list body | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the refusal sentence for a refusal whose error is a string body | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:127:24
- the mirror of a project > holds the sentence of the catalog for a refusal that is one of its words | AssertionError: expected { state: null, error: 'missing', ...(1) } to strictly equal { state: null, ...(2) } | tests/state/system/deposit.test.ts:135:30
- the mirror of a project > holds the refusal sentence and no state when a refusal also names a state | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/state/system/deposit.test.ts:144:66
- the mirror of a project > holds the unreadable sentence for 'JSON null' sent with status 200 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/system/deposit.test.ts:177:24
- the mirror of a project > holds the unreadable sentence for 'JSON null' sent with status 500 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/system/deposit.test.ts:177:24
- the mirror of a project > holds the unreadable sentence for 'a page that is no JSON' sent with status 200 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/system/deposit.test.ts:177:24
- the mirror of a project > holds the unreadable sentence for 'a page that is no JSON' sent with status 502 | Error: text key not in the text catalog (config/text/): ui.answer_unreadable | tests/state/system/deposit.test.ts:177:24

### tests_state_system_docs.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: text key not in the text catalog (config/text/): ui.answer_refused

### tests_ui_theme_wall.test.ts
- Test Files  1 failed (1); Tests  1 failed | 3 passed (4)
- the wallpaper rule > answers every surface a component paints, or names it as solid with its reason | AssertionError: expected [ ...(42) ] to deeply equal [ ...(41) ] | tests/ui/theme/wall.test.ts:187:47

### tests_views_boards_project.test.ts
- Test Files  1 failed (1); Tests  1 failed | 30 passed (31)
- the LaTeX panel of a project tab > draws a failed read as the error box, in the refusal sentence, with a retry button | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/views/boards/project.test.ts:430:65

### tests_views_sources_files_files-stored.test.ts
- Test Files  1 failed (1); Tests  3 failed | 11 passed (14)
- a read the server refused > says why the roots could not be read, instead of saying there are none | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/views/sources/files/files-stored.test.ts:71:64
- a read the server refused > says why an open folder could not be listed, instead of drawing it empty | AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'hub could not be read: It is not ther...' | tests/views/sources/files/files-stored.test.ts:97:22
- the reader's own bookmarks and notes > says why the two lists could not be read, and keeps both heads and their add controls | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/views/sources/files/files-stored.test.ts:303:68

### tests_views_sources_files_menu_files-ops.test.ts
- Test Files  1 failed (1); Tests  5 failed | 16 passed (21)
- the sentences of a refused comparison > audits that maps each refusal of the compare to a sentence of files.yml | TypeError: failureSentence is not a function | tests/views/sources/files/menu/files-ops.test.ts:341:16
- the sentences of a refused comparison > says the pane's own failure sentence for a word it does not know | TypeError: failureSentence is not a function | tests/views/sources/files/menu/files-ops.test.ts:353:16
- the sentences of a refused Replace Preview > audits that each word of the replace refusals has its catalog sentence | TypeError: failureSentence is not a function | tests/views/sources/files/menu/files-ops.test.ts:368:30
- the sentences of a refused Replace Preview > says the pane's own failure sentence for a word it does not know | TypeError: failureSentence is not a function | tests/views/sources/files/menu/files-ops.test.ts:377:16
- the sentence of a failed read of any other diff > says the server's own text, and the pane's own failure sentence when it gave none | TypeError: failureSentence is not a function | tests/views/sources/files/menu/files-ops.test.ts:384:16

### tests_views_sources_files_sections_sections.test.ts
- Test Files  1 failed (1); Tests  1 failed | 18 passed (19)
- Timeline > audits that a copy a replace kept is drawn as File Replaced | AssertionError: expected [] to deeply equal [ '20260101T130000000' ] | tests/views/sources/files/sections/sections.test.ts:331:54

### tests_views_sources_note.test.ts
- Test Files  1 failed (1); Tests  2 failed | 14 passed (16)
- one note as its own tab > says why the note could not be read rather than offering an empty one | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/views/sources/note.test.ts:125:63
- one note as its own tab > draws a note that could not be read as the message box | Error: text key not in the text catalog (config/text/): ui.answer_refused | tests/views/sources/note.test.ts:153:63

### tests_views_sources_search.test.ts
- Test Files  1 failed (1); Tests  no tests
- the file did not load: Error: Cannot find module '../../../src/lib/state/sources/search/search.ts' imported from <unchanged tree>/tests/views/sources/search.test.ts

### tests_views_system_help.test.ts
- Test Files  1 failed (1); Tests  2 failed | 20 passed (22)
- the diagram the manual fetches > audits that the diagram is the text of the file, and the refused sentence with the status when the route refuses | TypeError: loadDiagram is not a function | tests/views/system/help.test.ts:364:22
- the diagram the manual fetches > audits that a failed fetch says what it failed with when no answer came | TypeError: loadDiagram is not a function | tests/views/system/help.test.ts:379:28

### tests_views_system_history.test.ts
- Test Files  1 failed (1); Tests  1 failed | 12 passed (13)
- the History view > draws a replace as the number of files it wrote, with the undo control | AssertionError: expected 'data-change="r1" class="svelte-606dyx...' to contain '>Replaced in 1 file</span>' | tests/views/system/history.test.ts:247:27

### tests_views_whole_type-scale.test.ts
- Test Files  1 failed (1); Tests  4 failed | 279 passed (283)
- the view type scale > lists every view file in the audit | AssertionError: expected [ ...(212) ] to deeply equal [ ...(213) ] | tests/views/whole/type-scale.test.ts:367:11
- the view type scale > sets every local role in sources/search/Search.svelte | AssertionError: expected '' to be '.said=fs-sm' // Object.is equality | tests/views/whole/type-scale.test.ts:385:49
- the view type scale > sets every local role in sources/search/ReplaceRow.svelte | Error: ENOENT: no such file or directory, open 'src/lib/views/sources/search/ReplaceRow.svelte' | tests/views/whole/type-scale.test.ts:385:20
- the view type scale > sets every local role in sources/search/Results.svelte | AssertionError: expected '.count=fs-sm | .row=fs-md | .line=fs-...' to be '.count=fs-sm | .line=fs-sm' // Object.is equality | tests/views/whole/type-scale.test.ts:385:49
```

### Appendix R1-B, per-case table of the new cases of search.test.ts, endpoint.test.ts, replace.test.ts, hits.test.ts and tests/server/files/search.test.ts on the unchanged tree (imports pointed at base modules where they exist):

```
FILE tests/state/sources/search/search.test.ts  (imports shimmed because the module does not exist at base: none)
  base run of this file as it is now: 52 passed, 38 failed of 90 cases; 6 cases are new by title, 84 keep a title the base file had
  [KEPT TITLE, BODY EDITED] FAILS | what a tab holds > opens on every root, no option, and the cap the configuration carries
         AssertionError: expected { q: '', root: 'all', ...(7) } to deeply equal { q: '', root: 'all', ...(13) }
         at search.test.ts:31  expect(client.search.searchState('one')).toEqual({
  [KEPT TITLE, BODY EDITED] FAILS | what a tab holds > keeps the query, the toggles and the answer under the instance
         AssertionError: expected { ...(5) } to deeply equal { ...(5) }
         at search.test.ts:59  expect(client.search.searchState('one').answer).toEqual({
  [KEPT TITLE, BODY EDITED] FAILS | what it refuses without asking > carries the server refusal through to the tab
         Error: text key not in the text catalog (config/text/): search.refused_pattern
         at search.test.ts:105  t('search.refused_pattern', 'unclosed group')
  [KEPT TITLE, BODY EDITED] FAILS | what it refuses without asking > runs the held query again once per call, whatever the last answer was
         Error: text key not in the text catalog (config/text/): search.refused_pattern
         at search.test.ts:115  t('search.refused_pattern', 'unclosed group')
  [NEW ] FAILS | an answer read from stored or fetched data > keeps of a hit holding text, a line and a place only what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > keeps of a hit whose column and length are text what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > keeps of a hit whose numbers are not finite what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > keeps of a hit with an empty text and an extra key what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [NEW ] FAILS | an answer read from stored or fetched data > keeps of a hit with groups, one of them a number (left out of the groups) what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [NEW ] FAILS | an answer read from stored or fetched data > keeps of a hit with groups of text what it can read
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:243  expect(held).toStrictEqual(
  [NEW ] FAILS | an answer read from stored or fetched data > reads an answer holding a hit of text and a line only as no answer
         AssertionError: expected { Object (files, total, ...) } to be null
         at search.test.ts:259  expect(answerOf({ files: [fileOf(hits)] })).toBeNull();
  [NEW ] FAILS | an answer read from stored or fetched data > reads an answer holding a hit of a place that is text as no answer
         AssertionError: expected { Object (files, total, ...) } to be null
         at search.test.ts:259  expect(answerOf({ files: [fileOf(hits)] })).toBeNull();
  [NEW ] FAILS | an answer read from stored or fetched data > reads an answer holding a hit of one hit without a place beside one with it as no answer
         AssertionError: expected { Object (files, total, ...) } to be null
         at search.test.ts:259  expect(answerOf({ files: [fileOf(hits)] })).toBeNull();
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is text
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is NaN
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is infinite
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is negative
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is more than the hits
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is a milliseconds text
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is a milliseconds NaN
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is a milliseconds infinity
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is truncated as text
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is truncated as one
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > reads a count that is truncated
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:329  expect(answerOf({ files: [file], ...over })).toStrictEqual(
  [KEPT TITLE, BODY EDITED] FAILS | an answer read from stored or fetched data > answers its fields in one order, and no field it was not asked for
         AssertionError: expected [ 'line', 'column', 'length', 'text' ] to deeply equal [ 'line', 'column', 'length', ...(2) ]
         at search.test.ts:358  expect(Object.keys(held?.files[0].hits[0] ?? {})).toEqual([
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for undefined
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for null
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for []
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for "x"
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for 5
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > opens on the empty state for true
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:385  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a root that is absent
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:396  expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a root that is null
         AssertionError: expected { q: '', root: '', word: false, ...(6) } to strictly equal { q: '', root: '', word: false, ...(12) }
         at search.test.ts:396  expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a root that is a number
         AssertionError: expected { q: '', root: '', word: false, ...(6) } to strictly equal { q: '', root: '', word: false, ...(12) }
         at search.test.ts:396  expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a root that is empty
         AssertionError: expected { q: '', root: '', word: false, ...(6) } to strictly equal { q: '', root: '', word: false, ...(12) }
         at search.test.ts:396  expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a root that is named
         AssertionError: expected { q: '', root: 'hub', ...(7) } to strictly equal { q: '', root: 'hub', ...(13) }
         at search.test.ts:396  expect(parseSearchState(saved, 500)).toStrictEqual({ ...empty, root });
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > reads a field of the wrong type as its default
         AssertionError: expected { q: '', root: 'all', ...(7) } to strictly equal { q: '', root: 'all', ...(13) }
         at search.test.ts:408  expect(parseSearchState(saved, 500)).toStrictEqual(empty);
  [KEPT TITLE, BODY EDITED] FAILS | a saved tab read back > answers its fields in one order, and no field it was not asked for
         AssertionError: expected [ 'q', 'root', 'word', 'case', ...(5) ] to deeply equal [ 'q', 'root', 'word', 'case', ...(11) ]
         at search.test.ts:426  expect(Object.keys(held)).toEqual([
FILE tests/state/sources/search/endpoint.test.ts  (imports shimmed because the module does not exist at base: none)
  base run of this file as it is now: 10 passed, 23 failed of 33 cases; 23 cases are new by title, 10 keep a title the base file had
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body {"error":"bad"} that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body {"error":""} that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body {"error":3} that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body {"error":null} that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body {} that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body [] that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body null that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body "x" that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body 7 that is no word
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:63  expect(await ran(json(body, 400))).toStrictEqual({ error: refused(400), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence with the status of a 500 holding an empty map
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:67  expect(await ran(json({}, 500))).toStrictEqual({ error: refused(500), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence with the status of a 403 that gives a text of its own
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:72  error: refused(403),   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word empty
         AssertionError: expected { error: 'empty', answer: null } to strictly equal { ...(2) }
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word too_long
         AssertionError: expected { error: 'too_long', answer: null } to strictly equal { ...(2) }
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word unknown_root
         AssertionError: expected { error: 'unknown_root', answer: null } to strictly equal { ...(2) }
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word outside
         AssertionError: expected { error: 'outside', answer: null } to strictly equal { ...(2) }
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word missing
         AssertionError: expected { error: 'missing', answer: null } to strictly equal { ...(2) }
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word token
         Error: text key not in the text catalog (config/text/): search.refused_token
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the words of the search for the refusal word timed_out
         Error: text key not in the text catalog (config/text/): search.refused_timed_out
         at endpoint.test.ts:87  expect(held).toStrictEqual({ error: t(key), answer: null });
  [NEW ] FAILS | the answer of the endpoint > says the pattern ripgrep could not read with its reason
         Error: text key not in the text catalog (config/text/): search.refused_pattern
         at endpoint.test.ts:92  expect(held.error).toBe(t('search.refused_pattern', 'unclosed group'));
  [NEW ] FAILS | the answer of the endpoint > says the unreadable sentence for a successful body that is null or not JSON
         Error: text key not in the text catalog (config/text/): ui.answer_unreadable
         at endpoint.test.ts:110  expect(await ran(response)).toStrictEqual({ error: unreadable(200), answer: null });   (raised in tests/fixtures/client.ts:19)
  [NEW ] FAILS | the answer of the endpoint > says the unreadable sentence for a successful body that is null or not JSON
         Error: text key not in the text catalog (config/text/): ui.answer_unreadable
         at endpoint.test.ts:110  expect(await ran(response)).toStrictEqual({ error: unreadable(200), answer: null });   (raised in tests/fixtures/client.ts:19)
  [NEW ] FAILS | the answer of the endpoint > says the refusal sentence for a refused body that is not JSON
         Error: text key not in the text catalog (config/text/): ui.answer_refused
         at endpoint.test.ts:118  expect(held).toStrictEqual({ error: refused(502), answer: null });   (raised in tests/fixtures/client.ts:16)
  [NEW ] FAILS | the folder a tab is scoped to > says a folder the server found missing as the search words, and any other refusal text as the refusal sentence
         AssertionError: expected 'missing' to be 'That folder is not there.' // Object.is equality
         at endpoint.test.ts:166  expect(client.search.searchState('one').error).toBe(t('search.refused_missing'));
FILE tests/state/sources/search/replace.test.ts  (imports shimmed because the module does not exist at base: hits.ts, words.ts)
  base run of this file as it is now: 0 passed, 20 failed of 20 cases; 20 cases are new by title, 0 keep a title the base file had
  [NEW ] FAILS | replacing from a tab > replaces every listed hit under the query the answer was found by and takes them out of the answer
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:96  const result = await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > keeps what a replace said while the replace text changes, and drops it when the query is edited
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:112  await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > drops what a replace said when a toggle changes the query
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:126  await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > replaces one hit and hands back the next row to focus
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:134  const result = await client.search.replaceHits('one', {
  [NEW ] FAILS | replacing from a tab > leaves out a file a source tab holds unsaved text of and names it, and writes nothing for it alone
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:156  await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > asks Replace All over a cut answer about the listed hits only, and sends only them
         TypeError: client.search.replaceQuestion is not a function
         at replace.test.ts:173  const asked = client.search.replaceQuestion('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > leaves a dismissed hit unreplaced by Replace All, and out of the preview
         TypeError: client.search.dismissHits is not a function
         at replace.test.ts:186  client.search.dismissHits('one', { kind: 'hit', file: A, hit: A.hits[0] });
  [NEW ] FAILS | replacing from a tab > opens no preview with the replace row hidden, for a file row, or for a row that is gone
         TypeError: hitKey is not a function
         at replace.test.ts:199  expect(client.search.previewHit('one', hitKey(A, A.hits[0]))).toBe(false);
  [NEW ] FAILS | replacing from a tab > sends one request when Replace All is pressed twice while the first is in flight
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:209  const first = client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > writes into no tab when the tab closed while the replace was out
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:223  const pending = client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > keeps the answer of a newer run when an older replace lands after it
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:236  const pending = client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > writes into no tab when the tab closed while a search was out
         TypeError: client.search.forgetSearch is not a function
         at replace.test.ts:254  client.search.forgetSearch('one');
  [NEW ] FAILS | replacing from a tab > says where a refused replace stopped, with the files done, and keeps the hits it did not write
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:264  await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > says the network failed and keeps the whole answer when the post does not arrive
         TypeError: client.search.replaceHits is not a function
         at replace.test.ts:276  await client.search.replaceHits('one', { kind: 'all' });
  [NEW ] FAILS | replacing from a tab > runs the search again when the word toggle is turned over while results are shown
         TypeError: client.search.toggleMode is not a function
         at replace.test.ts:291  await client.search.toggleMode('one', mode, ['hub']);
  [NEW ] FAILS | replacing from a tab > runs the search again when the case toggle is turned over while results are shown
         TypeError: client.search.toggleMode is not a function
         at replace.test.ts:291  await client.search.toggleMode('one', mode, ['hub']);
  [NEW ] FAILS | replacing from a tab > runs the search again when the regex toggle is turned over while results are shown
         TypeError: client.search.toggleMode is not a function
         at replace.test.ts:291  await client.search.toggleMode('one', mode, ['hub']);
  [NEW ] FAILS | replacing from a tab > only turns the toggle over when no results are shown
         TypeError: client.search.toggleMode is not a function
         at replace.test.ts:300  await client.search.toggleMode('one', 'regex', ['hub']);
  [NEW ] FAILS | replacing from a tab > previews and replaces with the regex replacement once regex is turned on over a literal run
         TypeError: client.search.toggleMode is not a function
         at replace.test.ts:310  await client.search.toggleMode('one', 'regex', ['hub']);
  [NEW ] FAILS | replacing from a tab > opens the replace row when the replace box is asked for, and the query box without it
         TypeError: client.search.wantFocus is not a function
         at replace.test.ts:328  client.search.wantFocus('one', 'query');
FILE tests/state/sources/search/hits.test.ts  (imports shimmed because the module does not exist at base: hits.ts, keys.ts, walk.ts)
  base run of this file as it is now: 0 passed, 12 failed of 12 cases; 12 cases are new by title, 0 keep a title the base file had
  [NEW ] FAILS | the hits the results rows act on > a hit is named by its place, so two matches of one long line cut to one column are two rows
         TypeError: hitKey is not a function
         at hits.test.ts:30  expect(new Set(cut.map((one) => hitKey(file, one))).size).toBe(2);
  [NEW ] FAILS | the hits the results rows act on > each hit is sent with the text it covered, and the query the answer was found by
         TypeError: replaceRequest is not a function
         at hits.test.ts:34  expect(replaceRequest(RAN, { replace: 'bar', preserve: true }, [B])).toEqual({
  [NEW ] FAILS | the hits the results rows act on > a replacement is shown as the server writes it, a line break as \n, and none before the groups are known
         TypeError: replacementShown is not a function
         at hits.test.ts:46  expect(replacementShown(grouped, settings)).toBe('a\\nb');
  [NEW ] FAILS | the hits the results rows act on > the focus moves to the row after the rows taken, else the row before them
         TypeError: rowAfter is not a function
         at hits.test.ts:52  expect(rowAfter(FILES, [{ ...A, hits: [A.hits[1]] }])).toBe(fileKey(B));
  [NEW ] FAILS | the keys of the results rows > Cmd+Shift+1, Cmd+Shift+Enter and Cmd+Backspace are bound on macOS, with Delete on the other platforms
         TypeError: searchKeymap is not a function
         at hits.test.ts:69  expect(searchKeymap(true)).toEqual([
  [NEW ] FAILS | the keys of the results rows > a row replaces only while the replace row is shown, and dismisses on every row
         TypeError: searchPlan is not a function
         at hits.test.ts:82  expect(searchPlan('replace', 'hit', true)).toBe('replace-hit');
  [NEW ] FAILS | walking the texts a box ran > Up goes older, Down goes newer, and past the newest the text being typed comes back
         TypeError: createWalk is not a function
         at hits.test.ts:99  const walk = createWalk();
  [NEW ] FAILS | walking the texts a box ran > the walk stops at the oldest text, has nothing to walk with no texts, and starts again after a reset
         TypeError: createWalk is not a function
         at hits.test.ts:108  const walk = createWalk();
  [NEW ] FAILS | what a tab remembers of a run > the text goes first, an earlier copy is taken out, and no empty text is kept
         TypeError: (0 , __vite_ssr_import_2__.remembered) is not a function
         at hits.test.ts:119  expect(remembered(['b', 'a'], 'a')).toEqual(['a', 'b']);
  [NEW ] FAILS | what a tab remembers of a run > the twenty newest texts are kept
         TypeError: (0 , __vite_ssr_import_2__.remembered) is not a function
         at hits.test.ts:126  const kept = remembered(texts, 'new');
  [NEW ] FAILS | what a tab remembers of a run > the query half a replace is made over is named without the root and the cap
         TypeError: (0 , __vite_ssr_import_2__.ranOf) is not a function
         at hits.test.ts:133  expect(ranOf(query)).toEqual({
  [NEW ] FAILS | what a tab remembers of a run > the text a hit matched is read from group 0 when the window cut it, else from the window
         TypeError: (0 , __vite_ssr_import_2__.matchOf) is not a function
         at hits.test.ts:144  expect(matchOf(hit)).toBe('foo');
FILE tests/server/files/search.test.ts  (imports shimmed because the module does not exist at base: hits.ts)
  base run of this file as it is now: 25 passed, 12 failed of 37 cases; 3 cases are new by title, 34 keep a title the base file had
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream > folds matches into files with their line, column, length and text
         AssertionError: expected { ...(3) } to deeply equal { ...(3) }
         at search.test.ts:204  expect(await foldedBy(stream)).toEqual({
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream > counts a column in characters where the line carries more bytes than characters
         AssertionError: expected undefined to be 3 // Object.is equality
         at search.test.ts:236  expect(hit.at).toBe(3);
  [KEPT TITLE, BODY EDITED] FAILS | the answer > answers the last line of the reason when a root failed and nothing was found
         AssertionError: expected { ok: false, ...(1) } to deeply equal { ok: false, ...(2) }
         at search.test.ts:373  expect(outcome).toEqual({ ok: false, error: 'error: unclosed group', timedOut: false });
  [KEPT TITLE, BODY EDITED] FAILS | the answer > ends at the timeout when the runner never answers
         AssertionError: expected { ok: false, ...(1) } to deeply equal { ok: false, ...(2) }
         at search.test.ts:425  expect(outcome).toEqual({ ok: false, error: TIMED_OUT, timedOut: true });
  [KEPT TITLE, BODY EDITED] FAILS | the binary the dependency carries > finds a literal, and misses on a word boundary and on a case, over three real files
         AssertionError: expected { line: 1, column: 3, length: 6, ...(1) } to deeply equal { line: 1, column: 3, length: 6, ...(2) }
         at search.test.ts:460  expect(hit).toEqual({ line: 1, column: 3, length: 6, text: 'a needle in here', at: 2 });
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream with records of an odd shape > reads a hit at column 1 of length 0 when its first submatch is not an object holding a match
         AssertionError: "x": expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:595  ).toStrictEqual(one(BARE));
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream with records of an odd shape > takes the count of an end record only when matched_lines is a number
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:601  expect(await folded(begin, matchWith({}), endWith(stats))).toStrictEqual(one(WHOLE));
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream with records of an odd shape > keeps a count, a line number and an offset of infinity as numbers
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:612  ).toStrictEqual(one(WHOLE, true));
  [KEPT TITLE, BODY EDITED] FAILS | the JSON stream with records of an odd shape > skips a line that is not JSON, a list, a number, null and a record whose data is a list
         AssertionError: expected { Object (files, total, ...) } to strictly equal { Object (files, total, ...) }
         at search.test.ts:633  ).toStrictEqual(one(WHOLE));
  [NEW ] FAILS | the folder a search is scoped to > answers the route a 400 with the refusal word, which the page words from its catalog
         AssertionError: expected [ ...(3) ] to deeply equal [ 'outside', 'missing', 'outside' ]
         at search.test.ts:723  expect(words).toEqual(['outside', 'missing', 'outside']);
  [NEW ] FAILS | a line longer than a hit row is wide, with the real binary > answers two matches of one long line as two hits that differ in `at` though the windows s
         AssertionError: expected [ { line: 1, column: 119, ...(2) } ] to have a length of 2 but got 1
         at search.test.ts:751  expect(hits).toHaveLength(2);
  [NEW ] FAILS | a line longer than a hit row is wide, with the real binary > carries a match longer than the window whole as group 0, in both modes
         AssertionError: expected undefined to deeply equal { Object (0) }
         at search.test.ts:771  expect(byPath('long.txt')?.groups).toEqual({ '0': long });
```

### Appendix R1-C, the kept cases of the two files whose titles base had, run on the unchanged tree:

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32b/basetree


 Test Files  2 passed (2)
      Tests  143 passed (143)
   Start at  17:47:30
   Duration  51.35s (transform 29.39s, setup 0ms, import 52.12s, tests 544ms, environment 0ms)

```

### Appendix R1-D, the 2000-hit preview on the round's starting tree, over a real http server, with the address form:

```
 FAIL  |unit| tests/routes/replace/preview-size.test.ts > start tree > answers a preview of 2000 hits in one file over a real http server
AssertionError: expected 431 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 431

 > tests/routes/replace/preview-size.test.ts:29:33
     27|         const response = await fetch(`http://127.0.0.1:${port}${addres...
     28|         server.close();
     29|         expect(response.status).toBe(200);
       |                                 ^
     30|     });
     31| });

------------------------[1/1]-


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  17:18:18
   Duration  2.96s (transform 548ms, setup 0ms, import 2.11s, tests 406ms, environment 0ms)

```

### Appendix R1-E, tests_routes_replace_preview on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/routes/replace/preview.test.ts (9 tests | 8 failed) 2061ms
     x holds the file as it is on the left and the file with the named matches replaced on the right 505ms
     x leaves a match it was not named for unreplaced, which is how a dismissed hit stays 198ms
     x shows another replace text in a second preview of the same file 179ms
     x leaves a named match that is no longer in the file unreplaced instead of refusing the preview 246ms
     x applies the groups, the case and the line ends the write would 170ms
     x refuses with the word of the check: binary, missing, outside, protected and bad-query 129ms
     x previews 2000 hits in one file, which an address of the hits could not carry 135ms
     x refuses a preview posted without the write token and reads nothing 181ms

------- Failed Tests 8 -------

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > holds the file as it is on the left and the file with the named matches replaced on the right
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > tests/routes/replace/preview.test.ts:31:30

------------------------[1/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > leaves a match it was not named for unreplaced, which is how a dismissed hit stays
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > tests/routes/replace/preview.test.ts:47:30

------------------------[2/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > shows another replace text in a second preview of the same file
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > tests/routes/replace/preview.test.ts:56:29

------------------------[3/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > leaves a named match that is no longer in the file unreplaced instead of refusing the preview
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > tests/routes/replace/preview.test.ts:63:30

------------------------[4/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > applies the groups, the case and the line ends the write would
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > tests/routes/replace/preview.test.ts:73:30

------------------------[5/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview of a replace in one file > refuses with the word of the check: binary, missing, outside, protected and bad-query
TypeError: previewRequest is not a function
 > previewPost tests/routes/replace/replace-fixture.ts:119:23
    117|     preserveCase = false
    118| ) {
    119|     return opsPost(w, previewRequest(place, { query, replace, preserve...
       |                       ^
    120| }
    121|
 > word tests/routes/replace/preview.test.ts:87:20
 > tests/routes/replace/preview.test.ts:89:22

------------------------[6/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview request > previews 2000 hits in one file, which an address of the hits could not carry
TypeError: previewRequest is not a function
 > tests/routes/replace/preview.test.ts:136:25
    134|         const w = replaceWorld({ 'a.txt': `${'foo '.repeat(count)}\n` ...
    135|         const hits = Array.from({ length: count }, (_, index) => ({ li...
    136|         const message = previewRequest(place, {
       |                         ^
    137|             query: queryOf('foo'),
    138|             replace: 'bar',

------------------------[7/8]-

 FAIL  |unit| tests/routes/replace/preview.test.ts > the preview request > refuses a preview posted without the write token and reads nothing
TypeError: previewRequest is not a function
 > tests/routes/replace/preview.test.ts:149:25
    147|     it('refuses a preview posted without the write token and reads not...
    148|         const w = replaceWorld({ 'a.txt': 'foo\n' });
    149|         const message = previewRequest(place, {
       |                         ^
    150|             query: queryOf('foo'),
    151|             replace: 'bar',

------------------------[8/8]-


 Test Files  1 failed (1)
      Tests  8 failed | 1 passed (9)
   Start at  18:12:55
   Duration  26.86s (transform 4.05s, setup 0ms, import 22.99s, tests 2.06s, environment 1ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  18:17:54
   Duration  7.98s (transform 1.36s, setup 0ms, import 4.06s, tests 3.70s, environment 0ms)

```

### Appendix R1-E, tests_state_sources_repositories_diff_diff-read on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/state/sources/repositories/diff/diff-read.test.ts (8 tests | 8 failed) 6ms
     x posts a Replace Preview with the write token and its hits in the body 4ms
     x gets any other diff by its address, with no token and no body 0ms
     x draws nothing when the pane closed while a preview read was out 0ms
     x draws no failure either when the pane closed while the read threw 0ms
     x draws only the later answer when two previews were pressed in a row 0ms
     x draws a read that answered, and a read that threw as the failure 0ms
     x holds the files of every path read, in order 0ms
     x is the first answer that failed when a path could not be read 0ms

------- Failed Tests 8 -------

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the request of a diff read > posts a Replace Preview with the write token and its hits in the body
TypeError: diffRequest is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:71:25
     69| describe('the request of a diff read', () => {
     70|     it('posts a Replace Preview with the write token and its hits in t...
     71|         const request = diffRequest(PREVIEW, 'tok');
       |                         ^
     72|         expect(request.url).toBe('/api/ops');
     73|         expect(request.init?.method).toBe('POST');

------------------------[1/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the request of a diff read > gets any other diff by its address, with no token and no body
TypeError: diffRequest is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:87:25
     85|
     86|     it('gets any other diff by its address, with no token and no body'...
     87|         const request = diffRequest(
       |                         ^
     88|             diffState({ root: 'hub', path: 'a.ts', staged: true, workt...
     89|             'tok'

------------------------[2/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the reads of a pane > draws nothing when the pane closed while a preview read was out
TypeError: diffReader is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:99:24
     97|     it('draws nothing when the pane closed while a preview read was ou...
     98|         const { read, waiting } = held();
     99|         const reader = diffReader(read);
       |                        ^
    100|         const { draw, drawn } = recorder();
    101|         const pending = reader.load(PREVIEW, draw);

------------------------[3/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the reads of a pane > draws no failure either when the pane closed while the read threw
TypeError: diffReader is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:109:24
    107|
    108|     it('draws no failure either when the pane closed while the read th...
    109|         const reader = diffReader(() => Promise.reject(new Error('down...
       |                        ^
    110|         const { draw, drawn } = recorder();
    111|         const pending = reader.load(PREVIEW, draw);

------------------------[4/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the reads of a pane > draws only the later answer when two previews were pressed in a row
TypeError: diffReader is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:119:24
    117|     it('draws only the later answer when two previews were pressed in ...
    118|         const { read, waiting } = held();
    119|         const reader = diffReader(read);
       |                        ^
    120|         const { draw, drawn } = recorder();
    121|         const first = reader.load(PREVIEW, draw);

------------------------[5/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the reads of a pane > draws a read that answered, and a read that threw as the failure
TypeError: diffReader is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:132:19
    130|         const ok = recorder();
    131|         expect(
    132|             await diffReader(() => Promise.resolve(answered('bar\n')))...
       |                   ^
    133|         ).toBe(true);
    134|         const down = recorder();

------------------------[6/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the answer of a group read > holds the files of every path read, in order
TypeError: groupAnswer is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:144:22
    142| describe('the answer of a group read', () => {
    143|     it('holds the files of every path read, in order', () => {
    144|         const read = groupAnswer([answered('one\n'), answered('two\n')...
       |                      ^
    145|         expect(read.ok).toBe(true);
    146|         expect(read.files?.map((file) => file.modified)).toEqual(['one...

------------------------[7/8]-

 FAIL  |unit| tests/state/sources/repositories/diff/diff-read.test.ts > the answer of a group read > is the first answer that failed when a path could not be read
TypeError: groupAnswer is not a function
 > tests/state/sources/repositories/diff/diff-read.test.ts:151:16
    149|     it('is the first answer that failed when a path could not be read'...
    150|         const failed: DiffAnswer = { ...answered('x'), ok: false, file...
    151|         expect(groupAnswer([answered('one\n'), failed, answered('two\n...
       |                ^
    152|     });
    153| });

------------------------[8/8]-


 Test Files  1 failed (1)
      Tests  8 failed (8)
   Start at  18:39:09
   Duration  5.28s (transform 1.01s, setup 0ms, import 4.67s, tests 6ms, environment 0ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  18:39:21
   Duration  2.08s (transform 581ms, setup 0ms, import 1.73s, tests 5ms, environment 0ms)

```

### Appendix R1-E, tests_state_sources_repositories_diff_diff-view on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/state/sources/repositories/diff/diff-view.test.ts (15 tests | 1 failed) 37ms
     x reads the preview by a POST of its query, replace text and hits, and acts on no hunks 3ms

------- Failed Tests 1 -------

 FAIL  |unit| tests/state/sources/repositories/diff/diff-view.test.ts > a diff pane previewing a replace > reads the preview by a POST of its query, replace text and hits, and acts on no hunks
TypeError: diffRequest is not a function
 > tests/state/sources/repositories/diff/diff-view.test.ts:255:25
    253|
    254|     it('reads the preview by a POST of its query, replace text and hit...
    255|         const request = diffRequest(subject, 'tok');
       |                         ^
    256|         expect([request.url, request.init?.method]).toEqual(['/api/ops...
    257|         expect(JSON.parse(request.init?.body ?? '')).toEqual({

------------------------[1/1]-


 Test Files  1 failed (1)
      Tests  1 failed | 14 passed (15)
   Start at  18:14:10
   Duration  5.96s (transform 2.62s, setup 0ms, import 5.56s, tests 37ms, environment 1ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  18:18:19
   Duration  2.91s (transform 761ms, setup 0ms, import 2.12s, tests 14ms, environment 1ms)

```

### Appendix R1-E, tests_state_sources_search_replace on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/state/sources/search/replace.test.ts (20 tests | 7 failed) 198ms
     x keeps what a replace said while the replace text changes, and drops it when the query is edited 13ms
     x drops what a replace said when a toggle changes the query 11ms
     x runs the search again when the word toggle is turned over while results are shown 4ms
     x runs the search again when the case toggle is turned over while results are shown 6ms
     x runs the search again when the regex toggle is turned over while results are shown 11ms
     x only turns the toggle over when no results are shown 3ms
     x previews and replaces with the regex replacement once regex is turned on over a literal run 4ms

------- Failed Tests 7 -------

 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > keeps what a replace said while the replace text changes, and drops it when the query is edited
AssertionError: expected { ...(2) } to be null

- Expected:
null

+ Received:
{
  "refused": false,
  "text": "Replaced 3 occurrences across 2 files with 'bar'.",
}

 > tests/state/sources/search/replace.test.ts:120:50
    118|         expect(client.search.replaceSaid('one')).toEqual(said);
    119|         client.search.setSearchState('one', { q: 'foos' });
    120|         expect(client.search.replaceSaid('one')).toBeNull();
       |                                                  ^
    121|     });
    122|

------------------------[1/7]-

 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > drops what a replace said when a toggle changes the query
TypeError: client.search.toggleMode is not a function
 > tests/state/sources/search/replace.test.ts:127:29
    125|         armed();
    126|         await client.search.replaceHits('one', { kind: 'all' });
    127|         await client.search.toggleMode('one', 'word', ['hub']);
       |                             ^
    128|         expect(client.search.replaceSaid('one')).toBeNull();
    129|     });

------------------------[2/7]-

 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > runs the search again when the word toggle is turned over while results are shown
 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > runs the search again when the case toggle is turned over while results are shown
 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > runs the search again when the regex toggle is turned over while results are shown
TypeError: client.search.toggleMode is not a function
 > tests/state/sources/search/replace.test.ts:291:33
    289|             client.search.setSearchState('one', { q: 'foo', replacing:...
    290|             await client.search.runSearch('one', ['hub']);
    291|             await client.search.toggleMode('one', mode, ['hub']);
       |                                 ^
    292|             expect(searched).toHaveLength(2);
    293|             expect(client.search.searchState('one')[mode]).toBe(true);

------------------------[3/7]-

 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > only turns the toggle over when no results are shown
TypeError: client.search.toggleMode is not a function
 > tests/state/sources/search/replace.test.ts:300:29
    298|     it('only turns the toggle over when no results are shown', async (...
    299|         serve(wrote);
    300|         await client.search.toggleMode('one', 'regex', ['hub']);
       |                             ^
    301|         expect(searched).toEqual([]);
    302|         expect(client.search.searchState('one').regex).toBe(true);

------------------------[4/7]-

 FAIL  |unit| tests/state/sources/search/replace.test.ts > replacing from a tab > previews and replaces with the regex replacement once regex is turned on over a literal run
TypeError: client.search.toggleMode is not a function
 > tests/state/sources/search/replace.test.ts:310:29
    308|         client.search.setSearchState('one', { q: 'foo', replacing: tru...
    309|         await client.search.runSearch('one', ['hub']);
    310|         await client.search.toggleMode('one', 'regex', ['hub']);
       |                             ^
    311|         client.search.setSearchState('one', { replace: '[$1]' });
    312|         expect(searched.at(-1)).toContain('regex=1');

------------------------[5/7]-


 Test Files  1 failed (1)
      Tests  7 failed | 13 passed (20)
   Start at  18:14:31
   Duration  26.63s (transform 10.19s, setup 0ms, import 26.06s, tests 198ms, environment 0ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  18:18:28
   Duration  32.86s (transform 12.22s, setup 0ms, import 32.46s, tests 126ms, environment 0ms)

```

### Appendix R1-E, tests_views_sources_search on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/views/sources/search.test.ts (30 tests | 1 failed) 460ms
     x says what a Replace All came to in place of the count line, with no paragraph of its own 87ms

------- Failed Tests 1 -------

 FAIL  |unit| tests/views/sources/search.test.ts > the replace row and the hits with it > says what a Replace All came to in place of the count line, with no paragraph of its own
AssertionError: expected '' to contain 'Replaced 3 occurrences across 2 files...'

- Expected
+ Received

- Replaced 3 occurrences across 2 files with 'pin'.

 > tests/views/sources/search.test.ts:378:60
    376|         await client.search.replaceHits(instance.id, { kind: 'all' });
    377|         const body = render(Search, { context: clientContext(client), ...
    378|         expect(between(body, 'data-search-count', '</p>')).toContain(
       |                                                            ^
    379|             "Replaced 3 occurrences across 2 files with 'pin'."
    380|         );

------------------------[1/1]-


 Test Files  1 failed (1)
      Tests  1 failed | 29 passed (30)
   Start at  18:15:06
   Duration  74.39s (transform 28.53s, setup 0ms, import 73.49s, tests 460ms, environment 1ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  30 passed (30)
   Start at  18:19:06
   Duration  38.32s (transform 14.92s, setup 0ms, import 37.63s, tests 234ms, environment 0ms)

```

### Appendix R1-E, tests_checks_utils_outside-paths on the starting tree (first block) and on the tree now (second block)

```

 RUN  v4.1.11 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d32r1/start

 > |unit| tests/checks/utils/outside-paths.test.ts (20 tests | 5 failed) 9934ms
     x takes the tokens of a bullet outside its parentheses and none inside them 907ms
     x takes every token of a bullet that does not start with one, and a token that holds parentheses 2ms
     x leaves a folder named in prose out of the list, so a path under it is printed 1ms
     x takes no folder named in a parenthesis or a paragraph of its prose as an entry 1ms
     x prints the state/sources/search files, the moved test folder and the other paths it does not name 3ms

------- Failed Tests 5 -------

 FAIL  |unit| tests/checks/utils/outside-paths.test.ts > the bullets that name entries > takes the tokens of a bullet outside its parentheses and none inside them
AssertionError: expected [ 'src/b.ts' ] to deeply equal [ 'lib/x.ts', 'src/b.ts' ]

- Expected
+ Received

  [
-   "lib/x.ts",
    "src/b.ts",
  ]

 > tests/checks/utils/outside-paths.test.ts:183:26
    181|         put(dir, 'src/b.ts', 'two\n');
    182|         const held = report(dir, brief(['`src/a.ts` (its shared types ...
    183|         expect(held.out).toEqual(['lib/x.ts', 'src/b.ts']);
       |                          ^
    184|     });
    185|

------------------------[1/5]-

 FAIL  |unit| tests/checks/utils/outside-paths.test.ts > the bullets that name entries > takes every token of a bullet that does not start with one, and a token that holds parentheses
AssertionError: expected [ 'src/one.ts', ...(7) ] to deeply equal [ 'src/one.ts', ...(3) ]

- Expected
+ Received

  [
    "src/one.ts",
    "src/(group)/two.ts",
+   "tests/one.ts",
    "lib/",
    "docs/",
+   "elsewhere/",
+   "prose/",
+   "prose.ts",
  ]

 > tests/checks/utils/outside-paths.test.ts:195:25
    193|             ].join('\n')
    194|         );
    195|         expect(entries).toEqual(['src/one.ts', 'src/(group)/two.ts', '...
       |                         ^
    196|     });
    197|

------------------------[2/5]-

 FAIL  |unit| tests/checks/utils/outside-paths.test.ts > the bullets that name entries > leaves a folder named in prose out of the list, so a path under it is printed
AssertionError: expected [] to deeply equal [ 'x/state/b.ts' ]

- Expected
+ Received

- [
-   "x/state/b.ts",
- ]
+ []

 > tests/checks/utils/outside-paths.test.ts:202:60
    200|             sectionOf(`## Paths this step writes\n\n- \`a.ts\` (kept i...
    201|         );
    202|         expect(outside(['x/state/b.ts', 'a.ts'], entries)).toEqual(['x...
       |                                                            ^
    203|     });
    204| });

------------------------[3/5]-

 FAIL  |unit| tests/checks/utils/outside-paths.test.ts > the brief of step D32 read as the reviewer read it > takes no folder named in a parenthesis or a paragraph of its prose as an entry
AssertionError: expected [ ...(70) ] to not include 'state/'
 > tests/checks/utils/outside-paths.test.ts:241:33
    239|         for (const prose of ['state/', 'tests/state/sources/', 'tests/...
    240|             // these folders stand in a parenthesis or a paragraph of ...
    241|             expect(entries).not.toContain(prose);
       |                                 ^
    242|         }
    243|     });

------------------------[4/5]-

 FAIL  |unit| tests/checks/utils/outside-paths.test.ts > the brief of step D32 read as the reviewer read it > prints the state/sources/search files, the moved test folder and the other paths it does not name
AssertionError: expected [] to deeply equal [ ...(13) ]

- Expected
+ Received

- [
-   "tools/oculus/src/lib/state/client/context.ts",
-   "tools/oculus/src/lib/state/shared/answers/answers.ts",
-   "tools/oculus/src/lib/state/sources/explorer/acts/undo.ts",
-   "tools/oculus/src/lib/state/sources/explorer/follow.ts",
-   "tools/oculus/src/lib/state/sources/search/hits.ts",
-   "tools/oculus/src/lib/state/sources/search/keys.ts",
-   "tools/oculus/src/lib/state/sources/search/search.svelte.ts",
-   "tools/oculus/src/lib/state/sources/search/search.ts",
-   "tools/oculus/src/lib/state/sources/search/walk.ts",
-   "tools/oculus/src/lib/state/sources/search/words.ts",
-   "tools/oculus/tests/state/shared/instance-state-sources.test.ts",
-   "tools/oculus/tests/state/sources/repositories/diff/diff-view.test.ts",
-   "tools/oculus/tests/state/sources/search/search.test.ts",
- ]
+ []

 > tests/checks/utils/outside-paths.test.ts:247:43
    245|     it('prints the state/sources/search files, the moved test folder a...
    246|         const entries = entriesOf(sectionOf(brief) ?? '');
    247|         expect(outside(changed, entries)).toEqual(
       |                                           ^
    248|             [
    249|                 'src/lib/state/client/context.ts',

------------------------[5/5]-


 Test Files  1 failed (1)
      Tests  5 failed | 15 passed (20)
   Start at  18:17:27
   Duration  11.11s (transform 204ms, setup 0ms, import 727ms, tests 9.93s, environment 0ms)


--- now ---

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/D32/tools/oculus


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  18:20:02
   Duration  23.77s (transform 189ms, setup 0ms, import 364ms, tests 22.40s, environment 0ms)

```


## Repair round 1 (the builder's final message, saved by the orchestrator; the builder's Write was refused for this file)

All 15 rulings DONE. Ruling 15 reads more than its text (item 1 below). `checks.sh` ended `checks: 7 commands passed` when run from tools/oculus of the worktree.

NOT DONE or differing from the ruling text
1. Ruling 15: entriesOf (utils/outside-paths.mjs:82) takes every backticked token of a `- ` bullet outside parentheses anywhere in the bullet, not only the first clause before ` (`. They differ for a bullet like `- \`a\` (note), \`b\``. Reason: bullets such as "the files of item 20: a, b" list entries after a colon. With this reading, outside-calc.mjs gives 65 entries, 143 changed paths, 61 paths outside the list. The literal first-clause reading is a one-line change plus the test at tests/checks/utils/outside-paths.test.ts:186.
2. The outside-paths test reads .scratch/migration/agents/briefs/D32.md at run time (outside-paths.test.ts:208). If that brief is moved or archived, the test fails on a missing file.
3. The committed 2000-hit test (preview.test.ts:132) fails on the starting tree with `TypeError: previewRequest is not a function`. The 431 itself comes from a throwaway preview-size.test.ts on the old GET form (Appendix R1-D): `AssertionError: expected 431 to be 200` at preview-size.test.ts:29. The toggle tests fail on the starting tree at `toggleMode is not a function`.
4. The origin rule on the preview is not tested for the preview specifically. It is src/hooks.server.ts for every /api route, covered generically by tests/server/root/hooks-server.test.ts. The write token is tested for the preview at preview.test.ts:147.
5. Git: I ran `git -C . status` and `git -C /nonexistent status` by mistake. I discarded the output and nothing changed. No other git was run except inside the outside-paths test's scratch repositories. config/local.yml was not opened, printed, grepped or hashed.

VERIFY LIST
Command, from tools/oculus of the worktree: sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md (output in /tmp/d32r1/checks-final.txt)
- npm test: Test Files 483 passed | 24 skipped (507); Tests 12313 passed | 637 skipped (12950)
- npm run test:checks: Test Files 30 passed | 2 skipped (32); Tests 466 passed | 9 skipped (475)
- npm run check: COMPLETED 3113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
- npm run build, npm run format:check ("All matched files use Prettier code style!"), npm run lint, `! LC_ALL=C grep -rna '[^ -~]' src tests`: all passed
- checks: 7 commands passed
- Also run after the last source change: npm run diagrams exit 0; sh utils/unused-exports.sh exit 0 with 238 unused exports against 241 on the unchanged tree, none of the 14 ruling-9 names among them, and no (file, name) pair that the unchanged tree's list lacks; `ls src/lib/state/sources/repositories | wc -l` gives 10 (the cap).
- Earlier full runs timed out on config-key.test.ts, autofetch.test.ts and chords.test.ts under machine load (load average near 22 from other builders). Those three pass alone: 102 tests (/tmp/d32r1/three-alone.txt).

RULINGS
1. DONE. OpsRequest has a `preview` variant (src/lib/data/file-ops.ts:142); previewRequest builds it (:264). Server: src/lib/server/files/fs/ops.ts:195 schema, :682 dispatch, :777 `previewed`, after tokenedBody (:674) checks the write token, outside the write chain. GET /api/ops is only the compare route (src/routes/api/(files)/ops/+server.ts:33). previewUrl, handlePreview and the preview branch of diffUrl are removed. The only caller is diffRequest (src/lib/state/sources/repositories/answers.ts:237), used at Diff.svelte:182.
2. DONE. diff-read.test.ts:97 (pane closed while the read was out), :108 (closed while the read threw), :117 (two previews in a row, only the later drawn). The logic is diffReader (answers.ts:264), used at Diff.svelte:171 and closed at :392; Diff.svelte cannot be mounted in unit tests.
3. DONE. toggleMode (src/lib/state/sources/search/search.svelte.ts:192) flips the toggle and re-runs when an answer is shown; Search.svelte:139 calls it. Tests: replace.test.ts:284 (word, case, regex), :298 (no re-run without results), :305 (literal foo, regex on, [$1] typed, preview and Replace use the regex replacement).
4. DONE. DESIGN.md:130 says a pattern ripgrep cannot read answers 400 with error 'pattern' and ripgrep's one-line reason, shown as is, "the one refusal of the Search view whose text is shown".
5. DONE. The `said` prop of Results.svelte (:56, drawn :135-145) replaces the count line; the separate paragraph and its CSS are removed from Search.svelte. Test: tests/views/sources/search.test.ts:366.
6. DONE. Per-case table in Appendix R1-B, each case marked NEW or KEPT TITLE with its failing assertion and line, and "module does not exist at base" per shimmed module. Base-run totals of the current files: search.test.ts 52 passed, 38 failed of 90; endpoint.test.ts 10 passed, 23 failed of 33; replace.test.ts 0 passed, 20 failed of 20 (hits.ts, words.ts absent at base); hits.test.ts 0 passed, 12 failed of 12 (hits.ts, keys.ts, walk.ts absent); tests/server/files/search.test.ts 25 passed, 12 failed of 37 (hits.ts absent). Example: search.test.ts:259 `expect(answerOf({ files: [fileOf(hits)] })).toBeNull();` fails with "expected { Object (files, total, ...) } to be null". The base's own two search test files pass on the unchanged tree: 143 passed (R1-C).
7. DONE. First-run output and per-test tables are in this report as R1-A and R1-B (plus R1-C to R1-E).
8. DONE. The doc comment at tests/data/helpers/replace.test.ts:22-24 now sits on groupsOf (:25).
9. DONE, all made local: ReplaceOptions (data/helpers/search/replace.ts:48), MatchQuery (query.ts:143), SearchChord (state/sources/search/keys.ts:16), Previews (search.svelte.ts:89), ReplaceCount (words.ts:11), ReadScope (server/files/fs/replace.ts:62), ReplaceRequest (:81), PreviewFile (replace-preview.ts:31), PreviewSettings (:38), BoxKeys (views/sources/search/box-keys.ts:8), MatchData and RipgrepLine (server/files/search.ts:231, :228), Say (state/shared/answers/answers.ts:15), ResultRow (hits.ts:69). DiffRequest is exported from answers.ts and used by Diff.svelte. The second ResultRow is src/lib/shell/keys/PaletteRow.svelte:5, identical to the unchanged tree and not part of this step.
10. DONE. search.test.ts 899 to 450 lines; fs.test.ts 892 to 298; the largest test file in either folder is fs-shape.test.ts at 468. tests/state/sources/fs/ holds 8 items, tests/state/sources/search/ holds 5 (cap 10). The duplication entry for search.test.ts against views/sources/search.test.ts (29fce2fb85d5) is removed from tests/checks/tree/allow-duplication.txt because duplication.test.ts:606 requires entries to name clones that still exist and the split ended that clone.
11. DONE. state/client/context.ts builds `search` after `ui`, calls search.forgetSearch(id) when a tab closes, and moves the search import to search/search.svelte.ts. explorer/follow.ts counts a pane held over a Replace Preview (held.replace !== undefined) as a held diff. explorer/acts/undo.ts: replacedPlaces names the files a taken-back replace wrote so their source tabs read again. diff-view.test.ts tests the preview read of the diff pane. instance-state-sources.test.ts tests that the saved replace field of a search instance is read back (REPLACE_VALID and its invalid forms). ui/controls/text/Search.svelte and ui/forms/TextInput.svelte got `input` bind and `onkey` props so the boxes can take the cursor and walk their history with Up and Down. The move to tests/state/sources/search/ is the accepted one; the source folder is the same case (the unchanged state/sources held 10 items, so hits, keys, walk and words forced state/sources/search/).
12. DONE. HELP.md:176: $0 and $1 to $99 are always the whole match and the groups; $<name>, $&, $$ take effect only when the replace text also holds a numbered reference, as in VS Code, and $<name> alone is written as typed. HELP.md:170 and :174 also say toggles re-run and where the Replace All sentence goes.
13. DONE. state/sources/search/search.ts:11-13 says "a hit without `at` reads as no answer"; :99-102 is hasHitWithoutAt.
14. DONE. DESIGN.md:130 holds the POST preview (diffRequest of state/sources/repositories/answers.ts), the pattern refusal, the toggle re-run and the Replace All sentence; DESIGN.md:393 holds the preview op.
15. DONE, with deviation 1. utils/outside-paths.mjs has tokensOutsideParentheses (:56) and entriesOf (:82). Tests: outside-paths.test.ts:177, :186, :198 (a folder named in prose does not widen the list), :237 (the D32 brief has no prose folder such as state/ as an entry), :245 (the refuter's state/sources/search/* files, the tests/state/sources/search/ folder and the other outside paths are printed).

NEW OR CHANGED TESTS: failing on the starting tree (scratchpad/d32r1/start), passing now. Full runs in Appendix R1-E.
- tests/routes/replace/preview.test.ts (9): before `Tests  8 failed | 1 passed (9)`, `TypeError: previewRequest is not a function` at :31, :47, :56, :63, :73, :89, :136 (2000 hits), :149 (token); after `Tests  9 passed (9)`.
- diff-read.test.ts (8, new): before `Tests  8 failed (8)` (diffReader is not a function x4, diffRequest is not a function x2, groupAnswer is not a function x2); after `Tests  8 passed (8)`.
- diff-view.test.ts (15, 1 changed): before `1 failed | 14 passed (15)`, `TypeError: diffRequest is not a function` at :255; after `Tests  15 passed (15)`.
- tests/state/sources/search/replace.test.ts (20, 7 new or changed): before `7 failed | 13 passed (20)`, `expected { ...(2) } to be null` at :120, `toggleMode is not a function` at :127, :291, :300, :310; after `Tests  20 passed (20)`.
- tests/views/sources/search.test.ts (30, 1 new): before `1 failed | 29 passed (30)`, `AssertionError: expected '' to contain 'Replaced 3 occurrences across 2 files...'` at :378; after `Tests  30 passed (30)`.
- tests/checks/utils/outside-paths.test.ts (20, 5 new): before `5 failed | 15 passed (20)`, e.g. `expected [ 'src/b.ts' ] to deeply equal [ 'lib/x.ts', 'src/b.ts' ]` at :183 and `expected [ ...(70) ] to not include 'state/'` at :241; after `Tests  20 passed (20)`.
- The groupAnswer cases (diff-read.test.ts:143, :148) cover the group-read merge moved from Diff.svelte into answers.ts, which keeps Diff.svelte at 536 lines (under the 540 component line).

THE 61 PATHS OUTSIDE THE BRIEF'S LIST, BY REASON
- Error sentences for bare statuses (brief item 5): new state/shared/answers/answers.ts; tests/fixtures/client.ts; item 20's existing tests (tests/state/client/{terminal/terminal-start,writes}.test.ts, tests/state/life/memories-message.test.ts, tests/state/sessions/{agents,changes,latex,source,terminals,transcript}.test.ts, tests/state/sessions/terminal/pty-io.test.ts, tests/state/system/{deposit,docs}.test.ts, tests/state/sources/fs/fs-answers.test.ts), each asserting the refusal sentence and not the raw status; tests/views/boards/project.test.ts, tests/views/sources/note.test.ts, tests/views/sources/files/files-stored.test.ts; views/system/help/manual.ts; views/sources/repositories/diff/compare-words.ts and its test tests/views/sources/files/menu/files-ops.test.ts; tests/routes/files/search.test.ts, tests/server/files/search.test.ts.
- The state/sources/search/* files (hits.ts, keys.ts, search.svelte.ts, search.ts, walk.ts, words.ts): the brief names state/sources/search.svelte.ts and search.ts; the folder and new modules follow ruling 11.
- Replace Preview wiring: repositories/answers.ts, views/sources/repositories/diff/Diff.svelte, follow.ts, undo.ts, context.ts, Workbench.svelte (passes focusSearchBox to the Cmd+Shift+F and Cmd+Shift+H keys), tests/shell/keys/workbench-keys.test.ts.
- Chips and words: config/catalogs/{glyphs,icons}.yml (replace and replace_all entries), config/text/views/sources/files.yml, config/text/views/system/history.yml, views/system/history/History.svelte (a replace row says its count, not a file).
- Lists: tests/checks/imports/order.ts (head comment lists state/shared/answers/), tests/checks/tree/allow-duplication.txt.
- Boxes: ui/controls/text/Search.svelte, ui/forms/TextInput.svelte.
- Tests of moved or added code: tests/ui/theme/wall.test.ts (the removed .row:hover entry), tests/state/shared/instance-state-sources.test.ts, tests/state/sources/explorer/{ops,acts/undo}.test.ts, tests/views/sources/files/sections/sections.test.ts, and the search/, fs/ and diff/ test files.
- Read: the diffs of Workbench.svelte, History.svelte, the config files and the files in the second, fourth and fifth bullets. For the files in the first bullet the sentence changes were confirmed by a grep count, not by reading every hunk.

FILES CHANGED THIS ROUND
- Source: src/lib/data/file-ops.ts; src/lib/server/files/fs/ops.ts; src/routes/api/(files)/ops/+server.ts; src/lib/state/sources/repositories/{answers,repositories}.ts; src/lib/views/sources/repositories/diff/Diff.svelte; src/lib/state/sources/search/{search.svelte,search}.ts; src/lib/views/sources/search/{Search,Results}.svelte; DESIGN.md; HELP.md; utils/outside-paths.mjs.
- Tests: tests/routes/replace/{replace-fixture,preview.test}.ts; tests/state/sources/repositories/diff/{diff-read,diff-view}.test.ts; tests/state/sources/search/*; tests/state/sources/fs/*; tests/views/sources/search.test.ts; tests/views/whole/type-scale.test.ts (the Search.svelte row); tests/checks/utils/outside-paths.test.ts; tests/checks/tree/allow-duplication.txt; tests/data/helpers/replace.test.ts.
