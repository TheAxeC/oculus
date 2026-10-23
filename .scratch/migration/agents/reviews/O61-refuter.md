# Step O61 refuter report (on .agents/worktrees/migration-O61, base 282f3c2a)

## Verification (rerun by the reviewer)

1. `npm run test:quick -- <the 131 changed paths, passed through xargs>` (no `npm run format`, no `npm run diagrams`: both write). Printed:
   - `test:quick: 131 changed file(s), from the given paths`, `294 test file(s)`
   - `ok prettier`, `ok svelte-kit sync`, `ok ASCII gate`, `ok eslint`, `ok svelte-check` (`537 FILES 0 ERRORS 0 WARNINGS`), `ok vitest checks`
   - FAILED vitest: `Error: [vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts. Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond`; `Test Files 220 passed | 63 skipped (283)`; `Tests 2469 passed | 665 skipped (3134)`
   - FAILED vitest slow: `tests/.../svelte-trust.test.ts` two rows, `AssertionError: expected false to be true` at `:119:38` and `:143:38`; `recover/runs.test.ts` `Test timed out in 30000ms` at `:231:5`; `Test Files 2 failed | 76 passed (78)`; `Tests 3 failed | 662 passed | 194 skipped (859)`
   - `test:quick: 369.1 s; failed: vitest, vitest slow`
   html.dom.test.ts, svelte-trust.test.ts and recover/runs.test.ts are not in the step's diff, so under spec.md these reds are not the step's and were not rerun.
2. The ASCII gate of the brief (verify 3), `LC_ALL=C perl -ne '...' <every changed file>`: printed nothing, exit 0.
3. `wc -l` over the changed files (verify 4): over 880 only `docs/diagrams/writes.dot` 1151, `docs/diagrams/writes.svg` 3895 and `docs/templates.md` 1330, all documents and all over at base. `src/lib/data/model/model-entities.ts` 880, `src/lib/data/model/index.ts` 852 (base 883). `ls src/lib/data/model` 10 items, `ls tests/data/snapshot` 9 items.
4. `sh utils/unused-exports.sh` compared with the base list (verify 5): the only differing lines are `typeCounts` -> `stageCounts` (`structure/graph.ts`) and `TypeCount` -> `StageCount` (`board/index.ts`), renames of lines already on the base list; no new export.
5. Verify 6 grep (`in prep|under review|not applied|not attending|\bcanceled\b`): only non-vocabulary lines (the labels "in preparation" and "submitted / under review", prose sentences with "not applied", `under_review_at`, Electron and git `canceled`, a form-draft test, the schema-rules inputs that test the spaced variants). Matches the report's list.
6. Verify 7 grep: prints `typeWords` lines in `repositories.ts`, `schema/check.ts`, `literature/words.ts`, `LiteratureCard`, `LiteratureHead`; these are an unrelated identifier that contains the substring `typeWord`, not the project field. `grep -rnE "\btypes:" config/catalogs/vocab.yml` printed nothing. Old names (`typeCounts`, `hiddenTypes`, `statuses.chip`, `chip: true`, `vocab.types`): nothing.
7. Item-14 rows in the worktree (`npx vitest run tests/data/snapshot/schema-rules.test.ts tests/server/edit/writes.test.ts`): `Tests 13 passed | 66 skipped (79)`.
8. The files the report reran alone, rerun: html.dom 8 passed, app-manage 23, order 13, clone-after 11, hub-portfolio 16. All match the report.
9. Premises read on base with `git show 282f3c2a:<path>`: `vocab.yml` 264 lines, `vocab.ts` 317, `vocab-keys.ts` 144, `manifest.ts:669-670`, `card.ts:167`, the `focus.ts` lines the brief names. All hold.

## Verdicts

Items:
1. holds (21 rows in ruling 219's order; labels, icons, colours, group flags, 243 flags and moved flags read row by row in `config/catalogs/vocab.yml:65-85`; `submit-ready` `#ea580c`).
2. holds.
3. holds.
4. holds.
5. holds.
6. holds as the brief words the drawing ("its stage drawn by its label"); see Behaviour B1 and B2 for the visible changes it leaves.
7. violated (Standards S1: two head comments still describe the removed audit rule in terms of "type").
8. holds in code; its stale descriptions are S1.
9. holds.
10. holds.
11. holds.
12. holds.
13. holds.
14. holds (rows present and green in the worktree; the base-tree first run is not rerunnable without writing, see Declined).

Cases:
- C1 met (read: `pausesCountdown` and `deadline_met` on the `submitted` stage row, `card.ts` caller, Focus tally).
- C2 met (read: `submit_ready` on stage row, stats count; colour `#ea580c` = `active`).
- C3 met (read).
- C4 met (read: `checkStageChips`, `withoutStageChips` in `data/index.ts`; texts `chip_is_stage`, `chip_is_form`; `terminal_live`, `contradictory_chips` gone).
- C5 met (read; report gives Projects tab 5 before, 7 after).
- C6 met (read: `publication_kinds` rows).
- C7 met (read).
- C8 met (schema-rules table rows pass).
- C9 met (read: `default_application` on `not-applied`).
- C10 met (writes.test.ts row passes).
- C11 met (read: `fund_stages`, `layout.yml:322`).
- C12 met (read: `layout.yml` groups).
- C13 not verifiable (on screen at landing; options sources read and correct).
- C14 met by reading (`ProjectCard.svelte:348` filled stage chip with label and stage tone; `CardStatus.svelte:18-19` form and chips with glyph); on screen at landing.
- C15 not verifiable (no fixture carries two stage chips; the rule is applied to the hub at landing).
- C16 met (read: `HUB_LIST` gains `chips`, `lead_statuses`).
- C17 met (read).
- C18 met (read).
- C19 met (schema-rules empty-list rows pass).
- C20 met (read: no code reads `type:`; schema findings).
- C21 met (writes.test.ts 'no stage' row passes).
- C22 met (read: `deck/read.ts`, `kinds.ts`, `groups.ts`, `spec.ts`).

## 1. Spec

P1. A scratch probe script was written without a Rulings approval, and into the worktree. Report line 26: "The cases ran as a scratch probe (`tests/o61-probe.test.ts`, copied into a copy of the base tree with `node_modules` linked ... then removed)", and line 155: "Probe after the last change (`npx vitest run tests/o61-probe.test.ts ...` in the worktree, then removed)". The brief's "Paths this step writes" says "No script is written for this step ... other than a script the step builds under 'What to build'. Any other script needs the user's approval ... quoted from a line of `plan.md`'s Rulings", and spec.md puts scratch files in the scratchpad, never a worktree. Failure scenario: the evidence for every probe-based row of the report's item table (items 1-9, 11) and for the item-14 moved flags (`pauses_countdown`, `deadline_met`, `submit_ready`, `blocked`) rests on a file that no longer exists, so no reviewer or landing can rerun it; a probe left in the worktree by an interrupted run would also be picked up by the cherry-pick. Makes the item-14 clause "named in the report as a case checked by a run" rest on an unreproducible run.

P2. Files outside the write list are not named with why. `config/defaults/sources.yml:9` and `config/options/appearance.yml:8` (comment edits, "project types" -> "project stages") appear only in the list at report line 96 under "Files ruling 252's rename changed". The brief: "a file the work reaches outside them is named in the report with why". Likewise the files under "any other file under `src/`" (`data/sources/manifests.ts`, `server/content/audit/scan.ts`, `server/content/deck/read.ts`, `state/boards/project-context.ts`, `state/workbench/palette.ts`, `ui/controls/Chip.svelte`, `views/academic/present/Slide.svelte`, `views/shared/graph/Nodes.svelte`, `views/shared/links/CrossLinks.svelte`, `views/structure/map/Map.svelte`, `views/structure/pillars/ArchivalCard.svelte`) are named at line 100 without "what it reads" as the brief asks for that clause. Failure scenario: the orchestrator cannot tell from the report which of these files reads a moved flag and which only had a word renamed, so a landing read of them is unguided. Spec partial, no item verdict changed.

P3. `tests/data/snapshot/tier-type.test.ts` is renamed `tier-stage.test.ts` and the describe in `manifests.test.ts` is renamed to "the scan and the manifest's own tier and stage"; `agents/guarded.md` G32 still names the old test title. Ledger file, orchestrator's to update at landing.

## 2. Proof

R1. The verify list ran three times (report line 200: "The list ran three times ... The second run was stopped by the pause and gave no result"). The brief allows one run plus one after a fix in a changed file. The second run is attributed to the pause, so this is noted, not counted as a defect of the work.

R2. The report's case results for C1-C22 are quoted from the probe (P1). I checked each case by reading the code path or by the rows that exist (verdicts above); the probe's own `Tests 21 passed (21)` cannot be reproduced.

## 3. Standards

S1. Stale head comments now false (item 7 violated). `src/lib/server/content/audit/projects.ts:3`:
```
// tier standard names, a status chip the project's own tier and type contradict, a field long
```
and `src/lib/views/system/audit/Audit.svelte:20`:
```
    // standard does not name, a status chip the project's own tier and type contradict, a field
```
The rule they describe (`contradictory_chips` / `terminal_live`) is removed by item 8, and the brief's item 7 says "every comment ... says stage". Failure scenario: a reader of the audit module or view looks for a contradiction check that no longer exists; the new stage-word-as-chip finding (item 8) is not described anywhere in either head comment.

S2. Added comment lines over 100 columns, not rewrapped (spec.md wraps comments at 100): `src/lib/data/shapes/catalog-files/vocab.ts:89` (102), `src/lib/data/sources/deck/groups.ts:54` (102), `src/lib/data/sources/deck/kinds.ts:40` (104), `src/lib/server/content/audit/rules.ts:36` (101) and `:51` (101), `src/lib/state/boards/board/presets.ts:120` (102) and `:186` (101), `src/lib/state/boards/board/stats.ts:121` (101), `src/lib/state/boards/focus-lanes.ts:89` (108), `src/lib/state/workbench/rail-badges/rail-badges.ts:94` (101), `src/lib/views/academic/present/parts/Project.svelte:21` (104), `src/lib/views/shared/card/project/CardStatus.svelte:3` and `:4` (101 each), `tests/checks/config/config-folder.test.ts:688` (103). Command: an awk pass over `git diff 282f3c2a -U0 -- src tests config` printing added comment lines longer than 100. Prettier does not rewrap comments, so `ok prettier` does not cover this.

S3. Export name collision. `src/lib/state/shared/words/tones.ts:256` adds `export function statusWords(stage, form, chips)`, while `src/lib/state/workbench/navigation/status.ts:422` already exports a different `statusWords`. The report quotes no reuse or name grep for the new export. Failure scenario: an auto-import in an editor picks the wrong module and the type error points at the call, not the import.

S4. `src/lib/state/shared/words/tones.ts:247-249`:
```
export function stageLabel(stage: string): string {
    return chipLabel(stage);
}
```
A second name for `chipLabel` that adds nothing; its only caller is `ProjectCard.svelte:348`. Minor.

## 4. Behaviour

B1. The stage glyph is no longer drawn on a board card but is still drawn on a lane card and a Projects list row. `ProjectCard.svelte:348` draws `<Chip label={stageLabel(item.project.stage)} tone={item.tone} filled />` with no glyph, and `CardStatus.svelte:18-19` draws `item.chips`, which is `[form, ...chips]` (`board/items.ts`), so the stage word is not among them. `statusWords` (`tones.ts:256-262`) puts the stage first when its row has a glyph, and LaneCard and the Projects list draw through it. Failure scenario: a project that today carries the `submitted` chip shows the brown glyph on its board card; after the rewrite to `stage: submitted` its board card shows only the filled "submitted / under review" chip, while the same project in Focus lanes still shows the brown glyph. Item 6's "so a project shows the words and glyphs it shows today" is not met on board cards; the brief's own clause "its stage drawn by its label" and C14 allow this reading, so I leave item 6 at holds and raise the inconsistency for the C14 look at landing.

B2. Status-mark hues of stage words change, and the report does not list them. `tones.ts:231-235` `statusMarkTone` now returns `stageTone(word)` for any word with a stage colour, where the base took the `statuses:` palette colour. From `git show 282f3c2a:config/catalogs/vocab.yml` against the worktree's: `submitted` `#b45309` -> `#0ea5e9`, `in-prep` `#7c5cff` -> `#a16207`, `published` `#0ea5e9` -> `#16a34a`; words whose mark took its icon hue (exploring, submit-ready, nogo, disproved, abandoned, dropped) now take the stage colour (exploring `#f59e0b`, dropped `#9ca3af`, submit-ready `#ea580c`). Failure scenario: on Focus lanes and the Projects list, a submitted paper's mark turns from amber to sky blue with no line in the report saying so; a user-visible colour change the brief did not ask for is a decision to surface. No item verdict changed; raise to the orchestrator for the landing look.

B3. Saved view state keyed on the old names resets: the board's `hiddenTypes` is now `hiddenStages` (`board/state.ts`) and the Map's saved filter key is `stages`. A user's hidden stage toggles and Map filters return to defaults once. The report states this (line 216 area); listed so the landing note carries it.

B4. The Projects board gains the `paused` group and the demo Projects tab count goes from 5 to 7 (report line 19). As the brief asks; listed for the landing look.

## Declined to judge

- The probe `tests/o61-probe.test.ts` runs (before and after): rerunning needs writing the file, which this review may not do.
- `npm run format` and `npm run diagrams`: both write. `docs/diagrams/` changes are taken as regenerated, not checked against a fresh run.
- The first run of the item-14 rows on the unchanged tree (report: `12 failed | 1 passed`): needs the new tests written into a base copy.
- The real-hub `integrity.test.ts` block: skipped without `OCULUS_TEST_HUB`.
- C13 and C14 on screen: the orchestrator's look on the TEST page at landing.

Reviewer usage: a808f3fdfae84a0f5, claude-opus-5-5, 109966 tokens, 90 tool uses, 29 min 55 s.
