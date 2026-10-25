# Step O73 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O73, base 77f949b5)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick      (from the worktree's root)
test:quick: 13 changed file(s), from git since HEAD
test:quick: 1 test file(s)
        tests/data/sources/config/layers/manifest-fields.test.ts: changed
ok      prettier (2.5 s): All matched files use Prettier code style!
ok      ASCII gate (2.7 s)
ok      svelte-kit sync (14.3 s)
ok      vitest (13.6 s): Duration  5.99s (transform 3.38s, setup 0ms, import 4.06s, tests 1.42s, environment 0ms)
ok      eslint (22.5 s)
ok      svelte-check (24.2 s): 1792925303591 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 38.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
(13 changed files, where the report says 12: the 13th is the untracked report itself.)

$ git diff 77f949b5 --stat | tail -1     (after the rerun of npm run diagrams; identical to before it)
 12 files changed, 2568 insertions(+), 2367 deletions(-)

$ npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts --reporter=verbose
 <check mark> ... > draws the added field after oculus's fields of its section in that hub's form only 304ms
 <check mark> ... > reads the added key of that hub's manifest with no finding, and another hub's as unknown 562ms
 <check mark> ... > words each row the form cannot take and leaves it out 210ms
 <check mark> ... > words a row whose from names no registry, projects or vocab list and leaves it out 195ms
 <check mark> ... > holds a from to the vocab lists of the hub's own values, and words one that names nothing 356ms
 Test Files  1 passed (1)
      Tests  5 passed (5)

Item 4 of "Verify before you report" (each changed sentence read against the rules file's prose rules): read by the reviewer; findings Standards 1 and 2.

$ W=$PWD npx tsx <scratchpad>/o73/cases.mts     (the report's source, verbatim, plus one line printing the temp root so it could be deleted; scratch hubs deleted afterwards)
== case1
  finding: <root>/case1/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case2
  finding: <root>/case2/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case3
  findings: []
  taken: [["a","vocab.stages"],["b",["people","projects"]],["c","vocab.statuses.acknowledged"]]
== case4
  findings: []
  taken: [["grant_id",null]]
== case5
  finding: <root>/case5/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case6
  finding: <root>/case6/.oculus/config.yml | manifest_fields.0.field | manifest_fields.0.field names title, a field oculus's project form already has; the row is left out
  taken: []
== case7
  finding: <root>/case7/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from is not a value a field of the project form takes; the row is left out
  taken: []
== case11a
  findings: []
  taken: [["fit","vocab.leads_fit"]]
== case11b
  finding: <root>/case11b/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.leads_fit, which is no registry, projects or vocab list; the row is left out
  taken: []
== case12
  finding: <root>/case12/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.statuses.nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case13
  finding: <root>/case13/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names no list; the row is left out
  finding: <root>/case13/.oculus/config.yml | manifest_fields.1.from | manifest_fields.1.from names no list; the row is left out
  finding: <root>/case13/.oculus/config.yml | manifest_fields.2.from | manifest_fields.2.from names no list; the row is left out
  taken: []
== case9 (manifest findings on grant_id)
  grant_id | key grant_id is not declared by the schema of this file
== case8/14 schemaFindings on oculus own config
  []
  vocabLists holds statuses.acknowledged: true
(identical to the report's "after" output)

$ W=$PWD npx tsx <scratchpad>/o73/index.mts     (the report's source, verbatim)
manifest_fields.0.field | manifest_fields.0.field names title, a field oculus's project form already has; the row is left out
manifest_fields.1.from | manifest_fields.1.from names nope, which is no registry, projects or vocab list; the row is left out
[]
(identical to the report)

$ npx vitest run tests/data/sources/config/layers/agents.test.ts tests/data/sources/config/layers/catalogs.test.ts tests/data/sources/config/layers/hub-vocab.test.ts --reporter=dot
 Test Files  3 passed (3)
      Tests  26 passed (26)

$ grep -rln "schemaFindings\|schemaFileProblems\|static.ts\|schema-findings\|bad_from" tests; echo "grep exit $?"
grep exit 1
(reproduces the report: no test imports static.ts or schema-findings.ts; they are reached through READER_FINDINGS, src/lib/data/sources/config/sections/findings.ts:16 and :44)

$ git diff 77f949b5 -U0 -- src tests config docs/HELP.md docs/templates.md | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this|O73|ruling|20[0-9][0-9]-"; echo "grep exit $?"
grep exit 1

$ LC_ALL=C grep -n '[^ -~]' <the eight files of the write list> .scratch/migration/agents/reviews/O73-report.md; echo "ascii exit $?"
ascii exit 1

$ sh utils/unused-exports.sh > <scratchpad>/o73/unused-after.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O73-base/unused-exports.txt <scratchpad>/o73/unused-after.txt; echo "diff exit $?"
diff exit 0

$ grep -rn "namesList\b" src tests | grep -v namesListed
src/lib/data/snapshot/schema/static.ts:45, :60; src/lib/data/sources/config/merge/hub-layer.ts:37, :439, :453 (only the step's own uses)
```

Diagram sample: `docs/diagrams/layer-data.dot` whole (two labels: `data/sources` to `data/snapshot` 10 to 11, the new import of `static.ts` by `hub-layer.ts`; `data/snapshot` to `data/shapes` 14 to 13, `static.ts` dropping its import of `vocab-keys.ts`), and the `writes.dot` hunks that name `static.ts`, `hub-layer.ts` and the renumbered clusters: a new `cluster_24. lib/data/snapshot/schema` holding `static.ts` and `static.ts:46 REGISTRIES.includes(`, the edge `hub-layer.ts -> static.ts [tooltip="namesList"]`, the `hub-layer.ts` call labels moved from :112 to :114 and to :416/:422 by the added comment lines, and the clusters after it renumbered (33 to 34, 49 to 50). Every sampled change is a consequence of the new import and the moved lines, and a second `npm run diagrams` leaves the diff unchanged, so the diagrams are no churn. `writes.svg` and `layer-data.svg` were not read.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `namesList(source, merged)` is exported from `src/lib/data/snapshot/schema/static.ts:45-49` with a doc comment saying what it holds a list (`static.ts:38-44`); `schemaFileProblems` builds `lists` from it (`static.ts:60`); `schemaFindings` prints `[]` on the tree (case run). The grep shows the name was free.
- 2: holds. `readManifestFields` returns `TakenRow` with the hub's index (`hub-layer.ts:347-348`, `:431`); `rowsNamingLists` (`hub-layer.ts:444-466`) runs after the hub loop and `dropRemovedWords` (`hub-layer.ts:575-578`), against the merged config, and takes the row out with the finding at `manifest_fields.<i>.from`; case 11 and `index.mts` show the hub's own list counting and the hub's index kept. The head comment and both doc comments name the new kind. The other readers of `config.manifest_fields` between the hub loop and `rowsNamingLists` do not act on the rows still unchecked there. `sourceWords` reads only `SOURCES` (`catalog-words.ts:50`), and `manifest_fields` is not among them. `dropRemovedWords` prunes `manifest_fields` only by an option field with a `from` naming a source, and the option entry of `config/options/schemas/manifest-schema.yml` has no such field. `shapeIssues` reads `applied`, which still holds those rows, but each of them has already passed `manifestFieldRow.safeParse`, so the file shape (`manifest.ts:76-81`) finds nothing in them. The workspace layer that follows cannot set a hub-list key (`workspace-layer.ts` head comment), so no list appears after the check.
- 3: holds. `config/text/findings.yml:141-142` match the brief word for word.
- 4: holds. The four sentences name the new kind (diff of `config/options/schemas/manifest-schema.yml:4`, `config/schemas/manifest-schema.yml:86`, `docs/HELP.md:524`, `docs/templates.md:305-311`). Line :86 names all seven kinds, and the template comment stays at or under 100 columns (widths 93, 100, 99, 95, 97, 95, 35).
- 5: holds. The row `words a row whose from names no registry, projects or vocab list and leaves it out` (`manifest-fields.test.ts:91-109`) has the five rows and the expectations the brief gives. Its failure on the unchanged tree is quoted in the report, and it passes now (run above).

Cases of the brief's "Cases":

- 1: met. The test row and the case run.
- 2: met. The test row and the case run.
- 3: met. The test row (rows c, d, e taken) and the case run.
- 4: met. Case run `case4`. The three existing rows pass after the change (run above) and passed before it (the report's quoted four-file run).
- 5: met. Case run `case5`.
- 6: met. Case run `case6`, only `manifest_field_held`.
- 7: met. Case run `case7`, only `manifest_field_shape` at `manifest_fields.0.from`.
- 8: met. `schemaFindings` gives `[]`, and the three files that reach it pass (26 passed). The before run is the report's, not rerun here.
- 9: met. Case run `case9`, `grant_id | key grant_id is not declared by the schema of this file`.
- 10: met. By reading: the head comment `hub-layer.ts:10-15`, the doc comments at `:350-358`, `:436-443` and `:468-482`, and the four sentences of item 4 are true against the code. Their wording is Standards 1 and 2.
- 11: met. The second test row's table and the case runs `case11a`/`case11b`.
- 12: met. The second test row and case run `case12`.
- 13: met. The second test row and case run `case13`.
- 14: met, with no `bad_from`. The case does not exercise a field list in `schemaFileProblems` (Spec 1).

## 1. Spec

- Brief "What is on the tree", the bullet on `vocabLists`: "The only `vocab.<key>.<field>` source in oculus's own schema files is `vocab.statuses.acknowledged` (... prints `config/schemas/manifest-schema.yml:16`), which is among them". What is wrong: line 16 is a comment ("# the keys of a map whose row carries that field as true (vocab.statuses.acknowledged, the funding"). No field of oculus's schema files has such a `from`: `grep -n "from:" config/schemas/*.yml` lists only registries, `projects` and `vocab.chips|forms|stages|tiers`. The conclusion that nothing `schemaFileProblems` reports changes still holds. The flaw is in the brief, and the builder's work is unaffected. Failure scenario: a reader takes case 14 as proof that `schemaFileProblems` accepts a field list through `namesList`. No run reaches that path through `schemaFileProblems`. It is covered for `namesList` only by the hub test's row `e` (`from: vocab.statuses.acknowledged`, taken). Verdict: none; case 14 stays met.

## 2. Proof

none.

## 3. Standards

- `src/lib/data/sources/config/merge/hub-layer.ts:478`: " * are laid in, so a list the hub adds counts. `from` names the hub's file for every key it set,". What is wrong: the rules file, "What every package obeys", says a comment the step edits is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short. The line is 96 columns, and the next word, "and" (line 479), fits within 100. Failure scenario: none at run time; the paragraph is left in a form the rule names a defect, fixable at landing by moving "and" up and rewrapping lines 479-481. Verdict: none.
- `src/lib/data/sources/config/merge/hub-layer.ts:438-439`: "A row whose `from`, or a source of whose `from` list, names no registry, `projects` or vocab list (`namesList`) is a finding". The same applies to `tests/data/sources/config/layers/manifest-fields.test.ts:3-4`: "a row the form cannot take, a row whose `from` names no list among them, is a finding". What is wrong: the rules file, "The working rules that bind every package", asks for plain prose. "a source of whose `from` list" and the trailing "among them" make the reader parse the sentence twice. The builder's report names the first and leaves it. Failure scenario: a reader of `rowsNamingLists` cannot tell at once whether a list `from` is judged as a whole or source by source. The code judges source by source and names the first bad one. A plain form would be "A row whose `from` holds a source that names no registry, `projects` or vocab list (`namesList`) is a finding ...". Verdict: none.
- `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o73-cases-SdAENf` (11:37) and `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o73-cases-emAgV5` (11:41), each holding the twelve scratch hubs `case1` to `case13` and `case9` that `cases.mts` plants with `mkdtempSync(join(tmpdir(), 'o73-cases-'))`, are still on disk (`ls -la -d .../o73-cases-*`). What is wrong: the rules file, "What every package obeys", says a file a case-run program needs "lives in the scratchpad or the base copy and is gone before the report", and the brief says "no file of them is kept". The program writes into the system temporary folder and never deletes it. The reviewer's own run of the program was deleted, and these two were left untouched because they are not the reviewer's to remove. Failure scenario: twelve scratch hubs per run stay in the system temporary folder outside every scratchpad, and a later `o73-cases-*` glob or temp sweep finds stale hubs. Verdict: none.

## 4. Behaviour

none. The report gives the before and after of the new finding, the field leaving the form, the manifest's finding changing to the undeclared key finding, and the empty `from` rows. Its look-on-landing list names the views.

## Declined to judge

- `docs/HELP.md:524`, `config/options/schemas/manifest-schema.yml:4` and the template comment in `docs/templates.md:309-311` still do not name the kind "a row its shape refuses otherwise" (`from: 3`, case 7), and neither does the G128 sentence the brief has the orchestrator write at landing. The omission predates the step, item 4 asks only that the new kind be added in each line's own words, and the diff makes no sentence false. Whether to complete the lists is the orchestrator's call.
- `src/lib/data/shapes/catalog-files/manifest.ts:37`, the editor's hover text for `from` ("a vocab.yml list written vocab.<key>"), does not name `vocab.<key>.<field>`. It predates the step and is outside the write list.
- The look on landing (the Problems view of a hub with a bad row, that hub's project form, the Settings help for `manifest_fields`) was not checked; no page is run here.
- `writes.svg` and `layer-data.svg` were not read; only their `.dot` sources were sampled.

Reviewer usage: ac642df4d4c103114, claude-opus-5-5, 181154 tokens, 43 tool uses, 8 min 42 s.

## Closed

- Spec 1 (the brief's premise on `manifest-schema.yml:16`): a flaw in the brief, the builder's work unaffected; named in the landing booking, nothing to change.
- Standards 1 (`hub-layer.ts:478` wrap): fixed at landing on main, the paragraph rewrapped at 100 columns.
- Standards 2 (`hub-layer.ts:438-439`, `manifest-fields.test.ts:3-4` wording): fixed at landing on main in the plain form the report gives.
- Standards 3 (two `o73-cases-*` folders of scratch hubs left in the system temporary folder): removed at landing after each was listed; the booking names it.
- Declined 1 (the kind "a row its shape refuses otherwise" missing from three sentences): predates the step, outside its item 4; no change.
- Declined 2 (`manifest.ts:37` hover text): predates the step, outside its paths; no change.
