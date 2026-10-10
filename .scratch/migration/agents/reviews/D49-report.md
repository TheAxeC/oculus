Done after this round: all eight items of the round brief, each checked by a command run after the last change (sections 1 to 10). Not verified by me: how the Help page tabs, the Views catalogue, the Apps guide tab and the Data map tab draw on screen, because this step may not start an app, a browser or a dev server (section 14 says what should differ). One ruling is asked of the coordinator: the reason codes `R`, `OBS` and `HIST` of the dropped-sentence ledger are mine and not the brief's (section 13, item 1).

## Open items

Copied from `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` lines 167-173 (`awk` from the heading `## Open items` to the next `## ` heading, read when this report was written):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

One ruling is asked from this report and not from that list: the reason codes `R`, `OBS` and `HIST` of section 2.3 are mine. The recommended ruling is to accept them; the other option is to send the listed `OBS` rows back to be kept, which costs HELP.md lines it does not have. The lazy option would be to accept without reading the `OBS` rows, so section 13 lists them one by one.

## Scope in one table

| Item | State | Proof (command, in section) |
|---|---|---|
| 1 Every key the guides name, plain keys included | done | `c03_keys.py` (78 chords and function keys, 0 missing), `c03b_plain.py`, `c03c_match.py` and `c03d_list.py`, sections 1 and 9.2, 9.3 |
| 2 The facts no view shows, and the full read | done | greps of the seven named facts (2.1), the ledger of dropped sentences (2.3), the guide-by-guide account (2.4) |
| 3 `present.yml` field table on DATA-MAP | done | `c08_deck.py`, sections 3 and 9.7 |
| 4 The Help page sentence states what the code does | done | HELP.md:25 against `config/layout.yml`, `.oculus/config/layout.yml` and `catalogue.ts:36-48`, section 4 |
| 5 DESIGN.md and README.md pointers | done | `c05b_pointers.py` and `c05_anchors.py`, sections 5 and 9.5 |
| 6 Comments rewrapped at 100 columns | done | diff of the six files and the history-word grep, section 6 |
| 7 No "not X" construction; the prose pass | done | scans and the read, section 7 |
| 8 This report, whole | done | this file; the brief errors are in section 11, the visible changes in section 14 |


## 1. Every key the guides name

The seven base guides name 78 chords and function keys (`c03_keys.py`: modifier chords and F1 to F12) and 122 guide-line and plain-key pairs (`c03b_plain.py`: Enter, Escape, Esc, Tab, Delete, Backspace, Space, Home, End, PageUp, PageDown, Return, the arrow keys, Up, Down, Left, Right). HELP.md states every one of them; the check commands and their output are in section 9 (cases 3, 3b, 3c, 3d).

### 1.1 Chords and function keys: guide line and HELP.md lines

| Key (normalised: modifiers sorted, lower case) | First guide line naming it | HELP.md lines naming it |
|---|---|---|
| `alt+cmd+[` | `views:285` | 123 |
| `alt+cmd+b` | `views:277` | 119 |
| `alt+cmd+c` | `files-and-search:31` | 119,282 |
| `alt+cmd+enter` | `files-and-search:150` | 152,331 |
| `alt+cmd+m` | `views:81` | 122,258 |
| `alt+cmd+shift+c` | `files-and-search:31` | 282 |
| `alt+cmd+t` | `terminals:69` | 118,359 |
| `alt+cmd+x` | `views:77` | 122 |
| `alt+ctrl+t` | `terminals:69` | 118,359 |
| `alt+down` | `configuration:27` | 112,245,280 |
| `alt+enter` | `views:285` | 124 |
| `alt+f5` | `source-control:19` | 143,401,412 |
| `alt+o` | `files-and-search:87` | 140 |
| `alt+shift+f` | `views:285` | 140 |
| `alt+shift+f12` | `files-and-search:87` | 138,259,317 |
| `alt+shift+f5` | `source-control:19` | 143,401,412 |
| `alt+shift+h` | `files-and-search:87` | 139,259 |
| `alt+shift+o` | `files-and-search:87` | 140 |
| `alt+up` | `configuration:27` | 112,245,280 |
| `alt+z` | `files-and-search:81` | 116,301,302 |
| `cmd+,` | `window:7` | 97 |
| `cmd+.` | `files-and-search:115` | 140,324 |
| `cmd+a` | `files-and-search:31` | 100,151,396 |
| `cmd+backspace` | `files-and-search:31` | 152,282,331 |
| `cmd+c` | `files-and-search:31` | 282 |
| `cmd+down` | `files-and-search:31` | 282 |
| `cmd+enter` | `files-and-search:31` | 126,136,150,151,282,396 (+1) |
| `cmd+f` | `terminals:37` | 148,149,346 |
| `cmd+k` | `window:68` | 42,64,65,131 |
| `cmd+l` | `configuration:17` | 125,126 |
| `cmd+n` | `window:7` | 97 |
| `cmd+p` | `files-and-search:146` | 66,133 |
| `cmd+r` | `window:7` | 97 |
| `cmd+s` | `debugging:11` | 115,296,298 |
| `cmd+shift+1` | `files-and-search:150` | 152,331 |
| `cmd+shift+b` | `terminals:69` | 118,359 |
| `cmd+shift+f` | `files-and-search:150` | 107,328 |
| `cmd+shift+f5` | `debugging:55` | 145,363,383 |
| `cmd+shift+h` | `files-and-search:150` | 107,331 |
| `cmd+shift+m` | `views:85` | 117 |
| `cmd+shift+n` | `window:7` | 97 |
| `cmd+shift+p` | `window:90` | 68,134 |
| `cmd+shift+w` | `window:7` | 97 |
| `cmd+shift+z` | `files-and-search:31` | 292 |
| `cmd+t` | `files-and-search:87` | 68,135 |
| `cmd+v` | `files-and-search:31` | 282 |
| `cmd+w` | `window:7` | 96,126 |
| `cmd+x` | `files-and-search:31` | 282 |
| `cmd+z` | `files-and-search:31` | 292,300 |
| `ctrl+enter` | `source-control:15` | 150,399 |
| `ctrl+f` | `terminals:37` | 148,346 |
| `ctrl+k` | `window:88` | 64,131 |
| `ctrl+p` | `window:90` | 133,134 |
| `ctrl+s` | `files-and-search:65` | 115 |
| `ctrl+shift+b` | `terminals:69` | 118,359 |
| `ctrl+shift+f5` | `debugging:55` | 145 |
| `ctrl+shift+m` | `configuration:17` | 117,127 |
| `ctrl+shift+p` | `window:90` | 134 |
| `ctrl+shift+tab` | `window:7` | 95 |
| `ctrl+tab` | `window:7` | 95 |
| `f1` | `window:90` | 68,134 |
| `f10` | `debugging:47` | 147,363 |
| `f11` | `debugging:47` | 147,363 |
| `f12` | `files-and-search:87` | 137,317 |
| `f2` | `files-and-search:31` | 136,282,315,317 |
| `f4` | `views:69` | 139 |
| `f5` | `debugging:7` | 144,363,364,383 |
| `f8` | `files-and-search:87` | 117,257 |
| `f9` | `debugging:41` | 146,363 |
| `shift+enter` | `terminals:25` | 42,148,149,155,344 |
| `shift+f10` | `terminals:33` | 22,24,35,128,346 |
| `shift+f11` | `debugging:47` | 147,363 |
| `shift+f12` | `files-and-search:87` | 138 |
| `shift+f4` | `views:69` | 139 |
| `shift+f5` | `debugging:55` | 145,363 |
| `shift+f8` | `files-and-search:87` | 117,257 |
| `shift+space` | `views:123` | 157,237 |
| `shift+tab` | `window:80` | 50,98 |

Rows where the key is written without a modifier chord form and `c03_keys.py` cannot see it (mouse chords): `Cmd+click` (`files-and-search.md:87,93`, `terminals.md:37`) is at HELP.md:121, 137, 315, 317, 346; `Ctrl+click` (`terminals.md:37`) at HELP.md:121; `Shift+press` and `Cmd+press` (`views.md:61`, `source-control.md:7`) at HELP.md:396; `shift-click` (`window.md:21`) at HELP.md:24; `shift-press` (`views.md:237`, the Views view, the same behaviour as the catalogue) at HELP.md:24. Command: `grep -n -o -i -E "(Cmd|Ctrl|Shift|Alt|Option)[+-]?(click|press|drag|double)[a-z-]*"` over the guides and over HELP.md.

### 1.2 Plain keys: guide sentence and HELP.md line

Each row is `guide:line.sentence`, the keys that sentence names, the HELP.md line sharing the key and the most words of the sentence (`c03c_match.py`), and the start of the sentence. The matching line is a locator; I read each pair against HELP.md. The words that are a menu or control name and not a key press are listed after the table.

```
configuration:27.t	Down,Up	HELP 245 (shared 7)	| `sources.yml` | What the portfolio reads: the scan paths, the registry and collection files, the feeds, and the hub folder of the portfolio deck (`portfolio_deck:`) and
debugging:59.5	Enter	HELP 399 (shared 2)	Enter sends what is typed.
debugging:59.6	Down,Tab,Up	HELP 154 (shared 8)	The earlier inputs that start with the typed text are listed under the box, Tab or a press takes one into it without sending it, and Up and Down step through what was sen
debugging:86.t	Enter	HELP 382 (shared 4)	| `debug.console.acceptSuggestionOnEnter` | Off: Enter sends the text typed. |
files-and-search:11.5	Down,Up	HELP 280 (shared 12)	Under the header every root is a top-level folder row, a root other than the hub and the engine's `config/` folder is dragged above or below another root (a line on the r
files-and-search:11.11	Escape	HELP 282 (shared 2)	Escape in the view closes it.
files-and-search:21.5	Enter	HELP 288 (shared 7)	The commits are read fifty at a time, in git's order from HEAD, so a commit that reached the file through a merge is listed once and in place; a Load more row after the l
files-and-search:25.2	Down,Up	HELP 280 (shared 8)	Every section head of the view, and every row of the Bookmarks and Notes lists, is dragged over another of its own list (a line on the upper or lower edge shows where it 
files-and-search:31.1	Left,Right,Tab,arrow keys	HELP 282 (shared 7)	The tree is one Tab stop: the arrow keys move the selection, Right and Left open and close a folder, and Tab from a row reaches its controls.
files-and-search:31.3	Backspace,Down,Enter,Escape,Space	HELP 282 (shared 23)	On a focused row Enter and F2 rename it, Cmd+Down opens a file as the pane's preview tab and opens or closes a folder, Cmd+Enter opens a file in a tab beside the pane, Cm
files-and-search:31.4	Enter	HELP 283 (shared 5)	Enter on a root, on the workspace header or with two rows selected does nothing;
files-and-search:31.5	Enter	HELP 283 (shared 7)	Enter on a row of Open Editors, Outline, Timeline, Bookmarks or Notes opens it.
files-and-search:43.1	Delete,Tab	HELP NONE (shared 0)	A right-click on a file offers Open to the Side, Open in New Tab and Open in New Window on a PDF (the PDF in oculus's own viewer, in a tab or in a window of its own), Ope
files-and-search:43.3	Delete	HELP 238 (shared 5)	(the writing rules' fixes for the files under it, listed to tick; see Linters), Cut, Copy, Paste (greyed until something is cut or copied), Upload..., the two copies, Ren
files-and-search:47.2	Enter,Escape	HELP 282 (shared 8)	Enter or leaving the box accepts a valid name, Escape cancels, and an empty or unchanged name cancels; a name with several segments makes the folders between.
files-and-search:47.3	Delete	HELP 290 (shared 10)	Delete asks first, naming the rows when several are selected, and moves them to the macOS Trash, where they can be restored from, and offers to delete for good only when 
files-and-search:51.2	Delete	HELP 408 (shared 5)	An undo of a delete asks first ("Would you like to undo 'Delete'?") and writes back each file whose content was kept, a folder coming back empty; the content of a file up
files-and-search:61.6	Enter	HELP 153 (shared 7)	A press on a row of the Problems view opens its file the same way, in the preview tab with the range selected and the keyboard kept in the view; a second press on the row
files-and-search:81.15	Enter	HELP 306 (shared 6)	Every other editor setting stays at Monaco's default, except that a file a language server serves draws semantic colours, and a C or C++ file clangd serves formats its li
files-and-search:87.10	Enter	HELP 136 (shared 10)	Rename Symbol (F2 or the editor menu) renames through the server, and Cmd+Enter in the rename box, in place of Enter, shows the edit as a Refactor Preview first (see "Hub
files-and-search:87.15	Enter	HELP 399 (shared 4)	An edit that is the rename of a hub key, or a rename accepted with Cmd+Enter, is shown as a Refactor Preview first and writes nothing until Apply.
files-and-search:95.2	Enter	HELP 136 (shared 5)	Enter in the box shows the edit as a Refactor Preview, since the rename of a hub key asks to be confirmed;
files-and-search:95.3	Enter	HELP 136 (shared 3)	Cmd+Enter does the same for the rename of any symbol.
files-and-search:97.6	Enter	HELP 282 (shared 4)	The rename makes every check again, since a file can change between the box opening and Enter.
files-and-search:142.2	Enter	HELP 328 (shared 6)	Enter in the box and the Search control are the two ways a run starts, and `/` puts the cursor back in the box from anywhere in the results.
files-and-search:150.3	Down,Up	HELP 331 (shared 8)	Whether the row is shown, the replace text and Preserve Case are kept with the tab, and so are the last twenty texts each box ran, which Up and Down in the box walk, newe
files-and-search:150.4	Enter	HELP 331 (shared 5)	Enter in the replace box runs the search as Enter in the query box does, and Cmd+Alt+Enter in either box is Replace All.
files-and-search:150.9	Backspace,Delete	HELP 331 (shared 11)	Every hit and every file offers Dismiss, with Delete (Cmd+Backspace on macOS) on the focused row, which takes it out of the results without writing, and Replace All then 
source-control:7.5	Enter	HELP 396 (shared 10)	The rows of a repository are selected by press, Cmd+press, Shift+press, Shift with an arrow and Cmd+A, Stage, Unstage and Discard on one of the selected rows act on all o
source-control:7.12	Delete	HELP 408 (shared 16)	Open File (HEAD) opens the version HEAD holds, for a Staged row and a Changes row alike, read-only in a source tab named `<file> (HEAD)`, which reads again when HEAD's co
source-control:7.15	Tab,arrow keys	HELP 396 (shared 4)	The list and the sections are one Tab stop each, moved along with the arrow keys.
source-control:15.8	Enter	HELP 399 (shared 4)	Ctrl+Enter or Cmd+Enter in the field commits as the button does.
source-control:35.5	Delete	HELP 406 (shared 9)	The Tags section lists the tags, an annotated one with its message; pressing one opens its commit in the Graph, Delete Tag asks first, and Push Tags in the menu pushes ev
source-control:39.5	Delete	HELP 408 (shared 6)	The checked-out branch's pill has a right-click menu of its own, with Checkout and Delete Branch both unavailable and their hover words saying why:
source-control:39.10	Delete	HELP 408 (shared 11)	Open Changes, Copy Commit ID, Copy Commit Message, Checkout and Delete Tag lists, Checkout (Detached), Create Branch..., Create Tag..., Cherry Pick and the three compares
source-control:43.10	Delete	HELP 408 (shared 5)	Delete Branch, on a local branch name that is not checked out and on each branch row of the Branches section, asks first and runs `git branch -d`; when git keeps the bran
source-control:43.11	Delete	HELP 408 (shared 2)	Delete anyway?", follows, and its yes runs `git branch -D`.
source-control:43.13	Delete	HELP 408 (shared 6)	The commit's Checkout list leaves out the checked-out branch, whose pill has a menu of its own with Checkout and Delete Branch unavailable.
source-control:65.1	Enter	HELP 414 (shared 3)	Each worktree row is named by the last name of its folder, with the whole path as its tooltip, and the field that names a new worktree submits on Enter.
terminals:25.1	Enter,arrow keys	HELP 344 (shared 12)	From two terminals on, a list on the right names each terminal of this tab by the title you gave it, else after what runs in it (Claude, Codex, the project command's name
terminals:25.2	Enter	HELP 344 (shared 5)	Shift+Enter on the row, or the header's Split) and Kill (press twice;
terminals:25.3	Backspace,Delete	HELP 344 (shared 5)	Delete or Backspace on the row, twice), and double-click a row's name to rename it.
terminals:37.1	Escape	HELP 148 (shared 6)	Cmd+F (Ctrl+F off macOS) in the grid opens the find bar over its top right, as VS Code's terminal find: the text, Match Case, Match Whole Word and Use Regular Expression,
terminals:37.5	Escape	HELP 282 (shared 4)	What you type, click, scroll or paste reaches the program as the bytes the grid sends, so a click, a scroll or a focus change arrives in one write and never as a lone Esc
terminals:41.1	arrow keys	HELP 346 (shared 23)	A terminal opened again, or shown again after the server restarted, shows its screen with the cursor where the program left it, so a new shell's prompt is at the top, and
terminals:53.4	Delete	HELP 354 (shared 9)	A right-click on a button opens Edit, Schedule... and Delete for a saved command (Schedule... opens the update tray's schedule dialog with that command filled in), and Op
views:57.1	Down,Up	HELP 280 (shared 8)	The Files view is the file browser over the hub, the engine config folder and the configured roots, with Open Editors, Outline, Timeline, Bookmarks and Notes under its tr
views:61.1	Enter	HELP 396 (shared 8)	The Repositories view is VS Code's Source Control over every repository oculus knows, with the commit box, the changes, the graph, stashes, tags, branches and worktrees, 
views:73.2	Enter	HELP 414 (shared 4)	It opens when a rename of a hub key is made in a YAML file (Enter in the rename box) or any rename is accepted with Cmd+Enter, and when a move or rename in the Files view
views:77.6	Tab	HELP 269 (shared 3)	View LaTeX PDF with Open in New Tab, Open in New Window, Open in Browser, Open in Program and Refresh Viewers;
views:85.8	Enter	HELP 153 (shared 6)	Enter, a second press or a double press keeps the tab and moves the caret to the range.
views:93.5	Down,Enter,Tab,Up	HELP 154 (shared 8)	Enter sends the text, the earlier inputs that start with the typed text are listed under the box, Tab or a press takes one into it, and Up and Down step through what was 
views:123.1	Esc,Space	HELP 237 (shared 13)	The Present control in the toolbar and `F` put the slide on the whole monitor, in a browser tab and in the desktop app, with no rail, tabs or toolbar, and Esc leaves; the
views:125.2	End	HELP 237 (shared 3)	The pane then shows the current slide large, the next slide smaller beside it (or "End of the deck." after the last), the current slide's `notes:` as plain text under it 
views:125.5	End,Home,PageDown,PageUp,Space	HELP 157 (shared 11)	The two windows keep one slide: the arrows, Space (Shift+Space goes back), PageUp, PageDown, Home and End move both whichever has the focus, and so do Previous and Next, 
views:125.9	End,Esc	HELP 237 (shared 8)	The End control, Esc (after the grid and, in full screen, after leaving it), closing the audience window, switching the deck in the toolbar and closing the pane's tab end
views:129.1	Delete	HELP 238 (shared 8)	A right-click on the slide, or on its tile in the overview, offers Edit Slide, New Slide, Duplicate Slide and Delete Slide, and the command palette lists the same four fo
views:129.5	Delete	HELP 238 (shared 3)	Delete Slide asks first.
views:129.8	Delete	HELP 238 (shared 4)	A slide of a member deck belongs to that deck, so it offers Edit Slide and New Slide, and no Duplicate or Delete.
views:161.6	Down,Up	HELP 382 (shared 5)	The heads are dragged among each other and moved with Alt+Up and Alt+Down, as the sections under the Files tree are; the tab keeps which sections are closed and their ord
views:211.3	Enter	HELP 250 (shared 5)	A finding that is about a file names it as a place that opens the file (a finding about a folder or a missing file has no such place), and the keyboard's card cursor can 
views:241.1	Escape	HELP 251 (shared 14)	The Settings editor over the options catalog: a search box with a count (`@modified` keeps the options that differ from their default, `@id:` looks in the key path), a ta
views:259.3	Enter	HELP 136 (shared 9)	`project` (one project as its own tab, with a LaTeX panel over its manuscript, whose card leaves out the document row, the tab listing the project's present Markdown docu
views:281.3	Return	HELP 38 (shared 2)	A PDF opens where it was last read: a tab keeps its own place across a reload, a window and Return to Page, and a tab opened for a file starts at the file's last place, k
views:281.7	Tab	HELP 269 (shared 4)	Open in New Tab, Open in New Window (a window of the app, or in a browser a browser tab at `/?float=<id>` that draws the PDF alone), Open in Browser (the browser's own vi
views:285.5	Enter	HELP 272 (shared 7)	Enter in an `itemize`, `enumerate` or `description` starts a new `\item `, Alt+Enter a plain line, and the Cmd+L and Ctrl+Shift+M chords of the keys table wrap the select
window:7.3	Tab	HELP 50 (shared 5)	It adds what a browser tab cannot give the page: windows that remember where they were, a floating pane that becomes a window of its own (Move into New Window in the pane
window:9.1	Down	HELP 382 (shared 0)	Down the left is the rail, and along the bottom is the status bar.
window:29.14	Delete	HELP 344 (shared 5)	Pause and Resume, Run now and Delete act on the entry, and a Run now that starts a terminal shows it as a task press does.
window:29.21	Delete	HELP 78 (shared 8)	A save, Delete, Pause or Resume the tray cannot make is refused with its sentence, and nothing is written:
window:55.10	Down,Left,Return,Right,Up	HELP NONE (shared 0)	A pane split off while the page is used closes with its last tab: one made by opening a view with no pane to land in, by Open to the Side, by Split Right, Down, Up or Lef
window:64.5	arrow keys	HELP 38 (shared 6)	A docked float is a strip along that edge with a handle on its inner edge that sets its size, by drag or by the arrow keys.
window:64.6	Left,Return,Right	HELP 38 (shared 10)	Its menus offer Dock Left, Dock Right and Dock Bottom (not for the edge it is on), Float on a docked float, which floats it again, Return to Page, which puts its tabs bac
window:67.2	Enter,Escape	HELP 46 (shared 6)	ArrowRight or Enter on one of them opens its list, and ArrowLeft or Escape in that list goes back to the choice;
window:67.3	Escape	HELP 282 (shared 2)	Escape in the menu closes it.
window:67.4	End,Home,arrow keys	HELP 46 (shared 6)	In any menu the arrow keys, Home and End move through the choices, and typing the start of a choice's name goes to it.
window:68.1	Right	HELP 44 (shared 6)	- **Right-click menus.** A right-click on the empty part of a pane's tab strip, or anywhere in an empty pane, offers Open File...
window:68.2	Down,Left,Right,Tab,Up	HELP NONE (shared 0)	(the palette, as Cmd-K opens it), New Text File (an untitled text opened in a source tab of that pane; its first Save asks for a folder, chosen among the workspace's serv
window:68.4	Right	HELP 44 (shared 10)	Close, Close Others, Close to the Right, Close Saved and Close All (each asks first when a tab it closes holds unsaved text or a running program, after saving the tabs `e
window:68.6	Right	HELP 44 (shared 3)	Split Right with a Split & Move submenu, and, in the app, Move into New Window and Copy into New Window (a Terminal tab and the tab of a unique view offer no copy).
window:71.1	Enter	HELP 42 (shared 16)	- **Pinned tabs.** Pin in a tab's right-click menu, Pin Editor in the palette (listed with Cmd-K Shift+Enter, for the active tab of the pane that last held the focus), or
window:71.3	Right	HELP 42 (shared 12)	A pinned tab keeps its pin when its pane floats, when it moves to another page and when its pane splits, and stays open through Close Others, Close to the Right, Close Sa
window:71.4	Delete	HELP 42 (shared 5)	Delete on a focused pinned tab closes nothing and shows the first tab that is not pinned.
window:73.4	Tab	HELP 269 (shared 15)	A picture, a PDF, a download, an HTML document and a Doc carry the star and Open in Program where they apply; a PDF's bar carries the viewer's own controls (zoom, fit, fi
window:73.6	Right	HELP 44 (shared 2)	The tab row's right end carries only Split Right and the `...` opener.
window:73.17	Tab	HELP 269 (shared 4)	The tab's right-click menu offers Add Bookmark or Remove Bookmark for a served file that is not read at a commit, Open in New Tab and Open in New Window for a PDF, Open i
window:80.1	Escape,Tab	HELP 50 (shared 12)	Tab and Shift-Tab are the browser's: they move the focus between the controls on the page and reach no binding of this table, except in the source tab's editor, where Tab
window:80.2	Delete,Tab,arrow keys	HELP NONE (shared 0)	The rail is one stop of that order, and each strip of tabs is one stop with its pane menu the stop after it, so Tab steps past a whole strip in one press and the arrow ke
window:80.3	Delete	HELP 48 (shared 9)	A tab holding text no save has taken is closed only after a confirmation, whether the close came from Delete or from the tab's own control.
window:82.3	Tab	HELP 396 (shared 1)	The brackets cycle a pane's tabs; in the app Ctrl+Tab and Ctrl+Shift+Tab do too.
window:88.4	End,Enter,Home,arrow keys	HELP 64 (shared 7)	The arrow keys, Home and End move through the results and Enter opens the one selected; the keyboard goes to the tab it opens, which becomes the page's active tab.
window:88.7	Enter	HELP 42 (shared 4)	Pin Editor and Unpin Editor are among them, with Cmd-K Shift+Enter beside them, and act on the active tab of the pane that last held the focus.
window:88.8	Delete	HELP 65 (shared 11)	While a Present tab is on screen the palette also lists its commands, Edit Slide, New Slide, Duplicate Slide and Delete Slide for the slide shown, and Export to PDF, each
window:88.14	Enter	HELP 396 (shared 3)	Enter opens the file with the symbol's name selected, and a tab no server serves, or a server that is not running, says so in the list.
window:90.5	Enter,arrow keys	HELP 64 (shared 6)	Cmd+P (Ctrl+P off macOS) opens the palette in its file mode, which finds a file by name across the served roots: the input says so, the arrow keys and Enter work as in th
window:90.11	Enter	HELP 66 (shared 9)	Enter or a press opens the file in the view the Files view would choose for it, in the pane the palette was opened over, as a kept tab that takes the keyboard, and closes
window:94.1	Escape	HELP 89 (shared 4)	The sheet itself opens with `?` and closes with `?` or Escape.
```

Rows read by hand against HELP.md, with the HELP.md lines that hold the key (the locator picks one line; these are the lines I read):

- Debug Console input: Enter sends, Tab or a press takes an earlier input without sending, Up and Down step (`debugging.md:59`, `views.md:93`): HELP.md:154 and HELP.md:382.
- Files tree: arrow keys move the selection, Right and Left open and close a folder, Tab from a row reaches its controls, one Tab stop (`files-and-search.md:31`): HELP.md:282; Enter, Escape and Space on a row at the same line; name box Enter and Escape (`files-and-search.md:47`): HELP.md:110 and HELP.md:290; Escape closing the line of messages over the foot of the view (`files-and-search.md:11`): HELP.md:111.
- Source Control list and sections, one Tab stop each moved with the arrow keys (`source-control.md:7`): HELP.md:396.
- Search view: `/` back to the query box, Up and Down through the last twenty texts, Enter in either box, Delete or Cmd+Backspace on a row (`files-and-search.md:142,150`): HELP.md:106, HELP.md:328, HELP.md:331.
- Menus and Tab/arrow focus order (`window.md:67,80`): HELP.md:46, HELP.md:129, HELP.md:50, and the Delete row HELP.md:101; `window.md:71` Delete on a pinned tab at HELP.md:42.
- Palette (`window.md:88`): HELP.md:68, HELP.md:134.
- Presentation keys (`views.md:123,125`): `F`, `P`, `O`, arrows, Space, Shift+Space, PageUp, PageDown, Home, End and Esc at HELP.md:157, HELP.md:156 and HELP.md:237.
- Terminal list rows (`terminals.md:25`): HELP.md:155; terminal find bar Escape (`terminals.md:37`): HELP.md:148.
- Key sheet `?` and Escape (`window.md:94`): HELP.md:89; Settings table of contents Escape (`views.md:241`): HELP.md:251.
- Problems row Enter (`views.md:85`, `files-and-search.md:61`): HELP.md:153, HELP.md:295; Timeline Load more Enter (`files-and-search.md:21`): HELP.md:288; Findings card cursor Enter (`views.md:211`): HELP.md:250; LaTeX `\item` Enter (`views.md:285`): HELP.md:124; commit box (`source-control.md:15`): HELP.md:399; worktree name box Enter (`source-control.md:65`): HELP.md:414.

Words in the table that name a menu entry or a control and not a key press, so they have no HELP.md key line: `Split Up/Down/Left/Right` and `Dock Left/Right` and `Return to Page` (`window.md:55,64,68,281`), `Close to the Right` (`window.md:68,71`), `Open in New Tab` (`window.md:73`, `views.md:77,281`), `Delete Tag`, `Delete Branch`, `Delete Slide`, and the menu word `Delete` in `window.md:29,73`, `files-and-search.md:43`, `source-control.md:7,35,39,43`, `terminals.md:53`, `views.md:129`, "Tab Bar" (`window.md:68`), "Down the left" (`window.md:9`), "End of the deck." (`views.md:125`), "a lone Esc" in a description of the bytes written (`terminals.md:37`, dropped as `R`, section 2.3), "Tab" as the browser tab (`window.md:7`). The four rows the locator prints as `NONE` are `window.md:55.10`, `window.md:68.2`, `files-and-search.md:43.1` (menu words) and `window.md:80.2`, whose keys are all stated: Tab and the arrow keys at HELP.md:50 and Delete at HELP.md:101.

`debug.console.acceptSuggestionOnEnter` (`debugging.md:86`) is a VS Code setting of the comparison table; oculus has no such setting, so the row is dropped as `T` (section 2.3).


## 2. The facts no view shows

### 2.1 The seven facts the round brief names

| Fact | Where it is stated now | Command |
|---|---|---|
| A mail account is its own consent with the mail scopes alone | HELP.md:445 | `grep -n "mail scopes alone" HELP.md` |
| Mail and calendar are read every 2 minutes while a provider refuses | HELP.md:446 | `grep -n "every 2 minutes" HELP.md` |
| A `collections:` entry named as a built-in view id is not registered | HELP.md:429 | `grep -n "built-in view" HELP.md` |
| `rite_dap_bin` forms (absolute path, path under `~/`, name on PATH, `rite_dap` when absent) | HELP.md:378, HELP.md:436 | `grep -n rite_dap_bin HELP.md` |
| One HPC submit per `<host>:<folder>` | HELP.md:248 | `grep -n "<host>:<folder>" HELP.md` |
| GIT_SSH only: autofetch adds nothing for ssh | HELP.md:398 | `grep -n GIT_SSH HELP.md` |
| The `affiliation:` single-key reading | `docs/DATA-MAP.md:267` (the `affiliations` row of the links table) | `grep -n "affiliation:" docs/DATA-MAP.md` |

### 2.2 What else was added to HELP.md in this round (the sentence-by-sentence read)

Selection rule of the brief applied to every sentence of the seven guides: keep keys and chords, files a reader writes by hand with their keys, what is kept where, what asks, what is refused and why, limits and the settings that set them; do not keep what a control looks like or where it sits, lists of every menu item, VS Code settings comparison tables, repetition. Where a sentence states a state-loss surprise or a side effect outside the view (network, files written), I kept it under the same rule as "what asks, what is refused". HELP.md lines of the additions of this round:

- Reset all pages: a unique view held by a float or by a rail page being rebuilt is closed with it and opens anew without its state (HELP.md:32).
- New Text File: a name that leaves the folder is refused (HELP.md:44).
- Cmd+Shift+P off macOS and the keys that stay with the editor, the terminal and a field (HELP.md:134).
- The Files tree is one Tab stop with its arrow keys (HELP.md:282); Bookmarks and Notes order file that refuses a move when it does not read (HELP.md:286); a draft kept across a reload whose file changed is marked changed (HELP.md:298, HELP.md:303); `on_focus_change` (HELP.md:299, HELP.md:300); the diff editor takes the language's wrap, rulers, whitespace and sticky scroll with no minimap (HELP.md:302); the Svelte server uses its own Svelte 4 where there is no `svelte` package (HELP.md:313); a file under `secrets` or `~/.oculus` is never marked, completed or opened by the Markdown server (HELP.md:315).
- Hub-key rename keeps quotes and comment and double-quotes a key that would read as a number, `null` or text with a colon (HELP.md:318); the ESLint approval list takes the approval back and ends that folder's ESLint at once (HELP.md:321); Fix All Writing has a 256 KB rule (HELP.md:293, HELP.md:323).
- A latexmkrc file that cannot be read refuses the step with its path; Rerun and Restart are refused when the file is no longer a main file (HELP.md:265, HELP.md:266).
- Any other `${...}` in a command is left as written (HELP.md:356); closing a task terminal ends its session (HELP.md:347); a change made during a debug session is sent at once and the terminal gets none of the debug keys while a session runs (HELP.md:382).
- `findings.config.directory_missing` (HELP.md:426); the Account setup view never draws a saved id or secret (HELP.md:446); the triage notes read the mailbox through the runner's Gmail connector (HELP.md:449).
- Settings keeps and sends back a value its control cannot show (HELP.md:253); Live HPC warns when neither the script nor a file it sources names `/local/$SLURM_JOB_ID` (HELP.md:247); Copy BibTeX asks doi.org, Semantic Scholar or the arXiv DOI, else formats the entry itself (HELP.md:241).
- Present: the `present.yml` fields are in the Data map (HELP.md:236); Delete Slide on a summary or a grid leaves `order:` and keeps its group (HELP.md:238); New Presentation... and New Presentation from Outline (`<name>-slides`) and Export to PDF (HELP.md:240).
- A project card with no subtasks offers adding the first among its controls and draws no subtasks block until it has one (HELP.md:235).

HELP.md stands at 450 lines (limit 450) and 254 bullet and paragraph lines, none over 600 characters or 3 sentences (`c04_bullets.py`, section 9).


### 2.3 The dropped sentences, by guide line and reason

Every sentence of the seven base guides was read against HELP.md (`sentences.py` numbers them `line.k`, tables `line.t`). A sentence not listed here is stated in HELP.md or in DATA-MAP in its own words. The locator `local_all.py` lists the 477 sentences whose words are not mostly on one HELP.md or DATA-MAP line (window 81, views 128, configuration 46, debugging 31, terminals 30, source-control 49, files-and-search 112); I read each of those against HELP.md, and the rows below are the ones that are dropped, wholly or in the part the note names. The reason codes:

- `S`: the screen says it: a control, dialog, message or hover word on screen states it (the brief's reason).
- `L`: a list a view shows: a menu, a table or a settings list that the view itself draws (the brief's reason).
- `G`: a spelling of a command that git documents (the brief's reason).
- `A`: appearance: what a control looks like or where it sits (the selection rule's "do not keep").
- `T`: a VS Code settings or behaviour comparison table (the selection rule's "do not keep").
- `X`: repetition of a rule or an example of a rule already stated (the selection rule's "do not keep").
- `R`: an internal route, file path or code name of the engine; mine, not the brief's.
- `OBS`: navigation or placement behaviour that a reader sees on first use and that no setting, ask, refusal or loss depends on; mine, not the brief's.
- `HIST`: a sentence about how an earlier release behaved; mine, not the brief's.

Reasons `S`, `L` and `G` are the brief's three. `A`, `T` and `X` are the three "do not keep" classes of the selection rule in the brief's item 2. `R`, `OBS` and `HIST` are mine and are a departure from the brief; every row that carries them is listed below so each can be sent back. The `OBS` rows are the ones I recommend checking.

**window.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `window.md:11.2` | `A` | A click puts it away, and it comes back once the pointer has left the control and rested on it a | a tooltip that comes back after the pointer leaves its control |
| `window.md:84.2` | `A` | A press on a control puts its tooltip away, a focus shows one only when it is the keyboard's, an | a tooltip that comes back after the pointer leaves its control |
| `window.md:11.3` | `A` | Every scrolling box draws a thin scrollbar in the theme's colours, its thumb at 3:1 or more on i | scrollbar drawing |
| `window.md:17.1` | `A` | The rail is 48 px wide with 48 px square buttons and a 24 px icon at every text size, drawn in t | rail button sizes, muted icon, accent bar, tooltip arrow and badge pill |
| `window.md:17.2` | `A` | An icon is muted until it is hovered. | rail button sizes, muted icon, accent bar, tooltip arrow and badge pill |
| `window.md:17.3` | `A` | The page on screen draws in the text colour with a 2 px accent bar on its left edge. | rail button sizes, muted icon, accent bar, tooltip arrow and badge pill |
| `window.md:17.4` | `A` | The button's name and digit show as a tooltip centred beside it with an arrow pointing at it, an | rail button sizes, muted icon, accent bar, tooltip arrow and badge pill |
| `window.md:25.5` | `A` | The button of the page on screen draws its icon in the text colour with an accent bar on its lef | rail button sizes, muted icon, accent bar, tooltip arrow and badge pill |
| `window.md:69.1` | `A` | - **Tabs past the strip's width.** The strip scrolls rather than shrinking its tabs, and tab nam | the tab strip scroll controls (the strip scrolls and tab names are whole) |
| `window.md:69.2` | `A` | Its two controls move the left edge to the next tab's start, or to the strip's end past the last | the tab strip scroll controls (the strip scrolls and tab names are whole) |
| `window.md:69.3` | `A` | A wheel or trackpad scrolls the strip freely and leaves it where it stops, so a tab may show in  | the tab strip scroll controls (the strip scrolls and tab names are whole) |
| `window.md:72.5` | `A` | With `show_tabs: single` the breadcrumb sits in the strip's row beside the tab, and with `none`  | breadcrumb placement and cut, the file icon in a tab |
| `window.md:72.6` | `A` | When the bar is narrower than the path and the file's actions together, the path is cut from the | breadcrumb placement and cut, the file icon in a tab |
| `window.md:72.8` | `A` | A file tab draws its file's icon before its name, the one the Files tree draws for that file, in | breadcrumb placement and cut, the file icon in a tab |
| `window.md:73.6` | `A` | The tab row's right end carries only Split Right and the `...` opener. | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:74.1` | `A` | - **How a strip is drawn.** Tabs stand edge to edge at one height, the shown tab on the pane's s | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:74.4` | `A` | A tab's close control shows on the shown tab and under the pointer. | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:74.7` | `A` | The right end of a pane's strip holds, while the pane shows a tab, a split-right button, and the | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:74.8` | `A` | At a large text size or in a narrow pane the shown tab keeps its title and its close control: a  | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:74.9` | `A` | A handle between panes, and between the Source view's editor and preview, shows nothing until th | strip drawing: right-end icons, close control display, handle drawing; 74.5 loses only its pixel sizes (the dimmer strip is at HELP.md:51) |
| `window.md:88.10` | `A` | A result whose title is longer than the row is cut with an ellipsis on one line, and its tooltip | a long result title is cut with an ellipsis |
| `window.md:21.2` | `OBS` | A catalogue the reader has moved onto a page of their own opens the view on that page. | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:21.6` | `OBS` | Dragging an entry onto a pane of the page the catalogue is on opens it there; a unique view a pa | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:21.7` | `OBS` | An entry's right-click menu, or Shift+F10, offers Open on this page, which opens it in another p | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:21.8` | `OBS` | A view that was a tab of the catalogue's own pane moves out of it, and that pane goes on showing | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:21.9` | `OBS` | A view already open in another pane of that page is activated where it is. | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:21.10` | `OBS` | A drop on the catalogue's own pane goes to another pane, so the catalogue is never covered, and  | catalogue behaviour on a moved catalogue, drag and Open on this page, observable on use (the click and shift-click rules are at HELP.md:24) |
| `window.md:35.5` | `OBS` | A pane hidden by a maximised pane or folded away is shown, so the tab is seen, also when the pag | a hidden pane is shown; the tab shown after a close; Pin Editor acts on the pane that last held the focus |
| `window.md:39.2` | `OBS` | Closing the active tab shows the tab the pane showed before it that is still open, else the tab  | a hidden pane is shown; the tab shown after a close; Pin Editor acts on the pane that last held the focus |
| `window.md:88.7` | `OBS` | Pin Editor and Unpin Editor are among them, with Cmd-K Shift+Enter beside them, and act on the a | a hidden pane is shown; the tab shown after a close; Pin Editor acts on the pane that last held the focus |
| `window.md:67.1` | `L` | - **The pane menu.** Close, maximise or restore, fold where the pane sits in a split, split righ | the pane menu items |
| `window.md:68.1` | `L` | - **Right-click menus.** A right-click on the empty part of a pane's tab strip, or anywhere in a | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.3` | `L` | A right-click on a tab opens the tab's menu, VS Code's in its groups and words: | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.5` | `L` | Keep Open (enabled on a preview tab) and Pin or Unpin; | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.6` | `L` | Split Right with a Split & Move submenu, and, in the app, Move into New Window and Copy into New | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.7` | `L` | A right-click on any other part of the page that has no menu of its own, a blank area included,  | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.8` | `L` | Every text box offers Undo, Redo, Cut and Copy over a selection, Paste and Select All, a read-on | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.9` | `L` | Shift-F10 or the context menu key opens the menu of the row or control that has the focus, and a | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:68.10` | `L` | A right-click on a row of the Files view offers the file operations listed under the `files` vie | right-click menu item lists (the menu shapes and the asks are at HELP.md:44-45) |
| `window.md:73.2` | `L` | Save (a source tab that may be written; disabled while nothing is unsaved) and Revert File (show | the file tab action and palette action lists |
| `window.md:73.3` | `L` | Build shows the spinner while the root builds and offers Kill Build, View PDF opens the root's P | the file tab action and palette action lists |
| `window.md:73.4` | `L` | A picture, a PDF, a download, an HTML document and a Doc carry the star and Open in Program wher | the file tab action and palette action lists |
| `window.md:73.5` | `L` | A refused bookmark write is said beside the star. | the file tab action and palette action lists |
| `window.md:73.7` | `L` | The rendered half of a Markdown source tab and word wrap are palette actions, listed while the t | the file tab action and palette action lists |
| `window.md:73.8` | `L` | File: | the file tab action and palette action lists |
| `window.md:73.9` | `L` | Save and File: | the file tab action and palette action lists |
| `window.md:73.10` | `L` | Revert File (a tab that may be written), Git: | the file tab action and palette action lists |
| `window.md:73.11` | `L` | Toggle Git Blame Editor Decoration (a file in a repository, a version at HEAD or in the index in | the file tab action and palette action lists |
| `window.md:73.12` | `L` | Toggle Rendered Half (a Markdown tab that may be written, off until turned on and kept per tab), | the file tab action and palette action lists |
| `window.md:73.13` | `L` | Open Preview to the Side, Slurm: | the file tab action and palette action lists |
| `window.md:73.14` | `L` | Submit Job (a `.slurm` file on disk), and View: | the file tab action and palette action lists |
| `window.md:73.15` | `L` | Toggle Word Wrap (Alt+Z). | the file tab action and palette action lists |
| `window.md:73.17` | `L` | The tab's right-click menu offers Add Bookmark or Remove Bookmark for a served file that is not  | the file tab action and palette action lists |
| `window.md:80.6` | `S` | Cancel, a save and Revert let them go, and the manifest editor's Save control is not pressable w | the manifest editor Save control is not pressable while its own save is out |
| `window.md:98.3` | `S` | On the right, for a source tab over a file of a repository: the caret line's blame, whether or n | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.4` | `S` | Toggle Git Blame Editor Decoration is on (opens its commit in the Repositories graph; a tab over | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.5` | `S` | In a file a language server serves, the bar then shows the server's state by its name (starting, | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.6` | `S` | In a Python file it shows the interpreter in force as its version and environment, such as `3.13 | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.7` | `S` | In a file a linter takes (see Linters in `files-and-search.md`), one item for each linter that r | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.8` | `S` | Then the language (a searchable list that starts with Auto Detect, Configure File Association an | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.9` | `S` | Then the live sessions, the unsaved tabs (shows the first; not pressable at 0) and the bell. | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.10` | `S` | The LaTeX item is last of the left group: it shows while the active tab is a LaTeX source or the | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:98.11` | `S` | While a build or clean of a main file of the root's folder waits for the approval of a latexmkrc | status bar item details each item shows on screen; the asks, refusals and states are at HELP.md:82-86 |
| `window.md:90.6` | `R` | The names are asked of the search route (`GET /api/search?list=names`) once each time the mode o | the search route and the web worker of the file mode |

**views.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `views.md:7.6` | `A` | A lane header is painted at full opacity, and a muted cluster fades a lane's sub-line and its ca | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:7.7` | `A` | A ticker line's buttons appear under the pointer or the keyboard; on a device with a finger and  | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:23.10` | `A` | The tab's badge is the number of cards. | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:35.2` | `A` | The three filters are one wrapping row in the pane's bar, above the legend. | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:41.2` | `A` | A `wos:` or `scopus:` that opens with a check or a cross is drawn as the check or cross icon bef | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:85.3` | `A` | The files are ordered by their worst severity and then their path, and a file's rows by severity | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:133.2` | `A` | A slide taller than its page is scaled down to fit it. | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:137.2` | `A` | A long author and venue line is cut with an ellipsis, the whole line in its tooltip, and the car | lane header opacity, touch tap detail, the project tab badge, the Map filter row, check and cross icons, row format, slide scaling, an ellipsis |
| `views.md:7.15` | `A` | While every cluster is open and every Funding, Jobs and Teaching column is drawn, each header ha | Map header colours that differ under every theme (the rest of the sentence is kept) |
| `views.md:125.3` | `A` | The slide alone opens in a second window for the audience, at `/present/show`, with no toolbar,  | the Full Screen control hiding after 2 s at rest; the quarter-second redraw (the audience page, the draft rule and /present/show are kept in other words at HELP.md:237) |
| `views.md:131.1` | `A` | While a source tab of the same page holds text of a slide's file that is not saved, the slide is | the Full Screen control hiding after 2 s at rest; the quarter-second redraw (the audience page, the draft rule and /present/show are kept in other words at HELP.md:237) |
| `views.md:7.10` | `OBS` | A subtask's, a follow-up's and a task's done is always shown. | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:123.3` | `OBS` | Full screen also ends when the tab is hidden or the deck holds no slides. | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:125.7` | `OBS` | Both windows draw the deck as saved, never a source tab's unsaved text, and redraw when it is sa | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:125.8` | `OBS` | Presenting belongs to the pane and goes on over a tab switch, a page switch and a pane added. | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:125.11` | `OBS` | Presenter pressed again brings the audience window forward (in the desktop app it also loads the | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:129.2` | `OBS` | Edit Slide opens the slide's file in a source tab beside the pane at the slide's first line; for | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:133.8` | `OBS` | No other format is exported. | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:145.3` | `OBS` | Add on the bar opens the leads file with a new lead dated today in its unsaved text. | behaviour observable on use: done always shown, full screen ending when hidden, slide 1 fallback, presenting across tab and pane switches, Presenter pressed again, Edit Slide on a summary, no other export format, a lead dated today |
| `views.md:77.4` | `L` | Commands is a tree: | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.5` | `L` | Build LaTeX project with Clean, Kill and one node per recipe; | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.6` | `L` | View LaTeX PDF with Open in New Tab, Open in New Window, Open in Browser, Open in Program and Re | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.7` | `L` | Logs with the compiler log (the build terminal) and the build log (`<main>.log` as a source tab) | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.8` | `L` | Navigate, Select and Edit with Show the PDF at the caret, the environment commands and Insert Ro | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.9` | `L` | Miscellaneous with the citation browser, Count Words, Reveal Output Folder and texdoc; | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:77.10` | `L` | BibTeX with Align, Sort, Align and Sort and checkcites. | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:85.4` | `L` | The toolbar has Collapse All and View as Table or View as Tree. | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:233.3` | `L` | The head line counts the projects in flight and the agents running, the `claude` and `codex` pro | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:233.4` | `L` | The columns are PID, parent PID, user, start time, CPU, memory, command and the process's workin | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:241.13` | `L` | A toggle of a field a record may lack has a third state, unset; a number is held to its range; a | the TeX Commands tree, the Problems toolbar, the Processes head line and columns, the Settings control kinds (each list is drawn by its view) |
| `views.md:125.2` | `L` | The pane then shows the current slide large, the next slide smaller beside it (or "End of the de | the Presenter pane content (current slide, next slide, notes, "End of the deck.") |
| `views.md:125.12` | `S` | When the presenter screen's page is reloaded or lost, the audience window says "The presenter sc | the audience window sentences, the ps versus Activity Monitor note |
| `views.md:233.6` | `S` | CPU and memory come from `ps` and differ from Activity Monitor's own measure; | the audience window sentences, the ps versus Activity Monitor note |
| `views.md:113.2` | `X` | Who the person is lives in the people registry, and each entry names them by key. | repetition of the people registry (DATA-MAP holds it); the Duplicate Slide file name |
| `views.md:129.4` | `X` | Duplicate Slide copies the slide, as a file `<name>-copy.md` after the slide's file or, in a fil | repetition of the people registry (DATA-MAP holds it); the Duplicate Slide file name |

**configuration.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `configuration.md:12.t` | `L` | / `appearance.yml` / The UI theme list with the glyph each theme is offered under, the wallpaper | per-file key lists of the files table (the Settings view lists each key with its default, file and line); code_theme value forms |
| `configuration.md:13.t` | `L` | / `behavior.yml` / Thresholds, horizons and cadences: read limits, the `refresh_stale_days` thre | per-file key lists of the files table (the Settings view lists each key with its default, file and line); code_theme value forms |
| `configuration.md:14.t` | `L` | / `catalogs/file-nesting.yml` / The files the Files view draws under another file when File Nest | per-file key lists of the files table (the Settings view lists each key with its default, file and line); code_theme value forms |
| `configuration.md:15.t` | `L` | / `catalogs/glyphs.yml` / The glyph vocabulary: each name with the ASCII stand-in, one to three  | per-file key lists of the files table (the Settings view lists each key with its default, file and line); code_theme value forms |
| `configuration.md:16.t` | `L` | / `catalogs/icons.yml` / The line icon each glyph name is drawn as, one row per name in the glyp | per-file key lists of the files table (the Settings view lists each key with its default, file and line); code_theme value forms |
| `configuration.md:17.t` | `S` | / `catalogs/latex.yml` / The LaTeX editing tables: the `@` suggestions, the Cmd+L and Ctrl+Shift | licence notices and descriptions each file carries in its own head comment |
| `configuration.md:18.t` | `S` | / `catalogs/unimath.yml` / The Unicode math symbols the LaTeX completion offers after a backslas | licence notices and descriptions each file carries in its own head comment |
| `configuration.md:24.t` | `S` | / `catalogs/meta.yml` / The tool identity: the title and the subtitle the window carries. / | licence notices and descriptions each file carries in its own head comment |
| `configuration.md:52.1` | `R` | Every user-facing word lives under `config/text/`, one file per surface, a view's file under `co | config/text/views path, findings.yml sentence shape, the shape file path |
| `configuration.md:52.3` | `R` | The sentences of the Findings view are `config/text/findings.yml`, one per problem the readers a | config/text/views path, findings.yml sentence shape, the shape file path |
| `configuration.md:52.5` | `R` | A catalog or text file is also read through its whole-file shape (`src/lib/data/shapes/catalog-f | config/text/views path, findings.yml sentence shape, the shape file path |
| `configuration.md:82.7` | `S` | An account whose own file names a `client_id` loses that id with the file, and its Remove's ques | client_id loss: the Remove question says it |

**debugging.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `debugging.md:77` | `T` | ## The settings VS Code has for this | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:81.t` | `T` | / VS Code setting / Choice / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:82.t` | `T` | /---/---/ | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:83.t` | `T` | / `debug.closeReadonlyTabsOnEnd` / The tabs a session opened stay open; a session opens no read- | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:84.t` | `T` | / `debug.console.closeOnEnd` / The Debug Console stays open when a session ends. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:85.t` | `T` | / `debug.console.collapseIdenticalLines` / On, as in The console above. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:86.t` | `T` | / `debug.console.acceptSuggestionOnEnter` / Off: Enter sends the text typed. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:87.t` | `T` | / `debug.console.historySuggestions` / On. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:88.t` | `T` | / `debug.console.maximumLines` / 10,000. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:89.t` | `T` | / `debug.console.fontFamily`, `fontSize`, `lineHeight`, `wordWrap` / The terminal's font, wrappe | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:90.t` | `T` | / `debug.focusWindowOnBreak` / On. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:91.t` | `T` | / `debug.focusEditorOnBreak` / On. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:92.t` | `T` | / `debug.gutterMiddleClickAction` / Nothing, since the adapter offers no log point or conditiona | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:93.t` | `T` | / `debug.hideLauncherWhileDebugging` / Off: the picker and Start stay shown. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:94.t` | `T` | / `debug.openExplorerOnEnd` / Off: the end of a session opens no view. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:95.t` | `T` | / `debug.showBreakpointsInOverviewRuler` / Off: breakpoints are drawn in the glyph margin. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:96.t` | `T` | / `debug.showInlineBreakpointCandidates` / No candidate is drawn, since the adapter offers no in | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:97.t` | `T` | / `debug.showVariableTypes` / Off: Variables shows no type. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:98.t` | `T` | / `debug.internalConsoleOptions` / The Debug Console opens at every session's start. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:99.t` | `T` | / `debug.toolBarLocation` / Floating. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:100.t` | `T` | / `debug.openDebug` / The Debug view opens on a pause and not at a session's start. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:101.t` | `T` | / `debug.saveBeforeStart` / The unsaved `.rite` tabs are saved first. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:102.t` | `T` | / `debug.onTaskErrors` / A `before` command that ends other than 0 asks. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:103.t` | `T` | / `debug.hideSlowPreLaunchWarning` / Off: the notice after ten seconds is shown. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:104.t` | `T` | / `debug.showInStatusBar` / The status item shows once a session has run since the server starte | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:105.t` | `T` | / `debug.enableStatusBarColor` / On: the bar is painted while a session runs or is paused. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:106.t` | `T` | / `debug.breakpointsView.presentation` / A flat list of file and line rows, with no tree by fold | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:107.t` | `T` | / `debug.inlineValues`, `autoExpandLazyVariables`, `disassemblyView.showSourceCode`, `showSubSes | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:108.t` | `T` | / `debug.terminal.clearBeforeReusing` / No debug terminal. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:109.t` | `T` | / `debug.confirmOnExit` / Stopping asks first. / | the VS Code debug settings comparison table (HELP.md:383 says none of VS Code's debug.* settings is a key of oculus) |
| `debugging.md:41.3` | `A` | A breakpoint is drawn in the glyph margin as a filled red dot; a hollow red ring is one the adap | breakpoint dot shapes, the overview ruler, the toolbar grip, the arrow and tint on the current line |
| `debugging.md:41.6` | `A` | The overview ruler draws none. | breakpoint dot shapes, the overview ruler, the toolbar grip, the arrow and tint on the current line |
| `debugging.md:47.3` | `A` | The floating toolbar offers Continue, Step Over, Step Into, Step Out, Finish Frame, Restart and  | breakpoint dot shapes, the overview ruler, the toolbar grip, the arrow and tint on the current line |
| `debugging.md:49.1` | `A` | When the program pauses, the file of its top frame opens at the line, with the line tinted and a | breakpoint dot shapes, the overview ruler, the toolbar grip, the arrow and tint on the current line |
| `debugging.md:75.6` | `T` | Inline values: | inline values: a remark about what VS Code does |
| `debugging.md:75.7` | `T` | VS Code shows them only for a language with an inline values provider, which rite has not. | inline values: a remark about what VS Code does |
| `debugging.md:37.6` | `S` | The command's end removes the notice. | the notice disappears when the command ends |

**terminals.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `terminals.md:25.9` | `A` | Floating a pane and returning it to a page keep where each terminal's scrollback was scrolled to | scrollback position kept when floating, tab icon and colour, wide characters, an editor drawn full screen |
| `terminals.md:25.10` | `A` | A Terminal tab's tab in the strip is drawn with the icon and colour of the terminal it shows (th | scrollback position kept when floating, tab icon and colour, wide characters, an editor drawn full screen |
| `terminals.md:37.3` | `A` | An emoji or a wide character takes two cells, as the shell counts it. | scrollback position kept when floating, tab icon and colour, wide characters, an editor drawn full screen |
| `terminals.md:41.2` | `A` | An editor open in a terminal is drawn full screen after the page attaches, and leaving it shows  | scrollback position kept when floating, tab icon and colour, wide characters, an editor drawn full screen |
| `terminals.md:11.3` | `L` | The header's `new terminal` control starts a shell at once in the folder of the terminal shown h | the header control, row-menu and grid-menu item lists, Open in its own pane |
| `terminals.md:25.7` | `L` | A right-click on that name on the bar opens the menu of a list row (Split Terminal, Kill Termina | the header control, row-menu and grid-menu item lists, Open in its own pane |
| `terminals.md:33.1` | `L` | A right-click on the grid offers Copy and Copy as HTML over a selection, Paste, Select All, Clea | the header control, row-menu and grid-menu item lists, Open in its own pane |
| `terminals.md:45.6` | `L` | Below the sessions every terminal oculus runs is listed, those no Terminal tab owns among them:  | the header control, row-menu and grid-menu item lists, Open in its own pane |
| `terminals.md:37.5` | `R` | What you type, click, scroll or paste reaches the program as the bytes the grid sends, so a clic | the bytes the grid writes, the OCULUS_ARG_n spelling, the token line |
| `terminals.md:57.6` | `R` | A value reaches the command as an environment variable and is never read as shell text: each pla | the bytes the grid writes, the OCULUS_ARG_n spelling, the token line |
| `terminals.md:57.9` | `R` | Before each command the terminal prints a line of a token minted for that run and the command's  | the bytes the grid writes, the OCULUS_ARG_n spelling, the token line |
| `terminals.md:61.5` | `HIST` | Approvals given before the text took this form (the repository's path and the whole chain, in pl | approvals given before the text took its form ask again |
| `terminals.md:65.6` | `R` | The errors of a command's output are kept as the command's diagnostics and replaced when it runs | relative file names read from the printing command's folder, and the tmux pane read once |

**source-control.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `source-control.md:21.1` | `G` | Each block of a file's own diff, the changes git groups into one hunk as `git add -p` offers the | git add -p hunk head |
| `source-control.md:7.3` | `A` | Each file of the changes, of an open commit and of a diff of several files carries its Seti icon | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:7.4` | `A` | A changed file shows its name first and its folder after it, dimmed and cut at its end, with the | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:7.8` | `A` | The header's first button switches the changes between a list of files and a tree of folders. | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:7.10` | `A` | The controls of a readable repository row are always drawn; the controls of every other row (a c | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:21.2` | `A` | In a pane too narrow for the buttons' words they are drawn as icons with their words as the tool | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:39.2` | `A` | The first pill of a commit keeps its name, cut at its end; the others are glyphs only, grouped a | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:39.3` | `A` | The checked-out commit carries a pill with the head glyph first among its pills, named by the ch | Seti icons, file name and folder dimmed, list or tree button, when controls show, icons in a narrow pane, pill drawing |
| `source-control.md:7.9` | `L` | The `...` menu holds Pull, Push, Fetch, Sync, Publish Branch, the three stashes, Create Tag and  | the ... menu and the right-click menu and commit menu item lists (the writes and asks they hold are at HELP.md:393-416) |
| `source-control.md:7.11` | `L` | A right-click on a changed file offers Open Changes and Open File (HEAD) (neither on an untracke | the ... menu and the right-click menu and commit menu item lists (the writes and asks they hold are at HELP.md:393-416) |
| `source-control.md:39.10` | `L` | Open Changes, Copy Commit ID, Copy Commit Message, Checkout and Delete Tag lists, Checkout (Deta | the ... menu and the right-click menu and commit menu item lists (the writes and asks they hold are at HELP.md:393-416) |
| `source-control.md:7.12` | `OBS` | Open File (HEAD) opens the version HEAD holds, for a Staged row and a Changes row alike, read-on | the (HEAD) tab reads again when HEAD moves, Add to .gitignore opens the file, Reveal; the Trash rule is at HELP.md:410 |
| `source-control.md:15.4` | `S` | Where Commit cannot be pressed, its hover words say why. | hover words that say why Commit cannot be pressed, the checked-out branch hover words, the Reopen Closed Repositories box text |
| `source-control.md:39.6` | `S` | "This branch is checked out already" and "The checked-out branch cannot be deleted; switch to an | hover words that say why Commit cannot be pressed, the checked-out branch hover words, the Reopen Closed Repositories box text |
| `source-control.md:51.2` | `S` | Reopen Closed Repositories lists the closed ones in a box with the title 'Reopen Closed Reposito | hover words that say why Commit cannot be pressed, the checked-out branch hover words, the Reopen Closed Repositories box text |

**files-and-search.md**

| Guide line | Code | Sentence (start) | Reason |
|---|---|---|---|
| `files-and-search.md:11.1` | `L` | The tree starts with a header row for the workspace in force, its name or `Configured roots` for | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:21.6` | `L` | The head carries Pin the Current Timeline (Unpin the Current Timeline once pinned), which holds  | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:43.1` | `L` | A right-click on a file offers Open to the Side, Open in New Tab and Open in New Window on a PDF | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:43.2` | `L` | (Search over that folder, a hidden or ignored one included), Fix All Writing Problems in Folder. | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:43.3` | `L` | (the writing rules' fixes for the files under it, listed to tick; see Linters), Cut, Copy, Paste | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:81.2` | `L` | `editor.tab_size` and `editor.insert_spaces` for a file with no indented line, `editor.word_wrap | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:81.3` | `L` | `editor.languages` holds a record per language name with `tab_size`, `insert_spaces`, `word_wrap | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:81.13` | `L` | Sticky scroll pins the headings of a Markdown or LaTeX file, the blocks TypeScript, JavaScript,  | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:81.14` | `L` | It pins the braces of Java, Dart, R and Rite, and of C and C++ while no language server serves t | header actions, the Timeline head controls, the right-click menu lists, the option and per-language record key lists, the sticky scroll content |
| `files-and-search.md:13.1` | `A` | A match is drawn open under its folders, those folders held open only while the text is there, s | the project finder listing laziness, a faded Cut item |
| `files-and-search.md:47.7` | `A` | A Cut item is drawn faded until it is pasted or another Cut or Copy replaces it. | the project finder listing laziness, a faded Cut item |
| `files-and-search.md:35.1` | `R` | Add Folder to Workspace opens the system's folder panel (`POST /api/folders/pick`, which lists a | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:51.6` | `R` | `GET /api/history?root=<key>&path=<rel>` lists the copies of a file and `&id=<id>` answers one c | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:146.1` | `R` | The palette's file mode (Cmd+P) lists files by name, and its names come from the same route as a | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:146.2` | `R` | `GET /api/search?list=names` answers the paths ripgrep's `--files` lists under every served root | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:146.3` | `R` | The rules differ from a search's in these ways. | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:146.9` | `R` | The rules are the same in these: | routes (/api/folders/pick, /api/history, /api/search) |
| `files-and-search.md:105.6` | `S` | The ellipsis character, a curly quote and a no-break space have a fix that writes three periods, | the writing-rule fix wording and the ChkTeX warning numbers (the Quick Fix menu shows each fix) |
| `files-and-search.md:105.7` | `S` | An en dash with no space around it has a fix that writes a hyphen; an en dash with a space aroun | the writing-rule fix wording and the ChkTeX warning numbers (the Quick Fix menu shows each fix) |
| `files-and-search.md:105.8` | `S` | An arrow that has an ASCII form (`->`, `=>`, `<-`, `<->`, `<=>`) has a fix that writes it and a  | the writing-rule fix wording and the ChkTeX warning numbers (the Quick Fix menu shows each fix) |
| `files-and-search.md:105.9` | `S` | A Markdown paragraph broken over several lines has one finding with a fix that joins its lines i | the writing-rule fix wording and the ChkTeX warning numbers (the Quick Fix menu shows each fix) |
| `files-and-search.md:115.2` | `S` | Ruff's, ESLint's and ShellCheck's own fixes and suggestions, and for ChkTeX the fixes LaTeX Work | the writing-rule fix wording and the ChkTeX warning numbers (the Quick Fix menu shows each fix) |
| `files-and-search.md:121.t` | `T` | / VS Code / oculus / | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:123.t` | `T` | / Lint as you type / A lint runs on save and on open; a lint on every pause would run ESLint con | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:124.t` | `T` | / LaTeX Workshop's root lint, which follows `\input` / A file's findings follow its own tab, as  | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:125.t` | `T` | / Ruff from the environment (`ruff.importStrategy`) / The PATH or `lint.ruff_path`; a repository | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:126.t` | `T` | / Code actions on save / Off by default in VS Code / | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:127.t` | `T` | / Show output channel / The reason of a failure is the status item's tooltip / | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:128.t` | `T` | / Ruff's formatter and Organize Imports / Formatting is not part of linting; pyright offers Orga | the VS Code versus oculus linter comparison table (its facts about runs on save, the ruff path, the failure reason are stated at HELP.md:319-324) |
| `files-and-search.md:39.7` | `X` | A path is read by its segments, so `a/../b` is `b`, and a value that climbs above the hub gets n | the a/../b example of a rule already stated |
| `files-and-search.md:91.4` | `OBS` | The links follow the text of the tabs, so a key typed into a tab is a link before it is saved. | a hub key typed into a tab is a link before it is saved; a hit line past the end of the file lands on its last line |
| `files-and-search.md:144.1` | `OBS` | The cursor lands on the hit's line once the file has loaded, and a line past the end of the file | a hub key typed into a tab is a link before it is saved; a hit line past the end of the file lands on its last line |
| `files-and-search.md:97.7` | `S` | A language server that refuses a rename with no reason shows "The language server refused this r | the sentence shown when a language server refuses a rename with no reason |
| `files-and-search.md:138.6` | `T` | `case` is the only control over case: there is no smart case (an editor's `search.smartCase`, wh | the note that oculus has no smart case, which compares with a VS Code setting |

Rows by code: `A` 49, `G` 1, `HIST` 1, `L` 56, `OBS` 20, `R` 14, `S` 26, `T` 40, `X` 3; total 210 rows. A row names one sentence or one table row.


### 2.4 What became of each removed guide

HELP.md section line ranges (`grep -n "^#" HELP.md`): The window 11-86 (The rail 18-27, Pages and the pane tree 28-52, Workbenches 53-61, The palette 62-69, The update tray and schedules 70-79, The status bar and notifications 80-86), The keys 87-158, The views 159-275 (LaTeX builds 261-275), Files and the editor 276-325, Searching the files 326-336, Terminals 337-349, Project commands 350-360, Debugging 361-384, Apps 385-391, Source Control and worktrees 392-418, Configuration and the data 419-450. "Kept" below means every fact of the section is stated in the named lines or is listed in section 2.3 with a code.

**Configuration guide.** The files of `config/` and the options catalog: Configuration and the data, HELP.md:421-427; the per-file key lists are dropped as `L` and the licence notices as `S` (2.3). The two layers of settings and The hub's own folder: HELP.md:427-434. The text of the interface: HELP.md:425, with the route and shape paths dropped as `R`. `local.yml`: HELP.md:435-441 (the forms of `rite_dap_bin` at HELP.md:436, the keys of `literature` at HELP.md:438). The hub's files: HELP.md:429 and 450. What is kept outside the hub: HELP.md:441. The Literature search's keys: HELP.md:438 and 445. Mail accounts and the Inbox: HELP.md:445-446 and 448-449 (the consent with the mail scopes alone at HELP.md:445, the 2-minute read at HELP.md:446). Calendar accounts: HELP.md:446-447. The change log: HELP.md:442-444. The `client_id` loss is dropped as `S`.

**Debugging guide.** Starting, The launch file (the `launch.yml` fence and its four bullets), A command before the launch, Breakpoints, Stepping, Stop and restart, The console: Debugging, HELP.md:361-384. Keys: the five debug key rows at HELP.md:144-147. What the debugger does not offer: HELP.md:383. The settings VS Code has for this: the table is dropped as `T` (2.3) and its last row is stated at HELP.md:383. Breakpoint dot shapes, the overview ruler, the toolbar grip and the current-line arrow are dropped as `A`.

**Files and search guide.** The Files view, The tree and its header, Open Editors and Outline, Timeline, Bookmarks and Notes, Keys and selection in the tree, Workspaces roots and Add Folder to Workspace, Show in Files, Creating renaming deleting moving and pasting, Undo and the local history, The Files tab of the Sessions page, Opening a file, Saving a source file, The source tab's editor options, Language servers, Hub keys in YAML files: Files and the editor, HELP.md:276-325. Linters: HELP.md:319-324. Searching the files, The pattern, Running a search and reading the results, Replace, The replace text: HELP.md:326-336. The routes, the right-click menu lists, the option and per-language key lists and the linter comparison table are dropped as `R`, `L` and `T`; the writing-rule fix wording and the ChkTeX warning numbers as `S`.

**Source Control guide.** All thirteen sections: Source Control and worktrees, HELP.md:392-418. The `git add -p` hunk head is dropped as `G`; the menu lists, the pill and graph drawing, the hover words and the Reopen Closed Repositories box text as `L`, `A` and `S` (2.3). The Trash rule for an untracked file is at HELP.md:410 and the sync control at HELP.md:82.

**Terminals and commands guide.** The Terminal view through Sessions: Terminals, HELP.md:337-349. Where project commands come from, Where project commands are drawn, The run, Approval, The result, The default build and test keys: Project commands, HELP.md:350-360 (the approvals file mode at HELP.md:357). The OCULUS_ARG_n spelling, the token line and the bytes the grid writes are dropped as `R`; icon and colour drawing, scrollback position, wide characters and the full-screen editor as `A`; the grid and row menu lists as `L`; the sentence on approvals given before the text took its form as `HIST`.

**Views guide.** Each view's section: one row of the table in The views (HELP.md:159-259) plus bullets for what a reader cannot see: Projects HELP.md:235, Present HELP.md:236-240, Literature search HELP.md:241, Inbox HELP.md:243, Live HPC HELP.md:246-248, Usage and Processes HELP.md:249, Settings HELP.md:251-253, Refactor Preview HELP.md:254, LaTeX builds HELP.md:261-275. Lane header opacity, the touch tap detail, slide scaling and similar drawing are dropped as `A`; the TeX Commands tree, the Problems toolbar, the Processes columns and the Settings control kinds as `L`; the audience window sentences and the `ps` note as `S`; eight behaviours observable on use as `OBS` (2.3).

**Window guide.** The window and the app: HELP.md:11-17. The rail, The Views catalogue, The foot of the rail: HELP.md:18-27. The update tray and schedules: HELP.md:70-79. Pages, Workbenches, Where an opened tab lands, Inside a page, Focus tabs and unsaved text: HELP.md:28-61. The palette: HELP.md:62-69. The key sheet: HELP.md:89. The status bar and notifications: HELP.md:80-86. Tooltip and scrollbar drawing, rail sizes, strip drawing and the tab strip scroll controls are dropped as `A`; the pane, right-click and file-tab action lists as `L`; the status bar item details as `S`; the file-mode search route as `R`; the catalogue behaviours on a moved catalogue, the hidden pane, the tab shown after a close and Pin Editor's pane as `OBS` (2.3).


## 3. The `present.yml` field table on DATA-MAP

`docs/DATA-MAP.md:485` holds the section below, written from `config/schemas/deck-schema.yml`. The "Where each schema is" row of `present.yml` points to it. Case 8 method (`c08_deck.py`, section 9): the leaf field keys of the schema against the names in the table, 7 names, none missing, none extra. `notes` is not a field of the deck schema (section 11).

```
### present.yml fields

Every field of a deck's `present.yml`: `deck/present.yml` of the hub and `present/present.yml` of a project. A dotted name such as `groups.<name>.find` is a key inside a map, and `<name>` is the group's name. A key that is not in this table is marked in the editor, and the reader reports a group or an entry it cannot read with the key it is about. The type is the widget of the deck schema, explained under "Collection schema types". The Present bullets of `tools/oculus/HELP.md`, section The views, say what a deck shows.

| Field | Type | Allowed values or what it names | Required |
|---|---|---|---|
| `deck.title` | text | the title shown on the first slide and in the deck list | no |
| `defaults.tag_tones` | raw | a map from a slide tag to the name of the hue its chip wears; it overrides the engine's `tag_tones` | no |
| `groups.<name>.find` | raw | which decks the group finds, a map of `folders` (globs of folders under the deck's root, at least one), `tiers` (the scan tiers the deck's project must be in) and `status` (status chips of which the project must hold one); a group with no `find` names project decks of the hub | no |
| `groups.<name>.sort` | text | `folder` or `title`, how the found decks are ordered; `folder` when absent | no |
| `groups.<name>.discover` | checkbox | `true` also takes the decks `find` found that no group names, in the order `sort` gives | no |
| `groups.<name>.slides` | tags | the decks the group shows, in order, each by a project id or by the name of a deck folder (schema `from` `projects`) | no |
| `order` | raw | the slides in the order they are shown: a slide file name, `{ slides: <group> }` for the slides of a group, or `{ kind: summary, of: <group> }` or `{ kind: grid, of: <group> }` with optional `title`, `lede` and `foot` | yes: a deck with no entry is a finding |
```


## 4. The Help page sentence

HELP.md:25 reads:

```
- The Help page's tabs are the `help` arrangement of `config/layout.yml`: this manual, the Apps guide and the Memories wall. An entry of the hub's `docs:` list (Research approach, Agent approach, HPC how-to, Data map and the Apps guide) opens by its `h` chord or its row in the Views catalogue, in the page you are on; a document tab saved at a path the list no longer holds follows the entry carrying its label, or closes into the tab already showing that entry, and a tab that matches no entry names the path it asked for.
```

Each clause against the tree. The Help page's tabs are the `help` arrangement (`config/layout.yml:92-93`: `help:` with the view list of the help view, the Apps guide doc tab and `memories`). The hub's `docs:` list has five entries (`.oculus/config/layout.yml:9-13`: Research approach, Agent approach, HPC how-to, Data map, Apps guide, each `group: help`). A saved doc tab at a path the list no longer holds follows the entry carrying its label, or shows no entry (`followDoc`, `src/lib/state/workbench/navigation/catalogue.ts:40-48`: a listed path wins, otherwise exactly one entry with the label, otherwise `entry: null`). A tab that matches no entry names the path it asked for (`Doc.svelte:84-89` and `:169-170`, `<Empty message={t('doc.unlisted', path)}>`). The `h` chord and the Views catalogue row open a document in the page you are on (HELP.md:24 and HELP.md:89). The clause "closes into the tab already showing that entry" follows the `moved: true` result of `followDoc`; I did not run that path (case 12 runs the saved-layout reader, not the view), so that clause is not verified by a run.


## 5. DESIGN.md and README.md pointers into HELP.md

Every `HELP.md#anchor` in `DESIGN.md` and `README.md` was read against the claim of its sentence, and each points at a section that holds the claim. The table gives, for each pointer, the HELP.md line that holds it and the text there (`c05b_pointers.py` looks for a phrase of the claim inside the anchor's section; the phrases and the lines were read by me). The pointers the round brief names are `DESIGN.md:91`, `:150`, `:156`, `:539` and `:566`.

| Pointer | Section | HELP.md line | Text there |
|---|---|---|---|
| `DESIGN.md:91` | `HELP.md#configuration-and-the-data` | HELP.md:422 | config/`, `appearance.yml` holds the UI themes, the wallpaper, the Memories wall's folder, |
| `DESIGN.md:140` | `HELP.md#source-control-and-worktrees` | HELP.md:397 | - Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between mergin |
| `DESIGN.md:142` | `HELP.md#searching-the-files` | HELP.md:330 | ferences; `word` over the root finds the name in every file. |
| `DESIGN.md:144` | `HELP.md#the-views` | HELP.md:241 | - Literature search: it sends the query and its filters to the sources that are on and to  |
| `DESIGN.md:144` | `HELP.md#configuration-and-the-data` | HELP.md:438 | - `literature` of `local.yml` is a map of `wos_key`, `scopus_key`, `scopus_insttoken`, `op |
| `DESIGN.md:146` | `HELP.md#the-views` | HELP.md:247 | not slow. Submit Job (a button of a `.slurm` file under a served root) shows a plan naming |
| `DESIGN.md:148` | `HELP.md#the-update-tray-and-schedules` | HELP.md:74 | - `schedules.yml` may be edited by hand: the dialog, Pause and Resume change only the keys |
| `DESIGN.md:150` | `HELP.md#configuration-and-the-data` | HELP.md:437 | - `accounts` of `local.yml` (the agent account folders the Usage view and the sessions rea |
| `DESIGN.md:152` | `HELP.md#configuration-and-the-data` | HELP.md:449 | - The triage notes (what each thread wants, the line about it and the drafted answer) ar |
| `DESIGN.md:152` | `HELP.md#the-views` | HELP.md:243 | - Inbox: Send and Archive are the only writes oculus makes to a mailbox, each behind a con |
| `DESIGN.md:156` | `HELP.md#configuration-and-the-data` | HELP.md:444 | - An undo of a write that removed a field puts the removed text back where it stood, befor |
| `DESIGN.md:238` | `HELP.md#pages-and-the-pane-tree` | HELP.md:41 | - A pane the page's arrangement defines stays, empty, when its last tab closes (an empty p |
| `DESIGN.md:240` | `HELP.md#pages-and-the-pane-tree` | HELP.md:36 | lf and is drawn at most once on a screen. A drop on a pane of a page shown inside another  |
| `DESIGN.md:266` | `HELP.md#configuration-and-the-data` | HELP.md:435 | default; a changed port moves the server and the open page follows with its tabs, layout a |
| `DESIGN.md:462` | `HELP.md#source-control-and-worktrees` | HELP.md:397 | - Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between mergin |
| `DESIGN.md:464` | `HELP.md#configuration-and-the-data` | HELP.md:437 | - `accounts` of `local.yml` (the agent account folders the Usage view and the sessions rea |
| `DESIGN.md:469` | `HELP.md#terminals` | HELP.md:339 | - Each Terminal tab owns terminals running Claude, Codex or a shell inside tmux, which kee |
| `DESIGN.md:472` | `HELP.md#pages-and-the-pane-tree` | HELP.md:39 | , a diff) never covers the tool views of its page. It lands in a workbench's documents pan |
| `DESIGN.md:474` | `HELP.md#the-rail` | HELP.md:22 | - Drag a button to move it; right-click it (or press Shift+F10) to hide it, reset its page |
| `DESIGN.md:474` | `HELP.md#pages-and-the-pane-tree` | HELP.md:31 | - The Pages view lists every page with show, rename and close (close asks first when the p |
| `DESIGN.md:478` | `HELP.md#the-views` | HELP.md:221 | - Three open from a file: `source` (a text file, coloured by language up to `editor.paint_ |
| `DESIGN.md:478` | `HELP.md#files-and-the-editor` | HELP.md:295 | ret moved selects the range again. |
| `DESIGN.md:480` | `HELP.md#pages-and-the-pane-tree` | HELP.md:41 | last tab. Lock Group in a pane's right-click menu makes it take no tab opened from elsewhe |
| `DESIGN.md:482` | `HELP.md#pages-and-the-pane-tree` | HELP.md:39 | , a diff) never covers the tool views of its page. It lands in a workbench's documents pan |
| `DESIGN.md:484` | `HELP.md#the-views` | HELP.md:237 | - Present: Present in the toolbar and `F` put the slide on the whole monitor, where the ar |
| `DESIGN.md:488` | `HELP.md#the-views` | HELP.md:222 | - A Customizations item names its file by real path (a link followed to its target): a fil |
| `DESIGN.md:497` | `HELP.md#the-views` | HELP.md:239 | - Present: the Slides button opens the catalog of the deck's groups: the `order:` list (dr |
| `DESIGN.md:506` | `HELP.md#the-views` | HELP.md:250 | - Audit: the sections are open markers, manifest gaps, folders off the tier standard, stat |
| `DESIGN.md:509` | `HELP.md#source-control-and-worktrees` | HELP.md:413 | - Blame (the Toggle Blame button or Git: Toggle Git Blame Editor Decoration) writes who la |
| `DESIGN.md:509` | `HELP.md#the-status-bar-and-notifications` | HELP.md:83 | it shows the caret line's blame (a press opens its commit in the Repositories graph), the  |
| `DESIGN.md:517` | `HELP.md#files-and-the-editor` | HELP.md:295 | - A single click opens a preview tab in italics, and the next single click in that pane po |
| `DESIGN.md:521` | `HELP.md#files-and-the-editor` | HELP.md:301 | ettings). Indentation is taken from the tab's own choice on the status bar, then the file' |
| `DESIGN.md:524` | `HELP.md#files-and-the-editor` | HELP.md:292 | , and the newest 50 such copies over all files, so a larger file, the files inside a delet |
| `DESIGN.md:527` | `HELP.md#the-views` | HELP.md:242 | - Position Leads: `applied` opens the Applications file beside the leads with a new entry  |
| `DESIGN.md:528` | `HELP.md#the-views` | HELP.md:232 | - Map: a press on a node fixes it where it lies and moves nothing, dragging it moves it wh |
| `DESIGN.md:530` | `HELP.md#searching-the-files` | HELP.md:328 | - Open the Search view with Cmd-Shift-F, type a pattern and press Enter (or the Search con |
| `DESIGN.md:531` | `HELP.md#the-views` | HELP.md:259 | read-only library tab, which says after a reload that the file is no longer open. A hierar |
| `DESIGN.md:533` | `HELP.md#source-control-and-worktrees` | HELP.md:397 | - Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between mergin |
| `DESIGN.md:535` | `HELP.md#source-control-and-worktrees` | HELP.md:415 | - A worktree row is named by the last name of its folder (the path is its tooltip), opens  |
| `DESIGN.md:536` | `HELP.md#pages-and-the-pane-tree` | HELP.md:50 | move on. The rail is one stop and each tab strip is one stop with its pane menu the stop a |
| `DESIGN.md:536` | `HELP.md#the-keys` | HELP.md:89 | The key sheet opens with `?` and closes with `?` or Escape; its letters before a digit are |
| `DESIGN.md:539` | `HELP.md#the-views` | HELP.md:223 | - A view drawn from one file of the hub carries that file's own control, last in its toolb |
| `DESIGN.md:554` | `HELP.md#pages-and-the-pane-tree` | HELP.md:51 | - A tooltip opens when the pointer rests on a control or the keyboard brings the focus to  |
| `DESIGN.md:556` | `HELP.md#the-rail` | HELP.md:26 | te tray). A fade at the top or bottom edge of the rail's list says more entries are past i |
| `DESIGN.md:563` | `HELP.md#files-and-the-editor` | HELP.md:282 | controls. On a focused row Enter and F2 rename, Cmd+Down opens a file as the pane's previe |
| `DESIGN.md:563` | `HELP.md#source-control-and-worktrees` | HELP.md:415 | - A worktree row is named by the last name of its folder (the path is its tooltip), opens  |
| `DESIGN.md:565` | `HELP.md#the-views` | HELP.md:220 | ect.yml`. The project tab draws the card's tag for each known document the project has not |
| `DESIGN.md:566` | `HELP.md#the-views` | HELP.md:229 | - Focus: each lane's header is a strip of the lane's colour, Run green, Push blue, Revise  |
| `DESIGN.md:567` | `HELP.md#files-and-the-editor` | HELP.md:285 | - Show in Files of a file (on a project card, a collection card whose `link`, `url` or `fo |
| `DESIGN.md:568` | `HELP.md#pages-and-the-pane-tree` | HELP.md:51 | arries an accent line along its top and every other strip a plain one, a page drawn inside |
| `DESIGN.md:570` | `HELP.md#pages-and-the-pane-tree` | HELP.md:43 | - `show_tabs` (`multiple`, `single` or `none`), `editor_actions` (`strip` or `hidden`) and |
| `DESIGN.md:577` | `HELP.md#the-status-bar-and-notifications` | HELP.md:85 | - The bell counts unread notifications and opens the notification centre (Clear, Clear All |
| `DESIGN.md:581` | `HELP.md#files-and-the-editor` | HELP.md:304 | lab`) and ends 60 seconds after the last tab of that root and language closes; a changed ` |
| `DESIGN.md:590` | `HELP.md#the-window` | HELP.md:16 | - The app prints the Present view's PDF export through a hidden window and opens the audie |
| `DESIGN.md:591` | `HELP.md#debugging` | HELP.md:381 | - The adapter cannot be stopped by the protocol: Stop sends SIGTERM to the process oculus  |
| `README.md:9` | `HELP.md#the-window` | HELP.md:13 | - Oculus runs in a browser tab or in its own app (Electron, run from the checkout or packa |

Pointers changed in this round: `DESIGN.md:150` names `HELP.md#configuration-and-the-data` for the accounts, their files and the view's Add account and Remove, and the head comments of `src/lib/server/accounts/calendar/` for the poll, the error state and the `ics` provider; `DESIGN.md:152` names `#configuration-and-the-data` for the accounts and the triage notes and `#the-views` for the confirmations; `DESIGN.md:509` names `#source-control-and-worktrees` and `#the-status-bar-and-notifications`; `DESIGN.md:565` finds the subtasks block at HELP.md:235. `c05_anchors.py` reports 58 targets, 0 unmatched (section 9).


## 6. Comments and the renamed test title

Items 6 and 7 of the brief. Each file below is changed only in the lines the diff prints (`diff <base file> <worktree file>`, `<` base, `>` now); `config-folder.test.ts:1-5` and `Help.svelte:23-30` are rewrapped as whole paragraphs at 100 columns. No line other than a comment line or the test title at `history.test.ts:155` differs in these six files, and no assertion differs (section 8).

**`tools/oculus/src/lib/server/content/docs.ts`**

```
30,34c30,35
< // A document of oculus's own (HELP.md, DESIGN.md, a guide under docs/: a file whose real path lies
< // inside the engine's real folder) draws a diagram of `docs/diagrams/` as a part of its own beside
< // its runs of prose, so the page can draw it in the page's text colour; the answer carries those
< // parts only when the document holds a diagram. A document's answer names its own path and the
< // manual's, relative to the hub, which the page resolves a relative link to another document from.
---
> // A document of oculus's own (HELP.md, DESIGN.md, the Apps guide under docs/: a file whose real
> // path lies inside the engine's real folder) draws a diagram of `docs/diagrams/` as a part of its
> // own beside its runs of prose, so the page can draw it in the page's text colour; the answer
> // carries those parts only when the document holds a diagram. A document's answer names its own
> // path and the manual's, relative to the hub, which the page resolves a relative link to another
> // document from.
```

Longest changed line: 98 columns (`diff ... | grep "^> " | awk` of line length).

**`tools/oculus/src/lib/views/shared/prose/doc-link.ts`**

```
2,3c2,3
< // drawn in. Help and the doc view draw oculus's manual, its guides and the hub's documents, which
< // link to one another by relative address (`docs/configuration.md`, `../HELP.md#the-keys`), the
---
> // drawn in. Help and the doc view draw oculus's manual, the Apps guide and the hub's documents,
> // which link to one another by relative address (`docs/apps.md`, `../HELP.md#the-keys`), the
```

Longest changed line: 96 columns (`diff ... | grep "^> " | awk` of line length).

**`tools/oculus/src/lib/views/sources/doc/Doc.svelte`**

```
24,26c24,26
<     // under the hub root by the server, so it is drawn through the file route. A document of
<     // oculus's own (DESIGN.md, a guide) comes back with its diagrams cut out as parts of their own,
<     // and the view draws each from the diagram route in the page's text colour between the runs of
---
>     // under the hub root by the server, so it is drawn through the file route. A listed document of
>     // oculus's own (the Apps guide) comes back with its diagrams cut out as parts of their own, and
>     // the view draws each from the diagram route in the page's text colour between the runs of
```

Longest changed line: 100 columns (`diff ... | grep "^> " | awk` of line length).

**`tools/oculus/src/lib/views/system/help/Help.svelte`**

```
3c3
<     // page's one pane, beside the hub's documents and the guides.
---
>     // page's one pane, beside the hub's documents and the Apps guide.
23,29c23,30
<     // The manual holds no diagram: the diagrams of docs/diagrams/ are drawn by the doc view over
<     // DESIGN.md and the guides. A press on a relative link to another Markdown file opens that
<     // document in a doc tab (shared/prose/jump.ts), and a press on a link into the manual from a
<     // guide opens this view with the heading the link names in its state, which the view scrolls to
<     // once the manual is drawn and then removes from the state. The prose is drawn straight into
<     // the box, so over a wallpaper the box asks for the tint and is the one surface the manual is
<     // read off.
---
>     // The manual holds no diagram. The doc view draws a diagram of docs/diagrams/ only over a
>     // document listed in `docs:` of config/layout.yml that lies inside the engine folder; DESIGN.md
>     // is not listed and the Apps guide holds none, so none is drawn. A press on a relative link to
>     // another Markdown file opens that document in a doc tab (shared/prose/jump.ts), and a press on
>     // a link into the manual from another document opens this view with the heading the link names
>     // in its state, which the view scrolls to once the manual is drawn and then removes from the
>     // state. The prose is drawn straight into the box, so over a wallpaper the box asks for the
>     // tint and is the one surface the manual is read off.
```

Longest changed line: 100 columns (`diff ... | grep "^> " | awk` of line length).

**`tools/oculus/tests/checks/config/config-folder.test.ts`**

```
1,5c1,5
< // Layer 4, tree check. The config folder oculus ships, read the way the server reads it: which
< // keys sit in which file, that no key is defined in two, that every file carries the one line the
< // Settings view and the Configuration guide show, and that the glyphs, the icons and the catalogue
< // groups the files name resolve. The machine's own local.yml is left out of every list here, since
< // a checkout has one or it has none and neither may change a result.
---
> // Layer 4, tree check. The config folder oculus ships, read the way the server reads it: which keys
> // sit in which file, that no key is defined in two, that every file carries a description line, the
> // one the Settings view shows, and that the glyphs, the icons and the catalogue groups the files
> // name resolve. The machine's own local.yml is left out of every list here, since a checkout has
> // one or it has none and neither may change a result.
```

Longest changed line: 100 columns (`diff ... | grep "^> " | awk` of line length).

**`tools/oculus/tests/checks/source/history.test.ts`**

```
4,7c4,7
< // file there, and every line of the documents (HELP.md, DESIGN.md, README.md and each guide under
< // docs/) is read and matched against the migration plan's id vocabulary, a date and the session
< // phrases below; every hit is printed with its file and line, so a failure names the lines to
< // rewrite rather than only the count of them.
---
> // file there, and every line of the documents (HELP.md, DESIGN.md, README.md and the Apps guide,
> // docs/apps.md) is read and matched against the migration plan's id vocabulary, a date and the
> // session phrases below; every hit is printed with its file and line, so a failure names the lines
> // to rewrite rather than only the count of them.
24c24
< /** The folder holding the guides, each a document read whole as well. */
---
> /** The folder holding the Apps guide and any other Markdown document, each read whole as well. */
116c116
< /** The documents of a tree: the three at its root and every Markdown guide under its `docs/`. */
---
> /** The documents of a tree: the three at its root and every Markdown file under its `docs/`. */
153c153
<     // and the code `const Q1` of src/quartile.ts are not (its block comment is a hit). A guide
---
>     // and the code `const Q1` of src/quartile.ts are not (its block comment is a hit). A document
155c155
<     it('reads every line of a text file, every guide and every comment of code', () => {
---
>     it('reads every line of a text file, every document and every comment of code', () => {
```

Longest changed line: 99 columns (`diff ... | grep "^> " | awk` of line length).

### 6.1 History-word grep of every changed comment line and the test title

The 33 changed lines of the six files (every `>` line above, the title at `history.test.ts:155` among them) were written to a file and searched with:

```
grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bD[0-9]{2}\b|\bZ[0-9]{3}\b|20[0-9]{2}" changedlines.txt
```

Output:

```
(no line)
```

grep exit status 1 (1 means no hit). The words are the brief's ten: before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands; plus package ids (`D` and two digits, `Z` and three digits) and years. No hit, so no hit to judge. `tests/checks/source/history.test.ts` itself, run after the last change, passes (section 10).


## 7. The prose pass (Verify 5)

Each new or changed sentence of HELP.md, the Apps guide, DATA-MAP, DESIGN.md, README.md and the comments was read against the prose rules of `agents/spec.md` and the brief: plain ASCII, no em or en dash, no quip, no "not X but Y" contrast, one line per paragraph or bullet, no history, date or step id, one name for one thing, no group of three padded, no emoji.

**HELP.md.** `sentences.py` splits HELP.md and the HELP.md of the start of this round (`HELP.before-r1.md`) into sentences; the sentences of HELP.md that are not in the earlier file are the changed ones: 444 sentences. I read all 444. The construction scan below runs over the final text.

Construction scan (`(, not |\bnot [^,.;]{1,40}, but\b|\bnot [^,.;]{1,30} but\b|rather than|instead of|\bmerely\b|\bsimply\b|\bjust\b|\bwhole point\b|\bnot only\b|\bnot just\b|\bactually\b|\bunlike\b|\bwhereas\b)`) over the 444 changed sentences: 3 hit(s).

| Sentence | Hit |
|---|---|
| HELP.md:83.1 | age server's state (starting, indexing with its count, ready, not found, failed or root not served; a press lists Re |
| HELP.md:318.3 | e, is already a key or is empty, or when a file is over 5 MB, not UTF-8 text, open in another window or open with un |
| HELP.md:376.2 | aunch, a launch that waits drops when the command is refused, not approved or its terminal is closed, another start  |

Each hit read in place. `not found` (HELP.md:83), `not UTF-8 text` (HELP.md:318) and `not approved` (HELP.md:376) are members of an enumeration of states or conditions (a language server's states, the cases in which a rename is refused, the cases in which a waiting launch is dropped); none sets one thing against another, so they stay. The text-detection sentence of item 7 is HELP.md:294 and reads "a file counts as text by its own first bytes, whatever its extension".

Dash scan hits: HELP.md:77.1 `ded starts the run with `--dangerously-skip-permissi`; HELP.md:236.1 `ides split by a line of `---` (the fields of `presen`; HELP.md:247.2 `d `cd <folder> && sbatch --parsable <script>`, and w`; HELP.md:248.1 `s); the copy never uses `--delete` or `--mkpath` and`; HELP.md:407.1 `tached) runs `git switch --detach` and a branch swit`. Each is a literal inside backticks (a `---` slide separator, a command-line flag), kept as written.

Dash scan (an en or em dash, a spaced hyphen, `--`) over the same sentences: 5 hit(s). ASCII gates on HELP.md, the Apps guide, DATA-MAP, DESIGN.md and README.md: `LC_ALL=C grep -n '[^ -~]'` prints nothing (section 10).

| Document | Changed lines (`diff`, `>` lines) | New sentences (not in the base file) | Scan hits |
|---|---|---|---|
| `tools/oculus/docs/apps.md` | 207 | 159 | 0 |
| `docs/DATA-MAP.md` | 191 | 65 | 1 |
| `tools/oculus/DESIGN.md` | 52 | 55 | 0 |
| `tools/oculus/README.md` | 1 | 1 | 0 |
| `tools/oculus/config/text/app.yml` | 1 | read in full | 0 |
| `tools/oculus/config/layout.yml` | 1 | read in full | 0 |
| `.oculus/config/layout.yml` | 0 | read in full | 0 |

Scan pattern: `(, not |\bnot [^,.;]{1,40}, but\b|\bnot [^,.;]{1,30} but\b|rather than|instead of|\bmerely\b|\bsimply\b|\bjust\b|\bwhole point\b|\bno longer\b|\bstill\b|\bused to\b|\bpreviously\b|\bas before\b|\bD[0-9]{2}\b|\bZ[0-9]{3}\b)`. The scan is a locator. `sentences.py` numbers the sentences as `line.k`; a new sentence is one whose text is not in the base file, so a sentence kept word for word is not listed. I read every new sentence of the Apps guide, of DATA-MAP and of README.md, and the 52 changed lines of DESIGN.md (each replaces a guide path with a `HELP.md#anchor` or `docs/apps.md` pointer). Hits:

- `docs/DATA-MAP.md:304.1`: ...uster` and whose `host` is an ssh alias: letters, digits and `. _ @ -`, not starting with `-`....

Judgment of the hits. `tools/oculus/docs/apps.md:260.2` was a contrast ("only, not for `<img>` or `<script>`") and now reads "so an `<img>` or a `<script>` cannot load from them". `docs/DATA-MAP.md:304.1` lists the constraints of an ssh alias (letters, digits and `. _ @ -`, not starting with `-`), a rule and not a contrast; it stays. `tools/oculus/DESIGN.md:556.1` held "a fact of the list's scroll numbers rather than of a stylesheet" and now reads "a fact of the list's scroll numbers, which `src/lib/shell/rail/RailList.svelte` reads, and no stylesheet draws it". `tools/oculus/docs/apps.md:31` (the `glyph` row of the manifest table) reads "and the app is offered", and `tools/oculus/DESIGN.md:491` reads "and refers to HELP.md for oculus's settings"; neither carries a contrast or a history word now. The yaml files `config/text/app.yml` (the h1-h9 row) and `config/layout.yml` (the `help:` arrangement) each differ by one line and `.oculus/config/layout.yml` by eight removed lines (`diff`, `<` lines); I read them and they hold no such construction. Sentences that carry a pre-existing phrase of the page the step did not write (DATA-MAP:243 "the build is no longer run") are not new sentences and are listed in section 13.


## 8. Edits to existing assertions and the renamed test title

The test files that differ from the base (`diff -rq` of the base and the worktree, lines naming `tests/`):

```
Files BASE/tools/oculus/tests/checks/config/config-folder.test.ts and WT/tools/oculus/tests/checks/config/config-folder.test.ts differ
Files BASE/tools/oculus/tests/checks/source/history.test.ts and WT/tools/oculus/tests/checks/source/history.test.ts differ
```

Lines of those two diffs that hold an assertion (`grep -E "expect|assert|toBe|toEqual|toHaveLength|toMatch"` over each `diff`):

- `tests/checks/config/config-folder.test.ts`: 0 line(s).
- `tests/checks/source/history.test.ts`: 0 line(s).

So no assertion of any test is edited, and no test is added or removed. The edits to existing tests are comment lines and one test title.

`tests/checks/source/history.test.ts:155`: the title changed from `reads every line of a text file, every guide and every comment of code` to `reads every line of a text file, every document and every comment of code`. The change is to the title only; the body of the test is unchanged (the diff in section 6 shows no other line at or after 155). Run after the last change (`npx vitest run tests/checks/source/history.test.ts --reporter=verbose --testTimeout 300000`):

```
pass |unit| tests/checks/source/history.test.ts > no history in code > reads every line of a text file, every document and every comment of code 122ms
```


## 9. The cases: scripts whole, commands, outputs on the base and after the change

Every script below is a file under `$TMPDIR/d49r1/cases/` (the folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d49b/tmp/d49r1/cases`), given whole; each is run from there with the commands shown. `B` is the read-only base tree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base`, `W` the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49`, `D` is `tools/oculus` of the tree named. `runcases.sh` runs cases 3, 4, 5, 6, 8, 9, 10, 13 and the two extra checks on both trees in one go (its output is the file each case names); `c01_c02_c07.sh`, `c03b_plain.py`, `c03c_match.py`, `c03d_list.py`, `c05b_pointers.py` and the vitest runs are run by the commands shown. The base is read-only, so a command that needs a writable folder (vitest) was run on the unchanged worktree before the first edit; its saved output is quoted.

`runcases.sh`:

```sh
# Runs every case on the base tree ($B) and on the changed tree ($W), writing one output file per case and tree under $TMPDIR/d49r1/out/.
C=$TMPDIR/d49r1/cases
O=$TMPDIR/d49r1/out
for T in base after; do
    if [ $T = base ]; then R=$B; else R=$W; fi
    D=$R/tools/oculus
    python3 $C/c03_keys.py $B/tools/oculus $D/HELP.md > $O/c03.$T.txt 2>&1
    python3 $C/c04_bullets.py $D/HELP.md > $O/c04.$T.txt 2>&1
    python3 $C/c05_anchors.py $D > $O/c05.$T.txt 2>&1
    python3 $C/c06_docpaths.py $R > $O/c06.$T.txt 2>&1
    python3 $C/c08_fields.py $D $R/docs/DATA-MAP.md > $O/c08.$T.txt 2>&1
    python3 $C/c08_deck.py $D $R/docs/DATA-MAP.md > $O/c08deck.$T.txt 2>&1
    python3 $C/c09_vocab.py $D $R $R/docs/DATA-MAP.md > $O/c09.$T.txt 2>&1
    python3 $C/c10_apps.py $D > $O/c10.$T.txt 2>&1
    python3 $C/c13_views.py $D > $O/c13.$T.txt 2>&1
    python3 $C/keys_exist.py $D $D/HELP.md > $O/keys_exist.$T.txt 2>&1
    (cd $D && python3 $C/claims.py > $O/claims.$T.txt 2>&1)
done
```

### 9.1 Cases 1, 2 and 7: the folder listing and the two greps of the brief

The base outputs of cases 2 and 7 are long lists of matching lines; the count of lines and the first ten are quoted (lines cut at 170 columns). Both greps print nothing after the change and exit with status 1.

`c01_c02_c07.sh`:

```sh
# Cases 1, 2 and 7 of the brief, run from the root of the tree named by $1 (the base or the worktree).
cd "$1"
echo "== case 1: ls tools/oculus/docs"
ls tools/oculus/docs
echo "== case 2: guide-name grep"
grep -rnE "docs/(configuration|debugging|files-and-search|source-control|terminals|views|window)\.md|(Window|Views|Configuration|Debugging|Source Control|Terminals and commands|Files and search) guide|the guides\b|guide that holds" --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.scratch --exclude-dir=.svelte-kit --exclude-dir=build --exclude-dir=build-app tools/oculus .oculus docs
echo "grep exit $?"
echo "== case 7: DATA-MAP grep"
grep -nE "tools/oculus/src|tools/oculus/config|\.ts\b|\.svelte\b|Shape\b|ENTRY_CATEGORIES|\`[a-z]+[A-Z][A-Za-z]*\`|\`[A-Z][A-Z_]{3,}\`" docs/DATA-MAP.md
echo "grep exit $?"
```

Command:

```
sh c01_c02_c07.sh $B     # base
sh c01_c02_c07.sh $W     # after
```

On the base:

```
== case 1: ls tools/oculus/docs
apps.md
configuration.md
debugging.md
diagrams
files-and-search.md
source-control.md
terminals.md
views.md
window.md

case 2 output: 150 matching lines, first ten:
tools/oculus/config/layout.yml:93:    root: { kind: pane, view: [help, { view: doc, state: { id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: "Apps  [cut]
tools/oculus/tests/checks/config/config-folder.test.ts:3:// Settings view and the Configuration guide show, and that the glyphs, the icons and the catalogue
tools/oculus/tests/checks/source/history.test.ts:24:/** The folder holding the guides, each a document read whole as well. */
tools/oculus/docs/views.md:1:# Views guide
tools/oculus/docs/views.md:57:The Files view is the file browser over the hub, the engine config folder and the configured roots, with Open Editors, Outline, Timeline, Bo [cut]
tools/oculus/docs/views.md:61:The Repositories view is VS Code's Source Control over every repository oculus knows, with the commit box, the changes, the graph, stashes,  [cut]
tools/oculus/docs/views.md:89:The view `debug` is the debugger of rite, listed in the Explorer page's group after the TeX view. At the top the configuration picker lists  [cut]
tools/oculus/docs/views.md:157:The Sessions view lists every agent session on this machine, grouped by workspace, with the terminals oculus runs below them; the list and  [cut]
tools/oculus/docs/views.md:171:The Terminal view is a terminal panel of its own: each Terminal tab owns one or more terminals running Claude, Codex or a shell inside tmux [cut]
tools/oculus/docs/views.md:241:The Settings editor over the options catalog: a search box with a count (`@modified` keeps the options that differ from their default, `@id [cut]
...
grep exit 0

case 7 output: 105 matching lines, first ten:
37:| `deck/` | the portfolio deck: a `present.yml` and Markdown slide files, named by `portfolio_deck` in `.oculus/config/sources.yml`, the hub's layer (the general defau [cut]
58:The tier of a project is the last segment of the `dir` of its scan rule in `.oculus/config/sources.yml`, the hub's layer, whose `scan` replaces the general default of  [cut]
60:| Folder | Shape | Holds | View |
76:The folder names that occur, and the paths oculus looks for on every project (`PROJECT_DOCS` in `tools/oculus/src/lib/data/sources/docs.ts`). The standard layout is th [cut]
89:| `projects/<tier>/<id>/present/` | the project's deck: a `present.yml`, the Markdown slide files (the project's own slide is `main.md`, `kind: project`) and the figur [cut]
156:Each registry, collection and feed file lists its entries under `entries:`, except `registries/data.yml`, which lists them under `datasets:`. Every one of them opens  [cut]
180:| `project.yml` | the project itself | the file | folder name | folder name | `tools/oculus/config/schemas/manifest-schema.yml` | Projects, Coauthor, Archive, Project [cut]
181:| `side-projects/<name>/project.yml` | one side project | the file | folder name | none | `tools/oculus/config/schemas/side-project-schema.yml` | Personal |
182:| `<root>/.oculus/project.yml` | one side project kept in a repository named by a `roots:` entry | the file | the root's key | none | `tools/oculus/config/schemas/sid [cut]
190:- The views of the Academic Life page, Statements and Code are collection views, one per key of the `collections:` list in `.oculus/config/sources.yml`, the hub's lay [cut]
...
grep exit 0
```

After the change:

```
== case 1: ls tools/oculus/docs
apps.md
diagrams
== case 2: guide-name grep
grep exit 1
== case 7: DATA-MAP grep
grep exit 1
```

### 9.2 Case 3: every chord and function key of the guides

The base column is `c03_keys.py` against the unchanged HELP.md: the keys the guides name that HELP.md lacks.

`c03_keys.py`:

```python
"""Case 3: every key and chord written in the seven guides, diffed against HELP.md.
Usage: c03_keys.py <guides-root: dir holding docs/*.md of the BASE> <HELP.md to check>"""
import re, sys, glob, os
GUIDES = ['configuration','debugging','files-and-search','source-control','terminals','views','window']
MODS = r'(?:Cmd|Ctrl|Alt|Shift|Option|Opt)'
KEY = r'(?:F\d{1,2}|Enter|Escape|Esc|Tab|Delete|Backspace|Space|Home|End|PageUp|PageDown|Up|Down|Left|Right|Return|[A-Za-z0-9]|\[|\]|\.|,|/|\\|-)'
CHORD = re.compile(r'(?<![A-Za-z0-9])(?:' + MODS + r'[+-]){1,3}' + KEY + r'(?![A-Za-z0-9])')
FKEY = re.compile(r'(?<![A-Za-z0-9+\-])F(?:[1-9]|1[0-2])(?![0-9A-Za-z])')
def norm(tok):
    parts = re.split(r'[+-](?=.)', tok)
    if len(parts) == 1: return tok.lower()
    mods = sorted(p.lower().replace('option','alt').replace('opt','alt') for p in parts[:-1])
    return '+'.join(mods + [parts[-1].lower()])
def chords(text):
    found = set()
    for m in CHORD.finditer(text): found.add(norm(m.group(0)))
    for m in FKEY.finditer(text): found.add(norm(m.group(0)))
    return found
base = sys.argv[1]
help_text = open(sys.argv[2]).read()
have = chords(help_text)
total = 0; missing = {}
for g in GUIDES:
    text = open(os.path.join(base, 'docs', g + '.md')).read()
    c = chords(text)
    total += len(c)
    for k in sorted(c):
        if k not in have: missing.setdefault(k, []).append(g)
print('chords and function keys in the seven guides:', len(set().union(*[chords(open(os.path.join(base,'docs',g+'.md')).read()) for g in GUIDES])))
print('missing from', sys.argv[2], ':', len(missing))
for k, v in sorted(missing.items()): print('  ', k, '<-', ','.join(v))
```

`c03d_list.py`:

```python
"""Case 3d: every chord and function key of the seven guides with the first guide line that names it and the HELP.md lines that name it.
Usage: c03d_list.py <BASE tools/oculus> <HELP.md>"""
import re, sys, os
sys.argv_saved = sys.argv
base, hp = sys.argv[1], sys.argv[2]
sys.argv = ['x', base, hp]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'c03_keys.py')).read().split('base = sys.argv[1]')[0]
exec(src)
help_lines = open(hp).read().split('\n')
where = {}
for g in GUIDES:
    for i, l in enumerate(open(os.path.join(base, 'docs', g + '.md')).read().split('\n'), 1):
        for k in chords(l): where.setdefault(k, f'{g}:{i}')
for k in sorted(where):
    hl = [str(j) for j, h in enumerate(help_lines, 1) if k in chords(h)]
    print(f'{k}\t{where[k]}\tHELP {",".join(hl[:6])}{" (+%d)" % (len(hl)-6) if len(hl) > 6 else ""}' + ('' if hl else ' NONE'))
```

Command:

```
python3 c03_keys.py $B/tools/oculus $D/HELP.md          # D of the tree named
python3 c03d_list.py $B/tools/oculus $W/tools/oculus/HELP.md     # after: the key, its first guide line, the HELP.md lines
```

On the base:

```
chords and function keys in the seven guides: 78
missing from /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md : 23
   alt+cmd+enter <- files-and-search
   alt+cmd+shift+c <- files-and-search
   alt+o <- files-and-search
   alt+shift+f <- views
   alt+shift+f12 <- files-and-search,views
   alt+shift+o <- files-and-search
   alt+z <- files-and-search,window
   cmd+. <- files-and-search
   cmd+backspace <- files-and-search
   cmd+c <- files-and-search
   cmd+down <- files-and-search
   cmd+shift+1 <- files-and-search
   cmd+shift+z <- files-and-search
   cmd+v <- files-and-search
   cmd+x <- files-and-search
   cmd+z <- files-and-search
   ctrl+k <- window
   f12 <- files-and-search
   f4 <- views
   shift+f12 <- files-and-search
   shift+f4 <- views
   shift+space <- views
   shift+tab <- window
```

After the change:

```
chords and function keys in the seven guides: 78
missing from /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/HELP.md : 0

c03d_list.py, after the change (key, first guide line naming it, HELP.md lines naming it):
alt+cmd+[	views:285	HELP 123
alt+cmd+b	views:277	HELP 119
alt+cmd+c	files-and-search:31	HELP 119,282
alt+cmd+enter	files-and-search:150	HELP 152,331
alt+cmd+m	views:81	HELP 122,258
alt+cmd+shift+c	files-and-search:31	HELP 282
alt+cmd+t	terminals:69	HELP 118,359
alt+cmd+x	views:77	HELP 122
alt+ctrl+t	terminals:69	HELP 118,359
alt+down	configuration:27	HELP 112,245,280
alt+enter	views:285	HELP 124
alt+f5	source-control:19	HELP 143,401,412
alt+o	files-and-search:87	HELP 140
alt+shift+f	views:285	HELP 140
alt+shift+f12	files-and-search:87	HELP 138,259,317
alt+shift+f5	source-control:19	HELP 143,401,412
alt+shift+h	files-and-search:87	HELP 139,259
alt+shift+o	files-and-search:87	HELP 140
alt+up	configuration:27	HELP 112,245,280
alt+z	files-and-search:81	HELP 116,301,302
cmd+,	window:7	HELP 97
cmd+.	files-and-search:115	HELP 140,324
cmd+a	files-and-search:31	HELP 100,151,396
cmd+backspace	files-and-search:31	HELP 152,282,331
cmd+c	files-and-search:31	HELP 282
cmd+down	files-and-search:31	HELP 282
cmd+enter	files-and-search:31	HELP 126,136,150,151,282,396 (+1)
cmd+f	terminals:37	HELP 148,149,346
cmd+k	window:68	HELP 42,64,65,131
cmd+l	configuration:17	HELP 125,126
cmd+n	window:7	HELP 97
cmd+p	files-and-search:146	HELP 66,133
cmd+r	window:7	HELP 97
cmd+s	debugging:11	HELP 115,296,298
cmd+shift+1	files-and-search:150	HELP 152,331
cmd+shift+b	terminals:69	HELP 118,359
cmd+shift+f	files-and-search:150	HELP 107,328
cmd+shift+f5	debugging:55	HELP 145,363,383
cmd+shift+h	files-and-search:150	HELP 107,331
cmd+shift+m	views:85	HELP 117
cmd+shift+n	window:7	HELP 97
cmd+shift+p	window:90	HELP 68,134
cmd+shift+w	window:7	HELP 97
cmd+shift+z	files-and-search:31	HELP 292
cmd+t	files-and-search:87	HELP 68,135
cmd+v	files-and-search:31	HELP 282
cmd+w	window:7	HELP 96,126
cmd+x	files-and-search:31	HELP 282
cmd+z	files-and-search:31	HELP 292,300
ctrl+enter	source-control:15	HELP 150,399
ctrl+f	terminals:37	HELP 148,346
ctrl+k	window:88	HELP 64,131
ctrl+p	window:90	HELP 133,134
ctrl+s	files-and-search:65	HELP 115
ctrl+shift+b	terminals:69	HELP 118,359
ctrl+shift+f5	debugging:55	HELP 145
ctrl+shift+m	configuration:17	HELP 117,127
ctrl+shift+p	window:90	HELP 134
ctrl+shift+tab	window:7	HELP 95
ctrl+tab	window:7	HELP 95
f1	window:90	HELP 68,134
f10	debugging:47	HELP 147,363
f11	debugging:47	HELP 147,363
f12	files-and-search:87	HELP 137,317
f2	files-and-search:31	HELP 136,282,315,317
f4	views:69	HELP 139
f5	debugging:7	HELP 144,363,364,383
f8	files-and-search:87	HELP 117,257
f9	debugging:41	HELP 146,363
shift+enter	terminals:25	HELP 42,148,149,155,344
shift+f10	terminals:33	HELP 22,24,35,128,346
shift+f11	debugging:47	HELP 147,363
shift+f12	files-and-search:87	HELP 138
shift+f4	views:69	HELP 139
shift+f5	debugging:55	HELP 145,363
shift+f8	files-and-search:87	HELP 117,257
shift+space	views:123	HELP 157,237
shift+tab	window:80	HELP 50,98
```

### 9.3 Case 3b and 3c: every plain key of the guides

`c03b_plain.py` prints, for each guide line that names a plain key, the number of HELP.md lines that name the same key; `NONE` would mean no line. The base column is the unchanged HELP.md, so its many `NONE` rows are the keys the base HELP.md lacks. `c03c_match.py` is a locator of the HELP.md line sharing the key and the most words with a guide sentence; section 1.2 states the rows I read by hand.

`c03b_plain.py`:

```python
"""Case 3b: every plain key (Enter, Escape, Tab, Delete, Backspace, Space, arrows, Home, End, PageUp, PageDown, Return) named in a guide, per guide line, with the HELP.md lines that name the same key.
Usage: c03b_plain.py <BASE tools/oculus> <HELP.md>"""
import re, sys, os
GUIDES = ['configuration','debugging','files-and-search','source-control','terminals','views','window']
PLAIN = r'(?<![A-Za-z0-9`-])(Enter|Escape|Esc|Tab|Delete|Backspace|Space|Home|End|PageUp|PageDown|Return|Up|Down|Left|Right|Up arrow|Down arrow|Left arrow|Right arrow|arrow keys?|[Dd]ouble-click|[Cc]lick|drag|Drag)(?![A-Za-z0-9])'
KEYS = re.compile(r'(?<![A-Za-z0-9`-])(Enter|Escape|Esc|Tab|Delete|Backspace|Space|Home|End|PageUp|PageDown|Return|arrow keys?|Up|Down|Left|Right)(?![A-Za-z0-9])')
base, hp = sys.argv[1], sys.argv[2]
help_lines = open(hp).read().split('\n')
n = 0
for g in GUIDES:
    for i, l in enumerate(open(os.path.join(base, 'docs', g + '.md')).read().split('\n'), 1):
        ks = sorted(set(m.group(1) for m in KEYS.finditer(l)))
        for k in ks:
            n += 1
            hl = [j for j, h in enumerate(help_lines, 1) if re.search(r'(?<![A-Za-z0-9`-])' + re.escape(k) + r'(?![A-Za-z0-9])', h)]
            print(f'{g}:{i}\t{k}\tHELP lines: {len(hl)}' + (' NONE' if not hl else ''))
print('guide-line/key pairs:', n)
```

`c03c_match.py`:

```python
"""Case 3c: for each sentence of a base guide that names a plain key, the HELP.md line sharing the key and the most words of that sentence.
Usage: c03c_match.py <BASE tools/oculus> <HELP.md> <guide>"""
import re, sys, os, subprocess
base, hp, g = sys.argv[1:4]
KEYS = re.compile(r'(?<![A-Za-z0-9`-])(Enter|Escape|Esc|Tab|Delete|Backspace|Space|Home|End|PageUp|PageDown|Return|arrow keys?|Up|Down|Left|Right)(?![A-Za-z0-9])')
H = open(hp).read().split('\n')
def words(s): return set(w.lower() for w in re.findall(r'[A-Za-z]{5,}', s))
out = subprocess.run(['python3', os.path.join(os.path.dirname(__file__), '..', 'sentences.py'), os.path.join(base, 'docs', g + '.md')], capture_output=True, text=True).stdout
for row in out.split('\n'):
    if '\t' not in row: continue
    ref, s = row.split('\t', 1)
    ks = sorted(set(m.group(1) for m in KEYS.finditer(s)))
    if not ks: continue
    ws = words(s)
    best = []
    for j, h in enumerate(H, 1):
        if all(re.search(r'(?<![A-Za-z0-9`-])' + re.escape(k) + r'(?![A-Za-z0-9])', h) for k in ks):
            best.append((len(ws & words(h)), j))
    best.sort(reverse=True)
    print(f'{g}:{ref}\t{",".join(ks)}\tHELP {best[0][1] if best else "NONE"} (shared {best[0][0] if best else 0})\t{s[:170]}')
```

`sentences.py`:

```python
"""Splits a Markdown guide into numbered sentences: prints 'line.n<TAB>sentence' for each prose line (tables rows are split by cell)."""
import re, sys
path = sys.argv[1]
SPLIT = re.compile(r'(?<=[.!?;:])\s+(?=[A-Z`"(\[$<*0-9])')
def sentences(t):
    # keep code spans whole
    parts = re.split(r'(`[^`]*`)', t)
    masked = ''.join(p if i % 2 == 0 else p.replace('. ', '.\x00').replace('; ', ';\x00').replace(': ', ':\x00') for i, p in enumerate(parts))
    out = SPLIT.split(masked)
    return [s.replace('\x00', ' ') for s in out if s.strip()]
for n, line in enumerate(open(path).read().split('\n'), 1):
    if not line.strip() or line.startswith('#'): 
        if line.startswith('#'): print(f'{n}\t## {line.lstrip("# ")}')
        continue
    if line.startswith('|'):
        print(f'{n}.t\t{line}')
        continue
    for k, s in enumerate(sentences(line), 1):
        print(f'{n}.{k}\t{s}')
```

Command:

```
python3 c03b_plain.py $B/tools/oculus $D/HELP.md
for g in configuration debugging files-and-search source-control terminals views window; do python3 c03c_match.py $B/tools/oculus $W/tools/oculus/HELP.md $g; done
```

On the base:

```
configuration:27	Down	HELP lines: 1
configuration:27	Up	HELP lines: 1
debugging:59	Down	HELP lines: 1
debugging:59	Enter	HELP lines: 9
debugging:59	Tab	HELP lines: 1
debugging:59	Up	HELP lines: 1
debugging:86	Enter	HELP lines: 9
files-and-search:11	Down	HELP lines: 1
files-and-search:11	Escape	HELP lines: 2
files-and-search:11	Up	HELP lines: 1
files-and-search:21	Enter	HELP lines: 9
files-and-search:25	Down	HELP lines: 1
files-and-search:25	Up	HELP lines: 1
files-and-search:31	Backspace	HELP lines: 0 NONE
files-and-search:31	Down	HELP lines: 1
files-and-search:31	Enter	HELP lines: 9
files-and-search:31	Escape	HELP lines: 2
files-and-search:31	Left	HELP lines: 0 NONE
files-and-search:31	Right	HELP lines: 0 NONE
files-and-search:31	Space	HELP lines: 0 NONE
files-and-search:31	Tab	HELP lines: 1
files-and-search:31	arrow keys	HELP lines: 0 NONE
files-and-search:43	Delete	HELP lines: 1
files-and-search:43	Tab	HELP lines: 1
files-and-search:47	Delete	HELP lines: 1
files-and-search:47	Enter	HELP lines: 9
files-and-search:47	Escape	HELP lines: 2
files-and-search:51	Delete	HELP lines: 1
files-and-search:61	Enter	HELP lines: 9
files-and-search:81	Enter	HELP lines: 9
files-and-search:87	Enter	HELP lines: 9
files-and-search:95	Enter	HELP lines: 9
files-and-search:97	Enter	HELP lines: 9
files-and-search:142	Enter	HELP lines: 9
files-and-search:150	Backspace	HELP lines: 0 NONE
files-and-search:150	Delete	HELP lines: 1
files-and-search:150	Down	HELP lines: 1
files-and-search:150	Enter	HELP lines: 9
files-and-search:150	Up	HELP lines: 1
source-control:7	Delete	HELP lines: 1
source-control:7	Enter	HELP lines: 9
source-control:7	Tab	HELP lines: 1
source-control:7	arrow keys	HELP lines: 0 NONE
source-control:15	Enter	HELP lines: 9
source-control:35	Delete	HELP lines: 1
source-control:39	Delete	HELP lines: 1
source-control:43	Delete	HELP lines: 1
source-control:65	Enter	HELP lines: 9
terminals:25	Backspace	HELP lines: 0 NONE
terminals:25	Delete	HELP lines: 1
terminals:25	Enter	HELP lines: 9
terminals:25	arrow keys	HELP lines: 0 NONE
terminals:37	Escape	HELP lines: 2
terminals:41	arrow keys	HELP lines: 0 NONE
terminals:53	Delete	HELP lines: 1
views:57	Down	HELP lines: 1
views:57	Up	HELP lines: 1
views:61	Enter	HELP lines: 9
views:73	Enter	HELP lines: 9
views:77	Tab	HELP lines: 1
views:85	Enter	HELP lines: 9
views:93	Down	HELP lines: 1
views:93	Enter	HELP lines: 9
views:93	Tab	HELP lines: 1
views:93	Up	HELP lines: 1
views:123	Esc	HELP lines: 1
views:123	Space	HELP lines: 0 NONE
views:125	End	HELP lines: 2
views:125	Esc	HELP lines: 1
views:125	Home	HELP lines: 2
views:125	PageDown	HELP lines: 0 NONE
views:125	PageUp	HELP lines: 0 NONE
views:125	Space	HELP lines: 0 NONE
views:129	Delete	HELP lines: 1
views:161	Down	HELP lines: 1
views:161	Up	HELP lines: 1
views:211	Enter	HELP lines: 9
views:241	Escape	HELP lines: 2
views:259	Enter	HELP lines: 9
views:281	Return	HELP lines: 0 NONE
views:281	Tab	HELP lines: 1
views:285	Enter	HELP lines: 9
window:7	Tab	HELP lines: 1
window:9	Down	HELP lines: 1
window:29	Delete	HELP lines: 1
window:55	Down	HELP lines: 1
window:55	Left	HELP lines: 0 NONE
window:55	Return	HELP lines: 0 NONE
window:55	Right	HELP lines: 0 NONE
window:55	Up	HELP lines: 1
window:64	Left	HELP lines: 0 NONE
window:64	Return	HELP lines: 0 NONE
window:64	Right	HELP lines: 0 NONE
window:64	arrow keys	HELP lines: 0 NONE
window:67	End	HELP lines: 2
window:67	Enter	HELP lines: 9
window:67	Escape	HELP lines: 2
window:67	Home	HELP lines: 2
window:67	arrow keys	HELP lines: 0 NONE
window:68	Down	HELP lines: 1
window:68	Left	HELP lines: 0 NONE
window:68	Right	HELP lines: 0 NONE
window:68	Tab	HELP lines: 1
window:68	Up	HELP lines: 1
window:71	Delete	HELP lines: 1
window:71	Enter	HELP lines: 9
window:71	Right	HELP lines: 0 NONE
window:73	Right	HELP lines: 0 NONE
window:73	Tab	HELP lines: 1
window:80	Delete	HELP lines: 1
window:80	Escape	HELP lines: 2
window:80	Tab	HELP lines: 1
window:80	arrow keys	HELP lines: 0 NONE
window:82	Tab	HELP lines: 1
window:88	Delete	HELP lines: 1
window:88	End	HELP lines: 2
window:88	Enter	HELP lines: 9
window:88	Home	HELP lines: 2
window:88	arrow keys	HELP lines: 0 NONE
window:90	Enter	HELP lines: 9
window:90	arrow keys	HELP lines: 0 NONE
window:94	Escape	HELP lines: 2
guide-line/key pairs: 122
```

After the change:

```
configuration:27	Down	HELP lines: 8
configuration:27	Up	HELP lines: 7
debugging:59	Down	HELP lines: 8
debugging:59	Enter	HELP lines: 33
debugging:59	Tab	HELP lines: 9
debugging:59	Up	HELP lines: 7
debugging:86	Enter	HELP lines: 33
files-and-search:11	Down	HELP lines: 8
files-and-search:11	Escape	HELP lines: 9
files-and-search:11	Up	HELP lines: 7
files-and-search:21	Enter	HELP lines: 33
files-and-search:25	Down	HELP lines: 8
files-and-search:25	Up	HELP lines: 7
files-and-search:31	Backspace	HELP lines: 5
files-and-search:31	Down	HELP lines: 8
files-and-search:31	Enter	HELP lines: 33
files-and-search:31	Escape	HELP lines: 9
files-and-search:31	Left	HELP lines: 2
files-and-search:31	Right	HELP lines: 4
files-and-search:31	Space	HELP lines: 3
files-and-search:31	Tab	HELP lines: 9
files-and-search:31	arrow keys	HELP lines: 8
files-and-search:43	Delete	HELP lines: 16
files-and-search:43	Tab	HELP lines: 9
files-and-search:47	Delete	HELP lines: 16
files-and-search:47	Enter	HELP lines: 33
files-and-search:47	Escape	HELP lines: 9
files-and-search:51	Delete	HELP lines: 16
files-and-search:61	Enter	HELP lines: 33
files-and-search:81	Enter	HELP lines: 33
files-and-search:87	Enter	HELP lines: 33
files-and-search:95	Enter	HELP lines: 33
files-and-search:97	Enter	HELP lines: 33
files-and-search:142	Enter	HELP lines: 33
files-and-search:150	Backspace	HELP lines: 5
files-and-search:150	Delete	HELP lines: 16
files-and-search:150	Down	HELP lines: 8
files-and-search:150	Enter	HELP lines: 33
files-and-search:150	Up	HELP lines: 7
source-control:7	Delete	HELP lines: 16
source-control:7	Enter	HELP lines: 33
source-control:7	Tab	HELP lines: 9
source-control:7	arrow keys	HELP lines: 8
source-control:15	Enter	HELP lines: 33
source-control:35	Delete	HELP lines: 16
source-control:39	Delete	HELP lines: 16
source-control:43	Delete	HELP lines: 16
source-control:65	Enter	HELP lines: 33
terminals:25	Backspace	HELP lines: 5
terminals:25	Delete	HELP lines: 16
terminals:25	Enter	HELP lines: 33
terminals:25	arrow keys	HELP lines: 8
terminals:37	Escape	HELP lines: 9
terminals:41	arrow keys	HELP lines: 8
terminals:53	Delete	HELP lines: 16
views:57	Down	HELP lines: 8
views:57	Up	HELP lines: 7
views:61	Enter	HELP lines: 33
views:73	Enter	HELP lines: 33
views:77	Tab	HELP lines: 9
views:85	Enter	HELP lines: 33
views:93	Down	HELP lines: 8
views:93	Enter	HELP lines: 33
views:93	Tab	HELP lines: 9
views:93	Up	HELP lines: 7
views:123	Esc	HELP lines: 5
views:123	Space	HELP lines: 3
views:125	End	HELP lines: 8
views:125	Esc	HELP lines: 5
views:125	Home	HELP lines: 7
views:125	PageDown	HELP lines: 1
views:125	PageUp	HELP lines: 1
views:125	Space	HELP lines: 3
views:129	Delete	HELP lines: 16
views:161	Down	HELP lines: 8
views:161	Up	HELP lines: 7
views:211	Enter	HELP lines: 33
views:241	Escape	HELP lines: 9
views:259	Enter	HELP lines: 33
views:281	Return	HELP lines: 1
views:281	Tab	HELP lines: 9
views:285	Enter	HELP lines: 33
window:7	Tab	HELP lines: 9
window:9	Down	HELP lines: 8
window:29	Delete	HELP lines: 16
window:55	Down	HELP lines: 8
window:55	Left	HELP lines: 2
window:55	Return	HELP lines: 1
window:55	Right	HELP lines: 4
window:55	Up	HELP lines: 7
window:64	Left	HELP lines: 2
window:64	Return	HELP lines: 1
window:64	Right	HELP lines: 4
window:64	arrow keys	HELP lines: 8
window:67	End	HELP lines: 8
window:67	Enter	HELP lines: 33
window:67	Escape	HELP lines: 9
window:67	Home	HELP lines: 7
window:67	arrow keys	HELP lines: 8
window:68	Down	HELP lines: 8
window:68	Left	HELP lines: 2
window:68	Right	HELP lines: 4
window:68	Tab	HELP lines: 9
window:68	Up	HELP lines: 7
window:71	Delete	HELP lines: 16
window:71	Enter	HELP lines: 33
window:71	Right	HELP lines: 4
window:73	Right	HELP lines: 4
window:73	Tab	HELP lines: 9
window:80	Delete	HELP lines: 16
window:80	Escape	HELP lines: 9
window:80	Tab	HELP lines: 9
window:80	arrow keys	HELP lines: 8
window:82	Tab	HELP lines: 9
window:88	Delete	HELP lines: 16
window:88	End	HELP lines: 8
window:88	Enter	HELP lines: 33
window:88	Home	HELP lines: 7
window:88	arrow keys	HELP lines: 8
window:90	Enter	HELP lines: 33
window:90	arrow keys	HELP lines: 8
window:94	Escape	HELP lines: 9
guide-line/key pairs: 122

c03c_match.py over the seven guides, after the change:
configuration:27.t	Down,Up	HELP 245 (shared 7)	| `sources.yml` | What the portfolio reads: the scan paths, the registry and collection files, the feeds, and the hub folde [cut]
debugging:59.5	Enter	HELP 399 (shared 2)	Enter sends what is typed.
debugging:59.6	Down,Tab,Up	HELP 154 (shared 8)	The earlier inputs that start with the typed text are listed under the box, Tab or a press takes one into it without sendin [cut]
debugging:86.t	Enter	HELP 382 (shared 4)	| `debug.console.acceptSuggestionOnEnter` | Off: Enter sends the text typed. |
files-and-search:11.5	Down,Up	HELP 280 (shared 12)	Under the header every root is a top-level folder row, a root other than the hub and the engine's `config/` folder is d [cut]
files-and-search:11.11	Escape	HELP 282 (shared 2)	Escape in the view closes it.
files-and-search:21.5	Enter	HELP 288 (shared 7)	The commits are read fifty at a time, in git's order from HEAD, so a commit that reached the file through a merge is liste [cut]
files-and-search:25.2	Down,Up	HELP 280 (shared 8)	Every section head of the view, and every row of the Bookmarks and Notes lists, is dragged over another of its own list  [cut]
files-and-search:31.1	Left,Right,Tab,arrow keys	HELP 282 (shared 7)	The tree is one Tab stop: the arrow keys move the selection, Right and Left open and close a folder, a [cut]
files-and-search:31.3	Backspace,Down,Enter,Escape,Space	HELP 282 (shared 23)	On a focused row Enter and F2 rename it, Cmd+Down opens a file as the pane's preview tab and  [cut]
files-and-search:31.4	Enter	HELP 283 (shared 5)	Enter on a root, on the workspace header or with two rows selected does nothing;
files-and-search:31.5	Enter	HELP 283 (shared 7)	Enter on a row of Open Editors, Outline, Timeline, Bookmarks or Notes opens it.
files-and-search:43.1	Delete,Tab	HELP NONE (shared 0)	A right-click on a file offers Open to the Side, Open in New Tab and Open in New Window on a PDF (the PDF in oculus' [cut]
files-and-search:43.3	Delete	HELP 238 (shared 5)	(the writing rules' fixes for the files under it, listed to tick; see Linters), Cut, Copy, Paste (greyed until something  [cut]
files-and-search:47.2	Enter,Escape	HELP 282 (shared 8)	Enter or leaving the box accepts a valid name, Escape cancels, and an empty or unchanged name cancels; a name with  [cut]
files-and-search:47.3	Delete	HELP 290 (shared 10)	Delete asks first, naming the rows when several are selected, and moves them to the macOS Trash, where they can be resto [cut]
files-and-search:51.2	Delete	HELP 408 (shared 5)	An undo of a delete asks first ("Would you like to undo 'Delete'?") and writes back each file whose content was kept, a f [cut]
files-and-search:61.6	Enter	HELP 153 (shared 7)	A press on a row of the Problems view opens its file the same way, in the preview tab with the range selected and the keyb [cut]
files-and-search:81.15	Enter	HELP 306 (shared 6)	Every other editor setting stays at Monaco's default, except that a file a language server serves draws semantic colours, [cut]
files-and-search:87.10	Enter	HELP 136 (shared 10)	Rename Symbol (F2 or the editor menu) renames through the server, and Cmd+Enter in the rename box, in place of Enter, sh [cut]
files-and-search:87.15	Enter	HELP 399 (shared 4)	An edit that is the rename of a hub key, or a rename accepted with Cmd+Enter, is shown as a Refactor Preview first and wr [cut]
files-and-search:95.2	Enter	HELP 136 (shared 5)	Enter in the box shows the edit as a Refactor Preview, since the rename of a hub key asks to be confirmed;
files-and-search:95.3	Enter	HELP 136 (shared 3)	Cmd+Enter does the same for the rename of any symbol.
files-and-search:97.6	Enter	HELP 282 (shared 4)	The rename makes every check again, since a file can change between the box opening and Enter.
files-and-search:142.2	Enter	HELP 328 (shared 6)	Enter in the box and the Search control are the two ways a run starts, and `/` puts the cursor back in the box from anywh [cut]
files-and-search:150.3	Down,Up	HELP 331 (shared 8)	Whether the row is shown, the replace text and Preserve Case are kept with the tab, and so are the last twenty texts ea [cut]
files-and-search:150.4	Enter	HELP 331 (shared 5)	Enter in the replace box runs the search as Enter in the query box does, and Cmd+Alt+Enter in either box is Replace All.
files-and-search:150.9	Backspace,Delete	HELP 331 (shared 11)	Every hit and every file offers Dismiss, with Delete (Cmd+Backspace on macOS) on the focused row, which takes [cut]
source-control:7.5	Enter	HELP 396 (shared 10)	The rows of a repository are selected by press, Cmd+press, Shift+press, Shift with an arrow and Cmd+A, Stage, Unstage and Di [cut]
source-control:7.12	Delete	HELP 408 (shared 16)	Open File (HEAD) opens the version HEAD holds, for a Staged row and a Changes row alike, read-only in a source tab named ` [cut]
source-control:7.15	Tab,arrow keys	HELP 396 (shared 4)	The list and the sections are one Tab stop each, moved along with the arrow keys.
source-control:15.8	Enter	HELP 399 (shared 4)	Ctrl+Enter or Cmd+Enter in the field commits as the button does.
source-control:35.5	Delete	HELP 406 (shared 9)	The Tags section lists the tags, an annotated one with its message; pressing one opens its commit in the Graph, Delete Tag  [cut]
source-control:39.5	Delete	HELP 408 (shared 6)	The checked-out branch's pill has a right-click menu of its own, with Checkout and Delete Branch both unavailable and their [cut]
source-control:39.10	Delete	HELP 408 (shared 11)	Open Changes, Copy Commit ID, Copy Commit Message, Checkout and Delete Tag lists, Checkout (Detached), Create Branch...,  [cut]
source-control:43.10	Delete	HELP 408 (shared 5)	Delete Branch, on a local branch name that is not checked out and on each branch row of the Branches section, asks first a [cut]
source-control:43.11	Delete	HELP 408 (shared 2)	Delete anyway?", follows, and its yes runs `git branch -D`.
source-control:43.13	Delete	HELP 408 (shared 6)	The commit's Checkout list leaves out the checked-out branch, whose pill has a menu of its own with Checkout and Delete Br [cut]
source-control:65.1	Enter	HELP 414 (shared 3)	Each worktree row is named by the last name of its folder, with the whole path as its tooltip, and the field that names a ne [cut]
terminals:25.1	Enter,arrow keys	HELP 344 (shared 12)	From two terminals on, a list on the right names each terminal of this tab by the title you gave it, else after what  [cut]
terminals:25.2	Enter	HELP 344 (shared 5)	Shift+Enter on the row, or the header's Split) and Kill (press twice;
terminals:25.3	Backspace,Delete	HELP 344 (shared 5)	Delete or Backspace on the row, twice), and double-click a row's name to rename it.
terminals:37.1	Escape	HELP 148 (shared 6)	Cmd+F (Ctrl+F off macOS) in the grid opens the find bar over its top right, as VS Code's terminal find: the text, Match Case, Ma [cut]
terminals:37.5	Escape	HELP 282 (shared 4)	What you type, click, scroll or paste reaches the program as the bytes the grid sends, so a click, a scroll or a focus change ar [cut]
terminals:41.1	arrow keys	HELP 346 (shared 23)	A terminal opened again, or shown again after the server restarted, shows its screen with the cursor where the program left [cut]
terminals:53.4	Delete	HELP 354 (shared 9)	A right-click on a button opens Edit, Schedule... and Delete for a saved command (Schedule... opens the update tray's schedule d [cut]
views:57.1	Down,Up	HELP 280 (shared 8)	The Files view is the file browser over the hub, the engine config folder and the configured roots, with Open Editors, Outline, Tim [cut]
views:61.1	Enter	HELP 396 (shared 8)	The Repositories view is VS Code's Source Control over every repository oculus knows, with the commit box, the changes, the graph, st [cut]
views:73.2	Enter	HELP 414 (shared 4)	It opens when a rename of a hub key is made in a YAML file (Enter in the rename box) or any rename is accepted with Cmd+Enter, and wh [cut]
views:77.6	Tab	HELP 269 (shared 3)	View LaTeX PDF with Open in New Tab, Open in New Window, Open in Browser, Open in Program and Refresh Viewers;
views:85.8	Enter	HELP 153 (shared 6)	Enter, a second press or a double press keeps the tab and moves the caret to the range.
views:93.5	Down,Enter,Tab,Up	HELP 154 (shared 8)	Enter sends the text, the earlier inputs that start with the typed text are listed under the box, Tab or a press takes on [cut]
views:123.1	Esc,Space	HELP 237 (shared 13)	The Present control in the toolbar and `F` put the slide on the whole monitor, in a browser tab and in the desktop app, with no [cut]
views:125.2	End	HELP 237 (shared 3)	The pane then shows the current slide large, the next slide smaller beside it (or "End of the deck." after the last), the current slid [cut]
views:125.5	End,Home,PageDown,PageUp,Space	HELP 157 (shared 11)	The two windows keep one slide: the arrows, Space (Shift+Space goes back), PageUp, PageDown, Home and End  [cut]
views:125.9	End,Esc	HELP 237 (shared 8)	The End control, Esc (after the grid and, in full screen, after leaving it), closing the audience window, switching the deck in th [cut]
views:129.1	Delete	HELP 238 (shared 8)	A right-click on the slide, or on its tile in the overview, offers Edit Slide, New Slide, Duplicate Slide and Delete Slide, and the [cut]
views:129.5	Delete	HELP 238 (shared 3)	Delete Slide asks first.
views:129.8	Delete	HELP 238 (shared 4)	A slide of a member deck belongs to that deck, so it offers Edit Slide and New Slide, and no Duplicate or Delete.
views:161.6	Down,Up	HELP 382 (shared 5)	The heads are dragged among each other and moved with Alt+Up and Alt+Down, as the sections under the Files tree are; the tab keeps [cut]
views:211.3	Enter	HELP 250 (shared 5)	A finding that is about a file names it as a place that opens the file (a finding about a folder or a missing file has no such place [cut]
views:241.1	Escape	HELP 251 (shared 14)	The Settings editor over the options catalog: a search box with a count (`@modified` keeps the options that differ from their defa [cut]
views:259.3	Enter	HELP 136 (shared 9)	`project` (one project as its own tab, with a LaTeX panel over its manuscript, whose card leaves out the document row, the tab listi [cut]
views:281.3	Return	HELP 38 (shared 2)	A PDF opens where it was last read: a tab keeps its own place across a reload, a window and Return to Page, and a tab opened for a f [cut]
views:281.7	Tab	HELP 269 (shared 4)	Open in New Tab, Open in New Window (a window of the app, or in a browser a browser tab at `/?float=<id>` that draws the PDF alone), O [cut]
views:285.5	Enter	HELP 272 (shared 7)	Enter in an `itemize`, `enumerate` or `description` starts a new `\item `, Alt+Enter a plain line, and the Cmd+L and Ctrl+Shift+M ch [cut]
window:7.3	Tab	HELP 50 (shared 5)	It adds what a browser tab cannot give the page: windows that remember where they were, a floating pane that becomes a window of its own [cut]
window:9.1	Down	HELP 382 (shared 0)	Down the left is the rail, and along the bottom is the status bar.
window:29.14	Delete	HELP 344 (shared 5)	Pause and Resume, Run now and Delete act on the entry, and a Run now that starts a terminal shows it as a task press does.
window:29.21	Delete	HELP 78 (shared 8)	A save, Delete, Pause or Resume the tray cannot make is refused with its sentence, and nothing is written:
window:55.10	Down,Left,Return,Right,Up	HELP NONE (shared 0)	A pane split off while the page is used closes with its last tab: one made by opening a view with no pane to l [cut]
window:64.5	arrow keys	HELP 38 (shared 6)	A docked float is a strip along that edge with a handle on its inner edge that sets its size, by drag or by the arrow keys.
window:64.6	Left,Return,Right	HELP 38 (shared 10)	Its menus offer Dock Left, Dock Right and Dock Bottom (not for the edge it is on), Float on a docked float, which floats [cut]
window:67.2	Enter,Escape	HELP 46 (shared 6)	ArrowRight or Enter on one of them opens its list, and ArrowLeft or Escape in that list goes back to the choice;
window:67.3	Escape	HELP 282 (shared 2)	Escape in the menu closes it.
window:67.4	End,Home,arrow keys	HELP 46 (shared 6)	In any menu the arrow keys, Home and End move through the choices, and typing the start of a choice's name goes to it.
window:68.1	Right	HELP 44 (shared 6)	- **Right-click menus.** A right-click on the empty part of a pane's tab strip, or anywhere in an empty pane, offers Open File...
window:68.2	Down,Left,Right,Tab,Up	HELP NONE (shared 0)	(the palette, as Cmd-K opens it), New Text File (an untitled text opened in a source tab of that pane; its first S [cut]
window:68.4	Right	HELP 44 (shared 10)	Close, Close Others, Close to the Right, Close Saved and Close All (each asks first when a tab it closes holds unsaved text or a run [cut]
window:68.6	Right	HELP 44 (shared 3)	Split Right with a Split & Move submenu, and, in the app, Move into New Window and Copy into New Window (a Terminal tab and the tab o [cut]
window:71.1	Enter	HELP 42 (shared 16)	- **Pinned tabs.** Pin in a tab's right-click menu, Pin Editor in the palette (listed with Cmd-K Shift+Enter, for the active tab of  [cut]
window:71.3	Right	HELP 42 (shared 12)	A pinned tab keeps its pin when its pane floats, when it moves to another page and when its pane splits, and stays open through Clos [cut]
window:71.4	Delete	HELP 42 (shared 5)	Delete on a focused pinned tab closes nothing and shows the first tab that is not pinned.
window:73.4	Tab	HELP 269 (shared 15)	A picture, a PDF, a download, an HTML document and a Doc carry the star and Open in Program where they apply; a PDF's bar carries the [cut]
window:73.6	Right	HELP 44 (shared 2)	The tab row's right end carries only Split Right and the `...` opener.
window:73.17	Tab	HELP 269 (shared 4)	The tab's right-click menu offers Add Bookmark or Remove Bookmark for a served file that is not read at a commit, Open in New Tab and [cut]
window:80.1	Escape,Tab	HELP 50 (shared 12)	Tab and Shift-Tab are the browser's: they move the focus between the controls on the page and reach no binding of this table, e [cut]
window:80.2	Delete,Tab,arrow keys	HELP NONE (shared 0)	The rail is one stop of that order, and each strip of tabs is one stop with its pane menu the stop after it, so Tab [cut]
window:80.3	Delete	HELP 48 (shared 9)	A tab holding text no save has taken is closed only after a confirmation, whether the close came from Delete or from the tab's own c [cut]
window:82.3	Tab	HELP 396 (shared 1)	The brackets cycle a pane's tabs; in the app Ctrl+Tab and Ctrl+Shift+Tab do too.
window:88.4	End,Enter,Home,arrow keys	HELP 64 (shared 7)	The arrow keys, Home and End move through the results and Enter opens the one selected; the keyboard goes to the  [cut]
window:88.7	Enter	HELP 42 (shared 4)	Pin Editor and Unpin Editor are among them, with Cmd-K Shift+Enter beside them, and act on the active tab of the pane that last held  [cut]
window:88.8	Delete	HELP 65 (shared 11)	While a Present tab is on screen the palette also lists its commands, Edit Slide, New Slide, Duplicate Slide and Delete Slide for t [cut]
window:88.14	Enter	HELP 396 (shared 3)	Enter opens the file with the symbol's name selected, and a tab no server serves, or a server that is not running, says so in the l [cut]
window:90.5	Enter,arrow keys	HELP 64 (shared 6)	Cmd+P (Ctrl+P off macOS) opens the palette in its file mode, which finds a file by name across the served roots: the input [cut]
window:90.11	Enter	HELP 66 (shared 9)	Enter or a press opens the file in the view the Files view would choose for it, in the pane the palette was opened over, as a kept t [cut]
window:94.1	Escape	HELP 89 (shared 4)	The sheet itself opens with `?` and closes with `?` or Escape.
```

### 9.4 Case 4: limits

`c04_bullets.py`:

```python
"""Case 4: every bullet/paragraph line of a Markdown file outside tables and fenced blocks has at most 3 sentences and at most 600 characters.
Usage: c04_bullets.py <file> [<file>...]"""
import re, sys
def sentences(s):
    s = re.sub(r'`[^`]*`', 'X', s)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'"[^"]*"', lambda m: m.group(0).replace('.', ''), s)
    s = re.sub(r'\b(?:e\.g|i\.e|etc|vs|No)\.', 'X', s)
    s = re.sub(r'(?<=\d)\.(?=\d)', '', s)
    return len(re.findall(r'[.!?](?=\s+[A-Z(\[`"]|\s*$)', s))
for path in sys.argv[1:]:
    fence = False; bad = 0; n = 0
    for no, line in enumerate(open(path).read().split('\n'), 1):
        if line.startswith('```'): fence = not fence; continue
        if fence or not line.strip() or line.startswith('|') or line.startswith('#') or line.strip() == '---' or line.strip() == '[TOC]': continue
        n += 1
        k = sentences(line)
        if len(line) > 600 or k > 3:
            bad += 1; print(f'{path}:{no}: {len(line)} chars, {k} sentences: {line[:90]}')
    print(f'{path}: {n} bullet/paragraph lines checked, {bad} over the rule')
```

Command:

```
wc -l $D/HELP.md $D/docs/apps.md
python3 c04_bullets.py $D/HELP.md
python3 c04_bullets.py $D/docs/apps.md
```

On the base:

```
     188 tools/oculus/HELP.md
     861 tools/oculus/docs/apps.md
    1049 total
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md:172: 714 chars, 6 sentences: An app is a folder of web files, a page and its script [cut]
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md:174: 786 chars, 5 sentences: The manifest. `name` (the folder's name, lowercase let [cut]
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md:176: 726 chars, 9 sentences: Approval. An app runs only after you approve it. Its t [cut]
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md:178: 1267 chars, 6 sentences: What an app can do. It runs in a sandboxed frame with [cut]
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49-base/tools/oculus/HELP.md: 17 bullet/paragraph lines checked, 4 over the rule
```

After the change:

```
     450 tools/oculus/HELP.md
     349 tools/oculus/docs/apps.md
     799 total
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/HELP.md: 254 bullet/paragraph lines checked, 0 over the rule
/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/docs/apps.md: 61 bullet/paragraph lines checked, 0 over the rule
```

### 9.5 Case 5: in-page anchors, and the claim each DESIGN.md and README.md pointer holds

`c05_anchors.py`:

```python
"""Case 5: every in-page link target of HELP.md, DESIGN.md and README.md (`](#x)`, `](HELP.md#x)`) against the GitHub-style anchors of the headings of HELP.md.
Usage: c05_anchors.py <tools/oculus dir>"""
import re, sys, os
root = sys.argv[1]
def slug(h):
    h = h.strip().lower()
    h = re.sub(r'[`*_]', '', h)
    h = re.sub(r'[^\w\- ]', '', h)
    return h.replace(' ', '-')
def headings(path):
    out = []; fence = False
    for line in open(path):
        if line.startswith('```'): fence = not fence
        if not fence:
            m = re.match(r'#{1,6}\s+(.*)', line)
            if m: out.append(slug(m.group(1)))
    return out
helpa = set(headings(os.path.join(root, 'HELP.md')))
print('HELP.md heading anchors:', len(helpa))
bad = 0; n = 0
for f in ['HELP.md', 'DESIGN.md', 'README.md']:
    text = open(os.path.join(root, f)).read()
    own = set(headings(os.path.join(root, f)))
    for m in re.finditer(r'\]\(((?:HELP\.md)?#[^)\s]*)\)', text):
        tgt = m.group(1)
        anchor = tgt.split('#', 1)[1]
        pool = helpa if tgt.startswith('HELP.md') or f == 'HELP.md' else own
        # README.md and DESIGN.md plain `(#x)` resolve against their own headings
        n += 1
        ok = anchor in pool
        print(('ok       ' if ok else 'UNMATCHED'), f, tgt)
        if not ok: bad += 1
    # links to HELP.md anchors written as `HELP.md#x` in prose
    for m in re.finditer(r'(?<!\()HELP\.md#([\w\-]+)', text):
        n += 1
        ok = m.group(1) in helpa
        print(('ok       ' if ok else 'UNMATCHED'), f, 'HELP.md#' + m.group(1))
        if not ok: bad += 1
print('targets:', n, 'unmatched:', bad)
```

`c05b_pointers.py`:

```python
"""pointers.py <tools/oculus dir>: for every `HELP.md#anchor` pointer of DESIGN.md and README.md, the HELP.md line inside that heading's section where a regex naming the pointer's claim matches, or NONE."""
import re, sys
root = sys.argv[1]
help_lines = open(f'{root}/HELP.md').read().split('\n')
heads = [(i, len(m.group(1)), m.group(2)) for i, l in enumerate(help_lines) if (m := re.match(r'(#+) (.*)', l)) and not l.startswith('```')]
def slug(s): return re.sub(r'-+$', '', re.sub(r'[^a-z0-9 -]', '', s.lower()).replace(' ', '-'))
def section(anchor):
    for k, (i, lvl, title) in enumerate(heads):
        if slug(title) == anchor:
            end = len(help_lines)
            for i2, lvl2, _ in heads[k + 1:]:
                if lvl2 <= lvl: end = i2; break
            return i, end
    return None
CLAIMS = {
 ('DESIGN.md', 91): r'`appearance.yml` holds',
 ('DESIGN.md', 140): r'Pull is a plain `git pull`',
 ('DESIGN.md', 142): r'`word` over the root finds',
 ('DESIGN.md', 144, 'the-views'): r'Literature search: it sends the query',
 ('DESIGN.md', 144, 'configuration-and-the-data'): r'`literature` of `local.yml` is a map',
 ('DESIGN.md', 146): r'Submit Job \(a button',
 ('DESIGN.md', 148): r'`schedules.yml` may be edited by hand',
 ('DESIGN.md', 150, 'configuration-and-the-data'): r'`accounts` of `local.yml`',
 ('DESIGN.md', 150, 'the-views'): r'Calendar|calendar',
 ('DESIGN.md', 152, 'configuration-and-the-data'): r'The triage notes',
 ('DESIGN.md', 152, 'the-views'): r'Send and Archive are the only writes',
 ('DESIGN.md', 156): r'An undo of a write that removed a field',
 ('DESIGN.md', 238): r'A pane the page.s arrangement defines stays',
 ('DESIGN.md', 240): r'drawn at most once on a screen',
 ('DESIGN.md', 266): r'a changed port moves the server',
 ('DESIGN.md', 462): r'Pull is a plain `git pull`',
 ('DESIGN.md', 464): r'`accounts` of `local.yml`',
 ('DESIGN.md', 469): r'A press starts one terminal|Each Terminal tab owns terminals',
 ('DESIGN.md', 472): r'never covers the tool views',
 ('DESIGN.md', 474, 'the-rail'): r'Drag a button to move it',
 ('DESIGN.md', 474, 'pages-and-the-pane-tree'): r'The Pages view lists every page',
 ('DESIGN.md', 478, 'the-views'): r'A Customizations item|Three open from a file',
 ('DESIGN.md', 478, 'files-and-the-editor'): r'selects the range again',
 ('DESIGN.md', 480): r'Lock Group in a pane',
 ('DESIGN.md', 482): r'never covers the tool views',
 ('DESIGN.md', 484): r'Present: Present in the toolbar',
 ('DESIGN.md', 488): r'A Customizations item',
 ('DESIGN.md', 497): r'Present: the Slides button',
 ('DESIGN.md', 506): r'Audit: the sections',
 ('DESIGN.md', 509, 'source-control-and-worktrees'): r'Blame \(the Toggle Blame',
 ('DESIGN.md', 509, 'the-status-bar-and-notifications'): r"the caret line's blame",
 ('DESIGN.md', 517): r'A single click opens a preview tab',
 ('DESIGN.md', 521): r'Indentation is taken from',
 ('DESIGN.md', 524): r'newest 50 such copies',
 ('DESIGN.md', 527): r'Position Leads: `applied`',
 ('DESIGN.md', 528): r'Map: a press on a node',
 ('DESIGN.md', 530): r'Open the Search view with Cmd-Shift-F',
 ('DESIGN.md', 531): r'library tab, which says after a reload',

 ('DESIGN.md', 533): r'Pull is a plain `git pull`',
 ('DESIGN.md', 535): r'worktree row is named by the last name',
 ('DESIGN.md', 536, 'pages-and-the-pane-tree'): r'The rail is one stop',
 ('DESIGN.md', 536, 'the-keys'): r'The key sheet opens with',
 ('DESIGN.md', 539): r'A view drawn from one file of the hub',
 ('DESIGN.md', 554): r'A tooltip opens when the pointer rests',
 ('DESIGN.md', 556): r'A fade at the top or bottom edge',
 ('DESIGN.md', 563, 'files-and-the-editor'): r'On a focused row Enter and F2 rename',
 ('DESIGN.md', 563, 'source-control-and-worktrees'): r'worktree row is named by the last name',
 ('DESIGN.md', 565): r'The project tab draws the card.s tag|Map: a press on a node',
 ('DESIGN.md', 566): r'Focus: each lane.s header',
 ('DESIGN.md', 567): r'Show in Files of a file',
 ('DESIGN.md', 568): r'accent line along its top',
 ('DESIGN.md', 570): r'`show_tabs` \(`multiple`',
 ('DESIGN.md', 577): r'The bell counts unread notifications',
 ('DESIGN.md', 581): r'ends 60 seconds after the last tab',
 ('DESIGN.md', 590): r'The app prints the Present view',
 ('DESIGN.md', 591): r'adapter cannot be stopped by the protocol',
 ('README.md', 9): r'Oculus runs in a browser tab or in its own app',
}
rows = []
for f in ['DESIGN.md', 'README.md']:
    for n, l in enumerate(open(f'{root}/{f}').read().split('\n'), 1):
        for m in re.finditer(r'HELP\.md#([a-z0-9-]+)', l):
            anchor = m.group(1)
            key = (f, n, anchor) if (f, n, anchor) in CLAIMS else (f, n)
            rx = CLAIMS.get(key)
            sec = section(anchor)
            hit = None; txt = ''
            if rx and sec:
                for i in range(sec[0], sec[1]):
                    mm = re.search(rx, help_lines[i])
                    if mm: hit = i + 1; txt = help_lines[i][max(0, mm.start()-10):mm.end()+70]; break
            rows.append((f, n, anchor, hit if hit else 'NONE', txt if hit else ''))
for r in rows: print(f'{r[0]}:{r[1]}\tHELP.md#{r[2]}\tline {r[3]}\t{r[4]}')
print('pointers:', len(rows), '| without a holding line:', sum(1 for r in rows if r[3] == 'NONE'))
```

Command:

```
python3 c05_anchors.py $D
python3 c05b_pointers.py $W/tools/oculus      # after: pointer, section, holding HELP.md line
```

On the base:

```
HELP.md heading anchors: 13
targets: 0 unmatched: 0
```

After the change:

```
HELP.md heading anchors: 20
ok        HELP.md #the-keys
ok        HELP.md #the-keys
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#searching-the-files
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-update-tray-and-schedules
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#configuration-and-the-data
ok        DESIGN.md HELP.md#terminals
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-rail
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#the-status-bar-and-notifications
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#searching-the-files
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-keys
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-rail
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#source-control-and-worktrees
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#the-views
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#pages-and-the-pane-tree
ok        DESIGN.md HELP.md#the-status-bar-and-notifications
ok        DESIGN.md HELP.md#files-and-the-editor
ok        DESIGN.md HELP.md#the-window
ok        DESIGN.md HELP.md#debugging
ok        README.md HELP.md#the-window
targets: 58 unmatched: 0

c05b_pointers.py after the change (section 5 lists the same rows as a table):
DESIGN.md:91	HELP.md#configuration-and-the-data	line 422	config/`, `appearance.yml` holds the UI themes, the wallpaper, the Memories wall's folder, the CRT def
DESIGN.md:140	HELP.md#source-control-and-worktrees	line 397	- Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between merging and re
DESIGN.md:142	HELP.md#searching-the-files	line 330	ferences; `word` over the root finds the name in every file.
DESIGN.md:144	HELP.md#the-views	line 241	- Literature search: it sends the query and its filters to the sources that are on and to nothing else; each 
DESIGN.md:144	HELP.md#configuration-and-the-data	line 438	- `literature` of `local.yml` is a map of `wos_key`, `scopus_key`, `scopus_insttoken`, `openalex_key`, `sema
DESIGN.md:146	HELP.md#the-views	line 247	not slow. Submit Job (a button of a `.slurm` file under a served root) shows a plan naming the code 
DESIGN.md:148	HELP.md#the-update-tray-and-schedules	line 74	- `schedules.yml` may be edited by hand: the dialog, Pause and Resume change only the keys they change and ke
DESIGN.md:150	HELP.md#configuration-and-the-data	line 437	- `accounts` of `local.yml` (the agent account folders the Usage view and the sessions read: `<di
DESIGN.md:152	HELP.md#configuration-and-the-data	line 449	- The triage notes (what each thread wants, the line about it and the drafted answer) ar
DESIGN.md:152	HELP.md#the-views	line 243	- Inbox: Send and Archive are the only writes oculus makes to a mailbox, each behind a confirmation naming the addr
DESIGN.md:156	HELP.md#configuration-and-the-data	line 444	- An undo of a write that removed a field puts the removed text back where it stood, before the text that follo
DESIGN.md:238	HELP.md#pages-and-the-pane-tree	line 41	- A pane the page's arrangement defines stays, empty, when its last tab closes (an empty pane says what appears in 
DESIGN.md:240	HELP.md#pages-and-the-pane-tree	line 36	lf and is drawn at most once on a screen. A drop on a pane of a page shown inside another page lands in that p
DESIGN.md:266	HELP.md#configuration-and-the-data	line 435	 default; a changed port moves the server and the open page follows with its tabs, layout and settings, a port 
DESIGN.md:462	HELP.md#source-control-and-worktrees	line 397	- Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between merging and re
DESIGN.md:464	HELP.md#configuration-and-the-data	line 437	- `accounts` of `local.yml` (the agent account folders the Usage view and the sessions read: `<di
DESIGN.md:469	HELP.md#terminals	line 339	- Each Terminal tab owns terminals running Claude, Codex or a shell inside tmux, which keeps them runnin
DESIGN.md:472	HELP.md#pages-and-the-pane-tree	line 39	, a diff) never covers the tool views of its page. It lands in a workbench's documents pane, else in the pa
DESIGN.md:474	HELP.md#the-rail	line 22	- Drag a button to move it; right-click it (or press Shift+F10) to hide it, reset its page to it
DESIGN.md:474	HELP.md#pages-and-the-pane-tree	line 31	- The Pages view lists every page with show, rename and close (close asks first when the page holds mor
DESIGN.md:478	HELP.md#the-views	line 221	- Three open from a file: `source` (a text file, coloured by language up to `editor.paint_limi
DESIGN.md:478	HELP.md#files-and-the-editor	line 295	ret moved selects the range again.
DESIGN.md:480	HELP.md#pages-and-the-pane-tree	line 41	last tab. Lock Group in a pane's right-click menu makes it take no tab opened from elsewhere (a tab 
DESIGN.md:482	HELP.md#pages-and-the-pane-tree	line 39	, a diff) never covers the tool views of its page. It lands in a workbench's documents pane, else in the pa
DESIGN.md:484	HELP.md#the-views	line 237	- Present: Present in the toolbar and `F` put the slide on the whole monitor, where the arrows, Space (
DESIGN.md:488	HELP.md#the-views	line 222	- A Customizations item names its file by real path (a link followed to its target): a file a
DESIGN.md:497	HELP.md#the-views	line 239	- Present: the Slides button opens the catalog of the deck's groups: the `order:` list (drag or st
DESIGN.md:506	HELP.md#the-views	line 250	- Audit: the sections are open markers, manifest gaps, folders off the tier standard, statu
DESIGN.md:509	HELP.md#source-control-and-worktrees	line 413	- Blame (the Toggle Blame button or Git: Toggle Git Blame Editor Decoration) writes who last ch
DESIGN.md:509	HELP.md#the-status-bar-and-notifications	line 83	 it shows the caret line's blame (a press opens its commit in the Repositories graph), the line and co
DESIGN.md:517	HELP.md#files-and-the-editor	line 295	- A single click opens a preview tab in italics, and the next single click in that pane points it at the f
DESIGN.md:521	HELP.md#files-and-the-editor	line 301	ettings). Indentation is taken from the tab's own choice on the status bar, then the file's own indentati
DESIGN.md:524	HELP.md#files-and-the-editor	line 292	, and the newest 50 such copies over all files, so a larger file, the files inside a deleted folder a
DESIGN.md:527	HELP.md#the-views	line 242	- Position Leads: `applied` opens the Applications file beside the leads with a new entry filled 
DESIGN.md:528	HELP.md#the-views	line 232	- Map: a press on a node fixes it where it lies and moves nothing, dragging it moves it while 
DESIGN.md:530	HELP.md#searching-the-files	line 328	- Open the Search view with Cmd-Shift-F, type a pattern and press Enter (or the Search control); typing runs 
DESIGN.md:531	HELP.md#the-views	line 259	read-only library tab, which says after a reload that the file is no longer open. A hierarchy's first level is the inc
DESIGN.md:533	HELP.md#source-control-and-worktrees	line 397	- Pull is a plain `git pull`, so the repository's own `pull.rebase` decides between merging and re
DESIGN.md:535	HELP.md#source-control-and-worktrees	line 415	- A worktree row is named by the last name of its folder (the path is its tooltip), opens its diff when presse [cut]
DESIGN.md:536	HELP.md#pages-and-the-pane-tree	line 50	 move on. The rail is one stop and each tab strip is one stop with its pane menu the stop after it; 
DESIGN.md:536	HELP.md#the-keys	line 89	The key sheet opens with `?` and closes with `?` or Escape; its letters before a digit are the
DESIGN.md:539	HELP.md#the-views	line 223	- A view drawn from one file of the hub carries that file's own control, last in its toolbar, which opens the
DESIGN.md:554	HELP.md#pages-and-the-pane-tree	line 51	- A tooltip opens when the pointer rests on a control or the keyboard brings the focus to it, one at a time; a
DESIGN.md:556	HELP.md#the-rail	line 26	te tray). A fade at the top or bottom edge of the rail's list says more entries are past it, and the rail's list
DESIGN.md:563	HELP.md#files-and-the-editor	line 282	controls. On a focused row Enter and F2 rename, Cmd+Down opens a file as the pane's preview tab and opens or closes 
DESIGN.md:563	HELP.md#source-control-and-worktrees	line 415	- A worktree row is named by the last name of its folder (the path is its tooltip), opens its diff when presse [cut]
DESIGN.md:565	HELP.md#the-views	line 220	ect.yml`. The project tab draws the card's tag for each known document the project has not got and leaves the human-
DESIGN.md:566	HELP.md#the-views	line 229	- Focus: each lane's header is a strip of the lane's colour, Run green, Push blue, Revise amber, 
DESIGN.md:567	HELP.md#files-and-the-editor	line 285	- Show in Files of a file (on a project card, a collection card whose `link`, `url` or `folder`
DESIGN.md:568	HELP.md#pages-and-the-pane-tree	line 51	arries an accent line along its top and every other strip a plain one, a page drawn inside another carrie
DESIGN.md:570	HELP.md#pages-and-the-pane-tree	line 43	- `show_tabs` (`multiple`, `single` or `none`), `editor_actions` (`strip` or `hidden`) and `wra
DESIGN.md:577	HELP.md#the-status-bar-and-notifications	line 85	- The bell counts unread notifications and opens the notification centre (Clear, Clear All and Do Not Distu [cut]
DESIGN.md:581	HELP.md#files-and-the-editor	line 304	lab`) and ends 60 seconds after the last tab of that root and language closes; a changed `lsp` key ends every serv
DESIGN.md:590	HELP.md#the-window	line 16	- The app prints the Present view's PDF export through a hidden window and opens the audience window of
DESIGN.md:591	HELP.md#debugging	line 381	- The adapter cannot be stopped by the protocol: Stop sends SIGTERM to the process oculus started and SIGKILL two sec
README.md:9	HELP.md#the-window	line 13	- Oculus runs in a browser tab or in its own app (Electron, run from the checkout or packaged as `oculus.app`, as `REA
pointers: 56 | without a holding line: 0
```

### 9.6 Case 6: the doc tabs and the docs: list name files that exist

`c06_docpaths.py`:

```python
"""Case 6: each doc tab of config/layout.yml's help arrangement and each path of .oculus/config/layout.yml's docs: names a file that exists.
Usage: c06_docpaths.py <worktree root>"""
import yaml, sys, os
w = sys.argv[1]
eng = yaml.safe_load(open(os.path.join(w, 'tools/oculus/config/layout.yml')))
views = eng['arrangements']['help']['root']['view']
tabs = [v for v in views if isinstance(v, dict) and v.get('view') == 'doc']
hit = 0
for t in tabs:
    p = t['state']['path']; ok = os.path.isfile(os.path.join(w, p)); hit += ok
    print('help tab  ', 'exists ' if ok else 'MISSING', p, '|', t['state']['label'])
print('help arrangement doc tabs:', len(tabs), 'existing:', hit)
hub = yaml.safe_load(open(os.path.join(w, '.oculus/config/layout.yml')))
hit = 0
for d in hub['docs']:
    ok = os.path.isfile(os.path.join(w, d['path'])); hit += ok
    print('hub docs  ', 'exists ' if ok else 'MISSING', d['path'], '|', d['label'])
print('hub docs entries:', len(hub['docs']), 'existing:', hit)
```

Command:

```
python3 c06_docpaths.py $B     # base
python3 c06_docpaths.py $W     # after
```

On the base:

```
help tab   exists  tools/oculus/docs/apps.md | Apps guide
help tab   exists  tools/oculus/docs/configuration.md | Configuration guide
help tab   exists  tools/oculus/docs/source-control.md | Source Control guide
help tab   exists  tools/oculus/docs/window.md | Window guide
help tab   exists  tools/oculus/docs/views.md | Views guide
help tab   exists  tools/oculus/docs/files-and-search.md | Files and search guide
help tab   exists  tools/oculus/docs/terminals.md | Terminals and commands guide
help tab   exists  tools/oculus/docs/debugging.md | Debugging guide
help arrangement doc tabs: 8 existing: 8
hub docs   exists  docs/RESEARCH-APPROACH.md | Research approach
hub docs   exists  docs/AGENT-APPROACH.md | Agent approach
hub docs   exists  docs/HPC-UTwente-howto.md | HPC how-to
hub docs   exists  docs/DATA-MAP.md | Data map
hub docs   exists  tools/oculus/docs/apps.md | Apps guide
hub docs   exists  tools/oculus/docs/configuration.md | Configuration guide
hub docs   exists  tools/oculus/docs/source-control.md | Source Control guide
hub docs   exists  tools/oculus/docs/window.md | Window guide
hub docs   exists  tools/oculus/docs/views.md | Views guide
hub docs   exists  tools/oculus/docs/files-and-search.md | Files and search guide
hub docs   exists  tools/oculus/docs/terminals.md | Terminals and commands guide
hub docs   exists  tools/oculus/docs/debugging.md | Debugging guide
hub docs   exists  tools/oculus/DESIGN.md | Design
hub docs entries: 13 existing: 13
```

After the change:

```
help tab   exists  tools/oculus/docs/apps.md | Apps guide
help arrangement doc tabs: 1 existing: 1
hub docs   exists  docs/RESEARCH-APPROACH.md | Research approach
hub docs   exists  docs/AGENT-APPROACH.md | Agent approach
hub docs   exists  docs/HPC-UTwente-howto.md | HPC how-to
hub docs   exists  docs/DATA-MAP.md | Data map
hub docs   exists  tools/oculus/docs/apps.md | Apps guide
hub docs entries: 5 existing: 5
```

### 9.7 Case 8: schema fields against the DATA-MAP tables

`c08_deck.py` is the method of `c08_fields.py` applied to `config/schemas/deck-schema.yml` and the "present.yml fields" table (item 3 of the round brief).

`c08_fields.py`:

```python
"""Case 8: the field keys of manifest-schema.yml and side-project-schema.yml against the field names of the page's tables.
Usage: c08_fields.py <tools/oculus dir> <DATA-MAP.md>"""
import re, sys, yaml
root, page = sys.argv[1:3]
man = set(yaml.safe_load(open(f'{root}/config/schemas/manifest-schema.yml'))['manifest_schema']['fields'])
side = [f['field'] for f in yaml.safe_load(open(f'{root}/config/schemas/side-project-schema.yml'))['side_project_schema']]
text = open(page).read().split('\n')
deck_head = next((i for i, l in enumerate(text) if l.strip() == '### present.yml fields'), len(text))
def tables(header_re):
    out = []
    for i, l in enumerate(text):
        if i < deck_head and re.match(header_re, l):
            names = []
            j = i + 2
            while j < len(text) and text[j].startswith('|'):
                cell = text[j].split('|')[1]
                names += re.findall(r'`([^`]+)`', cell)
                j += 1
            out.append((i + 1, names))
    return out
print('manifest-schema fields:', len(man), '| side-project-schema fields:', len(side), '(grep -c field: =', sum(1 for l in open(f'{root}/config/schemas/side-project-schema.yml') if 'field:' in l), ')')
pt = tables(r'\| Field \| Type \| Allowed values or what it names \| Required \| Section \|')
st = tables(r'\| Field \| Type \| Allowed values or what it names \| Required \|$')
old = tables(r'\| Field \| Holds \|')
print('project.yml field tables in the page:', len(pt), '| side-project field tables (new head):', len(st))
for ln, names in pt:
    print(f'project.yml table at line {ln}: {len(names)} names; schema keys missing from the table:', sorted(man - set(names)), '; table names not in schema:', sorted(set(names) - man))
for ln, names in st:
    print(f'side-project table at line {ln}: {len(names)} names; schema keys missing from the table:', sorted(set(side) - set(names)), '; table names not in schema:', sorted(set(names) - set(side)))
if not pt: print('no project.yml field table: all', len(man), 'schema keys missing')
if not st:
    for ln, names in old:
        if 'title' in names and 'status' in names:
            print(f'old side-project table at line {ln} (head "| Field | Holds |"): {len(names)} names {names}; schema keys missing from it:', sorted(set(side) - set(names)))
print('count of "| Field | Holds |" heads in the page:', sum(1 for l in text if l.strip() == '| Field | Holds |'))
```

`c08_deck.py`:

```python
"""Case 8 for the deck schema: the field keys of deck-schema.yml (a leaf field is written with its parents as a dotted name, a group's name as <name>) against the field names of the `| Field | Type | Allowed values or what it names | Required |` table that follows the heading `### present.yml fields`.
Usage: c08_deck.py <tools/oculus dir> <DATA-MAP.md>"""
import re, sys, yaml
root, page = sys.argv[1:3]
schema = yaml.safe_load(open(f'{root}/config/schemas/deck-schema.yml'))['deck_schema']
def leaves(fields, prefix):
    out = []
    for f in fields:
        name = prefix + f['field']
        if 'fields' in f:
            sub = name + ('.<name>.' if f.get('map') else '.')
            out += leaves(f['fields'], sub)
        else:
            out.append(name)
    return out
want = set(leaves(schema, ''))
text = open(page).read().split('\n')
heads = [i for i, l in enumerate(text) if l.strip() == '### present.yml fields']
print('deck-schema leaf fields:', len(want), sorted(want))
if not heads:
    print('no "### present.yml fields" heading: all', len(want), 'schema keys missing from the page')
    sys.exit(0)
i = heads[0]
while i < len(text) and not text[i].startswith('| Field | Type'): i += 1
names = []
j = i + 2
while j < len(text) and text[j].startswith('|'):
    names += re.findall(r'`([^`]+)`', text[j].split('|')[1]); j += 1
print(f'table at line {i + 1}: {len(names)} names; schema keys missing from the table:', sorted(want - set(names)), '; table names not in schema:', sorted(set(names) - want))
```

Command:

```
python3 c08_fields.py $D $B/docs/DATA-MAP.md     # base (D, DATA-MAP of the tree named)
python3 c08_deck.py $D $W/docs/DATA-MAP.md
```

On the base:

```
manifest-schema fields: 46 | side-project-schema fields: 17 (grep -c field: = 17 )
project.yml field tables in the page: 0 | side-project field tables (new head): 0
no project.yml field table: all 46 schema keys missing
old side-project table at line 428 (head "| Field | Holds |"): 5 names ['title', 'status', 'eli5', 'next', 'links']; schema keys missing from it: ['collaborators', 'deadl [cut]
count of "| Field | Holds |" heads in the page: 3

c08_deck.py:
deck-schema leaf fields: 7 ['deck.title', 'defaults.tag_tones', 'groups.<name>.discover', 'groups.<name>.find', 'groups.<name>.slides', 'groups.<name>.sort', 'order']
no "### present.yml fields" heading: all 7 schema keys missing from the page
```

After the change:

```
manifest-schema fields: 46 | side-project-schema fields: 17 (grep -c field: = 17 )
project.yml field tables in the page: 1 | side-project field tables (new head): 1
project.yml table at line 385: 46 names; schema keys missing from the table: [] ; table names not in schema: []
side-project table at line 464: 17 names; schema keys missing from the table: [] ; table names not in schema: []
count of "| Field | Holds |" heads in the page: 2

c08_deck.py:
deck-schema leaf fields: 7 ['deck.title', 'defaults.tag_tones', 'groups.<name>.discover', 'groups.<name>.find', 'groups.<name>.slides', 'groups.<name>.sort', 'order']
table at line 489: 7 names; schema keys missing from the table: [] ; table names not in schema: []
```

### 9.8 Case 9: allowed words of the vocabulary against the page

`c09_vocab.py`:

```python
"""Case 9: the allowed words of each vocab key against the words the page lists.
Usage: c09_vocab.py <tools/oculus dir> <hub dir> <DATA-MAP.md>"""
import re, sys, yaml
root, hub, page = sys.argv[1:4]
voc = yaml.safe_load(open(f'{root}/config/catalogs/vocab.yml'))
hv = yaml.safe_load(open(f'{hub}/.oculus/config/catalogs/vocab.yml'))
text = open(page).read()
rows = [l for l in text.split('\n') if l.startswith('|')]
def words(key, src=voc):
    v = src[key]
    if isinstance(v, dict): return set(v)
    if v and isinstance(v[0], dict): return {r['key'] for r in v}
    return set(v)
def cell(file_re, field):
    for l in rows:
        c = [x.strip() for x in l.split('|')[1:-1]]
        if len(c) >= 6 and re.search(file_re, c[0]) and c[1] == f'`{field}`':
            return c[4]
    return None
def toks(s): return set(re.findall(r'`([^`]+)`', s or ''))
checks = [
 ('type_order', r'^`project.yml`$', 'type', lambda c: toks(c)),
 ('status_legend', r'^`project.yml`$', 'status.chips', lambda c: toks(c)),
 ('focus_lanes', r'^`project.yml`$', 'focus', lambda c: toks(c) - {'holding'}),
 ('priority_levels', r'^`project.yml`$', 'priority', lambda c: toks(c)),
 ('data_access', r'registries/data.yml', 'access', lambda c: toks(c)),
 ('venue_categories', r'registries/venues.yml', 'category', lambda c: toks(c)),
 ('venue_tiers', r'registries/venues.yml', 'tier', lambda c: toks(c.split(';')[0])),
 ('radar_buckets', r'literature-radar', 'bucket', lambda c: toks(c)),
 ('career_host_status', r'career.yml', 'hosts[].status', lambda c: toks(c)),
 ('side_project_status', r'side-projects', 'status', lambda c: toks(c)),
 ('status_palette', r'collections:` list', 'status', lambda c: toks(c)),
 ('palette', r'pillars.yml', 'color', lambda c: {t for t in toks(c) if t.startswith('#')}),
 ('data_themes', r'registries/data.yml', 'themes', lambda c: toks(c.split(' (the')[0])),
 ('venue_themes', r'registries/venues.yml', 'themes', lambda c: toks(c.split(' (the')[0])),
 ('domains (hub)', r'domains.yml', 'key', lambda c: toks(c.split(': ', 1)[1]) if ': ' in c else set()),
]
bad = 0
for key, file_re, field, ext in checks:
    src = hv if key.endswith('(hub)') or key in ('data_themes', 'venue_themes') else voc
    k = key.replace(' (hub)', '')
    c = cell(file_re, field)
    if c is None:
        print(f'{key}: NO ROW on the page for {file_re} {field}'); bad += 1; continue
    v = words(k, src)
    if k == 'venue_tiers':
        v = {r['key'] for r in voc['venue_tiers'] if r.get('assignable', True)}
    p = ext(c)
    ok = (v == p)
    bad += (not ok)
    print(f'{key}: vocab {len(v)} words, page {len(p)} words | vocab not on page: {sorted(v - p)} | page not in vocab: {sorted(p - v)}')
un = [r['key'] for r in voc['venue_tiers'] if not r.get('assignable', True)]
tier = cell(r'registries/venues.yml', 'tier') or ''
print('venue_tiers assignable false:', un, '| page says unrated with `assignable: false`:', all(f'`{u}`' in tier for u in un) and '`assignable: false`' in tier)
print('type_color keys equal type_order words:', words('type_color') == words('type_order'))
body = text
leads = words('leads_fit')
print('leads_fit words on the page (bullet):', all(f'`{w}`' in body for w in leads), sorted(leads))
dims = [r['field'] for r in voc['career_score_dims']]
print('career_score_dims fields on the page:', all(f'`{w}`' in body for w in dims), dims)
print('rows with a difference:', bad)
```

Command:

```
python3 c09_vocab.py $D $R $R/docs/DATA-MAP.md     # R the tree named
```

On the base:

```
type_order: vocab 14 words, page 3 words | vocab not on page: ['abandoned', 'active', 'disproved', 'dropped', 'exploring', 'idea', 'in-prep', 'manuscript', 'nogo', 'phd', [cut]
status_legend: vocab 30 words, page 2 words | vocab not on page: ['abandoned', 'abstract', 'accepted', 'admin-prep', 'ai-tells', 'blocked', 'coauthor', 'conference', 'de- [cut]
focus_lanes: vocab 9 words, page 2 words | vocab not on page: ['backburner', 'blocked', 'build', 'derisk', 'push', 'review', 'revise', 'run', 'scope'] | page not in vocab [cut]
priority_levels: vocab 3 words, page 2 words | vocab not on page: ['high', 'low', 'med'] | page not in vocab: ['priority_levels', 'tools/oculus/config/catalogs/vocab.yml' [cut]
data_access: vocab 4 words, page 2 words | vocab not on page: ['credentialed', 'open', 'private', 'registration'] | page not in vocab: ['data_access', 'tools/oculus/confi [cut]
venue_categories: vocab 4 words, page 2 words | vocab not on page: ['conference', 'journal', 'meeting', 'thesis'] | page not in vocab: ['tools/oculus/config/catalogs/voca [cut]
venue_tiers: vocab 3 words, page 2 words | vocab not on page: ['flagship', 'specialist', 'strong'] | page not in vocab: ['tools/oculus/config/catalogs/vocab.yml', 'venue_ [cut]
radar_buckets: vocab 4 words, page 2 words | vocab not on page: ['adjacent', 'cite_baseline', 'idea', 'preemption'] | page not in vocab: ['radar_buckets', 'tools/oculus/c [cut]
career_host_status: vocab 5 words, page 2 words | vocab not on page: ['awaiting', 'candidate', 'drafted', 'dropped', 'warm'] | page not in vocab: ['career_host_status', ' [cut]
side_project_status: vocab 4 words, page 2 words | vocab not on page: ['building', 'idea', 'parked', 'running'] | page not in vocab: ['side_project_status', 'tools/oculus [cut]
status_palette: NO ROW on the page for collections:` list status
palette: vocab 39 words, page 0 words | vocab not on page: ['#06b6d4', '#0891b2', '#0d9488', '#0e7490', '#0ea5e9', '#16a34a', '#1a9e54', '#2563eb', '#475569', '#6366f1',  [cut]
data_themes: vocab 11 words, page 2 words | vocab not on page: ['bci-ecog', 'clinical-ehr', 'ct-imaging', 'ecg', 'eeg', 'mammography', 'mri-imaging', 'pde-operator', 'sim [cut]
venue_themes: vocab 13 words, page 2 words | vocab not on page: ['bio', 'clinical', 'core-ml', 'cs', 'federated', 'high-end', 'imaging', 'informatics', 'method', 'neuro', [cut]
domains (hub): vocab 12 words, page 0 words | vocab not on page: ['brain', 'brainbci', 'cs', 'heart', 'immune', 'liver', 'liverfl', 'liversurv', 'meta', 'method', 'privac [cut]
venue_tiers assignable false: ['unrated'] | page says unrated with `assignable: false`: False
type_color keys equal type_order words: True
leads_fit words on the page (bullet): False ['moderate', 'reach', 'strong']
career_score_dims fields on the page: False ['proposal', 'ai_fl_clinic', 'backing', 'after']
rows with a difference: 15
```

After the change:

```
type_order: vocab 14 words, page 14 words | vocab not on page: [] | page not in vocab: []
status_legend: vocab 30 words, page 30 words | vocab not on page: [] | page not in vocab: []
focus_lanes: vocab 9 words, page 9 words | vocab not on page: [] | page not in vocab: []
priority_levels: vocab 3 words, page 3 words | vocab not on page: [] | page not in vocab: []
data_access: vocab 4 words, page 4 words | vocab not on page: [] | page not in vocab: []
venue_categories: vocab 4 words, page 4 words | vocab not on page: [] | page not in vocab: []
venue_tiers: vocab 3 words, page 3 words | vocab not on page: [] | page not in vocab: []
radar_buckets: vocab 4 words, page 4 words | vocab not on page: [] | page not in vocab: []
career_host_status: vocab 5 words, page 5 words | vocab not on page: [] | page not in vocab: []
side_project_status: vocab 4 words, page 4 words | vocab not on page: [] | page not in vocab: []
status_palette: vocab 45 words, page 45 words | vocab not on page: [] | page not in vocab: []
palette: vocab 39 words, page 39 words | vocab not on page: [] | page not in vocab: []
data_themes: vocab 11 words, page 11 words | vocab not on page: [] | page not in vocab: []
venue_themes: vocab 13 words, page 13 words | vocab not on page: [] | page not in vocab: []
domains (hub): vocab 12 words, page 12 words | vocab not on page: [] | page not in vocab: []
venue_tiers assignable false: ['unrated'] | page says unrated with `assignable: false`: True
type_color keys equal type_order words: True
leads_fit words on the page (bullet): True ['moderate', 'reach', 'strong']
career_score_dims fields on the page: True ['proposal', 'ai_fl_clinic', 'backing', 'after']
rows with a difference: 0
```

### 9.9 Case 10: the Apps guide against the code

`c10_apps.py`:

```python
"""Case 10: the Apps guide against the code. Lists the methods, channels, write kinds and refusal words the code has and the ones the guide names, and prints both differences.
Usage: c10_apps.py <tools/oculus dir>"""
import re, sys, os, subprocess
root = sys.argv[1]
lib = os.path.join(root, 'src/lib')
def read(p): return open(os.path.join(lib, p)).read()
# --- the code's sets
methods_src = read('state/system/apps/methods.ts')
block = re.search(r'export type Methods = \{(.*?)\n\};', methods_src, re.S).group(1)
code_methods = set(re.findall(r'^\s{4}(\w+):', block, re.M))
apps_src = read('data/helpers/files/apps.ts')
def arr(name):
    m = re.search(r'const ' + name + r'(?::[^=]*)? = \[(.*?)\]', apps_src, re.S)
    return set(re.findall(r"'([^']+)'", m.group(1)))
open_channels = arr('READ_OPEN'); machine_channels = arr('READ_MACHINE'); closed_channels = arr('CLOSED_CHANNELS')
open_writes = arr('OPEN_WRITES'); closed_writes = arr('CLOSED_WRITES'); confirmed = arr('CONFIRMED_WRITES')
rules = read('state/system/apps/rules.ts')
code_words = set(re.findall(r":\s*'([a-z_]+)'", re.search(r'export const REFUSED = \{(.*?)\} as const', rules, re.S).group(1)))
code_words |= {'not_json', 'refused', 'failed'}
# the rejection of a non-JSON value is t('apps.refused_not_json'): read its text from the catalog
cat = open(os.path.join(root, 'config/text/views/system/apps.yml')).read() if os.path.exists(os.path.join(root,'config/text/views/system/apps.yml')) else ''
# --- the guide's sets: first column of the tables under a heading
guide = open(os.path.join(root, 'docs/apps.md')).read()
def table_firsts(heading_re):
    m = re.search(heading_re + r'.*?\n(.*?)(?=\n#{2,4} |\Z)', guide, re.S)
    if not m: return set()
    out = set()
    for line in m.group(1).splitlines():
        if line.startswith('|') and not re.match(r'\|[-\s|]+$', line):
            cell = line.split('|')[1]
            out |= set(re.findall(r'`([^`]+)`', cell))
    return out
def clean(s): return {re.sub(r'[(<:].*$', '', x) for x in s}
g_methods = clean(table_firsts(r'#{2,4} The nine methods'))
g_channels = table_firsts(r'#{2,4} Channels')
g_words = clean(table_firsts(r'#{2,4} (?:\d+\. )?Refusal words'))
g_writes = table_firsts(r'#{2,4} Writes')
def show(title, code, g):
    print(title)
    print('  code :', sorted(code))
    print('  guide:', sorted(g))
    print('  code not in guide:', sorted(code - g))
    print('  guide not in code:', sorted(g - code))
show('methods', code_methods, g_methods)
show('channels (open + machine)', open_channels | machine_channels, g_channels)
show('open write kinds', open_writes, g_writes)
show('refusal words', code_words, g_words)
# the closed channels and closed write kinds are named in the guide's text
for title, names in (('closed channels', closed_channels), ('closed write kinds', closed_writes)):
    absent = sorted(n for n in names if f'`{n}`' not in guide and f'`{n}:' not in guide)
    print(title, 'named in the guide text:', len(names) - len(absent), 'of', len(names), '| not named:', absent)
# every name the guide gives, found in the code that serves or raises it
print('--- grep of each name in src/lib (count of files)')
def files_with(word):
    r = subprocess.run(['grep', '-rlF', '--include=*.ts', '--include=*.js', '--include=*.svelte', '--include=*.yml', word, lib, os.path.join(root,'config')], capture_output=True, text=True)
    return len([l for l in r.stdout.splitlines() if l])
for n in sorted(g_methods | g_channels | g_words | g_writes):
    c = files_with(n)
    print(f'  {n:18} {c}', '' if c else '  <-- NOT FOUND')
```

Command:

```
python3 c10_apps.py $D
```

On the base:

```
methods
  code : ['getState', 'getStore', 'getTheme', 'key', 'open', 'read', 'setState', 'setStore', 'write']
  guide: ['getState', 'getStore', 'getTheme', 'key', 'open', 'read', 'setState', 'setStore', 'write']
  code not in guide: []
  guide not in code: []
channels (open + machine)
  code : ['audit', 'calendar', 'config', 'feeds', 'files', 'git', 'hpc', 'inbox', 'portfolio', 'sessions', 'usage']
  guide: ['audit', 'calendar', 'config', 'feeds', 'files', 'git', 'hpc', 'inbox', 'portfolio', 'sessions', 'usage']
  code not in guide: []
  guide not in code: []
open write kinds
  code : ['delete-entry', 'entry', 'feed-delete', 'feed-field', 'host', 'lead-add', 'linkedin-idea', 'linkedin-post', 'manifest', 'new-entry', 'new-idea', 'radar-add', 'r [cut]
  guide: ['delete-entry', 'entry', 'feed-delete', 'feed-field', 'host', 'lead-add', 'linkedin-idea', 'linkedin-post', 'manifest', 'new-entry', 'new-idea', 'radar-add', 'r [cut]
  code not in guide: []
  guide not in code: []
refusal words
  code : ['closed', 'declined', 'failed', 'missing', 'not_declared', 'not_json', 'rate', 'refused', 'too_large']
  guide: ['Lit Watch has no file on this hub', 'a new entry needs a ', 'an entry with that ', 'bridge_unknown', 'channel_closed', 'channel_unknown', 'closed', 'connect_sh [cut]
  code not in guide: []
  guide not in code: ['Lit Watch has no file on this hub', 'a new entry needs a ', 'an entry with that ', 'bridge_unknown', 'channel_closed', 'channel_unknown', 'connect_ [cut]
closed channels named in the guide text: 3 of 3 | not named: []
closed write kinds named in the guide text: 18 of 23 | not named: ['deposit', 'fs', 'mail', 'memories', 'usage/refresh']
--- grep of each name in src/lib (count of files)
  Lit Watch has no file on this hub 2 
  a new entry needs a  1 
  an entry with that  2 
  audit              42 
  bridge_unknown     2 
  calendar           68 
  channel_closed     2 
  channel_unknown    2 
  closed             216 
  config             506 
  connect_shape      2 
  declined           8 
  delete-entry       9 
  description_shape  2 
  entry              449 
  entry_missing      2 
  entry_shape        2 
  failed             323 
  feed-delete        9 
  feed-field         9 
  feeds              60 
  file_unreadable    2 
  files              519 
  getState           4 
  getStore           6 
  getTheme           3 
  git                207 
  glyph_unknown      6 
  host               170 
  hpc                54 
  inbox              42 
  key                883 
  key_missing        2 
  key_unknown        5 
  kind               522 
  lead-add           8 
  linkedin-idea      9 
  linkedin-post      8 
  list_repeated      2 
  list_shape         2 
  manifest           126 
  missing            215 
  name_empty         6 
  name_not_folder    2 
  name_shape         2 
  new-entry          9 
  new-idea           13 
  no collection      4 
  no entry           32 
  no host named      2 
  no project with the id  7 
  not_declared       3 
  not_json           5 
  nothing to write   3 
  open               776 
  outside            256 
  portfolio          113 
  radar-add          10 
  rate               109 
  read               1239 
  readback           4 
  refused            363 
  reorder            42 
  sessions           243 
  setState           6 
  setStore           4 
  subtask            51 
  subtask-add        9 
  the LinkedIn folder is not on this hub 1 
  the LinkedIn idea file is not on this hub 1 
  the body is not a write this route knows 1 
  the identity field is what the entry is found by 1 
  the leads feed is not on this hub 1 
  title_shape        2 
  too_large          25 
  unknown feed       1 
  unwritable         38 
  usage              58 
  write              641 
  write_closed       2 
  write_unknown      2 
```

After the change:

```
methods
  code : ['getState', 'getStore', 'getTheme', 'key', 'open', 'read', 'setState', 'setStore', 'write']
  guide: ['getState', 'getStore', 'getTheme', 'key', 'open', 'read', 'setState', 'setStore', 'write']
  code not in guide: []
  guide not in code: []
channels (open + machine)
  code : ['audit', 'calendar', 'config', 'feeds', 'files', 'git', 'hpc', 'inbox', 'portfolio', 'sessions', 'usage']
  guide: ['audit', 'calendar', 'config', 'feeds', 'files', 'git', 'hpc', 'inbox', 'portfolio', 'sessions', 'usage']
  code not in guide: []
  guide not in code: []
open write kinds
  code : ['delete-entry', 'entry', 'feed-delete', 'feed-field', 'host', 'lead-add', 'linkedin-idea', 'linkedin-post', 'manifest', 'new-entry', 'new-idea', 'radar-add', 'r [cut]
  guide: ['delete-entry', 'entry', 'feed-delete', 'feed-field', 'host', 'lead-add', 'linkedin-idea', 'linkedin-post', 'manifest', 'new-entry', 'new-idea', 'radar-add', 'r [cut]
  code not in guide: []
  guide not in code: []
refusal words
  code : ['closed', 'declined', 'failed', 'missing', 'not_declared', 'not_json', 'rate', 'refused', 'too_large']
  guide: ['closed', 'declined', 'failed', 'missing', 'not_declared', 'not_json', 'rate', 'refused', 'too_large']
  code not in guide: []
  guide not in code: []
closed channels named in the guide text: 3 of 3 | not named: []
closed write kinds named in the guide text: 23 of 23 | not named: []
--- grep of each name in src/lib (count of files)
  audit              42 
  calendar           68 
  closed             216 
  config             506 
  declined           8 
  delete-entry       9 
  entry              449 
  failed             323 
  feed-delete        9 
  feed-field         9 
  feeds              60 
  files              519 
  getState           4 
  getStore           6 
  getTheme           3 
  git                207 
  host               170 
  hpc                54 
  inbox              42 
  key                883 
  lead-add           8 
  linkedin-idea      9 
  linkedin-post      8 
  manifest           126 
  missing            215 
  new-entry          9 
  new-idea           13 
  not_declared       3 
  not_json           5 
  open               776 
  portfolio          113 
  radar-add          10 
  rate               109 
  read               1239 
  refused            363 
  reorder            42 
  sessions           243 
  setState           6 
  setStore           4 
  subtask            51 
  subtask-add        9 
  too_large          25 
  usage              58 
  write              641 
```

### 9.10 Case 11: the config checks

Command:

```
cd $W/tools/oculus && npx vitest run tests/checks/config --reporter=dot --testTimeout 300000
```

On the base:

```
 Test Files  4 passed (4)
      Tests  81 passed | 1 skipped (82)
(saved output of the first run on the unchanged worktree, before the first edit)
```

After the change:

```
 Test Files  4 passed (4)
      Tests  81 passed | 1 skipped (82)
```

### 9.11 Case 12: a saved Help page holding doc tabs of a removed guide

`c12.test.ts`:

```typescript
// Case 12: a saved layout whose Help page holds a doc tab of a removed guide. Prints what the layout reader makes of the tab. Asserts nothing.
import { it } from 'vitest';
import { parseLayout, serialiseLayout } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/src/lib/state/workbench/layout/saved/saved.ts';
import { heldPages, pageAround, split } from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/tests/state/workbench/layout/layout-fixture.ts';

it('prints the doc tabs a saved Help page reads into', () => {
    const doc = (id: string, path: string, label: string) => ({ id, view: 'doc', state: { id: path, path, label } });
    const help = {
        kind: 'pane' as const,
        tabs: [
            { id: 'help-1', view: 'help', state: null },
            doc('doc-apps', 'tools/oculus/docs/apps.md', 'Apps guide'),
            doc('doc-views', 'tools/oculus/docs/views.md', 'Views guide'),
            doc('doc-design', 'tools/oculus/DESIGN.md', 'Design')
        ],
        active: 'doc-views'
    };
    const envelope = serialiseLayout(heldPages([pageAround('help', split('row', [0.5, 0.5], [help, { kind: 'pane', tabs: [], active: '' }]))]));
    const read = parseLayout(envelope, 'Page 1');
    const tabs: unknown[] = [];
    const walk = (node: any): void => {
        if (node.kind === 'pane') for (const t of node.tabs) tabs.push(t);
        else for (const c of node.children) walk(c);
    };
    if (read === null) { console.log('CASE12 envelope not read'); return; }
    walk(read.pages[0].workbench.root);
    console.log('CASE12 pages read:', read.pages.length);
    for (const t of tabs as any[]) console.log('CASE12 tab', JSON.stringify(t));
});
```

`vitest.scratch.config.ts`:

```typescript
// Scratch vitest config: the tree's own config with one project, running the scratch files named in SCRATCH_FILES (absolute paths, comma separated).
import base from '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/vite.config.ts';
export default (env: { mode: string; command: string }) => {
    const config = (base as unknown as (e: unknown) => Record<string, any>)(env);
    delete config.test.projects;
    config.test.include = (process.env.SCRATCH_FILES ?? '').split(',');
    config.test.environment = 'node';
    config.test.expect = {};
    config.root = '/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus';
    config.server = { ...config.server, fs: { strict: false } };
    return config;
};
```

Command:

```
cd $W/tools/oculus && SCRATCH_FILES=$TMPDIR/d49r1/cases/c12.test.ts npx vitest run -c $TMPDIR/d49r1/cases/vitest.scratch.config.ts --reporter=verbose --disableConsoleIntercept
```

On the base:

```
not run on the base: the layout reader is unchanged (no file under `src/lib/state` is in the `diff -rq` list of section 12)
```

After the change:

```
CASE12 pages read: 1
CASE12 tab {"id":"help-1","view":"help","state":null}
CASE12 tab {"id":"doc-apps","view":"doc","state":{"id":"tools/oculus/docs/apps.md","path":"tools/oculus/docs/apps.md","label":"Apps guide"}}
CASE12 tab {"id":"doc-views","view":"doc","state":{"id":"tools/oculus/docs/views.md","path":"tools/oculus/docs/views.md","label":"Views guide"}}
CASE12 tab {"id":"doc-design","view":"doc","state":{"id":"tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","label":"Design"}}
 pass ../../../../../../../../../private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d49b/tmp/d49r1/cases/c12.test. [cut]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### 9.12 Case 13: the view table sentences and the key sheet row

`c13_views.py`:

```python
"""Case 13: each description of HELP.md's view table is one sentence; the key sheet's h1-h9 row of config/text/app.yml equals HELP.md's.
Usage: c13_views.py <tools/oculus dir>"""
import re, sys, os, yaml
root = sys.argv[1]
text = open(os.path.join(root, 'HELP.md')).read().splitlines()
# the view table: the table whose header cell is 'What it is for'
start = next(i for i, l in enumerate(text) if l.startswith('|') and 'What it is for' in l)
rows = []
for l in text[start + 2:]:
    if not l.startswith('|'): break
    cells = [c.strip() for c in l.strip().strip('|').split(' | ')]
    rows.append(cells)
def sentences(s):
    s = re.sub(r'`[^`]*`', 'X', s)                 # code spans hold no sentence end
    s = re.sub(r'\b(?:e\.g|i\.e|etc|vs)\.', 'X', s)
    s = re.sub(r'(?<=\d)\.(?=\d)', '', s)         # decimals
    return len(re.findall(r'[.!?](?=\s+[A-Z]|\s*$)', s))
bad = 0
for cells in rows:
    n = sentences(cells[-1])
    if n != 1: bad += 1; print('ROW', n, 'sentence(s):', cells[0], '|', cells[-1][:100])
print('view table rows:', len(rows), '| rows whose description is not exactly one sentence:', bad)
print('link in a name cell:', sum(1 for c in rows if '](' in ' '.join(c[:2])))
# h1-h9
help_row = next(l for l in text if re.match(r'\| h1-h9 \|', l))
help_text = re.match(r'\| h1-h9 \| (.*) \|$', help_row).group(1)
cfg = yaml.safe_load(open(os.path.join(root, 'config/text/app.yml')))
rowsstr = cfg['text']['app']['keys']['rows']
sheet = next(r for r in rowsstr.split(';;') if r.startswith('h1-h9 |'))[len('h1-h9 | '):]
print('HELP.md :', help_text)
print('app.yml :', sheet)
print('equal   :', help_text == sheet)
```

Command:

```
python3 c13_views.py $D
```

On the base:

```
ROW 4 sentence(s): `present` | A deck, one slide at a time as a 16:9 frame scaled to its pane, with an overview grid and full scree
view table rows: 52 | rows whose description is not exactly one sentence: 1
link in a name cell: 52
HELP.md : open the manual, the Memories wall, a hub document or a guide, the Help page's group
app.yml : open the manual, the Memories wall, a hub document or a guide, the Help page's group
equal   : True
```

After the change:

```
view table rows: 52 | rows whose description is not exactly one sentence: 0
link in a name cell: 0
HELP.md : open the manual, the Memories wall or a document of the Help page's group, its first nine
app.yml : open the manual, the Memories wall or a document of the Help page's group, its first nine
equal   : True
```

### 9.13 Backticked keys of HELP.md against config, source and the hub layer

The base column is the unchanged 188-line HELP.md. After the change, each token listed is named and judged in section 13.

`keys_exist.py`:

```python
"""Every backticked token that looks like a config key (snake_case, dotted, or ending ':') in a Markdown file occurs in config/ (except local.yml), src/ or the hub's .oculus/config.
Usage: keys_exist.py <tools/oculus dir> <md file>"""
import re, sys, os, subprocess
root, md = sys.argv[1], sys.argv[2]
text = open(md).read()
toks = set()
for t in re.findall(r'`([^`\n]+)`', text):
    t = t.strip()
    if re.fullmatch(r'[a-z][a-z0-9]*(?:[_.][a-z0-9]+)+:?', t) or re.fullmatch(r'[a-z][a-z0-9_]*:', t):
        toks.add(t.rstrip(':'))
hub = os.path.abspath(os.path.join(root, '..', '..'))
dirs = [os.path.join(root, d) for d in ('config', 'src')] + [os.path.join(hub, '.oculus', 'config')]
missing = []
for t in sorted(toks):
    last = t.split('.')[-1]
    found = False
    for needle in {t, last}:
        r = subprocess.run(['grep', '-rqF', '--exclude=local.yml', '--exclude-dir=node_modules', needle] + dirs, capture_output=True)
        if r.returncode == 0: found = True
        else: found = False; break
    if not found: missing.append(t)
print(len(toks), 'key-like tokens; not found in config/, src/ or the hub layer:', len(missing))
for t in missing: print('  ', t)
```

Command:

```
python3 keys_exist.py $D $D/HELP.md
```

On the base:

```
10 key-like tokens; not found in config/, src/ or the hub layer: 0
```

After the change:

```
183 key-like tokens; not found in config/, src/ or the hub layer: 9
   commit.gpgsign
   desktop.yml
   launch.json
   microsoft.json
   pull.rebase
   pyproject.toml
   pyrightconfig.json
   statusbar.yml
   ui.yml
```

### 9.14 Numbers HELP.md states against the code

`claims.py`:

```python
import subprocess, sys
claims = [
 ("dock within 24 px", r"\b24\b[^\n]*(dock|snap|edge)|(dock|snap|edge)[^\n]*\b24\b"),
 ("audience window 3 s", r"AUDIENCE[A-Z_]*(MS|WAIT|GRACE)[^\n]*3[_0]*|3_?000[^\n]*(audience|presenter)|(audience|presenter)[^\n]*3_?000"),
 ("fix writing 2000 files", r"\b2_?000\b[^\n]*(file|FILE)|(MAX|LIMIT)[A-Z_]*FILES[^\n]*2_?000"),
 ("fix writing 2 MB left out", r"2 \* 1024 \* 1024|2_?097_?152|2 MB"),
 ("pdf export 32 MB / 60 s", r"32 \* 1024 \* 1024|32 MB"),
 ("export gives up 60", r"60_?000|60 s|60 seconds"),
 ("console 10000 lines", r"10_?000[^\n]*(line|LINE)|(MAX|LIMIT)[A-Z_]*LINES[^\n]*10_?000"),
 ("history kept 50 undo copies", r"\b50\b[^\n]*(copies|COPIES|copy)|(KEEP|MAX)[A-Z_]*(COPIES|DELETE)[^\n]*50"),
 ("delete content kept 5 MB", r"5 \* 1024 \* 1024|5 MB"),
 ("timeline page 50", r"\b50\b[^\n]*(page|commit|PAGE|COMMIT)|(PAGE|COMMITS)[A-Z_]*\s*=\s*50"),
 ("commit chunks 50 graph", r"GRAPH[A-Z_]*\s*=\s*50|\b50\b[^\n]*graph"),
 ("200 changes cap", r"\b200\b[^\n]*(change|CHANGE)|(MAX|LIMIT)[A-Z_]*CHANGES[^\n]*200"),
 ("git 10 s / 60 s limits", r"10_?000[^\n]*(git|GIT)|FETCH[A-Z_]*TIMEOUT|60_?000"),
 ("git 8 MB output", r"8 \* 1024 \* 1024|8 MB"),
 ("preview click 500 ms", r"500"),
 ("pdf last 50 files", r"\b50\b[^\n]*(pdf|PDF|place)"),
 ("lsp idle 60 s", r"60_?000|60 \* 1000"),
 ("linter 30 s", r"30_?000|30 \* 1000"),
 ("eslint idle 15 min", r"15 \* 60|900_?000|15 minutes"),
 ("lsp edit file 5 MB", r"5 \* 1024 \* 1024"),
 ("schedule skip words", r"skipped"),
 ("notification toast 8 s", r"8_?000|8 \* 1000"),
 ("1000 ms close autosave", r"1000"),
 ("poll files twice a second", r"500"),
 ("remote command sbatch parsable", r"sbatch --parsable"),
 ("refusal word changed/copy-failed/submit-failed", r"copy-failed"),
 ("approvals mode 0700", r"0o?700"),
 ("CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN", r"CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN"),
 ("OCULUS_ARG_", r"OCULUS_ARG_"),
 ("user.useConfigOnly", r"useConfigOnly"),
 ("--dangerously-skip-permissions", r"--dangerously-skip-permissions"),
 ("oculus.debug.v1", r"oculus\.debug\.v1"),
 ("SIGTERM then SIGKILL 2 s", r"SIGKILL"),
 ("eol=crlf conversion attrs", r"working-tree-encoding"),
 ("git 2.35 stash staged", r"2\.35|\[2, 35\]|2, 35"),
 ("scancel", r"scancel"),
 ("/present/show", r"/present/show"),
 ("webcal", r"webcal"),
 ("ics-<label>.json", r"ics-"),
 ("identity_empty", r"identity_empty"),
 ("audit_ignore", r"audit_ignore"),
 ("findings tasks.skip_permissions", r"skip_permissions"),
 ("agents confirm true", r"confirm"),
 ("repository_scan_depth max 3", r"repository_scan_depth"),
]
for name, pat in claims:
    r = subprocess.run(['grep','-rEm1','--exclude=local.yml','--exclude-dir=node_modules','-I',pat,'src','config'], capture_output=True, text=True)
    out = r.stdout.strip().split('\n')[0][:140] if r.returncode == 0 else 'MISSING'
    print(f'{name:48s} {out}')
```

Command:

```
cd $D && python3 claims.py
```

On the base:

```
dock within 24 px                                MISSING
audience window 3 s                              MISSING
fix writing 2000 files                           src/lib/server/machine/runs/lint/writing/folder.ts:const MAX_FILES = 2000;
fix writing 2 MB left out                        src/lib/server/core/git/run.ts:const MAX_OUTPUT = 32 * 1024 * 1024;
pdf export 32 MB / 60 s                          src/lib/server/core/git/run.ts:const MAX_OUTPUT = 32 * 1024 * 1024;
export gives up 60                               src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
console 10000 lines                              MISSING
history kept 50 undo copies                      src/lib/server/files/fs/history.ts:// 50, since the undo of the delete reads it; the newest 50 copies of kind `delete` ov [cut]
delete content kept 5 MB                         src/lib/server/content/literature/ask.ts:// A source's answer is read to at most 5 MB. A request that gets no answer in t [cut]
timeline page 50                                 src/lib/server/core/changes.ts:export const PAGE = 50;
commit chunks 50 graph                           src/lib/server/core/git/reads.ts:export const GRAPH_PAGE = 50;
200 changes cap                                  src/lib/data/model/model-sessions.ts:     * How many rows each list held before it was cut to its first 200: `changes` is [cut]
git 10 s / 60 s limits                           src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
git 8 MB output                                  src/lib/server/content/latex/bib.ts:const BIB_MAX_BYTES = 8 * 1024 * 1024;
preview click 500 ms                             src/desktop/app.ts:const STOP_WAIT_MS = 5000;
pdf last 50 files                                MISSING
lsp idle 60 s                                    src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
linter 30 s                                      src/lib/server/accounts/connect/oauth.ts:export const READ_TIMEOUT_MS = 30000;
eslint idle 15 min                               src/lib/server/machine/runs/lint/eslint.ts:// - It ends after 15 minutes without a request (`IDLE_MS`), when no served ro [cut]
lsp edit file 5 MB                               src/lib/server/content/literature/ask.ts:const ANSWER_MAX = 5 * 1024 * 1024;
schedule skip words                              src/lib/shell/rail/ScheduleList.svelte:        else if (answer.skipped !== '') onsaid(answer.skipped);
notification toast 8 s                           src/lib/shell/status/Toast.svelte:    const TOAST_MS = 8000;
1000 ms close autosave                           src/lib/ui/tabs/Tabs.svelte:        flex: 1000 1 var(--tabs-least);
poll files twice a second                        src/desktop/app.ts:const STOP_WAIT_MS = 5000;
remote command sbatch parsable                   src/lib/server/machine/pty/shell-word.ts:// cluster's shell (`cd <folder> && sbatch --parsable <script>`), goes through s [cut]
refusal word changed/copy-failed/submit-failed   src/lib/server/machine/hpc/submit.ts:    | 'copy-failed'
approvals mode 0700                              src/lib/server/accounts/mail/poll.ts:const DIR_MODE = 0o700;
CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN             src/lib/server/machine/pty/sessions.ts:const GRID_ENV = 'CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1';
OCULUS_ARG_                                      src/lib/server/machine/pty/sessions.ts:     * that starts with TASK_ENV_PREFIX, which the line names as `"$OCULUS_ARG_<n> [cut]
user.useConfigOnly                               src/lib/server/git/git-write.ts:// A commit is made with `user.useConfigOnly` set through the environment (`GIT_CONFIG_CO [cut]
--dangerously-skip-permissions                   MISSING
oculus.debug.v1                                  src/lib/state/system/machine/debug/debug.svelte.ts:// What the browser keeps is `oculus.debug.v1` (debug.ts), read throug [cut]
SIGTERM then SIGKILL 2 s                         src/lib/server/core/git/running.ts:/** How long a process asked to end is given before it is sent SIGKILL. */
eol=crlf conversion attrs                        src/lib/server/core/git/parse.ts: * `check-attr filter text eol working-tree-encoding ident -- <path>`: one line per attr [cut]
git 2.35 stash staged                            src/lib/server/git/git-refs.ts:/** Whether git refused `--staged` as an option it does not know, as a git before 2.35 doe [cut]
scancel                                          src/lib/server/machine/hpc/actions.ts:/** Milliseconds a scancel is given: one command that either runs or does not. */
/present/show                                    src/desktop/decide/links.ts:// `owner=<id>` beside it. The audience route, `/present/show` with the params `root` and `pa [cut]
webcal                                           src/lib/server/accounts/calendar/ics.ts:/** The address a published link is fetched at: `webcal://` is the same address o [cut]
ics-<label>.json                                 src/lib/server/accounts/connect/store.ts:// A calendar's published link is an account file too, `ics-<label>.json` holdin [cut]
identity_empty                                   src/lib/data/snapshot/validate.ts: * `identity_empty` for an empty value (two empty values are not a shared one), `identi [cut]
audit_ignore                                     src/lib/server/content/audit/rules.ts:/** The signatures config/behavior.yml's `audit_ignore:` holds, in the order the fi [cut]
findings tasks.skip_permissions                  src/lib/data/sources/config/catalogs.ts: * does not read, which is ignored where it stands (`chat.skip_permissions` and
agents confirm true                              src/lib/ui/tabs/CloseQuestions.svelte:    function confirmed(): void {
repository_scan_depth max 3                      src/lib/server/root/watch/git.ts:// of clones, a monorepo with repositories inside). Every folder down to `repository_sca [cut]
```

After the change:

```
dock within 24 px                                MISSING
audience window 3 s                              MISSING
fix writing 2000 files                           src/lib/server/machine/runs/lint/writing/folder.ts:const MAX_FILES = 2000;
fix writing 2 MB left out                        src/lib/server/core/git/run.ts:const MAX_OUTPUT = 32 * 1024 * 1024;
pdf export 32 MB / 60 s                          src/lib/server/core/git/run.ts:const MAX_OUTPUT = 32 * 1024 * 1024;
export gives up 60                               src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
console 10000 lines                              MISSING
history kept 50 undo copies                      src/lib/server/files/fs/history.ts:// 50, since the undo of the delete reads it; the newest 50 copies of kind `delete` ov [cut]
delete content kept 5 MB                         src/lib/server/content/literature/ask.ts:// A source's answer is read to at most 5 MB. A request that gets no answer in t [cut]
timeline page 50                                 src/lib/server/core/changes.ts:export const PAGE = 50;
commit chunks 50 graph                           src/lib/server/core/git/reads.ts:export const GRAPH_PAGE = 50;
200 changes cap                                  src/lib/data/model/model-sessions.ts:     * How many rows each list held before it was cut to its first 200: `changes` is [cut]
git 10 s / 60 s limits                           src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
git 8 MB output                                  src/lib/server/content/latex/bib.ts:const BIB_MAX_BYTES = 8 * 1024 * 1024;
preview click 500 ms                             src/desktop/app.ts:const STOP_WAIT_MS = 5000;
pdf last 50 files                                MISSING
lsp idle 60 s                                    src/lib/server/core/git/parse.ts: * submodule (mode 160000), and its hunk lines, which hold a submodule's two commits.
linter 30 s                                      src/lib/server/accounts/connect/oauth.ts:export const READ_TIMEOUT_MS = 30000;
eslint idle 15 min                               src/lib/server/machine/runs/lint/eslint.ts:// - It ends after 15 minutes without a request (`IDLE_MS`), when no served ro [cut]
lsp edit file 5 MB                               src/lib/server/content/literature/ask.ts:const ANSWER_MAX = 5 * 1024 * 1024;
schedule skip words                              src/lib/shell/rail/ScheduleList.svelte:        else if (answer.skipped !== '') onsaid(answer.skipped);
notification toast 8 s                           src/lib/shell/status/Toast.svelte:    const TOAST_MS = 8000;
1000 ms close autosave                           src/lib/ui/tabs/Tabs.svelte:        flex: 1000 1 var(--tabs-least);
poll files twice a second                        src/desktop/app.ts:const STOP_WAIT_MS = 5000;
remote command sbatch parsable                   src/lib/server/machine/pty/shell-word.ts:// cluster's shell (`cd <folder> && sbatch --parsable <script>`), goes through s [cut]
refusal word changed/copy-failed/submit-failed   src/lib/server/machine/hpc/submit.ts:    | 'copy-failed'
approvals mode 0700                              src/lib/server/accounts/mail/poll.ts:const DIR_MODE = 0o700;
CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN             src/lib/server/machine/pty/sessions.ts:const GRID_ENV = 'CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1';
OCULUS_ARG_                                      src/lib/server/machine/pty/sessions.ts:     * that starts with TASK_ENV_PREFIX, which the line names as `"$OCULUS_ARG_<n> [cut]
user.useConfigOnly                               src/lib/server/git/git-write.ts:// A commit is made with `user.useConfigOnly` set through the environment (`GIT_CONFIG_CO [cut]
--dangerously-skip-permissions                   MISSING
oculus.debug.v1                                  src/lib/state/system/machine/debug/debug.svelte.ts:// What the browser keeps is `oculus.debug.v1` (debug.ts), read throug [cut]
SIGTERM then SIGKILL 2 s                         src/lib/server/core/git/running.ts:/** How long a process asked to end is given before it is sent SIGKILL. */
eol=crlf conversion attrs                        src/lib/server/core/git/parse.ts: * `check-attr filter text eol working-tree-encoding ident -- <path>`: one line per attr [cut]
git 2.35 stash staged                            src/lib/server/git/git-refs.ts:/** Whether git refused `--staged` as an option it does not know, as a git before 2.35 doe [cut]
scancel                                          src/lib/server/machine/hpc/actions.ts:/** Milliseconds a scancel is given: one command that either runs or does not. */
/present/show                                    src/desktop/decide/links.ts:// `owner=<id>` beside it. The audience route, `/present/show` with the params `root` and `pa [cut]
webcal                                           src/lib/server/accounts/calendar/ics.ts:/** The address a published link is fetched at: `webcal://` is the same address o [cut]
ics-<label>.json                                 src/lib/server/accounts/connect/store.ts:// A calendar's published link is an account file too, `ics-<label>.json` holdin [cut]
identity_empty                                   src/lib/data/snapshot/validate.ts: * `identity_empty` for an empty value (two empty values are not a shared one), `identi [cut]
audit_ignore                                     src/lib/server/content/audit/rules.ts:/** The signatures config/behavior.yml's `audit_ignore:` holds, in the order the fi [cut]
findings tasks.skip_permissions                  src/lib/data/sources/config/catalogs.ts: * does not read, which is ignored where it stands (`chat.skip_permissions` and
agents confirm true                              src/lib/ui/tabs/CloseQuestions.svelte:    function confirmed(): void {
repository_scan_depth max 3                      src/lib/server/root/watch/git.ts:// of clones, a monorepo with repositories inside). Every folder down to `repository_sca [cut]
```


## 10. The brief's "Verify before you report", run once after the last change

Exit statuses, in run order (`final.sh` writes one line per command to `status.log`):

```
quick 0
checks 0
diagrams 0
history 0
c11 0
c12 0
ascii1 0 bytes= 0
ascii2 grepexit=1 bytes= 0
folder 0
runcases 0
done
```

| Command | Result |
|---|---|
| `npm run diagrams && npm run test:quick` | test:quick: 20 changed file(s), from git since HEAD ; test:quick: 14 test file(s), 10 essential ; ok      ASCII gate (0.4 s) ; ok      prettier (0.8 s): All matched files use Prettier code style! ; ok      svelte-kit sync (2.0 s) ; ok      eslint (16.8 s) ; ok      vitest (17.9 s): Duration  14.06s (transform 26.14s, setup 0ms, import 31.18s, tests 4.95s, environment 3ms) ; ok      svelte-check (17.6 s): 1791606953991 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS ; test:quick: 19.7 s (limit 45.0 s); every command passed |
| `npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000` | Test Files  9 passed (9); Tests  115 passed | 1 skipped (116) |
| `npx vitest run tests/checks/diagrams --testTimeout 300000` | Test Files  1 passed (1); Tests  46 passed (46) |
| `npx vitest run tests/checks/source/history.test.ts --reporter=verbose` | Tests  3 passed (3); the three tests pass, the renamed one among them (section 8) |
| ASCII gate 1: `LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)` (a UTF-8 accented letter is allowed under `config/` only) | prints nothing |
| ASCII gate 2: `LC_ALL=C grep -n '[^ -~]' HELP.md docs/apps.md ../../docs/DATA-MAP.md DESIGN.md README.md` | prints nothing (grep exit 1) |
| `sh utils/folder-check.sh` | exit status 0; output: nothing |
| YAML parse of `config/layout.yml config/text/app.yml ../../.oculus/config/layout.yml` | parsed config/layout.yml; parsed config/text/app.yml; parsed ../../.oculus/config/layout.yml |

`wc -l` of every changed file (`wc.log`):

```
     450 HELP.md
     349 docs/apps.md
     579 ../../docs/DATA-MAP.md
     591 DESIGN.md
      48 README.md
     182 config/layout.yml
     258 config/text/app.yml
      13 ../../.oculus/config/layout.yml
     624 src/lib/server/content/docs.ts
      56 src/lib/views/shared/prose/doc-link.ts
     209 src/lib/views/sources/doc/Doc.svelte
      96 src/lib/views/system/help/Help.svelte
     649 tests/checks/config/config-folder.test.ts
     186 tests/checks/source/history.test.ts
```

The seven deleted guides: `diff -rq` lists `Only in BASE/tools/oculus/docs:` for configuration.md, debugging.md, files-and-search.md, source-control.md, terminals.md, views.md, window.md.

`ps -eo pid,etime,command | grep -E 'worktrees/D49([^-]|$)|d49b|d49r1' | grep -v grep | wc -l` prints 0 at the time of writing: nothing of mine runs. (The D55 builder and a dev server of the main checkout run under other paths and are not mine.)


## 11. Anything in the brief that was wrong

1. **A saved "Design" tab does not keep drawing DESIGN.md.** The round brief (item 8) names the premise that it does. `followDoc` (`src/lib/state/workbench/navigation/catalogue.ts:36-48`) returns an entry for a saved path only when the `docs:` list holds that path, or when exactly one entry carries the saved label. `DESIGN.md` is a file only (ruling 8) and `.oculus/config/layout.yml` lists five entries (section 9.6), none of them DESIGN.md, so the lookup gives `entry: null`. `Doc.svelte:84-89` then gives `shown === null`, and `Doc.svelte:169-170` draws `<Empty message={t('doc.unlisted', path)}>`, the sentence of `config/text/views/sources/doc.yml:13`: "{0} is not in the documents list (docs in .oculus/config/layout.yml in the hub, or in config/layout.yml when the hub sets none), and no entry there carries this tab's name." The same holds for a saved tab of a removed guide. Case 12 (section 9.11) shows the saved tab is read with its `path` kept, so the line names that path.

```
 * `moved` says the tab's saved path is no longer the entry's, so the tab is to be restated. No
 * entry is found for a path the list does not hold and a label no entry or several entries carry.
 */
export function followDoc(
    docs: DocEntry[],
    path: string,
    label: string
): { entry: DocEntry | null; moved: boolean } {
    const listed = docs.find((one) => one.path === path);
    if (listed !== undefined) return { entry: listed, moved: false };
    const named = label === '' ? [] : docs.filter((one) => one.label === label);
    if (named.length !== 1) return { entry: null, moved: false };
    return { entry: named[0], moved: true };
```

2. **"Enter in the References view (`views.md:85`)" is the Problems view.** `sed -n 85p $B/tools/oculus/docs/views.md` begins "The view `problems` is VS Code's Problems panel", and the heading above line 85 is `## Problems`. The References view is described at `views.md:69` and names F4 and Shift+F4 only. HELP.md states the Enter of the Problems row (`grep -n "on a Problems row" HELP.md`: HELP.md:153, HELP.md:295).

3. **The deck schema has no `notes` field.** Item 3 lists `notes` among the fields of `present.yml`. `grep -c notes config/schemas/deck-schema.yml` prints 0; the schema's leaf fields are `deck.title`, `defaults.tag_tones`, `groups.<name>.find`, `.sort`, `.discover`, `.slides` and `order` (case 8, section 9.7). `notes` is a front-matter key of a slide file, not a key of `present.yml`. The table lists the seven fields the schema holds.

4. **The base `window.md` gives the rail in a different order than `config/layout.yml`.** `window.md:15` says "top to bottom: Focus, Sessions, Projects, Incoming ..."; `rail:` in `config/layout.yml:9-21` is Focus, Projects, Incoming, Sessions, Explorer, Academic Life, Pillars, References, Present, Apps, Help, System. HELP.md:20 states the order of the file.


## 12. Files

Differences between the base and the worktree (`diff -rq <base> <worktree>` with `node_modules`, `.svelte-kit`, `.svelte-kit-app` and `local.yml` excluded; paths shortened):

```
Files BASE/.oculus/config/layout.yml and WT/.oculus/config/layout.yml differ
Files BASE/docs/DATA-MAP.md and WT/docs/DATA-MAP.md differ
Only in WT/tools/oculus/.scratch/migration/agents/reviews: D49-report.md
Files BASE/tools/oculus/DESIGN.md and WT/tools/oculus/DESIGN.md differ
Files BASE/tools/oculus/HELP.md and WT/tools/oculus/HELP.md differ
Files BASE/tools/oculus/README.md and WT/tools/oculus/README.md differ
Files BASE/tools/oculus/config/layout.yml and WT/tools/oculus/config/layout.yml differ
Files BASE/tools/oculus/config/text/app.yml and WT/tools/oculus/config/text/app.yml differ
Files BASE/tools/oculus/docs/apps.md and WT/tools/oculus/docs/apps.md differ
Only in BASE/tools/oculus/docs: configuration.md
Only in BASE/tools/oculus/docs: debugging.md
Only in BASE/tools/oculus/docs: files-and-search.md
Only in BASE/tools/oculus/docs: source-control.md
Only in BASE/tools/oculus/docs: terminals.md
Only in BASE/tools/oculus/docs: views.md
Only in BASE/tools/oculus/docs: window.md
Files BASE/tools/oculus/src/lib/server/content/docs.ts and WT/tools/oculus/src/lib/server/content/docs.ts differ
Files BASE/tools/oculus/src/lib/views/shared/prose/doc-link.ts and WT/tools/oculus/src/lib/views/shared/prose/doc-link.ts differ
Files BASE/tools/oculus/src/lib/views/sources/doc/Doc.svelte and WT/tools/oculus/src/lib/views/sources/doc/Doc.svelte differ
Files BASE/tools/oculus/src/lib/views/system/help/Help.svelte and WT/tools/oculus/src/lib/views/system/help/Help.svelte differ
Files BASE/tools/oculus/tests/checks/config/config-folder.test.ts and WT/tools/oculus/tests/checks/config/config-folder.test.ts differ
Files BASE/tools/oculus/tests/checks/source/history.test.ts and WT/tools/oculus/tests/checks/source/history.test.ts differ
```

Line counts after the last change are in section 10 (`wc.log`). The base had `HELP.md` 188 lines, the Apps guide 861 lines and DATA-MAP 519 lines (`wc -l`).

Names grepped across `src tests config docs HELP.md DESIGN.md README.md` (and `../../docs ../../.oculus`, `--exclude=local.yml`) after the last change: the case 2 grep of section 9.1 prints nothing.


## 13. Judgment calls and departures

1. **The dropped-sentence ledger uses three reason codes the brief does not name (`R`, `OBS`, `HIST`): a ruling is asked.** The brief's reasons are the screen says it (`S`), a list a view shows (`L`) and a spelling of a command git documents (`G`); the selection rule adds three classes it says not to keep (`A`, `T`, `X`). Section 2.3 lists every dropped sentence with its code (`A` 49, `G` 1, `HIST` 1, `L` 56, `OBS` 20, `R` 14, `S` 26, `T` 40, `X` 3). `R` is an internal route, path or code name; `HIST` is a sentence about an earlier release; `OBS` is navigation or placement behaviour a reader sees on first use and that no setting, ask, refusal or loss depends on. The recommended ruling is to accept all three. The other option is to send the 20 `OBS` rows back to be kept, which costs HELP.md lines it does not have (it stands at 450 of 450 lines). The lazy option would be to accept without reading the `OBS` rows, so they are listed here:

| Guide line | Sentence (start) |
|---|---|
| `window.md:21.2` | A catalogue the reader has moved onto a page of their own opens the view on that page. |
| `window.md:21.6` | Dragging an entry onto a pane of the page the catalogue is on opens it there; a unique view a page or float ho |
| `window.md:21.7` | An entry's right-click menu, or Shift+F10, offers Open on this page, which opens it in another pane of that pa |
| `window.md:21.8` | A view that was a tab of the catalogue's own pane moves out of it, and that pane goes on showing the catalogue |
| `window.md:21.9` | A view already open in another pane of that page is activated where it is. |
| `window.md:21.10` | A drop on the catalogue's own pane goes to another pane, so the catalogue is never covered, and it carries a u |
| `window.md:35.5` | A pane hidden by a maximised pane or folded away is shown, so the tab is seen, also when the page that holds i |
| `window.md:39.2` | Closing the active tab shows the tab the pane showed before it that is still open, else the tab that took its  |
| `window.md:88.7` | Pin Editor and Unpin Editor are among them, with Cmd-K Shift+Enter beside them, and act on the active tab of t |
| `views.md:7.10` | A subtask's, a follow-up's and a task's done is always shown. |
| `views.md:123.3` | Full screen also ends when the tab is hidden or the deck holds no slides. |
| `views.md:125.7` | Both windows draw the deck as saved, never a source tab's unsaved text, and redraw when it is saved; a current |
| `views.md:125.8` | Presenting belongs to the pane and goes on over a tab switch, a page switch and a pane added. |
| `views.md:125.11` | Presenter pressed again brings the audience window forward (in the desktop app it also loads the window's page |
| `views.md:129.2` | Edit Slide opens the slide's file in a source tab beside the pane at the slide's first line; for a summary or  |
| `views.md:133.8` | No other format is exported. |
| `views.md:145.3` | Add on the bar opens the leads file with a new lead dated today in its unsaved text. |
| `source-control.md:7.12` | Open File (HEAD) opens the version HEAD holds, for a Staged row and a Changes row alike, read-only in a source |
| `files-and-search.md:91.4` | The links follow the text of the tabs, so a key typed into a tab is a link before it is saved. |
| `files-and-search.md:144.1` | The cursor lands on the hit's line once the file has loaded, and a line past the end of the file lands on its  |

2. **One clause is not verified by a run.** HELP.md:25 says a document tab saved at a path the list no longer holds follows the entry carrying its label, or closes into the tab already showing that entry. The first half is the `moved: true` result of `followDoc` (section 4); the second half is the effect at `Doc.svelte:116-128` (`openElsewhere` finds another tab at the path of the entry, then `activateInstance` and `closeInstance`), which I read but did not run, because running it draws the view. Case 12 runs the saved-layout reader only. Not verified by a run.

3. **Nine backticked tokens of HELP.md are not found in `config/`, `src/` or the hub layer** (`keys_exist.py`, section 9.13). Each is a name that the code does not hold as text: `commit.gpgsign` and `pull.rebase` are git's own settings (HELP.md:397); `desktop.yml`, `statusbar.yml` and `ui.yml` are files of `config/text/` (`ls config/text` lists `app.yml desktop.yml findings.yml server.yml statusbar.yml ui.yml views`), named by file name, which the scan does not look for; `microsoft.json` is built as `${provider}.json` (`src/lib/server/accounts/connect/store.ts:89`); `launch.json` is VS Code's file, named at HELP.md:377 as one whose keys are also taken; `pyproject.toml` and `pyrightconfig.json` are files the Python language server reads at HELP.md:311, carried from the base Files and search guide; I did not run the server to check that statement.

4. **The worked example of the Apps guide** holds 49 lines of code (55 with the fence lines), counted between `## A worked example` and `## When something goes wrong` of `docs/apps.md`; the brief's limit is 60.

5. **Section titles of the Apps guide are unnumbered words** (`## What an app is`, `## The manifest`, `## The bridge`), as the brief lists contents and not numbers. The base guide numbered them 1 to 11 and had a Quick start and a Connecting section, which the rewrite folds into the sections that remain (`diff` of the `##` and `###` headings, base against now).

6. **DATA-MAP's folder-table header `Shape` is `Scan`**, because the case 7 grep names `Shape\b` and the column holds the scan rule (`grep -n '^| Folder' docs/DATA-MAP.md` prints `| Folder | Scan | Holds | View |`).

7. **The head comments of `config/layout.yml` and `.oculus/config/layout.yml` are unchanged**: `diff <(grep '^#' base) <(grep '^#' now)` of `.oculus/config/layout.yml` prints nothing. The `docs:` list of that file has five entries; the base list also held the seven guides and `Design`.

8. **A sentence already in DATA-MAP before this step is untouched**: `the build is no longer run` (DATA-MAP:243, base :258) describes the `tools/present` build; it is existing text of the page and not a sentence of this step.


## 14. Visible changes for the landing look

No app, browser or dev server was started, so none of the changes below is seen by me; each row says what should differ on screen.

| Place | Before | After, to be seen at the landing look |
|---|---|---|
| The Help page's tabs | Help, Apps guide, Configuration guide, Source Control guide, Window guide, Views guide, Files and search guide, Terminals and commands guide, Debugging guide, Memories (`config/layout.yml` `help:` arrangement at the base) | Help, Apps guide, Memories (`config/layout.yml:92-93`, section 4, case 6) |
| The Views catalogue, Help group | the Help and Memories views, then 13 documents: Research approach, Agent approach, HPC how-to, Data map, Apps guide, the seven guides and Design | the Help and Memories views, then 5 documents: Research approach, Agent approach, HPC how-to, Data map, Apps guide (case 6, section 9.6) |
| The Help view | the manual of 188 lines with a sentence pointing to the guides | the manual of 450 lines holding the detail; the links from DESIGN.md and README.md land on its headings (case 5) |
| The key sheet's `h1-h9` row | names the guides | `h1-h9 \| open the manual, the Memories wall or a document of the Help page's group, its first nine`; HELP.md and `config/text/app.yml` print equal text (case 13) |
| A saved Help page holding a tab of a removed guide (Views guide, Window guide and the others) | the tab drew the guide | the tab keeps `{id, path, label}` (case 12); the pane title is the saved label and the body is the line of `config/text/views/sources/doc.yml:13` naming the path (`Doc.svelte:84-89`, `:169-170`) |
| A saved Help page holding the Design tab | the tab drew DESIGN.md | the same unlisted line as the row above, because `DESIGN.md` is a file only and no `docs:` entry names it (section 11, error 1) |
| DESIGN.md's diagrams | the Design tab drew the diagrams of `docs/diagrams/` that DESIGN.md embeds (9 embedded images, `grep -c '^!\[' DESIGN.md`; 15 lines name `diagrams/`) | no view of oculus draws them: the Files view opens DESIGN.md as source text, so the `![...](docs/diagrams/...)` lines show as text. This is the consequence of ruling (8), "DESIGN.md kept as a file only"; the drawings stay in `docs/diagrams/` and `npm run diagrams` still builds them (section 10) |
| The Apps guide tab | the 861-line guide with numbered sections, a Quick start and a Connecting section | the 349-line reference. Headings added: `What an app is`, `Where the files go`, `The manifest`, `Approval and change`, `The bridge`, `The handlers`, `Channel payloads`, `Refusal words`, `Reasons`, `Limits`, `What an app cannot do`, `A worked example`, `When something goes wrong`. Headings gone: `1. What an app is`, `2. Where the files go`, `3. Quick start`, `4. The manifest`, `5. Approval and change`, `6. The bridge`, `Connecting`, `The three handlers`, `7. Refusal words`, `8. Limits`, `9. What an app cannot do`, `10. A worked example`, `11. When something goes wrong`, `Reading a refusal in the browser console`. It holds no diagram (`grep -c -i diagram docs/apps.md` prints 0). Check at the landing look: the manifest, bridge, refusal-word and limits tables draw as tables, the channel payload section is present, the worked example is three fenced files, and the first link (`../HELP.md`) opens the Help view |
| The Data map tab | the 519-line page | the 579-line page. Headings added: `The hub's layer of oculus's configuration`, `project.yml fields`, `present.yml fields`. Headings gone: `oculus configuration files`, `Option files`. Check at the landing look: the three field tables (`project.yml fields`, `Side project fields`, `present.yml fields`) draw as tables, the folder-table header reads `Scan`, and the rows that pointed into oculus's own files are gone |
