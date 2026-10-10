# D49 report: the help pages cut

Everything in the brief is done. Not verified by me, because I may not start the app: how the Help page, the Views catalogue and a saved removed-guide tab draw on screen; the landing look does that. The saved-layout case ran as a reader run (case 12).

## Open items

Copied from `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` lines 163-168, read at the moment of writing:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The cases, first run on the unchanged tree and after the change

Scripts are in the builder's scratch folder (`.../scratchpad/d49b/cases/`); each prints what is quoted. `B` is the read-only base, `W` the worktree. No case in the first run was one the brief's rules got wrong, so no stop was needed.

| Case | First run (base, before any edit) | After the change |
|---|---|---|
| 1 `ls docs` | `apps.md configuration.md debugging.md diagrams files-and-search.md source-control.md terminals.md views.md window.md` | `apps.md diagrams` |
| 2 guide-name grep (the brief's `grep -rnE ...` from the worktree root) | 150 lines (`wc -l` of the saved output) | prints nothing, `grep exit 1` |
| 3 keys and chords | `chords and function keys in the seven guides: 78`, `missing from HELP.md : 23` | `missing from HELP.md : 0`; also in HELP.md: the `launch.yml` fence (`yaml` fence at the Debugging section, `configurations:` list), the five debug key rows (F5, Shift+F5, Cmd+Shift+F5, F9, F10 / F11 / Shift+F11) in The keys, one hit each for `hub port hpc_host claude_bin open_bin rite_dap_bin accounts calendars mail literature`, the hub layer bullet (HELP.md:384), the `.oculus/` folder bullet (:390), the `local.yml` bullets (:391, :392) and the `~/.oculus` bullet (:395), all under Configuration and the data, and the fence at :331 |
| 4 limits | HELP.md 188 lines, apps.md 861; `c04_bullets.py`: apps.md 36 lines over the rule; `awk 'length > 600 && !/^\|/'` 8 lines | HELP.md 401 lines, apps.md 349; `HELP.md: 190 bullet/paragraph lines checked, 0 over the rule`, `docs/apps.md: 61 bullet/paragraph lines checked, 0 over the rule`; the `awk` prints 0 lines |
| 5 anchors | `targets: 0 unmatched: 0` (no `HELP.md#` link existed) | `targets: 58 unmatched: 0` (DESIGN.md and README.md links to HELP.md headings) |
| 6 doc tab and `docs:` paths | `help arrangement doc tabs: 8 existing: 8`, `hub docs entries: 13 existing: 13` | `help arrangement doc tabs: 1 existing: 1`, `hub docs entries: 5 existing: 5` |
| 7 DATA-MAP grep | 105 matching lines | prints nothing, `grep exit 1` |
| 8 schema fields vs tables | schema 46 and 17 fields; `no project.yml field table: all 46 schema keys missing`; old side-project table 5 names, 12 schema keys missing; 3 `\| Field \| Holds \|` heads | `project.yml table ... 46 names; schema keys missing from the table: [] ; table names not in schema: []`; side-project table 17 names, none missing, none extra; 2 heads remain (career, radar) |
| 9 vocab words | 15 rows with a difference (`type_order: vocab 14 words, page 3 words`, and the other lists the same way) | `rows with a difference: 0`; `domains (hub): vocab 12 words, page 12 words`; `unrated` listed with `assignable: false`: True |
| 10 apps facts | closed write kinds named `18 of 23` (not named: deposit, fs, mail, memories, usage/refresh), closed channels `3 of 3` | methods, channels, open write kinds and refusal words equal to the code (`code not in guide: []`, `guide not in code: []` for each); `23 of 23` and `3 of 3` named |
| 11 `npx vitest run tests/checks/config` | `Test Files 4 passed (4)`, `Tests 81 passed \| 1 skipped (82)` | the same numbers |
| 12 saved Help page | not run on the base: the layout reader is unchanged (`diff -rq` lists no file under `src/lib/state`) | a saved Help page holding Apps, Views and Design doc tabs reads into `{"id":"doc-views","view":"doc","state":{"id":"tools/oculus/docs/views.md","path":"tools/oculus/docs/views.md","label":"Views guide"}}` and the Design tab the same with `tools/oculus/DESIGN.md`, `label: "Design"`: both kept with their `path` (decision 4) |
| 13 view-table sentences and h1-h9 | `rows whose description is not exactly one sentence: 1` (the `present` row, 4 sentences); `link in a name cell: 52`; the h1-h9 rows in HELP.md and `app.yml` equal | `rows whose description is not exactly one sentence: 0`; `link in a name cell: 0`; `equal : True` for `h1-h9 \| open the manual, the Memories wall or a document of the Help page's group, its first nine` |

Verify list 2, `npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000`: before `Test Files 9 passed (9)`, `Tests 115 passed | 1 skipped (116)`; after the same.

## DONE / NOT DONE

| Row | Command | Output |
|---|---|---|
| 1 Seven guides deleted | `ls docs` (in `tools/oculus`) | `apps.md diagrams` |
| 2 HELP.md: 401 lines, bullets within limits | `wc -l HELP.md`; `python3 c04_bullets.py HELP.md docs/apps.md`; `awk 'length > 600 && !/^\|/' HELP.md docs/apps.md \| wc -l` | `401`; `HELP.md: 190 bullet/paragraph lines checked, 0 over the rule`, `docs/apps.md: 61 ... 0 over the rule`; `0` |
| 3 Apps guide: 349 lines, worked example `nudge` 49 code lines, 55 with fences | `wc -l docs/apps.md` | `349` |
| 4 DATA-MAP rewritten | cases 7, 8, 9 above | grep prints nothing; 46 and 17 field tables with no difference; 0 vocab rows differ |
| 5 DESIGN.md | `grep -rnE "docs/(configuration\|...)\.md\|... guide\|the guides\b\|guide that holds"` from the worktree root | prints nothing |
| 6 Help arrangement and `docs:` | case 6 | 1 and 5 existing |
| 7 README, comments, key sheet | `diff -rq $B/tools/oculus $W/tools/oculus ...` | the files in "Files with line counts" below and no others |
| 8 `npm run diagrams && npm run test:quick` | last run | `test:quick: 12.0 s (limit 45.0 s); every command passed`, exit 0; prettier, ASCII gate, eslint, svelte-kit sync, svelte-check (`454 FILES 0 ERRORS 0 WARNINGS`) and vitest all `ok`; `docs/diagrams` has no difference from the base |
| 9 Tree checks | `npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000` | `9 passed (9)`, `115 passed \| 1 skipped (116)`, exit 0 |
| 10 ASCII gate | `LC_ALL=C grep -n '[^ -~]' HELP.md docs/apps.md ../../docs/DATA-MAP.md DESIGN.md README.md` | prints nothing, exit 1 (no match) |
| 11 Rules file perl gate | the `perl -ne ... $(find src tests config -type f ! -name local.yml)` of `agents/spec.md:99` (no `bin` folder exists here) | prints nothing, exit 0 |
| 12 Folder check | `sh utils/folder-check.sh` | exit 0 |
| 13 YAML parses | `python3 -c "import yaml,sys; ..." config/layout.yml config/text/app.yml ../../.oculus/config/layout.yml` | exit 0 |
| 14 No process of mine running | `ps aux \| grep "D49/" \| grep -v grep \| wc -l` | `0` |

NOT DONE: nothing.

Full verify-list runs (`npm run diagrams && npm run test:quick`, the tree checks, the ASCII gates, `folder-check.sh`, the YAML parse): 6; the last one is after the final edit of every file.

No glossary.

## Files with line counts

From `diff -rq` of the base against the worktree (tools/oculus excluding `node_modules`, `.svelte-kit`, `build*`, `local.yml`; then `docs/` and `.oculus/`), line counts from `wc -l`:

| File | Base | Now |
|---|---|---|
| `tools/oculus/HELP.md` | 188 | 401 |
| `tools/oculus/docs/apps.md` | 861 | 349 |
| `tools/oculus/DESIGN.md` | 591 | 591 |
| `tools/oculus/README.md` | 48 | 48 |
| `tools/oculus/config/layout.yml` | 182 | 182 |
| `tools/oculus/config/text/app.yml` | 258 | 258 |
| `.oculus/config/layout.yml` | 21 | 13 |
| `docs/DATA-MAP.md` (hub) | 519 | 563 |
| `tools/oculus/src/lib/views/shared/prose/doc-link.ts` | | 56 |
| `tools/oculus/src/lib/server/content/docs.ts` | | 624 |
| `tools/oculus/src/lib/views/sources/doc/Doc.svelte` | | 209 |
| `tools/oculus/src/lib/views/system/help/Help.svelte` | | 95 |
| `tools/oculus/tests/checks/config/config-folder.test.ts` | | 649 |
| `tools/oculus/tests/checks/source/history.test.ts` | | 186 |
| `docs/configuration.md`, `debugging.md`, `files-and-search.md`, `source-control.md`, `terminals.md`, `views.md`, `window.md` | 88, 109, 154, 67, 69, 287, 98 | deleted |

## What became of each removed guide, section by section

HELP.md section names below are the headings of HELP.md. "Kept" means as bullets (or the table or fence named) under that section.

**Configuration guide.** The files of `config/`: kept under Configuration and the data (the setting-file and `catalogs/options.yml` bullets); the per-file key lists dropped, since the Settings view lists every key with its default and file and line. The two layers of settings and The hub's own folder: kept under Configuration and the data (the layer, the key list, the `.oculus/` folder bullets). The text of the interface: kept (the `config/text/` bullet); its two source paths dropped as source paths. `local.yml`: kept (three bullets: the keys, the places, a wrong value). The hub's files: dropped, since the hub's `docs/DATA-MAP.md` gives them and a last bullet points there. What is kept outside the hub: kept (the `~/.oculus` bullet). The Literature search's keys: kept. Mail accounts and the Inbox: kept (token file and `poll_min`, `per_signal`; the plate rule, the triage notes and the Reply-To rule in the Inbox bullet). Calendar accounts: kept (published link bullet, `calendar:` keys, account removal and the provider's client half). The change log: kept except the byte-level rules by which the History control restores a removed field, dropped as detail of one control.

**Debugging guide.** Starting, The launch file (as the fence and one bullet each for `name`, `program`, `cwd`, `before`), A command before the launch, Breakpoints, Stepping, Stop and restart, The console, Keys (the five rows in The keys): kept under Debugging and The keys. What the debugger does not offer: kept (one bullet). The settings VS Code has for this: dropped, the VS Code settings comparison table the brief names; the one bullet says none of `debug.*` is a key of oculus and the console bullet keeps the 10,000 lines.

**Files and search guide.** The Files view, The tree and its header, Open Editors and Outline, Timeline, Bookmarks and Notes, Keys and selection in the tree, Workspaces roots and Add Folder to Workspace, Show in Files, Creating renaming deleting moving and pasting, Undo and the local history, The Files tab of the Sessions page: kept under Files and the editor; the wire routes of Undo and the local history dropped as routes. The right-click menus: kept only as the rules a reader cannot see (what asks, what is refused); the item-by-item list of every menu dropped, as the brief names. Opening a file, Saving a source file, The source tab's editor options: kept. Language servers: kept (the servers, the 60 seconds, what each server gives, library tabs, edits across files, the interpreter and `cpp.yml` and texlab and YAML and Markdown servers); the per-extension lists dropped. Hub keys in YAML files: kept. Linters: kept (which linter runs on which kind of file, the programs and their path keys, ESLint approval, the writing rules, Fix All, Show documentation); the per-extension lists dropped. Searching the files, The pattern, Running a search and reading the results, Replace, The replace text: kept under Searching the files; the `search.smartCase` setting spelled by name dropped in favour of "smart case", and the replace text's `$&` and `$<name>` spellings dropped.

**Source Control guide.** All thirteen sections kept as bullets under Source Control and worktrees (The graph and From a commit of the graph as the Graph bullet and the Cherry Pick and compares bullet), except the exact git command lines of From a commit of the graph (`git switch --detach`, `cherry-pick --abort`) and of What oculus fixes (`--force`), dropped as spellings of commands git documents.

**Terminals and commands guide.** The Terminal view through Sessions: kept under Terminals. Where project commands come from, Where project commands are drawn, The run, Approval, The result, The default build and test keys: kept under Project commands; the preset naming spellings (`cmake build: <preset>`), the shell-expansion examples of The run and the `file:line: warning:` shapes dropped as examples.

**Views guide.** Each view's section: kept as one row of the table under The views plus the bullets whose facts a reader cannot see (Focus, Personal, Map, Present, Literature search, Position Leads, Inbox, Live HPC with its retry and `slurm.prewarm`, Usage, Processes, Audit, Settings with `@modified` and `@id:`, Problems, Projects with `file_index.ext`); the layout descriptions of where a control sits dropped. Views limited to a folder and Views opened for something: kept (the opened-for-something bullets). Customization files: kept (a bullet). Documents drawn as prose: kept (a bullet). LaTeX builds: kept under LaTeX builds, with the editing, hover and `.bib` commands as two bullets. The 19 VS Code theme names and the conversion command of the Settings section: dropped, a list the Settings view shows.

**Window guide.** The window and the app: kept under The window. The rail, The Views catalogue, The foot of the rail: kept under The rail. The update tray and schedules: kept. Pages, Workbenches, Where an opened tab lands, Inside a page, Focus tabs and unsaved text: kept under Pages and the pane tree and Workbenches. The palette: kept. The key sheet: kept in The keys. The status bar and notifications: kept. Example strings of the status bar (`10K+`, `3.13.4 (.venv)`) and the wire route of the palette's name list dropped.

## Head comments and documents the brief quotes

| Place | Result |
|---|---|
| `src/lib/views/shared/prose/doc-link.ts:2` | rewritten: names the manual, the Apps guide and the hub's documents |
| `doc-link.ts:3` | rewritten: the example is `docs/apps.md` |
| `src/lib/server/content/docs.ts:30` | rewritten: "(HELP.md, DESIGN.md, the Apps guide under docs/ ...)" |
| `src/lib/views/sources/doc/Doc.svelte:25` | rewritten: "(DESIGN.md, the Apps guide)" |
| `src/lib/views/system/help/Help.svelte:3` | rewritten: "beside the hub's documents and the Apps guide" |
| `Help.svelte:24` | rewritten: "DESIGN.md and the Apps guide" |
| `Help.svelte:26` | rewritten: "from another document opens this view" |
| `tests/checks/config/config-folder.test.ts:3` | rewritten: "the manual's Configuration section" |
| `tests/checks/source/history.test.ts:4`, `:24`, `:116`, `:153`, title at `:155` | rewritten: line 4 "the Apps guide, docs/apps.md", line 24 "the Apps guide and any other Markdown document", line 116 "every Markdown file under its `docs/`", line 153 "A document under docs/", the title "reads every line of a text file, every document and every comment of code" |
| `HELP.md:3` and the old `HELP.md:17` sentence on the guides | rewritten: "This manual holds the detail itself, the Help page holds the manual, the hub's documents and the Apps guide" (HELP.md:3) and the Help page bullet in The rail (HELP.md:24) |
| `README.md:9` | rewritten: "The [manual](HELP.md#the-window) describes what the app adds to the page." |
| `DESIGN.md:82` | rewritten: `docs/apps.md  the guide to building an app, opened in oculus as Apps guide` |
| `DESIGN.md:491` | rewritten: "The manual and the Apps guide: ..." ending with the sentence on the hub's `docs/DATA-MAP.md` |
| the other `DESIGN.md` lines that named a guide (52 changed lines in all, lines 82 and 491 among them) | rewritten to `HELP.md#...` anchors; all 58 targets exist (case 5) |
| `config/sources.yml:49` and `.oculus/config/sources.yml:47` ("the links between files are in docs/DATA-MAP.md") | still true: the page's "Links between files" lists the vocab words |
| `src/lib/data/snapshot/references/specs.ts:11` ("stated here and in docs/DATA-MAP.md") | still true: the domains row of "Links between files" says the keys of the `domains` map of `.oculus/config/catalogs/vocab.yml` each name the registry entry of the same key |
| `DESIGN.md:583` (same rule) | still true, line unchanged |
| the `config/layout.yml` head comment of the `docs:` list and the `.oculus/config/layout.yml` head comment | still true |

Names grepped across `src tests config utils docs HELP.md DESIGN.md README.md ../../docs ../../.oculus --exclude=local.yml` after the change: the seven file names, the seven "<Name> guide" labels, "the guides" and "guide that holds" print nothing outside the deleted files themselves; "Apps guide" appears in the lines listed above only.

## Judgment calls

1. The Apps guide's worked example is `nudge`, 49 code lines (55 with fences): it reads the `portfolio` channel, keeps a `setState` value and asks one `write`.
2. Section titles of the Apps guide are unnumbered words ("The manifest", "The bridge", "When something goes wrong") as the brief lists contents, not numbers.
3. DATA-MAP's folder-table header "Shape" is now "Scan", because the case 7 grep names `Shape\b` and the column holds the scan rule.
4. `HELP.md` states the Help page's tabs in one bullet of The rail (HELP.md:24).
5. The extension lists of the linters and language servers, the item lists of right-click menus and the VS Code theme names are dropped; each is listed above.
6. `.oculus/config/layout.yml` keeps its head comment unchanged; the list of five entries is Research approach, Agent approach, HPC how-to, Data map, Apps guide.

## Visible changes for the landing look

| Place | Before | After |
|---|---|---|
| The Help page's tabs | Help, Apps guide, Configuration guide, Source Control guide, Window guide, Views guide, Files and search guide, Terminals and commands guide, Debugging guide, Memories (`config/layout.yml:93`) | Help, Apps guide, Memories |
| Help group of the Views catalogue | the Help and Memories views, then 13 documents: Research approach, Agent approach, HPC how-to, Data map, Apps guide, the seven guides, Design | the Help and Memories views, then 5 documents: Research approach, Agent approach, HPC how-to, Data map, Apps guide |
| The Help view | the 188-line manual with a sentence pointing to guides | the 401-line manual holding the detail; links into it from DESIGN.md and README.md resolve to its headings |
| The key sheet's h1-h9 row | `h1-h9 \| open the manual, the Memories wall, a hub document or a guide, the Help page's group` | `h1-h9 \| open the manual, the Memories wall or a document of the Help page's group, its first nine` |
| A saved Help page holding a removed guide's tab (e.g. Views guide) | the tab drew the guide | the tab keeps `{id, path, label}` (case 12); `followDoc` finds no entry for the path and no entry carrying the label "Views guide", so `shown` is null: the pane title is the saved label (`Doc.svelte:88`) and the body is `<Empty message={t('doc.unlisted', path)}>` (`Doc.svelte:169-170`), the sentence of `config/text/views/sources/doc.yml:13` ("... is not in the documents list ..."): to be seen at the landing look |
| A saved Help page holding the "Design" tab | the tab drew DESIGN.md | the same as the row above: `DESIGN.md` is a file only and no `docs:` entry names it, so the tab shows the unlisted line |

## Anything in the brief that was wrong

Nothing that stopped the work. One point of the brief's wording against the tree: the brief names `config/layout.yml` lines 92-93 for the Help arrangement; line 92 is `help:` and only line 93 changed.
