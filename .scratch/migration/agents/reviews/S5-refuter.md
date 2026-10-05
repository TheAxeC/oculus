# Step S5 refuter report (on .agents/worktrees/S5, base 6005baee6)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (from tools/oculus in the worktree)
ok      ASCII gate (0.4 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      svelte-check (21.4 s): 1791160143470 COMPLETED 358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (23.6 s)
ok      vitest (24.9 s): Duration  21.09s (...)
test:quick: 25.3 s (limit 45.0 s); every command passed
checks: 1 commands passed

Brief verify 2: npx vitest run options.test.ts config.test.ts config-folder.test.ts keys.test.ts boundaries.test.ts size.test.ts
 Test Files  6 passed (6)   Tests  80 passed (80)

Brief verify 3, each alone: server/edit/config-key 2 passed; server/edit/config-value 3 passed; routes/edit/config-key 1 passed; routes/edit/config-value 1 passed; routes/edit/undo/undo 9 passed

Brief verify 5, guarded files each alone (all "Test Files 1 passed (1)"):
 G3: ops-paste 5, untracked/trash 2, files/file-undo 9, files/history 3, replace/ops-replace 4 (+ config-key, config-value above)
 G8: writes 5, writes-collection 3, server/edit/feeds 5, sessions/overrides 2, deck-edit 1, routes/edit/rail 2, roots 2, audit-mute 1
 G9: core/changes 6, files/source 3, replace/replace-undo 1 (+ undo, file-undo, history, ops-replace, rail, roots above)
 G12/G13: agents-catalog 1, nesting 1, catalog/options 2, languages 1, local 14, config/rail 1, settings 11, config 29, config-folder 20
 G32: manifests 1, registries 1, collections 1, career 2, data/sources/feeds 1, docs 2, present 1, personal 2, snapshot/normalise 1

Tree checks under tests/checks the diff touches (not on the quick list; on the landing list), each alone:
 history 3 passed; diagrams 45 passed; cycles 7 passed; augments 9 passed; contrast 23 passed; integrity 8 passed; html-sites 19 passed; claude-usage 3 passed
 tests/checks/source/comment-width.test.ts: FAIL "expected [ ...(27) ] to deeply equal []"  (Tests 1 failed | 1 passed)
 tests/checks/tree/duplication.test.ts: FAIL "expected [ ...(2) ] to deeply equal []"  (Tests 1 failed | 17 passed)
 tests/checks/imports/order.test.ts: FAIL "state/system/config/editors/sources.ts:27 imports state/workbench/navigation/rail.ts (state/workbench, above state/system)"

Brief verify 6: sh utils/folder-check.sh -> prints nothing, exit 0
Brief verify 7: spec.md ASCII gate (perl form) over src tests config (local.yml excluded) HELP.md DESIGN.md and S5-report.md -> prints nothing
Brief verify 8: sh utils/unused-exports.sh vs S5-base/unused-exports.txt -> only "< src/lib/data/helpers/code-themes.ts: codeThemeIds" gone, "Unused exports (257)" -> "(256)"; no line added
Brief verify 9 (item 6.2), reviewer's own read of options.yml against the brief's table (scratchpad/s5-refute/cmp.py, yaml.safe_load):
 table rows 132 matched 132 catalog entries outside local 132; not in table []; no heading/section/control difference;
 section order per heading SAME for all ten; local.yml sections as item 6.5. Family field shapes printed for 42 entries and read against the table: all as the table gives (empty: <words> on chat.model, git.message_model, direct_chord, as the report says).

T1 and T2 first runs (base tree in a scratch copy, new test files put in):
 T1: Error: Cannot find module '.../catalog/option-findings.ts' imported from .../options.test.ts
 T2: TypeError: optionFindings is not a function  ❯ tests/checks/config/config.test.ts:527:16
Behaviour removed (scratch copy of the worktree):
 T1 with flag('range') taken out: AssertionError: expected [] to deeply equal [ [ ...(2) ] ]  ❯ options.test.ts:70:61
 T2 with the base options.yml: AssertionError: expected [ Array(132) ] to deeply equal []  ❯ config.test.ts:527:77
 restored: Tests 31 passed (31)

Case 64 (scratch copy, line 39 'revision' -> 'queued'): TypeError: Cannot read properties of undefined (reading 'at')  ❯ config-value.test.ts:42:28 (Tests 1 failed); restored: Tests 4 passed (4) over both config-value files.

The builder's scratch tests (scratchpad/hold/scratch-s5-server.test.ts and scratch-s5-state.test.ts), rerun in a scratch copy of the worktree (no local.yml), --testTimeout=300000:
 server: Tests 1 passed; 29 lines, all PASS; identical to /tmp/s5-server.log (diff prints nothing)
 state: Tests 1 passed; 134 lines, 0 FAIL; identical to /tmp/s5-state.log (diff prints nothing)

Reviewer probe (scratchpad/s5-refute/oculus/tests/zz-refute.test.ts, scratch copy):
 no inputs (undo path): [{"field":"behavior.yml:editor.languages","reason":"Entry yaml, field tab_size: This option takes a finite number"}]
 with inputs: [] changed ["behavior.yml:editor.languages"]
 36 side-project stray: true | 36 tier personal stray: false
 45 engine under summary stray: true | 45 engine under framing stray: false | 45 title pool: {"items":[],"state":"ready","error":""}
 49 domains stray before snapshot: null

grep -rn "toggledGroups" src -> groups.ts:286, :296, Contents.svelte:14, :42 (the same files on the base copy): item 1.6 premise false, as the report says.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1.1: holds, groups.ts `settingsGroups` (browser, `[...HEADINGS, UNHEADED]`, machine, folder groups), literal `t('workbench.settings_heading_<id>')` in `headingTitle`; state run case 1.
- 1.2: holds, `HEADINGS` exported from options.ts:53; group ids as named; every options.yml entry outside local.yml carries `heading:` (comparison run).
- 1.3: holds, rows by `files` then catalog order, `Section.title`; section order SAME for all ten headings (reviewer comparison).
- 1.4: holds, `Group.lines` (`FileLine`), List.svelte draws name, `local` Tag, open control, description, said line per file.
- 1.5: holds, search.ts `answers(row, read, group.title)` and `saysWhyEmpty`; state cases 4, 5, 7.
- 1.6: not applicable as ruled by Z445 item 2: no saved closed-groups list exists (grep above); every heading opens.
- 1.7: holds, `UNHEADED` after calendar and before machine; state case 11.
- 2.1: holds, `CONTROLS` options.ts:31-47.
- 2.2: holds, with the extension `empty: <words>` (Spec 1).
- 2.3: holds, `readSpec` reads a string field as text and a map with `records`.
- 2.4: holds, `readCatalog` problems and `optionFindings` (in a new file outside the write list, Standards 6); T1 met.
- 2.5: holds by reading context.ts:309, portfolio.ts:520, config-checks.ts FINDERS, config.ts re-export; the push not run (Proof 1).
- 2.6: holds, heads of options.yml and options.ts rewritten.
- 3.1: holds, sources.ts `listsOf` and config-sources.ts `sourcesFor` over the table's sources.
- 3.2: holds, `state/system/config/editors/sources.ts`.
- 3.3: holds, config-sources.ts; `WriteTarget.entities` (writes.ts:111-116, 245) over the new `entities` export of hooks.ts.
- 3.4: holds, `PICTURE_EXTENSIONS` in data/file-ops.ts, read by images.ts and sources.ts.
- 4.1: holds, editors/FieldControl.svelte used by Control.svelte and Cards.svelte; nested Cards for `records`; folder check prints nothing.
- 4.2: holds, editors/fields.ts.
- 4.3: holds, Tag beside a single value, " (not in the list)" in a multi's chip words; Select, MultiSelect and GlyphSelect unchanged; This machine rows have no value or control.
- 4.4: holds (Checkbox three-state, NumberInput range, SuggestInput on Combobox, HueSelect on Select), with Standards 5 on NumberInput.
- 4.5: holds, `hueOfClass` and `hueNames`; 26 hues (state case 14); amber writes `#b45309` (state case 18).
- 4.6: holds, `pathTrouble` and `offerFor`.
- 4.7: holds, Cards `removeOnly` (no Add, no Move); server `parkedProblem`.
- 4.8: holds, `fromWords`; state case 25.
- 5.1 to 5.4: hold, draft.ts, slots.ts `typed: true`, `typedDraft`, `commitValue`; state cases 15, 16, 25, 28, 29, 53 to 56.
- 6.1 to 6.5: hold, reviewer comparison above.
- 7.1: holds, config-key.ts `single`, config-value.ts `isCollection`, config-write.ts `sourcesOf`.
- 7.2: holds, config-fit.ts.
- 7.3: violated, Behaviour 1: the write with no sources refuses a family the file holds when one of its records holds a field of another type, so that undo no longer puts back what the file held.
- 7.4: holds, server.yml sentences; keys.test passes.
- 8: holds as state and code; drawing owed to the look.
- 9: holds, HELP.md 154, 157, 261, 274 and DESIGN.md 85, 408 rewritten; a grep for "flow text", "one line of yaml", "group per file", "file group" and "each config file" over HELP, DESIGN, README, config and src finds no false sentence.

Cases of the brief's "Cases":

- T1: met, reproduced on the base, with the behaviour removed and now.
- T2: met, the same.
- 1: met, state run (13 titles, toc counts 6, 10, 3, 4, 1, 6, 4, 8, 4, 2, 8); This browser first by reading groups.ts; the look is owed.
- 2: met, state run.
- 3: met, state run (unreadable, loading, cut, unparsed).
- 4: met, state run.
- 5: met, state run (18/18).
- 6: met, with a copy of behavior.yml holding `editor.tab_size: 2`. The builder's correction holds: on the shipped files `@modified` keeps 0 rows (state run), because each catalog `default` is the tracked value.
- 7: met, state run.
- 8: met, state run (18 rows); groups.ts never asks for local.yml's text.
- 9: met, state run (15, 31, 62, 10, 25 with their ranges).
- 10: met as ruled (Z445 item 2), grep above.
- 11: met, state run.
- 12: met, state run plus reading (an optional field's Select gets the unset item).
- 13 to 20: met, state runs.
- 21: met, state run and server run.
- 22: met, server run (refused at another key, accepted where held); page `isStray` true. The builder's page check passes unconditionally (Proof 3).
- 23 to 31: met, state and server runs.
- 32: met, server refuses an added signature; Cards `removeOnly` draws code plus Remove and no Add (reading).
- 33 to 35: met, state and server runs; 35 as Z445 rules it.
- 36: met, by the reviewer probe (`side-project` stray true, `personal` not stray) and the state log (coauthor type and optional null). The builder's check was unconditional (Proof 3).
- 37 to 44: met, state and server runs; 44's glyph picker by reading.
- 45: met, by the reviewer probe (engine stray under summary, not under framing; title gives no items). The builder's check was unconditional (Proof 3).
- 46 to 59: met, state and server runs.
- 60: partial. A scratch run of `optionFindings` and T2 show no finding for the shipped catalog and one for `control: colours`. The listing at start and on the push was read, not run (Proof 1).
- 61: met, the report states that HEADINGS holds 10 distinct ids, none reserved, and that the code has no collision handling.
- 62: partial. The first half is met by a state run of `offerFor`. "After the tab is closed, no answer changes any state" was read, not run (Proof 2).
- 63: not verifiable here. It is read only, and the redraw when the snapshot lands needs the look on TEST.
- 64: met. With `'queued'` the route write is refused ("This option takes one of the items of the list entry_statuses", in the builder's printed answer) and the test fails at config-value.test.ts:42. With `'revision'` it passes, and the server test is unchanged and passes.
- 65: met, server run.

## 1. Spec

- `config/catalogs/options.yml` (chat.model, git.message_model, direct_chord) and `src/lib/data/sources/config/catalog/options.ts:134,295-296`: "empty?: true | string". What is wrong: item 2.2 and table 6.4 give `empty: true`. The diff adds a second form of a config vocabulary key, `empty: <words>`, which the report lists as a judgment call. Failure scenario: a reader of DESIGN.md:85 or a later step treats `empty` as a boolean. This is a user-visible config shape the orchestrator has not ruled on, so it is not a violation until ruled. Verdict: none.

## 2. Proof

- Case 60 / item 2.5 (`src/lib/server/root/watch/portfolio.ts:520`, `context.ts:309`): "read, not run". What is wrong: the case asks for a quoted run showing the finding listed at start and on the push. The report quotes a direct call of `optionFindings` and a read of the two call sites. Its first line says "Everything in the brief is done" while it names this proof as not run. Decision resting on it: the landing of item 2.5. Failure scenario: a rebuild path that drops or throws on the new finder would reach the Findings view unseen. The look can show "no finding" but not the `colours` finding. Verdict: case 60 partial.
- Case 62 second half and case 63: "Read, not run in a browser". What is wrong: the brief asks for a run or the look. These are reads of write.ts:102, editors/writer.ts:108 and FieldControl's `$derived`. Failure scenario: an answer that lands after close mutates state; this is unseen until the look. Verdict: case 62 partial, case 63 not verifiable.
- The builder's state scratch test, scratchpad/hold/scratch-s5-state.test.ts lines 222, 302, 390, 443 and 471: `check('36', 'scan rules', true, ...)`, and the same for cases 10, 22, 45 and 51. What is wrong: these checks pass whatever the code does, so "134 lines, 0 FAIL" does not prove the marking parts of cases 36 and 45 or the page half of case 22. The reviewer probe reproduces them as met. Decision resting on it: the case verdicts 22, 36 and 45. Failure scenario: a broken `isStray` for `values_by` or `project_types` still reports PASS. Verdict: none, closed by the reviewer's probe.
- Report, DONE row 5 (guarded tests): "G8, G9, G12, G13 and G32". What is wrong: G3's Code line (`grep -rl local.yml src/lib/server`) names config-key.ts, config-value.ts, writes.ts and context.ts, which the step changes, and its tests were not run. G9 was run as changes.test.ts and undo.test.ts only. The reviewer ran every file: all green. Failure scenario: none now. Verdict: none.

## 3. Standards

- `tests/checks/source/comment-width.test.ts` (G23), red with 27 lines, all in files the step changed: options.ts:163; config-fit.ts:16, :50, :199, :376, :429; config-key.ts:9; config-sources.ts:26; draft.ts:363; fields.ts:2, :190, :361, :394, :407; groups.ts:135; search.ts:10; NumberInput.svelte:9, :30; HueSelect.svelte:175; SuggestInput.svelte:2, :9; Editor.svelte:3; FieldControl.svelte:6, :10, :17; Item.svelte:19, :22. What is wrong: spec.md "What every package obeys" (comment rewrapped at 100 columns) and guarded.md G23. Failure scenario: `npm run test:landing` is red at landing. Verdict: none.
- `tests/checks/tree/duplication.test.ts` (G21), red: "config-sources.ts:38 and editors/sources.ts:70 hold the same 11 lines" (`resourcesOfKind`), and "GlyphSelect.svelte:58 and HueSelect.svelte:60 hold the same 12 lines". What is wrong: spec.md principles ("a parser, a rule or a fold exists once"). options.ts, which both sources modules already import, is the shared home for `resourcesOfKind`. Failure scenario: landing list red, and two copies of the cluster filter can drift. Verdict: none.
- `src/lib/state/system/config/editors/sources.ts:27`: `import { glyphNames } from '../../../workbench/navigation/rail.ts';`. What is wrong: G17 (tests/checks/imports/order.test.ts) is red: "state/system/config/editors/sources.ts:27 imports state/workbench/navigation/rail.ts (state/workbench, above state/system)". Failure scenario: landing list red. Verdict: none.
- `config-key.ts:7-10` ("...that control takes (config-fit.ts). The machine's own file,") and `config-key.ts:86-88` ("alone. A file that cannot / * be read or written throws"); `rows.ts:3-4`; `search.ts:10`; `view/gear.ts:3-5`. What is wrong: spec.md "What every package obeys": a comment the step edits is rewrapped as a whole paragraph, so no line inside a sentence ends short or runs past 100 columns. Failure scenario: a reader of the head comment, and G23 at landing. Verdict: none.
- `src/lib/ui/forms/NumberInput.svelte:41,57-72`: `const DECIMAL = /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;` and `field.setAttribute('aria-invalid', 'true')` inside `$effect`. What is wrong: the decimal rule is the second copy of fields.ts:58 `decimalOf`, against spec.md principles (a rule exists once). The invalid mark and its title are a DOM side effect where spec.md says "a reader-visible behaviour is state, not a DOM side effect". TextInput taking the attribute as a prop is the state form. Failure scenario: the two readings of a number drift (a box marks a text that Save reads differently), and the mark lags a value set while the input is not bound. Verdict: none.
- Report, "Files" table: `view/gear.ts`, `editors/writer.svelte.ts`, `settings/writer.svelte.ts` and `catalog/option-findings.ts` (new) are listed without being marked as outside the write list. What is wrong: spec.md "Where you work" says the table marks each path outside the write list with the reason. option-findings.ts's reason appears only under judgment calls. Failure scenario: the orchestrator's check of the diff against the write list misses four paths. Verdict: none.
- Report, "Conventions": "Three read-only git commands were run (`git status --short`, `git diff --stat`, `git show HEAD:...HELP.md`)". What is wrong: spec.md "Where you work": a builder runs no git command, read-only ones included. Failure scenario: none in the diff. Verdict: none.
- Report, "Conventions": "One `grep -rn` over `config/` ran without the `local.yml` exclusion (the `--exclude` option stood after `--`)". What is wrong: the brief's rule is that every grep over `config/` uses `--exclude=local.yml`, so that grep read config/local.yml. Whether it printed a line of it is not verified (the transcript was not read). Failure scenario: a value of the machine's own file in the builder's context. Verdict: none.
- The builder's scratch runs. /tmp/s5-queued.txt shows `tests/routes/edit/scratch-s5-queued.test.ts` run under `.agents/worktrees/S5/tools/oculus`, and the hold/ tests import `./fixtures/scratch.ts` and `../src/...`, so they ran from the worktree's `tests/`. Logs went to /tmp. What is wrong: spec.md "Where you work" ("Backups, base copies and logs go in your session scratchpad, never in a worktree"). The report's "Both scratch test files are outside the tree" leaves out that they ran inside it. `git status --short` now lists none of them. Failure scenario: a scratch test left in tests/ would be picked up by `npm test`. Verdict: none.
- Report, "Number of runs": "`npm run test:quick` 4 ... `checks.sh` 2". What is wrong: spec.md "Token discipline" says to run the list once after the last change, and again only after a red line in a changed file. Two of the green runs were repeats. Failure scenario: cost only. Verdict: none.

## 4. Behaviour

- `src/lib/server/edit/writes/config/config-fit.ts:337-340` and `:503-507`. Quoted: `if (ctx.fit.sources === null) return typeProblem(spec, value, ctx.fit.text);` and `fit.sources !== null && base.some((one) => isDeepStrictEqual(one.record, item.record))`. What is wrong: the write with no sources is undo.ts:313-314, used when the byte put-back does not apply, for example after another key above it changed the offsets. It now checks every field of every record for type and skips the "record equal to one the file holds passes" rule. A family whose file holds a mistyped field is then refused on undo. Reviewer probe: with `yaml: { tab_size: "4" }` in behavior.yml, writeConfigValue with no inputs answers "Entry yaml, field tab_size: This option takes a finite number". The same value with inputs is accepted. The base `misfit` checked only shape and field names, so the undo put the value back. Item 7.3 says type alone "so an undo puts back what the file held", and the code meets the first clause and breaks the second. The report does not state this change. Failure scenario: a reader saves `markdown` word wrap in Settings over a file whose `yaml` record holds `tab_size: "4"` (case 53's state), then sets another behavior.yml key above it, then undoes the languages write in History. The undo is refused and the file is not put back. Fix direction: apply the equal-to-base pass, and the held-value pass for a field, before the type check when sources are null. Verdict: item 7.3 violated.
- `src/lib/views/system/workbench/editors/FieldControl.svelte:93-97,205-211` against base `settings/Control.svelte:103` (`empty={t('workbench.settings_choice_empty')}`). What is wrong: on the base every leaf choice drew a "Not chosen" item. Now a leaf choice without `empty` (wallpaper.pick, show_tabs, editor.word_wrap and the rest) draws none. The report's visible-changes table names only the removal of the string `settings_choice_empty`, not this before and after. Failure scenario: the look on TEST is read against a table that does not say the empty item is gone from these choices. Verdict: none.
- `src/lib/state/system/config/search.ts:38-46`. What is wrong: a search now matches a row by its heading's words (item 1.5, case 5). The report's "Host- and user-visible changes" table does not list it, although HELP.md:154 does. Failure scenario: the look does not check case 5's search. Verdict: none.

## Declined to judge

- Everything drawn: the three-state box, the range mark and title, the swatches, the suggestion list's keys and placement, the Tag and chip marks, focus, tab stops and the cards' layout. This needs a DOM and is the look on TEST.
- A run of the watcher rebuild carrying `optionFindings` into the config payload. It needs a Hub and fs watchers, which the review's no-server rule keeps out.
- Whether the builder's misplaced grep over `config/` printed any line of local.yml. The builder's transcript was not read.
- bits-ui's own behaviour under SuggestInput and HueSelect (Combobox and Select keys, portal), beyond reading the code.
- The reviewer ran `git -C . diff 6005baee6 -- <paths>` once: the allowed `git diff <base>`, with a no-op `-C .`. All scratch work ran in scratchpad/s5-refute (a copy of the worktree and the base without config/local.yml). Nothing in the worktree or the ledger was written.

Reviewer usage: ordo-high on claude-opus-5-5 (ab608db77fb2265cd), 365,219 tokens, 97 tool uses, 22.0 min.

## Repair round 1, refuted

Reviewer a78d8970b3fff491c, claude-opus-5-5, ordo-high (stopped by the orchestrator by mistake and resumed): 191,100 tokens, 114 tool uses, 20.1 min (completion notice of the resumed run). Base 6005baee6; no round-start tree recorded, so the whole diff since the base was read.

### Verification

`checks.sh` from the worktree root fails (`npm error enoent Could not read package.json`); run from `tools/oculus`, where the state file runs the list: prettier, ASCII gate, svelte-kit sync, eslint, vitest, svelte-check (0 errors, 0 warnings) all ok; `test:quick: 113.1 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`, `checks: 1 commands passed` (other agents were running; the builder's run took 26.4 s). Item 2: 8 files, 138 tests passed. Item 3: 7 files, 64 tests passed. Item 4: 21 files each pass alone. Item 5: 4 files, 5 tests passed. Item 6 grep and awk print nothing (the awk range 455-494 is stale; the entries sit at `options.yml:461-502`). Item 7 greps print nothing. `folder-check.sh` exit 0. ASCII gate: one line, `config/present.yml:252` "Linkoping" with its accent, a name. `unused-exports.sh`: 257 to 255, removed `codeThemeIds`, `WHITESPACE_WORDS`, `LanguageRecord`, `FilesSettings`, added `local.ts: readLocalText`. The builder's probes for cases 11 to 16, 25 to 29, 35, 39, the rust findings and `cmp.py` (`differences: 0`) reproduce the report. S5's own case probes on a copy of the final tree: server 29 PASS, state 138 PASS (S5 cases 1-62 and 65). T1 and T2 pass.

### Verdicts

Q119 items 0.1-0.4, 1.1-1.8, 2.1-2.6, 3.1-3.6, 5.1-5.9 hold (1.5, 1.6 and 1.8 with the departures in Spec 1 and 2); item 4 not verifiable here (the look, Z507). Q119 cases 1-39 met. S5 items 1-9 hold, T1 and T2 met. S5 cases 1-61 and 65 met; 62 first half met, second half not verifiable here; 63 not verifiable here; 64 met.

### Findings

Spec
1. `src/lib/data/helpers/editor.ts:40-42`: `EditorOptions` carries `fitsTabSize` and `fitsWrap` predicates where Q119 1.8 names `min`, `max` and `values`; the better form, not marked as a departure. Verdict none.
2. `settings.ts`, `opens-in-program.ts`: `filesSettings`/`FilesSettings` deleted (Q119 1.5 keeps the readers' names) and `isBundleId` left `opens-in-program.ts` (1.6 keeps it); both right on the merits, neither marked as a departure. Verdict none.
3. `config/text/findings.yml`, `catalog/value-words.ts` (new): the group `findings.words` added outside the write list's two groups; named in the report's judgment calls. Verdict none.

Proof
1. `tests/data/sources/config/settings.test.ts:241-246`: the title's second `%s` takes `field`, not `kind`, so two rows print the same title "answers the default for a days_back with a daysBack problem". Verdict none.
2. `S5-report.md:905`: the diagrams row lists 10 files; `git diff 6005baee6 --stat -- docs/diagrams` shows 14 (`layer-ui.dot/.svg`, `layer-views.dot/.svg` missing). Verdict none.
3. `S5-report.md:496`: S5's cases are not rerun on the round's final tree though the round changes code they run through; the reviewer's rerun passes. Verdict none.

Standards
1. `S5-report.md:1057`: the builder ran two read-only git commands, which spec.md forbids; disclosed; changed nothing.
2. The worktree's index holds a staged deletion `D  src/lib/server/core/fetch-period.ts` that no report discloses; the deletion itself is item 1.5.
3. `src/lib/ui/controls/editor/options.ts:15,18`: hand-written unions of Monaco's `wordWrap` and `renderWhitespace` words remain (present at the base), against Q119 1.8's "no list of their words is written in code".
4. `readLocalText` export: judged acceptable, not a finding.

Behaviour
1. `src/lib/state/sessions/latex.svelte.ts:598-603`: with no config yet, or a config whose catalog was dropped, a `.tex` save now builds nothing where at the base it built; stated in the doc comment, absent from the report's before-and-after and unruled by Z509. Verdict none.

No closure the builder claims fails to reproduce; none was closed by removing a check.

### Declined to judge

The look and S5 cases 62 (second half) and 63 (Z507); case 64's reverted-line copy; who staged the deletion of `fetch-period.ts`.

### The reviewer's own conventions

One read-only `git rev-parse --short HEAD`; no file written in the worktree beyond vitest's cache; a scratch copy without `config/local.yml`; no server, no port.
