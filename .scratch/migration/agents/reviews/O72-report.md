Everything in the brief is done.

# O72 report: the closest-word hint named only within half the word's length

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 168-170 (the list holds no entry):

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged code

Command: `node <scratchpad>/caserun/cases.ts <worktree> <scratchpad>/hubs` (a case-run program, source quoted at the end of this report, run with `src/` and `config/` unchanged; `git status --short` at that moment listed only the two test files). Output as printed:

```
case 1 stage submited: ["stage \"submited\" is not a word of the stages list; the closest word is submitted"]
case 2 hub removes nascent: ["stage \"nascent\" is not a word of the stages list; the closest word is failed"]
case 3 stage scope: ["stage \"scope\" is not a word of the stages list; the closest word is scoping"]
case 4 stage draft: ["stage \"draft\" is not a word of the stages list; the closest word is nascent"]
case 5 status In Prep: ["status \"In Prep\" is not a word of the statuses list; the closest word is in-prep"]
case 6 status acepted: ["status \"acepted\" is not a word of the statuses list; the closest word is accepted"]
case 6 status pased: ["status \"pased\" is not a word of the statuses list; the closest word is paused"]
case 6 status not applied: ["status \"not applied\" is not a word of the statuses list; the closest word is not-applied"]
case 6 status under review: ["status \"under review\" is not a word of the statuses list; the closest word is under-review"]
case 6 status canceled: ["status \"canceled\" is not a word of the statuses list; the closest word is cancelled"]
case 6 lead dismised: ["status \"dismised\" is not a word of the Position Lead statuses; the closest word is dismissed"]
case 6 status submitted (exact): []
case 7 status xyz: ["status \"xyz\" is not a word of the statuses list; the closest word is todo"]
case 7b status scope: ["status \"scope\" is not a word of the statuses list; the closest word is scoping"]
case 8 lead zzzz: ["status \"zzzz\" is not a word of the Position Lead statuses; the closest word is open"]
case 10 status 42: ["status 42 is not a word of the statuses list; the closest word is todo"]
case 10 status null: ["status null is not a word of the statuses list; the closest word is todo"]
case 11 status empty text: ["status \"\" is not a word of the statuses list; the closest word is todo"]
case 9 status, empty statuses: ["status \"submitted\" is not a word of the statuses list, which holds no word"]
case 9 lead, empty lead_statuses: ["status \"open\" is not a word of the Position Lead statuses, which hold no word"]
case 9 stage, empty stages: ["stage \"submitted\" is not a word of the stages list, which holds no word"]
case 11 stage empty text: ["stage \"\" is not a word of the stages list; the closest word is failed"]
```

The distance and bound of each case's value, by a second case-run program `dist.ts` (source at the end) that reads the shipped lists through `loadConfig` and calls oculus's `closestWord` on the unchanged tree. Output as printed:

```
{"stages":["nascent","scoping","de-risking","exploring","in-prep","building","submit-ready","submitted","revision","published","released","failed","stopped"],"statuses":[...43 words...],"lead_statuses":["declined","applied","closed","dismissed","open"]}
stages "submited": closestWord=submitted min=1 bound=4 within=true atMin=submitted
stages "nascent": closestWord=failed min=5 bound=3 within=false atMin=failed
stages "scope": closestWord=scoping min=3 bound=2 within=false atMin=scoping,stopped
stages "draft": closestWord=nascent min=6 bound=2 within=false atMin=nascent,failed
stages "": closestWord=failed min=6 bound=0 within=false atMin=failed
stages "accepted": closestWord=nascent min=5 bound=4 within=false atMin=nascent,released,stopped
stages "finished": closestWord=published min=4 bound=4 within=true atMin=published,failed
stages "in_prep": closestWord=in-prep min=1 bound=3 within=true atMin=in-prep
stages "revison": closestWord=revision min=1 bound=3 within=true atMin=revision
statuses "In Prep": closestWord=in-prep min=3 bound=3 within=true atMin=in-prep
statuses "acepted": closestWord=accepted min=1 bound=3 within=true atMin=accepted
statuses "pased": closestWord=paused min=1 bound=2 within=true atMin=paused,passed
statuses "not applied": closestWord=not-applied min=1 bound=5 within=true atMin=not-applied
statuses "under review": closestWord=under-review min=1 bound=6 within=true atMin=under-review
statuses "canceled": closestWord=cancelled min=1 bound=4 within=true atMin=cancelled
statuses "xyz": closestWord=todo min=4 bound=1 within=false atMin=todo,done,past
statuses "scope": closestWord=scoping min=3 bound=2 within=false atMin=scoping,done
statuses "42": closestWord=todo min=4 bound=1 within=false atMin=todo,done,past
statuses "null": closestWord=todo min=4 bound=2 within=false atMin=todo,done,past
statuses "": closestWord=todo min=4 bound=0 within=false atMin=todo,done,past
lead_statuses "dismised": closestWord=dismissed min=1 bound=4 within=true atMin=dismissed
lead_statuses "zzzz": closestWord=open min=4 bound=2 within=false atMin=open
```

(The statuses list of the first line is shortened here to "...43 words..."; the run printed all 43.) Every case's distance and bound agree with the brief, so no case of the brief's own rules came out wrong and the build went ahead. Per case:

1. `submited`: names `submitted` today; distance 1, bound 4, so it keeps the word.
2. hub removes `nascent`: names `failed` today; distance 5, bound 3, so the word goes.
3. stage `scope`: names `scoping` today; distance 3, bound 2, so the word goes.
4. stage `draft`: names `nascent` today; distance 6, bound 2, so the word goes.
5. status `In Prep`: names `in-prep`; distance 3 equals bound 3, so the word stays.
6. The seven other naming rows (acepted, pased, not applied, under review, canceled, dismised) name their word today, each at distance 1 within its bound; the exact word `submitted` gives no finding.
7. status `xyz`: names `todo` today; distance 4, bound 1, so the word goes.
7b. status `scope`: names `scoping` today; distance 3, bound 2, so the word goes.
8. lead status `zzzz`: names `open` today; distance 4, bound 2, so the word goes.
9. Empty lists: the `*_no_vocab` sentence for a status, a lead status and a stage, today.
10. status `42` and status `null`: name `todo` today; distance 4, bounds 1 and 2, so the word goes.
11. status `''` and stage `''`: name `todo` and `failed` today; bound 0, so the word goes.
12. First read of the five reader-facing lines (`docs/HELP.md:519`, `docs/data-map.md:199`, `config/options/catalogs/vocab.yml:18`, `config/catalogs/vocab.yml:101`, `:158`) and the comments (`vocab-keys.ts:6`, `validate.ts:219-221`, `:316-319`, `schema-rules.test.ts:10`): each said the finding names the closest word with no bound, as the brief quotes them.
13. First run of `grep -rn -i "closest word\|closest stage" src tests docs config --exclude=local.yml` on the base: the lines the brief lists under "What is on the tree" (the five reader lines, the comments named in 12, `validate.ts:215`, `schema-rules.test.ts:180`, `:294`, and the three `*_not_in_vocab` sentences).

The test rows on the unchanged code (test files edited, `src/` and `config/` unchanged), `npx vitest run tests/data/snapshot/schema-rules.test.ts tests/data/sources/config/layers/hub-vocab.test.ts --reporter=verbose`, the lines as printed (the check mark written <CHECK MARK>, the cross <MULTIPLICATION SIGN>, an ellipsis in a cut title <HORIZONTAL ELLIPSIS>):

```
 <CHECK MARK> ... names the closest word only within half its length: 'an exact word'
 <CHECK MARK> ... 'one edit'
 <CHECK MARK> ... 'a tie, the first in the list\'s order'
 <CHECK MARK> ... 'a case difference'
 <CHECK MARK> ... 'not applied'
 <CHECK MARK> ... 'under review'
 <CHECK MARK> ... 'canceled'
 <CHECK MARK> ... 'a lead status'
 <MULTIPLICATION SIGN> |unit| tests/data/sources/config/layers/hub-vocab.test.ts > the vocabulary a hub lays over oculus's > takes a stage out with null, and a manifest at that stage is a finding on its stage 440ms
 <MULTIPLICATION SIGN> ... 'no word within the bound'
 <MULTIPLICATION SIGN> ... 'the closest word one edit past the bo<HORIZONTAL ELLIPSIS>'
 <MULTIPLICATION SIGN> ... 'a lead status with no word within the<HORIZONTAL ELLIPSIS>'
 <CHECK MARK> ... 'an entry status and an empty list'
 <CHECK MARK> ... 'a lead status and an empty list'
 <CHECK MARK> ... a manifest's stage outside its list names the closest word only within half its length: 'a word within the bound'
 <MULTIPLICATION SIGN> ... a manifest's stage outside its list names the closest word only within half its length: 'no word within the bound'
 <CHECK MARK> ... a manifest's stage outside its list names the closest word only within half its length: 'a stages list with no word'
 Test Files  2 failed (2)
      Tests  5 failed | 41 passed (46)
```

The failing lines on the unchanged code, as printed:

```
AssertionError: the catalog holds findings.validate.status_unknown: expected undefined to be defined
 > tests/data/snapshot/schema-rules.test.ts:386:61        (rows xyz and scope)
AssertionError: the catalog holds findings.validate.lead_status_unknown: expected undefined to be defined
 > tests/data/snapshot/schema-rules.test.ts:386:61        (row zzzz)
AssertionError: the catalog holds findings.validate.stage_unknown: expected undefined to be defined
 > tests/data/snapshot/schema-rules.test.ts:405:17        (stage row scope)
AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
 > tests/data/sources/config/layers/hub-vocab.test.ts:76:46
+   "stage \"nascent\" is not a word of the stages list; the closest word is failed",
```

So the new rows of cases 3, 7, 7b and 8 and the changed row of case 2 fail on the unchanged code; the rows of cases 1, 5, 6 and 9 (the eight naming rows, the exact word, the two empty status rows, and the new stage rows `submited` and the empty stages list) pass on it. The new `unknown` rows fail at the catalog lookup of the new sentence, since the unchanged catalog has no such key; what the unchanged code says for those inputs is in the case-run output above (it names `todo`, `scoping`, `open`).

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
| --- | --- | --- |
| 1. The bound in `closestWord`, doc comment stating it and why | DONE | `src/lib/data/shapes/vocab-keys.ts:268-283`; case-run after the change (below) gives each case's outcome |
| 2. Three outcomes for each of the three findings, empty list told by the list | DONE | `validate.ts:226-230` `wordHint` (`words.length === 0` gives `empty`); case-run after the change, every line below |
| 3. The three new sentences word for word | DONE | `sed -n '300,308p' config/text/findings.yml`: `status_unknown: 'status {0} is not a word of the statuses list'`, `stage_unknown: 'stage {0} is not a word of the stages list'`, `lead_status_unknown: 'status {0} is not a word of the Position Lead statuses'` |
| 4. The five reader lines and four comments state the bound | DONE | case 13 grep below; each line read against the code (case 12) |
| 5. Test rows: three STATUS_ROWS, stage table, hub-vocab :77, row type comment, title | DONE | `npx vitest run tests/data/snapshot/schema-rules.test.ts tests/data/sources/config/layers/hub-vocab.test.ts`: ` Test Files  2 passed (2)` / `      Tests  46 passed (46)` |
| `leadStatusFindings` keeps its signature, `feeds.ts` unchanged | DONE | `git diff --numstat` lists no `feeds.ts`; signature `(file, entries, words, catalog): Finding[]` at `validate.ts:282-287` |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `test:quick: 114.5 s; every command passed`, then `exit 0` (lines below) |
| Verify 2: the named vitest run | DONE | ` Test Files  2 passed (2)` / `      Tests  46 passed (46)` |
| Verify 3: before and after of each new or changed row | DONE | before: section above; after: verbose run below, every row passing |
| Verify 4: case 13 grep | DONE | output below, every line judged |
| Verify 5: unused exports compared with the base | DONE | `diff .../O72-base/unused-exports.txt <after>` prints nothing, `unused diff exit 0`; no line added |
| Verify 6: prose of each changed sentence | DONE | section "Prose of the changed sentences" below |
| ASCII gate over the changed files | DONE | the spec's `perl` gate over `git diff --name-only` prints nothing, `ascii exit 0` |
| History-word grep of added comments and titles | DONE | `git diff -U0 \| grep '^+' \| grep -i -E "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package\|O[0-9]+\|20[0-9][0-9]-"` prints nothing, `history grep exit 1` |

The verify list's summary lines, as printed by the last run:

```
ok      ASCII gate (1.1 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.8 s)
ok      svelte-check (70.3 s): 1792925136783 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (83.9 s)
ok      vitest (86.4 s): Duration  75.38s (transform 54.13s, setup 0ms, import 125.05s, tests 98.67s, environment 30.25s)
ok      vitest slow (102.5 s): Duration  91.50s (transform 14.86s, setup 0ms, import 55.15s, tests 155.54s, environment 2ms)
ok      vitest checks (111.5 s): Duration  100.33s (transform 97.37s, setup 0ms, import 190.85s, tests 11.72s, environment 1ms)
test:quick: 114.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0
```

It listed `test:quick: 10 changed file(s), from git since HEAD` (the nine files and this report) and ran `tests/data/snapshot/schema-rules.test.ts: changed`, `tests/data/sources/config/layers/hub-vocab.test.ts: changed` and `tests/checks/source/keys.test.ts: imports at depth 1` among the selected files.

The case-run program after the last change, as printed:

```
case 1 stage submited: ["stage \"submited\" is not a word of the stages list; the closest word is submitted"]
case 2 hub removes nascent: ["stage \"nascent\" is not a word of the stages list"]
case 3 stage scope: ["stage \"scope\" is not a word of the stages list"]
case 4 stage draft: ["stage \"draft\" is not a word of the stages list"]
case 5 status In Prep: ["status \"In Prep\" is not a word of the statuses list; the closest word is in-prep"]
case 6 status acepted: ["status \"acepted\" is not a word of the statuses list; the closest word is accepted"]
case 6 status pased: ["status \"pased\" is not a word of the statuses list; the closest word is paused"]
case 6 status not applied: ["status \"not applied\" is not a word of the statuses list; the closest word is not-applied"]
case 6 status under review: ["status \"under review\" is not a word of the statuses list; the closest word is under-review"]
case 6 status canceled: ["status \"canceled\" is not a word of the statuses list; the closest word is cancelled"]
case 6 lead dismised: ["status \"dismised\" is not a word of the Position Lead statuses; the closest word is dismissed"]
case 6 status submitted (exact): []
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
```

Every case 1 to 11 gives the outcome the brief states.

The rows after the change, `--reporter=verbose`, every row of the status table, the stage table and the hub-vocab row passing (`<CHECK MARK>` on each of the 13 status rows, the 3 stage rows and `takes a stage out with null, and a manifest at that stage is a finding on its stage`), then ` Test Files  2 passed (2)` / `      Tests  46 passed (46)`.

Case 12, each line read against the code:

- `docs/HELP.md:519`: "A status that is no word of its list is a finding naming the closest word when that word is within half the written word's length in single-letter changes, rounded down, and ...". True: `closestWord` returns a word only at `best.distance <= Math.floor(word.length / 2)` (`vocab-keys.ts:283`).
- `docs/data-map.md:199`: the same clause with "of the list". True, same code.
- `config/options/catalogs/vocab.yml:18`: "... a finding naming the closest stage when that stage is within half the written stage's length in single-letter changes, rounded down." True: `checkManifestStage` calls `wordHint(manifest.stage, vocab.stages)` (`validate.ts:359`).
- `config/catalogs/vocab.yml:101` and `:158`: "a status the list does not hold is a finding naming the closest word when that word is within half the written status's length in single-letter changes, rounded down." True: `statusFindings` calls `wordHint` for both lists (`validate.ts:253`).
- `vocab-keys.ts:5-7` (head comment), `validate.ts` doc comments of `wordHint`, `statusFindings` and `checkManifestStage`, and `schema-rules.test.ts:8-11`: each states the bound, and each validate doc comment names the third outcome ("ending after the list's name when none does" / "when no word lies that near").

Case 13, `grep -rn -i "closest word\|closest stage" src tests docs config --exclude=local.yml` after the last change (long lines cut at 230 columns by `cut`):

```
src/lib/data/snapshot/validate.ts:223: * list itself, and a list with words gives the closest word only when `closestWord` finds one
src/lib/data/snapshot/validate.ts:232:/** The sentence of a status outside its list: the status as shown, and the closest word if any. */
src/lib/data/snapshot/validate.ts:237: * naming the closest word of the list when one lies within half the status's length in
src/lib/data/shapes/vocab-keys.ts:6:// `blocked: true`. A word a list does not hold is answered with the list's closest word when that
tests/data/snapshot/schema-rules.test.ts:10:// and a third a manifest's stage against `stages:`, each finding naming the closest word of the
tests/data/snapshot/schema-rules.test.ts:262:        name: 'the closest word one edit past the bound',
tests/data/snapshot/schema-rules.test.ts:374:        'a status outside its vocabulary names the closest word only within half its length: $name',
tests/data/snapshot/schema-rules.test.ts:394:        "a manifest's stage outside its list names the closest word only within half its length: $name",
docs/HELP.md:519:- Each word has one home in `vocab.yml`: ...
docs/data-map.md:199:The vocabulary keeps each word in one list: ...
config/options/catalogs/vocab.yml:18:        help: "The project stages, ...
config/text/findings.yml:300:            status_not_in_vocab: 'status {0} is not a word of the statuses list; the closest word is {1}'
config/text/findings.yml:303:            stage_not_in_vocab: 'stage {0} is not a word of the stages list; the closest word is {1}'
config/text/findings.yml:306:            lead_status_not_in_vocab: 'status {0} is not a word of the Position Lead statuses; the closest word is {1}'
config/catalogs/vocab.yml:101:# The statuses a collection entry's `status` takes, ...
config/catalogs/vocab.yml:158:# The statuses a Position Lead's `status` takes, ...
```

Judged: `validate.ts:223` (doc of `wordHint`), `:237` (doc of `statusFindings`), `vocab-keys.ts:6`, `schema-rules.test.ts:10`, the five reader lines: each states the bound in the same sentence. `validate.ts:232` is the brief's `validate.ts:215` line, unchanged in text, moved down by the lines added above it; "the closest word if any" stays true. `schema-rules.test.ts:262` is a row name of the new 7b row, stating the bound; `:374` and `:394` are the test titles, stating the bound. The three `findings.yml` lines are the `*_not_in_vocab` sentences. The doc comment of `closestWord` (`vocab-keys.ts:268-275`) states the bound but words it "closest to `word`", so the grep does not list it. The doc of the test's `Said` type (`schema-rules.test.ts:174-181`) and the `StatusRow.said` comment state the bound without the words "closest word". No line states an unbounded hint.

## Files, with line counts after the last change

From `git diff --numstat` and `wc -l`; every path is on the brief's write list.

| File | Added / removed | Lines now |
| --- | --- | --- |
| `src/lib/data/shapes/vocab-keys.ts` | 9 / 4 | 316 |
| `src/lib/data/snapshot/validate.ts` | 49 / 17 | 561 |
| `config/text/findings.yml` (three keys after lines 300, 302, 304) | 3 / 0 | 423 |
| `config/catalogs/vocab.yml` (lines 101, 158) | 2 / 2 | 245 |
| `config/options/catalogs/vocab.yml` (line 18) | 1 / 1 | 298 |
| `docs/HELP.md` (line 519) | 1 / 1 | 568 |
| `docs/data-map.md` (line 199) | 1 / 1 | 261 |
| `tests/data/snapshot/schema-rules.test.ts` | 151 / 49 | 465 |
| `tests/data/sources/config/layers/hub-vocab.test.ts` | 1 / 1 | 301 |
| `.scratch/migration/agents/reviews/O72-report.md` | this report | |

`npm run diagrams` changed no file (`git status --short` after both runs lists only the nine files above).

## Edits to existing assertions and test predicates (from `git diff` of the two test files)

| Place | Before | After |
| --- | --- | --- |
| `hub-vocab.test.ts:77` expected message | `'stage "nascent" is not a word of the stages list; the closest word is failed'` | `'stage "nascent" is not a word of the stages list'` |
| `StatusRow` fields | `empty?: boolean;` and `closest: string \| null;` | `said: Said;` and `closest?: string;` |
| each existing `STATUS_ROWS` row | `closest: null` / `closest: '<word>'` / `empty: true, closest: ''` | `said: 'none'` / `said: 'not_in_vocab', closest: '<word>'` / `said: 'no_vocab'`; the same expected sentence for every row |
| `statusSentence` body | branches on `row.closest === null` and `row.empty === true` | `saidSentence(kind, row.status, row.said, row.closest)`, giving the same sentence for every existing row and the `*_unknown` sentence for the new rows |
| the empty-list config predicate | `row.empty === true ? ...` | `row.said === 'no_vocab' ? ...` |
| test title | `'a status outside its vocabulary names the closest word: $name'` | `'a status outside its vocabulary names the closest word only within half its length: $name'` |

No threshold was loosened; every existing row expects the same sentence it expected on the base, which its passing run on the unchanged code shows.

## Docs and comments re-read

- `vocab-keys.ts` head comment: rewritten (bound added, paragraph rewrapped at 100 columns).
- `closestWord` doc comment: rewritten. `distance` doc comment: still true.
- `validate.ts` head comment: still true. `StatusSaid` comment: still true. `statusFindings`, `checkManifestStage`: rewritten. `wordHint`, `WordHint`: new. `checkEntryStatus`, `leadStatusFindings`, `withoutValidated` doc comments: still true.
- `schema-rules.test.ts` head comment: rewritten, rewrapped as a whole paragraph.
- `docs/HELP.md:519`, `docs/data-map.md:199`, `config/options/catalogs/vocab.yml:18`, `config/catalogs/vocab.yml:101`, `:158`: rewritten.
- `grep -rn -i 'closest' docs README.md` lists no other doc line about the hint; `docs/apps.md` has none.
- Name grep before naming the new type and helper: `grep -rnw 'WordHint\|wordHint\|Hint\|hintOf' src tests` found only Monaco's `MarkerSeverity.Hint` (`src/lib/ui/controls/editor/kit/lsp/markers.ts:26`) and an LSP severity constant (`src/lib/server/machine/apps/host/runner/values/text.mjs:13`), neither a helper to reuse. After the change, `grep -rn 'WordHint\|wordHint' src tests` lists only `validate.ts:219`, `:226`, `:233`, `:253`, `:359`. `StatusSaid` keeps its name and now takes a `WordHint`. No helper existed that picks among a list's three sentences (`git show HEAD:src/lib/data/snapshot/validate.ts` has the two-way choice written inline in each caller).

## Judgment calls the brief left open (each reversible)

1. Where the three outcomes are decided: `wordHint(written, words)` in `validate.ts` (`:226-230`) returns a tagged `WordHint` (`empty`, `far`, `near` with the word); `empty` is decided by `words.length === 0` and `far` by `closestWord` returning none, so the two are never told apart by one `undefined`. Each of the three callers maps the tag to its three sentences with the keys written as whole literals, because `tests/checks/source/keys.test.ts` ('reads every findingText key as a whole literal, except where a documented rule computes it') refuses a `findingText` key passed through a variable. The bound itself stays in `closestWord` alone.
2. The test's row type: `said: Said` (`'none' | 'not_in_vocab' | 'unknown' | 'no_vocab'`, the ending of the sentence key) replaces `empty` and the `closest: string | null` sentinel, with `closest?: string` only for `not_in_vocab`. One helper, `saidSentence(kind, written, said, closest)`, gives the expected sentence to the status table (through `statusSentence`) and to the stage table.
3. The stage table is `STAGE_ROWS` with an `it.each` inside the describe 'the rules of a hub schema', titled "a manifest's stage outside its list names the closest word only within half its length: $name"; its rows are `submited` (word named), `scope` (no word within the bound) and `submitted` with `stages: {}` (no word in the list).
4. The new rows' names: 'no word within the bound' (`xyz`), 'the closest word one edit past the bound' (`scope`), 'a lead status with no word within the bound' (`zzzz`).
5. Each new sentence key sits right after its `*_not_in_vocab` key in `findings.yml`.
6. The reader lines say "within half the written word's length in single-letter changes, rounded down", with "stage's" in the stages help and "status's" in the two statuses head comments, where the sentence is about that value.

## User-visible changes, before and after

Where seen: any view that lists the hub's findings (the Problems view, the audit's findings), for a manifest or a collection entry whose stage or status is no word of its list; and the Options page, Vocabulary section, the help of `stages`. The finding sentences:

| Input | Before | After |
| --- | --- | --- |
| stage `submited` (word within the bound) | `stage "submited" is not a word of the stages list; the closest word is submitted` | unchanged |
| stage `scope` (no word within the bound) | `stage "scope" is not a word of the stages list; the closest word is scoping` | `stage "scope" is not a word of the stages list` |
| stage, hub stages list with no word | `stage "submitted" is not a word of the stages list, which holds no word` | unchanged |
| status `In Prep` (distance 3, bound 3) | `...; the closest word is in-prep` | unchanged |
| status `xyz` | `status "xyz" is not a word of the statuses list; the closest word is todo` | `status "xyz" is not a word of the statuses list` |
| status `42` | `status 42 is not a word of the statuses list; the closest word is todo` | `status 42 is not a word of the statuses list` |
| lead status `zzzz` | `status "zzzz" is not a word of the Position Lead statuses; the closest word is open` | `status "zzzz" is not a word of the Position Lead statuses` |
| lead status, empty list | `status "open" is not a word of the Position Lead statuses, which hold no word` | unchanged |

The Options help of `stages` (`config/options/catalogs/vocab.yml:18`): before "... A manifest at a stage the list does not hold is a finding naming the closest stage."; after "... A manifest at a stage the list does not hold is a finding naming the closest stage when that stage is within half the written stage's length in single-letter changes, rounded down." The Help page line 519 and the data map line 199 change the same clause.

## Prose of the changed sentences

Each changed sentence is ASCII, has no dash standing for a pause, no 'not X but Y' construction and no history word. One place reads heavily: `docs/HELP.md:519` and `docs/data-map.md:199` now hold "..., rounded down, and a stage word or a form written as a chip is a finding ...", two clauses joined after a comma-delimited qualifier; the brief allowed only the closest-word clause to change, so the sentence was not split.

## Limitations and sharp edges

- The comparison is case-sensitive and counts characters as written, as decision 1 of the brief says: `SUBMITTED` as a stage gets no hint. No hub value is written so today (not verified against the hub, which this step does not read).
- At the edge of the bound a far word can still be named: `finished` as a stage names `published` (4 of 4), shown by `dist.ts` above; this is the ruling's bound as written.
- A tie at the smallest distance names the first in the list's order, unchanged (`pased` names `paused`, with `passed` at the same distance).

## Anything in the brief wrong or impossible

Nothing wrong. One line moved: the brief's `validate.ts:215` ("the closest word if any") is now `validate.ts:232`, its text unchanged, pushed down by the `WordHint` type and `wordHint` added above it.

## Runs

- The verify list (`npm run diagrams && npm run test:quick`) ran three times. The first run was red in `tests/checks/source/keys.test.ts` ('reads every findingText key as a whole literal, except where a documented rule computes it'), naming `lib/data/snapshot/validate.ts` (a file this step changes) for `findingText` keys passed through a variable; `validate.ts` was changed so each key is a whole literal, the three affected files were run alone (`npx vitest run tests/data/snapshot/schema-rules.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/source/keys.test.ts`: ` Test Files  3 passed (3)` / `      Tests  56 passed (56)`), and the list ran once more, green. After that run the local type and helper of `validate.ts` were renamed (`Offer` to `WordHint`, `offerOf` to `wordHint`) because `Offer` and `offerOf` already name unrelated things in `src/lib/state/system/config/editors/fields.ts:703`, `src/lib/server/files/project/make.ts:213` and `src/lib/state/shared/words/appearance.ts:410`; the three files were run alone again (` Test Files  3 passed (3)` / `      Tests  56 passed (56)`), the case-run output compared equal (`diff` printed nothing), and the list ran a third time, green, as quoted above.
- No whole-suite command was run.
- `sh utils/unused-exports.sh` ran three times; each output equals the base's file.

## The case-run programs

Both lived in the session scratchpad, outside the worktree, and are deleted after this report. They were run as `node <file> <worktree> [<scratch folder>]` with Node v24.21.0, which runs TypeScript by stripping types.


`cases.ts`:

```ts
// Case-run program for O72: prints the stage and status findings oculus gives for each case's
// input, built from a hub planted in a scratch folder. Writes nothing into the worktree.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const W = process.argv[2];
const { portfolioConfigFrom, readHub, builtHub } = await import(`${W}/src/lib/data/index.ts`);
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
const { createChecker } = await import(`${W}/src/lib/data/snapshot/schema/check.ts`);
const SCRATCH = process.argv[3];
const LOADED = loadConfig(engineDir()).config;

function plant(files: Record<string, string>): string {
    const hub = mkdtempSync(join(SCRATCH, 'hub-'));
    mkdirSync(join(hub, 'projects/active'), { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(hub, rel)), { recursive: true });
        writeFileSync(join(hub, rel), body);
    }
    return hub;
}

function run(name: string, files: Record<string, string>, config: unknown, key: string): void {
    const hub = plant(files);
    const read = readHub(hub, config, [], 'hub');
    const built = builtHub(read, {
        version: 0,
        checker: createChecker(),
        engine: null,
        workspace: null,
        others: {}
    });
    const found = built.snapshot.findings.filter((one: { key: string }) => one.key === key);
    console.log(`${name}: ${JSON.stringify(found.map((one: { message: string }) => one.message))}`);
}

const CONFIG = portfolioConfigFrom(LOADED);
const stage = (value: string) => ({
    'projects/active/alpha/project.yml': `id: alpha\ntier: research\ntitle: Alpha\nstage: ${value}\n`
});
const status = (file: string, value: string) => ({
    [`.oculus/data/academic/${file}.yml`]: `entries:\n  - { title: One, status: ${value} }\n`
});

run('case 1 stage submited', stage('submited'), CONFIG, 'stage');
{
    const text = 'stages: { nascent: null }\n';
    const hub = plant({
        '.oculus/config.yml': text,
        'projects/ideas/x/project.yml': 'title: X\ntier: research\nstage: nascent\n'
    });
    const settings = loadConfig(engineDir(), { hub });
    const read = readHub(hub, portfolioConfigFrom(settings.config, settings.from), [], 'hub');
    const built = builtHub(read, {
        version: 0,
        checker: createChecker(),
        engine: null,
        workspace: null,
        others: {}
    });
    const on = built.snapshot.findings.filter((one: { key: string }) => one.key === 'stage');
    console.log(`case 2 hub removes nascent: ${JSON.stringify(on.map((one: { message: string }) => one.message))}`);
}
run('case 3 stage scope', stage('scope'), CONFIG, 'stage');
run('case 4 stage draft', stage('draft'), CONFIG, 'stage');
for (const [label, file, value] of [
    ['case 5 status In Prep', 'applications', '"In Prep"'],
    ['case 6 status acepted', 'applications', 'acepted'],
    ['case 6 status pased', 'applications', 'pased'],
    ['case 6 status not applied', 'applications', '"not applied"'],
    ['case 6 status under review', 'applications', '"under review"'],
    ['case 6 status canceled', 'applications', 'canceled'],
    ['case 6 lead dismised', 'leads', 'dismised'],
    ['case 6 status submitted (exact)', 'applications', 'submitted'],
    ['case 7 status xyz', 'applications', 'xyz'],
    ['case 7b status scope', 'applications', 'scope'],
    ['case 8 lead zzzz', 'leads', 'zzzz'],
    ['case 10 status 42', 'applications', '42'],
    ['case 10 status null', 'applications', 'null'],
    ['case 11 status empty text', 'applications', "''"]
]) {
    run(label, status(file, value), CONFIG, 'entries[0].status');
}
run('case 9 status, empty statuses', status('applications', 'submitted'), portfolioConfigFrom({ ...LOADED, statuses: {} }), 'entries[0].status');
run('case 9 lead, empty lead_statuses', status('leads', 'open'), portfolioConfigFrom({ ...LOADED, lead_statuses: {} }), 'entries[0].status');
run('case 9 stage, empty stages', stage('submitted'), portfolioConfigFrom({ ...LOADED, stages: {} }), 'stage');
run("case 11 stage empty text", stage("''"), CONFIG, 'stage');
```

`dist.ts`:

```ts
// Case-run program: for each case's value, the smallest Levenshtein distance to its list (oculus's
// shipped vocab.yml read through loadConfig), the word at it, and the bound floor(len/2).
const W = process.argv[2];
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
const { closestWord } = await import(`${W}/src/lib/data/shapes/vocab-keys.ts`);
const C = loadConfig(engineDir()).config as Record<string, unknown>;
const keys = (v: unknown) => (Array.isArray(v) ? v.map((r: { key: string }) => r.key) : Object.keys(v as object));
function lev(a: string, b: string): number {
    let above = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let r = 1; r <= a.length; r++) {
        const f = [r];
        for (let c = 1; c <= b.length; c++) f.push(Math.min(above[c] + 1, f[c - 1] + 1, above[c - 1] + (a[r - 1] === b[c - 1] ? 0 : 1)));
        above = f;
    }
    return above[b.length];
}
const lists = { stages: keys(C.stages), statuses: keys(C.statuses), lead_statuses: keys(C.lead_statuses) };
console.log(JSON.stringify(lists));
for (const [list, word] of [
    ['stages', 'submited'], ['stages', 'nascent'], ['stages', 'scope'], ['stages', 'draft'], ['stages', ''],
    ['stages', 'accepted'], ['stages', 'finished'], ['stages', 'in_prep'], ['stages', 'revison'],
    ['statuses', 'In Prep'], ['statuses', 'acepted'], ['statuses', 'pased'], ['statuses', 'not applied'],
    ['statuses', 'under review'], ['statuses', 'canceled'], ['statuses', 'xyz'], ['statuses', 'scope'],
    ['statuses', '42'], ['statuses', 'null'], ['statuses', ''], ['lead_statuses', 'dismised'], ['lead_statuses', 'zzzz']
] as [keyof typeof lists, string][]) {
    const words = list === 'stages' && word === 'nascent' ? lists.stages.filter((w) => w !== 'nascent') : lists[list];
    const min = Math.min(...words.map((w) => lev(word, w)));
    console.log(`${list} ${JSON.stringify(word)}: closestWord=${closestWord(word, words)} min=${min} bound=${Math.floor(word.length / 2)} within=${min <= Math.floor(word.length / 2)} atMin=${words.filter((w) => lev(word, w) === min).join(',')}`);
}
```
