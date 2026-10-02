# Owed looks

Every look a landing report records as not taken, and every view a landed step changed that its landing note does not name. Each is taken on TEST at localhost:8790; what is seen is written under it, and each defect is booked to the step that fixes it.

Found with `grep -n -i "not looked\|no look\|not seen at the look\|owed" agents/reviews/*-landing.md`.

## To take

- M3: the resource tags on cards (This Mac and the others), the Compute facet, the manifest editor's chips field, the Live HPC view with `slurm.resource`.
- D27: a rite file's Cmd+/ and bracket matching, the language picker set to Lua, a diff of two Lua files, the Settings Files section.
- D13a: an italic run in Markdown; Shift+Alt+F5 over a file with several marks.
- L4: a Terminal tab's scrollback across Dock and Float.
- M4: the cockpit deck `tools/present/present.html` with a wide formula.
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

## Blocked, for Axel

- Every look under a light or other theme (L3, L5, U1, M3, Q88c, A1, X3a's Seti icons): the standing rule says the browser theme on TEST is not changed. A light-theme look needs Axel's word that the theme may be switched on TEST and switched back.
