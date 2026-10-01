NOT done: two commands of the verify list are red, and neither is fixable inside this step's paths, so `checks.sh` stops at `npm test` and does not print `checks: 7 commands passed`. (1) `tests/fixtures/kinds.ts` line 20 reads the body kinds out of `bodies.ts` with the pattern `/body\.kind !== '([a-z-]+)'/g`; the 22 body readers now state their kind as `kind: z.literal('...')`, the pattern finds none, and `tests/routes/edit/config-key.test.ts` ("has a word of its own in the History view, a setting"), `tests/views/system/history.test.ts` ("names every kind of write in words, and never draws the wire word") and `tests/checks/source/keys.test.ts` ("has a reader for every catalog key") fail. The fix is that one line, outside the step's paths, handed back below. (2) `tests/checks/diagrams/readable.test.ts` ("have no two arrows running along each other in the write diagram") fails with 8 overlapping pairs, because the zod helpers share `core/json.ts` with the disk writers; the fix needs a new file in a folder that already holds ten items, which is a structure decision for the orchestrator, handed back below with the evidence. Everything else in the brief is built: 5 of the 7 verify commands pass, all 25 cases pass, and every bounded pass of the timing is under 1.5 times the unchanged tree's.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

## Two things for the orchestrator (both are red checks no fix within this step's paths covers)

### 1. `tests/fixtures/kinds.ts` line 20

The change: `/body\.kind !== '([a-z-]+)'/g` becomes `/kind: z\.literal\('([a-z-]+)'\)/g`. Evidence that it is enough: in a scratch copy of the tree with that one line changed, `npx vitest run tests/routes/edit/config-key.test.ts tests/views/system/history.test.ts tests/checks/source/keys.test.ts` printed `Test Files  3 passed (3)` and `Tests  34 passed (34)`. On this worktree the same three files fail, and a node script over `bodies.ts` finds the same 19 kinds in the same order with the new pattern as the old pattern finds on the unchanged `bodies.ts`. The lazy option is to keep a `body.kind !== 'x'` line in `bodies.ts` so the old pattern matches, or to loosen the two gates. Recommendation: the one-line fixture change, made at landing.

### 2. The write diagram

What the failure is. `npm run test:checks` fails `readable.test.ts` > "have no two arrows running along each other in the write diagram" with 8 pairs (the first: `lib/server/edit/entry-edit/entries.ts->lib/server/edit/yaml-edit.ts along lib/server/edit/writes/entries.ts->lib/server/edit/entry-edit/entries.ts`). The unchanged tree draws none: `node scratchpad/wdot2.mjs <copy of the unchanged tree>`, which generates the write diagram and prints what `arrowsAlong` finds, printed `[]`.

Cause. `utils/diagrams/writes.mjs` draws a module when it can reach the disk, and a module is drawn with every edge into it. `core/json.ts` holds `writeTextAtomic` (which calls `mkdirSync`), so it is a disk module. This step put the zod helpers (`unchanged`, `readAs`, `quickly`, `mapShape`, `anyNumberShape`, `wholeShape`, `stringItemsShape`) in that file, as ruling 6 says. Every module that imports one now has an edge into a disk module and is drawn: `bodies.ts` and `yaml-edit.ts`, and through `yaml-edit.ts` the five `entry-edit` modules, entered the diagram; a bare use of `mapShape` (not a call) also draws a second, dotted arrow from each importer into `json.ts`.

What is already done in the tree. Five places called a method on an imported shape (`mapShape.optional(`, `mapShape.transform(`, `mapShape.catch(`, `stringItemsShape.catch(`, `feedValueShape.catch(`); the diagram draws each as an unplaced call with its own arrow. They are now `z.optional(mapShape)`, `z.pipe(mapShape, z.transform(...))`, `z.catch(mapShape, ...)`, `z.catch(stringItemsShape, ...)` and `z.catch(feedValueShape, ...)` in `feeds.ts`, `writes/subtasks.ts` and `writes/undo.ts`, which build the same schemas. With only that done, `arrowsAlong` over this tree prints the 8 pairs above (`node scratchpad/wdot2.mjs <worktree>`).

What ends the cause. The helpers move to a file of their own that has no path to the disk. Evidence: in a scratch copy of the tree, `scratchpad/move-shapes.py` moved the seven helpers to `src/lib/server/core/shapes.ts` and pointed the 14 importers at it; with the five rewrites above, `arrowsAlong` over that copy printed `[]` and the generated write diagram had the same modules and edges as the unchanged tree's, with one source line number different. The obstacle: `src/lib/server/core` holds ten items (`ls src/lib/server/core | wc -l` prints 10), and with `shapes.ts` the folder check fails: `npx vitest run tests/checks/tree/size.test.ts` in that copy printed `src/lib/server/core holds 11 items, over the ten a folder may hold`. `src/lib/server` and `src/lib/data/helpers` also hold ten, so a new folder beside `core` or a file in `data/helpers` needs a slot freed there too. The decision is the orchestrator's (a folder structure nothing names):

| Option | For | Against |
| --- | --- | --- |
| A. `core/shapes.ts`, and one existing item of `core` moves out to free the slot (for example `git.ts` and `git-parse.ts` into one folder, or `write-file-atomic.d.ts` elsewhere) | ends the cause; json.ts is again the file of disk writes and guards; the helpers sit in one named place | a move of files outside this step's paths and possibly inside Q85a4's; imports of the moved files change |
| B. Change the diagram reader so a module is drawn only when a function the trace reached in it reaches the disk, and an edge only when its target function does | no file moves; helpers stay in `json.ts` as ruling 6 says | a change to `utils/diagrams/writes.mjs` that moves every diagram and its tests; the reader is a tool of its own |
| C. Keep the helpers in `json.ts` and loosen the check, or give the four importing modules their own copies of `unchanged` and `readAs` | none | C is the lazy option: a loosened check, or clones the duplication check exists to forbid |

Recommendation: A. Ruling 6 put `mapShape` in `core/json.ts` before this effect was known; A changes that location, which is why it goes to you.

## The cases' first run on the unchanged tree

Command: `npx vitest run tests/server/edit tests/routes/edit tests/server/sessions tests/server/transcripts` (26 files). Result: `Test Files 1 failed | 25 passed (26)`, `Tests 1 failed | 619 passed (620)`. The one failure is the new-behaviour half of case 23, `tests/server/sessions/stores/transcripts.test.ts` "drops an entry with a field of the wrong type, and the scan folds from zero" (the entry is kept, with `offset: '5'` and `acc.aiTitle: 3`). Cases 1 to 22, 24 and 25, and the unchanged-answer half of 23, pass on the unchanged tree. The expected values of cases 17, 18 and the turns and usage cases are literals taken from the unchanged tree.

The same command after the change: `Test Files  1 failed | 25 passed (26)` and `Tests  1 failed | 619 passed (620)`; the one failure is `tests/routes/edit/config-key.test.ts` "has a word of its own in the History view, a setting", which is item 1 above (an existing case, not one of the 25). Every new case passes, case 23 included. The three `@module-tag slow` files by name (ruling 3): `npx vitest run tests/routes/edit/write.test.ts tests/server/edit/writes.test.ts tests/server/edit/yaml-edit.test.ts` printed `Test Files  3 passed (3)`, `Tests  162 passed (162)`.

| Test file | Cases | Lines |
| --- | --- | --- |
| `tests/routes/edit/write.test.ts` (slow) | 1 to 11 | 891 |
| `tests/routes/edit/undo-removed.test.ts` | 16 | |
| `tests/server/edit/yaml-edit.test.ts` (slow) | 12 | |
| `tests/server/edit/feeds.test.ts` | 13 | |
| `tests/server/edit/writes-collection.test.ts` | 14, 15 | |
| `tests/server/sessions/stores/transcripts.test.ts` | 17, 23 | 900 |
| `tests/server/sessions/stores/turns.test.ts` | turns over wrong-type records | |
| `tests/server/sessions/stores/codex.test.ts` | 18 | |
| `tests/server/transcripts/usage.test.ts` | 19 | |
| `tests/server/sessions/overrides.test.ts` | 20 | |
| `tests/server/sessions/registry.test.ts` | 21 | |
| `tests/server/sessions/stores/customizations.test.ts` | 22 | |

No existing case is edited and no test file is added. Case 16 uses `title: "A title"\n` for the lines-put-back path and the brief's offsets for the value-written path (ruling 5). Case 23 uses `acc.aiTitle: 3` (ruling 1).

## DONE / NOT DONE

| Row | Status | Command and output |
| --- | --- | --- |
| Items 1 to 12: schemas in 23 files, `core/json.ts`, `DESIGN.md` line 148, allowlist lines 19, 23, 25 removed | DONE | `diff -rq scratchpad/orig/src src` lists the 23 changed source files; `npm run lint` exit 0; `npm run format:check` prints `All matched files use Prettier code style!` |
| Item 13 timing, both runs | DONE | tables below |
| `npm run diagrams`, then `checks.sh` | NOT DONE | `checks: failed with exit 1: npm test` (`Test Files  2 failed | 369 passed | 20 skipped (391)`, `Tests  2 failed | 5927 passed | 600 skipped (6529)`); the two failures are `config-key.test.ts` and `history.test.ts`, item 1 |
| `npm test` | NOT DONE | as above, 2 failed, both from item 1 |
| `npm run test:checks` | NOT DONE | `Test Files  2 failed | 27 passed | 2 skipped (31)`, `Tests  2 failed | 440 passed | 9 skipped (451)`; the two failures are `keys.test.ts` (item 1) and `readable.test.ts` (item 2) |
| `npm run check` | DONE | `COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | exit 0, `Using @sveltejs/adapter-node`, `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | exit 0, no output |
| `! LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | exit 0, no output |
| Verify 3, per-file counts | DONE | table below; total check lines 308 before, 134 after (`scratchpad/v3-final2.txt`) |
| Verify 4 | DONE | the three greps print nothing (counts 0, 0, 0); the `.error` hits are `outcome.error` of the writers' own result type in `edit/writes.ts`, `done.error` of `spawnSync` (`stores/codex.ts:396`, `registry.ts:70`) and a catalog key string (`transcript-routes.ts:99`); none is the result of a parse |
| Verify 5 | DONE | above |
| Verify 6 | DONE | tables below |
| Verify 7 | DONE | below |

Verify 3: `grep -rnE "\b(whole|list|text|str|scalar|fields|strings)\(" src/lib/server/edit src/lib/server/sessions src/lib/server/transcripts` prints 30 lines: `fields(` in `deck-edit.ts:45,49`, `list-edit.ts:183`, `writes/rail.ts:47,93`, `writes/deck.ts:39,76` (bare map tests); `scalar(` in `entry-edit/entries.ts:88`, `entry-edit/lines.ts:220`, `feeds.ts:349,414,418,471,509`, `writes/undo.ts:173`, `writes/entries.ts:286,362,363,381,384,397,535,559` (identity comparisons of a value against another, which stay); `text(` in `writes/manifest.ts:349,358,382,383,385,386` (the writer's own function of that name); `list(` in `stores/transcripts.ts:219` (the folder listing function). No line is inside a reader of an outside value.

Verify 7: `mapOf` 27 hits in `src` and none in the three folders (each remaining hit is a function of that name in `data/sources/config/agents.ts`, `data/sources/config/rail.ts`, `content/audit/rules.ts`, `git/deposit.ts`, `state/sessions/terminals.svelte.ts`, `state/sessions/terminal/composer.ts`, `state/workbench/navigation/catalogue.ts`); `rootMap` 0; `keyList` 0; `wordsOf` 15 hits, each another function (`MultiSelect.svelte`, `content/audit/publications.ts`, `state/sessions/terminal/composer.ts`, `state/boards/collection.ts`, `data/prose/markdown.ts`, `CommitBox.svelte`); `targetOf` 2 hits, both the import alias of `target` in `tests/routes/edit/config-key.test.ts:18,276`. `held`, `count`, `stamp`, `whole` and `list` are common words (3861, 1236, 197, 805 and 2596 hits); the three folders hold no function of those names that the step removed: `grep -rnwE "(function|const|let) (held|count|stamp|whole|list)\b"` over them lists only local variables (`held` 27, `count` 1 in `entry-edit/lines.ts:131`, `stamp` 3 in `fold.ts:216,260` and `group.ts:377`, `whole` 1 in `yaml-edit.ts:824`, `list` 4, each the result of `listOf`). The deleted exports of `core/json.ts` are `whole` and `list`; `npm run check` printing 0 errors shows no importer remains.

## The 28 files

Check lines are `grep -cE "typeof |Array\.isArray|isRecord\(|isMap\("` per file on the unchanged copy and on this tree; satisfies and safeParse are `grep -c` on this tree. Hits of `typeof xShape` in a type alias are not checks and count in the "after" column of `fold.ts` (3), `codex.ts` (4), `turns.ts` (1), `usage.ts` (2), `background.ts` (1).

| File | Before | After | satisfies | safeParse | Schemas added; what stays and why |
| --- | --- | --- | --- | --- | --- |
| `edit/deck-edit.ts` | 1 | 0 | 0 | 0 | `mapOf` replaced by `fields`; bare `fields(` map tests stay (lines 45, 49) |
| `edit/entry-edit/entries.ts` | 14 | 14 | 0 | 0 | none; before/after parses of a file the writer has edited, compared to prove the edit |
| `edit/entry-edit/lines.ts` | 10 | 10 | 0 | 0 | none; YAML writers' machinery |
| `edit/entry-edit/subtasks.ts` | 4 | 4 | 0 | 0 | none; flow map of a subtask line and `addSubtask` refusals |
| `edit/feeds.ts` | 12 | 8 | 0 | 3 | `feedMetaShape`, `feedEntriesShape`, `feedListedShape`; `readFeedFile` keeps an `isMap` root and its three thrown sentences (a zod error cannot choose between them); line 143 front-matter decode; 226, 232, 275, 341, 362, 365 are the writers' own refusals |
| `edit/list-edit.ts` | 2 | 1 | 0 | 0 | `rootMap` replaced by `fields`; line 52 is YAML node machinery |
| `edit/writes/audit-mute.ts` | 3 | 0 | 0 | 0 | `ignoredShape`; `mapOf` and `held` removed |
| `edit/writes/bodies.ts` | 67 | 0 | 21 | 0 | 22 readers through `readAs(xShape, body)`: `targetShape`, `manifestShape`, `sessionShape`, `entryShape`, `subtaskShape`, `subtaskAddShape`, `hostShape`, `newEntryShape`, `reorderShape`, `deleteEntryShape`, `feedFieldShape`, `feedDeleteShape`, `leadAddShape`, `linkedinIdeaShape`, `linkedinPostShape`, `keysShape`, `deckShape`, `undoShape`, `newIdeaShape`, `auditMuteShape`, `railShape`, `configKeyShape`; `feedValueShape` exported |
| `edit/writes/config-key.ts` | 8 | 8 | 0 | 0 | none; the writer's checks of a value against its option's control |
| `edit/writes/entries.ts` | 22 | 11 | 0 | 3 | `metalistItemShape`, `metalistFieldsShape`, `entryNamesShape`, `idPartShape`, `entryMapsShape`, `entryListShape`; 100 to 114 `typeRefusal`, 165, 362, 383, 519, 551 writers' refusals and dispatch; 202 is inside a schema; 253 bare map test of a collection file |
| `edit/writes/manifest.ts` | 16 | 9 | 1 | 1 | `fieldTypeShape`, `fieldTypesShape`, `removedShape`; 117 to 137 `coerce` refusals; 159 and 405 bare map tests; 350 `text` |
| `edit/writes/rail.ts` | 1 | 0 | 0 | 0 | `mapOf` replaced by `fields` |
| `edit/writes/subtasks.ts` | 9 | 0 | 1 | 0 | `careerRulesShape`, `careerHostsShape` |
| `edit/writes/undo.ts` | 7 | 0 | 0 | 0 | `flagBeforeShape`, `textBeforeShape`, `mapBeforeShape`, `wordsBeforeShape`, `deckBeforeShape`, `railBeforeShape`, `scalarBeforeShape`; `wordsOf` removed |
| `edit/yaml-edit.ts` | 27 | 23 | 1 | 9 | `metalistRowShape`, `fieldValueShape` (`asFieldValue`); the rest is the value-kind dispatch of the writers |
| `sessions/cache.ts` | 5 | 0 | 1 | 0 | `cacheEntryShape`, `cacheFileShape` |
| `sessions/fold.ts` | 24 | 3 | 0 | 0 | `aiTitleShape`, `lastPromptShape`, `systemShape`, `attachmentShape`, `contextShape`, `userBlockShape`, `userContentShape`, `userShape`, `toolInputShape`, `toolUseShape`, `assistantShape`, `spentShape`, `resultLengthShape`; the 3 remaining are type aliases |
| `sessions/group.ts` | 12 | 12 | 0 | 0 | none; argument checks of an exported function (brief) |
| `sessions/overrides.ts` | 10 | 8 | 0 | 0 | `overridesFileShape`; 98 to 107 and 144 to 153 bare map tests of `setFlag` and `setOverride` (brief) |
| `sessions/record.ts` | 1 | 0 | 1 | 0 | `accShape`, `nullableTextShape`, `countsShape`; `textShape`, `filledTextShape`, `stampShape` exported |
| `sessions/registry.ts` | 4 | 1 | 1 | 0 | `candidateShape`; line 70 is what `spawnSync` answered, typed by node |
| `sessions/stores/background.ts` | 4 | 1 | 0 | 0 | `contentTextShape`, `launchAnswerShape`; the 1 remaining is a type alias |
| `sessions/stores/codex.ts` | 10 | 8 | 0 | 0 | `contentTextShape`, `metaPayloadShape`, `contextPayloadShape`, `itemShape`, `tokenInfoShape`, `responsePayloadShape`, four record shapes, `changedPathsShape`; 4 type aliases; 147, 155, 157 are the hand-read event payload (timing section); 396 is `spawnSync` |
| `sessions/stores/customizations.ts` | 4 | 4 | 0 | 0 | `hookShape`, `hookGroupsShape`; 144, 145, 276, 321 bare map and `Date` tests handed on to the readers (brief) |
| `sessions/stores/hooks.ts` | 5 | 5 | 0 | 0 | none; the hub's own published payloads (brief) |
| `sessions/stores/transcripts.ts` | 1 | 1 | 0 | 0 | none; line 112 `isMap(parsed)` is a bare map test (brief) |
| `sessions/stores/turns.ts` | 13 | 1 | 0 | 1 | `summaryShape`, `blockShape`, `contentShape`, `claudeHeadShape`, `claudeMessageShape`, `humanShape`, `commandShape`, `codexItemShape`, `codexHeadShape`, `codexPayloadShape`; the 1 remaining is a type alias |
| `transcripts/usage.ts` | 12 | 2 | 0 | 0 | `stampShape`, `countShape`, `claudeCountsShape`, `claudeMessageShape`, `claudeRecordShape`, `codexTotalsShape`, `codexInfoShape`, `codexRecordShape`, `codexPayloadShape`; the 2 remaining are type aliases |

Total: 308 check lines before, 134 after, over the same 28 files.

## Item 13: the fold's time

Script `scratchpad/timing.mjs` (outside the tree): 50,000 records per transcript, five runs after one warm-up, each tree in its own process, three alternations (`scratchpad/timing-brief2.txt`). Means in ms, the three runs in brackets.

| Pass | Unchanged tree | After | Ratio |
| --- | --- | --- | --- |
| `foldFrom` + `foldClaude` | 70.9 (71.0, 71.3, 70.4) | 99.9 (95.0, 103.7, 101.0) | 1.41 |
| `foldFrom` + `foldCodex` | 34.0 (34.5, 33.9, 33.6) | 48.3 (48.3, 52.4, 44.2) | 1.42 |
| usage table claude | 63.7 (63.6, 63.9, 63.7) | 83.2 (79.5, 89.2, 80.9) | 1.31 |
| usage table codex | 37.4 (37.5, 37.6, 37.2) | 47.3 (43.6, 53.5, 44.8) | 1.26 |
| `readTurns` claude | 92.7 (90.3, 93.2, 94.5) | 124.4 (122.7, 126.8, 123.8) | 1.34 |
| `readTurns` codex | 37.6 (39.9, 33.9, 38.9) | 43.2 (40.9, 46.6, 42.1) | 1.15 |
| `claudeUsage` alone | 1.4 (1.2, 1.5, 1.5) | 13.9 (10.3, 21.2, 10.2) | not bounded (ruling 2) |
| `codexUsage` alone | 1.9 (2.0, 1.9, 1.9) | 8.9 (7.3, 11.9, 7.6) | not bounded (ruling 2) |

The machine ran other agents' tests during these runs; the second run of each pair varies by up to 10 ms. The steady-state comparison of the three fold passes, `scratchpad/cmp.sh` (3 warm-ups, 21 runs, the minimum, in a process per tree): codex fold 29.2 to 29.5 unchanged against 37.0 to 38.0 after (1.27); claude fold 60.8 to 61.1 against 81.4 to 82.6 (1.34); `readTurns` claude 76.0 to 79.9 against 99.9 to 102.1 (1.28).

The reader that makes the difference (ruling 2): the payload of a Codex `event_msg`, which is 30,000 of the 50,000 records. Read through a five-field schema, the codex pass took 55.3 ms against 34.4 unchanged (1.61, `scratchpad/timing-final.txt`, three alternations: 53.0, 55.9, 56.9 against 34.6, 34.2, 34.3). It is now read by hand, `eventOf` and `wholeField` in `sessions/stores/codex.ts`, and the pass takes 42.3, 44.1, 42.8 (mean 43.1 against 34.2 unchanged in that run, 1.26) in the same script and 48.3 in the table above (1.42). Both forms answer the same: `scratchpad/gen.mjs` over the unchanged tree and this tree prints identical output (`diff` of the two outputs prints nothing), and `tests/server/sessions/stores/codex.test.ts` passes. The same step reads the kind of a record of the three transcript readers by comparing `record.type` instead of parsing a one-field head (`foldClaude`, `foldCodex`, `readTurns`), which gives the same answer.

`loadCache` over a full cache (200 entries, 8.5 MB, `scratchpad/loadcache.mjs`): median 27.6 to 29.1 ms unchanged against 42.5 to 45.0 ms after, about 15 ms more per load, the cost of checking every entry through `cacheEntryShape`.

## Judgment calls the brief left open

- `core/json.ts` holds `unchanged(shape)` (accept or refuse, answer the input itself), `readAs(shape, value)` (the answer or null), `mapShape`, `anyNumberShape`, `wholeShape`, `stringItemsShape` and `quickly(shape)` (the strict no-catch schema first, the lenient one as fallback, the same answer). `whole` and `list` are deleted; `text` stays because `git/git-routes.ts:22` imports it (Q85a4's folder). Where these live goes to the orchestrator as item 2.
- `usage.ts` imports nothing from `core`, because `server/transcripts` may import only itself and `data/**` (`tests/checks/tree/boundaries.test.ts`); it has its own `trunc`, and `codex.ts` wraps `codexInfoShape` in `quickly` itself.
- `readFeedFile` keeps an `isMap` root test and three thrown sentences, since a zod error's text is never shown and cannot choose between them; `meta` and `entries` are read by `feedMetaShape` and `feedEntriesShape`.
- `edit/deck.ts` is not changed (outside the paths); `scalar(...)` identity comparisons and bare `fields(...)` map uses stay, as they compare or test and do not read a field into an answer.
- The `listOf` and `readCollection` loops read through `entryListShape` and `entryMapsShape` (ruling 7).
- The Claude fold dispatches on `record.type` directly and the kinds each have their own shape without a `type` field; `userShape` and `assistantShape` are `quickly` pairs.
- A cache entry's `size` and `offset` must be whole numbers (the brief said finite numbers); they are byte counts. `saveCache` sorts by `b.mtime - a.mtime`, which no longer truncates.
- `DESIGN.md` line 148 names the folders and `quickly`, and says the Codex event payload is read by hand.
- `tests/checks/tree/allow-duplication.txt`: lines 19, 23 and 25 are removed. Line 26 stays; the duplication check did not name it.

## Behaviour changes

One, as the brief names it: a cache entry with a field of the wrong type is dropped alone and its transcript folded from zero. Inside it, an entry whose `size` or `offset` is a fractional number is dropped too (before, `whole` truncated it); an entry whose `acc.aiTitle` or any other `acc` field has a wrong type is dropped (case 23). No other answer changes: the 25 cases hold the unchanged tree's answers as literals.

## What in the brief was wrong or needed a ruling, and how it ended

Case 23 against item 8 on `acc.title` (ruling 1: `acc.aiTitle`); the 1.5 bound against `claudeUsage` and `codexUsage` alone (ruling 2: bound on the passes; every bounded pass is under 1.5 in the table, so no reader is hand-read besides the Codex event payload); the slow files (ruling 3: run by name above); `transcripts.test.ts` at 900 lines (ruling 4: the cases went in the nearest files); case 16's inputs (ruling 5); `mapShape` in `core/json.ts` (ruling 6: done as ruled, and item 2 above reopens its location); `listOf`/`readCollection` (ruling 7); the `??` rule (ruling 9: the one `??` between two outside values, `payload.id ?? payload.session_id` in `openSession`, reads both through `filledTextShape` first); finding 7, zod against the unchanged readers (ruling 8: `z.int()` refuses 2**60, so `z.number().refine(Number.isInteger)`; `z.number()` refuses NaN and the infinities; `z.record` drops an own `__proto__` key and refuses a `Date`; `z.custom` returns the input itself). Two more, found in this round: the kinds fixture (item 1) and the diagram (item 2).

One command of the forbidden class ran during the work: `git ls-files` and `git -C . diff --stat -- <file>`, both read-only; no state changed.

## Next

The orchestrator rules on item 2 (option A recommended), makes the one-line change of item 1 at landing, and then `npm run diagrams` followed by `checks.sh` is the last gate; with A applied, `scratchpad/move-shapes.py` does the file move and import rewrite, and the write diagram, the folder check and the three fixture-dependent tests are the checks to rerun.
