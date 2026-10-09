# D48 brief check

D48 brief check: the brief needs changes before dispatch. Six of its instructions are wrong on the tree at 34935a601:
- The side schema rows cannot copy the manifest_schema type words or the dotted followup rows.
- The finding sentences in config/text/findings.yml become false and that file is not in the write list.
- G32's test `tests/data/sources/personal.test.ts` breaks and is not in the write list.
- The G9 undo test and `undo.ts` (the undo code) are not in the write list.
- The project card has no `related` links for the side card to reuse.
- Seven sentences outside the write list become false.

## Names

Commands run: `grep -rn -i "side project\|side-project\|SideProject\|entities.personal" src config docs DESIGN.md HELP.md README.md --exclude=local.yml`; `grep -rn "five keys\|holds five" ...`; `grep -rn "five fields\|the five\b" ...`; `grep -rn "personal_field_type\|personal_key" config/text`; `grep -rln "writeManifest\|writeSubtask\b\|subtaskHost\|manifestValue" src tests`; `grep -rn "\bCATEGORIES\b" src tests`; `grep -rn "focusLabel(" src tests`.

These hits outside "Paths this step writes" become false or break:

- `config/text/findings.yml:45` `personal_key: 'key {0} is not one of title, status, eli5, next and links and is not read'`. This becomes false. Case 2's `venue` finding would carry it. The file is not in the write list.
- `config/text/findings.yml:43` `personal_field_type: '{0} is not text and is read as empty'`. Case 2 asks for this finding on `subtasks: "x"`, `pin: "yes"` and `waiting-on: 3`. None of those fields is a text field, so the sentence is wrong for each.
- `src/lib/data/sources/manifests.ts:25` "The five fields are a few lines each" (the `PERSONAL_MAX_BYTES` comment) becomes false. The brief's grep misses it.
- `manifests.ts:356-360` is `readPersonal`'s head comment. Item 6 says to rewrite it, but `manifests.ts` is not in the write list. The brief also says (line 184 note) that the step does not change this file.
- `src/lib/data/helpers/hub-names.ts:82` "which only the Personal board reads" becomes false.
- `config/sources.yml:15` comment "the Personal board only" becomes false.
- `docs/configuration.md:41` "they feed the Personal board only" becomes false.
- `DESIGN.md:552` "no research reader (... the Focus lanes, ... the subtask and manifest writes) finds a side project" becomes false. This is the real DESIGN.md sentence to change. The brief's "where it lists what Focus reads" names no existing place: `grep -n "Focus\|ticker" DESIGN.md` finds no list of what Focus reads.
- `docs/views.md:23` "A side project is on no other board, lane or audit" becomes false. This line is inside the Personal section the brief names, so it is covered if the builder reads the section.
- `docs/apps.md:248` lists the SideProject fields of the apps API `personal` map (`id`, `title`, `status`, `eli5`, `next`, `links`, `source`, `file`). This becomes incomplete. The new fields reach apps, which is a wire-format change the brief does not name as a decision.
- `tests/data/sources/personal.test.ts:89` 'reads the five fields' (G32, guarded.md:184) runs `expect(project).toEqual({id, title, status, eli5, next, links, ...})` on the snapshot's SideProject. New fields such as `waitingOn: []` or `pin: false` make it fail unless they are dropped when empty. The file is in neither the write list nor the verify list.
- `src/lib/server/edit/writes/undo.ts:51,127,283-291,340-344` calls `manifestValue`, `writeManifest`, `writeSubtask` and `restoreSubtask` with `(hub, config)` only. A `root:` lookup through `readPersonal` needs the personal roots, so these signatures or the WriteTarget change. undo.ts is not in the write list.
- `src/lib/server/git/deposit.ts:435` calls `writeManifest(into.hub, into.config, ...)`. It changes if the signature does; it is not in the write list.
- `tests/state/boards/board/side-fixture.ts` and `tests/state/workbench/rail-badges-fixture.ts` build typed SideProject values. The type checker will send the builder there; the brief covers this in general terms.

Hits that stay true: `DESIGN.md:99/108`, `config/text/views/system/workbench.yml:26`, `docs/configuration.md:21`, `server/content/docs.ts:211`, `Lanes.svelte:220` (focusLabel).

Hits whose behaviour changes without a word in the brief: `src/lib/data/snapshot/references/build.ts:145` reads `side_project_schema`. The new `from:` rows make the reference index (G66) index `collaborators`, `waiting-on` and `related` in hub side manifests. `src/lib/data/snapshot/schema/static.ts:69` builds the side JSON Schema (see Implied inputs).

Steps in flight share paths with D48. D41 writes the whole of `model-entities.ts` (its `RawManifest`) and `manifests.ts`. D41, D46 and D47 write `keys.test.ts`. D41, D46, D47 and D57 write lines of `DESIGN.md`, `HELP.md` and `docs/views.md`. `orchestrator-state.md` dispatch blocks hold no D48 `shared_paths:` yet.

The brief gives `HELP.md`, `docs/views.md` and `DESIGN.md` by section name. Its own path rule asks for line ranges. The ranges are HELP.md 105, views.md 5-7 and 21-23, DESIGN.md 552.

## The step line

Command: python comparison of `plan.md` line 706 with the brief's quote prints `True 858 858`. Each ruling fragment `grep -c -F` matches 1.

- "manifest accepts ... the eleven keys, same names and shapes, read by the same code": item 1.
- "`side-project-schema.yml` gains them": item 1, the schema rows.
- "Focus shows a side project's deadlines and tasks beside the research projects'": item 2. Item 3 (the buttons) serves the same part, by Z746(c).
- "ticker rows at --fs-xs (11 px), name at regular weight, 18 px row, 14 px line": item 5.
- "with no heading changed": item 5.
- "a screenshot of Focus on TEST before and after": case 14 and "What it must do".
- Item 4 (the Personal card) serves no part of the step line. Its authority is Z746(e), self-rule (plan.md:1616).

No part of the step line is without a requirement.

## Premises

Commands: `sed -n`/`grep -n` over each cited file; `ls | wc -l` per folder; `wc -l`; `ls side-projects`; `grep -n adr .agents/plan.yaml`; `find . -name adr -type d`.

Hold: `side-project-schema.yml` is 15 lines with the five rows. normalise-personal.ts is 168 lines. `field_type`/`key` problems, ids `side:`/`root:`, `static.ts:35,:69`, `references/build.ts:145`, `readPersonal` 361-373, Personal.svelte 234 lines with :89 `openManifest`, `side_project_status` at vocab.yml:202-206, three side projects, normalise.ts `project()` 290-344, `followups` :234, `subtasks` :266, the manifest-schema rows at 38/45/46/51/57/58/59/61-64/80, ticker.ts 638 lines with the live filter at 204, deadlines from 219, follow-ups at 338, subtasks at 387, focus.ts 270-288, `CommandCenterView.svelte:74-84`, `CommandCenter.svelte:136`, ProjectCard 130-135, 113 and 358, `LaneCard.svelte:35`, rows.ts 300-313, `writeManifest` :268, `insideHub` :190-194, `subtaskHost` 46-67, all Ticker.svelte lines and token lines, `views.personal_glyph: spark` (personal.yml:18), folder counts (state/boards 10, data/snapshot 9, writes 10, focus 9, personal 1, schemas 4), G12, G13 and G24.

Wrong or imprecise:

1. "`FIELDS = [...]` (line 41)" and "`identity`, 47-51". They are at normalise-personal.ts:26 and :38-42 (`grep -n "FIELDS =\|function identity"`).
2. "the functions `project()` uses (`str`, `strings`, `followups`, `subtasks`) moved or exported". `followups` and `subtasks` are already exported, and `str`/`strings` live in `data/helpers/guards.ts:29,69`. `normalise.ts:17` imports `sideProjects` from normalise-personal.ts, so importing back from normalise.ts makes an import cycle. Moving the two readers out is the clean form; the brief does not say where.
3. "`archive_dead` lists `parked` among the outcomes that do not count as live". `archive_dead` (vocab.yml:221) is the research archive outcome denylist for the Pillars Archival band (`selectors.svelte.ts:341`, `ArchivalCard.svelte`). It says nothing about side statuses, so Decision 2's stated basis is a different vocabulary.
4. "The guarded entry of the manifest and registry readers (line 184 ...) covers `data/sources/manifests.ts`, which the step does not change." Line 184 is G32's test line. G32's Code line (guarded.md:183) names `src/lib/data/snapshot/` and `src/lib/data/model/`, which the step changes. Its tests `tests/data/sources/personal.test.ts` and `tests/data/snapshot/normalise.test.ts` must run, and the first must be made true.
5. G8 is at guarded.md:49-51 and G9 at :52-54 (`grep -n "^- G8\.\|^- G9\."`), not 48-50 and 51.
6. "Read 8: `tests/server/edit/writes.test.ts` (... and the undo rows)". `grep -n undo tests/server/edit/writes.test.ts` prints nothing. G9's undo tests are `tests/routes/edit/undo/undo.test.ts` and `tests/server/core/changes.test.ts`.
7. "`collaborators` and `related` draw as the project card's links (`CardLinks.svelte`), a related research project opening its project tab". CardLinks.svelte:46-79 draws funding, pillars, datasets, collaborators and software. There is no `related` kind; `relatedIds` reaches a card only through the software tier (`board/items.ts:41`). There is no existing related line to reuse, and its label words are a new visible shape.
8. "No write path reaches a side manifest today". This holds for `/api/write`. The source tab's save already writes the file, which is how "its words are edited".
9. "Ticker is drawn by ... the Gallery". This holds, but the Gallery's Ticker has no `onaction`, so "with a button shown" in case 14 cannot apply there.
10. Minor line drift: CATEGORIES is at ticker.ts:35, GLYPHS at :47, TickerTarget.kind at :91 (the brief says 34, 45, 88). SideProject runs 804-815.
11. `.agents/worktrees/D48-base/` and its `unused-exports.txt` are not on disk yet (`ls .agents/worktrees` lists D41, D46, D47 and D57 and their bases, plus `gate`). They are expected at dispatch.
12. Room for a new file: "a new file for the side manifest's lookup in a folder with room". `server/edit` has 10 items, `writes/` 10 and `writes/config/` 10, all full. A new subfolder in `writes/` makes 11. No folder near the write path has room, so the brief must name one or say the lookup lives in `manifest.ts` (486 lines). `state/boards/board/` (8) has room for the ticker's side lines.

## Cases and checks

Against `agents/spec.md`:

- **Case 9 against "one test per unit".** The spec keeps "one test per unit it covers: each ... write kind ..., written as a table". The manifest and subtask write kinds already have 'writes the changed field and nothing else' and 'ticks and reopens a line of a manifest' (writes.test.ts:41,55). A separate new `it` covering both kinds is a second test per unit, where the rule calls for rows of those tables. The spec also says guarded.md names every test by title, and the brief does not say the orchestrator adds the title to G8's Test line.
- **Case 9's G9 half.** "the same file's undo row" names writes.test.ts, which holds no undo rows. G9's tests are in `tests/routes/edit/undo/undo.test.ts`, which is in neither the paths nor the verify list. 'ticks and reopens a line of a manifest' is tagged slow; the brief does not say to run it alone.
- **Case 15** asks for `personalFindings` over "the three hub side projects". The spec names four readers of the real hub and nothing else; the run should read the worktree's copy (`side-projects` is in `worktree_paths`).
- **Case 4** asks to check the YAML editor's JSON Schema, which `schema/static.ts`, `hub.ts` and `record.ts` build. The step does not change those files, and they mis-handle the rows the brief dictates (Implied inputs). The "with those keys" variant must be a copy under $TMPDIR; the brief does not say so.
- **Case 7** says "followup: { do: x }: the first in the follow-ups". In `ticker()` a note with no `after` has `days: null` and goes to `tasks` (ticker.ts:372-374, `openNotes`); `Ticker.followups` holds only dated notes. A `ticker()` scratch run gives `tasks`. Only the Tasks band's `taskGroups().followups` would hold it, and the case does not say which.
- **Case 10** "a research id carrying `side:`" has no stated input or expected outcome. Research ids are folder names (manifests.ts:114,165).
- **Case 14** "rows 18 px apart" contradicts `.ticker { gap: 2px }` (Ticker.svelte:121). Rows 18 px high are 20 px apart.
- **"What it must do"** puts the side-line looks on "a scratch oculus whose hub is a scratch copy". The spec says the look is on TEST "on his running server" (`.agents/plan.yaml` `look:` says the same). This is a departure the brief does not name as one.

Cases that ask the builder to check a place the step does not change: case 4 (the schema generator), case 15 (the real hub), case 9's G9 half (undo.test.ts), case 13's reuse of `CardLinks.svelte`, `ProjectCard.svelte` and `LaneCard.svelte` (read only, as intended).

## The question

Could each check pass without the goal being reached?

- **Case 1:** no.
- **Case 2:** yes. It passes with findings whose sentences are false (findings.yml:43,45).
- **Case 3:** yes. Equal output passes with a copied reader, so "read by the same code" is shown only by reading the imports.
- **Case 4:** yes. Completion and help for `deadline`, `waiting-on` and `subtasks` pass while valid values are marked: `subtasks` and `followup` maps, and the `collaborators`/`related` lists typed `chips`. It needs a row: a manifest with research-shaped values for all eleven keys gets no mark.
- **Cases 5-8:** they show `ticker()` output only. They pass while the view draws the `side` group under the conference heading, because `categoryLabel`'s fallthrough (CommandCenterView.svelte:83) returns `dlcat_conference`. They also pass while a side line's press opens a project tab, because `openLine` calls `onproject(line.id)` (rows.ts). Both are left to the look.
- **Case 9:** yes, for `root:`. Only `side:` gets a guarded row; `root:` has only scratch case 11. The undo half points at the wrong file.
- **Case 11:** no.
- **Case 12:** no for running; parked is not specified.
- **Case 13:** look only. It passes with a `related` line that has no label in the catalog.
- **Case 14:** yes. It passes at scale 1 and 1.25 while at text scale 0.7 to 0.9 (`boundedTextScale`, ui.svelte.ts:618, range 0.7-1.6) the button (14s+4 px) is taller than the row (18s px), so a shown button grows the row.
- **Case 15:** no.
- **The step line's screenshot:** on Axel's server no side project has a deadline (`cat side-projects/*/project.yml`), so it shows the row size only. The side lines rest on the scratch looks.
- **Item 6's grep:** yes. It passes while the seven sentences listed under Names stay false.
- **Item 7:** no. model-entities.ts is at 814 lines; with D41's field and eleven commented fields it nears 880.
- **Verify 2:** it omits personal.test.ts and normalise.test.ts (G32) and undo.test.ts (G9), so the G32 failure would first appear at landing.
- **Verify 4 bullet 3** says "this brief says which it is". The brief never says whether case 9's test is an audit or a proof.

## Implied inputs

1. **The JSON Schema of a list-form schema with dotted rows.** `sections()` (static.ts:25) sends the side schema through `fieldsOf` and `recordSchema` (record.ts). That code makes a literal property `"followup.do"` and keeps `additionalProperties: false`, so a side manifest's `followup:` key is marked as unknown. Only `manifestSchema()` (schema/manifest.ts:67-89) nests dotted names.

   The manifest's widget words `chips` and `keymap` are not in `FIELD_TYPES` (record.ts:51-61), so they read as text. A `collaborators` or `related` list and a `subtasks` map would be marked.

   Expected: the eleven research-shaped keys validate clean in both manifest kinds. That needs either a translation through `WIDGET_TYPES` (manifest.ts:30-41: chips to tags, keymap to raw, followup as a records or raw row) or the side kind built by `manifestSchema`. The brief's "the type ... of its manifest_schema row (the followup group as its two dotted rows)" gives neither.
2. **The field types on the write side.** `fieldTypes` (writes/manifest.ts:71) reads only the map form `{ fields }`, so a list-form side schema yields `{}` and every side field is coerced as text. A research write refuses `subtasks` ('a map field is not written by the form', :102); a side write would not. Expected: the same refusals as a research write. The brief says field names only.
3. **The write path for a served root's `.oculus/project.yml`.** `writeManifest`, `manifestValue` and `subtaskHost` receive `(hub, config)`. `readPersonal` needs the personal roots from `personalRoots(listed, hub, engineConfig)` (server/root/watch/portfolio.ts:281). `WriteTarget` has `sources.held.served` but no personal roots, and undo.ts and deposit.ts call with `(hub, config)`.

   The change log keeps an absolute path outside the hub (`pathOf`, changes.ts:158-161), which works. History then shows an absolute path for a root write and a relative one for a hub write (History.svelte:148).

   Expected: the undo of a `root:` write puts the file back, and a `root:` write whose root is no longer served is refused as not found. Neither is in a guarded case.
4. **Ids colliding.** Research ids are folder names; side ids carry `side:` or `root:`; the snapshot maps are separate (model/index.ts:147-148). A side line with `id` set opens a project tab through `openLine` (rows.ts).

   Side subtasks need a `kind`. `''` joins the research "other" heading (CommandCenterView.svelte:100). Any other word is drawn raw as the heading, which for a fixed word like `side` is a literal string, against the catalog rule. "grouped under the side project's label" does not say which.

   Expected: side subtasks under a heading from the catalog or under the parent's label, stated in the brief.
5. **The ticker's sort and labels.** The deadline sort follows `CATEGORIES` (:444), so `side` must go between `task` and `conference`. `GLYPHS` needs `side: 'spark'`. Category sub-headings draw no glyph (CommandCenterView.svelte:171-174); the glyph is on each row.

   The research horizon (`deadline_horizon_days`, :222) is not stated for side deadlines. Expected: a side deadline beyond 90 days is dropped like a paper's.

   `focusLabel(project: Project, ...)` (focus.ts:319) must take a SideProject. Under `focus_label_mode: full` the label is the title, so case 5's "labelled by its short" holds only under the shipped `short` (layout.yml:161). The option's help (options.yml:1182) says "name a project" and stays true.
6. **Text scale and Rice.** Rice changes only `--fs-*` (themes.css:803-809), so the 14 px line holds. At text scale below 1 the button exceeds the 18 px row (Question). Expected: the row does not grow at any scale from 0.7 to 1.6; that needs padding or the line scaled to fit.
7. **The Gallery's Ticker** (Gallery.svelte:247) passes no `onaction`. It shows only the text change, which is enough for case 14 there.
8. **Parked is a literal.** The code must know that `parked` is not live. `side_project_status` has no live flag (vocab.yml:202-206), so the builder will hard-code the word `'parked'` or add a vocab key, which is a config shape. Expected: stated in the brief.
9. **The waiting tally for a parked side project** is not stated. Item 2 counts "its waiting-on values"; Decision 2 says a parked project draws no line.
10. **The apps API** gains the new SideProject fields (docs/apps.md:248), which is a wire-format change not named as a decision.

## ADRs

`grep -n adr .agents/plan.yaml` prints nothing, and `find . -name adr -type d -not -path '*/node_modules/*'` prints nothing. There is no ADR folder.

## Dictated text

- Plan-line quote: python equality prints `True 858 858`. Holds.
- Ruling quote: `grep -c -F` of each of its three fragments in plan.md prints 1. Holds.
- `dlcat_side: side projects`: `grep -n "dlcat_" config/text/views/boards/focus.yml` shows the sibling keys at 25-32, lower case. Holds.
- Glyph `spark`: `grep -n "spark" config/catalogs/glyphs.yml` prints 143 `spark: "*"`. Holds.
- Test title 'writes a side project's field and its subtask lines and nothing else' contains no history words. Breaks the spec's "one test per unit" (Cases).
- CSS `calc(18px * var(--text-scale, 1))`, `calc(14px * var(--text-scale, 1))`, `padding: 1px 6px` and weight 400 hold as values. Decision 4's "the row stays 18 px when it shows" is false below text scale 1 (`grep -n "Math.min(1.6, Math.max(0.7" src/lib/state/workbench/ui.svelte.ts` prints line 618).
- The grep `grep -rn "five keys\|holds five" src config docs DESIGN.md HELP.md --exclude=local.yml` holds as a command but misses manifests.ts:25, normalise-personal.ts:8 and findings.yml:45.
- Verify 4 bullet 3 "this brief says which it is" is false: no line of the brief says it.
- `LC_ALL=C grep -n '[^ -~]' agents/briefs/D48.md` prints nothing. Holds.

## Declined to judge

- Whether Z746's self-rule choices (a group of its own, parked drawing nothing, the Personal card drawing the six keys) match Axel's intent.
- Whether a literal 18 px row against VS Code's measure is the right parity value.
- Whether new references in hub side manifests (G66) are wanted.

## Usage

abe9a0d14115bbbde, claude-opus-5-5, 276,858 tokens, 122 tool uses, 14.0 min; all reads and greps, nothing written.

## Closed

The orchestrator closed each finding by a change to `agents/briefs/D48.md`; the choices it took are Z748 (self-rule).

Names:
- `findings.yml:43,45` false: item 1 makes both sentences true for every field, and the file is in the write list (lines 43 and 45).
- `manifests.ts:25` and `:356-360`, `hub-names.ts:82`, `config/sources.yml:15`, `docs/configuration.md:41`, `DESIGN.md:552`, `docs/views.md:23`, `docs/apps.md:248`: listed under "What is on the tree", made true by item 6, each in the write list by line; item 6 also asks for the side-project grep after the change. The apps API's new fields are decision 9 (Z748).
- `personal.test.ts:89` (G32): a field the manifest does not hold is left out of the record (item 1), so the test stays true; the file is in the write list and the verify list, with `normalise.test.ts`; case 15 names the test.
- `undo.ts` and `deposit.ts`: item 3 makes the undo reach a side file and names every caller of the changed signatures; both files in the write list.
- The two fixtures: in the write list, only where the type sends the builder.
- `references/build.ts:145` (G66): item 1 states the new references as behaviour; case 16 is its row; `references.test.ts` is in the write and verify lists.
- `static.ts:69` side JSON Schema: item 1 builds the side kind through the manifest translation; `schema/static.ts` and `schema/manifest.ts` in the write list.
- Shared paths with the steps in flight: judged at the path comparison and written into the dispatch entry.
- Line ranges for HELP.md, views.md and DESIGN.md: written by line.

Premises:
1. Line numbers corrected (`FIELDS` 26, `identity` 38-42).
2. `str`/`strings` in `guards.ts`, the import cycle: `followups` and `subtasks` move to the new `normalise-plans.ts` (item 1).
3. `archive_dead`: the claim removed; liveness comes from `live: false` on the `parked` row of `side_project_status` (decision 2, Z748).
4. G32 covers the changed folders: stated under "Guarded entries", its tests in the verify list.
5. G8 at 49-51 and G9 at 52-54, with G9's tests named.
6. Read 8 names the undo tests and `undo.ts`.
7. No related line on the project card: `related` draws as a line headed `personal.related` with project tags (item 4, decision 8, Z748).
8. "No write path" now says no `/api/write` request; the source tab's save is the one write.
9. The Gallery's Ticker draws no button: stated, and case 14 checks the Gallery for the text alone.
10. Line drift corrected (`CATEGORIES` 35, `GLYPHS` 47, `TickerTarget.kind` 91, `SideProject` 804-815).
11. The base copy is made at dispatch, as for every step.
12. The side lookup lives in `writes/manifest.ts`; the ticker's side lines in `state/boards/board/` (item 7).

Cases and checks:
- Case 9 against one test per unit: rewritten as rows of the existing tables of G8 and G9, no new `it`, so no new title for `guarded.md`; the slow table runs alone.
- Case 9's G9 half: rows in `changes.test.ts` and `undo.test.ts`.
- Case 15: reads the worktree's `side-projects/`.
- Case 4: a copy under `$TMPDIR`, against the generator item 1 changes.
- Case 7: rewritten to the research rule (no `after` to the tasks, `after` today to the follow-ups, future nowhere).
- Case 10: the `side:` research id dropped; a `root:` id whose root is no longer served added.
- Case 14: rows 18 px high; scales 0.7, 1 and 1.6.
- The look on a scratch oculus for the writes: named in "What it must do" as a departure, with its reason.

The question:
- Case 2: the finding sentences become true (item 1).
- Case 3: case 3 also reads the imports.
- Case 4: research-shaped values of all eleven keys must validate clean in both kinds.
- Cases 5-8: case 5 adds `categoryLabel('side')` and `openLine` on a side line; item 2 requires both.
- Case 9 for `root:`: a `root:` row in each table; undo rows in the right files.
- Case 12: parked counts nothing.
- Case 13: the related line has its catalog word.
- Case 14: the button is the row's height at every scale (item 5, decision 4).
- The step line's screenshot shows the row size on TEST; the side lines are on the scratch oculus, as "What it must do" says.
- Item 6's grep: item 6 names every sentence and a wider grep.
- Item 7: `SideProject` as a `Pick` of `Project`.
- Verify 2: G32, G9 and G66 tests added.
- Verify 4: the brief says the rows are proofs and no test is an audit.

Implied inputs:
1. The JSON Schema of the side kind: item 1, through the manifest translation.
2. The write side's field types: item 1, `fieldTypes` reads the list form.
3. The root write path: item 3 through `WriteTarget.sideProjects` (decision 10, Z748), the undo, a root no longer served refused, the absolute path in History stated.
4. Ids and a side line's press: item 2 (`openLine` for a side target); the subtasks' heading `dlcat_side` (decision 7, Z748).
5. The sort, the glyph, the horizon and `focusLabel`: item 2 and case 5.
6. Text scale: item 5.
7. The Gallery: case 14.
8. Parked as a literal: `live: false` in the vocabulary (decision 2).
9. The waiting tally for a parked project: item 2 and case 12.
10. The apps API: decision 9.
