# Step O79 refuter report (on .agents/worktrees/migration-O79, base a11f9f14)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from the worktree root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, unless a line names another folder.

```
npm run diagrams && npm run test:quick -- --base a11f9f14        (once; diagrams left byte-equal by checksum)
test:quick: 137 changed file(s), from git since a11f9f14
test:quick: 308 test file(s)
ok      ASCII gate (2.3 s)
ok      prettier (2.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (5.2 s)
ok      eslint (81.9 s)
ok      svelte-check (101.7 s): ... COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (212.4 s)
ok      vitest (250.8 s)
ok      vitest slow (304.5 s)
test:quick: 310.1 s; every command passed

npx vitest run tests/data/hubs/hub-portfolio.test.ts             (alone, worktree, four runs)
  run 1: Tests 1 failed | 15 passed (16), Duration 54.22s (the failing case was not captured; see Declined)
  run 2: Tests 16 passed (16)
  run 3: Tests 16 passed (16)
  run 4 (--reporter=verbose, load 3.07): 'holds every record of both hubs, ...' ok 2298ms; Tests 16 passed (16)
same command in scratchpad/o79-base-run (base src/config/utils, worktree tests), verbose, load 7.35:
  'holds every record of both hubs, ...' ok 2394ms; Tests 16 passed (16)

sh utils/unused-exports.sh, diffed against .agents/worktrees/O79-base/unused-exports.txt
  < Unused exports (229)  /  > Unused exports (230)
  every other difference is a base name now gone (feedFile, identityField x2, BOOKMARK_IDENTITY,
  TITLE_FIELD, PEOPLE_OPTIONS, NOT_WRITTEN); no new line. Same as the report.

check 4 grep (the brief's form): 25 hit lines, the same file:line set as the report's list
  (Prompt.svelte:4, submit.ts:284, deposit.ts:450, page-entry.ts:122, hubs/feeds.ts:5,25,38,
  referrers.ts:143, draft.ts:595, ui.svelte.ts:112,116-118, help.yml:7, writes-collection.test.ts:114,285,362,
  feeds.test.ts:381-383, rename.test.ts:124, git.test.ts:137)
check 5 greps: manifest-schema.yml:16, literature.yml:18 (demo), templates.md:1010,1376; specs.ts:15,
  lists.ts:164, schema-rules.test.ts:621, manifest-fields.test.ts:117, config/options/sources.yml:195.
  Same as the report.
check 6 grep: prints nothing, exit 1.

OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0
  Test Files 1 passed (1) / Tests 14 passed (14)                  (report: 14 passed)

Case programs, copied to scratchpad/refute-o79-rev/cases with their output folder moved there, run with
npx vitest run --config <copy>/vitest.config.mts --root <copy> caseNN (O79_HUB=scratchpad/o79-hub):
  case01, case09 (O79_SOURCE_KEY='foreign_key: data'), case10, case15 (run alone as case15.case),
  case15b, case18: each "Tests N passed"; each output diffed against the builder's
  case01/09/10/15/18.after.txt and case15b.out.txt: SAME, all six.

base-tree run in scratchpad/o79-base-run, the report's 12 files:
  Test Files 10 failed | 2 passed (12) / Tests 48 failed | 164 passed (212)   (report: the same)
scoped reruns, worktree:
  writes-collection.test.ts                                   Tests 20 passed (20)  (report: 20)
  choices.test.ts + writes-collection.test.ts                 Tests 30 passed (30)  (report: 28)
  keys + writes-collection + schema-rules + feeds, --testTimeout 0   Tests 90 passed (90)  (report: 87)
  normalise.test.ts                                           Tests 5 passed (5)    (report: 5)

grep -n "primary_key" config/defaults/sources.yml     -> :32 and :34, head comments only
grep -c "primary_key: true" docs/templates.md -> 20 (18 schema blocks flagged, :874 the shape example,
  :864 prose); grep -n "^ *schema:" docs/templates.md -> 19 blocks, :1472 (career) unflagged
diff -r -x local.yml ~/workspace/research-hub/.oculus <scratchpad>/o79-hub/.oculus  (read only)
  every "<"/">" line of the report's "Hub rewrite" appears in it in order; the copy also differs in
  entry data of data/academic/education.yml (:31 on) and data/academic/funding.yml:50 (see Behaviour 4)
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `primaryKeyOf` (`src/lib/data/model/model-collections.ts:89-99`) is read by every collection, feed, bookmark, registry and reference reader (grep of `primaryKeyOf` and `.primary_key` over `src`); the removed names are gone (check 4); findings and refusals are tested (schema-rules KEY_ROWS, writes-collection 'the primary key a write addresses an entry by (G8)', feeds.test lead row). Standards 2 and Behaviour 1 bear on it without reversing it.
- 2: holds. `foreign_key:` read alone (check 5, schema-rules 'a from: left on a schema field'); `display:` ranks drive `entryTitleOf` and `entryChoices` (`src/lib/state/forms/schema.ts:295-303`); people and resources by registry word; reserved targets checked first (`schema.ts:383-387`, `schema/static.ts:47`, `schema/lists.ts:142`); manifest_fields rows tested (G128).
- 3: holds, as ruling 1 and ruling 3 of `O79-cases.md` change it (greps above; demo `config.yml:24-25` carry `primary_key: title`).
- 4: holds. The report's rewrite lines equal the scratch copy's diff against the hub, and integrity passes 14 of 14 on the copy.
- 5: holds (check 6 empty; the changed comments read in the diff say what the new keys do).
- 6: holds, with Proof 1 and Proof 2.

Cases:

- 1: partial. The case program's output matches the builder's (SAME), and every heading, title, choice, edit, remove and Add line is the same, but the definitions count rises 44 to 61, which case 5 forces (Spec 1).
- 2: met, choices.test 'shows a venue by its short, ...' and 'shows a venue by its name when the venues schema ranks name 1' (green in the verify run).
- 3: met, schema-rules 'a schema that flags no primary key'; writes-collection 'refuses an edit, a reorder, an Add and a remove of a file with no primary key'.
- 4: met, schema-rules 'a schema that flags two'; writes-collection 'refuses every write to a file with two flagged fields (G8)'.
- 5: met, choices 'offers the events by their display and stores the key'; references 'a select naming a collection that is no registry, an event by its key (G66)'.
- 6: met, schema-rules 'a foreign key naming nothing'; choices 'offers nothing for a key that names no collection'.
- 7: met, schema-rules display_none, display_twice, display_rank rows; choices 'shows each entry by its primary key when the target schema ranks no field'.
- 8: met, schema-rules 'a from: left on a schema field'; no choices by reading (`choicesFor`, `schema.ts:353` returns the own options when `foreign_key` is undefined).
- 9: met, case09 rerun SAME as the builder's after-run.
- 10: met, writes-collection 'edits and removes a person by key, whose display is the name'; normalise 'heads a collection entry by its display field ...'; case10 rerun SAME.
- 11: met, the four writes-collection venue rows, among them the `journals` row.
- 12: met. new-entry 'asks the primary key of venues and their required name (G8)' gives `id, name` on a fixture with `id` first; on the shipped template (`docs/templates.md:889-891`, `name` before `id`) schema order gives `name, id`, the same order the base asked (`askFields` at the base: identity = first field `name`, then `id`).
- 13: met, manifest-fields 'adds a select whose foreign_key names the people, and words a row that writes from (G128)'.
- 14: met, rename "a flow sequence, a block sequence and a double-quoted scalar" over `reference-hub.ts` with `foreign_key: people`.
- 15: met, integrity 14 of 14 on the copy; case15 and case15b reruns SAME.
- 16: met, schema-rules 'a reference naming a venue by its name rather than its id'.
- 17: met, writes-collection 'adds, renames and removes a bookmark by its label, ...'.
- 18: met for its subject: case18 rerun SAME, `findings on a file under .oculus: 0`, every collection takes an Add. The five `scan directory does not exist` findings come from the template's `scan:` folders and stand at the base too.
- 19: met, the schema-rules and writes-collection rows the report names.
- 20: met, schema-rules 'an empty foreign key' and 'a foreign key naming a collection whose file has no primary key'; the two choices rows.
- 21: met by test for the finding and by reading for "the manifests stay the target" (`schema.ts:383`, `static.ts:47`, `lists.ts:142` test `projects` before any collection lookup); the report's evidence for the second half does not exercise it (Proof 3).
- 22: met, choices 'offers the people of two hubs that key the people registry people and persons, ...'.
- 23: met, schema-rules 'gives one finding for a venue whose primary key is empty'.

Look cases: the brief defines none of the 23 cases as a look. What the look at landing settles is the report's "Host- or user-visible changes" 1 to 5 and 11, plus the workbench Add person: a venue card's heading and a venue choice with and without `short`, and the Literature project picker; the disabled controls and the reason line of an unkeyed collection; the fields the Add box asks; the fixed primary key on an entry page; a cleared key on the entry page; the Data view's Add on a hub made from the templates; the workbench Add person (`src/lib/views/system/workbench/editors/FieldControl.svelte:151,162`).

## 1. Spec

- Brief, "Cases" 1 against 5: "the reference index's count of references and definitions ... the same before and after" against "the value is a reference in the index to the event's entry". What is wrong: case 5 needs every keyed collection's entries to be definitions, so case 1's definitions count goes from 44 to 61 (case01 rerun SAME as the builder's after-run); the builder followed case 5 and said so under "wrong or impossible". Failure scenario: none in the code; a landing that reads case 1 literally would call a correct build red. Verdict: case 1 partial; the orchestrator rules that case 5 governs, and no repair is needed.

## 2. Proof

- `.scratch/migration/agents/reviews/O79-report.md`, "The new rows on the unchanged tree": "FAIL tests/data/snapshot/schema-rules.test.ts ... the catalog holds findings.schema.key_none: expected undefined to be defined" and "FAIL tests/server/edit/feeds.test.ts ... Cannot find module '.../radar.ts'". What is wrong: the 17 new schema-rules rows, the reserved-key rows and the new feeds.test lead row ('refuses a lead with no value of the primary key, ...') fail on the base only at file level (a missing catalog key, a missing module), so the quoted first run does not show any of those rows failing on the behaviour it tests. The rules file's "Tests" section asks for each added test's failing line. Failure scenario: a row that would pass on the base logic (for example 'nothing for a file with no schema whose collections entry names its primary key', which expects `[]`) is presented as red-then-green. Verdict: item 6 holds; the rows themselves read correctly.
- Same section: "x finds 'a select naming a collection that is ...' (and 16 further references rows whose fixtures now write foreign_key:)" and "(and two further rename rows, same cause)". What is wrong: 18 failing lines are summarised rather than quoted as printed; my base run in `o79-base-run` reproduces the totals (48 failed, 164 passed). Failure scenario: a reader cannot see which references and rename rows failed and why. Verdict: none.
- Report, case 21 row: "the manifests stay the target of `foreign_key: projects` (case 15's lines for `related`, `projects` and `project` each print "names a target")". What is wrong: case 15's program (`case15.case.ts`) marks a target `ok` when `target === 'projects'`, over a hub with no collection keyed `projects`, so it never puts a collection keyed `projects` beside a `foreign_key: projects` field. The reserved-key rows of schema-rules check only the finding. The reading at `schema.ts:383` shows the behaviour holds; no run shows it. Failure scenario: a later change that looks up `collections` before `PROJECTS_TARGET` would not be caught by any test. Verdict: case 21 met by reading.
- Report, scoped runs: "Tests 28 passed (28)" and "Tests 87 passed (87)"; my reruns give 30 and 90. These counts were taken before the last change, which the rules file's report rules do not allow. No decision rests on them, and the verify run covers the files.
- Report, check 1: "NOT MET: exit 1, one slow test timed out". My run of the brief's command passed every stage (310.1 s, exit 0). The case passes alone in 2.3 s in the worktree and 2.4 s on the base-code copy, and the state file records the same 20 s timeout in the same file on O82's gate run, before O79. Check 1 is met; the timeout comes from load.

## 3. Standards

- Rules file, "Token discipline": "After your last change run the verify list, `npm run test:quick`, once." Report, "Runs of the verify list": "The verify list ran four times". What is wrong: run 1 was stopped mid-run to add code and run 2 ran no test (its paths reached `test:quick` as one argument). Both are runs beyond what the section allows, and the section makes such a run a review finding. Runs 3 and 4 follow the section's red-line rule. Failure scenario: tokens and about 15 minutes of machine time per extra run, under a load that already causes slow-tier timeouts. Verdict: none.
- `src/lib/state/forms/schema.ts:119-124`: "function manifestKey(fields: readonly FormField[]): string { const keyed = fields.filter((one) => one.primary_key === true); const [only] = keyed; return keyed.length === 1 ? only.field : ''; }". What is wrong: this is a second copy of the primary-key rule of `primaryKeyOf` (`model-collections.ts:94-98`), without the `UNKEYED_TYPES` exclusion. Item 1 asks for "One function gives a file's primary key field"; the rules file's "Design" section says a rule exists once and is reused. Failure scenario: a hub `manifest_fields` or shipped schema that flags a `tags` field is "no primary key" to every collection reader but is the field the project form never writes to `manifestKey`, so the two disagree on the same flag. Verdict: none (item 1 holds; fix at landing by calling `primaryKeyOf` with the form fields, or a shared predicate).
- Rules file, "Code" (no history; "grep the comment lines and test titles you added or changed for these words, and the report quotes the grep with each hit judged") and "Design" (the reuse grep "quoting that grep in the report"). What is wrong: the report quotes neither grep. My grep of the added lines for the history words finds 13 hits (for example `src/lib/server/edit/feeds/feeds.ts`, "or undefined when the feed no longer"), each describing runtime state, none history. Failure scenario: none in the code; the report omits two greps its rules require. Verdict: none.
- Merge with O81 (on main, landed first): `src/lib/data/helpers/hub-names.ts` is 874 lines here (843 at the base) and 877 on main, so the merge comes to about 908, past the 880 bound and the 900 refusal of the size check. The dispatch entry already books this as the landing's split. Nothing else I saw breaks the merge: O79's `board-rules.test.ts` hunk (`foreign_key: people` and the `primary_key` line) targets text that is still in main's file at :762. `src/lib/data/model/index.ts` is 879 here and 836 on main, and O79 changes 4 lines in it.

## 4. Behaviour

- `config/text/server.yml:294`: "no_primary_key: '{0} has no primary key: its schema flags no one field with primary_key: true, so no entry of it can be addressed'", used for every unkeyed refusal (`src/lib/server/edit/writes/entries.ts:242-245`, `src/lib/server/edit/feeds/feeds.ts:76-80`, `literature.ts:150`); `config/text/views/boards/collection.yml:21` adds "flag one field of its schema with primary_key: true". What is wrong: the same sentence is given for every way a file lacks a primary key, and it is false for three of them, all tested: an entry's `primary_key:` beside a schema flag (writes-collection row "an entry's primary_key beside the schema's flag": the schema does flag `key`), a file with no schema and no named key (feeds.test lead row, case 15b: there is no schema), and a flag on a tags field (a field is flagged). For the first two, the remedy the card line gives is wrong. Failure scenario: a hub whose leads entry names `primary_key: title` adds a schema flagging `title`; every lead write is refused with "leads.yml has no primary key: its schema flags no one field with primary_key: true", the user sees the flag in the schema and has no lead to the real cause, the entry's `primary_key:`. The schema-file finding (`key_beside`) names it, but only in the Audit view. Verdict: none (item 1 asks for "a sentence naming the missing primary key"). Fix: word the refusal by cause, or as one neutral sentence that points to the file's Audit finding.
- `src/lib/server/edit/feeds/feeds.ts:382-392`: "words(config.text, 'server.feeds.entry_needs_key', key)" and "words(config.text, 'server.entries.key_taken', key)", replacing `server.feeds.lead_needs_title` and `lead_title_taken` (removed from `server.yml`). What is wrong: the Position Leads Add refusals change on screen from "A lead needs a title." to "An entry needs a title." and from "A lead with this title is in the file already." to "an entry with that title is already in the file". The second is lowercase with no full stop, beside sentence-case neighbours under `server.feeds` ("A paper needs a title.", "This paper is in Lit Watch already."). The report's "Host- or user-visible changes" does not list either change. Failure scenario: the look at landing does not check the Leads Add with an empty or a duplicate title, and the lowercase sentence ships unseen. Verdict: none.
- Report, "Judgment calls": "A new entry is written with its primary key on the `- ` line (`renderEntry`): a venue Add writes `- id: newv` then `name: New V`, where the base wrote `name` first"; `tests/server/edit/writes.test.ts:555-556` expectation changed to match. What is wrong: nothing in the brief asks for this. Once the hub rewrite flags `id`, each venue added to the hub's `venues.yml` is written id-first, while the existing entries and the template schema are name-first. The change is stated only as a judgment call, not among the user-visible changes. Failure scenario: the hub's venue file mixes two field orders. Verdict: none; the orchestrator's ruling.
- Landing hazard, `scratchpad/o79-hub`: the copy's entry data is older than the hub's. Besides the rewrite lines, `diff -r` shows other hunks in `data/academic/education.yml` (from :31 on: the thesis-topic entries, commented out in the hub and live in the copy) and `data/academic/funding.yml:50` (a follow-up date). Failure scenario: applying the rewrite by copying the scratch files over the hub, rather than editing the report's schema lines, would undo those hub edits. Verdict: none; apply line by line as the report lists.

## Declined to judge

- The first alone run of `hub-portfolio.test.ts` (1 failed of 16, 54 s) was run without the verbose reporter, so which case failed and why was not captured. The three later runs passed 16 of 16.
- Every screen state named under "Look cases" is the look's at landing; nothing here was looked at on a page.
- Whether the hub rewrite gives no finding on the real hub: integrity was run only on the scratch copy, as the brief requires; the hub's newer entry data was not checked against the rewritten schemas.
- The radar Add with a primary key outside `RADAR_ORDER` (`src/lib/server/edit/feeds/radar.ts:153-156`) refuses every add with "An entry needs a {key}.". No shipped or rewritten radar schema flags such a field, so this was not pursued.
- Files I wrote outside the worktree. In the shared session scratchpad root, `diag-before.txt` and `quick.log` overwrote files of those names that existed there before this review. Under `scratchpad/refute-o79-rev/`: the diff, the base-run output, the hub diff, and copies of the builder's case programs with their outputs and vitest cache. In the worktree, the verify run's `svelte-kit sync` and the vitest runs wrote only git-ignored caches (`git status --short` shows no path of mine). The `o79-base-run` copy took vitest caches from my runs there. No hub file, `local.yml`, port or main-checkout file was written.
- I ran no git command other than `git diff a11f9f14`, `git status --short` and `git show a11f9f14:<path>`. The report's `git status --porcelain` count of 137 paths matches `git status --short` (133 modified, 4 untracked).

Reviewer usage: a3d077e13c109e0ab, claude-opus-5-5, 247539 tokens, 121 tool uses, 31 min 26 s.

## Repair round 1, refuted

Step O79, worktree `.agents/worktrees/migration-O79`, base a11f9f14, over the round snapshot `.agents/worktrees/migration-O79-round-1/`. The reviewer changed nothing; its only git commands were `git diff a11f9f14`, `git status --short` and `git show a11f9f14:<path>`.

The verify list passes and every closure the builder claims reproduces. Two findings break a rule: a schema that does not read draws a false refusal (Behaviour 1), and the feeds channel carries `key_fault?` and `primary_key?` without the Apps guide saying so (Spec 1).

### Verification

```
npm run test:quick -- --base a11f9f14        (once)
test:quick: 140 changed file(s), from git since a11f9f14
test:quick: 309 test file(s)
ok      prettier (4.3 s): All matched files use Prettier code style!
ok      ASCII gate (4.6 s)
ok      svelte-kit sync (7.4 s)
ok      eslint (64.6 s)
ok      svelte-check (107.7 s): 1793029600569 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (164.8 s)
ok      vitest (216.8 s)
ok      vitest slow (278.0 s)
test:quick: 287.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
EXIT 0
```

Reruns of the round section's commands:

```
npx vitest run, the 8 changed test files: Test Files 8 passed (8), Tests 182 passed (182)   (report: 182)
npx vitest run, the 23 related files: 1 failed | 548 passed; tests/checks/source/catalog-file-keys.test.ts
  'has a reader for every top-level key of every catalog file' timed out at 5000 ms (twice alone);
  with --testTimeout 0, as tests/tiers/quick.mjs:259-262 runs tree checks: <check mark> 8869ms, 1 passed
npx vitest run tests/checks/tree/boundaries.test.ts tests/state/sessions/source/draft-entry.test.ts: 2 files, 18 tests passed
unused exports: 229 against the base's 230; every other difference a base name now gone; no new line
reuse grep over the base copy: keyFault 0, KeyFault 0, keyedSchema 0, noPrimaryKey 0, noPrimaryKeyLine 0
history-word grep over the round's added lines: one hit, code, not history; no step or ruling ids
ASCII gate over src tests config and docs/HELP.md docs/apps.md docs/data-map.md: prints nothing
```

### Verdicts

Items: 1 holds (`primaryKeyOf` answers from `keyFaultOf`, `model-collections.ts:104,128`; `writableField` reads `primaryKeyOf`, `forms/schema.ts:117-118`); 2, 3 and 4 hold; 5 holds with Spec 1 and Standards 3; 6 holds with Standards 2.

Cases: 1 met as the ruling reads it (case 5 governs case 1); 2 met; 3 met (asserts `server.entries.no_primary_key_none`); 4 met (asserts `_two` with 'name, key'); 5 to 11 met; 12 met (the venue Add's written order equals the base's, `writes.test.ts:574` against base `:559`); 13 to 18 met; 19 met (`_unkeyed`, `_none`, `_beside` rows); 20 met; 21 met by test (`schema-rules.test.ts:675`, `choices.test.ts:182`); 22 and 23 met.

Closures checked: Standards 2 (`manifestKey`) closed by a fix; Behaviour 1 closed for the five causes the round brief lists, every refusal (`entries.ts:243-246`, `feeds.ts:79-82`, `literature.ts:153-155`) and the card line (`entry-file.ts:162`, `draft-entry.ts:69-70`) reading the computed cause; Behaviour 2 closed with `server.feeds.entry_key_taken`, which also reaches the feed put-back and the Literature save; Behaviour 3 closed (`render.ts:21-26`); Proof 3 closed by the two tests above. No check removed. `key_fault?` (Z1037) is on the snapshot's `Collection` (`normalise.ts:562`) and documented on the collections row (`docs/apps.md:410`).

### 1. Spec

- `src/lib/data/model/model-collections.ts:381-382`, `FeedData.key_fault?`: set by `readFeedFile` (`feeds.ts:138`), spread by `buildFeeds` (`:153-154`) into the `feeds` channel payload (`portfolio.ts:718-737`), kept by `mergedFeeds` (`snapshot/hubs/feeds.ts:63`). The payload row `docs/apps.md:420` names neither `key_fault?` nor `primary_key?`, and no client code reads `FeedData.key_fault`. Failure scenario: an app built against the guide meets two undocumented keys and breaks silently when they change. Fix: document both on the feeds row, or keep `key_fault` on `FeedRead` only.
- `keyedSchema` (`field.ts:175-177`) now goes through nine readers; before, the snapshot keyed a file whose `schema:` does not read by its named key. Inside item 2 of the round brief; its consequence is Behaviour 1.

### 2. Proof

- The report's 549 passed over 23 related files reproduces as 1 failed | 548 passed, the failure a load-dependent timeout of `catalog-file-keys.test.ts` that passes with `--testTimeout 0` as the tier runs it. No decision rests on the count.
- The report's "Every reader of a file's primary key goes through it" overstates: `server/files/fs/bookmarks.ts:141`, `state/forms/page-entry.ts:196`, `state/boards/collection/index.ts:279`, `views/shared/forms/entry-file.ts:123` and `views/shared/forms/entry/entry-add.ts:113` do not. Each agrees with `keyedSchema` in every case; no reader disagrees.
- The round's new rows quote no failing line on the unchanged tree; the round brief waives that. Verdict: none.

### 3. Standards

- `src/lib/views/shared/forms/entry-file.ts:75`: a 140-column line in the edited doc comment of `placeInFile`; the rules file asks for an edited comment rewrapped as a paragraph at 100 columns.
- `tests/state/sessions/source/draft-entry.test.ts` (new, 78 lines): named by no entry of `agents/guarded.md` (`draft-entry.ts` is on G28's Code line, `guarded.md:81`, whose Test line names no such test); the round brief asked for assertions on the existing rows, not a new file; its first row asserts over catalog constants, as does `tests/server/edit/feeds.test.ts:202-204`; the normalise.test row titled G8 sits under the snapshot readers' entry (`guarded.md:248`) while `normalise.ts` is not on G8's Code line. The rows that test behaviour (each cause's card line through `noPrimaryKeyLine`, `placeEntry` refusing with it) read correctly.
- `docs/HELP.md:274` and `docs/data-map.md:56` say "a field whose value is a list"; `UNKEYED_TYPES` (`model-collections.ts:73-80`) holds `keymap`, a map.

### 4. Behaviour

- `field.ts:175-177` with `keyFaultOf`: a `schema:` that does not read becomes `[]` and the cause `none`, so the refusal and the card line say the schema flags no field even when it flags one. Case program: `[{ field: 'key', type: 'text', primary_key: true }, { field: 'note' }]` printed `[] {"cause":"none"} null`. Failure scenario: a people schema flagging `key` with one row typed `typ:` refuses every write with a sentence that sends the reader to flag a field already flagged; the real cause is only in the Audit view. Fix: a cause of its own for a schema that does not read, pointing to the schema's finding, in both catalogs, `noPrimaryKey` and `noPrimaryKeyLine`, asserted by a writes-collection row.
- `model-collections.ts:108-110`: a schema with no flag whose `collections:` entry names `primary_key:` gives `none`; following its remedy turns the cause into `beside`. Low.
- `feeds.ts:497-500` (`restoreFeedEntry`, the undo of a feed entry deletion): the refusal changes on screen from "an entry with that title is already in the file" to "An entry with this title is in the file already."; the round's report does not list it among the visible changes. Low.

### Declined to judge

- Every screen state, left to the look at landing: each cause's card line, the Leads Add refusals, the History undo refusal, the Literature save over a taken key.
- The case programs of cases 1, 9, 10, 15 and 18 were not rerun; their verdicts rest on the first review's reruns and the delta.
- Whether `key_fault?` should be on the feeds payload at all is Z1037's; only its documentation was judged.

Reviewer usage: a71fbc599aa5dbf73, claude-opus-5-5, 239602 tokens, 58 tool uses, 13 min 40 s.
