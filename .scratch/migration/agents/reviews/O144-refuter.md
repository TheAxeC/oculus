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

## Repair round 1, refuted

Worktree `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O144`, base `069decb7c`. I changed no file of the worktree. Everything I wrote is in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o144-reviewer-r1/`: copies of `cases.mts`, `rewrite.mts` and `review-cases.mts`, and the run outputs. The base-tree copy I built for P4 has been removed (`rm -rf`, and `ls` of the folder shows no `base-tree`).

All twelve round items are closed and every verdict holds or is met. Five low findings are left: T6, T7, T8 and T9 under Standards and P5 under Proof. None blocks landing, and each is a one-line text fix.

## Verification lines

The round's delta. Each path of the snapshot's `files.txt` was compared with `cmp`, then read with `diff -u <snapshot> <worktree>`. Nine files differ: `docs/HELP.md`, `docs/apps.md`, `docs/data-map.md`, `src/lib/data/model/model-entities.ts`, `src/lib/data/snapshot/normalise.ts`, `src/lib/data/sources/documents/feeds.ts`, `src/lib/state/feeds/leads.ts`, `src/lib/views/shared/forms/entry/edit/FieldControl.svelte` and `tests/data/sources/career.test.ts`. The paths `git status --short` lists now, with `.scratch` left out, are the same set as `files.txt` (`diff` printed `same-set`). So the round touched no path that `files.txt` does not list.

Verify 1. `npm run test:quick`, run once. I did not run `npm run diagrams`, because it writes files. The round's `cmp` shows that no `docs/diagrams/*` file changed in the round.

```
 5:15  up 1 day, 13:18, 1 user, load averages: 3.53 7.07 7.37
test:quick: 75 changed file(s), from git since HEAD
test:quick: 246 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.4 s)
ok      svelte-check (9.3 s): 1793765719534 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (126.1 s): Duration  113.88s (transform 44.55s, setup 0ms, import 120.99s, tests 301.52s, environment 5ms)
FAILED  vitest (188.3 s)
FAILED  vitest slow (274.4 s)
test:quick: 277.1 s; failed: vitest, vitest slow
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The red lines are six timeouts, all in test files the step does not change:
- `tests/data/sources/config/layers/agents.test.ts` and `hub-vocab.test.ts`: `Error: Test timed out in 5000ms.`
- `tests/data/hubs/hub-portfolio.test.ts`, `tests/routes/edit/config-key.test.ts`, `tests/routes/sessions/website.test.ts` and `tests/routes/hubs/hub-writes.test.ts`: `Error: Test timed out in 20000ms.`

I reran each alone once, with the flags the quick tier uses for it:
- `5:20 ... load averages: 9.69 11.82 9.81`: `npx vitest run <the two> --tagsFilter '!slow'` gave `Test Files  2 passed (2)`, `Tests  34 passed | 2 skipped (36)`.
- `load averages: 8.80 11.52 9.74`: `npx vitest run <the four> --tagsFilter slow --testTimeout 20000` gave `Test Files  4 passed (4)`, `Tests  97 passed (97)`.

Under spec.md:80 these failures are not the step's.

Verify 2. `npx vitest run` of `period.test.ts`, `website-files.test.ts`, `normalise.test.ts`, `career.test.ts`, `feeds.test.ts`, `make.test.ts` and `duplication.test.ts`: `Test Files  7 passed (7)`, `Tests  171 passed (171)`. `history.test.ts` run with the checks' own flags (`--testTimeout 0 --hookTimeout 0`, as `npm run test:checks` runs it): `Test Files  1 passed (1)`, `Tests  6 passed (6)`.

Verify 3. `LC_ALL=C xargs perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof'` over the 72 changed files gave `perl exit 0`. The same check over the report gave `report perl exit 0`. The full-tree gate of spec.md:103, over `find src tests config -type f ! -name local.yml`, gave `gate exit 0`.

Verify 4. The YAML parse over the changed `.yml` files: `yaml exit 0`.

Verify 5. `sh utils/unused-exports.sh` against `../O144-base/unused-exports.txt`: `diff exit 0`, no output.

Verify 6. In the round's delta, the added lines over 100 columns are two Markdown table rows that are one line each: `docs/apps.md: 619` and `docs/data-map.md: 207`. Over the whole diff, the added `.ts` and `.svelte` lines over 100 columns are the string literal at `vocab.ts:222`, which is 137 columns on the base, and one-line YAML rows. The two new files have none.

Every command the round's section quotes, rerun in the same form:
- `cd ../O144-base && npx tsx <scratch>/cases.mts C14 C19` (plus B2). It prints C14 `the template's schema: deadline {"field":"deadline","type":"text","section":"Dates","help":"Deadline as posted."}` and `findings: ["line 3: [entries[1].rolling] key entries[1].rolling is not declared by the schema of this file"]`, and C19 `bar group of year: ["2024","2021","2025-09","2026"]`. This is the same as `o144-builder/base-c14-c19.txt`.
- B2 on the base copy: `period-c: year undefined, yearWritten undefined`. Its only finding is `[stage] stage "drafting" is not a word of the stages list`, a fixture artifact.
- B2 on the changed tree: `period-c: year undefined, yearWritten "Sept 2025"`, with findings `[stage] ...` and `[year] year is Sept 2025, which is not a period such as 2025, 2025-09, 2026-10-27 or 2025-09/2026-09`.
- `review-cases.mts R1` on the changed tree: `CV rows with a period text: 17, without: 85`, the four radar days `""`, `funding records with when: 0 of 14`.
- `review-cases.mts R1` on the base: `102, without: 0`, `"2026-10-29"`, `"2026-10-27"`, `"2027-03-01"`, `"2026-09-14"`, `funding records with when: 0 of 14`.
- The whole `cases.mts` on the changed tree. C4 to C17 and C19 are identical to `o144-builder/final-c4-c19.txt`; the only differences are the scratch path and the added B2. C18 prints `changed values: 511`, `findings of the copy before the rewrite: 21, after: 1, new after: 1`, `findings naming when, deadline, rolling or note after: 0`, `CV rows whose period text is the same: 74, different: 28` and `employer CV rows whose period text is the same: 40, different: 18`. C1 and C2 read and refuse every value, and C3 orders all three input orders the same.
- The quoted `cases.mts` (report lines 365 to 1032) against the file: `cases-same`.
- P4 base-tree runs. My copy was `../O144-base`, the seven root files from `git show 069decb7c:<file>` (`svelte.config.js` is absent at the base), `node_modules` linked, and the six changed tests copied in:
  - `period.test.ts`: `Tests  34 failed (34)`, at `:79:16`, `:105:16` and `:125:55`, `TypeError: readPeriod is not a function`.
  - `website-files.test.ts`: `2 failed | 39 passed (41)`, at `:561:42` and `:658:58`.
  - `normalise.test.ts`: `1 failed | 12 passed (13)`, at `:308:23`.
  - `career.test.ts`: `2 failed | 26 passed (28)`, at `:380:72`.
  - `feeds.test.ts`: `2 passed (2)`.
  - `make.test.ts`: `1 failed | 34 passed (35)`, at `:242:36`.
  - Every row of the report's table reproduces.
- `wc -l` of the round's nine files and `git diff 069decb7c --stat` (`70 files changed, 715 insertions(+), 409 deletions(-)`) match the report.

## The round's items

1. P1: **closed**. My base run prints the C14 and C19 lines that the report's first-run section now holds (report lines 103-104 and 155-157). The sentence that the base has no `year` order is gone. The base order by count is given in "Visible changes".
2. P2: **closed**. Judgment call 3 (report line 1915) states the change from "period" to "length". The demo diff shows `help: "Scheme | role | period"` replaced by `"Scheme | role | length"`, and the `sub` texts are "... | 3 years" (`funding.yml:16`) and "... | 2 years" (`:28`).
3. T1: **closed, with two inaccuracies** (T6 and T7). The three bullets are at `docs/HELP.md:277`, `:339` and `:351`, each where the user meets it. Item 11's list marks them 'rewritten' (report line 1904). `history.test.ts` passes over them.
4. T2: **closed as ruled**. `docs/apps.md:402` names `` `yearWritten?` (the manifest's `year` as written, a period) ``. The words "a period" are false after item 8 (T8).
5. T3: **closed**. `FieldControl.svelte:8` is 98 columns and `:9` holds `` `periodRefusal`). ``. The next word would make line 8 116 columns.
6. T4: **closed**. `leads.ts:140` reads `const text = scalar(value);` and `feeds.ts:55` reads `const deadline = str(entry.deadline);`. `feeds.ts`'s `str` is the shared `text`, which returns `''` for a missing value, so dropping `.trim()` changes the type of nothing.
   - No caller relied on the trim. The base never trimmed; it searched for a day anywhere in the text. The step's other readers of a deadline are `rail-badges.ts:69`, through `deadlineOf`, and `splitLeads`/`isExpired`.
   - No hub lead holds a spaced deadline. A `python3` read of the hub's `leads.yml`, read only, printed `74 spaced: []`.
   - The schema's `date` pattern refuses a spaced day, so the reader and the check now agree.
7. T5: **closed**. My `diff -U0` against the base shows `:39` holding `when: "2023/.."`, `:41-42` holding `"2026-09"` and `"2026-09-15"`, and the assertions at `:91-92` and `:183` following. The test passes on both trees, and it still checks that the reader passes a career file's fields through with no schema.
8. B2: **closed**. `writtenPeriod` (`normalise.ts:163-168`) returns any string or number. `Project.year` stays `periodYear`, which is undefined for "Sept 2025", as my B2 run shows. The `year` finding stays. The form posts only dirty fields (`state/forms/schema.ts:557-570`), so a stored bad `year` does not hold back a save of other fields. The function's name now says less than it does (T9).
9. B1: **closed**. Both R1 runs reproduce the quoted figures, and "Visible changes" (report line 1940) and judgment call 14 state that the landing applies the code and the hub rewrite together. One clause of the base half is not printed by R1 (P5).
10. S3: **closed**. Judgment call 15 (report line 1927) names the prefix and the 14 leads.
11. P3: **closed as ruled**. `docs/data-map.md:255` reads `` a moment `YYYY-MM-DDTHH:MM:SS`, with an optional `Z` or `+HH:MM` ``. The reader also takes `-HH:MM` (T7).
12. P4: **closed**. My base-tree runs reproduce every row of the failing-line table. My `diff -U0` of each changed test file and of `allow-duplication.txt` against the base copy gives exactly the 21 changed lines the assertion table lists, each before and after correct. The table gives line numbers on the changed tree.
   - `allow-duplication.txt:16` changes only the line number in the reason text, from 145 to 159. The mark `c0785dd03b7f` is the same, so nothing is loosened.
   - `feeds.test.ts` passes on the base, as the report says.

None of the twelve is closed by removing a check. Every change stays inside the nine files and the round's paths. The `model-entities.ts:428` comment and the `readPeriod` import dropped in `normalise.ts` follow item 8.

## Item verdicts (the whole diff since the base)

1. Reader of a period: **holds**. C1 and C2 come from `cases.mts` and from `period.test.ts` (34 rows pass).
2. Type `period`: **holds**. The type words, the `x-period` check, `typeRefusal`, `coerce`, the `FieldControl` period branch and the list column are all in place.
3. Sort: **holds**. C3 and C4. The move to `card-order.ts` stays as built under the round's "Not sent".
4. Radar and audit: **holds**. C7 and C8.
5. CV builder: **holds**. C9 to C12, and C18.
6. Manifests and literature years: **holds**. B2 is closed (B2 run, C6, C13, C19).
7. Leads: **holds**. C14, and the trims are removed.
8. Templates: **holds**. C15.
9. Demo hub: **holds**. C16. Judgment call 3 is now accurate.
10. Research hub rewrite: **holds**. C18 reproduces, `git status --short` lists no hub path, and the unrewritten-hub effects are stated.
11. Docs and comments: **holds** for the sentences naming the old fields. The new HELP and apps sentences carry the Standards findings T6, T7 and T8.

## Case verdicts

- C1 **met**, C2 **met**, C3 **met**: my `cases.mts` run and `period.test.ts`.
- C4 to C13 **met**: identical to the builder's final run, and C6 and C13 rerun after the round's `normalise.ts` change.
- C14 **met**: `"2026-12-15 | Rolling"`, `"Rolling"`, `no line`, and the text deadline gives `no line` with the `date` finding.
- C15 **met** and C16 **met**, both under judgment call 13's reading.
- C17 **met**.
- C18 **met**: 21/1, 0 findings naming the new fields, 74/28 and 40/18.
- C19 **met**: no filter finding, and `["2026","2025-09","2024","2021"]`.

## Spec

none

## Proof

P5. One clause of the B1 "before" is not printed by the run it cites (low).
- Place: report line 1940, "Before (base): ... the funding records carry `date`".
- R1 on the base prints `funding records with when: 0 of 14` and nothing about `date`.
- The clause is true by reading. The base's `normalise.ts:530` has `date: str(entry.date)`, and the hub's funding `date:` values are quoted strings (`grep` of `funding.yml`, for example `date: "2026"`).
- Failure scenario: none in behaviour. A reader takes the clause as measured when it was not.

## Standards

T6. A HELP bullet says every award prints a day, which is false for the employer CVs (low).
- Place: `docs/HELP.md:351`, "An award prints its period's first day, as the CV's awards read it."
- Write the website also writes the employer CVs' file (`cv.ts:1-10`). A profile award row prints its period as text, because `profileRow` calls `withPeriod(section, out, false)` (`cv.ts:475,484`). C12 prints `date: "2016"`, and judgment call 7 says the same.
- Failure scenario: a user who reads the bullet expects an employer CV's award to show a day and finds "2016".
- Fix: say that the website's CV prints an award as its first day, and an employer CV prints its period text.

T7. Two new doc sentences do not match what they describe (low).
- `docs/HELP.md:277` says the hint gives "a day (YYYY-MM-DD)". The hint is `editor.period_hint`: `'2025, 2025-09, 2026-10-27 or 2025-09/2026-09'`. The placeholder is forced by `history.test.ts`, but the sentence reads as if the hint showed `YYYY-MM-DD`. "a day such as the 27th of October 2026" or "a day written year-month-day" would be true.
- `docs/data-map.md:255` names the zone as "an optional `Z` or `+HH:MM`". The reader also takes a negative zone: `TIME` (`dates.ts:42`) is `` `T${HOUR}:${SIXTY}:${SIXTY}(?:Z|[+-]${HOUR}:${SIXTY})?` ``.
- The data-map wording is the round's dictated text, so the change is the orchestrator's: `+HH:MM` or `-HH:MM`.
- Failure scenario: a hub author writing `-05:00` believes it is refused.
- Two smaller points are true but incomplete. `docs/HELP.md:339` does not say that an expired lead's line ends with ` | expired` or its status (`LeadCard.svelte:153-154,322-323`). The base already drew that tail.

T8. The apps guide row says `yearWritten` is a period, and item 8 made it any text (low).
- Place: `docs/apps.md:402`: `` `yearWritten?` (the manifest's `year` as written, a period) ``.
- `normalise.ts:166` now returns any string or number. `model-entities.ts:428` says "a period or any text". So a portfolio app can receive `yearWritten: "Sept 2025"`.
- The words come from round item 4, which item 8 of the same round contradicts. The builder followed both literally and did not raise the conflict.
- Failure scenario: an app that parses `yearWritten` as a period, trusting the guide, meets text it cannot read.
- Fix: "the manifest's `year` as written, a period or any other text".

T9. The function's name says less than the function does (low).
- Place: `normalise.ts:166`, `function writtenPeriod(value: unknown): string | number | undefined { return typeof value === 'string' || typeof value === 'number' ? value : undefined; }`.
- The doc comment says it keeps any text, so it is not hidden. But "Period" in the name tells a reader of the call site (`normalise.ts:284`, `yearWritten: writtenPeriod(manifest.year)`) that the value is checked.
- Fix: a name such as `writtenYear` or `asWritten`. The function has one caller.

T10. The builder ran the verify list twice in the round (low; spec.md:26).
- Place: report line 1954, "`npm run test:quick` ran twice in this round: the first run was stopped before its end when a `docs/HELP.md` line followed it".
- The first run started before the last change, so it was not the one run after the last change that spec.md:26 allows. The report states this openly.

## Behaviour

none. I read the round's code changes against their callers:
- `writtenPeriod`: the form posts only dirty fields, and `yearWritten`'s only reader is `schema.ts:465`.
- The trim removal: no caller relied on it, and the hub has no spaced deadline.
- The `FieldControl` comment, the `career.test.ts` fixture and the docs.

None of them changes behaviour beyond what its item asks.

## Declined to judge

- `npm run diagrams`: not run, because it writes `docs/diagrams/*` in the worktree, which my task forbids. The round changed no diagram file (`cmp` against the snapshot), and the `vitest checks` line of my quick run passed.
- The look on landing: the period control's marking and hint, a lead card's "Rolling" line and the view orders need a page, and I opened none.
- Whether the website's templates print the number `2026` and the text `'2026'` identically: not read in the website's code. This is carried from the first review.
- Whether the oculus manifest's `cv.when` row prints "2026 - Current" after the orchestrator rewrites `.oculus/project.yml`: C18 shows `Oculus | (no row)`, since that manifest is rewritten at landing.
- How the orchestrator applies the hub rewrite at landing: that is the orchestrator's call.

Reviewer usage: a1f249a028eeefda3, claude-opus-5-5, 218028 tokens, 76 tool uses, 16 min 3 s

## Closed

First review:
- P1 to P4, T1 to T5, B1, B2 and S3: sent in repair round 1 (`agents/briefs/O144-round-1.md`); the review over round 1 holds each of them closed.
- S1 (the card sort moved to `src/lib/state/boards/collection/card-order.ts`): kept as built.
- S2 (the funding period in the portfolio payload): closed in automode, the payload names it `when` (`plan.md` Rulings, "O144 funding period in the payload"; `choices.md`).

Review over round 1, at landing on main:
- T6: `docs/HELP.md:351` reads "An award prints its period's first day on the website's CV, as its awards read it, and its period text on an employer CV."
- T7: `docs/HELP.md:277` reads "a day written year-month-day"; `docs/data-map.md:255` reads "with an optional `Z`, `+HH:MM` or `-HH:MM`,".
- T8: `docs/apps.md:402` reads "(the manifest's `year` as written, a period or any other text)".
- T9: `normalise.ts` names the function `writtenYear`, at its definition and its one call.
- P5: report text only; the clause is true by reading (`normalise.ts:530` on the base), and the landing report says it was read, not printed.
- T10: report text only; the round's last verify run came after its last change, and the gate's run at landing is the run that counts.

Found at landing, outside both reviews:
- The look found a refused text box drawn like any other: `TextInput.svelte` sets `aria-invalid` and a title, and no stylesheet drew a mark, so the period control's wrong value showed nothing. `src/lib/ui/theme/field.css` borders a field with `aria-invalid='true'` in `--c-red`, the rice theme's line included; the look shows `2026-13` in a red border (computed `border-top-color` `rgb(220, 38, 38)`).
- Item 10 names the hub's `literature.yml` and `radar.yml` in "What is on the tree", and the hub rewrite left their `year` lines `type: text`. Both are `type: period` with the demo hub's help text; the radar's 678 years are integers from 2022 to 2026, and the live check finds no new finding.
