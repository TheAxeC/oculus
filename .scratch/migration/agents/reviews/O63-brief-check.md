# Step O63 brief check (on main at 7ab9536a)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O63.md`. Pages are named by section; code and grep hits keep `file:line`. Every command below was run from `/Users/axelfaes/workspace/oculus` unless it says otherwise. I changed nothing.

## 1. Names

Command: `git grep -n -F -- "<name>" -- src tests config docs utils README.md ':!config/local.yml' ':!.scratch'`, run once for each of: publications_file, publicationsFile, publication_kinds, publicationKinds, PublicationKind, standardStages, `standard:`, RETIRED, FOLDERS, DATA_DOC, DATA.md, hasDataSection, AUDIT_PATHS, msg_no_readme, msg_code_no_readme, msg_no_data_section, msg_retired_doc, msg_bad_folder, msg_site_, sec_conform, msg_deposit_before_reproduction, publications.yml, one-README, one README, conformance, `audited(`, sitePapers, expectedSections. Then `git grep -n "\`standard\`\|deposit root\|pre-hub\|never leave the hub\|tier standard\|Tier conformance"` over the same paths.

Hits outside "Paths this step writes":
- `RETIRED` and `FOLDERS`: these hits are other constants with similar names in unrelated modules, so the change does not make them false. They are `tests/fixtures/kinds.ts:20` (`RETIRED_KINDS`), `src/lib/server/content/latex/pdfjs-assets.ts:18`, `src/lib/server/edit/writes/config/lists/folders.ts:40`, `src/lib/server/machine/lines.ts:43` (`LEFT_OUT_FOLDERS`), `src/lib/server/sessions/cache.ts:37`, `src/lib/state/sessions/source/write-files.ts:243`, `tests/server/machine/apps/manifest/manifest.test.ts:35`, `tests/views/shared/explorer/opening-apps.test.ts:23`, and the `APP_FOLDERS` and `PLAIN_FOLDERS` hits.
- `DATA.md`: `src/lib/server/machine/lsp/adapters/markdown/rewrite.ts:3` and the LSP tests (`tests/server/machine/lsp/adapters/markdown-created.test.ts:210-279`, `markdown-requests.test.ts:69,232,297`) use `docs/DATA.md` as example content. The change does not make them false.
- `sec_conform` and `audit.empty`: `src/lib/views/system/audit/Audit.svelte:102` (`t('audit.sec_conform')`) and `:186` (`t('audit.empty')`) read these keys. The brief rewords the texts and keeps the keys, so these lines stay true unless a key is renamed.
- `deposit root`: `tests/data/sources/docs.test.ts:46` is fixture text. The change does not make it false.
- New key `audit`: `git grep -n "^audit\b\|^    audit:\|^  audit:" -- config` finds only nested keys: `config/catalogs/glyphs.yml:100`, `config/catalogs/icons.yml:99`, `config/defaults/layout.yml:316` and the text group at `config/text/views/system/audit.yml:9`. None is a top-level key that the new top-level `audit` would collide with.
- Every other name has no hit outside the paths.

Hits inside the paths that the change makes false but the brief never names:
- `config/catalogs/vocab.yml:80`: "and `publication_kinds` below reads it" (the comment on `forms:`).
- `config/catalogs/vocab.yml:208`: "the one-README standard ... and the website's publications" (the comment on `skip_tiers`).
- `src/lib/data/shapes/catalog-files/vocab.ts:107`: the description of the `public` flag ends "in the sections `publication_kinds` gives".
- `config/defaults/sources.yml:56`: the comment above `publications_file` covers both `publications_file` and `linkedin_dir`.
- `docs/HELP.md:513`: lists `publication_kinds` among the keys of `vocab.yml`.
- `tests/checks/config/config-folder.test.ts:655`: a test title names `publication_kinds`.

Paths the step needs that the write list leaves out (more under check 6):
- `src/lib/server/root/watch/portfolio.ts` is at the size limit. `wc -l` prints `880`. The rules file ("What every package obeys") says a changed file that would pass 880 lines is split. Its folder already has 10 tracked items (`git ls-files src/lib/server/root/watch | ... | wc -l` prints `10`), so a split also means splitting the folder. The write list names no new file or folder under `src/lib/server/root/watch/`.
- The `audit:` shape findings have no path to go in:
  - The existing pattern for a hub setting's reader is in the data layer: `chatContext` at `src/lib/data/sources/config/settings/files.ts:164`, `PROBLEM_READERS` at `settings/problems.ts:30-53`, `READER_FINDINGS` at `sections/findings.ts:33-48`.
  - For a hub other than the primary, findings come from `readOtherHub` (`src/lib/data/index.ts:545-566`), which adds only `sourcesFindings`.
  - None of these files is in the write list. The only new-file allowance is under `src/lib/server/content/audit/`, which the data layer may not import.
  - `config/text/findings.yml` is not in the list either, so new finding words have nowhere to go.

Findings:
- The six hits listed above (`vocab.yml:80`, `vocab.yml:208`, `vocab.ts:107`, `sources.yml:56`, `HELP.md:513`, `config-folder.test.ts:655`) are made false by the change and are not named in "What to build".
- The write list leaves out the split of `portfolio.ts` and its folder, and the data-layer reader of `audit:` with its finding words.

## 2. The step line

- "the audit's hub conventions become one hub setting `audit:`, each off unless the hub sets it": item 1, first bullet.
- "required files by stage or folder": item 1, `required_files`.
- "required README sections": item 1, `required_sections`. The brief widens this to any file, which is within ruling 300 (1).
- "the website check with its section kinds moved out of `vocab.yml`": item 1, `website`, plus item 2 (`publication_kinds` and `publications_file` go).
- "the stage flags `standard` and `archive_outcome`":
  - `standard`: item 2.
  - `archive_outcome`: no requirement. The premise (brief line 16) says O55 removed it, and the premise grep prints nothing.
- "the retired-documents, folder-rename and outcome-folder checks removed":
  - Retired documents and folder rename: item 2.
  - Outcome folder: no requirement, same premise.
- "the finding texts in words true for any hub": item 3.
- "the author-chip check removed (ruling 220)": no requirement, same premise.
- Ruling 288 (3) with Z980 (published folder) gives item 1 `stage_folders`. Z981 gives item 5 and G125.
- The rules file's "What every package obeys" asks a step to write what a user does into `docs/HELP.md`. Item 4 only edits existing HELP sentences and asks for no bullet on how a hub sets `audit:`.

Findings:
- `archive_outcome`, the outcome-folder check and the author-chip check are covered only by the premise that O55 removed them. Verify item 3's grep does not include those names, so nothing in the step's own checks keeps them out.
- No requirement asks for a `docs/HELP.md` bullet on setting `audit:`.

## 3. Premises

Matches:
- Brief line 5, `ls docs/adr`: prints `No such file or directory`. Matches.
- Brief line 12, projects.ts names: `grep -nE "SCANNED|DATA_DOC|RETIRED|FOLDERS|AUDIT_PATHS|hasDataSection|conformance|standardStages" src/lib/server/content/audit/projects.ts` prints `:48`, `:51`, `:54`, `:57`, `:69`, `:140`, `:294`, `:301`. Matches. `AUDIT_PATHS` is read at `portfolio.ts:179`. Matches.
- Brief line 13: `RETIRED` at `:54` and `FOLDERS` at `:57-61`. Matches.
- Brief line 14, the `standard` flag:
  - It is on `vocab.yml:65-73` and described at `:58`; the shape is at `vocab.ts:105`; it is read at `rules.ts:172` and `projects.ts:301`. Matches.
  - Rows `:74-77` (published, released, failed, stopped) carry `terminal` and not `standard`. Matches.
- Brief line 15, the website check:
  - `sources.yml:57`, options `:65`, `hub-names.ts:372`, `rules.ts:142,159`, `sitePapers` at `publications.ts:87`. Matches.
  - `publication_kinds` at `vocab.yml:235-244` with shape `vocab.ts:252,396`. Matches.
  - `scan.ts:47` (`if (input.primary) publications(...)`). Matches.
- Brief line 16: `grep -rn "archive_outcome\|folderStage\|msg_projects_published\|author_chips" src config tests --exclude=local.yml` prints nothing, exit 1. Matches.
- Brief line 17: every `audit.yml` line number matches (`cat -n`).
- Brief line 20: `wc -l` prints `111`; `grep -c "^describe("` prints `2`; `publicationsFile` is at `:49,:91` and `msg_code_no_readme` at `:109`. Matches.
- Brief line 21 (python `yaml.safe_load` of `research-hub.yml`): prints `audit_ignore 0`. Matches.
- Brief line 22: `find projects side-projects -name DATA.md` in the hub prints nothing. Matches.
- Brief line 23: the brief's `grep -rln` (with `--exclude=local.yml`) prints the same 16 files. Matches.
- Brief line 24: `blockOf` is at `words.ts:32` and `blockHolds` at `:79`. Matches.

Differences:
- Brief line 18, `portfolio.ts:766-795`: measured `const scan = (` at `:768`, the primary at `:791`, the other hubs at `:796`, `muted` at `:798`. A small shift.
- Brief line 19, the section "Audit checks" of `config/options/behavior.yml` at `:7-23`: `read_limits` is at `:7`, `audit_ignore` at `:19`, and `focus.stale_lag_days` at `:24` is in the same section, which runs to `:28` (`context_window` at `:29`). The defaults lines `:8` and `:26` match.
- Brief line 20, `grep -n "routes/docs/audit" agents/guarded.md`: run from the worktree root this prints `agents/guarded.md: No such file or directory`. The file is `.scratch/migration/agents/guarded.md`, where the grep prints nothing (exit 1). The substance matches; the path is wrong.
- Item 2 and case 12, "A hub vocabulary still writing `standard` gets the finding any unknown flag gets": a hub cannot set `stages`.
  - `HUB_LIST` (`hub-names.ts:366-394`) has no `stages` row.
  - A workspace `settings:` takes only options entries (`workspace-layer.ts:224-252`).
  - The only file that can carry `standard` is oculus's own `config/catalogs/vocab.yml`. There the stage row is `z.strictObject` (`vocab.ts:74`), so the finding is `shape_unknown`.
  - The premise is wrong as stated.
- Item 1, "so the Settings view and the editor's schema of the hub's `.oculus/config.yml` read it as the other hub keys are read": not checked by the brief, and the tree does not support it as written.
  - Both readers match a hub key to exactly one option entry: `rows.ts:376-384` and `groups.ts:324-326` use `listed.includes(key)`, and `engine.ts:138-149` uses `ofFile[key]`.
  - The options vocabulary has no control for a map with fixed keys of different shapes. The options catalog's head comment says "An option is a leaf of a config file: a scalar, a null, or a list". `CONTROLS` (`catalog-words.ts:9-25`) has no map control. An entry with `fields` is a family: "a map whose keys are names the data or the reader chooses".
  - So one `HUB_LIST` row `audit` cannot be described with its four keys. Dotted rows (`audit.required_files` and the rest), as `lint.writing_skip` is written, would not be the single row `audit` that item 1 dictates.
- Read list item 3, `hub-names.ts:340-380` for `HUB_LIST`: the list runs `:366-394`, so this range cuts off its last 14 rows.

Findings:
- The four differences above: the `portfolio.ts` and options line numbers, the `guarded.md` path, the hub-vocabulary `standard` premise, and the unchecked claim about the Settings view and schema.
- The `HUB_LIST` read range.

## 4. Cases and checks

- Case 1:
  - Inconsistent wording: "a project at `nascent` ..., at `published` under `projects/active`" puts one project at two stages. It should name two projects, or the same project before and after a stage change.
  - Otherwise consistent.
- Cases 2, 4, 5, 6, 7, 8 and 9: consistent with the rules file. Two notes:
  - Case 4 needs a `project.yml` on disk, since the key is read "as written". The test fixture today passes `datasetIds` on a `fixtureProject` (`audit.test.ts:79-90`) with no manifest file. The case does not say that the row plants the manifest.
  - Case 6: "Its file not YAML" should be "a text that does not parse as YAML". Most text parses as a plain scalar, and a scalar gives no finding.
- Case 3: ambiguous. "gives the finding with the repository's `root`" does not say which field.
  - The finding's `scope` is the repository key (`scopeOf`, `rules.ts:292-294`).
  - Its `root` field is the hub's, because `fileIn` returns no `root` for a missing file (`rules.ts:332-341`) and the collector falls back to the hub (`rules.ts:274`). The existing test checks `scope` (`audit.test.ts:103`).
- Case 10: inconsistent. "with any `audit:`" cannot hold. An `audit:` naming `IDEA.md` in `required_files`, or a `required_files` row with `folder: paper` whose file is missing, does give a finding about one of them.
- Case 11: a config-channel finding. It is listed as a row of G125's tables in `tests/routes/docs/audit.test.ts`, but `auditFindings` does not produce config-channel findings. Its unit, the `audit:` reader, is not on G125's Code line.
  - This breaks the rules file's "What every package obeys", which says an entry keeps one test per unit "its text and its Code line name".
  - Its expected dotted key is not given: `audit.required_files.0` or `audit.required_files.0.file`, and whether `website` lacking three keys is one finding or three.
- Case 12:
  - The second part names an input that cannot exist (check 3).
  - The third part checks `workspace-layer.ts:226-238`, which the step does not change. The step's `HUB_LIST` row makes the behaviour, so the case is fair.
- Case 13: "or 'not verified' where the run would start the app" offers an exit the rules file does not need. `watchPortfolio` runs without a page (`tests/data/hubs/hubs-fixture.ts:21` imports it), so a case-run program can drive it.
- Case 14: consistent.
- The case list keeps "the personal-tier rows of today's first describe" (item 5) under G125. Those rows assert `todo`, `readability` and `publink` (`audit.test.ts:59-71`), and markers and readability are not conventions G125's text names. The rules file ("What every package obeys": a test exists only as the test of one entry) does not allow them under G125 as written.
- Item 5 says nothing about the second describe of `audit.test.ts` (`:74-111`). Its row for `msg_deposit_before_reproduction`, a check the step rewords and keeps, has no entry and is not said to go or stay.
- Z981 adds G125 in automode. The rules file's test rule says "A step that needs a new entry stops and asks Axel for it". Whether the automode ruling stands for Axel's is for the session.

Findings:
- Case 1 wording.
- Case 3 ambiguity.
- Case 6 wording.
- Case 10 cannot hold.
- Case 11: unit not on G125's Code line, and the expected key and finding count are unstated.
- Case 12's impossible input.
- Case 13's "not verified" exit.
- The personal-tier rows kept under an entry whose text does not cover them.
- The deposit row with no instruction.
- The Z981 versus test-rule wording.

## 5. The question

Could each pass without the goal being reached?

Cases:
- Case 1: no on its own merits. It shows no convention applies without `audit:`.
- Case 2: yes. A check hard-wired to `README.md` and `not_flags: [terminal]` that switches on whenever `required_files` is non-empty would pass. No row uses another file with `stages`, `words` or `flags`; no row names neither key, which the brief says requires the file of every project; and no row names both `stages` and `folder`, the AND rule.
- Case 3: no.
- Case 4: yes. A reader mapping the key `datasets` to `project.datasetIds` passes it. No row uses a dotted key (for example `code_availability.status`), a key that is not on the `Project` model, or a value that is a text, a number or `true`. The model has no raw manifest: `src/lib/data/model/model-entities.ts:331-430`.
- Case 5: yes. `kinds` is set to today's rows, so code that still reads `publication_kinds`, or keeps a built-in copy of the rows, gives the same results. Only case 14's absent key guards this, and a built-in copy beats that too. A row with a `kinds` that differs from today's rows would settle it.
- Case 6: no.
- Case 7: partly. A row at the `auditFindings` level with `primary: false` does not exercise `portfolio.ts:796` passing `other.portfolio.merged`, but that line exists today.
- Case 8: no for the rows given. A folder that only shares a prefix (`projects/archive/published-old/x`) is not tested, so a prefix-string match would pass.
- Case 9: no.
- Case 10: see check 4.
- Case 11: yes. No well-formed part sits beside the malformed ones, so "the rest of `audit:` still runs" is untested. Code that turns all of `audit:` off on any error passes.
- Case 12: no for its first part.
- Case 13: yes, through the "not verified" exit.
- Case 14: no.

The step line's check, `npm run test:quick`: yes. It passes on whatever tests the builder writes.

Items of "What to build":
- Item 1, the claim that the Settings view and the editor's schema read `audit`: yes. No case or check covers either reader.
- Item 1, the malformed-part findings for a hub other than the primary: yes. Case 11 does not say which hub.
- Item 2, `AUDIT_PATHS` covering the website feed and a folder row: yes, only case 13 (a README) touches it. As written, the item cannot reach the feed:
  - `AUDIT_PATHS` holds paths relative to a project folder, matched by last segments under a scan tier (`portfolio.ts:178-189,241-252`).
  - The feed path is relative to the hub. A feed outside every watched directory (case 5's `site/pubs.yml`) is in no `roleDirectories` entry (`portfolio.ts:304-317`).
- Item 3: the verify grep (item 3) does not include the other texts the brief changes or should change: "set the stage to `published`" (`audit.yml:73`), "re-push code/" (`:48`), "Tier conformance" (`:18`), "hub-private" and "PUBLIC" (`:72`). They can stay unchanged and the grep still passes.
- Item 4 and the decisions: judged by reading. No mechanical check is needed.

Findings: cases 2, 4, 5, 8 (prefix), 11 and 13; the Settings view and schema claim; the malformed findings for a non-primary hub; `AUDIT_PATHS` for the feed; the verify grep's missing phrases.

## 6. Implied inputs

Each of these is missing from "Cases"; the expected result it should have follows the input:
1. A malformed `audit:` in a hub other than the primary.
   - Expected: the finding names that hub's `.oculus/config.yml`.
   - Today `readOtherHub` (`src/lib/data/index.ts:545-566`) adds only `sourcesFindings`, and `READER_FINDINGS` runs for the primary alone (`portfolio.ts:672`).
2. A workspace with no primary hub (`primaryDir === null`, `portfolio.ts:683`).
   - Expected: each other hub is audited under its own `audit:`, and its malformed parts are still findings.
3. A required file under `code/` other than `README.md`, or the creation of the `code/` folder of a `folder: code` row.
   - Expected: the audit rebuilds, as item 2 says.
   - Today `relevant` drops every path with a `code` segment except `code/README.md` (`portfolio.ts:169,197-205`), and runs before `named` (`:547`, `:607`).
4. The website feed created, removed or edited, inside a scan tier or outside every watched directory.
   - Expected: the audit rebuilds.
   - The item names creation and removal only. Today an edit of the hub's feed (`side-projects/theaxec.github.io/_data/publications.yml`, from `.oculus/config.yml:30`) does not rebuild, since `audited` sees a tier-relative path.
5. A required file in a project read from a workspace repository, created or removed.
   - Today `roleDirectories` watches only `<repo>/.oculus` (`portfolio.ts:307`).
   - Expected: either a rebuild, or stated as not rebuilt.
6. A project with no `stage` under `stages: { not_flags: [terminal] }`.
   - `blockHolds` (`words.ts:79-93`) holds for an empty word list, so the README becomes required, where today `project.stage !== undefined` is needed (`projects.ts:300`).
   - Expected result to be stated. The hub has 0 such projects (python over the hub's manifests: `projects without stage 0`).
7. A `project.yml` that does not parse, or a repository project's `.oculus/project.yml`, read for `required_sections`.
   - Expected: no section finding, and the manifest error left to the manifest check.
8. A dotted key and non-list values in `required_sections`: `a.b`, a non-empty text, a number, `true`, `false`, a map.
   - Expected as decision 3 states: `false` and a map require nothing.
9. A `stage_folders` folder written with a trailing slash, and a project folder that only shares a prefix (`projects/archive/published-old/x`).
   - Expected: the slash is normalised and the prefix is not "under" the folder.
10. `website.kinds: []`.
    - Expected: either a shape finding, or every matched public project gets the wrong-section finding (`publications.ts:187-191` with `wanted = []`).
11. The Settings view and the editor's schema for a hub that sets `audit:` (check 3).
    - Expected: the Settings view shows the hub's value in the section "Audit checks", and the schema of `.oculus/config.yml` validates it.
12. The hub rewrite against the hub as it is (a read of the hub's manifests, read only).
    - Decision 2 adds a finding for `projects/manuscripts/raw-pls`, whose README has `## Data + reproduction` at `:37` and no line `## Data`.
    - Decision 4 adds one for `projects/coauthor/published/2025/pfl-ms-npj` (published, with datasets, no `## Data`).
    - The Z980 row `{ stages: { words: [published] }, folder: projects/archive/published }` gives 13 findings: 12 under `projects/coauthor/published/` and `projects/archive/phd/phd-thesis`. The old check skipped such tiers (`git show 36d7ee3e^:src/lib/server/content/audit/projects.ts:390-398`, `!finished`).
    - The report's "Hub rewrite" section says the rewrite "keeps the findings a hub held under today's code". It cannot, and the brief does not state these as the expected result.
13. Two hubs whose `website` names the same feed file.
    - Expected: an untracked-papers finding per hub, or one. Not stated. Low cost.

Findings: items 1 to 12 are missing from "Cases"; item 13 is low cost.

## 7. ADRs

- `ls docs/adr` prints `ls: docs/adr: No such file or directory`. `ls docs` prints `apps.md data-map.md diagrams HELP.md palette.md templates.md`. There are no records.

Findings: none.

## 8. Dictated text

The brief dictates one block, the G125 entry. Located with `grep -n "G125\. The audit holds\|Code: \`src/lib/server/content/audit/rules.ts\`\|Test: \`tests/routes/docs/audit.test.ts\`" agents/briefs/O63.md`, which prints `:55`, `:56` and `:57`. `LC_ALL=C grep -n '[^ -~]' agents/briefs/O63.md` prints nothing, exit 1. Elsewhere the brief quotes existing text (the `audit.yml` phrases) and one value (`audit: {}`), and that value holds.

- `:55`, "- G125. The audit holds a hub to the conventions its own `audit:` setting names, and to none it does not name: a file `required_files` requires at the stages or with the folder its row names, ...; a hub without `audit:` gets none of these findings, and a part of `audit:` that is not of its shape is a finding and is off."
  - It is ASCII and has no em dash and no 'not X but Y' construction.
  - Its content breaks "Verify before asserting" in the rules file's "The working rules that bind every package". "at the stages or with the folder" says OR, while item 1 says a row requires the file when every key it names holds, which is AND.
  - It leaves out the personal-tier skip and the repository exemption from `stage_folders`, which the rows kept under it test (check 4).
- `:56`, "Code: `src/lib/server/content/audit/rules.ts`, `projects.ts`, `publications.ts`."
  - This breaks the test rule in "What every package obeys" ("each ... config reader ... its text and its Code line name"). The reader of `audit:` that gives case 11's findings, and the watcher change of item 2, are not named.
- `:57`, "Test: `tests/routes/docs/audit.test.ts`, every row of each describe."
  - This breaks the test rule in "What every package obeys" ("`agents/guarded.md` names it there by file and title"). It names no describe title, where G124's Test line names each one.

Findings: `:55` (OR versus AND, and the scope the kept rows need), `:56` (Code line), `:57` (no titles).

## Declined to judge

- Whether automode ruling Z981 counts as the ruling the rules file's test rule asks of Axel: this is the session's call under its self-rule configuration.
- Whether `msg_too_long`'s "detail belongs in the prose docs" (`audit.yml:66`) and the `negative` flag's description "which stays in the hub" (`vocab.ts:109`) carry one hub's convention under ruling 300 (4). Ruling 300 (4) names the audit's finding texts, and that reading is the user's.
- Whether the config-channel finding of malformed `audit:` should come from a new data-layer reader registered in `PROBLEM_READERS` or from code in `portfolio.ts`. This is a design choice for the session; check 1 only shows that neither path is in the write list.

Agent usage: a036b1012be622036, claude-opus-5-5, 255390 tokens, 83 tool uses, 10 min 40 s

## Closed

The step stopped at this check on the findings of open item 318, and the brief was removed as the stop requires. Each other finding is closed by the change below, applied when /spec writes the brief again after the ruling.

- 1, the six hits made false (`vocab.yml:80`, `vocab.yml:208`, `vocab.ts:107`, `sources.yml:56`, `HELP.md:513`, `config-folder.test.ts:655`): each named in "What to build" item 4 with what it says after the step.
- 1, `portfolio.ts` at 880 lines: the audit's path rule moves out of `portfolio.ts` into `src/lib/server/content/audit/` (new files allowed there), so `portfolio.ts` does not grow; the watcher's reach is open item 318 (2).
- 1, the reader of `audit:` and its finding words: the audit's own reader in `src/lib/server/content/audit/` raises a part of `audit:` that is not of its shape as an audit finding of the hub, naming its `.oculus/config.yml` and the dotted key, with its words in `config/text/views/system/audit.yml`; it runs per hub with that hub's settings, so a hub other than the primary and a workspace with no primary are covered (implied inputs 1 and 2). No data-layer path is added.
- 2, `archive_outcome`, the outcome-folder check and the author-chip check: verify item 3's grep gains `archive_outcome|folderStage|msg_projects_published|author_chips`.
- 2, the `docs/HELP.md` bullet: "What to build" item 4 asks for a bullet on how a hub sets `audit:` (HELP.md is in the paths).
- 3, line numbers: corrected (`portfolio.ts:768-798`, options "Audit checks" `:7-28`, `HUB_LIST` `:366-394`, the guarded.md path `.scratch/migration/agents/guarded.md`).
- 3, the `standard` flag in a hub vocabulary: corrected: a hub sets no `stages`; `standard` left in oculus's own `vocab.yml` gives `shape_unknown`; case 12's first part reworded.
- 3, the Settings view and the schema: open item 318 (1).
- 4, case 1: two projects. Case 3: the finding's `scope` is the repository's key. Case 6: "a text that does not parse as YAML". Case 10: "with an `audit:` that names neither file". Case 11: the reader of `audit:` on G125's Code line, the dotted key to the field (`audit.required_files.0.file`), one finding per missing key, and a well-formed part beside the malformed ones still running. Case 13: run through `watchPortfolio` in a case-run program, no "not verified" exit.
- 4, the personal-tier rows and the deposit row of `audit.test.ts`: G125's text names the personal-tier skip; the markers, readability and deposit rows stay in `audit.test.ts` under G125 only if G125's text covers them, else they are deleted with the report naming each; the brief says which.
- 4, Z981 and the test rule: Z981 is the automode closing of that question; no change.
- 5, case 2: rows with another file, a row naming neither key, and a row naming both `stages` and `folder`. Case 4: a dotted key, a text, a number and `true`, with the manifest planted on disk. Case 5: a `kinds` that differs from today's rows. Case 8: a folder sharing a prefix (`published-old`) is not under it.
- 5, verify item 3: gains the phrases "set the stage to `published`", "re-push code/", "Tier conformance", "hub-private" and "PUBLIC".
- 6, implied inputs 6 to 10 and 13: cases with the expected results the check gives (a project with no stage held to `not_flags` blocks as `blockHolds` holds them, a manifest that does not parse giving no section finding, `false` and a map requiring nothing, a trailing slash normalised, `kinds: []` a shape finding, two hubs naming one feed each audited on its own).
- 6, implied inputs 3 to 5 (the watcher): open item 318 (2).
- 6, implied input 12 (the hub rewrite): open item 318 (3).
- 8, G125's text: AND for a row naming both keys, the personal-tier skip and the repository exemption named; its Code line names the reader of `audit:`; its Test line names each describe by title.
