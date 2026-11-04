# O144 review: a `period` type for when an entry happens

Worktree `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O144`, base `069decb7c`. I changed no file of the worktree. Everything I wrote is in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o144-reviewer/`: copies of the builder's `cases.mts` and `rewrite.mts`, one added case (`review-cases.mts`, case R1), and the run outputs.

## Verification lines

Verify 1. `npm run test:quick`, run once (I did not run `npm run diagrams`; see "Declined to judge"):

```
 4:38  up 1 day, 12:41, 1 user, load averages: 5.04 4.56 5.85
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.4 s)
ok      svelte-check (8.9 s): 1793763499697 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (120.3 s): Duration  108.97s (transform 46.06s, setup 0ms, import 120.92s, tests 283.87s, environment 4ms)
ok      vitest (154.9 s): Duration  144.17s (transform 65.58s, setup 0ms, import 197.48s, tests 363.80s, environment 8.39s)
ok      vitest slow (238.0 s): Duration  227.34s (transform 19.71s, setup 0ms, import 114.56s, tests 784.37s, environment 14ms)
test:quick: 240.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
[exited with code 0]
```

Verify 2. `npx vitest run` of `tests/data/helpers/period.test.ts`, `tests/data/hubs/website-files.test.ts`, `tests/data/snapshot/normalise.test.ts`, `tests/data/sources/career.test.ts`, `tests/data/sources/feeds.test.ts`, `tests/routes/hubs/make.test.ts`, `tests/checks/tree/duplication.test.ts` and `tests/checks/source/history.test.ts`:

```
 Test Files  1 failed | 7 passed (8)
      Tests  1 failed | 176 passed (177)
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
```

- I reran `tests/checks/source/history.test.ts` alone twice and got the same 5000 ms timeout (`uptime`: `load averages: 7.56 8.98 7.75`). A standalone run of `tests/checks/diagrams/diagrams.test.ts` also timed out on two tests (`Error: Test timed out in 5000ms.`).
- The step does not change either test file. Under spec.md:80 they are not the step's failures.
- Both files are in the quick tier's selection. My `tail -25` cut the selection lines from my run, but the builder's run of the same diff lists them (`o144-builder/test-quick.txt:39` `tests/checks/diagrams/diagrams.test.ts: imports at depth 2`, `:249` `tests/checks/source/history.test.ts`). In my run, "vitest checks" passed.

Verify 3. `LC_ALL=C xargs perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' < files.txt`, over the 72 changed and new files (`.scratch` left out), printed nothing: `perl exit 0`. The full-tree gate of spec.md:103 printed nothing either (`gate exit 0`; `find: bin: No such file or directory`).

Verify 4. `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]"` over the changed YAML files: `yaml exit 0`.

Verify 5. `sh utils/unused-exports.sh` against `../O144-base/unused-exports.txt`: `diff exit 0`, no output.

Verify 6. `git diff 069decb7c -U0 -- '*.ts' '*.svelte' | grep '^+' | awk 'length($0)>101'` prints one line: `139: +        "An entry waiting on someone else, which the audit asks a period to track by; the audit compares the entry's status in lower case."` This is `vocab.ts:222`, a string literal that is 137 columns on the base. The two new files have no line over 100.

The case-run program:
- The quoted source matches the files. `diff` of report lines 364-1019 against `cases.mts` printed `cases-same`, and lines 1025-1488 against `rewrite.mts` printed `rewrite-same`.
- C4 to C19 on the changed tree: `diff` against the report's quoted run (lines 213-332) differs only in the demo-sort lines, which the report summarises in one sentence, and the trailing `scratch hubs removed: true`.
- C18 with `O144_CHANGES=1 O144_CV=1 O144_SCHEMA=1 O144_RADAR=1` on the changed tree is byte-identical to the builder's `final-c18.txt` once the scratch paths are normalised. Its lines: `rewrite warnings: none`, `changed values: 511`, `findings of the copy before the rewrite: 21, after: 1, new after: 1`, `findings naming when, deadline, rolling or note after: 0`, `CV rows whose period text is the same: 74, different: 28`, `employer CV rows whose period text is the same: 40, different: 18`.
- On the base copy (`cd ../O144-base && npx tsx cases.mts`), C1 to C13, C15 to C17 and C18 match the report's first run. C14 and C19 do not (finding P1).

## Item verdicts

1. Reader of a period: **holds**.
   - `dates.ts` `readPeriod`, `PERIOD_FORM`, `periodValueOrder` and `periodYear`; no dependency added.
   - My C1 and C2 runs: every C1 value is read and every C2 value is null.
   - `period.test.ts`: `Tests 34 passed`, one row per C1 and C2 value.
2. Type `period`: **holds**.
   - The type is added in `record.ts`, `catalog-files/manifest.ts`, `schema/manifest.ts`, `career-view.ts`, `writes/manifest.ts`, `card-order.ts` and `index.ts` `COLUMN_TYPES`, `FILTERED_TYPES`, the `record-values.ts` comment, `templates.md:1116,1123` and the `data-map.md` table.
   - The `x-period` keyword in `check.ts` gives `not_a_period` (C5). `typeRefusal` and `coerce` refuse a bad period (C6). `FieldControl.svelte:227-234` is a `TextInput` with `invalid` and the hint.
   - The data-map row departs from the dictated text, and the departure is disclosed (P3).
3. Sort: **holds**. `card-order.ts` `fieldCompare` gives a `period` field to `periodValueOrder`, the `sources.yml` sorts are as dictated, and the docs are rewritten (C3, C4). The move of the card sort is S1.
4. Radar and audit: **holds**. `focus-lanes.ts` `startDay`/`entryDate`, `projects.ts:509,555`, `audit.yml:41` and `vocab.yml:105` (C7, C8).
5. CV builder: **holds**. `cv.ts` `periodText`, `awardDate`, `withPeriod`, `studentText` and `FROM_RECORD` name `when` (C9 to C12). `careerFields` takes no period on the base either (`git show 069decb7c:...cv.ts`, lines 258-280), so nothing changes there.
6. Manifests and literature years: **violated**, narrowly (finding B2). `cv.when`, `year: period`, `Project.year` as the start year, and the literature and radar readers all hold (C6, C13, C19). The form shows the stored `year` only when that value is a period.
7. Leads: **holds**. The template has `deadline: date`, `rolling` and `note`; `deadlineOf` and `feeds.ts` read a day only; `deadlineLine` and `leads.rolling` exist; the Scout text is rewritten (C14).
8. Templates: **holds**. The `docs/templates.md` diff carries every line item 8 names. The changed career prose paragraph is the step's own rewording (judgment call 10), needed so it does not say "day".
9. Demo hub: **holds**. C16 gives `demo hub findings: 0`, `old fields held: none`, and sorts naming `when`. Judgment call 3 misdescribes one demo line (P2).
10. Research hub rewrite: **holds**.
    - The step writes no hub file: `git status --short` lists only oculus paths.
    - The "Hub rewrite" section reproduces from my C18 run. Spot checks (FAIR, flta-2026, research-visit-linkoping-sweden, postdoc-uhasselt, order[2], the Closed lead) match the change rows.
    - The transition effects are incompletely stated (B1).
11. Docs and comments: **holds** for the sentences naming the old fields. Missing HELP.md bullets and a stale apps.md row are separate standards findings (T1, T2).

## Case verdicts

- C1: **met**. Twelve `reads $row` rows, my run prints a read for each value.
- C2: **met**. Twenty-one `refuses $row` rows, my run prints `null` for each.
- C3: **met**. The 'orders newest first' test passes. My `cardOrder` run on the changed tree prints `"2026-10-27/2026-10-30" "2026" "2025-09/2026-09" "2025-09/2025-12" "2025/.." 2025 "2025 - 2026" null` for all three input orders.
- C4: **met**. `[status, when], when period: ev-2026-12, ev-2026-11-10, ev-2026, ev-2025-2026, ev-2025, ev-2024`. The base sorts by text.
- C5: **met**. Three `not_a_period` findings, each naming its entry; none for `when: 2025`.
- C6: **met**. `when "Sept. 2025"` refused with `type_period`; `"2025-09/2026-09"` written quoted; manifest `year "Sept 2025"` and `cv.when "2025 - 2026"` refused.
- C7: **met**. `2026-11-10`, `2026-10-27`, `""`, `""`, `2026-11-20`; the old `date` now gives `""`.
- C8: **met**. `without: status "submitted" but no period tracked`, and the `when` entry gives none.
- C9: **met**. All eight texts, in both the academic and the experience section.
- C10: **met**. `"2025-06-01 15:59:00-0400"` and `"2018-01-01 15:59:00-0400"`.
- C11: **met**. `"... (2025 - 2026)"`, `"Internship Student (2021)"`, `"2025 - 2026"`.
- C12: **met**. Record period `"Sep. 2018 - 2024"`, own `"2018 - 2024"`, award `"2016"`.
- C13: **met**. `cv {"when":"2022/.."}` gives `"2022 - Current"`; years 2026 and 2025.
- C14: **met**. `"2026-12-15 | Rolling"`, `"Rolling"`, `no line`, text deadline `no line` with the `date` finding.
- C15: **met**, under judgment call 13's reading: the leads' `date` (the day found) and the letter's `date` stay, and items 7 and 8 do not name them.
- C16: **met**, same reading.
- C17: **met**. `"2026-11"` refused; the order is oldest first.
- C18: **met**. Figures as quoted above. The oculus manifest's row was not run, and the report says so.
- C19: **met**. No filter finding; `year` is `period` with `filter: true`; bar group `["2026","2025-09","2024","2021"]`.

## Spec

S1. The card sort moved although the brief's condition was not met (low). This bears on item 3, which still holds.
- The brief says "The card sort moves into its own file if the change would bring `collection/index.ts` over 880 lines". The base is 872 lines (`wc -l` on the base copy).
- By my count of the diff, the change adds about 4 lines (the period branch of `fieldCompare` and two doc-comment lines, less one header line), which would end near 876, under 880.
- The move to `card-order.ts` (102 lines; `index.ts` is now 782) also brought `Collection.svelte` outside the paths list. Every `cardOrder` caller follows: `Collection.svelte:100`, and `schema/run.ts:363` names it as a folder function.
- Harmless and reversible. The orchestrator may accept it.

S2. Judgment call 12, the funding `date` renamed `when` in the `portfolio` payload, is outside item 8.
- Place: `normalise.ts:519` (`when: scalar(entry.when) || undefined,`), `model-entities.ts:780-781` (`when?: string;`), `docs/apps.md:406` (`... \`status?\`, \`when?\`, \`deadline?\` ...`).
- Item 8 rewrites the template text. This hunk changes a key of the payload apps read, which spec.md:18 counts among user-visible shapes ("a wire format"). The brief did not name it.
- It is not silent: judgment call 12 and the last bullet of "Visible changes" state it, before and after.
- Failure scenario: a machine app that reads `entities.funding[*].date` reads `undefined` from landing on, with no message.
- No such app exists in the research hub today: `ls .oculus` there shows no `apps` folder. That limits the harm, but the shape is still the user's call.
- Options: (a) rename to `when?` (built); (b) drop `date?` with no replacement; (c) keep a `date?` filled from `when`, which would be the old name carrying new data. (b) is the lazy option, since it leaves apps no period of a scheme. My judgment: (a).
- To book as an open item.

S3. The builder chose a wording for hub data and did not list it among the judgment calls (low).
- Place: report "Hub rewrite", leads table, and `rewrite.mts:1344`: `const note = \`Deadline as posted: ${lead_ !== null ? words : text}.\`;`.
- Item 10 says every word that is not the day goes to `note`. The prefix "Deadline as posted: " is the builder's own, written into 14 lead notes Axel will read.
- It is visible in the table, so not hidden. It is a wording choice in his data that the orchestrator applies at landing.

Paths outside the brief's list, each judged:
- `bar.ts`: needed. `fieldOrder` keeps a `period` filter's values newest first, which HELP.md:279 promises for whole-number years. Without it, the Literature year filter would order by count.
- `Collection.svelte`: follows S1.
- `config/text/views/boards/editor.yml`: needed by the catalog rule for the control's hint and its refusal.
- `record-values.ts` lines 8-11: realignment only.
- `config/schemas/manifest-schema.yml:12` and `config/options/schemas/manifest-schema.yml`: needed, since `MANIFEST_WIDGETS` accepts `period` and the option list must offer it.
- `vocab.ts:222` and `config/options/catalogs/vocab.yml:108`: the same sentence as `vocab.yml:105`.
- `make.test.ts`: needed.
- `allow-duplication.txt`: only the line number in the reason text changed (145 to 159). The mark `c0785dd03b7f` is the same, and `duplication.test.ts:104-118` keys on the mark, so nothing is loosened.
- `normalise.ts`, `model-entities.ts` and `apps.md` funding: S2.

The rest of the spec heading:
- Premises I re-read on the base copy all reproduce: `dates.ts` 57 lines, `index.ts` 872, `cv.ts` 433, `FIELD_TYPES`, the `sort: [status` lines 45-48, `entryDate`, `deadlineOf`, 4 items in the collection folder.
- No dependency was added.
- `cases.mts` and `rewrite.mts` stay inside the approved case-run program. They import the tree's code and build their inputs in memory. They read the hub and the website read only. They write only under the scratch `work` folder and remove it (`scratch hubs removed: true`). `rewrite.mts` is the in-memory rewrite that C18 asks for, not a script applied to the hub.

## Proof

P1. The report's first run of C14 and C19 does not reproduce with the quoted program (low; no decision rests on it).
- Report lines 103 and 154 give `error: Cannot convert undefined or null to object` (C14) and `error: text key not in the text catalog (config/text/): collection.status_facet` (C19). Line 157 concludes "the base has no bar order of `year` to set beside the changed tree's".
- The quoted `cases.mts` run on the base copy prints for C14 `the template's schema: deadline {"field":"deadline","type":"text","section":"Dates","help":"Deadline as posted."}` and `findings: ["line 3: [entries[1].rolling] key entries[1].rolling is not declared by the schema of this file"]`. For C19 it prints `bar group of year: ["2024","2021","2025-09","2026"]`.
- The quoted errors come from an earlier version of the program (`o144-builder/base-run.txt:94` holds the C14 error).
- A reader of the report believes the base gives no year order. It gives one by count, which is the before the C19 change should be read against.

P2. Judgment call 3 says the demo `sub` help is unchanged, and the diff changes it (low).
- Judgment call 3 reads: "The demo funding `sub` help is 'Scheme | role | length' as before".
- The diff of `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml` shows `-  - { field: sub, ... help: "Scheme | role | period" }` and `+  ... help: "Scheme | role | length" }`.
- The new wording is accurate for the demo's `sub` texts ("3 years", "2 years", `grep -n "sub:"`), but the report states a change as no change.

P3. A dictated text was reworded so a check passes. It is disclosed, and no check was loosened.
- Place: `docs/data-map.md:255`: `| \`period\` | a date or a span, EDTF: a year \`2025\`, a month \`2025-09\`, a day \`YYYY-MM-DD\`, a moment \`YYYY-MM-DDTHH:MM:SS\`, a span \`2025-09/2026-09\`, an open span \`2025/..\` |`. Also `templates.md:1489` (`when: "2026-10"`) and `:1897` (`when: "2023-06"`).
- Brief item 2 dictated `2026-10-27` and `2026-10-27T11:00:00` in that row. `tests/checks/source/history.test.ts:65` (`const DATE = '[0-9]{4}-[0-9]{2}-[0-9]{2}';`) is applied to every Markdown file under `docs/` by `documentHits` (lines 53-85 of that file), so the dictated row cannot pass.
- The builder kept the check as it is, reworded the row to placeholders, and reported it under "wrong or impossible". This is the right resolution and code is not involved.
- The orchestrator should accept the reworded row. Consequence: the brief's dictated row is not what the page shows, and the zone form (`Z`, `+HH:MM`) is in neither version.

P4. The report omits two things spec.md requires about tests (medium).
- spec.md:69 asks for each added or changed test's failing line on the unchanged tree. The report gives none for the changed tests (`website-files.test.ts`, `normalise.test.ts`, `career.test.ts`, `feeds.test.ts`, `make.test.ts`), or for `period.test.ts` itself. For the C1 and C2 rows only the case program's `readPeriod is not on this tree` stands in.
- spec.md:62 asks for one row per changed assertion line, before and after, from a `diff` against the base copy. The report has no such table.
- Example: `feeds.test.ts:51` changed its fixture from `deadline: "20-09-2026 (2026-09-20)"` to `"2026-09-20"`, and the test passes on both trees. The behaviour that prose is no longer searched is not asserted there. That is acceptable under the test rule, but a reader of the report cannot see it.
- I judged the changed tests by reading. None asserts a known defect, and none would pass with its behaviour taken out.

G151 row by row:
- 'reads $row': all twelve C1 values, in C1's order, each checked for precision, first and last day of start and end (`expect.objectContaining`), `null` end for `2025/..`.
- 'refuses $row': all twenty-one C2 values, in C2's order.
- 'orders newest first': C3's list in three input orders through `periodValueOrder`.
- The order test does not go through `cardOrder`. G151's Code line names `dates.ts` only, so that is within the entry. The card path is shown by C3 and C4 of my case-run.

## Standards

T1. HELP.md has no bullet for what a user now meets (spec.md:72) (medium).
- Place: `docs/HELP.md`. The only hunk is line 279.
- Missing: a `period` field in the editor is one line, marked wrong while the text is no period, with examples as the hint (`FieldControl.svelte:227-234`). A lead card's deadline line prints "Rolling" (`leads.ts:150`). Write the website prints every period in one form, months abbreviated and an open end "Current" (`cv.ts:92-131`).
- spec.md:72 says a step writes what a user does into HELP.md. The paths list naming line 279 alone is a choice, not a limit.
- Failure scenario: a user who reads the Help page for the Career view or Position Leads finds nothing about why a `when` is refused, or what "Rolling" means.

T2. The apps guide does not list the new `yearWritten` field (low).
- Place: `docs/apps.md:402`, the `projects` row, which lists `year?` and no `yearWritten?`.
- `model-entities.ts:428-429` adds `yearWritten?: string | number` to `Project`, which the `portfolio` payload carries (`entities`, apps.md:399). The report states it as judgment call 9 but not as a payload change.
- Failure scenario: an app builder reads the guide and misses that a project's `year` as written is now available.

T3. A comment line ends short inside a sentence (spec.md:45) (low).
- Place: `FieldControl.svelte:8-9`: `// the hint, marked wrong while the period reader refuses what is typed` (75 columns) followed by `// (state/forms/schema.ts \`periodRefusal\`).`. The next word, 22 columns, fits on line 8.
- The other added comment lines that my check flagged reach 99-100 columns, which is within a rewrap at 100.

T4. Small whitespace tolerance in the day readers (low).
- Place: `leads.ts:141` (`const text = scalar(value).trim();`) and `feeds.ts:55` (`const deadline = str(entry.deadline).trim();`).
- A `deadline: " 2026-11-05 "` reads as a day, while the schema's `date` pattern refuses it. It is not an older stored form, so spec.md:43 does not apply strictly. It is a small tolerance next to "a day only".

T5. A career test fixture still writes the retired form (low).
- Place: `tests/data/sources/career.test.ts:39` (`- { title: "Postdoc", location: "U Twente", duration: "2023 - now" }`), asserted at `:183`, and `:41-42` (`order` rows with `when: "~1 Sep"` and `when: "15 Sep"`).
- The test checks that the reader passes fields through with no schema, so it asserts no defect. It still shows a career file in the form the step retires.
- Failure scenario: someone who copies the fixture as the career file's shape writes `duration`.

Also checked:
- Sizes: `index.ts` 782, `cv.ts` 537, `dates.ts` 198, `card-order.ts` 102; every component under 520.
- Folder `src/lib/state/boards/collection` holds 5 items.
- No comment history: grep of added lines for before / still / no longer / previously finds only order wording ("not before the first", "comes before `b`").
- No `globalThis` in the tree diff.
- No old-form reader of `date`, `duration`, a prose deadline or a day inside text: `grep -rn "fields\.date\|fields\.duration\|\.duration\b" src` hits only `literature/hits.ts:111`, which is the literature reader's own `date`.

## Behaviour

B1. Until the hub rewrite is applied, the step's code does more to the research hub than the 21 findings the report states (medium).
- The report states (judgment call 14, C18) that the code gives the hub 21 findings until the orchestrator applies the rewrite. My C18 run reproduces 21.
- My added case R1 runs the changed code on an unrewritten copy of the hub (`review-cases.mts R1`). It prints:
  - `CV rows with a period text: 17, without: 85` (the base prints all 102);
  - `radar day of flta-2026: "" (date "2026-10-29")`, and `""` likewise for `mentoring-trajectory-info-session`, `research-visit-linkoping-sweden` and `graz-bci-conference-2026`;
  - `funding records with when: 0 of 14`.
- The four collection views also lose their date order, since `sort:` names `when` and the schemas hold none (the four "sorts by when" findings).
- Failure scenario: if Write the website is pressed between the cherry-pick and the hub rewrite, or the rewrite is delayed, `_data/data.yml` is written with 85 rows that have no period, and the Focus radar drops the four dated events.
- The report gives no before and after for these effects. The landing must apply the code and the rewrite in one go, and the landing report should say so.

B2. The project form hides a stored `year` that is no period (low). This is the finding behind item 6's verdict.
- Place: `normalise.ts:162-165`: `return held !== undefined && readPeriod(held) !== null ? held : undefined;`, read by `state/forms/schema.ts:465` (`year: project.yearWritten`).
- Item 6 asks that the form show "the stored `year` value as written".
- Failure scenario: a manifest holding `year: "Sept 2025"` gets a schema finding, but its form's Year box is empty, so the user cannot see what is stored. A save of other fields leaves the bad value in the file.

The CV texts of the C18 run:
- The report's table of 28 changed academic CV rows and 18 changed employer rows is what my run prints.
- The 21 news rows change in type only, `2026` to `'2026'`, and the run counts them as the same.
- The Audit's Website section compares by parsed value, so those rows will also differ there until the next write. The report says the website prints both the same.

## Declined to judge

- `npm run diagrams`: not run, because it writes `docs/diagrams/*` in the worktree, which my task forbids. The committed diagrams are checked by `tests/checks/diagrams/diagrams.test.ts`, which was in the quick tier's selection by the builder's list. My standalone run of it timed out under load.
- The two standalone timeouts (`history.test.ts` comments, `diagrams.test.ts`): not rerun with a longer timeout, since spec.md:80 forbids changing a timeout. Both files are unchanged by the step.
- The look on landing: the period control's marking and hint, the lead card's "Rolling" and the view orders need a page, which I did not open.
- Whether the website's templates print the number `2026` and the text `'2026'` identically: not checked in the website's code (`about.html`, the `.tex` templates).
- How the project form fills `cv.when`: `grep` in `state/forms` and `server/edit` for `cv.` found no filler, and I did not trace it further.
- How the orchestrator will apply the hub rewrite at landing: the report gives tables, and no script is named. That is the orchestrator's call.
- S2 (the funding payload key), S3 (the note prefix) and P3 (accepting the reworded data-map row) are the user's or the orchestrator's to rule.

Reviewer usage: ac632786ca06c2f07, claude-opus-5-5, 362152 tokens, 96 tool uses, 19 min 5 s
