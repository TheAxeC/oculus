# Step O139 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O139, base b65e92766)

The pages this report cites are named by section. Findings in code keep their `file:line`. Characters outside ASCII in quoted lines are written by name in angle brackets.

## Verification (rerun by the reviewer)

All runs are from the worktree's root with PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH. The review changed nothing. `git status --short` lists the same ten modified paths and the untracked report before and after the review. The md5 of every `docs/diagrams/*` file is the same before and after `npm run diagrams` (`diff exit 0`).

```
Verify 1: npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/duplication.test.ts tests/checks/config/config-folder.test.ts tests/state/client/held-unsaved.test.ts tests/data/helpers/hub-names.test.ts tests/routes/docs/wallpaper.test.ts tests/state/sessions/changes-file.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/state/shared/hubs.test.ts --reporter=dot
 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 193 passed | 2 skipped (196)
  (the one failure: tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib, "Error: Test timed out in 5000ms.")
  load averages: 11.41 8.34 9.79 (uptime, right after)
Boundaries rerun alone (file not changed by the step), npx vitest run tests/checks/tree/boundaries.test.ts --reporter=verbose:
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)      ("Error: Test timed out in 5000ms.", load averages 11.41 8.34 9.79 before, 12.93 9.00 9.98 after)
Same file alone with --testTimeout 60000, to read the assertion (load averages 13.18 9.12 10.02):
 Test Files  1 passed (1)
      Tests  11 passed (11)
  The boundaries file also passed inside "vitest checks" of the test:quick run below.

Verify 2: npm run diagrams        -> diagrams exit 0, no file changed (md5 diff exit 0)
          npm run test:quick      (run once, load averages 15.32 10.75 10.57 at start)
test:quick: 11 changed file(s), from git since HEAD
test:quick: 81 test file(s)
ok      prettier (2.7 s): All matched files use Prettier code style!
ok      ASCII gate (2.9 s)
ok      svelte-kit sync (5.2 s)
ok      eslint (3.9 s)
ok      svelte-check (15.7 s): 1793737791159 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest (167.8 s)
 Test Files  2 failed | 58 passed | 9 skipped (69)
      Tests  4 failed | 958 passed | 178 skipped (1140)
ok      vitest checks (194.9 s): ...
FAILED  vitest slow (214.1 s)
 Test Files  1 failed | 13 passed (14)
      Tests  2 failed | 176 passed | 127 skipped (305)
test:quick: 219.6 s; failed: vitest, vitest slow
  (load averages 17.07 14.67 12.37 at the end)
  Every failure was "Test timed out", in files the step does not change:
  tests/data/hubs/workspace-projects.test.ts (3 tests, 5000ms), tests/routes/docs/primary-key.test.ts (1 test, 5000ms), tests/data/hubs/hub-portfolio.test.ts (2 G32 tests, 20000ms).
  Each rerun alone:
  tests/data/hubs/workspace-projects.test.ts   Test Files 1 passed (1) / Tests 5 passed (5)   load 14.33 14.28 12.33
  tests/routes/docs/primary-key.test.ts        Test Files 1 passed (1) / Tests 7 passed (7)   load 14.07 14.22 12.35
  tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow   Test Files 1 passed (1) / Tests 16 passed (16)   load 12.75 13.92 12.29
  (11 changed files: the untracked report is now counted, against the report's 10)

Verify 3: LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/views/system/findings/Findings.svelte src/lib/views/shared/card/RootChip.svelte src/lib/data/helpers/files/paths.ts src/lib/data/sources/config/merge/options-folder.ts config/text/views/system/findings.yml
  (nothing printed) perl exit 0
          LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/diagrams/layers.dot docs/diagrams/layers.svg docs/diagrams/layer-views.dot docs/diagrams/layer-views.svg
  (nothing printed) grep exit 1
          LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O139-report.md   -> nothing, exit 1

Verify 4: sh utils/unused-exports.sh > <scratch>/rev-unused.txt; diff <scratch>/rev-unused.txt ../O139-base/unused-exports.txt
  unused exit 0 / diff exit 0 (base list 335 lines)

Verify 5: sh utils/folder-check.sh   -> nothing printed, exit 0
          wc -l: Findings.svelte 294, RootChip.svelte 54, paths.ts 261, options-folder.ts 148, findings.yml 14

Verify 6: git diff b65e92766 --stat lists no file under tests/ (the ten paths are config/text/views/system/findings.yml, docs/HELP.md, four docs/diagrams files, paths.ts, options-folder.ts, RootChip.svelte, Findings.svelte)

Case-run program, unchanged, on the base copy:
node <scratchpad>/o139-cases.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/O139-base/src/lib/data/helpers/files/paths.ts
C9 dir file: "/tmp/lab/.oculus/config.yml" -> null
C9 real file: "/private/tmp/lab/x.yml" -> {"root":"lab","path":"x.yml"}
C10 empty file: "" -> {"root":"main","path":""}
C13 inner file: "/w/main/side/inner/a.yml" -> {"root":"inner","path":"a.yml"}
C13 primary file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, hub file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, lab dir file: "/tmp/lab/.oculus/config.yml" -> null
C16 root with empty real: "/w/gone/x.yml" -> null
C19 lab collection file: "/tmp/lab/registries/people.yml" -> null
C19 lab change record: "/tmp/lab/projects/p/project.yml" -> null
exit 0
On the worktree (.../migration-O139/src/lib/data/helpers/files/paths.ts):
C9 dir file: "/tmp/lab/.oculus/config.yml" -> {"root":"lab","path":".oculus/config.yml"}
C9 real file: "/private/tmp/lab/x.yml" -> {"root":"lab","path":"x.yml"}
C10 empty file: "" -> {"root":"main","path":""}
C13 inner file: "/w/main/side/inner/a.yml" -> {"root":"inner","path":"a.yml"}
C13 primary file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, hub file: "/w/main/registries/b.yml" -> {"root":"main","path":"registries/b.yml"}
C14 no primary, lab dir file: "/tmp/lab/.oculus/config.yml" -> {"root":"lab","path":".oculus/config.yml"}
C16 root with empty real: "/w/gone/x.yml" -> {"root":"gone","path":"x.yml"}
C19 lab collection file: "/tmp/lab/registries/people.yml" -> {"root":"lab","path":"registries/people.yml"}
C19 lab change record: "/tmp/lab/projects/p/project.yml" -> {"root":"lab","path":"projects/p/project.yml"}
exit 0
  Both outputs match the report's quoted first run and after run line for line. The program imports the real `fileUnder` from the paths.ts given as its argument (`await import(process.argv[2])`), so it tests the real function, not a copy. It calls `fileUnder` alone. The C19 callers' handling of the result is established by reading the code.

Other commands the report quotes:
grep -rln "options-folder\|readOptionsFolder\|RootChip\|system/findings" tests -> tests/checks/config/config-folder.test.ts (line 350, the string 'views/system/findings.yml'), already in verify 1
grep -rln "files/paths" tests -> tests/checks/tree/layer-rows.ts (comments and a layer row), held-unsaved.test.ts, hub-names.test.ts, wallpaper.test.ts
grep -rn "findings_file_root_tip" src config tests docs -> Findings.svelte:186 and config/text/views/system/findings.yml:8; yaml.safe_load gives "This file is under the folder served as {0}"
grep -rn --exclude=local.yml "fileUnder\|RootChip\|root_tip\|options_folder\|findings_file" docs config README.md -> hubs.yml:5 root_tip, latex.yml:115 pick_root_tip, findings.yml:7-8 (no doc sentence)
history-word grep over the added lines of src, config and docs/HELP.md -> exit 1 (no hit)
grep -rn "fileUnder(" src/lib | wc -l -> 11 (base 10): the definition plus ten call lines, two of them new in Findings.svelte
orchestrator-state.md:205-208 -> the open-items heading and its paragraph, with no entry
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `Findings.svelte:165` `placed(finding.file)` and :183-187 `<RootChip record={{ root: under.root }} .../>` come after the name. `RootChip.svelte:33-36` draws nothing for the primary. `placed('')` returns null (:124), and a file no root holds also gives null, so the row takes the plain branch (:168-171).
- 2: holds. `tip?: (root: string) => string` has the default `t('hubs.root_tip', root)` (`RootChip.svelte:22-26`). The nine other callers pass no `tip`. The key is at findings.yml:8, right after `findings_files`, in the dictated words. The head comment (:2-10) says what the chip names and that a caller gives its own words.
- 3: holds. It is `ToolButton plain cut` inside `.place { display: inline-flex; min-width: 0 }` with no overflow (:173-182, :261-264), with label `named(...)` and title `t('audit.open_place_tip', finding.file)`. `opened` (:131-137) calls `openSourceFile` with `line` only when the finding has one. A file that ends in `/` goes to `showFolderInFiles(normalisePath(under.path), under.root)`. The plain words keep `title={finding.file}`.
- 4: holds by reading (the look on landing settles it). `.named` is a flex item with `min-width: 0; max-width: 100%` (:243-249). `.place` shrinks, the label is cut by `.tool.cut > .label` (`ToolButton.svelte:410-421`), and `.root-chip` keeps `flex: 0 0 auto` (`RootChip.svelte:48-53`).
- 5: holds by reading. Each row has one native `<button>` (`ToolButton.svelte:68`). RootChip's Tooltip passes no `focusable`, so the chip takes no tab stop (`Tooltip.svelte:236,258`). The ring is `outline-offset: 1px` (`ToolButton.svelte:458-460`) and no ancestor of the row's control sets overflow. No `data-card` is on the row (:166).
- 6: holds. `named` (:114-117) and the search (:102-104) are unchanged from the base. The folder's name keeps its `/`, since `named` passes `under.path` through.
- 7: holds. See `paths.ts:192-197` and the case-run output. The doc comment says both folders and why (:177-181). Its wrap is Standards 1.
- 8: holds. `options-folder.ts:136` reads `` file: `${join(dir, OPTIONS_DIR)}/` ``, and the comment at :128-130 is rewritten. The `defined_twice` words are unchanged (:138-139).
- 9: holds. See `Findings.svelte:32-47`.
- 10: holds. `docs/HELP.md:345` carries the dictated sentence word for word.
- 11 (beyond the ten asked): holds. The diff touches nothing under `src/lib/server` or `src/routes`.

Cases of the brief's "Cases":

- C1: met by reading. A relative or primary-absolute file gives the primary as root (`paths.ts:188`), RootChip draws nothing, and the press is `openSourceFile` with the line (:136). The press itself is for the look on landing.
- C2: met. The `dir` form of a lab file resolves to `lab` (case-run C9 and C14 lines). The tip text matches findings.yml:8.
- C3: met by reading (:136 and :116).
- C4: met by reading (:168-171).
- C5: met by reading (`paths.ts:188`).
- C6: met by reading. The root comes from `fileUnder`, and the same `tip` serves every row.
- C7: met by reading (:192-194, unchanged).
- C8: met by reading (the search and `named` are unchanged, and the chip is outside `named`).
- C9: met (case-run output, base null, after `{root: lab, path: .oculus/config.yml}`).
- C10: met (`placed`, :124; case-run C10 line).
- C11: met by reading (absolute `config/` paths under the `oculus` root; the same row code).
- C12: met by reading. `normalisePath('config/options/')` gives `config/options` (`place.ts:23-34`), and `showFolderInFiles` normalises again (`show.ts:75`).
- C13: met (case-run C13 lines).
- C14: met (case-run C14 lines; `RootChip.svelte:35` with `primary() ?? ''`).
- C15: met by reading (the same row code; an empty `file` from `views.ts:106` goes to the C10 path).
- C16: met as the brief words it (case-run C16 line). The behaviour it gives is Behaviour 1.
- C17: not verifiable by reading alone. The reading supports it (item 5). The look on landing settles it.
- C18: not verifiable by reading alone. The reading supports it (item 4). The look on landing settles it.
- C19: met (case-run C19 lines). By reading, `changes.svelte.ts:86`, `registry-file.svelte.ts:68` and `Collection.svelte:153` pass the answer through.

The report's seven judgment calls:

- 1, the prop name `tip`: holds. It is internal and no other prop collides.
- 2, the hover underline: holds. It matches `AuditSection.svelte:303-305`.
- 3, the muted mono face: holds. It matches the Audit place (`AuditSection.svelte:296-301`).
- 4, the `.named` wrapper: holds. Item 4 needs it.
- 5, `normalisePath`: holds against item 3's wording. The call repeats what `showFolderInFiles` already does (`show.ts:75`), see Standards 2.
- 6, `endsWith('/')` on `finding.file`: holds.
- 7, the local type `Under`: holds. A view cannot import `FileName` (boundaries).

Two runs of `npm run test:quick`: allowed. The first run was red on eslint in `Findings.svelte`, a file the step changes. The rules file (Token discipline) has that file fixed and rerun alone, then the list run once more. This is not a finding.

## 1. Spec

none

## 2. Proof

- `.scratch/migration/agents/reviews/O139-report.md`, Verify 1: "These were run after the last edit to `paths.ts`, `options-folder.ts`, `RootChip.svelte` and the catalog". What is wrong: the run the DONE row quotes was taken before the last change, the eslint fix at `Findings.svelte:185`. The rules file's Report and working rules ask that every count be taken after the last change. My rerun after the last change printed `Test Files 1 failed | 9 passed (10)`. The one failure was a boundaries timeout at load 11.41, in a file the step does not change. The same file passes alone with a 60 s timeout and inside "vitest checks" of test:quick. No decision rests on the stale figure. Failure scenario: a reader takes the quoted 9-file run for the state of the final tree. Verdict: none.
- Same report, Verify 1: "The four test files that import `paths.ts` are named in it." What is wrong: three test files import `paths.ts` (held-unsaved, hub-names, wallpaper; `grep -rln "files/paths" tests`). The fourth match is `tests/checks/tree/layer-rows.ts`, a helper whose hits are comments and a layer row. The run includes `changes-file.test.ts`, which reaches `fileUnder` through `fileShown`, and leaves out `tests/state/shared/hubs.test.ts`, which imports the `hubs.ts` re-export of `fileUnder`. I added that file to my rerun and it passes. No decision rests on the count. Verdict: none.

## 3. Standards

- `src/lib/data/helpers/files/paths.ts:176-179`: " * already relative to the primary's folder, and names no file when the workspace has no primary. / * An absolute path is read against both folders of a root, its resolved `real` folder and its / * `dir` as the workspace gives it, each without a closing `/` and an empty one skipped: a file / * read from disk ...". What is wrong: the rules file ("What every package obeys", a comment edited by the step is rewrapped as a whole paragraph at 100 columns) and CLAUDE.md ("Writing", no hard wrapping) are broken here. Line 177 is 94 columns and the next word "`dir`" fits at 100. Line 178 is 95 columns and the next word "read" fits at 100. Line 176 (97 columns) ends the old text, and the new sentence starts on a fresh line where "An" fits at 100. The paragraph was extended, not rewrapped as a whole (`awk '{print length}'`; `.prettierrc` printWidth 100). Failure scenario: two lines inside one sentence end short. That is the hard-wrap tell the rule exists to stop, and prettier does not rewrap comments. Verdict: none (item 7's content holds).
- `src/lib/views/system/findings/Findings.svelte:64, 133`: "import { normalisePath } from '$lib/state/sources/fs';" and "client.layout.showFolderInFiles(normalisePath(under.path), under.root);". What is wrong: `showFolderInFiles` already runs `normalisePath(path)` on what it receives (`src/lib/state/workbench/layout/open/show.ts:75`). The view therefore imports a state function only to repeat that step, and adds one `views/system -> state` edge (layer-views.dot 242 to 243). The spec.md principle is KISS, with no code that duplicates its callee. Item 3 asks that the folder reach `showFolderInFiles` "without its closing `/`". The callee's own normalisation already meets that, so the call could pass `under.path` as it is. This is a judgment and low severity. Failure scenario: a later change to how `showFolderInFiles` treats its path has to be mirrored here, and the diagram carries an edge that does nothing. Verdict: none.

## 4. Behaviour

- `src/lib/data/helpers/files/paths.ts:192-196`: "for (const folder of [root.real, root.dir]) { const base = (folder ?? '').replace(/\/+$/, ''); if (base === '' || ...". What is wrong: on the base, a root whose folder does not exist (`real: ''`, by the `FsRoot` doc at `src/lib/state/sources/explorer/view/place.ts:50-56`, "it is empty for a folder that does not exist") was skipped entirely, because `'' ?? dir` is `''`. Now it is matched by its `dir`, and this holds for every caller of `fileUnder` and `fileNamed`, ten call lines. Ruling 662 2 (a) asked for `dir` matching so that a hub whose folder passes a symbolic link is found. It said nothing about roots whose folder is gone; the brief's C16 added that. In the Findings view such a row now gets a chip and a control whose press opens a source tab on a file under a folder that is not on disk. In History (`fileShown`) and through `fileNamed` (`context.ts:202,209`), a record under that folder now reads as `<root>/<path>` and opens under a root that cannot read it, where on the base it showed the whole path and gave null. The report states only the after state, as one sentence ("Every caller ... also matches a file under the dir of a root whose real is empty"), with no before and after per caller. Failure scenario: a workspace keeps a folder entry whose folder was deleted or lives on another machine. A History record or a finding of a file under it now draws that root's name and a press that ends in an unreadable tab. The orchestrator's choice is between keeping C16 as briefed and skipping a root whose `real` is `''`, which keeps `dir` matching for roots that exist, the case ruling 662 named. Verdict: C16 met as briefed. The behaviour goes past ruling 662's stated purpose and is left to the orchestrator.
- `.scratch/migration/agents/reviews/O139-report.md`, "Host- and user-visible changes": "The other callers of `fileUnder` for a hub behind a symbolic link. History's file column ... The registry file and Collection's file of `lab` are found under `lab`, where before they were null." What is wrong: the brief's report shape asks for before and after for "the other callers of `fileUnder` for a hub behind a symbolic link". The report covers three of them. It leaves out four `fileUnder` callers that change the same way, because a second hub's collection files are built from the hub folder as given (`join(hub, asked.file)`, `src/lib/data/sources/collections.ts:201`). It also leaves out the `fileNamed` callers in `context.ts:202,209`. The four are Person's people file (`Person.svelte:118-122`, null on the base, now the file), Focus rows' file (`rows.ts:131`), lead apply (`lead-apply.ts:62-65`, which on the base returned `''` and did nothing for such a hub, and now places the lead), and the entry page's file (`page-file.ts:56`). The look on landing is read against this section, so these changes go unlooked-at. Failure scenario: the look checks History, Registry and Collection for `/tmp/lab` and passes, while Apply on a lead of `lab` now writes into `lab`'s file. That write is a visible behaviour nobody compared with the base. Verdict: none (C19 met). The before-and-after section is incomplete.

## Declined to judge

- Whether the change log's records name a file by the folder as given or by its resolved folder. The report's sentence that History's file column changes for a hub behind a link depends on this. Settling it means reading the `file:` value every writer passes to `src/lib/server/core/changes.ts`, which goes beyond this diff.
- What the DOM shows: the cut name beside a whole chip (C18), the focus ring drawn whole, one tab stop, and Enter and Space (C17). Reading supports each one, and the look on landing settles them.
- Whether every finding of the validate snapshot for a second hub carries an absolute path. A relative one would now open the primary's file at that path. This is the step line's premise (`readOtherHub`, `index.ts:649`), and the base `named` already relied on it, so it is outside this step.
- Whether `npm run diagrams` ran right before the builder's first test:quick run. The report states it only for the second run, and nothing in the tree can show it.

Reviewer usage: a6778fc60b885525b, claude-opus-5-5, 218942 tokens, 81 tool uses, 17 min 33 s.
