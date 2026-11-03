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
