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
