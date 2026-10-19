NOT done: (1) pdebench's `url` source (the five DaRUS files with md5 from PDEBench's `pdebench_data_urls.csv`) is not written; the entry has `retrieval: []`, so it has no Recover control. Blocked: the addresses and checksums are not in the tree (`grep -rln "darus\|pdebench_data_urls" projects tools/oculus/.scratch/migration/agents` finds only `O38-recover.md` and the D73 report, neither with the file addresses) and the step may call no live web API. (2) pbc-cirrhosis is written as `library` (`ucimlrepo.fetch_ucirepo(id=878)`) in place of the table's `url` of the UCI download, whose address is not in the tree either. (3) The Recover view and the Login node section poll while a run goes, as the brief says, which contradicts DESIGN.md:592 "Live data"; DESIGN is not amended and the clash waits for a ruling (open item A below). (4) The `holds: lists` catalog shape is left as it is, waiting for a ruling (open item D). (5) Part 14's "The options catalog gets each new flag and list with its help" is met for the new lists of `config/behavior.yml` (`focus.ticker_sources`, `focus.ticker_categories`, `focus.applications_open`, `focus.education_open`, `focus.applications_sent` have entries in `config/catalogs/options.yml`) and not for the flags of `config/catalogs/vocab.yml` or its list `publication_kinds`: `grep -c` of `lead_closed`, `submit_ready`, `publication_kinds` in options.yml gives 0. Their help is the header comment of vocab.yml (33 lines `^# - \``) and their keys are declared in `src/lib/data/shapes/catalog-files.ts:41-96`. The options catalog describes only appearance.yml, behavior.yml, layout.yml, present.yml, sources.yml and local.yml (options.yml:6), and its writes take only those files (`server/edit/writes/config/config-value.ts:5-7`), so giving vocab.yml entries makes Settings list and write the vocabularies, a user-visible shape nothing names (open item H). Everything else in the brief is built.

## Open items of the state file, verbatim

From the worktree's `tools/oculus/.scratch/migration/orchestrator-state.md:159-168` (`sed -n 155,170p`):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The section holds no entry. The open items this step raises:

- A. Rule clash: Part 2 items 6 and 8 say the Recover view polls its run and the Login node section polls while open; DESIGN.md:592 "Live data" says the page polls nothing ("no repeating timer of the page asks the server for anything"). Built as the brief says: `Recover.svelte:97` and `Login.svelte:60` call `setInterval` with `POLL_MS = 3000` (`state/system/machine/recover.svelte.ts:21`). Options: (a) keep the page polling and add the exception to DESIGN with its reason; (b) the server watches the runs and pushes a `recover` channel on the WebSocket, so one ssh per interval serves every window. Recommendation (b): two windows on the Login node section today double the ssh commands on the login node, and (b) fits the DESIGN decision. The lazy option is (a).
- B. A user-visible config form: a `from:` source written `vocab.<key>.<field>` (for example `from: vocab.statuses.chip` in `config/schemas/manifest-schema.yml`) offers the keys of the map whose row carries that field as `true`. Ruling 175 (b) asked for the behaviour; the written form is new and nothing names it. Recommendation: keep it as built.
- C. A user-visible registry field: a `url` source's `urls` rows take an optional `name` (the file name to save as), used by the nine cellxgene sets, whose `.h5ad` addresses end in an id and not in the file name the readers expect (`cellxgene-lupus/lupus.h5ad`). Recommendation: keep it.
- D. After `boards` replaced `tab_rollup`, no shipped options entry is a map of lists of records (`holds: lists` with record fields), yet the shape is still supported by `catalogOf`, `config-fit.ts` (`shapeProblem`, `itemsOf`), `schemas/options.ts`, the references walk, `draft.ts`'s `rollup` form, `slots.ts`, `Editor.svelte` and `Rollup.svelte` (111 lines). Options: (a) remove the shape (the catalog refuses `holds: lists` except on a key/value family; the rollup form and `Rollup.svelte` deleted); (b) keep it with no shipped entry. Recommendation (a): no entry uses it. The lazy option is (b). Not done, since it changes the options catalog's vocabulary.
- E. Done, reported as visible (Part 12's rule applied to a place the brief did not name): `ui.svelte.ts` no longer reads the saved envelope of version 1 nor the older field `unicode`. A browser whose saved envelope is version 1 starts at the defaults with no instance records; one holding `unicode` and no `icons` starts with icons off. Every save since version 2 writes version 2 with `icons`. Whether Axel's browser still holds a version 1 envelope is not verified (no browser storage is read from here).
- F. Process deviations, for the record:
  - Two edits were made with `sed -i` (a shell edit) instead of the editing tools: the `OWN` rename in `src/lib/data/helpers/keys/oculus/desktop-keys.ts` (checked after by `grep` and svelte-check), and one edit of a temporary probe test that was removed after its run.
  - The first run of case 14 (10:31, before any change) ran `tests/data/real-hub.probe.ts` whole with the real HOME: it read 8 session records under `~/.claude` and ran the probe's git commands in the base copy and the worktree. Its rerun used `HOME=$TMPDIR/o38-home` and a copy of the probe's lines 1-102 without the session and git parts.
  - After the context compaction of this run I read my own saved tool output at `~/.claude/projects/.../tool-results/bj1k0w3a5.txt` (the content of my notes file) and ran an `ls` and a failed `grep` (it errored before matching) on the session transcript under `~/.claude/projects`. Both touched `~/.claude`.
  - `npm run test:quick` (the brief's verify command) runs git itself to find the changed files (`tests/tiers/quick.mjs`).
  - `sh utils/unused-exports.sh` loads oculus's config, and the base copy's recorded output (`O38-base/unused-exports.txt`, made before this step) shows it reading `/Users/axelfaes/workspace/research-hub/.oculus/local.yml` of the main checkout ("ignoring unknown key(s) downloads"). Whether my runs of it in the worktree read that file is not verified; they printed no such line. I never opened, printed or grepped a `local.yml`.
- G. User-visible config vocabulary that the brief does not name. Part 14 says "every other place you find that decides by such a word written another way" moves to a flag, and the places found need flags Part 14 does not list. Each is in `config/catalogs/vocab.yml` (line numbers from `grep -nE "\b<flag>:"`; `grep -c` of each in the brief and in the base's vocab.yml gives 0 unless noted):
  - `statuses`: `submit_ready` on submit-ready (:98), `new_idea` on nascent (:119), `default_task` on todo (:143), `lead_declined` on declined and dismissed (:154, :170), `default_application` on "not applied" (:156), `lead_applied` on applied (:167). `deadline_met` (:99, :138, :139) and `live_subtasks` (:146) are on the base already.
  - `tiers` (:219-224): `main` on projects, `backlog` on projects and personal, `personal` on personal, `type_folders: [abandoned]` on coauthor, `outcome_folders` on archive. The brief's tiers bullet names `finished` and `software` only.
  - The hub's `.oculus/config.yml:72-75`: `in_flight` on the `career_host_status` rows awaiting and warm, read by `state/boards/career.ts:94` (the count of the career card's summary).
  Options: (a) keep the names as built; (b) Axel renames any of them. Recommendation (a): each name says what the code reads it for. Where the help is: every vocab.yml flag has its line in vocab.yml's header comment (`grep -c "^# - \`<flag>\`"` gives 1 for each of the eleven) and its key in the shape `src/lib/data/shapes/catalog-files.ts` (for example :52 `lead_declined`, :60 `submit_ready`, :87 `outcome_folders`); `in_flight` is described in the hub's `.oculus/config.yml:72` comment and declared at `catalog-files.ts:109`. None of them has a row in `config/catalogs/options.yml` (`grep -c` gives 0), and neither do the flags the brief names (`lead_closed` 0): vocab.yml is a catalog file read through its shape, and the options catalog lists the keys of the engine's settings files. Neither option is the lazy one; the decision is Axel's because it names config keys.
- H. Part 14 asks the options catalog to hold each new flag and list with its help. The flags and `publication_kinds` live in `config/catalogs/vocab.yml`, a file the options catalog does not describe (options.yml:6 lists appearance.yml, behavior.yml, layout.yml, present.yml, sources.yml and local.yml) and the Settings writes refuse (`config-value.ts:5-7`, "the file must be one of its tracked files"). Options: (a) add `vocab.yml` to the options catalog with `statuses`, `types` and `tiers` as family entries whose `fields` give each flag its help and a toggle, `publication_kinds` as a family of records, and `vocab.yml` added to the tracked files the Settings writes take, so Settings lists and edits the vocabularies under a heading; (b) keep the help in vocab.yml's header comment and the keys in the shape, with no Settings row. Recommendation (a): it is what Part 14 asks, and it lets a reader find and set a flag in Settings as every other config rule. The lazy option is (b). Not built, because (a) makes Settings show and write a catalog file, which nothing in the brief or DESIGN names.

## The cases' first run

The base copy is `.agents/worktrees/O38-base`; a scratch copy of its oculus at `$TMPDIR/o38-base/oculus` (node_modules linked to the worktree's, `server.fs.allow` added to its vite.config.ts) ran its tests. Temporary `o38tmp-` test copies were removed after each run. "After" is the run on the finished worktree.

| Case | First run on the base | After |
|---|---|---|
| 1 to 10 | The six test files (`sources`, `plan`, `safety`, `access`, `runs` under `tests/server/machine/runs/recover/`, and `tests/routes/machine/recover.test.ts`) copied into the base copy: `Test Files 6 failed (6)`, `Tests no tests`, each `Error: Cannot find module .../runs/recover/<file>.ts`. The kaggle-token rows (ruling 174 (a)) on the base: access `Cannot find module .../recover/access.ts`. | `npx vitest run tests/routes/machine/recover.test.ts tests/server/machine/runs/recover/ tests/routes/hubs/make.test.ts tests/data/sources/config/ tests/routes/hubs/machine-answer.test.ts tests/data/snapshot/normalise.test.ts tests/data/snapshot/schema-rules.test.ts tests/routes/edit/rail.test.ts tests/state/workbench/count-row.test.ts tests/shell/window/menu-answer.test.ts tests/server/desktop/menu-template.test.ts tests/state/system/apps/app-keys.test.ts --testTimeout 0`: `Test Files 24 passed (24)`, `Tests 530 passed (530)`. G111 sources, G112 plan, G113 safety, G114 access, G115 runs, G1 recover route. |
| 11 | By reading: `ls src/lib/server/machine/runs/` on the base prints `commands lint schedules seeds` (no `recover/`); `grep -n "^export" src/lib/server/machine/hpc/scratch.ts` prints `ScratchResult` and `scratchRule` only. | By reading `runs/recover/cluster.ts`: `WORK=/local/$SLURM_JOB_ID` at :319, the Node tarball checked by `sha256sum -c` against `SHASUMS256.txt` before it is unpacked at :348, `scratchText(script)` at :399 (`scratch.ts:124`, and `scratchRule` reads a file through it); the safety.test row "the $action job reads each file name as one word, and sbatch its script" asserts the script sent to `~/.oculus/recover/jobs/` and `sbatch --parsable research-hub-mitdb-<action>.sh` through the runner. |
| 12 | By reading `DatasetCard.svelte:94-104` on the base: the Recover control exists when `dataset.recover`, set by the hub's `recover_command`; method and notes come from the `retrieval` map. | By reading: `normalise-parts/retrieval.ts:125-142` sets `recover` only when the list is not empty, every source reads, and every kind is fetched; the card states a `library` call, a `request` contact or a `derived` source and script through `state/sources/registries/datasets.ts`. |
| 13 | `OCULUS_TEST_HUB=<base copy> npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0` in the scratch base: `Tests 4 failed / 10 passed (14)`; 25 findings, 24 of them "figure <name>.png is not in projects/.../present/" and one "deck folder deck is not in <base copy>": the base copy holds no image and no `deck/`. No finding names `registries/data.yml`. | `OCULUS_TEST_HUB=<worktree root> npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0`: `Test Files 1 passed (1)`, `Tests 14 passed (14)`, no skip. |
| 14 | First run (10:31) `$TMPDIR/probe-base-first.txt` and `probe-wt-first.txt`, see open item F. | Rerun (`$TMPDIR/c14-base.txt`, `c14-wt.txt`, HOME under `$TMPDIR`): equal counts for venues 72, pillars 9, domains 12, statements 2, people 19, organisations 8, resources 3, funding 11, events 7, education 22, applications 26, joint-work 10, tasks 0, literature 0; data 54 on the base and 63 on the worktree (the nine new entries). Neither a skip. Collection findings 0 on both. |
| 15 | `tests/routes/hubs/o38tmp-make.test.ts` in the base, `-t "hub files"`: `5 failed / 25 skipped`: every-file row "expected { status: 200, ... } to deeply equal" (the base writes no local.yml or schedules.yml); the local-unticked row the same; the local.yml-present row answers 200, not 409 `exists`. | make.test.ts passes within the 530 above. |
| 16 | The grep on the base copy: 1071 lines in 143 files (`$TMPDIR/case16-first.txt`, `case16-files.txt`). | The grep from the worktree root: 43 lines (`$TMPDIR/o38-c16-now.txt`): the 34 scout lines of `.oculus/data/academic/leads.yml`, `CLAUDE.md:56,60,72`, `funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:238,635,637,641`, `.agents/plan.yaml:12`, and `tools/oculus/DESIGN.md:61`. See section 7. |
| 17 | `grep -rn "rice-plain\|rice-sans"` over the base `src`: no line. | 12 rules under `body.rice:where(:not(.rice-plain))` and 20 under `body.rice:where(:not(.rice-sans))` (`grep -rn ... src \| wc -l`); the look at landing. |
| 18 | By reading the base `projects/manuscripts/bttn-incident-af/code/run_all.sh:55-69`: unzip into `$DATA/ptb-xl-raw`, then `rm -rf "$DATA/ptb-xl"` and a symlink; the zip's top folder is `ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/` (:58,:62). | By reading the new block (:54-87): the zip is `$DATA/ptb-xl/$P.zip`; `ptbxl_database.csv` and `records100/` are extracted into `$DATA/ptb-xl` with `$P/` stripped, the database last; no `ptb-xl-raw`, no link, no `rm -rf`. |
| 19 | `local.test.ts` rows in an o38tmp copy: `Tests 2 failed / 26 passed (28)` ("AssertionError: expected [] to strictly equal [ 'downloads[0].service: row', ...(2) ]"); the ruling 174 rows: 3 failed ("Cannot read properties of undefined (reading 'map')"). | Passes within the 530 above. |
| 20 | The machine-answer row on the base: `Error: text key not in config: server.machine_default.secret_set`, `Tests 1 failed / 2 passed (3)`. | Passes within the 530 above. |
| 21 | By reading the base `hub-names.ts:234-237`: `makeOffer` answers `{ hub, project }` only, and `~/.oculus` is offered both make items. The base run of the new `markedBy` rows: 4 failed ("expected null to be 'a'", "expected null to be ''"); `a/.git/index` passed (null on both). | A temporary run (removed): `home/.oculus` and `home/.oculus/notes`: hub, project, git, repository all false; `ws/plain`: git true, repository false; `ws/r` (all four files): repository false, there `settings,commands,launch,cpp`; `ws/s` (commands.yml only): repository true, there `commands`. |
| 22 | The make route on the base with `action: 'git'`: 400 (unknown action). | make.test.ts rows pass within the 530 above; `.git/HEAD` is a file after the make. |
| 23 | By reading: `commands.yml` `commands:` null and `launch.yml` `configurations:` null give no item and no finding (`server/machine/runs/commands/files.ts:334-337`); `cpp.yml` null `configurations:` gives none (`lsp/adapters/clangd/cpp-file.ts`); `settings.yml` null `languages:` reads no language (`data/sources/config/editor-options.ts`, `parseRepoSettings`). | Unchanged readers; the templates are commented out (`docs/templates.md`). |
| 24 | On the base, `grep -c "^  - key:"` = 54 and every `retrieval:` (54) is followed by `method:` (map form); `normalise.ts:353` reads it with `mapShape.safeParse`, which drops a list. | 63 entries, each a typed list (section 9). By reading: a map written in place of the list reads as a record whose `method` is not declared and whose `kind` is missing (`schema/record.ts:10-11,174-185`), so the build reports it; not run as a test. |
| 25 | By reading the base: `config/layout.yml:281-285` `nav_live` rows joint-work, funding, education, tasks, no events; `rail-part.ts:9` `RAIL_COLLECTIONS ['funding','education','joint-work','tasks']`; `network/events.yml` 2 `status: upcoming` entries. The tab draws no count and the rail no part. Config rows: `tests/data/sources/config/counts.test.ts` on the base: `Cannot find module .../sections/counts.ts`. | counts.test.ts 9 rows pass (linkedin, zzz, funding days, inbox tab yes each a finding; the shipped `counts` none). Hub probe (`$TMPDIR/o38-hub-base.out`, `o38-hub-wt.out`): Talks & Events tab "2", title "2 upcoming", amber, rail part count 2 amber; Projects hover "active: 20 \| idea: 33" becomes "in progress: 20 \| idea: 33"; every other tab count and rail part equal. |
| 26 | By reading the base `EntryCard.svelte:334-338`: a meta value is plain text; `grep -rln LinkedText src` prints nothing; `src/lib/ui/display` holds 10 items. The 3MI events entry is not in the base (section 14). | By reading `ui/html.ts` (the address rule) and `LinkedText.svelte`; the look at landing. |
| 27 | o38tmp copies on the base: normalise row "AssertionError: expected [ 'twente' ] to deeply equal []"; schema rows: affiliation "+ affiliation is read as a one-entry affiliations list; write affiliations", theme_labels "+ theme_labels is not read; ...", program "+ key program is now pillar: ..."; `Tests 4 failed / 11 passed`. | Passes within the 530 above. |
| 28 | The picker probe (`formFields(shipped config)` `status.chips` choices) on the base: `Tests 1 passed (1)`, 33 words. The vocab malformed rows on the base: 4 failed / 4 passed. The rail rows on the base: rail.test (sources) "1 failed / 1 passed (2)"; routes rail.test "1 failed / 2 passed (3)". | The same picker probe on the worktree: passed with the same 33 words in order (probe removed); config-folder vocab rows and both rail tests pass. Hub probe: chips, colours, board columns, Focus career card and horizons equal. |
| 29 | By reading: `focus.ts:280`, `stats.ts:60`, `collection.ts:788` compare to the literal `blocked`; `vocab.yml` has no flag on statuses. Focus findings rows on the base: 4 failed ("expected [] to deeply equal [ 'focus' ]"). | Scratch hub probe: no hub `statuses`: blocked 1 (sparse-attention); hub `.oculus/config.yml` `statuses: { blocked: { blocked: true }, on-hold: { blocked: true } }`: blocked 2, no finding. The hub probe: identical Command Center lines, attention, refresh, lanes, waiting, behind, leads, and badges; audit 1 to 0 (the ISLES 2024 `%VERIFY` source of the base `registries/data.yml:433`, which the rewritten isles24 entry replaces with its Zenodo record); projects 97 to 113 and map nodes 63 to 79 because the base copy holds no `side-projects/`; findings 25 to 0 because the base copy holds no `deck/` or present figures. |
| 30 | o38tmp copy of config-folder.test.ts with 3 rows, `OCULUS_TEST_HUB=<base>`: `Tests 3 failed / 25 skipped (28)`: ".oculus/config.yml has no schema", ".oculus/bookmarks.yml has no schema", ".oculus/workspaces/scratch.yml has no schema"; wallpaperz "expected [ ...(3) ] to have a length of 1 but got 3". | config-folder.test.ts and schema-rules.test.ts with `OCULUS_TEST_HUB=<worktree>`: 2 files, 45 passed, the real-hub row included; `tests/checks` 19 files 331 passed today. Show Suggestions listing the keys is the look's. |
| 31 | By reading: `grep -rn "triggerSuggest\|suggest" src` outside lsp finds only SuggestInput, TextBoxMenu and editor comments; no Show Suggestions action; `grep -n "suggest\|details" state/workbench/ui.svelte.ts` prints nothing. | By reading `ui/controls/editor/keys/suggest.ts` (menu item through Monaco's menu registry with the action's own precondition, palette listing with its key) and `Editor.svelte`; the look at landing. No guarded entry covers it, so no test is kept. |
| 32 | By reading: `KeySheet.svelte` and `key-rows.ts` parse `app.keys.rows` and `desktop.keys.rows` (Workbench.svelte:340-341, :412); `palette.ts:591` `help` is `available: false`; `views/system/help/` holds Help.svelte only; no `:keys`. menu-answer row on the base: "expected [ [ 'act', { kind: 'sheet' } ] ] to deeply equal [ [ 'openView', 'keys' ] ]"; menu-template row 1 failed. | A temporary probe (removed): macOS browser 30 rows, workbench 103, LaTeX 27, debug 7; macOS app plus 20 desktop rows; Linux app 16 desktop rows. A search for "keyboard" lists the Help rail row and `:keys`. Monaco's `editor.action.commentLine` (comment.js:59-64, CtrlCmd+Slash) is read, not run (it needs a browser): the look's. `grep -rn "app.keys.rows\|desktop.keys.rows"` hits only the untracked old builds `build-app/` and `.svelte-kit-app/`. |
| 33 | By reading: `palette-modes.ts` has no theme, file-icons, tab or goto list; `palette.ts:510` hint lists the themes inline (`'<{0}>'`); `argumentRefusal` (`palette.ts:429-442`) refuses on Enter. | A temporary client probe (removed): `:theme ` 49 rows, light marked, the selection starting on it; `:theme dar` 9 rows; `:theme nosuch` 0 rows and "No theme is named nosuch."; `:file-icons ` 1 row, Seti marked; `:tab ` 3 rows; `:goto ` 13 demo projects, the tab's project marked and selected; `:goto nosuch` "No project has the id nosuch."; previewing dark draws dark and Esc draws the chosen light. |
| 34 | By reading: `grep -rn "suggest_details\|suggest" config/behavior.yml config/catalogs/options.yml` finds no `suggest_details` key; the panel starts as Monaco's in-memory default. | `config/behavior.yml:121` `suggest_details: true` under `editor:`, `options.yml:486` `editor.suggest_details` (toggle, default true); `tests/checks` passes (the shipped files have no finding and the catalog key has a reader). The panel's start and the reader's choice are the look's. |
| 35 | The look's. | The unit runs that reach cases 30 to 34: config-folder.test.ts and schema-rules.test.ts (30), menu-answer.test.ts, menu-template.test.ts, app-keys.test.ts and keys.test.ts (32), the two probes of 32 and 33 above, `tests/checks` (34). |

## DONE / NOT DONE

The checks named here, all run today on the finished worktree unless a time says otherwise:

- K1 `ls -d` of every deleted path: each prints "No such file or directory" (`tools/cockpit`, `tools/present`, `tools/data`, `tools/deposit`, the three skill folders, the six links, `registries`, `feeds`, `tasks`, `funding/funding.yml`, `applications/applications.yml`, `education/education.yml`, `network/events.yml`, `network/joint-work.yml`, `tools/oculus/utils/migrations/migrate-joint-work.mjs`).
- K2 the case 16 grep: 43 lines, listed in section 7.
- K3 `LC_ALL=C grep -c '[^ -~]' .agents/skills/project-cleanup/SKILL.md`: `0`.
- K4 the 24-file vitest run of section 3: `Test Files 24 passed (24)`, `Tests 530 passed (530)`.
- K5 `OCULUS_TEST_HUB=<worktree root> npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0`: `Tests 14 passed (14)`, no skip.
- K6 `OCULUS_TEST_HUB=<worktree root> npx vitest run tests/checks --testTimeout 0`: `Test Files 19 passed (19)`, `Tests 331 passed (331)`.
- K7 `npm run diagrams && npm run test:quick`, third run (`$TMPDIR/o38-quick3.txt`): `ok ASCII gate`, `ok prettier: All matched files use Prettier code style!`, `ok svelte-kit sync`, `ok svelte-check: ... 525 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint`, `ok vitest`, `test:quick: 117.1 s (limit 45.0 s); every command passed`. It does not cover tests outside its selection, `tests/checks`, the slow tests, the build, or lint of unchanged files.
- K8 `sh utils/folder-check.sh`: exit 0.
- K9 `sh utils/unused-exports.sh` against `O38-base/unused-exports.txt` (section 12 lists the diff).
- K10 the guarded tests (135 files from `$TMPDIR/o38-guarded.txt`, G1, G8, G9, G13, G14, G28, G30, G32, G35, G49, G79, G85, G111 to G115) with `OCULUS_TEST_HUB=<worktree root>` at 18:41: `Test Files 135 passed (135)`, `Tests 1688 passed (1688)`. After it only prettier's formatting of five files changed; K7 ran after that.
- K11 the grep of each old name (section 13).

| Part, item | State | Check and output |
|---|---|---|
| 1.1 tools, skills and links deleted | DONE | K1 |
| 1.2 O38-paths.md items 12, 14 to 24; SKILL.md to ASCII and unwrapped; the seven `.depositignore` comments; about-axel README and HTML | DONE | K3; section 8 lists each line. The `.depositignore` comments rewritten are fourteen: the seven naming `tools/deposit/deposit.py`, which the sweep holds (ms-lipid-handshake, jacobian-coupled-blockterm-dp, dongho-ecg-clustering, dries-bttr-ecg, fed-multicellular-immune, hccnet-revision, meseret-cirrhosis), and seven saying `deposit.py` alone, which the sweep's pattern misses (btfno, bttd-source-eeg, bttn-incident-af, covert-applied, covert-theory, raw-pls, ward-bttr-crosssubject); those seven are outside the path list (section 5) |
| 1.3 every other sweep line naming a deleted tool | DONE | K2 |
| 1.4 the session's lines | Not touched | `CLAUDE.md:56,60,72` and `.agents/plan.yaml:12` unchanged (K2) |
| 2.1 registry rewritten, 54 entries plus new ones | DONE except pdebench and pbc-cirrhosis (first line) | 63 entries, kinds in section 9 (`awk` over `.oculus/data/research/data.yml`); K5 |
| 2.2 one parser, `path`, `notes`, `recover` | DONE | `normalise-parts/retrieval.ts:130-142`; `grep -rnw hpcPath\|hpc_path` over src, tests, config, docs, HELP.md, DESIGN.md, README.md: 0 (K11); `docs/apps.md:377` rewritten |
| 2.3 `downloads:` in `local.yml`, kaggle-token | DONE | local.test.ts rows and machine-answer rows (K4); `docs/templates.md:213` the commented block |
| 2.4 server `runs/recover/` | DONE | K4 (G111 to G115); folder holds 10 items (`access.ts cluster.ts files.ts local.ts log.ts plan.ts routes.ts sources unpack.ts verify.ts`), K8 |
| 2.5 route, `CLOSED_WRITES` | DONE | recover.test.ts (G1) in K4; `apps.ts:175` `'recover'` |
| 2.6 state store | DONE | `state/system/machine/recover.svelte.ts` (268 lines); polling is open item A |
| 2.7 view | DONE | `views/sources/data/recover/` five components; the look |
| 2.8 Login node section | DONE | `views/system/machine/hpc/Login.svelte`; polling is open item A |
| 2.9 text | DONE | `config/text/views/sources/data.yml` +114, `hpc.yml` +14; `grep -rnw intro_no_recover\|intro_recover\|recover_failed\|recover_tip`: 0 (K11) |
| 2.10 old Recover path deleted | DONE | K11: `recover_command`, `recoverDataset`, `recoverCommand`, `RECOVER_KEY`, `recoverFindings`, `recoverCommandOf`, `recover_command_key` 0 each; `recoverable` 2, both the English word in comments (`saved.ts:215`, `parse.ts:2`); terminal.test.ts describe removed (section 12) |
| 2.11 docs | DONE | DESIGN.md:698, :741, :767 (new decision), HELP.md:284-291, templates.md data.yml block, data-map.md, apps.md:377 (section 13) |
| 2.12 `7z-wasm@1.2.0` | DONE | `package.json:81` `"7z-wasm": "1.2.0",`; package-lock.json +25 |
| 3.1 files moved | DONE | K1; `diff -u` of each moved file against its base path: venues, literature, radar, applications, funding, education, tasks, events, domains identical; statements, resources, leads, people, organisations, pillars 1 line each, career 2, joint-work 3 (section 8); data.yml rewritten (Part 2) |
| 3.2 defaults held once | DONE | `config/sources.yml` the one table; `REGISTRY_FILES` and `CAREER_FILE` remain only as test-local constants derived from `engineDefaults()` (`registries.test.ts:14`, `career.test.ts:14`); `LITERATURE_FILE` 0 (K11) |
| 3.3 hub config loses `collections:` and `career_file` | DONE | section 8, `.oculus/config.yml` |
| 3.4 a missing default file of a hub with `.oculus/data/` is a finding | DONE | By reading `data/index.ts:354-363` (`heldUnnamed`: a hub naming no list that holds `.oculus/data/` counts every file of the list as named) and the comment at `model/index.ts:135-139`. No test row holds it: no case asks for one, and K5 shows the real hub, which holds every file, with no finding |
| 3.5 every other sweep line naming an old path | DONE | K2 |
| 3.6 fixtures take the new layout | DONE | `tests/fixtures/hubs/demo/.oculus/data/**` (section 5); K10 |
| 3.7 `migrate-joint-work.mjs` deleted | DONE | K1 |
| 4.1 to 4.5 gathered sets' readers | DONE | section 8 rows; K2 (no `data/archive`, `ptb-xl-raw`, `PED_unzip`) |
| 5 derived sets | DONE | section 9 |
| 6.1, 6.2 Brackets and Monospace | DONE | 12 rice-plain rules, 20 rice-sans rules (`grep -rn "body.rice:where(:not(.rice-plain))" src \| wc -l` = 12, rice-sans = 20) |
| 6.3 body classes through `applyTheme` | DONE | `theme.ts:41-57,109-126`; `drawSavedTheme` passes both toggles on |
| 6.4 the 94 rules placed | DONE | section 6 |
| 6.5 `BROWSER_NAMES` | DONE | `browser.ts:31-32` `'brackets'`, `'monospace'` after `icons` |
| 7 the session's work | Not touched | K2 |
| 8.1 to 8.6 make items | DONE | make.test.ts (G9) in K4; case 21 run |
| 9 no secret drawn | DONE | machine-answer.test.ts rows (K4) |
| 10.1 to 10.7 `counts` | DONE | counts.test.ts, count-row.test.ts (K4); hub probe of case 25 |
| 11 addresses as links | DONE | Part 11 component list in section 10; the look |
| 12 no older stored form | DONE | K11: `affiliation_retired`, `theme_labels_retired`, `key_renamed`, `RETIRED_KEYS`, `RENAMED_FIELDS` 0; `utils/migrations/rename-program-to-pillar.ts` deleted (outside the list, section 5); vocab.yml comments rewritten |
| 13.1 `statuses` | DONE | `vocab.yml:97`; `grep -c "chip: true"` = 33; K11 `status_legend`, `status_palette`, `waiting_status`, `ACKNOWLEDGED` 0 |
| 13.2 `types`, `archive_order` | DONE | `vocab.yml:60`, `:208`; K11 `type_color`, `type_order`, `archive_dead`, `terminal_types`, `archive_outcomes`, `archive_categories` 0 |
| 13.3 rail `chord`, `group_glyph`; `nav_groups` only `float` | DONE | rail.test.ts rows (K4); config-folder.test.ts `Object.keys(config.nav_groups)` = `['float']` |
| 13.4 `boards` | DONE | `layout.yml:226`; boards.test.ts (K4); K11 `COLUMN_KEY`, `LABEL_KEY`, `project_label_mode`, `archive_label_mode` 0 |
| 13.5 hub words | DONE | `.oculus/config.yml` (section 8); demo hub config |
| 13.6 `focus:` | DONE | `behavior.yml:31`; `deadline_horizon_days` hits are `behavior.yml:42` under `focus:`, `options.yml:231` `focus.deadline_horizon_days`, `ticker.ts:151` reading it through the focus block |
| 14 words decided in config | DONE except the options catalog rows of the vocab.yml flags (first line (5), open item H) | `grep -c` in `vocab.yml`: `lead_closed` 5, `pauses_countdown` 2, `blocked: true` 1, `published: true` 1, `default_lead` 2, `live: true` 1, `on_map` 3, `placed: true` 2, `standard: true` 2, `idea: true` 2, `public: true` 3, `negative: true` 2, `dead_end` 3, `finished: true` 2, `software: true` 1 (each count includes the header comment line where one names the flag); `behavior.yml:53` `ticker_sources`, `:65` `applications_open`; K11 `LEAD_CLOSED`, `FLIGHT`, `ENTRY_CATEGORIES` 0 |
| 15.1 three schemas | DONE | case 30 rows (K6) |
| 15.2 Show Suggestions | DONE | `editor/keys/suggest.ts`; the look |
| 15.3 description panel, `editor.suggest_details` | DONE | `behavior.yml:121`, `options.yml:486`; K6 |
| 16.1 to 16.4 Keyboard Shortcuts view | DONE | case 32 probe; menu-answer, menu-template, app-keys, keys tests (K4, K6); K11 `KeySheet`, `key-rows`, `app.keys.rows`, `desktop.keys.rows`, `SHEET_CHARACTER` 0 |
| 17.1 to 17.3 palette lists | DONE | case 33 probe; `cmd_theme_hint` kept as the `:theme` hint word `<theme>` (section 10) |
| The verify list | DONE, 3 runs | K7 |

## Files, with line counts

### tools/oculus

From the diff of the base copy's `tools/oculus` against the worktree's (node_modules, build output and `.scratch` left out; `$TMPDIR/o38-oculus.patch`, its diffstat `$TMPDIR/o38-diffstat.txt`): `462 files changed, 18782 insertions(+), 6486 deletions(-)`. Each row: path under `tools/oculus/`, lines added and removed, and the file's length now (`wc -l`; "deleted" for a removed file). Every file is at or under 880 lines except `config/catalogs/options.yml` (1466, 1429 on the base), `docs/templates.md` (1278, 1185 on the base), the generated diagrams and `package-lock.json`.

```
DESIGN.md | +20 -16 | 767
HELP.md | +23 -13 | 533
config/behavior.yml | +35 -23 | 296
config/catalogs/glyphs.yml | +1 -0 | 285
config/catalogs/icons.yml | +1 -0 | 284
config/catalogs/options.yml | +175 -138 | 1466
config/catalogs/vocab.yml | +152 -123 | 268
config/layout.yml | +116 -82 | 335
config/schemas/manifest-schema.yml | +7 -6 | 88
config/sources.yml | +21 -24 | 97
config/text/app.yml | +5 -7 | 317
config/text/desktop.yml | +1 -3 | 88
config/text/findings.yml | +15 -5 | 356
config/text/server.yml | +1 -0 | 528
config/text/ui.yml | +4 -0 | 162
config/text/views/boards/person.yml | +1 -1 | 32
config/text/views/feeds/leads.yml | +1 -1 | 35
config/text/views/sources/data.yml | +114 -8 | 127
config/text/views/sources/files.yml | +42 -3 | 339
config/text/views/sources/source.yml | +1 -0 | 231
config/text/views/system/help.yml | +55 -1 | 62
config/text/views/system/machine/hpc.yml | +14 -0 | 95
config/text/views/system/workbench.yml | +15 -3 | 261
docs/apps.md | +2 -2 | 816
docs/data-map.md | +23 -24 | 209
docs/diagrams/channels.dot | +215 -213 | 316
docs/diagrams/channels.svg | +543 -531 | 1646
docs/diagrams/layer-data.dot | +10 -7 | 94
docs/diagrams/layer-data.svg | +134 -117 | 465
docs/diagrams/layer-server.dot | +6 -6 | 159
docs/diagrams/layer-server.svg | +6 -6 | 781
docs/diagrams/layer-shell.dot | +4 -4 | 164
docs/diagrams/layer-shell.svg | +4 -4 | 755
docs/diagrams/layer-state.dot | +9 -9 | 173
docs/diagrams/layer-state.svg | +9 -9 | 855
docs/diagrams/layer-ui.dot | +3 -3 | 143
docs/diagrams/layer-ui.svg | +3 -3 | 684
docs/diagrams/layer-views.dot | +22 -17 | 189
docs/diagrams/layer-views.svg | +316 -293 | 855
docs/diagrams/layers.dot | +12 -12 | 92
docs/diagrams/layers.svg | +43 -43 | 505
docs/diagrams/writes.dot | +10 -10 | 956
docs/diagrams/writes.svg | +25 -25 | 3021
docs/palette.md | +5 -2 | 201
docs/templates.md | +154 -61 | 1278
package-lock.json | +25 -0 | 10108
package.json | +1 -0 | 132
src/desktop/windows/menu-template.ts | +6 -5 | 347
src/lib/data/accounts/leads.ts | +42 -31 | 64
src/lib/data/helpers/editor/editor.ts | +2 -0 | 162
src/lib/data/helpers/files/apps/apps.ts | +1 -0 | 305
src/lib/data/helpers/guards.ts | +14 -0 | 122
src/lib/data/helpers/hub-names.ts | +84 -34 | 426
src/lib/data/helpers/keys/oculus/bindings.ts | +196 -0 | 196
src/lib/data/helpers/keys/oculus/desktop-keys.ts | +22 -8 | 172
src/lib/data/helpers/keys/oculus/editor-keys.ts | +28 -2 | 70
src/lib/data/helpers/keys/oculus/page-keys.ts | +10 -7 | 104
src/lib/data/helpers/keys/oculus/rail-letters.ts | +20 -6 | 40
src/lib/data/helpers/keys/oculus/resolve.ts | +4 -4 | 402
src/lib/data/index.ts | +67 -139 | 807
src/lib/data/model/index.ts | +24 -17 | 851
src/lib/data/model/model-collections.ts | +2 -2 | 232
src/lib/data/model/model-entities.ts | +169 -18 | 829
src/lib/data/shapes/catalog-files.ts | +75 -15 | 453
src/lib/data/shapes/catalog-words.ts | +2 -1 | 90
src/lib/data/shapes/shapes.ts | +1 -4 | 321
src/lib/data/shapes/vocab-keys.ts | +89 -6 | 108
src/lib/data/snapshot/indexing.ts | +1 -1 | 27
src/lib/data/snapshot/normalise-parts/career.ts | +3 -4 | 160
src/lib/data/snapshot/normalise-parts/retrieval.ts | +143 -0 | 143
src/lib/data/snapshot/normalise.ts | +6 -8 | 766
src/lib/data/snapshot/references/model.ts | +4 -1 | 105
src/lib/data/snapshot/references/scan.ts | +21 -4 | 326
src/lib/data/snapshot/schema/check.ts | +1 -16 | 395
src/lib/data/snapshot/schema/lists.ts | +24 -5 | 157
src/lib/data/snapshot/schema/record.ts | +9 -3 | 349
src/lib/data/snapshot/schema/run.ts | +30 -1 | 316
src/lib/data/snapshot/schema/static.ts | +3 -1 | 77
src/lib/data/snapshot/validate.ts | +9 -34 | 402
src/lib/data/sources/collections.ts | +47 -10 | 192
src/lib/data/sources/config.ts | +2 -0 | 97
src/lib/data/sources/config/catalog/options.ts | +27 -6 | 512
src/lib/data/sources/config/catalog/schemas/engine.ts | +48 -2 | 174
src/lib/data/sources/config/catalog/schemas/references.ts | +10 -7 | 122
src/lib/data/sources/config/catalogs.ts | +6 -4 | 361
src/lib/data/sources/config/editor-options.ts | +1 -0 | 231
src/lib/data/sources/config/local.ts | +92 -4 | 685
src/lib/data/sources/config/rail.ts | +77 -8 | 217
src/lib/data/sources/config/sections/boards.ts | +95 -0 | 95
src/lib/data/sources/config/sections/counts.ts | +115 -0 | 115
src/lib/data/sources/config/sections/focus.ts | +121 -0 | 121
src/lib/data/sources/config/settings.ts | +3 -14 | 878
src/lib/data/sources/documents/feeds.ts | +5 -2 | 193
src/lib/data/sources/documents/templates.ts | +18 -7 | 90
src/lib/data/sources/registries.ts | +30 -23 | 141
src/lib/server/content/audit/projects.ts | +23 -31 | 568
src/lib/server/content/audit/publications.ts | +32 -43 | 275
src/lib/server/content/audit/rules.ts | +95 -22 | 370
src/lib/server/content/docs.ts | +6 -10 | 852
src/lib/server/edit/entry-edit/host-status.ts | +2 -2 | 81
src/lib/server/edit/entry-edit/merge.ts | +1 -1 | 431
src/lib/server/edit/feeds/feeds.ts | +8 -2 | 848
src/lib/server/edit/writes.ts | +5 -4 | 773
src/lib/server/edit/writes/bodies.ts | +20 -6 | 638
src/lib/server/edit/writes/config/config-checks.ts | +6 -1 | 643
src/lib/server/edit/writes/config/lists/rail.ts | +11 -4 | 126
src/lib/server/edit/writes/hubs.ts | +2 -2 | 251
src/lib/server/edit/writes/manifest.ts | +17 -9 | 761
src/lib/server/edit/writes/subtasks.ts | +10 -10 | 385
src/lib/server/files/project/make.ts | +187 -72 | 389
src/lib/server/files/workspace/open.ts | +22 -1 | 275
src/lib/server/machine/hpc/host.ts | +1 -1 | 122
src/lib/server/machine/hpc/scratch.ts | +29 -6 | 168
src/lib/server/machine/lsp/adapters/markdown/own/backticks.ts | +3 -3 | 181
src/lib/server/machine/pty/routes.ts | +6 -65 | 516
src/lib/server/machine/runs/recover/access.ts | +93 -0 | 93
src/lib/server/machine/runs/recover/cluster.ts | +445 -0 | 445
src/lib/server/machine/runs/recover/files.ts | +246 -0 | 246
src/lib/server/machine/runs/recover/local.ts | +403 -0 | 403
src/lib/server/machine/runs/recover/log.ts | +42 -0 | 42
src/lib/server/machine/runs/recover/plan.ts | +252 -0 | 252
src/lib/server/machine/runs/recover/routes.ts | +425 -0 | 425
src/lib/server/machine/runs/recover/sources/dandi.ts | +85 -0 | 85
src/lib/server/machine/runs/recover/sources/figshare.ts | +92 -0 | 92
src/lib/server/machine/runs/recover/sources/geo.ts | +51 -0 | 51
src/lib/server/machine/runs/recover/sources/huggingface.ts | +93 -0 | 93
src/lib/server/machine/runs/recover/sources/physionet.ts | +77 -0 | 77
src/lib/server/machine/runs/recover/sources/stanford.ts | +64 -0 | 64
src/lib/server/machine/runs/recover/sources/tcia.ts | +44 -0 | 44
src/lib/server/machine/runs/recover/sources/tokened.ts | +188 -0 | 188
src/lib/server/machine/runs/recover/sources/url.ts | +44 -0 | 44
src/lib/server/machine/runs/recover/sources/zenodo.ts | +46 -0 | 46
src/lib/server/machine/runs/recover/unpack.ts | +133 -0 | 133
src/lib/server/machine/runs/recover/verify.ts | +139 -0 | 139
src/lib/server/root/context.ts | +4 -0 | 790
src/lib/server/root/live-settings.ts | +1 -1 | 275
src/lib/server/root/process/context/machine-defaults.ts | +6 -0 | 74
src/lib/server/root/process/context/machine-values.ts | +40 -17 | 111
src/lib/server/root/process/server-context.ts | +3 -0 | 193
src/lib/server/root/watch/own-schemas.ts | +5 -2 | 36
src/lib/server/root/watch/portfolio.ts | +17 -14 | 854
src/lib/shell/Workbench.svelte | +1 -24 | 449
src/lib/shell/keys/Palette.svelte | +47 -21 | 540
src/lib/shell/keys/lists/argument-list.svelte.ts | +111 -0 | 111
src/lib/shell/keys/lists/clone-list.svelte.ts | +62 -0 | 62
src/lib/shell/keys/palette-modes.ts | +91 -1 | 461
src/lib/shell/keys/rows/ArgumentRows.svelte | +92 -0 | 92
src/lib/shell/keys/rows/CloneRows.svelte | +1 -1 | 56
src/lib/shell/keys/rows/CommandRows.svelte | +30 -57 | 234
src/lib/shell/keys/rows/clone-list.svelte.ts | +0 -62 | deleted
src/lib/shell/keys/workbench-keys.svelte.ts | +7 -29 | 599
src/lib/shell/rail/RailPages.svelte | +10 -5 | 314
src/lib/shell/rail/rail.ts | +2 -2 | 159
src/lib/shell/window/appearance.svelte.ts | +13 -9 | 133
src/lib/shell/window/colon-effects.ts | +3 -1 | 104
src/lib/shell/window/menu-answer.ts | +6 -6 | 204
src/lib/state/boards/board/filter-menu.ts | +3 -2 | 129
src/lib/state/boards/board/index.ts | +3 -2 | 51
src/lib/state/boards/board/items.ts | +8 -5 | 209
src/lib/state/boards/board/presets.ts | +80 -93 | 397
src/lib/state/boards/board/state.ts | +1 -1 | 117
src/lib/state/boards/board/stats.ts | +17 -16 | 167
src/lib/state/boards/career.ts | +29 -8 | 106
src/lib/state/boards/collection.ts | +37 -29 | 841
src/lib/state/boards/focus-lanes.ts | +15 -9 | 244
src/lib/state/boards/focus.ts | +72 -34 | 410
src/lib/state/boards/structure/graph.ts | +29 -21 | 483
src/lib/state/boards/structure/lines.ts | +59 -29 | 219
src/lib/state/boards/ticker.ts | +104 -61 | 605
src/lib/state/client/context.ts | +10 -13 | 877
src/lib/state/client/selectors.svelte.ts | +11 -18 | 727
src/lib/state/client/shapes/client-state.ts | +3 -0 | 196
src/lib/state/client/writes.svelte.ts | +3 -3 | 836
src/lib/state/feeds/feeds.ts | +13 -11 | 136
src/lib/state/feeds/lead-application.ts | +12 -9 | 46
src/lib/state/feeds/leads.ts | +30 -23 | 201
src/lib/state/feeds/linkedin.ts | +12 -3 | 149
src/lib/state/forms/new-entry.ts | +11 -7 | 110
src/lib/state/forms/schema.ts | +17 -6 | 525
src/lib/state/sessions/source/write-files.ts | +2 -2 | 231
src/lib/state/sessions/terminals.svelte.ts | +0 -14 | 863
src/lib/state/shared/stores/shapes.ts | +2 -2 | 473
src/lib/state/shared/words/appearance.ts | +0 -13 | 538
src/lib/state/shared/words/tones.ts | +32 -24 | 277
src/lib/state/sources/explorer/view/place.ts | +6 -2 | 285
src/lib/state/sources/fs.ts | +4 -1 | 66
src/lib/state/sources/registries/datasets.ts | +29 -3 | 95
src/lib/state/sources/registries/venues.ts | +19 -9 | 179
src/lib/state/system/apps/shell/page-commands.ts | +26 -0 | 86
src/lib/state/system/apps/shell/shell.svelte.ts | +4 -1 | 470
src/lib/state/system/config/editors/draft.ts | +4 -2 | 726
src/lib/state/system/config/other-rows/browser.ts | +36 -12 | 218
src/lib/state/system/machine/recover-words.ts | +177 -0 | 177
src/lib/state/system/machine/recover.svelte.ts | +268 -0 | 268
src/lib/state/workbench/layout/tabs/close-hooks.ts | +172 -0 | 172
src/lib/state/workbench/navigation/catalogue.ts | +22 -7 | 381
src/lib/state/workbench/navigation/rail.ts | +16 -3 | 138
src/lib/state/workbench/navigation/registry.ts | +38 -13 | 294
src/lib/state/workbench/palette.ts | +19 -9 | 835
src/lib/state/workbench/rail-badges/rail-badges.svelte.ts | +91 -78 | 390
src/lib/state/workbench/rail-badges/rail-badges.ts | +51 -50 | 112
src/lib/state/workbench/ui.svelte.ts | +156 -220 | 814
src/lib/themes/themes.css | +12 -2 | 107
src/lib/ui/controls/Chip.svelte | +8 -6 | 196
src/lib/ui/controls/Tag.svelte | +5 -3 | 96
src/lib/ui/controls/ToolButton.svelte | +10 -7 | 511
src/lib/ui/controls/editor/Editor.svelte | +20 -5 | 534
src/lib/ui/controls/editor/keys/monaco-keys.ts | +85 -0 | 85
src/lib/ui/controls/editor/keys/suggest.ts | +117 -0 | 117
src/lib/ui/controls/editor/keys/tab-out.ts | +70 -0 | 70
src/lib/ui/controls/editor/kit/load.ts | +15 -2 | 694
src/lib/ui/controls/editor/tab-out.ts | +0 -70 | deleted
src/lib/ui/controls/editor/types.ts | +11 -0 | 162
src/lib/ui/display/CodeText.svelte | +0 -47 | deleted
src/lib/ui/display/text/CodeText.svelte | +56 -0 | 56
src/lib/ui/display/text/LinkedText.svelte | +44 -0 | 44
src/lib/ui/display/ticker/Ticker.svelte | +5 -1 | 279
src/lib/ui/frame/Empty.svelte | +5 -2 | 109
src/lib/ui/frame/Modal.svelte | +3 -3 | 204
src/lib/ui/frame/quiet-focus.ts | +1 -1 | 112
src/lib/ui/html.ts | +51 -3 | 711
src/lib/ui/menu/Tooltip.svelte | +7 -3 | 394
src/lib/ui/menu/keys/KeySheet.svelte | +0 -133 | deleted
src/lib/ui/menu/keys/key-rows.ts | +0 -13 | deleted
src/lib/ui/theme/app-theme.ts | +14 -9 | 173
src/lib/ui/theme/field.css | +4 -0 | 63
src/lib/ui/theme/theme.ts | +30 -5 | 156
src/lib/views/academic/slides/Slides.svelte | +1 -1 | 437
src/lib/views/boards/collection/Collection.svelte | +4 -4 | 506
src/lib/views/boards/collection/rail-part.ts | +9 -12 | 22
src/lib/views/boards/entry/Entry.svelte | +2 -2 | 364
src/lib/views/boards/focus/Band.svelte | +4 -2 | 293
src/lib/views/boards/focus/CommandCenter.svelte | +6 -11 | 249
src/lib/views/boards/focus/Focus.svelte | +2 -6 | 259
src/lib/views/boards/focus/career/CareerHosts.svelte | +10 -14 | 196
src/lib/views/boards/focus/career/CareerPanel.svelte | +11 -9 | 405
src/lib/views/boards/focus/lanes/LaneCard.svelte | +5 -1 | 225
src/lib/views/boards/focus/lanes/Lanes.svelte | +6 -5 | 334
src/lib/views/boards/person/Person.svelte | +5 -1 | 384
src/lib/views/boards/project/Project.svelte | +1 -1 | 209
src/lib/views/boards/projects/Projects.svelte | +25 -34 | 400
src/lib/views/boards/projects/Stats.svelte | +2 -2 | 82
src/lib/views/feeds/inbox/Inbox.svelte | +3 -3 | 276
src/lib/views/feeds/leads/Leads.svelte | +6 -3 | 322
src/lib/views/feeds/linkedin/PostCard.svelte | +4 -2 | 117
src/lib/views/personal/calendar/Calendar.svelte | +2 -1 | 433
src/lib/views/sessions/session-detail/ChangesRepository.svelte | +1 -1 | 216
src/lib/views/sessions/session-detail/DetailsBody.svelte | +1 -1 | 422
src/lib/views/sessions/session-detail/SessionDetail.svelte | +1 -1 | 203
src/lib/views/sessions/session-list/SessionList.svelte | +4 -4 | 453
src/lib/views/sessions/terminal/start/Composer.svelte | +4 -0 | 523
src/lib/views/sessions/timeline/Timeline.svelte | +1 -1 | 213
src/lib/views/sessions/transcript/Transcript.svelte | +1 -1 | 351
src/lib/views/shared/card/CardActions.svelte | +5 -19 | 210
src/lib/views/shared/card/card.ts | +32 -7 | 183
src/lib/views/shared/card/feed/LeadCard.svelte | +23 -18 | 279
src/lib/views/shared/card/feed/RadarCard.svelte | +5 -2 | 324
src/lib/views/shared/card/feed/lead-apply.ts | +8 -6 | 56
src/lib/views/shared/card/project/CardAddresses.svelte | +4 -2 | 58
src/lib/views/shared/card/project/CardDetails.svelte | +6 -5 | 188
src/lib/views/shared/card/project/CardLinks.svelte | +5 -3 | 195
src/lib/views/shared/card/project/ProjectCard.svelte | +13 -7 | 524
src/lib/views/shared/changes/CommitBox.svelte | +2 -1 | 310
src/lib/views/shared/explorer/tree/MakeHubDialog.svelte | +0 -129 | deleted
src/lib/views/shared/explorer/tree/Tree.svelte | +4 -4 | 527
src/lib/views/shared/explorer/tree/control/making.svelte.ts | +143 -64 | 260
src/lib/views/shared/explorer/tree/control/picks.svelte.ts | +7 -3 | 345
src/lib/views/shared/explorer/tree/make/MakeDialog.svelte | +118 -0 | 118
src/lib/views/shared/explorer/tree/make/MakeGroup.svelte | +112 -0 | 112
src/lib/views/shared/explorer/tree/make/make-words.ts | +96 -0 | 96
src/lib/views/shared/explorer/tree/menu/row-menu.ts | +19 -5 | 692
src/lib/views/shared/forms/Subtasks.svelte | +4 -1 | 298
src/lib/views/shared/forms/entry/EntryCard.svelte | +9 -6 | 523
src/lib/views/shared/forms/entry/entry-actions.ts | +1 -2 | 190
src/lib/views/shared/forms/registry/RegistryCard.svelte | +8 -35 | 90
src/lib/views/shared/forms/registry/record-card.svelte.ts | +78 -0 | 78
src/lib/views/shared/graph/node-tone.ts | +2 -2 | 14
src/lib/views/shared/links/CrossLinks.svelte | +2 -2 | 170
src/lib/views/shared/sessions/SteerBox.svelte | +4 -0 | 183
src/lib/views/sources/data/Data.svelte | +1 -4 | 149
src/lib/views/sources/data/DatasetCard.svelte | +61 -86 | 220
src/lib/views/sources/data/recover/Recover.svelte | +276 -0 | 276
src/lib/views/sources/data/recover/RecoverAccess.svelte | +66 -0 | 66
src/lib/views/sources/data/recover/RecoverLog.svelte | +44 -0 | 44
src/lib/views/sources/data/recover/RecoverPlan.svelte | +165 -0 | 165
src/lib/views/sources/data/recover/RecoverProgress.svelte | +78 -0 | 78
src/lib/views/sources/doc/Doc.svelte | +1 -1 | 320
src/lib/views/sources/files/MessageLine.svelte | +1 -1 | 91
src/lib/views/sources/repositories/Repositories.svelte | +4 -4 | 518
src/lib/views/sources/repositories/merge/Merge.svelte | +16 -9 | 319
src/lib/views/sources/search/Problems.svelte | +2 -2 | 447
src/lib/views/sources/source/Editor.svelte | +9 -2 | 392
src/lib/views/sources/source/latex/latex-tab.svelte.ts | +7 -15 | 450
src/lib/views/sources/venues/VenueCard.svelte | +7 -4 | 335
src/lib/views/sources/venues/Venues.svelte | +4 -4 | 216
src/lib/views/structure/domains/DomainCard.svelte | +9 -14 | 55
src/lib/views/structure/domains/Domains.svelte | +2 -2 | 104
src/lib/views/structure/map/Map.svelte | +3 -3 | 230
src/lib/views/structure/pillars/ArchivalCard.svelte | +2 -2 | 104
src/lib/views/structure/pillars/LineCard.svelte | +9 -14 | 130
src/lib/views/structure/pillars/Pillars.svelte | +7 -7 | 204
src/lib/views/system/audit/Audit.svelte | +4 -4 | 347
src/lib/views/system/findings/Findings.svelte | +2 -2 | 126
src/lib/views/system/help/Help.svelte | +4 -3 | 99
src/lib/views/system/help/keys/Keys.svelte | +187 -0 | 187
src/lib/views/system/help/keys/rows.ts | +317 -0 | 317
src/lib/views/system/history/History.svelte | +1 -1 | 477
src/lib/views/system/machine/hpc/Hpc.svelte | +8 -2 | 141
src/lib/views/system/machine/hpc/Login.svelte | +194 -0 | 194
src/lib/views/system/machine/processes/Processes.svelte | +3 -2 | 130
src/lib/views/system/workbench/Catalogue.svelte | +6 -10 | 409
src/lib/views/system/workbench/RailEditor.svelte | +34 -5 | 305
src/lib/views/system/workbench/settings/Item.svelte | +1 -1 | 419
src/lib/views/system/workbench/settings/List.svelte | +1 -1 | 195
src/lib/views/system/workbench/settings/other-rows/BrowserControl.svelte | +26 -3 | 231
src/monaco-modules.d.ts | +99 -2 | 285
src/routes/+page.svelte | +1 -1 | 331
src/routes/api/(files)/folders/make/+server.ts | +11 -7 | 29
src/routes/api/(files)/fs/+server.ts | +11 -3 | 57
src/routes/api/(machine)/recover/+server.ts | +58 -0 | 58
src/routes/api/(sessions)/terminal/+server.ts | +1 -2 | 36
tests/checks/config/config-folder.test.ts | +149 -41 | 740
tests/checks/config/config.test.ts | +41 -1 | 730
tests/checks/source/history.test.ts | +8 -4 | 194
tests/checks/source/keys.test.ts | +7 -0 | 713
tests/data/helpers/hub-names.test.ts | +8 -8 | 186
tests/data/hubs/hub-portfolio.test.ts | +5 -5 | 271
tests/data/snapshot/normalise.test.ts | +10 -4 | 308
tests/data/snapshot/reference-hub.ts | +17 -18 | 288
tests/data/snapshot/references.test.ts | +78 -69 | 517
tests/data/snapshot/relation-shapes.test.ts | +4 -4 | 114
tests/data/snapshot/rename.test.ts | +43 -41 | 407
tests/data/snapshot/resources.test.ts | +3 -4 | 101
tests/data/snapshot/schema-rules.test.ts | +62 -7 | 259
tests/data/sources/career.test.ts | +5 -2 | 113
tests/data/sources/collections.test.ts | +20 -19 | 203
tests/data/sources/config/boards.test.ts | +108 -0 | 108
tests/data/sources/config/counts.test.ts | +61 -0 | 61
tests/data/sources/config/local.test.ts | +60 -2 | 254
tests/data/sources/config/rail.test.ts | +31 -1 | 82
tests/data/sources/feeds.test.ts | +11 -7 | 98
tests/data/sources/manifests/manifests.test.ts | +13 -10 | 751
tests/data/sources/registries.test.ts | +5 -1 | 133
tests/data/sources/scan.test.ts | +1 -2 | 127
tests/fixtures/hubs/collections.ts | +0 -31 | deleted
tests/fixtures/hubs/demo/.oculus/config.yml | +42 -20 | 57
tests/fixtures/hubs/demo/.oculus/data/academic/applications.yml | +21 -0 | 21
tests/fixtures/hubs/demo/.oculus/data/academic/career.yml | +34 -0 | 34
tests/fixtures/hubs/demo/.oculus/data/academic/education.yml | +20 -0 | 20
tests/fixtures/hubs/demo/.oculus/data/academic/events.yml | +45 -0 | 45
tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml | +34 -0 | 34
tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml | +36 -0 | 36
tests/fixtures/hubs/demo/.oculus/data/academic/leads.yml | +49 -0 | 49
tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml | +34 -0 | 34
tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml | +40 -0 | 40
tests/fixtures/hubs/demo/.oculus/data/literature/radar.yml | +38 -0 | 38
tests/fixtures/hubs/demo/.oculus/data/people/organisations.yml | +22 -0 | 22
tests/fixtures/hubs/demo/.oculus/data/people/people.yml | +33 -0 | 33
tests/fixtures/hubs/demo/.oculus/data/pillars/domains.yml | +17 -0 | 17
tests/fixtures/hubs/demo/.oculus/data/pillars/pillars.yml | +15 -0 | 15
tests/fixtures/hubs/demo/.oculus/data/research/data.yml | +44 -0 | 44
tests/fixtures/hubs/demo/.oculus/data/research/resources.yml | +23 -0 | 23
tests/fixtures/hubs/demo/.oculus/data/research/statements.yml | +31 -0 | 31
tests/fixtures/hubs/demo/.oculus/data/research/venues.yml | +30 -0 | 30
tests/fixtures/hubs/demo/feeds/literature-radar.yml | +0 -38 | deleted
tests/fixtures/hubs/demo/feeds/position-leads.yml | +0 -49 | deleted
tests/fixtures/hubs/demo/network/events.yml | +0 -45 | deleted
tests/fixtures/hubs/demo/network/joint-work.yml | +0 -36 | deleted
tests/fixtures/hubs/demo/records/applications.yml | +0 -21 | deleted
tests/fixtures/hubs/demo/records/education.yml | +0 -20 | deleted
tests/fixtures/hubs/demo/records/funding.yml | +0 -34 | deleted
tests/fixtures/hubs/demo/records/tasks.yml | +0 -34 | deleted
tests/fixtures/hubs/demo/registries/boilerplate.yml | +0 -31 | deleted
tests/fixtures/hubs/demo/registries/career.yml | +0 -34 | deleted
tests/fixtures/hubs/demo/registries/data.yml | +0 -44 | deleted
tests/fixtures/hubs/demo/registries/domains.yml | +0 -17 | deleted
tests/fixtures/hubs/demo/registries/literature.yml | +0 -40 | deleted
tests/fixtures/hubs/demo/registries/organisations.yml | +0 -22 | deleted
tests/fixtures/hubs/demo/registries/people.yml | +0 -33 | deleted
tests/fixtures/hubs/demo/registries/pillars.yml | +0 -15 | deleted
tests/fixtures/hubs/demo/registries/resources.yml | +0 -23 | deleted
tests/fixtures/hubs/demo/registries/venues.yml | +0 -30 | deleted
tests/routes/apps/app-fs.test.ts | +3 -3 | 352
tests/routes/apps/app-private.test.ts | +1 -0 | 252
tests/routes/docs/wallpaper.test.ts | +1 -2 | 126
tests/routes/edit/apps/app-gate.test.ts | +1 -1 | 263
tests/routes/edit/audit-mute.test.ts | +3 -2 | 117
tests/routes/edit/config-key.test.ts | +5 -2 | 172
tests/routes/edit/config-value.test.ts | +4 -4 | 53
tests/routes/edit/rail.test.ts | +14 -0 | 108
tests/routes/edit/undo/undo.test.ts | +24 -12 | 767
tests/routes/edit/write-fixture.ts | +12 -12 | 506
tests/routes/hubs/hub-writes.test.ts | +39 -26 | 653
tests/routes/hubs/machine-answer.test.ts | +70 -1 | 136
tests/routes/hubs/make.test.ts | +212 -27 | 620
tests/routes/machine/recover.test.ts | +166 -0 | 166
tests/routes/sessions/compose.test.ts | +2 -2 | 332
tests/routes/sessions/terminal-fixture.ts | +2 -2 | 276
tests/routes/sessions/terminal.test.ts | +2 -73 | 129
tests/server/core/changes.test.ts | +10 -9 | 528
tests/server/desktop/menu-template.test.ts | +2 -1 | 366
tests/server/edit/config-value.test.ts | +18 -12 | 151
tests/server/edit/literature.test.ts | +1 -1 | 192
tests/server/edit/writes-collection.test.ts | +11 -11 | 244
tests/server/edit/writes-fixture.ts | +6 -7 | 205
tests/server/edit/writes.test.ts | +14 -13 | 747
tests/server/machine/lsp/adapters/hub-keys.test.ts | +11 -9 | 179
tests/server/machine/runs/recover/access.test.ts | +290 -0 | 290
tests/server/machine/runs/recover/answers/dandi/asset-metadata.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/dandi/assets-p1.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/dandi/assets-p1.headers | +16 -0 | 16
tests/server/machine/runs/recover/answers/dandi/assets-p2.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/figshare/article.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/figshare/collection.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/figshare/collection.headers | +11 -0 | 11
tests/server/machine/runs/recover/answers/geo/listing.body | +12 -0 | 12
tests/server/machine/runs/recover/answers/geo/listing.headers | +14 -0 | 14
tests/server/machine/runs/recover/answers/huggingface/tree-p1.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/huggingface/tree-p1.headers | +22 -0 | 22
tests/server/machine/runs/recover/answers/huggingface/tree-p2.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/huggingface/tree-p2.headers | +22 -0 | 22
tests/server/machine/runs/recover/answers/huggingface/tree-p3.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/kaggle/list.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/physionet/mimiciv-nologin.body | +337 -0 | 337
tests/server/machine/runs/recover/answers/physionet/mimiciv-nologin.headers | +11 -0 | 11
tests/server/machine/runs/recover/answers/physionet/mimiciv-sums.body | +3 -0 | 3
tests/server/machine/runs/recover/answers/physionet/mitdb.body | +704 -0 | 704
tests/server/machine/runs/recover/answers/physionet/mitdb.headers | +11 -0 | 11
tests/server/machine/runs/recover/answers/stanford/purl.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/stanford/purl.headers | +20 -0 | 20
tests/server/machine/runs/recover/answers/synapse/children-p1.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/synapse/children-p2.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/synapse/entity-file.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/synapse/entity-folder.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/synapse/filehandles.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/synapse/user-profile.body | +1 -0 | 1
tests/server/machine/runs/recover/answers/tcia/series.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/tcia/series.headers | +8 -0 | 8
tests/server/machine/runs/recover/answers/zenodo/aad-dtu.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/zenodo/aad-dtu.headers | +23 -0 | 23
tests/server/machine/runs/recover/answers/zenodo/picai.body | +1 -0 | 0
tests/server/machine/runs/recover/answers/zenodo/picai.headers | +23 -0 | 23
tests/server/machine/runs/recover/harness.ts | +253 -0 | 253
tests/server/machine/runs/recover/plan.test.ts | +266 -0 | 266
tests/server/machine/runs/recover/recorded.ts | +98 -0 | 98
tests/server/machine/runs/recover/runs.test.ts | +288 -0 | 288
tests/server/machine/runs/recover/safety.test.ts | +574 -0 | 574
tests/server/machine/runs/recover/sources.test.ts | +560 -0 | 560
tests/server/root/context-fixture.ts | +3 -1 | 215
tests/server/root/process/config-cache.test.ts | +2 -1 | 313
tests/shell/window/menu-answer.test.ts | +1 -1 | 309
tests/state/client/held-unsaved.test.ts | +25 -15 | 351
tests/state/forms/new-entry.test.ts | +20 -11 | 184
tests/state/forms/referrers.test.ts | +1 -1 | 129
tests/state/sessions/changes-file.test.ts | +6 -6 | 49
tests/state/system/apps/app-keys.test.ts | +1 -1 | 345
tests/state/system/apps/methods.test.ts | +1 -1 | 771
tests/state/system/settings/port-row.test.ts | +1 -1 | 80
tests/state/workbench/count-row.test.ts | +29 -0 | 29
tests/ui/html.dom.test.ts | +2 -2 | 137
utils/migrations/migrate-joint-work.mjs | +0 -502 | deleted
utils/migrations/rename-program-to-pillar.ts | +0 -123 | deleted
```

A `.body` file of 0 lines is one JSON line with no final newline (`wc -l` counts newlines).

### The hub, outside tools/oculus

Changed in place: 88 files (`diff -rU0` of the base copy against the worktree, `$TMPDIR/o38-hubU0.patch`, `grep -c '^+++ ' = 88`). Each changed line is a row of section 8; the length now (`xargs wc -l` over the 88 paths): `.agents/skills/project-cleanup/SKILL.md` 118 (277 on the base), `.gitignore` 152, `.oculus/config.yml` 91, `.oculus/tasks/linkedin.md` 19, `.oculus/tasks/litwatch.md` 67, `.oculus/tasks/scout.md` 95, `applications/information/uantwerpen-delputte-inquiry.md` 59, `applications/information/vib-ai-aerts-inquiry.md` 66, `CONTEXT.md` 21, `docs/figures/gen_figures.py` 690, `docs/figures/hub-map.svg` 46, `docs/RESEARCH-APPROACH.md` 92, `funding/2026-fwo-senior-stopped-meyfroidt/prep.md` 267, `funding/2026-fwo-senior-stopped-meyfroidt/README.md` 47, `funding/about-axel/about-axel-meyfroidt.html` 399, `funding/about-axel/about-axel.html` 374, `funding/about-axel/README.md` 28, `projects/active/eeg-saad-challenge/README.md` 69, `projects/active/linfoot-estimator/README.md` 268, `projects/active/loewner/README.md` 348, ms-lipid-handshake `code/.depositignore` 5, `code/core/config.py` 144, `code/experiments/build_macnair.py` 94, `code/experiments/compositional.py` 149, `code/paper.py` 112, `code/README.md` 70, `README.md` 108; jacobian-coupled-blockterm-dp `code/.depositignore` 8; glassbox-decision-pipelines `code/hpc/build_raw_cache.slurm` 29, `merge_raw_cache.slurm` 24, `run_all.sh` 59, `run_cpu.slurm` 18, `run_feat_array.slurm` 29, `run_gpu.slurm` 20, `code/pipeline/cohort/mimic_cohort.py` 43, `code/pipeline/core/config.py` 67, `code/README.md` 120, `README.md` 127; `projects/ideas/block-term-nca/README.md` 57; `projects/ideas/multiway-biosignal-fm/README.md` 54; btfno `admin/build_supplement.sh` 63, `AGENTS.md` and `CLAUDE.md` 22 (one file, `AGENTS.md` is a link to `CLAUDE.md`), `code/.depositignore` 21, `README.md` 105; bttd-source-eeg `code/.depositignore` 13; bttn-incident-af `AGENTS.md`/`CLAUDE.md` 37, `code/.depositignore` 18, `code/core/config.py` 94, `code/run_all.sh` 164, `README.md` 81; covert-applied `code/.depositignore` 19, `code/experiments/extract_mimic_features.py` 248, `README.md` 69; covert-theory `code/.depositignore` 14, `README.md` 68; dongho-ecg-clustering `code/.depositignore` 20, `README.md` 123; dries-bttr-ecg `code/.depositignore` 17, `README.md` 70; ecg-readable-substrate `code/core/config.py` 65, `code/hpc/build_raw_cache.slurm` 22, `extract_embeddings.slurm` 34, `run_all.sh` 113, `run_cpu.slurm` 23, `run_gpu.slurm` 29, `code/README.md` 104, `code/tier0/gate.py` 121, `README.md` 109; fed-multicellular-immune `AGENTS.md`/`CLAUDE.md` 21, `code/.depositignore` 19, `code/core/build_covid.py` 81, `build_generic.py` 75, `build_ibd.py` 79, `config.py` 49, `code/paper.py` 69, `code/README.md` 68, `README.md` 91; hccnet-revision `code/.depositignore` 26; meseret-cirrhosis `code/.depositignore` 22; raw-pls `code/.depositignore` 17, `code/attic/external_validation/build_ped.py` 76, `ped_probe.slurm` 27; ward-bttr-crosssubject `code/.depositignore` 14; `README.md` 78; `tools/skills/catalog.yaml` 1492. `.claude/skills/project-cleanup` and `.codex/skills/project-cleanup` are links to `.agents/skills/project-cleanup` (`ls -la`), so the SKILL.md change reaches them with no write of their own.

Moved into `.oculus/data/` (18 files, `find .oculus/data -type f | xargs wc -l`), each with its base path and how it differs from the base file (`cmp` and `diff -U0`):

| Now | Lines | Was | Content |
|---|---|---|---|
| `academic/applications.yml` | 457 | `applications/applications.yml` | identical |
| `academic/career.yml` | 98 | `registries/career.yml` | 2 lines (section 8) |
| `academic/education.yml` | 282 | `education/education.yml` | identical |
| `academic/events.yml` | 118 | `network/events.yml` | identical |
| `academic/funding.yml` | 167 | `funding/funding.yml` | identical |
| `academic/joint-work.yml` | 88 | `network/joint-work.yml` | 3 lines (section 8) |
| `academic/leads.yml` | 625 | `feeds/position-leads.yml` | 1 line (section 8) |
| `academic/tasks.yml` | 26 | `tasks/tasks.yml` | identical |
| `literature/literature.yml` | 22 | `registries/literature.yml` | identical |
| `literature/radar.yml` | 6562 | `feeds/literature-radar.yml` | identical |
| `people/organisations.yml` | 52 | `registries/organisations.yml` | 1 line (section 8) |
| `people/people.yml` | 112 | `registries/people.yml` | 1 line (section 8) |
| `pillars/domains.yml` | 78 | `registries/domains.yml` | identical |
| `pillars/pillars.yml` | 99 | `registries/pillars.yml` | 1 line (section 8) |
| `research/data.yml` | 1212 | `registries/data.yml` (1068) | rewritten (section 9) |
| `research/resources.yml` | 29 | `registries/resources.yml` | 1 line (section 8) |
| `research/statements.yml` | 31 | `registries/boilerplate.yml` | 1 line (section 8) |
| `research/venues.yml` | 1077 | `registries/venues.yml` | identical |

Deleted (`diff -rq` of the base copy against the worktree prints "Only in O38-base" for each): `tools/cockpit`, `tools/present`, `tools/data`, `tools/deposit`; `.agents/skills/research-cockpit`, `remove-unicode`, `project-new`; the six links under `.claude/skills/` and `.codex/skills/`; `registries/` (its ten files moved), `feeds/` (two files moved), `tasks/` (one file moved), `funding/funding.yml`, `applications/applications.yml`, `education/education.yml`, `network/events.yml`, `network/joint-work.yml` (moved).

### Paths written outside the brief's list, with the reason

The hub:

| Path | Reason |
|---|---|
| `.oculus/tasks/linkedin.md:9` | Part 13 item 6 moves `linkedin_cadence_days` under `focus:`; the task names the key and its file. The list names only `litwatch.md` and `scout.md` of the tasks folder. |
| `code/.depositignore` of btfno, bttd-source-eeg, bttn-incident-af, covert-applied, covert-theory, raw-pls, ward-bttr-crosssubject | Each says `deposit.py` renames the file, the tool Part 1 deletes; the sweep's pattern misses a bare `deposit.py`, so they are not in O38-sweep.txt. |
| ms-lipid-handshake `code/experiments/build_macnair.py`, `code/experiments/compositional.py`, `code/README.md`, `README.md` | Ruling 153 replaces `C.DATA` with one folder per registry key in `code/core/config.py`; these read `C.DATA` or document the old folder. |
| fed-multicellular-immune `code/core/build_covid.py`, `build_generic.py`, `build_ibd.py`, `code/paper.py`, `code/README.md`, `README.md`, `CLAUDE.md` (and `AGENTS.md`, its link) | The same for the nine cellxgene sets: they read `C.DATA` or document `~/data/fed-immune-tensor/data/`, which ruling 153 replaces with `~/data/<registry key>/`. |
| btfno `AGENTS.md`, bttn-incident-af `AGENTS.md` | Links to the `CLAUDE.md` beside them, which the sweep holds; no write of their own. |

tools/oculus (files the list does not name and no clause of it covers; the Part 14 clause's files are named in section 10):

| Path | Reason |
|---|---|
| `config/catalogs/glyphs.yml`, `config/catalogs/icons.yml` | The `keyboard` glyph and icon of the Keyboard Shortcuts view's registration (Part 16). |
| `config/text/server.yml` | `secret_set`, the word drawn in place of a secret that is set (Part 9). |
| `config/text/ui.yml` | `ui.brackets`, `ui.monospace` and their titles, the label and hover words of the two toggles in `BrowserControl.svelte:187-197`, beside the words of the existing toggles there (Part 6). The row titles are in `workbench.yml`, the file the list names. |
| `config/text/views/feeds/leads.yml`, `config/text/views/boards/person.yml` | Each named the old file (`position-leads`, `network/joint-work.yml`); the sweep pattern runs on the hub, not on oculus's words. |
| `config/text/views/sources/source.yml` | `show_suggestions`, the Merge view's word for the Show Suggestions item (Part 15 item 2). |
| `src/desktop/windows/menu-template.ts` | The desktop menu's Keyboard Shortcuts item opens the view in the main window (Part 16). |
| `src/lib/data/helpers/editor/editor.ts`, `src/lib/data/sources/config/editor-options.ts` | `suggestDetails`, the start value of the description panel read from `editor.suggest_details` (Part 15 item 3). |
| `src/lib/data/helpers/guards.ts` | `focusBlock`, the one reader of the `focus:` map of Part 13 item 6. |
| `src/lib/data/shapes/shapes.ts` | `keysOfShape` deleted: its last user was a deleted vocab reader, so `utils/unused-exports.sh` reported it. |
| `src/lib/data/sources/config/rail.ts`, `src/lib/state/workbench/navigation/rail.ts`, `src/lib/server/edit/writes/config/lists/rail.ts`, `src/lib/server/edit/writes/bodies.ts`, `src/lib/state/shared/stores/shapes.ts`, `src/lib/state/client/writes.svelte.ts`, `src/lib/views/system/workbench/RailEditor.svelte`, `tests/data/sources/config/rail.test.ts`, `tests/state/client/held-unsaved.test.ts` | Part 13 item 3: the rail rows carry `chord` and `group_glyph`, read, written and edited along the rail's chain; `chordDocs` in `navigation/rail.ts` is shared by Catalogue and the Keyboard Shortcuts view. |
| `src/lib/data/sources/config/sections/boards.ts`, `counts.ts`, `focus.ts`; `src/lib/server/edit/writes/config/config-checks.ts`; `tests/data/sources/config/boards.test.ts`, `counts.test.ts`; `tests/state/workbench/count-row.test.ts` | The config checks of the new `boards`, `counts` and `focus:` blocks and their tests (Parts 10 and 13); `sections/` held no such check, and `config-checks.ts` wires them into the edit-time check. |
| `src/lib/server/edit/writes/hubs.ts`, `src/lib/state/sessions/source/write-files.ts` | `LITERATURE_FILE` and `CAREER_FILE` removed (Part 3 item 2); they read the key and the merged `career_file`. |
| `src/lib/server/root/context.ts`, `src/lib/server/root/process/server-context.ts`, `tests/server/root/context-fixture.ts` | `recoverRuns`, the server's map of Recover runs, stopped on close (Part 2). |
| `src/lib/state/client/context.ts`, `src/lib/state/client/shapes/client-state.ts`, `src/lib/state/system/apps/shell/page-commands.ts` | The Recover store on the client state; `context.ts` was at 877 lines, so `pageCommandDeps` moved to `page-commands.ts`. |
| `src/lib/state/system/machine/recover-words.ts` | The Recover words and types shared by the Recover view and the Login node section; `views/system` may not import `views/sources`, and views may not import `data/model`. |
| `src/lib/state/sources/registries/datasets.ts` | The dataset card's stated source and its recover key, moved out of `DatasetCard.svelte` because views may not import `data/helpers/hub-names` or `data/model`. |
| `src/lib/state/sources/fs.ts` | Re-exports `HUB_CHOICES`, `HUB_FILE` and `MakeItems` for the make dialog (views may not import `data/helpers/hub-names`). |
| `src/lib/views/shared/forms/registry/record-card.svelte.ts`, `RegistryCard.svelte`, `src/lib/views/structure/domains/DomainCard.svelte`, `src/lib/views/structure/pillars/LineCard.svelte` | The duplication check found the rewritten DatasetCard repeating RegistryCard (14 lines) and DomainCard (10 lines); the shared part is `createRecordCard`. |
| `src/lib/views/shared/card/card.ts`, `CardActions.svelte`, `src/lib/views/shared/forms/entry/entry-actions.ts` | The `CardAction` type moved to `card.ts` so the dataset card's control reads it without importing a component. |
| `src/lib/state/workbench/layout/tabs/close-hooks.ts` | Split out of `ui.svelte.ts` (the brief's "the file it is split into"); `state/workbench` is at ten items, so it sits in `layout/tabs/`. |
| `src/lib/state/shared/words/appearance.ts` | `fileIconThemeNamed` deleted: its one user was the `:file-icons` branch the argument list replaces (Part 17). |
| `src/lib/shell/window/colon-effects.ts`, `src/lib/shell/window/appearance.svelte.ts` | The four commands that open as lists (Part 17) and the previewed file icon theme drawn while one is picked. |
| `src/lib/shell/keys/lists/clone-list.svelte.ts` (moved from `rows/`) | Keeps `rows/` at ten items with `ArgumentRows.svelte` (Part 17). |
| `src/lib/state/system/apps/shell/shell.svelte.ts`, `src/lib/ui/frame/Modal.svelte`, `src/lib/ui/frame/quiet-focus.ts` | Comments naming the key sheet, which Part 16 deletes. |
| `src/lib/views/sources/source/latex/latex-tab.svelte.ts` | Uses `LATEX_CHORD_SECONDS` and `latexChordSecond` from `editor-keys.ts`, which the Keyboard Shortcuts view also reads (Part 16). |
| `src/monaco-modules.d.ts` | The types of Monaco's `standaloneEnums` and `keybindingsRegistry`, which `monaco-keys.ts` reads for the editor rows of the view (Part 16). |
| `src/lib/views/sources/repositories/merge/Merge.svelte` | The merge Result editor gets Show Suggestions and the panel's start value (Part 15 items 2 and 3). |
| `src/lib/ui/html.ts`, `src/lib/ui/display/ticker/Ticker.svelte`, `src/lib/state/feeds/linkedin.ts`, `src/lib/state/boards/board/presets.ts` (`firstSentence`) | Part 11: the address rule `LinkedText` and Markdown share; the Focus board's plain ticker rows; a cut that never ends inside an address. |
| `src/routes/api/(files)/fs/+server.ts`, `tests/state/system/settings/port-row.test.ts` | The machine answer takes the `secret_set` word (Part 9); the port row's sixth argument in its test. |
| `src/routes/api/(sessions)/terminal/+server.ts` | `datasetFor`, used only by the deleted `recover` terminal action (Part 2 item 10). |
| `tests/routes/apps/app-private.test.ts`, `tests/server/root/process/config-cache.test.ts` | `downloads: []` in their `LocalConfig` literals, the new required list (Part 2 item 3). |
| `tests/data/sources/registries.test.ts`, `tests/data/sources/career.test.ts` | `REGISTRY_FILES` and `CAREER_FILE` now test-local constants from `engineDefaults()`. |
| `tests/checks/source/history.test.ts` | The history check reads a recorded web answer as data with no prose (section 12). |
| `tests/checks/source/keys.test.ts` | `COMPUTED_PREFIXES` row for `rows.ts`'s `t(row.word)` (section 12). |
| `tests/server/desktop/menu-template.test.ts` | The menu-template row for Keyboard Shortcuts (section 12). |
| `tests/routes/sessions/compose.test.ts`, `tests/server/edit/literature.test.ts`, `tests/ui/html.dom.test.ts`, `tests/data/sources/manifests/manifests.test.ts` | Fixture paths moved to the kind folders of `.oculus/data/` (`.oculus/data/research/venues.yml` and the like), and the manifests fixture's `collections:` line naming `registries/venues.yml` dropped. |
| `tests/routes/apps/app-fs.test.ts`, `tests/state/system/apps/methods.test.ts` | Their example hub file was `feeds/x.yml`, a folder Part 3 removes; now `notes/x.yml`. |
| `tests/routes/edit/config-key.test.ts` | The null-after row starts from a hub with no `.oculus` folder, since the demo hub now holds one (section 12). |
| `utils/migrations/rename-program-to-pillar.ts` | Migration code (Part 12's rule, spec.md: no migration code). `utils/migrations/` keeps `convert-decks.mjs` and `convert-vscode-themes.ts` (`ls`), which convert files of other tools and carry no older form of oculus's data. |

## The 94 body.rice lines and where each went

The 94 lines are `grep -rn "body\.rice" src` on the base copy (`scratchpad/rice-base.txt`, 94 lines, 54 files). Three outcomes: **Brackets** (moved under `body.rice:where(:not(.rice-plain))`, drawn only while Brackets is on), **Monospace** (moved under `body.rice:where(:not(.rice-sans))`, drawn only while Monospace is on; "split" means only the font declaration moved and the rule's other declarations stayed theme), **Theme** (unchanged: the rice palette and shape every rice theme draws whatever the toggles say), and **Comment** (a comment line, no rule). `:where()` keeps each moved rule at the base's specificity, so the `.bare`, `.status`, `.cell`, `.plain` and `.rail-control` rules after it still win. Worktree lines from `grep -rn "rice-plain))\|rice-sans))" src`: 12 Brackets, 20 Monospace.

| Base line | What it draws | Outcome | Now |
|---|---|---|---|
| `shell/rail/RailPages.svelte:293` | `.badge` offset | Theme | unchanged |
| `themes/parse.ts:42` | comment | Comment | unchanged |
| `themes/rice/catppuccin.css:3` | head comment | Comment | unchanged |
| `themes/rice/everforest.css:3` | head comment | Comment | unchanged |
| `themes/rice/flexoki.css:3` | head comment | Comment | unchanged |
| `themes/rice/gruvbox.css:2` | head comment | Comment | unchanged |
| `themes/rice/kanagawa.css:3` | head comment | Comment | unchanged |
| `themes/rice/phosphor.css:5` | head comment | Comment | unchanged |
| `themes/rice/rosepine.css:3` | head comment | Comment | unchanged |
| `themes/rice/singles.css:8` | head comment | Comment | unchanged |
| `themes/rice/tokyo.css:3` | head comment | Comment | unchanged |
| `themes/slide.css:29` | comment | Comment | unchanged |
| `themes/slide.css:31` | `.slide-frame` type scale | Theme | unchanged |
| `themes/themes.css:47` | `body.rice` sizes, radius, shadow, `--font-ui` and `font-family` | Monospace (split) | `--font-ui` and `font-family` at `themes.css:75`; the rest stays at :47 |
| `ui/controls/Chip.svelte:167` | `.chip` borderless | Brackets | `Chip.svelte:169` |
| `ui/controls/Chip.svelte:174` | `.chip .mark` margin | Brackets | `:176` |
| `ui/controls/Chip.svelte:178` | `.chip.filled` no fill | Brackets | `:180` |
| `ui/controls/Chip.svelte:185` | `[` before a chip | Brackets | `:187` |
| `ui/controls/Chip.svelte:190` | `]` after a chip | Brackets | `:192` |
| `ui/controls/Tag.svelte:85` | `[` before a tag | Brackets | `Tag.svelte:87` |
| `ui/controls/Tag.svelte:90` | `]` after a tag | Brackets | `:92` |
| `ui/controls/ToolButton.svelte:221` | `.tool.bare` box | Theme | unchanged |
| `ui/controls/ToolButton.svelte:239` | `.tool.bare` pressed | Theme | unchanged |
| `ui/controls/ToolButton.svelte:241` | `.tool.bare` pressed hover | Theme | unchanged |
| `ui/controls/ToolButton.svelte:253` | `.tool.status` box | Theme | unchanged |
| `ui/controls/ToolButton.svelte:303` | `.tool.status` glyph size | Theme | unchanged |
| `ui/controls/ToolButton.svelte:311` | `.tool.cell` box | Theme | unchanged |
| `ui/controls/ToolButton.svelte:334` | `.tool.plain` box | Theme | unchanged |
| `ui/controls/ToolButton.svelte:397` | `.tool.primary.joined::after` hidden | Brackets | `ToolButton.svelte:398` |
| `ui/controls/ToolButton.svelte:437` | `.tool.rail-control.active` | Theme | unchanged |
| `ui/controls/ToolButton.svelte:463` | `.tool` borderless, no fill | Brackets | `:466` |
| `ui/controls/ToolButton.svelte:470` | `.tool.active` in accent text | Brackets | `:473` |
| `ui/controls/ToolButton.svelte:480` | `[` before a button | Brackets | `:483` |
| `ui/controls/ToolButton.svelte:486` | `]` after a button | Brackets | `:489` |
| `ui/controls/ToolButton.svelte:496` | `.tool.rail-control` height | Theme | unchanged |
| `ui/controls/ToolButton.svelte:501` | `.tool.rail-control.active` colour | Theme | unchanged |
| `ui/controls/ToolButton.svelte:505` | `.tool.rail-control` glyph size | Theme | unchanged |
| `ui/display/Glyph.svelte:98` | `.glyph` width | Theme | unchanged |
| `ui/display/meters/Meter.svelte:78` | `.track` square | Theme | unchanged |
| `ui/display/meters/Progress.svelte:70` | `.track` square | Theme | unchanged |
| `ui/display/table/Table.svelte:167` | `th` case | Theme | unchanged |
| `ui/display/table/Table.svelte:171` | `td` dotted rule | Theme | unchanged |
| `ui/forms/choice/GlyphList.svelte:79` | name indent | Theme | unchanged |
| `ui/forms/choice/QuickPick.svelte:181` | row gap | Theme | unchanged |
| `ui/forms/choice/QuickPick.svelte:191` | unglyphed row indent | Theme | unchanged |
| `ui/forms/Field.svelte:91` | `.name` case | Theme | unchanged |
| `ui/forms/TextArea.svelte:107` | `.area.bare` | Theme | unchanged |
| `ui/forms/TextArea.svelte:144` | `.area` left rule | Theme | unchanged |
| `ui/frame/Card.svelte:228` | `.card` radius, no shadow | Theme | unchanged |
| `ui/frame/Card.svelte:233` | `.card.pinned` border | Theme | unchanged |
| `ui/frame/Card.svelte:237` | `.title` spacing | Theme | unchanged |
| `ui/frame/Empty.svelte:82` | `.empty` padding, alignment, mono font | Monospace (split) | font at `Empty.svelte:87`; the rest stays |
| `ui/frame/Empty.svelte:88` | `.empty` block | Theme | unchanged |
| `ui/frame/Empty.svelte:92` | `.empty .action` block | Theme | unchanged |
| `ui/frame/Empty.svelte:97` | `.empty.error` size | Theme | unchanged |
| `ui/frame/Empty.svelte:102` | `# ` mark | Theme | unchanged |
| `ui/frame/Pane.svelte:103` | tinted header on a wall | Theme | unchanged |
| `ui/frame/Pane.svelte:185` | header fill | Theme | unchanged |
| `ui/frame/Pane.svelte:190` | header on a wall | Theme | unchanged |
| `ui/frame/Pane.svelte:195` | `.title` case | Theme | unchanged |
| `ui/menu/keys/KeySheet.svelte:129` | `.sheet` radius | deleted with the file (Part 16) | - |
| `ui/menu/MenuOpener.svelte:202` | `.opener.primary` box | Theme | unchanged |
| `ui/menu/MenuOpener.svelte:252` | rail opener glyph size | Theme | unchanged |
| `ui/menu/MenuOpener.svelte:260` | `.opener.status` box | Theme | unchanged |
| `ui/menu/MenuOpener.svelte:295` | status opener glyph size | Theme | unchanged |
| `ui/menu/Tooltip.svelte:386` | `.bubble` mono font, square | Monospace (split) | font at `Tooltip.svelte:391`; square stays |
| `ui/theme/field.css:53` | `.oculus-field` underline, mono font | Monospace (split) | font at `field.css:61`; the underline stays |
| `ui/tree/Disclosure.svelte:65` | `.disclosure` borderless | Theme | unchanged |
| `views/academic/slides/Slides.svelte:434` | `.slides` mono font | Monospace | `Slides.svelte:434` |
| `views/boards/editor/Editor.svelte:328` | `.heading` case | Theme | unchanged |
| `views/boards/entry/Entry.svelte:361` | `.entry` mono font | Monospace | `Entry.svelte:361` |
| `views/boards/project/Project.svelte:206` | `.project` mono font | Monospace | `Project.svelte:206` |
| `views/boards/projects/Projects.svelte:406` | `.board` mono font | Monospace | `Projects.svelte:397` |
| `views/personal/memories/Memories.svelte:448` | tile square | Theme | unchanged |
| `views/personal/memories/Memories.svelte:449` | shown image square | Theme | unchanged |
| `views/sessions/session-detail/ChangesRepository.svelte:213` | mono font | Monospace | `:213` |
| `views/sessions/session-detail/DetailsBody.svelte:419` | mono font | Monospace | `:419` |
| `views/sessions/session-detail/SessionDetail.svelte:200` | mono font | Monospace | `:200` |
| `views/sessions/session-list/SessionList.svelte:450` | mono font | Monospace | `:450` |
| `views/sessions/terminal/grid/grid-look.ts:28` | comment | Comment | unchanged |
| `views/sessions/terminal/start/Composer.svelte:515` | `.box` no fill, mono font | Monospace (split) | font at `Composer.svelte:520`; no fill stays |
| `views/sessions/timeline/Timeline.svelte:210` | mono font | Monospace | `:210` |
| `views/sessions/transcript/Transcript.svelte:348` | mono font | Monospace | `:348` |
| `views/shared/changes/CommitBox.svelte:265` | comment | Comment | unchanged |
| `views/shared/changes/CommitBox.svelte:268` | `.box` left rule | Theme | unchanged |
| `views/shared/changes/CommitBox.svelte:275` | focus rule | Theme | unchanged |
| `views/shared/sessions/SteerBox.svelte:175` | `.box` no fill, mono font | Monospace (split) | font at `SteerBox.svelte:180`; no fill stays |
| `views/sources/doc/Doc.svelte:317` | mono font | Monospace | `:317` |
| `views/sources/venues/Ribbon.svelte:187` | `.spark` flex | Theme | unchanged |
| `views/system/audit/Audit.svelte:344` | mono font | Monospace | `:344` |
| `views/system/help/Help.svelte:95` | mono font | Monospace | `Help.svelte:96` |
| `views/system/history/History.svelte:474` | mono font | Monospace | `:474` |
| `views/system/machine/processes/ProcessTable.svelte:138` | `th` case | Theme | unchanged |
| `views/system/machine/processes/ProcessTable.svelte:154` | `td` dotted rule | Theme | unchanged |

Counts: Brackets 12, Monospace 20 (14 whole, 6 split), Theme 48, Comment 13, deleted 1 (94). Theme is the reading of Part 6 "Off draws them with the rice palette and shape": with Brackets off a button or chip keeps its default box in the rice tokens (hairline border, rice radius, no shadow); the bracket words and the borderless look belong to Brackets (section 10).

## Lines of O38-sweep.txt left unchanged

The case 16 grep from the worktree root (`$TMPDIR/o38-c16-now.txt`, rerun today with the brief's command, `cut -d: -f1 | sort | uniq -c`): 43 lines.

| File and lines | Why left |
|---|---|
| `.oculus/data/academic/leads.yml:10-14,16,18-39,41,42,44-46,48` (34 lines) | Dated `meta.log` lines of past scout runs, each naming the `/research-cockpit scout` command it ran then. They are a log of what happened; the brief's case 16 keeps them. |
| `CLAUDE.md:56,60,72` | The session's file (Part 1 item 4 and Part 7; the path list excludes it). |
| `.agents/plan.yaml:12` | The session's file (Part 7). |
| `funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:238,635,637,641` | Grant-application text, excluded from the path list; it changes only through the academic-paper skill. |
| `tools/oculus/DESIGN.md:61` | The pattern matches `feeds/` in the list of oculus's own state folders (`workbench/, feeds/, life/`), which is not the hub's `feeds/` folder. |

## Hub lines rewritten by hand, before and after

From `$TMPDIR/o38-hubU0.patch` (`diff -rU0` of the base copy against the worktree, outside `tools/oculus`, 88 files) and `diff -U0` of each moved file against its base path. A row gives the line in the worktree (or the base line for a deletion) and the changed words; the rest of the line is unchanged. A row that adds or deletes a whole line quotes it.

### .agents/skills/project-cleanup/SKILL.md

Every hard-wrapped paragraph and bullet was joined into one line (base 277 lines, now 118), and every non-ASCII character went (`LC_ALL=C grep -c '[^ -~]'` = 0). The joins with no other change (base lines, then the line now): 9-14 (9), 21-23 (14), 38-41 (23), 43-45 (25), 47-49 (27), 52-55 (30), 56-59 (31), 69-72 (33), 73-77 (34), 78-80 (35), 81-82 (36), 83-84 (37), 85-88 (38), 89-94 (39), 95-96 (40), 110-111 (49), 112-115 (50), 164-165 (64), 225-226 (97), 227-230 (98), 232-235 (100). The rows with a change of words:

| Now | Before | After |
|---|---|---|
| :3 | `Modes: docs <middle dot> code <middle dot> freeze <middle dot> full` | `Modes: docs \| code \| freeze \| full` |
| :7 | `# project-cleanup` em dash `one README, ...` | `# project-cleanup: one README, ...` |
| :11 (base 16-18) | `Layout standard: tools/cockpit/DESIGN.md.` | `Layout standard: the "Project layout and tiers" section of the hub README.md.` |
| :16 (base 25-26) | `manuscript/ (if it exists)` em dash `the canonical` | `manuscript/ (if it exists): the canonical` |
| :17 (base 27-30) | `README.md (project root)` em dash `THE one private` | `README.md (project root): THE one private` |
| :18 (base 31-32) | `project.yml` em dash `the cockpit glance (status / ...)` | `project.yml: oculus's project card (status / ...)` |
| :19 (base 33-34) | `code/README.md` em dash `the public deposit root` | `code/README.md: the public deposit root` |
| :32 (base 60-68) | `Rendered cockpit tabs / website pages may likewise restate` | `oculus's views and website pages may likewise restate` |
| :41 (base 97) | `em dash ... goes ...; ellipsis ... becomes ...` with the glyphs | `the em dash goes ...; the ellipsis character becomes ...` |
| :42 (base 98) | `arrows` with the two arrow glyphs `become a word` | `the arrow characters (right arrow, double right arrow) become a word` |
| :43 (base 99) | `en dash` glyph, curly quote glyphs | `the en dash ...; curly quotes become straight` |
| :44 (base 100-101) | `Greek like` sigma glyph `, and` eight sign glyphs | `Greek letters such as sigma, the signs for approximately, less or equal, greater or equal, plus-minus, times, tensor product and element of` |
| :45 (base 102-106) | `For a thorough, gated pass use the remove-unicode skill (allow-list driven, per-occurrence, with a verification gate). Honor its exempt list (B) even inside a project folder` | `For a thorough pass use oculus's writing rules (the Problems view; Fix All Writing Problems in Folder fixes many files at once). Honor this exempt list even inside a project folder` |
| :53 (base 118-134) | `project` em dash `the folder id`; `filed at any depth - e.g.`; `at-a-glance surface in the cockpit`; `/program/`; `Keep within the cockpit read-limits (eli5 <= 360, results <= 240 each)`; `no em dashes, no` arrow glyph `arrows` | `project: the folder id`; `filed at any depth, e.g.`; `at-a-glance surface in oculus's project card`; `/pillar/`; `Keep within oculus's read_limits (config/behavior.yml: eli5 <= 360, results <= 300 each)`; `no em dashes, no arrow characters` |
| :54 (base 135) | `mode` em dash `` `docs` <middle dot> `code` <middle dot> `freeze` <middle dot> `full` `` | `mode: docs \| code \| freeze \| full` |
| :56 (base 137) | `## Phase 0` em dash `gather context` | `## Phase 0: gather context` |
| :57 (base 138-142) | joined | joined |
| :59 (base 144-150) | `audited point-by-point against DESIGN.md` | `audited point-by-point against the hub README.md's "Project layout and tiers"` |
| :61 (base 152) | `## Phase 1` em dash `docs: the one README.md` | `## Phase 1: docs, the one README.md` |
| :62 (base 153-162) | `within the cockpit READ_LIMITS`; `from registries/venues.yml`; `` datasets: = registries/data.yml keys ``; `program:` | `within oculus's read_limits`; `from .oculus/data/research/venues.yml`; `` datasets: = .oculus/data/research/data.yml keys ``; `pillar:` |
| :65 to :71 (base 166-180) | each section bullet `` **`# <project>`** `` em dash and so on | `` **`# <project>`**: `` and so on (seven bullets) |
| :75 (base 184) | `## Phase 2` em dash `code` | `## Phase 2: code` |
| :76 (base 185-193) | joined | joined |
| :78 (base 195-197) | `excludes - attic/, ...` | `excludes: attic/, ...` |
| :83 (base 202) | `deposit.py renames it to .gitignore IN THE DEPOSIT` | `oculus's Deposit view writes these patterns into the DEPOSIT's .gitignore` |
| :89 (base 208) | `generated .md/.csv outputs - tracked in HUB` | `generated .md/.csv outputs, tracked in HUB` |
| :90 (base 209) | `generated .png outputs - tracked in HUB` | `generated .png outputs, tracked in HUB` |
| :94 (base 213-214) | joined | joined |
| :95 (base 215-223) | `Self-contained outputs - the code writes INSIDE code/.`; `in code/.depositignore - which is NOT a .gitignore`; `while deposit.py renames the file to .gitignore in the public deposit` | `Self-contained outputs: the code writes INSIDE code/.`; `in code/.depositignore, which is NOT a .gitignore`; `while oculus's Deposit view writes its patterns into the public deposit's .gitignore` |
| :103 (base 238-243) | `public headline) <middle dot> how code/ is organised ... <middle dot> ... <middle dot> ...` | `public headline) \| how code/ is organised ... \| ... \| ...` |
| :105 (base 245) | `## Phase 3` em dash `freeze` | `## Phase 3: freeze` |
| :106 (base 246-252) | `The standard tool is tools/deposit/deposit.py <id> (dry-run by default; --create makes the GitHub repo and pushes; renames code/.depositignore to .gitignore in the deposit, secret-scans, fills code_availability.{status,url})` | `The standard tool is oculus's Deposit view (it keeps a mirror clone of code/ under ~/.oculus/deposits, makes the GitHub repository on the first push, writes the patterns of code/.depositignore into the deposit's .gitignore, scans for secrets, and fills code_availability.{status,url})` |
| :108 (base 254) | `## Phase 4` em dash `verify + record` | `## Phase 4: verify + record` |
| :109 (base 255) | `Run python3 tools/cockpit/build.py; confirm this project's readability warnings = 0; --selftest PASS.` | `Confirm the Audit view shows no readability finding for this project.` |
| :110 (base 256-258) | joined | joined |
| :111 (base 259-263) | `(em dash` glyph, `ellipsis` glyph, `arrows` glyphs, `en dash` glyph, `curly quotes, math glyphs)`; `the remove-unicode skill does this comprehensively with a verification gate` | `(em dash, ellipsis character, arrow characters, en dash, curly quotes, math glyphs; LC_ALL=C grep -n '[^ -~]' finds them)`; `oculus's writing rules find them in Markdown, YAML and comments` |
| :112 (base 264-265) | joined | joined |
| :113 (base 266-270) | `no code/ prefix - in the deposit` | `no code/ prefix: in the deposit` |
| :114 (base 271-272) | joined | joined |
| :118 (base 276-277) | `(run /project-new first to standardize a non-conforming folder)` | `(Make Folder a Project, in oculus's Files view, writes a non-conforming folder's project.yml; lay out the rest by the hub README.md's "Project layout and tiers" first)` |

### Hub configuration and tasks

| Now | Before | After |
|---|---|---|
| `.gitignore:51` | `by convention (registries/data.yml` | `by convention (.oculus/data/research/data.yml` |
| `.gitignore` base 123 | `# -- Generated present artifact (rebuilt by its own build) --` | deleted |
| `.gitignore` base 124 | `/tools/present/present.html` | deleted |
| `.gitignore` base 125 | (blank line) | deleted |
| `.gitignore:124` | `The scout feeds live in /feeds/` | `The scout feeds live in /.oculus/data/` |
| `.gitignore:126` | `the Lit Watch radar (feeds/literature-radar.yml)` | `the Lit Watch radar (.oculus/data/literature/radar.yml)` |
| `.oculus/config.yml:3` | `..., the command that recovers a dataset, the cluster ..., and the wallpaper image.`; `the entries of registries/domains.yml`; `of registries/venues.yml and registries/data.yml` | `..., the cluster ..., the wallpaper image, and the hub's own words: the career card's host statuses, score axes and score hues, and the fit colours of the Position Leads.`; added `The hub's data files are at oculus's own paths under .oculus/data/ (its config/sources.yml), so this file names no collections: list and no career_file; a missing file of that list is a finding, since the hub holds the folder.`; `the entries of .oculus/data/pillars/domains.yml`; `of .oculus/data/research/venues.yml and .oculus/data/research/data.yml` |
| `.oculus/config.yml` base 29 | `# Collection views: one card list per key, ...` (the comment of the `collections:` list) | deleted |
| `.oculus/config.yml` base 30 | `collections:` | deleted |
| `.oculus/config.yml` base 31 to 47 | the 17 rows `- { key: data, file: "registries/data.yml" }`, `venues`, `pillars`, `domains`, `statements` (`registries/boilerplate.yml`), `people`, `organisations`, `resources`, `funding` (`funding/funding.yml`), `events` (`network/events.yml`), `education`, `applications`, `joint-work`, `tasks` (`tasks/tasks.yml`), `literature` (`registries/literature.yml`), `leads` (`feeds/position-leads.yml`), `radar` (`feeds/literature-radar.yml`), one per line | deleted (17 lines) |
| `.oculus/config.yml` base 48 | (blank line) | deleted |
| `.oculus/config.yml` base 55 | `# Career strategy: ... live in registries/career.yml ...` | deleted |
| `.oculus/config.yml` base 56 | `career_file: registries/career.yml` | deleted |
| `.oculus/config.yml` base 57 | (blank line) | deleted |
| `.oculus/config.yml` base 64 | `# The command the Data view's Recover control runs for one dataset, ...` | deleted |
| `.oculus/config.yml` base 65 | `recover_command: python3 tools/data/redownload.py {key}` | deleted |
| `.oculus/config.yml` base 66 | (blank line) | deleted |
| `.oculus/config.yml:54` | `- 'feeds/literature-radar.yml'` | `- '.oculus/data/literature/radar.yml'` |
| `.oculus/config.yml:55` | `- 'feeds/position-leads.yml'` | `- '.oculus/data/academic/leads.yml'` |
| `.oculus/config.yml` base 87 to 93 | `- 'tools/present/assets/**'`, `- 'registries/*.yml'`, `- 'funding/funding.yml'`, `- 'network/*.yml'`, `- 'applications/applications.yml'`, `- 'education/education.yml'`, `- 'tasks/tasks.yml'` | deleted (7 lines) |
| `.oculus/config.yml:61` | (none) | `- '.oculus/data/**/*.yml'` |
| `.oculus/config.yml:64` | `a cluster entry of registries/resources.yml` | `a cluster entry of .oculus/data/research/resources.yml` |
| `.oculus/config.yml:71` | (none) | (blank line) |
| `.oculus/config.yml:72` | (none) | `# The host pipeline of the Focus board's career card: each status ...` |
| `.oculus/config.yml:73` | (none) | `career_host_status:` |
| `.oculus/config.yml:74` | (none) | `awaiting:  { icon: inbox, label: "sent, awaiting", color: "#0891b2", in_flight: true, waiting: true }` |
| `.oculus/config.yml:75` | (none) | `warm:      { icon: fire, label: "warm",            color: "#ea580c", in_flight: true }` |
| `.oculus/config.yml:76` | (none) | `candidate: { icon: white, label: "candidate",      color: "#64748b", default: true }` |
| `.oculus/config.yml:77` | (none) | `drafted:   { icon: writing, label: "drafted",      color: "#b45309" }` |
| `.oculus/config.yml:78` | (none) | `dropped:   { icon: fail, label: "dropped",         color: "#9ca3af" }` |
| `.oculus/config.yml:79` | (none) | (blank line) |
| `.oculus/config.yml:80` | (none) | `# The scored axes of a host on the career card: ...` |
| `.oculus/config.yml:81` | (none) | `career_score_dims:` |
| `.oculus/config.yml:82` | (none) | `- { field: proposal,     badge: "P",  label: "proposal" }` |
| `.oculus/config.yml:83` | (none) | `- { field: ai_fl_clinic, badge: "AF", label: "AI+FL+clinic" }` |
| `.oculus/config.yml:84` | (none) | `- { field: backing,      badge: "B",  label: "backing" }` |
| `.oculus/config.yml:85` | (none) | `- { field: after,        badge: "Z",  label: "after / ZAP" }` |
| `.oculus/config.yml:86` | (none) | (blank line) |
| `.oculus/config.yml:87` | (none) | `# The hue a host's score chip is drawn in, ...` |
| `.oculus/config.yml:88` | (none) | `career_score_tones: { strong: green, good: cyan, weak: red }` |
| `.oculus/config.yml:89` | (none) | (blank line) |
| `.oculus/config.yml:90` | (none) | `# The colour of a Position Lead's fit chip, by its fit.` |
| `.oculus/config.yml:91` | (none) | `leads_fit: { strong: "#16a34a", moderate: "#b45309", reach: "#9ca3af" }` |
| `.oculus/tasks/linkedin.md:9` | `` vs `linkedin_cadence_days` (oculus's `behavior.yml`, default 30) `` | `` vs `linkedin_cadence_days` (under `focus:` in oculus's `behavior.yml`, default 30) `` |
| `.oculus/tasks/litwatch.md:3` | `` lives in `feeds/literature-radar.yml` (the file the `radar` key of `.oculus/config.yml` names) `` | `` lives in `.oculus/data/literature/radar.yml` (the file of the `radar` key, at oculus's default path) `` |
| `.oculus/tasks/litwatch.md:25` | `` Load the ledger `feeds/literature-radar.yml` `` | `` Load the ledger `.oculus/data/literature/radar.yml` `` |
| `.oculus/tasks/scout.md:3` | `` live in `feeds/position-leads.yml` (the file the `leads` key of `.oculus/config.yml` names) `` | `` live in `.oculus/data/academic/leads.yml` (the file of the `leads` key, at oculus's default path) `` |
| `.oculus/tasks/scout.md:60` | `` **`feeds/position-leads.yml`** `` | `` **`.oculus/data/academic/leads.yml`** `` |
| `.oculus/tasks/scout.md:63` | `` to `position-leads.yml`'s `entries:` `` | `` to `leads.yml`'s `entries:` `` |
| `.oculus/tasks/scout.md:91` | `` Touch ONLY `position-leads.yml`. `` | `` Touch ONLY `leads.yml`. `` |

The values of `career_host_status`, `career_score_dims` and `leads_fit` are the base's rows of oculus's `config/catalogs/vocab.yml`, moved as Part 13 item 5 says; `career_score_tones` is the base's `TIER_TONE` of `CareerHosts.svelte`.

### Moved data files

| Now | Before | After |
|---|---|---|
| `.oculus/data/research/statements.yml:3` | `Mirrors the funding/funding.yml statement: pattern` | `Mirrors the .oculus/data/academic/funding.yml statement: pattern` |
| `.oculus/data/research/resources.yml:29` | `every dataset registered in registries/data.yml` | `every dataset registered in .oculus/data/research/data.yml` |
| `.oculus/data/academic/leads.yml:601` | `(see registries/career.yml + the UAntwerpen inquiry note)` | `(see .oculus/data/academic/career.yml + the UAntwerpen inquiry note)` |
| `.oculus/data/people/people.yml:5` | `are keys of registries/organisations.yml` | `are keys of .oculus/data/people/organisations.yml` |
| `.oculus/data/people/organisations.yml:2` | `in registries/people.yml and ... in funding/funding.yml are` | `in .oculus/data/people/people.yml and ... in .oculus/data/academic/funding.yml are` |
| `.oculus/data/pillars/pillars.yml:8` | `axis, registries/domains.yml.` | `axis, .oculus/data/pillars/domains.yml.` |
| `.oculus/data/academic/career.yml:2` | `` `deadline:` on funding/funding.yml entries `` | `` `deadline:` on .oculus/data/academic/funding.yml entries `` |
| `.oculus/data/academic/career.yml:23` | `a key of career_score_dims in vocab.yml` | `a key of career_score_dims in the hub's .oculus/config.yml` |
| `.oculus/data/academic/joint-work.yml:2` | `is lives in registries/people.yml;` | `is lives in .oculus/data/people/people.yml;` |
| `.oculus/data/academic/joint-work.yml:6` | `Who each person is lives in registries/people.yml;` | `Who each person is lives in .oculus/data/people/people.yml;` |
| `.oculus/data/academic/joint-work.yml:11` | `help: "The person's key in registries/people.yml."` | `help: "The person's key in .oculus/data/people/people.yml."` |

### Hub documents

| Now | Before | After |
|---|---|---|
| `README.md:6` | `` This hub names its own files under `collections:` in `.oculus/config.yml`. `` | `` This hub keeps those files at oculus's own paths under `.oculus/data/`, one folder per kind (`research/`, `pillars/`, `literature/`, `people/`, `academic/`), so its `.oculus/config.yml` names no `collections:` list. `` |
| `README.md:10` | `` `registries/data.yml` records it and `tools/data/redownload.py` fetches it again, which the Data view's Recover runs (`recover_command` in `.oculus/config.yml`). `` | `` `.oculus/data/research/data.yml` records it with its folder (`path:`) and its sources (`retrieval:`), and oculus's Recover, opened from a dataset's card in the Data view, fetches, checks and unpacks it again on this Mac or on the cluster. `` |
| `README.md:18` | `` `registries/data.yml` is the catalogue: each entry carries its source URL, access terms, and retrieval notes, and `tools/data/redownload.py` automates the open ones. `` | `` `.oculus/data/research/data.yml` is the catalogue: each entry carries its folder, its access terms and its typed sources, and oculus's Recover fetches every set whose sources it can run, the credentialed PhysioNet, Kaggle and Synapse sets with the accounts of the `downloads:` rows of `.oculus/local.yml`. `` |
| `README.md:60` | `` drawn by oculus's Present view; `tools/present/` is an older showcase and is no longer rebuilt. `` | `drawn by oculus's Present view.` |
| `README.md:65` | `` `registries/venues.yml`: the verified-venue check and cross marks. `` | `` `.oculus/data/research/venues.yml`: the verified-venue check and cross marks. `` |
| `README.md:66` | `` `applications/`, `funding/`, `education/`, `network/`, `tasks/` yml: one `help:` line each `` | `` The `applications.yml`, `funding.yml`, `education.yml`, `events.yml` and `tasks.yml` of `.oculus/data/academic/`: one `help:` line each `` |
| `CONTEXT.md:9` | `` lives in **`registries/venues.yml`** `` | `` lives in **`.oculus/data/research/venues.yml`** `` |
| `docs/RESEARCH-APPROACH.md:57` | `` `registries/venues.yml` holds the venue reference `` | `` `.oculus/data/research/venues.yml` holds the venue reference `` |
| `docs/RESEARCH-APPROACH.md:88` | `` `funding/funding.yml` ... `education/education.yml` `` | `` `.oculus/data/academic/funding.yml` ... `.oculus/data/academic/education.yml` `` |
| `docs/RESEARCH-APPROACH.md:90` | `` `registries/people.yml` is a registry `` | `` `.oculus/data/people/people.yml` is a registry `` |
| `docs/figures/gen_figures.py:168` | `read live from registries/pillars.yml` | `read live from .oculus/data/pillars/pillars.yml` |
| `docs/figures/gen_figures.py:176` | `os.path.join(ROOT, "registries", "pillars.yml")` | `os.path.join(ROOT, ".oculus", "data", "pillars", "pillars.yml")` |
| `docs/figures/gen_figures.py:402` | `pal = {k: (d or {}).get("color", MUTED) for k, d in (v.get("status_palette") or {}).items()}` | `statuses = v.get("statuses") or {}` |
| `docs/figures/gen_figures.py:403` | `return pal, list(v.get("archive_categories") or [])` | `pal = {k: d["color"] for k, d in statuses.items() if isinstance(d, dict) and "color" in d}` |
| `docs/figures/gen_figures.py:404` | (none) | `return pal, list(v.get("archive_order") or [])` |
| `docs/figures/gen_figures.py:514` | `"registries/venues.yml"` | `".oculus/data/research/venues.yml"` |
| `docs/figures/hub-map.svg:38` | `>registries/venues.yml</text>` | `>.oculus/data/research/venues.yml</text>` |
| `tools/skills/catalog.yaml:343` | `Pairs with the hub's own registries/venues.yml.` | `Pairs with the hub's own .oculus/data/research/venues.yml.` |
| `applications/information/uantwerpen-delputte-inquiry.md:45` | `Also logged in registries/career.yml dropped.` | `Also logged in .oculus/data/academic/career.yml dropped.` |
| `applications/information/vib-ai-aerts-inquiry.md:14` | `` (`registries/pillars.yml`, ...) `` | `` (`.oculus/data/pillars/pillars.yml`, ...) `` |
| `funding/2026-fwo-senior-stopped-meyfroidt/prep.md:25` | `` the uzleuven.be address in `registries/career.yml` `` | `` the uzleuven.be address in `.oculus/data/academic/career.yml` `` |
| `funding/2026-fwo-senior-stopped-meyfroidt/prep.md:122` | `` `registries/career.yml` says "no in-house FL lead" `` | `` `.oculus/data/academic/career.yml` says "no in-house FL lead" `` (the line also names Fabian G<u with diaeresis>iza, unchanged) |
| `funding/2026-fwo-senior-stopped-meyfroidt/README.md:21` | `` `registries/career.yml` said "no in-house FL lead" `` | `` `.oculus/data/academic/career.yml` said "no in-house FL lead" `` (the line also names Fabian G<u with diaeresis>iza, unchanged) |
| `funding/2026-fwo-senior-stopped-meyfroidt/README.md:45` | `` update `registries/career.yml`, `network/joint-work.yml` `` | `` update `.oculus/data/academic/career.yml`, `.oculus/data/academic/joint-work.yml` `` |
| `funding/about-axel/about-axel-meyfroidt.html:10` | `/* ---- deck.css (reused from tools/present) ---- */` | `/* ---- deck.css (the portfolio deck's look) ---- */` |
| `funding/about-axel/about-axel-meyfroidt.html:353` | `/* deck.js (reused from tools/present) */` | `/* deck.js (the portfolio deck's look) */` |
| `funding/about-axel/about-axel.html:10` | `/* ---- deck.css (reused from tools/present) ---- */` | `/* ---- deck.css (the portfolio deck's look) ---- */` |
| `funding/about-axel/about-axel.html:328` | `/* deck.js (reused from tools/present) */` | `/* deck.js (the portfolio deck's look) */` |
| `funding/about-axel/README.md:3` | `` in the same look as `tools/present`. `` | `in the portfolio deck's look.` |
| `funding/about-axel/README.md:22` | `` CSS and JS are inlined verbatim from the `tools/present` deck (`deck.css` / `deck.js`), so the look tracks the portfolio deck. `` | `The CSS and JS are inlined in each page, in the portfolio deck's look.` |

### Project documents and code

| Now | Before | After |
|---|---|---|
| `projects/active/eeg-saad-challenge/README.md:29` | `` registered in `registries/data.yml` `` | `` registered in `.oculus/data/research/data.yml` `` |
| `projects/active/eeg-saad-challenge/README.md:64` | `` (keys and recovery recipes in `registries/data.yml`), then replace each entry's planned `hpc_path` with the real one. `` | `` (keys and sources in `.oculus/data/research/data.yml`, each entry's `path:` naming its folder) with oculus's Recover, opened from each set's card in the Data view. `` |
| `projects/active/eeg-saad-challenge/README.md:69` | `` in `registries/venues.yml` `` | `` in `.oculus/data/research/venues.yml` `` |
| `projects/active/linfoot-estimator/README.md:33` | `` `registries/venues.yml` currently has no entry `` | `` `.oculus/data/research/venues.yml` currently has no entry `` |
| `projects/active/loewner/README.md:33` | `` registered in `registries/data.yml` `` | `` registered in `.oculus/data/research/data.yml` `` |
| `projects/ideas/block-term-nca/README.md:39` | `` Registry keys go in `registries/data.yml` `` | `` Registry keys go in `.oculus/data/research/data.yml` `` |
| `projects/ideas/multiway-biosignal-fm/README.md:36` | `` Registry keys go in `registries/data.yml` `` | `` Registry keys go in `.oculus/data/research/data.yml` `` |
| `projects/ideas/multiway-biosignal-fm/README.md:53` | `` register the keys in `registries/data.yml` `` | `` register the keys in `.oculus/data/research/data.yml` `` |
| ms-lipid-handshake `code/.depositignore:3` | `tools/deposit/deposit.py merges both into the public deposit's .gitignore.` | `oculus's Deposit writes the patterns of both into the deposit's .gitignore.` |
| ms-lipid-handshake `code/core/config.py:12` | `regenerable). The bulk (raw downloads and the` | `regenerable). The bulk lives outside the repo,` |
| ms-lipid-handshake `code/core/config.py:13` | `# caches built from them) lives outside the repo under MSLH_SCRATCH, so the tree holds no large files` | `# so the tree holds no large files and no symlink pointing at one machine's home directory: each raw` |
| ms-lipid-handshake `code/core/config.py:14` | `# and no symlink pointing at one machine's home directory.` | `# dataset in its own folder under ~/data, named by its key in the hub's dataset registry` |
| ms-lipid-handshake `code/core/config.py:15` | (none) | `# (.oculus/data/research/data.yml; MSLH_DATA moves the folder that holds them), and the caches built` |
| ms-lipid-handshake `code/core/config.py:16` | (none) | `# from them under MSLH_SCRATCH.` |
| ms-lipid-handshake `code/core/config.py:19` | `DATA = SCRATCH / "data"        # raw GEO / Zenodo downloads (large; kept out of the repo)` | `DATA_ROOT = Path(os.environ.get("MSLH_DATA", Path.home() / "data"))` |
| ms-lipid-handshake `code/core/config.py:20` | (none) | `RAW = {                        # raw GEO / Zenodo downloads, one folder per dataset (large; kept out of the repo)` |
| ms-lipid-handshake `code/core/config.py:21` | (none) | `"absinta": DATA_ROOT / "absinta-gse180759",` |
| ms-lipid-handshake `code/core/config.py:22` | (none) | `"jakel": DATA_ROOT / "jakel-gse118257",` |
| ms-lipid-handshake `code/core/config.py:23` | (none) | `"macnair": DATA_ROOT / "macnair2024",` |
| ms-lipid-handshake `code/core/config.py:24` | (none) | `"macnair_val": DATA_ROOT / "macnair2024" / "macnair_val",` |
| ms-lipid-handshake `code/core/config.py:25` | (none) | `}` |
| ms-lipid-handshake `code/core/config.py:32` | `ABSINTA_MATRIX = DATA / "absinta" / ...` | `ABSINTA_MATRIX = RAW["absinta"] / ...` |
| ms-lipid-handshake `code/core/config.py:33` | `ABSINTA_ANNOT = DATA / "absinta" / ...` | `ABSINTA_ANNOT = RAW["absinta"] / ...` |
| ms-lipid-handshake `code/core/config.py:34` | `JAKEL_MATRIX = DATA / "jakel" / ...` | `JAKEL_MATRIX = RAW["jakel"] / ...` |
| ms-lipid-handshake `code/core/config.py:35` | `JAKEL_ANNOT = DATA / "jakel" / ...` | `JAKEL_ANNOT = RAW["jakel"] / ...` |
| ms-lipid-handshake `code/experiments/build_macnair.py:19` | `MAC = C.DATA / "macnair"` | `MAC = C.RAW["macnair"]` |
| ms-lipid-handshake `code/experiments/compositional.py` base 31 | `DATA = C.DATA` | deleted |
| ms-lipid-handshake `code/experiments/compositional.py:90` | `MAC = DATA / cohort;` | `MAC = C.RAW[cohort];` |
| ms-lipid-handshake `code/paper.py:23` | `RAW = C.DATA             # raw downloads under $MSLH_SCRATCH/data (default ~/data/ms-lipid-handshake/data)` | `RAW = C.RAW              # raw downloads, one folder per dataset under $MSLH_DATA (default ~/data)` |
| ms-lipid-handshake `code/paper.py:29` | `if not (RAW / n).exists()` | `if not RAW[n].exists()` |
| ms-lipid-handshake `code/paper.py:38` | `missing raw data {missing_r} under {RAW}` | `missing raw data {[str(RAW[n]) for n in missing_r]}` |
| ms-lipid-handshake `code/README.md:26` | `` under `$MSLH_SCRATCH` (default `~/data/ms-lipid-handshake/`): the raw downloads in `$MSLH_SCRATCH/data/`, and the ... caches ... in `$MSLH_SCRATCH/cache/` ... Set `MSLH_SCRATCH` `` | `` Each raw download has its own folder under `$MSLH_DATA` (default `~/data`): `absinta-gse180759`, `jakel-gse118257` and `macnair2024`, with the Macnair validation cohort in `macnair2024/macnair_val`. The ... caches ... go to `$MSLH_SCRATCH/cache/` (default `~/data/ms-lipid-handshake/cache/`) ... Set `MSLH_DATA` or `MSLH_SCRATCH` `` |
| ms-lipid-handshake `code/README.md:57` | `` Put the raw data under `$MSLH_SCRATCH/data/` (filenames in `config.py`) `` | `` Put each raw dataset in its folder under `$MSLH_DATA` (folders and file names in `core/config.py`) `` |
| ms-lipid-handshake `code/README.md:68` | `` under `$MSLH_SCRATCH/` (default `~/data/ms-lipid-handshake/`), never in the repo: `data/` for the raw downloads and `cache/` for the caches `` | `` outside the repo: the raw downloads in their folders under `$MSLH_DATA` (default `~/data`) and the caches built from them in `$MSLH_SCRATCH/cache/` (default `~/data/ms-lipid-handshake/cache/`) `` |
| ms-lipid-handshake `README.md:93` | `` both stay out of the tree, under `$MSLH_SCRATCH/` ...: raw downloads in `data/`, caches in `cache/` ... The repo used to reach them through two symlinks ...; those are gone and the paths resolve from `MSLH_SCRATCH` with a `~`-relative fallback. Registry keys: ... `` | `` both stay out of the tree. Each raw download sits in the folder named by its registry key under `$MSLH_DATA` (default `~/data`): `absinta-gse180759`, `jakel-gse118257`, `macnair2024` (the validation cohort in `macnair2024/macnair_val`). The caches sit in `$MSLH_SCRATCH/cache/` ... (folders and filenames in `code/core/config.py`). `` |
| jacobian-coupled-blockterm-dp `code/.depositignore:1` | `tools/deposit/deposit.py merges this into the public` | `oculus's Deposit writes these patterns into the` |
| glassbox `code/hpc/build_raw_cache.slurm:19` | `$HOME/data/archive/mimic-iv-ecg-...-1.0.zip` | `$HOME/data/mimic-ecg/mimic-iv-ecg-...-1.0.zip` |
| glassbox `code/hpc/merge_raw_cache.slurm:15` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| glassbox `code/hpc/run_all.sh:25` | `[ -f "$HOME/data/archive/...zip" ]` | `[ -f "$HOME/data/mimic-ecg/...zip" ]` |
| glassbox `code/hpc/run_all.sh:26` | `"obtain from PhysioNet -> ~/data/archive/ (see code/README Data)"` | `"obtain from PhysioNet -> ~/data/mimic-ecg/ (see code/README Data)"` |
| glassbox `code/hpc/run_cpu.slurm:12` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| glassbox `code/hpc/run_feat_array.slurm:14` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| glassbox `code/hpc/run_gpu.slurm:14` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| glassbox `code/pipeline/cohort/mimic_cohort.py:21` | `"data/archive/mimic-iv-ecg-...zip"` | `"data/mimic-ecg/mimic-iv-ecg-...zip"` |
| glassbox `code/pipeline/core/config.py:42` | `data_root()/archive is the CANONICAL location: it is what code/README documents, what run_all.sh's` | `data_root()/mimic-ecg, the dataset's own folder, is the CANONICAL location: it is what code/README` |
| glassbox `code/pipeline/core/config.py:43` | `prereq check verifies, and where the cluster keeps it. It must be searched, or a job that does not` | `documents, what run_all.sh's prereq check verifies, and where every machine keeps it. It is searched` |
| glassbox `code/pipeline/core/config.py:44` | `export $MIMIC_ECG_ZIP dies mid-DAG with a misleading "missing zip" pointing at ~/downloads while the` | `first, so a job that does not export $MIMIC_ECG_ZIP finds the file the prereq check found.` |
| glassbox `code/pipeline/core/config.py` base 45 | `file sits in ~/data/archive and the prereq check passes.` | deleted |
| glassbox `code/pipeline/core/config.py:49` | `for cand in (data_root() / "archive" / MIMIC_ZIP_NAME,` | `for cand in (data_root() / "mimic-ecg" / MIMIC_ZIP_NAME,` |
| glassbox `code/pipeline/core/config.py:55` | `return data_root() / "archive" / MIMIC_ZIP_NAME` | `return data_root() / "mimic-ecg" / MIMIC_ZIP_NAME` |
| glassbox `code/README.md:117` | `` `~/data/archive/mimic-iv-ecg-...zip` `` | `` `~/data/mimic-ecg/mimic-iv-ecg-...zip` `` |
| glassbox `README.md:81` | `` `~/data/archive/mimic-...zip` `` | `` `~/data/mimic-ecg/mimic-...zip` `` |
| glassbox `README.md:84` | `` (`registries/data.yml`: `mimic-iv-ecg`, `code15`) `` | `` (`.oculus/data/research/data.yml`: `mimic-iv-ecg`, `code15`) `` |
| glassbox `README.md:101` | `` Push with `python3 tools/deposit/deposit.py glassbox-decision-pipelines --update --create`. `` | `Push it from oculus's Deposit view, opened from the project's card.` |
| glassbox `README.md:112` | `` but NOT `~/data/archive/`, which is where the zip actually lives and exactly what ...; the canonical `~/data/archive/` path is now searched first `` | `` but NOT the folder the zip lived in, which is exactly what ...; the canonical path, now the dataset's folder `~/data/mimic-ecg/`, is searched first `` |
| btfno `admin/build_supplement.sh:4` | `` (that one is `tools/deposit/deposit.py btfno`, which drops `` | `(that one is oculus's Deposit view, which drops` |
| btfno `CLAUDE.md:22` (and `AGENTS.md`, its link) | `` (`tools/deposit/deposit.py btfno`) `` | `(oculus's Deposit view)` |
| btfno `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| btfno `code/.depositignore:2` | `# deposit; the hub's root .gitignore` | `# deposit's .gitignore; the hub's root .gitignore` |
| btfno `README.md:102` | `` `tools/deposit/deposit.py` drops `results/` and `models/` `` | `` oculus's Deposit view drops `results/` and `models/` `` |
| bttd-source-eeg `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| bttd-source-eeg `code/.depositignore:2` | `# deposit; the hub's root .gitignore` | `# deposit's .gitignore; the hub's root .gitignore` |
| bttn-incident-af `CLAUDE.md:37` (and `AGENTS.md`, its link) | `` (from `funding/funding.yml`) `` | `` (from `.oculus/data/academic/funding.yml`) `` |
| bttn-incident-af `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| bttn-incident-af `code/.depositignore:2` | `# deposit; the project-root .gitignore` | `# deposit's .gitignore; the project-root .gitignore` |
| bttn-incident-af `code/core/config.py:33` | `# ECG waveform archive: on the HPC it lives at ~/data/archive/ (34 GB matched subset); on Axel's Mac it is` | `# ECG waveform archive (34 GB matched subset): it lives in the dataset's folder, ~/data/mimic-ecg/, on` |
| bttn-incident-af `code/core/config.py:34` | `# ~/Downloads/. Default to the HPC location (where the runs happen); override with AFNET_ECG_ZIP elsewhere.` | `# every machine; override with AFNET_ECG_ZIP elsewhere.` |
| bttn-incident-af `code/core/config.py:35` | `"~/data/archive/mimic-iv-ecg-...zip"` | `"~/data/mimic-ecg/mimic-iv-ecg-...zip"` |
| bttn-incident-af `code/run_all.sh:40` | `$DATA/archive/mimic-iv-ecg-...zip` | `$DATA/mimic-ecg/mimic-iv-ecg-...zip` |
| bttn-incident-af `code/run_all.sh:54` | `# PTB-XL (public): extract the COMPLETE record set to a canonical raw dir, then point $DATA/ptb-xl at` | `# PTB-XL (public): the zip PhysioNet serves lives in $DATA/ptb-xl under PhysioNet's own name, $P.zip,` |
| bttn-incident-af `code/run_all.sh:55` | `# it. Keying on ptb-xl-raw (not $DATA/ptb-xl) and always repointing the symlink means any stale/partial` | `# and holds one top folder, $P. Its database and 100 Hz records are extracted into $DATA/ptb-xl` |
| bttn-incident-af `code/run_all.sh:56` | `# pre-existing ptb-xl download is superseded, so the SR-vs-AF cohort is built from the full records.` | `# itself with that folder stripped, so ptbxl_database.csv and records100/ sit at the folder's top,` |
| bttn-incident-af `code/run_all.sh:57` | `PTBXL_ZIP="${AFNET_PTBXL_ZIP:-$DATA/archive/ptb-xl-1.0.3.zip}"` | `# where every reader expects them. A file already there is kept, and the database is written last,` |
| bttn-incident-af `code/run_all.sh:58` | (none) | `# so its presence means the records before it are complete.` |
| bttn-incident-af `code/run_all.sh:60` | `if [ ! -f "$DATA/ptb-xl-raw/$P/ptbxl_database.csv" ]; then` | `PTBXL_ZIP="${AFNET_PTBXL_ZIP:-$DATA/ptb-xl/$P.zip}"` |
| bttn-incident-af `code/run_all.sh:61` | (none) | `if [ ! -f "$DATA/ptb-xl/ptbxl_database.csv" ]; then` |
| bttn-incident-af `code/run_all.sh:63` | `echo "[run_all] extracting PTB-XL (database + 100 Hz records) from $PTBXL_ZIP (one-time) ..."` | `echo "[run_all] extracting PTB-XL (database + 100 Hz records) from $PTBXL_ZIP into $DATA/ptb-xl (one-time) ..."` |
| bttn-incident-af `code/run_all.sh:64` | `unzip -q -n "$PTBXL_ZIP" "$P/ptbxl_database.csv" "$P/records100/*" -d "$DATA/ptb-xl-raw"` | `python3 - "$PTBXL_ZIP" "$DATA/ptb-xl" "$P" <<'PY'` |
| bttn-incident-af `code/run_all.sh:65` to `:84` | (none) | the 20 lines of the heredoc: `import os`, `import shutil`, `import sys`, `import zipfile`, a blank line, `zip_path, out, top = sys.argv[1], sys.argv[2], sys.argv[3] + "/"`, `with zipfile.ZipFile(zip_path) as archive:`, `wanted = []`, `for info in archive.infolist():`, `rel = info.filename[len(top):] if info.filename.startswith(top) else ""`, `if not info.is_dir() and (rel == "ptbxl_database.csv" or rel.startswith("records100/")):`, `wanted.append((rel == "ptbxl_database.csv", rel, info))`, `for _, rel, info in sorted(wanted, key=lambda one: one[0]):`, `target = os.path.join(out, rel)`, `if os.path.exists(target):`, `continue`, `os.makedirs(os.path.dirname(target), exist_ok=True)`, `with archive.open(info) as source, open(target, "wb") as sink:`, `shutil.copyfileobj(source, sink)`, `PY` |
| bttn-incident-af `code/run_all.sh` base 67 | `if [ -f "$DATA/ptb-xl-raw/$P/ptbxl_database.csv" ]; then` | deleted |
| bttn-incident-af `code/run_all.sh` base 68 | `[ -L "$DATA/ptb-xl" ] \|\| rm -rf "$DATA/ptb-xl"     # drop a stale partial real-dir download` | deleted |
| bttn-incident-af `code/run_all.sh` base 69 | `ln -sfn "$DATA/ptb-xl-raw/$P" "$DATA/ptb-xl"` | deleted |
| bttn-incident-af `code/run_all.sh` base 70 | `fi` | deleted |
| bttn-incident-af `README.md:51` | `` Credentialed zip `~/data/archive/mimic-iv-ecg-...-1.0.zip` (34 GB); metadata to `~/data/mimic-ecg/` `` | `` Credentialed zip `~/data/mimic-ecg/mimic-iv-ecg-...-1.0.zip` (34 GB); metadata beside it in `~/data/mimic-ecg/` `` |
| bttn-incident-af `README.md:53` | `` `run_all.sh` extracts it from `~/data/archive/ptb-xl-1.0.3.zip` `` | `` `run_all.sh` extracts it into `~/data/ptb-xl/` from PhysioNet's zip there, `ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3.zip` `` |
| covert-applied `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| covert-applied `code/.depositignore:2` | `# deposit; the project-root .gitignore` | `# deposit's .gitignore; the project-root .gitignore` |
| covert-applied `code/experiments/extract_mimic_features.py:34` | `_ZIP_CANDS = [os.path.expanduser(p) for p in (f'~/data/{_ZIP_NAME}', f'~/data/archive/{_ZIP_NAME}')]` | `ECG_ZIP = os.environ.get('COVERT_MIMIC_ECG_ZIP', os.path.expanduser(f'~/data/mimic-ecg/{_ZIP_NAME}'))` |
| covert-applied `code/experiments/extract_mimic_features.py` base 35 | `ECG_ZIP = os.environ.get('COVERT_MIMIC_ECG_ZIP',` | deleted |
| covert-applied `code/experiments/extract_mimic_features.py` base 36 | `next((p for p in _ZIP_CANDS if os.path.exists(p)), _ZIP_CANDS[0]))` | deleted |
| covert-applied `README.md:52` | `` NB the ECG zip is at `~/data/archive/` (a cleanup moved it; the extractor searches both `~/data` and `~/data/archive`). `` | `` NB the ECG zip is in the dataset's folder, `~/data/mimic-ecg/`, where the extractor reads it (`COVERT_MIMIC_ECG_ZIP` overrides). `` |
| covert-theory `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| covert-theory `code/.depositignore:2` | `# deposit; the hub's root .gitignore` | `# deposit's .gitignore; the hub's root .gitignore` |
| covert-theory `README.md:45` | `` (no `registries/data.yml` keys) `` | `` (no `.oculus/data/research/data.yml` keys) `` |
| dongho-ecg-clustering `code/.depositignore:1` | `tools/deposit/deposit.py renames this to .gitignore in the` | `oculus's Deposit writes these patterns into the` |
| dongho-ecg-clustering `code/.depositignore:2` | `# public deposit; the hub's root .gitignore` | `# deposit's .gitignore; the hub's root .gitignore` |
| dongho-ecg-clustering `README.md:115` | `` the FAIR entry in `funding/funding.yml` `` | `` the FAIR entry in `.oculus/data/academic/funding.yml` `` |
| dries-bttr-ecg `code/.depositignore:1` | `tools/deposit/deposit.py merges this into the public` | `oculus's Deposit writes these patterns into the` |
| dries-bttr-ecg `README.md:63` | `` the FAIR entry in `funding/funding.yml` `` | `` the FAIR entry in `.oculus/data/academic/funding.yml` `` |
| ecg-readable-substrate `code/core/config.py:40` | `"""The MIMIC-IV-ECG matched-subset zip. Override with $MIMIC_ECG_ZIP; else search common spots."""` | `"""The MIMIC-IV-ECG matched-subset zip. Override with $MIMIC_ECG_ZIP; else search common spots.` |
| ecg-readable-substrate `code/core/config.py:41` | (none) | (blank docstring line) |
| ecg-readable-substrate `code/core/config.py:42` | (none) | `data_root()/mimic-ecg, the dataset's own folder, is the canonical location and is searched first.` |
| ecg-readable-substrate `code/core/config.py:43` | (none) | `"""` |
| ecg-readable-substrate `code/core/config.py:47` | `for cand in (_home() / "downloads" / MIMIC_ZIP_NAME,` | `for cand in (data_root() / "mimic-ecg" / MIMIC_ZIP_NAME,` |
| ecg-readable-substrate `code/core/config.py:48` | (none) | `_home() / "downloads" / MIMIC_ZIP_NAME,` |
| ecg-readable-substrate `code/core/config.py:53` | `return _home() / "downloads" / MIMIC_ZIP_NAME     # canonical default` | `return data_root() / "mimic-ecg" / MIMIC_ZIP_NAME   # canonical default` |
| ecg-readable-substrate `code/hpc/build_raw_cache.slurm:17` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| ecg-readable-substrate `code/hpc/extract_embeddings.slurm:25` | `The MIMIC zip lives under data/archive/ here (config looks in` | `The MIMIC zip lives in its dataset's folder, ~/data/mimic-ecg/,` |
| ecg-readable-substrate `code/hpc/extract_embeddings.slurm:26` | `# ~/downloads), so point at it.` | `# which the config also searches first.` |
| ecg-readable-substrate `code/hpc/extract_embeddings.slurm:27` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| ecg-readable-substrate `code/hpc/run_all.sh:48` | `[ -f "$HOME/data/archive/...zip" ]` | `[ -f "$HOME/data/mimic-ecg/...zip" ]` |
| ecg-readable-substrate `code/hpc/run_all.sh:49` | `-> ~/data/archive/ (see code/README Data)` | `-> ~/data/mimic-ecg/ (see code/README Data)` |
| ecg-readable-substrate `code/hpc/run_cpu.slurm:19` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| ecg-readable-substrate `code/hpc/run_gpu.slurm:24` | `$HOME/data/archive/...` | `$HOME/data/mimic-ecg/...` |
| ecg-readable-substrate `code/README.md:31` | `` zip at `~/data/archive/` `` | `` zip at `~/data/mimic-ecg/` `` |
| ecg-readable-substrate `code/tier0/gate.py:33` | `"data/archive/mimic-iv-ecg-...zip"` | `"data/mimic-ecg/mimic-iv-ecg-...zip"` |
| ecg-readable-substrate `README.md:61` | `` read in place at `~/data/archive/` `` | `` read in place at `~/data/mimic-ecg/` `` |
| fed-multicellular-immune `CLAUDE.md:12` (and `AGENTS.md`, its link) | `` Public CELLxGENE atlases stream to `~/data/fed-immune-tensor/` `` | `` Public CELLxGENE atlases sit in `~/data/<registry key>/` and stream to the caches in `~/data/fed-immune-tensor/cache/` `` |
| fed-multicellular-immune `code/.depositignore:1` | `tools/deposit/deposit.py merges this into the public` | `oculus's Deposit writes these patterns into the` |
| fed-multicellular-immune `code/core/build_covid.py:23` | `h5py.File(C.DATA / "covid.h5ad", "r")` | `h5py.File(C.h5ad("covid.h5ad"), "r")` |
| fed-multicellular-immune `code/core/build_generic.py:9` | `<h5ad_filename_in_DATA>` | `<h5ad_filename_in_config.H5AD_KEYS>` |
| fed-multicellular-immune `code/core/build_generic.py:21` | `path = C.DATA / fname` | `path = C.h5ad(fname)` |
| fed-multicellular-immune `code/core/build_ibd.py:21` | `h5py.File(C.DATA / "ibd.h5ad", "r")` | `h5py.File(C.h5ad("ibd.h5ad"), "r")` |
| fed-multicellular-immune `code/core/config.py:11` | `# All local data lives under ~/data/<dataset>; override the root with FED_IMMUNE_ROOT if it sits` | `# All local data lives under ~/data/<dataset>. Each CELLxGENE atlas sits in the folder named by its` |
| fed-multicellular-immune `code/core/config.py:12` | `# elsewhere. Never hardcode an absolute /Users/... path here.` | `# key in the hub's dataset registry (.oculus/data/research/data.yml) under FED_IMMUNE_DATA (default` |
| fed-multicellular-immune `code/core/config.py:13` | (none) | `# ~/data); the pseudobulk caches built from them sit under FED_IMMUNE_ROOT (default` |
| fed-multicellular-immune `code/core/config.py:14` | (none) | `# ~/data/fed-immune-tensor). Never hardcode an absolute /Users/... path here.` |
| fed-multicellular-immune `code/core/config.py:15` | (none) | `DATA_ROOT = Path(os.environ.get("FED_IMMUNE_DATA", Path.home() / "data"))` |
| fed-multicellular-immune `code/core/config.py` base 14 | `DATA = ROOT / "data"` | deleted |
| fed-multicellular-immune `code/core/config.py` base 16 | `H5AD = DATA / "lupus.h5ad"` | deleted |
| fed-multicellular-immune `code/core/config.py:19` to `:39` | (none) | the 21 lines: `# The registry key of each atlas file, which names the folder the file sits in.`, `H5AD_KEYS = {`, the nine rows `"lupus.h5ad": "cellxgene-lupus"`, `"covid.h5ad": "cellxgene-covid"`, `"ibd.h5ad": "cellxgene-ibdverse"`, `"lung.h5ad": "cellxgene-lung-ild"`, `"liver.h5ad": "cellxgene-liver-psc"`, `"heart.h5ad": "cellxgene-heart-dcm"`, `"kidney.h5ad": "cellxgene-kidney"`, `"ifald.h5ad": "cellxgene-ifald-liver"`, `"cf.h5ad": "cellxgene-cf-airway"`, `}`, two blank lines, `def h5ad(fname):`, `"""The path of one atlas file, in the folder of its registry key."""`, `return DATA_ROOT / H5AD_KEYS[fname] / fname`, two blank lines, `H5AD = h5ad("lupus.h5ad")`, a blank line |
| fed-multicellular-immune `code/paper.py:6` | `downloaded to ~/data/fed-immune-tensor/data/` | `downloaded to ~/data/<registry key>/` |
| fed-multicellular-immune `code/paper.py:53` | `if (C.DATA / fname).exists():` | `if C.h5ad(fname).exists():` |
| fed-multicellular-immune `code/paper.py:58` | `print(f"   (skip {prefix}: {fname} not in {C.DATA})")` | `print(f"   (skip {prefix}: {C.h5ad(fname)} not found)")` |
| fed-multicellular-immune `code/paper.py:59` | `if (C.DATA / "lung.h5ad").exists():` | `if C.h5ad("lung.h5ad").exists():` |
| fed-multicellular-immune `code/README.md:28` | `` into `~/data/fed-immune-tensor/data/` (path configurable in `core/config.py`): `` | `` into its own folder under `~/data/` (set `FED_IMMUNE_DATA` to use another root; the folders are in `core/config.py`'s `H5AD_KEYS`): `` |
| fed-multicellular-immune `code/README.md:32` | `` `lupus.h5ad` `` | `` `cellxgene-lupus/lupus.h5ad` `` |
| fed-multicellular-immune `code/README.md:33` | `` `covid.h5ad` `` | `` `cellxgene-covid/covid.h5ad` `` |
| fed-multicellular-immune `code/README.md:34` | `` `ibd.h5ad` `` | `` `cellxgene-ibdverse/ibd.h5ad` `` |
| fed-multicellular-immune `code/README.md:35` | `` `lung.h5ad` `` | `` `cellxgene-lung-ild/lung.h5ad` `` |
| fed-multicellular-immune `code/README.md:36` | `` `liver.h5ad` `` | `` `cellxgene-liver-psc/liver.h5ad` `` |
| fed-multicellular-immune `README.md:47` | `` Streamed to pseudobulk caches under `~/data/fed-immune-tensor/` `` | `` Each atlas sits in the folder named by its key under `~/data/`, and is streamed to pseudobulk caches under `~/data/fed-immune-tensor/cache/` `` |
| hccnet-revision `code/.depositignore:1` | `tools/deposit/deposit.py merges this into the public` | `oculus's Deposit writes these patterns into the` |
| meseret-cirrhosis `code/.depositignore:2` | `tools/deposit/deposit.py merges this into the public` | `oculus's Deposit writes these patterns into the` |
| raw-pls `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| raw-pls `code/.depositignore:2` | `# deposit; the project-root .gitignore` | `# deposit's .gitignore; the project-root .gitignore` |
| raw-pls `code/attic/external_validation/build_ped.py:11` | `--root ~/data/BraTS-PED-Train --out ~/data/BraTS-PED/ped_struct.npz` | `--root ~/data/BraTS-METS/BraTS-PED/unzipped --out ~/data/BraTS-METS/BraTS-PED/ped_struct.npz` |
| raw-pls `code/attic/external_validation/ped_probe.slurm:14` | `Z="$HOME/data/BraTS-METS/BraTS-PED/ASNR-...-TrainingData.zip"` | `PED="$HOME/data/BraTS-METS/BraTS-PED"` |
| raw-pls `ped_probe.slurm:15` | `[ -d "$HOME/data/PED_unzip" ] \|\| unzip -n -q "$Z" -d "$HOME/data/PED_unzip"` | `Z="$PED/ASNR-...-TrainingData.zip"` |
| raw-pls `ped_probe.slurm:16` | `CACHE="$HOME/data/BraTS-PED/ped_struct.npz"; mkdir -p "$HOME/data/BraTS-PED"` | `[ -d "$PED/unzipped" ] \|\| unzip -n -q "$Z" -d "$PED/unzipped"` |
| raw-pls `ped_probe.slurm:17` | `"$PY" campaigns/brats_realdata/build_ped.py --root "$HOME/data/PED_unzip" --out "$CACHE"` | `CACHE="$PED/ped_struct.npz"` |
| raw-pls `ped_probe.slurm:18` | (none) | `"$PY" campaigns/brats_realdata/build_ped.py --root "$PED/unzipped" --out "$CACHE"` |
| ward-bttr-crosssubject `code/.depositignore:1` | `deposit.py renames this to .gitignore in the public` | `oculus's Deposit writes these patterns into the` |
| ward-bttr-crosssubject `code/.depositignore:2` | `# deposit; the hub's root .gitignore` | `# deposit's .gitignore; the hub's root .gitignore` |

## The registry's entries and their kinds

`.oculus/data/research/data.yml`, rewritten by hand: 54 entries on the base (`grep -c "^  - key:"` on `O38-base/registries/data.yml`), 63 now. Each entry's `retrieval:` is a list of typed sources (kinds from `awk` over the `- kind:` rows), and its `path:` the folder (`awk` over `path:`). "Base method" is the base's `retrieval.method`.

| Key | Base method | Kinds now | `path:` |
|---|---|---|---|
| mimic-iv | physionet | physionet | `~/data/mimic-iv` |
| pmc-patients | direct | huggingface | `~/data/pmc-patients` |
| mimic-iv-note | physionet | physionet | `~/data/mimic-iv-note` |
| mimic-iv-ecg | physionet_zip | physionet, physionet | `~/data/mimic-ecg` |
| ptb-xl | physionet_zip | physionet | `~/data/ptb-xl` |
| mitdb | physionet | physionet | `~/data/mit-bih` |
| code15 | zenodo | zenodo | `~/data/code15` |
| bci-iv-4 | manual | request | `~/data/bci-iv-4` |
| stanford_fingerflex | manual | stanford | `~/data/stanford_fingerflex` |
| ajile12 | script | dandi | `~/data/ajile12` |
| miller-ecog-library | script | stanford | `~/data/miller-ecog-library` |
| way-eeg-gal | script | figshare | `~/data/way-eeg-gal` |
| way-eeg-gal-cache (new) | - | derived | `~/data/way-eeg-gal_cache` |
| corteg_stanford_ourprotocol | script | derived | `~/data/corteg_stanford_ourprotocol` |
| brats2020 | manual | kaggle | `~/data/BraTS2020_train` |
| brats2020-cache (new) | - | derived | `~/data/BraTS2020` |
| lld-mmri-medsam2 | manual | huggingface | `~/data/LLD-MMRI-MedSAM2` |
| hccnet-mri | private | request | `/deepstore/datasets/bms/hcc_study` |
| brats2021 | manual | kaggle | `~/data/BraTS2021_raw` |
| brats2021-cache (new) | - | derived | `~/data/BraTS2021` |
| brats21-examples (new) | - | derived | `~/data/brats21_examples` |
| brats-2023-synapse | manual | synapse | `~/data/BraTS-METS` |
| isles24 | manual | zenodo | `~/data/ISLES24` |
| picai | zenodo | zenodo, url | `~/data/PICAI` |
| acdc | manual | huggingface | `~/data/ACDC` |
| ddsm | manual | tcia | `~/data/ddsm` |
| pdebench | manual | none (`retrieval: []`, first line) | `~/data/pdebench` |
| neuralop-darcy | library | library | none (the library keeps it) |
| neuralop-navier-stokes | library | library | none (the library keeps it) |
| mne-sample | library | library | `~/data/mne/MNE-sample-data` |
| ny-head | manual | url | `~/data/nyhead` |
| mne-fsaverage | library | library | `~/data/mne/MNE-fsaverage-data` |
| aad-dtu | manual | zenodo | `~/data/aad-dtu` |
| aad-kul | manual | zenodo | `~/data/aad-kul` |
| aad-kul-av-gc | manual | zenodo | `~/data/aad-kul-av-gc` |
| aad-kul-hd | manual | zenodo | `~/data/aad-kul-hd` |
| aad-ustc | manual | zenodo | `~/data/aad-ustc` |
| absinta-gse180759 | manual | geo | `~/data/absinta-gse180759` |
| jakel-gse118257 | manual | geo | `~/data/jakel-gse118257` |
| macnair2024 | zenodo | zenodo | `~/data/macnair2024` |
| ms-lipid-handshake (new) | - | derived | `~/data/ms-lipid-handshake` |
| cellxgene-lupus | manual | url | `~/data/cellxgene-lupus` |
| cellxgene-covid | manual | url | `~/data/cellxgene-covid` |
| cellxgene-ibdverse | manual | url | `~/data/cellxgene-ibdverse` |
| cellxgene-lung-ild | manual | url | `~/data/cellxgene-lung-ild` |
| cellxgene-liver-psc | manual | url | `~/data/cellxgene-liver-psc` |
| cellxgene-heart-dcm | manual | url | `~/data/cellxgene-heart-dcm` |
| cellxgene-kidney | manual | url | `~/data/cellxgene-kidney` |
| cellxgene-ifald-liver | manual | url | `~/data/cellxgene-ifald-liver` |
| cellxgene-cf-airway | manual | url | `~/data/cellxgene-cf-airway` |
| fed-immune-tensor (new) | - | derived | `~/data/fed-immune-tensor` |
| fed-faithful-ecg-cache (new) | - | derived | `~/data/fed-faithful-ecg-cache` |
| ecg-readable-substrate (new) | - | derived | `~/data/ecg-readable-substrate` |
| glassbox-decision-pipelines (new) | - | derived | `~/data/glassbox-decision-pipelines` |
| pbc-cirrhosis | library | library (`ucimlrepo.fetch_ucirepo(id=878)`, first line) | none |
| support | library | library | none |
| metabric | library | library | none |
| gbsg | library | library | none |
| wisconsin-breast-cancer | library | library | none |
| msbase | manual | request | none (held by its owners) |
| linfoot-sim | private | request | `~/data/linfoot` |
| ml4af | private | request | `~/data/ml4af` |
| ucr-nback-eeg | private | request | `~/data/ucr-nback-eeg` |

The nine new entries are the derived sets and caches that project code writes under `~/data` and that the base registry did not list. Counts: `grep -c "^  - key:"` gives 54 on `O38-base/registries/data.yml` and 63 on `.oculus/data/research/data.yml`; `awk` over the `path:` rows gives 55 entries with a path; `grep -n "retrieval: \[\]"` gives only line 595 (pdebench). Base methods by `awk` over `method:`: manual 28, library 9, physionet 3, physionet_zip 2, private 4, script 4, zenodo 3, direct 1.

## Judgment calls

Each was a choice the brief left open; the evidence is the command or the file:line given.

- The recorded fixtures' `.headers` files carry CRLF line ends (`grep -c $'\r' O38-fixtures/figshare-collection.headers`: 11). The copies under `tests/server/machine/runs/recover/answers/` are written with LF (`grep -c $'\r'` on `answers/figshare/collection.headers`: 0), because the tree's ASCII gate refuses a CR; the `.body` files are byte-identical (`cmp answers/figshare/collection.body O38-fixtures/figshare-collection.body`: no output). The brief says to copy the fixtures as they are (section 14).
- The palette hints: `config/text/app.yml:69` `cmd_theme_hint: '<theme>'` and `:49` `cmd_file_icons_hint: '<file icon theme>'`, in the form of the other argument hints, in place of the inline list of theme names.
- `tests/server/machine/runs/recover/runs.test.ts:175,186` wait up to `timeout: 10000` for a real child process to start and to end.
- `CardAction` moved to `src/lib/views/shared/card/card.ts:20`, so the dataset card and the other cards import it from one place.
- The rice toggles: Brackets off puts `rice-plain` on the body and Monospace off puts `rice-sans` (`src/lib/ui/theme/theme.ts:44,50,119-120`); each rule selects `body.rice:where(:not(.rice-plain))` or `body.rice:where(:not(.rice-sans))`, so the `:where()` adds no specificity and every rule keeps its base cascade order.
- A rail row whose `chord` is not one lowercase letter, or whose `group_glyph` is not a name in glyphs.yml, a number included, is a finding and is read as no chord or no group glyph, the button kept (`tests/data/sources/config/rail.test.ts:53-75`).
- A `counts:` row's `match` written as one word is read as a list of that one word (`src/lib/state/workbench/rail-badges/rail-badges.ts:33-34`), as the options catalog's rule for a multi reads a single string (`value-rule.ts:139-140`).
- A `counts:` row naming a view that draws no count, or a field that row does not take (`days` on funding, `match` on inbox), is a finding and is not read; a missing `tab` or `rail` reads as false (`counts.test.ts:24-58`; `rail-badges.ts:37-38`).
- 7-Zip's `../evil.txt` and `/abs.txt` entries are written inside the target folder as `evil.txt` and `abs.txt` (`safety.test.ts:536-539`), not refused: nothing lands outside the target, which is the property the brief's safety rows ask for, and the archive's other members still unpack.
- `focus.ticker_sources` holds a `projects` row (`config/behavior.yml:54`, `{ collection: projects, category: paper }`), since the Command Center's paper lines come from the projects; a collection with no row is not read.
- The Login node section is a fold of its own that starts shut (`Login.svelte:7`), so no ssh command runs until it is opened.
- `projects/manuscripts/bttn-incident-af/code/run_all.sh:64-87` extracts the two PTB-XL members with a Python `zipfile` heredoc, because `unzip` cannot strip the zip's top folder from the member paths.
- One `make/MakeDialog.svelte` draws both make dialogs (`Tree.svelte:61,332`; `making.svelte.ts:4`).
- The `kaggle-token` row of `downloads:` is read and checked but not used by Recover: a Kaggle source signs in with the `kaggle` row alone (`runs/recover/access.ts:9-10`).
- The `project_types` list follows the `types` map (`options.ts:435-436`, in `type_order`'s order) where the base read `type_color`'s keys; `entry_statuses` follows the words of `statuses` that carry a colour (`:441-442`) where the base read `status_palette`'s keys. Settings and the forms offer the same words in a different order.
- A hub with no `leads_fit` draws the `fit_none` word `-` on a lead's fit tag (`LeadCard.svelte:136`, `config/text/views/feeds/leads.yml:21`).
- `HOST_DEFAULT` is gone (`grep -rn HOST_DEFAULT src`: 0); a host with no status takes the hub's `career_host_status` row marked `default: true` (`state/boards/career.ts:85`).

The places Part 14 moved to a flag, by `grep -rnoE "(wordFlag|statusFlag|anyWord|wordsWith|hasWord)\(..."` over `src/lib`:

| File:line | Flag read |
|---|---|
| `data/accounts/leads.ts:23,28` | `lead_closed`, `lead_declined`, `lead_applied`, `default_lead` of `statuses` |
| `data/index.ts:292` | `acknowledged` |
| `server/content/audit/rules.ts` | `published`, `live`, `placed`, `standard`, `public`, `negative`, `dead_end`, `finished`, `personal`, `outcome_folders`, `type_folders` |
| `server/edit/writes/manifest.ts:654,709,710,717` | `main`, `idea`, `new_idea`, `backlog` |
| `state/forms/new-entry.ts:74` | `default_task` |
| `state/feeds/lead-application.ts:39` | `default_application` |
| `state/feeds/feeds.ts:90` | `main` |
| `state/boards/ticker.ts:156,398,419` | `main`, `live_subtasks` |
| `state/boards/focus.ts:79,90,95,196,244,257,304,312,329,359` | `terminal`, `pauses_countdown`, `deadline_met`, `backlog`, `idea`, `live`, `blocked`, `waiting`, `main` |
| `state/boards/collection.ts:761,762,765,789,807` | `finished`, `dead`, `idea`, `blocked`, `live` |
| `state/boards/board/stats.ts:48,60,86` | `pauses_countdown`, `blocked`, `submit_ready` |
| `state/boards/board/presets.ts:317` | `software` |
| `state/boards/structure/lines.ts:59,103,113` | `live`, `dead`, `on_map` |
| `state/boards/structure/graph.ts:88` | `finished` |
| `state/boards/focus-lanes.ts:101` | `live` |
| `state/boards/career.ts:85,94` | `default`, `in_flight` of `career_host_status` |
| `state/sources/registries/venues.ts:37,38,55` | `finished`, `dead`, `live` |

Vocabulary words left in code, with the reason:
- `data/helpers/hub-names.ts:205` `TIERS`: the five tier names a manifest's `tier` may take, which `config/schemas/manifest-schema.yml:36` also lists as the select's options; the tier is the name of a board, and the `tiers` map's flags decide what each does.
- `state/boards/career.ts:62-68` `scoreTier`: maps the career file's own score words ("Strong", "Med-high", "Weak clinic") to the four tones of `career_score_tones`; the words are the file's, not a vocabulary of oculus.
- `server/edit/writes/manifest.ts:717` `focus: holding`: the value written into a new idea's manifest, a manifest field's value and not a decision on a vocabulary word.
- `state/workbench/rail-badges/rail-badges.svelte.ts:320,325,336` `statusTone('active')`, `statusTone('pending')`: the colour of a rail part borrowed from the status palette's hue; no behaviour depends on the word.
- `state/boards/ticker.ts:21,182` `GLYPHS`: the glyph of each Command Center category, keyed by the category words `ticker_categories` lists.
- The link kinds of `CardLinks.svelte`, the glyph names of `CrossLinks.svelte`, the deposit statuses of `server/git/deposit/`, the pillar kinds and the text keys of `CommandCenter.svelte`: names of fields, glyphs, protocol states and text keys, which no vocabulary of `vocab.yml` holds.

## Visible changes

| View | State | What differs from the base |
|---|---|---|
| Data, a dataset card | a set whose sources oculus can fetch | A Recover button opens the Recover view; a `library`, `request` or `derived` set shows the call, the contact or the source and script in place of a control; pdebench shows none (first line) |
| Recover (new) | a run | The plan, the sources, the progress of fetch, check and unpack, on this Mac or on the cluster; polls every 3 s while a run goes (open item A) |
| HPC, Login node (new fold) | opened | The sessions on the login node; shut on load; polls while open (open item A) |
| Settings, This machine | `downloads:` rows in local.yml | A row per service; a token or password shows the word `set`, never its value |
| Settings, the browser rows | a terminal (rice) theme | Two toggles, Brackets and Monospace, after Icons (`other-rows/browser.ts:31-32`), both on by default (`ui.svelte.ts:271-272`); off draws buttons, chips and tags without brackets, or the interface in the sans font with editors, code and terminals still monospace (`workbench.yml:127,135`) |
| Files, a folder's context menu | any folder | Make Folder a Git Repository and Add Repository Configuration... added; Make Folder a Hub writes local.yml (mode 600) and schedules.yml too; `~/.oculus` and its folders are offered no make item |
| Help, Keyboard Shortcuts (new view) | opened from the Help rail, `:keys` or the menu | Replaces the key sheet: one searchable list of the workbench, palette, editor (Monaco), LaTeX, debugger, desktop and app keys. Keys a component binds in its own key handler (the arrows, Home, End and Delete of `shell/keys/rows/FileRows.svelte`) are not rows: `grep -c "'ArrowDown'\|'Home'\|'Delete'" data/helpers/keys/oculus/bindings.ts` gives 0 |
| Palette | `:help` | Available (`palette.ts:600`), the base had it unavailable |
| Palette | `:theme `, `:file-icons `, `:tab `, `:goto ` | A list of the choices with the one in force marked and selected; moving through the themes previews each, Esc puts back the chosen one; an unknown name is answered in words |
| Source editor | Ctrl+Space in a YAML file of `.oculus/` | Show Suggestions in the editor's context menu and the palette, the Merge Result editor included; the hub's `.oculus/config.yml`, `bookmarks.yml` and `workspaces/*.yml` get schemas |
| Source editor | suggest list open | The description panel starts open (`editor.suggest_details: true`); its toggle is kept across reloads |
| Entry cards (events and the others) | a meta value with an address | The address is a link (`LinkedText.svelte`) |
| Rail and tabs | the real hub | Talks & Events tab and rail part read 2 (amber, "2 upcoming"), the base none; the Projects hover reads "in progress: 20 \| idea: 33", the base "active: 20 \| idea: 33" |
| Audit | the real hub | 1 finding to 0 (the isles24 `%VERIFY` source is replaced) |
| Settings and forms | type and status choices | The order of `project_types` and `entry_statuses` changes (judgment calls) |
| Any view | a browser holding the version 1 UI envelope | Starts at the defaults (open item E) |

## Edits to existing assertions, allow lists and predicates

From `$TMPDIR/o38-assert-diff.txt` (the `expect` lines that differ from the base, per test file) and the diffs of the files below:

- `tests/shell/window/menu-answer.test.ts:104`: `['act', { kind: 'sheet' }]` became `['openView', 'keys']` (the key sheet is gone).
- `tests/state/system/apps/app-keys.test.ts:173`: the case title only.
- `tests/checks/source/history.test.ts`: `proseLines` reads a `.body` or `.headers` file as holding no prose (recorded HTTP answers), with planted rows `tests/answers/x.body` and `x.headers`.
- `tests/checks/source/keys.test.ts`: a `COMPUTED_PREFIXES` entry for `rows.ts`'s `t(row.word)`, and the `keys:` list `[...Object.values(KEY_ROWS).map((row) => row.word), PREFIX_ROWS.command.word]`.
- `tests/server/desktop/menu-template.test.ts`: a row `commandWindow('keyboard-shortcuts', inReader, main)` is `main`.
- `tests/routes/sessions/terminal.test.ts`: the recover describe (its ten `expect` lines on `recover mimic-iv` and `redownload.py`) removed, as Part 2 item 10 says.
- `tests/data/snapshot/references.test.ts`, `tests/data/snapshot/rename.test.ts`, `tests/server/edit/writes.test.ts`, `tests/server/edit/writes-collection.test.ts`, `tests/data/sources/collections.test.ts`, `tests/data/helpers/hub-names.test.ts`, `tests/routes/hubs/hub-writes.test.ts`, `tests/checks/config/config.test.ts` (`engineCareer`): the old hub paths became the `.oculus/data/<kind>/` paths.
- `tests/checks/config/config-folder.test.ts`: the expected key lists; `nav_groups` holds only `['float']`; the rail labels compared through the groups; the harness passes `withOwnSchemas(build.schemas)`; new rows for the hub's own files and `wallpaperz`.
- `tests/routes/hubs/make.test.ts`: the hub-file rows expect local.yml, `.gitignore` and schedules.yml; new rows for the git and repository make items; the literature path is `.oculus/data/literature/literature.yml`.
- `tests/server/edit/config-value.test.ts`: `waiting_status` became `processes.patterns` as the list key the write case edits.
- `tests/routes/edit/audit-mute.test.ts:` `stale_lag_days: 1\n` became `focus:\n  stale_lag_days: 1\n`.
- `tests/routes/edit/config-key.test.ts`: a row whose expected engine value is null removes the scratch hub's `.oculus` first.
- `tests/data/sources/config/rail.test.ts`, `local.test.ts`, `tests/routes/hubs/machine-answer.test.ts`, `tests/data/snapshot/schema-rules.test.ts`, `tests/data/snapshot/normalise.test.ts`, `tests/routes/edit/rail.test.ts`: added rows only.

`sh utils/unused-exports.sh` (K9), `$TMPDIR/o38-unused-final.txt` against `O38-base/unused-exports.txt` by `diff`:
- Gone: `leads.ts: DISMISSED, LEAD_CLOSED`, `career.ts: IN_FLIGHT`, `lead-application.ts: NOT_APPLIED`, `chords.ts: removedChords` and `RemovedChord`, `BrowserValues`, and the eight lines "`.oculus/local.yml: ignoring unknown key(s) downloads`" of the base run.
- Moved: `editor/tab-out.ts` became `editor/keys/tab-out.ts` (`leaves, armBefore, armAfter`, `KeyFacts`).
- New: `runs/recover/cluster.ts: jobScript`, `local.ts: systemProcessOf` and `ProcessInfo`, `plan.ts: stateOf`, `routes.ts: listFiles`. Each is imported by a recover test (`grep -rlw` finds `safety.test.ts`, `runs.test.ts`, `plan.test.ts`, `sources.test.ts`) and by no other production file than its own.

## Old names and the docs

`grep -rnw --exclude=local.yml -- <name> src tests config docs HELP.md DESIGN.md README.md | wc -l`, from `tools/oculus`, run for this report:
- 0 for each of: `recover_command`, `recoverDataset`, `recoverCommand`, `RECOVER_KEY`, `recoverFindings`, `recoverCommandOf`, `recover_command_key`, `hpcPath`, `hpc_path`, `intro_no_recover`, `intro_recover`, `recover_failed`, `recover_tip`, `LITERATURE_FILE`, `status_legend`, `status_palette`, `waiting_status`, `ACKNOWLEDGED`, `type_color`, `type_order`, `archive_dead`, `terminal_types`, `archive_outcomes`, `archive_categories`, `COLUMN_KEY`, `LABEL_KEY`, `project_label_mode`, `archive_label_mode`, `tab_rollup`, `nav_live`, `leads_badge_days`, `typeSplit`, `RAIL_COLLECTIONS`, `RAIL_CELLS`, `board_groups`, `affiliation_retired`, `theme_labels_retired`, `key_renamed`, `RETIRED_KEYS`, `RENAMED_FIELDS`, `LEAD_CLOSED`, `IN_FLIGHT`, `FLIGHT`, `ENTRY_CATEGORIES`, `KeySheet`, `key-rows`, `app.keys.rows`, `desktop.keys.rows`, `SHEET_CHARACTER`, `fileIconThemeNamed`, `UI_VERSION_UNCHOSEN`, `MakeHubDialog`, `migrate-joint-work`, `redownload.py`, `tools/cockpit`, `tools/present`, `tools/data`, `tools/deposit`.
- The same with `-F` and no `-w` for the old hub paths: `registries/data.yml`, `registries/venues.yml`, `registries/literature.yml`, `registries/career.yml`, `registries/pillars.yml`, `feeds/position-leads`, `feeds/literature-radar`, `tasks/tasks.yml`, `network/events.yml`, `network/joint-work.yml`, `network/people.yml`, `funding/funding.yml`, `applications/applications.yml`, `education/education.yml`: 0 each.
- Hits kept: `recoverable` 2 (the English word in the comments `saved.ts:215`, `parse.ts:2`); `REGISTRY_FILES` 13 and `CAREER_FILE` 6 (test-local constants derived from `engineDefaults()`); `career_file` 27 (the engine's key `config/sources.yml:50`, which the step keeps); `deadline_horizon_days` 4 (under `focus:`); `cmd_theme_hint` 2 (the `:theme` hint word, `app.yml:69`, `palette.ts:524`); `status_chips` 7 (the options list name `status_chips`, read through `vocabKeys(config.statuses, 'chip')`); `registries/` 7 (oculus's own folder `src/lib/state/sources/registries/`).

The doc paragraphs naming a changed name:

| Paragraph | State |
|---|---|
| DESIGN.md:61 (the folder list of `src/lib/state`, naming `feeds/`) | still true: the folder is oculus's code folder |
| DESIGN.md:592 "Live data" | still true as written; the Recover polling contradicts it (open item A) |
| DESIGN.md:698 (base :696, the hub-like files; `recover_command` dropped) | rewritten |
| DESIGN.md:717 (a colon command with a known set opens a list) | rewritten (new) |
| DESIGN.md:741 (base :738, the language servers and their schemas) | rewritten |
| DESIGN.md:762 (base :759, the rail pages) | rewritten |
| DESIGN.md:765 (base :762, the four make items) | rewritten |
| DESIGN.md:767 (Recover) | rewritten (new) |
| DESIGN.md:636-637 (the Keyboard Shortcuts view) | rewritten (new) |
| HELP.md:284-291 (Data, the dataset card and Recover) | rewritten |
| HELP.md:493, :497-498 (behavior.yml `focus:`; `catalogs/` and `vocab.yml`'s maps and flags) | rewritten |
| HELP.md:21, 27, 52, 54, 94, 124, 279, 509, 516, 518-520 | rewritten |
| docs/data-map.md:21, 28, 36-54, 117-118, 185 (the `.oculus/data/` paths and data.yml's fields); its old :91 | rewritten; deleted |
| docs/templates.md (36 hunks: the hub's files at their new paths, the commented `downloads:` block at :213, the typed `retrieval:` list) | rewritten |
| docs/apps.md:238, :377 (`path` in place of `hpcPath`) | rewritten |
| hub README.md:6, 10, 18, 60, 65-66 (section 8) | rewritten |

## What in the brief was wrong or impossible

- Case 16 expects "only 34" lines left (the scout lines of leads.yml); the grep leaves 43: the 34 of `.oculus/data/academic/leads.yml`, `CLAUDE.md:56,60,72` and `.agents/plan.yaml:12` (the session's, Part 7, not mine to touch), `funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md:238,635,637,641` (grant text, which only `academic-paper` may change) and `tools/oculus/DESIGN.md:61` (oculus's own `feeds/` folder). `$TMPDIR/o38-c16-now.txt`, section 7.
- Ruling 175 counted 14 legend words; the base's `status_legend` holds 33. The coordinator's correction confirmed 33; `grep -c "chip: true" config/catalogs/vocab.yml` gives 33.
- Case 26 names the 3MI entry of events.yml; it is in neither the base copy nor the worktree (`grep -rn 3MI` over `O38-base/network/events.yml` and `.oculus/data/academic/events.yml`: no line); it is only in the main checkout's uncommitted events.yml, which I may not read for writing. The link rule is checked on the other entries' addresses.
- The pdebench and pbc-cirrhosis addresses the registry table asks for are not in the tree (first line, `grep -rln "darus\|pdebench_data_urls"`).
- "Copy the fixtures as they are" cannot hold with the ASCII gate, which refuses the CRs of the `.headers` files (judgment calls).
- The case 14 probe, `tests/data/real-hub.probe.ts`, reads session records under `~/.claude` and runs git, both of which the launch forbids; the rerun used a copy of its lines 1-102 with `HOME` under `$TMPDIR` (open item F).
- Part 14 asks for options-catalog entries for the vocab.yml flags, a file the options catalog does not describe (first line (5), open item H).

## Verify runs

The verify list (`npm run diagrams && npm run test:quick`) ran 3 times; the third run is K7.
