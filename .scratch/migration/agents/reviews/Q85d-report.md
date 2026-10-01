# Q85d report: zod schemas at the untyped inputs of the views, `shell/` and the routes

**NOT DONE: nothing in the brief's items 1 to 11 is left undone. One placement in the brief could not be followed as written: the new test `tests/state/sources/repositories/answers.test.ts` lives at `tests/state/sources/fs/git-answers.test.ts` (see "Wrong or impossible in the brief", point 1). `ui/` is unchanged, as the brief says.**

## Open items of the state file (verbatim)

The "Open items" section of `.scratch/migration/orchestrator-state.md` (line 126) holds only its header paragraph and no item:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

## First run on the unchanged tree

Run before the first source change, as a throwaway test file (deleted at the end) over the readers that exist on the unchanged tree and over the lines of the components copied in as fixtures; output kept in the scratchpad `first-run.txt`: 37 cases passed (every kept case) and 11 failed (every changed case of item 11). The failing 11, by name:

- `activeLabel` over an array with an own `label` answers the label (changed to the registered words).
- `branchesOf`, `commitFilesOf`, `diffAnswerOf` and `listOf` over a list holding an item of the wrong shape answer the whole list.
- `commitFilesOf` over `{ files: 3, error: 3 }` at `ok` false answers `3`.
- `diffAnswerOf` over `attributes: 3` answers `3`.
- `graphPageOf` over `page: 3` on the first page answers no failure and no commits.
- `graphPageOf` and `mergeSidesOf` over `error: 3` at `ok` false answer `3`.
- `mergeSidesOf` over `sides: 3` answers the sentence only through a throw in `regionsOf`.

The kept cases of the component readers (cases 5, 6, 7, 10, 11, 12 in rendered form) were added to the existing view test files and run on the unchanged tree before the first source change; they passed there. A 371-case golden snapshot (13 views: Audit, Config, Person, Project, Editor, File, Source, Note, Document, Doc, Deposit, Merge and CustomizationView, over 16 state shapes per key, the rendered body of each recorded) was recorded on the unchanged tree and compared after the change: `GOLDEN=compare ... npx vitest run tests/q85d-golden.test.ts` printed `Tests 371 passed (371)`, twice (mid-way and after the last source change). The harness is deleted; no file of it remains in the tree.

Cases run first by reading, as the brief's paragraph before case 1 allows: the four spread sites (`SessionList.svelte` `write`, `Band.svelte` `reveal`, `CommandCenter.svelte` `reveal`, `Repositories.svelte` `patch`), whose old function is three lines (`typeof held === 'object' && held !== null && !Array.isArray(held) ? held : {}` then the spread). They are click handlers no server render runs. The palette's spread (`palette-open.ts`) was run first through `openPaletteItem`.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 rule: schemas beside readers, `satisfies`, no `custom`/`refine`, no `.issues` | DONE | `grep -rnE "z\.custom\|\.refine\(" src/lib/views src/lib/shell src/routes src/lib/state/sources/repositories/answers.ts` prints nothing; `grep -rnE "\.issues\|prettifyError\|treeifyError" src/lib/views src/lib/shell src/routes src/lib/state/workbench/layout` prints two lines, `.issues {` and `.issues li {` of `views/boards/project/Latex.svelte:226,232`, which are CSS selectors of the LaTeX log list, no zod |
| 2 boundary | DONE | `tests/checks/tree/boundaries.test.ts`: `'data/shapes/shapes'` added to the `shell` and `views` rows, comment at 73-77 says all four layers read by one rule; `grep -rln "data/shapes/shapes" src/lib/views src/lib/shell` prints 16 files in views and `shell/keys/palette-open.ts`; `data/helpers/guards` is imported by no view or shell file, so no row got it |
| 3 instance state readers | DONE | five exports in `state/workbench/layout/instance.ts`, re-exported in `layout/index.ts`; every local copy deleted (see the file table); `filterOf` removed; `grep -rnw filterOf src tests HELP.md DESIGN.md README.md` prints nothing |
| 4 bodies | DONE | `src/lib/state/sources/repositories/answers.ts` (`branchesOf`, `commitFilesOf`, `diffAnswerOf`, `graphPageOf`, `mergeSidesOf`, `listOf`); `grep -rnE "\.json\(\)" src/lib/views src/lib/ui src/lib/shell src/routes` prints nothing (the views call `readJson`) |
| 5 configuration | DONE | `warnAtShape`, `cadenceShape`, `labelModeOf` (graph.ts), `colorShape` over `mapShape`, `themeNamesShape`, `pushedCollections` (routes/views.ts) |
| 6 entry fields | DONE | `textOrNumberShape` in LeadCard and RadarCard, `jointWork` derived list in Person, `retrievalShape` in DatasetCard, `optionalText` in LineCard, `bookmarkRef` and `bookmarkRows` in `state/sources/fs.ts`, `whereShape` in Bookmarks |
| 7 what stays | DONE | see the file table and the E/F/G/H note |
| 8 duplicates | DONE | `allow-duplication.txt`: lines for Editor/Project, DatasetCard/DomainCard, File/Note and File/Source removed; the person.test.ts / files-outcome.test.ts line (5583ac406dce) stays since that clone is still reported |
| 9 docs | DONE | `sed -n 148p DESIGN.md \| grep -o 'src/lib/views\|src/lib/shell\|src/routes' \| sort -u` prints `src/lib/shell`, `src/lib/views`, `src/routes`; `DESIGN.md:323` cites `opening.ts:47-70`; `README.md:13` says where any layer reads it |
| 10 tests | DONE | `instance.test.ts`, `git-answers.test.ts` (placement, point 1), `fs-shape.test.ts` (`bookmarkRef`, `bookmarkRows`), `graph.test.ts` (`labelModeOf`), `page.test.ts` (line rewritten, `pushedCollections`), `palette-open.test.ts` (`configuredThemes`, spread), new `node-view.test.ts` and `opening.test.ts`, and the render cases in the view files the brief names |
| 11 changed answers | DONE | the section "Changed answers" below |

The verify list, from `tools/oculus` in the worktree, last run (the fourth full-list run) printed, in order: `$ npm test` (`Test Files 421 passed | 22 skipped (443)`, `Tests 11081 passed | 620 skipped (11701)`), `$ npm run test:checks` (`Test Files 29 passed | 2 skipped (31)`, `Tests 442 passed | 9 skipped (451)`), `$ npm run check` (`COMPLETED 2951 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `$ npm run build`, `$ npm run format:check` (`All matched files use Prettier code style!`), `$ npm run lint` (no output), `$ ! LC_ALL=C grep -rna '[^ -~]' src tests` (no output), and then `checks: 7 commands passed`. `npm run diagrams` ran first and regenerated `docs/diagrams/layer-shell`, `layer-state`, `layer-views` and `layers` (`.dot` and `.svg`).

Number of full-list runs: 4. Runs 1 and 2 failed at `npm run test:checks` (comment lines over 100 columns in five files, then one; the person/files-outcome allowlist line), run 3 failed at `npm run lint` (an `any` assignment in `node-view.test.ts`), run 4 passed. Each failure was fixed and the full list rerun.

The count of "What is on the tree" after the change: 35 files, 66 check lines (before: 64 files, 137 lines; `git grep -hcE ... HEAD -- src/lib/views src/lib/ui src/lib/shell src/routes` summed to 137 and `grep -rlE` lists 64 at HEAD and 35 now). Every remaining line is one E, F, G or H names: `CopyValue`, `Clamp`, `CardActions`, `Status`, `Hooks`, `grid-actions`, `RailList`, `RailPages`, `Modal`, `Tooltip`, `Tabs`, `Document.svelte:86` (`getBoundingClientRect`), `prose-menu`, `file-data`, `kit/load` (E, F); `ProjectCard`, `terminal-list`, `TerminalGrid`, `CommandCenter.svelte:154,191` and `Diff.svelte:332` (`typeof` in a type), `NumberInput`, `commands`, `chords`, `status-items`, `html.ts` (F); `EntryForm`, `Summary`, `LineCounts`, `Jobs`, `Projects.svelte:198-199`, `Calendar`, `palette-open.ts:31,38`, `routes/views.ts` (G); `history/rows.ts`, `ui/display/table-rows.ts` (H). `grep -rnE "as Record<string, unknown>|\) as \{|as Answer|as T\[\]" src/lib/views src/lib/shell src/routes` prints nothing; `grep -rnE "\.json\(\)\) as" ...` prints nothing; the object-test grep (`typeof x !== 'object' || x === null`) prints nothing; the module-block `const ... = z.` grep prints `openShape`, `cadenceShape`, `warnAtShape`, `openedAtShape`, `whereShape`, `retrievalShape`, `colorShape`, `pushedShape`, all ending in `Shape`.

## Changed answers (Z179), each with a case that failed on the unchanged tree

| Reader | Before | After | Case |
| --- | --- | --- | --- |
| a list holding an item of the wrong shape (`branchesOf`, `commitFilesOf`, `diffAnswerOf` files, `listOf`, a graph page's lists) | the whole list, cast | the passing items | `git-answers.test.ts` "answers the passing ..." (first run failed: 5 cases) |
| `error` that is not text (`commitFilesOf`, `graphPageOf`, `mergeSidesOf`, `diffAnswerOf`) | the value itself (`{ error: 3 }` at 500 drew `3` in CommitFiles) | the view's failure sentence (`diffAnswerOf`: `error` undefined) | "answers the failure sentence when the reason is not a text" |
| Graph `page: 3` | first page: no failure and no commits held; later page: `graph_failed` through a thrown spread | `graph_failed` from the reader on every page | "answers the failure sentence for a page that is no page" |
| Merge `sides: 3` | the sentence `merge_failed`, through a throw in `regionsOf` after `sides` was assigned | the same sentence, from the reader, with no sides held | "answers the failure sentence for sides that are no sides" |
| Diff `attributes: 3` | `3` | `null` | "answers no attributes when they are not the six texts git gives" |
| `activeLabel` over an array with an own `label` | the label | the registered words | `tests/shell/workbench.test.ts` tab-label case for the array (fails on the unchanged tree, passes now) |

Every other reader answers as before; the golden snapshot above and the kept cases hold that.

## Files

Check lines are `typeof | Array.isArray | isRecord( | isMap(` counts at HEAD and now.

| File | Reader | Before | After | What stays |
| --- | --- | --- | --- | --- |
| `state/workbench/layout/instance.ts`, `index.ts` | `instanceMap`, `instanceText`, `instanceFlag`, `instanceLabel`, `instanceNumber`, `labelShape` | 2 | 2 | `withCardCursor` keeps its `isMap` (a write, not a read of fields) |
| `state/sources/repositories/answers.ts` (new) | the six readers and their `...Shape` consts, held with `satisfies` | 0 | 0 | |
| `state/sources/fs.ts` | `bookmarkRef`, `namedRefShape`, `bookmarkRows`, `BookmarkRow` | 4 | 4 | the four lines are outside the step |
| `state/boards/structure/graph.ts` | `labelModeOf` | 0 | 0 | |
| `views/system/audit/Audit.svelte` | `instanceText`, `instanceFlag` | 2 | 0 | |
| `views/system/history/rows.ts`, `History.svelte` | `filterOf` deleted, `instanceText(state, 'filter')`; head comment corrected | 6 | 4 | `shown` (H) |
| `views/system/config/Config.svelte` | `openShape` (`fieldItemsShape`) | 3 | 0 | |
| `views/system/usage/Usage.svelte` | `cadenceShape` | 1 | 0 | |
| `views/boards/person/Person.svelte` | `instanceText`, `optionalText` in the `jointWork` derived list | 3 | 0 | |
| `views/boards/project/Project.svelte`, `Editor.svelte` | `instanceText` | 4 / 2 | 0 / 0 | |
| `views/boards/deposit/Deposit.svelte` | `instanceText`; `answer.branches ?? []` | 3 | 0 | |
| `views/boards/focus/Band.svelte`, `CommandCenter.svelte` | `instanceMap`; `warnAtShape` | 1 / 4 | 0 / 2 | the two `typeof` in types (F) |
| `views/sources/file/File.svelte` | `instanceText`, `instanceNumber` | 4 | 0 | |
| `views/sources/source/Source.svelte` | `instanceText`, `openedAtShape`, `listOf` over `readJson` | 5 | 0 | |
| `views/sources/note/Note.svelte` | `instanceText`, `instanceFlag` | 3 | 0 | |
| `views/sources/doc/Doc.svelte`, `document/Document.svelte` | `instanceText`, `instanceMap` | 2 / 3 | 0 / 1 | `getBoundingClientRect` (E) |
| `views/sources/repositories/merge/Merge.svelte`, `graph/Graph.svelte`, `graph/CommitFiles.svelte`, `diff/Diff.svelte`, `Repositories.svelte` | `mergeSidesOf`, `graphPageOf`, `commitFilesOf`, `diffAnswerOf`, `instanceMap` | 2 / 0 / 1 / 4 / 1 | 0 / 0 / 0 / 1 / 0 | `typeof view` (F) |
| `views/sessions/changes/Changes.svelte`, `customization/CustomizationView.svelte`, `session-list/SessionList.svelte` | `branchesOf`, `instanceText`, `instanceMap` | 1 / 2 / 1 | 0 / 0 / 0 | |
| `views/feeds/leads/LeadCard.svelte`, `radar/RadarCard.svelte` | `textOrNumberShape` through `readOr` | 1 / 1 | 0 / 0 | |
| `views/sources/data/DatasetCard.svelte`, `structure/pillars/LineCard.svelte` | `retrievalShape`; `optionalText` | 2 / 1 | 0 / 0 | |
| `views/sources/files/opening.ts`, `sections/Bookmarks.svelte` | `bookmarkRef`; `whereShape` | 1 / 1 | 0 / 0 | |
| `views/structure/map/Map.svelte`, `node-view.ts` | `labelModeOf`; `colorShape` over `mapShape` | 1 / 2 | 0 / 0 | |
| `shell/panes/PaneView.svelte`, `workbench-title.ts` | `instanceLabel` | 2 / 2 | 0 / 0 | |
| `shell/keys/palette-open.ts` | `instanceMap`, `themeNamesShape` (`rowsShape`) | 6 | 2 | the palette item's `state.instance`, `.action`, `.reveal`, built by `state/workbench/palette.ts` (G) |
| `routes/+page.svelte`, `routes/views.ts` | `bookmarkRows`; `pushedCollections` (`pushedShape`) | 3 / 3 | 0 / 3 | `registration` narrowing in `views.ts` (G) |

Tests changed or added: `tests/state/workbench/layout/instance.test.ts`, `tests/state/sources/fs/git-answers.test.ts` (new), `tests/state/sources/fs/fs-shape.test.ts`, `tests/state/boards/structure/graph.test.ts`, `tests/routes/page.test.ts`, `tests/shell/keys/palette-open.test.ts`, `tests/shell/workbench.test.ts`, `tests/views/structure/node-view.test.ts` (new), `tests/views/sources/files/opening.test.ts` (new), `tests/views/system/{audit,config,usage,history}.test.ts`, `tests/views/sources/{source,data}.test.ts`, `tests/views/boards/{focus,person}.test.ts`, `tests/views/feeds/{leads,radar}.test.ts`, `tests/views/structure/pillars.test.ts`. Edits to existing cases: the `filterOf` case moved into the `instanceText` table (its four rows kept as `reads the filter out of whatever the instance state is`, and removed from `history.test.ts` with its import; `allow-audits.txt` line 58 removed); `page.test.ts` line 111 now asserts `pushedCollections(` and `if (keys !== null) registerCollections(`. Two type-only edits to cases this step added in an earlier pass are not edits of existing cases. The pure-function cases of `node-view.test.ts` and `opening.test.ts` are named `audits that ...` because `tests/checks/tree/audits.test.ts` requires that name for a case under `tests/views` that renders nothing and the allowlist takes no new entries.

## Wrong or impossible in the brief

1. The brief puts `answers.test.ts` in `tests/state/sources/repositories/`. That folder held ten items before the step (`ls tests/state/sources/repositories | wc -l` printed 10 with the file placed elsewhere, 11 with it there), and `tests/checks/tree/size.test.ts` ("a folder over ten items") failed with `tests/state/sources/repositories holds 11 items`. Merging into `repositories.test.ts` (880 lines) would pass 900 lines, and moving existing files edits paths outside the list. The file is `tests/state/sources/fs/git-answers.test.ts` (the folder holds three files and has the other test of fetched answers, `fs-answers.test.ts`). To place it elsewhere is a move of one file with no import change, since the depth is the same.
2. Graph `page: 3`: the brief says today it draws `graph_failed` through the spread. That holds only for a page after the first; on the first page the unchanged tree draws no failure and holds an undefined commit list. After the step both answer `graph_failed`.
3. Merge `sides: 3` already drew `merge_failed` on the unchanged tree, through a throw in `regionsOf`. The drawn sentence is unchanged; the reader now refuses the sides itself.
4. The brief's blame key `'blame'` is `'lines'` in `Source.svelte`'s read (`listOf(ok, body, 'lines')`).
5. `DESIGN.md:323` says `openBookmark` tests the apps folders, but `views/sources/files/opening.ts` on this tree holds no apps-folder test (`grep -n apps src/lib/views/sources/files/opening.ts` prints nothing). I changed only the line range it cites (47-70, where `openBookmark` is 62-70, which `DESIGN.md:313` already cites and still matches). The mismatch between the sentence and the code was there before this step and is not mine to repair here.
6. `DESIGN.md:148` named the helper list as read by "the server and the state layer"; it now names the server, the state layer, the views and the shell, since it would otherwise be false.

## Judgement calls

- `branchesOf(body)` takes no `ok`: Changes keeps a list whatever the status says, as today.
- A wrong-typed `page`, `sides` or `attributes` is refused whole, not repaired field by field; items inside a list are kept or dropped one by one.
- An item that passes its schema is answered as it came (`unchanged`), so a view gets the server's objects.
- A body of JSON `null` and a body that is no JSON are the same unread body, as the brief's `readJson` makes them.
- `bookmarkRows` takes `{ title, fields }[]` rather than the collection's `Entry`, as `markedKeys` does, so the state module imports nothing from `boards/collection`; `BookmarkRow` equals the rail's `Bookmark` structurally.
- `Person.svelte` draws the status tag from a derived `jointWork` list because Svelte refuses a `{@const}` after an element inside an `{#each}`.
- `CommandCenter.svelte` gained a `<script module>` block for `warnAtShape`; the other components with a schema already had one or got one for it.
- `pushedCollections` reads `collections` through `itemsShape` then hands `collectionKeys` the list, so `collectionKeys`'s own read stays one rule.
- `typeOfFile` is imported into `state/sources/fs.ts` from `./explorer/file-type.ts` (it was only re-exported there) for `bookmarkRows`.
- No timing measure was taken (decision 5 of the brief).

## Not verified

- The kept view cases were run on the unchanged tree in a pass before the first source change; their output is not in this report because only the harness file's output was saved.
- No browser run: the page effect in `+page.svelte` and the four spread handlers are checked by reading and by the golden snapshot, not by a click.
