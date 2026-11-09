# Refuter report: O180

NOT DONE by this review: the scratch folder `/Users/axelfaes/workspace/oculus/.agents/worktrees/tmp-O180-r` (28M, a copy of `tests/`, symlinks to the base copy and to `node_modules`, and `unused.txt`) is still there. Its `rm -rf` was refused by a built-in safety check and I did not retry it. It holds nothing the step needs, so the orchestrator can delete it.

## Verification lines

All commands ran from `migration-O180` under bash, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `tmp-O180-r`, one test file per vitest run.

- `npx vitest run tests/data/website/paper-fields.test.ts --reporter=dot`: `Tests  18 passed (18)`
- `npx vitest run tests/data/hubs/website-files.test.ts --reporter=dot`: `Tests  61 passed (61)`
- `npx vitest run tests/state/sessions/source/website-store.test.ts --reporter=dot`: `Tests  9 passed (9)`
- `npx vitest run tests/routes/docs/audit.test.ts --reporter=dot`: `Tests  41 passed (41)`
- `npx vitest run tests/routes/sessions/website.test.ts --reporter=dot`: `Tests  23 passed (23)`
- `npx vitest run tests/server/root/watch/website-watch.test.ts --reporter=dot`: `Tests  1 passed (1)`
- `npx vitest run tests/checks/config --reporter=dot`: `Tests  117 passed | 9 skipped (126)`. The seven runs together give the report's `270 passed | 9 skipped`.
- `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Tests  2 failed | 9 passed (11)`, the known red. The two rows are 'uses literals except at the documented computed prefixes' (two `sentence(` calls in `audit/publications.ts`) and 'has a reader for every catalog key' (`audit.msg_site_differs`, `_whole`, `_no_cv`, `_whole_no_cv`).
- `npx vitest run tests/server/edit/config-key.test.ts --reporter=dot`, `TMPDIR` set: `Tests  36 passed (36)`
- Brief Verify 3, the grep over `src/lib/server/content/audit/website/*.ts`: one hit, `site.ts:88:const FILE_KEYS = ['site', 'cv', 'papers', 'industry'] as const;`. No hit in `cv.ts`. It is the report's one hit, and it is the keys of a setting.
- ASCII gate of `agents/spec.md` over the 24 changed files, one argument each: prints nothing.
- `npx prettier --check <changed files>`: `All matched files use Prettier code style!`
- `npx eslint <changed .ts files>`: prints nothing.
- `sh utils/unused-exports.sh` diffed against `../O180-base/unused-exports.txt`: `diff` prints nothing (335 lines).
- `npx svelte-check --tsconfig ./tsconfig.json`: `svelte-check found 0 errors and 0 warnings`
- `sh utils/folder-check.sh`: prints nothing.
- First run reproduced on the unchanged code. The worktree's tests were copied into the scratch folder with `src` and `config` symlinked to `O180-base`, under a scratch vitest config (`preserveSymlinks`, svelte plugin, tag `slow`):
  - `paper-fields.test.ts`: `Tests  17 failed | 1 passed (18)`. The one pass is 'the lines of the settings file write the publications file of the hub', so `PAPERS_TEXT` is what the unchanged tree gives. Each of the 17 failing lines matches the report's table.
  - `audit.test.ts`: `1 failed | 40 passed`, `expected '_data/publications.yml differs from w...' to contain 'website.paper_fields'`.
  - `website-store.test.ts`: `1 failed | 8 passed`, `Error: text key not in the text catalog (config/text/): career.website_no_paper_fields`.
  - `website.test.ts`: `2 failed | 21 passed`, both `expected { status: 200, ... } to deeply equal { status: 409, ... }`.
  - `website-watch.test.ts`: `1 passed`.
  - `website-files.test.ts`: `61 passed`.
- Premises of "What is on the tree": each line I grepped on `O180-base` reproduces (`papers.ts:28,54-56,86,92-105,176`, `files.ts:75`, `publication.ts:52-65`, `model-entities.ts:235`, `normalise.ts:305`, `options/behavior.yml:141`, `runs/website.ts:143`, `model-machine.ts:368`, `publications.ts:123`, `career.yml:34`, `audit.yml:61-62`, 880 lines, ten files, no `docs/adr`).
- `git status --short`: 26 entries, the 24 modified and 2 untracked of the start. My runs changed no tracked file.

## Verdicts: items

1. The rows: holds. `settings/files.ts:407-410`, `keyedRows`. A `from: nothing` is left out by `checkedRows` with a `field` problem before the shape reads it, which is one finding as the case asks; disclosed as judgment 3. The shape is `paperFieldShape`.
2. The three words: holds. `settings/files.ts:392-399`.
3. Default, Settings, hub list: holds. `defaults/behavior.yml`, `options/behavior.yml:144-191`, `hub-names.ts:770-775`.
4. The reader: holds. `publication.ts:59-66`, `model-entities.ts` `Publication`; the `__proto__` row passes.
5. The writer: holds. `papers.ts:137-165`, `files.ts:133-151`, both callers.
6. A word not set: holds. `papers.ts:210-218`, `site.ts:32`, `audit.yml`.
7. Empty: holds. `runs/website.ts:146-148`, `website.svelte.ts:126-128`, `publications.ts:128-131`, `career.yml`, `audit.yml:61-62`.
8. Comments, the template page, tests: holds for what the item names. Standards S2, S3 and S4 stand beside it.
9. The hub's lines: holds. `website-hub.ts:58-76`. The hub write is the orchestrator's.

Beyond the items: the rulings "O180 scope" and "Hardcoding sweep", which send the rest of the website's hardcoding to this step's repair round: violated, finding S1.

## Verdicts: cases

- Lines of item 9 over the test hub: met (row passes; the literal reproduced on the base code).
- Rows `[title, authors]`: met.
- `{ key: venue_note }` over a record holding it: met.
- `{ key: venue_note }` without it, and `{ key: constructor }`: met.
- `{ key: paper_title, from: project_title }`: met.
- `year_note`, `before`, `after`: met.
- `author_place` without `order`, and `lead: main`: met.
- `web_links` with `Repository`, `differences`, and `{ key: links }` with no `from`: met.
- `paper_list: items`: met.
- `code_link_name` empty, and a word of `author_places` empty: met.
- `from: ''`, `from: nothing`, `__proto__`, `''`, two `url` rows: met.
- The reader: met.
- A press with no row, and with `paper_list` empty: met.
- The button with no row: met.
- The audit with no row: met.
- The real hub: not verifiable here; it is the orchestrator's at landing.

## Spec

none.

Judged as the review asks, no finding: the change to `config/schemas/manifest-schema.yml:105,109` belongs. The old texts ("your place among the authors, the words around the venue and the Code link are taken from the rest of the manifest", "The Code link is added after them") name a word that is now the hub's setting, and fields that are now the hub's rows, so the step made them false. `spec.md` makes such a sentence a defect of the change, and the report names the path outside the write list with its reason.

## Proof

- **P1. Three greps the rules file requires are not quoted.** Place: `.scratch/migration/agents/reviews/O180-report.md`, whole. Rules: `spec.md` "grep the comment lines and test titles you added or changed for these words, and the report quotes the grep with each hit judged"; "After changing a name, a construct or a shape, grep it across `src`, `tests`, `config`, `docs` and `README.md` ... and quote that grep in the report"; "before writing a helper, type or schema, grep `src` and `tests` for its name and its key call and reuse what exists, quoting that grep in the report". The report quotes none of the three. Failure scenario: `orderOf` renamed to `placeOf`, `linksOf` replaced, `keyedRows` written, and the reader has no recorded search for a stale name or an existing helper. My run of the history-word grep over added comments and titles gives only "still" in rewrapped present-tense text (`runs/website.ts` "still runs", "still refuses") and the data key `'before'`, so nothing false results; the proof is what is missing.
- **P2. The report has no file table.** Place: the same report. Rule: `spec.md` "The report's file table is made from the `diff -rq` against the base copy, so every changed path is in it, and it marks each path outside the write list" and "files changed with line counts". The report holds no such table; only `manifest-schema.yml` is named, inside a prose section. Failure scenario: a path outside the write list is visible only by reading the diff, which is how this one was found.
- **P3. Changed tests with no first-run pass quoted.** Place: report, "Edits to existing tests". Rule: `spec.md` "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree". The input of `tests/server/root/watch/website-watch.test.ts`, of `generated()`/`checkOf` in `audit.test.ts`, of `worldOf` in `website.test.ts` and of `settingsOf` in `website-store.test.ts` changed, and the report gives before and after of the input and no run on the unchanged tree. Failure scenario: a fixture change that altered what those rows prove would not show. My runs on the base code pass (watch 1, audit 40, route 21, store 8, website-files 61).
- **P4. File-scope mutables added in a test.** Place: `tests/data/website/paper-fields.test.ts:34-36`, `let input: WebsiteInput; let built: Built; let config: Record<string, unknown> = {};`. They are assigned in `beforeAll`, as the sibling `website-files.test.ts` does, and are not shared across module graphs, so `spec.md`'s "No globals" is not broken; named because the review's list names any file-scope mutable. Failure scenario: none at present; a second `beforeAll` in that file would overwrite the three.

No test reads as passing with its behaviour taken out. The row 'the lines of the settings file...' passes on the base code by design, as the brief's guard.

## Standards

- **S1. Hardcoded field names, list keys and words of the website's files remain.** Verdict: rulings "O180 scope" and "Hardcoding sweep" violated. The brief's sentence stops at the publications file, and Decision 3 keeps three names; this review's rule counts them whatever the Decisions say. Failure scenario for all: a website whose file uses another key for any of these gets the fixed word written, or its key unread, with no setting to change it. Each with its line:
  - Writer `papers.ts`: `:50 const DEPOSITED = 'deposited'`, `:53 const REVIEW_ANON = 'review-anon'`, `:41 const DOI_ORIGIN`, `:128` `.links`, `row.name`, `row.url`, `:194` `.program`, `:233` `.rank`, `:141-142` `kind.pub_pre`, `kind.pub_post` (keys of the `website.kinds` row that carry the file's field names), `:186,231` `kind.order`.
  - Reader `publication.ts`: `:62-64` `program`, `links`, `rank`; `:70-78` `projectCv` names `title`, `url`, `when`, `about`, `role`, `hide`, `rank`, which ruling "O180 scope" says keeps every key as `publication()` does. `manifest-schema.yml` holds no `cv.cv_hide` row (`:115-121`), which that ruling asks for.
  - `cv.ts`:
    - `:54-57` `CAREER_LISTS` (`references`, `positions`, `experience`, `degrees`, `education`, `awards`).
    - `:61 WHEN`, `:64 DURATION`, `:65 DATE`, `:71 'location'`, `:74 RECORDS`.
    - `:122-125` `status`, `cv_title`, `cv_url`, `cv_status`, `out.title`, `out.url`.
    - `:323,325,376-377` `cv_section`, `cv_rank`.
    - `:347-349` `'students'`, `title`, `location`.
    - `:369,375` `row.key`.
    - `:389-393` `references`, `person`, `name`, `email`, `reason`.
    - `:395-401` `funding`, `award`, `location`, `content`, `funding.about`.
    - `:411,414-415` `title`, `rank`, `'projects'`.
    - `:452` `'first-name'`, `'last-name'`.
    - `:458,460` `links.email`, `links.orcid`.
    - `:468` `value.personal`.
    - `:470,516,520` `content`.
    - `:530-532,546-547` `location`, `email`, `links`.
    - `:536 SHARED = 'shared'`.
    - `:541,553-558` `profiles`, `shared`, `personal`.
  - `site.ts`: `:57` `value.programs`.
  - `settings/files.ts`: `:221 CV_PERSON_BLOCK = 'personal'`, `:213-214` `pub_pre`, `pub_post`.
- **S2. A comment line ends short inside a sentence.** Place: `src/lib/state/sessions/source/website.svelte.ts:10`, `// before it is sent, as every write over such a file is`, 56 columns, with the next word `(state/sessions/source/write-files.ts,` fitting within 100. Rule: `spec.md` "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short". The step rewrapped the lines above it and stopped there. Failure scenario: the paragraph reads as broken at that line.
- **S3. Exports with no importer.** Place: `tests/fixtures/hubs/website-hub.ts:58 export const PAPER_SETTINGS`, `:453 export type WebsiteWorld`. `grep -rn` over `src` and `tests` finds each used only inside that file. Rule: `spec.md` "one with no importer outside its own file and its tests is removed or made local". `utils/unused-exports.sh` runs knip with `--production` over production entry points, so its clean result does not reach these. Failure scenario: two public names of a fixture nobody imports.
- **S4. A head comment the change makes false, reported as still true.** Place: `src/lib/server/content/audit/website/site.ts:3-5`, "so the hub holds no word of the website's and the generated files hold only what the hub gives". After the step the hub's settings hold `code_link_name: Code`, `author_places: { lead: first, ... }` and `paper_list: papers`, which are words of the website's file. The report lists "head of `website/site.ts`" as still true. Failure scenario: a reader of that head concludes the website's words cannot be in the hub's config and looks for them elsewhere.
- **S5. A template line tells half of it.** Place: `docs/templates.md:1046`, `(a key not below is held too)`. The key is held, and the manifest schema names it as a finding unless the hub's `manifest_fields` lists it (brief premise on `schema/manifest.ts:120-140`, `additionalProperties: false`). The Settings help of `website.paper_fields` (`options/behavior.yml:144`) says nothing of it either. Failure scenario: a hub adds `publication: { venue_note: x }` and the row `{ key: venue_note }` as the page reads, and gets a manifest finding the page did not announce. Low; a sentence clause settles it.

Files within the size limits: largest step file 820 lines, new test 302. No non-ASCII. No comment line over 100 columns in the changed `.ts` files.

## Behaviour

- **B1. Reader-visible help texts changed with no before and after.** Place: `config/options/behavior.yml:130,134,138` (the `order`, `pub_pre`, `pub_post` helps of `website.kinds`, shown on Settings), `:1687` (the group `website` sentence), `config/schemas/manifest-schema.yml:105,109` (the helps of `publication.authors` and `publication.links`, shown on the project form). The report's table "Host- or user-visible changes" lists only the new Settings entries; these appear in the "Comments and documents re-read" section as rewritten, without the old and new text. `spec.md` counts "the words of a refusal" and what is drawn as visible, and the look is read against that table. Failure scenario: the look at landing has nothing to compare these six helps with.

Judged, no finding: the report's judgment 1 states before and after for the order of the CV's `personal.links` under a hub whose links row has another key.

## Declined to judge

- The real hub's bytes: the orchestrator's run at landing, by the brief and ruling 746.
- What a press shows on screen and the Settings cards for the new entries: no page was opened; the look at landing settles it.
- `tests/server/edit/config-key.test.ts` with `TMPDIR` unset, and `/tmp/x`: not run or read, as instructed.
- The report's key colliding case for `website.code_link_name`: `spec.md` asks the report to state what a new key does when it collides. A record link already named as `code_link_name` is overwritten at its own place by the code link (`Object.fromEntries`, `papers.ts:131-132`), the same as the base did with `Code`, and the report does not say so. I read this from the code and did not build the case; a row with such a link would settle it.
- `agents/guarded.md` line 225 still says `order` is `first`, `senior` or `coauthor` and names the `Code` link: a ledger file, outside the step, for the orchestrator.

Usage: aade7a12319164806, claude-opus-5-5, 233680 tokens, 32 tool uses, 936 s

# Repair round 1, refuted

## Verification lines

All commands ran from `migration-O180` under bash. `/tmp/v180r` is removed; `git status --short` prints 30 entries, as at the start.

- `npx vitest run tests/data/website/paper-fields.test.ts --reporter=dot`: `Tests  18 passed (18)`
- `npx vitest run tests/data/website/cv-fields.test.ts --reporter=dot`: `Tests  21 passed (21)`
- `npx vitest run tests/data/hubs/website-files.test.ts --reporter=dot`: `Tests  61 passed (61)`
- `npx vitest run tests/routes/docs/audit.test.ts --reporter=dot`: `Tests  41 passed (41)`
- `npx vitest run tests/routes/sessions/website.test.ts --reporter=dot`: `Tests  23 passed (23)`
- `npx vitest run tests/server/root/watch/website-watch.test.ts --reporter=dot`: `Tests  1 passed (1)`
- `npx vitest run tests/state/sessions/source/website-store.test.ts --reporter=dot`: `Tests  9 passed (9)`
- `npx vitest run tests/checks/config --reporter=dot`: `Tests  117 passed | 9 skipped (126)`
- `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Tests  2 failed | 9 passed (11)`, the two rows the round names, the four `audit.msg_site_differs*` keys among them.
- `npx vitest run tests/server/edit/config-key.test.ts --reporter=dot`: `Tests  36 passed (36)`
- With `--testTimeout=120000`, as the report quotes them:
  - `tests/checks/source/comment-width.test.ts`: `Tests  2 passed (2)`
  - `history.test.ts`: `Tests  6 passed (6)`
  - `catalog-file-keys.test.ts`: `Tests  1 passed (1)`
  - `tests/checks/tree/size.test.ts`: `Tests  10 passed (10)`
  - `duplication.test.ts`: `Tests  18 passed (18)`
  - `boundaries.test.ts`: `Tests  11 passed (11)`
  - `tests/checks/imports/cycles.test.ts`: `Tests  7 passed (7)`
  - `tests/data/helpers/hub-names.test.ts`: `Tests  34 passed (34)`
- `npx tsc --noEmit -p .`: prints nothing.
- `npx svelte-check --tsconfig ./tsconfig.json`: `COMPLETED 4652 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npx prettier --check <changed .ts files>`: `All matched files use Prettier code style!`
- `npx eslint <changed .ts files>`, RED: `src/lib/server/content/audit/website/cv.ts  161:5  error  Unsafe return of a value of type `any`  @typescript-eslint/no-unsafe-return`, `1 problem (1 error, 0 warnings)`. Finding P1.
- ASCII gate of `agents/spec.md` over the 28 changed files: prints nothing.
- `sh utils/unused-exports.sh` diffed against `../O180-base/unused-exports.txt`: `diff exit 0`.
- `sh utils/folder-check.sh`: prints nothing, exit 0.
- Brief check 3 with this round's names added to its pattern, over `audit/website/*.ts`:
  - `site.ts:23: programs: string[];` is a field of oculus's own `SiteFile`.
  - `site.ts:60: return { path, programs: ...` is the same field.
  - `site.ts:90: const FILE_KEYS = ['site', 'cv', 'papers', 'industry'] as const;` holds the keys of a setting.
  - No hit in `cv.ts` or `papers.ts`.
- All string literals of `audit/website/*.ts`, listed by grep: setting keys, catalog keys, `lead`, `supervisor`, `collaborator`, YAML tags and `HEADER`. The only word of a generated file still in code is `HEADER` (finding Sp2).
- First run on the unchanged code (scratch copy of `O180-base/src` and `config`, this tree's `tests`):
  - `cv-fields.test.ts`: `Tests  19 failed | 2 passed (21)`
  - `paper-fields.test.ts`: `Tests  17 failed | 1 passed (18)`
- Fixture byte for byte: a printing test over `websiteWorld()` run on the base code and on this tree:
  - `_data/data.yml 690 690 same true`
  - `_data/publications.yml 2420 2420 same true`
  - `_data/industry.yml 500 500 same true`
  - `problems same true 6 6`
- A richer synthetic hub, built by hand with the report's settings (every role, students, funding award, profiles, shared block, `Code`-named record link), run on both codes:
  - `data.yml bytes 1679 1679 same true`
  - `publications.yml bytes 975 975 same true`
  - `industry.yml bytes 761 761 same true`
  - `problems same true 5 5`
- The 40 roles empty, this tree's `websiteFiles`, 9 sections: `problems 40 no_word 40`. `data.yml` is `references: {}`, `experience: {}`, ... with no person block. `industry.yml` is `{}`. Publications are unchanged.
- Reading the hub's `.oculus/config.yml` `website:` block: 11 rows of `cv_sections`, no `cv_fields`, no `paper_fields`.
- A walk of the hub's manifests (`projects/`, `side-projects/`, `funding/`, `ideas/`), 124 files, base `publication()` and `projectCv()` against this tree's, key names and counts only: the only difference is `cv.cv_hide` on 2 manifests.
- `hub-names.ts`: `wc -l` gives 880.

## Verdicts, the brief's "What to build"

1. The rows: holds.
2. The three words: holds.
3. Default, Settings, hub list: holds.
4. The reader: holds.
5. The writer: holds.
6. A word not set: holds.
7. Empty: holds for what the item names (`paper_fields`, `paper_list`); the CV settings of the round are finding B1.
8. Comments, the template page, tests: violated, finding S1 (`model-entities.ts:235`, a doc comment the change makes false).
9. The hub's lines: holds.

## Verdicts, the round

- Item 1 (S1, the website's field names): violated, findings Sp1, P1, P2, P3, S1.
- Item 2 (report, P1 P2 P3 B1): holds.
- Item 3 (S2 to S5): holds.

## Verdicts, the brief's "Cases"

- Lines of item 9 over the test hub: met.
- Rows `[title, authors]`: met.
- `{ key: venue_note }` over a record holding it: met.
- `{ key: venue_note }` without it, and `{ key: constructor }`: met.
- `{ key: paper_title, from: project_title }`: met.
- `year_note`, `before`, `after`: met.
- `author_place` without `order`, and `lead: main`: met.
- `web_links`, `differences`, and `{ key: links }` with no `from`: met.
- `paper_list: items`: met.
- `code_link_name` empty, and a word of `author_places` empty: met.
- `from: ''`, `from: nothing`, `__proto__`, `''`, two `url` rows: met.
- The reader: met.
- A press with no row, and with `paper_list` empty: met.
- The button with no row: met.
- The audit with no row: met.
- The real hub: not verifiable here; the orchestrator's at landing.

## Spec

- **Sp1. The hub's lines are not in one fenced block.**
  - Place: `.scratch/migration/agents/reviews/O180-report.md:217`, "Every line for the hub's `website:` block".
  - The round's text asks "the report gives every line to add to the hub's `website:` block, in one fenced block". That block holds `cv_lists`, `cv_entry_fields`, `cv_fields`, `code_statuses` and `site_programs`. The 17 lines of item 9 (`paper_list`, `code_link_name`, `author_places`, the 14 rows) stand only in the earlier block at lines 74-93.
  - Failure scenario: a landing writes the block headed "Every line" alone, and every press is refused. Or it writes item 9's alone, as ruling 746 words it ("the 14 rows and 3 keys"), and the press writes the empty CV of B1.
- **Sp2. A sentence of the three generated files stands in code.**
  - Place: `src/lib/server/content/audit/website/files.ts:23-24`, `const HEADER = "Generated by oculus from the research hub. Change the hub's files and write the website again.";`.
  - It is text of the website's files in `audit/website/`. It is neither a setting nor listed under the report's "These stay". Judgment: it is oculus's own marker, but the round says no word of those files stands there, so it is either a setting or a named exception.
  - Failure scenario: a hub cannot change the line, and a reader of `site.ts:3-4` ("words ... in no code") is told otherwise.

## Proof

- **P1. An eslint error in the round's own code, absent from the report.**
  - Place: `src/lib/server/content/audit/website/cv.ts:161`, `return Object.fromEntries([...own, ...named.map((row) => [row.key, fields[row.from]])]);`.
  - `npx eslint` prints `161:5  error  Unsafe return of a value of type `any``. The report's table lists prettier and `tsc` and no eslint run; `npm run test:quick` was not run by the round.
  - Failure scenario: the landing's verify list ends failed on a file this step changed.
- **P2. A claim about `doi_origin` does not reproduce.**
  - Place: report line 207, "`doi_origin` has no `empty: true`, so an empty value is refused and the default stands".
  - My run over the fixture hub with `doi_origin: ''` in its `.oculus/config.yml`, through `loadConfig` and `websiteSettings`, printed `"" []`: empty and no problem. Only an absent key gives the default.
  - Failure scenario: a hub with the empty value hand-written gets every DOI code link as the bare DOI (`` `${input.doiOrigin}${doi}` ``, `papers.ts:127`), with no finding.
- **P3. The first run of `cv-fields.test.ts` is quoted for one row of 19.**
  - Place: report lines 177-184, "The other 18 fail the same way".
  - `agents/spec.md:69` asks for each test's failing line. The report gives one and two examples. My run reproduces the count, 19 failed | 2 passed, and the lines differ, for instance `expected { Object (shared, profiles) } to deeply equal { 'x-shared': ...` and `expected {} to deeply equal { about: 5 }`.
  - Failure scenario: a reader cannot tell from the report which rows failed for the reason their title says.
- **P4. "Byte for byte" is credited to a test that does not check it.**
  - Place: report line 152, `tests/data/hubs/website-files.test.ts | DONE, the three generated files byte for byte`.
  - That file compares a literal only for the CV (`:510`, `TEN_ROWS_CV`). The publications literal is at `paper-fields.test.ts:84`. No literal exists for the employer CVs' file, read only through `parse` and its first line.
  - The equality itself holds by my base-against-tree run above.
  - Failure scenario: a change of order or quoting in `_data/industry.yml` passes every row.
- **P5. File-scope mutables added in a test.**
  - Place: `tests/data/website/cv-fields.test.ts:35-37`, `let input: WebsiteInput; let config ... = {}; let renamed: Built;`.
  - Assigned in `beforeAll`, the form first-round P4 named and the round left. Failure scenario: none at present; a second `beforeAll` would overwrite the three.

No test reads as passing with its behaviour taken out. The two rows that pass on the base code ('with every word set', 'no problem names a role left empty while cv_sections holds no row') are guards of the condition.

## Standards

- **S1. Sentences that still name the fixed word `programs`, false since `website.site_programs`.**
  - Places, each carrying that word:
    - `src/lib/data/model/model-entities.ts:235`, "keys of `programs:` of its own file"
    - `config/options/behavior.yml:90`, help of `website.files.site`, "whose programs: are the research lines"
    - `config/schemas/manifest-schema.yml:107`, "keys of programs: of the website's own file"
    - `config/text/views/system/audit.yml:70`, `msg_site_program`, "which programs: of {1} does not hold"
    - `docs/templates.md:1131`, "keys of programs: of the website's own file"
  - Rule: `agents/spec.md:72`, a sentence the change makes false is a defect of the change; the same word stands in a catalog sentence a reader sees.
  - Failure scenario: a hub with `site_programs: lines` is told by the audit that `programs:` lacks the research line.
- **S2. A catalog sentence false for one of its keys.**
  - Place: `config/text/views/system/audit.yml`, `msg_site_no_word: 'an entry of the publications needs a word the setting {0} does not hold, so it is left out: set it'`, raised for `website.site_programs` at `papers.ts:231`.
  - Under that key no entry and no word is left out: the entry is written whole and the research-line check does not run.
  - Failure scenario: the audit tells the reader a paper was dropped.
- **S3. `hub-names.ts` at 880 lines, kept there by compacting.**
  - Place: `src/lib/data/helpers/hub-names.ts:784-787`, `...CV_FIELD_ROLES.map((role) => ({ key: `website.cv_fields.${role}`, file: 'behavior.yml' })),`.
  - The report, line 190: "because forty rows would pass the size rule". `agents/spec.md:48` says a file that would pass 880 "is split by concern in the step ... code is not compacted to stay under it", and the round names "its row in the hub's list".
  - The file is at the limit and within it; each role is a key of the list at run time, and the key list has one source. What breaks the rule is the reason given.
  - Failure scenario: the next key forces the split the step avoided.

No comment line over 100 columns. No non-ASCII. No history wording in the added comments or titles (the hits are `before` and `still` in present-tense sentences, and the data key `'before'`).

## Behaviour

- **B1. A press is not refused while CV roles are empty, and writes over the website's CV.**
  - Place: `src/lib/server/machine/runs/website.ts:146-148` and `:186` (`return { files: built.files, dir, cv: setting.cv }`, `built.problems` read nowhere on this path); `src/lib/server/content/audit/publications.ts`, `writable`.
  - Before: `website-no-cv-sections` exists, its comment says, "so a hub with no rows writes no CV holding its person block alone".
  - After, on the real hub: 11 rows of `cv_sections`, no `cv_fields`.
    - Until the lines land, `paper_fields` is empty, so the press is refused, and the audit has 40 `msg_cv_no_word` findings and all three files differing with no action offered.
    - With item 9's lines alone, or with one role cleared, the press is offered and accepted. By my run, 40 empty roles give `data.yml` with each section `{}`, no person block, and `industry.yml` `{}`. The single empty role `rows` gives every section `{}`.
  - The report's hazard (line 142) says the CV "writes no fields" and gives no before and after for the press.
  - Failure scenario: Clear on one role in Settings, then Write the website, replaces the website's CV sections with empty maps while the only signal is an audit finding.
- **B2. An empty `website.cv_lists` or `website.cv_entry_fields` is silent.**
  - Place: `cv.ts:418` (`this.input.cvLists`), `cv.ts:154-162`.
  - Before: the lists and fields were fixed. After: both default to `[]`, with no problem, no refusal and no sentence in the report's "Keys introduced, checked", which `agents/spec.md:73` asks for each key.
  - By my run, `cv_lists: []` takes the CV from 1679 to 1134 bytes, references, experience, academic, education and awards to 0 rows, and raises only `msg_cv_unknown_record` where a profile row names such a record, none otherwise. `cv_entry_fields: []` adds 0 problems and writes the entry's own title and its `status: dropped`.
  - Failure scenario: a hub with `cv_sections` and the roles set and no `cv_lists` writes a CV without its career rows and no finding says why.
- **B3. The real hub's CV changes, stated only for values of the wrong shape.**
  - Place: `publication.ts:77-83`; report line 203.
  - Before: `projectCv` read seven keys, no `cv_hide`. After: every key.
  - Two manifests hold `cv.cv_hide`. The hub's `projects` row prints `cv_hide` (`.oculus/config.yml:66`). The website's `_data/data.yml` holds `cv_hide` in none of its 21 project rows (my parse, counts only).
  - The rule "O180 scope" asks for the key to be held, so the direction follows the ruling. The report gives no before and after, and the brief's real-hub case compares only the publications text, so it does not exercise this.
  - Failure scenario: at landing the audit names `_data/data.yml` as differing at `projects`, with no line of the report to read it against.
- **B4. The round's reader-visible changes have no before-and-after row for the look.**
  - Place: report, "Repair round 1"; `agents/spec.md:61`.
  - Named without old and new text and without a view and state to look at: the 46 new Settings entries and the groups `website.code_statuses` and `website.cv_fields`; the project form's new field `cv.cv_hide`; the helps of `website.cv_sections`, `period` and `record_fields` (report line 201 says they "now name the roles"). `audit.msg_cv_no_word` gets its new text without its old one.
  - Failure scenario: the look at landing has nothing to compare these with.

## Declined to judge

- The real hub's run, by the brief and ruling 746 the orchestrator's: I read only the `website:` block of the hub's config and the manifests' key names.
- What the Settings cards and a press show on screen: no page was opened.
- Whether `.scratch/migration/agents/reviews/O180-refuter.md` should have been in the worktree: `ls` in the worktree counts 0 and the report says so; the dispatch is the orchestrator's.
- `.scratch/migration/agents/briefs/O180.md` is changed since the base and absent from the report's file table: the orchestrator's edit by its text.
- Who created `../tmp-O180-r`: another git command or history would be needed.

Usage: a4cd58a46c0fe40f7, claude-opus-5-5, 281075 tokens, 42 tool uses, 719 s.

## Closed

- Sp1: the hub's lines are written at landing as one set, the 17 lines of item 9 and the block of the round.
- Sp2: fixed at landing, `HEADER` becomes the setting `website.file_header`.
- P1: fixed at landing, the pairs of `entryFields` typed.
- P2: fixed at landing, an empty `website.doi_origin` gives no code link and one problem.
- P3, P4, P5: no change. The counts and the base-against-tree equality are reproduced in this review; P5 is the form its sibling test has.
- S1: fixed at landing, the five sentences name `website.site_programs`.
- S2: fixed at landing, `msg_site_no_word` says what is left out in words true of every key.
- S3: no change. The list has one source for the roles, and the file is within the limit; O181 splits it when its keys pass the limit.
- B1, B2: fixed at landing, a press is refused while a role of `website.cv_fields` is empty or `website.cv_lists` holds no row, and an empty `website.cv_lists` is one problem.
- B3: the two manifests' `cv.cv_hide` follows ruling O180 scope; the landing's real-hub case shows it.
- B4: read at the look.
