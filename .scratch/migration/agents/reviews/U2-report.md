# U2 report

NOT done: (1) Check 7 of the brief fails as measured: `tmux list-sessions` run at 2026-10-01 10:23:21 prints only `oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)`; `oculus-d0935c-shell` (created 2026-10-01 00:04) is not listed. It was listed at the first delivery's writing and was gone by 09:40:54 (the reviewer's read). The cause is not known, and this report does not say whether the audit ended it. (2) Brief item 8 names a rule that is not in VS Code's `workbench.desktop.main.css`: the generic row hover `.monaco-list .monaco-list-row:hover{background-color:var(--vscode-list-hoverBackground)!important}` appears there only after parent selectors (`grep -o` with 60 characters of context shows `.chat-artifacts-widget .chat-artifacts-list ...` and `.interactive-session .chat-summary-list ...`). The generic hover is generated in `workbench.desktop.main.js` by the list widget's style sheet, so `css:1106` is a js-constant comment line quoting that source, and the audit cites it for the focus and timeline row hovers. (3) Three states were not reached: the error state of `findings`, the empty states of `hpc` (they exist in the code and are unreachable here) and the error state of `deposit`. (4) The `local.yml` check for the first pass's shots cannot be re-proved now; for the shots taken in rounds 1 and 2 it was done before each. (5) The Files tab of pane 0 was absent from the DOM at the last read of this round; it was reopened from the Views catalogue and now stands last in pane 0, where it stood second before. The cause is not established. (6) The History entry count (27, newest `09-30 18:28`) was read earlier in the audit and was not re-read this turn.

## Open items

None (the round brief states main's state file has none).

## A question for Axel raised by the audit

The icon set, once, under Common differences item 19: oculus draws Lucide icons at 1em of the text around them (the live rule is `.glyph svg { width: 1em; height: 1em }`), measured as 11.5 x 11.5 px in 11.5px text (the commonest), 12.5 px beside 12.5px text and in empty states, 13.5 px in the pane chrome, and 10.5, 9.5 and 15 px in places; VS Code's codicons are 16 x 16 px (`U2-vscode.css:241`, `U2-vscode.css:252`). Option 1: keep Lucide (the `DESIGN.md` "Theming" decision) and draw every icon at a fixed 16 px. Option 2: replace the set with codicons through `icons.yml`, which matches VS Code glyph for glyph, re-maps every id and has no codicon for several domain icons. Recommendation: option 1. The lazy option is leaving the icons at the size of their text.

## The cases' first read

Read against the unchanged tree before the first look.

1. HELP.md's table: `grep '^| `' HELP.md | cut -d'|' -f2 | tr -d ' `' | awk 'NR<=47' | wc -l` printed 47; minus `files` and `repositories` gives the 45 of the brief, in HELP.md's order.
2. TEST reachable: one tab on `http://localhost:8790/`, id 812136282.
3. Case 7, the tmux sessions: `tmux list-sessions` before the first look recorded `oculus-a5f844-shell` and `oculus-d0935c-shell`. `oculus-d0935c-shell` was listed at the first delivery's writing and was gone by 09:40:54, the reviewer's read; `tmux list-sessions` at 2026-10-01 10:23:21 prints `oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)` only. The cause is not known; whether the audit ended it is not claimed either way.
4. The first read found no case the brief's rules get wrong, so nothing was handed back.

## DONE / NOT DONE

Each row names the command run in this turn.

| Check | Result | Command and output |
| --- | --- | --- |
| 56 view sections plus 2 closing | DONE | `grep -c '^## ' U2-audit.md` prints `58` |
| Section ids and order | DONE | `grep '^## ' U2-audit.md \| head -56 \| cut -c4- \| diff - ids.txt` prints nothing (`ids.txt` has 56 lines); the last two headings are `## Common differences` and `## Proposed grouping` |
| Every VS Code value names a line | DONE | a script read all 539 `css:N` tokens (78 distinct lines) in the audit: 0 name a line past the end of `U2-vscode.css` (1106 lines) or, below line 1089, a blank line or a `/*` section-label line (lines from 1089 on are js-constant comment lines and are valid) |
| ASCII only | DONE | `LC_ALL=C grep -c '[^ -~]'` prints `0` for `U2-audit.md` and `0` for `U2-vscode.css`; for this file the same command is re-run after it is written (last line) |
| No shot of personal views | DONE | `ls U2-shots \| grep -cE '^(config\|inbox\|calendar\|memories\|transcript\|terminal\|session-detail\|linkedin\|person\|gallery)-'` prints `0` |
| Excluded shot removed | DONE | `ls U2-shots \| grep -ic search-results` prints `0` |
| No originals kept | DONE | `ls -d U2-shots/originals` prints `No such file or directory` |
| Shot count | DONE | `ls U2-shots \| grep -c '\.png$'` prints `88`; `ls U2-shots \| grep -vc '\.png$'` prints `0` |
| tmux unchanged (check 7) | NOT DONE | `tmux list-sessions` at 10:23:21 prints only `oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)` |
| Config: no Config shot (a) | DONE | `ls U2-shots \| grep -ic config` prints `0`; the `customization` shots are named `customization-*`, and none shows the Config view |
| Config: `local.yml` check (b) | PARTLY | `javascript_tool` at the end of this round: `localyml` is `false` (no tab labelled `local.yml`) and the selected tabs are Repositories, Staged Changes and Settings; the check before each shot of the first pass cannot be re-proved |
| Theme switch made, measured and undone | DONE | Common differences item 2: `visibilityState` `visible`, 121 frames per second; Monaco repainted 183, 168 and 394 ms after the click; set back to light and read: Settings row `Theme light`, body `rgb(241, 245, 249)` |
| Header wrap measured per view | DONE | table in Common differences item 1, 27 views. The other 29 views: nine do not wrap (pillars, domains, data, audit, history, inbox, memories, slides, document); of the remaining 20, these have no header tools (30.3 px): focus, map, search, status, hpc, usage, help, config, calendar, account-setup, catalogue, settings, pages, customization, deposit, doc, project; session-list has one row of tools in 35 px; `findings` has no header; `note` has a title and a status text only |
| `doc`, `customization`, `agents` populated states | DONE | see Repair round 1, 1 to 3 |
| `search` error state | DONE | see Repair round 2, 3 |
| `findings` error state | NOT DONE | it needs a broken hub file, which is a write |
| `hpc` empty states | NOT DONE | they exist and are unreachable here (see Repair round 1, 4) |
| `deposit` error state | NOT DONE | commit and push write |
| Archive tab in pane 2 | DONE | `javascript_tool` this turn: pane 2 lists `Archive` last of 31 tabs; see Tabs of TEST |

## Repair round 1

1. B1, `doc`. The HELP buttons of the Views catalogue open hub documents. "HPC how-to" and "Research approach" were opened; the section holds the populated view at narrow (`doc-narrow.png`, the HPC how-to) and wide (`doc-wide.png`) and the empty state (`doc-empty-narrow.png`, `doc-empty-wide.png`). Measured: body `div.doc` 1398 x 5816 px at wide, `h1` 24px weight 700, links 12.5px, Markdown blocks of 18.8 to 75 px at narrow, no svg, no Monaco.
2. B2, `customization`. Codex was picked in the Customizations agent menu (instance state only, no file written) and its Instructions row opened the view. Measured: `pre` 285 x 641 px at narrow and 1430 x 635 px at wide, 11.5px monospace, line-height 17.25 px; no Monaco. The Customizations chip is back on Claude.
3. B3, `agents` narrow. The populated list at 309 px is measured: 100 `.agent` rows of 284.7 x 17.3 px, the task text collapsed to 9.7 px behind an ellipsis, the header 40.3 px on two tool rows with the session opener 83 px wide. The audit's Fixed set, Headers line and the item 1 table row give both readings (71.5 px with the opener 137 px wide, 40.3 px with the opener 83 px wide).
4. B4, `hpc`. The section says the empty states exist (`Hpc.svelte:68-69`, `Jobs.svelte:46`, `Head.svelte:58`) and are not reachable here: the cluster is unreachable, and the starting state needs a fresh server, which the rules forbid.
5. B5, History. With the filter cleared: 27 rows of 104 to 146 px at narrow, hover changes no row background, the Undo button and the pills are drawn at rest, focus ring 2px offset -2px on the filter and on Undo. The empty-state line records that "No writes are recorded yet." is also shown while a filter hides all rows. The filter text `transcript` is back in the field.
6. B6, `source`. The error state is a source tab refused because its symlink resolves outside every root (`Cannot open: HTTP 404`). The booking is the orchestrator's.
7. P1, icon sizes. The svg sizes were re-measured as computed over about 30 views; the figures read 11.5, 12.5 and 13.5 (and 10.5 and 9.5; 15 stays 15) in the sections, Common differences item 19 and the question above.
8. P2, `file`. `eq_btfno.png` has a natural size of 1628 x 235 px and is drawn at 284.6 x 41.1 px at 309 px, 455.3 x 65.7 px in a 490 px pane and 1430.0 x 206.4 px at wide (`max-width: 100%`, `object-fit: contain`). The `file` shots are removed in round 2.
9. P3, `usage`. Common differences item 14 records that the table is 609 px wide in a 285 px container at narrow and scrolls horizontally.
10. S1, citations. `css:1091` is labelled by the component its grep matched (the chat list tree, `chatListTreeTemplate`); the cites of `css:946`, `css:1006` and `css:1054`, which were comment lines, are replaced by value lines.
11. S4, the report's rows. The Config row is split into (a) and (b), and the header-wrap row names the views without header tools.

## Repair round 2

1. Spec 1, `customization-narrow.png`. Cropped to the tab strip and the header (494x100); `customization-wide.png` is cropped to the header (928x16). The customization section's State line says so and gives the reason (the body is a rule file and its path under the home folder); the body measures are by computed styles only.
2. Spec 2, `code-wide.png`. Cropped to the header, intro, status chips, coverage chips and the software line (931x146); `code-narrow.png` is cropped to the header, intro and status chips (618x650). The code section's State line says so.
3. Spec 3, the search error state. In a 479 px pane the regex toggle was set on, the focus was confirmed on the `What to find` input, `(` was typed and Return pressed. The view showed `error: unclosed group` in the `.empty` row (455 x 39 px, flex, gap 6px, padding 10px 0, no background, no border) with a 12.5 x 12.5 px glyph and the message 127 x 19 px (12.5px, `rgb(95, 111, 133)`); there is no retry control. The earlier results were replaced by this row. The toggle was set back off and the field cleared. Shot `search-error.png` (864x470, header, form, hint and message). The search section holds the attempt, the result, the Fixed set entry and the Error state line; Common differences items 12 and 13 name search.
4. Spec 4, `doc-wide.png` is cropped to the pane alone (892x318). `file-wide.png` is removed (see item 10 below).
5. Proof 1, the theme switch. The theme in force before was light. Through the Settings Theme list, the theme was switched to dark and back to light twice, with `visibilityState` `visible` and 121 frames per second. Page body `rgb(241, 245, 249)` and `rgb(11, 17, 32)`, changed 119, 100 and 150 ms after the click. Monaco on the `build.py` source tab: class `vs` and `vs-dark`, background `rgb(255, 255, 255)` and `rgb(18, 26, 43)`, first token `rgb(102, 109, 122)` and `rgb(138, 144, 157)`, changed 183, 168 and 394 ms after the click. The populated `doc` view text read `rgb(15, 23, 42)` and `rgb(231, 236, 243)`; the populated `customization` `pre` the same two colours. The switch back to light was confirmed by a read (body `rgb(241, 245, 249)`, Monaco class `vs`, Settings row `Theme light`). Round 1 ruling 10, first branch: Common differences item 2 states no difference, and Group 8 is removed from Proposed grouping (7 groups remain). Shots `source-theme-dark.png` and `doc-theme-dark.png`.
6. Proof 2, the tmux sessions. See Case 7 above and the first line.
7. Standards 1. Audit lines 424 and 462 cite `css:1067` (the `.agent-sessions-viewer` rule, which holds `.agent-session-item{display:flex;padding:8px 6px}`) in place of `css:1055`; the range at line 462 is `css:1067` to `css:1074`.
8. Standards 2. `css:1106` is appended at the end of `U2-vscode.css` (no earlier line moved: `wc -l` 1106, the 539 cites pass). It quotes the list widget's generated style sheet from `workbench.desktop.main.js`, since the unscoped rule the brief names is not in the css file (first line, point 2). Audit lines 22 and 530 cite it.
9. Standards 3. The History empty-state line keeps only what `css:14` holds (centring, 40px top padding, 70% opacity) and states that oculus's message does not name the filter that hides the rows; there is no claim about VS Code beyond `css:14`.
10. Standards 4, ruling Z144. Fifteen shots are removed: agents-wide, usage-wide, project-wide, project-narrow, editor-wide, editor-narrow, map-wide, slides-wide, slides-narrow, leads-wide, leads-narrow, file-wide, file-narrow, file-theme-switch, deposit-populated. 32 further shots are cropped to the regions listed under Shot fates. Each affected section says its measure is by computed styles only and gives the reason. Every one of the 88 remaining shots was looked at with the Read tool against the whole list (session or agent titles, agent task names, account labels, unpublished research, lead counts); no original is kept.
11. Standards 5. The old report line on the first pass's reasons is removed; Repair round 1 item 1 states only what was done.
12. The Archive tab. Pane 2 of TEST held no Archive tab (30 tabs). Archive was opened in pane 2 from the Views catalogue (31 tabs, Archive last), and Settings was selected again as pane 2's current tab; Config was not selected.

## Tabs of TEST before and after

Read from the DOM (`[role=tablist]` then `.tab .label`), selected tab marked `*`.

Before (the read before the Archive step): pane 0, 9 tabs: Status, Files, *Repositories, Map, Help, Present, Memories, Transcript, Live HPC. Pane 1, 2 tabs: tools/oculus/src/lib/server/core/git-parse.ts, *Staged Changes. Pane 2, 30 tabs: Deposit, History, Hub document, Focus, Projects, Pillars, Domains, Coauthor, Venues, Data, Code, Statements, Funding, Talks & Events, Education & Service, Applications, Joint work, Tasks & Service, Search, Lit Watch, Position Leads, Inbox, Sessions, Findings, Gallery, Usage, Audit, Calendar, *Settings, Config.

After (read in this turn, after 10:23): pane 0, 9 tabs: Status, *Repositories, Map, Help, Present, Memories, Transcript, Live HPC, Files. Pane 1, 2 tabs, the same. Pane 2, 31 tabs: the 30 above, Settings selected, and Archive last.

Differences: Archive added to pane 2 (asked for); Files in pane 0 moved from second to last (it was absent at an intermediate read and was reopened from the Views catalogue; the cause of its absence is not established). The tabs this round opened (build.py, HPC how-to and AGENTS.md in pane 1) are closed. Config was never selected.

## Shot fates

88 PNG files in `U2-shots/` (`ls U2-shots | grep -c '\.png$'`); the folder holds no other file and no originals.

- Removed this round (15): agents-wide, usage-wide, project-wide, project-narrow, editor-wide, editor-narrow, map-wide, slides-wide, slides-narrow, leads-wide, leads-narrow, file-wide, file-narrow, file-theme-switch, deposit-populated. Removed in round 1: search-results.
- Cropped or new this round, with final size (35, three new): agents-narrow 496x92, audit-narrow 618x150, audit-wide 931x48, catalogue-narrow 618x850, catalogue-wide 931x118, changes-narrow 496x662, changes-wide 740x70, code-narrow 618x650, code-wide 931x146, customization-narrow 494x100, customization-wide 928x16, data-narrow 618x130, data-wide 931x20, doc-theme-dark 533x823 (new), doc-wide 892x318, document-narrow 499x118, document-wide 931x22, domains-narrow 618x450, domains-wide 931x58, education-narrow 618x690, events-narrow 618x625, findings-wide 931x38, joint-work-wide 1098x93, map-narrow 618x515, pillars-narrow 618x865, search-error 864x470 (new), session-list-narrow 618x205, session-list-wide 931x48, settings-wide 931x448, source-theme-dark 710x1098 (new), status-wide 931x448, tasks-wide 931x48, timeline-wide 800x446, venues-narrow 618x870, venues-wide 931x93.
- Unchanged this round, each looked at with the Read tool (53): account-setup-narrow, account-setup-wide, applications-narrow, applications-wide, archive-narrow, archive-wide, coauthor-narrow, coauthor-wide, customization-empty-narrow, customization-empty-wide, deposit-narrow, deposit-wide, doc-empty-narrow, doc-empty-wide, doc-narrow, education-wide, events-wide, findings-narrow, focus-narrow, focus-wide, funding-narrow, funding-wide, help-narrow, help-wide, history-narrow, history-wide, hpc-narrow, hpc-wide, joint-work-narrow, note-narrow, note-wide, pages-narrow, pages-wide, pillars-wide, present-narrow, present-wide, projects-narrow, projects-wide, radar-narrow, radar-wide, search-narrow, search-wide, settings-narrow, source-error, source-narrow, source-wide, statements-narrow, statements-wide, status-narrow, tasks-narrow, timeline-narrow-empty, timeline-narrow, usage-narrow.

## Files written

- `agents/reviews/U2-vscode.css`: 1106 lines (`wc -l`).
- `agents/reviews/U2-audit.md`: 1138 lines.
- `agents/reviews/U2-report.md`: this file.
- `agents/reviews/U2-shots/`: 88 PNG files named `<view-id>-<state>.png`.

## Things to know about the page

- A Customizations instruction row was expanded in Sessions during the looks (view state only).
- The History filter was cleared for the populated measure and `transcript` typed back.
- The theme was switched through Settings and is light again; the pick is stored in `oculus.ui.v1` in the browser's storage for the 8790 origin.
- The Search view shows the `error: unclosed group` row in place of its earlier results.
- The TEST window was raised with `osascript` (window index 1, application activated) for the looks, since it read `hidden` while another application was frontmost.
- The last page switch went through the rail's Views and Settings button and back to TEST.
- Nothing was written to a hub file.
- Two bookmarks existed before the audit; whether the audit created either is not verified.

## Anything in the brief that was wrong

- The generic row hover rule of round 2 item 8 is not in the css file as an unscoped rule (first line, point 2).
- `merge` (registered) and `diff` are outside the brief's 56 views; `diff` is X3d's.

Last check, run after writing this file: `LC_ALL=C grep -c '[^ -~]' U2-report.md` prints `0`.
