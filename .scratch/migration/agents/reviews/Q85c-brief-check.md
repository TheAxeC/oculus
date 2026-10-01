# Step Q85c brief check (on main at d7978ad7)

Brief checked: `tools/oculus/.scratch/migration/agents/briefs/Q85c.md`, against `plan.md` (the Q85c line, Rulings Z73, Z96, Z127, "The queue"), `agents/spec.md` (the only standard `orchestrator-state.md` names), and the tree on main. I changed nothing in the repository. I wrote one scratch script in the session scratchpad (`p1.mjs`) that imports `programApps`, `usageTiers` and `flattenText` under `node --experimental-strip-types`, to see what they answer today. I opened no file under `config/` and never touched `config/local.yml`. I did not run vitest.

State of main while I checked: HEAD is d7978ad7, but the working tree now holds a staged, uncommitted landing of Q88b. `git status --short` shows `A src/lib/data/file-ops.ts`, `M src/lib/data/helpers/search.ts`, `M tests/checks/tree/allow-duplication.txt`, `A tests/data/file-ops.test.ts`, `M tests/data/helpers/search.test.ts` and `MM DESIGN.md`. The premise commands below were run against HEAD's content (the 195 count is confirmed with `git grep ... d7978ad7`). Premise F5 gives what changes when Q88b commits.

## 1. Names

Names the step changes: the local helpers `mapOf` (`rail.ts:32`, `agents.ts:261`), `rowOf` (`themes.ts:19`) and `stringMap` (`catalogs.ts:197`); the paths `tests/data/sources/calendar-config.test.ts` and `mail-config.test.ts` (moved by decision 5); the new folder `tests/data/sources/config/`; `DESIGN.md:148`; the head comments of the converted files; any new module in `snapshot/`.

- `grep -rnw "mapOf" src tests HELP.md DESIGN.md README.md` outside `src/lib/data`: hits in `state/system/config/typed.ts:44` and `state/sources/explorer/follow.ts:45`. These are separate private functions of the state layer, so the change makes no hit false.
- `grep -rnw "rowOf" ...`: hits in `server/sessions/stores/customizations.ts`, `accounts/*/poll.ts`, `state/system/config/rows.ts`, `views/.../Tree.svelte` and several tests. All are other functions of the same name. Verify 6 (`grep -rnw <name>`) will print them and the report must name them as unrelated.
- `grep -rnw "stringMap" ...`: `state/shared/words/tones.ts:54-87` is another function. Same remark.
- `grep -rn "calendar-config\|mail-config"` over the tree, excluding `.scratch`, hits `tests/checks/tree/allow-duplication.txt:46,51,52,53,54` and the two scratch-dir prefixes inside the files. The `.scratch` hits are old briefs and reports (Q67, Q79b, Q92, D9) that describe past work, so the move makes none of them false.
- `grep -n "src/lib/data" tests/checks/tree/allow-duplication.txt` prints lines 14-19. `grep -n "tests/data" ...` prints lines 46, 50-59.
- `HELP.md`, `README.md` and the `DESIGN.md` Files lines name none of the changed names. `DESIGN.md:171` lists `data/sources/config/rail`, `options` and `data/shapes/shapes` for `state/`. `boundaries.test.ts:123-125` lists `data/shapes/shapes` in the state row, so a data module that gains that import is allowed.

Findings:

- F1. The move of `calendar-config.test.ts` and `mail-config.test.ts` makes `allow-duplication.txt` lines 46 and 51-54 name paths that no longer exist. `tests/checks/tree/duplication.test.ts:599-606` fails on a stale entry, and the same clones come back under the new paths with no entry. Item 6 and "Paths this step writes" allow removing a line whose clone ends and forbid adding one. They do not say that these five lines are rewritten to the new paths, which is neither of the two. The brief must name the rewrite (same pair, same mark, new path) or the step cannot go green.
- F2. Lines 14-18 (`career/collections`, `collections/feeds`, `collections/manifests`, `collections/registries` twice) are the `readFile` clones: read the text, parse, report `does_not_parse`, report `not_a_map`. Item 2 changes the same tokens in all five readers and keeps each one's own sentence, so the clone persists with a new mark. The old line then goes stale (duplication.test.ts:599) and the new clone fails, and item 6 says to fold it. The only places the brief authorises for a fold are a helper in `shapes/shapes.ts` ("a helper two files would otherwise each define") and "the module that needs it". A shared reader of text-parse-findings is not a shape helper, and "Paths this step writes" allows a new module only in `snapshot/`. The brief should name the module where the fold goes (for example a new file in `sources/`, which holds 9 items) and add it to the paths, since a step's path list is a choice.
- F3. Overlap with Q88b is described wrongly. The brief says Q88b writes "`DESIGN.md` (line 384 and the Files lines)" and does not name `allow-duplication.txt`. Q88b's brief (`Q88b.md:167`) lists `DESIGN.md` lines 148, 171, 376, 378, 379, 383, 401, and `tests/checks/tree/allow-duplication.txt` (line 154). `git diff --cached -- DESIGN.md` on main shows its change to the `**Untyped input.**` paragraph, which is the line item 10 rewrites. The paragraph is one line, so the two landings conflict textually on it. `allow-duplication.txt` and `docs/diagrams/` are shared the same way. "The landing that comes second merges" must say it covers `DESIGN.md:148` and the allowlist, not only `search.ts`.

## 2. The step line

Step line: "Q85c the same in `src/lib/data` (30 files, 195 check lines), after Q85a1, Q85a2 and Q85a4 (ruling The queue) (ruling Z73)".

- "the same" (Q85a1's line):
  - runtime validation of untyped input on zod: items 1-5.
  - the `data/model` types kept as the facade through `satisfies`: item 1 ("held to it with `satisfies z.ZodType<...>`").
  - the redundant hand checks deleted: items 2-6, Verify 2.
  - every reader answering what it answers today: item 1, the cases. Item 9 is the stated exception.
- "in `src/lib/data` (30 files, 195 check lines)": "Paths this step writes", item 7 (what stays), Verify 2. I confirmed 30 files and 195 lines (Premises).
- "after Q85a1, Q85a2 and Q85a4": the plan ticks all three (`plan.md` Q85a1, Q85a2, Q85a4 lines marked done). Z73 ("each puts zod schemas at the inputs of its area and deletes the hand checks they make redundant"): items 1-6.

Findings: none (no part of the line lacks an item). Items 8, 9, 10 and 11 go beyond the line. Item 9 changes answers where the line says "answering what it answers today"; see "Declined to judge".

## 3. Premises

Commands run from `tools/oculus`.

- `grep -rcE "typeof |Array\.isArray|isRecord\(|isMap\(" --include='*.ts' src/lib/data | awk -F: '$2>0'`: 30 files, 195 lines. Every per-file number in the brief matches (validate 37, normalise 35, settings 14, index 13, local 12, present 11, guards 9, rail 6, and so on down to 1). `git grep -c ... d7978ad7` also gives 30 files, 195 lines.
- The cast grep (`as Record<string, unknown>|as Record<string, string>|\(held as|parsed as` over `src/lib/data`): 31 hits. Every location the brief names is present. Two hits are not named: `sources/config/rail.ts:34` and `helpers/files/opens-in-program.ts:60`.
- Item 6's grep prints exactly the lines the brief lists (all 31 with the `guards.ts:18` line). Every `settings.ts` (19, 57, 86, 127, 144, 157), `local.ts` (144, 187, 233), `registries` (91, 131), `collections` (59, 97), `manifests:103`, `docs:124`, `career:46`, `merge` (158, 212), `catalogs` (108, 157, 198), `themes:20`, `rail:33`, `agents:262`, `search:188`, `opens-in-program:58`, `validate:779` and `normalise:65` is there.
- Every reader line range of "What is on the tree" was read and matches: `registries.ts:81-95,119-142`, `collections.ts:49-63,86-105`, `manifests.ts:103-107`, `docs.ts:124-131`, `career.ts:36-54`, `feeds.ts:35-40,61-71,106`, `present.ts:74-110,269-273,346-349`, `deck.ts:58-75`, `local.ts:141-155,184-190,232-236`, `rail.ts:33-124`, `agents.ts:262-284`, `settings.ts:17-165`, `catalogs.ts:101-204`, `themes.ts:20-65`, `options.ts:50-80`, `merge.ts:148-166,210-218`, `index.ts:41-197`, `search.ts:186-191`, `opens-in-program.ts:56-62`, `editor.ts:15-17`, `normalise.ts` (60-70, 102, 107, 155, 167, 215-221, 233-249, 264, 278-280, 359, 406, 489-504, 569-611, 622-647), `validate.ts` (144-154, 209, 281-304, 325-327, 341, 388-390, 412-414, 443-459, 776-781), `validate-themes.ts:52-54`.
- "The other check lines": `connect.ts:70,113`, `calendar.ts:32`, `worktrees.ts:40,55,66`, `code-themes.ts:32`, `agents.ts:131`, `model-sessions.ts:263`, `options.ts:23`, `validate.ts:281`, `shapes.ts:32,184` and all nine of `guards.ts` are present as described.
- Shared helpers: `grep -n "^export" src/lib/data/shapes/shapes.ts` shows all ten named helpers (`unchanged`, `unchangedAs`, `mapShape`, `anyNumberShape`, `filledTextShape`, `wholeShape`, `stringItemsShape`, `quickly`, `readAs`, `text`). It also exports `mapOfShape`, `survivorsShape`, `rowsShape`, `keyedRowsShape`, `listOrOneShape`, `itemsShape`, `optionalTextShape`, `textOrNumberShape`, `wordShape`, `anyValueShape`.
- Models of converted readers all exist: `subscriptionShape` (`socket.ts:56`), `cacheEntryShape` (`cache.ts:48`), `bookmarks.ts`, `savedUiShape` (`ui.svelte.ts:54`), `stringMap` (`tones.ts:54`), `agents.svelte.ts`.
- `wc -l`: `normalise.ts` 849, `validate.ts` 828, `validate.test.ts` 779, `normalise.test.ts` 635. `size.test.ts:28` has `LINES = 900`, `comment-width.test.ts:21` has `WIDTH = 100`.
- Folder counts: `ls tests/data/sources | wc -l` prints 10, `tests/data` 7, `tests/data/snapshot` 2, `tests/data/helpers` 6, `src/lib/data/helpers` 10. `tests/data/sources/config/` does not exist.
- `ls tools/oculus/docs/adr docs/adr`: both "No such file or directory". `orchestrator-state.md` has no `adr` key. `standards: [.../agents/spec.md]`.
- `zod` is `"zod": "4.6.5"` in `package.json` and `node_modules/zod/package.json` says 4.6.5.
- `grep -rnE "\.issues|prettifyError|treeifyError" src/lib/data` prints nothing today, and the `const x = z` name grep prints only `...Shape` names.
- `merge.ts:74` is the doc comment ("local.yml is left out by name"). The code that does it is `merge.ts:79`.
- `tests/data/demo-hub.test.ts:13-18` builds the demo hub as the brief says.
- Q88b writes `search.ts` hunks at base lines 11, 42, 69, 110, 146, 156, 173. `git diff 5ef2a351` in the Q88b worktree shows none at 186-191.
- U3's brief says no file of `src/lib/data` is changed.

Findings:

- F4. The brief says "the folder holds 3" for `src/lib/data/snapshot`. `git ls-files src/lib/data/snapshot` prints 4 (`indexing.ts`, `normalise.ts`, `validate-themes.ts`, `validate.ts`). A new module there makes 5, so the limit of ten is not at risk, but the premise is wrong.
- F5. Premise drift from Q88b. Q88b is staged on main now. Once it commits, the brief's counts and anchors change. `search.ts` goes from 2 to 3 check lines (a new `search.ts:62`, `typeof value === 'string' && REFUSAL_WORDS.includes(value)` plus a `value as SearchRefusal` cast, a vocabulary comparison), so the total is 196, not 195. `searchCap` moves to `search.ts:222-227`. `DESIGN.md:148` has new text. Item 5's "Q88b is in flight" and "write these paths as if Q88b were not there" are then false. The brief should be restated at the worktree's creation, or say which sentences hold in each order. Today's brief anticipates the new reader only under "any reader of untyped input Q88b adds", and `refusalFrom` is not listed among "The other check lines".
- F6. `normalise.ts:107` is listed among "the casts of an outside value" and item 5 says "the casts `:66,107` go". `compact` (`normalise.ts:105-113`) casts a typed object the code built (`value as Record<string, unknown>`) to delete `undefined` keys, and carries an `eslint-disable no-dynamic-delete` with a stated reason. It is not an outside value. Verify 3 ("the cast grep ... prints nothing") would force a rewrite of `compact`, an internal helper used by 20+ builders, against the brief's own boundary (decision 1) and its "no dynamic `delete`" convention. Either take `:107` out of the cast list and say that verify 3 prints it, or say how `compact` is to be rewritten. The same applies to `merge.ts:53` (`(config[TEXT_KEY] ??= {}) as Record<string, string>`), which casts the map the loader itself builds, and `local.ts:249`'s `record.port as number` is not in the cast grep at all.
- F7. Classification of two groups of "other check lines". `validate.ts:543,549` (`typeof held !== 'string' && typeof held !== 'number'`) is a string-or-number test of an identity value, and `589` (`typeof held === 'string' ? [held] : Array.isArray(held) ? held : [held]`) is a list-or-one reader. The brief lists both under "a field compared with a vocabulary ... or not a filled text", which they are not. `validate.ts:716,718` (`typeof entry.status === 'string' ? entry.status : ''`) is the same expression as `:781`, which item 5 converts into a host row schema. `validate.ts:133-135` (`shapeOf`) is in neither list. Verify 2 then prints it with no class. The brief needs one stated reason for each of these lines to stay or to be converted. Under item 1 a field read with a fallback is `.catch(<fallback>)`.

## 4. Cases and checks

Cases read against `spec.md`. "No existing test case is edited" and "a test never asserts a known defect" (item 9's changed cases assert the new answers) hold. The slow-tag runs by name (Verify 4, 5) do not break "a step never runs `npm run test:slow`". The folder limit of ten holds for `tests/data/sources/config/` (two moved plus at most eight new). Sizes hold (`validate.test.ts` 779 against the 850 rule, `normalise.ts` 849 with a new module allowed).

Findings:

- F8. Item 9 and its cases disagree with the code, and the brief says each changed answer gets "a case".
  - Run in the scratchpad against the unchanged tree: `flattenText` over `{"__proto__":{"a":"x"},"b":"y"}` answers keys `['__proto__.a','b']`, so it is changed. Over `{"__proto__":"x","b":"y"}` it answers `['b']`, so it is kept. `usageTiers` over the first throws `config/behavior.yml: usage_tiers.__proto__ must be a string`, and over the second answers keys `['__proto__','b']`. After the change `usageTiers` over the first input has no throw (the wrong-type throw becomes a skip), which is a thrown sentence changing, not a key dropped. `usageTiers` currently answers the input itself (`return held as Record<string, string>`), so skipping `__proto__` conflicts with item 1's "answers the input value itself" unless the brief says it answers a copy only when the key is present.
  - `programApps` over `{"__proto__":"com.x.y",".pdf":"com.x.y"}` answers `null` today (`EXTENSION = /^\.[^./\s]+$/` rejects the key and `return null`). "Skipped" would turn a refused map into a map. The brief lists `programApps` in item 9 but has no case for it (case 10 lists only `'pdf'` with no dot).
  - `iconSet` cannot hold the key today: `stringMap` (`catalogs.ts:197-204`) cannot create an own `__proto__` entry from a string value, and `iconSet` tests `Object.hasOwn(glyphs, name)`. It is a kept case that cannot fail either way, and `iconSet` takes a config, not the bare map case 8 shows.
  - `collectionKeys` (`normalise.ts:60-70`) reads the `key` value of list items, not a map's own keys, so it does not match item 9's criterion ("builds a map from the input's own keys"). It also has no case.
  - Case 9 covers `status_palette` only. `type_color` has none.
  - `index.ts:128-129` (`hostStatuses = Object.keys(merged.career_host_status)`) is the same pattern as `types` and `statuses` at `:123-124`, and is not in item 9.
  - `merge.ts:166-181` is a real instance of the defect and is missing. `config[key] = value` over `Object.entries(parsed)` with a top-level `__proto__:` mapping in a YAML file replaces `config`'s prototype. I ran this: `parse('__proto__:\n  a: x\nb: y\n')` gives keys `['__proto__','b']`, and after the loop `Object.getPrototypeOf(config)===Object.prototype` is `false` and `config.a === 'x'`. Item 9 closes with "No other answer changes", so the builder may not fix it, and the DESIGN.md sentence ("A map built from an outside map's keys skips an own `__proto__` key") would be false in the same folder.
- F9. Verify 2's wording cannot hold as written. It says every line the count prints "is a line 'The other check lines' names, or sits inside a schema". Decision 1 and the carry-over keep bare `isMap` tests, which Verify 2 prints and which the list does not name: `feeds.ts` (all four lines, already `isMap`, listed in the first kind but with nothing to convert), `index.ts`/`present.ts`/`deck.ts` `isMap(item)` before `str()` calls, `normalise.ts` `isMap(...) ? str(item.x)`, `options.ts:51,57,72,80`, `flattenText`'s walk. The Q85b brief had the same wording and ended at 59 to 62 kept lines classified by the refuter. Add "a bare `isMap` / `Array.isArray` test" to the kept classes, or state each file's kept lines.
- F10. Case 2 reads "A registry list that is a map, holding `3`, `null`, ..." (a list that is a map holding items) and "the well-formed item handed on as the input's fields with `provenance`". `registries.ts:150` hands on `{ ...raw, registry: name, key, file }`; `provenance` is the collection's (`collections.ts:105`). Name the two inputs and the registry's fields separately.
- F11. Item 11 says new cases go "into the existing test file of each module". The existing coverage of `local.ts`, `rail.ts`, `settings.ts` and `catalogs.ts` sits in `tests/checks/config/config.test.ts` and `tests/state/workbench/navigation/rail.test.ts`, outside the path list (`tests/data/` only). Cases 5-7 head their group `tests/data/sources/config/`. Say which new file each case lands in (settings, local, catalogs and themes, rail, options, merge), since the shown rule would send them to files the step may not write.

## 5. The question

"The goal" = the part of the plan's goal Q85c delivers: untyped input in `src/lib/data` read through zod at the module level, hand checks gone, every answer as today except item 9.

- Cases 1-7, 10-13 (kept). They pass on the unchanged tree by construction, so each could pass with no zod in the folder: yes. They guard "same answers"; the "zod replaces the checks" half is held only by Verify 2/3 and the refuter's reading. Verify 3 proves a `...Shape` naming rule, not use. Verify 2's `grep -c "safeParse\|readAs("` is reported with no minimum (a converted reader could report 0).
- Cases 8-9 (changed). They fail on the unchanged tree for `flattenText` input 1, `usageTiers` and `status_palette`, so they test the change. Case 8 for `iconSet` and the second inputs cannot fail on the unchanged tree.
- Case 14 and its check. Yes, could pass. The tests it cites check selected facts of the demo hub (findings `[]`, project and collection id lists, relation rows, JSON round trip): `demo-hub.test.ts:15-` and `integrity.test.ts:95-` do not compare the snapshot with the unchanged tree. "The snapshot equals the unchanged tree's" has no command. A normalise reader that changed an `authors`, `retrieval`, `subtasks` or `career` field would pass. The preamble's "compared whole with toStrictEqual against the value the first run records" is not applied to this case. Suggested command: serialise `buildPortfolio(demo, config)` from the unchanged copy and from the worktree and `diff` the two JSON files, quoted in the report.
- Case 6 (`checkLocal`). Both account rows lack `tool`, so each answers the `tool must be claude or codex` sentence first (`local.ts:149-151`). The `dir` and `label` sentences are exercised only by existing `config.test.ts:328-329`, one fault per input. The order claims ("keep their order", "the same finding with the same text, file and key, ... in the same order") are not tested: a row with a valid tool and both `dir: ''` and `label: ''`, or `hub: 3` with `port: x`, would pass a swapped order.
- Item 3's thrown sentences and item 5's finding order: only case 13 compares a whole findings list; the `local.ts` order is the weak spot above.
- Item 8 (timing). It asserts nothing and the bound lives in the report. The demo hub is eleven manifests, so the whole 200-build pass is dominated by file reads and YAML parsing, and a reader that is several times slower could still sit under 1.5 times the pass. The report should also give the schema-bearing readers' own share (for example `readManifests` and `validate` alone) so the bound can fail.
- Item 10 (docs) has no verify command. Without one (for example `sed -n 148p DESIGN.md | grep -c 'src/lib/data'`, and a grep of the converted files' head comments for the old hand-check wording) the item could be skipped and the report still pass.
- Item 6 and Verify 3's casts and `typeof` greps are machine checks and fail without the change (31 hits today). Item 2 (`casts go`) likewise.
- Item 9 as a whole: see F8; the items it names whose answer does not change, and those missing, are not goal-checked.

Findings:

- F12. Case 14 can pass without the goal (no snapshot comparison exists).
- F13. Case 6's rows cannot check dir-before-label or hub-before-port order.
- F14. Items 8 and 10 have a check that cannot fail: item 8's bound and item 10 with no command.
- F15. Verify 2's per-file `safeParse|readAs(` count has no minimum, so a converted reader can report 0.

## 6. Implied inputs

A code step. Inputs the step implies but "Cases" does not list, with the expected result:

- I1. Unnamed keys, key order and identity for the readers that hand an object on. Item 1 says identity, key order and unnamed keys stay, and the preamble names `toBe`, yet no case supplies an input with an extra key. Needed: a `project.yml` with a key the schema file does not name, read by `readManifests`, then `validate`. Expected: the raw manifest keeps the key and `validate` reports `key_not_in_schema` (`validate.ts:194-203`); a `z.object` would strip it silently, and `demo-hub.test.ts` (zero findings) would not notice. Also a registry entry, a collection entry and `meta` with extra keys in a set order (`toStrictEqual`, `Object.keys` order), and `catalogOf` / `usageTiers` / `portfolioConfigFrom`'s `schema` and `deck` answered with `toBe`.
- I2. `present.ts:74-110`: `tag: 3`, `tag: { class: 3 }`, `eli5: []`, `specs: [3, { label: 3, value: 'v' }]`, `panels: [3, { figure: 3 }]`. `present.test.ts:46-100` only has well-formed values. Expected from `present.ts:73-120`: `tag: 3` gives no `tag`, `specs: [3, {label: 3, value:'v'}]` gives `[{ label: '', value: 'v' }]`, `panels` skips `3`.
- I3. `index.ts:87-94,107-108` (`vocabKeys`, `path`): `status_legend: [3, { key: 3 }, { key: 'a' }, 'b']`, `focus_lanes`, `holding_color`, `venue_themes`, `data_themes`, and `venues_file: 3`. Expected: `vocab.chips` is `['a','b']`, and a non-string `*_file` falls back to its default path. Case 9 lists none of them although they are in `index.ts:41-197`.
- I4. `normalise` readers with no case today (`grep -c` over `normalise.test.ts` gives 0 for `collectionKeys`, `why`, `rule`, `compact`): `collectionKeys` over `[3, { key: '' }, { key: 'registry key' }, { key: 'a' }, { key: 'a' }]`; `career` with `not_hosts`, `dropped`, and `eligibility.rule` as a string, a list and `3`; `year: NaN`/`'2020'`; `status: []`. Expected: whatever the first run records; item 5 touches each.
- I5. `fieldNames`/`schemaKeys` plain-map form (`Object.keys(schema)`, `validate.ts:155`). Item 5 names two forms; the function has four. Case 12's `{ fields: [] }` reaches it, so keep that case and name the form.
- I6. If F8's `merge.ts:166` is in scope: `loadConfig` over a scratch engine whose config file has a `__proto__:` mapping. Expected: no prototype change, no inherited key.
- I7. Where each case lands (F11).

Findings: I1, I2, I3, I4, I6, and I7 are missing from "Cases".

## 7. ADRs

- `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both. `find /Users/axelfaes/workspace/research-hub -maxdepth 4 -type d -name adr` finds none. `orchestrator-state.md` has no `adr` key. No record exists, so none touches the step, and the brief's statement matches.

Findings: none.

## Declined to judge

- Whether item 9 is a user-visible choice that needs a ruling. The line says "every reader answering what it answers today" and item 9 changes answers (a thrown sentence becomes a skip in `usageTiers`, a list gains or loses `__proto__`). `DESIGN.md:148` already states the rule and Z154 recorded the same as built for Q85b, so I judged only that the changes are listed incompletely (F8).
- Whether `feeds.ts`, `present.ts` and `deck.ts` should be converted or left as bare `isMap` tests. Both readings fit decision 1; F9 asks for the brief to say which.
- Behaviour I did not run: the full cases against the unchanged tree, the timing script, the duplication check, `npm run diagrams`. I ran only the three scratch calls named above.
- The real hub and the real `config/local.yml` (security rule).

Agent usage: claude-sonnet-5-5, 272,378 tokens, 80 tool uses, 13.3 min (the completion notice).

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

Every finding is closed by a change to `agents/briefs/Q85c.md`; F1, F2 and F8 widen the step and are ruled Z163 (a) by the orchestrator in automode.

- F1: item 6 and "Paths this step writes" rewrite allowlist lines 46 and 51-54 to the moved paths, the same pair and mark (Z163).
- F2: the `readFile` clone is folded into a new `src/lib/data/sources/yaml-file.ts`, named in item 6, the paths and decision 6; lines 14-18 are removed (Z163).
- F3, F5: the premises are restated on main with Q88b landed (5dca2568): 196 lines, `search.ts` 3 with `refusalFrom` (`:62`) kept as a vocabulary comparison, `searchCap` at `:222-227`, the in-flight paragraph replaced by what Q88b left; the plan line reads 196.
- F4: `snapshot/` holds 4; the folder counts of `src/lib/data` (10) and `sources/` (9) added.
- F6: `normalise.ts:107` and `merge.ts:53` leave the cast list and Verify 3 prints them; `local.ts:249` joins the casts that go.
- F7: `validate.ts:543,549` convert through `textOrNumberShape`, `:589` through `listOrOneShape`, `:716,718` through a row schema with `.catch('')`; `shapeOf` (`:133-135`) is a kept class of its own.
- F8: item 9 is `flattenText` and `loadConfig`'s merge skipping an own `__proto__` key (Z163); `usageTiers`, `iconSet`, `programApps`, `collectionKeys` and `portfolioConfigFrom`'s key lists answer as today; case 8 rewritten to that.
- F9: the kept classes gain a bare `isMap` or `Array.isArray` that only guards a helper read or a walk; decision 7.
- F10: case 2 names the registry's fields (`registry`, `key`, `file`) and the collection's `provenance` apart.
- F11: item 11 names the new files under `tests/data/sources/config/` per module.
- F12: case 14 compares `JSON.stringify(buildPortfolio(demo, config))` of both trees with `cmp`.
- F13: case 6 gains the row with both `dir` and `label` empty, `hub: 3` beside `port: x`, and `port: 1.5`.
- F14: item 8 also times `readManifests` and `validate` alone, the bound on each; item 10 has its two greps.
- F15: Verify 2 asks at least one `safeParse` or `readAs(` per converted file.
- I1: case 4b (extra keys and their order, `toBe` for handed-on values) and case 9's `toBe`.
- I2: case 4's slide fields of the wrong type.
- I3: case 9's `status_legend`, `focus_lanes`, `holding_color`, `venue_themes`, `data_themes`, `venues_file`.
- I4: case 11's `collectionKeys`, `career` fields, `year` and `status`.
- I5: case 12 names the four forms.
- I6: case 8's `loadConfig` over a scratch engine with a `__proto__:` mapping.
- I7: item 11, as F11.
