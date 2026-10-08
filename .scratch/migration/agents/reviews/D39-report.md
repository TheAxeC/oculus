D39 round 1 is done: all seven items of the round brief are built and verified on the final tree, and nothing in the round brief is left undone. Two full-list runs were made this round, and every command of the second one passed.

Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D39, product code in tools/oculus. `$S` below is /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad. Every command ran in this turn with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` from tools/oculus unless a path is given.

## 1. NOT done, and what the orchestrator should know

- Not built, by ruling O1: the rename box's hint line "Enter to Rename, Cmd+Enter to Preview". Whether to build it is Axel's decision. The full look at what it takes is in section 7.
- Not looked at on a page: the cases only a page shows (1-9, 13, 14, 21, 23, 25, 29, 32, 33, 35, 36). They are checked by reading the code and by the vitest runs below. Section 7 names the view, the file and line, and what should be seen, for landing.
- `test:quick` time: the first full-list run printed `test:quick: 47.8 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`. The second printed `test:quick: 42.2 s (limit 45.0 s); every command passed`. The selection is 127 test files. The limit and the timeouts are untouched.
- `src/lib/server/machine/lsp/relay.ts` is 880 lines, exactly the limit (`wc -l` below).
- The G64 row of `relation-shapes.test.ts` passes on the unchanged tree. Quoted in section 3.
- Number of full-list runs this round: 2. The outputs quoted in section 4 are the second run's.

## 2. Open items, verbatim from `tools/oculus/.scratch/migration/orchestrator-state.md` ("Open items", read in this turn)

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

"None."

## 3. First run on the unchanged tree

### This round's rows on the unchanged tree

The unchanged tree is a scratch copy of `.agents/worktrees/D39-round0/tools/oculus` at `$S/r0/oculus`: rsync excluding `local.yml` and `node_modules`, a `cp -Rc` clone of the worktree's `node_modules`, and the four test files of this round copied over it. D39-round0 itself was not run in. Command: `npx vitest run tests/data/snapshot/rename.test.ts tests/server/machine/yaml/hub-keys.test.ts tests/ui/controls/editor/lsp-transport.test.ts tests/state/system/lsp/edits.test.ts`, output `$S/r0-out.txt`. Result: `Test Files  4 failed (4)`, `Tests  30 failed | 21 passed (51)`.

- **Item 1, checks moved to the prepare answer** (`tests/server/machine/yaml/hub-keys.test.ts`). Each row asks `textDocument/prepareRename` and gets null on the unchanged tree, where the test expects the sentence:
  - `refuses a rename over a text that does not read as YAML at prepareRename`: `AssertionError: expected null to be 'projects/active/beta/project.yml has unsaved text that does not read as YAML, so nothing was renamed.'` (hub-keys.test.ts:125).
  - `refuses a rename when a file is larger than the write limit, at prepareRename`: `expected null to be 'registries/venues.yml is larger than 5 MB, so nothing was renamed.'` (:137).
  - `refuses a rename when a file cannot be read as text, at prepareRename`: `expected null to be 'registries/venues.yml could not be read, so nothing was renamed.'` (:137).
  - `refuses a rename when a file is open in a tab of another window, at prepareRename`: `expected null to be 'registries/venues.yml is open in a tab of another window, so the language server's edit was not made.'` (:149).
  - `refuses a rename when a file lies in the hub secrets folder, at prepareRename`: `expected null to be 'secrets/leak.yml is outside the folders oculus serves, under a node_modules or dot folder, or in the hub's secrets folder or ~/.oculus, so the language server's edit was not made.'` (:159).
  - `makes the checks of prepareRename again at rename`: `expected null to be 'registries/venues.yml is open in a tab of another window, so the language server's edit was not made.'` (:165). The rename answer makes the check again.
- **Item 2, the two-source refusal from a definition** (same file, the planted hub with person `beta`, project `beta`, alpha's `waiting-on: [beta]`). `refuses a person key that a reference also names as a project, from its definition`: `AssertionError: expected null to be 'beta is a key of more than one source (people, projects), so nothing was renamed.'` (:115).
- **Items 1 and 2 in `tests/data/snapshot/rename.test.ts`.**
  - 20 of 25 rows fail on the unchanged tree with `TypeError: Cannot read properties of undefined (reading 'length')` at `refuseRename src/lib/data/snapshot/references/rename.ts:49:17`, called from `tests/data/snapshot/rename.test.ts:398:23`. The unchanged `refuseRename(hit)` takes one argument; the rows call `refuseRename(graph, hit, textOf)`.
  - The failing rows are the 6 `edits` rows and 14 of the `refuses ... at 'prepare'|'rename'` rows, including `refuses 'a person key that a reference also names as a project, started at its definition' at 'prepare'`, `refuses 'a file larger than the write limit' at 'prepare'`, `refuses 'a file that cannot be read' at 'prepare'` and `refuses 'an open tab whose unsaved text is not YAML' at 'prepare'`.
  - The 5 passing rows are the CRLF row and the `writes a new key %s` rows.
- **Item 3, the empty-message sentence** (`tests/ui/controls/editor/lsp-transport.test.ts`, which passes the catalog's real words):
  - `rejects prepareRename with the catalog sentence for a refusal with no words`: `Expected: "rejected: The language server refused this rename and gave no reason."`, `Received: "rejected: The language server's edit to {0} could not be made, so nothing was changed."` (:102).
  - `tells a refusal of rename as a notice with the catalog sentence for a refusal with no words, and answers the editor with no result`: expected notice `["lsp_edit_refused", "The language server refused this rename and gave no reason."]`, received `"The language server's edit to {0} could not be made, so nothing was changed."` (:152). The placeholder `{0}` is what a placeholder left in the sentence would show.
- **Item 4, the closed-file sentences** (`tests/state/system/lsp/edits.test.ts`, `names a closed file the page cannot read for the edit, and posts nothing`): `TypeError: Cannot read properties of undefined (reading 'length')` at `lineStarts src/lib/data/prose/text-edits.ts:46:32`, from `plan src/lib/state/system/machine/lsp/edits.ts:323:18`. The unchanged page takes the part's `'too_large'` answer for text.

### The passing run of `relation-shapes.test.ts` on the unchanged tree

From `$S/d39/firstrun-final.txt:73-75`:
```
=== tests/data/snapshot/relation-shapes.test.ts
 Test Files 1 passed (1)
 Tests 9 passed (9)
```
This is the G64 row, which guards that the one-text `waiting-on` finding survives the move to `from`. It has no failing line on the unchanged tree.

### The first build's runs of the cases on the unchanged tree

These outputs are carried from the first build's probe runs (`$S/d39/firstrun-base-out.txt`, `t0-base-out.txt`, `firstrun-final.txt`). They are not re-run in this round. The index, scan, build and lookup code is unchanged this round: `diff -rq` of the handed-back tree and the final tree lists only comment edits in `references/model.ts` and `references/scan.ts`, and code edits in `references/rename.ts`. The rename-side cases are covered by the rows above.

- **Initialize capabilities.** `definitionProvider` is present. `referencesProvider` and `renameProvider` are absent.
- **Cases 1-9, 9a, 9b, 9c, 12, 14** ran at 14 hub-key positions. Each of `definition: 'null'`, `Unhandled method textDocument/references` and `prepareRename: 'null'` printed 14 times over 14 `^case` lines. `textDocument/rename` at `registries/venues.yml:278` (`id: media`) gives `result: null`, as the brief predicted.
- **Cases that cannot run without the new code:**
  - 10, 11, 13, 15-29 and 38-47 need the index or the rename. The unchanged tree has no `src/lib/data/snapshot/references` folder.
  - 31-37 need the view, the store and the keys. `grep -rn "refactor-preview\|refactor_preview\|hub-key\|rename_preview\|bad_map\|lsp_edit_refused" src config` over the unchanged tree printed 0 lines.
- **Rules the brief got wrong:** none found.
  - Case 6b: `maps_to` is a reference in the scan (561 scanned in the radar) but a link only when its value names a project (506 resolve, 55 do not), as the brief says.
  - Case 9b: `Find References` on `manuscript` lists `engine/sources.yml:17`, `engine/layout.yml:134` and `engine/catalogs/vocab.yml:67`.

### Case results (carried from the first build's final-tree runs, `$S/d39/allcases-rerun.txt`, `allcases-rerun2.txt`, `case30-final.txt`, `transport-final.txt`)

- **1-8.**
  - Definition goes to the right file and range: `venue_id: media` to `hub/registries/venues.yml:279:8-13`, `pillar` to `pillars.yml:36:10-16`, `related: hccnet-fl` to the project's `id:` line 1:4-13, `person: "amir-haeri"` to `people.yml:19:10-20`, `affiliations` to `organisations.yml:14:10-30`, and the deck slide `hccnet-revision` to its manifest 1:4-19.
  - `waiting-on: [amir-haeri, btfno]` opens `people.yml:19:10-20` and `btfno/project.yml:1:4-9`.
  - Case 6b `maps_to: new-idea-candidate` is `null (forwarded)`.
- **9, 9a.** `heart` opens `domains.yml:13:10-15`, `utwente` opens `resources.yml:14:10-17`, `compute` opens `resources.yml:21:10-18`, `datasets` opens `data.yml:548:9-16`, and `funding: [FAIR]` opens `funding.yml:66:9-13`.
- **10.** Find References on `heart`: 10 places in 10 files, 11 with the declaration, including behavior.yml:26 and the vocab.yml map key line 52.
- **11.** `type: manuscript` opens `engine/catalogs/vocab.yml:70:21-31`. `focus: holding` is `null (forwarded)`.
- **12.** `title` gets the forwarded answer.
- **13.** `media`: 2 places in 2 files, from the definition and from a reference, same rows.
- **14.** Cmd+click on the identity scalar returns the definition at the same place (`pillars.yml:36:10-16`). The Peek is a look.
- **17.** `FAIR`: 9 places with the declaration; the comment in funding.yml:66 is not listed.
- **18.**
  - `18a` nothing open: 10 places.
  - `18b` the file open under the hub root with the heart line removed: 9 places and no vocab.yml entry.
  - `18c` the same file also open under the engine root: 9 places. The overlay is by real path, listed once.
- **19.** A repository's `.oculus/settings.yml` (another root) gives definition `null`, references `[]` and prepareRename `null`. The index never reads `config/local.yml`, `secrets/` or `~/.oculus`.
- **20.** After the server is up, settings requests: 0. Two builds with one schema set: difference 0. A build that changes the schema set gives 1 request.
- **21.** F2 on `media`, new key `media-x`: 3 files, 3 edits, annotation `{"hub-key":{"label":"media","description":"media-x","needsConfirmation":true}}`, versions `1` and `null`.
- **22.**
  - Quoting on real lines, each parsed again: `collaborators: [guichelaar, amir-haeri, van-den-berg]` to `amir-haeri-mc`, `person: "amir-haeri"` to `"amir-haeri-mc"`, `affiliations: ["university-of-twente"]` to `["utwente"]`, `key: FAIR                 # manifests ...` to `key: FAIR-NL                 # manifests ...`, the vocab.yml `heart:` map key line to `cardio:`.
  - `tensor` renamed to `a, b` is refused as `readback`.
  - `123`, `null`, `x: y`, `#x` are written `"123"`, `"null"`, `"x: y"`, `"#x"`.
  - The same lines are rows of G67 (`rename.test.ts`, 25 passed this round).
- **23.**
  - Prepare answers (shown at the caret), from the G67 rows `hub-keys.test.ts` and `rename.test.ts` (both passed in the second full-list run): a project id ("... is a project's folder name, so it is renamed by renaming the folder in Files."), a vocabulary value, a key standing twice, a key of two sources (from a reference and from a definition), a file over 5 MB, an unreadable or non-UTF-8 file, a file in a private folder, a file open in a tab of another window, and a tab whose unsaved text does not parse.
  - Rename answers (shown as a notice): an empty key, a key of white space only, "sciml is already a key of pillars, so nothing was renamed.", a person renamed to the project id `btfno`, a new key with a comma, and a file whose text moved so the edit does not read back.
  - All carry error code -32803.
- **24.** An organisation renamed to a resources key is allowed and returns a `documentChanges` edit.
- **25.** prepareRename on an anchor `&t` returns the range, and the rename on the anchor returns the YAML server's `changes` (2 edits). On the value `Hello` the server gives undefined, and the transport rejects a null answer with "The element can't be renamed." (the transport run: `25 null prepareRename -> rejected with "The element can't be renamed."`).
- **26.** A tab with unsaved text: `{"applied":true}`, tab edited, posts 0. A file open in a tab of another page: `{"applied":false,"notice":"lsp_edit_elsewhere","words":["hub/m.yml"]}`.
- **27.** A file changed on disk after the preview opened: Apply posts one write with the old hash, the server refuses it, the store's failed line is `lsp_edit_changed hub/m.yml`, the file on disk is unchanged and the preview stays pending.
- **28.** G68 `writes nothing on Apply when a planned tab was typed into after the preview opened`.
- **29.** Pillar `tensor`: 48 files and 48 edits (47 references plus 1 definition).
- **30, 30a-30c.**
  - 30, 30a: rows of `lsp-edit.test.ts` and `edits.test.ts`.
  - 30b: a rename over a closed 3,156,890-byte file gives 1 read and 0 writes before Apply, then 1 write after Apply; the history copy kept is kind `lsp-edit`.
  - 30c: a closed file written after the last build gives `{"applied":false,"notice":"lsp_edit_changed","words":["hub/moved.yml"]}`, 0 writes.
- **31-33.** G68 rows.
- **34-36.** Readings, section 7.
- **35.** Transport run: a rename without the mark gives the applyEdit preview flag `[false]`, with the mark `[true]`, and a mark followed by a prepareRename and a rename gives `[false]`.
- **38-41, 43.** G66 rows.
- **42.** Definition from the address `x:project.yml` goes to `hub/registries/pillars.yml:36:10-16`. References are 47 places, named under `x/project.yml:8:9-15`.
- **44.** After yaml-language-server failed twice (spawn attempts: 2): definition (`venues.yml:279:8-13`), references (3 places), prepareRename (`"media"`) and rename (3 files) still answer, and a forwarded hover gets `{"code":-32800,"message":"the server ended"}`.
- **45.** `documentChanges` versions are `1` for the open document and `null` for the closed files.
- **46.** Two tabs of one file: with the engine root as the hub's own config folder, tabs edited `["t1","t2"]`, posts 0. With a worktree config folder, tabs edited `["t1"]`, posts 0.
- **47.** Counts match the brief: venue_id 53, domain 94, pillar 122, funding 22, collaborators 57, related 70, datasets 58, compute 17, waiting-on 2, affiliations 20, person 13, events 6, education 10, applications 7, repos 5, radar 561 scanned (506 resolve: 376 `project` plus 130 `maps_to`), deck slides 22, `data_domains` 7, `slurm.resource` 1, vocab.yml `domains:` keys 12. Definitions: venues 71, datasets 54, pillars 9, domains 12, funding 3, people 19, organisations 8, resources 2 plus 1 cluster, projects 94; 145 files, `unparsed []`.
- **48.** The G28 rows of `hub-names.test.ts` (11 passed) and `held-unsaved.test.ts` (3 passed) pass in the second full-list run. With the engine root served from a worktree config folder the rail reorder is sent; with the engine root as the hub's own config folder it is refused with `app.file_unsaved`'s words and posts nothing.

## 4. DONE / NOT DONE, with the second full-list run's output as printed

| Round item | Done | Command and output |
|---|---|---|
| 1 Prepare-time versus rename-time refusals | DONE | `refuseRename` and `planRename` in `references/rename.ts`; `heldBack` and `refusalOfKey` in `adapters/yaml/hub-keys.ts`; `PageView.heldElsewhere` in `servers.ts`; head comment of `hub-keys.ts` lines 20-27; `hub-keys.test.ts` 11 passed, `rename.test.ts` 25 passed |
| 2 Definition-side two-source refusal | DONE | `sharedSources` in `rename.rs`-equivalent `rename.ts`; row `refuses a person key that a reference also names as a project, from its definition`, 11 passed |
| 3 Empty-message sentence | DONE | `lsp_rename_refused_empty` in `source.yml`; `renames.ts:60`, `transport.ts:641`; `lsp-transport.test.ts` 6 passed |
| 4 Closed-file sentences | DONE | `lsp_edit_too_large`, `lsp_edit_not_text`; `context.ts` read; `edits.ts:329-332`; `edits.test.ts` 9 passed |
| 5 Comments | DONE | `model.ts`, `references.ts` (catalog), `scan.ts`, `diff-read.ts`, `edits.ts`; `tests/checks/source/comment-width.test.ts` inside `test:checks` |
| 6 DESIGN.md | DONE | `grep -c "when it planned the edit" DESIGN.md` printed 1 |
| 7 Report | DONE | this message |

Full-list outputs (second run, after the last change):

1. `npm run diagrams`: exit 0, 22 lines (the script header, then the regenerated `docs/diagrams/*.dot` and `*.svg`, ending `docs/diagrams/channels.svg`, `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg`). Against the handed-back tree, four diagram files differ: `layers.dot` and `layers.svg` ("state to data" label 285 to 286) and `layer-state.dot` and `layer-state.svg` ("folder state/system to layer data" label 54 to 55). The added edge is `state/system/machine/lsp/edits.ts` importing `WRITE_MAX_MEGABYTES` from `data/file-ops.ts`.
2. `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`: exit 0.
```
test:quick: 98 changed file(s), from git since HEAD
test:quick: 127 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.7 s)
ok      eslint (6.6 s)
ok      svelte-check (5.8 s): 1791500686726 COMPLETED 437 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (41.6 s): Duration  37.63s (transform 47.27s, setup 0ms, import 86.52s, tests 58.03s, environment 377ms)
test:quick: 42.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```
3. `npm run test:checks` (G16-G27): exit 0, `Test Files  17 passed (17)`, `Tests  248 passed (248)`.
4. Scoped files, each `npx vitest run <file>` alone, exit 0 each (`$S/f-results.txt`):
   - references.test.ts 33 passed
   - rename.test.ts 25 passed
   - refactor-preview.test.ts 7 passed
   - routes/replace/lsp-edit.test.ts 11 passed
   - replace-undo.test.ts 2 passed
   - state/system/lsp/edits.test.ts 9 passed
   - relay.test.ts 5 passed
   - lifetime.test.ts 26 passed
   - versions.test.ts 2 passed
   - servers.test.ts 6 passed
   - uris.test.ts 29 passed
   - library.test.ts 36 passed
   - schema-rules.test.ts 7 passed
   - relation-shapes.test.ts 9 passed
   - config.test.ts 31 passed
   - config-folder.test.ts 25 passed
   - catalog/options.test.ts 3 passed
   - integrity.test.ts 8 passed
   - diff-read.test.ts 4 passed
   - present.test.ts 4 passed
   - hub-names.test.ts 11 passed
   - held-unsaved.test.ts 3 passed
   - sessions/source.test.ts 25 passed
   - machine/yaml/hub-keys.test.ts 11 passed
   - ui/controls/editor/lsp-transport.test.ts 6 passed
5. ASCII gate: the `perl` command over `src tests config` (excluding `local.yml`) printed nothing, `perl-ascii exit 0`. `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/*.md ../../docs/DATA-MAP.md` printed nothing, `grep-ascii exit 1` (no hit).
6. `sh utils/folder-check.sh`: printed nothing, exit 0.
7. `wc -l`:
   - Largest source files: relay.ts 880, transport.ts 874, context.ts 840, servers.ts 793, edits.ts 439.
   - Largest Svelte component: Diff.svelte 520 (the limit).
   - Every other file of the step is at or under 863 (largest unchanged this round: repositories.ts 863, ops.ts 857).
8. `sh utils/unused-exports.sh`: exit 0, 364 lines; `diff` of its sorted output against the sorted `.agents/worktrees/D39-base/tools/oculus/unused-exports.txt` printed nothing (364 lines). The step adds no line to the list. `WRITE_MAX_MEGABYTES` is used by `hub-keys.ts` and `edits.ts`.
9. `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/text/views/sources/source.yml`: exit 0. The other changed `.yml` files are unchanged this round (`diff -rq` of round 0 and now lists only `source.yml`).
10. `grep -n "no formatting and no rename" docs/files-and-search.md` printed nothing (exit 1). `grep -n "Audit, \`collections\`" ../../docs/DATA-MAP.md` printed 4 lines, all `link` rows (285, 291, 292, 293); the count of those lines not containing the `link` cell is 0. `grep -rn "no_waiting_on" src config tests docs --exclude=local.yml` printed nothing (exit 1).
11. History-words grep (spec.md:42's words plus package ids and years) over the lines added or changed this round (`$S/f-added.txt`, 593 lines: the diff of each changed file against the handed-back tree, and the two new test files whole). 7 hits, each judged:
    - DESIGN.md hit 1 ("a tab ... before"), `files-and-search.md` ("shows at the caret, before the box opens") and `rename.ts` ("before a new key is asked"): the order of operations in the running feature.
    - `edits.ts` ("posted before any tab is touched"): the order inside the function.
    - `edits.ts` ("its text no longer matches the positions of its edits") and `edits.test.ts` ("a file that no longer holds the key"): a runtime state of a file against an edit.
    - `lsp-transport.test.ts` ("or still pending"): the state of a request.
    - None compares with an earlier state of the code or names a package, date or reverted attempt.
12. Cases: section 3. Documents: section 8.

The tree has no scratch left: `ls tests` prints `checks data fixtures routes server shell state tiers ui views`, and `tests/_scratch` does not exist.

## 5. Files changed this round, tests, and assertions

Line counts, handed-back tree to now:
- config: `source.yml` 147 to 150.
- docs: `DESIGN.md` 586 to 586, `docs/files-and-search.md` 121 to 121.
- data: `file-ops.ts` 367 to 370, `prose/text-edits.ts` 228 to 231, `references/model.ts` 95 to 95, `references/rename.ts` 169 to 204, `references/scan.ts` 287 to 286, `catalog/schemas/references.ts` 124 to 123.
- server: `adapters/yaml/hub-keys.ts` 237 to 277, `held/answers.ts` 74 to 90, `relay.ts` 879 to 880, `servers.ts` 791 to 793.
- state: `client/context.ts` 839 to 840, `lsp/edits.ts` 428 to 439.
- ui and views: `transport/renames.ts` 88 to 90, `transport.ts` 874 to 874, `diff-read.ts` 162 to 161.
- tests: `rename.test.ts` 372 to 405, `edits.test.ts` 282 to 306, `tests/server/machine/yaml/hub-keys.test.ts` NEW 183, `tests/ui/controls/editor/lsp-transport.test.ts` NEW 156.

What each change is:
- `rename.ts`: `refuseRename(graph, hit, textOf)` makes every check that needs no new key (`twice`, `sources`, `project`, `vocab`, the shared source from a definition, `unparsed`, and per file `unread` and `large`). `planRename` calls it first, then makes `empty`, `exists` and per file `readback`. The `sources` refusal lists the sources of the targets and of every other definition a reference to them also resolves to.
- `hub-keys.ts`: `prepareRename` answers `refusalOfKey` (`heldBack` for a file in a private folder or a tab of another window, then `refuseRename`). `rename` makes the same checks again and then `planRename`'s. The head comment says which refusal shows at the caret and which as a notice.
- `servers.ts`: `PageView.heldElsewhere(real)`. `held/answers.ts`: `Answering.pages`, its `heldElsewhere` over `Page.tabs`, and a strict UTF-8 read (`TextDecoder('utf-8', { fatal: true })`), so a non-UTF-8 file is `unread`. `relay.ts`: `#givenBy` passes `pages`.
- `file-ops.ts`: `WRITE_MAX_MEGABYTES`, derived from `WRITE_MAX_BYTES`. `text-edits.ts`: `lsp_edit_too_large`, `lsp_edit_not_text` and `lsp_rename_refused_empty` joined to `LSP_EDIT_NOTICES` (held to catalog keys by G24 in `test:checks`).
- `context.ts`: the page's `read` returns null, `'too_large'`, `'not_text'` or `{ text, hash }`. `edits.ts` refuses a closed file with the matching sentence. For an immediate edit the hash of a closed file is read when the page plans the edit: `plan` reads the text and the hash of a closed file in one call (`edits.ts:327-337`), and `commit` posts that hash, which the server checks.
- `transport.ts:641` and `renames.ts:60`: an empty server message becomes the catalog's `lsp_rename_refused_empty`.

Corrections to the first report:
- `core/paths.ts` gained `under`, and `library/rules.ts` and `machine-file.ts` use it from there, because `server/files/fs/lsp-edit.ts` may not import `server/machine/lsp/library/rules.ts` under the server folder order of `tests/checks/imports/order.ts` (`server/core` is last).
- `tests/state/sessions/source-server.ts` gains `roots` (not `kept`): the `server()` options type now picks `'rules' | 'kept' | 'roots'` and `roots: options.roots ?? (() => [])` fills the dependency. `kept` was already there.
- `server/root/context.ts` has two changes: line 257 adds `catalog: () => textCatalog(make.loadConfig(engine).config)` and line 327 changes `schemas: (set) => schemas.publish(set)` to `schemas: (set, references) => schemas.publish(set, references)`.

Tests added or changed this round, with the unchanged-tree failure in section 3:
- `tests/server/machine/yaml/hub-keys.test.ts` (G67, new): 11 tests.
  - Rows: `gives the key and its range when nothing refuses it`, `refuses a project id at prepareRename, with its sentence`, `refuses a person key that a reference also names as a project, from its definition`, `refuses a rename over a text that does not read as YAML at prepareRename`, `refuses a rename when a file %s, at prepareRename` (two rows: over the write limit, not readable as text), `refuses a rename when a file is open in a tab of another window, at prepareRename`, `refuses a rename when a file lies in the hub secrets folder, at prepareRename`, `makes the checks of prepareRename again at rename`, and a two-row `it.each` of refusals that depend on the new key (answered by `rename`, not `prepareRename`).
  - The secrets-folder row hand-adds a scan of `secrets/leak.yml` to the index, since the index never reads that folder.
- `tests/ui/controls/editor/lsp-transport.test.ts` (G67, new): 6 tests. They cover a refusal with the server's sentence, with no words, and a null range at prepareRename; a cancelled prepareRename (no refusal, no notice); and a rename-time refusal as the `lsp_edit_refused` notice with `result: null`, with the server's words and with the catalog sentence for none. They use the real catalog words from `config/text`.
- `tests/data/snapshot/rename.test.ts` (G67): the refusal rows gain a `when` column (`'prepare'` or `'rename'`). A `prepare` row asserts that `refuseRename(graph, hit, textOf)` returns the refusal. A `rename` row asserts that it returns null and `planRename` refuses.
  - `prepare` rows: unparsed tab, key of two sources (from a reference), person-and-project key started at its definition, project id, vocabulary value, key standing twice, file over the write limit, file that cannot be read.
  - `rename` rows: empty key, white space only, key already in the source, key already in another source, comma, file whose text moved.
- `tests/state/system/lsp/edits.test.ts` (G67, G9): new row `names a closed file the page cannot read for the edit, and posts nothing`. It asserts `lsp_edit_too_large` with words `['hub/sub/b.py', '5']` and `lsp_edit_not_text` with words `['hub/sub/b.py']`, each with no tab edit and no post. The `page()` helper gains a `read` option; the other rows are unchanged.
- No existing assertion was changed.

## 6. Doc text for `agents/guarded.md`, by id

- **G66, G68, G2, G8, G9, G28, G64:** the Test and Code lines given in the first report stand unchanged by this round, except the additions below.
- **G67 Test line gains:**
  - `tests/server/machine/yaml/hub-keys.test.ts`, describe 'the answer to prepareRename and rename of a hub key', all 11 rows.
  - `tests/ui/controls/editor/lsp-transport.test.ts`, describe 'a rename a server refused', all 6 rows.
  - `tests/state/system/lsp/edits.test.ts`, 'names a closed file the page cannot read for the edit, and posts nothing'.
  - The `rename.test.ts` refusal rows now read 'refuses $name at $when and plans no edit', each of the listed rows with its `when`.
- **G67 Code line gains:** `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts` (`heldBack`, `refusalOfKey`), `src/lib/server/machine/lsp/held/answers.ts` and `servers.ts` (`PageView.heldElsewhere`), `src/lib/ui/controls/editor/kit/lsp/transport.ts` and `transport/renames.ts` (the empty-message sentence), and `src/lib/state/system/machine/lsp/edits.ts` (the closed-file sentences).
- **G9 Test line gains:** `tests/state/system/lsp/edits.test.ts`, 'names a closed file the page cannot read for the edit, and posts nothing' (the over-the-limit half).
- **G67 widened sentence, replacing the one in the first report.**
`- G67. Renaming a hub key changes every reference to it and the entry's own key, keeps each value's quoting (a key that would read back as something else is written double-quoted) and every line end, changes no other byte, and edits an alias's anchor once. It refuses, writing nothing: a tab whose unsaved text does not parse, a project id, a vocabulary key, a key that stands twice in its source, a file over the write limit, a file that cannot be read as text, a file in a private folder, a file open in a tab of another window, and a key of two sources a field takes together, which holds from a reference and from the definition; these need no new key, so they are the answer to `prepareRename` and show at the caret, and the answer to `rename` makes every check again. It also refuses an empty key or one of white space only, a key that exists in the key's source or in another source a field takes together with it, a new key that does not read back as a key and a file whose text moved since the index was built; these depend on the new key, so they are the answer to `rename` and show as a notice. A server's refusal with no words shows the catalog's sentence for it, and a closed file the page cannot read whole is refused with a sentence that says it is too large or not UTF-8 text.`
- **Open item 15's other widened sentences:** the G66 and G68 sentences of the first report are unchanged by this round.

## 7. Case 37, the hint line, judgment calls, and visible changes

### Ruling O1: the look at the rename box's hint line (nothing built)

The hint line is the label of Monaco's rename box. Every file named is under `tools/oculus/node_modules/monaco-editor/esm/vs`.
- **What draws it.** `renameWidget.js:174-175` writes the label "{0} to Rename, {1} to Preview", with the keys of `acceptRenameInput` and `acceptRenameInputWithPreview`. `renameWidget.css` hides the label (`.rename-label { display: none }`) unless the box has the class `preview`, which `renameWidget.js:254` sets from `supportPreview`. `rename.js:218` computes `supportPreview` as `this._bulkEditService.hasPreviewHandler() && the editor.rename.enablePreview setting`. The setting defaults to true (`rename.js:457-461`). With the class, the box also gets `padding: 4px 4px 0 4px`.
- **Why it is not drawn today.** The standalone editor's bulk-edit service is `StandaloneBulkEditService` (`standaloneServices.js:513`), and its `hasPreviewHandler()` returns false (`:518-520`). The box is drawn without the `preview` class, so no hint line is drawn.
- **Where an override goes.** `StandaloneServices.initialize(override)` takes the override once, from the first editor created (`standaloneEditor.js:44`: `create(domElement, options, override)` calls `StandaloneServices.initialize(override || {})`). In oculus the override goes in the third argument of `monaco.editor.create` at `src/lib/ui/controls/editor/Editor.svelte:218`, and only the first editor created in the page applies it. The diff editor's `createDiffEditor` at `diff/DiffEditor.svelte:187` takes no such argument.
- **What it is.** An `IBulkEditService` implementation whose `hasPreviewHandler` returns true and whose `apply(edits, options)` routes to the Refactor Preview when `options.showPreview` is set (`rename.js:249-251` passes `showPreview: inputFieldResult.wantsPreview`), else applies as `StandaloneBulkEditService.apply` does (`standaloneServices.js:521`). It is registered under `IBulkEditService` (created by `createDecorator('IWorkspaceEditService')` in `editor/browser/services/bulkEditService.js:9`). That identifier is not in Monaco's public API, so oculus would import it from `monaco-editor/esm/vs/...`; `grep` over `src` finds no such deep import today.
- **What else it changes.**
  - Monaco binds its own preview key, `acceptRenameInputWithPreview` on Cmd+Enter (`rename.js:361-368`), and the box shows "Enter to Rename, Cmd+Enter to Preview" on macOS. The binding duplicates oculus's `oculus.renameWithPreview` action (`client.ts:311-322`, also Cmd+Enter), so one of the two would be dropped.
  - Every rename of every language then calls the override's `apply`, not Monaco's standalone one.
  - A rename from a language server whose edit has no annotation would be applied by `apply` itself, as now, unless the reader presses the preview key.
  - The override is taken only by the first editor, so it must be passed by whichever editor is created first.
- **Decision.** Building it is Axel's. Without it Cmd+Enter in the box still previews (`client.ts:311-322`, named in `HELP.md:81` and `docs/files-and-search.md`) but the box carries no label naming it.

### Case 37 by id (ids unchanged, `grep -rn "refactor-preview" src config` finds the same three lines as in the first report)

- View id `refactor-preview`: defined at `state/system/machine/refactor/preview.svelte.ts:21`, registered with `group: ''` and `listed: false` at `RefactorPreview.svelte:10`, root element `data-view="refactor-preview"` at :178.
- New catalog keys this round, in `config/text/views/sources/source.yml`: `lsp_edit_too_large`, `lsp_edit_not_text` and `lsp_rename_refused_empty`, each read in code (`edits.ts:330-332`, `renames.ts:60`, `transport.ts:641`) and held by G24 (`test:checks` passed, 248 tests).
- Annotation id `hub-key` (`text-edits.ts` `RENAME_ANNOTATION`): one constant.
- Where a rename refusal shows (matching `rename.js:241-243`, where Monaco and VS Code show a rename-time reason as a notification):
  - A refusal that needs no new key is the answer to `prepareRename`. The transport's `Settling` rejects with the sentence, which Monaco shows at the caret.
  - A refusal that needs the new key is the answer to `rename`. The transport posts the notice `lsp_edit_refused` and answers the editor with `result: null`.
  - A cancelled request (-32800) gives neither. A null prepareRename gives "The element can't be renamed." for every server.
  - An empty message from a server shows `lsp_rename_refused_empty` in both positions (`lsp-transport.test.ts`, 6 passed).

### Cases 34-36 as readings (unchanged by this round)

- **34.** `createRefactor` holds the pending preview in memory, so after a reload `pending()` is null and `RefactorPreview.svelte:176-180` draws the `Empty` line "Invoke a code action, like rename, to see a preview of its changes here."; nothing was written.
- **35.** `client.ts:311-322` binds `CtrlCmd+Enter` on `renameInputVisible`, sets `#preview` and triggers `acceptRenameInput`. The transport run shows the flag reaches `applyEdit`.
- **36.** `RefactorPreview.svelte:68` `compare(file, line)` is called from the row at :112 and the file row at :149. `diff-read.ts` adds the preview revision to the pane's read key, so unchecking an edit changes the diff (`diff-read.test.ts`, 4 passed).

### Judgment calls

1. The options catalog files the index reads are `behavior.yml`, `layout.yml`, `sources.yml`, the config `present.yml` and `catalogs/vocab.yml`; `slide_tags` has no definition list, so it gives no references.
2. The preview key is `CtrlCmd+Enter` (O1).
3. The schema attribute is `map` (Z735, O2).
4. `listed`/`listedFields` make the schema own the shape finding of `waiting-on` when both `from` sources read, and `validate.ts` still gives it while a source is unread.
5. `lsp_edit_outside` words name the private folders.
6. The index holds unresolved values as scanned candidates, and navigation and Find References act on the ones that resolve.
7. This round: "private folder" and "tab of another window" at prepare time are answered by the relay (`heldBack`) with the existing catalog sentences `lsp_edit_outside` and `lsp_edit_elsewhere`, so no new sentence was needed. "Not text" at prepare time is a non-UTF-8 disk read, which is the `unread` refusal ("could not be read"); the page-side sentence `lsp_edit_not_text` says it for a closed file the page itself reads at plan time. The private-folder check is defensive, since the index never reads those folders.

### Visible changes, before and after (all for landing)

- **Hover and Cmd+click (cases 1-9).** In `projects/manuscripts/btfno/project.yml`, hold Cmd (Ctrl) over `tensor` in `pillar: [tensor, sciml]` (line 8). Before: no underline, the click does nothing. After: the whole word `tensor` is underlined and the click opens `registries/pillars.yml` at line 36 with the whole key selected.
- **References rows (case 13).** In `registries/venues.yml` on `id: media`, run Find All References. Before: "Unhandled method". After: the References view lists `2 results in 2 files`, each row ending in the whole key.
- **Peek (case 14).** In `registries/pillars.yml`, Cmd+click on `key: "tensor"` (line 36). Before: nothing. After: Peek opens with the references.
- **Refusals at the caret (cases 23, 25), new split.**
  - F2 on `hccnet-fl` in a `related` list: the box does not open and the caret shows "hccnet-fl is a project's folder name, so it is renamed by renaming the folder in Files."
  - The same holds for a vocabulary value (`manuscript`), a key standing twice, a key of two sources (from a reference or from `key: beta` in `registries/people.yml` when `beta` is also a project id), a file over 5 MB or not UTF-8 text, a file in a private folder, a file open in a tab of another window, and a tab with unsaved text that does not parse.
  - F2 on a `title:` value shows "The element can't be renamed."
  - Before: F2 did nothing, or reached the YAML server's own rename.
- **Refusals after the key is typed (case 23).** F2 on `media`, then an empty key, `sciml` or a key with a comma: the box closes and a notice names the reason. Before: nothing renamed and no reason.
- **Empty server refusal.** A language server that refuses a rename with no message now shows "The language server refused this rename and gave no reason." at the caret (prepare) or as a notice (rename). Before: the sentence "The language server's edit to {0} could not be made, so nothing was changed." with its `{0}` showing.
- **Closed file the page cannot read.** An accepted rename whose edit names a closed file larger than 5 MB shows "<file> is larger than 5 MB, so the language server's edit was not made." and a closed file that is not UTF-8 text shows "<file> is not UTF-8 text throughout, so the language server's edit was not made." Nothing is written.
- **Preview look (cases 21, 29, 32, 33, 36).** On `media` press F2, type `media-x`, press Enter. After: the Refactor Preview opens with each file and its edits as checkable rows, a press on an edit row opens the diff of that file with the checked edits, and nothing is written until Apply. Apply writes the checked edits and History shows one record "Edited by a language server in N files"; Undo puts every file back. A second rename shows "Another refactoring is being previewed." with Continue and Cancel.
- **Rename box (case 35).** Cmd+Enter (Ctrl+Enter elsewhere) in the box opens the Refactor Preview. The hint line is not drawn (ruling O1, above).
- **Write limit.** An edit from a language server to a file between 256 KB and 5 MB is written with its copy kept. A file in the hub's `secrets` folder or `~/.oculus` is refused with `lsp_edit_outside`.

## 8. Documents and head comments read against the change

- `tools/oculus/DESIGN.md:576`: now "the SHA-256 of the bytes the page read when it planned the edit" (`grep -c "when it planned the edit" DESIGN.md` printed 1).
- `tools/oculus/DESIGN.md`, the Rename bullet: rewritten to say which refusals are the `prepareRename` answer and show at the caret (`refuseRename` for the index and open texts, the relay's `heldBack` for private folders and tabs of another window), that the two-source refusal holds from a reference and from a definition, that `rename` answers the refusals that need the new key (`empty`, `exists`, `readback`) and makes every check again, that the transport shows the first as the caret error and the second as `lsp_edit_refused`, that an empty server message shows `lsp_rename_refused_empty`, and that a closed file the page cannot read whole gives `lsp_edit_too_large` or `lsp_edit_not_text`.
- `tools/oculus/docs/files-and-search.md`, the refusal paragraph (line 95): rewritten to the same split, with the new reasons listed. `HELP.md:81`, `docs/views.md:73` and `docs/apps.md` say nothing about where a refusal shows (`grep -n -i "rename" HELP.md docs/views.md docs/apps.md ../../docs/DATA-MAP.md | grep -i "refus\|cannot be made\|notice\|caret"` printed only `HELP.md:81` and `docs/views.md:73`, which describe F2 and the preview); they are unchanged.
- Head comments rewritten this round: `hub-keys.ts` (lines 20-27: prepare versus rename), `references/rename.ts`, `held/answers.ts`, `edits.ts` (the head paragraph rewrapped, with the bullet on the closed-file refusals), `scan.ts` (lines 12-14 rewrapped to 100 columns), `diff-read.ts` (line 4 rewrapped), `references/model.ts` (`OptionFile` and `ReferenceIndex` each have their own doc comment), `catalog/schemas/references.ts` (the stale doc comment above `familyNode` is removed), and the head of `edits.test.ts` and the heads of the two new test files. `awk 'length($0)>100'` over the edited files printed nothing, and `tests/checks/source/comment-width.test.ts` passed in `test:checks`.
- Heads of the other changed files are unchanged since the first report.

Files read-only copied for the review, `.agents/worktrees/D39-round0/tools/oculus`, were not changed; the unchanged-tree runs of section 3 were made in the copy under `$S/r0/oculus`.
