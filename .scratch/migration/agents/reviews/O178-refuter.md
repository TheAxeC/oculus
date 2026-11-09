Review of O178 (the CV's sections and period words set in the hub's settings). No file was changed; two case-run programs and one key probe ran from `.agents/scratch/` in the oculus worktree, and that folder is removed (`ls -a .agents` prints `.`, `..`, `plan.yaml`).

Verification lines, verbatim (oculus worktree, node v24.21.0):

- V1 `npm run diagrams && npm run test:quick -- --base a2928dd16` (TMPDIR unset): `test:quick: 298.6 s; failed: vitest slow`. Slow pass: `Test Files  1 failed | 69 passed (70)` / `Tests  11 failed | 654 passed | 316 skipped (981)`. All 11 are `tests/server/edit/config-key.test.ts`, `AssertionError: expected true to be false` at `tests/server/edit/config-key.test.ts:458`. `git status --short docs` afterwards: ` M docs/templates.md`, so the diagrams changed nothing. It does NOT print `every command passed`, as the report says.
- V2 `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts tests/checks/config/templates.test.ts --reporter=dot`: `Test Files  4 passed (4)` / `Tests  125 passed (125)`, the same as the report's line.
- V3 the `grep -n -E '\b(SECTIONS|TITLED|AWARDS|FROM_RECORD|MONTHS|OPEN_END|AWARD_TIME)\b'` over `cv.ts`: prints nothing, exit 1.
- V4 `wc -l src/lib/server/content/audit/website/cv.ts`: `561`.
- V5 the brief's python line: `10 ['references', 'experience', 'academic', 'students', 'news', 'education', 'grants', 'projects', 'awards', 'extracurricular'] 12 Current 15:59:00-0400`.
- V6 first run on the unchanged tree: not rerun (see Declined). The report quotes one failing line per new row.
- V7 `sh utils/unused-exports.sh` against `O178-base/unused-exports.txt`: 335 lines each, `diff` exit 0.
- Report's ASCII gate (perl form over the changed paths): prints nothing.
- Report's assertion check `diff <base file> <file> | grep -E '^<' | grep -E 'expect|toEqual|toBe|predicate'`, three test files: prints nothing, exit 1 for each.
- Real-hub case, the builder's program rerun: `CV _data/data.yml: same=true (9731 vs 9731)`, `employer _data/industry.yml: same=true (33821 vs 33821)`, `problems 28 28; only tree []; only base []`.
- Primary-only probe: `primaryOnly` is true for `website.cv_sections`, `website.cv_words.months`, `.open_end`, `.award_time`.

The three red files. None of the reds is caused by the diff.
- `tests/server/edit/config-key.test.ts`: reproduces in the list, 11 rows. Line 458 is `expect(existsSync(join(made.hub, '..', 'x'))).toBe(false)`. `ls -l /tmp/x` prints a 612-byte file dated Nov 9 13:09, older than the worktree's `plan.yaml` (17:15). With TMPDIR set to a folder without `x` the file passes. Judgment: a stray `/tmp/x` makes the rows red (I did not read `target()`, which makes the hub folder). The file imports `hub-names.ts`, whose only change is four `HUB_LIST` rows and a comment; the failing line is a filesystem check on a path nothing in the diff touches.
- `tests/routes/git/zenodo.test.ts`: does NOT reproduce. No red in my list (the output names neither it nor hub-portfolio), and it passes alone.
- `tests/data/hubs/hub-portfolio.test.ts`: does NOT reproduce in the list. Alone it gives 4 timeouts at 5000 ms (`Tests 4 failed | 99 passed (103)` over the three files together). With `--testTimeout=60000` it gives `Tests 16 passed (16)`. It imports `hub-names.ts`, and `websiteSettings` is reached through the portfolio build; the diff adds one row list and three words to read. Judgment: machine load on slow-tagged rows run with the default limit.

## Verdicts, What to build
1. Settings: holds. `config/options/behavior.yml:141-177`, `config/defaults/behavior.yml` `cv_sections: []` and `cv_words`, help lines including the student exception, under `heading: sources`, `section: Website`.
2. Reader: holds. `files.ts` `cvSectionShape` and `cvSections()`; shape, repeat and field problems are checked by rows and passed in V2. `website.kinds` is untouched.
3. `cv.ts`: holds. The names are gone (V3); `cvFile` loops `input.cvSections` (`cv.ts:469`); `withPeriod` reads the row (`cv.ts:229`); `FROM_RECORD_ELSE` kept (`cv.ts:71`); unknown section (`cv.ts:301-311`); no-word once per key (`cv.ts:169-177`). `Row` does not hold its place (`cv.ts:103`); `add` takes `where`, so the problem carries the forms the brief lists. The head comment is rewritten. Remaining section names in `cv.ts` are `CAREER_LISTS` (54-57), `students` (347) and `projects` (415), as the brief allows.
4. Hub key lists and the press: holds. `hub-names.ts` rows and comment, primary-only probe; refusal at `runs/website.ts:143`, model, store and catalog words. See finding B1.
5. Sentences and documents: holds, with finding ST1 on one sentence of `docs/templates.md`. `docs/data-map.md` untouched; the report's Doc text has the three lines and the count 31 matches the 31 names of its line 158 replacement.
6. Hub: holds. `git diff 29e47d50f` is the comment clause and the fifteen lines, directly under `kinds:`, byte for byte those of the brief; ` M .oculus/config.yml` is the only hub change.

## Verdicts, Cases (test rows run in V2)
- Ten rows over the test hub: met (`TEN_ROWS_CV`; only `experience` and `awards` hold rows there, the other eight sections' fields are proved by the real-hub run).
- Row `service` between `academic` and `students`: met.
- `servce`: met.
- Missing section from each source (career, manifest, student): met, three rows.
- Non-awards row with `period: timestamp`: met.
- `awards` without `period` and with `period: ''`: met.
- Employer `awards` under timestamp: met.
- `record_fields: [url, when]`: met.
- `record_fields: []`: met.
- Employer `teaching`: met.
- Other months and `open_end`: met.
- `months: []`: met.
- `open_end: ''`: met.
- `award_time: ''`: met.
- `cv_sections: []`: met.
- `key: personal`, `''`, `__proto__`: met.
- Second `news` row: met.
- No `fields` and `fields: []`: met.
- Press with `cv_sections` unset: met (`tests/routes/sessions/website.test.ts`).
- Audit over a missing section: met (`tests/routes/docs/audit.test.ts`).
- Real hub: met, my rerun above.

## 1. Spec
- S1, `tests/fixtures/hubs/website-hub.ts`, 273 lines, outside the write list. The split was needed. `tests/data/hubs/website-files.test.ts` was 704 lines at the base and stands at 872 with its fixtures moved out, so it would be past 880 with them; `spec.md:48` orders a split in the step, the test stays at the path G139 names, and `tests/fixtures/hubs` holds 9 items. The report names it with the reason (spec.md:35). I did not re-measure its 1107-line figure. Not a defect.
- S2, `.scratch/migration/agents/guarded.md:228` (G140). The entry lists the refusals of a press ("while the user is not known, while `website.folder` is empty ...") and does not name `website-no-cv-sections`, though the new row `writes nothing and asks no approval while website.cv_sections holds no section` at `tests/routes/sessions/website.test.ts` is filed under it. G139 was extended; G140 was not. Failure scenario: a later step drops the refusal, deletes the row as "not in G140", and a hub with no rows writes a CV holding only its person block. The ledger is the orchestrator's, so this is a line for landing and no builder repair.

No item marked DONE lacks its diff. No dependency added, no script beyond the permitted case-run, no reserved decision taken.

## 2. Proof
None. The three rows that pass on the unchanged tree are named as pins of kept behaviour in the report. No fallback to the ten sections or to built-in words exists: an unset setting gives findings and the refusal. Read, the new rows would each fail with their behaviour taken out, except the second half of the `personal` / `__proto__` row (`Object.keys(...personal)`), which is a trailing check beside the row's real assertions.

## 3. Standards
- ST1, `docs/templates.md:325-328`: "a row's period goes in `date` as a timestamp under `period: timestamp` and in `duration` otherwise, and in `duration` always for a supervision entry's student and in an employer CV as the period text". Read plainly, this says an employer CV's period is always in `duration`. The code and the case say otherwise: under `period: timestamp` an employer CV writes the period text in `date` (row "an employer CV's awards row under period: timestamp writes the period text in date"). Failure scenario: an author reading the doc expects `duration` in the employer CV's awards and looks at the wrong field. Fix: say "and as the period text, in that same field, in an employer CV".
- ST2, `config/options/behavior.yml` help of `website.cv_sections` and `docs/templates.md`: "A key that is empty, is not lower case or is `personal`". The pattern `^[a-z][a-z0-9_-]*$` also refuses a lower-case key starting with a digit (`1news`) or holding a dot. Failure scenario: `key: 2024-news` is left out with a shape finding while the help says nothing against it. Low.
- ST3, `tests/data/hubs/website-files.test.ts:566`: title `a row of the setting names a section the rows did not have, ...`. "did not have" compares with an earlier state, which `spec.md:44` bans in test titles. Low.

History-word grep over added comments: six hits, all "before the file is read" or "the last run still runs", statements of order; none is history. ASCII clean. Files within limits (`hub-names.ts` 863 per the report, `cv.ts` 561, test 872). The `cv.ts` head comment and `printed`, `add`, `withPeriod`, `periodText` doc comments are true as read.

## 4. Behaviour
- B1, button of Write the website while the setting is unset, `src/lib/state/sessions/source/website.svelte.ts:118-122`:
```ts
function off(): string | null {
    if (!selfKnown(deps.snapshot())) return t('career.website_no_person');
    if ((settingsOf(deps.config())?.folder ?? '') === '') return t('career.website_no_folder');
    return null;
}
```
`off()` is unchanged, and `career.website_no_cv_sections` is not returned there. With the folder set and no rows, the button is enabled, its tip says it writes the three files (`website_tip`), and only a press answers the refusal. The sibling case, an empty folder, disables the button with the reason as its tip. The report states this only as judgment call 6; its before/after line says only "a press ... answers the sentence". The brief asked for a refusal of a press and no disabling, so this is no violation; it is an inconsistency with a one-line fix in a file on the write list, and it stands as a user-visible behaviour the look should judge.
- B2, audit output on a hub with no rows, the report's "one audit finding per CV row". My run over the hub worktree with `cvSections: []` and empty words: `msg_cv_unknown_section` 28, `msg_cv_no_word` 2 (`website.cv_words.months`, `website.cv_words.open_end`, from employer CV periods), beside the 28 `msg_cv_unknown_record` the base also gives. By reading `publications.ts:123-136`, each file that then differs from disk is also a `msg_site_differs` finding with `action: 'website'`, offering Write the website, which that press refuses with `website-no-cv-sections`. Failure scenario: the window after the oculus commit and before the hub commit, or any hub with a website folder and no rows: the audit lists findings and offers an action that cannot run. The brief fixes the per-row findings; the report's count is short by the no-word findings and the differ findings and does not say the offered action is refused. The orchestrator's stated order (hub rows first) avoids the window on the real hub.
- B3, Settings view, a record list whose field is called `fields`: handled. `draftOf` over the hub's ten rows gives `form records keyed false fields [ 'key', 'fields', 'period', 'record_fields' ] cards 10`; card 0 is `{"fields":{"key":"references","fields":["name","email","reason"]},...}` and `draftValue` writes the rows back. Two residual points. (a) `record_fields` left out (location and when) and `record_fields: []` (takes nothing) draw alike in `FieldControl` (`wordsOf` of undefined and of `[]` are both no items), so a reader cannot tell the two apart while the meaning differs; a row whose items are all removed saves `record_fields: []` with no sign of the change of meaning. (b) A row with only a key: `draftValue` gives `[{"key":"x"}]` and `recordProblem` (`config-fit.ts:376`) checks only the fields present, so Settings saves it and the reader then leaves it out with its field finding. Point (b) is the brief's case; point (a) is not in the report.
- B4, employer CV: holds. Timestamp section prints the text in `date` (row), `teaching` takes location and when and prints in `duration` (row), the real hub's employer file is unchanged (same=true). A hub without an `awards` row prints employer awards in `duration` where the base printed `date`; that follows the brief's "a section no row names prints in duration" and the report does not list it.
- B5, Settings findings of refused rows, not in the report's list of visible changes. `reader.ts` problems of `where: 'row'` share one key and `src/lib/data/sources/config/catalogs.ts:336` makes one finding per `where:key`, so two refused rows (`key: personal` and `key: __proto__`) show one finding, the first; the second appears once the first is fixed. Same behaviour as `zenodoSettings`, which the brief took as its model. Low.

## Declined to judge
- V6, each new test's failing line on the unchanged tree: rerunning needs the new tests over the base code, and the base copy is read only and nothing may be changed; the report's table is the only evidence.
- How the new Settings rows, the Website section and the button are drawn: the look at landing, no page was opened.
- Whether the website repository's files match the output: not opened, the brief leaves it out.
- The real-hub case with the eleventh row `service`, which the orchestrator adds at landing.
- The report's line counts other than `cv.ts`, the test and the fixture, and its 1107 figure: no decision rests on them.

Usage: ad42d420335726bd5, claude-opus-5-5, 267396 tokens, 42 tool uses, 905 s

## Repair round 1, refuted

Review of repair round 1 of O178. No file was changed. Case-run programs ran from `.agents/scratch/` in the oculus worktree and that folder is removed (`ls -a .agents` prints `.`, `..`, `plan.yaml`). `git status --short` prints 28 lines before and after my runs.

Verification lines, verbatim (oculus worktree, node v24.21.0, TMPDIR unset for npm):

- V1 `npm run diagrams`, then `npm run test:quick -- --base a2928dd16`: `test:quick: 271.9 s; failed: vitest slow`; `Test Files  1 failed | 69 passed (70)`; `Tests  11 failed | 654 passed | 316 skipped (981)`. All 11 FAIL lines are `tests/server/edit/config-key.test.ts`, `AssertionError: expected true to be false` at `tests/server/edit/config-key.test.ts:458`. No other row is red. It does not print `every command passed`, as the report says. The list names `vitest slow` alone as failed; I kept only the last 40 lines of its output, so the per-command `ok` lines are not in what I read. `ls -la /tmp/x`: `-rw-r--r--@ 1 axelfaes  wheel  612 Nov  9 13:09 /tmp/x`. `diff -q` of `config-key.test.ts` against the base copy: no difference.
- V2 `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts tests/routes/sessions/website.test.ts tests/checks/config/templates.test.ts --reporter=dot`: `Test Files  4 passed (4)` / `Tests  127 passed (127)`, as the report says.
- `npx vitest run tests/state/sessions/source/website-store.test.ts tests/server/core/reader/reader.test.ts tests/checks/config/config.test.ts --reporter=dot`: `Test Files  3 passed (3)` / `Tests  122 passed (122)`, as the report says.
- `npx vitest run tests/server/core/reader/reader.test.ts --reporter=dot`: `Test Files  1 passed (1)` / `Tests  72 passed (72)`, as the report says.
- The report's filtered form after the change: `npx vitest run tests/data/hubs/website-files.test.ts tests/routes/docs/audit.test.ts -t "cv_hide is written through|offer no action while website.cv_sections holds no section"`: `Tests  2 passed | 99 skipped (101)`. `npx vitest run tests/state/sessions/source/website-store.test.ts --reporter=verbose`: `Tests  8 passed (8)`.
- V3 the `grep -n -E '\b(SECTIONS|TITLED|AWARDS|FROM_RECORD|MONTHS|OPEN_END|AWARD_TIME)\b'` over `cv.ts`: prints nothing, exit 1.
- V4 `wc -l src/lib/server/content/audit/website/cv.ts`: `561`.
- V5 the brief's python line: `10 ['references', 'experience', 'academic', 'students', 'news', 'education', 'grants', 'projects', 'awards', 'extracurricular'] 12 Current 15:59:00-0400`.
- V6 first run on the unchanged tree: not rerun (see Declined).
- V7 `sh utils/unused-exports.sh` against `O178-base/unused-exports.txt`: 335 lines each, `diff` exit 0.
- ASCII: `LC_ALL=C grep -n '[^ -~]'` over the 14 files the round changes prints nothing.
- The report's assertion check, `diff <base file> <file> | grep -E '^<' | grep -E 'expect|toEqual|toBe|predicate'`, four test files: prints nothing, exit 1 for each.
- `grep -c "did not have\|a row of the setting names" .scratch/migration/agents/guarded.md`: `0`.
- `grep -rn -E "\bFROM_RECORD\b|\bTITLED\b|AWARD_TIME|OPEN_END\b|\bawardDate\b" src tests config docs README.md --exclude=local.yml`: prints nothing, exit 1.
- `grep -rn "pub_last" src config docs tests utils README.md --exclude=local.yml | wc -l`: `6`; each of the six lines has its `cv_hide` beside it, or names none needing one (next paragraph).
- `node .agents/scratch/case-two-rows.ts`, source copied from the report: the output the report quotes, line for line (2 findings, 1 finding, 2 findings).
- `node .agents/scratch/case-real-hub.ts`, source copied from the report: `CV _data/data.yml: same=true (9731 vs 9731 chars)`, `employer CVs _data/industry.yml: same=true (33821 vs 33821 chars)`, `base problems: 28, tree problems: 28`, `problems only in tree: []`, `problems only in base: []`.

cv_hide. `field(z.boolean(), map.cv_hide)` is at `normalise-parts/publication.ts:62` and `put('cv_hide', held.cv_hide)` at `papers.ts:105`; `put` writes any value other than undefined, so false is written and an absent value is not. The row at `website-files.test.ts:426` reads the parsed `_data/publications.yml` built from manifests copied into a hub and read through `published()`, so it passes through the normaliser and `papers.ts`. It asserts true, false and `not.toHaveProperty`. It passed in V2. The six `pub_last` hits are `papers.ts:103`, `publication.ts:60`, `model-entities.ts:247`, `manifest-schema.yml:111`, `templates.md:1030`, `data-map.md:372`, and all six places carry `cv_hide`. Nothing else enumerates a publication's fields (`grep -rn "publication\.\(hide\|abstract\)\|\"publication\.\|'publication\." src config tests docs` outside the schema prints nothing).

Section 3's key, `catalogs.ts:336-342`. Run of my own over the tree and the base copy, one program:

| Setting and input | Base | Tree |
| --- | --- | --- |
| `literature.sources`, two rows of address http | 1 | 2 (rows a, b) |
| `literature.sources`, two rows with no key | 1 | 2 (#1, #2) |
| `literature.sources`, two refused rows of one key | 1 | 1 |
| `literature.sources`, not a list (`row: ''`) | 1 | 1 |
| `recover.sources`, two rows | 1 | 2 |
| `links`, two rows | 1 | 2 |
| `venues.browser`, one row with two issues | 1 | 1 |
| `literature.prefer`, wrong (`row: ''`) | 1 | 1 |
| `deposit.zenodo.auth`, two refused rows | 1 | 2 (`[0]`, `[1]`) |

`website.cv_sections` gives two findings for two refused rows (case-two-rows, above). The guarded row is `it.each(ROW_FINDINGS)('names $name')` at `tests/server/core/reader/reader.test.ts:791` and below, the row named 'a key the reader does not know', `toHaveLength(1)`. `diff -q` against the base copy: the file is unchanged. It passed (72 passed). The base-tree line for two rows confirms the sentence the report marks as an inference.

## Verdicts, What to build (whole diff since the base)

1. Settings: holds. `config/options/behavior.yml:141-177`, `config/defaults/behavior.yml` `cv_sections: []` and `cv_words`, each help line present, ST2's text at line 144.
2. Reader: holds. `files.ts:220-244` (`cvSectionShape`), `cvSections()` at `:305`; `website.kinds` untouched in the diff.
3. `cv.ts`: holds. V3; `cvFile` loops the rows (`cv.ts:469`); `withPeriod` reads the row (`cv.ts:229`); `FROM_RECORD_ELSE` (`cv.ts:71`); unknown section (`cv.ts:301-311`); no word once per key (`cv.ts:169-177`); head comment rewritten.
4. Hub key lists and the press: holds. `hub-names.ts:770-773` and its comment, refusal at `runs/website.ts:143`, `WEBSITE_REFUSALS`, sentence key in the store, words in `career.yml`.
5. Sentences and documents: holds. The two `audit.yml` sentences, `docs/templates.md`'s block.
6. Hub: holds. V5; the hub file's modified time, `Nov  9 17:40:25`, is earlier than the round's `files.txt`, `Nov  9 18:22:09`, so the round did not write it.

## Verdicts, sections of the round

1. Button (B1): holds. `website.svelte.ts:121-124`, row at `website-store.test.ts` 'is the sentence of the missing sections ...', passed. The Audit's button also reads `off()` (`AuditSection.svelte:160-168`).
2. Audit action (B2): holds. `publications.ts:133`, the only `action: 'website'` in `src` (`grep`); row at `audit.test.ts:576`, passed.
3. Refused rows (B5): holds. Run above; the guarded row is unchanged. No row added, as the brief allows, since `website-files.test.ts` does not read `settingFindings` (`grep -rln settingFindings tests` lists three other files). See finding B-A.
4. Sentences ST1, ST2, ST3: holds. `templates.md` matches `withPeriod` (`cv.ts:229,235`), the help and the docs match `/^[a-z][a-z0-9_-]*$/` and the `personal` refusal, and the retitled row is at `website-files.test.ts:574`.
5. `cv_hide` (ruling 740): holds. The six listed lines are present at the places the report gives; the row and manifests are as described.

## Verdicts, Cases and new rows

- Ten rows over the test hub: met (`website-files.test.ts:568`, V2; the other eight sections by the real-hub rerun).
- `service` between `academic` and `students`: met (`:574`).
- `servce`: met (`:594`).
- A missing section from each source: met (`:603`, `:612`, `:625`).
- Non-awards row with `period: timestamp`: met (`:642`).
- `awards` without `period` and with `period: ''`: met (`:658`).
- Employer `awards` under timestamp: met (`:671`).
- `record_fields: [url, when]`: met (`:688`).
- `record_fields: []`: met (`:688`, second half).
- Employer `teaching`: met (`:719`).
- Other months and `open_end`: met (`:738`).
- `months: []`: met (`:750`).
- `open_end: ''`: met (`:762`).
- `award_time: ''`: met (`:770`).
- `cv_sections: []`: met (`:778`, with the words set; see finding B-B for the words unset).
- `key: personal`, `''`, `__proto__`: met (`:791`).
- Second `news` row: met (`:813`).
- No `fields` and `fields: []`: met (`:824`).
- Press with `cv_sections` unset: met (`tests/routes/sessions/website.test.ts`, row 'writes nothing and asks no approval ...', V2).
- Audit over a missing section: met (`audit.test.ts`, row 'say the row and the section ...', V2).
- Real hub: met (rerun above).
- New row, `cv_hide`: met (`:426`).
- New row, audit offers no action: met (`audit.test.ts:576`; the row also asserts the file differs).
- New row, the tip while no section is set: met (`website-store.test.ts`).
- Section 3, no row by the brief: met by the quoted run.

## 1. Spec

none. Paths outside the lists: `tests/state/sessions/source/website-store.test.ts` is named in the report with its reason (section 1's tip and fixture), and `.scratch/migration/agents/guarded.md` is the orchestrator's (see ST-B).

## 2. Proof

none. Read, each of the three new rows fails with its behaviour taken out, and the report quotes a failing line for each on the tree before the change. No threshold or predicate changed (the assertion check above).

## 3. Standards

- ST-A, `src/lib/data/sources/config/catalogs.ts:319`, the doc comment of the function the round changed: ` * One finding for each setting of `behavior.yml`, and each option of the editor, whose value the options catalog's rule refuses`. After `catalogs.ts:336-342` a setting with two refused rows gives two findings, so the sentence is false for those five list settings. The report's list of comments re-read (report line 280) does not name it, which `spec.md:72` requires for every function touched. Failure scenario: a later reader takes `settingFindings` to give one finding per key; the input `deposit.zenodo.auth` with two refused rows gives two findings of one key. Low.
- ST-B, `.scratch/migration/agents/guarded.md:228` (G140, the orchestrator's line in this diff, not the builder's): `while `website.folder` is empty, while `website.cv_sections` holds no section or names a folder that is not there`. The refusal for a folder that is not there belongs to `website.folder`, and the sentence now gives it to `website.cv_sections`. Failure scenario: a reader of G140 finds no guarantee that a `website.folder` naming a missing folder is refused, and a step removing `website-folder-missing` can read that as allowed. Fix at landing by moving the clause: "while `website.folder` is empty or names a folder that is not there, while `website.cv_sections` holds no section".
- ST-C, report line 280: "`docs/HELP.md` and `docs/decks.md` name no CV section or word." `docs/HELP.md:528` reads `A Website finding of a generated file that differs offers Write the website.`, which section 2 makes false while no CV section is set. This is not raised as a missing line of that page (`spec.md:72` bars that). The defect is the report's: `spec.md:72` requires such a sentence to be named with its file and line so the orchestrator brings it to Axel. Failure scenario: the landing brings only the three `data-map.md` lines to Axel, and the Help page says a finding offers a press that a hub with no section does not show.

## 4. Behaviour

- B-A, report line 293: "each refused row of a list of records is its own finding", against `catalogs.ts:339-341` (`problem.where === 'row' ? problem.issue.row`). A row's label is its `key` (`rows/check.ts:80-83`), so two refused rows sharing a key share one finding. Input: `literature.sources` with two rows of `key: a`, both addresses http. Result on the tree: `literature.sources, two refused rows one key: 1 finding(s)`. Report line 303 states this only for a row whose key an earlier row holds with an issue of its own, and not under the visible changes. The key is what the round's brief named, so the code follows the brief; the sentence at line 293 overstates it, and it decides what the look at landing expects. Low.
- B-B, report judgment call 1 (`cv_sections: []` "gives one problem per row and no `msg_cv_no_word`") and report line 297 ("one audit finding per CV row"). `profileRow` calls `withPeriod` (`cv.ts:500,509`), and `periodText` reports a missing word (`cv.ts:199-203`) whether or not the setting lists the section. The state named at line 297 is a hub with neither `cv_sections` nor `cv_words`. My run over the hub worktree with both empty: `{"audit.msg_cv_unknown_section":28,"audit.msg_cv_unknown_record":28,"audit.msg_cv_no_word":2}`, the two being `website.cv_words.months` and `website.cv_words.open_end`. Failure scenario: the window after the oculus commit and before the hub commit shows two no-word findings the report says do not occur. The first review measured the same count and the rewritten report keeps the sentence. The row at `website-files.test.ts:778` keeps the words set, so it does not exercise this state.
- B-C, `config/schemas/manifest-schema.yml:113` and `:120`: `"publication.cv_hide": { label: "Hidden on the CV", type: checkbox, section: Website, ...` and `"cv.hide": { label: "Hidden on the CV", type: checkbox, section: Website, ...`. Two checkboxes of one label in one section of the manifest form. Failure scenario: a manifest with both a `publication:` and a `cv:` record draws two boxes reading "Hidden on the CV", which differ only in help text, one keeping the paper off the CV and one the project; a tick on the wrong box writes the other key. The label is the round's brief's verbatim, so it is no builder defect, and the report's before/after (line 294) does not say the label repeats. By reading the schema; the form is for the look at landing.

## Declined to judge

- V6 and the round's first-run table, each new row's failing line on the tree before the change: rerunning needs the code taken back out or a copy of the tree in that state, which the brief for this review forbids. The rows were judged by reading.
- Quoted git commands outside the three allowed, not run in that form: `git diff --stat -- tests/server/edit/config-key.test.ts tests/server/core/reader` (in its place `diff -q` of `config-key.test.ts` and `reader.test.ts` against the base copy: no difference); `git status --short docs` (in its place `git status --short`, filtered: ` M docs/data-map.md`, ` M docs/templates.md`); `git diff -U0 -- src tests config docs | grep ...` (in its place `git diff a2928dd16 -U0 ...` with the same grep: seven comment lines, the seven the report names, each a statement of order or of a run's current state); `git diff -U0 -- docs/data-map.md` (in its place `git diff a2928dd16 -- docs/data-map.md`: one line replaced, line 372).
- The hub worktree's git state: the allowed commands are for the oculus worktree. Checked by the file's modified time and V5 alone.
- How the disabled button, the two checkboxes and the Settings rows are drawn: the look at landing; no page was opened.
- The real-hub case with the eleventh row `service`, which the orchestrator adds at landing.
- The per-command `ok` lines of V1: I kept only the tail of that run; the list names only `vitest slow` as failed.
- The report's timings (349.9 s against my 271.9 s) and line counts other than `cv.ts`, `website-files.test.ts`, `website-hub.ts`, `audit.test.ts`, `catalogs.ts`, `hub-names.ts`, `model-machine.ts` and `model-entities.ts`: no decision rests on them.

Usage: adbd1f4851adc9ef9, claude-opus-5-5, 243030 tokens, 38 tool uses, 622 s

## Closed

- ST-A: fixed at landing, the doc comment of `settingFindings` in `catalogs.ts`.
- ST-B: fixed in `agents/guarded.md` G140 by the orchestrator.
- ST-C: `docs/HELP.md:528` goes to Axel with the `docs/data-map.md` lines at landing, as `spec.md:72` says.
- B-A: the code follows the round's brief; two refused rows of one key are one finding until the first is corrected, named in the booking.
- B-B: the hub's rows land with oculus, so the real hub does not stand in that state; the two no-word findings are named in the booking.
- B-C: fixed at landing, the label of `publication.cv_hide` names the paper.
- Look at landing: the differs finding told a hub with no section to write the website; closed by the two `_no_cv` sentences.
