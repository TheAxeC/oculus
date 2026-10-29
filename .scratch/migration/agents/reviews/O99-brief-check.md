# Brief check: O99

Usage: a5e0fbddd32b98bcf, claude-opus-5-5, 258157 tokens, 106 tool uses, 12 min 12 s.

Run from `/Users/axelfaes/workspace/oculus` on main at fc0998bd8.

## Names

- N1. `git grep -n "EditLink\|settings_machine_edit_in\|settings_open_unavailable\|settings_edit_in\|settings_machine_edit_tip" -- src config tests docs README.md ':!config/local.yml'` hits only inside the write paths: `config/text/views/system/workbench.yml:175,176,187,188,194`; `Settings.svelte:64`, `editors/Origins.svelte:30`, `settings/Control.svelte:7,36,119,137`, `settings/EditLink.svelte:87,89,93`, `settings/Item.svelte:292,296,298,357,362`, `settings/List.svelte:137,185`. Verify 4 requires `settings_open_unavailable` gone, which also reaches three places "What to build" does not name: the per-row file-and-line link (`Item.svelte:355-366`), the file rows of the Catalogs, Schemas and Texts groups (`List.svelte:170-188`), and `Origins.svelte:30`, which opens `.oculus/settings.yml` for `editor.languages`. The brief must say whether those go or how they change.
- N2. `grep -rn "ships none\|ships neither\|shipping none" src config docs tests README.md --exclude=local.yml` prints the `config/defaults/behavior.yml` lines (79, 84, 88, 91, 251, 268), `rows/read.ts:5`, `options/behavior.yml:238`, and four hits the change leaves true: `src/lib/data/sources/config/catalogs.ts:94` (the icon package), `src/lib/data/shapes/catalog-files/vocab.ts:6`, `merge/in-place.ts:77` and `config/options/catalogs/vocab.yml:357` (`leads_fit`). Verify 4's second grep cannot print nothing without rewording true sentences; it needs narrowing to the shipped keys.
- N3. Sentences that state the old rule in other words, which verify 4 does not reach: `config/options/behavior.yml:204,211` ("Empty makes no key"), `:216` ("Empty tells no failure apart"), `:306` ("Empty downloads nothing"), `:772` ("With none, the search says no source is configured"), `:1194`, `:1681`, each also "This is a setting of the hub, kept in the hub's .oculus/config.yml"; `src/lib/data/helpers/hub-names.ts:680-697` (the `HUB_LIST` comment), not in the write paths; `src/lib/views/personal/account-setup/ClusterSteps.svelte:3`, not in the write paths; `config/text/views/personal/account-setup.yml:128-129` and `config/text/views/sources/data.yml:72`, under a path the brief limits to the views it changes. Docs for "Doc text": `docs/HELP.md` 240, 329, 344, 555, 591, 597, 598; `docs/data-map.md` 81, 126-143; `docs/templates.md` 39, 132-201. `src/lib/views/feeds/literature/Literature.svelte:18-21` stays true only for a hub that removes every row.
- N4. `LOCAL_KEYS`: product hits only in `config/options/local.yml` and `local.ts`, both written; the name is not changed.
- N5. `docs` of `Page`: `model.ts:130-140,412,422`, `saved/saved.ts:102,110,544-545`, `saved/docs.ts`, `open/float/rail-pages.ts:12`, `open/float/pages.ts:297`, in the write paths; `src/lib/shell/Workbench.svelte:278-279` too. The new views record is a key in a saved record under `~/.oculus`, which the brief does not name: a user-visible shape by `spec.md:18`.
- N6. `registries` and `venues-browser`: `config/defaults/layout.yml:124-133` (written), `docs/HELP.md:143,218,327` (unaffected).
- N7. Guarded entries made false and missing from the read list: G8 (`guarded.md:73`, the Settings writers never write a `local.yml` but `self` and `clusters:`), G96 (`:320`, the per-row chosen hub, `tests/state/system/settings/chosen-hub.test.ts`), G77's `tests/routes/machine/debug.test.ts` rows, G13's `.oculus/cpp.yml` rows, G2's deck routes, G83, G136's 'case 15: a primary hub with no literature.sources' (`tests/server/core/reader/reader.test.ts:168`), the `neither` row of `tests/data/hubs/connection-keys.test.ts:45`.

## The step line

- `plan.md` has no `## Goal` section; the goal the prompt states was used.
- Ruling 519 maps to items 1, 3, 5 and 6; the "26" is ruling 519's, not the step line's, and the tree holds 21 (`grep -nE "^    [a-z_.]+:" config/options/local.yml`). Rulings 520 and 522 map to item 2, 521 and "O99 scopes" to item 1, with no case for "a hub made". Ruling 537 maps to item 7, whose `remove: true` contradicts "as `categories` is by `key`": the merge's shape is `{ <field>: x, removed: true }` (`in-place.ts:9`). Rulings 538 and 541 map to items 8 and 7. Ruling 526's note: `grep -n "path: the path the value is read at" config/options/behavior.yml` prints 965, 1061, 1307, 1408, 1641, five places in three lists; `links` has no field record; "the four lists" matches neither.
- Parts with no requirement: removing Show Defaults (`List.svelte:139-147`), which only reads oculus's defaults, is a reading of "folder-file lines" the brief does not mark as a decision; item 8's no-record rule also gives back every shipped tab the reader closed, beyond "each view newly added".

## Premises

- Reproduced: every count and line of "What is on the tree" except those below.
- P1. `grep -n "ships none" config/defaults/behavior.yml` prints 79, 84, 88, 251, 268; line 91 reads "Oculus ships neither"; 251 was missing.
- P2. The worktree and base copy do not exist yet; expected before dispatch.
- P3. `connections.failures` rows have no identifying field the code reads (`settings/connectors.ts:134-159` reads `kind`, `for`, `match`, `fix`, first match wins); a merge by row changes first-match order. `sign_in` rows are read by `key`.
- P4. Case 8 is impossible: a folder is a hub only if it holds `.oculus/config.yml` (`src/lib/data/sources/manifests.ts:71-72`).
- P5. Case 19's `per_source` is no row field; it is the top-level `literature.per_source` (`config/options/behavior.yml:756`).
- P6. `config/options/present.yml` describes only `defaults.tag_tones`; a deck's keys are in `config/schemas/deck-schema.yml` (`deck.title`, `defaults.tag_tones`, `groups` with `find`, `sort`, `discover`, `slides`, and `order`), read by `src/lib/data/sources/deck/spec.ts:70-75`. The cpp.yml fields are in `config/schemas/cpp-schema.yml`.
- P7. `config/options/schemas/manifest-schema.yml` is missed by item 3.
- P8. `other-rows` sits at `settings/other-rows`.
- P9. `settings/` holds 10 items, the limit; so do `src/lib/state/system/config`, `src/lib/data/sources/config` and its `merge/`, `settings/`, `catalog/`, `src/lib/state/workbench/layout`, `src/lib/views/shared/forms`, `src/lib/shell`, `src/lib/shell/keys`, `src/lib/server`. `Item.svelte` is 492 lines.
- P10. The File menu's Save All exists (`src/desktop/windows/menu-template.ts:192`, `src/lib/shell/window/menu-answer.ts:67`, `src/lib/state/client/context.ts:734`, `src/lib/state/sessions/source/autosave.svelte.ts`); Cmd+S reaches `src/lib/shell/keys/workbench-keys.svelte.ts:264`, `src/lib/shell/window/source-keys.ts:28`, `menu-answer.ts:188`. None of `src/lib/shell/window/`, `context.ts`, `autosave.svelte.ts` is in the write paths.
- P11. The Catalogs, Schemas and Texts groups are file rows of oculus's own files (`groups.ts:205-218`, `view/folders.ts:1-4`); the brief does not say what they become.
- P12. The removal shape exists: `{ <field>: x, removed: true }` (`in-place.ts:9,36`).

## Cases and checks

- Case 7: `port` is read from the primary hub's file only (`config/options/local.yml:11`) and moves the server at once; "the DOM holds no secret" is a page check the builder cannot run; the proof that no route or channel answer carries the secret is not asked.
- Cases 8, 15 and 19 as P4, P6, P5; case 9 misses P7.
- The case ruling 538 is about (a record lacking only the new view gains it once; a closed tab is not given again) is missing.
- Verify 4 as N1 and N2.
- The brief does not say which guarded entry each kept test falls under; G8 and G96 are not in the read list.

## The question

- Could pass without the goal: case 4 in part (no "hub made"), 6 in part (File menu, Cmd+S with another scope changed), 7 (a secret in a payload), 9 (a raw-YAML box counts as a control; schemas missed), 12 in part (only O97's fixture rows surveyed), 13 in part (debugger schema unchecked), 15 (`tag_tones` alone), 16 in part (`key_none`, `key_beside`, `key_missing` not run), 21, 23. Items 2, 3, 5, 7 (no identifying field for failures) and 8 likewise. The rest: no.

## Implied inputs

1. A secret written through This machine and History: the `self` write records `before` and `after` (`src/lib/server/edit/writes/config/config-key.ts:223,357,397`); expected no record, channel or answer holds a secret.
2. A secret field left empty on save: the stored secret kept.
3. Primary hub scope and Hub scope with the primary picked, both with unsaved changes to one file: one combined write or a refusal, never an overwrite.
4. `primary` changed while the Primary hub scope holds changes: they stay with their file.
5. A folder renamed: `primary` carried; an empty, invalid or taken name refused (`src/lib/server/files/workspace/folders.ts:6-13`).
6. A save while the file changed on disk: refused with the file named, changes kept (G8).
7. A scope file that does not parse: the scope says so and writes nothing.
8. A hub that removes and re-adds a shipped row: today two rows naming one key apply neither (`in-place.ts:12-13`); that finding, oculus's row standing.
9. Shipped `literature.sources` with no `literature.prefer` in oculus: state the order.
10. `connections.failures` order under the merge.
11. A no-record page regaining closed tabs; which pane gets a new view on a rearranged page.
12. The name of the saved views key; an empty or duplicated entry ignored.
13. `key_beside`, `key_missing` and a primary key on a list or map field (`docs/data-map.md:57`).
14. Save All with the unsaved workspace: the name question first.
15. A hub removed from the workspace while its scope holds changes: the reader told, nothing written.
16. The Repository scope's keys: the `editor:` block (`src/lib/data/sources/config/editor-options.ts:1-3`).

## ADRs

`ls docs/adr` prints "No such file or directory"; `git ls-files | grep -i adr` prints nothing. None.

## Dictated text

The brief is ASCII. The scope words (line 29), "set" / "not set" (31), "Save" and "Save All" (30, 47, 88; "Save All" exists as `desktop.menu.save_all`, `config/text/desktop.yml:67`, and is reused), the three shipped values (35) and `primary_key: true` (33, 57) hold. `remove: true` (35) breaks `spec.md:88`'s reuse rule and ruling 537.

## Declined to judge

- `guarded.md` read in part (lines 1-63 and G3, G8, G12, G13, G14, G29, G96, G126, G133, G136-G138), the rest grepped for `local.yml`.
- Values kept as text in the hub's shipped rows beyond O97's eleven.
- Whether removing Show Defaults is within ruling 519.
- The look; `.oculus/local.yml` files and `~/.oculus/connect/`, by the hard limits.

## Closed

Every finding is closed by a change to `agents/briefs/O99.md`; none changes the part the step builds or makes a choice Axel has not ruled.

- N1, P11: "What to build" item 3 now says what goes (every way of editing a user's file as text: EditLink, the per-row file-and-line link, `Origins.svelte`'s link) and what stays (Show Defaults and the Catalogs, Schemas and Texts rows, which only show oculus's own files read-only); decision 5. Verify 4's first grep keeps `EditLink` and `settings_machine_edit_in` and drops `settings_open_unavailable` unless no kept row uses it.
- N2, P1: the premise lists lines 79, 84, 88, 91, 251, 268; verify 4's second grep is narrowed to `config/defaults/behavior.yml`, `rows/read.ts` and `config/options/behavior.yml`'s entries of the shipped keys.
- N3: the paths widen to `src/lib/data/helpers/hub-names.ts`, `src/lib/views/personal/account-setup/ClusterSteps.svelte`, `config/text/views/personal/account-setup.yml`, `config/text/views/sources/data.yml`; item 7 names the options lines; the docs lines go to "Doc text", named in the report section.
- N5, implied 12: decision 6 names the saved key `views` beside `docs`, reported as a decision.
- N7: the read list adds G2, G8, G13, G77, G83, G96 and G136 and the `neither` row; the guarded entries' new text goes to "Doc text"; a test with no entry is handed back before it is written (`spec.md:59`).
- The step line: "Step text said 26" corrected to "Ruling 519 said 26"; item 4 says five places in three lists; case 4 adds "a hub made"; item 7 uses `removed: true`.
- Show Defaults and no-record pages: decisions 5 and 7, the no-record rule being the one ruled for documents ("as a hub document already is", ruling 538).
- P3, implied 10: `kind` is the field that tells failure rows apart (the hub's six rows carry six kinds, `match` repeats `Permission denied (publickey)` twice), so ruling 537's "the field that tells its rows apart" settles it; decision 8 sets a hub's new failure rows before oculus's, so a hub's own text is matched first; `sign_in` by `key`.
- P4: case 8 is now This machine with no `local.yml` and Repository with no `settings.yml`.
- P5: case 19 changes a row's `name`.
- P6: item 5 and case 15 name `config/schemas/deck-schema.yml` and every key it describes; the cpp form `config/schemas/cpp-schema.yml`.
- P7: item 3 and case 9 add `config/options/schemas/`.
- P8: the path reads `settings/other-rows`.
- P9: the conventions say a folder at its ten-item limit takes a new subfolder.
- P10: the paths add `src/lib/shell/window/`, `src/lib/state/client/context.ts`, `src/lib/state/sessions/source/autosave.svelte.ts`; item 2 reuses the existing Save All row and `desktop.menu.save_all`.
- P12, dictated `remove: true`: item 7 and decision 3 use `removed: true`.
- Case 7: on the primary scratch hub; the DOM clause replaced by a test that no route answer, channel push or History record holds the secret.
- Case 21: the main case added as case 21; the no-record page is case 22.
- The question: case 9 says a raw text box is no control; case 13 checks the debugger's schema fields; case 16 runs `key_none`, `key_two`, `key_beside` and `key_missing`; case 12 extends to every shipped row.
- Implied inputs 1 to 16: cases 24 to 36.
