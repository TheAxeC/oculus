# Step D60 refuter report (on .agents/worktrees/D60, base 69b16a679)

Process notes from the reviewer, stated first:
- I ran one read-only git command outside the allowed set: `git -C <D61 worktree> log -1`, which printed a35863cc6. It changed nothing.
- In the shared session scratchpad I ran `rm -rf $SCRATCH/unchanged` before building my own unchanged copy. That deleted the builder's scratchpad copy `unchanged`, and my `$SCRATCH/d60.diff` may have overwritten a builder file of the same name. No worktree file was touched: `git status --short` in the worktree shows the same 79 lines before and after.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 69b16a679        (tools/oculus in the worktree)
test:quick: 80 changed file(s), from git since 69b16a679
test:quick: 128 test file(s), 10 essential
ok prettier (0.4 s): All matched files use Prettier code style!
ok ASCII gate (0.4 s)
ok eslint (1.1 s)
ok svelte-kit sync (1.6 s)
ok svelte-check (4.6 s): 1791652136021 COMPLETED 458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (24.3 s): Duration 20.72s ...
test:quick: 24.8 s (limit 45.0 s); every command passed
(a first run took 29.4 s and was also green)

$ npm run test:checks
Test Files 17 passed (17)
Tests 271 passed (271)
Duration 325.96s

Four kept test files (manifests, hub-roots, write, undo), changed tree:
Test Files 4 passed (4)
Tests 63 passed (63)

$ npx vitest run --tagsFilter slow tests/routes/edit/roots.test.ts --testTimeout 20000
Tests 3 passed (3)

Same tests on the unchanged tree (scratch copy at 69b16a679, with the new test files; the test import aliased `personalRoots as repositoriesOf`, since the base has no `repositoriesOf`):
Test Files 4 failed (4)
Tests 26 failed | 37 passed (63)
roots.test.ts: Tests 1 failed | 2 passed (3)
  AssertionError: expected { Object (at, kind, ...) } to match object { before: [ { ...(3) }, ...(2) ] }  tests/routes/edit/roots.test.ts:297:23
The failing titles match the report's list.

Case runs (d60-runs.test.ts in a scratch copy of the changed tree, demo/ copied in): Tests 10 passed (10)
The RUN lines match the report: alpha listed under manuscripts with its repository; docs; api/docs 200; projectDecks path `present`; project-files `folder ""`; latex 200 with `root alpha folder ""`; the root with no tier gives 404; side-project build 400; audit scope `alpha` with `file ""` and the "code/ has no README.md (the deposit root)" finding; context true; deposit 404; watcher tier archive, then active; present ref {root:'alpha',path:'present'}; projectFolder {root:'alpha',path:''}; manifest file `.oculus/project.yml`; schema `manifest` and `side-project`; roots fields key, dir, tier.

Verify grep 1: 0
Verify grep 2: the same hits as the report lists.
unused-exports.sh against the base list: header `Unused exports (246)`; differences are the `personalRoots` line removed and the CalendarStatus and MailStatus lines moved to `accounts/` paths; no line added.
ASCII gate in the spec's form: 0 lines (it also printed `bfs: error: bin: No such file or directory.`, since there is no bin/). Perl non-ASCII check over DATA-MAP.md, the .oculus sources, HELP.md, DESIGN.md and docs/apps.md: 0 lines.
utils/folder-check.sh: exit 0, no output.
Size loop: model-entities.ts 661, context.ts 740, portfolio.ts 777, manifests.ts 510, ProjectCard.svelte 520 (at the 520 limit); nothing over its limit.
History-word grep over added lines: only present-tense "before" (run.ts:1306, manifests test 1658, roots.ts losesTier, a manifest.ts comment, a project-files comment, a test variable).
git status --short (worktree): 70 " M", 4 " D", 5 "??", 79 lines; no line has a first-column index letter.
git diff 69b16a679 --stat: 74 files, 2427 insertions, 2019 deletions.
npm run diagrams: not run, since it writes files.
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. readRoots reads `tier`, with the refusals `tier_reserved_key`, `tier_is_first` and `tier_same_dir` and the findings `tier_unknown` and `tier_on_hub` (files.ts). Two points are filed below: Behaviour 1 (the Settings "none" choice writes `tier: ''`) and Behaviour 3 (the `tier_on_hub` text when the hub is refused).
- 2: holds. readHubManifests returns the scan projects and the repository projects, and `side` holds the roots left for readPersonal; manifests tests 63/63 pass and fail on the unchanged tree.
- 3: holds. `repositoryRule` and `repositoryManifests` follow the brief's rule for each tier and type. Standards 1 notes where the entry findings are filed.
- 4: holds. `reaches` in writes.ts answers not found for an app's write to a repository project; `holding` in hubs.ts accepts a repository manifest; `isRepositoryFile` is present as the brief asks.
- 5: holds with a departure. The scope is the root key (`scopeOf`), where the brief asked for the project's folder as the record holds it. See Spec 1. The missing open-file link is Spec 2.
- 6: holds. Project.svelte passes `deposit` false and keeps `<Latex/>` for a repository project; latex +server.ts uses `isRepositorySide`; the deposit route answers 404 (case run).
- 7: holds. schema/run.ts `repositoryReach` adds `roots[key] = ['.oculus/project.yml']`; the case run shows the `manifest` schema.
- 8: holds. Selectors `hubRoot` skips a repository project; the palette label is `repository?.root ?? folder`; project-context writes the absolute folder, which matches side repositories (normalise-parts/personal.ts:219).
- 9: holds. config/roots.ts `itemShape` carries `tier`, `itemText` writes it, `losesTier` refuses a tier change of a kept entry; roots.test.ts 3/3, 1 failing on the unchanged tree.
- 10: holds. The splits are pure moves (point (f) below); every changed file is within its size limit and folder-check passes.

Cases of the brief's "Cases":

- 1, 2, 3: met, by the manifests tests and the case runs (alpha under manuscripts with its repository).
- 4: met for the tier. The hub-roots row does not assert that the third root keeps `hub === true` (Proof 2).
- 5 to 7: met, by the hub-roots and manifests tests.
- 8: met. The test has no positive control for the app path, but reading writes.ts confirms `reaches` is what answers not found.
- 9 to 11: met, by the write and undo tests and the case runs.
- 12: met as specified (scope `alpha`, the repository read). The missing link (Spec 2) and the deposit-root finding (Behaviour 2) are filed separately.
- 13 to 24: met, by the case runs quoted above and the kept tests.
- 25: partial. The run covers the roots write (order and remove). The Settings records editor path is not exercised, and reading shows its "none" choice writes `tier: ''` (Behaviour 1).

The orchestrator's points:

- (a) The NOT DONE audit link. No item of the brief requires a link: item 5 and case 12 ask for the repository to be read and for the scope. The report's reason for not building it is wrong. It says a link "needs a new shape in the `Finding` record (`src/lib/data/model/model-entities.ts:15`)", but audit rows are `AuditFinding` (`src/lib/data/model/index.ts:316`, `export type AuditFinding = Rooted & {`), and `Rooted = { root?: string }` (model-entities.ts:12) already carries a root. The Audit view already opens `openSourceFile(client, { root: rootOf(finding), path: finding.file })` (Audit.svelte:150), and the collector spreads `...finding`, so a rule can pass `root`. The fix uses the existing field: the rule sets `root: project.repository.root` and `file: relative(project.repository.dir, path)` for a repository project, and AuditFinding's comment ("below the hub the root names") is reworded. No new wire key is needed. Today a reader sees the scope `alpha` and the `where` (for example README.md) as plain text, with no link. The open item should be dropped and the link built in a repair round.
- (b) Files outside the write list, and whether each is needed:
  - publications.ts, rules.ts: needed only because of the `scopeOf` departure (Spec 1).
  - docs.ts: comment only.
  - chat.ts: follows the `projectDirectory(home, project)` signature change.
  - entities.svelte.ts, socket.svelte.ts: import paths after the split.
  - life/calendar.ts: head comment.
  - server.yml: the `not_repository_file` text.
  - workbench.yml: `desc_side_project_schema`, which was false.
  - HELP.md:232: the Personal paragraph, which was false.
  - docs/apps.md:161: the `manifest` row, which was false.
  - DATA-MAP.md lines 58, 265, 391 and 466: each said an id is a folder name or that a repository is a side project.
  - options.yml 1372-1376: next to the named range.

  Collision with D61 (worktree head a35863cc6), compared with `diff -rq` against D61's base and against main:
  - workbench.yml: D61 changes lines 1, 10-11 and about 215-230; D60 changes only `desc_side_project_schema` (line 26, line 28 in D61's copy). The lines differ, so the merge is simple, but the file is not in `shared_paths`.
  - DESIGN.md: D61 changes 476 and 578; D60 changes 558 and 593.
  - HELP.md: D61 changes 35, 58, 82 and inserts after 216; D60 changes 169, 232 and 452.
  - D61 does not touch context.ts or the moved model files.

  D62 has no brief, so a collision cannot be judged. D60 changes docs/apps.md lines 125 and 161, a file D62 is likely to change.
- (c) Judgment calls:
  - Absolute folder: consistent with side repositories; accepted.
  - `scopeOf` root key: defensible, but the reason given is wrong (Spec 1).
  - Absolute chat context directory: follows from the folder; accepted.
  - `DeckProject.repository`: needed for projectDecks' `{root, path}`; accepted.
  - `tier` in rootItemsShape: accepted, with Behaviour 1.
  - The ten new finding texts: read and plain; one contradiction (Behaviour 3).
  - A second hub's roots left unread (`portfolioConfigOfOther`): consistent with the first hub being the only one that gives research tiers; accepted.
- (d) Z778, by reading: `boardItemOf` (selectors.svelte.ts:345-358) looks in `personal[id]` and then in `projects[id]`. `root:alpha` is in neither once the repository is a research project, so Project.svelte:113-114 draws `<Empty message={t('project.unknown', id)}>`, which reads "The snapshot holds no project with the id root:alpha." (project.yml:129). This is the consequence Z778 states.
- (e) Holds: `git status --short` shows no index entry. The builder's own git commands are stated in its report, judgment 13.
- (f) Holds:
  - model-calendar.ts and model-mail.ts differ only in the head comment; model-connect.ts is identical.
  - payloads.ts differs only in import paths.
  - model-deck.ts is the removed block plus a head comment and one type import.
  - client-state.ts's `TabScopeStore` and `ClientState` are byte-identical to the base context.ts, which re-exports them.
  - No importer of an old path remains (grep). svelte-check reports 0 errors, and unused-exports adds no line.

## 1. Spec

- src/lib/server/content/audit/rules.ts:221-223: "`return project.repository?.root ?? project.folder;`".
  - What is wrong: the brief's item 5 says the scope of a finding is the project's folder as the record holds it, and the build uses the root key for a repository project. The change also pulled publications.ts (which already used `project.folder`) and rules.ts outside the write list. The report's reason (judgment 3, report line 572) says the alternative "would put a machine path into a signature kept in `~/.oculus`". Muted signatures are written to the `audit_ignore:` list of config/behavior.yml (audit-mute.ts:1-2), a tracked engine file, not `~/.oculus`.
  - Failure scenario: the orchestrator accepts the departure on a stated reason that is false. The real reason (no machine path in a tracked file) is stronger, but it is not the one written.
  - Verdict: item 5 departs from its brief. This is the orchestrator's call to accept; the report's judgment 3 needs its storage location corrected.
- Report line 1 and line 455: "Giving it a link needs a new shape in the `Finding` record (`src/lib/data/model/model-entities.ts:15`...), so it is raised as an open item below and not built".
  - What is wrong: the premise names the wrong type. AuditFinding is `Rooted & {...}` (index.ts:316) and already has `root?`; Audit.svelte:150 already opens `{ root: rootOf(finding), path: finding.file }`. The link can be built inside the brief with no new wire shape (point (a)).
  - Failure scenario: Axel is given an open item to rule on that needs no ruling, and the repository project's audit rows stay without a link.
  - Verdict: the open item rests on a wrong premise; send back for a repair that builds the link.

## 2. Proof

- Report, unchanged-tree evidence: the report quotes 27 failed and 39 passed out of 66 on the unchanged tree without saying how the new tests import `repositoriesOf`, an export the base lacks.
  - What is wrong: without an alias every manifests row fails with `TypeError: repositoriesOf is not a function`. With the alias I reproduced 26 failed and 37 passed (63), plus roots 1 failed and 2 passed (3). That matches the report's counts and failing titles, but the "pass (behaviour kept)" rows of cases 3, 16 and 17 only run under the alias.
  - Failure scenario: a reader who reruns the claim without the alias sees every row fail and cannot tell which rows prove kept behaviour.
  - Verdict: none; the report should name the alias.
- tests (hub-roots row for case 4): the row asserts the tier of the third root but not that it keeps `hub === true`.
  - Failure scenario: a change that drops `hub` on a root with a tier passes this row.
  - Verdict: case 4 met, with a missing assertion.

## 3. Standards

- src/lib/data/sources/manifests.ts:301-313: "`const file = join(root.dir, ROOT_FOLDER, MANIFEST);` ... `findings.push({ file, key: root.key, message });`".
  - What is wrong: the entry findings `repository_id_taken`, `repository_no_manifest` and `repository_tier_no_rule` (line 256) are filed on `<root>/.oculus/project.yml` with the root's key. The brief says "a finding on the entry", and readRoots files its entry findings on sources.yml.
  - Failure scenario: on the Findings view, a `repository_no_manifest` row points to a file that does not exist, and the entry to fix is in sources.yml.
  - Verdict: minor; item 3 holds.

## 4. Behaviour

- config/catalogs/options.yml:1372-1376, with src/lib/state/system/config/editors/fields.ts:203-218 and 592: "`options: [projects, coauthor, archive, personal]` / `empty: none`" and "`if (picked === '') return emptyIsValue(spec) ? '' : undefined;`".
  - What is wrong: `empty` is set on a choice, so `emptyIsValue` is true and choosing "none" in the Settings records editor gives `''`, which `writtenField` writes as `tier: ''`. readRoots' `tierOf('')` returns null, which raises `tier_unknown` ("tier is none of projects, coauthor, archive and personal").
  - Failure scenario: a user clears a root's tier in Settings and gets a spurious finding on the Findings view.
  - Found by reading, not run. The fix is to drop `empty` from the field or to read `''` as no tier.
  - Verdict: case 25 partial.
- src/lib/server/content/audit/projects.ts:346-352: "`if (isFolder(join(folder, 'code')) && !existsSync(join(folder, 'code', 'README.md'))) { add({ ... ...sentence('audit.msg_code_no_readme') })`".
  - What is wrong: the conformance rules run on a repository project, which has no Deposit under Z780. They raise "code/ has no README.md (the deposit root)" (it appears in the case 12 run output) and possibly other hub-layout conformance findings. The report's visible-change table has no row for this.
  - Failure scenario: every repository project with a code/ folder carries an audit finding about a deposit it cannot have.
  - Verdict: case 12 met as specified; this is a visible change neither stated nor handled.
- src/lib/server/files/files.ts:330-336 with config/text/findings.yml:32: "`tier_on_hub: a hub root takes no tier; the root is a hub and its tier is not read`".
  - What is wrong: `tier_on_hub` is pushed whenever `hub: true` and a tier are both set, including when `hubRefusal` refuses the hub. The root is then read as a plain root, but the text says it is a hub.
  - Failure scenario: the Findings view shows two rows on one entry that contradict each other.
  - Verdict: minor; item 1 holds.

## Declined to judge

- Collision with D62: D62 has no brief (stopped at /spec on open item 46), so its write list is unknown. D60's changes to docs/apps.md lines 125 and 161 are the likely overlap.
- The Settings records editor "none" path was judged by reading only. Running it needs the app, which this review may not start.
- Look items that need a rendered page (the board card for a repository project, the Project view without Deposit) were judged by reading the markup only.
- Whether the `scopeOf` departure is accepted is the orchestrator's decision.

Reviewer usage: adf31b9db8965f209, claude-opus-5-5, 79,744 tokens, 120 tool uses, 21.3 min (from the completion notice).


## Repair round 1, refuted

Over the round's delta (`D60-round1-delta.diff`), read against `git diff 69b16a679` and the untracked files in `.agents/worktrees/D60`, base 69b16a679.

```
$ npm run diagrams                                   (tools/oculus in the worktree)
... docs/diagrams/channels.dot, channels.svg, writes.dot, writes.svg (last lines)
$ git status --short   (before and after diagrams, compared with diff)
STATUS-UNCHANGED   (80 lines; shasum -c of every changed docs/diagrams file: all OK)
git diff 69b16a679 --stat: 74 files changed, 2574 insertions(+), 2066 deletions(-) (same before and after)

$ npm run test:quick -- --base 69b16a679
test:quick: 81 changed file(s), from git since 69b16a679
test:quick: 129 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.7 s)
ok      eslint (1.3 s)
ok      svelte-check (5.0 s): 1791656514194 COMPLETED 458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (26.1 s): Duration  22.40s (transform 23.96s, setup 0ms, import 42.83s, tests 44.80s, environment 331ms)
test:quick: 26.6 s (limit 45.0 s); every command passed
(a second run: test:quick: 28.4 s (limit 45.0 s); every command passed)

$ npm run test:checks
 Test Files  17 passed (17)
      Tests  271 passed (271)
   Duration  306.93s

Verify grep 1 (the brief's pattern over src): no output, exit 1
Verify grep 2 (grep -rn "project\.folder\|manifest\.folder\|project\.deck" src): 27 hits; 26 without options.ts:488 (project.deckTags, which the report's \b form leaves out); the same sites as the report's list, line numbers as the report gives them after the round

$ sh utils/unused-exports.sh, diffed with D60-base/tools/oculus/unused-exports.txt
Unused exports (246) in both; differences: personalRoots gone from portfolio.ts; CalendarStatus/MailStatus lines moved to data/model/accounts/; no line added

ASCII gate (spec form, src tests bin config, ! -name local.yml): 0 lines
perl non-ASCII over ../../docs/DATA-MAP.md ../../.oculus/config/sources.yml HELP.md DESIGN.md docs/apps.md and D60-report.md: 0 lines
$ sh utils/folder-check.sh: no output, exit 0 (tests/data/hubs holds 4 items)
wc -l, every changed or new file under src and tests: largest docs.ts 815, portfolio.ts 779, context.ts 740; ProjectCard.svelte 520 (at its limit); none over 880/520.
Round files: data/index.ts 412, model/index.ts 682, manifests.ts 516, audit/projects.ts 578, audit/rules.ts 281, files.ts 480, portfolio.ts 779, options.yml 1475, hub-roots.test.ts 310, manifests.test.ts 506, hub-audit.test.ts 113 (all as the report gives)

Case 4 and the rows of items 2, 5, 8:
$ npx vitest run tests/data/hubs/hub-audit.test.ts tests/data/hubs/hub-roots.test.ts tests/data/sources/manifests.test.ts --reporter=verbose
 Test Files  3 passed (3)
      Tests  42 passed (42)
 (hub-audit rows: 624, 500, 922, 850, 742 ms; another run: 668, 596, 486, 461, 479 ms)

$ npx vitest run --tagsFilter slow tests/routes/edit/roots.test.ts --testTimeout 20000
 Tests  3 passed (3)
$ npx vitest run tests/routes/edit/write.test.ts tests/routes/edit/undo/undo.test.ts
 Test Files  2 passed (2)   Tests  28 passed (28)

Cases 12 and 25 and the item 6 run: the builder's round1-runs.test.ts, run as tests/_d60/runs.test.ts in a copy of the worktree's tools/oculus under $TMPDIR (node_modules linked, local.yml excluded):
RUN audit findings naming alpha: [{"scope":"alpha","where":"project.yml","kind":"data","root":"alpha","file":".oculus/project.yml",...},{"scope":"alpha","where":"eli5","kind":"manifest","root":"alpha","file":".oculus/project.yml",...}]
RUN audit findings with a marker in the repository README: [{"scope":"alpha","where":"README.md","kind":"todo","root":"alpha","file":"README.md",...}, ...]
RUN roots fields: ["key","dir","tier"]
RUN order: 200 / file after the order keeps tier: projects and tier: archive / RUN remove: 200
RUN tier spec: {"control":"choice","options":["projects","coauthor","archive","personal"]}
RUN fromPick of the empty item: "undefined"
RUN record written: {"ok":true,"value":[{"key":"ordo","dir":"~/workspace/ordo"}]}
RUN readRoots findings: []
 Tests  3 passed (3)        (the same lines as the report's round section)

First round's case runs (d60-runs.test.ts, cases 1, 10 to 15, 24, 25) in the same copy, over the repaired tree:
 Tests  10 passed (10); alpha tier manuscripts with repository {root:'alpha'}, deck present; api/docs 200; project-files folder ""; latex 200, no tier 404 no-project, side build 400; case 12 as above, no code/ finding; deposit 404 and no Deposit control for alpha; watcher edit, removal, creation, tier archive, type active; present ref {root:'alpha',path:'present'}; hubRoot the hub; projectFolder {root:'alpha',path:''}; schemas manifest and side-project.

Positive control, same copy: a hub project with the hub-audit row 5 manifest (deposited 2026-01-02, reproduced 2026-03-01) raises exactly the message findingText('audit.msg_deposit_before_reproduction', '2026-01-02', '2026-03-01'): Tests 1 passed (1).

The scratch copy was removed afterwards. git status --short in the worktree is identical to its state before the review (STATUS-UNCHANGED, 80 lines).
```

### Verdicts

Items of the brief's "What to build" (the whole diff since the base):

- 1: holds. A refused hub mark now has its `tier` read like any plain root's, and `tier_on_hub` is raised only when the hub stands (files.ts:669-692; hub-roots rows pass). A "Not set" pick in Settings leaves `tier` out of the entry (round run). Behaviour 1 below is a consequence that should be ruled on.
- 2: holds (manifests rows 42/42).
- 3: holds. The entry findings are filed on `rootsFile` and the manifest findings on the manifest (manifests.ts:306-331; rows at :319, :330, :344, :413 and BAD_TYPES at :307).
- 4: holds (case 15 run).
- 5: holds. The audit scope is the root key, now with the right reason (rules.ts:217-221). The audit link is built through `fileIn`. Standards 1 below covers the text that describes it.
- 6: holds (case 24 run).
- 7: holds (write and undo 28/28, case 14 run).
- 8: holds (case 11 run).
- 9: holds (case 15 run).
- 10: holds. Standards 1 below names three sentences, added or left by the round, that are not quite true.

Cases:

- 1 to 3: met (manifests rows; case 1 run).
- 4: met. The row now asserts `hubs: [['lab', true]]` (hub-roots.test.ts:202, :298-299).
- 5: met (BAD_TYPES rows check the manifest file).
- 6: met (`repository_id_taken` on rootsFile).
- 7: met (`repository_no_manifest` on rootsFile; `missing_dir` alone in the hub-roots row).
- 8: met (write and undo tests).
- 9: met (roots.test.ts 3/3; case 25 run).
- 10, 11, 13, 14, 15, 24: met (runs above).
- 12: met. The run reads `<tmp>/alpha`, its findings carry `root: 'alpha'` and a file relative to the repository, and there is no `code/` finding.
- 16 to 23: met (manifests rows).
- 25: met. The fields are key, dir and tier with the four words, a write keeps the tier, and the "Not set" pick writes no `tier: ''`.

Items of the round brief:

- 1: holds. The comment at rules.ts:217-221 and the report's judgment 3 both give `audit_ignore:` in config/behavior.yml as the reason. publications.ts gives no reason, so nothing there needed rewording (`grep -rn "machine path" src/lib/server/content/audit/` finds rules.ts:220 only).
- 2: holds in code. `fileIn` is at rules.ts:254-263, and 16 project-bound sites in projects.ts use it. The two `fileOf` uses left in projects.ts are the collection rules (176, 187, 528-572), and publications.ts:170 is the hub's own publications file, so no project-bound site stays on `fileOf`. A hub project's findings keep no `root` (hub-audit row 4). The NOT DONE row and its open item are gone from the report. Spec 1 and Standards 1, 2 and 3 below are findings on this item.
- 3: holds (report, "First run" section, the paragraph on the alias).
- 4: holds.
- 5: holds. Callers of `rootsFile = ''`: `hubManifests` (roots.ts:123) keeps `.manifests` only and drops the findings. `joinHubs` (data/index.ts:375) passes no roots. Every test caller other than manifests.test.ts passes no roots. So no caller shows a reader an entry finding filed on the empty file.
- 6: holds. The empty item now reads "Not set" (`settings.unset`, FieldControl.svelte:97, `optional` true in Cards.svelte:191) instead of "none". `emptyIsValue` and `writtenField` are untouched. Item 6 of the report says so.
- 7: holds. `msg_code_no_readme` and `msg_deposit_before_reproduction` are skipped for a repository project. The `markers` rule still scanning `code/README.md` does not contradict item 7, which names only those two rules. A marker there is a TODO in a file of the repository, and the finding opens it.
- 8: holds. Behaviour 1 below is a consequence of it.
- 9: not applicable to the tree.

### Findings

- **Spec 1.** `tools/oculus/tests/data/hubs/hub-audit.test.ts:1-113`, the whole new file: "describe('the audit of a repository read as a research project of the first hub', () => { it.each(ROWS)('reads $name', ...".
  - What is wrong: the round brief asked for one row (the retired-document row) "in the existing audit tests". That premise does not reproduce: `find tests -iname "*audit*"` lists only `tests/routes/edit/audit-mute.test.ts` and the new file. No `agents/guarded.md` entry names the audit scan or this file (`grep -n -i audit agents/guarded.md` finds only the audit-mute write under G8).
  - The builder added a new test file with five rows. The rules file says a test exists only as the test of a guarded entry, and that a step needing a new entry stops and asks. The report does not name the entry these rows belong to.
  - Failure scenario: at landing the orchestrator has no entry to write the five titles under. The file is then either a test outside `guarded.md`, which the rules file forbids, or it is dropped and the audit link and the Deposit rule skip are left with no test.
  - Verdict: none for the round item (its code holds). It needs an entry ruled by the orchestrator in automode, for example "an audit finding about a file names the Files root and the path the Audit view opens", or the rows moved under an entry that exists.
- **Standards 1.** Three sentences about `root` on an audit finding are not true for every finding:
  - `tools/oculus/src/lib/data/model/index.ts:310-311`: "A finding about a project read from a repository has that repository's root key for its `root`."
  - `tools/oculus/docs/apps.md:140`: "An `audit` finding about a project read from a repository has the repository's root key for its `root`, its `scope` and its `file` relative to the repository."
  - Unchanged `src/lib/data/model/model-entities.ts:6-11` (`Rooted`, which `AuditFinding` is built on): "A record that says which hub it was read from: the key of the `roots:` entry marked `hub: true`...".
  - What is wrong: `fileIn` (rules.ts:262) returns `{ file: '' }` with no `root` for a path that is no file. So `msg_no_readme`, `msg_bad_folder` and a folder finding of a repository project carry no `root`, which the new row 'a folder of a repository project that is no file as a finding with no file and no root' asserts. A finding that does carry `root: 'alpha'` names a root that is no hub, which the `Rooted` comment and the first sentence of the same apps.md paragraph ("the root's key for another hub") do not allow for.
  - Failure scenario: an app on the `audit` channel reads `root` as apps.md describes it. It treats `alpha` as a second hub, and when it lists alpha's findings by `root === 'alpha'` it misses alpha's missing-README and folder-name findings.
  - Verdict: none (round item 2 holds). Small enough to fix at landing: the three sentences say `root` is the Files root a finding's `file` is relative to, set only when there is a file.
- **Standards 2.** `tools/oculus/src/lib/server/content/audit/rules.ts:205`: "`...(root === undefined || finding.root !== undefined ? {} : { root }),`", with the unchanged head comment at :184-187 ("Given the key of a hub other than the first ... marks the finding with it").
  - What is wrong: the new clause takes effect only when the collector has a second hub's key and the finding carries its own `root`. Only a repository project's findings carry their own `root`, and a second hub has none, because `joinHubs` builds every other hub with no roots (data/index.ts:375-383). For the first hub, `...finding` already carried `root` before the round. The clause is a branch for an input that cannot happen, and the head comment does not mention it.
  - Failure scenario: a reader of the collector concludes that a second hub can hold repository findings and that the hub key gives way to them, which is not how the hubs are built.
  - Verdict: none. A landing fix: drop the clause and restore `root === undefined ? {} : { root }`.
- **Standards 3.** `tools/oculus/tests/data/hubs/hub-audit.test.ts:817-828`: "`row.check(published(from.base, from.hub).audit.findings);`".
  - What is wrong: each row copies demo/ and runs the watcher's first build. Over two runs the rows took 461 to 922 ms. The rules file says a test runs well under a second and one that cannot is tagged slow. Every row of `hub-portfolio.test.ts` goes through the same `published` call and is tagged `slow` (lines 58, 76, 107, 127, 138, 172, 204, 236, 255).
  - Failure scenario: under the parallel suites this machine runs, a row passes a second and the essential run slows down. If the rows are tagged slow instead, they leave `npm test`.
  - Verdict: none. The fix that keeps the rows in `npm test` builds the audit input from `buildPortfolioWithSchemas` and calls `auditFindings` directly, without copying demo/ and without the watcher.
- **Behaviour 1.** `tools/oculus/src/lib/server/files/files.ts:678-692` with `tierRefusal` at :213-232 and `repositoriesOf` (roots.ts:95-112): "`// A root that is no hub, a refused hub mark included, has its `tier` read by the rules of any plain root.`".
  - What is wrong: a `hub: true` entry that `hubRefusal` refuses as `hub_same_dir` or `hub_nested` (on, or inside, the directory of a hub root that stands) now keeps a research `tier`. `tierRefusal` checks only the first hub and earlier research roots. `repositoriesOf` skips hub roots without adding their directory to `seen`. So the directory of a second hub, or a folder inside it, is also read as a research project of the first hub, and page writes reach its `.oculus/project.yml`. The new hub-roots row builds exactly this input (`again` on `lab`'s directory, tier `archive`) and asserts it as the expected result. The report does not state the consequence.
  - Failure scenario: an entry `{ key: again, dir: <the lab hub's dir>, hub: true, tier: archive }` gives one directory as both the second hub `lab` and the first-hub project `again`. It shows on the Archive board with a `repository_no_manifest` finding, or with the second hub's own manifest read as a first-hub project.
  - Verdict: none (round item 8 holds as briefed). The orchestrator rules whether `tierRefusal` also refuses a directory that a standing hub root is, lies in or holds.

Nothing else: the type findings stay on the manifest, the "Not set" pick reproduces as the report states, and every round claim quoted in the report's round section reproduced. Two report details differ and no decision rests on them: the watcher's `rootsFile` argument is at portfolio.ts:675, where the report says :638, and the report's judgment 3 cites rules.ts:222 for `scopeOf` where the return is at :223.

### Declined to judge

- **New tests on the tree before the round.** The failures the report quotes for the hub-audit, hub-roots and manifests rows were judged by reading the before-round code in `D60-before-round1.diff`, not rerun. Rebuilding the tree as it stood before the round to watch the rows fail is a revert of the code under test, which the rules ban. By that reading each quoted failure is the one the before-round code gives. The deposit half of hub-audit row 5 has no quoted failure of its own, because the `code/` assertion fails first. The positive control above shows that half's message matches what the rule raises.
- **`docs/DATA-MAP.md` and `.oculus/config/sources.yml` in the delta.** Their hunks are byte-identical in `D60-before-round1.diff`, in the delta and in `git diff 69b16a679` now (compared with diff). They came from the orchestrator's construction of the delta and are not changes of this round, so they were not judged as round work.
- **The filter the rules file names.** `agents/spec.md` names no output filter (`grep -n -i filter` finds none), so the outputs were cut with tail and grep.
- **What only a page shows.** The Settings records editor's "Not set" item for `tier` as drawn, and a press on an Audit row of `alpha` opening `README.md` under the `alpha` root, were judged by reading FieldControl.svelte, Cards.svelte and Audit.svelte:131-162 only. They are for the look at landing.
- **Whether the "none" to "Not set" label of the empty item is acceptable.** That wording choice is the orchestrator's.

Reviewer usage: a474ba6bf852ae0e1, claude-opus-5-5, 269,002 tokens, 88 tool uses, 19.5 min (from the completion notice).

## Closed

The run over repair round 1 is the last run; its findings go to landing, none back to the builder.

- Spec 1 (hub-audit.test.ts without a guarded entry): closed at landing by removing `tests/data/hubs/hub-audit.test.ts`. The rules file keeps a test only for behaviour whose failure costs something (lost work, a broken installation, a wrong configuration accepted); an audit finding that opens the wrong file, or a Deposit finding raised on a repository project, costs none of these, so no entry is due and none is asked for. The behaviour stays shown by the quoted runs of case 12 and the round (`agents/reviews/D60-report.md`, "Repair round 1"), which this review reproduced. The round brief's "existing audit tests" was a false premise of the round brief.
- Standards 1 (three sentences on an audit finding's `root`): fixed at landing in `src/lib/data/model/index.ts` (the `AuditFinding` comment), `src/lib/data/model/model-entities.ts` (the `Rooted` comment) and `docs/apps.md` (the hubs paragraph and the `audit` row): `root` on an audit finding is the Files root its `file` is relative to, a repository's key only when the finding names a file of it.
- Standards 2 (the collector's clause for a case that cannot happen): fixed at landing; `collector` in `rules.ts` is back to `...(root === undefined ? {} : { root })`.
- Standards 3 (hub-audit rows near a second each): closed with Spec 1, the file removed.
- Behaviour 1 (a research tier on the directory of a hub root): fixed at landing in `readRoots` (`src/lib/server/files/files.ts`): after the list is read, a research `tier` on a root whose directory is, lies inside or holds the directory of a hub root that stands is refused with the new finding `findings.roots.tier_in_hub`, whichever of the two is listed first. The G13 row 'a tier on a hub mark that is refused as a plain root of that tier...' now expects no tier and both findings, and a new row covers a plain root listed before the hub on its directory.
- Declined point "none" read as "Not set": kept; it is the Settings editor's existing word for the empty item of every optional field (`settings.unset`).
