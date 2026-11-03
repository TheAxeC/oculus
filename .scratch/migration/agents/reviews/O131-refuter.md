# Step O131 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O131, base c0f69529b)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=verbose
 <check mark> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 1092ms
 <check mark> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > matches the hub's own files of a scratch hub to a schema each, read with no finding 804ms
 Test Files  3 passed (3)
      Tests  60 passed | 2 skipped (62)
   Duration  40.92s (transform 24.39s, setup 0ms, import 37.36s, tests 20.68s, environment 1ms)

$ npx vitest run tests/data/sources/config/catalog/options-schema.test.ts -t "the schema of a multi" --reporter=verbose
 <check mark> ... the schema of a multi > places the problems of a list with a word outside the words on their lines 106ms
 <check mark> ... the schema of a multi > places the problems of one text of a word outside the words on their lines 0ms
 <check mark> ... the schema of a multi > places the problems of one text of one of the words on their lines 0ms
 <check mark> ... the schema of a multi > places the problems of one text of two words on their lines 0ms
 <check mark> ... the schema of a multi > places the problems of a list of the words on their lines 0ms
 <check mark> ... the schema of a multi > places the problems of a board's tier in layout.yml on their lines 33ms
 <check mark> ... the schema of a multi > places the problems of a research_audit value in a hub on their lines 1ms
 Test Files  1 passed (1)
      Tests  7 passed | 10 skipped (17)
(each "..." above stands for "|unit| tests/data/sources/config/catalog/options-schema.test.ts >", shortened by the reviewer)

$ npm run test:quick   (run once; npm run diagrams not run by the reviewer, since it writes files)
test:quick: 3 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (5.0 s)
ok      eslint (4.6 s)
ok      svelte-check (17.1 s): 1793720138947 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (34.8 s): Duration  13.16s (transform 5.04s, setup 0ms, import 19.44s, tests 9.14s, environment 1ms)
ok      vitest checks (72.4 s): Duration  50.41s (transform 23.92s, setup 0ms, import 48.35s, tests 67.92s, environment 2ms)
test:quick: 77.6 s; every command passed

$ LC_ALL=C perl -ne '...the rules file's ASCII gate...' $(find src tests bin config -type f ! -name local.yml); echo "perl exit $?"
find: bin: No such file or directory
perl exit 0

$ node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131-builder/cases.mts   (from the worktree root)
exit 0; its output compared with the report's "Output after (worktree)" block: diff exit 0 (identical, 80 lines)

$ TREE=/Users/axelfaes/workspace/oculus/.agents/worktrees/O131-base/ node .../o131-builder/cases.mts
exit 0; compared with the report's "Output before (base copy)" block: diff exit 0 (identical)

The program source quoted in the report compared with cases.mts on disk: diff exit 0.

$ diff -rq --exclude=local.yml /Users/axelfaes/workspace/oculus/config /Users/axelfaes/workspace/oculus/.agents/worktrees/O131-base/config
(no output) cfg diff 0

$ grep -rn --exclude=local.yml -e "multiSchema" -e "one text of words" -e "joined by spaces" src docs config tests README.md
src/lib/server/sessions/stores/turns.ts:228: * list is taken whenever it holds a string, joined by spaces, even when that joins to nothing, and
src/lib/data/sources/config/catalog/schemas/options.ts:122:function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
src/lib/data/sources/config/catalog/schemas/options.ts:178:            return multiSchema(spec, lists);

$ git diff c0f69529b -U0 | grep '^+' | grep -v '^+++' | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"
hist grep exit 1 (no line)

$ sh utils/unused-exports.sh | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O131-base/unused-exports.txt -
unused diff 0

$ git diff c0f69529b --numstat
29<tab>8<tab>src/lib/data/sources/config/catalog/schemas/options.ts
62<tab>7<tab>tests/data/sources/config/catalog/options-schema.test.ts
$ wc -l: 448 options.ts, 200 options-schema.test.ts

$ grep -rn -E "function (categoryWith|boardWith|auditWith)|const (inHub|inLayout|MULTIS) " src tests
src/lib/server/content/audit/projects.ts:578, tests/data/snapshot/reference-hub.ts:298, tests/routes/docs/docs.test.ts:61 (unrelated inHub), plus the test file's own helpers at 152, 157, 162, 166, 167: as the report says.

$ git status --short
 M src/lib/data/sources/config/catalog/schemas/options.ts
 M tests/data/sources/config/catalog/options-schema.test.ts
?? .scratch/migration/agents/reviews/O131-report.md

The builder's first-run log /private/tmp/.../scratchpad/o131-builder/test-before.txt: rows 2, 4, 6, 7 marked <cross>, rows 1, 3, 5 <check mark>, "Tests  4 failed | 3 passed | 10 skipped (17)", each failure at options-schema.test.ts:198:23, which is `expect(found).toEqual(rows.map(([, lines]) => lines));` in the file now; matches the report.

Reviewer's own read-only probes (node --input-type=module -e, importing the worktree's src, writing nothing):
layout stages [{ key: words, value: building }] []
layout stages { words: "" } ["4: boards[0].stages.words does not fit the schema of this file"]
hub skip_tiers [] []
hub sort "" ["5: categories[0].sort does not fit the schema of this file"]
stages rule rows {"kind":"pairs"}
stages rule map null
class rule list {"kind":"words"}
class schema {"type":"string","description":"the classes put on the page body, empty for the light theme"}
grep -rn "hoverSchemaSource" node_modules/yaml-language-server/lib/umd/languageservice/services/yamlHover.js:
  72: this.hoverSchemaSource = languageSettings.hoverSchemaSource ?? true;
  230: if (result_1.length > 0 && schema.schema.url && this.hoverSchemaSource) {
src/lib/server/machine/lsp/adapters/yaml/settings.ts:14: hoverSchemaSource: false,
```

The reviewer's comparisons wrote o131-refuter-after.txt, o131-refuter-before.txt and rep-after.txt, rep-before.txt, rep-src.txt in the session scratchpad /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/; nothing in the worktree, the base copy or the ledger.

Premises of "What is on the tree" checked against the base copy: `multiSchema` at options.ts:106-113 with the quoted doc comment (sed of the base copy); the `holds: lists` wrap at options.ts:293-300; `multiProblem` at value-rule.ts:161; `heldWords` and `held:` at config-fit.ts:183-190 and :222; `"yaml-language-server": "1.24.0"` at package.json:129; 22 `control: multi` lines over config/options; `themes[].class` `from: theme_classes`, `joined: true` at appearance.yml:25-26; G13 at guarded.md:252-254 naming options-schema.test.ts's two describes; no `docs/adr` (ls: No such file or directory). Each reproduces.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. options.ts:122-134 returns `{ type: 'string' }` for `joined`, `{ type: ['array', 'string'], items: { type: 'string' } }` while words are null or empty, and `anyOf: [{ type: 'string', enum: words }, { type: 'array', items: { enum: words } }]` otherwise; the case-run prints `tier as the layout schema serves it {"anyOf":[{"type":"string","enum":[...]},{"type":"array","items":{"enum":[...]}}],...}`, the map keyed by its picking field (`stages as a map { words: nonsense }` one problem after, none before) and the `holds: lists` family (C7 rows) are reached.
- 2: violated, Standards 1 and Standards 2 (two sentences of the rewritten head comment of options.ts are false of the file after the change). The doc comment of `multiSchema`, the test head comment and the grep hold.
- 3: holds. describe 'the schema of a multi' at options-schema.test.ts:195-200, one row per case C1 to C7, each read with `problemsOf`, comparing the line prefixes; first run quoted with C2, C4, C6, C7 failing and C1, C3, C5 passing; after run all seven pass (reviewer rerun above).
- 4: holds. cases.mts runs yaml-language-server over the served hub-config, config/layout and workspace schemas, before and after, C1 to C8 and C11, with completion for C2 and C3; both outputs reproduce byte for byte; after the change every wrong word gives `Value is not accepted. Valid values: ...` and no diagnostic says the value must be a list.

Cases of the brief's "Cases":

- C1: met, test row 1 passes before (builder's log) and after (reviewer run); case-run: one problem on line 5 before and after.
- C2: met, test row 2 fails before (`expected [ [] ] to deeply equal [ [ '5:' ] ]`) and passes after; case-run after: editor `5: Value is not accepted. Valid values: "stage", "year", "title".`
- C3: met, test row 3 passes before and after; case-run after: `C3 empty completion at the end of 'sort: ' ["stage","year","title"]`, before `[]`.
- C4: met, test row 4 fails before, passes after; case-run after one problem on line 5.
- C5: met, test row 5 passes before and after.
- C6: met, test row 6 fails before (`expected [ [], [] ] to deeply equal [ [ '4:' ], [] ]`), passes after.
- C7: met, test row 7 fails before (`expected [ [], [], [] ] to deeply equal [ [ '2:' ], [ '2:' ], [] ]`), passes after.
- C8: met, case-run after `4: connections.failures[0].for does not fit the schema of this file` and editor `Value is not accepted. Valid values: "cluster", "git".`; before none; rule `{"kind":"choice","values":["cluster","git"]}`.
- C9: met, reviewer run: `passes every config file through the schema it is matched to` <check mark>.
- C10: met, reviewer run of options-schema.test.ts, 60 passed, the Make Folder a Hub test among them (named in the builder's verbose quote; the reviewer's tail showed the file passed whole).
- C11: met, case-run `C11 class: 'dark any text  at all'` ours `[]` editor `[]` before and after.

## 1. Spec

None.

## 2. Proof

None.

## 3. Standards

1. src/lib/data/sources/config/catalog/schemas/options.ts:15-17: "A source that only the page holds (the views, the theme classes, the usage tiers, the file icon themes) offers its words nowhere else, so a choice or a multi drawn from one is any text, or a list of texts for a multi."; what is wrong: the rules file's "After changing a name, a construct or a shape" paragraph makes a head comment sentence the change makes false a defect. The one multi drawn from the theme classes, `themes[].class` (`config/options/appearance.yml:25-26`, `from: theme_classes`, `joined: true`), is served `{"type":"string"}` (reviewer probe `class schema {"type":"string",...}`), so it takes no list; the sentence says a multi drawn from such a source takes a list of texts. It is true only of the non-joined multis from `views` (`layout.yml:89`, `:330`). Failure scenario: a maintainer reading the head comment to learn what the editor accepts for a theme row writes or expects `class: [dark]` to pass the schema; the editor marks it (and the rule refuses it, `class rule list {"kind":"words"}`), and the comment sends the maintainer looking for a defect in the schema that is not there. Verdict: makes item 2 violated.

2. src/lib/data/sources/config/catalog/schemas/options.ts:17-22: "The schema and the rule part on four kinds of value: a word outside a multi's words that the file already holds, ...; a multi with no words, ...; a `joined` multi's text with a doubled, leading or trailing space, ...; and a list of lists in a map that holds lists (`holds: lists`), refused by the rule, is taken here."; what is wrong: the sentence gives the count of divergences as four in the paragraph that states "so the editor marks what the Settings view refuses" over every control, and the count is false of the file: a key/value family written as a list of rows is refused by the rule and taken by the schema. Reviewer probe: `layout stages [{ key: words, value: building }] []` (schema, `config/defaults/layout.yml`) against `stages rule rows {"kind":"pairs"}` (value rule, `familyProblem` at value-rule.ts:249-251 `if (!isMap(value)) return { kind: 'pairs' }`), while the map form passes both (`stages rule map null`). The cause is `familySchema` (options.ts:322) giving every keyed family `type: ['array', 'object']` with `items: rows`. The divergence is before and after the change; the defect is the new sentence's closed count. Failure scenario: a maintainer who trusts the comment as the complete list of where the editor and Settings disagree does not look for, and does not fix, the rows form of `boards[].stages`, `chips`, `forms` or `research_audit`; a user who writes `stages: [{ key: words, value: building }]` in layout.yml or a workspace's `settings:` sees no mark while the Settings write refuses it. A sentence that names the kinds without a count, or that adds the rows form, would be true. Verdict: makes item 2 violated.

3. docs/HELP.md, the bullet "In a YAML file the editor checks, Ctrl+Space completes the keys, each with its description: ..."; what is wrong: the rules file's "After changing a name, a construct or a shape" paragraph says a step writes what a user does into `docs/HELP.md`. After the change Ctrl+Space at a multi's value offers the field's words (case-run `C3 empty completion at the end of 'sort: ' ["stage","year","title"]`), the editor marks a wrong one-text word, and hover lists the allowed values; no page states the marks or the completion of a value (grep of HELP.md for editor/value/completes/marks finds only the keys bullet). The bullet is not made false, and the gap predates the step for choices, whose values were marked and completed already; the brief's write list leaves HELP.md out, so the builder could not write it, and the builder's report names the gap. Judgment: a short clause on that bullet (the values of a choice or a multi completed from its words and marked when outside them) is owed, at landing or by the orchestrator. Failure scenario: a user reading Help learns that Ctrl+Space completes keys and does not try it on a value, nor read a value mark as the field's word list. Verdict: none on an item (outside the write list).

## 4. Behaviour

1. .scratch/migration/agents/reviews/O131-report.md, "Host- or user-visible changes, before and after", the hover bullet: "Hover on `sort`: before, the help line and the source; after, the help line, then `Allowed Values:` with `year`, `stage`, `title`, then the source."; what is wrong: the before and after are taken from the case-run's language service, configured without `hoverSchemaSource`, so its default `true` (yamlHover.js:72) adds the `Source: [s33.json](...)` line; oculus sends `hoverSchemaSource: false` (src/lib/server/machine/lsp/adapters/yaml/settings.ts:14), so the editor's hover shows no source line before or after. The report's limitation bullet names that the program does not run oculus's server settings, but the before-and-after bullet the look on landing is read against states the source line as seen. Failure scenario: at the look on landing the orchestrator hovers `sort`, sees no source line, and either records a mismatch against the report or doubts that the served schema reached the editor. The marks and the completion lines are unaffected (validate and completion are on in both). Verdict: none.

## Declined to judge

- The first run of the new describe on the unchanged tree was not rerun by the reviewer: it would need the new test placed beside the base code (a file written into the base copy or the worktree's code reverted), which the review's no-edit rule and the no-breakage rule forbid. Relied on the builder's log test-before.txt (quoted above, matching the report) and on the case-run's reproduced before output, whose `ours []` for C2, C4, C6 and C7 is the same checker the test reads.
- `npm run diagrams` was not run before test:quick, since it rewrites files under docs/diagrams; `git status --short` lists no change under docs/diagrams.
- Whether the Settings write reaches `familyProblem` for a rows-form `boards[].stages` through `config-fit.ts` as the probe's `valueProblem({ ...stages, control: 'records' }, ...)` does was settled by reading `familyProblem` and the probe, not by a run of the Settings write route.
- The builder's note on the `joined` multi, judged as asked: decision 4 of the brief ("A `joined` multi gets no rule over its text") covers the outcome, no rule of any kind over the text, so the spacing goes untouched under it, and C11 ("written as any text: no problem") pins the same outcome; the builder followed the brief. The decision's reason ("its one field draws from a source the schema never holds, so it would be code for an input that does not happen") covers the words only: a doubled, leading or trailing space needs no source to be held (`^$|^[^ ]+( [^ ]+)*$`), and it is an input a hand-typed theme class can take; the rule refuses it (`C11 rule "dark any text  at all" => {"kind":"words"}`) and the schema takes it (C11 ours `[]`, editor `[]`). The new head comment (options.ts:20-21, "a `joined` multi's text with a doubled, leading or trailing space, refused by the rule, is taken here") and the doc comment of `multiSchema` (options.ts:118-120) state it truly. Whether to reverse decision 4 and hold the spacing by a pattern is the orchestrator's ruling, not a defect of the step; on merits (a judgment) the pattern is the option that ends the divergence, and leaving it is the cheaper one.
- `tests/checks/config/integrity.test.ts` over the real hub was not run (not in the brief's verify list); a grep of the research hub's `.oculus/config.yml` and workspace files for the multi keys found only `kinds:` at config.yml:43, so no real-hub multi value was read against the new schema.

Reviewer usage: a6d4eb65a0299f2eb, claude-opus-5-5, 181562 tokens, 40 tool uses, 9 min 30 s.

## Repair round 1, refuted

```
$ npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=verbose
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a collections entry > passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked 113ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a list with a word outside the words on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of a word outside the words on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of one of the words on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of two words on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a list of the words on their lines 0ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a board's tier in layout.yml on their lines 45ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a research_audit value in a hub on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a theme's joined class in a workspace file on their lines 82ms
 <check mark> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 750ms
 Test Files  3 passed (3)
      Tests  61 passed | 2 skipped (63)
   Duration  26.15s (transform 14.38s, setup 0ms, import 20.67s, tests 15.21s, environment 1ms)
(the 2 skipped: "config-folder: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set")

$ npm run test:quick   (run once; npm run diagrams not run by the reviewer)
test:quick: 6 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (4.2 s)
ok      svelte-check (16.2 s): 1793721641689 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (31.0 s): Duration  12.34s (transform 5.49s, setup 0ms, import 14.44s, tests 10.07s, environment 1ms)
ok      vitest checks (58.9 s): Duration  39.95s (transform 16.78s, setup 0ms, import 34.59s, tests 58.38s, environment 2ms)
test:quick: 62.3 s; every command passed

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests bin config -type f ! -name local.yml); echo "perl exit $?"
find: bin: No such file or directory
perl exit 0
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' docs/HELP.md .scratch/migration/agents/reviews/O131-report.md; echo $?
0   (no line printed)

$ sh utils/unused-exports.sh | diff ../O131-base/unused-exports.txt -; echo "unused diff $?"
unused diff 0

$ git diff c0f69529b -U0 | grep '^+' | grep -v '^+++' | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"
15:+ * separated by single spaces, with no space before the first or after the last.
("before" is a place in the text, not a time; the same one hit the round's report quotes)

$ grep -rn --exclude=local.yml -e "multiSchema" -e "one text of words" -e "joined by spaces" -e "JOINED_FORM" src docs config tests README.md
src/lib/server/sessions/stores/turns.ts:228 (unrelated), options.ts:18, :118, :126, :129, :130, :185   (as the round's report says)

Item 1, the rule and the pattern over the seven texts (reviewer's read-only node --input-type=module -e over the worktree's value-rule.ts valueProblem({ control: 'multi', joined: true, from: 'theme_classes' }, t, {}), Ajv over { type: 'string', pattern }, and new RegExp(pattern, 'u')):
"" rule null ajv true regexp-u true
"dark" rule null ajv true regexp-u true
"dark contrast" rule null ajv true regexp-u true
" dark" rule {"kind":"words"} ajv false regexp-u false
"dark " rule {"kind":"words"} ajv false regexp-u false
"dark  contrast" rule {"kind":"words"} ajv false regexp-u false
"dark<tab>contrast" rule null ajv true regexp-u true
pattern in file: ^$|^[^ ]+( [^ ]+)*$   (options.ts:118)
Both columns agree on all seven rows, and match the round brief's and the report's tables.

$ node .../scratchpad/o131-builder/round1.mts | diff .../o131-builder/round1.txt -      -> diff exit 0
$ node .../o131-builder/round1.mts | diff <(report lines 675-691) -                      -> diff exit 0
$ diff <(report lines 605-669) .../o131-builder/round1.mts                                -> diff exit 0 (the quoted source is the file on disk)
$ node .../o131-builder/cases.mts                                                        -> exit 0
$ node .../o131-builder/cases.mts | diff <(report "Output after (worktree)", lines 322-401) -
36,37c36,37
<     ours   []
<     editor []
---
>     ours   ["7: settings.themes[0].class is dark any text  at all, which does not match the form ^$|^[^ ]+( [^ ]+)*$"]
>     editor ["7: String does not match the pattern of \"^$|^[^ ]+( [^ ]+)*$\"."]
(exactly the two lines the round's report says differ, with the text it quotes)

Round delta: diff -u <snapshot> <worktree> for the two paths of files.txt, and git diff c0f69529b for docs/HELP.md:
- options.ts: head comment lines 17-24 rewritten; JOINED_FORM and its doc comment added (114-118); multiSchema doc comment's last sentence rewritten; `if (spec.joined === true) return { type: 'string', pattern: JOINED_FORM };` (130).
- options-schema.test.ts: head comment sentence added (15-16); themeWith (167-170); inWorkspace (174-175); the row "a theme's joined class in a workspace file" (201-208).
- docs/HELP.md:570: one sentence appended on the bullet's one line.
Nothing else changed in the round.

$ git diff c0f69529b --numstat
1   1   docs/HELP.md
36  8   src/lib/data/sources/config/catalog/schemas/options.ts
78  7   tests/data/sources/config/catalog/options-schema.test.ts
$ wc -l: 455 options.ts, 216 options-schema.test.ts, 617 docs/HELP.md   (as the report's "Files after the round" says)
$ grep -n "expect(found)" tests/.../options-schema.test.ts -> 214:        expect(found).toEqual(rows.map(([, lines]) => lines));   (the report's "now line 214")

$ git status --short
 M docs/HELP.md
 M src/lib/data/sources/config/catalog/schemas/options.ts
 M tests/data/sources/config/catalog/options-schema.test.ts
?? .scratch/migration/agents/briefs/O131-round-1.md
?? .scratch/migration/agents/reviews/O131-refuter.md
?? .scratch/migration/agents/reviews/O131-report.md

The builder's failing-run log .../o131-builder/r1-test-before.txt (16:44:55; snapshot 16:43:53; options.ts changed 16:51:39): the joined-class row <cross>, "AssertionError: expected [ [], [] ] to deeply equal [ [], [ '7:' ] ]" at options-schema.test.ts:213:23, "Tests  1 failed | 7 passed | 10 skipped (18)"; the other seven rows <check mark>. Matches the report's quote.

Item 4, the hover with oculus's own settings (reviewer's read-only probe: yaml-language-server configured with YAML_SETTINGS from src/lib/server/machine/lsp/adapters/yaml/settings.ts, the hub schema the build serves, a category row, hover at line 5):
sort: year      -> "...then title\n\nAllowed Values:\n\n* `year`\n* `stage`\n* `title`\n"
sort: nonsense  -> "...then title\n\nAllowed Values:\n\n* `title`\n* `stage`\n* `year`\n"
No "Source:" line in any hover (settings.ts:14 `hoverSchemaSource: false`; yamlHover.js:230 shows the source only when it is true).

Comment widths (awk length): options.ts 11-24 between 96 and 100; 115 is 91 (the next word does not fit); 121-127 at most 100; test file 1-16 at most 100. comment-width passed inside test:quick.
```

### Verdicts

Items of the brief's "What to build", the brief as amended by the round brief's rulings:

- 1: holds. options.ts:129-141 gives form B for a non-`joined` multi with held words, `{ type: ['array', 'string'], items: { type: 'string' } }` while the words are null or empty, and, under round ruling 1 (decision 4 reversed), `{ type: 'string', pattern: JOINED_FORM }` for a `joined` multi; the seven texts agree between the rule and the pattern (reviewer run above); cases.mts after gives the C11 mark on line 7. Standards 1 below is on where the joined form is coded, not on what the schema gives.
- 2: holds. Every sentence the round changed in the head comment of options.ts (lines 14-24), in the doc comments of JOINED_FORM and multiSchema, and in the test file's head comment is true of the code: a page-only source gives any text for a choice (choiceSchema), one text or a list of texts for a non-`joined` multi (options.ts:132-134), the joined pattern for a `joined` one (:130); the four kinds of divergence are each reproduced by round1.mts (held word, no words, list of lists, both wrong forms of a keyed family, with "when its rows or values fit their fields" shown by `layout boards as a map, a wrong tier` and `layout stages as rows`). The count is gone and the joined spacing is no longer named as a divergence. The grep with JOINED_FORM added finds nothing else false. docs/HELP.md:570 is true (see C2, C3 and the HELP item below).
- 3: holds. describe 'the schema of a multi' now has eight rows: C1 to C7 and the C11 row the round asked for. The C11 row reads a workspace file through `problemsOf` and compares line prefixes; its failing run on the code before the round is quoted (`expected [ [], [] ] to deeply equal [ [], [ '7:' ] ]`) and matches the builder's log; it passes after (reviewer run). Its failure costs something: the editor would take a theme class that the workspace load refuses as a finding (HELP.md:569, "a value its option refuses are findings naming the workspace file and the key"), which is G13's concern.
- 4: holds. cases.mts reruns exit 0 and its output differs from the report's after block only in the two C11 lines the round's report quotes; every wrong word still gives `Value is not accepted. Valid values: ...`, and none says the value must be a list.

Cases of the brief's "Cases" (C11 as the round brief restates it):

- C1: met, test row 1 passes after (reviewer run); before from the builder's first log.
- C2: met, test row 2 passes after; it failed before (first round's log); cases.mts after gives the editor's `Value is not accepted. Valid values: "stage", "year", "title".` (unchanged by the round).
- C3: met, test row 3 passes; cases.mts after gives completion `["stage","year","title"]` at `sort: ` (unchanged by the round).
- C4: met, test row 4 passes after.
- C5: met, test row 5 passes.
- C6: met, test row 6 passes after.
- C7: met, test row 7 passes after.
- C8: met, cases.mts after, unchanged by the round (only the C11 lines differ from the report's after block): one problem on `for: ''`.
- C9: met, `passes every config file through the schema it is matched to` <check mark> in the reviewer's run, so every shipped theme class passes the new pattern.
- C10: met, `passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked` <check mark>.
- C11: met, test row 8: `'dark contrast'` no problem, `'dark  contrast'` one problem on line 7, failing before the round as quoted, passing after; cases.mts after: `7: String does not match the pattern of "^$|^[^ ]+( [^ ]+)*$".` in the editor, and `C11 class: nonsense` still none.

### 1. Spec

None. The round delta covers the four items of the round brief only: item 1 (pattern, test row, test head comment sentence), item 2 (head comment, doc comments), item 3 (HELP.md:570), item 4 (the report's hover bullet). The second direction of the keyed-family kind ("a list of rows written as a map") goes beyond the review's finding. Round item 2 asks the sentence to name "the kinds as they now stand", and round1.mts reproduces it (`layout boards as a map: rule {"kind":"records"} schema []`), so it is inside the item.

### 2. Proof

None. Every claim of closure the round's report makes reproduces: the seven-text table, the failing run of the new row, the C11 lines of cases.mts, round1.mts's output and source, the line counts, the grep, the unused-exports compare, the ASCII gate and test:quick.

### 3. Standards

1. src/lib/data/sources/config/catalog/schemas/options.ts:118: "const JOINED_FORM = '^$|^[^ ]+( [^ ]+)*$';" against value-rule.ts:164-167 "`value === '' || value.split(' ').every((w) => w !== '')`". What is wrong: the rules file's "The principles every package is judged on" says "a parser, a fold or a rule exists once and is reused". The joined form is now coded twice, as a split in `multiProblem` and as a regular expression in `options.ts`. The tree already has the one-place form for a text's form: `FORM_PATTERNS` in value-rule.ts:86-93 is read both by the rule (`hasForm`, :96-98) and by the schema (`textSchema`, options.ts:92). Nothing keeps the two codings equal. The seven-text agreement was shown by a scratch program, and the test row pins only `'dark contrast'` and `'dark  contrast'`. Failure scenario: a maintainer changes how `multiProblem` reads a joined text, for example to refuse a tab or to split at any white space. JOINED_FORM is left as it is, both test rows stay green because both readings agree on them, and the editor takes or marks `dark<tab>contrast` differently from the Settings write, which is the divergence this round exists to end. The fix is to move the regular expression into value-rule.ts beside `FORM_PATTERNS` and have `multiProblem` test it, which touches a file outside the round's write list. That makes it a fix at landing or an orchestrator ruling; the builder followed "make the change it names, nothing else". Verdict: none on an item.

2. .scratch/migration/agents/reviews/O131-report.md, "Repair round 1", "The round's checks, after the last change": "The list ran twice in this round, each after `npm run diagrams`: the first run passed, and the second followed a one-clause edit of the head comment ("when its rows or values fit their fields") made after the round's program showed the clause before it overstated what the schema takes". What is wrong: the rules file's "Token discipline" allows the list once after the last change, plus one more run only after a red line in a changed file, and it says a run beyond that "is a finding of the review". The round brief also says "`npm run test:quick` once". The first run was red-free, and it came before a further change, so it was the extra run. The sentence also tells the story of a wrong turn taken and corrected, which the rules file's "The working rules that bind every package" bans from a report ("No narration of wrong turns taken and backed out"). The count of runs is required; the account of the overstated clause is not. Failure scenario: each extra run costs about a minute of the shared machine and the tokens of its output. The orchestrator reading the report spends its attention on a clause that no longer exists. Verdict: none on an item.

3. .scratch/migration/agents/reviews/O131-report.md, "Repair round 1", opening: "where it differs from the sections above (decision 4, case C11, the head comment's four kinds), this section holds." What is wrong: the rules file's "Report" asks for the end state. More of the earlier sections are false after the round than the three this sentence names:
   - "The code" still quotes `if (spec.joined === true) return { type: 'string' };`, which options.ts no longer has (:130).
   - The DONE row 1 still says "`joined` any text".
   - "Comments and documents read" still calls `docs/HELP.md:570` "still true; it speaks of keys only".
   - "Files" still gives 448 and 200 lines and two files.
   - Judgment calls 3 and 5 and the first bullet of "Anything in the brief that was wrong or impossible" still describe the joined spacing as not built and HELP.md as not edited.
   Failure scenario: the orchestrator writing the landing booking or the G13 line from the DONE table or "The code" records that a `joined` multi is any text and that HELP.md is untouched. Both are false of the diff that lands. Verdict: none on an item.

### 4. Behaviour

1. .scratch/migration/agents/reviews/O131-report.md, "Host- or user-visible changes, before and after": the section has no bullet for the round's new mark. What is wrong: after the round, a theme row's `class` with a doubled, leading or trailing space in a workspace file's `settings:` gets the editor mark `String does not match the pattern of "^$|^[^ ]+( [^ ]+)*$".` on its line, where before it had none (cases.mts C11 lines above). The before and after appear only in "Repair round 1", "Item 1" and judgment call 4 of the round. The section that names the views and states for the look on landing does not name this one: which file to open (a workspace file under `.oculus/workspaces/`), what to type (`class: 'dark  contrast'`), and what should differ. Failure scenario: the orchestrator does the look on landing from that section, opens only a hub's `.oculus/config.yml` and `config/defaults/layout.yml`, and books the step without seeing the one user-visible change this round adds. That change is also the one whose words show the raw pattern to the user. Verdict: none on an item.

2. .scratch/migration/agents/reviews/O131-report.md, "Host- or user-visible changes, before and after", the hover bullet: "Hover on `sort` in oculus's editor: before, the help line alone; after, the help line, then `Allowed Values:` with `year`, `stage`, `title`." What is wrong: the round's fix of the source line holds; the reviewer's probe with YAML_SETTINGS shows no `Source:` line. The order of the allowed values, though, depends on the value written. yaml-language-server moves the enum entry at `indexOf(value)` to the front (yamlHover.js:150, :211-212), so `sort: year` lists `year`, `stage`, `title`, while `sort: nonsense` lists `title`, `stage`, `year` (index -1 moves the last entry first). The section's state for the look is "write a category row with `sort: nonsense`", and the bullet does not name the value its order was taken from. Failure scenario: at the look on landing the orchestrator hovers `sort` in the named state, sees `title`, `stage`, `year`, and records a mismatch against the report or doubts that the served schema reached the editor. Verdict: none on an item.

### Declined to judge

- The failing run of the new C11 row on the code before the round was not rerun. It would need the round-0 `options.ts` placed back under the new test, which the review's no-edit rule and the no-breakage rule forbid. The review relied on the builder's log r1-test-before.txt, whose time (16:44:55) falls between the snapshot (16:43:53) and the change of options.ts (16:51:39), and on the snapshot's `if (spec.joined === true) return { type: 'string' };`, read in the round delta.
- The report says the seven-text table was "run before the pattern was written into the code". round1.mts and round1.txt carry the same minute as options.ts (16:51), so the order is not shown by the files. The program checks an inline schema of its own, independent of options.ts, so its result does not depend on the order.
- The claim "The row was not edited after that run except by the head comment above it" is checked only as far as the log shows: lines 211-213 of the log match lines 212-214 now. The row's own lines are not in the log.
- `npm run diagrams` was not run before test:quick, since it rewrites files under docs/diagrams; `git status --short` lists no path under docs/diagrams.
- Whether the user should see the raw pattern in the editor's and the checker's message for a joined class is not judged as a defect of the round. The tree words every `form:` scalar the same way: `textSchema` puts `FORM_PATTERNS[...].source` in `pattern`, and check.ts:170-174 fills `findings.schema.not_form` with the pattern. A readable message (for example yaml-language-server's `patternErrorMessage`) would be a change to that shared wording, which the round brief does not ask for.
- Where the joined form's regular expression should live (Standards 1) is the orchestrator's call at landing, since the fix reaches value-rule.ts, outside the round's write list.
- `tests/checks/config/integrity.test.ts` over the real hub was not run (not in the brief's checks); a read-only grep of the research hub's `.oculus/workspaces/` and `.oculus/config.yml` for `class:` printed nothing, so no real theme class meets the new pattern.

Reviewer usage: aca92485dd8b68b63, claude-opus-5-5, 175543 tokens, 37 tool uses, 8 min 3 s.

## Closed

The first run's findings went to repair round 1 (`agents/briefs/O131-round-1.md`) or to open item 651, ruled (a) as step O136. The run over round 1 found no defect in a round item; its findings are closed at landing:

- Standards 1 (the joined form coded twice): fixed at landing. `JOINED_FORM` is a regular expression exported from `src/lib/data/sources/config/catalog/value-rule.ts` beside `FORM_PATTERNS`; `multiProblem` tests a `joined` text by it, and `multiSchema` gives its `source` as the pattern. The old check and the shared form agree on ten texts (the seven of the round, a newline inside a word, one space, three words), run with `node --input-type=module` over `valueProblem`.
- Standards 2 (the narration of the second run): fixed at landing in `agents/reviews/O131-report.md`, the sentence giving the count of runs alone.
- Standards 3 (the sections above "Repair round 1" not the end state): fixed at landing in the report: the DONE row 1, the Files table, "The code", the HELP.md line, judgment calls 3 and 5, the decision 4 bullet and the round section's opening sentence.
- Behaviour 1 (no bullet for the joined class's mark): fixed at landing, a bullet in the report's "Host- or user-visible changes" with the file, the text and the mark; the look checks it.
- Behaviour 2 (the order of the hover's values): fixed at landing, the hover bullet says the word written comes first, with both orders.
