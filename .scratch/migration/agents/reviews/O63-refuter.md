# Step O63 refuter report (on .agents/worktrees/migration-O63, base 1fbe77b6)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

The brief says to pipe each output through "the filter the rules file names". `grep -n -i "filter" .scratch/migration/agents/spec.md` printed nothing: the rules file names no filter, so each command was run as written and its summary lines are quoted.

```
$ cd .agents/worktrees/migration-O63 && npm run diagrams && npm run test:quick      (exit 0)
ok      prettier (6.6 s): All matched files use Prettier code style!
ok      ASCII gate (7.5 s)
ok      svelte-kit sync (23.4 s)
ok      eslint (73.7 s)
ok      svelte-check (90.8 s): 1792868796696 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (135.8 s): Duration  123.90s (...)
ok      vitest (147.4 s): Duration  135.94s (...)
ok      vitest slow (163.8 s): Duration  152.38s (...)
test:quick: 187.6 s; every command passed
(git status --short afterwards: 69 lines, the same set as before the run; the regenerated diagrams are byte-equal)

$ the rules file's character-set check (perl, config/ accented-letter exception) over every path git status lists, folders expanded (70 files, the report included)
(no output)  ascii exit 0

$ verify 3 grep (the brief's pattern, src config tests docs, --exclude=local.yml)
44 lines; the same 44 the report quotes. Filtering out APP_FOLDERS, PLAIN_FOLDERS, MOST_FOLDERS, LEFT_OUT_FOLDERS, READER_FOLDERS, FOLDERS_LOADING, RETIRED_KINDS, the local FOLDERS of pdfjs-assets.ts, lists/folders.ts, manifest.test.ts and opening-apps.test.ts, '# WORKSPACE FOLDERS (no hub)', visibility: 'PUBLIC', the DOCTYPE PUBLIC body and 'deposit root\n' leaves nothing.

$ sh utils/unused-exports.sh | diff .agents/worktrees/O63-base/unused-exports.txt -
1c1
< Unused exports (230)
---
> Unused exports (231)
32a33
> src/lib/server/content/audit/setting.ts: noSetting
103c104
< src/lib/server/root/watch/portfolio.ts: DEBOUNCE, MAX_WAIT, audited, relevant, namedByConfig, watchedDirectories, roleDirectories, watchFile
---
> src/lib/server/root/watch/portfolio/portfolio.ts: DEBOUNCE, MAX_WAIT, watchFile

$ sh utils/folder-check.sh        (no output, exit 0)
$ ls src/lib/server/root/watch | wc -l      10
$ wc -l: projects.ts 600, publications.ts 299, rules.ts 349, scan.ts 82, setting.ts 230, audited.ts 104, portfolio/portfolio.ts 784, reads.ts 114, fields.ts 752, FieldControl.svelte 497

$ verify 6, on the base replica (basetree, which holds the final config-folder.test.ts and board-rules.test.ts and an audit.test.ts differing from the worktree's only in two comment wraps):
  npx vitest run tests/routes/docs/audit.test.ts tests/checks/config/config-folder.test.ts tests/state/boards/board/board-rules.test.ts
  26 TypeError: hubAuditSetting is not a function
   1 Error: Cannot find module '../../../../src/lib/server/content/audit/setting.ts' (board-rules.test.ts)
   1 AssertionError: expected [ Array(100) ] to deeply equal [ Array(99) ]
   1 AssertionError: expected [ { key: 'stages.idea', ...(1) }, ...(33) ] to have a length of 33 but got 34
   1 AssertionError: expected [ 'apps', 'audit_ignore', ...(24) ] to deeply equal [ 'apps', 'audit', ...(25) ]
   Test Files  3 failed (3)

$ case-run programs, sources compared with the report's quoted text: caserun.ts, caserun2.ts, hubrun.ts and hub-audit.yml each identical (diff printed nothing)
$ cd basetree && TREE=basetree node caserun/caserun.ts    | diff - <report 62-136>    exit 0
$ cd worktree && TREE=worktree node caserun/caserun.ts    | diff - <report 142-227>   only the report's trailing "exit 0" line differs
$ cd basetree && TREE=basetree node caserun/caserun2.ts   | diff - <report 233-258>   exit 0
$ cd worktree && TREE=worktree node caserun/caserun2.ts   | diff - <report 264-297>   exit 0
$ cd worktree && TREE=worktree HUB=<scratchpad>/hubcopy/research-hub node caserun/hubrun.ts | diff - <report 667-684>   exit 0

$ npx vitest run tests/state/system/settings tests/data/sources/config tests/routes/docs/audit.test.ts tests/server/edit tests/routes/edit tests/state/boards/board/board-rules.test.ts tests/checks/source/keys.test.ts --reporter=dot
 Test Files  37 passed (37)
      Tests  606 passed (606)

$ npm run check
COMPLETED 4280 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

The report says no line of `npm run test:quick` was red, and the rerun above had none, so there was no red line to check on the base replica.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, in one clause only (Spec 1): a project of a skipped tier now marks the feed paper it matches as matched, so the website check's matching is not "as today". The rest holds. `audit:` is one hub map with seven dotted rows on `HUB_LIST` (`hub-names.ts:393-399`), defaults (`config/defaults/behavior.yml:28-33`), seven option entries in "Audit checks" (`config/options/behavior.yml:24-103`), the `words` control in every file of the control switch (case 18 rerun; `npm run check` 0 errors), and the reader `setting.ts`, which gives one finding per malformed part on every hub (cases 15 and 16 rerun).
- 2: holds. The verify 3 grep prints only unrelated constants; cases 12, 13 and 14 were rerun; `vocab.yml` holds no `standard` and no `publication_kinds`; `HUB_LIST` has no `publications_file` row.
- 3: holds. Case 19 was rerun on both trees. `watch/` holds 10 items, `portfolio/portfolio.ts` is 784 lines, and every importer follows (`npm run check` 0 errors). Behaviour 1 is a sharp edge the report does not state.
- 4: violated (Spec 2): `msg_site_deadend` names no stage to move to, and the brief asks it to name that stage by its label. The other texts hold (the `audit.yml` diff was read).
- 5: violated (Standards 1): the head comment of `Audit.svelte` and the doc comment of `AuditKind` still describe the removed folder check. HELP.md, data-map.md and templates.md hold.
- 6: holds. G125's five describes carry the exact titles, with 26 rows, a personal-tier row in each, and cases 1 to 11 and 15 to 17 among them. `config-folder.test.ts` rows and title follow. The case-11 row's coverage is a separate finding (Proof 1).

Cases of the brief's "Cases":

- 1: met. Test 'give a hub that sets no audit: none of the findings of the setting'; the case-run prints "1: (nothing)".
- 2: met. Four rows of 'the required files of the audit'; case-run 2a to 2d.
- 3: met. Test row 5 of required files; case-run 3 gives scope `repo`.
- 4: met. Test 'require a file only of the hub projects under the folders ...'; case-run 4.
- 5: met. Three rows of 'the required sections of the audit'; case-run 5a to 5c.
- 6: met. Test 'require the heading only of the projects under the folders a row names'; case-run 6.
- 7: met. Website rows 1 to 3; case-run 7a to 7e.
- 8: met. Test 'say nothing of a feed that is not there, and name a feed that does not parse'; case-run 8.
- 9: met. Test 'check the projects of each hub against its own feed'; case-run 9a and 9b go through the watcher.
- 10: met. Two rows of 'the stage folders of the audit'; case-run 10a and 10b.
- 11: met by the case-run ("11 personal: (nothing)", every finding scope included). The test row checks only the project's own scope (Proof 1).
- 12: met. The case-run prints "12: (nothing)" on the changed tree and the two retired findings on the base.
- 13: met. The case-run 13a to 13c reproduce.
- 14: met. The case-run prints `findings=0 publication_kinds=absent stages with standard=[]`; the config-folder rows hold it.
- 15: met. The test row runs primary and non-primary; case-run 15a to 15c cover the primary, a second hub and no primary.
- 16: met. Test 'name an empty kinds and check no feed'; case-run 16.
- 17: met. Test 'require a file of a project with no stage ...'; case-run 17.
- 18: met for what a run reaches: ten rows, the `words` fields, the draft read back, the schema underline and the rewrite accepted (case-run 18a to 18e reproduce). How the four multi-picks look is not verifiable without the look on TEST.
- 19: met. All four rebuilds reproduce on the changed tree, and three do not on the base.

## 1. Spec

- `src/lib/server/content/audit/publications.ts:193-199`: "if (isPersonal(project, rules)) { // A project of a skipped tier is held to nothing, and the paper it matches is not one ... claimed.add(found.hit.key); } continue;". What is wrong: item 1 says the website check's "matching, its soft thresholds and its sections of findings are as today". Today a skipped-tier project is skipped before matching, so a feed paper only it matches is reported in `msg_site_untracked`. The builder changed this to satisfy one reading of case 11 ("no finding of any of them", which can also be read as the project's own findings only). That is a contradiction inside the brief. The rules file's "Read first" asks for a stop and a report when the brief disagrees, and the builder picked a side instead (report, judgment call 4 and "Where the brief was wrong"). The change is also missing from "Host- and user-visible changes". Failure scenario: a hub lists a personal side project's talk on its website feed. Before, the Audit view reported it as untracked; now it reports nothing, and no text tells the reader the audit has stopped looking at such papers. Verdict: item 1 violated in this clause. The orchestrator rules on which reading stands.
- `config/text/views/system/audit.yml:72`: "msg_site_deadend: 'the stage {0} marks a dead end, but the website shows it under {1}: give it the stage of a publication if it is one, else take it off the website (or mute if intentional)'". What is wrong: item 4 says "the text at `:73` names the stage by its label, not the word `published`". In the base text, `published` is the stage the reader is told to set. The new text names no such stage ("the stage of a publication"); `{0}` is the label of the project's own dead-end stage. Under the other reading, where "the stage" means `{0}`, the item holds. Failure scenario: a reader with a stopped project on the website is told to give it "the stage of a publication" and has to work out which of the five `public` stages is meant. Verdict: item 4 violated under the plain reading. The orchestrator rules.

## 2. Proof

- `tests/routes/docs/audit.test.ts:556`: "expect(settingFindings(findingsOf(hub, [personal]), 'projects/active/x')).toEqual([]);". `settingFindings` keeps only findings whose `scope` equals the project's (`:97-99`). What is wrong: case 11 asks for no finding of any check. The website's untracked finding has scope `website`, so this row passes whether or not the claim code of Spec 1 (`publications.ts:193-199`) exists. The behaviour the builder changed for case 11 is held by the case-run only, and no test of G125 holds it. Failure scenario: a later change drops the claim of a skipped-tier match, the personal paper comes back as "one website paper not matched to any project of the hub", and the row stays green. Verdict: none (case 11 is met by the run).
- `.scratch/migration/agents/reviews/O63-report.md`, "Verify 4, as printed": "> src/lib/server/content/audit/setting.ts: noSetting, auditSetting, hubAuditValue" and "> src/lib/server/content/audit/setting.ts: RequiredFile, RequiredSection, StageFolders". What is wrong: the rerun prints only `noSetting` and no types line (Verification above). The quoted output was taken before the builder's last change, against the rules file's "A report states the end state" ("Every count ... is taken after your last change"). The decision that rests on it, what was done with each added export, is right in the end state apart from Standards 3. Failure scenario: the orchestrator reading the quoted output thinks six exports and three types were added. Verdict: none.
- `.scratch/migration/agents/reviews/O63-report.md`, "Verify 7": "No departure from the rules was found." What is wrong: the check it describes was a scan for lines over 100 columns, which cannot find a paragraph left with a short line. Standards 2 is such a departure. Failure scenario: the orchestrator trusts verify 7 and lands the short-wrapped paragraphs. Verdict: none.
- `.scratch/migration/agents/reviews/O63-report.md`, "Rows of today's `audit.test.ts` deleted": the `config-folder.test.ts` paragraph lists the removed rows and keys and the count from 37 to 33. What is wrong: the rules file's "What every package obeys" asks for every edit to an existing assertion or allow list with its before and after, one row per changed line. The added key `'audit',` at `tests/checks/config/config-folder.test.ts:152` is not listed, and the edits are given as prose, not rows. Failure scenario: a reader checking the allow-list edits misses the addition. Verdict: none.

## 3. Standards

- `src/lib/views/system/audit/Audit.svelte:19-21`: "What the hub is missing, in the six sections the scan reports: an open marker left in a document, a manifest field a live project has not filled in, a folder the research standard does not name, ...". The same is at `src/lib/data/model/index.ts:356-357`: "Which section of the audit a finding belongs to: ... a folder the research standard does not name, ...". What is wrong: the folder check is removed. The `conform` section now holds the required files and the setting's shape findings, and the website section is the hub's own feed. The rules file's "What every package obeys" ("A sentence in a document or a head comment that the change makes false is a defect of the change") and item 5 ("The head comments of the audit files ... say what the code now does") are both broken. Failure scenario: a maintainer reading the Audit view's head comment, or the `AuditKind` doc, looks for a folder-name check that no longer exists and does not learn that `conform` is the hub's `audit:` setting. Verdict: item 5 violated.
- `src/lib/state/system/config/editors/fields.ts:11-12`: "// of records. A field the record does not hold is absent from the card, which is how a field is" / "// unset. A held" / "// value its control cannot show ...". A smaller instance is at `src/lib/state/system/config/editors/draft.ts:13`: "// records as cards of its own." followed by more of the same paragraph. What is wrong: the rules file's "What every package obeys" says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". Failure scenario: the paragraph reads broken in the editor, and the step's verify 7 claimed none. Verdict: none.
- `src/lib/server/content/audit/setting.ts:55`: "export function noSetting(): AuditSetting {". Its only importer outside the file is `tests/state/boards/board/board-rules.test.ts:45`. What is wrong: the principles section of the rules file says an export "with no importer outside its own file and its tests is removed or made local". The report cites the base's `DEBOUNCE` exports as precedent, and an export already on the unused list is not a ruling. Failure scenario: the unused-exports list grows by one line that every later step must explain. Verdict: none.
- `src/lib/data/sources/config/catalog/options.ts:605-614` (`flaggedItems`), `src/lib/data/sources/config/catalog/schemas/options.ts:117-121` (`blockSchema`) and `src/lib/server/edit/writes/config/config-fit.ts:193-198` (`listsFor`): the same fold, written three times. A sample: "let flagged: string[] | null = []; for (const source of flagSources(spec)) { const listed = sources.items(source); flagged = listed === null || flagged === null ? null : [...flagged, ...listed]; }". What is wrong: the principles section says "a parser, a fold or a rule exists once and is reused". The three copies differ only in the function that gives a source's items, so one helper taking that function would serve all three. Failure scenario: a later change to how a block's flags are pooled (a third flagged source, or a held flag kept) is made in one copy, and the Settings view, the editor's schema and the server's write then disagree about what a valid flag is. Verdict: none.

## 4. Behaviour

- `src/lib/server/root/watch/portfolio/portfolio.ts:339` and `:361-364`: "if (handles.has(key) || !existsSync(dirname(file))) return;" and "const openAuditFile = (file: string): void => { if (existsSync(dirname(file))) openFile(file, () => false, `audit:${file}`); else openParent(dirname(file), false); };". There is no close path for an `audit:` handle except watcher close (`grep -n "audit:\|openAuditFile\|auditFiles"` finds only the open at `:634-635`). What is wrong, by reading (not run): the rules file asks for every asynchronous path "superseded by a later one" to be stated in the report, and judgment call 7 does not state it. When a hub changes `audit.website.file` or drops a `required_files` row, or a workspace repository leaves the workspace, the old file watches and their `parent:` watches stay open until the server stops. Each event on the old paths then costs a rebuild. Because the key is never reopened, a feed folder or a repository's `code/` folder removed and made again (a `git checkout` that recreates `_data/`) keeps the handle on the gone folder, and the feed's later edits no longer rebuild the audit until restart. Failure scenario: Axel switches branches in the site repository, which recreates `_data/`; he edits `publications.yml`, and the Audit view keeps the old website findings until the server restarts. Verdict: none (item 3's named rebuilds hold, case 19).

## Declined to judge

- The old side of the "Hub rewrite" comparison (`hub-old.txt`, base tree over the hub with its original `config.yml`) was not rerun. The only hub copy, `<scratchpad>/hubcopy/research-hub`, holds the rewritten `config.yml`, and making a second copy is a write this review may not do. The changed-tree side reproduces exactly. Settled by: rsync the hub (without `.git` and `.oculus/local.yml`) to a fresh scratch folder and run `cd <scratchpad>/basetree && TREE=<scratchpad>/basetree HUB=<that copy> node <scratchpad>/caserun/hubrun.ts | diff - <scratchpad>/caserun/hub-old.txt`.
- Whether `required_sections` reads a workspace repository project's own `project.yml`: `manifestValue` resolves `resolve(input.hub, project.file)` (`projects.ts:307`). That is right only if a repository project's `file` is absolute, which `projectFileIn` (`manifests.ts:83-90`, `join(dir, MANIFEST)`) suggests. No case or test covers a repository row of `required_sections`. Settled by: a case-run of `required_sections: [{ file: README.md, heading: "## Data", key: datasets }]` over a repository folder whose `.oculus/project.yml` holds `datasets: [d1]` and has no README.
- The look of the `words` control and the "Audit checks" rows in the Settings view (case 18's drawing). This is the orchestrator's look on TEST.
- Which reading of case 11 (every finding, or the project's own) and of item 4's ":73" sentence the brief meant (Spec 1, Spec 2). That is the orchestrator's ruling.
- The builder's replica `<scratchpad>/basetree` still holds the final `config-folder.test.ts`, `board-rules.test.ts` and an `audit.test.ts` copy from verify 6. This is not part of the diff, and the replica is not a path this review judges.


Usage: a28e0780c4c2b69e1, claude-opus-5-5, 333566 tokens, 94 tool uses, 23 min 51 s

## Closed

- Spec 1: open item 321, closed in automode with (a) (Z984): the claim stays; sent in round 1, item 1, with the test row Proof 1 asks for.
- Spec 2: sent in round 1, item 2: the text names the labels of the stages that carry `public`.
- Proof 1: sent in round 1, item 1.
- Proof 2, Proof 3, Proof 4: sent in round 1, item 9.
- Standards 1: sent in round 1, item 3.
- Standards 2: sent in round 1, item 4.
- Standards 3: sent in round 1, item 5.
- Standards 4: sent in round 1, item 6.
- Behaviour 1: sent in round 1, item 7.
- Declined to judge 1 (the old side of the hub comparison): rerun by the orchestrator at landing.
- Declined to judge 2 (`required_sections` over a workspace repository project): sent in round 1, item 8.
- Declined to judge 3 (the look of the `words` control): the orchestrator's look on TEST at landing.
- Declined to judge 4: settled by Z984 and by round 1, item 2.
- Declined to judge 5 (the builder's base replica): outside the diff; nothing to do.

## Repair round 1, refuted

Step O63, worktree `.agents/worktrees/migration-O63`, base 1fbe77b6, round snapshot `.agents/worktrees/migration-O63-round-1/`. The reviewer's own outputs are in the session's scratch folder, `r1/`.

The brief asks for output "piped through the filter the rules file names". `grep -n -i "filter\|pipe" .scratch/migration/agents/spec.md` printed nothing, so the rules file names no filter. Each command below was run as written, and its summary lines are quoted.

### Verification lines

```
$ npm run diagrams && npm run test:quick        (worktree root, once, foreground; exit 0)
ok      ASCII gate (0.9 s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.5 s)
ok      eslint (69.2 s)
ok      svelte-check (105.7 s): 1792872176443 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (200.7 s): Duration  191.74s (transform 122.84s, setup 0ms, import 334.08s, tests 323.69s, environment 3ms)
ok      vitest (212.8 s): Duration  205.10s (transform 314.41s, setup 0ms, import 497.74s, tests 240.47s, environment 45.14s)
ok      vitest slow (244.6 s): Duration  237.08s (transform 18.97s, setup 0ms, import 187.31s, tests 748.52s, environment 19ms)
test:quick: 247.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
(git status --short before and after: the same; shasum of docs/diagrams/* before and after: the same)

$ verify 2: the rules file's perl character-set check over every file git status lists, folders expanded, local.yml excluded (73 files)
(no output)  ascii exit 0

$ verify 3: grep -rnE "<the brief's pattern>" src config tests docs --exclude=local.yml
44 lines, every one unrelated (APP_FOLDERS, PLAIN_FOLDERS, MOST_FOLDERS, LEFT_OUT_FOLDERS, READER_FOLDERS, FOLDERS_LOADING, RETIRED_KINDS, WORKSPACE FOLDERS, visibility 'PUBLIC', DOCTYPE PUBLIC, the local constants FOLDERS of pdfjs-assets.ts, lists/folders.ts, manifest.test.ts and opening-apps.test.ts, and 'deposit root\n' at tests/data/sources/docs.test.ts:46).

$ verify 4: sh utils/unused-exports.sh | diff ../O63-base/unused-exports.txt -
103c103
< src/lib/server/root/watch/portfolio.ts: DEBOUNCE, MAX_WAIT, audited, relevant, namedByConfig, watchedDirectories, roleDirectories, watchFile
---
> src/lib/server/root/watch/portfolio/portfolio.ts: DEBOUNCE, MAX_WAIT, watchFile
(no added line; noSetting is gone from the list)

$ verify 5: sh utils/folder-check.sh        (no output, exit 0)
$ ls src/lib/server/root/watch | wc -l      10
$ wc -l over the changed src/tests files: largest git.ts 878, portfolio/portfolio.ts 850, model/index.ts 846, context.ts 820, config-folder.test.ts 805, fields.ts 751; components Audit.svelte 355, Editor.svelte 243, FieldControl.svelte 497

$ verify 6, base replica: npx vitest run tests/routes/docs/audit.test.ts tests/checks/config/config-folder.test.ts tests/state/boards/board/board-rules.test.ts   (exit 1)
  27 TypeError: hubAuditSetting is not a function   (the new row at tests/routes/docs/audit.test.ts:419:23 among them)
   1 Error: Cannot find module '../../../../src/lib/server/content/audit/setting.ts' (board-rules.test.ts)
   1 AssertionError: expected [ Array(100) ] to deeply equal [ Array(99) ]
   1 AssertionError: expected [ { key: 'stages.idea', ...(1) }, ...(33) ] to have a length of 33 but got 34
   1 AssertionError: expected [ 'apps', 'audit_ignore', ...(24) ] to deeply equal [ 'apps', 'audit', ...(25) ]
   Test Files  3 failed (3) | Tests  30 failed | 25 passed | 2 skipped (57)
$ the same three files on the worktree:  Test Files  3 passed (3) | Tests  136 passed | 2 skipped (138)

$ round item 3 grep: 158 lines; sorted, they equal the report's quoted output; none of the four phrases other than "folder the"; the only hit in an audit file is projects.ts:52, another sense.

$ case-runs (caserun.ts, caserun2.ts, caserun3.ts, hubrun.ts, identical to the report's): every output equals the report's lines on both trees (diff empty); the hub copy's audit: block equals the report's "Hub rewrite" YAML.
$ git status --short after every rerun: equal to before (diff empty)
```

### Verdicts

Items of the brief's "What to build": 1 holds (ruling Z984 settles the skipped-tier claim; `HUB_LIST` holds the seven `audit.*` rows, 33 rows, as `docs/data-map.md` says); 2 holds; 3 holds (Behaviour 1 is a risk on Linux, found by reading); 4 holds (`msg_site_deadend` names the labels of the public stages); 5 holds; 6 holds (27 rows; the `config-folder.test.ts` changes equal the report's table).

Cases: 1 to 17 met (every case-run output reproduces byte for byte on both trees); 11 met (`audit.test.ts:412-423`); 18 met for what a run reaches, the drawing of the control being the look on TEST; 19 met (four rebuilds on the changed tree, three not on the base).

Round items: 1 holds (fails on the base replica at `:419:23`, passes on the worktree; by reading the row fails without the claim); 2 holds; 3 holds; 4 holds (no comment line ends short); 5 holds; 6 holds (`blockFlags` at `catalog/options.ts:148-162`, callers `options.ts:625`, `schemas/options.ts:118`, `config-fit.ts:196`); 7 holds for the runs (Behaviour 1); 8 holds; 9 holds.

### 1. Spec

- S1. Report section "The case-run programs", `<scratchpad>/caserun/paragraphs.py` (report lines 1908-1945): `subprocess.run(['git', 'diff', '--name-only', '--diff-filter=AM'], ...)` and `subprocess.run(['git', 'ls-files', '--others', '--exclude-standard'], ...)`. A script outside "What to build" that runs no case (it lists comment paragraphs for round item 4's reading), so ruling 262 (a) does not cover it and no line of `plan.md` Rulings approves it; it runs `git ls-files`, which the rules file's "Where you work" names among the git commands a builder never runs. Failure scenario: the reading of verify 7 rests on a list from an unapproved script running a forbidden git command, with no record in the ledger. Round item 4 still holds, since the reading itself was checked by the reviewer.

### 2. Proof

none

### 3. Standards

- T1. The report carries no quoted grep for the history words, which the rules file's "What every package obeys" asks for over the comment lines and test titles added or changed. The reviewer's grep finds "still" at `src/lib/server/root/watch/portfolio/portfolio.ts:423-424` (present tense in meaning) and "before" in the head comment of `config/defaults/behavior.yml` and two write files (in-process timing). Failure scenario: the orchestrator cannot tell from the report whether those were judged.
- T2. Report line 685: two earlier starts of `npm run test:quick` in this round were stopped, the first before the last change, against "Token discipline". Failure scenario: an extra full start slows every other step's runs. The report states it.

### 4. Behaviour

- B1. `src/lib/server/root/watch/portfolio/portfolio.ts:372-381`: `inode = statSync(dir).ino; ... if (handles.has(key) && auditInodes.get(key) !== inode) closeHandle(key);`. By reading (not run; this machine is macOS): a folder made again is told apart from the old one by its inode number alone. On Linux, which oculus ships for, ext4 commonly hands a just-freed inode number to the next directory made, so a removal and a remaking inside one debounce window (`DEBOUNCE = 200`) keep the handle on the deleted folder. The codebase pairs `ino` with `mtimeMs` or `dev` elsewhere (`src/lib/server/core/json.ts:273`, `src/lib/server/core/paths.ts:85`). Failure scenario: `git checkout` in the site repository recreates `_data/` and gets the same inode back; later edits of the feed no longer rebuild the audit until a restart.

### Declined to judge

- The old side of the "Hub rewrite" comparison: the orchestrator's at landing.
- The look of the `words` control, the "Audit checks" rows and the Audit view's section title and empty text: the orchestrator's look on TEST at landing.
- `paragraphs.py` was not run, since it runs `git diff` and `git ls-files`.
- Item 7 on Linux: no Linux machine here.
- The report's line counts and its 59-file count of verify 2 (it leaves out `docs/diagrams` and `.scratch`): no decision rests on them; the reviewer's run covered all 73 files.

Usage: aef1a070e7f4b6279, claude-opus-5-5, 270060 tokens, 73 tool uses, 16 min 0 s.

### Closed

- S1 (the unapproved script `paragraphs.py`): raised to Axel as open item 330; nothing it produced is used as evidence, and round item 4's reading rests on the reviewer's own check of every comment line of the diff.
- T1 (the history-word grep): fixed at landing; the orchestrator runs the grep over the added comment lines and test titles and judges each hit in the booking.
- T2 (the extra test:quick start): stated in the booking; nothing to change in the code.
- B1 (a folder made again told apart by its inode alone): fixed at landing inside round item 7: the audit watch records the folder's device, inode and birth time, so a folder made again with a reused inode number is opened again (a change time would also change on every file added to the folder).
