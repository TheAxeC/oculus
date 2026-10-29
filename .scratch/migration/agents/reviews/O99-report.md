Not done after repair round 2: the launch rows of round 1's item 10 have no run that fails before the change (section "Repair round 1", item 10); the "Table of changed test lines" is round 0's and is not regenerated for the repair rounds (its lead says which sections name their test lines). Both items of round 2 are done and the full verify list passes (section "Repair round 2").

# O99 builder report

Worktree `.agents/worktrees/migration-O99`, base `a5281619a`. Every command below ran from the root of the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The notes named below are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o99notes/`.

Three points to read before the rest, each detailed below: the merge of the five shipped service lists has no test row, since G126's text does not name those lists and a widened entry is Axel's (section "Anything in the brief that was wrong or impossible"); the first Verify 1 run failed one slow test by its 20000 ms limit and the second run passed with no source change in between (section "Verify 1"); the "Hub text" line ranges were re-read in round 1 from the hub's `.oculus/config.yml` with `grep -n` and `sed -n`.

## Open items of the state file, verbatim

From the worktree's `.scratch/migration/orchestrator-state.md`, read in repair round 2 as this report was written, `awk 'NR>=166 && NR<=169'`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry. Open items 545, 548 and 550 are not in this copy of the file; their rulings reached this step as messages and are quoted below.

## Rulings this step was built under

- Round 0, `agents/briefs/O99-cases.md`: ruling 1 (case 2 uses `literature.prefer`), ruling 2 (where each of `key_none`, `key_two`, `key_beside` and `key_missing` writes its primary key), ruling 3 (case 7's test waits on 545), ruling 4 (a page with no `views` key was given no view).
- 545 (a), verbatim: "G76 is widened to a `downloads` secret of a hub's `.oculus/local.yml` written through Settings: no route answer, config or workspaces channel push, History record or log holds its value. Write the test rows under G76, one per unit its Code will name (the Settings write route, the History record, the machine-values answer), each run on the unchanged tree first as the brief's Verify 5 says, with a made-up secret. G76's new text and Code line go in your report's "Doc text" for `agents/guarded.md`; you do not edit guarded.md. Everything else stands." The rows are in `tests/routes/hubs/settings-secrets.test.ts`; G76's text is under "Doc text".
- 548 (a) and 550 (a), as the round-2 message gives them: "548 (a), the control word `scalar` for `reader_value`'s `value`, and 550 (a), the base's cluster pick of This machine built again as a row of the Settings view's other rows." Built under "Repair round 2", items 1 and 2.

## The cases' first run (on the unchanged tree)

The first run was made before any code changed and handed back in round 0 (its text is kept in `o99notes/handback0.txt`). The merge cases ran through a case-run program, `rows.ts` in the scratchpad, which called `loadConfig(<tree>, { hub })` over scratch hubs under `$TMPDIR` and printed only:

```
case 18 literature.sources []
case 18 recover.sources []
case 18 links []
case 18 sign_in []
case 18 connections.failures []
case 18 recover.node_download ""
case 18 clusterKeySettings {"keyType":"","keyFile":""}
case 19 [{"key":"openalex","name":"Renamed"},{"key":"extra","name":"Extra"}] []
case 20 [{"key":"doi","removed":true}] []
case 30 [{"key":"doi","removed":true},{"key":"doi","address":"https://doi.org/{id}"}] []
case 31 ["Mine"]
```

| Case | Result on the unchanged tree | Evidence |
|---|---|---|
| 1 | Fails: no scope, a toggle written as it is changed | `grep -rln scope` over the Settings view and `state/system/config` hits only `editors/Cards.svelte`; `Settings.svelte:21-24` |
| 2 | Wrong under the brief's rules (hand-back A, ruled) | `grep -n "'literature\." src/lib/data/helpers/hub-names.ts` prints only `757: literature.sources` and `758: literature.prefer`; the program `c2.ts`: `hub file: value 20 ["literature.timeout_s: key literature.timeout_s is not one the hub's settings file takes; it is not applied"]`, `workspace file: value 33 []` |
| 3, 4 | Fail: no scope or picker; the per-row hub pick lists `roots()` hubs | `Settings.svelte:137-160` |
| 5 | Fails: no first-change name question | `grep -n unsaved` over `config-value.ts` and `config-write.ts` prints nothing |
| 6 | Fails: Save All reaches only the source tabs | `context.ts:734` `saveAll: autosave.saveEvery`; `menu-answer.ts:67` |
| 7, 8 | Fail: the Settings writers refuse `local.yml` | `config-value.ts:217` `if (file === LOCAL_NAME) return refuse(...)` |
| 9, 10, 11 | Fail: a missing value and an undrawn shape show EditLink | `Control.svelte:118-121`, `:136-139` |
| 12 | Fails: eleven values kept as text | O97 report lines 27-39 |
| 13 | Fails: only Add Configuration and Open launch.yml | `Debug.svelte:15-23` |
| 14 | Fails: `cpp.yml` has no form | `LanguageItems.svelte:15-24` |
| 15 | Fails: only the order and the groups are edited | `Slides.svelte:17-24` |
| 16 | Fails; `key_missing` wrong under the brief's rules (hand-back B, ruled) | `findings.yml:335`; `model-collections.ts:138` |
| 17 | A view case, for the look at landing | `LineCounts.svelte:123-135` |
| 18, 19, 20, 30, 31 | Fail | the program's output above |
| 21, 22, 22a, 35, 36 | Fail: `registries` lacks `venues-browser`, no `views` record | `config/defaults/layout.yml:125-133`; `grep views saved/saved.ts` prints nothing |
| 23 | Fails: the grep prints `behavior.yml` 79, 84, 88, 91, 251, 268 and `read.ts:5` | the grep of case 23 |
| 24 | Fails: no secret box | `Item.svelte:263-304` |
| 25, 26, 32, 33, 34 | Fail: no held changes, no scopes | Settings head comment |
| 27 | Fails: no folder rename | `folders.ts` |
| 28 | Partly holds: `config-value` refuses a changed base | `config-value.ts:238` |
| 29 | Fails: no scope to say it in | Settings head comment |

## The cases after the change

The view cases are for the look at landing ("Host-visible changes" below). The runs and tests that check the behaviour:

- Cases 18, 19, 20, 30, 31: `rows.ts` run again on the worktree (`node rows.ts <worktree>`; output saved in `o99notes/rows-after.txt`; the program and its scratch hubs are deleted):
  ```
  case 18 literature.sources ["openalex","semantic_scholar","crossref","pubmed","europe_pmc","arxiv","wos","scopus"]
  case 18 recover.sources ["dandi","figshare","geo","huggingface","kaggle","physionet","stanford","synapse","tcia","url","zenodo"]
  case 18 links ["doi","arxiv","arxiv_pdf","pubmed","europepmc","scholar","shellcheck"]
  case 18 sign_in ["google","microsoft","github"]
  case 18 connections.failures ["Key refused","Unknown host","No route to the cluster","Host key not trusted","Git sign-in refused","Git key refused"]
  case 18 recover.node_download "https://nodejs.org/dist/"
  case 18 clusterKeySettings {"keyType":"ed25519","keyFile":"~/.ssh/id_{type}_{resource}"}
  case 19 keys [('openalex', 'Renamed'), ('semantic_scholar', 'Semantic Scholar'), ('crossref', 'Crossref'), ('pubmed', 'PubMed'), ('europe_pmc', 'Europe PMC'), ('arxiv', 'arXiv'), ('wos', 'Web of Science'), ('scopus', 'Scopus'), ('extra', 'Extra')] findings []
  case 20 keys ['arxiv', 'arxiv_pdf', 'pubmed', 'europepmc', 'scholar', 'shellcheck'] findings []
  case 30 keys ['doi', 'arxiv', 'arxiv_pdf', 'pubmed', 'europepmc', 'scholar', 'shellcheck'] findings ["links: links names doi in more than one entry; none of them is applied and oculus's entry stands"]
  case 31 ["Mine","Key refused","Unknown host","No route to the cluster","Host key not trusted","Git sign-in refused","Git key refused"]
  ```
- Cases 21, 22, 22a, 35, 36: the case-run program `views.test.ts` (`ENGINE=<worktree> OUT=o99notes/views-final.txt npx vitest run --config <scratch>/case.config.mts tests/views.test.ts`, 1 passed; deleted after). `*` marks a pinned tab:
  ```
  case 21 given ["venues*,venues-browser*,data*,statements*,people*,organisations*,resources*"]
  case 21 record ["venues","data","statements","people","organisations","resources","venues-browser"]
  case 21 closed, given nothing again: true
  case 22 no record ["venues*,venues-browser*,data*,statements*,people*,organisations*,resources*"]
  case 22 record ["venues","venues-browser","data","statements","people","organisations","resources"]
  case 22 a second pass changes nothing: true
  case 22a every view recorded, nothing added: true
  case 35 two panes ["data*,statements*,people*,organisations*,resources*","venues*,venues-browser*,notes"]
  case 22 record written: ["venues","venues-browser","data","statements","people","organisations","resources"]
  case 36 read: ["venues","data"] pages 1
  ```
  Case 36 is also the G29 row 'rail pages: the views a rail page records, an empty and a repeated entry left out' of `tests/state/workbench/layout/saved/layout-saved.test.ts`: base 1 failed of 7 (`Expected [['venues','data'],undefined,undefined], Received undefined`), here 7 passed.
- Cases 9, 10, 11: the probe `draws.test.ts` over the shipped config (`ENGINE=<worktree> npx vitest run --config <scratch>/case.config.mts tests/draws.test.ts`; output saved in `o99notes/draws-final.txt`; deleted after). Of every Settings row written whole, only the rail draws no generic editor, and it has its own (RailEditor):
  ```
  NODRAW layout.yml:rail family set false null
  whole rows 78 of 214
  findings []
  ```
  That run reports one failed test only because the repository's vitest setup asks every test for an assertion and the probe makes none.
- Cases 7 and 24 (G76): `tests/routes/hubs/settings-secrets.test.ts`; base `Error: Cannot find module '../../../src/lib/data/shapes/config-save.ts'`; here its 4 rows pass (in the batch run and in Verify 1).
- Case 12 (G138): `tests/state/system/config/sparse-card.test.ts`, describe "a reader row's values at any depth, each drawn by a control of its own": base 17 failed and 15 passed of the file (the 6 'draws every value of ...' and 11 'saves ... changed' rows fail); here every row passes.
- Case 13: `tests/routes/machine/debug.test.ts`, the rows 'changes only the keys an edit names, every other line of the file kept byte for byte', 'writes an edited configuration in its place with the comments kept, lists it and undoes it' and 'takes a deleted configuration out, lists the delete and undoes it': base `AssertionError: expected [ 400, ...(1) ] to deeply equal [ 200, ...(1) ]`, 3 failed and 6 passed; here 9 passed.
- Case 14: `tests/routes/machine/cpp.test.ts`; base `Error: Cannot find module '../../../src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts'`; here 4 passed.
- Case 15: `tests/routes/edit/deck-slides.test.ts`, describe "writing a deck's keys": base 2 failed; here every row passes.
- Case 16: `tests/routes/docs/primary-key.test.ts`, the four findings and the choices row; base `Error: Cannot find module '../../../src/lib/server/edit/primary-key.ts'`; here 6 passed.
- Cases 1, 7, 8, 27, 28 (G8, G9): `tests/routes/edit/undo/config-save.test.ts`; base `Error: Cannot find module '../../../../src/lib/data/shapes/config-save.ts'`; here 11 passed. Its describe 'every byte of a scope file that a save does not change is kept' (a `local.yml` with a comment, a block row and a flow row, and a repository `settings.yml` with a flow entry and a block entry) checks the whole text after the save and after its undo.
- Case 23: `grep -n "ships none\|ships neither" config/defaults/behavior.yml src/lib/data/sources/config/settings/rows/read.ts` prints nothing (exit 1).
- Case 29: `tests/state/system/settings/machine-section.test.ts`, 'says why every row writes nothing while the file $name', and `hub-scope.test.ts`, "names lab's file and the line in the sentence of a lab file that does not parse".
- Case 34: `machine-section.test.ts` and `hub-scope.test.ts` hold the scope rows; the Repository scope draws `editor.languages` alone (see "Anything in the brief that was wrong").
- The batch of every changed and new test file, copied into the base copy and then the base copies put back (`o99notes/base-batch.json`, `here-batch.json`, read with `python3` for `numTotalTests`, `numPassedTests`, `numFailedTests`, `numPendingTests` and the files with no result): base 235 tests, 201 pass, 32 fail, 2 skipped, 10 files do not load; worktree 322 tests, 320 pass, 0 fail, 2 skipped (two config-folder rows that need `OCULUS_TEST_HUB`, skipped on the base too). The worktree batch ran before the last test edits (the write-log fixture and the byte rows of config-save); those files pass in both Verify 1 runs, which run every test that reaches a changed file. Fails on the base, by file: connection-keys 3, deck-slides 2, debug 3, config-folder 3, config-key 1, reader 3, hub-scope 12, port-row 2, options 3. Pass on both: `served-roots.client` 6, `routes/git/credentials` 8, `server/core/credentials` 20, and the 6 kept rows of `debug.test.ts`. The `config-key` rows of `self` fail in the base copy only because it is no git checkout (the tracked-file check) and pass in the worktree.

## DONE / NOT DONE

| Item | State | Check |
|---|---|---|
| 1 Scopes | DONE | `hub-scope.test.ts`, `machine-section.test.ts`, `row-writer.test.ts`; look at landing |
| 2 Saves | DONE | `config-save.test.ts`, `options-pages.test.ts`; look at landing |
| 3 A control for every setting | DONE | probe `draws.test.ts` above; Verify 4's first grep; `settings-secrets.test.ts` |
| 4 Nested values | DONE | `sparse-card.test.ts`, `options.test.ts` |
| 5 Forms | DONE | `debug.test.ts`, `cpp.test.ts`, `entry-forms.test.ts`, `deck-slides.test.ts`, `primary-key.test.ts`, `config-save.test.ts` (folder names) |
| 6 Line counts | DONE | look at landing (`LineCounts.svelte`) |
| 7 Shipped rows | DONE | `rows.ts` output above; Verify 4 greps; no test row for the merge (see below) |
| 8 New views on saved pages | DONE | `views.test.ts` output above; `layout-saved.test.ts` |
| Verify 1 | DONE, second run | below |
| Verify 2 ASCII | DONE | prints nothing |
| Verify 3 unused exports | DONE | only removals and one moved line |
| Verify 4 greps | DONE | each prints nothing |
| Verify 5 base runs | DONE | the runs quoted above |
| Verify 6 sizes and folders | DONE | no file over its limit; `sh utils/folder-check.sh` exit 0 |
| Verify 7 history words | DONE | grep below, each hit judged |
| Verify 8 prose | DONE | below |
| Round 2, item 1 `scalar` | DONE | `sparse-card.test.ts`, `options-schema.test.ts`, `config-folder.test.ts`; "Repair round 2" |
| Round 2, item 2 the cluster pick | DONE | `cluster-rows.test.ts`; look at landing; "Repair round 2" |
| Round 2, the verify list | DONE | `test:quick: 348.6 s; every command passed` |

### Verify 1

`npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a`.

The second run (`o99notes/verify1-final2.txt`) prints the lines below. No file under `src`, `tests`, `utils` or `config` changed after it started (`find src tests utils config -newermt <its start>` prints nothing).

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (2.3 s)
ok      svelte-check (13.1 s): 1793296074564 COMPLETED 568 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (118.7 s): Duration  109.94s (transform 34.35s, setup 0ms, import 146.35s, tests 260.46s, environment 5ms)
ok      vitest (144.1 s): Duration  135.98s (transform 94.90s, setup 0ms, import 215.03s, tests 291.10s, environment 13.57s)
ok      vitest slow (239.9 s): Duration  231.79s (transform 19.15s, setup 0ms, import 157.70s, tests 757.62s, environment 19ms)
test:quick: 241.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
exit 0
```

The run before it (`o99notes/verify1-final.txt`), on the same source files (the only files newer than it are the outputs `npm run diagrams` and `docs:palette` write), failed one slow test:

```
ok      ASCII gate (1.7 s)
ok      svelte-kit sync (2.9 s)
ok      prettier (3.4 s): All matched files use Prettier code style!
ok      eslint (16.0 s)
ok      svelte-check (62.7 s): 1793295633940 COMPLETED 568 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (171.7 s): Duration  158.59s (transform 67.58s, setup 0ms, import 202.06s, tests 392.23s, environment 4ms)
ok      vitest (220.5 s): Duration  209.25s (transform 231.83s, setup 0ms, import 448.59s, tests 322.93s, environment 40.78s)
FAILED  vitest slow (298.4 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
Error: Test timed out in 20000ms.
      Tests  1 failed | 824 passed | 298 skipped (1123)
```

That row, run alone, took 2225 ms in the worktree and 2226 ms in the base copy, and the machine's load average was 6.79 during the failed run. The step does not change `hub-portfolio.test.ts`. The failure is a timeout under load, and the row passes in the second run; the landing's own verify list runs it again.

### Verify 2

`git status --porcelain -uall`, with the deleted paths, `config/local.yml` and the orchestrator's `briefs/O99-cases.md` left out, gives 211 files the step writes, this report among them (`o99notes/changed.txt`). The gate over them:

```
$ tr '\n' '\0' < changed.txt | xargs -0 env LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' | wc -l
0
```

### Verify 3

`sh utils/unused-exports.sh > unused-here.txt; diff .agents/worktrees/O99-base/unused-exports.txt unused-here.txt`:

```
1c1
< Unused exports (230)
---
> Unused exports (228)
40a41
> src/lib/server/core/files/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey
52d52
< src/lib/server/edit/writes/config/lists/rail.ts: RAIL
56d55
< src/lib/server/edit/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey
179c178
< src/lib/state/system/config/groups.ts: FILES, CATALOGS_GROUP, TEXTS_GROUP
---
> src/lib/state/system/config/groups.ts: FILES
182d180
< src/lib/state/system/config/write.ts: commit
232c230
< Unused exported types (109)
---
> Unused exported types (108)
318d315
< src/lib/state/system/config/write.ts: Committed
```

The one added line is the base's `yaml-edit.ts` line at the module's new path (the step moved the file); those three names were unused on the base and the step does not use them. Every other difference is an entry the step removed.

### Verify 4

```
$ git grep -n "EditLink\|settings_machine_edit_in\|settings_machine_edit_tip" -- src config tests ':!config/local.yml'; echo $?
1
$ grep -n "ships none\|ships neither" config/defaults/behavior.yml src/lib/data/sources/config/settings/rows/read.ts; echo $?
1
$ grep -nE "Empty makes no key|Empty tells no failure apart|Empty downloads nothing|says no source is configured" config/options/behavior.yml; echo $?
1
```

### Verify 6

`wc -l` over the 176 changed `.ts`, `.svelte`, `.mjs`, `.js` and `.sh` files, filtered by `awk '($2 ~ /\.svelte$/ && $1>520) || $1>880'`, prints nothing. The largest: `src/lib/data/model/index.ts` 871, `src/lib/state/client/writes.svelte.ts` 869, `src/lib/data/sources/config/catalog/options.ts` 867; the largest components: `src/lib/shell/keys/Palette.svelte` 520, `src/lib/views/system/workbench/Settings.svelte` 519, `src/lib/views/system/workbench/editors/FieldControl.svelte` 518. `sh utils/folder-check.sh` exits 0. The YAML files are no source files of the size rule (`tests/checks/tree/size.test.ts` matches `/\.(ts|svelte|mjs|js|sh)$/`).

### Verify 7

The grep runs over the comment lines and test titles the step adds or changes: the `+` lines of `git diff -U0 a5281619a -- src tests utils` and of every new file under them, kept when they are a comment line or an `it(`, `describe(` or `test(` title, and matched by `\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package lands`, a package id `[A-Z]\d{1,3}[a-z]?` or a date. It prints 58 lines (`o99notes/history-grep.txt`). Each is judged:

- `before` as an order in time while the program runs, or a place in a list, never the history of the code: `catalog/options.ts:276`, `merge/in-place.ts:11, 43, 130, 258`, `config-value.ts:11`, `cpp-file.ts:107`, `editors/draft.ts:742`, `editors/slots.ts:159`, `RailEditor.svelte:17, 118`, `Settings.svelte:270`, `settings/Control.svelte:16`, `WallpaperPicker.svelte:29`, `core/files/yaml/key-path.ts:71`, `yaml-edit.ts:8, 459`, `apps/app-setting.ts:12, 14, 185`, `CppRows.svelte:44`, `layout/saved/views.ts:18, 19, 20` (the tab a view goes after), `scopes/scopes.svelte.ts:4`, `tests/checks/tree/layer-rows.ts:25, 43, 45, 53, 57, 63, 77, 90, 100, 206` (text moved unchanged from `boundaries.test.ts`), `config-save.test.ts:10`.
- `before` naming the `before` field of a change record, the value a file held, which an undo writes back: `lists/deck/deck.ts:20, 21, 22, 281, 282`, `save/repo-save.ts:8`, `save/save.ts:6`, `save/settings-save.ts:16, 246, 319, 378`.
- `no longer` and `still` about the state of a file or a workspace while the program runs: `merge/in-place.ts:21` (a word a hub's values no longer give), `save/settings-save.ts:362`, `files/source/list-entries.ts:15`, `scopes/save.ts:5`, `editors/Editor.svelte:16`, `merge/hub-layer.ts:52` (rows still read for their kind), `scopes/rows.ts:4`, `view/hub-file.ts:5` (a text still being read), `slides/Keys.svelte:31` (holds every control still, that is unmoving).
- A guarded entry's id, not a package id: `config-save.test.ts:4` (G9), `settings-secrets.test.ts:3` (G76).

No hit names a package, a session, a date, an earlier bug or a reverted attempt.

### Verify 8

The new and changed sentences (comments, catalog words, option help, test titles) were read against the rules file's prose rules. Places that depart from them or come near:

- The catalog words `scope_gone_held` (`config/text/views/system/workbench.yml:104`), `settings_scope_gone` (`:236`), the cpp refusal `changed` ("cpp.yml no longer holds configuration {0} as it was read") and `repo_problem` ("{0} would no longer read: {1}") use "no longer" for the state of a file or a workspace the reader is in, not for the history of the code. Left as written.
- The base text of G8 (`agents/guarded.md:73`) repeats a clause; the replacement under "Doc text" writes the sentence once.

## Edits to existing assertions, allow lists and predicates

The full table, made from `git diff -U0 a5281619a -- tests` and holding every line of each hunk that changes or removes an existing line (comment, import and blank lines left out), is appended at the end of this report under "Table of changed test lines" (722 rows). Each file's reason:

- `tests/checks/config/config-folder.test.ts`: `OPTION_KEYS` takes `option_descriptions`, and the top-level keys of `options/behavior.yml` and `options/layout.yml` take `descriptions` (item 4's field records). Widened to the shape the brief asks for.
- `tests/checks/source/keys.test.ts`: the path of `why.ts` after the module move.
- `tests/data/hubs/connection-keys.test.ts`: the `neither` row and the two rows of a wrong value expect the shipped `ed25519` and `~/.ssh/id_{type}_{resource}` (item 7 names this row); the first row now sets `rsa` and its own path, so it still shows a hub value replacing oculus's.
- `tests/data/sources/config/catalog/options.test.ts`: the `holds:` refusal sentence names the field records of `descriptions` as a third place `record` is taken (two rows).
- `tests/routes/edit/deck-slides.test.ts`: the body helper takes `keys`.
- `tests/routes/git/credentials.test.ts` and `tests/server/core/credentials.test.ts`: the case of a hub with no git host now takes oculus's shipped `github` row out with `{ key: github, removed: true }`, since oculus ships it; the expected result (no host, no finding) is unchanged.
- `tests/routes/machine/debug.test.ts`: the writer, change log and undo move to the shared `tests/routes/write-log.ts`; the assertions read `log.listed()` in place of the file's own `listedWrites()`.
- `tests/server/core/reader/reader.test.ts`: G136's 'case 15: a primary hub with no literature.sources' expects oculus's shipped sources in their order and still that nothing is sent (item 7 names this row); the two rows of one key given twice expect the merge's finding words "more than one entry" in place of the row reader's "earlier row", since the merge now meets the duplicate first.
- `tests/server/core/reader/rows.yml`: the arxiv row's `oa: { value: true }` is written `'true'`, as the shipped row is; see judgment call 12.
- `tests/server/edit/config-key.test.ts`: the record's `before` of `clusters.key_type` is the shipped `ed25519`.
- `tests/state/sessions/served-roots.client.test.ts`: the machine state takes `files`.
- `tests/state/system/config/sparse-card.test.ts`: the rows of where a change is written read the change the scope holds (`heldBy`) in place of the write call, since a change is held until Save; the describe 'where a change to a sparse family is written, with a second hub shown' becomes '... with a second hub in the workspace'.
- `tests/state/system/settings/editor-saved.test.ts`, `fixture.ts`, `machine-section.test.ts`, `port-row.test.ts`, `row-writer.test.ts`, `tests/state/workbench/options-pages.test.ts` and `tests/views/system/workbench/workbench-fixture.ts`: the Settings writers hold a change until the scope's Save (item 2), the hub pick per row is replaced by the Hub scope (item 1), and the machine rows are rows of the This machine scope. The Port row draws the port `local.yml` names, and its note names the port the server listens on (`port-row.test.ts:62-68`).
- `tests/state/workbench/layout/saved/layout-saved.test.ts`: the table takes a `views` column.
- `tests/state/system/settings/chosen-hub.test.ts` is deleted; its behaviour (a row's hub) is the Hub scope's, tested by the new `hub-scope.test.ts` (base 12 failed and 2 passed; here 14 passed).
- `tests/checks/tree/boundaries.test.ts`: the table `ALLOWED` moved into `tests/checks/tree/layer-rows.ts`, unchanged except two added rows, each a widening of the check with its reason in the table's comment: `data/shapes/config-save` in the state row (the page and the server read the one shape of a Save body) and `state/system/machine/lsp/clangd/cpp-form` in the shell row (the palette's cpp rows raise the form).

## Files, with line counts, and the splits made

The line counts of every changed source file (`wc -l`, sorted by path) are appended at the end of this report under "Line counts". The 35 changed `.yml`, `.md`, `.dot`, `.svg` and `.json` files are listed in `o99notes/changed.txt`.

Splits and moves made:

- `Settings.svelte` (517 lines on the base, 519 now): the scope bar, the Workspace scope's rows (the primary and the folder names), the scope store, the scope files and the lists are the new folder `views/system/workbench/settings/scopes/` (`ScopeBar.svelte`, `WorkspaceRows.svelte`, `scopes.svelte.ts`, `files.ts`, `lists.svelte.ts`, `context.ts`), since `settings/` held ten items on the base and holds ten now (`EditLink.svelte` removed, `scopes/` added).
- `settings/Item.svelte`: 492 lines on the base, 352 now; the machine rows draw through the generic controls.
- The scope state is the new folder `state/system/config/scopes/` (`changes.ts`, `rows.ts`, `save.ts`, `scope.ts`, `write.ts`), since `state/system/config/` held ten items; the base's `state/system/config/write.ts` moved into it.
- `state/system/machine/lsp/clangd.ts` and `clangd.svelte.ts` moved into the new folder `state/system/machine/lsp/clangd/` beside `cpp-form.ts`.
- The Settings scope Save writers are the new folder `server/edit/writes/config/save/` (`save.ts`, `settings-save.ts`, `local-save.ts`, `repo-save.ts`).
- The byte-level YAML editors moved from `server/edit/yaml/` to `server/core/files/yaml/` (`yaml-edit.ts`, `yaml-values.ts`, `why.ts`, `key-path.ts`), `list-entries.ts` to `server/files/source/` and `primary-key.ts` to `server/edit/`, so `server/machine` (the launch and cpp writes) reaches them through folders it may import by the server order of `tests/checks/imports/order.ts`; `server/edit/yaml/` is removed.
- `tests/checks/tree/boundaries.test.ts` was 876 lines on the base and would pass 880 with the two new rows and their reasons; the table `ALLOWED` and the reasons above it are now `tests/checks/tree/layer-rows.ts` (358), and the check keeps 529. `LAYERS` stays in the check, since `utils/diagrams/source.mjs:69-76` reads it there.
- The writer, the change log and the undo that three route tests wrote alike are `tests/routes/write-log.ts` (`WriteLog`), used by `cpp.test.ts`, `debug.test.ts` and `primary-key.test.ts`; the post that answers a refusal sentence, written alike by the cpp form and the primary-key choice, is `state/shared/answers/posted.ts` (`postForRefusal`). Both end findings of `tests/checks/tree/duplication.test.ts`.

## Widenings of the path list

The brief's "Paths this step writes" does not name these; each is written for the reason given.

- `docs/diagrams/*.dot`, `*.svg` and `docs/palette.md`: written by `npm run diagrams` and `npm run docs:palette` (Verify 1).
- `src/lib/data/model/index.ts`, `model-collections.ts` (`keyChoices`, the fields a primary key may be), `model-deck.ts` (the deck keys), `src/lib/data/file-ops.ts` (History's words of the new kinds), `src/lib/data/sources/deck/read.ts` and `spec.ts` (the deck keys the Slides view sets), `src/lib/data/sources/config/machine.ts` (`JOINED_LOCAL_KEYS` read from `hub-names.ts`, one list).
- `src/lib/state/boards/collection/key-choice.ts` (the primary-key choice), `src/lib/state/life/slides.ts` (the deck keys), `src/lib/state/system/machine/debug/` (`launch-form.ts`, `debug-file.ts`, `debug.svelte.ts`: the launch edit and delete), `src/lib/state/system/machine/lsp/clangd/` (the cpp form, and the clangd modules moved into it), `src/lib/state/system/machine/hpc/setup.ts` (an unused re-export removed), `src/lib/state/client/writes.svelte.ts`, `src/lib/state/client/shapes/client-state.ts`, `src/lib/state/shared/stores/shapes.ts` (the scope Save and deck-keys bodies), `src/lib/state/shared/answers/posted.ts`, `src/lib/state/sources/fs-transport.ts` (the `local.yml` answer of a scope; `LocalFile` re-exported for the views).
- `src/lib/views/system/findings/` (`Findings.svelte`, new `KeyChoice.svelte`): the choice of a primary key on the finding's row.
- `src/lib/views/system/history/History.svelte`, `rows.ts`: the rows of the new write kinds.
- `src/lib/ui/forms/Prompt.svelte`: a `level` prop, so the cpp form raised from the palette stands over it.
- `src/lib/views/shared/prose/editor/lsp.ts`, `src/lib/views/sources/files/sections/clangd/Ast.svelte`, `MemoryUsage.svelte`: import paths of the moved clangd modules.
- `config/options/appearance.yml`: the shape comment that every file of `config/options/` points at, which names `descriptions:` now.
- `tests/checks/tree/boundaries.test.ts` and the new `layer-rows.ts`: the two rows named above.

## Shell edits

Every file change made by a shell command rather than Edit or Write, from `o99notes/base-runs.txt`:

- python3 heredocs on: `key-path.ts` (equality and map read; `blockLines`; empty files; `isNode`; assertion style), `deck-edit.ts` (`setDeckKeys` over `setKeyPath`; `Reflect.deleteProperty` in place of two disabled dynamic deletes), `deck-slides.test.ts` (defaults placement; undo loop; the deck keys describe appended), `lists/deck/deck.ts` (an assertion; keys in the deck-slides write), `list-entries.ts` (changed without delete; keep held nulls; byte edits with read-back; `writeOwnText`, `nameKey`, `recordAs`; real path in `writeOwnText`; real repo path; changes-based `EntryEdit`; `styleOf`; `isText` unknown), `writer.ts`, `write.ts`, `Item.svelte`, `WallpaperPicker.svelte`, `Control.svelte`, `Editor.svelte` and the tests editor-saved, row-writer, sparse-card, options-pages (held-change writers made synchronous), `Control.svelte` (settle synchronous), `scopes.svelte.ts` (`createSubscriber`), `Settings.svelte` (lint: effect reads, Set), lint fixes on `Item.svelte`, `Settings.svelte`, `ScopeBar.svelte`, `scope.ts`, `rows.ts`, `slots.ts`, `changes.ts`, `local-save.ts`, `machine-values.ts`, `references.ts`, `engine.ts`, `launch-form.ts`, `config-save.test.ts`, `settings-secrets.test.ts`, `sparse-card.test.ts`, the sync tests of editor-saved, row-writer and sparse-card, `config-save.test.ts` (typed answer; markdown value), `slides.ts` (deck key helpers), `Slides.svelte`, `Keys.svelte`, `GroupKeys.svelte` (keys wired and read inside the parts; comment rewrap; declaration order), `config/text/views/academic/slides.yml` (key words), `History.svelte` and `history.yml` (deck key kind), `debug.test.ts` (flow lists in the byte row), `file-ops.ts`, history `rows.ts`, `history.yml` (Set Primary Key; `FILE_FIELDS`), `model-collections.ts` (`keyChoices`; optional chain), `primary-key.ts` and `config/text/server.yml` (words; half sentence; file named under the hub), `key-choice.ts` (bare collection id; `keyChoicesOf` once per file), `Findings.svelte` (key choice row), `primary-key.test.ts` (`keyChoicesOf` row), `cpp-write.ts` (imports, `foundKeys`/`faultAt`/`editCpp` block; changes body), `debug/routes.ts` (`editConfiguration` changes field), `undo.ts` (the deck undo takes the record's before as it is), `bodies.ts` (keys on the deck-slides body), `yaml-edit.ts` (export `Written`, `removePair`, `removeFlowChild`), `fixture.ts` (HubCase block), `hub-scope.test.ts` and `row-writer.test.ts` (`row.place`), `scopes/write.ts` (`commit` and `Committed` kept to the file), `layout-saved.test.ts` (the views record row), the unused exports un-exported and the dead ones deleted, the import paths of the moved modules rewritten in 27 files and the comments naming the old paths, `key-choice.ts` and `cpp-form.ts` (writes through `postForRefusal`), `tests/routes/write-log.ts` (undo split), `cpp.test.ts`, `debug.test.ts`, `primary-key.test.ts` (moved to `WriteLog`), the `ALLOWED` rows and reasons, the `REPO_SETTINGS` re-export, the imports of `files.ts`, `scopes.svelte.ts` and `LaunchEdit.svelte` through state and their re-exports, `local-save.ts` (`edit()` over the bytes with `setKeyPath`, `intoRows`, `intoRow`), `repo-save.ts` (write with `setKeyPath`; import order).
- python3 rewrap helper (`scratchpad/o99tools/rewrap.py`, deleted) over the comment blocks over 100 columns of `catalog-words.ts`, `in-place.ts`, `lists/deck/deck.ts`, `CppRows.svelte`, `editors/sources.ts`, `scopes/scope.ts`, `Keys.svelte`, `LaunchEdit.svelte`, `Editor.svelte`, `RailEditor.svelte`, `Settings.svelte`, `AppControl.svelte`, `src/routes/api/(files)/fs/+server.ts`, `entry-forms.test.ts`; and python3 heredocs splitting one-line doc comments of `deck/spec.ts`, `scopes/write.ts`, `editor-saved.test.ts`, `AppControl.svelte`, `catalog-words.ts`.
- `sed -i` on `deck-slides.test.ts` (unused import), `model/index.ts` (export `keyChoices`), `writes/hubs.ts` (export `hubTarget`), `primary-key.ts` (file named under the hub), `primary-key.test.ts` (hub id separator), `sparse-card.test.ts` (vitest import without `vi`), `cpp.test.ts` (`configuration:` to `changes:` in the post bodies).
- `cat >` of `src/routes/api/(files)/primary-key/+server.ts`, then `mv` of that folder to `(docs)`; `cat >>` on `config/text/views/system/findings.yml` (key choice words) and `deck-edit.ts` (`DeckKey`, `deckKeyAt`, `deckStyle`, `keysApplied`, `setDeckKeys`).
- `mkdir` and `mv` for the module moves named under "Splits and moves made", and `mv chosen-hub.test.ts hub-scope.test.ts`.
- `cat >>` of the two tables at the end of this report.

## Judgment calls the brief left open

1. New wire shapes: the write kind `config-save` of `/api/write` (body `{ kind, scope, root?, digest, changes }`, `data/shapes/config-save.ts`), `GET` and `POST /api/cpp` (`src/routes/api/(machine)/cpp/+server.ts`), `POST /api/primary-key` (`src/routes/api/(docs)/primary-key/+server.ts`, body `{ root, collection, field }`), the debug actions `editConfiguration` and `deleteConfiguration` of `/api/debug`, and `keys` on the `deck-slides` body. The saved layout's `views` key is decision 6's.
2. History's words for the new kinds: "Set Primary Key", "Edit Configuration", "Delete Configuration", "C++ Configuration", "deck key", and a Settings save recorded under its file.
3. The primary-key choice is drawn on the finding's row in the Findings view (`views/system/findings/KeyChoice.svelte`), not under `views/shared/forms/`: one view draws it.
4. In a file with a schema the fields offered are those the schema describes, as the server checks (`server.primary_key.field`); in a file with none, those its entries hold that are no list or map.
5. `key_missing` on a hub whose `.oculus/config.yml` has no `collections:` list of its own (it reads oculus's) is refused with `server.primary_key.no_entry`, since there is no hub entry to write the key on.
6. A deck group's `find` drops the keys the deck reader does not read, and a top-level deck key the file lacks is added after the file's last key.
7. The Repository scope draws `editor.languages` alone (see the next section).
8. A value whose shape the editor does not draw is a finding on its Settings row (`workbench.settings_undrawn`, `config/text/views/system/workbench.yml:235`, naming the key and the value) and the row changes nothing; it is not a finding of the Findings view.
9. A `downloads` change of a `local.yml` is written entry by entry (`intoRows` in `local-save.ts`): an entry the save leaves as it was keeps its bytes, a changed entry is set key by key, an entry past the new rows is taken out, and a new row is added in the list's style.
10. A `local.yml` the This machine scope saves keeps its mode when it exists, and one the save makes is written at mode 600 and named in the hub's `.oculus/.gitignore`, as G8 says of the Settings writers (`writeAtomic` gives a made file the mode it is asked for and leaves an existing file's mode; `tests/routes/edit/undo/config-save.test.ts`, the table 'writes $row'). The earlier text of this call, that the save writes 600 whatever the file was, was wrong: the code never did, and the two rows of that table pass on the tree before and after round 1.
11. The case-run programs stay out of the tests, each deleted after its run (the brief: "Every other case of a code step is checked by a run the report quotes, and no test is kept for it").
12. The shipped arxiv row writes `oa: { value: true }` (`config/defaults/behavior.yml:765`), as the hub's row does, and the reader fixture `tests/server/core/reader/rows.yml:289` is the base's again. The field `value` of `reader_value` has the control `scalar` (ruling 548 (a), "Repair round 2", item 1): the schema takes a text of its form, a number or a flag there, the Settings card draws it as its text and saves it in the type it was held in, and `tests/checks/config/config-folder.test.ts` passes.
13. `postForRefusal` and `WriteLog` were made to end the duplication findings rather than allow them.

## Host-visible changes, for the look at landing

Each with the view, the state to put it in, and what should differ from the base. A scratch server on another port and a scratch hub are needed; this step started none.

- Settings (cases 1-11, 24-29, 32-34). State: a workspace file with two hubs and a repository folder, the primary a scratch hub whose `local.yml` holds a `downloads` row with a made-up secret. Base: no scope; each control wrote at once; "Edit in <file>" on list, family and machine rows. After: a scope picker in the header (Workspace, Primary hub, Hub, This machine, Repository), with a hub or repository pick beside Hub, This machine and Repository; each scope draws only its file's keys; a change shows as unsaved ("1 unsaved change") until Save, Cmd+S, Save All in the bar, or the File menu's Save All; no "Edit in" link anywhere; a `downloads` secret is a password box showing "Set" or "Not set" with Clear; `port` only in This machine of the primary; the Workspace scope shows Primary hub and Folder names. An unsaved workspace asks for a file name at its first change. A hub that leaves the workspace while it holds changes shows the sentence that its changes are kept and nothing is written.
- Debug view (case 13). State: a repository whose `.oculus/launch.yml` holds two configurations. After: each has Edit Configuration (a form of its debugger's fields) and Delete Configuration (asks first); History lists each write.
- The compile database item of the status bar (case 14). State: a repository with `.oculus/cpp.yml` holding a configuration with a finding. After: the palette lists Edit Configuration and Delete Configuration per entry and Add Configuration, each form drawn over the palette; a mended entry's finding clears.
- Slides view (case 15). State: a deck whose `present.yml` has a group. After: a Deck section with Title and Tag tones, and per group Find, Sort and Discover.
- Findings view (case 16). State: a hub with a data file in each of `key_none`, `key_two`, `key_beside`, `key_missing`. After: the file's first key finding carries a field pick and "Set as primary key"; a refusal shows under it.
- Status view (case 17): the top two rows of the line counts do not overlap, at the narrowest and the widest pane.
- Registries page (cases 21, 22, 22a, 35). State: a layout saved on the base. After: a pinned Journal Browser tab after Venues, given once; closed, it does not come back.
- Literature search, Recover, page links, Account setup (case 18). State: a hub that sets none of `literature.sources`, `recover`, `links`, `sign_in`, `connections`, `clusters`. After: eight sources listed, Recover by the eleven rows, the links drawn, Account setup's key file `~/.ssh/id_ed25519_<resource>`.
- History: rows of the new kinds with the words of judgment call 2.

## Anything in the brief that was wrong or impossible

- Case 2 (ruled, ruling 1) and case 16's `key_missing` (ruled, ruling 2); evidence in the first run above.
- Case 7's test needed a guarded entry (ruled, 545 (a)).
- Decision 4 and case 34 say the Repository scope draws the `editor:` block. A repository's `.oculus/settings.yml` takes `languages:` alone: `parseRepoSettings` makes every other top-level key an `unknown-key` problem (`src/lib/data/sources/config/editor-options.ts:215-219`). By item 1 ("a key that scope cannot take is not drawn there") the scope draws `editor.languages` alone, and the server refuses any other key (`server.config_save.repo_key`, `repo-save.ts:76-78`).
- The merge of the five shipped service lists by key (item 7, `merge/in-place.ts`, `merge/hub-layer.ts`) has no test. Its code is under G126's Code line ("the merge in oculus's place in `src/lib/data/sources/config/merge/`"), but G126's text names the vocabulary keys and the workspace catalogs, not `literature.sources`, `recover.sources`, `links`, `sign_in` and `connections.failures`. A row for the service lists in G126's table would test a behaviour its text does not state, which is a new entry and Axel's (`spec.md:59`: "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled"). The brief checks cases 18, 19, 20, 30 and 31 by a run, quoted above. The text G126 would need, with its rows, is under "Doc text" as a proposal for the orchestrator to raise; nothing was written for it.
- Seen outside the step: the base renderer `renderScalar` (`src/lib/data/helpers/files/yaml/collection-text.ts`) writes the text `on` unquoted (`word_wrap: on`), which oculus's YAML 1.2 reader reads back as the text `on`; a YAML 1.1 reader would read it as true. Not changed.

## Doc text

Each line below is the current text (`grep -n` or `sed -n` on the worktree, whose `docs/` and `agents/guarded.md` are the base's: `git diff --stat a5281619a -- .scratch/migration/agents/guarded.md docs/HELP.md docs/templates.md docs/data-map.md` prints nothing) and its replacement.

### agents/guarded.md

- **G76, line 52.** Current: "- G76. A secret's value never leaves the keyring: no log, change record, channel, file or report holds it." Replacement: "- G76. A secret's value never leaves the keyring: no log, change record, channel, file or report holds it. A `downloads` secret of a hub's `.oculus/local.yml` written through Settings is held by that file alone: no route answer, config or workspaces channel push, History record or log holds its value."
- **G76, line 53 (Code).** Append: "; the Settings write route of a `local.yml`: the `config-save` kind in `src/lib/server/edit/writes/config/config-write.ts` and `src/lib/server/edit/writes/config/save/save.ts`, `saveLocal` in `src/lib/server/edit/writes/config/save/local-save.ts`; the History record: `masked` and `localNow` in `local-save.ts`; the machine values' answer: `localFiles` in `src/lib/server/root/process/context/machine-values.ts`."
- **G76, line 54 (Test).** Append: "; `tests/routes/hubs/settings-secrets.test.ts`, describe 'a downloads secret saved through Settings is held by no answer or record', every row, the row \"the undo of a save of the port and a secret puts the port and the row's user back and keeps the secret\" among them."
- **G1, line 8 (Code).** Append: "; the cpp.yml form route: `src/routes/api/(machine)/cpp/+server.ts`; the primary-key route: `src/routes/api/(docs)/primary-key/+server.ts`."
- **G1, line 9 (Test).** Append: "; cpp.yml form: `tests/routes/machine/cpp.test.ts`, 'refuses a POST without the token and one naming a folder outside the workspace, writing nothing (G1, G2)'; primary key: `tests/routes/docs/primary-key.test.ts`, 'refuses a POST without the token and one naming a root no hub of the workspace is, writing nothing (G1, G2)'."
- **G2, line 11 (Code).** Append: "; the cpp.yml form route: `src/routes/api/(machine)/cpp/+server.ts` with `src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts`; the primary-key route: `src/routes/api/(docs)/primary-key/+server.ts` with `src/lib/server/edit/primary-key.ts`."
- **G2, line 12 (Test).** Append: "; cpp.yml form: `tests/routes/machine/cpp.test.ts`, 'refuses a POST without the token and one naming a folder outside the workspace, writing nothing (G1, G2)'; primary key: `tests/routes/docs/primary-key.test.ts`, 'refuses a POST without the token and one naming a root no hub of the workspace is, writing nothing (G1, G2)'."
- **G77, line 56 (Code).** Append: "; an app's `workspace.saveAll`, which saves the source tabs alone and no save a view joined: `saveEvery` in `src/lib/state/sessions/source/autosave.svelte.ts`, reached through `saveAll` in `src/lib/state/client/context.ts`; the File menu's Save All, `saveJoined` beside it."
- **G77, line 57 (Test).** Append: "; an app's `workspace.saveAll`: `tests/state/sessions/autosave.client.test.ts`, describe \"an app's workspace.saveAll and the File menu's Save All (G77)\", every row."
- **G8, line 73.** Replace the sentence that starts "The Settings writers (`config-value`, `config-key`) never write a `local.yml` but the one key `self` and the rows of `clusters:` of the primary hub's, ..." and ends "... and an existing one keeps its mode." with: "The Settings writers (`config-value`, `config-key`) never write a `local.yml` but the one key `self` of the primary hub's, which the config key write and the config reset change as that scalar alone, every other byte kept, the result read back by the machine's reader before it is written, and an edit that would leave a key the reader did not read before is refused with the reader's sentence naming that key; a `local.yml` they make is mode 600 and named in `.oculus/.gitignore`, and an existing one keeps its mode. The Save of a Settings scope (`config-save`) writes the one file of its scope (the workspace file's `settings:`, a hub's `.oculus/config.yml`, a hub's `.oculus/local.yml` or a repository's `.oculus/settings.yml`), each key it changes set or taken out over the file's bytes and every other byte kept, a `downloads` row written entry by entry; it writes nothing when the file's digest is not the one the page read, when the file does not parse, or when the result would not read back as the file with those keys changed; a `local.yml` it makes is mode 600 and named in `.oculus/.gitignore`, and an existing one keeps its mode. The launch.yml edit and delete, the cpp.yml form, the deck keys of `deck-slides` and the primary-key choice change only the entry or key they name, every other line kept."
- **G8, line 74 (Code).** Append: "; the Settings scope Save: `src/lib/server/edit/writes/config/save/`, `src/lib/data/shapes/config-save.ts`; the byte edits: `setKeyPath`, `addListEntry`, `removeListEntry` in `src/lib/server/core/files/yaml/key-path.ts`, `editEntries` and `writeOwnText` in `src/lib/server/files/source/list-entries.ts`; the launch.yml edit and delete: `editLaunch` in `src/lib/server/machine/debug/launch/write.ts`, `src/lib/server/machine/debug/routes.ts`; the cpp.yml form: `src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts`, `src/routes/api/(machine)/cpp/+server.ts`; the deck keys: `setDeckKeys` in `src/lib/server/edit/deck-edit.ts`, `src/lib/server/edit/writes/config/lists/deck/deck-keys.ts`; the primary-key choice: `src/lib/server/edit/primary-key.ts`, `src/routes/api/(docs)/primary-key/+server.ts`; the changes the entry forms send, a value the form does not draw left out of them: `launchForm` and `launchChanges` in `src/lib/state/system/machine/debug/launch-form.ts`, `cppFields` and `cppChanges` in `src/lib/state/system/machine/lsp/clangd/cpp-form.ts`."
- **G8, line 75 (Test).** Append: "; the Settings scope Save: `tests/routes/edit/undo/config-save.test.ts`, describes 'the Save of a Settings scope, one write of its file and one record', 'every byte of a scope file that a save does not change is kept' and \"a folder's name and the primary set in the Workspace scope\", every row; the launch.yml edit and delete: `tests/routes/machine/debug.test.ts`, describe 'the writes of launch.yml', the rows 'changes only the keys an edit names, every other line of the file kept byte for byte', 'writes an edited configuration in its place with the comments kept, lists it and undoes it', 'takes a deleted configuration out, lists the delete and undoes it' and 'refuses an edit of a name the file does not hold, to a name another entry holds, or to no name'; the cpp.yml form: `tests/routes/machine/cpp.test.ts`, describe 'the form of .oculus/cpp.yml', every row; the deck keys: `tests/routes/edit/deck-slides.test.ts`, describe \"writing a deck's keys\", every row; the primary-key choice: `tests/routes/docs/primary-key.test.ts`, describes 'the choice of a data file primary key' and 'the choices the Findings view offers', every row; the mode of a `local.yml` the scope Save writes: `tests/routes/edit/undo/config-save.test.ts`, the table 'writes $row'; the entry forms: `tests/state/system/entry-forms.test.ts`, describe 'the changes an entry form sends', every row."
- **G9, line 77 (Code).** Append: "; the Settings scope Save: `undoSaved` in `src/lib/server/edit/writes/config/save/save.ts`, with `undoSettings`, `undoLocal` and `undoRepo` beside it; the launch, cpp and primary-key writes, undone through `src/lib/server/edit/writes/file-undo.ts`."
- **G9, line 78 (Test).** Append: "; the Settings scope Save: `tests/routes/edit/undo/config-save.test.ts`, the table 'writes $row in one record, and the undo puts it back' and 'puts the file back when a later change of the save is refused'; a save that moves a `downloads` secret: `tests/routes/hubs/settings-secrets.test.ts`, \"the undo of a save of the port and a secret puts the port and the row's user back and keeps the secret\"; the launch.yml, cpp.yml and primary-key writes: the undo rows of `tests/routes/machine/debug.test.ts`, `tests/routes/machine/cpp.test.ts` and `tests/routes/docs/primary-key.test.ts` named under G8."
- **G29, line 98.** Append to the rule: "A rail page records the views it was given (`views`), so a view oculus adds to the page's arrangement later is given once, after the tab before it in the arrangement, and a view the reader closed is not given again; a page with no `views` was given none."
- **G29, line 99 (Code).** No change; `src/lib/state/workbench/layout/saved/` holds `views.ts`.
- **G29, line 100 (Test).** In the table 'reads $name' add the row 'rail pages: the views a rail page records, an empty and a repeated entry left out'.
- **G13, line 241 (Code).** After "`userProblems` of `src/lib/data/sources/config/machine.ts`" add ", the keys read from every hub's `local.yml` (`JOINED_LOCAL_KEYS` of `src/lib/data/helpers/hub-names.ts`)"; and add "the field records a reader row's options name: the `descriptions:` reader of `src/lib/data/sources/config/catalog/options.ts` and its findings `described_unknown` and `described_loop` in `option-findings.ts`".
- **G13, line 242 (Test).** Add: "`catalog/options.ts` descriptions: `tests/data/sources/config/catalog/options.test.ts`, 'reads a described_by field as the record it names, and one record of it with holds: record'". The table G13 names in `tests/data/hubs/connection-keys.test.ts`, describe 'clusterKeySettings', 'reads %s, the default with the key named for a wrong value (G13)', keeps its title; its rows now expect oculus's shipped `ed25519` and `~/.ssh/id_{type}_{resource}`.
- **G96, line 320.** Current: "- G96. A Settings row shows what the file and the server hold: a family editor is marked saved only once the file holds the value sent, and the Port row shows the port the server listens on, with the reason, when a move to the port `local.yml` names was refused." Replacement: "- G96. A Settings row shows what the file of its scope and the server hold: a change is held as unsaved until the scope's Save, and a family's draft ends at the push once the Save left the file holding it; the Port row of the This machine scope shows the port `local.yml` names and, when a move to it was refused, a note naming the port the server listens on and the reason."
- **G96, line 321 (Code).** Replace "`createEditorWriter` in `src/lib/state/system/config/editors/writer.ts`" with "`createEditorWriter` in `src/lib/state/system/config/editors/writer.ts`, `createRowWriter` in `src/lib/state/system/config/scopes/write.ts`, `createChanges` in `src/lib/state/system/config/scopes/changes.ts`, `saveFile` in `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts` (a change or a secret typed while a Save is out held again after it)"; replace "`localRows` in `src/lib/state/system/config/rows.ts`" with "`localRows` in `src/lib/state/system/config/rows.ts`, `localFile` and `scopeGroups` in `src/lib/state/system/config/scopes/rows.ts`"; replace "the hub a row names: `withHubs`, `hubReader` and `unreadRow` in" with "the Hub scope: `scopeOfKind`, `fileOf` and `takes` in `src/lib/state/system/config/scopes/scope.ts`, and `withHubs`, `hubReader` and `unreadRow` in".
- **G96, line 322 (Test).** Replace "`tests/state/system/settings/editor-saved.test.ts`, describe 'a family whose last entry is removed and saved', 'is marked saved once the file holds the empty family, until it is edited', 'says the file changed when the push after the answer brings another value'" with "`tests/state/system/settings/editor-saved.test.ts`, describe 'a family whose last entry is removed', every row"; replace "the hub a row names: `tests/state/system/settings/chosen-hub.test.ts`, every test; `tests/state/system/settings/row-writer.test.ts`, describe 'a Settings row with a hub chosen', every test; `tests/state/system/settings/editor-saved.test.ts`, describe 'a draft made with a hub other than the primary chosen', every test" with "the Hub scope: `tests/state/system/settings/hub-scope.test.ts`, every row; `tests/state/system/settings/row-writer.test.ts`, describe 'a Settings row of a hub other than the primary', every row; `tests/state/system/settings/editor-saved.test.ts`, describe 'a draft made in the Hub scope of a hub other than the primary', every row", and add "a change and a secret typed while a Save is out: `tests/views/system/workbench/scopes.client.test.ts`, describe 'a change and a secret typed while the Save of their file is out', every row". The describe "a draft held for lab while lab's settings are being read" keeps its title.
- **G138, line 222.** Replace "... and a change is written to the hub the key is read from." with "..., a value nested deeper than the row's fields is drawn by a control of its own from the field records its file's `descriptions:` holds, a constant `value` is drawn as its text whether the file holds a text, a number or a flag and is saved in the type it was held in, and a change is held for the file of the scope the card is drawn in."
- **G138, line 224 (Test).** Replace "'where a change to a sparse family is written, with a second hub shown'" with "'where a change to a sparse family is written, with a second hub in the workspace'", and add "describe \"a reader row's values at any depth, each drawn by a control of its own\", every row, the table 'draws $name constant value as its text, and saves it and a text typed over it in its type' among them".
- **G126 (proposal for the orchestrator to raise; nothing written).** Line 192 would add after "removing one;": "the service lists `literature.sources`, `recover.sources`, `links` and `sign_in` by `key` and `connections.failures` by `kind` the same way, a new failure row read before oculus's;" and line 194 (Test) would add rows of `tests/data/sources/config/layers/hub-vocab.test.ts` for cases 18, 19, 20, 30 and 31.
- The other entries the brief named (G2, G3, G12, G14, G77, G83, G133, G136, G137) were read, and the change makes none of them false: G83 holds once the templates.md text below lands, since the keys of `hubKeys` and of `config/options/local.yml` keep their names; G136's 'case 15' row expects the shipped sources, as named above.

### docs/HELP.md

- **Line 57.** Append: "A view oculus adds to a page's arrangement later is given once, after the tab before it, and one you closed is not given again."
- **Line 157.** Current: "| Cmd+S | save the source tab |". Replacement: "| Cmd+S | save the source tab, or the Settings scope on screen |".
- **Line 218.** The row stays; the view is now on the Registries page (line 57's sentence).
- **Line 274.** Append: "The Findings view offers, on the first finding of a file's key, a pick of its fields and Set as primary key, which writes the key where the reader reads it: the schema's flag on the field picked (and the `collections:` entry's `primary_key:` taken away when it names one), or, for a file with no schema, `primary_key:` on its `collections:` entry."
- **Line 328.** After "The Slides view of a deck lists its order, what the deck shows entry by entry, and its groups, each listing the decks whose slides it shows in the order it shows them." add: "Its Deck section sets the deck's title and tag tones, and each group's Find, Sort and Discover."
- **Line 329.** Replace "the rows of `literature.sources` in the primary hub's `.oculus/config.yml`, in their order; with no row it says that no source is configured and sends nothing" with "the rows of `literature.sources`, oculus's eight laid over by the primary hub's `.oculus/config.yml` by `key`, in their order".
- **Line 344.** Replace the whole line with: "- **Settings.** The header picks the scope, the file the rows write: Workspace (the open workspace file's `settings:`), Primary hub and Hub (a hub's `.oculus/config.yml`), This machine (a hub's `.oculus/local.yml`) and Repository (a folder's `.oculus/settings.yml`, `editor.languages` alone). Each scope draws only the keys its file takes. A change is held as unsaved until Save, Cmd+S or Save All, and a save is one write of the file, its comments and every key it does not change kept, undoable in History; an unsaved workspace asks for a file at its first change. A reader row of `literature.sources`, `recover.sources` and `venues.browser` is a card that shows the fields its row sets, with an Add field menu offering the others, each value nested deeper drawn by a control of its own. A value differing from oculus's is marked Modified, and Reset takes your value out of its file. A list or map is written as you see it, and an entry of oculus's you remove or hide is written as `removed: true` (a list) or `null` (a map), so it stays out. A value whose shape its editor does not draw is said on its row and kept as the file has it. Each heading has Show Defaults, which opens oculus's defaults file to read only. A `downloads` secret is shown as Set or Not set and is never sent to the page. Search takes `@modified` and `@id:`."
- **Line 411.** Append: "The compile database item's palette lists Edit Configuration and Delete Configuration for each configuration of `.oculus/cpp.yml`, and Add Configuration, each a form of the fields `cpp-schema.yml` gives."
- **Line 475.** After "Configurations are in the repository's `.oculus/launch.yml`." add: "The Debug view's Edit Configuration opens a form of the configuration's fields, and Delete Configuration takes it out; each is a write in History."
- **Line 534.** Replace "and a hub's `.oculus/local.yml`, for this machine's, of which Settings and the Person page write only `self`, in the primary hub's file" with "and a hub's `.oculus/local.yml`, for this machine's, which Settings writes in its This machine scope and the Person page writes `self` in, in the primary hub's file".
- **Line 549.** Replace "In a workspace of more than one hub, the row of a key each hub's own `.oculus/config.yml` is read for (a hub's words, its categories, its form fields among them) names the hub it writes, the primary first and chosen, and writes that hub's `.oculus/config.yml`; with no primary no hub is chosen and nothing is written until one is picked. The keys read from the primary hub's file alone write the primary's, refused when the workspace has no primary." with "A key each hub's own `.oculus/config.yml` is read for (a hub's words, its categories, its form fields among them) is set in that hub's Hub scope, and a key read from the primary hub's file alone in the Primary hub scope, which a workspace with no primary does not offer."
- **Line 325.** Replace "fetches the official Node build from the folder `recover.node_download` of the hub's `config.yml` names, and is refused while it names none" with "fetches the official Node build from the folder `recover.node_download` names, `https://nodejs.org/dist/` unless the hub's `config.yml` sets another".
- **Lines 339 and 515.** Replace "a row of `connections.failures` in the hub's `config.yml`" with "a row of `connections.failures`, oculus's six with the hub's own rows before them".
- **Line 591.** Replace "are the `google` and `microsoft` rows of `sign_in` in the primary hub's `config.yml` (its template has them). With no row, or a row missing a field a step needs," with "are the `google` and `microsoft` rows of `sign_in`, which oculus ships and the primary hub's `config.yml` may change by `key`. With a row taken out, or missing a field a step needs,".
- **Line 598.** Replace "filled from `clusters.key_file` of the hub's `config.yml` with `{type}` and `{resource}` put in" with "filled from `clusters.key_file` (`~/.ssh/id_{type}_{resource}` unless the hub's `config.yml` sets another) with `{type}` and `{resource}` put in", and "with the type `clusters.key_type` names" with "with the type `clusters.key_type` names (`ed25519` unless set)".
- **Line 599.** Replace "Settings' This machine section lists the rows of `clusters:` with their user name and key file, each with Save and Remove, and adds a row for a cluster of `slurm.resource` that has none. Every write goes to the primary hub's `local.yml`, the row alone, every other byte of the file kept. A row held in another hub's `local.yml` is named by its hub; Remove refuses it, since it is removed in that hub's file." with "Settings' This machine scope, for the hub picked, lists the rows of `clusters:` of that hub's `local.yml` with their user name and key file; its Save writes that file, each changed row alone, every other byte of the file kept."

### docs/templates.md

- **Line 25.** Current: "| `launch.yml` | `<repository>/.oculus/launch.yml` | Add Repository Configuration..., Add Configuration, or you |". Replacement: "| `launch.yml` | `<repository>/.oculus/launch.yml` | Add Repository Configuration..., Add, Edit and Delete Configuration, or you |".
- **Line 26.** Current: "| `cpp.yml` | `<repository>/.oculus/cpp.yml` | Add Repository Configuration..., or you |". Replacement: "| `cpp.yml` | `<repository>/.oculus/cpp.yml` | Add Repository Configuration..., the compile database item's Add, Edit and Delete Configuration, or you |".
- **Line 29.** Current: "| `present.yml` | a deck folder | you |". Replacement: "| `present.yml` | a deck folder | the Slides view, or you |".
- **Line 70.** Current: "# Hub; and `primary_key:`, the field an entry is found by, for a file with no `schema:` only,". Replacement: "# Hub; and `primary_key:`, the field an entry is found by, for a file with no `schema:` only (the Findings view's Set as primary key writes it),".
- **Lines 134-138.** Current: "# Both empty by default, and Account setup then says which is missing. Read from the primary hub" / "# alone." / "# clusters:" / "#   key_type: ''" / "#   key_file: ''". Replacement: "# oculus ships `ed25519` and `~/.ssh/id_{type}_{resource}`. Read from the primary hub alone." / "# clusters:" / "#   key_type: ed25519" / "#   key_file: ~/.ssh/id_{type}_{resource}". The example at lines 139-142 then repeats the default and may go.
- **Line 147.** Replace "None by default. Read from the primary hub alone." with "oculus ships six rows; a hub's rows are laid over them by `kind`, a new row read before oculus's, `{ kind: x, removed: true }` taking one out. Read from the primary hub alone."
- **Lines 159-160.** Replace "None by default, and Connect, the refresh and Account setup then say which row or field is missing." with "oculus ships the `google`, `microsoft` and `github` rows; a hub's rows are laid over them by `key`, `{ key: x, removed: true }` taking one out, and Connect, the refresh and Account setup say which row or field is missing."
- **Line 161.** "# sign_in: []" stays: the hub's own rows, none.
- **Lines 191, 195, 197-201.** Replace "Empty by default, and Recover's Unpack on a cluster then says it is missing." (191) with "oculus ships `https://nodejs.org/dist/`."; replace "A source of a kind no row names is not fetched" (195) with "oculus ships eleven rows, laid over by the hub's by `key`; a source of a kind no row names is not fetched"; "#   node_download: ''" (197) becomes "#   node_download: https://nodejs.org/dist/"; "#   sources: []" (198) stays (the hub's own rows, none), and the example at lines 199-201 may go.
- **Lines 207-208.** Replace "oculus ships no row; with none the search says that no source is configured." with "oculus ships eight rows, laid over by the hub's by `key`, `{ key: x, removed: true }` taking one out."
- **Lines 257-258.** Replace "# drawn." (257) with "# drawn. oculus ships seven rows, laid over by the hub's by `key`, `{ key: x, removed: true }` taking one out."; "# links: []" (258) stays.

### docs/data-map.md

- **Line 126.** Current: "clusters.key_type:        # the type of the key Account setup makes for a cluster". Replacement: "clusters.key_type:        # the type of the key Account setup makes for a cluster (oculus's ed25519)".
- **Line 127.** Current: "clusters.key_file:        # the path of that key, {type} and {resource} put in". Replacement: "clusters.key_file:        # the path of that key, {type} and {resource} put in (oculus's ~/.ssh/id_{type}_{resource})".
- **Line 128.** Current: "connections.failures:     # the rows that tell a failed ssh or git connection apart (kind, for, match, fix)". Replacement: "connections.failures:     # the rows that tell a failed ssh or git connection apart (kind, for, match, fix; by kind)".
- **Line 129.** Current: "sign_in:                  # the providers a reader signs in with: google, microsoft and git hosts". Replacement: "sign_in:                  # the providers a reader signs in with: google, microsoft and git hosts (by key)".
- **Line 130.** Current: "recover.node_download:    # the folder of Node.js's releases Recover's cluster side downloads from". Replacement: "recover.node_download:    # the folder of Node.js's releases Recover's cluster side downloads from (oculus's nodejs.org)".
- **Line 141.** Current: "literature.sources:       # the reader rows of the Literature search's sources (the primary hub's)". Replacement: "literature.sources:       # the reader rows of the Literature search's sources (the primary hub's, by key)".
- **Line 143.** Current: "recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind". Replacement: "recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind (by key)".
- **Line 145.** Current: "links:                    # the addresses page links are built from (the primary hub's)". Replacement: "links:                    # the addresses page links are built from (the primary hub's, by key)".

## Hub text

The research hub's `.oculus/config.yml` lines to delete at landing, once oculus ships the rows, as the file holds them now (760 lines, `wc -l`; ranges from `grep -nE "^[a-z_#]|^  [a-z_]+:|^    - (kind|key):"` and `sed -n` over each end, in round 1). Each deleted block holds what oculus now ships: `diff -w` of the hub's `sign_in` rows (104-128), `recover:` body (132-324), `literature.sources` rows (335-710) and `links` rows (753-760) against `config/defaults/behavior.yml` (comment and blank lines left out) prints no difference but the blank line after oculus's `sign_in` and oculus's own `prefer:` block. Delete, from the bottom up so the numbers hold:

- 751-760: the blank line at 751 and `links:` with its 7 rows (752-760). The file then ends at 750, `venues:`'s last line.
- 334-710: `sources:` of `literature:` and its 8 rows (openalex at 335 to scopus, ending at 710). `literature:` (333) and its `prefer:` (711-714) stay.
- 130-325: the comment "# Where Recover downloads Node.js from for a cluster run." (130), `recover:` (131) with `node_download` (132) and the 11 `sources` rows (133-324), and the blank line 325.
- 102-129: the comment "# The providers this hub signs in with: ..." (102), `sign_in:` with the `google`, `microsoft` and `github` rows (103-128), and the blank line 129.
- 99: the row `{ kind: Git sign-in refused, ... }`; 98: the row `{ kind: Host key not trusted, ... }`; 95: the row `{ kind: Key refused, ... }`. Each is byte for byte oculus's row of its kind (`diff` of hub lines 95-100 against `config/defaults/behavior.yml:87-92`, the leading `- ` and indent taken off, prints only rows 2, 3 and 6).
- 87-91: the comment "# The key Account setup makes for a cluster: ..." (87), `clusters:` with `key_type: ed25519` and `key_file: ~/.ssh/id_{type}_{resource}` (88-90), and the blank line 91.

These stay: the comment at 92 and `connections:` (93) with `failures:` (94) and the three rows of the hub's own words, `Unknown host` (96), `No route to the cluster` (97) and `Git key refused` (100), each "this Mac", "the UT network" or "EduVPN" where oculus's says "this machine" or "the cluster's network"; they replace oculus's rows of the same `kind` in place (ruling 537). The comment at 92 stays, as item 8 keeps a comment over a block that stays: the review named it when the whole `connections:` block was to go, and with three rows kept the block stays. `venues:` (716-750), the UT Journal Browser, stays the hub's. The blank line 101 after the failure rows stays.

## Line counts

`wc -l` of every changed source and test file, sorted by path, counted again after repair round 2.

| Lines | File |
|---|---|
| 414 | `src/lib/data/file-ops.ts` |
| 847 | `src/lib/data/helpers/hub-names.ts` |
| 871 | `src/lib/data/model/index.ts` |
| 527 | `src/lib/data/model/model-collections.ts` |
| 267 | `src/lib/data/model/model-deck.ts` |
| 161 | `src/lib/data/shapes/catalog-files/options.ts` |
| 133 | `src/lib/data/shapes/catalog-words.ts` |
| 116 | `src/lib/data/shapes/config-save.ts` |
| 86 | `src/lib/data/sources/config/catalog/option-findings.ts` |
| 867 | `src/lib/data/sources/config/catalog/options.ts` |
| 338 | `src/lib/data/sources/config/catalog/schemas/engine.ts` |
| 428 | `src/lib/data/sources/config/catalog/schemas/options.ts` |
| 172 | `src/lib/data/sources/config/catalog/schemas/references.ts` |
| 56 | `src/lib/data/sources/config/catalog/schemas/settings.ts` |
| 363 | `src/lib/data/sources/config/catalog/value-rule.ts` |
| 135 | `src/lib/data/sources/config/catalog/value-words.ts` |
| 237 | `src/lib/data/sources/config/machine.ts` |
| 653 | `src/lib/data/sources/config/merge/hub-layer.ts` |
| 388 | `src/lib/data/sources/config/merge/in-place.ts` |
| 146 | `src/lib/data/sources/config/merge/options-folder.ts` |
| 128 | `src/lib/data/sources/config/settings/rows/read.ts` |
| 612 | `src/lib/data/sources/deck/read.ts` |
| 223 | `src/lib/data/sources/deck/spec.ts` |
| 399 | `src/lib/server/core/files/yaml/key-path.ts` |
| 71 | `src/lib/server/core/files/yaml/why.ts` |
| 573 | `src/lib/server/core/files/yaml/yaml-edit.ts` |
| 163 | `src/lib/server/core/files/yaml/yaml-values.ts` |
| 249 | `src/lib/server/edit/deck-edit.ts` |
| 391 | `src/lib/server/edit/entry-edit/entries.ts` |
| 389 | `src/lib/server/edit/entry-edit/lines.ts` |
| 436 | `src/lib/server/edit/entry-edit/merge.ts` |
| 67 | `src/lib/server/edit/entry-edit/render.ts` |
| 361 | `src/lib/server/edit/entry-edit/subtasks.ts` |
| 807 | `src/lib/server/edit/feeds/feeds.ts` |
| 301 | `src/lib/server/edit/feeds/literature.ts` |
| 229 | `src/lib/server/edit/feeds/radar.ts` |
| 170 | `src/lib/server/edit/primary-key.ts` |
| 781 | `src/lib/server/edit/writes.ts` |
| 201 | `src/lib/server/edit/writes/apps/app-setting.ts` |
| 777 | `src/lib/server/edit/writes/bodies.ts` |
| 568 | `src/lib/server/edit/writes/config/config-fit.ts` |
| 507 | `src/lib/server/edit/writes/config/config-key.ts` |
| 375 | `src/lib/server/edit/writes/config/config-place.ts` |
| 322 | `src/lib/server/edit/writes/config/config-value.ts` |
| 164 | `src/lib/server/edit/writes/config/config-write.ts` |
| 118 | `src/lib/server/edit/writes/config/lists/deck/deck-keys.ts` |
| 299 | `src/lib/server/edit/writes/config/lists/deck/deck.ts` |
| 432 | `src/lib/server/edit/writes/config/lists/folders.ts` |
| 73 | `src/lib/server/edit/writes/config/lists/rail.ts` |
| 359 | `src/lib/server/edit/writes/config/save/local-save.ts` |
| 137 | `src/lib/server/edit/writes/config/save/repo-save.ts` |
| 41 | `src/lib/server/edit/writes/config/save/save.ts` |
| 399 | `src/lib/server/edit/writes/config/save/settings-save.ts` |
| 648 | `src/lib/server/edit/writes/entries.ts` |
| 296 | `src/lib/server/edit/writes/hubs.ts` |
| 743 | `src/lib/server/edit/writes/manifest.ts` |
| 96 | `src/lib/server/edit/writes/restore.ts` |
| 405 | `src/lib/server/edit/writes/subtasks.ts` |
| 654 | `src/lib/server/edit/writes/undo.ts` |
| 573 | `src/lib/server/files/fs.ts` |
| 308 | `src/lib/server/files/source/list-entries.ts` |
| 41 | `src/lib/server/machine/debug/launch/write.ts` |
| 291 | `src/lib/server/machine/debug/routes.ts` |
| 186 | `src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts` |
| 152 | `src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts` |
| 172 | `src/lib/server/root/process/context/machine-values.ts` |
| 520 | `src/lib/shell/keys/Palette.svelte` |
| 179 | `src/lib/shell/keys/rows/approve/ChoiceRows.svelte` |
| 172 | `src/lib/shell/keys/rows/approve/CppRows.svelte` |
| 468 | `src/lib/shell/Workbench.svelte` |
| 75 | `src/lib/state/boards/collection/key-choice.ts` |
| 855 | `src/lib/state/client/context.ts` |
| 199 | `src/lib/state/client/shapes/client-state.ts` |
| 869 | `src/lib/state/client/writes.svelte.ts` |
| 390 | `src/lib/state/life/slides.ts` |
| 270 | `src/lib/state/sessions/source/autosave.svelte.ts` |
| 28 | `src/lib/state/shared/answers/posted.ts` |
| 550 | `src/lib/state/shared/stores/shapes.ts` |
| 578 | `src/lib/state/sources/fs-transport.ts` |
| 125 | `src/lib/state/system/config/config-files.ts` |
| 837 | `src/lib/state/system/config/editors/draft.ts` |
| 778 | `src/lib/state/system/config/editors/fields.ts` |
| 179 | `src/lib/state/system/config/editors/offers.ts` |
| 130 | `src/lib/state/system/config/editors/origins.ts` |
| 181 | `src/lib/state/system/config/editors/slots.ts` |
| 227 | `src/lib/state/system/config/editors/sources.ts` |
| 134 | `src/lib/state/system/config/editors/writer.ts` |
| 369 | `src/lib/state/system/config/groups.ts` |
| 73 | `src/lib/state/system/config/messages.ts` |
| 82 | `src/lib/state/system/config/other-rows/cluster-rows.ts` |
| 601 | `src/lib/state/system/config/rows.ts` |
| 191 | `src/lib/state/system/config/scopes/changes.ts` |
| 133 | `src/lib/state/system/config/scopes/rows.ts` |
| 72 | `src/lib/state/system/config/scopes/save.ts` |
| 177 | `src/lib/state/system/config/scopes/scope.ts` |
| 149 | `src/lib/state/system/config/scopes/write.ts` |
| 98 | `src/lib/state/system/config/typed.ts` |
| 18 | `src/lib/state/system/config/view/gear.ts` |
| 46 | `src/lib/state/system/config/view/hub-file.ts` |
| 213 | `src/lib/state/system/config/view/hub-settings.svelte.ts` |
| 176 | `src/lib/state/system/machine/debug/debug-file.ts` |
| 843 | `src/lib/state/system/machine/debug/debug.svelte.ts` |
| 194 | `src/lib/state/system/machine/debug/launch-form.ts` |
| 118 | `src/lib/state/system/machine/hpc/setup.ts` |
| 54 | `src/lib/state/system/machine/lsp/clangd/clangd.svelte.ts` |
| 110 | `src/lib/state/system/machine/lsp/clangd/clangd.ts` |
| 165 | `src/lib/state/system/machine/lsp/clangd/cpp-form.ts` |
| 356 | `src/lib/state/workbench/layout/instance.ts` |
| 436 | `src/lib/state/workbench/layout/model.ts` |
| 636 | `src/lib/state/workbench/layout/open/float/pages.ts` |
| 121 | `src/lib/state/workbench/layout/open/float/rail-pages.ts` |
| 69 | `src/lib/state/workbench/layout/saved/docs.ts` |
| 676 | `src/lib/state/workbench/layout/saved/saved.ts` |
| 65 | `src/lib/state/workbench/layout/saved/views.ts` |
| 179 | `src/lib/state/workbench/layout/tabs/close-hooks.ts` |
| 187 | `src/lib/ui/forms/Prompt.svelte` |
| 157 | `src/lib/views/academic/slides/GroupKeys.svelte` |
| 149 | `src/lib/views/academic/slides/Keys.svelte` |
| 513 | `src/lib/views/academic/slides/Slides.svelte` |
| 287 | `src/lib/views/personal/account-setup/ClusterSteps.svelte` |
| 704 | `src/lib/views/shared/prose/editor/lsp.ts` |
| 96 | `src/lib/views/sources/files/sections/clangd/Ast.svelte` |
| 118 | `src/lib/views/sources/files/sections/clangd/MemoryUsage.svelte` |
| 149 | `src/lib/views/system/findings/Findings.svelte` |
| 69 | `src/lib/views/system/findings/KeyChoice.svelte` |
| 492 | `src/lib/views/system/history/History.svelte` |
| 114 | `src/lib/views/system/history/rows.ts` |
| 213 | `src/lib/views/system/machine/debug/Debug.svelte` |
| 114 | `src/lib/views/system/machine/debug/LaunchEdit.svelte` |
| 191 | `src/lib/views/system/status/LineCounts.svelte` |
| 232 | `src/lib/views/system/workbench/editors/Editor.svelte` |
| 520 | `src/lib/views/system/workbench/editors/FieldControl.svelte` |
| 48 | `src/lib/views/system/workbench/editors/Origins.svelte` |
| 101 | `src/lib/views/system/workbench/editors/SecretBox.svelte` |
| 30 | `src/lib/views/system/workbench/editors/writer.svelte.ts` |
| 351 | `src/lib/views/system/workbench/RailEditor.svelte` |
| 519 | `src/lib/views/system/workbench/Settings.svelte` |
| 143 | `src/lib/views/system/workbench/settings/Control.svelte` |
| 358 | `src/lib/views/system/workbench/settings/Item.svelte` |
| 230 | `src/lib/views/system/workbench/settings/List.svelte` |
| 138 | `src/lib/views/system/workbench/settings/other-rows/AppControl.svelte` |
| 69 | `src/lib/views/system/workbench/settings/other-rows/ClusterRows.svelte` |
| 92 | `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte` |
| 20 | `src/lib/views/system/workbench/settings/scopes/context.ts` |
| 118 | `src/lib/views/system/workbench/settings/scopes/files.ts` |
| 83 | `src/lib/views/system/workbench/settings/scopes/lists.svelte.ts` |
| 229 | `src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte` |
| 304 | `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts` |
| 116 | `src/lib/views/system/workbench/settings/scopes/WorkspaceRows.svelte` |
| 30 | `src/lib/views/system/workbench/settings/writer.svelte.ts` |
| 361 | `src/routes/+page.svelte` |
| 36 | `src/routes/api/(docs)/primary-key/+server.ts` |
| 62 | `src/routes/api/(files)/fs/+server.ts` |
| 38 | `src/routes/api/(machine)/cpp/+server.ts` |
| 847 | `tests/checks/config/config-folder.test.ts` |
| 840 | `tests/checks/source/keys.test.ts` |
| 529 | `tests/checks/tree/boundaries.test.ts` |
| 358 | `tests/checks/tree/layer-rows.ts` |
| 188 | `tests/data/hubs/connection-keys.test.ts` |
| 145 | `tests/data/sources/config/catalog/options-schema.test.ts` |
| 312 | `tests/data/sources/config/catalog/options.test.ts` |
| 247 | `tests/routes/docs/primary-key.test.ts` |
| 335 | `tests/routes/edit/deck-slides.test.ts` |
| 262 | `tests/routes/edit/undo/config-save.test.ts` |
| 297 | `tests/routes/git/credentials.test.ts` |
| 122 | `tests/routes/hubs/settings-secrets.test.ts` |
| 186 | `tests/routes/machine/cpp.test.ts` |
| 259 | `tests/routes/machine/debug.test.ts` |
| 85 | `tests/routes/write-log.ts` |
| 262 | `tests/server/core/credentials.test.ts` |
| 828 | `tests/server/core/reader/reader.test.ts` |
| 701 | `tests/server/edit/config-key.test.ts` |
| 440 | `tests/state/sessions/autosave.client.test.ts` |
| 210 | `tests/state/sessions/served-roots.client.test.ts` |
| 718 | `tests/state/system/config/sparse-card.test.ts` |
| 125 | `tests/state/system/entry-forms.test.ts` |
| 83 | `tests/state/system/settings/cluster-rows.test.ts` |
| 162 | `tests/state/system/settings/collection-fields.test.ts` |
| 215 | `tests/state/system/settings/editor-saved.test.ts` |
| 109 | `tests/state/system/settings/fixture.ts` |
| 285 | `tests/state/system/settings/hub-scope.test.ts` |
| 150 | `tests/state/system/settings/machine-section.test.ts` |
| 87 | `tests/state/system/settings/port-row.test.ts` |
| 201 | `tests/state/system/settings/row-writer.test.ts` |
| 465 | `tests/state/system/settings/theme-groups.test.ts` |
| 204 | `tests/state/workbench/layout/saved/layout-saved.test.ts` |
| 186 | `tests/state/workbench/options-pages.test.ts` |
| 90 | `tests/views/system/workbench/scopes.client.test.ts` |
| 85 | `tests/views/system/workbench/workbench-fixture.ts` |

## Table of changed test lines

From `git diff -U0 a5281619a -- tests` as round 0 left the tests, the deleted `chosen-hub.test.ts` and the moved `boundaries.test.ts` table left out; the line is the base line for a before row and the new line for an after row. A backtick inside a line is shown as a straight single quote. The table is not regenerated after the repair rounds: the test lines round 1 changes are named under "Repair round 1" (its items and "Edits to existing assertions in round 1"), those round 2 changes under "Repair round 2", and a line number of a file those rounds changed (`settings-secrets`, `config-save`, `cpp`, `primary-key`, `sparse-card`, `entry-forms`, `options-schema`) may have moved since.

| File | Line | Side | Text |
|---|---|---|---|
| tests/checks/config/config-folder.test.ts | 284 | before | `const OPTION_KEYS = ['options', 'option_groups'];` |
| tests/checks/config/config-folder.test.ts | 284 | after | `const OPTION_KEYS = ['options', 'option_groups', 'option_descriptions'];` |
| tests/checks/config/config-folder.test.ts | 287 | after | `const DESCRIBED = ['options/behavior.yml', 'options/layout.yml'];` |
| tests/checks/config/config-folder.test.ts | 836 | before | `expect(Object.keys(parsed).sort(), name).toEqual(['groups', 'options']);` |
| tests/checks/config/config-folder.test.ts | 841 | after | `const described = DESCRIBED.includes(name) ? ['descriptions'] : [];` |
| tests/checks/config/config-folder.test.ts | 842 | after | `expect(Object.keys(parsed).sort(), name).toEqual([...described, 'groups', 'options']);` |
| tests/checks/source/keys.test.ts | 388 | before | `file: 'lib/server/edit/yaml/why.ts',` |
| tests/checks/source/keys.test.ts | 388 | after | `file: 'lib/server/core/files/yaml/why.ts',` |
| tests/data/hubs/connection-keys.test.ts | 41 | before | `{ key_type: 'ed25519', key_file: '~/.ssh/id_{type}_{resource}' },` |
| tests/data/hubs/connection-keys.test.ts | 42 | before | `{ keyType: 'ed25519', keyFile: '~/.ssh/id_{type}_{resource}' },` |
| tests/data/hubs/connection-keys.test.ts | 44 | after | `{ key_type: 'rsa', key_file: '~/.ssh/cluster_{resource}' },` |
| tests/data/hubs/connection-keys.test.ts | 45 | after | `{ keyType: 'rsa', keyFile: '~/.ssh/cluster_{resource}' },` |
| tests/data/hubs/connection-keys.test.ts | 45 | before | `['neither', {}, { keyType: '', keyFile: '' }, []],` |
| tests/data/hubs/connection-keys.test.ts | 48 | after | `['neither', {}, { keyType: 'ed25519', keyFile: SHIPPED_FILE }, []],` |
| tests/data/hubs/connection-keys.test.ts | 49 | before | `{ keyType: '', keyFile: '' },` |
| tests/data/hubs/connection-keys.test.ts | 52 | after | `{ keyType: 'ed25519', keyFile: SHIPPED_FILE },` |
| tests/data/hubs/connection-keys.test.ts | 55 | before | `{ keyType: 'rsa', keyFile: '' },` |
| tests/data/hubs/connection-keys.test.ts | 58 | after | `{ keyType: 'rsa', keyFile: SHIPPED_FILE },` |
| tests/data/sources/config/catalog/options.test.ts | 84 | before | `'holds: lists is not read here: lists is taken only by a family whose fields are key and value, and record only by a family, or by a family field with no key field; the entry is read without it'` |
| tests/data/sources/config/catalog/options.test.ts | 84 | after | `'holds: lists is not read here: lists is taken only by a family whose fields are key and value, and record only by a family, by a family field with no key field, or by a field whose described_by names such a family; the entry is read without it'` |
| tests/data/sources/config/catalog/options.test.ts | 107 | before | `'holds: ${word} is not read here: lists is taken only by a family whose fields are key and value, and record only by a family, or by a family field with no key field; the entry is read without it';` |
| tests/data/sources/config/catalog/options.test.ts | 107 | after | `'holds: ${word} is not read here: lists is taken only by a family whose fields are key and value, and record only by a family, by a family field with no key field, or by a field whose described_by names such a family; the entry is read without it';` |
| tests/routes/edit/deck-slides.test.ts | 33 | before | `over: Partial<{ path: string; root: string; order: { base: string[]; entries: string[] } }> = {}` |
| tests/routes/edit/deck-slides.test.ts | 34 | after | `over: Partial<{` |
| tests/routes/edit/deck-slides.test.ts | 35 | after | `path: string;` |
| tests/routes/edit/deck-slides.test.ts | 36 | after | `root: string;` |
| tests/routes/edit/deck-slides.test.ts | 37 | after | `order: { base: string[]; entries: string[] };` |
| tests/routes/edit/deck-slides.test.ts | 38 | after | `keys: { path: string[]; base: unknown; value: unknown }[];` |
| tests/routes/edit/deck-slides.test.ts | 39 | after | `}> = {}` |
| tests/routes/git/credentials.test.ts | 129 | before | `[...(signedIn ? SIGN_IN : []), 'scan:', '  - { dir: projects/manuscripts }', ''].join('\n')` |
| tests/routes/git/credentials.test.ts | 132 | after | `[...(signedIn ? SIGN_IN : REMOVED), 'scan:', '  - { dir: projects/manuscripts }', ''].join(` |
| tests/routes/git/credentials.test.ts | 133 | after | `'\n'` |
| tests/routes/git/credentials.test.ts | 134 | after | `)` |
| tests/routes/machine/debug.test.ts | 54 | before | `let base = '';` |
| tests/routes/machine/debug.test.ts | 53 | after | `const log = new WriteLog('repo', () => repo);` |
| tests/routes/machine/debug.test.ts | 60 | before | `base = scratchDir('oculus-debug-writes-');` |
| tests/routes/machine/debug.test.ts | 61 | before | `ops = fsWrites();` |
| tests/routes/machine/debug.test.ts | 63 | before | `changeLog = { file: join(base, 'changes.jsonl'), keep: 500, writes: fsWrites() };` |
| tests/routes/machine/debug.test.ts | 59 | after | `log.start('oculus-debug-writes-');` |
| tests/routes/machine/debug.test.ts | 91 | before | `const writer = (): OpsTarget => ({` |
| tests/routes/machine/debug.test.ts | 92 | before | `roots: [{ key: 'repo', dir: repo }],` |
| tests/routes/machine/debug.test.ts | 93 | before | `writes: ops,` |
| tests/routes/machine/debug.test.ts | 94 | before | `changes: changeLog,` |
| tests/routes/machine/debug.test.ts | 95 | before | `history: join(base, 'history')` |
| tests/routes/machine/debug.test.ts | 96 | before | `});` |
| tests/routes/machine/debug.test.ts | 98 | before | `let ops = fsWrites();` |
| tests/routes/machine/debug.test.ts | 99 | before | `let changeLog = { file: '', keep: 500, writes: fsWrites() };` |
| tests/routes/machine/debug.test.ts | 107 | before | `files: writer,` |
| tests/routes/machine/debug.test.ts | 92 | after | `files: () => log.writer(),` |
| tests/routes/machine/debug.test.ts | 156 | before | `describe('Add Configuration', () => {` |
| tests/routes/machine/debug.test.ts | 141 | after | `describe('the writes of launch.yml', () => {` |
| tests/routes/machine/debug.test.ts | 161 | before | `let undone = new Set<string>();` |
| tests/routes/machine/debug.test.ts | 162 | before | `beforeEach(() => {` |
| tests/routes/machine/debug.test.ts | 163 | before | `undone = new Set();` |
| tests/routes/machine/debug.test.ts | 164 | before | `});` |
| tests/routes/machine/debug.test.ts | 167 | before | `function listedWrites(): Change[] {` |
| tests/routes/machine/debug.test.ts | 168 | before | `return readChanges(changeLog).filter((one) => !undone.has(one.at));` |
| tests/routes/machine/debug.test.ts | 169 | before | `}` |
| tests/routes/machine/debug.test.ts | 172 | before | `async function undoNewest(): Promise<Change> {` |
| tests/routes/machine/debug.test.ts | 173 | before | `const newest = listedWrites()[0];` |
| tests/routes/machine/debug.test.ts | 174 | before | `const target = {` |
| tests/routes/machine/debug.test.ts | 175 | before | `files: {` |
| tests/routes/machine/debug.test.ts | 176 | before | `roots: () => writer().roots,` |
| tests/routes/machine/debug.test.ts | 177 | before | `history: join(base, 'history'),` |
| tests/routes/machine/debug.test.ts | 178 | before | `writes: ops` |
| tests/routes/machine/debug.test.ts | 179 | before | `}` |
| tests/routes/machine/debug.test.ts | 180 | before | `} as unknown as WriteTarget;` |
| tests/routes/machine/debug.test.ts | 181 | before | `const done = await undoFiles(target, newest, {` |
| tests/routes/machine/debug.test.ts | 182 | before | `trash: (path) => {` |
| tests/routes/machine/debug.test.ts | 183 | before | `rmSync(path, { recursive: true, force: true });` |
| tests/routes/machine/debug.test.ts | 184 | before | `return Promise.resolve();` |
| tests/routes/machine/debug.test.ts | 185 | before | `}` |
| tests/routes/machine/debug.test.ts | 186 | before | `});` |
| tests/routes/machine/debug.test.ts | 187 | before | `expect((done as { error?: string }).error).toBeUndefined();` |
| tests/routes/machine/debug.test.ts | 188 | before | `undone.add(newest.at);` |
| tests/routes/machine/debug.test.ts | 189 | before | `return newest;` |
| tests/routes/machine/debug.test.ts | 190 | before | `}` |
| tests/routes/machine/debug.test.ts | 196 | before | `const listed = listedWrites().map((one) => [` |
| tests/routes/machine/debug.test.ts | 197 | before | `one.field,` |
| tests/routes/machine/debug.test.ts | 198 | before | `(one.before as unknown[]).length` |
| tests/routes/machine/debug.test.ts | 199 | before | `]);` |
| tests/routes/machine/debug.test.ts | 200 | before | `await undoNewest();` |
| tests/routes/machine/debug.test.ts | 149 | after | `const listed = log.listed().map((one) => [one.field, (one.before as unknown[]).length]);` |
| tests/routes/machine/debug.test.ts | 150 | after | `await log.undoNewest();` |
| tests/routes/machine/debug.test.ts | 213 | before | `const listed = listedWrites().map((one) => [` |
| tests/routes/machine/debug.test.ts | 214 | before | `one.field,` |
| tests/routes/machine/debug.test.ts | 215 | before | `(one.before as unknown[]).length` |
| tests/routes/machine/debug.test.ts | 216 | before | `]);` |
| tests/routes/machine/debug.test.ts | 217 | before | `await undoNewest();` |
| tests/routes/machine/debug.test.ts | 163 | after | `const listed = log.listed().map((one) => [one.field, (one.before as unknown[]).length]);` |
| tests/routes/machine/debug.test.ts | 164 | after | `await log.undoNewest();` |
| tests/routes/machine/debug.test.ts | 236 | before | `expect([answered.status, existsSync(join(repo, '.oculus')), listedWrites()]).toEqual([` |
| tests/routes/machine/debug.test.ts | 183 | after | `expect([answered.status, existsSync(join(repo, '.oculus')), log.listed()]).toEqual([` |
| tests/server/core/credentials.test.ts | 255 | before | `const none = loadConfig(engineDir()).config;` |
| tests/server/core/credentials.test.ts | 256 | before | `expect(helperFindings({ engine: engineDir(), hub: null, from: {} }, none, quoted)).toEqual(` |
| tests/server/core/credentials.test.ts | 257 | before | `[]` |
| tests/server/core/credentials.test.ts | 258 | before | `);` |
| tests/server/core/credentials.test.ts | 255 | after | `const removed = plantScratch('oculus-credentials-none-', {` |
| tests/server/core/credentials.test.ts | 256 | after | `[HUB_FILE]: 'sign_in:\n  - { key: github, removed: true }\n'` |
| tests/server/core/credentials.test.ts | 257 | after | `});` |
| tests/server/core/credentials.test.ts | 258 | after | `const none = loadConfig(engineDir(), { hub: removed });` |
| tests/server/core/credentials.test.ts | 259 | after | `const noHost = { engine: engineDir(), hub: removed, from: none.from };` |
| tests/server/core/credentials.test.ts | 260 | after | `expect(helperFindings(noHost, none.config, quoted)).toEqual([]);` |
| tests/server/core/reader/reader.test.ts | 169 | before | `it('lists no source, refuses a search by any source key and sends nothing', async () => {` |
| tests/server/core/reader/reader.test.ts | 169 | after | `it('lists the sources oculus ships, in their order, and sends nothing for the list', async () => {` |
| tests/server/core/reader/reader.test.ts | 170 | after | `const hub = plantScratch('oculus-reader-shipped-', { '.oculus/config.yml': 'scan: []\n' });` |
| tests/server/core/reader/reader.test.ts | 171 | after | `const rows = literatureRows(loadConfig(engineDir(), { hub }).config);` |
| tests/server/core/reader/reader.test.ts | 171 | before | `const options = optionsOf(fetcher, { rows: [] });` |
| tests/server/core/reader/reader.test.ts | 172 | before | `expect(await asked('sources', options)).toEqual({ ok: true, sources: [] });` |
| tests/server/core/reader/reader.test.ts | 173 | before | `expect(await asked({ source: 'openalex', q: 'tensor' }, options)).toEqual({` |
| tests/server/core/reader/reader.test.ts | 174 | before | `error: 'source'` |
| tests/server/core/reader/reader.test.ts | 175 | before | `});` |
| tests/server/core/reader/reader.test.ts | 173 | after | `const answer = await asked('sources', optionsOf(fetcher, { rows }));` |
| tests/server/core/reader/reader.test.ts | 174 | after | `expect(answer).toMatchObject({ ok: true });` |
| tests/server/core/reader/reader.test.ts | 175 | after | `const listed = (answer as { sources: { id: string }[] }).sources;` |
| tests/server/core/reader/reader.test.ts | 176 | after | `expect(listed.map((one) => one.id)).toEqual(Object.keys(RECORDED));` |
| tests/server/core/reader/reader.test.ts | 807 | before | `names: ['mine', 'earlier row']` |
| tests/server/core/reader/reader.test.ts | 808 | after | `names: ['mine', 'more than one entry']` |
| tests/server/core/reader/reader.test.ts | 812 | before | `names: ['doi', 'earlier row']` |
| tests/server/core/reader/reader.test.ts | 813 | after | `names: ['doi', 'more than one entry']` |
| tests/server/core/reader/rows.yml | 289 | before | `oa: { value: true }` |
| tests/server/core/reader/rows.yml | 289 | after | `oa: { value: 'true' }` |
| tests/server/edit/config-key.test.ts | 232 | before | `before: '',` |
| tests/server/edit/config-key.test.ts | 232 | after | `before: 'ed25519',` |
| tests/state/sessions/served-roots.client.test.ts | 43 | before | `machine: { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null },` |
| tests/state/sessions/served-roots.client.test.ts | 43 | after | `machine: { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null, files: {} },` |
| tests/state/system/config/sparse-card.test.ts | 26 | before | `type Draft` |
| tests/state/system/config/sparse-card.test.ts | 30 | after | `type Draft,` |
| tests/state/system/config/sparse-card.test.ts | 31 | after | `type Step` |
| tests/state/system/config/sparse-card.test.ts | 54 | before | `recover: { ...(config.recover as object), ...(FIXTURE_CONFIG.recover as object) }` |
| tests/state/system/config/sparse-card.test.ts | 67 | after | `recover: { ...(config.recover as object), ...(FIXTURE_CONFIG.recover as object) },` |
| tests/state/system/config/sparse-card.test.ts | 68 | after | `venues: { ...(config.venues as object), ...(FIXTURE_CONFIG.venues as object) }` |
| tests/state/system/config/sparse-card.test.ts | 267 | before | `const id = '${FILE}:${key}';` |
| tests/state/system/config/sparse-card.test.ts | 268 | before | `return hubRowOf(id, {` |
| tests/state/system/config/sparse-card.test.ts | 269 | before | `hubs: ['hub', 'lab'],` |
| tests/state/system/config/sparse-card.test.ts | 270 | before | `primary: 'hub',` |
| tests/state/system/config/sparse-card.test.ts | 271 | before | `chosen: { [id]: 'lab' },` |
| tests/state/system/config/sparse-card.test.ts | 544 | after | `return hubRowOf('${FILE}:${key}', {` |
| tests/state/system/config/sparse-card.test.ts | 545 | after | `hub: 'lab',` |
| tests/state/system/config/sparse-card.test.ts | 288 | before | `async function savedTo(row: ConfigRow): Promise<(string \| undefined)[]> {` |
| tests/state/system/config/sparse-card.test.ts | 289 | before | `const write = vi.fn(() => Promise.resolve({ ok: true, changed: [row.key], refused: [] }));` |
| tests/state/system/config/sparse-card.test.ts | 290 | before | `const writer = createEditorWriter(write, {` |
| tests/state/system/config/sparse-card.test.ts | 291 | before | `reset: vi.fn(() => Promise.resolve({ ok: true, changed: [], refused: [] })),` |
| tests/state/system/config/sparse-card.test.ts | 574 | after | `function heldBy(row: ConfigRow): { keys: string[]; added: unknown } {` |
| tests/state/system/config/sparse-card.test.ts | 575 | after | `const stage = memoryStage();` |
| tests/state/system/config/sparse-card.test.ts | 576 | after | `const writer = createEditorWriter({` |
| tests/state/system/config/sparse-card.test.ts | 577 | after | `stage,` |
| tests/state/system/config/sparse-card.test.ts | 294 | before | `held: () => true,` |
| tests/state/system/config/sparse-card.test.ts | 580 | after | `held: () => undefined,` |
| tests/state/system/config/sparse-card.test.ts | 581 | after | `stale: () => false,` |
| tests/state/system/config/sparse-card.test.ts | 301 | before | `await writer.save(row, draft);` |
| tests/state/system/config/sparse-card.test.ts | 302 | before | `return write.mock.calls.map((call: unknown[]) => call[5] as string \| undefined);` |
| tests/state/system/config/sparse-card.test.ts | 588 | after | `writer.save(row, draft);` |
| tests/state/system/config/sparse-card.test.ts | 589 | after | `const held = stage.held(row);` |
| tests/state/system/config/sparse-card.test.ts | 590 | after | `const rows = held !== undefined && 'value' in held ? (held.value as unknown[]) : [];` |
| tests/state/system/config/sparse-card.test.ts | 591 | after | `return { keys: [...stage.changes.keys()], added: rows.at(-1) };` |
| tests/state/system/config/sparse-card.test.ts | 305 | before | `describe('where a change to a sparse family is written, with a second hub shown', () => {` |
| tests/state/system/config/sparse-card.test.ts | 306 | before | `it("writes literature.sources to the primary hub's file, and offers no hub", async () => {` |
| tests/state/system/config/sparse-card.test.ts | 594 | after | `describe('where a change to a sparse family is written, with a second hub in the workspace', () => {` |
| tests/state/system/config/sparse-card.test.ts | 595 | after | `it("draws literature.sources in the Primary hub scope alone, its change held for the primary's file", () => {` |
| tests/state/system/config/sparse-card.test.ts | 596 | after | `expect([` |
| tests/state/system/config/sparse-card.test.ts | 597 | after | `drawnIn({ kind: 'primary' }, 'literature.sources'),` |
| tests/state/system/config/sparse-card.test.ts | 598 | after | `drawnIn({ kind: 'hub', hub: 'lab' }, 'literature.sources')` |
| tests/state/system/config/sparse-card.test.ts | 599 | after | `]).toEqual([true, false]);` |
| tests/state/system/config/sparse-card.test.ts | 600 | after | `expect(fileOf({ kind: 'primary' }, GROUND)).toBe('hub:hub');` |
| tests/state/system/config/sparse-card.test.ts | 308 | before | `expect([row.hub, row.choice]).toEqual([undefined, undefined]);` |
| tests/state/system/config/sparse-card.test.ts | 602 | after | `expect([row.hub, row.slot]).toEqual([undefined, undefined]);` |
| tests/state/system/config/sparse-card.test.ts | 314 | before | `expect(await savedTo(row)).toEqual([undefined]);` |
| tests/state/system/config/sparse-card.test.ts | 608 | after | `const held = heldBy(row);` |
| tests/state/system/config/sparse-card.test.ts | 609 | after | `expect(held.keys).toEqual(['${FILE}:literature.sources']);` |
| tests/state/system/config/sparse-card.test.ts | 610 | after | `expect(held.added).toMatchObject({ key: 'mine', name: 'Mine' });` |
| tests/state/system/config/sparse-card.test.ts | 317 | before | `it("writes recover.sources to the hub shown, lab's file", async () => {` |
| tests/state/system/config/sparse-card.test.ts | 613 | after | `it("draws recover.sources in lab's Hub scope, its change held under lab for lab's file", () => {` |
| tests/state/system/config/sparse-card.test.ts | 614 | after | `expect(drawnIn({ kind: 'hub', hub: 'lab' }, 'recover.sources')).toBe(true);` |
| tests/state/system/config/sparse-card.test.ts | 615 | after | `expect(fileOf({ kind: 'hub', hub: 'lab' }, GROUND)).toBe('hub:lab');` |
| tests/state/system/config/sparse-card.test.ts | 319 | before | `expect(row.hub).toBe('lab');` |
| tests/state/system/config/sparse-card.test.ts | 617 | after | `expect([row.hub, row.slot]).toEqual(['lab', 'lab']);` |
| tests/state/system/config/sparse-card.test.ts | 321 | before | `expect(await savedTo(row)).toEqual(['lab']);` |
| tests/state/system/config/sparse-card.test.ts | 619 | after | `const held = heldBy(row);` |
| tests/state/system/config/sparse-card.test.ts | 620 | after | `expect(held.keys).toEqual([JSON.stringify(['${FILE}:recover.sources', 'lab'])]);` |
| tests/state/system/config/sparse-card.test.ts | 621 | after | `expect(held.added).toMatchObject({ key: 'mine', name: 'Mine' });` |
| tests/state/system/settings/editor-saved.test.ts | 23 | before | `hasSavedDraft,` |
| tests/state/system/settings/editor-saved.test.ts | 56 | before | `const ROWS = [` |
| tests/state/system/settings/editor-saved.test.ts | 57 | before | `{` |
| tests/state/system/settings/editor-saved.test.ts | 58 | before | `row: 'is marked saved once the file holds the empty family, until it is edited',` |
| tests/state/system/settings/editor-saved.test.ts | 59 | before | `pushed: {},` |
| tests/state/system/settings/editor-saved.test.ts | 60 | before | `saved: true,` |
| tests/state/system/settings/editor-saved.test.ts | 61 | before | `said: undefined` |
| tests/state/system/settings/editor-saved.test.ts | 62 | before | `},` |
| tests/state/system/settings/editor-saved.test.ts | 63 | before | `{` |
| tests/state/system/settings/editor-saved.test.ts | 64 | before | `row: 'says the file changed when the push after the answer brings another value',` |
| tests/state/system/settings/editor-saved.test.ts | 65 | before | `pushed: { next: 500 },` |
| tests/state/system/settings/editor-saved.test.ts | 66 | before | `saved: false,` |
| tests/state/system/settings/editor-saved.test.ts | 67 | before | `said: 'workbench.settings_changed_since'` |
| tests/state/system/settings/editor-saved.test.ts | 68 | before | `}` |
| tests/state/system/settings/editor-saved.test.ts | 69 | before | `];` |
| tests/state/system/settings/editor-saved.test.ts | 72 | before | `function writerOf(changed: string[]) {` |
| tests/state/system/settings/editor-saved.test.ts | 73 | before | `const write = vi.fn(() => Promise.resolve({ ok: true, changed, refused: [] }));` |
| tests/state/system/settings/editor-saved.test.ts | 74 | before | `const reset = vi.fn(() => Promise.resolve({ ok: true, changed, refused: [] }));` |
| tests/state/system/settings/editor-saved.test.ts | 61 | after | `function writerOf(stale = false, held?: Draft) {` |
| tests/state/system/settings/editor-saved.test.ts | 62 | after | `const stage = memoryStage();` |
| tests/state/system/settings/editor-saved.test.ts | 76 | before | `const writer = createEditorWriter(write, {` |
| tests/state/system/settings/editor-saved.test.ts | 77 | before | `reset,` |
| tests/state/system/settings/editor-saved.test.ts | 64 | after | `const writer = createEditorWriter({` |
| tests/state/system/settings/editor-saved.test.ts | 65 | after | `stage,` |
| tests/state/system/settings/editor-saved.test.ts | 80 | before | `held: () => true,` |
| tests/state/system/settings/editor-saved.test.ts | 68 | after | `held: () => held ?? draftOf(limits({ next: 300 })) ?? undefined,` |
| tests/state/system/settings/editor-saved.test.ts | 69 | after | `stale: () => stale,` |
| tests/state/system/settings/editor-saved.test.ts | 83 | before | `return { writer, write, reset, ended };` |
| tests/state/system/settings/editor-saved.test.ts | 72 | after | `return { writer, stage, ended };` |
| tests/state/system/settings/editor-saved.test.ts | 73 | after | `}` |
| tests/state/system/settings/editor-saved.test.ts | 76 | after | `function emptiedOf(row: ConfigRow) {` |
| tests/state/system/settings/editor-saved.test.ts | 77 | after | `const draft = draftOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 78 | after | `if (draft === null) throw new Error('no draft');` |
| tests/state/system/settings/editor-saved.test.ts | 79 | after | `return { draft, emptied: applyEdit(draft, { do: 'remove', index: 0 }) };` |
| tests/state/system/settings/editor-saved.test.ts | 86 | before | `describe('a family whose last entry is removed and saved', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 87 | before | `it.each(ROWS)('$row', async ({ pushed, saved, said }) => {` |
| tests/state/system/settings/editor-saved.test.ts | 82 | after | `describe('a family whose last entry is removed', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 83 | after | `it('is held as an unsaved change of the scope, shown, and written by nothing', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 89 | before | `const draft = draftOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 90 | before | `if (draft === null) throw new Error('no draft');` |
| tests/state/system/settings/editor-saved.test.ts | 91 | before | `const emptied = applyEdit(draft, { do: 'remove', index: 0 });` |
| tests/state/system/settings/editor-saved.test.ts | 92 | before | `const { writer, write, ended } = writerOf(['read_limits']);` |
| tests/state/system/settings/editor-saved.test.ts | 93 | before | `await writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 94 | before | `expect(write).toHaveBeenCalledWith(FILE, 'read_limits', {}, { next: 300 });` |
| tests/state/system/settings/editor-saved.test.ts | 95 | before | `expect([writer.saved(row), writer.shown(row)]).toEqual([true, {}]);` |
| tests/state/system/settings/editor-saved.test.ts | 96 | before | `expect(ended).toHaveBeenCalledWith(row);` |
| tests/state/system/settings/editor-saved.test.ts | 97 | before | `writer.pushed(limits(pushed));` |
| tests/state/system/settings/editor-saved.test.ts | 98 | before | `expect([writer.saved(row), writer.shown(row)]).toEqual([saved, undefined]);` |
| tests/state/system/settings/editor-saved.test.ts | 99 | before | `expect(writer.said(row)?.key).toBe(said);` |
| tests/state/system/settings/editor-saved.test.ts | 100 | before | `writer.clear(row);` |
| tests/state/system/settings/editor-saved.test.ts | 101 | before | `expect(writer.saved(row)).toBe(false);` |
| tests/state/system/settings/editor-saved.test.ts | 85 | after | `const { emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 86 | after | `const { writer, stage, ended } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 87 | after | `writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 88 | after | `expect(stage.held(row)).toEqual({ value: {} });` |
| tests/state/system/settings/editor-saved.test.ts | 89 | after | `expect([writer.unsaved(row), writer.shown(row)]).toEqual([true, {}]);` |
| tests/state/system/settings/editor-saved.test.ts | 90 | after | `expect(ended).not.toHaveBeenCalled();` |
| tests/state/system/settings/editor-saved.test.ts | 91 | after | `});` |
| tests/state/system/settings/editor-saved.test.ts | 93 | after | `it("drops the change when the draft is the row's value again", () => {` |
| tests/state/system/settings/editor-saved.test.ts | 94 | after | `const row = limits({ next: 300 });` |
| tests/state/system/settings/editor-saved.test.ts | 95 | after | `const { draft, emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 96 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 97 | after | `writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 98 | after | `writer.save(row, draft);` |
| tests/state/system/settings/editor-saved.test.ts | 99 | after | `expect([stage.held(row), writer.unsaved(row)]).toEqual([undefined, false]);` |
| tests/state/system/settings/editor-saved.test.ts | 100 | after | `});` |
| tests/state/system/settings/editor-saved.test.ts | 102 | after | `it('holds no change for a family no layer gives a value, an entry added and removed again', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 103 | after | `const row = limits(undefined);` |
| tests/state/system/settings/editor-saved.test.ts | 104 | after | `const empty = draftOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 105 | after | `if (empty === null) throw new Error('no draft');` |
| tests/state/system/settings/editor-saved.test.ts | 106 | after | `const added = applyEdit(empty, { do: 'add' });` |
| tests/state/system/settings/editor-saved.test.ts | 107 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 108 | after | `writer.save(row, applyEdit(added, { do: 'remove', index: 0 }));` |
| tests/state/system/settings/editor-saved.test.ts | 109 | after | `expect([row.state, stage.held(row)]).toEqual(['missing', undefined]);` |
| tests/state/system/settings/editor-saved.test.ts | 110 | after | `});` |
| tests/state/system/settings/editor-saved.test.ts | 112 | after | `it("ends the draft at the push once the scope's Save left the file holding it", () => {` |
| tests/state/system/settings/editor-saved.test.ts | 113 | after | `const row = limits({ next: 300 });` |
| tests/state/system/settings/editor-saved.test.ts | 114 | after | `const { emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 115 | after | `const { writer, stage, ended } = writerOf(false, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 116 | after | `writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 117 | after | `stage.drop(row);` |
| tests/state/system/settings/editor-saved.test.ts | 118 | after | `writer.pushed({ ...limits({}), value: {} });` |
| tests/state/system/settings/editor-saved.test.ts | 119 | after | `expect(ended).toHaveBeenCalledTimes(1);` |
| tests/state/system/settings/editor-saved.test.ts | 120 | after | `});` |
| tests/state/system/settings/editor-saved.test.ts | 122 | after | `it('keeps the change held when a push brings another value', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 123 | after | `const row = limits({ next: 300 });` |
| tests/state/system/settings/editor-saved.test.ts | 124 | after | `const { emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 125 | after | `const { writer, stage, ended } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 126 | after | `writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 127 | after | `writer.pushed(limits({ next: 500 }));` |
| tests/state/system/settings/editor-saved.test.ts | 128 | after | `expect([stage.held(row), ended.mock.calls]).toEqual([{ value: {} }, []]);` |
| tests/state/system/settings/editor-saved.test.ts | 129 | after | `});` |
| tests/state/system/settings/editor-saved.test.ts | 131 | after | `it('holds a kept draft again at a push, unless the file moved from the value it was started over', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 132 | after | `const kept = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 133 | after | `kept.writer.pushed(limits({ next: 500 }));` |
| tests/state/system/settings/editor-saved.test.ts | 134 | after | `expect(kept.stage.held(limits({ next: 500 }))).toEqual({ value: { next: 300 } });` |
| tests/state/system/settings/editor-saved.test.ts | 135 | after | `const moved = writerOf(true);` |
| tests/state/system/settings/editor-saved.test.ts | 136 | after | `moved.writer.pushed(limits({ next: 500 }));` |
| tests/state/system/settings/editor-saved.test.ts | 137 | after | `expect(moved.stage.held(limits({ next: 500 }))).toBeUndefined();` |
| tests/state/system/settings/editor-saved.test.ts | 105 | before | `describe('a draft made with a hub other than the primary chosen', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 141 | after | `describe('a draft made in the Hub scope of a hub other than the primary', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 109 | before | `it("is kept under lab, drawn again when lab is chosen again, and never shown on the primary's row", () => {` |
| tests/state/system/settings/editor-saved.test.ts | 145 | after | `it("is kept under lab, drawn again in lab's scope, and never shown on the primary's row", () => {` |
| tests/state/system/settings/editor-saved.test.ts | 111 | before | `const draft = draftOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 112 | before | `if (draft === null) throw new Error('no draft');` |
| tests/state/system/settings/editor-saved.test.ts | 113 | before | `const emptied = applyEdit(draft, { do: 'remove', index: 0 });` |
| tests/state/system/settings/editor-saved.test.ts | 147 | after | `const { draft, emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 117 | before | `expect(hasSavedDraft(state, slotOf(limits({ next: 300 })))).toBe(false);` |
| tests/state/system/settings/editor-saved.test.ts | 126 | before | `it("names lab in its write, is ended by lab's push alone, and says lab's refusal on lab's row", async () => {` |
| tests/state/system/settings/editor-saved.test.ts | 159 | after | `it("holds its change under lab, apart from the primary's row of the same key", () => {` |
| tests/state/system/settings/editor-saved.test.ts | 128 | before | `const draft = draftOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 129 | before | `if (draft === null) throw new Error('no draft');` |
| tests/state/system/settings/editor-saved.test.ts | 130 | before | `const emptied = applyEdit(draft, { do: 'remove', index: 0 });` |
| tests/state/system/settings/editor-saved.test.ts | 131 | before | `let answer = (_: WriteAnswer): void => undefined;` |
| tests/state/system/settings/editor-saved.test.ts | 132 | before | `const write = vi.fn(() => new Promise<WriteAnswer>((done) => (answer = done)));` |
| tests/state/system/settings/editor-saved.test.ts | 133 | before | `const ended = vi.fn();` |
| tests/state/system/settings/editor-saved.test.ts | 134 | before | `const writer = createEditorWriter(write, {` |
| tests/state/system/settings/editor-saved.test.ts | 135 | before | `reset: vi.fn(),` |
| tests/state/system/settings/editor-saved.test.ts | 136 | before | `changed: () => undefined,` |
| tests/state/system/settings/editor-saved.test.ts | 137 | before | `ended,` |
| tests/state/system/settings/editor-saved.test.ts | 138 | before | `held: () => true,` |
| tests/state/system/settings/editor-saved.test.ts | 139 | before | `lists: () => ({}) as Lists` |
| tests/state/system/settings/editor-saved.test.ts | 140 | before | `});` |
| tests/state/system/settings/editor-saved.test.ts | 141 | before | `const out = writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 142 | before | `expect(write).toHaveBeenCalledWith(FILE, 'read_limits', {}, { next: 300 }, false, 'lab');` |
| tests/state/system/settings/editor-saved.test.ts | 143 | before | `writer.pushed(limits({ next: 500 }));` |
| tests/state/system/settings/editor-saved.test.ts | 144 | before | `expect([writer.sending(row), ended.mock.calls]).toEqual([true, []]);` |
| tests/state/system/settings/editor-saved.test.ts | 145 | before | `answer({ ok: true, changed: [], refused: [{ field: 'x', reason: 'changed since' }] });` |
| tests/state/system/settings/editor-saved.test.ts | 146 | before | `await out;` |
| tests/state/system/settings/editor-saved.test.ts | 147 | before | `expect(writer.said(row)?.key).toBe('workbench.settings_refused');` |
| tests/state/system/settings/editor-saved.test.ts | 148 | before | `expect(writer.said(limits({ next: 300 }))).toBeNull();` |
| tests/state/system/settings/editor-saved.test.ts | 161 | after | `const { emptied } = emptiedOf(row);` |
| tests/state/system/settings/editor-saved.test.ts | 162 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 163 | after | `writer.save(row, emptied);` |
| tests/state/system/settings/editor-saved.test.ts | 164 | after | `expect([stage.held(row), stage.held(limits({ next: 300 }))]).toEqual([` |
| tests/state/system/settings/editor-saved.test.ts | 165 | after | `{ value: {} },` |
| tests/state/system/settings/editor-saved.test.ts | 166 | after | `undefined` |
| tests/state/system/settings/editor-saved.test.ts | 167 | after | `]);` |
| tests/state/system/settings/editor-saved.test.ts | 168 | after | `expect(writer.unsaved(limits({ next: 300 }))).toBe(false);` |
| tests/state/system/settings/editor-saved.test.ts | 154 | before | `const lab = (read: HubRead): ConfigRow =>` |
| tests/state/system/settings/editor-saved.test.ts | 155 | before | `hubRowOf(STAGES, { hubs: ['hub', 'lab'], primary: 'hub', chosen: LAB_CHOSEN, read });` |
| tests/state/system/settings/editor-saved.test.ts | 176 | after | `const lab = (read: HubRead): ConfigRow => hubRowOf(STAGES, { hub: 'lab', read });` |
| tests/state/system/settings/editor-saved.test.ts | 177 | before | `it('sends the reset of a family the workspace file sets and shows the default', async () => {` |
| tests/state/system/settings/editor-saved.test.ts | 198 | after | `it('holds the reset of a family the workspace file sets and shows the default', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 180 | before | `const { writer, write, reset } = writerOf(['read_limits']);` |
| tests/state/system/settings/editor-saved.test.ts | 181 | before | `await writer.reset(row);` |
| tests/state/system/settings/editor-saved.test.ts | 182 | before | `expect(reset).toHaveBeenCalledWith(FILE, 'read_limits');` |
| tests/state/system/settings/editor-saved.test.ts | 183 | before | `expect(write).not.toHaveBeenCalled();` |
| tests/state/system/settings/editor-saved.test.ts | 201 | after | `const { writer, stage, ended } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 202 | after | `writer.reset(row);` |
| tests/state/system/settings/editor-saved.test.ts | 203 | after | `expect(stage.held(row)).toEqual({ reset: true });` |
| tests/state/system/settings/editor-saved.test.ts | 187 | before | `it('sends nothing for a family the workspace file does not set', async () => {` |
| tests/state/system/settings/editor-saved.test.ts | 208 | after | `it('holds nothing for a family the workspace file does not set', () => {` |
| tests/state/system/settings/editor-saved.test.ts | 190 | before | `const { writer, reset } = writerOf([]);` |
| tests/state/system/settings/editor-saved.test.ts | 191 | before | `await writer.reset(row);` |
| tests/state/system/settings/editor-saved.test.ts | 192 | before | `expect(reset).not.toHaveBeenCalled();` |
| tests/state/system/settings/editor-saved.test.ts | 211 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/editor-saved.test.ts | 212 | after | `writer.reset(row);` |
| tests/state/system/settings/editor-saved.test.ts | 213 | after | `expect(stage.held(row)).toBeUndefined();` |
| tests/state/system/settings/fixture.ts | 65 | before | `export const LAB_CHOSEN = { [STAGES]: 'lab' };` |
| tests/state/system/settings/fixture.ts | 72 | before | `hubs: string[];` |
| tests/state/system/settings/fixture.ts | 73 | before | `primary: string \| null;` |
| tests/state/system/settings/fixture.ts | 74 | before | `chosen?: Record<string, string>;` |
| tests/state/system/settings/fixture.ts | 71 | after | `hub?: string;` |
| tests/state/system/settings/fixture.ts | 86 | before | `const rows = withHubs(groups, {` |
| tests/state/system/settings/fixture.ts | 87 | before | `hubs: one.hubs,` |
| tests/state/system/settings/fixture.ts | 88 | before | `primary: one.primary,` |
| tests/state/system/settings/fixture.ts | 89 | before | `chosen: one.chosen ?? {},` |
| tests/state/system/settings/fixture.ts | 90 | before | `config,` |
| tests/state/system/settings/fixture.ts | 91 | before | `read: () => one.read ?? LAB_READ,` |
| tests/state/system/settings/fixture.ts | 92 | before | `file: () => one.file ?? { text: text(LAB_FILE), present: true }` |
| tests/state/system/settings/fixture.ts | 93 | before | `}).flatMap((group) => group.sections.flatMap((section) => section.rows));` |
| tests/state/system/settings/fixture.ts | 86 | after | `const drawn =` |
| tests/state/system/settings/fixture.ts | 87 | after | `one.hub === undefined` |
| tests/state/system/settings/fixture.ts | 88 | after | `? groups` |
| tests/state/system/settings/fixture.ts | 89 | after | `: withHubs(groups, {` |
| tests/state/system/settings/fixture.ts | 90 | after | `hub: one.hub,` |
| tests/state/system/settings/fixture.ts | 91 | after | `config,` |
| tests/state/system/settings/fixture.ts | 92 | after | `read: () => one.read ?? LAB_READ,` |
| tests/state/system/settings/fixture.ts | 93 | after | `file: () => one.file ?? { text: text(LAB_FILE), present: true }` |
| tests/state/system/settings/fixture.ts | 94 | after | `});` |
| tests/state/system/settings/fixture.ts | 95 | after | `const rows = drawn.flatMap((group) => group.sections.flatMap((section) => section.rows));` |
| tests/state/system/settings/machine-section.test.ts | 19 | before | `function machineGroup(machine: Parameters<typeof settingsGroups>[5]) {` |
| tests/state/system/settings/machine-section.test.ts | 20 | before | `const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], machine);` |
| tests/state/system/settings/machine-section.test.ts | 30 | after | `const MACHINE: LocalScope['machine'] = {` |
| tests/state/system/settings/machine-section.test.ts | 31 | after | `primary: 'hub',` |
| tests/state/system/settings/machine-section.test.ts | 32 | after | `set: [],` |
| tests/state/system/settings/machine-section.test.ts | 33 | after | `defaults: DEFAULTS,` |
| tests/state/system/settings/machine-section.test.ts | 34 | after | `values: {},` |
| tests/state/system/settings/machine-section.test.ts | 35 | after | `hubs: {},` |
| tests/state/system/settings/machine-section.test.ts | 36 | after | `portRefused: null` |
| tests/state/system/settings/machine-section.test.ts | 37 | after | `};` |
| tests/state/system/settings/machine-section.test.ts | 40 | after | `function answered(values: Record<string, unknown>, unparsed: number \| null = null): LocalFile {` |
| tests/state/system/settings/machine-section.test.ts | 41 | after | `return { present: true, digest: 'd', values: unparsed === null ? values : null, unparsed };` |
| tests/state/system/settings/machine-section.test.ts | 42 | after | `}` |
| tests/state/system/settings/machine-section.test.ts | 45 | after | `function machineRows(of: Omit<LocalScope, 'machine'>): ConfigRow[] {` |
| tests/state/system/settings/machine-section.test.ts | 46 | after | `const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], {` |
| tests/state/system/settings/machine-section.test.ts | 47 | after | `...of,` |
| tests/state/system/settings/machine-section.test.ts | 48 | after | `machine: MACHINE` |
| tests/state/system/settings/machine-section.test.ts | 49 | after | `});` |
| tests/state/system/settings/machine-section.test.ts | 23 | before | `const rows = group.sections.flatMap((section) => section.rows) as (LocalRow \| ConfigRow)[];` |
| tests/state/system/settings/machine-section.test.ts | 24 | before | `return { group, rows, byKey: (key: string) => rows.find((row) => row.key === key) };` |
| tests/state/system/settings/machine-section.test.ts | 52 | after | `return group.sections` |
| tests/state/system/settings/machine-section.test.ts | 53 | after | `.flatMap((section) => section.rows)` |
| tests/state/system/settings/machine-section.test.ts | 54 | after | `.filter((row): row is ConfigRow => row.kind === 'config');` |
| tests/state/system/settings/machine-section.test.ts | 27 | before | `describe('the "This machine" section', () => {` |
| tests/state/system/settings/machine-section.test.ts | 28 | before | `it('reads "set in <primary>" for the keys the primary sets and the default for the others', () => {` |
| tests/state/system/settings/machine-section.test.ts | 29 | before | `const { byKey, group } = machineGroup({` |
| tests/state/system/settings/machine-section.test.ts | 30 | before | `primary: 'lab',` |
| tests/state/system/settings/machine-section.test.ts | 31 | before | `set: ['port', 'claude_bin'],` |
| tests/state/system/settings/machine-section.test.ts | 32 | before | `defaults: DEFAULTS,` |
| tests/state/system/settings/machine-section.test.ts | 33 | before | `values: {},` |
| tests/state/system/settings/machine-section.test.ts | 34 | before | `hubs: {},` |
| tests/state/system/settings/machine-section.test.ts | 35 | before | `portRefused: null` |
| tests/state/system/settings/machine-section.test.ts | 36 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 37 | before | `expect(byKey('port')).toMatchObject({ setIn: 'lab', fallback: '8790' });` |
| tests/state/system/settings/machine-section.test.ts | 38 | before | `expect(byKey('claude_bin')).toMatchObject({ setIn: 'lab', fallback: 'claude' });` |
| tests/state/system/settings/machine-section.test.ts | 39 | before | `expect(byKey('rite_dap_bin')).toMatchObject({ setIn: null, fallback: 'rite_dap' });` |
| tests/state/system/settings/machine-section.test.ts | 40 | before | `expect(group.about).toBe('');` |
| tests/state/system/settings/machine-section.test.ts | 58 | after | `const topKey = (row: ConfigRow): string => row.key.split('.')[0];` |
| tests/state/system/settings/machine-section.test.ts | 61 | after | `const GROUND: ScopeGround = {` |
| tests/state/system/settings/machine-section.test.ts | 62 | after | `folders: [` |
| tests/state/system/settings/machine-section.test.ts | 63 | after | `{ key: 'hub', dir: '/w/hub', hub: true },` |
| tests/state/system/settings/machine-section.test.ts | 64 | after | `{ key: 'lab', dir: '/w/lab', hub: true }` |
| tests/state/system/settings/machine-section.test.ts | 65 | after | `],` |
| tests/state/system/settings/machine-section.test.ts | 66 | after | `primary: 'hub',` |
| tests/state/system/settings/machine-section.test.ts | 67 | after | `workspaceFile: '.oculus/workspaces/w.yml'` |
| tests/state/system/settings/machine-section.test.ts | 68 | after | `};` |
| tests/state/system/settings/machine-section.test.ts | 71 | after | `function drawnIn(scope: Scope): string[] {` |
| tests/state/system/settings/machine-section.test.ts | 72 | after | `const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], {` |
| tests/state/system/settings/machine-section.test.ts | 73 | after | `hub: 'hub',` |
| tests/state/system/settings/machine-section.test.ts | 74 | after | `primary: true,` |
| tests/state/system/settings/machine-section.test.ts | 75 | after | `file: answered({}),` |
| tests/state/system/settings/machine-section.test.ts | 76 | after | `machine: MACHINE` |
| tests/state/system/settings/machine-section.test.ts | 77 | after | `});` |
| tests/state/system/settings/machine-section.test.ts | 78 | after | `const file = { name: 'f', present: true, blocked: null, digest: 'd' };` |
| tests/state/system/settings/machine-section.test.ts | 79 | after | `return scopeGroups(groups, scope, GROUND, file)` |
| tests/state/system/settings/machine-section.test.ts | 80 | after | `.flatMap((group) => group.sections.flatMap((section) => section.rows))` |
| tests/state/system/settings/machine-section.test.ts | 81 | after | `.filter((row: Row): row is ConfigRow => row.kind === 'config' && row.file === 'local.yml')` |
| tests/state/system/settings/machine-section.test.ts | 82 | after | `.map(topKey);` |
| tests/state/system/settings/machine-section.test.ts | 83 | after | `}` |
| tests/state/system/settings/machine-section.test.ts | 85 | after | `describe('the This machine scope', () => {` |
| tests/state/system/settings/machine-section.test.ts | 86 | after | `it("draws every key of local.yml for the primary, with a control, the file's value and the default", () => {` |
| tests/state/system/settings/machine-section.test.ts | 87 | after | `const rows = machineRows({ hub: 'hub', primary: true, file: answered({ port: 8798 }) });` |
| tests/state/system/settings/machine-section.test.ts | 88 | after | `expect(rows.map(topKey).sort()).toEqual([...LOCAL_KEYS].sort());` |
| tests/state/system/settings/machine-section.test.ts | 89 | after | `const port = rows.find((row) => row.key === 'port');` |
| tests/state/system/settings/machine-section.test.ts | 90 | after | `expect([port?.value, port?.default, port?.own, port?.blocked]).toEqual([` |
| tests/state/system/settings/machine-section.test.ts | 91 | after | `8798,` |
| tests/state/system/settings/machine-section.test.ts | 92 | after | `8790,` |
| tests/state/system/settings/machine-section.test.ts | 93 | after | `true,` |
| tests/state/system/settings/machine-section.test.ts | 94 | after | `undefined` |
| tests/state/system/settings/machine-section.test.ts | 95 | after | `]);` |
| tests/state/system/settings/machine-section.test.ts | 96 | after | `const claude = rows.find((row) => row.key === 'claude_bin');` |
| tests/state/system/settings/machine-section.test.ts | 97 | after | `expect([claude?.value, claude?.default, claude?.state]).toEqual([` |
| tests/state/system/settings/machine-section.test.ts | 98 | after | `undefined,` |
| tests/state/system/settings/machine-section.test.ts | 99 | after | `'claude',` |
| tests/state/system/settings/machine-section.test.ts | 100 | after | `'missing'` |
| tests/state/system/settings/machine-section.test.ts | 101 | after | `]);` |
| tests/state/system/settings/machine-section.test.ts | 102 | after | `const undrawn = rows.filter((row) => writtenWhole(row.control) && draftOf(row) === null);` |
| tests/state/system/settings/machine-section.test.ts | 103 | after | `expect(undrawn.map((row) => row.key)).toEqual([]);` |
| tests/state/system/settings/machine-section.test.ts | 104 | after | `});` |
| tests/state/system/settings/machine-section.test.ts | 106 | after | `it('draws only the joined keys for a hub other than the primary, kept under that hub', () => {` |
| tests/state/system/settings/machine-section.test.ts | 107 | after | `const rows = machineRows({ hub: 'lab', primary: false, file: answered({}) });` |
| tests/state/system/settings/machine-section.test.ts | 108 | after | `expect(rows.map((row) => row.key).sort()).toEqual([...JOINED_LOCAL_KEYS].sort());` |
| tests/state/system/settings/machine-section.test.ts | 109 | after | `expect(rows.every((row) => row.slot === 'lab' && row.hub === 'lab')).toBe(true);` |
| tests/state/system/settings/machine-section.test.ts | 43 | before | `it('lists every key of the catalog, whatever the file sets', () => {` |
| tests/state/system/settings/machine-section.test.ts | 44 | before | `const { rows } = machineGroup({` |
| tests/state/system/settings/machine-section.test.ts | 45 | before | `primary: 'lab',` |
| tests/state/system/settings/machine-section.test.ts | 46 | before | `set: [],` |
| tests/state/system/settings/machine-section.test.ts | 47 | before | `defaults: {},` |
| tests/state/system/settings/machine-section.test.ts | 48 | before | `values: {},` |
| tests/state/system/settings/machine-section.test.ts | 49 | before | `hubs: {},` |
| tests/state/system/settings/machine-section.test.ts | 50 | before | `portRefused: null` |
| tests/state/system/settings/machine-section.test.ts | 51 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 52 | before | `expect(rows.map((row) => row.key)).toEqual(Object.keys(shipped['local.yml']));` |
| tests/state/system/settings/machine-section.test.ts | 112 | after | `it('holds a downloads secret as set, never as its value', () => {` |
| tests/state/system/settings/machine-section.test.ts | 113 | after | `const downloads = [{ service: 'ieee', user: 'me', secret: true }];` |
| tests/state/system/settings/machine-section.test.ts | 114 | after | `const rows = machineRows({ hub: 'hub', primary: true, file: answered({ downloads }) });` |
| tests/state/system/settings/machine-section.test.ts | 115 | after | `expect(rows.find((row) => row.key === 'downloads')?.value).toEqual(downloads);` |
| tests/state/system/settings/machine-section.test.ts | 55 | before | `it('shows every default and says there is no primary when the workspace has none', () => {` |
| tests/state/system/settings/machine-section.test.ts | 56 | before | `const { rows, group, byKey } = machineGroup({` |
| tests/state/system/settings/machine-section.test.ts | 57 | before | `primary: null,` |
| tests/state/system/settings/machine-section.test.ts | 58 | before | `set: ['port'],` |
| tests/state/system/settings/machine-section.test.ts | 59 | before | `defaults: DEFAULTS,` |
| tests/state/system/settings/machine-section.test.ts | 60 | before | `values: {},` |
| tests/state/system/settings/machine-section.test.ts | 61 | before | `hubs: {},` |
| tests/state/system/settings/machine-section.test.ts | 62 | before | `portRefused: null` |
| tests/state/system/settings/machine-section.test.ts | 63 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 64 | before | `const local = rows.filter((row): row is LocalRow => row.kind === 'local');` |
| tests/state/system/settings/machine-section.test.ts | 65 | before | `expect(local.every((row) => row.setIn === null)).toBe(true);` |
| tests/state/system/settings/machine-section.test.ts | 66 | before | `expect(local.find((row) => row.key === 'port')?.fallback).toBe('8790');` |
| tests/state/system/settings/machine-section.test.ts | 67 | before | `expect(byKey('self')).toMatchObject({` |
| tests/state/system/settings/machine-section.test.ts | 68 | before | `own: false,` |
| tests/state/system/settings/machine-section.test.ts | 69 | before | `blocked: { key: 'workbench.settings_no_primary' }` |
| tests/state/system/settings/machine-section.test.ts | 70 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 71 | before | `expect(group.about).not.toBe('');` |
| tests/state/system/settings/machine-section.test.ts | 118 | after | `it.each([` |
| tests/state/system/settings/machine-section.test.ts | 119 | after | `{` |
| tests/state/system/settings/machine-section.test.ts | 120 | after | `name: 'is not answered yet',` |
| tests/state/system/settings/machine-section.test.ts | 121 | after | `file: undefined,` |
| tests/state/system/settings/machine-section.test.ts | 122 | after | `said: 'workbench.settings_loading',` |
| tests/state/system/settings/machine-section.test.ts | 123 | after | `args: ['hub/.oculus/local.yml']` |
| tests/state/system/settings/machine-section.test.ts | 124 | after | `},` |
| tests/state/system/settings/machine-section.test.ts | 125 | after | `{` |
| tests/state/system/settings/machine-section.test.ts | 126 | after | `name: 'does not parse',` |
| tests/state/system/settings/machine-section.test.ts | 127 | after | `file: answered({}, 4),` |
| tests/state/system/settings/machine-section.test.ts | 128 | after | `said: 'workbench.settings_unparsed_at',` |
| tests/state/system/settings/machine-section.test.ts | 129 | after | `args: ['hub/.oculus/local.yml', 4]` |
| tests/state/system/settings/machine-section.test.ts | 130 | after | `}` |
| tests/state/system/settings/machine-section.test.ts | 131 | after | `])('says why every row writes nothing while the file $name', ({ file, said, args }) => {` |
| tests/state/system/settings/machine-section.test.ts | 132 | after | `const rows = machineRows({ hub: 'hub', primary: true, file });` |
| tests/state/system/settings/machine-section.test.ts | 133 | after | `expect(rows.every((row) => row.blocked?.key === said)).toBe(true);` |
| tests/state/system/settings/machine-section.test.ts | 134 | after | `expect(rows[0].blocked?.args).toEqual(args);` |
| tests/state/system/settings/machine-section.test.ts | 74 | before | `it("opens the primary's .oculus/local.yml through the primary's folder, and nothing with no primary", () => {` |
| tests/state/system/settings/machine-section.test.ts | 75 | before | `const { group } = machineGroup({` |
| tests/state/system/settings/machine-section.test.ts | 76 | before | `primary: 'lab',` |
| tests/state/system/settings/machine-section.test.ts | 77 | before | `set: [],` |
| tests/state/system/settings/machine-section.test.ts | 78 | before | `defaults: {},` |
| tests/state/system/settings/machine-section.test.ts | 79 | before | `values: {},` |
| tests/state/system/settings/machine-section.test.ts | 80 | before | `hubs: {},` |
| tests/state/system/settings/machine-section.test.ts | 81 | before | `portRefused: null` |
| tests/state/system/settings/machine-section.test.ts | 82 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 83 | before | `const [line] = group.lines;` |
| tests/state/system/settings/machine-section.test.ts | 84 | before | `expect(line.file).toBe('.oculus/local.yml');` |
| tests/state/system/settings/machine-section.test.ts | 85 | before | `const engine = { root: 'oculus', path: 'config' };` |
| tests/state/system/settings/machine-section.test.ts | 86 | before | `const { root, path } = line.opens;` |
| tests/state/system/settings/machine-section.test.ts | 87 | before | `expect(openTarget(root, path, { primary: 'lab', engine })).toEqual({` |
| tests/state/system/settings/machine-section.test.ts | 88 | before | `root: 'lab',` |
| tests/state/system/settings/machine-section.test.ts | 89 | before | `path: '.oculus/local.yml'` |
| tests/state/system/settings/machine-section.test.ts | 90 | before | `});` |
| tests/state/system/settings/machine-section.test.ts | 91 | before | `expect(openTarget(root, path, { primary: null, engine })).toBeNull();` |
| tests/state/system/settings/machine-section.test.ts | 137 | after | `it("is the only scope that draws a key of local.yml, and port only in the primary's", () => {` |
| tests/state/system/settings/machine-section.test.ts | 138 | after | `expect(drawnIn({ kind: 'local', hub: 'hub' }).sort()).toEqual([...LOCAL_KEYS].sort());` |
| tests/state/system/settings/machine-section.test.ts | 139 | after | `for (const scope of [` |
| tests/state/system/settings/machine-section.test.ts | 140 | after | `{ kind: 'workspace' },` |
| tests/state/system/settings/machine-section.test.ts | 141 | after | `{ kind: 'primary' },` |
| tests/state/system/settings/machine-section.test.ts | 142 | after | `{ kind: 'hub', hub: 'lab' }` |
| tests/state/system/settings/machine-section.test.ts | 143 | after | `] as Scope[]) {` |
| tests/state/system/settings/machine-section.test.ts | 144 | after | `expect(drawnIn(scope)).toEqual([]);` |
| tests/state/system/settings/machine-section.test.ts | 145 | after | `}` |
| tests/state/system/settings/machine-section.test.ts | 146 | after | `expect(` |
| tests/state/system/settings/machine-section.test.ts | 147 | after | `machineRows({ hub: 'lab', primary: false, file: answered({}) }).map((row) => row.key)` |
| tests/state/system/settings/machine-section.test.ts | 148 | after | `).not.toContain('port');` |
| tests/state/system/settings/port-row.test.ts | 15 | before | `machineRows,` |
| tests/state/system/settings/port-row.test.ts | 16 | before | `type ConfigRow,` |
| tests/state/system/settings/port-row.test.ts | 17 | before | `type LocalRow` |
| tests/state/system/settings/port-row.test.ts | 32 | before | `const isPort = (row: LocalRow \| ConfigRow): row is LocalRow =>` |
| tests/state/system/settings/port-row.test.ts | 33 | before | `row.kind === 'local' && row.key === 'port';` |
| tests/state/system/settings/port-row.test.ts | 29 | after | `function portRow(machine: LocalScope['machine']) {` |
| tests/state/system/settings/port-row.test.ts | 30 | after | `const file = { present: true, digest: 'd', values: { port: 8790 }, unparsed: null };` |
| tests/state/system/settings/port-row.test.ts | 31 | after | `const rows = localRows(shipped['local.yml'], { hub: 'lab', primary: true, file, machine });` |
| tests/state/system/settings/port-row.test.ts | 32 | after | `return rows.find((row) => row.key === 'port');` |
| tests/state/system/settings/port-row.test.ts | 33 | after | `}` |
| tests/state/system/settings/port-row.test.ts | 55 | before | `const rows = machineRows(shipped['local.yml'], {` |
| tests/state/system/settings/port-row.test.ts | 55 | after | `const port = portRow({` |
| tests/state/system/settings/port-row.test.ts | 63 | before | `const port = rows.find(isPort);` |
| tests/state/system/settings/port-row.test.ts | 64 | before | `expect(port?.lines).toEqual(['8798']);` |
| tests/state/system/settings/port-row.test.ts | 65 | before | `const sentence = port?.refused === null \|\| port === undefined ? '' : said(port.refused);` |
| tests/state/system/settings/port-row.test.ts | 63 | after | `expect(port?.value).toBe(8790);` |
| tests/state/system/settings/port-row.test.ts | 64 | after | `const sentence = port?.note === undefined ? '' : said(port.note);` |
| tests/state/system/settings/port-row.test.ts | 78 | before | `const rows = machineRows(shipped['local.yml'], {` |
| tests/state/system/settings/port-row.test.ts | 77 | after | `const port = portRow({` |
| tests/state/system/settings/port-row.test.ts | 86 | before | `expect(rows.find(isPort)?.refused).toBeNull();` |
| tests/state/system/settings/port-row.test.ts | 85 | after | `expect(port?.note).toBeUndefined();` |
| tests/state/system/settings/row-writer.test.ts | 15 | before | `placeOf,` |
| tests/state/system/settings/row-writer.test.ts | 54 | before | `async function resetOf(row: ConfigRow): Promise<{ writes: unknown[]; resets: unknown[] }> {` |
| tests/state/system/settings/row-writer.test.ts | 55 | before | `const answer = () => Promise.resolve({ ok: true, changed: [], refused: [] });` |
| tests/state/system/settings/row-writer.test.ts | 56 | before | `const write = vi.fn((_file: string, _key: string, _value: unknown) => answer());` |
| tests/state/system/settings/row-writer.test.ts | 57 | before | `const reset = vi.fn((_file: string, _key: string) => answer());` |
| tests/state/system/settings/row-writer.test.ts | 57 | after | `const LOADING = { folder: () => ({ state: 'loading' }) } as unknown as Lists;` |
| tests/state/system/settings/row-writer.test.ts | 60 | after | `function writerOf() {` |
| tests/state/system/settings/row-writer.test.ts | 61 | after | `const stage = memoryStage();` |
| tests/state/system/settings/row-writer.test.ts | 62 | after | `const listed: (string \| undefined)[] = [];` |
| tests/state/system/settings/row-writer.test.ts | 59 | before | `write,` |
| tests/state/system/settings/row-writer.test.ts | 60 | before | `reset,` |
| tests/state/system/settings/row-writer.test.ts | 64 | after | `stage,` |
| tests/state/system/settings/row-writer.test.ts | 62 | before | `() => ({}) as Lists` |
| tests/state/system/settings/row-writer.test.ts | 66 | after | `(row) => {` |
| tests/state/system/settings/row-writer.test.ts | 67 | after | `listed.push(row.hub);` |
| tests/state/system/settings/row-writer.test.ts | 68 | after | `return LOADING;` |
| tests/state/system/settings/row-writer.test.ts | 69 | after | `}` |
| tests/state/system/settings/row-writer.test.ts | 64 | before | `await writer.reset(row);` |
| tests/state/system/settings/row-writer.test.ts | 65 | before | `return { writes: write.mock.calls, resets: reset.mock.calls };` |
| tests/state/system/settings/row-writer.test.ts | 71 | after | `return { writer, stage, listed };` |
| tests/state/system/settings/row-writer.test.ts | 72 | after | `}` |
| tests/state/system/settings/row-writer.test.ts | 75 | after | `function resetOf(row: ConfigRow): unknown {` |
| tests/state/system/settings/row-writer.test.ts | 76 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/row-writer.test.ts | 77 | after | `writer.reset(row);` |
| tests/state/system/settings/row-writer.test.ts | 78 | after | `return stage.held(row);` |
| tests/state/system/settings/row-writer.test.ts | 82 | before | `expect(placeOf(row)).toEqual({ root: 'hub', file: WORKSPACE });` |
| tests/state/system/settings/row-writer.test.ts | 95 | after | `expect([row.place.root, row.place.path]).toEqual(['hub', WORKSPACE]);` |
| tests/state/system/settings/row-writer.test.ts | 102 | before | `expect([placeOf(row), row.place.present]).toEqual([null, false]);` |
| tests/state/system/settings/row-writer.test.ts | 115 | after | `expect([row.place.path, row.place.present]).toEqual([null, false]);` |
| tests/state/system/settings/row-writer.test.ts | 116 | after | `});` |
| tests/state/system/settings/row-writer.test.ts | 117 | after | `});` |
| tests/state/system/settings/row-writer.test.ts | 119 | after | `describe('a change of a Settings row', () => {` |
| tests/state/system/settings/row-writer.test.ts | 120 | after | `it("is held as an unsaved change, shown, and dropped when the value is the row's again", () => {` |
| tests/state/system/settings/row-writer.test.ts | 121 | after | `const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace(''));` |
| tests/state/system/settings/row-writer.test.ts | 122 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/row-writer.test.ts | 123 | after | `writer.submit(row, 'vscode-dark-2026');` |
| tests/state/system/settings/row-writer.test.ts | 124 | after | `expect(stage.held(row)).toEqual({ value: 'vscode-dark-2026' });` |
| tests/state/system/settings/row-writer.test.ts | 125 | after | `expect([writer.pending(row), writer.shown(row)]).toEqual([true, 'vscode-dark-2026']);` |
| tests/state/system/settings/row-writer.test.ts | 126 | after | `writer.submit(row, 'tokens');` |
| tests/state/system/settings/row-writer.test.ts | 127 | after | `expect([stage.held(row), writer.pending(row)]).toEqual([undefined, false]);` |
| tests/state/system/settings/row-writer.test.ts | 107 | before | `it('sends the reset of a key the workspace file holds, and no write', async () => {` |
| tests/state/system/settings/row-writer.test.ts | 132 | after | `it('holds the reset of a key the workspace file holds', () => {` |
| tests/state/system/settings/row-writer.test.ts | 113 | before | `expect(await resetOf(row)).toEqual({ writes: [], resets: [[FILE, 'code_theme']] });` |
| tests/state/system/settings/row-writer.test.ts | 138 | after | `expect(resetOf(row)).toEqual({ reset: true });` |
| tests/state/system/settings/row-writer.test.ts | 116 | before | `it('sends the reset of a key the workspace file sets to the default value', async () => {` |
| tests/state/system/settings/row-writer.test.ts | 141 | after | `it('holds the reset of a key the workspace file sets to the default value', () => {` |
| tests/state/system/settings/row-writer.test.ts | 123 | before | `expect(await resetOf(row)).toEqual({ writes: [], resets: [[FILE, 'code_theme']] });` |
| tests/state/system/settings/row-writer.test.ts | 148 | after | `expect(resetOf(row)).toEqual({ reset: true });` |
| tests/state/system/settings/row-writer.test.ts | 126 | before | `it('sends nothing for a key no file of the user holds', async () => {` |
| tests/state/system/settings/row-writer.test.ts | 151 | after | `it('holds nothing for a key no file of the user holds', () => {` |
| tests/state/system/settings/row-writer.test.ts | 128 | before | `expect(await resetOf(row)).toEqual({ writes: [], resets: [] });` |
| tests/state/system/settings/row-writer.test.ts | 153 | after | `expect(resetOf(row)).toBeUndefined();` |
| tests/state/system/settings/row-writer.test.ts | 133 | before | `const LOADING = { folder: () => ({ state: 'loading' }) } as unknown as Lists;` |
| tests/state/system/settings/row-writer.test.ts | 135 | before | `describe('a Settings row with a hub chosen', () => {` |
| tests/state/system/settings/row-writer.test.ts | 157 | after | `describe('a Settings row of a hub other than the primary', () => {` |
| tests/state/system/settings/row-writer.test.ts | 154 | before | `it("names lab in its write and its reset, and keeps lab's answer apart from the primary's", async () => {` |
| tests/state/system/settings/row-writer.test.ts | 155 | before | `let release = (): void => undefined;` |
| tests/state/system/settings/row-writer.test.ts | 156 | before | `const held = new Promise<void>((done) => (release = done));` |
| tests/state/system/settings/row-writer.test.ts | 157 | before | `const write = vi.fn(async (_file: string, _key: string, value: unknown) => {` |
| tests/state/system/settings/row-writer.test.ts | 158 | before | `if (value === 'held') await held;` |
| tests/state/system/settings/row-writer.test.ts | 159 | before | `return value === 'refused'` |
| tests/state/system/settings/row-writer.test.ts | 160 | before | `? {` |
| tests/state/system/settings/row-writer.test.ts | 161 | before | `ok: true,` |
| tests/state/system/settings/row-writer.test.ts | 162 | before | `changed: [],` |
| tests/state/system/settings/row-writer.test.ts | 163 | before | `refused: [{ field: 'sources.yml:memories_dir', reason: 'no' }]` |
| tests/state/system/settings/row-writer.test.ts | 164 | before | `}` |
| tests/state/system/settings/row-writer.test.ts | 165 | before | `: { ok: true, changed: ['sources.yml:memories_dir'], refused: [] };` |
| tests/state/system/settings/row-writer.test.ts | 166 | before | `});` |
| tests/state/system/settings/row-writer.test.ts | 167 | before | `const reset = vi.fn((_file: string, _key: string) =>` |
| tests/state/system/settings/row-writer.test.ts | 168 | before | `Promise.resolve({ ok: true, changed: ['sources.yml:memories_dir'], refused: [] })` |
| tests/state/system/settings/row-writer.test.ts | 169 | before | `);` |
| tests/state/system/settings/row-writer.test.ts | 170 | before | `const listed: (string \| undefined)[] = [];` |
| tests/state/system/settings/row-writer.test.ts | 171 | before | `const writer = createRowWriter(` |
| tests/state/system/settings/row-writer.test.ts | 172 | before | `write,` |
| tests/state/system/settings/row-writer.test.ts | 173 | before | `reset,` |
| tests/state/system/settings/row-writer.test.ts | 174 | before | `() => undefined,` |
| tests/state/system/settings/row-writer.test.ts | 175 | before | `(row) => {` |
| tests/state/system/settings/row-writer.test.ts | 176 | before | `listed.push(row.hub);` |
| tests/state/system/settings/row-writer.test.ts | 177 | before | `return LOADING;` |
| tests/state/system/settings/row-writer.test.ts | 178 | before | `}` |
| tests/state/system/settings/row-writer.test.ts | 179 | before | `);` |
| tests/state/system/settings/row-writer.test.ts | 180 | before | `await writer.submit(primaryRow(), 'refused');` |
| tests/state/system/settings/row-writer.test.ts | 181 | before | `expect(writer.said(primaryRow())?.key).toBe('workbench.settings_refused');` |
| tests/state/system/settings/row-writer.test.ts | 182 | before | `expect(writer.said(labRow())).toBeNull();` |
| tests/state/system/settings/row-writer.test.ts | 183 | before | `const out = writer.submit(primaryRow(), 'held');` |
| tests/state/system/settings/row-writer.test.ts | 176 | after | `it("keeps lab's change and reset apart from the primary's, and checks lab's against lab's lists", () => {` |
| tests/state/system/settings/row-writer.test.ts | 177 | after | `const { writer, stage, listed } = writerOf();` |
| tests/state/system/settings/row-writer.test.ts | 178 | after | `writer.submit(primaryRow(), 'photos');` |
| tests/state/system/settings/row-writer.test.ts | 186 | before | `release();` |
| tests/state/system/settings/row-writer.test.ts | 187 | before | `await out;` |
| tests/state/system/settings/row-writer.test.ts | 188 | before | `await writer.submit(labRow(), 'other');` |
| tests/state/system/settings/row-writer.test.ts | 189 | before | `await writer.reset(labRow());` |
| tests/state/system/settings/row-writer.test.ts | 190 | before | `expect(write.mock.calls.at(-1)).toEqual([` |
| tests/state/system/settings/row-writer.test.ts | 191 | before | `'sources.yml',` |
| tests/state/system/settings/row-writer.test.ts | 192 | before | `'memories_dir',` |
| tests/state/system/settings/row-writer.test.ts | 193 | before | `'other',` |
| tests/state/system/settings/row-writer.test.ts | 194 | before | `false,` |
| tests/state/system/settings/row-writer.test.ts | 195 | before | `'lab'` |
| tests/state/system/settings/row-writer.test.ts | 181 | after | `writer.submit(labRow(), 'other');` |
| tests/state/system/settings/row-writer.test.ts | 182 | after | `expect([stage.held(primaryRow()), stage.held(labRow())]).toEqual([` |
| tests/state/system/settings/row-writer.test.ts | 183 | after | `{ value: 'photos' },` |
| tests/state/system/settings/row-writer.test.ts | 184 | after | `{ value: 'other' }` |
| tests/state/system/settings/row-writer.test.ts | 197 | before | `expect(reset.mock.calls).toEqual([['sources.yml', 'memories_dir', 'lab']]);` |
| tests/state/system/settings/row-writer.test.ts | 198 | before | `expect(listed).toEqual([undefined, undefined, 'lab']);` |
| tests/state/system/settings/row-writer.test.ts | 186 | after | `writer.reset(labRow());` |
| tests/state/system/settings/row-writer.test.ts | 187 | after | `expect([stage.held(primaryRow()), stage.held(labRow())]).toEqual([` |
| tests/state/system/settings/row-writer.test.ts | 188 | after | `{ value: 'photos' },` |
| tests/state/system/settings/row-writer.test.ts | 189 | after | `{ reset: true }` |
| tests/state/system/settings/row-writer.test.ts | 190 | after | `]);` |
| tests/state/system/settings/row-writer.test.ts | 191 | after | `expect(listed).toEqual([undefined, 'lab']);` |
| tests/state/system/settings/row-writer.test.ts | 201 | before | `it('sends nothing for a row that says why it writes nothing', async () => {` |
| tests/state/system/settings/row-writer.test.ts | 202 | before | `const blocked = { ...labRow(), blocked: message('pickHub') };` |
| tests/state/system/settings/row-writer.test.ts | 203 | before | `expect(await resetOf(blocked)).toEqual({ writes: [], resets: [] });` |
| tests/state/system/settings/row-writer.test.ts | 204 | before | `const write = vi.fn(() => Promise.resolve({ ok: true, changed: [], refused: [] }));` |
| tests/state/system/settings/row-writer.test.ts | 205 | before | `const writer = createRowWriter(` |
| tests/state/system/settings/row-writer.test.ts | 206 | before | `write,` |
| tests/state/system/settings/row-writer.test.ts | 207 | before | `write,` |
| tests/state/system/settings/row-writer.test.ts | 208 | before | `() => undefined,` |
| tests/state/system/settings/row-writer.test.ts | 209 | before | `() => LOADING` |
| tests/state/system/settings/row-writer.test.ts | 210 | before | `);` |
| tests/state/system/settings/row-writer.test.ts | 211 | before | `await writer.submit(blocked, 'other');` |
| tests/state/system/settings/row-writer.test.ts | 212 | before | `expect(write).not.toHaveBeenCalled();` |
| tests/state/system/settings/row-writer.test.ts | 194 | after | `it('holds nothing for a row that says why it writes nothing', () => {` |
| tests/state/system/settings/row-writer.test.ts | 195 | after | `const blocked = { ...labRow(), blocked: message('hubLoading', 'lab') };` |
| tests/state/system/settings/row-writer.test.ts | 196 | after | `expect(resetOf(blocked)).toBeUndefined();` |
| tests/state/system/settings/row-writer.test.ts | 197 | after | `const { writer, stage } = writerOf();` |
| tests/state/system/settings/row-writer.test.ts | 198 | after | `writer.submit(blocked, 'other');` |
| tests/state/system/settings/row-writer.test.ts | 199 | after | `expect(stage.held(blocked)).toBeUndefined();` |
| tests/state/workbench/layout/saved/layout-saved.test.ts | 169 | before | `it.each(rows)('reads $name', ({ envelope, trees, docs, kept }) => {` |
| tests/state/workbench/layout/saved/layout-saved.test.ts | 193 | after | `it.each(rows)('reads $name', ({ envelope, trees, docs, views, kept }) => {` |
| tests/state/workbench/options-pages.test.ts | 65 | before | `const engine = scratchEngine();` |
| tests/state/workbench/options-pages.test.ts | 66 | before | `const hub = scratchDir('oculus-hub-');` |
| tests/state/workbench/options-pages.test.ts | 67 | before | `const workspace = plantSaved(hub).file;` |
| tests/state/workbench/options-pages.test.ts | 74 | after | `const into = configTarget();` |
| tests/state/workbench/options-pages.test.ts | 75 | after | `const { engine, hub } = into;` |
| tests/state/workbench/options-pages.test.ts | 76 | after | `const workspace = workspaceFileOf(into);` |
| tests/state/workbench/options-pages.test.ts | 104 | before | `return { workspace, writes, pages, config, push, settings, defaults };` |
| tests/state/workbench/options-pages.test.ts | 113 | after | `return { into, workspace, writes, pages, config, push, settings, defaults };` |
| tests/state/workbench/options-pages.test.ts | 108 | before | `it('writes the text size row into the workspace file, shown on the other page after the push', async () => {` |
| tests/state/workbench/options-pages.test.ts | 117 | after | `it("holds the text size row's change, writes it into the workspace file at the Save, shown on the other page after the push", async () => {` |
| tests/state/workbench/options-pages.test.ts | 115 | before | `text: {` |
| tests/state/workbench/options-pages.test.ts | 116 | before | `text: readFileSync(at.workspace, 'utf8'),` |
| tests/state/workbench/options-pages.test.ts | 117 | before | `truncated: false,` |
| tests/state/workbench/options-pages.test.ts | 118 | before | `error: '',` |
| tests/state/workbench/options-pages.test.ts | 119 | before | `loading: false` |
| tests/state/workbench/options-pages.test.ts | 120 | before | `}` |
| tests/state/workbench/options-pages.test.ts | 125 | after | `text: { text: held, truncated: false, error: '', loading: false }` |
| tests/state/workbench/options-pages.test.ts | 127 | before | `at.writes.writeConfigKey,` |
| tests/state/workbench/options-pages.test.ts | 128 | before | `at.writes.resetConfig,` |
| tests/state/workbench/options-pages.test.ts | 133 | after | `stage,` |
| tests/state/workbench/options-pages.test.ts | 133 | before | `await writer.submit(row, '1.2');` |
| tests/state/workbench/options-pages.test.ts | 138 | after | `writer.submit(row, '1.2');` |
| tests/state/workbench/options-pages.test.ts | 139 | after | `expect([stage.held(row), at.settings()]).toEqual([{ value: 1.2 }, undefined]);` |
| tests/state/workbench/options-pages.test.ts | 140 | after | `const answer = await handleWrite(` |
| tests/state/workbench/options-pages.test.ts | 141 | after | `request({` |
| tests/state/workbench/options-pages.test.ts | 142 | after | `kind: 'config-save',` |
| tests/state/workbench/options-pages.test.ts | 143 | after | `scope: 'settings',` |
| tests/state/workbench/options-pages.test.ts | 144 | after | `digest: textDigest(held),` |
| tests/state/workbench/options-pages.test.ts | 145 | after | `changes: [{ file: 'appearance.yml', key: 'text_size', value: 1.2 }]` |
| tests/state/workbench/options-pages.test.ts | 146 | after | `}),` |
| tests/state/workbench/options-pages.test.ts | 147 | after | `TOKEN,` |
| tests/state/workbench/options-pages.test.ts | 148 | after | `at.into` |
| tests/state/workbench/options-pages.test.ts | 149 | after | `);` |
| tests/state/workbench/options-pages.test.ts | 150 | after | `expect(answer.status).toBe(200);` |
| tests/views/system/workbench/workbench-fixture.ts | 33 | before | `const done = () => Promise.resolve({ ok: true, changed: [], refused: [] });` |
| tests/views/system/workbench/workbench-fixture.ts | 45 | before | `done,` |
| tests/views/system/workbench/workbench-fixture.ts | 46 | before | `done,` |
| tests/views/system/workbench/workbench-fixture.ts | 68 | after | `stage,` |
| tests/views/system/workbench/workbench-fixture.ts | 50 | before | `const editors = createEditorWriter(done, {` |
| tests/views/system/workbench/workbench-fixture.ts | 51 | before | `reset: done,` |
| tests/views/system/workbench/workbench-fixture.ts | 72 | after | `const editors = createEditorWriter({` |
| tests/views/system/workbench/workbench-fixture.ts | 73 | after | `stage,` |
| tests/views/system/workbench/workbench-fixture.ts | 54 | before | `held: () => false,` |
| tests/views/system/workbench/workbench-fixture.ts | 76 | after | `held: () => undefined,` |
| tests/views/system/workbench/workbench-fixture.ts | 77 | after | `stale: () => false,` |
| tests/views/system/workbench/workbench-fixture.ts | 58 | before | `props: { row, id, writer, editors, lists, onchoose: () => undefined },` |
| tests/views/system/workbench/workbench-fixture.ts | 81 | after | `props: { row, id, writer, editors, lists, onrepo: () => undefined },` |

## Repair round 1

### Not done in round 1, and what became of it

- **The schema of a constant `value` (item 9).** Ruled 548 (a) and built in repair round 2, item 1; `config-folder.test.ts` passes. What round 1 found and the options it put: the round-1 verify run below is red on one line: `tests/checks/config/config-folder.test.ts` 'passes every config file through the schema it is matched to', `"defaults/behavior.yml:765 literature.sources[5].fields.oa does not fit the schema of this file"`. Item 9 ships `oa: { value: true }`, and the record `reader_value` of `config/options/behavior.yml` (`descriptions:`, its field `value: a fixed value, with holes`) describes the constant as a text, which the generated schema makes `{ type: 'string' }` (`textSchema` in `src/lib/data/sources/config/catalog/schemas/options.ts:81-87`). The Settings card draws and saves the boolean (item 9 below), and the reader takes any value (`src/lib/server/core/reader/fields.ts:181`, `if (spec.value !== undefined) return spec.value;`). The catalog has no word for a field that takes a text, a number or a flag: `CONTROLS` and `HOLDS` in `src/lib/data/shapes/catalog-words.ts:13-31,40` hold none. A new catalog word is a config vocabulary nothing names, so it is the orchestrator's to raise. The options:
  - (a) A control word for a value of any scalar, for example `control: scalar` ("a text, a number or a flag, as written"), given to `reader_value`'s `value` field: the schema `anyOf` of the text (with its holes), a number and a flag; `valueProblem` in `catalog/value-rule.ts` takes any scalar for it; the card draws it as its text and saves it in the type held, as it does now. Cost: one word in `CONTROLS`, its schema case, its value rule case, its control in `FieldControl.svelte` (the text box it draws now) and a row of `tests/checks/config/config-folder.test.ts` that holds already. Recommended, as a judgment: the field means any scalar, and the word says so where the schema, the value rule and the card read it.
  - (b) Ship `oa: { value: 'true' }`, text, as round 0 did. The schema is green and the card draws both forms, but the shipped row then differs from the hub's `oa: { value: true }`, which item 9 rules against, and a hub that writes a boolean constant keeps whatever finding the schema of its `config.yml` gives it (not verified: no run over a hub's `config.yml` was made). This is the lazy option: it costs one line and leaves the catalog describing the constant wrongly.
  Making every text field's schema take a number and a flag too is not an option: it loosens the check of every text field.
- **The launch rows of item 10 have no run that fails before the change.** Still so after round 2. They were written after `launch-form.ts` changed, and taking the change out to watch them fail is banned. By reading, the round-0 `launch-form.ts` drew a list as its parts joined by `, ` and split a typed line at `,`, so a part `a,b` came back as two parts after an edit and a save; the four rows check that such a field is not drawn and not sent. The two cpp rows of item 10 have their before-run, quoted below.

### Item 1, the undo of a save that moves a secret

- Change: `src/lib/server/edit/writes/config/save/local-save.ts:313` records `undo: 'field'` for every save; the head comment (lines 12-18) says the undo writes the values back as a save of its own, the fields of each `downloads` row included, and leaves each row's secret as the file holds it then, since the record holds no secret. `undoLocal` (line 333) and the masked restore (line 351) keep the stored secret.
- Test: `tests/routes/hubs/settings-secrets.test.ts:82`, "the undo of a save of the port and a secret puts the port and the row's user back and keeps the secret". Before the change (`npx vitest run tests/routes/hubs/settings-secrets.test.ts`, `o99notes/r1/item1-before.txt`): `AssertionError: expected 404 to be 200 // Object.is equality` at line 105, `Tests  1 failed | 4 passed (5)`. After: passes in the verify run below.
- The row 'the History record holds no secret and offers no undo' is now 'the History record holds no secret' (line 72), its expect of `undo: 'none'` taken out. This is an edit to an assertion of round 0 (the file is new in this step).

### Item 2, the mode of an existing `local.yml`

- The save already followed G8: `writeAtomic` gives a file it makes the mode asked for and leaves an existing file's mode. The head comment of `local-save.ts` now says so: "An existing file keeps its mode; a file the save makes is written at mode 600 and named in the hub's `.oculus/.gitignore`, as `writeSelf` makes it."
- Test: `tests/routes/edit/undo/config-save.test.ts:116-123`, the table 'writes $row' with 'an existing local.yml at mode 644 keeps 644' and 'a local.yml the save makes at mode 600, named in .gitignore'. Both pass before and after round 1, since the behaviour held; there is no failing before-run to quote. Judgment call 10 and the G8 Doc text, which said the save writes 600 whatever the file was, are corrected in place.

### Item 3, the two new write routes under G1 and G2

- Tests: `tests/routes/machine/cpp.test.ts:177`, 'refuses a POST without the token and one naming a folder outside the workspace, writing nothing (G1, G2)' (expects `[403, 400]`), and `tests/routes/docs/primary-key.test.ts:187`, 'refuses a POST without the token and one naming a root no hub of the workspace is, writing nothing (G1, G2)' (expects `[403, 404]`). Both routes refused these from round 0, so the rows pass before and after. On the base neither file loads (base lines under item 13).
- Doc text: the G1 and G2 Code and Test lines, added under "Doc text" above.

### Items 4 and 5, an app's `workspace.saveAll`

- Change: in `src/lib/state/sessions/source/autosave.svelte.ts`, `joined` (line 155) stands above `saveEvery`, whose doc comment says it saves every tab that holds unsaved text and nothing else, that an app's `workspace.saveAll` runs it and so never reaches a save a view joined. The new `saveJoined` (line 177) is the File menu's Save All: every tab as `saveEvery` saves it, then every joined save. `src/routes/+page.svelte:359` reads `saveAll={() => void client.autosave.saveJoined()}`; `src/lib/state/client/context.ts:734` keeps `saveAll: autosave.saveEvery` for the app tool.
- Test: `tests/state/sessions/autosave.client.test.ts:422`, describe "an app's workspace.saveAll and the File menu's Save All (G77)", rows "an app's saveAll saves the source tab and runs no save a view joined" and "the File menu's Save All saves the source tab and every joined save". Before (`o99notes/r1/item4-before.txt`): row 1 `AssertionError: expected [ 'typed\n', 1 ] to deeply equal [ 'typed\n', +0 ]`, row 2 `TypeError: env.autosave.saveJoined is not a function`. After: passes in the verify run.

### Item 6, the HELP line

The Doc text's line 344 replacement now reads "Each heading has Show Defaults, which opens oculus's defaults file to read only."

### Item 7, `tests/state/system/entry-forms.test.ts`

Its rows check that an entry form sends only the fields changed and leaves out a value it does not draw, which is G8's guarantee that the launch.yml edit and the cpp.yml form change only the entry they name. The G8 Doc text names `launchForm`, `launchChanges`, `cppFields` and `cppChanges` under Code and the describe 'the changes an entry form sends', every row, under Test.

### Item 8, the Hub text

Corrected in place under "Hub text" from a re-read in this round (`wc -l`, `grep -nE "^[a-z_#]|^  [a-z_]+:|^    - (kind|key):"` and `sed -n` over each range end of the hub's `.oculus/config.yml`; `diff` of the failure rows and `diff -w` of the other blocks against `config/defaults/behavior.yml`). Lines 87, 102 and 130 are deleted with their blocks; line 92 stays over `connections:`, which keeps three rows.

### Item 9, the arxiv `oa` constant

- Change: `config/defaults/behavior.yml:765` is `oa: { value: true }`, and `tests/server/core/reader/rows.yml` is the base's again (`git diff a5281619a --stat -- tests/server/core/reader/rows.yml` prints nothing). In `src/lib/state/system/config/editors/fields.ts`, a card carries `scalars` (the type, `'boolean'` or `'number'`, each scalar field was held in); `readField` reads a flag or a finite number as `String(held)` with its scalar, and `writtenField` writes the text back in that type (since round 2 for the control `scalar` alone; a `text` field reads and writes a text only, as on the base, round 2 item 1) (`'true'`/`'false'` as a flag, a number as `decimalOf(text) ?? text`), a text typed over it that is not of the type staying a text. `putRead` puts a read on its card. `draft.ts` passes the scalar of the value alone in a pairs card (the key reading has none), and `slots.ts`'s `cardShape` takes `scalars`.
- Test: `tests/state/system/config/sparse-card.test.ts:536`, the table 'draws $name constant value as its text, and saves it and a text typed over it in its type', rows 'a boolean', 'a number' and 'a text'. Before (`o99notes/r1/item9-before.txt`): `Tests  5 failed | 30 passed (35)`, the boolean and number rows failing with `AssertionError: expected [ Array(1) ] to deeply equal []` (the value kept as the file has it, `literature.sources[0].fields[0].value[0].value`), and the two rows 'draws every value of the shipped / fixture's literature.sources and keeps none as the file has it' failing the same way once the shipped row holds `true`. After: 35 passed (verify run).
- The NESTED row "arXiv's oa value" (line 411) gains `saved: false`, and the table's check writes `one.saved ?? one.value` at the held path: the text `'false'` typed over the flag is saved as the flag `false`. This is an edit to an assertion of round 0.
- The schema line is closed by repair round 2, item 1.

### Item 10, the Debug view's and the compile database item's edit forms

- Change: `src/lib/state/system/machine/debug/launch-form.ts` draws a list only when no part holds `,` (`partsList`) and a map only when no key holds `,` or `=` and no value holds `,` (`partsMap`); any other value is kept as the file has it and never sent. `src/lib/state/system/machine/lsp/clangd/cpp-form.ts` draws a `tags` field only when its value is a list of scalars none of which holds `,` (`drawnTags`), else `cppFields` gives no field for it. Both head comments say so.
- Tests: `tests/state/system/entry-forms.test.ts:90-100`, 'draws no cpp tags field whose list holds %s, and sends nothing for it' (a part that holds the separator; a part that is no scalar), and lines 102-118, 'draws no launch attribute whose %s holds the separator, and sends nothing for it' (a list part, a map value, a map key, a map key that holds `=`), over the fixture debugger `ACTING`. Cpp before (`o99notes/r1/item10-cpp-before.txt`, vitest's ellipsis written `...` here and below): `AssertionError: expected [ 'name', 'compile_commands', ...(1) ] to deeply equal [ 'name', 'compile_commands' ]`, `Tests  2 failed | 6 passed (8)`. Launch: no before-run (see "Not done"). After: `entry-forms`, `cpp` and `debug` tests, `Tests  22 passed (22)` (`o99notes/r1/item10-after.txt`), and the verify run.

### Item 11, a secret typed while a Save is out

- Change: `saveFile` in `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts:167` takes `sentSecrets` (line 186) before it sends, and after the answer stages again, after `inner.drop(name)`, each secret that is new or whose value differs from the one sent, as it does a change.
- Test: `tests/views/system/workbench/scopes.client.test.ts`, describe 'a change and a secret typed while the Save of their file is out', three rows. Before (`o99notes/r1/item11-before.txt`): 'holds a secret typed again and one typed for another row while the Save was out, and drops the secret it sent', `AssertionError: expected [] to deeply equal [ [ 'ieee', ...(1) ], [ 'acm', null ] ]`, `Tests  1 failed | 2 passed (3)`. After: 3 passed.

### Item 12, the cases run again

The program `tests/o99-cases.test.ts` was written with Write, run once with `OUT=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o99notes/r1/item12-out.txt npx vitest run tests/o99-cases.test.ts` (`Test Files  1 passed (1)`, `Tests  4 passed (4)`, `o99notes/r1/item12-run.txt`), and deleted (`ls tests/o99*` finds nothing). Its first run found `catalogs/agents.yml:agents[0].lists` kept as the file has it; `config/options/catalogs/agents.yml` now describes `lists` as a pairs map of a picker record (label, flag, default, cache, and values, each id, label, pass and confirm, a toggle), and the help line's "its pickers are edited in the file" is gone. Case 9 covers the workspace, primary, local and repository scopes; the Hub scope of a second hub is not in it. Its source:

```ts
// The case-run program of O99 repair round 1: cases 9, 10, 11, 21, 22, 22a and 35, printed. It is
// run once and deleted.

import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { parse } from 'yaml';
import { LOCAL_KEYS } from '../src/lib/data/sources/config/local.ts';
import type { LocalFile } from '../src/lib/data/shapes/config-save.ts';
import {
    applyEdit,
    draftOf,
    draftValue,
    type Draft
} from '../src/lib/state/system/config/editors/draft.ts';
import { cardsOf, type Card } from '../src/lib/state/system/config/editors/fields.ts';
import { undrawnMessage } from '../src/lib/state/system/config/editors/slots.ts';
import { settingsGroups, type Group } from '../src/lib/state/system/config/groups.ts';
import {
    REPO_OPTION,
    fileRows,
    mismatchMessage,
    repoRow,
    writtenWhole,
    type ConfigRow,
    type LocalScope
} from '../src/lib/state/system/config/rows.ts';
import { scopeGroups } from '../src/lib/state/system/config/scopes/rows.ts';
import type { Scope, ScopeGround } from '../src/lib/state/system/config/scopes/scope.ts';
import { giveViews } from '../src/lib/state/workbench/layout/saved/views.ts';
import { newInstance, panes, tabsOf } from '../src/lib/state/workbench/layout/instance.ts';
import { parseArrangement } from '../src/lib/state/workbench/navigation/arrangement.ts';
import { bareLists, config, shipped, text } from './state/system/settings/fixture.ts';

/** One line of the output, appended to the file OUT names. */
function say(...parts: unknown[]): void {
    appendFileSync(process.env.OUT as string, `${parts.map(String).join(' ')}\n`);
}

const GROUND: ScopeGround = {
    folders: [
        { key: 'hub', dir: '/w/hub', hub: true },
        { key: 'repo', dir: '/w/repo', marks: { git: true } }
    ],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
} as ScopeGround;

const MACHINE: LocalScope['machine'] = {
    primary: 'hub',
    set: [],
    defaults: { port: '8790', rite_dap_bin: 'rite_dap', claude_bin: 'claude' },
    values: {},
    hubs: {},
    portRefused: null
};

const FILE = { name: 'f', present: true, blocked: null, digest: 'd' };
const LOCAL: LocalFile = { present: true, digest: 'd', values: {}, unparsed: null };

/** The config rows a scope draws over the merged config `merged`. */
function rowsIn(scope: Scope, merged: Record<string, unknown>): ConfigRow[] {
    const machine =
        scope.kind === 'local' ? { hub: 'hub', primary: true, file: LOCAL, machine: MACHINE } : undefined;
    const groups: Group[] = settingsGroups(
        shipped,
        merged,
        {
            hubFile: { text: text('{}\n'), present: true },
            workspace: { root: 'hub', path: '.oculus/workspaces/w.yml', text: text('{}\n') }
        },
        undefined,
        [],
        machine
    );
    const entries = shipped[REPO_OPTION.file] ?? {};
    const repo =
        scope.kind === 'repo'
            ? repoRow(entries[REPO_OPTION.key], 'repo', { text: text('{}\n'), present: true })
            : undefined;
    return scopeGroups(groups, scope, GROUND, FILE, repo)
        .flatMap((group) => group.sections.flatMap((section) => section.rows))
        .filter((row): row is ConfigRow => row.kind === 'config');
}

const SCOPES: [string, Scope][] = [
    ['workspace', { kind: 'workspace' }],
    ['primary', { kind: 'primary' }],
    ['local', { kind: 'local', hub: 'hub' }],
    ['repo', { kind: 'repo', root: 'repo' }]
];

/** Every value a draft's cards keep as the file has it, at any depth. */
function keptIn(cards: Card[], place: string): string[] {
    return cards.flatMap((card, at) => [
        ...Object.keys(card.kept).map((name) => `${place}[${at}].${name}`),
        ...Object.entries(card.fields).flatMap(([name, held]) =>
            keptIn(cardsOf(held), `${place}[${at}].${name}`)
        )
    ]);
}

/** Whether a value is a record or a list. */
const recordOrList = (value: unknown): boolean => typeof value === 'object' && value !== null;

/** How a row is drawn: by the editor of a list or family, the rail's own, or its one control. */
function drawnBy(row: ConfigRow): string {
    if (row.id === 'layout.yml:rail') return 'RailEditor';
    if (writtenWhole(row.control)) return draftOf(row) === null ? 'NO EDITOR' : 'editor';
    return 'control';
}

it('case 9: every option, its scopes and the control it draws', () => {
    const seen = new Map<string, { scopes: string[]; row: ConfigRow }>();
    for (const [name, scope] of SCOPES) {
        for (const row of rowsIn(scope, config)) {
            const one = seen.get(row.id) ?? { scopes: [], row };
            one.scopes.push(name);
            seen.set(row.id, one);
        }
    }
    const missing: string[] = [];
    for (const [file, entries] of Object.entries(shipped)) {
        for (const key of Object.keys(entries)) {
            if (!seen.has(`${file}:${key}`)) missing.push(`${file}:${key}`);
        }
    }
    const localIds = [...seen.keys()].filter((id) => id.startsWith('local.yml:'));
    const fallbacks: string[] = [];
    const kept: string[] = [];
    const unread: string[] = [];
    for (const [id, { scopes, row }] of seen) {
        const value = row.value === undefined ? row.default : row.value;
        const by = drawnBy(row);
        say(`case 9 ${id} control=${row.control} drawn=${by} scopes=${scopes.join(',')}`);
        if (by === 'control' && recordOrList(value) && row.control !== 'words') {
            fallbacks.push(`${id} ${row.control} ${JSON.stringify(value).slice(0, 80)}`);
        }
        const draft = by === 'editor' ? draftOf(row) : null;
        if (draft !== null) {
            kept.push(...keptIn(draft.cards, id));
            const back = draftValue(draft, row, bareLists(config));
            if (row.state === 'set' && !(back.ok && JSON.stringify(back.value) === JSON.stringify(row.value))) {
                unread.push(id);
            }
        }
    }
    say(`case 9 editor rows whose draft does not read back as the value: ${JSON.stringify(unread)}`);
    say(`case 9 options of the options files: ${Object.values(shipped).reduce((n, e) => n + Object.keys(e).length, 0)}, rows drawn: ${seen.size}`);
    say(`case 9 LOCAL_KEYS ${LOCAL_KEYS.length}, local.yml rows drawn ${localIds.length}`);
    say(`case 9 options drawn in no scope: ${JSON.stringify(missing)}`);
    say(`case 9 a record or list on a one-value control: ${JSON.stringify(fallbacks)}`);
    say(`case 9 values kept as the file has them: ${JSON.stringify(kept)}`);
    say(`case 9 NO EDITOR rows: ${JSON.stringify([...seen.values()].filter((one) => drawnBy(one.row) === 'NO EDITOR').map((one) => one.row.id))}`);
    expect([fallbacks, kept, unread]).toEqual([[], [], []]);
});

it('case 10: a list or family with no value in force draws its editor empty, and an added row is written', () => {
    const empty: string[] = [];
    for (const [name, scope] of SCOPES) {
        for (const row of rowsIn(scope, {})) {
            if (!writtenWhole(row.control) || row.state !== 'missing') continue;
            const draft = draftOf(row);
            if (draft === null) {
                empty.push(row.id);
                continue;
            }
            let added: Draft = applyEdit(draft, { do: 'add' });
            const index = added.cards.length - 1;
            const field = added.fields[0];
            if (row.control === 'list' || row.control === 'parked') {
                added = applyEdit(added, { do: 'set', index, field: 'item', value: 'x' });
            }
            const made = draftValue(added, row, bareLists({}));
            const said = made.ok ? JSON.stringify(made.value).slice(0, 60) : `${made.problems.length} problems to fill`;
            say(`case 10 ${name} ${row.id} ${row.control} cards=${draft.cards.length} first field=${field} added: ${said}`);
        }
    }
    say(`case 10 no empty editor: ${JSON.stringify(empty)}`);
    expect(empty.filter((id) => id !== 'layout.yml:rail')).toEqual([]);
});

/** Set the value at a dotted key inside a copy of a config. */
function withValue(merged: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
    const copy = structuredClone(merged);
    const parts = key.split('.');
    let at: Record<string, unknown> = copy;
    for (const part of parts.slice(0, -1)) {
        if (typeof at[part] !== 'object' || at[part] === null) at[part] = {};
        at = at[part] as Record<string, unknown>;
    }
    at[parts[parts.length - 1]] = value;
    return copy;
}

it('case 11: a value in a shape its editor does not draw is a finding naming the key and the value', () => {
    const rows = rowsIn({ kind: 'primary' }, config);
    const list = rows.find((row) => row.control === 'list' && row.file === 'behavior.yml');
    const family = rows.find((row) => row.control === 'family' && row.id !== 'layout.yml:rail');
    const said: unknown[] = [];
    for (const [row, wrong] of [
        [list, { not: 'a list' }],
        [family, 7]
    ] as const) {
        if (row === undefined) continue;
        const merged = withValue(config, row.key, wrong);
        const read = fileRows(row.file, shipped[row.file], merged, {
            hubFile: { text: text('{}\n'), present: true },
            workspace: null
        });
        const again = read.rows.find((one) => one.id === row.id);
        const message =
            again === undefined
                ? null
                : again.mismatch
                  ? mismatchMessage(again)
                  : undrawnMessage(again);
        say(`case 11 ${row.id} held ${JSON.stringify(wrong)}: ${JSON.stringify(message)}, editor drawn: ${again === undefined ? 'no row' : draftOf(again) !== null}`);
        said.push(message);
    }
    expect(said.every((one) => one !== null)).toBe(true);
});

it('cases 21, 22, 22a and 35: the views a saved registries page is given', () => {
    const layout = parse(readFileSync(join(import.meta.dirname, '..', 'config', 'defaults', 'layout.yml'), 'utf8'));
    const node = layout.arrangements.registries;
    const shippedRoot = parseArrangement(node)?.root;
    if (shippedRoot === undefined) throw new Error('no registries arrangement');
    const src = [{ page: 'registries', node }];
    const tabs = (root: never) =>
        panes(root).map(({ pane }) => pane.tabs.map((one) => `${one.view}${one.pinned ? '*' : ''}`).join(','));
    const pageOf = (root: unknown, views?: string[]) => ({
        pages: [{ id: 'p', label: 'R', rail: 'registries', workbench: { root }, ...(views === undefined ? {} : { views }) }],
        current: 'p',
        floats: []
    });
    const without = (root: any, view: string) => {
        const kept = root.tabs.filter((one: any) => one.view !== view);
        return { ...root, tabs: kept, active: kept[0].id };
    };
    const old = without(shippedRoot, 'venues-browser');
    const oldViews = tabsOf(old).map((one) => one.view);
    const once: any = giveViews(pageOf(old, oldViews) as never, src);
    say('case 21 given', JSON.stringify(tabs(once.pages[0].workbench.root)));
    say('case 21 record', JSON.stringify(once.pages[0].views));
    const closedRoot = without(once.pages[0].workbench.root, 'venues-browser');
    const reloaded = JSON.parse(JSON.stringify({ ...once, pages: [{ ...once.pages[0], workbench: { root: closedRoot } }] }));
    const again: any = giveViews(reloaded, src);
    say('case 21 closed and read back, given nothing again:', again === reloaded, JSON.stringify(tabs(again.pages[0].workbench.root)));

    const bare = without(without(old, 'people'), 'data');
    const fresh: any = giveViews(pageOf(bare) as never, src);
    say('case 22 no record, given', JSON.stringify(tabs(fresh.pages[0].workbench.root)));
    say('case 22 record written', JSON.stringify(fresh.pages[0].views));
    say('case 22 a second pass changes nothing:', giveViews(fresh, src) === fresh);

    const full = pageOf(shippedRoot, tabsOf(shippedRoot).map((one) => one.view)) as never;
    say('case 22a every view recorded, nothing added:', giveViews(full, src) === full);

    const venues = old.tabs.find((one: any) => one.view === 'venues');
    const rest = old.tabs.filter((one: any) => one.view !== 'venues');
    const notes = newInstance('notes');
    const split = {
        kind: 'split',
        dir: 'row',
        sizes: [0.5, 0.5],
        children: [
            { kind: 'pane', tabs: rest, active: rest[0].id },
            { kind: 'pane', tabs: [venues, notes], active: notes.id }
        ]
    };
    const moved: any = giveViews(pageOf(split, oldViews) as never, src);
    say('case 35 two panes, given', JSON.stringify(tabs(moved.pages[0].workbench.root)));
    expect(again).toBe(reloaded);
});
```

Its output, whole (`o99notes/r1/item12-out.txt`, 336 lines):

```
case 9 appearance.yml:themes control=family drawn=editor scopes=workspace
case 9 appearance.yml:theme control=choice drawn=control scopes=workspace
case 9 appearance.yml:app_theme control=choice drawn=control scopes=workspace
case 9 appearance.yml:text_size control=number drawn=control scopes=workspace
case 9 appearance.yml:locale control=text drawn=control scopes=workspace
case 9 appearance.yml:rice.icons control=toggle drawn=control scopes=workspace
case 9 appearance.yml:rice.brackets control=toggle drawn=control scopes=workspace
case 9 appearance.yml:rice.monospace control=toggle drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.show control=choice drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.dim control=number drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.blur control=number drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.themes control=choice drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.panel_opacity control=number drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.popover_opacity control=number drawn=control scopes=workspace
case 9 appearance.yml:wallpaper.panel_blur control=number drawn=control scopes=workspace
case 9 appearance.yml:crt.on control=toggle drawn=control scopes=workspace
case 9 appearance.yml:code_theme control=choice drawn=control scopes=workspace
case 9 appearance.yml:code_themes.vscode control=family drawn=editor scopes=workspace
case 9 appearance.yml:code_themes.shiki control=family drawn=editor scopes=workspace
case 9 appearance.yml:file_icons control=choice drawn=control scopes=workspace
case 9 appearance.yml:show_tabs control=choice drawn=control scopes=workspace
case 9 appearance.yml:editor_actions control=choice drawn=control scopes=workspace
case 9 appearance.yml:wrap_tabs control=toggle drawn=control scopes=workspace
case 9 behavior.yml:status_bar.hidden control=list drawn=editor scopes=workspace
case 9 behavior.yml:status_bar.quiet control=toggle drawn=control scopes=workspace
case 9 behavior.yml:status_bar.repository control=text drawn=control scopes=workspace
case 9 catalogs/glyphs.yml:glyphs control=family drawn=editor scopes=workspace
case 9 catalogs/icons.yml:icons control=family drawn=editor scopes=workspace
case 9 text.yml:text control=family drawn=editor scopes=workspace
case 9 behavior.yml:editor.paint_limit_kb control=number drawn=control scopes=workspace
case 9 behavior.yml:editor.tab_size control=number drawn=control scopes=workspace
case 9 behavior.yml:editor.insert_spaces control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.word_wrap control=choice drawn=control scopes=workspace
case 9 behavior.yml:editor.minimap control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.render_whitespace control=choice drawn=control scopes=workspace
case 9 behavior.yml:editor.sticky_scroll control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.suggest_details control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.autosave control=choice drawn=control scopes=workspace
case 9 behavior.yml:editor.autosave_delay_ms control=number drawn=control scopes=workspace
case 9 behavior.yml:editor.trim_trailing_whitespace control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.final_newline control=toggle drawn=control scopes=workspace
case 9 behavior.yml:editor.opacity control=number drawn=control scopes=workspace
case 9 behavior.yml:editor.languages control=family drawn=editor scopes=workspace,repo
case 9 behavior.yml:latex.auto_build control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.auto_build_interval_ms control=number drawn=control scopes=workspace
case 9 behavior.yml:latex.recipe_default control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.out_dir control=text drawn=control scopes=workspace
case 9 behavior.yml:latex.aux_dir control=text drawn=control scopes=workspace
case 9 behavior.yml:latex.clean_and_retry control=toggle drawn=control scopes=workspace
case 9 behavior.yml:latex.auto_clean control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.synctex_path control=path drawn=control scopes=workspace
case 9 behavior.yml:latex.reverse_synctex control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.texcount_autorun control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.context_menu control=toggle drawn=control scopes=workspace
case 9 behavior.yml:latex.unimath_symbols control=toggle drawn=control scopes=workspace
case 9 behavior.yml:latex.includegraphics_preview control=toggle drawn=control scopes=workspace
case 9 behavior.yml:latex.recipes control=family drawn=editor scopes=workspace
case 9 behavior.yml:latex.tools control=family drawn=editor scopes=workspace
case 9 behavior.yml:latex.formatter control=choice drawn=control scopes=workspace
case 9 behavior.yml:latex.latexindent_path control=path drawn=control scopes=workspace
case 9 behavior.yml:latex.tex_fmt_path control=path drawn=control scopes=workspace
case 9 behavior.yml:latex.badness_path control=path drawn=control scopes=workspace
case 9 behavior.yml:latex.texlab_path control=path drawn=control scopes=workspace
case 9 catalogs/latex.yml:latex_editing control=family drawn=editor scopes=workspace
case 9 catalogs/unimath.yml:latex_unimath control=family drawn=editor scopes=workspace
case 9 behavior.yml:lint.chktex control=toggle drawn=control scopes=workspace
case 9 behavior.yml:lint.ruff control=toggle drawn=control scopes=workspace
case 9 behavior.yml:lint.eslint control=toggle drawn=control scopes=workspace
case 9 behavior.yml:lint.shellcheck control=toggle drawn=control scopes=workspace
case 9 behavior.yml:lint.writing control=toggle drawn=control scopes=workspace
case 9 behavior.yml:lint.chktex_path control=path drawn=control scopes=workspace
case 9 behavior.yml:lint.ruff_path control=path drawn=control scopes=workspace
case 9 behavior.yml:lint.shellcheck_path control=path drawn=control scopes=workspace
case 9 behavior.yml:lint.chktex_args control=list drawn=editor scopes=workspace
case 9 behavior.yml:writes.timeout_seconds control=number drawn=control scopes=workspace
case 9 behavior.yml:notes.autosave_ms control=number drawn=control scopes=workspace
case 9 behavior.yml:changes.keep control=number drawn=control scopes=workspace
case 9 behavior.yml:files.confirm_delete control=toggle drawn=control scopes=workspace
case 9 behavior.yml:files.file_icon_at_arrow control=toggle drawn=control scopes=workspace
case 9 behavior.yml:git.message_model control=choice drawn=control scopes=workspace
case 9 behavior.yml:git.autofetch_minutes control=number drawn=control scopes=workspace
case 9 behavior.yml:search.max_hits control=number drawn=control scopes=workspace
case 9 behavior.yml:search.timeout_s control=number drawn=control scopes=workspace
case 9 behavior.yml:search.max_names control=number drawn=control scopes=workspace
case 9 behavior.yml:literature.timeout_s control=number drawn=control scopes=workspace
case 9 behavior.yml:literature.per_source control=number drawn=control scopes=workspace
case 9 behavior.yml:literature.cache_min control=number drawn=control scopes=workspace
case 9 behavior.yml:literature.prefer.fields control=list drawn=editor scopes=workspace
case 9 behavior.yml:literature.prefer.abstract control=list drawn=editor scopes=workspace
case 9 behavior.yml:literature.prefer.pdf control=list drawn=editor scopes=workspace
case 9 behavior.yml:open.program_ext control=family drawn=editor scopes=workspace
case 9 sources.yml:languages control=family drawn=editor scopes=workspace
case 9 catalogs/file-nesting.yml:patterns control=family drawn=editor scopes=workspace
case 9 appearance.yml:terminal.font_px control=number drawn=control scopes=workspace
case 9 appearance.yml:terminal.mac_option_is_meta control=toggle drawn=control scopes=workspace
case 9 appearance.yml:terminal.copy_on_selection control=toggle drawn=control scopes=workspace
case 9 appearance.yml:terminal.cursor_style control=choice drawn=control scopes=workspace
case 9 appearance.yml:terminal.cursor_blinking control=toggle drawn=control scopes=workspace
case 9 appearance.yml:terminal.opacity control=number drawn=control scopes=workspace
case 9 behavior.yml:processes.patterns control=list drawn=editor scopes=workspace
case 9 behavior.yml:context_window control=number drawn=control scopes=workspace
case 9 behavior.yml:usage_tiers control=family drawn=editor scopes=workspace
case 9 behavior.yml:usage_refresh_min control=number drawn=control scopes=workspace
case 9 behavior.yml:usage_refresh_model control=choice drawn=control scopes=workspace
case 9 behavior.yml:chat.model control=choice drawn=control scopes=workspace
case 9 catalogs/agents.yml:agents control=family drawn=editor scopes=workspace
case 9 behavior.yml:slurm.days control=number drawn=control scopes=workspace
case 9 behavior.yml:slurm.poll_min control=number drawn=control scopes=workspace
case 9 behavior.yml:slurm.quota_min control=number drawn=control scopes=workspace
case 9 behavior.yml:slurm.prewarm control=toggle drawn=control scopes=workspace
case 9 behavior.yml:read_limits control=family drawn=editor scopes=workspace
case 9 behavior.yml:audit_ignore control=parked drawn=editor scopes=workspace
case 9 behavior.yml:focus.stale_lag_days control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.sections control=multi drawn=editor scopes=workspace
case 9 behavior.yml:focus.refresh_stale_days.litwatch control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.refresh_stale_days.inbox control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.refresh_stale_days.scout control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.deadline_horizon_days control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.leads_horizon_days control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.conf_horizon_months control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.venue_conc_warn control=number drawn=control scopes=workspace
case 9 behavior.yml:focus.linkedin_cadence_days control=number drawn=control scopes=workspace
case 9 behavior.yml:file_index.enabled control=toggle drawn=control scopes=workspace
case 9 behavior.yml:file_index.max_per_project control=number drawn=control scopes=workspace
case 9 behavior.yml:file_index.ext control=list drawn=editor scopes=workspace
case 9 layout.yml:boards control=family drawn=editor scopes=workspace
case 9 layout.yml:focus_label_mode control=choice drawn=control scopes=workspace
case 9 layout.yml:map_label_mode control=choice drawn=control scopes=workspace
case 9 layout.yml:rail control=family drawn=RailEditor scopes=workspace
case 9 layout.yml:nav_groups control=family drawn=editor scopes=workspace
case 9 layout.yml:direct_chord control=choice drawn=control scopes=workspace
case 9 layout.yml:arrangements control=family drawn=editor scopes=workspace
case 9 layout.yml:workbench control=family drawn=editor scopes=workspace
case 9 layout.yml:floats control=family drawn=editor scopes=workspace
case 9 present.yml:defaults.tag_tones control=family drawn=editor scopes=workspace
case 9 sources.yml:repository_scan_depth control=number drawn=control scopes=workspace
case 9 behavior.yml:calendar.poll_min control=number drawn=control scopes=workspace
case 9 behavior.yml:calendar.days_back control=number drawn=control scopes=workspace
case 9 behavior.yml:calendar.days_ahead control=number drawn=control scopes=workspace
case 9 behavior.yml:mail.poll_min control=number drawn=control scopes=workspace
case 9 behavior.yml:mail.per_signal control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.connect_timeout_s control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.state_max_kb control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.store_max_kb control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.writes_per_min control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.opens_per_min control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.messages_per_min control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.keys_per_s control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.max_files control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.max_mb control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.host_output_kb control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.host_stop_seconds control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.scan_entries control=number drawn=control scopes=workspace
case 9 behavior.yml:apps.closed_paths control=list drawn=editor scopes=workspace
case 9 appearance.yml:wallpaper.image control=text drawn=control scopes=primary
case 9 behavior.yml:lint.writing_skip control=list drawn=editor scopes=primary
case 9 behavior.yml:lint.writing_glyphs control=list drawn=editor scopes=primary
case 9 behavior.yml:literature.sources control=family drawn=editor scopes=primary
case 9 behavior.yml:slurm.resource control=multi drawn=editor scopes=primary
case 9 behavior.yml:clusters.key_type control=choice drawn=control scopes=primary
case 9 behavior.yml:clusters.key_file control=text drawn=control scopes=primary
case 9 behavior.yml:connections.failures control=family drawn=editor scopes=primary
case 9 behavior.yml:recover.node_download control=text drawn=control scopes=primary
case 9 behavior.yml:audit.required_files control=family drawn=editor scopes=primary
case 9 behavior.yml:audit.required_sections control=family drawn=editor scopes=primary
case 9 behavior.yml:audit.stage_folders control=family drawn=editor scopes=primary
case 9 behavior.yml:audit.website.file control=file drawn=control scopes=primary
case 9 behavior.yml:audit.website.list control=text drawn=control scopes=primary
case 9 behavior.yml:audit.website.title control=text drawn=control scopes=primary
case 9 behavior.yml:audit.website.kinds control=family drawn=editor scopes=primary
case 9 layout.yml:counts control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:palette control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:stages control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:forms control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:chips control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:statuses control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:lead_statuses control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:focus_clusters control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:focus_lanes control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:fund_stages control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:position_stages control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:teaching_stages control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:focus_lane_tones control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:ticker_categories control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:facet_tones control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:tiers control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:research_audit control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:roles control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:categories control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:rail_color control=colour drawn=control scopes=primary
case 9 catalogs/vocab.yml:leads_fit control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:data_access control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:venue_categories control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:pillar_kinds control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:venue_tiers control=family drawn=editor scopes=primary
case 9 catalogs/vocab.yml:radar_buckets control=family drawn=editor scopes=primary
case 9 schemas/manifest-schema.yml:manifest_fields control=family drawn=editor scopes=primary
case 9 layout.yml:docs control=family drawn=editor scopes=primary
case 9 behavior.yml:recover.sources control=family drawn=editor scopes=primary
case 9 behavior.yml:venues.browser control=family drawn=editor scopes=primary
case 9 behavior.yml:links control=family drawn=editor scopes=primary
case 9 sources.yml:portfolio_deck control=folder drawn=control scopes=primary
case 9 sources.yml:scan control=family drawn=editor scopes=primary
case 9 sources.yml:new_project_dir control=family drawn=editor scopes=primary
case 9 sources.yml:collections control=family drawn=editor scopes=primary
case 9 sources.yml:chat_context control=multi drawn=editor scopes=primary
case 9 sources.yml:linkedin_dir control=folder drawn=control scopes=primary
case 9 sources.yml:career_file control=file drawn=control scopes=primary
case 9 sources.yml:memories_dir control=folder drawn=control scopes=primary
case 9 sources.yml:wallpaper_dir control=folder drawn=control scopes=primary
case 9 sources.yml:bookmarks control=text drawn=control scopes=primary
case 9 sources.yml:schedules control=text drawn=control scopes=primary
case 9 behavior.yml:sign_in control=family drawn=editor scopes=primary
case 9 sources.yml:apps_dir control=text drawn=control scopes=primary
case 9 local.yml:port control=number drawn=control scopes=local
case 9 local.yml:self control=choice drawn=control scopes=local
case 9 local.yml:clusters control=family drawn=editor scopes=local
case 9 local.yml:sessions_cache control=text drawn=control scopes=local
case 9 local.yml:sessions_overrides control=text drawn=control scopes=local
case 9 local.yml:changes control=text drawn=control scopes=local
case 9 local.yml:history control=text drawn=control scopes=local
case 9 local.yml:approvals control=text drawn=control scopes=local
case 9 local.yml:lsp control=text drawn=control scopes=local
case 9 local.yml:schedule_record control=text drawn=control scopes=local
case 9 local.yml:claude_bin control=text drawn=control scopes=local
case 9 local.yml:commit_message_account control=text drawn=control scopes=local
case 9 local.yml:open_bin control=text drawn=control scopes=local
case 9 local.yml:rite_dap_bin control=text drawn=control scopes=local
case 9 local.yml:accounts control=family drawn=editor scopes=local
case 9 local.yml:calendars control=family drawn=editor scopes=local
case 9 local.yml:calendar_dir control=text drawn=control scopes=local
case 9 local.yml:mail control=family drawn=editor scopes=local
case 9 local.yml:mail_dir control=text drawn=control scopes=local
case 9 local.yml:literature.mailto control=text drawn=control scopes=local
case 9 local.yml:downloads control=family drawn=editor scopes=local
case 9 editor rows whose draft does not read back as the value: []
case 9 options of the options files: 235, rows drawn: 235
case 9 LOCAL_KEYS 21, local.yml rows drawn 21
case 9 options drawn in no scope: []
case 9 a record or list on a one-value control: []
case 9 values kept as the file has them: []
case 9 NO EDITOR rows: []
case 10 workspace appearance.yml:themes family cards=0 first field=name added: [{}]
case 10 workspace appearance.yml:code_themes.vscode family cards=0 first field=class added: [{}]
case 10 workspace appearance.yml:code_themes.shiki family cards=0 first field=id added: [{}]
case 10 workspace behavior.yml:status_bar.hidden list cards=0 first field=item added: ["x"]
case 10 workspace catalogs/glyphs.yml:glyphs family cards=0 first field=key added: 1 problems to fill
case 10 workspace catalogs/icons.yml:icons family cards=0 first field=key added: 1 problems to fill
case 10 workspace text.yml:text family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:editor.languages family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:latex.recipes family cards=0 first field=name added: [{}]
case 10 workspace behavior.yml:latex.tools family cards=0 first field=name added: [{}]
case 10 workspace catalogs/latex.yml:latex_editing family cards=1 first field=notice added: {}
case 10 workspace catalogs/unimath.yml:latex_unimath family cards=0 first field=command added: [{}]
case 10 workspace behavior.yml:lint.chktex_args list cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:literature.prefer.fields list cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:literature.prefer.abstract list cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:literature.prefer.pdf list cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:open.program_ext family cards=0 first field=key added: 1 problems to fill
case 10 workspace sources.yml:languages family cards=0 first field=key added: 1 problems to fill
case 10 workspace catalogs/file-nesting.yml:patterns family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:processes.patterns list cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:usage_tiers family cards=0 first field=key added: 1 problems to fill
case 10 workspace catalogs/agents.yml:agents family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:read_limits family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:audit_ignore parked cards=0 first field=item added: ["x"]
case 10 workspace behavior.yml:focus.sections multi cards=1 first field=value added: []
case 10 workspace behavior.yml:file_index.ext list cards=0 first field=item added: ["x"]
case 10 workspace layout.yml:boards family cards=0 first field=key added: 1 problems to fill
case 10 workspace layout.yml:nav_groups family cards=0 first field=key added: 1 problems to fill
case 10 workspace layout.yml:arrangements family cards=0 first field=key added: 1 problems to fill
case 10 workspace layout.yml:workbench family cards=1 first field=root added: {}
case 10 workspace layout.yml:floats family cards=0 first field=view added: [{}]
case 10 workspace present.yml:defaults.tag_tones family cards=0 first field=key added: 1 problems to fill
case 10 workspace behavior.yml:apps.closed_paths list cards=0 first field=item added: ["x"]
case 10 primary behavior.yml:lint.writing_skip list cards=0 first field=item added: ["x"]
case 10 primary behavior.yml:lint.writing_glyphs list cards=0 first field=item added: ["x"]
case 10 primary behavior.yml:literature.sources family cards=0 first field=key added: [{}]
case 10 primary behavior.yml:slurm.resource multi cards=1 first field=value added: []
case 10 primary behavior.yml:connections.failures family cards=0 first field=kind added: [{}]
case 10 primary behavior.yml:audit.required_files family cards=0 first field=file added: [{}]
case 10 primary behavior.yml:audit.required_sections family cards=0 first field=file added: [{}]
case 10 primary behavior.yml:audit.stage_folders family cards=0 first field=stages added: [{}]
case 10 primary behavior.yml:audit.website.kinds family cards=0 first field=kind added: [{}]
case 10 primary layout.yml:counts family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:palette family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:stages family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:forms family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:chips family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:statuses family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:lead_statuses family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:focus_clusters family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:focus_lanes family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:fund_stages family cards=0 first field=label added: [{}]
case 10 primary catalogs/vocab.yml:position_stages family cards=0 first field=label added: [{}]
case 10 primary catalogs/vocab.yml:teaching_stages family cards=0 first field=label added: [{}]
case 10 primary catalogs/vocab.yml:focus_lane_tones family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:ticker_categories family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:facet_tones family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:tiers family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:research_audit family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:roles family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:categories family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:leads_fit family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:data_access family cards=0 first field=key added: 1 problems to fill
case 10 primary catalogs/vocab.yml:venue_categories family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:pillar_kinds family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:venue_tiers family cards=0 first field=key added: [{}]
case 10 primary catalogs/vocab.yml:radar_buckets family cards=0 first field=key added: [{}]
case 10 primary schemas/manifest-schema.yml:manifest_fields family cards=0 first field=field added: [{}]
case 10 primary layout.yml:docs family cards=0 first field=label added: [{}]
case 10 primary behavior.yml:recover.sources family cards=0 first field=key added: [{}]
case 10 primary behavior.yml:venues.browser family cards=1 first field=key added: {}
case 10 primary behavior.yml:links family cards=0 first field=key added: [{}]
case 10 primary sources.yml:scan family cards=0 first field=dir added: [{}]
case 10 primary sources.yml:new_project_dir family cards=0 first field=key added: 1 problems to fill
case 10 primary sources.yml:collections family cards=0 first field=key added: [{}]
case 10 primary sources.yml:chat_context multi cards=1 first field=value added: []
case 10 primary behavior.yml:sign_in family cards=0 first field=key added: [{}]
case 10 local local.yml:clusters family cards=0 first field=resource added: [{}]
case 10 local local.yml:accounts family cards=0 first field=tool added: [{}]
case 10 local local.yml:calendars family cards=0 first field=provider added: [{}]
case 10 local local.yml:mail family cards=0 first field=provider added: [{}]
case 10 local local.yml:downloads family cards=0 first field=service added: [{}]
case 10 repo behavior.yml:editor.languages family cards=0 first field=key added: [{}]
case 10 no empty editor: ["layout.yml:rail"]
case 11 behavior.yml:lint.writing_skip held {"not":"a list"}: {"key":"workbench.settings_mismatch_list","args":["{\"not\":\"a list\"}"]}, editor drawn: false
case 11 behavior.yml:literature.sources held 7: {"key":"workbench.settings_undrawn","args":["literature.sources","7"]}, editor drawn: false
case 21 given ["venues*,venues-browser*,data*,statements*,people*,organisations*,resources*"]
case 21 record ["venues","data","statements","people","organisations","resources","venues-browser"]
case 21 closed and read back, given nothing again: true ["venues*,data*,statements*,people*,organisations*,resources*"]
case 22 no record, given ["venues*,venues-browser*,data*,statements*,people*,organisations*,resources*"]
case 22 record written ["venues","venues-browser","data","statements","people","organisations","resources"]
case 22 a second pass changes nothing: true
case 22a every view recorded, nothing added: true
case 35 two panes, given ["data*,statements*,people*,organisations*,resources*","venues*,venues-browser*,notes"]
```

What it shows: case 9, all 235 options of the options files drawn in some scope, the 21 keys of `LOCAL_KEYS` drawn in This machine, no record or list drawn by a one-value control, no value kept as the file has it, no list or family without its editor, and every editor's draft reading back as the row's value; case 10, every list and family with no value draws its editor empty and an added row is written (the rail has its own editor, `RailEditor`); case 11, a list held as a map and a family held as `7` each give the row's finding naming the key and the value, and no editor; case 21, a page saved before the Journal Browser is given it once, pinned after Venues, and once closed and read back is given nothing; case 22, a page with no `views` record is given every view of the arrangement and records them, and a second pass changes nothing; case 22a, a page that records every view is given none; case 35, a page whose Venues tab was moved to a second pane is given the Journal Browser after Venues in that pane.

### Item 13, the verify runs and the base lines

The verify list ran three times in round 0, all with `npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a`:

| Run | Log | Ended | Result |
| --- | --- | --- | --- |
| 1 | `o99notes/verify1.txt` | 18:07 | `test:quick: 324.2 s; failed: vitest checks, vitest`: diagrams, imports/order, tree/boundaries and two duplication rows red; `tests/server/machine/runs/schedules/commands.test.ts` 'reads a hand change of the commands file into the payload' `Error: Test timed out in 5000ms.` (198 changed files) |
| 2 | `o99notes/verify1-final.txt` | 18:44 | `test:quick: 301.6 s; failed: vitest slow`: `tests/data/hubs/hub-portfolio.test.ts` 'holds every record of both hubs, each under the name of its hub's folder' `Error: Test timed out in 20000ms.` (221 changed files, the fixes of run 1's checks in between) |
| 3 | `o99notes/verify1-final2.txt` | 18:51 | `test:quick: 241.9 s; every command passed` (221 changed files, no source change since run 2) |

The round-1 run is under "Verify, round 1" below.

Each test file added or changed by the step, on the unchanged tree (`o99notes/base-batch.json`, the step's test files run over a copy of the base tree; `jq` over its `testResults`), as failed of total with the first failure line, or the line that it does not load:

| Test file | On the base |
| --- | --- |
| `tests/data/hubs/connection-keys.test.ts` | 3/19 failed: `AssertionError: expected { value: { keyType: '', ...(1) }, ...(1) } to strictly equal { value: { ...(2) }, problems: [] }` |
| `tests/routes/docs/primary-key.test.ts` | does not load: `Cannot find module '../../../src/lib/server/edit/yaml/primary-key.ts'` |
| `tests/routes/hubs/settings-secrets.test.ts` | does not load: `Cannot find module '../../../src/lib/data/shapes/config-save.ts'` |
| `tests/routes/edit/deck-slides.test.ts` | 2/4 failed: `AssertionError: expected [ 400, undefined ] to deeply equal [ 200, [ 'deck.title', ...(4) ] ]` |
| `tests/routes/machine/cpp.test.ts` | does not load: `Cannot find module '../../../src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts'` |
| `tests/routes/machine/debug.test.ts` | 3/9 failed: `AssertionError: expected [ 400, ...(1) ] to deeply equal [ 200, ...(1) ]` |
| `tests/checks/config/config-folder.test.ts` | 3/30 failed: `AssertionError: expected [ 'agents', 'app_theme', ...(110) ] to deeply equal [ 'agents', 'app_theme', ...(111) ]` |
| `tests/server/edit/config-key.test.ts` | 1/36 failed: `AssertionError: expected { ...(6) } to deeply equal { ...(6) }` |
| `tests/state/system/entry-forms.test.ts` | does not load: `Cannot find module '../../../src/lib/state/system/machine/debug/launch-form.ts'` |
| `tests/state/workbench/options-pages.test.ts` | does not load: `Cannot find module '../../../src/lib/data/shapes/config-save.ts'` |
| `tests/routes/edit/undo/config-save.test.ts` | does not load: `Cannot find module '../../../../src/lib/data/shapes/config-save.ts'` |
| `tests/server/core/reader/reader.test.ts` | 3/72 failed: `AssertionError: expected [] to deeply equal [ Array(8) ]` |
| `tests/state/system/config/sparse-card.test.ts` | does not load: `Cannot find module '../../../../src/lib/state/system/config/scopes/rows.ts'` |
| `tests/state/system/settings/editor-saved.test.ts` | does not load: `Cannot find module '../../../../src/lib/state/system/config/scopes/write.ts'` |
| `tests/state/system/settings/hub-scope.test.ts` | 12/14 failed: `TypeError: Cannot read properties of undefined (reading 'length')` |
| `tests/state/system/settings/machine-section.test.ts` | does not load: `Cannot find module '../../../../src/lib/state/system/config/scopes/rows.ts'` |
| `tests/state/system/settings/port-row.test.ts` | 2/2 failed: `TypeError: (0 , __vite_ssr_import_4__.localRows) is not a function` |
| `tests/state/system/settings/row-writer.test.ts` | does not load: `Cannot find module '../../../../src/lib/state/system/config/scopes/write.ts'` |
| `tests/data/sources/config/catalog/options.test.ts` | 3/15 failed: `AssertionError: expected [ [ 'probe', ...(1) ] ] to deeply equal [ [ 'probe', ...(1) ] ]` |
| `tests/state/workbench/layout/saved/layout-saved.test.ts` | 1 failed / 7 (`o99notes/base-runs.txt:91`: the row's expect of `page.views`, received `undefined`) |
| `tests/state/sessions/served-roots.client.test.ts`, `tests/routes/git/credentials.test.ts`, `tests/server/core/credentials.test.ts` | pass on the base (0/6, 0/8, 0/20 failed): their changes are import paths and fixtures, with no new row |

Not in that batch: `tests/data/keys.test.ts` (an import path alone), `tests/checks/tree/boundaries.test.ts` (its table moved to the new `tests/checks/tree/layer-rows.ts`), the helper files `tests/routes/write-log.ts`, `tests/state/system/settings/fixture.ts`, `tests/views/system/workbench/workbench-fixture.ts` and `layer-rows.ts`, which hold no test, the rename of `chosen-hub.test.ts` to `hub-scope.test.ts` (in the batch under its new name), and the round-1 files whose rows have their own before-runs above (`autosave.client.test.ts`, `scopes.client.test.ts`, and the round-1 rows of `settings-secrets`, `config-save`, `cpp`, `primary-key`, `sparse-card` and `entry-forms`).

### Item 14, the host-visible changes

- **This machine `clusters:`.** Before: `ClusterRows.svelte`, a Save and a Remove per row, and a pick that adds a row for a cluster of `slurm.resource` that has none. After: the family editor of the This machine scope (`other-rows/ClusterRows.svelte` around `Editor.svelte`), a card per row with `resource`, `user` and `key_file`, written by the scope's Save. A new card's `resource` offers the clusters of `slurm.resource` that no row of the merged `clusters:` holds, a card keeps its own cluster in its choice, and each cluster is drawn by its name (ruling 550 (a), "Repair round 2", item 2).
- **The Port row.** Before: the port the server listens on. After: the port `local.yml` names, in the This machine scope of the primary, with a note naming the port the server listens on and the reason when a move to it was refused.
- **A hub with no `sign_in` or `connections.failures`.** Before: no provider in Account setup and no failure text. After: oculus's `google`, `microsoft` and `github` providers in Account setup and its six failure texts (`config/defaults/behavior.yml:85-92` and `95-120`).

### Item 15, the programs

Every command of the build that wrote a file or ran a program the brief does not build. None is left: `ls tests/o99*`, `ls .agents/worktrees/` of the main checkout (which lists, in round 2, `gate`, `migration-O99`, `migration-O99-round-1`, `migration-O99-round-2` and `O99-base`; the builder made none of the last four as they stand, `O99-base` being the base copy the orchestrator put back for round 2 and left as it is) and `ls` of the scratchpad for `o99base`, `o99tools` and `o99probe` find none; `ls $TMPDIR | grep -c o99-case` prints 0.

- Round 0, the python3 heredocs, the `sed -i`, the `cat >` and `cat >>` and `rewrap.py`: the files each wrote are those of the section "Shell edits" above. Their hunks cannot be told apart in the diff from later Edit hunks over the same files. `scratchpad/o99tools` (`rewrap.py`, its `before/` copies, `rewrap.diff`, `files.txt`) is deleted; the section "Shell edits" said so before it was true, and it is now.
- Round 0, the probes `caserun/rows.ts`, `c2.ts` and the folder `caserun/o99` (`views.test.ts`, `draws.test.ts`, `case.config.mts`): each read the tree and printed, wrote no file of the worktree, and is deleted.
- Round 0, `scratchpad/o99probe/oa.ts` and `rowsyml.ts` (the second not in the brief's list): each read the tree and printed, and both are deleted.
- Round 0, the base copies `.agents/worktrees/O99-base` (under the main checkout's `.agents/`, outside the worktree, which the rules forbid) and `scratchpad/o99base`: a copy of the base tree with the step's tests, run for `base-batch.json`; both are deleted.
- Round 0, 15 scratch hubs `$TMPDIR/o99-case-*` made by the case programs: deleted.
- Round 1, the case-run program of item 12: written with Write, run once, its source copied to `o99notes/r1/o99-cases.test.ts.source`, and deleted.
- Round 1, reads that ran a program and wrote nothing of the worktree: a python3 one-liner that read the session transcript's JSON; `jq` over `o99notes/base-batch.json`; `sed -n ... > o99notes/r1/hubfail.txt` and `shipfail.txt`, two copies of six lines each (the hub's and oculus's failure rows) for `diff`, in the notes folder.
- Round 0, a `grep` of `config/options/local.yml` without `--exclude=local.yml`; every later read of it used `git grep ... ':!config/local.yml'`. The O99 brief's reading list asks for that file to be read whole.

No other file was written by a shell command in round 1; every change of the round went through Edit or Write.

### Edits to existing assertions in round 1

- `tests/routes/hubs/settings-secrets.test.ts:72`: 'the History record holds no secret and offers no undo' is 'the History record holds no secret', its expect of `undo: 'none'` taken out (item 1).
- `tests/state/system/config/sparse-card.test.ts:411-422`: the NESTED row "arXiv's oa value" gains `saved: false`, and the table writes `one.saved ?? one.value` at the held path (item 9).
- `tests/server/core/reader/rows.yml:289`: back to the base's `oa: { value: true }`.

Both test files are new or changed in this step; neither edit touches an assertion of the base.

### Widenings of the path list in round 1

- `src/routes/+page.svelte`: the File menu's Save All calls `saveJoined` (item 4).
- `src/lib/state/system/config/editors/offers.ts`, new: `fields.ts` passed 880 lines with item 9 (913), so what a control offers (`Pool`, `poolOf`, `blockPool`, `hueOf`, `isStray`, `Offer`, `suggests`, `offerFor`) moved there; `fields.ts` is 757 lines. Its importers changed with it: `src/lib/views/system/workbench/editors/FieldControl.svelte` (520 lines), `tests/state/system/settings/theme-groups.test.ts` and `tests/state/system/settings/collection-fields.test.ts`.
- `src/lib/state/system/config/editors/draft.ts` and `slots.ts`: the scalar of a constant (item 9).
- `config/defaults/behavior.yml` and `tests/server/core/reader/rows.yml`: the `oa` row (item 9).
- `config/options/catalogs/agents.yml`: the `lists` description case 9 found (item 12).
- `tests/views/system/workbench/scopes.client.test.ts`, new: the row of item 11, which named no test file.

### Verify, round 1

One run, `npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a`, 20:20:22 to 20:26:48 (`o99notes/r1/verify.txt`):

```
test:quick: 230 changed file(s), from git since a5281619a
test:quick: 341 test file(s)
ok      ASCII gate (2.1 s)
ok      svelte-kit sync (2.7 s)
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      eslint (16.3 s)
ok      svelte-check (31.8 s): 1793301678396 COMPLETED 568 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (219.9 s)
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to
+   "defaults/behavior.yml:765 literature.sources[5].fields.oa does not fit the schema of this file",
 FAIL  |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
+   "src/lib/state/sessions/source/autosave.svelte.ts:160",
+   "src/lib/state/system/config/editors/fields.ts:123",
 Test Files  2 failed | 13 passed (15)
      Tests  2 failed | 251 passed | 9 skipped (262)
ok      vitest (260.8 s): Duration  249.39s (transform 257.88s, setup 0ms, import 505.40s, tests 438.29s, environment 30.50s)
ok      vitest slow (362.1 s): Duration  350.96s (transform 23.58s, setup 0ms, import 190.04s, tests 1201.39s, environment 20ms)
test:quick: 366.0 s; failed: vitest checks
```

The two comment lines over 100 columns are rewrapped with Edit (`autosave.svelte.ts:158-161`, `fields.ts:123-125`), and the comment-width check alone then passes: `npx vitest run tests/checks/source/comment-width.test.ts`, `Test Files  1 passed (1)`, `Tests  2 passed (2)` (`o99notes/r1/comment-width-after.txt`). The two files also pass `npx prettier --check` and `npx eslint`, and their tests (`autosave.client`, `sparse-card`, `collection-fields`, `theme-groups`) give `Tests  95 passed (95)`. The config-folder line stayed red in round 1; it passes after repair round 2, item 1. `test:quick` does not cover the tests that reach no changed file within its import depth (other than the checks under `tests/checks/source` and `tests/checks/tree`), the build, or the lint of unchanged files.

The character-set check over the 25 files round 1 changed (the 24 above and this report), `LC_ALL=C grep -nP '[^\x00-\x7F]' <files>`, prints no line. The line counts: `FieldControl.svelte` 520, `fields.ts` 757, `draft.ts` 837, every other changed source file under 880; `src/lib/state/system/config/editors/` holds 8 items.

## Repair round 2

Brief `.scratch/migration/agents/briefs/O99-round2.md`, rulings 548 (a) and 550 (a). Both items are built. Each new or changed test row was run once on the round-1 tree, before the round's source change, with the new tests in place: `npx vitest run tests/state/system/settings/cluster-rows.test.ts tests/state/system/config/sparse-card.test.ts tests/data/sources/config/catalog/options-schema.test.ts` (`o99notes/r2/before.txt`), `Test Files  3 failed (3)`, `Tests  4 failed | 43 passed (47)`.

### Item 1, the control word `scalar`

Change:

- `src/lib/data/shapes/catalog-words.ts:18`: `'scalar'` in `CONTROLS`, after `'text'`; its doc comment says a scalar is a text (with the holes and the form a text has), a number or a flag, drawn as a text box and written in the type the file held it in.
- `config/options/behavior.yml:1322-1324`: `reader_value`'s field `value` is `{ help: a fixed value, a text with holes, a number or true or false, control: scalar }`.
- The schema, `src/lib/data/sources/config/catalog/schemas/options.ts:173`: `case 'scalar': return { anyOf: [textSchema(spec), { type: 'number' }, { type: 'boolean' }] };`, so a text keeps its holes and form, and nothing else passes.
- The value rule, `src/lib/data/sources/config/catalog/value-rule.ts:323-325`, the same and nothing more:

```ts
case 'scalar':
    if (typeof value === 'boolean' || finite(value)) return null;
    return typeof value === 'string' ? formProblem(spec, value) : { kind: 'scalar' };
```

  The kind `scalar` is worded in each of the three places a kind is worded: `value-words.ts:96-97` (`findings.words.scalar`, `config/text/findings.yml:286`, "a text, a number or true or false"), `config-fit.ts:123-124` (`server.config_key.not_scalar`, `config/text/server.yml:103`, "This option takes a text, a number or true or false"), while the card's `troubleOf` (`fields.ts:448`) refuses a scalar's text by its form, as it does a text's; a value of the wrong type cannot come out of the card's text box, and `troubleOf` returns null for the kind `scalar`, as for `text`.
- The card, `src/lib/state/system/config/editors/fields.ts`: `readField`'s case `scalar` reads a flag or a finite number as its text with its type (`scalarText`), a string as itself, anything else as stuck, so it is kept as the file has it. `writtenField`'s case `scalar` writes the text through `scalarOf(text, reading.scalar)` (`'true'` or `'false'` as a flag when the file held a flag, a decimal as a number when it held a number, otherwise the text) and then through `valueProblem`, so the form check runs on every text written; the only value that does not go through it is one equal to a value the file holds at that field (`heldAlready`), which every control of the card treats so. `commitValue` (an option set one key at a time) has the same case, the type taken from the value in force, which `scopes/write.ts:35` now passes (`commitValue(row.entry, input, lists, row.value)`); no shipped option has `control: scalar` at the top level, so that case is reached by no shipped row. The type `Scalar` is no longer exported.
- Round 1's reading of a flag or a number into every `text` box is gone: `readField`'s case `text` is removed, so a text field falls to the base's `default` case (a record where the field takes one, else a string), and `writtenField`'s cases `text` and `long` are the base's. A `text` field holding a flag or a number is kept as the file has it, as on the base.
- `Control.svelte:61-63` counts `scalar` among the boxes; `rows.ts:273-275` (`cannotShow`) treats a scalar as it treats a text; `FieldControl.svelte` draws a scalar in its default text box, and its head comment says "a text box for a text or a scalar", rewrapped within its ten lines (520 lines, as before).

The pages and comments that list the control words, as `git grep -n -I -E "toggle.*(text|long).*(glyph|hue|colour|folder)" -- src` and `git grep -n -I -e "toggle, number" -- ':!config/local.yml'` find them outside the ledger: `config/options/appearance.yml:10` (now "toggle, number, text, scalar (a text, with the holes and the form a text has, a number or true or false, drawn as a text box and written in the type the file held it in), long (a text area), ..."), `src/lib/server/edit/writes/config/config-key.ts:2-3` ("for a toggle, a number, a text, a scalar, a choice, ..."), `Control.svelte:4` and `FieldControl.svelte:5`, and `schemas/options.ts:12` and `catalog-words.ts:11`, which name it.

Doc text: none. No line of `docs/templates.md`, `docs/HELP.md` or `docs/data-map.md` lists the control words: `grep -c` of `toggle, number`, `text area` and `scalar` in each prints 0, but for `docs/templates.md:655`, "A scalar or a list without a key field replaces oculus's value whole", which means a YAML scalar and stays; `grep -c -i control docs/templates.md docs/data-map.md` prints 0 and 0, and the 34 lines of `docs/HELP.md` that say "control" name controls of the views (a fold control, a Recover control), none the catalog's words. `git diff --stat a5281619a -- docs/HELP.md docs/templates.md docs/data-map.md` prints nothing.

Tests:

- `tests/state/system/config/sparse-card.test.ts`, the table 'keeps %s that a text field holds as the file has it, and draws no box for it' (rows 'a boolean' and 'a number'): a reader row whose `name`, a text field, holds `true` or `7` has no `name` field on its card, keeps it under `literature.sources[0].name`, and saves the row unchanged. Before: `AssertionError: expected 'true' to be undefined` and `AssertionError: expected '7' to be undefined` (line 580). After: passes.
- The table 'draws $name constant value as its text, and saves it and a text typed over it in its type' (round 1) passes before and after.
- `tests/data/sources/config/catalog/options-schema.test.ts`, describe "the schema of a reader row's constant value, a scalar": 'takes a text with holes, a number and a flag in %s' (`'{id} preprint'`, `3`, `2.5`, `true`, in `config/defaults/behavior.yml` and in a hub's `.oculus/config.yml`), before `AssertionError: expected [ [], ...(3) ] to deeply equal [ [], [], [], [] ]` with `"3: literature.sources[0].fields.oa does not fit the schema of this file"` for `3`, `2.5` and `true`; 'refuses a record and a list, each on its line, in %s' (`{ a: 1 }`, `[1, 2]`), which passes before as after, since a text schema refuses both too. After: both pass. The head comment says what the describe holds.
- `tests/checks/config/config-folder.test.ts` passes: in the verify run below, and alone with the settings, config and catalog tests (`npx vitest run tests/state/system/settings/ tests/state/system/config/ tests/data/sources/config/catalog/ tests/checks/config/config-folder.test.ts`, `Test Files  12 passed (12)`, `Tests  165 passed | 2 skipped (167)`).

### Item 2, the cluster pick of This machine

Behaviour:

- Before (`git show a5281619a:src/lib/views/system/workbench/settings/other-rows/ClusterRows.svelte`): under the `clusters:` row, each row of every hub's file with its user and key file boxes and its own Save and Remove, which wrote through POST /api/clusters at once; the add pick offered exactly the clusters of the setup's `clusters` (those `slurm.resource` names) that no row of the setup's `rows` held, each drawn by its name; a row there had no choice of cluster.
- Round 1: the family editor of the This machine scope, its `resource` a choice `from: clusters`, which offered every cluster entry of the resources registry of the scope's hub: also a cluster `slurm.resource` does not name and one that has a row.
- After: the family editor, held and saved like every other This machine change (the scope's Save, Save All, the digest check), with no Save of its own. A new card's `resource` offers exactly the clusters of `slurm.resource`, in its order, that no row of another hub's file holds (the setup's `rows` whose `hub` is not the scope's hub) and no card of the draft holds, so a row added or taken out in the draft counts before the Save. A card keeps its own cluster in its choice when `slurm.resource` names it; a cluster it names no more is shown and marked as not in the list, as every choice marks a held word outside its list. Each cluster is drawn by the name the setup gives it. While the setup is being read the choice says it is loading; a setup that could not be read says `accounts.cluster_unreachable` in the choice. The setup is read when the editor is drawn and again whenever the file's value of the row moves, as after a Save. The `clusters` list is not narrowed (`slurm.resource` and the server's check of a write still read all of it), and no catalog word is added.

Change:

- `src/lib/state/system/config/editors/sources.ts`: `Lists` takes an optional `narrow(source, record)`, what a choice of one row offers of a source in place of its items, by the record the field is in; `SourceItems` is exported for it. `src/lib/state/system/config/editors/offers.ts` `addSource` uses `lists.narrow?.(source, record) ?? lists.items(source)`, and `poolOf` passes the record. Every other list is built as before.
- New `src/lib/state/system/config/other-rows/cluster-rows.ts` (82 lines): `CLUSTERS_ROW` (`'local.yml:clusters'`), `clusterChoice(setup, row, draft)` (the named clusters, the held ones, the names), `clusterOffer` (not exported) and `clusterLists(lists, choice, failed)`, which narrows `clusters` and adds the names to its labels.
- New `src/lib/views/system/workbench/settings/other-rows/ClusterRows.svelte` (69 lines): reads the setup (`hpc.readSetup()`), derives the draft as `Editor.svelte` does, and draws `<Editor {row} {id} {editors} lists={narrowed} />`.
- `src/lib/views/system/workbench/settings/Item.svelte:220-221`: `{:else if row.id === CLUSTERS_ROW && drawsEditor(row) && row.unread === undefined}` draws `ClusterRows`; the head comment names it.

Test: new `tests/state/system/settings/cluster-rows.test.ts`, over the This machine `clusters:` row of the primary (the shipped catalog of `local.yml`, a file with a row for `held`) and a resources registry of `free`, `held` and `unnamed`, with `slurm.resource` naming `held` and `free`: 'offers a new row the clusters of slurm.resource with no row, and no other' (`['free']`: `held` has a row, `unnamed` is not named) and 'offers a row its own cluster with the clusters of slurm.resource no row holds' (`['held', 'free']`). Before: the file does not load, `Error: Cannot find module '../../../../src/lib/state/system/config/other-rows/cluster-rows.ts'`. After: both pass. The drawing of the row is for the look at landing.

### After the change

`npx vitest run tests/state/system/settings/cluster-rows.test.ts tests/state/system/config/sparse-card.test.ts tests/data/sources/config/catalog/options-schema.test.ts --reporter=verbose`: `Test Files  3 passed (3)`, `Tests  49 passed (49)`. `npx svelte-check --tsconfig ./tsconfig.json --threshold error`: `COMPLETED 4537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`. `npx prettier --check` and `npx eslint` over the round's files: clean.

The full verify list, once, after the round's last change (`npm run diagrams && npm run docs:palette && npm run test:quick -- --base a5281619a`, `o99notes/r2/verify.txt`, `exit 0`):

```
test:quick: 237 changed file(s), from git since a5281619a
test:quick: 344 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (11.7 s)
ok      svelte-check (56.7 s): 1793305919261 COMPLETED 569 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (197.9 s): Duration  186.70s (transform 64.35s, setup 0ms, import 232.42s, tests 483.36s, environment 5ms)
ok      vitest (255.7 s): Duration  244.83s (transform 229.75s, setup 0ms, import 493.41s, tests 435.17s, environment 29.63s)
ok      vitest slow (346.2 s): Duration  335.79s (transform 22.75s, setup 0ms, import 181.43s, tests 1149.07s, environment 22ms)
test:quick: 348.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The other checks, after the last change:

- Character set: `LC_ALL=C grep -nP '[^\x00-\x7F]'` over the 23 files of the round (`o99notes/r2/files.txt`) and this report prints no line (grep exit 1).
- Unused exports: `diff ../O99-base/unused-exports.txt <(sh utils/unused-exports.sh)` gives only removals (`rail.ts: RAIL`, `groups.ts: CATALOGS_GROUP, TEXTS_GROUP`, `config/write.ts: commit, Committed`), the count lines (230 to 228, types 109 to 108) and the moved line `src/lib/server/core/files/yaml/yaml-edit.ts: BLOCK_LISTS, pathOf, renameKey` (the base's `server/edit/yaml/yaml-edit.ts`, moved in round 0). No new unused export.
- `wc -l` of the round's source files: `catalog-words.ts` 133, `schemas/options.ts` 428, `value-rule.ts` 363, `value-words.ts` 135, `config-fit.ts` 568, `config-key.ts` 507, `fields.ts` 778, `offers.ts` 179, `sources.ts` 227, `scopes/write.ts` 149, `rows.ts` 601, `Control.svelte` 143, `FieldControl.svelte` 520, `Item.svelte` 358, `cluster-rows.ts` 82, `ClusterRows.svelte` 69; none over its limit.
- `sh utils/folder-check.sh` prints nothing and exits 0; `tests/state/system/settings/` holds 9 items, `state/system/config/other-rows/` 2, `views/system/workbench/settings/other-rows/` 3.

### Widenings of the path list in round 2

The brief names the files each item names, the files of the control words and their pages, the tests and the report. Also written, each for its item:

- Item 1: `value-words.ts`, `config/text/findings.yml`, `config/text/server.yml` and `config-fit.ts` (the kind `scalar` worded where every kind is worded), `scopes/write.ts` (the held value passed to `commitValue`), `Control.svelte` and `rows.ts` (a scalar drawn and shown as a box), `config-key.ts` (its head comment lists the controls).
- Item 2: `editors/sources.ts` and `editors/offers.ts` (the `narrow` of a row's lists), `Item.svelte` (the row drawn by `ClusterRows`).
- Both: `tests/state/system/config/sparse-card.test.ts:513-515`, a round-1 doc comment of 103 columns rewrapped.
- The report's own sections of rounds 0 and 1 are corrected where round 2 changed what they say: the first line, the open items, the rulings, the DONE table, the line counts (counted again), judgment call 12, round 1's "Not done", items 9, 14 and 15 and its verify note, and the lead of the table of changed test lines.

### Edits to existing assertions in round 2

None. The new rows are added beside the old; `sparse-card.test.ts` gains `sourceRowOf(source)`, which `constantRowOf` now calls, and the head comments of `sparse-card.test.ts` and `options-schema.test.ts` say what their new rows hold.

### Programs and shell writes in round 2

- `npx prettier --write` formatted the two new files `cluster-rows.ts` and `ClusterRows.svelte` after their Write, a shell write the round's rules do not allow; it changed only their layout (the wrapping of one signature and one expression). Every other file of the round was written with Edit or Write.
- Command output was redirected into the notes folder: `o99notes/r2/before.txt`, `o99notes/r2/verify.txt`, and `o99notes/r2/files.txt`, a list of the round's files, none of them in the worktree.
- A first start of the verify list was stopped before it ended, since two exports were made private after it began; the run quoted above is the one after the last change.
- No other program ran; no scratch server, scratch hub or tmux was used.
