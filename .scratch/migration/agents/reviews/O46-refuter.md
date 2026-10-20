# Step O46 refuter report (on .agents/worktrees/migration-O46, base a28047138)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
Verify 1, `npm run test:quick -- --base a28047138` (from tools/oculus in the worktree):
test:quick: 486 changed file(s), from git since a28047138
test:quick: 261 test file(s), 9 essential
ok ASCII gate (0.8 s)
ok prettier (0.8 s): All matched files use Prettier code style!
ok svelte-kit sync (2.4 s)
ok eslint (1.9 s)
ok svelte-check (7.0 s): 1792521802507 COMPLETED 528 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (57.6 s): Duration 51.57s ...
test:quick: 60.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
exit status 0

Verify 2, `npx vitest run tests/data/sources/config/ tests/checks/config/ tests/server/edit/ tests/state/workbench/ tests/server/files/workspace/` (no --testTimeout):
Test Files  37 passed (37)
Tests  577 passed | 9 skipped (586)

Verify 3, `npm run check`:
COMPLETED 4242 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

Verify 4, the builder's probe `ROOT=<worktree>/tools/oculus HUB=<worktree> node $TMPDIR/o46first/walk-after.ts -v`:
findings 0 top keys 98
bookmarks: top 0/5, all 3/23   (entries[].label, entries[].root, entries[].path)
schemas 44, keys without a description 3
hub-config top 0/23, all 0/79; workspace top 0/3, all 0/261
same probe with HUB=$TMPDIR/o46probe/hub29 (its .oculus/bookmarks.yml carries the scaffold's three help lines):
schemas 44, keys without a description 0

Verify 5, the brief's python glob over config/**/*.yml with every path named local.yml filtered out (config/options/local.yml is not opened):
88 files parsed, exit status 0

Verify 6:
grep -rn "localStorage" src: nothing
grep -rn "sessionStorage" src: hits only in viewport.ts, layout/saved/storage.ts, editor-status.svelte.ts, state/client/context.ts:536, routes/present/show/+page.svelte
old-path grep: tests/routes/hubs/hub-secrets.test.ts:89: 'plain/.oculus/config/sources.yml': 'scan: []\n',   (a hub's own folder, not an old oculus path)

Verify 7, `sh utils/unused-exports.sh` against the base's list:
Unused exports (230)   (base 234)
added: src/lib/state/system/config/view/fold.ts: FOLD_AFTER
added: src/lib/state/system/config/rows.ts: WorkspaceText
added: OptionWrites (src/lib/state/workbench/ui.svelte.ts)

Verify 8: `npm run diagrams` writes files and was not run by the reviewer; in its place:
git status --short (docs/diagrams): the 18 files show " M"
npx vitest run tests/checks/diagrams/: Test Files 2 passed (2) / Tests 48 passed (48)

Verify 9: read; see Standards 3 to 5.

Commands the builder's report quotes, rerun:
npx vitest run $(cat $TMPDIR/o46probe/changed-tests-final.txt)   (no --testTimeout; every changed test file except the moved and deleted ones)
Test Files 70 passed (70)
Tests 855 passed | 2 skipped (857)

First runs on base sources, reproduced in a scratch copy $TMPDIR/o46base (src as at a28047138, tests as in the worktree):
workspace-layer.test.ts: 8 failures
command-menu.test.ts: expected [ 'open' ] to deeply equal [ Array(4) ]
faded-lift.test.ts: fails at load, Labels.svelte missing
in all: Failed Tests 14 (workspace-layer, command-menu, editor-saved, per-oculus) plus faded-lift's load failure

ASCII of the builder's report: 0 non-ASCII lines.

Not rerun: the builder's six test:quick runs and three test:checks runs (whole-suite runs, see Standards 6); every git command the report quotes (declined, git use is limited to the three allowed forms).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The five root files are in `config/defaults/`, `catalogs/options.yml` is split into `config/options/{appearance,behavior,layout,present,sources}.yml`, Verify 5 parses 88 files, and `loadConfig` reports no finding (Verify 4, `findings 0`).
- 2: violated, Spec 2. The options exist and every control writes them (options-pages.test.ts passes in the 70-file run), but `icons`, `brackets` and `monospace` are built as `rice.icons`, `rice.brackets` and `rice.monospace` (`config/defaults/appearance.yml:66-69`), against the names of decision 3, with no report line naming the change.
- 3: holds. `server/edit/writes/config/config-place.ts` `placeOf` sends a hub key to `<hub>/.oculus/config.yml` and every other option to `settings.<key>` of the workspace file, and refuses with no workspace file; cases 16 to 21 pass.
- 4: holds. `server/files/workspace/page-state/files.ts`, `writes.ts`, `routes.ts` and `src/routes/api/(machine)/state/+server.ts` hold the four files and the save turn; Verify 6 lists no `localStorage`.
- 5: holds. `config/defaults/sources.yml` carries `bookmarks`, `schedules` and `apps_dir`, `hub-names.ts` lists them in `HUB_LIST`, and per-oculus.test.ts passes.
- 6: holds. `docs/templates.md:188` reads `# commit_message_account: personal`.
- 7: holds. Every options file has a `groups:` block (appearance: rice, terminal, wallpaper, crt), and Verify 4 reports no group without a description.
- 8: holds. Verify 4: `schemas 44`, the catalog shapes all described.
- 9: holds. Verify 4: hub-config `all 0/79`, workspace `all 0/261`.
- 10: holds. `src/lib/server/files/fs/bookmarks.ts:41-51` writes `help:` on the three field rows; the hub's own `.oculus/bookmarks.yml` gains them at landing (Verify 4 on hub29 prints 0).
- 11: holds for the tree. The probe prints 3 keys on the real hub, the three bookmarks fields whose hub file the landing rewrites; on hub29 it prints 0.
- 12: violated, Standards 3, 4 and 5. Comments and pages still describe the "Settings, This browser" rows and oculus's `config/local.yml` as the state-file placer, and the data map does not name the workspace file's `settings:`.

Cases of the brief's "Cases":

- 1: met, Verify 4 hub-config `top 0/23, all 0/79`.
- 2: met, Verify 4 and the options reader tests in the 70-file run.
- 3: met, Verify 4 (`schemas 44`, no undescribed key in vocab).
- 4: met, Verify 4.
- 5: met, Verify 4.
- 6: met for every hub data file except bookmarks, whose three keys wait for the hub file the landing writes; reproduced at 0 on hub29.
- 7: met, Verify 4 workspace `all 0/261`.
- 8 to 13: met, rows of `tests/data/sources/config/catalog/options.test.ts`, passing in the 70-file run.
- 14: met, `config-folder.test.ts` passes and Verify 4 prints `findings 0`.
- 15: partial, the report quotes only the base run of `catalog.ts` (report line 30) and no after-run; Proof 3.
- 16: met, config-key.test.ts and config-value.test.ts in the 70-file run.
- 17: met, same tests.
- 18: met, same tests.
- 19: met, workspace-layer.test.ts (8 failures on base, pass after).
- 20: met, workspace-layer.test.ts and keyed merge rows.
- 21: met, config-key.test.ts and the rows tests.
- 22: met, options-pages.test.ts.
- 23: met, page-state writes tests.
- 24: met, page-state files tests.
- 25: met, debug-record.test.ts.
- 26: met, Verify 6.
- 27: met, per-oculus.test.ts.
- 28: met, the templates check passes in Verify 1.
- 29: not verifiable on this tree; the read prints 3 keys on the real hub until the landing writes the bookmarks help lines into the hub's `.oculus/bookmarks.yml`, and 0 on hub29. A walk after the landing settles it.

Sections of `O46-cases.md`:

- Case 20 and decision 4 (keyed lists and families in `settings:`): met, `merge/keyed.ts` `mergeRecords` and `mergeFamily`, workspace-layer.test.ts.
- The write list: met for the moved-path files; violated for the O44 files the diff carries, Spec 1.
- Premises the first run changed: met.
- Collapsible lists and families: met, settings-fold.test.ts and fold.test.ts.
- Z960: partial. Surface.svelte carries the rule, but the tree has 3 `<Surface` uses in `src/lib` (`grep -rn "<Surface" src/lib | wc -l`), so Data's intro case cannot be met or looked at on this tree; Spec 1.
- Z961: met for the Nodes and Labels rows by render, and for the card rows only by a read of parsed style text; Proof 1.
- Z962: met by tests/routes/machine/commands.test.ts, command-menu.test.ts, schedules/commands.test.ts and run-chain.test.ts, all passing in the 70-file run; point 4 departs from its text, Spec 6; the schedule consequence is unstated, Behaviour 1.

## 1. Spec

- `src/lib/ui/frame/Surface.svelte` (untracked), `src/lib/ui/frame/sash/` (untracked), `src/lib/ui/frame/sash-size.ts` (deleted), `src/lib/shell/panes/SplitView.svelte`, `src/lib/shell/panes/floats/FloatLayer.svelte`, `src/lib/views/sessions/terminal/Terminal.svelte`, `src/lib/views/sessions/terminal/list/list-width.svelte.ts`, `src/lib/themes/tokens.css`, `src/lib/views/boards/focus/Focus.svelte`, `QuickAdd.svelte`, `src/lib/views/shared/graph/Graph.svelte`: what is wrong: the base a28047138 has no `Surface.svelte`; the diff brings in O44's landed work (the Surface component, the sash move with its importers, the `--panel-on-wall` token, Focus's and QuickAdd's Surface wraps including `.wait-names` at `--fs-xs`, Graph's `data-surface` paint), copied from main (`cmp` against main prints nothing for Focus, QuickAdd, tokens.css, SplitView, list-width and Terminal). The report lists `Surface.svelte 112` and `sash/` in its file list and says "Focus.svelte unchanged against main", but never states that O44's work was imported, and its "Changed outside the folders" line names only `convert-vscode-themes.ts`, though sash/, SplitView, FloatLayer, Terminal and list-width are outside every path of "Paths this step writes" and the cases file. Z960's premise ("51 block Surfaces in src/lib", measured on main) was false on this base; that is a premise found wrong, which the brief says is handed back, not worked around. Failure scenario: the landing reviewer reads the O46 diff as O46's own and judges O44's sash move and Focus font change as this step's; the landing cherry-pick applies hunks main already holds (whether it applies clean is not verified); the Data intro case of Z960 cannot be checked on this tree. Verdict: the write list section violated, Z960 partial.

- `config/defaults/appearance.yml:66-69`: "rice:\n  icons: false\n  brackets: true\n  monospace: true"; what is wrong: decision 3 and item 2 name the top-level options `icons`, `brackets` and `monospace`; the build names them `rice.icons`, `rice.brackets`, `rice.monospace`. A top-level `icons` clashes with `config/catalogs/icons.yml`'s top key `icons:` in the merged map, so the brief's names could not be built; that is a premise found wrong, and the report's "What was wrong in the brief" and "Judgment calls" do not name it (its only mention, line 30, is the base run saying `icons`, `brackets`, `monospace` are not entries). Failure scenario: the landing writes or a reader hand-writes `settings: { icons: true }` in a workspace file, as the brief's names say, and gets `config.settings_unknown` with the toggle unchanged; the orchestrator never rules on the name since nothing raised it. Verdict: item 2 violated.

- `$TMPDIR/o46probe/` and `$TMPDIR/o46first/`: titles.mjs, sumjson.mjs, textkeys.mjs, cascade.mjs, ins.mts, ins2.mts, ins3.mts, boards.mts, probe*.ts, sample.ts, show-keys.ts, keys.ts, zod.ts, p4.ts, catalog.ts, fam.ts, groups.ts, groupsof.ts, local.ts, own.ts, walk.ts, writes.ts, ws.ts; what is wrong: the brief's "Paths this step writes" says "No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under 'What to build'". Only the Verify 4 walk (walk-after.ts) is asked for; the others compute report figures (titles, sums, text-key counts), call `insertKey` and `writeConfigValue` on scratch copies, and compute comment rewraps. Failure scenario: report figures (case 15's counts, the completion texts, the 364-key "before") come from scripts no ruling approved and no reviewer is asked to read, against the rule that a new script needs approval of what it computes. Verdict: none of the items.

- Report "Departures from the launch rules": "One `ls` and two `grep` reads of the session's own transcript file under `~/.claude/projects/`"; "a python command" edited `src/lib/server/root/context.ts`; extra `git -C tools/oculus status` and `git status`; what is wrong: the launch forbids reading session transcripts and limits git and edit tools; disclosed, but each is a departure. The two context.ts lines (import at 48, `registerStateChannel(hub)` at 209) read correctly. `utils/migrations/convert-vscode-themes.ts` (outside the write list) and DESIGN.md line 248 (inside O44's range) are also disclosed. Failure scenario: a transcript read can carry another session's text into the work. Verdict: none.

- New test files with no guarded entry: settings-fold.test.ts, code-theme-choice.test.ts, options-pages.test.ts, debug-record.test.ts, command-menu.test.ts, run-chain.test.ts, per-oculus.test.ts, schedules/commands.test.ts, fold.test.ts, faded-lift.test.ts, workspace-layer.test.ts; what is wrong: the rules file's test rule keeps a test only for behaviour whose failure costs something and under a guarded entry; the report's "Test titles under guarded entries" section maps titles, but these files are not entered there, while the cases file asks for tests of Z961 and Z962. This is a clash between the cases file and the rules file's test rule, for the orchestrator to rule on. Failure scenario: the suite grows by eleven files the guarded list does not account for, and the next step cannot tell which are kept by rule. Verdict: none.

- `src/lib/views/shared/sessions/commands.ts:10-14`: "A plain entry of the repository's `.oculus/commands.yml` (one with a `run`) has Edit, Schedule... and Delete ... A typed entry ... and a command found in a build file have Open File alone"; what is wrong: Z962 point 4 says Schedule... stays on every command; on the base it was on saved commands only (`git show a28047138:...commands.ts`). The builder chose plain entries and reported it under "What was wrong in the brief". Recorded so the orchestrator rules on it before landing. Verdict: Z962 met with this departure.

- `config/options/local.yml` (ruling 180's file name): what is wrong: the hard rule bans opening any file named local.yml, and every `loadConfig` run (Verify 1, 2, 4 and the tests) now reads this file into the options map. No agent can review it, and Verify 5 had to skip it. This is a clash between ruling 180's naming and the never-open-local.yml rule. Failure scenario: a secret or a wrong entry in that file is merged into the options catalog and served to the page with no reviewer able to see it. Verdict: none; raised to the orchestrator.

## 2. Proof

- `tests/views/shared/faded-lift.test.ts:92-96`: "expect(faded.opacity).toBe('0.62');" / "expect(faded.transition).toContain('opacity 120ms');" / "expect(lifted.opacity).toBe('1');"; what is wrong: the CARDS rows parse the component's style block and assert its declared text; the spec's test rule bans asserting source text, and the cases file allows "a test of the rule's selector". These rows pass whatever the browser applies (a selector that never matches under `:hover` or `:focus-within` still passes). Only the Nodes and Labels rows render and check the `lifted` class. Failure scenario: a card's hover selector is misspelt or outranked, the card stays faded under the pointer, and the test stays green. Verdict: Z961 met for the render rows, the card rows rest on the look.

- `tests/checks/tree/boundaries.test.ts:304`, `:312`, `:476` and `tests/checks/tree/allow-duplication.txt:14`: "'data/helpers/run/chain'," / "'data/sources/config/settings/**'," / "'lib/state/shared/words/appearance.ts:look'," / "src/lib/data/sources/config/merge/merge.ts src/lib/server/transcripts/stores.ts ..."; what is wrong: the spec asks the report to list every edit to an allow list or an assertion; these four edits (a new allowed import, a widened glob, a frozen name changed from `crt` to `look`, a moved duplication pair) are not listed, nor are the changed expectations in config.test.ts and config-folder.test.ts. Failure scenario: a reader of the report believes no check was widened; `settings/**` lets any future file under that folder be imported where only the old file was allowed. Verdict: none.

- Report line 30, case 15: "`node catalog.ts`: `appearance.yml: entries 19, optionPaths 18`, ..."; what is wrong: the case asks that the Settings list, the write allow-list and `optionPaths` list the same paths before and after plus the new options; the report quotes the base run only. The reviewer's count of the options files after the step: appearance 25, behavior 109, layout 11, present 1, sources 14 entries, which is consistent with the added options, but no run shows the three lists equal after. Failure scenario: an option present in the catalog but missing from the write allow-list is refused on write, and nothing in the report would show it. Verdict: case 15 partial.

## 3. Standards

- `src/lib/views/shared/forms/entry/EntryCard.svelte` (524 lines, `wc -l`): what is wrong: the spec's size rule caps a component at 520 lines and asks a step that changes a file past the cap to split it; the step changes its head comment (lines 27-33) and leaves it at 524, recommending a later step. That is work inside the step deferred. Failure scenario: the file stays past the cap with each step that touches it deferring the split. Verdict: none.

- `src/lib/state/system/config/rows.ts:147` `WorkspaceText`, `src/lib/state/workbench/ui.svelte.ts` `OptionWrites`, `src/lib/state/system/config/view/fold.ts` `FOLD_AFTER`: what is wrong: the spec's unused-exports rule allows no new export used only by a test; Verify 7 lists these three as added. Failure scenario: the unused-exports list grows with each step and stops showing dead code. Verdict: none.

- `src/lib/themes/themes.css:11`: "the reader turns its toggle off in Settings, This browser"; `:71`: "the Monospace toggle of Settings, This browser takes away"; `src/lib/ui/controls/ToolButton.svelte:464`, `Tag.svelte:85`, `Chip.svelte:167`: "(Settings, This browser)"; `src/lib/shell/keys/lists/argument-list.svelte.ts:84`: "the theme this browser chose"; what is wrong: the step removes the "This browser" rows and the per-browser theme; these comments now say false things, and argument-list.svelte.ts is in the step's diff. Item 12 and the rules file's comment rule ask that comments say what holds. Failure scenario: a reader looks for the Brackets toggle under Settings, This browser and does not find it. Verdict: item 12 violated.

- `DESIGN.md:571`: "every hub's `.oculus/local.yml`, oculus's own `config/local.yml` and each state file or folder the primary hub's `local.yml` places outside them are closed to every app"; what is wrong: `private.ts` no longer takes a `config` field and reads `perOculus`, the state-file keys moved to the hub's `config.yml` (item 5), and oculus's local file is now `config/options/local.yml`. Item 12 lists DESIGN.md's sentences on settings and storage. `tests/routes/apps/app-open.test.ts` still plants `tools/oculus/config/local.yml` and passes (44 passed). Failure scenario: a reader trusts that a schedules file placed by the hub's `config.yml` is closed to apps because the page says `local.yml` places it. Verdict: item 12 violated.

- `docs/data-map.md:17`: "| `.oculus/bookmarks.yml` | the bookmarked folders and files of the Files view |" and the workspace row, which says a workspace file holds "its folders and its primary hub"; what is wrong: the file is unchanged by the step, while a workspace file now holds `settings:` (item 3) and `bookmarks`, `schedules` and `apps_dir` are keys of the hub's `config.yml` (item 5). Item 12 names the pages that say how it works. Failure scenario: a reader of the Help page's Data map does not learn that a workspace file carries settings and edits oculus's defaults instead. Verdict: item 12 violated.

- Report: six `npm run test:quick` runs and three `npm run test:checks` runs; what is wrong: the spec allows one quick-list run and no whole-suite command in a worktree. Failure scenario: time spent, and runs not reproducible from the report. Verdict: none.

- Verify 1: "test:quick: 60.2 s (limit 45.0 s); every command passed" / "test:quick: over the time limit"; what is wrong: the quick list runs past its limit over this diff (261 test files); the report quotes its runs without stating the overrun as a problem. Failure scenario: the next step's quick run exceeds the limit too and the limit stops meaning anything. Verdict: none.

- Report, whole: what is wrong: the spec asks the report to quote the history-word grep over the added text with each hit judged, the reuse grep run before writing a new helper (`yaml-items.ts`, `run/chain.ts`), and the list of head comments re-read; none of the three is in the report. Failure scenario: a history word or a duplicate helper lands unseen. Verdict: none.

## 4. Behaviour

- `src/lib/server/machine/runs/commands/run.ts:141`: "if (!isApproved(approvals, chainText(repo, lines))) return { approve: lines };" with `src/lib/server/machine/runs/schedules/run.ts:70`: "if ('approve' in started) return { refused: 'needs-approval', names: [runs.command] };"; what is wrong: on the base, a scheduled command was a saved command and skipped approval (`git show a28047138:.../commands/run.ts:142` `const asks = resolved.chain.some((command) => command.source !== 'saved');`). Now every chain needs approval, so a scheduled entry of `.oculus/commands.yml` whose chain was not approved through the form's Save (an entry written or changed by hand, or a chain whose dependency changed) is refused `needs-approval` at every due time. The report's "Host- and user-visible changes" states "Save approves them" but not this consequence for schedules. Failure scenario: a reader adds a nightly entry to `.oculus/commands.yml` by hand and schedules it; it never runs and each due time is refused. Verdict: none.

- `config/defaults/appearance.yml:66-69` (see Spec 2): what is wrong: the report's change line says "brackets, icons, monospace ... are options" while the option paths a reader writes are `rice.brackets`, `rice.icons`, `rice.monospace`. Failure scenario: as Spec 2. Verdict: item 2 violated.

- `src/lib/views/boards/focus/Focus.svelte` (`.wait-names` font-size `--fs-xs`) and `src/lib/views/shared/graph/Graph.svelte` (`data-surface` and `--panel-on-wall`): what is wrong: these are visible changes against the base that come from O44's work carried in this diff (Spec 1); the report gives no before and after for them. Failure scenario: the landing look attributes a changed awaiting-row size or graph panel paint to O46 and judges it against O46's brief. Verdict: none.

## Declined to judge

- The content of `config/options/local.yml`: the hard rule bans opening it.
- The builder's git commands: declined, git use is limited to the three allowed forms.
- Whether the Graph.svelte and Labels.svelte split places, hides and remeasures labels as before: no test renders Graph.svelte and the reviewer may not open a browser; by reading, the moved code is equivalent, and the look at landing settles it.
- `utils/migrations/convert-decks.mjs` comments naming `config/present.yml`: the report explains them as the source of a frozen constant; whether such a comment counts as an old path is the orchestrator's call.
- The app-open.test.ts rows that plant `tools/oculus/config/local.yml`: whether they should plant `config/options/local.yml` depends on the ruling on Spec 7.
- Z960's edge measurements and Z961's eased lift: layout and motion no test environment measures; the look at landing.

Reviewer usage: a30b10287abc30449, claude-opus-5-5, 126,695 tokens, 134 tool uses, 19.4 min.
