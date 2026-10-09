NOT written to disk: the report file `tools/oculus/.scratch/migration/agents/reviews/D52-report.md` was not written, because writing a report .md file was refused in this environment ("Subagents should return findings as text, not write report files"). This message is the report in full.

Everything in the brief is done. Cases 9, 11, 12 (the page's own blocks), 14 and 18 are checked by reading the source of the page and of the card, as the brief says, and are left to the landing look. The page component `src/lib/views/boards/entry/Entry.svelte` was never mounted in this task, since no mounting harness exists for a view under `tests/` (`grep -rln "Person.svelte\|Project.svelte" tests` prints nothing). No new test was written: `grep -n -i "entry page\|pageFolder" agents/guarded.md` finds no guarded entry for the page, and the brief says no case becomes a test without one. `npm run test:quick` ran 49.3 s against its 45.0 s limit with every command passing, while other agents were running on the machine.

Worktree: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D52` (all paths below are relative to `tools/oculus` unless they start with a hub folder name).

# D52 report: a page per collection entry

## Open items of the state file

Copied from `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout at the moment of writing (read only):

- 27. The hub's `network/events.yml` fails its own schema since your commit f28e137f1: the entry "Research visit - Linkoping (Sweden)" (`entries[2]`, line 47) lost its `status: planned` line, and the file's `schema:` block (line 9) marks `status` as `required: true`. The landing gate's `tests/checks/config/integrity.test.ts` "validates with no findings" fails on it with "key entries[2].status is required", on main as on D41 (D41 changes no file under `network/` and no schema). (a) Recommended: put a status back on the entry; `planned` is what it held, and every other entry carries one. (b) Make `status` optional in the file's `schema:` block, so a dated entry may carry none. (c) Leave it, which keeps the integrity check red at every landing; this is the lazy option. Both files are yours, so I change neither until you rule. D41 lands with this red line named as main's, not D41's.
- 28. D46: the history check forbids the key name F1. `tests/checks/source/history.test.ts:41` lists `F1` among the plan's id families (the package F1, landed, `plan.md:79`), so the check fails on every comment and document line that names the F1 key: on D46's tree `chords.ts:3` and `:86`, `Workbench.svelte:278`, `Palette.svelte:4`, `palette.ts:474` and `:478`, `editor-status.svelte.ts:15`, `grid-keys.ts:2`, `HELP.md:81` and `docs/window.md:76`. D46's brief requires the key named in HELP's key row, `docs/window.md` and `editor-status.svelte.ts`. On main no comment or document names the package F1 (`grep -rnE '(^|[^A-Za-z])F1([^A-Za-z0-9]|$)'` over `src tests utils HELP.md DESIGN.md README.md docs` prints only the check's own line 41). Changing what a check passes is yours to rule. (a) Recommended: `F1` removed from `FAMILIES`, in D46 with the path widened; a comment naming the package F1 would then pass, and none does today, and the plan has no other F package. (b) The F1 pattern narrowed so a key named in prose passes (not next to `Shift+`, `Cmd+`, "and"); a guess about the next sentence that fails on it. (c) Every comment and document reworded to avoid the name ("the help key"); HELP.md would no longer say which key opens the palette; this is the lazy option. D46's builder waits for this ruling.

Item 27 concerns `network/events.yml`, one of the seven files this step edited: the step adds a `key` line and a schema row to that file and leaves the entry "Research visit - Linkoping (Sweden)" without a `status`, as it is on main.

## The cases

Every case ran first on the unchanged tree. For the scratch runs, the unchanged tree is a copy of the base (`.agents/worktrees/D52-base/tools/oculus/`, `node_modules` linked, `vite.config.ts` and `tsconfig.json` copied in) under `$TMPDIR`, run over a copy of the 14 data files as they were before any edit. No scratch file is in the worktree. No case's rule got a wrong answer, so the first task did not hand back early.

### First run, on the unchanged tree

Case 1, the key rule over the hub's seven files (`python3 keyrule.py <hub>`, a scratch script implementing the brief's rule: keep a key; a folder-linked entry takes the folder name with the link normalised; else the title slug; `-2` on a clash; a quoted non-text key). Its output equals the brief's quoted lists for all seven files, and no key parses as non-text. Output (`rule-hub.txt`; the education and applications lines are long and are the brief's lists):

```
funding: title nwo-veni-the-self-explaining-hospital | folder 2026-fwo-senior-transplant | title nwo-open-competition-domain-science-xs-enw-xs | kept FAIR | title pioneers-in-healthcare-pihc-innovation-fund | title erc-starting-grant-2027-submission | kept ZonMw-AI-HCC | kept FWO-PhD | folder 2025-fwo-project-fl4phm | folder 2025-fwo-postdoc-fermat | folder 2024-fwo-postdoc-fbttr
events: title aaai-2027 | title flta-2026 | title research-visit-linkoping-sweden | title graz-bci-conference-2026 | folder flta-2025 | folder fllm-2025 | folder inkendaal
education: folder bioinformatics | title msc-supervision-computer-science-2025-2026 | folder reader-2026 | folder advanced-topics-in-data-science | title data-science-in-healthcare-4747-lecturer | title brain-computer-interfacing-b-kul-h08m0a-guest-lecturer | folder bko | folder student-supervision | title phd-daily-supervision-biomedical-sciences-2022-2023 | title internship-msc-ai-students-2020-2021 | title guest-associate-editor-frontiers-in-immunology | title vlaio-baekeland-spin-off-mandates-evaluator | title student-research-competition-judge-icfp | title thesis-topic-master-of-statistics-and-data-science | title thesis-topic-bachelor-medicine | title thesis-topic-master-biostatistics | title thesis-topic-bachelor-informatics | title thesis-topic-bachelor-biomedical-sciences | title thesis-topic-junior-master-biomedical-sciences | title thesis-topic-master-informatics | title thesis-topic-master-system-and-process-innovation
applications: title vib-ai-group-leader | folder 2026-hasselt-immunology-zap | title larian-studios-engine-programmer | folder 2026-guerrilla-senior-data-analyst | folder 2025-twente-cancer-ai | folder 2024-uhasselt-fl-bds | folder 2025-ucd-rwe-postdoc | folder 2025-wageningen-fl | folder 2025-oslo-ml-integreat | folder 2025-uppsala-ml-theory | folder 2025-twente-aneurysm | folder 2025-maynooth-cs-zap | folder 2025-hasselt-data-science-zap | folder 2025-oslo-plague | folder 2025-tilburg-eeg | folder 2025-utrecht-nlp | folder 2025-denmark-ai-zap | folder 2025-kth-sign-language | folder 2025-luxembourg-ai | folder 2025-luxembourg-zap | folder 2025-umea-precision-zap | folder 2025-uppsala-precision-zap | folder 2024-lund-paleogenomics | folder 2024-hasselt-neuroscience-zap | folder 2025-ucd-rwe-zap
tasks: title submission | title investigation
code: title bttr-block-term-tensor-regression | title research-hub | title fl-kit-elixir-federated-learning-kit | title game-engine | title rite | title yt-downloader | title theaxec-github-io | title federated-learning-tutorial | title cardinal-revamped | title algebraic-subtyping-for-algebraic-effects-handlers | title effect-handler-optimization-honours-project | title row-based-effects-honours-project | title eeg-source-reconstructed-connectivity-information-theoretical | title ml-for-flow-based-network-intrusion-detection | title cv-autogenerator | title ical-kuleuven | title axeski | title theaxec-profile-readme | title cardinal | title quasi-monte-carlo-points-on-collections-of-triangles
statements: title ai-use-general-coding-writing | title ai-use-experimental-code-experiments
```

The demo hub (`tools/oculus/demo/`), same rule (`rule-demo.txt`):

```
funding: kept ecf | title open-data-infrastructure-grant
events: title streaming-anomaly-detection-at-scale | title poster-robust-embeddings-under-shift | title neurips-attending
education: title machine-learning-msc | title supervised-msc-thesis-on-graph-transfer
applications: title assistant-professor-ml | title postdoc-graph-learning
tasks: title review-2-papers-for-mlshift-workshop | title renew-compute-allocation | title update-the-lab-wiki-onboarding-page
code: title tensorkit-tensor-decomposition-toolkit | title example-hub | title bench-suite
statements: title short-bio-100-words | title data-availability-statement | title funding-acknowledgment-example-grant
```

Cases 2, 3 and 19, `node snap.ts <engine> <hub>` (builds the snapshot over a hub folder and prints the findings of the seven files), base engine, base files:

```
== case 2 (base engine, base files)
total findings 1, shown 0
== case 3 (base engine, ZonMw-AI-HCC key changed to FAIR)
funding/funding.yml [entries[6].key] two entries share the key FAIR
total findings 7, shown 1
== case 19 (base engine, key: FAIR line removed)
funding/funding.yml [entries[3]] funding entry Flanders AI Research Program (FAIR) is contributing and has no key
total findings 10, shown 1
```

Case 2 also showed the funding ids on the unchanged tree: eight entries are known by their titles, and `FAIR`, `FWO-PhD`, `ZonMw-AI-HCC` by their keys.

Case 4, a status write on a funding entry over a copy (`node write4.ts <engine> <hub> <id> awarded`), base engine, with `diff` against the file before:

```
== case 4 (base engine)
[{"key":"Flanders AI Research Program (FAIR)","field":"status","before":"contributing","after":"awarded"}] found true refused []
line counts 159 159
68: -    status: contributing
68: +    status: awarded
[{"key":"NWO Veni - The Self-Explaining Hospital","field":"status","before":"submitted","after":"awarded"}] found true refused []
line counts 159 159
24: -    status: submitted
24: +    status: awarded
24c24
<     status: submitted
---
>     status: awarded
68c68
<     status: contributing
---
>     status: awarded
```

Case 5, the stub Add renders (`node stub5.ts <engine> <file> <collection>`), base engine, funding, tasks, events:

```
caret line 160 column 13; text grew by 35 chars

  - title: ""
caret line 36 column 13; text grew by 32 chars

  - title: ""
caret line 111 column 13; text grew by 67 chars

  - title: ""
```

Cases 6, 7, 8, 10, 15 (a scratch vitest run, `D52_ENGINE=<base copy> D52_HUB=<hub of the base files plus the project manifests> npx vitest run -c <scratch config> first.scratch`):

```
case 6: FAIR card id="FAIR" lists 8 projects: work:bttn-incident-af,dongho-ecg-clustering,dries-bttr-ecg ; published:editorial-bigdata-ai-ms,fbttr-strategies,fermat,pfl-ms-npj ; ideas:ecg-af-fair
case 6: projects whose manifest says funding FAIR: 8 ids bttn-incident-af,dongho-ecg-clustering,dries-bttr-ecg,ecg-af-fair,editorial-bigdata-ai-ms,fbttr-strategies,fermat,pfl-ms-npj
case 6: every FAIR project is listed on the card: true
case 7/8: applications 2025-twente-cancer-ai -> hubPathsOf ["applications/archive/accepted/2025-twente-cancer-ai"] title is a button: no (EntryCard passes no ontitle)
case 7/8: funding nwo-veni (link a file) -> hubPathsOf ["funding/2026-nwo-veni-self-explaining-hospital/CALL-REQUIREMENTS.md"] title is a button: no (EntryCard passes no ontitle)
case 7/8: events aaai-2027 (no link) -> hubPathsOf [] title is a button: no (EntryCard passes no ontitle)
case 7/8: link "missing/nowhere" -> hubPathsOf ["missing/nowhere"]
case 7/8: link "../outside/folder" -> hubPathsOf []
case 7/8: link "https://example.org/a" -> hubPathsOf []
case 7/8: link "example.org/a" -> hubPathsOf []
case 7/8: link "./applications/" -> hubPathsOf ["applications"]
case 7/8: link "/abs/path" -> hubPathsOf []
case 10: stateId same entry twice -> applications:a | applications:a equal=true
case 10: two entries differ=true; one key in two collections differ=true
case 15: ticker keys overdue,deadlines,followups,subtasks,tasks,venueLoad,snoozed,behind
case 15: funding line "NWO Open Competition - Domain Science XS (ENW-XS)" target {"kind":"funding","id":"NWO Open Competition - Domain Science XS (ENW-XS)"}
case 15: funding line "FWO Senior Postdoctoral Fellowship 2026" target {"kind":"funding","id":"FWO Senior Postdoctoral Fellowship 2026"}
case 15: lines for events/education/tasks: events="FLTA 2026" ; events="Research visit - Linköping (Sweden)" ; education="Thesis topic - Master of Statistics and Data Science" ; education="Thesis topic - Master Biostatistics" ; education="Thesis topic - Bachelor Informatics" ; tasks="Submission"
```

Case 17, a status write recorded and undone on the base engine over `$TMPDIR` copies (`undo.scratch`); the undo succeeds and changes the file (answer line cut at 200 characters):

```
record: {"key":"Flanders AI Research Program (FAIR)","field":"status","before":"contributing","after":"awarded","undo":"field"}
undo answer: {"found":true,"changed":["status"],"refused":[],"id":"FAIR","records":[{"file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d52-undo-N0BYjj/funding/funding.yml","key":"Flanders AI Re
file unchanged by the undo: false
```

Cases 9, 11, 12, 14, 18: nothing to run on the unchanged tree, which has no `entry` view (the base copy's `src/lib/views/boards` has no `entry`). Case 13 on the unchanged tree, read: `relistFiles` (`src/lib/state/sources/fs.svelte.ts:361`) is called for every folder of the plan built at `:348`, and `git.ts` adds the parent folder of every watcher event, a folder creation included, to the files channel, so the listing of a parent folder is marked again when a child folder appears. Case 16 is a test run (below).

### After the change

Case 1: the keys on the tree equal the rule's output for all 14 files (a Python read of the 14 files compared with `rule-hub.txt` and `rule-demo.txt`):

```
hub funding MATCH
hub events MATCH
hub education MATCH
hub applications MATCH
hub tasks MATCH
hub code MATCH
hub statements MATCH
demo funding MATCH
demo events MATCH
demo education MATCH
demo applications MATCH
demo tasks MATCH
demo code MATCH
demo statements MATCH
```

The same read asserts every key is non-empty text and unique in its file, 88 entries in the hub files and 18 in the demo files, and that each file's schema opens with `key`, `type: text`, `required: true`.

Cases 2, 3, 19 (same `snap.ts`, changed engine, over copies of the changed files):

```
case 2:   total findings 1, shown 0
          funding ids: 2024-fwo-postdoc-fbttr | 2025-fwo-postdoc-fermat | 2025-fwo-project-fl4phm | 2026-fwo-senior-transplant | FAIR | FWO-PhD | ZonMw-AI-HCC | erc-starting-grant-2027-submission | nwo-open-competition-domain-science-xs-enw-xs | nwo-veni-the-self-explaining-hospital | pioneers-in-healthcare-pihc-innovation-fund
case 3:   funding/funding.yml [entries[6].key] two entries share the key FAIR
          total findings 7, shown 1
case 19:  funding/funding.yml [entries[3]] entry has no string key
          funding/funding.yml [entries[3].key] key entries[3].key is required
          total findings 11, shown 2
```

Case 19 prints `entry_no_id` ("entry has no string key") and the schema's `required` finding, and neither `funding_no_identity` nor `funding_no_key`.

Case 4 after (changed engine, changed funding file, ids are now keys):

```
[{"key":"FAIR","field":"status","before":"contributing","after":"awarded"}] found true refused []
line counts 168 168
72: -    status: contributing
72: +    status: awarded
[{"key":"nwo-veni-the-self-explaining-hospital","field":"status","before":"submitted","after":"awarded"}] found true refused []
line counts 168 168
26: -    status: submitted
26: +    status: awarded
26c26
<     status: submitted
---
>     status: awarded
72c72
<     status: contributing
---
>     status: awarded
```

Case 5 after, funding, tasks, events: the stub starts with the key, caret inside it:

```
caret line 169 column 11; text grew by 47 chars

  - key: ""
caret line 40 column 11; text grew by 44 chars

  - key: ""
caret line 120 column 11; text grew by 79 chars

  - key: ""
```

Cases 6, 7, 8, 10, 12, 13, 15 after (`after.scratch.test.ts`, changed engine, the worktree hub; the page-side expressions are run as the same functions the card and the page call: `pageFolder`, `pageState`, `stateId`, and the `.md` filter of `Entry.svelte` over a listing):

```
case 6: FAIR card id="FAIR" lists 8 projects; manifests naming FAIR 8; all listed true
case 7: applications 2025-twente-cancer-ai key=2025-twente-cancer-ai hubPathsOf=["applications/archive/accepted/2025-twente-cancer-ai"] pageFolder="applications/archive/accepted/2025-twente-cancer-ai"
case 7: funding nwo-veni (link a file) key=nwo-veni-the-self-explaining-hospital hubPathsOf=["funding/2026-nwo-veni-self-explaining-hospital/CALL-REQUIREMENTS.md"] pageFolder=undefined
case 7: events aaai-2027 (no link) key=aaai-2027 hubPathsOf=[] pageFolder=undefined
case 7: education bioinformatics key=bioinformatics hubPathsOf=["education/courses/bioinformatics"] pageFolder="education/courses/bioinformatics"
case 7: link "missing/nowhere" pageFolder=undefined
case 7: link "../outside/folder" pageFolder=undefined
case 7: link "https://example.org/a" pageFolder=undefined
case 7: link "/abs/path" pageFolder=undefined
case 7: link "applications/archive/accepted/2025-twente-cancer-ai/" pageFolder="applications/archive/accepted/2025-twente-cancer-ai"
case 10: pageState={"id":"applications:2025-twente-cancer-ai","collection":"applications","key":"2025-twente-cancer-ai","label":"Twente, Cancer AI"}
case 10: same entry twice equal=true; two entries differ=true; one key in two collections differ=true
case 13: before pageFolder=undefined
case 13: after pageFolder="applications/zz-new-entry-folder"
case 12: no md -> []; empty -> []; two md -> ["b.md","a.MD"]
case 15: funding line "NWO Open Competition - Domain Science XS (ENW-XS)" target {"kind":"funding","id":"nwo-open-competition-domain-science-xs-enw-xs"}
case 15: funding line "FWO Senior Postdoctoral Fellowship 2026" target {"kind":"funding","id":"2026-fwo-senior-transplant"}
case 15: entry targets events="flta-2026" ; events="research-visit-linkoping-sweden" ; education="thesis-topic-master-of-statistics-and-data-science" ; education="thesis-topic-master-biostatistics" ; education="thesis-topic-bachelor-informatics" ; tasks="submission"
```

Case 17 after: the record is the one the unchanged tree makes (key is the title), undone on the changed engine over the changed funding file; refused with `gone`, file byte for byte as it was:

```
record: {"key":"Flanders AI Research Program (FAIR)","field":"status","before":"contributing","after":"awarded","undo":"field"}
undo answer: {"error":"gone"}
file unchanged by the undo: true
```

The record for this run was made by the changed engine over a copy of the unchanged funding file, where the first schema field is `title`, so the record is the same as the one the unchanged tree writes (case 17 first run above).

Reading, for the cases a run cannot show:

- Case 7, the title as a button: `EntryCard.svelte` passes `ontitle={hasPage ? onpage : undefined}` to `Card`, with `hasPage = pageFolder(entry.fields, listed) !== undefined`; the output above gives a folder for `2025-twente-cancer-ai` and for `bioinformatics`, and none for the file link, the missing folder, `../outside/folder`, the address and the absolute path. `Collection.svelte` passes `onpage={() => openView('entry', pageState(key, entry))}` (line 315).
- Case 8, Show in Files: `EntryCard.svelte` builds one control per hub path of `link`, `url` or `folder`, calling `showFolderInFiles(path)` when `isFolderPath(path, listed)` and `showInFiles(path)` otherwise; the folder control's tooltip is `folder_files.show_in_files_tip`.
- Case 9, the page for `education` `bioinformatics`: `Entry.svelte:173-181` draws `EntryCard` with `cursor={false}` and without `ondragfrom`, `ondropon`, `onmore` and `onpage`, so there is no grip and the long fields are drawn whole; `:202-213` draws the Documents `Segment` and `Markdown`; `:217` draws `FolderFiles`, whose head carries Show in Files (`showFolderInFiles(folder)`); `:221-227` draws the sessions from `sessionsForProject(absoluteOf(root, folder))`.
- Case 11, a key the file no longer holds: `Entry.svelte:168` (`entry.unknown`); a link that became a file: `:190` (`entry.no_folder`) under the card.
- Case 12, no `.md`: `Entry.svelte:198` (`entry.no_documents`); an empty folder: `FolderFiles.svelte:70` (`folder_files.empty`).
- Case 14: the disabled controls come from `blockedBy(file, unsavedFile(...), fault)` at `EntryCard.svelte:152`, the code the collection view runs, with the same `file` prop (`viewSourceFile('collection', configMap(), collection)`).
- Case 16: `tests/checks/tree/boundaries.test.ts` passes (below); `Entry.svelte` imports no file of `views/boards/collection/`, `project/` or `person/`.
- Case 18: `Entry.svelte:165-166` (`entry.none`).

## DONE / NOT DONE

| Check | State | Output as printed |
|---|---|---|
| 1. `npm run diagrams && npm run test:quick` | DONE | `test:quick: 47 changed file(s), from git since HEAD`; `test:quick: 78 test file(s), 10 essential`; `ok      ASCII gate (0.7 s)`; `ok      prettier (0.8 s): All matched files use Prettier code style!`; `ok      eslint (33.5 s)`; `ok      svelte-check (33.1 s): 1791555369054 COMPLETED 445 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `ok      vitest (48.3 s): Duration  44.35s (transform 55.68s, setup 0ms, import 114.52s, tests 54.19s, environment 287ms)`; `test:quick: 49.3 s (limit 45.0 s); every command passed`; `test:quick: over the time limit` |
| 2. the 12-file set | DONE | ` Test Files  12 passed (12)` and `      Tests  171 passed (171)` (run with `--testTimeout 0 --hookTimeout 0`, the flags of `npm run test:checks`) |
| 2. `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` | DONE | ` Test Files  17 passed (17)` and `      Tests  248 passed (248)` |
| 3. scratch runs on the unchanged tree and after | DONE | above; `find` for files newer than the base copy lists only the files of "The files" and the regenerated diagrams; no scratch file or link is in the worktree |
| 4. changed tests on the unchanged tree and after | DONE | three test files changed: `tests/checks/config/config-folder.test.ts` (two names added to `CATALOG_FILES`), `tests/checks/tree/allow-styling.ts` and `tests/checks/tree/allow-duplication.txt`. Run in a copy of the base tree with the three changed files copied in: ` Test Files  3 failed (3)` and `      Tests  5 failed \| 48 passed \| 1 skipped (54)`; the failures are 'reads one catalog file per owner and no legacy catalog file', 'lets no view or shell component style a primitive own class', 'holds the styling lists to rules the tree still has', 'is not held anywhere under src/lib' and 'holds the lists to clones that are still shared, so a repaired copy takes its entry with it'. After the change the same files pass (inside the 12-file run and the `tests/checks` run) |
| 5. YAML parse of the 14 files | DONE | `yaml ok 14`, exit 0 |
| 5. ASCII gate (the `perl` form of `agents/spec.md`) | DONE | prints nothing over `src tests config` (the form's `bin` folder does not exist in this tree, so `find` names it and the gate was run on the three folders that exist), exit 0 |
| 5. non-ASCII in added lines of the 14 files | DONE, two lines named | `HUB network/events.yml: >     title: "Research visit - Linköping (Sweden)"` and `HUB applications/applications.yml: >     title: "Umeå, Precision ZAP"`. They are the existing title lines re-indented under the new `key` line (`  - title:` became `    title:`), so `diff` shows them as added; the accented letters are in real names and are the bytes the file held before |
| 6. prose read against `agents/spec.md` | DONE | added comments, text and docs sentences use plain prose, no dashes, one line per paragraph; `grep -i` over the added lines for history words (previously, formerly, used to, no longer, earlier, reverted, original, legacy, the step) prints only the `entry.yml` sentences `none` and `doc_failed`, which are not history |
| 7. `sh utils/folder-check.sh` | DONE | exit 0 |
| 7. `sh utils/unused-exports.sh` | DONE | 364 lines; `diff` against `D52-base/tools/oculus/unused-exports.txt` prints nothing; the step added no line |
| 7. `wc -l` of every changed file | DONE | below |
| `npm run diagrams` | DONE | the regenerated `docs/diagrams/channels`, `layer-views` and `layers` (`.dot` and `.svg`) differ from the base; the others are regenerated and equal |
| svelte-check, eslint over `src/lib/views src/lib/state/boards src/lib/data src/lib/server/files` | DONE | `COMPLETED 3566 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; eslint exit 0 |

NOT DONE: nothing from "What to build" 1 to 9. Not run: the page in a browser or as a mounted component (left to the landing look on TEST, as the brief says).

## The terms

No glossary: `ls tools/oculus/docs` has no `glossary.md`.

## The files, with line counts (`wc -l`)

Code and docs:

```
  118 src/lib/data/helpers/hub-names.ts
  809 src/lib/data/snapshot/normalise.ts
  406 src/lib/data/snapshot/validate.ts
  623 src/lib/server/content/docs.ts
  149 src/lib/server/files/fs/collections.ts
  781 src/lib/state/boards/collection.ts
  317 src/lib/state/system/docs.svelte.ts
  408 src/lib/views/boards/collection/Collection.svelte
  265 src/lib/views/boards/entry/Entry.svelte            (new)
  276 src/lib/views/boards/person/Person.svelte
  221 src/lib/views/boards/project/Project.svelte
  295 src/lib/views/shared/forms/Subtasks.svelte
   86 src/lib/views/shared/forms/entry/entry-actions.ts   (moved)
  486 src/lib/views/shared/forms/entry/EntryCard.svelte   (moved)
   80 src/lib/views/shared/forms/entry/EntryLink.svelte   (new)
   38 src/lib/views/shared/forms/entry/Grip.svelte        (moved)
   39 src/lib/views/shared/forms/entry/task-card.ts       (moved)
  135 src/lib/views/shared/links/FolderFiles.svelte       (new)
   89 src/lib/views/shared/sessions/SessionRow.svelte     (new)
  236 config/text/findings.yml
   23 config/text/views/boards/entry.yml                  (new)
   27 config/text/views/boards/person.yml
   10 config/text/views/shared/folder-files.yml           (new)
  631 tests/checks/config/config-folder.test.ts
   33 tests/checks/tree/allow-duplication.txt
  103 tests/checks/tree/allow-styling.ts
  283 docs/views.md
   82 docs/window.md
  150 docs/files-and-search.md
  188 HELP.md
  519 docs/DATA-MAP.md   (hub docs folder)
```

Data files (hub): `funding/funding.yml` 167, `network/events.yml` 118, `education/education.yml` 266, `applications/applications.yml` 437, `tasks/tasks.yml` 39, `registries/repos.yml` 226, `registries/boilerplate.yml` 31. Demo: `tools/oculus/demo/funding/funding.yml` 34, `events.yml` 45, `education/education.yml` 20, `applications/applications.yml` 21, `tasks/tasks.yml` 34, `registries/repos.yml` 52, `registries/boilerplate.yml` 31. Also changed: the `.dot` and `.svg` files under `tools/oculus/docs/diagrams/` listed above. The old copies `src/lib/views/boards/collection/EntryCard.svelte`, `Grip.svelte`, `entry-actions.ts` and `task-card.ts` no longer exist (moved).

## "What is on the tree": still true or rewritten

- The survey of the collection files: rewritten. All seven files carry a key on every entry (88 in the hub, 18 in the demo hub) and each file's schema opens with `{ field: key, type: text, required: true, help: ... }`.
- The identity paragraph (`identityField`, `identityFieldOf`, `identityFindings`, an entry's `id`): still true; the comments naming it are rewritten (`state/boards/collection.ts` `identityValue`, `server/files/fs/collections.ts` head comment and `identityOf`, the `validate.ts` comments), and `identityFindings` no longer takes an `exempt` argument.
- The manifests name funding by key with `idRequired: false`: rewritten. `idRequired` is true for funding (`data/helpers/hub-names.ts`) and the head comment of `REGISTRY_SHAPES` is rewritten.
- `docs/DATA-MAP.md:156-177`, `:193-194`, `:284`, `:352`: rewritten (identity column `key` for the seven files, `identityField`'s two true places, funding writes and links by `key`, every funding entry carries one, `key` required by the schema).
- Funding's identity in code: rewritten. `checkFundingIdentity`, `funding_no_identity`, `funding_no_key`, the keyless branch of `checkEntryIdentity` and the two sentences of `findings.yml` are removed; `checkFundingStatements` keeps its `funding_no_statement` rule; the comments at `normalise.ts` (funding) and `collections.ts` are rewritten.
- `funding/funding.yml:18` and the demo's `:13` declaring `key` after `title`: rewritten. The row is first and required in both, with its help text kept.
- Four live entries link a file inside a folder: still true (case 7 shows the Veni link is a file).
- The entry writes and their test, and the undo finding the entry by the value the record holds: still true; records made before the change name the title, and the undo refuses them with `gone` for entries whose id is now the key (case 17).
- `task-card.ts` handed to `EntryCard` as `extra`; the project page's session row local to `Project.svelte`; the person page's folder block local to `Person.svelte`: rewritten. `task-card.ts` moved with the card; the session row is `views/shared/sessions/SessionRow.svelte` and the folder block is `views/shared/links/FolderFiles.svelte`. `Project.svelte` is 221 lines (285 at the base) and `Person.svelte` 276 (346).
- `docs/files-and-search.md:39`, `docs.svelte.ts:193`, `docs.ts:451-456`: rewritten.
- The collection view's instance state keeps entry ids in `more` and `reveal`: still true; for the six files without keys the stored ids were titles, so a remembered `more` stored before the change no longer matches (visible change below).
- The demo hub holds the seven files with no links: still true.
- `EntryCard.svelte` (506 lines), `entry-actions.ts`, `Grip.svelte`: rewritten; they live under `views/shared/forms/entry/`, `EntryCard.svelte` is 486 lines, and the link block is the new `EntryLink.svelte`.
- `ProjectCard.svelte:163-170` and its title opening the project page: still true, unchanged.
- The project page (285 lines) and the person page (346 lines): rewritten (above).
- `docs.hubDocument` and `renderHubDoc`: still true, with their comments extended to name the entry page.
- The file store's `listing` and `relistFiles`: still true.
- The view glob and `stateId`: still true.
- The boundary paragraph (`EntryCard.svelte`, `entry-actions.ts`, `Grip.svelte` imported only inside `views/boards/collection/`; `allow-styling.ts:24-41`; `allow-duplication.txt:20`): rewritten. They are imported from `views/shared/forms/entry/` and the entries of both lists name the new path.
- The docs paragraph (`docs/views.md:95-118`, `:249-253`, `:255-257`; `HELP.md:156`; `docs/window.md:41`): rewritten.
- Folder sizes: rewritten. After the change `ls | wc -l` gives `views/boards` 9, `views/shared/forms` 10, `views/shared/links` 9, `views/shared/sessions` 7, `config/text/views/boards` 9, `config/text/views/shared` 3.
- Each collection file's head comment: rewritten, one sentence added after the leading block in each of the 14 files (the funding file's says a new entry needs a `key` and a manifest's `funding:` tag names it).

## Judgment calls

- The three keys that already existed (`FAIR`, `ZonMw-AI-HCC`, `FWO-PhD`) stay on the lines they were on, after the fields above them, with their trailing comments; the other 85 keys are the first line of their entry. Moving the three would rewrite their entries and their comments.
- The 85 key lines, the schema rows and the head-comment sentences were applied to the 14 files by a scratch script outside the tree, and the result was compared with the rule's output (case 1 after).
- Help text of the new key rows: "The <noun>'s short name, unique in this file; a write and Edit in File address the entry by it." for the six files; funding keeps its existing help text on the moved row.
- Head-comment sentence: "Each entry has a `key`, its short name, unique in this file; a write and Edit in File address the entry by it." in six files, and in funding "Each entry has a `key`, unique in this file, which a new entry needs; a manifest's `funding:` tag names it."
- The page's view label is "Entry", its glyph `cards` (a key of `config/catalogs/glyphs.yml`), the empty-state glyph `folder`.
- The page's toolbar button is "Show in <collection title>" and opens the collection view with `reveal` set to the entry, the state key the collection view already reads.
- The page draws Start Agent through `taskCardActions`, so the card is the collection view's card; no `tasks` entry has a `link`, so it is not reachable today.
- Binary files in the Files block are rows like any other, as on the person page; the row opens the source tab, which says what it is.
- `FolderFiles.svelte` carries the person page's folder block text under the new group `folder_files` in `config/text/views/shared/folder-files.yml`; the person page keeps `person.folder` for its heading.
- The five `allow-styling.ts` reasons and the `Collection.svelte` one quote the selector line as it is now (`EntryCard.svelte:406`, `:413`, `:417`; `Collection.svelte:405`).
- The `allow-duplication.txt` entry for the 10-line `said` block is now `src/lib/views/boards/focus/lanes/Lanes.svelte src/lib/views/shared/forms/entry/EntryCard.svelte f494adcc1949 the same 10 lines at 130 and 218, to fold into one place`; the hash and the lines differ from the base entry because the lines before the block in `EntryCard.svelte` differ after the move. It is the same function body and the list is not widened.
- `config-folder.test.ts` lists the two new catalog files, `views/boards/entry.yml` and `views/shared/folder-files.yml`.
- The tree and config checks were run with `--testTimeout 0 --hookTimeout 0`, which is what `npm run test:checks` runs. In an earlier `test:quick` run `tests/server/machine/apps/manifest.test.ts` timed out at 5000 ms under load; alone it passes (`Tests  65 passed (65)`), and the final `test:quick` passed every file.
- One read-only `git status --short` was run once in a pipeline by mistake; it changed nothing.

## Visible changes, before and after

- A card of `funding`, `events`, `education`, `applications`, `tasks`, `code` and `statements` draws a `key` row. Before: no such row (joint-work already draws its own).
- A card whose `link` names an existing folder of the hub has a title that is a button and opens the entry page. Before: a plain title.
- Show in Files on such a card opens a Files tab rooted at the folder. Before: the Files tab selected the folder. On a file link it is unchanged.
- The person page's Show in Files tooltip reads "Open {0} in a Files tab of its own". Before: "Select {0} in the Files view".
- Snapshot ids of the eight funding entries that had no key are now their keys. Before: their titles. The Focus ticker's funding targets, the History records of new writes and the collection view's remembered `more` and `reveal` ids follow; entries of the other files drawn on Focus are addressed by their keys (case 15 after).
- The undo of a status write made before the change on one of those funding entries (the record names the title) is refused with `gone` and writes nothing (case 17). A record whose title equals the new key (for example the `code` entry `research-hub`) still undoes.
- A funding entry with no key: `entry has no string key` and `key entries[3].key is required` (case 19). Before: `funding entry ... is contributing and has no key` for an awarded or contributing entry, and `funding_no_identity` otherwise.
- Add on the seven files starts the new entry with `- key: ""` and the caret inside it (column 11). Before: `- title: ""` (column 13).
- `docs/views.md`, `HELP.md`, `docs/window.md`, `docs/files-and-search.md`, `docs/DATA-MAP.md` and the diagrams under `docs/diagrams/` are updated as above.

## Anything in the brief that was wrong or impossible

- The line numbers the brief quotes for the `allow-styling.ts` reasons (411, 418, 422) were not the selector lines of the base `EntryCard.svelte` (422, 429, 433), so those reasons were already off by 11 lines; they now quote the real lines.
- The count in "Views opened for something" and in `HELP.md:156` names a subset: the registry holds 18 files with `listed: false` (`grep -rl "listed: false" src/lib/views`, including the new `Entry.svelte`), while the sentence in `docs/views.md` enumerates eight and the paragraphs after it name six more; `Diff`, `Merge`, `Output` and `MarkdownPreview` are named in neither. I set both counts to eight, the number the sentence enumerates, and did not rewrite the rest.
- Cases 12 and 13 cannot be run against the component without a mounted page; their pure parts are run above and the rest is read.
- The brief's step 5 `perl` form names a `bin` folder that does not exist in this tree.
