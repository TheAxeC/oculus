# Step O72 refuter report (on .agents/worktrees/migration-O72, base b254d6ac)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base b254d6ac        (worktree root)
ok      ASCII gate (0.7 s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (18.0 s)
ok      vitest (63.3 s): Duration  53.05s (transform 69.63s, setup 0ms, import 85.69s, tests 47.89s, environment 35.90s)
ok      vitest slow (65.5 s): Duration  55.13s (transform 9.10s, setup 0ms, import 37.03s, tests 84.19s, environment 1ms)
ok      eslint (65.9 s)
ok      svelte-check (69.4 s): 1792925509142 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (86.6 s): Duration  76.32s (transform 65.69s, setup 0ms, import 144.82s, tests 10.13s, environment 1ms)
test:quick: 104.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0
(git status --short afterwards: the same nine modified files and the untracked report; npm run diagrams changed nothing)

$ npx vitest run tests/data/snapshot/schema-rules.test.ts tests/data/sources/config/layers/hub-vocab.test.ts --reporter=verbose
<CHECK MARK> on all 13 rows of "a status outside its vocabulary names the closest word only within half its length: $name"
  ('an exact word', 'one edit', 'a tie, the first in the list\'s order', 'a case difference', 'not applied', 'under review', 'canceled', 'a lead status', 'no word within the bound', 'the closest word one edit past the bo<HORIZONTAL ELLIPSIS>', 'a lead status with no word within the<HORIZONTAL ELLIPSIS>', 'an entry status and an empty list', 'a lead status and an empty list')
<CHECK MARK> on all 3 rows of "a manifest's stage outside its list names the closest word only within half its length: $name"
<CHECK MARK> hub-vocab.test.ts > takes a stage out with null, and a manifest at that stage is a finding on its stage
 Test Files  2 passed (2)
      Tests  46 passed (46)

$ grep -rn -i "closest word\|closest stage" src tests docs config --exclude=local.yml     (case 13)
src/lib/data/snapshot/validate.ts:223  (doc of wordHint, states the bound)
src/lib/data/snapshot/validate.ts:232  "/** The sentence of a status outside its list: the status as shown, and the closest word if any. */"
src/lib/data/snapshot/validate.ts:237  (doc of statusFindings, states the bound)
src/lib/data/shapes/vocab-keys.ts:6    (head comment, states the bound)
tests/data/snapshot/schema-rules.test.ts:10, :262 (row name), :374 and :394 (test titles), each stating the bound
docs/HELP.md:519, docs/data-map.md:199, config/options/catalogs/vocab.yml:18, config/catalogs/vocab.yml:101, :158 (each states the bound)
config/text/findings.yml:300, :303, :306 (the three *_not_in_vocab sentences)

$ sh utils/unused-exports.sh > <scratch>; diff .agents/worktrees/O72-base/unused-exports.txt <scratch>
script exit 0 / diff exit 0 (343 lines, none added)

$ the rules file's perl ASCII gate over the nine changed files and the report
ascii exit 0

$ git diff b254d6ac | grep '^+' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"
history grep exit 1 (no hit)

$ npx vitest run tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts   (catalog keys read as whole literals; orphan catalog keys)
 Test Files  2 passed (2)
      Tests  38 passed | 2 skipped (40)

$ node --input-type=module -e "<the report's cases.ts, inlined as plain JS, hubs planted in a scratch folder outside the tree and removed after>"
case 1 stage submited: ["stage \"submited\" is not a word of the stages list; the closest word is submitted"]
case 2 hub removes nascent: ["stage \"nascent\" is not a word of the stages list"]
case 3 stage scope: ["stage \"scope\" is not a word of the stages list"]
case 4 stage draft: ["stage \"draft\" is not a word of the stages list"]
extra stage finished: ["stage \"finished\" is not a word of the stages list; the closest word is published"]
extra stage SUBMITTED: ["stage \"SUBMITTED\" is not a word of the stages list"]
case 5 status In Prep: ["status \"In Prep\" is not a word of the statuses list; the closest word is in-prep"]
case 7 status xyz: ["status \"xyz\" is not a word of the statuses list"]
case 7b status scope: ["status \"scope\" is not a word of the statuses list"]
case 8 lead zzzz: ["status \"zzzz\" is not a word of the Position Lead statuses"]
case 10 status 42: ["status 42 is not a word of the statuses list"]
case 10 status null: ["status null is not a word of the statuses list"]
case 11 status empty text: ["status \"\" is not a word of the statuses list"]
case 9 status, empty statuses: ["status \"submitted\" is not a word of the statuses list, which holds no word"]
case 9 lead, empty lead_statuses: ["status \"open\" is not a word of the Position Lead statuses, which hold no word"]
case 9 stage, empty stages: ["stage \"submitted\" is not a word of the stages list, which holds no word"]
case 11 stage empty text: ["stage \"\" is not a word of the stages list"]

$ node --input-type=module -e "<the report's dist.ts, inlined>"   (after the change)
statuses count 43
every line's min and bound equal the report's; closestWord now prints the word only where min <= bound
(submited 1/4 submitted, finished 4/4 published, in_prep 1/3, revison 1/3, In Prep 3/3, acepted, pased, not applied, under review, canceled, dismised named; nascent 5/3, scope 3/2, draft 6/2, "" , accepted 5/4, xyz 4/1, scope 3/2, 42 4/1, null 4/2, zzzz 4/2 give undefined)

$ grep -rn "closestWord" src tests config --exclude=local.yml
src/lib/data/snapshot/validate.ts:38 (import), :228 (the one call, inside wordHint); vocab-keys.ts:276 (definition); doc mentions at validate.ts:217, :223
$ grep -rn "leadStatusFindings\|statusFindings\|checkManifestStage\|wordHint" src tests (outside validate.ts)
src/lib/data/sources/documents/feeds.ts:24, :78 (leadStatusFindings, signature unchanged)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `vocab-keys.ts:276-284` computes `Math.floor(word.length / 2)` and returns the word only at `best.distance <= bound`; it is the only definition and `validate.ts:228` (inside `wordHint`) is its only caller, so every finding goes through the bound; the length is that of the string for a text and of the JSON otherwise (`validate.ts:253`, `:359`); the doc comment `vocab-keys.ts:268-275` states the bound and why.
- 2: holds. `wordHint` (`validate.ts:226-230`) returns `empty` on `words.length === 0` before calling `closestWord`, so "no word in the list" is told by the list; each of the three callers (`:265-270`, `:288-298`, `:360-365`) maps `empty`, `far` and `near` to `*_no_vocab`, `*_unknown` and `*_not_in_vocab`; the case run gives all three outcomes for each finding.
- 3: holds. `config/text/findings.yml:301`, `:304`, `:307` hold the three sentences word for word, each after its `*_not_in_vocab` key; `keys.test.ts` and `config-folder.test.ts` pass.
- 4: holds. The five reader lines and the comments `vocab-keys.ts:6-7`, `validate.ts:234-240` (statusFindings), `:344-350` (checkManifestStage) and `schema-rules.test.ts:8-11` state the bound; the two validate doc comments name the third outcome. See Standards 1 for a neighbouring comment the brief did not list.
- 5: holds. Three new STATUS_ROWS (`xyz`, `scope`, `zzzz`), the row type with `said` and its comment (`schema-rules.test.ts:198-206`), the retitled test (`:374`), the new STAGE_ROWS table with the three rows (`:291-302`, run at `:393-409`), and `hub-vocab.test.ts:77` expecting `'stage "nascent" is not a word of the stages list'`; `agents/guarded.md` is not in the diff.

Cases of the brief's "Cases":

- 1: met, STAGE_ROWS 'a word within the bound' passes and the case run prints the `submitted` sentence.
- 2: met, the hub-vocab row passes and the case run prints `stage "nascent" is not a word of the stages list`.
- 3: met, STAGE_ROWS 'no word within the bound' and the case run.
- 4: met, the case run prints `stage "draft" is not a word of the stages list`.
- 5: met, the 'a case difference' row passes (distance 3, bound 3, `in-prep` named).
- 6: met, the eight existing naming rows pass with the same expected sentence; their passing run on the unchanged tree is quoted in the report.
- 7: met, row 'no word within the bound' and the case run.
- 7b: met, row 'the closest word one edit past the bound' and the case run.
- 8: met, row 'a lead status with no word within the bound' and the case run.
- 9: met, the two empty status rows and the STAGE_ROWS empty row pass; the case run prints the three `*_no_vocab` sentences.
- 10: met, the case run prints `status 42 ...` and `status null ...` with no word.
- 11: met, the case run prints `status "" ...` and `stage "" ...` with no word.
- 12: met, by reading each of the five lines against `vocab-keys.ts:277-283` and `validate.ts:226-230`; each reads true.
- 13: met, the grep prints only the lines the case allows (the row name at `schema-rules.test.ts:262` also states the bound).

## 1. Spec

none.

## 2. Proof

none.

## 3. Standards

- `src/lib/data/snapshot/validate.ts:232-233`: "/** The sentence of a status outside its list: the status as shown, and the closest word if any. */ type StatusSaid = (shown: string, hint: WordHint) => string;"; what is wrong: the diff changed the second parameter from `closest: string | undefined` to `hint: WordHint`, which carries the empty-list case apart from the no-word-near case, and the comment still describes it as "the closest word if any"; the report lists it as "still true" (section "Docs and comments re-read"). The rules file ("What every package obeys", the rule to re-read the doc comment of every function touched and list it as still true or rewritten) asks for a comment that says what the code does. The sentence is incomplete rather than false: it leaves out exactly the distinction item 2 adds. Failure scenario: someone writing a fourth caller reads the comment, takes the second argument as an optional word and branches on its presence, which brings back the one-`undefined` ambiguity that item 2 removes; the type checker catches the mismatch, so the cost is a wrong first attempt, not wrong output. Fix at landing: one comment line, for example "the status as shown, and the hint of its list (`WordHint`)". verdict: none (item 4 does not list this line).
- `.scratch/migration/agents/reviews/O72-report.md`, section "Runs": "The verify list (`npm run diagrams && npm run test:quick`) ran three times. ... After that run the local type and helper of `validate.ts` were renamed (`Offer` to `WordHint`, `offerOf` to `wordHint`) ... and the list ran a third time"; what is wrong: the rules file ("Token discipline") allows one run after the last change, plus one more after a red line in a changed file is fixed. Run 1 was red and run 2 was green, but run 2 came before a further code change (the rename), so it was not after the last change and is a run beyond what that paragraph allows, which the paragraph names a review finding. Failure scenario: about 110 s of the full list (one test:quick run) spent for nothing, on a machine where several suites already run at once. The rename itself was needed, because `Offer` and `offerOf` already name other things. verdict: none.

## 4. Behaviour

none. The report's "User-visible changes, before and after" covers each of the three outcomes for the stage, status and lead-status findings, plus the help text of the Options `stages` entry; the case run reproduces each "after" sentence. The report names the edge cases `finished` to `published` (4 of 4) and `SUBMITTED`, which gets no hint. Both follow from the bound as ruled, and the reviewer's run reproduces both.

## Declined to judge

- The order of the builder's first runs (the case run and the test rows run with `src/` and `config/` unchanged, before any code change): the tree cannot show the order. Rerunning the rows on the unchanged code would mean putting the base code back into a copy, which the rules file's ban on breakage testing forbids and the refute skill does not ask for. The quoted failures are consistent with the code: the three new `unknown` rows fail at the catalog lookup of the missing key, and the hub-vocab row fails on the `failed` hint. What the unchanged code printed for those inputs (`todo`, `scoping`, `open`) is shown by the report's case run on the base, which the reviewer did not rerun on the base for the same reason.
- The report's quoted git commands other than the reviewer's three forms: `git diff --numstat` (the reviewer's `git diff b254d6ac --stat` gives matching totals: vocab-keys 13, validate 66, schema-rules 200 changed lines), `git show HEAD:src/lib/data/snapshot/validate.ts` (read instead as `git show b254d6ac:<path>`), and `git diff -U0 | grep '^+' ...` for the history grep (rerun as `git diff b254d6ac | grep '^+' ...`, no hit). They were not run in their quoted form because the refute skill's Rules allow the reviewer only `git diff <base>`, `git status --short` and `git show <base>:<path>`.
- The report's claim that its first verify run was red in `tests/checks/source/keys.test.ts` because a `findingText` key was passed through a variable: that state no longer exists in the tree. The reviewer's run of `keys.test.ts` on the current tree passes.
- The stack-frame line numbers the report quotes for the first-run failures (`schema-rules.test.ts:386:61`, `:405:17`) do not match the current file, where the `expect` calls are at `:388` and `:406`. The file was reformatted after that run, and no decision rests on these numbers.
- Whether the new test rows cover behaviour whose failure costs something: G56's entry and the brief already decide this, which is the user's ruling, not the reviewer's.

Reviewer usage: a903c2d8114d64f0e, claude-opus-5-5, 181670 tokens, 35 tool uses, 7 min 51 s.

## Closed (the orchestrator's disposition of every finding above, appended before /land)

- Standards 1 (`validate.ts:232`, the comment of `StatusSaid` still says "the closest word if any"): fixed at landing on main, the comment rewritten to name the list's hint (`WordHint`).
- Standards 2 (the verify list run three times, one run beyond "Token discipline"): no code to change; named in the landing booking as a point against the builder's bar.
