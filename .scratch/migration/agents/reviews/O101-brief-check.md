# Step O101 brief check (on main at 709bba511)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O101.md`. Usage: ac906874df316b771 (claude-opus-5-5), 246818 tokens, 102 tool uses, 13 min 14 s.


The check started at 16ca78131. Main moved to 709bba511 ("Rule on O102's first-run cases") while it ran. That commit changes only `.scratch/` files (`git show --stat 709bba511`: `O102-cases.md`, `O102-report.md`, `choices.md`, `orchestrator-state.md`, `plan.md`, `queue.md`). The brief is untracked (`git status --short`: `?? .scratch/migration/agents/briefs/O101.md`). The plan's line numbers below are taken at 709bba511: the step line is `plan.md:1194`, 553 is `:3304`, 562 is `:3311` and 556 is `:3321`.

## Names

1. `deposit.zenodo` and `review_link` have no hit anywhere (`git grep -n -E "deposit\.zenodo"` and `git grep -n -E "review_link"` over `. ':!config/local.yml' ':!.scratch'`: no output).
2. `anonymize`: two hits, both outside the write list, and the change makes neither false. `tests/fixtures/hubs/demo/projects/active/graph-transfer/project.yml:25` is prose ("an anonymized code drop for double-blind review"). The other is inside `tests/server/machine/runs/recover/answers/zenodo/picai.body`, a recorded answer.
3. `CONFIRMED` (`git grep -n -w CONFIRMED`):
   - `git-routes.ts:7,151,478` is its own list and is unaffected.
   - Inside the write list, two comments become false when the list grows to seven. `deposit-routes.ts:7-9` says "for the five actions that can lose work (commit, push, snapshot, createBranch, switchBranch)". `Deposit.svelte:22-24` says "the five that can lose work (commit, push, snapshot, the two branch actions)". The brief names neither line.
   - `.scratch/migration/agents/guarded.md:23-24` (G6) lists only 'deposit push' as a test. Item 11 covers this through 562.
4. `ACTIONS`: the hits in `fs.ts:469`, `clone-routes.ts:37`, `git-routes.ts:83` and `stream-actions.ts:31` are separate lists. They are unaffected.
5. `downloads`: these hits outside the step's named lines become false or incomplete:
   - `docs/templates.md:578-586`, the local.yml template comment ("for the Literature search's keys and the Data view's Recover", with example rows physionet, kaggle, synapse and wos). It needs the deposit and a `zenodo` row. `docs/templates.md` is in the write list, but item 11 gives it only "the two manifest keys".
   - `src/lib/data/sources/config/local.ts:133-138` and `:155` say the rows are "the secrets the reader rows of the hubs' `.oculus/config.yml` sign in with" and the key "a reader row's `auth` entry names". `deposit.zenodo` is no reader row. The path is in the write list; the brief names neither line.
   - `config/options/local.yml:101` ("A row's service is the key an `auth` entry of a row of `literature.sources`, `recover.sources` or `venues.browser` names"). Item 1 covers it.
   - G76's text (`guarded.md:52`). Covered by 562 in item 11.
6. `family`: 299 hits (`git grep -n -w family`, saved output), nearly all the options catalog's term "a family" (a kind of setting), for example `config/options/appearance.yml:8-12`, `src/lib/data/sources/config/catalog/options.ts` (30 hits), and `config/text/findings.yml:262-268`. A `people.yml` field named `family` does not collide with any key. It does give one word two meanings in the docs and code. The only data-name use is `config/defaults/behavior.yml:615` (`parts: [given, family]`, a literature author path), which agrees with it.
7. `award`: no hit.
8. `funder` (39 hits): `data-map.md:192`, `model-entities.ts:664-712`, `merge.ts:171-179`, `normalise.ts:500` and `links.ts:107,170`. The step does not rename it. It does read it, and `merge.ts:178` drops a `funder` that names no organisation, so such an entry reads as having no funder.
9. The fields the step adds to people, funding and the project model are listed with each model's fields in places outside the write list and outside item 11's Doc text:
   - `docs/apps.md:406` (the `funding` row) and `:407` (the `people` row) list the model fields apps see.
   - `docs/templates.md:1222-1240` (the people.yml template) and `:1311-1330` (the funding.yml template) list the collection schema rows.
   - Once `family` and `award` exist, each of these lines is incomplete.
10. The deposit route's write is named by `depositedFile` (`src/lib/state/sessions/source/write-files.ts:256-263`). It answers the manifest only for `push` ("push writes the project's `code_availability` back into its manifest, and no other action writes a file"). `zenodoReview` and `zenodoPublish` also write the manifest. Without a change to this function, the refusal G28 requires, of "a write sent from any view ... over a file a source tab of the page holds unsaved text of" (`guarded.md:83-84`, which names `write-files.ts`), is skipped for both actions. The file is outside "Paths this step writes" and the brief never names it.
11. `src/lib/state/client/writes.svelte.ts:677-682` says "One deposit action on one project: adopt, plan, commit, push, snapshot, or a branch". This becomes incomplete. It is outside the write list.

## The step line

Each part of `plan.md:1194` is mapped to the item of "What to build" that serves it:
- "through Zenodo's REST API, built on the Deposit view": items 5, 6, 8 and 9.
- "uploads a copy of `code/` with the terms ... replaced in file names and contents": items 2, 3 and 4.
- "author 'Anonymous'": item 5.
- "a restricted record with a share link for reviewers": item 5.
- "a new version of the same record carries the real files and the names from ... lead, collaborators and supervisors": item 6.
- "its grant from `funding:`": items 6 and 10.
- "the DOI is recorded in `code_availability.doi`": items 5 and 6.
- "Zenodo's address ships in oculus's defaults": item 1.
- "the token in the gitignored local configuration": item 7.
- "Zenodo section with two buttons ... each with a tip": item 9.
- "Runs after O97 and O99": both are ticked (`grep -n -E "^- \S+ O9[79] "`: `890:- [x] O99`, `894:- [x] O97`).

Findings:
1. "handled as the calendar link is" has no requirement. Ruling 556 (a) puts the token in a `downloads` row and chose against (c), a file in `~/.oculus/connect/`. The brief does not say that 556 replaces this phrase.
2. Ruling 553 (a) dictates `deposit.zenodo: https://zenodo.org/api`, a string. Decision 1 makes it a row `{ address, auth }`, which 556 (a) ("the shipped `deposit.zenodo` row (553)") supports. The decision is stated, so this is no silent change.
3. Ruling 534's "one DOI from submission to publication" has no requirement that guards it. Item 5 writes `code_availability.doi` on every For review press, so a For review press on a project that already holds a DOI replaces it (see Implied inputs 4).

## Premises

1. The deposit folder holds 5 items (`ls src/lib/server/git/deposit | wc -l`: 5). `ACTIONS` is `deposit-routes.ts:53-64` and `CONFIRMED` is `:67` with five actions. The route builds `plans`, `engine`, `config`, `carried` and `credentials` (`cat "src/routes/api/(git)/deposit/+server.ts"`). These hold.
2. `push` is `deposit.ts:418-461` and holds. `depositFor` is `:242-280`; it names the repository from `repo`, else the url's last segment, "else the project id" (`deposit.ts:263-268`). The brief omits that third fallback, which matters for the zip name (Implied inputs 7).
3. "`commit` refuses while the secret scan finds a secret (`deposit.ts:395-400`)": the check is at `:398-403`, `planned.plan.findings.length > 0`. That is any finding, a large file and a missing README.md included (`deposit-scan.ts:15-27`), not secrets alone.
4. "What ships is `code/` minus `__pycache__`, `*.pyc` and `.git`, with the patterns of `code/.gitignore` and `code/.depositignore`" leaves out two facts:
   - `attic/` is added when there is no `.depositignore` (`deposit.ts:749`).
   - The shipped list is git's answer in the mirror (`restage`, `deposit.ts:688-700`: copy, `writeIgnore`, `addAll`, `lsFiles`, `prune`), with a generated `.gitignore` in it.
   - No gitignore matcher exists in `src` (`git grep -n -i "gitignore\b" -- src`: only `worktrees.ts:65` `ignoresWorktrees`, which reads one rule), and none is in `package.json`. So "the files the GitHub deposit would ship" can only come from the mirror, after Adopt, or from a hand-written matcher. The brief names neither.
5. The 20 manifests, 15 with a url, none with a doi, and the statuses deposited 14, none 5 and review-anon 1 hold (a `python3 -I` pass over the hub's 122 `project.yml`: "20 with code_availability; 15 url; 0 doi; {'deposited': 14, 'review-anon': 1, 'none': 5}"). The funding keys `ZonMw-AI-HCC`, `FAIR` and `FWO-PhD` hold (`grep -rh "^funding:" --include=project.yml .`).
6. `manifest-schema.yml:68-76` holds the nine `code_availability` rows. The brief does not say that the schema's widget types (`text`, `textarea`, `lines`, `select`, `chips`, `tags`, `date`, `checkbox`, `keymap`, `readonly`; `manifest-schema.yml:9-13`) have none that writes a list of rows `{ term, as }`. `keymap` is "a map the form does not write".
7. `Deposit.svelte` is 438 lines with `AskConfirm` at line 377, and its folder holds 4 items. `deposit.yml` exists. These hold (`wc -l`, `ls`).
8. `applyAuth` is `request.ts:42-79`. `Auth` is `grammar.ts:262-270` and `authShape` is `:278-286`. `authShape` is not exported (`grep -n authShape -r src`: only `grammar.ts:278,468`). The Recover route's `downloads: () => server.local.downloads` is `recover/+server.ts:38`. The Synapse row is `behavior.yml:236-246`. These hold. The `downloads` help is `config/options/local.yml:98-104`, read with `sed -n 95,106p` (see Declined to judge 1).
9. `timedFetcher` is in `timed.ts`. It holds, and its callers are `call.ts`, `calendar/poll.ts`, `mail/poll.ts` and `root/context.ts:636`.
10. funding.yml: `funder` is in the schema (`funding.yml:9`) and set on no entry, `award` is absent, and there are 11 entries (`grep -n "^  -"`). organisations.yml holds the 8 keys named. people.yml's schema is `:7-18` with no `family`. These hold.
11. Folder counts: `src/lib/server`, `src/routes/api` and `src/lib/server/git` hold 10 each. That holds. The brief does not name three more full folders: `tests/server/git` (10), `src/lib/data/sources/config` (10, where the brief puts "the reader of `deposit.zenodo`") and `src/lib/data/sources/config/settings` (10), all from `git ls-files` counts.
12. The O102 overlap is wider than the brief says:
    - The O102 brief writes `funding.yml` too (`O102.md:61-62`: the entries "gain the same fields", "`FWO-PhD`"; `role` and `min`).
    - It writes `src/lib/data/` model and normalising for `funding.yml` and `people.yml` (`O102.md:119`).
    - Its cases ruling gives six `people.yml` entries full names (`O102-cases.md:12`, "F, full names", people.yml `:62`, `:116`, `:128`, `:133`, `:138`, `:148`, which are `peeters`, `dongho`, `matteo`, `mohsen`, `ward` and `do`).
    - Three of those (`peeters`, `dongho`, `ward`) are persons this step's patch gives `family`. Both patches change the same entries, the patches are written against the hub as it is, and whichever lands second may not apply.
13. The base copy `.agents/worktrees/O101-base/` and its `unused-exports.txt` do not exist yet (`ls .agents/worktrees/`: `gate`, `migration-O102`, `O102-base`).
14. Doc paragraphs: `grep -n -i "deposit" docs/HELP.md README.md` prints 7 lines (85, 268, 297, 301, 313, 513, 554), where the brief lists 3. Lines 297 (the card's Deposit action), 301 ("Code: deposited") and 513 ("Nothing force-pushes except a deposit's snapshot") read as still true. Line 554 is about the opacity of a diff. There is no `docs/DESIGN.md` (`ls docs`).
15. The templates test premise holds for the manifest keys. The brief leaves out its first case, 'shows every key of a hub settings file in the config.yml template, and no other' (`templates.test.ts:63-66`, `hubKeys()`). A `deposit.zenodo` row in HUB_LIST needs a line in the `## config.yml` template, or that case is red. Item 11 names only "the two manifest keys".
16. Verify 5 cannot pass on main. `git grep -n "zenodo.org" -- src tests ':!config/local.yml'` prints 7 lines, among them `tests/server/core/reader/reader.test.ts:598`, `tests/server/core/reader/rows.yml:568`, `tests/server/machine/runs/recover/sources.test.ts:67` and the recorded answers under `tests/server/machine/runs/recover/answers/zenodo/`. The address is also already in the defaults beside it, at `config/defaults/behavior.yml:309` (the Recover `zenodo` row).
17. The Zenodo API facts (endpoints, `access`, share links, the parent DOI, the required metadata, the zip advice) and the npm facts for `fflate` 0.8.3 and `zenodo` 4.1.1 were not checked (Declined to judge 2). `node_modules/fflate` is absent (`ls`).

## Cases and checks

1. Case 13 is tied to G79. G79's text is "A deposit acts on the `code/` of the project's own folder wherever the project is read from" (`guarded.md:168`). A refusal for a missing `code/` is no part of that guarantee. The row that would belong to G79 is the review copy read from the project's own `code/` in either placement (the existing 'syncs the code folder of the project folder, never the one under .oculus').
2. Case 14 asks the builder to check `push` (`deposit.ts:418-461`), a function the step does not need to change. On the unchanged tree `push` writes only `status`, `url` and `date` (`deposit.ts:450-454`), so the case passes whatever the step builds. It is silent on what `push` does to `status: review-anon` (see Implied inputs 13).
3. Case 12, "a fixture row whose address differs receives the token nowhere else", does not say which row: a second `deposit.zenodo`, a Recover row named `zenodo`, or an answer's `links`. A builder cannot write it from the text alone.
4. Case 1 puts "Faes" and "University of Twente" in a test fixture. The brief's Conventions (line 118) say "no person's name in code" and attribute it to "The rules file's, unchanged". `spec.md` holds no such rule (`grep -n -i "person's name\|vocabulary" spec.md`: only `:18`, "a vocabulary or attribute value"). Either the convention is wrongly attributed, or case 1 breaks it.
5. Item 10 has the builder write the patch file as the output of `diff -ruN a b`. That is a shell redirect into a file, which `spec.md:65` counts as a script needing approval, and the brief quotes none (it says "No script is written ... other than a script the step builds").
6. The tests for G141, the widened G6 and G76, the new G1 rows and the case 13 row are named under an entry only once the Doc text lands. `spec.md:59` says "`agents/guarded.md` names it there by file and title". Item 11 asks for G141, G6 and G76 (562 (a)), not G1's or G79's Test lines.
7. Cases 4 (buttons off, the tip) and 9 (the view's sentence) are partly page behaviour. The brief sends the section to the look ("The Zenodo section is read at the look"), as `spec.md:64,66` ask. This holds.

## The question

1. Every case runs against a fake fetch whose answers the builder writes from the brief's own description of InvenioRDM. Each case can pass while the real fields differ, for example where the concept DOI sits in the publish answer, the share link's `token` field, `access.files: restricted`, or whether a new version imports files at all. The case would still pass and no deposit would work. The tree's Recover tests use recorded answers (`tests/server/machine/runs/recover/answers/zenodo/*.body`), and the brief names no recorded or documented answer shape for the fake.
2. Item 3 and cases 1 and 2 can pass with a hand-written approximation of git's ignore rules (negation, `**`, directory patterns, `attic/`) that ships a file the GitHub deposit excludes. A data file kept out of GitHub would then reach Zenodo, and the goal "the files the GitHub deposit would ship" is not met (Premises 4).
3. Case 2 and item 3 pass while a compressed binary (`.pdf`, `.docx`, `.npz`, `.pkl`, `.zip`) holds a term in compressed form. The byte check, as ruled in 552, cannot see it, and the brief names the risk nowhere.
4. Case 9 ("the token is in no answer or log line") passes if the test reads only the answer. Nothing names how the log and the History record are captured.
5. Case 14 passes on the unchanged tree (Cases and checks 2).
6. Verify 4 (the patch applies) passes with an invented `family` for `dongho` and `ward` (Implied inputs 14).
7. Verify 5 cannot pass (Premises 16).
8. Item 11 and the templates test pass while the people.yml and funding.yml templates of `docs/templates.md` and `docs/apps.md:406-407` stay without `family` and `award`, since no test reads those lines (Names 9).
9. Item 5 and cases 1 and 9 pass while a failure after `publish` (the share link, or `writeManifest`) leaves a published record whose DOI the manifest never holds, since the draft is gone and "deletes the draft" no longer applies (Implied inputs 3).
10. Item 7 and case 4 pass for the server half. The page half (buttons off) has no stated way for the page to learn that the row exists without its value (Implied inputs 15).

## Implied inputs

Each item gives the input, whether a case covers it, and the result that should be expected.

1. A project with no mirror yet. No case covers it. If the file list comes from the mirror, For review and Publish should either refuse and name Adopt or build the list themselves. The brief says neither (Premises 4).
2. A scan finding in `code/` (`.env`, `id_rsa`, a `.pem`, a file over 25 MB, no README.md). No case covers it. A commit is refused for it (G30, `deposit.ts:398-403`). A Zenodo record cannot be withdrawn once published, so the expected result is a refusal of both actions before any request, naming the file.
3. A failure after `publish` (the share link answers 4xx, `writeManifest` refuses, or Cancel arrives after publish). No case covers it. The draft can no longer be deleted. The expected result is that the DOI is written anyway, or that the sentence names the published record's DOI, so a second press does not make a second record.
4. For review on a project that already holds a `doi` (after a first review, or after Publish). No case covers it. Item 5 always makes a new record and writes its concept DOI over the old one, which breaks 534's "one DOI from submission to publication". The expected result is a refusal while `status: deposited`, and a defined result (a new version of the review record, or a refusal) after a first review.
5. Two presses at once from two pages. No case covers it. `createRunningGit().begin` lets a second run of the same key go on with an un-abortable signal (`running.ts:33-37`), so two drafts and records are made. The expected result is that the second press is refused while one runs.
6. A `doi` that names no Zenodo record (not `10.5281/zenodo.<n>`), or a version DOI typed in place of the concept DOI. No case covers it. The expected result is a refusal naming the DOI before any request. The brief also never says how the record id for `versions/latest` is read from the DOI.
7. A term in the zip's name `<repo>.zip`. No case covers it. With no `repo` and no url the name is the project id (`deposit.ts:263-268`), and ids hold people's keys (for example `ward-bttr-crosssubject`). For a project already on GitHub, the zip name is the public repository's name. The expected result is the zip name replaced like any file name. Whether the zip's root is `code/` (case 1) is not said in item 4.
8. Term edge cases: an empty `term` (a case-insensitive replace of "" inserts `as` between every character), a term with regular-expression characters ("C++", "(FAIR)"), overlapping terms ("University of Twente" and "Twente"), a term inside a folder name, and a term in an `as`. No case covers them. The expected results are that an empty term is refused by name, matching is literal, the longest term goes first, and each path segment is replaced.
9. Two files whose names become one after replacement (`Faes.py` and `Anonymous.py`). No case covers it. The expected result is a refusal naming both, since a zip cannot hold both.
10. A text file that is not UTF-8 (Latin-1) holding an accented term ("Stephanie" written with an e-acute). No case covers it. It counts as binary under decision 5, and its bytes do not hold the UTF-8 form of the term, so it passes. The expected result is a refusal, or this stated as a known limit.
11. A large `code/` (`results/` and `figures/` ship unless ignored, `deposit.ts:574`). No case covers it. The whole zip is held in memory, and the `timedFetcher` limit covers the whole answer. The brief names no time limit and no config key for one (`spec.md:54`), so an upload can time out where its size calls for a longer limit.
12. A person in `lead`, `collaborators` or `supervisors` who is no `people.yml` key, or who is held by another hub of the workspace (`merge.ts` merges people). A `funding:` key that names no `funding.yml` entry. A `funder` that names no organisation (`merge.ts:178` drops it). No case covers them. The expected result is a refusal naming the key, and a sentence for the dropped funder that says it names no organisation, since "no `funder`" would be wrong.
13. A GitHub push after a Zenodo deposit. Case 14 covers only `doi` and `review_link`. For a private repository `push` writes `status: review-anon` (`deposit.ts:447`) over a Zenodo `deposited`. For a public one it writes `deposited` over a Zenodo `review-anon`. The status word is now shared by the two deposits, and 534 replaces Anonymous GitHub for review. The expected result needs a ruling or a stated rule.
14. A person whose `name` is one word, or whose `family` is not the end of `name`. This has happened in the hub. `dongho` ("Dongho") and `ward` ("Ward") are leads of manifests with a `code_availability` block (`projects/manuscripts/ward-bttr-crosssubject/project.yml`, `projects/archive/published/2026/dongho-ecg-clustering/project.yml`, both `deposited`). The hub holds no family name for them, so item 10 cannot fill `family` for them without inventing one. Their full names come from O102's patch (Premises 12). Item 6's "`given_name` the rest of `name`" is undefined for these inputs. The expected results are a defined given name, or none, for a one-word name, and a patch that waits on O102's names.
15. How the page learns that the `zenodo` row exists, and what the `doi` and `review_link` shown in the section are read from. No case covers it. `MirrorState` and `CodeAvailability` (`model-entities.ts:198-204,240`) carry neither, and `normalise.ts:182-190` reads only `status`, `date`, `url`, `doi` and `repo`. Reading `family` and `award` through the snapshot needs `Person` (`model-entities.ts:631-660`), `person()` (`normalise.ts:378-391`) and the funding normaliser (`normalise.ts:500`). All of these are under `src/lib/data/model/` and `src/lib/data/snapshot/`, outside "Paths this step writes", and O102 writes `src/lib/data/` too.
16. A hub that lays only `address` over `deposit.zenodo` (a sandbox), or a Recover row named `zenodo` given an `auth` that names the `zenodo` row. No case covers them. The first should keep the shipped `auth` under the merge rules, which the brief does not state. The second should send the token to the Recover reader, which G76's widening ("only to the `deposit.zenodo` address") would forbid and nothing checks.
17. Where the review link's record address comes from: built from `deposit.zenodo`'s `/api` address, or taken from the answer's links. No case covers it. If it comes from the answer, item 8's "every request goes to the address of `deposit.zenodo`" must also hold for any address read from an answer.

## ADRs

1. `ls docs/adr` prints "ls: docs/adr: No such file or directory". No record is in force.

## Dictated text

1. `grep -n "Personal access tokens" O101.md` gives 32. The `help` is described in angle brackets, not dictated word for word. It holds against the prose rules. Whether the scope names `deposit:write` and `deposit:actions` are Zenodo's current ones was not checked (Declined to judge 2).
2. `grep -n '"Anonymous" when' O101.md` gives 33 ("Anonymous" when `as` is absent). It holds.
3. `grep -n 'section "Zenodo"' O101.md` gives 40: the section "Zenodo", the buttons "For review" and "Publish", and the tips "an anonymised copy of `code/`, author Anonymous, files open by a share link" and "the real files and authors, public". These hold against `spec.md:21` (ASCII, no dash, no 'not X but Y'). "anonymised" and the key `anonymize` differ in spelling, which no rule of the rules file covers.
4. `grep -n "FAES lab" O101.md` gives 46 (case 1's fixture words "FAES lab", "University of Twente", "a university"). These break the brief's own Conventions line 118 ("no person's name in code"), which the rules file does not hold (Cases and checks 4).
5. `grep -n "zenodoReview" O101.md` gives 39 and 97 (`zenodoReview`, `zenodoPublish`). They hold, in the camelCase of `createBranch` and `switchBranch`.
6. `grep -n "award: 1157019N" O101.md` gives 41. The organisation names "ZonMw", "the Flemish Government" and "the Research Foundation Flanders, FWO" hold. `FWO-PhD`'s statement names the funder "National Fund for Scientific Research - Flanders" (`funding.yml:135`), so the organisation's `name` differs from the statement's words.
7. `grep -n "Everything in the brief is done" O101.md` gives 138. It holds.
8. `LC_ALL=C grep -n '[^ -~]' O101.md` prints nothing, so the brief is ASCII.

## Declined to judge

1. I read `config/options/local.yml` lines 95 to 106 with `sed -n 95,106p` to check the premise the brief cites there (`:98-104`). The file's basename is `local.yml`, which the task says never to read. It is the options catalog (help text and field kinds), and it holds no secret value. No other file named `local.yml` was read, and nothing under `~/.oculus/connect/`.
2. The Zenodo and InvenioRDM facts of the brief (the endpoints, `access` values, share-link answers, the parent DOI, the required fields, whether a new version imports files, the token scopes) and the npm facts (`fflate` 0.8.3, `zenodo` 4.1.1, `yazl` 3.3.1, their licences and dates). Checking them needs zenodo.org or npm, and no network address may be contacted.
3. Whether the funding and award shape the brief gives (funder by name, award by title and number) is accepted by Zenodo for a funder outside its vocabulary. This needs the live API.
4. The `docs/data-map.md` replacement lines. Item 11 hands them to the builder's Doc text, so there is no text to read yet.

## Closed

Every finding is closed by a change to `agents/briefs/O101.md`. Rulings 572, 574, 578 to 582 and 584 are taken in automode (Z1076 to Z1083). The fixes of 573, 575, 576, 577 and 583 add requirements beyond the step's line, so under the standing demand on brief checks they are open items for Axel, the brief holding the recommendation of each until he rules.

- Names 1, 2, 4, 6, 7 and 8: no change needed; `family` keeps the word of `behavior.yml:615`, its one data-name use.
- Names 3 and 11, Names 5 and 9: the false comments (`deposit-routes.ts:5-9`, `Deposit.svelte:22-24`, `writes.svelte.ts:677-682`, `local.ts:133-138,155`) and the template lines (`docs/templates.md:578-586,1222-1240,1311-1330`) are named in item 14 and in the paths; `docs/apps.md:406-407` joins the report's Doc text.
- Names 10: item 10 makes `depositedFile` answer the manifest for both actions (G28), with its path and test.
- The step line 1: 556 replaces "handled as the calendar link is"; item 7 carries 556. The step line 2: decision 1 states the row. The step line 3: 574, item 5 and case 18.
- Premises 2 to 4: "What is on the tree" gives the project-id fallback, the scan's findings and git's file list; 572, 573 and 579 decide them. Premises 6: 583 and item 2. Premises 11: the full folders listed, the paths say where new files go. Premises 12: the overlap and 584. Premises 13: made at Steps 8. Premises 14: the seven doc lines. Premises 15: item 1 and item 14 add the `## config.yml` line. Premises 16: verify 5 rewritten. Premises 17: the documented calls read for the brief are quoted under "What is on the tree", with the correction that a new version holds no files until imported, so item 6 uploads to an empty draft.
- Cases and checks 1: case 13 rewritten to G79's guarantee. 2: case 14 rewritten to 575, which the unchanged tree fails. 3: case 12 names the Recover row. 4: the fixture terms are invented words, and the Conventions line no longer claims a rule the rules file does not hold. 5: item 12 builds the `diff` command. 6: item 14 asks the Test line of every entry. 7: holds.
- The question 1: fake answers follow the quoted documented shapes and the recorded `picai.body`, and the report names the shape of each (decision 6 reads `conceptdoi`). 2: 572. 3: 576. 4: case 9 names how the log and the History record are read. 5 to 7: cases 14 and 24, item 12 with 584, verify 5. 8: item 14. 9: 581 and case 17. 10: item 7 and decision 7.
- Implied inputs 1 to 17: 572; 573 and case 16; 581 and case 17; 574 and case 18; 580 and case 20; 582 and case 19; 579 and case 21; item 2 and case 21; case 22; 577 and case 23; 578; item 6 and cases 7 and 8; 575 and case 14; 584 and item 12; item 7, item 13 and decision 7; item 1 and case 24, decision 8 and case 12; decision 9 and item 9.
- Dictated text 3: "anonymised" stays in the tip as English prose; the key keeps `anonymize`, the schema's spelling. Dictated text 6: the organisation's `name` is the funder's current name; the statement is unchanged.
- Declined to judge 1: the options catalog `config/options/local.yml` holds no secret and is in the step's paths. Declined to judge 2 and 3: read by the orchestrator in the InvenioRDM documentation for this brief, as quoted under "What is on the tree".
