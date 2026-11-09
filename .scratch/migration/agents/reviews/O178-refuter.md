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
