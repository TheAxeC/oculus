# Step O136 refuter report (on .agents/worktrees/migration-O136, base 175987c9b)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ uptime
18:36  up 1 day,  2:39, 1 user, load averages: 2.90 7.10 9.91
$ npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts tests/data/sources/config/workspace-layer.test.ts
 Test Files  4 passed (4)
      Tests  94 passed | 2 skipped (96)
$ uptime
18:37  up 1 day,  2:40, 1 user, load averages: 4.76 7.15 9.83

$ npm run diagrams
(not run: it writes docs/diagrams/ in the worktree, and the permission system refused it; see "Declined to judge". Staleness checked by the diagrams test below.)

$ npm run test:quick -- --base 175987c9b
test:quick: 6 changed file(s), from git since 175987c9b
test:quick: 13 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (3.5 s)
ok      svelte-check (14.6 s): 1793727536667 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.2 s): Duration  15.40s (transform 5.70s, setup 0ms, import 19.73s, tests 17.65s, environment 1ms)
ok      vitest checks (158.5 s): Duration  139.15s (transform 72.00s, setup 0ms, import 116.08s, tests 159.20s, environment 2ms)
test:quick: 161.7 s; every command passed
(uptime before: load averages: 5.60 7.03 9.54; after: 17.68 11.50 10.92)

$ npx vitest run tests/checks/diagrams/diagrams.test.ts            (a file the step does not change; run alone)
 Test Files  1 failed (1)
      Tests  2 failed | 45 passed (47)
     x are what the source gives now, each file byte for byte 9703ms        Error: Test timed out in 5000ms.
     x are named stale, every one at once, when an import and a publish are added 6276ms   Error: Test timed out in 5000ms.
(load averages at the run: 4.76 7.15 9.83)
$ npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout=120000
 Test Files  1 passed (1)
      Tests  47 passed (47)
(load averages: 17.54 11.58 10.95 before, 15.55 11.78 11.05 after)

$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' docs/HELP.md docs/diagrams/layer-data.dot docs/diagrams/layer-data.svg src/lib/data/sources/config/catalog/schemas/options.ts tests/data/sources/config/catalog/options-schema.test.ts .scratch/migration/agents/reviews/O136-report.md; echo exit=$?
exit=0
$ sh utils/unused-exports.sh > <scratch>/o136ref-unused.txt; diff ../O136-base/unused-exports.txt <scratch>/o136ref-unused.txt; echo diff=$?
diff=0        (base list 335 lines)

$ npx tsx <scratch>/o136build/cases.mts        (the builder's case-run, from the worktree root, after the change)
C1 => ["2: boards must be a map, not a list"]
C2 => ["5: literature.sources[0].params must be a map, not a list"]
C3 => ["2: counts must be a map, not a list"]
C4 => ["2: links must be a list, not a map"]
C5 => ["2: read_limits must be a map, not a list"]
C6 => ["2: collections must be a list, not a map"]
C7 => ["2: counts must be a map, not a list"]
C8 => ["3: audit.required_sections must be a list, not a map"]
C9 => ["3: settings.boards must be a map, not a list"]
C10 boards => [] ... C10 ws boards => []   (all nine [])
C11 stages => ["2: stages must be a map, not a list"]
C11 categories => ["2: categories must be a list, not a map"]
C14 => []
C15 leads_fit value a list => ["2: leads_fit.strong must be a text, not a list"]
C15 leads_fit as list => ["2: leads_fit must be a map, not a list"]
C15 ws text as list => ["3: settings.text must be a map, not a list"]
C16 stages null => []
C16 categories removed => []
YLS C1 => ["2: Incorrect type. Expected \"object\"."]
YLS C6 => ["2: Incorrect type. Expected \"array\"."]
YLS C10 boards => []
YLS C10 hub collections => []
YLS control layout => ["1: Property nonesuch is not allowed."]
YLS control hub => ["1: Property nonesuch is not allowed."]
(identical to the report's "Output after the last change")

$ npx tsx <scratch>/o136ref/cases-base.mts     (the same program with R set to ../O136-base, the unchanged tree)
C1 => [] ... C9 => []   (all nine [])
C10 (nine texts) => []
C11 stages => ["2: stages must be a map, not a list"]; C11 categories => ["2: categories must be a list, not a map"]
C14 => []; C15 the same three problems as after; C16 both []
YLS C1 => []; YLS C6 => []
(identical to the report's first run)

$ npx vitest run tests/data/sources/config/catalog/options-schema.test.ts --reporter=verbose
 <check mark> ... the schema of a multi > places the problems of a board's tier in layout.yml on their lines 12ms
 <check mark> ... the schema of a keyed family > (25 rows, every one passed)
 Test Files  1 passed (1)
      Tests  43 passed (43)

$ git diff 175987c9b --numstat
1	1	docs/HELP.md
1	1	docs/diagrams/layer-data.dot
1	1	docs/diagrams/layer-data.svg
29	14	src/lib/data/sources/config/catalog/schemas/options.ts
154	3	tests/data/sources/config/catalog/options-schema.test.ts
$ wc -l options.ts options-schema.test.ts docs/HELP.md
464 / 367 / 618
$ grep -rn "familySchema" src docs tests config --exclude=local.yml
options.ts:313, :351, :399        (the report says :312, :350, :398)
$ grep -rni "keyed famil" src docs config tests --exclude=local.yml
options.ts:24, :26, :306, :307, :329; options-schema.test.ts:16, :237, :363   (the report says options.ts :328 and the test :228, :352)
$ git diff 175987c9b -U0 -- src tests docs/HELP.md | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|keep|O1[0-9][0-9]|20[0-9][0-9]-"
37:+// (`leads_fit`, `text`) and a hub's word set to null or row marked `removed: true` keep the
(the report's grep, without "keep", prints nothing, as it says)
```

Reviewer's own probes, all print-only, in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o136ref/`:

```
$ npx tsx <scratch>/o136ref/forms.mts    (every top-level keyed family, holds: record left out: its default's form, its in-place shape, the served schema's type in its defaults file, the workspace settings and the hub file)
43 lines. Every family whose default is a map is "object" in every file that holds it; every family whose default is a list is "array"; text and leads_fit (no default, pairs) are "object". e.g.
behavior.yml | links | list | default=list | inplace=rows | own="array" | ws=- | hub="array"
layout.yml | boards | list | default=map | inplace=- | own="object" | ws="object" | hub=n/a
layout.yml | counts | list | default=map | inplace=- | own="object" | ws=- | hub="object"
sources.yml | collections | list | default=list | inplace=- | own="array" | ws=- | hub="array"
catalogs/vocab.yml | stages | list | default=map | inplace=map | own="object" | ws=- | hub="object"
catalogs/vocab.yml | categories | list | default=list | inplace=rows | own="array" | ws=- | hub="array"
$ npx tsx <scratch>/o136ref/realhub.mts   (research-hub/.oculus/config.yml, research-hub/.oculus/workspaces/research-hub.yml, and every file under oculus's config/ but local.yml, against the served schemas), after and with R=../O136-base before
AFTER:  hub config.yml => ["104: key literature.prefer is not declared by the schema of this file"]; hub workspace => []; no config/ file printed
BEFORE: the same two lines; no config/ file printed
$ npx tsx <scratch>/o136ref/defs.mts, after and before, then diff     (the root definitions of every served schema)
51 lines each, diff=0
$ npx tsx <scratch>/o136ref/errmsg.mts    (C1's text against the served layout.yml schema with an `errorMessage` set in memory on its `boards` node)
"boards:\n  - { key: b, label: B }\n" => ["2: boards must be a map from a key to a board, not a list of rows"]
"boards:\n  b: { label: B, nonesuch: 1 }\n" => ["2: Property nonesuch is not allowed."]
$ npx tsx <scratch>/o136ref/complete.mts, after and with R=../O136-base before    (yaml-language-server completion labels inside a family row)
AFTER:  layout boards map row => cards,chips,columns,forms,glyph,hub,label,label_mode,match,role,search,stages,tier
        layout boards list row => (none)
        hub collections list row => about,awaiting,...,key,...,ticker
        hub collections map row => (none)
BEFORE: layout boards map row => the same 13 labels; layout boards list row => the 13 labels and key
        hub collections list row => the same; hub collections map row => the same labels without key
$ npx tsx <scratch>/o136ref/boardwith-base.mts and boardwith-after.mts   (the rewritten boardWith texts)
boardWith nonsense => ["4: boards.mine.tier does not fit the schema of this file"]; boardWith research => []   (base and after alike)
```

Readers grepped for item 1 (each takes the one form the schema now gives): `in-place.ts:314-318` (`layInPlace`: map shapes refuse a non-map, rows and whole refuse a non-list); `workspace-layer.ts:61-66` (`familyKind`: every keyed family with no `key:` attribute is a map, and the workspace schema holds no keyed family with one); `hub-names.ts:396` (`readList`, `collections` a list); `counts.ts:74` (`countsFindings`, a map); `setting.ts:77` (`rowsOf`, `audit.required_sections` a list); `scan.ts` `newProjectDirs` (`new_project_dir` a map); `boards.ts:153` (`boards` a map); `catalogue.ts:293` (`nav_groups` a map); `rules.ts:107` (`read_limits` a map); `settings/reader.ts:195-205` (`family()`, the key/value families `usage_tiers` and `open.program_ext`, a map) and `:127` (`checkedRows`, a list); `repo-save.ts:2` (`editor.languages` a map).

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `familySchema` (`options.ts:313-343`) gives a key/value family `{ type: 'object', additionalProperties }` with `pickedByKey`'s `properties`, any other keyed family the map form when `isMap(shipped)` and `{ type: 'array', items }` otherwise; `entrySchema` passes `entry.default` (`:399`), `ownSchema` passes none (`:351`). `forms.mts` shows every one of the 43 governed families served in its default's form in every file, and the readers listed above take that form; `defs.mts` shows the served definitions unchanged; C16 shows `withShapes` still reads the new `additionalProperties` and `items`.
- 2: violated, Standards 1. The three comments of `options.ts` (`:24-29`, `:304-312`, `:328-330`) and the test's head comment are written as the item asks, but one head comment the change makes false, `references.ts:11-13`, is not rewritten. Standards 2 is a wording fault in the test head comment's new sentence.
- 3: holds. `docs/HELP.md:570` ends with "A family written as a list of rows where its file takes a map, or as a map where its file takes a list, is marked." (`git diff 175987c9b -- docs/HELP.md`).
- 4: holds. Describe 'the schema of a keyed family' (`options-schema.test.ts:363-367`), 25 rows, each one reader, comparing line and form through `placed`; `boardWith` rewritten to the map form with `tier` on line 4 and its doc comment rewritten (`:164-167`), rows of 'the schema of a multi' keeping `['4:']` and `[]`; the builder quotes the failing line of the unchanged code; the verbose run gives `Tests  43 passed (43)`.
- 5: violated, Spec 1. The case-run exists and runs yaml-language-server over the served schemas, but the message for a list where a map is taken is `Incorrect type. Expected "object".` and the reverse `Incorrect type. Expected "array".`, which name neither the map nor the list.

Cases of the brief's "Cases":

- C1: met, test row 'boards as a list in layout.yml' and the case-run `C1 => ["2: boards must be a map, not a list"]`; `[]` on the base (`cases-base.mts`).
- C2: met, row "a reader row's params as a list in behavior.yml", `5: literature.sources[0].params must be a map, not a list`; `[]` on the base.
- C3: met, `2: counts must be a map, not a list`; `[]` on the base.
- C4: met, `2: links must be a list, not a map`; `[]` on the base.
- C5: met, `2: read_limits must be a map, not a list`; `[]` on the base.
- C6: met, `2: collections must be a list, not a map`; `[]` on the base.
- C7: met, `2: counts must be a map, not a list`; `[]` on the base.
- C8: met, `3: audit.required_sections must be a list, not a map`; `[]` on the base.
- C9: met, `3: settings.boards must be a map, not a list` (the test reads `.oculus/workspaces/mine.yml`, the case-run `w.yml`, one schema rule); `[]` on the base.
- C10: met, nine rows, `[]` before and after.
- C11: met, one problem each on line 2, before and after.
- C12: met, `config-folder.test.ts` passes in verify 1, and `realhub.mts` prints no problem for any file under `config/` but `local.yml`.
- C13: met, the describe 'the schema of a collections entry' passes in verify 1.
- C14: met, case-run `C14 => []`, before and after.
- C15: met, the three problems on the lines and with the messages the brief gives, before and after.
- C16: met, `[]` for both texts, before and after.

The builder's judgment calls (report section "Judgment calls"), each judged:
- 1, `shipped` as a fifth optional parameter: sound; internal.
- 2, a keyed family field that is no key/value family gets the list form: right, since `familyProblem` reads such a field as a list of records (`value-rule.ts:271-272`); none exists on the tree.
- 3, no `items` on the map form and no `additionalProperties` on the list form: sound; `defs.mts` shows the definitions of every served schema unchanged.
- 4, the audit rows in the same table with `placed` for every row: sound.
- 5, the workspace rows reading `mine.yml`: sound, one schema rule.
- 6, the HELP wording: plain, true of every family form the editor marks.
- 7, C14 as a case-run line only: as the brief says.
- "Not verified" 1, whether the real hub's files hold a family in the refused form: checked here. `realhub.mts` gives the same one problem (`104: key literature.prefer is not declared by the schema of this file`, which predates the step) before and after for the hub's `config.yml`, none for its workspace file, and none for any file under oculus's `config/`.
- "Not verified" 2, completion and hover: completion checked here (Behaviour 1); hover not checked.

## 1. Spec

- `src/lib/data/sources/config/catalog/schemas/options.ts:339` and `:326` (the two forms), with the report's first line and its "Anything in the brief that was wrong" section: "const schema: JsonSchema = { type: 'object', additionalProperties: member };" / "return { type: 'array', items: recordSchema(fields, lists, defs, loose) };"; what is wrong: item 5 asks that the editor's message "for a list where a map is taken names the map, and the message for a map where a list is taken names the list". The editor prints `Incorrect type. Expected "object".` and `Incorrect type. Expected "array".`, the JSON Schema type names. Oculus's own words for these forms are "a map" and "a list" (`config/text/findings.yml:313-314` and `:356-357`, `findings.schema.is_map: a map`, `is_list: a list`, which `check.ts` uses). The report's first line still reads "Everything in the brief is done". The gap is not impossible to close: yaml-language-server uses a schema node's `errorMessage` in place of its type message (`node_modules/yaml-language-server/out/server/src/languageservice/parser/schemaValidation/baseValidator.js:444`, `message: schema.errorMessage || getWarningMessage(ProblemType.typeMismatchWarning, ...)`), and `errmsg.mts` shows the editor then printing `2: boards must be a map from a key to a board, not a list of rows` while a field error inside a row is still reported on its own line. A fix would touch: `familySchema` in `options.ts` (an `errorMessage` on the map form and on the list form it returns); `ANNOTATIONS` in `src/lib/data/snapshot/schema/json.ts:18`, so that ajv in `check.ts:42` registers `errorMessage` as a no-op and the oculus checker's own messages stay as they are; the words, taken from the text catalog (`config/text/findings.yml`, `findings.schema`) and handed to the schema build, since the rules file's "What every package obeys" asks every reader-facing string to come from a catalog; and the case-run's output in the report. The brief states what the message must say, and the rules file leaves the words to the builder, as it did for item 3, so writing them is no decision reserved for the user. The two paths outside the write list are paths the step needs, which the rules file says are named and widened, never handed back. Failure scenario: a hub owner writes `collections:` as a map in `.oculus/config.yml`; the editor shows `Incorrect type. Expected "object"` style wording ("Expected "array"") and a reader who knows the file only through oculus's Help, which says "list" and "map", is not told to write a list of rows; verdict: item 5 violated.

## 2. Proof

none.

## 3. Standards

- `src/lib/data/sources/config/catalog/schemas/references.ts:11-13`: "The fields of a family are walked as schemas/options.ts walks them (a list of records, or a map from its `key` to a record, a list or one value), so what the editor checks and what the index follows are the same places."; what is wrong: the rules file's "What every package obeys" (a sentence in a head comment that the change makes false is a defect of the change) and item 2's "Every other comment or document sentence the change makes false is rewritten". After the change the schema holds a keyed family to one form, while the reference index's `visitFamily` (`src/lib/data/snapshot/references/scan.ts:194-212`) still follows a keyed family in both forms. A family written in the refused form is now followed by the index while the editor marks the whole family and checks none of its fields, so "the same places" is false for that form. `isPairs` imports `options.ts` here (`references.ts:22`), and the item's grep words do not reach the sentence. Failure scenario: a maintainer reads that the index and the editor walk the same places, relies on the index to report keys only where the editor checks them, and is surprised when a hub's `collections:` written as a map shows references in the index while the editor marks the block as the wrong type; verdict: item 2 violated.
- `tests/data/sources/config/catalog/options-schema.test.ts:21-23`: "The same family written in the form its reader takes is no problem, and a key/value family with no default (`leads_fit`, `text`) and a hub's word set to null or row marked `removed: true` keep the problems they give."; what is wrong: the rules file's "No history in code or comments" bans wording that compares with an earlier state ("still", "as before"), and "keep the problems they give" is such a comparison. It also does not say what those problems are: C16's texts give none, and `leads_fit.strong: [a, b]` gives a text problem, not a form problem. Failure scenario: a reader of the head comment cannot tell from it that `stages: { drafting: null }` is expected to give no problem, and has to read the table to learn what the rows hold; verdict: item 2 (with Standards 1).

## 4. Behaviour

- `src/lib/data/sources/config/catalog/schemas/options.ts:325-327` and `:339`, with the report's section "Before and after, what a user sees": "Completion and hover inside such a family now follow the one form; that is not verified here."; what is wrong: a user-visible change stated with no before and after. `complete.mts` measures it. In `config/defaults/layout.yml`, completion on a row of `boards:` written as a list offered the 13 board fields and `key` before, and offers nothing after. In a hub's `.oculus/config.yml`, completion on an entry of `collections:` written as a map offered the 17 entry fields before, and offers nothing after. Completion in the reader's form is the same before and after. The look at landing should read this from the report's before-and-after section. Failure scenario: a user types `- ` under `boards:` in layout.yml, gets no completion and no hint why beyond the type mark, and the look at landing, reading the report, does not know to check the loss; verdict: none.

## Declined to judge

- `npm run diagrams` was not run: it writes `docs/diagrams/` in the worktree, the reviewer changes nothing, and the permission system refused the command. `tests/checks/diagrams/diagrams.test.ts`, run alone with `--testTimeout=120000`, passed 47 of 47, so the committed diagrams match the source. At its default 5000 ms timeout the same file timed out twice (load averages 4.76 7.15 9.83). It is a file the step does not change.
- The builder's run of the new describe on the unchanged code (`Tests  9 failed | 16 passed | 18 skipped (43)`) was not rerun: that needs the new test file in an unchanged tree, which means writing into the base copy. The case-run variant over `../O136-base` reproduces each row's input there: C1 to C9 `[]`, the audit texts as after.
- Hover in a family written in the refused form was not checked.
- The report's `file:line` figures are from before its last edit: `familySchema` at `:312`, `:350`, `:398` (actually `:313`, `:351`, `:399`); "keyed famil" at test `:228`, `:352` (actually `:16`, `:237`, `:363`) and `options.ts:328` (actually `:329`); the doc comment `:305-313` (actually `:304-312`); the inner comment `:327-329` (actually `:328-330`). No decision rests on them, so they are not raised as a Proof finding. The rules file's "Working rules" asks for every `file:line` to be taken after the last change, so these are report sentences to correct at landing.
- Whether yaml-language-server's own wording is to be accepted in place of the Spec 1 fix is a ruling the orchestrator or the user may give. The finding is raised against the item as written.
- `REMOVED_HELP` and `NULL_HELP` (`options.ts:60`, `:63`), literal reader-facing strings that predate the step, are outside the diff. They bear on Spec 1 only as the pattern a fix should not copy.
- Whether every file edit was made with the Edit and Write tools cannot be seen from the diff.
- G13's Test line names the new describe at landing, as the brief says. That is the orchestrator's work.

Reviewer usage: aeaee453e5f924a28, claude-opus-5-5, 243963 tokens, 70 tool uses, 15 min 44 s.
