# O144 report: a `period` type for when an entry happens

Everything in the brief is done. Item 10's hub rewrite is not applied to the research hub, as the task prompt says: the orchestrator applies it at landing, and its every change is in the section "Hub rewrite" below. `npm run test:quick` after the last change printed "every command passed".

## Open items

Copied verbatim from `.scratch/migration/orchestrator-state.md:184` (`sed -n 180,187p`):

- 672 (2026-11-04, O141's builder hand-back, ruling 667, `agents/reviews/O141-report.md`): ruling 667 rests on a lane colour in `vocab.yml` being able to bring every Focus pair that touches with every cluster open to a CIEDE2000 of 10 in every theme, and that is wrong. The builder's case-run program, rerun by the orchestrator with the same output, finds 7 such pairs under 10 on the base (Funding-Jobs, Funding-Run, Jobs-Push, Run-Push, Run-Review, Review-Scope, Scope-Idea), and its search over every set of recoloured headers and all 29 palette tones finds 0 assignments that meet the brief's three bars (bar 1, every open pair at 10 or more; bar 2, no pair at 10 or more falls under 10 and no pair under 10 gets closer, collapsed layouts included; bar 3, no theme token changes). Part of the cause is in the theme blocks: dracula gives `--c-blue`, `--c-slate` and `--c-grey` one value, `#6272a4` (`singles.css:97,106,107`), so Jobs-Push measures 0.0 there, and kanagawalotus puts gold and grey-d 4.9 apart. (a) O141 widened to the theme sheets: the theme blocks where two lane hues alias or sit under 10 get hues of their own, alongside lane recolours where they help, until every open pair is at 10 or more in every theme, bar 2 kept, each changed hue also measured at 10 or more against every status token on the hue and on `-txt` as O140 measured, and each touched head comment naming where its added hues come from. Pros: ends the cause, with the bars as ruled. Cons: authored theme colours change in several themes, and the other users of those hues (status chips, the git graph, the calendar) change with them; a look at landing in each touched theme. (b) Recolour under bar 1 alone, dropping bar 2: one of the 36 assignments that meet bar 1 (Jobs and Run in the red family, Scope teal). Pros: no theme file changes. Cons: Jobs and Run sit beside Blocked's red and Scope on Teaching's and Build's teal, so collapsed layouts get pairs at 0.0. (c) Only the comments rewritten to the measured state (7 open pairs and 19 collapsed-only pairs under 10): the lazy option; the headers stay too close. Recommended: (a).

## The cases' first run (the unchanged tree, before any change)

Run from the worktree root on the unchanged tree with `npx tsx <scratch>/cases.mts` (the program's source is below; the runs printed here are its output, copied from the run). C1 and C2 have no reader on the base; C3's base order is the text sort.

```
## C1
  error: readPeriod is not on this tree

## C2
  error: readPeriod is not on this tree

## C3
  input "2026-10-27/2026-10-30" "2026" "2025-09/2026-09" "2025-09/2025-12" "2025/.." 2025 "2025 - 2026" null
    -> 2025 "2025 - 2026" "2025-09/2025-12" "2025-09/2026-09" "2025/.." "2026" "2026-10-27/2026-10-30" null
  input null "2025 - 2026" 2025 "2025/.." "2025-09/2025-12" "2025-09/2026-09" "2026" "2026-10-27/2026-10-30"
    -> 2025 "2025 - 2026" "2025-09/2025-12" "2025-09/2026-09" "2025/.." "2026" "2026-10-27/2026-10-30" null
  input "2025-09/2025-12" null "2026-10-27/2026-10-30" "2025 - 2026" 2025 "2026" "2025/.." "2025-09/2026-09"
    -> 2025 "2025 - 2026" "2025-09/2025-12" "2025-09/2026-09" "2025/.." "2026" "2026-10-27/2026-10-30" null

## C4
  [status, date], date text: ev-2026, ev-2026-11-10, ev-2026-12, ev-2024, ev-2025, ev-2025-2026
  [status, when], when period: ev-2026, ev-2026-11-10, ev-2026-12, ev-2024, ev-2025, ev-2025-2026
  shipped sort funding: ["status","deadline"]
  shipped sort events: ["status","date"]
  shipped sort education: ["status","date"]
  shipped sort applications: ["status","deadline"]

## C5
  no finding

## C6
  events neurips-attending when "Sept. 2025": {"changed":["when"],"refused":[]}
  events neurips-attending when "2025-09/2026-09": {"changed":["when"],"refused":[]}
  the events file after: ["    when: 2025-09/2026-09"]
  manifest schema types: year text, cv.when undefined, cv.duration text
  manifest year "Sept 2025": {"changed":["year"],"refused":[]}
  manifest cv.when "2025 - 2026": {"changed":[],"refused":[{"field":"cv.when","reason":"the manifest schema does not name the field"}]}
  manifest cv.when "2025/2026": {"changed":[],"refused":[{"field":"cv.when","reason":"the manifest schema does not name the field"}]}
  manifest year "2027": {"changed":["year"],"refused":[]}
  period-b after: ["year: \"2027\""]

## C7
  {"when":"2026-11-10/2026-11-12"} -> ""
  {"when":"2026-10-27T11:00:00"} -> ""
  {"when":"2026-11"} -> ""
  {"when":2026} -> ""
  {"deadline":"2026-11-20","when":"2026-11-10"} -> "2026-11-20"
  {"date":"2026-11-10"} -> "2026-11-10"

## C8
  waiting statuses: ["submitted","pending","under-review"]
  with-when: status "submitted" but no date tracked
  without: status "submitted" but no date tracked

## C9
  2025 -> academic "held duration", experience "held duration"
  (the same "held duration" for each of the other seven values)

## C10
  A: date undefined
  B: date undefined
  C: date undefined
  D: date "2016-01-01 15:59:00-0400"

## C11
  Student p1: duration "Master of Science in Computer Science"
  Student p2: duration "Internship Student"
  Student p3: duration undefined

## C12
  experience: [{"title":"From record","location":"A place"},{"title":"Own when","when":"2018/2024","location":"A place"}]
  awards: [{"award":"Own when","when":2016,"location":"A city"},{"award":"From record","location":"A city"}]

## C13
  period-a: year undefined, cv {}
  period-b: year 2026, cv undefined
  findings of the two manifests: ["key cv.when is not declared by the schema of this file","stage \"drafting\" is not a word of the stages list","stage \"drafting\" is not a word of the stages list"]
  CV projects row: [{"title":"Period A"}]

## C14
  on 2026-11-04: live ["dated","dated and rolling","rolling alone","neither","text deadline"], expired []
    live dated: "2026-11-20"
    live dated and rolling: "2026-12-15"
    live rolling alone: no line
    live neither: no line
    live text deadline: "rolling (open)"
  on 2026-12-20: live ["rolling alone","neither","text deadline"], expired ["dated and rolling","dated"]
    live rolling alone: no line
    live neither: no line
    live text deadline: "rolling (open)"
    expired dated and rolling: "2026-12-15"
    expired dated: "2026-11-20"
  error: Cannot convert undefined or null to object

## C15
  findings: (the scratch hub's deck folder and five scan folders, the same as after the change)
  .oculus/data/academic/events.yml: date: text; deadline: date; duration: text
  .oculus/data/academic/education.yml: date: text; deadline: date; duration: text
  .oculus/data/academic/funding.yml: date: text; deadline: date; duration: text
  .oculus/data/academic/applications.yml: date: text; deadline: date
  .oculus/data/academic/career.yml: order.when: text; positions.duration: text; degrees.duration: text; awards.date: text; profiles.experience.content.duration: text; profiles.projects.content.duration: text; profiles.education.content.duration: text; profiles.teaching.content.duration: text; profiles.awards.content.date: text; profiles.letter.date: text
  .oculus/data/academic/leads.yml: date: date; deadline: text
  .oculus/data/literature/literature.yml: year: text (filter)
  .oculus/data/literature/radar.yml: year: text

## C16
  demo hub findings: 0
  old fields held:
    .oculus/data/academic/events.yml.entries[0].date = "2026-03-12"
    .oculus/data/academic/events.yml.entries[1].date = "2026-09-01"
    .oculus/data/academic/events.yml.entries[2].date = "2026-12"
    .oculus/data/academic/education.yml.entries[0].date = "2025-"
    .oculus/data/academic/education.yml.entries[1].date = "2025"
    .oculus/data/academic/funding.yml.entries[0].date = "2026"
    .oculus/data/academic/funding.yml.entries[1].date = "2025"
    .oculus/data/academic/applications.yml.entries[0].date = "2026-02"
    .oculus/data/academic/applications.yml.entries[1].date = "2025-11"
    .oculus/data/academic/career.yml.positions[0].duration = "2024 - now"
    .oculus/data/academic/career.yml.degrees[0].duration = "2019 - 2023"
    .oculus/data/academic/career.yml.awards[0].date = "2023-06-01 15:59:00-0400"
  demo sort funding: ["status","deadline"]
  demo sort events: ["status","date"]
  demo sort education: ["status","date"]
  demo sort applications: ["status"]

## C17
  deadline "2026-11": [{"field":"deadline","reason":"deadline takes a date written YYYY-MM-DD"}]
  by deadline: "2026-11-20" "2026-11-25" "2026-12-01" null

## C18 (the base code on the rewritten copies)
  rewrite warnings: none
  changed values: 511
  findings of the copy before the rewrite: 1, after: 33, new after: 33
    (14 "schema[...].type is period, which is not one of text, textarea, date, checkbox, select, tags, metalist, raw, records",
     2 "the collections entry sorts by date, a field the schema does not name" (education, events),
     16 "key cv.when is not declared by the schema of this file", 1 scratch deck folder)
  findings naming when, deadline, rolling or note after: 16 (the 16 cv.when findings)
  CV rows: every period text null (no `duration` and no `date` left to copy), students' rows the degree alone,
    "Oculus" (no row)

## C19
  filter findings of the templates' literature file: none
  year line: {"field":"year","type":"text","filter":true,"section":"Core","help":"The year it appeared, as a whole number."}
  error: text key not in the text catalog (config/text/): collection.status_facet
```

On reading: C14's last part (the template's leads schema and its findings) threw on the base, and C19's bar group was not reached on the base for the text-catalog error above, so the base has no bar order of `year` to set beside the changed tree's; C15's findings on the base are the six of the scratch hub only, the same six as after the change. C16's base run also prints the unchanged sorts of statements `["status","title"]`, people and organisations `["name"]`, resources `["kind","name"]`, tasks `["status","deadline"]` and literature `["title"]`.

No case of the brief was wrong, so no part was handed back.

## DONE / NOT DONE

| Item | State | Check and its last line |
|------|-------|-------------------------|
| 1. Reader of a period, order, G151 table test | DONE | `npx vitest run tests/data/helpers/period.test.ts`: `Tests  34 passed (34)` |
| 2. Type `period` in every list, check, editors, control, column | DONE | cases C5, C6, C19 below; the quick tier's svelte-check: `COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3. Sort | DONE | cases C3, C4, C17 |
| 4. Radar and audit | DONE | cases C7, C8 |
| 5. CV builder | DONE | cases C9 to C12, C18 |
| 6. Manifests and literature years | DONE | cases C6, C13, C19 |
| 7. Leads | DONE | case C14 |
| 8. Templates | DONE | case C15 |
| 9. Demo hub | DONE | case C16 |
| 10. Research hub rewrite | NOT DONE by the step, by the task prompt: the orchestrator applies it at landing | the section "Hub rewrite", from C18's run |
| 11. Docs and comments | DONE | the grep section below |
| Verify 1: `npm run diagrams`, then `npm run test:quick` | DONE | `test:quick: 245.5 s; every command passed` (see the lines below the table) |
| Verify 2: vitest of the named files | DONE | see "Tests run" below |
| Verify 3: ASCII gate over the 72 changed files (`git diff --name-only` and the untracked files, the ledger left out) | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof'` printed nothing, `perl exit 0` |
| Verify 4: YAML parse of every changed YAML file | DONE | `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]"`: `yaml exit 0` |
| Verify 5: `sh utils/unused-exports.sh` against `../O144-base/unused-exports.txt` | DONE | `diff` of the two outputs printed nothing, `diff exit 0` |
| Verify 6: lines over 100 columns | DONE | `git diff -U0 -- '*.ts' '*.svelte' | grep '^+' | awk 'length($0)>101'` prints one line, the string literal at `vocab.ts:222`, a description text prettier does not break, 139 columns now and 137 on the base; the long added lines of the YAML and Markdown files are one-line flow rows and one-line paragraphs, the files' own form (the base `config/defaults/sources.yml` has 39 lines over 100, `docs/templates.md` 240) |
| Prettier | DONE | `xargs npx prettier --check` over the changed files: `All matched files use Prettier code style!` |
| ESLint | DONE | `xargs npx eslint` over the changed `.ts` and `.svelte` files: `ESLINT-CLEAN` |

Tests run while building, each passing at its last run (`npx vitest run <files>`): `tests/data/helpers/period.test.ts`, `tests/data/hubs/website-files.test.ts`, `tests/data/snapshot/normalise.test.ts`, `tests/data/sources/career.test.ts`, `tests/data/sources/feeds.test.ts`, `tests/checks/source/keys.test.ts`, `tests/state/shared/hub-words.test.ts`, `tests/state/sessions/source/draft-entry.test.ts`, `tests/state/workbench/count-row.test.ts`, `tests/data/sources/collections.test.ts`, `tests/data/helpers/hub-names.test.ts`, `tests/views/shared/explorer/opening-apps.test.ts`, `tests/routes/docs/primary-key.test.ts`, `tests/checks/config/config-folder.test.ts`, `tests/checks/imports/cycles.test.ts`, `tests/checks/imports/order.test.ts` (`Test Files  16 passed (16)`, `Tests  263 passed | 2 skipped (265)`); `tests/data/snapshot/schema-rules.test.ts`, `tests/checks/config/templates.test.ts`, `tests/checks/config/config.test.ts`, `tests/checks/config/integrity.test.ts`, `tests/checks/config/arrangements.test.ts`, `tests/server/edit/writes.test.ts`, `tests/server/edit/writes-collection.test.ts`, `tests/server/edit/literature.test.ts`, `tests/server/edit/feeds.test.ts`, `tests/state/forms/record-values.test.ts`, `tests/state/forms/record-fields.test.ts`, `tests/state/system/settings/collection-fields.test.ts`, `tests/state/forms/entry-save.test.ts`, `tests/state/forms/new-entry.test.ts`, `tests/routes/docs/audit.test.ts`, `tests/routes/docs/literature.test.ts`, `tests/data/sources/manifests/manifests.test.ts`, `tests/data/sources/config/catalog/options.test.ts`, `tests/data/sources/config/catalog/options-schema.test.ts`, `tests/data/sources/config/boards.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, `tests/data/hubs/self.test.ts`, `tests/state/feeds/literature-merge.test.ts`, `tests/data/sources/config/layers/manifest-fields.test.ts`, `tests/state/boards/board/items.test.ts`, `tests/views/shared/forms/entry-add.test.ts`, `tests/checks/tree/boundaries.test.ts` (`Test Files  27 passed (27)`, `Tests  598 passed | 7 skipped (605)`); `tests/data/sources/config/layers/hub-vocab.test.ts` with the funding and options files (`Test Files  8 passed (8)`); `tests/routes/hubs/make.test.ts`, `tests/state/shared/hub-words.test.ts`, `tests/checks/config/config-folder.test.ts`, `tests/checks/config/templates.test.ts`, `tests/checks/tree/duplication.test.ts`, `tests/checks/tree/size.test.ts` (passed). These counts are from the runs while building; the evidence for the final tree is the quick tier below, which ran every test that reaches a changed file.

The quick tier's result lines, from the run after the last change (its output file starts with `uptime`: `load averages: 5.22 7.89 7.21`, and ends `exit 0`):

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (12.7 s)
ok      svelte-check (16.0 s): 1793762383407 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (129.3 s): Duration  113.02s (transform 49.39s, setup 0ms, import 129.26s, tests 293.67s, environment 4ms)
ok      vitest (165.8 s): Duration  150.44s (transform 82.41s, setup 0ms, import 216.42s, tests 372.71s, environment 9.14s)
ok      vitest slow (242.9 s): Duration  227.65s (transform 25.38s, setup 0ms, import 164.49s, tests 731.89s, environment 14ms)
test:quick: 245.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

Its selection lists `tests/checks/source/history.test.ts`, `tests/checks/tree/duplication.test.ts`, `tests/checks/tree/size.test.ts` and `tests/checks/source/comment-width.test.ts` among the checks it ran ("scans the source text of a changed file"), and `vitest checks` passed. `npm run test:quick` was started twice: the first run was stopped before its end, when a change to the tree followed it; the run above, after the last change, is the one that counts. `npm run diagrams` ran after the last source change and before that run (`stat`: the last of `docs/diagrams/*` is written at 1793762358, the last changed source file at 1793762340, and the quick tier's svelte-check line carries 1793762383407 ms). No other whole-suite command ran.

## The cases after the change

C1 to C3 are the rows of G151's table test, `npx vitest run tests/data/helpers/period.test.ts`, run after the quick tier: `Test Files  1 passed (1)`, `Tests  34 passed (34)` (12 reads, 21 refusals, 1 order). The test reads each C1 value to its precision, first day and last day (`expect.objectContaining({ precision, first, last })` for the start and the end, the end `null` for `2025/..`), reads each C2 value as `null`, and sorts the C3 list in three input orders with `periodValueOrder` to `2026-10-27/2026-10-30`, `2026`, `2025-09/2026-09`, `2025-09/2025-12`, `2025/..`, `2025`, `2025 - 2026`, `null`.

C4 to C19, `npx tsx <scratch>/cases.mts C4 C5 C6 C7 C8 C9 C10 C11 C12 C13 C14 C15 C16 C17 C19` on the changed tree, run after the quick tier; `diff` of its output against the run made before the last edits printed nothing:

```
## C4
  [status, date], date text: ev-2026, ev-2026-11-10, ev-2026-12, ev-2024, ev-2025, ev-2025-2026
  [status, when], when period: ev-2026-12, ev-2026-11-10, ev-2026, ev-2025-2026, ev-2025, ev-2024
  shipped sort funding: ["status","when","deadline"]
  shipped sort events: ["status","when"]
  shipped sort education: ["status","when"]
  shipped sort applications: ["status","deadline","when"]

## C5
  line 2: [entries[0].when] entries[0].when is 2025 - 2026, which is not a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09
  line 3: [entries[1].when] entries[1].when is 2026/2025, which is not a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09
  line 4: [entries[2].when] entries[2].when is 2026-02-30, which is not a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09

## C6
  events neurips-attending when "Sept. 2025": {"changed":[],"refused":[{"field":"when","reason":"when takes a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09"}]}
  events neurips-attending when "2025-09/2026-09": {"changed":["when"],"refused":[]}
  the events file after: ["    when: \"2026-03-12\"","    when: \"2026-09-01\"","    when: \"2025-09/2026-09\""]
  manifest schema types: year period, cv.when period, cv.duration undefined
  manifest year "Sept 2025": {"changed":[],"refused":[{"field":"year","reason":"year takes a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09"}]}
  manifest cv.when "2025 - 2026": {"changed":[],"refused":[{"field":"cv.when","reason":"cv.when takes a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09"}]}
  manifest cv.when "2025/2026": {"changed":["cv.when"],"refused":[]}
  manifest year "2027": {"changed":["year"],"refused":[]}
  period-b after: ["year: 2027"]

## C7
  {"when":"2026-11-10/2026-11-12"} -> "2026-11-10"
  {"when":"2026-10-27T11:00:00"} -> "2026-10-27"
  {"when":"2026-11"} -> ""
  {"when":2026} -> ""
  {"deadline":"2026-11-20","when":"2026-11-10"} -> "2026-11-20"
  {"date":"2026-11-10"} -> ""

## C8
  waiting statuses: ["submitted","pending","under-review"]
  without: status "submitted" but no period tracked
  with-date: status "submitted" but no period tracked

## C9
  2025 -> academic "2025", experience "2025"
  "2026-10-27/2026-10-30" -> academic "Oct. 2026", experience "Oct. 2026"
  "2025-09/2026-09" -> academic "Sep. 2025 - Sep. 2026", experience "Sep. 2025 - Sep. 2026"
  "2015-09/2024" -> academic "Sep. 2015 - 2024", experience "Sep. 2015 - 2024"
  "2026-01/.." -> academic "Jan. 2026 - Current", experience "Jan. 2026 - Current"
  "2023-05/2024-01" -> academic "May 2023 - Jan. 2024", experience "May 2023 - Jan. 2024"
  "2025-09/2025-12" -> academic "Sep. 2025 - Dec. 2025", experience "Sep. 2025 - Dec. 2025"
  "2026-10-27T11:00:00" -> academic "Oct. 2026", experience "Oct. 2026"

## C10
  A: date "2025-06-01 15:59:00-0400"
  B: date "2018-01-01 15:59:00-0400"
  C: date "2017-09-01 15:59:00-0400"
  D: date undefined

## C11
  Student p1: duration "Master of Science in Computer Science (2025 - 2026)"
  Student p2: duration "Internship Student (2021)"
  Student p3: duration "2025 - 2026"

## C12
  experience: [{"title":"From record","location":"A place","duration":"Sep. 2018 - 2024"},{"title":"Own when","location":"A place","duration":"2018 - 2024"}]
  awards: [{"award":"Own when","location":"A city","date":"2016"},{"award":"From record","location":"A city","date":"Feb. 2016"}]

## C13
  period-a: year 2025, cv {"when":"2022/.."}
  period-b: year 2026, cv undefined
  findings of the two manifests: ["stage \"drafting\" is not a word of the stages list","stage \"drafting\" is not a word of the stages list"]
  CV projects row: [{"title":"Period A","duration":"2022 - Current"}]

## C14
  on 2026-11-04: live ["dated","dated and rolling","rolling alone","neither","text deadline"], expired []
    live dated: "2026-11-20"
    live dated and rolling: "2026-12-15 | Rolling"
    live rolling alone: "Rolling"
    live neither: no line
    live text deadline: no line
  on 2026-12-20: live ["rolling alone","neither","text deadline"], expired ["dated and rolling","dated"]
    live rolling alone: "Rolling"
    live neither: no line
    live text deadline: no line
    expired dated and rolling: "2026-12-15 | Rolling"
    expired dated: "2026-11-20"
  the template's schema: deadline {"field":"deadline","type":"date","section":"Dates","help":"The deadline, a day."}
  findings: ["line 2: [entries[0].deadline] entries[0].deadline is rolling (open), which is not a day written YYYY-MM-DD"]

## C15
  findings:
    deck/present.yml [] deck folder deck is not in <scratch>/work/c15
    projects/active [scan] scan directory does not exist
    projects/archive [scan] scan directory does not exist
    projects/coauthor [scan] scan directory does not exist
    projects/ideas [scan] scan directory does not exist
    projects/manuscripts [scan] scan directory does not exist
  .oculus/data/academic/events.yml: when: period; deadline: date
  .oculus/data/academic/education.yml: when: period; deadline: date; students.when: period
  .oculus/data/academic/funding.yml: when: period; deadline: date
  .oculus/data/academic/applications.yml: when: period; deadline: date
  .oculus/data/academic/career.yml: order.when: period; positions.when: period; degrees.when: period; awards.when: period; profiles.experience.content.when: period; profiles.projects.content.when: period; profiles.education.content.when: period; profiles.teaching.content.when: period; profiles.awards.content.when: period; profiles.letter.date: text
  .oculus/data/academic/leads.yml: date: date; deadline: date; rolling: checkbox
  .oculus/data/literature/literature.yml: year: period (filter)
  .oculus/data/literature/radar.yml: year: period

## C16
  demo hub findings: 0
  old fields held: none
  demo sort funding: ["status","when","deadline"]
  demo sort events: ["status","when"]
  demo sort education: ["status","when"]
  demo sort applications: ["status","when"]
  (statements, people, organisations, resources, tasks and literature unchanged)

## C17
  deadline "2026-11": [{"field":"deadline","reason":"deadline takes a date written YYYY-MM-DD"}]
  by deadline: "2026-11-20" "2026-11-25" "2026-12-01" null

## C19
  filter findings of the templates' literature file: none
  year line: {"field":"year","type":"period","help":"The year it appeared.","section":"Core","filter":true}
  bar group of year: ["2026","2025-09","2024","2021"]
```

Read with each: C5's three findings sit at the entries named, and `when: 2025` and `"2025-09/2026-09"` give none. C8's "with-when" entry gives no finding; "without" and an entry holding only the old `date` give the new sentence. C14's text deadline reads as undated and gives the schema finding of a `date` field. C15's six findings are the scratch hub's own (no deck folder, no scan folders), the same six as on the base. C15 and C16 keep two fields named `date` that are no entry's period: the leads' `date`, the day the scout found the lead, and a career letter's `date`, the day the letter prints; the brief names neither as a field to rewrite.

C18 on the changed tree, with `O144_CHANGES=1 O144_CV=1 O144_SCHEMA=1 O144_RADAR=1`: the changes and CV rows are in "Hub rewrite"; its summary lines are:

```
  rewrite warnings: none
  changed values: 511
  findings of the copy before the rewrite: 21, after: 1, new after: 1
    new: deck/present.yml [] deck folder deck is not in <scratch>/work/c18-after
    gone: the four "the collections entry sorts by when, a field the schema does not name" of applications, education, events and funding
    gone: the scratch deck folder of the copy before
    gone: the 16 "key cv.duration is not declared by the schema of this file" of the manifests listed in "Hub rewrite"
  findings naming when, deadline, rolling or note after: 0
  CV rows whose period text is the same: 74, different: 28
  employer CV rows whose period text is the same: 40, different: 18
```

The one finding after the rewrite is the scratch copy's missing deck folder, which the copy before also has. The 21 findings before the rewrite are what the research hub gets from the step's code until the orchestrator applies the rewrite: the shipped sorts name `when`, which the hub's schemas do not hold yet, and the manifest schema no longer names `cv.duration`.

## The case-run program and every run

The program is two files in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o144-builder/`: `cases.mts` (the cases) and `rewrite.mts` (item 10's rewrite, applied to parsed copies in memory). It is run from the worktree root with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npx tsx <scratch>/cases.mts [case names]`; the switches `O144_CHANGES=1`, `O144_CV=1`, `O144_SCHEMA=1`, `O144_RADAR=1` print C18's change rows, every CV row, the schemas after the rewrite, and the radar days and card orders. It writes only under `<scratch>/work`, which it removes at its end (`scratch hubs removed: true` in every run). The runs:

1. On the unchanged tree, all cases: the first run above.
2. While building, single cases: C3, C6, C14 and C18 again after each piece they read was built, and C4 to C19 once more after the fixtures were done.
3. After the last change: C4 to C19 (above), and C18 with all four switches (the section "Hub rewrite" and "Visible changes").

`cases.mts` (656 lines; the fence is four backticks, since the source holds three):

````ts
// O144's case-run program: cases C1 to C19 of the brief, each printed with its input and what the
// tree's code answers. It is run from the root of the tree under test with `npx tsx <this file>`
// and imports that tree's modules, so one source runs on the base and on the step's tree. It
// writes no file of the tree: the hubs it builds are copies under this scratch folder, removed at
// the end. A function a tree does not have is printed as missing and its case goes on.
//
// The Svelte runes are stood in for by plain functions, so a state module that holds one loads
// outside the Svelte compiler; no case reads a rune's reactivity.

/* eslint-disable */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import * as R from './rewrite.mts';

const g = globalThis as any;
const rune = (value: unknown) => value;
(rune as any).raw = rune;
(rune as any).snapshot = rune;
g.$state = rune;
g.$derived = rune;
g.$derived.by = (run: () => unknown) => run();
g.$effect = () => undefined;
g.$effect.root = () => () => undefined;
g.$effect.pre = () => undefined;

const ROOT = process.cwd();
const SCRATCH = dirname(new URL(import.meta.url).pathname);
const WORK = join(SCRATCH, 'work');
const HUB = join(process.env.HOME ?? '', 'workspace', 'research-hub');
const SITE = join(HUB, 'side-projects', 'theaxec.github.io', '_data');
const only = new Set(process.argv.slice(2));
const YAML = createRequire(join(ROOT, 'package.json'))('yaml');

const imp = async (path: string): Promise<any> => {
    try {
        return await import(join(ROOT, path));
    } catch (error) {
        return { __missing: `${path}: ${(error as Error).message.split('\n')[0]}` };
    }
};
const show = (value: unknown): string => JSON.stringify(value);
const need = (mod: any, name: string): any => {
    if (typeof mod[name] !== 'function') throw new Error(`${name} is not on this tree`);
    return mod[name];
};

const dates = await imp('src/lib/data/helpers/dates.ts');
const configMod = await imp('src/lib/data/sources/config.ts');
const dataIndex = await imp('src/lib/data/index.ts');
const hubSchema = await imp('src/lib/data/snapshot/schema/hub.ts');
const check = await imp('src/lib/data/snapshot/schema/check.ts');
const json = await imp('src/lib/data/snapshot/schema/json.ts');
const cardOrderMod = existsSync(join(ROOT, 'src/lib/state/boards/collection/card-order.ts'))
    ? await imp('src/lib/state/boards/collection/card-order.ts')
    : await imp('src/lib/state/boards/collection/index.ts');
const bar = await imp('src/lib/state/boards/collection/bar.ts');
const focus = await imp('src/lib/state/boards/focus/focus-lanes.ts');
const audit = await imp('src/lib/server/content/audit/projects.ts');
const auditRulesMod = await imp('src/lib/server/content/audit/rules.ts');
const cv = await imp('src/lib/server/content/audit/website/cv.ts');
const leads = await imp('src/lib/state/feeds/leads.ts');
const entries = await imp('src/lib/server/edit/writes/entries.ts');
const manifestWrites = await imp('src/lib/server/edit/writes/manifest.ts');
const templates = await imp('src/lib/data/sources/documents/templates.ts');
const hubBuild = await imp('tests/fixtures/hubs/hub-build.ts');
const fieldMod = await imp('src/lib/data/snapshot/schema/field.ts');
const textMod = await imp('src/lib/state/shared/words/text.ts');

const engine = configMod.engineDir();
const DEMO = join(engine, 'tests', 'fixtures', 'hubs', 'demo');
const TEXT: Record<string, string> = configMod.textCatalog(configMod.loadConfig(engine).config);
const words = (key: string, ...args: unknown[]): string =>
    (TEXT[key] ?? key).replace(/\{(\d+)\}/g, (_, n) => String(args[Number(n)]));
const PAGE = readFileSync(join(engine, 'docs', 'templates.md'), 'utf8');

async function run(name: string, body: () => void | Promise<void>): Promise<void> {
    if (only.size > 0 && !only.has(name)) return;
    console.log(`\n## ${name}`);
    try {
        await body();
    } catch (error) {
        console.log(`  error: ${(error as Error).message.split('\n')[0]}`);
        if (process.env.O144_STACK === '1') console.log((error as Error).stack);
    }
}

/** An entry of a collection as the state modules read one. */
const entry = (title: string, fields: Record<string, unknown>, index = 0) => ({
    id: title,
    title,
    fields: { key: title, title, ...fields },
    file: '',
    index
});

/** The config of a hub folder, as the server reads it. */
const portfolioOf = (hub: string) =>
    dataIndex.portfolioConfigFrom(configMod.loadConfig(engine, { hub }).config);

/** A fresh folder under the scratch folder. */
function fresh(name: string): string {
    const dir = join(WORK, name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    return dir;
}

/** Write a file of a scratch hub, its folders made. */
function put(hub: string, rel: string, text: string): void {
    const file = join(hub, rel);
    if (!file.startsWith(WORK)) throw new Error(`${file} is outside the scratch folder`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
}

/** The findings of one hub's build. */
function findingsOf(hub: string): any[] {
    const built = hubBuild.buildOneHub(hub, portfolioOf(hub));
    return built.snapshot?.findings ?? built.findings ?? [];
}

/** The findings and the snapshot of one hub's build. */
function buildOf(hub: string): any {
    return hubBuild.buildOneHub(hub, portfolioOf(hub));
}

/** The findings a build hands back, wherever the build keeps them. */
function allFindings(built: any): any[] {
    const found = built.snapshot?.findings ?? built.findings;
    return Array.isArray(found) ? found : [];
}

const C1 = [2025, '2025', '2025-09', '2026-10-27', '2026-10-27T11:00:00', '2026-10-27T11:00:00Z',
    '2026-10-27T11:00:00+01:00', '2025-09/2026-09', '2026-10-27/2026-10-30', '2015-09/2024', '2025/..', '2024-02-29'];
const C2 = ['', '25', '2025-13', '2026-02-30', '2025-02-29', '2026-10-27T24:00:00', '2026-10-27T11:00',
    '2026-10-27T11:00:00/2026-10-28', '2026/2025', '2026-10/2026-09', '../2025', '2025?', '2025~', '2025-21',
    '2025-2026', '2025 - 2026', 'Sept. 2025', '2026-10-27 11:00', 20250, 999, 0];

await run('C1', () => {
    const read = need(dates, 'readPeriod');
    for (const value of C1) console.log(`  ${show(value)} -> ${show(read(value))}`);
});

await run('C2', () => {
    const read = need(dates, 'readPeriod');
    for (const value of C2) console.log(`  ${show(value)} -> ${show(read(value))}`);
});

await run('C3', () => {
    const order = need(cardOrderMod, 'cardOrder');
    const values: unknown[] = ['2026-10-27/2026-10-30', '2026', '2025-09/2026-09', '2025-09/2025-12', '2025/..', 2025, '2025 - 2026', undefined];
    const schema = [{ field: 'key', type: 'text' }, { field: 'when', type: 'period' }];
    const made = values.map((when, at) => entry(`e${at}`, when === undefined ? {} : { when }, at));
    for (const input of [made, [...made].reverse(), [made[3], made[7], made[0], made[6], made[5], made[1], made[4], made[2]]]) {
        const out = order(input, ['when'], schema).map((one: any) => show(one.fields.when ?? null));
        console.log(`  input ${input.map((one: any) => show(one.fields.when ?? null)).join(' ')}\n    -> ${out.join(' ')}`);
    }
});

await run('C4', () => {
    const order = need(cardOrderMod, 'cardOrder');
    const status = { field: 'status', type: 'select', options: ['upcoming', 'planned', 'completed'] };
    const events = [
        entry('ev-2026', { status: 'upcoming', date: '2026', when: 2026 }, 0),
        entry('ev-2026-11-10', { status: 'upcoming', date: '2026-11-10', when: '2026-11-10/2026-11-12' }, 1),
        entry('ev-2026-12', { status: 'upcoming', date: '2026-12', when: '2026-12' }, 2),
        entry('ev-2025', { status: 'completed', date: '2025', when: 2025 }, 3),
        entry('ev-2025-2026', { status: 'completed', date: '2025-2026', when: '2025-09/2026-09' }, 4),
        entry('ev-2024', { status: 'completed', date: '2024', when: 2024 }, 5)
    ];
    const titles = (list: any[]) => list.map((one) => one.title).join(', ');
    console.log(`  [status, date], date text: ${titles(order(events, ['status', 'date'], [status, { field: 'date', type: 'text' }]))}`);
    console.log(`  [status, when], when period: ${titles(order(events, ['status', 'when'], [status, { field: 'when', type: 'period' }]))}`);
    const sources = YAML.parse(readFileSync(join(engine, 'config', 'defaults', 'sources.yml'), 'utf8'));
    for (const one of sources.collections) {
        if (['events', 'education', 'funding', 'applications'].includes(one.key)) console.log(`  shipped sort ${one.key}: ${show(one.sort)}`);
    }
});

/** The findings of one document of entries against a schema made from `fields`, in memory. */
function docFindings(raw: any[], text: string): string[] {
    // The schema lines as the snapshot reads them (schema/field.ts `fieldsOf`), a lone
    // `foreign_key:` word made a list of one, and every list answered as unknown.
    const fields = fieldMod.fieldsOf(raw) ?? raw;
    const ctx = { lists: () => null, problems: [], at: 'schema.' };
    const schema = hubSchema.fileSchema(fields, { kind: 'entries', list: 'entries', written: [], own: false }, ctx);
    const texts = { mem: json.schemaText(schema) };
    const catalog = portfolioOf(DEMO).text;
    return check
        .checkDocument({ name: 'mem', file: '/mem.yml', text }, texts, check.createChecker(), catalog)
        .map((one: any) => `line ${one.line}: [${one.key}] ${one.message}`);
}

await run('C5', () => {
    const fields = [{ field: 'key', type: 'text', primary_key: true }, { field: 'when', type: 'period' }];
    const text = 'entries:\n  - { key: a, when: "2025 - 2026" }\n  - { key: b, when: "2026/2025" }\n  - { key: c, when: "2026-02-30" }\n  - { key: d, when: 2025 }\n  - { key: e, when: "2025-09/2026-09" }\n';
    const found = docFindings(fields, text);
    console.log(found.length === 0 ? '  no finding' : found.map((one) => `  ${one}`).join('\n'));
});

/** A copy of the demo hub under the scratch folder, with two manifests of the cases added. */
function demoCopy(name: string): string {
    const hub = fresh(name);
    cpSync(DEMO, hub, { recursive: true });
    put(hub, 'projects/manuscripts/period-a/project.yml', 'stage: drafting\ntier: research\nform: journal\ntitle: Period A\nyear: "2025-09"\nlead: [rivera-lab]\ncv:\n  when: "2022/.."\n');
    put(hub, 'projects/manuscripts/period-b/project.yml', 'stage: drafting\ntier: research\nform: journal\ntitle: Period B\nyear: 2026\nlead: [rivera-lab]\n');
    return hub;
}

await run('C6', () => {
    const hub = demoCopy('c6');
    const config = portfolioOf(hub);
    const write = need(entries, 'writeEntry');
    const outcome = (out: any) => show({ changed: out.changed, refused: out.refused });
    console.log(`  events neurips-attending when "Sept. 2025": ${outcome(write(hub, config, 'events', 'neurips-attending', { when: 'Sept. 2025' }))}`);
    console.log(`  events neurips-attending when "2025-09/2026-09": ${outcome(write(hub, config, 'events', 'neurips-attending', { when: '2025-09/2026-09' }))}`);
    const events = readFileSync(join(hub, '.oculus/data/academic/events.yml'), 'utf8');
    console.log(`  the events file after: ${show(events.split('\n').filter((line) => line.includes('when:') && !line.includes('field:')))}`);
    const types = need(manifestWrites, 'fieldTypes')(config.schema);
    console.log(`  manifest schema types: year ${types.year}, cv.when ${types['cv.when']}, cv.duration ${types['cv.duration']}`);
    const manifest = need(manifestWrites, 'writeManifest');
    console.log(`  manifest year "Sept 2025": ${outcome(manifest(hub, config, 'period-b', { year: 'Sept 2025' }))}`);
    console.log(`  manifest cv.when "2025 - 2026": ${outcome(manifest(hub, config, 'period-a', { 'cv.when': '2025 - 2026' }))}`);
    console.log(`  manifest cv.when "2025/2026": ${outcome(manifest(hub, config, 'period-a', { 'cv.when': '2025/2026' }))}`);
    console.log(`  manifest year "2027": ${outcome(manifest(hub, config, 'period-b', { year: '2027' }))}`);
    const b = readFileSync(join(hub, 'projects/manuscripts/period-b/project.yml'), 'utf8');
    console.log(`  period-b after: ${show(b.split('\n').filter((line) => line.startsWith('year')))}`);
});

await run('C7', () => {
    const date = need(focus, 'entryDate');
    const cases = [
        { when: '2026-11-10/2026-11-12' },
        { when: '2026-10-27T11:00:00' },
        { when: '2026-11' },
        { when: 2026 },
        { deadline: '2026-11-20', when: '2026-11-10' },
        { date: '2026-11-10' }
    ];
    for (const fields of cases) console.log(`  ${show(fields)} -> ${show(date(entry('x', fields)))}`);
});

await run('C8', () => {
    const rules = need(auditRulesMod, 'auditRules')(configMod.loadConfig(engine).config);
    console.log(`  waiting statuses: ${show([...rules.waitingStatus])}`);
    const collection = {
        id: 'applications',
        title: 'Applications',
        file: join(DEMO, '.oculus/data/academic/applications.yml'),
        schema: [{ field: 'status', type: 'select' }, { field: 'when', type: 'period' }],
        entries: [
            entry('with-when', { status: 'submitted', when: 2026 }, 0),
            entry('without', { status: 'submitted' }, 1),
            entry('with-date', { status: 'submitted', date: '2026' }, 2)
        ]
    };
    const raised: any[] = [];
    need(audit, 'collections')({ hub: DEMO, root: 'hub', primary: true, projects: [], collections: [collection], held: new Map(), self: new Set(), rules, catalog: TEXT }, (one: any) => raised.push(one));
    for (const one of raised.filter((f) => f.key === 'audit.msg_entry_no_date')) {
        console.log(`  ${one.where}: ${words(one.key, ...one.args)}`);
    }
    if (raised.length === 0) console.log('  no finding');
});

/** A CV built in memory from collections, a career file and projects. */
function cvOf(collections: any[], career: any, projects: any[] = [], people: any[] = []) {
    const input = { projects, collections, people, career, self: new Set() };
    const made = need(cv, 'built')(input);
    return { file: cv.cvFile(input, made), industry: cv.industryFile(input, made), problems: made.problems };
}

const C9 = [2025, '2026-10-27/2026-10-30', '2025-09/2026-09', '2015-09/2024', '2026-01/..', '2023-05/2024-01', '2025-09/2025-12', '2026-10-27T11:00:00'];

await run('C9', () => {
    const coll = { id: 'education', title: 'Education', entries: C9.map((when, at) => entry(`edu-${at}`, { cv_section: 'academic', when, duration: 'held duration' }, at)) };
    const career = { sections: { positions: C9.map((when, at) => ({ key: `pos-${at}`, title: `Position ${at}`, when, duration: 'held duration' })) } };
    const out = cvOf([coll], career);
    const academic = out.file.academic.content.map((row: any) => row.duration);
    const experience = out.file.experience.content.map((row: any) => row.duration);
    C9.forEach((when, at) => console.log(`  ${show(when)} -> academic ${show(academic[at])}, experience ${show(experience[at])}`));
});

await run('C10', () => {
    const career = { sections: { awards: [{ award: 'A', when: '2025-06-01' }, { award: 'B', when: 2018 }, { award: 'C', when: '2017-09' }, { award: 'D', date: '2016-01-01 15:59:00-0400' }] } };
    const out = cvOf([], career);
    for (const row of out.file.awards.content) console.log(`  ${row.award}: date ${show(row.date)}`);
});

await run('C11', () => {
    const people = ['p1', 'p2', 'p3'].map((id) => ({ id, name: `Student ${id}`, links: [] }));
    const coll = {
        id: 'education',
        title: 'Education',
        entries: [entry('sup', {
            cv_section: 'students',
            when: '2025/2026',
            students: [
                { person: 'p1', degree: 'Master of Science in Computer Science' },
                { person: 'p2', degree: 'Internship Student', when: 2021 },
                { person: 'p3' }
            ]
        })]
    };
    const out = cvOf([coll], null, [], people);
    for (const row of out.file.students.content) console.log(`  ${row.title}: duration ${show(row.duration)}`);
});

await run('C12', () => {
    const career = {
        sections: {
            positions: [{ key: 'pos', title: 'Position', location: 'A place', when: '2018-09/2024' }],
            awards: [{ key: 'aw', award: 'Award', location: 'A city', when: '2016-02-01' }],
            profiles: {
                shared: { location: 'A city' },
                emp: {
                    experience: { content: [{ title: 'From record', records: ['pos'] }, { title: 'Own when', records: ['pos'], when: '2018/2024' }] },
                    awards: { content: [{ award: 'Own when', records: ['aw'], when: 2016 }, { award: 'From record', records: ['aw'] }] }
                }
            }
        }
    };
    const out = cvOf([], career);
    console.log(`  experience: ${show(out.industry.profiles.emp.experience.content)}`);
    console.log(`  awards: ${show(out.industry.profiles.emp.awards.content)}`);
});

await run('C13', () => {
    const hub = demoCopy('c13');
    const built = buildOf(hub);
    const projects = Object.values(built.snapshot.entities.projects) as any[];
    for (const id of ['period-a', 'period-b']) {
        const project = projects.find((one) => one.id.endsWith(id));
        console.log(`  ${id}: year ${show(project?.year)}, cv ${show(project?.cv)}`);
    }
    const own = allFindings(built).filter((one) => String(one.file).includes('period-'));
    console.log(`  findings of the two manifests: ${own.length === 0 ? 'none' : show(own.map((one) => one.message))}`);
    const out = cvOf([], null, projects.filter((one) => one.id.endsWith('period-a')));
    console.log(`  CV projects row: ${show(out.file.projects.content)}`);
});

await run('C14', () => {
    const config = portfolioOf(DEMO).merged;
    const split = need(leads, 'splitLeads');
    const list = [
        { title: 'dated and rolling', deadline: '2026-12-15', rolling: true, status: 'open' },
        { title: 'rolling alone', rolling: true, status: 'open' },
        { title: 'neither', status: 'open' },
        { title: 'dated', deadline: '2026-11-20', status: 'open' },
        { title: 'text deadline', deadline: 'rolling (open)', status: 'open' }
    ];
    // The card's line as LeadCard.svelte draws it: `{#if deadline !== '' || expired}` and
    // `{deadline || t('leads.no_deadline')}`, `deadline` being `deadlineLine` on the step's tree
    // and the lead's `deadline` text on the base.
    const line = (lead: any, expired: boolean): string => {
        const held =
            typeof leads.deadlineLine === 'function'
                ? leads.deadlineLine(lead, words('leads.rolling'))
                : typeof lead.deadline === 'string' ? lead.deadline : '';
        return held !== '' || expired ? show(held || words('leads.no_deadline')) : 'no line';
    };
    for (const today of ['2026-11-04', '2026-12-20']) {
        const out = split(config, list, today);
        console.log(`  on ${today}: live ${show(out.live.map((one: any) => one.title))}, expired ${show(out.expired.map((one: any) => one.title))}`);
        for (const lead of out.live) console.log(`    live ${lead.title}: ${line(lead, false)}`);
        for (const lead of out.expired) console.log(`    expired ${lead.title}: ${line(lead, true)}`);
    }
    const block = /### \.oculus\/data\/academic\/leads\.yml[\s\S]*?```yaml\n([\s\S]*?)```/.exec(PAGE);
    const schema = YAML.parse(block?.[1] ?? '').schema;
    const found = docFindings(schema, 'entries:\n  - { title: text deadline, deadline: "rolling (open)", status: open }\n  - { title: rolling alone, rolling: true, status: open }\n');
    console.log(`  the template's schema: deadline ${show(schema.find((one: any) => one.field === 'deadline'))}`);
    console.log(`  findings: ${found.length === 0 ? 'none' : show(found)}`);
});

/** A hub as Make Folder a Hub writes it with every collection of the templates page, the career file added. */
function madeHub(): string {
    const hub = fresh('c15');
    const chosen = need(templates, 'collectionTemplates')(PAGE);
    put(hub, '.oculus/config.yml', templates.hubConfigText(PAGE, chosen));
    for (const one of chosen) put(hub, one.file, one.body);
    const career = /### \.oculus\/data\/academic\/career\.yml[\s\S]*?```yaml\n([\s\S]*?)```/.exec(PAGE);
    put(hub, '.oculus/data/academic/career.yml', career?.[1] ?? '');
    return hub;
}

const DATED = ['when', 'date', 'duration', 'deadline', 'year', 'rolling'];

/** The schema lines of a template naming a dated field, sub-fields included, as `path: type`. */
function datedLines(fields: any[], at = ''): string[] {
    return fields.flatMap((one) => [
        ...(DATED.includes(one.field) ? [`${at}${one.field}: ${one.type}${one.filter === true ? ' (filter)' : ''}`] : []),
        ...(Array.isArray(one.fields) ? datedLines(one.fields, `${at}${one.field}.`) : [])
    ]);
}

await run('C15', () => {
    const hub = madeHub();
    const found = allFindings(buildOf(hub));
    console.log(`  findings: ${found.length === 0 ? 'none' : ''}`);
    for (const one of found) console.log(`    ${relative(hub, String(one.file))} [${one.key}] ${one.message}`);
    for (const rel of ['events', 'education', 'funding', 'applications', 'career', 'leads'].map((one) => `.oculus/data/academic/${one}.yml`).concat(['.oculus/data/literature/literature.yml', '.oculus/data/literature/radar.yml'])) {
        const file = join(hub, rel);
        if (!existsSync(file)) {
            console.log(`  ${rel}: not written`);
            continue;
        }
        const schema = YAML.parse(readFileSync(file, 'utf8')).schema ?? [];
        console.log(`  ${rel}: ${datedLines(schema).join('; ')}`);
    }
});

/** Every entry or row of a parsed file holding `date`, `duration` or a When meta row, by path. */
function oldFields(value: unknown, at: string, out: string[]): void {
    if (Array.isArray(value)) value.forEach((one, index) => oldFields(one, `${at}[${index}]`, out));
    else if (value !== null && typeof value === 'object') {
        for (const [name, held] of Object.entries(value)) {
            if (name === 'schema') continue;
            if (name === 'date' || name === 'duration') out.push(`${at}.${name} = ${show(held)}`);
            if (name === 'label' && String(held).toLowerCase() === 'when') out.push(`${at} When row`);
            oldFields(held, `${at}.${name}`, out);
        }
    }
}

await run('C16', () => {
    const found = allFindings(buildOf(DEMO));
    console.log(`  demo hub findings: ${found.length}`);
    for (const one of found) console.log(`    ${relative(DEMO, String(one.file))} [${one.key}] ${one.message}`);
    const held: string[] = [];
    for (const rel of ['events', 'education', 'funding', 'applications', 'career', 'leads', 'tasks'].map((one) => `.oculus/data/academic/${one}.yml`)) {
        oldFields(YAML.parse(readFileSync(join(DEMO, rel), 'utf8')), rel, held);
    }
    console.log(`  old fields held: ${held.length === 0 ? 'none' : ''}`);
    for (const one of held) console.log(`    ${one}`);
    const config = YAML.parse(readFileSync(join(DEMO, '.oculus/config.yml'), 'utf8'));
    for (const one of config.collections) if (one.sort !== undefined) console.log(`  demo sort ${one.key}: ${show(one.sort)}`);
});

await run('C17', () => {
    const refused = need(entries, 'typeRefusals')([{ field: 'deadline', type: 'date' }], { deadline: '2026-11' }, TEXT);
    console.log(`  deadline "2026-11": ${show(refused)}`);
    const order = need(cardOrderMod, 'cardOrder');
    const made = ['2026-12-01', '2026-11-20', undefined, '2026-11-25'].map((deadline, at) => entry(`d${at}`, deadline === undefined ? {} : { deadline }, at));
    console.log(`  by deadline: ${order(made, ['deadline'], [{ field: 'deadline', type: 'date' }]).map((one: any) => show(one.fields.deadline ?? null)).join(' ')}`);
});

/** Every `project.yml` under a folder, dot folders left out, relative to the hub. */
function manifestsUnder(hub: string, dir: string): string[] {
    const out: string[] = [];
    const walk = (at: string): void => {
        for (const name of readdirSync(join(hub, at))) {
            if (name.startsWith('.') || name === 'node_modules') continue;
            const rel = join(at, name);
            const full = join(hub, rel);
            let isDir = false;
            try {
                isDir = statSync(full).isDirectory();
            } catch {
                continue;
            }
            if (isDir) walk(rel);
            else if (name === 'project.yml') out.push(rel);
        }
    };
    walk(dir);
    return out;
}

/** A copy of the research hub's settings, data files and manifests, rewritten when asked. */
function hubCopy(name: string, rewrite: boolean, changes: R.Change[]): string {
    const hub = fresh(name);
    put(hub, '.oculus/config.yml', readFileSync(join(HUB, '.oculus/config.yml'), 'utf8'));
    const data = join(HUB, '.oculus', 'data');
    const files: string[] = [];
    const walk = (at: string): void => {
        for (const one of readdirSync(join(data, at))) {
            const rel = join(at, one);
            if (statSync(join(data, rel)).isDirectory()) walk(rel);
            else files.push(rel);
        }
    };
    walk('');
    for (const rel of files) {
        const text = readFileSync(join(data, rel), 'utf8');
        const key = rel.replace(/^academic\//, '').replace(/\.yml$/, '');
        let out = text;
        if (rewrite && ['events', 'education', 'funding', 'applications', 'career', 'leads'].includes(key)) {
            const parsed = YAML.parse(text);
            if (key === 'career') {
                R.rewriteCareer(key, parsed, changes);
                parsed.schema = R.rewriteCareerSchema(parsed.schema);
            } else if (key === 'leads') {
                for (const lead of parsed.entries) R.rewriteLead(key, lead, changes);
                parsed.schema = R.rewriteLeadsSchema(parsed.schema);
            } else {
                for (const one of parsed.entries) R.rewriteEntry(key, one, changes);
                parsed.schema = R.rewriteSchema(key, parsed.schema);
            }
            out = YAML.stringify(parsed, { lineWidth: 0 });
        }
        put(hub, join('.oculus', 'data', rel), out);
    }
    for (const rel of [...manifestsUnder(HUB, 'projects'), ...manifestsUnder(HUB, 'side-projects')]) {
        const text = readFileSync(join(HUB, rel), 'utf8');
        let out = text;
        if (rewrite) {
            const parsed = YAML.parse(text);
            const before = changes.length;
            if (parsed !== null && typeof parsed === 'object') R.rewriteManifest(rel, parsed, changes);
            if (changes.length > before) out = YAML.stringify(parsed, { lineWidth: 0 });
        }
        put(hub, rel, out);
    }
    return hub;
}

/** The period text of a CV row: its duration, or an award's date. */
const periodOf = (row: any): unknown => ('duration' in row ? row.duration : row.date);
const titleOf = (row: any): string => String(row.title ?? row.award ?? row.name ?? '');

await run('C18', () => {
    const changes: R.Change[] = [];
    const before = hubCopy('c18-before', false, []);
    const after = hubCopy('c18-after', true, changes);
    console.log(`  rewrite warnings: ${R.warnings.length === 0 ? 'none' : ''}`);
    for (const one of R.warnings) console.log(`    ${one}`);
    console.log(`  changed values: ${changes.length}`);
    if (process.env.O144_CHANGES === '1') {
        for (const one of changes) console.log(`    | ${one.file} | ${one.at} | ${one.field} | ${show(one.old ?? null)} | ${show(one.now ?? null)} |`);
    }
    const keyOf = (one: any) => `${relative(one.file.includes('c18-before') ? before : after, String(one.file))} [${one.key}] ${one.message}`;
    const builtBefore = buildOf(before);
    const old = new Set(allFindings(builtBefore).map(keyOf));
    const built = buildOf(after);
    if (process.env.O144_RADAR === '1') {
        // The radar day of every collection entry that has one on either side, by `entryDate`.
        const days = (snapshot: any): Map<string, string> => {
            const out = new Map<string, string>();
            for (const coll of Object.values(snapshot.entities.collections) as any[]) {
                for (const one of coll.entries ?? []) out.set(`${coll.id} ${one.id}`, need(focus, 'entryDate')(one));
            }
            return out;
        };
        // The card order of the four views: the base's sorts on the copy before the rewrite (their
        // fields are text and date fields, whose order the step leaves as it was), the shipped
        // sorts on the copy after it.
        const sorts: Record<string, [string[], string[]]> = {
            events: [['status', 'date'], ['status', 'when']],
            education: [['status', 'date'], ['status', 'when']],
            funding: [['status', 'deadline'], ['status', 'when', 'deadline']],
            applications: [['status', 'deadline'], ['status', 'deadline', 'when']]
        };
        const order = need(cardOrderMod, 'cardOrder');
        for (const [key, [was, is]] of Object.entries(sorts)) {
            const one = (snapshot: any, sort: string[]): string => {
                const coll = snapshot.entities.collections[key];
                return order(coll.entries, sort, coll.schema).map((e: any) => e.id).join(', ');
            };
            console.log(`  ${key} before, by ${show(was)}: ${one(builtBefore.snapshot, was)}`);
            console.log(`  ${key} after, by ${show(is)}: ${one(built.snapshot, is)}`);
        }
        const [was, is] = [days(builtBefore.snapshot), days(built.snapshot)];
        console.log('  radar days, collection entry | before | after');
        for (const [key, day] of was) {
            const now = is.get(key) ?? '';
            if (day !== '' || now !== '') console.log(`    | ${key} | ${show(day)} | ${show(now)} |`);
        }
    }
    const now = allFindings(built).map(keyOf);
    const added = now.filter((one) => !old.has(one));
    console.log(`  findings of the copy before the rewrite: ${old.size}, after: ${now.length}, new after: ${added.length}`);
    for (const one of added) console.log(`    new: ${one}`);
    const gone = [...old].filter((one) => !now.includes(one));
    for (const one of gone) console.log(`    gone: ${one}`);
    const period = now.filter((one) => /\b(when|deadline|rolling|note)\b/.test(one));
    console.log(`  findings naming when, deadline, rolling or note after: ${period.length}`);
    for (const one of period) console.log(`    ${one}`);
    const { entities } = built.snapshot;
    const input = {
        projects: Object.values(entities.projects),
        collections: Object.values(entities.collections),
        people: Object.values(entities.people),
        career: entities.career,
        self: new Set()
    };
    const made = need(cv, 'built')(input);
    const file = cv.cvFile(input, made);
    const industry = cv.industryFile(input, made);
    const site = YAML.parse(readFileSync(join(SITE, 'data.yml'), 'utf8'), { schema: 'core' });
    let same = 0;
    let differ = 0;
    console.log('  CV rows, section | title | after the change | _data/data.yml now');
    for (const section of Object.keys(file)) {
        if (section === 'personal' || section === 'references') continue;
        const rows = file[section].content as any[];
        const held = (site[section]?.content ?? []) as any[];
        const unused = [...held];
        for (const row of rows) {
            const at = unused.findIndex((one) => titleOf(one) === titleOf(row));
            const match = at < 0 ? undefined : unused.splice(at, 1)[0];
            const a = periodOf(row);
            const b = match === undefined ? '(no row)' : periodOf(match);
            if (String(a) === String(b)) same += 1;
            else differ += 1;
            if (process.env.O144_CV === '1' || String(a) !== String(b)) {
                console.log(`    | ${section} | ${titleOf(row).slice(0, 70)} | ${show(a ?? null)} | ${show(b ?? null)} |`);
            }
        }
        for (const one of unused) console.log(`    | ${section} | ${titleOf(one).slice(0, 70)} | (no row) | ${show(periodOf(one) ?? null)} |`);
    }
    console.log(`  CV rows whose period text is the same: ${same}, different: ${differ}`);
    const siteIndustry = YAML.parse(readFileSync(join(SITE, 'industry.yml'), 'utf8'), { schema: 'core' });
    let isame = 0;
    const idiff: string[] = [];
    for (const [name, profile] of Object.entries(industry.profiles as Record<string, any>)) {
        for (const [section, part] of Object.entries(profile)) {
            if (!Array.isArray((part as any)?.content)) continue;
            const held = siteIndustry?.profiles?.[name]?.[section]?.content ?? [];
            ((part as any).content as any[]).forEach((row, index) => {
                const a = section === 'awards' ? row.date : row.duration;
                const theirs = held[index];
                const b = theirs === undefined ? undefined : section === 'awards' ? theirs.date : theirs.duration;
                if (a === undefined && b === undefined) return;
                if (String(a) === String(b)) isame += 1;
                else idiff.push(`| ${name}.${section}[${index}] | ${titleOf(row).slice(0, 50)} | ${show(a ?? null)} | ${show(b ?? null)} |`);
            });
        }
    }
    console.log(`  employer CV rows whose period text is the same: ${isame}, different: ${idiff.length}`);
    for (const one of idiff) console.log(`    ${one}`);
    if (process.env.O144_SCHEMA === '1') {
        for (const key of ['events', 'education', 'funding', 'applications', 'career', 'leads']) {
            const parsed = YAML.parse(readFileSync(join(after, '.oculus/data/academic', `${key}.yml`), 'utf8'));
            console.log(`  schema of ${key} after:`);
            for (const one of parsed.schema) console.log(`    - ${YAML.stringify(one, { collectionStyle: 'flow', lineWidth: 0 }).trim()}`);
        }
    }
});

await run('C19', () => {
    const hub = existsSync(join(WORK, 'c15')) ? join(WORK, 'c15') : madeHub();
    const found = allFindings(buildOf(hub)).filter((one) => String(one.key).includes('filter'));
    console.log(`  filter findings of the templates' literature file: ${found.length === 0 ? 'none' : show(found.map((one) => one.message))}`);
    textMod.setCatalog(TEXT);
    const raw = YAML.parse(readFileSync(join(hub, '.oculus/data/literature/literature.yml'), 'utf8')).schema;
    const schema = fieldMod.fieldsOf(raw) ?? raw;
    const year = schema.find((one: any) => one.field === 'year');
    console.log(`  year line: ${show(year)}`);
    const made = [2021, 2024, '2025-09', 2024, 2026].map((y, at) => entry(`p${at}`, { year: y }, at));
    const out = need(bar, 'collectionBar')({ entries: made, schemas: [schema], filters: {}, search: '', mine: false, config: {}, self: new Set(), hubs: [], noFunding: 0 });
    const group = out.groups.find((one: any) => String(one.id).includes('year'));
    console.log(`  bar group of year: ${group === undefined ? 'none' : show(group.items.map((one: any) => one.id ?? one.value ?? one.label))}`);
});

rmSync(WORK, { recursive: true, force: true });
console.log(`\nscratch hubs removed: ${!existsSync(WORK)}`);
````

`rewrite.mts` (464 lines):

```ts
// The hub rewrite of O144's item 10, applied in memory to parsed copies of a hub's files: each
// function takes a file's parsed value, changes it in place and returns the rows of what changed,
// so the case-run program prints them and builds a scratch hub from the changed copies.

/** One changed value: the file, the entry or row, the field, the value before and after. */
export type Change = { file: string; at: string; field: string; old: unknown; now: unknown };

type Map = Record<string, unknown>;

const MONTHS: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
    jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
};

const two = (n: number): string => String(n).padStart(2, '0');

/** One end written as text: a year, a month and a year, or an open end; null otherwise. */
function point(text: string): string | null {
    const t = text.trim();
    if (/^(current|present|now)$/i.test(t)) return '..';
    if (/^\d{4}$/.test(t)) return t;
    const m = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(t);
    if (m === null) return null;
    const month = MONTHS[m[1].toLowerCase()];
    return month === undefined ? null : `${m[2]}-${two(month)}`;
}

/** A period as the hub writes it after the rewrite: a lone year as a number, else text. */
function written(period: string): string | number {
    return /^\d{4}$/.test(period) ? Number(period) : period;
}

/**
 * A period text of the old fields (`date`, `duration`, a period inside `sub`): the period, and
 * the words beside it that are no period; null for a text that holds none.
 */
export function oldPeriod(value: unknown): { period: string; rest: string } | null {
    if (typeof value === 'number' && Number.isInteger(value)) return { period: String(value), rest: '' };
    if (typeof value !== 'string') return null;
    let text = value.trim();
    let rest = '';
    const paren = /^(.*?)\s*\(([^)]*)\)$/.exec(text);
    if (paren !== null) {
        text = paren[1];
        rest = paren[2];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { period: text, rest };
    const range = /^(\d{4})-(\d{4})$/.exec(text);
    if (range !== null) return { period: `${range[1]}/${range[2]}`, rest };
    const parts = text.split(/\s+-\s+/);
    if (parts.length === 2) {
        const [a, b] = parts.map(point);
        if (a === null || b === null || a === '..') return null;
        return { period: `${a}/${b}`, rest };
    }
    const one = point(text);
    return one === null || one === '..' ? null : { period: one, rest };
}

/** How fine a period's start is: a year 1, a month 2, a day 3, a day with a time 4. */
function fineness(period: string): number {
    const start = period.split('/')[0];
    if (start.includes('T')) return 4;
    return start.split('-').length;
}

/** The finer of two ends' texts, for the tie of two starts of one fineness. */
function endFineness(period: string): number {
    const end = period.split('/')[1];
    if (end === undefined) return 0;
    if (end === '..') return 5;
    return end.split('-').length;
}

/** A When meta row's value as a period, the words that are no period, or none for no period. */
function whenRow(text: string): { period: string; note: string } | null | 'none' {
    const t = text.trim();
    if (/^not scheduled$/i.test(t)) return 'none';
    let m = /^(\d{1,2})-(\d{1,2}) ([A-Za-z]+)\.? (\d{4})$/.exec(t);
    if (m !== null) {
        const month = two(MONTHS[m[3].toLowerCase()]);
        return { period: `${m[4]}-${month}-${two(Number(m[1]))}/${m[4]}-${month}-${two(Number(m[2]))}`, note: '' };
    }
    m = /^(\d{1,2}) ([A-Za-z]+)\.? (\d{4}), (\d{1,2}):(\d{2})$/.exec(t);
    if (m !== null) {
        const month = two(MONTHS[m[2].toLowerCase()]);
        return { period: `${m[3]}-${month}-${two(Number(m[1]))}T${two(Number(m[4]))}:${m[5]}:00`, note: '' };
    }
    m = /^([A-Za-z]+) (\d{4}) \(day TBC\)$/.exec(t);
    if (m !== null) {
        return { period: `${m[2]}-${two(MONTHS[m[1].toLowerCase()])}`, note: 'Day to be confirmed.' };
    }
    return null;
}

/** The text with a sentence added at its end, or the sentence alone. */
function withSentence(text: unknown, sentence: string): string {
    const held = typeof text === 'string' ? text.trim() : '';
    return held === '' ? sentence : `${held} ${sentence}`;
}

/** Whether a When meta row is one: a map labelled When. */
function isWhenRow(row: unknown): row is Map {
    return typeof row === 'object' && row !== null && String((row as Map).label ?? '').toLowerCase() === 'when';
}

/** Warnings: an entry whose fields disagree on the years of its period. */
export const warnings: string[] = [];

/** One collection entry's `when` from its `date`, `duration`, `sub` and When row, in place. */
export function rewriteEntry(file: string, entry: Map, changes: Change[]): void {
    const key = String(entry.key ?? entry.title);
    const found: string[] = [];
    if (entry.date !== undefined) {
        const read = oldPeriod(entry.date);
        if (read === null) warnings.push(`${file} ${key}: date ${JSON.stringify(entry.date)} reads as no period`);
        else found.push(read.period);
    }
    if (entry.duration !== undefined) {
        const read = oldPeriod(entry.duration);
        if (read === null) warnings.push(`${file} ${key}: duration ${JSON.stringify(entry.duration)} reads as no period`);
        else found.push(read.period);
    }
    let sub = entry.sub;
    if (typeof sub === 'string') {
        const parts = sub.split(' | ');
        const kept = parts.filter((part) => {
            const read = /\d{4}/.test(part) ? oldPeriod(part) : null;
            if (read === null || read.rest !== '') return true;
            found.push(read.period);
            return false;
        });
        if (kept.length !== parts.length) sub = kept.join(' | ');
    }
    let note = entry.note;
    let picked: string | null = null;
    let meta = entry.meta;
    if (Array.isArray(meta)) {
        const row = meta.find(isWhenRow);
        if (row !== undefined) {
            const read = whenRow(String(row.value));
            if (read === null) warnings.push(`${file} ${key}: When row ${JSON.stringify(row.value)} reads as no period`);
            else {
                meta = meta.filter((one) => one !== row);
                if (read !== 'none') {
                    picked = read.period;
                    if (read.note !== '') note = withSentence(note, read.note);
                    const day = typeof entry.date === 'string' ? entry.date : '';
                    const [start, end] = read.period.split('/');
                    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && end !== undefined && day >= start && day <= end && day !== start) {
                        note = withSentence(note, `On ${day}.`);
                    }
                }
            }
        }
    }
    if (picked === null && found.length > 0) {
        picked = [...found].sort((a, b) => fineness(b) - fineness(a) || endFineness(b) - endFineness(a))[0];
    }
    const years = new Set(found.map((one) => one.slice(0, 4)));
    if (picked !== null) years.add(picked.slice(0, 4));
    if (years.size > 1) warnings.push(`${file} ${key}: the fields name the start years ${[...years].join(', ')}`);
    const record = (field: string, old: unknown, now: unknown): void => {
        changes.push({ file, at: key, field, old, now });
    };
    if (picked !== null) {
        record('when', undefined, written(picked));
        entry.when = written(picked);
    }
    if (entry.date !== undefined) record('date', entry.date, undefined);
    if (entry.duration !== undefined) record('duration', entry.duration, undefined);
    delete entry.date;
    delete entry.duration;
    if (sub !== entry.sub) {
        record('sub', entry.sub, sub);
        entry.sub = sub;
    }
    if (meta !== entry.meta) {
        const removed = (entry.meta as unknown[]).find(isWhenRow) as Map;
        record('meta When row', removed.value, undefined);
        if ((meta as unknown[]).length === 0) delete entry.meta;
        else entry.meta = meta;
    }
    if (note !== entry.note) {
        record('note', entry.note, note);
        entry.note = note;
    }
    if (Array.isArray(entry.students)) rewriteStudents(file, key, entry, changes);
}

/** A supervision entry's students: each degree's years taken out, to the student's `when`. */
function rewriteStudents(file: string, key: string, entry: Map, changes: Change[]): void {
    const own = entry.when === undefined ? '' : String(entry.when);
    (entry.students as Map[]).forEach((student, index) => {
        const degree = student.degree;
        if (typeof degree !== 'string') return;
        let words = degree;
        let period: string | null = null;
        let m = /^(.*?) \(([^,)]*?),? ?(\d{4}) ?- ?(\d{4})\)$/.exec(degree);
        if (m !== null && m[2] !== '') {
            words = `${m[1]}, ${m[2].trim()}`;
            period = `${m[3]}/${m[4]}`;
        } else {
            m = /^(.*?) \((\d{4})-(\d{4})\)$/.exec(degree);
            if (m !== null) {
                words = m[1];
                period = `${m[2]}/${m[3]}`;
            } else {
                m = /^(.*?) (\d{4})$/.exec(degree);
                if (m !== null) {
                    words = m[1];
                    period = m[2];
                }
            }
        }
        if (period === null) return;
        const at = `${key}.students[${index}] (${String(student.person)})`;
        changes.push({ file, at, field: 'degree', old: degree, now: words });
        student.degree = words;
        if (period !== own) {
            changes.push({ file, at, field: 'when', old: undefined, now: written(period) });
            student.when = written(period);
        }
    });
}

/** A career row's `duration` as its `when`, the words that are no period added to its `about`. */
function rowPeriod(file: string, at: string, row: Map, changes: Change[], field: 'duration' | 'date', about: boolean): void {
    if (!(field in row)) return;
    const old = row[field];
    const stamp = typeof old === 'string' ? /^(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2}[+-]\d{4}$/.exec(old) : null;
    const read = stamp !== null ? { period: stamp[1], rest: '' } : oldPeriod(old);
    if (read === null) {
        warnings.push(`${file} ${at}: ${field} ${JSON.stringify(old)} reads as no period`);
        return;
    }
    changes.push({ file, at, field, old, now: undefined });
    changes.push({ file, at, field: 'when', old: undefined, now: written(read.period) });
    delete row[field];
    row.when = written(read.period);
    if (read.rest !== '') {
        if (!about) warnings.push(`${file} ${at}: words ${read.rest} have no about to go to`);
        const sentence = `${read.rest.charAt(0).toUpperCase()}${read.rest.slice(1)}.`;
        const now = withSentence(row.about, sentence);
        changes.push({ file, at, field: 'about', old: row.about, now });
        row.about = now;
    }
}

/** The career file's rows: positions, degrees, awards, the order of work and the profiles. */
export function rewriteCareer(file: string, career: Map, changes: Change[]): void {
    for (const list of ['positions', 'degrees']) {
        ((career[list] as Map[]) ?? []).forEach((row, index) => {
            rowPeriod(file, `${list}[${index}] ${String(row.key)}`, row, changes, 'duration', true);
        });
    }
    ((career.awards as Map[]) ?? []).forEach((row, index) => {
        rowPeriod(file, `awards[${index}] ${String(row.key)}`, row, changes, 'date', false);
    });
    ((career.order as Map[]) ?? []).forEach((row, index) => {
        const at = `order[${index}] ${String(row.task)}`;
        if (row.when === '' || row.when === null) {
            changes.push({ file, at, field: 'when', old: row.when, now: undefined });
            delete row.when;
            return;
        }
        const read = oldPeriod(row.when);
        if (read === null) {
            const quarter = typeof row.when === 'string' ? /^Q([1-4]) (\d{4})$/.exec(row.when) : null;
            if (quarter === null) {
                warnings.push(`${file} ${at}: when ${JSON.stringify(row.when)} reads as no period`);
                return;
            }
            const first = (Number(quarter[1]) - 1) * 3 + 1;
            const now = `${quarter[2]}-${two(first)}/${quarter[2]}-${two(first + 2)}`;
            changes.push({ file, at, field: 'when', old: row.when, now });
            row.when = now;
            return;
        }
        const now = written(read.period);
        if (now !== row.when) {
            changes.push({ file, at, field: 'when', old: row.when, now });
            row.when = now;
        }
    });
    const profiles = (career.profiles ?? {}) as Map;
    for (const [name, profile] of Object.entries(profiles)) {
        if (typeof profile !== 'object' || profile === null) continue;
        for (const [section, part] of Object.entries(profile as Map)) {
            if (typeof part !== 'object' || part === null || !Array.isArray((part as Map).content)) continue;
            ((part as Map).content as Map[]).forEach((row, index) => {
                if (typeof row !== 'object' || row === null) return;
                const at = `profiles.${name}.${section}[${index}]`;
                rowPeriod(file, at, row, changes, section === 'awards' ? 'date' : 'duration', true);
            });
        }
    }
}

/** A lead's deadline: a day stays, rolling words set `rolling`, every other word goes to `note`. */
export function rewriteLead(file: string, lead: Map, changes: Change[]): void {
    const old = lead.deadline;
    if (old === undefined || old === null) return;
    const text = String(old).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return;
    const at = String(lead.title).slice(0, 60);
    let day: string | undefined;
    let words = text;
    const lead_ = /^(\d{4}-\d{2}-\d{2}) \((.*)\)$/.exec(text);
    if (lead_ !== null) {
        day = lead_[1];
        words = lead_[2];
    }
    const closed = /deadline was (\d{1,2}) ([A-Za-z]+) (\d{2})'/.exec(text);
    if (closed !== null) {
        day = `20${closed[3]}-${two(MONTHS[closed[2].toLowerCase()])}-${two(Number(closed[1]))}`;
    }
    const rolling = /rolling|until filled/i.test(text);
    const note = `Deadline as posted: ${lead_ !== null ? words : text}.`;
    changes.push({ file, at, field: 'deadline', old, now: day });
    if (day === undefined) delete lead.deadline;
    else lead.deadline = day;
    if (rolling) {
        changes.push({ file, at, field: 'rolling', old: undefined, now: true });
        lead.rolling = true;
    }
    changes.push({ file, at, field: 'note', old: lead.note, now: note });
    lead.note = note;
}

/** A manifest's `cv.duration` as its `cv.when`. */
export function rewriteManifest(file: string, manifest: Map, changes: Change[]): void {
    const cv = manifest.cv as Map | undefined;
    if (cv === undefined || cv === null || !('duration' in cv)) return;
    const read = oldPeriod(cv.duration);
    if (read === null || read.rest !== '') {
        warnings.push(`${file}: cv.duration ${JSON.stringify(cv.duration)} reads as no period`);
        return;
    }
    changes.push({ file, at: 'cv', field: 'duration', old: cv.duration, now: undefined });
    changes.push({ file, at: 'cv', field: 'when', old: undefined, now: written(read.period) });
    const out: Map = {};
    for (const [name, value] of Object.entries(cv)) {
        if (name === 'duration') out.when = written(read.period);
        else out[name] = value;
    }
    manifest.cv = out;
}

/** The `when` line of the events, education and funding schemas. */
export const WHEN_LINE = {
    field: 'when',
    type: 'period',
    section: 'Dates',
    help: 'When it happens: a year, a month, a day or a span, such as 2025-09/2026-09 or 2025/..'
};

/** The `when` line of the applications schema. */
export const APPLIED_LINE = {
    field: 'when',
    type: 'period',
    section: 'Dates',
    help: 'When you applied: a year, a month or a day.'
};

/** A schema list with the field `name` replaced by `line`, or taken out when `line` is null. */
function replaced(schema: Map[], name: string, line: Map | null): Map[] {
    const out: Map[] = [];
    for (const one of schema) {
        if (one.field !== name) out.push(one);
        else if (line !== null) out.push(line);
    }
    return out;
}

/** A schema list with the help of the field `name` set to `help`. */
function helped(schema: Map[], name: string, help: string): Map[] {
    return schema.map((one) => (one.field === name ? { ...one, help } : one));
}

/** The schema of a collection file after the rewrite. */
export function rewriteSchema(name: string, schema: Map[]): Map[] {
    if (name === 'applications') {
        let out = replaced(schema, 'date', APPLIED_LINE);
        out = helped(out, 'deadline', 'an actual deadline if any (the `when` field above is when you applied)');
        return out;
    }
    let out = replaced(replaced(schema, 'date', WHEN_LINE), 'duration', null);
    if (name === 'education') {
        out = helped(out, 'sub', 'Institution and role.');
        out = out.map((one) =>
            one.field === 'students'
                ? {
                      ...one,
                      fields: [
                          ...((one.fields as Map[]).map((sub) =>
                              sub.field === 'degree' ? { ...sub, help: 'The degree, as the CV prints it.' } : sub
                          )),
                          { field: 'when', type: 'period', help: "When the student was supervised, where it differs from the entry's." }
                      ]
                  }
                : one
        );
    }
    if (name === 'funding') out = helped(out, 'sub', 'Scheme or role.');
    return out;
}

/** The fields of a records schema line with `old` replaced by `line`. */
function subReplaced(fields: Map[], old: string, line: Map): Map[] {
    return fields.map((one) => (one.field === old ? line : one));
}

/** The career file's schema after the rewrite. */
export function rewriteCareerSchema(schema: Map[]): Map[] {
    const rowWhen = { field: 'when', type: 'period', help: WHEN_LINE.help };
    const profileWhen = { field: 'when', type: 'period', help: 'When, when this CV prints it differently.' };
    const walk = (fields: Map[], inProfile: boolean): Map[] =>
        fields.map((one) => {
            let next: Map = one;
            if (Array.isArray(one.fields)) next = { ...one, fields: walk(one.fields as Map[], inProfile || one.field === 'profiles') };
            return next;
        });
    return walk(schema, false).map((one) => {
        if (one.field === 'order') {
            return { ...one, fields: subReplaced(one.fields as Map[], 'when', { field: 'when', type: 'period', help: 'When it is due.' }) };
        }
        if (one.field === 'positions' || one.field === 'degrees') {
            return { ...one, fields: subReplaced(one.fields as Map[], 'duration', rowWhen) };
        }
        if (one.field === 'awards') return { ...one, fields: subReplaced(one.fields as Map[], 'date', rowWhen) };
        if (one.field === 'profiles') {
            return {
                ...one,
                fields: (one.fields as Map[]).map((part) => {
                    if (!Array.isArray(part.fields)) return part;
                    return {
                        ...part,
                        fields: (part.fields as Map[]).map((sub) => {
                            if (sub.field !== 'content' || !Array.isArray(sub.fields)) return sub;
                            const old = part.field === 'awards' ? 'date' : 'duration';
                            return { ...sub, fields: subReplaced(sub.fields as Map[], old, profileWhen) };
                        })
                    };
                })
            };
        }
        return one;
    });
}

/** The leads schema after the rewrite: a day for the deadline, and the rolling flag and note. */
export function rewriteLeadsSchema(schema: Map[]): Map[] {
    const out: Map[] = [];
    for (const one of schema) {
        if (one.field === 'deadline') {
            out.push({ ...one, type: 'date', help: 'The deadline, a day.' });
            out.push({ field: 'rolling', label: 'Rolling', type: 'checkbox', section: 'Dates', help: 'Applications are read as they arrive, with or without a deadline.' });
        } else out.push(one);
    }
    out.push({ field: 'note', label: 'Note', type: 'textarea', section: 'Content', help: 'Notes on the posting.' });
    return out;
}
```

## Hub rewrite

The orchestrator applies this at landing to `/Users/axelfaes/workspace/research-hub`. Every row is from C18's run (`O144_CHANGES=1`), which applied `rewrite.mts` to copies of the hub's files read from disk; the rewritten copies load with no finding naming `when`, `deadline`, `rolling` or `note`, and with no rewrite warning. A year is written as a whole number (`when: 2025`), every other period as a quoted string. A field shown as "removed" is taken out of the entry.

### `.oculus/data/academic/applications.yml` (32 entries)

Every entry: `date: "<year>"` removed, `when: <year>` added. 2026: `vib-ai-group-leader`, `maastricht-predictive-brain`, `maastricht-clinical-epidemiology`, `maastricht-methodology-statistics`, `luxembourg-lcsb-biomedical-ai-mlops`, `ugent-bioml-doctor-assistent`, `defensie-reserve-officer`, `2026-hasselt-immunology-zap`, `2026-larian-engine-programmer`, `2026-guerrilla-senior-data-analyst`, `2026-uantwerpen-biomedical-data-science-zap`. 2025: `2025-twente-cancer-ai`, `2025-ucd-rwe-postdoc`, `2025-wageningen-fl`, `2025-oslo-ml-integreat`, `2025-uppsala-ml-theory`, `2025-twente-aneurysm`, `2025-maynooth-cs-zap`, `2025-hasselt-data-science-zap`, `2025-oslo-plague`, `2025-tilburg-eeg`, `2025-utrecht-nlp`, `2025-denmark-ai-zap`, `2025-kth-sign-language`, `2025-luxembourg-ai`, `2025-luxembourg-zap`, `2025-umea-precision-zap`, `2025-uppsala-precision-zap`, `2025-ucd-rwe-zap`. 2024: `2024-uhasselt-fl-bds`, `2024-lund-paleogenomics`, `2024-hasselt-neuroscience-zap`.

The file holds an uncommitted `note` change of Axel's (the brief), which the rewrite leaves as it is.

Schema after: the `date` line becomes `{ field: when, type: period, section: Dates, help: "When you applied: a year, a month or a day." }`, and the `deadline` help becomes `an actual deadline if any (the `when` field above is when you applied)`; every other line stays.

### `.oculus/data/academic/events.yml` (27 entries)

| Entry | Old | New |
|-------|-----|-----|
| `3mi-labs-talk` | When row "not scheduled" | When row removed, no `when` |
| `flta-2026` | `date: "2026-10-29"`, `duration: 2026`, When row "27-30 Oct 2026" | `when: "2026-10-27/2026-10-30"`, row removed, `note` gains the sentence "On 2026-10-29." at its end |
| `mentoring-trajectory-info-session` | `date: "2026-10-27"`, When row "27 Oct 2026, 11:00" | `when: "2026-10-27T11:00:00"`, row removed |
| `research-visit-linkoping-sweden` | `date: "2027-03-01"`, When row "March 2027 (day TBC)" | `when: "2027-03"`, row removed, `note` gains "Day to be confirmed." at its end |
| `graz-bci-conference-2026` | `date: "2026-09-14"`, When row "14-18 Sep 2026" | `when: "2026-09-14/2026-09-18"`, row removed |
| `inkendaal` | `date: "2024"` | `when: 2024` |
| `flta-2025`, `fllm-2025`, `ohdsi-europe-2025`, `guest-lecture-kuleuven-2025` | `date: "2025"`, `duration: 2025` | `when: 2025` |
| `xai-nl-meetup-2026` | `date: "2026"`, `duration: 2026` | `when: 2026` |
| `fair-research-day-2024`, `fair-rwe-kickoff-2024` | `date: "2024"`, `duration: 2024` | `when: 2024` |
| `mindseed-2023`, `guest-lecture-kuleuven-2023` | `date: "2023"`, `duration: 2023` | `when: 2023` |
| `humanities-vs-sciences-2022`, `ae-expo-2022`, `guest-lecture-kuleuven-2022`, `leuven-ai-workshop-2022` | `date: "2022"`, `duration: 2022` | `when: 2022` |
| `science-for-peace-2021`, `guest-lecture-kuleuven-2021`, `volga-neuroscience-meeting-2021`, `technopolis-day-of-science-2021` | `date: "2021"`, `duration: 2021` | `when: 2021` |
| `mindspeller-concert-2019` | `date: "2019"`, `duration: 2019` | `when: 2019` |
| `kuleuven-news-bronze-medal-2017`, `dtai-news-bronze-medal-2017` | `date: "2017"`, `duration: 2017` | `when: 2017` |
| `chi-2016-video` | `date: "2016"`, `duration: 2016` | `when: 2016` |

`research-visit-linkoping-sweden`'s note already reads "... Pin the exact November day when set." while its date is in March; that sentence is the hub's own and stays.

Schema after: the `date` line becomes `{ field: when, type: period, section: Dates, help: "When it happens: a year, a month, a day or a span, such as 2025-09/2026-09 or 2025/.." }` and the `duration` line is removed.

### `.oculus/data/academic/education.yml` (26 entries)

| Entry | Old | New |
|-------|-----|-----|
| `msc-supervision-statistics-data-science-2026-2027` | `date: "2026-2027"` | `when: "2026/2027"` |
| `msc-health-sciences-cardiovascular-mri-2026-2027` | `date: "2026-2027"` | `when: "2026/2027"` |
| `bioinformatics-2025-2026` | `date: "2025-2026"`, `duration: "Sept. 2025 - Sept. 2026"`, `sub: "UHasselt \| Sept 2025 - Sept 2026"` | `when: "2025-09/2026-09"`, `sub: "UHasselt"` |
| `bioinformatics-2024-2025` | `date: "2024-2025"`, `duration: "Sept. 2024 - Sept. 2025"`, `sub: "UHasselt \| Sept 2024 - Sept 2025"` | `when: "2024-09/2025-09"`, `sub: "UHasselt"` |
| `msc-supervision-computer-science-2025-2026` | `date: "2025-2026"`; students brecht-heeren, denzell-mgbokwere, robert-rysskin `degree: "Master of Science in Computer Science (2025-2026)"` | `when: "2025/2026"`; each `degree: "Master of Science in Computer Science"` |
| `reader-2026` | `date: "2026"`, `duration: "2026"` | `when: 2026` |
| `advanced-topics-in-data-science` | `date: "2024-2025"`, `duration: "June 2024 - Sept. 2025"`, `sub: "UHasselt \| June 2024 - Sept 2025 \| teaching-team member"` | `when: "2024-06/2025-09"`, `sub: "UHasselt \| teaching-team member"` |
| `data-science-in-healthcare-4747-lecturer` | `date: "2025"`, `duration: "Sept. 2025 - Dec. 2025"`, `sub: "UHasselt \| Sept 2025 - Dec 2025 \| teaching-team member"` | `when: "2025-09/2025-12"`, `sub: "UHasselt \| teaching-team member"` |
| `brain-computer-interfacing-b-kul-h08m0a-guest-lecturer` | `date: "2022-2025"`, `duration: "2022-2025"`, `sub: "KU Leuven \| 2022-2025"` | `when: "2022/2025"`, `sub: "KU Leuven"` |
| `bko` | `date: "2025"`, `duration: 2025` | `when: 2025` |
| `phd-co-supervision-statistics-2024-2025` | `date: "2024-2025"`; student do `degree: "Doctoral Program in Sciences, Statistics (co-supervisor, 2024 - 2025)"` | `when: "2024/2025"`; `degree: "Doctoral Program in Sciences, Statistics, co-supervisor"` |
| `msc-supervision-statistics-data-science-2024-2025` | `date: "2024-2025"`; students matteo, mohsen, kerga `degree: "Master Statistics & Data Science (2024-2025)"` | `when: "2024/2025"`; each `degree: "Master Statistics & Data Science"` |
| `msc-supervision-computer-science-2024-2025` | `date: "2024-2025"`; students dongho, dries-cornelissen, ward `degree: "Master of Science in Computer Science (2024-2025)"` | `when: "2024/2025"`; each `degree: "Master of Science in Computer Science"` |
| `phd-daily-supervision-biomedical-sciences-2022-2023` | `date: "2022-2023"`; students qiang-sun, eva-calvo-merino `degree: "Doctoral Program in Biomedical Sciences (daily supervision 2022-2023)"` | `when: "2022/2023"`; each `degree: "Doctoral Program in Biomedical Sciences, daily supervision"` |
| `internship-msc-ai-students-2020-2021` | `date: "2020-2021"`; students aurelie-de-borman, diogo-sousa-morais, guilherme-de-borras-silva `degree: "Internship Student 2021"`; students iris-vantieghem, didier-quintius `degree: "Master of Science in Artificial Intelligence (2020-2021)"` | `when: "2020/2021"`; the three `degree: "Internship Student"` with `when: 2021` each; the two `degree: "Master of Science in Artificial Intelligence"` |
| `data-science-support-phd-students-uhasselt` | `date: "2024"`, `duration: "2024"` | `when: 2024` |
| `guest-associate-editor-frontiers-in-immunology` | `date: "2024-2025"`, `duration: "2024 - 2025"` | `when: "2024/2025"` |
| `vlaio-baekeland-spin-off-mandates-evaluator` | `date: "2025"`, `duration: "2025"` | `when: 2025` |
| `student-research-competition-judge-icfp` | `date: "2024"`, `duration: "2024"` | `when: 2024` |
| `tutoring` | `date: "2015-2024"`, `duration: "Sept. 2015 - 2024"`, `sub: "Freelance \| Sept. 2015 - 2024"` | `when: "2015-09/2024"`, `sub: "Freelance"` |
| `coach-djangogirls` | `date: "2018-2024"`, `duration: "Mar. 2018 - 2024"`, `sub: "DjangoGirls \| Mar. 2018 - 2024"` | `when: "2018-03/2024"`, `sub: "DjangoGirls"` |
| `coach-coderdojo` | `date: "2014-2025"`, `duration: "Sep. 2014 - 2025"`, `sub: "CoderDojo (UHasselt, PXL) \| Sep. 2014 - 2025"` | `when: "2014-09/2025"`, `sub: "CoderDojo (UHasselt, PXL)"` |
| `student-representative-kuleuven` | `date: "2017-2018"`, `duration: "Sep. 2017 - Sep. 2018"`, `sub: "KU Leuven \| Sep. 2017 - Sep. 2018"` | `when: "2017-09/2018-09"`, `sub: "KU Leuven"` |
| `student-council-stura-uhasselt` | `date: "2015-2016"`, `duration: "Mar. 2015 - Aug. 2016"`, `sub: "StuRa UHasselt \| Mar. 2015 - Aug. 2016"` | `when: "2015-03/2016-08"`, `sub: "StuRa UHasselt"` |
| `student-representative-uhasselt` | `date: "2013-2016"`, `duration: "Sep. 2013 - Jul. 2016"`, `sub: "UHasselt \| Sep. 2013 - Jul. 2016"` | `when: "2013-09/2016-07"`, `sub: "UHasselt"` |
| `thesis-topic-master-informatics` | `date: "2027"` | `when: 2027` |

The two `sub` texts that name another day than the period ("thesis market Tue 24 Nov 2026, 12:30-13:30", "submit Apr 2027") stay (decision 3).

Schema after: the `date` line becomes the `when` line of events, the `duration` line is removed, the `sub` help becomes "Institution and role.", and the `students` line's fields become `person`, `topic`, `degree` (help "The degree, as the CV prints it.") and `{ field: when, type: period, help: "When the student was supervised, where it differs from the entry's." }`.

### `.oculus/data/academic/funding.yml` (14 entries)

| Entry | Old | New |
|-------|-----|-----|
| `2026-fwo-senior-transplant`, `2026-fwo-senior-stopped-meyfroidt`, `2026-fwo-senior-stopped-stalmans`, `pioneers-in-healthcare-pihc-innovation-fund` | `date: "2026"` | `when: 2026` |
| `nwo-veni-the-self-explaining-hospital`, `nwo-open-competition-domain-science-xs-enw-xs` | `date: "2026"`, `duration: 2026` | `when: 2026` |
| `FAIR` | `duration: "2024 - Jan. 2026"` | `when: "2024/2026-01"` |
| `erc-starting-grant-2027-submission` | `date: "2027"` | `when: 2027` |
| `ZonMw-AI-HCC` | `duration: "2026 - Current"` | `when: "2026/.."` |
| `FWO-PhD` | `date: "2018"` | `when: 2018` |
| `2025-fwo-project-fl4phm` | `date: "2025"`, `duration: "2025 - Current"` | `when: "2025/.."` |
| `2022-fwo-postdoc-sign-language` | `date: "2022"` | `when: 2022` |
| `2024-fwo-postdoc-fbttr` | `date: "2024"` | `when: 2024` |
| `ELIXIR-BE` | `date: "2023-2025"`, `duration: "2023 - 2025"` | `when: "2023/2025"` |

Schema after: the `date` line becomes the `when` line of events, the `duration` line is removed, and the `sub` help becomes "Scheme or role.".

### `.oculus/data/academic/career.yml`

| Row | Old | New |
|-----|-----|-----|
| `positions[0] postdoc-twente` | `duration: "January 2026 - Current"` | `when: "2026-01/.."` |
| `positions[1] postdoc-uhasselt` | `duration: "January 2024 - January 2026 (Research Affiliate from 2026)"` | `when: "2024-01/2026-01"`; `about` gains the sentence "Research Affiliate from 2026." at its end |
| `positions[2] postdoc-kuleuven` | `duration: "May 2023 - January 2024"` | `when: "2023-05/2024-01"` |
| `positions[3] consultant-flanders-bci` | `duration: "2022 - 2024"` | `when: "2022/2024"` |
| `positions[4] research-stay-gloreha` | `duration: "Dec. 2022 - Jan. 2023"` | `when: "2022-12/2023-01"` |
| `positions[5] phd-kuleuven` | `duration: "Sep. 2018 - May 2023"` | `when: "2018-09/2023-05"` |
| `positions[6] internship-web-performance` | `duration: "Jul. 2016 - Sep. 2016"` | `when: "2016-07/2016-09"` |
| `positions[7] internship-physical-computing` | `duration: "Aug. 2015 - Sep. 2015"` | `when: "2015-08/2015-09"` |
| `degrees[0] sign-language` | `duration: "Sep. 2022 - May 2024"` | `when: "2022-09/2024-05"` |
| `degrees[1] phd` | `duration: "Sep. 2018 - May 2023"` | `when: "2018-09/2023-05"` |
| `degrees[2] msc-ai` | `duration: "Sep. 2017 - Jul. 2019"` | `when: "2017-09/2019-07"` |
| `degrees[3] honours` | `duration: "Sep. 2016 - Oct. 2018"` | `when: "2016-09/2018-10"` |
| `degrees[4] msc-cs` | `duration: "Sep. 2016 - Sep. 2018"` | `when: "2016-09/2018-09"` |
| `degrees[5] summer-school-manchester` | `duration: "Jul. 2015 - Aug. 2015"` | `when: "2015-07/2015-08"` |
| `degrees[6] bsc` | `duration: "Sep. 2013 - Jul. 2016"` | `when: "2013-09/2016-07"` |
| `degrees[7] twente-health-school` | `duration: 2026` | `when: 2026` |
| `awards[0] efsa` | `date: "2025-06-01 15:59:00-0400"` | `when: "2025-06-01"` |
| `awards[1] fwo-grant` | `date: "2018-01-01 15:59:00-0400"` | `when: "2018-01-01"` |
| `awards[2] cyber-security` | `date: "2018-03-24 15:59:00-0400"` | `when: "2018-03-24"` |
| `awards[3] icfp-src-2017` | `date: "2017-09-01 15:59:00-0400"` | `when: "2017-09-01"` |
| `awards[4] bachelor-award` | `date: "2016-07-01 15:59:00-0400"` | `when: "2016-07-01"` |
| `awards[5] chi-sdc` | `date: "2016-05-01 15:59:00-0400"` | `when: "2016-05-01"` |
| `awards[6] begdc` | `date: "2016-02-01 15:59:00-0400"` | `when: "2016-02-01"` |
| `awards[7] ielts` | `date: "2016-01-01 15:59:00-0400"` | `when: "2016-01-01"` |
| `order[0] Quantitative Researcher`, `order[1] Diplomat` | `when: ""` | `when` removed |
| `order[2] ERC Starting Grant` | `when: "Oct 2027"` | `when: "2027-10"` |
| `profiles.analyst.experience[0]`, `profiles.pharma.experience[0]`, `profiles.engine.experience[0]` | `duration: "Jan 2026 - Present"` | `when: "2026-01/.."` |
| `profiles.analyst.experience[1]`, `profiles.pharma.experience[1]`, `profiles.engine.experience[1]` | `duration: "Jan 2024 - Jan 2026"` | `when: "2024-01/2026-01"` |
| `profiles.analyst.experience[2]`, `profiles.pharma.experience[2]` | `duration: "2018 - 2024"` | `when: "2018/2024"` |
| `profiles.pharma.experience[3]` | `duration: 2025` | `when: 2025` |
| `profiles.engine.experience[2]` | `duration: "2023 - 2024"` | `when: "2023/2024"` |
| `profiles.engine.experience[3]` | `duration: "2018 - 2023"` | `when: "2018/2023"` |
| `profiles.engine.experience[4]` | `duration: "2022 - 2023"` | `when: "2022/2023"` |
| `profiles.analyst.projects[0]`, `profiles.engine.projects[1]`, `profiles.engine.experience[5]` | `duration: "2015 - 2016"` | `when: "2015/2016"` |
| `profiles.analyst.projects[1]`, `profiles.engine.projects[4]` | `duration: "2016 - Present"` | `when: "2016/.."` |
| `profiles.analyst.projects[2]`, `profiles.engine.projects[0]` | `duration: "2015 - Present"` | `when: "2015/.."` |
| `profiles.analyst.projects[3]`, `profiles.pharma.projects[1]`, `profiles.pharma.projects[2]`, `profiles.engine.projects[2]` | `duration: "2025 - Present"` | `when: "2025/.."` |
| `profiles.pharma.projects[0]`, `profiles.engine.projects[3]`, `profiles.engine.teaching[0]` | `duration: "2022 - Present"` | `when: "2022/.."` |
| `profiles.engine.teaching[1]` | `duration: "2020 - Present"` | `when: "2020/.."` |
| `profiles.engine.teaching[2]` | `duration: "2014 - 2025"` | `when: "2014/2025"` |
| `profiles.analyst.education[0]`, `profiles.pharma.education[0]`, `profiles.engine.education[0]` | `duration: "2018 - 2023"` | `when: "2018/2023"` |
| `profiles.analyst.education[1]`, `profiles.pharma.education[1]`, `profiles.engine.education[1]` | `duration: "2017 - 2019"` | `when: "2017/2019"` |
| `profiles.analyst.education[2]`, `profiles.pharma.education[2]`, `profiles.engine.education[2]`, `profiles.engine.education[3]` | `duration: "2016 - 2018"` | `when: "2016/2018"` |
| `profiles.analyst.education[3]`, `profiles.pharma.education[3]`, `profiles.engine.education[4]` | `duration: "2013 - 2016"` | `when: "2013/2016"` |
| `profiles.analyst.awards[0]`, `[1]`, `[4]`; `profiles.pharma.awards[2]`, `[3]`; `profiles.engine.awards[0]`, `[2]`, `[5]`, `[6]` | `date: "2016"` | `when: 2016` |
| `profiles.analyst.awards[2]`, `profiles.pharma.awards[0]` | `date: "2025"` | `when: 2025` |
| `profiles.analyst.awards[3]`, `profiles.engine.awards[1]` | `date: "2017"` | `when: 2017` |
| `profiles.pharma.awards[1]`, `profiles.engine.awards[3]`, `profiles.engine.awards[4]` | `date: "2018"` | `when: 2018` |

The profiles' letters keep their `date` (the day a letter prints).

Schema after (`O144_SCHEMA=1`): `order`'s `when` becomes `{ field: when, type: period, help: When it is due. }`; `positions`' and `degrees`' `duration` and `awards`' `date` each become `{ field: when, type: period, help: "When it happens: a year, a month, a day or a span, such as 2025-09/2026-09 or 2025/.." }`; in every profile section's `content`, `duration` (and `date` in `awards`) becomes `{ field: when, type: period, help: "When, when this CV prints it differently." }`; the letter's `date` stays `text`.

### `.oculus/data/academic/leads.yml` (14 of 74 entries; the 60 whose deadline is a day stay)

| Lead (title, cut at 60) | Old `deadline` | New |
|------|-----|-----|
| Bioinformatician | "not stated (listed 2026-11-02)" | no `deadline`; `note: "Deadline as posted: not stated (listed 2026-11-02)."` |
| Academique en Optimization and Learning for Data-Driven Deci | "2026-11-05 (12:00 UTC+1)" | `deadline: "2026-11-05"`; `note: "Deadline as posted: 12:00 UTC+1."` |
| Postdoctoral Position in the Computational Neurobiology Lab | "not stated (posted 2026-10-30, start February 2027)" | no `deadline`; `note: "Deadline as posted: not stated (posted 2026-10-30, start February 2027)."` |
| Postdoc position in imaging genetics | "2026-11-05 (rolling review, may close early)" | `deadline: "2026-11-05"`, `rolling: true`; `note: "Deadline as posted: rolling review, may close early."` |
| Post-Doc in Computational Genomics and High-throughput Genom | "2026-12-15 (or until filled)" | `deadline: "2026-12-15"`, `rolling: true`; `note: "Deadline as posted: or until filled."` |
| Postdoc in In Vivo CRISPR Screening (Dry and/or Wet Lab) | "not stated (posted 2026-09-18)" | no `deadline`; `note: "Deadline as posted: not stated (posted 2026-09-18)."` |
| Post-Doctoral Fellow in AI-based Multimodal Integration | "rolling (open)" | no `deadline`, `rolling: true`; `note: "Deadline as posted: rolling (open)."` |
| Postdoc in health-data harmonization and analysis | "not stated (published 2026-08-20; unverified, see log)" | no `deadline`; `note: "Deadline as posted: not stated (published 2026-08-20; unverified, see log)."` |
| Postdoc Innovative Deep Learning Techniques for Image-guided | "rolling (open)" | no `deadline`, `rolling: true`; `note: "Deadline as posted: rolling (open)."` |
| Post-Doctoral Fellow: Gut Microbiome and Bioinformatics | "rolling (open)" | no `deadline`, `rolling: true`; `note: "Deadline as posted: rolling (open)."` |
| Data Scientist in AI - Department of Infection & Immunity | "rolling (open)" | no `deadline`, `rolling: true`; `note: "Deadline as posted: rolling (open)."` |
| Postdoc - Explainable Machine Learning & Survival Analysis | "rolling (open until filled)" | no `deadline`, `rolling: true`; `note: "Deadline as posted: rolling (open until filled)."` |
| Postdoc - AI for Accessible Medical Imaging (multiple roles) | "Closed: the AcademicTransfer detail page states 'deadline was 6 May 25' (checked 2026-07-09)" | `deadline: "2025-05-06"`; `note: "Deadline as posted: Closed: the AcademicTransfer detail page states 'deadline was 6 May 25' (checked 2026-07-09)."` |
| Postdoctoral Researcher - Computational Biology and Machine | "Open until filled" | no `deadline`, `rolling: true`; `note: "Deadline as posted: Open until filled."` |

Schema after: the `deadline` line becomes `{ field: deadline, label: Deadline, type: date, section: Dates, help: "The deadline, a day." }`, followed by `{ field: rolling, label: Rolling, type: checkbox, section: Dates, help: "Applications are read as they arrive, with or without a deadline." }`, and `{ field: note, label: Note, type: textarea, section: Content, help: Notes on the posting. }` is added last.

### `.oculus/tasks/scout.md` (read at `:100-124`)

- Line 107 `     - { field: deadline, label: "Deadline", type: text }` becomes `     - { field: deadline, label: "Deadline", type: date }`, followed by a new line `     - { field: rolling, label: "Rolling", type: checkbox }`; after the `url` line (108) a new line `     - { field: note, label: "Note", type: textarea }`.
- Line 120 `       deadline: "2026-08-15" # or "rolling (open)" etc.` becomes `       deadline: "2026-08-15" # the posting's closing day, YYYY-MM-DD; left out when it gives none`, followed by `       rolling: false         # true when it reads applications as they arrive`; after the `url` line (121) a new line `       note: ""               # every other word the posting says about its deadline`.

These match oculus's Scout text (`docs/templates.md:823`) and its leads template (`docs/templates.md:1668-1697`).

### Manifests (16 under `projects/` and `side-projects/`, and oculus's own)

`cv.duration` becomes `cv.when`, in its place in the `cv:` map:

| Manifest | Old `cv.duration` | New `cv.when` |
|----------|-------------------|---------------|
| `projects/coauthor/published/2016/chi-household-survival/project.yml` | "Sep. 2015 - Dec. 2015" | "2015-09/2015-12" |
| `projects/software/bttr-block-term-tensor-regression/project.yml` | "2022 - Current" | "2022/.." |
| `projects/software/federated-learning-tutorial/project.yml` | "2025 - Current" | "2025/.." |
| `projects/software/fl-kit-elixir-federated-learning-kit/project.yml` | "2025 - Current" | "2025/.." |
| `side-projects/finished/axeski/project.yml` | "Feb. 2015 - Jul. 2015" | "2015-02/2015-07" |
| `side-projects/finished/cardinal/project.yml` | "Sep. 2015 - Oct. 2016" | "2015-09/2016-10" |
| `side-projects/finished/cardinal-revamped/project.yml` | "Jan. 2015 - Current" | "2015-01/.." |
| `side-projects/finished/cv-autogenerator/project.yml` | "Oct. 2017 - May 2024" | "2017-10/2024-05" |
| `side-projects/finished/ical-kuleuven/project.yml` | "Aug. 2016 - Current" | "2016-08/.." |
| `side-projects/finished/iot-sensor-platform/project.yml` | "Feb. 2017 - Jul. 2017" | "2017-02/2017-07" |
| `side-projects/finished/search-recommendation-vod/project.yml` | "Feb. 2016 - Jul. 2016" | "2016-02/2016-07" |
| `side-projects/finished/starcraft-rl-agent/project.yml` | "Feb. 2018 - Jul. 2018" | "2018-02/2018-07" |
| `side-projects/finished/theaxec-profile-readme/project.yml` | "Mar. 2025 - Current" | "2025-03/.." |
| `side-projects/school/effect-handler-optimization-honours-project/project.yml` | "2016 - 2017" | "2016/2017" |
| `side-projects/school/quasi-monte-carlo-points-on-collections-of-triangles/project.yml` | 2018 | 2018 |
| `side-projects/school/row-based-effects-honours-project/project.yml` | "2017 - 2018" | "2017/2018" |
| `~/workspace/oculus/.oculus/project.yml:30` (from the brief; not in C18's copy) | '2026 - Current' | "2026/.." |

Manifest `year` values stay as written.

### The CV text before and after

Every CV row of `_data/data.yml`'s sections with a period, from C18's run (`O144_CV=1`): the text the CV builder prints after the change, beside the text `side-projects/theaxec.github.io/_data/data.yml` holds now. 74 are the same, 28 differ.

| Section | Title (cut at 70) | After the change | `_data/data.yml` now |
|---------|-------------------|------------------|----------------------|
| experience | Postdoctoral Researcher: Foundation Models & Multi-Modal Federated Lea | "Jan. 2026 - Current" | "January 2026 - Current" |
| experience | Postdoctoral Researcher: Federated Learning in Healthcare & Real-World | "Jan. 2024 - Jan. 2026" | "January 2024 - January 2026 (Research Affiliate from 2026)" |
| experience | Postdoctoral Researcher: Deep Learning & Tensor Regression for Sign La | "May 2023 - Jan. 2024" | "May 2023 - January 2024" |
| experience | Data Science Consultant | "2022 - 2024" | "2022 - 2024" |
| experience | Research Stay Idrogenet Srl, Gloreha: Robotic Rehabilitation (two rows) | "Dec. 2022 - Jan. 2023" | "Dec. 2022 - Jan. 2023" |
| experience | PhD Researcher in Computational Neuroscience | "Sep. 2018 - May 2023" | "Sep. 2018 - May 2023" |
| experience | Web Performance Research Internship | "Jul. 2016 - Sep. 2016" | "Jul. 2016 - Sep. 2016" |
| experience | Summer Research Internship Physical Computing | "Aug. 2015 - Sep. 2015" | "Aug. 2015 - Sep. 2015" |
| academic | Bioinformatics (3740) Coordinating lecturer | "Sep. 2025 - Sep. 2026" | "Sept. 2025 - Sept. 2026" |
| academic | BKO (Basic Teaching Qualification) - Teacher Professionalization | "2025" | 2025 |
| academic | Data Science in Healthcare (4747) Lecturer (teaching team member) | "Sep. 2025 - Dec. 2025" | "Sept. 2025 - Dec. 2025" |
| academic | Advanced Topics in Data Science (4569 & 4585) Lecturer Federated Learn | "Jun. 2024 - Sep. 2025" | "June 2024 - Sept. 2025" |
| academic | Bioinformatics (3740) Coordinating lecturer | "Sep. 2024 - Sep. 2025" | "Sept. 2024 - Sept. 2025" |
| academic | Guest Associate Editor Use of Big Data and Artificial Intelligence in | "2024 - 2025" | "2024 - 2025" |
| academic | VLAIO Evaluator for BAEKELAND SPIN OFF MANDATES | "2025" | "2025" |
| academic | Student Research Competition Judge (International Conference on Functi | "2024" | "2024" |
| academic | Brain-Computer Interfacing (B-KUL-H08M0A) Guest Lecturer | "2022 - 2025" | "2022-2025" |
| academic | MSc thesis assessor (second reader) | "2026" | "2026" |
| academic | Data Science Support for PhD Students (BIOMED), data science expert | "2024" | no row of that title |
| students | Brecht Heeren, Denzell Mgbokwere, Robert Rysskin | "Master of Science in Computer Science (2025 - 2026)" | "Master of Science in Computer Science (2025-2026)" |
| students | Anh Phuong DO | "Doctoral Program in Sciences, Statistics, co-supervisor (2024 - 2025)" | "Doctoral Program in Sciences, Statistics (co-supervisor, 2024 - 2025)" |
| students | Matteo Ramina, Mohsen Soleimanisemsani, Meseret Assefa Kerga | "Master Statistics & Data Science (2024 - 2025)" | "Master Statistics & Data Science (2024-2025)" |
| students | Dongho Chun, Dries Cornelissen, Ward Ceyssens | "Master of Science in Computer Science (2024 - 2025)" | "Master of Science in Computer Science (2024-2025)" |
| students | Qiang Sun, Eva Calvo Merino | "Doctoral Program in Biomedical Sciences, daily supervision (2022 - 2023)" | "Doctoral Program in Biomedical Sciences (daily supervision 2022-2023)" |
| students | Aurelie de Borman, Diogo Sousa Morais, Guilherme de Borras Silva | "Internship Student (2021)" | "Internship Student 2021" |
| students | Iris Vantieghem, Didier Quintius | "Master of Science in Artificial Intelligence (2020 - 2021)" | "Master of Science in Artificial Intelligence (2020-2021)" |
| news | Federate What Transfers: Component-Aware Federation of Self-Supervised | "Oct. 2026" | 2026 |
| news | the other 21 rows (Modality-Specific Encoding ... to Purpose-Centric Appropriation ...) | the year as text, "2026" to "2016" | the same year as a number |
| education | Flemish Sign Language course | "Sep. 2022 - May 2024" | "Sep. 2022 - May 2024" |
| education | Doctoral Programme in Biomedical Science (PhD) in Computational Neuros | "Sep. 2018 - May 2023" | "Sep. 2018 - May 2023" |
| education | Advanced Master of Science in Engineering (M.Sc.) in Artificial Intell | "Sep. 2017 - Jul. 2019" | "Sep. 2017 - Jul. 2019" |
| education | Honours programme of the Faculty of Engineering Science (Research Trac | "Sep. 2016 - Oct. 2018" | "Sep. 2016 - Oct. 2018" |
| education | Master of Science in Engineering (M.Sc.) in Computer Science (Burgerli | "Sep. 2016 - Sep. 2018" | "Sep. 2016 - Sep. 2018" |
| education | Business Summer School: United in Manchester (0739) | "Jul. 2015 - Aug. 2015" | "Jul. 2015 - Aug. 2015" |
| education | Bachelor of Science (B.Sc.) in Computer Science | "Sep. 2013 - Jul. 2016" | "Sep. 2013 - Jul. 2016" |
| grants | The Self-Explaining Hospital: Readable, Private Clinical Models That T | "2026" | 2026 |
| grants | Before the tumour: an interpretable pre-lesional field trajectory that | "2026" | 2026 |
| projects | Federated Learning for Population Health Management (FL4PHM) | "2025 - Current" | "2025 - Current" |
| projects | AI-HCC: Predicting the Development of Primary Liver Cancer Using the A | "2026 - Current" | "2026 - Current" |
| projects | Use Case Real World Evidence - Flanders AI Research Program | "2024 - Jan. 2026" | "2024 - Jan. 2026" |
| projects | ELIXIR Belgium - Roadmap 2023-2025 | "2023 - 2025" | "2023 - 2025" |
| projects | Federated Learning Kit (FLkit) | "2025 - Current" | "2025 - Current" |
| projects | Cardinal: Educational and Research platform for MSc theses in PL/compi | "Jan. 2015 - Current" | "Jan. 2015 - Current" |
| projects | Open Source Python Package - Block-Term Tensor Regression (BTTR) | "2022 - Current" | "2022 - Current" |
| projects | Wisconsin Breast Cancer Dataset Research Tutorial for Federated Learni | "2025 - Current" | "2025 - Current" |
| projects | Reinforcement Learning Agent in Google Deepmind's StarCraft II Framewo | "Feb. 2018 - Jul. 2018" | "Feb. 2018 - Jul. 2018" |
| projects | IoT-platform with pluggable sensors | "Feb. 2017 - Jul. 2017" | "Feb. 2017 - Jul. 2017" |
| projects | ICAL parser for KU Leuven schedules | "Aug. 2016 - Current" | "Aug. 2016 - Current" |
| projects | Search and Recommendation System | "Feb. 2016 - Jul. 2016" | "Feb. 2016 - Jul. 2016" |
| projects | Household Survival: Immersive Room-Sized Gaming Using Everyday Objects | "Sep. 2015 - Dec. 2015" | "Sep. 2015 - Dec. 2015" |
| projects | Cardinal: a small, fully dynamic scripting language | "Sep. 2015 - Oct. 2016" | "Sep. 2015 - Oct. 2016" |
| projects | CV Autogenerator | "Oct. 2017 - May 2024" | "Oct. 2017 - May 2024" |
| projects | GitHub profile README | "Mar. 2025 - Current" | "Mar. 2025 - Current" |
| projects | Honours project: an optimising compiler for Eff | "2016 - 2017" | "2016 - 2017" |
| projects | Honours project: a core language with row-based effects | "2017 - 2018" | "2017 - 2018" |
| projects | Honours project proposal: quasi-Monte Carlo point sets on collections | "2018" | 2018 |
| projects | Visual Programming IDE | "Feb. 2015 - Jul. 2015" | "Feb. 2015 - Jul. 2015" |
| projects | Oculus | no row (oculus's own manifest is not in the copy) | "2026 - Current" |
| awards | Selected for EFSA Framework Contract | "2025-06-01 15:59:00-0400" | the same |
| awards | FWO Fundamental Research Grant | "2018-01-01 15:59:00-0400" | the same |
| awards | Finalist | "2018-03-24 15:59:00-0400" | the same |
| awards | 3rd place | "2017-09-01 15:59:00-0400" | the same |
| awards | Bachelor Award | "2016-07-01 15:59:00-0400" | the same |
| awards | 3rd place | "2016-05-01 15:59:00-0400" | the same |
| awards | 2nd place | "2016-02-01 15:59:00-0400" | the same |
| awards | IELTS | "2016-01-01 15:59:00-0400" | the same |
| extracurricular | Twente Health School (summer school) | "2026" | 2026 |
| extracurricular | Mathematics & Natural Sciences Tutor | "Sep. 2015 - 2024" | "Sept. 2015 - 2024" |
| extracurricular | Coach | "Mar. 2018 - 2024" | "Mar. 2018 - 2024" |
| extracurricular | Coach | "Sep. 2014 - 2025" | "Sep. 2014 - 2025" |
| extracurricular | Student Representative | "Sep. 2017 - Sep. 2018" | "Sep. 2017 - Sep. 2018" |
| extracurricular | Student Council Member | "Mar. 2015 - Aug. 2016" | "Mar. 2015 - Aug. 2016" |
| extracurricular | Student Representative | "Sep. 2013 - Jul. 2016" | "Sep. 2013 - Jul. 2016" |

A row whose two columns differ only in a year written as a number in `_data/data.yml` and as text after the change is counted as the same by the run (`String(a) === String(b)`); the website prints both the same. The "Oculus" row's text after the change is "2026 - Current" by the rule C9 shows for `2026-01/..`'s form ("<year> - Current"); it was not run, since oculus's manifest is outside the copy. The student `Aurelie` is written here without its accent, which the data holds.

Employer CVs (`_data/industry.yml`): 40 rows the same, 18 differ, all in the open-end word and the month's dot:

| Profile row | Title (cut at 50) | After the change | `_data/industry.yml` now |
|-------------|-------------------|------------------|--------------------------|
| analyst.experience[0] | Postdoctoral Researcher - AI & Data Science | "Jan. 2026 - Current" | "Jan 2026 - Present" |
| analyst.experience[1] | Scientific Coordinator & Machine-Learning Lead - R | "Jan. 2024 - Jan. 2026" | "Jan 2024 - Jan 2026" |
| analyst.projects[1] | iCal for KU Leuven - schedule generator (Node.js) | "2016 - Current" | "2016 - Present" |
| analyst.projects[2] | Cardinal - VM & language platform (C++20) | "2015 - Current" | "2015 - Present" |
| analyst.projects[3] | Reproducible federated-learning tutorial (Wisconsi | "2025 - Current" | "2025 - Present" |
| pharma.experience[0] | Postdoctoral Researcher - AI for Healthcare & Prec | "Jan. 2026 - Current" | "Jan 2026 - Present" |
| pharma.experience[1] | Scientific Coordinator & ML Lead - Real-World Evid | "Jan. 2024 - Jan. 2026" | "Jan 2024 - Jan 2026" |
| pharma.projects[0] | Block-Term Tensor Regression (BTTR) - open-source | "2022 - Current" | "2022 - Present" |
| pharma.projects[1] | Federated Learning Kit (FLkit) for the life scienc | "2025 - Current" | "2025 - Present" |
| pharma.projects[2] | Reproducible federated-learning tutorial (Wisconsi | "2025 - Current" | "2025 - Present" |
| engine.experience[0] | Postdoctoral Researcher - AI & High-Performance Co | "Jan. 2026 - Current" | "Jan 2026 - Present" |
| engine.experience[1] | Machine-Learning Lead & Scientific Coordinator | "Jan. 2024 - Jan. 2026" | "Jan 2024 - Jan 2026" |
| engine.projects[0] | Cardinal - C++20 virtual machine & language platfo | "2015 - Current" | "2015 - Present" |
| engine.projects[2] | Wren VM optimisation - bytecode redesign & single- | "2025 - Current" | "2025 - Present" |
| engine.projects[3] | Block-Term Tensor Regression (BTTR) - open-source | "2022 - Current" | "2022 - Present" |
| engine.projects[4] | iCal for KU Leuven - schedule generator (Node.js) | "2016 - Current" | "2016 - Present" |
| engine.teaching[0] | Lecturer & Guest Lecturer | "2022 - Current" | "2022 - Present" |
| engine.teaching[1] | Student Supervision | "2020 - Current" | "2020 - Present" |

## Diff stat and files

`git diff --stat` (the tracked files) ends `70 files changed, 704 insertions(+), 404 deletions(-)`. New files (`git ls-files --others --exclude-standard`, this report left out): `src/lib/state/boards/collection/card-order.ts` (102 lines) and `tests/data/helpers/period.test.ts` (128 lines). The twelve `docs/diagrams/*.dot` and `.svg` files are `npm run diagrams`'s output.

Line counts, base and now (`wc -l`, the base from `../O144-base`):

| File | Base | Now |
|------|------|-----|
| `config/catalogs/vocab.yml` | 312 | 312 |
| `config/defaults/sources.yml` | 115 | 115 |
| `config/options/catalogs/vocab.yml` | 417 | 417 |
| `config/options/schemas/manifest-schema.yml` | 30 | 42 |
| `config/options/sources.yml` | 189 | 189 |
| `config/schemas/manifest-schema.yml` | 133 | 134 |
| `config/text/findings.yml` | 496 | 497 |
| `config/text/server.yml` | 633 | 634 |
| `config/text/views/boards/editor.yml` | 39 | 41 |
| `config/text/views/feeds/leads.yml` | 40 | 41 |
| `config/text/views/system/audit.yml` | 73 | 73 |
| `docs/HELP.md` | 621 | 621 |
| `docs/apps.md` | 847 | 847 |
| `docs/data-map.md` | 306 | 307 |
| `docs/templates.md` | 1925 | 1929 |
| `src/lib/data/helpers/dates.ts` | 57 | 198 |
| `src/lib/data/model/model-collections.ts` | 559 | 559 |
| `src/lib/data/model/model-entities.ts` | 805 | 809 |
| `src/lib/data/shapes/catalog-files/manifest.ts` | 104 | 105 |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 547 | 547 |
| `src/lib/data/snapshot/normalise-parts/publication.ts` | 82 | 82 |
| `src/lib/data/snapshot/normalise.ts` | 701 | 690 |
| `src/lib/data/snapshot/schema/check.ts` | 395 | 418 |
| `src/lib/data/snapshot/schema/json.ts` | 55 | 62 |
| `src/lib/data/snapshot/schema/manifest.ts` | 191 | 192 |
| `src/lib/data/snapshot/schema/record.ts` | 458 | 470 |
| `src/lib/data/sources/documents/feeds.ts` | 175 | 173 |
| `src/lib/server/content/audit/projects.ts` | 590 | 591 |
| `src/lib/server/content/audit/website/cv.ts` | 433 | 537 |
| `src/lib/server/edit/feeds/literature.ts` | 301 | 295 |
| `src/lib/server/edit/feeds/radar.ts` | 229 | 229 |
| `src/lib/server/edit/writes/entries.ts` | 648 | 653 |
| `src/lib/server/edit/writes/manifest.ts` | 779 | 796 |
| `src/lib/state/boards/collection/bar.ts` | 532 | 534 |
| `src/lib/state/boards/collection/card-order.ts` | new | 102 |
| `src/lib/state/boards/collection/index.ts` | 872 | 782 |
| `src/lib/state/boards/focus/focus-lanes.ts` | 309 | 322 |
| `src/lib/state/feeds/leads.ts` | 237 | 254 |
| `src/lib/state/feeds/literature/bibtex.ts` | 189 | 190 |
| `src/lib/state/feeds/literature/saved.ts` | 78 | 88 |
| `src/lib/state/forms/career-view.ts` | 122 | 122 |
| `src/lib/state/forms/record-values.ts` | 316 | 316 |
| `src/lib/state/forms/schema.ts` | 627 | 637 |
| `src/lib/views/boards/collection/Collection.svelte` | 447 | 447 |
| `src/lib/views/shared/card/feed/LeadCard.svelte` | 450 | 454 |
| `src/lib/views/shared/forms/entry/edit/FieldControl.svelte` | 357 | 368 |
| `tests/checks/tree/allow-duplication.txt` | 21 | 21 |
| `tests/data/helpers/period.test.ts` | new | 128 |
| `tests/data/hubs/website-files.test.ts` | 703 | 704 |
| `tests/data/snapshot/normalise.test.ts` | 397 | 398 |
| `tests/data/sources/career.test.ts` | 412 | 412 |
| `tests/data/sources/feeds.test.ts` | 110 | 110 |
| `tests/routes/hubs/make.test.ts` | 647 | 647 |
| `tests/fixtures/hubs/demo/.oculus/config.yml` | 38 | 38 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/applications.yml` | 21 | 21 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml` | 175 | 175 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/education.yml` | 20 | 20 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/events.yml` | 44 | 44 |
| `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml` | 33 | 33 |
| `tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml` | 39 | 39 |

Every file is under 880 lines but `docs/templates.md` (1925 on the base, a document), every component under 520; `src/lib/state/boards/collection/` holds 5 items, `tests/data/helpers/` 4 (`ls | wc -l`).

Files outside the brief's paths list, each needed:

- `src/lib/state/boards/collection/bar.ts`: the bar's value order (`fieldOrder`) lists a `period` field's values newest first, which C19's filter needs.
- `src/lib/views/boards/collection/Collection.svelte`: imports `cardOrder` from its new file `card-order.ts` (a re-export from `index.ts` would be an import cycle, since `card-order.ts` imports `STATUS_FIELD` and `isPinned` from it).
- `config/text/views/boards/editor.yml`: the control's hint `editor.period_hint` and its refusal `editor.period_refused` (item 2's control, read by `FieldControl.svelte` and `state/forms/schema.ts` `periodRefusal`).
- `src/lib/state/forms/record-values.ts` lines 8-11: the comment table realigned after line 7 gained `period`.
- `config/schemas/manifest-schema.yml:12` (the paths list names 60 and 115): its comment of the widget types gains `period`.
- `config/options/schemas/manifest-schema.yml`: the type choice of a hub's `manifest_fields` row gains `period`, since `MANIFEST_WIDGETS` (`catalog-files/manifest.ts`) accepts it.
- `src/lib/data/shapes/catalog-files/vocab.ts:222` and `config/options/catalogs/vocab.yml:108`: the `waiting` flag's description says "asks a period", as `vocab.yml:105` does.
- `src/lib/data/snapshot/normalise.ts:519`, `src/lib/data/model/model-entities.ts` (`Funding`) and `docs/apps.md:406`: the funding entity reads `when` in place of `date`, since the rewritten funding file holds no `date` (see the judgment calls).
- `src/lib/state/boards/focus/focus-lanes.ts:291`: a comment said "a bare `date` does not count".
- `tests/routes/hubs/make.test.ts:247`: the funding template line's expected sort is `['status', 'when', 'deadline']`.
- `tests/checks/tree/allow-duplication.txt:16`: the clone of `leads.ts` and `radar.ts` starts at line 159 of `leads.ts` now (lines 145-156 on the base and 159-170 now are the same text, `diff` printed nothing), so its reason says 159.
- `docs/diagrams/*`: `npm run diagrams`.

## Item 11's grep

`grep -rniF --exclude=local.yml <word> docs README.md config`, each hit read:

- `duration`: 3 hits, `config/text/views/system/machine/usage.yml:14-16` (`duration_days_hours` and the two beside it), the usage view's time words, still true.
- `CV period`: 1 hit, `config/schemas/manifest-schema.yml:115`, the new `cv.when` label, rewritten.
- `cv.duration`: 0 hits.
- `rolling`: 12 hits: `docs/templates.md:823` (the scout step), `:1679` and `:1694` (the leads template), `config/text/views/feeds/leads.yml:30` (`rolling: Rolling`), all rewritten; `docs/templates.md:1170` (a venue's `timing: "rolling"`), `docs/HELP.md:573`, `config/options/appearance.yml:217`, `config/defaults/appearance.yml:215` and the four `pdf_scroll_*` of `config/text/views/sources/file.yml:41-44` ("scrolling"), no lead deadline, still true.
- `deadline`: 151 hits, read by file. Rewritten: `docs/templates.md:92,95` (the collections list's sorts), `:823` (the scout step), `:1678-1679,1693,1696` (the leads template), `config/defaults/sources.yml:45,48`, `config/options/sources.yml:107`, `docs/HELP.md:279` (the sort sentence). Still true: the venues' `deadline` and `deadline_month` (`docs/templates.md:1150-1172`, `config/text/views/sources/venues.yml`), the collections' own `deadline` lines of type `date` (`docs/templates.md:1411,1440,1465,1490,1512,1545,1573,1591,1606,1618`), the tasks list line (`:96`), the ticker and command-center groups (`docs/templates.md:443,445`, `docs/data-map.md:57,112`, `config/catalogs/vocab.yml:217,224`, `config/options/catalogs/vocab.yml:256`, `config/text/views/boards/focus.yml`), a project's `deadline` (`config/schemas/manifest-schema.yml:76`, `docs/HELP.md:282-310`, `config/text/views/boards/project.yml`, `projects.yml`), the leads horizon (`config/options/behavior.yml:199`, `config/defaults/behavior.yml:63`, `config/options/layout.yml:284`), `leads.no_deadline` (still drawn on an expired lead with no day), the apps payloads (`docs/apps.md:402,403,439,440`), the subtask and dated lines (`docs/templates.md:948`, `config/text/findings.yml:366`, `config/text/server.yml:559`), the README's Focus lines (`README.md:9,11,34`), the glyph and icon names (`config/catalogs/glyphs.yml`, `icons.yml`), the files words (`config/text/views/sources/files.yml:88,102`), and the `deadline_met` and `closes_deadline` flags (`config/catalogs/vocab.yml`, `config/options/catalogs/vocab.yml`). None names a lead's deadline as text.
- `date` (`grep -rniw`, 83 whole-word hits): rewritten: `docs/templates.md:71` (the sort comment), `:1116` (the schema line's types), `config/defaults/sources.yml:32`, `config/options/sources.yml:107`, `docs/HELP.md:279`, `docs/data-map.md:254-255` (the type table), `config/schemas/manifest-schema.yml:12`, `config/options/schemas/manifest-schema.yml:27` (the type choice list, `period` after it), and, with no `date` hit left, `docs/apps.md:406` (the funding payload's `date?` became `when?`) and `config/catalogs/vocab.yml:105`, `config/options/catalogs/vocab.yml:108`, `src/lib/data/shapes/catalog-files/vocab.ts:222` ("asks a date" became "asks a period"). Also still true, each a day or a word of its own: `docs/templates.md:824` (the run log line starts with today's date), `:871` (the LinkedIn post files), `:947` (`snooze`), `:1150`, `:1646`, `:1714`, `:1749` (`date`-type lines of `deadline`, `added`, `found`, `milestone_date`), `docs/HELP.md:282-283,287,296` (deadline tags, follow-up `after:` dates, the Not before date), `:333` (the last sweep's date), `:573` (the Calendar's day and date headings), `:604` (a repository's `date`), `docs/apps.md:490` (`Date.now()`), `config/options/behavior.yml:1034,1403,1597` and `config/defaults/behavior.yml:544,596,614,640,690,692,739,785,872` (the literature sources' `date` keys and the Focus horizons), `config/schemas/manifest-schema.yml:76-80,91,97,99,104,131-132` (a manifest's dated fields), `config/text/views/system/audit.yml:37` ("deposit dated"), `config/text/views/boards/project.yml:23` (a follow-up's date), `config/text/views/boards/deposit.yml:53,84,88`, `config/text/server.yml:387` (a LinkedIn post's date). Still true: the fields of type `date` that are no entry's period (`deadline`, `snooze`, `added`, `found`, `milestone_date`, the leads' `date` "Day found." at `docs/templates.md:1677,1692`, a manifest's `code_availability.date`, `zenodo_date`, `repository.date`, `reproduced.date`), the letter's `date` (`docs/templates.md:1879`), the manifest template's `date: YYYY-MM-DD` lines (`:953,970,973`), the follow-up `after` date (`docs/data-map.md:240`, `docs/apps.md:441-442`), the literature reader's `date` operations and sort (`config/defaults/behavior.yml`, `config/text/views/feeds/literature.yml:63`), the LinkedIn post's `date:` (`docs/HELP.md:339`, `config/text/views/feeds/linkedin.yml:18`), the stale and cadence days (`config/options/behavior.yml:146,184,189,194,204`, `config/defaults/behavior.yml:3,52,59`), the undated task lines (`docs/templates.md:68`, `config/options/sources.yml:118`), the deposit's today's date (`config/text/views/boards/deposit.yml`), `type_date` (`config/text/server.yml:351`, a `date` field's refusal), the Calendar's date headings (`docs/HELP.md:573`) and `docs/licenses/LGPL-2.1.txt:170`.
- The head comments of the changed files, `grep -nE "duration|\`date\`|'date'|rolling|CV period"`: `cv.ts:13-14` (the CV file's `duration` and awards `date`, the website's keys, decision 8), `dates.ts:17` (`ISO_DATE`), `record.ts:6`, `leads.ts:2`, `LeadCard.svelte:9`, `model-collections.ts:206`, all written by the step, still true.

The history grep over the added lines, `git diff -U0 | grep '^+' | grep -niE '\b(before|used to|no longer|still|previously|anymore|now|formerly|was renamed|old)\b'` and over the two new files: 4 hits, all of order ("the second not before the first", "Negative when `a` comes before `b`" twice, "so `2` sorts before `10`"), none of history.

The renames, grepped across `src tests config docs README.md`: `cardOrder` lives in `card-order.ts`, imported by `Collection.svelte` and named as a folder function in `schema/run.ts:363` ("state/boards/collection/ `cardOrder`"), still true; `cv.duration` has no hit; `deadlineLine` (the lead card's line, `leads.ts` and `LeadCard.svelte`) is a name of its own, since `deadlineWords` is the board's deadline toggle (`state/boards/board/filter-menu.ts:243`).

## Judgment calls

1. `UNKEYED_TYPES` (`model-collections.ts:73`) is left as it is: a period is one scalar, as a date is.
2. The demo hub's applications sort `[status, when]`: its applications schema holds no `deadline` (`grep -c deadline` printed 0), and a sort field the schema does not name is a finding.
3. The demo funding `sub` help is "Scheme | role | length" as before, its entries' `sub` texts having no period.
4. A lead holding a day and `rolling: true` prints "2026-12-15 | Rolling": the hub's separator ` | ` of a card's words.
5. A year typed in the entry editor is written as the text typed, `when: "2026"`; the manifest editor writes `year: 2027` as a number (C6). Both read as the same period. Rule 10's whole-number year is a rule of the hub rewrite, which writes them that way.
6. The CV's month words and "Current" are held in `cv.ts`, not in oculus's text catalog: they are the website's CV text in the website's language, written into its file, and not words oculus draws.
7. A profile award row prints its period as text ("2016", "Feb. 2016") in the employer CV, as `industry.yml`'s award rows hold it, and the academic CV's awards print the timestamp `to_date` parses.
8. A career row naming `funding:` takes what `careerFields` takes, with `when` in place of `date` and `duration`; the hub's one such row (`awards[...] funding`) has no period of its own.
9. `Project.yearWritten` (`model-entities.ts`) carries the manifest's `year` as written, so the project form shows `2025-09` as written while `Project.year` stays the start year 2025 for its readers.
10. The career template's prose names "the place and the period in `awards`" and a sentence on the period form, the word "day" there becoming "period".
11. The zone of a date-time is held to hours 00-23 and minutes 00-59, the same as the time.
12. The funding entity's `date` became `when` (`Funding.when?: string`, a year read as its text), in `normalise.ts:519`, `model-entities.ts` and `docs/apps.md:406`. After the hub rewrite no funding entry holds `date`, so the field would always be empty. It is a key of the `portfolio` payload apps read (`docs/apps.md:406`), and no reader in oculus uses it (`grep -rnE "(scheme|funding|fund|grant|f|entry|e)\.date\b" src` names none). The alternative, keeping `date` empty in the payload, leaves a key that no file fills; the orchestrator may rule otherwise.
13. C15 and C16's "no `date`" is read as no `date` field that is an entry's period: the leads' `date` (day found) and the career letter's `date` stay, as the brief's items 7 and 8 leave them.
14. Until the orchestrator rewrites the research hub at landing, the shipped sorts naming `when` and the manifest schema's `cv.when` give the hub 21 findings (C18's copy before the rewrite): the landing applies the code and the rewrite together.

## Visible changes

- Collections' order (C18 on the hub copy, `O144_RADAR=1`; before is the base sort on the copy before the rewrite, through the text and date branches, which `card-order.ts` holds as the base's `index.ts:746-818` held them, `diff` of the two blocks showing only the head comment, the imports, the collator moved with the sort, and the period branch):
  - Events, before by `[status, date]`: `research-visit-linkoping-sweden, 3mi-labs-talk, chi-2016-video, kuleuven-news-bronze-medal-2017, dtai-news-bronze-medal-2017, mindspeller-concert-2019, science-for-peace-2021, ..., xai-nl-meetup-2026, mentoring-trajectory-info-session, flta-2026, technopolis-day-of-science-2021, graz-bci-conference-2026` (completed oldest first). After by `[status, when]`: `research-visit-linkoping-sweden, 3mi-labs-talk, flta-2026, mentoring-trajectory-info-session, xai-nl-meetup-2026, flta-2025, fllm-2025, ohdsi-europe-2025, guest-lecture-kuleuven-2025, inkendaal, ..., chi-2016-video, technopolis-day-of-science-2021, graz-bci-conference-2026` (completed newest first; `technopolis-day-of-science-2021` and `graz-bci-conference-2026` hold other statuses).
  - Education, before: `msc-supervision-statistics-data-science-2026-2027, msc-health-sciences-cardiovascular-mri-2026-2027, thesis-topic-master-informatics, student-representative-uhasselt, coach-coderdojo, ..., msc-supervision-computer-science-2025-2026, reader-2026`. After: `msc-supervision-statistics-data-science-2026-2027, msc-health-sciences-cardiovascular-mri-2026-2027, thesis-topic-master-informatics, reader-2026, bioinformatics-2025-2026, data-science-in-healthcare-4747-lecturer, msc-supervision-computer-science-2025-2026, bko, ..., student-council-stura-uhasselt, coach-coderdojo, student-representative-uhasselt`.
  - Funding, before by `[status, deadline]` and after by `[status, when, deadline]`: the same order but `ZonMw-AI-HCC` before `FAIR` (2026/.. after 2024/2026-01) and `2024-fwo-postdoc-fbttr` before `2022-fwo-postdoc-sign-language`.
  - Applications, before by `[status, deadline]` and after by `[status, deadline, when]`: the undated entries of one status order by `when`, so `2026-uantwerpen-biomedical-data-science-zap` moves before `2025-denmark-ai-zap` and `2025-ucd-rwe-zap` before `2024-lund-paleogenomics`; the dated ones keep their order.
- Radar lines of the four dated events: before, `entryDate` read a day `date` (the brief's `focus-lanes.ts:270-274`; C7's base run, `{"date":"2026-11-10"} -> "2026-11-10"`), and the hub holds `flta-2026` `date: "2026-10-29"`, `mentoring-trajectory-info-session` `"2026-10-27"`, `research-visit-linkoping-sweden` `"2027-03-01"`, `graz-bci-conference-2026` `"2026-09-14"` (`grep` of `events.yml`). After (C18, `entryDate` on the rewritten copy): `flta-2026` on 2026-10-27, `mentoring-trajectory-info-session` on 2026-10-27, `graz-bci-conference-2026` on 2026-09-14, and `research-visit-linkoping-sweden` none, its `when` being the month 2027-03 (decision 2). Every other radar day of the copy is the same before and after.
- The editor's control for `when`: before, a `when` field was a plain text control taking any text (C6's base run wrote "Sept. 2025"). After, a one-line text control with the hint "2025, 2025-09, 2026-10-27 or 2025-09/2026-09", marked wrong while typed text is no period, its message "not a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09"; a save of such a value is refused with "when takes a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09" (C6).
- The Literature view's year filter: before, `year` was a `text` field with `filter: true`; after, a `period` field with `filter: true`, no finding, its values listed newest first (`2026`, `2025-09`, `2024`, `2021`, C19), each filtering by the stored text.
- The CV's period texts: the tables of "Hub rewrite"; "January" and "Sept." become "Jan." and "Sep.", "Present" becomes "Current", "2022-2025" becomes "2022 - 2025", a student's period prints as "(2025 - 2026)", FLTA 2026's news row prints "Oct. 2026" in place of 2026, and the postdoc-uhasselt row loses "(Research Affiliate from 2026)" from its period, the words going to its text.
- A lead card's deadline line: before, the deadline as written ("rolling (open)", "2026-12-15") and no line for a lead without one. After, the day, "Rolling", or "2026-12-15 | Rolling"; no line for a live lead with neither; "no deadline" on an expired lead with none, as before (C14).
- The Make item's new files: the events, education, funding and career files hold `when` (`period`) in place of `date` and `duration`, applications `when` with the help "When you applied: a year, a month or a day.", leads `deadline` of type `date` with `rolling` and `note`, and literature and radar `year` of type `period` (C15).
- The `portfolio` payload's funding records carry `when?` in place of `date?` (judgment call 12).

## Anything in the brief that was wrong or impossible

- Item 2 gives `docs/data-map.md`'s type-table text as "a date or a span, EDTF: `2025`, `2025-09`, `2026-10-27`, `2026-10-27T11:00:00`, `2025-09/2026-09`, `2025/..`". A document line holding a day `YYYY-MM-DD` fails `tests/checks/source/history.test.ts` "names no package id, date or session in any document" (its `DATE` pattern, `:65`), which the quick tier's first run printed for this line and for two commented examples of `docs/templates.md` (`when: "2026-10-27/2026-10-30"` in the events entry and `when: "2023-06-01"` in the career awards). The check is left as it is; the table reads "a year `2025`, a month `2025-09`, a day `YYYY-MM-DD`, a moment `YYYY-MM-DDTHH:MM:SS`, a span `2025-09/2026-09`, an open span `2025/..`", and the two examples are `when: "2026-10"` and `when: "2023-06"`. The catalog sentences of item 2 keep their day `2026-10-27`: they are YAML values, which the check does not read.
- "What is on the tree" lists the type-word lists to change; four more needed it: `config/options/schemas/manifest-schema.yml:19` (a hub field's type choice), `config/schemas/manifest-schema.yml:12` (the widget comment), `bar.ts` `fieldOrder` (C19) and the funding entity's `date` (judgment call 12). It also omits `tests/routes/hubs/make.test.ts`, which asserts the funding template line's sort.
- The CV builder's awards rule (item 5) and C10 hold for the academic CV; an award row of an employer CV prints text (judgment call 7), which the brief does not say either way.
</content>
