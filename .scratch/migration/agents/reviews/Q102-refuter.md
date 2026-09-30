Q102 refute report (worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q102, base 64d1354a). Nothing was changed in the worktree; probes ran on a copy under the scratch folder Q102-refute/copy and on a private tmux socket that was killed afterwards.

VERIFICATION LINES

I did not run `npm run diagrams`: the reviewer brief says not to. Command: `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from tools/oculus, with node v24.21.0 on PATH. It exited 0. Lines it printed:

```
$ npm test
 Test Files  342 passed | 19 skipped (361)
      Tests  5221 passed | 557 skipped (5778)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
1790730895603 COMPLETED 2354 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 4.60s / built in 11.49s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Other commands I ran:
- The spec's perl ASCII gate over src, tests and config printed nothing. `bin` does not exist in the tool, so bfs reported "bin: No such file or directory".
- `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, README.md and the report printed nothing.
- `sh utils/folder-check.sh` exited 0, and `sh utils/size-check.sh` exited 0.

Commands the report quotes, rerun in the same form:
- The docs grep `grep -rn "stops nothing\|keep running\|keeps running\|leaves its terminals running" src DESIGN.md HELP.md` printed nothing, as the report says.
- The counts of the checks run match the report exactly (5221, 360, 2354 files).
- The 8 new and changed suites, run verbose, gave `Test Files 8 passed (8)`, `Tests 166 passed (166)`.
- The report says `git status --short` gives 74 entries. I count 75; the difference is the untracked report file itself, and no decision rests on the count.
- The open items the report quotes ("none.") match orchestrator-state.md:98-102.

Revert probes on the copy. Every one of these went red:
- R1: moveTerminal closes the tab before writing its state. Red: "closes the tab a last terminal moves out of without ending that terminal".
- R2: runningOf without the running filter. 3 red, including "stops a terminal that ended during the read no more than once".
- R3: closeInstanceAnywhere ends terminals. Red: "ends no terminal when a view leaves the registry".
- R4: tmuxValue without the escape. Red: "hands tmux one argument that reads back as the typed title".
- R5: hubReady answers '' at once. 2 red.
- R6: newTerminalIn picks the page's tab. Red.
- R7: startFor without endTerminals. Red: "ends the terminal a start answers after its tab was closed".
- R8: no release on the portfolio message. 2 red, by timeout.
- R9: busy compared on the full shell path. Red.
- R10: closeOnce without its guard. Red, by timeout.
- R11: forgetTabs ends nothing. 4 red.
- R12: closeAsk drops the unsaved names. Red.

tmux probe on a private socket (tmux 3.7c):
- The argument `build\;` reads back as `build;`, and a raw `raw;` reads back as `raw`.
- A title `#{pane_id}` is listed back through `list-sessions -F` as `#{pane_id}`.
- After `clear-history`, `capture-pane -p -S -1000` still prints the last screen, line7 to line15 and the prompt.

ITEM VERDICTS (What to build)

1. New Terminal starts a shell at once: holds, with two deviations.
   - The pane item does not always take "that pane's active Terminal tab, else a new Terminal tab". See Spec S2.
   - Workbench.svelte is not changed, because the brief's premise about where the strip is wired is wrong. See Spec S4.
   - The rest holds: hub-root waiting, one post per press, and a refusal said on the bar (terminal-start.test.ts, R5, R7, R8).
2. Kinds dropdown: holds (Terminal.svelte:344-353, kindsMenu in terminal-list.ts, terminal-start tests).
3. Split starts at once: holds (terminals.svelte.ts:726-736, the `started` map at 284 and 689, the bar Split at Terminal.svelte:354-361).
4. A row of any number: holds in state (terminal-tabs.ts rowWidths, resizedShares, readTab, the keyed `{#each}` at Terminal.svelte:415). The view overflows whenever two or more terminals are side by side. See Behaviour B1.
5. Rename: holds (edit.ts:61-76, the row, the bar title, the tab label effect, TerminalRows.svelte:57).
6. Change Icon and Change Color: partly violated. The server and the row hold. "The tab draws the icon and the colour" does not hold for the tab strip. See Spec S1.
7. Clear: holds to the brief's shape (edit.ts:111-114, grid-actions.ts clearGrid). The stated purpose is only partly met. See Behaviour B2.
8. Copy as HTML: holds (grid-actions.ts copyAsHtml, the addon loaded in TerminalGrid, the item offered only with a selection).
9. Closing ends what the tab owns: holds (instances.ts closeInstance and forgetTabs, context.ts registerTerminalOwner, terminal-close.test.ts, R1, R2, R3, R11). A composer start has one hole. See Behaviour B5.
10. Asking first: holds (the busy GET, closeAsk, closeOnce, the three async handlers, resetAfterAsking with the busy read passed by ActivityRail, Pages and PagesReset).
11. Docs and words: holds for DESIGN.md, HELP.md, app.yml, terminal.yml and ui.yml. The TerminalList.svelte head comment is left false. See Standards T1.

CASE VERDICTS

Met. For cases 1, 2, 5, 16 and 17 the proof is at the store call; that the control calls it is a look item.
- Cases 1 to 13 are met (1, 2 and 5 at the store call).
- Case 10 is met; the sideways scroll is a look item, and see B1.
- Case 14 is met at the grid helper (a fake grid) and the route double. The grid emptying on screen is a look item.
- Case 15 is met with a fake clipboard. The real clipboard is a look item.
- Case 16 is met: closeAsk answers null, and the close ends the shell.
- Case 17 is met in the pure rule and the store. The dialog's Cancel and Close are a look item.
- Cases 18 to 22 are met; case 22 by an audit.
- Case 23 is met.
  - The "   " clear, the tab refusal and 80 / 81 are met.
  - The trailing `;`: the argument is `build\;`, not the text as typed. My probe shows that this form is what makes tmux store `build;`. The brief's wording for this case is wrong and the builder's behaviour is right.
  - `#{pane_id}`: my probe confirms it is listed back as typed.
- Cases 24 to 40 are met.

No case is partial, unmet or not verifiable beyond the look items above.

SPEC

S1. Item 6 is not drawn on the tab strip.
- Where: src/lib/shell/panes/PaneView.svelte:176. The line is `glyph: registrationGlyph(found),`, and no colour is set.
- What is wrong: the brief says "the row and the tab draw the icon and the colour". The Terminal tab in the strip keeps the view's glyph and no colour. The icon and colour reach only the list row and the bar title (TerminalTitle.svelte).
- Failure scenario: Change Color red and Change Icon refresh on a lone terminal; the strip tab still shows the terminal glyph in the default colour.
- The report does not state this, either as a judgment call or in its before and after.
- Verdict: item 6 partly violated.

S2. The pane target is not the one item 1 names.
- Where: src/lib/state/client/context.ts:198-203. The code is `if (active?.view === TERMINAL_VIEW) return active.id; return pane.tabs.find((tab) => tab.view === TERMINAL_VIEW)?.id ?? null;`
- What is wrong: item 1 says "that pane's active Terminal tab, else a new Terminal tab opened in that pane". The code takes the pane's first, non-active Terminal tab before opening a new one.
- Failure scenario: pane B holds a Terminal tab behind an active File tab. New Terminal from B's strip starts in that hidden Terminal tab and activates it, instead of opening a new tab.
- Case 4's wording allows it, but the report's judgment calls do not list it.
- Verdict: a deviation not reported.

S3. Paths outside the brief's list are not flagged as such.
- The paths: src/lib/ui/forms/choice/GlyphDialog.svelte (a new ui primitive), src/lib/state/workbench/layout/open/opening.ts (`openInPane`), tests/ui/frame/floating-bar.test.ts and tests/views/whole/type-scale.test.ts. The two test files follow from the move into grid/.
- The report lists the files but never says they are outside the paths list.
- Verdict: low.

S4. A brief premise that my grep does not reproduce, and the report does not name it.
- At base, Workbench.svelte:160 `composeIn: (page) => client.terminals.composeIn(page)` is the key handler's composeIn. The strip's composeIn came from PaneView.svelte:96 (`terminals: { composeIn }`), per `git show 64d1354a:.../PaneView.svelte | grep -n composeIn`.
- The builder wired newTerminalIn in PaneView, which is correct. The report's "Brief errors" leaves this out.
- The report's first "Not done" item (the trailing `;` not verified against real tmux) is settled by my probe above. The brief's case 23 premise, that the argument "holds it as typed", is what is wrong.

S5. The first run is not given per case.
- The brief asks for "the first run of every case above on the unchanged tree, with each case's result noted".
- The report gives only aggregates ("99 new or changed cases: 70 failed, 29 passed" and a three-row table). No one of the 40 cases has its own first-run result.
- Verdict: a case whose first run the report does not give (all 40).

S6. The builder ran git commands.
- The report says: "Read-only git commands (`git diff --stat`, `git log`, `git status`) were run early in the work".
- agents/spec.md says "You never run a git command ... not `status`".
- Verdict: a rule broken, reported by the builder itself.

PROOF

P1. Tests named as audits although a revert turns them red.
- Where: tests/views/sessions/terminal-style.test.ts:151, 177, 199, 206 and 222. Each carries a `// Revert:` line; for example, clearing only the grid obviously fails `expect(events).toEqual(['grid', 'history a1a1a1-shell'])`.
- The report claims "Style (terminal-style.test.ts), 14 of 14 red", which contradicts the audit names.
- Separately, four unrelated find-key and link tests in tests/views/sessions/terminal.test.ts were renamed to "audits that ...". They exercise pure functions (findKey, linkHandler) that a revert would turn red. No item asks for that change.
- Verdict: mislabelled tests; a change no item asks for.

P2. A predicate narrowed in a committed test, not reported.
- Where: tests/ui/menu/menu-words.test.ts:120-124. The check now adds `.filter((label) => !label.startsWith('@'))` before `.toEqual([TERMINAL])`.
- Its intent survives: a literal colour label, or a Join label turned into a key, still fails.
- The spec asks for such a narrowing to be reported, and it is not.
- Verdict: low.

P3. Nothing else. Every revert I tried (R1 to R12) went red as the report says.

STANDARDS

T1. The TerminalList.svelte head comment and prop docs are made false by the change.
- Line 5: "the rows the tab shows marked (both halves of a split)".
- Lines 8-10: "unless it is a half of the split the tab draws".
- Lines 32-35: "Unsplit Terminal on a half of the split the tab shows, which shows that terminal alone, and Join Terminals ... shows it split with the row".
- Line 92: "the shown one, and the right half of a split".
- Now a row holds any number of terminals, `unsplit` takes a terminal out of the row without showing it alone (terminal-tabs.ts:300-306), and `joined` appends to the row.
- Verdict: a false head comment.

T2. The eight colour names are declared twice.
- Where: src/lib/server/machine/pty/sessions.ts:52-61 (`TERMINAL_COLORS`) and src/lib/views/sessions/terminal/grid/grid-look.ts (`COLOR_TOKENS` keys). They are held equal only by the test "audits that names the same eight colours the server accepts".
- The spec's principles say "a rule exists once". The shared data/ layer could hold the list for both sides.
- Verdict: low.

T3. A default where a required argument was asked for.
- Where: src/lib/state/workbench/navigation/pages.ts:296. The code is `busy: () => Promise<readonly BusyTerminal[]> = () => Promise.resolve([])`.
- A future reset caller that forgets the argument silently skips the busy question and ends busy terminals unasked. The three callers pass it today.
- Verdict: low.

No file is over the size limit (size-check exit 0), no folder is over ten items (folder-check exit 0), and no non-ASCII was found.

BEHAVIOUR

B1. A split row always overflows by the width of its handles.
- Where: Terminal.svelte:177-182 and 415-433, with Sash.svelte:97 (`style="flex: 0 0 {SASH_PX}px"`, `SASH_PX = 6` in sash-size.ts:9).
- What is wrong: `rowWidths(tab.shares, rowSpace)` shares out the whole `bodyWidth` of `.main`. Each grid is then drawn `flex: 0 0 ${widths[at]}px`, with a non-shrinking 6 px Sash between neighbours. With n terminals the content is bodyWidth + 6(n-1) px, and `.main` has `overflow-x: auto`.
- Failure scenario: Split one terminal in a 1000 px pane. Two grids of 500 px plus a 6 px handle make 1006 px, so a sideways scrollbar appears and the right terminal's last 6 px are hidden, although the row fits.
- At base the two halves flexed without overflow, so this is a regression. The fix is to subtract (n-1)*SASH_PX from rowSpace.
- Derived from the flex bases, not seen in a browser.

B2. Clear leaves the last screen in tmux, and a reload paints it back.
- The brief's shape (`clear-history` alone) was followed. Decision 5's reason ("a clear that tmux kept would come back on the next reload") is only met for the history above the screen.
- The probe above shows `capture-pane -S -1000` still returns the visible rows after `clear-history`, and channel.ts `#attach` repaints from that capture.
- Failure scenario: run a long command, Clear, reload the page. The last screenful of output returns.
- This is for the orchestrator to judge: fix at landing (also clear the pane's screen) or rule on it.

B3. User-visible changes the report does not state with a before and after:
- The `n` key and the Sessions view's New now open the composer in the tab's folder. Before, it was the hub.
- The bar title (TerminalTitle.svelte) now always draws a kind or icon glyph before the title. Before, it drew none.
- The Sessions list row shows the title when one is set.
- The pane strip's New Terminal now starts in a Terminal tab of that pane, not the page's.
- The close question's new words ("End the programs still running in these terminals?", "{0} is running {1}.", "Unsaved changes in {0}.").
- A press on a terminal of the row now moves the focus and the tab label to it. It is listed as a judgment call, but not as a before and after.

B4. With no project folder, New Terminal on an empty tab waits forever and says nothing.
- Where: terminals.svelte.ts:349-353 with selectors.svelte.ts:193-203. `hubRoot()` is derived from the projects' folders.
- Failure scenario: a portfolio whose projects all have `folder: ''`, or no projects. `hubRoot()` stays '' after the portfolio arrives, so New Terminal on an empty Terminal tab is held with no post and nothing said on the bar.
- Not verified live; an edge case.

B5. A composer start is not tracked in the store's `started` map.
- Where: terminals.svelte.ts:594-600, where `composeTerminal` does not record into `started` (only `startFor` at 689 does), and running() at 760-762.
- A terminal started from the composer (With a Prompt, the `n` key, the Sessions New) is unknown to the store until the sessions payload lists it. In that window, Split on it is refused with "not known to the page yet", and closing its tab ends nothing, since runningOf filters it out.
- Failure scenario: press Start in the composer, then close the tab before the next sessions message. The terminal keeps running unowned.
- Item 9 ("a start answered after its tab closed is ended") is written without restriction to New and Split; case 29 names only those two.
- The window is short. Found by reading, not reproduced.

DECLINED TO JUDGE

- Every look item (the dropdown, the pickers, the rename field, the sideways scroll, the left grid kept, Clear on screen, Copy as HTML into a real clipboard, the close dialogs). These need the page on TEST, which is the orchestrator's landing look. B1 is my reading of the flex bases, not a look.
- The regenerated docs/diagrams: `npm run diagrams` was not run by me, as the reviewer brief says, so I did not check whether they match the source.
- Whether "the tab" in item 6 means the strip tab or the bar title. I read it as the strip tab, as VS Code draws a terminal's icon and colour there. If it means the bar, S1 falls away.
- The GET `?busy=` answering without a token: the brief allows it, and I did not assess its exposure further.

## Repair round 1, refuted

The run of a fresh reviewer (claude-opus-5-5) over repair round 1, saved 2026-09-30 as it reported.

Q102 refute report over repair round 1. Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q102. Base: 64d1354a. I changed nothing in the worktree: `git status --short` gives 87 entries before and after, and `npm run diagrams` rewrote no diagram (the md5 of docs/diagrams/* was defc86ab... both before and after). All probes ran on a copy at scratchpad/Q102-refute-r1/copy (node_modules linked) or on a private tmux socket in that folder. The tmux server was killed and its socket removed.

Not closed: two claims in the round section do not reproduce (item 9's grep, and the report's Clear proof via the parity file). Item 10 is left as the builder states. The before and after of item 11 leaves out three user-visible changes the round itself made.

VERIFICATION LINES (from tools/oculus: `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, node v24.21.0, exit 0)

```
$ npm test
 Test Files  345 passed | 19 skipped (364)
      Tests  5237 passed | 557 skipped (5794)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
1790756559289 COMPLETED 2358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 6.33s
built in 12.34s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Other commands I ran:
- The spec's perl ASCII gate over src, tests and config printed nothing.
- `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, README.md, the report and vscode-parity.md found nothing (exit 1).
- `sh utils/folder-check.sh` and `sh utils/size-check.sh` both exit 0.
- `wc -l`: PaneView.svelte 540, terminals.svelte.ts 892, Terminal.svelte 532, TerminalList.svelte 539, terminal-list.ts 537, terminal-tabs.ts 431.
- The Z40 grep prints nothing.
- The round's 10 test files pass on the copy: `Test Files 10 passed (10)`, `Tests 224 passed (224)`.
- The counts of the checks match the report exactly.

THE ELEVEN ROUND ITEMS

1. The strip tab's icon and colour: closed.
   - PaneView.svelte:175 `...stripMark(registrationGlyph(found), tabMark(instance))`; terminal-marks.ts `tabMarkOf`; TabFace.svelte draws the glyph in `tab.tint`.
   - Revert probes went red. Reading the first terminal in place of the shown one: `expected { glyph: 'refresh', token: '--c-red' } to deeply equal {}`. Dropping TabFace's style: `... to contain 'style="color: var(--c-red)"'`.
   - Whether PaneView actually uses `tabMark` is covered by no test. It is a look item.
2. The pane's active Terminal tab: closed. context.ts:203 `return active?.view === TERMINAL_VIEW ? active.id : null;`. With the old fallback restored on the paneTab line, the test goes red: `expected [ 'a1a1a1-shell', '000001-shell' ] to deeply equal [ 'a1a1a1-shell' ]`.
3. The colour list in one place: closed. `TERMINAL_COLORS` is in data/model/model-sessions.ts:251, and `COLOR_TOKENS: Record<TerminalColor, string>` in terminal-marks.ts:10. With `white` deleted, `npm run check` fails: `ERROR "src/lib/state/sessions/terminal/terminal-marks.ts" 10:7 "Property 'white' is missing ..."`. The builder quotes 13:7; no decision rests on that. See T4 for what is left.
4. The row's handles: closed.
   - `rowWidths(shares, pane, handles)`; Terminal.svelte:183 `handles = (row.length - 1) * SASH_PX`.
   - With `room = pane` the test goes red: `expected 900 to be close to 894`.
   - By reading, the sum of the widths plus the handles is `.main`'s clientWidth (the composer case included), since `.main` has no padding. Whether the scrollbar is gone is a look item.
5. Clear also resets the screen: closed.
   - edit.ts runs `send-keys -R` and then `clear-history`. Without `send-keys -R` the route test goes red.
   - tmux 3.7c probe, 60 lines of output: `before: 60`, `after -R then clear-history: 0`, `nonblank rows: 0`.
   - Side effects are in B1.
6. Composer starts tracked: closed for the window after the answer. `composeTerminal` records into `started`. Without it the test goes red: `expected [ 'a1a1a1-shell' ] to deeply equal [ 'a1a1a1-shell', 'f0f0f0-shell' ]`. The window while the start is in flight is still open; see B2.
7. The empty hub root: closed. `portfolioHeard`, and `startInTab` says `sessions.terminal_no_folder`. Without the refusal the test goes red (`expected true to be false`). With the old `if (root === '') return;` it goes red too (`Test timed out in 5000ms`).
8. The busy argument required: closed. With the argument left out in PagesReset.svelte, `npm run check` fails: `ERROR "src/lib/views/system/workbench/PagesReset.svelte" 47:14 "Expected 8 arguments, but got 7."`.
9. The TerminalList comments: closed for TerminalList.svelte.
   - The claim that `grep -rn "half\|halves" src/lib/views/sessions src/lib/state/sessions` "prints nothing" does not reproduce: it prints 11 lines.
   - One of them is a doc comment the step makes false (terminals.svelte.ts:375). See T1.
10. The audit names: partly closed.
    - The five style cases now have plain names, but they were moved into a folder that does not mirror their source. See T2.
    - The four find-key and link cases keep "audits that". The builder states this, and my rerun confirms the reason: renaming two of them back makes `tests/checks/tree/audits.test.ts` fail with `+ "tests/views/sessions/terminal.test.ts :: never opens a file, ..."` and `+ "... :: takes VS Code keys in the bar ..."`. They are judged below.
11. The report's before and after: partly closed. The table covers B3's six rows of the first review. It leaves out three user-visible changes that round 1 made:
    - The strip tab now drawn in the terminal's icon and colour.
    - The new refusal "No folder to start the terminal in", where before the press waited silently.
    - Clear now blanks the tmux screen, so a reload shows an empty grid, including no shell prompt.

The two points the builder raised

Item 10, the four cases in tests/views/sessions/terminal.test.ts (534, 547, 559, 600):
- None of them renders. Each calls a pure function: `findKey` (three cases) or `linkHandler` (one), both in src/lib/views/sessions/terminal/terminal-list.ts.
- At the base they passed the audits check with plain names only because the base file's `textOf` helper bound locals named `open` and `close` (base lines 130-131), which the scan counts as file-level names.
- By DESIGN.md:72 ("tests/ mirrors src/lib"), a test of terminal-list.ts belongs under tests/views/sessions/. There allow-audits.txt says "nothing is added", so the audits check requires the audit name. They would belong under tests/state/sessions/terminal/ only if `findKey` and `linkHandler` moved into src/lib/state/sessions/terminal/, as `markGlyph` and `colorToken` moved into terminal-marks.ts this round. Moving the tests without the functions breaks the mirror, the same defect as T2.
- Each of the four tests behaviour whose failure costs something:
  - The bar keys: Enter and Escape in the find bar go to the wrong action.
  - Cmd+F versus Ctrl+F: find would open on the wrong key, or the key would reach the shell.
  - "leaves Enter to the shell": a wrong mapping swallows Enter while find is open.
  - "never opens a file, a script or an address that does not parse": a `javascript:` or `file:` link would open. This is the security case.
- Under the spec's own definition (an assertion over source text, a label alone or a constant) they are coverage, not audits; the tree check names them audits only because they do not render.

The first run per case not recorded: nothing shows that each of the 40 cases failed, or did not apply, on the unchanged tree. So for any case that passed first (29 of the 99 new or changed tests did, by the builder's totals), it is unproven whether the test ever exercised the behaviour the step adds. What stands in for it is a named revert per test: the builder's "Red once" lists for both rounds, the first reviewer's R1-R12, and my probes above. Those show that the tests go red against a revert of the fix. They do not show the state of the tree before the step. The first run cannot be recovered from the worktree now. Getting it would need the tests run on a checkout of 64d1354a.

VERDICTS, the whole diff since 64d1354a

What to build:
1. New Terminal: holds. Store tests in terminal-start.test.ts for the bar, the hub root, the three presses, the two quick presses, a refusal, the pane strip and the active tab (probe above), and the no-folder refusal. That each control calls the store is a look item.
2. The kinds dropdown: holds. Tests: "starts Claude at once", "shows the composer for With a Prompt".
3. Split starts at once: holds. The five Split tests; the answered start is kept in `started`.
4. A row of any number: holds. terminal-row.test.ts and the handles probe. The sideways scroll and the left grid kept are look items.
5. Rename: holds. The route tests at terminal-edit.test.ts:154-217, and the terminal-style rename tests.
6. Change Icon and Change Color: holds (S1 of the first review is closed by item 1). The picker and the drawing are look items.
7. Clear: holds (probe above). B1 is a side effect.
8. Copy as HTML: holds. grid-actions.test.ts with fakes; the real clipboard is a look item.
9. Closing ends what the tab owns: holds for the tab, the pane, the page, a reset, a move, a reload and unregistering (terminal-close.test.ts). One gap is left for composer starts that are in flight (B2).
10. Asking first: holds. pages.test.ts:222-402 and terminal-close.test.ts:283-327.
11. Docs and words: holds for DESIGN.md, HELP.md, app.yml and the catalogs. It is violated by one doc comment the step makes false (T1).

Cases:
- 1, 2, 5, 16 and 17 are met at the store call. The press on the control is a look item.
- 3 and 4 are met.
- 6 to 9 are met.
- 10 is met; the scroll is a look item.
- 11 to 13 are met.
- 14 is met at the grid helper and the route; the probe shows tmux's screen and history empty afterwards.
- 15 is met with fakes.
- 18 to 21 are met.
- 22 is met, by a test named as an audit.
- 23 is met (the `;` form was settled by the first probe).
- 24 to 28 are met.
- 29 is met as worded ("New or Split"). The composer's in-flight start is not covered (B2).
- 30 to 40 are met.
- Where I did not probe myself, the verdicts rest on the tests found passing and on the first reviewer's R1-R12. None of the code those reverts cover was changed by round 1, apart from the hub-root wait (rerun above).

SPEC

S1. The builder edited a file under .scratch.
- Where: .scratch/migration/agents/reviews/vscode-parity.md:279.
- The hunk:
  ```
  -| Clear | the terminal | new: clears the view and tmux's history, ...
  +| Clear | the terminal | new: clears the view, tmux's screen (`send-keys -R`) and tmux's history, ...
  ```
- What is wrong: agents/spec.md says "You never edit anything under `tools/oculus/.scratch/`". The brief's paths list names only Q102-report.md there. The report cites the edit as proof ("the Clear row of `vscode-parity.md` say so") without flagging it.
- Failure scenario: a landing that cherry-picks the whole range carries an orchestrator-owned ledger file changed by a builder. The sentence itself is now true, so it can be kept at landing, but that is the orchestrator's decision.

S2. Changes that no round item asks for.
- PaneView.svelte:171-172: the `tabs` doc comment is shortened, and "or two projects ... rather than as "Document" twice" is dropped.
- Low. The text stays true.

PROOF

P1. The item 9 closure claim does not reproduce.
- The report says: "`grep -rn "half\|halves" src/lib/views/sessions src/lib/state/sessions` prints nothing".
- My rerun prints 11 lines, including terminals.svelte.ts:375 and TerminalGrid.svelte:452 `<div class="half">`.
- What is wrong: a closure stated from a command that was not run as quoted.

P2. Nothing else. Every revert I applied went red as the report says: items 1 (store and TabFace), 2, 4, 5, 6, 7a, 7b; items 3 and 8 by type error.

STANDARDS

T1. A doc comment the step makes false.
- Where: src/lib/state/sessions/terminals.svelte.ts:374-375.
- The comment: `* Show a terminal. The tab that owns it is activated, ... and shows it, alone unless it is one half of the tab's split.`
- What is wrong: `showTerminal` now calls `showingRow`, and a tab's row holds any number of terminals. "one half of the tab's split" is false. It is the same defect as the first review's T1, in the store rather than TerminalList.
- Failure scenario: a reader of the store believes a tab can show at most two terminals.

T2. The moved tests do not mirror their source.
- Where: tests/state/sessions/terminal/grid-actions.test.ts:1 `// Layer 4, state test.`, imports `src/lib/views/sessions/terminal/grid/grid-actions.ts` and `src/lib/views/sessions/terminal/terminal-list.ts`.
- What is wrong: DESIGN.md:72 says tests/ mirrors src/lib. These are tests of view-layer modules placed under tests/state/, and the head comment calls them a state test. The move was made to escape `tests/checks/tree/audits.test.ts`, which applies only under tests/views.
- Failure scenario: someone looking for grid-actions.ts's tests under tests/views finds none. The next builder copies the move to get round the audit rule.
- The fix that keeps the mirror is either the audit name under tests/views, or moving `clearGrid` and `copyAsHtml` into state. The same choice applies to the four item 10 cases.

T3. A head comment made ungrammatical.
- Where: tests/views/sessions/terminal-style.test.ts:3-4.
- The comment: `// ... The` / `// terminal's Clear and Copy as HTML, which are tests/state/sessions/terminal/grid-actions.test.ts.`
- What is wrong: a sentence fragment. Low.

T4. The eight colour names are spelled a second time, untyped.
- Where: src/lib/views/sessions/terminal/terminal-list.ts:272-290, `colorLabel`, a `switch` over literal `'black'` ... `'white'` with `default: return t('sessions.style_default')`.
- What is wrong: `TERMINAL_COLORS` is now the one list, and `COLOR_TOKENS` is held to it by type. `colorLabel` is not.
- Failure scenario: a ninth name added to `TERMINAL_COLORS` gets a token check but is labelled "Default" in the Change Color menu, with no check turning red.
- Low. The switch exists because catalog keys are written as literals.

No file is over 1000 lines, no folder is over ten items, and no non-ASCII was found. The layer boundaries pass (test:checks).

BEHAVIOUR

B1. `send-keys -R` resets the pane's terminal state, not only its screen.
- Where: src/lib/server/machine/pty/edit.ts:119-121.
- The code:
  ```
  await exec(['send-keys', '-R', '-t', sessionName(listed)], options);
  await exec(['clear-history', '-t', sessionName(listed)], options);
  ```
- Evidence, from a tmux 3.7c probe on a pane whose program turned on the alternate screen and mouse tracking:
  ```
  before: alt=1 mouse=1 std=1
  after:  alt=1 mouse=0 std=0
  tui screen nonblank rows after: 0
  ```
  On a plain shell the prompt row is erased too (`nonblank rows: 0`).
- What is wrong: Clear on a Claude or Codex terminal blanks the full-screen program's screen in tmux, and turns off tmux's record of its mouse mode, while the program still believes both are as it left them.
- Failure scenarios:
  - Clear in a Claude terminal, then reload: the grid is blank until Claude redraws.
  - Clear in a shell, then reload: no prompt shows until Enter.
- Not verified: whether the reset mode reaches the browser grid, since xterm reads the pane's bytes over the control client. That needs the look on TEST (Clear in a Claude terminal, then reload, then click in it).

B2. A composer start answered after its tab closed is not ended.
- Where: src/lib/views/sessions/terminal/Composer.svelte:192-200 (`await composeTerminal(shape)` then `onstarted(...)`), Terminal.svelte:280 `started` calls `restate(withStarted(tab, ...))`. The store's `composeTerminal` (terminals.svelte.ts:604-610) records into `started` but checks no owner.
- What is wrong: item 9 says "A start answered after its tab closed is ended". `startFor` does this; `composeTerminal` does not.
- Failure scenario: press Start in the composer, then close the tab before the compose answer arrives. The terminal starts, no tab lists it, and it runs unowned until someone kills it from the Sessions list.
- Found by reading, not reproduced. The window is the length of one compose post. Case 29 names only New and Split.

DECLINED TO JUDGE

- Every look item: the strip tab's colour on screen, the scrollbar gone for a row that fits, the no-folder sentence on the bar, and Clear on a reload. They need the page on TEST.
- Whether `send-keys -R` affects the browser grid through the control client (B1). It needs the look.
- The first run per case on the base tree, which I did not run.

USAGE

About 50 tool uses and about 215,000 tokens (from the session's token counter). Time was not measured.

## Closed, the run over repair round 1

- S1 (the builder edited `agents/reviews/vscode-parity.md:279`): fixed at landing. The landing script leaves the ledger out of the worktree's add, so the builder's edit does not reach main; the Clear row on main is written by the orchestrator to say what Clear does as landed.
- S2 (the shortened `tabs` comment in `PaneView.svelte`): closed, no change; the comment that is left is true.
- P1 (the item 9 grep claim does not reproduce): closed by T1's fix, which corrects the one line of that grep the step makes false; the claim itself is named in the booking as not reproduced.
- T1 (the false doc comment at `terminals.svelte.ts:374-375`): fixed at landing, the comment says the terminal is shown in its tab's row.
- T2 (`tests/state/sessions/terminal/grid-actions.test.ts` tests view modules): fixed at landing, the file goes to `tests/views/sessions/` with each case named as an audit, as `tests/checks/tree/allow-audits.txt` requires of a case under `tests/views` that draws nothing. The four find-key and link cases of item 10 keep their audit names in `tests/views/sessions/terminal.test.ts` for the same reason. `clearGrid`, `copyAsHtml`, `findKey` and `linkHandler` stay in the view layer: they take a grid, a clipboard, a key event and a link, which are the view's.
- T3 (the sentence fragment at `tests/views/sessions/terminal-style.test.ts:3-4`): fixed at landing.
- T4 (`colorLabel` not held to `TERMINAL_COLORS`): fixed at landing, the labels are a `Record<TerminalColor, ...>`, so a ninth colour without a label fails the type check.
- B1 (`send-keys -R` resets the pane's state): fixed at landing for a full-screen program, `clearTerminal` (`src/lib/server/machine/pty/edit.ts`) asks tmux `#{alternate_on}` and skips the reset while the pane is on the alternate screen, with a test in `tests/routes/sessions/terminal-edit.test.ts`. In a shell the reset still erases the prompt row until Enter; that is seen only after Clear and a reload and is part of the look owed (the state file's Booked section).
- B2 (a composer start answered after its tab closed is not ended): fixed at landing in the store, with a test.
- Item 11 (the before and after lacks three rows): fixed at landing, the three rows are in the booking and the landing report.
- The first run per case not recorded: closed, no change. It cannot be recovered without rebuilding the step; each test's named revert stands in for it, as the run says, and the booking says so.
- The look items (the strip tab's colour, the scrollbar of a row that fits, the no-folder sentence, Clear on a reload): not looked at, the Chrome tab was in the background at the landing; booked as Q102's look owed in the state file's Booked section.

