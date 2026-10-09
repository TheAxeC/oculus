# Step D39 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D39, base 58c7840d9)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 58c7840d9          (exit 0, wall 1:16.31)
test:quick: 96 changed file(s), from git since 58c7840d9
test:quick: 125 test file(s), 10 essential
ok      svelte-kit sync (13.3 s)
ok      prettier (13.3 s): All matched files use Prettier code style!
ok      ASCII gate (13.3 s)
ok      eslint (42.6 s)
ok      svelte-check (43.3 s): 1791496019983 COMPLETED 437 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (62.4 s): Duration  55.28s (transform 106.40s, setup 0ms, import 132.71s, tests 78.32s, environment 316ms)
test:quick: 75.9 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npm run test:checks
Test Files  17 passed (17)
Tests  248 passed (248)
Duration  185.86s

Scoped files, each `npx vitest run <file>` alone, all passed:
references.test.ts 33 (5.97s, tests 4.57s) | rename.test.ts 24 (5.54s, tests 3.65s) | refactor-preview.test.ts 7 (828ms)
hub-names.test.ts 11 (120ms) | lsp-edit.test.ts 11 (3.98s) | replace-undo.test.ts 2 (2.97s) | lsp/edits.test.ts 8 (1.04s)
relay.test.ts 5 (1.98s) | lifetime.test.ts 26 (3.69s) | versions.test.ts 2 (2.99s) | servers.test.ts 6 (3.35s)
uris.test.ts 29 (1.67s) | library.test.ts 36 (9.24s) | schema-rules.test.ts 7 (1.39s) | relation-shapes.test.ts 9 (1.60s)
config.test.ts 31 (2.41s) | config-folder.test.ts 25 (22.69s) | options.test.ts 3 (1.26s) | integrity.test.ts 8 (2.91s)
diff-read.test.ts 4 (1.03s) | present.test.ts 4 (1.30s) | held-unsaved.test.ts 3 (2.00s) | sessions/source.test.ts 25 (8.42s)

ASCII gate perl command: prints nothing, exit=0
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/*.md ../../docs/DATA-MAP.md: exit=1 (no hit)
sh utils/folder-check.sh: exit=0
wc -l largest: relay.ts 879, transport.ts 874, repositories.ts 863, ops.ts 857, state/client/context.ts 839,
  server/root/context.ts 811, servers.ts 791, Diff.svelte 520, References.svelte 493
sh utils/unused-exports.sh: 364 lines, base 364, diff exit 0
yaml parse of the 6 changed .yml: "yaml ok 6", exit 0
grep -n "no formatting and no rename" docs/files-and-search.md: exit 1
grep "Audit, `collections`" ../../docs/DATA-MAP.md: only the link rows 285, 291, 292, 293
grep -rn no_waiting_on src config tests docs: exit 1

Probe (scratchpad review-probe/shared-key.mjs, node 24, a planted hub where `beta` is a person key and a
project id, alpha's manifest `waiting-on: [beta]`, `related: [beta]`):
definition hit definition beta targets 1 refuseRename null
waiting-on hit reference beta targets 2 refuseRename {"code":"sources","key":"beta","sources":["people","projects"]}
plan from the people definition ok
  registries/people.yml [{"range":{"start":{"line":5,"character":11},"end":{"line":5,"character":15}},"newText":"gamma"}]
  projects/active/alpha/project.yml [{"range":{"start":{"line":3,"character":13},"end":{"line":3,"character":17}},"newText":"gamma"}]

Builder's own unchanged-tree run of relation-shapes ($S/firstrun-final.txt:73-75):
=== tests/data/snapshot/relation-shapes.test.ts
 Test Files 1 passed (1)
 Tests 9 passed (9)

History words over added lines of `git diff 58c7840d9` (case-insensitive, word bounded): 54 lines.
```

`npm run diagrams` was not run (it writes files).

## Verdicts

Items of "What to build":

- 1 (reference index): holds, G66 table 33 passed, read in full (scan.ts, lookup.ts, build.ts, specs.ts, catalog references.ts).
- 2 (relay hook and capabilities): holds, relay 5, servers 6, lifetime 26 passed; `#givenBy` before forwarding (relay.ts:494-499), `referencesProvider` and `renameProvider` with `prepareProvider: true` in servers.ts.
- 3 (rename and refusals): violated, Behaviour 1 (a rename started at the definition of a key that is also a key of the other source of `waiting-on` is not refused and rewrites the ambiguous value).
- 4 (page-side preview): partial, Spec 1 (a refusal given at `rename` is a page notice, not shown at the caret as item 4 and case 23 say, and the report does not state the deviation); plan/commit, store and view otherwise hold (G68 7 passed, lsp/edits 8 passed).
- 5 (5 MB limit, private-folder refusal): holds, every reader of the write limit uses `WRITE_MAX_BYTES` (lsp-edit.ts:71 and :80, history.ts:53 and :71-72, held/answers.ts:30, hub-keys.ts:123, state/client/context.ts:576); refusal by `under` with real paths on both sides (paths.ts:38-45, lsp-edit.ts:68-69, ops.ts:741); see Behaviour 3 for the page's new refusal of large closed files.
- 6 (schema references): holds, relation-shapes 9 passed; `listedFields` (schema/manifest.ts:95-103) is exactly the brief's "a field whose `from` sources all read".
- 7 (whole-key selection): holds by reading (hosts.ts `kept`, renames.ts `placesOf`, References.svelte and lsp.ts `walk` pass the end); the look is pending.
- 8 (documents): partial, Standards 3 (DESIGN.md:576 keeps "the bytes the page read just before the post", false after the plan/commit split) and Standards 4 (hub-keys.ts head comment).
- 9 (tests): holds, every new file passes; see Standards 2 for comment wrapping.
- 10 (`sameDiskFile`/`diskPath`): holds, hub-names 11 and held-unsaved 3 passed, G28 first-run failures quoted in the report.

Cases:

- 1-9, 9a, 9b: met, the builder's runs (`allcases-rerun*.txt`) and the G66 rows that pass in my scoped run; the Cmd underline and the selection are the look.
- 10, 11, 15, 16, 17, 18: met, G66 rows and the builder's runs.
- 12: met, hub-keys.ts `answerHubKeys` returns undefined for a position that is no hub key in an indexed file, so the request is forwarded.
- 13, 14: met by reading and the builder's run; the rows and the Peek are the look.
- 19: met with a deviation the report does not name: `textDocument/references` in a file the index does not hold is answered `[]` by the YAML entry (hub-keys.ts:233-235) where the case says every request is forwarded; the head comment's reason holds (the base answered "Unhandled method textDocument/references", the builder's t0-base run).
- 20: met, the builder's run (not rerun).
- 21, 22, 24: met, G67 rows (edited, QUOTED, CRLF) pass.
- 23: partial, Spec 1 (refusals at `rename` are notices) and Behaviour 1 (the two-source refusal is missing from the definition side).
- 25: met, transport run quoted by the builder; the caret is the look.
- 26, 27, 28, 29, 30, 30a, 30b, 30c: met, lsp-edit.test.ts, edits.test.ts and refactor-preview.test.ts rows pass, and the builder's 30b run.
- 31, 32, 33: met, G68 rows.
- 34, 35, 36: met by reading; the look decides.
- 37: partial, Behaviour 2 (an empty refusal message shows `lsp_edit_failed`'s sentence with a literal `{0}`).
- 38, 39, 40, 41, 43: met, G66 and G67 rows.
- 42, 44, 45, 47: met, the builder's runs (not rerun).
- 46: met; "the file posted once" against posts 0 reads as one write of the file, and both tabs edited unsaved with nothing posted is item 4's tab rule.
- 48: met, hub-names and held-unsaved rows.

## 1. Spec

- src/lib/ui/controls/editor/kit/lsp/transport.ts:638-645: "if (message.error !== undefined && waiting.method === RENAME) { // The box is closed by now and the caret may have moved, so the refusal is a notice. ... this.#host.notice('lsp_edit_refused', words);"; what is wrong: a refusal given at `textDocument/rename` (empty key, a key that exists, a person renamed to a project id, a file over 5 MB, `a, b` that does not read back) is a page notice; item 4 ("the transport rejects with so Monaco shows it at the caret ... prepareRename and rename both") and case 23 ("its sentence shown at the caret") ask for the caret. The brief's premise is wrong for `rename`: Monaco 0.57 sends a rename-time reject reason to `_notificationService.info` (rename.js:241-243) and a thrown error to "Rename failed to compute edits" (rename.js:267-269), which the standalone notification service writes to the console (standaloneServices.js:170-185); only the prepare path shows at the caret (rename.js:196-198). The notice matches where VS Code puts a rename-time reason (a notification). The caret remains reachable through the editor's `editor.contrib.messageController` contribution (messageController.js:31, `showMessage(message, position)`). The report's section "Rules the brief got wrong" says "None found" and its case 23 lists these refusals as met without saying where they show; failure scenario: the orchestrator and the look on landing expect the sentence at the caret and find a notice, or accept case 23 without knowing it changed; verdict: item 4 partial, case 23 partial. The choice between the notice (recommended, it matches VS Code's notification) and the caret through the message controller is Axel's to rule; the report must state it either way.

## 2. Proof

- agents/reviews/D39-report.md, "Paths outside the brief's list": "`under` moved down a layer so `data` can reach it"; what is wrong: no file under `data` imports `under` (`grep -rn "import.*\bunder\b" src` lists rules.ts:24, machine-file.ts:14 and lsp-edit.ts:34 only); the move is needed because `server/files/fs/lsp-edit.ts` may not import `server/machine/lsp/library/rules.ts` under the server folder order of tests/checks/imports/order.ts (files comes after machine), and `server/core` is last; the placement is right, the reason is wrong; failure scenario: a reader checking the layer rule looks for a data importer that does not exist; verdict: none (report text).
- agents/reviews/D39-report.md, same section: "`source-server.ts` gains a `kept` option"; what is wrong: the diff gives it `roots` (`Partial<Pick<SourceDeps, 'rules' | 'kept' | 'roots'>>`, tests/state/sessions/source-server.ts:26); verdict: none.
- agents/reviews/D39-report.md, same section: "My `context.ts` change is 1 line (810 to 811) in the schema feed line"; what is wrong: server/root/context.ts has two changes, line 257 (`catalog: () => textCatalog(make.loadConfig(engine).config)`, inside D36's listed range 237-262) and line 327 (`schemas: (set, references) => schemas.publish(set, references)`); the landing's merge with D36 rests on this; failure scenario: the orchestrator plans the D36 merge around one line and misses the one inside D36's range; verdict: none.
- agents/reviews/D39-report.md, "Tests added or changed": "`tests/data/snapshot/relation-shapes.test.ts`. Passes on the unchanged tree (section 1)"; what is wrong: the new G64 row guards a preserved behaviour (one finding) whose producer moves from `checkRelationShapes` to the schema, so the rules file's rule on preserved behaviour asks for the passing run quoted; the run exists ($S/firstrun-final.txt:73-75, "Tests 9 passed (9)") and is not quoted; verdict: none.
- agents/reviews/D39-report.md, section 6: "G66 (`guarded.md:128` ...)", "G8 (Test line gains, :44)", "G64 (... :145)"; what is wrong: `grep -n` on the ledger's guarded.md gives G2 at 10, G8 46, G9 49, G28 56, G66 131, G67 134, G68 137, G64 146; failure scenario: the Doc text is applied at the wrong line if placed by number; verdict: none.
- agents/reviews/D39-report.md, section 6, G67's widened sentence: "it refuses ... a value that is a key of two sources a field takes together"; what is wrong: true from the reference position, false from the definition position (Behaviour 1, the probe above); verdict: the G67 Doc text is wrong until Behaviour 1 is fixed.
- agents/reviews/D39-report.md, section 1: "Drawing it needs a service override of Monaco's, which the brief left to a look and a report. I did not build one."; what is wrong: ruling O1 asks the builder to look at the override and report it; the report restates the premise without the look: where the override goes (the third argument of `monaco.editor.create`, which `StandaloneServices.initialize` takes once, from the first editor created, standaloneEditor.js:44), what it is (an `IBulkEditService` whose `hasPreviewHandler` returns true and whose `apply` with `showPreview` routes to the oculus preview, beside the `StandaloneBulkEditService` of standaloneServices.js:513-520), and what else it changes (Monaco then binds its own preview key and calls `apply` for the rename result); failure scenario: Axel cannot weigh the hint line against its cost from the report; verdict: none on an item; the hint line itself is not asked for by item 4 or O1.

## 3. Standards

- src/lib/data/snapshot/references/model.ts:88-92: "/** Every file the index reads. */ /** A file of oculus's own configuration and the node that reads where it names a hub key. */ export type OptionFile ... export type ReferenceIndex = { files: readonly FileScan[] };"; what is wrong: two stacked doc comments, the first orphaned from `ReferenceIndex`, which has none (rules file, comments state what the code is); failure scenario: an editor's hover shows the wrong comment for `OptionFile` and none for `ReferenceIndex`; verdict: none. Fix at landing.
- src/lib/data/sources/config/catalog/schemas/references.ts:63-64: "/** Whether a family is a map from a key to one value: fields `key` and `value` and no more. */ /** The node of an options family ... */"; what is wrong: a stale doc comment of a function that is not there, stacked above `familyNode`'s; verdict: none. Fix at landing.
- src/lib/data/snapshot/references/scan.ts:12-14: "several YAML documents gives the places of every document; a file that does not parse as YAML / gives none / and is marked `unparsed`"; src/lib/views/sources/repositories/diff/diff-read.ts:4: "or several reads joined into one answer. A group of"; src/lib/state/system/machine/lsp/edits.ts:11: "roots)."; what is wrong: short lines inside an edited paragraph (rules file, an edited comment is rewrapped at 100 columns with no short line inside a sentence); verdict: none. Fix at landing (prettier does not rewrap comments).
- DESIGN.md:576: "The request names each file with the SHA-256 of the bytes the page read just before the post"; what is wrong: after the split the hash is read by `plan` and posted by `commit`, possibly minutes later behind a preview (edits.ts:39-40 says "the bytes the plan read"; refactor-preview.test.ts and case 27 depend on it); item 8 rewrote this paragraph; failure scenario: a reader concludes a disk change during a preview is picked up rather than refused; verdict: item 8 partial. Fix at landing ("the bytes the page read when it planned the edit").
- src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:20-21: "A rename that must not be made is an error whose message is the reason in words, which the page shows where the caret is."; what is wrong: false for a refusal at `rename` (Spec 1); verdict: item 8 partial; changes with Axel's ruling on Spec 1.

## 4. Behaviour

- src/lib/data/snapshot/references/rename.ts:47-60 (`refuseRename`) and :124-160 (`planRename`, `editedIn` via `referencesTo`): "if (targets.length > 1) { ... return { code: 'sources' ...} } const sources = targets[0].definition.sources;"; what is wrong: the two-source refusal looks at the hit's targets only; F2 on `key: beta` in people.yml, where `beta` is also a project id, has one target, is not refused, and the plan rewrites alpha's `waiting-on: [beta]`, which also named project beta (probe output above); item 3 refuses "a key that is a key of two sources a field takes together"; the report does not state it; failure scenario: renaming person `beta` to `gamma` silently drops project alpha's waiting-on link to project `beta` and points it at the person; verdict: item 3 violated, case 23 partial. Send back: refuse when any reference to the targets resolves to a definition outside them (or to more than one source), with a G67 row started at the definition.
- src/lib/ui/controls/editor/kit/lsp/transport/renames.ts:59 and transport.ts:641: "answer.error.message === '' ? words('lsp_edit_failed') : answer.error.message"; what is wrong: `lsp_edit_failed` is "The language server's edit to {0} could not be made, so nothing was changed." (config/text/views/sources/source.yml:71), `noticeWords` passes no word (views/sources/source/language/lsp.ts:115-124), and `fillPlaceholders` leaves a missing placeholder as written (data/helpers/finding-text.ts:24-28); the builder's transport run used an identity `words`, so its quoted result `rejected with lsp_edit_failed` hides this; failure scenario: a server refusing prepareRename or rename with an empty message shows "The language server's edit to {0} could not be made" at the caret or in a notice; verdict: case 37 partial. Fix: a sentence without a placeholder for a refusal with no words.
- src/lib/state/system/machine/lsp/edits.ts:320-322 and state/client/context.ts:575-579: "const read = await parts.read(...); if (read === null) return stop(refuse('lsp_edit_failed', file.name));" with `read` null when the answer is truncated at 5 MB or not text; what is wrong: a closed file over 5 MB or not text named by any server's edit (pyright, clangd) is now refused by the page as `lsp_edit_failed`, where the base read the hash and the server refused it as `too_large` or `binary` with its own sentence; for an immediate edit the hash is also read at the plan, no longer right before the post; the report states neither; failure scenario: the reader is told the edit "could not be made" without the reason; verdict: none on a case (item 5's limit holds). Report it, or give the page the specific notice.

## Answers to the ten points

1. test:quick took 75.9 s in my run (limit 45.0 s; the builder's 51.6 s). The selection is 125 test files from 96 changed files; config-folder.test.ts alone took 22.69 s and is selected because config files changed; the two new data files add 8.22 s of test time (4.57 s and 3.65 s, each row planting a hub). No change inside the step brings the list under 45 s without deleting tests or raising a timeout, which Z417 forbids; this is the orchestrator's item, not a builder finding.
2. rename.js:218 reads `this._bulkEditService.hasPreviewHandler()`, standaloneServices.js:518-519 returns false; confirmed. Neither item 4 nor O1 asks for the hint line; O1 asks for a look and a report, which the report gives thinly (Proof, last finding). No `StandaloneServices` or service override exists in src (grep for `StandaloneServices|overrideServices|IBulkEditService` over src printed nothing).
3. The G64 row guards a preserved behaviour (one finding) whose producer changes; it passes on the unchanged tree because `checkRelationShapes` produced it there; its proof is a quoted passing run, which exists and is not quoted (Proof).
4. `core/paths.ts` `under`: needed and placed by the folder order (Proof, first finding, on the stated reason). `fs-transport.ts` `readHash`: removed because nothing imports it after edits.ts reads through `read`; D36's tree imports it only at the base line of state/client/context.ts:105, which D39 rewrites, so the merge takes D39's line. `history.ts`: inside the brief's list. `ops.ts`: carries `withheld` into the lsp-edit scope; server/files importing data/helpers is allowed. `private-folders.ts`: head comment only. `config-files.ts` `isPrivateFile`: injected through state/client/context.ts, so edits.ts gains no import. `uris.ts` `pageUri`: same folder as hub-keys.ts. Each is needed and placed by the layer rules.
5. Every reader moved together (item 5's verdict). A file over the old 256 KB limit keeps its `lsp-edit` copy: lsp-edit.test.ts '300 KB' row passes, and the builder's 30b run kept a copy for 3,156,890 bytes. `replace.ts` stays on `SAVE_MAX_BYTES`, outside the step.
6. The refusal holds by code: lsp-edit.ts:68-69 compares the real path from `resolveRootPath` against each private folder and its real path (paths.ts:38-45), so a link into `secrets` is caught; the page refuses first through `isPrivateFile`. Both case 30a rows pass. No test covers a symbolic link into `secrets`.
7. Judgment calls: (1) layout.yml and the config present.yml are indexed because their catalog entries name a `from`, which item 1's rule covers; holds. (2) Cmd+Enter is O1. (3) `map` is O2. (4) `listed`/`listedFields` is internal and matches item 6's wording. (5) the widened `lsp_edit_outside` sentence is a catalog line naming what the refusal now covers; holds. (6) unresolved values kept as candidates is internal, needed for the overlay; holds. The move of the `waiting-on` one-text finding into the schema with `listedFields` matches item 6.
8. The Doc text's test titles match the test files title for title (G66 27 rows and 6 tests, G67 6, 4 and 1 and 13 rows, G68 7 and the diff-read row, G28 10 rows and 1 test and the 2 held-unsaved tests). Two defects: the line numbers, and G67's widened sentence (Proof).
9. D36 also writes, besides the ledger's shared paths, `config/text/views/sources/search.yml` (D36 inserts after 28, D39 after 30), `config/text/views/sources/source.yml` (D36 3-55, D39 74-100) and `src/lib/data/model/index.ts` (D36 572-609, D39 94-98); the ledger's `shared_paths` omits these three. Both worktrees have identical bases for every shared file (`cmp` of D36-base and D39-base). Hunks: server/root/context.ts, D39 257 sits between D36's 249 and 275 changes and D39 327 one line after D36's insert after 324; relay.ts, D39's 18-21 insert sits two lines above D36's 24-28; state/client/context.ts hunks are apart. No hunk overlaps; the two adjacent ones in server/root/context.ts may still need a hand merge at landing. D39 does not touch glyphs.yml.
10. Sample of the history-word hits (54 lines by my grep): file-ops.ts doc ("keeps before a delete"), rename.ts:680 ("before a new key is asked for"), scan.ts head and line 862 ("before a key", "at or before it"), history.ts head (two), hub-keys.ts head (three), relay.ts head, schema-feed.ts:5 and :42 ("differs from the one before", a runtime comparison of builds), refactor-subject.ts:10, edits.ts head, compare-words.ts, references.test.ts and rename.test.ts row titles, edits.test.ts head and the case 30c title, and the DESIGN and files-and-search "still open" sentences. Each describes runtime order, runtime state or a position in text; none narrates history.

## Declined to judge

- The look (cases 1-9 selection and underline, 13, 14, 21, 23, 25, 29, 32-36): needs a page, which the task forbids starting.
- `npm run diagrams`: writes files.
- Cases 20, 42, 44, 45, 47 and 30b: judged on the builder's runs, not rerun (they need the real hub index or a running server).
- Whether a refusal at `rename` should show at the caret or as a notice: Axel's ruling (Spec 1).
- Whether to build the hint line override: Axel's ruling, a user-visible shape.

Reviewer usage: a0406e6fb11a5db2d, claude-opus-5-5, tokens, tool uses and minutes not known (not verified).

## Repair round 1, refuted

Reviewer over D39's repair round 1, on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D39, base 58c7840d9. The round's delta is the `diff -ru` of `.agents/worktrees/D39-round0/tools/oculus` against `.agents/worktrees/D39/tools/oculus`: 26 files (24 changed, plus the new `tests/server/machine/yaml/hub-keys.test.ts` and `tests/ui/controls/editor/lsp-transport.test.ts`). I read it against the whole diff since the base.

```
$ npm run test:quick -- --base 58c7840d9        (from tools/oculus, node v24.21.0; exit 0)
test:quick: 98 changed file(s), from git since 58c7840d9
test:quick: 127 test file(s), 10 essential
ok      ASCII gate (0.4 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (16.1 s)
ok      eslint (23.4 s)
ok      svelte-check (32.1 s): 1791501491458 COMPLETED 437 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (60.5 s): Duration  43.57s (transform 80.37s, setup 0ms, import 100.34s, tests 64.03s, environment 385ms)
test:quick: 61.0 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npm run test:checks                            (exit 0)
 Test Files  17 passed (17)
      Tests  248 passed (248)
   Duration  181.94s (transform 15.62s, setup 0ms, import 58.45s, tests 233.81s, environment 3ms)

Scoped files, each `npx vitest run <file> --reporter=dot` alone, every exit 0:
tests/data/snapshot/references.test.ts           Tests 33 passed (33)
tests/data/snapshot/rename.test.ts               Tests 25 passed (25)
tests/state/system/refactor-preview.test.ts      Tests 7 passed (7)
tests/server/machine/yaml/hub-keys.test.ts       Tests 11 passed (11)
tests/ui/controls/editor/lsp-transport.test.ts   Tests 6 passed (6)
tests/routes/replace/lsp-edit.test.ts            Tests 11 passed (11)
tests/routes/replace/replace-undo.test.ts        Tests 2 passed (2)
tests/state/system/lsp/edits.test.ts             Tests 9 passed (9)
tests/server/machine/lsp/relay.test.ts           Tests 5 passed (5)
tests/server/machine/lsp/lifetime.test.ts        Tests 26 passed (26)
tests/server/machine/lsp/versions.test.ts        Tests 2 passed (2)
tests/server/machine/lsp/servers.test.ts         Tests 6 passed (6)
tests/server/machine/lsp/uris.test.ts            Tests 29 passed (29)
tests/server/machine/lsp/library.test.ts         Tests 36 passed (36)
tests/data/snapshot/schema-rules.test.ts         Tests 7 passed (7)
tests/data/snapshot/relation-shapes.test.ts      Tests 9 passed (9)
tests/checks/config/config.test.ts               Tests 31 passed (31)
tests/checks/config/config-folder.test.ts        Tests 25 passed (25)
tests/data/sources/config/catalog/options.test.ts Tests 3 passed (3)
tests/checks/config/integrity.test.ts            Tests 8 passed (8)
tests/views/sources/repositories/diff/diff-read.test.ts Tests 4 passed (4)
tests/data/sources/present.test.ts               Tests 4 passed (4)
tests/data/helpers/hub-names.test.ts             Tests 11 passed (11)
tests/state/client/held-unsaved.test.ts          Tests 3 passed (3)
tests/state/sessions/source.test.ts              Tests 25 passed (25)

ASCII gate (perl form of agents/spec.md over src tests config, ! -name local.yml): printed nothing, exit=0
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/*.md ../../docs/DATA-MAP.md: printed nothing, exit=1
sh utils/folder-check.sh: printed nothing, exit=0
wc -l of the changed sources, largest: relay.ts 880, transport.ts 874, repositories.ts 863, ops.ts 857,
  state/client/context.ts 840, server/root/context.ts 811, servers.ts 793, source.svelte.ts 742, client.ts 732
wc -l components: Diff.svelte 520, References.svelte 493, RefactorPreview.svelte 266
sh utils/unused-exports.sh: exit 0, 364 lines; base unused-exports.txt 364 lines; diff of the sorted lists exit 0
python3 yaml.safe_load of the 6 changed .yml: "yaml ok 6", exit 0
grep -n "no formatting and no rename" docs/files-and-search.md: exit 1
grep -n "Audit, `collections`" ../../docs/DATA-MAP.md: only the link rows 285, 291, 292, 293
grep -rn no_waiting_on src config tests docs --exclude=local.yml: exit 1
History-words grep over the round's added lines and the two new test files: 7 hits (DESIGN.md:576 "before the post",
  files-and-search.md "before the box opens", rename.ts:18 "before a new key", edits.ts:157 "posted before",
  edits.ts:161 "no longer matches", edits.test.ts:231 "no longer holds", lsp-transport.test.ts "still pending").
  Each one describes the order or state of the running feature, and none is history.
git status --short (worktree, outside .scratch): "?? tools/oculus/tests/server/machine/yaml/" and
  "?? tools/oculus/tests/ui/controls/editor/lsp-transport.test.ts" (both untracked; the landing's wip commit must take them)

The builder's unchanged-tree claim, rerun in its copy $S/r0/oculus (its src and config are identical to D39-round0
by diff -rq; the four test files are the final ones, except type-only edits in two of them):
$ npx vitest run tests/data/snapshot/rename.test.ts tests/server/machine/yaml/hub-keys.test.ts \
    tests/ui/controls/editor/lsp-transport.test.ts tests/state/system/lsp/edits.test.ts      (exit 1)
 Test Files  4 failed (4)
      Tests  30 failed | 21 passed (51)
  e.g. "refuses a person key that a reference also names as a project, from its definition"
       AssertionError: expected null to be 'beta is a key of more than one source...'
       "refuses a rename when a file is open in a tab of another window, at prepareRename"
       AssertionError: expected null to be 'registries/venues.yml is open in a ta...'
  This reproduces the report's section 3.
The relation-shapes passing run on the unchanged tree: $S/d39/firstrun-final.txt:73-75 reads
  "=== tests/data/snapshot/relation-shapes.test.ts / Test Files 1 passed (1) / Tests 9 passed (9)", as quoted.
  I did not rerun it, because the base copy has no node_modules.
grep -c "when it planned the edit" DESIGN.md: 1
Report claim "`awk 'length($0)>100'` over the edited files printed nothing": my run prints 11 lines
  (renames.ts:42, an eslint directive from round 0; the rest are test-title strings in rename.test.ts,
  edits.test.ts and lsp-transport.test.ts). None of them is a comment the round rewrapped, and the
  comment-width check passes inside test:checks. No decision rests on the claim.
```

`npm run diagrams` was not run, because it writes files. The builder's second full-list run printed 42.2 s against my 61.0 s for the same list. The round brief left the time limit out of the round ("Not sent"), and I record the difference only.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1, the reference index: holds. G66, 33 passed. The round changed only comments here (`model.ts`, `scan.ts`, the catalog's `references.ts`).
- 2, the relay hook and capabilities: holds. relay 5, servers 6 and lifetime 26 passed. `relay.ts` is at 880. That is at the limit of spec.md's "at or under 880", and item 2's own words ask for "under 880" (points, 1).
- 3, the rename and its refusals: holds. The definition-side two-source refusal is `sharedSources` (`rename.ts:48`). The rename.test.ts row "a person key that a reference also names as a project, started at its definition" and the hub-keys.test.ts row both pass and failed on the unchanged tree. This closes Behaviour 1 of the first review.
- 4, the page's refusals, preview key and preview: holds under Z741. Refusals that need no new key are given at `prepareRename` and the transport rejects them for the caret. Refusals that need the new key are given at `rename` as the notice `lsp_edit_refused`. Both are proven by lsp-transport.test.ts (6 passed). This closes Spec 1.
- 5, the copy limit and the private folders: holds. The page now refuses a closed file over the limit or not text with sentences of its own (`edits.ts:327-332`). This closes Behaviour 3.
- 6, the schema references: holds (relation-shapes 9 passed).
- 7, the whole key selected: holds by reading. The round did not change it, and the look decides it.
- 8, the documents: holds. `DESIGN.md:576` now says "the bytes the page read when it planned the edit". The Rename bullet, `docs/files-and-search.md`'s refusal paragraph and the `hub-keys.ts` head comment state the split. This closes Standards 3 and 4. The one false clause left is in `answers.ts`'s head comment (Standards 2 below).
- 9, the tests: holds. Every file passes, with the Standards findings 1 and 4 below on the round's new test files.
- 10, `sameDiskFile`/`diskPath`: holds (hub-names 11 and held-unsaved 3 passed). The round did not change it.

Cases, over the whole diff:

- 1-9, 9a, 9b, 10, 11, 15-18, 38-41, 43: met, from the G66 rows and the builder's runs, as in the first review. The round did not change them.
- 12, 13, 14, 19, 20, 42, 44, 45, 47: met, as in the first review. The round did not change them, and they were not rerun.
- 21, 22, 24: met (G67 rows).
- 23: met under Z741. The prepare-time refusals are in the hub-keys.test.ts and rename.test.ts `prepare` rows. The rename-time refusals are in the `rename` rows and the lsp-transport notice rows. Where each shows on the page is the look.
- 25: met (lsp-transport "rejects prepareRename with the catalog sentence when the server gave no range").
- 26-30, 30a, 30b, 30c, 31-33: met, as in the first review. The edits.test.ts rows pass.
- 34-36: met by reading. The look decides them.
- 37: met. An empty refusal message now shows `lsp_rename_refused_empty`, "The language server refused this rename and gave no reason.", which has no placeholder. This closes Behaviour 2 (see Proof 4).
- 46, 48: met, as in the first review.

The round brief's items:

- R1, refusals given where they depend: holds. `refusalOfKey` answers `prepareRename`, and `rename` runs `heldBack` and then `planRename`, which runs `refuseRename` again (`hub-keys.ts:203-240`). The head comment says which refusal shows where. Every moved check has a hub-keys.test.ts row that failed on the unchanged tree with "expected null to be ...". Three findings concern it: Standards 3 (duplicated rules), Standards 5 (a private-folder branch nothing can reach) and Behaviour 1 (the order of the refusals).
- R2, a key shared by two sources, from its definition: holds (rows above, `sharedSources`).
- R3, a refusal with no words: holds. The sentence is word for word in `source.yml`, and `renames.ts:59-61` and `transport.ts:641` use it. See Proof 4 on what the test covers.
- R4, a closed file the page cannot read whole: holds. `context.ts:575-580` returns `'too_large'` or `'not_text'`. `edits.ts:327-332` refuses with `lsp_edit_too_large` and `lsp_edit_not_text`, word for word. The edits.test.ts row failed on the unchanged tree with a TypeError at `lineStarts`. The report states that the hash of a closed file is read at the plan.
- R5, comments: holds. The doc comments of `model.ts:88-92` are one per declaration. The stale doc comment of `references.ts` is gone. The paragraphs of `scan.ts`, `diff-read.ts` and `edits.ts` are rewrapped with no short line inside a sentence.
- R6, `DESIGN.md:576`: holds.
- R7, the report: violated, Proof 1 and Proof 2.

### 1. Spec

- None of the builder's changes goes beyond the round brief, apart from what Standards 3 and 5 name.

### 2. Proof

- Proof 1. `agents/reviews/D39-report.md`, section 7, "Ruling O1", "Where an override goes": "The diff editor's `createDiffEditor` at `diff/DiffEditor.svelte:187` takes no such argument."
  - What is wrong: `createDiffEditor(domElement, options, override)` takes the same third argument and calls `StandaloneServices.initialize(override || {})` (`node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneEditor.js:87-89`, beside `create` at :43-45). So the override can be passed by whichever editor a page creates first, the diff editor included.
  - The decision that rests on it: Axel's ruling on whether the hint line is built. The rest of that look matches Monaco (`renameWidget.js:174`, `:254`; `renameWidget.css` `.rename-label`; `rename.js:249-251`, `:457-461`; `bulkEditService.js:9`; `standaloneServices.js:513-520`; `client.ts:311-322`).
  - Failure scenario: Axel reads that a page whose first editor is a diff (a Changes view restored before any source tab) cannot carry the override, and he weighs the hint line as harder or partial when it is not.
  - Verdict: R7 violated. Fix at landing: correct the sentence in the report.
- Proof 2. `agents/reviews/D39-report.md`, section 6: "G66, G68, G2, G8, G9, G28, G64: the Test and Code lines given in the first report stand unchanged by this round", and "the G66 and G68 sentences of the first report are unchanged by this round".
  - What is wrong: the round brief says "Rewrite the report whole". The rewritten report on disk (`tools/oculus/.scratch/migration/agents/reviews/D39-report.md`, line 229) no longer holds the Doc text it points to. That text is G66's and G68's widened sentences under open item 15 (a), and the Test and Code lines of G2, G8, G9, G28 and G64, which the orchestrator writes into `agents/guarded.md` at landing.
  - Not verified: whether the first report survives in git. The main checkout's copy is the rewritten one.
  - Also, the DONE table's rows give summaries ("`lsp-transport.test.ts` 6 passed") where the round brief asked for the lines quoted whole. Only the full-list block is verbatim.
  - Failure scenario: at landing the orchestrator has no Doc text for seven entries and writes them from memory or leaves them.
  - Verdict: R7 violated. Fix at landing: recover the first report's section 6 and merge it with this one.
- Proof 3. `agents/reviews/D39-report.md`, section 6, "G9 Test line gains: `tests/state/system/lsp/edits.test.ts`, 'names a closed file the page cannot read for the edit, and posts nothing' (the over-the-limit half)". The same test is listed under G67's Test line.
  - What is wrong: `agents/guarded.md`'s head says "A test exists only as the test of one entry". G9 guarantees a logged write, its undo, the history copy and the atomic rename. Its Code line names server files only, and a page-side refusal before any post proves none of those.
  - The row also does not fit G67. It renames `hub/sub/b.py` for any server, so it is no hub-key rename. G67's widened sentence takes in two guarantees of every server for the same reason: "A server's refusal with no words shows the catalog's sentence for it" and "a closed file the page cannot read whole is refused". The entry's subject is "Renaming a hub key".
  - G67's Code line gains `held/answers.ts`, but no G67 test runs `answers.ts`. `hub-keys.test.ts` builds its own `PageView` with stub `read` and `heldElsewhere`. So the strict UTF-8 read and the `heldElsewhere` closure added this round run in no test, and the row title "refuses a rename when a file cannot be read as text" stands over a stub that returns null.
  - Failure scenario: the orchestrator writes the Doc text as given. Then one test sits under two entries, and G67 claims to guard `answers.ts` with no test that runs it.
  - Verdict: none. The orchestrator places the row under one entry (G2/G8's page test file is where the page plan's refusals already sit), and drops `answers.ts` from G67's Code line or names it untested.
- Proof 4. `tests/ui/controls/editor/lsp-transport.test.ts:37`: "words: (key, ...words) => fillPlaceholders(TEXT[`source.${key}`] ?? key, words)".
  - What is wrong: the host stand-in looks the key up in the catalog directly. The page's `words` is `noticeWords` (`views/sources/source/language/lsp.ts:115-124`), which resolves a key only when it is in `LSP_EDIT_NOTICES`. So the rows pass whether or not `lsp_rename_refused_empty` is in that list (it is, `text-edits.ts:227`). Line 103, `expect(EMPTY).not.toMatch(/[{}]/)`, asserts over the test's own constant, which spec.md says is not written.
  - Failure scenario: a later edit takes the key out of `LSP_EDIT_NOTICES`. The page then shows the bare key "lsp_rename_refused_empty", and this test stays green.
  - Verdict: none. Fix at landing: delete line 103. Building the host's `words` through the page's map would cover the rest.

### 3. Standards

- Standards 1. `tests/ui/controls/editor/lsp-transport.test.ts:75` and `:151`: "await new Promise((done) => setTimeout(done, 5));".
  - What is wrong: `agents/spec.md` ("What every package obeys") says "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin". `endOf` also reads "pending" or "resolved" from whether the promise settled within those 5 ms.
  - Failure scenario: a reader copies the pattern into a test whose answer arrives through a macrotask, and the row turns flaky under the six suites that run at once on this machine.
  - Verdict: none. Fix at landing: await the request's own settlement (`await expect(sent).rejects.toBe(...)`, `.resolves`), and use a flushed microtask queue for the notice rows.
- Standards 2. `src/lib/server/machine/lsp/held/answers.ts:29` and `:40`: "const STRICT = new TextDecoder('utf-8', { fatal: true });" ... "return { text: STRICT.decode(readFileSync(real)) };". The head comment at :6-7 says "only when its bytes are UTF-8 text throughout".
  - What is wrong: the tree has one definition of "UTF-8 text throughout", `isWholeText` (`data/helpers/files/text-kind.ts:61-70`: no NUL byte, and a fatal decode after a BOM). Its head comment says both layers import it, and the page's draft, `lsp-edit.ts` and `server/files/source.ts` use it. `answers.ts` adds a second rule that accepts a NUL byte, so its head comment is false for such a file (agents/spec.md, "The principles": a rule exists once and is reused).
  - Failure scenario: a hub YAML file that holds a NUL byte passes `prepareRename` and the box opens. After Enter the page refuses it with `lsp_edit_not_text`, which the rule meant to say at the caret.
  - Verdict: none. Fix at landing: read the bytes, refuse with `isWholeText`, then decode.
- Standards 3. Two copies of rules that already exist:
  - `src/lib/server/machine/lsp/held/answers.ts:81-86`: "heldElsewhere: (real) => { const wanted = normal(real); for (const other of answering.pages()) { if (other !== page && other.tabs.has(wanted)) return true; } ...". This repeats the rule of `heldElsewhere` in `held/elsewhere.ts:27-38`.
  - `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:206-213` builds `named` from the targets and `referencesTo` and walks `graph.index.files`. That repeats `namedScans` in `rename.ts:61-68`, which the round wrote and did not export.
  - What is wrong: agents/spec.md, "The principles": "a parser, a fold or a rule exists once and is reused".
  - Failure scenario: a later change to how another page's tab is matched, or to which files a rename edits, reaches one copy. Prepare and the page plan then disagree on which file is held elsewhere, and `heldBack` and `planRename` disagree on which files are named.
  - Verdict: none. Fix at landing: export a per-path predicate from `elsewhere.ts` and `namedScans` from `rename.ts`, and use them.
- Standards 4. The new `tests/server/machine/yaml/hub-keys.test.ts` tests `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts`.
  - What is wrong:
    - The concern lives in `tests/server/machine/lsp/`, which is full at ten. agents/spec.md says a full folder "is split into folders named for what they hold, and a new file goes where its concern already lives". This adds a sibling `yaml` folder that reads as a machine feature of its own, and fills `tests/server/machine` to ten.
    - The two new test files are not in the brief's "Paths this step writes", and the round brief names neither. The report's file list does not mark them as outside the write list with the reason (agents/spec.md, "Where you work").
  - Failure scenario: a reader looking for the relay's YAML entry tests in `tests/server/machine/lsp/` does not find them, and the next step that needs a folder in `tests/server/machine` finds it full.
  - Verdict: none. The orchestrator decides at landing (split `tests/server/machine/lsp/` with an `adapters/` folder, or keep it).
- Standards 5. `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:214`: "if (isPrivateFile(real, view.roots)) return { code: 'private', file: scan.file.path };". Its rows are `tests/server/machine/yaml/hub-keys.test.ts:155-160` and `:168-171`, with `extra: { 'secrets/leak.yml': 'venue_id: jbhi\n' }`.
  - What is wrong:
    - No real index can hold a scan under the private folders. The index never reads them (item 1, G3), and `overlay` only replaces scans the index already holds (`lookup.ts:55-70`).
    - The rows prove the branch over a state that was built by hand.
    - The round brief's premise was "move to the prepare answer every check of `planRename` that reads no new name (... a file in a private folder, a file with unsaved text in another window ...)". It does not reproduce: `grep -n "private\|secrets\|elsewhere"` over round 0's `rename.ts` and `hub-keys.ts` prints nothing, so those checks lived in the page plan (`edits.ts` `withheld`, `askHeld`) and the route. The report does not quote that premise as false (agents/spec.md, "Report").
    - The other-window check is a new, reachable early refusal. The private-folder one is code for an input that cannot happen, and a wrong answer there costs nothing, since the page plan and `lsp-edit` refuse such a file (agents/spec.md test rule; refute "Standards", code larger than its job).
  - Failure scenario: a reader takes the rows as evidence that the relay guards the private folders, when the guards that act are G2's.
  - Verdict: none. The orchestrator decides at landing: keep it as a stated defence, or remove the branch and its two rows.

### 4. Behaviour

- Behaviour 1. `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:221-224`: "return heldBack(asked, view) ?? refuseRename(graph, hit, (scan) => textOf(scan, view));".
  - What is wrong: `heldBack` runs before the refusals of the key itself (`project`, `vocab`, `twice`, `sources`). The report does not state this order.
  - Failure scenario: F2 on `hccnet-fl` in a `related` list while another window has open a manifest that names it. The caret shows "... is open in a tab of another window, so the language server's edit was not made.". The reader closes that tab, presses F2 again and only then learns that a project id is renamed through Files.
  - Verdict: none. Fix at landing: run `refuseRename`'s key checks before `heldBack`, or report the order as chosen.

### The points named in the dispatch

1. `relay.ts` at exactly 880. The round's one line, `pages: () => this.#pages.values()` in `#givenBy`, is needed: `heldElsewhere` must see the other pages, and only the relay holds them. Reusing `elsewhere.ts` (Standards 3) would still need that line. The file is at spec.md's limit, while item 2's words say "under 880". D36's edit of `relay.ts` keeps its line count: base 852, main 852 (`wc -l`). So the merged file is 880, and any line added at landing forces the split item 2 asks for.
2. The strict read in `held/answers.ts`. `readText` has one caller, `PageView.read`, whose only caller is `textOf` in `hub-keys.ts:199` (`grep -rn` over `src`). Another caller sees no change. A file that read before and is now `unread` is one whose bytes are not valid UTF-8. Before the round it decoded with U+FFFD and was refused only at the page plan (`notText`); now it is refused at `prepareRename` as "could not be read". The default `TextDecoder` strips a leading BOM where `readFileSync(..., 'utf8')` kept it, and `planRename` applies `withoutMark` first (`rename.ts`, `applyTextEdits(withoutMark(held.text), edits)`), so the edits do not change. None of the 155 hub and engine YAML files the index reads is affected: a Python decode prints "not utf8: [] ; nul: [] ; bom: []". The rule's mismatch with `isWholeText` is Standards 2.
3. The private-folder check and the `secrets/leak.yml` row prove only a state built by hand (Standards 5).
4. G67's widened sentence matches the code and the test titles for every refusal it lists: prepare-time `unparsed`, `project`, `vocab`, `twice`, `large`, `unread`, private, elsewhere and `sources` from a reference and from the definition; rename-time `empty`, `exists` and `readback`. Its last sentence is not about renaming a hub key, and the G9 addition fits neither G9 nor the one-entry rule (Proof 3).
5. `lsp_edit_too_large`'s `{1}` reads 5: `String(WRITE_MAX_MEGABYTES)` at `edits.ts:329`, and `WRITE_MAX_MEGABYTES = WRITE_MAX_BYTES / (1024 * 1024)` at `file-ops.ts:41`. `hub-keys.ts`'s `rename_large` uses the same constant, so both stay tied to `WRITE_MAX_BYTES`. The edits.test.ts row asserts `['hub/sub/b.py', '5']`.
6. The diagram labels, "state to data" 285 to 286 and "folder state/system to layer data" 54 to 55, come from `state/system/machine/lsp/edits.ts` importing the value `WRITE_MAX_MEGABYTES` from `data/file-ops.ts`; it had only a type import from there before. State importing data is allowed by DESIGN.md's layers, and `boundaries.test.ts` passes inside test:checks (248 of 248). The import is placed by the layer rules.
7. The merge with D36 (5ed0bc24c). I listed its files with `git show --name-only --format= 5ed0bc24c` (read-only) and read the hunks by diffing the D39-base copy against main and against the worktree.
   - Files both steps change (20): `DESIGN.md`, `HELP.md`, `docs/views.md`, `docs/files-and-search.md`, `config/text/views/sources/search.yml`, `config/text/views/sources/source.yml`, `src/lib/data/model/index.ts`, `src/lib/server/machine/lsp/relay.ts`, `src/lib/server/root/context.ts`, `src/lib/state/client/context.ts`, and ten diagram files (`channels`, `layer-server`, `layer-state`, `layer-views`, `layers`, each `.dot` and `.svg`).
   - Hunks that touch the same lines, which the ledger's `shared_paths` does not list:
     - `DESIGN.md:575`, the one-line language-servers paragraph. D36 adds "the ChkTeX findings of a LaTeX tab come from the ChkTeX linter", and D39 adds the hub-keys sentence. `shared_paths` names D36's 23, 166 and 476 only; D36 also changed 185 and 575.
     - `docs/files-and-search.md:85`, the one-line paragraph. D36 adds "(the linter below does)"; D39 rewrites four other sentences.
     - Both steps insert a new section right after `docs/files-and-search.md:86`.
     Each is a textual conflict at the cherry-pick, resolved by keeping both sides.
   - Every other shared hunk is one or more unchanged lines apart:
     - `server/root/context.ts`: D39 257 and D36 249 and 269; D39 327 and D36's insert after 325, one unchanged line apart.
     - `state/client/context.ts`: D39 219-228, 463, 565-591 and 810; D36 225, 436, 455, 597-610, 653 and 813.
     - `relay.ts`: D39 18-22, 45, 68, 494-499 and 547-562; D36 24-28.
     - `HELP.md`: D39 81 and 116; D36 118.
     - `docs/views.md`: D39 69 and 253; D36 81.
     - `search.yml`: D39 1, after 30 and after 151; D36 after 28.
     - `source.yml`: D39 74-103; D36 after 2 and after 22.
     - `data/model/index.ts`: D39 94-98; D36 572-609.
   - No D39 hunk's meaning depends on code D36 changed:
     - D39 drops the `readHash` import, and main has no other importer of it (`grep -rn readHash tools/oculus/src` prints `fs-transport.ts:432` and `context.ts:105` only).
     - D36's lint fixes edit the tab model directly (`lint-fixes.ts`) and do not go through `lspEdits.apply`, whose contract D39 changes.
     - Nothing on main imports `under` from `library/rules.ts` except `machine-file.ts`, which D39 rewrites. `withheldFolders`, which main's `server/root/context.ts:81` imports, is still exported by D39's `rules.ts:40`.
   - Folder counts after the merge: `state/system/machine` is 8 (main 7 with `lint`, plus `refactor`), and `tests/server/machine` is 10. The merged `state/client/context.ts` is about 856 lines and `server/root/context.ts` about 840 (base 821 and 810 plus both steps' additions).

### Declined to judge

- The look (cases 1-9 underline and selection, 13, 14, 21, 23 and 25 at the caret and as notices, 29, 32-36): it needs a page, which the task forbids.
- `npm run diagrams`: it writes files.
- The relation-shapes run on the unchanged tree: the base copy has no `node_modules`. I read the builder's quoted file instead.
- Cases 20, 30b, 42, 44, 45, 47: these are the builder's runs from the first build, carried unchanged. They need the real hub index or a running server.
- Whether to build the rename box's hint line: Axel's ruling.
- Whether the relay keeps the private-folder branch (Standards 5) and where the new hub-keys test lives (Standards 4): the orchestrator's call at landing.

Reviewer usage: agent id not known to the reviewer; served model claude-opus-5-5, per the session's own model line; tokens, tool uses and minutes not known (not verified).

### Closed (at landing)

- Proof 1: fixed at landing. The sentence in `agents/reviews/D39-report.md`, section 7, now says `createDiffEditor` takes the same third argument, so the override can be passed by whichever editor the page creates first. Whether to build the hint line is open item 22.
- Proof 2: fixed at landing. The first report's section 6 is carried whole into `agents/reviews/D39-report.md` section 6, and every Test and Code line it names is written into `agents/guarded.md` (G2, G8, G9, G13, G28, G64, G66, G67, G68).
- Proof 3: closed at landing. The edits.test.ts row 'names a closed file the page cannot read for the edit, and posts nothing' stands under G67 alone, whose widened sentence names that refusal; G9 does not take it. `held/answers.ts` is not in G67's Code line.
- Proof 4: fixed at landing. `views/sources/source/language/notice-words.ts` now holds the page's `noticeWords`, which `lsp.ts` imports and `tests/ui/controls/editor/lsp-transport.test.ts` uses as the host's `words` over the checkout's catalog, so a refusal key the page does not word fails the test; line 103 is deleted; `tests/checks/source/keys.test.ts` names the new file for the `LSP_EDIT_NOTICES` keys.
- Standards 1: fixed at landing. `endOf` awaits the request's settlement, and the rename rows await the transport's delivery to the editor, a promise the rig resolves from its listener; no `setTimeout` is left in the file.
- Standards 2: fixed at landing. `held/answers.ts`'s `readText` reads the bytes, refuses with `isWholeText` and decodes; the strict decoder is gone. The catalog sentence `rename_unread` now reads "{0} could not be read as UTF-8 text, so nothing was renamed.", and `docs/files-and-search.md` says the same.
- Standards 3: fixed at landing. `rename.ts` exports `namedScans`, which `hub-keys.ts`'s `heldBack` uses; `held/elsewhere.ts` exports `isHeldElsewhere`, which its own `heldElsewhere` and `answers.ts` use.
- Standards 4: decided at landing. `tests/server/machine/lsp/adapters/` holds the adapters' tests, `hub-keys.test.ts` and `cpp-file.test.ts` (moved from `tests/server/machine/lsp/`), mirroring `src/lib/server/machine/lsp/adapters/`; `tests/server/machine` is back to 9 entries and `tests/server/machine/lsp` holds 10. G13's Test line names the new path.
- Standards 5: decided at landing, the branch removed. No index holds a file under a private folder, so `heldBack`'s private-folder branch, the `private` refusal and its two rows are gone; the head comments of `hub-keys.ts` and `rename.test.ts` and the guide's paragraph no longer name a private folder for a hub-key rename. The guards that act on a private file are G2's.
- Behaviour 1: fixed at landing. `refusalOfKey` runs `refuseRename` first and `heldBack` after it, and `rename` makes the same checks in the same order; the row 'refuses a project id for what it is when another window holds a file that names it' covers it, and the guide says the key's own reasons come first.
- The relay at 880 lines: unchanged by the landing.
