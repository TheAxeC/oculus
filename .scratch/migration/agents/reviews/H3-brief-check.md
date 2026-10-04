# Step H3 brief check (on main at 3e3574ef9)

This is the report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/H3.md`, read on disk (uncommitted). The brief was written at ed0e6de58. `git diff --stat ed0e6de58 3e3574ef9` lists only `agents/reviews/S5-brief-check.md`, `orchestrator-state.md` and `queue.md`, so every premise is still read against the same tree. Rules file and standards: `agents/spec.md`, which is the configuration block's only `standards:` entry and `.agents/plan.yaml`'s `rules:`. `plan.md` has no "Goal" heading. The goal used below is the ledger's opening paragraph plus H3's line (`plan.md:225`) and ruling Z346 (`plan.md:1053`).

## 1. Names

- `docs/DATA-MAP.md`, "Data map": `git grep -n -e "DATA-MAP" -e "data map" -e "Data map" -- ':!tools/oculus/.scratch' ...` finds one hit, `.agents/skills/academic-paper/references/credit_authorship_guide.md:29` ("metadata mapping"). It is unrelated. No other hit.
- CONTEXT.md's Layout section and `:3` ("one-line folder map"): `git grep -n -e "Where things live" -e "one-line folder map" -e "folder map" -e "Layout section" ...` hits only `CONTEXT.md:3`, `README.md:5` and `.agents/skills/project-cleanup/SKILL.md:248`. The last one is about a project's `code/` map and is not made false.
- README.md "Where things live" (`:5-16`): `cat -n README.md` line 1 reads `# Research hub: map`. Once the table becomes a pointer, the title calls README the map while the map is `docs/DATA-MAP.md`. Line 1 is outside the write list (`README.md lines 5-16`), and item 3 says no other README line changes. The change makes this line false.
- The `docs:` list and the lists of the three hub documents: `git grep -n -i -e "HPC how-to" -e "Research approach" -e "hub documents" ... -- tools/oculus` and `git grep -n AGENT-APPROACH`. Hits outside the write list:
  - `DESIGN.md:385` ("The hub's own documents are the `docs:` list of `layout.yml`"): stays true.
  - `HELP.md:271`, `config/text/views/sources/doc.yml:1`, `config/text/views/system/workbench.yml:17`, `config/catalogs/options.yml:436` (`docs` is a family with `fields` and no `default`, so nothing there pins three entries), `src/lib/server/content/docs.ts:10,390`, `src/lib/views/system/help/Help.svelte:3`, `src/lib/state/workbench/navigation/catalogue.ts:20`: all stay true.
  - `tools/cockpit/data/config/layout.yml:121-123`: the cockpit's own list, which does not claim to be complete; not made false.
  - `git grep -n -e HPC-UTwente -e RESEARCH-APPROACH -- tests` prints only `tests/data/snapshot/resources.test.ts:33`, a fixture string. No test pins the Help page's tabs.
- `sources.yml` comments: the write range is `:24-86`. `cat -n config/sources.yml` `:12` reads "Where to find projects (paths relative to research/)". The hub folder is `research-hub`, and `options.yml:598` says "relative to the hub". This comment says what the hub paths are and is stale, and it is outside the write range. The step does not make it false, but item 4's rule ("each comment that says what a hub file is ... made true") reaches it and the write list does not.
- Another map of the layout that the brief does not name: `git grep -n hub-map` gives `docs/RESEARCH-APPROACH.md:59` (the figure `tools/figures/hub-map.svg`, made by `tools/figures/gen_figures.py:472` `hubmap_svg`), plus the paragraph at `docs/RESEARCH-APPROACH.md:57` on flat and nested tiers. The change does not make it false. It is a third partial map that "The other places that map the hub today" leaves out.
- Steps queued after H3 that will make the map false: `plan.md` M6 ("the collection forms removed ... the add and edit form every collection shares goes") and M8 ("every hub file's `schema:` ... `from:` ... `when:`"). Item 1.6 has the map describe the form's kinds (`FormKind`, `formFields`, `extraRawFields`, `form-values.ts`) and the current `schema:` blocks. Neither the M6 line nor the M8 line (`grep -n "^- M8" plan.md`) names `docs/DATA-MAP.md`. O29's line does say the retirement updates the hub docs, which covers the map's `tools/cockpit/` rows.

Findings:
- `README.md:1` "# Research hub: map" becomes false and is outside the write list.
- `sources.yml:12` "paths relative to research/" is a stale comment of the kind item 4 covers, outside the write range `:24-86`.
- No later step owns keeping `docs/DATA-MAP.md` true when M6 removes the collection form and M8 rewrites the schemas. Neither line names the map, and the brief's decision 4 ("a map that is false the day after it lands is worse than none") is aimed at this risk.
- `docs/RESEARCH-APPROACH.md:57-59` and `tools/figures/hub-map.svg` are a map of the hub layout that "The other places that map the hub today" does not list. Whether to point it at the map is the session's call. The brief should name it either way.

## 2. The step line

- "a document in `docs/`": What to build 1 (`docs/DATA-MAP.md`).
- "every folder of the hub and what it holds": 1.2 Folders.
- "every YAML file, what one entry is, and the view that shows it": 1.3 Files, with its group lines.
- "every field that names something in another file (a person, an organisation, a resource, a project, a venue, a pillar, a domain, a dataset, a funding entry, a folder) and the file it names": 1.4 Links between files.
- "the fields that hold only under a condition (a tier, a role)": 1.5.
- "where each file's schema is, `config/catalogs/manifest-schema.yml` for `project.yml` among them": 1.6, first part.
- "what each field type means (`metalist`, `tags`, `raw` and the rest)": 1.6, the three tables.
- "`CONTEXT.md`'s stale Layout section pointed at it (ruling Z346)": item 2.

Every part has a requirement. Two fields that name a folder or a hub file are missing from 1.4's "at least" list, although they fall under the line's "a folder":
- `registries/resources.yml` `links`, which holds `docs/HPC-UTwente-howto.md` (python pass over the `links:` values printed `['docs/HPC-UTwente-howto.md']`).
- `registries/data.yml` `hpc_path` (values `~/data/mimic-iv`, ...).

Findings: none with no requirement. The two fields above should be added to 1.4's list so the builder does not have to find them.

## 3. Premises

- Root names: `ls -A` matches the brief's list, plus `zz-look-d37` (untracked; `git status` at session start shows `?? zz-look-d37/`). `git ls-files | awk -F/ '{print $1}' | sort | uniq -c` matches the tracked folders. Holds.
- `.gitignore:22`, `:23`, `:122`, `:130`: `grep -n` prints `22:/theaxec.github.io/`, `23:/tmp/`, `122:/.agents/worktrees/`, `130:/tools/cockpit/cockpit.local.yml`. Holds. `README.md:28` names `settings.local.json`. Holds.
- `projects/` tiers and categories (`ls projects`, `ls projects/archive projects/coauthor`), 94 `project.yml` (`git ls-files 'projects/*project.yml' | wc -l` gives 94), `sources.yml:19` `projects/software` optional, three side projects, ten registries, eight funding calls plus `about-axel/`, `network/`, `education/`, `applications/` (outcomes `accepted declined not-applied rejected withdrawn`), `tasks/`, `feeds/`, `docs/`, `tools/` (eight folders), `.agents/tmp/` empty, `.claude/skills` and `.codex/skills` symlinks into `.agents/skills`: all hold.
- 56 text catalogs, 29 demo YAML, 34 dummy YAML, six `tools/cockpit/data/config/*.yml`, three `templates/project.*.yml`, 17 `projects/*PRESENT.md` (`git ls-files` counts): all hold.
- The yaml pass over the 17 hub data files (`python3` with `yaml.safe_load`):
  - The list key is `entries` everywhere except `data.yml` (`datasets`).
  - Every file has a `schema:` except `literature-radar.yml`.
  - Types used: `checkbox date metalist raw select tags text textarea`. Attributes: `field help label options options_from required type`.
  - `metalist` appears in six files: repos, funding, events, joint-work, education, applications.
  - `options_from`: venues `category`/`tier`, joint-work `person`.
  - Fields outside the schema: `snooze` in venues, events and education; `subtasks` in tasks.
  - First fields: venues `name`, funding `title`.
  - All hold.
- `career.yml` top-level keys (python pass): `title milestone situation order hosts host_criteria not_hosts eligibility dropped`. Holds. `normalise-personal.ts:26` `FIELDS`, `vocab.yml:196` `side_project_status`: hold.
- `validate.ts` (`grep -n`): REFERENCES `:82`, SHAPES `:133`, checkKeys `:217`, checkFocus `:283`, checkFolderNames `:382`, checkCollaborators `:406`, checkWaitingOn `:428`, checkChips `:458`, checkCollectionSchema `:536`, checkEntryIdentity `:559`, checkPeople `:589`, checkJointWork `:637`, checkFunders `:669`, checkFundingStatements `:715`, checkHostStatus `:780`, `RENAMED_FIELDS = { program: 'pillar' }` `:75`. All hold.
- `registries.ts:23-48` REGISTRY_FILES and SHAPES: holds. `manifests.ts:212` `const tier = (rule.dir.split('/').pop() ...`, `record` `:115`, ghost `:171`: hold. `model-entities.ts:15-17` Tier: holds. `options.yml:598-606` scan `tier:`: holds.
- `schema.ts:29-45` FormField, `:57-63` NOT_IN_MODEL, `:225-243` choicesFor: hold. `entries.ts:84` identityField, `:98-122` typeRefusal, `:154-175` metalistFields and normaliseMetalists: hold. `collection.ts:595`, `:609`, `:618`, `:637`: hold. `view-source.ts` FILE_KEYS `:28-37`: holds. `layout.yml:96-97`, `:173-176`, `HELP.md:19`, `docs.ts:6-8`: hold. `CONTEXT.md:3,5-9` as described: holds.
- `raw` edited as YAML text (`form-values.ts:87`, `:117`): false. `sed -n '14,60p' src/lib/state/forms/form-values.ts` shows `:23` "A raw block as the one-line JSON text the textarea edits", `:24-27` `rawFieldText` returning `JSON.stringify(map)`, and `:40-55` `parseRawField` using `JSON.parse`. `registries/data.yml`'s schema help for `retrieval` says "fetch recipe (raw JSON: ...)". The brief says YAML text; the tree edits one line of JSON.
- `kindOf` (`collection.ts:156-166`) "by name first: `sub`, `status`, `tags` and `related` as chips, `meta`, `note` and `statement` as body, `link` and `url` as links; then `options_from: people` as a person; then the type": false in two places. `sed -n '150,168p'` shows the order `sub`, `status`, then `optionsFrom === 'people'` as person, then `CHIP_FIELDS` (`tags`, `related`) or type `tags` as chips, then field `meta` or type `metalist` as `meta`, then `BODY_FIELDS` (`note`, `statement`) or type `textarea` as body, then `LINK_FIELDS`, then text (`:136-138` for the constants). The people rule comes before the name rules, each rule tests the name or the type together, and `meta` draws as its own `meta` kind, which is not body.
- "`outcome`, `doi`, `year` (the schema's section "Archive (archive tier)")": false for `year`. `manifest-schema.yml:42` reads `year: { label: "Year", type: text, section: Core }`. Only `outcome` (`:71`) and `doi` (`:72`) are in the Archive section.
- "`paths` ... no reader" / "`git grep` finds no reader of `paths:`": holds for oculus, false for the hub. `git grep -n "get(.paths" -- tools/cockpit/src` prints `tools/cockpit/src/cockpit/discover.py:104: for k, v in (manifest.get("paths") or {}).items(): # manifest overrides (non-canonical paths)`. `projects/manuscripts/btfno/project.yml` carries a `paths:` key.
- `funding.yml` `funder` (organisations), `checkFunders`: the check exists (`validate.ts:669`, reads `entry.funder`). But `grep -n -c "^\s*funder:" funding/funding.yml` prints `0`, and the python schema pass prints `funding/funding.yml NOT IN SCHEMA: {'funder'}`. The brief presents `funder` as a field of the file. It is a field oculus checks that neither the schema nor any entry has, so the map's row needs that said.
- "`tools/oculus/src/lib/data/sources/feeds.ts` with the file's header comment for `literature-radar.yml`" as where the fields are defined: partly false. `sed -n '1,45p' feeds.ts` shows its head comment "It summarises and does not carry. The Lit Watch ... views read these files for themselves". It reads `meta` only (`:77-78` "the day the last sweep ran"). The entry fields are read by `src/lib/state/feeds/radar.ts:91,106,117-119` and `src/lib/views/feeds/radar/RadarCard.svelte:50-54,139,153` (`git grep -n -e maps_to -e idea_spark -e threatens -- tools/oculus/src`). Read list item 5 names `feeds.ts:1-40` and not `radar.ts`.
- "`present.yml` `deck.order[].ref` (a project id)": incomplete. `config/present.yml:42` reads "A `framing` or `summary` entry names a key below; a `project` entry names a slide id, which is a project id or `<project>/<slug>`". `:46` has `{ slide: framing, ref: engine }`. `ref` is a project id only under `slide: project`, which makes it a conditional field missing from 1.5.
- "`tags` there is several free strings" (1.6, the manifest schema): false for one field. `manifest-schema.yml:52` reads `"waiting-on": { ... type: tags, ... help: "... a person from the people list or another project ..." }`, and `checkWaitingOn` (`validate.ts:428`) resolves each item against people and projects.
- "`:25-50` (the eight registry files)": seven. `cat -n config/sources.yml` shows `venues_file :25`, `datasets_file :30`, `pillars_file :34`, `domains_file :37`, `people_file :43`, `organisations_file :47`, `resources_file :50`. Funding's path comes from the `collections:` entry `funding` (`src/lib/data/index.ts:118-119` "the `collections:` list gives the seventh, since funding/funding.yml is named there and nowhere else", `:131`, `:138`).
- "`README.md:5-16` ... every row naming a cockpit tab": false for two rows. `README.md:10` (`tools/present/`) and `:11` (`theaxec.github.io/`) name no cockpit tab.
- Verify 8, "of the hub's documents only `docs/HPC-UTwente-howto.md`, in the watch list": incomplete. `git grep -n "docs/" -- tools/cockpit/data/config/layout.yml` prints `:121-123`, which read all three hub documents. The conclusion still holds, since H3 changes none of them.
- `position-leads.yml` `fit` (`leads_fit`): the field is prose (`fit` values begin `**strong** - ...`). `leads.ts:123-126` `fitKey` takes the first `leads_fit` word found in the text. It does not hold a key. The brief's "(`leads_fit`)" is loose rather than false. The map should say the field is prose.

Findings:
- `raw` is JSON text, not YAML text.
- The `kindOf` order and the `meta` kind are wrong.
- `year` is in section Core.
- `paths:` has a reader in the cockpit.
- `funder` is absent from the funding schema and from every entry.
- The radar's fields are read by `radar.ts` and `RadarCard.svelte`, not `feeds.ts`.
- `deck.order[].ref` is conditional on the slide kind.
- `waiting-on` is a `tags` field holding keys.
- `sources.yml:25-50` holds seven registry keys.
- README rows `:10` and `:11` name no cockpit tab.
- Verify 8's reason is incomplete.
- `fit` is prose.

## 4. Cases and checks

- 1: Consistent. On main, `ls -A` also prints `zz-look-d37` (untracked, temporary). In the sparse worktree it will not appear.
- 2: There is a tension with 1.2: the folder table's column "whether git tracks it" asks for one more fact on the `secrets/` row, while case 2 says the row says "holds secrets and nothing more". The brief should say which wins.
- 3: Consistent (`spec.md`, "Where you work"; the ASCII gate excludes `local.yml`).
- 4: Consistent. Run on main, the `find` (outside `.agents/worktrees/`) prints the 17 data files plus `career.yml`, the 13 config files, `.agents/plan.yaml`, `tools/present/content/present.yml`, `tools/skills/catalog.yaml`, the four project-internal files, and ignored files only: `theaxec.github.io/...`, `projects/active/linfoot-estimator/code/vendor/venv/...` (`git check-ignore -v` prints `.gitignore:67:venv/`) and `tools/cockpit/cockpit.local.yml`.
- 5 to 8, 10 to 12, 14 to 17, 20: Consistent.
- 9: Its expected answer, "edited as YAML text", contradicts the tree (`form-values.ts:23-55`, JSON). Run on the unchanged tree, it gives a case the brief's own text gets wrong, which is the builder's stop.
- 13: Consistent with the hub rule that nothing is lost.
- 18: It covers only `docs/DATA-MAP.md`, `CONTEXT.md` and `README.md`. The `sources.yml` comments the step rewrites carry spaced hyphens (`:24` "Venue catalogue tab (Venues, in Collections) - journals", `:28`, `:53`, `:78`), and the brief's Conventions apply the dash rule to every document. `spec.md`, "What every package obeys" (the history grep), covers history words in comments but not dashes. No case or verify line checks the rewritten comment lines for ` - `.
- 18 against 1.3: 1.3 names "the 56 text catalogs" as a group line, while item 1 and case 18 refuse "a count of entries or files".
- 19: Its allowed exceptions (paths under `theaxec.github.io/`, `tmp/`, `.agents/worktrees/`, and folder names relative to their table) leave out paths the brief itself requires the map to name that a worktree does not hold:
  - `projects/software`: absent, and named by 1.2.
  - `tools/cockpit/cockpit.local.yml`: ignored, `.gitignore:130`, named by case 4.
  - `tools/oculus/config/local.yml` or `config/local.yml`: ignored, named by case 3 and 1.6.
  - `.claude/settings.local.json`: ignored machine-wide, named by "The folders".
  - `.agents/tmp/`: an empty folder git does not carry, named by "The folders".
  
  Each would print `missing:` and fail the case as written.
- Conventions on comments in `tools/oculus` files: "a comment paragraph rewrapped at 100 columns as a whole" follows `spec.md`, "What every package obeys" (rewrap at 100). The same page says "One line per paragraph or bullet in any Markdown or YAML you edit". The two read differently for a YAML comment, and `sources.yml` holds both forms (`:89-95` wrapped, `:49` and `:105` one line). The brief picks one without naming the other.

Findings:
- Case 9 contradicts the tree.
- Case 19's exceptions miss five paths the map must name.
- Case 2 conflicts with the folder table's tracked column.
- 1.3's "56" conflicts with the no-count rule.
- Case 18 does not cover the rewritten `sources.yml` comments.

## 5. The question

"The goal" is the part of the ledger's goal that H3 delivers: one map answering where a thing is, what one entry is, which view shows it, which fields link to which file, which fields are conditional, where each schema is and what each type means; and `CONTEXT.md`'s Layout section pointing at it.

- The check on the step's line: H3's line names no check. Could it pass without the goal? Not applicable, since there is none. Acceptance rests on the cases.
- Case 1: yes. A row per name passes with a wrong or empty "what it holds" cell. Nothing beyond reading checks the cell.
- Cases 2, 3: no. They are safety conditions, not the goal.
- Case 4: yes, partly. It passes once each path is named anywhere, a group line included, with no "one entry is" or "Shown in". 1.3's columns carry that, and no case checks them.
- Case 5: no for the twelve named functions. Yes for the "not checked" cells, which are judged by reading `validate.ts` and `rules.ts` only.
- Cases 6 to 12: no. Each asks a reader question whose answer is only right if the map is.
- Case 13: no.
- Cases 14 to 16: no for their diffs.
- Case 17: no.
- Cases 18 to 20: yes. They are form checks.
- What to build 1.3 ("Shown in"): yes. No case asks "which view shows `<file>`" or checks a view against its `registration` block. A wrong view passes every case, and "the view that shows it" is a third of the step line's second clause.
- What to build 1.2 (what each folder holds): yes, as for case 1.
- What to build 1.6 (field types): case 7 covers `metalist` and case 9 covers `raw`. Nothing covers `tags` in the collection schema against the manifest schema, or `chips`. It passes with the false "`tags` there is several free strings" written in (see Premises).
- What to build 2 to 5: no for each. Each is a pointer or entry, and its case checks it.

Findings:
- No case checks the "Shown in" column or the folder table's "what it holds" against the tree, so a wrong view passes every case. A reader-question case such as "which view shows `network/events.yml`, and `registries/organisations.yml`?" would close it.
- H3's line names no check.

## 6. Implied inputs

This is not a code step. The step writes Markdown, comments in `sources.yml` and `docs.ts`, and one entry plus one tab in `layout.yml`, which existing code reads. The config change implies two inputs, and the brief states both:
- A Help page made before the change keeps its tabs (decision 6, case 17 "a new Help page").
- The chord count of the Help group becomes `h6` (decision 6).

Findings: none.

## 7. ADRs

- `grep -n adr .agents/plan.yaml` prints nothing, so the folder is `docs/adr`. `ls docs/adr` gives "No such file or directory". `git ls-files | grep -i -E '(^|/)adr/'` and `git ls-files | grep -E '/[0-9]{4}-[^/]*\.md$'` print nothing. The brief (`H3.md:3`) says no ADR touches the step.

Findings: none.

## 8. Dictated text

- `{ label: "Data map", path: docs/DATA-MAP.md, group: help }`: `grep -n -F '{ label: "Data map", path: docs/DATA-MAP.md, group: help }' H3.md` gives `80`. Holds: ASCII, one line per entry, the shape of `layout.yml:174-176`. The existing entries pad `label` to align `path:`; the dictated line does not, which is format only.
- The section names `**Folders.**`, `**Files.**`, `**Links between files.**`, `**Fields that hold only under a condition.**`, `**Schemas and field types.**`, `**Outside the hub.**`: `grep -n -F` gives `71` to `76`. They hold.
- The Files table, `grep -n '^|' H3.md` lines `150` to `156`:
  - `150` header and `151` rule: hold.
  - `152` people row: holds on ASCII and history. Its "Shown in" cell, "Person; any collaborator, joint-work person or waiting-on value", names fields and values where the column and the other rows name views. This breaks the brief's own Conventions (no synonym cycling: one name, "view", for the thing the column holds) and the short-cell rule.
  - `153` funding, `154` venues, `155` data: hold.
  - `156` project.yml row: it gives the schema as `config/catalogs/manifest-schema.yml`, a path relative to `tools/oculus/`, in a document at the hub root where every other row uses a hub-relative path (`registries/people.yml`), and so does the link table (`tools/oculus/config/behavior.yml`, line `166`). A reader at the hub root finds no `config/` folder. Case 19's fallback `[ -e "tools/oculus/$p" ]` hides this. Rule broken: the brief's Conventions (one name for one thing, a reader cold) and `spec.md`, "The working rules that bind every package" ("name the actual function, file and line").
- The link table, lines `160` to `166`:
  - `160`, `161`, `162` venue_id, `163` collaborators, `164` affiliations, `165` person: hold.
  - `166` `slurm.resource` row: its last cell, "resolved by `tools/oculus/src/lib/server/machine/hpc/host.ts`; the builder states what it does with a key it cannot resolve, after reading that file", is an instruction to the builder inside a row the brief presents as map text, and it is two clauses in one cell. Rule broken: the brief's Conventions ("Real Markdown tables with short cells ... a cell that needs a sentence is split into a table row and a note below the table"). For the reader of the instruction: `host.ts:42-49` refuses with `notRead`, `unknown`, `notCluster`, `noHost` or `badHost`, each a sentence naming the key.
- No other line gives words for a file. Item 2's CONTEXT sentence, item 4's comments, item 5's arrangement tab and `HELP.md:19` say what the text must say without giving its words, so the builder words them. No dictated line's words are fixed by a ruling of the user; Z346 fixes no wording.

Findings:
- Line `156`: the oculus-relative schema path in a hub-root document, inconsistent with line `166` and the other rows.
- Line `166`: a builder instruction in a table cell, breaking the short-cell convention.
- Line `152`: a "Shown in" cell naming fields and values instead of views.

## Declined to judge

- The worktree `.agents/worktrees/H3` and the base copy `.agents/worktrees/H3-base/` do not exist yet. The `spec` skill creates them after this check, so the sparse-checkout list, the base copy's contents and every worktree-root command's output were not checked. Case 4 and `ls -A` were run on main instead, as reported.
- Whether `docs/RESEARCH-APPROACH.md:57-59` and `tools/figures/hub-map.svg` should be pointed at the map, and whether M6's or M8's line should gain the map. Both are the session's or the user's call. Both are raised above as findings.
- Which view registration draws each file. Only the files the brief names were confirmed to exist (`[ -e ]` on fourteen paths, all `ok`). Whether each "Shown in" mapping is right is the builder's read (read list 6).
- `plan.md` has no "Goal" section. The ledger's opening paragraph and H3's line were used as the goal.

Agent usage: a380d4e71bdd8a471, claude-opus-5-5, 237,058 tokens, 82 tool uses, 10.4 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Each item names the numbered entry of the brief's section "Changes from the brief check" that records the change.

### 1. Names

- `README.md:1` "# Research hub: map" becomes false: "What to build" 3 makes the line `# Research hub`, the write list gains `README.md` line 1, case 15 checks it (ruling Z436; brief change 1).
- `sources.yml:12` "paths relative to research/": "What to build" 4 and the write list widen to `:12-13`, the paragraph says the scan paths are relative to the hub root, and "The other places" names the false phrase (ruling Z436; brief change 2).
- No later step keeps the map true after M6 and M8: their lines carry the map (`plan.md:223`, `:228`, ruling Z436), named in "What is on the tree" and decision 4 (brief change 3).
- `docs/RESEARCH-APPROACH.md:57-59` and `tools/figures/hub-map.svg` unnamed: "The other places" names both; "What to build" 6 adds a pointer sentence to `:57`, leaves the figure and `gen_figures.py` unchanged and has the builder report any statement of the figure the map shows false; the write list, case 23 and Verify 3, 6 and 8 cover the file (ruling Z436; brief change 4).

### 2. The step line

- `registries/resources.yml` `links` and `registries/data.yml` `hpc_path` missing from 1.4: both are in 1.4's list with their values and readers (`normalise.ts`; `first_path` in `tools/data/redownload.py`), and case 22 asks for `links` (brief change 5).

### 3. Premises

- `raw` is JSON text: "What is on the tree", 1.6 and case 9 say one line of JSON text, citing `rawFieldText` and `parseRawField` (brief change 6).
- The `kindOf` order and the `meta` kind: "What is on the tree" gives the eight rules in their order (people before the name rules, each name rule also matching a type, `meta` its own kind), and 1.6 asks the map for that order (brief change 7).
- `year` is in section Core: 1.5 lists `outcome` and `doi` only and has the map say `year` holds on any tier (brief change 8).
- `paths:` has a reader in the cockpit: "What is on the tree" and 1.4 name `tools/cockpit/src/cockpit/discover.py:104` and say no oculus reader reads it (brief change 9).
- `funder` absent from the schema and every entry: "What is on the tree" states it with the `yaml.safe_load` pass, and 1.4 has the map's row say oculus checks a field no schema names and no entry carries (brief change 10).
- The radar's readers: "What is on the tree", 1.4 and 1.6 name `state/feeds/radar.ts` and `views/feeds/radar/RadarCard.svelte`, `feeds.ts` reading only `meta:`; both added to Read list item 5 (brief change 11).
- `deck.order[].ref` conditional on the slide kind: quoted from `present.yml:42`, given per `slide` in 1.4 and listed in 1.5 (brief change 12).
- `waiting-on` is a `tags` field holding keys: "What is on the tree", 1.4 and 1.6 say so with `checkWaitingOn`; case 22 asks it (brief change 13).
- `sources.yml:25-50` holds seven registry keys: "What is on the tree" lists the seven `*_file` keys and gives funding's path from `collections:` through `portfolioConfigFrom` (brief change 14).
- README rows `:10` and `:11` name no cockpit tab: "The other places" says which rows name a tab, which names the cockpit and which name none (brief change 15).
- Verify 8's reason: Verify 8 now says the cockpit reads `docs/RESEARCH-APPROACH.md` (which the step changes) through `tools/cockpit/data/config/layout.yml:121-123`, and that its selftest reads no hub document but the `inbox` entry, so it still need not run (brief change 16).
- `fit` is prose: "What is on the tree" and 1.4 say so, with `fitKey` in `state/feeds/leads.ts` (brief change 17).

### 4. Cases and checks

- Case 9 contradicts the tree: its expected answer is JSON (brief change 18).
- Case 19's exceptions miss five paths: the exceptions name `projects/software`, `tools/cockpit/cockpit.local.yml`, `tools/oculus/config/local.yml`, `.claude/settings.local.json`, `.agents/tmp/` beside the three ignored folders; the `tools/oculus/` fallback is removed, and Conventions make every path in the map hub-relative (brief change 19).
- Case 2 against the folder table's tracked column: case 2 and 1.2 have the `secrets/` row say what it holds and that git tracks it, nothing more; "What is on the tree" gives the tracked fact with `git ls-files --error-unmatch secrets` (brief change 20).
- 1.3's "56": 1.3 names the text catalogs by folder with no count (brief change 21).
- Case 18 and the `sources.yml` comments: case 18 covers the comment lines from `:12` to the comment over `roots:` with `sed -n '12,/^# Roots the server/p' tools/oculus/config/sources.yml | grep -n '^ *#.*\( - \| -- \|---\)'`, and "What to build" 4 rewords the six spaced hyphens (brief change 22).
- The comment form in YAML (100 columns against one line): Conventions say one line per comment paragraph in YAML, as `agents/spec.md` "What every package obeys" says for YAML, and keep the 100-column rewrap for the `docs.ts` head comment; "What to build" 4 and case 18 apply it to the two `sources.yml` ranges (brief change 23).

### 5. The question

- No case checks "Shown in" or "what it holds": case 21 asks which view shows `network/events.yml` (Talks & Events) and `registries/organisations.yml` (no view of its own; drawn in Person), and has every "Shown in", "One entry is" and "what it holds" cell read against the view's registration, an entry or the folder's listing, reported row by row (brief change 24).
- `tags` against `chips` in 1.6 unchecked (raised under the question's item 1.6): case 22 asks it for both schemas, and 1.6's sentence is corrected (brief change 25).
- H3's line names no check: "The plan line" says so and names cases 6 to 11, 21 and 22 as the reader questions that stand for its clauses (brief change 26).

### 8. Dictated text

- Line 156, the oculus-relative schema path: the cell is `tools/oculus/config/catalogs/manifest-schema.yml` (brief change 27).
- Line 166, a builder instruction in a cell: the cell is `hpcHostOf`, and a dictated note below the link table states what `host.ts` refuses (brief change 28).
- Line 152, a "Shown in" cell naming fields: the cell is `Person`; Conventions say a "Shown in" cell names views only (brief change 29).
- The `docs:` entry, format only: dictated padded to the columns of the entries above it (brief change 31).

### Found while the premises were read again

- `tools/oculus/HELP.md:74` and `tools/oculus/config/text/app.yml:12` read "h1-h5", which the new Help entry makes false: "What to build" 5, the write list, case 17, Verify 1 and 4 and decision 5 cover both lines (brief change 30).

### Dictated lines added or rewritten after the check, each held against `agents/spec.md` ("The working rules that bind every package", prose: ASCII, no em dash; "What every package obeys", no history words, one line per paragraph in YAML) and the brief's Conventions (no spaced hyphen, short cells, one name per thing)

- `# Research hub` (`grep -n '`# Research hub`' agents/briefs/H3.md` gives `92`, `115`, `248`): holds.
- `| `registries/people.yml` | one person the hub names | `entries` | `key` / `key` | own `schema:` | Person |` (`grep -n '^| `registries/people.yml` | one person' agents/briefs/H3.md` gives `175`): holds; the "Shown in" cell names a view.
- `| `project.yml` | the project itself | (the file) | folder name / folder name | `tools/oculus/config/catalogs/manifest-schema.yml` | Projects, Coauthor, Archive, Project, Focus, Map, Pillars, Domains |` (`grep -n '^| `project.yml` | the project' agents/briefs/H3.md` gives `179`): holds; the path is hub-relative and exists.
- `| `tools/oculus/config/behavior.yml` | `slurm.resource` | one | the cluster Live HPC polls | `registries/resources.yml`, `key` | `hpcHostOf` |` (`grep -n '^| `tools/oculus/config/behavior.yml`' agents/briefs/H3.md` gives `189`): holds; the cell is one name.
- The note below the link table, beginning "`slurm.resource` is resolved by `hpcHostOf`" (`grep -n '^`slurm.resource` is resolved' agents/briefs/H3.md` gives `193`): holds. ASCII, no dash, no history word (the grep for was, now, no longer, used to, replaced, retired, before, previously, still prints nothing on it); it names `tools/oculus/config/local.yml` by path and none of its keys or values, as case 3 asks, and that path is one of case 19's exceptions.
- `  - { label: "Data map",          path: docs/DATA-MAP.md,          group: help }` (`grep -n 'label: "Data map"' agents/briefs/H3.md` gives `94`): holds; ASCII, one line per entry, `path:` at column 34 and `group:` at column 67 as in `layout.yml:174-176`; the ` - ` in it is the YAML list marker.
- The case 18 and case 19 command lines are code lines, read whole: ASCII; the dashes in them are command options and grep patterns.
