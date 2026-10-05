Everything in the brief is done. Two proofs are not mine and were not run: the look on TEST at landing, which the brief assigns to the orchestrator, and the watcher rebuild that carries `optionFindings` into the config payload (case 60 is a scratch run of `optionFindings` on a scratch engine folder plus the two call sites read at `src/lib/server/root/context.ts:309` and `src/lib/server/root/watch/portfolio.ts:520`).

# S5 report: the Settings view's controls and headings

## Open items of the state file

- None.

(Quoted from `tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", line 197.)

## The round 0 ruling, the false premise, the key format

- Held-value rule (`agents/briefs/S5-cases.md`, item 1): item 7.3 and Decision 6 of the brief are replaced by it, and `src/lib/server/edit/writes/config/config-fit.ts` and `src/lib/state/system/config/editors/fields.ts` apply it. A record equal at every depth to a record of the base passes whole. In a changed record a field passes unchanged when the base held that value at that field (the record at the same key for a map family, any record of the option for a list family), unless its check reads another field of the record (`allow_missing` naming a toggle, `values_by`), which is always checked. The undo checks type alone. The test `readsOther` for that exception lives once in `src/lib/data/sources/config/catalog/options.ts` and both sides import it.
- Case 35 under the rule: the shipped `scan` rule with `optional: true` passes untouched, and a rule with a missing folder and `optional: true` is accepted; the same rule with `optional` off is refused on the page ("The folder projects/nonexistent is not in the hub.") and by the server ("Entry 8, field dir: This option takes a folder of the hub, and projects/ghost is not one").
- Case 22 under the rule: `chartreuse` at a `tab_split` key whose base record did not hold it is refused ("Entry idea, field value: This option takes a hue name of the palette"); kept at the key that holds it it is accepted; at another key of the same map it is refused.
- Item 1.6 and case 10, premise false: no closed-groups list is saved. Command: `grep -rn "toggledGroups" src` prints `src/lib/state/system/config/groups.ts:286`, `:296` and `src/lib/views/system/workbench/settings/Contents.svelte:14`, `:42` only; the closed groups are the `closed` state of `Contents.svelte`. A Settings tab opened afresh or after a reload draws every heading open. No saved list is added.
- Finding key: `<config file>:<key path>` with a field as one more dotted segment, `behavior.yml:probe` and `behavior.yml:probe.name`; the file of a finding is `config/catalogs/options.yml`. T1 uses this form.

## First run of the 65 cases

Each case was run on the unchanged tree before any change, and again after the last change. "Base" means the copy `.agents/worktrees/S5-base`. For the server cases the base column is a scratch run of the base's `writeConfigKey` and `writeConfigValue` on a scratch engine folder (log `/tmp/s5-server-base.log`, scratch test kept in the scratchpad, not in the tree); for the page cases it is the base code read with the line given, since the base has no function for the new behaviour to call. The after column quotes the scratch runs of the final tree: S is the state log `/tmp/s5-state.log` (134 lines, 0 FAIL), V is the server log `/tmp/s5-server.log` (29 lines, 0 FAIL). Both scratch test files are outside the tree (`scratchpad/hold/`) and were run with `npx vitest run` from `tools/oculus` of the worktree.

Facts of the base used below: B1, `grep -cE "^ +heading:" config/catalogs/options.yml` prints 0, so the base has no subject headings and its groups are the five file names (`src/lib/state/system/config/groups.ts:26`); B2, `CONTROLS` has five words, toggle, number, text, choice, list (`src/lib/data/sources/config/catalog/options.ts:21`); B3, `grep -cE "^ +(min|max):" config/catalogs/options.yml` prints 0; B4, the base draws every list and family entry through flow-text boxes (`src/lib/views/system/workbench/editors/Cards.svelte:50` TextInput, `:85` flowText); B5, `grep -rn optionFindings src tests` over the base prints 0 lines.

| Case | Unchanged tree | After the change |
|---|---|---|
| 1 | Not met: B1. | S: 13 group titles in order Appearance, Editor, Terminal, Sessions and usage, Cluster, Boards and audit, Rail and pages, Presentation, Project sources, Calendar and mail, This machine, Catalogs, Texts; the table of contents has a section list per heading. |
| 2 | Not met: one group per file, so no heading holds two file lines; the local.yml group carries the local tag (`groups.ts:65`). | S: Editor has the lines behavior.yml and sources.yml with descriptions; This machine one line tagged local; Appearance one line. |
| 3 | Partly: a file that is not readable keeps its own group with the reason (`search.ts:80`); no heading to hold two files. | S: unreadable "sources.yml could not be read: EACCES", loading "Reading sources.yml...", cut "sources.yml is longer than the file window reads, so its settings are not listed.", unparsed "sources.yml is not valid YAML, so its settings are not listed: ..."; Project sources shows the line and no row; Editor keeps the behavior.yml rows. |
| 4 | Not met: the rows sit in the behavior.yml, sources.yml and local.yml groups. | S: Cluster[Slurm: slurm.resource/slurm.days/slurm.poll_min/slurm.quota_min/slurm.prewarm], Project sources[Registry and feed files: resources_file], This machine[HPC host: hpc_host], and no other group. |
| 5 | Not met: no Presentation heading. | S: 18 of 18 rows of the heading kept, the only group kept is presentation. |
| 6 | Met on file groups: `@modified` is `MODIFIED_FILTER` (`search.ts:19`). | S: with `editor.tab_size: 2` in behavior.yml the result is `Editor/editor.tab_size` alone; with the shipped files 0 rows. |
| 7 | Met on file groups (`search.ts:80`). | S: with every file loading 11 groups are kept under an empty query and dropped under a typed one. |
| 8 | Met on the local.yml group: its text is never asked for (`groups.ts:9`). | S: 18 rows, each with description, no value, no control. |
| 9 | Partly: the five number boxes exist with 15, 31, 62, 10, 25 and no range (B3). | S: calendar.poll_min 15 (1 to 35791), calendar.days_back 31 (0 to 3650), calendar.days_ahead 62 (0 to 3650), mail.poll_min 10 (1 to 35791), mail.per_signal 25 (1 to 500). |
| 10 | Premise false, see above: the grep on the base prints the same two files. | The same grep on the final tree prints the same two files; no saved list added. |
| 11 | Not met: B1. | S: with an entry lacking a heading, group order is `...,calendar,unheaded,machine`; with every entry headed, no `unheaded` group. |
| 12 | Not met: B2, B4. | S: card fields key focus, label Focus, glyph focus, chord f; key pool focus, sessions, projects, incoming, explorer, academic, pillars, references, present, help, views; chord a to z with an empty item. |
| 13 | Not met: B2, B4. | S: picking teal for idea writes `{"active":"green","manuscript":"amber","idea":"teal"}`. |
| 14 | Not met: no hue picker (B2). | S: 26 hues, red through slate, no muted and no shade. |
| 15 | Not met: B2, B4. | S: card `{"key":"markdown","word_wrap":"on"}`; ruler 80 writes `{"word_wrap":"on","rulers":[80]}`, no `insert_spaces`. |
| 16 | Not met: no unset state. | S: insert spaces pressed gives true, false, absent. |
| 17 | Partly: the base server refuses 9 with "editor.languages.markdown.tab_size is outside the values the editor takes; the default is used" (base run); the page has no range (B3). | S: "Entry 2, tab_size: It must be a number from 1 to 8." and nothing handed on; V: "Entry markdown, field tab_size: This option takes a number from 1 to 8". |
| 18 | Not met: no colour control (B2). | S: title, desc, color #ea580c read as orange, maturity scoping; green writes `#16a34a`, amber `#b45309`. |
| 19 | Not met: B2. | S: `outputs` colour `#0ea5e9` is sky and unmarked; an unchanged draft writes the same value. |
| 20 | Not met: B2. | S: `#16A34A` reads as green. |
| 21 | Server met: the base accepts a Save that keeps the muted colour (base run); the page marks nothing. | S: `meta` `#64748b` is stray and an unchanged draft writes the same value; V: a Save changing `label` accepted, a hex in no class refused "Entry meta, field color: This option takes a colour of the palette that is a hue". |
| 22 | Not met: the base server accepts `chartreuse` written to a key that did not hold it (base run: accepted). | S: `chartreuse` is shown and stray; V: refused at `idea` ("Entry idea, field value: This option takes a hue name of the palette"), accepted at the key that holds it, refused at another key. |
| 23 | Not met: text control, and the base server accepts `this-mac` (base run: accepted). | S: pool is `utwente` alone; V: `this-mac` refused "This option takes one of the items of the list clusters", `utwente` accepted. |
| 24 | Not met: B2, B4. | S: view [hpc, usage], dock right, size 0.3 held to 0.1 to 0.6. |
| 25 | Not met: B2. | S: a string `hpc` reads as a list holding hpc; hpc alone writes `"hpc"`, adding usage writes `["hpc","usage"]`. |
| 26 | Not met: B2, B4. | S: `joint-work` match [exploring]; `funding` match [in-prep, in prep, submitted] none stray. |
| 27 | Not met: B2. | S: four values, none stray. |
| 28 | Not met: B4. | S: `engine` cards with n "1", title, body; a card added writes n as the string "4". |
| 29 | Not met: B4. | S: a title change writes no `cards` key. |
| 30 | Not run on the base. | S: a `cards` list holding a non-record gives no draft, so the family keeps the way to edit the file. |
| 31 | Not met: B2. | S: the three values chosen and only those offered. |
| 32 | Not met: the base list has Add and the base server accepts an added signature (base run: accepted). | S: empty parked list, an added item reads as a problem; V: "This list only drops items; an item is added from the Audit view". |
| 33 | Not met: text control; the base server accepts `registries/nope.yml` (base run: accepted). | S: typing `registries/` offers datasets.yml, people.yml, venues.yml; "The file registries/nope.yml is not in the hub."; V: "This option takes a file of the hub, and registries/nope.yml is not one". |
| 34 | Met: the base accepts an absent file (base run: accepted). | V: accepted. |
| 35 | Not met: the base accepts both rules (base run: accepted twice). | The ruling above; S and V quoted there. |
| 36 | Not met: B2, B4. | S: the shipped scan rules read with tier chosen; the side-projects rule's `type` is stray and kept; the coauthor rule's `type` and `optional` unset. |
| 37 | Not met: the base accepts `workspace/x` (base run: accepted). | S: "It must be an absolute path or one that starts with ~/."; V: "Entry 1, field dir: This option takes an absolute path or one that starts with ~/", `~/x` and `/abs/x` accepted. |
| 38 | Not met: the base accepts `bin/tool` (base run: accepted). | S and V: "This option takes an absolute path or one that starts with ~/", empty accepted. |
| 39 | Not met: plain text box, no suggestions. | S: suggestions `wallhaven-83do1o.jpg`, `other.png` and no `README.md`; empty accepted. |
| 40 | Not met: the base accepts `../x` (base run: accepted). | S: suggestions say loading, then failed; V: "This option takes a path inside the hub, written relative to it, with no .. and no backslash". |
| 41 | Not met: text controls; the base accepts `cli` (base run: accepted). | S: choices opus, sonnet, haiku, fable with an empty item "the command line chooses the model"; picking it writes `""`; `git.message_model` shows the empty item, `usage_refresh_model` has none; V: `cli` refused "This option takes one of the items of the list models". |
| 42 | Server met: the base accepts `''` (base run: accepted); the control is text. | S: empty item "no prefix"; V: accepted. |
| 43 | Not met: text control. | S: 66 items, From the theme and the Shiki ids; an unbundled id is marked. |
| 44 | Not met: B2, B4. | S: `mocha` class holds rice and mocha, `light` holds none; 17 theme classes; an unchanged draft writes the same value. |
| 45 | Not met: B2. | S: refs for title none, framing [engine, transition], summary [summary1, summary2], project from the slide ids, pool state ready. |
| 46 | Not met: B2. | S: `papers` keys journal and conference, none stray. |
| 47 | Not met: the base accepts five and seven headings (base run: accepted twice). | S: slots title, authors, venue, status, focus, next; V: "This option takes exactly 6 items: title, authors, venue, status, focus, next" for both. |
| 48 | Not met: a plain list. | S: the stray domain is marked and kept. |
| 49 | Not met: no value sources; the base accepts a non-domain with a portfolio (base run: accepted). | S: before the snapshot data_domains, slurm.resource, deck.order refs and deck.tag_tones show the loading sentence; V: no portfolio gives type alone (accepted), a portfolio refuses "This option takes one of the items of the list domains". |
| 50 | Not met: B2. | S: the key is a text box with `suggest_from: usage_tiers`, the value text. |
| 51 | Met on the server: the base refuses `docx` to `Word` with "config/behavior.yml: open.program_ext must map extensions, each with its dot, to bundle ids" (base run). | S: key text, value text suggesting bundle ids; V: the same sentence. |
| 52 | Not met in this form: B4. | S: `{form: pairs, keyed: true, cards: []}`, an empty editor with Add. |
| 53 | Not met: B4. | S: card `{"key":"yaml"}` keeping `tab_size: "4"`; a Save changing word wrap writes `{"tab_size":"4","word_wrap":"on"}`. |
| 54 | Not met: B4. | S: a record lacking a toggle, choice or number reads each field absent, and Save leaves it out. |
| 55 | Not run on the base: the base holds only flow-text drafts. | S: the S4-shape draft reads into controls with its values; the glyph text "not yaml: [" stays on the card and Save says "Entry 1, glyph: the text is not valid YAML." |
| 56 | Not run on the base. | S: a typed draft with a nested editor round-trips through the tab's state. |
| 57 | Met on the base for a config-value write (base run: 200, the undo returns the file). | V: the hue write answers 200 and the undo gives the file back byte for byte. |
| 58 | Met on the base (base run). | V: a pick of teal over a held `chartreuse` answers 200; the undo puts `chartreuse` back. |
| 59 | Not met: the base server accepts 1.5 (base run: accepted); the page has no range (B3). | S: "It must be a number from 0 to 1." and nothing written, 0.5 writes; V: "This option takes a number from 0 to 1". |
| 60 | Not met: B5. | V: the shipped catalog gives no finding; a scratch copy with `control: colours` gives `appearance.yml:terminal.mac_option_is_meta | control colours is not one of the controls; the option is drawn as a text box`. The finding reaches the payload at start (`context.ts:309`) and on each push (`portfolio.ts:520`), read, not run. |
| 61 | Not applicable: B1. | S: `HEADINGS` holds 10 distinct ids, none equal to `this-browser`, `machine`, `unheaded`, `catalogs` or `texts`; a full list has 13 distinct group ids. The code has no collision handling: a repeated id would give two groups with one id, so the ids above are the guarantee. |
| 62 | Not applicable: the base has no folder suggestions. | S: `offerFor` is a function of the typed text and the lists alone; a text whose folder is loading answers the loading note, the next text answers its own folder's entries, so only the latest text's suggestions are drawn. After the tab closes, the row writer and the editors' writer ignore every answer still on its way (`src/lib/state/system/config/write.ts:102`, `editors/writer.ts:108`); the listing itself is the file browser's store (`Settings.svelte`, `folder()`), not state of the view. |
| 63 | The base writer keeps its answer per row id and checks at submit time. | Unchanged: `commit(row, input, lists())` reads the lists once at submit (`write.ts:103`), the answer is kept per row (`saying`, `showing`), and the marks of `FieldControl.svelte` (`stray`, `pool`, `offer`) are `$derived` from the `lists` prop, so they redraw when the snapshot lands. Read, not run in a browser. |
| 64 | Not applicable: the base route test passes with `'queued'`. | With `'queued'` the route test (scratch copy, line 39 changed back) fails: the write answers `{"ok":true,"changed":[],"refused":[{"field":"behavior.yml:waiting_status","reason":"This option takes one of the items of the list entry_statuses"}]}`, and the test then stops with `TypeError: Cannot read properties of undefined (reading 'at')` at `tests/routes/edit/write-fixture.ts:200` because no change was logged. With `'revision'` (the shipped file) `npx vitest run tests/routes/edit/config-value.test.ts tests/server/edit/config-value.test.ts` prints `Test Files 2 passed (2)`, `Tests 4 passed (4)`; `tests/server/edit/config-value.test.ts` is unchanged. |
| 65 | Met on the base: the `languages` map and `show_tabs`, `editor_actions` writes are accepted (base run). | V: associating `.foo` with `python` through `writeConfigValue('sources.yml', 'languages', ...)` accepted; `show_tabs` single and none, `editor_actions` hidden and strip accepted. |

## Item 6.4 run of the shipped config

Command: a scratch Python script in the scratchpad (`scratchpad/s5-compare.py` with the table as data in `scratchpad/table.py`, neither in the tree), reading `config/catalogs/options.yml` with `yaml.safe_load`. Output:

```
entries outside local.yml: 132 | table rows: 132
local.yml keys: 18
differences: 3
  behavior.yml:chat.model: empty 'the command line chooses the model' != True
  behavior.yml:git.message_model: empty "the command line's own default model" != True
  layout.yml:direct_chord: empty 'no prefix' != True
```

The 132 entries match the table's 132 rows in heading, section, control, keys, ranges, sources and every family field (names and controls, nested record fields included); the 18 `local.yml` keys match the machine sections of the table. The three differences are one thing: the table writes `empty` and the shipped entries write `empty: <words>`, the extension named under the judgment calls, because cases 41 and 42 need the words of the empty item.

## Tests the step adds or changes

- T1, `tests/data/sources/config/catalog/options.test.ts`, 'names the key of each entry it cannot read and reads its control as text'. On the unchanged tree: `Error: Cannot find module '../../../../../src/lib/data/sources/config/catalog/option-findings.ts' imported from .../tests/data/sources/config/catalog/options.test.ts` at `options.test.ts:7:1`. With the behaviour removed on a scratch copy (the `min > max` check and the unknown-heading check taken out of `options.ts`): `AssertionError: expected [] to deeply equal [ [ "/engine/config/catalogs/options.yml", "behavior.yml:probe" ] ]` at `options.test.ts:70:61`.
- T2, `tests/checks/config/config.test.ts`, 'reads the shipped options catalog with no finding'. On the unchanged tree: `TypeError: optionFindings is not a function` at `config.test.ts:527:16`. With the behaviour removed (the base `options.yml` put back, which has no headings): `AssertionError: expected [ Array(132) ] to deeply equal []`, the first finding `appearance.yml:themes | the option names no heading; it is listed under Without a heading`.
- Edited assertion, `tests/routes/edit/config-value.test.ts:39`: `const next = ['pending', 'submitted', 'under-review', 'queued'];` became `const next = ['pending', 'submitted', 'under-review', 'revision'];`. The value `queued` is outside the list `entry_statuses`, which the write now refuses (case 64).
- No other test was added or changed. The scratch tests of the cases above are outside the tree.

## DONE / NOT DONE

| Part of the brief | Status | Proof |
|---|---|---|
| 1 Twelve subject headings, file lines, say-why lines, `unheaded`, This machine, Catalogs, Texts | DONE | S cases 1 to 11 and 61, above. |
| 2 Catalog vocabulary and reader (`heading`, `section`, the new controls, `optionFindings`) | DONE | Item 2 below: 6 files, 80 tests passed. |
| 3 Value sources, page and server | DONE | S cases 23, 26, 27, 31, 41, 43, 45, 48 to 51; V cases 23, 41, 49. |
| 4 Controls on the page through one shared partial (`editors/FieldControl.svelte`); `settings/` stays at 10 items | DONE as code; the look on TEST is the orchestrator's | `svelte-check` 0 errors, `eslint` clean, `sh utils/folder-check.sh` prints nothing. No component was rendered. |
| 5 Typed draft (`draft.ts`, `slots.ts`, `writer.ts`, `typed.ts`) | DONE | S cases 12 to 16, 24 to 31, 44 to 56. |
| 6 `options.yml` rewritten to table 6.4 | DONE | Item 6.4 run above. |
| 7 Server writes (`config-fit.ts`, refusal sentences) | DONE | V cases 17 to 65 above; items 3 and 5 below. |
| 8 Every setting shows its value with marks and loading and failed sentences | DONE as state and code | S cases 21, 40, 43, 48, 49; not rendered. |
| 9 Docs and every head comment made false | DONE | The 'rewritten' and 'still true' lists below. |

Verify list, from `tools/oculus` of the worktree, after the last change:

1. `npm run diagrams`: 2 runs, `diagrams exit 0`. `npm run test:quick` after it, final lines of the last run (through `checks.sh`): `test:quick: 22.1 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`, `exit 0`; its `svelte-check` line `COMPLETED 358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `eslint (21.4 s)`, `prettier ... All matched files use Prettier code style!`, `ASCII gate`.
2. `npx vitest run` over options.test.ts, config.test.ts, config-folder.test.ts, keys.test.ts, boundaries.test.ts, size.test.ts: `Test Files  6 passed (6)`, `Tests  80 passed (80)`.
3. Each alone: `tests/server/edit/config-key.test.ts` 2 passed; `tests/server/edit/config-value.test.ts` 3 passed; `tests/routes/edit/config-key.test.ts` 1 passed; `tests/routes/edit/config-value.test.ts` 1 passed; `tests/routes/edit/undo/undo.test.ts` 9 passed.
4. T1 and T2: quoted above.
5. Guarded entries whose Code line names a changed path: G8, G12, G13 and G32 (found by matching each Code line of `agents/guarded.md` against the changed files), and G9 by name; each test file run alone, all passed: G8 `tests/routes/edit/audit-mute.test.ts` 1, `rail.test.ts` 2, `roots.test.ts` 2, `tests/server/edit/config-key.test.ts` 2, `config-value.test.ts` 3, `deck-edit.test.ts` 1, `feeds.test.ts` 5, `writes-collection.test.ts` 3, `writes.test.ts` 5, `tests/server/sessions/overrides.test.ts` 2; G9 `tests/server/core/changes.test.ts` 6, `tests/routes/edit/undo/undo.test.ts` 9; G12 `tests/checks/config/config.test.ts` 29; G13 `nesting.test.ts` 1, `agents-catalog.test.ts` 1, `options.test.ts` 2, `languages.test.ts` 1, `local.test.ts` 14, `rail.test.ts` 1, `settings.test.ts` 11; G32 `normalise.test.ts` 1, `career.test.ts` 2, `collections.test.ts` 1, `docs.test.ts` 2, `feeds.test.ts` 1, `manifests.test.ts` 1, `personal.test.ts` 2, `present.test.ts` 1, `registries.test.ts` 1.
6. `sh utils/folder-check.sh`: prints nothing, exit 0.
7. The ASCII gate of `agents/spec.md` over the 53 touched files (the list below plus HELP.md and DESIGN.md): prints nothing.
8. `sh utils/unused-exports.sh` against `S5-base/unused-exports.txt` (`diff` of the sorted files): no line is added. One line is gone, `src/lib/data/helpers/code-themes.ts: codeThemeIds`, because the code theme pool now reads it. Exports the step first left without an importer outside their own file were made local: `SOURCES`, `isSource`, `ValuesBy`, `FileLine`, `MACHINE_GROUP`, `choiceShape`, `TextCard`, `pathTrouble`, `rangeOf`; the re-export of `Card` and `FieldValue` from `draft.ts` was removed; `readsOther` moved to `options.ts`, where server and page import it.
9. Item 6.2 comparison: quoted above.

Number of runs: `npm run diagrams` 2; `npm run test:quick` 4 (one stopped at `svelte-kit sync` with ENOENT on `.svelte-kit/types/src/routes/proxy+page.ts`, the three others passed in 92.5 s, 40.2 s and 22.1 s; the 92.5 s run shared the machine with other processes); `checks.sh` 2; item 2 twice; items 3 and 5 once per file.

## Files

From `diff -rq` of `S5-base/tools/oculus` against the worktree's `tools/oculus` (excluding `node_modules`, `.svelte-kit`, `.scratch`, `local.yml`, `docs`, `demo`, `assets`; the base copy holds `src`, `tests`, `config`, `utils` only). Lines are base then now.

| File | Base | Now |
|---|---|---|
| `config/catalogs/options.yml` |      722 |     1210 |
| `config/text/findings.yml` |      129 |      140 |
| `config/text/server.yml` |       69 |       87 |
| `config/text/views/system/workbench.yml` |      165 |      195 |
| `src/lib/data/file-ops.ts` |      313 |      320 |
| `src/lib/data/sources/config/catalog/option-findings.ts` (new) | - |       59 |
| `src/lib/data/sources/config/catalog/options.ts` |       87 |      523 |
| `src/lib/data/sources/config.ts` |       83 |       84 |
| `src/lib/server/content/images.ts` |      339 |      341 |
| `src/lib/server/edit/writes/config/config-checks.ts` |      292 |      294 |
| `src/lib/server/edit/writes/config/config-fit.ts` (new) | - |      541 |
| `src/lib/server/edit/writes/config/config-key.ts` |      144 |      132 |
| `src/lib/server/edit/writes/config/config-sources.ts` (new) | - |       78 |
| `src/lib/server/edit/writes/config/config-value.ts` |      310 |      212 |
| `src/lib/server/edit/writes/config/config-write.ts` |       91 |      104 |
| `src/lib/server/edit/writes.ts` |      542 |      549 |
| `src/lib/server/root/context.ts` |      732 |      734 |
| `src/lib/server/root/watch/portfolio.ts` |      640 |      642 |
| `src/lib/server/sessions/stores/hooks.ts` |      198 |      209 |
| `src/lib/state/system/config/editors/draft.ts` |      351 |      695 |
| `src/lib/state/system/config/editors/fields.ts` (new) | - |      592 |
| `src/lib/state/system/config/editors/flow.ts` |       54 |       56 |
| `src/lib/state/system/config/editors/slots.ts` |      109 |      154 |
| `src/lib/state/system/config/editors/sources.ts` (new) | - |      143 |
| `src/lib/state/system/config/editors/writer.ts` |      137 |      144 |
| `src/lib/state/system/config/groups.ts` |      225 |      297 |
| `src/lib/state/system/config/messages.ts` |       45 |       54 |
| `src/lib/state/system/config/rows.ts` |      265 |      266 |
| `src/lib/state/system/config/search.ts` |       85 |       87 |
| `src/lib/state/system/config/typed.ts` |       94 |       97 |
| `src/lib/state/system/config/view/gear.ts` |       22 |       38 |
| `src/lib/state/system/config/write.ts` |      160 |      135 |
| `src/lib/ui/forms/Checkbox.svelte` |       43 |       82 |
| `src/lib/ui/forms/NumberInput.svelte` |       18 |       96 |
| `src/lib/ui/forms/choice/HueSelect.svelte` (new) | - |      187 |
| `src/lib/ui/forms/choice/SuggestInput.svelte` (new) | - |      222 |
| `src/lib/ui/theme.ts` |       95 |      108 |
| `src/lib/views/system/workbench/Settings.svelte` |      302 |      341 |
| `src/lib/views/system/workbench/editors/Cards.svelte` |      181 |      323 |
| `src/lib/views/system/workbench/editors/Editor.svelte` |      152 |      182 |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` (new) | - |      362 |
| `src/lib/views/system/workbench/editors/Rollup.svelte` |       81 |      106 |
| `src/lib/views/system/workbench/editors/writer.svelte.ts` |       32 |       35 |
| `src/lib/views/system/workbench/settings/Contents.svelte` |      101 |      102 |
| `src/lib/views/system/workbench/settings/Control.svelte` |      140 |      150 |
| `src/lib/views/system/workbench/settings/Item.svelte` |      322 |      330 |
| `src/lib/views/system/workbench/settings/List.svelte` |      147 |      170 |
| `src/lib/views/system/workbench/settings/writer.svelte.ts` |       23 |       28 |
| `tests/checks/config/config.test.ts` |      522 |      529 |
| `tests/data/sources/config/catalog/options.test.ts` |       11 |       77 |
| `tests/routes/edit/config-value.test.ts` |       51 |       51 |
| `HELP.md` | (not in base copy) |      348 |
| `DESIGN.md` | (not in base copy) |      435 |

## Judgment calls the brief left open

- The held-value rule replaces item 7.3 and Decision 6 (ruling, above). Decision 6 is read as that rule.
- The finding key is `<config file>:<key path>[.field]` (ruling, above).
- `optionFindings` lives in `src/lib/data/sources/config/catalog/option-findings.ts`, not in `options.ts`: `options.ts` is imported by the client state, and the findings read the engine folder with `node:fs`, so they stay on the server side of the data layer. `src/lib/data/sources/config.ts` re-exports it.
- `WriteTarget` gained an optional `entities(kind)` reader (`src/lib/server/edit/writes.ts`, backed by `entities()` in `src/lib/server/sessions/stores/hooks.ts`), so the server checks a choice drawn from the portfolio (domains, clusters) against the portfolio it last published; a target without it checks the type alone (case 49).
- `empty` in a catalog entry takes `true` or the words of the empty item (`empty: the command line chooses the model`), because cases 41 and 42 name the words and the table has no other place for them.
- `slideTagClasses` moved to `options.ts` so the server's `config-sources.ts` and the page's `editors/sources.ts` read one list.
- `readsOther` is defined once in `options.ts` and imported by `config-fit.ts` and `fields.ts`.
- A leaf `multi`, `list` or `parked` row goes through the Editor with Save and Discard, like a family, and is not written on each pick; a single value (toggle, number, text, choice, glyph, hue, colour, folder, file, path) is written as it is made or left.
- A draft in the earlier flow-text form that a tab holds is read into the controls with `typedDraft`; a field text that does not read as YAML stays on the card as `card.unread` and Save names it with `notYaml` (case 55).
- The class of the text box in `src/lib/ui/forms/choice/SuggestInput.svelte` is `.suggest`, not `.text`: `tests/checks/tree/boundaries.test.ts` refuses a view that styles a primitive's own class, and `views/shared/forms/NewIdeaForm.svelte` styles `.text` through `.form :global(.text)`.
- `NumberInput.svelte` takes its value explicitly and marks an out-of-range value with the range words (`mark()`), so a box held to a range works in a row and in a card.

## Host- and user-visible changes (the look on TEST reads against these)

| Where | Before | After |
|---|---|---|
| Settings groups and table of contents | One group per config file name, then This machine, Catalogs, Texts | This browser, ten subject headings, a group "Without a heading" only while an entry lacks one, This machine, Catalogs, Texts; each heading lists its sections |
| Each heading | The file's group title | One line per file the heading draws from (name, description, `local` tag, open control), and a line saying why a file has no row while it loads or does not read |
| Families and lists (rail pages, floats, deck, scan, languages and others) | Flow-text boxes | A card per entry with a control per field; Move up, Move down, Remove, Add |
| Hue and colour fields | Text | A picker of 26 swatches; a value outside it is shown and marked "not in the list" |
| Choices drawn from data (clusters, models, domains, statuses, themes, bundle ids, tiers) | Text boxes and plain lists | Choices and multi-picks over the list, with "list is loading" or "could not be read" sentences |
| Folder, file and path options | Text | Boxes with suggestions from the hub's folder listing; the page refuses a missing folder, a file that is not there, a path outside the hub |
| Number options | Text-like box | A box held to its range with the range words |
| Server refusals of a config write | A reader's own sentence for the few options with a reader | A sentence per option (range, list, hue, path, file, folder, kind); a value the base held and the control cannot show still passes |
| Findings view | No catalog finding | `optionFindings` findings (none for the shipped catalog) at start and on each push |
| `workbench.yml` strings | `settings_choice_empty`, `settings_mismatch_choice` | removed; `settings_heading_*` (12), `settings_range*`, `settings_no_file`, `settings_no_folder`, `settings_not_a_path`, `settings_not_hub_path`, `settings_not_this_kind`, `settings_blank`, `settings_where`, `settings.editor_item*`, `settings.editor_stuck`, `settings.editor_unread`, `settings.list_failed`, `settings.list_loading`, `settings.not_in_list`, `settings.unset` added |

## Head comments and documents: rewritten, still true

Rewritten (the described behaviour changed): `src/lib/data/file-ops.ts`, `options.ts` (and the comment lines of `config/catalogs/options.yml`), `src/lib/server/content/images.ts`, `config-key.ts`, `config-value.ts`, `draft.ts`, `flow.ts`, `slots.ts`, `editors/writer.ts`, `groups.ts`, `rows.ts`, `search.ts`, `typed.ts`, `view/gear.ts`, `write.ts`, `ui/forms/Checkbox.svelte`, `NumberInput.svelte`, `ui/theme.ts`, `Settings.svelte`, `editors/Cards.svelte`, `Editor.svelte`, `Rollup.svelte`, `editors/writer.svelte.ts`, `settings/Contents.svelte`, `Control.svelte`, `Item.svelte`, `List.svelte`, `HELP.md` lines 154, 157, 261 and 274, `DESIGN.md` lines 85 and 408, `options.test.ts`'s head. The new files carry new heads: `option-findings.ts`, `config-fit.ts`, `config-sources.ts`, `fields.ts`, `sources.ts`, `HueSelect.svelte`, `SuggestInput.svelte`, `FieldControl.svelte`.

Still true (read after the change): the heads of `src/lib/data/sources/config.ts`, `config-checks.ts` (its list of readers and finders is unchanged in kind), `config-write.ts`, `src/lib/server/edit/writes.ts`, `src/lib/server/root/context.ts`, `src/lib/server/root/watch/portfolio.ts`, `src/lib/server/sessions/stores/hooks.ts`, `messages.ts`, `settings/writer.svelte.ts`, `config.test.ts`, `config-value.test.ts`; `README.md` (it does not describe the Settings view; `grep -n -i "settings view\|options catalog\|options.yml" README.md` prints nothing); the `docs/` folder (`grep -rln -i "settings view\|options\.yml\|flow text" docs demo` prints nothing).

Grep of changed names across `src`, `tests`, `config` (without `local.yml`), `HELP.md`, `DESIGN.md`, `README.md`: `unreadText`, `settings_choice_empty`, `settings_mismatch_choice`, `mismatchChoice`: 0 hits each. `'queued'`: 1 hit, `tests/server/edit/config-value.test.ts:71`, a server test with no portfolio, which checks the type alone and passes unchanged. `Card` and `FieldValue` are imported from `editors/fields` only.

## History words in what the step added

Command: the added and changed lines of the 51 files (from `diff` against the base, new files whole), filtered to comment lines and test titles, grepped for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package`. 16 hits, all judged as present-tense sequencing or state, none a comparison with an earlier state: `before any of them`, `before anything is read`, `before it is sent` (x2), `before the write` (x4), `before the first snapshot`, `before the payload` (the order in which a check or a list is read); `still loading` (x2), `still being read` (x2), `still hold one`, `is still shown` (a list or value that is loading or kept now). Wordings that compared with an earlier form of the draft were reworded to name the flow-text draft.

## Wrong or impossible in the brief

- Item 7.3 and Decision 6 gave results the brief's own cases 35 and 22 refuse (ruled).
- Item 1.6 and case 10 name a saved closed-groups list that does not exist (ruled; grep above).
- The finding key format was not fixed (ruled).
- Case 6 cannot be shown with the shipped files: they hold every option at its default, so `@modified` keeps 0 rows; the check used a copy of `behavior.yml` with `editor.tab_size: 2`.
- Table 6.4 writes `empty` for three options whose empty item needs words (cases 41 and 42); the entries write `empty: <words>`.
- `test:quick` reports `limit 45.0 s`; it took 92.5 s while other processes ran and 22.1 s to 40.2 s alone.

## Conventions

- One `grep -rn` over `config/` ran without the `local.yml` exclusion (the `--exclude` option stood after `--`). It printed no line from `local.yml`, and nothing of that file was read or shown.
- Three read-only git commands were run (`git status --short`, `git diff --stat`, `git show HEAD:...HELP.md`); they changed nothing.
