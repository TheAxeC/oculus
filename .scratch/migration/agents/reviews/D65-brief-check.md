# Step D65 brief check (on main at 55c1c5c6bee107c9e55c0135ccd099023e69d4c5)

This is the report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D65.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

Commit read with `git rev-parse HEAD`. The brief was read from disk (it is uncommitted). plan.md has no "Goal" section (`grep -n '^## ' plan.md` prints Packages, Could run in parallel, Rulings, Agents, Blocked). The plan's opening paragraph ("Execution ledger for `tools/oculus/DESIGN.md`") is the nearest thing to a goal. For check 5, "the goal" is therefore the part rulings 47 to 51 give D65: one kind of project, with one record, one reader, one writer and one board component, the manifest's own `tier` and `type` deciding placement, and no migration code.

## 1. Names

Each name was grepped with `git grep -n -F <name> -- ':!tools/oculus/config/local.yml' ':!secrets' ':!tools/oculus/.scratch' ':!tools/cockpit'` (hits under `.scratch` are ledger history, and the change does not make them false), plus the named greps quoted below.

- `side_project_status`, `side_project_schema`, `SideProject`, `RawPersonal`, `readPersonal`, `projectOfSide`, `SIDE_PROJECT_TIER`, `sideLive`, `SideResearchKeys`, `PersonalSource`, `hubPersonal`, `rootPersonal`, `readPersonalFile`, `repositoryRule`, `typeWritten`, `IDEA_DIR`, `createIdea`, `side-lines`, `isRepositorySide`, `SideTarget`, `sideProjects`: every hit is inside the write list (including `tools/oculus/DESIGN.md`, `HELP.md`, `docs/DATA-MAP.md` and `docs/apps.md:125` under item 16, and `docs/diagrams/writes.{dot,svg}` under `npm run diagrams`). One exception: `side_project_schema` and `side-project-schema` also hit `tools/oculus/src/lib/data/sources/config/catalog/schemas/engine.ts:18,103-105,109` (`sideProjectSchemaFileShape`, the registration of `schemas/side-project-schema.yml`). The write list names `src/lib/data/` but its parenthetical does not name `sources/config/`. Deleting the schema file makes this registration false.
- `isSideTier`: `tools/oculus/src/lib/server/content/docs.ts:252-256` (`for (const rule of into.config.scan) { if (isSideTier(rule)) continue; ... rule.nested === true ...`). This file is outside the write list (only `content/audit/projects.ts` and `content/latex/endpoint.ts` are named). Item 1 removes both `isSideTier` and `nested`, so this code breaks.
- `SIDE_TIER`: `tests/checks/config/integrity.test.ts` (under `tests/`, one of the four real-hub tests).
- `ScanRule` readers (`grep -rn 'readManifests\|readHubManifests\|ScanRule\|hubManifests\b\|rule\.type\|rule\.tier\|\.nested\b' src`):
  - `tools/oculus/src/lib/server/files/roots.ts:91,110,121-123`: `repositoriesOf` carries `tier` (`...(root.tier === undefined ? {} : { tier: root.tier })`) and `hubManifests` calls `readHubManifests`. This file is outside the write list (only `files.ts` and `project-files.ts` are named). Item 4 removes `tier` from `RepositoryRoot`, so roots.ts:110 and its doc comment at :88-91 become false.
  - `tools/oculus/src/lib/state/workbench/rail-badges.svelte.ts:34-37,226-231`: `projectTypeOrder` reads `tier` and `type` off the `scan` rows to build the Projects tab's split. The file is in the write list, but no item of "What to build" says what replaces this. After item 1 no scan row carries `type`, so the Projects tab split would read empty.
- `PREVIOUS_KEY`, `PAGES_VERSION`, `WORKBENCH_VERSION`, `FLOATLESS_VERSION`, `serialiseFloatless`, and the pending floats:
  - `tools/oculus/src/lib/state/workbench/layout/index.ts:5,10,11,114,118` (re-exports).
  - `tools/oculus/src/lib/state/workbench/layout.svelte.ts:49,93,293,449-469,560-561` (`PREVIOUS_KEY` export and the `pendingFloats` state).
  - `tools/oculus/src/lib/state/workbench/layout/open/float/rail-pages.ts:40,121` (`pendingFloats()`).
  - The parenthetical of `tools/oculus/src/lib/state/workbench/` names none of these three files. Item 14 makes each one false.
  - `PREVIOUS_KEY` itself is defined at `layout/saved/storage.ts:37`, which is inside `layout/saved/`. The brief's premise does not name it.
- `withoutFolderLabels` (item 14's example): `tools/oculus/DESIGN.md:476` ("loses that label when it is restored (`withoutFolderLabels` ..."). Also `DESIGN.md:480` ("an arrangement saved at version 4 or 3 takes the floats of `config/layout.yml` once"). Both become false under item 14. The write list limits DESIGN.md to "the sentences item 16 names", and item 16 does not name the saved layout.
- `ghost` (item 1: "a ghost record is no longer made"):
  - Outside the write list: `src/lib/server/content/audit/publications.ts:194`, `src/lib/server/machine/pty/start/context.ts:36-37`, `src/lib/server/machine/hpc/submit.ts:160`, `src/lib/server/machine/runs/seeds/task-seed.ts:76,85`, `tests/fixtures/entities-fixture.ts:50`.
  - Inside it: `card.ts`, `ProjectCard.svelte`, `board/items.ts`, the model, `normalise.ts`, `as-project.ts`.
  - The brief does not say whether the `ghost` field leaves the model. If it stays, it is a field that is always false. If it goes, these files are outside the list.
- `new-idea` / `newIdea`:
  - `tools/oculus/src/lib/state/client/writes.svelte.ts:507-515`: `newIdea(fields: { id; title?; short?; domain?; eli5? })`, with the comment "under projects/ideas/<id>". The file is outside the write list. Item 11's Folder field and tier have to travel in this body, which makes the type and the comment false.
  - `tools/oculus/docs/apps.md:175`, the `new-idea` row: `{ kind, fields }`, `fields.id` the idea's id. The write list limits `apps.md` to "the `projects` and `personal` rows only". The refusal "when the hub names none" and any new body field make this row incomplete.
  - `src/lib/state/feeds/radar.ts:101` (Lit Watch pre-fill) is outside the list. Whether it changes depends on where the Lit Watch default folder is applied.
- `parked`:
  - `config/text/views/structure/pillars.yml:5` (`archival_blurb: ... abandoned / parked`). It is in the write list ("the files naming what changes") but item 7 does not name it, and the `archive_dead` rename makes it false.
  - `config/catalogs/vocab.yml:112-118`, the status_palette comment "terminal / done / closed (drops off the deadline radar)". For projects this becomes false under item 9: a terminal chip no longer stops a project's deadline.
- `migrate.ts`, `fold.ts`: the `fold.ts` hits in `server/sessions/stores/transcripts.ts:39` and `server/transcripts/usage.ts:52` refer to a different file (`server/sessions/fold.ts`) and are unaffected.
- `new_project_dir`, `Personal.svelte`: no hit outside `.scratch`.
- `manuscript` as a type: every code hit is in the write list (`grep -rn "'manuscript'\|'manuscripts'\|'ideas'\|'side-projects'" src`, the same list as the brief's).

Findings:
1. `src/lib/server/content/docs.ts` (isSideTier, `rule.nested`) is outside the write list and is made false by item 1.
2. `src/lib/server/files/roots.ts` (`repositoriesOf` carrying `tier`, `hubManifests`) is outside the write list and is made false by item 4.
3. `src/lib/data/sources/config/catalog/schemas/engine.ts` (the side-project-schema registration) is not in the parenthetical of `src/lib/data/` and is made false by item 6.
4. `src/lib/state/workbench/layout.svelte.ts`, `layout/index.ts` and `layout/open/float/rail-pages.ts` (PREVIOUS_KEY, the version constants, `serialiseFloatless`, `pendingFloats`) are not in the parenthetical of `state/workbench/` and are made false by item 14.
5. `src/lib/state/client/writes.svelte.ts` (`newIdea`'s body type and comment) is outside the write list and is made false by item 11.
6. `docs/apps.md:175` (the `new-idea` row) is excluded by the "projects and personal rows only" limit.
7. `DESIGN.md:476` and `:480` (saved layout) are excluded by the "sentences item 16 names" limit. Item 16's list misses the saved layout, and also Focus (HELP.md:231), new-idea (DESIGN.md:393) and the deck `find:` sentences. That limit contradicts the rules file's "What every package obeys" rule that a sentence a change makes false is a defect of the change.
8. `rail-badges.svelte.ts:226-231` reads scan `tier`/`type`, and no item says what it reads after item 1.
9. The `ghost` field: the brief does not say whether it stays. If it goes, four server files and `tests/fixtures/entities-fixture.ts` are outside the list.

## 2. The step line

- "Personal projects become projects of the `personal` tier, read, written, drawn and audited by the research code": items 1, 2, 4, 6, 8, and item 6's last sentence on the audit.
- "the side-project record, reader, schema, form, status list and Personal board component removed": items 6, 7, 8.
- "one manifest schema for every project with nothing left out": item 6 (`links` added, `manifest_schema` governs every manifest).
- "`status` the `{ chips, line }` map ... `building`, `running` and `finished`, `parked` renamed `paused`": item 7; item 15 for the data.
- "four boards ... one board component ... Personal gaining the filter menu, stats strip, table and new-project form": item 8.
- "personal projects on the Focus lanes, ticker, Tasks, Cmd-K and search as any project": items 6 and 9; case 18.
- "LaTeX panel and Deposit by place": item 10.
- "research-form ids, with no code for an old `side:` or `root:` id": item 5.
- "`new_project_dir` per tier filling the new-project form's Folder field": item 11.
- "the apps API's `personal` map folded into `projects`": item 13.
- "`tier` and `type` in every manifest and no folder name in code": items 2, 11, 15. Item 1 and decision 10 keep `code` and `attic` as folder names in code. Ruling 47 (J1) names only dot folders, `node_modules` and symbolic links, and (H1) says "no folder name stays in code".
- "`active` and `manuscript` one stage": item 3.
- "`scan:` folders walked to any depth stopping at a project, `roots:` without `tier:`": items 1, 4.
- "every hub manifest, the six repository manifests (Ordo's included) and the three `side-projects/` manifests rewritten to the new shape with the statuses open item 47 gives": item 15 covers the hub and side-projects manifests. The six repository manifests are the orchestrator's work at landing ("What is on the tree", The manifests). The target values (yt-downloader `finished`; scotoma, Missal (key `game-engine`) and Cathedra `paused`; Officium `running`; Ordo `building`) appear nowhere in the brief. Decision 1 gives only their `type: active`.
- "`CLAUDE.md`'s `side-projects/` paragraph, `docs/`, HELP and the schema help made true": item 16.
- "the saved-layout migration code removed": item 14.
- "`present.yml`'s `find:` gaining `types:`": item 12.
- "a project's deadline, follow-ups and subtasks on Focus for every project of every tier, its lane card and waiting tallies by its `focus:`": item 9.
- "a funding scheme's follow-ups and subtasks drawn once": item 9's last sentence.
- "no migration code added": the "What to build" opening sentence, and item 2 (`typeWritten` goes).

Findings:
1. The six repository manifests' rewrite has no requirement and no recorded target status in the brief. Booking it as the orchestrator's landing work is legitimate, but the values from ruling 47 (F, G) should be written down where the landing will read them.
2. Decision 10 (`code` and `attic` not walked) goes beyond ruling 47 (J1)'s list and against (H1)'s "no folder name stays in code". The brief's own rule is "where this brief and a ruling seem to disagree, stop and report it". It is surfaced as a decision, but it reads as a departure from a ruling.

## 3. Premises

- The rulings grep, `grep -n '^- Open item 4[78]\|^- Open item 5[01]\|^- No migration code' plan.md`: prints plan.md:1748-1753, the six lines. Matches.
- `readManifests` 188-239, `ghost` 158-175, `readPersonal` 504-516 (`grep -n 'function' manifests.ts`; sed of the ranges): match.
- `Tier` at `model-entities.ts:27-28` and `SideProject` 639-656 (the type at :648, its doc from :638): match.
- `entities.personal` at `model/index.ts:151-152`: match.
- `wc -l`:
  - `personal.ts` 285, `Personal.svelte` 191, `board/personal.ts` 231, `side-lines.ts` 84: match.
  - The size list (`deposit.ts` 880, `writes.ts` 732, `manifest.ts` 720, `normalise.ts` 727, `model/index.ts` 683, `selectors.svelte.ts` 662, `portfolio.ts` 779, `saved.ts` 758, `ticker.ts` 546, `files.ts` 495, `focus.ts` 400): every one matches.
- `side_project_status` at `vocab.yml:190-194`: match.
- `side-project-schema.yml` has 17 rows (cat of the file). Every row but `status` and `links` is a field of `manifest_schema` (`grep -c "field: X,"` is the wrong form for this map-shaped file; reading `manifest-schema.yml` shows all 15 present). `grep -n "links" config/schemas/manifest-schema.yml` prints nothing (rc=1). Match.
- `grep -rlin "personal\|sideProject\|side-project\|side_project\|SideProject" src config --exclude=local.yml | wc -l`: 54. Match.
- D60 premises: `tierOf` at `files.ts:383`; `findings.roots.tier_*` at findings.yml:31-36 and `findings.manifests.repository_*` at :59-63; the options.yml `roots` `tier` at :1372; `placeOf` at `as-project.ts:75`: match.
- Scan rules:
  - Hub `.oculus/config/sources.yml:8-15`: match (`scan:` at 8, entries 9-15).
  - Engine `tools/oculus/config/sources.yml:9-16`: the file has `scan:` at line 10 and entries at 11-17 (cat -n). Off by one.
  - `ls projects` prints active, archive, coauthor, ideas, manuscripts: match.
  - `isSideTier` at `hub-names.ts:242`: the doc comment is at 242 and the function at 243. Close.
- Manifests:
  - `find projects -name project.yml | wc -l`: 94. No `tier:` line (`grep -l '^tier:' ... | wc -l` prints 0). Every one has exactly one `type:` line (`grep -c '^type:' ... | grep -v ':1$'` prints nothing). The 15 under `manuscripts` are all `type: manuscript`. Match.
  - `grep -rn parked projects --include=project.yml`: the three hits the brief names. Match.
  - `side-projects/*/project.yml` keys: title, status (`idea`), eli5, next, links in all three. Match.
  - The six repository manifests exist; their statuses today are cathedra running, game-engine building, ordo running, scotoma building, officium running, youtube-downloader running.
- Tier and stage words grep: the same hits as the brief, plus `model-entities.ts:28` (the `Tier` type, which item 2 covers). Match.
- Boards:
  - `TIERS` at `presets.ts:198-202`: match.
  - `Projects.svelte` registers three at 17-21: match.
  - `STATS_BOARD` at line 77: it is at line 84 (`grep -n STATS_BOARD`). Off.
  - `layout.yml:143-155` (tab_split and tab_rollup at 141-155) and `:67`: match.
- Focus:
  - `live` at `focus.ts:184-186`, `waiting` from 267: match (the brief says 262, the doc starts there).
  - `ticker.ts` deadline loop 128-131, follow-ups 260-261, subtasks 318-319, funding and collection loops 278/293/331/349: match within a line or two.
  - `normalise.ts:433-460` `funding()` reads `followup` and `subtasks`: match.
  - The `funding` collection is `{ key: funding, file: "funding/funding.yml" }` in both sources.yml layers (`grep`): match.
  - The probe output (two lines) is the orchestrator's and was not rerun.
- New idea: `IDEA_DIR` at `manifest.ts:607`, `createIdea` 633-720, and the callers named (`grep -rln 'createIdea\|new-idea\|NewIdea' src`): match. That grep also lists `state/client/writes.svelte.ts`, `state/feeds/radar.ts`, `state/system/apps/words.ts` and `data/helpers/files/apps.ts`, which the brief does not name.
- Deck: `deck/present.yml` lines 7, 17, 28 as stated (cat -n); `FindSpec` in `deck/spec.ts:17-20`, read by `groups.ts:55-62`: match.
- Saved layout:
  - `wc -l`: migrate.ts 96, fold.ts 133, saved.ts 758: match.
  - `load.ts:96-128`: the pre-pages reading is at 98-123. Close.
  - `PREVIOUS_KEY` is defined in `storage.ts:37` and re-exported by `layout/index.ts:118` and `layout.svelte.ts:49,93`. The brief does not say this.
  - `layout/model.ts`: `LAYOUT_VERSION` and the older constants at 215-239 (`PINS_VERSION = 6` at 215, `PAGES_VERSION = 3` at 233, `WORKBENCH_VERSION = 2` at 239): match.
- The apps API: `docs/apps.md:134` is the `personal` row: match.
- Bookmarks: `grep -n 'root:' .oculus/bookmarks.yml` prints only root keys (cathedra, game-engine, claude); `.oculus/workspaces.json` has no `side:` or `root:` id (`grep -c` prints 0). Match.
- Folders at ten (`git ls-files <d> | sed 's|^<d>/||; s|/.*||' | sort -u | wc -l`):
  - The six the brief names are at 10: match.
  - Also at 10 and in the write list: `src/lib/state/workbench`, `src/lib/state/workbench/layout`, `src/lib/views/shared/forms`, `src/lib/server/files`, `src/lib/data/helpers`, `src/lib/data/sources/deck`, `src/lib/server/content`, `src/lib/state/client`, `tests/routes/edit`.
  - The brief says "the full folders are listed in the premises".
- Tests that name what changes: the brief's grep `grep -rlin "personal\|sideProject\|side-project\|SideProject\|side:\|'manuscripts'\|IDEA_DIR\|createIdea\|treeWithoutRetired\|withInfoFolded\|PAGES_VERSION\|WORKBENCH_VERSION" tests | wc -l` prints 35. `git grep -l -i` with the same patterns also prints 35.
- ADR premise: `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both: match.
- The hub `CLAUDE.md` paragraph: `grep -n 'side-projects/' CLAUDE.md` gives line 102: match.

Findings:
1. "lists 36 files" is wrong; the brief's own grep prints 35 now.
2. The engine scan rules are at `config/sources.yml:11-17` (`scan:` at 10), not 9-16.
3. `STATS_BOARD` is at `Projects.svelte:84`, not 77.
4. The list of folders at ten items is incomplete, yet the brief calls it full. These are also at ten and in the write list: `src/lib/state/workbench`, `src/lib/state/workbench/layout`, `src/lib/views/shared/forms`, `src/lib/server/files`, `src/lib/data/helpers`, `src/lib/data/sources/deck`, `src/lib/server/content`, `src/lib/state/client`, `tests/routes/edit`.
5. The hub's scan list has seven entries today (including `projects/software`, optional). Decision 12 says the hub "keeps its six folders as six entries", and item 15's list of six drops `projects/software` from the hub layer without saying so.
6. The saved-layout premise does not say that `PREVIOUS_KEY` and the pending floats live in `storage.ts`, `layout/index.ts`, `layout.svelte.ts` and `open/float/rail-pages.ts` (see Names 4).

## 4. Cases and checks

- Cases 1 to 6: consistent with the rules file and ruling 47. Case 6's "a key equal to a hub folder's name ... no project" settles item 5's "first in folder order" for a root by dropping the root, which item 5's wording does not itself say.
- Case 7: consistent (G8, G9).
- Case 8: consistent. The Folder field's default is a reader-visible behaviour, and the rules file's "What every package obeys" sends that to the look; the case as written exercises `createIdea`.
- Cases 9 to 12: consistent with ruling 51 (2) and 51 (1).
- Case 13 is filed as "G29's rows, rewritten". `agents/guarded.md` G29's sentence is "A saved layout of an earlier version is read into the current one with every page and tab kept". Ruling 50 retires that behaviour, so after D65 the entry states something false. The case's "the raw text kept under the unread key" is G31's behaviour (G31: "the saved layout that does not read is kept under `oculus.layout.unread`"), not G29's.
- Case 14, 15, 16, 18: consistent.
- Case 17: consistent as a quoted run. Its `parked` grep is case-sensitive, and `projects/ideas/fedbtd/project.yml:11,13` keep "PARKED." and "PARKED / do not re-attempt" (`grep -rni parked projects --include=project.yml`).
- The tests block, against the rules file's "What every package obeys" test rule ("An entry keeps one test per unit it covers ... written as a table where a unit has several outcomes"):
  - G32's manifests reader would hold three tests: 'carries the provenance of a flat project', the new table 'reads $name', and the rewritten repository table.
  - G9 already holds 'writes a manifest field back, logs the undo, and undoes the undo' for the manifest undo, and the brief adds a second test, 'puts a project's manifest field back, any tier', for the same unit.
  - G15's Code line is `src/lib/data/snapshot/`, while its new table is in `tests/data/sources/manifests.test.ts`, the reader under `src/lib/data/sources/`.
  - G13's row for case 4 is left as "`config.test.ts` or the scan reader's test". The scan reader is `scanRules` in `src/lib/data/index.ts:93`, which is not in G13's Code line.
  - The brief says "each a row of an existing entry's table", but G15's and G32's tables in `manifests.test.ts` are new tables.
- "Verify before you report":
  - Check 2 runs `grep -rn ... src config` with no `--exclude=local.yml`. Run from `tools/oculus`, it reads `config/local.yml`, which the state file's standing demand forbids ("every grep over `config/` uses `--exclude=local.yml`").
  - Check 3 greps only `tier:` and `nested:`, while it claims "no scan entry or roots entry with `tier`, `type` or `nested`". A scan entry keeping `type:` passes it.
  - Check 8 only parses the YAML, which also passes with no rewrite at all; case 17 is what checks the rewrite.
  - Checks 1, 4, 5, 6 and 7 are runnable from `tools/oculus` in the worktree and pass for the right reason.
- No case asks the builder to check, quote or explain a place the step does not change.

Findings:
1. Case 13 is filed under G29, whose sentence ruling 50 makes false, and its unread-key rows belong to G31. G29's entry text needs rewriting or retiring at landing, and the brief does not say so.
2. The tests block breaks the one-test-per-unit rule for G32's manifests reader and G9's manifest undo, files G15 rows against a unit outside G15's Code line, and leaves G13's location open.
3. Check 2 greps `config` without `--exclude=local.yml`.
4. Check 3 does not detect a scan entry's `type`.

## 5. The question

Asked of each one: could it pass without one kind of project (one record, reader, writer and board component; the manifest's own `tier` and `type` deciding placement; no migration code)?

- Case 1: no. It requires `entities.projects` with the manifest's tiers and types, and no `entities.personal`.
- Case 2: no.
- Case 3: no.
- Case 4: no.
- Case 5: no.
- Case 6: no.
- Case 7: no.
- Case 8: no.
- Case 9: no.
- Case 10: no.
- Case 11: yes. `presetFor('personal', config)` passes on config alone while `Personal.svelte` is still registered and drawing; only verify check 2 and the look catch that.
- Case 12: no.
- Case 13: no.
- Case 14: no.
- Case 15: no.
- Case 16: no.
- Case 17: yes on the rename. It passes with "PARKED" left in `fedbtd`'s status line and `next`, while ruling 47 (B1) says "`parked` is renamed `paused` everywhere".
- Case 18: no.
- The check on the step line (the plan's `npm run test:landing` at landing): yes. A green suite does not by itself show one board component or one record; the cases and verify check 2 carry that.
- Item 1: no (cases 1, 2, 4, 5).
- Item 2: no (cases 3, 7, 15).
- Item 3: yes. Nothing checks the Map legend, `tab_split`, the rollup's `in progress` keys, or the Projects tab split (`rail-badges.svelte.ts`). Case 3 only checks that `type: manuscript` is a finding.
- Item 4: no (case 6).
- Item 5: no (cases 5, 6, 18).
- Item 6: no (cases 1, 15, 16, verify 2).
- Item 7: no (case 14).
- Item 8: yes. Case 11 checks config only (above). Personal's filter menu, stats strip, table and form go only to the look.
- Item 9: no (cases 9, 10).
- Item 10: yes. No case covers the LaTeX panel over a repository project's `manuscript/`, Deposit for a hub-folder personal project, or no Deposit for a repository project. Case 7 covers only the app-frame write.
- Item 11: no (case 8).
- Item 12: no (case 12).
- Item 13: yes. No case or check reads `docs/apps.md` or the apps API payload for the `personal` map's absence.
- Item 14: no (case 13).
- Item 15: no on the counts (case 17), yes on "everywhere" (case 17 above).
- Item 16: yes. It is a report list only. The write list's "item 16 sentences" limit also leaves out sentences the change makes false (Names 7).
- Verify 2: yes in part. Hits of `personal` are allowed "with why it stays", so remaining side-project code passes if the report gives a reason; the reviewer has to read the list.
- Verify 3: yes (it misses `type:`).
- Verify 8: yes (parse only).

Findings:
1. Case 11 could pass with Personal.svelte still the Personal board.
2. Case 17 could pass with "PARKED" left in `fedbtd`.
3. Items 3, 10 and 13 have no case or check that fails when they are not built.
4. Item 16 has no check, and its write limit is narrower than the change.
5. Verify 3 could pass with `type:` left on scan entries.

## 6. Implied inputs

This is a code step. Each input below is one the step implies and does not state, and is not under "Cases", with the result it should have:

1. A manifest with `tier: personal` inside `projects/`, or `tier: projects` inside `side-projects/`: the project is on the board its tier names, and its category is unaffected.
2. A personal project whose chips fall in none of the five Personal rollup groups (for example `blocked` only, or no chips): which tab-split cell it counts in. The `layout.yml` comment says the buckets "cover every card".
3. A repository root whose `<dir>/.oculus/project.yml` is missing, and one whose dir is not on this machine: no project and no finding (the root still serves files). Today `repository_no_manifest` is a finding, and item 4 does not say it goes.
4. A scan folder that itself holds `project.yml` (for example `{ dir: projects/x }` where `x` is a project): whether the scan root is read as a project.
5. Two scan entries that overlap (`projects` and `projects/ideas`): one manifest reached twice must not be a duplicate-id finding naming one file twice.
6. A saved tab naming an id that no longer exists (an old `side:` or `root:` id): it draws the unknown project. Item 5 states it; no case runs it.
7. A deck group with `types:` but no `tiers:`: it keeps decks of any tier with that type, and a deck with no project is dropped.
8. Focus:
   - a project with no `focus:` but with `waiting-on` and the `blocked` chip, of the tier `archive`: no tally. Today `blocked` counts over every project (`focus.ts:281-287`), so this is a behaviour change ruling 51 (2) makes, and no case shows it.
   - a project with a terminal chip (`published`, `accepted`) and a dated deadline: per item 9 and ruling 51 (2) it now shows, where `settled` (`focus.ts:93-95`) hides it today.
9. `venueLoad` (`ticker.ts:387`) is fed the `live`-filtered `projects` (`ticker.ts:109`). Item 9 removes `live` and does not say which projects the venue concentration warning counts.
10. The Projects tab split (`rail-badges.svelte.ts:226-231`) reads scan `tier`/`type`: after item 1 it should come from the board's projects' `type` in `type_order` order.
11. A manifest whose `id:` differs from its folder name: per item 5 the id is the basename. Today `manifestId` keeps the written one. Should there be a finding?
12. `new_project_dir`:
    - a value that is not a map, a tier key outside the five, or a folder outside every scan folder: a finding naming the key (G13);
    - a new-project form submitted with an empty Folder on a board whose tier has no value: refused with a sentence.
13. The order of "first in folder order" (item 5) between a hub folder and a repository root key: case 6 implies the root loses, and item 5 should say so.
14. A personal project scaffolded by `createIdea` gets the research status line and next ("New idea - scope + novelty check open.", "cited-novelty lit check", `manifest.ts:610-611`), while the audit's research rules skip the tier. This is a reader-visible choice and should be named.

Findings: all fourteen above are missing from "Cases"; 3, 8, 9 and 10 are the ones whose wrong answer costs most.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both, and `grep -n adr tools/oculus/.scratch/migration/orchestrator-state.md` prints nothing (no `adr` key in the configuration block). There is no record.

Findings: none.

## 8. Dictated text

- The Python rewrite of item 15 (`grep -n "python3 - <<'EOF'" agents/briefs/D65.md`, brief lines 52-97):
  - Read line by line against the rules file and the hub `CLAUDE.md` "Writing docs": ASCII only, no comment carrying history.
  - It reads each file into `before` before writing `text`, so it is not the truncating `open(f,'w').write(transform(open(f).read()))` form.
  - It guards each write with an assertion on the parsed value, which covers "guard against a shrunk output".
  - It is run on a scratch copy only: `rsync -a --include='*/' --include='project.yml' --exclude='*' projects side-projects` into `mktemp -d "$TMPDIR/d65check.XXXXXX"`, then the command run from there. It printed `rewritten`, rc=0.
  - `git diff --no-index --stat` against an identical copy of the originals: "94 files changed, 112 insertions(+), 18 deletions(-)" over `projects/`, and "3 files changed, 12 insertions(+), 3 deletions(-)" over `side-projects/`.
  - Every changed line is a `+tier:`, a `type: manuscript` to `type: active`, or one of the three `parked` words.
  - On the copy, `grep -c '^tier:' ... | grep -c ':1$'` prints 97, and `grep -rn 'manuscript$\|parked' ... | wc -l` prints 0. Both match the brief.
  - It leaves `projects/ideas/fedbtd/project.yml` lines 11 and 13 with "PARKED" (uppercase). Ruling 47 (B1) says `parked` is renamed `paused` everywhere. Whether Axel's prose in a status line and `next` counts is his call, but the brief's command and case 17 do not decide it.
- `board.search.personal`, `tab_rollup.personal` with the labels `building`, `running`, `paused`, `finished`, `idea` and the `idea` keys `[nascent, scoping, de-risking, exploring]`: each key exists in `status_legend` (`vocab.yml:62-92`). `board.search` is a `layout.yml` map read by `searchOf` (`presets.ts:336-338`). Holds.
- The legend rows `building` (icon `active`), `running` (icon `live`), `finished` (icon `done`): each glyph exists in `config/catalogs/glyphs.yml` (`active` :137, `live` :118, `done` :75). Holds.
- `new_project_dir` hub value `{ projects: projects/ideas, personal: side-projects }`: holds.
- `deck/present.yml` lines 7, 17, 28 as `tiers: [projects]` with `types: [active, idea]`, `[active]`, `[idea]`: each group keeps the decks it holds today, since every `projects/ideas` manifest is `type: idea`, every `projects/active` one is `active`, and every `projects/manuscripts` one becomes `active` (per-folder `grep -h '^type:' | sort | uniq -c`). Holds.

Findings:
1. The dictated command leaves "PARKED" in `fedbtd`'s status line and `next`, which ruling 47 (B1)'s "everywhere" may reach. It should be decided and written into the brief one way or the other.

## Declined to judge

- The orchestrator's funding probe (scratch `probe-funding.mjs`, "printed two lines") was not rerun. The code read (`ticker.ts:278-310`, `:331-364`, both sources.yml `collections` entries) agrees with it.
- Whether the sparse checkout of `.agents/worktrees/D65` holds `.oculus/`: `.agents/plan.yaml`'s `worktree_paths` does not list `.oculus`, so the orchestrator has to add it by hand at worktree creation. The worktree does not exist yet, so this was not checked.
- Whether "PARKED" in Axel's own prose falls under ruling 47 (B1) is Axel's call.
- Whether `code` and `attic` (decision 10) are within ruling 47 (H1) and (J1) is a ruling question for Axel or the orchestrator under automode. It is reported above as a seeming disagreement.
- The merge of D65's `model/index.ts`, `findings.yml`, `options.yml` and `docs/apps.md` edits with D62's: D62's diff is not on main, so it was not read.

Agent usage: ac3dad5f32f862a13, claude-opus-5-5, 255639 tokens, 84 tool uses, 12.6 minutes.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names 1 (`docs.ts`): item 1 says the docs reader walks every scan folder as the projects reader does; the premises name `docs.ts:252-256`; the path list gains `server/content/docs.ts`.
- Names 2 (`roots.ts`): item 4 names `repositoriesOf` and `hubManifests`; the premises name them; the path list gains `server/files/roots.ts`.
- Names 3 (`engine.ts`): item 6 names the catalog registration; the premises name `engine.ts:18,103-109`; the path list names `sources/config/catalog/schemas/engine.ts`.
- Names 4 (layout files): item 14 names `storage.ts`, `layout/index.ts`, `layout.svelte.ts` and `open/float/rail-pages.ts`; the premises say where `PREVIOUS_KEY` and the pending floats live; the path list names the three files outside `layout/saved/`.
- Names 5 (`writes.svelte.ts`): item 11 says `newIdea` and the `new-idea` body carry `tier` and `folder`; the path list gains `state/client/writes.svelte.ts`, `state/feeds/radar.ts`, `state/system/apps/words.ts` and `data/helpers/files/apps.ts`.
- Names 6 (`apps.md:175`): item 11 says the `new-idea` row is made true; the path list names that row.
- Names 7 (the item-16 limit): item 16 now covers every sentence the change makes false, naming `HELP.md:231` and `DESIGN.md:393,476,480`; the path list says "every sentence item 16 makes true".
- Names 8 (`rail-badges.svelte.ts`): item 1 says the Projects tab's split is the `type_order` words the board's projects carry; item 3 and case 11 check the `idea` and `active` split.
- Names 9 (`ghost`): item 1 says the `ghost` field leaves the model and every reader loses its branch; the premises list the readers; the path list names the four server files for the field only, and `tests/` holds the fixture.
- Step line 1 (six repository manifests): item 15 writes ruling 47 (F, G)'s values as the orchestrator's landing work.
- Step line 2 (decision 10 against (H1) and (J1)): `code` and `attic` are no longer named; item 1 skips only dot folders, `node_modules` and symbolic links, as (J1) says, and says no other folder name is named in code. On the tree no `code` or `attic` folder lies outside a project (the session's `find projects side-projects -type d \( -name code -o -name attic \) -prune` loop printed nothing), so the walk, which stops at a project, reads the same set. Decision 10 is now the id order.
- Premises 1: the count is 35.
- Premises 2: the engine's scan is lines 11-17, with `scan:` at 10, in the premises and in item 15.
- Premises 3: `STATS_BOARD` is at line 84.
- Premises 4: the folder list names all fifteen folders at ten items that the step writes into, with the command.
- Premises 5: the hub keeps seven scan entries with `projects/software` optional, in item 15 and decision 12.
- Premises 6: covered under Names 4.
- Cases and checks 1 (G29): case 13's unread-key rows go to G31's test, and the orchestrator rewrites G29 at landing to "A saved layout of the current version is read with every page and tab kept", as the tests block says.
- Cases and checks 2 (one test per unit): G32's two manifests tests are replaced by one table; G9 rewrites its existing repository undo test, adding none; the G15 rows are placed in `tests/data/snapshot/`, under G15's Code line; G13's scan rows go in one table of a new `tests/data/sources/scan.test.ts`, with `scanRules` added to G13's Code line at landing.
- Cases and checks 3: verify check 2 carries `--exclude=local.yml`.
- Cases and checks 4: verify check 3 greps `type:` too and asks for every printed line with its list.
- The question 1 (case 11): case 11 checks that `views/boards/personal/` is gone and that `Projects.svelte` registers `personal`.
- The question 2 (case 17): case 17's grep is now case-insensitive, and item 15's command renames `PARKED` (ruling 47 (B1), "everywhere").
- The question 3 (items 3, 10, 13): case 11 checks the Projects tab split (item 3); case 19 checks LaTeX and Deposit by place (item 10); case 20 checks the apps snapshot (item 13).
- The question 4 (item 16): item 16 is widened as in Names 7. A read of the sentences stays the check, by the reviewer.
- The question 5 (verify 3): closed as in Cases and checks 4.
- Implied inputs 1, 4, 5 and 3: case 21; item 1 (scan folder that is a project, overlapping entries) and item 4 (a root with no manifest, `repository_no_manifest` gone) state them; decision 16.
- Implied input 2: case 11 and decision 15.
- Implied input 6: case 13.
- Implied input 7: item 12 and case 12.
- Implied input 8: item 9 states the `blocked` chip on a lane only and the terminal chip no longer hiding a deadline (ruling 51 (2)); case 9 runs both.
- Implied input 9: item 9 and decision 13 (`venueLoad` counts the tier `projects`).
- Implied input 10: closed as Names 8.
- Implied input 11: item 5 says the written-id finding stays (`manifests.ts:128`).
- Implied input 12: item 11 and case 22.
- Implied input 13: item 5 and decision 10 state the order.
- Implied input 14: item 11 and decision 14.
- Dictated text 1: item 15's command renames `PARKED` in `fedbtd`'s line and `next`, under ruling 47 (B1)'s "everywhere".
- Dictated lines added after the check, each read against `spec.md` and the hub `CLAUDE.md` "Writing docs": the revised item 15 command (ASCII, no history comment; reads each file before writing, asserts each parsed value; run by the session on a scratch copy: `rewritten`, "94 files changed, 114 insertions(+), 20 deletions(-)", "3 files changed, 12 insertions(+), 3 deletions(-)", the `tier:` count 97, the case-insensitive `manuscript$|parked` grep 0): holds. The G29 sentence "A saved layout of the current version is read with every page and tab kept": holds. The line "New project.": holds.
