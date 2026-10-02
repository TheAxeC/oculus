# Owed looks

Every look a landing report records as not taken, and every view a landed step changed that its landing note does not name. Each is taken on TEST at localhost:8790; what is seen is written under it, and each defect is booked to the step that fixes it.

Found with `grep -n -i "not looked\|no look\|not seen at the look\|owed" agents/reviews/*-landing.md`.

## To take

- M3: the resource tags on cards (This Mac and the others), the Compute facet, the manifest editor's chips field, the Live HPC view with `slurm.resource`.
- Q66: look items 16, 17, 19 and the Changes and Graph resets on a session switch.
- Q67: whether the console links of `account-setup.yml` open the pages they name.
- Q78: a project document's fenced block over a wallpaper; the doc view and the manual.
- Q79c: the Memories add press, the stop control's focus, the grid's selection colour, the Live HPC jobs table and log.
- Q88: the terminal's grid and row menus and Kill arming, the graph's bare name, rendered Markdown and the Document frame's menus.
- Q99: a Claude session's click, scroll and paste.
- R18: a standalone `.svg` under a dark colour scheme.
- U3: text scale 1.5 and the rice palettes.
- U4: text scale 1.5, the 140 px narrow pane, the ticker buttons by keyboard.
- S2: a session started from the composer.
- D35: a real port move.

## Taken

- M3, 2026-10-02, TEST, dark theme. Seen:
  - The Compute filter lists This Mac 8, UTwente HPC 8, unset 37.
  - The Live HPC view polls the cluster `slurm.resource` names and says it is unreachable off the UT network.
  - The manifest editor's Compute field shows the chosen chip, a filter box and the other resources as choices; a typed Repo Topics word is offered as a new choice.
  - Defect 1: the This Mac tag on a card draws no glyph, and neither does any machine or storage resource: `ProjectCard.svelte:334` passes a glyph only when the resource is a cluster. The editor's Compute chips draw none either.
  - Defect 2: the editor's chips field draws its keyboard-active choice (Local data) in the full accent while the field has no focus, so an unchosen resource reads as chosen.
  - Defect 3: the card's More menu mixes casing: "Show in Files" beside "expand / collapse", "+ subtask", "edit manifest".
  - Seen beside it, defect 4: the source tab's Markdown preview squeezes a table's first column until "Folder / file" breaks one or two letters per line (README.md, "Where things live").

- D31, 2026-10-02, TEST, dark theme. Seen: a search for "autofetch" in the Settings view finds one setting, "Git: Autofetch minutes" under behavior.yml, Git, with its description, the number field at 0 and "Default: 0 behavior.yml:146". No defect.
- Q88c, 2026-10-02, TEST, dark theme, on a throwaway repository `~/workspace/zz-look-tmp` added to `sources.yml` roots for the look and removed after (`git diff --exit-code -- tools/oculus/config` clean, the folder deleted). Seen working: Add to .gitignore, Discard on an untracked file (asks, moves to Trash), Create Branch and Create Tag from a commit, Delete Branch (asks), Cherry Pick (stops on a conflict, Abort asks and restores), Checkout (Detached) on a clean tree, Compare with... (a picker of refs, then a two-column diff), Open File (HEAD) on a staged file, Close Repository, Close Other Repositories, Reopen Closed Repositories (one or All), Open Worktree (adds the worktree as a root), the strip's Lock Group (a lock button appears; pressing it unlocks), Tab Bar, Editor Actions Position Hidden and back, New Text File. Defects:
  - Q88c-1: Open File (HEAD) on an unstaged changed file opens the index copy, in a tab named "a.txt (Index)".
  - Q88c-2: an open "(Index)" tab is not read again when the index changes; it kept the old text after `git add`.
  - Q88c-3: after Add to .gitignore, the view says "No served folder holds .gitignore, so it cannot open in a tab" although the repository is a served root.
  - Q88c-4: Checkout (Detached) is refused with "the working tree is dirty" when the only change is an untracked file; git itself checks out in that case, as VS Code does.
  - Q88c-5: the commit message box keeps the cherry-picked message ("First") after Abort.
  - Q88c-6: refusal and status sentences start in lower case ("the working tree is dirty...", "the cherry-pick stopped on conflicts..."), and the conflict line says "1 files are in conflict".
  - Q88c-7: the Changes section draws empty groups with the word "nothing" ("Changed 0 nothing", "Untracked 0 nothing"); VS Code draws no empty group.
  - Q88c-8: in the Graph, the branch and tag chips take the whole row and cut the commit subject to one letter ("S", "Seco...").
  - Q88c-9: the Graph header count reads 0 before the section is opened, for a repository with commits.
  - Q88c-10: a detached HEAD shows only as "detached" on the repository row; no branch row and no graph row marks where HEAD is.
  - Q88c-11: Cherry Pick and Checkout (Detached) are offered on a commit HEAD already contains or already is.
  - Q88c-12: a worktree row shows the absolute path cut at the pane edge ("/Users/axelfaes/workspace/..."), so its name is not visible.
  - Q88c-13: Enter in the New worktree field does nothing; only the check button submits.
  - Q88c-14: the Repositories list keeps rows for deleted scratch folders of an old Claude session (judge-a to judge-e, judge-2, probe, a, _cited-urls, .claude) marked "no repository".
  - Q88c-15: Editor Actions Position offers "Title Bar" for the actions in the pane strip; oculus has no title bar, and VS Code calls that place "Tab Bar". The chosen item in it and in Tab Bar is marked by blue text only, with no check mark. With Hidden, a float's More button stays.
  - Q88c-16: New Text File opens a note form (Title, Note) in a tab named "Note", not an untitled text file.
  - Q88c-17: closing the newest tab activates its left neighbour, not the tab active before it.
  - Q88c-18: the manifest editor's status line showed "saving" while the Repositories view ran a git write; nothing was written to the manifest.
  - Q88c-19: Add Folder to Workspace and `:folder` open a native macOS folder panel with no sign in oculus that one is open; a second press opens a second panel. An earlier panel (osascript pid 42763, child of the 8790 server) has been open for six hours. When a panel is cancelled the Files view says "The folder panel could not be opened."
  - Q88c-20: after the worktree root went away, the Files view said "hub/Users/axelfaes/workspace/zz-look-tmp-wt is not there", gluing an absolute path onto the root name.
  - Q88c-21: the palette row for `:folder` shows ": folder" with no hint and no description.
  - Q88c-22: the hub root holds three empty folders named `config/behavior.yml`, `config/layout.yml` and `config/sources.yml` (made 2026-10-01 01:23), which the Files view draws as folders.
  - Not taken: Lock Group on an empty pane (TEST has no empty pane; the lock was seen on a float pane).
- X3a, 2026-10-02, TEST, dark theme, on a throwaway folder `zz-look-files` in the hub root, deleted after. Seen working: multi-select with Cmd+click and its menu (Compare Selected, Cut, Copy, Copy Path, Copy Relative Path, Delete), the Delete question naming both files with "Move to Trash", Cmd+Z asking "Would you like to undo 'Delete'?" and restoring both files, a drag onto a folder asking "move 'one.txt' into 'inner'?" and moving it, the Files breadcrumb showing the selected path ("hub > zz-look-files"). Defects:
  - X3a-1: the tree does not follow the disk. A folder made outside oculus appeared only after Refresh; after undo the restored files were missing from the tree; after the move the file still showed at its old place. Delete took about five seconds and the deleted rows stayed meanwhile.
  - X3a-2: when the breadcrumb row appears under Open Editors it pushes the tree down by one row, so a click aimed at a row lands on the row above (seen twice: a collapse instead of a select, and a drag that picked up the neighbouring file).
  - X3a-3: a file deleted from disk stays open in its tab with no mark that it is gone.
  - X3a-4: the line "The folder panel could not be opened." stays in the Files view after the panel is gone, through every later action.
  - X3a-5: clicking an untracked folder's row in the Changes section showed it in Files with "hub/zz-look-files is not there; hub, the nearest folder on its way, is selected." although the folder existed (the tree had not read it).
  - X3a-7: a long path in the Changes view's lists ("Touched by this session", Changed, Untracked) is cut at its end, so the file name is the part lost ("tools/oculus/.scratch/migration/agents/r..."); VS Code shows the name first and the folder after it, dimmed.
  - X3a-6: the Files view kept drawing the two roots the look removed from `sources.yml` (zz-look-tmp, zz-look-tmp-wt) after the file changed and the folders were deleted.
- A1, 2026-10-02, TEST, dark theme, the Changes view on the session "S2 status", the changed brief `X3c.md` opened with Open Changes, then Inline View from the diff's More menu. Seen working: right-click on a line in the inline diff offers Add Comment on Line; it opens "Comment to S2 status" under the line across the full width, the text area focused, with Send and Cancel; Cancel closes it. Send was not pressed. Defects:
  - A1-1: in the inline layout the comment `+` is drawn in the original side's number column, left of the line numbers, and shows only after a right-click; hovering the line's margin shows nothing.
  - A1-2: in a 340 px pane the diff stays side by side with two columns of about 125 px each; VS Code turns a diff inline below 900 px.
  - A1-3: in a narrow pane the hunk header's Stage Block and Revert Block buttons are cut to "+ Sta" and "Rev" over the header text.
  - A1-4: a click or double-click on a Changed row in the Changes view opens no diff; only the row's Open Changes button does. VS Code opens the diff on a click.
- D27, 2026-10-02, TEST, dark theme, on a throwaway folder `zz-look-d27` in the hub root (a copy of cathedra's `examples/transform2d.rite`, two Lua files, a text file), deleted after; no file was saved. Seen working: the rite file opens coloured with "Rite" in the status bar; Cmd+/ puts `; ` before the line and a second Cmd+/ takes it off, as cathedra's own VS Code extension sets `lineComment: ";"`; the bracket at the cursor is boxed and the pairs are coloured by depth; Cmd+/ in a Lua file toggles `-- `; the language picker (the status bar's language) lists Lua and Rite, and choosing Lua recolours notes.txt and the status bar says Lua; Compare Selected on a.lua and b.lua opens a side-by-side diff in Lua colours with the right three changed lines; a search for "languages" in the Settings view finds Files, Languages under sources.yml with its description, the entry shape and "Edit in sources.yml". Defects:
  - D27-1: the language picker opens with Plain Text highlighted and no mark on the file's current language (Lua); VS Code marks the current one "(current)" and offers Auto Detect and "Configure File Association for '.txt'..." at the top.
  - D27-2: the compare header of two chosen files reads "b.lua hub:zz-look-d27 R hub:zz-look-d27/a.lua", a git rename letter between two files that were never renamed, with b first while the tab says "a.lua vs b.lua".
  - D27-3: two single clicks on notes.txt in the Files tree selected the row and opened nothing; a double-click opened it. One click opened t.rite and a.lua.
  - D27-4: the Settings view's Languages setting shows only "Edit in sources.yml"; VS Code's Files: Associations is edited in place as a list of item and value rows with Add Item.
  - D27-5: the Settings search box draws two clear buttons, one inside the field and one after "1 Setting Found".
- D13a, 2026-10-02, TEST, dark theme, on a throwaway `zz-look-d13a/i.md` (deleted after) and on the changed brief `agents/briefs/X3c.md` opened with Open File from its diff and moved through by keys only (`git diff --numstat` gives 123 4 before and after). Seen working: `*one italic run*` and `_another italic run_` draw in italic, `**bold**` in bold; the brief's four changes carry marks on lines 1, 3, 5 and 7 to 126; from the last line Shift+Alt+F5 puts the caret on lines 7, 5, 3, 1 and then wraps to 7. Defects:
  - D13a-1: `***bold italic***` draws italic at weight 400, not bold; VS Code draws it bold and italic.
  - D13a-2: a modified line's gutter mark is drawn in `--c-scm-modified` (#e2c08d, the colour of a changed file's name), `Editor.svelte:474`; VS Code's gutter mark for a modified line is `editorGutter.modifiedBackground` (#1B81A8 in the dark themes), so the mark reads as a different thing from VS Code's.
  - D13a-3: a 130-byte Markdown file showed "Waiting for the first snapshot" for 4 to 6 seconds before the editor drew.
  - D13a-4: a Markdown file opens with the preview on beside the source; in a 340 px pane the preview takes over half the width and draws the brief's heading one or two words per line at heading size, leaving the source about 70 px wide.
  - D13a-5: a changed row in the Changes view offers Open Changes, Stage and Discard, with no Open File; VS Code's row offers Open File, Discard and Stage, and a click on the row opens the changes (A1-4).
- L4, 2026-10-02, TEST, dark theme, a Terminal tab opened from the palette with a shell started by the header's new-terminal control, `seq -f 'line %g' 1 300` run in it, and the shell ended with `exit` after (its tab closed with it). Seen working: the scrollback reaches line 1 by the scrollbar in the page pane, after Float, after Dock Left, after Float again from the dock, and after Return to Page; the lines rewrap to each width; Dock Left keeps the view where it was. Defects:
  - L4-1: the first Float of the page pane drew an empty grid for 2 to 3 seconds, then drew the end of the output, so the view the reader had scrolled to (line 1 at the top) was lost; Return to Page also drew the end of the output instead of the view the float showed.
  - L4-2: the Terminal tab is titled "45a932-shell", an internal id, while the bar inside says "zsh research-hub"; VS Code titles a terminal tab by its process ("zsh").
  - Not settled: a 30-step wheel gesture from the look's tool moved the grid three lines; a real trackpad or mouse scroll would settle whether the wheel is slow.
- M4, 2026-10-02, TEST, dark theme, the cockpit deck opened as a document tab from the Files view (Show Ignored Files on for the look and off after, since the deck is gitignored). The deck on disk was built on 2026-09-09, before M4, and drew its equations as PNG images; for the look it was rebuilt with `python3 tools/present/build.py` (13 LaTeX equation cards, 0 image cards) and the 09-09 file was put back after (`shasum` 630fa54d before and after). Seen working: all 13 formulas typeset with no MathJax error, and none wider than its card in a maximised pane. Defects:
  - M4-1: every typeset formula is unreadable: the card's background is #f7f8fa and the formula takes the deck's text colour #e7ecf3 (`.eqcard` in `tools/present/assets/css/deck.css` sets a background and no colour), so the formula is near-white on near-white. Seen on the HCCNet slide's positional-encoding formula.
  - M4-2: in a 230 px pane the equation card grows to its formula's width (605 px for the HCCNet formula) and is cut at the frame's edge with no scroll, so `.eqcard mjx-container{max-width:100%;overflow-x:auto}` never acts; the PNG it replaced shrank to the card.
  - M4-3: Restore panes after Maximise pane reloaded the document frame, so the deck went back from slide 3 to slide 1.

## Blocked, for Axel

- Every look under a light or other theme (L3, L5, U1, M3, Q88c, A1, X3a's Seti icons): the standing rule says the browser theme on TEST is not changed. A light-theme look needs Axel's word that the theme may be switched on TEST and switched back.
