# Step O78 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O78, base e5ad5b79)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base e5ad5b79   (from the worktree, foreground, exit=1, 5:10.31 wall)
test:quick: 133 changed file(s), from git since e5ad5b79
test:quick: 319 test file(s)
ok      ASCII gate (0.8 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (18.8 s)
ok      eslint (53.8 s)
ok      svelte-check (72.5 s): 1792980423779 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (129.8 s)
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to
+   "defaults/sources.yml:36 collections[1].ticker must be a text, not a map",
+   "defaults/sources.yml:43 collections[8].ticker must be a text, not a map",
+   "defaults/sources.yml:44 collections[9].dissemination_skip must be a text, not a map",
+   "defaults/sources.yml:44 collections[9].ticker must be a text, not a map",
+   "defaults/sources.yml:45 collections[10].ticker must be a text, not a map",
+   "defaults/sources.yml:46 collections[11].ticker must be a text, not a map",
+   "defaults/sources.yml:47 collections[12].ticker must be a text, not a map",
+   "defaults/sources.yml:48 collections[13].ticker must be a text, not a map",
+   "defaults/sources.yml:50 collections[15].ticker must be a text, not a map",
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > matches the hub's own files of a scratch hub to a schema each, read with no finding
+   ".oculus/config.yml:34 collections[1].ticker must be a text, not a map",
    (the same nine problems on the scratch hub's .oculus/config.yml, lines 34 to 48)
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads a key of .oculus/config.yml outside the hub list as not declared
AssertionError: expected [ <horizontal ellipsis>(10) ] to have a length of 1 but got 10
 Test Files  1 failed | 10 passed (11)
      Tests  3 failed | 250 passed | 9 skipped (262)
ok      vitest (207.2 s): Duration  199.41s (transform 303.53s, setup 0ms, import 411.05s, tests 308.39s, environment 38.53s)
ok      vitest slow (290.8 s): Duration  283.16s (transform 11.41s, setup 0ms, import 140.85s, tests 976.06s, environment 20ms)
test:quick: 309.8 s; failed: vitest checks

`npm run diagrams` (the first half of check 1): not run, since it rewrites files in the worktree; the diagram checks inside test:quick (tests/checks/diagrams/*) ran in the vitest checks tier, whose only failing file is config-folder.test.ts.

$ sh utils/unused-exports.sh > unused.txt; diff .agents/worktrees/O78-base/unused-exports.txt unused.txt   (exit=0, worktree unchanged after)
10,11c10,11
< src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, collectionKeys, ENTITY_KINDS
< src/lib/data/sources/config.ts: collectionKeys, loadMachine, CATALOGS_DIR, TEXT_KEY, VOCAB_KEYS, iconCatalog, confirmDelete, fileIconAtArrow
---
> src/lib/data/snapshot/normalise.ts: collectionViews, ENTITY_KINDS
> src/lib/data/sources/config.ts: collectionViews, loadMachine, CATALOGS_DIR, TEXT_KEY, VOCAB_KEYS, iconCatalog, confirmDelete, fileIconAtArrow

$ grep -rnE "['\"\`](data|venues|...|radar)['\"\`]" src | wc -l ; ... | cut -d: -f1 | sort -u | wc -l     (case 12, first grep)
413
134
$ grep -rnE "^\s*['\"]?(data|venues|...|radar)['\"]?\s*:" src | wc -l ; files                               (case 12, second grep)
209
88

$ grep -rn "COLLECTION_PLACES\|isPlacedCollection\|REGISTRY_LIST_KEYS\|REGISTRY_KEYS\|FEED_COLLECTION_KEYS\|LITERATURE_KEY\|JOINT_WORK\|categoryLabel\|collectionLine\|LISTED_COLLECTIONS\|OWN_LOOPS\|ticker_sources\|dlcat_\|word_commitment\|position_deadline" src config docs tests --exclude=local.yml --exclude-dir=diagrams | wc -l   (check 5)
25
  (7 hits of LITERATURE_KEYS in data/sources/config/local.ts, config.ts and server/root/process/context/machine-values.ts; 8 rows of ticker_categories at config/catalogs/vocab.yml:195-202; the words dlcat_* at config/text/views/boards/focus.yml:38-45, word_commitment at :100, word_position_deadline at :105)

The case-run programs, re-created in <scratch>/o78-refute/cases from the report's quoted sources (package.json, shim.ts, harness.ts, lists.ts, case1-before.ts, the quoted diff applied by `patch -o case1-after.ts case1-before.ts case1.diff`, cases-before.ts, cases-after.ts). One change to harness.ts: its hub copies go under O78_TMP (my scratch folder) instead of os.tmpdir(), since tsx refused the long scratch path as TMPDIR for its own pipe ("listen EINVAL").
$ O78_TMP=... npx tsx --tsconfig tsconfig.json cases/cases-after.ts > cases-after.out; cmp cases-after.out cases-after.expected   (from the worktree)
exit=0
SAME   (51 lines, byte-equal to the report's quoted output)
$ O78_TMP=... npx tsx --tsconfig tsconfig.json cases/case1-after.ts > case1-after.out; cmp case1-after.out case1.expected
exit=0
SAME   (457 lines, byte-equal to the report's quoted output of both case1 runs)
$ O78_ROOT=.agents/worktrees/O78-base O78_TMP=... npx tsx --tsconfig tsconfig.json cases/cases-before.ts   (from the worktree; the base copy holds only config, src, tests, utils and unused-exports.txt)
exit=0
SAME   (45 lines, byte-equal to the quoted cases-before.out)
$ O78_ROOT=.agents/worktrees/O78-base ... cases/case1-before.ts
Error: text key not in the text catalog (config/text/): focus.command.dlcat_paper
  (thrown from migration-O78/src/lib/state/shared/words/text.ts:53: the worktree's tsconfig maps `$lib` imports inside the base files to the worktree's src, so a "base" run here is a mixed tree; the cases-before match above is weaker evidence for the same reason)

$ LC_ALL=C grep -c '[^ -~]' over every changed and untracked file   -> 0 in each
$ grep -rn 'Z10[0-9][0-9]\|ruling 3[0-9][0-9]\|\bO7[0-9]\b\|\bO8[0-9]\b' src config docs tests --exclude=local.yml
src/lib/data/model/model-collections.ts:176: * (`registry:`), the features that read it (a flag set to true, Z1009's words), the entries
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1 (no control and no field shape for `ticker:` and `dissemination_skip:` in config/options/sources.yml; the verify list is red on config-folder.test.ts).
- 2: holds; the 17 `- { key: ...}` lines of config/defaults/sources.yml, of tests/fixtures/hubs/demo/.oculus/config.yml and the first 17 of docs/templates.md compare equal line for line (shell string compare and `diff`, both empty).
- 3: holds; cases 4, 5 and 6 of cases-after.out (`4.unnamed` now lists `venues`, `5.registries.venues` the first entry, `6.findings` "registry venue names no registry"), and src/lib/data/sources/registries.ts `REGISTRY_NAMES = Object.keys(REGISTRY_SHAPES)`.
- 4: holds; hub-names.ts gives `flaggedCollections`, `registryCollections`, `registryCollection`, `registryKeyOf`, the selectors give `flaggedCollections`, `registryCollections`, `registryKey`, and G131 has rows for them.
- 5: violated, Behaviour 1 (Collection.svelte:112-115 takes the registry of a joined view from any hub, against Z1016's per-hub reading).
- 6: holds; cases-after.out case 2 (`2.band.positions` `jobs`, `2.awaiting`, `2.badge ["hub:jobs",1]`, `2.leadApply ["jobs"]`, `2.addTask` writes `todo`, `2.jointWork`, `2.crossLinks.collab`, `2.disseminated.courses`) and case 9.
- 7: holds, with Proof 3 on keys.test.ts; registration.ts places, labels and glyphs from the entry (case 8 output), `COLLECTION_PLACES` and `isPlacedCollection` are gone (check 5 grep), templates.ts carries every field (case 11 test).
- 8: holds, with Proof 2 (the `ticker_word_unknown` finding has no run or test behind it); `ticker_categories` at config/catalogs/vocab.yml:195-202, `ticker_sources` gone (check 5), case 10 output `["report","Statements",[["draft","Due statement"]]]` and `"task in 3d"`.
- 9: holds for the sentences and comments the brief lists; Standards 1 and 2 name two comments the change made false that the brief did not list, and Standards 3 a comment this step wrote.

Cases of the brief's "Cases":

- 1: met; case1-after.out equals the quoted 457-line output of both runs (cmp, rerun above).
- 2: met; cases-after.out case 2 rows as quoted (rerun, byte-equal), and the G131 rows of tests/data/helpers/hub-names.test.ts pass in the vitest tier.
- 3: met; `3.band.grants [["hub:ecf","lab:ecf"]]` and `3.ticker.funding` with `lab` reading `grants` (rerun).
- 4: met; `4.findings` "the key venues is the id of one of oculus's own views; the collection gets no card-list view", `4.catalogue ["tasks","literature"]`, `4.unnamed` holds `venues` (rerun), and its G32 row.
- 5: met; `5.findings` "registry venues is already named by the entry outlets ..." (rerun), and its G32 row.
- 6: met; `6.findings` "registry venue names no registry; the entry is a plain collection" (rerun), and its G32 row.
- 7: met; `7.findings` "tasks is already set on the entry tasks; that entry is the one read", `7.addTask` sends `tasks` (rerun), and its G32 row.
- 8: met; `8.catalogue` labels "Grants", glyph "list", group registries, orders 100 and 101, `8.findings` for `views.nonesuch` (rerun), and its G32 row.
- 9: met; `9.disseminated [["events","Gave"],["talks2","Went"],["talks2","Gave"]]` (rerun).
- 10: met; `10.groups` ends with `["report","Statements",[["draft","Due statement"]]]`, `10.report "task in 3d"`, `10.findings` names `collections[17].ticker.category` (rerun), and its G32 row.
- 11: met; tests/routes/hubs/make.test.ts 'makes a hub of two collections' (funding and tasks) passes in the vitest tier. The file it writes carries the fields the schema refuses (Spec 1).
- 12: met; 413 hits in 134 files and 209 in 88, as the report says; every hit in the files the step changed was read (grep output of the changed files' hits) and each is a registry word, a feed kind, a facet key, a fold key or a comment naming a registry, all meanings under "Not changed".

## 1. Spec

- config/options/sources.yml:94-95 and :102-103: "dissemination_skip:\n    help: 'the entries Disseminated in leaves out, a condition on their fields such as { role: attend }'" and "ticker:\n    help: \"{ category, undated }: the word of ticker_categories ...\""; what is wrong: both fields carry a help line and no control or field shape, so the options catalogue checks each as a text; item 1 asks that each field be described "with its help and control", and Z1017 (a), booked after the build, fixes the shape: `dissemination_skip:` as a key/value field family and `ticker:` as a field family marked `holds: record` (category a choice of the ticker_categories words, undated a toggle), read by the options reader, the schema, the value rule and the Settings editors. No `holds: record` exists in config/options (`grep -n 'holds:'` shows only `holds: lists`). This is the finding to close in the repair round under Z1017, and the builder handed it back (Hand-back 1) rather than leaving it silent. Failure scenario: oculus's own config/defaults/sources.yml and every `.oculus/config.yml` that Make Folder a Hub writes show nine "collections[n].ticker must be a text, not a map" problems in the editor (config-folder.test.ts, rerun above). A real input error, `ticker: report` (a text where a map is due), passes the schema as a valid text, and hub-names.ts:332 `parsed(tickerShape, raw.ticker)` drops it without a problem, so the entry silently has no ticker lines and no finding says why; verdict: item 1 violated, verify check 1 red.

- tests/state/forms/page-entry.test.ts (new rows 'a person of a people registry keyed otherwise opens the Person view' and 'an entry of a collection keyed people that names no registry opens the entry view'): what is wrong: the brief's Cases section says the tests of the step go under G32, G9 and G131 and "No other test is written"; these two rows are new behaviour rows in a file outside those entries (the other eight test files outside the list change existing rows to follow the changed types, names and lookups). Failure scenario: the guarded list the orchestrator keeps for O78 does not name this file, so a later step treats the rows as unguarded and may rewrite them without the ruling's protection, and the review of the guarded entries misses them; verdict: none on an item, a rule breach for the orchestrator to rule on (move the rows under G131, or book page-entry.test.ts as guarded).

- Paths changed outside "Paths this step writes" (list from `git diff e5ad5b79 --name-only` plus untracked, compared with the brief's list): src/lib/data/sources/config/merge/in-place.ts, src/lib/state/client/context.ts, src/lib/state/shared/page/hubs.ts, src/lib/state/workbench/palette.ts, src/lib/ui/display/ticker/ticker-rows.ts, src/lib/ui/display/ticker/Ticker.svelte, src/lib/views/boards/focus/career/CareerPanel.svelte, src/lib/views/boards/focus/Focus.svelte, src/lib/views/shared/card/project/CardLinks.svelte, utils/diagrams/palette.mjs and nine test files; what is wrong: the brief asks for a hand-back before such a change, and these were changed first and named after (Hand-back 3). Each one read is a caller the change requires (a registry lookup, a changed signature, a renamed export, `ticker_categories: MAP` in in-place.ts for item 8). Failure scenario: none in behaviour found; the risk is to the path comparison with steps in flight, which this list did not cover; verdict: none, recorded for the orchestrator.

- Builder scripts and edits outside the approved programs (report, "Rule breaches to record"): one edit of src/lib/data/model/index.ts by an inline python script, and the probe scripts hubkeys.ts and families.ts. Under the plan's "Unapproved builder scripts" ruling this closes in automode with the booking; the model/index.ts hunk was read (`git diff e5ad5b79 -- src/lib/data/model/index.ts`): type imports, `ReadCollection`, `CollectionEntry`, `ListedCollection` and rewritten comments, no compaction to meet the size limit (860 lines on the base, 874 after); verdict: none.

- Brief premise (Not changed, the last bullet): "the comments `model/index.ts:114`, `model-collections.ts:170`, `model-entities.ts:61`, `cross-links.ts:42`, which stay true"; what is wrong: model-entities.ts:61 does not stay true after the change (Standards 1). The builder named this (Hand-back 2). Failure scenario: a repair round that follows the brief leaves the false comment; verdict: none on an item, the fix belongs to the repair round.

## 2. Proof

- tests/data/sources/collections.test.ts, describe 'the fields of a collections entry': what is wrong: the rules file's test rule asks one row per input that gives a different outcome, and the brief asks "every row" of this describe. Of the finding words the list reader raises (`grep -oh 'findings\.collections\.[a-z_]*' -r src | sort -u`: category_unknown, file_missing, flag_twice, group_unknown, key_read_twice, registry_twice, registry_unknown, ticker_word_unknown, view_id, word_unknown), the describe has rows for view_id (case 4), registry_twice (case 5), registry_unknown (case 6), flag_twice for `tasks` only (case 7), word_unknown for `label:` only (case 8) and category_unknown (case 10). There is no row for `group:` naming no group (`group_unknown`, hub-names.ts:340-342), for `glyph:` or `about:` naming no word, or for `lead_applications` on two entries, the other member of `SINGLE_FLAGS`. Failure scenario: a change that stops reading `group_unknown` or that drops `lead_applications` from `SINGLE_FLAGS` passes every test, and a hub with two `lead_applications` entries then writes a lead's application into whichever entry comes first with no finding; verdict: case 7 and case 8 met as written, the describe partial against "every row".

- src/lib/data/sources/config/sections/focus.ts (`categoryFindings`, finding `findings.collections.ticker_word_unknown`): what is wrong: item 8 asks that a word of `ticker_categories` whose field names no catalog word be a finding naming the file and the word; no test row and no case-run prints this finding (`grep -rl ticker_word_unknown tests` prints nothing; neither case program builds such a word). The report's visible change 11 describes it from the code. Failure scenario: a hub adds `report: { label: views.nonesuch, ... }`; nothing run in the step shows that the finding is raised with the file and the word, or that the heading falls back to `focus.command.kind_other`; verdict: item 8 holds on the read, not verified by a run.

- tests/checks/source/keys.test.ts (new COMPUTED_PREFIXES entry): "// A collection's line in Make Folder a Hub is the word its entry's `about:` names; the words named by the `label:` and `glyph:` of oculus's entries are read as registration metadata, and are counted here too ..." with `file: 'lib/views/shared/explorer/tree/make/make-words.ts', start: 't(row.about)'` and keys from `[entry.label, entry.glyph, entry.about]`; and the fake registration `const bare = { key: 'unworded', file: 'unworded.yml' }`; what is wrong: the label and glyph words are read by views/boards/collection/registration.ts, not by make-words.ts, yet their use is credited to the `t(row.about)` call; and `views.collection_glyph` counts as used only through a registration the test invents. Failure scenario: a change that removes `t(row.about)` from make-words.ts makes the check report every label and glyph word of sources.yml as unused although registration.ts still reads them, and a change that drops the `COLLECTION_GLYPH` fallback from registration.ts still passes, because the invented `bare` view is what registers the word; verdict: item 7 holds, its keys.test.ts clause partial.

- Check 2 (the guarded tests fail on the unchanged tree): the report quotes "5 files, 23 failed of 86" with "TypeError: listWords is not a function"; I could not rerun it, see "Declined to judge".

## 3. Standards

- src/lib/data/model/model-entities.ts:58-61: "The three generated feed files ... the files of the `collections:` entries keyed\n * `leads` and `radar`, and `linkedin_dir`."; what is wrong: the rules file's comment rule (a comment says what the code does); the feed files are now the entries whose `registry:` is `leads` and `radar` (data/index.ts:189-204 `feedFile(registry)` finds `file.registry === registry`), whatever their key. Failure scenario: a reader keys a hub's leads file `positions` with `registry: leads`, reads this comment, and concludes the feed is not read; verdict: none on an item (the brief listed :61 as staying true).

- src/lib/data/model/model-entities.ts:657: "/** Entries of the joint-work collection whose `person:` is this key, by entry id. */"; what is wrong: same rule; the ids come from every collection flagged `joint_work` (normalise.ts:544-545 `collections.filter((one) => one.joint_work === true)`), not one collection keyed joint-work. Failure scenario: a reader looking for why a `collab` entry shows in a person's joint work is pointed at a key that no longer decides it; verdict: none.

- src/lib/data/model/model-collections.ts:176: " * (`registry:`), the features that read it (a flag set to true, Z1009's words), the entries"; what is wrong: the rules file's no-history rule for comments, and spec.md's rule that a comment names no package id or ruling; "Z1009's words" names a choices-file id. Failure scenario: a reader of the type has to open the plan's choices file to learn which flags exist, and the comment goes stale when the choices file is archived; verdict: none.

- src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:84, :104, :263, :387 and views/boards/collection/registration.ts:41: "applicationsCount: (key: string) => number;", "applicationsBadge: (key: string) => string;"; what is wrong: the name says applications, and the function now counts the open entries of whatever collection is flagged `open_badge` under any key (registration.ts:33-41). The coding standards' naming rule (a name says what the thing is) is broken by the rename the step did not make. Failure scenario: a reader sees `applicationsBadge(id)` called for a hub's `jobs` or `grants` view and assumes a bug, or adds a second open-badge path for a non-application collection; verdict: none.

## 4. Behaviour

- src/lib/views/boards/collection/Collection.svelte:112-115: "/** The registry the collection's entry names in any hub, which gives it a part of its own. */\n    const registry = $derived(\n        collectionsOfKey(key).find((one) => one.registry !== undefined)?.registry\n    );"; what is wrong: Z1016 (chosen) says "a feature's flag or registry is read per hub, so a key that is the funding registry in hub A and a plain collection in hub B is read by the funding features in A only", and item 5 asks for the registry "in the record's own hub". Here one registry word is taken for the whole joined view and applied to every hub's entries: :176 `registry === 'funding' ? unfundedBy(all, entries, ...)` runs over all entries, :200 `pageView(key, entry.id, label, registry)` opens every entry's page by that registry, :237 and :344 give the Literature Add and the BibTeX control to the whole view. The report does not name this choice. Failure scenario: hub A lists `{ key: grants, registry: funding }` and hub B lists `{ key: grants, file: ... }` as a plain list of its own; the Grants view draws the unfunded card over B's entries too. With `registry: people` in A and a plain `people` key in B, an entry of B opens the Person view instead of its entry page (page-entry.ts:123 `return registry === 'people' ? ...`); verdict: item 5 violated.

- The schema problems in the editor (Spec 1) are also host-visible: opening config/defaults/sources.yml or a new hub's `.oculus/config.yml` in the editor shows nine problems on a correct file. The report names them under Hand-back 1 but not among the visible changes for the look at landing; verdict: item 1 violated (counted once, under Spec 1).

## Declined to judge

- Check 2's base half (the guarded tests failing on the unchanged tree): not rerun. The base copy at .agents/worktrees/O78-base holds no tsconfig.json, package.json or node_modules, so vitest cannot run there, and from the worktree the `$lib` alias resolves to the worktree's src (case1-before failed that way above). It would be settled by running the five guarded test files in a checkout of e5ad5b79 with the step's test files copied in, which needs `git worktree add <dir> e5ad5b79`, a command outside the three this review may run.
- The base-side case-run outputs (cases-before.out, case1-before.out): taken from the report. cases-before.ts matched byte for byte, but over the mixed module graph described above, so it does not prove the unchanged tree's behaviour; settled by the same base checkout.
- `npm run diagrams`: not run, since it writes into the worktree; whether it changes docs/diagrams/ beyond the step's diff is settled by running it in the worktree followed by `git status --short docs/diagrams`.
- Check 6 (the prose read of the changed doc sentences): I read every changed line of docs/HELP.md and docs/data-map.md (`git diff e5ad5b79 -U0 -- docs/HELP.md docs/data-map.md`) and found no departure beyond those the report names; I did not reread docs/templates.md's prose sentences one by one beyond its collection list.
- The ordering of task lines across hubs in the command center, and the venue lines now carrying `target: { kind: 'venue', id }` (ticker.ts:368): read only. rows.ts:230 gives a venue target no action, so the visible change found is that a venue row is identified by its target rather than by its position (rows.ts:285); case 1 prints the same lines before and after. Whether anything in the UI differs needs a look at the Focus page, which this review may not open.
- Scratch files: early in the review I wrote changed.txt, writelist.txt and quick.txt at the shared scratchpad's root and then moved them into <scratch>/o78-refute/. If files of those names were already there from another step, they were overwritten; `ls` of the root now shows none of the three names. Every file of mine since then was under <scratch>/o78-refute/, and that folder, with the re-created case-run programs, their outputs and the hub copies, is deleted; this report is the one file left.

Reviewer usage: a4d317d58db20e950, claude-opus-5-5, 225223 tokens, 136 tool uses, 24 min 41 s.

## Repair round 1, refuted

On `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O78`, base `e5ad5b79`. `git status --short` printed 167 lines at the start of the review and 167 at its end; the reviewer changed nothing in the worktree or the ledger.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base e5ad5b79     (exit 0, wall 5:12.68)
test:quick: 168 changed file(s), from git since e5ad5b79
test:quick: 322 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.8 s)
ok      svelte-check (10.0 s): 1792987416434 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (178.2 s): Duration  168.72s (transform 79.29s, setup 0ms, import 264.09s, tests 316.86s, environment 4ms)
ok      vitest (211.2 s): Duration  202.15s (transform 259.37s, setup 0ms, import 397.74s, tests 358.63s, environment 15.31s)
ok      vitest slow (309.4 s): Duration  300.52s (transform 15.54s, setup 0ms, import 154.37s, tests 1036.11s, environment 22ms)
test:quick: 312.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files

$ npx vitest run <the 16 files the round report names: the five of the round's verify line and those items 1, 2, 3 and 5 name> --reporter=verbose     (exit 0)
 Test Files  16 passed (16)
      Tests  337 passed | 2 skipped (339)
   Duration  33.52s (transform 21.80s, setup 0ms, import 68.14s, tests 46.44s, environment 3ms)
(per-file row counts equal the report's 30, 18, 35, 11, 35, 6, 14, 6, 17, 6, 5, 20, 34, 80, 8, 14; keys.test.ts 11 rows;
 the two hub-vocab.test.ts rows tagged slow took 1278 ms and 1163 ms, the file's other rows 176 ms to 405 ms)

$ sh utils/unused-exports.sh > <scratch>/o78r1-refute/unused.txt; diff .agents/worktrees/O78-base/unused-exports.txt <that file>     (341 lines)
10,11c10,11
< src/lib/data/snapshot/normalise.ts: REGISTRY_KEYS, collectionKeys, ENTITY_KINDS
< src/lib/data/sources/config.ts: collectionKeys, loadMachine, CATALOGS_DIR, TEXT_KEY, VOCAB_KEYS, iconCatalog, confirmDelete, fileIconAtArrow
---
> src/lib/data/snapshot/normalise.ts: collectionViews, ENTITY_KINDS
> src/lib/data/sources/config.ts: collectionViews, loadMachine, CATALOGS_DIR, TEXT_KEY, VOCAB_KEYS, iconCatalog, confirmDelete, fileIconAtArrow
128c128
< src/lib/state/boards/collection.ts: TITLE_FIELD, STATUS_FIELD, emptyCollectionState, PEOPLE_OPTIONS, kindOf, hasStatusField, statusValues
---
> src/lib/state/boards/collection/index.ts: TITLE_FIELD, STATUS_FIELD, emptyCollectionState, PEOPLE_OPTIONS, kindOf, hasStatusField, statusValues
284c284
< src/lib/state/boards/collection.ts: FieldKind
---
> src/lib/state/boards/collection/index.ts: FieldKind
(equal to the difference the round report quotes)

$ grep -rn "COLLECTION_PLACES\|isPlacedCollection\|REGISTRY_LIST_KEYS\|...\|position_deadline" src config docs tests --exclude=local.yml --exclude-dir=diagrams
25 hits: 8 lines of config/catalogs/vocab.yml, 10 of the focus.yml option file, 7 LITERATURE_KEYS (config.ts 1, local.ts 4, machine-values.ts 2); equal to the report

$ the history-word grep over the changed files      prints nothing, exit 1
$ perl ASCII gate over src tests config (2601 files)  prints nothing
$ grep -n '[^ -~]' over the 167 changed paths         prints nothing
$ grep -rn "applicationsCount\|applicationsBadge" src tests     prints nothing, exit 1

$ case 12's two greps over src
419 hits in 135 files, and 211 for the second (the first build: 413 in 134, and 209); the new hits are the registry words of
src/lib/state/boards/collection/joined.ts and Collection.svelte, each a registry word under "Not changed"

$ ls src/lib/state/boards | wc -l        10 (and 10 at e5ad5b79)
$ wc -l src/lib/views/boards/collection/Collection.svelte src/lib/state/boards/collection/index.ts src/lib/state/boards/collection/joined.ts
     520 / 741 / 40

$ npx tsx --tsconfig tsconfig.json <scratch>/o78r1-cases/case8.ts   (the kept program; harness.ts's temporary folder pointed into the reviewer's folder)
exit 0; 14 lines, byte-equal to the 14 the round report quotes, among them
8.registries.group "registries"
8.none.rail-findings [["rail","no rail button carries unplaced_collections; a collection view whose entry names no group is in no group of the view catalogue"]]
8.two.rail-findings [["rail","the rail button for literature carries unplaced_collections, as the one for registries does; the collection views no entry places go in the group of registries"]]
$ npx tsx --tsconfig tsconfig.json <scratch>/o78r1-cases/case3.ts
exit 0; 27 lines, byte-equal to the 27 the round report quotes

$ the first build's case1-after.ts and cases-after.ts, rebuilt from their sources quoted in section 8 of the report
  (case1-after.ts as case1-before.ts patched with the quoted diff; harness.ts's temporary folder pointed into the reviewer's folder),
  run on the current worktree
case1-after.ts exit 0, 457 lines; diff against the 457 quoted lines: no difference
cases-after.ts exit 0, 51 lines; diff against the 51 quoted lines: one line differs
< 8.catalogue: [{"id":"grants",...,"place":{"group":"registries","order":100}},{"id":"grants2",...,"place":{"group":"registries","order":101}},...]
> 8.catalogue: [{"id":"grants",...,"place":{"group":"","order":1}},{"id":"grants2",...,"place":{"group":"","order":2}},...]
  (the program calls registration.registration(views) with one argument; item 2 added the second, the rail's unplaced group,
   which the page and case8.ts pass)

$ the reviewer's case program boards-row.ts: the boards row of layout.yml read by the Settings family editor (draftOf), then saved back
worktree: card "projects" ... stages drawn [{"fields":{"key":"not_flags","value":["terminal"]},"kept":{},"order":[]}] stages kept no
          card "archive"  ... stages drawn [{"fields":{"key":"flags","value":["terminal"]},"kept":{},"order":[]}] stages kept no
          save ok true; projects and archive stages saved equal; whole board map saved equal true
base copy (o78-baserun): card "projects" ... stages drawn no stages kept yes; card "archive" ... stages drawn no stages kept yes
          save ok true; whole board map saved equal true

$ read-only read of the builder's transcript (agent-a584e9b15ed298b15.jsonl)
line 7053: the round's python3 -c reads the jsonl and prints; first-build line 6733 is another read-only python3;
lines 6390 and 6448 are prettier --write
```

### Verdicts

The round's items:

- Round item 1 (`ticker:` and `dissemination_skip:` in the options, Z1017 (a)): closed. `tests/checks/config/config-folder.test.ts` passes in the checks tier with its `toHaveLength(35)` unchanged and its diff since the base limited to imports, the registration calls and `ticker_categories`; the new options-schema, config-value, options and Settings editor rows pass; the hub-names rows for `ticker_unread` and `skip_unread` pass. The family reader the item generalised also changes how the Settings view draws the boards' `stages:` (Behaviour finding below).
- Round item 2 (the unplaced group from the rail flag, Z1018 (a)): closed. The rail rows pass, case8.ts reproduces, `UNPLACED_GROUP` and `UNPLACED_FROM` are gone, and the shipped Registries button carries the flag.
- Round item 3 (the registry of a joined view read per hub, Z1016 (a)): closed, with the Literature Add handed back on a false premise (see Findings). The G131 rows pass and case3.ts reproduces.
- Round item 4 (the rows 'the fields of a collections entry' lacked): closed; the rows pass, and their first runs on the unchanged tree are quoted from o78-baserun.
- Round item 5 (the `ticker_word_unknown` row): closed; the row passes, with its first run quoted from o78-baserun.
- Round item 6 (keys.test.ts credits each word to its file): closed; keys.test.ts passes with 11 rows, the three `COMPUTED_PREFIXES` entries and the row that holds each prefix to its file are there, and the `unworded` registration is gone.
- Round item 7 (two false comments): closed; `src/lib/data/model/model-entities.ts:59-62` and `:659` now say what the code does. Line 61 is over 100 columns (Standards finding).
- Round item 8 (the ruling id in a comment): closed; `src/lib/data/model/model-collections.ts:176` reads "a flag of `COLLECTION_FLAGS` set to true".
- Round item 9 (the open-badge names): closed; `openCount` and `openBadge`, and the grep for the old names prints nothing.
- Round item 10 (`collectionViews` exported and unused): closed by keeping both exports, which is right. `normalise.ts`'s `collectionViews` is called by `workspaceCollectionViews` and imported by `config.ts`, and `config.ts`'s export is what `utils/diagrams/palette.mjs:86-89` reads through `ssrLoadModule`, as it read `collectionKeys` at the base; the unused-exports script cannot see an `ssrLoadModule` read.
- Round item 11 (the programs of the first build): closed with two omissions that change nothing (Findings).

Items of O78.md's "What to build", over the whole diff since `e5ad5b79`:

- 1: holds; the first refutation's Spec 1 is closed (round item 1), config-folder.test.ts passes, and the options describe both fields.
- 2: holds; `config/defaults/sources.yml` sets today's meaning on each entry, case 1 prints the same 457 lines as before the change (rerun above), and the shipped rail entry for Registries now carries `unplaced_collections: true` (`config/defaults/layout.yml`).
- 3: holds; cases 4, 5 and 6 print as quoted (rerun) and their G32 rows pass.
- 4: holds; the hub-names helpers, `joinedRegistries` in `src/lib/state/boards/collection/joined.ts` and the selectors are there, and the G131 rows pass.
- 5: holds; the first refutation's Behaviour 1 is closed: `Collection.svelte` reads `joined.registryOf(entry)`, `joined.fundedProjects`, `joined.funded` and `joined.literature`, and case3.ts shows each joined entry opened by its own hub's registry.
- 6: holds; the case 2 and case 9 lines of cases-after.ts print as quoted (rerun).
- 7: holds; `registration.ts` places, labels and glyphs from the entry, the unplaced group comes from the rail flag (case8.ts), and keys.test.ts credits the words to `registration.ts` and `make-words.ts`.
- 8: holds; `ticker_categories` is a keyed map, `ticker_sources` is gone (check 5), case 10 prints as quoted (rerun), and the `ticker_word_unknown` row passes.
- 9: holds. The first refutation judged the docs sentences. The round changed one sentence of them, the collections sentence of `docs/HELP.md:533`; a word diff of the snapshot against the worktree shows two additions. The first says a view whose entry names no `group:` sits in the group of the rail button carrying `unplaced_collections: true`, after that group's placed views, and that with no such button it is listed with the views no group holds. That matches `unplacedGroup` in `rail.ts` and `arrange()` placing the group '' in the trailing unheaded section. The second names the finding for a `ticker:` or `dissemination_skip:` not of its shape. The round also added the rail paragraph of `config/defaults/layout.yml`, which reads correctly. The comments the round edited carry the Standards finding below, which does not make the item violated.

Cases of O78.md's "Cases":

- 1: met; case1-after.ts, rebuilt from its quoted source and run on the current tree, prints the 457 quoted lines with no difference.
- 2: met; the case 2 lines of cases-after.ts equal the quoted ones (rerun), and the G131 rows pass.
- 3: met; the case 3 lines of cases-after.ts equal the quoted ones, case3.ts reproduces, and the G131 rows pass.
- 4: met; the case 4 lines equal the quoted ones (rerun), and the G32 row passes.
- 5: met; as case 4.
- 6: met; as case 4.
- 7: met; the case 7 lines, `7.addTask` writing `tasks` included, equal the quoted ones (rerun), and the G32 row passes.
- 8: met; label "Grants", glyph `list` (`views.collection_glyph`) and the `views.nonesuch` finding print as quoted, and the G32 row passes. The place after the change is case8.ts's: with the shipped flag, grants and grants2 are in `registries` at orders 7 and 8, after the placed statements, people, organisations and resources at 3 to 6. The one line of cases-after.ts that differs from its quoted output is this place, because that program calls `registration` without the argument item 2 added.
- 9: met; `9.disseminated [["events","Gave"],["talks2","Went"],["talks2","Gave"]]` (rerun).
- 10: met; `10.groups` ends with `["report","Statements",[["draft","Due statement"]]]`, `10.report [["Due statement","task in 3d"]]`, and `10.findings` names `collections[17].ticker.category` (rerun); the G32 row and round item 5's row pass.
- 11: met; `tests/routes/hubs/make.test.ts` 'makes a hub of two collections' passes in the named run, and the fields it writes are now in the options (round item 1), so config-folder.test.ts passes.
- 12: met; 419 hits in 135 files and 211; the new hits are registry words in `joined.ts` and `Collection.svelte`, meanings under "Not changed".

### Findings

- Behaviour. `src/lib/state/system/config/editors/fields.ts:204-213`: "case 'pairs': { if (!isMap(held)) return STUCK; ... const cards = Object.entries(held).map(([key, at]): Card => {". What is wrong: round item 1 generalised the Settings family reader from "a list of records" to three forms (`familyForm`: list, pairs, record). That reaches every key/value family of the options, not only `ticker:` and `dissemination_skip:`. The boards' `stages:` of `config/options/layout.yml` is such a family, and its value is a map. At the base the reader returned `STUCK` for a map (`if (!Array.isArray(held)) return STUCK;`), so the Settings boards row kept `stages` undrawn. Now it draws one card per key. The boards-row.ts run above shows the projects board drawing `{key: not_flags, value: [terminal]}`, the archive board drawing `{key: flags, value: [terminal]}`, and the whole board map saving back equal in both trees. This is a change a user sees in Settings > Boards, the round report does not state it, and no test covers it beyond the reviewer's round trip. Failure scenario: the orchestrator's look at landing checks the collections editor only, and the boards editor's new `stages` cards ship unlooked-at; the change itself reads correctly and loses no value on a save. Verdict: none. It is for the landing's look and for the host-visible list.
- Spec. `tests/state/system/settings/collection-fields.test.ts` (new, 6 rows), `tests/data/sources/config/catalog/options-schema.test.ts` (new, 4 rows), `tests/server/edit/config-value.test.ts:286` "describe(\"an entry's ticker and skip written into the hub's list\", { tags: ['slow'] }" and `tests/data/sources/config/catalog/options.test.ts:95` "it('keeps holds: record only on a family field with no key field'". What is wrong: none of these is named on a Test line of `.scratch/migration/agents/guarded.md`. grep -c prints 0 for the two new files, and the guarded entries that name config-value.test.ts and options.test.ts name other rows. spec.md allows a test only as the test of a guarded entry, and asks a step that needs a new entry to stop and ask. The round brief asked for "the options schema's test file" and for rows under item 1, and no options-schema test file existed, so the round needed these tests. Failure scenario: at landing the rows are not booked on G-entries, and a later step finds tests that no entry names and deletes them as unguarded. Verdict: none. It is booked at landing as the first review's page-entry rows were.
- Proof. Round items 1, 2 and 3's new rows (options-schema, collection-fields, config-value, options.test, the hub-names `ticker_unread`/`skip_unread` rows, the rail.test unplaced rows, the hub-names joined rows). What is wrong: spec.md asks for each new test's first failing run on the unchanged tree to be quoted, and the round report quotes it for items 4 and 5 only, as the round brief's report shape asked. The rows of items 1 to 3 pass now; nothing shows them failing on the base. Failure scenario: a row that also passes at `e5ad5b79` guards nothing the round changed, and no one sees that. Verdict: none. The reviewer read the rows and each asserts behaviour the base lacks (the `unplaced_*` findings, `joinedRegistries`, the `ticker_unread` problem), so each would fail there; this is a reading, not a run.
- Standards. Comments the step wrote or edited are not wrapped at 100 columns, against spec.md's rule that a comment the step edits is rewrapped as a whole paragraph at 100 columns. Over 100 columns: `src/lib/views/boards/collection/Collection.svelte:26` (113) "// view: the card of the projects of those hubs none of their schemes covers. The files whose entry names the", `src/lib/data/sources/config/rail.ts:81` (146) " * not true as false. Null for anything that is not a list. This is what the Settings view lists for the reader to mend, what a Settings tab holds", `src/lib/data/model/model-entities.ts:61` (101), `tests/data/helpers/hub-names.test.ts:339` (103), `tests/data/sources/collections.test.ts:400` (105), `src/lib/data/sources/config/catalog/options.ts:139` (101), `src/lib/state/system/config/editors/fields.ts:10` (101). Short lines that break a sentence: `options.ts:143` " * without `holds: lists` takes no list at a key. `heading` is the subject", `options.ts:275` " * `local` an entry of `local.yml` (a control", `src/lib/data/sources/config/catalog/option-findings.ts:7` "// is no family field without a `key` field, a `key` that names no field of", `src/lib/state/system/config/editors/draft.ts:18` "// control cannot show, and a field", `src/lib/views/system/workbench/editors/Cards.svelte:9` "    // since the merge keeps oculus's order. A list that names its items". Each over-long line is a `+` line of `git diff -U0 e5ad5b79`. Failure scenario: a reader on a 100-column editor gets these paragraphs half wrapped. Prettier does not rewrap comments, so the gate stays green over them. Verdict: none. These are rewraps of whole paragraphs, for landing.
- Spec, the round brief's premise (round item 3, the hub of the Literature Add). The round brief says the view's other Add picks the hub the hub filter leaves. `src/lib/views/shared/forms/entry/entry-add.ts:83` reads "const value = hubs.some((one) => one.id === chosen) ? (chosen ?? '') : hubs[0].id;" over `hubsTaking` (primary first) and does not read the hub filter, so the premise is false. The builder followed the quoted line, as the item said to, and handed back the choice of having both Adds read the filter. The hand-back is valid. Failure scenario: none in the built code; a Literature Add in a filtered view proposes the primary hub, as the plain Add does today. Verdict: none. It is the orchestrator's call.
- Proof, round item 11's list. What is wrong: the list names the empty heredoc append at transcript line 4788. Line 4792 is a second `cat >> tests/data/helpers/hub-names.test.ts <<'EOF'` with an empty body, and line 6733 is a read-only `python3`, and neither is listed. Neither changed a file: the empty heredoc appends zero bytes, and the python only reads and prints. Separately, the round's own `python3 -c` (transcript line 7053) reads the jsonl and prints. The report discloses it as a breach of the round brief's "A probe that is not a case-run program is not written", and it has no effect on the diff. Failure scenario: the "Unapproved builder scripts" ruling is booked from a list that is one empty append and one read short; no change to the tree is missed. Verdict: none.

The points the task asked to have judged on their merits:

- The two `hub-vocab.test.ts` rows tagged slow (`:91`, `:140`) apply the `vite.config.ts` rule as written: "takes 100 ms or more in a run of its own". They take 1278 ms and 1163 ms alone. `git diff -w e5ad5b79` on the file shows only the tag and the rewrap of each call, and the assertions are identical. The rows still run in test:quick's "vitest slow" tier (`--testTimeout 20000`) and in `npm run test:slow`, so the check is not moved out of the way. The file is outside the round's path list, but it reads the config the step changes. The same rule would also tag the file's other rows (176 ms to 405 ms alone); the builder raised that for the plan rather than changing it, which is right for a step that does not own the file.
- The move of `src/lib/state/boards/collection.ts` to `collection/index.ts` holds. The folder held ten items before and holds ten after. `index.ts` differs from the old file only in the depth of its relative imports and the line `export { joinedRegistries } from './joined.ts';`. The four relative importers changed with it, the `$lib/state/boards/collection` imports resolve to `index.ts` (svelte-check 0 errors), and no `boards/collection.ts` reference is left in src, tests, docs or config.
- The unfunded card judging only the projects of hubs whose entry names `registry: funding` follows Z1016's per-hub reading. case3.ts's `unfunded-every-part` line shows the alternative listing hub `b`'s projects, which `b`'s own `funding` view covers. A hub whose list names no funding entry gets no such card, which is consistent with every hub's list carrying oculus's `funding` entry unless the hub keys it otherwise.
- The Settings refusal to clear the only `unplaced_collections` flag follows the existing generic rule: `config-checks.ts` `refusedBy` refuses a write that adds a finding, and Z1018 says Settings edits the flag as it edits the rail's other fields. Moving the flag is accepted. The round report states it.
- Round item 3's hand-back on the hub the Literature Add writes into is valid (Findings).
- Round item 10's keeping of both `collectionViews` exports is right (Verdicts).
- The round's read-only `python3 -c` over the transcript changed nothing (Findings, round item 11).

### Declined to judge

- `npm run diagrams`, as the task directs. Its output files are in the diff and `tests/checks/diagrams/palette.test.ts` passes in test:quick, but the reviewer did not regenerate them.
- The base timings of the two hub-vocab rows (1004 ms and 949 ms in the report). A run in `o78-baserun` writes a vitest cache into a `node_modules` linked to the worktree, so it was not rerun. The rule tags the rows by their worktree time, which was rerun.
- The first runs of items 4 and 5 on `o78-baserun`, and a first run on the base of the rows of items 1 to 3. Running them writes into a `node_modules` linked to the worktree, so they were not rerun. The rows were judged by reading them.
- The first build's case-before programs on the base copy. The case-after programs were rebuilt and rerun on the current tree; the before runs are the first refutation's.
- How the Settings collections editor, the boards editor and the rail editor look in a browser, for the landing's look.
- Whether both Adds of the Literature view should read the hub filter (the hand-back's option b), as the orchestrator's call.

Reviewer usage: af794cd1d241792f8, claude-opus-5-5, 167318 tokens, 136 tool uses, 26 min 35 s.

## Closed

The findings of the first run were sent in repair round 1 (`agents/briefs/O78-round1.md`, items 1 to 11) and the run over the round judged each closed. The findings of the run over round 1 are never sent to the builder; each is closed here:

- Behaviour, the Settings boards editor drawing `stages:` as cards: fixed at landing in the sense of the look; the boards editor is opened on the look and the change is named among the visible changes of the booking.
- Spec, the new tests no guarded entry names (`collection-fields.test.ts`, `options-schema.test.ts`, the ticker describe of `config-value.test.ts`, the `holds: record` row of `options.test.ts`), and the two `page-entry.test.ts` rows of the first run: fixed at landing, booked on the Test lines of G32 and the new G131 in `agents/guarded.md`.
- Proof, no first run on the unchanged tree quoted for the rows of round items 1 to 3: closed by reading; each row asserts a behaviour the base lacks (the `unplaced_*` findings, `joinedRegistries`, the `ticker_unread` and `skip_unread` problems, the `holds: record` schema), as the run over the round also read them.
- Standards, comment paragraphs not wrapped at 100 columns: fixed at landing, each paragraph rewrapped whole with no word changed.
- Spec, the round brief's false premise on the hub of the Literature Add: closed; the builder followed `entry-add.ts:83` as the item said, and the booking records the premise correction.
- Proof, round item 11's list one empty append and one read-only `python3` short: closed under the standing ruling "Unapproved builder scripts"; neither changed a file, and the booking records both.
