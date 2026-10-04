# H3 report: the hub's data map (state after repair round 1)

## NOT done / not verified

Everything in the brief and in the twelve items of round 1 is built and its checks pass. Not verified, in those words:

- Not verified: the Help page, the Views catalogue's Help group and the keyboard help were not looked at (no server, no browser). The reader-visible changes below are read from the config and the code only; the look is the orchestrator's.
- Not verified: `.claude/settings.local.json` "ignored machine-wide" and `.agents/tmp/` "empty" are the brief's statements. The worktree holds neither path and its `.gitignore` names neither. The map states them as the brief gives them.
- Not verified: whether `npm run diagrams` changed a file of `tools/oculus/docs/diagrams/` against the base, because the base copy holds no `tools/oculus/docs/`. The step changes no import or export.
- Case 19 prints one line beyond the brief's exception list: `missing: secrets/`. Item 6 of the round requires the trailing slash on the `secrets/` row, the folder is not checked out in a worktree, and the brief's list of exceptions does not name it.

## Open items of the state file, verbatim

(`tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", read from the main checkout when this report was written.)

- None.

## The cases' first run on the unchanged tree

Run before any change, on the base copy `.agents/worktrees/H3-base` and the worktree as it was created. No case's rule was wrong.

| Case | First run on the unchanged tree |
|---|---|
| 1 | `ls -A` at the worktree root prints `.agents .claude .codex .git .gitignore AGENTS.md applications background CLAUDE.md CONTEXT.md docs education feeds funding network projects README.md registries side-projects skills-lock.json tasks tools`. `docs/DATA-MAP.md` did not exist, so no root row existed. |
| 2 | `ls -A H3-base` prints `CONTEXT.md docs README.md tools unused-exports.txt`: no `secrets` folder, and `ls H3-base/docs` prints `AGENT-APPROACH.md HPC-UTwente-howto.md RESEARCH-APPROACH.md`, so no map and no `secrets` row existed. The row's two facts (it holds secrets, git tracks it) come from the brief. |
| 3 | `ls H3-base/tools/oculus/config` prints `appearance.yml behavior.yml catalogs layout.yml present.yml sources.yml text`: `local.yml` is not on the base copy (git ignores it), so no row and no key of it existed; the map's row is written from `tools/oculus/config/catalogs/options.yml` and the brief, and the file was never opened. |
| 4 | The `find ... -prune ...` listing prints 38 paths: 18 hub data files with `registries/career.yml` (17 entry-list files plus `career.yml`), 13 oculus config and catalog files, `.agents/plan.yaml`, `tools/present/content/present.yml`, `tools/skills/catalog.yaml`, and the four project-internal files. None was named (no map). |
| 5 to 13, 17, 20 to 22 | Checked by reading the sources the cases name (`validate.ts`, `registries.ts`, `manifests.ts`, `collection.ts`, `entries.ts`, `host.ts`, `normalise-career.ts`, `feeds.ts`, the view registrations). Premises hold except the points under "Anything in the brief that was wrong". |
| 14, 15, 23 | `diff` of `CONTEXT.md`, `README.md` and `docs/RESEARCH-APPROACH.md` against the base copy printed nothing. |
| 16 | `yaml.safe_load` of `sources.yml` exited 0; the non-comment diff against the base printed nothing. |
| 18 | The `sed -n '12,/^# Roots the server/p' ... | grep -n '^ *#.*\( - \| -- \|---\)'` check printed six lines (file lines 24, 28, 40, 45, 53, 78). `LC_ALL=C grep -n '[^ -~]'` over `CONTEXT.md`, `README.md`, `docs/RESEARCH-APPROACH.md` printed nothing. |
| 19 | `docs/DATA-MAP.md` was absent. |

## DONE / NOT DONE

Full-list runs in this round: 1 (`checks.sh`, exit 0). Its lines, quoted:

```
test:quick: 7 changed file(s), from git since HEAD
test:quick: 17 test file(s), 10 essential
ok      ASCII gate (0.4 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (8.9 s)
ok      eslint (26.5 s)
ok      vitest (30.2 s): Duration  20.92s (transform 22.51s, setup 0ms, import 33.02s, tests 2.74s, environment 7ms)
ok      svelte-check (23.0 s): 1791158043428 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 32.0 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

The other commands, run after the last change:

| # | Command | Result |
|---|---|---|
| 1 | `npm run diagrams` (from `tools/oculus`) | wrote the nine diagram pairs, exit 0 |
| 2 | `npx vitest run tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts` | `Test Files  2 passed (2)`, `Tests  48 passed (48)` |
| 3 | the spec's `perl` ASCII gate over `src tests config` (excluding `local.yml`; the worktree has no `bin`) | prints nothing, exit 0 |
| 3 | `LC_ALL=C grep -n '[^ -~]' docs/DATA-MAP.md docs/RESEARCH-APPROACH.md CONTEXT.md README.md` | prints nothing (exit 1) |
| 4 | `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" ...layout.yml ...sources.yml ...app.yml` | exit 0; the nine hub data files and `behavior.yml` also parse |
| 5, case 4 | the `find ... -prune ...` listing, each path grepped in backticks in `docs/DATA-MAP.md` | no `NOT NAMED` line |
| 5, case 16 | `diff <(grep -v '^ *#' H3-base/.../sources.yml \| grep -v '^ *$') <(grep -v '^ *#' .../sources.yml \| grep -v '^ *$')` | prints nothing, exit 0 |
| 5, case 18 | the `sed ... \| grep` check over `sources.yml`; ` - ` and ` -- ` over `docs/DATA-MAP.md` and `CONTEXT.md`; non-ASCII over the four documents | print nothing; the history-word grep over `docs/DATA-MAP.md` prints nothing |
| 5, case 19 | the backticked-path loop | prints 11 lines: `.agents/tmp/`, `.agents/worktrees/`, `.claude/settings.local.json`, `projects/software`, `secrets/` (see the not-verified list), `theaxec.github.io/`, `theaxec.github.io/_data/publications.yml`, `theaxec.github.io/_linkedin/`, `tmp/`, `tools/cockpit/cockpit.local.yml`, `tools/oculus/config/local.yml` |
| 5, case 20 | `grep -rn --exclude-dir=node_modules --exclude=local.yml -e "\bNAME\b" tools/oculus/src tools/data tools/cockpit/src` for each of the 55 camelCase and CONSTANT identifiers in backticks | no `NOT FOUND`; `def first_path` at `tools/data/redownload.py:52`, `def build_links` at `tools/cockpit/src/cockpit/discover.py:99` |
| 5, case 15, 23 | `diff` against the base | `README.md`: `1c1` and `6,16c6`; `docs/RESEARCH-APPROACH.md`: `57c57` only |
| 6 | `diff -rq H3-base/tools/oculus tools/oculus` and `diff -rq H3-base/docs docs` | differ: `HELP.md`, `config/behavior.yml`, `config/layout.yml`, `config/sources.yml`, `config/text/app.yml`, `src/lib/data/sources/docs.ts`, `docs/RESEARCH-APPROACH.md`; only in worktree: `docs/DATA-MAP.md` |
| extra | `python3 tools/cockpit/build.py --selftest` (the nine hub data files that the cockpit reads changed) | `SELFTEST PASS` |
| 7 | no test is added or changed; `sh utils/unused-exports.sh` is not run (no export changes) |

## Files changed

Lines before to after against the base copy (the nine hub data files against the main checkout, since the base copy holds none of them); "diff" counts changed lines of both sides:

| File | Lines | Diff |
|---|---|---|
| `docs/DATA-MAP.md` | new, 485 | |
| `CONTEXT.md` | 24 to 21 | 7 |
| `README.md` | 60 to 50 | 14 |
| `docs/RESEARCH-APPROACH.md` | 92 to 92 | 2 |
| `tools/oculus/config/sources.yml` | 138 to 130 | 32 |
| `tools/oculus/config/layout.yml` | 176 to 177 | 3 |
| `tools/oculus/config/behavior.yml` | 194 to 194 | 2 |
| `tools/oculus/config/text/app.yml` | 72 to 72 | 2 |
| `tools/oculus/HELP.md` | 348 to 348 | 4 |
| `tools/oculus/src/lib/data/sources/docs.ts` | 149 to 148 | 5 |
| `registries/pillars.yml` | 97 to 97 | 2 |
| `registries/venues.yml` | 1060 to 1060 | 4 |
| `registries/domains.yml` | 58 to 58 | 6 |
| `registries/data.yml` | 1058 to 1058 | 2 |
| `registries/repos.yml` | 210 to 210 | 2 |
| `funding/funding.yml` | 161 to 161 | 2 |
| `education/education.yml` | 247 to 247 | 2 |
| `network/events.yml` | 112 to 112 | 2 |
| `applications/applications.yml` | 413 to 413 | 2 |

For the nine hub data files and `behavior.yml`, `json.dumps(yaml.safe_load(...), sort_keys=True)` of the main checkout's file against the worktree's is equal for `domains.yml`, `data.yml`, `repos.yml`, `funding.yml`, `education.yml`, `events.yml`, `applications.yml` and `behavior.yml`. It differs for `pillars.yml` (line 31) and `venues.yml` (lines 18 and 21) only: those three lines are `help:` strings of the `schema:` block, which the round's item 12 names. `registries/data.yml:82` (`access: public`) is not touched.

## Round 1, item by item

1. Radar conditions. The conditions table has rows for `project`, `relevance` and `why` (the `bucket` is `preemption`, `cite_baseline` or `adjacent`; an `idea` entry carries none), `threatens` (`preemption`; `cite_baseline` and `adjacent` entries may also carry it), and `motif`, `maps_to`, `idea_spark` (bucket `idea`). Each names its place (the bucket descriptions in the header comment of `feeds/literature-radar.yml`) and its readers (`RadarCard.svelte`, `radar.ts`, each with its path below the table). The sentence "`year` is in the section Core of `tools/oculus/config/catalogs/manifest-schema.yml` and holds on any tier" follows the table (`manifest-schema.yml:42` carries `section: Core`). The yaml count per bucket (`python3`, `yaml.safe_load` of `feeds/literature-radar.yml`):

   ```
   adjacent 191        project 191 relevance 191 why 191 threatens 27  motif 0   maps_to 0   idea_spark 0
   cite_baseline 154   project 154 relevance 154 why 154 threatens 64  motif 0   maps_to 0   idea_spark 0
   preemption 31       project 31  relevance 31  why 31  threatens 31  motif 0   maps_to 0   idea_spark 0
   idea 185            project 0   relevance 0   why 0   threatens 0   motif 185 maps_to 185 idea_spark 185
   ```

   The counts are in this report only; the map holds none.
2. Dictated note. The note below the link table is the brief's sentence with these removals only: the line numbers (`:76`, `:34-50`, `:692`, `at :26`) and the closing `git grep` parenthetical, since the map cites no line number and the sentence is a git command. `local.yml`, `options.yml` and `ALIAS` stay as the brief writes them. The one true addition is its own last sentence, "`ALIAS` is the pattern of an ssh alias, defined in the same file." (judgment call).
3. Live HPC. The views table gives its page as "every page, in the float docked at the right edge (`floats:` in `tools/oculus/config/layout.yml`); its catalogue group is Focus" (`layout.yml:115` `- { view: [hpc, usage], dock: right, size: 0.3 }`; `HELP.md:19`; `group: 'focus'` in `views/system/machine/hpc/Hpc.svelte`).
4. (a) The Files notes say the views of Academic Life, Statements and Code are collection views, and a second note says the keys `data`, `venues`, `pillars` and `domains` of `collections:` get no collection view: their views are Data (`tools/oculus/src/lib/views/sources/data/Data.svelte`), Venues, Pillars and Domains (`REGISTRY_KEYS` and `collectionKeys` in `tools/oculus/src/lib/data/snapshot/normalise.ts`); `funding` stays a collection view. (b) The Focus note names what the ticker reads: `funding/funding.yml`, the five files of `events`, `education`, `tasks`, `applications` and `joint-work` (`ENTRY_CATEGORIES`) and conference deadlines of `registries/venues.yml` (`tools/oculus/src/lib/state/boards/ticker.ts`), and says `registries/data.yml`, `registries/pillars.yml`, `registries/domains.yml`, `registries/boilerplate.yml` and `registries/repos.yml` are not read there. (c) The venues row's "Shown in" is "Venues, Focus".
5. `docs` row. The cell reads: the Hub document view shows its `doc.failed` line, "The document {0} could not be read: {1}", for a path with no file (`config/text/views/sources/doc.yml`, `views/sources/doc/Doc.svelte`).
6. `secrets/` row. It reads `| \`secrets/\` | holds secrets | git tracks it | |` with the "Read by" cell empty.
7. `readonly` row. It names `id` and `tier`. A sentence below the widget table says `type` is a `select` from `type_order`, and that the comment of `manifest-schema.yml` says a write refuses `id`, `tier` and `type`, which for `type` holds on a flat scan rule.
8. `sources.yml` collections comment. It reads: one card list per key, from one YAML file each, except the keys data, venues, pillars and domains, whose views are Data, Venues, Pillars and Domains and not a card list; then the schema and links sentences. One line.
9. First-run table. Cases 2 and 3 have their own row, read on the base copy.
10. `hub-map.svg`. The claim that the figure and `docs/RESEARCH-APPROACH.md:57` are false is not in this report (see the list below, which is now empty).
11. (a) Every function the map names without a path now has its file: `checkFundingIdentity` and `checkEntryIdentity` with `tools/oculus/src/lib/data/snapshot/validate.ts`; `readManifests`, `readRegistries`, `readCollections`, `readCareer`, `readFeeds` with their files under `tools/oculus/src/lib/data/sources/`; `normaliseMetalists` with `tools/oculus/src/lib/server/edit/writes/entries.ts`; `extraRawFields` with `tools/oculus/src/lib/state/boards/collection.ts`; `checkFunders` and `checkWaitingOn` with `validate.ts`. The conditions section opens with the sentence that its checking functions are in `validate.ts` unless a path is given, except `hpcHostOf`. Bare script and file names (`redownload.py`, `deposit.py`, `gen_figures.py`, `skills.py`, `catalog.yaml`, `normalise-career.ts`, `normalise-personal.ts`, `validate.ts`) are written from the hub root. (b) Every `<project>/...` path is `projects/<tier>/<id>/...`. The remaining `<project>/<slug>` is the value form of a `present.yml` `ref` under `slide: project`, not a path.
12. False lines fixed (comments, and the three `help:` strings), each read from the code:
    - `registries/pillars.yml:31`: the palette is in `tools/oculus/config/catalogs/vocab.yml` (`palette:` at its line 9; `paletteTone` in `tools/oculus/src/lib/state/shared/words/tones.ts`).
    - `registries/venues.yml:18` and `:21`: the options are the `venue_categories` list and the `venue_tiers` list of `tools/oculus/config/catalogs/vocab.yml` (lines 250-251).
    - `registries/domains.yml:2-3`: colour and label come from the `domains` map of `vocab.yml` (`domainColor = stringMap(config.domains, ...)`, `tones.ts:84`).
    - `registries/data.yml:11`: `access` is a key of `data_access` (`vocab.yml:246`: open, registration, credentialed, private); an unknown value is drawn neutral (`dataAccessTone`, `tones.ts`).
    - The five headers (`education/education.yml:1`, `network/events.yml:4`, `funding/funding.yml:2`, `registries/repos.yml:4`, `applications/applications.yml:1`) now say the schema is the file's `schema:` block, which each file has (`grep -c '^schema:'` prints 1 for each); the entry-editing sentence says an entry is edited in its card's form (`identityField` and the writes in `tools/oculus/src/lib/server/edit/writes/entries.ts`).
    - `tools/oculus/config/behavior.yml:3`: the source roots and the editor language of each file extension live in `sources.yml` (`scan:`, `roots:`, `languages:`).

## Case 13: lose-nothing audit of `CONTEXT.md:5-9` and `README.md:5-16`

`CONTEXT.md` line 6:

1. `projects/` is the manuscript portfolio: map, root table row `projects/`.
2. `active/`, `manuscripts/`, `ideas/` flat, one folder per project: map, `projects/` tier table and first bullet.
3. "manuscripts/ (thesis-built, student first author, Axel senior)": not carried; the tree contradicts it (`lead` in `projects/manuscripts/*/project.yml`: Axel Faes 9 times, Axel Faes and Jakob Nolte 1, Dongho Chun, Pergher, Dries Cornelissen, Meseret Assefa Kerga and Ward Ceyssens once each).
4. `archive/` shipped work, style references for tensor figures: map, `projects/archive/` row (carried as the source states it; not verified against the tree).
5. `coauthor/` contributed, not led; archive and coauthor nested: map, tier table.
6. "the cockpit finds a project at any depth": map, the nested bullet (`readManifests` walks to any depth).
7. The filing folders (`archive/published/<year>/<name>`, `archive/<outcome>/<name>`, `coauthor/published/<year>/<name>`, `coauthor/active/<name>`, `coauthor/abandoned/<name>`): map, the categories in the `projects/` table.
8. "Those folder names mean nothing to the tooling; type/outcome lives in each project.yml": the type part is in the nested bullet. The "mean nothing" part is not carried: the first folder under the tier is recorded as `category`.
9. Live tiers flat, a folder with no manifest is a ghost card: map, flat bullets.

`CONTEXT.md` line 7 (`tools/`, cockpit, present, the helpers, `tools/cockpit/DESIGN.md`): map, `tools/` table. Line 8 (`talks/`, `literature/` as cockpit tabs): the folders are not on the tree (`ls -A`), not carried; `funding/`, `education/`, `applications/` are in the root table. Line 9 (`docs/HPC-UTwente-howto.md` the cluster guide): map, root row `docs/`.

`README.md` lines 6-16: `projects/` row (tiers, nested filing, folder name equals `id`, no prefixes, unique hub-wide, manifest is the source of truth for status and venue, venue catalogue, pillars registry): map, `projects/` section, the Files notes and rows for `registries/venues.yml` and `registries/pillars.yml`. `tools/cockpit/`, `tools/present/` (public showcase deck, offline HTML): `tools/` table; "Replaced `_presentation/` (retired)" is history and the folder is not on the tree. `theaxec.github.io/` (Jekyll, GitHub Pages, own repository, own remote, ignored, a fresh clone lacks it, manifests mirror to `_data/publications.yml`): root row. `funding/`, `registries/career.yml`, `applications/`, `education/`, `network/` (events feed the Focus ticker), `registries/repos.yml` (code-availability coverage), `docs/HPC-UTwente-howto.md`: root table, Files table and notes. The cockpit tab names are replaced by oculus view names.

## Case 21: reads, row by row

"Shown in" cells were read against each view's `registration` block, `placements` in `boards/collection/Collection.svelte`, `collections:` in `sources.yml`, and `FILE_KEYS` in `state/sessions/view-source.ts`; "One entry is" cells against each file's header comment and its first entry.

| Row | Confirmed by |
|---|---|
| `registries/boilerplate.yml` | header "Reusable manuscript boilerplate"; entry "AI use - general"; collection `statements`, References |
| `registries/data.yml` | header "Dataset registry"; entry `mimic-iv`; Data view (`views/sources/data/Data.svelte`), not a collection view (`REGISTRY_KEYS`) |
| `registries/domains.yml` | header "Application domains"; entry `method`; Domains view |
| `registries/organisations.yml` | header "Organisations"; entry `university-of-twente`; no registration reads it; Person draws it |
| `registries/people.yml` | header "People"; entry `amir-haeri`; Person via `viewSourceFile('people')` |
| `registries/pillars.yml` | header "Pillars"; entry `tensor`; Pillars and Map |
| `registries/repos.yml` | header "Code / GitHub repositories"; entry `bttr`; collection `code`; not read by the Focus ticker (`ticker.ts` `COLLECTIONS`) |
| `registries/resources.yml` | header "Resources"; entry `utwente`; no view of its own; `ProjectCard.svelte` is imported by `Projects.svelte` and `Project.svelte`; Live HPC reads `slurm.resource` |
| `registries/venues.yml` | header "Venue catalogue"; entry `jbi` (named by `name`, keyed `id`); Venues view; conference deadlines read by `ticker.ts` (`snapshot.entities.venues`) |
| `registries/career.yml` | `readCareer`, `normalise-career.ts`; Focus Career strategy panel |
| `funding/funding.yml` | header "Funding"; entry "NWO Veni"; collection `funding`; read by `ticker.ts` `COLLECTIONS` |
| `network/events.yml` | header "Talks & Events"; entry "AAAI 2027"; collection `events`; `ENTRY_CATEGORIES` |
| `network/joint-work.yml` | header "Joint work"; entry `amir-haeri`; collection `joint-work`; Person |
| `education/education.yml` | header "Education"; a course; collection `education` |
| `applications/applications.yml` | header "position applications"; entry "VIB.AI"; collection `applications` |
| `tasks/tasks.yml` | header "Tasks & service"; entry "Submission"; collection `tasks` |
| `feeds/position-leads.yml` | header "Position leads"; entry "Postdoctoral Researcher ..."; Position Leads |
| `feeds/literature-radar.yml` | header "Lit Watch radar"; Lit Watch |
| `project.yml`, side-project forms | `readManifests`, `FIELDS` of `normalise-personal.ts`; Projects, Coauthor, Archive, Personal, Project, Editor |
| Live HPC | `Hpc.svelte` registration `group: 'focus'`; `floats:` in `layout.yml` docks it right on every page |
| config rows | each header comment and `options.yml`; Settings lists them |

Folder tables: each "holds" cell was read against `ls` of the folder for `background`, `education`, `applications`, `applications/archive`, `funding`, `network`, `tools`, `tools/oculus/demo`, `.claude`, `.codex`, `.agents` (`secrets/`, `theaxec.github.io`, `tmp`, `.agents/worktrees` from the brief). `applications/active/` is not on the tree and the map names no such folder.

## Judgment calls

- Two Files tables (hub data files; oculus configuration files), a views table and group lines, so "Shown in" names views only.
- A cell with no value reads `none`; the `secrets/` row's "Read by" cell is empty because the brief gives no reader.
- A "Hub document" row is in the views table because the Help group opens `docs:` entries through the `doc` view.
- The `README.md` heading `## Where things live` at line 5 stays, with one paragraph beneath it; the `CONTEXT.md` Layout heading stays, with one paragraph.
- The `sources.yml` collections comment says "An entry is edited in the card's form", replacing "Files are editable in served mode".
- The dictated `slurm.resource` note keeps the brief's words except the removed line numbers and `git grep` parenthetical; the added sentence on `ALIAS` is separate.
- `year` has no condition row; it is stated in a sentence as holding on any tier.
- The `type` link row names `type_color` as what `checkType` checks and notes that the form offers `type_order`.
- `docs/DATA-MAP.md` is not run through prettier: `docs/` is outside the prettier scope of `tools/oculus/`.
- The three `help:` strings of item 12 are values of `schema:` blocks; they are changed because the round names them.

## Reader-visible changes

- Views catalogue, Help group: before, Help, Memories, Research approach, Agent approach, HPC how-to (`h1` to `h5`); after, followed by Data map (`h6`). Source: `docs:` in `tools/oculus/config/layout.yml`.
- Help page, second pane: before, Research approach, Agent approach, Memories; after, Research approach, Agent approach, Data map, Memories (`layout.yml` line 97).
- `HELP.md` line 19: "... beside Research approach, Agent approach and the Memories wall)" now "... Research approach, Agent approach, Data map and the Memories wall)".
- `HELP.md` line 74 and the keyboard help's Help row (`config/text/app.yml` line 12): `h1-h5` becomes `h1-h6`.
- Field help in the entry forms: the `help:` text of `color` (Pillars), `category` and `tier` (Venues) names the catalog file correctly.

## False comments or help lines outside the write list found by the step

All named lines are fixed in item 12 above. Remaining, not in the round's list:

- `registries/data.yml:82` writes `access: public`, which is not a key of `data_access` (a value, not touched).
- `registries/venues.yml` and the other registries' headers and intros still say "tab" and name cockpit builders (`build.py venues_tab_html()`); oculus draws views.
- `registries/domains.yml:4` says the `schema:` block drives "the served add/edit form" and `registries/data.yml:9-10` says "cross-linked in the cockpit".

## Statements of `tools/figures/hub-map.svg` the map shows false

None. The tier list omits `side-projects/` and `projects/software`; that is an omission.

## Places the tree departs from a condition the map states

- `outcome` and `doi` outside the archive tier: `projects/active/linfoot-estimator/project.yml` (`outcome`, `doi`), `projects/manuscripts/erp-signatures/project.yml` (`outcome`), `projects/coauthor/abandoned/individual-reference-intervals`, `projects/coauthor/active/clinical-hccnet` (`outcome`, `doi`), `.../active/elixir-fl4e`, `.../active/flkit`, and under `projects/coauthor/published/`: `2016/chi-household-survival`, `2016/chi-purpose-centric`, `2017/algebraic-effects-compilation`, `2017/http2-best-practices`, `2018/http2-web-performance`, `2023/coordinated-fingers-ecnr`, `2023/ecog-frequency-features` (`outcome`, `doi`), `2023/modulation-lmp-bci`, `2024/highgamma-event-detection`, `2025/editorial-bigdata-ai-ms` (`outcome`, `doi`), `2025/pfl-ms-npj` (`outcome`, `doi`), `2025/proprioception-exoskeleton` (each a `project.yml`).
- `registries/venues.yml` entry `hcin` (`category: journal`) carries `timing`, `deadline` and `call`.
- `network/events.yml`: "Graz BCI Conference 2026" has `role: present` and no `link`.
- `registries/data.yml:82`: `access: public` is not a key of `data_access`.
- `registries/venues.yml`: `kuleuven-thesis`, `uhasselt-thesis` and `xai-nl` carry no `category`.
- Radar: `threatens` is also written on 27 `adjacent` and 64 `cite_baseline` entries, which the map states as allowed.

No departure found for flat-tier `type`, `focus` values, `followup.after` without `do`, `registries/people.yml` `folder` (all five student folders exist), `self` (exactly one), `funding` `key` and `statement` on awarded and contributing entries, `resources.yml` `host` on the cluster.

## Anything in the brief that was wrong or impossible

- Case 4 and "What is on the tree": "17 hub data files with `registries/career.yml`" is 18 by the listing (17 entry-list files plus `career.yml`). The map carries no count.
- The link table's `type` row: `checkType` checks the keys of `type_color`; `type_order` is the form's choice list and the board order.
- Case 22 ("other `tags` fields hold free words"): `links` in `registries/organisations.yml` and `registries/people.yml` carry no entry, so the map says neither schema nor reader gives their values a meaning.
- The brief lists `applications/active/`; the worktree has no such folder.
- `ProjectCard.svelte` is imported by `Projects.svelte` and `Project.svelte`; the cell for `registries/resources.yml` names Projects, Coauthor, Archive and Project.
- The `CONTEXT.md` fact "manuscripts/ (thesis-built, student first author, Axel senior)" is false on the tree (see case 13).
- The spec's ASCII gate and Verify 3 name `bin`; the worktree has no `bin` folder.
- Round 1 item 6 asks for `secrets/` with the trailing slash while the brief's case 19 exception list does not name it; case 19 therefore prints it.
