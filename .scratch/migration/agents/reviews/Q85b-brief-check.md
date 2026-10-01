# Brief check: Q85b

Model: claude-sonnet-5-5 (served, read from the agent's record). Usage: 321979 tokens, 91 tool uses, 871 s (14 min 31 s), from the completion notice.

BRIEF CHECK, Q85b (zod in `src/lib/state`). Nothing was changed anywhere. All commands ran from `/Users/axelfaes/workspace/research-hub/tools/oculus` on main at bf9b3da0. `config/local.yml` was not read. Ports 8787 and 8790 were not touched. No vitest, build or vite process was run.

Verdict: the brief is not ready to dispatch as written. Findings 8.2, 8.3, 8.4 and 8.5 each stop the builder at a check or a step. Findings 6.1, 6.2 and 6.3 leave parts of the goal unreached while every check passes. Details follow, by heading.

## Names

Command: `grep -rln "core/shapes" src | wc -l` printed `20`, and the 20 files are the server importers (`edit/feeds.ts`, `edit/yaml-edit.ts`, `edit/writes/{audit-mute,bodies,entries,manifest,subtasks,undo}.ts`, `files/fs/bookmarks.ts`, `files/{project-files,search}.ts`, `machine/pty/channel.ts`, `machine/usage/accounts.ts`, `root/hooks.ts`, `sessions/{cache,fold,overrides,registry}.ts`, `sessions/stores/{codex,turns}.ts`). That count is right.

Command: `grep -rn "core/shapes\|shapes\.ts" src tests DESIGN.md HELP.md README.md config utils` (hits on `stores/shapes` filtered out).

1. `tests/server/core/json.test.ts:25` imports `../../../src/lib/server/core/shapes.ts`, and `:5` says "quickly in server/core/shapes.ts". The file is not in "Paths this step writes". After the move the import breaks. Verify 4 (`grep -rn "core/shapes" src tests` prints nothing) cannot pass without editing it. Item 12 ("no existing test case is edited") does not forbid an import-path edit, but the path list does. Fix: add the file to the paths and name the import and comment edits as the only edits to it.
2. `src/lib/server/core/json.ts:3` says "The zod helpers the readers share are in shapes.ts, which cannot reach the disk." After the move that sentence names no folder and is stale. `core/json.ts` is not in the paths. Verify 4's grep does not match it (it has `shapes.ts`, not `core/shapes`). Fix: add `core/json.ts` to the paths. Make verify 4 `grep -rnE "core/shapes|in shapes\.ts" src tests`, or require a reader of the comment.
3. The brief says `data/shapes.ts` is "unchanged but for its head comment". Line 7 of the file (`import { strings } from '../../data/helpers/guards.ts'`) must also change to `./helpers/guards.ts`. The head comment also says "Layer 2, server" and explains the split from `json.ts` by the server's write diagram. Both must be rewritten for Layer 1, data. Fix: say "head comment and the one import path".
4. `DESIGN.md:148` is the only DESIGN/HELP/README/config hit for `core/shapes`. The brief covers it. `DESIGN.md:176` and `tests/checks/imports/order.test.ts:79-87` name `state/shared/stores/shapes.ts`, a different module, and stay true. Two modules named `shapes.ts` (`data/shapes.ts` and `state/shared/stores/shapes.ts`) will then exist in the tree (`git ls-files | grep -E "(^|/)shapes\.ts$"` shows `core/shapes.ts` and `stores/shapes.ts` today). Reader confusion, not a defect.
5. The local `isMap` copies are named in the brief by line only. Their names are `record` (`feeds/inbox.ts:47`, `feeds/leads.ts:46`, `feeds/linkedin.ts:31`, `workbench/rail-badges.ts:23`), `objectOf` (`repositories.ts:244`) and `mapOf` (`catalogue.ts:179`). Verify 7 (`grep -rnw <name>`) needs those names, and `record` is a common word. The brief should list names.
6. Two more copies of the same function are not listed. Command: `grep -rnE "function (mapOf|record|objectOf)\b|isMap\([a-z]+\) \? [a-z]+ : null" src/lib/state` shows `sessions/terminals.svelte.ts:125-126` and `sessions/terminal/composer.ts:53-54`, both `mapOf(value) { return isMap(value) ? value : null; }`. Item 9 lists only the `typeof` expansions, not these two wrappers, which are a third and fourth copy of `catalogue.ts`'s `mapOf`. The duplication rule ("a parser exists once") covers them.
7. The local `strings` readers are `venues.ts:31`, `datasets.ts:12` and `socket.svelte.ts:191`. The first two match `guards.strings` (`guards.ts:67-70`, same filter). `socket.svelte.ts:191` does not (it reads a map's values), as its own comment says. Item 9 lists "`graph.ts:421`" as `stringList`, `collection.ts:91-93` as `savedList`, `selectors.svelte.ts:281-282` (inside `createSelectors`), and `slides.ts:38-39` as `words`. Their names are not given.

## The step line

Plan line, `plan.md` working tree (uncommitted diff): "Q85b the same in the state layer (`src/lib/state`, 71 files, 506 check lines), after Q85a1, Q85a2 and Q85a4 (ruling The queue) (ruling Z73)". `git diff plan.md` shows the 70 to 71 edit is in the working tree only. `plan.md` has no section titled Goal. I read its header paragraph and the Packages list.

Mapping:
- "The same" (zod validation, `data/model` facade through `satisfies`, redundant hand checks deleted, answers unchanged): items 1, 3 to 9, and 10 (what stays).
- "In the state layer, 71 files": the paths list, items 3 to 9.
- "506 check lines": verify 2 (before and after per file). The brief never states how many lines are expected to remain, so the 506 is never reconciled to a target.
- "after Q85a1, Q85a2 and Q85a4": landed. `git log` shows 58b860a0 (Q85a4), 0b38c14c (Q85a2).
- Z73 (`orchestrator-state.md:275`) "schemas at the inputs of its area, delete the hand checks they make redundant": items 1 and 3 to 9.

Items with no part of the line behind them: item 2 (move `core/shapes.ts` to `data/`, edit 20 server files), item 13 (timing bound), item 14 (bundle measure). Item 2 is the only one that is a design choice outside the state layer. It is in "Decisions taken", so it is surfaced, but see finding 8.2: its location is wrong.

Parts of the line with no item: none.

## Premises

Commands rerun:
- The loop `for f in $(grep -rl unknown src/lib/state --include='*.ts'); ...` printed 71 files; the sum of the counts is 506. Holds.
- Twin: `for f in $(grep -rL unknown src/lib/state ...)` hits exactly `shared/words/fuzzy.ts:62`, `shared/stores/in-browser.ts:9`, `life/calendar.svelte.ts:47`, `workbench/navigation/notice-sources.ts:75`, `client/clock.svelte.ts:22`. Holds.
- `find src/lib/state -name '*.ts' | wc -l` printed 143.
- `grep -rn "from 'zod'" src | wc -l` printed 59, none under `state/`, `data/`, `views/`, `ui/` or `shell/`. Holds.
- `ls tools/oculus/docs`: only `diagrams`. `data` tracked entries: 8. `data/helpers`: 10. `core/shapes` importers: 20. Holds.

Wrong or inaccurate premises:
1. "The five of its twin that hold a converted reader" (Paths) is wrong for four. `fuzzy.ts:62` is an argument check (`textParts`), `in-browser.ts:9` an environment test, `clock.svelte.ts:22` a `typeof` in a type, and `notice-sources.ts:75` a `listOf` of a payload list with an `as readonly T[]` cast (see 6.5). Only `life/calendar.svelte.ts:47` (a refusal's `code`) is a reader. The brief itself lists the first three under "other check lines" or as `ReturnType<typeof>`.
2. "`retryAfter` of a group" (kind "answers", `writes.svelte.ts:56-58`, and case 4) does not exist. `grep -rn "retryAfter\|retry_after" src/lib/state` prints nothing. Lines 54-60 are `writeTimeout(config)`, reading `writes.timeout_seconds` with `typeof n === 'number' && Number.isFinite(n) && n > 0 ? n * 1000 : null`. Case 4 must be re-written over `writeTimeout` with `timeout_seconds` of `0`, `-1`, `'5'`, `NaN`, `Infinity`, `5`. `tests/state/client/writes.test.ts:31-40` already tests `30`, `0.5`, `0`, `-3`, `[]`.
3. Wrong kind: `writes.svelte.ts:103` is `setToken(next: string)`, an argument of a typed function, not a server answer. `:284-285` is `addLinkedinIdea(fields)`, the caller's own form fields, not an answer. Both are single arguments tested once with a fallback, which Q85a4's carried-over decision keeps. The brief lists them as readers to convert.
4. `writes.svelte.ts:133` (`postCommand`'s `fields(parsed)`) and `hpc.svelte.ts:54` (`fields(await response.json())`) are bare map tests through `guards.fields`. The brief lists the second under "an unchecked `as` cast and no check line", but the cast column printed `casts=0` and the line has no `as`. Q85a4's carried-over decision says a bare map test stays `isMap`. Case 21's hpc case ("a body that is a list") then answers `{}`. The brief must say whether these two convert or stay.
5. Wrong kind: `system/hpc.ts:84-87` is `parseHpcState`, a Live HPC pane's instance state (`fields(raw)` and a `typeof boolean` per key), filed under "merged configuration". `sessions/source.svelte.ts:77-80` is `indentOf` and `:160-185` is `sourceDraft`, a draft read from the tab's instance state, filed under "answers of the server". `composer.ts:305-315` is `customizationScopeOf`, an instance-state field, and is listed twice (instance state `:305-315` and configuration `:308-314`).
6. `tests/checks/tree/boundaries.test.ts:117-141` is not the state row. `grep -n "state: \[" ...` prints line 113, and the array closes at line 135. S3c's brief repeats the same range.
7. Line gaps in the reader ranges (see 6.1): `sources/fs.ts:232` (`countOf`) lies between the listed `188-221` and `235-266`.
8. The cast grep is not complete (see 6.3). Command: `grep -rnE "\.json\(\)\)? as |\) as \{|as (Entry|SchemaField|NoteRow|FsEntry|string)\[\]\)|as Body|as Answer|as ConnectSetup|as Partial<" src/lib/state` prints 25 hits, and all 25 are on the brief's list except `system/lines.svelte.ts:106` (`(await response.json()) as unknown`). Verify 3 ("the cast grep prints nothing") would fail on that unlisted line.
9. Sizes the brief omits: `wc -l src/lib/state/sessions/terminals.svelte.ts` prints `899`. `tests/checks/tree/size.test.ts:28` fails a non-allowlisted file over 900 and `utils/size-allow.txt` has no entries. See 8.6.

Everything else in "What is on the tree" matched: the 25 cast lines, the 20 importers, 8 and 10 folder counts, the boundary rows in `DESIGN.md:171`, and the quoted helper list in `core/shapes.ts` (`unchanged`, `mapShape`, `anyNumberShape`, `filledTextShape`, `wholeShape`, `stringItemsShape`, `quickly`, `readAs`, `text`).

Range checks: I mapped every `file:range` in the brief's five reader bullets and the other-lines bullet to the tree lines (script in the scratchpad). 184 tokens were mapped. Every range contains at least one check line or cast, except the seven cast-only ones above. I read the readers named in the cases by hand: `handle` is `socket.svelte.ts:237-258`, within `236-256` plus 2 lines. `readNode`, `writeTimeout`, `exchange`, `parseSearchState`, `answerOf`, `listFilterOf` and `readTab` are the functions the brief means. Other ranges were not each read in full (see Declined to judge).

## Cases and checks

Reading each case against the rules file (`spec.md`) and the tree.

1. Case 1 (frames). `handle` is a closure inside `createSocket` (`socket.svelte.ts:237`), not exported. It is driven through a stub `WebSocket`, as `tests/state/client/config-seed.test.ts:6,37` does; the brief should say so. `version: NaN` cannot arrive in JSON; `1e999` gives `Infinity`. Say only that. The "NaN" wording is wrong.
2. Case 2 (`strings`). `strings` (`socket.svelte.ts:191`) is a closure and not exported; it is reached through `installConfig(payload)` and read back through the glyph catalog. With `JSON.parse('{"a":"x","b":3,"__proto__":"y"}')` the hand code writes `map['__proto__'] = 'y'`, which is a no-op for a string, so the answer is `{ a: 'x' }`. Expected result: `Object.keys` is `['a']`. A build with `Object.fromEntries` keeps an own `__proto__` key, so the case does detect the difference. State the expected result in the case instead of "what the unchanged tree answers".
3. Case 3 (a write's answer through a stub fetch). For a body that is JSON `null` the hand code throws inside `exchange` (`writes.svelte.ts:441`, `body.error` on null, or `:450`, `body.changed`). The `catch` at `:463-470` turns it into `{ ok: false, error: "Cannot read properties of null (reading 'changed')", network: true }`. For a non-JSON body the answer text is the engine's SyntaxError message. Recording these into a test breaks "a test never asserts a known defect" (hub CLAUDE.md, spec.md) and ties the suite to V8's wording. This case is the one place the brief's rule ("every case passes unchanged") and its content conflict. Fix: name the null body and the non-JSON body as the step's changed answers (before: engine text with `network: true`; after: the same answer as `{}`, i.e. `HTTP <status>` or the empty-list success), and test the after.
4. Case 4: see Premises 2. Re-write.
5. Case 5 (fs readers). The brief's own rule says `workspaces`, `entries`, `schema`, `notes` are "accepted or refused by the schema and answered as the input itself". Today these are `Array.isArray(...)` only. The items are not checked: `fs.svelte.ts:383` casts to `{ name: string; roots: FsRoot[] }[]`, `:385` to `string[]`, `:492-493` to `Entry[]` and `SchemaField[]`, `:538` to `NoteRow[]`, and `fs-transport.ts:184` to `FsEntry[]`. Case 5's `dropped: [1, 'a']` is expected "what the unchanged tree answers", i.e. `[1, 'a']` handed on. A schema that validates the items would answer `[]`. The only schema that preserves the answer is `z.custom<string[]>(Array.isArray)`, and then the cast has moved into the schema without checking anything. The brief must choose: validate items (answer changes, name it) or accept a list and say the item type is declared, not checked. Both can be justified. The brief makes neither choice.
6. Case 6. `hitOf`, `fileOf` and `failureOf` are not exported (`sources/search.ts:50,63,74`). Only `answerOf` and `parseSearchState` are. The case must go through `answerOf({ files: [...] })`. Also `parseSearchState` is untested by the case: `root: held.root === undefined ? ALL_ROOTS : words(held.root)` (`search.ts:112`) makes `null` give `''` and absent give `ALL_ROOTS`.
7. Cases 5, 7, 8, 9, 21 need `vi.stubGlobal('window', {})`, because the stores read through `queries.read(..., { enabled: inBrowser() })` and `inBrowser()` is `typeof window !== 'undefined' && typeof fetch === 'function'` (`shared/stores/in-browser.ts:9`). Existing tests do it (`tests/state/sources/fs.test.ts:64`, `tests/state/sessions/changes.test.ts:39`). The brief does not say so. A builder who forgets sees stores that never fetch.
8. Case 9 is mislabelled. "A source answer with `text: 3`, `readIn: null` and an options value `{ tabs: 'yes', size: 4 }`" describes the draft read from instance state (`source.svelte.ts:160-185`), plus `indentOf` (`:75-80`). Two details matter: `sourceDraft` always returns the keys `readIn` and `indent` (value `undefined` or `null`), so "absent keys absent" does not apply; `indentOf` accepts `size` 1 to 8 by `Number.isInteger`, so `{ tabs: true, size: 4 }` is the accepted case and `size: 4` with `tabs: 'yes'` the refused one.
9. Case 11. The input `picks: { a: 'b', c: 1, '': 'x' }` does not reach `wordsOf`: `composerOf` reads `picks.claude` and `picks.codex` (`composer.ts:70-72`). The case must be `picks: { claude: { a: 'b', c: 1, '': 'x' } }`. Today it answers `{ a: 'b', '': 'x' }` for claude (value kept when a non-empty string) and `{}` for codex. For a non-map input `composerOf` returns the module constant `COMPOSER_EMPTY` itself, so `toBe(COMPOSER_EMPTY)` is the identity case to add.
10. Case 12. `listFilterOf` (`folds.ts:98-107`) returns `LIST_FILTER` itself for a non-map (`toBe`), and builds `states` and `agents` by filtering the fixed lists (`LIST_STATES.filter(heldStates.includes)`), so the answer is in the fixed order with duplicates gone. Add `states: ['working', 'archived', 'working']`.
11. Case 13 (`loadUi`). Fine as a stub-storage case, but it holds `instances: []` only. Add `instances` as a map with an own `__proto__` key (see Implied inputs 1).
12. Case 14 (saved arrangement). `saved.ts` is a validator that collects many `problems` sentences, including `JSON.stringify` of the offending value (`readNode`, `readSplit:111-120`), and combines semantic checks (sizes sum to 1, minimum size, folded index in range). Only the shape parts can become schemas. Item 5 says "each part checked with its own schema, as Q85a4's item 6 does". The brief does not say which semantic checks stay by hand, so the builder cannot tell if `rawSizes as number[]` (`saved.ts:125`) and `path as number[]` (`:415`) go. Add both casts to the cast list.
13. Case 15 includes "`arrangement.ts:84`'s `{ ...state }` keeps the same own keys". Correct, and `instance.ts`'s `withCardCursor` returns `state` itself when no cursor is held (`instance.ts:27-30`). Add `toBe` for that.
14. Case 17 covers 16 readers in one line, each "own fields of the wrong type", with the expected answer left to the first run. A table-driven file is the only way to stay within the clone rule; say so (new clones go to a helper, not the allowlist).
15. Case 19 and 20: `form-drafts.svelte.ts:117-125` builds `kept[field] = ...` for each field key. A field named `__proto__` sets `kept`'s prototype, so `Object.keys(kept).length === 0` and the form is skipped. The case does not include it.
16. Case 21 is the least specific: "each with a field of the wrong type". `transcript.svelte.ts:83-110` reads `body.turns ?? []`, `body.offset ?? from`, `body.results ?? {}` and `body.error ?? String(status)`; `merged(...)` runs on whatever came. A `turns: 'x'` input throws inside `merged` and the answer is an engine-text error (`reason`). `changes.svelte.ts:90-100` is the same with `body.changes ?? []`. State the exact inputs.
17. Cases and placement: the brief says new cases go into the module's existing test file. Command: `awk 'END{print NR}'` prints 900 for `tests/state/sources/fs.test.ts`, 896 for `boards/collection.test.ts`, 880 for `boards/focus.test.ts` and `sources/repositories/repositories.test.ts`. The limit is 900 and the allowlist is empty. Folders: `git ls-files tests/state/<dir>` gives 10 items (the limit) for `tests/state`, `boards`, `sources`, `sessions`, `workbench/navigation`, `workbench/layout` and `sources/repositories`. So a new test file for `fs.ts`, `collection.ts`, `focus.ts` or `repositories.ts` has no folder to go in. Fix: name where those cases go (a subfolder that is not yet there needs one of the 10 slots to be freed) before dispatch.
18. `tests/state/client/` has no socket test file (8 items). Case 1 and the timing script need one new file there. Room exists (8 of 10).
19. `src/lib/state/sessions/terminals.svelte.ts` is 899 lines. Adding `frameShape` consts and payload schemas to that file (item 3) crosses 900 unless the removed hand code offsets it. The brief does not say. Fix: state the budget, or move the schemas next to the helper they belong to.

## The question

Goal: every untyped input of the state layer read through a schema, answers unchanged.

Core point: the brief states that "every case passes on the unchanged tree and after the change". So no case can fail when the schema is missing. Cases 1 to 21 are behaviour-preservation tests, not tests of the goal. Items 22 and 23 (existing cases pass) pass on the unchanged tree. Each case, by number:

- Cases 1, 2 (frames, `strings`): pass without the goal (the hand `handle` and `strings` already give those answers).
- Case 3 (write answer): passes without the goal.
- Case 4 (`timeout_seconds`): passes without the goal (the existing hand code gives it).
- Cases 5, 6, 7 (fs, search, project files): pass without the goal.
- Cases 8, 9, 10, 11, 12 (latex, source, terminal tab, composer, list filter): pass without the goal.
- Cases 13, 14, 15, 16 (ui storage, saved arrangement, instance readers, catalogue and rail badges): pass without the goal.
- Cases 17, 18, 19, 20, 21 (instance state, configuration, entry fields, drafts, answers): pass without the goal.
- Cases 22 and 23: pass without the goal by definition.

The only checks that fail when readers keep their hand checks are the greps. Verify 2 says every remaining check line must be named in "The other check lines" or "sit inside a schema". That second clause lets a reader keep `typeof` tests inside `z.custom((v) => typeof v === 'string' && ...)` or `.refine(...)` and pass verify 2 and 3 with no change in how the input is read. Verify 3 only constrains names ending in `Shape`. The count `grep -c "safeParse\|readAs("` per file is reported, not asserted. Fix: say that a `z.custom` or `.refine` that reimplements a type test the shared helpers (`anyNumberShape`, `mapShape`, `filledTextShape`, `wholeShape`, `stringItemsShape`) or a zod type already express is a hand check; require per reader that its answer is built from `safeParse(...).data` or `readAs(...)`; make the reviewer read the diff for it.

Step line and items:
- Step line: could pass without the goal. Yes, if verify 2 is satisfied by wrapped checks.
- Item 1 (rule): not a deliverable; passes alone.
- Item 2 (move shapes): passes without the goal; it is only a move. It can also pass while the move is wrong (see 8.2).
- Items 3 to 9: each passes without the goal for the reason above. Item 9 (replace local `isMap` copies) is the only one a grep can show done: `grep -rnE "function (record|objectOf|mapOf)\b" src/lib/state` would print the copies that remain.
- Item 10 (what stays): a list, no check.
- Item 11 (docs): passes without the goal.
- Items 12, 13, 14: pass without the goal.
- The other half of the goal, "answers unchanged": the cases cover only the inputs they list. Implied inputs below show where an answer can change and every listed case still passes.
- Completeness half: "every untyped input" is not enumerated by any check. Findings 6.1 to 6.5 name readers that the lists and the greps miss; a builder who follows the brief exactly leaves them hand-read and passes everything.

## Implied inputs

Inputs the step implies, with the result the unchanged tree gives (the reader named, so the case can be written). Where the rule needs a ruling, it says so.

1. Own `__proto__` key (made only by `JSON.parse`).
   - `socket.svelte.ts:191-198 strings`: value a string, key dropped (assigning a primitive to `__proto__` does nothing); value an object, skipped (not a string).
   - `composer.ts:57-64 wordsOf` (`kept[key] = one`): a string value is dropped. Same in `parseDrafts` (`form-drafts.svelte.ts:117-125`, `kept[field] = {...}`): an object value there sets `kept`'s prototype, so `Object.keys(kept)` is empty and the form is skipped; `parseAdded` (`:140-148`) assigns an object, so the same. `mergedInstances` (`ui.svelte.ts:407-420`) assigns `merged[id] = ...` the same way. A schema-based build with `Object.fromEntries` creates an own key and changes these answers.
   - `instancesOf` (`ui.svelte.ts:391-395`) spreads, so an own `__proto__` key is kept as an own key.
   - Ruling needed: Q85a4's item 13 ended this defect in the server (skip the key, a named changed answer). Item 1 of this brief says "no answer changes". The two decisions disagree. Options: (a) keep the hand answer (test it, which asserts a defect, conflicting with CLAUDE.md); (b) end it as Q85a4 did, name each changed reader with its probe. The lazy option is (a). The better one is (b).
2. `NaN` and the infinities (JSON `1e999`; a direct call).
   - `typeof === 'number'` readers accept them: `search.ts:50-60` (`line`, `column`, `length`), `:93-97` (`total`, `ms`), `latex.svelte.ts` (`pdf`, `log`, `line`), `fs.svelte.ts` (`modified`).
   - `Number.isFinite` readers refuse them: `writeTimeout`, `staleLag` (`selectors.svelte.ts:167-170`), `boundedTextScale` (`ui.svelte.ts:491`), `terminalFont` (`:339`), `saved.ts:119-120` sizes.
   - `Number.isInteger` and `Number.isSafeInteger` readers: `countOf` (`fs.ts:231-233`), `folded` (`saved.ts`), `indentOf`.
   - `readTab` (`terminal-tabs.ts:129-131`) writes `Number.NaN` into `shares` for a non-number item. The answer contains a NaN placeholder; a schema must produce it too.
   - Expected: as the hand code, per reader. `z.number()` refuses `NaN` and `Infinity`; `anyNumberShape` accepts them.
3. `null` against absent.
   - Raw `??` forms: `leads.ts:162 held?.showDeclined ?? held?.showDismissed`, `transcript.svelte.ts:99-101`, `changes.svelte.ts:92-98`, `latex.svelte.ts:123`, `pty-io.ts:43` (`answer.terminal?.id ?? answer.id ?? ''`). `null` and absent give the fallback; a value of the wrong type passes through unchanged.
   - `search.ts:112`: `root` absent gives `ALL_ROOTS`, `null` gives `''`.
   - `reveal` is set only for a non-empty string and is otherwise an absent key (`leads.ts:170`, `linkedin.ts:144`, `radar.ts:124`, `lines.ts:25`).
   - `sourceDraft` always returns the keys `readIn` and `indent`.
4. A list where a map is expected, and the reverse.
   - Readers with `typeof x === 'object' && x !== null` (no `Array.isArray`) treat a list as a map: `latex.svelte.ts:170-174,190-194`, `source.svelte.ts:168`, `search.svelte.ts:106`, `usage-refresh.svelte.ts:14`, `collection.ts:347,468`, `structure/lines.ts:163`. Field reads give `undefined`, so the fallbacks fire; an own-key walk (`Object.entries`) of a list gives index keys (`collection.ts:469`). A schema built on a plain object type refuses a list. Expected: unchanged fallbacks; the walk case differs.
   - A map where a list is expected: `Array.isArray` is false, so the fallback (`[]` or `undefined`).
5. An answer body that is not JSON, or is `null`, a list, a string or a number.
   - Non-JSON: `response.json()` rejects; each store's `catch` returns an error state with the SyntaxError message (`readWorkspaces`, `readBookmarks`, `readNotes`, `readNote`, `postTerminal`, `tail`, `page`, `load`, `ask`). `postCommand` answers `failed: 'unreadable'` (`writes.svelte.ts:128-132`). `hpc.svelte.ts:54 command` has no `try`, so the rejection reaches the caller.
   - `null`: each reader's first property read throws; the `catch` returns the TypeError message as the error. `exchange` adds `network: true`.
   - List, string, number: properties read as `undefined`; fallbacks fire.
   - Ruling: see case 3 above. The null body is a known defect.
6. Order of keys.
   - Re-saved instance state is compared by its JSON text (`ui.svelte.ts:399-404 textsOf`, `mergedInstances`), so a reader that rebuilds an object in a different key order changes whether a save writes. The spread forms (`{ ...state }`, `instance.ts:27-34`, `arrangement.ts:84`, `rail.ts:61`, `composer.ts:withCustomizationScope`) keep the input order and override a key in place.
   - Expected: same order. A `z.object` rebuild uses the schema's order.
7. Identity of handed-on values.
   - `refused`, `changed`, `branches`, `entries`, `schema`, `notes`, `workspaces`, `dropped` (`toBe`).
   - Constants returned for bad input: `COMPOSER_EMPTY`, `LIST_FILTER`, `NO_WORKSPACES`, `NO_BOOKMARKS`, `NO_NOTES`, `NO_NOTE`, `PENDING`, `COMPOSER_EMPTY`.
   - `withCardCursor` (`instance.ts:27-30`) returns `state` itself when no cursor is held and none is wanted.
   - `answerOf`, `parseLeadsState` and the instance readers return fresh objects; `unchanged` there would be wrong.
8. Duplicates and order in lists filtered by membership: `listFilterOf` (fixed order, no duplicates), `statusHidden` (`new Set`, drop `''`, `ui.svelte.ts:343-350`), `readTab` terminals and `folded` (dedupe). Expected: as the hand code.
9. Prototype-name keys (`toString`, `constructor`) as ids: `byKey` uses `Object.hasOwn` (`guards.ts:54-56`); a schema `z.record` lookup differs. Expected: no such key found.
10. Svelte `$state` proxies. Instance state and the merged configuration reach readers as deep proxies. A reader that read one key now iterates the whole object (`z.looseObject({})`, `unchanged`, `Object.entries`), which registers every key as a dependency inside a `$derived`. This changes recomputation, not the answer. Not verified: a case would count derived runs on a change of an unrelated key.
11. Size. The readers on lists of thousands of rows are not in item 13: `files.svelte.ts:97-136` (a project's file list), `search.ts` `hitOf` (per hit), `lines.svelte.ts:36-127` (per row), `collection.ts` and `ticker.ts` entry reads (per entry per derived), `form-values.ts` (per field). Only `handle` is timed (see 8.5).

### Readers in `src/lib/state` that none of the brief's kinds lists (6)

Method: I extracted every reader range from the five kind bullets and the other-lines bullet, then matched all 511 check lines (506 + the twin's 5) to them. 13 lines matched no range (script and output in the scratchpad); then I grepped `JSON.parse`, `.json()`, storage, `unknown` parameters, `as` casts to payload types, and guards-helper users, in files outside the 80 modules.

1. `src/lib/state/boards/structure/layout.ts:125-136` (`positions(json: unknown, count)`): reads Graphviz's JSON (`objects`, `name`, `pos`) with `(json as { objects?: unknown })` and `object as { name?; pos? }`, check lines `:131,133,134`. The file is in the 71-file loop. The brief lists only `:228` (an argument check) from it. This is a reader of a map and a list from outside the page's own code and fits the brief's own rule for a schema. Add it, or rule it out with a reason.
2. Socket payload contents. `client/entities.svelte.ts:79,81,83,85,87,89,91,95,97,101` cast `payload('portfolio'|'config'|'sessions'|'feeds'|'git'|'hpc'|'calendar'|'inbox'|'usage'|'audit') as <Payload> | undefined`; `workbench/navigation/notice-sources.ts:232,234,236,238` cast `message.payload as SessionsPayload|HpcPayload|Snapshot|InboxPayload`; `sources/fs.svelte.ts:278` casts `message.payload as FilesPayload`; `sessions/terminals.svelte.ts:486` casts `held.payload as SessionsPayload`; `system/docs.svelte.ts:195` casts `as FilesPayload | null`. The brief lists `handle`'s frame (channel, version, map) and three of these (`terminals:487`, `:837`, `docs:196-226`); the contents of the other channels' payloads stay cast and are read by field in every selector and view helper. Either they are the facade (the server's own typed contract) and the brief says so with the reason, or each channel gets a payload schema. As written, the goal "every untyped input of the state layer" is met only for the frame, not the payloads.
3. `sessions/agents.svelte.ts:76-90`: `ask` hands `value: body` (the whole answer) on and `read<T>` casts it `as Held<T>`; only `error` is read at `:70-76`. The brief lists only `:70-76`. The answer is an untyped value cast to `AgentsAnswer`/`CustomizationsAnswer`. Add the cast to the list.
4. `sessions/terminal/pty-io.ts:73-81` `readBusy`: reads `body.busy` items' `id`, `busy`, `command` unchecked. The brief lists `:73` as a cast only; the item reads at `:78-79` need a schema (the case would be a `busy` list holding `null`, `{ id: 3 }`).
5. `workbench/navigation/notice-sources.ts:57-83`: `listOf(payload?.records)` and `listOf(payload.recent)` read lists from the sessions and HPC payloads with `Array.isArray(value) ? (value as readonly T[])`, then read items' `id`, `title`, `hook`. The brief files `:75` under "argument checks of a function over a value the code already holds". The value is a socket payload list, not a held value.
6. Unlisted lines inside listed files: `sources/fs.ts:232` (`countOf`, a saved record's count), `sessions/folds.ts:215` (`agentTokens`, a server agent record's `tokens`), `life/slides.ts:38-39` (`words`, listed only in item 9, not under a kind). `workbench/layout/saved/saved.ts:125,415` and `fs.svelte.ts:383` are casts that the cast grep does not match.

## ADRs

Commands: `ls tools/oculus/docs/adr` -> "No such file or directory"; `ls docs/adr` (from the hub root) -> "No such file or directory"; `ls tools/oculus/docs` -> `diagrams` only; `find . -maxdepth 4 -type d -iname "adr*" -not -path "*/node_modules/*"` printed nothing; `grep -n -i adr .agents/plan.yaml` printed nothing (exit 1). There is no ADR folder and no `adr:` key. The brief's sentence is right.

## The other checks

8.1. Boundary table. Moving the module to `src/lib/data` and importing it from `state/` needs `'data/shapes'` in the state row (`boundaries.test.ts:113-135`) and `DESIGN.md:171`'s row. The `server` and `server/transcripts` rows already allow `data/**`. A comment paragraph for the new entry is needed in `boundaries.test.ts:20-75`. The `ui` and `views` rows do not allow `data/shapes`; that is Q85d's. Not run; read.

8.2. Folder order, a defect in item 2. `tests/checks/imports/order.ts` lists `data` first ("the composition roots head their layers ... `data` itself, whose index.ts builds the portfolio out of every data folder") and then `data/sources`, `data/snapshot`, `data/accounts`, `data/helpers`, `data/prose`, `data/model`. A file directly in `data/` is the head folder. A module in `data/sources`, `data/accounts` or `data/helpers` that imports `data/shapes.ts` imports upward, and `tests/checks/imports/order.test.ts` fails on it. Q85b's own importers are `server/` and `state/`, so this step passes; Q85c (the `data/` readers, `queue.md:8` "it reads `data/shapes.ts`, which Q85b makes") would break on it. Place the module in a folder below the head: a new folder (data holds 8, a ninth fits; ORDER and the diagrams then list it, between `data/accounts` and `data/helpers`, since it imports `helpers/guards`) or an existing subfolder with room. A file in `data/helpers` makes 11 items there (limit 10). Not run: read from `order.ts:3-12,36-43` and the `ORDER` array.

8.3. Folder-size rule for `data/`: 8 items plus one file or folder is 9. Within the limit. Diagrams: `npm run diagrams` regenerates them; whether `readable.test.ts` accepts the new arrows is not verified.

8.4. Module state: `holdsModuleState` (`boundaries.test.ts:179-186`) checks `lib/state/` for `const x = new Map|Set|{}|[]|$state` and `let x`. A schema const (`= z.object(...)`) does not match. No conflict.

8.5. Time bound (item 13). Not runnable as written.
- `handle` is inside `createSocket`, a `.svelte.ts` module that uses the `$state` rune (`socket.svelte.ts:34`). `ls node_modules/.bin | grep -iE "vite|vitest|tsx|svelte"` prints `svelte-check svelte-kit vite vitest`; no `vite-node`, no `tsx`. The earlier steps' scratch scripts ran server `.ts` files with `node --experimental-strip-types` (Q85a2-report.md line 45); that cannot load a rune module. The brief must name how the script loads the module (a vitest file inside the tree is outside "scratch folder outside the tree"; vitest's `include` is `tests/**/*.test.ts`).
- It times `handle` only. The reader at `terminals.svelte.ts:837` runs inside `subscribePty`'s listener, which needs the terminals store and a listener on a `pty:` channel; the reader at `:300-308` runs in `entities.afterReceive`. A script that feeds `handle` frames with no terminals store times neither reader, though the brief names `:837` as hot.
- Q85a2's report (lines 173-186) shows single rounds at 1.50 and a noisy machine; the brief does not copy "five alternating rounds of both trees" from that run. Add it.
- Bundle (item 14): `du -sk .svelte-kit/output/client` prints `30064` today. `grep -rl "ZodError\|ZodType\|\$ZodType" .svelte-kit/output/client` prints nothing, so no client chunk holds zod before; "the size of the client chunk that holds zod, before and after" has no "before". The brief gives no command for finding the chunk after. Add `grep -rl '\$ZodType' .svelte-kit/output/client/_app/immutable | xargs wc -c`, and say "before: none".

8.6. Size limits (finding 19 above and Cases 17): `terminals.svelte.ts` 899, `fs.test.ts` 900, `collection.test.ts` 896, `repositories.ts` 801, `collection.ts` 800.

8.7. S3c overlap, against `agents/briefs/S3c.md`:
- Accurate: `DESIGN.md` lines 85 and 171 (S3c.md:143), `tests/checks/tree/boundaries.test.ts` (S3c.md:144), `state/client/context.ts` `settingsTyped` registration (S3c.md:133), a new `state/system/config/` folder (S3c.md:46), the S3c worktree at a157d199 (`git worktree list`).
- Not accurate: S3c.md names `ui.svelte.ts` only as "(the resets Z149 (2) needs)" (S3c.md:134). `grep -n "setWallpaper\|setCodeTheme\|460" S3c.md` prints nothing. The Q85b brief's "the setters `setWallpaper` and `setCodeTheme`, lines 460-500" is its own inference. On the tree `setWallpaper` is `ui.svelte.ts:471`, `boundedTextScale` is `:491-495` and `setCodeTheme` is `:509`. The brief's stated S3c range 460-500 contains Q85b's own `boundedTextScale:492`, so the sentence "the two hunks of `ui.svelte.ts` are apart" contradicts its own line numbers. Q85b's hunks are `300-392` (loadUi, savedHeld, instancesOf) and `:492`; S3c's hunks are unknown until its builder reports. Fix: say "S3c's hunks in `ui.svelte.ts` are not known; the landing that comes second merges by hand".
- Not named: `docs/diagrams/` (both regenerate; the state file notes it); `tests/state/workbench/ui.test.ts` (Q85b adds cases; S3c's resets will likely add cases there too, `ui.test.ts` is 641 lines).
- The sentence "Any hand reader S3c adds (its instance-state reader, its YAML reader) is converted at the landing that comes second" matches S3c.md:59 (drafts in the instance state) and :158 (the first client import of `yaml`).

8.8. Allowlist: `tests/checks/tree/allow-duplication.txt` has state entries that item 9 can end: `state/feeds/inbox.ts` with `state/workbench/rail-badges.ts` (10 lines at 45 and 21, the two local `record` copies), `state/feeds/leads.ts` with `state/feeds/radar.ts` (12 lines at 145 and 82, the two `parse...State` readers), `state/system/deposit.svelte.ts` with `server/git/deposit.ts`, `state/system/hpc.ts` with `server/machine/hpc/parse.ts`, `state/workbench/navigation/catalogue.ts` with `data/sources/config/agents.ts`. The brief says "an allowlist line whose clone this step ends is removed" without naming them.

8.9. Verify 1 and the other commands: `~/.claude/skills/land/templates/checks.sh` exists. Not run.

## Declined to judge

- Whether the per-reader schemas should validate list items or accept a list only (case 5): it changes answers or leaves a cast in a schema. It is a ruling for Axel; both options are named above.
- Whether payload contents of the socket channels (6.2) belong in this step: also a ruling.
- I did not read every one of the ~300 line ranges in full. I read the readers behind cases 1 to 21 and each reader quoted above. The range-to-function mapping for the remaining ranges is by the script's check-line counts, not by reading the function.
- I did not run any test, the build, the diagrams, or the timing, so the result of the 1.5x bound and the bundle size are not measured, and whether `readable.test.ts` accepts the new arrows is not verified.
- I did not verify zod 4.6.5's behaviour for `.optional().catch(undefined)` on an absent key (key present or absent in the answer); the brief's `toStrictEqual` case covers it.

Usage: about 300,000 tokens (the context counter went from 15,000,000 to 14,697,000 before this message), about 75 tool calls; elapsed time not measured.

## Closed

Every finding is closed by a change to `agents/briefs/Q85b.md`. None changes the step's scope or makes a choice the user would see; the answers that change are those of malformed outside input only.

- Names 1, 2: `tests/server/core/json.test.ts` (import `:25`, comment `:5`) and `server/core/json.ts:3` added to the paths and to item 2; verify 4 is `grep -rnE "core/shapes|in shapes\.ts" src tests`.
- Names 3: item 2 says the body is unchanged but for its one import (`../helpers/guards.ts`) and its head comment, rewritten for Layer 1, data.
- Names 4: no change (a different module).
- Names 5, 6, 7: item 9 names every local copy by name and line (`record`, `objectOf`, `mapOf` including `terminals.svelte.ts:125` and `composer.ts:53`; `stringList`, `savedList`, `words`), with `socket.svelte.ts:191` given to item 3, and a grep that prints nothing after.
- Premises 1: the twin's five are each named with their kind; only `calendar.svelte.ts:47` and `notice-sources.ts` are converted, and the paths say so.
- Premises 2: `retryAfter` replaced by `writeTimeout` (`:54-60`) in What is on the tree and case 4, with expected results.
- Premises 3, 4: `setToken`, `addLinkedinIdea` moved to argument checks; `postCommand:133` and `hpc.svelte.ts:54` to bare map tests kept as `isMap`; `hpc.svelte.ts:54` removed from the cast list.
- Premises 5: `hpc.ts:84-87`, `indentOf`, `sourceDraft` and `customizationScopeOf` filed under instance state, the duplicate composer range removed.
- Premises 6: the state row is `boundaries.test.ts:113-135`.
- Premises 7: `countOf` (`fs.ts:231-233`) inside the listed range.
- Premises 8: `lines.svelte.ts:106`, `saved.ts:125,415` and `fs.svelte.ts:383` added to the casts; item 4 names the three the grep misses.
- Premises 9, Cases 17 (sizes), 19, 8.6: sizes listed under What is on the tree; the `pty:` schemas go into `sessions/terminal/`, since `terminals.svelte.ts` is at 899; item 12 places cases in a new file beside a test file that would pass 850 lines, and frees a folder slot by a subfolder move when a folder is at ten.
- Cases 1: driven through `createSocket` over a stub `WebSocket`; `1e999` only.
- Cases 2: expected result stated (`['a']`), plus a map-valued `__proto__` case.
- Cases 3, Implied 5: the `null` and non-JSON bodies are changed answers (item 15), tested after, failing before.
- Cases 4: rewritten over `writeTimeout`.
- Cases 5: decided: items are checked, a failing item left out (item 4, item 15, decision 8); well-formed lists stay `toBe`.
- Cases 6: through `answerOf`; `parseSearchState` null against absent added.
- Cases 7: `vi.stubGlobal('window', {})` stated for the store tests.
- Cases 8 (finding 8): case 9 rewritten over `sourceDraft` and `indentOf`.
- Cases 9: case 11 over `picks.claude`, `COMPOSER_EMPTY` by `toBe`, a `__proto__` pick.
- Cases 10: case 12 with duplicates and `LIST_FILTER` by `toBe`.
- Cases 11, Implied 1: case 13 adds an `instances` map with an own `__proto__` key; item 15 ends the defect in `strings`, `wordsOf`, `parseDrafts`, `parseAdded`, `mergedInstances` (decision 7).
- Cases 12: item 5 names the shape parts and the semantic checks that stay by hand; case 14 adds a string path and a bad sum.
- Cases 13: case 15 adds `withCardCursor` by `toBe` and key order.
- Cases 14: case 17 is one table-driven test.
- Cases 15: case 20 adds a `__proto__` field (changed).
- Cases 16: case 21 states exact inputs and which answers change.
- Cases 17, 18: item 12's placement rule; the timing test goes into `tests/state/client/` (8 items).
- The question: item 1 says a type test inside `z.custom` or `.refine` is a hand check and each reader's answer is built from `safeParse(...).data` or `readAs(...)`; verify 2 says the same; changed cases fail before and pass after.
- Implied 2, 3, 4, 6, 7, 8, 9: held by item 1's answer-keeping rules (number tests, `null` against absent, list against map, key order, identity, dedupe, own keys), which the cases now exercise at their named readers; `readTab`'s `NaN` placeholder stays through `anyNumberShape` semantics in case 10's run.
- Implied 10: not a change of answer; declined by the checker, left to the timing test of item 13.
- Implied 11: item 13's test feeds a portfolio payload of a real snapshot's size.
- Readers 6.1: `layout.ts:125-136` `positions` added (What is on the tree, item 4, case 21).
- Readers 6.2: decided: channel payloads are read through a top-level schema on arrival in a new `state/client/payloads.ts`, the casts go (item 3, decision 6, case 1).
- Readers 6.3: `agents.svelte.ts` `ask` and `read<T>` added (item 4, case 21).
- Readers 6.4: `readBusy` added (case 21).
- Readers 6.5: `notice-sources.ts:57-83` moved to the payload readers (item 3).
- Readers 6.6: `countOf`, `agentTokens`, `slides.ts` `words` placed under their kinds; the casts added.
- 8.1: item 2 adds the state row's comment paragraph.
- 8.2: the module goes to `data/shapes/shapes.ts`, listed in `ORDER` between `data/accounts` and `data/helpers` (item 2, decision 2, paths).
- 8.3, 8.4: no change needed.
- 8.5: item 13 is a vitest file over a stub `WebSocket` and the terminals store with a `pty:` listener, five alternating rounds; item 14 states "before: no chunk holds zod" and the grep for the chunk after.
- 8.7: the S3c sentence says its `ui.svelte.ts` hunks are not known and `boundedTextScale` sits between its setters; Q88b's shared paths are named.
- 8.8: item 9 names the allowlist lines `:19`, `:22`, `:23`, `:25`, `:26`.
