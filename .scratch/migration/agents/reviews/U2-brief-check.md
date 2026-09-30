Brief check of U2 (`tools/oculus/.scratch/migration/agents/briefs/U2.md`), read on main at 4714293a. main's checkout has uncommitted changes to plan.md, the state file, queue.md and the brief (`git status --short`). I changed no file.

## 1. Names

`grep -rln --exclude-dir=node_modules <name> .` from tools/oculus returns only `agents/briefs/U2.md` for `U2-vscode.css`, `U2-audit.md`, `U2-report.md` and `U2-shots`. `U2-audit-notes` is also named at orchestrator-state.md:150, which books it as this step's input and is consistent with the brief. `ls agents/reviews | grep ^U2` prints only `U2-audit-notes.md`. No worktree under `.agents/worktrees/` (Q108, Q110, X3d, X3d-base) holds a U2 file.

The view ids match HELP.md's table exactly (check 3). TEST is the `look:` key at orchestrator-state.md:21. On main the step lines are at these places (`grep -n '^- \(✅ \)\?\(X3a\|X3c\|X3d\|S3\) ' plan.md`): X3a line 166, X3d line 173, S3 line 175, X3c line 178. U1 is the landed glyph step at plan.md:157. State line 175 records the rename from U1 to U2, so the brief's "booked as U1" is historical and not a collision.

Findings:
1. X3d owns part of `changes`, which the brief audits as if no step owns it. `git status --short` in `.agents/worktrees/X3d` shows these files modified: `src/lib/views/sessions/changes/Changes.svelte`, `ChangesRepo.svelte`, `src/lib/views/shared/changes/ChangeGroups.svelte` and `CommitBox.svelte`. The Changes view imports `ChangeGroups` and `CommitBox` (`ChangesRepo.svelte:12-13`). An audit taken on main now measures parts that X3d is replacing. Change: in "What is on the tree" and Case 8, say that the commit box and the change groups in `changes` are X3d's, as `repositories` is. Either the `changes` section lists them as X3d's and puts them under no U2 group, or `changes` is looked at after X3d lands.

## 2. The step line

The plan line (174) and ruling U2 (on main at plan.md:554; line 555 in the working copy) map to "What to build" as follows:
- "the look of every view", "every view ... VS Code's or not": items 2 and 3, plus item 2's fourth bullet for views with no VS Code counterpart.
- "an audit on TEST": item 2, item 4 and the section "How the looks are taken".
- "the 47 views of HELP.md's table that X3a, X3c and X3d do not own": item 2 (45 sections) and Case 8.
- "against VS Code's visual language": item 1 and the second bullet of item 2.
- The ruling's list (rows, headers, toolbars, spacing, icons, hover actions, empty and error states): the headings in the second bullet of item 2.
- "every difference listed per view": the second bullet of item 2.
- "the build steps follow Axel's ruling on the grouping": item 3.

Findings:
1. The ruling says every view; the step line and the brief stop at HELP.md's table. Eleven registered views are outside the table. This is the command that shows them: `comm -3` of the ids in `id: '...'` of files with `registration: ViewRegistration` under src/lib/views against the table's ids. The eleven are customization, deposit, doc, document, editor, file, note, person, project, slides and source. HELP.md:150 calls some of them views "opened for something". The notes (`U2-audit-notes.md`) already measure deposit and "hub document", and their last line lists project, source and document as not looked at. `source` is the editor that opens every text file, and no step owns its look (`grep` over X3a.md, X3c.md, X3d.md, S3.md and Q91.md). Q91 reworks `project`. This is also a contradiction inside the brief: Case 4 asks for the 31 views of the notes to be looked at again, but deposit and doc have no section anywhere in the audit. Change, recommended: add the eleven views, each looked at in the state it opens in, with `project` noted for Q91. The other option is to leave the step line's scope as it is and book the eleven as an open item against ruling U2. That is the lazy option, because the ruling already covers them.
2. "Indents" is in the full U1 line that the brief quotes (brief line 9) but is not one of item 2's headings. Change: add "indents" to the headings of item 2.

## 3. Premises

Commands rerun and their results:
- `sed -n 98,146p HELP.md | grep -c '^| \`'` prints 47. The ids, in order, match the brief's list exactly.
- `grep -m1 '"version"' .../package.json` prints `"version": "1.137.0"`.
- `stat -f %z .../workbench.desktop.main.css` prints 1615715. The file is ASCII only: `LC_ALL=C grep -o '[^ -~]'` counts 0.
- `grep -o '"workbench.experimental.modernUI":{[^}]*' ...main.js` prints `{type:"boolean",default:!1,description:d(7256,null),experiment:{mode:"auto"`.
- The notes have 32 lines. Line 2 and the last line match the brief. `LC_ALL=C grep -c '[^ -~]'` on the notes prints 0.
- tokens.css has 164 lines.
- plan.md lines 166, 175 and 178 are X3a, S3 and X3c, on HEAD and in the working copy.
- spec.md line 53 is the look rule and line 76 the VS Code rule.
- orchestrator-state.md line 21 is `look:`.
- `ls docs/adr` prints "No such file or directory".

Findings:
1. The line of ruling U2 will move. On HEAD it is at 554 (`git show HEAD:.../plan.md | grep -n`). The uncommitted Q111 line (`git diff plan.md`, at line 280) moves it to 555 once it is committed, and the worktree is cut after that commit. Change: cite line 555, or cite the ruling by its text.
2. The modernUI premise is incomplete. The setting carries `experiment:{mode:"auto"}`, and the js holds `registeredExperimentalDefaults`, so an experiment can change the effective default on an installed VS Code. `grep modernUI` over `~/Library/Application Support/Code/User/settings.json` finds nothing (exit 1). Change: state that the reference is the setting's declared default, taken as a decision, and add it to the brief's list of decisions.
3. Two measures that the audit most needs live in the js, not the stylesheet:
   - The list row height: `getHeight(){return 22}` appears 6 times and `ITEM_HEIGHT=22` 5 times in `workbench.desktop.main.js`.
   - The pane header height: `.pane-header{height:var(--pane-header-size);...}` in the css, where the variable's value comes from the js.

   The tree indent is a setting default in the js. Case 3 says "a value not found in the stylesheet is not written as VS Code's", so the audit could not attribute VS Code's row or header height at all. Change: item 1 also records each js constant used (the grep that finds it, and the matched text) in a comment group of `U2-vscode.css`, and Case 3 accepts a value from such a line.
4. The Read list's item 3 names an "X3d.md section 'What oculus does better'". No such heading exists (`grep -n '^## ' X3d.md`). The text is a paragraph at X3d.md:81. Change: cite "X3d.md lines 33-56 and line 81".
5. spec.md:7 expects the brief to name the DESIGN.md sections the step is measured against. The brief names none (`grep -n DESIGN.md U2.md` finds nothing). DESIGN.md:214-223 (Theming) decides that the icon set is Lucide and that there are fifteen ported themes plus two VS Code blocks. Without that section the audit may list "the icons are not codicons" on every view as a difference, when it is a decided choice. Change: add DESIGN.md "Theming" (214-223) and "Layer 3, view" (156-197) to the Read list. Say that a difference in the icon set itself goes under "anything else" once, as a question for Axel, while icon size, placement and colour role are measured per view.

## 4. Cases and checks

1. **Saving screenshots works as item 4 says.** The loaded schema of `mcp__claude-in-chrome__computer` has `save_to_disk` for `screenshot` and `zoom`, and it "Returns the saved path in the tool result". Where the file lands, and whether the builder's shell may copy from there, is not verified. A full screenshot captures every pane of TEST, not one view. Change: take each shot with `zoom` on the view's pane region with `save_to_disk: true`. If the copy is refused, it is a stop that the report names.
2. **Verify 1 is not sound.** "prints 45 plus the closing sections" has no expected number, because item 3 does not fix the closing headings. How the `settings` heading reads ("headed as S3's") is also not fixed. Change: name the two closing headings (`## Common differences` and `## Proposed grouping`) and expect 47. Fix the heading as `## settings`, with a first line saying its findings go to S3. Replace the id check with `grep '^## ' U2-audit.md | head -45 | cut -c4-`, compared with `diff` against the 45 ids in HELP.md order.
3. **Verify 5 does not reach every terminal.** Reading the Terminal views of TEST misses a terminal whose tab closed while its tmux session kept running (Z99, a Terminal tab closing itself). State line 147 checked with `tmux list-sessions`. Change: record `tmux list-sessions` before the first look and again at the end; the end list equals the start list.
4. **The builder's own tab conflicts with the orchestrator's tab.** Two things show this:
   - The page arrangement is one localStorage key, `oculus.layout.v1` (`src/lib/state/workbench/layout/saved/storage.ts:13`). `savePages` writes the whole page list and the current page on every change (`layout.svelte.ts:444-449`). No tab listens for another tab's writes (`grep -rn "'storage'\|StorageEvent\|BroadcastChannel" src/lib` finds only a code-theme scope). Two tabs editing TEST therefore overwrite each other's saved arrangement: the last writer wins on the next reload, and each rewrites Axel's other pages as they stood when that tab loaded. A new tab also opens on the stored current page, which may be a page Axel works on.
   - Z100 (state line 165) and line 147 ("with the tab in front") show that a tab not in front reads `visibilityState` "hidden" and gives blank screenshots. So the orchestrator's landing looks and the builder's looks cannot run at the same time in one window.

   Change to Decision 4: while U2 is looking, the orchestrator takes no look in its tab, or U2 waits until no landing look is due. The builder's first action is to read which page its tab shows and go straight to TEST through the Pages view, without touching any other page.
5. **A blank screenshot is not a stop condition.** The standing demand at state line 77 treats "a screenshot on the TEST page comes back blank" as an open item. The brief stops only when TEST "cannot be reached". Change: add a blank screenshot to the stop condition.
6. **Writes to Axel's hub are not forbidden.** The server on 8790 writes to Axel's real hub (`writes.ts:191-204`, the hub of local.yml). A look at the Q86c view (state line 147) showed a drag writing a manifest edge. The brief bars dialogs and controls that ask first, but not pins, drags, toggles that save, Add account, rail edits in Settings (which save to `config/layout.yml`), Undo in History, or a `fetch` from `javascript_tool`. Appearance values are kept per browser (HELP.md:145), so changing the theme or text size also changes Axel's own tabs. Change: add rules that no control which writes is pressed; that Appearance is not changed; that `javascript_tool` only reads computed styles and never calls `fetch`; and that History, read at the end, lists no write made during the audit.
7. **The rules for the secret file have gaps.** Config draws `local.yml`'s text when its disclosure is open (`Config.svelte:125-129`), and the open state is instance state saved with TEST's layout. A `source` tab of `engine/local.yml` could also already be open on TEST. A screenshot of another view, or `get_page_text` or `read_page` on the whole page, would then pick up the text. Change: before any screenshot or whole-page read, check that no pane of TEST shows Config with `local.yml` disclosed or a source tab of `local.yml`. If one does, stop and hand it back without reading it; shots are of a single pane only. Search is not an exposure path: `node_modules/@vscode/ripgrep-darwin-arm64/bin/rg --files` in `config/` lists 64 files and 0 matches for `local.yml`, because `tools/oculus/.gitignore:4` ignores it.
8. **Personal data would be committed to git.** Decision 3 has the landing commit `U2-shots/`, which would be the first PNGs in the ledger (`git ls-files tools/oculus/.scratch | grep -c '\.png$'` prints 0). Shots of inbox (real mail), calendar (real events), memories (personal photos), transcript and terminal would carry that data into git. Change: measure those views by computed styles only, like Config, or crop their shots to the header and toolbar. The other option is to keep `U2-shots/` out of the landing commit; that is the orchestrator's decision.
9. **Two spec lines conflict with the brief as written.**
   - spec.md:33 ("You never edit anything under `tools/oculus/.scratch/`") conflicts with the four paths the brief writes. Fifteen briefs follow the same practice (`grep -l 'Write it to \`.scratch/migration/agents/reviews'`). Change: have Decision 3 cite spec.md:33 and say this is the exception every builder report takes.
   - spec.md:63 sets a minimum verify list (npm test and the others) that the brief does not list. E2's brief, which also changes no code, lists the checks (E2.md:146). Change: list them, or state the reason they are not run.
10. **Rules checked with no conflict found:**
   - The TEST page: the look rules agree with the state file (line 21 and the "Chrome checks" demand), with two issues. The brief sends a missing TEST to "New page" in "What is on the tree" but bars any change to the Pages list in Decision 4. Change: say that creating TEST is the only change allowed to the Pages list.
   - The terminal `oculus-a5f844-shell`: the rule agrees with Z57 (a) in the "Chrome checks" demand.
   - Ports 8787 and 8790: the rules agree with spec.md:35.
   - `config/local.yml`: agrees, apart from the gaps in item 7.
   - Verify 3: sound, since both source files are ASCII.
   - Verify 4: sound for its file names, but blind to the leaks in item 7.

## 5. The question: could it pass without the goal being reached?

Cases:
- **Case 1: yes.** "At least one measured element" passes a section with one number and most differences unlisted. Change: each section measures a fixed set wherever the view has it: row height, header height and type, toolbar action size, text button, input, badge, empty state, hover actions revealed by hover, and the focus ring reached by keyboard. It writes "none" where the view lacks one.
- **Case 2: yes.** "Can both be reached" lets a builder declare a state unreachable. Change: the report names the attempt made for each state it says it could not reach.
- **Case 3: yes, and it also blocks the goal.** See 3.3.
- **Case 4: no.** It fails the goal the other way, because two of the 31 notes have nowhere to go (see 2.1).
- **Case 5: no**, apart from the gaps in item 4.7.
- **Case 6: yes.** See item 4.3.
- **Case 7: no.**
- **Case 8: no**, apart from `changes` (1.1).

The step line: yes, for the eleven views outside the table (2.1).

"What to build":
- **Item 1: yes.** It can omit the js constants (3.3).
- **Item 2: yes.** Nothing fixes the pane width, and a view looked at in one wide pane misses how its toolbar overflows at the side-bar width that VS Code's views are drawn at.
- **Item 3: no.** Axel rules on the grouping.
- **Item 4: yes.** A full-window shot does not isolate the view (4.1).

## 6. Implied inputs

This is not a code step. These inputs are implied and missing from Cases:
1. **Pane width.** The notes were taken at about 1180 px, and linkedin at 290 px. Expected: each view looked at in a narrow pane of about VS Code's side-bar width (300 px) and in a wide pane, with both widths named.
2. **Theme.** Expected: the theme in use on TEST is named and not changed (4.6). Colours are judged by role (spec.md:76). Whether `vscode-dark-modern` is the theme to compare against VS Code's default is the orchestrator's call, and changing it is barred.
3. **Text size.** Expected: the default size, named.
4. **Hover and focus states.** Expected: taken per view by `computer` `hover` and by keyboard focus, and measured.
5. **Views that cannot be put in every state on this machine**, which Case 7 covers:
   - session-detail with no live session;
   - agents with no subagent;
   - hpc when off the VPN;
   - inbox and calendar error states;
   - an empty Findings, where the notes show it already empty.

   Expected: the state reached is named, with the attempt made.
6. **TEST already holding tabs.** These are the Config card and a `local.yml` source tab from 4.7. Expected: stop, as proposed there.

## 7. ADRs

`ls docs/adr` in tools/oculus prints "No such file or directory". The same in the hub root prints the same. `grep -n '^adr' orchestrator-state.md` prints nothing, and the configuration block (lines 6-25) has no `adr` key. The hub `.agents/plan.yaml` has `standards: []` (line 8) and no `adr` key (`grep -n -i adr`). No ADR applies.

## Declined to judge

- Whether the 31 notes' reference values are right. The brief makes the builder recheck them, and checking them is the audit's own work.
- Whether screenshots belong in git at all (4.8). That is a decision for the orchestrator or Axel, not a fact in the tree.
- Whether the Chrome tools reach a subagent, and where `save_to_disk` writes. Checking either would mean opening the browser, which this check forbids. The brief's stop rule covers the case where the tools are missing.

Usage: claude-opus-5-5 (served, read from the transcript), 160,458 tokens, 70 tool uses, 9.9 min.

## Closed

Each finding closed by a change to `agents/briefs/U2.md`:

- 1.1 (`changes` partly X3d's): "What is on the tree" names the change groups and the commit box as X3d's; the `changes` section lists them as X3d's under no U2 group; What to build 2 and Decision 2 say so.
- 2.1 (the eleven views outside the table): the ruling says every view, so the step line is corrected in `plan.md` line 174 to every registered view (the 47 and the 11) and the brief audits 56 views, `project` noted for Q91; the correction is recorded under "The plan line, whole".
- 2.2 (indents): "indents" added to the headings and to the fixed set.
- 3.1 (the ruling's line): cited by its text and as line 555.
- 3.2 (modernUI experiment): the premise states `experiment:{mode:"auto"}` and Decision 5 takes the declared default.
- 3.3 (js constants): What to build 1 adds the js-constant comment group; Case 3 accepts its lines; the premise names row height, pane header and indent.
- 3.4 (X3d.md section): the Read list cites X3d.md lines 33-56 and line 81.
- 3.5 (DESIGN.md sections, icon set): the Read list adds "Layer 3, view" and "Theming"; Decision 6 treats the Lucide set as decided, raised at most once under Common differences.
- 4.1 (shots): What to build 4 takes each shot with `zoom` on one pane with `save_to_disk`; a copy that fails is a stop.
- 4.2 (Verify 1): the closing headings are fixed as `## Common differences` and `## Proposed grouping`, `settings` as `## settings`; Verify 1 expects 58 and diffs the 56 ids.
- 4.3 (terminals): Case 7 and Verify 5 compare `tmux list-sessions` at the start and the end.
- 4.4 (two tabs): Decision 4: the builder uses the one tab showing TEST, the orchestrator takes no look while the builder runs, and the builder goes to TEST through the Pages view; U2's builder launches once no landing look is due (X3d and Q108 landed).
- 4.5 (blank screenshot): added to the stop condition.
- 4.6 (writes to the hub): "How the looks are taken" bars every writing control, Appearance changes and `fetch`; Case 10 and Verify 6 read History at the end.
- 4.7 (secret file gaps): Case 6 checks every pane before any screenshot or whole-page read, and stops on a `local.yml` pane; shots are of one pane.
- 4.8 (personal data in git): Decision 7 and What to build 4: no shot of config, inbox, calendar, memories, transcript, terminal, session-detail, linkedin, person, gallery; Verify 4 checks it.
- 4.9 (spec.md lines 33 and 63): Decision 3 cites line 33 as the exception every report takes; Decision 8 gives the reason the minimum list is not run by the builder.
- 4.10 (New page): Decision 4 makes creating TEST the only change allowed to the Pages list.
- 5 (the question): Case 1 requires the fixed set; Case 2 and Case 8 require the attempt named; What to build 2 requires a narrow and a wide pane.
- 6 (implied inputs): pane widths, theme and text size named and not changed, hover and focus in the fixed set, unreachable states with attempts (Cases 2 and 8), a `local.yml` tab already open (Case 6).
- 7 (ADRs): none.
