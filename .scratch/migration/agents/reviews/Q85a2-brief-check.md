# Brief check: Q85a2 (oculus/migration)

Everything below was read on main at ae1e8024. The brief and `plan.md` were read from the working tree, and both are uncommitted. Nothing was changed. Every probe ran in my scratchpad against the tree's own modules and its `node_modules/zod` 4.6.5, using node v24.21.0.

## 1. Names

The names were grepped across `tools/oculus` (excluding `node_modules`, `.svelte-kit`, `build`, `.scratch` and `local.yml`) with `grep -rnwI ... "<name>" .`.

- **`mapOf`**: hits outside the brief's paths:
  - `state/sessions/terminals.svelte.ts:123`
  - `state/sessions/terminal/composer.ts:53`
  - `server/content/audit/rules.ts:77`
  - `server/git/deposit.ts:209`
  - `state/workbench/navigation/catalogue.ts:179`
  - `data/sources/config/agents.ts:261`
  - `data/sources/config/rail.ts:32`

  Each one is a separate local function in a later step's folder, so this step makes none of them false. `allow-duplication.txt:24` (`rules.ts` and `deposit.ts`, mark `3a43caa175b4`) and `:20` (`agents.ts` and `catalogue.ts`) stay shared, which is correct.
- **`rootMap`**: hits only in `list-edit.ts`, which is in the paths.
- **`wordsOf`**: hits outside the paths in `ui/forms/choice/MultiSelect.svelte:81`, `content/audit/publications.ts:121`, `state/sessions/terminal/composer.ts:57`, `state/boards/collection.ts:181`, `data/prose/markdown.ts:50` and `views/shared/changes/CommitBox.svelte:94`. All are unrelated local names, and none is made false.
- **`targetOf`**: `tests/routes/edit/config-key.test.ts:18,276` imports `target as targetOf` from `writes.ts`. That is a different function under an alias, so it is not made false.
- **`keyList`**: hits only in `bodies.ts`.
- **`held`**: the function exists only at `audit-mute.ts:34`. Many local variables share the name, and none is affected.
- **`count` / `stamp`**: they are local to `usage.ts`. `usage.ts` is imported by `src/lib/server/machine/usage/transcripts.ts:13-14,96` (`claudeUsage`, `codexUsage`), which is outside the paths. Behaviour is unchanged there, so nothing becomes false; see finding 22 for the timing side.
- **The DESIGN paragraph**: `grep -i "untyped input\|zod"` over `DESIGN.md HELP.md README.md docs src tests config` finds `DESIGN.md:148`, `README.md:13` (the zod sentence, which stays true) and the head comments of the three Q85a1 files. HELP.md has no hit.

1. **`src/lib/server/core/json.ts:91-92` becomes false.** The comment reads "the helpers `text`, `whole` and `list` below it, which modules of `sessions`, `files` and `git` import". The importers today:
   - `whole`: `cache.ts:12`, `fold.ts:27`, `registry.ts:17`, `stores/codex.ts:18`, `stores/transcripts.ts:39`.
   - `list`: `fold.ts`, `stores/turns.ts:22`, `stores/background.ts:25`, `stores/codex.ts`.
   - `text`: `turns.ts`, `registry.ts`, `codex.ts`, `git/git-routes.ts:22`.

   (`grep -rnE "from '[./]*(core/)?json(\.ts)?'" src`.) Once the step converts those readers, `list` has no caller left in any folder, and the comment's claim about `sessions` stops being true. `core/json.ts` is not in "Paths this step writes". Item 10 hands the dead helper to Q85a4, but Q85a4's line (`plan.md:319`) does not name it, so the deferral is booked nowhere. The rules file says "A sentence in a document or a head comment that the change makes false is a defect of the change". Recommendation: add `core/json.ts` (the comment and any helper left without a caller) to the paths.

## 2. The step line

The plan line on disk (`plan.md:317`) reads "(28 files, 308 check lines)".

2. **The brief quotes a stale plan line.** "The plan line" (brief line 9) quotes "(27 files, 294 check lines)" and then calls 28/308 a "premise corrected". `git diff plan.md` shows that the line was already changed to 28/308 in the working tree. The quote and the "Premise corrected" sentence should be brought into line with `plan.md:317`.

Mapping of each part of the line, and of "the same" as Q85a1's line defines it:

- **Runtime validation on zod**: items 1 to 8.
- **The three folders**: items 2 to 9. Z127, which folds Q85a3 into this step, is covered.
- **The `data/model` types kept as the facade through `satisfies`**: one sentence in item 1. No verify item checks it (see finding 13).
- **The redundant hand checks deleted**: items 2 to 9, plus verify 3 and verify 4.
- **Every reader answering what it answers today**: item 1 and the cases.
- **"after Q85a1"**: Q85a1 is ticked (`plan.md:315`).
- **Q85a1's "each later step widens the folders the paragraph names"**: item 11.

No part of the line is without an item.

## 3. Premises

- `grep -n '"zod"' package.json` prints `83: "zod": "4.6.5"`, which matches.
- The count loop over the three folders prints 28 files and 308 lines. The per-file figures match the brief exactly. The total was checked with `... | awk '{s+=$1} END {print s, NR}'`, which gave `308 28`.
- The line ranges `guards.ts:16,21,42,66` match. The duplicate helpers at `deck-edit.ts:34-37`, `rail.ts:36-39`, `audit-mute.ts:34-37,40-43`, `list-edit.ts:173-176`, `undo.ts:177-181` and `customizations.ts:136-140` match. `allow-duplication.txt:19,23,25` match.
- `wc -l` gives 865 for `yaml-edit.ts` and 589 for `entries.ts`. `ls tests/server/edit | wc -l` gives 10. `ls tools/oculus/docs/adr` finds nothing. `DESIGN.md:148` is the paragraph as described.

3. **`manifest.ts:184-190` `removedOf` is described as reading "a recorded `before` value".** That is wrong. It reads the record's `removed` key: `manifest.ts:248` calls `removedOf(removed)`, and `core/changes.ts:84` declares `removed?: RemovedText`. Case 16 repeats the error ("recorded `before` values").
4. **`entry-edit/subtasks.ts:133` is given as the call of `asFieldValue`.** The call is at line 134. This is minor.
5. **Case 13 names a reader that does not exist in `edit/`.** It says "through `readFeed`". `edit/feeds.ts` exports `readFeedFile` (`feeds.ts:54`). The only `readFeed` is an unexported function in `data/sources/feeds.ts:48`, which is a different reader in Q85c's folder.
6. **`createIdea`'s parse is not an outside value.** `manifest.ts:386-390` is listed under "Files oculus parses", but it parses `manifest`, a text the writer builds from `lines` a few lines above (`manifest.ts:378-384`). It is the writer re-parsing its own result.
7. **Lines of the count are missing from both of the brief's lists.** The report must give a reason for every remaining line, and these lines are neither converted nor listed under "The other check lines" (from the per-file `grep -nE "typeof |Array\.isArray|isRecord\(|isMap\("`):
   - `yaml-edit.ts:126` (`safeParse`'s `isMap(parsed)`, which falls outside the listed ranges 141, 169-332 and 402-751)
   - `manifest.ts:147` (`currentOf`)
   - `entry-edit/subtasks.ts:131`
   - `overrides.ts:99,100,102,145,146,148` (`setFlag`/`setOverride` reading `~/.oculus/sessions.json`)

## 4. Cases and checks

8. **Case 12 is wrong on the unchanged tree.** It says "a `Date` answers undefined". In fact `asFieldValue(new Date(0)) === date` is `true`, because `isBlockMap` accepts any `isMap` value whose `Object.values` are all block values, and a Date has none. `asFieldValue([date])` also answers the input, as a list of maps of strings. My probe printed `asFieldValue(Date) === Date: true` and `asFieldValue([Date]): [ 1970-01-01T00:00:00.000Z ]`. The same probe showed `z.record(z.string(), z.unknown()).safeParse(date).success === false`, while `z.object({})` and `z.looseObject({})` accept a Date. So a `fieldValueShape` built on `z.record` would also change this answer. The case needs the answer the tree gives (the Date itself), and item 3 needs to say how a non-plain object is kept.
9. **Case 16's field name is wrong** (see finding 3): the recorded value is `removed`, not `before`. The case also names no single file ("`writes.test.ts` or `writes-collection.test.ts`") and points at `tests/routes/edit/undo-removed.test.ts`, which is outside the paths. A fixture copied from there into `tests/server/edit` risks a duplication clone that has to be folded into a helper (`tests/routes/edit/write-fixture.ts`), and that file is also outside the paths.
10. **Case 23 names no file** ("the cache's tests"). No `cache.test.ts` exists. The cache cases live in `tests/server/sessions/stores/transcripts.test.ts:26`, which imports `CACHE_VERSION`, and that file is in the paths. The case should name it.
11. Cases 1 to 7, 9 to 11, 13 (apart from the name), 14, 15 and 19 to 22 match what the unchanged code gives, from reading `bodies.ts:115-370`, `feeds.ts:64-71`, `manifest.ts:44-55`, `subtasks.ts:165-170`, `usage.ts:23-100`, `overrides.ts:34-42`, `registry.ts:122-140` and `customizations.ts:217-245`. Cases 17 and 18 compare against values recorded from the unchanged tree, so they match by construction.
12. **The rules file's rename grep is not in the verify list.** The rules file (`spec.md`, "After changing a name ... grep it across `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md` ... quote that grep in the report") requires a repository-wide grep for the removed helper names. Verify 4 greps only `edit` and `sessions`. No case is inconsistent with the rules file, but the verify list does not make this grep a deliverable.

## 5. The question: could it pass without the goal being reached?

The goal: every outside value in these folders is checked by a zod schema at its reader, behaviour is unchanged, and the redundant hand checks are gone.

- **Cases 1 to 23**: yes, by design. Each case is required to pass on the unchanged tree, so the cases prove that behaviour is preserved and say nothing about conversion. That is acceptable only if the verify list enforces the conversion, and it does not (finding 13).
13. **Verify 3 has no target.** It asks for the per-file count before and after, with a reason for each remaining line, but states no expected after-count. Q85a1's verify 3 listed the count for each file. As written, a reader left hand-written passes as long as the report writes a reason. The loop's regex also cannot see the helper-based narrowings, for example:
    - `registry.ts:132-138` (`text(data.status)`, `whole(data.startedAt)`)
    - `turns.ts:94,107,108,125,127,178,188,198`
    - `codex.ts:105-124,137,143,173,225,233-265`
    - `cache.ts:66,80` and `transcripts.ts:185`

    (`grep -rnE "\b(whole|list|text|str|scalar|fields|strings)\(" src/lib/server/sessions src/lib/server/transcripts`.) Item 9 also moves `mapOf`, `held` and `wordsOf` onto `fields` and `strings`, which lowers the count without adding a schema. Recommendation: state the expected after-count per file, add the helper regex to the loop, and add Q85a1's per-file `grep -c "satisfies z.ZodType"` and `safeParse` presence checks for each converted reader.
- **The `satisfies` part of the step line**: it could pass without `satisfies`, since no check counts it (same remedy).
- **Item 13, the fold's time**: this is a guard, not the goal. It times only `foldFrom` (see finding 22).
- **Verify 4**: it holds the naming and the error-text rules and proves the four helpers are gone, but proves nothing about conversion.
- **Items 1 to 11**: each could be met in a form that leaves outside values hand-narrowed, for the classification reasons in section 6. With no per-file target the reviewer has no fixed measure.

## 6. Implied inputs and classification

Inputs the step implies that "Cases" never states, with the answer the unchanged code gives:

14. **`readFeedFile` with empty YAML keys.** `entries:` empty (YAML `null`) answers `entries: []`, because `parsed.entries ?? []` at `feeds.ts:68`. `meta:` empty (YAML `null`) throws "meta is not a map", because `parsed.meta === undefined ? {} : parsed.meta` at `:66`. `parse('meta:\nentries:\n')` gives `{"meta":null,"entries":null}` (probe). A schema with `entries: z.array(...).optional()` would throw on the first. Add both to case 13.
15. **Integers above 2**53.** `z.number().int()` and `z.int()` refuse `2 ** 60`, while `Number.isInteger(2 ** 60)` is `true` (probe). Affected:
    - `registry.ts:128` `pid` (case 21)
    - `manifest.ts:187` `offset` (item 6 and case 16: "a non-negative whole number")
    - `count`/`whole` truncation (`usage.ts:23`, `registry.ts:137`)

    Add `pid: 2 ** 60` (a candidate) and `offset: 2 ** 60` (lines put back when they fit; otherwise the same path as today).
16. **`feedFieldWrite` with `value: Infinity`** is accepted today (probe: `feedFieldWrite Infinity: Infinity`). `z.number()` refuses Infinity and NaN (probe), and case 6 holds NaN but not Infinity. Add `Infinity` and `-Infinity`.
17. **Own `__proto__` keys from YAML.** `parse('career_host_status:\n  __proto__: 1\n  b: 2\n')` makes an own `__proto__` key, and `careerRules` answers statuses `['__proto__', 'b']` today. `z.record(...).safeParse(...).data` drops an own `__proto__` key (probe: own keys of data `[ 'b' ]`). Add this to case 15. The same applies to `overrides` and `loadCache`: each builds `found[key] = value`, and for the key `__proto__` that sets the prototype of `found` rather than an own key. Add a `sessions` map with an own `__proto__` key to cases 20 and 23, answered as today.
18. **`??` precedence in the fold.** Two places read a fallback field only when the first is nullish:
    - `fold.ts:144` `record.effort ?? message.effort`: with `effort: 3` or `effort: ''` and `message.effort: 'high'`, `acc.effort` is unchanged today.
    - `fold.ts:195` `args.file_path ?? args.notebook_path`: with `file_path: 3` and `notebook_path: 'x'`, no file is counted and the event is the tool name.

    A schema that reads the first field with `.catch(undefined)` changes both. Add them to case 17.
19. **Optional body fields given `null`.** `sessionWrite` with `hidden: null`, `subtaskWrite` with `value: null`, and a target with `collection: null` each answer null today (`bodies.ts:144-145,188-189,119-120`). These break under `.nullish()` or `.catch`. Add them to cases 2 and 3.
20. **Gaps in the other cases.**
    - Case 21 has no `startedAt` inputs (`1.5` answers 1; `'5'` and absent answer 0).
    - Case 14 does not cover `metalistFields`, which item 5 converts. It is unexported (`entries.ts:139`) and reached through `writeEntry`.
    - Case 17 lacks a `last-prompt` record with `lastPrompt: ''`, which sets `''` (`fold.ts:51`), unlike `aiTitle`, which needs a non-empty string.
21. **A non-plain object where a body reader tests "is this a map"** (a `Date` or a `Map` as `fields`). `isMap` accepts it, and `z.record` refuses both (probe: `z.record Map: false`). It cannot arrive from JSON, but item 1 promises the same answer "for every input". Either add a case or narrow the promise to JSON values.
22. **The timing check misses the usage table's scan.** `transcripts/usage.ts` also serves `machine/usage/transcripts.ts:96`, which streams seven days of transcripts through `claudeUsage`/`codexUsage` on each refresh. Item 13 times only `foldFrom`. Recommendation: time `claudeUsage`/`codexUsage` over the same 50,000 records.

Classification (from reading each site):

23. **The cache file's values are classed as process-made, and they are not.** `cache.ts:65` (`typeof entry.path === 'string'`), `:79` (`isMap(cached.acc)`), `:66` and `:80` (`whole(...)`) and `transcripts.ts:185` (`whole(cached.offset)`) read entries that `loadCache` returned unchecked from `~/.oculus` (`cache.ts:48`, `value as unknown as CacheEntry`). `rehydrate` (`cache.ts:88-102`) then copies any disk value into the typed `Acc` (`if (key in stored) acc[key] = stored[key]`). So `group.ts:86-87,219-220` are the only guard on a cached `files` value, and their stated reason ("the `SessionRecord`s the fold built") is wrong for a cached session. Under the goal, the cache entry is an outside value whose reader is `loadCache` plus `rehydrate`. The brief converts only `loadCache`'s accept/refuse and leaves `size`, `mtime`, `inode`, `offset` and `acc.*` unchecked at the reader. The brief should either give the entry and `Acc` fields a schema (keeping each field's current fallback) or state why they stay, and correct the reason for `cache.ts:65,79` and `group.ts`.
24. **`undo.ts:237,244,295-297` are given the wrong reason.** The brief says they choose "which writer an undo calls, by the kind of the recorded value". They do not choose a writer, which is chosen by `change.kind`. They narrow the changes log's recorded `before` value (outside, and hand-editable, as `manifest.ts:182` itself says) into a writer's argument with a fallback (`''` or `null`). The same holds for `fields(change.before)`, `wordsOf(before.selection)`/`wordsOf(before.order)` and `railRows(change.before)` at `undo.ts:250,253-254,261,270-271,301,315`. By the brief's own boundary (decision 1: "a schema where a named field of an outside value is read into an answer"), these convert, as `removedOf` does.
25. **`audit-mute.ts:77`** reads the `ignore` list of the parsed audit configuration file into the list it writes (`held(mapOf(parse(source))[IGNORE])`). That is a named field of an outside value read into an answer, so by decision 1 it converts. Item 9 only swaps it onto `strings(fields(...))`.
26. **`writes/entries.ts:170-176` (`entryId`) and `:247,275,289`** read `id`, `key`, `title` and the identity field of a collection file's entries (YAML parsed from the hub) with type fallbacks. The brief keeps them as "identity and value reads of entries already read". They are reads of an outside value into an answer, and the brief gives no reason why the rule does not apply.
27. **Readers the item 7 enumeration leaves out.** `codex.ts:128` `foldEvent`, `:232` `subAgent` and `:256-271` `foldResponseItem` read record fields through `text`/`whole` and are not named. The last one falls outside the cited range `codex.ts:58-250`. Item 7's file-level sentence covers them, but the list does not.
28. **`customizations.ts:145-153,298-327` and `:335-338`** (`mapField`, `mcp`, `plugins`, `tomlTools`) read the agents' JSON and TOML files with map tests only. With `mapOf` swapped for `isMap` they stay under item 1's bare-map rule, but they are listed neither as converted nor as staying.
29. **`createIdea`** is converted as an outside value, but it is not one (finding 6). Its `isMap` stays under item 4 in any case, so only the classification text is wrong.

## 7. ADRs

`ls tools/oculus/docs/adr` prints "No such file or directory", and `ls tools/oculus/docs` shows only `diagrams`. No ADR folder exists, which matches the brief's line 3.

## Declined to judge

- **Whether `allow-duplication.txt:26` keeps its mark** (`lines.ts:107` and `yaml-edit.ts:317`, mark `22e246596d51`) once `asFieldValue` above it changes. The check matches entries by pair and mark (`duplication.test.ts:597-606`), not by the line numbers in the reason. Whether the cloned tokens or their extent change depends on the builder's edit; only a run of `tests/checks/tree/duplication.test.ts` after the change settles it. If the mark changes, the brief's "no other line of the file changes" and "never added to the allowlist" would collide. Separately, the reason text's "at ... 317" goes stale once the line moves, and the check does not read it.
- **Whether `group.ts:392-397` (`readFolders`) and `group.ts:113,129` (the `Override`s) read outside values.** The `Override`s come from `overrides()`, which hands each parsed entry on whole, so `area` and `title` are disk values. Whether that is "checked at the reader" depends on how finding 23's ruling treats a reader that hands its input on. That is the orchestrator's call.
- **Whether `zod`'s `z.object` keeps absent optional keys absent for every schema form the builder may write.** I probed only the plain `z.object({ a: z.string().optional() })` (keys `[]`).

## Usage

44 tool uses, about 230,000 tokens, time not measured.

## Closed

Each finding closed in `agents/briefs/Q85a2.md` by the orchestrator:

1. `core/json.ts` added to the paths; item 10 deletes a helper left with no caller in `src` and corrects the comment at `core/json.ts:91-92`; What is on the tree lists the importers.
2. The plan line is quoted as it stands (28 files, 308 check lines), and the premise-corrected sentence says the line was changed at this brief.
3. `removedOf` is described as reading the record's `removed` key (`manifest.ts:248`, `core/changes.ts:84`); case 16 says `removed`.
4. `entry-edit/subtasks.ts:134`.
5. Case 13 runs through `readFeedFile` (`edit/feeds.ts:54`).
6. `createIdea`'s parse moved to the bare map tests, as the writer re-parsing its own text.
7. `yaml-edit.ts:126`, `manifest.ts:147`, `entry-edit/subtasks.ts:131` and `overrides.ts:99-102,145-148` are listed under the bare map tests, with their reasons.
8. Case 12: a `Date` and `[date]` answer themselves; item 3's block-map branch is a `z.custom` over `isBlockMap`.
9. Case 16 names `tests/routes/edit/undo-removed.test.ts` and its own fixture, and that file is added to the paths.
10. Case 23 names `tests/server/sessions/stores/transcripts.test.ts`.
11. No change needed.
12. Verify 7 is the rules file's rename grep.
13. Verify 3 adds the helper regex, makes a line inside a listed reader a finding, and asks for each reader's schema and the per-file `satisfies z.ZodType` and `safeParse` counts.
14. Item 4 and case 13: `entries: null` answers `[]`, `meta: null` throws the `meta` sentence.
15. Item 1: whole numbers through `z.number().refine(Number.isInteger)`; cases 16 and 21 hold `2 ** 60`.
16. Item 2 and case 6: `Infinity` and `-Infinity` accepted.
17. Item 1 reads keys from the input's own keys; cases 15, 20 and 23 hold an own `__proto__` key.
18. Item 1's `??` rule; case 17 holds both fallbacks.
19. Item 2 and cases 2 and 3: `hidden: null`, `value: null`, `collection: null` answer null; optional fields are never `.nullish()`.
20. Case 21 holds `startedAt`; case 14 reaches `metalistFields` through `writeEntry`; case 17 holds `lastPrompt: ''`.
21. Decision 7: the body readers are held to every JSON value.
22. Item 13 also times `claudeUsage` and `codexUsage`.
23. The cache entry is an outside value: item 8's `cacheEntryShape`, an entry of the wrong shape dropped and folded from zero (Decision 6, the one changed answer, case 23), and the redundant checks at `cache.ts:65-66,79-80` and `stores/transcripts.ts:185` deleted. `group.ts`'s reason corrected: argument checks of an exported function whose tests hand it malformed records (Decision 8).
24. The `undo.ts` reads of a record's `before` value convert (item 6), with the reason corrected in What is on the tree.
25. `audit-mute.ts:77`'s `ignore` list converts (item 4).
26. `entryId` and the identity reads at `writes/entries.ts:247,275,289` convert through one `idPartShape` (item 4).
27. Item 7 and What is on the tree name `foldEvent`, `subAgent` and `foldResponseItem`, range `codex.ts:58-271`.
28. `customizations.ts:145-153,298-327,335-338` listed under the bare map tests.
29. Closed with 6.

Declined points: line 26 of the allowlist is in the paths for its mark only when the duplication check names it after the change; the `Override` reads in `group.ts` stay (Decision 8); the `z.object` absent-key point is held by the rule that absent keys stay absent and the cases that assert with `toStrictEqual`.
