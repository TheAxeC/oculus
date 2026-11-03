# Step O132 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O132, base 95025410b)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands were run from the worktree's root. The load averages were 3.04 to 17.51 over the review (`uptime` before the runs).

```
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/hubs/connection-keys.test.ts tests/state/forms/choices.test.ts tests/data/sources/manifests/manifests.test.ts
 Test Files  6 passed (6)
      Tests  134 passed (134)

$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)

$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts --reporter=verbose   (the new describe's rows)
 <check mark> ... the vocabulary words of a hub that is not the primary > gives the findings of two tiers carrying default, each naming its settings file 217ms
 (the other ten rows <check mark>, 234 to 316 ms each)
      Tests  24 passed (24)

$ npm run diagrams   (shasum of docs/diagrams/* taken before and after, then compared)
diagrams-unchanged

$ npm run test:quick   (once, after npm run diagrams)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (3.0 s)
ok      svelte-check (10.5 s): 1793725615508 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (115.7 s): Duration  102.58s (transform 86.08s, setup 0ms, import 157.92s, tests 215.35s, environment 3ms)
ok      vitest (123.4 s): Duration  111.04s (transform 29.79s, setup 0ms, import 92.27s, tests 346.06s, environment 2.44s)
ok      vitest slow (233.2 s): Duration  220.77s (transform 20.86s, setup 0ms, import 116.58s, tests 754.94s, environment 10ms)
test:quick: 236.3 s; every command passed

$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md; echo "ascii exit $?"
ascii exit 0

$ sh utils/unused-exports.sh > <scratchpad>/o132-unused.txt; diff ../O132-base/unused-exports.txt <scratchpad>/o132-unused.txt
exit 0
diff exit 0

$ npx prettier --check src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md
All matched files use Prettier code style!

$ git diff 95025410b -- src tests docs/HELP.md | grep '^+' | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-|\bC[0-9]+\b"
exit 1   (no hit)

$ npx tsx <scratchpad>/o132/combo.mts /Users/axelfaes/workspace/oculus/.agents/worktrees/O132-base   (the report's case-run program, rebuilt from its quoted body)
count 0
$ npx tsx <scratchpad>/o132/combo.mts <worktree>
<hub file> | tiers.personal | research, personal each carry default, which one word carries at most; none of them is read for it
<hub file> | focus_clusters[0].label | the label of the Focus cluster now names nosuch.word, which the text catalog lacks; it reads as absent
<hub file> | focus_lanes[3] | the Focus lane review names the cluster parked, which no readable row of focus_clusters has; the lane is not drawn
<hub file> | focus_lanes[4] | the Focus lane blocked names the cluster parked, ...      (as above, through)
<hub file> | focus_lanes[9] | the Focus lane idea names the cluster idea, which no readable row of focus_clusters has; the lane is not drawn
count 9

$ npx vitest run tests/data/hubs/hub-portfolio.test.ts --reporter=verbose   (the report's lone run; load average about 11)
      Tests  9 failed | 7 passed (16)
   Duration  143.65s (transform 3.11s, setup 0ms, import 4.74s, tests 138.73s, environment 0ms)
   (per-test durations printed 2163 ms to 21500 ms; I did not keep this run's error lines)
$ npx vitest run tests/data/hubs/hub-portfolio.test.ts   (again; load averages 17.51 13.65 12.60 before, 13.16 after)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > finds the page of an entry of the one hub that holds it and writes that hub's file (C6)
Error: Test timed out in 5000ms.
      Tests  1 failed | 15 passed (16)
   Duration  50.55s (transform 1.87s, setup 0ms, import 3.06s, tests 47.35s, environment 0ms)

$ npx tsx <scratchpad>/o132-time.mts <tree> <worktree>/tests/fixtures/hubs/demo   (readOtherHub on a scratch hub holding the demo hub's .oculus/, 20 calls; two runs per tree, alternating, load about 15)
worktree: readOtherHub mean of 20 25.05 ms, findings 2   |   17.53 ms, findings 2
base:     readOtherHub mean of 20 21.51 ms, findings 2   |   11.30 ms, findings 2
$ npx tsx <scratchpad>/o132-time2.mts <worktree> <worktree>/tests/fixtures/hubs/demo
textCatalog + vocabFindings mean of 20 2.74 ms, findings 0
```

The test-quick slow group, as I judge it from the runs above and from the code. The change cannot make `tests/data/hubs/hub-portfolio.test.ts` hang, and it adds about 3 ms to each `readOtherHub` call.
- The demo hub that the file copies sets `leads_fit` (`tests/fixtures/hubs/demo/.oculus/config.yml:38`). That is a key of `hubKeysOf('catalogs/vocab.yml')` (`hub-names.ts:737`), so every copied second hub in that file now runs `vocabFindings`.
- That run gives no finding: the findings count is 2 in both trees.
- The added work is `textCatalog(config)`, now built for every hub, and `vocabFindings`. Both are in-memory and synchronous, with no file read (`merge/text.ts:162-164`). `vocabFindings` loops over the eight `SINGLE_USE` flags, the `focus_clusters` rows and the lanes (`vocab.ts:192-205`).
- That work measures 2.74 ms per call. The base and worktree means of `readOtherHub` differ by 3.5 to 6 ms, which is within the noise of these runs.
- The file's tests take 2 to 21 s each, 1000 times or more the added cost, and its timeouts follow the machine's load.
- In my one run of `npm run test:quick`, `vitest slow` passed under its 20000 ms timeout.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds.
  - `src/lib/data/index.ts:653-655` runs `vocabFindings(config, fileOf, catalog)` when `(hubKeysOf(VOCAB_FILE) ?? []).some((key) => named(from, key))`. That is the tree's `named` rule (`index.ts:250-253`), with no second form of it.
  - `fileOf` gives `sources` for every key (`:650`).
  - The findings follow the category check's (`:672-673`).
  - The C1 to C11 rows pass, and combo.mts gives count 0 on the base and 9 on the worktree, each finding naming `<hub file>`.
- 2: holds.
  - `OtherHub`'s doc comment (`index.ts:620-624`) names the vocabulary check beside the category check. When each check runs and which file its findings name are stated in `readOtherHub`'s comment (`:635-645`), as they were for the category check at the base.
  - The head comment of `vocab.ts:1-15` says "findings of the file the caller files each key in" and names `readOtherHub`, the condition and the hub's settings file.
  - The doc comment of `vocabFindings` (`vocab.ts:190`) says "`fileOf` gives the file a finding on a key is filed in".
  - The head comment of `vocab.test.ts:7-10` names the planted file, the hub's file for every finding (oculus's lanes included) and the in-order comparison. Its earlier sentence is Standards 1.
- 3: holds. `docs/HELP.md:593` is one line, beside the `categories` bullet. It says each finding names that file, and that for a hub other than the primary this includes a finding on one of oculus's lanes. Narrowing that clause to a hub other than the primary is right: the primary's run files such a finding under oculus's `vocab.yml` (`findings.ts:50`, unchanged).
- 4: holds.
  - One `it.each` table is at `vocab.test.ts:265-361`, with eleven rows.
  - `plantScratch` and `it` come from `tests/fixtures/scratch.ts` (`:29`), and each row reads the hub with `readOtherHub(...loadConfig(engineDir(), { hub: dir, other: 'lab' }))`.
  - Each row compares the whole list as `[file, key, message]` with `join(dir, HUB_FILE)`.
  - C1 to C3 carry the `oneWordWith` check.
  - The titles carry no case id (the grep above finds no `C<n>`).

Cases of the brief's "Cases":

- C1: met. The row 'two tiers carrying default' passes. Its failure on the unchanged tree is quoted in the report: "expected [] to deeply equal [ [ <ellipsis>(3) ] ]". Reading the base `readOtherHub` (only `categoriesFindings`) agrees.
- C2: met. The row 'two statuses carrying default_task' passes, and the report quotes its failure on the unchanged tree.
- C3: met. The row 'two stages carrying new_idea' passes, and the report quotes its failure on the unchanged tree.
- C4: met. The row 'a lane naming a cluster no row has' passes, and the report quotes its failure on the unchanged tree.
- C5: met. The row 'a lane moving onto a stage it does not list' passes, and the report quotes its failure on the unchanged tree.
- C6: met. The row 'a lane moving onto a stage the vocabulary lacks' passes, and the report quotes its failure on the unchanged tree.
- C7: met. The row passes with the label finding and then the seven `LEFT_OUT` lanes `focus_lanes[3]` to `[9]`, each under the hub's file. combo.mts reproduces the same eight after the tiers finding.
- C8: met, as an audit. The row 'a stage word the hub adds' expects `[]` and passes before and after.
- C9: met, as an audit. The row 'no key of the vocabulary' passes. Reading `index.ts:653`, `scan` is not among the 25 keys, so the check is not run.
- C10: met. The row expects `categories[7]` and then `tiers.personal`, in that order, and passes. On the unchanged tree it failed with the `tiers.personal` finding missing (quoted in the report).
- C11: met, as an audit. The row expects the merge's `focus_lanes.0` finding alone and passes.
- C12: met. The 13 rows of "the vocabulary's words past its shape" and `boards.test.ts` pass inside my six-file run (134 of 134). The report quotes their pass on the unchanged tree.

## 1. Spec

none

## 2. Proof

- `.scratch/migration/agents/reviews/O132-report.md`, first line: "Run alone afterwards (`npx vitest run tests/data/hubs/hub-portfolio.test.ts`, load average 11.50) it gave `Tests  16 passed (16)`".
  - What is wrong: my own lone runs of that command gave `Tests  9 failed | 7 passed (16)` and then `Tests  1 failed | 15 passed (16)` (`Error: Test timed out in 5000ms.`).
  - Decision resting on it: whether verify 2's red is the step's.
  - That decision holds on other evidence. My `npm run test:quick` printed "every command passed", `vitest slow` included. The timing runs above put the step's added cost at about 3 ms per `readOtherHub` call, and the code adds no file read and no wait.
  - The report's first line ("NOT done: verify 2's last run ... did not print 'every command passed'") was true of the builder's run. It is not true of the tree: my run of the list passes.
  - Failure scenario: a landing that reruns that file alone under the 5000 ms default on a loaded machine sees red and could take it for the step's. The file's tests take 2 to 21 s alone at load 11 to 17 on both trees' code paths.
  - Verdict: none.

## 3. Standards

- `tests/data/shapes/catalog-files/vocab.test.ts:5-6`: "Each finding names the file the value was read from, the hub's when the hub's value gives it, and the one-word readers give no word for a flag two words carry."
  - What is wrong: the rules file ("What every package obeys", the rule that a sentence in a head comment that the change makes false is a defect) applies. The sentence is stated of every finding in the file, but the new describe's C7 row files seven findings on lanes read from oculus's `vocab.yml` under the hub's file.
  - Lines 7-10 add the exception, attached to the next sentence ("save in the describe of a hub that is not the primary ..."). The general sentence stays unqualified, so the comment states both rules for the same findings.
  - The brief check's finding (d) named lines 5-6 for this reason.
  - Fix at landing: qualify the sentence to the first describe, such as "In the first describe, each finding names the file the value was read from, ...".
  - Failure scenario: a reader of the head comment expects a C7 lane finding to name oculus's `vocab.yml`. Reading the row's expected hub file as a mistake, they "correct" the expectation.
  - Verdict: none (item 2's requested content is present).

## 4. Behaviour

none. The report states the one visible change, the Findings view for a second hub holding the texts of C1 and C7: 0 rows before and 9 after, each naming that hub's `.oculus/config.yml`. combo.mts reproduces it. The counts on the tab, the rail and the status bar are left to the look on landing, as the rules file says a builder runs no page. `payload.ts:88-90` is the one path by which an other hub's findings reach the page (`...others.flatMap((one) => one.findings)`).

The builder's three decisions:
- `named(from, 'categories')` in place of `fromHubFile(from.categories)` (`index.ts:652`) holds. `named` is `from[key] !== undefined && fromHubFile(from[key])` (`index.ts:250-253`), and `fromHubFile` is `file === HUB_FILE` (`hub-names.ts:800-802`). The result is the same for every `from`, and both checks now use one form of the rule, as item 1 asks. `boards.test.ts` passes after the change.
- The doc comment of `flagFindings` (`vocab.ts:56-58`, "filed under the key of the second word") holds. The old "filed in the file of the second word" is false for `readOtherHub`, whose `fileOf` gives the hub's file whatever file the second word came from. The new wording is true for both callers: `note(`${key}.${words[1]}`, ...)` at `vocab.ts:64`.
  - The rules file requires fixing a sentence the change makes false, and the file is in the write list. The report names the line as outside the brief's ranges, with its reason, as the rules file's "Where you work" asks.
  - The head comment growing to line 15, one past the named 1-14, is the same kind of change.
- The local constant `VOCAB_FILE` (`index.ts:632-633`) holds. No exported constant for `'catalogs/vocab.yml'` exists to reuse. `grep -rn "'catalogs/vocab.yml'\|VOCAB_FILE" src` shows the same local constant in `src/lib/data/snapshot/references/build.ts:72` and literals in `state/system/config/groups.ts:48,210` and `shapes/catalog-files.ts:33`. A literal file name is not a rule under the rules file's reuse principle, so one more local constant is no finding.
  - Its doc comment, "The config file of the engine whose keys the vocabulary check reads the words of", is looser than the use: the constant selects the hub-list keys that switch the check on, most of which `vocabFindings` does not read. A wording such as "the engine file whose keys, set in a hub's file, switch the vocabulary check on" would be exact. That is a judgment and is not filed as a finding.

## Declined to judge

- Whether `tests/data/hubs/hub-portfolio.test.ts` ran inside my `npm run test:quick`. My `tail -40` cut the runner's selection lines, and the runner has no listing mode (`tests/tiers/quick.mjs:220-234`). The builder's report shows the file in the `vitest slow` group for the same changed files, so I take it to have run inside my passing group, but that is not verified.
- My base-tree timing run resolved `engineDir()` to the main checkout (`engine /Users/axelfaes/workspace/oculus`), not the base copy. The base code was timed over main's engine config; the timing is a comparison of the code paths, not of the configs.
- G13's text, Code and Test lines are extended by the orchestrator at landing (brief, "What is on the tree"). They are not part of this diff and were not judged.
- The cases' failures on the unchanged tree were not rerun: the rules file asks for no further run on the unchanged tree, and I judged them from the report's quotes and from reading the base `readOtherHub`.
- Whether the staged tree matches the worktree. That would need `git diff --cached`, a git command outside the three this review may run.

Reviewer usage: a3d8deb001529c2b6, claude-opus-5-5, 180985 tokens, 52 tool uses, 14 min 58 s.
