Not done: decision 12 on the Archive board, where New project writes a project that lands on Projects, not on Archive (item 1 of "Anything in the brief that was wrong or impossible"); everything else in the brief is done.

Two more departures from the brief's wording are named in that section: the roles module is in `src/lib/data/shapes/boards/`, not `src/lib/state/boards/board/`, and `docs/palette.md` is written by `npm run docs:palette`, not by `npm run diagrams`.

# O55 report: the project boards choose their projects by kind, role and state

## Open items of the state file, verbatim

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry. This step adds none.

## The cases' first run, on the unchanged tree

Every case ran before any change. `S` is the scratch folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o55`; `$S/cases.config.mjs` is a vitest config that includes `**/*.cases.ts`; `$S/basetree` is an unpacked copy of `.agents/worktrees/O55-base/` (its `tests` folder compared equal to O55-base's by `diff -r` after every use).

Cases 1 to 25, 28, 30 and 32 ran in the worktree before its first edit: `npx vitest run --config $S/cases.config.mjs --silent=false --reporter=verbose first.cases` (program `$S/first.cases.ts`, output `$S/first-run.txt`). Cases 1 to 14 print, per project, the tier the read gives it, the boards whose `tier:` holds that tier, its bucket (`<board>:<group>`), its Focus lane, whether it is in an unplaced box, `realProjects`, the Archival band, the Orphans card, quick add and the cross-link group.

```
case1 tier=undefined boards=[] buckets=[] lane=revise unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case2 tier=undefined boards=[] buckets=[] lane=review unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case3 tier=undefined boards=[] buckets=[] lane=- unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case4 tier=undefined boards=[] buckets=[] lane=- unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case5 tier=software boards=[software] buckets=[software:(none)] lane=- unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["ideas"]
case6 tier=personal boards=[personal] buckets=[personal:idea] lane=backlog unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["ideas"]
case7 tier=software boards=[software] buckets=[software:(none)] lane=- unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case8 tier=undefined boards=[] buckets=[] lane=run unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case9 tier=undefined boards=[] buckets=[] lane=run unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case10 tier=projects boards=[projects] buckets=[projects:in-progress] lane=run unplaced=0 real=1 archival=[] orphan=1 quickadd=1 xlink=["work"]
case11 tier=undefined boards=[] buckets=[] lane=run unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case12 tier=undefined boards=[] buckets=[] lane=run unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case13 tier=undefined boards=[] buckets=[] lane=backburner unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case14 tier=undefined boards=[] buckets=[] lane=- unplaced=0 real=1 archival=[] orphan=1 quickadd=0 xlink=["work"]
case15: boards read no self; onBoards(case8)=[]
case16/17: config.categories=undefined
case18: categories row check: []
case19: ["boards.projects.stages: boards.projects.stages is not a field a board takes; it is not read"]
case22: quickadd=["qpub"]
case23: venue attention=[{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case24: research=[{"field":"tier","reason":"a new project cannot have the tier research"}] software=[{"field":"tier","reason":"a new project cannot have the tier software"}]
case25: [["work",["xb","xr"]],["published",["xp"]],["ideas",["xn"]]]
case28: projects rollup=[{"label":"in progress","count":3,"color":"#16a34a"},{"label":"idea","count":0,"color":"#7c5cff"}]
case30: boards a research project opens on: none (tier research unknown: undefined)
case32: filters={"category":["in-progress"]} shown=3/3
```

Reading per case. 1 to 4, 8, 9 and 11 to 14 are on no board, since `research` is no tier of the unchanged vocabulary. 3 and 4 are in `realProjects` and on the Orphans card, and 4 is not in the Archival band. 5 and 7 are on Software in no group; 5 is on no lane. 6 is on Personal under `idea` and on the Backlog lane. 10 (`tier: projects`) is on Projects with no finding. 13 sits on Backburner with no finding. 15: no board reads `self`. 16 and 17: no `categories:` list exists. 18: nothing checks a category row. 19: `stages` is no field a board takes. 22: quick add lists the `published` project and neither the personal nor the software one. 23: one project counted; the first run did not split it by project. 24: both writes refused. 25: the groups are `work`, `published` and `ideas`, with the released software project under `work`. 28: the rail counts 3 in green for three live projects. 30: no board takes a research project. 32: the saved value `in-progress` is held as a filter, 3 of 3 shown.

Cases 26, 29 and 31 on the unchanged copy: `npx vitest run --config $S/cases.config.mjs --silent=false --reporter=verbose base.cases` (program `$S/base.cases.ts`, output `$S/first-run-base.txt`):

```
case26: layout options mention cards=["tier","columns","search","label_mode","groups"]
case29 findings: ["boards.ws.hub","boards.ws.match","boards.ws.chips","boards.ws.forms"]
case29 items=["a","b"]
case31 personal groups=["building","released","idea"] buckets=[["i","idea"],["f","building"]]
```

26: a board row has no `cards` key. 29: `hub`, `match`, `chips` and `forms` are each a finding, and both projects are taken regardless. 31: the Personal board draws the groups `building`, `released`, `idea`.

Cases 20, 21 and 21a: `grep -rn "self\|lead" $S/basetree/src/lib/views/boards/collection/; echo "grep exit $?"` printed `grep exit 1`: no collection view reads `self` or `lead`, so no collection has a toggle, a badge or a Role facet.

Case 27: the G29 test with its new row, on the unchanged copy (`$S/g29-base-changed-test.txt`, `$S/g29-base-detail.txt`):

```
     x draws the arrangement of the workspace the browser tab last loaded in its first draw 14ms
 Test Files  1 failed (1)
      Tests  1 failed | 20 passed (21)
AssertionError: expected [ Array(1) ] to deeply equal [ 'main' ]
-   "main",
+   "ab686a18-e5c0-48a3-a7a4-40531af0fc91",
```

(`x` stands for `<multiplication sign>`.) The first draw holds a fresh page id, the default arrangement, until the workspace answer comes. The unchanged test on the unchanged copy: `Tests  20 passed (20)`.

No case was one the brief's own rules got wrong, so the builder did not stop.

## The cases after the change

- Cases 1 to 16, 20 to 21a, 26 and 28 to 32: the new file `tests/state/boards/board/board-rules.test.ts` (G124). On the unchanged copy: `Error: Cannot find module '../../../../src/lib/data/shapes/boards/categories.ts'`, `Test Files  1 failed (1)`, `Tests  no tests` (`$S/g124-base.txt`). In the worktree, `npx vitest run tests/state/boards/board/ --reporter=verbose`: `Test Files  3 passed (3)`, `Tests  75 passed (75)`, 71 of them in board-rules.test.ts, titled by case: the boards a project is on (1 to 15), its category (1, 2, 3, 4, 5, 7, 14, 16), the user's role (1, 2, 7, 8, 9, 12), a board's items with Mine only and the Role facet (1, 2, 7, 8, 15), the card sections (14, 31, 26 with `cards: grid` and with no `cards` key), the rail count (1, 28), the Archival band, the real projects and the Orphans card (3, 4, 6, 7, 16), the Focus lanes (5, 6, 13), the audit's placement findings (10, 11, 12, 13, 1, and the mute signature of case 10's no-board finding), a board's keys (29, 30), a saved category filter (32), the roles of a collection (20, 21, 15, 21a).
- Cases 17 to 19: `tests/data/sources/config/boards.test.ts` (G116). On the unchanged copy it does not load (`categoriesFindings` is no export: `Test Files 1 failed`, 0 tests); in the worktree `Tests  26 passed (26)`.
- Cases 10 and 11: the two new rows of `tests/data/sources/manifests/manifests.test.ts` (G32). On the unchanged copy 2 failed of 36 (`$S/changed-tests-base.log`); in the worktree they pass in every `npm run test:quick` run after the change.
- Case 27: `tests/state/workbench/layout/saved/layout-workspaces.test.ts` (G29): `Tests  21 passed (21)` in the worktree.
- Cases 22 to 25, by quoted run on the worktree: `npx vitest run --config $S/cases.config.mjs --silent=false --reporter=verbose after` (program `$S/after.cases.ts`, output `$S/after-run.txt`):

```
case22: quickadd=["qp","qs"]
case23: venue attention=[{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case23 vp alone: [{"kind":"venue","id":"v1","count":1,"label":"V1"}]
case23 vr alone: []
case24 supervision: {"text":"id: n1\ntier: research\nstage: nascent\nsupervisors:\n  - axel-faes\ntitle: N\nstatus:\n  chips: []\n  line: \"New idea: scope and novelty check open.\"\neli5: N\nnext: Scope the idea; cited-novelty lit check; decide go/no-go.\n","boards":["supervision"]}
case24 software: {"text":"id: n2\ntier: software\nstage: nascent\ntitle: N\nstatus:\n  chips: []\n  line: New project.\neli5: N\n","boards":["software"]}
case24 no tier: {"text":"id: n3\ntier: research\nstage: nascent\nlead:\n  - axel-faes\ntitle: N\nstatus:\n  chips: []\n  line: \"New idea: scope and novelty check open.\"\neli5: N\nnext: Scope the idea; cited-novelty lit check; decide go/no-go.\n","boards":["projects"]}
case25: [["in-flight",["xb"]],["done",["xp","xr"]],["ideas",["xn"]]]
```

22: the `nascent` personal and the `building` software project, no `published` one. 23: the `submitted` personal project with a venue is counted (alone: count 1); the `published` research one is not (alone: no row). 24: Supervision writes `tier: research` and `supervisors: [axel-faes]` and the project is on Supervision; Software writes `tier: software` with `New project.` and is not refused; a form with no tier gives `research`. 25: `building` under in-flight, `published` and `released` under done, `nascent` under ideas, `failed` left out. The heading of the ideas group is "idea" for one project and "ideas" for more (`src/lib/views/shared/links/CrossLinks.svelte:46-49`, keys `xlink_idea` and `xlink_ideas`).

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| Items 1 to 8 of "What to build" | DONE | the cases above; `npm run test:quick` below |
| Decision 12 on the Archive board | NOT DONE | New project on Archive writes `stage: nascent`, which Archive (`stages: { flags: [terminal] }`) does not take; the project lands on Projects |
| Verify 1: `npm run test:quick` once after the last change | DONE | last run `$S/test-quick-4.log`: every line `ok` (ASCII gate, prettier, svelte-kit sync, svelte-check `0 ERRORS 0 WARNINGS`, eslint, vitest checks, vitest, vitest slow), `exit 0` |
| Verify 2: character-set check over every changed file | DONE | `LC_ALL=C perl -ne '...' $(cat $S/changed-final.txt)` (the rules file's command over the 158 changed files) printed nothing, `exit 0` |
| Verify 3: the brief's grep | DONE | 389 hits, `exit 0`, each quoted and judged under "Verify 3" below; none is a tier word, a flag, a chip or a removed name |
| Verify 4: unused exports | DONE | `sh utils/unused-exports.sh` against `.agents/worktrees/O55-base/unused-exports.txt`: two lines differ, both removals (`bucketOf` and `RollupBucket` gone from `src/lib/state/boards/board/index.ts`); the step adds no line |
| Verify 5: each new or changed test on the unchanged tree and after | DONE | "Changed tests" below |
| Verify 6: new comments and document sentences read against the rules | DONE | read; no departure found (judgment); comment width checked by `tests/checks/source/comment-width.test.ts` (see "Checks outside the quick list") |
| `npm run diagrams` | DONE | 14 files under `docs/diagrams/` changed; `tests/checks/diagrams/diagrams.test.ts` passes in the quick runs |
| `npm run docs:palette` | DONE | `docs/palette.md` gains `| Supervision | supervision |`; `tests/checks/diagrams/palette.test.ts` passes (`Tests 1 passed (1)`, and in `$S/test-quick-4.log`) |
| File size and folder rules | DONE | no changed `.ts` file over 880 lines, no component over 520 (awk over the counts below printed nothing); the folders with new files hold 3, 4, 4 and 6 items |
| No history words in new comments and titles | DONE | read; `tests/checks/source/history.test.ts` names only `src/desktop/app.ts:161`, which the step does not change |

## Runs of `npm run test:quick` and whole-suite commands

`npm run test:quick` ran four times, all after the last code change of the main build and `npm run diagrams`:

1. `$S/test-quick-1.log`: eslint red on three lines of files the step changed (`src/lib/data/sources/config/sections/boards.ts:120`, `src/lib/views/boards/projects/Projects.svelte:406,423`); `vitest checks` red in `tests/checks/config/config-folder.test.ts` (4 tests: the expected top-level keys, the catalog files, the flag count, the keys of vocab.yml, all from the step's new keys) and `tests/checks/tree/boundaries.test.ts` (2 tests: the styling lists, from the no-funding card moving into `NoFundingCard.svelte`). Each was fixed and its file rerun alone.
2. `$S/test-quick-2.log`: red in `tests/data/snapshot/references.test.ts` (the reference index did not follow a board's `stages: { words: [...] }`), `tests/state/forms/form-draft.test.ts` (its fixture project lacked `supervisors`), `tests/routes/edit/undo/undo.test.ts` (its tier row wrote the tier the fixture already had). Each was fixed and rerun alone.
3. `$S/test-quick-3.log`: every line `ok`, `exit 0`.
4. `$S/test-quick-4.log`, after the fixes found by the checks outside the quick list (next section): every line `ok`, `exit 0`.

No whole-suite command ran (`npm test`, `npm run test:checks` and `npm run test:slow` were not run).

### Checks outside the quick list

The quick runner names `tests/checks` files that import no changed file as not covered. Eight such tree checks read the whole tree, so they were run once by name: `npx vitest run tests/checks/diagrams/palette.test.ts tests/checks/imports/augments.test.ts tests/checks/imports/cycles.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/source/html-sites.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/size.test.ts --testTimeout 0 --hookTimeout 0` (`$S/tree-checks.log`): 5 passed, 3 failed. The same 3 fail on the unchanged copy (`cd $S/basetree && npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/tree/duplication.test.ts --testTimeout 0`: `Tests 3 failed | 23 passed`), with the same lines:

- `tests/checks/source/comment-width.test.ts`: nine over-wide comment lines on the unchanged tree. Two are in files the step changes, `src/lib/views/shared/forms/NewIdeaForm.svelte` and `tests/data/snapshot/references.test.ts`; they are rewrapped. The other seven are in files the step does not change and stay red: `src/lib/state/client/writes.svelte.ts:640`, `src/lib/state/sources/explorer/view/card-tree.ts:4`, `src/lib/views/shared/card/feed/SaveToLiterature.svelte:89`, `src/routes/+page.server.ts:18`, `tests/data/snapshot/reference-hub.ts:4`, `tests/server/desktop/app-theme-start.test.ts:309`, `tests/ui/controls/editor/kit/comment-rules.test.ts:166`.
- `tests/checks/source/history.test.ts`: `src/desktop/app.ts:161`, not a file the step changes.
- `tests/checks/tree/duplication.test.ts`: `src/lib/views/sources/data/Data.svelte:64 and src/lib/views/sources/venues/Venues.svelte:76 hold the same 6 lines`, neither a file the step changes.
- `tests/checks/diagrams/palette.test.ts` was red from the new Supervision view until `npm run docs:palette`; it now passes.

These three reds are on main already and are no part of this step's paths.

## Changed tests: assertion and allow-list edits, and runs on both trees

Every change to an existing test is listed, with before and after. Most are the tier word: `tier: projects` (and `coauthor`, `archive` where the case is about some tier) becomes `tier: research`, since `projects` is no word of `tiers` now and a manifest with it reads as no tier with a finding.

Word-only edits (`projects` to `research` in manifests and fields, nothing else in the assertion): `tests/checks/config/templates.test.ts` (`'tier: projects          # set'` to `'tier: research          # set'`), `tests/data/hubs/hub-folders.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, `tests/data/hubs/workspace-projects.test.ts`, `tests/data/snapshot/relation-shapes.test.ts`, `tests/data/snapshot/resources.test.ts`, `tests/data/snapshot/schema-rules.test.ts`, `tests/data/sources/manifests/clones.test.ts`, `tests/data/sources/present.test.ts` (`tiers: [projects]` to `tiers: [research]`), `tests/routes/files/project-files.test.ts`, `tests/routes/hubs/hub-routing.test.ts`, `tests/routes/hubs/make.test.ts`, `tests/server/core/changes.test.ts`, `tests/server/edit/deck-edit.test.ts`, `tests/server/git/deposit-compare.test.ts`, `tests/server/git/deposit.test.ts`, `tests/server/root/served-roots.test.ts`, `tests/fixtures/entities-fixture.ts` (`tier: 'projects'` to `'research'`, and `supervisors: []` added), the demo fixture's manifests.

Edits beyond the word:

- `tests/checks/source/keys.test.ts`: the board view ids, before `['projects', 'coauthor', 'archive', 'personal', 'software'].map(...)`, after `boardIds(loadConfig(engineDir()).config).map(...)`; the tier words, before `TIERS.flatMap(...)` from `hub-names.ts`, after `vocabKeys(loadConfig(engineDir()).config.tiers).flatMap(...)`.
- `tests/checks/tree/boundaries.test.ts`: the `state` row's allow-list gains `'data/shapes/boards/**'` with a comment saying why (the boards, the categories and the roles are one rule read on the page and on the server).
- `tests/checks/tree/allow-styling.ts`: the HELD entry `views/boards/collection/Collection.svelte styles .card of ui/frame/Card.svelte through .cards > .slot > :global(.card)` is removed. The no-funding card moved to `NoFundingCard.svelte`, whose `.slot` is now `display: grid`, which stretches the card without a rule on the primitive's class, so no entry replaces it.
- `tests/checks/config/config-folder.test.ts`: vocab.yml's expected keys, before `... 'tiers', 'publication_kinds', 'lifecycle', ...`, after `... 'tiers', 'research_audit', 'roles', 'categories', 'publication_kinds', ...` (no `lifecycle`); the catalog files gain `'views/shared/roles.yml'`; the flag test reads two more rows, `['roles', vocab.roles?.items]` and `['categories', vocab.categories?.items]`, its count before `toHaveLength(38)` with the comment "16 stage flags ... 7 tier flags and the 3 keys of a publication_kinds row", after `toHaveLength(37)` with "14 stage flags, no form flag, 1 chip flag, 7 status flags, 4 lead status flags, no tier flag, the 2 keys of a roles row, the 6 keys of a categories row and the 3 keys of a publication_kinds row", and its title names the roles and categories rows.
- `tests/data/snapshot/normalise.test.ts`: chips `['lead']` to `['parked']` (the chip `lead` is no chip now); `normalise(portfolio(), [], {})` to `normalise(portfolio(), [], { tiers: { research: { label: 'Research' } } })`, the vocabulary `tierOf` reads a tier against; the expected project gains `supervisors: []`.
- `tests/data/snapshot/tier-stage.test.ts`: the comment "absent when the manifest names none of the five" to "absent when the manifest names no word of `tiers`"; rows `tier: projects` to `tier: research`.
- `tests/data/snapshot/references.test.ts`: the row "a vocabulary key of a map in vocab.yml": before a board `groups:` record `- { label: in progress, keys: [manuscript], color: "#16a34a" }` with the reference `engine:defaults/layout.yml:3:37`; after `stages: { words: [manuscript] }` with the reference `engine:defaults/layout.yml:2:22`.
- `tests/data/sources/config/boards.test.ts` (G116): `boards_record` text "must be a map holding its cell or its words" to "must be a map holding its cell"; the `groups` row to the `stages.words` row; new rows for `stages.flags`, a key no block takes, a block that is no map, `forms.flags`, `chips.not_words`, `role`, `tier` as a list, `match`, `cards`, and the `categoriesFindings` describe block (cases 17 to 19).
- `tests/data/sources/manifests/manifests.test.ts` (G32): the scan row loses `category: 'x'` and `expect(projects['hub:b'].category).toBeUndefined()`; the folder row's `expect(...category).toBe('d')` becomes `expect(...folder).toBe('projects/ideas/d/e')`; `expect(read.snapshot.entities.projects['hub:x'].category).toBeUndefined()` is removed (decision 14 removes `Project.category`); the repository row `tier: coauthor` becomes `tier: software`; two new rows for cases 10 and 11.
- `tests/data/sources/scan.test.ts`: scan rows `tier: 'projects'` to `'research'`.
- `tests/routes/docs/audit.test.ts`: tier `projects` to `research`, the audit input gains `self: new Set<string>()`, the title "of the tier projects" to "of the tier research".
- `tests/routes/edit/write.test.ts`: the tier write, before `coauthor`, after `personal`.
- `tests/routes/edit/write-fixture.ts`: `newProjectDir: { projects: ... }` to `{ research: ... }`; the deck finds `tiers: [projects]` and `[archive]` to `[research]` and `[personal]`; `gamma` is a personal project, not an archived one.
- `tests/routes/edit/undo/undo.test.ts`: the tier row, before `tier: 'coauthor'`, after `tier: 'software'` (a tier the fixture's projects, both `personal`, do not have).
- `tests/server/edit/writes-fixture.ts`: `chips: [lead]` to `chips: []`; `newProjectDir` keys `projects` to `research`.
- `tests/server/edit/writes.test.ts`: `newProjectDir` keys and tiers `projects` and `archive` to `research` and `personal`; the row "an archive project sent with no folder" becomes "a software project sent with no folder"; the row "a tier that cannot be made" (`software`) becomes "a tier that is no word of tiers" (`nonsense`), since every word of `tiers` can now be made.
- `tests/state/boards/board/hub-facets.test.ts`: the item field `bucket: ''` to `category: ''`.
- `tests/state/boards/board/items.test.ts`: each row names its board (`board: 'projects'`, `board: 'personal'`) and `presetFor(row.tier, config)` becomes `presetFor(row.board, config)`, since a board id is no tier now.
- `tests/state/forms/form-draft.test.ts`: the fixture project gains `supervisors: []`.
- `tests/state/workbench/layout/saved/layout-workspaces.test.ts` (G29): one row renamed and changed, "reads no arrangement of another workspace and saves none before it has come" (the tab memory carries A, A and B are seeded, the saved arrangement is read only for A, nothing is sent before the answer, the answer B gives `['other']`, A's arrangement lacks `Early`); one new row, "draws the arrangement of the workspace the browser tab last loaded in its first draw". `tests/fixtures/state-server.ts` lets `page(memory?)` hand a tab memory to `createClientState`.

Runs on the unchanged tree: the changed tests copied into `$S/basetree` and run there (`$S/changed-tests-base.log`): `Test Files  19 failed | 13 passed (32)`, `Tests  54 failed | 356 passed (410)`; restored afterwards (`diff -r` equal). The tests changed after that run, on the unchanged copy with their new text: `config-folder.test.ts` and `boundaries.test.ts` (`$S/base-config-folder-boundaries.txt`) `Tests 7 failed | 33 passed`, of which 2 (`matches the hub's own files of a scratch hub to a schema each` and `reads a key of .oculus/config.yml outside the hub list`) also fail with the unchanged text on the copy (`Tests 2 failed | 38 passed`) and pass in the worktree; `references.test.ts`, `form-draft.test.ts`, `undo.test.ts` (`$S/base-late-tests.txt`): `Tests 1 failed | 109 passed`, the failure being the references row. After the change every one of them passes in the worktree (`$S/test-quick-4.log`).

## Files with line counts

All 158 files the step changes or adds, with `wc -l`:

- config/catalogs/vocab.yml 264
- config/defaults/layout.yml 335
- config/defaults/sources.yml 114
- config/options/layout.yml 283
- config/options/sources.yml 125
- config/schemas/manifest-schema.yml 93
- config/text/findings.yml 394
- config/text/server.yml 536
- config/text/views/boards/project.yml 143
- config/text/views/boards/projects.yml 85
- config/text/views/shared/roles.yml 8 (new)
- config/text/views/system/audit.yml 75
- config/text/views/system/workbench.yml 252
- docs/apps.md 822
- docs/data-map.md 228
- docs/diagrams/channels.dot 323
- docs/diagrams/channels.svg 1688
- docs/diagrams/layer-data.dot 94
- docs/diagrams/layer-data.svg 465
- docs/diagrams/layer-server.dot 159
- docs/diagrams/layer-server.svg 781
- docs/diagrams/layer-state.dot 173
- docs/diagrams/layer-state.svg 855
- docs/diagrams/layer-views.dot 189
- docs/diagrams/layer-views.svg 855
- docs/diagrams/layers.dot 101
- docs/diagrams/layers.svg 556
- docs/diagrams/writes.dot 1160
- docs/diagrams/writes.svg 3972
- docs/HELP.md 558
- docs/palette.md 202
- docs/templates.md 1360
- src/lib/data/helpers/hub-names.ts 474
- src/lib/data/index.ts 682
- src/lib/data/model/index.ts 842
- src/lib/data/model/model-entities.ts 736
- src/lib/data/shapes/boards/categories.ts 126 (new)
- src/lib/data/shapes/boards/roles.ts 208 (new)
- src/lib/data/shapes/boards/takes.ts 153 (new)
- src/lib/data/shapes/boards/words.ts 98 (new)
- src/lib/data/shapes/catalog-files/vocab.ts 422
- src/lib/data/shapes/catalog-words.ts 96
- src/lib/data/shapes/vocab-keys.ts 188
- src/lib/data/snapshot/hubs/merge.ts 363
- src/lib/data/snapshot/normalise-parts/links.ts 194
- src/lib/data/snapshot/normalise.ts 647
- src/lib/data/snapshot/references/scan.ts 336
- src/lib/data/snapshot/validate.ts 495
- src/lib/data/sources/config/catalog/options.ts 631
- src/lib/data/sources/config/catalog/schemas/options.ts 329
- src/lib/data/sources/config/catalog/schemas/references.ts 143
- src/lib/data/sources/config/sections/boards.ts 229
- src/lib/data/sources/config/sections/findings.ts 47
- src/lib/data/sources/config/settings/scan.ts 135
- src/lib/data/sources/deck/kinds.ts 352
- src/lib/data/sources/deck/spec.ts 191
- src/lib/data/sources/manifests.ts 480
- src/lib/server/content/audit/projects.ts 540
- src/lib/server/content/audit/rules.ts 359
- src/lib/server/content/audit/scan.ts 66
- src/lib/server/edit/writes/manifest.ts 733
- src/lib/server/root/watch/portfolio.ts 880
- src/lib/state/boards/board/facets.ts 174
- src/lib/state/boards/board/filter-menu.ts 130
- src/lib/state/boards/board/index.ts 55
- src/lib/state/boards/board/items.ts 231
- src/lib/state/boards/board/new-project.ts 50
- src/lib/state/boards/board/presets.ts 380
- src/lib/state/boards/board/state.ts 126
- src/lib/state/boards/board/team.ts 33
- src/lib/state/boards/collection.ts 873
- src/lib/state/boards/focus.ts 492
- src/lib/state/boards/person.ts 93
- src/lib/state/boards/structure/graph.ts 498
- src/lib/state/boards/structure/lines.ts 229
- src/lib/state/boards/ticker.ts 604
- src/lib/state/client/context.ts 878
- src/lib/state/client/selectors.svelte.ts 775
- src/lib/state/feeds/feeds.ts 136
- src/lib/state/forms/referrers.ts 138
- src/lib/state/forms/schema.ts 474
- src/lib/state/shared/stores/shapes.ts 517
- src/lib/state/sources/registries/venues.ts 178
- src/lib/state/workbench/layout.svelte.ts 867
- src/lib/state/workbench/layout/index.ts 148
- src/lib/state/workbench/layout/saved/load.ts 185
- src/lib/state/workbench/layout/saved/storage.ts 237
- src/lib/state/workbench/navigation/registry.ts 294
- src/lib/state/workbench/rail-badges/rail-badges.svelte.ts 392
- src/lib/state/workbench/rail-badges/rail-badges.ts 88
- src/lib/themes/derive.ts 320
- src/lib/views/boards/collection/Collection.svelte 503
- src/lib/views/boards/collection/NoFundingCard.svelte 70 (new)
- src/lib/views/boards/focus/Focus.svelte 273
- src/lib/views/boards/focus/lanes/Lanes.svelte 366
- src/lib/views/boards/person/Person.svelte 420
- src/lib/views/boards/projects/NewIdea.svelte 22
- src/lib/views/boards/projects/Projects.svelte 485
- src/lib/views/shared/card/project/CardLinks.svelte 184
- src/lib/views/shared/card/project/ProjectCard.svelte 500
- src/lib/views/shared/forms/entry/card/EntryCard.svelte 356
- src/lib/views/shared/forms/NewIdeaForm.svelte 192
- src/lib/views/shared/links/CrossLinks.svelte 171
- src/lib/views/structure/map/Controls.svelte 164
- src/lib/views/system/audit/Audit.svelte 352
- tests/checks/config/config-folder.test.ts 814
- tests/checks/config/templates.test.ts 84
- tests/checks/source/keys.test.ts 775
- tests/checks/tree/allow-styling.ts 99
- tests/checks/tree/boundaries.test.ts 859
- tests/data/hubs/hub-folders.test.ts 284
- tests/data/hubs/hub-portfolio.test.ts 538
- tests/data/hubs/workspace-projects.test.ts 162
- tests/data/snapshot/normalise.test.ts 333
- tests/data/snapshot/references.test.ts 614
- tests/data/snapshot/relation-shapes.test.ts 138
- tests/data/snapshot/resources.test.ts 100
- tests/data/snapshot/schema-rules.test.ts 363
- tests/data/snapshot/tier-stage.test.ts 61
- tests/data/sources/config/boards.test.ts 190
- tests/data/sources/manifests/clones.test.ts 241
- tests/data/sources/manifests/manifests.test.ts 772
- tests/data/sources/present.test.ts 301
- tests/data/sources/scan.test.ts 127
- tests/fixtures/entities-fixture.ts 80
- tests/fixtures/hubs/demo/projects/active/graph-bandits/project.yml 20
- tests/fixtures/hubs/demo/projects/active/graph-transfer/project.yml 26
- tests/fixtures/hubs/demo/projects/active/streaming-anomaly/project.yml 19
- tests/fixtures/hubs/demo/projects/archive/failed/failed-quantization/project.yml 12
- tests/fixtures/hubs/demo/projects/archive/published/early-benchmark/project.yml 16
- tests/fixtures/hubs/demo/projects/coauthor/spectral-clustering-collab/project.yml 20
- tests/fixtures/hubs/demo/projects/ideas/online-clustering/project.yml 14
- tests/fixtures/hubs/demo/projects/ideas/tensor-sketch/project.yml 17
- tests/fixtures/hubs/demo/projects/manuscripts/robust-embeddings/project.yml 26
- tests/fixtures/hubs/demo/projects/manuscripts/sparse-attention/project.yml 19
- tests/fixtures/hubs/demo/projects/software/bench-suite/project.yml 9
- tests/fixtures/hubs/demo/projects/software/tensorkit-tensor-decomposition-toolkit/project.yml 9
- tests/fixtures/hubs/demo/README.md 7
- tests/fixtures/state-server.ts 139
- tests/routes/docs/audit.test.ts 111
- tests/routes/edit/undo/undo.test.ts 872
- tests/routes/edit/write-fixture.ts 547
- tests/routes/edit/write.test.ts 156
- tests/routes/files/project-files.test.ts 66
- tests/routes/hubs/hub-routing.test.ts 198
- tests/routes/hubs/make.test.ts 620
- tests/server/core/changes.test.ts 573
- tests/server/edit/deck-edit.test.ts 143
- tests/server/edit/writes-fixture.ts 205
- tests/server/edit/writes.test.ts 845
- tests/server/git/deposit-compare.test.ts 267
- tests/server/git/deposit.test.ts 198
- tests/server/root/served-roots.test.ts 145
- tests/state/boards/board/board-rules.test.ts 561 (new)
- tests/state/boards/board/hub-facets.test.ts 52
- tests/state/boards/board/items.test.ts 36
- tests/state/forms/form-draft.test.ts 314
- tests/state/workbench/layout/saved/layout-workspaces.test.ts 350

## Judgment calls the brief left open

1. The reload fix carries the identity of the workspace the tab last loaded in the tab's session storage, key `oculus.layout.workspace` (`src/lib/state/workbench/layout/saved/storage.ts`: `TabMemory { read, write }`, `sessionMemory()`). `loadLayout` ends with `presumeCarried()` (`load.ts`): when the carried identity has a saved arrangement that parses, the store takes it at once and the first draw shows it. While the identity is presumed, nothing is written: a change made before the answer is saved with the next change after it. When the answer names the same workspace, `storage.select(identity)` confirms it and nothing is redrawn; when it names another, that workspace's arrangement replaces it and the presumed one is left unsaved. Session storage was chosen over local storage because two tabs on two workspaces each keep their own.
2. The roles module, the category function and the board-takes rule live in `src/lib/data/shapes/boards/` (`words.ts`, `categories.ts`, `roles.ts`, `takes.ts`), with views reaching them through `state/boards/board/index.ts`. The reason is under "Anything in the brief that was wrong".
3. The cross-link groups come in the order in-flight, done, ideas, the order the old groups `work`, `published`, `ideas` had.
4. The ideas group is headed "idea" when it holds one project and "ideas" for more, with the existing keys `xlink_idea` and `xlink_ideas`; the brief's case 25 says "ideas".
5. The no-board finding's mute signature is built from the raw tier, role and stage (`signed: [project.tier ?? '', role ?? '', project.stage ?? '']` in `src/lib/server/content/audit/projects.ts`, `Raised.signed` in `rules.ts`), so a muted finding stays muted when the catalog's words for "no tier" change.
6. `new_project_dir` stays keyed by tier, now a word of `tiers` (`config/options/sources.yml` `from: tiers`).
7. The demo fixture's manifests name leads, so its projects land on boards (`tests/fixtures/hubs/demo/`).
8. A collection entry is the user's when one of its people fields holds the key `self` names, compared by key.
9. A section heading takes the category's colour through `toneOf` of the row's colour, the colour of its first stage when the row names none.
10. The reference index follows a board's `stages`, `chips` and `forms` blocks, whose values take their list from the block's key (`src/lib/data/sources/config/catalog/schemas/references.ts` reads a nested family as a family; `src/lib/data/snapshot/references/scan.ts` `valueAt` picks the source by the pair's key), so renaming a stage, chip or form also renames it in a board. The editor's schema of the same blocks holds each list to its source (`pickedByKey` in `src/lib/data/sources/config/catalog/schemas/options.ts`): `boards.projects.stages.words[0] is nonsense, which is not one of nascent, ...` and `stages.flags[0] is submitted, which is not one of idea, on_map, ...` from a run of `checkDocument` on `defaults/layout.yml` (`$S/schema.cases.ts`).
11. The no-funding card of the Funding collection is its own component, `src/lib/views/boards/collection/NoFundingCard.svelte`, which keeps `Collection.svelte` under the component size limit.

## Host- and user-visible changes, before and after

- Six boards and their tabs (the Projects page pins a tab of each, Supervision second). Before: five, Projects, Coauthor, Archive, Personal, Software, each taking the projects whose `tier:` is its id. After: six, in the order Projects, Supervision, Coauthor, Archive, Personal, Software (`config/defaults/layout.yml` `boards:`; tab order 1 to 6 in `Projects.svelte`). Projects: `tier: research`, role lead, stages not `terminal`. Supervision: `tier: research`, role supervisor. Coauthor: `tier: research`, role collaborator or other. Archive: `tier: research`, role lead, stages `terminal`. Personal: `tier: personal`. Software: `tier: software`. A project is on every board whose keys it meets.
- The Personal board's categories against its three groups. Before: `building` (building), `released` (released), `idea` (nascent, scoping, de-risking, exploring). After: the shared `categories:` list: `in-review` (submitted), `in-flight` (every `live` stage, so building, de-risking and exploring now sit here), `idea` (nascent, scoping), `publications`, `other-outputs`, `released`, `dead-ends`, then "other" for a project in none.
- Sections. Before: a board drew its cards in one grid, its groups being the counts of its stats strip and the values of its category facet. After: a board draws one section per category holding a card, in the list's order, headed by the category's label, colour and count, "other" last; `cards: grid` gives the flat grid.
- The category facet. Before: values were a board's own group ids (`in-progress`, `papers`, `outputs`, ...). After: values are the keys of `categories:`; a saved value naming no row (such as `in-progress`) is dropped and the board shows unfiltered on that facet (case 32).
- The rail. Before: a board's rail count was its rollup of the first group (`in progress`, count 3, green, case 28). After: the count of projects in rows with `rail: true` (`in-flight`), in that row's colour, green `#16a34a` (2 for case 28).
- The Supervision board: new, glyph `teaching`, counted on its tab and the rail, columns as Coauthor's.
- Mine only: new toggle on every board and on every collection declaring `lead`, `supervisors` or `collaborators`, shown only when the workspace names `self`. On, it keeps what names `self` in one of the three fields and what names no one.
- The Lead badge: new, on a project card or a collection entry card whose `lead` holds `self`.
- The Role facet: new on boards and on collections declaring a role field, values Lead, Supervisor, Collaborator, Other; absent with no `self`.
- The card's team: before, lead and collaborators; after, lead, collaborators, then supervisors (`teamOf`), and the person view and referrers count supervisors.
- The Idea lane. Before: the Backlog lane took `nascent` projects of the tiers flagged `backlog` (projects, personal). After: the lane is named Idea (key `idea`) and takes a `nascent` project of any tier, so a software idea is on it (case 5).
- Chip lanes. Before: a chip such as `parked` put any project on its lane, a `stopped` one included (case 13 on Backburner). After: a project at a `terminal` stage is on no chip lane, and the audit raises "the stage `{0}` is done but the chip `{1}` puts it on a Focus lane: remove the chip".
- Cross-link groups. Before: `work`, `published`, `ideas`, released software under `work`, failed and stopped under none of them. After: in-flight, done (published and released), ideas, headings "in flight", "done", "idea"/"ideas"; a dead-end is left out.
- The Orphans card. Before: every project with no pillar. After: projects of a tier `research_audit.skip_tiers` does not list (so not personal) and in no `archival` category (case 4 and 6 leave it, case 7 stays).
- The Archival band. Before: the projects of a tier carrying `finished` (coauthor, archive) at a stage with a `dead` number, grouped by that number; `realProjects` was every other project. After: every project in an `archival: true` row (`dead-ends`), grouped by its stage's `dead` number; `realProjects` is every project in no such row (the venue counts read it).
- New findings: the audit's `msg_no_lead` ("names no lead: add `lead:` ..."), `msg_no_board` ("on no board: tier {0}, role {1}, stage {2}"), `msg_terminal_lane_chip`; the config check's `categories_block`, `categories_row`, `categories_colour` and the board block findings (a word or flag a block's list does not hold, a key no block takes); the New project write's `idea_role`; an unknown tier word is a manifest finding.
- Removed findings: `msg_stage_not_folder`, `msg_no_author_chip`, `msg_projects_published`; the `boards_record` text no longer names "its words".
- New project on every board: before, every board but Software offered it (a tier carrying `software` offered none) and a write of `tier: software` was refused. After: every board offers it, writing the board's first tier and, on a board with `role:`, `self` into the field of the board's first role that has one; Software writes `New project.` and no next line.
- The reload: before, the first draw showed the default arrangement until the workspace answer arrived; after, it shows the arrangement of the workspace the tab last loaded.
- The editor of `config/defaults/layout.yml` and a workspace file's `boards` settings: the values of a board's `stages`, `chips` and `forms` blocks are held to the list their key names, so a word the list does not hold is marked in the editor.

## Anything in the brief that was wrong or impossible

1. Decision 12 with Archive: "New project on a board with `role:` writes `self` into the field of the board's first role that has one, so the new project is on the board it was made on". Archive takes only `terminal` stages and a new project is written at `nascent`, so New project on Archive writes `lead: [self]`, `tier: research`, `stage: nascent` and the project lands on Projects. Making it land on Archive would mean writing a done stage for a new project. Evidence: Archive's row in `config/defaults/layout.yml` (`tier: research`, `role: lead`, `stages: { flags: [terminal] }`), so its New project sends `tier: research` with the field `lead`; that is the write of case 24's "no tier" row above, which prints `tier: research`, `stage: nascent`, `lead: [axel-faes]` and `"boards":["projects"]`.
2. The brief's "Code" line names `src/lib/state/boards/board/` for "the roles module". The audit and the New project write on the server read the same roles, categories and board rule, and `tests/checks/tree/boundaries.test.ts` forbids `server/` from importing `state/`. The modules are in `src/lib/data/shapes/boards/`, which both sides may import, with the allow-list row `'data/shapes/boards/**'` for the state layer.
3. The brief's paths say `docs/palette.md` is "regenerated by `npm run diagrams`". `npm run diagrams` leaves it unchanged; it is written by `npm run docs:palette` (`package.json` line 24, `utils/diagrams/palette.mjs`), which gained the Supervision row.
4. Case 25 heads a group of one `nascent` member "ideas"; the existing key `xlink_idea` heads a single idea "idea" (judgment call 4).

## Hub rewrite

What the hub needs for this step's code to read it without a finding, for the orchestrator's rewrite at landing:

1. Tiers in every manifest (`projects/**/project.yml`, `side-projects/*/project.yml`, each workspace repository's `.oculus/project.yml`): `tier: projects`, `tier: coauthor` and `tier: archive` become `tier: research`; `personal` and `software` stay. A manifest left with an old word reads as no tier, with the unknown-tier finding and the no-board finding.
2. Leads: every research project names `lead:`. A project Axel leads gets `lead: [axel-faes]` (on Projects, or Archive when its stage is terminal). A former coauthor project gets the first author as `lead:` and `axel-faes` in `collaborators:` (Coauthor). A student project Axel supervises gets the student as `lead:` and `supervisors: [axel-faes]` (Supervision). A manifest naming no lead raises `msg_no_lead` and is on no board with a `role:`. Known: FL4E becomes `tier: software`, `lead: [pirmani]`, `collaborators: [peeters, axel-faes]`; the workspace repositories' `.oculus/project.yml` get their lead.
3. Chips: `lead` and `coauthor` are no chips; every `status.chips` holding them drops them (an unknown chip is a finding).
4. A project at a terminal stage drops any Focus lane chip (`parked`, `blocked`, ...); known: FedBTD loses `parked`.
5. `self`: the workspace file or the hub's config names `self: axel-faes`; without it no board applies `role:`, so Projects shows every research project not at a terminal stage and Supervision and Coauthor every research project.
6. `new_project_dir` in `.oculus/config.yml`: the keys become words of `tiers` (`projects` to `research`; `coauthor` and `archive` removed; `software` added when the hub wants New project on Software to offer a folder).
7. The deck (`present.yml` of the hub and of each project deck): `find: { tiers: [...] }` words `projects`, `coauthor`, `archive` become `research` (or `personal`, `software` where meant).
8. `scan:` rows of the hub's sources settings that name `tier:` take a word of `tiers`.
9. Workspace files' `settings: boards:` overrides: `groups:` is no field a board takes and is removed; a board's `tier:` takes words of `tiers`; a board id `coauthor` or `archive` stays a view id.
10. Hub config overriding `tiers:` with flags (`main`, `backlog`, `finished`, `software`, `personal`, `outcome_folders`, `stage_folders`) or setting `lifecycle:` drops them; a tier row carries `label` only and `research_audit.skip_tiers` replaces the `personal` flag.
11. Collections: the `schema:` blocks of funding, events, education, applications and tasks gain `lead` (required, `type: tags, from: people`), `collaborators` and `supervisors` (`type: tags, from: people`), as `docs/templates.md` shows; each entry of a collection whose schema marks `lead` required names its lead.

## Verify 3: every hit of the brief's grep, quoted and judged

`grep -rnE "<the brief's pattern>" src config tests docs utils --exclude=local.yml`: 389 hits, `exit 0`. Each hit was read. They fall in seven groups, by the first word of the pattern the line holds; the judgment of each group follows its heading and holds for every line under it.

### A: 1 hits

`tier: projects`: the G32 row of case 10, a manifest naming a word `tiers` does not hold, whose finding the row expects. Stays.

```
tests/data/sources/manifests/manifests.test.ts:236:        hub: plain(['projects/ideas/u/project.yml', 'tier: projects\nstage: nascent\ntitle: U\n']),
```

### B: 3 hits

`Tier`: the manifest field `tier` keeps its label "Tier" (`config/schemas/manifest-schema.yml:35`), the audit section "Tier conformance" names that field, and "Tier-0" is the de-risk lane's subtitle. None is a tier word or a flag. Stay.

```
config/schemas/manifest-schema.yml:35:    tier:          { label: "Tier", type: select, from: vocab.tiers, required: true, section: Core, help: "The kind of project, one word of the tiers list: research, personal or soft
config/catalogs/vocab.yml:179:  - { key: derisk,     label: De-risk,    sub: "Tier-0 go / no-go pilot",            color: "#f59e0b", cluster: incubate, stages: [de-risking] }
config/text/views/system/audit.yml:18:        sec_conform: Tier conformance
```

### C: 21 hits

`'coauthor'` and `'archive'`: the view ids of the Coauthor and Archive boards (`Projects.svelte`, the G124 test) and the mail, inbox and session-list action `archive`. Stay.

```
src/lib/server/accounts/mail/routes.ts:164:    if (record.action === 'archive') {
src/lib/server/accounts/mail/microsoft.ts:309:            body: { destinationId: 'archive' }
src/lib/state/feeds/inbox.svelte.ts:118:        archive: (thread) => onThread(thread, { action: 'archive' })
src/lib/views/feeds/inbox/InboxCard.svelte:83:    let asking: 'send' | 'archive' | null = $state(null);
src/lib/views/feeds/inbox/InboxCard.svelte:195:                    onclick={() => (asking = 'archive')}
src/lib/views/feeds/inbox/InboxCard.svelte:268:{:else if asking === 'archive'}
src/lib/views/sessions/session-list/session-list.ts:54:            id: 'archive',
src/lib/views/sessions/session-list/SessionList.svelte:333:        else if (id === 'archive') void mark(row, 'hidden', !archived(row));
src/lib/views/boards/projects/Projects.svelte:24:        boardRegistration('coauthor', 3),
src/lib/views/boards/projects/Projects.svelte:25:        boardRegistration('archive', 4),
tests/state/boards/board/board-rules.test.ts:136:        { name: 'case 2, role other', id: 'c2', self: MINE, boards: ['coauthor'] },
tests/state/boards/board/board-rules.test.ts:137:        { name: 'case 3, a published thesis', id: 'c3', self: MINE, boards: ['archive'] },
tests/state/boards/board/board-rules.test.ts:138:        { name: 'case 4, stopped', id: 'c4', self: MINE, boards: ['archive'] },
tests/state/boards/board/board-rules.test.ts:147:        { name: 'case 13, stopped and parked', id: 'c13', self: MINE, boards: ['archive'] },
tests/state/boards/board/board-rules.test.ts:148:        { name: 'case 14, published, no form', id: 'c14', self: MINE, boards: ['archive'] },
tests/state/boards/board/board-rules.test.ts:153:            boards: ['projects', 'supervision', 'coauthor']
tests/state/boards/board/board-rules.test.ts:159:            boards: ['supervision', 'coauthor', 'archive']
tests/state/boards/board/board-rules.test.ts:165:            boards: ['projects', 'supervision', 'coauthor']
tests/state/boards/board/board-rules.test.ts:221:        { name: 'case 2 on Coauthor', board: 'coauthor', id: 'c2', category: 'in-review' },
tests/state/boards/board/board-rules.test.ts:237:        const items = boardItems(snapshotOf(ALL), presetFor('coauthor', CONFIG));
tests/state/boards/board/board-rules.test.ts:277:            board: 'archive',
```

### D: 96 hits

`'projects'`: the entity and registry source `projects`, the folder `projects/` in test paths, the view id and the view-catalogue group id `projects`, the `projects` key of `ticker_sources`, the Claude account's `projects` store folder and the Status view's count. None is a tier. Stay.

```
src/lib/server/sessions/folders.ts:56:        stores: distinctFolders(claude.map((account) => join(account.dir, 'projects'))),
src/lib/server/sessions/stores/hooks.ts:171:    const projects = entityMap(hub, 'projects');
src/lib/server/sessions/stores/hooks.ts:179:    const projects = entityMap(hub, 'projects');
src/lib/server/sessions/stores/hooks.ts:189:    const held = entityMap(hub, 'projects');
src/lib/server/sessions/stores/customizations.ts:333:    const projects = mapField(jsonFile(global, found), 'projects', global, found);
src/lib/server/machine/processes/watch.ts:36:type Held = Pick<ProcessesPayload, 'rows' | 'agents' | 'projects' | 'updated'>;
src/lib/server/machine/usage/transcripts.ts:137:                ? join(account.dir, 'projects')
src/lib/state/forms/schema.ts:283:    if (from === 'projects') return recordChoices(entities?.projects, ['short', 'title'], root);
src/lib/state/workbench/navigation/status.ts:597:    'projects' | 'venues' | 'datasets' | 'pillars' | 'domains' | 'funding' | 'collections';
src/lib/state/boards/ticker.ts:91:const PROJECTS = 'projects';
src/lib/data/snapshot/references/rename.ts:102:    if (sources.includes('projects')) return { code: 'project', key };
src/lib/data/snapshot/normalise.ts:128:    'projects',
src/lib/data/snapshot/normalise.ts:611:        projects: keys('projects', projects),
src/lib/data/snapshot/references/scan.ts:301:            if (isScalar(id) && scalar(id.value) === defines.id) define(walk, id, ['projects']);
src/lib/data/snapshot/schema/lists.ts:88:        if (basename(finding.file) === MANIFEST && finding.key === '') unread.add('projects');
src/lib/data/snapshot/hubs/references.ts:14:const RECORD_SOURCES: readonly string[] = [...REGISTRIES, 'projects'];
src/lib/data/snapshot/schema/static.ts:49:        if (source === 'projects' || REGISTRIES.includes(source as RegistryName)) return [];
src/lib/data/snapshot/hubs/merge.ts:49:    'projects',
src/lib/data/snapshot/hubs/merge.ts:142:        relatedIds: idsOf(one.relatedIds, at('projects', 'related')),
src/lib/data/snapshot/hubs/merge.ts:153:        waitingOn: one.waitingOn.map((key) => resolve(['people', 'projects'], key, waiting) ?? key)
src/lib/views/system/status/Status.svelte:77:                <li>{t('app.projects', count('projects'))}</li>
src/lib/views/boards/projects/Projects.svelte:13:        group: 'projects',
src/lib/views/boards/projects/Projects.svelte:22:        boardRegistration('projects', 1),
tests/server/core/changes.test.ts:65:    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
tests/server/core/changes.test.ts:131:            join(hub, 'projects', 'manuscripts', 'alpha', 'project.yml'),
tests/server/core/changes.test.ts:456:            file: join(into.hub, 'projects', 'ideas', 'fresh-idea', 'project.yml'),
tests/server/edit/writes.test.ts:789:        mkdirSync(join(root, 'projects', 'ideas', 'taken'), { recursive: true });
tests/server/edit/writes.test.ts:828:        const inner = join(root, 'projects', 'manuscripts', 'alpha', 'docs');
tests/server/edit/writes-fixture.ts:53:    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
tests/server/edit/writes-fixture.ts:61:    return readFileSync(join(root, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
tests/server/edit/writes-fixture.ts:78:    return join(root, 'projects', 'manuscripts', 'alpha', 'project.yml');
tests/server/edit/config-value.test.ts:177:                Object.entries(boards).filter(([key]) => key !== 'projects')
tests/server/sessions/usage-sessions.test.ts:55:            stores: [join(dir, 'projects')],
tests/server/sessions/usage-sessions.test.ts:93:            stores: [join(dir, 'projects')],
tests/server/machine/hpc/submit-world.ts:49:    const code = join(hub, 'projects', 'p', 'code');
tests/server/machine/hpc/submit-world.ts:61:                file: join(hub, 'projects', 'p', 'project.yml')
tests/server/machine/hpc/submit-world.ts:67:                file: join(hub, 'projects', 'q', 'project.yml')
tests/server/git/deposit-compare.test.ts:82:const codeOf = (): string => join(hub, 'projects', 'alpha', 'code');
tests/server/git/deposit-compare.test.ts:103:    write(hub, join('projects', 'alpha', 'project.yml'), manifest('alpha', bare));
tests/server/git/deposit-compare.test.ts:106:    write(hub, join('projects', 'beta', '.oculus', 'project.yml'), manifest('beta'));
tests/server/git/deposit-compare.test.ts:107:    write(hub, join('projects', 'beta', 'code', 'README.md'), '# beta\n');
tests/server/git/deposit-compare.test.ts:117:        scan: [{ dir: 'projects' }],
tests/server/git/deposit.test.ts:55:    return join(hub, 'projects', 'manuscripts', id, 'code');
tests/server/git/deposit.test.ts:117:        join('projects', 'manuscripts', 'alpha', 'project.yml'),
tests/server/git/deposit.test.ts:130:        join('projects', 'manuscripts', 'alpha', 'project.yml'),
tests/server/git/deposit.test.ts:133:    write(join(lab, 'projects', 'manuscripts', 'alpha', 'code'), 'README.md', '# alpha of lab\n');
tests/server/git/deposit.test.ts:173:            join(root, 'projects', 'manuscripts', 'alpha', 'project.yml');
tests/state/system/apps/page-commands.client.test.ts:34:        hasView: (id) => id === 'projects',
tests/state/system/apps/page-commands.client.test.ts:115:        ['opens a view', 'oculus.tab', ['projects'], 'view projects'],
tests/state/system/apps/methods.test.ts:199:            ['dir', 'hub', 'projects'],
tests/state/system/apps/methods.test.ts:200:            FS('.dir', 'projects')
tests/state/workbench/layout/layout-fixture.ts:25:export function instance(id: string, view = 'projects'): Instance {
tests/state/boards/board/items.test.ts:18:    { name: 'the tier research', tier: 'research', board: 'projects', folder: 'projects/ideas' },
tests/state/boards/board/board-rules.test.ts:135:        { name: 'case 1, a lead at revision', id: 'c1', self: MINE, boards: ['projects'] },
tests/state/boards/board/board-rules.test.ts:143:        { name: 'case 9, lead and supervisor', id: 'c9', self: MINE, boards: ['projects'] },
tests/state/boards/board/board-rules.test.ts:220:        { name: 'case 1 on Projects', board: 'projects', id: 'c1', category: 'in-flight' },
tests/state/boards/board/board-rules.test.ts:256:        const preset = presetFor('projects', CONFIG);
tests/state/boards/board/board-rules.test.ts:286:            board: 'projects',
tests/state/boards/board/board-rules.test.ts:450:        { name: 'another hub', over: { root: 'look-hub2' }, boards: ['projects', 'hubbed'] },
tests/state/boards/board/board-rules.test.ts:451:        { name: 'the primary hub', over: {}, boards: ['projects'] },
tests/state/boards/board/board-rules.test.ts:452:        { name: 'the domain ecg', over: { domainIds: ['ecg'] }, boards: ['projects', 'matched'] },
tests/state/boards/board/board-rules.test.ts:456:            boards: ['projects', 'blocked']
tests/state/boards/board/board-rules.test.ts:461:            boards: ['projects']
tests/state/boards/board/board-rules.test.ts:476:        expect(boardsTaking(one, takeContext(second, MINE)).at(0)).toBe('projects');
tests/state/boards/board/board-rules.test.ts:482:        const preset = presetFor('projects', CONFIG);
tests/state/client/terminal/terminal-close.test.ts:149:        const side = client.layout.openView('projects', undefined, page);
tests/data/hubs/hub-portfolio.test.ts:31:    'projects',
tests/data/hubs/hub-portfolio.test.ts:167:            const manifest = join(from.lab, 'projects', 'active', 'graph-bandits', 'project.yml');
tests/data/hubs/hub-portfolio.test.ts:292:            const folder = join(from.hub, 'projects', 'ideas', 'lab:x');
tests/data/hubs/hub-portfolio.test.ts:326:    const folder = join(hub, 'projects', 'ideas', id);
tests/data/hubs/hub-folders.test.ts:62:    const inside = folder(hub, 'projects', 'x', '.oculus');
tests/data/hubs/hub-folders.test.ts:64:    const insideTop = folder(hub, 'projects', 'y');
tests/data/hubs/hub-folders.test.ts:75:        inside: join(hub, 'projects', 'x'),
tests/data/snapshot/rename.test.ts:294:        refusal: { code: 'exists', key: 'beta', source: 'projects' }
tests/data/snapshot/rename.test.ts:307:        refusal: { code: 'sources', key: 'beta', sources: ['people', 'projects'] }
tests/data/snapshot/rename.test.ts:320:        refusal: { code: 'sources', key: 'beta', sources: ['people', 'projects'] }
tests/data/sources/manifests/manifests.test.ts:138:        scan: [{ dir: 'projects' }, { dir: 'side-projects', optional: true }],
tests/data/sources/manifests/manifests.test.ts:228:        scan: [{ dir: 'projects' }, { dir: 'projects/ideas' }],
tests/data/sources/manifests/manifests.test.ts:241:            expect(found[0]).toContain('projects');
tests/routes/edit/write-fixture.ts:75:    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
tests/routes/edit/write-fixture.ts:201:    return join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
tests/routes/hubs/hub-routing.test.ts:38:    const folder = join(dir, 'projects', 'manuscripts', 'beta');
tests/routes/hubs/hub-routing.test.ts:87:        expect(change.file).toBe(join(base.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'));
tests/routes/hubs/hub-routing.test.ts:148:    const path = join('projects', 'ideas', id, 'project.yml');
tests/routes/hubs/hub-routing.test.ts:149:    mkdirSync(join(hub, 'projects', 'ideas', id), { recursive: true });
tests/routes/edit/write.test.ts:85:                file: join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml')
tests/routes/edit/undo/undo.test.ts:338:            const hubFile = join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
tests/routes/files/project-files.test.ts:29:    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
tests/routes/files/open-fixture.ts:34:    const folder = join(hub, 'projects', 'active', 'alpha');
tests/routes/apps/app-fs.test.ts:91:    symlinkSync(join(base, 'outside.txt'), join(hub, 'projects', 'link.txt'));
tests/routes/apps/app-fs.test.ts:226:                ['projects', 2]
tests/routes/sessions/terminal-fixture.ts:91:    const chatProject = join(chatHub, 'projects', 'active', 'alpha');
tests/routes/hubs/hub-undo.test.ts:39:            join(research.hub, 'projects', 'manuscripts', 'alpha', 'project.yml')
tests/routes/hubs/hub-undo.test.ts:49:        const labFile = join(lab.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
tests/routes/hubs/hub-undo.test.ts:63:        mkdirSync(join(dir, 'projects', 'manuscripts', 'alpha'), { recursive: true });
tests/routes/hubs/hub-undo.test.ts:64:        const labFile = join(dir, 'projects', 'manuscripts', 'alpha', 'project.yml');
```

### E: 5 hits

`backlog`: the message backlog of a channel (`channels.ts`, the pty channel, the app frame bridge, the terminals page test). No Focus lane. Stay.

```
src/lib/server/core/channels.ts:10:// never a backlog.
src/lib/server/core/channels.ts:186:    backlog(channel: string): Promise<void> {
src/lib/server/machine/pty/channel.ts:829:        return this.#hub.backlog(ptyChannel(id));
src/lib/state/system/apps/frame/bridge.ts:16:// once and never a backlog. `destroy` ends the connection; a call that settles afterwards replies
tests/server/machine/apps/tools/terminals/terminals-page.test.ts:5:// page's output as one held message per channel and `backlog` settles when none is held, so the
```

### F: 101 hits

`finished` and `unfinished`: git operations, processes, jobs, sessions, debug sessions, explorer moves and prose; `config/catalogs/vocab.yml:122` is the collection status word `finished` of `statuses`, and the demo `bench-suite` eli5 is prose. No tier flag. Stay.

```
src/lib/ui/frame/Modal.svelte:84:    // is given back once the cleanup has finished (see giveBackQuietly).
src/lib/ui/frame/quiet-focus.ts:36: * goes, once the teardown that asks for it has finished, and only while that control is still on
src/lib/server/core/git/failure.ts:9:import type { CommandFailure, Unfinished } from './parse.ts';
src/lib/server/core/git/failure.ts:11:/** The word for the operation a command left unfinished, from the catalog. */
src/lib/server/core/git/failure.ts:12:function leftWord(left: Unfinished, catalog: Record<string, string>): string {
src/lib/server/core/git/failure.ts:18:/** The catalog's sentence for a failure's code, without what it left unfinished. */
src/lib/server/core/git/failure.ts:43: * after it the operation the run left unfinished, when there is one.
src/lib/server/core/git/state.ts:10:// finished within its time limit, since a state read from a git that ran out of time is a state
src/lib/server/core/git/state.ts:60:/** One root's state, and whether every git command of its read finished within its time limit. */
src/lib/server/core/git/state.ts:61:export type StateRead = { state: GitState; finished: boolean };
src/lib/server/core/git/state.ts:113: * Read-only git state for one root, and whether every git command of the read finished within its
src/lib/server/core/git/state.ts:131:    let finished = true;
src/lib/server/core/git/state.ts:133:        if (!done.answered) finished = false;
src/lib/server/core/git/state.ts:142:        return { state: found, finished };
src/lib/server/core/git/state.ts:144:        return { state: empty(short(error)), finished };
src/lib/server/core/git/run.ts:176: * One finished git process read into an outcome. The ends are: exit 0, ok with the bytes; a git
src/lib/server/core/git/parse.ts:779: * `gh`, which the route words from the catalog, and what the run left unfinished.
src/lib/server/core/git/parse.ts:785:    /** The operation the run left unfinished, once the repository has been read for it. */
src/lib/server/core/git/parse.ts:786:    left?: Unfinished;
src/lib/server/core/git/parse.ts:790:export type Unfinished = 'merge' | 'rebase' | 'cherry-pick';
src/lib/server/sessions/record.ts:10:// accumulator is pruned, so the cache entry stays small, and again when the record is finished.
src/lib/server/sessions/record.ts:366:        // turn of the whole transcript once the fold has finished.
src/lib/server/sessions/stores/background.ts:22:// an agent stopped before it finished, reads stopped; any other status reads error. Between a
src/lib/server/sessions/stores/background.ts:120: * Settle, on a finished record, every background subagent: one no completion notice ended is
src/lib/server/sessions/stores/background.ts:158: * On a finished Claude record, the agent id of every subagent whose own transcript is not there is
src/lib/server/machine/lsp/held/process.ts:203:    /** Whole stderr lines out of a chunk, the unfinished one kept for the next chunk. */
src/lib/server/machine/hpc/poll.ts:280:     * The finished jobs of the poll that just landed whose log path is not known yet, resolved so
src/lib/server/machine/hpc/prewarm.ts:1:// Layer 2, server. The log path of many finished jobs at once, resolved from listings so the first
src/lib/server/machine/hpc/prewarm.ts:155: * The stdout log path of the finished jobs named, as two connections rather than one search each:
src/lib/server/machine/hpc/prewarm.ts:160: * Only finished jobs belong here. A running or pending job still has a `scontrol` record whose
src/lib/server/machine/apps/host/output.ts:4:// until the line is finished, and `lines()` shows it as the last line meanwhile. The kilobyte limit
src/lib/server/machine/apps/host/output.ts:18:    /** The kept lines, the oldest first, with an unfinished line last. */
src/lib/server/machine/apps/host/output.ts:31:    /** Drop the oldest lines until the kept ones and an unfinished line of `reserved` bytes fit. */
src/lib/server/machine/apps/host/runner/streams.mjs:97:    /** Count what the host finished with and grant oculus more once half the window is owed. */
src/lib/server/machine/apps/host/runner/tools/terminals.mjs:130:        let finished = false;
src/lib/server/machine/apps/host/runner/tools/terminals.mjs:132:            if (finished) return;
src/lib/server/machine/apps/host/runner/tools/terminals.mjs:133:            finished = true;
src/lib/server/machine/runs/recover/local.ts:123:function finished(place: LocalPlace, deps: LocalDeps): void {
src/lib/server/machine/runs/recover/local.ts:328:        .finally(() => finished(place, deps));
src/lib/server/machine/runs/recover/local.ts:364:            finished(place, deps);
src/lib/server/machine/runs/recover/local.ts:396:            finished(place, deps);
src/lib/server/machine/runs/recover/local.ts:402:                finished(place, deps);
src/lib/server/machine/debug/session/types.ts:90:    /** The unfinished last line of each output kind. */
src/lib/server/machine/debug/session.ts:506:    /** Add a chunk of text to the console as whole lines; the unfinished last one is kept. */
src/lib/server/machine/debug/app/ends.ts:49:    return { text: words(catalog, 'server.debug.finished'), kind: 'console' };
src/lib/server/root/watch/git.ts:392:        if (read.state.error !== null || !read.finished) return;
src/lib/server/root/watch/git.ts:432:        if (!read.finished) {
src/lib/server/files/search/search.ts:89:    /** Whether the child was killed before it finished, by the fold or by the read bound. */
src/lib/server/git/git-index.ts:23:import { NO_TIME_LIMIT, REFS_FORMAT, parseBranches, type Unfinished } from '../core/git/parse.ts';
src/lib/server/git/git-index.ts:350: * says so, with the operation it left unfinished named by `leftInProgress`. Otherwise it is the
src/lib/server/git/git-index.ts:378: * unfinished named in `failure.left`, so the answer says it is in progress and the view draws its
src/lib/server/git/git-index.ts:394:async function inProgress(root: string): Promise<Unfinished | ''> {
src/lib/state/feeds/inbox.ts:98: * How many threads the view's badge counts: the ones nobody has finished with that ask for an
src/lib/state/sessions/source/source.svelte.ts:432:     * Read once per instance per page lifetime, sharing an unfinished read across tab switches. A
src/lib/state/sessions/terminal/commands.svelte.ts:98:/** The most diagnostics kept for one terminal, and the longest unfinished line kept for one. */
src/lib/state/sessions/terminal/commands.svelte.ts:285: * What one task terminal's output gave so far: the diagnostics, the unfinished last line, and how
src/lib/state/workbench/navigation/notice-sources.ts:62: * `idle_prompt`, sent when it has finished its turn and waits for the reader's input; null for
src/lib/state/workbench/navigation/notice-sources.ts:109: * Whether an ended job finished: Slurm's COMPLETED with a zero exit code, or no code given. Any
src/lib/state/workbench/navigation/notice-sources.ts:261:            const finished = jobFinished(job);
src/lib/state/workbench/navigation/notice-sources.ts:263:                finished
src/lib/state/workbench/navigation/notice-sources.ts:264:                    ? t('statusbar.notice_job_finished', job.name, job.id)
src/lib/state/workbench/navigation/notice-sources.ts:266:                { tone: finished ? 'info' : 'error', actions: action(() => open.openView('hpc')) }
src/lib/state/boards/structure/layout.ts:52:     * ran first, which is what a pane closed or remounted before the load finished calls.
src/lib/state/sources/explorer/ops.svelte.ts:576:        const finishedMoves: Move[] = [];
src/lib/state/sources/explorer/ops.svelte.ts:591:            const finished = doneOf(
src/lib/state/sources/explorer/ops.svelte.ts:595:            done.push(...finished);
src/lib/state/sources/explorer/ops.svelte.ts:597:            const finishedItems = sent.filter((one) => finished.includes(one.path));
src/lib/state/sources/explorer/ops.svelte.ts:598:            const gone = mode === 'move' ? finishedItems : [];
src/lib/state/sources/explorer/ops.svelte.ts:599:            finishedMoves.push(...gone.map((one) => movedTo(one, into)));
src/lib/state/sources/explorer/ops.svelte.ts:615:            waiting = sent.filter((one) => !finished.includes(one.path));
src/lib/state/sources/explorer/ops.svelte.ts:617:        await notesLanded(ahead, finishedMoves);
src/lib/state/sources/explorer/ops.svelte.ts:618:        if (finishedMoves.length > 0) moved(finishedMoves);
src/lib/data/model/model-sessions.ts:40:     * `running`, `done`, `stopped` (a background subagent killed before it finished) or `error`.
src/lib/data/model/index.ts:425: * every folder, and the ISO time the count finished.
src/lib/views/sessions/session-detail/AgentRows.svelte:12:    // A finished agent reports what it took, from its start to its end, and nothing when its end is
src/lib/views/sessions/session-detail/AgentRows.svelte:40:    /** The hue of the status dot: at work, failed, stopped before it finished, or come back. */
src/lib/views/sessions/terminal/grid/kept-viewport.ts:59: * finished, `settled` after every fit and every other write, `keep` when the grid goes, and `stop`
src/lib/views/sources/repositories/merge/Merge.svelte:129:        if (await repositories.resolve(root, path, result)) reads.finished();
src/lib/views/sources/repositories/merge/Merge.svelte:134:        if (await repositories.acceptDeletion(root, path)) reads.finished();
src/lib/views/sources/repositories/merge/merge-reads.svelte.ts:82:    finished(): void {
src/lib/views/sources/repositories/repo/Repo.svelte:7:    // progress with Abort and, for a rebase, Continue (a cherry pick is finished by committing, so
config/options/behavior.yml:160:        help: How many days back the Live HPC poll asks the scheduler's accounting for finished jobs, and for the job working directories of the log prewarm.
config/options/behavior.yml:182:        help: Whether the poller resolves the log paths of finished jobs behind the page, so that opening a log is quick. false defers that resolution.
config/options/behavior.yml:739:    slurm: The Live HPC poller, the cluster it queries, how often it reads the job queue and the disk quota, how far back it reads finished jobs and whether it resolves their logs ahead of
config/defaults/behavior.yml:80:# Live HPC polling cadences are minutes. `prewarm: false` defers finished-job log resolution.
config/catalogs/vocab.yml:122:  finished:      { color: "#0ea5e9", closes_deadline: true }
config/text/views/system/machine/hpc.yml:82:        recent_summary: Recent (finished) - {0}
config/text/statusbar.yml:174:        lint_tip_stopped: '{0} was stopped before it finished. Select to run the linters again.'
config/text/statusbar.yml:241:        notice_idle: '{0} finished its turn and is waiting for your input.'
config/text/statusbar.yml:242:        notice_job_finished: 'Job {0} ({1}) finished.'
config/text/server.yml:167:            finished: The debug session ended
config/text/views/sessions/timeline.yml:11:        ev_turn: finished in {0} s
tests/server/core/git-failure.test.ts:4:// the catalog's words, with the program first and the operation a run left unfinished after it. One
tests/server/sessions/transcript-routes.test.ts:106:    writeFileSync(join(subagents, 'agent-adone1.jsonl'), `${said('the finished agent', 0)}\n`);
tests/server/sessions/transcript-routes.test.ts:197:        { name: 'a finished agent', agent: 'toolu_done', status: 200, turn: 'the finished agent' },
tests/server/sessions/transcripts.test.ts:48:/** Six records whose text holds a 3-byte and a 4-byte character, then an unfinished line. */
tests/server/sessions/transcripts.test.ts:81:    it('starts the next read where the last stopped, and takes a line finished since', () => {
tests/state/sessions/source/source-server.ts:99:    /** The requests whose answer the store has not finished taking in. */
tests/fixtures/hubs/demo/projects/software/bench-suite/project.yml:5:eli5: "Reproducible benchmark harness (finished, archived after the paper shipped)"
tests/views/sources/repositories/merge/merge-reads.client.test.ts:105:        before: (reads) => reads.finished(),
docs/apps.md:590:            found.push(new oculus.Diagnostic(range, 'Unfinished', oculus.DiagnosticSeverity.Warning));
```

### G: 162 hits

`groups:`: TypeScript fields and variables named `groups` (menus, settings, processes, repositories, regular-expression groups, deck groups, cross-link groups, the Archival band's groups), the options files' and the manifest schema's top-level `groups:` of help lines, `nav_groups:`, and a deck's `groups:` in `present.yml` and its docs. None is a board's `groups:`. Stay.

```
src/lib/ui/forms/choice/choices.ts:62:    groups: { name: string; choices: T[] }[];
src/lib/ui/forms/choice/choices.ts:65:    const groups: { name: string; choices: T[] }[] = [];
src/lib/ui/controls/editor/kit/languages/snippets.ts:14:    groups: readonly AppEditorSnippets[]
src/lib/ui/display/ThumbGrid.svelte:30:        groups: ThumbGroup[];
src/lib/ui/menu/MenuList.svelte:271:    /* The line between two groups: one pixel of the border colour, clear of the choices above and
src/lib/ui/menu/menu-items.ts:79:export function grouped(groups: readonly (readonly MenuItem[])[]): MenuItem[] {
src/lib/shell/panes/pane-view.ts:386: * The strip's menu, in VS Code's groups: Open File... (the palette, as Cmd+K opens it), New Text
src/lib/shell/panes/strip/tab-menu.ts:95: * The menu of one tab, in VS Code's groups: the closes; the path copies; Reveal in Finder (Open
src/lib/shell/panes/strip/open-view.svelte.ts:4:// submenu per rail page in the rail's order, then the `nav_groups:` groups, then the views no group
src/lib/server/edit/deck-edit.ts:5:// is found under its map, `groups:` then the group, and replaced, or appended to the end of the
src/lib/server/edit/deck-edit.ts:45: * other key of the document, of `groups:` and of the group must be as it was.
src/lib/server/edit/writes/bodies.ts:146:    groups: { group: string; base: string[]; slides: string[] }[];
src/lib/server/edit/writes/bodies.ts:401:        groups: z.array(z.object({ group: wordShape, base: keysShape, slides: keysShape })),
src/lib/server/edit/writes/config/lists/deck/deck.ts:134:        groups: GroupList[];
src/lib/server/sessions/stores/customizations.ts:230:/** The event's groups: null for a group that is no map or holds no `hooks` list. */
src/lib/server/machine/apps/tools/scm.ts:52:    groups: z
src/lib/server/machine/apps/tools/scm.ts:171:                groups: []
src/lib/server/machine/apps/tools/scm.ts:202:                groups: state.groups.map((group) => ({
src/lib/server/machine/apps/host/runner/tools/scm.mjs:77:            groups: [...groups.values()].map((group) => ({
src/lib/state/life/present.ts:447:        groups: z.array(z.object({ name: z.string() })),
src/lib/state/shared/stores/shapes.ts:374:        groups: { group: string; base: string[]; slides: string[] }[],
src/lib/state/life/slides.ts:10:// A deck moves within its group and across groups: the work keeps each list the reader touched,
src/lib/state/life/slides.ts:73:export function listsSignature(groups: DeckGroup[], order: DeckOrderEntry[]): string {
src/lib/state/life/slides.ts:199:    groups: DeckGroup[],
src/lib/state/system/config/search.ts:1:// Layer 2, client state. The Settings view's search over its groups: the query split on white
src/lib/state/system/config/search.ts:70:export type Found = { count: number; groups: Group[] };
src/lib/state/system/config/search.ts:73:export function searchGroups(groups: Group[], query: string, keep: readonly string[] = []): Found {
src/lib/state/system/config/search.ts:91:    return { count, groups: kept };
src/lib/state/system/config/editors/fields.ts:247:    groups: Map<string, string>;
src/lib/state/system/config/editors/fields.ts:274:        groups: new Map()
src/lib/state/system/config/groups.ts:307:    const groups: Group[] = [];
src/lib/state/system/config/groups.ts:392:export function tocOf(groups: Group[]): TocEntry[] {
src/lib/state/system/config/editors/sources.ts:83:    groups: (source: Source) => ReadonlyMap<string, string>;
src/lib/state/system/config/editors/sources.ts:160:    const groups: Partial<Record<Source, ReadonlyMap<string, string>>> = {
src/lib/state/system/config/editors/sources.ts:207:        groups: (source) => groups[source] ?? none,
src/lib/state/system/machine/processes/processes.ts:62:export type Arranged = { groups: ProcessGroup[]; matched: ProcessRow[] };
src/lib/state/system/machine/processes/processes.ts:96:    const groups: ProcessGroup[] = [];
src/lib/state/system/apps/shell/contributions.ts:69:/** The order VS Code gives groups: `navigation` first, the others by name. */
src/lib/state/sessions/folds.ts:185:    const groups: ListGroup[] = [];
src/lib/state/workbench/navigation/catalogue.ts:185:    groups: NavGroup[],
src/lib/state/workbench/navigation/catalogue.ts:221:    groups: NavGroup[],
src/lib/state/boards/ticker.ts:571:    const groups: TaskGroups = { followups: [], subtasks: [], tasks: [] };
src/lib/state/boards/ticker.ts:581:export function hasTasks(groups: TaskGroups): boolean {
src/lib/state/boards/ticker.ts:599:    groups: CommandGroups,
src/lib/state/boards/board/filter-menu.ts:93:    groups: Facet[],
src/lib/state/boards/structure/lines.ts:227:export function archivedCount(groups: ArchiveGroup[]): number {
src/lib/state/sources/explorer/sections/open-editors.ts:76:/** The ids of every dirty tab in the groups: what Save All saves. */
src/lib/state/sources/explorer/sections/open-editors.ts:77:export function dirtyIds(groups: OpenGroup[]): string[] {
src/lib/state/sources/explorer/sections/open-editors.ts:82:export function openIds(groups: OpenGroup[]): string[] {
src/lib/state/sources/explorer/notes/note-tree.ts:124:    groups: readonly NoteGroup[],
src/lib/state/sources/repositories/repositories.ts:511:    const groups: {
src/lib/state/sources/repositories/repositories.ts:560:export function shownFor(groups: readonly RepositoryGroup[], root: string): string | null {
src/lib/state/sources/repositories/repositories.ts:573:    groups: readonly RepositoryGroup[]
src/lib/state/sources/repositories/repositories.ts:592:    groups: readonly RepositoryGroup[],
src/lib/state/sources/search/search.ts:111:    groups: mapOfShape(z.string()).optional().catch(undefined)
src/lib/state/client/writes.svelte.ts:531:        groups: { group: string; base: string[]; slides: string[] }[],
src/lib/data/snapshot/schema/manifest.ts:6:// such map is described by its help line in the file's top-level `groups:`.
src/lib/data/snapshot/schema/manifest.ts:71:function groupLines(groups: unknown): Record<string, string> {
src/lib/data/snapshot/schema/manifest.ts:129: * the manifest schema file's `groups:`.
src/lib/data/snapshot/schema/manifest.ts:139:export function manifestGroupProblems(schema: unknown, groups: unknown): SchemaProblem[] {
src/lib/data/snapshot/schema/static.ts:42: * file a map of dotted fields with no help line in `groups:` or a line for no such map. Which keys
src/lib/data/shapes/catalog-files/options.ts:110:    groups: z
src/lib/data/shapes/catalog-files/manifest.ts:62:    groups: z
src/lib/data/model/model-deck.ts:249:    groups: DeckGroup[];
src/lib/data/model/apps/model-apps-tools.ts:279:    groups: AppScmGroup[];
src/lib/data/sources/config/merge/options-folder.ts:3:// and `groups:`, the help line of each group of its dotted options. The folder is read on its own,
src/lib/data/sources/config/merge/options-folder.ts:5:// name to its entries, and `option_groups`, which maps it to what its `groups:` holds. Each entry
src/lib/data/sources/config/merge/options-folder.ts:83:    const groups: Record<string, unknown> = {};
src/lib/data/sources/config/catalog/schemas/engine.ts:14:// A group of dotted options is described by its help line in the options file's `groups:`.
src/lib/data/sources/config/catalog/schemas/engine.ts:118:/** The help lines of the groups on the way to a dotted key, from its file's `groups:`. */
src/lib/data/sources/config/catalog/schemas/engine.ts:134:function hubConfigSchema(catalog: Catalog, groups: Groups, lists: OptionLists): JsonSchema {
src/lib/data/sources/config/catalog/schemas/engine.ts:159:function workspaceSchema(catalog: Catalog, groups: Groups, lists: OptionLists): JsonSchema | null {
src/lib/data/sources/config/catalog/option-findings.ts:7:// the records, and in `groups:` a group with no help line, a line for no group, and a `groups:`
src/lib/data/sources/deck/read.ts:544:            groups: [],
src/lib/data/sources/deck/read.ts:585:            groups: groupsOfDeck(doc),
src/lib/data/sources/deck/groups.ts:121:    groups: GroupSpec[],
src/lib/data/sources/deck/groups.ts:158:    const lost = new Map<string, { doc: Doc; groups: string[] }>();
src/lib/data/sources/deck/groups.ts:161:            const held = lost.get(one.dir) ?? { doc: one, groups: [] };
src/lib/data/sources/config/catalog/options.ts:181:/** Whether a problem is about a line of the file's `groups:` rather than an entry. */
src/lib/data/sources/config/catalog/options.ts:357:export type ReadCatalog = { catalog: Catalog; groups: Groups; problems: OptionProblem[] };
src/lib/data/sources/config/catalog/options.ts:372: * and a `groups:` that is no map are problems; a line that is no text counts as no line, and with
src/lib/data/sources/config/catalog/options.ts:373: * no `groups:` at all every group is a problem of its own.
src/lib/data/sources/config/catalog/options.ts:406:    const groups: Groups = {};
src/lib/data/sources/config/catalog/schemas/options.ts:4:// the file's `groups:`, and a family describes the records of a list or the values of a map once.
src/lib/data/sources/config/catalog/schemas/options.ts:285:    groups: Record<string, string> = {}
src/lib/data/sources/deck/spec.ts:74:    groups: GroupSpec[];
src/lib/data/sources/deck/spec.ts:119:    const groups: GroupSpec[] = [];
src/lib/data/sources/deck/spec.ts:188:        groups: groupsOf(value.groups, raise),
src/lib/data/helpers/search/replace.ts:126:function keysOf(groups: PatternGroups): string[] {
src/lib/data/helpers/search/replace.ts:151:    const groups: MatchGroups = Object.create(null) as MatchGroups;
src/lib/data/helpers/search/replace.ts:292:function groupAt(groups: MatchGroups, key: string): string | undefined {
src/lib/data/helpers/search/replace.ts:301:function caseOperated(text: string, groups: MatchGroups): string {
src/lib/data/helpers/search/replace.ts:320:function groupCount(groups: MatchGroups): number {
src/lib/data/helpers/search/replace.ts:334:function substituted(text: string, groups: MatchGroups): string {
src/lib/data/helpers/search/replace.ts:387:export function replacementOf(text: string, groups: MatchGroups, options: ReplaceOptions): string {
src/lib/data/helpers/keys/oculus/rail-letters.ts:17:    const groups: unknown[] = isMap(raw) ? Object.values(raw) : [];
src/lib/views/shared/explorer/tree/control/making.svelte.ts:17:// The hub dialog has two groups: the hub files (`config.yml`, always written and drawn with no box;
src/lib/views/shared/explorer/tree/control/making.svelte.ts:89:    groups: MakeGroup[];
src/lib/views/shared/explorer/tree/control/making.svelte.ts:178:        const groups: MakeGroup[] =
src/lib/views/shared/links/CrossLinks.svelte:25:        { projects: Project[]; groups?: never } | { projects?: never; groups: CrossGroup[] };
src/lib/views/academic/latex/Symbols.svelte:25:        groups: SymbolGroup[];
src/lib/views/system/workbench/settings/List.svelte:37:        groups: Group[];
src/lib/views/boards/focus/CommandCenterView.svelte:127:{#snippet kindGroups(label: string, glyph: string, groups: RowGroup[])}
src/lib/views/sources/source/status/app-actions.ts:54:    const groups: string[] = [];
src/lib/views/structure/pillars/ArchivalCard.svelte:25:    type Props = { id: string; cursor: boolean; groups: ArchiveGroup[] };
config/options/present.yml:19:groups:
config/options/appearance.yml:6:# Shape, the same in every file of this folder. `options:` maps a dotted key path of the defaults file of the same name to an entry, and `groups:` maps each group of dotted options (a prop
config/options/appearance.yml:18:        help: "The UI themes, in the order the Settings view's choice of the theme and :theme in Cmd-K list them. Both lists draw the rows under their groups: the rows with no group first
config/options/appearance.yml:207:groups:
config/defaults/layout.yml:26:nav_groups:
config/options/behavior.yml:735:groups:
config/options/sources.yml:3:# Every option of defaults/sources.yml described once, in the shape the head of options/appearance.yml describes. sources.yml has no dotted options, so `groups:` is empty. loadConfig() reads 
config/options/sources.yml:125:groups: {}
config/schemas/manifest-schema.yml:89:groups:
config/options/layout.yml:3:# Every option of defaults/layout.yml described once, in the shape the head of options/appearance.yml describes. layout.yml has no dotted options, so `groups:` is empty. loadConfig() reads it 
config/options/layout.yml:30:    nav_groups:
config/options/layout.yml:283:groups: {}
config/text/findings.yml:203:            groups: 'groups is not a map of group paths to help lines; no group of the file is described'
config/text/findings.yml:204:            group_missing: 'the group {0} has no help line in groups:; the editor shows no description for it'
config/text/findings.yml:258:            group_missing: 'the map {0}, which dotted fields lie in, has no help line in groups:; the editor shows no description for it'
config/text/views/academic/slides.yml:12:        empty: 'The deck in {0} defines no group, so there is no list to edit. Add a groups: block to its present.yml.'
tests/shell/keys/theme-rows.test.ts:50:        groups: split.groups.map((group) => ({
tests/shell/keys/theme-rows.test.ts:80:            groups: [{ name: 'VS Code, dark', rows: ['vscode-monokai', 'vscode-monokai-dimmed'] }]
tests/shell/keys/theme-rows.test.ts:105:            groups: [{ name: 'Mine', rows: ['plain-dark'] }]
tests/shell/keys/theme-rows.test.ts:126:            groups: [{ name: 'Rice Pack', rows: ['app:rice-pack/paper'] }]
tests/checks/config/config-folder.test.ts:238:     * `options:` and `groups:`, which the merge reads into its own two keys.
tests/checks/config/config-folder.test.ts:532:        const groups: NavGroup[] = readGroups(config);
tests/server/core/changes.test.ts:429:            groups: [{ group: 'pillars', base: ['alpha'], slides: ['beta', 'alpha'] }],
tests/server/edit/deck-edit.test.ts:16:groups:
tests/server/edit/deck-edit.test.ts:37:    const groups = (parse(source) as { groups: Record<string, { slides?: unknown }> }).groups;
tests/server/edit/deck-edit.test.ts:43:        const flow = 'groups:\n    g:\n        slides: [a, b]\norder:\n    - { slides: g }\n';
tests/server/edit/deck-edit.test.ts:112:                groups: Record<string, Record<string, unknown>>;
tests/server/edit/deck-edit.test.ts:122:                source: 'groups: [unclosed\n',
tests/server/edit/deck-edit.test.ts:128:                source: 'groups:\n  g: not a map\n',
tests/server/edit/deck-edit.test.ts:134:                source: 'groups: { g: { slides: [a] } }\n',
tests/state/system/settings/theme-groups.test.ts:93:        groups: split.groups.map((group) => ({
tests/state/system/settings/theme-groups.test.ts:140:            groups: [{ name: 'VS Code, dark', ids: ['a'], labels: ['A'] }]
tests/state/system/apps-tools/scm.client.test.ts:60:        groups: [],
tests/fixtures/hubs/demo/deck/present.yml:5:groups:
tests/data/sources/present.test.ts:143:                'groups:',
tests/data/snapshot/reference-hub.ts:187:        'groups:',
tests/data/snapshot/references.test.ts:426:                'deck:\n  title: Portfolio\ngroups:\n  main:\n    slides: [alpha]\n'
tests/data/snapshot/references.test.ts:495:            { 'deck/present.yml': 'groups:\n  main:\n    slides: [alpha]\n' },
tests/data/sources/config/catalog/options.test.ts:1:// Layer 1, data tests. The options reader, over entries of every wrong type and over the `groups:`
tests/data/sources/config/catalog/options.test.ts:3:// line or an empty one, a line for no group, and a `groups:` that is no map, each one finding that
tests/data/sources/config/catalog/options.test.ts:109:        const entry = (lines: string) => `options:\n    probe:\n${lines}groups: {}\n`;
tests/data/sources/config/catalog/options.test.ts:133:    /** An options file's text as shipped, its part before `groups:`, and its group lines. */
tests/data/sources/config/catalog/options.test.ts:136:        const [head] = text.split(/^groups:/m);
tests/data/sources/config/catalog/options.test.ts:137:        const groups = (parse(text) as { groups: Record<string, unknown> }).groups;
tests/data/sources/config/catalog/options.test.ts:141:    /** The file's text with `groups:` replaced, or left out when `groups` is undefined. */
tests/data/sources/config/catalog/options.test.ts:142:    function withGroups(name: string, groups: unknown): string {
tests/data/sources/config/catalog/options.test.ts:148:        'the group {0} has no help line in groups:; the editor shows no description for it';
tests/data/sources/config/catalog/options.test.ts:224:    it('words a groups: that is no map once and describes no group of the file', () => {
tests/data/sources/config/catalog/options.test.ts:228:            'groups: groups is not a map of group paths to help lines; no group of the file is described'
tests/data/sources/config/catalog/options.test.ts:235:    it('words every group of a file with no groups: and describes none of them', () => {
tests/routes/edit/write-fixture.ts:238:groups:
tests/routes/hubs/hub-writes.test.ts:784:    const send = (groups: unknown, over: Record<string, unknown> = {}): unknown => ({
tests/routes/edit/deck-slides.test.ts:5:// The hub is a temporary directory (deckTarget) whose portfolio deck holds three groups: `pillars`
tests/routes/edit/deck-slides.test.ts:32:    groups: Lists,
tests/routes/edit/deck-slides.test.ts:65:    const groups = (parse(text) as { groups: Record<string, { slides: string[] }> }).groups;
tests/routes/edit/undo/undo.test.ts:659:            groups: [group('pillars', ['alpha'], ['beta', 'alpha'])],
docs/templates.md:1352:# groups:
```
