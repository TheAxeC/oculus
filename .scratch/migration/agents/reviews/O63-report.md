Everything in the brief is done.

# O63 report: the audit's hub conventions become one hub setting `audit:`

## Open items of the state file, verbatim

The section "Open items" of `.scratch/migration/orchestrator-state.md` (lines 173-177, read with `sed -n 173,178p`) holds its heading and its standing sentence and no entry:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run

The unchanged tree is a scratch copy of `.agents/worktrees/O63-base` (its `config`, `src`, `tests`, `utils`), with the worktree's `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.npmrc`, `.svelte-kit`, `assets`, `docs` and `README.md` beside them and `node_modules` linked to the worktree's, at `<scratchpad>/basetree` (the base copy has no `node_modules` and is not written to). `<scratchpad>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`.

Commands, each run from the tree it names:

```
cd <scratchpad>/basetree && TREE=<scratchpad>/basetree node <scratchpad>/caserun/caserun.ts    # cases 1-12, 15-17, unchanged tree
cd <worktree> && TREE=<worktree> node <scratchpad>/caserun/caserun.ts                          # the same, changed tree
cd <scratchpad>/basetree && TREE=<scratchpad>/basetree node <scratchpad>/caserun/caserun2.ts   # cases 13, 14, 18, 19, unchanged tree
cd <worktree> && TREE=<worktree> node <scratchpad>/caserun/caserun2.ts                         # the same, changed tree
```

Both programs plant each case's hubs in a temporary folder, open a workspace on them, run `watchPortfolio`'s first build (case 19: its rebuilds) and print the audit findings and the config findings of the hubs' files; `caserun2.ts` also reads the Settings rows and drafts and the editor's schema. Their full text is quoted at the end of this report. On the unchanged tree the hub file's `audit:` gives the config finding "key audit is not one the hub's settings file takes", printed in every case that sets one; the planted feed is named by the case's `audit.website.file`, which the unchanged tree does not read.

Per case, unchanged tree, then changed tree (the outputs as printed are quoted below the list):

- 1. Unchanged: two `conform` findings for `projects/ideas/a`, "missing: the one private doc every project needs" and "code/ has no README.md (the deposit root)". Changed: nothing. Met.
- 2a. Unchanged: one README finding for `nascent-no-readme` (the `standard` flag). Changed: one finding "missing README.md, a file the hub requires" for `nascent-no-readme`; none for the project at `published` or the one holding a README. Met.
- 2b. Unchanged: nothing. Changed: one `NOTES.md` finding for `exploring-x`, none for the `nascent` project. Met.
- 2c. Unchanged: nothing. Changed: one `LICENSE` finding for each of the two projects. Met.
- 2d. Unchanged: the code README finding for `live-code` and for `nascent-code`. Changed: one `code/README.md` finding for `live-code` only. Met.
- 3. Unchanged: code README findings for `projects/active/with-code` and `repo`. Changed: the same two, worded "missing code/README.md, a file the hub requires", the repository's with the scope `repo`, its key. Met.
- 4. Unchanged: README findings for `projects/coauthor/y`, `projects/manuscripts/x` and `repo`. Changed: one, for `projects/manuscripts/x`. Met.
- 5a. Unchanged: nothing. Changed: a `data` finding naming `datasets`, `README.md` and `## Data` for `no-match`, `database` (`## Database`) and `data-notes` (`### Data notes`); none for `## Data`, `## Data + reproduction`, `datasets: []` or no `datasets`. Met.
- 5b. Unchanged: nothing. Changed: findings for `deposited`, `text-key`, `number` (3) and `true`; none for `{ status: "" }`, `false` or a map. Met.
- 5c. Unchanged and changed: nothing. Met.
- 6. Unchanged: a README finding for `projects/manuscripts/x6`. Changed: one `data` finding for `projects/manuscripts/x6`, none for the project under `projects/coauthor/published/2025/`. Met.
- 7a-7e. Unchanged: nothing. Changed: 7a nothing; 7b the wrong-section finding with `['thesis']` and `['journal', 'other-publications']`; 7c (`list: items`, `title: name`) nothing; 7d the same finding as 7b; 7e the wrong-section finding with `['journal']` and `['articles']`. Met.
- 8a. Unchanged and changed: nothing. 8b. Unchanged: nothing. Changed: one finding "could not parse site/pubs.yml: ...", `where` `site/pubs.yml`. Met.
- 9a. Unchanged: nothing. Changed: the second hub `lab`'s project `projects/archive/q` gets its wrong-section finding from its own feed. 9b. Changed: each hub one finding, each for its own project. Met.
- 10a and 10b. Unchanged: nothing. Changed: in both spellings of the folder, findings for `projects/active/x1` and `projects/archive/published-old/x4` naming `published` and the folders; none for the projects under `projects/archive/published/`, `projects/coauthor/published/2025/`, the `submitted` project or the repository's project. Met.
- 11. Unchanged and changed: nothing of any check. Met (see "Judgment calls", 4, for the change the changed tree needed).
- 12. Unchanged: "retired doc: fold it into README.md" for `IDEA.md` and "non-canonical folder: rename to manuscript/" for `paper/`. Changed: nothing. Met.
- 13a. Unchanged: nothing. Changed: `hub_key_unknown` "key publications_file is not one the hub's settings file takes; it is not applied". 13b. Unchanged: nothing. Changed: `shape_unknown` "key stages.exploring.standard is not a key this file takes". 13c. Unchanged: "audit is not an option; it is not applied". Changed: `settings_hub_key` "audit.required_files is a key of the hub's settings file, .oculus/config.yml, which a workspace file does not set; it is not applied". Met.
- 14. Unchanged: 0 findings, `publication_kinds` present, nine stages carrying `standard`. Changed: 0 findings, `publication_kinds` absent, no stage carrying `standard`. Met.
- 15a, 15b, 15c. Unchanged: only the README finding. Changed: on the primary, on a second hub and on a workspace with no primary, seven shape findings naming `.oculus/config.yml` and `audit.required_files.0.file`, `audit.required_sections`, `audit.website.list`, `audit.website.title`, `audit.website.kinds`, `audit.stage_folders.0.folders` and `audit.colour`, and the README finding of the well-formed row. The config channel also gives `hub_key_unknown` for `audit.colour` (see "Judgment calls", 1). Met.
- 16. Unchanged: nothing. Changed: one shape finding for `audit.website.kinds` and no website finding. Met.
- 17. Unchanged: nothing. Changed: one README finding for `projects/active/nostage`. Met.
- 18. Unchanged: three rows in "Audit checks"; the schema reports `audit` as undeclared for both values. Changed: ten rows, the hub's values shown (`own=true`) for the two it sets; `stages` fields with the control `words`; the draft of `audit.required_files` read back after adding `words: [exploring]` is `{"ok":true,...}`; the schema underlines `audit.required_files[0].stages.word` and accepts the hub rewrite's value. Met.
- 19. Unchanged: only the README removal rebuilds; the `code/LICENSE` creation, the feed edit and the repository README removal give no rebuild within 6 s. Changed: all four rebuild, and the findings change as the case says (`code/LICENSE` finding gone, the feed's wrong-section finding shown, the repository README finding shown). Met.

No case of the first run showed one of the brief's rules wrong, so the build did not stop. One case (11) needed a change the brief did not name, on the changed tree; it is under "Judgment calls", 4.

### Cases 1-12, 15-17, unchanged tree, as printed (`final-base-1.txt`)

```
1:
  audit hub conform scope=projects/ideas/a where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=projects/ideas/a where=README.md file=: missing: the one private doc every project needs
2a README not_flags terminal:
  audit hub conform scope=projects/ideas/nascent-no-readme where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2b NOTES words exploring:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2c LICENSE every project:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
2d code/README.md live with code:
  audit hub conform scope=projects/active/live-code where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=projects/ideas/nascent-code where=code/ file=: code/ has no README.md (the deposit root)
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
3:
  audit hub conform scope=projects/active/with-code where=code/ file=: code/ has no README.md (the deposit root)
  audit hub conform scope=repo where=code/ file=: code/ has no README.md (the deposit root)
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
4:
  audit hub conform scope=projects/coauthor/y where=README.md file=: missing: the one private doc every project needs
  audit hub conform scope=projects/manuscripts/x where=README.md file=: missing: the one private doc every project needs
  audit hub conform scope=repo where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5a datasets:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5b code_availability.status:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
5c unparsed manifest:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
6:
  audit hub conform scope=projects/manuscripts/x6 where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7a journal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7b thesis:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7c items/name journal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7d items/name thesis:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
7e kinds articles:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
8a missing feed:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
8b unparsable feed:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
9a second hub own feed:
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
9b two hubs one feed each:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
10a:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
10b trailing slash:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
11 personal:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
12:
  audit hub conform scope=projects/active/x where=IDEA.md file=projects/active/x/IDEA.md: retired doc: fold it into README.md
  audit hub conform scope=projects/active/x where=paper/ file=: non-canonical folder: rename to manuscript/
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15a primary:
  audit hub conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15b second hub:
  audit lab conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
15c no primary:
  audit lab conform scope=projects/active/x where=README.md file=: missing: the one private doc every project needs
  config <case>/lab/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
16:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
17:
  config <case>/hub/.oculus/config.yml key=audit: key audit is not one the hub's settings file takes; it is not applied
exit 0
```

### Cases 1-12, 15-17, changed tree, as printed (`final-new-1.txt`)

```
1: (nothing)
2a README not_flags terminal:
  audit hub conform scope=projects/ideas/nascent-no-readme where=README.md file=: missing README.md, a file the hub requires
2b NOTES words exploring:
  audit hub conform scope=projects/active/exploring-x where=NOTES.md file=: missing NOTES.md, a file the hub requires
2c LICENSE every project:
  audit hub conform scope=projects/active/one where=LICENSE file=: missing LICENSE, a file the hub requires
  audit hub conform scope=projects/archive/two where=LICENSE file=: missing LICENSE, a file the hub requires
2d code/README.md live with code:
  audit hub conform scope=projects/active/live-code where=code/README.md file=: missing code/README.md, a file the hub requires
3:
  audit hub conform scope=projects/active/with-code where=code/README.md file=: missing code/README.md, a file the hub requires
  audit hub conform scope=repo where=code/README.md file=: missing code/README.md, a file the hub requires
4:
  audit hub conform scope=projects/manuscripts/x where=README.md file=: missing README.md, a file the hub requires
5a datasets:
  audit hub data scope=projects/active/data-notes where=README.md file=projects/active/data-notes/README.md: has a value at `datasets` but README.md has no heading `## Data`
  audit hub data scope=projects/active/database where=README.md file=projects/active/database/README.md: has a value at `datasets` but README.md has no heading `## Data`
  audit hub data scope=projects/active/no-match where=README.md file=projects/active/no-match/README.md: has a value at `datasets` but README.md has no heading `## Data`
5b code_availability.status:
  audit hub data scope=projects/active/deposited where=README.md file=projects/active/deposited/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/number where=README.md file=projects/active/number/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/text-key where=README.md file=projects/active/text-key/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
  audit hub data scope=projects/active/true where=README.md file=projects/active/true/README.md: has a value at `code_availability.status` but README.md has no heading `## Data`
5c unparsed manifest: (nothing)
6:
  audit hub data scope=projects/manuscripts/x6 where=README.md file=: has a value at `datasets` but README.md has no heading `## Data`
7a journal: (nothing)
7b thesis:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
7c items/name journal: (nothing)
7d items/name thesis:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
7e kinds articles:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['journal'] but hub stage `published` expects ['articles']: wrong section?
8a missing feed: (nothing)
8b unparsable feed:
  audit hub publink scope=website where=site/pubs.yml file=site/pubs.yml: could not parse site/pubs.yml: Flow sequence in block collection must be sufficiently indented and end with a ] at line 2, column 1:
9a second hub own feed:
  audit lab publink scope=projects/archive/q where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
9b two hubs one feed each:
  audit hub publink scope=projects/archive/p where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
  audit lab publink scope=projects/archive/q where=site/pubs.yml file=site/pubs.yml: on the website under ['thesis'] but hub stage `published` expects ['journal', 'other-publications']: wrong section?
10a:
  audit hub manifest scope=projects/active/x1 where=stage file=projects/active/x1/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
  audit hub manifest scope=projects/archive/published-old/x4 where=stage file=projects/archive/published-old/x4/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
10b trailing slash:
  audit hub manifest scope=projects/active/x1 where=stage file=projects/active/x1/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
  audit hub manifest scope=projects/archive/published-old/x4 where=stage file=projects/archive/published-old/x4/project.yml: at the stage `published` but under none of ['projects/archive/published', 'projects/coauthor']
11 personal: (nothing)
12: (nothing)
15a primary:
  audit hub conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit hub conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/hub/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
15b second hub:
  audit lab conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/lab/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
15c no primary:
  audit lab conform scope=.oculus/config.yml where=audit.colour file=.oculus/config.yml: audit.colour in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_files.0.file file=.oculus/config.yml: audit.required_files.0.file in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.required_sections file=.oculus/config.yml: audit.required_sections in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.stage_folders.0.folders file=.oculus/config.yml: audit.stage_folders.0.folders in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.list file=.oculus/config.yml: audit.website.list in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=.oculus/config.yml where=audit.website.title file=.oculus/config.yml: audit.website.title in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
  audit lab conform scope=projects/active/x where=README.md file=: missing README.md, a file the hub requires
  config <case>/lab/.oculus/config.yml key=audit.colour: key audit.colour is not one the hub's settings file takes; it is not applied
16:
  audit hub conform scope=.oculus/config.yml where=audit.website.kinds file=.oculus/config.yml: audit.website.kinds in .oculus/config.yml is not of the shape the audit setting takes, so that part is off
17:
  audit hub conform scope=projects/active/nostage where=README.md file=: missing README.md, a file the hub requires
exit 0
```

### Cases 13, 14, 18, 19, unchanged tree, as printed (`final-base-2.txt`)

```
13a hub publications_file:
  (nothing)
13b vocab stage row with standard: true (exploring:    { label: exploring, icon: orange, color: "#f59...):
  (nothing)
13c workspace settings: audit:
  <case>/w.yml key=settings.audit: audit is not an option; it is not applied
14: findings=0 publication_kinds=present stages with standard=[nascent, scoping, de-risking, exploring, in-prep, building, submit-ready, submitted, revision]
18a rows of the section Audit checks: 3
  read_limits control=family own=false value={"status.line":220,"next":300,"latest":200,"eli5":360,"results":300} fields=[key:choice value:number]
  audit_ignore control=parked own=false value=[]
  focus.stale_lag_days control=number own=false value=1
18d schema, stages: { word: [x] }: 
  line 1: key audit is not declared by the schema of this file
18e schema, the hub rewrite value: 
  line 1: key audit is not declared by the schema of this file
19 start: website findings: (none)
19 start: README.md missing for [], code/LICENSE missing for []
  README.md of projects/a removed: rebuilt
    README.md missing for []
  code/LICENSE of projects/b created: NO REBUILD within 6 s
    code/LICENSE missing for []
  feed outside every scan folder edited: NO REBUILD within 6 s
    website findings: (none)
  README.md of the repository removed: NO REBUILD within 6 s
    README.md missing for []
exit 0
```

### Cases 13, 14, 18, 19, changed tree, as printed (`final-new-2.txt`)

```
13a hub publications_file:
  <case>/.oculus/config.yml key=publications_file: key publications_file is not one the hub's settings file takes; it is not applied
13b vocab stage row with standard: true (exploring:    { label: exploring, icon: orange, color: "#f59...):
  catalogs/vocab.yml key=stages.exploring.standard: key stages.exploring.standard is not a key this file takes
13c workspace settings: audit:
  <case>/w.yml key=settings.audit.required_files: audit.required_files is a key of the hub's settings file, .oculus/config.yml, which a workspace file does not set; it is not applied
14: findings=0 publication_kinds=absent stages with standard=[]
18a rows of the section Audit checks: 10
  read_limits control=family own=false value={"status.line":220,"next":300,"latest":200,"eli5":360,"results":300} fields=[key:choice value:number]
  audit_ignore control=parked own=false value=[]
  audit.required_files control=family own=true value=[{"file":"README.md","stages":{"not_flags":["terminal"]}}] fields=[file:text stages:words folder:text folders:list]
  audit.required_sections control=family own=false value=[] fields=[file:text heading:text key:text folders:list]
  audit.stage_folders control=family own=true value=[{"stages":{"words":["published"]},"folders":["projects/archive"]}] fields=[stages:words folders:list]
  audit.website.file control=file own=false value=""
  audit.website.list control=text own=false value=""
  audit.website.title control=text own=false value=""
  audit.website.kinds control=family own=false value=[] fields=[kind:list stages:multi forms:multi]
  focus.stale_lag_days control=number own=false value=1
18b draft of audit.required_files: [{"file":"README.md","stages":{"not_flags":["terminal"]}}]
18c the draft read back after adding words [exploring]: {"ok":true,"value":[{"file":"README.md","stages":{"not_flags":["terminal"],"words":["exploring"]}}]}
18d schema, stages: { word: [x] }: 
  line 2: key audit.required_files[0].stages.word is not declared by the schema of this file
18e schema, the hub rewrite value: (nothing)
19 start: website findings: (none)
19 start: README.md missing for [], code/LICENSE missing for [projects/b]
  README.md of projects/a removed: rebuilt
    README.md missing for [projects/a]
  code/LICENSE of projects/b created: rebuilt
    code/LICENSE missing for []
  feed outside every scan folder edited: rebuilt
    website findings: on the website under ['thesis'] but hub stage `published` expects ['journal']: wrong section?
  README.md of the repository removed: rebuilt
    README.md missing for [projects/a, repo]
exit 0
```

## DONE / NOT DONE

| Item | State | Check |
| --- | --- | --- |
| 1. `audit:` with its four parts, the hub list rows, the defaults, the options in "Audit checks" | DONE | cases 1-11, 15-18 above; `tests/routes/docs/audit.test.ts` 26 rows green |
| 1. The control `words` in every file of the control switch | DONE | case 18; `npm run check` 0 errors |
| 1. The reader of `audit:`, one finding per malformed part, per hub | DONE | cases 15, 16 |
| 2. Removals: `standard`, `publication_kinds`, `publications_file`, `RETIRED`, `FOLDERS`, the README, code README and Data checks, `DATA.md` | DONE | cases 12, 13, 14; verify 3 |
| 3. The watcher rebuilds on the audit paths; its rule in `watch/portfolio/` | DONE | case 19; `ls src/lib/server/root/watch` 10 items |
| 4. The reworded finding texts | DONE | `diff -u` of `audit.yml`, quoted under "Host- and user-visible changes" |
| 5. The documents | DONE | `git diff docs/`, under "Host- and user-visible changes" |
| 6. The tests under G125, and `config-folder.test.ts` | DONE | runs quoted under "Tests on the unchanged tree" |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `npm run diagrams` regenerated the diagrams; `test:quick: 208.0 s; every command passed`, exit 0 (ASCII gate, prettier, svelte-kit sync, eslint, svelte-check 0 errors, vitest checks, vitest, vitest slow each `ok`) |
| Verify 2: the character-set check over every changed file | DONE | `LC_ALL=C perl -ne '...' $(cat changed.txt)` printed nothing, exit 0 (`ascii exit 0`) |
| Verify 3: the grep of removed names | DONE | only unrelated constants, listed below |
| Verify 4: `sh utils/unused-exports.sh` against the base | DONE | the diff, below |
| Verify 5: `sh utils/folder-check.sh`; line counts | DONE | folder-check printed nothing, exit 0; largest changed source `git.ts` 878 (unchanged), component `FieldControl.svelte` 497 |
| Verify 6: each new or changed test on the unchanged tree and the changed tree | DONE | below |
| Verify 7: each new or changed comment and document sentence read against the rules | DONE | below |
| `npm run check` | DONE | `COMPLETED 4280 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (check5.txt) |
| `npx eslint` over the changed `.ts` and `.svelte` files | DONE | exit 0, no output |
| `npx prettier --write` over the changed files | DONE | only `hubs-fixture.ts` and `setting.ts` rewritten, then unchanged |

### Verify 3, as printed

Every hit is a name of another meaning: `APP_FOLDERS`, `PLAIN_FOLDERS`, `MOST_FOLDERS`, `LEFT_OUT_FOLDERS`, `READER_FOLDERS`, `FOLDERS_LOADING`, `RETIRED_KINDS`, the local constants `FOLDERS` of `pdfjs-assets.ts`, `lists/folders.ts`, `manifest.test.ts` and `opening-apps.test.ts`, the terminal text `# WORKSPACE FOLDERS (no hub)`, the git visibility `'PUBLIC'` of three tests, an HTML doctype `PUBLIC` in a test body, and the file body `'deposit root\n'` planted by `tests/data/sources/docs.test.ts:46`. None names a removed key, text or check.

```
src/desktop/release.ts:30:import { APP_FOLDERS } from '../lib/server/root/process/build-folders.ts';
src/desktop/release.ts:52:const SHIPPED = [...SHIPPED_SOURCES, APP_FOLDERS.adapter];
src/lib/server/content/latex/pdfjs-assets.ts:18:const FOLDERS = ['cmaps', 'standard_fonts', 'wasm'] as const;
src/lib/server/content/latex/pdfjs-assets.ts:21:const assetShape = z.tuple([z.enum(FOLDERS), z.string().min(1)]);
src/lib/server/edit/writes/config/lists/folders.ts:40:const FOLDERS = 'folders';
src/lib/server/edit/writes/config/lists/folders.ts:111:        folders: itemsOf(record[FOLDERS]),
src/lib/server/edit/writes/config/lists/folders.ts:137:    const list = root.get(FOLDERS, true);
src/lib/server/edit/writes/config/lists/folders.ts:157:    const list = root.get(FOLDERS, true);
src/lib/server/edit/writes/config/lists/folders.ts:214:    const skip = [FOLDERS, PRIMARY];
src/lib/server/edit/writes/config/lists/folders.ts:240:    const edited = withPrimary(setItems(source, null, FOLDERS, items), wanted.primary);
src/lib/server/edit/writes/config/lists/folders.ts:249:        changed: [FOLDERS],
src/lib/server/edit/writes/config/lists/folders.ts:251:        records: [{ file, key: FOLDERS, field: FOLDERS, before, after: wanted, undo: 'field' }],
src/lib/server/sessions/cache.ts:37:const READER_FOLDERS = ['src/lib/server/sessions', 'src/lib/server/transcripts'];
src/lib/server/sessions/cache.ts:44: * module of READER_FOLDERS they import, directly or not, each hashed whole with its path, in the
src/lib/server/sessions/cache.ts:48:    const folders = READER_FOLDERS.map((folder) => join(root, folder) + sep);
src/lib/server/machine/lines.ts:43:const LEFT_OUT_FOLDERS = ['.scratch/', 'docs/diagrams/'];
src/lib/server/machine/lines.ts:63:    return !LEFT_OUT_FOLDERS.some((folder) => path.startsWith(folder));
src/lib/server/machine/pty/start/context.ts:96:            parts.push('# WORKSPACE FOLDERS (no hub)\n');
src/lib/server/root/watch/git.ts:103:import { APP_FOLDERS, PLAIN_FOLDERS } from '../process/build-folders.ts';
src/lib/server/root/watch/git.ts:119:const MOST_FOLDERS = 64;
src/lib/server/root/watch/git.ts:124:    ...Object.values(PLAIN_FOLDERS),
src/lib/server/root/watch/git.ts:125:    ...Object.values(APP_FOLDERS),
src/lib/server/root/watch/git.ts:512:                    const named = heard.whole || heard.folders.size > MOST_FOLDERS;
src/lib/server/root/watch/git.ts:558:        if (span.folders.size > MOST_FOLDERS) span.whole = true;
src/lib/server/root/process/build-folders.ts:15:export const APP_FOLDERS = { kit: '.svelte-kit-app', adapter: 'build-app' } as const;
src/lib/server/root/process/build-folders.ts:18:export const PLAIN_FOLDERS = { kit: '.svelte-kit', adapter: 'build' } as const;
src/lib/server/root/process/build-folders.ts:22:    return join(checkout, APP_FOLDERS.adapter, 'handler.js');
src/lib/state/sessions/source/write-files.ts:243:const FOLDERS_LOADING = 'folders_loading';
src/lib/state/sessions/source/write-files.ts:259:        return { ok: false, changed: [], refused: [], error, code: FOLDERS_LOADING };
tests/shell/keys/clone-rows.test.ts:17:        visibility: 'PUBLIC',
tests/server/desktop/start.test.ts:21:import { APP_FOLDERS, APP_MODE } from '../../../src/lib/server/root/process/build-folders.ts';
tests/server/desktop/start.test.ts:31:const HANDLER = join(CHECKOUT, APP_FOLDERS.adapter, 'handler.js');
tests/server/machine/apps/manifest/manifest.test.ts:35:const FOLDERS: Folder[] = [
tests/server/machine/apps/manifest/manifest.test.ts:354:    ...FOLDERS.map(oneFolder),
tests/server/machine/runs/recover/answers/geo/listing.body:1:<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
tests/state/sources/clone.test.ts:23:    visibility: 'PUBLIC',
tests/fixtures/kinds.ts:20:const RETIRED_KINDS = ['deck'];
tests/fixtures/kinds.ts:58: * endpoint takes as a `store` body of an app and no `kind`, the `deck` kind of RETIRED_KINDS, and
tests/fixtures/kinds.ts:68:        ...new Set([...found, ...RETIRED_KINDS, FILES_KIND, APP_STORE, ...callerKinds()])
tests/data/sources/docs.test.ts:46:        plantFile(root, 'code/README.md', 'deposit root\n');
tests/views/shared/explorer/opening-apps.test.ts:23:const FOLDERS = ['/hub/.oculus/apps'];
tests/views/shared/explorer/opening-apps.test.ts:27:    inAppsFolder(FOLDERS, root === 'hub' ? '/hub' : '', path);
tests/routes/sessions/terminal-actions.test.ts:778:                '# WORKSPACE FOLDERS (no hub)',
tests/routes/git/clone.test.ts:288:                visibility: 'PUBLIC',
```

### Verify 4, as printed

```
$ sh utils/unused-exports.sh > unused-now.txt; diff .agents/worktrees/O63-base/unused-exports.txt unused-now.txt
1c1
< Unused exports (230)
---
> Unused exports (231)
32a33
> src/lib/server/content/audit/setting.ts: noSetting, auditSetting, hubAuditValue
103c104
< src/lib/server/root/watch/portfolio.ts: DEBOUNCE, MAX_WAIT, audited, relevant, namedByConfig, watchedDirectories, roleDirectories, watchFile
---
> src/lib/server/root/watch/portfolio/portfolio.ts: DEBOUNCE, MAX_WAIT, watchFile
232c233
< Unused exported types (111)
---
> Unused exported types (112)
250a252
> src/lib/server/content/audit/setting.ts: RequiredFile, RequiredSection, StageFolders
```

What was done with each added line: `auditSetting`, `hubAuditValue`, `RequiredFile`, `RequiredSection` and `StageFolders` are no longer exported (nothing outside `setting.ts` reads them; `grep -rlw` over `src tests utils` finds only that file). `noSetting` stays exported: `tests/state/boards/board/board-rules.test.ts` builds its `AuditInput` with it, as the base exports `DEBOUNCE` and the others for tests. The line for `portfolio.ts` loses `audited`, `relevant`, `namedByConfig`, `watchedDirectories` and `roleDirectories`, now imported across the files of `watch/portfolio/`.

### Verify 6: tests on the unchanged tree

Run in the scratch copy of the unchanged tree with the new test files copied in: `npx vitest run tests/routes/docs/audit.test.ts tests/checks/config/config-folder.test.ts tests/state/boards/board/board-rules.test.ts` printed `Test Files 3 failed (3)`, `Tests 29 failed | 25 passed | 2 skipped (56)`. The failing lines:

- Every row of `audit.test.ts` (26) fails at its first scan, at `hubAuditSetting(hub)`: `TypeError: hubAuditSetting is not a function` (lines 130, 144, 159, 177, 195, 210, 218, 226, 253, 273, 297, 322, 330, 344, 354, 368, 375, 391, 407, 429, 441, 451, 496, 505, 520, 555 of the test): the unchanged tree has no reader of `audit:`, and its scan holds no hub to the setting.
- `config-folder.test.ts` 'holds exactly the expected top-level keys, and no more' fails at `:360`: `expected [ Array(100) ] to deeply equal [ Array(99) ]` (the unchanged tree has `publication_kinds` and `publications_file` and no `audit`).
- `config-folder.test.ts` 'describes every flag of stages, ... and every key of a roles and categories row in the schema of vocab.yml' fails at `:686`: `expected [ ... ] to have a length of 33 but got 34` (the flag `standard`).
- `config-folder.test.ts` 'reads each file on its own and finds its own keys there and nowhere else' fails at `:792`: `expected [ 'apps', 'audit_ignore', ...(24) ] to deeply equal [ 'apps', 'audit', ...(25) ]`.
- `board-rules.test.ts` fails at its import, `:45`: `Cannot find module '../../../../src/lib/server/content/audit/setting.ts'`. Its change is the field `setting: noSetting()` the changed `AuditInput` requires; it holds no new assertion.

On the changed tree the same three files pass, inside the related run `npx vitest run tests/state/system/settings tests/data/sources/config tests/routes/docs/audit.test.ts tests/server/edit tests/routes/edit tests/state/boards/board/board-rules.test.ts tests/checks/source/keys.test.ts`: `Test Files 37 passed (37)`, `Tests 606 passed (606)`; `config-folder.test.ts` passed in the earlier related run of 53 files. `hub-portfolio.test.ts`, `hubs-fixture.ts` and `references.test.ts` change only the import path of the moved `portfolio.ts` and their comments; they hold no new assertion and cannot import the moved file on the unchanged tree.

### Verify 7: comments and document sentences

Every comment the step wrote or changed was read against `spec.md`'s rules on comments, and the comment paragraphs over 100 columns were rewrapped (the awk scan over the changed files now finds only `git.ts:644`, an eslint directive the step did not touch). The grep of the added lines for history words (`no longer`, `used to`, `formerly`, `previously`, `today`, `O6x`, `moved`, `renamed`, `legacy`, `old`, `retired`, `earlier`) finds no comment that tells history: its hits are the test's folder name `published-old`, the atomic rename in `server/core/json.ts` described in a moved comment, the moved comment on the open workspace file (`moved to the file a rebuild finds open`, present in the base at `portfolio.ts:473`) and "the installed package" of an icon. No departure from the rules was found.

## Runs of `npm run test:quick` and whole-suite commands

`npm run test:quick` ran once, after the last change, after `npm run diagrams`. No whole-suite command ran. Targeted runs while working: `npx vitest run` over the 31 related test files and folders (53 files, once, which found the layer boundary below), `tests/checks/tree/boundaries.test.ts` alone (once), the related set of 37 files (once).

The first related run found one boundary failure: `views/system/workbench/editors/FieldControl.svelte imports data/shapes/boards/words` (`tests/checks/tree/boundaries.test.ts:669`). The view now takes `BLOCK_LISTS` from `state/system/config/editors/fields.ts`, which re-exports it as `state/life/present.ts` re-exports `MAX_UPLOAD_MB`; the file then passed (11 tests).

## Files with line counts

From `diff -rq` of the base copy against the worktree (excluding `node_modules`, `.git`, `.svelte-kit`, `.scratch`, `.agents`, `assets`) and `git diff --stat HEAD -- docs` for `docs/`, which the base copy does not hold. Before | after, by `wc -l`.

```
config/catalogs/vocab.yml | 264 | 250
config/defaults/behavior.yml | 305 | 312
config/defaults/sources.yml | 114 | 113
config/options/appearance.yml | 212 | 212
config/options/behavior.yml | 756 | 838
config/options/sources.yml | 125 | 118
config/text/findings.yml | 394 | 396
config/text/server.yml | 536 | 538
config/text/views/system/audit.yml | 75 | 74
config/text/views/system/workbench.yml | 252 | 258
docs/HELP.md | 558 | 559
docs/data-map.md | 228 | 234
docs/templates.md | 1360 | 1398
src/lib/data/helpers/hub-names.ts | 474 | 481
src/lib/data/places/code-rules.ts | 29 | 29
src/lib/data/shapes/boards/words.ts | 98 | 99
src/lib/data/shapes/catalog-files/options.ts | 127 | 129
src/lib/data/shapes/catalog-files/vocab.ts | 422 | 395
src/lib/data/shapes/catalog-words.ts | 96 | 107
src/lib/data/sources/config/catalog/options.ts | 631 | 662
src/lib/data/sources/config/catalog/schemas/options.ts | 329 | 358
src/lib/data/sources/config/catalog/value-rule.ts | 263 | 298
src/lib/data/sources/config/catalog/value-words.ts | 119 | 123
src/lib/data/sources/config/merge/workspace-layer.ts | 282 | 287
src/lib/data/sources/config/sections/findings.ts | 47 | 48
src/lib/data/sources/config/settings/reader.ts | 181 | 184
src/lib/server/content/audit/projects.ts | 542 | 600
src/lib/server/content/audit/publications.ts | 275 | 299
src/lib/server/content/audit/rules.ts | 376 | 349
src/lib/server/content/audit/scan.ts | 66 | 82
src/lib/server/edit/writes/config/config-fit.ts | 470 | 486
src/lib/server/edit/writes/config/config-value.ts | 307 | 308
src/lib/server/root/context.ts | 820 | 820
src/lib/server/root/process/context/dependencies.ts | 122 | 122
src/lib/server/root/process/context/rebuild.ts | 113 | 113
src/lib/server/root/watch/apps.ts | 496 | 496
src/lib/server/root/watch/bookmarks.ts | 117 | 117
src/lib/server/root/watch/build.ts | 208 | 208
src/lib/server/root/watch/git.ts | 878 | 878
src/lib/server/root/watch/sessions.ts | 322 | 322
src/lib/state/system/config/editors/draft.ts | 595 | 599
src/lib/state/system/config/editors/fields.ts | 691 | 752
src/lib/state/system/config/messages.ts | 64 | 65
src/lib/state/system/config/rows.ts | 450 | 455
src/lib/views/system/workbench/editors/Editor.svelte | 242 | 243
src/lib/views/system/workbench/editors/FieldControl.svelte | 449 | 497
src/routes/+page.server.ts | 93 | 93
tests/checks/config/config-folder.test.ts | 814 | 805
tests/data/hubs/hub-portfolio.test.ts | 538 | 538
tests/data/hubs/hubs-fixture.ts | 118 | 121
tests/data/snapshot/references.test.ts | 614 | 614
tests/routes/docs/audit.test.ts | 111 | 558
tests/state/boards/board/board-rules.test.ts | 604 | 606
src/lib/server/content/audit/setting.ts | new | 230
src/lib/server/root/watch/portfolio/audited.ts | new | 104
src/lib/server/root/watch/portfolio/portfolio.ts | 880 (src/lib/server/root/watch/portfolio.ts) | 784
src/lib/server/root/watch/portfolio/reads.ts | new | 114
src/lib/server/root/watch/portfolio.ts | 880 | moved
docs/diagrams/channels.dot, channels.svg, layer-data.dot, layer-data.svg, layer-server.dot, layer-server.svg, layer-state.dot, layer-state.svg, layers.dot, layers.svg, writes.dot, writes.svg | regenerated by npm run diagrams
```

Files outside the brief's path list, each with what reached it:

- `src/lib/server/root/watch/apps.ts`, `bookmarks.ts`, `git.ts`, `sessions.ts`: each imports `type Watcher` from `./portfolio.ts`; after the move `npm run check` reported the missing module in each. The brief's grep `grep -rln "watch/portfolio"` does not find a relative `./portfolio.ts`. One import line each.
- `tests/state/boards/board/board-rules.test.ts`: `npm run check` reported `Property 'setting' is missing in type ... but required in type 'AuditInput'` at `:388` (check2.txt). Two lines.
- `src/lib/data/shapes/boards/words.ts`: exports `BLOCK_LISTS` and `BlockList`, which the value rule, the field and the view of the control read; its head comment names the control.
- `src/lib/data/sources/config/catalog/options.ts`: `flagSources` and `flaggedItems` (the lists whose flags a words field draws from), and `readSpec` reporting `no_values` for a words control with no `from`.
- `src/lib/data/sources/config/settings/reader.ts`, `src/lib/data/sources/config/merge/workspace-layer.ts`: pass `flagged` to the value rule, so a flag outside the list is a finding in a settings value as it is in a write.
- `src/lib/server/edit/writes/config/config-value.ts`: its head comment names the word block (the control switch).
- `src/lib/state/system/config/messages.ts`, `config/text/views/system/workbench.yml`: the control's words in the Settings view (`block_words`, `block_not_words`, `block_flags`, `block_not_flags`, `block_list`, `settings_mismatch_block`), and `desc_vocab`, which named "the publication kinds" (grep of the removed name), with `desc_behavior` and `desc_config` naming `audit:`.
- `config/options/appearance.yml`: holds the options catalog's head comment, which describes the controls; the brief asks that comment to describe the new control.
- Paths of the list left unchanged: `src/lib/data/sources/config/catalog/schemas/engine.ts` and `src/lib/state/system/config/groups.ts` match the `audit.*` rows to their option entries as they are (case 18 shows the rows and the schema).

## Judgment calls

1. The reader takes `audit:` from the hub's own `.oculus/config.yml` read raw, because the merge of the hub file applies only the keys of the hub list, so a key of `audit:` the setting does not take (case 15's `colour`) never reaches the merged configuration. The config channel's own check of the hub file still reports such a key as `hub_key_unknown` (`audit.colour`) for the primary, so case 15 shows that key twice: once from the audit, once from the config channel.
2. A `website` with any part not of its shape is off whole (no feed is read) while every bad part is named; a list key, title key or kinds missing leaves nothing to read the feed with.
3. `sec_conform` is now "Hub conventions": the section holds the required files and the shape findings of the setting.
4. A project of a skipped tier claims the feed's paper it matches (at the loose threshold) and gets no finding. Without it, case 11's personal project, whose title is on the feed, made the feed's paper an "untracked" finding, which case 11 forbids. The base skipped such a project before matching, so its paper was untracked there too; on the real hub this changes no finding (see "Hub rewrite").
5. No refusal was added beside `type_records` in `config/text/server.yml`: that text is the refusal of `src/lib/server/edit/writes/entries.ts:144`, which switches over the field types of a manifest schema, and the `words` control is a config option control, which a manifest field does not take. The refusals of a config write sit beside `wants_records`: `wants_block` and `not_flag`.
6. A list that carries no flags (any `from` list other than the stages and the chips) gets `maxItems: 0` for `flags` and `not_flags` in the schema, and its flags are refused by the value rule, since no flag of it can hold.
7. The website feed and the files of a workspace repository's project are watched one file at a time through their folder (`auditFiles`, `openAuditFile`), as the hub's settings file is; the watcher does not add a recursive watch over the site repository.
8. A required path's rebuild matches the path by its last segments for any project of any hub; the rows' `folders` are not read by the watcher, so an event on such a path of a project a row leaves alone costs one rebuild that finds nothing new.
9. Case 15's shape finding is filed under the scope `.oculus/config.yml` with the dotted key as its `where`, so a mute of it holds across rebuilds.
10. A required section names `file` relative to the project; a missing file and a missing heading give the same text, naming the key, the file and the heading.

## Host- and user-visible changes, before and after

- The hub key `publications_file`: before, the website feed's path; after, `hub_key_unknown` "key publications_file is not one the hub's settings file takes; it is not applied" (case 13a). The hub's `.oculus/config.yml:30` sets it today; the orchestrator removes it at landing.
- The vocab key `publication_kinds` and the stage flag `standard`: gone from `config/catalogs/vocab.yml`; `standard: true` on a stage row is `shape_unknown` (case 13b).
- A hub with no `audit:`: before, the README, code README, Data section, retired documents and folder-name checks ran on every hub; after, none of them (cases 1, 12). The retired-document and folder-name findings are gone with no setting.
- A workspace file's `settings:` setting `audit:`: before "audit is not an option"; after `settings_hub_key` (case 13c).
- The website check: before, the primary hub only, from `publications_file`, the sections' `papers` and each `title`; after, every hub that sets `audit.website`, each against its own feed, with the list and title keys the setting names (cases 7, 9). A finding's `where` names the feed's file (`site/pubs.yml`, on the real hub `side-projects/theaxec.github.io/_data/publications.yml`) in place of `publications.yml`.
- Findings that come: a missing required file, a missing required section, a stage folder, a part of `audit:` not of its shape (cases 2-6, 10, 15, 16).
- The Audit view: the section "Tier conformance" is "Hub conventions"; the empty text is "Nothing open: no markers, no data gaps or missing sections, no missing required files, no status chip or project folder out of place, no readability warnings and nothing to reconcile with the website."
- The Settings view, section "Audit checks": before three rows (`read_limits`, `audit_ignore`, `focus.stale_lag_days`); after ten, adding `audit.required_files`, `audit.required_sections`, `audit.stage_folders`, `audit.website.file`, `audit.website.list`, `audit.website.title` and `audit.website.kinds`, each written to the hub's `.oculus/config.yml` (case 18).
- The new control `words`: a word block drawn as four multi-picks, "one of these words", "none of these words", "a word with one of these flags" and "no word with one of these flags", each offering the words or flags of the list `from` names, a held word outside it marked "(not in the list)". A value that is no word block shows "The value in force is {0}, which is not a map of the lists words, not_words, flags and not_flags." A write refuses with "This field takes a map of the lists words, not_words, flags and not_flags, each a list of words" or "A flag is not one of the flags of the list {0}".
- The audit's rebuilds: before, only the paths of `AUDIT_PATHS` (the README and `code/README.md`); after, also every file and folder a hub's `required_files` names, every file of `required_sections`, the website feed wherever it lies and the required files of a workspace repository's project (case 19).
- The reworded texts, `config/text/views/system/audit.yml`, before and after (`diff -u` of the base and the worktree):

```
--- O63-base/config/text/views/system/audit.yml<tab>2026-10-24 19:56:22
+++ migration-O63/config/text/views/system/audit.yml<tab>2026-10-24 20:10:18
@@ -10,12 +10,12 @@
         title: Audit
         toolbar: Audit controls
         search: 'Search findings ...'
-        empty: 'Nothing open: no markers, no data gaps, no conformance gaps, no status chip out of place, no readability warnings and nothing to reconcile with the website.'
+        empty: 'Nothing open: no markers, no data gaps or missing sections, no missing required files, no status chip or project folder out of place, no readability warnings and nothing to reconcile with the website.'
         empty_glyph: circle_empty
         none_match: No finding matches the search.
         sec_todo: Open items (TODO / VERIFY)
         sec_data: Missing data
-        sec_conform: Tier conformance
+        sec_conform: Hub conventions
         sec_manifest: Manifest guardrails
         sec_readability: Readability
         sec_publink: Website publications sync
@@ -43,19 +43,18 @@
         msg_missing_field: 'missing `{0}`'
         msg_provisional: '{0} provisional results: the numbers are not final'
         msg_provisional_one: 'one provisional result: the number is not final'
-        msg_no_data_section: 'has `datasets` but no Data section (README.md `## Data` or DATA.md)'
+        msg_required_section: 'has a value at `{0}` but {1} has no heading `{2}`'
         msg_docs_ahead: 'docs changed {0}, {1}d after the manifest; refresh project.yml'
-        msg_deposit_before_reproduction: 'deposit dated {0} predates the from-scratch reproduction {1}: the reproduced code may not be what was pushed; re-push code/ and bump `code_availability.date`'
+        msg_deposit_before_reproduction: 'deposit dated {0} predates the from-scratch reproduction {1}: the reproduced code may not be what was deposited; deposit it again and bump `code_availability.date`'
         msg_collection_missing: collection file missing
         msg_entry_no_title: missing title
         msg_entry_no_status: missing status
         msg_entry_no_date: 'status "{0}" but no date tracked'
         msg_entry_related: 'related id `{0}` is not a known project'
         msg_entry_link: 'link path missing: {0}'
-        msg_no_readme: 'missing: the one private doc every project needs'
-        msg_retired_doc: 'retired doc: fold it into README.md'
-        msg_bad_folder: 'non-canonical folder: rename to {0}'
-        msg_code_no_readme: code/ has no README.md (the deposit root)
+        msg_required_file: 'missing {0}, a file the hub requires'
+        msg_stage_folder: 'at the stage `{0}` but under none of {1}'
+        msg_setting_shape: '{1} in {0} is not of the shape the audit setting takes, so that part is off'
         msg_no_lead: 'names no lead: add `lead:` with the person who leads the work'
         msg_no_board: 'on no board: tier {0}, role {1}, stage {2}'
         msg_terminal_lane_chip: 'the stage `{0}` is done but the chip `{1}` puts it on a Focus lane: remove the chip'
@@ -65,11 +64,11 @@
         msg_missing: missing
         msg_too_long: '{0} chars (>{1}): trim to a glance; detail belongs in the prose docs'
         msg_result_too_long: '{0} chars (>{1}): headline only'
-        msg_site_unreadable: 'could not parse publications.yml: {0}'
+        msg_site_unreadable: 'could not parse {0}: {1}'
         msg_site_wrong_section: 'on the website under {0} but hub stage `{1}` expects {2}: wrong section?'
         msg_site_title_differs: 'likely on the website as "{0}" (section {1}) but the titles differ: reconcile them'
         msg_site_missing: 'public (`{0}`) but no website entry: add it (likely section {1})'
-        msg_site_negative: 'hub-private negative result (`{0}`) but appears on the PUBLIC website under {1}: remove it (null/negative results never leave the hub)'
-        msg_site_deadend: 'hub marks this `{0}` but it appears on the PUBLIC website under {1}; set the stage to `published` if it is a real publication, else remove it from the site (or mute if intentional)'
-        msg_site_untracked: '{0} website papers not matched to any hub project, expected for pre-hub work; verify none are stale or duplicated: {1}'
-        msg_site_untracked_one: 'one website paper not matched to any hub project, expected for pre-hub work; verify it is not stale or duplicated: {1}'
+        msg_site_negative: 'the stage {0} marks a negative result, but the website shows it under {1}'
+        msg_site_deadend: 'the stage {0} marks a dead end, but the website shows it under {1}: give it the stage of a publication if it is one, else take it off the website (or mute if intentional)'
+        msg_site_untracked: '{0} website papers not matched to any project of the hub; verify none are stale or duplicated: {1}'
+        msg_site_untracked_one: 'one website paper not matched to any project of the hub; verify it is not stale or duplicated: {1}'
```

- The documents: `docs/HELP.md` (the Audit row of the view table, the Audit bullet, the `behavior.yml` line, the `vocab.yml` list without `publication_kinds`, a bullet on `audit:`), `docs/data-map.md` (the Audit row, 33 hub keys with the seven `audit.*` rows and without `publications_file`, the sentence on a hub other than the primary), `docs/templates.md` (`publications_file` gone; a commented `audit:` block with its four keys and an example).

## Where the brief was wrong or impossible

- The importers of `portfolio.ts`: `apps.ts`, `bookmarks.ts`, `git.ts` and `sessions.ts` under `watch/` import it as `./portfolio.ts`, which the brief's grep for `watch/portfolio` does not find; `npm run check` found them.
- `AuditInput` gains `setting`, so `tests/state/boards/board/board-rules.test.ts`, which builds an `AuditInput`, needed the field (type check).
- Case 11 together with "its matching ... as today" of item 1's `website` bullet: today's matching skips a personal project before it matches, so its paper on the feed is untracked, which case 11 forbids. Judgment call 4 settles it.
- `config/text/server.yml` "beside `type_records`": that text belongs to the manifest entry writes, which the control does not reach (judgment call 5).
- Nothing else in the brief was wrong or impossible.

## Rows of today's `audit.test.ts` deleted

- 'raise a marker, a readability and a publication row for a project of the tier research' (describe 'the research rules of the audit')
- 'raise none of the three for a project of the tier personal' (describe 'the research rules of the audit')
- 'ask a project read from a workspace folder the order of its deposit and its reproduction, and the README of its code folder' (describe 'the Deposit rules of the audit')

From `config-folder.test.ts`: the shape row `['catalogs/vocab.yml', 'publication_kinds: { kind: thesis }\n', 'publication_kinds', 'publication_kinds must be a list']`, the keys `publications_file` and `publication_kinds` of its key lists, and the `publication_kinds` row of the flag table; its title drops "and publication_kinds", and the count goes from 37 to 33.

## Hub rewrite

The `audit:` value for `~/workspace/research-hub/.oculus/config.yml`, built from the hub's files read only (its `scan:` folders, the feed's path at `publications_file`, `config/catalogs/vocab.yml`'s `publication_kinds` rows on the base); `publications_file:` (line 30, with its comment above) is removed at the same time:

```yaml
audit:
  required_files:
    - { file: README.md, stages: { not_flags: [terminal] } }
    - { file: code/README.md, folder: code }
  required_sections:
    - { file: README.md, heading: "## Data", key: datasets, folders: [projects/ideas, side-projects, projects/active, projects/manuscripts, projects/software, projects/archive] }
  stage_folders:
    - { stages: { words: [published] }, folders: [projects/archive/published, projects/coauthor, projects/archive/phd] }
  website:
    file: side-projects/theaxec.github.io/_data/publications.yml
    list: papers
    title: title
    kinds:
      - { kind: [thesis], forms: [thesis] }
      - { kind: [papers-in-review], stages: [submitted, revision] }
      - { kind: [papers-in-preparation], stages: [in-prep, submit-ready] }
      - { kind: [abandoned-papers], stages: [stopped] }
      - { kind: [abstracts], forms: [abstract] }
      - { kind: [posters], forms: [poster] }
      - { kind: [conference], forms: [conference] }
      - { kind: [journal, other-publications], forms: [journal] }
      - { kind: [abstracts, conference, journal, other-publications, posters, thesis] }
```

The run: the hub's `*.yml` and `*.md` files and its folders copied with rsync (without `.git` and `.oculus/local.yml`) to `<scratchpad>/hubcopy/research-hub`, the hub alone in a workspace and its primary, `hubrun.ts` run with the unchanged tree over the copy as it is, and with the changed tree over the copy whose `config.yml` has `publications_file` removed and the value above appended:

```
cd <scratchpad>/basetree && TREE=<scratchpad>/basetree HUB=<hub copy, original config> node <scratchpad>/caserun/hubrun.ts > hub-old.txt
cd <worktree> && TREE=<worktree> HUB=<hub copy, rewritten config> node <scratchpad>/caserun/hubrun.ts > hub-new.txt
diff hub-old.txt hub-new.txt
```

```
1c1
< audit conform | projects/coauthor/active/flkit | README.md | missing: the one private doc every project needs
---
> audit conform | projects/coauthor/active/flkit | README.md | missing README.md, a file the hub requires
15,17c15,17
< audit publink | projects/manuscripts/bt-operator-theory | publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
< audit publink | projects/manuscripts/btfno | publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
< audit publink | projects/manuscripts/covert-applied | publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
---
> audit publink | projects/manuscripts/bt-operator-theory | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
> audit publink | projects/manuscripts/btfno | side-projects/theaxec.github.io/_data/publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
> audit publink | projects/manuscripts/covert-applied | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
```

Each difference named:

- `projects/coauthor/active/flkit`: the same missing README, now from the `required_files` row, worded "missing README.md, a file the hub requires".
- The three website findings of `bt-operator-theory`, `btfno` and `covert-applied`: the same findings, their `where` the feed's path in place of `publications.yml`.

No finding comes or goes. The 13 `data` findings, the three website findings and the config finding of `wallpaper.image` (the copy holds no pictures) are in both runs. The new findings' signatures differ from today's for the reworded texts and the changed `where` (decision 9 of the brief); the hub's workspace mutes none of them.

The changed tree's findings on the hub, as printed (`hub-new.txt`):

```
audit conform | projects/coauthor/active/flkit | README.md | missing README.md, a file the hub requires
audit data | projects/coauthor/active/clinical-hccnet | project.yml | missing `datasets`
audit data | projects/coauthor/active/clinical-hccnet | project.yml | missing `results`
audit data | projects/coauthor/active/clinical-hccnet | venue | at the stage in preparation, which carries a venue, but no venue
audit data | projects/coauthor/active/flkit | project.yml | missing `results`
audit data | projects/ideas/adapter-format-theory | project.yml | missing `results`
audit data | projects/ideas/conformal-tensor-factors | project.yml | missing `results`
audit data | projects/ideas/ecg-af-fair | project.yml | missing `results`
audit data | projects/ideas/fed-duplication-limits | project.yml | missing `results`
audit data | projects/ideas/pathology-tensor-mil | project.yml | missing `results`
audit data | projects/ideas/serial-ecg-af | project.yml | missing `datasets`
audit data | projects/ideas/serial-ecg-af | project.yml | missing `results`
audit data | projects/ideas/strokeop | project.yml | missing `datasets`
audit data | projects/ideas/strokeop | project.yml | missing `results`
audit publink | projects/manuscripts/bt-operator-theory | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
audit publink | projects/manuscripts/btfno | side-projects/theaxec.github.io/_data/publications.yml | public (`revision`) but no website entry: add it (likely section papers-in-review)
audit publink | projects/manuscripts/covert-applied | side-projects/theaxec.github.io/_data/publications.yml | on the website under ['papers-in-preparation'] but hub stage `revision` expects ['papers-in-review']: wrong section?
config | .oculus/config.yml | wallpaper.image | wallpaper.image is research-hub/ss_7f426c69d4f27dff1e19aea7560c89bc27421104.jpg, and the wallpaper folder of that hub holds no such file; no wallpaper is shown
```

## The case-run programs

### `<scratchpad>/caserun/caserun.ts`

```ts
// Case-run program of step O63: plants each case's hubs in a temporary folder, runs the portfolio
// watcher's first build over them and prints the audit findings and config findings the case is
// about. Run: TREE=<tree> node caserun.ts [case numbers]
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const W = process.env.TREE!;
const { watchPortfolio } = await import(
    existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
        ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
        : `${W}/src/lib/server/root/watch/portfolio.ts`
);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);

const made: string[] = [];
function tmp(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}
function plant(root: string, files: Record<string, string>, folders: string[] = []): void {
    for (const one of folders) mkdirSync(join(root, one), { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), body);
    }
}
function manifest(fields: Record<string, unknown>): string {
    const base: Record<string, unknown> = { tier: 'research', lead: ['someone'], ...fields };
    return (
        Object.entries(base)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n') + '\n'
    );
}

type HubSpec = { name: string; config: string; files?: Record<string, string>; folders?: string[] };
type RepoSpec = { name: string; files: Record<string, string>; folders?: string[] };
type Spec = { hubs: HubSpec[]; repos?: RepoSpec[]; primary?: string | null };

const { config: engine } = loadConfig(engineDir());
const catalog = textCatalog(engine);
const UNRELATED = [
    'audit.msg_no_lead',
    'audit.msg_no_board',
    'audit.msg_missing_field',
    'audit.msg_no_venue',
    'audit.msg_docs_ahead',
    'audit.msg_collection_missing',
    'audit.msg_entry_no_status',
    'audit.msg_entry_no_title',
    'audit.msg_entry_no_date',
    'audit.msg_entry_related',
    'audit.msg_entry_link'
].map((key) => new RegExp(`^${String(catalog[key] ?? '').replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '.*')}$`));

function workspaceOf(state: string) {
    const noop = () => {};
    return { stateFolder: state, open: () => openWorkspace(state), subscribe: () => noop, changed: noop, close: noop };
}

function setUp(spec: Spec) {
    const base = tmp('o63-case-');
    const folders: { name: string; path: string }[] = [];
    for (const hub of spec.hubs) {
        const dir = join(base, hub.name);
        plant(dir, { '.oculus/config.yml': hub.config, ...(hub.files ?? {}) }, hub.folders ?? []);
        folders.push({ name: hub.name, path: dir });
    }
    for (const repo of spec.repos ?? []) {
        const dir = join(base, repo.name);
        plant(dir, repo.files, repo.folders ?? []);
        folders.push({ name: repo.name, path: dir });
    }
    const state = tmp('o63-state-');
    const primary = spec.primary === undefined ? spec.hubs[0]?.name : spec.primary;
    writeState(state, {
        open: null,
        recent: [],
        unsaved: { folders, ...(primary === null || primary === undefined ? {} : { primary }) }
    });
    return { base, state };
}

function watch(state: string, built?: () => void) {
    const channels = new Hub();
    const watcher = watchPortfolio(
        channels,
        {
            engine: engineDir(),
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => openWorkspace(state),
            settings: (dir: string) => loadConfig(engineDir(), { hub: dir }),
            problems: () => []
        },
        { debounce: 20, ...(built === undefined ? {} : { built }) }
    );
    return { channels, watcher };
}

function show(channels: InstanceType<typeof Hub>, base: string) {
    const audit = channels.latest('audit')?.payload as { findings: any[] };
    const config = channels.latest('config')?.payload as { findings: any[] };
    const strip = (text: string) => text.split(base).join('<case>');
    const rows = (audit?.findings ?? [])
        .filter((f) => f.kind !== 'todo' && f.kind !== 'readability')
        .filter((f) => f.message !== catalog['audit.msg_missing'])
        .filter((f) => !UNRELATED.some((pattern) => pattern.test(f.message)))
        .map((f) => `  audit ${f.hub} ${f.kind} scope=${strip(f.scope)} where=${f.where} file=${f.file}: ${f.message}`);
    const cfg = (config?.findings ?? [])
        .filter((f) => /audit|publications_file|publication_kinds|standard/.test(JSON.stringify(f)))
        .map((f) => `  config ${strip(String(f.file ?? ''))} key=${f.key}: ${f.message}`);
    return [...rows, ...cfg];
}

function run(label: string, spec: Spec): void {
    const { base, state } = setUp(spec);
    const { channels, watcher } = watch(state);
    watcher.close();
    const lines = show(channels, base);
    console.log(`${label}:${lines.length === 0 ? ' (nothing)' : ''}`);
    for (const line of lines) console.log(line);
}

const hubCfg = (audit: string) => (audit === '' ? '{}\n' : `audit:\n${audit}\n`);
const PROJ = (path: string, fields: Record<string, unknown>, extra: Record<string, string> = {}) => ({
    [`${path}/project.yml`]: manifest({ title: path.split('/').pop(), ...fields }),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [`${path}/${k}`, v]))
});
const KINDS_TODAY = `    kinds:
      - { kind: [thesis], forms: [thesis] }
      - { kind: [papers-in-review], stages: [submitted, revision] }
      - { kind: [papers-in-preparation], stages: [in-prep, submit-ready] }
      - { kind: [abandoned-papers], stages: [stopped] }
      - { kind: [abstracts], forms: [abstract] }
      - { kind: [posters], forms: [poster] }
      - { kind: [conference], forms: [conference] }
      - { kind: [journal, other-publications], forms: [journal] }
      - { kind: [abstracts, conference, journal, other-publications, posters, thesis] }`;

const cases: Record<number, () => Promise<void> | void> = {
    1: () =>
        run('1', {
            hubs: [
                {
                    name: 'hub',
                    config: '{}\n',
                    files: {
                        ...PROJ('projects/ideas/a', { stage: 'nascent', datasets: ['d1'] }, { 'code/main.py': 'x\n' }),
                        ...PROJ('projects/active/b', { stage: 'published', form: 'journal' }, { 'README.md': '# b\n' })
                    }
                }
            ]
        }),
    2: () => {
        run('2a README not_flags terminal', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, stages: { not_flags: [terminal] } }]'), files: {
                ...PROJ('projects/ideas/nascent-no-readme', { stage: 'nascent' }),
                ...PROJ('projects/archive/published-no-readme', { stage: 'published' }),
                ...PROJ('projects/ideas/nascent-readme', { stage: 'nascent' }, { 'README.md': '# x\n' })
            } }]
        });
        run('2b NOTES words exploring', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: NOTES.md, stages: { words: [exploring] } }]'), files: {
                ...PROJ('projects/active/exploring-x', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/ideas/nascent-x', { stage: 'nascent' }, { 'README.md': '# x\n' })
            } }]
        });
        run('2c LICENSE every project', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: LICENSE }]'), files: {
                ...PROJ('projects/active/one', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/archive/two', { stage: 'published' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/archive/three', { stage: 'published' }, { 'README.md': '# x\n', LICENSE: 'MIT\n' })
            } }]
        });
        run('2d code/README.md live with code', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: code/README.md, stages: { flags: [live] }, folder: code }]'), files: {
                ...PROJ('projects/active/live-code', { stage: 'exploring' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' }),
                ...PROJ('projects/active/live-nocode', { stage: 'exploring' }, { 'README.md': '# x\n' }),
                ...PROJ('projects/ideas/nascent-code', { stage: 'nascent' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' })
            } }]
        });
    },
    3: () =>
        run('3', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: code/README.md, folder: code }]'), files: {
                ...PROJ('projects/active/with-code', { stage: 'published' }, { 'README.md': '# x\n', 'code/main.py': 'x\n' }),
                ...PROJ('projects/active/no-code', { stage: 'published' }, { 'README.md': '# x\n' })
            } }],
            repos: [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'published' }), 'README.md': '# r\n', 'code/main.py': 'x\n' } }]
        }),
    4: () =>
        run('4', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, folders: [projects/manuscripts] }]'), files: {
                ...PROJ('projects/manuscripts/x', { stage: 'exploring' }),
                ...PROJ('projects/coauthor/y', { stage: 'exploring' })
            } }],
            repos: [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'exploring' }) } }]
        }),
    5: () => {
        const cfg = hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: datasets }]');
        const rows: [string, Record<string, unknown>, string | null][] = [
            ['no-match', { datasets: ['d1'] }, '# x\n\nnothing\n'],
            ['data', { datasets: ['d1'] }, '# x\n\n## Data\n'],
            ['data-plus', { datasets: ['d1'] }, '# x\n\n## Data + reproduction\n'],
            ['database', { datasets: ['d1'] }, '# x\n\n## Database\n'],
            ['data-notes', { datasets: ['d1'] }, '# x\n\n### Data notes\n'],
            ['empty-list', { datasets: [] }, '# x\n'],
            ['no-key', {}, '# x\n']
        ];
        const files: Record<string, string> = {};
        for (const [name, fields, readme] of rows) Object.assign(files, PROJ(`projects/active/${name}`, { stage: 'exploring', ...fields }, readme === null ? {} : { 'README.md': readme }));
        run('5a datasets', { hubs: [{ name: 'hub', config: cfg, files }] });
        const cfg2 = hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: code_availability.status }]');
        const vals: [string, unknown][] = [
            ['deposited', { status: 'deposited' }],
            ['empty-status', { status: '' }],
            ['text-key', 'yes'],
            ['number', 3],
            ['true', true],
            ['false', false],
            ['map', { other: 1 }]
        ];
        const files2: Record<string, string> = {};
        for (const [name, value] of vals) {
            const fields = typeof value === 'object' && value !== null && 'status' in (value as object)
                ? { code_availability: value }
                : { code_availability: { status: value } };
            Object.assign(files2, PROJ(`projects/active/${name}`, { stage: 'exploring', ...fields }, { 'README.md': '# x\n' }));
        }
        run('5b code_availability.status', { hubs: [{ name: 'hub', config: cfg2, files: files2 }] });
        run('5c unparsed manifest', { hubs: [{ name: 'hub', config: cfg, files: { 'projects/active/broken/project.yml': 'title: [unclosed\n', 'projects/active/broken/README.md': '# x\n' } }] });
    },
    6: () =>
        run('6', {
            hubs: [{ name: 'hub', config: hubCfg('  required_sections: [{ file: README.md, heading: "## Data", key: datasets, folders: [projects/manuscripts, projects/archive] }]'), files: {
                ...PROJ('projects/coauthor/published/2025/x5', { stage: 'published', datasets: ['d1'] }),
                ...PROJ('projects/manuscripts/x6', { stage: 'exploring', datasets: ['d1'] })
            } }]
        }),
    7: () => {
        const feed = (section: string, list = 'papers', title = 'title') => `${section}:\n  ${list}:\n    - { ${title}: "A study of graph things" }\n`;
        const proj = PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' });
        const cfg = (list: string, title: string, kinds = KINDS_TODAY) => hubCfg(`  website:\n    file: site/pubs.yml\n    list: ${list}\n    title: ${title}\n${kinds}`);
        run('7a journal', { hubs: [{ name: 'hub', config: cfg('papers', 'title'), files: { ...proj, 'site/pubs.yml': feed('journal') } }] });
        run('7b thesis', { hubs: [{ name: 'hub', config: cfg('papers', 'title'), files: { ...proj, 'site/pubs.yml': feed('thesis') } }] });
        run('7c items/name journal', { hubs: [{ name: 'hub', config: cfg('items', 'name'), files: { ...proj, 'site/pubs.yml': feed('journal', 'items', 'name') } }] });
        run('7d items/name thesis', { hubs: [{ name: 'hub', config: cfg('items', 'name'), files: { ...proj, 'site/pubs.yml': feed('thesis', 'items', 'name') } }] });
        run('7e kinds articles', { hubs: [{ name: 'hub', config: cfg('papers', 'title', '    kinds: [{ kind: [articles], forms: [journal] }]'), files: { ...proj, 'site/pubs.yml': feed('journal') } }] });
    },
    8: () => {
        const cfg = hubCfg(`  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n${KINDS_TODAY}`);
        const proj = PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' });
        run('8a missing feed', { hubs: [{ name: 'hub', config: cfg, files: proj }] });
        run('8b unparsable feed', { hubs: [{ name: 'hub', config: cfg, files: { ...proj, 'site/pubs.yml': 'journal: [unclosed\n' } }] });
    },
    9: () => {
        const cfg = (file: string) => hubCfg(`  website:\n    file: ${file}\n    list: papers\n    title: title\n${KINDS_TODAY}`);
        run('9a second hub own feed', {
            hubs: [
                { name: 'hub', config: '{}\n', files: PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'Primary paper title words' }, { 'README.md': '# x\n' }) },
                { name: 'lab', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/q', { stage: 'published', form: 'journal', title: 'Lab paper about kernels' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Lab paper about kernels" }\n' } }
            ]
        });
        run('9b two hubs one feed each', {
            hubs: [
                { name: 'hub', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'Primary paper title words' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Primary paper title words" }\n' } },
                { name: 'lab', config: cfg('site/pubs.yml'), files: { ...PROJ('projects/archive/q', { stage: 'published', form: 'journal', title: 'Lab paper about kernels' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Lab paper about kernels" }\n' } }
            ]
        });
    },
    10: () => {
        const rows = (folder: string) => hubCfg(`  stage_folders: [{ stages: { words: [published] }, folders: [${folder}, projects/coauthor] }]`);
        const files = {
            ...PROJ('projects/active/x1', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/archive/published/x2', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/coauthor/published/2025/x3', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/archive/published-old/x4', { stage: 'published' }, { 'README.md': '# x\n' }),
            ...PROJ('projects/active/y', { stage: 'submitted' }, { 'README.md': '# x\n' })
        };
        const repos = [{ name: 'repo', files: { '.oculus/project.yml': manifest({ title: 'Repo', stage: 'published' }), 'README.md': '# r\n' } }];
        run('10a', { hubs: [{ name: 'hub', config: rows('projects/archive/published'), files }], repos });
        run('10b trailing slash', { hubs: [{ name: 'hub', config: rows('projects/archive/published/'), files }], repos });
    },
    11: () =>
        run('11 personal', {
            hubs: [{
                name: 'hub',
                config: hubCfg(`  required_files: [{ file: README.md }, { file: code/README.md, folder: code }, { file: LICENSE, folders: [projects/active] }]
  required_sections: [{ file: README.md, heading: "## Data", key: datasets }]
  stage_folders: [{ stages: { words: [published] }, folders: [projects/archive] }]
  website:
    file: site/pubs.yml
    list: papers
    title: title
${KINDS_TODAY}`),
                files: {
                    ...PROJ('projects/active/mine', { tier: 'personal', stage: 'published', form: 'journal', title: 'Personal graph study', datasets: ['d1'] }, { 'code/main.py': 'x\n' }),
                    'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Personal graph study" }\n'
                }
            }]
        }),
    12: () =>
        run('12', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md }]'), files: PROJ('projects/active/x', { stage: 'exploring' }, { 'README.md': '# x\n', 'IDEA.md': '# idea\n', 'paper/main.tex': 'x\n' }) }]
        }),
    15: () => {
        const bad = `  required_files: [{ stages: { flags: [live] } }, { file: README.md }]
  required_sections: x
  website: { file: f }
  stage_folders: [{ stages: { words: [published] } }]
  colour: 1`;
        const files = PROJ('projects/active/x', { stage: 'exploring' });
        run('15a primary', { hubs: [{ name: 'hub', config: hubCfg(bad), files }] });
        run('15b second hub', { hubs: [{ name: 'hub', config: '{}\n' }, { name: 'lab', config: hubCfg(bad), files }] });
        run('15c no primary', { hubs: [{ name: 'lab', config: hubCfg(bad), files }], primary: null });
    },
    16: () =>
        run('16', {
            hubs: [{ name: 'hub', config: hubCfg('  website: { file: site/pubs.yml, list: papers, title: title, kinds: [] }'), files: { ...PROJ('projects/archive/p', { stage: 'published', form: 'journal', title: 'A study of graph things' }, { 'README.md': '# x\n' }), 'site/pubs.yml': 'thesis:\n  papers:\n    - { title: "Other paper entirely here" }\n' } }]
        }),
    17: () =>
        run('17', {
            hubs: [{ name: 'hub', config: hubCfg('  required_files: [{ file: README.md, stages: { not_flags: [terminal] } }]'), files: { 'projects/active/nostage/project.yml': manifest({ title: 'No stage' }) } }]
        })
};

const wanted = process.argv.slice(2).map(Number);
for (const [n, fn] of Object.entries(cases)) {
    if (wanted.length > 0 && !wanted.includes(Number(n))) continue;
    await fn();
}
for (const dir of made) rmSync(dir, { recursive: true, force: true });
```

### `<scratchpad>/caserun/caserun2.ts`

```ts
// Case-run program of step O63, cases 13, 14, 18 and 19. Run: TREE=<tree> node caserun2.ts [cases]
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const W = process.env.TREE!;
// The client state modules use Svelte's runes, which only the Svelte compiler defines; plain values
// stand in for them here, since the case reads the rows and drafts once and never reacts.
Object.assign(globalThis, {
    $state: (value: unknown) => value,
    $derived: (value: unknown) => value,
    $effect: () => {}
});
const portfolioPath = existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
    ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
    : `${W}/src/lib/server/root/watch/portfolio.ts`;
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);

const made: string[] = [];
function tmp(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    made.push(dir);
    return dir;
}
function plant(root: string, files: Record<string, string>, folders: string[] = []): void {
    for (const one of folders) mkdirSync(join(root, one), { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(dirname(join(root, rel)), { recursive: true });
        writeFileSync(join(root, rel), body);
    }
}
const ENGINE = engineDir();
const strip = (base: string, text: string) => text.split(base).join('<case>');

const HUB_REWRITE = readFileSync(new URL('./hub-audit.yml', import.meta.url), 'utf8');

const cases: Record<number, () => Promise<void> | void> = {
    13: () => {
        const hub = tmp('o63-13-');
        plant(hub, { '.oculus/config.yml': 'publications_file: x.yml\n' });
        const a = loadConfig(ENGINE, { hub }).findings.filter((f: any) => f.key === 'publications_file');
        console.log('13a hub publications_file:');
        for (const f of a) console.log(`  ${strip(hub, f.file)} key=${f.key}: ${f.message}`);
        if (a.length === 0) console.log('  (nothing)');
        const vocab = readFileSync(join(ENGINE, 'config/catalogs/vocab.yml'), 'utf8');
        const line = vocab.split('\n').find((one) => /^\s+exploring:\s*\{/.test(one)) ?? '';
        const withStandard = vocab.replace(line, line.replace(/\}\s*$/, ', standard: true }').replace(', standard: true, standard: true', ', standard: true'));
        const b = loadConfig(ENGINE, { instead: { name: 'catalogs/vocab.yml', text: withStandard, layer: 'engine' } })
            .findings.filter((f: any) => /standard/.test(`${f.key} ${f.message}`));
        console.log(`13b vocab stage row with standard: true (${line.trim().slice(0, 60)}...):`);
        for (const f of b) console.log(`  ${f.file.split('/config/')[1]} key=${f.key}: ${f.message}`);
        if (b.length === 0) console.log('  (nothing)');
        const ws = tmp('o63-13ws-');
        plant(ws, { 'w.yml': 'folders: []\nsettings:\n  audit:\n    required_files: [{ file: README.md }]\n' });
        const c = loadConfig(ENGINE, { workspace: { file: join(ws, 'w.yml') } }).findings.filter((f: any) => /audit/.test(`${f.key}`));
        console.log('13c workspace settings: audit:');
        for (const f of c) console.log(`  ${strip(ws, f.file)} key=${f.key}: ${f.message}`);
        if (c.length === 0) console.log('  (nothing)');
    },
    14: () => {
        const { config, findings } = loadConfig(ENGINE);
        const stages = config.stages as Record<string, Record<string, unknown>>;
        const flagged = Object.entries(stages).filter(([, row]) => row !== null && typeof row === 'object' && 'standard' in row).map(([k]) => k);
        console.log(`14: findings=${findings.length} publication_kinds=${'publication_kinds' in config ? 'present' : 'absent'} stages with standard=[${flagged.join(', ')}]`);
    },
    18: async () => {
        const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
        const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
        const { createChecker, checkDocument } = await import(`${W}/src/lib/data/snapshot/schema/check.ts`);
        const { schemaFor } = await import(`${W}/src/lib/data/snapshot/schema/set.ts`);
        const { withOwnSchemas } = await import(`${W}/src/lib/server/root/watch/build.ts`);
        const { catalogOf } = await import(`${W}/src/lib/data/sources/config/catalog/options.ts`);
        const { fileRows } = await import(`${W}/src/lib/state/system/config/rows.ts`);
        const hubAudit = 'audit:\n  required_files:\n    - { file: README.md, stages: { not_flags: [terminal] } }\n  stage_folders:\n    - { stages: { words: [published] }, folders: [projects/archive] }\n';
        // The Settings view's rows of behavior.yml over a hub that sets audit:.
        const hub = tmp('o63-18-');
        plant(hub, { '.oculus/config.yml': hubAudit });
        const { config } = loadConfig(ENGINE, { hub });
        const entries = catalogOf(config)['behavior.yml'] ?? {};
        const text = { text: hubAudit, truncated: false, error: '', loading: false };
        const { rows } = fileRows('behavior.yml', entries, config, { hubFile: { text, present: true }, workspace: null });
        const audit = rows.filter((row: any) => row.section === 'Audit checks');
        console.log(`18a rows of the section Audit checks: ${audit.length}`);
        for (const row of audit) {
            const fields = Object.entries(row.fields ?? {}).map(([name, spec]: [string, any]) => `${name}:${spec.control}`).join(' ');
            console.log(`  ${row.key} control=${row.control} own=${row.own} value=${JSON.stringify(row.value)}${fields === '' ? '' : ` fields=[${fields}]`}`);
        }
        const draftPath = `${W}/src/lib/state/system/config/editors/draft.ts`;
        const fieldsPath = `${W}/src/lib/state/system/config/editors/fields.ts`;
        const required = audit.find((row: any) => row.key === 'audit.required_files');
        if (required !== undefined) {
            const { draftOf, draftValue, applyEdit } = await import(draftPath);
            const fields = await import(fieldsPath);
            const draft = draftOf(required);
            console.log(`18b draft of audit.required_files: ${JSON.stringify(draft?.cards.map((card: any) => card.fields))}`);
            if (draft !== null && fields.fromBlock !== undefined) {
                const next = applyEdit(draft, { do: 'set', index: 0, field: 'stages', value: fields.fromBlock(draft.cards[0].fields.stages, 'words', ['exploring']) });
                const lists = { items: () => ({ state: 'ready', items: ['exploring', 'nascent', 'published', 'terminal', 'live'] }), labels: () => new Map(), groups: () => new Map(), folder: () => ({ state: 'ready', entries: [] }), config, hues: [], glyphs: [] };
                console.log(`18c the draft read back after adding words [exploring]: ${JSON.stringify(draftValue(next, required, lists))}`);
            }
        }
        // The editor's schema of the hub's .oculus/config.yml.
        const checker = createChecker();
        const schemas = withOwnSchemas(buildOneHub(hub, portfolioConfigFrom(config), 1, [], checker, null, 'hub').schemas);
        const name = schemaFor(schemas, 'hub', '.oculus/config.yml');
        const check = (label: string, body: string) => {
            const found = checkDocument({ name, file: '.oculus/config.yml', text: body }, schemas.texts, checker, portfolioConfigFrom(config).text);
            console.log(`${label}: ${found.length === 0 ? '(nothing)' : ''}`);
            for (const one of found) console.log(`  line ${one.line ?? 0}: ${one.message}`);
        };
        check('18d schema, stages: { word: [x] }', 'audit:\n  required_files: [{ file: README.md, stages: { word: [x] } }]\n');
        check('18e schema, the hub rewrite value', HUB_REWRITE);
    },
    19: async () => {
        const { watchPortfolio } = await import(portfolioPath);
        const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
        const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
        const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
        const catalog = textCatalog(loadConfig(ENGINE).config);
        const required = (file: string) => String(catalog['audit.msg_required_file']).replace('{0}', file);
        const base = tmp('o63-19-');
        const hub = join(base, 'hub');
        const repo = join(base, 'repo');
        const site = join(hub, 'site');
        const manifest = (title: string) => `tier: research\nstage: exploring\ntitle: ${title}\nlead: [someone]\n`;
        plant(hub, {
            '.oculus/config.yml': `scan:\n  - { dir: projects }\naudit:\n  required_files:\n    - { file: README.md }\n    - { file: code/LICENSE, folder: code }\n  website:\n    file: site/pubs.yml\n    list: papers\n    title: title\n    kinds: [{ kind: [journal] }]\n`,
            'projects/a/project.yml': manifest('Alpha').replace('stage: exploring', 'stage: published\nform: journal'),
            'projects/a/README.md': '# a\n',
            'projects/b/project.yml': manifest('Beta'),
            'projects/b/README.md': '# b\n',
            'projects/b/code/main.py': 'x\n'
        });
        plant(repo, { '.oculus/project.yml': manifest('Gamma'), 'README.md': '# r\n' });
        plant(site, { 'pubs.yml': 'journal:\n  papers:\n    - { title: "Alpha" }\n' });
        const state = tmp('o63-19s-');
        writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'hub', path: hub }, { name: 'repo', path: repo }], primary: 'hub' } });
        let builds = 0;
        const channels = new Hub();
        const watcher = watchPortfolio(channels, {
            engine: ENGINE,
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => openWorkspace(state),
            settings: (dir: string) => loadConfig(ENGINE, { hub: dir }),
            problems: () => []
        }, { debounce: 50, built: () => { builds += 1; } });
        const findings = () => ((channels.latest('audit')?.payload as any)?.findings ?? []) as any[];
        const scopes = (message: string) => findings().filter((f) => f.message === message).map((f) => strip(base, f.scope)).sort();
        const waitBuild = async (from: number, label: string) => {
            const end = Date.now() + 6000;
            while (builds === from && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
            console.log(`  ${label}: ${builds > from ? 'rebuilt' : 'NO REBUILD within 6 s'}`);
        };
        await new Promise((r) => setTimeout(r, 400));
        console.log(`19 start: website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        console.log(`19 start: README.md missing for [${scopes(required('README.md')).join(', ')}], code/LICENSE missing for [${scopes(required('code/LICENSE')).join(', ')}]`);
        let at = builds;
        unlinkSync(join(hub, 'projects/a/README.md'));
        await waitBuild(at, 'README.md of projects/a removed');
        console.log(`    README.md missing for [${scopes(required('README.md')).join(', ')}]`);
        at = builds;
        writeFileSync(join(hub, 'projects/b/code/LICENSE'), 'MIT\n');
        await waitBuild(at, 'code/LICENSE of projects/b created');
        console.log(`    code/LICENSE missing for [${scopes(required('code/LICENSE')).join(', ')}]`);
        at = builds;
        writeFileSync(join(site, 'pubs.yml'), 'thesis:\n  papers:\n    - { title: "Alpha" }\n');
        await waitBuild(at, 'feed outside every scan folder edited');
        console.log(`    website findings: ${findings().filter((f) => f.kind === 'publink').map((f) => f.message).join(' | ') || '(none)'}`);
        at = builds;
        unlinkSync(join(repo, 'README.md'));
        await waitBuild(at, 'README.md of the repository removed');
        console.log(`    README.md missing for [${scopes(required('README.md')).join(', ')}]`);
        watcher.close();
    }
};

const wanted = process.argv.slice(2).map(Number);
for (const [n, fn] of Object.entries(cases)) {
    if (wanted.length > 0 && !wanted.includes(Number(n))) continue;
    await fn();
}
for (const dir of made) rmSync(dir, { recursive: true, force: true });
process.exit(0);
```

### `<scratchpad>/caserun/hub-audit.yml`, read by `caserun2.ts` case 18

The value under "Hub rewrite".

### `<scratchpad>/caserun/hubrun.ts`

```ts
// The audit of a copy of the research hub, the hub alone in the workspace and its primary, by the
// tree TREE names. Prints one line per finding, sorted. Run: TREE=<tree> HUB=<copy> node hubrun.ts
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const W = process.env.TREE!;
const HUB = process.env.HUB!;
const { watchPortfolio } = await import(
    existsSync(`${W}/src/lib/server/root/watch/portfolio/portfolio.ts`)
        ? `${W}/src/lib/server/root/watch/portfolio/portfolio.ts`
        : `${W}/src/lib/server/root/watch/portfolio.ts`
);
const { Hub } = await import(`${W}/src/lib/server/core/channels.ts`);
const { writeState } = await import(`${W}/src/lib/server/files/workspace/state.ts`);
const { openWorkspace } = await import(`${W}/src/lib/server/files/workspace/open.ts`);
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);

const state = mkdtempSync(join(tmpdir(), 'o63-hubrun-'));
writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'research-hub', path: HUB }], primary: 'research-hub' } });
const channels = new Hub();
const watcher = watchPortfolio(
    channels,
    {
        engine: engineDir(),
        icons: { set: {} },
        host: { name: 'test', address: '127.0.0.1' },
        open: () => openWorkspace(state),
        settings: (dir: string) => loadConfig(engineDir(), { hub: dir }),
        problems: () => []
    },
    { debounce: 20 }
);
watcher.close();
const audit = channels.latest('audit')?.payload as { findings: any[] };
const config = channels.latest('config')?.payload as { findings: any[] };
const lines = (audit?.findings ?? []).map((f) => `audit ${f.kind} | ${f.scope} | ${f.where} | ${f.message}`);
const cfg = (config?.findings ?? [])
    .filter((f) => String(f.file ?? '').startsWith(HUB))
    .map((f) => `config | ${String(f.file).slice(HUB.length + 1)} | ${f.key} | ${f.message}`);
for (const line of [...lines, ...cfg].sort()) console.log(line);
rmSync(state, { recursive: true, force: true });
process.exit(0);
```
