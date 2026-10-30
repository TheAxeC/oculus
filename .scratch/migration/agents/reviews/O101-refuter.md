# Step O101 refuter report (on .agents/worktrees/migration-O101, base ce8d41683)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Verify 1, from the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
npm run diagrams && npm run docs:palette && npm run test:quick -- --base ce8d41683
test:quick: 64 changed file(s), from git since ce8d41683
test:quick: 339 test file(s)
ok      svelte-kit sync (2.6 s)
ok      prettier (2.6 s): All matched files use Prettier code style!
ok      ASCII gate (2.6 s)
ok      eslint (19.4 s)
ok      svelte-check (33.7 s): 1793360308300 COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (140.5 s): Duration  131.25s (transform 69.33s, setup 0ms, import 174.54s, tests 256.93s, environment 4ms)
ok      vitest (168.9 s): Duration  160.78s (transform 144.84s, setup 0ms, import 285.63s, tests 301.30s, environment 19.30s)
ok      vitest slow (249.8 s): Duration  241.76s (transform 15.58s, setup 0ms, import 139.63s, tests 814.71s, environment 20ms)
test:quick: 252.7 s; every command passed
(shasum of docs/diagrams/* and docs/palette.md before and after the run: diff printed nothing, so the committed diagrams are current and the run wrote no change)
(neither tests/data/hubs/hub-portfolio.test.ts nor tests/server/machine/runs/schedules/commands.test.ts failed in this run; the report's NOT DONE on verify 1 does not reproduce)

# Verify 2, ASCII gate over the 64 paths of git status --short
.scratch/migration/agents/reviews/O101-hub.patch:2:--- a/.oculus/data/academic/funding.yml<tab>2026-10-30 12:08:11
.scratch/migration/agents/reviews/O101-hub.patch:3:+++ b/.oculus/data/academic/funding.yml<tab>2026-10-30 12:08:34
(the same tab in the headers at :38, :39, :60, :61)
.scratch/migration/agents/reviews/O101-hub.patch:73:     name: "St<e-acute>phanie M. van den Berg"
ascii exit 0
(no hit in any file under src, tests, config, docs, package*.json, or in O101-report.md)

# Verify 3
sh utils/unused-exports.sh > <scratch>/unused.txt; diff .agents/worktrees/O101-base/unused-exports.txt <scratch>/unused.txt
exit 0; 337 and 337 lines; diff exit 0

# Verify 4, from ~/workspace/research-hub
patch -p1 --dry-run < <worktree>/.scratch/migration/agents/reviews/O101-hub.patch
patching file '.oculus/data/academic/funding.yml'
patching file '.oculus/data/people/organisations.yml'
patching file '.oculus/data/people/people.yml'
patch exit 0

# Verify 5 (git grep is not a git command the reviewer may run; grep -rn over the same paths)
grep -rn "zenodo.org" src                          -> exit 1, nothing
grep -rn --exclude=local.yml "zenodo.org" config
config/defaults/behavior.yml:311:      address: 'https://zenodo.org/api/records/{record}'
config/defaults/behavior.yml:470:    address: https://zenodo.org/api

# Verify 7
wc -l of the changed .ts/.svelte/.js sources: largest src/lib/data/model/index.ts 880, writes.svelte.ts 870, git-write.ts 867; Deposit.svelte 459, DepositZenodo.svelte 193, Editor.svelte 340
sh utils/folder-check.sh -> folder exit 0; src/lib/server/git/deposit holds 10 items

# Verify 8, history words over added lines of git diff -U0 ce8d41683 -- src tests config and the new files, comment lines and test titles
every hit is "before" of order inside one run ("before any request", "the line end before `endstream`", "a git that ends before it has read") or "still" of a Cancel ("a Cancel still deletes it"); no package id, no date in a comment

# The report's case program cases.ts, the source quoted in the report copied into the scratchpad with its "Case 14" block left out (that block runs the real git through adopt and push; see Declined), run as
./node_modules/.bin/jiti <scratch>/cases/cases-nogit.ts <worktree>
every line for cases 4, 5, 6, 7, 8, 11, 17, 18, 19 and 20 is identical to the report's quoted output, for example:
case 5: 200 Published on Zenodo as 10.5281/zenodo.102
case 5 manifest: {"status":"deposited","description":"Code of the paper.","url":"https://example.org/alpha","date":"2026-01-02","doi":"10.5281/zenodo.102","zenodo_status":"deposited","zenodo_date":"2026-10-30","review_link":"https://zenodo.example/records/101?token=share-101"}
case 11: 400 Cancelled during the upload of alpha.zip; the draft was deleted, so nothing was published
case 17 second calls: GET /api/records/102 | GET /api/records/101/versions/latest | POST /api/records/101/versions | PUT /api/records/103/draft | ... | POST /api/records/103/access/links
case 20 second: 409 A run of the deposit of hub:alpha is still going, so nothing was sent to Zenodo; wait for it or cancel it
case 20 drafts made: 1

# The report's case24.ts, copied from the report, ./node_modules/.bin/jiti <scratch>/cases/case24.ts <worktree>
identical to the report's four lines (shipped row; merged address https://sandbox.example/api with timeout_s 600 and the shipped auth; problems []; findings [])

# Hub reads behind the patch (read only)
grep -rIn -i "kerga" ~/workspace/research-hub (local.yml and .git excluded):
funding/2026-nwo-veni-self-explaining-hospital/preproposal/veni2026.tex:113:{Kerga, M.A., Faes, A. (2026). From classification to competing risks: ...
projects/manuscripts/meseret-cirrhosis/code/README.md:3: ... (Kerga & Faes) ...
projects/manuscripts/meseret-cirrhosis/manuscript/main.tex:23:\author{Meseret Assefa Kerga$^{1}$ \and Axel Faes ...
projects/manuscripts/meseret-cirrhosis/manuscript/supplementary.tex:20, code/LICENSE:3, project.yml:42, education.yml:191 ("Meseret (Kerga)"), applications/archive/withdrawn/2025-oslo-plague/motivatie.tex:43 ("M. A. Kerga")
grep for "Cornelissen, D" | "Chun, D" | "Ceyssens, W" | "Pretnar, M":
funding/2026-nwo-veni-self-explaining-hospital/preproposal/veni2026.tex:105:{Cornelissen, D., Faes, A. (2026). ...
the lines the report cites for the other people (refs.bib:48 and :57, hccnet_fl.bib:255, data.yml:162/165/168, algebraic-effects-compilation/project.yml:23, acknowledgement.tex:4) read as the report quotes them
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Behaviour 1. The row, its options entry, HUB_LIST, OWN_HUB_KEYS, the template line and the field-by-field overlay are there (case24 run, zenodo.test.ts 'keeps the shipped auth and time limit ...'), but the three keys are declared own-hub keys while the presses and the GET read the primary's merged settings.
- 2: holds, `manifest-schema.yml` rows, the `rows` kind in the header comment, `catalog-files/manifest.ts`, `model-collections.ts`, `rowsValue` in `edit/writes/manifest.ts`, the form through `records`; the template lacks the `review_link` line, see Spec 2.
- 3: holds, `zenodo-copy.ts` (`stagedFiles` with its own `git init` under `tmpdir()`, `anonymised`, `inspect`, `holdsTerm`), the G141 rows of zenodo.test.ts and the G79 row of deposit-compare.test.ts, green in verify 1.
- 4: holds, `zipOf`, `fflate` 0.8.3 in package.json and the lock, entries with no top folder (zenodo.test.ts first row).
- 5: holds for the documented paths (zenodo.test.ts first row; cases 17 and 18 rerun); the sentences after a failed read of a published record are wrong, Behaviour 3.
- 6: holds, cases 5 to 8 and 19 rerun with the report's output.
- 7: holds, `zenodoAccess`, `readerAccounts` in `recover/+server.ts:41`, `zenodo: { ready }` in the GET (case 4 rerun); the test of the Recover side does not reach the route, Proof 2.
- 8: holds, the two actions in `ACTIONS` and `CONFIRMED`, `running.busy` before `begin` (case 20 rerun), every call through `timedFetcher` with the run's signal.
- 9: holds by reading `DepositZenodo.svelte` and `deposit.yml`; what it draws is for the look.
- 10: holds, `MANIFEST_ACTIONS` in `write-files.ts` and the G28 rows of held-unsaved.test.ts.
- 11: holds, by reading: `push` writes `status`, `url` and `date` alone (`deposit.ts:465-468`), unchanged from the base.
- 12: violated, Spec 1 and Proof 1.
- 13: holds, `CodeAvailability` and `Funding.award` with their normalisers.
- 14: violated, Standards 1 (a head comment the step makes false); the `review_link` template line is Spec 2.
- 15: holds, `codeLink` in `papers.ts` and the four website-files.test.ts rows.
- 16: holds, `child.stdin?.on('error', ...)` before the input is written (`git-write.ts:194-197`), the git-write.test.ts row, failing on the unchanged tree as quoted.

Cases of the brief's "Cases":

- 1: met, zenodo.test.ts 'sends one anonymised zip, an Anonymous creator, ...', green in verify 1.
- 2: met, zenodo.test.ts 'refuses a binary file holding a term ...'.
- 3: met, zenodo.test.ts 'sends the title and the description with the terms replaced'.
- 4: met for the GET and the two POSTs (cases program rerun); the buttons off with their tip are for the look.
- 5: met, cases program rerun.
- 6: met, cases program rerun.
- 7: met, cases program rerun.
- 8: met, cases program rerun.
- 9: met, zenodo.test.ts 'is in no answer, log line, History record or sentence ...'; its History part asserts over a folder nothing writes, Proof 3.
- 10: met, the four rows of tests/routes/git/deposit.test.ts.
- 11: met, cases program rerun (the upload held, Cancel, DELETE of the draft, manifest unchanged).
- 12: partial, the Recover route's line is not reached by the test, Proof 2.
- 13: met, deposit-compare.test.ts 'makes the Zenodo review copy from the code folder of the project folder, never the one under .oculus', green in the slow tier of verify 1.
- 14: met by reading (`push` writes its three fields through `writeManifest`, field by field); the report's two runs were not rerun, see Declined.
- 15: met, zenodo.test.ts 'replaces a term written in any case'.
- 16: met, zenodo.test.ts 'refuses a finding of the deposit scan ...' for For review; for Publish by reading (`sendingOf` calls `stagedFiles` for both kinds, `zenodo.ts:117-118`).
- 17: met, cases program rerun.
- 18: met, cases program rerun.
- 19: met, cases program rerun.
- 20: met, cases program rerun.
- 21: met, the five zenodo.test.ts rows (empty term, `C++ (X)`, both orders, folder name, repository name).
- 22: met, zenodo.test.ts 'refuses two paths that become one ...'.
- 23: met, the Latin-1, `.docx`, `.pdf` and `.7z` rows of zenodo.test.ts.
- 24: met, zenodo.test.ts 'keeps the shipped auth and time limit ...' and the case24 rerun, for the primary hub; another hub's value is not read, Behaviour 1.
- 25: met, the website-files.test.ts rows for the five inputs (the journal row, 'zenodo-review', 'zenodo-only', 'doi-alone', 'code under anonymous review is not linked').
- 26: met, git-write.test.ts 'answers from the exit of a git that ends before reading its input, and leaves no broken pipe unhandled', failing on the unchanged tree with `expected [ 'write EPIPE' ] to deeply equal []`.
- 27: not verifiable here, the look on landing (project form, a manifest with `anonymize`).

## 1. Spec

- `.scratch/migration/agents/reviews/O101-hub.patch`, `people.yml` hunks, and the report's section "The hub patch": "Left without `family`: `kerga`, "Meseret Assefa Kerga", a name with no family name in the Western sense; the one file of the hub that prints it, `projects/manuscripts/meseret-cirrhosis/project.yml:42` ... does not split it." What is wrong: item 12 fills `family` "from a file of the hub that writes the person's name as "Family, Given"", and failing that "a `name` whose family name is its last word by every file that prints it" takes that word; only a person "whose family name no file gives" is left without it. `funding/2026-nwo-veni-self-explaining-hospital/preproposal/veni2026.tex:113` writes "Kerga, M.A., Faes, A. (2026)", `code/README.md:3` cites "(Kerga & Faes)", and every file that prints the name ends it with "Kerga" (main.tex:23, supplementary.tex:20, LICENSE:3, project.yml:42, motivatie.tex:43 "M. A. Kerga"). Both of the brief's rules give `family: "Kerga"`. This answers the orchestrator's question: leaving `kerga` without `family` is outside the brief. Failure scenario: after landing, Publish of `meseret-cirrhosis` (lead `[kerga]`, a project with a `code_availability` block) is refused with "kerga has no family name in people.yml, so nothing was sent", although the hub names her family name in the form the brief accepts; verdict: item 12 violated.
- `docs/templates.md`, the manifest template's `code_availability` block: the report's "What in the brief was wrong or impossible" says "The `review_link` line of the manifest template ... is not written: `tests/checks/config/templates.test.ts:73-82` holds the template to the schema's fields that are not `readonly`". What is wrong: item 14 asks for "the four manifest keys" in that block, and the check (read at `templates.test.ts:74-83`, `filter(([, field]) => field.type !== 'readonly')` then `keyDifference(held, shown)` with no `extra`) refuses a line for a `readonly` field. That is a clash between the brief and a check of the tree; the rules file's "Read first" says to stop and report such a disagreement, and the builder chose the check's side and reported it after building. The read of the check is right; the choice between dropping the line and changing the check is the orchestrator's. Failure scenario: a reader of the manifest template finds no `review_link` key and does not know that For review writes it; verdict: item 14 (with Standards 1).

## 2. Proof

- The report's section "The hub patch", `kerga` and `dries-cornelissen`: "the one file of the hub that prints it, `projects/manuscripts/meseret-cirrhosis/project.yml:42`", and for Cornelissen "no file splits the name; the last word of the name as every file prints it". What is wrong: the grep above finds at least eight files that print Kerga's name, one of them in "Family, Given" form, and `veni2026.tex:105` splits "Cornelissen, D.". The decision resting on it: whether `kerga` gets `family` (Spec 1), and the provenance line the brief asks for each person; Cornelissen's value is the same either way, only its cited source is wrong. Failure scenario: the orchestrator applies the patch trusting the report's claim that no file splits the name, and Publish of the cirrhosis project stays refused; verdict: item 12.
- `tests/routes/git/zenodo.test.ts:442-453`: "const { readerAccounts } = await import('../../../src/lib/server/git/deposit/zenodo-api.ts'); const rows = readerAccounts([...], at.into.config.merged); const recover = applyAuth([{ header: 'Authorization', row: 'zenodo' }], rows);". What is wrong: case 12 asks that "a fixture hub whose Recover row `zenodo` names `auth` ... reads its records with no `Authorization` header". The behaviour lives in `src/routes/api/(machine)/recover/+server.ts:41` (`downloads: () => readerAccounts(server.local.downloads, locals.config().config)`), and the test calls `readerAccounts` itself, so by reading it would still pass with that route line put back to `server.local.downloads`. Failure scenario: a later edit of the Recover route drops `readerAccounts`, the suite stays green, and a hub's Recover row that names `row: zenodo` sends the Zenodo token to its own address, which G76 forbids; verdict: case 12 partial.
- `tests/routes/git/zenodo.test.ts:424-428`: "const records = readdirSync(at.dir).includes('history') ? filesUnder(history) : []; for (const file of records) { ... not.toContain(ZENODO_TOKEN) }". What is wrong: the press under test fails before any manifest write, so no History record is written and the loop runs over nothing; the History part of case 9 asserts nothing (found by reading). Failure scenario: a change that put the token into a manifest write's History record on a successful press would pass this test; verdict: none (case 9 is met by its other assertions).
- Verify item 2, the report's DONE row "ASCII gate over the changed files | DONE | prints nothing". What is wrong: over the 64 paths `git status --short` lists, the gate prints seven lines, all from `O101-hub.patch` (the `<tab>` of `diff -ruN`'s header lines and the `<e-acute>` of a hub name in a context line). The decision resting on it is the item 2 row; the hits are the patch format and hub data, so no source file is affected. Failure scenario: the landing reruns the gate over every changed path, including the ledger, and finds a red row the report called green; verdict: none.

## 3. Standards

- `src/lib/server/git/deposit/deposit-git.ts:3-7` and `:26-31`: "the deposit lives outside the hub tree as one mirror clone per deposit repo under the machine-local state folder. Every command here therefore runs in a directory under that mirrors folder and nowhere else" and "its operations are called by deposit.ts ... and by deposit-compare.ts". What is wrong: the step runs `initMirror`, `addAll` and `lsFiles` of this module from `zenodo-copy.ts` through `deposit-tree.ts`, in a folder under `os.tmpdir()` that `stagedFiles` passes as the "mirrors" root (`zenodo-copy.ts:97-104`). The head comment is now false on where commands run and who calls them, and the step edited this file (`lsFiles`) without rewriting it (rules file, "What every package obeys", the sentence a change makes false). Failure scenario: a reader auditing where deposit git commands may run trusts the head comment and does not look at the temporary folder; verdict: item 14 violated.
- The report as a whole: the rules file asks for "every edit to an existing assertion, allow list or predicate with its before and after, made from a `diff` of each changed test file and allow list against the base copy, one row per changed line". The report has no such list. The diff holds at least: `tests/checks/config/config-folder.test.ts:181` (`'deposit'` added to the expected keys, named in prose only), `tests/data/hubs/website-files.test.ts:60` (the existing `deposited` journal fixture gains `zenodo_status: deposited`) and `:341` (the existing row's title "a deposit with a DOI links its code at the DOI's address, ..." becomes "a deposit published on Zenodo links its code ..."). Failure scenario: the orchestrator cannot tell from the report whether an existing website row was fitted to the new code rather than to ruling 592 (a); verdict: none.
- The report's section "DONE / NOT DONE", runs: "the diagrams, the palette and the quick tier three times. ... The second and third ran on the final tree". What is wrong: the second run's red line was in `tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change, and the rules file's "Token discipline" says such a line is rerun alone and "the list is not run again for it"; the third run of the list is beyond what that paragraph allows. Failure scenario: each extra run costs about 270 to 350 s of machine time beside other steps' runs; verdict: none.
- `tests/fixtures/hubs/zenodo-answers.ts:36-41` and `:81-88`, `:215-224`: "hold?: (method: string, path: string) => boolean; seed?: { concept: string; record: string; conceptdoi?: string }; held?: () => void;". What is wrong: no file in the tree passes `seed`, `hold` or `held` (`grep -rn "fakeZenodo(" tests src`: five calls with no argument and one with `{ status }`), and the fake's routes for `versions/latest`, `POST .../versions` and `PUT .../draft` are reached by no test. They served only the deleted `cases.ts`. The rules file's principles ask that nothing be built for a need the plan does not name; this is a test helper carrying options for cases that have no test (cases 5, 11, 17, 19, 20 are runs). Failure scenario: a reader of the helper takes the held and seeded paths for tested behaviour of Publish, Cancel and the new version; verdict: none.
- `src/lib/server/git/deposit/zenodo-api.ts:19-20`: "/** How long one call other than an upload is given, as a Recover listing gives one request. */ const CALL_MS = 30000;". What is wrong: it restates `REQUEST_MS = 30000` of `src/lib/server/machine/runs/recover/files.ts:45` by value (rules file principles, "a rule exists once"). Failure scenario: the Recover limit is changed and the Zenodo calls keep 30 s while the comment and the report say they follow it; verdict: none.

## 4. Behaviour

- `src/lib/server/git/deposit/zenodo.ts:77`, "const settings = zenodoSettings(deposit.merged);", with `deposit.ts:291` "merged: into.config.merged," and `deposit-routes.ts:249-253` (`mergedOf`, the GET's `ready`). What is wrong: the step adds `deposit.zenodo.address`, `timeout_s` and `auth` to `OWN_HUB_KEYS` (`hub-keys.ts`), which the file's head comment defines as keys "each hub's own `.oculus/config.yml` is read for", so Settings shows and writes each hub's value, and the options help (`config/options/behavior.yml:744`) says "Each hub's .oculus/config.yml may set its own for its own projects". The presses read the primary hub's merged settings (`into.config.merged`) for every project, where the project's own hub target `deposit.home.into.config.merged` (`hubs.ts` `within`) holds that hub's. The report does not state this. Failure scenario: a workspace with two hubs whose second hub sets `deposit.zenodo.address` to Zenodo's sandbox; Settings shows the sandbox under that hub; For review of a project of that hub creates a public record on zenodo.org with the primary's address; verdict: item 1 violated.
- `src/lib/server/git/deposit/deposit-git.ts:270`, "return run(at, ['ls-files', '-z']);", read by `sync`, `switchBranch` and `restage` of the GitHub mirror through `pathsOf`. What is wrong: before, `git ls-files` without `-z` quotes a path holding a non-ASCII byte, a quote or a control character (git's `core.quotePath`, which oculus does not set: `grep -rn -i quotepath src` finds only `unquotePath`), so `prune` did not find such a file in the listing and deleted it from the mirror's checkout, and the sync plan listed the quoted form; after, such a path is kept and listed as it is. This changes the GitHub deposit for such projects (by reading; not run), and the report names it only as a judgment call ("the mirror's sync uses the same reading") with no before and after. Failure scenario: a project with `code/caf<e-acute>.py` syncs to a mirror that now keeps the file, and the reader sees a plan that differs from the last one with no word in the landing report; verdict: none.
- `src/lib/server/git/deposit/zenodo.ts:302-306`, "const read = await client.call('GET', `/records/${draft}`); if (!read.ok) { const held = { published: plan.doi === '' ? page : plan.doi }; return failure(...held); }", with `config/text/server.yml` `failed_published: 'Zenodo answered {2} to {1}; the record {0} is published and its DOI is written'` (and `cancelled_published`, `unanswered_published`). What is wrong: when the read after a publish fails, is cancelled or times out, nothing is written to the manifest, yet the sentence says "its DOI is written"; for a new record `{0}` is the record's page, not a DOI. The read runs under the run's Cancel signal, so a Cancel pressed after the publish answered loses the DOI. A Cancel during `POST .../actions/publish` (`zenodo.ts:209-211`) goes to `dropped`, deletes the draft and says "nothing was published", which is false when Zenodo completed the publish before the abort. The report does not state either path (rules file, every asynchronous path in flight). Failure scenario: For review of a project with no `doi`, Cancel pressed just after the publish; the record is public on Zenodo, the manifest holds no `doi`, the sentence says the DOI is written, and the next For review press makes a second public record with a second DOI, which ruling 534's one DOI from submission to publication forbids; verdict: item 5 (holds for the documented paths, this path not).
- The report's section "Visible changes for the look": "Settings, scope Primary hub or Hub, section Deposit: the rows `deposit.zenodo.address` and `deposit.zenodo.timeout_s`." What is wrong: `config/options/behavior.yml` also adds `deposit.zenodo.auth` with five fields in the same section, and the step rewrites the help of `code_availability.status`, `code_availability.date` and `publication.links` in the project form; none of them is in the look list. Failure scenario: the look on landing checks two Settings rows and passes without opening the `auth` rows editor or reading the changed help lines; verdict: none.

## Declined to judge

- The report's `first-run.ts`, not run: its case 26 block runs `git init` and `git apply` (through `applyPatch`), git commands other than the three the reviewer may run. The case 26 failure on the unchanged tree is taken from the test's quoted failure only.
- The "Case 14" block of `cases.ts` and the whole of `case14.ts`, not run: they call `adopt` and `push` with the real git (and a `push` whose remote is `https://github.com/someone/alpha` may reach a network address). Case 14 is judged by reading `push`.
- Verify 5 in its `git grep` form, not run; `grep -rn` over `src` and `config` (with `--exclude=local.yml`) stands in for it.
- "The filter the rules file names" for the checks: the rules file names none beyond the dot reporter for whole runs; `test:quick`'s own summary lines are quoted.
- Case 27, the Zenodo section's buttons, tips, Copy buttons and the off state: the look on landing.
- How Zenodo itself answers a record read of a concept id (the redirect `ZenodoClient.record` follows), the `PUT .../draft` of a new version, and the `award.title: { en }` shape: they need a request to Zenodo, which the review may not send.
- The git-write.test.ts row of case 26 belongs to no guarded entry (the report says so); whether G-entries gain a Test line for it, or a new entry, is the orchestrator's call under the rules file's rule that a new entry needs Axel's yes.
- Whether `For review` with a `doi` and no `zenodo_status` should be refused (`server.zenodo.doi_unmarked`), a shape the brief does not name and the report lists as a judgment call: the orchestrator's ruling.
- The orchestrator's question on tests of Publish, the new version of a review-anon record, a Cancel during a call and a failure after the publish: `tests/routes/git/zenodo.test.ts` and the deposit-compare row press only `zenodoReview`; no test of the step presses `zenodoPublish` with a confirm, makes a new version, cancels or fails after the publish. The brief assigns cases 5 to 8, 11, 14 and 17 to 20 to runs the report quotes, and the rules file's test rule allows a test only under a guarded entry, of which none of G1, G6, G28, G76, G79, G139 or the proposed G141 covers those paths; so no test is called for there, and the runs, rerun above, give the report's output. Whether one of those paths should earn a guarded entry is Axel's.

Reviewer usage: ac5abbf263b3dd3e6, claude-opus-5-5, 330342 tokens, 77 tool uses, 14 min 19 s.

## Repair round 1, refuted

Reviewed on `.agents/worktrees/migration-O101`, base `ce8d41683`. Delta: `diff -u` of the 14 paths of `files.txt` that differ from the snapshot, plus `src/lib/server/machine/runs/recover/files.ts` (its part of `git diff ce8d41683`) and `tests/fixtures/hubs/zenodo-world.ts` (whole, untracked). The two diagram paths in the delta are generated and were not read line by line.

Summary: every verify command passes. Of the 13 round items, 9 hold by their text, item 8 holds with Proof 1 against its closure, item 9 is partial (Standards 1), and items 7 and 11 hold. Three findings need a fix before the step is booked: Proof 1 (History), Behaviour 1 (no Cancel without a mirror), Behaviour 2 (stale status after a failed read). The rest are small and fixable at landing.

```
# Verify 1, from the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
npm run diagrams && npm run docs:palette && npm run test:quick -- --base ce8d41683
test:quick: 68 changed file(s), from git since ce8d41683
test:quick: 339 test file(s)
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (2.4 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      eslint (16.4 s)
ok      svelte-check (32.0 s): 1793374018475 COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (135.7 s): Duration  125.20s (transform 60.67s, setup 0ms, import 162.47s, tests 250.63s, environment 6ms)
ok      vitest (169.1 s): Duration  161.05s (transform 135.35s, setup 0ms, import 280.36s, tests 314.12s, environment 13.20s)
ok      vitest slow (243.9 s): Duration  235.82s (transform 14.00s, setup 0ms, import 136.59s, tests 796.63s, environment 19ms)
test:quick: 246.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
(exit 0; shasum of docs/diagrams/* and docs/palette.md before and after: diff exit 0; git status --short before and after: diff exit 0)

# Verify 2, ASCII gate over the 68 paths of git status --short
.scratch/migration/agents/reviews/O101-hub.patch:2:--- a/.oculus/data/academic/funding.yml<tab>2026-10-30 12:08:11
.scratch/migration/agents/reviews/O101-hub.patch:3:+++ b/.oculus/data/academic/funding.yml<tab>2026-10-30 12:08:34
.scratch/migration/agents/reviews/O101-hub.patch:38:--- a/.oculus/data/people/organisations.yml<tab>2026-10-30 12:08:11
.scratch/migration/agents/reviews/O101-hub.patch:39:+++ b/.oculus/data/people/organisations.yml<tab>2026-10-30 12:08:37
.scratch/migration/agents/reviews/O101-hub.patch:60:--- a/.oculus/data/people/people.yml<tab>2026-10-30 12:08:11
.scratch/migration/agents/reviews/O101-hub.patch:61:+++ b/.oculus/data/people/people.yml<tab>2026-10-30 15:55:08
.scratch/migration/agents/reviews/O101-hub.patch:73:     name: "St<e-acute>phanie M. van den Berg"
ascii exit 0
(seven lines, as the report's row 2 says; no hit in any other path)

# Verify 3
sh utils/unused-exports.sh > <scratch>/unused.txt; diff .agents/worktrees/O101-base/unused-exports.txt <scratch>/unused.txt
unused exit 0; diff exit 0; 337 lines

# Verify 4, from ~/workspace/research-hub
patch -p1 --dry-run < <worktree>/.scratch/migration/agents/reviews/O101-hub.patch
patching file '.oculus/data/academic/funding.yml'
patching file '.oculus/data/people/organisations.yml'
patching file '.oculus/data/people/people.yml'
patch exit 0

# Verify 5 (git grep is not a git command the reviewer may run; grep -rn over the same paths)
grep -rn "zenodo.org" src                          -> exit 1, nothing
grep -rn --exclude=local.yml "zenodo.org" config
config/defaults/behavior.yml:311:      address: 'https://zenodo.org/api/records/{record}'
config/defaults/behavior.yml:470:    address: https://zenodo.org/api

# Verify 7
wc -l: zenodo.ts 414, zenodo-api.ts 157, zenodo-copy.ts 287, zenodo-meta.ts 141, deposit.ts 798, deposit-git.ts 484, deposit-routes.ts 314, deposit-tree.ts 104, papers.ts 187, tests/routes/git/zenodo.test.ts 788, zenodo-answers.ts 308, zenodo-world.ts 308, Deposit.svelte 459, DepositZenodo.svelte 193, src/lib/data/model/index.ts 880
sh utils/folder-check.sh -> folder exit 0; src/lib/server/git/deposit holds 10 items; tests/fixtures/hubs holds 7

# Verify 8, history words over added lines of git diff -U0 ce8d41683 -- src tests config and the new files, comment lines and test titles
words: before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package, O101, repair round
every hit is "before" of order inside one run ("before any request", "the line end before `endstream`", "before any draft exists") or "still" of a Cancel ("a Cancel still deletes it", test title 'still writes the DOI and the share link when Cancel comes after the publish was sent'); no package id, no date

# Commands the round section quotes
npx vitest run --reporter=verbose tests/routes/git/zenodo.test.ts tests/data/hubs/website-files.test.ts
 Test Files  2 passed (2)
      Tests  75 passed (75)
npx vitest run --tagsFilter '!slow' tests/routes/git/deposit.test.ts tests/state/client/held-unsaved.test.ts
 Test Files  2 passed (2)
      Tests  41 passed (41)
diff of each changed test file against .agents/worktrees/O101-base: removed lines
config-folder 0, website-files 0 (69 added), deposit.test 1, deposit-compare 2, git-write 0 (22 added), held-unsaved 1: the report's table reproduces

# The first build's case program, the source quoted in the report's "The cases after the change", with its "Case 14" block left out, on the final tree
./node_modules/.bin/jiti <scratch>/cases/cases-nogit.ts <worktree>     -> exit 0
case 4 GET: {"ready":false}
case 4 zenodoReview: 400 Zenodo needs the downloads row zenodo of the primary hub's .oculus/local.yml, the row deposit.zenodo.auth names, so nothing was sent | calls: 0
case 5: 200 Published on Zenodo as 10.5281/zenodo.102
case 6: 200 Published on Zenodo as 10.5281/zenodo.102
case 7 no family: 400 cy has no family name in people.yml, so nothing was sent | calls: 0
case 7 name not ending with family: 400 The name of di in people.yml does not end with its family name, so nothing was sent | calls: 0
case 7 no people.yml key: 400 zed is no key of people.yml, so nothing was sent | calls: 0
case 8 no funder: 400 The funding entry G2 names no funder, so nothing was sent | calls: 0
case 8 funder naming no organisation: 400 The funder of the funding entry G3 is no key of organisations.yml, so nothing was sent | calls: 0
case 8 no funding.yml entry: 400 G9 is no key of funding.yml, so nothing was sent | calls: 0
case 11: 400 Cancelled during the upload of alpha.zip; the draft was deleted, so nothing was published
case 11 manifest unchanged: true
case 17 first: 400 Zenodo answered 500 to the share link; the record is published as 10.5281/zenodo.102 and its DOI is written
case 17 second: 200 Sent to Zenodo for review as 10.5281/zenodo.102
case 18 deposited: 400 The code is published on Zenodo as 10.5281/zenodo.102, so For review sends no anonymous copy of it | calls: 0
case 18 GitHub deposited: 200 Sent to Zenodo for review as 10.5281/zenodo.102
case 19 other DOI: 400 10.1234/other is no Zenodo DOI of the form 10.5281/zenodo.<number>, so nothing was sent | calls: 0
case 19 version DOI: 400 10.5281/zenodo.101 is a version DOI of the concept 10.5281/zenodo.102; code_availability.doi holds the concept DOI, so nothing was sent | calls: GET /api/records/101
case 20 second: 409 A run of the deposit of hub:alpha is still going, so nothing was sent to Zenodo; wait for it or cancel it
case 20 drafts made: 1

# Two reads of the wiring, a program of the reviewer's in the scratchpad that only prints (target() as hubTarget calls it from the route's options; zenodoSettings over an empty map)
./node_modules/.bin/jiti <scratch>/cases/route-target.ts <worktree>
route target changes: undefined
zenodoSettings({}) threw: Error: config/options/behavior.yml holds no entry, or no default that reads, for deposit.zenodo.auth, so deposit.zenodo.auth cannot be read

# Hub reads behind the patch (read only)
funding/2026-nwo-veni-self-explaining-hospital/preproposal/veni2026.tex:105: {Cornelissen, D., Faes, A. (2026). ...
funding/2026-nwo-veni-self-explaining-hospital/preproposal/veni2026.tex:113: {Kerga, M.A., Faes, A. (2026). ...
the lines the report cites for the other people (refs.bib:48 and :57, data.yml:162 and :168, publications.yml:400, algebraic-effects-compilation/project.yml:23) read as it quotes them
```

### Verdicts

The 13 items of the round, each against its text:

- Round 1 (the hub a press reads): holds. `zenodo.ts:89` reads `deposit.home.into.config.merged`, `Deposit.merged` is gone, `mergedOf` reads through `depositFor`, the token stays from `options.downloads`, and the row 'reaches the address of the project's own hub alone ...' is the row asked for. The report's work beyond the text, `readerAccounts` over every hub's settings, is needed: a press now reads the `auth` of the project's own hub, so a row only a second hub names would otherwise reach the Recover readers. Not a reach beyond the finding. Standards 2 (the new describe is in no guarded entry) and Standards 3 (`mergedOf`) apply.
- Round 2 (Cancel and failure around the publish): holds. `own === null` on the publish, the reads and the share link; `timedFetcher` bounds each by `REQUEST_MS`; `settled` reads the draft before deleting; the three sentences are corrected and `cancelled_published` is removed since no Cancel reaches those calls. The work beyond the text, `draft_kept`, corrects a false sentence but drops the status: Spec 1, Proof 2. Behaviour 2 is a consequence of "nothing is written".
- Round 3 (G142): holds. 26 rows in the describe, counted by reading; every row the item lists is there, in the fake; Doc text in the form of G141.
- Round 4 (ruling 595 (d)): holds. `plan.unmarked`, `isReviewCopy` after `versions/latest`, `doi_published` before any draft, `doi_unmarked` gone, and both test rows. Against real Zenodo it is unverified, see "Declined to judge".
- Round 5 (`codeLink`): holds. By reading it gives each branch of the item, and `diff` against the base shows no removed line in `website-files.test.ts`. Case 25's fourth clause and the brief's decision 11 are overruled by this item. Standards 4 on two lines it leaves narrower than the rule.
- Round 6 (`kerga`): holds. The patch has `family: "Kerga"`, the dry run passes, and the provenance lines read as `veni2026.tex:105` and `:113` print.
- Round 7 (the Recover test): holds. The test calls `GET` of the route and never calls `readerAccounts`, so the first review's Proof 2 is closed. It is not vacuous: its sibling over a second hub failed before the code with the token as the header value, as quoted in the report.
- Round 8 (History in the token test): holds by its text, and the closure the report claims does not reproduce: Proof 1.
- Round 9 (`deposit-git.ts` head comment): partial, Standards 1. The sentence on where commands run is right; the list of callers still omits `zenodo-copy.ts`.
- Round 10 (`CALL_MS`): holds. `REQUEST_MS` is exported from `recover/files.ts:45` and imported by `zenodo-api.ts:20`; boundaries green in verify 1.
- Round 11 (the fake): holds. `status`, `after`, `hold`, `held`, `seed` and `release` are each used by a test row; `seed.conceptdoi` removed.
- Round 12 (`review_link` in the template): holds. `grep` finds no `review_link` in `docs/templates.md`; stated in the report as a correction of item 14.
- Round 13 (the report): holds. ASCII row, table of changed lines, `ls-files -z` before and after, look list, G33 line are all there and reproduce. One line of the look list is false: Proof 1.

Items of the brief's "What to build", whole diff since the base:

- 1: holds, the row, its options entry, `HUB_LIST`, `OWN_HUB_KEYS`, the template line and the overlay field by field; the press and the GET now read the project's own hub (first review's Behaviour 1 closed).
- 2: holds, as in the first review; `review_link` stays out of the template by round 12.
- 3: holds, `zenodo-copy.ts` and the G141 rows, green.
- 4: holds, `zipOf`, `fflate` 0.8.3.
- 5: violated in one path, Spec 1: a failure before publish whose draft Zenodo also refuses to delete names the call and not Zenodo's status. Every other path holds, by the G142 rows and the case program; the first review's Behaviour 3 is closed.
- 6: holds, cases 5 to 8 and 19 rerun on the final tree, and the G142 rows.
- 7: holds, `zenodoAccess`, `readerAccounts`, `zenodo: { ready }`, and the token rows.
- 8: holds, `ZENODO` in `CONFIRMED`, `running.busy` before `begin`, every call through `timedFetcher`, the run's signal on every call before the publish.
- 9: holds by reading `DepositZenodo.svelte` and `deposit.yml`; what it draws is for the look. Behaviour 1 stands beside it.
- 10: holds, `MANIFEST_ACTIONS` and the G28 rows.
- 11: holds by reading, `push` unchanged.
- 12: holds, round 6.
- 13: holds, `CodeAvailability` and `Funding.award` with their normalisers.
- 14: violated narrowly, Standards 1 (a head comment the step makes false); the rest holds.
- 15: holds as amended by round 5.
- 16: holds, `git-write.ts` stdin handler and the row of `git-write.test.ts`, green in verify 1.

Cases of the brief's "Cases":

- 1: met, zenodo.test.ts first row.
- 2: met, the binary row.
- 3: met, the title and description row.
- 4: met for the GET and both POSTs, case program rerun; the buttons are for the look.
- 5: met, case program rerun and 'makes a new version of a published record ...'.
- 6: met, case program rerun and 'sends Publish ...'.
- 7: met, case program rerun.
- 8: met, case program rerun.
- 9: met: the test presses a For review that writes, requires `changes.jsonl`, and reads every file. It reads the history folder the case names; that folder has a log only because the fixture adds one, Proof 1.
- 10: met, the four rows of deposit.test.ts.
- 11: partial, the route does what the case says (test and case program), and a project with no mirror has no Cancel on the page, Behaviour 1.
- 12: met, the Recover rows through the route, and 'goes as Bearer ...'. The first review's partial is closed.
- 13: met, deposit-compare.test.ts row, slow tier green in verify 1.
- 14: met by reading (`push` writes its three fields field by field); not run, see "Declined to judge".
- 15: met, the row.
- 16: met for For review by the row; for Publish by reading (`sendingOf` calls `stagedFiles` for both kinds).
- 17: met, case program rerun and 'keeps the DOI written when the share link ...'.
- 18: met, case program rerun and 'refuses For review of a published deposit ...'.
- 19: met, case program rerun and 'refuses a version DOI ...'.
- 20: met, case program rerun.
- 21: met, the five rows.
- 22: met, the row.
- 23: met, the Latin-1, `.docx`, `.pdf` and `.7z` rows.
- 24: met, 'keeps the shipped auth and time limit ...', and now for a second hub.
- 25: met as amended by round 5: its fourth clause (a `doi` with no `zenodo_status` gives the `url`) is replaced by the DOI's address, rows 'a deposit with a DOI of another service ...' and 'a deposit with a DOI links its code ...'; the other clauses have their rows.
- 26: met, the row, slow tier green in verify 1.
- 27: not verifiable here, the look on landing.

### Findings

#### 1. Spec

- `src/lib/server/git/deposit/zenodo.ts:320-323`: "const gone = await client.call('DELETE', `/records/${draft}/draft`, undefined, null); if (!gone.ok && !('status' in gone && gone.status === 404)) { return failed(words(text, 'server.zenodo.draft_kept', call, draft)); }", with `draft_kept: 'Nothing was published after {0}, but Zenodo did not delete the draft {1}; delete it on Zenodo'`. What is wrong: this is the report's work beyond round item 2. It corrects a sentence that said "the draft was deleted" when the deletion failed, which is right to fix. But item 5 of the brief says a failure before publish "names the call that failed and Zenodo's status", and this path drops the status of the call that failed. Failure scenario: a token without `deposit:actions` gets 403 on the upload and the DELETE answers 500; the sentence says nothing of the 403, so the user deletes the draft on Zenodo and presses again into the same refusal without learning why. Verdict: item 5 violated in this path. A landing fix: carry the status, or Zenodo's answer word, into the sentence.

#### 2. Proof

- `src/lib/server/git/deposit/zenodo.ts:412`: "await recordWrite(outcome, 'manifest', into);", the report's round item 8 ("a press records in History") and its look list ("The History view: a press that writes the manifest adds a record of kind manifest, one for the DOI, the status and the date and one for the share link. Before: a press added none."). What is wrong: this closure does not reproduce on the route. `src/routes/api/(git)/deposit/+server.ts` passes `engine`, `config` and `carried` and no `into`, so `hubTarget` (`deposit.ts:189-201`) calls `target(options.engine, options.config, options.carried)` with no `server`. There `changes` is `server === undefined ? undefined : {...}` (`src/lib/server/edit/writes.ts:328-338`), and `logChanges` returns at once on `log === undefined` (`src/lib/server/core/changes.ts:402`). My run prints `route target changes: undefined`. The test sees a record only because the fixture adds a log to its target (`tests/fixtures/hubs/zenodo-world.ts:133`), which the route never has. The decision resting on it: the look at landing, and whether a press is in the change log with every other manifest write, the rules file's "the write chain, the change log". Failure scenario: the look presses For review, opens History, finds no record, and the report's row is false; on the real route a press writes `doi`, `zenodo_status` and `review_link` with no History record and no Undo. Verdict: none of the brief's items (item 7 only forbids the token in a record), and it stands against the closure of round 8. The fix is in the route: its target carries the change log, as a write's target does.
- `tests/routes/git/zenodo.test.ts:615`: "it('names the draft when Zenodo refuses to delete it', async () => {". What is wrong: a test of a behaviour the round adds, with no failure quoted from a run before its code. The report says so in its first line and in "Before and after": "written after its code, so it has no run before it". Failure scenario: a reader cannot tell from the run that the row fails without `draft_kept`; judged by reading, it would. Verdict: none.

#### 3. Standards

- `src/lib/server/git/deposit/deposit-git.ts:29-31`: "its operations are called by deposit.ts, reached only from POST /api/deposit with the write token and the page's confirm, by deposit-tree.ts, which stages a tree for deposit.ts and for the Zenodo copy (`addAll`, `lsFiles`), and by deposit-compare.ts". What is wrong: round item 9 claims this comment is rewritten to what the code does; the list of callers is closed and omits `zenodo-copy.ts:27,102`, which imports and runs `initMirror` itself (rules file, "What every package obeys", the sentence a change makes false). Failure scenario: a reader auditing who runs git in the temporary folder reads the list and misses the `git init` of `stagedFiles`; verdict: round 9 partial, item 14 violated. One clause at landing.
- `.scratch/migration/agents/reviews/O101-report.md`, "Doc text", and `tests/routes/git/zenodo.test.ts:437`: "describe('the hub a press reads', () => {". What is wrong: the rules file says a test exists only as the test of one entry of `agents/guarded.md`, named there by file and title. The Doc text names 'the Zenodo token' under G76, 'the review copy For review sends' under G141 and 'what Publish and a new version send ...' under G142; this describe of two rows, the test round item 1 asks for, is in no Test line. Failure scenario: at landing the Doc text is applied and two rows belong to no entry, so a later step finds them unowned and may delete them as orphans, which drops the check that a press reaches the project's own hub. Verdict: none. A landing fix: append the describe to G76's Test line.
- `src/lib/server/git/deposit/deposit-routes.ts:250-253`: "if (deposit.into === undefined && deposit.carried === undefined) return deposit.config ?? {}; return depositFor(id, deposit)?.home.into.config.merged ?? {};". What is wrong: the route always passes `carried`, so the first branch is reached only by `tests/routes/git/deposit.test.ts:37`, whose options hold `config` alone, and "code written only so a check passes is a finding" (rules file, "What every package obeys"). The `?? {}` is a fallback that cannot work: my run shows `zenodoSettings({})` throws. Failure scenario: a project that disappears between the state read and this read gets a 500 from the deposit GET rather than the no-project answer; verdict: none.
- `docs/templates.md:925`: "#   doi: \"\"             # the Zenodo concept DOI, written by For review and Publish", and the report's "Doc text" for `docs/data-map.md`: "zenodo_date, review_link and doi are the Zenodo deposit's". What is wrong: round item 5 states that a DOI from Figshare, OSF or any other service still reaches the website through this key, so both lines are now narrower than the rule. Failure scenario: an author with a Figshare DOI reads the template, leaves `doi` empty, and the website links the repository rather than the DOI; verdict: none. Two words at landing.
- The report's "Repair round 1", row 8: "the grep ... with the words `previously`, `used to`, `no longer`, `formerly`, `was changed`, `fixed`, `bug`, `regression`, `legacy`, `old`, `before this`, `repair`, `round`, `O101`, `reverted`, `anymore`, `earlier` prints nothing". What is wrong: the rules file's list ("No history in code or comments") holds `before`, `still`, `always has been`, `always had` and `as before`, and asks for each hit judged; the round's list leaves them out, and the round adds hits, among them the test title 'still writes the DOI and the share link when Cancel comes after the publish was sent'. My grep judges every hit as order inside one run or the "still" of a Cancel, so nothing in the diff is wrong. Failure scenario: a reader takes "prints nothing" as the rules file's check having run; verdict: none.

#### 4. Behaviour

- `src/lib/views/boards/deposit/Deposit.svelte:339-348`, in the snippet `commitBox` (`:298-354`), drawn inside `{#if now.exists}`, against `:393`: "<DepositZenodo {id} {code} ready={held.zenodo} {busy} onpress={press} />", drawn with or without a mirror. What is wrong: the only Cancel control of the view, `onclick={() => void writeDeposit('cancel', id)}`, is in the commit box, which is not drawn for a project with no mirror, and `DepositZenodo.svelte` has none. Item 3's point is that "a project with no mirror needs no Adopt", so this is the plain case of a project on Zenodo alone. The report's look list ("Cancel during the upload: ...") and the Doc text ("Cancel ends a press up to the publish") do not state it. Failure scenario: a project with no mirror, For review pressed on a large `code/`; the upload may run up to `timeout_s` (600 s), the buttons are off, no busy sentence shows, and there is nothing to press to cancel. Verdict: case 11 partial. It is small and inside the brief: move the busy line and Cancel where the Zenodo section can reach them.
- `src/lib/server/git/deposit/zenodo.ts:360-369` with `config/text/server.yml` `failed_unread` and `unanswered_unread`: "the record is published at {0} and its DOI is not written. Write the DOI from that page into code_availability.doi before pressing again". What is wrong: for a new version the manifest already holds the concept DOI, so the sentence asks for what is there, and it does not say the status is now stale. Publish over `zenodo_status: review-anon` whose read fails leaves `review-anon`, by round item 2's "nothing is written". The next For review has `unmarked` false (`zenodo.ts:107`), so `isReviewCopy` is not read and the press sends. The report's "Problems to know" names only the unmarked case. Failure scenario: Publish of a project under review, Zenodo answers 500 to the read after publishing; the user, seeing the DOI already in place, presses For review; an anonymous restricted copy becomes the latest version over the public record with the real authors, where a press under `deposited` would have been refused. Verdict: none; the code follows item 2's text, so the fix is a word for the orchestrator: for a press with a `doi`, either write the status and date from `plan.doi`, which departs from round 2's "nothing is written", or have the sentence name the status to set.

### Declined to judge

- `GET /api/records/{id}/versions/latest` on real Zenodo: not checked, since the review may send no request. This is the point I would settle first. `zenodoClient.call` sends `redirect: 'manual'` and turns any 301, 302, 303, 307 or 308 into `{ ok: false, ... }`; only `client.record` follows one. `versionOf` (`zenodo.ts:264`) reads this address through `client.call`, so a redirect answer fails every new version with "Zenodo answered 302 to the latest version ...". The fake answers 200 with the record, and the report names that answer as "the shape of the recorded answer", but the recording is of `GET /records/{id}`, not of this address, and the brief gives no answer shape for it. My recollection, not verified, is that InvenioRDM's `read_latest` answers a redirect. One `curl -i` by Axel, with a public record id, settles it; if it redirects, the fix is one line, reading it through `client.record`'s `moved`.
- Whether Zenodo's record read gives `metadata.access_right: restricted` for `access.files: restricted`, and `is_published` and the 404 of the draft read after a publish, the `PUT .../draft` of a new version, and `award.title: { en }`: each needs a request to Zenodo. The report names the first as unverified.
- A publish past the 30 s limit whose draft still reads unpublished is deleted: the report names it and says item 2 asks for it. What Zenodo does with that DELETE needs Zenodo.
- The before-runs of the round's tests ("21 failed | 53 passed (74)"), not rerun: they need the code as it stood before the round. The snapshot holds it, but putting it in place changes the worktree, which a reviewer does not do. Taken from the report's quotes; each quoted failure is consistent with the snapshot's code by reading.
- The "Case 14" block of `cases.ts` and the whole of `case14.ts`, not run: they run `adopt` and `push` with the real git, and a `push` whose remote is `https://github.com/someone/alpha` may reach a network address. Case 14 is judged by reading `push`, which the round did not change.
- `first-run.ts`, not run: its case 26 block runs `git init` and `git apply`, git commands other than the three the reviewer may run.
- Verify 5 in its `git grep` form, not run; `grep -rn` over `src` and `config` (with `--exclude=local.yml`) stands in for it.
- "The filter the rules file names" for the checks: the rules file names none beyond the dot reporter; `test:quick`'s own summary lines are quoted.
- Case 27, the Zenodo section's buttons, tips and Copy buttons, the `deposit.zenodo.auth` rows editor and the changed help lines: the look on landing.
- The two generated diagram paths of the delta, `docs/diagrams/layer-server.dot` and `.svg`: not read line by line; the shasum of `docs/diagrams/*` did not change across `npm run diagrams`, so they match the source.

Reviewer usage: a4ea25bfa861c816a, claude-opus-5-5, 356966 tokens, 50 tool uses, 15 min 34 s.

### Closed

The findings of the run over round 1, fixed on main at landing; the checks are the landing's verify run.
- Spec 1: `dropped` names the failed call and Zenodo's status, `draft_kept` carries that sentence.
- Proof 1: the deposit route passes a write target with the change log (`src/routes/api/(git)/deposit/+server.ts`), so a press reaches History on the route; `recordWrite` stands.
- Proof 2: not fixed, no fix exists: 'names the draft when Zenodo refuses to delete it' has no run before its code; judged by reading, it fails without `draft_kept`.
- Standards 1: the head comment of `deposit-git.ts` names `zenodo-copy.ts`.
- Standards 2: G76's Test line holds describe 'the hub a press reads'.
- Standards 3: `mergedOf` removed; the GET reads the project's own hub through `depositFor`, a project not found being not ready.
- Standards 4: `docs/templates.md` and the data map say `doi` is the deposit's on any service.
- Standards 5: no change: the reviewer's grep judged every hit.
- Behaviour 1: the busy line and Cancel are a snippet of `Deposit.svelte`, drawn under the Zenodo section for a project with no mirror.
- Behaviour 2: a new version keeps the `doi` it was made under, so `recorded` reads the record for a new record alone and a failed read cannot leave a stale status; row 'writes the published status of a new version with no read after its publish'.
- Declined, the latest version: `GET /api/records/10554177/versions/latest` on zenodo.org answered 301 to the record, so `versionOf` reads through `client.latest`, which follows it, and the fake answers 301.
- Declined, the record's shape: `GET /api/records?q=access_right:restricted` on zenodo.org gave `metadata.access_right: restricted`, `metadata.creators` by `name` with no type, and `conceptdoi` for restricted records, the shape `isReviewCopy` and `recorded` read.
