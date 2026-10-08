D39 BUILDER REPORT (worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/D39, product code in tools/oculus)

## 1. NOT done

Everything in the brief is done. Four things the orchestrator needs to know before landing:

- `checks.sh` printed `test:quick: 51.6 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`, and exited 0. The step changed 96 files, so the selection is 125 test files. I did not touch the limit.
- The cases only a page shows were checked by reading the code and by node and vitest runs, not by looking at a page. The look is named in section 7 for landing (cases 1-9, 13, 14, 21, 23, 25, 29, 32, 33, 35, 36).
- Monaco does not draw VS Code's hint line "Enter to Rename, Cmd+Enter to Preview" in the rename box. `rename.js:218` draws it only when `this._bulkEditService.hasPreviewHandler()` is true, and `standaloneServices.js:518` returns false. Drawing it needs a service override of Monaco's, which the brief left to a look and a report. I did not build one. The key is bound (`client.ts:311-322`) and named in HELP.md:81 and docs/files-and-search.md:93. This is the ruling O1 anticipated; no further decision is needed unless Axel wants the hint line.
- The G64 row added to `relation-shapes.test.ts` passes on the unchanged tree. The brief states that a one-text `waiting-on` still gives one finding after the move to `from`, so this row guards that the finding survives. Its fixture makes the schema's `from` check the list `[ada, alpha]` and finds no finding for beta. It has no failing line on the unchanged tree.

## 2. Open items, verbatim from `tools/oculus/.scratch/migration/orchestrator-state.md` ("Open items", read in this turn in both the main tree and the worktree)

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

"None."

## 3. First run of the cases on the unchanged tree

The unchanged tree is a copy at `scratchpad/d39/run/tools/oculus`. The scratchpad is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d39`, called `$S` below. The copy's `node_modules` was a clone while the probe ran, because node's permission model refuses a symlinked folder. I re-ran the first run in this turn (`$S/firstrun-base.mjs`, `$S/t0-base.mjs`, outputs `$S/firstrun-base-out.txt` and `$S/t0-base-out.txt`).

- **Initialize capabilities.** `definitionProvider` is present. `referencesProvider` and `renameProvider` are absent. `grep -c` over `t0-base-out.txt` for those two words prints 0.
- **Cases 1-9, 9a, 9b, 9c, 12 and 14.**
  - These ran at 14 hub-key positions, with the file and line of each printed in `firstrun-base-out.txt`.
  - `grep -c "definition: 'null'"`, `grep -c "Unhandled method textDocument/references"` and `grep -c "prepareRename: 'null'"` each print 14, over 14 `^case` lines.
  - `textDocument/rename` at `registries/venues.yml:278` (`id: media`) gives `result: null`.
  - The brief predicted exactly this.
  - The first-run labels "9a/9b/9c" in my probe are behavior.yml:26 `heart`, behavior.yml:76 `utwente` and funding.yml:66. In the brief they are case 9 (two lines) and case 9a funding.
- **Cases that cannot run without the new code.** Each is absent on the unchanged tree.
  - Cases 10, 11, 13, 15-20 and 21-29, plus 38-47, need the index or the rename. The unchanged tree has no `src/lib/data/snapshot/references` folder (`ls` fails).
  - Cases 34-37 need the view and the keys. `grep -rn "refactor-preview\|refactor_preview\|hub-key\|rename_preview\|bad_map\|lsp_edit_refused" src config` over the unchanged tree prints 0 lines.
  - Cases 31-33 need the store.
  - Cases 2-8 above show that each hub-key request gets no answer.
- **Tests on the unchanged tree.** I ran the final test files against the unchanged tree in `$S/firstrun-final.txt`. Failing lines are quoted in section 5.
- **Rules the brief got wrong.** None found. I re-ran every case in this turn on the final tree and none contradicted the brief's rule. Two readings:
  - **Case 6b.** `maps_to` is a reference in the scan (561 scanned in the radar) but a link only when its value names a project (506 resolve, 55 do not). `radar.mjs` prints `{ project: 376, maps: 185, mapsResolved: 130, mapsUnresolved: 55 }`. This matches the brief's "maps_to only where the value names a project".
  - **Case 9b.** `c9b.mjs` lists `engine/sources.yml:17`, `engine/layout.yml:134` and `engine/catalogs/vocab.yml:67` under Find References on `manuscript`.

Case results on the final tree, re-run in this turn (`$S/allcases-rerun.txt`, `$S/allcases-rerun2.txt`, `$S/case30-final.txt`, `$S/transport-final.txt`):

- **1-8.**
  - Definition goes to the right file and range, for example `venue_id: media` to `hub/registries/venues.yml:279:8-13`, `pillar` to `pillars.yml:36:10-16`, `related: hccnet-fl` to the project's `id:` line 1:4-13, `person: "amir-haeri"` to `people.yml:19:10-20`, `affiliations` to `organisations.yml:14:10-30`, and the deck slide `hccnet-revision` to its manifest 1:4-19.
  - `waiting-on: [amir-haeri, btfno]` opens `people.yml:19:10-20` for the person and `btfno/project.yml:1:4-9` for the project.
  - Case 6b `maps_to: new-idea-candidate` is `null (forwarded)`.
- **9, 9a.**
  - `heart` opens `domains.yml:13:10-15` and `utwente` opens `resources.yml:14:10-17`.
  - `compute` opens `resources.yml:21:10-18`, `datasets` opens `data.yml:548:9-16`, and `funding: [FAIR]` opens `funding.yml:66:9-13`.
- **10.**
  - Find References on `heart` finds 10 places in 10 files, 11 with the declaration.
  - It includes behavior.yml:26 and the vocab.yml map key line 52.
- **11.** `type: manuscript` opens `engine/catalogs/vocab.yml:70:21-31`. `focus: holding` is `null (forwarded)`.
- **12.** `title` gets the forwarded answer.
- **13.** `media`: 2 places in 2 files from the definition and from a reference, same rows.
- **14.** Cmd+click on the identity scalar returns the definition at the same place (`pillars.yml:36:10-16`). The Peek is the look.
- **17.** `FAIR`: 9 places with the declaration; the comment in funding.yml:66 is not listed.
- **18.**
  - `18a` nothing open: 10 places; vocab.yml entry `engine/catalogs/vocab.yml:52:2-7`.
  - `18b` the file open under the hub root as `tools/oculus/config/catalogs/vocab.yml` with the heart line removed: 9 places and no vocab.yml entry.
  - `18c` the same file also open under the engine root, text unchanged: 9 places and no vocab.yml entry.
  - The overlay is by real path, listed once.
  - With the engine root served from a worktree config folder, G28 rows in `hub-names.test.ts` and case 46 below show the two names are two files.
- **19.** A repository's `.oculus/settings.yml` (another root) gives definition `null`, references `[]` and prepareRename `null`. The index never reads `config/local.yml`, `secrets/` or `~/.oculus` (specs in `build.ts` head, lines 9-11).
- **20.**
  - Settings requests after the server is up: 0.
  - Two builds with one schema set: difference 0.
  - The index follows (definition of `media` becomes `null` after the build that drops it and returns after the build that restores it).
  - A build that changes the schema set gives 1 settings request.
- **21.** F2 on `media`, new key `media-x`: 3 files, 3 edits, annotation `{"hub-key":{"label":"media","description":"media-x","needsConfirmation":true}}`, versions `1` and `null`.
- **22.** Quoting on real lines, each parsed again with `yaml` ("this file parses again: true, other lines unchanged: true"):
  - `collaborators: [guichelaar, amir-haeri, van-den-berg]` to `amir-haeri-mc`.
  - `person: "amir-haeri"` to `"amir-haeri-mc"`.
  - `affiliations: ["university-of-twente"]` to `["utwente"]`.
  - `key: FAIR                 # manifests ...` to `key: FAIR-NL                 # manifests ...`.
  - The vocab.yml `heart:` map key line to `cardio:`.
  - `tensor` renamed to `a, b` is refused as `readback` (file `projects/active/novel-math-primitives/project.yml`).
  - `123`, `null`, `x: y` and `#x` are written `"123"`, `"null"`, `"x: y"`, `"#x"` and read back.
  - The same lines are rows of G67.
- **23.**
  - Empty key and spaces: "A key cannot be renamed to nothing, so nothing was renamed."
  - `sciml` exists: "sciml is already a key of pillars, so nothing was renamed."
  - Person to project id `btfno`: "btfno is already a key of projects, ..."
  - F2 on a project id: the folder-name sentence.
  - F2 on the vocabulary value `manuscript`: the vocabulary sentence.
  - All carry error code -32803.
  - The others (unsaved text that does not parse, two sources, twice, over 5 MB, unread, `a, b`) are G67 rows.
- **24.** Organisation `university-of-twente` renamed to a resources key is allowed and returns a `documentChanges` edit.
- **25.**
  - prepareRename on an anchor `&t` returns the range. The rename on the anchor returns the YAML server's `changes` (2 edits).
  - On the value `Hello` it returns undefined, and F2 on `title` gives `null`.
  - The transport rejects a null answer with "The element can't be renamed." (`transport-final.txt`: `25 null prepareRename -> rejected with "The element can't be renamed."`).
- **26.**
  - A tab with unsaved text: `{"applied":true}`, tab edited to `"venue_id: new\nnote: typed but not saved\n"`, posts 0.
  - A file open in a tab of another page: `{"applied":false,"notice":"lsp_edit_elsewhere","words":["hub/m.yml"]}`.
  - The file open in a tab of this page under the other root is case 46.
- **27.**
  - A file changed on disk after the preview opened: Apply posts one write with the old hash. The server refuses it; the store's failed line is `lsp_edit_changed hub/m.yml`.
  - The file on disk is `"key: old\nother: 2\n"` (unchanged), and the preview stays pending.
  - The refusal comes from the server's hash check of `lsp-edit`, so one post is sent and refused.
  - A file whose bytes moved between the answer and the plan is case 30c.
- **28.** G68 'writes nothing on Apply when a planned tab was typed into after the preview opened' (`failed()` is `lsp_edit_changed hub/open.yml`, no post, no tab edit).
- **29.** Pillar `tensor`: 48 files and 48 edits (47 references plus 1 definition), each file's edit count equals its mentions.
- **30.** Rows of `lsp-edit.test.ts`.
- **30a.** Rows of `lsp-edit.test.ts` and `edits.test.ts`.
- **30b.** Rename over a closed 3,156,890-byte file:
  - Submit gives `{"applied":true}` with 1 read and 0 writes before Apply, 1 file and 3 edits in the preview.
  - After Apply there is 1 write, still 1 read, and the three edited lines changed.
  - The history copy kept is kind `lsp-edit`.
- **30c.** A closed file written after the last build: `{"applied":false,"notice":"lsp_edit_changed","words":["hub/moved.yml"]}`, 0 writes, file unchanged (`"key: other\n"`).
- **31-33.** G68 rows.
- **34-36.** Readings, see section 7.
- **35.** Transport run:
  - A rename without the mark gives applyEdit preview flag `[false]`.
  - With the mark it gives `[true]`.
  - A mark followed by a prepareRename and a rename gives `[false]` (the prepareRename starts a fresh box).
- **38-41, 43.** G66 rows (BOM, CRLF and astral position, anchor and alias, two documents, picked `from`, portfolio deck).
- **42.**
  - Definition from the address `x:project.yml` goes to `hub/registries/pillars.yml:36:10-16`.
  - References are 47 places, named under `x/project.yml:8:9-15`; the `hub/projects/manuscripts/btfno/project.yml` entry count is 0 because the file is open under the other address.
- **44.**
  - yaml-language-server failed twice (server spawn attempts: 2).
  - Definition (`venues.yml:279:8-13`), references (3 places), prepareRename (`"media"`) and rename (3 files) still answer.
  - A forwarded hover gets `{"code":-32800,"message":"the server ended"}`.
- **45.** `documentChanges` versions are `1` for the open document and `null` for the closed files (`versions seen: null,1`).
- **46.** Two tabs of one file:
  - With the engine root as the hub's own config folder, tabs edited `["t1","t2"]`, posts 0.
  - With a worktree config folder, tabs edited `["t1"]`, posts 0.
  - Both give outcome `{"applied":true}`. Also the held-unsaved rows of G28.
- **47.** Counts of references scanned (second column: those that name a defined key) in `$S/allcases-final.txt`:
  - The brief's counts match: venue_id 53, domain 94, pillar 122, funding 22, collaborators 57, related 70, datasets 58, compute 17, waiting-on 2 (people+projects), affiliations 20, person 13, events 6, education 10, applications 7, repos 5, radar 561 scanned (506 resolve, 376 `project` plus 130 `maps_to`), deck slides 22, `data_domains` 7, `slurm.resource` 1, vocab.yml `domains:` keys 12.
  - Vocabulary rows where fewer resolve than are scanned: `focus_lanes` 55 scanned and 35 resolve (20 are `holding`, an options word), and `type_color` in sources.yml 5 and 4.
  - Definitions: venues 71, datasets 54, pillars 9, domains 12, funding 3, people 19, organisations 8, resources 2 plus 1 cluster, projects 94; 145 files, `unparsed []`.
- **48.** The G28 rows in `hub-names.test.ts` (11 rows) and `held-unsaved.test.ts` (3 tests) pass on the final tree. Run through the client state, the rail reorder over a layout file a tab holds unsaved text of, in `held-unsaved.test.ts`:
  - **Engine root served from a worktree config folder.** The write is sent (`sends the write when the engine root is served from a worktree config folder`).
  - **Engine root is the hub's own config folder.** It is refused with `app.file_unsaved` and posts nothing (`refuses the write and posts nothing when the engine root is the hub own config folder`).

## 4. DONE / NOT DONE (check outputs as printed, in this turn)

All ran from `tools/oculus` of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Brief item | Done | Command and output |
|---|---|---|
| 1 Reference index | DONE | `src/lib/data/snapshot/references/{model,specs,scan,build,lookup,rename}.ts`, catalog specs `catalog/schemas/references.ts`; G66 table passes (below) |
| 2 Relay hook + capabilities | DONE | `adapters/yaml/hub-keys.ts`, `held/answers.ts`; case 44 and 20 runs above |
| 3 Rename and refusals | DONE | `references/rename.ts`; G67 table passes |
| 4 Page-side preview | DONE | `edits.ts` plan/commit, `refactor/{preview.svelte,rows}.ts`, `RefactorPreview.svelte`, `refactor-subject.ts`; G68 passes |
| 5 5 MB limit + private-folder refusal | DONE | `file-ops.ts` `WRITE_MAX_BYTES`, `lsp-edit.ts`, `history.ts`; lsp-edit.test.ts 11 passed |
| 6 Schema references | DONE | `manifest-schema.yml` `waiting-on` `from: [people, projects]`; `deck-schema.yml` groups `records` with `map: true`; relation-shapes 9 passed |
| 7 Whole-key selection | DONE | `transport/renames.ts` `placesOf`, `targeted`; transport run: `jumps: targeted -> [["inmemory://model/1",[{"address":...,"range":{"start":{"line":4,"character":8},"end":{"line":4,"character":13}}}]]]` |
| 8 Documents | DONE | section 8 |
| 9 Tests | DONE | section 5 |
| 10 `sameDiskFile`/`diskPath` | DONE | `hub-names.ts`; `grep -rn diskName src tests ../../docs` prints nothing |

Verify list:

1. `npm run diagrams` exit 0 (`$S/diagrams-final.txt`).
   - `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` exit 0. Printed lines:
     - `ok      ASCII gate (0.9 s)`
     - `ok      prettier (1.7 s): All matched files use Prettier code style!`
     - `ok      eslint (10.1 s)`
     - `ok      svelte-check (19.4 s): 1791494862315 COMPLETED 437 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
     - `ok      vitest (50.3 s): Duration  43.41s ...`
     - `test:quick: 51.6 s (limit 45.0 s); every command passed`
     - `test:quick: over the time limit`
     - `checks: 1 commands passed`
   - Number of full-list runs: 4 in this step; the last on the final tree is the one quoted. The count is the number of Bash commands that invoked `checks.sh` in my transcript.
   - `npm run test:checks` (G16-G27), exit 0: `Test Files  17 passed (17)`, `Tests  248 passed (248)`. Re-run after the last edit.
2. Scoped files, each `npx vitest run <file>` alone, in this turn:
   - references.test.ts 33 passed.
   - rename.test.ts 24 passed.
   - refactor-preview.test.ts 7 passed.
   - lsp-edit.test.ts 11 passed.
   - replace-undo.test.ts 2 passed.
   - lsp/edits.test.ts 8 passed.
   - relay.test.ts 5 passed.
   - lifetime.test.ts 26 passed.
   - versions.test.ts 2 passed.
   - servers.test.ts 6 passed.
   - uris.test.ts 29 passed.
   - library.test.ts 36 passed.
   - schema-rules.test.ts 7 passed.
   - relation-shapes.test.ts 9 passed.
   - config.test.ts 31 passed.
   - config-folder.test.ts 25 passed.
   - catalog/options.test.ts 3 passed.
   - integrity.test.ts 8 passed.
   - diff-read.test.ts 4 passed.
   - present.test.ts 4 passed.
   - hub-names.test.ts 11 passed.
   - held-unsaved.test.ts 3 passed.
   - sessions/source.test.ts 25 passed.
   - Output: `$S/scoped-final.txt`; no file missing.
3. ASCII gate: the `perl` command prints nothing, `ascii-gate exit=0`. The `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/*.md ../../docs/DATA-MAP.md` prints nothing, exit 1 (no hit).
4. `sh utils/folder-check.sh` exit 0.
   - `wc -l`: every changed source file is at or under 880 (largest `relay.ts` 879, `ops.ts` 857). Every Svelte component is at or under 520 (`Diff.svelte` 520, `RefactorPreview.svelte` 266).
   - `sh utils/unused-exports.sh` printed 364 lines; the base list is 364 lines; `diff` of the two prints nothing. No line was added.
5. `python3 -c "import yaml..."` over the 6 changed `.yml` files prints `yaml ok 6`, exit 0.
6. `grep -n "no formatting and no rename" docs/files-and-search.md` prints nothing (exit 1).
   - `grep -n "Audit, \`collections\`" ../../docs/DATA-MAP.md` prints only the `link` rows (lines 285, 291, 292, 293).
   - `grep -rn "no_waiting_on" src config tests docs` prints nothing (exit 1).
7. History-words grep over the added lines (`$S/added.txt`, 5069 lines) with the words of spec.md:42 (`before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds`, `after this package lands`): 40 hits, each judged as describing the order of operations in the running code (`before it writes anything`, `before a request reaches the YAML server`), a runtime state (`a preview that is no longer pending`, `a text the edit no longer fits`) or the position inside a text (`before the key`). None compares with an earlier state of the code or names a package, date or reverted attempt.
8. Cases: section 3. 9. Documents: read against the list-item and sentence-length rules in section 8; no departure found.

## 5. Files changed, tests, edits to existing assertions

Line counts, base to now (changed) or now (NEW):
- **config:**
  - deck-schema.yml 23 to 32
  - manifest-schema.yml 77 to 80
  - findings.yml 238 to 238
  - repositories.yml 290 to 291
  - search.yml 155 to 174
  - source.yml 134 to 147
- **docs:**
  - apps.md 861 to 861
  - files-and-search.md 109 to 121
  - views.md 279 to 283
  - DESIGN.md 579 to 586
  - HELP.md 188 to 188
  - ../../docs/DATA-MAP.md 517 to 518
  - diagrams: 12 files regenerated
- **data:**
  - file-ops.ts 361 to 367
  - private-folders.ts 23 to 25
  - collection-text.ts 435 to 455
  - hub-names.ts 76 to 117
  - index.ts 276 to 302
  - model/index.ts 644 to 649
  - model-collections.ts 160 to 162
  - text-edits.ts 203 to 228
  - schema/field.ts 80 to 81
  - schema/manifest.ts 89 to 103
  - schema/record.ts 278 to 307
  - schema/run.ts 182 to 207
  - validate.ts 459 to 441
  - schema-findings.ts 28 to 26
  - schemas/options.ts 244 to 244
  - references/build.ts NEW 205
  - references/lookup.ts NEW 160
  - references/model.ts NEW 95
  - references/rename.ts NEW 169
  - references/scan.ts NEW 287
  - references/specs.ts NEW 123
  - catalog/schemas/references.ts NEW 124
- **server:**
  - core/paths.ts 45 to 58
  - history.ts 372 to 380
  - lsp-edit.ts 143 to 150
  - ops.ts 849 to 857
  - hub-keys.ts NEW 237
  - machine-file.ts 39 to 39
  - held/answers.ts NEW 74
  - library/rules.ts 92 to 81
  - relay-options.ts 53 to 60
  - relay.ts 852 to 879
  - schema-feed.ts 34 to 47
  - servers.ts 741 to 791
  - uris.ts 333 to 333
  - root/context.ts 810 to 811
  - watch/portfolio.ts 681 to 684
- **state:**
  - client/context.ts 821 to 839
  - draft.ts 399 to 404
  - source.svelte.ts 742 to 742
  - fs-transport.ts 459 to 445
  - refactor-subject.ts NEW 28
  - repositories.ts 854 to 863
  - config-files.ts 56 to 69
  - lsp/edits.ts 286 to 428
  - lsp/references.ts 191 to 194
  - refactor/preview.svelte.ts NEW 222
  - refactor/rows.ts NEW 81
- **ui and views:**
  - client.ts 693 to 732
  - hosts.ts 215 to 242
  - services.ts 99 to 113
  - transport.ts 868 to 874
  - transport/addresses.ts NEW 74
  - transport/records.ts 47 to 52
  - transport/renames.ts NEW 88
  - source-file.ts 54 to 62
  - compare-words.ts 63 to 67
  - diff-read.ts 127 to 162
  - Diff.svelte 517 to 520
  - RefactorPreview.svelte NEW 266
  - References.svelte 490 to 493
  - lsp.ts 571 to 599
- **tests:**
  - hub-names.test.ts NEW 142
  - reference-hub.ts NEW 271
  - references.test.ts NEW 486
  - relation-shapes.test.ts 92 to 114
  - rename.test.ts NEW 372
  - lsp-edit.test.ts 183 to 258
  - held-unsaved.test.ts 70 to 124
  - source-server.ts 197 to 198
  - lsp/edits.test.ts 199 to 282
  - refactor-preview.test.ts NEW 222
  - diff-read.test.ts 42 to 55

Paths outside the brief's list, each with a reason:
- **Sibling and split files:**
  - `references/*.ts` and `catalog/schemas/references.ts` are the new index folder and its catalog-driven specs.
  - `transport/{addresses,renames}.ts` are the files the transport split makes.
  - `held/answers.ts` is the relay's split.
  - `refactor-subject.ts` is the diff pane's subject for a preview.
  - `lsp/references.ts` is the actual name of the brief's `references.svelte.ts`.
  - `repositories.ts` carries the pane subject's `refactor` field, where the brief named `answers.ts`.
- **Moved or exported symbols:**
  - `collection-text.ts` exports `renderScalar` and the quoting of a new key.
  - `schema/manifest.ts` exports `manifestFields` and gains `listedFields`, and `model/index.ts` gains `listed` (the schema checks `waiting-on` itself, so `validate.ts` skips fields the schema holds).
  - `options.ts` exports `isPairs` for the catalog specs.
  - `schema-findings.ts` gains the `map` finding reader.
  - `core/paths.ts` gains `under`. `library/rules.ts` and `machine-file.ts` use it from there (`under` moved down a layer so `data` can reach it).
  - `uris.ts` exports `pageUri`.
  - `config-files.ts` gains `isPrivateFile`.
  - `ops.ts` carries the `withheld` private folders into the `lsp-edit` route.
  - `private-folders.ts` head states the new use.
- **`fs-transport.ts`:** I removed the exported `readHash`, a function nothing imports, so the unused-exports list equals the base.
- **Tests:** `source-server.ts` gains a `kept` option. `reference-hub.ts` is the synthetic hub for G66 and G67. `held-unsaved.test.ts` and `diff-read.test.ts` hold the G28 and G62 rows.
- **`context.ts` and `servers.ts`, `relay.ts`:** D36 also writes these. My `context.ts` change is 1 line (810 to 811) in the schema feed line; the `relay.ts` and `servers.ts` hunks sit around `answers`.
- **No report file:** I did not write `reviews/D39-report.md`; the report is this message.

Tests added or changed, with the failing line on the unchanged tree (`$S/firstrun-final.txt`):
- **`tests/data/snapshot/references.test.ts` (G66, NEW).** `Error: Cannot find module '../../../src/lib/data/snapshot/references/lookup.ts'`, `Tests no tests`.
- **`tests/data/snapshot/rename.test.ts` (G67, NEW).** `Error: Cannot find module '../../../src/lib/data/snapshot/references/rename.ts'`.
- **`tests/state/system/refactor-preview.test.ts` (G68, NEW).** `Error: Cannot find module '../../../src/lib/state/system/machine/refactor/preview.svelte.ts'`.
- **`tests/data/helpers/hub-names.test.ts` (G28, NEW).** `TypeError: sameDiskFile is not a function` (10 rows) and `TypeError: diskPath is not a function`; `Tests 11 failed (11)`.
- **`tests/routes/replace/lsp-edit.test.ts`.**
  - `writes a file of 300 KB, keeps its copy and takes it back with the undo of the record`: `expected { ok: false, error: 'too_large', ... } to deeply equal { ok: true, paths: [ 'hub/big.txt' ] }`.
  - `refuses a file under the hub's secrets folder ... (case 30a)`: `AssertionError: expected { path: 'secrets/a.yml', ... } to deeply equal ...`.
  - `refuses a file over 5 MB as too_large and writes nothing` passes on the unchanged tree (its limit there is 256 KB and also gives `too_large`). It guards the new limit.
  - `Tests 2 failed | 9 passed (11)`.
- **`tests/state/system/lsp/edits.test.ts`.**
  - `refuses a file under the hub's secrets folder ... before any post (case 30a)`: `TypeError: parts.diskText is not a function`.
  - `does not overwrite a tab typed into ...`: `TypeError: parts.hashOf is not a function`.
  - `plans without posting or editing, and commits the hash the plan read` and `refuses the commit of a plan ...`: `TypeError: edits.plan is not a function`.
  - `refuses the rename of a hub key at the plan ... (case 30c)`: `TypeError: createLspEdits(...).plan is not a function`.
  - `Tests 5 failed | 3 passed (8)`.
- **`tests/data/snapshot/relation-shapes.test.ts`.** Passes on the unchanged tree (section 1).
- **`tests/state/client/held-unsaved.test.ts`.** `sends the write when the engine root is served from a worktree config folder`: `AssertionError: expected [] to have a length of 1 but got +0`.
- **`tests/views/sources/repositories/diff/diff-read.test.ts`.** `moves with the revision of a Refactor Preview and stays the same when the file changes`: `AssertionError: expected 'diff:hub:notes.md' not to be 'diff:hub:notes.md'`.

Edits to existing assertions: none changed. `diff` of the base against the final shows only additions in the assertions of `lsp-edit.test.ts`, `held-unsaved.test.ts`, `diff-read.test.ts` and `relation-shapes.test.ts`. In `edits.test.ts` the page's parts changed, not the assertions:
- Before: `diskText: () => Promise.resolve(null)` and `hashOf: () => Promise.resolve('abc')`.
- After: `read: () => Promise.resolve({ text: 'old = 1\n', hash: 'abc' })`, `roots: () => []` and `withheld: options.withheld ?? (() => false)`.
- Reason: `createLspEdits` reads the disk text and hash in one call.

The same file's head comment is widened. In `lsp-edit.test.ts` the import line gains `mkdirSync` and `writeFileSync`. `source-server.ts` gains `kept`.

## 6. Doc text for `agents/guarded.md`

**Test lines.**

G66 (`guarded.md:128`, Test at :130):
```
  Test: `tests/data/snapshot/references.test.ts`, describe 'the reference index': 'finds $name' for the rows 'a manifest select, venue_id, plain and double-quoted', 'a manifest list, pillar', 'a project named by related, its definition the id line of its manifest', 'a waiting-on value that names a person', 'a waiting-on value that names a project', 'a registry tags field, affiliations', 'a double-quoted select, the person of a joint-work entry', 'the related field of a collection', 'the maps_to text field of the radar, which names a project', 'a field nested in a records field', 'a dataset, defined by the key under datasets:', 'the domains of the options catalog, in behavior.yml', 'the clusters of the options catalog, the resources of kind cluster', 'a vocabulary value, defined as an item of its list in vocab.yml', 'a vocabulary value at its definition', 'a vocabulary key of a map in vocab.yml, listed by the options file that names its list', 'a key of the domains: map of vocab.yml, a reference to the domains registry', "a deck group's slide, a project id", 'a key defined twice in its source, two definitions', 'an open text laid over its file, a key typed and not saved', 'a file with a byte order mark, CRLF line ends and an astral character before the key', 'an anchored key used through an alias, one reference at the anchor', 'an open text under the hub root of the file the engine root serves from inside the hub', 'an open text under the hub root of a file the engine root serves from another folder', 'a from picked by another field of the record, the person source', 'a from picked by another field of the record, the organisation source', 'the portfolio deck, read from the folder portfolio_deck names'; and 'gives no hit for a value that names no key, and no reference for an empty value', 'finds the references of every document of a file of several', 'reads no portfolio deck when portfolio_deck is null, and the decks of the projects all the same', 'takes a double-quoted empty value for no key', 'defines nothing for a funding entry that has no key', 'gives no hit in a text that does not read as YAML, and marks the file'; the synthetic hub is `tests/data/snapshot/reference-hub.ts`; written by D39.
```
G67 (:131, Test at :133):
```
  Test: `tests/data/snapshot/rename.test.ts`, describe 'the rename of a hub key': 'edits $name' for the rows 'a plain and a double-quoted reference and the definition, and no other byte', 'a single-quoted reference, which keeps its quotes', 'a trailing comment on the line, which stays', 'a flow sequence, a block sequence and a double-quoted scalar', 'an anchored key used through an alias, edited once at the anchor', 'a key of the domains: map of vocab.yml, the domains registry entry and the engine reference'; 'writes a new key %s that would not read back plain as %s'; 'edits a file with CRLF line ends at the exact columns'; 'refuses $name and plans no edit' for the rows 'an open tab whose unsaved text is not YAML', 'an empty new key', 'a new key of white space only', 'a new key that already stands in the key source', 'a new key that stands in another source the field takes together with this one', 'a value that is a key of two sources the field takes together', 'a project id', 'a vocabulary value', 'a key that stands twice in its source', 'a new key with a comma, which a flow list would read as two', 'a file larger than the write limit', 'a file that cannot be read', 'a file whose text is no longer the text the index was built from, so the edit does not read back'; written by D39.
```
G68 (:134, Test at :136):
```
  Test: `tests/state/system/refactor-preview.test.ts`, describe 'the rename preview': 'shows the edit and writes nothing and edits no tab while it is shown', 'writes nothing and edits no tab on Discard', 'writes the checked edits only, and nothing for a file with none checked', 'shows the two texts of a file with the checked edits applied', 'holds a second preview as incoming, posting nothing, and Continue replaces the first', 'writes nothing on Apply when a planned tab was typed into after the preview opened', 'makes an edit with no annotation at once, unless the reader asked to preview it'; and `tests/views/sources/repositories/diff/diff-read.test.ts`, 'moves with the revision of a Refactor Preview and stays the same when the file changes'.
```

**New titles of the other entries.**
- **G2** (Test line gains, :11):
  - `tests/routes/replace/lsp-edit.test.ts`, "refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)".
  - `tests/state/system/lsp/edits.test.ts`, "refuses a file under the hub's secrets folder and one under the home folder's .oculus before any post (case 30a)".
  - The Code line gains `src/lib/data/helpers/files/private-folders.ts` and `src/lib/state/system/config/config-files.ts` (`isPrivateFile`).
- **G8** (Test line gains, :44):
  - `tests/state/system/lsp/edits.test.ts`, 'plans without posting or editing, and commits the hash the plan read', 'refuses the commit of a plan whose tab was typed into after the plan, and posts nothing' and 'refuses the rename of a hub key at the plan when a file no longer holds the key at an edited place (case 30c)'.
  - `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file over 5 MB as too_large and writes nothing'.
- **G9** (Test line gains, :47):
  - `tests/routes/replace/lsp-edit.test.ts`, describe 'the size of a file an lsp-edit writes (case 30)', 'writes a file of 300 KB, keeps its copy and takes it back with the undo of the record'.
- **G28** (Test line gains, :54):
  - `tests/state/client/held-unsaved.test.ts`, describe 'a rail reorder over a layout file a source tab holds unsaved text of', 'sends the write when the engine root is served from a worktree config folder' and 'refuses the write and posts nothing when the engine root is the hub own config folder'.
  - `tests/data/helpers/hub-names.test.ts`, describe 'one disk file under two names', the 10 rows 'is one file for the engine root served from the hub own config folder', 'is two files for the engine root served from a worktree config folder', 'is one file for a configured root inside the hub and the hub name of its folder', 'is two files when a root real folder is empty, a folder that does not exist', 'uses the dir of a root that carries no real folder', 'compares the names of a root not among the roots by root and path', 'tells two names of a root not among the roots apart when the paths differ', 'is one file by the prefix rule while the roots are not yet read', 'tells two files of the hub apart while the roots are not yet read', 'counts a trailing slash of a root folder once', and 'names a file by its root real folder, and null for a root with none'.
- **G28 Code line.** In the current line, replace "`src/lib/data/helpers/hub-names.ts` (`diskName`, the one name of a disk file)" with "`src/lib/data/helpers/hub-names.ts` (`sameDiskFile`, whether two names are one disk file, and `diskPath`, the real path of a name)". The caller is `unsavedFile` in `source.svelte.ts`.
- **G64** (Test line gains, :145):
  - `tests/data/snapshot/relation-shapes.test.ts`, 'gives one finding for a waiting-on written as one text when the people file reads, and none for a person key'.
  - The Code line gains `src/lib/data/snapshot/validate.ts` (`checkRelationShapes`) and `src/lib/data/snapshot/schema/manifest.ts` (`listedFields`).

**Open item 15: widened sentences.** Each is the line `grep -n "^- G6[678]\." guarded.md` prints now, then its replacement.

Now (128): `- G66. Every value of a hub field whose `from` names a source is a reference to that source's entry, with its file and range, and the entry's definition is its identity line, or the manifest's `id:` line for a project.`

Replace with:
`- G66. Every value of a hub field whose `from` names a source, or a list of sources, or a source another field of its record picks, is a reference to that source's entry, with its file and the range of its scalar inside the quotes; the entry's definition is its identity line, the manifest's `id:` line for a project, or the item or key of its list in `vocab.yml`, and a key of the `domains:` map of `vocab.yml` is a reference to the domains registry; a value that names no key, an empty value and a funding entry with no `key` give no reference and no definition, and a key standing twice has two definitions; the text of a tab is laid over its file by real path, so a key typed and not saved is a reference and a file open under two root keys is one file; positions are UTF-16 columns over the file's own line ends with a byte order mark left out; an alias gives one reference at the anchor; every document of a file of several is read; the portfolio deck is the folder `portfolio_deck` names and none when it is null.`

Now (131): `- G67. Renaming a hub key changes every reference to it and the entry's own key, keeps each value's quoting, and changes no other byte; it refuses an empty key, a key that exists, a project id, a vocabulary key and a file over the write limit, and writes nothing then.`

Replace with:
`- G67. Renaming a hub key changes every reference to it and the entry's own key, keeps each value's quoting (a key that would read back as something else is written double-quoted) and every line end, changes no other byte, and edits an alias's anchor once; it refuses, writing nothing, a tab whose unsaved text does not parse, an empty key or one of white space only, a key that exists in the key's source or in another source a field takes together with it, a value that is a key of two sources a field takes together, a key that stands twice in its source, a project id, a vocabulary key, a file over the write limit, a file that cannot be read, a new key that does not read back as a key and a file whose text moved since the index was built.`

Now (134): `- G68. A rename's preview writes nothing before Apply, and Discard writes nothing.`

Replace with:
`- G68. A rename's preview writes nothing and edits no tab before Apply, and Discard writes nothing and edits no tab; Apply posts only the checked edits and no entry for a file with none checked; a second preview waits for the reader's answer and posts nothing; an Apply after a planned tab changed posts nothing.`

## 7. Case 37, judgment calls, visible changes

**Case 37, id by id.**
- **View id `refactor-preview`.**
  - Defined once, `state/system/machine/refactor/preview.svelte.ts:21` (`REFACTOR_VIEW`). Registered with `group: ''` and `listed: false` at `RefactorPreview.svelte:10`, with the root element `data-view="refactor-preview"` at :178.
  - `grep -rn "refactor-preview" src config` finds only those three lines, so no other view, rail or catalogue id equals it.
- **Catalog keys.**
  - `search.yml` `refactor_preview.*` (16 keys), `views.refactor_preview` and `views.refactor_preview_glyph` (read at `RefactorPreview.svelte:10-203`).
  - `source.yml` `rename_empty`, `rename_exists`, `rename_large`, `rename_none`, `rename_preview`, `rename_project`, `rename_readback`, `rename_sources`, `rename_twice`, `rename_unparsed`, `rename_unread`, `rename_vocab`.
    - Read at `hub-keys.ts:107-125` and `lsp.ts:121-122`.
  - `source.lsp_edit_refused` (`transport.ts:642`, `text-edits.ts:221`).
  - `repositories.diff_refactor_gone` (`compare-words.ts:59`).
  - `findings.schema.bad_map` (`record.ts:43`).
  - `findings.validate.no_waiting_on` is removed.
  - G24 passes in `test:checks` (Tests 248 passed), which holds every catalog key to a reader.
- **Annotation id `hub-key`** (`text-edits.ts:21` `RENAME_ANNOTATION`): one constant, used at `hub-keys.ts:207-212` and `edits.ts:226`.
- **Error message of a refusal.**
  - Transport run:
    - A refused prepareRename rejects with the sentence (`rejected with "sciml is a refusal"`).
    - An empty message rejects with `lsp_edit_failed`.
    - A cancelled request (-32800) resolves with no notice.
    - A range answer resolves.
  - For a refused rename, the notices are `["lsp_edit_refused","sciml is already a key of pillars, so nothing was renamed."]`, and `["lsp_edit_refused","lsp_edit_failed"]` for an empty message. The client receives `result: null`.
- **`map` attribute** (`case37map.mjs`, `recordSchema`):
  - Absent: the field reads as a list or one record (`"type":["array","object","null"]`, `items` present), problems 0.
  - `map: true` on a records field: `"type":["object","null"]` with `additionalProperties` the record, problems 0.
  - `map: true` on a text field: one problem `{"key":"t","word":"map","args":["t"]}`, which the schema-finding reader words as `findings.schema.bad_map`.
- **Diff subject field `refactor`:** `refactorShape.optional().catch(undefined)` at `repositories.ts:237`, so a saved pane without the field reads as none; `diff-read.test.ts` row covers the key.
- **Paths in flight.**
  - A rename answer after its tab closed gives `lsp_edit_gone` (`transport.ts:477`, :658, and `edits.ts:359`).
  - A superseded preview: G68 'holds a second preview as incoming...'.
  - A prepareRename cancelled by a caret move: no notice (transport run).
- **Empty and duplicate cases.** An empty new key is a refusal, tested above; a duplicated key is the `twice` and `sources` refusals.

**Cases 34-36 as readings.**
- **34.** `createRefactor` holds the pending preview in memory (no storage or layout reference in `preview.svelte.ts`), so after a reload `pending()` is null and `RefactorPreview.svelte:176-180` draws the `Empty` line "Invoke a code action, like rename, to see a preview of its changes here."; nothing was written.
- **35.** `client.ts:311-322` binds `CtrlCmd+Enter` on `renameInputVisible`; it sets `#preview` and triggers `acceptRenameInput`. The transport run above shows the flag reaches `applyEdit` (`[true]` with the mark, `[false]` without). Enter stays the rename at once for a rename with no annotation (`edits.ts:226`).
- **36.** `RefactorPreview.svelte:68` `compare(file, line)` is called from the row at :112 and the file row at :149; `diff-read.ts:153-161` adds the preview revision to the pane's read key, so unchecking an edit changes the diff (`diff-read.test.ts` row, `store.revision` in the G68 'shows the two texts' row).

**Judgment calls.**
1. The options catalog files the index reads are `behavior.yml`, `layout.yml`, `sources.yml`, the config `present.yml` and `catalogs/vocab.yml`. The brief listed behavior, vocab and sources. `status_chips` and `entry_statuses` live in layout and present, so they are indexed too. `slide_tags` has no definition list, so it gives no references.
2. The preview key is `CtrlCmd+Enter` (O1).
3. The attribute is `map` (Z735, O2).
4. `listed`/`listedFields` make the schema own the shape finding of `waiting-on` when both `from` sources read, and `validate.ts` still gives it while a source is unread.
5. `lsp_edit_outside` words now name the private folders (see the before and after below).
6. The index holds unresolved values as scanned candidates, and navigation and Find References act on the ones that resolve.

**Visible changes: before and after, named for the look.** All are for landing.
- **Hover and Cmd+click (cases 1-9).** In a source tab of `projects/manuscripts/btfno/project.yml`, hold Cmd (Ctrl) over `tensor` in `pillar: [tensor, sciml]` (line 8).
  - Before: no underline; Cmd+click does nothing.
  - After: the whole word `tensor` is underlined; the click opens `registries/pillars.yml` at line 36 with the whole key `tensor` selected. The same holds for `media`, `amir-haeri`, a `related` project, a `compute` value and others.
- **References rows (case 13).** In `registries/venues.yml` on `id: media` run Find All References.
  - Before: the language server answers "Unhandled method".
  - After: the References view lists `2 results in 2 files` with a row for each file and line; the row ends in the whole key.
- **Peek (case 14).** In `registries/pillars.yml` Cmd+click on `key: "tensor"` (line 36).
  - Before: nothing.
  - After: Monaco opens Peek with the references (its alternative command), not a jump to itself.
- **Refusals at the caret (cases 23, 25).** F2 on `hccnet-fl` in a `related` list: the box does not open and the caret shows "hccnet-fl is a project's folder name, so it is renamed by renaming the folder in Files." F2 on a vocabulary value (`manuscript`) shows the vocabulary sentence. F2 on a `title:` value shows "The element can't be renamed." Before: F2 did nothing or reached the YAML server's own rename.
- **Preview look (cases 21, 29, 32, 33, 36).**
  - On `media` press F2, type `media-x`, press Enter.
  - Before: nothing renamed.
  - After: the Refactor Preview view opens (unlisted view, tab titled "Refactor Preview", title "Renaming 'media' to 'media-x'"). It shows each file and its edits as checkable rows; a press on an edit row opens the diff of that file against the file with the checked edits; unchecking an edit changes that diff.
    - Nothing is written until Apply. Apply writes the checked edits and History shows one record "Edited by a language server in N files"; Undo puts every file back.
    - Discard writes nothing.
    - A second rename shows "Another refactoring is being previewed." with Continue and Cancel.
- **Rename box (case 35).** In a TypeScript, pyright or texlab rename, Cmd+Enter (Ctrl+Enter elsewhere) in the box opens the Refactor Preview. Before: the box accepts only Enter. The hint line is not drawn (section 1).
- **Findings.** A manifest `waiting-on` that names no person and no project now shows the schema's reference finding (as `related` does) instead of `waiting-on names no person or project: x`. A deck group's slide that names no project gets the schema's mark and completion in `deck/present.yml`.
- **Write limit.** An edit from a language server to a file between 256 KB and 5 MB used to be refused; it is written with its copy kept. A file in the hub's `secrets` folder or `~/.oculus` is refused ("is outside the folders oculus serves, under a node_modules or dot folder, or in the hub's secrets folder or ~/.oculus, so the language server's edit was not made").

## 8. Documents and head comments read against the change

Comparison was made against `../D39-base` hunk by hunk (`diff`).

**Rewritten (hunks printed by `diff`):**
- `tools/oculus/DESIGN.md` lines 526, 553, 575-583 (hub-key sentence, plan/commit, 5 MB, refusals, preview, a "Hub keys as links" bullet with six part bullets).
- `tools/oculus/HELP.md` 81 and 116.
- `tools/oculus/docs/apps.md` 247.
- `tools/oculus/docs/files-and-search.md` 85 and the new part 87-98.
- `tools/oculus/docs/views.md` 69-73 and 257.
- `docs/DATA-MAP.md` 262, 274, 287-290, 314, 328, 360, 436, 463, 469, 498.

**Still true (read):**
- `DESIGN.md:23` (language server list).
- `DESIGN.md:124` (channels carry the page's request and the answer both ways, none dropped; an entry's answer is carried the same way).

**Heads rewritten (printed by the head comparison):**
- `config/schemas/deck-schema.yml`
- `config/text/views/sources/search.yml`
- `private-folders.ts`
- `schema/field.ts`
- `schema/record.ts`
- `schema/run.ts`
- `schema-findings.ts`
- `core/paths.ts`
- `history.ts`
- `lsp-edit.ts`
- `relay.ts`
- `schema-feed.ts`
- `servers.ts`
- `state/system/machine/lsp/edits.ts`
- `kit/lsp/transport.ts`
- `compare-words.ts`
- `diff-read.ts`

**Other comments rewritten** (the file head is unchanged but the file's own doc comments changed): `hub-names.ts`, `relay-options.ts`, `hosts.ts`, `source-file.ts`, `validate.ts`, `data/index.ts`, `config-files.ts`, `text-edits.ts`, `repositories.ts`, `manifest-schema.yml`.

**Head unchanged and still true** (compared by command, not individually re-read in this turn): the other changed source files, including `context.ts`, `portfolio.ts`, `uris.ts`, `rules.ts`, `machine-file.ts`, `client.ts`, `services.ts`, `Diff.svelte`, `References.svelte`, `lsp.ts` and `fs-transport.ts`.

Scratch: the temporary `tests/_scratch` folder was removed after each run (`ls tests` prints `checks data fixtures routes server shell state tiers ui views`). The probe scripts and outputs are in `$S`.
