# Step O62 brief check (on main at cee3e8f4)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O62.md`. The brief was read in full, as were `spec.md` and `guarded.md` (head, G12, G13, G24 and the "Held under" line), the plan's step line and the four Rulings lines the step's tags name. `plan.md` has no section headed Goal. Its top paragraph says only "Execution ledger for `tools/oculus/DESIGN.md`", so the goal used below is the one the dispatch gave: the unread key is gone from the file, from its shape and from its test row.

Summary: 9 findings, 8 inside the step's line and 1 that widens the step. The main ones:
- C3's claim about a hub's `.oculus/config.yml` is wrong. The same claim appears in the Report section's before-and-after line.
- Verify 3 asks the builder to run a git command, which `spec.md` forbids.
- Verify 8 says "adds no test", but the step changes a test, and `spec.md` asks for that test's failing line on the unchanged tree.
- Most cases and the Verify items do not name where they come from.

## 1. Names

- The key `archive_order`, the shape key `archive_order` of `vocabFileShape`, and the test row `'archive_order',` all fall under one grep. The command and its output:
  `git grep -n -i 'archive_order\|archiveOrder\|archive order' -- ':!config/local.yml' ':!.scratch'`
  ```
  config/catalogs/vocab.yml:208:archive_order: [published, submitted, in-prep, abandoned, nogo, dropped, disproved, tech-report, software, finished, archived]
  src/lib/data/shapes/catalog-files/vocab.ts:286:    archive_order: z
  tests/checks/config/config-folder.test.ts:220:            'archive_order',
  exit 0
  ```
  All three hits are inside "Paths this step writes".
- Untracked files: `grep -rIln --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.scratch --exclude-dir=.agents -i 'archive_order\|archiveOrder' .` prints the same three files. `ls docs/figures` prints "No such file or directory", so the `gen_figures.py` reader that the O38 records name is gone.
- The hub: `grep -rln --exclude=local.yml 'archive_order' ~/workspace/research-hub/.oculus` prints nothing (exit 1). The camel-case and spaced forms also print nothing (exit 1).
- The ledger: `git grep -n -i '...' -- '.scratch'` prints these hits:
  - `plan.md:681` and `plan.md:2421`
  - `queue.md:6`
  - `orchestrator-state.md:384`
  - `agents/briefs/O38.md:237` and `agents/briefs/O38-round1.md:34`
  - `agents/reviews/O38-refuter.md:322,340` and `agents/reviews/O38-report.md:120,948,1355`
  - `agents/reviews/O59-brief-check.md:183`

  These are ledger records of the step or of past steps. The change makes none of them false.
- `vocabFileShape` and `VOCAB_FILE_KEYS` keep their names. `git grep -n 'VOCAB_FILE_KEYS\|vocabFileShape'` finds these readers, none of which name the key:
  - `catalog-files.ts:22,33`
  - `snapshot/schema/run.ts:21,228`
  - `snapshot/schema/static.ts:14,52`
  - the import tooltip in `docs/diagrams/writes.dot:588` and `writes.svg:2239`
- Prose describing the key: `git grep -n -i 'archive groups\|order the archive\|archive.s outcome\|outcome categor' -- ':!config/local.yml' ':!.scratch'` prints only `vocab.yml:207` and `vocab.ts:289`, both of which the step removes.

Findings: none.

## 2. The step line

- "`archive_order` is removed from `config/catalogs/vocab.yml`": item 1.
- "with its shape (`data/shapes/catalog-files/vocab.ts:286`)": item 2.
- "and its config-folder test row": item 3.
- "no code reads it": this is the reason for the step, not a requirement. It is backed by the premise "No code reads the key" and checked by C1.
- "(defect, plan.md Rulings line archive_order)": quoted under "What is on the tree". No requirement is needed.
- "(ruling O49 to O63 by agents)" and "(ruling Parallel order)": these set how and when the step is built, not what it builds. No requirement is needed.

Items that do not name where they come from (Axel's words, a ruling by its name, or the step's line):
- "What to build" items 1 to 3 each name the step line.
- C1, C2, C4 and C5 name no source.
- C3 names only a rule of `spec.md` ("no migration code"), which is none of the three allowed sources.
- Decision 1 names the step line.
- Verify 1 to 8 name no source. Verify 4 names `spec.md`'s ASCII gate, a rule rather than one of the three sources.

Findings:
- C1, C2, C3, C4, C5 and Verify 1 to 8 do not name where they come from. Each comes from the step's line (the removal and its test row) or from a rule of `spec.md`, and the brief should say which. Inside the step's line.

## 3. Premises

- The step line and the Rulings line archive_order.
  - `grep -n '^- O62 ' plan.md` prints line 681, exactly as the brief quotes it.
  - `plan.md:2421` reads "archive_order (2026-10-22), a defect, no ruling needed: `archive_order` in `config/catalogs/vocab.yml` is read by no code, only by its shape and a test row; step O62."
  - Matches.
- "Three lines and no more": the grep in section 1 prints exactly three lines. Matches.
- `vocab.yml:207-210` and its neighbours: `sed -n '202,212{=;l;}' config/catalogs/vocab.yml` prints:
  - 202 blank
  - 203 the `focus_lane_tones` comment
  - 204 `focus_lane_tones: { funding: gold, jobs: grey-d, teaching: teal }`
  - 205 and 206 blank
  - 207 the comment
  - 208 the key
  - 209 and 210 blank
  - 211 the `tiers:` comment

  Removing lines 207-210 leaves 204, blank, blank, the `tiers:` comment. Matches.
- "The file puts two blank lines between its blocks": does not hold for the whole file. `awk '{b[NR]=($0=="")} END{for(i=2;i<NR;i++) if(b[i] && !b[i-1] && !b[i+1]) print "single blank at", i}' config/catalogs/vocab.yml` prints:
  ```
  single blank at 49
  single blank at 185
  single blank at 202
  single blank at 262
  ```
  Line 202 is the single blank between the `fund_stages` block and the `focus_lane_tones` comment. The result the brief asks for at 204-211 is still right.
- `vocab.ts:286-289`: `sed -n '225,321p'` shows lines 286-289 as `archive_order: z .array(text) .optional() .describe('The outcome categories of the Archive, in the order it groups them.'),`. It also shows `z.strictObject` at 229 and `VOCAB_FILE_KEYS` at 321. Matches.
  - `text` stays used after the removal (`grep -n '\btext\b' vocab.ts`: lines 7, 11-17, 35-36, 152, and `venue_categories` at 305), so no import goes and Decision-free item 2 is clean.
- `catalog-files.ts:11-12`: reads "A shape is strict: a key the file's reader does not name is refused." Matches.
- `VOCAB_FILE_KEYS` readers at `run.ts:228` and `static.ts:52`: confirmed by `sed`. Matches.
- No schema field draws from the key: `git grep -n archive_order -- config` prints only `vocab.yml:208`. Matches.
- `config-folder.test.ts` line numbers: `grep -n "words a part of\|holds exactly the expected\|Object.entries(EXPECTED)\|EXPECTED"` prints:
  ```
  126:    const EXPECTED: Record<string, string[]> = {
  346:    ])('words a part of %s its shape refuses', (name, text, key, message) => {
  357:    it('holds exactly the expected top-level keys, and no more', () => {
  360:            ...new Set([...Object.values(EXPECTED).flat(), ...OPTION_KEYS, 'text'])
  795:        for (const [name, keys] of Object.entries(EXPECTED)) {
  808:        expect(tracked(dir)).toEqual([...Object.keys(EXPECTED), ...OPTION_FILES].sort());
  ```
  The row is at 220 and the `stray` row reads "key stray is not a key this file takes". Matches.
- `guarded.md:356`: "Held under the entries above: ... `tests/checks/config/config-folder.test.ts` and `tests/checks/config/config.test.ts` (G12, G13) ...". Matches.
- No ADR folder and no glossary: `ls docs/adr` and `ls docs/glossary.md` both print "No such file or directory". Matches.
- The base copy and its `unused-exports.txt` are made at preparation. `ls .agents/worktrees` prints only `migration-O59` and `migration-O59-base`. This is consistent with the brief, which says the copy is made at preparation. `utils/unused-exports.sh` exists.
- `package.json` has `format`, `diagrams` and `test:quick`. Matches.

Findings:
- The premise "the file puts two blank lines between its blocks" is false for the file as a whole (single blanks at 49, 185, 202 and 262). It holds around this block, so the result of item 1 is unaffected. Inside the step's line.

## 4. Cases and checks

- C1: consistent with `spec.md`, "What every package obeys" (the paragraph on changing a name: grep it across `src`, `tests`, `config`, `docs` and `README.md`).
- C2: consistent with `spec.md`, "What every package obeys" (the test rule; this is the existing test of G12 and G13) and with "Token discipline".
- C3, the shipped `vocab.yml`: consistent.
  - `readConfigFile` (`merge/text.ts:71`) runs `shapeIssues`.
  - `shapeIssues` (`shape-issues.ts:37-41`) turns `unrecognized_keys` into kind `unknown` unless `owned`, and `owned` is `under()` for vocab (`catalog-files.ts:33`).
  - `issueText` words it with `findings.config.shape_unknown`, which `config/text/findings.yml:135` defines as `'key {0} is not a key this file takes'`.
- C3, a hub's `.oculus/config.yml`: false. `mergeHub` (`merge/hub-layer.ts:52-71`) gives any key outside `HUB_LIST` the finding `findings.config.hub_key_unknown`, and `HUB_LIST` (`hub-names.ts:329-354`) does not hold `archive_order`. `config/text/findings.yml:120` defines that sentence as `"key {0} is not one the hub's settings file takes; it is not applied"`. A hub file that sets `archive_order` gives this sentence on the unchanged tree and after the change, never the sentence C3 states. The Report section repeats the error at brief line 110 (`grep -n 'is not a key this file takes' O62.md` prints 18, 37 and 110): "a `vocab.yml` or a hub's `.oculus/config.yml` that sets `archive_order` gave no finding and now gives ...".
- C4: consistent. The editor's schema is built from the same shape: `sources/config/catalog/schemas/engine.ts:110` takes `CATALOG_FILES.find(...).shape`.
- C5: consistent.
- Verify 3, `git status --short docs/diagrams`, is a git command. `spec.md`, "Where you work", says the builder "never run[s] a git command, read-only ones included". The base copy holds only `src tests utils config`, so `docs/diagrams` cannot be compared against it with `diff -rq` either.
- Verify 8, "This step adds no test, and the report says so in one line", is inconsistent with `spec.md`, "What every package obeys": "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree. A step that adds or changes no test says so in one line." The step changes a test, because the `EXPECTED` row it removes feeds 'holds exactly the expected top-level keys, and no more' (357-363) and 'reads each file on its own and finds its own keys there and nowhere else' (the loop at 795). Verify 7 lists the edit, but nothing asks for the failing line.
- C3 asks the builder to read places the step does not change:
  - the strictness of `vocabFileShape` at `vocab.ts:229`, outside the range 286-289;
  - the case at `config-folder.test.ts:346-355`, outside the range 220-220;
  - through its hub clause, the hub layer `merge/hub-layer.ts`, which is in no write path.
- Outside the brief, but against `spec.md`: `spec.md`, "The principles every package is judged on", says "every catalog key has a reader in the tree (a test fails on an orphan key)". The G24 test `tests/checks/source/keys.test.ts` covers only the text keys: its catalog check is `describe('text keys')` with 'has a reader for every catalog key' at 552-565. The check never failed on the unread `archive_order`, and `git grep -ln vocab -- tests` does not list `keys.test.ts`.

Findings:
- C3's hub clause is false. Expected: "key archive_order is not one the hub's settings file takes; it is not applied", unchanged by the step. The same error is in the Report section's before-and-after line (brief line 110). Inside the step's line.
- Verify 3 is a git command the builder may not run. Inside the step's line.
- Verify 8 contradicts `spec.md`'s rule on a changed test: the builder must quote the failing line of the changed test on the unchanged tree. Inside the step's line.
- C3 asks the builder to read places the step does not change: `vocab.ts:229`, `config-folder.test.ts:346-355` and, through its hub clause, `merge/hub-layer.ts`. Inside the step's line.
- No orphan-key test covers `vocab.yml`'s top-level keys, although `spec.md` says one exists. Widens the step.

## 5. The question

- C1: no, it could not pass without the goal. It prints nothing only once all three mentions are gone. Taken alone, a rename of the key would also pass it, but items 1 to 3 ("Nothing else in the file changes") and the reviewer's diff rule that out.
- C2: yes. It passes on the unchanged tree, because the row and the key are present together. It shows that the row and the file moved together, not that the key is gone; C1 carries the removal. Not a defect of the brief.
- C3, the shipped `vocab.yml`: no. The reading shows the unknown-key finding only once the shape lacks the key.
- C3, a hub's `.oculus/config.yml`: yes. A hub file gives its unknown-key finding on the unchanged tree, so even a correctly worded hub clause passes with no change at all.
- C4: no. Reading `vocab.ts` after the change shows the key absent only once item 2 is done.
- C5: no. On the unchanged tree, `sed -n '200,210p'` shows the archive comment after the two blank lines, not the `tiers:` comment.
- The check on the step's line (C1 with the premise's grep): no, for the same reason as C1.
- Item 1 (checked by C1, C2 and C5): no.
- Item 2 (checked by C1 and C4): no.
- Item 3 (checked by C1 and C2): no. With the row gone and the key left in the file, 'holds exactly the expected top-level keys' fails.

Findings:
- C3's hub half passes without the goal being reached, since its result is the same before and after. It belongs among the inputs whose result does not change, not among the effects of the step. Inside the step's line.

## 6. Implied inputs

- A shipped `config/catalogs/vocab.yml` that still holds `archive_order`: listed (C3). Expected: "key archive_order is not a key this file takes".
- A hub's `.oculus/config.yml` that sets `archive_order`: listed (C3), with the wrong expected result. Expected: "key archive_order is not one the hub's settings file takes; it is not applied", unchanged by the step (see section 4).
- A schema field `from: vocab.archive_order`, in a schema of oculus's config or of a hub: missing.
  - The key enters `VOCAB_FILE_KEYS` (`vocab.ts:321`), which `run.ts:228` and `static.ts:52` use to decide which `vocab.<key>` lists a field may draw from. Today such a field resolves to a list; after item 2 it names no list.
  - It has not happened: `git grep -n archive_order -- config` prints only `vocab.yml:208`, and the hub grep prints nothing.
  - Its wrong answer would cost something: a hub field could silently lose its options.
  - Expected after the change: `schemaFileProblems` (`static.ts:48-53`) answers `undefined` for the source, so the field is a schema problem naming the unknown list, and no list is offered.
  - A reading case after item 2 covers it.
- The workspace file's `settings:` layer: not an input. `merge/workspace-layer.ts:6-11` takes only options of defaults files, never a catalog key.
- The editor's schema: listed (C4).

Findings:
- The implied input `from: vocab.archive_order` is missing from "Cases". Expected result: the field names no list and gets the schema finding for an unknown source. It has not happened, so it costs nothing today. Inside the step's line (an effect of item 2 through `VOCAB_FILE_KEYS`).

## 7. ADRs

- `ls docs/adr` prints "ls: docs/adr: No such file or directory". The configuration block has no `adr` key (`grep -n 'standards\|adr' orchestrator-state.md` prints only `11:standards: [.scratch/migration/agents/spec.md]` and an unrelated line 196). There is no record.

Findings: none.

## 8. Dictated text

The brief dictates no text for a file the step writes: items 1 to 3 only remove lines. The dictated words are in the report it asks for:
- "Everything in the brief is done" (`grep -n 'Everything in the brief is done' O62.md`, line 103): holds. It is `spec.md`'s own wording in "Report".
- "still true" or "rewritten" (`grep -n 'still true' O62.md`, line 108): holds. These are `spec.md`'s markers in "What every package obeys".
- "key archive_order is not a key this file takes" (`grep -n 'is not a key this file takes' O62.md`, lines 18, 37 and 110): the wording matches `config/text/findings.yml:135` for a shipped file. At lines 37 and 110 it is also stated for a hub's `.oculus/config.yml`, which is a false claim about behaviour. That breaks `spec.md`, "The working rules that bind every package": "Every claim about behaviour, cost or timing names the command that produced it, or says 'not verified'".
- `LC_ALL=C grep -n '[^ -~]' O62.md` prints nothing (exit 1), so the brief is ASCII.

Findings:
- Lines 37 and 110 dictate the shipped-file sentence for a hub's `.oculus/config.yml` as well. That claim is false (see section 4). Inside the step's line.

## Declined to judge

- How O62's write ranges merge with O59's in flight is the session's comparison under `spec`. O59 writes `vocab.yml` lines 76-167 and `vocab.ts` lines 42-53; O62 writes `vocab.yml` lines 207-210 and `vocab.ts` lines 286-289. The ranges are disjoint as written. O62's numbers are "as on main at the base", and whether they hold after O59 lands first is not judged here.
- Verify 2's `npm run format` is `prettier --write .` over the whole tree (`package.json:21`). Whether that touches any file outside the write list depends on the tree being formatted at the base, which was not run, since this check changes nothing.
- The plan has no Goal section to read the step's goal from; the goal stated in the dispatch was used.

Agent usage: a05874f9b03fbf13d, claude-opus-5-5, 158684 tokens, 43 tool uses, 5 min 57 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Each finding inside the step's line is closed by a change to `agents/briefs/O62.md`; the one finding that widens the step is open item 224 (ruling Brief check scope).

1. The step line, C1 to C5 and Verify 1 to 8 naming no source: each case and each Verify item now opens with its source in parentheses, the step's line, the premise it rests on or the section of `spec.md`.
2. Premises, "the file puts two blank lines between its blocks": the premise now says so of the blocks around this one and names the single blank lines at 49, 185, 202 and 262 with the `awk` that finds them, left as they are.
3. Cases and checks, C3's hub clause: removed from C3; C3 is now the shipped `config/catalogs/vocab.yml` alone, its sentence sourced to `config/text/findings.yml:135`.
4. Cases and checks, Verify 3 a git command: replaced by a copy of `docs/diagrams` to the builder's scratch folder before `npm run diagrams` and `diff -rq` after.
5. Cases and checks, Verify 8 against `spec.md`'s rule on a changed test: "Cases" now has the builder remove the test row alone first, run `config-folder.test.ts` and quote its failing line, then make items 1 and 2; Verify 8 asks the report for that line.
6. Cases and checks, C3 asking the builder to read places the step does not change: C3 is checked by reading `vocab.ts` after the change alone; the strictness is a premise of the brief.
7. The question, C3's hub half passing without the goal: closed with finding 3; the hub's sentence is stated in the report's before and after as unchanged.
8. Implied inputs, a schema field `from: vocab.archive_order`: not added. It has not happened (`git grep -n archive_order -- config` prints only `vocab.yml:208`; the hub grep prints nothing), and after the change such a field gets the schema problem for an unknown list, which is the right result, so no wrong answer costs anything; checking it would also ask the builder to read `static.ts`, which the step does not change.
9. Dictated text, lines 37 and 110 on a hub's `.oculus/config.yml`: closed with finding 3; the report's before and after now gives the hub's sentence as unchanged.
10. Cases and checks, no orphan-key test over `vocab.yml`'s top-level keys although `spec.md` says one exists (widens the step): open item 224 in `orchestrator-state.md`. The brief is unchanged for it.
