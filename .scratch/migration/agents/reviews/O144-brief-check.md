# Brief check of O144 (`.scratch/migration/agents/briefs/O144.md`, main at 57295adb6)

Every read below was made on main at `57295adb6` (`git log --oneline -1` prints `57295adb6 Draw a nested group's heading one level down`) and in `/Users/axelfaes/workspace/research-hub`, read only. I changed no file. The scratch folder is empty.

## Names

1. **`grammar.ts:30` is not a list of type words (brief :11, item 2 at :42).** `sed -n 1,45p src/lib/data/sources/config/settings/rows/grammar.ts` shows that `'date'` at :30 belongs to `FIELD_OPS`, "The named operations a field record may apply to what its path or selector read", the reader-row grammar of `literature.sources`. Item 2 says to add `period` to "every list of type words named", so it would add a field operation that does not exist. To close: take `grammar.ts` out of :11 and out of "Paths this step writes" (:101).
2. **Two type lists the change makes false are missing (:11).** `src/lib/data/model/model-collections.ts:258` holds `FILTERED_TYPES = ['select', 'tags', 'text']`, and `run.ts:238` gives a finding for "`filter: true` on any other type". The Literature `year` field carries `filter: true` in oculus's template (`docs/templates.md`, the literature section's line 14: `{ field: year, type: text, filter: true, ... }`) and in the hub (`.oculus/data/literature/literature.yml:11`). When item 6 types it `period`, it becomes a schema finding and the Literature view loses its year filter. `UNKEYED_TYPES` (`model-collections.ts:73`) and the type comment of `src/lib/state/forms/record-values.ts:7` ("text, textarea, select, date  a string") are also lists of type words. To close: name `FILTERED_TYPES` with the rule for `period`, and add `model-collections.ts`, `run.ts` if touched, and `record-values.ts` to the write list.
3. **The schema finding's wording and code live outside the write list (item 2 at :43, write list :99).** A date pattern finding is worded in `src/lib/data/snapshot/schema/check.ts:277-296` (`pattern === ISO_DATE.source` picks `findings.schema.not_a_date`, `config/text/findings.yml:325`). Any other pattern falls to `not_form`, which prints the raw regex to the reader. A JSON-schema pattern also cannot express "the second not before the first" or the calendar rule. Neither `check.ts` nor `findings.yml` is in the write list, and the brief dictates no finding sentence. To close: add both files and dictate a `findings.schema.not_a_period` sentence.
4. **Sort texts outside the write list that the change makes false (item 3, item 11).**
   - `config/options/sources.yml:107` says "a date field oldest first".
   - `docs/templates.md:71` says "a field of the type `date` oldest first".
   - `docs/templates.md:90-94` holds a copy of the collections list with `sort: [status, date]` and `[status, deadline]`.
   - `docs/HELP.md:279` says "a date oldest first" and "the Columns menu ... of the types select, text, tags, chips and date".

   The write list gives `docs/templates.md` only as `793-830, 1114, 1397-1760` and a `cv:` block, and does not list `docs/HELP.md` or `config/options/sources.yml`. The premise at :22, "No sentence of docs/HELP.md names ... a collection's `date` field", rests only on `grep -n "duration\|CV period"`. To close: widen the write list to these lines, and correct :22.
5. **The demo hub's own sort keys (item 9, :23, write list :127).** `tests/fixtures/hubs/demo/.oculus/config.yml:17-21` sets `sort: [status, date]` for events and education. Once the demo schema loses `date`, that is a G56 finding ("a field the `sort:` ... names that its schema does not"). The file is not among "the files named in What is on the tree". To close: name it.
6. **The career template runs past :1760.** `grep -n "^### \|^## " docs/templates.md` shows `career.yml` at :1736 and the next section at :1906. The `duration` lines at :1763, :1777, :1846, the award and profile `date` lines, and the commented entries at :1889 and :1891 (`grep -n "\bduration\b" docs/templates.md`) all lie outside `1397-1760`. To close: write `1397-1905`.
7. **The education template's students record (item 8 at :56 says "nothing else of those templates changes").** `docs/templates.md:1538` reads `{ field: degree, type: text, help: "The degree and year, as the CV prints them." }`. Rule 62 and C11 need a student `when` field, and the degree loses its years. The education `sub` help at :1509 ("Institution, period.") also becomes false once rule 60 cuts the period out of `sub`. To close: add `{ field: when, type: period, ... }` to the students' fields, rewrite the degree help and the education `sub` help, and drop "nothing else ... changes".
8. **Lead deadline as text, outside the write list (item 7, item 11).**
   - `src/lib/data/sources/documents/feeds.ts:38-61` reads the model `Lead.deadline` with `DATE = /\d{4}-\d{2}-\d{2}/` "anywhere inside a string; the leads feed writes prose around its dates".
   - `src/lib/data/model/model-collections.ts:427` says "The ISO date inside the feed's own `deadline:` text".
   - `src/lib/state/workbench/rail-badges/rail-badges.ts:69` reads `deadlineOf`.
   - `ticker.ts:364` (named at :19) reads `lead.deadline` from `feeds.ts`.

   If the prose search stays, it is code that tolerates the old form, against `agents/spec.md:43` (no migration code). To close: name these files and say that `deadlineOf` and `feeds.ts` read the field as a day only.
9. **Radar and literature year readers left out (item 6 at :54).** `src/lib/server/edit/feeds/radar.ts:135` reads `Number(text('year'))`, and `src/lib/state/feeds/literature/saved.ts:51,74` read `year` as `textOrNumber` (`grep -rn "\.year\b\|'year'" src`). The brief names only `literature.ts:174` and `bibtex.ts:145`. To close: name them, or state that each stays correct and why.
10. **The project form's `year` value (item 6).** `src/lib/state/forms/schema.ts:464` fills the form with `year: project.year`, the model's number. Under item 6 that number is the start year, so a manifest holding `year: 2025-09` opens in the editor as `2025`. To close: name `schema.ts` and say that the form shows the stored period.
11. **The audit's catalog sentence.** `config/text/views/system/audit.yml:41`, "status "{0}" but no date tracked", still names a date. It is not in the write list, and item 4 leaves it unmentioned. To close: rule on it.
12. **`when` collisions (:20).** No key collision. `grep -rn "\bwhen\b" src/lib/data/snapshot/schema/*.ts` shows `when` read only as a schema line's attribute (`field.ts:152`) and never as an entry key. Premise :20 quotes the hub's help "When it is due, as text." (`research-hub/.oculus/data/academic/career.yml:17`). Oculus's template at `docs/templates.md:1753` says "When.". The hub rewrite should also rewrite the hub's help, since "as text" becomes false.
13. **The other names hold.** `cv.duration` hits only at `config/schemas/manifest-schema.yml:115` (`grep -rn "cv.duration" --exclude=local.yml src tests config docs README.md`). `\bduration\b` hits outside the write list are `codex.ts:137`, `format.ts:94`, `Usage.svelte:101,125` and `commands-fixture.ts:2`. They are other meanings, and the change leaves them true. The test hits (`website-files.test.ts:199-200,658-661`, `career.test.ts:39,183,367-372`) fall under "the tests that read the fields".

## The step line

The step line is `plan.md:1669`. Ruling 670 is `plan.md:3534` and ruling 671 is `:3535`. Each part maps to a requirement:

| Part of the line or ruling | Requirement in the brief |
|---|---|
| `period` type (EDTF levels 0 and 1's open end) | items 1 and 2 |
| checked | item 2 |
| sorted newest first (670 1 (a)) | item 3 |
| stored once in `when`, `date`, `duration`, `sub` periods and When rows gone | items 8 and 10, item 6 for `cv.when` |
| publication years of the type | item 6 |
| CV prints a month period abbreviated (670 2 (a)), down to the month, a day as its month (671 2 (a)) | item 5 |
| leads' `deadline` a `date` with `rolling` (670 3 (a)) | item 7 |
| reader by hand in `dates.ts` with a table test, no `edtf` (671 1 (a)) | item 1, "Libraries checked" |

Every part has a requirement. Two requirements depart from the line:

- **Item 1 (:39) is outside EDTF level 0.** It accepts `YYYY-MM-DDTHH:MM` and allows a time inside a span. The LoC EDTF page (https://www.loc.gov/standards/datetime/, fetched this turn) gives level 0 date and time as "[date]["T"][time]", "Complete representations", with every example carrying seconds ("1985-04-12T23:20:30"). It says level 0 intervals have "both the start and end are dates" and "Time of day is excluded". The step line says "EDTF levels 0 and 1's open end", and C1 (`2026-10-27T11:00`) and the data-map row (:42) carry the minute form. To close: either accept `YYYY-MM-DDTHH:MM:SS` outside spans only, or record the departure as a decision for the orchestrator.
- **Item 7's `note` field** goes beyond ruling 670. It is declared as decision 6, so it is not silent.

No requirement covers the `when` field inside the education students' records (Names 7).

## Premises

- :11. `FIELD_TYPES` at `record.ts:90-100`, `valueSchema` at `:188-189`, `ISO_DATE` at `dates.ts:11`, 57 lines (`wc -l`): hold. `grammar.ts:30` is wrong (Names 1). `catalog-files/manifest.ts:20`, `schema/manifest.ts:39-51`, `career-view.ts:54`, `writes/manifest.ts:142`, `collection/index.ts:176` and `templates.md:1114` hold.
- :12. Hold. `typeRefusal` runs 83-111. `server.yml:351` is `type_date: '{0} takes a date written YYYY-MM-DD'`. `FieldControl.svelte:218-223` draws `DateInput`. All three prompts test `field.type === 'date'`, and each reads only the `deadline` field (`entry-actions.ts:211,249`; `RecordPick.svelte:143-149`, "The type of the deadline field").
- :13. **Wrong.** "`sources.yml:46-48` ... funding and applications by `[status, deadline]`": `grep -n "sort: \[status" config/defaults/sources.yml` puts funding at :45, events :46, education :47, applications :48. The write list's `45-48` is right. `fieldCompare` 778-789 with its doc comment at 772, 872 lines and 4 folder items hold. `sortText` to `cardOrder` runs 746-818. "the hub's .oculus/config.yml sets no collections:" holds (`grep -n collections` hits only the comment at :3).
- :14. `focus-lanes.ts:263-274` and `ticker.ts:329` hold.
- :15. `projects.ts:505-510,554`, `audit.yml:41` and `vocab.yml:105` hold.
- :16. `cv.ts` is 433 lines, and `SECTIONS :38-49`, `FROM_RECORD :64-70`, `entryFields :109-116`, students `:222-234` and manifests `:283-291` hold. On the website, `to_date` at `cv_pdf_generator.py:54-56`, `honors.tex.template:10`, `about.html:29` and `_industry/src/cv/awards.tex.template:10` hold.
- :17. Holds. `manifest-schema.yml:60` reads "as a whole number", `:115` is quoted correctly, `normalise.ts:292`, `publication.ts:71`, `model-entities.ts:262`.
- :18. **Partly wrong.** The radar template's `year` help is "Year." (`sed -n 1695,1734p docs/templates.md`: `{ field: year, type: text, section: Core, help: "Year." }`), not "a whole number". It omits the literature year's `filter: true` (Names 2).
- :19. **Wrong for oculus.** `sed -n 786,834p docs/templates.md` holds no `deadline: "2026-08-15" # or "rolling (open)"` line; step 4 says only "in the fields of the file's `schema:`". Only the hub's `.oculus/tasks/scout.md:107,120` hold the text-deadline lines. The rest of :19 holds: `leads.ts:137-200`, `LeadCard.svelte:141-149,314-319`, the template at `:1664-1693`. **Also imprecise:** `LeadCard.svelte:314` draws the deadline line only `{#if deadline !== '' || expired}`, so a live lead with no deadline prints nothing, and `leads.no_deadline` shows only on an expired lead.
- :20 and :21. Hold. `data-map.md:242`, `templates.md:1407,1436-1437`.
- :22. `data-map.md:244-262` and `vocab.yml:105` hold. The HELP.md claim is too narrow (Names 4).
- :23. Imprecise. The demo `leads.yml` carries no `schema:` (`grep -n schema` prints nothing), and the demo `.oculus/config.yml` sorts are missed (Names 5). Each demo academic file carries its own `schema:` (`grep -n "^schema:"`).
- :25. Events: 27, `date` on 26 (22 years, 4 days), `duration` on 22, 5 When rows. Holds (python read of `events.yml`).
- :26. Education: 26, `date` 7 years and 19 ranges, `duration` on 17. **Imprecise:**
  - The durations come in more than four styles. Single years `2024`, `2025` and `2026`, and the mixed `Mar. 2018 - 2024`, `Sept. 2015 - 2024` and `Sep. 2014 - 2025` also occur.
  - "11 `sub` texts end with the same period" is wrong: 9 end with it and 2 hold it in the middle (`advanced-topics-in-data-science`, `data-science-in-healthcare-...`), which item 10's own example shows.
- :27. **Wrong.** Funding "`date` on 12, all years": 11 are years and `ELIXIR-BE` holds `'2023-2025'`. The `duration` list holds (two are the integer 2026).
- :28. Applications: 32, `date` on 32, all years. Holds.
- :29. Career holds: 8 positions, 8 degrees, 8 awards with timestamp dates, `order` `when` values `''`, `''`, `'Oct 2027'`. The profiles' rows: experience, projects, education and teaching hold `duration`, and awards hold `date`. The letters' `date` are "June 2026" and "July 2026" (engine).
- :30. Holds. Further degree forms: "Doctoral Program in Biomedical Sciences (daily supervision 2022-2023)" and "Master Statistics & Data Science (2024-2025)".
- :31. **Wrong counts.** `find projects side-projects -name project.yml | wc -l` prints 121. 120 lie outside a dot folder, and one is `side-projects/theaxec.github.io/.oculus/project.yml`. The brief says 119. `year`: 50, all `int`, holds. `cv.duration`: 16 manifests (python read, and `grep -l "^cv:"` with an indented `duration:`), not 15; the 16th is the integer `2018`. Oculus's `.oculus/project.yml:30` reads `duration: '2026 - Current'`, which holds. No other `~/workspace/*/.oculus/project.yml` carries `year` or `cv.duration`.
- :32. Leads: 74 entries, schema at `:58-68`, 60 days, 14 others. Holds. **Missing from the quoted list:** 4 of the 14 are "not stated (...)" forms:
  - "not stated (listed 2026-11-02)"
  - "not stated (posted 2026-09-18)"
  - "not stated (published 2026-08-20; unverified, see log)"
  - "not stated (posted 2026-10-30, start February 2027)"

  The other non-day values are "rolling (open)" (4 times), "rolling (open until filled)", "Open until filled", "2026-11-05 (12:00 UTC+1)", "2026-11-05 (rolling review, may close early)", "2026-12-15 (or until filled)" and the Closed line. All 14 are `declined`.
- :33. Literature: 0 entries. Radar: 678 entries, all `int` years. Holds.

## Cases and checks

- **C1 and C2 (:75-76) clash with `agents/spec.md:60`.** That rule says "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it". `grep -n "dates\.ts\|helpers/dates" .scratch/migration/agents/guarded.md` prints nothing. Ruling 671 1 (a) approves "a table test", but the builder may not edit `agents/guarded.md` (`spec.md:36`), and the brief names no entry. To close: the orchestrator adds the entry (file and title) before dispatch, and the brief names it. C1 also carries `2026-10-27T11:00`, which is outside EDTF level 0 (The step line).
- **C3 (:77) cannot be produced by the plain rule.** Item 1 says "by start, then by end, an open end after every end, a later one first", but never says how two starts of different precision compare. Starts compared at their first day give `2026-10-27/2026-10-30, 2026, 2025-09/2026-09, 2025-09/2025-12, 2025/.., 2025`. C3 expects `2025/..` before `2025-09/2026-09`, which needs comparison at the coarser precision, while `2026-10-27/...` before `2026` needs a finer-first tie rule. A comparison at the coarser precision can also fail to be transitive. To close: define the key of a start and of an end at each precision in item 1, and recompute C3's expected order.
- **C14 (:88), third clause.** "a lead with neither prints `leads.no_deadline`" is false on the base for a live lead (Premises :19), and item 7 never asks for the change. To close: either add the change to item 7 or say that a live lead with neither prints no deadline line.
- **C15 (:89) leaves out `literature.yml` and `radar.yml`.** Their `year` is retyped in item 6, and the literature `filter: true` then gives a finding (Names 2). To close: add them.
- **Item 2's prompts clause (:45) asks for no change.** The three prompts read only `deadline`, which this step types `date` or leaves alone, and a type other than `date` already reads as text. To close: drop `entry-actions.ts`, `RecordPick.svelte` and `record-menu.ts` from the write list, or say "read, no change".
- **C17 (:91)** reads `date` behaviour in `fieldCompare` and `typeRefusal`, both of which the step changes. It holds.
- **The other cases** (C4 to C13, C16) are consistent with `agents/spec.md`. C4 to C17 are run by a case-run program, which `spec.md:66` allows.

## The question

The goal part is one stored, typed, sorted period per entry, printed in one CV form.

- **C1 and C2:** yes. The reader can be right while nothing calls it.
- **C3:** yes, as written. Its order is undefined (above), so a comparator can satisfy it while the rule stays ambiguous.
- **C4:** yes. It runs on entries built in memory. No case shows the hub's own events after the rewrite.
- **C5:** yes. A regex refusing "2025 - 2026" passes while `2026/2025` and `2026-02-30` stay unchecked. Add both as rows.
- **C6:** yes for the manifest editor. `coerce` in `writes/manifest.ts:183-200` refuses no text value, so `year` and `cv.when` can be written as any text.
- **C7 and C8:** no for their parts.
- **C9:** yes. It tests the formatter alone. No case has a collection entry (`cv_section: news` with `when`) or a career position row printing its `duration` from `when`. Add one each.
- **C10 to C13:** no for their parts.
- **C14:** see above.
- **C15:** partly. It omits two retyped files.
- **C16:** **yes.** Every demo academic file carries its own `schema:` (`grep -n "^schema:"`), so an unrewritten demo hub with `date` and `duration` typed `text` loads with no new finding. To close: C16 also asserts that no demo entry holds `date` (beside leads), `duration` or a When row, and that the demo config's sorts name `when`.
- **The verify list (:160-167):** yes. Every command is format, type and lint.
- **Item 10:** yes. Nothing runs it. The before and after CV texts could be written by hand. To close: the case-run program applies the rewrite in memory to copies of the hub files, runs the schema check on them and runs the CV builder, and prints each changed row's text beside `_data/data.yml`'s.
- **Item 9:** the same as C16.

## Implied inputs

- **Hub rewrite, lead deadlines.** The 4 "not stated (posted|listed|published <day>)" deadlines happen in the hub. Rule 66, "a day with words keeps the day", would store the posting day as the deadline. Expected: no `deadline`, the words in `note`.
- **Hub rewrite, the scout task.** `.oculus/tasks/scout.md:107` (`deadline type: text`) and `:120` (`deadline: "2026-08-15" # or "rolling (open)" etc.`) are hub files that item 10 does not list. Left as they are, every new lead gives a schema finding. Expected: rewritten at landing, as item 7 rewrites oculus's text.
- **Hub rewrite, a placeholder day.** The event `research-visit-linkoping-sweden` has `date: '2027-03-01'` and When "March 2027 (day TBC)". "Most precise" gives `2027-03-01`, a day the When row says is unknown. Expected result to state; I judge it should be `2027-03`, with "Day to be confirmed." in `about`.
- **Hub rewrite, a day inside a span.** `flta-2026` has `date: '2026-10-29'` inside When "27-30 Oct 2026". State which wins. The span moves the radar day from 10-29 to 10-27.
- **Hub rewrite, the time.** `mentoring-trajectory-info-session`: "27 Oct 2026, 11:00" with `date 2026-10-27`. C7 and C9 have no time row. Expected: radar day 2026-10-27, CV "Oct. 2026".
- **Hub rewrite, YAML form.** Whether a year is written as an integer (`when: 2025`) or a string, and whether a day is quoted. Not stated.
- **Hub rewrite, schema help texts.** The hub's `applications.yml` `deadline` help reads "(the `date` field above is the year applied)", and the `career.yml:17` order help reads "as text". Item 10's "schema lines after the change" should carry them rewritten.
- **Oculus's own manifest.** `.oculus/project.yml:30` holds `cv.duration`. Item 10 says the step writes no `project.yml` and does not name who rewrites oculus's own. Expected: the orchestrator at landing, named.
- **Reader.** An integer of fewer than four digits (`999`) and an integer `0`: expected refused (C2 holds only the string `25`). A value with seconds or a zone: expected refused (or accepted, if the EDTF form is adopted).
- **Sort.** A span running through today (start past, end future). The sort and the radar read the start, so during the event the radar shows it as overdue. State the expected radar result.
- **CV printer.**
  - A student with no `degree` (`studentShape` makes it optional at `cv.ts:83`). Expected text not stated: "(2025 - 2026)" or the period alone.
  - A career award row naming `funding:` with no `when` of its own (`careerFields`, `cv.ts:262-276`). State whether it takes the funding entry's `when`.
- **Leads ordering.** A lead whose `deadline` is still prose, as the unrewritten scout writes it. Expected: a schema finding, and the lead read as undated.
- **Editor refusal.** The manifest editor's write of `year: "Sept 2025"` or `cv.when: "2025 - 2026"`. `writes/manifest.ts` `coerce` refuses no text, so the editor writes it, against item 2's "so the editor never writes one". Expected: refused with `server.entries.type_period` or its manifest sentence, and a case added.
- **Demo hub.** The demo `.oculus/config.yml` sorts (Names 5) and the demo `career.yml` profile rows. Expected: rewritten by item 10's rules.

## ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. `grep -n "adr" .agents/plan.yaml` prints nothing. This matches the brief at :5.

## Dictated text

- :42, data-map row "a date or a span, EDTF: `2025`, `2025-09`, `2026-10-27`, `2026-10-27T11:00`, `2025-09/2026-09`, `2025/..`" (`grep -n "a date or a span"` gives 42). Holds under `agents/spec.md` "The working rules", Prose bullet (:21). Its content is false: `2026-10-27T11:00` is not EDTF level 0 (The step line).
- :44, `server.entries.type_period`: "{0} takes a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09" (`grep -n "type_period"` gives 44, 80). Holds.
- :54, `cv.when` label "CV period" (`grep -n "CV period"` gives 54) and `year` help "The year the paper appeared, or of the project." (`grep -n "The year the paper appeared"` gives 54). Both hold. The `cv.when` help is not dictated ("help naming the period and an example"), so a builder writes it, under the same Prose rule.
- :55, "The deadline, a day.", "Applications are read as they arrive, with or without a deadline.", "Notes on the posting." and `leads.rolling` "Rolling" (`grep -n "The deadline, a day\|Applications are read\|Notes on the posting\|\"Rolling\""` gives 55). All hold.
- :56, "When it happens: a year, a month, a day or a span, such as 2025-09/2026-09 or 2025/.." (`grep -n "When it happens"` gives 56). Holds under spec.md:21. It replaces the applications' "Year applied.", so the template no longer says what an application's period is. That is a content point; no rule of the rules file names it.
- :56, "Scheme or role." (`grep -n "Scheme or role"` gives 56). Holds.
- :48, vocab.yml:105's "a period" (`grep -n '"a period"'` gives 48). Holds.
- :50, the month abbreviations and "Current" (`grep -n "Current"` gives 31, 50, 52, 59, 65, 88, 139). Hold.
- :61, "Research Affiliate from 2026." (`grep -n "Research Affiliate"` gives 29, 61). Holds.
- `LC_ALL=C perl -ne 'print "$.: $_" if /[^\x20-\x7E\n]/'` over the brief prints nothing.

## Declined to judge

- Whether `2026-10-27T11:00` should be kept as a recorded departure from EDTF or replaced: this is a decision for the orchestrator. The LoC page settles only the fact that it is outside level 0.
- The career file's write path for nested `when` checks: I read `recordRefusal` (`entries.ts:138-158`, which calls `typeRefusal` per sub-field), but I did not trace whether the Career editor posts through it.
- How the project form fills `cv.*` fields: `fieldValues` (`state/forms/schema.ts:441-500`) lists none, and I did not find the source.
- Whether any Python tool of the hub reads `.oculus/data/*.yml`, where an unquoted day would parse as a date object: not checked.
- Whether a test compares `docs/templates.md:86-96` with `config/defaults/sources.yml`: not checked.

Brief-check usage: aa81eb9066685f0b8, claude-opus-5-5, 248970 tokens, 104 tool uses, 14 min 45 s

## Closed

Each finding is closed by a change to `agents/briefs/O144.md`. No finding widens the step beyond its line (`plan.md:1669`): each fix makes the brief carry a requirement the line already states (the type checked, sorted, stored once, publication years of the type, the leads' deadline a day), so none goes to Axel.

- Names 1: `grammar.ts` taken out of the type lists and the paths; "What is on the tree" says `FIELD_OPS` holds `'date'` as an operation, untouched.
- Names 2: `FILTERED_TYPES`, `UNKEYED_TYPES` and the comment of `record-values.ts:7` named; item 2 adds `period` to `FILTERED_TYPES` so the Literature year filter stays; `model-collections.ts`, `run.ts` (if needed) and `record-values.ts` line 7 in the paths; new case C19.
- Names 3: `check.ts:277-296` and `findings.yml:325` named; item 2 dictates `findings.schema.not_a_period` and says the check runs the reader in code; both files in the paths.
- Names 4: `config/options/sources.yml:107`, `docs/templates.md:71, 86-96` and `docs/HELP.md:279` named in the sort premise, item 3 and the paths; the old premise on HELP.md removed.
- Names 5: the demo `.oculus/config.yml:17-21` named; item 9 rewrites its sorts; C16 asserts them.
- Names 6: the templates range is `1397-1905`.
- Names 7: item 8 adds the students' `when`, rewrites the degree help and the education and funding `sub` helps, gives applications their own `when` help, and drops "nothing else changes" for the fields it lists.
- Names 8: `feeds.ts:39,57`, `model-collections.ts:427`, `rail-badges.ts:69` and `ticker.ts:364` named; item 7 says `deadlineOf` and `feeds.ts` read the deadline as a day only.
- Names 9: `radar.ts:135` and `saved.ts:51,74` named in the premises, item 6 and the paths.
- Names 10: `state/forms/schema.ts:464` named; item 6 says the project form shows the stored `year`.
- Names 11: item 4 rewrites `audit.msg_entry_no_date` to 'status "{0}" but no period tracked'; `audit.yml` line 41 in the paths; C8 names the wording.
- Names 12: item 10 lists the hub's schema help texts naming old fields (the applications' `deadline` help, the career `order` help) among the rewritten schema lines.
- The step line, the time form: item 1 takes EDTF level 0's date-time `YYYY-MM-DDTHH:MM:SS` with an optional `Z` or offset, alone and never in a span (decision 9); C1 holds three date-time forms; C2 refuses the minute form and a time in a span; the data-map row reads `2026-10-27T11:00:00`.
- Premises :13, :18, :19, :23, :26, :27, :31, :32: corrected in "What is on the tree" (sort lines, the radar year help and the literature filter, the Scout task text in oculus and in the hub, the live lead's empty deadline line, the demo leads file without a schema, the education duration and `sub` forms, `ELIXIR-BE`'s range, 120 manifests and 16 `cv.duration`, the four "not stated" leads).
- C1 and C2, the test rule: G151 added to `agents/guarded.md` (`tests/data/helpers/period.test.ts`, describe 'a period'); the brief names it in "What is on the tree", item 1 and the paths.
- C3: item 1 defines the order by the first day of the start, then the last day of the end, an open end latest, newest first (decision 10); C3 recomputed to `2026-10-27/2026-10-30`, `2026`, `2025-09/2026-09`, `2025-09/2025-12`, `2025/..`, `2025`, a refused value, no value.
- C5: `2026/2025` and `2026-02-30` added.
- C6: the manifest editor's `coerce` refuses a bad period (item 2); C6 adds the `year` and `cv.when` writes.
- C9: a collection entry with a `cv_section` and a career position row added.
- C14: item 7 and C14 say a live lead with neither a deadline nor `rolling` prints no deadline line, as today.
- C15: `literature.yml` and `radar.yml` added, with the literature year's `filter: true`.
- C16: asserts no demo `date` (the leads' `deadline` aside), `duration` or When row, and the demo sorts naming `when`.
- Item 2's prompts clause: "What is on the tree" says the three prompts read only `deadline` and need no change; they are not in the paths.
- Item 10, unchecked: new case C18 applies the rewrite in memory to copies, runs the schema check and the CV builder, and the report sets each changed row beside `_data/data.yml`.
- Implied inputs: item 10 states "not stated (...)" as no deadline with the words in `note`; the hub's `scout.md:107,120` rewritten at landing; `research-visit-linkoping-sweden` as `2027-03` with "Day to be confirmed." in `note` (decision 11, `about` being the CV text); `flta-2026` as the span with "On 2026-10-29." in `note`; the time as `2026-10-27T11:00:00`; a year written as an integer and every other period as a quoted string; oculus's own `.oculus/project.yml` rewritten by the orchestrator at landing; C2 refuses the integers 999 and 0; item 4 dates a span running through today by its start; item 5 prints the period alone for a student with no degree and keeps `careerFields` with `when` in place of `date` and `duration`; C14 reads a prose deadline as a finding and undated; C6 covers the manifest editor; item 9 rewrites the demo career profile rows by item 10's rules.
- Declined to judge, the Python readers of hub YAML: item 10's quoting rule writes every day as a string, so no YAML reader turns one into a date object.
