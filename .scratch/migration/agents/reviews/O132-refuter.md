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

## Repair round 1, refuted

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O132`. The load average from `uptime` is given beside each run.

```
$ uptime   (18:37)
load averages: 4.56 7.15 9.85
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/boards.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/hubs/connection-keys.test.ts tests/state/forms/choices.test.ts tests/data/sources/manifests/manifests.test.ts
 Test Files  6 passed (6)
      Tests  134 passed (134)
   Duration  10.75s (transform 4.19s, setup 0ms, import 11.45s, tests 24.48s, environment 1ms)
$ npx vitest run tests/checks/tree/boundaries.test.ts   (load 6.90 7.54 9.94)
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ npx vitest run tests/data/shapes/catalog-files/vocab.test.ts --reporter=verbose   (the new describe)
 <check mark> ... the vocabulary words of a hub that is not the primary > gives the findings of two tiers carrying default, each naming its settings file 225ms
 (the other ten rows <check mark>, 213 to 243 ms each)
      Tests  24 passed (24)
$ npm run diagrams   (shasum of docs/diagrams/* before and after, compared with cmp)
diagrams exit 0
diagrams-unchanged
$ npm run test:quick -- --base 95025410b   (once; uptime before 5.71 7.03 9.53, after 12.30 11.61 11.04)
test:quick: 11 changed file(s), from git since 95025410b
test:quick: 100 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.4 s)
ok      eslint (3.9 s)
ok      svelte-check (15.1 s): 1793727538574 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (157.9 s): Duration  137.55s (transform 110.50s, setup 0ms, import 221.37s, tests 296.68s, environment 4ms)
FAILED  vitest (165.1 s)
 FAIL  |unit| tests/routes/git/zenodo.test.ts > the review copy For review sends > refuses a PDF whose deflated stream holds a term, naming it
 FAIL  |unit| tests/data/sources/manifests/manifests.test.ts > a hub reports only the files its own configuration names > reads a registry from the collections entry that names it and leaves the others unnamed
 FAIL  |unit| tests/data/sources/config/layers/hub-vocab.test.ts > the vocabulary a hub lays over oculus's > words a row of 'fund_stages' of the wrong kind and a second row naming one key, oculus's list standing
   (each: Error: Test timed out in 5000ms.)
      Tests  3 failed | 895 passed | 500 skipped (1398)
FAILED  vitest slow (276.6 s)
 FAIL  |unit| tests/routes/git/credentials.test.ts > the gits the clone route starts > carry the pairs for a clone of a repository with 'a signed-in host whose sign_in row na<ellipsis>' (G135)
 FAIL  |unit| tests/routes/hubs/hub-writes.test.ts > a write to a record of the second hub > 'a Lit Watch deletion' changes the second hub only, is logged by path and is undone
 FAIL  |unit| tests/data/hubs/self.test.ts > the user the key self names > marks nobody for a key no hub holds, with exactly one finding on the file at self (case 5)
 FAIL  |unit| tests/server/edit/config-value.test.ts > a hub's word written into the hub's settings file > deletes the row of a word the hub added once the reader removes it
   (each: Error: Test timed out in 20000ms.)
      Tests  4 failed | 496 passed | 165 skipped (665)
test:quick: 280.3 s; failed: vitest, vitest slow
Each red file alone (npx vitest run <file>), none of them changed by the step:
  tests/data/sources/manifests/manifests.test.ts       load 10.88 11.33 10.95   Tests  36 passed (36)
  tests/data/sources/config/layers/hub-vocab.test.ts   load 9.98 11.12 10.88    Tests  31 passed (31)
  tests/data/hubs/self.test.ts                         load 9.19 10.85 10.79    Tests  17 passed (17)
  tests/server/edit/config-value.test.ts               load 7.57 10.27 10.58    Tests  23 passed (23)
  tests/routes/git/zenodo.test.ts                      load 6.32 9.62 10.33     Tests  51 passed (51)   Duration  26.58s
  tests/routes/git/credentials.test.ts                 load 5.39 9.03 10.08     Tests  8 passed (8)     Duration  15.99s
  tests/routes/hubs/hub-writes.test.ts                 load 6.12 8.97 10.04     Tests  47 passed (47)   Duration  47.38s
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md; echo "ascii exit $?"
ascii exit 0
$ sh utils/unused-exports.sh > <scratchpad>/o132-unused-r1.txt; echo "unused exit $?"; diff ../O132-base/unused-exports.txt <scratchpad>/o132-unused-r1.txt; echo "diff exit $?"
unused exit 0
diff exit 0

The round report's quoted evidence, rerun:
$ npx prettier --check src/lib/data/index.ts tests/data/shapes/catalog-files/vocab.test.ts src/lib/data/sources/config/sections/vocab.ts docs/HELP.md
All matched files use Prettier code style!
$ git diff 95025410b -U0 -- src tests docs/HELP.md | grep '^+' | grep -nE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"; echo "history grep exit $?"
history grep exit 1
   (I ran it as `git diff <base>`; the report's `git diff -U0` with no base is a git form outside the three this review may run.)
$ awk 'NR<=11{print length}' tests/data/shapes/catalog-files/vocab.test.ts
96 100 99 100 96 100 98 99 99 96 33
$ awk 'NR==632{print length}' src/lib/data/index.ts
96
$ wc -l src/lib/data/index.ts src/lib/data/sources/config/sections/vocab.ts tests/data/shapes/catalog-files/vocab.test.ts docs/HELP.md   (base copy: 847 202 226 618)
     861 src/lib/data/index.ts
     205 src/lib/data/sources/config/sections/vocab.ts
     363 tests/data/shapes/catalog-files/vocab.test.ts
     619 docs/HELP.md
The report's lone runs, each alone (npx vitest run <file>):
  tests/state/sources/clone-after.test.ts   load 4.76 8.07 9.63   Tests  11 passed (11)   Duration  7.84s
  tests/routes/docs/primary-key.test.ts     load 5.29 8.09 9.61   Tests  7 passed (7)     Duration  4.73s
  tests/routes/git/zenodo.test.ts           (above)               Tests  51 passed (51)
  tests/data/hubs/hub-portfolio.test.ts     load 5.50 8.03 9.58   Tests  16 passed (16)   Duration  42.56s
  tests/server/edit/config-key.test.ts      load 5.28 7.62 9.34   Tests  36 passed (36)   Duration  22.27s
$ npx tsx <scratchpad>/o132/combo.mts <worktree>   (the report's case-run program, rebuilt from its quoted body, removed after)
<hub file> | tiers.personal | research, personal each carry default, <ellipsis>
<hub file> | focus_clusters[0].label | the label of the Focus cluster now names nosuch.word, <ellipsis>
<hub file> | focus_lanes[3] <ellipsis> through focus_lanes[9]
count 9
$ npx tsx <scratchpad>/o132/combo.mts ../O132-base
count 0
```

The round's delta, from `diff -u` of each path in `files.txt` against the worktree:
- Five of the eight listed paths (`docs/HELP.md`, `vocab.ts` and the four diagram files) are identical to the snapshot.
- `src/lib/data/index.ts`: one hunk, the doc comment of `VOCAB_FILE` at line 632.
- `tests/data/shapes/catalog-files/vocab.test.ts`: one hunk, head-comment lines 5-11.
- `git status --short` shows no changed path outside `files.txt` besides the three `.scratch/` ledger files.

My one run of `npm run test:quick` was red: seven timeouts in seven files the step does not change, at load 5.71 before and 12.30 after. Each of the seven files passes alone (above). Under the rules file's "Verify before you report", such a failure is not counted as a finding. `manifests.test.ts` imports `readOtherHub`, and it passes alone and inside the six-file run. The first refuter's run of the list passed. Verify 2 is therefore red on the builder's last run and on mine, and the report's first line and its verify 2 row say NOT DONE, which matches.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds.
  - `index.ts:653-655` runs `vocabFindings(config, fileOf, catalog)` when `(hubKeysOf(VOCAB_FILE) ?? []).some((key) => named(from, key))`.
  - `fileOf` is `() => sources` (`:650`).
  - `...words` comes after `...categories` (`:672-673`).
  - The eleven rows pass, and combo.mts gives count 0 on the base and 9 on the worktree, each finding naming the hub's file.
- 2: holds.
  - The doc comments of `OtherHub` (`index.ts:619-625`) and `readOtherHub` (`:635-645`) name the vocabulary check, when it runs and the file it names.
  - `vocab.ts` has its head comment at `:1-15` and the `vocabFindings` doc comment at `:190`.
  - The head comment of `vocab.test.ts:1-11` is now qualified per describe (round item 1).
- 3: holds. `docs/HELP.md:593` is one line beside the `categories` bullet and is unchanged in the round.
- 4: holds.
  - One `it.each` table of eleven rows, `vocab.test.ts:349-363`, with its rows at `:266-347`.
  - `it` and `plantScratch` come from `tests/fixtures/scratch.ts` (`:30`).
  - Each row compares the whole list as `[file, key, message]` against `join(dir, HUB_FILE)`.
  - C1 to C3 check `oneWordWith`, and no title carries a case id.

Cases:

- C1: met. The row passes (my verbose run). The report quotes its failure on the unchanged tree.
- C2: met, as C1.
- C3: met, as C1.
- C4: met, as C1.
- C5: met, as C1.
- C6: met, as C1.
- C7: met. The row passes with the label finding and `LEFT_OUT` `focus_lanes[3]` to `[9]` under the hub's file. combo.mts reproduces the same eight after the tiers finding.
- C8: met, as an audit. The row expects `[]` and passes.
- C9: met, as an audit. The row passes, and reading `index.ts:653` shows that `scan` is not a key of `hubKeysOf('catalogs/vocab.yml')`.
- C10: met. The row expects `categories[7]` and then `tiers.personal`, and passes. The report quotes its failure on the unchanged tree.
- C11: met, as an audit. The row expects the merge's `focus_lanes.0` finding alone and passes.
- C12: met. The rows of "the vocabulary's words past its shape" and `boards.test.ts` pass inside my six-file run (134 of 134).

Items of the round's brief:

- Round 1 (Standards 1): holds.
  - `vocab.test.ts:5-7` now opens "In the describe of the primary hub, each finding names the file the value was read from, ...". The sentence after it keeps the rule for the other describe: "every finding of such a hub names its settings file, one on a lane of oculus's ... included".
  - The file has exactly two describes (`:64`, `:349`), so each describe gets one rule and the comment is true of every row.
  - The paragraph is rewrapped at 100 columns or fewer (awk widths above, last line 33).
  - The rewrap also changed "names its `.oculus/config.yml`" to "names its settings file". This is inside the same sentence and matches the describe's title ("each naming its settings file"). The tree uses the term for that file throughout: `grep -rn "hub's settings file\|its settings file" src tests docs` gives 118 lines outside the diagrams. So it is no fix beyond the finding.
- Round 2 (the doc comment of `VOCAB_FILE`): holds.
  - `index.ts:632` reads "The engine file whose keys, set in a hub's settings file, switch the vocabulary check on." It is one line of 96 columns.
  - This is true of `hubKeysOf(VOCAB_FILE)` as used at `:653`. `hubKeysOf` returns the `HUB_LIST` keys whose `file` is that name (`hub-names.ts:789-792`), and `named` holds them when the hub's file sets them (`index.ts:250-254`).
- Round 3 (Proof 1, the report): violated on one count, Finding R1. The rest holds.
  - The first line and the verify 2 row are rewritten, and no row whose last run was red is marked DONE.
  - The reviewer's runs are quoted.
  - The builder's lone `Tests  16 passed (16)` run is now quoted with its output (verify 2 row: `18:02`, `load averages: 11.50 15.39 13.87`, `Duration  42.26s`), and my lone run reproduces it (`Tests  16 passed (16)` at load 5.50).
  - The round's `test:quick` lines are quoted, with each red test, its run alone and the load average. Every lone result I reran reproduces: clone-after 11, primary-key 7, zenodo 51, hub-portfolio 16 and config-key 36, all passing.

### Findings

- R1, Proof. `.scratch/migration/agents/reviews/O132-report.md`, the DONE / NOT DONE row "Verify 2": "twelve timeouts in five files the step does not change".
  - What is wrong: round item 3 asked for this row to say what the runs show. The round's own table lists thirteen red tests:
    - clone-after: 1
    - primary-key: 2
    - zenodo: 4
    - hub-portfolio: 5
    - config-key: 1
  - That matches the quoted summaries `Tests  7 failed` (vitest) and `Tests  6 failed` (vitest slow), 7 plus 6 being 13.
  - Decision resting on it: whether verify 2's red is the step's. The count does not change that decision, since every red test is a timeout in an unchanged file that passes alone.
  - Fix at landing: "twelve" becomes "thirteen".
  - Failure scenario: an orchestrator reconciling the row with the table finds a red test unaccounted for and goes looking for a fourteenth file or a missing lone run.
  - Verdict: round item 3, violated on this count.
- R2, Standards. `.scratch/migration/agents/reviews/O132-report.md`, the sections before "Repair round 1": the Files table row "`tests/data/shapes/catalog-files/vocab.test.ts` | 226 -> 362", DONE row 4 "`vocab.test.ts:235-362`" and DONE row 2 "`vocab.test.ts:1-10` (read)".
  - What is wrong: the rules file ("The working rules that bind every package") says every line count and `file:line` in the report is taken after the last change, and a figure from before it is taken again or removed.
  - After the round, `wc -l` gives 363, the head comment runs to line 11, and the new code runs from line 236 to 363 (`grep -n "A hub file whose tier"` gives 236).
  - The round section's own table gives 363, so the report states two line counts for one file.
  - No decision rests on these figures.
  - Fix at landing: 362 becomes 363, `235-362` becomes `236-363`, and `1-10` becomes `1-11`.
  - Failure scenario: a reader follows `vocab.test.ts:1-10` and misses the last line of the head comment, which carries the in-order comparison clause.
  - Verdict: none.
- R3, Spec (an unapproved script, under the rules file's definition). `.scratch/migration/agents/reviews/O132-report.md`, the last paragraph: "This section "Repair round 1" was appended to this report with a shell here-document redirect (`cat >> .scratch/migration/agents/reviews/O132-report.md <<'EOF'`)".
  - What is wrong: the rules file ("What every package obeys", the case-run paragraph) says a shell redirect that changes a file is a script that needs the approval the brief names. Neither the brief nor the round brief approves one.
  - The builder names it and the one file it changed. That file is the report, not a path of the step's diff.
  - Disposition: the ruling "Unapproved builder scripts" (`plan.md` Rulings, 2026-10-25) closes it in automode. The breach is recorded in the booking, and the orchestrator reads the appended hunk against the round brief before keeping it. I read the whole appended section, and nothing in it is kept beyond what the reruns above confirm, except R1.
  - Failure scenario: a booking that omits the breach leaves the step's record silent on an edit made outside the Edit and Write tools.
  - Verdict: none.

### Declined to judge

- What the staged tree holds, and whether the ledger copies under the worktree's `.scratch/` match the main ledger. That needs `git diff --cached` or a commit-level read, git commands outside the three this review may run.
- The thirteen red tests of the builder's round run, as distinct from their files' lone runs. Those test results came from a load I cannot recreate. I reran each file alone, and each passes.
- Whether `ticker_categories`, a key of `hubKeysOf('catalogs/vocab.yml')` whose words `focusFindings` (`sections/focus.ts`) checks for the primary, should also be checked for a hub other than the primary. The brief's item 1 limits this step to `vocabFindings` ("a key it does not read gives no finding"), so it lies outside the step.
- The counts on the Findings tab, the rail and the status bar for a second hub holding C1 and C7. The look on landing settles them, since a reviewer runs no page.
- G13's text, Code and Test lines. The orchestrator extends them at landing, outside this diff.

Reviewer usage: acbc1234def53be42, claude-opus-5-5, 180694 tokens, 38 tool uses, 14 min 53 s.
