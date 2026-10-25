Brief check of O72 (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O72.md`), read on main at bffb4005. I changed nothing.

Five findings change what the builder is asked to do:
- **F1:** seven false lines are not named in the brief.
- **F2:** the stage outcomes "word named" and "empty list" have no test row, and case 9 says they do.
- **F3:** the kept tests do not pin the bound itself.
- **F4:** the unused-exports base output is missing from the brief.
- **F5:** the Position Lead extension is not listed among the brief's decisions.

## 1. Names

Command:
`grep -rn --exclude=local.yml -e closestWord -e stage_not_in_vocab -e status_not_in_vocab -e lead_status_not_in_vocab -e _no_vocab -e stage_unknown -e status_unknown -e lead_status_unknown -i -e 'closest word' -e 'closest stage' src tests config docs utils bin README.md`

- `bin` does not exist (`ls bin`: "No such file or directory").
- README.md and utils have no hits.
- The new keys `stage_unknown`, `status_unknown` and `lead_status_unknown` have no hits, so there is no collision.

Every hit is in a file the write list names. The lines below are in those files but are not named by the brief, and the change makes each one false or incomplete (finding F1):
- `src/lib/data/shapes/vocab-keys.ts:6`, the head comment: "A word a list does not hold is answered with the list's closest word." This becomes false because of the bound.
- `src/lib/data/snapshot/validate.ts:219-221`, the doc comment of `statusFindings`: "naming the closest word of the list, or, for a list with no word, saying so". It lacks the third outcome.
- `validate.ts:316-319`, the doc comment of `checkManifestStage`: "naming the stage and the closest word of that list, or, for a list with no word, saying so". It lacks the third outcome.
- `validate.ts:215`, the `StatusSaid` comment: "the closest word if any". This stays true.
- `tests/data/snapshot/schema-rules.test.ts:10`, the head comment: "each finding naming the closest word of the list". This becomes false.
- `schema-rules.test.ts:180`, `/** The closest word the finding names, or none for no finding. */`. This depends on the new row type.
- `schema-rules.test.ts:294`, the test title `'a status outside its vocabulary names the closest word: $name'`. This is false for the new rows of cases 7 and 8. It is already false for the exact-word row and the two empty-list rows.
- `schema-rules.test.ts:224-225` (`statusSentence`) and `tests/data/sources/config/layers/hub-vocab.test.ts:77` are named by the brief.

The spec's general rule (re-read the doc comments of every touched function, and grep after changing a construct) would reach the lines in `src`. But the brief's case 13 grep is limited to `docs config` and states what it must print, so it would pass with all of these left false.

Recommendation: name these lines in item 4, or in a new item. Widen case 13's grep to `src tests docs config`. Retitle the test at `:294`.

Other places checked that stay true:
- `src/lib/data/sources/documents/feeds.ts:58-62` mentions the lead status finding but not the closest word. Command: `sed -n 60,85p feeds.ts`.
- `config/schemas/manifest-schema.yml:35` (the stage help) makes no closest-word claim.

Outside the write list: `feeds.ts:78` calls `leadStatusFindings(file, entries, vocabKeys(...), catalog)`. That file is not in the write list. The brief should say that the signature of `leadStatusFindings` stays, or add `feeds.ts`.

## 2. The step line

Step line, found with `grep -n '^- \[ \] O72' .scratch/migration/plan.md`, line 803.

| Part of the step line | Where the brief serves it |
|---|---|
| (a) the unknown-stage finding (`closestWord`, `vocab-keys.ts`) | items 1, 2 and 3 (`stage_unknown`); cases 1-4 |
| (b) a collection entry's status finding (`validate.ts`) | items 1, 2 and 3 (`status_unknown`); cases 5-7, 10, 11 |
| (c) the closest word only within half the word's length in edits, rounded down | item 1 (`distance <= Math.floor(word.length / 2)`); cases 3, 5 |
| (d) otherwise end after "is not a word of the stages list" (or of the statuses) | items 2 and 3 |
| (e) ruling 340 | cited (`plan.md:759`, `:2685`) |

No part of the line lacks a requirement.

Beyond the line, the brief adds:
- the Position Lead status finding: item 3 `lead_status_unknown`, and case 8;
- the five documentation lines (item 4);
- the tests (item 5).

On the lead finding (finding F5): the brief presents it as a "Premise correction" and says it is "the ruling's own reach". The ruling says "both findings", meaning the stage finding and the collection status finding (`plan.md:759`). The lead finding follows mechanically from putting the bound in `closestWord`. Even so, `lead_status_unknown` is a reader-visible sentence the ruling does not word, and item 3's "word for word as ruled" is true only of the stage and statuses sentences. I judge the extension right. It belongs under "Decisions taken in this brief", with the lead sentence named as derived from the pattern of the existing lead sentences, not as ruled.

## 3. Premises

Each claim was rerun:

- **`closestWord` and `distance` line numbers.** `grep -n 'export function closestWord\|^function distance'` printed 254 and 272. The functions run 254-265 and 272-279; `distance`'s doc comment is 248-253. The brief's `:251-265` starts mid-comment. Minor.
- **Callers of `closestWord`.** `grep -n closestWord validate.ts` printed `38`, `234` and `329`. Holds; the only caller is `validate.ts`.
- **What `closestWord` returns.** It returns `undefined` only for an empty list and has no bound (`sed -n 267-279 vocab-keys.ts`). Holds.
- **Line ranges in `validate.ts`.**
  - `statusFindings` begins at 223; its doc comment is 218-222. The brief says 222-237. Minor.
  - `checkEntryStatus` is 240-254. Holds.
  - `leadStatusFindings` is 261-272, and 273 is blank. The brief says 261-273. Minor.
  - The stage check: `checkManifestStage` is 321-335. The cited 326-335 is its body. Holds.
  - The `*_no_vocab` choices are at 247-249, 268-270 and 331-333. The brief says 246-249, 267-270 and 330-333. Off by one, harmless.
- **The sentences.** `findings.yml:300-305` (`sed -n '296,306p'`): all six quoted sentences are byte-equal to the brief.
- **The five documentation lines.** Read with `sed -n` at HELP.md:519, data-map.md:199, options vocab.yml:18, and catalogs vocab.yml:101 and :158. Every quoted clause holds.
- **Test line ranges.** `STATUS_ROWS` is `:184-217`; the brief says 184-216. Minor. `statusSentence` is `:220-226`; the brief says 219-226. Minor. The `hub-vocab` row is `:63-79` with `:77` the expectation. Holds.
- **Distances.** I ran a python3 Levenshtein over the lists of `config/catalogs/vocab.yml`, saved as `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/lev.py`.
  - Every distance the brief quotes holds: acepted 1/3, pased 1/2 (tied with passed), In Prep 3/3, not applied 1/5, under review 1/6, canceled 1/4, dismised 1/4, submited 1/4, scope 3/2 (tied with stopped), draft 6/2 (tied with failed), accepted as a stage 5/4, finished 4/4 (published, tied with failed), in_prep 1/3, revison 1/3, nascent with nascent removed: failed 5/3.
  - New rows: xyz has its closest word at 4 against a bound of 1; zzzz has open at 4 against 2; 42 at 4 against 1; the empty text at 4 against 0.
- **File sizes.** `wc -l`: validate.ts 529, vocab-keys.ts 311. Holds.
- **No output filter in the rules file.** `grep -n -i filter spec.md` exits 1 with no output. Holds.
- **Steps in flight.** `sed -n 26,31p orchestrator-state.md`: the dispatch block lists O72 (brief check running) and O73 "landing: preparing". Only O72.md exists among the O72-O77 briefs (`ls briefs | grep O7[2-7]`). So "no other step is in flight" holds.
  - Note: O73 (line 804, manifest_fields `from` findings) will likely add a sentence to `config/text/findings.yml`, which this step also writes. Its `/spec` must compare paths.
- **Verify list.** The state file gives `verify: - npm run test:quick` and `verify_landing: - npm run diagrams && npm run test:quick`. The brief's verify item 1 matches the spec's "diagrams right before each run". Holds.
- **Unused-exports (finding F4).** Missing from the brief. The spec requires `sh utils/unused-exports.sh` compared with "the base's, which the brief names". O70's brief names `.agents/worktrees/O70-base/unused-exports.txt` (`grep -n unused-exports briefs/O70.md`, lines 27, 147, 155). O72 names neither the base output nor the comparison, and item 1 allows a new exported function beside `closestWord`.
- **Stage rows.** Item 5's conditional ("whichever table ... reads a manifest's stage, or, when none does") is already settled. `grep -n stage schema-rules.test.ts` shows no table that reads a stage finding; stage appears only in fixture text and the chip test. `grep -rln 'stage_not_in_vocab\|is not a word of the stages list' tests` lists only `hub-vocab.test.ts`. The brief can state this instead of leaving it to the builder.
- **Write-list ranges.** The write list gives `findings.yml` as "lines 300-305", while item 3 says the new keys go "beside the others". Three inserted keys move the file's lines. The range should say "lines 300-305 and the three keys inserted among or after them".

## 4. Cases and checks

**Finding F2: case 9 and the stage outcomes.** Case 9 says the empty-list sentence holds "for a stage, a status and a lead status. G56's two empty rows". G56's two empty rows are the collection status row and the lead status row (`schema-rules.test.ts:203-216`). No stage empty-list row exists. "Cases 2, 5 to 9 are rows of the guarded tests" is therefore false for the stage part of case 9. That part has neither a row nor a run.

The stage "word named" outcome (case 1) is only a run. The spec's test rule says "one row per input that gives a different outcome" for each unit an entry's Code line names. G56's Code line names `validate.ts`, where the stage finding lives (`checkManifestStage`, `withoutValidated` turning the schema's "value outside its options"). The stage finding then has three outcomes and only one of them, "unknown", is held, incidentally, by G126's row. Leaving the other two to runs is the lazier choice. Recommendation: item 5 adds a stage table to `schema-rules.test.ts` with rows for named (`submited`), past the bound (`scope`) and empty list. That is a test of G56, not a new entry.

**Test title.** Rows 7 and 8 under the title at `:294` give a test title that states false behaviour. The brief's conventions say "A test title states the behaviour". This is part of F1.

**Changed assertion.** The line `if (row.closest) expect(found.at(0)?.message).toContain(row.closest);` (`:306`) will change with the new row type. That is an edit to an existing assertion, which the report lists under the spec. The brief does not mention it; the spec covers it.

No case asks the builder to check, quote or explain a place the step does not change. Case 12 reads the five lines item 4 changes. The cases agree with G126's text. G56's text does not describe the hint, so no change to the guarded text is needed. That is consistent with "No new guarded entry".

## 5. The question: could this pass without the goal being reached?

- **The step line's check.** The line has no separate check, so the brief's cases stand for it. Covered below.
- **Item 1, the bound in one place.**
  - Yes for a rounding error (finding F3). A `Math.ceil(len/2)` bound passes every kept row:
    - In Prep: ceil 4, distance 3, named;
    - nascent: 4, distance 5, not named;
    - xyz: 2, distance 4, not named;
    - zzzz: 2, distance 4, not named.
  - Yes for a bound computed from the JSON as shown, quoted, for a text value. Every status row passes: `"In Prep"` gives 4 and the word is named; `"xyz"` gives 2; `"zzzz"` gives 3.
  - Only case 3's run (`scope`: ceil and quoted bound 3, scoping at 3, named) catches either error, and no kept test does.
  - Recommendation: add a G56 status row exactly one past the bound with an odd length, collection status `scope`. It is 5 long with a bound of 2; scoping is at 3. It expects `status "scope" is not a word of the statuses list` and fails under ceil, under the quoted length and under `<` vs `<=` drift. It can replace `xyz` or sit beside it. `xyz` and `zzzz` (distance 4) pass under any bound below 4, so they pin little.
- **Item 2, three outcomes.** Yes for the stage path. A builder could send an empty stage list to the unknown sentence and pass everything, since there is no stage empty row and no stage empty run (F2). The status paths are held by the empty rows.
- **Item 3, the sentences.** No. Rows 7, 8 and 2 assert them, and the catalog orphan test needs a reader.
- **Item 4, the five lines.** Yes. The goal that the documents tell the truth can pass with the seven lines in F1 still false. Case 13's grep does not cover `src` or `tests`.
- **Item 5, the tests.** Yes, as above (F2, F3).
- **Case 6.** No; the rows pin the named words.
- **Cases 1, 3, 4, 10, 11.** These are runs, so they hold only for the run that is quoted. Case 3 is the only check of the denominator and the rounding (F3).
- **Case 13.** Yes; see F1.

## 6. Implied inputs

Inputs the step implies but never states, with the expected result under the brief's bound (python3 run, `lev.py` above):

- **`status:` with nothing after it in YAML, which reads as null.** This is a common hand-written form, and nothing in the brief states it. Shown `null`, length 4, bound 2; closest todo at 4. Expected `status null is not a word of the statuses list`. The lead form gives open at 4 and the Position Lead sentence. Cheap to add to case 10's run.
- **`true` and `false`.** true: todo at 3 against 2, so unknown. false: paused at 3 against 2, so unknown. Not costly.
- **An all-capitals word.** `SUBMITTED` as a status today names submitted at distance 9; under the bound (4) it gets no hint. As a stage it names nascent today (misleading) and gets nothing after the change. `DONE` and `OPEN` likewise lose their hints. The comparison is case-sensitive (`vocab-keys.ts:249-250`, "compared character by character as written"). This is the ruling's own consequence. It has not happened in the real hub: a read-only grep of `~/workspace/research-hub/.oculus/data` status values and `project.yml` stages found every value lower case and in its list. It belongs beside "finished names published" in decision 1, as a consequence the reader sees.
- **Leading or trailing whitespace.** `' submitted'` names submitted at 1 against 5. Unchanged behaviour. Whitespace-only `'  '`: bound 1, unknown sentence. No cost.
- **An empty stage text, `stage: ''`.** `strayStage` is true, the bound is 0, so `stage "" is not a word of the stages list`. Case 11 covers this path only for a status. Low cost.
- **Unicode.** `length` counts UTF-16 units and `distance` compares the same units, so the two agree. A decomposed accent adds one to both. No cost found.
- **A tie at the bound.** Case 5 covers it for statuses. For stages, decision 1 lists `finished` to published (4/4, tied with failed) but no case or row covers it. Not costly.
- **A hub's own added words.** These reach the merged `vocab.stages` (G126). Same path, so no separate case is needed.
- **Other callers.** Only `validate.ts` calls `closestWord`. `leadStatusFindings` is called from `feeds.ts:78`, outside the write list; see section 1.

## 7. ADRs

None. `ls docs/adr` gives "No such file or directory". `ls docs | grep -i -E 'adr|decision'` prints nothing. `find . -path ./node_modules -prune -o -type d -iname '*adr*' -print` prints nothing.

## 8. Dictated text

Found with `grep -n` in the brief:

- **Line 49:** `status_unknown: 'status {0} is not a word of the statuses list'`. Holds.
- **Line 50:** `stage_unknown: 'stage {0} is not a word of the stages list'`. Holds.
- **Line 51:** `lead_status_unknown: 'status {0} is not a word of the Position Lead statuses'`. Holds, and matches the pattern of the existing lead sentences at `findings.yml:304-305`. It is not word for word from the ruling (F5).
- **Line 52 (item 4):** "the finding names the closest word of the list when that word is within half the written word's length in edits". This is given as meaning, not word for word.
  - Against the spec's prose rules (plain, ASCII, no em dashes, no quips, no "not X but Y"): it holds.
  - "In edits" is shorthand a HELP.md reader may not know. This is a judgment, not a rule break. "Single-letter changes" would be plainer.
- **Line 34:** `'stage "nascent" is not a word of the stages list'`. Holds.
- **Line 57:** `stage "submited" is not a word of the stages list; the closest word is submitted`. Holds.
- **Line 63:** `status "xyz" is not a word of the statuses list`. Holds.
- **Line 64:** `status "zzzz" is not a word of the Position Lead statuses`. Holds.
- **Line 66:** `status 42 is not a word of the statuses list`. Holds.
- **Line 67:** `status "" is not a word of the statuses list`. Holds.

The brief itself is ASCII: `LC_ALL=C grep -c '[^ -~]' O72.md` printed 0.

## Declined to judge

- Whether a `vitest` one-off from a scratch folder outside the tree is picked up by `vite.config.ts`'s test include, or whether a `node --experimental-strip-types` run of `validate.ts` loads (node v24.21.0). Checking either means running code against the tree, which this read-only check does not do.
- How `sentence()` in `schema-rules.test.ts` behaves on a missing catalog key on the unchanged tree. Either way the new rows fail before the change, which is what verify item 3 expects.
- Whether the HELP.md wording "in edits" is plain enough for its readers. Flagged above as a judgment only.

## Usage

a4dd23ef439ad4f70, claude-opus-5-5, 144903 tokens, 33 tool uses, 5 min 55 s.

## Closed

- F1: item 4 now names the four code and test comment lines the bound makes false (`vocab-keys.ts:6`, `validate.ts:219-221` and `:316-319`, `schema-rules.test.ts:10`), item 5 the row type's comment `:180` and the test title `:294`, restated to say the finding names the closest word only within the bound; case 13's grep covers `src tests docs config`; "What is on the tree" says `leadStatusFindings` keeps its signature, so `feeds.ts:78` is unchanged. Every line named lies in a file the step already writes.
- F2: item 5 adds a stage table to `schema-rules.test.ts` with rows for a word named (`submited`), a word past the bound (`scope`) and an empty stages list; case 9 and the cases' closing paragraph say which rows hold what.
- F3: item 5 adds a G56 collection status row `scope` (length 5, bound 2, "scoping" at 3), expecting `status "scope" is not a word of the statuses list`, as case 7b.
- F4: "What is on the tree" names the base's `sh utils/unused-exports.sh` output, `.agents/worktrees/O72-base/unused-exports.txt`, and "Verify before you report" compares with it.
- F5: the Position Lead extension moved from "What is on the tree" to "Decisions taken in this brief" as decision 3, the lead sentence named as following the pattern of the existing lead sentences; item 3 says which sentences are ruled word for word. Dictated line held: `lead_status_unknown: 'status {0} is not a word of the Position Lead statuses'` (unchanged; ASCII, plain, no rule of `spec.md` broken).
- Section 3, minor line ranges: corrected (`distance` 248-265, `closestWord` 267-279, `statusFindings` 218-237, `leadStatusFindings` 261-272, the `*_no_vocab` choices 247-249, 268-270, 331-333, `STATUS_ROWS` 184-217, `statusSentence` 220-226); the `findings.yml` write range now includes the three inserted keys.
- Section 6, implied inputs: case 10 adds `status:` with no value (null), and case 11 adds an empty stage text; decision 1 names the all-capitals consequence (`SUBMITTED` gets no hint).
- Section 8, "in edits": item 4's meaning now reads "within half the written word's length in single-letter changes, rounded down".
