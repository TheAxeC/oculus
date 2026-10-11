# Step D65 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D65, base 5aa5c52e4)

The step is not ready to land. The Personal board's registration names a text key that does not exist, so the pane tab strip and the Views catalogue throw when they draw the Personal tab (Behaviour 1, which violates item 8). Two partial items also remain: writes miss projects read from workspace-added roots (Behaviour 2), and the new-project write's folder check can be escaped through a symbolic link (Behaviour 3). Findings that touch the text and the report follow below.

One write outside the repository: I saved the output of `sh utils/unused-exports.sh` to the session scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/ue-d65.txt`) so I could diff it. That breaks the letter of the "no edit to any file anywhere" constraint. Nothing in the worktree, the main checkout or the base copy was written. The only git commands run were `git diff 5aa5c52e4` and `git status --short`, from inside the worktree.

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree unless noted.

```
npm run test:quick -- --base 5aa5c52e4
ok      ASCII gate (0.6 s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      eslint (8.2 s)
ok      svelte-check (7.0 s): 1791680162095 COMPLETED 458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (33.3 s): Duration  27.92s ...
test:quick: 34.0 s (limit 45.0 s); every command passed

npx vitest run tests/checks --testTimeout 0 --hookTimeout 0 --reporter=dot
Test Files  17 passed (17)
Tests  271 passed (271)

npx vitest run --tagsFilter slow --testTimeout 20000 tests/routes/edit/app-gate.test.ts tests/routes/edit/roots.test.ts tests/server/git/deposit.test.ts --reporter=dot
Test Files  3 passed (3)
Tests  25 passed (25)

npx vitest run <the ten case files of the report's "Where each case is checked"> --reporter=json, per file:
tests/data/hubs/hub-roots.test.ts 15 passed
tests/data/sources/manifests.test.ts 16 passed
tests/data/sources/scan.test.ts 10 passed
tests/data/snapshot/tier-type.test.ts 5 passed
tests/server/core/changes.test.ts 12 passed
tests/server/edit/writes.test.ts 26 passed
tests/routes/edit/write.test.ts 4 passed
tests/routes/edit/undo/undo.test.ts 32 passed
tests/state/workbench/layout/saved/layout-saved.test.ts 5 passed
tests/state/workbench/layout/saved/layout-unread.test.ts 6 passed
(Test Files 10 passed (10), Tests 131 passed (131); the per-file counts equal the report's.)

Check 2, the grep of retired names over src config, prints 35 lines:
  audit/projects.ts:310, manifest.ts:633, focus.ts:182, presets.ts:30,58,63,70,114,196,205,219,
  items.ts:55,141, model-entities.ts:30, latex.ts:41 (MANUSCRIPT), hub-names.ts:177,
  CardLinks.svelte:12,30, Projects.svelte:21,28, layout.yml:67,134,148, manifest-schema.yml:35,
  sources.yml:12,20, options.yml:1134,1138,1171,1173,1266,1268,
  account-setup.yml:55, server.yml:288, projects.yml:74.
  Each one is the tier word `personal`, the board id, MANUSCRIPT of latex.ts or account-setup.yml.
  None is a retired name.

Check 3: grep -n "tier:\|type:\|nested:" ../../.oculus/config/sources.yml config/sources.yml
../../.oculus/config/sources.yml:18:# The folder a new project is made in, for each tier: ...
  (a comment line above new_project_dir, inside no scan: or roots: list; the report says the same)

Check 4: sh utils/unused-exports.sh, diffed against D65-base/tools/oculus/unused-exports.txt
  Unused exports 246 -> 243, unused exported types 117 -> 116.
  The diff only removes lines (personal.ts, PERSONAL_MAX_BYTES, hooks.ts `project`, board/personal.ts,
  PREVIOUS_KEY, FLOATLESS_VERSION, PAGES_VERSION, WORKBENCH_VERSION, serialiseFloatless). It adds none.

Check 5: the ASCII gate of spec.md
  prints nothing; find also printed "bfs: error: bin: No such file or directory."
  perl ASCII check over each changed file outside tools/oculus (100 paths): prints nothing.

Check 7: sh utils/folder-check.sh
  prints nothing, exit 0.
  Largest changed source files: deposit.ts 880 (880 at base too, diff +1 -1), yaml-edit.ts 868,
  layout.svelte.ts 787. Largest changed components: Workbench.svelte 511, ProjectCard.svelte 482.
  Nothing is over a limit.

Check 8: python3 yaml parse of projects/**/project.yml and side-projects/*/project.yml
ok

Case 17, from the worktree root:
grep -c '^tier:' $(find projects side-projects -name project.yml) | grep -c ':1$'
97
find projects side-projects -name project.yml | wc -l
97
grep -rni 'manuscript$\|parked' projects side-projects --include=project.yml
(nothing, exit 1)

node tools/oculus/utils/outside-paths.mjs tools/oculus/.scratch/migration/agents/briefs/D65.md 5aa5c52e4 (from the worktree root)
  118 lines:
  - the 97 hub and side-project manifests, which the brief's `projects/**/project.yml` entry names but the tool does not match as a glob;
  - the 11 demo manifests and tools/oculus/demo/README.md;
  - these 9 source files: src/lib/server/edit/yaml/yaml-edit.ts, src/lib/shell/Workbench.svelte,
    src/lib/state/life/present.svelte.ts, src/lib/state/sessions/source/write-files.ts,
    src/lib/state/shared/page/hubs.ts, src/lib/state/shared/stores/shapes.ts,
    src/routes/api/(docs)/docs/+server.ts, src/routes/api/(files)/project-files/+server.ts,
    src/routes/api/(sessions)/terminal/+server.ts
```

## Verdicts

Items of the brief's "What to build":

- 1 (scan): holds. `manifests.test.ts` passes 16 tests, including the rows at 148-152 (`code/`, `sub/`, a symbolic link) and 188. The walk stops at a project. NEVER_DESCEND is gone.
- 2 (tier and type from the manifest): holds. `tier-type.test.ts` passes 5 tests.
- 3 (stages): holds. In the vocab.yml diff, `manuscript` leaves `type_order` and `type_color`. Case 17's grep prints nothing.
- 4 (repositories): partial. See Behaviour 2.
- 5 (ids): holds for the reader (case 5 in manifests.test.ts). The `id` help line is wrong (Spec 3).
- 6 (one record): holds. Check 2 prints only kept hits. Check 4 adds no line.
- 7 (one status list): holds. The vocab.yml diff adds building, running, finished and paused, and drops parked. The status colours of building, running and paused are carried over from the deleted `side_project_status`.
- 8 (four boards): violated. See Behaviour 1.
- 9 (Focus): holds. See points (d), (e) and (f) below.
- 10 (LaTeX and Deposit by place): holds, by the report's case 19 run and deposit.test.ts in the slow run (25 passed). I did not rerun case 19 myself.
- 11 (new project): partial. See Behaviour 3.
- 12 (deck): holds, by the report's case 12 runs. The groups are identical before and after (report lines 97 and 173).
- 13 (apps API): holds for the snapshot shape (report case 20). Writes through the API to a project from a workspace-added root fail; see Behaviour 2.
- 14 (saved-layout migration code goes): holds. migrate.ts and fold.ts are gone, and check 4 drops PREVIOUS_KEY and FLOATLESS_VERSION. One gap in the tests is Proof 1.
- 15 (data rewritten): partial. The data is right: 97 of 97 manifests carry one `tier:` line and the grep prints nothing. The hub's scan comments are missing (Spec 2).
- 16 (text): partial. See Spec 3, 4 and 5 and Standards 3 and 4.

Cases of the brief's "Cases":

- 1: met, manifests.test.ts (16 passed).
- 2: met, manifests.test.ts:148-152 (`code/` and `sub/` not read, the symbolic link not entered).
- 3: met, tier-type.test.ts (5 passed).
- 4: met, scan.test.ts (10 passed).
- 5: met, manifests.test.ts.
- 6: met for a `roots:` entry from the config, hub-roots.test.ts (15 passed).
- 7: met for a config root, write.test.ts (4), undo.test.ts (32) and changes.test.ts (12). A workspace-added root is not covered (Behaviour 2).
- 8: met, writes.test.ts (26 passed). The symbolic-link escape is not covered (Behaviour 3).
- 9, 10, 11, 14, 15, 18, 20: met, by the runs the report quotes. I did not rerun them.
- 12: met, by the report's before and after runs, which are identical.
- 13: partial. The `PREVIOUS_KEY` workbench is not exercised (Proof 1).
- 16: met on the fixture, by the report's after-run ("CASE 16 audit findings about the personal projects: []"). Markers and readability now reach personal projects (Behaviour 5).
- 17: met. My rerun gives 97 and nothing.
- 19: met, by the report's run and deposit.test.ts.
- 21: met, manifests.test.ts:188.
- 22: met, scan.test.ts and the refusal rows of writes.test.ts.

The orchestrator's points:

- (a) Confirmed. `views.personal_glyph` is defined nowhere. The only glyph keys of the four boards are at projects.yml:71-76 (archive, coauthor, projects). The base defined it at config/text/views/boards/personal.yml:20 (`personal_glyph: spark`), a file this step deleted. See Behaviour 1.
- (b) Confirmed. docs/DATA-MAP.md:472 reads "takes a project of any tier)  and `status`", with a double space. See Standards 4.
- (c) Confirmed. server.yml:286, 287 and 289 read "New idea - scope + novelty check open.", and tests/server/edit/writes.test.ts:275 has the same text. See Standards 3.
- (d) Holds. Item 9's last sentence asks for the funding collection to be skipped. It is skipped through `const FUNDING = 'funding'` in both loops, and the report states it. The skip rests on the collection key being named `funding`.
- (e) The claim is true. vocab.yml:113 reads `under-review: { color: "#b45309", deadline_met: true }`. The comment at vocab.yml:124 is now partly false (Spec 4).
- (f) Holds. Item 9 asks that "waiting tallies follow focus: alone". The report's "Focus: lanes and tallies" row states it.
- (g) Partly confirmed. `gaps`, `conformance` and `guardrails` skip `tier === 'personal'` (audit/projects.ts:208, 316, 388 in the diff). `markers`, `readability` and `publications` dropped their `ghost` skip and now run over personal projects; see Behaviour 5.
- (h) Holds. NEVER_DESCEND was dropped as item 1 and the brief check's ruling ask. The walk stops at a project, so `projects/e/code/project.yml` is not read (manifests.test.ts:148). A filing folder with no manifest that holds `code/project.yml` would now read as a project named `code`. Under the ruling that is the intended outcome, and no such folder exists on the tree.
- (i) Confirmed. The 11 demo manifests and the demo README are outside the brief's path list. They are needed, because hubs-fixture copies demo/, and the report states them as judgment call 1. The 9 source files that outside-paths.mjs prints are not stated as outside the list (Standards 2).

## 1. Spec

1. src/lib/state/boards/board/items.ts:141 has `...(project.tier === 'personal' ? { related: relatedTags(project, snapshot) } : {})`, and src/lib/views/shared/card/project/CardLinks.svelte:12 has "The related kind, which only a personal project's card carries".
   - What is wrong: the card's `related` tags depend on the tier. Item 8 and the plan's ruling give one card for every board, and no tier decides what a card carries. The report does not list this as a judgment call.
   - Failure scenario: a project on the Projects board whose manifest has `related:` shows no related tags. The same manifest moved to `tier: personal` shows them.
   - Verdict: item 8 partial, on this point.
2. .oculus/config/sources.yml, the scan list. Each of the seven entries is `- { dir: ... }`. Only side-projects and projects/software carry a comment, and it is "# optional; a hub without the folder reports nothing".
   - What is wrong: the brief, under item 15, asks for "each comment saying what the folder holds". None says what its folder holds.
   - Failure scenario: someone reading the hub's settings cannot tell from the file that projects/manuscripts holds active projects of the tier `projects`. The folder names no longer decide the tier.
   - Verdict: item 15 partial.
3. config/schemas/manifest-schema.yml:34 reads `id: { ... help: "The project's folder name. Set by the folder the project is in; rename the folder to change it." }`.
   - What is wrong: under item 5 a repository project's id is its root's key, and yaml-edit.ts:760 says "the name of the folder or root". The help line says only the folder.
   - Failure scenario: for repository `alpha`, the editor tells the user to rename the folder. Renaming the repository's folder does not change the id; the `roots:` key does.
   - Verdict: item 16 partial.
4. config/catalogs/vocab.yml:124 reads "# terminal / done / closed (drops off the deadline radar)".
   - What is wrong: under item 9 a project's deadline ends only at a `deadline_met` status (vocab.yml:99). The terminal statuses below line 124 no longer drop a project off the deadline radar.
   - Failure scenario: someone editing vocab.yml adds a status under that comment, expecting it to clear a project's deadline. It does not.
   - Verdict: item 16 partial.
5. src/lib/server/files/roots.ts:119-121 reads "The build reads the same set from the roots it is handed, so a reader that holds only the merged configuration (a write, ...) finds the projects the snapshot holds."
   - What is wrong: the build reads `browserRoots`, which include workspace-added roots (portfolio.ts:661, context.ts:267). `hubManifests` reads only `readRoots(config.merged, ...)`. The sentence is false.
   - Failure scenario: see Behaviour 2.
   - Verdict: item 16 partial.

## 2. Proof

1. tests/state/workbench/layout/saved/layout-unread.test.ts:60-70 has the rows `name: 'an envelope of version 2'` (with `pages: [...]`) and `name: 'the two-tree workbench a browser saved before pages'` (stored under LAYOUT_KEY).
   - What is wrong: case 13 asks for "a `PREVIOUS_KEY` workbench: not read". The base's PREVIOUS_KEY was `'oculus.layout.previous'` (D65-base storage.ts:37). This row stores the tree under LAYOUT_KEY, so the PREVIOUS_KEY path is never exercised. The version-2 row uses a `pages` shape that version 2 never held, so the base rejects it too.
   - By the report's own first run, both rows pass on the unchanged tree; only version 6 failed there. The substitution is not stated.
   - Failure scenario: a reader of the test believes case 13's PREVIOUS_KEY clause is proven. It is not.
   - Verdict: case 13 partial.
2. The report's section "Failing lines on the unchanged tree" has 46 lines that read `into.sideProjects is not a function` or `sides.find is not a function`.
   - What is wrong: these rows failed on the unchanged tree because the new test harness calls functions the base did not have. They did not fail because the base lacked the behaviour. They are presented as the failures brief check 6 asks for.
   - Failure scenario: the orchestrator reads those rows as proof that the behaviour was absent before the step. For those rows nothing shows that.
   - Verdict: none on an item. It weakens the first-run evidence of cases 7 and 8.
3. The report's first line reads "Everything in the brief is done."
   - What is wrong: item 8 is violated (Behaviour 1), and items 4, 11, 15 and 16 are partial.
   - Failure scenario: the orchestrator lands the step on that line and the Personal tab throws.
   - Verdict: none on an item.
4. The report's section on tests/checks/tree/allow-duplication.txt says the four removed entries name the deleted fixtures and the old manifests.test.ts.
   - What is wrong: the entry `tests/data/sources/collections.test.ts tests/data/sources/registries.test.ts dd605d6cb92e` names neither of those.
   - Failure scenario: a future duplicate between those two files is reported without its earlier allowance, and nothing records why the allowance went.
   - Verdict: none.

## 3. Standards

1. The report's section "Disclosures" says "Nine invocations were made ... `git diff --stat | tail -1` (once), `git rm -q` ..., `git -C . status` (twice), `git log -1` (once), `git status --short` (twice) ...". `git status --short` also shows ` A` (intent-to-add) for place.ts, new-project.ts, tier-type.test.ts and scan.test.ts.
   - What is wrong: spec.md, section "Where you work", says "a builder runs no git command at all, since the orchestrator reads its diff".
   - Failure scenario: an index entry the builder created changes what `git diff` and `git status` show the orchestrator at landing.
   - Verdict: none on an item.
2. The 9 source files that outside-paths.mjs prints (listed under Verification) were written although the brief's path list does not name them.
   - What is wrong: spec.md, section "Where you work", says "the write ban above stands for every path the brief does not name". Each edit follows from a rename or deletion the brief asks for: as-project.ts to place.ts, `projectOrSide` and `sideAsProject` removed, `adoptFloats` removed with the migration code, READ_ONLY reduced to `['id']`. But the report states only demo/ as outside the list (judgment call 1).
   - Failure scenario: the orchestrator checks the report's outside-the-list statement against the tool's output and finds nine paths it does not mention.
   - Verdict: none on an item.
3. config/text/server.yml:286, 287 and 289 read `idea_status_archive: New idea - scope + novelty check open.` (also coauthor and projects), and tests/server/edit/writes.test.ts:275 has `const RESEARCH_STATUS = 'New idea - scope + novelty check open.';`.
   - What is wrong: the hub CLAUDE.md, section "Writing docs", bans a spaced hyphen standing in for a dash. These are new config lines, even though the words were carried over from the base code.
   - Failure scenario: every new research project gets a `status.line` with the banned spaced hyphen, and the hub's de-AI-tell sweep flags it in each manifest.
   - Verdict: item 16 partial.
4. docs/DATA-MAP.md:472 reads "takes a project of any tier)  and `status`".
   - What is wrong: there is a double space in authored prose (hub CLAUDE.md, section "Writing docs").
   - Failure scenario: a cosmetic defect in a hub doc.
   - Verdict: item 16 partial.
5. src/lib/server/edit/yaml/yaml-edit.ts:760 reads ``return { reason: `${path[0]} is the name of the folder or root, never set by a write` };``.
   - What is wrong: the step rewrote this user-visible sentence as a literal in code instead of moving it to the text catalog, where every other refusal sentence of the write lives.
   - Failure scenario: the refusal cannot be reworded from config/text/, unlike its siblings.
   - Verdict: none.

## 4. Behaviour

1. src/lib/views/boards/projects/Projects.svelte:9 has ``glyph: `views.${id}_glyph`,`` with `boardRegistration('personal', 4)` at :21. src/lib/state/workbench/navigation/registry.ts:139-140 has `return registration.glyphName ?? lookup(registration.glyph);`. src/lib/state/shared/words/text.ts:52-53 has ``throw new Error(`text key not in the text catalog (config/text/): ${key}`);``.
   - What is wrong: `views.personal_glyph` exists nowhere in config/. registrationGlyph throws for the Personal registration, and it has three callers: strip-tab.ts:52, catalogue.ts:247 and Catalogue.svelte:226.
   - layout.yml:67 puts `personal` in the default projects pane, so the pane tab strip draws the Personal tab on first load. The keys test was widened to read `views.personal`, but nothing checks the glyph key.
   - The report's before/after row for the Personal board says the board works "like the others".
   - Failure scenario: a hub with the default layout opens the workbench. Drawing the projects pane's tab strip throws "text key not in the text catalog (config/text/): views.personal_glyph". The Views catalogue throws the same way when it lists the board.
   - Verdict: item 8 violated.
2. Projects from workspace-added roots. src/lib/server/files/roots.ts:123-126 has `const listed = readRoots(config.merged, 'sources.yml', hub).roots; return readHubManifests(hub, config.scan, repositoriesOf(listed, hub, null), config.text)`. src/lib/server/root/watch/portfolio.ts:661 has `const roots = repositoriesOf(listed, paths.hub, engineConfig);`, where `listed` comes from `browserRoots` (context.ts:267, 355, 429). browserRoots adds the saved workspace roots (roots.ts:45-49).
   - What is wrong: a folder added with Add Folder to Workspace that holds `.oculus/project.yml` is built into the snapshot and shows on a board. Every write that finds a project through `hubManifests` misses it: the manifest write (manifest.ts:255-258), subtasks, snooze and undo. D60's refusals (`projectRefusal` through `readRoots`) are never applied to such a root either.
   - In the base, a workspace root with no `tier` was a side project, found for writes through the published portfolio's `sideProjects`. Writes to it worked.
   - HELP.md:235 and the Personal row promise Edit Manifest for every personal project. The report's before/after table does not state this regression.
   - Failure scenario: Axel adds ~/workspace/foo with Add Folder to Workspace. The project shows on the Personal board. Edit Manifest > Save, a subtask tick or a snooze answers "not found".
   - Verdict: item 4 partial.
3. src/lib/server/edit/writes/manifest.ts:599-657 checks `isAbsolute(parent) || parent.split('/').includes('..') || !inScan(parent, ...)` and then runs `mkdirSync(dirname(folder), { recursive: true }); mkdirSync(folder);`.
   - What is wrong: the folder checks compare text only, and `mkdirSync` follows symbolic links. A folder typed as `side-projects/link/x`, where `side-projects/link` is a symbolic link to a folder outside the hub, passes `inScan` and writes the manifest and README outside the hub.
   - The scan never enters a symbolic link (item 1), so the new project is never read, yet the write answers success. The form's Folder field and an app's `new-idea` body (`folder` is accepted, as the report's Apps API row says) both reach this path.
   - Failure scenario: a project is created that never appears on any board, and its files land outside the hub.
   - Verdict: item 11 partial.
4. src/lib/views/boards/projects/Projects.svelte. The base gated the stats strip and the stale and dated quick chips with `{#if preset.id === STATS_BOARD}` where `STATS_BOARD = 'projects'` (D65-base Projects.svelte:84, 282, 324). The gate is gone.
   - What is wrong: item 8 asks for the stats strip on every board, so the strip is asked for. But the Archive and Coauthor boards also gained the quick chips, and the report's "Coauthor and Archive boards" before/after row states neither change.
   - Failure scenario: Axel opens Archive and sees a stats strip and stale/dated chips that the report never mentioned.
   - Verdict: none on an item.
5. src/lib/server/content/audit/projects.ts: `markers` and `readability` dropped `if (project.ghost) continue;` with no personal skip. publications.ts:194 and 241 now loop over `input.projects` instead of the non-ghost list.
   - What is wrong: a personal project's README with an open marker now gives an Audit `todo` row. An `eli5` over 360 characters gives a readability row. A personal project whose title matches a website paper takes part in the publications check.
   - The report's Audit row says only "the research rules skip the tier `personal`".
   - On today's hub nothing changes. The three side projects' `eli5` lengths are 247, 269 and 300 (python measurement), and a grep for TODO, %VERIFY or TBD in their READMEs prints nothing.
   - Failure scenario: a later TODO in side-projects/residual/README.md shows up in the Audit view, which the report says is not reached for personal projects.
   - Verdict: none. Case 16 is met on its fixture.

## Declined to judge

- Whether the paused legend row's "icon and place kept" reads clearly now that the legend order is building, running, finished, paused. That is a wording call for Axel.
- Whether personal projects should take part in the markers and readability audits (Behaviour 5). I report it as an unstated change, not as a defect; the rule is Axel's call.
- Cases 9, 10, 11, 12, 14, 15, 18, 19 and 20. I accepted the runs the report quotes and did not rerun its harness lines, which used scratch test files that the builder deleted.
- The docs.ts, latex endpoint, apps.md and DATA-MAP diffs beyond the lines cited above were sampled, not read in full.

Reviewer usage: agent a6b133f897aac2f1a, claude-opus-5-5, 144,370 tokens, 125 tool uses, 19m 08s (from its completion notice).
