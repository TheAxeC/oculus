# O37 look defects, one row per defect

Status: fixed (at landing in the gate, with the check named) | open.

## Fixed in the gate

1. e/i43-14: a code theme whose chunk failed to load never repainted. load.ts URL glob and retry, the failure count held by the loader the editor's load makes (`themeLoader`). Checked on 8796 on the landing build: two picks of Andromeeda with its file failing kept the colours in force and each asked again (`?retry=1`); the third, loadable, fetched `?retry=2` and repainted.
2. a/i43-3: merge choice hover drew no underline. MergeSide.svelte. Checked on 8796.
3. a/i43-11: a tree row's name cut while its detail kept a remnant. TreeItem .detail flex 1 1 0. Checked on 8796.
4. c/L2: lead delete confirm heading was the chip tooltip. leads.action.delete_lead_ask.
5. a/i43-11 shot: unsaved-tabs wording. statusbar.yml.
6. a/i43-13: schedule sheet Save stretched, Cancel cut. ScheduleDialog .confirm. Checked on 8796.
7. a/app-died: the server ended on a missing build file. serve.ts withMissingFiles, tests 4 of 4.
8. b/app-died: the Map ran out of memory in a small pane. forces.ts MAX_PULL in pull() and every fit; map-forces.test.ts. Checked on 8796.
9. b/i43-5: a resize laid the Map out anew. Graph.svelte `sized`; recentre() scale kept in follow.svelte.ts. Checked on 8796 (affine residual 0).
10. a/L32: the Repositories failure line's button spilled out in a narrow pane. Repo.svelte .act. Checked on 8796.
11. c/L21: a selected row lost its tint under the pointer. TreeItem hover rule. Checked on 8796.
12. a/L103, c/L66, c/L67, f/L78: language servers never started in the desktop app. servers.ts ELECTRON_RUN_AS_NODE; lsp tests 192 of 192. Checked on 8796 (typescript-language-server ready).
13. a/L103: the diff of a working-tree file registered nothing with the language server (its root was the repository folder). repositories placeOf; DiffSection serverFile. Checked on agent a's app: hover on greetLook lines 1 and 4 of the diff.
16. a/i43-1: two repository rows read as cut absolute paths "/private/tmp/claude-5..." in place of a name. Checked on 8796.
17. c/i43-9: the References overflow popover starts left of its pane, over the activity bar. Checked on 8796.
18. d/i43-10: at a 100 px pane the terminal bar's title draws one letter ("z", "h"). Checked on 8796.
19. d/i43-10: the bar's terminal menu lists two items both "zsh" with nothing telling them apart. Checked on 8796.
20. a/i43-2: the staged diff's hunk header says "Stage or revert this file from Changes". Checked on 8796.
22. a/i43-3, a/line707: at 110 px the merge lens's choices leave a bar alone on a line. MergeSide.svelte .lens. Checked on 8796: sides of 109, 144, 169, 244 and 319 px, no bar alone and no line starting with a bar (/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o37/shots/d22-560c.png).
23. a/i43-11: the "-1" drawn under "M" in a row. ChangeRow.svelte .fit. Checked on 8796: widths 123 to 240 px, every row's counts whole or hidden.
25. a/i43-13: the Run unattended checkbox is not aligned with the fields. ScheduleDialog.svelte .preview, .inset, .days. Checked on 8796: fields, first weekday square, Run unattended square and preview all at x 234.
28. a/L32: a 14 px overview ruler drawn in a 112 px diff, where the report says it is off at 400 px or less. Checked on 8796: no ruler at 286 px, 14 px rulers at 626 px.
29. c/L33: the Quick Open root hint cut to "l..." at 480 px. Checked on 8796.
31. b/line702: in a narrow pane the Map's 420 px box runs 163 px below the pane's body. Checked on 8796.
32. c/L44: a selected file row in a narrow pane draws no name and its star over the icon. TreeItem.svelte --row-least on .item and .main. Checked on 8796: the row drawn, the tint covering it, the pane scrolling sideways.
37. e/L87: the range words say "a number", the look says "a whole number". Config range words. Checked on 8796: "It must be a whole number from 0 to 3650."
47. b/i43-39: hovering a card grows its line from 19 to 20 px and moves the text 1 px. margin-block on the card controls (CardActions, RadarCard, LeadCard, InboxCard, Usage). Checked on 8796: the Pillars line stays 18.5 px; Usage unchanged.
48. d/i43-20: at a 98 px list the hovered row's Kill is clipped past the list edge. TerminalList.svelte .actions. Checked on 8796 with hover forced: at 166, 137 and 117 px every drawn control whole (Split dropped first), at 98, 92 and 84 px none drawn; row 22 px.
52. d/L60: History reads "After 1 values" (plural after one). History.svelte items_one. Checked on 8796: a language server choice row reads "After 1 value".
54. d/owed-D52: an undone "entry field set back" row keeps an empty line where its Undo button was (owed-D52-7.png). History.svelte .head grid, whole-line words, one-line Undo column. Checked on 8796 at 423, 323 and 223 px: no head taller than its words, every Undo centred on the first line.
56. e/L36: at a 660 px window the rail's System button sits under the Update button until the rail list is scrolled; pressing it opens Update tasks. No change needed: checked on 8796, the fade element 514 to 542 at a 660 px window.
57. d/owed-D72-11: after the undo of an add the status line says "<key> / entries is back." though the entry was removed. undo-said.ts undone_removed. Checked on 8796: "look-undo-add / entries is taken out again."
60. e/L96: Toggle Left Dock on a page with an empty left dock does nothing and says nothing. Checked on 8796.
63. b/L46: in a 470 px pane the Focus band's hub chip is cut to "look-...". Checked on 8796: 7 band hub chips in a 447 px pane, none cut.
64. b/L47: a board filter showing 48 cards leaves the summary line at "106 projects". Checked on 8796.
65. b/L53: a finding's message with long unbroken paths runs 52 px past a narrow pane and is cut mid-word. Findings message wrap. Checked on 8796: 472 messages in a 249 px pane, none past the edge.
67. o/L31: after Cmd+= the shown last tab is pushed past the tab strip's right edge; the strip's scroll is not kept on the shown tab when the zoom narrows it. tab-scroll.svelte.ts. Checked on 8796: narrowing, a wheel with the tab whole, zoom 1.1, 1.25 and 1.5.
77. b/L47: the Projects strip and the Focus command centre count one journal twice when two hubs hold it (BSPC as two chips). stats.ts and ticker.ts count venues by registry name. Checked on 8796: BSPC x6, J-BHI x6, JMLR x4, MedIA x4.
78. d/L60: a History side that holds an empty list or map reads "{}" or "[]" ("Before {}" on a language server choice row). rows.ts shown(): an empty list or map reads "nothing". Checked on 8796: the language server choice row reads "Before nothing, After 1 value".
79. every catalog: reader text counts with "(s)" (History's partly undone sentence, four Audit messages, ChkTeX fix 5's label). history.yml undone_partly_one; audit.yml msg_markers_one, msg_provisional_one, msg_terminal_live_one, msg_site_untracked_one; source.yml chktex_fix_5. keys.test, audit and history route tests pass.

## Open, for O40

14. a/i43-1: an open merge tab keeps "1 conflict left" after a second conflict is written behind it.
15. a/i43-1: the commit box keeps "Merge branch 'side'" while .git/MERGE_MSG names side2.
21. f/i43-12: while the settings are held, Cmd+S in the editor sends no save.
24. c/i43-34: a folder whose listing is not held sends its listing read at the right-press.
26. a/i43-23: the merge Result editor draws no tint on an open conflict.
27. e/L22: Cmd+A then typing does not replace the Settings search text.
30. b/line702: a new project with links is placed on the rim, 142 to 188 units from its links.
33. c/L81: New File opens the file but the editor does not take the keyboard.
34. c/L82: Paste into a closed folder opens it but the pasted item is not selected.
35. d/i43-37: a session card's pick brings the Transcript tab forward when the session tab was used last.
36. d/L27: a reloaded terminal shows the end of its output, not the lines it was scrolled to; a redraw comes back five lines off.
38. e/R10: the clone question's first and leave steps dim the page.
39. f/L8: a refused Save to Literature is said in the view's notice line and a toast, not in the card.
40. f/L38: a PDF at Page Width loses its place when the view is part way into a page.
41. f/L57: the picture preview's img is laid out at 0x0.
42. f/L58: F8 puts the problem's line under the sticky line.
43. f/L71: tabs of a root that left keep requesting its files (163 failed requests in 8 s).
44. f/L80: Save to Literature is refused on a hub whose list names no Literature file though the engine's path holds it.
45. c/L20: the Search view keeps the last search's hits under a new scope until the query runs.
46. a/L56: the saved index tab "a.txt (Index)" goes back to "a.txt (HEAD)" by itself.
49. d/i43-28: Lit Watch reads "Last run: none yet" though the feed holds last_run 2026-10-11 (payload radar null).
50. d/L55: at 180 px rows an armed Kill moves out from under the pointer, so the second press disarms; the armed words are cut at 180 and 203 px.
51. d/owed-D52: after an undo from History the open entry page still reads "saved status", the words of the write that was undone.
53. d/owed-D52: a History row's value pill is drawn only while the row is hovered, so at rest a row reads "Before" or "After" with a gap where its count is (language server choice, schedule, entry and workspace folder rows; owed-D52-7.png, /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o37/shots/d54-beforec.png).
55. e/L24: after Cmd+S in Settings the tab keeps its unsaved dot and dimmed Save for over 2 s after the write returned.
58. d/owed-D72-11: the undo of a delete appends the entry at the file's end, drops its quotes and loses its empty `funding: ""` field.
59. d/owed-D72-11: the undo of an add leaves the file one empty line shorter than before the add.
61. e/L109: every workspace switch requests a repository's missing .oculus/settings.yml and gets 404.
62. f/L62: opening a plain file sends /api/git?blame (400) and /api/latex deps (404) requests that fail.
66. o/L112: in a popped-out window, the palette's `:tab help` and Quick Open open the view or file in the main window, not in that window.
68. o/line720: two browser tabs that each split a view into a new pane within a second end, both, with only one of the two new panes; the other split is lost (two runs).
69. o/L95, o/L68: in the desktop app one press of Add Folder to Workspace, from the palette or from a folder row's menu, shows "The folder panel is already open." 172 ms later, and the palette stays open behind the panel.
70. c/L76: in the palette's file mode the first key of a run takes 53 to 100 ms, over the 50 ms bound.
71. c/L76: ArrowDown past the drawn page of the palette's list puts the selection on row 1 instead of row 27.
72. c/L76: a new answer while the palette's list is scrolled leaves the selected row out of view.
73. c/L69: after a drag moves a file, the Refactor Preview takes 4.6 s for a file the page has not moved before, and 8 to 13 s in the first run.
74. d/L91: with a tmux folder on a too-long path, the Schedules section's first read quotes Node's "Command failed: tmux -u list-sessions -F ..." (tabs and a newline included) instead of tmux's "File name too long" sentence, which comes only on a later read.
75. d/L84: before a reload the terminal page shows one prompt where tmux's pane holds two; the reload then draws both.
76. f/L17: the first Enter on a freshly opened script tab's Submit Job puts the focus in the editor before the plan opens, so refusing the plan leaves the keyboard in the editor, not on Submit Job (three runs of three).
80. d/owed-D72-11: the delete's own History row and the add's undo row carry the same words, "entry removed".
81. o/O30 case 41 and the O30 looks: the close question over unsaved text puts the keyboard on Confirm (`Confirm.svelte:60`), so Enter loses the text, and it offers no Save; VS Code's question focuses Save and offers Save, Don't Save and Cancel.
82. the O30 looks: the editor's status items (language, linter, caret) go when a view tab of another group (Files, Repositories) becomes active, since the status bar follows `activeInstance()`; VS Code keeps them while the side bar has the focus.
83. the O30 looks: two Accessibility presses on a popped-out window's close button closed the Live HPC window, not the one pressed, while File > Close Window closed the right one; whether the app or the Accessibility press is at fault is not known, and a pointer press on the close button settles it.
84. the O30 looks: the app requests `/node_modules/monaco-editor/esm/vs/editor/editor.worker.js` three times (404) while the real worker loads from `/_app/immutable/workers/`; what requests the first path is not known.

## Count

84 defects: 40 done in the gate (39 fixed, row 56 needing no change), 44 open for O40.
