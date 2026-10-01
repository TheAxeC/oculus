NOT done: nothing in the brief or in repair round 1 is left undone. The final sequence passes: `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed `checks: 7 commands passed` (exit 0), `npm run test:checks` printed `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`, and the three slow files by name printed `Tests  162 passed (162)`. Two things stay as they are by ruling and are stated here: `loadCache` is about 15 ms slower and drops a wrong-typed cache entry (ruling 12), and the merge with Q85a4 on `DESIGN.md:148`, `core/json.ts`, `allow-duplication.txt` and Q85a4's own copies of `anyNumberShape` and `mapShape` is the landing's.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons. X3d landed at 06:19 with Seti's colours in every theme, as (1) reads; a ruling of (3) or (2) is a change on top of it, folded into U2's fixes or the next step that touches `themes/`.

## Repair round 1

Each ruling by its number in `agents/briefs/Q85a2-round1.md`, what changed, and for each change of behaviour the case that fails without it. The failing runs are from `scratchpad/pre`, a copy of the worktree as it stood before round 1 with the three test files in their final form and a one-line `src/lib/server/core/shapes.ts` (`export * from './json.ts';`) so that the imports of the final tests resolve. Command: `npx vitest run tests/server/sessions/stores/codex.test.ts tests/server/sessions/stores/turns.test.ts tests/server/core/json.test.ts` printed `Tests  6 failed | 41 passed (47)` for the first two files and the earlier form of the third; the final `json.test.ts` alone printed `Tests  5 failed | 9 passed (14)` there (`scratchpad/q85a2r1/round1-pre-tests.txt`, `pre-json.txt`). The same new cases in `codex.test.ts` and `turns.test.ts` run on the unchanged tree (`scratchpad/basetree`) printed `Tests  36 passed (36)`.

1. **S1, S6, B1: an `event_msg` with no `payload`.** `eventRecordShape` in `sessions/stores/codex.ts` reads `payload: z.unknown().optional()`.
   - `codex.test.ts` > "a rollout holding an event_msg record with no payload" > "skips that record and folds the user message after it" (session_meta, a payload-less event_msg, a user message): fails before with `AssertionError: expected +0 to be 1 // Object.is equality` (`record.prompts`); passes after.
   - Same describe > "keeps its counts over three scans with one line appended between them": fails before with `expected [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ] to strictly equal [ [ 2, 2 ], [ 2, 2 ], [ 2, 2 ] ]` (prompts and messages per scan); passes after, and on the unchanged tree.
   - `transcripts.test.ts` took no line (`wc -l` prints 900).
2. **S2: the two red checks.**
   - `tests/fixtures/kinds.ts:20` matches `/kind: z\.literal\('([a-z-]+)'\)/g`. Before the change `config-key.test.ts`, `history.test.ts` and `keys.test.ts` failed; `npm test` and `npm run test:checks` now pass.
   - `src/lib/server/core/write-file-atomic.d.ts` moved to `src/lib/write-file-atomic.d.ts`; its head comment opens "Layer 2, types." `ls src/lib/server/core` lists ten items (auth, changes, channels, file-poll, git-parse, git, json, paths, shapes, words), the nine of before the new file plus `shapes.ts`; `ls src/lib` lists ten. `grep -n "write-file-atomic" docs/diagrams/*.dot` prints nothing, so the `.d.ts` draws no node.
   - `src/lib/server/core/shapes.ts` (108 lines) holds `unchanged`, `anyNumberShape`, `mapShape`, `quickly` with `withoutCatch`, `wholeShape`, `stringItemsShape`, `readAs` and `text`. `core/json.ts` holds `readJson`, `writeJsonAtomic`, `writeTextAtomic`, `writeBytesAtomic`, `fsWrites`, `chained`, `FsWrites` and the `isMap` re-export. The head comments of both files say so.
   - 15 modules read from `shapes.ts` (`grep -rln "core/shapes.ts'" src`), `git/git-routes.ts` among them (`text`, an edit outside the brief's paths that the ruling implies). No file under `utils/diagrams/` was edited. `readable.test.ts` passes inside `npm run test:checks` (29 files passed). `grep -c "shapes.ts" docs/diagrams/writes.dot` prints 0.
   - `DESIGN.md:148` names `core/shapes.ts` and lists the helpers it holds.
3. **S3: the 30 lines of Verify 3's grep.** The table is below this list.
4. **S4.** `fold.ts` `userContentShape` reads the block text with `contentTextShape.parse(blocks)`, imported from `./stores/background.ts`, so the join exists once (`grep -c "join('\\n')" src/lib/server/sessions/fold.ts` prints 0).
5. **S5.** `cacheEntryShape` takes `size` and `offset` as `z.number()`; `Number.isInteger` is gone; the item 8 cases pass. `codex.test.ts` > "a cache entry whose size and offset are not whole numbers" > "is kept, since both are byte counts the cache was written with" fails before with `AssertionError: expected {} to strictly equal { ...(1) }` (the entry was dropped); passes after, and on the unchanged tree.
6. **P1, P2, T2, item 13.** `eventOf` and `wholeField` are gone. `eventPayloadShape` in `codex.ts` is built once at module level with `quickly`: `type` as `textShape`, `model_context_window` and `duration_ms` as `wholeShape.optional()`, `info` and `item` as `z.unknown().optional()`, and every field absent for a payload that is no map. The comment on reading without a schema and the time clause of `DESIGN.md:148` are gone. The existing codex cases pass inside `npm test` (`Tests  5940 passed | 600 skipped (6540)`). The whole-pass timing is in its own section below: no pass has a mean ratio over 1.5.
7. **T1.** `quickly` calls `refuseUnrebuildable` first and throws a sentence naming the form: "quickly takes a plain object: a loose or strict one is rebuilt plain", "quickly takes an object without a check: .refine is lost", "quickly takes a list without a check: .min, .max and .refine are lost". Its comment names the forms it takes (a plain `z.object`, a `z.array`, the `.optional()`, `.nullable()` and `.catch()` wrappers, unions of those, any other schema as a leaf). `tests/server/core/json.test.ts` > "quickly": one case each for a loose object, a strict object, an object with `.refine`, a list with `.min`, and one for a refused form inside a field, a wrapper, a list and a union: all five fail before with `AssertionError: expected [Function] to throw an error`. Two more pass before and after: "builds over a plain object, a list and the wrappers, and answers what the shape answers" (`quickly(shape)` and `shape` give the same `success` and `data` for four inputs) and "builds over every shape the readers of the sessions folder hold" (imports `fold.ts`, `stores/codex.ts` and `stores/turns.ts`, which build all ten present callers at import (`grep -rn "quickly(" src | grep -v core/shapes.ts | wc -l` prints 10)).
8. **T3.** All four pairs differ, so each second name says the difference. Probe: `scratchpad/q85a2r1/t3probe.mts` (`WT=$PWD node --experimental-strip-types t3probe.mts`), output:
   ```
stamp: record.ts started = null | usage.ts stamp = 1700000000000
content list: background.contentTextShape = "a\nb" and for a string "whole" | codex lastPrompt = "ab" | codex string content lastPrompt = ""
claude message: usage gives {"model":"m","input":3} | turns gives {"role":"assistant","text":"hi"}
codex payload: usage gives input 9 | turns gives 0 turns for a token_count carrying an item
   ```
   | Pair | Same or differ | Evidence | Names now |
   | --- | --- | --- | --- |
   | `claudeMessageShape` (`usage.ts`, `turns.ts`) | differ | usage reads `model` and `usage`, turns reads `content`; one record gives usage `{model m, input 3}` and the turn text `hi` | `claudeUsageMessageShape`, `claudeTurnMessageShape` |
   | `codexPayloadShape` (`usage.ts`, `turns.ts`) | differ | usage reads `info`, turns reads `item`; a `token_count` carrying an item gives input 9 and 0 turns | `codexTokenPayloadShape`, `codexItemPayloadShape` |
   | `stampShape` (`record.ts`, `usage.ts`) | differ | a numeric `timestamp` gives `started = null` in the fold and `stamp = 1700000000000` in usage | `stampShape` (record.ts, unchanged), `usageStampShape` |
   | `contentTextShape` (`background.ts`, `codex.ts`) | differ | background joins by `\n` and takes a string whole; codex joins with nothing and reads a non-list as none | `contentTextShape` (background.ts), `codexContentTextShape` |
   `usage.ts` stays free of `core` imports (`server/transcripts` may import only itself and `data/**`).
9. **T4.** `NO_CONTENT` in `fold.ts` is `noContent()`, called where the value is used.
10. **Item 10.** The `isMap` re-export comment in `core/json.ts` names `group.ts`, `overrides.ts` and `stores/transcripts.ts` in `server/sessions` and `fs.ts` in `server/files`; a script over `src` and `tests` for imports of `isMap` from `core/json.ts` finds exactly those four files.
11. **B2.** `commandShape` in `turns.ts` takes a list command whenever it holds a string, joined by spaces (an empty join included), and a string command unless it is empty, as `codexSummary` on the unchanged tree does. `turns.test.ts` > "takes a command that is a list as the summary even when it joins to nothing" (seven commands: `['']`, `['', 3]`, `[]`, `['', '']`, `[3]`, `''`, `['ls', 3]` with a `path` on each item) fails before with `expected [ 'src/a.ts', 'src/a.ts', ...(5) ] to strictly equal [ '', '', 'src/a.ts', '', ...(3) ]`; passes after, and on the unchanged tree.
12. **B3.** `loadCache` is about 15 ms slower over a full cache, and an entry with a wrong-typed field is dropped alone and folded from zero. Measure: `node --experimental-strip-types scratchpad/loadcache.mjs scratchpad/orig/src <worktree>/src` (200 entries, 8.5 MB, two passes): median 27.4 and 25.5 ms unchanged, 41.5 and 42.4 ms now. It stays as built.

Beyond the ruling's words: `quickly` also refuses a strict object, since `withoutCatch` rebuilds a strict object as a plain one and the plain pass would accept values the strict schema refuses.

### S3: the 30 lines

`grep -rnE "\b(whole|list|text|str|scalar|fields|strings)\(" src/lib/server/edit src/lib/server/sessions src/lib/server/transcripts` printed 30 lines before round 1 (line numbers below are those) and prints 20 now. The rule: a value typed `unknown` whose fields a reader reads goes through a schema; a comparison, a bare map test and a type test on a `yaml` node or scalar stay.

| File:line (before) | Class | Result |
| --- | --- | --- |
| `edit/writes/deck.ts:39` | reads `selection` and `slide_order` of a parsed file | changed: `deckFileShape` and `deckMapShape` |
| `edit/writes/deck.ts:76` | reads `order` and `slide_order` of `config.deck` (typed `unknown`) | changed: `deckMapShape` |
| `edit/writes/rail.ts:47` | reads the `rail` key of a parsed file | changed: `layoutShape` |
| `edit/writes/rail.ts:93` | reads the `arrangements` key of a parsed file | changed: `layoutShape` |
| `edit/writes/manifest.ts:349` | the local `text(raw: unknown)` reading a form field | changed: removed, `trimmedShape` |
| `edit/writes/manifest.ts:358,382,383,385,386` | five reads of the new-idea form's `id`, `title`, `eli5`, `short`, `domain` | changed: `ideaFormShape`, one parse |
| `edit/list-edit.ts:183` | bare map test: `readBack` hands the map of top-level keys on | stays |
| `edit/deck-edit.ts:45,49` | bare map test: the map goes only into `isDeepStrictEqual` and `othersThan` | stays |
| `edit/feeds.ts:349,414,418,471,509` | comparison: an entry's identity field against the wanted text | stays |
| `edit/writes/entries.ts:286,362,363,381,384,397,535,559` | comparison: an entry's identity or registry field against the wanted text (`363` is `scalar(raw)` of the body's typed field value) | stays |
| `edit/writes/undo.ts:173` | comparison: a feed entry's identity field against the id | stays |
| `edit/entry-edit/entries.ts:88` | comparison: the typed value of the identity field as text, compared on the next field | stays |
| `edit/entry-edit/lines.ts:220` | type test on a `yaml` scalar (`isScalar(pair.value)` first), both sides compared | stays |
| `sessions/stores/transcripts.ts:219` | not a narrowing: `list` is the parameter that lists a store's folder | stays |

The table holds 30 lines: 4 (deck, rail), 6 (manifest), 1 (list-edit), 2 (deck-edit), 5 (feeds), 8 (writes/entries), 1 (undo), 1 (entry-edit/entries), 1 (lines) and 1 (transcripts); 10 changed and 20 stay, and the grep prints 20 now.

The changed lines answer as before: `fields(x)` and the new object schemas accept the same inputs and give every key absent for a non-map, and `trimmedShape` gives `''` for any non-string, as `text` did. Evidence: `npx vitest run tests/server/edit tests/routes/edit` printed `Tests  443 passed (443)` after the change. No new case was added for these 10 lines, since no answer changes.

## The cases' first run on the unchanged tree

Command: `npx vitest run tests/server/edit tests/routes/edit tests/server/sessions tests/server/transcripts` (26 files). Result: `Test Files 1 failed | 25 passed (26)`, `Tests 1 failed | 619 passed (620)`. The one failure is the new-behaviour half of case 23, `tests/server/sessions/stores/transcripts.test.ts` "drops an entry with a field of the wrong type, and the scan folds from zero" (the entry is kept, with `offset: '5'` and `acc.aiTitle: 3`). Cases 1 to 22, 24 and 25, and the unchanged-answer half of 23, pass on the unchanged tree. The expected values of cases 17, 18 and the turns and usage cases are literals taken from the unchanged tree.

The same files after repair round 1 are in the ledger below: every case passes, case 23 included. The three `@module-tag slow` files by name (ruling 3): `npx vitest run tests/routes/edit/write.test.ts tests/server/edit/writes.test.ts tests/server/edit/yaml-edit.test.ts` printed `Test Files  3 passed (3)`, `Tests  162 passed (162)`.

| Test file | Cases | Lines |
| --- | --- | --- |
| `tests/routes/edit/write.test.ts` (slow) | 1 to 11 | 891 |
| `tests/routes/edit/undo-removed.test.ts` | 16 | |
| `tests/server/edit/yaml-edit.test.ts` (slow) | 12 | |
| `tests/server/edit/feeds.test.ts` | 13 | |
| `tests/server/edit/writes-collection.test.ts` | 14, 15 | |
| `tests/server/sessions/stores/transcripts.test.ts` | 17, 23 | 900 |
| `tests/server/sessions/stores/turns.test.ts` | turns over wrong-type records; round 1: a list command that joins to nothing | |
| `tests/server/sessions/stores/codex.test.ts` | 18; round 1: a payload-less event_msg (2 cases), a fractional cache entry | 811 |
| `tests/server/core/json.test.ts` | round 1: `quickly` (7 cases) | |
| `tests/server/transcripts/usage.test.ts` | 19 | |
| `tests/server/sessions/overrides.test.ts` | 20 | |
| `tests/server/sessions/registry.test.ts` | 21 | |
| `tests/server/sessions/stores/customizations.test.ts` | 22 | |

No existing case is edited and no test file is added in either round. Case 16 uses `title: "A title"\n` for the lines-put-back path and the brief's offsets for the value-written path (ruling 5). Case 23 uses `acc.aiTitle: 3` (ruling 1).

## DONE / NOT DONE

| Row | Status | Command and output |
| --- | --- | --- |
| Items 1 to 12: schemas in the 28 files, `core/shapes.ts`, `core/json.ts`, `DESIGN.md` line 148, allowlist lines 19, 23, 25 removed | DONE | `npm run lint` and `npm run format:check` pass inside `checks.sh`; the table below |
| Item 13 timing | DONE | table below |
| Repair round 1, rulings 1 to 12 | DONE | the section above |
| `npm run diagrams`, then `checks.sh` | DONE | `checks: 7 commands passed`, exit 0 |
| `npm test` | DONE | first block below |
| `npm run test:checks` | DONE | second block below, run alone and inside `checks.sh` |
| `npm run check` | DONE | `COMPLETED 2839 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | passes inside `checks.sh` |
| `npm run format:check` | DONE | passes inside `checks.sh` |
| `npm run lint` | DONE | passes inside `checks.sh` |
| `! LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | passes inside `checks.sh` |
| The slow files by name | DONE | `npx vitest run tests/routes/edit/write.test.ts tests/server/edit/writes.test.ts tests/server/edit/yaml-edit.test.ts`: `Test Files  3 passed (3)`, `Tests  162 passed (162)` |
| Verify 3, per-file counts | DONE | table below; check lines 308 before, 133 after (`scratchpad/q85a2r1/counts.sh` over the unchanged copy and this tree) |
| Verify 4 | DONE | the three greps of Verify 4 print no line (`wc -l` prints 0 for each, run in this session after the last edit); the `.error` hits are `outcome.error` of the writers' own result type in `edit/writes.ts`, `done.error` of `spawnSync` (`stores/codex.ts:391`, `registry.ts`) and a catalog key string (`transcript-routes.ts`); none is the result of a parse |
| Verify 7 | DONE | the paragraph below the table |

Output of the full run (`checks.sh`, then `test:checks` alone):

```
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5940 passed | 600 skipped (6540)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2839 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
checks: 7 commands passed
```

Verify 7, the rename grep `grep -rnw <name> src tests config HELP.md DESIGN.md README.md --exclude=local.yml`, hit counts: `mapOf` 27, `rootMap` 0, `keyList` 0, `wordsOf` 15, `targetOf` 2, `held` 3861, `count` 1236, `stamp` 204, `whole` 808, `list` 2609. None of the 27 `mapOf` and 15 `wordsOf` hits is in `edit`, `sessions` or `transcripts`: each is a function of that name in `content/audit`, `git/deposit.ts`, `data/sources/config`, `data/prose`, `state/*` or `views/*`. The 2 `targetOf` hits are the import alias in `tests/routes/edit/config-key.test.ts:18,276`. `grep -rnwE "(function|const|let) (held|count|stamp|whole|list)\b"` over the three folders lists only local variables (`held` 25, `count` 1, `stamp` 3, `whole` 1, `list` 4, each the result of `listOf`), and `grep -rnE "export (function|const) (whole|list)\b" src/lib/server/core` prints nothing.

## The 28 files

Check lines are `grep -cE "typeof |Array\.isArray|isRecord\(|isMap\("` per file on the unchanged copy and on this tree; satisfies and safeParse are `grep -c` on this tree (`scratchpad/q85a2r1/counts-before.txt`, `counts-after.txt`). A `typeof xShape` in a type alias is not a check and counts in the "after" column: `fold.ts` (4), `codex.ts` (5 type aliases and the `spawnSync` test), `turns.ts` (1), `usage.ts` (2), `background.ts` (1), `rail.ts` (1).

| File | Before | After | satisfies | safeParse | Schemas added; what stays and why |
| --- | --- | --- | --- | --- | --- |
| `edit/deck-edit.ts` | 1 | 0 | 0 | 0 | `mapOf` replaced by `fields`; bare map tests (S3) |
| `edit/entry-edit/entries.ts` | 14 | 14 | 0 | 0 | none; before/after parses of a file the writer has edited, compared to prove the edit |
| `edit/entry-edit/lines.ts` | 10 | 10 | 0 | 0 | none; YAML writers' machinery |
| `edit/entry-edit/subtasks.ts` | 4 | 4 | 0 | 0 | none; flow map of a subtask line and `addSubtask` refusals |
| `edit/feeds.ts` | 12 | 8 | 0 | 3 | `feedMetaShape`, `feedEntriesShape`, `feedListedShape`; `readFeedFile` keeps an `isMap` root and its three thrown sentences (a zod error cannot choose between them); the front-matter decode and the writers' own refusals stay |
| `edit/list-edit.ts` | 2 | 1 | 0 | 0 | `rootMap` replaced by `fields`; the rest is YAML node machinery |
| `edit/writes/audit-mute.ts` | 3 | 0 | 0 | 0 | `ignoredShape`; `mapOf` and `held` removed |
| `edit/writes/bodies.ts` | 67 | 0 | 21 | 0 | 22 readers through `readAs(xShape, body)`: `targetShape`, `manifestShape`, `sessionShape`, `entryShape`, `subtaskShape`, `subtaskAddShape`, `hostShape`, `newEntryShape`, `reorderShape`, `deleteEntryShape`, `feedFieldShape`, `feedDeleteShape`, `leadAddShape`, `linkedinIdeaShape`, `linkedinPostShape`, `keysShape`, `deckShape`, `undoShape`, `newIdeaShape`, `auditMuteShape`, `railShape`, `configKeyShape`; `feedValueShape` exported |
| `edit/writes/config-key.ts` | 8 | 8 | 0 | 0 | none; the writer's checks of a value against its option's control |
| `edit/writes/entries.ts` | 22 | 11 | 0 | 3 | `metalistItemShape`, `metalistFieldsShape`, `entryNamesShape`, `idPartShape`, `entryMapsShape`, `entryListShape`; `typeRefusal`, the writers' refusals and the dispatch stay; a bare map test of a collection file |
| `edit/writes/manifest.ts` | 16 | 8 | 1 | 1 | `fieldTypeShape`, `fieldTypesShape`, `removedShape`, `trimmedShape`, `ideaFormShape`; `coerce` refusals and two bare map tests stay |
| `edit/writes/rail.ts` | 1 | 1 | 0 | 0 | `layoutShape`; the one hit is `z.output<typeof layoutShape>` |
| `edit/writes/subtasks.ts` | 9 | 0 | 1 | 0 | `careerRulesShape`, `careerHostsShape` |
| `edit/writes/undo.ts` | 7 | 0 | 0 | 0 | `flagBeforeShape`, `textBeforeShape`, `mapBeforeShape`, `wordsBeforeShape`, `deckBeforeShape`, `railBeforeShape`, `scalarBeforeShape`; `wordsOf` removed |
| `edit/yaml-edit.ts` | 27 | 23 | 1 | 9 | `metalistRowShape`, `fieldValueShape` (`asFieldValue`); the rest is the value-kind dispatch of the writers |
| `sessions/cache.ts` | 5 | 0 | 1 | 0 | `cacheEntryShape`, `cacheFileShape` |
| `sessions/fold.ts` | 24 | 4 | 0 | 0 | `aiTitleShape`, `lastPromptShape`, `systemShape`, `attachmentShape`, `contextShape`, `userBlockShape`, `userContentShape`, `userShape`, `toolInputShape`, `toolUseShape`, `assistantShape`, `spentShape`, `resultLengthShape`; the 4 remaining are type aliases |
| `sessions/group.ts` | 12 | 12 | 0 | 0 | none; argument checks of an exported function (brief) |
| `sessions/overrides.ts` | 10 | 8 | 0 | 0 | `overridesFileShape`; bare map tests of `setFlag` and `setOverride` (brief) |
| `sessions/record.ts` | 1 | 0 | 1 | 0 | `accShape`, `nullableTextShape`, `countsShape`; `textShape`, `filledTextShape`, `stampShape` exported |
| `sessions/registry.ts` | 4 | 1 | 1 | 0 | `candidateShape`; the remaining line is what `spawnSync` answered, typed by node |
| `sessions/stores/background.ts` | 4 | 1 | 0 | 0 | `contentTextShape` (exported), `launchAnswerShape`; the 1 remaining is a type alias |
| `sessions/stores/codex.ts` | 10 | 6 | 0 | 0 | `codexContentTextShape`, `metaPayloadShape`, `contextPayloadShape`, `itemShape`, `eventPayloadShape`, `tokenInfoShape`, `responsePayloadShape`, four record shapes, `changedPathsShape`; 5 type aliases; the `spawnSync` test |
| `sessions/stores/customizations.ts` | 4 | 4 | 0 | 0 | `hookShape`, `hookGroupsShape`; bare map and `Date` tests handed on to the readers (brief) |
| `sessions/stores/hooks.ts` | 5 | 5 | 0 | 0 | none; the hub's own published payloads (brief) |
| `sessions/stores/transcripts.ts` | 1 | 1 | 0 | 0 | none; `isMap(parsed)` is a bare map test (brief) |
| `sessions/stores/turns.ts` | 13 | 1 | 0 | 1 | `summaryShape`, `blockShape`, `contentShape`, `claudeHeadShape`, `claudeTurnMessageShape`, `humanShape`, `commandShape`, `codexItemShape`, `codexHeadShape`, `codexItemPayloadShape`; the 1 remaining is a type alias |
| `transcripts/usage.ts` | 12 | 2 | 0 | 0 | `usageStampShape`, `countShape`, `claudeCountsShape`, `claudeUsageMessageShape`, `claudeRecordShape`, `codexTotalsShape`, `codexInfoShape`, `codexRecordShape`, `codexTokenPayloadShape`; the 2 remaining are type aliases |

Total: 308 check lines before, 133 after, over the same 28 files. Files outside the 28 that round 1 changed: `edit/writes/deck.ts` (`deckMapShape`, `deckFileShape`) and `git/git-routes.ts` (import of `text`).

## Item 13: the fold's time

Script `scratchpad/timing.mjs` (outside the tree): 50,000 records per transcript, five runs after one warm-up, each tree in its own process, five alternating rounds of the unchanged tree and the worktree in one session (`scratchpad/q85a2r1/time-orig-1.txt` to `time-wt-5.txt`). Each cell is the mean over the five rounds of each round's mean in ms, with the lowest and highest round mean in brackets. The ratio is the worktree's mean over the unchanged tree's; the last column is the ratio of each round.

| Pass | Unchanged tree | Worktree | Ratio | Ratio per round |
| --- | --- | --- | --- | --- |
| `foldFrom` + `foldClaude` | 80.5 (75.9 to 89.5) | 110.5 (104.7 to 113.9) | 1.37 | 1.38, 1.46, 1.38, 1.27, 1.38 |
| `foldFrom` + `foldCodex` | 37.4 (34.9 to 39.7) | 51.3 (49.8 to 53.4) | 1.37 | 1.26, 1.44, 1.43, 1.33, 1.41 |
| usage table claude | 69.3 (63.9 to 77.5) | 84.5 (80.9 to 91.1) | 1.22 | 1.14, 1.22, 1.30, 1.11, 1.35 |
| usage table codex | 39.5 (36.6 to 44.0) | 48.5 (45.8 to 53.3) | 1.23 | 1.15, 1.20, 1.31, 1.12, 1.37 |
| `readTurns` claude | 103.5 (95.9 to 120.6) | 143.0 (128.7 to 154.3) | 1.38 | 1.31, 1.34, 1.50, 1.28, 1.50 |
| `readTurns` codex | 41.2 (35.9 to 50.5) | 47.2 (44.4 to 50.6) | 1.15 | 1.16, 0.88, 1.27, 1.15, 1.39 |
| `claudeUsage` alone | 1.9 (1.5 to 2.7) | 12.2 (10.9 to 17.0) | not bounded (ruling 2) | 4.04, 6.47, 7.33, 6.17, 10.62 |
| `codexUsage` alone | 2.4 (2.0 to 3.0) | 8.8 (7.5 to 13.0) | not bounded (ruling 2) | 2.57, 3.57, 3.95, 2.70, 6.19 |

No whole pass has a mean ratio over 1.5; the highest is 1.38. Two single rounds of `readTurns` claude print 1.50. The machine ran other agents' work during these runs, and the unchanged tree's own round means vary by up to 14 ms (the `foldClaude` rows), so single-round ratios carry that noise.

## Judgment calls the brief left open

- `core/shapes.ts` holds the schema helpers and `core/json.ts` the disk reads and writes (ruling 2 of round 1). `whole` and `list` are deleted from `core`; `text` stays, in `shapes.ts`, because `git/git-routes.ts` imports it.
- `usage.ts` imports nothing from `core`, because `server/transcripts` may import only itself and `data/**` (`tests/checks/tree/boundaries.test.ts`); it has its own `trunc`, and `codex.ts` wraps `codexInfoShape` in `quickly` itself.
- `readFeedFile` keeps an `isMap` root test and three thrown sentences, since a zod error's text is never shown and cannot choose between them; `meta` and `entries` are read by `feedMetaShape` and `feedEntriesShape`.
- The `listOf` and `readCollection` loops read through `entryListShape` and `entryMapsShape` (round-0 ruling 7).
- The Claude fold dispatches on `record.type` directly and the kinds each have their own shape without a `type` field; `userShape` and `assistantShape` are `quickly` pairs.
- `DESIGN.md` line 148 names the folders, `quickly` and `core/shapes.ts` with the helpers it holds.
- `tests/checks/tree/allow-duplication.txt`: lines 19, 23 and 25 are removed. Line 26 stays; the duplication check did not name it.

## Behaviour changes

One, as the brief names it: a cache entry with a field of the wrong type is dropped alone and its transcript folded from zero (case 23: `acc.aiTitle: 3`, `offset: '5'`). A fractional `size` or `offset` is kept, as on the unchanged tree. No other answer changes: the 25 cases hold the unchanged tree's answers as literals, and the payload-less, list-command and fractional-cache cases of round 1 pass on the unchanged tree.

## What in the brief was wrong or needed a ruling, and how it ended

Case 23 against item 8 on `acc.title` (round-0 ruling 1: `acc.aiTitle`); the 1.5 bound against `claudeUsage` and `codexUsage` alone (ruling 2: bound on the passes); the slow files (ruling 3: run by name); `transcripts.test.ts` at 900 lines (ruling 4: the cases went in the nearest files, and round 1's three codex cases and one turns case went into `codex.test.ts` and `turns.test.ts`); case 16's inputs (ruling 5); `mapShape` in `core/json.ts` (ruling 6, now in `core/shapes.ts` by round 1); `listOf`/`readCollection` (ruling 7); the `??` rule (ruling 9: the one `??` between two outside values, `payload.id ?? payload.session_id` in `openSession`, reads both through `filledTextShape` first); finding 7, zod against the unchanged readers (ruling 8: `z.int()` refuses 2**60, `z.number()` refuses NaN and the infinities, `z.record` drops an own `__proto__` key and refuses a `Date`, `z.custom` returns the input itself).

Correction to an earlier report: in round 0, two read-only git commands ran (`git ls-files` and `git -C . diff --stat -- <file>`). No git command ran in round 1.

## Next

The landing merges with Q85a4 on `DESIGN.md:148`, `core/json.ts` and `allow-duplication.txt`, and folds Q85a4's copies of `anyNumberShape` (`machine/pty/channel.ts`, `files/search.ts`) and `mapShape` (`machine/usage/accounts.ts`) into `core/shapes.ts`. `npm run diagrams` followed by `checks.sh` is the last gate there.
