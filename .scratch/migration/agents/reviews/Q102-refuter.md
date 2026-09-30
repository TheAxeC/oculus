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
