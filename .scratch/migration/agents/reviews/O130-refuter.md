# Step O130 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O130, base 1c312c834)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npx vitest run tests/data/sources/config/boards.test.ts tests/data/hubs/connection-keys.test.ts tests/data/hubs/workspace-projects.test.ts tests/data/sources/manifests/manifests.test.ts tests/state/forms/choices.test.ts   (brief verify 1, worktree root)
 Test Files  5 passed (5)
      Tests  110 passed (110)

$ npm run test:quick   (brief verify 2, worktree root, run once)
test:quick: 10 changed file(s), from git since HEAD
test:quick: 99 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (3.3 s)
ok      svelte-check (11.8 s): 1793719885923 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (162.4 s): Duration  145.83s (transform 136.62s, setup 0ms, import 235.51s, tests 309.44s, environment 5ms)
ok      vitest (163.3 s): Duration  149.73s (transform 39.05s, setup 0ms, import 132.67s, tests 460.64s, environment 2.22s)
FAILED  vitest slow (316.3 s)
 Test Files  1 failed | 44 passed (45)
      Tests  1 failed | 499 passed | 165 skipped (665)
test:quick: 319.4 s; failed: vitest slow
(my output filter dropped the name of the failing file. The 45 slow files the list picks, taken from the
pick list of the builder's log o130-quick3.txt, were rerun alone with the list's own flags:)
$ npx vitest run <the 45 slow-holding picked files> --tagsFilter slow --testTimeout 20000 --reporter=dot --configLoader runner --passWithNoTests
 Test Files  45 passed (45)
      Tests  500 passed | 165 skipped (665)
(One slow test failed once while other suites ran on the machine, and it passed on the rerun. Under the
rules file's "Verify before you report" this counts as no finding.)

$ LC_ALL=C grep -n '[^ -~]' src/lib/data/index.ts src/lib/data/sources/config/sections/boards.ts tests/data/sources/config/boards.test.ts docs/HELP.md docs/diagrams/layer-data.dot docs/diagrams/layer-data.svg docs/diagrams/writes.dot docs/diagrams/writes.svg .scratch/migration/agents/reviews/O130-report.md   (brief verify 3)
exit 1   (nothing printed)
$ the rules file's perl ASCII gate over the four authored files
perl exit 0   (nothing printed)

Brief verify 4, first run of the new table on the unchanged tree. Command: a scratch copy of
.agents/worktrees/O130-base/{src,tests,utils,config}, with package.json, vite.config.ts, tsconfig.json,
.npmrc and .svelte-kit from the worktree, node_modules linked, and the worktree's boards.test.ts copied in
(the copy's src/lib/data/index.ts compared equal to the base copy's; the copy was removed afterwards):
$ npx vitest run tests/data/sources/config/boards.test.ts -t 'not the primary' --reporter=verbose
 <multiplication sign> ... gives the findings of a stage word the hub does not hold, each naming its settings file 259ms
 <multiplication sign> ... gives the findings of a row naming no color, each naming its settings file 227ms
 <multiplication sign> ... gives the findings of a form word the hub does not hold, each naming its settings file 227ms
 <check mark> ... gives the findings of no categories, each naming its settings file 224ms
 <multiplication sign> ... gives the findings of a row with no key, each naming its settings file 275ms
 <check mark> ... gives the findings of a row naming a stage word the hub adds, each naming its settings file 217ms
 <check mark> ... gives the findings of a key in two rows, each naming its settings file 252ms
 <check mark> ... gives the findings of a categories that is no list, each naming its settings file 246ms
AssertionError: expected [] to deeply equal [ [ <horizontal ellipsis>(3) ] ]
AssertionError: expected [] to deeply equal [ [ <horizontal ellipsis>(3) ] ]
AssertionError: expected [] to deeply equal [ [ <horizontal ellipsis>(3) ] ]
AssertionError: expected [ [ <horizontal ellipsis>(3) ] ] to deeply equal [ [ <horizontal ellipsis>(3) ], [ <horizontal ellipsis>(3) ] ]
 Test Files  1 failed (1)
      Tests  4 failed | 4 passed | 31 skipped (39)
("..." stands for the describe prefix "|unit| tests/data/sources/config/boards.test.ts > the category rows of a hub that is not the primary >", cut here for width.)
After the change, in the worktree:
$ npx vitest run tests/data/sources/config/boards.test.ts -t 'not the primary'
 Test Files  1 passed (1)
      Tests  8 passed | 31 skipped (39)

Commands the builder's report quotes:
$ node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o130-cases.mts   (source read in full; run from the worktree)
C1 other:   [["<hub>/.oculus/config.yml","categories[7].stages.words","categories[7].stages.words must be one of the items of the list project_stages; it is not read"]]
C1 primary: [same]
C2 other:   [["<hub>/.oculus/config.yml","categories[7]","categories[7] names no color, so it is drawn in no colour"]]
C2 primary: [same]
C3 other:   [["<hub>/.oculus/config.yml","categories[7].forms.words","categories[7].forms.words must be one of the items of the list project_forms; it is not read"]]
C3 primary: [same]
C4 other:   []
C4 primary: []
C5 other:   [["<hub>/.oculus/config.yml","categories.7.key","categories.7.key must be a text"],["<hub>/.oculus/config.yml","categories[7]","categories[7] must be a map with a key no earlier row holds; the row is not read"]]
C5 primary: [same]
C6 other:   []
C6 primary: []
C6 rows over the shipped config: [["categories[7].stages.words","categories[7].stages.words must be one of the items of the list project_stages; it is not read"]]
C7a other:   [["<hub>/.oculus/config.yml","categories","categories names x in more than one entry; none of them is applied and oculus's entry stands"]]
C7a primary: [same]
C7b other:   [["<hub>/.oculus/config.yml","categories","categories must be a list; oculus's value stands"]]
C7b primary: [same]
("[same]" marks a line the program printed identical to the "other" line above it. This output matches the report's quoted output byte for byte.)
$ ls /private/tmp | grep -c '^o130-'
0
$ ls "$TMPDIR" | grep -c '^o130-'      (the folder os.tmpdir() gives; see Proof 1)
0
$ sh utils/unused-exports.sh > <scratch>; diff ../O130-base/unused-exports.txt <scratch>
335 lines each; diff exit 0
$ git diff 1c312c834 -U0 -- <the four authored files> | grep '^[+]' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"
exit 1   (nothing printed)
$ grep -rn "readOtherHub\|categoriesFindings\|OtherHub" src docs config tests README.md --exclude=local.yml --exclude-dir=diagrams
hits in: portfolio.ts:27,610; payload.ts:20,51,73; build.ts:22,73; categories.ts:49; boards.ts:225; findings.ts:20,49; index.ts:61,623,636,641; choices.test.ts:9,86; connection-keys.test.ts:10,175; workspace-projects.test.ts:12,53; boards.test.ts:10,15,194,199,327; manifests.test.ts:10,44
$ wc -l src/lib/data/index.ts src/lib/data/sources/config/sections/boards.ts tests/data/sources/config/boards.test.ts docs/HELP.md
847 / 262 / 337 / 618
```

Sample of the generated diagrams read: `docs/diagrams/layer-data.dot`, where the `data to data/sources` edge goes from 16 to 17, which is the one new import of `boards.ts` in `index.ts`, and `docs/diagrams/writes.dot` cluster "53. lost", where `index.ts:265,266` become `:266,267`, which is the same one-line import shift.

Probes I ran myself with `node --input-type=module -e` against the worktree's `src`, each planting a hub under `os.tmpdir()` and removing it:
- A hub row with `sort: [banana]` gives the whole-file shape finding `categories.7.sort is not a value this key takes`.
- A hub that writes `categories: [{ key: idea, label: Idea }]` gives `categories[2] names no color, so it is drawn in no colour`, naming the hub's file.
- `categories: []` gives no finding.
- A hub with `stages: { submitted: null }` and no `categories` has `from.categories` = `catalogs/vocab.yml` and no finding. Oculus's `in-review` row is merged with `stages.words: []`.
- No finding carries a `line` field, so comparing `[file, key, message]` compares the whole finding.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/data/index.ts:640-642`: `const categories = fromHubFile(from.categories) ? categoriesFindings(config, () => sources, textCatalog(config)) : [];`. Line 659 appends `...categories` after `...findings` and `...sourcesFindings(...)`. `sources` is `join(root.dir, HUB_FILE)` (line 639). The case-run output gives the same file, key and message for the other hub as for the primary's run of the same file.
- 2: holds. `git diff 1c312c834` changes no signature line of `readOtherHub`. The grep shows the same callers the brief lists: `portfolio.ts:610`, `choices.test.ts:86`, `workspace-projects.test.ts:53`, `manifests.test.ts:44` and `connection-keys.test.ts:175`. Verify 1 passes.
- 3: holds. The doc comments are rewritten at `index.ts:617-622` (OtherHub) and `:629-635` (readOtherHub). The head comments are rewritten at `boards.ts:1-13` and `boards.test.ts:1-6`, and a word diff against the base shows only the added clauses. I read every other grep hit: the head comment of `payload.ts`, the comment at `portfolio.ts:604-607`, `categories.ts:49` and `findings.ts:49`. I also read `vocab.yml:262`, `templates.md:445`, `HELP.md:307`, `HELP.md:566` and `apps.md:423`. None is made false.
- 4: holds. `docs/HELP.md:592` is one bullet in "Hubs and projects", after the Audit bullet.
- 5: holds. The describe 'the category rows of a hub that is not the primary' (`boards.test.ts:263-337`) is one `it.each` table with eight rows (C7 is two hubs). Each row plants a hub with `plantScratch`, reads it with `readOtherHub({ key: 'lab', dir }, loadConfig(engineDir(), { hub: dir, other: 'lab' }))`, and compares every `categories`-keyed finding as `[file, key, message]`. The first run on the unchanged tree reproduces as 4 failed and 4 passed.

Cases of the brief's "Cases":

- C1: met. Table row 1 was red on the unchanged tree (`expected [] to deeply equal [ [ <horizontal ellipsis>(3) ] ]`) and is green after. The case-run output gives the expected file, key and message.
- C2: met. Row 2 was red before and is green after, with `categories[7] names no color, so it is drawn in no colour` naming the hub's file.
- C3: met. Row 3 was red before and is green after, at `categories[7].forms.words`.
- C4: met, as an audit. Row 4 is green before and after. By reading, this row would also pass with the `fromHubFile` condition taken out, since oculus's shipped rows give no finding, so no test sees the condition. The brief classes C4 as an audit.
- C5: met. Row 5 was red before (`expected [ [ <horizontal ellipsis>(3) ] ] to deeply equal [ [ <horizontal ellipsis>(3) ], [ <horizontal ellipsis>(3) ] ]`, the shape's finding alone) and is green after with both findings.
- C6: met, as an audit. Row 6 is green before and after. The case-run program's "C6 rows over the shipped config" line shows the same rows give a finding over oculus's own stages.
- C7: met. Rows 7 and 8 are each green before and after with exactly the hub layer's one finding, so `categoriesFindings`, which runs after the change because `from.categories` names the hub file, adds none.

## 1. Spec

- `.scratch/migration/agents/reviews/O130-report.md`, section "Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md:172`)": "- Open item 647 (2026-11-03): the words of a hub other than the primary are held to the whole-file shape only, ...". What is wrong: the brief's "Report" asks for "The open items of the state file, verbatim". The state file in the main checkout (`/Users/axelfaes/workspace/oculus/.scratch/migration/orchestrator-state.md`, section "Open items") holds "- None.", and item 647 sits in "Closed items" as "Open item 647 (2026-11-03), closed by Axel the same day: (a), step O132; (b) was the lazy option." The builder quoted the worktree's copy of the state file. That copy is at the base and was not refreshed, while the brief was (the worktree's brief compares equal to main's). Failure scenario: an orchestrator or Axel reading the report takes item 647 as still awaiting his ruling, though it is ruled and booked as O132 (`plan.md:1642`). Verdict: no item or case.

## 2. Proof

- O130-report.md, section "The cases' first run", the case-run paragraph: "it removes each hub (`ls /private/tmp | grep -c '^o130-'` prints `0` after it)". What is wrong: the program makes its hubs with `mkdtempSync(join(tmpdir(), 'o130-'))` (o130-cases.mts:26). `os.tmpdir()` is `$TMPDIR` (`/var/folders/7r/.../T/` here), not `/private/tmp`, so the quoted count reads a folder the program never writes and would print 0 even if no hub were removed. My count over `$TMPDIR` also prints 0, so nothing is left behind, but the quoted check does not prove it. No decision rests on it. Failure scenario: a reader takes the quoted `0` as evidence of cleanup in a run where `rmSync` had failed. Verdict: no item or case.

## 3. Standards

- O130-report.md, section "DONE / NOT DONE", the paragraph after the table: "`npm run test:quick` was started three times. ... The third start is one more than the spec's paragraph allows". What is wrong: the rules file, section "Token discipline", allows one run after the last change, plus one more after fixing a red line in a changed file. The first run was red on eslint and the second followed its fix. The second was stopped and a third run made after a further comment edit. The rules file says a run "beyond what this paragraph allows, is a finding of the review". The builder states it openly. Failure scenario: one more full list run (240 s, three vitest projects) is spent per step whenever a builder edits after starting the list. Verdict: no item or case.

## 4. Behaviour

- O130-report.md, section "Host- or user-visible changes, before and after": "see one finding "categories[7] names no color, so it is drawn in no colour" with that hub's file and chip." What is wrong: the Findings view's Files section names a finding's file relative to the root that holds it and draws no hub chip. See `src/lib/views/system/findings/Findings.svelte:31-34` ("A row names its file relative to the folder of the root that holds it ... the whole path in its tooltip") and `named` at `:102-105` (`fileUnder(file, roots(), primary())?.path ?? file`, where `fileUnder` at `src/lib/data/helpers/files/paths.ts:178-193` returns the path under the root and leaves the root's name out of `path`). A grep for "chip" in `Findings.svelte` prints nothing. The second hub's row therefore reads `.oculus/config.yml`, the same text a primary's finding reads, with the hub's whole path only in the tooltip. This is how every other settings-file finding of a second hub is drawn at the base too, so the step changes nothing here. The defect is in the look's expectation. Failure scenario: at the look on landing, the orchestrator looks for a hub chip that is never drawn and either books a false defect or accepts a row it cannot tell from a primary's finding without hovering. Verdict: no item or case.

## Declined to judge

- Who wrote the worktree's one-line change to `.scratch/migration/agents/briefs/O130.md` (the base-copy paragraph). The file compares equal to the main checkout's brief, has the same mtime (Nov 3 16:06), and the builder says it was already modified when it started. Settling it needs `git log` or the orchestrator's record, which are outside the git commands allowed here.
- Which slow test failed once in my `npm run test:quick` run. My filter dropped its name, and the 45 slow files rerun together all passed. Naming it would need a second run of the list, which the rules file's "Token discipline" does not allow.
- Whether a hub that removes a stage or form word should get a finding for oculus's own rows naming that word. My probe shows the hub layer drops the word from oculus's `in-review` row with no finding, both at the base and after the step. This is hub-layer behaviour outside O130's brief and ruling 645, so it is not judged here.

Reviewer usage: a982d30fcbb0915af, claude-opus-5-5, 190139 tokens, 69 tool uses, 15 min 32 s.

## Closed

The run found no finding in the step's code or documents; the four findings are in the builder's report and the look's expectation, so no repair round is sent and the rounds end.

- Spec 1 (the report quotes open item 647 from the worktree's stale state file): fixed at landing, the report's open-items section rewritten to the state file's list as it stands on main.
- Proof 2 (the clean-up count read `/private/tmp`, not `os.tmpdir()`): fixed at landing, the report's sentence names the reviewer's count over `$TMPDIR`, which prints 0.
- Standards 3 (a third start of `npm run test:quick`): no change to the step; the builder states it, and the landing runs the whole list once on the gate.
- Behaviour 4 (the look's expectation of a hub chip): fixed at landing, the report's before-and-after sentence says the Findings view names the file relative to its root with the whole path in the tooltip and draws no chip; the look checks that.
