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
