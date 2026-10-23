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
