# Step O67 brief check (on main at 5d86c59d)

I read the brief `.scratch/migration/agents/briefs/O67.md`, `plan.md` lines 1-3 (Goal), 690-692 (the step line and its Step 0 bullets) and 2523-2536 (rulings 271, 272, 273, 278, 279, 280, 281, 282, 283 and "O67 before O55"), `agents/spec.md` and the files on the tree named below. `git rev-parse HEAD` printed `5d86c59d468539bc4c910e1d5fef52c6c95101bf`. `git status --short` printed ` M .scratch/migration/orchestrator-state.md`, ` M .scratch/migration/plan.md`, `?? .scratch/migration/agents/briefs/O67.md`. I changed nothing.

## 1. Names

Commands: `git grep -n -- holding_color|holdingTone|'holding'|holding -- src tests config docs README.md utils ':!config/local.yml'`, `git grep -nw` for each of nogo, disproved, abandoned, results-positive and numbers-pending, `git grep -nP "stage\s*:\s*['\"]?(idea|active|running|archived|accepted|paused|finished|nogo|dropped|disproved|abandoned)\b"`, `git grep -nE "'(idea|active|...)'" -- src`, `git grep -ln venue_id ... | wc -l` (28), `git grep -nP "\bpillar\b(?!s)"`, `git grep -niE "numbers pending|positive result|no-go|focus lane|Ideas lane|ideas backlog|idea backlog|the backlog"`, `git grep -nP "\.venue\b(?!Id|s)" -- src`, `git grep -nwE "backlog|unplaced|laneItems|movable|backlogTier" -- src`.

Findings:

1.1 Hits outside "Paths this step writes" that the change makes false or breaks. None of these names a changed word, so the "any other file under `src/`" line does not cover them:
- `src/lib/state/boards/board/items.ts:86` `item.venue?.text ?? project.venue ?? ''`, `src/lib/state/boards/project-context.ts:10` `if (found === undefined) return project.venue ?? '';` and `src/lib/state/workbench/palette.ts:177` `? project.venue`. All three read the `venue?: string` that item 6 removes from the model. The type check fails until they change, and none is on the path list.
- `src/lib/themes/derive.ts:86` "beside the full-width Ideas lane stay a CIEDE2000 of 10 apart". This becomes false once the backlog is the Backlog lane.

1.2 Hits covered only by the catch-all lines of the path list, which no grep of item 8 finds:
- `src/lib/views/boards/focus/Focus.svelte:18`, head comment: "the lanes each manifest's `focus:` puts it on, and the ideas backlog". False after the change. Item 8 has no grep for `focus`.
- `config/text/views/boards/focus.yml:76-77`: `unplaced_many: active projects not on the board (set <code>focus:</code>)` and `unplaced_one`, drawn by `src/lib/views/boards/focus/CommandCenterView.svelte:177-193`. This user-visible text tells the reader to set a key the step removes. It is false, the brief does not name it, and no grep of item 8 catches it.
- `config/schemas/manifest-schema.yml:40`, the `status.chips` help: "a situation such as blocked or numbers pending". This is the old chip label. The hyphenated grep `numbers-pending` misses it, and the text is false once the label is "numbers still to run".
- `docs/apps.md:375`: the `projects` row of the apps bridge lists `focus?` and `venue?`, which both leave the model. Item 8 asks apps.md only to say where the lane comes from, so this row is not named.
- `config/text/views/boards/focus.yml:97-98` `idea_backlog` and `ideas`: once the backlog draws its label and sub from its `focus_lanes:` row, `Lanes.svelte:254,262-263` no longer reads them, and they become orphan keys. The brief does not say to remove them.

1.3 Hits on the path list that the brief does not name and that become false:
- `config/catalogs/vocab.yml:51` (the `idea` flag: "the backlog of ideas on the Focus board") and `vocab.ts:41`, the same sentence.
- `vocab.ts:19`, the cluster description "now, parked or incubate". It is false once there is a `backlog` cluster.
- `vocab.ts:53`, `dead` "A dead or paused outcome". Item 1 names only the vocab.yml `dead` line.
- `vocab.yml:180` names `tests/checks/look/lane-distance.test.ts`. `ls tests/checks/look/` prints `contrast.test.ts themes.ts`, so that file does not exist on the tree. The rewrite of this head comment that item 3 asks for would carry the false path unless the brief says to drop it.
- `vocab.yml:180` (twice) and `:209` say "Ideas lane". Item 3 names only the first.
- `config/text/views/structure/pillars.yml:5` `archival_blurb` "(no-go / dropped / disproved / abandoned / paused)". The greps catch it, but the brief does not name it.
- `pillars.yml:14` "<code>pillar:</code> tag" and `config/text/views/structure/map.yml:13` "add pillar or related to manifests" name the old key.
- `config/text/views/system/audit.yml:42` `msg_no_venue` "no venue_id", and `docs/HELP.md:272` "every `venue_id` stays".
- `docs/templates.md`: `:497-499` (the stage list), `:504` (`numbers-pending`), `:696` ("The id a project's venue_id names", which is the venues registry help line ruling 282 names), `:716-717`, `:824` and `:832` (a project's `pillar`). Item 8 lists only `:506-507, :510, :524, :1193`.
- `tests/fixtures/hubs/demo/.oculus/data/pillars/pillars.yml:1` "each manifest's `pillar:`". It is under `tests/fixtures/hubs/demo/` but not in that line's parenthetical.
- `src/lib/state/boards/structure/lines.ts:101` "(nogo, dropped, disproved, abandoned, paused ...)" and `src/lib/state/shared/words/tones.ts:249` "(idea, active, archived) gives no mark". Every stage left after item 1 carries an icon, so the second sentence becomes false as well.

1.4 `docs/templates.md:1193` (`#    focus: ""`), which item 8 names, is the Position Lead template's `focus` field (`templates.md:1180` `- { field: focus, type: textarea, help: "What it is about." }`). It is not the manifest field and the change does not touch it.

1.5 Hits that stay true, other things with the same spelling: the `holding` uses in `src/lib/state/workbench/**`, `src/lib/server/machine/apps/host/manager.ts:133`, `lsp/relay/relay-*.ts` and `src/lib/state/sessions/latex/actions.ts:44`; the facet `pillar` (`board/facets.ts:32`, `filter-menu.ts:43`, `presets.ts:215`); the List cell `pillar` (`layout.yml:249,265,297`, `config/options/layout.yml:141`); the leads `focus` (`state/feeds/leads.ts:175`, `tests/server/edit/feeds.test.ts`); behavior.yml's `focus:` block; the collection statuses `accepted`, `dropped`, `finished`, `paused`, `archived`, `running` and `active` (`vocab.yml:122-163`); the debug, run and session `running`/`paused`; `CrossLinks.svelte:54-56` (glyph names); `config/text/server.yml:460-462` "go/no-go" (English).

## 2. The step line

Findings:

Each part of the step line, with the item of "What to build" that serves it:
- Each lane lists its stage words: item 3.
- Backburner and Blocked hold the cards with the chips `parked` and `blocked`: items 3 and 4.
- A drop writes the lane's first stage or adds the chip: item 4.
- `focus:` leaves the schema and the model: item 5.
- `holding`, `holding_color` and the literal `'holding'` go: items 3 and 4.
- The board drawn as now: item 4, last sentence.
- The six stages removed: items 1 and 7.
- `failed` and `stopped`: item 1.
- The archive folders: item 9 for the demo fixture; the code takes folder names from `archive_outcome`, so the code needs no change.
- The coauthor tier's `stopped` folder: item 1.
- `released`: items 1 and 7.
- The two chips: item 2.
- `venue` and `pillars`, and the dead read removed: item 6.
- Code, groups, catalogs, documents and fixtures: items 7, 8, 9 and 10.
- The hub and workspace rewrite at landing: the orchestrator's, stated in "What is on the tree" (brief line 23), with no builder item, which is correct.

Parts with no requirement, or a partial one:
- Ruling 282 "the venues registry's help line". The demo `venues.yml:1` comment is on the path list, but the template's help line `docs/templates.md:696` is not named (1.3). The hub's own registry is rewritten at landing.
- Ruling 280 "`published` covering accepted and to appear". No item says whether the `published` label, or the stage help at `manifest-schema.yml:36`, says so. Item 8's grep removes `accepted` from the help but nothing adds the meaning.
- "The board drawn as now" is not fully served by item 4, for three reasons:
  - The order of the backlog's cards: `backlog()` sorts by title (`focus.ts:255`), `laneItems` by deadline and then title (`focus.ts:191-198`), and the brief does not say which the Backlog lane keeps.
  - The Awaiting box (`focus.ts:302-326`) counts only projects "on lanes". With the backlog now a lane, nascent ideas would be counted, which they are not today ("a project ... in `holding` is in none", `focus.ts:287`).
  - The backlog summary's glyph (`Lanes.svelte:254`, `focus.ideas_glyph`) is not addressed.

## 3. Premises

Commands: `cat -n config/catalogs/vocab.yml`, `cat -n src/lib/state/boards/focus.ts`, `cat -n src/lib/views/boards/focus/lanes/Lanes.svelte`, `sed -n` over each cited range, `grep -n` over `layout.yml`, `wc -l` over the six sized files, the fixture `grep -rn` the brief quotes, `git grep -ln "focus:" -- tests`, and `grep -n "laneItems\|focus.ts" .scratch/migration/agents/guarded.md` (prints nothing, exit 1).

Findings:

Premises that hold:
- In `vocab.yml`: `stages:` rows 66-86 (21 rows); `chips:` :101 to :105; `focus_lanes:` :181-190 with nine lanes; `holding_color` :193 with its comment at :192; the tier flag comment :217; coauthor :224; `publication_kinds` :234; the statuses at :122-163.
- In `vocab.ts`: `:162`, `:272-277` and `:278-280`.
- In `focus.ts`: `isBlocked`, `holdingTone`, `backlogTier`, `laneItems`, `movable`, `backlog` and `unplaced`, each at the lines given.
- The ranges given in `Lanes.svelte`.
- `focus-lanes.ts:42`, and `ticker.ts:46,131,467,597-600`.
- `normalise.ts:257,279,283`, `model-entities.ts:339,368,423-428`, `merge.ts:136,145`, `validate.ts:108`, `audit/projects.ts:215` and `yaml-edit.ts:178`.
- `stats.ts:24-25,92`, `presets.ts:169`, `selectors.svelte.ts:489-492`, `forms/schema.ts:336,343,351` and `Projects.svelte:235`.
- `manifest.ts:590,676`, `manifest-schema.yml:15,42,55`, `focus.yml:97-99` and `config-folder.test.ts:221`.
- The `venue_id` file count of 28.
- The demo fixtures as described: 11 write `pillar:` and five write `venue_id:`.
- The sizes (353, 417, 244, 601, 721, 264), and the absence of `docs/adr`.

Line numbers that are off, with no effect on the step:
- The `stages:` head comment is :50-64; :65 is `stages:`.
- `tiers:` is :221, with rows :222-226.
- `laneShape` starts at `focus.ts:131`, not :138.
- The personal board's groups are `layout.yml:284-289` (brief: 283-288).
- The archive board's groups start at :269.

Premises that do not hold:
- 3.1 Brief line 17: "`git grep -n "\.venue\b" -- src` finds no other reader of a project's `venue`". False. `git grep -nP "\.venue\b(?!Id|s)" -- src` prints `src/lib/state/boards/board/items.ts:86`, `src/lib/state/boards/project-context.ts:10` and `src/lib/state/workbench/palette.ts:177`, all reading `project.venue`. This premise has to be quoted before any work on item 6.
- 3.2 Brief line 17: "12 demo fixture manifests" write `pillar:`. The fixture grep shows 11 manifests. The twelfth file the grep finds is `tests/fixtures/hubs/demo/.oculus/data/pillars/pillars.yml:1`, a comment. The brief's own line 19 says 11.
- 3.3 Brief line 15 lists `model-entities.ts:363` among the readers of the manifest `focus`. Line 363 reads "`stale_lag_days` under `focus:` of config/defaults/behavior.yml", which is the behavior section and stays.
- 3.4 Brief line 20 lists `tests/checks/config/config.test.ts`, `tests/data/sources/config/workspace-layer.test.ts` and `tests/server/edit/feeds.test.ts` as tests that name `focus` values:
  - `config.test.ts:418-449` is behavior.yml's `focus:` block.
  - `workspace-layer.test.ts:63-123` is the Focus page in `arrangements` and `rail`.
  - `feeds.test.ts:36,142-170` is the leads field.
  - Only `tests/data/snapshot/normalise.test.ts:77,262` and `tests/server/edit/writes.test.ts:647-657` name the manifest field.
  - The list also leaves out every test that writes a removed stage. The `git grep -nP "stage\s*:..."` above prints about 90 lines in about 30 test files, `stage: active` and `stage: idea` above all (for example `tests/data/sources/manifests/manifests.test.ts`, `tests/data/snapshot/relation-shapes.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, and `schema-rules.test.ts:271,277,315` itself).
- 3.5 Brief line 16: "so a drop writes `stage` and `status.chips` in one write". It is one call, but the call is not all or nothing. `writeManifest` pushes a refusal per field and `continue`s (`manifest.ts:410-450`), then writes the fields left in `wanted` (`manifest.ts:471-480`). A refused `status.chips` would still write `stage`.
- 3.6 Item 9's rule for a removed stage ("the stage its lane gives, else `in-prep` for a manuscript, `exploring` for other in-flight work") gives no answer for a manifest with no `focus:` at `idea`, `accepted`, `archived`, or at `paused` without a lane. Those are the inline manifests of 3.4 that item 10 sends to the same rule (for example `stage: idea` in `manifests.test.ts:55`, and `tests/data/snapshot/tier-stage.test.ts:25-34`).

## 4. Cases and checks

Findings:

- 4.1 "Any project dropped on Push: `stage: in-prep`" contradicts item 4's third bullet ("onto the lane the project sits on: nothing is written"). A `submit-ready` project sits on Push (`stages: [in-prep, submit-ready]`), so a drop there writes nothing.
- 4.2 The move cases, and the moves of item 4 in general, can be run by a case-run program only if the fields a move writes are computed by a function in `state/`. Item 4 names one state function for the lane and none for the write. The write sits today in `Lanes.svelte:176-183`, a component. Under spec.md "What every package obeys", a builder runs no page and a behaviour that needs a DOM is seen at the look; the principles say "a reader-visible behaviour is state, not a DOM side effect". As written, the five move cases fall to the look.
- 4.3 "the drop is refused and the lane does not light" depends on dragover and `preventDefault` (`Lanes.svelte:168-173`), which needs a DOM (spec.md "What every package obeys"). Only `movable` false can be run, and the brief does not say the lighting is checked at the look.
- 4.4 "A manifest with `stage: paused` or `stage: nogo`": the finding exists on the tree. `src/lib/data/snapshot/schema/record.ts:176-183` makes a `select` with `from: vocab.stages` an enum with `x-from`. `src/lib/data/snapshot/schema/check.ts:254-275` (case `'enum'`, `from` a string) gives `findings.schema.no_key`, `config/text/findings.yml:242` `'{0} is {1}, which is not a key of {2}'`. I expect, from reading only, "stage is paused, which is not a key of vocab.stages". This case checks code the step does not change (`check.ts`, `record.ts`), and on the unchanged tree it gives no finding, since `paused` and `nogo` are stages there.
- 4.5 "with `venue: tmlr` ... as `venue_id` does today" and "with `pillars: [graphs]` ... as `pillar` does today" compare with today's behaviour in `normalise.ts` and `merge.ts`, which the step changes. Both are consistent with spec.md.
- 4.6 Item 10's three new rows in `schema-rules.test.ts`: spec.md "What every package obeys" says an entry keeps "one row per input that gives a different outcome". The `focus`, `venue_id` and `pillar` rows each give the outcome the `authors` row gives (`findings.schema.not_declared` with another key). The table already holds `program` and `authors` side by side (`schema-rules.test.ts:268-279`), so the tree has a precedent. Whether three more rows of the same outcome meet the rule is the orchestrator's call.
- 4.7 Spec.md requires every key a step introduces to be checked empty, duplicated and colliding ("Every id or key a step introduces ..."). The new lane keys `stages` and `chips`, the cluster `backlog` and the chip `parked` have no such case (see 6). The chip `parked` also has the same spelling as the cluster key `parked` (`vocab.yml:185-187`), and `blocked` is a lane key, a chip and a chip flag.
- 4.8 The Conventions line "No word of the vocabulary is written in code: the lane function reads `stages`, `chips` and `cluster`". Item 4 needs code that tests `cluster === 'backlog'`, and `CLUSTERS = ['now', 'parked', 'incubate']` (`focus.ts:35`) already writes the cluster words. The brief does not say how the cluster `backlog` is read or whether it joins `CLUSTERS`.

## 5. The question

Findings:

- The lane cases (Review, Push, Backburner, Blocked, Backlog, no lane, `unplaced`): each could pass while the board still draws by `focus:`, since they run the function alone. What prevents that is item 5's removal of `focus?` from `Project`: `svelte-check` in `test:quick` would fail on any `.focus` read in `Lanes.svelte`, `stats.ts` or `Projects.svelte`. Item 4's "all read that one function" has no check of its own beyond that type error.
- The move cases: as written they cannot be run (4.2), so they pass only at the look. "Any project dropped on Push" would pass while a submit-ready project is demoted (4.1, 6.12).
- The manifest-key cases: the undeclared-key rows cannot pass while the fields are still declared. The resolution cases could pass while `merge.ts:136,145` still name `venue_id` and `pillar` in their reference findings, because no case covers a manifest with `venue: nowhere` (6.14).
- The new-project case: it cannot pass while `manifest.ts:676` writes `focus: holding`.
- The fixtures case: it cannot pass while a fixture keeps `focus:`, a removed stage or an old key, since each gives a new finding.
- Item 1: it could pass with `vocab.ts:41,53` false (1.3).
- Item 3: it could pass with `vocab.ts:19` and the missing test path in `vocab.yml:180` (1.3).
- Item 4: it could pass with the backlog's sort order and the Awaiting count changed (2). Nothing in the step's checks reads the List's Focus cell or the stats blocked count, so both are left to the look.
- Item 5: it could pass with `focus.yml:76-77` still saying "set `focus:`" (1.2).
- Item 6: it cannot pass the type check with the three `project.venue` readers outside the path list (3.1), so the builder would have to write outside the list or stop.
- Item 7: its grep passes only when the goal for groups is met.
- Item 8: it could pass with false text left (1.2, 1.3), since there is no `focus` grep and the hyphenated grep misses "numbers pending".
- Items 9 and 10: they could pass with item 9's rule undefined for `idea`, `accepted`, `archived` and `paused` (3.6), the builder choosing a stage that is not written down.
- The step's own check (`npm run diagrams && npm run test:quick`) could pass without the goal. No guarded entry covers the lanes or the moves (`guarded.md` grep prints nothing), so the suite says nothing about the lane, the moves or the board. Only the case runs and the look on landing do.

## 6. Implied inputs

Findings: each input is missing from "Cases" and has happened or costs something if answered wrong.

- 6.1 Two lanes in a hub's `focus_lanes:` hold the same stage. Item 4 says "the lane whose `stages` holds its stage". The expected result to state: the first in `focus_lanes:` order. A drop onto the second lane then writes the stage and the card lands on the first, so the drop seems to do nothing.
- 6.2 A lane row with both `stages` and `chips`: item 4's first two bullets both apply, and they conflict (one removes `parked` and `blocked`, the other adds a chip). The expected result has to be stated, for example a finding for such a row, or one defined write.
- 6.3 An empty `stages: []` (or a row with neither key): "`stage` is that lane's first stage" is undefined, and `writeManifest(id, { stage: undefined })` may clear a required field. The expected result to state: the drop is refused (`movable` false), or nothing is written.
- 6.4 A card on Blocked that carries `parked` too, dropped on Backburner: item 4 adds `parked` (already carried), so nothing changes and the card stays on Blocked (decision 2). The drop seems to do nothing, which ruling 283 (4) set out to avoid. The expected result to decide: for example, a drop on a chip lane removes the other lane chip.
- 6.5 A card whose stage the target lane already holds, sitting on a chip lane (for example `submit-ready` with `blocked`, dropped on Push): item 4 writes `in-prep` and demotes the stage. The expected result to state: the stage is kept when the lane holds it, and the chips are cleared.
- 6.6 A drop whose write is refused in part: `status.chips` is refused (for example a hub whose `chips:` lacks `parked`) while `stage` is written (3.5). The expected result to state: the refusal on the outcome line, and either nothing written or both fields.
- 6.7 Undo of a drop: a drop now records two field changes (`manifest.ts:483-493`, one record per field). Whether the change log takes both back with one undo is not verified. The expected result to state.
- 6.8 A project of the tier `software` or `coauthor` at an in-flight stage. Item 4 restricts only the backlog cluster, so such a project lands on that stage's lane with no one placing it. In the hub (a loop over every `project.yml` printing tier, stage and focus), one coauthor project sits at `in-prep` and one at `submitted`, both placed by `focus:` today. The expected result to state: on the lane, as item 4 implies.
- 6.9 The lane menu for a project of a tier without `backlog`: the expected result is the nine other lanes and no Backlog. Only the drop is in Cases.
- 6.10 A chip that names no lane (`admin-prep` alone): the expected result is the lane of its stage. This is low cost and covered in part by the `[parked, admin-prep]` case.
- 6.11 A hub whose `focus_lanes:` has no `backlog` row: nascent projects of a backlog tier sit on no lane and are not `unplaced`, which requires `live`. They leave the board without a word, the case decision 3 guards against for live work. The expected result to state.
- 6.12 The backlog's order and the Awaiting box (2): the expected result is title order as now, with backlog cards left out of the Awaiting tallies as now, or the change stated.
- 6.13 The hub audit's folder rule with the renamed folders. `folderStage` (`audit/projects.ts:296-304`) gives no stage for a folder that no `archive_outcome` stage or `stage_folders` entry names. So an archive project left under `archive/nogo/` at `stage: failed`, or a coauthor project under `coauthor/abandoned/`, gets no folder finding. Expected:
  - `archive/failed/` at `failed`: no finding.
  - `archive/failed/` at `published`: the mismatch finding.
  - An unrenamed folder: silent.
  The cost falls on the landing rewrite, which no check would catch.
- 6.14 A manifest with `venue: nowhere` or `pillars: [nowhere]`: the expected result is the reference finding naming the key `venue` or `pillars` (`merge.ts:136,145`), not `venue_id` or `pillar`.
- 6.15 The website publication audit with `stopped` covering dropped work: no change in behaviour. A dead-end stage is skipped before `expectedSections` (`audit/publications.ts:181`) and reported by `msg_site_deadend` as `dropped` already was (`:235-251`). The row `{ kind: [abandoned-papers], stages: [stopped] }` is never consulted for a stage that is not `public`. No case is needed.

## 7. ADRs

Findings: `ls docs/adr` prints `ls: docs/adr: No such file or directory`. The repository has no ADR folder; this matches the brief.

## 8. Dictated text

Command: `grep -n "released:  \|failed:  \|stopped:  \|parked:  \|key: backlog\|results in, not written up\|numbers still to run\|Run \`stages\|stages: \[nascent\]" .scratch/migration/agents/briefs/O67.md`. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing (exit 1).

Findings:

- Brief :33 `released: { label: released, icon: done, color: "#0d9488", terminal: true }`: holds.
- Brief :34 `failed: { label: "failed (no-go or disproved)", ... }`: holds against spec.md "The working rules" (Prose) and the ASCII gate. The label names `disproved`, which item 8's grep will hit and must judge as the English word.
- Brief :35 `stopped: { label: "stopped (dropped or abandoned)", ... }`: holds, with the same remark for `dropped` and `abandoned`.
- Brief :39, the labels "results in, not written up" and "numbers still to run": hold.
- Brief :42 `parked: { label: "parked (not being worked)", icon: black }`: holds. The brief gives no place for the row in `chips:`, whose order is the order the form offers them (`vocab.yml:99`). The word is also the cluster key `parked` (`vocab.yml:185-187`).
- Brief :45, the lane word lists: hold, and match ruling 281.
- Brief :48 `- { key: backlog, label: Backlog, sub: "idea backlog: drag onto a lane to start, or drop here to park", color: "#b5638a", cluster: backlog }`: holds the character rules, but under the step's own rule its sub is false. A drop on Backlog writes `stage: nascent` and removes `parked` (item 4, first bullet), while "park" now names the chip `parked` and Backburner. Spec.md "What every package obeys" says "A sentence in a document or a head comment that the change makes false is a defect of the change". Ruling 283 (2) (a) dictates `sub: <the backlog line>`, so this is a clash between the ruling's text and that rule, for Axel to resolve.
- The fenced row at :48 lacks `stages: [nascent]`, which :51 then adds, so the dictated row is not the row to be written.

## Declined to judge

- No case was run, by design: I made no change and ran no program. The finding text in 4.4 comes from reading the code, not from a run.
- Whether the change log groups the two records of a drop (6.7): not verified. I read only `changes.ts:298-335`, where only `deck-edit` acts are named as grouped.
- The drawing of the board (the backlog's glyph and the look of the full-width lane): a look question, not judged.
- The hub and workspace rewrite at landing: the orchestrator's work, outside the brief's build; I only counted the hub's manifests by tier, stage and focus (6.8).
- The libraries line ("None found"): not checked.
- Whether each of the roughly 30 test files that write a removed stage asserts something the rewrite would change: not read file by file.
- `docs/diagrams/`: not regenerated or read beyond the grep hits.

Agent usage: ac6a30fd8fba25176, claude-opus-5-5, 286213 tokens, 83 tool uses, 13 min 20 s.
