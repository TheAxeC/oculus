# Step D77 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D77, base abe5c9651)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Summary of the findings, in order of weight:
- Spec 1: the strip is not drawn in the theme's title bar colours, which the brief asked for and gave `tokens.css` and `themes.css` to.
- Standards 1: `context.ts` is left at 890 lines. The rules file says a changed file over 880 is split in the step. The report books it as NOT DONE, which is a deferral of work inside the step.
- Standards 2: HELP.md has no bullet for the two things a user now does in the Session view: Pin across hubs, and a press on an agent row.
- Standards 3: HELP.md says Back opens a closed tab "where it was", which is false for a tab closed on another page.
- Standards 4: the `tokens.css` comment says every theme block that sets the accent sets the graph colours. The 19 VS Code theme blocks set the accent and not these colours.

The report's "test:quick not run on the final tree" row is closed by my run: `npm run test:quick -- --base abe5c9651` passes on the final tree.

## Verification (rerun by the reviewer)

```
ps -axo pid,command | /usr/bin/grep -e vitest -e svelte-check | /usr/bin/grep -v grep
  (nothing; exit 1)

npm run test:quick -- --base abe5c9651          (from tools/oculus in the worktree)
  test:quick: 153 changed file(s), from git since abe5c9651
  test:quick: 189 test file(s), 10 essential
  ok      ASCII gate (0.5 s)
  ok      prettier (3.0 s): All matched files use Prettier code style!
  ok      svelte-kit sync (18.4 s)
  ok      eslint (38.3 s)
  ok      svelte-check (43.9 s): 1792016659297 COMPLETED 508 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (95.7 s): Duration  76.19s (...)
  test:quick: 96.5 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  exit=0

npm run lint                       lint exit=0
npm run format:check               fmt exit=0; All matched files use Prettier code style!
npm run check                      check exit=0; 1792016853535 COMPLETED 4045 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npx vitest run tests/checks/config tests/checks/diagrams tests/checks/imports tests/checks/look tests/checks/source tests/checks/tree --testTimeout 0 --hookTimeout 0 --reporter=dot
  FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
  Error: expected any number of assertion, but got none
  Test Files  1 failed | 17 passed (18)
       Tests  1 failed | 292 passed (293)
  (includes comment-width.test.ts and templates.test.ts named by the brief)

sh utils/folder-check.sh          folder exit=0
sh utils/size-check.sh            size exit=0
sh utils/unused-exports.sh        unused exit=0
diff D77-base/unused-exports.txt <the run>
  161c161  < terminal-marks.ts: markGlyph, resultMark, tabMark   > terminal-marks.ts: resultMark, tabMark
  181c181  < repositories.ts: validName, worktreePath, ...       > repositories.ts: worktreePath, ...
  (only removals; no line added)

ASCII gate, the rules file's perl form, over the 151 existing changed and new files (printf '%s\0' | xargs -0 perl ...)
  (nothing printed) gate exit=0

wc -l src/lib/state/client/context.ts                 890
git show abe5c9651:tools/oculus/src/lib/state/client/context.ts | wc -l     888
changed src/tests files over 880 (520 for .svelte): 890 src/lib/state/client/context.ts (only one)

Commands the builder's report quotes, rerun:
npx vitest run tests/data/sources/config/machine.test.ts             Tests  11 passed (11)
npx vitest run tests/server/sessions/transcript-routes.test.ts       Tests  10 passed (10)
npx vitest run tests/state/system/apps/app-keys.test.ts              Tests  71 passed (71)
npx vitest run tests/server/core tests/server/git tests/state/sources tests/views/sources
  Test Files  23 passed (23)
       Tests  160 passed (160)          (the report says 207 passed (207))
npx vitest run tests/server/desktop/window-guard.test.ts tests/state/sessions tests/views/sources
  Test Files  12 passed (12)   Tests  107 passed (107)
npx vitest run tests/shell tests/ui
  Test Files  10 passed (10)   Tests  56 passed (56)

The builder's probes, in $TMPDIR/d77/after (diff -rq against the worktree: src/ differs only in a comment of tokens.css, config/ identical without local.yml, tests/ differs only by tests/diag):
PROBE_LOG=... npx vitest run tests/diag --reporter=dot
  FAIL |client| tests/diag/graph.client.test.ts > case 42  (Svelte error: invalid_snippet_arguments, in GraphInTree.svelte:34, when the graph cases share one run)
  Test Files  1 failed | 13 passed (14)   Tests  1 failed | 50 passed (51)
npx vitest run tests/diag/graph.client.test.ts -t "case 41|42|43" (each alone)
  Tests  1 passed | 2 skipped (3)   (each of the three)
Probe lines match the report's cases 4-6, 8-9, 14, 16, 18-20, 22-28, 30-32, 35-39, 41-43, the outline row, and the colour table (dracula ref 4.71, solarized base 4.61, solarized remote 4.80; every VS Code theme, light and dark 5.17 / 5.70 / 5.90).

Monaco check (case 24):
/usr/bin/grep -rn -E '\| 88 /\* KeyCode.Minus' node_modules/monaco-editor/esm/vs
  folding.js:804: primary: KeyChord(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Minus */)
  (only the Cmd+K Cmd+Minus chord; no Ctrl+Minus binding)

Theme counts:
grep -c -- '--c-graph-ref' themes.css    13
grep -c -- '--accent:' themes.css        13
grep -c -- '--accent:' vscode.css        19
grep c-graph vscode.css vscode-map.ts    (nothing)

VS Code source (WebFetch, raw.githubusercontent.com microsoft/vscode main, scmHistory.ts):
  registerColor('scmGraph.historyItemRefColor', chartsBlue
  registerColor('scmGraph.historyItemRemoteRefColor', chartsPurple
  registerColor('scmGraph.historyItemBaseRefColor', '#EA5C00'

Cost check of settleAgentFiles (existsSync per agent per fold):
find ~/.claude/projects ~/.claude-work/projects -path '*subagents*' -name 'agent-*.jsonl' | wc -l    2293
node existsSync over the 2293 paths                                                                    3.3255 ms
```

Not run: `npm run diagrams` and `npm run docs:palette`, because both write into the worktree and the reviewer changes nothing. The diagrams and palette checks under `tests/checks` passed in the checks run above.

## Verdicts

Items of the brief's "What to build", in its numbering:

Brief D77.md:
- 1 (Transcript keeps its turns): holds. `sessionId = $derived(record?.id ?? '')`, and `$effect(() => showing(sessionId, agent))` in `Transcript.svelte`. The no-turns sentence is drawn only when `!held.pending`. The flicker harness reran green on the after-copy (tests/diag, 13 files passed).
- 2 (commit message account): holds. Evidence: `--no-session-persistence`, `accountEnv` applied, the `commit_message_account` key with its LOCAL_KEYS, watch FIELDS, machine default, options entry, template line and HELP bullet, and the G13 rows at 11 passed.
- 3 (composer New worktree): holds. The composer probe ran green. Its output in `$TMPDIR/d77/final/composer-out.txt` matches cases 10 to 13. `markGlyph(agent, '')` returns the same glyphs as the removed `agentGlyph` (`terminal-marks.ts:35-41`).
- 4 (Pin every hub): holds in code (case 14 probe). HELP has no bullet: Standards 2.
- 5 (agent transcript): holds in code (G84 at 10 passed, case 16 and 18 probes). HELP has no bullet: Standards 2.
- 6 (title bar strip): violated. The colours: Spec 1. The size rule on `context.ts`: Standards 1. The HELP sentence on a closed tab: Standards 3. The rest holds:
  - the frame, the channels and the find bar under the strip;
  - the history, the chords, the toggles and the saved `hidden` list;
  - Z891's editor actions and the palette commands;
  - `Workbench.svelte` at 459 lines, with `PageArea.svelte` named in the report.
  - `chords.ts` is unchanged. Monaco binds no Ctrl+Minus (grep above), so the brief's "when Monaco takes" condition does not arise.
- 7 (details text): holds, by reading `DetailsBody.svelte`'s three rules at `--fs-sm`, with the labels at `--fs-xs`.
- 8 (DESIGN.md): holds. Each decision and Z889 and Z891 has a bullet with its reason. The false `tokens.css` comment is outside DESIGN.md (Standards 4).

Part 9:
- 1 (Literature page): holds, case 30 probe.
- 2 (References renamed Registries): holds. Case 30 probe, and the grep for `page: references`, `group: references` and `r1-r4` across src, config, docs, DESIGN.md, HELP.md, README.md and tests prints nothing.
- 3 (Tasks): holds. The case 30 probe gives "Tasks", and the fixture and palette page are changed. The hub's line is given as doc text for the orchestrator.
- 4 (Memories on Academic Life): holds, case 30 and 31 probes.
- 5 (the words): holds. Diffs of `config/text/app.yml:26`, HELP.md's key row and `docs/palette.md`.
- 6 (saved layouts): holds in code (case 32 probe). The report leaves out what the old References page shows: Proof 3.

Part 10:
- 1 (indent): holds, by reading the `Changes.svelte` diff (heads `depth={1}`, rows `depth={2 + row.depth}`, cut warning `depth={2}`) and the case 39 probe (`guides=1`). The other sections' look is for landing.
- 2 (menu on the selection): holds, case 35-37 probes.
- 3 (`-uall`): holds. Every status reader that `parse.ts:7` names passes `--untracked-files=all` (grep above). The cap and its warning stay, and the case 38 and cap probes pass. There is a risk on very large untracked trees: Behaviour 2.
- 4 (count before `...`): holds, case 39 probe.
- 5 (comment heads, HELP): holds. Diffs of `Changes.svelte`'s head, `change-menu.ts` and HELP's Source Control bullet.

Part 11:
- 1 (each commit once, entries): holds, case 41 and 42 probes rerun alone.
- 2 (three colours): holds. The tokens are in `tokens.css`, and all 13 themes.css blocks that set the accent set their own. The contrast check passed, the remote pill glyph is drawn as the cloud icon, and the tag pill is plain. The `tokens.css` comment is false: Standards 4.
- 3 (head comments, HELP): holds, by reading the diffs and the HELP Graph bullet.

Cases of the brief's "Cases":

- 1: met. The flicker harness reran green on the after-copy. The builder's first-run output is quoted in the report.
- 2: met (same harness).
- 3: met (same harness).
- 4: met. The probe rerun gives `ARG<--no-session-persistence> ARG<-p> ARG<the prompt>`.
- 5: met. The probe rerun gives `CLAUDE_CONFIG_DIR=<unset>` for absent, empty and the `~/.claude` row.
- 6: met. The probe rerun gives `CLAUDE_CONFIG_DIR=/Users/axelfaes/.claude-work`.
- 7: met. machine.test.ts reran at 11 passed. The rows read as testing the rule (label of another hub, unknown label, Codex label, default without a Claude row, value in the second hub's file).
- 8: met. Probe rerun: `problems=[{"key":"commit_message_account","kind":"value",...}] unknown=[]`.
- 9: met. Probe rerun: `marker file made: false`.
- 10: met. The composer probe ran green; the builder's final output file shows the sends.
- 11: met (same probe).
- 12: met (same probe).
- 13: met (same probe).
- 14: met, probe rerun.
- 15: not verifiable. It is the look; the landing's TEST page settles it.
- 16: met, probe rerun (`CACHE_VERSION: 7`, agent ids, 200 answers).
- 17: met. transcript-routes.test.ts reran at 10 passed. Read: the ten rows cover the brief's refusals and the planted-file assertion.
- 18: met, probe rerun: the agent carries `agentId`, and the 404 holds with the child's record absent.
- 19: met for the `stateId` run. The press is the look.
- 20: met for the unit runs. Whether one double press zooms once in the app is not verifiable here (Declined to judge).
- 21: met. Probe rerun: the strip is drawn in a browser with no room class.
- 22: met, probe rerun.
- 23: met, probe rerun. Monaco's look is for landing.
- 24: met. Probe rerun and the Monaco grep.
- 25: met, probe rerun.
- 26: met, probe rerun.
- 27: met, probe rerun.
- 28: met, probe rerun.
- 29: met by reading.
- 30: met, probe rerun.
- 31: met, probe rerun.
- 32: met, probe rerun. The report says which views are unique. See Proof 3 for what it leaves out.
- 33: met, by reading the app.yml, HELP and palette diffs.
- 34: not verifiable. It is the look.
- 35: met, probe rerun.
- 36: met, probe rerun.
- 37: met, probe rerun.
- 38: met. Probe rerun, including the cap probe and Stage All over 6002 paths.
- 39: met, probe rerun.
- 40: not verifiable beyond the reading of Changes' depths. The look settles the other sections.
- 41: met, rerun alone.
- 42: met, rerun alone.
- 43: met. Rerun alone, plus the colours probe.
- 44: not verifiable. It is the look.

## 1. Spec

- 1. `src/lib/shell/titlebar/TitleBar.svelte:195-197`: "background: var(--bg); color: var(--ink-txt, var(--ink)); border-bottom: 1px solid var(--line);"
  - What is wrong: the brief's item 6 asks for the strip "in the theme's title bar colours". Its path list gives `src/lib/themes/tokens.css, src/lib/themes/themes.css (the strip's colours)`. The step draws the strip in the window chrome tokens of the rail and status bar instead. It adds no title bar token to either file. `vscode-map.ts` maps no `titleBar.*` key (`grep -n 'titleBar\.' src/lib/themes/vscode-map.ts` prints nothing).
  - DESIGN.md:748 states the substitution and its reason. The report lists it as a judgment call, which the brief did not leave open.
  - Failure scenario: under a converted VS Code theme whose title bar colour differs from its side bar, the strip takes the side bar's `--bg` (`#252526` for vscode-dark-visual-studio, vscode.css:376). It does not take that theme's title bar colour. No theme can give the strip a colour of its own.
  - Verdict: item 6 violated.

## 2. Proof

- 1. `.scratch/migration/agents/reviews/D77-report.md:87`: "`npx vitest run tests/server/core tests/server/git tests/state/sources tests/views/sources` `Tests  207 passed (207)`"
  - What is wrong: the rerun of the same command on the final tree prints `Test Files 23 passed (23)`, `Tests 160 passed (160)`. No file in `$TMPDIR/d77/runs` holds 207. The other two counts reproduce (107 and 56).
  - Decision resting on it: the DONE row for part 10 and the coverage claimed for `untrackedByFolder`. Both still hold on 160 green tests.
  - Failure scenario: the orchestrator copies 207 into the ledger as the part 10 evidence, a count no run gives.
  - Verdict: none.
- 2. `.scratch/migration/agents/reviews/D77-report.md:4`: "The final tree went through lint, format, the type check, the checks folder and the test files that cover each later edit, but not through a fourth `test:quick`"
  - What is wrong: the rules file's "Token discipline" asks for the verify list once after the last change. The report's last run predates edits to seven exports, `untrackedByFolder`, the outline and the Command Center. My run of `npm run test:quick -- --base abe5c9651` on the final tree passes every command (96.5 s, over the tier's 45 s limit). The NOT DONE row is therefore closed by the reviewer's run, not the builder's.
  - Failure scenario: none remains after the rerun. The row as written leaves the orchestrator unsure whether the final tree was ever checked.
  - Verdict: none.
- 3. `.scratch/migration/agents/reviews/D77-report.md:63` (case 32): "Reset all pages rebuilds Incoming, Academic Life, Help, Registries and Literature and removes References."
  - What is wrong: part 9 item 6 asks the report to state "what Axel's saved pages show after the change and which Reset gives each the new arrangement".
  - The probe output shows more than the report says. The saved page "References (rail references)" stays in the layout with its six tabs beside the new Registries page, after every button page is opened and after each page Reset (`PROBE 32 after Reset page of Incoming, Academic Life and Help page References (rail references): ["venues",...]`). Only Reset all pages removes it. The report does not say that the old page lingers, or that it shows the same six views Registries does.
  - Failure scenario: Axel opens the Pages view after landing and finds a References page next to Registries, with nothing in the report saying why or how to remove it.
  - Verdict: none (item 6's code holds; the report's statement is incomplete).

## 3. Standards

- 1. `src/lib/state/client/context.ts:870`: "history: createHistory(layout, editorStatus, source, float),"
  - What is wrong: the rules file, section "The code" (size rule), says "A file the step changes that would pass 880 or 520 is split by concern in the step". It also says "comments are not shortened and code is not compacted to stay under it". The file is 890 lines (base 888, `wc -l`). The report books it as a NOT DONE row instead of splitting it. That is work inside the step's scope handed back. The brief's folders paragraph did not name the base's 888, a premise gap for the orchestrator, but the rule binds the step all the same.
  - Failure scenario: the next step that adds a store to the client object pushes the file towards the size check's 900 refusal with no split made. The over-limit file then lands on main as an accepted state.
  - Verdict: item 6 violated.
- 2. `HELP.md:267`: "- **Session.** Details, Changes (the git state of the session's folder) and Agents (its subagents)."
  - What is wrong: the rules file, section "The documents" (the HELP rule), says "A step writes what a user does into HELP.md as short bullets". Two new user actions have no HELP sentence anywhere:
    - Pin offers every project of every hub, grouped by hub (`grep -n -i 'pin' HELP.md` finds only the tab pin at line 51);
    - a press on an agent row opens the agent's own transcript tab, or says it is not available.
  - DESIGN.md has both. HELP has neither.
  - Failure scenario: a reader of the manual does not learn that the agent rows can be pressed, or that Pin lists other hubs' projects.
  - Verdict: none (items 4 and 5 hold in code).
- 3. `HELP.md:23`: "Back to a closed tab opens it again where it was; a step whose file is gone is skipped."
  - What is wrong: `history.svelte.ts:208` reopens through `layout.reopenTab(step.kept)`. `reopenOne` in `layout/tabs/reopen.svelte.ts` opens the tab "in the focused pane of the page on screen" (`const page = access.currentPage().id`). A tab closed on another page, another pane or a float reopens in the focused pane of the page on screen, not where it was. DESIGN.md says this correctly ("as Reopen Closed Tab would"). The rules file's grep rule says "A sentence in a document ... that the change makes false is a defect of the change".
  - Failure scenario: a tab is closed in the Explorer page's right pane, and the reader moves to the Projects page and presses Back. The tab opens in the Projects page's focused pane, while the manual promised its old place.
  - Verdict: item 6 violated (with Standards 1).
- 4. `src/lib/themes/tokens.css:80-85`: "the theme's blue, purple and orange as VS Code's own default to its charts' blue, purple and orange. ... every theme block that sets the accent sets its own."
  - What is wrong, first: `vscode.css` holds 19 `--accent:` declarations and no `--c-graph-*` (counts above), so "every theme block that sets the accent sets its own" is false for the VS Code themes. They take these three light-theme defaults.
  - What is wrong, second: VS Code's base reference default is the fixed `#EA5C00`, not a charts colour (scmHistory.ts, fetched above). The report itself says "I did not read VS Code's own default values for these three colours", so the comment states an unverified fact.
  - Rule broken: the rules file's head-comment rule (a comment says what the code does).
  - Failure scenario: a maintainer adding a VS Code theme trusts the comment, assumes the converter carries the graph colours, and leaves the theme with the fixed blue, purple and orange on a dark VS Code theme.
  - Verdict: none (part 11 item 2 names only themes.css).
- 5. `.scratch/migration/agents/reviews/D77-report.md:6`: "I ran one read-only git command against the base copy: `git -C /Users/axelfaes/workspace/research-hub/.agents/worktrees/D77-base log | head -1`."
  - What is wrong: the rules file, section "Where you work", says "You never run a git command, read-only ones included ... and no `git -C`". The report discloses it, and it changed nothing.
  - Failure scenario: none to the tree. It is a rule breach the orchestrator records.
  - Verdict: none.

## 4. Behaviour

- 1. `src/desktop/decide/window-options.ts:80`: "titleBarOverlay: { height: TITLEBAR_HEIGHT, color: WINDOW_BACKGROUND, symbolColor: SYMBOLS }"
  - What is wrong: off macOS, the window buttons are drawn by the system over the strip's right end on a fixed `#181818` box with `#cccccc` symbols (`WINDOW_BACKGROUND`, window-options.ts:45). Nothing calls `setTitleBarOverlay` when the theme changes (`grep -rn setTitleBarOverlay src` prints nothing). The report's "Host- or user-visible changes" does not state this.
  - Failure scenario: on Windows or Linux under a light theme, a dark box with light symbols sits at the right end of a light strip.
  - Verdict: none (the brief's item names the macOS buttons; the overlay is the builder's addition for other systems).
- 2. `src/lib/server/git/git-write.ts:758`: "return run(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], TIMEOUT_MS);" with `MAX_OUTPUT = 8 * 1024 * 1024` (`git-write.ts:107`); the same holds for `deposit-git.ts:260` (8 MiB) and `core/git/state.ts:199` (32 MiB, `run.ts:99`)
  - What is wrong: with `-uall`, the output grows with every untracked file instead of every untracked folder. A repository holding an un-ignored folder of very many files can pass git-write's 8 MiB output limit. When it does, every write that reads `porcelain` fails: the stash check, Stage All, the discard and untracked writes. Under `normal`, the same repository answered one line. No run measured the point at which this happens; it is not verified. The report states the Stage All argument limit (6002 paths) but not this output limit.
  - Failure scenario: a project folder with an un-ignored cache of a few hundred thousand small files makes Stage All and Stash fail with a buffer error where they worked before the step.
  - Verdict: none (part 10 item 3 asked for `-uall` in every reader).
- 3. `src/lib/views/sessions/terminal/start/Composer.svelte:269`: "keep({ workspace: cwd, agent, ...(made === null ? {} : { split: cwd }) });"
  - What is wrong: a composer opened by New with a prompt in a folder that no place lists (`split` set by `splitRecord`) loses that folder from its picker after a New worktree start, because `split` is overwritten with the worktree's folder. The report's judgment call "The made folder is kept as the record's `split`" does not say the earlier folder is dropped.
  - Failure scenario: a reader opens a composer for an unlisted folder X, starts once in a new worktree, then wants a second session in X. X is no longer offered and must be picked again by path.
  - Verdict: none.

## Declined to judge

- Whether the page's `ondblclick` (`TitleBar.svelte:105`) fires at all on a `-webkit-app-region: drag` region in Electron on macOS, and whether macOS also zooms natively on that double press (a double zoom). It cannot be settled without starting the app, which the reviewer may not do. The landing's look of case 20 ("one double press zooms once") settles it.
- The history store reaches the shell through `+page.svelte` (`history={client.history}`) and `shell/titlebar/history-walk.ts`, not through `SHELL_STORES` in `tests/checks/tree/boundaries.test.ts`. This follows the page's documented hand-in pattern for `walkProblem` and the git writes (`+page.svelte` head comment), and `boundaries.test.ts` passes. Whether `history` should instead join `SHELL_STORES` is the orchestrator's call.
- `GitState.untrackedByFolder` is a new field on the `git` channel's payload (`model-sessions.ts:480`, `state.ts:210`). It is read only by `decorations.ts:123`, and the cap probe shows the Explorer's U marks past the 200 cut. I judge it an internal field. Whether it counts as a wire shape that needs Axel's ruling is the orchestrator's call.
- The `config-folder.test.ts` red: the case loops over `config.docs`, and `config/layout.yml` holds `docs: []` at the base (line 288) and in the worktree (line 300). The worktree root has no `.oculus/` (`ls -a ../../.oculus` prints "No such file or directory"). With `requireAssertions: true` (`vite.config.ts:139`), the case fails with no assertion. The diff touches neither the test, `real-hub.ts` nor `vite.config.ts`. I agree it is unrelated to the step. Whether it passes on main depends on the hub's `.oculus`, which I did not read.
- `test:quick` took 96.5 s with no other vitest running, against the tier's 45 s limit. The overrun comes from the 189 test files that the step's 153 changed files select. It is not judged a defect of the step.
- The builder's graph probe fails case 42 (`invalid_snippet_arguments` in its scratch `GraphInTree.svelte`) when cases 41 to 43 share one run, and passes when each runs alone, as the report says it ran them. This is a property of the scratch harness, not of the tree's code.
- The composer probe's own output file was not compared by me. The probe ran green, and I read the builder's `final/composer-out.txt`.
- The `app-keys.test.ts:251-252` edit from `'b'` to `'q'` keeps the assertion's meaning (a letter no chord uses binds to the app), since `b` is now Literature's chord. The rerun passes 71 of 71. I judged this by reading. Whether `q` stays free in Axel's own layout is outside the fixture.
- VS Code's own default title bar colours for each converted theme were not read, since the theme sources are not in the repository. The `#252526` side bar value is from `vscode.css:376`.

Reviewer usage: a24c5c9f54be2a471, claude-opus-5-5, 259,610 tokens, 159 tool uses, 31.2 min.
