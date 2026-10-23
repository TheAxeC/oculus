Everything in the brief is done

# O61 report: one home for each vocabulary word

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 `stages:` | DONE | `config/catalogs/vocab.yml:65`; probe C5, C13 after |
| 2 `forms:` and `form:` | DONE | `vocab.yml:90`, `manifest-schema.yml:37`; probe C13, C14 |
| 3 `chips:` | DONE | `vocab.yml:101`; probe C3, C7, C13 |
| 4 `statuses:` and `lead_statuses:` | DONE | `vocab.yml:119`, `:172`, `hub-names.ts:385`; probe C7, C16 |
| 5 one spelling | DONE | probe C8, C9, C11; verify grep 6 |
| 6 readers | DONE | probe C1, C2, C3, C10, C12, C17, C18, C22; the item-14 rows |
| 7 the rename | DONE | verify grep 7; probe C20 |
| 8 the audit | DONE | probe C4; `schema-rules.test.ts` row 'a stage word or a form as a chip' |
| 9 `publication_kinds` | DONE | probe C6 |
| 10 the closest word | DONE | `vocab-keys.ts:170`; table 'a status outside its vocabulary names the closest word' |
| 11 the boards | DONE | probe C12; demo Projects tab 5 before, 7 after |
| 12 fixtures and tests | DONE | the tables below; every changed test file run |
| 13 documents | DONE | `docs/HELP.md`, `docs/data-map.md`, `docs/templates.md`, `docs/apps.md`; `npm run diagrams` |
| 14 tests | DONE | first runs quoted below; rows green after |

## First run of every case on the unchanged tree

The cases ran as a scratch probe (`tests/o61-probe.test.ts`, copied into a copy of the base tree with `node_modules` linked, run with `npx vitest run tests/o61-probe.test.ts --silent=false --reporter=verbose`, then removed). Result: `Tests  18 failed | 3 passed (21)`. The output line of each case, unchanged tree:

- C1: `{"due":{"label":"project.card.due_days(3)","tone":"amber"},"onTicker":true,"venues":[]}` (failed: the countdown runs, the deadline is on the ticker, Focus counts no submitted work, since `stage:` is no field the base reads).
- C2: `{"submitReady":0,"tone":"grey","active":"orange"}` (failed).
- C3: `{"blocked":true,"groups":[["work",true]],"line":{"kind":"blocked","text":"blocked (external)"}}` (passed: `blocked` is read from the chips on both trees).
- C4: alpha `["stage: key stage is not declared by the schema of this file","type: key type is required"]`, beta the same, audit `["terminal (published) but still carries the live chip ['numbers-pending']: stale; clear it or re-open the project","contradictory status chips `submit-ready` + `blocked`"]` (failed).
- C5: groups `{}`; `{"inFlight":0,"cross":["work"],"unplaced":0,"demoProjectsTab":5}` (failed).
- C6: p1, p2 and p4 give no finding; p3 `hub type `submitted` expects ['papers-in-preparation']`; p5 `expects ['thesis']`; p6 `expects ['journal', 'other-publications']` (failed).
- C7: `{"statusFindings":[],"tone":"amber","talkOnTicker":false,"grantOnTicker":false,"grants":["Grant"],"lead":[true,true],"chip":["blocked (external)","purple"]}` (passed).
- C8: `["entries[2].status: status \"In Prep\" is not one of the status vocabulary"]` (failed: `not applied` and `canceled` are words of the base vocabulary, and the one finding names no closest word).
- C9: `{"title":"A lead","status":"not applied"}` (failed).
- C10: `"id: new-idea\ntier: projects\ntype: idea\n...status:\n  chips: [nascent]\n..."` (failed).
- C11: `{"placed":[["In prep",["G1"]],["Submitted",["G2"]]],"match":["in-prep","in prep","submitted"]}` (failed on the match).
- C12: `{"a":"","b":"","c":"","d":"","e":""}` (failed).
- C13: `{"stages":null,"forms":null,"chips":["submit-ready","submitted",...,"journal","conference","thesis","abstract","poster"],"types":["active","published",...]}` (failed).
- C14: `{"label":null,"tone":"gold","journal":["journal article","journals"]}` (failed: no `stageLabel`).
- C15: no fixture of oculus holds two stage chips (`grep -rnE` for a chips list with two stage words over the base `tests/` prints nothing); the rule is the landing rewrite's (ruling 247).
- C16: all four keys refused: `["chips: key chips is not one the hub's settings file takes; it is not applied","lead_statuses: ...","stages: ...","forms: ..."]`, `"chips":[]`, `"leadStatuses":[]` (failed).
- C17: `[true,true]` (failed: a `stage: submitted` member does not wake the card).
- C18: `[]` (failed).
- C19: `no closestWord` (failed).
- C20: `{"said":[],"type":"active"}` (failed: the base reads `type:` with no finding).
- C21: `"id: new-idea\ntier: projects\ntitle: New\n...chips: [nascent]..."` (passed: no `stage:` and no `type:` line, the chip written).
- C22: `[{"name":"A","desc":""},{"name":"B","desc":""}]`, drawn `[["A",""],["B",""]]` (failed: `stages:` in a `find:` is not read, so both decks are found, with no maturity).

## What changed, per item

1. `config/catalogs/vocab.yml:65-88` `stages:` holds the 21 words in ruling 219's order, each with `label`, `icon` (none for idea, active, archived), `color` and the flags of the item; the head comment above it says what each flag decides. `stageWord` in `src/lib/data/shapes/catalog-files/vocab.ts:30` describes each field. `tiers` carry `stage_folders` (`vocab.ts:166`).
2. `vocab.yml:90-99` `forms:` (six words, `label` and `icon`); `formWord` at `vocab.ts:86`; the manifest field `form` in the Core section of `config/schemas/manifest-schema.yml:37`, beside `stage` at `:36`.
3. `vocab.yml:101-117` `chips:` (blocked with `blocked`, results-positive, admin-prep, numbers-pending, ai-tells, lead, coauthor); `chipWord` at `vocab.ts:92`; `status.chips` reads `vocab.chips` (`manifest-schema.yml:42`).
4. `vocab.yml:119-170` `statuses:` keeps every entry word with its colour and entry flags only; `vocab.yml:172-179` `lead_statuses:` (declined, applied, closed, dismissed, open) with the lead flags; shapes `statusWord` (`vocab.ts:105`) and `leadStatusWord` (`vocab.ts:134`). `HUB_LIST` gains `chips` and `lead_statuses` (`src/lib/data/helpers/hub-names.ts:384-385`); `docs/data-map.md:80` says 27 keys; the config.yml template in `docs/templates.md` holds both blocks.
5. The spaced variants and `canceled` are gone from `statuses:`; `default_application` sits on `not-applied`; `fund_stages` reads `[in-prep]`, `[submitted, under-review]`, `[planned]` (`vocab.yml:204`); `config/defaults/layout.yml` counts `funding: { match: [in-prep, submitted] }` and its head comment names the violet `statuses` gives `in-prep`; `docs/templates.md` writes `not-applied`.
6. The readers, listed in the next section. The new-idea write (`src/lib/server/edit/writes/manifest.ts:669-680`) writes `stage:` as the first stage carrying `new_idea` and `chips: []`, and no `stage:` line when no stage carries it. Option sources `project_stages`, `project_forms`, `status_chips` (`catalog-words.ts:59-62`, `catalog/options.ts:483-548`, `catalog/schemas/references.ts:33-36`). Drawing: `ProjectCard.svelte:348` draws the stage chip with `stageLabel`; `CardStatus.svelte` draws the form and the chips; `LaneCard.svelte` and the Projects list draw `statusWords(stage, form, chips)` (`tones.ts:256`); the Map legend and controls, Present (`Slide.svelte`, `parts/Project.svelte`, `parts/Grid.svelte`, `parts/Legend.svelte`) and the Gallery (through `chipKeys`, whose legend `setVocab` builds from `stages`, `forms` and `chips`, `tones.ts:94-111`) follow. Board groups match `[stage, form, ...chips]` (`presets.ts` `bucketOf`); the facet that offered the chips offers the form beside them (`items.ts`, `BoardItem.chips = [form, ...chips]`). The deck reads maturity from `project.stage` (`deck/read.ts:400`, `kinds.ts:216`), a `find:` takes `stages:`, `forms:` and `status:` (`deck/spec.ts:19-24`, `deck/groups.ts` `keeps`).
7. The rename: the files are listed below. `src/lib/data/model/model-entities.ts` `stage?` and `form?`; `normalise.ts` `stage: str(manifest.stage), form: str(manifest.form)`; `docs/apps.md` `stage?`, `form?`; `typeTone` is `stageTone`; the form label "Stage" (`manifest-schema.yml:36`); the Projects board's stage toggles (`board.stage_toggle_tip`), the Map's stage filters (`map.stages`, `map.all_stages_tip`). No code reads `type:` from a manifest (probe C20 after: `"type: key type is not declared by the schema of this file"`).
8. `terminal_live`, `contradictory_chips`, `liveChips`, `contradictory`, `chipPairShape`, `lifecycle.live_chips` and `lifecycle.contradictory_chips` are gone with their texts (verify grep 7). `projects_published` reads the stage (`audit/projects.ts:396`, text `audit.msg_projects_published` saying the stage). The manifest check `checkStageChips` (`src/lib/data/snapshot/validate.ts:287`) gives one finding per stage word or form in `status.chips`, texts `findings.validate.chip_is_stage` and `chip_is_form` (`config/text/findings.yml:282-283`); `withoutStageChips` (`validate.ts:308`, called in `data/index.ts`) keeps the schema's own finding for that chip out.
9. `publication_kinds` rows (`vocab.yml:230-241`) read `stages` and `forms` as the item lists; `PublicationKind` is `{ kind, stages?, forms? }` (`audit/rules.ts:71`), matched in `audit/publications.ts`.
10. `closestWord` and the two-row `distance` (`src/lib/data/shapes/vocab-keys.ts:152`, `:170`), ties to the first in the list's order, none for an empty list. `checkEntryStatus` and the exported `leadStatusFindings` (`validate.ts:238`, `:259`) share `statusFindings`; the lead check runs where the leads file is read (`src/lib/data/sources/documents/feeds.ts`). Texts `findings.yml:278-281`.
11. `config/defaults/layout.yml`: projects "in progress" lists the ten in-flight words, "idea" the three idea words, a new `paused` group (`#9ca3af`, last); coauthor "in progress" lists the in-flight words; `software` leaves `outputs` of coauthor and archive.
12. The demo fixtures and the tests: the tables below. `tests/checks/config/config-folder.test.ts` names the flags of `stages`, `forms`, `chips`, `statuses`, `lead_statuses` and `tiers`, count 38.
13. `docs/HELP.md`, `docs/data-map.md`, `docs/templates.md`, `docs/apps.md` rewritten where they named the type, the chips or the old spellings; `docs/diagrams/` regenerated by `npm run diagrams`.
14. `tests/data/snapshot/schema-rules.test.ts`: the table 'a status outside its vocabulary names the closest word' (exact word, one edit, a tie, a case difference, `not applied`, `under review`, `canceled`, a lead status `dismised`, an entry status and a lead status over an empty list) and the row 'a stage word or a form as a chip is one finding naming its field'. `tests/server/edit/writes.test.ts` (G8 guards `writes/`): 'writes as the stage of a new idea the one stages: flags new_idea, here $name' with the rows 'the stage scoping' and 'no stage'. The other moved flags have no guarded reader; each is checked by the probe through the reader's caller: `pauses_countdown` through `card.ts` `deadline` (C1), `deadline_met` on a project through `ticker` and `focus.waiting` (C1) and on an entry through `ticker` (C7), `submit_ready` through `stats.stats` (C2), `blocked` through `isBlocked`, `groupProjects` and `waitingLine` (C3), `new_idea` through `createIdea` (C10, C21).

First run of the item-14 rows on the unchanged tree (`npx vitest run tests/data/snapshot/schema-rules.test.ts tests/server/edit/writes.test.ts -t "closest word|a stage word or a form as a chip|stages: flags new_idea"` in the base copy): `Tests  12 failed | 1 passed | 66 skipped (79)`. The one that passes is the exact-word row, which gives no finding on either tree. The failures:

- one edit: `expected 'status "acepted" is not one of the st...' to contain 'accepted'`
- a tie: `expected 'status "pased" is not one of the stat...' to contain 'paused'`
- a case difference: `expected 'status "In Prep" is not one of the st...' to contain 'in-prep'`
- not applied, under review, canceled: `expected [] to deeply equal [ Array(1) ]`
- a lead status: `the catalog holds findings.validate.lead_status_not_in_vocab: expected undefined to be defined`
- an entry status and an empty list: `the catalog holds findings.validate.status_no_vocab: expected undefined to be defined`
- a lead status and an empty list: `the catalog holds findings.validate.lead_status_no_vocab: expected undefined to be defined`
- a stage word or a form as a chip: `the catalog holds findings.validate.chip_is_stage: expected undefined to be defined`
- new_idea 'the stage scoping': `expected 'id: new-idea\ntier: projects\ntype: i...' to be 'id: new-idea\ntier: projects\nstage: ...'`
- new_idea 'no stage': `expected 'id: new-idea\ntier: projects\ntype: i...' to be 'id: new-idea\ntier: projects\ntitle: ...'`

## The readers item 6 reaches, and the list each reads

- `state/boards/focus.ts`: `pausesCountdown` (`stages`, `pauses_countdown`), `isBlocked` (`chips`, `blocked`), `settled` (`stages`, `deadline_met`), the idea and in-flight tallies, `backlog` and `unplaced` (`stages`, `idea`, `live`), the entry status flags (`statuses`).
- `views/shared/card/card.ts` `deadline` (through `pausesCountdown`), called by `ProjectCard.svelte:117`; `views/boards/focus/lanes/Lanes.svelte` calls `pausesCountdown` and `isBlocked` unchanged.
- `state/boards/board/stats.ts`: `waitingLine` (`stages` `pauses_countdown`, `chips` `blocked`), `submitReady` (`stages` `submit_ready`), `stageCounts`.
- `state/boards/collection.ts`: `groupProjects` (`stages` `dead`, `idea`, `live`; `chips` `blocked` for the cross-link warning), `noFunding` (`stages`).
- `state/boards/focus-lanes.ts`, `state/boards/structure/lines.ts` (`inFlight` `live`, `archival` `dead`, `isDormant` `on_map`), `state/boards/structure/graph.ts` (`stages`), `state/sources/registries/venues.ts` (`dead`, `live`).
- `server/content/audit/rules.ts` and `projects.ts`, `publications.ts`: `archive_outcome`, `live`, `placed`, `standard`, `stage_folders` of `tiers`, `published`, `public`, `negative`, `dead_end`, all of `stages`.
- `server/edit/writes/manifest.ts` `createIdea`: `stages`, `new_idea`.
- Entry readers on `statuses`: `focus.ts`, `ticker.ts`, `state/forms/new-entry.ts` (`default_task`), `state/feeds/lead-application.ts` (`default_application`), `data/index.ts` (`acknowledged`, the colored words).
- Lead readers on `lead_statuses`: `data/accounts/leads.ts`, `data/sources/documents/feeds.ts` (the status check).
- Drawing: `state/shared/words/tones.ts` (`stages` colours and legend, `forms`, `chips`, `statuses` palette).

## Files ruling 252's rename changed

config: `catalogs/vocab.yml`, `defaults/layout.yml`, `defaults/sources.yml`, `options/appearance.yml`, `options/layout.yml`, `schemas/manifest-schema.yml`, `text/findings.yml`, `text/views/boards/projects.yml`, `text/views/structure/map.yml`, `text/views/system/audit.yml`.

docs: `HELP.md`, `apps.md`, `data-map.md`, `templates.md`.

src/lib: `data/index.ts`, `data/model/index.ts`, `data/model/model-collections.ts`, `data/model/model-deck.ts`, `data/model/model-entities.ts`, `data/shapes/catalog-files/vocab.ts`, `data/shapes/catalog-words.ts`, `data/shapes/vocab-keys.ts`, `data/snapshot/normalise.ts`, `data/snapshot/validate.ts`, `data/sources/config/catalog/options.ts`, `data/sources/config/catalog/schemas/references.ts`, `data/sources/config/catalogs.ts`, `data/sources/deck/groups.ts`, `kinds.ts`, `read.ts`, `spec.ts`, `data/sources/manifests.ts`, `server/content/audit/projects.ts`, `publications.ts`, `rules.ts`, `scan.ts`, `server/content/deck/read.ts`, `server/edit/writes/manifest.ts`, `state/boards/board/index.ts`, `items.ts`, `presets.ts`, `state.ts`, `stats.ts`, `state/boards/collection.ts`, `focus-lanes.ts`, `focus.ts`, `project-context.ts`, `structure/graph.ts`, `structure/lines.ts`, `ticker.ts`, `state/forms/schema.ts`, `state/shared/words/tones.ts`, `state/sources/registries/venues.ts`, `state/workbench/palette.ts`, `state/workbench/rail-badges/rail-badges.ts`, `ui/controls/Chip.svelte`, `views/academic/present/Slide.svelte`, `parts/Grid.svelte`, `parts/Legend.svelte`, `parts/Project.svelte`, `views/boards/focus/lanes/LaneCard.svelte`, `views/boards/projects/Projects.svelte`, `views/shared/card/card.ts`, `views/shared/card/project/CardStatus.svelte`, `ProjectCard.svelte`, `views/shared/graph/Nodes.svelte`, `node-tone.ts`, `views/shared/links/CrossLinks.svelte`, `views/structure/map/Controls.svelte`, `Legend.svelte`, `Map.svelte`, `views/structure/pillars/ArchivalCard.svelte`.

tests: `tests/data/snapshot/tier-type.test.ts` is now `tier-stage.test.ts` (its key `stage`, its rows 'no stage' and 'the stage manuscript').

## Fixture and test rows item 12 changed, old and new

Demo fixtures (`tests/fixtures/hubs/demo/projects/`, from `git diff -U0`):

| Project | Old | New |
| --- | --- | --- |
| graph-bandits | `type: active` | `stage: active` |
| graph-transfer | `type: active`, `[submit-ready]` | `stage: submit-ready`, `[]` |
| streaming-anomaly | `type: active` | `stage: active` |
| robust-embeddings | `type: active`, `[submitted]` | `stage: submitted`, `[]` |
| sparse-attention | `type: active` | `stage: active` |
| tensor-sketch, online-clustering | `type: idea`, `[exploring]` | `stage: exploring`, `[]` |
| bench-suite, tensorkit | `type: software` | `stage: finished` |
| demo-toolkit | `type: software`, `[software]` | `stage: finished`, `[]` |
| spectral-clustering-collab | `type: published`, `[journal, coauthor]` | `stage: published`, `form: journal`, `[coauthor]` |
| failed-quantization | `type: nogo` | `stage: nogo` |
| early-benchmark | `type: published`, `[lead, conference]` | `stage: published`, `form: conference`, `[lead]` |

Changed assertion and fixture lines of the test files, from `diff` of each against the base copy (inline manifests where only `type:` became `stage:` are grouped):

| File | Old | New |
| --- | --- | --- |
| `tests/data/sources/manifests/manifests.test.ts` | every inline `type: <word>` and `type: '<word>'` | `stage: <word>` |
| same | `PERSONAL` `type: active`, `chips: [building]`; row expects `type: 'active', chips: ['building']` | `stage: building`, `chips: []`; expects `stage: 'building', chips: []` |
| same | side-project C `type: active`, `chips: [running]`; expects `type: 'active', chips: ['running']` | `stage: running`, `chips: []`; expects `stage: 'running', chips: []` |
| same | titles "tier and type" (head comment, row name, describe) | "tier and stage" |
| `tests/server/edit/writes-fixture.ts` `MANIFEST` | `type: active`, `chips: [submitted, lead]` | `stage: submitted`, `chips: [lead]` |
| `tests/server/edit/writes.test.ts` `ideaManifest` | `type: idea`, `chips: [nascent]` | `stage: nascent` (a parameter, default `nascent`, none for no line), `chips: []` |
| `tests/routes/edit/write-fixture.ts` `PERSONAL_MANIFEST` | `type: idea`, `chips: [nascent]` | `stage: nascent`, `chips: []` |
| same `REPOSITORY_MANIFEST` | `type: active`, `chips: [building]` | `stage: building`, `chips: []` |
| same `deckProject` | `type: tier === 'projects' ? 'active' : 'published'` | `stage:` the same |
| same, line 37 | `type: active` | `stage: active` |
| `tests/routes/edit/write.test.ts` | field `type`, line `type: paused-stage` | field `stage`, line `stage: paused-stage` |
| `tests/routes/edit/undo/undo.test.ts` | row 'a type written', `fields: { type: 'paused-stage' }` | 'a stage written', `fields: { stage: 'paused-stage' }` |
| `tests/routes/docs/audit.test.ts` | `type: 'published'`, `type: 'active'` | `stage:` the same |
| `tests/data/snapshot/references.test.ts` | `at: [..., 1, 6]`, references `:1:6` | `at: [..., 1, 7]`, `:1:7` (the value moves one column with `stage: `) |
| same, `reference-hub.ts` | `types:` in the planted vocab, `type: active` | `stages:`, `stage: active` |
| `tests/data/snapshot/normalise.test.ts` | `type: 'active'` (input and expected) | `stage: 'active'` |
| `tests/data/snapshot/tier-stage.test.ts` (was tier-type) | key `'type'`, rows 'no type', 'the type manuscript', `type: idea` | key `'stage'`, 'no stage', 'the stage manuscript', `stage: idea` |
| `tests/data/hubs/hub-portfolio.test.ts` | `/^type: active$/m`, `type: idea` | `/^stage: active$/m`, `stage: idea` |
| `tests/checks/config/integrity.test.ts` | `type: project.type`; real-hub personal `['idea', 'active', 'finished']` of `one.type` | `stage` and `form`; `['idea', 'nascent', 'building', 'running', 'active', 'paused', 'finished']` of `one.stage` (the stages the landing rewrite gives a personal project: its type, or its stage chip) |
| `tests/checks/tree/boundaries.test.ts` | `tones.ts:typeColor` | `tones.ts:stageColor` |
| `tests/checks/config/config-folder.test.ts` | key list `types`; row `types: [active]`; flag rows `types`; title and count comment | `stages`, `forms`, `chips`, `lead_statuses`; `stages: [active]`; the five lists; 38 |
| `tests/data/sources/config/boards.test.ts` | "status_chips, project_types" | "project_stages, project_forms, status_chips" |
| `tests/data/snapshot/schema-rules.test.ts` | program row `type: active` | `stage: active` |
| `hub-folders`, `workspace-findings`, `workspace-projects`, `cluster-folder`, `relation-shapes`, `resources`, `clones`, `scan` (line 98), `hub-routing`, `project-files`, `changes`, `deposit`, `deposit-compare`, `served-roots`, `items` | inline `type: <word>` | `stage: <word>` |

No row was removed, skipped or loosened. `tests/data/sources/scan.test.ts:32,47` keep `type: 'idea'` on a scan entry: that is a scan rule's unknown key, not a manifest, and the rows assert it is refused.

## The cases after the change, side by side

Probe after the last change (`npx vitest run tests/o61-probe.test.ts --silent=false --reporter=verbose` in the worktree, then removed): `Tests  21 passed (21)`.

| Case | Before | After |
| --- | --- | --- |
| C1 | due `project.card.due_days(3)`, on ticker, venues `[]` | due `{"label":"2026-10-23"}`, off the ticker, venues count 1 |
| C2 | submitReady 0, tone grey | submitReady 1, tone orange (= `#ea580c`) |
| C3 | blocked, `[["work",true]]`, line blocked | the same |
| C4 | schema findings on `stage`/`type`; audit terminal_live and contradictory | `status.chips[0]: chip submitted is a stage word, which belongs in stage:, not in the chips`; `chip journal is a form, which belongs in form:, not in the chips`; audit `[]` |
| C5 | groups `{}`; inFlight 0, unplaced 0; demo Projects tab 5 | the 21 words in ruling 219's groups, paused none; inFlight 1, cross `["work"]`, unplaced 1; demo Projects tab 7 |
| C6 | p3 expects papers-in-preparation; p1, p2, p4 none | p1, p2 papers-in-preparation; p3, p4 papers-in-review; p5 thesis; p6 journal |
| C7 | no finding, amber, both off the ticker, grants `["Grant"]`, lead `[true,true]`, `blocked (external)`/`purple` | the same |
| C8 | one finding on `In Prep`, no closest word | three: `not-applied`, `cancelled`, `in-prep` named as the closest word |
| C9 | `not applied` | `not-applied` |
| C10 | `type: idea`, `chips: [nascent]` | `stage: nascent`, `chips: []` |
| C11 | match `[in-prep, "in prep", submitted]` | `[in-prep, submitted]`; G1 under In prep, G2 under Submitted |
| C12 | all `""` | `in-progress`, `in-progress`, `idea`, `paused`, `papers` |
| C13 | stages, forms `null`; chips mixed with stage words | 21 stages, 6 forms, the 7 chips |
| C14 | label `null` | `in preparation`, tone of `#a16207`, `journal article`/`journals` |
| C15 | no fixture holds two stage chips | the same (the rule applies at the landing rewrite) |
| C16 | all four keys refused | `chips` and `lead_statuses` merge (`["waiting"]`, `["open"]`); `stages` and `forms` refused |
| C17 | `[true,true]` | `[true,false]` |
| C18 | `[]` | `["projects/active/a"]` |
| C19 | no `closestWord` | `undefined` |
| C20 | no finding, `type` read | `stage: key stage is required`, `type: key type is not declared by the schema of this file`, nothing read |
| C21 | `chips: [nascent]`, no stage | no `stage:` line, `chips: []` |
| C22 | both decks, no maturity | deck A alone, maturity `nascent`, drawn `nascent (concept)` |

## Verify lines after the last change

Commands run from the worktree root after the last change (the last source change is the removal of the unused `wordTexts` from `vocab-keys.ts`):

1. While working only test files that reach the changed code ran, each with `npx vitest run tests/<file>` (several files per call); no `npm test`, `test:landing`, `test:checks` or `test:slow` ran.
2. `npm run format` (exit 0), then `npm run diagrams && npm run test:quick -- <the 131 changed paths>`:
   ```
   ok      ASCII gate (1.1 s)
   ok      prettier (1.6 s): All matched files use Prettier code style!
   ok      svelte-kit sync (2.0 s)
   ok      eslint (56.7 s)
   ok      svelte-check (101.4 s): ... COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest checks (166.9 s)
   ok      vitest (282.2 s)
   ok      vitest slow (445.1 s)
   test:quick: 447.1 s; every command passed
   test:quick: not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files
   ```
   The list ran three times. The first run was red in a changed file: svelte-check `tests/routes/edit/write-fixture.ts 273:9 'type' does not exist in type 'Partial<Project>'` (fixed to `stage:`), and timeouts under load in `hub-portfolio.test.ts` (changed) and `app-manage.test.ts`, `clone-after.test.ts`, `html.dom.test.ts` (unchanged); each of those files passed alone (`npx vitest run <file>`: 16, 23, 11 and 8 passed), as did `order.test.ts` (13 passed), which timed out in a batch rerun. The second run was stopped by the pause and gave no result. The third run is the one quoted. No whole-suite command ran.
3. The ASCII gate of `spec.md` over the 131 changed paths and this report prints nothing (exit 0).
4. `wc -l`: every changed source, test and config file is at or under its limit; `src/lib/data/model/index.ts` 852, `model-collections.ts` 267, `model-entities.ts` 880. Over 880 are documents only, each already over at the base: `docs/templates.md` 1330 (base 1315), and the generated `docs/diagrams/writes.dot` 1151 (base 1141) and `writes.svg` 3895 (base 3835). `ls src/lib/data/model` 10 items, `ls tests/data/snapshot` 9.
5. `sh utils/unused-exports.sh` against `migration-O61-base/unused-exports.txt`: no new line; the two lines that differ are the same unused exports under their new names (`typeCounts` to `stageCounts` in `structure/graph.ts`, `TypeCount` to `StageCount` in `board/index.ts`).
6. The grep prints only lines that are no vocabulary word, judged under Judgment calls.
7. `grep -rn "live_chips\|contradictory_chips\|terminal_live\|liveChips\|typeWord\|typeTone\|project_types\|type_folders" ...` prints only `typeWords` lines (judged under Judgment calls); `grep -rnE "\btypes:" config/catalogs/vocab.yml` prints nothing.
8. Every changed assertion is in the tables above, from `diff` of each changed test file against the base copy.
9. The history grep hits are judged under Judgment calls.

## Judgment calls

- The deck carries the stage word as `maturity` and `Grid.svelte` draws it through `stageLabel`, as the base carried the chip word and drew it through `chipLabel`; the card shows `nascent (concept)` (C22). The brief's item 6 says the deck reads the maturity "from the project's stage label"; the data layer has no catalog of labels, so the label is resolved where it is drawn.
- `BoardItem.chips` is `[form, ...chips]`, so the facet and the list draw the form beside the chips; `statusWords(stage, form, chips)` gives the marks of a lane card and of the list column (the stage first when its row has an icon).
- `CardStatus.svelte` draws the form and chips in the neutral tone (`UNKNOWN_TONE`); `statusMarkTone` gives a stage word its stage colour, else the icon's hue.
- The saved-state keys of the board (`hiddenStages`) and of the Map (`stages`) are new names; a value saved under the old key is not read (no migration code).
- The `terminal` flag is kept on the done group as ruling 219 names it; no rule of oculus reads it, which its head comment says.
- The stage toggle of the Projects board is labelled by the word; the CrossLinks tag shows the stage word.
- The lead status check runs in `data/sources/documents/feeds.ts`, where the leads file is read, since the leads file is no collection of the raw portfolio.
- `src/lib/data/model/index.ts` was 883 lines at the base and 887 with the two new `Vocabulary` fields; `Vocabulary`, `ValidationRules` and `SelfCheck` moved to `model-collections.ts` (its head comment says so), and `index.ts` exports them from there, so it is 852 lines and the folder stays at ten items.
- `tests/data/snapshot/tier-type.test.ts` is renamed `tier-stage.test.ts` with `mv`, as ruling 252 renames the field.
- The real-hub row of `integrity.test.ts` (skipped without `OCULUS_TEST_HUB`, not run here) lists the stages a personal project has after the landing rewrite: its type, or the stage chip it carried.
- Verify grep 7 prints `typeWords` in `repositories.ts`, `schema/check.ts` and `views/feeds/literature/`: these are functions of other things (a git file mode, a JSON schema type, a literature document type) that the base holds too; no vocabulary name remains.
- Verify grep 6 prints only lines that are no vocabulary word: `vocab.yml:71` and `:76` (the labels "in preparation" and "submitted / under review"), "it is not applied" sentences of `findings.yml`, `port.ts`, `workspace-layer.ts`, `text-edits.ts`, `hub-names.ts:357`, `docs/data-map.md:80`, `decorations.svelte.ts`; `project.yml:127-128` of `config/text/views/boards/` (a card's "under review at {0}" sentence); `pick.ts` and `git-provider.ts` and `picker.test.ts` (`canceled` of Electron and git APIs); `form-draft.test.ts` (a free status line); the status table of `schema-rules.test.ts` (the misspelled inputs). `config/defaults/layout.yml`'s head comment of the counts names `in-prep`.
- History grep 9 over the comment lines and titles the step added or changed: `vocab.yml:134` "still on the deadline radar", `tones.ts:92` "still renders a page", `presets.ts:328` "which still renders", `graph.ts:277` "no longer draws", `ticker.ts:170` "before it", `presets.ts:152` "a state saved before it existed", `board/stats.ts:74` "before any filter", `map/Controls.svelte:7` "costs before pressing it": each is base text in a paragraph the step rewrapped or a word next to a changed word, and each describes the code's present behaviour (a saved state that predates a stage, a row before a deadline), not the code's history. The new comments of `vocab-keys.ts` (`distance`), `vocab.ts` (`dead_end` help) and `tier-stage.test.ts` hold none of the words.

Nothing in the brief was found wrong or impossible.

# Repair round 1

Every ruling of `agents/briefs/O61-round1.md` is done, under the coordinator's rulings 262 (a), 263 (a) and 264 (a). Under 262 (a) the probe source is quoted at the end of this section. Under 263 (a) `git diff` was read, for the docs and size lines. Under 264 (a) ruling 6 stays a report line. Ruling 1's words "the stage word or a form written as a chip (item 8) among it" are met as the head comments naming that finding as the manifest check's, not the audit's: brief item 8 puts the rule in the manifest check (`src/lib/data/snapshot/validate.ts:287` `checkStageChips`), and `src/lib/server/content/audit/scan.ts:6-10` says the audit does not repeat what the data layer reports, so a comment saying the audit checks it would be false.

## Rulings

| Ruling | State | Check |
| --- | --- | --- |
| 1 S1, audit head comments | DONE | the grep below prints no false hit |
| 2 S2, comments over 100 columns | DONE | the sweep below prints nothing |
| 3 S3, `projectStatusWords` | DONE | `grep -rn "[^a-zA-Z]statusWords"` prints only `navigation/status.ts` and its caller `routes/+page.svelte` |
| 4 S4, `stageLabel` gone | DONE | `grep -rn "stageLabel" src tests docs config` prints nothing |
| 5 B1, the stage glyph on a board card | DONE | reading `ProjectCard.svelte:348-354`, before and after below |
| 6 B2, hue changes in the report | DONE | the table below |
| 7 P2, files outside the write list | DONE | the list below |
| 8 the verify list once | DONE | the verify lines below |

### 1. S1

`src/lib/server/content/audit/projects.ts:1-6`, after:
```
// Layer 2, server. The audit's sections over the projects and collections: the open markers left in
// a document, a manifest field a live project has not filled in, a folder that is not the one the
// tier standard names, a project of a finished tier with no author chip or of an unfinished tier at
// a stage that carries `published`, a field long enough to stop being a glance, and a collection
// entry whose date or link wants doing. A stage word or a form written as a chip is the manifest
// check's finding (data/snapshot/validate.ts), drawn in the Findings view, and is not scanned here.
```
The middle clause names the two rules of `guardrails` (`projects.ts:371-414`): `audit.msg_no_author_chip` and `audit.msg_projects_published`. Before, line 3 read "a status chip the project's own tier and type contradict".

`src/lib/views/system/audit/Audit.svelte:19-24`, after:
```
    // Layer 3, view. What the hub is missing, in the six sections the scan reports: an open marker
    // left in a document, a manifest field a live project has not filled in, a folder the tier
    // standard does not name, a project of a finished tier with no author chip or of an unfinished
    // tier at a stage that carries `published`, a field that has stopped being a glance, and the
    // public website's list against the portfolio. A stage word or a form written as a chip is a
    // finding of the manifest check, drawn in the Findings view rather than here.
```

The grep `grep -rn --exclude=local.yml -i "contradict\|terminal_live\|live_chips\|tier and type" src docs config tests` found two more false hits, both fixed:
- `src/lib/data/model/index.ts:353-358`, the doc comment of `AuditKind`: "a status the project's own tier and type contradict" is now "a project of a finished tier with no author chip or of an unfinished tier at a stage that carries `published`".
- `config/options/sources.yml:15`, the help of the project sources: "a project's tier and type are the manifest's own tier and type lines" is now "a project's tier and stage are the manifest's own tier and stage lines".

The grep after the fixes prints only `config/catalogs/latex.yml:647` (the LaTeX keywords "Proposition contradictory contradiction") and `tests/state/system/apps/store-cache.test.ts:3,105,252` (a push that contradicts a fetched answer). Neither is about the audit. `grep -rniE "tier and type|type and tier|tier or type|tier, type"` over the same folders prints nothing.

### 2. S2

The 14 lines the review lists are rewrapped. A one-line doc comment over 100 columns became a three-line block with the same words: `vocab.ts` `chipWord`, `groups.ts` `within`, `kinds.ts` `stage`, `rules.ts` `liveStages` and `stageFolders`, `presets.ts` `chips` and `StageCount`, `rail-badges.ts` `rollup`, `parts/Project.svelte` `stage`. The paragraphs at `stats.ts:121-123`, `focus-lanes.ts:89-90`, `config-folder.test.ts:688-689` and `CardStatus.svelte:2-6` (rewritten under ruling 5) are rewrapped as whole paragraphs.

The sweep over every file the step changes under `src` and `tests` prints every comment line over 100 columns that does not occur in the file's base copy. A file with no base copy is checked in full: `tier-stage.test.ts`, the one such file.
```
grep -E '^(src|tests)/' r1-paths.txt | while read f; do b=migration-O61-base/$f; w=migration-O61/$f;
  if [ -f "$b" ]; then awk -v F="$f" 'NR==FNR{base[$0]=1; next} length($0)>100 && $0 ~ /^[ \t]*(\/\/|\*|\/\*\*|<!--|#)/ && !($0 in base) {print F":"FNR": "length($0)}' "$b" "$w";
  else awk -v F="$f" 'length($0)>100 && $0 ~ /^[ \t]*(\/\/|\*|\/\*\*|<!--|#)/ {print F":"FNR": "length($0)}' "$w"; fi; done; echo "sweep done"
```
Output, run from `.agents/worktrees` after `npm run format`: `sweep done` and nothing else. Before this round's rewraps, the same sweep printed `CardStatus.svelte:3: 101` and `:4: 101`, so the review's other twelve lines had been rewrapped by then.

### 3. S3

`src/lib/state/shared/words/tones.ts:251` is now `export function projectStatusWords(stage, form, chips)`. Its two callers changed with it: `src/lib/views/boards/focus/lanes/LaneCard.svelte:33,81` and `src/lib/views/boards/projects/Projects.svelte:83,224`. The doc comment now says where the words are drawn and that a stage with no glyph gives no mark:
```
/**
 * The words a project's status marks draw on a lane card and in the board's list, in order: its
 * stage when the stage's word of `stages` has a glyph, then its form and its chips. A stage with no
 * glyph (idea, active, archived) gives no mark; a board card draws every stage as its filled chip.
 */
```
Before, its last sentence said such a stage "is drawn by the card's stage chip alone". That is false for a lane card, which draws no stage chip.

### 4. S4

`stageLabel` is removed from `tones.ts`. Its callers read `chipLabel`:
- `ProjectCard.svelte` (the stage chip);
- `views/academic/present/parts/Legend.svelte:25`;
- `parts/Project.svelte:44`;
- `parts/Grid.svelte:42` (the maturity).

### 5. B1

`src/lib/views/shared/card/project/ProjectCard.svelte:348-354`, after:
```svelte
{#if item.project.stage}
    <Chip
        label={chipLabel(item.project.stage)}
        glyph={chipGlyphName(item.project.stage)}
        tone={item.tone}
        filled
    />
{/if}
```
Before, the line was `<Chip label={stageLabel(item.project.stage)} tone={item.tone} filled />`, which drew no glyph. A board card now draws its stage as one filled chip, with the stage's label and the glyph of its row of `stages`. `chipGlyphName` returns the empty string for idea, active and archived, which have no `icon`, so those draw no glyph. `projectStatusWords` makes the same test (`chipGlyphName(stage) !== ''`). `item.tone` is `stageTone(project.stage)` (`board/items.ts:115`). The head comment of `CardStatus.svelte` says the stage chip carries the label and glyph of its word of `stages`.

Board card before and after, by reading `ProjectCard.svelte` and `CardStatus.svelte` on both trees with the `vocab.yml` of each:

| Manifest | Before (base manifest form) | After |
| --- | --- | --- |
| `stage: submitted` (base: `type: active`, `chips: [submitted]`) | filled chip "active" in the tone of `#ea580c` (`types.active`); outline chip "submitted / under review" with the `brown` glyph (a circle) in the tone of `#b45309` (`statusTone`, `statuses.submitted`) | filled chip "submitted / under review" with the `brown` glyph in the tone of `#0ea5e9` (`stages.submitted`); no other mark |
| `stage: in-prep`, `form: journal` (base: `type: active`, `chips: [in-prep, journal]`) | filled "active" in `#ea580c`; outline "in preparation" with the `writing` glyph in `#7c5cff` (`statuses.in-prep`); outline "journal article" with the `journals` glyph in the neutral tone (`statuses.journal` has no colour) | filled "in preparation" with the `writing` glyph in `#a16207` (`stages.in-prep`); outline "journal article" with the `journals` glyph in the neutral tone |

The form and the situation chips draw in the same neutral tone as before: none of journal, conference, thesis, abstract, poster, tech-report, blocked, results-positive, admin-prep, numbers-pending, ai-tells, lead or coauthor had a `color` in the base `statuses:` (base `vocab.yml:98-131`), so the base `statusTone` gave each the unknown tone, `grey`.

### 6. B2, the status-mark hues that change

`statusMarkTone` (`tones.ts:231-235`) colours a mark on a lane card and in the Projects list. On the base, it used the word's `color` of `statuses:` and otherwise the hue its icon is named by (`ICON_HUES`, identical on both trees). An icon with no entry there gives the unknown tone, `grey`. Now every stage word takes its `color` of `stages:`. Stages without a glyph (idea, active, archived) draw no mark. Base colours are from the base `vocab.yml:97-131`, new ones from `vocab.yml:65-85`.

| Stage word | Base hue | New hue |
| --- | --- | --- |
| exploring | `#7c5cff` | `#f59e0b` |
| in-prep | `#7c5cff` | `#a16207` |
| submit-ready | `green` (its icon `green`) | `#ea580c` |
| submitted | `#b45309` | `#0ea5e9` |
| published | `#0ea5e9` | `#16a34a` |
| finished | `#0ea5e9` | `#16a34a` |
| nogo | `grey` (icon `overdue`, no hue) | `#b45309` |
| dropped | `#ea580c` | `#9ca3af` |
| disproved | `grey` (icon `cross_box`, no hue) | `#dc2626` |
| abandoned | `grey` (icon `cross`, no hue) | `#6b7280` |

Unchanged: nascent `#7c5cff`, scoping `#0891b2`, de-risking `#16a34a`, building `#d4a017`, running `#16a34a`, revision `#b45309`, accepted `#2563eb`, paused `#9ca3af`. Exploring had a `color` of its own in the base `statuses:` (`#7c5cff`, base `vocab.yml:118`), not its icon's hue. No code changed for this ruling. Open item 264 is Axel's.

### 7. P2, files the step changed outside "Paths this step writes"

Config:
- `config/defaults/sources.yml:9`, the YAML comment: "project types" now says "project stages", because the field is renamed (ruling 252).
- `config/options/appearance.yml:8`, the YAML comment: the example "project types" in the list of map families now says "project stages" (ruling 252).
- `config/options/sources.yml:15`, the help of the project sources: "tier and type" now says "tier and stage". This round's ruling 1 grep found it.
- `config/options/layout.yml:149`: the help of the board groups names the project stages and forms. This line is beside the `from:` source names at `:154-156`, which the write list covers.

`config/defaults/layout.yml` changes only lines inside the listed range (base 225, 239-240, 253, 255, 270, 303, 321). `src/lib/data/helpers/hub-names.ts` changes only lines 361-364 and 384-385.

Files under "any other file under `src/`", each with what it reads:
- `src/lib/data/sources/documents/feeds.ts`: reads `lead_statuses` (`vocabKeys(merged.lead_statuses)`) and runs `leadStatusFindings`, the lead status check of item 10. This is the moved flag word list for Position Leads.
- `src/lib/data/sources/manifests.ts`: renamed only. The head comment and a doc comment say `stage`.
- `src/lib/server/content/audit/scan.ts`: renamed only. The head comment says `stage` and no longer names the removed contradiction rule.
- `src/lib/server/content/deck/read.ts`: reads `project.stage` and `project.form` into a deck project (renamed field, new field).
- `src/lib/state/boards/board/index.ts`: renamed only (`stageCounts`, `StageCount`).
- `src/lib/state/boards/board/state.ts`: reads `project.stage` for the hidden-stage toggles (`hiddenStages`). Renamed field.
- `src/lib/state/boards/project-context.ts`: writes `stage` and `form` into the project context lines. Renamed field and the new field.
- `src/lib/state/workbench/palette.ts`: reads `project.stage` and `project.form` into the search words. Renamed field and the new field.
- `src/lib/state/workbench/rail-badges/rail-badges.ts`: reads `stage`, `form` and the chips for the rollup group a project counts in. Renamed field and the new field.
- `src/lib/ui/controls/Chip.svelte`: renamed only, in the head comment.
- `src/lib/views/academic/present/Slide.svelte`: passes `row.stage` to the project slide. Renamed field.
- `src/lib/views/shared/graph/Nodes.svelte`: renamed only. The head comment says "project stage" and is rewrapped.
- `src/lib/views/shared/links/CrossLinks.svelte`: reads `membersByStage` (`collection.ts`, renamed). Renamed only.
- `src/lib/views/structure/map/Map.svelte`: reads `stageFilters` and the saved `stages` filter. Renamed only.
- `src/lib/views/structure/pillars/ArchivalCard.svelte`: reads `group.stage`. The groups are the words of `stages` carrying `dead`, the moved `dead` flag.
- `src/lib/views/system/audit/Audit.svelte` (this round, ruling 1): head comment only.

`src/lib/data/model/model-collections.ts` is inside `src/lib/data/model/`, so the write list already covers it.

Tests outside the write list:
- `tests/data/sources/config/boards.test.ts:59`: the expected finding names the option sources `project_stages, project_forms, status_chips`, renamed from `status_chips, project_types`.
- `tests/checks/tree/boundaries.test.ts:483`: the exported name `tones.ts:stageColor`, renamed from `typeColor`.

Every other changed test file writes `type:`/`stage:` in a manifest, or is `config-folder.test.ts` or an item-14 file.

## Cases, each with the test row or the reading that checks it

No script, probe file or program was written in this round.

- C1, by reading:
  - `focus.ts:89` `pausesCountdown` reads `stages` `pauses_countdown`; `card.ts:155` calls it.
  - `focus.ts:114` reads `stages` `deadline_met` for a project.
  - `ticker.ts:170` stops at a stage carrying `deadline_met`.
  - `vocab.yml:76` gives `submitted` both flags and `live`.
- C2, by reading: `stats.ts:91` counts `stages` `submit_ready`; `vocab.yml:74` gives `submit-ready` `#ea580c`, the colour of `active`.
- C3, by reading: `focus.ts:100`, `collection.ts:815` and `stats.ts:65` read `chips` `blocked`; `vocab.yml:101-117` gives `blocked` the flag.
- C4, by test row and reading:
  - Test row 'a stage word or a form as a chip is one finding naming its field' (`tests/data/snapshot/schema-rules.test.ts`).
  - Reading: the `terminal_live` and `contradictory_chips` findings are gone, by verify grep 7.
- C5, by reading: the group flags of `vocab.yml:65-85` (ruling 219); `focus.ts:266`, `lines.ts:59` and `collection.ts:833` read `live`. The demo Projects tab count stays as reported in the first section, 5 before and 7 after.
- C6, by reading: the `publication_kinds` rows `vocab.yml:230-241` read `stages` and `forms`, matched in `audit/publications.ts`.
- C7, by reading:
  - `vocab.yml:139` `under-review` carries `#b45309` and `deadline_met`.
  - `vocab.yml:120` `submitted` carries `deadline_met` and `waiting`.
  - `vocab.yml:176` `dismissed` carries `lead_closed` and `lead_declined`.
  - `blocked` has label "blocked (external)" and glyph `purple` (`vocab.yml:101-117`).
- C8, by test rows of the table 'a status outside its vocabulary names the closest word' (`schema-rules.test.ts`): `not applied`, `under review`, `canceled`, and the case difference `In Prep`.
- C9, by reading: `lead-application.ts:39` takes the first `statuses` word carrying `default_application`, which is `not-applied` (`vocab.yml:156`).
- C10, by test row 'writes as the stage of a new idea the one stages: flags new_idea, here the stage scoping' (`tests/server/edit/writes.test.ts`), and by reading `manifest.ts:669`.
- C11, by reading: `fund_stages` `vocab.yml:204` reads `[in-prep]`, `[submitted, under-review]`, `[planned]`; `config/defaults/layout.yml:322` matches `[in-prep, submitted]`.
- C12, by reading: `config/defaults/layout.yml:239-241` (in progress, idea, paused) and `:255` (coauthor papers, `journal` and `conference`).
- C13, by reading:
  - `manifest-schema.yml:36` `stage` reads `vocab.stages`, which holds the 21 words with no `software`, `tech-report` or `phd`.
  - `:37` `form` reads `vocab.forms`, the six forms.
  - `:42` `status.chips` reads `vocab.chips`.
  - The option sources are at `options.ts:483-548`.
  - The form on screen is for the landing look.
- C14, by reading: `ProjectCard.svelte:348-354` and `CardStatus.svelte`, as in ruling 5's table. On screen at landing.
- C15: not checkable here. No fixture of oculus holds two stage chips; the rule is applied by the landing rewrite (ruling 247).
- C16, by reading: `hub-names.ts:384-385` adds `chips` and `lead_statuses` to `HUB_LIST`; `stages` and `forms` are not in it, so a hub setting them is the unknown-key finding.
- C17, by reading: `lines.ts:116` makes a card dormant when no member's stage carries `on_map`. `finished` has no `on_map` and `submitted` has it (`vocab.yml:76`, `:80`).
- C18, by reading: `rules.ts:186` builds `placedStages` from `stages` `placed`, read at `projects.ts:210`. `submit-ready` carries `placed`; `building` does not (`vocab.yml:72`, `:74`).
- C19, by test rows 'an entry status and an empty list' and 'a lead status and an empty list' (`schema-rules.test.ts`).
- C20, by reading:
  - `manifest-schema.yml:36` makes `stage` required, and no `type` field is declared.
  - `normalise.ts` reads `manifest.stage` and `manifest.form` only.
  - Verify grep 7 finds no reader of the old names.
- C21, by test row 'writes as the stage of a new idea the one stages: flags new_idea, here no stage' (`writes.test.ts`).
- C22, by reading:
  - `deck/groups.ts:61-66` keeps a deck by `find.stages` and `find.forms`.
  - `deck/read.ts:400` takes the maturity from `project.stage`.
  - `parts/Grid.svelte:42` draws it through `chipLabel`, which gives "nascent (concept)" (`vocab.yml:67`).

## Verify lines after this round's last change

These commands ran from the worktree root after this round's last source change, the `projectStatusWords` doc comment in `tones.ts`. In this round the verify list ran once, and no whole-suite command ran.

1. While working, only the targeted greps and the comment sweep ran. No test file ran outside the verify list.
2. `npm run format` (exit 0). Then `npm run diagrams && npm run test:quick -- <143 paths>`. The paths are the 125 changed files under `src`, `tests` and `config` (from `diff -rq` against the base copy) plus `docs/HELP.md`, `apps.md`, `data-map.md`, `templates.md` and every file of `docs/diagrams/`:
   ```
   test:quick: 143 changed file(s), from the given paths
   test:quick: 294 test file(s)
   ok      ASCII gate (1.4 s)
   ok      prettier (2.1 s): All matched files use Prettier code style!
   ok      svelte-kit sync (3.3 s)
   ok      svelte-check (135.4 s): ... COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (146.2 s)
   ok      vitest checks (200.1 s)
   ok      vitest (270.4 s)
   ok      vitest slow (362.2 s)
   test:quick: 365.5 s; every command passed
   test:quick: not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files
   ```
3. The ASCII gate of `spec.md` over the 143 paths and this report prints nothing (exit 0).
4. `wc -l` over every file in `git diff --name-only` (134 files) and the new `tier-stage.test.ts`. Over the limit are only documents that were already over it at the base: `docs/templates.md` 1330, `docs/diagrams/writes.dot` 1151, `docs/diagrams/writes.svg` 3895. Sizes of the files this round changed:
   - `tones.ts` 291
   - `ProjectCard.svelte` 498
   - `Audit.svelte` 352
   - `audit/projects.ts` 546
   - `data/model/index.ts` 852

   `git diff --stat -- docs` shows only `HELP.md`, `apps.md`, `data-map.md`, `templates.md` and the `layer-data`, `layer-views`, `layers` and `writes` diagrams.
5. `sh utils/unused-exports.sh` diffed with `migration-O61-base/unused-exports.txt` prints only the two renamed lines: `typeCounts` to `stageCounts` (`structure/graph.ts`) and `TypeCount` to `StageCount` (`board/index.ts`). `projectStatusWords` is not on the list.
6. Grep 6 prints the same lines as in the first section, each judged there. No line was added.
7. Grep 7 prints only the `typeWords` lines judged in the first section. `grep -rnE "\btypes:" config/catalogs/vocab.yml` prints nothing. `grep -rn "stageLabel\|hiddenTypes\|typeCounts" src tests docs config --exclude=local.yml` prints nothing.
8. This round changed one test file, `tests/checks/config/config-folder.test.ts:688-689`. Only the comment was rewrapped, and no assertion changed.
9. History grep over the comment lines added or changed in the files this round touched. Hits:
   - `tones.ts` "still renders a page";
   - `presets.ts` "state saved before it existed" and "which still renders";
   - `stats.ts` "before any filter".

   All four are the base text already judged in the first section. The new comments of this round hold none of the words. The comments are in `audit/projects.ts`, `Audit.svelte`, `model/index.ts`, `CardStatus.svelte` and `tones.ts`, plus the help line of `config/options/sources.yml`.

## The first run's probe source

Under ruling 262 (a), here is the source of the case probe that gave the first section's before and after results. Its path was `tests/o61-probe.test.ts` in each tree while it ran. The copy kept in the scratchpad was removed after it was quoted here, together with the scratch base copy it ran in. C14 and C22 look up `stageLabel` by name. Ruling 4 of this round removed it, so C14 now gives `label: null` and C22 falls back to `chipLabel`. The label a card draws is checked by reading `ProjectCard.svelte` and `Grid.svelte`, under Cases above.

```ts
// Scratch probe of the O61 cases, run on the unchanged tree and after the change. Not a test of the
// suite: it is copied into the worktree for a run and removed afterwards.

import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { portfolioConfigFrom } from '../src/lib/data/index.ts';
import { buildOneHub } from './fixtures/hubs/hub-build.ts';
import { engineDir, loadConfig } from '../src/lib/data/sources/config.ts';
import { plantScratch } from './fixtures/scratch.ts';
import { DEMO_HUB } from './fixtures/hubs/real-hub.ts';
import * as focus from '../src/lib/state/boards/focus.ts';
import * as stats from '../src/lib/state/boards/board/stats.ts';
import * as ticker from '../src/lib/state/boards/ticker.ts';
import * as collection from '../src/lib/state/boards/collection.ts';
import * as lanes from '../src/lib/state/boards/focus-lanes.ts';
import * as lines from '../src/lib/state/boards/structure/lines.ts';
import * as presets from '../src/lib/state/boards/board/presets.ts';
import * as tones from '../src/lib/state/shared/words/tones.ts';
import * as keys from '../src/lib/data/shapes/vocab-keys.ts';
import * as leads from '../src/lib/data/accounts/leads.ts';
import * as application from '../src/lib/state/feeds/lead-application.ts';
import * as options from '../src/lib/data/sources/config/catalog/options.ts';
import * as card from '../src/lib/views/shared/card/card.ts';
import { auditFindings } from '../src/lib/server/content/audit/scan.ts';
import { auditRules } from '../src/lib/server/content/audit/rules.ts';
import { holdersOf } from '../src/lib/data/helpers/hub-names.ts';
import { textCatalog } from '../src/lib/data/sources/config.ts';
import { createIdea } from '../src/lib/server/edit/writes/manifest.ts';
import { configFor } from './server/edit/writes-fixture.ts';
import { scratchDir } from './fixtures/scratch.ts';
import { readDeck } from '../src/lib/server/content/deck/read.ts';
import type { Project } from '../src/lib/data/model/index.ts';
import { setCatalog } from '../src/lib/state/shared/words/text.ts';

const LOADED = loadConfig(engineDir()).config;
const CONFIG = portfolioConfigFrom(LOADED);
const CATALOG = textCatalog(LOADED);
setCatalog(CATALOG);
const NOW = Date.parse('2026-10-20T12:00:00Z');
const SOON = '2026-10-23';
const anyOf = (mod: Record<string, unknown>, ...names: string[]): any =>
    names.map((name) => mod[name]).find((one) => typeof one === 'function');

/** A hub of one or more manifests, each `id: text`, under projects/active. */
function hubOf(manifests: Record<string, string>, extra: Record<string, string> = {}): any {
    const files: Record<string, string> = { ...extra };
    for (const [id, text] of Object.entries(manifests)) {
        files[`projects/active/${id}/project.yml`] = `id: ${id}\ntitle: ${id}\n${text}`;
    }
    const hub = plantScratch('oculus-o61-', files, ['projects/active']);
    return { hub, ...buildOneHub(hub, CONFIG) };
}

const translate = (key: string, ...args: (string | number)[]): string => `${key}(${args.join(',')})`;

/** The deadline of a card through card.ts, whichever of its two signatures the tree has. */
function dueOf(project: Project): unknown {
    const fn = card.deadline as unknown as (...args: unknown[]) => unknown;
    return fn.length >= 5
        ? fn(project, project.chips, NOW, translate, LOADED)
        : fn(project, NOW, translate, LOADED);
}

describe('O61 cases', () => {
    it('C1 a stage submitted with a deadline', () => {
        const { snapshot } = hubOf({
            alpha: `tier: projects\nstage: submitted\ndeadline: ${SOON}\nfocus: review\n`
        });
        const project = snapshot.entities.projects.alpha as Project;
        const due = dueOf(project);
        const tick = ticker.ticker(snapshot, LOADED, NOW);
        const onTicker = JSON.stringify(tick).includes('"alpha"');
        const wait = focus.waiting(snapshot, LOADED, {});
        console.log('C1', JSON.stringify({ due, onTicker, venues: wait.venues }));
        expect(due).toEqual({ label: SOON });
        expect(onTicker).toBe(false);
        expect(wait.venues.reduce((n, one) => n + one.count, 0)).toBe(1);
    });

    it('C2 a stage submit-ready', () => {
        const { snapshot } = hubOf({ alpha: 'tier: projects\nstage: submit-ready\n' });
        const project = snapshot.entities.projects.alpha as Project;
        const counted = stats.stats([{ project, chips: project.chips } as never], {}, LOADED);
        tones.setVocab(LOADED, { primary: null, lists: {} });
        const stageTone = anyOf(tones as never, 'stageTone', 'typeTone');
        const tone = stageTone((project as any).stage ?? (project as any).type ?? 'submit-ready');
        console.log('C2', JSON.stringify({ submitReady: counted.submitReady, tone, active: tones.toneOf('#ea580c') }));
        expect(counted.submitReady).toBe(1);
        expect(tone).toBe(tones.toneOf('#ea580c'));
    });

    it('C3 chips [blocked] on stage active', () => {
        const { snapshot } = hubOf({ alpha: 'tier: projects\nstage: active\nstatus:\n  chips: [blocked]\n' });
        const project = snapshot.entities.projects.alpha as Project;
        const blocked = focus.isBlocked(project, LOADED);
        const groups = collection.groupProjects([project], LOADED);
        const line = stats.waitingLine(project, LOADED, {}, {});
        console.log('C3', JSON.stringify({ blocked, groups: groups.map((g) => [g.type, g.warn]), line }));
        expect(blocked).toBe(true);
        expect(groups.map((g) => [g.type, g.warn])).toEqual([['work', true]]);
        expect(line?.kind).toBe('blocked');
    });

    it('C4 a stage word or a form as a chip', () => {
        const { snapshot } = hubOf({
            alpha: 'tier: projects\nstage: active\nstatus:\n  chips: [submitted]\n',
            beta: 'tier: projects\nstage: active\nstatus:\n  chips: [journal]\n'
        });
        const of = (id: string): string[] =>
            snapshot.findings
                .filter((one: any) => one.file.endsWith(`/${id}/project.yml`))
                .map((one: any) => `${one.key}: ${one.message}`);
        console.log('C4 alpha', JSON.stringify(of('alpha')));
        console.log('C4 beta', JSON.stringify(of('beta')));
        const projects = [
            { id: 'p1', tier: 'archive', stage: 'published', type: 'published', chips: ['numbers-pending', 'lead'] },
            { id: 'p2', tier: 'projects', stage: 'active', type: 'active', chips: ['submit-ready', 'blocked'] }
        ].map((one) => ({
            ...(snapshot.entities.projects.alpha as Project),
            ...one,
            folder: `projects/${one.id}`,
            file: `projects/${one.id}/project.yml`
        })) as Project[];
        const found = auditFindings({
            hub: scratchDir('oculus-o61-audit-'),
            root: 'hub',
            primary: true,
            held: holdersOf(projects),
            projects,
            collections: [],
            rules: auditRules(LOADED),
            catalog: CATALOG
        });
        const old = found.filter((one) => /terminal|contradict|cannot both/i.test(one.message));
        console.log('C4 audit', JSON.stringify(old.map((one) => one.message)));
        expect(of('alpha').length).toBe(1);
        expect(of('alpha')[0]).toMatch(/submitted.*stage/);
        expect(of('beta').length).toBe(1);
        expect(of('beta')[0]).toMatch(/journal.*form/);
        expect(old).toEqual([]);
    });

    it('C5 the groups of the stage words, and the demo Projects tab count', () => {
        const stages = (LOADED as any).stages ?? {};
        const groupOf = (row: any): string =>
            row?.idea === true ? 'idea' : row?.live === true ? 'live' : row?.terminal === true ? 'terminal' : 'none';
        const groups = Object.fromEntries(Object.entries(stages).map(([word, row]) => [word, groupOf(row)]));
        console.log('C5 groups', JSON.stringify(groups));
        const { snapshot } = hubOf({ alpha: 'tier: projects\nstage: submitted\n' });
        const project = snapshot.entities.projects.alpha as Project;
        const inFlight = lines.inFlight([project], LOADED).length;
        const cross = collection.groupProjects([project], LOADED).map((g) => g.type);
        const unplaced = focus.unplaced([project], LOADED).length;
        const demo = loadConfig(engineDir(), { hub: DEMO_HUB }).config;
        const built = buildOneHub(DEMO_HUB, portfolioConfigFrom(demo)).snapshot;
        const preset = presets.presetFor('projects', demo);
        const first = preset.rollup[0]?.id;
        const count = Object.values(built.entities.projects as Record<string, Project>).filter(
            (one) => one.tier === 'projects' && presets.bucketOf(one, preset.rollup) === first
        ).length;
        console.log('C5', JSON.stringify({ inFlight, cross, unplaced, demoProjectsTab: count }));
        expect(groups).toEqual({
            idea: 'idea', nascent: 'idea', scoping: 'idea',
            'de-risking': 'live', exploring: 'live', 'in-prep': 'live', building: 'live', running: 'live',
            active: 'live', 'submit-ready': 'live', submitted: 'live', revision: 'live', accepted: 'live',
            published: 'terminal', paused: 'none', finished: 'terminal', archived: 'terminal', nogo: 'terminal',
            dropped: 'terminal', disproved: 'terminal', abandoned: 'terminal'
        });
        expect([inFlight, cross, unplaced]).toEqual([1, ['work'], 1]);
    });

    it('C6 publication_kinds', () => {
        const hub = scratchDir('oculus-o61-pub-');
        const site = ['elsewhere:', '  papers:'];
        const rows: [string, string, string][] = [
            ['p1', 'in-prep', ''],
            ['p2', 'submit-ready', ''],
            ['p3', 'submitted', ''],
            ['p4', 'revision', ''],
            ['p5', 'published', 'thesis'],
            ['p6', 'published', 'journal']
        ];
        for (const [id] of rows) site.push(`    - title: Paper ${id} on clustering`);
        writeFileSync(join(hub, 'publications.yml'), `${site.join('\n')}\n`);
        const projects = rows.map(([id, stage, form]) => ({
            id,
            tier: 'projects',
            stage,
            type: stage,
            ...(form === '' ? {} : { form }),
            chips: form === '' ? [] : [form],
            title: `Paper ${id} on clustering`,
            folder: `projects/${id}`,
            file: `projects/${id}/project.yml`,
            results: [], ideas: [], waitingOn: [], followups: [], subtasks: [], relatedIds: [],
            resourceIds: [], fundingIds: [], datasetIds: [], pillarIds: [], domainIds: [],
            collaborators: [], docs: []
        })) as unknown as Project[];
        const found = auditFindings({
            hub,
            root: 'hub',
            primary: true,
            held: holdersOf(projects),
            projects,
            collections: [],
            rules: { ...auditRules(LOADED), publicationsFile: 'publications.yml' },
            catalog: CATALOG
        }).filter((one) => one.kind === 'publink' && one.scope !== 'website');
        const said = Object.fromEntries(found.map((one) => [one.scope, one.message]));
        console.log('C6', JSON.stringify(said));
        expect(said['projects/p1']).toContain('papers-in-preparation');
        expect(said['projects/p2']).toContain('papers-in-preparation');
        expect(said['projects/p3']).toContain('papers-in-review');
        expect(said['projects/p4']).toContain('papers-in-review');
        expect(said['projects/p5']).toContain('thesis');
        expect(said['projects/p6']).toContain('journal');
    });

    it('C7 entry, grant, lead and chip as today', () => {
        const { snapshot } = hubOf(
            {},
            {
                '.oculus/data/academic/events.yml': `schema:\n  - { field: title, type: text }\n  - { field: status, type: text }\n  - { field: date, type: date }\nentries:\n  - { title: Talk, status: under-review, date: "${SOON}" }\n`,
                '.oculus/data/academic/funding.yml': `schema:\n  - { field: title, type: text }\n  - { field: status, type: text }\n  - { field: deadline, type: date }\nentries:\n  - { title: Grant, status: submitted, deadline: "${SOON}" }\n`
            }
        );
        const statusFindings = snapshot.findings.filter((one: any) => /status/.test(one.key)).map((one: any) => one.message);
        tones.setVocab(LOADED, { primary: null, lists: {} });
        const tone = tones.statusTone('under-review');
        const tick = JSON.stringify(ticker.ticker(snapshot, LOADED, NOW));
        const grants = focus.waiting(snapshot, LOADED, {}).grants;
        const lead = [leads.isLeadClosed(LOADED, 'dismissed'), leads.isLeadDeclined(LOADED, 'dismissed')];
        const chip = [tones.chipLabel('blocked'), tones.chipGlyphName('blocked')];
        console.log('C7', JSON.stringify({ statusFindings, tone, talkOnTicker: tick.includes('Talk'), grantOnTicker: tick.includes('Grant'), grants, lead, chip }));
        expect(statusFindings).toEqual([]);
        expect(tone).toBe(tones.toneOf('#b45309'));
        expect(tick.includes('Talk')).toBe(false);
        expect(tick.includes('Grant')).toBe(false);
        expect(grants).toEqual(['Grant']);
        expect(lead).toEqual([true, true]);
        expect(chip).toEqual(['blocked (external)', 'purple']);
    });

    it('C8 a spaced or misspelled entry status names the closest word', () => {
        const { snapshot } = hubOf(
            {},
            {
                '.oculus/data/academic/applications.yml': 'schema:\n  - { field: title, type: text }\n  - { field: status, type: text }\nentries:\n  - { title: A, status: not applied }\n  - { title: B, status: canceled }\n  - { title: C, status: In Prep }\n'
            }
        );
        const said = snapshot.findings
            .filter((one: any) => one.file.endsWith('applications.yml') && /status/.test(one.key))
            .map((one: any) => `${one.key}: ${one.message}`);
        console.log('C8', JSON.stringify(said));
        expect(said.length).toBe(3);
        expect(said[0]).toContain('not-applied');
        expect(said[1]).toContain('cancelled');
        expect(said[2]).toContain('in-prep');
    });

    it('C9 the apply control writes not-applied', () => {
        const fields = application.applicationFromLead({ title: 'A lead' }, LOADED);
        console.log('C9', JSON.stringify(fields));
        expect(fields.status).toBe('not-applied');
    });

    it('C10 a new idea writes stage nascent and no chip', () => {
        const root = scratchDir('oculus-o61-idea-');
        const out = createIdea(root, { ...configFor(), scan: [{ dir: 'projects/ideas' }], newProjectDir: { projects: 'projects/ideas' } } as never, { id: 'new-idea', title: 'New', tier: 'projects' });
        const text = out.changed.length > 0 ? readFileSync(join(root, out.changed[0]), 'utf8') : JSON.stringify(out);
        console.log('C10', JSON.stringify(text));
        expect(text).toContain('stage: nascent');
        expect(text).toContain('chips: []');
        expect(text).not.toMatch(/^type:/m);
    });

    it('C11 the Focus funding column and the Funding count', () => {
        const { snapshot } = hubOf(
            {},
            {
                '.oculus/data/academic/funding.yml': 'schema:\n  - { field: title, type: text }\n  - { field: status, type: text }\nentries:\n  - { title: G1, status: in-prep }\n  - { title: G2, status: under-review }\n'
            }
        );
        const band = lanes.collectionLanes(snapshot, LOADED);
        const placed = band.funding.map((stage) => [stage.label, stage.items.map((one) => one.title)]);
        const match = (LOADED as any).counts?.funding?.match;
        console.log('C11', JSON.stringify({ placed, match }));
        expect(placed).toEqual([['In prep', ['G1']], ['Submitted', ['G2']]]);
        expect(match).toEqual(['in-prep', 'submitted']);
    });

    it('C12 the board groups', () => {
        const { snapshot } = hubOf({
            a: 'tier: projects\nstage: submitted\n',
            b: 'tier: projects\nstage: exploring\n',
            c: 'tier: projects\nstage: nascent\n',
            d: 'tier: projects\nstage: paused\n',
            e: 'tier: coauthor\nstage: published\nform: journal\n'
        });
        const projectsBoard = presets.presetFor('projects', LOADED).rollup;
        const coauthorBoard = presets.presetFor('coauthor', LOADED).rollup;
        const all = snapshot.entities.projects as Record<string, Project>;
        const got = {
            a: presets.bucketOf(all.a, projectsBoard),
            b: presets.bucketOf(all.b, projectsBoard),
            c: presets.bucketOf(all.c, projectsBoard),
            d: presets.bucketOf(all.d, projectsBoard),
            e: presets.bucketOf(all.e, coauthorBoard)
        };
        console.log('C12', JSON.stringify(got));
        expect(got).toEqual({ a: 'in-progress', b: 'in-progress', c: 'idea', d: 'paused', e: 'papers' });
    });

    it('C13 the form offers the stages, the forms and the chips', () => {
        const items = (source: string): unknown => options.configItems(source as never, LOADED);
        const got = {
            stages: items('project_stages'),
            forms: items('project_forms'),
            chips: items('status_chips'),
            types: items('project_types')
        };
        console.log('C13', JSON.stringify(got));
        expect((got.stages as string[] | null)?.length).toBe(21);
        expect(got.forms).toEqual(['journal', 'conference', 'thesis', 'abstract', 'poster', 'tech-report']);
        expect(got.chips).toEqual(['blocked', 'results-positive', 'admin-prep', 'numbers-pending', 'ai-tells', 'lead', 'coauthor']);
    });

    it('C14 a card of stage in-prep and form journal', () => {
        tones.setVocab(LOADED, { primary: null, lists: {} });
        const stageTone = anyOf(tones as never, 'stageTone', 'typeTone');
        const stageLabel = anyOf(tones as never, 'stageLabel');
        const got = {
            label: stageLabel === undefined ? null : stageLabel('in-prep'),
            tone: stageTone('in-prep'),
            journal: [tones.chipLabel('journal'), tones.chipGlyphName('journal')]
        };
        console.log('C14', JSON.stringify(got));
        expect(got).toEqual({ label: 'in preparation', tone: tones.toneOf('#a16207'), journal: ['journal article', 'journals'] });
    });

    it('C16 a hub sets chips, lead_statuses, stages and forms', () => {
        const hub = plantScratch('oculus-o61-hubcfg-', {
            '.oculus/config.yml': 'chips:\n  waiting: { label: waiting }\nlead_statuses:\n  open: { default_lead: true }\nstages:\n  idea: {}\nforms:\n  journal: {}\n'
        });
        const loaded = loadConfig(engineDir(), { hub });
        const said = loaded.findings.filter((one) => one.file.endsWith('config.yml')).map((one) => `${one.key}: ${one.message}`);
        console.log('C16', JSON.stringify({ said, chips: Object.keys((loaded.config as any).chips ?? {}), leadStatuses: Object.keys((loaded.config as any).lead_statuses ?? {}) }));
        expect(Object.keys((loaded.config as any).chips ?? {})).toEqual(['waiting']);
        expect(Object.keys((loaded.config as any).lead_statuses ?? {})).toEqual(['open']);
        expect(said.map((one) => one.split(':')[0]).sort()).toEqual(['forms', 'stages']);
    });

    it('C17 the dormancy of a Pillars or Domains card', () => {
        const { snapshot } = hubOf({ a: 'tier: projects\nstage: finished\n', b: 'tier: projects\nstage: submitted\n' });
        const all = snapshot.entities.projects as Record<string, Project>;
        const got = [lines.isDormant([all.a], LOADED), lines.isDormant([all.a, all.b], LOADED)];
        console.log('C17', JSON.stringify(got));
        expect(got).toEqual([true, false]);
    });

    it('C18 the venue finding of a placed stage', () => {
        const { snapshot, hub } = hubOf({ a: 'tier: projects\nstage: submit-ready\n', b: 'tier: projects\nstage: building\n' });
        const projects = Object.values(snapshot.entities.projects) as Project[];
        const found = auditFindings({ hub, root: 'hub', primary: true, held: holdersOf(projects), projects, collections: [], rules: auditRules(LOADED), catalog: CATALOG })
            .filter((one) => one.where === 'venue_id')
            .map((one) => one.scope);
        console.log('C18', JSON.stringify(found));
        expect(found).toEqual(['projects/active/a']);
    });

    it('C19 the closest word of an empty list', () => {
        const closest = anyOf(keys as never, 'closestWord');
        console.log('C19', closest === undefined ? 'no closestWord' : JSON.stringify(closest('x', [])));
        expect(closest).toBeDefined();
        expect(closest('x', [])).toBeUndefined();
    });

    it('C20 a manifest that still writes type:', () => {
        const { snapshot } = hubOf({ a: 'tier: projects\ntype: active\n' });
        const said = snapshot.findings.filter((one: any) => one.file.endsWith('/a/project.yml')).map((one: any) => `${one.key}: ${one.message}`);
        const project = snapshot.entities.projects.a as any;
        console.log('C20', JSON.stringify({ said, stage: project.stage, type: project.type }));
        expect(said.some((one: string) => one.startsWith('type:'))).toBe(true);
        expect(said.some((one: string) => one.startsWith('stage:'))).toBe(true);
        expect(project.stage).toBeUndefined();
        expect(project.type).toBeUndefined();
    });

    it('C21 no stage carries new_idea', () => {
        const root = scratchDir('oculus-o61-idea2-');
        const base = configFor();
        const stages = Object.fromEntries(Object.entries((base.merged as any).stages ?? (base.merged as any).types ?? {}).map(([word, row]: [string, any]) => [word, { ...row, new_idea: undefined, idea: undefined }]));
        const merged = { ...base.merged, stages, types: stages };
        const out = createIdea(root, { ...base, merged, scan: [{ dir: 'projects/ideas' }], newProjectDir: { projects: 'projects/ideas' } } as never, { id: 'new-idea', title: 'New', tier: 'projects' });
        const text = out.changed.length > 0 ? readFileSync(join(root, out.changed[0]), 'utf8') : JSON.stringify(out);
        console.log('C21', JSON.stringify(text));
        expect(text).not.toMatch(/^(stage|type):/m);
    });

    it('C22 the Present deck of ideas', () => {
        const hub = plantScratch('oculus-o61-deck-', {
            'projects/active/a/project.yml': 'id: a\ntitle: A\ntier: projects\nstage: nascent\n',
            'projects/active/b/project.yml': 'id: b\ntitle: B\ntier: projects\nstage: building\n',
            'projects/active/a/present/present.yml': "deck: { title: A }\norder: [main.md]\n",
            'projects/active/a/present/main.md': '# A\n',
            'projects/active/b/present/present.yml': "deck: { title: B }\norder: [main.md]\n",
            'projects/active/b/present/main.md': '# B\n',
            'deck/present.yml': "deck: { title: P }\ngroups:\n  ideas:\n    find: { folders: projects/*/*/present, stages: [nascent, scoping, de-risking] }\n    discover: true\norder:\n  - { kind: grid, of: ideas, title: Ideas }\n"
        }, ['projects/active']);
        const config = { ...CONFIG, portfolioDeck: 'deck' };
        const { snapshot } = buildOneHub(hub, config);
        const projects = (Object.values(snapshot.entities.projects) as Project[]).map((one) => ({ ...one, id: 'hub:' + one.id.replace(/^hub:/, ''), root: 'hub' }));
        const deck = readDeck(
            { roots: [{ key: 'hub', dir: hub }] as never, primary: { key: 'hub', dir: hub }, config, projects } as never,
            'hub',
            'deck'
        );
        const grid = (deck as any).slides?.find((one: any) => one.kind === 'grid');
        console.log('C22', JSON.stringify(grid?.cards ?? deck));
        tones.setVocab(LOADED, { primary: null, lists: {} });
        const label = anyOf(tones as never, 'stageLabel') ?? tones.chipLabel;
        const drawn = (grid.cards as any[]).map((one) => [one.name, label(one.maturity ?? '')]);
        console.log('C22 drawn', JSON.stringify(drawn));
        expect(drawn).toEqual([['A', 'nascent (concept)']]);
    });
});
```
