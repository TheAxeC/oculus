# Step S3 brief check (on main at 5ae0f4f4)

This is the report of the fresh agent from the `spec` skill's "Steps / The brief check", run on `agents/briefs/S3.md`. I read the working-tree copy, which `git status` shows as modified and uncommitted. Nothing was changed. `config/local.yml` was not opened, and every grep over `config/` used `--exclude=local.yml`.

`plan.md` has no `## Goal` heading (`grep -n '^## ' plan.md` prints only Packages, Could run in parallel, Rulings and Blocked). Its opening paragraph names the plan as the "Execution ledger for `tools/oculus/DESIGN.md`". "The goal" below is therefore the part of DESIGN.md this step delivers, read through Z75, which says every option is explained and easy to find.

## 1. Names

- `LOCAL_KEYS` (made an export): `grep -rn LOCAL_KEYS src tests config HELP.md DESIGN.md README.md --exclude=local.yml` prints `local.ts:91` and `local.ts:237` (both in the paths) and one hit outside them.
  - `tests/views/system/help.test.ts:340: const block = /const LOCAL_KEYS = \[([^\]]*)\]/.exec(source)`
  - This regex still matches `export const LOCAL_KEYS = [`. It stops matching if the builder adds a type annotation (`export const LOCAL_KEYS: readonly string[] = [`). The test then reads no keys and fails at `expect(keys).toContain('claude_bin')`.
- `config/catalogs/options.yml` (new file):
  - `merge.ts:94` (`collect(join(dir, CATALOGS_DIR))`) and `merge.ts:153-168` merge every top-level key of every catalogs file into the one config map. DESIGN.md:85 says the same.
  - The brief's shape (a map of config file name to a map of key paths) would therefore add six top-level keys to the merged config: `appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml` and `local.yml`. The whole merged config is sent on the `config` channel (`catalogs.ts:37-38`).
  - `tests/checks/config/config-folder.test.ts` is outside the paths and goes red in three places:
    - `:107` `EXPECTED` has no `catalogs/options.yml`.
    - `:359` "holds exactly the expected top-level keys, and no more" compares `Object.keys(config)` with `EXPECTED`.
    - `:659-670` requires `expect(tracked(dir)).toEqual(Object.keys(EXPECTED).sort())`.
  - The desc check at `:430` is already met through `desc_options` in the paths.
- `config-key` (new body kind): `grep -rn -e config-key -e config_key ...` prints nothing today.
  - `tests/fixtures/kinds.ts:15-21` lists the body kinds by reading `body.kind !== '<kind>'` out of `src/lib/server/edit/writes/bodies.ts`.
  - `tests/checks/source/keys.test.ts:164-165` allows `history.kind_*` only for those kinds.
  - The new `kind_config_key` word is therefore an orphan (keys.test.ts:318-319 red) unless the body parser `configKeyWrite` sits in `bodies.ts` in that form. `bodies.ts` is not in the paths, and item 3 does not mention a body parser. `tests/views/system/history.test.ts:178-190` would also not cover the new kind.
- `Settings.svelte` (rewritten):
  - `tests/views/system/workbench/settings.test.ts` (331 lines) renders `Settings` with `render(Settings, ...)` (line 28). It asserts the appearance half (lines 85-160) and the rail half (lines 163-330).
  - The new editor draws `RailEditor` only as the control of a `rail` row built from file texts, and the fixture's file store holds none. The rail cases go red unless the fixture or the test changes.
  - The test and `workbench-fixture.ts` are not in the paths.
  - `tests/views/whole/type-scale.test.ts:325-330` requires every `.svelte` under `src/lib/views` to be listed in `VIEWS` with its font-size roles. `:99` holds `'system/workbench/Settings.svelte': ''`. Every new partial, and any style added to Settings.svelte, needs an entry there. Its PASS_THROUGH audit (`:343`) lists every `src/lib/ui` component, which matters if a number input primitive is added. The file is not in the paths.
- The Settings view's "reveal rail" behaviour:
  - `RailEditor.svelte:21-23` says: "The rail's Settings choice opens the Settings view with `reveal: 'rail'` in its instance state; the list is then scrolled into view".
  - `ActivityRail.svelte:159-165` makes that call: `openView(SETTINGS_VIEW, { reveal: 'rail' }, ...)`.
  - These stay true only if the editor keeps the reveal, and the brief does not say so.
- `config/appearance.yml:57-59` says "The Settings view's CRT toggle writes the viewer's own choice into the appearance store", and `:65` says the same of the Code theme menu. The view will now also hold a `crt.default` toggle and a `code_theme` control that write the file. The sentences stay true but no longer say which control they mean.
- `DESIGN.md:43`: the catalogs line is `DESIGN.md:44` (`grep -n "the vocabularies: glyphs" DESIGN.md` prints `44:`).
- `HELP.md:216-230`: the config table lists the catalog files and the paragraph says "The Config view shows the same list". The Config view will list `catalogs/options.yml` (it lists every catalogs file, `config-files.ts`), so the table needs a row. The paths name only "HELP.md lines 145 and 234 and the config paragraph".

Findings:
1. `config-folder.test.ts:107`, `:359` and `:659-670` go red when `options.yml` is added, and the file is not in the paths. The merge also puts six filename-named top-level keys into the config the client receives. Every other catalog holds one top-level key named for itself (`agents:`, `glyphs:`, `icons:`, `manifest_schema:`, `meta:`, per `config-folder.test.ts:143-162`). The brief has to take the file's top level: `options:` wrapping the Z94 map, or the file names as top-level keys. Z94 (2) (a) names the inner shape only, so whether the wrapper key is a user-visible shape is the orchestrator's judgment.
2. `bodies.ts` must hold the `config-key` parser, or `keys.test.ts` (orphan `history.kind_config_key`) is red. It is missing from item 3 and from the paths.
3. `tests/views/system/workbench/settings.test.ts` and `workbench-fixture.ts` are missing from the paths, and their rail cases break under the new drawing.
4. `tests/views/whole/type-scale.test.ts` is missing from the paths. Every new partial must be listed there.
5. The `LOCAL_KEYS` export must keep the literal form `const LOCAL_KEYS = [`, or `help.test.ts:340` must change. The brief says neither.
6. The reveal of the rail row (`reveal: 'rail'`) is not carried into item 4.
7. `DESIGN.md:43` should read `:44`, in item 5 and in the paths.
8. HELP.md's config table (`:218-230`) needs a `catalogs/options.yml` row, and it is outside the path list.

## 2. The step line

The line is `plan.md:177`, plus the full line quoted in the brief. Each part and the item that serves it:
- "the Settings view as VS Code's Settings editor": item 4.
- "over every option of every config file": items 1 and 4.
- "grouped by file and section" (brief line): item 4, the table of contents.
- "with search": item 4.
- "a Modified filter": item 4, and decision 3.
- "each option's description, default, value" (and "file and line" in the brief line): items 1 and 4.
- "and control": items 3 and 4.
- "from one catalog under `config/catalogs/`": item 1.
- "`local.yml`'s values never shown" and "`local.yml`'s keys listed with their description": items 1 and 4, plus item 2's rule that `local.yml` is never read.
- "HELP.md's config section pointing to it": item 5.
- Z77, the check: item 2.
- Z94 (4) (b), the `config-key` write with History and undo: item 3.
- "the options later steps add (D25, the Settings ruling's list) enter through the catalog": no item of its own. Item 2's check forces an entry for any key added later, which serves it by implication.
  - The family rule of item 1 makes any map keyed by names the data chooses a family, and a family has no control (Z94 (4) (b)).
  - D29 (`plan.md:381`) asks for "word wrap per language in D25's per-language area ... each a key with its control". A per-language map is a family by item 1's rule, so D29's options would enter through the catalog with no control.

Findings:
1. The "later options enter through the catalog" part has no item that says how an option added later gets its row and control. Under the brief's family rule, D25/D29's per-language keys would get no control. That conflict is between Z94 and D29, not inside S3's scope (see Declined).

## 3. Premises

- Top-level key counts. `python3` with `yaml.safe_load` over each file prints `appearance 6`, `behavior 31`, `layout 13`, `present 1`, `sources 15`. Matches.
- Comment lines. `grep -c '^\s*#'` prints 19, 39, 22, 11, 40. Matches.
- 117 options. My walk (`walk.py`, then a leaf count with the brief's family list) prints appearance 14, behavior 48, layout 21, present 19, sources 15, total 117. Matches.
- "22 of them families". The brief's own list names 1 + 3 + 6 + 7 + 4 = 21. Differs.
- `LOCAL_KEYS` at `local.ts:91-108`, 16 names, not exported. Matches.
- "`local.ts:237` refuses a key not in it". Differs:
  - `local.ts:237-238` is `const unknown = ...filter((key) => !LOCAL_KEYS.includes(key)); if (unknown.length > 0) onUnknown?.(unknown);`.
  - `loadLocal` warns on stderr and ignores the key (`local.ts:313-315`: `console.warn(... ignoring unknown key(s) ...)`).
  - `checkLocal` (`local.ts:348-351`) passes no `onUnknown`, so a save that holds an unknown key is accepted.
- `config/catalogs/` holds `agents.yml glyphs.yml icons.yml manifest-schema.yml meta.yml vocab.yml` (`ls`). Matches.
- `config.desc_<name>` sits at `config.yml:4-15` (`cat -n`). Matches.
- "`config-folder.test.ts` hold[s] the descriptions to the files, so a new catalog file needs `desc_options`". True, but incomplete: the same file's `EXPECTED` (`:107`) and the tests at `:359` and `:659` also need the new file (section 1).
- Settings.svelte 49 lines, Appearance 170, RailEditor 287, PagesReset 112 (`wc -l`). Matches.
- `writes.ts` 546 lines, audit-mute branch at 453-469, rail branch at 472-488, `answer` at 522-539 (`grep -n`). Matches within one line.
- `WriteTarget` names `behaviorFile` and `layoutFile` at `writes.ts:108-118`. Matches.
- `undo.ts` is 317 lines; the rail read is at 128-130 and the rail write at 240-241 (`sed`, offset from line 60). Matches.
- `ChangeRecord` at `changes.ts:64-86` and `UndoKind` at `:39`. Matches.
- History kind word at `History.svelte:83-85`. Matches.
- "history.yml:32-41". The kind words run from 32 to 49 (`grep -n kind_`, last line `49: kind_rail: rail list`). Differs slightly.
- Client rail write at `writes.svelte.ts:313-320`. Matches.
- `renderScalar` at `yaml-edit.ts:199`, `setFields` at `:714`, `pathOf` at `:130-135` refusing more than two segments. Matches. Not mentioned by the brief: `yaml-edit.ts:391` `replaceValue(text, node, value)` already writes a value over a node's bytes, keeping the node's quoting (`renderScalar(value, isScalar(node) ? node.type : undefined)`, `:414`).
- `sourceTabState(root, path, line?)` at `source.svelte.ts:91-98`. Matches.
- `fuzzy.ts` exports `fuzzyMatches`, `byScore`, `textParts`; `fuzzysort` is 4.0.2 and `yaml` is ^2.9.0 (`package.json:63,81`). Matches.
- HELP.md:138, :145 and :234 as cited. Matches. The DESIGN.md catalogs line is 44, not 43 (the brief says `40-48` and `:43`). Line 43 differs.
- Item 1 example 1, "`behavior.yml` `slurm.poll_min: 1`". The file holds 20 (`behavior.yml:81: poll_min: 20`). Case 6's "1 to 2" is also off, unless the case's copy is set to 1 first.
- Item 1 example 4, "`layout.yml` `focus_label_mode` ... the modes the code accepts, read from the code that switches on it". No code reads `focus_label_mode`:
  - `grep -rn "focus_label_mode" src tests config --exclude=local.yml` prints only `config-folder.test.ts:156` and `config/layout.yml:171`.
  - `presets.ts:191-195` maps only `projects`, `archive` and `coauthor` to label keys.
  - A leaf-by-leaf `grep -rlw` of every option's last segment over `src` finds no other option without a hit.
- The family rule against the family list:
  - `tab_split` is read as `split[cell.label]`, keyed by project type (`rail-badges.svelte.ts:193-196`). By the brief's rule ("names the reader or the data chooses") it is a family, yet the brief counts it as three options.
  - `nav_groups` keys are group ids that the view registrations name (`group: 'info'` and so on across `src/lib/views`). By the rule it is not a family, yet it is listed as one.
- The tree also holds keys that contain a dot: `read_limits: { status.line: 220, ... }` (`behavior.yml:8`) and `open.program_ext` keys such as `.docx`. Both are families under the brief's list, so the dotted key paths stay unique. The brief does not say so.

Findings:
1. "22 families" should be 21. The brief's own list and my walk both give 21.
2. "`local.ts:237` refuses a key not in it" is false: an unknown key is warned about and ignored (`local.ts:313-315`), and `checkLocal` accepts it.
3. `slurm.poll_min` holds 20, not 1 (`behavior.yml:81`). This affects item 1 example 1 and case 6.
4. `focus_label_mode` has no reader in `src`. Item 1 example 4 cannot be done as written, the option cannot be described "from the code that uses it", and the rules file's principle "every catalog key has a reader in the tree" is broken by the existing key. Whether to remove the key or give it a reader is a change to `layout.yml`, which may be the user's call.
5. The family rule's text disagrees with the family list on `tab_split` and `nav_groups`. The head comment of `options.yml` states the rule, so a reader applying it gets a different list.
6. `DESIGN.md:43` should be `:44`, and `history.yml:32-41` should be `:32-49`.
7. The premise on the config folder check leaves out `EXPECTED` and the merge (section 1, finding 1).

## 4. Cases and checks

I read cases 1-15 against `agents/spec.md`. Cases 1-5, 7-11 and 14-15 are consistent with it. The inconsistencies:

- Case 6 and item 3: the record `{ file: 'config/<file>', ... }` breaks the record convention.
  - `ChangeRecord.file` is "relative to the hub inside it and absolute outside it" (`changes.ts:66`).
  - Every writer records the absolute path: `rail.ts:115` `records: [{ file, key: RAIL, ... }]`, where `file` is `into.layoutFile`.
  - `answer` then maps it with `pathOf(into.hub, record.file)` (`writes.ts:530`). `pathOf` calls `resolve(file)` (`changes.ts:118-121`), which resolves a relative `config/behavior.yml` against the process's working directory.
  - The undo's path is `resolve(isAbsolute(change.file) ? change.file : join(into.hub, change.file))` (`undo.ts:72`), which names `<hub>/config/behavior.yml`, not the engine's file.
  - Case 10 would go red for this reason.
- Paths against spec.md "What every package obeys", the ten-item folder rule (`utils/folder-check.sh`, run by `tests/checks/tree/size.test.ts`):
  - `src/lib/state/system` holds 10 tracked items (`git ls-files ... | cut -d/ -f1 | sort -u | wc -l` prints 10), and so do `src/lib/state` and `src/lib/state/workbench`. The brief's "new module ... in `src/lib/state/system/`" makes 11.
  - `tests/server/edit` holds 9, so one new file at most.
  - `src/lib/views/system/workbench` holds 8, so two new partials at most. The editor (table of contents, rows, four controls, the gear menu) is likely to need more.
  - The brief names no split.
- Item 4, "a number field", against spec.md's rule that every control is a `ui/` primitive. `src/lib/ui/forms/` has `Checkbox.svelte`, `TextInput.svelte` and `choice/Select.svelte`. `TextInput.svelte:39` is `type={secret ? 'password' : 'text'}`, and `grep -rn 'type="number"' src/lib` prints nothing. The brief neither names the primitive for each control nor puts `src/lib/ui/forms/` in the paths.
- Decision 6 and item 3, against spec.md's principles ("a parser, a fold or a rule exists once and is reused"). `replaceValue` (`yaml-edit.ts:391-423`) already replaces a node's bytes by its range and keeps the node's quoting. Item 3 writes a second such splice. The family-rule walk would also be written twice, once in the check (item 2) and once in the rows module (item 4), unless the brief places it in one module both import.
- Case 12, "the quoting is the one `renderScalar` gives", is ambiguous. `renderScalar(value)` with no style drops a single-quoted scalar's quotes. `replaceValue` passes the node's `type`, which keeps them.
- Case 13 names an exact result ("leaves the `slurm.poll_min`, `calendar.poll_min` and `mail.poll_min` rows") that depends on descriptions the builder has not yet written. Any description holding "poll" (for example `usage_refresh_min`) adds a row. A case with a result known before the build needs a fixture catalog.
- spec.md: "Where oculus does something VS Code does not ... the brief lists each such thing before the build, and a build that removes one is not landed". The rail reveal (`reveal: 'rail'`) and RailEditor's draft kept in instance state across tab switches and reloads (`RailEditor.svelte:14-16`) are not listed.
- Z94 (4) (b) says "one new confirmed write kind". The brief does not say what "confirmed" means: the write token of DESIGN.md:313, or a confirm before each write.

Findings:
1. The record's `file` must be the absolute path written, as `rail.ts:115` does. As written, case 10 fails and `pathOf` depends on the working directory.
2. `src/lib/state/system` is full at 10. The brief must name the split, for example `config-files.ts` and the rows module moved into `state/system/config/`, which touches `Config.svelte` and `tests/state/system/config-files.test.ts`. It must also cap `tests/server/edit` at one new file and name a subfolder for the editor's partials.
3. There is no number input primitive, and `src/lib/ui/forms/` is not in the paths.
4. Item 3 duplicates `replaceValue`. The brief should export and reuse it, or say why not, and case 12 should read "the quoting the file had". The family walk should live once.
5. Case 13's expected result depends on text the builder writes.
6. The reveal and the rail draft are not listed as oculus behaviours to keep.

## 5. The question

"The goal" here is Z75: every option is explained and easy to find, and set where it has a control.

- Case 1 (the check passes over the tree): yes, it could pass without the goal. Item 2's check fails on no `default`, no `values` and a bad `control`, but not on a missing or empty `description`. A catalog of entries with no description, or with the description "x", passes, and no case reads the descriptions against the code.
- Cases 2-5: no. Each fails on the named defect.
- Cases 6-12: no. Each names a byte-level or refusal result, with the correction of section 4 finding 1.
- Case 13: no for search behaviour, but its expected result is not fixed (section 4).
- Case 14: no.
- Case 15, the look: no. It is the only check on most of item 4.
- Verification 3 (`yaml.safe_load` exits 0): yes, an empty file passes. It is covered only through case 1.
- Item 4 has no case for most of its parts: the table-of-contents groups and their order (This browser, then one group per file, then sections); the row title form "Section: Name"; the control drawn for each `control` word; a family's summary and "Edit in behavior.yml"; the `file:line` link; the modified bar; the gear menu with Reset Setting and Copy Setting ID; the rail and arrangements rows drawing `RailEditor` and `PagesReset`; the reveal. Each is seen only at the look. A string render can assert the markup of each, as `settings.test.ts` already does for the appearance and rail halves.
- The default's value:
  - Item 1 fills `default` with "the value the code falls back to when the key is absent, and where the code has none, the value the tracked file holds at the base".
  - Z94 (3) chose (a), "the catalog entry holds the default ... a fact of oculus", over (c), "what the code falls back to".
  - Most readers have no fallback: `settings.ts:1-3` "falls back to the default the config file carries" and throws on a missing key. spec.md also bans hardcoded fallbacks.
  - So which rows show Modified at the base is decided by this recipe. It is not listed under "Decisions taken in this brief", and `@modified` (case 13) passes whatever value was chosen.
  - Where the code's fallback is not a value, as with `terminal.font_px` (`appearance.ts:81`, absent meaning the theme's token) and `wallpaper.popover_opacity` (`appearance.yml:47-49`, "Unset = three quarters of the way..."), the recipe gives no writable default. Reset Setting then has nothing its `number` control allows.

Findings:
1. The Z77 check and case 1 pass with missing or placeholder descriptions. The check should fail on a missing or empty `description`, and a case should require the descriptions to be read against their code readers.
2. Most of item 4 is checked only at the landing look. It needs render cases.
3. The rule for the default's value is a choice Z94 and Z118 do not make, with a visible effect on Modified. It is not listed as a decision. Options whose default is "absent" have no expected result for their Modified state or for Reset Setting.

## 6. Implied inputs

This is a code step. None of the inputs below is under "Cases". Each is given with the expected result I derive from the rules or the callers.

The check (item 2):
- An entry with no `description`, or an empty one: fails naming it.
- A family entry carrying `default` or `control`, or a `local.yml` entry carrying `default`, `control` or `values`: fails naming it. A `local.yml` default would put a machine value into a tracked file.
- An entry at a key path inside a family (`usage_tiers.prolite`, `themes.0.name`): fails, since a family is one option.
- An entry on a map that is not a family and whose children also have entries (for example `slurm`): fails.
- `values` on a control other than `choice`; a `choice` whose `default` is not in its `values`; a `toggle` whose `default` is not a boolean; a `number` whose `default` is not a finite number: each fails naming it.
- An unknown field in an entry (for example `defualt`): fails naming it.
- A top-level file name in the catalog outside the six: fails naming it.
- A key containing a dot outside a family: fails, since the key path is ambiguous.
- An empty list (`indexes: []`, `audit_ignore: []`): passes when its entry is a family or a `list`, and never fails for lacking records.

The writer (item 3), each with the file unchanged where refused:
- Structural refusals:
  - `key` of `''`, `'slurm.'`, `'.x'`, `'__proto__'` or `'constructor'`: refused.
  - A key through a list index (`waiting_status.0`): refused.
  - A key under a family (`usage_tiers.prolite`): refused.
  - A key whose node is a map: refused.
- A key that has a catalog entry but is absent from the file (removed by hand): refused as gone, and never inserted, since Z94 says it "writes that one key".
- A scalar inside a flow map (`stale_days.litwatch` in `stale_days: { litwatch: 14, ... }`, `behavior.yml:12`): written inside the flow map, the rest byte for byte.
- A scalar with a trailing comment spanning continuation lines (`wallpaper.popover_opacity`, `appearance.yml:46-49`): the value's bytes replaced, every comment line kept.
- A `text` value that parses as another type (`"true"`, `"12"`, `""`), or that holds `: `, `#` or a newline: written quoted, reading back as the same string.
- `value` of `null` from JSON (the form `Infinity` and `NaN` take over the wire), `true` for a `number`, `-0`, or `1e21`: refused, or written so that it reads back equal.
- A `number` the code's own reader refuses. `changes.keep` of `0` or `2.5` (`settings.ts:148`) and `search.max_hits` of `-1` (`settings.ts:92`) are examples: refused. `changesKeep(merged)` runs inside `target()` for every write (`writes.ts:221`), so an accepted `changes.keep: 0` makes every later write throw, including the undo of that write. `slurmSettings`, `calendarSettings` and `mailSettings` run at server start (`context.ts:206-208`), so a bad value there stops the next start. `checkLocal` (`local.ts:341-356`) is the tree's precedent for refusing a body that would stop the next start. The Z94 catalog shape carries no min, max or integer, so the brief has to say how these are refused.
- A number the code clamps (`terminal.font_px: 100`, clamped to 6-40 at `appearance.ts:81`): written, or refused. The brief must say which.
- Reset Setting of an option whose default is absent or null (`terminal.font_px`): an expected result is needed (section 5, finding 3).
- `file` of `behavior`, `config/behavior.yml`, `catalogs/options.yml`, `glyphs.yml`, an absolute path, or `''`: refused.
- A missing or unreadable file: `unwritable`, status 500, as the rail branch answers.
- A body missing `value`, or with `key` not a string: the body parser returns null, and the route answers 400.
- Two `config-key` writes to different keys of one file in quick succession: both land, and the second reads the first's result.

The undo:
- The key removed from the file since the write: refused (`gone`, 404).
- The file deleted: refused.
- The key's catalog entry removed since the write: refused with the writer's reason, the file unchanged.
- `before` no longer allowed by the key's current `control`: refused.

The rows and the view (item 4):
- The search:
  - An empty search, or spaces only: every row.
  - `@Modified` in another case: the same as `@modified`, or treated as text. The brief must say which.
  - An unknown `@word`: an expected result is needed.
  - A search matching only a `local.yml` row's description: that row is shown.
  - A search matching a section name: an expected result is needed.
- Files the rows read:
  - A tracked file missing, or one that fails to parse: its group says so, and the other groups draw.
  - `options.yml` missing or failing to parse: the view says so. No row is drawn without a description.
  - A key in a file with no catalog entry, added by hand while the server runs: an expected result is needed (VS Code shows no unknown settings).
  - A value in the file of the wrong type for its control (`crt.default: "yes"` by hand): the control shows the file's value as not valid, and the row is Modified.
- Writes from the view:
  - Typing `12` into a number field: one write of 12, not a write of 1 then 12. When a text or number field writes (on change, on blur, on Enter, after a pause) is not stated.
  - A write in flight when a second write of the same key is sent: the later one wins, and the row shows the file's value after the push. spec.md requires every asynchronous path "in flight, after close, and superseded".
  - A refused write: the row keeps the file's value and the refusal is said.
- State and reveal:
  - A search typed, then the tab switched away and back or the page reloaded: the search is kept as instance state, as RailEditor's draft is.
  - Opened with `reveal: 'rail'` while a search hides the `rail` row: the rail row is shown and scrolled into view (`RailEditor.svelte:21-23`).
  - The client never requests `local.yml`'s text, even when the Config view has loaded it into the shared file store.

Findings:
1. Every input above is missing from "Cases". The two with the largest effect are a `number` the code's own reader refuses (it can make every later write, and its own undo, throw) and Reset of an option whose default is absent.

## 7. ADRs

- `ls docs/adr` from the repository root and from `tools/oculus` both print "No such file or directory". The configuration block has no `adr:` key (`grep -n "^adr:" orchestrator-state.md` prints nothing). There is no record.

Findings: none.

## 8. The size of the step

What a builder must read:
- The named files: `wc -l` over the brief, `spec.md`, the five config files, `writes.ts`, `bodies.ts`, `undo.ts`, `rail.ts`, `audit-mute.ts`, `changes.ts`, `yaml-edit.ts`, `writes.svelte.ts`, the four workbench partials, `Config.svelte`, `config-files.ts`, `History.svelte`, `fuzzy.ts`, the form, search and menu primitives, `local.ts`, `merge.ts`, the tests to model (`routes/edit/rail.test.ts`, `write-fixture.ts`, `undo.test.ts`, `settings.test.ts`, `config-folder.test.ts`, `keys.test.ts`, `type-scale.test.ts`, `help.test.ts`, `config.test.ts`) and the three word files. Together they total 9,903 lines.
- The code behind the catalog: 117 options (96 single options and 21 families, each family with record fields to describe), each needing its description and default "read from the code that uses it". A grep for the 66 top-level keys as `config.<key>`, `['<key>']` or `'<key>'` finds 160 source files of 43,154 lines that mention them. A builder reads only the reading function of each, but must first find all 117 of them, and several (`context_window`, `file_index`, `tab_split`, `map_label_mode`) are reached through helpers that pattern does not match.

What a builder must write:
- A catalog of about 117 entries of one to three sentences each.
- A new write kind with a body parser, a writer, the route branch, the undo read and write, the History word and a client function, with 12 cases.
- A pure rows module.
- A new view with a table of contents, search, four control kinds, the gear menu, the modified bar and three embedded partials.
- The folder splits of section 4.
- Changes to three existing view and check tests, and the docs.

My judgment is that one builder is unlikely to deliver the whole brief in one run with every behaviour held. The step holds three concerns, each the size of a whole step elsewhere in this ledger:
- The catalog: 117 code lookups and descriptions, the check, the `LOCAL_KEYS` export, `desc_options`, `EXPECTED`, and the DESIGN.md and HELP.md table rows.
- The `config-key` write: `bodies.ts`, the writer reusing `replaceValue`, the `writes.ts` branch, undo, the History word, the client function and cases 6-12. It can be built against a fixture catalog.
- The editor and the docs: item 4, item 5, `settings.test.ts`, `type-scale.test.ts` and cases 13-15.

The descriptions are where a single run is most likely to be thin, and no check catches that (section 5, finding 1). A split into S3a (the catalog), S3b (the write) and S3c (the editor, after both) gives three briefs a builder can read whole. S3a and S3b share no path apart from the catalog's shape, which the brief fixes. The split is the user's ruling, as Q85a's was (Z96).

Findings:
1. The step is too large for one builder in one run. The split above, or another the user rules, is an open item for him.

## Declined to judge

- Whether Z118, ruled by the orchestrator in automode, may settle four shapes a reader of the config sees. The step line carries only `(ruling Z75) (ruling Z77) (ruling Z94)` (`plan.md:177`). That is the user's call.
- Whether `options.yml` wraps its map under one top-level key (section 1, finding 1) is a shape change to Z94 (2) (a), which the orchestrator or the user settles.
- Whether `focus_label_mode` is removed from `layout.yml` or given a reader. That is a change to a config key and the user's call.
- The conflict between the family rule (Z94 (1) (c), Z94 (4) (b)) and D29's per-language keys with controls. It belongs to D25 and D29, and to the user.
- Whether a third copy of the write-route branch shape in `writes.ts` trips `tests/checks/tree/duplication.test.ts` (jscpd at 8 lines and 50 tokens, `duplication.test.ts:47-48`). The two existing branches share about 9 lines once comments are set aside. Not run.
- Whether a settings-editor library for Svelte 5 exists. No external search was made.
- The full suites, `npm run check`, the build and `npm run diagrams`: not run, by the limits of this check.
- `config/local.yml`: not opened.

Agent usage: claude-opus-5-5, about 225,000 tokens (not verified), 66 tool uses, minutes not verified.

Usage: brief-check agent ad317003da9385feb, served claude-opus-5-5; 239,006 tokens, 95 tool uses, 16.2 min (from its completion notice)
