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
- `npm run test:quick` and the report's `test:quick: 315.4 s; failed: vitest checks, vitest slow`: not run, by the ruling that tests run one by one. The per-file runs above stand for the step's files; other test files that import the changed modules were not run.
- `tests/server/edit/config-key.test.ts` with `TMPDIR` unset, and `/tmp/x`: not run or read, as instructed.
- The report's key colliding case for `website.code_link_name`: `spec.md` asks the report to state what a new key does when it collides. A record link already named as `code_link_name` is overwritten at its own place by the code link (`Object.fromEntries`, `papers.ts:131-132`), the same as the base did with `Code`, and the report does not say so. I read this from the code and did not build the case; a row with such a link would settle it.
- `agents/guarded.md` line 225 still says `order` is `first`, `senior` or `coauthor` and names the `Code` link: a ledger file, outside the step, for the orchestrator.

Usage: aade7a12319164806, claude-opus-5-5, 233680 tokens, 32 tool uses, 936 s
