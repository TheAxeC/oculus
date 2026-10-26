# Step O87 brief check (on main at 27f4e04fc)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O87.md`. Pages are cited by section; code and grep hits keep `file:line`. The main checkout has uncommitted changes (`git status --short`: ` M .scratch/migration/orchestrator-state.md`, ` M .scratch/migration/plan.md`, ` M .scratch/migration/queue.md`, ` M docs/data-map.md`, `?? .scratch/migration/agents/briefs/O87.md`). Every line number below is from HEAD unless it says otherwise.

## 1. Names

- `fund_stages` (the two new keys are registered wherever it is): `grep -rn "fund_stages" src config docs tests --exclude=local.yml`. Every hit is inside the paths or is `docs/data-map.md`, which the Doc text covers. One more place is outside the repository's paths: `.scratch/migration/agents/guarded.md` G126 says "the lists `focus_lanes`, `roles`, `fund_stages`, `venue_categories`, `venue_tiers` and `radar_buckets` replaced whole". The change makes that list incomplete, and the new G126 rows of cases 4, 7 and 11 would test a guarantee the entry's text does not state. The file belongs to the orchestrator, and the brief does not say it changes.
- The words the zod shape `fundStage` is described with (`src/lib/data/shapes/catalog-files/vocab.ts:335-341`): "The words the stage is drawn with in the Focus Funding column." and "The statuses of a funding entry that place it in this stage." Item 1 asks for "one definition shared by the three keys", which makes both descriptions false for `position_stages` and `teaching_stages`. The file is in the paths, but item 1 does not name the rewording.
- `applications_open`, `education_open`, `applications_sent`: `grep -rn "applications_open\|education_open\|applications_sent" src tests docs config --exclude=local.yml`. Every hit is inside the paths, including `focus.ts:575` (comment), `focus-lanes.ts:186-187`, `rail-badges.svelte.ts:269,274`, `filter.ts:474` and `hub-vocab.test.ts:161,166`. Several sentences describe these keys without naming them, all outside the paths, and the change makes each false:
  - `docs/HELP.md:529`: "`focus:` (the Focus horizons, the Command Center's categories and sources, the statuses the Focus columns count as open)". The brief writes only HELP lines 294 and 538.
  - `config/defaults/behavior.yml:36`: "The sections it draws, its horizons, thresholds and cadences, and the lists of statuses its command center and its columns read." The three keys are the only status lists under `focus:`, and the paths cover only lines 55-63.
  - `config/options/sources.yml:80` "the Focus band's positions column lists the file's open entries", `:83` "the Focus band's teaching column lists the file's running entries" (it will also hold `planned`), `:86` "the Awaiting box lists the file's entries that are out for a decision" and `:89` "the file's view counts its open entries". The file is not in the paths.
- `deadline_horizon_days` (decision 3 takes the tasks file out of it): `config/options/behavior.yml:161` reads "How many days ahead the week's ticker lists a dated item, among them ... the dated entries of talks, teaching, tasks, positions and joint work." That becomes false for tasks. It is outside the paths, which cover 180-201 only.
- `ticker:` and `ticker_categories` described as command center groups. After the change the tasks file's dated lines are never Command Center lines, so its `ticker: { category: task }` no longer names a Command Center group. These hits outside the paths become partly false: `config/catalogs/vocab.yml:202` "The command center's deadline categories, in the order it groups its dated lines" (the paths cover 190-200), `docs/HELP.md:547` "`ticker:` the word of `ticker_categories` its command center lines carry", and `docs/templates.md:66` and `:276`. The `task` row stays read for the glyph and noun of Tasks rows.
- `deadline_met` on `statuses.applied`: `grep -rn "deadline_met\|deadlineMet" src tests config docs --exclude=local.yml`. Two readers change result:
  - `focus.ts:621-624`: a funding scheme whose status is `applied` would now be listed under the Awaiting box's Grants. The brief says nothing of this. `grep -h "^\s*status:" .oculus/data/academic/funding.yml | sort | uniq -c` in the hub shows no `applied` scheme today.
  - `src/lib/views/shared/forms/entry/task-card.ts:29` and `ticker.ts:278,312`: no change, since `applied` already carries `closes_deadline`.
- `focus.teaching_sub` "this academic year" (`config/text/views/boards/focus.yml:149`, in the paths). The column will hold `planned` teaching as well, and the brief changes only `jobs_sub`.
- `HUB_KEYS` (item 1): `grep -rn "\bHUB_KEYS\b\|OWN_HUB_KEYS" src tests docs` shows that no `HUB_KEYS` exists. The constant at `hub-keys.ts:11` is `OWN_HUB_KEYS`, "The keys of the hub list each hub's own settings file is read for". The keys a hub may set are `HUB_LIST` in `hub-names.ts:696`.
- `runsByKind`, `subtaskDated`, `CommandGroups`, `hasCommandRows`, `grp_subtask_dl_label`, the command center's `grp_followups_label`, `jobs_sub`: `grep -rn "runsByKind\|kindGroups\|subtaskDated\|grp_subtask_dl_label\|grp_followups_label\|jobs_sub" src tests config docs --exclude=local.yml`. Every hit is inside the paths. `runsByKind` (`ticker.ts:600`) has one caller, `CommandCenter.svelte:136` for `subtaskDated`, so it is left with no caller, and the `kindGroups` snippet (`CommandCenterView.svelte:151`) with no use. Verify item 5 would catch the export, but item 6 does not name either.

Findings:
- N1. G126's text in `agents/guarded.md` (the lists replaced whole) is left incomplete.
- N2. The shared `fundStage` descriptions become false, and item 1 does not say so.
- N3. Left false and outside the paths: `docs/HELP.md:529`, `config/defaults/behavior.yml:36`, `config/options/sources.yml:80,83,86,89` and `config/options/behavior.yml:161`.
- N4. Left partly false and outside the paths: `config/catalogs/vocab.yml:202`, `docs/HELP.md:547` and `docs/templates.md:66,276`.
- N5. An `applied` funding scheme joins the Awaiting box's Grants, and the brief does not state it.
- N6. `teaching_sub` "this academic year" stops being accurate.
- N7. Item 1 names a `HUB_KEYS` that does not exist.

## 2. The step line

- `position_stages` and `teaching_stages` in `vocab.yml` beside `fund_stages`, rows `{ label, color, statuses }`, each hub may set them as it sets `fund_stages`: item 1.
- The Positions column stacks applications by them (Active, Applied) and the Teaching column stacks teaching (Ongoing, Planned), as Funding stacks grants: item 2, with the rows in item 1.
- The Applications rail badge counts what the Positions column shows: item 3.
- `applied` carries `deadline_met`, and the Awaiting box lists applications by that flag, as it lists grants: item 4.
- The three keys leave `focus:` in `config/defaults/behavior.yml` and its options file: item 5.
- Ruling 446 (a), part 1: a dated subtask, a due follow-up and a dated tasks-file entry are drawn in Tasks with their date and tone, dated first by date and then undated, an overdue one included: item 6, bullets 1 and 2.
- Ruling 446 (a), part 2: the Command Center keeps the dates the user does not set, and its "Subtask deadlines" and "Follow-ups" groups go: item 6, bullets 3 and 4.
- Ruling 447 (built inside O87): the brief carries 446.

Findings: none.

## 3. Premises

All rerun at HEAD 27f4e04fc.

- `fund_stages` at `config/catalogs/vocab.yml:193-197`: `grep -n` gives the comment at 193, the key at 194 and the rows at 195-197. Matches.
- Registration list: `grep -rn "fund_stages" src config docs tests --exclude=local.yml` printed `vocab.yml:4,194`, `options/catalogs/vocab.yml:4,208`, `vocab.ts:418`, `vocab-keys.ts:212`, `hub-keys.ts:27`, `in-place.ts:66`, `hub-names.ts:684,720`, `HELP.md:538`, `templates.md:323,325`, `data-map.md:82,108`, `config-folder.test.ts:231`, `hub-vocab.test.ts:193,203`, plus readers in `focus-lanes.ts:5,128,139,143,184`. It matches the brief except for `data-map.md`. At HEAD, `git show HEAD:docs/data-map.md | grep -n "these [0-9]* keys"` prints `80:` and the `fund_stages:` row is at `106`. Lines 82 and 108 are the uncommitted working-tree `docs/data-map.md` (`git diff --stat`: `docs/data-map.md | 19 +++`). The count "49" is right: the doc's key block lists 49 keys, the same set as `HUB_LIST`.
- `options/catalogs/vocab.yml:208-221`: `sed -n 200,230p` shows the row from `fund_stages:` at 208 to `from: entry_statuses` at 221. Matches.
- `hub-keys.ts:27` described as "a key a hub's `.oculus/config.yml` may set": the line is in `OWN_HUB_KEYS`, the keys read per hub (`hub-keys.ts:10-11`). The description is wrong; the line number is right.
- `focus-lanes.ts`: `collectionLanes` 189-232, `stagesOf` 197-202, the stage loop 206-217, columns 218-225, `Band` 90-95, `stageItemCount` and `bandHasCards` 273-280 (file 280 lines). Matches.
- `Band.svelte` is 334 lines. Matches. Several line ranges are off by one or two: the stage blocks are `:167-192` (brief `:166-191`), the `column` snippet `:133-153` (brief `:135-153`), the two renders `:193-210` (brief `:192-209`), and the count `:66-68` (brief `:68-70`).
- `behavior.yml` focus keys: `grep -n` prints `57: linkedin_cadence_days`, `59:` the comment and `60-62` the keys. The brief's `:57-62` takes in `linkedin_cadence_days`. The options file's `:183-200` matches.
- Readers of the three keys: `focus-lanes.ts:224-225`, `focus.ts:625`, `filter.ts:474`, `rail-badges.svelte.ts:274` and `hub-vocab.test.ts:160-166`. `focusWords` is at `focus.ts:665`, and those are its only callers. Matches.
- The Awaiting box: grants at `focus.ts:621-624`, applications at `:625-629`, `statuses.applied` at `vocab.yml:154`. `submitted` and `under-review` carry `deadline_met` (`vocab.yml:110,129`). Matches.
- `ticker.ts` is 669 lines: `Ticker` 142-159, `ticker()` 183, the entry loop to 331, `taskGroups` 635-643, `CommandGroups` 654-657. Matches. The brief's account of `tasks` is incomplete: `ticker.ts:221-226,240-243` also put a project whose `deadline:` is not a date into `openEntries`, and so into `tasks` ("A deadline that is no date is open work and is a task line").
- `CommandCenterView.svelte:242-253`, `CommandCenter.svelte:133-153`, `rows.ts:254-259` and `:275-302`, `Tasks.svelte` 157 lines with `row(line, '')` at :37: all match.
- `filter.ts:290-294`, `:355-358`, `:437-441` (actual 292-293, 357-358, 439-440): match.
- `HELP.md:294` contains "Deadlines, due follow-ups and open subtasks are lines of the ticker". Matches.
- Hub data: in `~/workspace/research-hub`, `grep -h "^\s*status:" ... | sort | uniq -c` gives `applications.yml` 1 `active` and 1 `applied`, and `education.yml` 1 `ongoing` and 1 `planned`. The grep for the keys over `.oculus --exclude=local.yml` printed nothing. The workspace's other folders hold no `.oculus/config.yml`. Matches.
- `grep -n "ticker\|focus-lanes\|rail-badges\|Focus" agents/guarded.md`: no entry covers the ticker, the band, the Awaiting box or `rail-badges.svelte.ts`. G116 covers `countRow` in the separate `rail-badges.ts`. Matches.
- `ls -d docs/adr` prints "No such file or directory", and `.agents/plan.yaml` names no `adr`. Matches.
- Verify list: `orchestrator-state.md:6-7` `verify:` holds `- npm run test:quick`. Matches.
- Case 7's premise that a row behaves "as for `fund_stages`" does not hold. I ran a print-only probe with node `--experimental-strip-types`, through `withHub` of `tests/data/sources/config/layers/layers-fixture.ts`:
  - `fund_stages: [ { label: X, color: "#16a34a" } ]` (no `statuses`) gives findings `[]`.
  - `color: 5` gives `/scratch/lab/.oculus/config.yml | fund_stages.0.color | fund_stages.0.color must be a text`.
  - The merged `fund_stages` keeps both rows: `[{"label":"X","color":5,...},{"label":"Y","color":"#16a34a"}]`.
  - `focus-lanes.ts:129-137` reads every row, since `wordShape` and `fieldItemsShape` catch to `''` and `[]` (`shapes.ts:234,249`).
  So `statuses` is optional (`vocab.ts:338-341`), and a bad row is read, not left out.

Findings:
- P1. `docs/data-map.md:82` and `:108` are the working tree's numbers. At HEAD, which the brief says it was read on, they are 80 and 106.
- P2. `hub-keys.ts:27` is described as "a key a hub may set". It is in `OWN_HUB_KEYS`, the keys read per hub.
- P3. The `tasks` premise leaves out the undated project-deadline lines (`ticker.ts:240-243`).
- P4. `Band.svelte` and `behavior.yml` line ranges are off by one or two, as listed.
- P5. Case 7 asks for a finding on a row missing `statuses`, and for the row not to be read, "as for `fund_stages`". `fund_stages` gives no finding for a missing `statuses` and reads every row.

## 4. Cases and checks

- Cases 1, 2, 3, 5, 6, 8, 9, 10, 12 and 14 to 16: consistent with spec.md ("What every package obeys": case-run program, look on landing). Case 12 is runnable: the probe gives `settings.focus.applications_open must be one of the items of the list entry_statuses` now, and `focus.invented_key is not an option; it is not applied` for an invented key.
- Case 4: consistent. The G126 row is red on the unchanged tree (probe: `key position_stages is not one the hub's settings file takes; it is not applied`). Its second half, "its entry `open` is under Open", is a `collectionLanes` case-run, not part of the G126 row.
- Case 7: inconsistent with item 1 ("the same row shape, one definition shared by the three keys") and with item 2 ("by one rule, the one `fund_stages` has now"). The shared shape has `statuses` optional and gives no finding for a missing one, and the band reads every row. Two ways to satisfy the case: change `fund_stages`' behaviour, which the brief does not ask for, or give the new keys a different shape, which item 1 forbids. G126's text says that for a value of the wrong kind "oculus's entry stands". Case 7 says instead that "the row is not read", which is a third behaviour.
- Case 11: consistent, given the options row keeps `from: entry_statuses` (item 1, "the same fields").
- Case 13: consistent. The tail and tone are a view property, seen at the look.
- Cases that ask the builder to check a place the step does not change: none.
- Kept as tests: the G126 rows of cases 4, 7 and 11. That fits spec.md's test rule ("A test exists only as the test of one entry"), but G126's text does not name the two new keys (section 1).

Findings:
- C1. Case 7 contradicts items 1 and 2, the current `fund_stages` behaviour shown by the probe above, and G126's "oculus's entry stands".
- C2. G126's text needs the two keys for the new rows to test a stated guarantee.

## 5. The question

- Case 1: no. It needs both stages built from `position_stages`.
- Case 2: no.
- Case 3: no.
- Case 4: no.
- Case 5: no. It pins the per-hub rule.
- Case 6: no.
- Case 7: it cannot pass as written without changing `fund_stages` (section 4).
- Case 8: no for the column. It leaves open how the badge counts such an entry (section 6).
- Case 9: yes. With one hub and oculus's words, a badge that still reads only `selectors.collectionOf(key)`, the primary hub's collection (`selectors.svelte.ts:459-464`), under `selectors.configMap()` gives 2. In a two-hub workspace, or a hub with its own `position_stages`, that badge would differ from the column. "By the same function the band uses" is checked by no case.
- Case 10: yes for the filter. It checks `waiting()`. The filter's copy (`filter.ts:470-479`, what Mine only would hide) is exercised by no case, so a copy left reading an empty list passes every case.
- Case 11: no.
- Case 12: no.
- Case 13: no for the three kinds it names. It passes while the Tasks group loses the undated project-deadline line (section 6).
- Case 14: no.
- Case 15: no.
- Case 16: no.
- The step line: no. Each part has an item.
- Item 1: no for the registration. Verify 4 lists the places. The shared-shape descriptions can be left false (section 1).
- Item 2: no.
- Item 3: yes, as for case 9.
- Item 4: yes for the filter's copy, as for case 10.
- Item 5: no. Verify 3 greps the keys out.
- Item 6: yes in part. "`tasks` holds what this item lists" can drop the project lines whose deadline is not a date, and every case passes.
- Item 7: yes. HELP lines 294 and 538 can be done while HELP:529, `behavior.yml:36`, `options/sources.yml:80-89` and `options/behavior.yml:161` stay false (section 1).

Findings:
- Q1. Cases 9 and 10 and items 3, 4, 6 and 7 can pass without the goal, as shown above.

## 6. Implied inputs

This is a code step.

- A project whose `deadline:` is not a date (e.g. `deadline: TBD`). Today it is a Tasks line (`ticker.ts:240-243`). Missing. Expected: it stays in the Tasks group as an undated line, in the order undated lines have now. It has not happened in the hub (`grep -rh --include=project.yml "^deadline:"` shows 1 deadline, an ISO date). A wrong answer drops open work silently.
- A workspace of two hubs whose second hub holds an `active` application. The band counts it; `openCount` reads the primary's collection alone. Missing. Expected: the badge equals the Positions column's count (2 with one in each hub).
- A hub with its own `position_stages`, for the badge. Missing. Expected: the badge follows the hub's rows, as case 5 says for the column.
- An entry in two stages (case 8) and the badge. Missing. The column's `LaneHead` count, by `stageItemCount`, counts it twice. Expected: needs a ruling; counting the entry once and the column head twice would break "counts what the Positions column shows".
- The badge under the Focus filter. Missing. The column is filtered; the badge is not. Expected: the badge counts the column unfiltered. This is a decision to state.
- A funding scheme with status `applied`. Missing. After item 4 it is listed under the Awaiting box's Grants (`focus.ts:621-624`). Expected: listed, as "as it lists grants" implies; the brief should say so.
- The Awaiting box's applications through the filter's copy. Missing. Expected: a hub filter that hides a hub holding an `applied` application makes `mineWouldHide` (`filter.ts:470-479`) true, as `waiting()` lists it.
- A dated entry of joint work (`ticker: { category: collab }`). Item 6 bullet 3 copies ruling 446's list, which leaves out joint work. Missing. Expected: it stays in the Command Center's Deadlines (Collaboration), since only the tasks file's entries move.
- A collection with `ticker: { undated: true }` but no `tasks: true`, or the reverse. Missing. Expected: only the collection flagged `tasks` moves to Tasks, as item 6 says. Low cost; no hub has one.
- A Command Center whose only lines were follow-ups and subtasks. Missing. Expected: `hasCommandRows` is false and the section is not drawn. That is a visible change for the look.

Findings:
- I1. Missing from Cases: the undated project-deadline line, the badge in a two-hub workspace and under a hub's own `position_stages`, the badge for an entry in two stages, the `applied` funding scheme, the filter's Awaiting copy, and the dated joint-work entry.

## 7. ADRs

- `ls -d docs/adr` prints "No such file or directory", and `grep -n "adr" .agents/plan.yaml` prints nothing. No record.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -c '[^ -~]' .scratch/migration/agents/briefs/O87.md` printed `0`.

- `` `position_stages`: `{ label: "Active", color: "#16a34a", statuses: [active] }`, `{ label: "Applied", color: "#0891b2", statuses: [applied] }` ``: `grep -n '{ label: "Active"'` gives line 37. Holds.
- `` `teaching_stages`: `{ label: "Ongoing", color: "#16a34a", statuses: [ongoing] }`, `{ label: "Planned", color: "#7c5cff", statuses: [planned] }` ``: `grep -n '{ label: "Ongoing"'` gives line 38. Holds.
- `focus.jobs_sub` reads "job applications": `grep -n '"job applications"'` gives lines 41 and 129. Holds.
- data-map "these 51 keys": `grep -n 'these 51 keys'` gives line 57. Holds; 49 + 2 = 51 checked against the doc's key block.
- The HELP:294 content: content, not verbatim. Holds: plain, ASCII, no em dash, no 'not X but Y'.
- The `vocab.yml:102` comment content, "`deadline_met` also lists an application in the Awaiting box": `grep -n "also lists an application in the Awaiting box"` gives line 45. Holds.
- The options help "naming the Focus Positions or Teaching column": `grep -n "help naming the Focus Positions"` gives line 39. Holds as prose. The column is drawn as "Job applications" (`focus.yml:128` `jobs_lane`), so "Positions" is not the name a reader sees.

Findings:
- D1 (from the last bullet). The options help names a column by a name the reader does not see.

## Declined to judge

- Whether the brief's paths overlap O84's, which is in flight (`.agents/worktrees/migration-O84*`): comparing paths with the briefs in flight is the session's step, not this check.
- Whether `planned` teaching fits under "this academic year", and what the badge should count for an entry in two stages: both are wording or design calls for the orchestrator or the user.

Agent usage: a6e177511c7ad4a33, claude-opus-5-5, 234620 tokens, 75 tool uses, 10 min 4 s.

## Closed

- N1, C2: the brief's premises say the orchestrator adds `position_stages` and `teaching_stages` to G126's text in `agents/guarded.md` at landing.
- N2: item 1 dictates the shared shape's two descriptions, naming no column.
- N3, N4: the premises list each sentence; item 7 has each rewritten, and the paths gain `config/defaults/behavior.yml` 34-37, `config/options/behavior.yml` 158-162, `config/options/sources.yml` 78-90, `config/catalogs/vocab.yml` to 205, `docs/HELP.md` 529 and 547, `docs/templates.md` 64-68 and 274-278. Compared with O84's paths (`config/options/sources.yml` 189-196, `docs/templates.md` 372-512 and 1055-1065): disjoint line ranges of shared files.
- N5: item 4 states that an `applied` funding scheme is listed under Grants; case 21.
- N6: item 2 has `focus.teaching_sub` read "running and planned"; decision 9.
- N7, P2: the premise names `OWN_HUB_KEYS` and `HUB_LIST`; item 1 names both.
- P1: the premise gives 80 and 106 at HEAD and 82 and 108 in the main checkout; item 7's Doc text says which.
- P3: the premise names the project lines whose `deadline:` is not a date; item 6 keeps them in Tasks; case 17.
- P4: the line ranges corrected (`Band.svelte` 167-192, 133-153, 193-210, 66-68; `behavior.yml` 59-62).
- P5, C1: case 7 rewritten to what `fund_stages` gives for the same rows: no finding for a missing `statuses` (the stage holds nothing), and the colour finding.
- Q1, I1: item 3 says the badge counts over every hub by each hub's words, an entry once, unfiltered; item 6 names joint work among what stays in the Command Center, `runsByKind` and `kindGroups` removed, and a Command Center with no line not drawn; cases 17 to 24; decisions 7 and 8.
- D1: item 1's options help names the Job applications and Teaching & supervision columns.
