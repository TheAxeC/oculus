# Step D25 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D25, base 5f492a9b)

Summary: the verify list is green on the worktree (`checks: 7 commands passed`). The builder's report says the list was NOT done because `placeholders.test.ts` timed out. That claim does not reproduce: the file passed inside my full `npm test` run and passed alone. I found 5 Spec, 5 Proof, 6 Standards and 2 Behaviour findings. One item is violated (item 3, a head comment the brief named was not rewritten). Two cases are partial (2 and 16). The rest are code-quality and report-shape findings.

A page this report cites is named by its section. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ npm run build            (alone first, from tools/oculus of the worktree)
  ✔ done   npm run build 2>&1  61.70s user 8.04s system 91% cpu 1:16.31 total

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   -> exit 0
$ npm test
 Test Files  575 passed | 24 skipped (599)
      Tests  14109 passed | 643 skipped (14752)
   Duration  202.28s
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
$ npm run check
COMPLETED 3321 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

The builder's placeholders claim (load average 8.12 at the time):
$ npx vitest run tests/server/machine/commands/placeholders.test.ts
 Test Files  1 passed (1)
      Tests  9 passed (9)
   Duration  3.91s
(It also passed inside the full npm test above.)

The brief's gates:
grep -c "c-gutter-modified:" src/lib/themes/themes.css  -> 16 ; grep -c "c-scm-modified:" -> 16
ls src/lib/ui/controls/editor | wc -l -> 10 ; ls src/lib/ui/controls/editor/kit | wc -l -> 10
git status --short -- tools/oculus/docs/diagrams -> the 7 .dot and 7 .svg files listed as M, nothing new
The spec's ASCII gate (perl over src tests bin config, local.yml excluded) -> no output, exit 0

The unchanged tree: a scratch copy under $TMPDIR, made from the worktree with `git diff -R --no-renames 5f492a9b` applied forward and the step's new files removed. Editor.svelte 538, Source.svelte 528, fs.svelte.ts 877, DiffEditor.svelte 492, paint_limit_kb: 64. The worktree's final tests were copied into it.
$ npx vitest run <undo-replaced, fs-text-fresh, paint, diff-pane, compare-header.client, colours, settings, editor-text, editor, wrap, gutter>
  37 failed, among them: "draws the x of ***x*** bold and italic", the 4 byte-for-byte undo cases
  ("Cannot read properties of undefined (reading 'offset')"), "names the left file and then the right
  file ... with no R", the 4 fs-text-fresh cases, "expected 64 to be 20480" twice, both
  compare-header cases, "reads a file that never indents ... as nothing to detect", 15 wrap cases,
  "are both editors side by side and the modified one inline", "draws the text size in force ...",
  the 3 case-19 colour cases. This matches the report's first-run table.
$ npx vitest run tests/routes/edit/undo/undo.test.ts tests/routes/edit/undo/undo-removed.test.ts tests/state/sessions/source/view-source.test.ts tests/views/system/workbench/settings-origins.test.ts tests/state/system/settings/editors-draft.test.ts  (unchanged tree)
  Test Files  2 failed | 3 passed (5)   Tests  4 failed | 119 passed (123)
  (failing: the 22-families count and the 3 settings-origins cases; the moved undo and view-source suites pass, as reported)

The slow colour rule:
$ npx vitest run tests/ui/theme/colours.test.ts  (worktree)
  × holds in every component under ui, shell, views and routes
  "lib/ui/controls/editor/DiffEditor.svelte: .diff-editor :global(.oculus-comment-add)::before: background: linear-gradient(var(--accent), var(--accent)) center / 8px 2px no-repeat,
  "lib/views/sources/files/sections/OpenEditors.svelte: .dirty: background: currentColor (not a surface or a hue)",
  Tests  1 failed | 16 passed (17)
$ the same test on the unchanged tree -> the same two lines, Tests 1 failed | 16 skipped (17)
  (the diff changes no style rule in DiffEditor.svelte and does not touch OpenEditors.svelte)

The derived theme tokens (derive.test.ts digests), dumped on both trees:
  base 3057 lines, changed 3125; diff: 68 added lines, 0 removed, every one a --c-gutter-modified
  derivative (-txt, --on-, -lane and the token), 4 per theme over 17 themes

The item-10 guards, on a scratch copy of the worktree:
  (a) replacedShape.safeParse replaced by a pass-through -> undo-replaced.test.ts: Tests 12 passed (12)
  (b) additionally `!source.startsWith(later, offset)` removed -> Tests 12 passed (12)
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The keys, catalog entries, `readEditorOptions`, findings and the `editorOptions` selector are in place, and `editor-options.test.ts` passes. The finding keys differ from the brief's name (Spec 3).
- 2: holds. `parseRepoSettings`, `fileText(root, REPO_SETTINGS)` in `views/shared/code/source-options.ts:62-72`, and `markText` wired at `context.ts:326-329` are in place.
- 3: violated, Spec 1 (the `Source.svelte:50` head comment). The order in `resolveEditor` holds, and Source.svelte is 493 lines.
- 4: holds. The "Skipped" sentence has a different shape from the brief's (Spec 4).
- 5: holds. The keypress itself is for the look.
- 6: holds in behaviour. `Editor.svelte` was compacted to stay at its cap (Standards 2), and `DiffEditor.svelte` grew into the 20-line margin (Standards 3).
- 7: holds (`symbols.ts`, `kit/folding.ts`, both registered).
- 8: holds. The typing measurement on TEST belongs to landing.
- 9: holds (`fs-transport.ts:366` `{ cache: 'no-cache' }`; fs.svelte.ts at 869 lines).
- 10: holds in behaviour, including CRLF and undo of the undo. Its guards are audits only (Proof 2).
- 11: holds.
- 12: holds (16 of 16 blocks; each other theme's `--c-blue`).
- 13: holds. The two actions on the palette-source store are judged under Spec, departures (b).
- 14: holds.
- 15: holds (CSS, for the look).
- 16: holds. The drawn layout is for the look.
- 17: holds (CSS, for the look).
- 18: holds.
- 19: holds for HELP.md, DESIGN.md (85, 143, 388, 395, 408, 429), `desc_behavior` and the diagrams.

Cases of the brief's "Cases":

- 1: met (`source-options.test.ts:100`, `editor-options.test.ts:371`).
- 2: partial, Spec 5.
- 3, 4, 6: met.
- 5: met through the draft and the module (`wrap.test.ts`, `source-options.test.ts:142`). The keypress and the reload on screen are for the look.
- 7, 8, 9, 10: met.
- 11: met for `applyOptions` and the diff section's options. The live redraw is not verifiable here (look).
- 12, 13, 14, 15: met.
- 16: partial, Proof 3.
- 17: met. The stale-offset part is an audit (Proof 2).
- 18, 19: met.
- 20: met for the entries, the hints, Auto Detect, the association's written value and the Settings search. The History row and the tab redrawing as Markdown are not verifiable without the look.
- 21: met (`diff-pane.test.ts` and `compare-header.client.test.ts` together).
- 22: not verifiable (CSS, look).
- 23: met for `commentSides`. The drawn layout is for the look.
- 24: not verifiable (CSS, look).
- 25: met.
- 26: met by reading. `options.yml:602-608` holds `holds: lists` with fields key and value, and `draft.ts:71-73, 131-137` gives the `pairs` form.
- 27, 28, 29, 30, 31, 32, 33, 34: met.
- 35: met in behaviour. The malformed-record cases are audits (Proof 2).

## 1. Spec

Departures judged (no verdict, for the orchestrator's read):

- (a) The options module is at `views/shared/code/source-options.ts` instead of `views/sources/source/source-options.svelte.ts`. This is justified. `DiffSection.svelte` uses it, and `boundaries.test.ts` ALLOWED.views is `['ui/**', 'state/**', 'views/shared/**', 'data/shapes/shapes']`, so a module in `views/sources/source/` cannot be shared with `views/sources/repositories/diff/`. The module holds no runes, so `.ts` is right.
- (b) `associate` and `openLanguageSettings` are on the palette-source store. This is justified. ALLOWED.shell has no `state/system/config/typed`, and SHELL_STORES has no `writes` (`boundaries.test.ts:118-137, 326-340`). The only other route was to widen the boundary table, which would loosen a check. The cost is that `palette-source.svelte.ts` now holds a config write and a layout action beside its index, which its head comment says.

Findings:

- **Spec 1.** `src/lib/views/sources/source/Source.svelte:50`: "indentation (the one chosen from the bar, or the file's own), the line ending of the text,".
  - What is wrong: brief item 3 names this head comment as one that follows the change. It is unchanged. The indentation now also comes from the root's `.oculus/settings.yml`, `editor.languages` and the global keys, and the head comment says nothing of word wrap, Alt+Z or the Markdown symbols the tab now adds.
  - Failure scenario: a reader maintaining the status bar's indentation item believes it only ever shows a bar choice or the file's own indentation. A Python file with no indented line under `editor.tab_size: 3` shows a configured value the comment says cannot occur.
  - Verdict: item 3 violated.
- **Spec 2.** Paths outside "Paths this step writes" are not marked in the report's file table: `src/lib/state/workbench/palette-source.svelte.ts`, `src/lib/state/client/context.ts:395-402` (the list names 320-330), `src/lib/ui/controls/editor/gutter.ts` (`commentSides` moved there), `src/lib/views/shared/code/source-options.ts`, `src/lib/views/sources/source/source-gutter.svelte.ts`, `tests/state/sources/fs/fs-text-fresh.test.ts`, `tests/state/sources/repositories/diff/compare-header.client.test.ts`, `tests/state/system/settings/origins.test.ts`, `tests/routes/edit/write-fixture.ts`, `tests/themes/derive.test.ts`, `tests/state/system/settings/editors-draft.test.ts`, and `tests/state/sessions/source.test.ts`. The last is one the brief says X3c changes; the `wrap: null` edits are needed and are not a widening.
  - What is wrong: the spec's "Where you work" asks the file table to mark each such path with its reason. Some are named under Judgment calls, none in the table. `source-gutter.svelte.ts` moves the quick-diff and blame reads out of `Source.svelte`. That is code the brief did not ask to move: it asked for the indentation and convert-ask code.
  - Failure scenario: the orchestrator checks the merge with X3c and Q91 against the brief's paths. It misses that `Source.svelte:200-300` (the gutter block) was rewritten into a new module and that `source.test.ts` changed, both shared with X3c.
  - Verdict: none on items; a landing risk.
- **Spec 3.** `config/text/findings.yml:68-71`: "editor_value: '{0} is outside the values ...' / editor_unknown_language / editor_unknown_field / editor_not_a_map".
  - What is wrong: brief item 1 names one finding, `findings.config.editor_option`, naming the key. Four keys were built. The words are more specific, but the departure is not stated in the report.
  - Failure scenario: a later brief or test that looks for `findings.config.editor_option` finds no such key.
  - Verdict: none (item 1 holds).
- **Spec 4.** `config/text/views/system/workbench.yml`: "settings_origin_skipped: 'Skipped in {0}: {1} ({2})'".
  - What is wrong: brief item 4 gives "Skipped in <root label>: <language or field>: <the reason>". The reason is drawn in brackets instead. This is a user-visible wording the report does not state.
  - Failure scenario: the look on TEST compares against the brief's sentence and records a mismatch, or accepts a shape nobody ruled.
  - Verdict: none (item 4 holds).
- **Spec 5.** `tests/data/helpers/editor-options.test.ts:383-399` and `tests/state/sessions/source/source-options.test.ts:105-107`: "held.editor = { tab_size: 3, insert_spaces: false, languages: { python: { tab_size: 2 } } }; expect(module().indent).toEqual({ tabs: true, size: 2 });".
  - What is wrong: case 2 says "The same file with `editor.languages: { python: { tab_size: 2 } }`: 2 spaces". No test asserts 2 spaces. The tests carry case 1's `insert_spaces: false` and assert a tab of width 2. If the case carries case 1's configuration, its expected result contradicts the brief's own field-by-field order, and the brief requires such a case to be handed back. The report says "No case's rule was wrong; none was handed back." If the case does not carry it, the case's own input is untested.
  - Failure scenario: a change that stops a record's `tab_size` from combining with the default `insert_spaces: true` passes every test.
  - Verdict: case 2 partial.

## 2. Proof

- **Proof 1.** `agents/reviews/D25-report.md:1`: "NOT done: (1) the plan's verify list does not print `checks: 7 commands passed`, because its first command `npm test` fails in 4 of 4 runs on one timeout in `tests/server/machine/commands/placeholders.test.ts`".
  - What is wrong: the rerun prints `checks: 7 commands passed` (npm test 575 files, 14109 tests passed), and the file passes alone (9 of 9 in 3.91 s). The timeout depends on load, in a file the step does not change. The landing decision rests on the list being green; it is green now.
  - Failure scenario: the orchestrator reads the report's first line and holds the landing on a red line that is not there.
  - Verdict: none.
- **Proof 2.** `src/lib/server/edit/writes/config/config-value.ts:272, 290-296` (`replacedShape.safeParse`, `!source.startsWith(later, offset)`) and `tests/routes/edit/undo/undo-replaced.test.ts:133-164`.
  - What is wrong: with either guard removed on a scratch copy, the suite still prints `Tests 12 passed (12)`. `kept` refuses the wrong slice and the undo falls back to `writeConfigValue`, so the malformed-record cases (case 35) and the reformatted-file case (case 17) pass with or without the guards. The report presents them as tests ("8 pass ... undone or refused as now"). The spec ("Verify before you report" and the audit rule) asks that such a test be titled and reported as an audit.
  - Failure scenario: a later edit drops the offset check that brief decision 9 rests on ("no text is put back over a file changed since"), and the suite stays green.
  - Verdict: cases 17 and 35 met in behaviour; their proof is an audit.
- **Proof 3.** `tests/state/sources/fs/fs-text-fresh.test.ts:58-99`: "const seen = browser({ 'engine/behavior.yml': 'waiting_status: [one, two, three]\n' }); ... applyEdit(draft, { do: 'remove', index: 0 })".
  - What is wrong: case 16 and Z319 (1) are about `read_limits`, a key/value family of single values, emptied and saved. The test removes one item of the list `waiting_status`. The cache mechanism is the same, but the case's own input (an emptied map written as `{}`) is not exercised. The report's first-run row presents the test as case 16.
  - Failure scenario: a defect in ending the draft of an emptied key/value family (the shape the look found) would not turn this test red.
  - Verdict: case 16 partial.
- **Proof 4.** The report has no list of documents and doc comments re-read ("still true" or "rewritten"); Spec 1 slipped through for that reason. It has no list of asynchronous paths with a test for in flight, after close and superseded. Among those paths: `LanguageRows.svelte:55-64` awaits the association write and then calls `onclose` or `onsaid`, possibly after the palette closed, with no test of that; the root file's read is only simulated by a synchronous fake (`source-options.test.ts:248-262`). The renamed-name and helper greps are described ("nothing found") but not quoted.
  - What is wrong: all three are required by the spec's "What every package obeys".
  - Failure scenario: a later reviewer cannot tell which comments were checked, or which async path has no after-close test.
  - Verdict: none.
- **Proof 5.** `tests/state/sessions/source/wrap.test.ts:40`: "it.each([1, true, false, 'sideways', '', 'ON', [], {}, null])".
  - What is wrong: `it.each` spreads `[]` as an empty argument list. The run printed "reads a stored undefined as null", so a stored empty list is never tested.
  - Failure scenario: none for the current schema (`z.enum(...).catch(null)`); the row's title misleads.
  - Verdict: none.

## 3. Standards

- **Standards 1.** `src/lib/shell/keys/Palette.svelte:22`: "    // editor status store, and with no" (39 columns, in the middle of a sentence).
  - What is wrong: the spec's "What every package obeys" requires a comment the step edits to be rewrapped as a whole paragraph at 100 columns.
  - Failure scenario: the next reader or formatter keeps a broken paragraph.
  - Verdict: none.
- **Standards 2.** `src/lib/ui/controls/editor/Editor.svelte` (540 lines, the cap).
  - What changed, compared with base:
    - The head comment was cut: "as the terminal follows them", "(`highlights`, the merge editor's conflicts)" and "bars of its own".
    - `oncaret` went from 5 lines to 2 (`const [line, column] = [...]`).
    - `flush` went from 3 lines to 1.
    - The indent effect and the readOnly effect were merged, and a blank line was dropped.
  - What is wrong: the spec's size rule says "comments are not shortened and code is not compacted to stay under it". The brief said what Editor.svelte gives up moves into `options.ts`.
  - Failure scenario: a reader of the head comment loses which parent draws bars and highlights, and the file sits exactly at its cap, so the next change must split it in an unrelated step.
  - Verdict: none on behaviour; item 6's room was made partly by compaction.
- **Standards 3.** `src/lib/ui/controls/editor/DiffEditor.svelte` grew from 492 to 532 lines; `src/lib/views/sources/repositories/diff/Diff.svelte` grew from 519 to 521 lines.
  - What is wrong: the spec's size rule says a file within 20 lines of its cap (540 for a component) is split. The step took DiffEditor.svelte into the margin and grew Diff.svelte inside it, splitting neither.
  - Failure scenario: the next diff-editor change (A1-1, Z328) starts at 532 of 540.
  - Verdict: none.
- **Standards 4.** `src/lib/server/edit/writes/config/config-value.ts` (doc comment of `putBackConfigValue`): "and the undo goes through the value write as before". Also `tests/routes/edit/undo/undo-replaced.test.ts:5`: "Every other undo goes through the value write as before".
  - What is wrong: the spec's no-history rule lists "as before" among banned wording.
  - Failure scenario: none at run time; a history tell in new text.
  - Verdict: none.
- **Standards 5.** Three new view tests are placed in state test folders: `tests/state/sources/repositories/diff/compare-header.client.test.ts` mounts `views/sources/repositories/diff/Diff.svelte`, and `tests/state/sessions/source/symbols.test.ts` and `source-options.test.ts` test `views/` modules.
  - What is wrong: the spec says a new file goes where its concern already lives. `tests/views/sources/repositories/` is at 10 items, but `tests/views/shared/` and other view folders were not used.
  - Failure scenario: someone looking for the tests of `Diff.svelte` under `tests/views/` misses the compare test.
  - Verdict: none.
- **Standards 6.** `agents/reviews/D25-report.md:232-233`: "One read-only git command was run by mistake." / "The orchestrator's shared scratch directory `$S/base` was overwritten by a copy made for the unchanged-tree runs".
  - What is wrong: the spec's "Where you work" says a builder runs no git command and keeps base copies in its own scratchpad. Not verified: I may not read the orchestrator's scratchpad.
  - Failure scenario: if `$S/base` held the base binaries `/spec` staged for landing's interleaved A/B, the A/B at landing compares against the wrong base.
  - Verdict: none; the orchestrator should check or re-stage the base before landing.

## 4. Behaviour

- **Behaviour 1.** The report's "User-visible changes, before and after" (`D25-report.md:215-222`) does not give the view, the state and what differs for several visible changes:
  - `config/behavior.yml` `markdown: { word_wrap: 'on' }`: every Markdown tab now opens wrapped.
  - YAML files with no indented line get 2 spaces, and Makefiles get tabs.
  - `kit/folding.ts`: the folding gutter of C, C++, Java, Dart, R and rite files now folds by braces instead of indentation, and C++ access labels fold.
  - `DiffSection.svelte:206-222`: diffs take the root's `.oculus/settings.yml` word wrap and rulers.
  - The paint limit of 20480 KB colours files up to 20 MB in the editor where 64 KB opened as plaintext.
  - The hunk header cut with an ellipsis.
  - What is wrong: the spec's "What every package obeys" says this section is what the look is read against.
  - Failure scenario: the look on TEST checks the listed points and never opens a Markdown or C file, so a wrong default or broken folding passes unseen.
  - Verdict: none.
- **Behaviour 2.** `src/lib/state/workbench/palette-source.svelte.ts:73-77`: "const id = actions.layout.openView(SETTINGS_VIEW);".
  - What is wrong: the rail opens Settings with `openView(SETTINGS_VIEW, { reveal: 'rail' }, currentPage().id)` (`shell/rail/ActivityRail.svelte:168`), as brief item 13 points at. The picker passes neither. The report lists this as a judgment call without saying where Settings then opens. Not verified.
  - Failure scenario: "Configure 'Lua' language based settings..." opens Settings in another place than the rail's Settings does, for example as a tab in the current pane instead of the System page.
  - Verdict: none; to be seen at the look.

## Declined to judge

- Every on-screen point is the look's on TEST: Alt+Z and Option+Z, the live option changes, the drawn diff layout under 900 px and the comment `+`, the hunk header at 300 px, the single clear button, the unsaved mark going, the compare header, the Text size value, and sticky scroll in Markdown, LaTeX and C++.
- Whether the three language entries should stay while a query is typed: `Palette.svelte` builds `languageEntries` only when `parsed?.argument.trim() === ''`. VS Code's filtering of those quick-pick items was not checked.
- Whether a tab whose language was chosen by hand should follow a new file association. `associate` writes only `sources.yml`, so only a tab painting the map's language follows. VS Code's handling of an explicitly set mode was not checked.
- `$S/base` (Standards 6) was not inspected, by the rule that keeps reviewers out of the orchestrator's scratchpad.

Reviewer usage: about 336,000 tokens, about 91 tool uses, about 29 minutes.


## Repair round 1, refuted

Not settled: the verify list is red on `npm test` (two files the step does not change timed out under load, and both pass alone). I found 3 Spec, 2 Proof, 4 Standards and 0 Behaviour findings over the round. Every ruling except 15 (withdrawn by Z349) is done. No item is violated and no case is partial or unmet. Two things matter most:
- The round moved the one DiffEditor rule that the colour check reported into a `.css` file that check does not read (Standards 1).
- The new after-close test of `LanguageRows.svelte` cannot tell its guard from a guard that drops every answer (Proof 1).

```
$ npm run build            (alone first, from tools/oculus of the worktree)
npm run build >  2>&1  60.83s user 7.39s system 111% cpu 1:01.38 total
exit 0

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   -> exit 1
$ npm test
 ❯ |unit| tests/routes/edit/audit-mute.test.ts (10 tests | 1 failed) 11818ms
     × brings one back, leaving the others where they were 5179ms
 ❯ |unit| tests/server/machine/commands/placeholders.test.ts (9 tests | 2 failed) 38126ms
     × creates nothing, for each line, each selection and each shell 27460ms
     × hands the selection over whole, bare, inside double quotes, in a here-doc and in $(...) 8672ms
 FAIL  |unit| tests/routes/edit/audit-mute.test.ts > the audit mute write > brings one back, leaving the others where they were
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/server/machine/commands/placeholders.test.ts > a selection run through a real shell > creates nothing, for each line, each selection and each shell
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/server/machine/commands/placeholders.test.ts > a selection run through a real shell > hands the selection over whole, bare, inside double quotes, in a here-doc and in $(...)
Error: Test timed out in 5000ms.
 Test Files  2 failed | 573 passed | 24 skipped (599)
      Tests  3 failed | 14113 passed | 643 skipped (14759)
   Duration  303.69s (transform 56.46s, setup 0ms, import 703.23s, tests 439.75s, environment 323ms)
checks: failed with exit 1: npm test

Neither file is changed by the step: `git diff 5f492a9b --stat` over the two files printed nothing. `uptime` gave load averages 13.35 15.44 15.52.
The audit-mute write (`writeMute`, config/audit-mute.ts) imports none of the modules the step changed.
$ npx vitest run tests/routes/edit/audit-mute.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
$ npx vitest run tests/server/machine/commands/placeholders.test.ts
 Test Files  1 passed (1)
      Tests  9 passed (9)

The remaining commands of the list, one by one:
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
rc 0
$ npm run check
COMPLETED 3323 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
rc 0
$ npm run build
rc 0
$ npm run format:check
All matched files use Prettier code style!
rc 0
$ npm run lint
> eslint .
rc 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
rc 0   (0 lines)

The step's 33 test files, run together:
 Test Files  1 failed | 32 passed (33)
      Tests  1 failed | 987 passed (988)
 (the one failure is the slow-tagged "holds in every component under ui, shell, views and routes", see below)

Commands the round's report quotes:
grep -c "c-gutter-modified:" src/lib/themes/themes.css -> 16 ; grep -c "c-scm-modified:" -> 16
ls src/lib/ui/controls/editor | wc -l -> 10 ; ls src/lib/ui/controls/editor/kit | wc -l -> 10
wc -l: Editor.svelte 494, diff/DiffEditor.svelte 479, Diff.svelte 498, gutter/gutter.ts 403, gutter/marks.css 62, diff/read.ts 66, diff/comment-add.css 20, hunk-acts.svelte.ts 68, Source.svelte 501, DiffSection.svelte 515, Palette.svelte 515  (all as reported)
Renamed-name greps (--exclude=local.yml, src tests config HELP.md DESIGN.md README.md), each 0 hits: views/shared/code/source-options, editor/DiffEditor, editor/gutter\.ts, editor/gutter', from './gutter', sessions/source/source-options, sessions/source/symbols, state/sources/repositories/diff/compare-header, repositories/diff-pane, GutterStyles
grep "layoutWatch" diff/DiffEditor.svelte -> :66 (import), :224 (call)   (the report says "print nothing"; see Proof 2)
npm run diagrams, on a scratch copy of the worktree: rc 0; diff -rq of its docs/diagrams against the worktree's -> no output
git status --short: docs/diagrams shows the 7 .dot and 7 .svg as M, nothing new

First runs (the unchanged tree is my own scratch copy: `git diff --no-renames 5f492a9b` applied in reverse, the 12 deleted files rebuilt from their deletion hunks, the untracked files removed; Editor.svelte 538, Source.svelte 528, paint_limit_kb: 64):
ruling 8, fs-text-fresh.test.ts "ends the draft of an emptied family written as {} ...": AssertionError: expected { 'status.line': 220, next: 300 } to deeply equal {}
ruling 5, editor-options.test.ts: TypeError: readEditorOptions is not a function (suite does not load)
Pre-round tree (the round-start copy, with the current test files copied in):
language-picker.test.ts: Tests 3 failed | 16 passed (19): "expected [ +0 ] to deeply equal []", "expected [ Array(1) ] to deeply equal []", "expected [ [ 'settings' ] ] to deeply equal [ [ 'settings', ...(2) ] ]"
origins.test.ts: Tests 1 failed | 6 passed (7): "expected 'Skipped in alpha: klingon (not one of...' to be 'Skipped in alpha: klingon: not one of...'"
editor-options.test.ts: Tests 73 passed (73)
wrap.test.ts --reporter=verbose (worktree): 10 rows "reads a stored ... as null", including "reads a stored [] as null" and "... undefined ..."; Tests 16 passed (16)

The guard of LanguageRows, on a scratch copy: `if (!drawn) return;` replaced by `if (drawn || !drawn) return;` (every answer dropped):
npx vitest run tests/shell/keys/language-picker.test.ts -> Tests 19 passed (19)

The slow colour rule:
$ npx vitest run --tagsFilter slow tests/ui/theme/colours.test.ts
  × holds in every component under ui, shell, views and routes
  "lib/views/sources/files/sections/OpenEditors.svelte: .dirty: background: currentColor (not a surface or a hue)",
  Tests 1 failed | 16 passed (17)
  (the first review's run of this test also listed lib/ui/controls/editor/DiffEditor.svelte's .oculus-comment-add::before; that line is gone)
```

### Verdicts

Rulings of `D25-round1.md`, over the delta:

- 1: done. `Source.svelte:48-64` gives the indentation's whole order, the word wrap with Alt+Z and the rulers. `:75-76` names the Markdown and LaTeX symbols.
- 2: done. The report lists the paths, each with its reason. One line is wrong: `palette-source.svelte.ts` is marked "(new)", but it exists at the base (`git status` M). It also leaves out the new edits to Gutter.svelte's head and DESIGN.md:391/404 (Spec 1).
- 3: done (report, "Ruling 3").
- 4: done. `workbench.yml:154` reads `'Skipped in {0}: {1}: {2}'`. `origins.test.ts:108-113` asserts the whole sentence, red on the pre-round tree.
- 5: done.
  - `editor-options.test.ts` "takes editor.languages over the global keys at their defaults (case 2)" asserts `{ tabs: false, size: 2 }`, then 8 tabs, then the tab's 4 spaces.
  - The old test is retitled "combines the fields one by one ...".
  - The tab-level test is in `source-options.test.ts`.
  - Red on the unchanged tree (suite load).
- 6: done. `views/shared/prose/source-options.ts` is identical to the old file (my word diff printed nothing). The old-path grep finds nothing, and `Code.svelte` stays in `views/shared/code/`. After Q91, `views/shared/` holds 10 items and `prose/` holds 6.
- 7: done. `undo-replaced.test.ts:141,154` are titled "audits that ...", the head comment says why, and the report calls them audits.
- 8: done. `fs-text-fresh.test.ts:101-149` writes `{}` within the cache window and checks that the draft ends. It is red on my unchanged tree.
- 9: done as ruled. The report lists the documents, gives the after-close test and quotes the greps. The test's proof is limited (Proof 1), and one quoted grep does not reproduce literally (Proof 2).
- 10: done. `wrap.test.ts:40` carries `[[]]`, and the run prints "reads a stored [] as null". The `[undefined]` row was added beyond the ruling. It keeps the case the old `[]` produced, and it is harmless.
- 11: done. `Palette.svelte:16-27` is greedy-wrapped at 100 (lines 25 to 27 are 96, 93 and 22 columns, and each next word would pass 100).
- 12: done.
  - The head clauses, `oncaret`, `flush` and the separate indent and readOnly effects match the base (no hunk in `git diff 5f492a9b` at those places).
  - 494 lines.
  - One base blank line is still missing (Standards 4).
  - The room was made with `gutter/marks.css` (Standards 1 and 2).
- 13: done. DiffEditor.svelte is 479 and Diff.svelte 498. The parts are `diff/read.ts`, `diff/comment-add.css` and `hunk-acts.svelte.ts`, each with one concern. The importers (`DiffSection.svelte:34`, `diff-pane.test.ts`, `type-scale.test.ts:329`, `review-comment.test.ts`) and DESIGN.md:404 are updated. I read the moved code against the base and nothing is compacted. `DiffSection.svelte` is still 515 (Standards 3).
- 14: done. `config-value.ts:280-282` and `undo-replaced.test.ts:5-8` describe the current behaviour. A grep of every added comment line for the banned wording finds no history use.
- 15: withdrawn by Z349 and fixed at landing; not judged.
- 16: done. `palette-source.svelte.ts:77-78` calls `openView(SETTINGS_VIEW, { reveal: 'rail' }, currentPage().id)`, destructured as `ActivityRail.svelte:53` destructures it. `language-picker.test.ts` "are opened as the rail opens Settings, on the page on screen" is red on the pre-round tree.
- 17: done. The report's table gives six rows, each with its view, state, before and after.

Items of the brief's "What to build", over the whole diff since the base (the step's 33 test files pass, with the one slow-rule exception named above):

- 1: holds. `readEditorOptions`, the catalog entries and the `editorOptions` selector are in place, and `editor-options.test.ts` passes. The four finding keys are a stated departure.
- 2: holds. See `parseRepoSettings` and `views/shared/prose/source-options.ts`; `source-options.test.ts` and `fs-text-fresh.test.ts` pass.
- 3: holds. See `resolveEditor` (`data/helpers/editor.ts:294-314`) and the `Source.svelte` head comment. Source.svelte is 501 lines.
- 4: holds (`origins.test.ts`, `settings-origins.test.ts`).
- 5: holds (`wrap.test.ts`, `options.test.ts`). The keypress itself is left to the look.
- 6: holds (`options.test.ts`). Editor.svelte is 494 lines and the folder holds 10 items. Standards 1 and 2 bear on how the room was made.
- 7: holds (`symbols.test.ts`, `folding.test.ts`, `kit/latex/`).
- 8: holds (`editor.test.ts`; the base has `paint_limit_kb: 64`).
- 9: holds (`fs-text-fresh.test.ts`; fs.svelte.ts is 869 lines).
- 10: holds in behaviour (`undo-replaced.test.ts`). Its guards are tested only by audits, now titled as such.
- 11: holds (`paint.test.ts`).
- 12: holds. `marks.css:19-21` and `Gutter.svelte:168` paint with `--c-gutter-modified`. The `colours.test.ts` case 19 checks pass, and the grep counts are 16 and 16.
- 13: holds (`language-picker.test.ts`, `palette-source.svelte.ts`). Proof 1 bears on the association answer.
- 14: holds (`diff-pane.test.ts`, `compare-header.client.test.ts`).
- 15: holds (`settings/Header.svelte:104`). How it draws is left to the look.
- 16: holds. `diff/DiffEditor.svelte:184-185` sets the two options, and `commentSides` is in `gutter/gutter.ts:295-302`, covered by `gutter.test.ts`.
- 17: holds (`DiffSection.svelte:501-509`). How it draws is left to the look.
- 18: holds (`settings.test.ts`).
- 19: holds. HELP.md, `desc_behavior` and DESIGN.md (85, 143, 388, 391, 395-396, 404, 409, 430) are updated, and the diagrams equal a fresh `npm run diagrams`.

Cases of the brief's "Cases":

- 1: met (`editor-options.test.ts`, `source-options.test.ts`).
- 2: met. The new case-2 tests give 2 spaces with the global keys at their defaults, then a tab of width 8, then 4 spaces.
- 3, 4, 6: met.
- 5: met through the draft and the module. The keypress and the reload on screen are left to the look.
- 7, 8, 9, 10: met.
- 11: met for `applyOptions` and the diff section's options. The live redraw cannot be verified here; the look settles it.
- 12, 13, 14, 15: met.
- 16: met for the write sequence with `{}` written (`fs-text-fresh.test.ts:101-149`). The unsaved mark going is left to the look.
- 17: met. The stale-offset part is an audit, titled as one.
- 18, 19: met.
- 20: met for the entries, the hints, Auto Detect, the written association, the Settings search and its rail opening. The palette closing after an accepted association has no test (Proof 1). The History row and the tab redrawing as Markdown cannot be verified without the look.
- 21: met (`diff-pane.test.ts`, `compare-header.client.test.ts`).
- 22: not verifiable (CSS; the look settles it).
- 23: met for `commentSides`. The drawn layout is left to the look.
- 24: not verifiable (CSS; the look settles it).
- 25: met.
- 26: met by reading (`options.yml` `holds: lists`, `draft.ts` `pairs`).
- 27 to 34: met.
- 35: met in behaviour. The malformed-record cases are audits, titled as such.

### Findings

Spec

- **Spec 1.** The round adds merge points that the state file's shared-path notes do not record.
  - Where:
    - `src/lib/views/sources/source/Gutter.svelte:4-8`: "gutter as Monaco decorations (ui/controls/editor/gutter/gutter.ts) from the same marks and / blame. The source tab's gutter ...". The whole paragraph is rewrapped.
    - `DESIGN.md:391` (the gutter path).
    - `DESIGN.md:404` (base line 403, the DiffEditor path).
  - What is wrong: these edits follow from moving `gutter.ts` and `DiffEditor.svelte` into folders (rulings 12 and 13). They reach lines that the shared-path notes give to other steps:
    - Q91 changes `Gutter.svelte:3`. That is the line just above the rewrapped lines 4-8.
    - X3c changes the same `DESIGN.md:391` line ("bar's" to "strip's" and more).
    - X3c changes base `DESIGN.md:404`, the line next to D25's 403.
  - The state file says Gutter.svelte is "D25 near :168", and that DESIGN.md has separate passages except `:98` and `:429`. Neither the report's ruling 2 list nor its ruling 9 list flags this.
  - Failure scenario: the second of these landings hits cherry-pick conflicts in Gutter.svelte's head comment and in DESIGN.md:391 and :403-404, which the landing notes do not list. The person merging may keep one side and lose the other step's path change or wording.
- **Spec 2.** `tests/views/sources/repositories/diff/diff-pane.test.ts`: every relative import is now one level deeper (`'../../../../../src/...'`).
  - What is wrong: the round moved diff-pane only to make room for `compare-header.client.test.ts` in a full folder. Z349 moves compare-header back at landing, which leaves `tests/views/sources/repositories/diff/` holding diff-pane alone. The move then has no reason left.
  - Failure scenario: landing keeps a one-file folder and a path that changed for nothing, or moves the file back by hand and edits about 15 import lines.
  - Verdict: none (a landing note).
- **Spec 3.** The round's own report: "`src/lib/state/workbench/palette-source.svelte.ts` (new)".
  - What is wrong: the file exists at the base (`git status --short` shows M; `git diff 5f492a9b --stat` gives 44 insertions and 4 deletions).
  - Failure scenario: a reader treats a shared store that already exists as a new module. No decision rests on it.
  - Verdict: none.

Proof

- **Proof 1.** `tests/shell/keys/language-picker.test.ts:163-190`: "says and closes nothing when the write %s". Under test is `src/lib/shell/keys/LanguageRows.svelte:56-67`: `let drawn = true; onDestroy(() => (drawn = false)); ... if (!drawn) return;`.
  - What is wrong: `rowsFor` renders through `svelte/server`, which runs `onDestroy` when the render ends. So `drawn` is already false before any pick, and every answer in this file arrives as if the palette had closed.
  - With the guard changed to drop every answer (`if (drawn || !drawn) return;`, on a scratch copy), the file still prints `Tests 19 passed (19)`.
  - The test is red without the guard, as the report quotes and my pre-round run reproduces. But no test checks the path the guard must leave alone: with the palette open, an accepted association closes it and a refusal is said. The spec asks for an in-flight case for each asynchronous path. Ruling 9 asked only for the after-close test, so this is a gap in proof, not a missed ruling.
  - Failure scenario: a later change drops every answer of the association write. The second list then stays open after a pick, and a refused write says nothing, while the suite stays green.
  - Verdict: none (case 20 does not name the close).
- **Proof 2.** The report's "Ruling 9" greps: "the removed `selected(` and `layoutWatch` in `DiffEditor.svelte` print nothing".
  - What is wrong: `grep -n layoutWatch src/lib/ui/controls/editor/diff/DiffEditor.svelte` prints `:66` (the import) and `:224` (the call). The function moved to `diff/read.ts` and is imported, so the claim is true only of the local definition. A grep for `function selected\|function layoutWatch\|selected(` prints nothing.
  - No decision rests on it.
  - Failure scenario: a reader checking the quoted grep gets a different result and doubts the other quoted greps.
  - Verdict: none.

Standards

- **Standards 1.** The rule now sits in `src/lib/ui/controls/editor/diff/comment-add.css:8-20`: `.diff-editor .monaco-editor .oculus-comment-add::before { ... background: linear-gradient(var(--accent), var(--accent)) center / 8px 2px no-repeat, ...`. It moved there from DiffEditor.svelte's `<style>`. `marks.css:1-62` moved out of Editor.svelte's `<style>` the same way.
  - What is wrong: the colour rule reads only `<style>` blocks of `.svelte` files (`tests/ui/theme/colours.test.ts`, `styles()`: `source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)`).
  - The first review's run of the slow colour test listed this DiffEditor rule as a violation; my run lists only `OpenEditors.svelte`. The rule's text is unchanged; only its file moved.
  - So the check now passes on this rule only because it does not read `.css` under `ui/`. The same holds for the 13 mark and breakpoint rules in `marks.css`, which pass today.
  - The report does not say the slow test's output changed.
  - This is a known finding of the check closed by moving the code out of its reach. It goes against the spec's "a check made to pass by ... exempting" and the refute rule against a diff that satisfies a check only because the check does not read the path.
  - Failure scenario: a raw hex or a non-surface background written in `comment-add.css` or `marks.css` passes the colour rule. The orchestrator also loses the DiffEditor violation it had on record without anyone fixing it.
  - Verdict: none (items 6 and 13 hold in behaviour).
- **Standards 2.** `src/lib/ui/controls/editor/gutter/marks.css:1-3`: "Monaco puts the classes on elements it makes outside any component, so each rule is held to the editor it sits in." With `.editor .monaco-editor .margin-view-overlays .line-numbers { white-space: pre; }` and the rules below it.
  - What is wrong:
    - In a global stylesheet, `.editor` is a plain class with no scope. It is also the class of `views/sources/repositories/diff/DiffSection.svelte:417` (the wrapper of the diff editor), `views/boards/editor/Editor.svelte:247` and `views/system/workbench/editors/Editor.svelte:87`. In Editor.svelte the Svelte hash held these rules to the primitive. Now they also match the Monaco diff editor inside every diff section, so the comment's sentence is false.
    - Neither new `.css` file opens with its layer. The spec requires every added module to open with the head comment the tree's files open with, its layer included; `themes/code.css` opens "Layer 3, theme.".
    - The specificity claim in the report holds: (0,3,0) and (0,4,0) as before.
  - Failure scenario:
    - Today the diff editor's line numbers take `white-space: pre`, which draws nothing different for digits.
    - A decoration class named `oculus-mark*`, `oculus-highlight` or `oculus-blame*` added to the diff editor would take the source editor's look unasked.
    - A reader trusting the comment rules that out.
  - Verdict: none.
- **Standards 3.** `src/lib/views/sources/repositories/diff/DiffSection.svelte`: 515 lines, against 479 at the base (`wc -l` on both trees).
  - What is wrong: the spec's size rule says a file within 20 lines of its cap (540) is split. The step grew this file into that margin. The first review named only DiffEditor.svelte and Diff.svelte, and ruling 13 did not reach this file; the round touched it again (head comment and import).
  - `Palette.svelte` at 515 is within the brief's own "at or under 520", which differs from the spec's rule. That difference is the orchestrator's to settle.
  - Failure scenario: the next change to a diff section (A1-1, which is held out with Z328) starts at 515 of 540 and has to split the file inside an unrelated step.
  - Verdict: none.
- **Standards 4.** `src/lib/ui/controls/editor/Editor.svelte:224-225`: "const marked = $derived(marks.length > 0);" is followed directly by "// The actions over the marks, ...".
  - What is wrong: the base has a blank line between them. Ruling 12 asked for what was compacted to be put back, and this blank line is still missing. The comment's "added again when either changes" now covers three inputs (the labels, the mark state, the wrap), so "either" is wrong.
  - Failure scenario: a reader takes "either" to mean two inputs and misses that a change to `wrap` re-adds the actions.
  - Verdict: none.

Behaviour

- None of its own. The one change of scope the round makes (the `marks.css` rules reaching the diff editor) is under Standards 2, and nothing visible is expected from it today.

### Declined to judge

- These on-screen points belong to the look on TEST:
  - whether the quick diff marks, breakpoints, blame and comment `+` draw as before now that their rules are global stylesheets loaded beside Monaco's (the cascade order against Monaco's own CSS);
  - the Settings view opening with its rail list on the page on screen;
  - Alt+Z;
  - the live option changes;
  - the inline layout under 900 px;
  - the hunk header at 300 px;
  - the single clear button;
  - the unsaved mark going.
- `HunkActs` (`hunk-acts.svelte.ts`) against the code it replaced in Diff.svelte: I checked it by reading only, and it matches line for line. No test covers the revert confirmation, before or after the split (`grep -rln "revert_confirm"` over `tests` finds no Diff test).
- Whether `views/shared/prose/` is the right concern for `source-options.ts`: ruling 6 placed it there, so that is not mine to judge.
- The two timed-out files in `npm test` (`audit-mute.test.ts`, `placeholders.test.ts`): neither is the step's, and the spec says a reviewer does not count such a failure. Z350 already covers the placeholders file.
- The placements and audit titles of the three test files that ruling 15 moved: Z349 covers them, as instructed.
- My mistake: one of my greps (the renamed-name greps) put the pattern after `--`. That made this machine's grep (ugrep) read `--exclude=local.yml` as a file name, so `config/local.yml` was searched. The command printed match counts only, all 0, so none of the file's content reached any output. I reran the greps with the exclusion in force; those are the lines quoted above.

Reviewer usage: about 300,000 tokens, about 80 tool uses, about 31 minutes.
