# Step D39 brief check (on main at 0e9bde803)

The brief is `tools/oculus/.scratch/migration/agents/briefs/D39.md`, committed at 833c5932f. `git diff HEAD -- .../D39.md` prints nothing. Main's head moved twice while this check ran (833c5932f, then 0e9bde803). `git diff --stat e61cfc598 HEAD -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml' ':!projects/manuscripts/btfno'` prints nothing, so every source line number the brief gives still holds.

There are 33 findings. Most of them change the brief: 7 are paths missing from "Paths this step writes" (F2, F5, F6, F7, F15, F16, F17), and 2 say that three steps now in flight write D39's files (F10, F14). One clashes with your own ruling: F18 (G64, one type finding for a one-text `waiting-on`).

## 1. Names

- `no_waiting_on`, `waiting_on_itself`: `git grep -n "no_waiting_on\|waiting_on_itself" -- tools/oculus ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'` prints `config/text/findings.yml:190-191` and `validate.ts:204,212`. All four are in the path list.
- `checkWaitingOn`: hits at `docs/DATA-MAP.md:274`, `:497` and `validate.ts:191,411`. All are in the path list.
- `openReference`: `git grep -n openReference -- tools/oculus/src tools/oculus/tests` prints these hits:
  - `References.svelte:179,184,193,203` (in the paths).
  - `lsp.ts:46` and `lsp.ts:537`: `if (pick !== null) openReference(client, pick, pick.line, pick.column);`. This is the F4 / Shift+F4 walk through `references.step`. It is outside the paths (lsp.ts is listed only for lines 195-215). The change does not break the call, but the walk keeps opening with a column only, so O4's "whole key selected" is false there.
- `keepCopy`, `keepBytes`:
  - Hits in `file-undo.ts:166`, `file-changes.ts:82`, `replace.ts:342`, `source.ts:218`. These are unchanged and stay true.
  - The head comment `history.ts:10-21` lists the limit of each copy kind (save and replace 256 KB, delete 5 MB) and says nothing of `lsp-edit`. Item 5 makes it incomplete, and the path list gives only `history.ts` lines 40-60 and 125-170.
- `SchemaFeed`, `ServerEntry`, `#route`, `#commit`, `apply`:
  - The callers of `apply` are `lsp.ts:212` and `tests/state/system/lsp/edits.test.ts:104-126`.
  - That test is G2's 'refuses a library file, a file under node_modules or a dot folder, and a path outside' and G8's 'does not overwrite a tab typed into while the edit waited'.
  - It is run by verify item 2 but is not in the path list.
- `lineOfItem`: `git grep -n lineOfItem` prints `lists.ts:90` (`function lineOfItem(`, not exported) and `:135`. Reusing it means writing `lists.ts`, which is not in the paths. M6's rewritten brief also changes `lineOfItem`'s walk.
- `refactor-preview`, `refactor_preview`: no hit, so no collision.
- `keyed`: `git grep -n -w keyed` prints many uses in prose, and three in the schema and catalog code:
  - `data/shapes/catalog-files.ts:25`: `const keyed = z.strictObject(` is "one row of a keyed list" of vocab.yml.
  - `data/snapshot/schema/lists.ts:3,26`: "the keyed lists of config/catalogs/vocab.yml".
  - `data/sources/config/catalog/schemas/options.ts:184-197`: `const keyed = 'key' in fields; ... type: keyed ? ['array', 'object'] : 'array' ... additionalProperties = member` is an options entry written as a list or as a map.
- The fields of a schema row (where `keyed` would be added):
  - `data/model/model-collections.ts:29-50`, the `SchemaField` type, with `open?` and `fields?`.
  - `docs/apps.md:247`, the apps API shape: "`schema?` (list of `{ field, type, label?, options?, from?, required?, help?, when?, open?, fields? }` ...".
  - Neither is in the paths.
- `lsp_edit_outside`: `config/text/views/sources/source.yml:69` reads "{0} is outside the folders oculus serves or under a node_modules or dot folder, so the language server's edit was not made." The lsp-edit head comment (`lsp-edit.ts:9-11`) and the edits.ts head comment (`edits.ts:19`) list the same `outside` cases. O5 adds `closed_paths` to `outside`, which makes all three incomplete. source.yml:60-80 is in the paths, but item 5 does not ask for it.
- `groups.<name>.slides`: `grep -n "groups\|present.yml" docs/DATA-MAP.md` prints these rows:
  - `:314`: "`groups.<name>.slides` | list | a deck folder found by the group's `find:` | the folder's name, a project's id for a project's deck".
  - `:360`: the same reference, "a deck folder's name, or a project's id for a project's deck".
  - O2's `from: projects` changes both rows. Neither is in the paths.

Findings:
- **F1 (Names, `keyed`).** The new schema word `keyed: true` ("a map from a name to one record") collides with two existing meanings in the schema and catalog code: `catalog-files.ts:25` (a row of a keyed vocab list) and `options.ts:184-197` (an entry whose fields name `key`, written as a list or a map). Change: name the attribute for what it holds (for example `map: true`), or state in O2 how it relates to the existing "keyed list". Book the word as a user-visible schema shape in `choices.md`.
- **F2 (Names and paths, `SchemaField` and the apps API).** Adding `keyed` changes the `SchemaField` type (`model-collections.ts:29-50`) and the apps API's documented schema shape (`docs/apps.md:247`). That is a wire shape apps read. Change: add both paths, and add a line under "Decisions" naming the apps API shape change.
- **F3 (Names, the F4 walk).** `lsp.ts:537` (the F4 walk) opens a reference with no end. Change: item 7 also covers `references.step`'s pick and `lsp.ts:535-538`, and the path list widens to those lines.
- **F4 (Names, the `outside` words).** The `lsp_edit_outside` words (`source.yml:69`) and the `outside` lists in `lsp-edit.ts:9-11` and `edits.ts:19` become false once `closed_paths` is refused as `outside`. Change: item 5 rewrites all three.
- **F5 (Names and paths, `history.ts`).** The `history.ts:1-22` head comment is outside the path list, but item 5 makes it incomplete. Change: add `history.ts` lines 1-22.
- **F6 (Names and paths, `lineOfItem`).** `lineOfItem` is not exported (`lists.ts:90`). Change: either add `lists.ts` to the paths and name the overlap with M6, or tell the builder to reuse only exported helpers. The brief also says M6 moves `yaml-ranges.ts` to `data/helpers/files/`; M6's brief now names `data/helpers/files/yaml/yaml-ranges.ts`.
- **F7 (Names and paths, the deck).** Three things about the deck:
  - `DATA-MAP.md:314` and `:360` say a slide may name any deck folder; `from: projects` limits slides to project ids. Change: add both rows to the paths and to item 8. Have O2 state whether a slide naming a deck folder that is not a project is now marked by the editor (all 22 on the tree are projects: a `find projects -maxdepth 4 -path "*/$n/project.yml"` loop found every one).
  - The deck schema governs every `projects/**/present/present.yml` as well (`static.ts:82-84`), but item 1 reads only `deck/present.yml`. Change: the index reads every deck file the deck schema governs.
  - Item 1 also names `deck/present.yml` literally. Change: read the configured `config.portfolioDeck` instead.

## 2. The step line

The plan line is `plan.md:534` at HEAD.

- "in a hub YAML file, a press with Cmd on a value that names an entry of another file ... opens that file at the entry": served by item 1 (the index), item 2 (`textDocument/definition`) and item 7 (the whole key), and by cases 1-9. The kinds the line names:
  - venue_id: case 1.
  - person: cases 4 and 7.
  - organisation: case 5.
  - resource: only `slurm.resource` in case 9; no case names a manifest `compute` value.
  - project id: cases 3, 6 and 8.
  - dataset: no case.
  - pillar: case 2.
  - domain: cases 9 and 10.
  - funding key: only the negative case 15; no `funding: FAIR` opening `key: FAIR`.
- "Find References on a key lists every file and line that names it": item 2 (references, the `referencesProvider` declaration); cases 10, 11, 13, 17 and 18.
- "Rename on a key changes every file that names it": item 3; cases 21-24.
- "the list of edits shown before anything is written": item 4; cases 21 and 31-36; G68.
- "through D23b's write chain": item 4 (the plan and commit split of `apply`) and item 5.
- "the references read from M8's schemas": items 1 and 6.
- The sub-bullet:
  - The DATA-MAP rows rewritten: item 8.
  - The radar over the copy limit: item 5.
  - D39 before M7: the queue.

Findings:
- **F8 (the step line).** The line names resource, dataset and funding key, but no case opens:
  - a manifest `compute:` value at `registries/resources.yml`;
  - a manifest `datasets:` value at `registries/data.yml`, the one registry whose entries sit under `datasets:` and not `entries:` (`hub-names.ts:40-52`);
  - a `funding: FAIR` value at `funding/funding.yml:66`.

  The G66 table ("one row per kind of reference and definition") has no row for the datasets definition. Change: add these cases, and a G66 row for the `datasets:` definition.

## 3. Premises

Every premise below was rerun on main at 0e9bde803.

- **The counts.** My own script, `$TMPDIR/d39check/count.mjs`, parses the `schema:` of each of the 18 hub files that carry one (found by `git ls-files '*.yml' ... | xargs grep -l "^schema:"`), `manifest-schema.yml` and the side-project, deck and cpp schemas. It prints:
  - `hub-key fields=17 vocab fields=12 values under hub-key fields=1115` and `manifests=94 with id=94`.
  - Per field: venue_id 53, domain 94, pillar 122, funding 22, collaborators 57, related 70, datasets 58, compute 17, waiting-on 2; affiliations 20; funder 0; person 13; events 6, education 10, applications 7, repos 5; radar `project` 376 and `maps_to` 185; vocab-only fields venues 3, data 2, career 1, side 1.
  - `find side-projects -name project.yml | wc -l` prints 3.
  - All match the brief.
- **The schema code.** These line ranges match: `field.ts:26-34`, `manifest.ts:29-63`, `lists.ts:26-86`, `hub-names.ts:10, 19, 40-52`, `record.ts:126-131` (the text `examples`) and `:32-42` (`FIELD_TYPES`), `catalog-files.ts:77`, `vocab.yml:51-63`.
- **The engine's two hub references.** `engine.ts:53-75` matches (`optionSource`). `grep -n "from:" config/catalogs/options.yml` prints `:189 from: domains` and `:339 from: clusters`, plus `:196`, `:1035`, `:1051`, `:1094`, `:1118` naming `entry_statuses`, `[status_chips, project_types]`, `slide_tags` and `project_types` (see F26). `behavior.yml:26` and `:76` match.
- **`waiting-on`.** `manifest-schema.yml:55`, `validate.ts:191-215` and `:106-144`, `findings.yml:190-191` and `state/forms/schema.ts:139` (`from: filledTextShape`) match.
- **The deck.** `deck-schema.yml:22` (`type: raw`) and `deck/present.yml:5-39` (three groups, 22 slide names) match.
- **Funding and the radar.** `funding.yml:66` matches at HEAD and in the working tree; the working tree's uncommitted change to funding.yml is on another line. `wc -c feeds/literature-radar.yml` prints 336388 and `grep -c hccnet-revision` prints 32.
- **yaml-language-server.** `node_modules/yaml-language-server` is 1.24.0. `yamlServerInit.js:89-91` holds `definitionProvider`, `renameProvider: { prepareProvider: true }` and `documentLinkProvider`. `grep -c referencesProvider` prints 0.
- **The relay side.** `servers.ts` 642 lines, `yaml()` :544-576, `YAML_SETTINGS` :526-536, capabilities :563-572, `ServerEntry` :131-163. `relay.ts` 864 lines, its `initialize` answer :434-442, `#route` :497-551. `schema-feed.ts:21-27`, `held.ts:50-67`, `documents.ts:54-63`, `data/index.ts:216, 226-275`, `run.ts:100-182`, `portfolio.ts:602-610`, `server/root/context.ts:246, :319`. All match.
- **The page side.** `transport.ts` 871 lines, :504-513, :660-668, :136-140, :45-47. `edits.ts:193` (`async function apply(`) and `:18-27`. `lsp.ts:212`, `client.ts` 666 lines with `#applyEdit` :540-545. `rename.js:351-370`, `:218`, `:176-184`, `:60-88`. `standaloneServices.js:518` (`hasPreviewHandler() { return false; }`). `grep -c wordPattern ...yaml.js` prints 0. Monaco is 0.57.0. All match.
- **Opening a reference.** `goToCommands.js:172-176`, `hosts.ts:129-160`, `commands.ts:43-62`, `source-file.ts:39-54`, `references.ts:38-45`, `place.ts:16-17`, `services.ts:63-68`, `lsp.ts:329-330` and `:468` match.
- **The view and its words.** `text-edits.ts:186-203`, `source.yml:66-78`, `MathPreview.svelte:6-13`, `registry.ts:97-101`, the Explorer orders 0-3 and 5-8, `layout.yml:171`, `app.yml:12` (s1-s8) and `glyphs.yml:98` (`diff: "<->"`) match.
- **The write chain.** `history.ts:47, 50, 143, 165`, `lsp-edit.ts:64, 73, 93`, `file-undo.ts:154-173` match. `grep -rn "too_large\|SAVE_MAX_BYTES" tests` names no lsp-edit test, which matches.
- **Folders.** The `git ls-files <d> | cut -d/ -f1 | sort -u | wc -l` loop matches every count the brief gives. It also prints two full folders the brief does not name: `src/lib/state/sources/repositories 10` and `src/lib/state/client 10`.
- **Line counts.** `wc -l` matches every count the brief gives.
- **ADRs.** `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both; `.agents/plan.yaml` has no `adr:` key.
- **Test files.** All 17 test files verify item 2 names exist (`[ -f ]` loop).

Findings:
- **F9 (plan line numbers and HEAD).** The brief says "`plan.md:533` ... `1160` ... `1496` ... `1543` ... `1548` (the same line numbers on `git show HEAD:...`)" and "The checkout's HEAD is 11ae1cfbc". At HEAD 0e9bde803 they are 534, 1163, 1499, 1546 and 1551, with Z730 at 1554. HEAD moved by 884716764, 2ec83cd31, 833c5932f and 0e9bde803, all inside `.scratch`. Change: cite rulings by the `grep -n` the brief already gives, and state the dispatch base.
- **F10 (the steps in flight).** The section "In flight or queued beside this step" is stale and partly false. `queue.md:1-5` now lists M6, D39, D43 and D36 in flight. Their current briefs show:
  - **D43** has a brief, `agents/briefs/D43.md`, on disk and untracked. "no brief yet", "queued after D39" and "uses the relay hook D39 makes" are false: D43's item U8 adds its own `diagnostics?` hook for notifications. Its paths include:
    - `servers.ts`;
    - `relay.ts` :115-160 (the `RelayOptions` schemas and the constructor D39 changes) and :785-821;
    - `held.ts`;
    - `server/root/context.ts` :247-259, inside D39's 240-330;
    - `transport.ts` with its own split into `kit/lsp/transport/`;
    - `client.ts`, `hosts.ts`;
    - `DESIGN.md:575` and `docs/files-and-search.md:85`.
  - **D36** (brief committed) writes `state/client/context.ts`, a new section of `docs/files-and-search.md` after :85, and `DESIGN.md`.
  - **M6**'s rewritten brief writes `docs/DATA-MAP.md` 461, 464 and 465 (next to D39's 463), `state/sources/fs-transport.ts`, `lists.ts`, `validate.ts` and `state/client/context.ts`.

  Change: rewrite the section from those briefs. Name that D39 and D43 both split `transport.ts` and both change `relay.ts`'s constructor region, which is not a simple merge, so one waits for the other (the orchestrator's `shared_paths` call).
- **F11 (O4's premise about VS Code).** `goToCommands.js:172-191`, which is VS Code's own source, opens with `selection: Range.collapseToStart(range)` and flashes the range for 350 ms (`symbol-navigate-action-highlight`). VS Code does not select the key. The whole-key selection is oculus's own behaviour (`docs/files-and-search.md:85`, "opens it with the name selected"). Change: say so in O4, and list it as a place where oculus differs from VS Code (`spec.md`, "The principles every package is judged on", last bullet), so the look is not judged against VS Code.
- **F12 (`DESIGN.md:526`).** The brief calls `DESIGN.md:526` "likely still true". It says References is "the fourth listed view of the Explorer group ... chords are `s1-s4`", while `HELP.md:46` and `config/text/app.yml:12` say `s1-s8` and eight views are listed. Change: mark it false. Either fix it in D39, which writes DESIGN.md, or say it is outside the step.
- **F13 (the scratch scripts).** `scratchpad/d39/count.mjs` and `quoting.mjs` live in the orchestrator's session scratchpad (`/private/tmp/claude-502/.../scratchpad/d39/`). The builder cannot reach them, and case 22 names `quoting.mjs` as its run. Change: put the scripts' text in the brief, or have the builder write its own and quote it.
- **F14 (two full folders).** `state/sources/repositories/` holds 10 items (answers.ts, change-tree.ts, diff, file-git.ts, graph-lanes.ts, replace-preview.ts, repositories.svelte.ts, repositories.ts, review-comment.ts, worktrees.ts). The brief offers "a new file beside `replace-preview.ts`", which would make 11. `state/client` is also full, so a split of `context.ts` would need a regroup. Change: state both as full in "Folders and sizes", and remove "beside".
- **F15 (the diff subject's readers).** A new diff subject field is read where `subject.replace` is read: `views/sources/repositories/diff/compare-words.ts:46-55`, `Diff.svelte:119` and `state/sources/repositories/answers.ts:245-259`. Only `diff-read.ts` is in the paths. Change: add them.
- **F16 (the page's edit test).** `tests/state/system/lsp/edits.test.ts` holds G2's page-side refusals (`guarded.md:12`) and G8's typed-tab case (`guarded.md:45`). It must gain case 30a's page-plan row ("the page's plan refuses it before any post"), and the plan and commit split runs under it. It is not in the paths, and item 9 gives 30a only a route row. The report's "Doc text" names G8 and G9 but not G2. Change: add the file and the row, and add G2 to the Doc text.
- **F17 (files between 2 and 5 MB).** The page's plan must read each on-disk file's text to check that every edited range holds the old key. The page's text reads are capped:
  - `TEXT_LIMIT = 2 * 1024 * 1024` (`data/file-ops.ts:32`);
  - `readText` uses `readCapped`;
  - `diskText` returns null when the answer is `truncated` (`state/client/context.ts:599-602`).
  - `readHash` (`fs-transport.ts:469-477`) is uncapped but gives only the digest.

  A file between 2 MB and 5 MB passes the server's new limit, but the page cannot check it, and the diff pane's left side is capped too. `fs-transport.ts` is not in the paths, and M6 writes it. Change: name the read (one read of the bytes giving both text and hash, up to `DELETE_MAX_BYTES`) and its file, and add a case for a 3 MB file.

## 4. Cases and checks

- Cases 1-17 and 19-37 fit the test rule (`spec.md`, "What every package obeys": a test only under a guarded entry, one table per unit) and its rules on looks and runs, except as named below.
- Case 18 calls the engine-root address `config/catalogs/vocab.yml`. The engine root is the config folder itself (`hub-names.ts:12-17`; `files.ts:256`, `dir: configDir(engine)`), so the address is `catalogs/vocab.yml`.

Findings:
- **F18 (G64 against your open item 8 ruling).** You ruled that a one-text `waiting-on` gives one type finding (open item 8, `plan.md`; G64). Item 6 says "G64's test runs unchanged and passes". That holds only because of the test's fixture:
  - With `from: [people, projects]`, the `tags` schema is `{ type: ['array','null'], items: { enum, 'x-from' } }` whenever both sources read (`record.ts:100-110`).
  - So `waiting-on: someone` gets the schema's `findings.schema.type` (`check.ts:325-334`, the same sentence through `typeWords`), and also `checkRelationShapes`'s finding (`validate.ts:121-143`).
  - `sortFindings` (`validate.ts:376-382`) does not remove duplicates, so the real hub would get two findings.
  - The test's fixture plants an empty `registries` folder, so `people` is unread (a `file_missing` finding with key '', `yaml-file.ts:37`, then `unreadSources`), and the schema falls back to `['array','string','null']`. That is why the test stays green.
  - `NOT_BARE`'s comment (`validate.ts:98-104`, "accept `waiting-on` written as one text because it names no list of keys") becomes false.

  Change: add a case on a fixture whose people file reads, expecting one finding, and have item 6 decide which check keeps the one-text finding.
- **F19 (G66 to G68 are narrower than their rows).** Each guarded entry's sentence is narrower than the rows the brief writes under it:
  - G66 (`guarded.md:128`) does not cover vocabulary definitions, the `domains:` map rule or the overlay.
  - G67 (`:131`) lists five refusals; the brief adds a key standing twice, a new key that does not read back, and a key of another source.
  - G68 (`:134`, "writes nothing before Apply, and Discard writes nothing") does not cover "Apply posts only the checked edits" or "an Apply after a planned tab changed posts nothing".

  `spec.md` ("What every package obeys") says a test exists only as the test of an entry. Change: the report's Doc text gives the widened sentences for the orchestrator to book, or the rows outside an entry are dropped.
- **F20 (the engine address in case 18).** Change: write the engine address as `catalogs/vocab.yml`.
- **F21 (where a refusal is shown).** Decision 2 says "Monaco drops a non-string error silently, so the notice is the only place the reader sees it". Two facts change that:
  - Monaco shows a string error at the caret (`rename.js:183-185`, `MessageController ... showMessage`).
  - That is where VS Code 1.137.0 shows its language client's "The element can't be renamed.", which `extensions/json-language-features/client/dist/node/jsonClientMain.js` rejects with as an `Error`.

  For a feature built "as VS Code's", the tab notice is a departure. Change: either pass the words as a string rejection, so they show at the caret, or list the tab notice as a departure from VS Code.
- **F22 (the hook cannot do what item 2 asks).** Item 2 defines the hook as returning "an answer or nothing, nothing meaning forward as now". The same item then requires yaml-language-server's null `prepareRename` answer to be "turned into the refusal 'can't be renamed'". A hook that runs before forwarding cannot change the server's later answer. Change: say where that conversion happens (in the relay's answer path, or in the transport), and add that file's lines to the paths.

## 5. The question

The question asked of each item: could its check pass without the step's goal being reached?

- **Cases 1-9, 13, 14, 21, 29, 32, 33, 35 and 36** (the look on landing): no. The look shows the behaviour.
- **G66 (item 1): yes.** Its rows run on synthetic fixtures, so it passes while the index misses references on the real hub. Three ways that can happen: `deck/present.yml` named literally instead of `portfolio_deck`; the career file's `sections` kind; a hub file missed from `hubFiles`.
- **G67 (item 3): no.** It runs the edit on fixtures holding each quoting form.
- **G68 (item 4): partly.** It proves the store, but not that the transport hands a hub-key rename to the store instead of `#commit`. Case 21's look covers that.
- **Item 5, the `lsp-edit.test.ts` rows: no.**
- **Item 6: yes**, by F18.
- **Item 7: no.** Its proof is the look.
- **Item 8 and verify item 6.** `grep -n "no formatting and no rename"` passes when the sentence is merely deleted, with no new part written. `grep -rn "no_waiting_on" src config` leaves out `tests` and `docs`.

Findings:
- **F23 (a count over a copy of the hub).** Change: add a case that builds the index over a scratch copy of the hub and compares counts with the counting run. Expected:
  - per field, the counts in section 3 above;
  - waiting-on 2; deck slides 22; `data_domains` 7; `slurm.resource` 1; `vocab.yml` `domains:` keys 12;
  - `maps_to` only where the value names a project;
  - the definitions counted per source.
- **F24 (verify item 6).** Change: run the `no_waiting_on` grep over `src config tests docs`, and pair the "no formatting and no rename" grep with a reading of the new part item 8 writes.

## 6. Implied inputs

This is a code step. Facts behind the list: `cat ymls.txt | xargs grep -l $'\r'` and a BOM probe over the 304 tracked hub YAML files print nothing. No real anchors or multi-document manifests are on the tree. `comm -12 people.txt projects.txt` prints nothing (no person key equals a project id). The case scan found no registry key with special characters.

Findings:
- **F25 (inputs the brief implies but never states).** Each of these is missing from "Cases"; add it with its expected result.
  - **(a) A closed file written after the last build and before F2** (a form write, or the debounced rebuild not yet published). Case 27 covers only bytes moving between the answer and the plan. Expected: the rename reads that file's current text, or refuses with `lsp_edit_changed`; it never edits stale places.
  - **(b) An open tab whose unsaved text does not parse.** Expected: no references from it, and a rename refused with a sentence naming the file.
  - **(c) A file starting with a UTF-8 BOM, and a CRLF file.** `readFileSync(..., 'utf8')` keeps U+FEFF, while `lsp-edit` applies edits after `splitMark` (`lsp-edit.ts:70-71`). Expected: line-0 columns counted without the BOM, as `lsp-edit` and Monaco count them; with CRLF, exact ranges and the line ends kept (G58).
  - **(d) A non-ASCII or astral character before the key on the same line.** Expected: exact UTF-16 columns (a G66 row).
  - **(e) A YAML anchor holding a hub key, used through an alias.** Expected: one reference at the anchored scalar; the rename edits it once and leaves the alias, and the edit still reads back.
  - **(f) A multi-document hub file.** Expected: references from every document, or a refusal naming the file.
  - **(g) A `waiting-on` value that is both a person key and a project id.** Expected: two definitions, and a refused rename.
  - **(h) yaml-language-server not running, or failed twice within 3 minutes (G36).** Expected: hub-key answers still come from the index; a forwarded request gets the relay's existing error.
  - **(i) The `version` in each `documentChanges` entry the hook builds.** Expected: the page's version for an open document (G63) and null for a closed file, so `staleFile` (`transport.ts:509`) does not refuse it.
  - **(j) A `{ field, sources }` `from`.** Item 1 names it, but no case or G66 row covers it, and none is on the tree.
  - **(k) The same file open in two tabs at once, under the hub and the engine root.** `changeDocument` edits only the address the document was opened under (`documents.ts:61`). Expected: the one tab that is edited is named.
  - **(l) A hub file opened under a configured root that lies inside the hub.** Roots can be added (`config/sources.yml:92`). Expected: forwarded, or answered by real path.
  - **(m) `portfolio_deck` not `deck`, or null.**
  - **(n) A file between 2 MB and 5 MB.** See F17.
- **F26 (vocabulary words named in config files).** Z725 C3 gives a vocabulary value "definition and references". Config files also name vocabulary words through the options catalog's `from: project_types`, `status_chips`, `entry_statuses` and `slide_tags` (`options.yml:196, 1035, 1051, 1094, 1118`; `options.ts:430-435` reads them from `type_color`, `status_legend` and `status_palette` in vocab.yml). Item 1 takes only `from: domains` and `from: clusters`, so Find References on `manuscript` misses `sources.yml`'s scan `type`. Change: either index those entries, or have the brief state that vocabulary references are the hub fields only, with a case.

## 7. ADRs

- No record. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both, and neither the configuration block nor `.agents/plan.yaml` has an `adr:` key.

Findings: none.

## 8. Dictated text

Each line was found with `grep -n` in the brief.

- **Test titles** (lines 136-138): 'the reference index', 'the rename of a hub key', 'the rename preview'. Hold: no history words (`spec.md`, "What every package obeys") and plain prose.
- **The view and its words** (line 347, O3): label "Refactor Preview"; "Apply"; "Discard"; title "Renaming '{0}' to '{1}'"; "Invoke a code action, like rename, to see a preview of its changes here."; "Another refactoring is being previewed."; "Continue"; "Cancel". Hold.
  - The title is `rename.js:252`. The empty line and the question are in VS Code 1.137.0's `out/nls.messages.js`.
- **"The element can't be renamed."** (line 347). Holds as VS Code's words: they come from its language client (F21), not from VS Code's core strings.
- **Case 25 (line 183)** quotes the same line as "can't be renamed". It should quote the whole line.
- **"{0} is already a key of {1}, so nothing was renamed."** Holds.
- **"{0} is a project's folder name, so it is renamed by renaming the folder in Files."** Holds.
- **"{0} is a word of oculus's vocabulary, which oculus's own code reads, so it is not renamed here."** Breaks the rule that every sentence states a fact (hub `CLAUDE.md`, "Working rules", the claim rule). It says oculus's code reads the word, which Z725 C3 says only of some vocabulary keys ("since oculus code reads some vocab keys").
- **"{0} stands twice in {1}, so nothing was renamed."** Holds.
- **"{0} is larger than 5 MB, so nothing was renamed."** Holds as prose, but it copies `DELETE_MAX_BYTES` as a literal; the sentence goes false the day the constant changes.
- **"{0} would not read back as {1} in {2}, so nothing was renamed."** "Read back" is unexplained jargon (global `CLAUDE.md`, "plain prose only", "Unexplained jargon").
- **"A key cannot be renamed to nothing, so nothing was renamed."** Holds.
- **Verify item 3's ASCII gate** (`spec.md` "The ASCII gate", repeated in the brief): `find src tests bin config` names a `bin` folder that does not exist in `tools/oculus` (`ls -d bin`: "No such file or directory"). Run here it printed "bfs: error: bin: No such file or directory.", so "prints nothing" fails on stderr.

Findings:
- **F27 (the vocabulary refusal).** It is false for most vocabulary words. Change: rewrite it, for example "{0} is a word of oculus's vocabulary in config/catalogs/vocab.yml, and oculus's code reads some of those words, so none of them is renamed here."
- **F28 (the read-back refusal).** It is jargon. Change: for example "In {2}, {1} would be read as something other than a key, so nothing was renamed."
- **F29 (the 5 MB refusal).** It hardcodes the limit. Change: fill the limit from the constant through a placeholder.
- **F30 (missing and mismatched sentences).**
  - No sentence is named for the refusal "a new key that stands in another source a field takes together with this one". Change: state that it is the "already a key of {1}" sentence with {1} as that source, or dictate one.
  - Change: case 25 quotes the whole line of O3.
- **F31 (the ASCII gate).** Change: drop `bin` from verify item 3's command, or say the stderr line is expected.

## Declined to judge

- **Whether a git cherry-pick of D39 conflicts with M6's DATA-MAP lines 461, 464 and 465 around D39's 463, or with D43's `relay.ts` and `transport.ts`.** The size of a merge is the orchestrator's `shared_paths` call. F10 gives the overlaps.
- **Whether oculus's own Cmd+Enter command wins over Monaco's `acceptRenameInputWithPreview` (weight 199, precondition `config.editor.rename.enablePreview`) inside the rename box.** Settling it needs a running editor.
- **That VS Code 1.137.0 shows "The element can't be renamed." at the caret.** I read the language client's rejection and Monaco's string-error path, not a running VS Code.
- **The cost of building the index on each rebuild (C7).** Not measured here; the survey measured parsing alone at 80-150 ms. I did not raise it as a finding. A before-and-after time of a real-hub rebuild in the builder's report would settle it.
- **Whether the overlay belongs in the data layer.** The G66 overlay row implies it does, with plain texts, since `Doc` is a server type. The layer boundaries the brief states hold for `data/snapshot/references/`: it sits inside `data/snapshot`, `order.ts` has no inner order for that folder, and the layer is data, which imports no server module.
- **Whether the brief's rules contradict D23b's or M8's rulings in force.** Apart from F18, I found no contradiction:
  - Decision 3 moves the `lsp-edit` hash from "just before the request" (`edits.ts:28-29`) to "when the preview opened". The brief records that, and it was taken in automode, not ruled by you.
  - Z725 C5's narrowing of Z682 (3) is also an automode ruling over an automode ruling.

Agent usage: a82035d8af9667de8, claude-opus-5-5, 354,905 tokens, 148 tool uses, 20.9 min (completion notice).

## Closed

Closed by the orchestrating session in `agents/briefs/D39.md`, on main at fbc434269. The report's opening counts 33 findings; it holds 31, F1 to F31, each closed below.

- F1: the attribute is `map: true` (Z735); O2 says why `keyed` was not taken.
- F2: item 6 names `SchemaField` and `docs/apps.md:247`; both are in the path list.
- F3: item 7 covers the F4 walk (`lsp.ts:535-538`); the path list gives `lsp.ts` 530-540.
- F4: item 5 rewrites `source.yml:69`, `lsp-edit.ts:9-11` and `edits.ts:19`.
- F5: the path list gives `history.ts` 1-22; item 5 names the head comment.
- F6: item 1 reuses exported helpers only (`yaml-ranges.ts` at M6's new place); `lists.ts` is not written.
- F7: item 1 reads every deck file the deck schema governs through `portfolio_deck`; item 6 states that a non-project slide is marked and none on the tree is; DATA-MAP :314 and :360 are in item 8 and the path list.
- F8: case 9a (compute, datasets, funding) with a G66 row for the `datasets:` definition.
- F9: the citations are current and come from one grep at fbc434269; `/spec` rereads them at D39's base.
- F10: the in-flight section is rewritten from M6's, D43's and D36's briefs; D39 is prepared after M6 and D43 land (Z735).
- F11: O4 and item 7 name the whole-key selection as oculus's own and a departure from VS Code.
- F12: `DESIGN.md:526` is marked false and rewritten in item 8; the path list gives line 526.
- F13: case 22 is the builder's own run; the scratch scripts are marked as the brief writer's evidence.
- F14: `state/sources/repositories` and `state/client` are listed full; the diff subject's type goes in `state/system/machine/refactor/`.
- F15: item 4 and the path list name `compare-words.ts:46-55`, `Diff.svelte:119` and `answers.ts:245-259`.
- F16: item 9 and case 30a add the row of `tests/state/system/lsp/edits.test.ts`; the Doc text names G2.
- F17: item 4 names the read (text and hash from one read, up to the 5 MB constant of `data/file-ops.ts`) and its files; case 30b.
- F18: item 6 decides that the schema gives the one-text finding while both sources read and `checkRelationShapes` gives it otherwise; G64's test gains the row with people read.
- F19: raised as open item 15 (Axel's), recommended (a).
- F20: case 18 writes the engine address `catalogs/vocab.yml`.
- F21: refusals travel as the error's message and show at the caret (decision 2, items 3 and 4, Z735).
- F22: the transport turns a null `prepareRename` from any server into "The element can't be renamed." (items 2 and 4).
- F23: case 47.
- F24: verify item 6 greps `src config tests docs` and reads the new part.
- F25: (a) case 30c; (b) item 3 and case 23; (c) and (d) item 1 and case 38; (e) case 39; (f) case 40; (g) item 3 and case 23; (h) item 2 and case 44; (i) item 2 and case 45; (j) case 41; (k) item 4 and case 46; (l) item 2 and case 42; (m) item 1 and case 43; (n) case 30b.
- F26: item 1 indexes the options catalog's vocabulary fields; case 9b (Z735).
- F27, F28, F29, F30: O3's sentences rewritten as the report proposes, the limit a placeholder, the other-source refusal named, a sentence for unparsed text added, case 25 quotes the whole line.
- F31: verify item 3's `find` drops `bin`.

Dictated lines held, each ASCII with no dash: "{0} is a word of oculus's vocabulary in config/catalogs/vocab.yml, and oculus's code reads some of those words, so none of them is renamed here."; "{0} is larger than {1}, so nothing was renamed."; "In {2}, {1} would be read as something other than a key, so nothing was renamed."; "{0} has unsaved text that does not read as YAML, so nothing was renamed."
