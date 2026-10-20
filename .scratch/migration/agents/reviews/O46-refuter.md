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

## Repair round 1, refuted

Reviewer over round 1 of O46, on .agents/worktrees/migration-O46, base a28047138, snapshot .agents/worktrees/migration-O46-round-1 (files.txt, 484 paths). The round's delta: 35 paths of files.txt differ from the snapshot (`cmp -s` per path, `diff -u` read whole), and 32 paths changed now that files.txt does not list (read whole or as `git diff a28047138 -- <path>`). A page this report cites is named with its section; a finding in code keeps its `file:line`.

```
Verify 1, from tools/oculus in the worktree:
npm run diagrams && npm run test:quick -- $(cat /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o46-changed-paths.txt)
test:quick: 486 changed file(s), from the given paths
test:quick: 263 test file(s), 9 essential
ok      ASCII gate (0.6 s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      eslint (2.0 s)
ok      svelte-check (7.4 s): 1792528027808 COMPLETED 530 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (61.9 s): Duration  55.48s (transform 54.28s, setup 0ms, import 97.69s, tests 110.84s, environment 3.89s)
test:quick: 64.2 s (limit 45.0 s); every command passed
test:quick: over the time limit
exit 0
(over the 45 s limit, under ruling Z930; not a defect of the step)
shasum docs/diagrams/* | shasum, before and after the run: 21735d3f647a5be296564728c3a9f33fce1d86db both times (the diagrams regenerate to the committed bytes)

The changed-path list against the worktree: every path it names is changed; the worktree's changed paths it leaves out are the 25 deleted paths and config/options/local.yml. That file checked by hand: LC_ALL=C grep -c '[^ -~]' config/options/local.yml: 0; npx prettier --check config/options/local.yml: All matched files use Prettier code style!

Verify 2:
npx vitest run tests/data/sources/config/ tests/checks/config/ tests/server/edit/ tests/state/workbench/ tests/server/files/workspace/
 Test Files  37 passed (37)
      Tests  577 passed | 9 skipped (586)
same with --testTimeout 20000 (the report's form):
 Test Files  37 passed (37)
      Tests  577 passed | 9 skipped (586)

Verify 3: npm run check
COMPLETED 4247 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

Verify 4, from $TMPDIR: ROOT=<worktree>/tools/oculus HUB=<worktree> node o46first/walk-after.ts -v
findings 0 top keys 98
bookmarks: top 0/5, all 3/23
    entries[].label
    entries[].root
    entries[].path
hub-config: top 0/23, all 0/79
workspace: top 0/3, all 0/261
(every other schema line 0/)
schemas 44, keys without a description 3

Verify 5, the brief's python glob over config/**/*.yml with the one path config/local.yml filtered out (config/options/local.yml read):
89 files parsed True
exit 0

Verify 6:
grep -rn "localStorage" src | wc -l: 0
grep -rn "sessionStorage" src, by file: context.ts 1, viewport.ts 6, layout/saved/storage.ts 4, editor-status.svelte.ts 4, routes/present/show/+page.svelte 3 (context.ts:536 is the editor-status keeper, one of the four values)
old-path grep: tests/routes/hubs/hub-secrets.test.ts:89:                'plain/.oculus/config/sources.yml': 'scan: []\n',   (a hub's own folder)

Verify 7: sh utils/unused-exports.sh
Unused exports (229) / Unused exported types (111); base list: (234) / (112)
names only in the worktree, after sorting both lists: none (the lines that differ are the same names under moved paths); only in the base: flattenText, optionText, railLists, BROWSER_GROUP, BROWSER_NAMES, BrowserName, BrowserControl, CARRY_KEY, CARRY_MS, FocusedSource, Chosen, UI_VERSION, AgentAccount

Verify 8: git status --short docs/diagrams: 18 lines, each " M"

Verify 9: read; see Standards 1 and 3.

Commands the report quotes, rerun in the same form:
npx vitest run $(cat $TMPDIR/o46-test-list.txt) --testTimeout 20000   (comm -3 against the *.test.ts of the changed-path list prints nothing)
 Test Files  74 passed (74)
      Tests  906 passed | 2 skipped (908)
npm run test:checks
 Test Files  19 passed (19)
      Tests  326 passed | 9 skipped (335)
npx vitest run tests/routes/apps/app-open.test.ts tests/views/shared/forms/entry-card.test.ts tests/shell/rail/schedule-dialog.test.ts
 Test Files  3 passed (3)
      Tests  49 passed (49)
npx vitest run tests/server/machine/runs/schedules/approval.test.ts --testTimeout 20000
 Test Files  1 passed (1)
      Tests  2 passed (2)
On the builder's base copy $TMPDIR/o46base:
npx vitest run tests/routes/apps/app-open.test.ts tests/views/shared/forms/entry-card.test.ts
 FAIL  |unit| tests/views/shared/forms/entry-card.test.ts  Error: Cannot find module '../../../../src/lib/views/shared/forms/entry/card/EntryCard.svelte'
 Test Files  1 failed | 1 passed (2)
      Tests  44 passed (44)
npx vitest run tests/shell/rail/schedule-dialog.test.ts
     x lists the dependencies first and a line of a folder with the folder
     x says why a chain that does not resolve does not run
      Tests  2 failed | 1 passed (3)
npx vitest run tests/server/machine/runs/schedules/approval.test.ts --testTimeout 20000
Error: Cannot find module '../../../src/lib/data/sources/config/settings/latex.ts' imported from .../o46base/tests/server/root/context-fixture.ts
 Test Files  1 failed (1)
(the report's base run of approval.test.ts with the base's context-fixture swapped in was not rerun: it needs a file swap in the base copy)

Case 15, the catalogOf run over the worktree (node --input-type=module from $TMPDIR, loadConfig of merge/merge.ts, catalogOf, optionOf of config-place.ts, optionPaths over config/defaults/<file>):
appearance.yml: list 25, allow 25, optionPaths 25, differ none
  crt.on rice.brackets rice.icons rice.monospace text_size theme wallpaper.blur wallpaper.dim wallpaper.image wallpaper.panel_blur wallpaper.panel_opacity wallpaper.popover_opacity wallpaper.show wallpaper.themes
behavior.yml: list 109, allow 109, optionPaths 109, differ none
  status_bar.hidden status_bar.quiet status_bar.repository
layout.yml: list 11, allow 11, optionPaths 11, differ none
local.yml: list 26, allow 0, optionPaths 0, differ 26
present.yml: list 1, allow 1, optionPaths 1, differ none
sources.yml: list 14, allow 14, optionPaths 14, differ none
  apps_dir bookmarks schedules wallpaper_dir

Item 1 grep: grep -rn --exclude=local.yml -E "\b(icons|brackets|monospace)\b" HELP.md DESIGN.md docs config/options src/lib | wc -l: 239; of them naming rice.icons|rice.brackets|rice.monospace: 33
Item 5 grep (the report's pattern, the diagrams left out): 19 lines, the same 19 the report lists
History-word grep over $TMPDIR/o46-added-lines.txt (17726 lines), the report's pattern: 63 lines
O44 files, cmp against the main checkout: equal SplitView.svelte, tokens.css, sash/Sash.svelte, sash/sash-size.ts, Focus.svelte, QuickAdd.svelte, list-width.svelte.ts, Terminal.svelte; differs Surface.svelte, FloatLayer.svelte, Graph.svelte, DESIGN.md; main has no ui/frame/Sash.svelte or ui/frame/sash-size.ts. Over the changed-path list, the paths equal to main are those eight and no other.
Sizes over the changed-path list (wc -l per file): no .svelte over 520, no source file over 880. Composer.svelte 473, AgentPickers.svelte 95, card/EntryCard.svelte 330, card/EntryFields.svelte 265, card/EntryLink.svelte 82, card/Grip.svelte 38; base Composer.svelte 523, base EntryCard.svelte 524. Folders that gained a file (ls -A | wc -l): start 8, entry 8, entry/card 4, tests/shell/rail 2, tests/views/shared/forms 2, tests/server/machine/runs/schedules 8.
ASCII gate over src tests config (the rules file's perl form): nothing printed; LC_ALL=C grep '[^ -~]' over HELP.md DESIGN.md README.md docs/*.md and the report: nothing.

Not rerun: the builder's earlier-in-the-round run of approval.test.ts before the holdsText change (Proof 2); sh utils/folder-check.sh (it runs git); every git command the report quotes.
```

### Verdicts

Items of O46.md's "What to build", for the whole diff since the base:

- 1: holds. The five files are in `config/defaults/`, the options in `config/options/`, Verify 5 parses 89 files and Verify 4 prints `findings 0`.
- 2: holds. The options exist under the paths ruling Z963 gives (`rice.icons`, `rice.brackets`, `rice.monospace`), the case 15 run lists them with `theme`, `text_size`, `wallpaper.show`, `crt.on` and the `status_bar` three, and the pages and comments name the built paths (Item 1 grep, 33 hits read).
- 3: holds. `config-place.ts` places the hub keys in the hub's `config.yml` and every other option in `settings:`; cases 16 to 21 pass in Verify 2 and the 74-file run.
- 4: holds. The four state files and the route; Verify 6 prints no `localStorage`.
- 5: holds. `bookmarks`, `schedules`, `apps_dir` in `defaults/sources.yml` and the hub list; `per-oculus.test.ts` passes.
- 6: holds. `docs/templates.md` reads `# commit_message_account: personal`.
- 7: holds. Every options file has its `groups:`; Verify 4 prints no group without a description.
- 8: holds. Verify 4, every catalog schema `0/`.
- 9: holds. Verify 4, `hub-config: all 0/79`, `workspace: all 0/261`.
- 10: holds. The scaffold carries the three `help:` lines; the hub file is the landing's.
- 11: holds for the tree. The walk prints 3 keys, the three bookmarks fields the landing writes into the hub's `.oculus/bookmarks.yml`.
- 12: violated, Standards 1. The comments and pages of the first review's Standards 3 to 5 now say what holds (themes.css, ToolButton, Tag, Chip, argument-list, DESIGN.md:571, data-map), but five HELP.md lines still send the reader to edit a defaults file.

Cases of O46.md's "Cases":

- 1: met, Verify 4 `hub-config: top 0/23, all 0/79`.
- 2: met, Verify 4 and `options.test.ts` in the 74-file run.
- 3: met, Verify 4 `catalogs/vocab: top 0/20, all 0/113`.
- 4: met, Verify 4.
- 5: met, Verify 4 (`schemas/deck-schema`, `schemas/cpp-schema` 0/).
- 6: met for every hub data file but bookmarks, whose three keys wait on the landing's write of the hub file.
- 7: met, Verify 4 `workspace: all 0/261`.
- 8 to 13: met, rows of `tests/data/sources/config/catalog/options.test.ts`, passing in the 74-file run.
- 14: met, `config-folder.test.ts` passes (Verify 2) and Verify 4 `findings 0`.
- 15: met, the case 15 run above: the three lists equal for each defaults file, the base paths plus the new options, `crt.on` for `crt.default`.
- 16 to 19: met, `config-key.test.ts`, `config-value.test.ts`, `workspace-layer.test.ts` in Verify 2 and the 74-file run.
- 20: met, `workspace-layer.test.ts`, `rail.test.ts`, `editor-saved.test.ts`.
- 21: met, `row-writer.test.ts`, `routes/edit/config-key.test.ts`.
- 22: met, `options-pages.test.ts`.
- 23, 24: met, `layout-workspaces.test.ts`, `layout-unread.test.ts`.
- 25: met, `debug-record.test.ts`.
- 26: met, Verify 6.
- 27: met, `per-oculus.test.ts`.
- 28: met, `templates.test.ts` passes in `npm run test:checks`.
- 29: not verifiable on this tree; the walk prints the three bookmarks keys until the landing writes the hub file, and a walk after the landing settles it.

Sections of O46-cases.md:

- Case 20 and decision 4: met, `merge/keyed.ts`, `workspace-layer.test.ts`.
- The write list: met. The report's section "O44's files the worktree carries from main" names every O44 file with its `cmp` against main, reproduced above; Composer.svelte and AgentPickers.svelte are named as outside the write list with the reason.
- Premises the first run changed: met.
- Collapsible lists and families: met, `fold.test.ts`, `settings-fold.test.ts`.
- Z960: not verifiable on this tree. `grep -rn "<Surface" src/lib | wc -l` prints 3 in the worktree and 62 on main, so Data's intro and the other block surfaces exist only after the landing's merge; the look on TEST after the merge settles it.
- Z961: met for the Nodes and Labels rows by render, the card rows by their declared style and the look at landing (the first review's Proof 1 was not carried into the round and stands for the orchestrator).
- Z962: met, with point 4 as ruling Z964 now gives it (Schedule... on the plain entries only, `views/shared/sessions/commands.ts:74-84`).

Items of O46-round1.md:

- 1: holds. The paths stay, the item's grep was read (239 hits, 33 naming the paths, the rest other meanings, sampled and agreed), and "What was wrong in the brief" names the collision with `icons:` of `config/catalogs/icons.yml`.
- 2: holds, with Proof 2, Spec 2 and Behaviour 1. `schedules/routes.ts:216-224` approves through `approveTexts`, the write the form's Save uses; the dialog lists `draftLines` (`schedule.svelte.ts` `chainOf`, `ScheduleDialog.svelte:196-209`); the refusal text is new (`app.yml:210`); HELP.md:110 and :432 say it; the two tests pass on the worktree, and on the base they fail (the quoted `command-missing` run, and a load failure without the fixture swap, reproduced).
- 3: holds, with Spec 1. The card split is equivalent by reading (the markup, the props, the derived values and the styles moved with the elements they style; `EntryLink.svelte` and `Grip.svelte` differ only in their head comments and an import depth); the Composer split follows the same size rule for a file the round changed (item 1's comment at Composer.svelte:469) and is named outside the write list.
- 4: holds. The three names are not exported (`grep -rn -E "(WorkspaceText|OptionWrites|FOLD_AFTER)" src tests`), the tests derive the types from used exports, and Verify 7 lists no added export.
- 5: holds. The comments say where the option is set; DESIGN.md:571 matches `closedToApps` and `placed` of `private.ts` by reading; the data-map rows hold `settings:` and the three keys; the grep of the item gives the 19 lines the report judges. The `app-open.test.ts` rows plant `config/options/local.yml` in place of the path `private.ts` closes; the report's reason reproduces: `open.ts:147-167` closes the whole config folder on the base as on the worktree (`git show a28047138:.../open.ts`, lines 147, 153, 167), and `pathSegmentsOpen` (`apps.ts:220-223`) closes any dot segment first; the rows pass on the base copy (44 passed) and on the worktree.
- 6: violated, Proof 1. The glob is narrowed to the seven files, the five tables give before and after for `boundaries.test.ts`, `allow-duplication.txt`, `allow-styling.ts`, `config.test.ts` and `config-folder.test.ts`, but sixteen other changed test files are given as counts of expectation lines, not one row per changed line.
- 7: holds, the case 15 run above reproduces the report's table.
- 8: violated, Standards 3. The reuse grep, the head comments list, the O44 section and the visible changes are there and reproduce; the history-word grep leaves out words the rules file names, and one such word stands in a comment the round rewrote.

### Findings

#### 1. Spec

- `tests/views/shared/forms/entry-card.test.ts` (new, 149 lines) and `tests/shell/rail/schedule-dialog.test.ts` (new, 70 lines): "describe('an entry card', ..." and "describe('the chain the schedule dialog lists', ..."; what is wrong: round item 3 asks that "every test that renders an entry card passes after, quoted", and no such test existed (the report: "No test renders `Subtasks.svelte`, `Collection.svelte` or `Entry.svelte`"); the builder wrote one. Round item 2 asks for two server tests and names no dialog test. The rules file ("What every package obeys") keeps a test only as the test of an entry of `agents/guarded.md` and says a builder writes no other test, and a step that needs a new entry stops and asks; neither file is under an entry, and the report adds both to "The 14 new test files" for the landing to enter. The right proof of a no-behaviour split was the reading and the look, said as such. Failure scenario: the landing writes Test lines for two tests no ruling asked for, and `entry-card.test.ts` then fails on any later deliberate change of a card's markup order, a cost with no lost work behind it (Standards 4). Verdict: none (round items 2 and 3 hold).
- `src/lib/server/machine/runs/schedules/file.ts:558`: "if (!existsSync(path)) return text === '';"; what is wrong: no item of O46.md, O46-cases.md or the round asks for it; it fixes a defect of the base (by reading: base `file.ts:161-169` `parseFile` reads a missing file as '', base `routes.ts:218` commits only while `holdsText(files.schedules, planned.from)`, and base `holdsText` at 683-689 answers false when the read throws, so the first save into a hub with no `schedules.yml` was refused `entry-changed`). The fix is right by reading: it answers a missing file as the empty text `parseFile` planned from, and a file that exists but cannot be read still answers false. It is inside the write list (`src/lib/server/machine/runs/schedules/` joins it in O46-cases.md), it is needed by the round's own test (approval.test.ts asserts no schedules file before the save), and the report states its before and after in its section "Item 2", but not that it reaches beyond the round's items. Failure scenario: a reader of the landing report takes the change as part of Z964 and does not book that the first schedule of every hub without a schedules file could never be saved before. Verdict: none.

#### 2. Proof

- Report, section "Item 6: the checks' edits, and the glob narrowed", the table under "The other changed test files" (report line 141 on): "| tests/routes/edit/rail.test.ts | 15 | 16 | the comment-keeping `written toContain` lines become ... |"; what is wrong: round item 6 and the rules file's rule on known defects and thresholds ask for every edit to an existing assertion, allow list or predicate "with its before and after ... one row per changed line"; for sixteen files (rail.test.ts 15 removed / 16 added, layout-workspaces.test.ts 26 / 32, config-value.test.ts 11 / 28, commands.test.ts 2 / 25 and the others) the report gives counts and a summary sentence. The reviewer read `rail.test.ts`'s removed guard `expect(resolve(into.layoutFile).startsWith(resolve(tmpdir()) + sep)).toBe(true);` against `write-fixture.ts:73-108`, whose guards cover the scratch folder the test now writes under, and found no widened predicate in what was read; the other fifteen files were not read line by line. Failure scenario: an expectation loosened inside one of those sixteen files (a `toEqual` turned into a `toContain`) passes the landing read, since no row shows its before and after. Verdict: round item 6 violated.
- Report, section "Item 2", last bullet of "What changed": "The first run of `approval.test.ts` on the worktree before this fix answered `{ error: 'entry-changed', names: [] }`; that run was made earlier in this round and is not repeated"; what is wrong: a "fails without the fix" claim with no quoted output. The quoted base run of `approval.test.ts` fails for another reason (`expected { error: 'command-missing', ...(1) } to deeply equal { ok: true }`, the base reading saved commands), before the save reaches the commit, so no quoted run shows the `holdsText` defect. The reading above (Spec 2) confirms the defect, so the decision to keep the fix does not change. Failure scenario: a later reader relies on a run nobody can see and cannot tell whether `entry-changed` came from `holdsText` or from another refusal of the save. Verdict: none.

#### 3. Standards

- `HELP.md:45`: "With `show_tabs: none` and `editor_actions: strip` in `appearance.yml`, ..."; `HELP.md:74`: "... and `wrap_tabs` in `appearance.yml` set the tab strip"; `HELP.md:318`: "Recipes and tools are `latex.recipes` and `latex.tools` in `behavior.yml`"; `HELP.md:470`: "Limits are the `apps:` block of `behavior.yml`."; `HELP.md:541`: "... `calendar.days_ahead` in `behavior.yml` set the polling."; what is wrong: the step makes these files oculus's read-only defaults (HELP.md:495, "oculus's `config/defaults/` folder, which holds oculus's own values and is never written; the open workspace file's `settings:`, which holds your values"), and rewrote the three sibling bullets of the base that named `behavior.yml` (base HELP.md:305, 337, 338, now `settings:`), but left these five; the brief's item 12 asks that every sentence the change makes false is rewritten, and the rules file's grep rule asks the same. Failure scenario: a reader who wants another polling interval follows HELP.md:541, edits `config/defaults/behavior.yml` by hand, and loses the value at the next update of oculus, or wonders why Settings never wrote there. Verdict: item 12 violated.
- Report, section "DONE / NOT DONE", row "The tests the list leaves out": "`npm run test:checks`, last run after the last change"; what is wrong: the rules file ("Token discipline") asks the report to state how many times the builder ran any whole-suite command and calls a whole-suite command a finding of the review; `npm run test:checks` ran in the round, and the report gives no count (the quick list's count, 2, is given). Failure scenario: the orchestrator cannot book the round's runs against the rule. Verdict: none.
- Report, section "Item 8", "History-word grep over the added lines": "grep -i -E \"no longer|used to |previously|formerly|renamed|...\""; with `src/lib/themes/themes.css:76`: "of the components weigh against it as before. */"; what is wrong: the rules file ("What every package obeys", no history in code or comments) names 'before', 'still', 'always has been', 'always had', 'as before' and 'after this package lands'; the builder's pattern leaves out all but 'no longer', 'used to' and 'previously'. A grep of the same added lines for `as before` prints one line, `themes.css:76`, inside the paragraph this round rewrote (item 5, themes.css:72-76); the 38 `still` hits were read and are present-tense conditions. Failure scenario: a comparison with an earlier state lands in a rewritten comment because the grep that should have caught it did not ask for it. Verdict: round item 8 violated.
- `tests/views/shared/forms/entry-card.test.ts`: "it('draws the fields the schema names in its order, each by its kind', ..."; what is wrong: the rules file keeps a test only for behaviour whose failure costs something; the order and kind of a card's drawn fields is a visible layout whose break loses no work, breaks no installation and accepts no wrong configuration, and the row exists to prove a no-change split. Failure scenario: the next step that reorders a card's fields on purpose has to edit a 36-line expected list that guards nothing of cost. Verdict: none.

#### 4. Behaviour

- `src/lib/server/machine/runs/schedules/routes.ts:163-166`, `:216-224`: "return { entry, chain: chainText(repo.repo, chainLines(repo.repo, chain.chain)) };" and "const approved = approveTexts(options.approvalsFor(), [chain]);"; with `src/lib/shell/rail/ScheduleDialog.svelte:39`: "const chain = $derived(draft === null ? null : schedule.chainOf(draft, commands));"; what is wrong: the dialog lists the chain from the page's held list of the repository's commands, while the save approves the chain the server resolves from `commands.yml` at the moment of the save; nothing ties the two (the save sends no chain text or hash, and the server compares none). Z964 says Save approves "that chain", the one listed. The command form's Save has the same shape (`commands/routes.ts:151-166`), so the round followed the write the brief named; the report's judgment call ("so a page cannot approve a chain the file does not hold") states the server side and not the window. The approval is also written before the schedules file is committed, so a save refused afterwards (`entry-changed`, a record that cannot be moved) leaves the chain approved with no schedule saved. Failure scenario: the reader opens Schedule... on `deploy` and sees `make`; a `git pull` changes `deploy`'s `run` to another line; the reader presses Save before the store's refetch lands; the server approves the new line the reader never saw, and the schedule runs it at its due time with no question. Verdict: none; the report should state it among its limitations or the orchestrator should rule on sending the listed chain with the save.

### Declined to judge

- `sh utils/folder-check.sh`, which the builder ran once and which runs `git rev-parse` and `git ls-files` itself: not rerun, since it calls git. The rules file forbids every git command of a builder other than the verify list's own read, and names `utils/folder-check.sh` as the tool that holds the folder rule; whether that run is a departure to book is the orchestrator's call. The folders the round gave a file were counted with `ls -A | wc -l` (all at 8 or under).
- The builder's one read-only `sed -n` print this round: the round forbids edits by `sed`, and a print is no edit; what it printed cannot be checked from here.
- Whether the landing's cherry-pick applies O44's files and `Graph.svelte` cleanly over main: needs `git cherry-pick` or `git merge-tree`, outside the three allowed git commands.
- The look on TEST: Z960's edges and Data's intro (only on main's 62 Surface uses), Z961's lift and its 120 ms ease, the map labels after the `Labels.svelte` split, the schedule dialog's chain list (its numbering at `calc(10px + 1.4em)`), and the composer's pickers after the AgentPickers split.
- The base run of `approval.test.ts` with the base's `context-fixture.ts` swapped into `$TMPDIR/o46base`: not rerun, since it needs a file change in the base copy; the load failure without the swap was reproduced.
- The eleven new test files of round 0 with no guarded entry, the first review's Spec 5, and its Proof 1 on the card rows of `faded-lift.test.ts`: not carried into the round; the orchestrator's.
- "63 lines in 29 files" of the history-word grep: the line count reproduces; the file count was not taken, and no decision rests on it.

Reviewer usage: acdfb1e37017e0013, claude-opus-5-5, 85,744 tokens, 108 tool uses, 22.2 min.

## Closed

The first run's findings:

- Spec 1 (O44's carried files, Z960): the O44 files and `DESIGN.md` 247-248 are merged with main's at landing; Z960's edges and Data's intro are checked by the look on TEST.
- Spec 2 (the toggle names): sent in round 1 under Z963; holds over the round.
- Spec 3 (the builder's scratch scripts): ruling 116; nothing they produced is used, and the round's report quotes only commands and the two probes the brief names.
- Spec 4 (the builder's departures from the launch rules): booked in the landing booking.
- Spec 5 (the new test files with no guarded entry): Z966; written or removed at landing.
- Spec 6 (Schedule... and the chain's approval): sent in round 1 under Z964; holds over the round.
- Spec 7 (`config/options/local.yml`): closed; the file is a catalog with no values, 111 of its 114 lines verbatim from the base's `catalogs/options.yml`.
- Proof 1 (the faded-lift card rows over style text): the cases file allows the parsed-style rows; the look on TEST checks the cards.
- Proof 2 (the checks' edits listed, the glob narrowed): sent in round 1; the rows the round's report leaves as counts are round 1's Proof 1 below.
- Proof 3 (case 15's run after the step): sent in round 1; met over the round.
- Standards 1 (`EntryCard.svelte` over 520 lines): sent in round 1; split over the round.
- Standards 2 to 5 and 8: sent in round 1; hold over the round, except round 1's Standards 1 and 3 below.
- Standards 6: a fact, no change.
- Standards 7 (the quick list over 45 s): ruling Z930, reported as over.
- Behaviour 1 and 2: sent in round 1 under Z964 and Z963.
- Behaviour 3 (O44's carried files): the landing reads them as O44's and takes main's `FloatLayer.svelte`.

Round 1's findings, none sent back:

- Spec 1 and Standards 4 (`entry-card.test.ts`, `schedule-dialog.test.ts`): Z966; `entry-card.test.ts` removed at landing, the schedule tests under the new entry G117.
- Spec 2 (`holdsText` at `schedules/file.ts:558`): kept; a defect of the base fixed inside the write list (the first schedule saved into a hub with no `schedules.yml` was refused `entry-changed`), named in the landing booking as a fix beyond the round's items.
- Proof 1 (sixteen changed test files given as counts): the orchestrator reads each file's diff against the base at landing for a widened assertion or predicate, and the booking gives the rows.
- Proof 2 (the `holdsText` failure narrated): closed by the reviewer's reading of base `file.ts:683-689` and `routes.ts:218`; no decision rests on the run.
- Standards 1 (`HELP.md` 45, 74, 318, 470 and 541 naming `appearance.yml` and `behavior.yml`): fixed at landing, each sentence naming the Settings option written into the workspace file's `settings:`.
- Standards 2 (`npm run test:checks` runs uncounted): booked in the landing booking from the report (one run that found two defects and one after the last change).
- Standards 3 (the history-word grep short of the rules file's words; `themes.css:76` "as before"): fixed at landing; the grep with every word the rules file names runs over the added lines at landing and each hit is read.
- Behaviour 1 (the listed chain against the approved chain; approval before the commit): Z965, fixed at landing.
