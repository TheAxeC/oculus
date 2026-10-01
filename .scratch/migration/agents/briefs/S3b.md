# Brief: S3b, the `config-key` write: one option of a tracked config file set in place, recorded and undoable

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The plan names no other standards page. No ADR folder exists (`ls tools/oculus/docs/adr` fails), so no ADR touches the step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## What is on the tree (read on main at 87d8ab6a, rechecked at c7b23fcd)

- Z94 (4) (b), Axel's ruling: every `toggle`, `number`, `text` and `choice` option gets a control that writes that one key into its config file, comments kept, through one new confirmed write kind `config-key` (`{ file, key, value }`), refused for `local.yml`, for a key with no catalog entry and for a value its `control` does not allow, recorded in the History view and undoable; a `list` or a family opens its file at its line (that is S3c's). "Confirmed" is the control's Confirm before it writes, which S3c's editor draws; this step's write is the one the Confirm sends. Z121 (3) (a): the writer also refuses a value when the config readers refuse the merged config holding it, as `checkLocal` refuses a `local.yml` save (`src/lib/data/sources/config/local.ts:350`, its doc comment from `:344`), so the catalog needs no min or max.
- The options catalog is on main (S3a): `config/catalogs/options.yml`, one top-level key `options:`, a map of config file name (`appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`, `local.yml`) to a map of dotted key path to an entry `{ description, default?, section?, control?, values?, fields? }`. Its reader is `src/lib/data/sources/config/options.ts`; a path is built by `optionPaths` (`options.ts:68-79`). A count over the catalog with `yaml.safe_load` gives these key depths: one segment 59 entries, two 49, three 16; and these controls: `text` 35, `number` 34, none 37 (the 21 families and the 16 `local.yml` keys), `list` 7, `choice` 6, `toggle` 5. A family is an entry with `fields:`. Over the 80 writable options in the five files: no absent key, no null, no alias, anchor, flow parent, CRLF or BOM; styles PLAIN, QUOTE_DOUBLE and QUOTE_SINGLE (11 in `present.yml`); a trailing comment on 21.
- The write endpoint is `src/lib/server/edit/writes.ts` (546 lines): each body is matched by a parser of `writes/bodies.ts`, the writer runs, and `answer(outcome, kind, into)` (`writes.ts:522`) stamps the records with the kind and appends them to the change log, `~/.oculus/changes.jsonl`. Its head comment (`:20-23`) says "writes/bodies.ts for the ten body parsers", which is already false (bodies.ts holds 20), and names no config writer. The config writes that exist are `rail` (`writes/rail.ts`, 117 lines, into `config/layout.yml`), `audit-mute` (`writes/audit-mute.ts`, into `config/behavior.yml`) and `deck` (`writes/deck.ts`): each reads the file, edits the bytes with every other line kept, reads the result back and compares it, and writes with `writeTextAtomic` (`src/lib/server/core/json.ts:47`); `rail` (`rail.ts:112-116`) and `deck` (`deck.ts:106-113`) return `records: [{ file, key, field, before, after, undo: 'field' }]`, and `audit-mute` (`audit-mute.ts:90`) returns no records. `WriteTarget` (`writes.ts:87-124`, doc comment from `:78`) carries `engine`, `behaviorFile` and `layoutFile`; `target()` (`writes.ts:199-225`) builds `config` from the merged config read before the request and calls `changesKeep(merged)` (`:221`), so while `changes.keep` is refused every write answers an error before any writer runs. Undo is `writes/undo.ts`: `valueNow` (the rail branch at `:128`) reads what the file holds now, `undoChange` answers `gone` when it is not found and `moved` when it is not `change.after` (`:186-187`), and `apply` (`:198`, the rail branch at `:240`) writes `change.before` back through the same writer; a writer that wrote nothing answers `{ error: 'refused', refused }`.
- `bodies.ts:5` says `tests/routes/edit/write.test.ts` covers every parser's refusals. `tests/fixtures/kinds.ts:15-21` finds the body kinds with the regex `body\.kind !== '([a-z-]+)'` over `bodies.ts`, and `keys.test.ts` and `history.test.ts:178-190` check that each kind has its History word, so the new parser uses exactly that form. The route, change-log and undo tests live in `tests/routes/edit/` (6 items: `rail.test.ts`, `undo.test.ts`, `write.test.ts`, `write-fixture.ts` among them); `write-fixture.ts:110` and `:282` set `engine: engineDir()`, the checkout. `tests/server/edit/writes.test.ts` tests the manifest writer and is `@module-tag slow` (`:10`).
- `src/lib/server/core/changes.ts:67-71`, the `ChangeRecord.key` doc, lists what a write addresses ("a project id, an entry identity, a session id, a collection, `deck`"), already without `rail`.
- The History view names each kind by `history.kind_<kind with - as _>` (`src/lib/views/system/history/History.svelte:84`), the words in `config/text/views/system/history.yml:32-49` (`kind_rail: rail list` is the last).
- The page's writes are `src/lib/state/client/writes.svelte.ts`: `writeRail` at `:316-321` sends `{ kind: 'rail', rail }`. `createWrites(): WritesStore` (`:67-69`) returns an object literal typed by `WritesStore` in `src/lib/state/shared/stores/shapes.ts:164`, so a new function needs its line there.
- `src/lib/server/edit/yaml-edit.ts` sets manifest fields of at most two segments (`pathOf`, `:130-135`) and refuses `id`, `tier` and `type` (`READ_ONLY`, `:78`), which are manifest rules. `renderScalar(value, style)` (`:199`) renders a scalar in the style the file used, except that a value holding a newline is written double-quoted whatever the old style (`:202-207`). The private `replaceValue(text, node, value)` (`:391`) and `rangeOf(node)` (`:330`) splice a value over a node's range, giving a zero-width (empty) node the space the colon lacks (`:418-420`) and refusing a scalar that renders over more than one line.
- The readers of the merged config: `loadConfig` (`src/lib/data/sources/config/merge.ts:109`) gives findings for a file that does not parse (a duplicate key included, since yaml's `parse` throws on one), is not a map, or defines a top-level key another file defines (`:150-160`, the later file wins). The exported readers of `src/lib/data/sources/config/` throw on a bad value (`grep -rn "throw new Error" src/lib/data/sources/config/` gives 34 lines: agents 1, local 18, settings 15), for example `changesKeep` (`settings.ts:142-152`, "config/behavior.yml: changes.keep must be a whole number above zero" at `:149`) and `searchSettings` ("config/behavior.yml: search.max_hits must be a number above zero"), each stopping at its block's first problem. `createServerContext` (`src/lib/server/root/context.ts:205-238`) also reads the merged config through `requirePaintLimit` (`src/lib/data/helpers/editor.ts:25-30`, which throws for `editor.paint_limit_kb: 0`), `openSettings`, `slurmSettings`, `calendarSettings`, `mailSettings`, `usageTiers`, `notifyConfig`, `textCatalog`, `iconSet`, and the findings readers `iconFindings`, `behaviorFindings` (`catalogs.ts:152`), `themeFindings` (`config/themes.ts:31`, a finding for a `code_theme` that is no code theme) and `docFindings`; and it hands `usage_refresh_min` and `usage_refresh_model` to `watchUsageRefresh` (`:266-267`), which throws for `usage_refresh_min <= 0` and an empty `usage_refresh_model` (`src/lib/server/machine/usage/refresh.ts:140-142`).
- The `yaml` package (`^2.9.0` in `dependencies`, installed 2.9.0): `parseDocument(src).toString()` with no edit rewrites the layout of every config file (behavior.yml 149 of 160 lines differ, present.yml's four-space indentation becomes two, blank lines dropped, flow-map padding collapsed) and moves comments, though it keeps each scalar's quote style.
- Docs: `DESIGN.md:313` ("How it writes") lists the open kinds an app may use; `config-key` is not one, as `rail` and `audit-mute` are not. `HELP.md:256` lists the recorded kinds ("the manifest fields, the collection entries, the subtasks, the feeds, the deck and the per-session overrides, and a scaffolded idea and the two LinkedIn writes"), already without the rail list and the audit mute.
- The words a reader sees come from `config/text/`; the server's own words are `config/text/server.yml` under `server:`.
- Folder counts (`ls -A | wc -l`): `src/lib/server/edit/writes` 8, `tests/server/edit` 9, `tests/routes/edit` 6.

## What to build

1. **The body.** `writes/bodies.ts` gains `ConfigKeyWrite = { kind: 'config-key'; file: string; key: string; value: unknown }` and its parser, in the form `body.kind !== 'config-key'` that `tests/fixtures/kinds.ts` reads: a map with `kind: 'config-key'`, `file` and `key` non-empty strings, and `value` present; anything else is not this write. Its refusals are tested in `tests/routes/edit/write.test.ts`, as `bodies.ts:5` says every parser's are.
2. **The writer**, `src/lib/server/edit/writes/config-key.ts`, `writeConfigKey(engine, file, key, value)`, synchronous from its read of the file to its write, reading the config files from `engine` itself (never the `into.config` built before the request), refusing in this order, each with its reason sentence from `config/text/server.yml` under `server.config_key`, writing nothing:
   - `file` is `local.yml`: the machine's own file is not written here; `config/local.yml` is not opened.
   - `file` is not one of the catalog's tracked files (`appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`), compared as the whole string (so `config/behavior.yml` and `../behavior.yml` are refused), or `key` has no entry under it in the catalog, looked up with `Object.hasOwn` (so `''`, `__proto__`, `constructor` and `toString` as `file` or `key` are refused): no catalog entry.
   - The entry is a family (`fields:`), has no `control`, or its control is `list`: not set one key at a time.
   - The value does not fit the control: `toggle` a boolean; `number` a finite number (`1e309`, which JSON reads as `Infinity`, is refused; `-0` is written as `0`); `text` a string; `choice` one of `values`.
   - The file does not parse (a duplicate key included): the file does not parse.
   - The file does not hold the key path as a plain or quoted scalar with a value: not in the file. This covers a key missing, a segment holding a dot or a non-string key, an empty or null value (`key:`, `~`, `null`), an alias, an anchored node, a tagged node and a block scalar (`|`, `>`).
   - The edited text, parsed back, does not hold exactly `value` at the key, or differs from the original anywhere else (every other key, at every depth, deep-equal): refused, nothing written.
   - The merged config built with the edited file in place of the old one: `loadConfig` gives a finding it did not give before; or any reader in the writer's list throws (whether or not it threw before the edit); or a findings reader in the list gives a finding, compared by its words, that it did not give before. The reason is the reader's own sentence or the finding's words. The list is one array in the writer's module: every reader `createServerContext` (`context.ts:205-238`, `:266-267`) runs on the merged config, the findings readers included, and every exported reader of `src/lib/data/sources/config/` that takes the merged config. `watchUsageRefresh`'s two checks move into an exported function of `refresh.ts` that it and the list call, so the check exists once. The merge is `loadConfig`'s own: `merge.ts` gains the form the writer needs (one file's text taken in place of what is on disk), so precedence and the defined-twice finding are the same.
   A value equal to the one the file holds, in whatever style, writes nothing and answers with nothing changed. Otherwise the new scalar replaces the node's bytes through `yaml-edit.ts`'s `replaceValue`, exported for it (one splice, so the zero-width rule and the one-line check exist once), in the style the file used (a quoted string stays quoted; a value holding a newline is written double-quoted, as `renderScalar` does; a string inside a flow collection is written double-quoted when plain would not parse back), every other byte of the file kept, a trailing comment on the line, CRLF line ends and a BOM included, and the file is written atomically. A text value is written as given, non-ASCII included, since it is the reader's own value. It returns `{ changed: ['<file>:<key>'], refused: [], records: [{ file, key: '<file>', field: '<key>', before, after, undo: 'field' }] }`; a refusal returns `{ changed: [], refused: [{ field: '<file>:<key>', reason }] }`, the shape a manifest write answers a refused field with.
3. **The route.** `writes.ts` matches the body and calls the writer with `into.engine`; an exception reading or writing the file (a missing file included) answers `500 { error: 'unwritable' }`, as `rail` does; the outcome goes through `answer(outcome, 'config-key', into)`. The head comment at `:20-23` names the config writers and the parser count true to the file after the change.
4. **Undo.** `writes/undo.ts`: `valueNow` reads the key's current value from the file (not found when the key is gone or the file does not parse, so the undo answers `gone`), and `apply` writes `change.before` back through `writeConfigKey`, so an undo is refused by the same rules, with the reason (`{ error: 'refused', refused }`).
5. **History word.** `config/text/views/system/history.yml` gains `kind_config_key: setting` after `kind_rail`. `changes.ts:67-71`'s `ChangeRecord.key` doc names a config file (for `rail` and `config-key`) among what a write addresses.
6. **The page's write.** `writes.svelte.ts` gains `writeConfigKey(file, key, value)` sending `{ kind: 'config-key', file, key, value }` to `/api/write`, with a doc comment in the form of its neighbours, and `WritesStore` in `shapes.ts:164` gains its line. A test over `createWrites` with a recording fetch checks the body and the address. S3c's editor is its caller; this step adds no view.
7. **Docs.** `HELP.md:256` lists every recorded kind: the rail list, the audit mute and a setting written from the Settings view added to its list. `DESIGN.md:313` needs no change unless the builder finds a sentence the step makes false, which it then corrects in place.

## Cases

1. `{ file: 'behavior.yml', key: 'changes.keep', value: 300 }` on a temporary engine holding a copy of the whole `config/` folder except `local.yml`, its `behavior.yml` `changes:` block rewritten to a comment line above `keep` and `keep: 200  # how many`: the file holds `keep: 300  # how many`, every other byte the same (compared byte for byte); the record holds before 200 and after 300; the History word is "setting".
2. The same with `value: 200` (what the file holds): nothing written, `changed: []`, no record.
3. `changes.keep` with `value: 0`: refused with "config/behavior.yml: changes.keep must be a whole number above zero"; the file unchanged.
4. `changes.keep` with `value: 2.5`: refused with the same sentence; `value: "300"`, `true`, `[]`, `null` and `1e309`: refused, not a finite number. `value: -0`: written as `0`.
5. `{ file: 'local.yml', key: 'port', value: 8791 }`: refused, the machine's own file; the temporary engine's `local.yml` keeps its bytes and its mtime.
6. A key with no catalog entry (`behavior.yml`, `not.a.key`), `key: ''`, `file` or `key` set to `__proto__`, `constructor` or `toString`, and `file` set to `config/behavior.yml`, `../behavior.yml` or `behavior.yml/../layout.yml`: refused, no catalog entry.
7. A family (`appearance.yml`, `themes`) and a `list` option: refused, not set one key at a time.
8. A `choice` option with a value outside `values` (`appearance.yml`, `wallpaper.pick`, `"last"`): refused; with `random`: written.
9. A `toggle` with `"true"` (a string): refused; with `true`: written.
10. A `text` option with a string holding a colon, a `#` and quotes: written so the file parses back to exactly that string, the key's other lines and comments unchanged; the same with a newline: written double-quoted.
11. A key three segments deep (`layout.yml`, `board.search.projects`; `present.yml`, `deck.meta.kicker`): written in place.
12. A quoted string value without a newline (`'...'` or `"..."` in the file): the new value keeps the quote style.
13. The file does not parse on disk, and a file with a duplicate key: refused, the file does not parse; nothing written.
14. The key in the catalog but absent from the file, a key segment holding a dot, a non-string key (`1: x`), an empty value (`key:`), `~`, `null`, an alias (`b: *v`), an anchored node (`b: &v 5` with `x: *v`), a tagged node (`b: !!str 5`) and a block scalar (`b: |`): refused, not in the file.
15. Undo of case 1: the file holds `keep: 200` again, byte for byte as before case 1, and the undo is in the log above it.
16. The file holds `search.max_hits: 0` by hand; a config-key write of `search.max_hits: 500`: written. Its undo would write 0 back: refused with "config/behavior.yml: search.max_hits must be a number above zero".
17. Two writes of different keys of one file in a row, and two at once (`Promise.all` of two requests): all land, each record names its key.
18. The body without `value`, with `file: ''`, or with `key` not a string: not this write (the route's "not a write this route knows"), in `tests/routes/edit/write.test.ts`.
19. The file missing, or unwritable (a read-only copy): `500 { error: 'unwritable' }`, nothing else written.
20. `editor.paint_limit_kb: 0`, `usage_refresh_min: 0`, `usage_refresh_model: ""` and a `code_theme` that is no code theme: each refused with its reader's sentence or finding words.
21. `search.max_hits: 0` already in the file, and a write of `search.timeout_s: 0`: refused with `searchSettings`' sentence (the reader throws after the edit). A write of `search.max_hits: 500` in that state: written (case 16).
22. A text value with an em dash or an accented letter: written as given.
23. A text value written in another quote style than the file's but equal to it: nothing written.
24. Undo after the key was removed from the file, or after the file stopped parsing: `gone` (404).
25. A file with CRLF line ends, and one with a BOM: written, every `\r\n` and the BOM kept.
26. A text value holding `,` `{` `}` inside a flow map: written double-quoted, the file parsing back to exactly that string.
27. `writeConfigKey('behavior.yml', 'changes.keep', 300)` on the page: one POST to `/api/write` with `{ kind: 'config-key', file: 'behavior.yml', key: 'changes.keep', value: 300 }`.
28. `changes.keep` is 0 in the file: the config-key write of `changes.keep` answers as every write does while the change log has no bound (decision 5), and the file is unchanged.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted. A case of a code step (a script, or a product's code) becomes a test of the step, run on the unchanged tree first; no prototype script stands in for the test. A case of a text or judgment step is checked by reading the unchanged tree, and that first read is noted.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

Every test writes copies of the config files under a temporary folder (the whole `config/` folder except `local.yml`, since the writer reads the catalog, the text and the other files from the engine) and points the writer at that engine; a route test builds its target with `engine` set to that temporary engine, never `engineDir()`. No test writes the checkout's `config/`, and none reads the checkout's `config/local.yml`; a test that needs a `local.yml` writes its own into the temporary engine. The writer's tests go in `tests/server/edit/config-key.test.ts`; the route, change-log and undo cases (1's record, 15, 16, 17, 19, 24) in `tests/routes/edit/config-key.test.ts`.

## Paths this step writes

- `tools/oculus/src/lib/server/edit/writes/config-key.ts`
- `tools/oculus/src/lib/server/edit/writes/bodies.ts`
- `tools/oculus/src/lib/server/edit/writes.ts`
- `tools/oculus/src/lib/server/edit/writes/undo.ts`
- `tools/oculus/src/lib/server/edit/yaml-edit.ts`
- `tools/oculus/src/lib/server/core/changes.ts`
- `tools/oculus/src/lib/data/sources/config/merge.ts`
- `tools/oculus/src/lib/server/machine/usage/refresh.ts`
- `tools/oculus/src/lib/state/client/writes.svelte.ts`
- `tools/oculus/src/lib/state/shared/stores/shapes.ts`
- `tools/oculus/config/text/views/system/history.yml`
- `tools/oculus/config/text/server.yml`
- `tools/oculus/tests/server/edit/config-key.test.ts`
- `tools/oculus/tests/routes/edit/config-key.test.ts`
- `tools/oculus/tests/routes/edit/write.test.ts`
- `tools/oculus/tests/routes/edit/write-fixture.ts`
- `tools/oculus/tests/server/machine/usage/refresh.test.ts`
- `tools/oculus/tests/state/client/writes.test.ts`
- `tools/oculus/HELP.md` line 256
- `tools/oculus/DESIGN.md` line 313
- `tools/oculus/docs/diagrams/` (regenerated by `npm run diagrams` only)
- `tools/oculus/.scratch/migration/agents/reviews/S3b-report.md`

## Decisions taken in this brief (each reversible, none silent)

1. A refusal answers in the shape a manifest write already uses for a refused field (`refused: [{ field, reason }]`), with `field` as `<file>:<key>`, so S3c shows the reason beside the option; no new answer shape.
2. The record's `key` is the file name and its `field` the dotted key path, so the History view's row reads "setting" with the file and the key, as a manifest row reads its project and field.
3. A key absent from the file, or holding no value, is refused rather than inserted: the catalog's check keeps every option in its file with its value, so such a key is a file changed by hand, which the reader fixes in the file.
4. A write is refused whenever a throwing reader throws on the merged config after the edit, whether or not it threw before, and when a findings reader gives a finding it did not give before: Z121 (3) (a) refuses a value when the readers refuse the merged config holding it, and comparing throws before and after would let a second bad value of one block through behind the first. A config already holding a refused value therefore admits the write that repairs it (case 16) and refuses writes that leave it refused (case 21), each with the sentence that says what to repair. `loadConfig`'s findings are compared before and after; no scalar change can create one once the edited text parses back, so that comparison has no case of its own.
5. While `changes.keep` itself is refused, `target()` fails before any writer runs, for every write, and this step keeps that: the change log cannot be kept without its bound, and S3c's editor opens the file at that key's line for a key the server refuses. Case 28 records it.
6. The writer's own reason sentences live in `config/text/server.yml` under `server.config_key`; a reader's sentence is passed through as the reader throws it.
7. A text value is written as given, non-ASCII included: it is the reader's own value, and the ASCII rule governs authored source.

## Libraries checked

Under `libraries: check`. The capability is a scalar set in place in a YAML file with every other byte kept: the `yaml` package already in `dependencies` (2.9.x) gives `parseDocument` and node ranges, which `yaml-edit.ts`'s `replaceValue` already uses. Its `Document.setIn` and `toString()` keep each scalar's quote style and every comment but rewrite the file's layout (indentation, blank lines, flow-map padding, a comment's position), so they are not used for the write. No other candidate found.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `src/lib/server/edit/writes/rail.ts` whole and `writes/audit-mute.ts` whole: the shape of a config write, its read-back check and its record.
2. `src/lib/server/edit/writes.ts:1-125`, `:195-230` and from the `deck` branch to the end: the router, `WriteTarget`, `target()`, `answer`.
3. `src/lib/server/edit/writes/undo.ts` whole.
4. `src/lib/server/edit/yaml-edit.ts:120-260` and `:330-430`: `renderScalar`, `rangeOf`, `replaceValue`, which show how a value is spliced over its node.
5. `src/lib/data/sources/config/options.ts` whole, `merge.ts:100-170`, `settings.ts` whole, `local.ts:340-360`, `src/lib/server/root/context.ts:200-270`, `src/lib/server/machine/usage/refresh.ts:130-146`.
6. `tests/routes/edit/rail.test.ts`, `undo.test.ts` and `write-fixture.ts`: how a config write, its change log and its undo are tested; `tests/fixtures/kinds.ts`.

## What it must do

As "What to build" says. Nothing beyond it: no view, no Settings control (S3c), no write of `local.yml`.

## Conventions

The rules file's, unchanged: ASCII only in `src` and `tests`, comments of at most 100 columns that say what and why with no history, a test for each behaviour whose failure costs something, no check loosened.

## Verify before you report

Run from the worktree's `tools/oculus`, each must hold:

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` exits 0.
2. The plan's verify list, run as `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, prints `$ <command>` and the output of each command, then `checks: 7 commands passed`, and exits 0; the lines it prints are what the report quotes.
3. `npx vitest run tests/server/edit tests/routes/edit tests/server/machine/usage --testTimeout 0` passes.
4. Before and after the test runs, `shasum config/appearance.yml config/behavior.yml config/layout.yml config/present.yml config/sources.yml config/catalogs/options.yml` prints the same sums: no test wrote the checkout's config. `config/local.yml` is never named, opened or hashed.
5. Each new or changed test of a behaviour the change adds or changes fails on the unchanged tree, in the form it has after its last change, and the report quotes that failure; each new or changed test of a behaviour the change preserves passes after the change and, where it can run there, on the unchanged tree, and the report quotes those runs. A test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof, and the report says which it is.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/S3b-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim. Then the cases' first run: each case with its result on the unchanged tree, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling. Then the DONE / NOT DONE table with the checks above and their output verbatim. Then files with line counts, every judgment call the brief left open, every host- or user-visible change with its before and after, and anything in the brief that was wrong or impossible, with the evidence.
