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
