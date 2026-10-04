# H3 report: the hub's data map

## NOT done / not verified

Everything in the brief is built and its checks pass. What is not verified, in those words:

- Not verified: the Help page, the Views catalogue's Help group and the keyboard help were not looked at (no server, no browser is allowed to this agent). The reader-visible changes below are read from the config and the code only.
- Not verified: `.claude/settings.local.json` "ignored machine-wide" and `.agents/tmp/` "empty" are the brief's statements (brief line 125). The worktree holds neither path, and `.gitignore` of the worktree names neither. The map states them as the brief gives them.
- Not verified: whether `npm run diagrams` changed any file of `tools/oculus/docs/diagrams/` against the base, because the base copy holds no `tools/oculus/docs/`. The step changes no import or export, so the diagram sources are the same as the base's. `diff -rq` of the main checkout's `tools/oculus/docs` against the worktree's lists differences in `channels`, `layer-state`, `layer-views` and `layers` (`.dot` and `.svg`); the main checkout carries staged changes to exactly those files that the worktree does not have.
- One read-only git command was run by this agent against the rule (`git -C . rev-parse --show-toplevel`, inside a loop that tested folders). It wrote nothing.

## Open items of the state file, verbatim

(`tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", read at the end of the work.)

- Z443 (2026-10-05, raised at X3e's /spec): `agents/guarded.md` G13 says a wrong config value "is refused with a finding that names the key, and its default is used", while the setting readers of `src/lib/data/sources/config/settings.ts` (lines 65-81) throw an error naming the key and use no default. The entry was approved by Axel, so its sentence or the readers change only by his ruling. Options: (a) the readers made to keep G13: a wrong value gives a finding naming the key and the shipped file's value is used, through a new step; (b) G13's sentence corrected to what the readers do (refused with an error naming the key, the server reporting it at start). Recommendation (a), since a typo in `behavior.yml` then costs one setting rather than the reader that throws; (b) is the lazy option.

## The cases' first run on the unchanged tree

Run before any change; each case's rule gave the result the brief states, except where a line says otherwise. No case's rule is wrong, so the work went on.

| Case | First run on the unchanged tree |
|---|---|
| 1 | `ls -A` at the worktree root prints `.agents .claude .codex .git .gitignore AGENTS.md applications background CLAUDE.md CONTEXT.md docs education feeds funding network projects README.md registries side-projects skills-lock.json tasks tools`. `docs/DATA-MAP.md` did not exist, so no root row existed. `secrets`, `theaxec.github.io` and `tmp` are not in the worktree; the map states them from the brief. |
| 2, 3 | `projects/` tiers read from `scan:` in `sources.yml` and `ls`; the tier shapes agree with the brief. |
| 4 | The `find ... -prune ...` listing prints 38 paths: 18 hub data files with `registries/career.yml` (the brief says 17 files "with `registries/career.yml`"; the listing has 17 entry-list files plus `career.yml`), 13 oculus config and catalog files, `.agents/plan.yaml`, `tools/present/content/present.yml`, `tools/skills/catalog.yaml`, and the four project-internal files. None was named by a map (the map did not exist). |
| 5 to 13, 17, 20 to 22 | Checked by reading the sources the cases name (`validate.ts`, `registries.ts`, `manifests.ts`, `collection.ts`, `entries.ts`, `host.ts`, `normalise-career.ts`, `feeds.ts`, the view registrations). Premises hold except the points under "Anything in the brief that was wrong". |
| 14, 15, 23 | `diff` of `CONTEXT.md`, `README.md` and `docs/RESEARCH-APPROACH.md` against the base copy printed nothing. |
| 16 | `yaml.safe_load` of `sources.yml` exited 0; the non-comment diff against the base printed nothing. |
| 18 | The `sed -n '12,/^# Roots the server/p' ... | grep -n '^ *#.*\( - \| -- \|---\)'` check printed six lines (file lines 24, 28, 40, 45, 53, 78). `LC_ALL=C grep -n '[^ -~]'` over `CONTEXT.md`, `README.md`, `docs/RESEARCH-APPROACH.md` printed nothing. |
| 19 | `docs/DATA-MAP.md` was absent. |

## DONE / NOT DONE

Verify-list runs: the `checks.sh` full list ran 2 times, both exit 0. Only the first run's exit status (0) is quoted, because the log file read afterwards held another run's output. The second run, quoted:

```
$ npm run test:quick
test:quick: 5 changed file(s), from git since HEAD
test:quick: 17 test file(s), 10 essential
ok      ASCII gate (0.4 s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (11.9 s)
ok      eslint (11.7 s)
ok      svelte-check (6.6 s): 1791156402437 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.9 s): Duration  6.50s (transform 6.56s, setup 0ms, import 15.22s, tests 3.72s, environment 5ms)
test:quick: 19.3 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

The brief's own list ran once after the last change (the second `checks.sh` run is the same moment's state):

| # | Command | Result |
|---|---|---|
| 1 | `npm run diagrams` (from `tools/oculus`) | wrote the nine diagram pairs of `docs/diagrams/`, exit 0 |
| 1 | `npm run test:quick -- config/layout.yml config/sources.yml config/text/app.yml HELP.md src/lib/data/sources/docs.ts` | `ok  prettier`, `ok  ASCII gate`, `ok  svelte-kit sync`, `ok  eslint`, `ok  svelte-check ... 0 ERRORS 0 WARNINGS`, `ok  vitest ... Duration 4.51s`, `test:quick: 7.9 s (limit 45.0 s); every command passed` |
| 2 | `npx vitest run tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts` | `Test Files  2 passed (2)`, `Tests  48 passed (48)` |
| 3 | the spec's `perl` ASCII gate over `src tests bin config` (excluding `local.yml`) | prints nothing; the worktree has no `bin` folder, so `find` reports `bin: No such file or directory` and the gate covers `src tests config` |
| 3 | `LC_ALL=C grep -n '[^ -~]' docs/DATA-MAP.md docs/RESEARCH-APPROACH.md CONTEXT.md README.md` | prints nothing (exit 1) |
| 4 | `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" ...layout.yml ...sources.yml ...app.yml` | exit 0 |
| 5, case 4 | the `find ... -prune ...` listing, each of the 38 paths grepped in backticks in `docs/DATA-MAP.md` | no `NOT NAMED` line |
| 5, case 15 | `diff` of `README.md` against the base | `1c1` (`# Research hub: map` to `# Research hub`) and `6,16c6` (the table to one paragraph); line 5, the heading `## Where things live`, is kept |
| 5, case 16 | `yaml.safe_load` of `sources.yml`, then `diff <(grep -v '^ *#' base ... \| grep -v '^ *$') <(grep -v '^ *#' ... \| grep -v '^ *$')` | exit 0, and the diff prints nothing |
| 5, case 18 | the `sed -n '12,/^# Roots the server/p' ... \| grep -n '^ *#.*\( - \| -- \|---\)'` check | prints nothing; the same grep for ` - ` and ` -- ` over `docs/DATA-MAP.md` and `CONTEXT.md` prints nothing; the history-word grep over the added lines and the map prints only `one new paper` (a description of the scout's finds) and the pre-existing `as it was left` of `HELP.md` line 19 |
| 5, case 19 | the backticked-path loop | prints 10 lines, each an allowed exception: `.agents/tmp/`, `.agents/worktrees/`, `.claude/settings.local.json`, `projects/software`, `theaxec.github.io/`, `theaxec.github.io/_data/publications.yml`, `theaxec.github.io/_linkedin/`, `tmp/`, `tools/cockpit/cockpit.local.yml`, `tools/oculus/config/local.yml` |
| 5, case 20 | `grep -rn --exclude-dir=node_modules -e "\bNAME\b" tools/oculus/src tools/data tools/cockpit/src` for each of the 49 camelCase and CONSTANT identifiers in backticks | no `NOT FOUND`; `def first_path` at `tools/data/redownload.py:52` and `def build_links` at `tools/cockpit/src/cockpit/discover.py:99` |
| 5, case 23 | `diff` of `docs/RESEARCH-APPROACH.md` against the base | `57c57` only; line 59 and `tools/figures/` are unchanged |
| 6 | `diff -rq` against the base copy (details below) | lists only write-list paths |
| 7 | no test is added or changed; `sh utils/unused-exports.sh` and the cockpit `build.py --selftest` are not run (the step changes no export, and the cockpit reads no changed file but `docs/RESEARCH-APPROACH.md`, as a Markdown tab) |

## Files changed

From `diff` against the base copy (lines before to after; "diff lines" counts changed lines of both sides):

| File | Lines | Diff lines |
|---|---|---|
| `docs/DATA-MAP.md` | new, 477 | |
| `CONTEXT.md` | 24 to 21 | 7 |
| `README.md` | 60 to 50 | 14 |
| `docs/RESEARCH-APPROACH.md` | 92 to 92 | 2 |
| `tools/oculus/config/sources.yml` | 138 to 130 | 32 |
| `tools/oculus/config/layout.yml` | 176 to 177 | 3 |
| `tools/oculus/config/text/app.yml` | 72 to 72 | 2 |
| `tools/oculus/HELP.md` | 348 to 348 | 4 |
| `tools/oculus/src/lib/data/sources/docs.ts` | 149 to 148 | 5 |

`diff -rq H3-base/tools/oculus tools/oculus` lists "Files ... differ" for exactly `HELP.md`, `config/layout.yml`, `config/sources.yml`, `config/text/app.yml`, `src/lib/data/sources/docs.ts`; `diff -rq H3-base/docs docs` lists `RESEARCH-APPROACH.md` and "Only in docs: DATA-MAP.md". The other "Only in" lines come from the base copy holding only part of `tools/oculus/`. `tools/oculus/docs/diagrams/` is regenerated by `npm run diagrams` and is not a write-list path (see the not-verified list).

## Case 13: lose-nothing audit of `CONTEXT.md:5-9` and `README.md:5-16`

`CONTEXT.md` line 6:

1. `projects/` is the manuscript portfolio: map, root table row `projects/`.
2. `active/`, `manuscripts/`, `ideas/` flat, one folder per project: map, `projects/` tier table and its first bullet.
3. "manuscripts/ (thesis-built, student first author, Axel senior)": not carried; the tree contradicts it. `lead` in `projects/manuscripts/*/project.yml` reads Axel Faes 9 times, Axel Faes and Jakob Nolte 1, Dongho Chun, Pergher, Dries Cornelissen, Meseret Assefa Kerga, Ward Ceyssens once each (python `yaml` count run in this turn).
4. `archive/` shipped work, style references for tensor figures: map, `projects/archive/` row (the style-reference use is carried as the brief's text states it; not verified against the tree).
5. `coauthor/` contributed, not led; archive and coauthor nested: map, tier table.
6. "the cockpit finds a project at any depth": map, the nested bullet (walked to any depth; read by `readManifests`).
7. The filing folders `archive/published/<year>/<name>`, `archive/<outcome>/<name>`, `coauthor/published/<year>/<name>`, `coauthor/active/<name>`, `coauthor/abandoned/<name>`: map, the `Folder` column categories of the `projects/` table.
8. "Those folder names mean nothing to the tooling; type/outcome lives in each project.yml": map, nested bullet (the first folder is recorded as `category`; `type` is read from each manifest). The statement that the names "mean nothing" is not carried, because the first folder under the tier is recorded as `category` (`readManifests`).
9. The live tiers stay flat because a folder with no manifest is a ghost card: map, flat bullets.

`CONTEXT.md` line 7: `tools/` holds the cockpit (`build.py` builds `cockpit.html`), `tools/present/`, and the helpers `deposit`, `data`, `figures`, `skills`; design and tiers in `tools/cockpit/DESIGN.md`: map, `tools/` table (all of them, plus `manuscript` and `oculus`), including the `tools/cockpit/DESIGN.md` pointer.

`CONTEXT.md` line 8: `talks/`, `literature/` supporting collections surfaced as cockpit tabs: `talks/` and `literature/` are not on the tree (`ls -A`), so they are not carried; `funding/`, `education/`, `applications/` are in the root table with the oculus views that draw them.

`CONTEXT.md` line 9: `docs/HPC-UTwente-howto.md` is the cluster guide: map, root table row `docs/`.

`README.md` lines 6-16: `projects/` row (tiers, nested filing, folder name equals `id`, no prefixes, unique hub-wide, manifest is the source of truth for status and venue, venue catalogue, pillars registry): map, `projects/` section, the `project.yml` note under the Files table, the `Files` rows for `registries/venues.yml` and `registries/pillars.yml`. `tools/cockpit/` row: root `tools/` table. `tools/present/` row (public showcase deck, offline HTML, built from each `PRESENT.md` and `present.yml`): `tools/` table; "Replaced `_presentation/` (retired)" is history and `_presentation/` is not on the tree, so it is not carried. `theaxec.github.io/` row (Jekyll, GitHub Pages, own repository, own remote, ignored, a fresh clone lacks it, cloned alongside, manifests mirror to `_data/publications.yml`): root table row. `funding/`, `registries/career.yml` row: root table, Files table. `applications/`, `education/` row, `network/` row (events feed the Focus ticker): root table, Files table, Notes. `registries/repos.yml` row (curated repos, code-availability coverage): Files table and the Code coverage bullet. `docs/HPC-UTwente-howto.md` row: root table. Cockpit tab names ("Cockpit Funding tab" and the rest) are replaced by the oculus view names.

## Case 21: reads, row by row

"Shown in" cells were read against each view's `registration` block (under `tools/oculus/src/lib/views/`), `placements` in `boards/collection/Collection.svelte`, `collections:` in `sources.yml`, and `FILE_KEYS` in `state/sessions/view-source.ts`; "One entry is" cells against each file's header comment and its first entry (printed this turn with `sed -n 1,3p` and a `yaml` load).

| Row | Confirmed by |
|---|---|
| `registries/boilerplate.yml` | header "Reusable manuscript boilerplate"; first entry "AI use - general"; collection `statements`, References page |
| `registries/data.yml` | header "Dataset registry"; entry `mimic-iv`; `datasets_file`, Data view (`sources/data/Data.svelte`) and collection `data` |
| `registries/domains.yml` | header "Application domains"; entry `method`; Domains view |
| `registries/organisations.yml` | header "Organisations"; entry `university-of-twente`; no registration reads it; Person draws organisations (`boards/person/Person.svelte`) |
| `registries/people.yml` | header "People"; entry `amir-haeri`; Person via `viewSourceFile('people')` |
| `registries/pillars.yml` | header "Pillars"; entry `tensor`; Pillars and Map views |
| `registries/repos.yml` | header "Code / GitHub repositories"; first entry `bttr`; collection `code` |
| `registries/resources.yml` | header "Resources"; entry `utwente`; no view of its own; `ProjectCard.svelte` is imported by `boards/projects/Projects.svelte` and `boards/project/Project.svelte`; Live HPC reads `slurm.resource` |
| `registries/venues.yml` | header "Venue catalogue"; entry `jbi`, named by `name`, keyed `id`; Venues view |
| `registries/career.yml` | `readCareer`/`normalise-career.ts`; Focus Career strategy panel (`boards/focus/CareerPanel.svelte`) |
| `funding/funding.yml` | header "Funding"; entry "NWO Veni"; collection `funding`, Academic Life |
| `network/events.yml` | header "Talks & Events"; entry "AAAI 2027"; collection `events`, label Talks & Events, Academic Life |
| `network/joint-work.yml` | header "Joint work"; entry `amir-haeri`; collection `joint-work`; Person |
| `education/education.yml` | header "Education"; first entry a course; collection `education`, label Education & Service |
| `applications/applications.yml` | header "position applications"; entry "VIB.AI"; collection `applications` |
| `tasks/tasks.yml` | header "Tasks & service"; entry "Submission"; collection `tasks`, Tasks & Service |
| `feeds/position-leads.yml` | header "Position leads"; entry "Postdoctoral Researcher ..."; Position Leads (`leads_file`) |
| `feeds/literature-radar.yml` | header "Lit Watch radar"; Lit Watch (`radar_file`) |
| `project.yml` and the side-project forms | `readManifests`, `FIELDS` of `normalise-personal.ts`; Projects, Coauthor, Archive, Personal, Project, Editor |
| config rows | each header comment and `options.yml`; Settings lists them |

Folder tables: every "holds" cell was read against `ls` of the folder in this turn for `background`, `education`, `applications`, `applications/archive`, `funding`, `network`, `tools`, `tools/oculus/demo`, `.claude`, `.codex`, `.agents` (`secrets`, `theaxec.github.io`, `tmp`, `.agents/worktrees` from the brief). `applications/active/` is not on the tree, so the map names no such folder.

## Judgment calls

- The Files section has two tables (hub data files; oculus configuration files), a views table ("Views that draw these files") and group lines, so the "Shown in" cells name views only and each view's page is in one place.
- A cell with no value reads `none`, not a lone hyphen.
- A row for "Hub document" is in the views table because the Help group opens `docs:` entries through the `doc` view.
- The `README.md` heading `## Where things live` at line 5 stays, with one paragraph beneath it; the brief's range 5-16 holds the heading and the table.
- The `CONTEXT.md` Layout heading stays; lines 6-9 become one paragraph that names what the map holds.
- The collection comment at `sources.yml` says "An entry is edited in the card's form", replacing "Files are editable in served mode".
- In the conditions table the `year` row is omitted (it holds on every tier, so it has no condition), and the radar rows other than `motif`/`maps_to` (the idea bucket, stated in the file header) and `idea_spark` are omitted, because no file states a condition for `project`, `relevance`, `why` or `threatens`.
- The `type` link row names `type_color` as what `checkType` checks and notes that the form offers `type_order`.
- The `.claude/` and `.codex/` rows carry their folder names from `ls -A` of the worktree.
- `docs/DATA-MAP.md` is not run through prettier: `docs/` is outside `tools/oculus/`, whose prettier config checks only its own tree; table columns are not aligned.

## Reader-visible changes

- Views catalogue, Help group: before, entries Help, Memories, Research approach, Agent approach, HPC how-to (chords `h1` to `h5`); after, the same followed by Data map, so `h6` opens the Data map (views first, then the `docs:` list in order). Source: `docs:` in `tools/oculus/config/layout.yml` (line 177).
- Help page, second pane: before, tabs Research approach, Agent approach, Memories; after, Research approach, Agent approach, Data map, Memories (`layout.yml` line 97).
- `HELP.md` line 19: "(this manual and the HPC how-to beside Research approach, Agent approach and the Memories wall)" now reads "... Research approach, Agent approach, Data map and the Memories wall)".
- `HELP.md` line 74 and the keyboard help's Help row (`config/text/app.yml` line 12): `h1-h5` becomes `h1-h6`. No other file names `h1-h5` (`grep -rn` over `src config tests HELP.md DESIGN.md README.md`).
- `Doc` view: no change.

## False comments or help lines outside the write list (for the orchestrator to book)

- `registries/pillars.yml:31`: `color` help names `tools/oculus/config/vocab.yml`; the file is `tools/oculus/config/catalogs/vocab.yml`.
- `registries/venues.yml:18` and `:21`: `category` and `tier` help say the options come from `cockpit.yml`; they come from `venue_categories` and `venue_tiers` in `tools/oculus/config/catalogs/vocab.yml`.
- `registries/domains.yml:2`: "colour via cockpit.yml `themes:`"; oculus draws the colour from `vocab.yml`.
- `registries/data.yml:11`: `access:` "in {open, registration, credentialed}"; `data_access` also holds `private`, and `registries/data.yml:82` writes `access: public`, which is not a key of `data_access`.
- Headers that send a reader to `tools/cockpit/README.md` for the schema: `education/education.yml:1`, `network/events.yml:4`, `funding/funding.yml:2`, `registries/repos.yml:4`, `applications/applications.yml:1`; each file's schema is its own `schema:` block.
- `tools/oculus/config/behavior.yml:3`: "Source roots and permitted file extensions live in sources.yml"; `sources.yml` states that which files open for editing is no key.
- `registries/venues.yml` and the other registries' headers name "tab" and cockpit builders (`build.py venues_tab_html()`); oculus draws views.

## Statements of `tools/figures/hub-map.svg` the map shows false

- "living project state: memory/project-*.md": the hub has no `memory` folder and no `project-*.md` file (`find . -name memory` in the worktree finds nothing). `docs/RESEARCH-APPROACH.md:57` repeats it ("the memory files hold living state").
- The tier list omits `side-projects/` and `projects/software`; that is an omission, not a false statement.

## Places the tree departs from a condition the map states

- `outcome` and `doi` outside the archive tier: `projects/active/linfoot-estimator/project.yml` (`outcome`, `doi`), `projects/manuscripts/erp-signatures/project.yml` (`outcome`), `projects/coauthor/abandoned/individual-reference-intervals`, `projects/coauthor/active/clinical-hccnet` (`outcome`, `doi`), `.../active/elixir-fl4e`, `.../active/flkit`, and under `projects/coauthor/published/`: `2016/chi-household-survival`, `2016/chi-purpose-centric`, `2017/algebraic-effects-compilation`, `2017/http2-best-practices`, `2018/http2-web-performance`, `2023/coordinated-fingers-ecnr`, `2023/ecog-frequency-features` (`outcome`, `doi`), `2023/modulation-lmp-bci`, `2024/highgamma-event-detection`, `2025/editorial-bigdata-ai-ms` (`outcome`, `doi`), `2025/pfl-ms-npj` (`outcome`, `doi`), `2025/proprioception-exoskeleton` (each a `project.yml`).
- Conference-only fields on a journal: `registries/venues.yml` entry `hcin` (`category: journal`) carries `timing`, `deadline` and `call`.
- `network/events.yml`: "Graz BCI Conference 2026" has `role: present` and no `link`.
- `registries/data.yml:82`: `access: public` is not a key of `data_access`.
- `registries/venues.yml`: `kuleuven-thesis`, `uhasselt-thesis` and `xai-nl` carry no `category`.

No departure found for: flat-tier `type` against the scan rule, `focus` values, `followup.after` without `do`, `registries/people.yml` `folder` (all five student folders exist), `self` (exactly one), `funding` `key` and `statement` on awarded and contributing entries, `resources.yml` `host` on the cluster.

## Anything in the brief that was wrong or impossible

- Case 4 and "What is on the tree": "17 hub data files with `registries/career.yml`" is 18 files by the listing (17 entry-list files plus `career.yml`). The map carries no count.
- The link table's `type` row: `checkType` checks the keys of `type_color`; `type_order` is the form's choice list and the board order.
- Case 22 ("other `tags` fields hold free words"): `links` in `registries/organisations.yml` and `registries/people.yml` carry no entry on the tree, so the map says neither schema nor reader gives their values a meaning.
- The brief lists `applications/active/`; the worktree has no such folder. The map names the folders `ls` prints.
- `ProjectCard.svelte` is imported by `Projects.svelte` and `Project.svelte`; the "Shown in" cell for `registries/resources.yml` names Projects, Coauthor, Archive and Project.
- The `CONTEXT.md` fact "manuscripts/ (thesis-built, student first author, Axel senior)" is false on the tree (see case 13).
- The brief's case 18 and Verify 3 name `bin`; the worktree has no `bin` folder.
