# O102 review (refuter)

## The checks the brief's "Verify before you report" names, as they printed

Verify 1, run from the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. `npm run diagrams && npm run docs:palette` exited 0. A `diff -r` and `cmp` of `docs/diagrams/` and `docs/palette.md` against copies taken just before the run printed `SAME`, so the run changed no file. Then `npm run test:quick -- --base bd8ad0a08` exited 0:
```
test:quick: 117 changed file(s), from git since bd8ad0a08
test:quick: 335 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (2.7 s)
ok      svelte-check (17.1 s): 1793326191058 COMPLETED 570 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (181.1 s): Duration  171.23s (transform 49.25s, setup 0ms, import 200.68s, tests 375.03s, environment 5ms)
ok      vitest (194.1 s): Duration  184.94s (transform 134.54s, setup 0ms, import 292.77s, tests 403.34s, environment 18.96s)
ok      vitest slow (282.8 s): Duration  273.75s (transform 22.20s, setup 0ms, import 157.99s, tests 925.09s, environment 19ms)
test:quick: 285.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
```

Verify 2. I ran the ASCII gate (the brief's perl line) over the 111 changed and new files `git status --short` lists, the two patches left out:
- With the report included, it prints only lines of `.scratch/migration/agents/reviews/O102-report.md` in the worktree, for example `:38: <heavy right-pointing angle quotation mark> |unit| ...` and `:68: ... <horizontal ellipsis>(111) ...`.
- With the report excluded, it prints 0 lines.
- The main ledger's copy of the report gives 0 lines under `LC_ALL=C grep -c '[^ -~]'`.
- The added lines of the hub patch hold `14 <plus-minus sign>`, `1 <euro sign>` and `4 <e with acute>`. This is the same count the report gives.

Verify 3. `sh utils/unused-exports.sh` against `../O102-base/unused-exports.txt`:
```
1c1
< Unused exports (228)
---
> Unused exports (227)
30d29
< src/lib/server/content/audit/publications.ts: normalTitle, titleWords, jaccard
32c31
< src/lib/server/content/audit/scan.ts: signatureOf, firstMarker, jaccard, normalTitle, titleWords
---
> src/lib/server/content/audit/scan.ts: signatureOf, firstMarker
```

Verify 4. `git grep -n "audit\.website\|jaccard\|normalTitle\|titleWords\|STOPWORDS\|CareerPanel\|career-rows" -- src config tests ':!config/local.yml'` prints nothing and exits 1.

Verify 5, case 1. I copied the hub's manifests and `.oculus` (without `local.yml`) and the website into `scratchpad/o102-refute/hub`, applied both patches with `patch -p1`, and ran the builder's program `run.mts` from my scratch with `./node_modules/.bin/jiti`. The output is the same as the report's:
```
== config check findings: 0
self: research-hub:axel-faes
website folder: side-projects/theaxec.github.io | kinds: 10
== problems of the build: 0
== _data/data.yml: 0 differences
== _data/publications.yml: 4 differences
- at papers-in-review.papers.0.pub_post   generated: "(Under review)"  on disk: "(Under Review)"
- at conference.papers.3.book   generated: "...(FLLM2025), Symposium on Federated Learning and Intelligent Computing Systems (FLICS 2025)"  on disk: "...(FLLM2025)"
- at conference.papers.3.pub_post   generated: undefined  on disk: "[Symposium on ... (FLICS 2025)]"
- at other-publications.papers.0.pub_date   generated: 2017  on disk: undefined
== _data/industry.yml: 0 differences
key order inside an entry that the first write changes: 24 / 48 / 36
```

The same program over the unpatched copy, diffed against the patched run from `== audit` on:
- audit findings go from 121 to 122;
- the `[conform] ... audit.website` line goes;
- one `[publink] ... first at papers-in-review.papers.0.pub_post` line comes;
- one `Bioinformatics ... (2024-2025) | link path missing` line comes. It is a finding of the copy alone: `ls` shows `education/courses/bioinformatics` in the real hub.
- data check findings go from 1 to 21: 19 `events.yml ... entries[8..26].link is required while role is present` and `funding entry ELIXIR-BE is contributing and has no statement`.

My copy has no deck finding, since I copied `.oculus` whole. Case 15 over the unpatched copy: `config check findings: 1 ... audit.website is not one the hub's settings file takes; it is not applied`.

Verify 6, the patch dry runs:
- From `~/workspace/research-hub`: `patch -p1 --dry-run < .../O102-hub.patch` exits 0. Its lines, counted by `awk '{print $1,$2}' | sort | uniq -c`, are `69 patching file` and nothing else.
- From the website: `patching file '_data/website.yml'` and `patching file '_includes/site/head.html'`, exit 0.

`git status --short` of the hub and of the website prints nothing afterwards.

Verify 8:
- `sh utils/folder-check.sh` exits 0.
- `wc -l` over the changed `.ts`, `.js`, `.mjs`, `.sh` and `.css` files: none is over 880.
- Over the `.svelte` files: none is over 520.
- The largest are `src/lib/data/model/index.ts` 879 (871 on the base), `src/lib/state/client/context.ts` 871 (855 on the base) and `src/lib/server/machine/pty/sessions.ts` 863 (unchanged).

## The commands the report quotes, run again

- Case 1, the dry runs, unused exports, verify 4, folder check and sizes reproduce, as quoted above.
- Case 19's premise correction holds. `python3 -c "import yaml; print(repr(yaml.safe_load('d: 2018-01-01 15:59:00-0400')['d']))"` prints `'2018-01-01 15:59:00-0400'`, a string.
- The base run of the new and changed tests: I reran `tests/data/sources/career.test.ts` in the builder's `basetest`. It holds the base `src` with the new tests and fixtures (`cmp` of the test and of the demo `career.yml` against the worktree: equal). Result: `Tests 1 failed | 15 passed (16)`. The one red is 'types the strategy alone...'. All five rows of describe "the Career view's lists" pass on the base (see P1).
- The Jekyll build of the website before and after was not rerun. By reading instead:
  - after the patch, `grep -rni "axel|faes|theaxec|scholar.google|linkedin.com|orcid.org|github.com/TheAxeC|utwente.nl|[at]" _includes _layouts` prints nothing;
  - `home.social` holds scholar, orcid, github, linkedin and email in that order, so `sameAs` gets the four non-email links in the old order.
- The `run/before` deck line and the four verify-list runs are the builder's own runs and cannot be rerun.

## Verdicts per item of "What to build"

1. Publication record: holds. `publication.*` is in `config/schemas/manifest-schema.yml:91-99` under section Website with help. It is read by `normalise-parts/publication.ts`, and 48 manifests carry it (a python count over the patched copy).
2. Generated fields: violated, findings S1 and S6. The section, `order`, `Code` link, `hide` and refusals work on the data (case 1 and the table test). But `pub_pre`, `pub_post` and the `order` gate are new fields of the hub's `website.kinds` rows. Item 2 states them as a rule of the stage. One record carries no `rank`.
3. Stage `accepted`: holds. It is at `config/catalogs/vocab.yml:73` with `terminal`, `placed` and `public`, before `published`, and the `publications` and `other-outputs` rows name it. The flags not given (`live`, `on_map`, `pauses_countdown`, `deadline_met`) match `published`, which carries none of them.
4. CV homes: violated, findings S2, S3, S4 and S5. The CV's name comes from `website.yml` `given_name`/`family_name`, not from the `self` people entry. Several new data keys are neither named nor reported. Ruling B's titles are not listed with old and new. Hub text reworded by hand is not listed.
5. Generator: holds. `website/files.ts`, `papers.ts`, `cv.ts` and `site.ts` build all three files whole with the header line (case 1, and the table row 'each of the three files opens...'), and the generator names no person (grep over `src` and `config`).
6. Hub setting: holds. `config/defaults/behavior.yml` has `website: { folder: '', cv: '', kinds: [] }`; its options, HUB_LIST rows and readers are in place; `audit.website` is removed (verify 4). The extra row fields fall under S1.
7. Write the website: holds by reading and by `tests/routes/sessions/website.test.ts`. What is drawn waits for the look.
8. Audit: holds. `publications.ts` compares the three files, the watcher watches them through `siteFiles`, and the title match is removed.
9. Career view: holds in code. `views/academic/career/Career.svelte` is registered, at `layout.yml:118`, and the panel and its code are deleted. Its G32 test proves nothing of the view (P1).
10. Website pass: holds. See the grep above.
11. Usage header row: holds by reading. `--group-strip: 0px` is in `Usage.svelte`, `hpc/Capacity.svelte`, `hpc/Login.svelte` and `hpc/Recent.svelte`. The look is still owed.
12. Data moved once: holds. Both patches apply clean. Findings B1, B2 and B3 are about the patch's content.
13. Docs: partial, findings St2, St3 and P2. `docs/templates.md` is written, but the Doc text carries a false G139 sentence, misses `HELP.md:295`'s stage list, and lacks the G32 Test line for the new normalise row.

## Verdicts per case

1. Met (reproduced).
2. Met: exactly the four differences plus the header lines.
3. Met: table row 'a deposit with a DOI...'.
4. Met: 'code under anonymous review is not linked'.
5. Met: 'an accepted journal paper...'.
6. Met: 'a research line the website's file lacks...'.
7. Met: 'hide is written through...'.
8. Met at the route ('writes nothing and runs nothing while the user is not known') and in the audit ('name a user who is not known and compare no file'). The button's off state and tip cannot be checked here; that waits for the look.
9. Met: route row 'writes nothing while website.folder...' and audit row 'check nothing while the setting names no folder...'.
10. Met at the route (exit 2 read back, three records, each undone). The sentence under the button waits for the look.
11. Met: audit rows 'find nothing...' and 'name a file whose authors differ...', and `website-watch.test.ts`.
12. Met: 'writes none of the three when the writer cannot take one...' and 'puts the files it wrote back...'.
13. Met: 'is refused with the sentence that the command runs...'.
14. Met: 'asks for the approval...'.
15. Met by the case 1 program's config check (1 finding before, 0 after), as quoted.
16. Met: 'a reference naming no person...'.
17. Met: 'a stopped paper and a paper that names the user in none of its teams...'.
18. Met: 'a deposit whose DOI is empty or null...'.
19. Met, under the corrected premise: PyYAML reads the text as a string, as the python run shows.
20. Not verifiable here. `Person.svelte:134` reads `link.url`; the look settles it.
21. Not verifiable here (the look).

## Findings

### Spec

- **S1. `website.kinds` rows gain `order`, `pub_pre` and `pub_post`.** Item 2 states the words as a rule of the stage. Places: `src/lib/data/sources/config/settings/files.ts` `websiteKindShape`, `papers.ts` `entryOf`, the hub patch's `.oculus/config.yml`:
  ```
  + const websiteKindShape = z.object({ kind: ..., title: ..., stages: ..., forms: ..., order: z.boolean().optional(), pub_pre: z.string().optional(), pub_post: z.string().optional() });
  +     - { kind: papers-in-review, title: Papers in Review, stages: [submitted], order: true, pub_pre: "Submitted to ", pub_post: "(Under review)" }
  ```
  Item 2 names the words per stage (submitted, the in-preparation stages, accepted, done) and limits `order` to the four paper sections. The builder moved both into three new hub settings fields, an unnamed user-visible config shape (spec, "No silent design decisions"). Ruling C rules one section per row, not these fields. The report lists `order: true` as a judgment call; `pub_pre` and `pub_post` are not listed.
  Failure: a hub that adds a row for `accepted` thesis papers gets no `(Accepted)`. A row whose `pub_post` is mistyped gives wrong words with no finding. Item 2's stage rule exists nowhere in code.
- **S2. The CV's name comes from `website.yml`.** Item 4 and ruling 542 (1) put the name on the `self` entry of `people.yml`. Place: `cv.ts` `names()` and `personal()`:
  ```
  if (site.givenName !== undefined) out['first-name'] = site.givenName;
  if (site.familyName !== undefined) out['last-name'] = site.familyName;
  ```
  The website patch adds `given_name: Axel` and `family_name: Faes`, and the people entry also holds `name: "Axel Faes"`.
  Failure: a change of the name in `people.yml` leaves `data.yml` and `industry.yml` unchanged, with no finding. The name is held twice.
- **S3. New data keys the brief does not name, absent from "Judgment calls the brief left open".** These are a manifest `cv:` record (8 fields, `manifest-schema.yml:100-107`) in place of item 4's "`role`, `min` and `hide` on the entry", and on collection entries `cv_section`, `cv_rank`, `cv_title` and `cv_url`. In `career.yml` rows they are `key`, `cv_section`, `cv_rank`, `funding` and `records`, plus `profiles.shared.parts` and `location`. The report's home table mentions some of them in passing; none is offered as a reversible decision.
  Failure: Axel learns of the manifest key `cv:` only from the hub patch, after the patch has written it into 16 manifests.
- **S4. Ruling B is not reported as asked.** Ruling B asks for each of the seven titles to be named in the report with its old and new title. The report says only "the seven titles of ruling B". My python pass over the copies lists them, for example `chi-purpose-centric | Purpose-Centric Appropriation of Everyday Objects as Game Controllers => Purpose-centric appropriation of everyday objects as game controllers.`.
- **S5. Hub text reworded by hand is not listed with before and after** (rules file, last paragraph). The patch:
  - rewrites the header comments of `education.yml` (drops "Source of record: side-projects/theaxec.github.io/_data/data.yml ... Keep in sync with the CV") and of `career.yml`;
  - changes `education.yml` `bioinformatics` `sub` from `"UHasselt | Sept 2025 - Sept 2026 (also 2024-2025)"` to `"UHasselt | Sept 2025 - Sept 2026"`;
  - writes new `eli5`/`tags` prose on three new manifests, for example `eli5: "University project (KU Leuven, 2018): ... trained on the KU Leuven supercomputer"`.

  Only the `.oculus/config.yml` comment was named by the brief.
- **S6. One `publication:` record carries no `rank`.** Item 2 says each record carries `rank`, filled once. Place: hub patch, `projects/coauthor/published/2017/algebraic-effects-compilation/project.yml`, found by a python pass ("publication records 48 without rank 1"). It sorts last by `Number.POSITIVE_INFINITY`, which today's one-entry section hides.
  Failure: a second `other-publications` paper given `rank: 1` goes above it, though no one chose that order.
- **S7. No statement of empty, duplicated and colliding keys** (rules file, "Every id or key a step introduces..."). `cv.ts` `Cv.records` puts the bare ids of every collection's entries, of the manifests carrying `cv:` and of the career rows' `key` into one map, where a later key silently replaces an earlier one:
  ```
  this.records.set(bareId(entry), fields);  ...  this.records.set(bareId(project), fields);  ...  if (typeof row.key === 'string') this.records.set(row.key, fields);
  ```
  Failure: a career position keyed `fair` and the funding entry `FAIR` are case-distinct, but a position keyed like an events entry makes a profile row's `records: [that-key]` take the position's place and period, with no finding. On today's data a python pass found each of the 39 named keys held exactly once. The report states none of this, nor duplicate or empty `rank`, `cv_rank` or `kind`.
- **S8. A research-line finding lands in the audit, not the data check.** Item 1 says a `program` word `website.yml` lacks is "a finding of the data check". `papers.ts` `programProblems` files it in the audit's Missing data section (`kind: 'data'`), not in the data check of the Findings view. This may be a reading of an ambiguous phrase, but the report does not name the choice.

Hard looks at the builder's judgment calls:
- **`accepted` flags:** holds (item 3).
- **The three new manifests:** hold. A grep of every hub `project.yml` for starcraft, pysc2, sensor and vod finds no existing manifest of that work.
- **The dropped `abandoned-papers` row:** holds. `papersFile` makes a section for every row, so the row would add a section the website lacks, and a `stopped` manifest gives a finding by its stage either way.
- **`role: present` and ELIXIR-BE `contributing`:** judged under B1 and B2.

### Proof

- **P1. The G32 widening tests pass on the unchanged code.** Place: `tests/data/sources/career.test.ts`, describe "the Career view's lists". My run on the builder's basetest (base `src`, new tests and fixture):
  ```
  <check mark> ... the Career view's lists > draws 'positions' as a list of record cards ...   (all five rows pass)
  Tests  1 failed | 15 passed (16)
  ```
  The rows run the existing `formFieldsOf`/`toEdit` over the new demo fixture, and none imports `Career.svelte`. They would pass with the Career view removed: a new test of new behaviour with no failure on the unchanged tree. The report's line "Each failure is a behaviour the change adds or changes" does not say these five pass on the base.
- **P2. A new normalise test row that no guarded entry names.** Place: `tests/data/snapshot/normalise.test.ts`, it "reads a person's `links:` as rows of a name, an address and an account name". G32's Test line (`guarded.md:266`) names only 'fills a project from the manifest keys of the same meaning' for that file, and the Doc text's G32 replacement does not add the row. The rules file says a test exists only as the test of an entry that names it.
- **P3. The verify list ran beyond what the rules file allows.** The report says four runs: run 2 "stopped while files it read were being changed", run 3 red partly on timeouts "while other test runs of mine shared the machine". Allowed is one run after the last change, a lone rerun of a red changed file, then one more run.
- **P4. The case-run program's source is not quoted in the report**, as the rules file requires. It also computes the key-order lists itself (`walk` in `run.mts`), while the brief says the program "computes nothing of its own". Ruling A's listing needed the walk, but the report does not say so.
- **P5. Verify 9's grep omits words of the rules file's list** ('before', 'still', 'as before', 'always had', 'the step adds'). My grep over the added comment lines and test titles gives 13 hits; all are about present state or position except `src/lib/server/content/audit/website/files.ts:6`:
  ```
  // it, so every program that reads the file reads it as it does now.
  ```
  This compares with the state before the write. The report does not quote or judge it.
- **P6. Two new tests are tagged slow and not reported as such.** `tests/routes/sessions/website.test.ts` (G140) and `tests/server/root/watch/website-watch.test.ts` (G125) are tagged `@module-tag slow`, so `npm test` leaves them out. The rules file asks a slow-only case to be run alone, quoted and named in the report. The report names neither as slow; they ran only inside `vitest slow` of the list.
- **P7. An unapproved `sed -i` is reported without the file it changed.** The report's Process says "one `sed -i ''` in round 0" and gives no file. The rules file wants each such command named with each file it changed.

### Standards

- **St1. Comments edited by the step are not rewrapped as whole paragraphs** (rules file, 100 columns, no short line inside a sentence). Short lines in mid-paragraph:
  - `src/lib/ui/controls/heads/FoldHead.svelte:6` `// then whatever the box puts at the end of the row. The command center`
  - `src/lib/ui/controls/heads/GroupHead.svelte:8` `... A heading`
  - `src/lib/ui/display/ticker/TickerGroup.svelte:3` `... so the look of a`
  - `src/lib/views/shared/forms/entry-file.ts:4` `... The Add of a collection, a`
  - `src/lib/state/sessions/source/draft-entry.ts:4` `... stands) are`
  - `src/lib/data/sources/config/settings/files.ts:5` `// (`websiteSettings`). Each reads its key through settingReader`
  - `tests/state/boards/board/board-new-project.test.ts:8` `... The rest of G124's tables are`
  - `src/lib/views/boards/focus/Focus.svelte` head comment: `... the snoozed lines and the`, `... each by a`, `Over a wallpaper the command center, ...`

  `comment-width.test.ts` passes, since it checks only the upper width.
- **St2. The Doc text's new G139 sentence is false.** Text: "a research line `website.yml`'s `programs:` lacks and a CV row naming no person or record are each a finding and give no entry".
  - `papers.ts` keeps the entry for an unknown research line, and the table row asserts it: `expect(entryOf('conference', 'lines')?.program).toEqual(['federated', 'unknown-line'])`.
  - `cv.ts` `careerFields` and `profileRow` keep the row for an unknown record.

  Failure: a reader of `guarded.md` believes an unknown research line drops the paper from the website.
- **St3. `docs/HELP.md:295` goes false and the Doc text does not change it.** It says "A released, published, failed or stopped project sits on no lane". `accepted` is `terminal`, so it sits on no lane too.
- **St4. The worktree's `O102-report.md` breaks the brief's character rule.** It holds the vitest marks and the ellipsis raw (lines 38-56 and 68-74), contrary to brief line 183 ("a character outside it in quoted output written by its name"). The main ledger's copy is ASCII.
- **St5. A `docs/templates.md` example drops a needed space.** `docs/templates.md:314` gives `pub_pre: "Submitted to"` with no trailing space, while `_includes/site/publications.html:34` prints `{{ item.pub_pre }}<em>{{ item.book }}</em>`.
  Failure: a hub that copies the example prints "Submitted toJournal".

### Behaviour

- **B1. The 19 events `link` findings come from the step's own choice.** The patch adds 19 `events.yml` entries with `role: present` and no `link`, and the hub's own schema line `{ field: link, ..., required: { when: { role: present } } }` then fires on each.
  - Entries 24 and 25 (articles: "Student Axel Faes wins bronze medal ...") and 26 (the CHI video) are no talk. The schema's help says `present = a talk/poster I give`, so these three misuse the vocabulary.
  - Fixes inside the step's write scope: narrow the rule's `when` in the hub patch, the builder's option (a). It changes a validation rule of Axel's hub, so it is his call and the open item is legitimate.
  - The three media rows have no `role` word that fits, which is also his call: a new role word, or another home for the CV's media rows.
- **B2. The ELIXIR-BE statement finding comes from the step creating a new `funding.yml` entry**, which ruling 559 places there. The file's status options are `[in-prep, planned, submitted, contributing, awarded, rejected, withdrawn]`. Only `contributing` is true of it, and it carries `acknowledged`. No fix inside the step fits: writing an acknowledgement text would be invented wording, and any other status is false. The open item is legitimate and needs Axel's wording.
- **B3. The hub patch deletes `career.yml`'s `situation` block, and the report does not say so.** The block held five facts, including "CoDE group (Cognition, Data and Education) - AI for HCC (ZonMw AI-HCC), since Jan 2026" and the supervisors named in the PhD and postdoc facts. A grep of the patched `.oculus/data` finds "CoDE group" only in a `leads.yml` fit note; "Research Affiliate" and BKO survive in `positions` and `education.yml`.
  Failure: the Career view no longer shows these facts, and nothing tells Axel they were dropped.
- **B4. Tabs of the removed track-record board are not covered.** The removal of the track-record board view (`RECORD_VIEW`, `Projects.svelte`) is ruled. But a saved layout holding such a tab then holds an unknown view, and the report's visible changes do not say so. I did not read `~/.oculus/layouts.json` to see whether one exists.
- **B5. A changed person form goes unstated.** The people entry form now draws `links` as rows of name, address and handle instead of a tag list (the hub schema change). The report's visible changes name only the person card.

## Declined to judge

- The look on Axel's running server at localhost:8790 is the orchestrator's, at landing:
  - the Career tab after Memories: the header button, the off tip with `self` unset or `website.folder` empty, the approval Confirm, and the line under the button after a press and after a non-zero exit;
  - the Audit's Website section with the Write the website button on a differing file;
  - Focus without the career banner;
  - the person card's links (case 20);
  - the History table of Usage and the Capacity, Login and Recent tables of the Live HPC float (case 21).
- The Jekyll build before and after was not rerun. It needs a Ruby bundle build in scratch; I checked the templates and `home.social` by reading instead.
- Whether a Career view Save keeps the `&profile-rows` anchors and aliases of the patched `career.yml` schema. It needs a write through the running server.
- The website commit `225a55d` and the cases ruling's premise about it need `git log` in the website repository, which I may not run.
- Whether a saved layout holds a track-record tab (B4) needs a read of `~/.oculus/layouts.json`, which I did not make.
- Axel's calls: the `link` rule and the media rows' role (B1), and the ELIXIR-BE statement wording (B2).

Usage: a465faae897c463b9, claude-opus-5-5, 364636 tokens, 112 tool uses, 21 min 34 s
