Everything in the brief is done. Three things differ from the brief's text and are named under "Where the brief was wrong or differed": the pure cases are in a new untagged file because `yaml-edit.test.ts` is tagged slow and `npm test` skips it; four files outside the path list were touched (a fixture, a test file's helpers, one allow-list line, two assertions); `History.svelte` is at another path than the brief cites.

## Open items (state file, verbatim)

- Z112 (raised 2026-09-30 21:35, step E3 "the apps section's text to Z103 (b), Z106 (a) and Z107 (b2)", its review, finding Spec 4; E3 is in repair round 1 without it, and the sentence is added at landing from the ruling). The section (DESIGN.md:315 in E3's worktree) makes `open({ file })` check the file's real path (outside the root, inside oculus's own `config/` folder, the segment rule and `closed_paths`) and then whether it exists, but the bridge's `open` reaches the page's tab opener, and the page cannot see a real path. The only server route on that path is the source route (`GET /api/source`, `src/lib/server/files/source.ts:100-113`), which knows nothing of apps. So a builder either checks the given path in the page, and `creds/key` with `creds` a link to `.secrets` opens, or invents a route nobody ruled on. Which server step does the checks is a wire shape.
  - (a) A new route `GET /api/app-open?app=<key>&root=<key>&path=<path>` answering `{ result: "ok" | "closed" | "missing" }`, called by the page before it opens the tab. For: it sits beside `GET /api/app-store` (Z106 (a)) under the same origin and token rules; the server knows the app, so the root-app rule and the order of checks run in one place; the source route and the file browser are unchanged. Against: one more route.
  - (b) The source route takes an optional `app=<key>`; with it the server applies the app rules and answers 403 `closed` or 404 `missing`, without it the route is as today. For: no new route. Against: the file browser's route gains an app branch, and one route then answers to two callers with different rules.
  - (c) The file route applies `closed_paths` and the config-folder rule to every read, apps or not. For: nothing app-specific on the server. Against: Axel's own opening of a `secrets/` file from the file browser is closed too, which changes what he can open today.
  - Recommendation: (a). It keeps every app rule in one server step beside the store route, leaves the routes the file browser uses as they are, and the answer the page gets is exactly the three results the section names. The lazy option is leaving the checks in the page on the given path, which breaks Z107 (b2) through a link and is not offered.

## The cases on the unchanged tree (first run)

Each case was written as a test in the form it has after the change and run with `npx vitest run tests/routes/edit/undo-removed.test.ts` and `npx vitest run tests/server/edit/yaml-edit-removed.test.ts` over the unchanged `src`. The expected result of every case was also computed beforehand by running the brief's rules over its text (a copy of `yaml-edit.ts` with the change, outside the worktree); every case came out as the brief states it, so no case was handed back. The measured `removed` entries of case 18 are the ones the brief lists (offsets 10, 27, 10, 10, 20, and 10/19 for two fields), with `next` as `status:`, `next: go`, `next: go`, `next: go`, `chips: [a] }` and `next: go`/empty. Two more were measured: `status.chips` of a flow map gives `{ offset: 29, text: ', chips: [a]', next: ' }' }`, and the two block scalars of case 24 leave their blank line behind, so `next` is empty for both.

| Case | Test (file: test name) | First run on the unchanged tree |
|---|---|---|
| 1 | undo-removed: gives a title back with its quotes and its comment | fails: `title: A title` appended after the status map, no quotes, no comment (`- title: "A title"  # the name` / `+ title: A title`) |
| 2 | undo-removed: gives a status line back as the only child of its map | fails: the text differs from `MANIFEST` (a `status:` block re-created at the end) |
| 3 | undo-removed: gives a block list back in the block style | fails: `- related:\n-   - a\n-   - b` / `+ related: [a, b]` moved below `next: go` |
| 4 | undo-removed: gives a group cleared whole back | fails: `expected 400 to be 200` (`refused`, "the field is a group") |
| 5 | undo-removed: gives a key of a flow map back inside its line | fails: `- status: { line: "x", chips: [a] }` / `+ status: { chips: [a], line: x }` |
| 6 | undo-removed: gives two fields of one write back in either order of the undos | fails: the text is `id: alpha\ntype: manuscript\nnext: go\ntitle: T...` not the held text (first order) |
| 7 | undo-removed: gives two neighbouring fields back exactly when the upper one is undone first | fails: same kind, the upper-first text differs from the held text |
| 8 | undo-removed: finds the place again after a line above it was rewritten | fails: title appended at the end |
| 9 | undo-removed: finds the place again after the same write changed a field above it | fails: short appended at the end |
| 10 | undo-removed: writes the value into the map that has come back when no place keeps one status | passes (as the brief states: the value write of today) |
| 11 | undo-removed: puts the lines at the nearest line start when the line that followed was edited | fails: `+ title: A title` at the end |
| 12 | undo-removed: puts the lines before the occurrence of the following line nearest where they stood | fails: title appended at the end |
| 13 | undo-removed: appends the value as before when the record has no removed lines | passes (today's behaviour, kept) |
| 14 | undo-removed: writes the value as before when removed is ... (ten tests, one per variant) | pass (today's behaviour, kept) |
| 15 | undo-removed: puts the removal back again when the undo itself is undone | fails at the first undo (title appended at the end) |
| 16 | undo-removed: what a change record keeps of a removed field (three tests) | first fails: `expected undefined to deeply equal { offset: 27, ...(2) }`; the other two pass |
| 17 | undo-removed: finds the place again when the record stood past the end of the file | fails: title appended at the end |
| 18 | yaml-edit-removed: the removal setFields reports (six shapes, two fields, moved points) | fail: `Cannot read properties of undefined (reading 'title')` (no `removed` key) |
| 19 | yaml-edit-removed: answers the source unchanged when no place keeps the document right | fails: `insertRemoved is not a function` |
| 20 | undo-removed: keeps a key added at the end of the file since | fails: title appended before the added key's line |
| 21 | read, not a test | see below |
| 22 | undo-removed: gives a file with CRLF line ends back...; yaml-edit-removed: reports the lines of a file with CRLF line ends | fail: `expected undefined to deeply equal { offset: 11, ...(2) }`; `Cannot read properties of undefined` |
| 23 | undo-removed: gives a last line without a line break back...; yaml-edit-removed: reports a last line that has no line break | fail: `expected undefined to deeply equal { offset: 10, text: 'title: T', ...(1) }` |
| 24 | yaml-edit-removed: gives a block scalar back with the line breaks it keeps | fails: `Cannot read properties of undefined (reading 'abstract')` |
| 25 | yaml-edit-removed: gives back a list of maps cleared by an empty list, and a map cleared by an empty map | fails: `Cannot read properties of undefined (reading 'meta')` |
| 26 | undo-removed: refuses a record of a field no write may set, whatever removed says (tier, id, paths, nosuch, and type) | passes (refusal of today, kept) |
| 27 | undo-removed: gives a title with a letter outside ASCII back | fails: title appended at the end |
| 28 | yaml-edit-removed: counts the offset in UTF-16 code units...; never tries an index between the two halves of a surrogate pair | fail: `Cannot read properties of undefined` / `insertRemoved is not a function` |

Case 21 (read): `src/lib/state/sessions/changes.svelte.ts:19-31` declares the page's `Change` with `at`, `kind`, `file`, `key`, `field`, `before`, `after`, `undo` and `undoes`, no `removed`; `src/lib/views/system/history/History.svelte` draws `before` and `after` through `sides(row)` (lines 142-160) and the undo control from `row.undo` (lines 132-140). `GET /api/changes` (`src/routes/api/(git)/changes/+server.ts`) answers `readChanges`, which returns each parsed line whole. A record with `removed` is therefore listed and drawn as any other and its `removed` key is carried and not drawn. No file was changed for this case.

Case 7's lower-first text, as the brief asks to be quoted: after clearing `title` and `short` from `id: alpha\ntype: manuscript\ntitle: T\nshort: s\nnext: go\n` and undoing `short` first, then `title`, the file is `id: alpha\ntype: manuscript\nshort: s\ntitle: T\nnext: go\n`. Case 11's text, after `status:` was edited to `status:   # edited by hand`: `id: alpha\ntype: manuscript\ntitle: "A title"  # the name\nstatus:   # edited by hand\n  line: "the line"\n`.

## DONE / NOT DONE

| Item | State | Command that proves it |
|---|---|---|
| 1. `SetFieldsResult` with `removed` per field, `offset` carried to the text the write left, `next` to the end of its line | DONE | `npx vitest run tests/server/edit/yaml-edit-removed.test.ts`: 26 passed, among them the six shapes, two fields, a point moved by an edit above, a point moved to the start of a later removal's span, refused and unverified writes answer `removed: {}` |
| 2. `removed?` on `ChangeRecord`, put on the records of the fields that have an entry, on no other | DONE | `tests/routes/edit/undo-removed.test.ts`: "what a change record keeps of a removed field", three tests |
| 3. Undo order: places of `next` by distance, then every line start for whole lines, then the value; after every `writeManifest` check; malformed `removed` ignored | DONE | `undo-removed.test.ts` (cases 1 to 17, 20, 22, 23, 26, 27) and `yaml-edit-removed.test.ts` "putting removed text back": 61 tests passed in the two files |
| 4. Undo of the undo | DONE | `undo-removed.test.ts`: puts the removal back again when the undo itself is undone |
| 5. The three doc sentences, head comments | DONE | `DESIGN.md:140`, `DESIGN.md:376`, `HELP.md:254` each gain the sentence; head comments of `yaml-edit.ts`, `manifest.ts`, `undo.ts` and `changes.ts` name the lines kept and put back |
| Verify 1: `npm run diagrams`, then `checks.sh` | DONE | quoted below |
| Verify 2 | DONE | `npx vitest run tests/routes/edit tests/server/edit --reporter=dot`: `Test Files  13 passed (13)`, `Tests  365 passed (365)` |
| Verify 3: name grep | DONE | quoted below |
| Verify 4: `DESIGN.md:313` citations | DONE | quoted below |
| ASCII gate | DONE | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` prints nothing; `LC_ALL=C grep -c '[^ -~]' DESIGN.md HELP.md` prints `0` for both; checks.sh's last line `! LC_ALL=C grep -rna '[^ -~]' src tests` passes |

Verify 1, the lines `checks.sh` printed (`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, after `npm run diagrams` exited 0):

```
$ npm test
 Test Files  352 passed | 19 skipped (371)
      Tests  5408 passed | 559 skipped (5967)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
COMPLETED 2476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

What this does not cover: `npm run test:slow` was not run (a step never runs it); whether `npm run diagrams` changed a file under `docs/diagrams` is not verified (no git command is run here); the time an undo takes on a large manifest (one parse per place tried) is not measured.

Verify 3, the name grep across `src`, `tests`, `config` (`--exclude=local.yml`), `HELP.md`, `DESIGN.md` and `README.md`, narrowed to what names the new shapes (`grep -rnE "insertRemoved|RemovedText|SetFieldsResult"` and `grep -rnw ChangeRecord`):

- `insertRemoved`: defined `src/lib/server/edit/yaml-edit.ts:834`, used `src/lib/server/edit/writes/manifest.ts:204`.
- `RemovedText`: defined `src/lib/server/core/changes.ts:45`, used by `yaml-edit.ts`, `writes/manifest.ts` and the two new test files.
- `SetFieldsResult`: defined `yaml-edit.ts:69`, used `writes/manifest.ts:199`. Every other caller of `setFields` is `writeManifest` (`manifest.ts:297`) and `tests/server/edit/yaml-edit*.test.ts`.
- `ChangeRecord` (used by `server/edit/writes.ts`, `feeds.ts`, `writes/entries.ts`, `writes/subtasks.ts`, `writes/rail.ts`, `writes/deck.ts`, `server/sessions/overrides.ts`, `tests/server/core/changes.test.ts`): the key is optional, so none of them changes.
- `removed` as the record key: `changes.ts:83`, `manifest.ts:314`, `undo.ts:209`; in `DESIGN.md:140`, `DESIGN.md:376` and `HELP.md:254` as prose ("removes a field", "removed text"). `src/lib/state/sessions/changes.svelte.ts` and `History.svelte` do not name it (case 21). `config/` holds no hit for the key (the `removed` hits in `config/text/...` are labels of other things).
- `writeManifest` callers: `writes.ts:274` (form), `deposit.ts:386` (deposit), `undo.ts:203`; only the undo passes the sixth argument.

Verify 4: `DESIGN.md:313` cites `writes/undo.ts:184` (`    if (change.undo === 'none') return { error: 'nothing' };`) and `writes/manifest.ts:415` (`                undo: 'none'`, the scaffolded idea's record). The two numbers were 181 and 350 and are corrected in `DESIGN.md:313`.

## User-visible changes

- History view, a manifest field cleared by the editor form, a quick-add or a link removal, then the row's Undo. View: History. State: clear a `title` that has quotes and a trailing comment, press Undo on the clear's row. Before: `title: A title` returned as a new last line without quotes or comment; a cleared `status.line` came back as a new `status:` block; a block list came back as a flow list at the end; a cleared group (`followup`) answered `refused`. After: the lines are back where they stood, byte for byte, when the line that followed them is still there; when it changed, at the nearest line start that keeps the document right; only when nothing fits, the value comes back as a new line as before. The History row itself looks the same.

## Shapes named in this step

- `removed` on a change record of `~/.oculus/changes.jsonl`: `{ offset, text, next }`. `offset` is an index into the file's text (UTF-16 code units of the text read as UTF-8) where the removed text stood in the text the write left; `text` is the characters removed, comment and parent line included; `next` is the text of the file the write left from `offset` to the end of its line, line break not included (a `\r` before the `\n` belongs to it). Only a manifest write that removed a field carries it, on that field's record; the undo's own record carries none. Alternatives considered: a line number (cannot place a flow map's child, brief decision 1); the name `at` (taken by the record's time); the whole-write diff (merges neighbouring fields). Z110 (c) names the key.
- Types: `RemovedText` in `server/core/changes.ts` (one type, used by the record, `setFields` and `insertRemoved`); `SetFieldsResult` in `yaml-edit.ts`.
- `insertRemoved(source, field, before, removed): EditResult` in `yaml-edit.ts`, refusal reason `the removed text does not fit the file`.
- `writeManifest(hub, config, id, fields, reading, removed?)`: the sixth parameter is read only with `reading === 'record'` and exactly one field.

## Judgment calls the brief did not cover (each reversible)

- A splice that ends at or before a removal's point moves it by the change in length, including an insertion at the point itself (the lines then go after the inserted text); a splice whose span holds the point moves it to the span's start; any other leaves it. A removal is recognised as a splice that put no text in and took some out (`length === 0 && to > from`).
- Two removals of one write can end at one offset (clearing `status.chips` and `status.line` of one map: both at the start of the removed `status:` block). Each entry keeps its own `text` and `next`; the route-level undo of those two was not exercised (the pure offsets are, in "moves a point to the start of a later removal that holds it").
- `points` in `setFields` is a `Map` and `removed` is built with `Object.fromEntries`, and `writeManifest` reads it with `byKey`, so a field named `__proto__` or `toString` cannot reach the prototype.
- `settable(field)` in `yaml-edit.ts` holds the `pathOf` and `READ_ONLY` checks once; `setFields` and `insertRemoved` both use it.
- An undo whose `before` already equals the file's value for the field has no place that passes (a second key), so it falls to the value write, which changes nothing and answers `refused` as today.

## Where the brief was wrong or differed

1. Case 18 to 19, 22 to 25 and 28 name `tests/server/edit/yaml-edit.test.ts`, which opens with `// @module-tag slow` and is left out of `npm test` and `test:checks` (`npx vitest run --tagsFilter '!slow' tests/server/edit/yaml-edit.test.ts` answers `Test Files  1 skipped (1)`, `Tests  53 skipped (53)`). Cases there would never run in the gate. The pure cases are in a new untagged file, `tests/server/edit/yaml-edit-removed.test.ts`; `tests/server/edit` holds 9 files. Two assertions of the slow file (`yaml-edit.test.ts:353` and `:365`, `toEqual({ text, changed, refused })` over `setFields`) needed `removed: {}` because `setFields` now answers it; `npx vitest run tests/server/edit` (which includes the slow file) passes with that change.
2. Paths outside the list, each a consequence of the change: `tests/routes/edit/write-fixture.ts` now exports `hold`, `wrote`, `undone` and `recorded` (moved out of `undo.test.ts`, so the new route test file shares them; `recorded` takes an optional `removed`); `tests/routes/edit/undo.test.ts` imports them and lost the local copies (603 to 566 lines); `tests/checks/tree/allow-duplication.txt` lost its line `src/lib/server/edit/entry-edit/lines.ts src/lib/server/edit/yaml-edit.ts a4f9b3ef79e0 ...`, because the change removed that shared clone and `tests/checks/tree/duplication.test.ts` ("holds the lists to clones that are still shared") fails with the entry in place; the new route cases are in `tests/routes/edit/undo-removed.test.ts` (318 lines), as the brief allows.
3. Case 21 cites `History.svelte:96,132-138` at `src/lib/views/...`: the file is `src/lib/views/system/history/History.svelte`; `undo` is at line 96, the undo control at 132-140 and the drawing of before and after (`sides(row)`) at 142-160.

## Not changed by this step

The deposit (`src/lib/server/git/deposit.ts:386`) reads only `found` and `refused` of `writeManifest` and does not pass the new argument; an insertion reads and writes the file by rename with no lock, like every manifest write; a `before` JSON does not carry exactly (`.nan`, `.inf`, `-0`) fails the check at every place and the undo writes the value as today.

## Files changed

`src/lib/server/edit/yaml-edit.ts` (857 lines), `src/lib/server/edit/writes/manifest.ts` (419), `src/lib/server/edit/writes/undo.ts` (316), `src/lib/server/core/changes.ts` (294), `tests/routes/edit/undo-removed.test.ts` (new, 318), `tests/server/edit/yaml-edit-removed.test.ts` (new, 285), `tests/routes/edit/write-fixture.ts` (296), `tests/routes/edit/undo.test.ts` (566), `tests/server/edit/yaml-edit.test.ts` (538, two assertions), `tests/checks/tree/allow-duplication.txt` (189, one line removed), `DESIGN.md` (lines 140, 313, 376), `HELP.md` (line 254), and whatever `npm run diagrams` regenerated under `docs/diagrams`.

## Repair round 1

All seven rulings are done; the proofs of rulings 1 to 3 were seen failing on scratch copies under `$TMPDIR` (removed afterwards) and pass on the worktree.

| Ruling | State | Evidence |
|---|---|---|
| 1. Case 26 records keep lines that fit | DONE | `undo-removed.test.ts`, "refuses a record of a field no write may set, whatever removed says": each record has `next: 'id: alpha'`, `offset: 0` and lines `tier: archive\n`, `id: beta\n`, `paths:\n  doc: a.md\n`, `nosuch: x\n`, `type: idea\n`. Scratch copy with an insertion placed ahead of the schema checks in `writeManifest`: `FAIL ... refuses a record of a field no write may set, whatever removed says`, `AssertionError: expected 200 to be 400`. Worktree: passes. |
| 2. Case 14 variants keep lines that fit, and assert the value write | DONE | The object variants carry `text: 'title: "A title"\n'`, `next: ''`; each asserts `${WITHOUT}title: A title\n`. Scratch copy with `removedOf` loosened (offset taken through `Number`, empty text accepted): `x ... removed is a negative offset`, `x ... a fractional offset`, `x ... an offset written as text`, 3 failed, 7 passed; the negative offset run shows `- title: A title` / `+ title: "A title"`. Worktree: passes. The variants `empty text`, `a string`, `null`, `a list` and `text that is a number` pass under that loosening too, since a text of no characters, a non-object or a non-string text cannot be inserted by any `removedOf`; `no next` and `a next that is a number` guard the validation of `next` (they turn red when `removedOf` coerces it with `String(next ?? '')`, the round 1 refutation's probe C). All stay as the brief's cases. (Corrected at landing from the round 1 refutation, Proof 2.) |
| 3. A real tie | DONE | `yaml-edit-removed.test.ts`, "tries the earlier of two places at the same distance": text `a: 1\n# --\nx: 2\n# --\n`, offset 10, places 5 and 15, asserts `a: 1\nb: 2\n# --\nx: 2\n# --\n`. Scratch copy with `\|\| one - other` changed to `\|\| other - one` in `placesOf`: `x tries the earlier of two places at the same distance`, `expected 'a: 1\n# --\nx: 2\nb: 2\n# --\n' to be 'a: 1\nb: 2\n# --\nx: 2\n# --\n'`. Worktree: passes. |
| 4. One first-run row per test that is not a numbered case | DONE | Table below. |
| 5. Head comments | DONE | `yaml-edit.ts` head and `yaml-edit-removed.test.ts` head now say that for whole lines, when no place of `next` passes, every other line start is tried nearest first, and that text taken from inside a line tries only the places of `next`. |
| 6. "as before" | DONE | `undo-removed.test.ts:3` ("is undone by writing the value."), the test names "appends the value when the record has no removed lines" and "writes the value, not the lines, when removed is ...". `grep -n "as before\|as today"` over the two new test files, `yaml-edit.ts`, `manifest.ts`, `undo.ts` and `changes.ts` prints nothing. |
| 7. Flow-map clause in the three doc sentences | DONE | `DESIGN.md:140`, `DESIGN.md:376`, `HELP.md:254` now say whole lines go back at the nearest line start, and that "text removed from inside a line (a flow map's key) goes back only at the place of its following text, and otherwise comes back through the value write". `LC_ALL=C grep -c '[^ -~]' DESIGN.md HELP.md` prints 0 for both. |

### First run of the tests that are not numbered cases

Run in a scratch copy of the worktree with the four unchanged `src` files (`yaml-edit.ts` 720 lines, `manifest.ts` 354, `undo.ts` 305, `changes.ts` 267, taken from the tree at the base) and the current tests: `npx vitest run tests/routes/edit/undo-removed.test.ts tests/server/edit/yaml-edit-removed.test.ts`. Result: 44 failed, 17 passed.

| Test | First run on the unchanged source |
|---|---|
| yaml-edit-removed: keeps the comma before a later key of a flow map | fails: `Cannot read properties of undefined (reading 'status.chips')` |
| yaml-edit-removed: moves a point by the change in length of an edit above it | fails: `expected undefined to deeply equal { short: { offset: 37, ...(2) } }` |
| yaml-edit-removed: moves a point to the start of a later removal that holds it | fails: `expected undefined to deeply equal { 'status.chips': { ...(3) }, ...(1) }` |
| yaml-edit-removed: reports nothing for a field that was replaced or added | fails: `expected undefined to deeply equal {}` |
| yaml-edit-removed: reports only the fields that were written | fails: `Cannot convert undefined or null to object` |
| yaml-edit-removed: reports nothing for a manifest that does not parse | fails: `expected undefined to deeply equal {}` |
| yaml-edit-removed: reports nothing when the result did not verify and nothing was written | fails: `expected undefined to deeply equal {}` |
| yaml-edit-removed: tries the place of the following line nearest the recorded index first | fails: `Cannot read properties of undefined (reading 'title')` |
| yaml-edit-removed: tries the earlier of two places at the same distance | fails: `insertRemoved is not a function` |
| yaml-edit-removed: falls to the nearest line start when the following line is gone | fails: `insertRemoved is not a function` |
| yaml-edit-removed: refuses the fields a write never sets, and a name that is not a field | fails: `insertRemoved is not a function` |
| yaml-edit-removed: does not insert a key the file already holds | fails: `insertRemoved is not a function` |
| yaml-edit-removed: gives back every shape a clear takes text out in | fails: `Cannot read properties of undefined (reading 'title')` |
| undo-removed: refuses to write over a field edited since, whatever the record keeps | passes (a behaviour the change preserves) |
| undo-removed: keeps nothing for a write that changed a value or added a line | passes (preserved) |
| undo-removed: keeps nothing for the undo of a removal | passes (preserved) |
| undo-removed: refuses a group with no removed lines, or lines that fit nowhere | passes (preserved) |

The numbered cases with several tests keep their rows in the table above; their tests on the unchanged source are the failing ones listed in that run, and the passes (cases 10, 13, 14, 26) are unchanged.

### Checks

`npm run diagrams` exited 0, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`. Its first run stopped at `npm test` on `tests/ui/theme/colours.test.ts > colours every highlighter class from one stylesheet the page root imports`, `Error: Test timed out in 5000ms`, in a file this step does not change; `npx vitest run tests/ui/theme/colours.test.ts --reporter=dot` alone passed (`Test Files  1 passed (1)`, `Tests  13 passed (13)`). The script stops at the first red command, so it was run once more to reach the other six commands; its lines:

```
$ npm test
 Test Files  352 passed | 19 skipped (371)
      Tests  5408 passed | 559 skipped (5967)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
COMPLETED 2476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
