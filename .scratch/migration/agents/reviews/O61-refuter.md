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

## Repair round 1, refuted

```
cd .agents/worktrees/migration-O61 (every command below runs here)
git status --short | grep -v .scratch | sed 's/^...//' | xargs npm run test:quick --   (run 1)
test:quick: 134 changed file(s), from the given paths
test:quick: 294 test file(s)
ok      ASCII gate (0.8 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      svelte-check (8.4 s): ... COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (63.6 s)
ok      vitest checks (146.5 s)
FAILED  vitest (183.9 s)   Error: Test timed out in 5000ms.  Test Files 1 failed | 220 passed | 63 skipped (284); Tests 1 failed | 2476 passed | 665 skipped (3142)
ok      vitest slow (210.7 s)
test:quick: 213.0 s; failed: vitest
same command (run 2, to name the failing file; vitest passed this time)
FAILED  vitest slow (328.6 s)
 FAIL  |unit| tests/server/machine/pty/sessions.test.ts > a private tmux server > starts, lists, feeds, resizes, captures and stops a terminal
Error: timed out waiting for the typed line to come back as output
 Test Files  1 failed | 77 passed (78);  Tests  1 failed | 664 passed | 194 skipped (859)
test:quick: 330.4 s; failed: vitest slow
(npm run format and npm run diagrams not run: both write)
ASCII gate of spec.md (perl form) over the 133 changed paths that exist: prints nothing, exit 0; LC_ALL=C grep -c '[^ -~]' O61-report.md: 0
wc -l over every changed file: over the limit only docs/diagrams/writes.dot 1151, writes.svg 3895, docs/templates.md 1330 (documents, over at base); ls src/lib/data/model: 10; ls tests/data/snapshot: 9
diff <(sh utils/unused-exports.sh) ../migration-O61-base/unused-exports.txt: only typeCounts -> stageCounts (graph.ts) and TypeCount -> StageCount (board/index.ts)
grep 6: only non-vocabulary lines (vocab.yml:71,:76 labels; "not applied" sentences of findings.yml, port.ts, workspace-layer.ts, text-edits.ts, hub-names.ts:357, data-map.md:80, decorations.svelte.ts; under_review_at/unset; Electron and git canceled; form-draft.test.ts; schema-rules.test.ts inputs)
grep 7: only typeWords of repositories.ts, schema/check.ts, literature/words.ts, Head.svelte, LiteratureCard.svelte (other things); grep -rnE "\btypes:" config/catalogs/vocab.yml: exit 1
ruling 1 grep, grep -rn --exclude=local.yml -i "contradict\|terminal_live\|live_chips\|tier and type" src docs config tests: only config/catalogs/latex.yml:647 and tests/state/system/apps/store-cache.test.ts:3,105,252 (unrelated)
ruling 2 sweep, added comment lines over 100 columns in git diff 282f3c2a -U0 -- src tests, plus tier-stage.test.ts whole: none (the config/ hits are one-line YAML comments, the convention; base vocab.yml holds 40 such lines)
ruling 3: grep "[^a-zA-Z]statusWords" src tests docs: only navigation/status.ts:422 and routes/+page.svelte:28,204; projectStatusWords at tones.ts:251, LaneCard.svelte:33,81, Projects.svelte:83,224
ruling 4: grep -rn stageLabel src tests docs config --exclude=local.yml: exit 1
round history grep over the round's added lines (snapshot diff, and the base diff of config/options/sources.yml and Audit.svelte): no hit
npx vitest run schema-rules.test.ts writes.test.ts tier-stage.test.ts config-folder.test.ts: Test Files 4 passed (4); Tests 113 passed | 2 skipped (115)
round delta: diff -u of the 132 files.txt paths: 21 changed (docs/diagrams/writes.dot, .svg, model/index.ts, vocab.ts, deck/groups.ts, deck/kinds.ts, audit/projects.ts, audit/rules.ts, presets.ts, stats.ts, focus-lanes.ts, tones.ts, rail-badges.ts, present Grid, Legend, Project.svelte, LaneCard, Projects.svelte, CardStatus, ProjectCard, config-folder.test.ts); outside files.txt: config/options/sources.yml, src/lib/views/system/audit/Audit.svelte, .scratch/migration/agents/spec.md (see Declined)
```

The two vitest failures are in test files the step does not change (`tests/server/machine/pty/sessions.test.ts`, and run 1's unnamed 5000 ms timeout, which did not recur in run 2), so they are not counted.

### Verdicts

Items of the brief's "What to build":

- 1: holds. 21 rows in ruling 219's order with label, icon, colour, group flags, the flags of ruling 243 and the moved flags (`config/catalogs/vocab.yml:65-85`). Each colour follows item 1's rule: `submitted` keeps its type row's `#0ea5e9`, and `submit-ready` takes `#ea580c`.
- 2: holds (`vocab.yml:90-99`, `manifest-schema.yml:37`).
- 3: holds (`vocab.yml:101-117`).
- 4: holds. `hub-names.ts:384-385` adds `chips` and `lead_statuses`, and `data/sources/documents/feeds.ts` runs `leadStatusFindings` over `lead_statuses`.
- 5: holds. Grep 6 shows only non-vocabulary lines, and `layout.yml:322` matches `[in-prep, submitted]`.
- 6: holds. A board card now draws the stage chip with its label and glyph (`ProjectCard.svelte:348-354`), filled in the stage colour that item 1 gives. The statement of that fill change is Finding R1.
- 7: holds. S1 is closed: `audit/projects.ts:1-6`, `Audit.svelte:19-24`, `model/index.ts:354-357` and `config/options/sources.yml:15` are now true, ruling 1's grep finds only unrelated lines, and grep 7 is clean.
- 8: holds (`validate.ts:287` `checkStageChips`, `:308` `withoutStageChips`, called at `data/index.ts:441`; grep 7).
- 9: holds.
- 10: holds (schema-rules rows green).
- 11: holds (`git diff 282f3c2a -- config/defaults/layout.yml`: in-flight words, idea words, `paused` group, `software` out of `outputs`).
- 12: holds. The demo fixtures read as the eight rewrite cases below.
- 13: holds. `docs/diagrams/` was not regenerated by me (see Declined).
- 14: holds. The rows are green, and their first run on the unchanged tree is quoted in the report; I did not rerun it.

Cases of the brief's "Cases":

- robust-embeddings: met (`stage: submitted`, `chips: []`).
- graph-transfer: met (`stage: submit-ready`, `chips: []`).
- tensor-sketch: met (`stage: exploring`, `chips: []`).
- demo-toolkit: met (`stage: finished`, `chips: []`).
- bench-suite and tensorkit: met (`stage: finished`, no `status:`).
- sparse-attention: met (`stage: active`, `chips: [blocked]`).
- spectral-clustering-collab: met (`stage: published`, `form: journal`, `[coauthor]`).
- early-benchmark: met (`stage: published`, `form: conference`, `[lead]`).
- C1: met, from the probe run under ruling 262 and by reading `vocab.yml:76` and `focus.ts:89,114`.
- C2: met (`stats.ts:91`, `vocab.yml:74` `#ea580c`).
- C3: met, by reading.
- C4: met, by the schema-rules row 'a stage word or a form as a chip...' and grep 7.
- C5: met, by reading the group flags and the probe's demo count of 5 before and 7 after.
- C6: met (`vocab.yml:230-241`, probe).
- C7: met, by reading and the probe.
- C8: met (schema-rules rows).
- C9: met (`default_application` on `not-applied`).
- C10: met, by the writes.test.ts row, `vocab.yml:67` `nascent` with `new_idea`, and the probe.
- C11: met (`fund_stages`, `layout.yml:322`).
- C12: met (`layout.yml` groups, probe).
- C13: not verifiable here. The option sources read correctly, and the look on TEST at landing settles it.
- C14: met by reading (`ProjectCard.svelte:348-354`, `CardStatus.svelte`), with the look at landing. Finding R2 bears on how the glyph's colour is described.
- C15: not verifiable. No fixture holds two stage chips; the landing rewrite of ruling 247 applies it.
- C16: met (`HUB_LIST`, probe).
- C17: met (`lines.ts:116`, probe).
- C18: met (`rules.ts:186`, probe).
- C19: met (schema-rules empty-list rows).
- C20: met, by reading and the probe.
- C21: met (writes.test.ts 'no stage' row).
- C22: met (`deck/groups.ts`, `deck/read.ts:400`, `parts/Grid.svelte:42` through `chipLabel`).

### Findings

The four round claims re-checked by rerun or by reading:

- S1, ruling 1: closed. The builder's reading of the tree is right.
  - The stage-word-as-chip rule exists only in the manifest check: `checkStageChips` (`validate.ts:287`) is called at `validate.ts:481`. Its texts `chip_is_stage` and `chip_is_form` are referenced only from `validate.ts` and `findings.yml:282-283`; no file under `src/lib/server/content/audit/` names them.
  - `audit/scan.ts:6-10` says the audit does not repeat what `data/snapshot/validate.ts` reports, and `audit.findings_note` says the same for "an unknown chip".
  - So a head comment listing that finding among the audit's checks would be false. The new comments name it as the manifest check's finding, drawn in the Findings view. That keeps ruling 1's purpose (a reader of the audit learns where the finding lives) without the false sentence.
  - The two remaining rules named in the comments match `guardrails` (`projects.ts:371-414`).
- S2, ruling 2: closed by my sweep.
- S3 and S4, rulings 3 and 4: closed by their greps.
- P2, ruling 7: closed. Every file outside the write list is named with why, and the `layout.yml` and `hub-names.ts` hunks sit inside their listed ranges.

No closure removes a check. No fix reaches beyond its finding: the `Grid`, `Legend` and `Project.svelte` edits are the callers of the removed `stageLabel`, and `options/sources.yml` and `model/index.ts` are hits of ruling 1's grep.

- R1 (behaviour), `ProjectCard.svelte:348-354` with `board/items.ts:115` `tone: stageTone(project.stage ?? '')`, and `views/shared/graph/node-tone.ts` `stageTone(node.stage ?? '')`.
  - What is wrong: the card's fill changes colour for every project whose stage comes from a chip, or whose type left the vocabulary. The report states this only as two rows of ruling 5's table (round section "5. B1"). It never names it as a behaviour change, gives no list per stage word, and its first section ends "Nothing in the brief was found wrong or impossible".
  - The answer to the two questions:
    - The fill is what items 6 and 1 ask for: the card is filled with "the stage's label and colour of item 1", and item 1 gives `submitted` its type row's `#0ea5e9` (base `types: submitted: { color: "#0ea5e9" }`).
    - Decision 1's clause "in the colour its projects carry today" does not hold for these projects, and no colour rule could make it hold. At base a card's fill came from the type (`typeTone(project.type)`), so a `type: active` project with the chip `submitted` was orange and a `type: submitted` project was sky. After the rewrite both are `stage: submitted`, and one stage has one colour.
    - Ruling 264 (a), "a stage word has one colour, the card's fill and its status mark alike", accepts the fill following the stage colour. Its list of changed hues names marks only.
  - Concrete changes on the demo hub:
    - robust-embeddings: filled "active" `#ea580c` becomes filled "submitted / under review" `#0ea5e9`.
    - tensor-sketch and online-clustering: filled "idea" `#7c5cff` becomes filled "exploring" `#f59e0b`.
    - bench-suite, tensorkit and demo-toolkit: filled "software" `#0d9488` becomes filled "finished" `#16a34a`.
    - The same tones apply to their Map nodes (`node-tone.ts`).
    - On the hub, every `type: active` project with an in-flight stage chip other than submit-ready changes from orange: in-prep `#a16207`, building `#d4a017`, running `#16a34a`, revision `#b45309`, accepted `#2563eb`, de-risking `#16a34a`, exploring `#f59e0b`.
  - Failure scenario: at the look on TEST the orchestrator reads the card fills against a report that names two rows and says nothing in the brief was wrong. Most cards on the Projects board change colour with no line saying so, and Axel's ruling 264 is booked as covering marks only.
  - Verdict: none (item 6 holds). This is for the landing report: state the fill changes per stage word, and say that decision 1's clause cannot hold for projects whose stage came from a chip.
- R2 (behaviour), the round's "5. B1" table, after cell "filled chip 'submitted / under review' with the `brown` glyph in the tone of `#0ea5e9`".
  - What is wrong: on a filled chip the text, and with it the glyph, is drawn in `var(--on-tone)` (`Chip.svelte` `.chip.filled { background: var(--tone); color: var(--on-tone) }`). By reading, `Glyph.svelte` sets no colour of its own, so the mark takes the chip's text colour. The base outline "submitted" chip drew the mark in `#b45309`'s text tone. After the change the board card shows the glyph's shape over a sky fill in the on-tone colour, not a brown mark. Lane cards and the Projects list still colour the mark through `statusMarkTone`.
  - Failure scenario: the look reads ruling 5's "a submitted project its brown mark" and the report's cell, and judges a white-on-sky mark as a regression or as the asked-for result with no basis.
  - Verdict: none (C14 met by reading). This is a report precision fix for landing.
- R3 (standards), `src/lib/views/shared/card/project/CardStatus.svelte:2`, "// Layer 3, shared view. The status marks of a project card: the project's form, then its".
  - What is wrong: the head comment rewritten in the round ends 93 columns into a sentence, and the next word "chips," fits within 100. `agents/spec.md`, What every package obeys: "rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short".
  - Failure scenario: a reader of the file meets a ragged paragraph, and a later sweep for short lines flags a comment the step wrote.
  - Verdict: none. A small fix at landing.

### Declined to judge

- `.scratch/migration/agents/spec.md` is modified in the worktree (`git status --short`: ` M`). Its content equals the main checkout's `spec.md` (`diff -q`: same), which holds rulings 262 and 263. The builder's report does not name it. The untracked `O61-round1.md` and `O61-report.md` copies equal main's too. Who wrote `spec.md` there is not settled by the three git commands allowed to me. A builder may not edit `.scratch/`, so the landing should leave `.scratch/` out of the cherry-pick or confirm it equals main.
- Ruling 264 (a) lists the mark hues of submitted, in-prep, published, exploring, submit-ready, nogo, disproved, abandoned and dropped. The report's table also, correctly, shows `finished` changing from `#0ea5e9` to `#16a34a` (base `statuses: finished` `#0ea5e9`). Whether 264 covers `finished` is for Axel to confirm; the "one colour" wording suggests it does.
- I did not rerun the probe source quoted under ruling 262: rerunning it means writing the file, which this review may not do.
- I did not rerun the first run of the item-14 rows on the unchanged tree, for the same reason.
- `docs/diagrams/` was not checked against a fresh `npm run diagrams`, since that command writes. The round's change to `writes.dot` and `writes.svg` is only the line numbers of `vocab.ts` moving by 2, which matches the rewrap of `chipWord`'s doc comment.
- I did not count how many times the builder ran the verify list; the report says once, and no command can confirm it.
- C13 and C14 on screen are for the look on the TEST page at landing.
- `config/text/views/system/audit.yml:13` `empty` still says "no status chip out of place". This is not false: the manifest section still holds the author-chip rule. Whether to reword it is outside the round's rulings.
- I wrote one file, a list of changed paths, in my session scratchpad outside the repository; nothing in the repository or the ledger was written.

Reviewer usage: a0a3962a17cebf0fb, claude-opus-5-5, 252149 tokens, 69 tool uses, 21 min 59 s.
