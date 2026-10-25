# Oculus

Oculus shows the research hub's YAML and Markdown files as boards, lists and documents, in a browser tab or in its own app. It writes only where a control says so: back into the file a value came from, and files and folders you make from the Files view. `README.md` says how to run and check it; the [Apps guide](apps.md) says how to build an app; the [templates](templates.md) give every YAML file oculus reads and the file of each update task.

## Contents

[TOC]

---

## The window

- Oculus runs in a browser tab, or in its own app (`oculus.app`, the Linux folder of a release, or Electron from the checkout).
- The app starts the server and stops it when it quits; tmux terminals keep running. Started again, it opens its windows where they were.
- When the server ends on its own, a dialog says why and offers Restart. Open windows keep their pages, unsaved text and terminals, and reconnect.
- The app adds: windows that remember their place, floats that become windows, a native folder panel, a find bar, spelling suggestions, and the keys marked "in the app" under [The keys](#the-keys).
- In the app a link to another site opens in the default browser, and the presenter screen opens the audience window on another display when there is one.
- The app's menu bar holds oculus, File, Edit, View, Go, Run, Terminal, Window and Help.
- A menu item runs what its key or its palette command runs, in the window you are in, and shows that key.
- On macOS a key that holds neither Cmd nor Ctrl (`?`, F1, F5, F9, F10, F11) is shown on no menu item.
- Settings..., oculus Help and Keyboard Shortcuts open in the main window you used last.
- A menu item ending in "..." opens the palette typed with its command.
- Settings... opens Settings, and Open Folder... and Add Folder to Workspace... open the folder panel.
- Open Recent lists the recent workspaces, a file that is gone greyed out.
- Open in Browser opens the window's server in the default browser.
- A menu command that cannot run says why in a notice.
- No menu item runs while the palette, the update tray or a confirm is open.
- No menu item runs while the audience window of a presentation or an undocked DevTools window has the focus.

### On Linux and WSL2

- Oculus runs on Linux, and on Windows through WSL2, in a browser tab or as the app: `npm run app` from the checkout, or the Linux archive of a release, unpacked, started by its `oculus` program.
- The folder panel of Add Folder to Workspace and Open Folder is `zenity`. Without it the panel says that no folder panel is installed; the rest of oculus works.
- Open in Program, Open Folder and a link to another site go through `xdg-open`, and under WSL2 through `wslview`, so the program the desktop names for the file opens it. Reveal in Finder is Open Containing Folder there, as in VS Code, and opens the folder that holds the file. A `.desktop` file and a file with its execute bit set are refused, since opening one runs it.
- At start a missing `zenity` or opener is named, with the package that holds it (`zenity`, `xdg-utils`, `wslu`), in the terminal or in the app's start sheet; oculus starts all the same.
- A plain terminal runs the shell `SHELL` names, else `/bin/bash`.
- An app's secrets live in the keyring, which on Linux is the desktop's Secret Service. A machine with none says that the keyring is not available and stores nothing.

### The title bar

- A strip runs across the top of the window in the app. A page in a browser draws none: there Go Back, Go Forward, the dock toggles and the palette are reached through their keys and the palette, and every pane keeps its own Split Right and `...`. Left: Go Back and Go Forward. Middle: the Command Center, the open workspace's name (with its hub's name in front when the two differ); a press opens the palette, as Cmd+K does. Right: the three dock toggles.
- The Command Center is the strip's button that opens the palette. The Focus board's "Command center" is a different thing: the board's panel of what wants attention.
- Go Back and Go Forward walk the tabs you made active, on any page, pane or float, and in a source tab the places you jumped to (Go to Definition, a search result, a problem) and caret moves of more than 10 lines. Back or Forward to a closed tab opens it again in the page, pane or float it was closed from, at its place among the tabs there, while that page and pane are still there; otherwise it opens in the pane you are in on the page on screen. A step whose file is gone is skipped. Each window keeps its own last fifty steps until it reloads, and a button is disabled at either end. The keys are under [The keys](#the-keys); the palette has `:go-back` and `:go-forward`.
- Toggle Left Dock, Toggle Bottom Dock and Toggle Right Dock hide or show the float docked at that edge. A toggle is drawn pressed while its float shows and disabled when no float is docked there. Docking a float at a hidden edge, by drag or from a menu, or opening a view in its float, shows the edge again. Which edges are hidden is saved with the layout. The palette has `:toggle-left-dock`, `:toggle-bottom-dock` and `:toggle-right-dock`.
- With the options `show_tabs: none` and `editor_actions: strip`, set in Settings or the open workspace file's `settings:`, the active pane's Split Right and `...` stand in the strip, before the toggles, and no pane draws them in its own head; the strip's right-click menu names that place Title Bar. With a tab bar drawn they stay in the pane's tab bar, and in a browser, which has no strip, each pane draws them in a title row of its own.
- In the app the window has no title bar of the system's: the strip moves the window, the window buttons sit at its left on macOS and over its right end elsewhere, where they take the strip's colours of the theme on screen (no room is kept for them in full screen, where macOS hides them), and a double press on its empty part does what macOS's "Double-click a window's title bar to" setting says: zoom, minimise or nothing. The find bar opens under the strip.
- A float's window in the app has the same strip, with the name of the float's tab in the middle and no toggles; its Back and Forward walk that window's own steps. A browser tab opened for a float draws no strip.

### The rail

- One button per entry of the rail list in force: `rail:` in `config/defaults/layout.yml`, with the entries of the open workspace file's `settings:` laid over it by `page`. An entry is `{ label, glyph, page }`, where `page` names an arrangement under `arrangements:`.
- A button shows its page, made from the arrangement the first time and as you left it after that. Its badge is the sum of the counts its page's views give the rail, which are the views whose row of `counts` in `config/defaults/layout.yml` says `rail: true`: Projects, Supervision, Coauthor and Personal the count of their projects in the categories of `categories` in `config/catalogs/vocab.yml` that carry `rail: true` (in flight), in the colour of the first such category, Inbox, Repositories, Problems, Findings, Audit, the sessions the Session list shows as needing input, Funding, Education, Applications, Joint Work, Tasks and Talks & Events. Its tooltip names each count above zero, and the badge takes the most urgent of their colours, red before amber before green before any other colour, such as Funding's violet, or the accent when none has one. A page whose views count nothing shows the first mark among them, such as LinkedIn's overdue post. Every tab keeps its own count, and the views whose row says `rail: false`, Position Leads, Processes, Calendar, Live HPC, Archive and Software, count on their tabs only. A row's `tab: false` takes the count off the view's tabs.
- Drag a button to move it. Right-click it (or Shift+F10) to hide it, reset its page, or open the rail list in Settings. A move or a hide is written into the open workspace file's `settings:`, and History undoes it. Reset asks first.
- Every view sits on one rail page, or in the float (Live HPC, Usage, Workbenches). The Views catalogue lists them by group: each rail button is a group, with its `chord` letter and its heading glyph `group_glyph`, then the float of `nav_groups`; `docs` adds documents to a group.
- A click on a catalogue entry opens the view on the page you came from. A view that is already open somewhere is shown where it is. Shift-click opens it in a new pane to the right. The right-click menu has Open on this page and Open beside on this page; a view the page already holds is shown where it is by either.
- The Help page holds this manual, the Apps guide, the Templates and Palette pages, and the hub's documents (each `docs:` entry with `group: help`). A `docs:` entry whose `group` is another page's key becomes a tab of that page.
- A tab you closed stays closed; a document added to `docs:` later is added once. Reset puts every document back.
- The foot of the rail holds Workbenches and Update.

### Pages and the pane tree

- A page is a working surface: a tree of splits and panes, each pane a strip of tabs. The layout is saved as it changes, by the server into `~/.oculus/layouts.json`, one arrangement per workspace, and every browser tab and app window of one server shares it: two pages that change the layout at the same moment keep both changes.
- The Pages view lists every page with show, rename and close; a rail page also has Reset. Drag a page's row onto a pane's edge to show it there.
- Settings has Reset all pages: it rebuilds every rail page and the floats, and leaves your own pages and workbenches alone. It asks first, and about each tab with unsaved text; Save saves that tab first, and a save that fails stops the reset with nothing done.
- Twelve views exist once: Settings, Focus, Usage, Live HPC, Audit, Findings, History, Processes, Pages, Workbenches, Status and Apps. Opening one goes to wherever it is. Files, Search, Terminal and the session views can be open on several pages.
- Split a pane by dragging a tab onto its edge, or from the pane menu. Every drag has a menu equivalent; Shift+F10 opens the menu of the focused control.
- Show a page here... (pane menu) draws another page inside this one. It is the same page, so a tab opened in it is open everywhere that page shows.
- Float (pane menu or tab right-click), or a drag with Alt held, floats a pane over every page. Drag its strip to move it, its edges to resize it. Let go within 24 px of the left, right or bottom edge to dock it. Return to Page puts it back.
- A view opened for something (a project, a person, an entry, a document, a file, a diff) never covers the tool views. It lands, in this order: in a workbench's documents pane; in the pane that took the last such tab; in the pane you are in, if it holds such tabs; in an empty documents pane; in a new pane split off to the right.
- A pane from the arrangement stays, empty, when its last tab closes; a pane you split off closes with its last tab. Lock Group (pane right-click) makes a pane take no tab opened from elsewhere.
- Hide Tab Row (pane menu) hides that pane's tab row and its path bar, so the view fills the pane. They show again over the view while the pointer is at the pane's top edge or over the row, while a menu opened from the row or its path bar is open, while the focus is in the row and a key brought it there, and while a tab of the pane is dragged. With `editor_actions: hidden` the item is in the strip's right-click menu. Show Tab Row brings the row back. A pane that draws no tab row and no path bar does not offer it.
- The tabs a page starts with are pinned. Cmd+W on a pinned tab closes nothing; Close in its menu does. Pin and unpin from the tab's menu, Pin Editor in the palette, Cmd+K Shift+Enter in the editor, or by dragging into the pinned tabs.
- Reopen Closed Tab (Cmd+Shift+T in the app, `:reopen-closed-tab` in the palette) reopens the tabs the last close closed, in the pane you are in on the page on screen. The window keeps twenty until it reloads.
- A new tab opens right after the active one; closing the shown tab shows the one shown before it.
- The options `show_tabs` (`multiple`, `single`, `none`), `editor_actions` (`strip`, `hidden`) and `wrap_tabs` set the tab strip; Settings and the strip's right-click menu write them into the open workspace file's `settings:`.
- New Text File (right-click on a strip's empty part) opens an untitled text. Its first Save asks for a folder and a name.
- Open View (right-click on a strip's empty part or in an empty pane) lists the views the Views catalogue lists, so not a view opened only for something (a project, an entry, a file) and not the view of an app that is not active. It has a section per rail page in the rail's order, among them Apps with each app and the views your apps add, then Float with the float's views (Live HPC, Usage, Workbenches). A pick opens the view as a new tab of that pane. A view that exists once and is open somewhere names its page, or Floating pane, at the end of its row, and the pick shows it there.
- A tab showing a file draws its path as a breadcrumb. Press a folder to show it in Files; in a source tab the path goes on with the symbols around the caret.
- A dot in place of the close control means unsaved text. Closing that tab, its pane or its page asks whether to save it first. Save (the default, Enter) saves each such tab and closes the ones that saved; a tab whose save fails, or that has nothing to save it to (an untitled tab), stays open with its text. Don't Save closes and loses the text. Cancel or Escape keeps every tab and its text. Unsaved text survives a tab switch and a reload.
- While a tab holds unsaved text of a file, every control that would write that file is disabled, and any write to it is refused, so your text is never overwritten.
- The rail is one Tab stop; each tab strip is one, with its pane menu after it. Arrow keys move inside a strip.

### Workbenches

- A workbench is a page for one folder. Left: Files, Search, Repositories, Deposit (for a project with a deposit), the TeX view, Problems and the sessions list, each limited to the folder. Right: the documents pane. The arrangement is `workbench:` in `config/defaults/layout.yml`.
- Open Workbench is on a project card, a collection card whose `link` is a folder, an entry page, and a person's folder block; Open in New Files is on a folder or root in Files. A workbench for a project or entry opens that item first.
- A folder has at most one workbench. A limited tab says `In <root>/<path>` and has a control that widens it to the whole root.
- Workbenches, at the foot of the rail, lists the open ones; Manage Workbenches opens the Workbenches view.
- The Workbenches view (`w` then `3`) has Open (one row per open workbench, with its folder and branch) and Closed (kept layouts, last closed first). Reopen restores a kept layout; Forget drops it. New workbench opens one for a root, or for a folder picked in the folder panel.
- Closing a workbench keeps its layout (twenty at most). Reset layout rebuilds it from `workbench:`.

### The palette

- Cmd+K opens the palette outside the editor. In the editor Cmd+K starts the editor's chords, as in VS Code (Cmd+K, then Cmd+C comments the line), and Cmd+Shift+P, F1 and Cmd+P open the palette. Empty, the palette lists the views. A typed word matches fuzzily, letters in order (`rpls` finds RAW-PLS), across views, projects and entries.
- With a source tab on screen it also lists the editor's commands; with a Present tab, the slide commands.
- `:` starts a command. `:` and a number goes to that line. `:language`, `:interpreter`, `:compile-database`, `:theme`, `:file-icons`, `:tab` and `:goto` list what they choose from, the one in force marked; typing narrows the list. In `:theme` and `:file-icons` moving the selection shows each choice, Esc puts back the one in force, and Enter keeps the one chosen. `:theme` draws the themes under a heading per group, in the order Settings draws them: the arrow keys pass over the headings, and a group whose themes the typed words all leave out shows no heading.
- `:task-add <title>` adds a task with `status: todo` to the Tasks file of the hub that holds one. When more than one hub holds one, the palette then lists those hubs, the primary first and selected, and the hub pressed takes the task. Shift+Enter, at the title or at the hub, also opens it. History undoes it.
- Every command is listed in [the palette page](palette.md), written by `npm run docs:palette`.
- Cmd+P finds a file by name across the served folders (at most 200 rows). It lists hidden files, honours `.gitignore`, and skips `node_modules`, `.git` and `.svelte-kit`. `search.timeout_s` and `search.max_names` limit it.
- `#` (Cmd+T in the app) searches the workspace's symbols through the language server.
- In a float's own window the palette opens views and files in that window; a view that exists once goes to wherever it is.

### The update tray and schedules

- Update, at the foot of the rail, opens the tray: the schedules of `.oculus/schedules.yml` and the update tasks (Lit Watch, Scout, LinkedIn, Inbox). A task is a file of the primary hub, `.oculus/tasks/litwatch.md`, `scout.md`, `linkedin.md` or `inbox.md`, and runs as a Claude session in a terminal that is asked to follow that file step by step. The tray offers only the tasks whose file the hub holds, and says so in one line when it holds none; [templates](templates.md) has a template of each file. A task's row gives its last run ("Last run:", or "Last post:" for LinkedIn) and, after a bar, the schedule that runs it next ("Next:"). A pressed task, and a schedule's Run now, turn a sync glyph until the terminal opens or the refusal is said. Chat starts a Claude session over the portfolio, whose index holds the projects of every hub of the workspace and the files of the collections each hub's `chat_context` names.
- A schedule or a request that names a task whose file the primary hub lacks is refused and starts nothing, and the Focus board's refresh lines name only the tasks that have a file.
- A schedule runs a task, a command of a repository's `.oculus/commands.yml` or a prompt on a cron pattern, in local time. The dialog shows the next three runs before it saves.
- An entry is `name`, `runs` (`{ task: litwatch }`, `{ command: build, folder: ... }` or `{ prompt: "...", folder: ... }`), `when`, and optional `paused` and `unattended`. Without `when` it runs only from Run now. The template is in [templates](templates.md).
- You may edit the file by hand; the dialog, Pause and Resume change only their own keys and keep your comments.
- A run missed while oculus was stopped starts once when it starts again. A due run while the last one still works is skipped.
- Run unattended starts Claude with `--dangerously-skip-permissions`, so nobody is asked. A command never runs unattended.
- Schedule... on the right-click menu of an entry with a `run` opens the dialog on that command. The dialog lists the lines each run starts, the commands it depends on first, and Save approves them. A scheduled command runs only while its chain is approved: an entry of `commands.yml` written or changed by hand, or by a pull, runs on its schedule once its chain is approved through Edit or Schedule...; until then its due run starts nothing and the tray says why.
- A schedules file or run record (`~/.oculus/schedule.json`) that does not read stops every schedule, and the tray says so.

### The status bar and notifications

- The repository, branch and sync items follow one repository: the one holding the active tab's file, else the workbench's folder, else the one you picked from the repository item's list (`status_bar.repository`), else the hub's.
- Switching branch and Sync ask first. Sync pushes when only ahead, otherwise pulls then pushes; with no upstream it offers Publish Branch.
- The problems item toggles the Problems view. The debug item lists the launch configurations. Right-click the bar to hide or show any item; the hidden items are `status_bar.hidden`.
- In a source tab: the blame item opens the commit in the graph; the line and column open `:`; indentation, encoding and line ending convert the text; the language server item restarts or shows the server.
- The LaTeX item shows during a LaTeX tab or a build, and opens the TeX view. It turns amber while a build waits for your approval.
- When the bar is too narrow, every item stays drawn and the bar scrolls sideways: swipe, turn the wheel over it, or Tab to an item. It opens at its left end, with the right group following the left.
- The bell counts unread notifications. Do Not Disturb is `status_bar.quiet`, so it holds on every page and after a reload. A toast shows for eight seconds.
- The status bar's choices are options, written into the open workspace file's `settings:` like every option Settings sets; with no workspace file open, oculus offers Save Workspace As... and writes nothing.

## The keys

`?`, the palette's `:keys` and the app's Help > Keyboard Shortcuts open the Keyboard Shortcuts view, a tab of the Help page: every key the workbench, the palette, the editor, the LaTeX tab, the debugger, the desktop app (in the app) and the apps bind, with what it does, and a box that searches them. The editor's chords under Cmd+K are listed with their actions like its other keys. A letter then a digit opens a view: the letter is the group's `chord` (on its `rail:` entry, or in `nav_groups` for the float), the digit its place. The table below also holds the keys a control answers while it has the focus.

| Key | What it does |
|---|---|
| 1-9 / Ctrl+1-9 | show that rail page / that tab of the focused pane |
| Ctrl+] / Ctrl+[ | next / previous tab of the focused pane |
| Ctrl+Tab / Ctrl+Shift+Tab | next / previous tab (in the app) |
| Cmd+W | close the active tab, asking over unsaved text; on a pinned tab, show the first unpinned one (in the app) |
| Cmd+Shift+T | reopen the tabs closed last (in the app) |
| Ctrl+- / Ctrl+Shift+- | go back / forward through the tabs and places visited; off macOS back is Ctrl+Alt+- (in a terminal the program gets them) |
| Cmd+N; Cmd+Shift+N / Cmd+Shift+W; Cmd+,; Cmd+R | new text file; new window / close window; settings; reload (in the app) |
| Tab / Shift+Tab | move between controls; in an editor Tab indents, and Escape then Tab moves on |
| arrows, Home / End | along the rail or a tab strip |
| arrows, Home / End, a letter | in a tree: move a row, open or close a folder, first / last row, next row starting with that letter; Shift extends; Cmd+A selects every row |
| Delete | close the focused tab (not a pinned one) |
| f1, m1-m5, p1-p4, e1-e4, s1-s8, c1-c7, l1-l3, r1-r6, b1-b3, t1, y1-y9 | open a view of a group (f Focus, m Sessions, p Projects, e Incoming, s Explorer, c Academic Life, l Pillars, r Registries, b Literature, t Present, y System) |
| w1-w3 | Live HPC, Usage, Workbenches |
| a1-a9 | the Apps view, then the apps |
| h1-h9 | the Help page's tabs |
| j / k, J / K, i / o | move the card cursor left / right, move the card, cursor up / down a row |
| Enter | open what the cursor is on (a card, an Audit row, a Settings card, a row of Open Editors, Outline, Backlinks, Timeline, Bookmarks or Notes; a Tags row opens Search over the notes) |
| / | focus the board's search; in Search, back to the query box |
| Cmd+Shift+F / Cmd+Shift+H | Search / Search with replace |
| Enter; Up / Down | in a Search box: run; walk the last twenty texts |
| Esc / Enter | in a Files name box: cancel / accept |
| Esc | in Files: close the line of messages at its foot |
| Alt+Up / Alt+Down | move a root, bookmark, note or section of Files |
| g g / G | top / bottom of the page |
| n | new agent session in the page's Terminal tab |
| Cmd+S | save the source tab |
| Alt+Z | toggle word wrap |
| Cmd+Shift+M; F8 / Shift+F8 | Problems view; next / previous problem |
| Cmd+Shift+B / Cmd+Alt+T | default build / default test of the repository |
| Cmd+Alt+B / Cmd+Alt+C / Cmd+Alt+V | LaTeX build / clean / view PDF, in a `.tex`, `.sty` or `.cls` tab |
| Cmd+Alt+J | LaTeX: show the caret's line in the PDF, in a `.tex` tab |
| Cmd+click | in a PDF: open the source line |
| Cmd+Alt+M / Cmd+Alt+X | Math Preview, in a `.tex` tab / TeX view |
| Cmd+Alt+[ / Cmd+Alt+] | promote / demote sections, in a `.tex` tab |
| Enter / Alt+Enter | in a list environment: new `\item` / plain new line |
| Cmd+L, then Cmd+B, I, U, E, R, T, S, C, N, 6 or - | wrap in `\textbf`, `\textit`, `\underline`, `\emph`, `\textrm`, `\texttt`, `\textsl`, `\textsc`, `\textnormal`, `\textsuperscript`, `\textsubscript`, in a `.tex` or `.bib` tab |
| Cmd+L, then Cmd+Enter / Cmd+W | insert `\item` / surround with a command, in a `.tex` tab |
| Cmd+L, then Cmd+L / Ctrl+Shift+M | select the line / toggle whether Tab moves the focus, in a `.tex` tab; off macOS Ctrl+L, then Ctrl+M |
| Ctrl+Shift+M, then Cmd+B, I, R, T, S, Shift+B or C | wrap in `\mathbf`, `\mathit`, `\mathrm`, `\mathtt`, `\mathsf`, `\mathbb`, `\mathcal`, in a `.tex` or `.bib` tab |
| Shift+F10 | the right-click menu of the focused control |
| arrows, Enter, Escape | in a menu: move, open a submenu, go back |
| arrows | on a docked float's handle: resize it |
| Cmd+K | open the palette, or close it when open; in the editor, the first key of the editor's chords |
| Shift+Enter | palette, on `:task-add`: add and open |
| Cmd+P | find a file by name |
| Cmd+Shift+P, F1 | palette in command mode |
| Cmd+T | symbols of the workspace (in the app) |
| F2 | rename the symbol; on a hub key in YAML, rename it in every file; Cmd+Enter shows a Refactor Preview first |
| F12 / Cmd+click | go to definition; on a hub key, open its entry; on a Markdown link, follow it |
| Shift+F12 / Shift+Alt+F12 | links to a heading / all references and implementations |
| F4 / Shift+F4; Shift+Alt+H | next / previous reference; call hierarchy |
| Cmd+.; Shift+Alt+F; Shift+Alt+O; Alt+O | quick fix; format; organize imports; switch source and header |
| : | command line |
| Esc | clear the cursor |
| Alt+F5 / Shift+Alt+F5 | next / previous change |
| F5 | start or continue debugging |
| Shift+F5 / Cmd+Shift+F5 | stop / restart debugging |
| F9 | toggle a breakpoint |
| F10 / F11 / Shift+F11 | step over / into / out |
| Cmd+F | find in a terminal, or in the app's window for a view with no find of its own |
| Ctrl+Enter / Cmd+Enter | commit; send a diff comment |
| Cmd+Enter | on a Repositories row: open beside |
| Cmd+Alt+Enter / Cmd+Shift+1 / Cmd+Backspace | in Search: Replace All / replace the focused row / dismiss it |
| Enter | on a Problems row: open it |
| Enter, Tab, Up / Down | in the Debug Console: send, complete, history |
| arrows, Enter, Shift+Enter, Delete | on a terminal row: show / split / kill (twice) |
| F / P / O | in Present: full screen / presenter screen / overview |
| Space / Shift+Space | next / previous slide |

Off macOS, Cmd is Ctrl.

## The views

| Id | Name | What it is for |
|---|---|---|
| `focus` | Focus | What wants attention: deadlines, follow-ups, the week's ticker, the lanes, the career strategy. |
| `projects` | Projects | The research projects you lead that are not done, as cards or a list. |
| `supervision` | Supervision | The research projects you supervise and do not lead. |
| `coauthor` | Coauthor | The research projects you collaborate on, or that name others and not you. |
| `archive` | Archive | The research projects you lead that are done. |
| `personal` | Personal | The projects with `tier: personal`. |
| `software` | Software | The projects with `tier: software`. |
| `pillars` | Pillars | The research pillars and their projects. |
| `domains` | Domains | The application domains and their projects. |
| `map` | Map | The projects as a graph of what links them. |
| `venues` | Venues | The venue catalogue. |
| `data` | Data | The datasets. |
| `statements` | Statements | Reusable manuscript statements. |
| `people` | People | The people. |
| `organisations` | Organisations | The organisations. |
| `resources` | Resources | Clusters, machines and storage. |
| `files` | Files | The folders of the workspace, with Open Editors, Outline, Backlinks, Timeline, Bookmarks, Notes and Tags. |
| `repositories` | Repositories | VS Code's Source Control over every repository. |
| `search` | Search | A pattern across the files, with replace. |
| `references` | References | Find All References, implementations, call and type hierarchies, and the places that name a hub key. |
| `notes-graph` | Notes Graph | The notes of every hub as a graph: a node per note, an edge per `[[link]]`, filtered to one hub. |
| `latex` | TeX view | Commands, Structure and Math Symbols for the LaTeX file in front. |
| `problems` | Problems | Errors and warnings of language servers, commands, LaTeX builds and linters. |
| `debug` | Debug | The debugger: configurations, Variables, Watch, Call Stack, Breakpoints. |
| `debug-console` | Debug Console | The program's output, and expressions evaluated while paused. |
| `funding` | Funding | Funding schemes and applications. |
| `events` | Talks & Events | Talks and events. |
| `education` | Education & Service | Teaching and service. |
| `applications` | Applications | Position applications. |
| `joint-work` | Joint work | Work with one person each. |
| `tasks` | Tasks | Tasks. |
| `present` | Present | A deck, with overview, full screen, presenter screen and PDF export. |
| `radar` | Lit Watch | The literature radar. |
| `literature-search` | Literature search | One query to OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC and arXiv, and Web of Science and Scopus with keys. |
| `literature` | Literature | The papers kept, from the file of the `literature` collection. |
| `leads` | Position Leads | Position leads. |
| `inbox` | Inbox | Your mailboxes, with each thread's wish and a drafted answer. |
| `linkedin` | LinkedIn | Posts and post ideas. |
| `session-list` | Sessions | Every agent session on this machine, and oculus's terminals. |
| `session-detail` | Session | One session: Details, Changes, Agents. |
| `terminal` | Terminal | Terminals running Claude, Codex or a shell, inside tmux. |
| `transcript` | Transcript | One session's turns. |
| `timeline` | Timeline | One session's turns over time. |
| `status` | Status | The connection, the snapshot and oculus's line counts. |
| `findings` | Findings | Every problem found in the hub's files, with file and key. |
| `gallery` | Gallery | Every UI primitive with sample data. |
| `hpc` | Live HPC | The cluster queue and quota. |
| `usage` | Usage | What each agent account has spent. |
| `help` | Help | This manual. |
| `audit` | Audit | What the hub is missing: open markers, manifest gaps, and what breaks the conventions the hub's `audit:` sets. |
| `memories` | Memories | The photo wall of every hub. |
| `calendar` | Calendar | Your calendars, read-only. |
| `account-setup` | Account setup | Registering your own app at Google and Microsoft for calendar and mail. |
| `history` | History | Every write oculus made, newest first, with Undo. |
| `processes` | Processes | What oculus started, matching local processes, and app hosts, with Stop and Restart. |
| `catalogue` | Views | Every view and document by group, with its key. |
| `apps` | Apps | Every app, with its state, Add app from folder, Disable, Enable, Remove. |
| `settings` | Settings | Every option, with search. |
| `pages` | Pages | Every page, with New page. |
| `workbenches` | Workbenches | Open and closed workbenches. |

Views opened for one thing, and not in the catalogue: `project`, `person`, `entry`, `editor` (a project's form), `deposit`, `doc`, `math-preview`, `refactor-preview`, `source`, `document` (a local HTML file), `file` (a picture, a PDF, or a download), `slides`, `customization`, `repositories-diff`, `repositories-merge`, `markdown-preview` and `lsp-output`. A saved page that names a view oculus no longer has shows that tab as an unknown view and keeps the rest.

### Entries and their editor

- A card's title opens the entry's page: its editor, what refers to it, and, when its `link` is a folder of the hub, that folder's documents, files and sessions. A person opens the Person view.
- The editor has one control per field of the file's `schema:`. The key that names the entry cannot be edited. A venue's `name` can, and every project's `venue` stays.
- Save writes only the changed fields and keeps the file's other lines and comments. A refused field keeps what you typed and says why. Unsaved edits survive a tab switch and a reload.
- Add asks for the fields that name the new entry, writes it to the file of the hub that lists the collection in its `collections:` and opens its page. A taken key is refused. When more than one hub lists the collection, Add also asks which hub's file takes the entry, the primary chosen first. The Literature view's Add asks the same when it is given a DOI or an address.
- A field that picks people, a project's `lead:` and `collaborators:` and the Settings row `self`, offers Add person with the typed name when the name matches no person. It writes the person, with that name and a key made from it, to the people file of the hub of the record being edited (the primary hub for `self`) and picks them. History undoes it as it undoes an Add.
- A field whose schema line says `filter: true` is a filter in the bar beside the search: a select or tags field as chips of its values with their counts, a text field whose values are all whole numbers as a range (from, to), and any other text field as chips. The filters are kept per tab.
- Delete asks first and names everything that refers to the entry; those references become findings. History undoes it.
- The undo of an Add or a Delete, a lead's and a Lit Watch entry's Delete included, gives the file back as it was, quotes, empty fields and blank lines kept, while the file still holds what the write left. A file edited by hand since keeps the hand edit, and the entry is written back from its record.
- A card's status, deadline and date change on the card and are written at once.
- A card's Subtasks block adds, ticks, snoozes, edits and deletes the lines of `subtasks:`; Edit turns a line into a form with its text and its deadline. Its Follow-ups block does the same for `followup:`, a list of notes `{ do, after }`: Edit changes a note's text and its date, and Done takes the note out. A note stays off the Focus board until its `after:` date, and the card says "not until" while that date is ahead. A `followup:` that is not such a list holds no note and is a finding.
- Edit in File opens the file at the entry. Each view drawn from one file has a control, last in its toolbar, that opens the file.
- An entry with an empty or shared key cannot be written; Findings lists it.

### Notes on single views

- **Focus.** One page, top to bottom: the Career banner, the command center, the tasks, the quick add, the Awaiting box, the Funding | positions | teaching band, the lanes and the Idea lane. The Filter action in the header opens a list that stays open while you pick: Mine only, on at the start, which keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one; Role, the roles that have a field, all ticked, where unticking a role hides what you hold that role on; Tier, the words of `tiers:`, all ticked, which applies to projects only; and Hub, one row per hub, all ticked, drawn only while the workspace has more than one hub. Mine only and Role are drawn only while a person has `self: true`. Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice. The filter applies to the command center, the tasks, the Awaiting box, the band and the lanes. A calendar line, a lead, a refresh nudge and the Career banner are never hidden, and a collection entry is filtered by role only when its file's `schema:` declares `lead`, `collaborators` or `supervisors`. The Filter button is drawn pressed while the filter hides something, each section that hides rows says how many on its heading ("3 hidden"), and a lane the filter empties keeps its heading and its count. The tab keeps the choice, so a reload or a move of the tab keeps it. Each lane's heading draws its glyph, the `icon` of its row of `focus_lanes:`, and the Focus glyph for a row naming none or a name the glyph catalog lacks. A project sits on the lane its `stage:` gives: Run exploring, Push in-prep and submit-ready, Revise revision, Review submitted, Scope scoping, De-risk de-risking, Build building, and the Idea lane nascent, which takes a project of any tier. A project whose `status.chips` carry `blocked` or `parked` sits on Blocked or Backburner whatever its stage, and on Blocked when it carries both, unless its stage is done. A released, published, failed or stopped project sits on no lane, and one carrying `blocked` or `parked` is an audit finding naming the chip. A card draws its name alone on its first line, with its deadline and its menu, and under it its tags, each a glyph and its words with a tip naming its kind ("Stage: Submitted"), as a project board card draws its facts. The tags are every status mark its lane does not already say: its stage, unless the lane lists that stage alone, in the stage's colour, its form and its chips but the lane's own chip, each in its word's colour and a chip carrying `blocked` in red, each word once; then your role on the project, only while a person has `self: true`, and its tier, each unless its row of `roles:` or `tiers:` carries `unmarked: true` (oculus sets it on Lead and on `research`, and a hub may set it on any number of roles and tiers, or none); and the venue's short name, or its name when it has none, at a stage that carries `placed`, with the venue's whole name in the tip. Every tag is drawn, the tags wrapping onto further lines when the card is narrow, and a long venue name is cut with an ellipsis. Under the tags a card says whom it waits on, the people and projects its `waiting-on:` names, or Blocked while a chip carries `blocked`; a submitted project's review is said only in the Awaiting box. Dropping a card on a lane, or picking the lane in the card's menu, writes what puts it there: onto Blocked or Backburner that lane's chip, with the other lane's chip taken off and the stage kept; onto any other lane the lane's first stage when the lane does not hold the card's stage, with `blocked` and `parked` taken off. The card's menu offers only the lanes it may go to, so a done project has no Blocked or Backburner lane. A move that changes both the stage and the chips is two changes, and one Undo takes back one of them. A project whose stage is in flight or an idea and that no lane takes, which happens only when a hub's `focus_lanes:` leaves its stage out, is named in the command center's Needs attention group, with a link that opens it. Deadlines, due follow-ups and open subtasks are lines of the ticker. Done on a follow-up line takes that note out of its list, and the quick add appends a note to the list of the project it names. A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and an entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks. A dated deadline stays while it lies inside `deadline_horizon_days` of `focus:` and until the project's stage carries `deadline_met` (`submitted`). A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown. A task line has an `agent` button that opens the composer with the task. The Awaiting box has one row per kind that has something (Waiting on, Under review, Applications, Grants, Blocked), and a name waited on more than once carries its count, as in "BSPC (2)". The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in "3 in review, 2 in flight", then Funding obtained. A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file does not hold the entry the board's outcome line says so. Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. A Track record role row opens the first board of `boards:` that takes the role, so Lead opens Projects, Supervisor Supervision and Collaborator Coauthor, and Funding obtained opens the Funding view; these rows carry no button. The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.
- **Projects.** `+ new idea`, on a project board that takes the project it writes (the board's first tier, you in the field below, the first stage carrying `new_idea`, no chip and no form; with the shipped boards every board but Archive, which takes done work), asks for an id, title, short handle, domain, description and folder (from `new_project_dir`, keyed by tier, inside a `scan:` folder), and writes `<folder>/<id>/project.yml` with a README, the board's tier and, while a person has `self: true`, you in the field of the board's first role that has one (`lead:` on Projects, `supervisors:` on Supervision, `collaborators:` on Coauthor), or on a board naming no `role:` in the field of the first row of `roles:` that has one (`lead:` on Personal and Software), so the new project shows on the board it was made on. With more than one hub in the workspace it also asks the hub, the primary first and chosen; the domains offered are that hub's, and the folder starts empty for a hub other than the primary, which then takes the folder its own `new_project_dir` names for the tier and refuses when it names none. Lit Watch's new project asks the hub the same way and names you as `lead:`.
- **A project card.** A card on a board is always drawn closed. Its title, its Open project page action and Enter on the keyboard cursor open the project page beside the board as a preview tab. The project page lands in the first of these panes of the page the board is on: on a workbench, its documents pane; the pane holding the project page or document opened there last, while that tab is still open; an empty pane, an empty documents pane before an empty terminals pane; a pane holding only tabs opened this way, such as project pages and documents; and else a new pane split right of the board. Apart from a workbench's documents pane, a pane holding a tool view, such as Files or Terminal, is not taken, and a locked pane and the board's own pane never are. A preview tab already in the pane the page lands in is replaced, so the next project opened from the board takes that preview tab. A project page you typed in, double-clicked on its tab or opened a second time is kept, and the next project opens in a new preview tab beside it. Under the pointer a card draws Ask, Open Workbench (when its hub is served) and, on a board, Open project page, then "...". Its menu, and the menu a right-click or Shift+F10 opens on the card, lists every action: under Open, Project Page (on a board), Folder, Show in Files, Workbench (when served) and Presentation (when the project has a deck); under Add, Subtask and Follow-up, which open their forms on the card whether or not the project has any, on a board the form alone, without the lines already there; then Ask, Edit Manifest, Pin to Top (Unpin while pinned), Copy Context, Deposit (on the project page) and Clone, or the folder the repository is cloned in. A card's top row says what the project is, each fact with its glyph and, on hover, a title naming its kind: Lead ("Role: Lead"), its Focus lane ("Focus lane: Review"), its form ("Form: journal article") and its chips ("Status: parked (not being worked)"), a chip carrying `blocked` in red, its code status ("Code: deposited"), Reproduced, each compute resource ("Compute: " and its name), and last the name of the project's folder, its whole path in its tip, which opens the folder. Under it come the labelled lines: WAITING ON, an amber tag for each value of `waiting-on:` (a person opens the Person view, a project opens it, and a value that names neither is shown as written), and BLOCKED in red while a chip carries `blocked`, each drawn when it holds, then Funding, Pillars, Datasets, Team, Related and Venue, with its whole text. The ELI5 follows, and NEXT, the first sentence of `next`, drawn the same way.
- **The project page.** Its card draws the project's blocks in two columns: STATUS, LATEST, NEXT (the whole `next`), RESULTS, OUTCOME and IDEAS / AVENUES on the left, REPRODUCED, DISSEMINATED IN, FILES, SUBTASKS and FOLLOW-UPS on the right; in a pane too narrow for two columns the right column goes under the left. The FILES block lists the files of the extensions in `file_index.ext`. On the project page the card has no Open project page action, and its title opens the project's tab.
- **A project's team.** A card's Team tags and a board list's With column name the people of the project's `lead:`, then those of its `collaborators:`, then those of its `supervisors:`, by their names in the people file and without you, the person `self` names; the With cell reads "with" and the names. A project whose team is only you shows no Team tags and an empty With cell. The Map's team toggle draws the same people, and the search finds a project by any person of its team, you included.
- **Boards, categories and roles.** A project shows on every board of `boards` in `config/defaults/layout.yml` whose keys it meets (its `tier`, your `role` on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field), and opens from elsewhere on the first of them. Your role on a project is the first row of `roles` in `vocab.yml` whose field holds the person with `self: true`: Lead (`lead:`), Supervisor (`supervisors:`), Collaborator (`collaborators:`), and Other for a project that names people but not you. A project's category is the first row of `categories` in `vocab.yml` that holds it: in review, in flight, idea, publications, other outputs, released, dead-ends. The cards and the list draw one section per category the board holds, in that order, each under a heading with the category's label in its colour and its count, the projects in no category under "other" last; a press on a heading's fold control folds its section, the board remembers the folded sections, and a heading stays at the top of the pane while its section scrolls under it. A board's `cards: grid` draws one section with no heading instead. The slices of the bar's second line split the same categories by stage, or by form for publications and other outputs. While a person has `self: true`, each board draws the Role group, which counts the cards under each role, and a Lead badge on a card you lead, and a project board draws the Mine only toggle, on by default, which keeps the projects naming you in `lead:`, `collaborators:` or `supervisors:` and those naming no one; on a board where every project is kept by it, it is drawn disabled, its tip saying every project here is yours, and is not applied. A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet and the Lead badge over its entries. While the workspace has more than one hub, a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries, and the tab keeps the choice. With one hub no chip is drawn and a choice kept earlier hides nothing. A project no board takes, a manifest without `lead:` and a project with a `tier` that is no word of `tiers` are findings.
- **A project board's bar.** It has two lines. The first holds the search, the stale toggle, the deadline toggle with how many of the board's projects carry a deadline ("deadline 3"), Mine only while a person has `self: true`, then a button for each group that has values: Form, Situation (the project's chips), Role, Year, Domain, Venue and, while the workspace has more than one hub, Hub, which lists the hubs, the primary first, and keeps the projects of the hubs picked (a project's hub is the hub it was read from; with one hub the group is not drawn and a hub picked earlier hides nothing), then More, which holds Pillar, Funding, Datasets, Compute, Reproduced, Code and Sessions. A button reads its group's name, or, while values are picked, the first of them and how many more ("Form: journal article +1"); More reads how many of its values are picked. The buttons that do not fit in the line's width move into More, the last first. The second line holds the slices: for each category the board holds, its label in small capitals in its colour, then a chip per stage of its projects, or per form for publications and other outputs, with its words and its count ("journal article 9"). A press on a slice picks it or takes it out, and a press on a category's label picks every slice of it, or takes them all out when all are picked; the slices that do not fit fold into a "+n" button that lists them and reads how many of them are picked ("+5, 1 picked"). The line ends with how many projects the board holds ("16 projects"), or how many are shown while a filter, a toggle or the search hides some ("5 of 16 shown"), and, while a value is picked, Clear all, which takes every picked value out, the slices included, and leaves the search and the toggles as they are.
- **The group lists.** A group's button opens a list with a search field at its top, then the values, each with a dot in its colour, its words and its count, the picked ones ticked. Typing filters the values by their words, the arrows move, a press or Enter picks or unpicks a value and the list stays open, and Escape or a press outside closes it. More's list heads each group with its name, and the Venue list draws a bar behind each count, as long as the count against the largest. A pick keeps the projects at any of the picked values; with nothing picked in a group, that group keeps every project. A picked value is drawn filled in its colour: a slice in its stage's, a slice of publications or other outputs in its category's, a domain or a pillar in its own, any other value in its group's.
- **The counts.** Each value's count is how many projects the search, the stale, deadline and Mine only toggles and every other group leave at that value, so a group's own pick does not change its counts. A value the other filters leave no project for reads 0 and keeps its place, and a picked value no project holds any more is listed at 0, so it can be taken out. The counts on the controls are taken over the board's projects before any filter: the deadline toggle's, a red badge on Situation with how many projects are blocked ("2 blocked"), and an amber mark on Venue while a venue has at least `venue_conc_warn` of `focus:` projects at a live stage, its tip naming the venue ("BSPC: 5 live projects, the warning is 4").
- **The list.** In list mode each section is a table of its own under its heading, each row one line high, a cell cut short showing its whole text on hover. The columns are the board's `columns`, by default Project, Stage, Venue, Lane, Next (the first sentence of `next`) and With; the Columns menu in the header shows or hides any of them and Domain, Pillar and Funding, Project always shown, and the board remembers the choice. The columns that do not fit in the list's width are left out from the right, so nothing scrolls sideways.
- **The board's header.** After New project come Cards and List, the one in force pressed, Full titles, pressed while the cards and rows show full titles instead of short handles, and, in list mode, Columns.
- **Personal and Software.** A personal or software project has the same card as any project. A repository is a project once it is a folder of the workspace holding `.oculus/project.yml`. When the manifest's `repository.url` is not cloned anywhere, the card offers Clone.
- **Deposit.** Every project has one. It keeps a mirror clone under `~/.oculus/deposits`, synced from the project's `code/`, with sync, commit, push, snapshot, branches, Fetch, and the diffs against `origin/main`.
- **Map.** Press a node to fix it, drag to move it; re-tune lays the map out again. The map fills the pane. A link drawn in link mode, a project added or taken away and a pane resized leave the other nodes where they are; a new project is placed beside the nodes it links to. A label with no room on the right of its node sits on its left. A label that would cross another label, a node or a line, or that would be cut by the pane's edge, shows when its node is hovered or focused.
- **Data.** A card shows the dataset's folder (`path:`), its notes and how it comes back. A set whose sources are all downloads has a Recover control; a library set, a set to ask its owner for and a set built from another show the call, the contact, or the sets and the script instead.
  - Recover opens the dataset's Recover view beside the Data view. Choose This Mac or Cluster at the top; the folder and its free space are shown there. When the cluster does not answer over ssh, the view says so and offers Retry.
  - The plan lists every file the sources list, with its size, its checksum and its state: verified, present, partial, different or missing.
  - Fetch downloads every missing, partial or different file, and a partial file resumes. The row's own Fetch downloads that file alone.
  - Fetch is disabled until access is set up for a credentialed PhysioNet set, a Kaggle set or a Synapse set: add the row the view shows under `downloads:` in the primary hub's `.oculus/local.yml`.
  - Verify checks every file against its source's checksum. Unpack opens the archives of a source marked `unpack: true`.
  - A source can name a `folder` inside its archives: Unpack places only that folder's contents in the archive's folder, and an archive without it is not unpacked.
  - An archive 7-Zip ends with an error is not unpacked, and the log names the code; a 7-Zip warning is logged and the archive is unpacked.
  - Stop ends this dataset's run. A run goes on when the view or the window closes; open the view again to see it.
  - While a run goes the view follows it live: the server pushes its state, the bytes its folder holds with their rate and the log, every three seconds on this Mac, with the bytes and rate of each file, and on the cluster once a minute and at each Live HPC poll. The plan, the sources and the access are read when the view opens and again after a press or the refresh control.
  - The log under the plan lists every request, command and result with its time. On the cluster the download runs on the login node and Live HPC's Login node section lists it; Verify and Unpack there are sbatch jobs.
- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key.
- **Literature search.** Sends the query only to the sources that are on. Results with one DOI, PubMed id or arXiv id merge. Copy BibTeX writes no file. Add to Lit Watch and Save to Literature are the writes.
- **Literature.** The papers kept, one entry each, keyed by citation key: the first author's surname, the year and the first word of the title (`faes2024blockterm`), with `b`, `c` and on added when the key is taken. Save to Literature on a Literature search card and on a Lit Watch card writes the paper to the Literature file of a hub that holds one, named in its settings or at the engine's path: with more than one, the button opens a menu of those hubs, the primary first, and the hub picked takes it; with one, the press saves there. It says under the button what the save answered, and is undoable in History; a card whose paper any of those hubs holds reads In Literature. A paper with the DOI of one already kept, or with the title of one when either has no DOI, is refused. Add asks for one value: a DOI or its doi.org address, an arXiv id or address, or a PubMed id or address is looked up through the sources the search asks and saved, and any other address is saved as it is with a key made from its last path word. When every source fails nothing is saved and Add names them; an empty answer asks for the new entry's key, as Add does on every collection. A venue that names an entry of the venues registry opens it. Copy BibTeX on an entry, and in the toolbar for the entries shown, fetches each entry's BibTeX by DOI or makes it from the fields, under the entry's own key, and says how many were copied and which were not.
- **Person.** The "this is me" button marks who you are. It is pressed on your own person, and pressing it on another person of the primary hub writes that person's key to `self` in the open workspace file's `settings:`, undoable in History. The Settings row `self` sets the same key from a list of the people, and clears it. A person of another hub has no button.
- **Position Leads.** `applied` opens a new Applications entry filled from the lead and marks the lead applied. When more than one hub holds Applications, `applied` is a menu of those hubs, the primary first, and the entry goes to the Applications file of the hub picked. `decline` marks it declined; reopen undoes that.
- **Inbox.** Send and Archive are the only writes to a mailbox, each after a confirmation. No draft is made at the provider. Refresh now, here and on the Calendar, turns its glyph until that refresh answers.
- **LinkedIn.** One file per post in `linkedin_dir`. Add asks for a title and a category and opens the new file.
- **Session.** Details, Changes (the git state of the session's folder) and Agents (its subagents). A tab that pins no session shows the one it showed before a reload. Pin in Details offers the areas first and then every project of every hub of the workspace, grouped by hub, whether a session touched it or not. A press on an agent row opens that agent's own transcript in a Transcript tab; a row whose transcript cannot be read opens nothing and says why in its tooltip: "This agent's own transcript is not available."
- **Live HPC.** The cluster is `slurm.resource` of the hub's `config.yml`; the host is `hpc_host` of `local.yml`, else the cluster entry's `host`. It runs `squeue`, `sacct` and `sinfo` over ssh every `slurm.poll_min` minutes. Submit Job (on a `.slurm` file) shows its plan (folders, rsync arguments, the `sbatch` command) before it runs, and warns when the script does not use `/local/$SLURM_JOB_ID`. Its glyph turns while the plan is prepared and again while the job is sent. It never uses rsync `--delete`. Cancel runs `scancel`. The Login node section lists the Recover downloads that run on the login node, with the bytes each folder holds and its rate, and follows them live: the same poll reads them, and once a minute while a Recover run on the cluster is followed, so opening the section sends no request.
- **Processes.** Lists terminals, processes matching `processes.patterns`, and app hosts. Stop asks first. Its tab counts the programs it lists as running: the processes in its table and the app hosts that are running or starting.
- **Usage.** Refreshed every `usage_refresh_min` minutes. Refresh on a Claude account turns its glyph until that refresh answers, and stays shown on its card, turning, until then.
- **Audit.** The conventions a hub sets under `audit:` in its `.oculus/config.yml` are each off until set, and Settings lists them under Audit checks. Mute writes a finding's signature to `audit_ignore:` in the open workspace file's `settings:`.
- **Memories.** The wall shows the pictures of the memories folder and of every folder under it, by their path in the folder; a folder whose name starts with a dot, and a link to a folder, are not read. Add takes a JPEG or PNG and puts it in the folder itself. The wallpaper folder is read the same way, and `wallpaper:` names a picture by `<hub name>/<file path>`.
- **Settings.** Each control writes your value into the open workspace file's `settings:` as you set it, keeps the file's comments, and is undoable in History; with no workspace file open it offers Save Workspace As... and writes nothing. A key of the hub's list is written to the primary hub's `.oculus/config.yml`, and oculus's own files are never written. A value differing from oculus's is marked Modified, and Reset takes your value out of its file. A list or map is written as you see it, and an entry of oculus's you remove or hide is written as `removed: true` (a list) or `null` (a map), so it stays out. Each heading has Open Settings File, which opens the workspace file, and Show Defaults, which opens oculus's defaults file to read only; Edit in a file opens the file at the key, adding the key with the value in force when the file lacks it. The `local.yml` keys are listed under This machine with their value in force. Search takes `@modified` and `@id:`.
- **Refactor Preview.** Shows a language server's edit before anything is written, one check per file and edit. Apply writes the checked edits; Discard writes nothing.
- **Problems.** The filter takes comma-separated terms: a word, a glob, or `!` to exclude. A press shows the place in a preview tab.
- **TeX view.** Follows the LaTeX file in front. A Math Symbol inserts its command. Math Preview (Cmd+Alt+M) renders the math at the caret.
- **References.** A press opens the location. A location in a library opens a read-only tab.

### LaTeX builds

- A file builds through its root: a `% !TEX root = <path>` comment, else the file itself if it has `\documentclass`, else the main file that includes it, else the only main file of its folder.
- `% !TEX program = xelatex` or `lualatex` picks the engine; `% !LW recipe = <name>` picks a recipe. Recipes and tools are the options `latex.recipes` and `latex.tools`, with LaTeX Workshop's placeholders, set in the open workspace file's `settings:` over oculus's `config/defaults/behavior.yml`. `latex.out_dir` and `latex.aux_dir` set the output folders.
- A build runs in a terminal. A build that would read a `latexmkrc` or run document code (`Rscript`, `julia`, `pweave`, `quarto`, `R CMD Sweave`) waits until you approve it; a changed file asks again.
- `latex.auto_build`: `on_file_change` (default), `on_save` or `never`. `latex.auto_clean`, `latex.clean_and_retry` and `latex.texcount_autorun` do what their names say.
- A failed build posts a notice with Open Compiler Log and Show Problems; its errors go to Problems and the editor.
- The PDF opens in oculus's viewer and keeps its place per file. SyncTeX: Cmd+Alt+J goes from source to PDF, Cmd+click from PDF to source.
- In a LaTeX tab: hover shows math, pictures, `\ref` targets and package documentation; completion covers environments, sub- and superscripts, `\cite` keys and labels; the editing commands (matching environment, select, toggle display math, close, wrap, promote, demote) are each one undo.
- texlab serves LaTeX and BibTeX tabs (install with `brew install texlab`). A `.bib` tab has Align and Sort. Citation Browser inserts `\cite{key}`. Count Words runs `texcount`.
- Format Document uses `latex.formatter`: `none` (default), `latexindent`, `tex-fmt` or `badness`.

## Files and the editor

- The Files view follows the disk within a couple of seconds. Show Hidden Files, Show Ignored Files and File Nesting are toggles of the view, kept per tab. A tab lists hidden files (dotfiles and the build folders) and the files git ignores until its menu turns them off. The file tree of a project card lists neither.
- A workspace is a file `.oculus/workspaces/<name>.yml` of a hub: `folders:` (each `{ name, path }`) and `primary:`. The template is in [templates](templates.md). With no workspace open, the workspace is unsaved and starts empty.
- The `...` menu and the palette (`:workspace`, `:workspace-save`, `:workspace-new`, `:workspace-close`, `:folder`) switch, save, make and close workspaces. Each workspace keeps its own pages.
- Add Folder to Workspace opens the folder panel; Remove Folder takes a folder out. From the palette, Open Folder and Add Folder to Workspace close the palette as the panel opens. Both keep the file's comments and are undoable. Drag folders to reorder them.
- A folder entry may set `repository_scan_depth` (0 up, -1 for no limit) for the Repositories view.
- The filter box matches names already read; Fuzzy Match matches letters in order.
- On a row: Enter or F2 renames, Cmd+Down opens, Cmd+Enter opens beside, Cmd+Backspace deletes, Cmd+C / X / V copy, cut and paste, Option+Cmd+C copies the path. A name with `/` makes the folders between.
- Show in Files on a card or a link opens Files at that folder or file.
- The star on a row bookmarks it in `.oculus/bookmarks.yml` of the primary hub. The Bookmarks section lists them: a file bookmark opens the file, a folder bookmark shows it in Files. Bookmarks can be renamed, removed and reordered.
- An app can add a badge and a colour to a row.
- Delete moves to the Trash after asking. Do not ask me again writes `files: { confirm_delete: false }` to the open workspace file's `settings:`.
- A file's icon sits where its sibling folders' arrows sit. `files: { file_icon_at_arrow: false }` in the workspace file's `settings:`, or the Settings toggle Files: File Icon At Arrow, lines it up with their icons instead, as VS Code does.
- Drag onto a folder to move (Option to copy). Files dragged in from the system upload.
- Every create, rename, move, copy, paste, upload and delete is undoable in History (Cmd+Z in Files). An undone delete restores files up to 5 MB.
- Before each save, the old text is kept in the local history (`~/.oculus/history`, 50 copies per file, none over 256 KB). The Timeline section lists those copies and the file's commits; Restore writes a copy back.
- A single click opens a preview tab (italic); typing, a double click or a second click keeps it.
- A file locked, too long, not UTF-8, or a version at a commit, opens read-only with a line saying why.
- Every text file opens in a source tab, unless an approved app's editor is the default for it.
- A save is atomic and refuses a file with a NUL byte or that is not UTF-8.
- When the file changes on disk: a tab with no unsaved text reloads it; a tab with unsaved text keeps it and says so, and its Save offers Compare, Overwrite and Revert.
- A deleted file keeps its tab, struck through; Save writes it again.
- `editor.autosave`: `off`, `after_delay` (`editor.autosave_delay_ms`) or `on_focus_change`.
- On save: `editor.trim_trailing_whitespace`, then the language's `format_on_save`, then `editor.final_newline`. One Cmd+Z undoes all of it.
- Indentation, word wrap and rulers come from, in order: the tab's own choice, the file, the repository's `.oculus/settings.yml`, `editor.languages`, the global keys. The template of `settings.yml` is in [templates](templates.md).

### Notes

- Notes are Markdown files in each hub's `.oculus/notes/`. The Notes section lists every hub's notes, one group per hub, with folders; `attachments/` shows as a folder and `order.json` (the order of the list) is hidden.
- New Note and New Folder on a group write into that hub; New Note on the head writes into the primary hub. A hub's notes folder is made with its first note.
- A note's name is its file name without `.md`. A name is refused when it is empty, starts with a dot, is over 200 characters, or holds a control character or one of `/ \ : [ ] # ^ |`. Two names that differ only in letter case or in how an accent is encoded are the same name.
- Rename (F2), Move to Trash, a drag onto a folder and Undo work as for any file. Alt+Up / Alt+Down or a drag reorders notes in a folder; a note not yet ordered is listed first.
- A note saves itself 800 ms after the last edit (`notes.autosave_ms`), whatever `editor.autosave` says, and closing its tab saves it first.
- `[[name]]` links to a note of the same hub (`[[folder/name]]` when two folders hold one name), `[[name#heading]]` to a heading, and `[[name|words]]` shows the words. A link to a missing note is drawn dashed, and a press makes the note. A link never reaches another hub, and `[[...]]` in code is text.
- The Markdown server completes note names after `[[` and headings after `#`, goes to a note, and lists the links to it. Renaming or moving a note rewrites every `[[...]]` that names it in its hub, each in History; it is refused when a note it would rewrite is open in another page.
- `![[picture.png]]` shows a picture from the notes folder, `![[name]]` the text of another note, and `![[name#heading]]` that section. Inside a line of text the embedded note is shown as plain text, its other blocks as their source. An embed of its own note stops at the second level.
- A pasted picture is saved to `attachments/` as `Pasted image <yyyymmddhhmmss>.<ext>`, a dropped file under its own name, and `![[<name>]]` goes in at the caret. Files over 32 MB are refused.
- A tag is a `#word` in the text (letters, digits, `_`, `-`, `/`; not only digits; not in code, a link, a heading mark or an address) or an entry of the front matter's `tags:`. The Tags section lists every tag with its count, nested on `/`. A press on a tag opens Search over the notes of every hub, listing each place the tag stands.
- Backlinks lists the notes of the same hub that link to the note in front, with the lines that hold the links.
- The Notes Graph view (in the catalogue, or Graph on the Notes head) draws every note as a node and every link between notes as an edge; a press opens the note, and the menu filters to one hub.
- A code block of a rendered Markdown document has a Copy control at its top right, which puts the block's text on the clipboard and says Copied.
- In every Markdown preview, and in the text fields cards draw from a hub's files (a pillar's blurb, a venue's scope, a dataset's description), `$...$` and `$$...$$` are typeset with KaTeX. A formula KaTeX cannot typeset shows as red source. `$` in code and amounts like `$5 and $10` stay text.

### Language servers

- Python (pyright), C and C++ (clangd), TypeScript and JavaScript, Svelte, YAML, Markdown, and LaTeX and BibTeX (texlab) are served by a language server per folder. It stops 60 seconds after the last tab closes; the Markdown server a move in the Files view starts to update links, with no Markdown tab open, stays while the page is open and stops 60 seconds after the page closes. Restart is in the status bar's language menu.
- A server gives hover, go to definition, references, completion, signature help, diagnostics and the Outline; format, organize imports and hierarchies where it offers them. clangd also gives inlay hints, inactive regions and Switch Source/Header.
- pyright uses the repository's `.venv` or `venv`, else `python3`, else `:interpreter`. A repository's own interpreter runs only after you approve it.
- clangd uses the compile database the status bar names: a `compile_commands.json` at the root or in `build/*/`, or a configuration of `.oculus/cpp.yml` (template in [templates](templates.md)).
- The Svelte server runs a repository's `svelte.config.*` and `vite.config.*` only after `:svelte-config` approves them.
- The YAML server checks a hub file against its schema: undeclared keys, wrong values, keys that name nothing, missing required fields. `local.yml` is checked against the options catalog.
- The Markdown server marks links to missing files and renames a heading with its links. After a move in Files, it offers to update the links that broke, as a Refactor Preview. It also serves the notes in each hub's `.oculus/notes/`, and no other file under a dot folder.
- A definition outside the workspace opens in a read-only library tab.
- An edit a server makes to other files is one History record. It is refused whole if a file it names is open in another page, outside the workspace, in `secrets` or `~/.oculus`, over 5 MB, or changed on disk, or if it creates, renames or deletes a file.
- Apps can add languages and servers ([Apps guide](apps.md), The tools). When oculus and an app both serve a language, their lists are joined, and single answers come from oculus first.

### Hub keys in YAML

- In a hub YAML file, a value whose schema field has `from:` is a link: Cmd+click opens the entry, Find All References lists every place that names it.
- F2 renames a key in every file, after a Refactor Preview. It is refused for a project's folder name, a vocabulary word, an empty or taken key.

### Linters

- ChkTeX (`.tex`), Ruff (`.py`), ESLint (TypeScript, JavaScript, Svelte) and ShellCheck (`.sh`, `.bash`, `.slurm`) run on the saved file, never while typing. `lint.chktex`, `lint.ruff`, `lint.eslint`, `lint.shellcheck` and `lint.writing` switch them.
- The `lint.*_path` keys set where a program is. ESLint is the repository's own and runs only after you approve its configuration in `:eslint-config`.
- The writing rules warn on Markdown, YAML and comments: `em-dash`, `en-dash`, `curly-quote`, `ellipsis`, `arrow`, `nbsp`, `wrapped-paragraph`. `lint.writing_skip` lists globs to skip and `lint.writing_glyphs` globs of files where arrows are allowed; both are settings of the hub, empty until its `.oculus/config.yml` sets them. Fix All Writing Problems in Folder fixes many files at once, as one History record.
- A finding with a fix offers it in Quick Fix (Cmd+.), with Show documentation and a comment that silences it.
- The status bar shows `not found`, `failed`, `timed out` or `not approved` for a linter that did not run.

## Searching the files

- A pattern runs on Enter. `word`, `case` and `regex` decide what it means; without `case` it ignores case.
- It searches the workspace's folders with a local ripgrep. It skips ignored and hidden files, `node_modules`, `.git` and files over 2 MB. Find in Folder (Files menu) limits it to one folder, which is searched even when hidden or ignored. The notes in each hub's `.oculus/notes/` are searched too, listed under their hub; nothing else under a root's own `.oculus` is.
- `search.max_hits` and `search.timeout_s` limit it. A line with two matches is two rows.
- A running search draws a moving line above its results until it answers, in the Search view and in the Literature search.
- Replace: in regex mode `$0` to `$99` are groups, `\n` and `\t` escapes, and `\u`, `\U`, `\l`, `\L` change case. Preserve Case keeps the match's capitals.
- Replace All asks first. A file changed since the search, locked, binary or open with unsaved text is skipped and named. The whole replace is one History record.
- With the replace row shown, a press on a hit opens its Replace Preview, a diff beside the Search view.

## Terminals

- A Terminal tab holds terminals running Claude, Codex or a shell, in tmux, so they survive a server restart. A new tab shows the composer: workspace, agent, account, options, first prompt.
- New worktree, beside the composer's branch, is offered for a folder inside a repository Source Control watches. Type a name: Start makes `<root>/.agents/worktrees/<name>` on a new branch, as Source Control's New worktree does, then starts Claude, Codex or the shell there, in the same subfolder (a project's folder starts in that project's folder of the new worktree). Esc or a second press takes the choice back. A refused name or write starts nothing; a worktree made whose start failed stays picked, so Start again starts there. The folder list offers the folder the composer was opened in, and the new worktree's folder once it is made, until a start from that composer lands, even when no place lists either.
- An option that makes the agent ask less (Accept edits, Auto, Bypass permissions, Full access) asks first, every time. A value of `catalogs/agents.yml` with `confirm: true` asks too.
- A start from a hub task (a task's `agent` button, Start Agent) opens the composer in the task's folder with the task as prompt. The task's text runs only after Approve and Start, kept in `~/.oculus/approvals.json`; a changed text asks again.
- Once an agent runs, the steer box sends more text and Stop interrupts.
- From two terminals on, a list at the right names them. Split, Kill (two presses; a press elsewhere, inside an app's or a document's page included, Esc or four seconds take the first back), rename (double click). Drag a row to reorder it or move it to another tab. Attach to Session takes in a terminal no tab owns.
- Drag the list's left edge to size it; double click it for the default width. Narrow, it shows each terminal's icon alone. A pane too narrow for it draws it narrower, then as icons, then not at all: the bar names the shown terminal, and the header's terminals menu shows any other. A row's Split and Kill give way before its name.
- Kill stays where it is when its first press arms it, so the second press lands on it. The armed words take a line of their own under the row, wrapped to the list's width; a list narrowed to icons leaves them to the terminal's bar.
- Cmd+click opens a web address. A paste with a line break asks first. A file dropped from Files types its path.
- Change Icon lists each icon in words with its name beside it. Type to narrow the list by either.
- Closing a tab, pane or page ends its terminals, asking when one runs a program. Moving and reloading end none.
- A terminal scrolled up comes back at the lines it showed after a reload, a move to another pane, Float and Return to Page.
- A terminal given a new size (a pane or a window resized) is drawn again from what tmux holds, so the grid shows the lines tmux's pane holds at that size. A terminal scrolled up keeps its lines.
- The sessions list groups sessions by workspace: pinned first, then those that need input, then newest.

## Project commands

- A repository's commands come from `.oculus/commands.yml` and from what oculus finds (CMake presets, `package.json` scripts, `Makefile` targets).
- `commands.yml` is a list `commands:` of `name`, `run`, optional `cwd`, `depends_on` and `default` (`build` or `test`). The template is in [templates](templates.md).
- Add Command... on a repository's command bar adds an entry to the end of that repository's `commands.yml`, and makes the file from its template when there is none. The form lists the lines a press would run, the commands it depends on first; Save approves them, so the command runs without asking. Edit and Delete, on the right-click menu of an entry with a `run`, change only that entry and keep your comments and its other keys. A file that does not read is not written, and the form says why.
- Commands show above the commit box in Repositories, on a project card, and in Run Command on a folder in Files.
- `depends_on` runs each command of the chain once, in order, and stops at the first failure.
- `${file}`, `${fileDirname}`, `${fileBasename}`, `${fileBasenameNoExtension}`, `${lineNumber}`, `${selectedText}` and `${workspaceFolder}` reach the command as environment variables.
- A command runs only after you approve its exact text on this machine; a Save of the form, or of the schedule dialog that Schedule... opens, is that approval. A changed line, folder or `depends_on`, by hand or by a pull, asks again; an entry written or changed by hand runs on a schedule once its chain is approved through Edit or Schedule....
- The terminal stays after the command ends, with a check or a cross. Rerun and Restart run it again. A `file:line: error:` line opens that file.
- An app can add tasks and problem matchers ([Apps guide](apps.md)).

## Debugging

- The Debug view runs a `.rite` program under `rite_dap`, and other languages under an app's debugger. F9 sets a breakpoint, F5 starts; when it stops, Variables, Watch, Call Stack and the Debug Console show the state.
- Configurations are in the repository's `.oculus/launch.yml`. With none, F5 runs the `.rite` file on screen. The template is in [templates](templates.md):

```yaml
configurations:
    - name: Debug the open file
      program: ${file}
    - name: Benchmark
      program: utils/benchmark/fib.rite
      cwd: utils
      before: build
```

- `program` is a `.rite` path or uses `${file}`-style placeholders. `cwd` is a folder of the repository. `before` names a project command that runs first; if it fails, you choose Debug Anyway, Show Errors or Abort.
- `type` (`rite`, or an app's debugger) and `request` (`launch` or `attach`) are optional. An entry with a fault is left out and shown as a finding.
- Each launch of `rite_dap` asks first; the yes is kept. `rite_dap_bin` in `local.yml` names the adapter.
- One session at a time. Unsaved `.rite` tabs are saved first. Stop asks first.
- `rite_dap` has no pause, conditional breakpoints or Set Value; an app's debugger offers what it declares.
- Breakpoints and watches are kept in the browser.

## Apps

- An app is a folder of web files with an `app.yml`, drawn in a tab. A machine app lives in `.oculus/apps/<name>/` of the hub; a root app in `.oculus/apps/<name>/` of another folder of the workspace. The template is in [templates](templates.md).
- An app runs only after you approve it, and only while its files are the ones you approved. Keep approved while I edit lets you work on it.
- An app runs in a sandboxed frame with no access to your files. It reads the channels and makes the writes its manifest lists; every write is in the change log. A delete asks you first.
- An app with a host runs a program on this machine with your rights; the approval panel says so.
- The Apps page: the Apps view, with one row per app and its state, beside a pane where app tabs open.
- Disable and Enable (also per workspace) are in the app's menus. Remove (machine apps) moves the folder to the Trash and deletes its secrets.
- Add app from folder copies a folder into the apps folder.
- What an app adds (commands, keys, menus, status items, views, editors, settings, themes, display languages, languages, servers, debuggers, tasks, terminals, source controls, file badges) shows only while it is approved and enabled.
- An app's settings are written to `app_settings` of the hub's `config.yml`.
- No app can reach `~/.oculus`, oculus's `config/`, a hub's `secrets` folder or any `local.yml`.
- Limits are the options under `apps:`, set in the open workspace file's `settings:` over oculus's `config/defaults/behavior.yml`. The [Apps guide](apps.md) has the manifest, the bridge and an example.

## Source Control and worktrees

- Repositories lists the repositories of the workspace: its folders, the repositories below them down to `repository_scan_depth` levels (1 by default, at most 3), and cloned projects. An agent's worktree is listed under its repository's Worktrees.
- A commit made in a terminal shows within two seconds.
- Cmd+press and Shift+press select rows of a group. Stage, Unstage and Discard on a selected row, from its controls or its right-click menu, act on every selected row of the group, and so does Add to .gitignore from the menu; Discard asks once, naming how many. On a row outside the selection they act on that row, and the menu's open items open the row pressed. Every write runs from a press; discarding work, reaching a remote and committing ask first (not Fetch).
- These are fixed: Pull is plain `git pull`; Sync pulls then pushes; Fetch prunes; signing follows `commit.gpgsign`; a commit needs a configured name and email; Stage All never stages new files. Nothing force-pushes except a deposit's snapshot.
- `git.autofetch_minutes` fetches on a timer; 0 (default) never.
- The commit box keeps one message per repository. With nothing staged it becomes Sync Changes or Publish Branch. The button in the field writes a message from the staged diff.
- Hooks run. A write that runs them, and Stage All on Untracked, whose time grows with the files it stages, has no time limit; Cancel stops a running write. Other git commands time out after 10 seconds (60 for Fetch).
- While a commit, push, pull, fetch, sync, publish, checkout, merge or stash runs, or a commit message is written, a moving line is drawn under the repository's name in the Repositories list (under the section's head while the list is folded), and the repository's view says what runs ("Committing...", "Pushing...", "Writing the commit message..."); the Suggest glyph turns while the message is written. The status bar's sync item turns its glyph while a push, pull, fetch, sync or publish runs, as does its Publish Branch item while a publish runs, which takes no press until the publish answers. Any other write says "Working". Under the system's reduce-motion setting the line and the glyph stay still.
- A changed row opens its diff, side by side or inline, with the changes git finds. Each block is a hunk as `git add -p` offers it, with Stage Block, Revert Block (asks) and Unstage Block; a line selection narrows them. A file whose type changed (a file turned into a symbolic link, or back) reads T, type changed, and opens one diff that says which side is the file and which the link.
- A merge, pull or stash that stops on conflicts lists them under Merge Changes. The merge editor writes the Result; Complete Merge stages it.
- Stash, Stash (Include Untracked), Stash Staged; Apply, Pop, Drop. Create Tag, Delete Tag, Push Tags. Create, Delete and switch Branch; Checkout (Detached).
- The Graph shows the history of the branch and its upstream together, fifty commits at a time, each commit once: a commit only the upstream holds is marked incoming and one only the branch holds outgoing, each with a dashed circle. Incoming Changes and Outgoing Changes stand above their commits with their count, and a press on one lists the files changed over its whole range, each opening that range's diff. The checked-out branch and the local branches, the remote branches (with a cloud) and the branch's base are drawn in colours of their own; a tag is plain. Cherry Pick and the Compare commands are on a commit.
- Untracked lists every new file on its own row, a new folder's files under that folder in tree view; a repository inside the repository is one folder row, whose press shows it in Files. A group of more than 200 changes shows the first 200 under a warning that says so.
- Discard on an untracked file moves it to the Trash. Add to .gitignore appends the path.
- Open File (HEAD) on a Staged or Changes row opens the file as the last commit holds it, and Open File (Index) opens it as staged; both tabs are read-only, and an Index tab stays on the staged version across saves, reloads and new commits.
- Close Repository hides a repository from that tab; Reopen Closed Repositories brings it back. Open Worktree adds a worktree's folder to the workspace; Open Worktree in New Window also opens a new window.
- In a source tab the gutter marks changes; Blame shows who changed each line.
- New worktree makes `<root>/.agents/worktrees/<name>` on a new branch and opens a shell (or Claude, or Codex) there. Merging it back is `git merge`, refused with uncommitted changes. Removing it is a separate control and refuses uncommitted or untracked files.
- An app can add a source control as a row of its own.

## Configuration and the data

- Every setting is in one of four places: oculus's `config/defaults/` folder, which holds oculus's own values and is never written; the open workspace file's `settings:`, which holds your values and is where Settings and every control that sets an option write; a hub's `.oculus/config.yml`, for the keys of the hub; and a hub's `.oculus/local.yml`, for this machine's. A saved change applies at once, on every page.
- `config/` holds:
  - `defaults/appearance.yml`: the theme, the theme the app's window starts on (`app_theme`), the text size, the terminal themes' `rice.icons`, `rice.brackets` and `rice.monospace`, the theme list, the wallpaper and the CRT overlay, the code theme and the lists that shape its choice (`code_themes`), file icons, the terminal's look, the tab strip.
  - `defaults/behavior.yml`: thresholds, cadences and limits; `focus:` (the Focus horizons, the Command Center's categories and sources, the statuses the Focus columns count as open); the `editor`, `files`, `literature`, `apps`, `open`, `git`, `lint`, `latex`, `search`, `mail`, `calendar`, `changes`, `processes`, `status_bar` and Live HPC keys; `audit`, the conventions the audit holds a hub's projects to, which a hub sets in its `.oculus/config.yml`.
  - `defaults/layout.yml`: the rail, the arrangements, `workbench:`, `nav_groups`, `docs:`.
  - `defaults/sources.yml`: what the portfolio reads, and `languages:`, the map from file names to languages.
  - `defaults/present.yml`: `defaults.tag_tones` for every deck.
  - `options/`: one file per defaults file, one for `local.yml` and one for the workspace's words (`text.yml`), and under `options/catalogs/` and `options/schemas/` one per catalog or schema file a hub or a workspace sets (`vocab.yml`, the agents, file nesting, glyphs, icons, LaTeX tables, Unicode math, and `manifest-schema.yml` for a hub's form fields), describing every option (its help, heading, section and control) and each group of dotted options; Settings and the completion menu show these words.
  - `catalogs/`: the composer's agents, file nesting, glyphs, icons, LaTeX tables, Unicode math, and `vocab.yml` (the palette, `stages`, `forms`, `chips`, `statuses`, `lead_statuses`, `tiers`, `roles`, `categories`, `research_audit`, Focus lanes, venue tiers, radar buckets).
- Each word has one home in `vocab.yml`: a project's stage is a word of `stages`, the form of its output a word of `forms`, its chips words of `chips`, a collection entry's status a word of `statuses` and a Position Lead's a word of `lead_statuses`. What a word does is a flag on it: which stage is live, an idea, submitted or a dead end, which chip counts as blocked, which entry status is waiting or met. A word a hub adds behaves as its flags say. A status that is no word of its list is a finding naming the closest word when that word is within half the written word's length in single-letter changes, rounded down, and a stage word or a form written as a chip is a finding naming the field it belongs in.
  - `schemas/`: the forms of `project.yml`, a deck's `present.yml` and `cpp.yml`.
  - `text/`: every word on screen.
- A hub sets its own words in its `.oculus/config.yml` under the keys of `vocab.yml`, each laid over oculus's by its shape. A map (`palette`, `stages`, `forms`, `chips`, `statuses`, `lead_statuses`, `focus_lane_tones`, `facet_tones`, `tiers`, `research_audit`, `leads_fit`, `data_access`) is merged word by word: a word the hub names replaces oculus's in oculus's place, a new word comes after oculus's, and `<word>: null` takes one out. `categories` is merged row by row by `key` the same way, `{ key: idea, removed: true }` taking a row out. A word the hub's values no longer give, taken out with `<word>: null` or left out of a list the hub replaces whole such as `roles`, is also taken out of every word list that names it, each option and each field of an option's rows that the options of `config/options/` describe with a `from` naming that list (a category's stage words, a Focus lane's stages and chips, a funding stage's statuses, a count's `match`, a board's `tier` and `role`, `research_audit`'s `skip_tiers`): in oculus's own values a row left with no word stays and a single word of a field that takes a list becomes an empty list, and in a list or a row the hub writes itself each such word is a finding naming the hub's file at the word's place there, and the word is not read. Settings compares a value with oculus's as the hub reads it, so the removal draws no modified bar. `focus_lanes`, `fund_stages`, `roles`, `venue_categories`, `venue_tiers` and `radar_buckets` are replaced whole, since their order is their meaning. A null or a removal naming a word oculus does not hold, `removed` holding anything but `true`, and a word named twice are findings naming the hub's file and the key, and oculus's word stands.
- Each record is drawn in its own hub's words: a card of a hub that relabels `exploring` shows its label, and the same card of another hub shows oculus's. A list drawn over the records of several hubs (a board's slices, the filters, the legends) holds the words of every hub, the primary's first, then each other hub's in the workspace's order, each word once with the row of the first hub that holds it. A folder that is no hub is drawn in oculus's own words. With a primary, the records of such a folder are the primary's; with none, the lists take the hubs and each folder that is no hub, with oculus's words, in the workspace's order.
- A hub adds fields to the form of its own projects under `manifest_fields` in its `.oculus/config.yml`. A row is a field of the form with `field:`, the key of `project.yml` it adds, beside its `label`, `type`, `section`, `help` and, where its widget takes them, `from`, `options` and `required`. The field is drawn after oculus's fields of its section in the hub's order, and is a known key of that hub's manifests only. A row with no field, naming a field the form already has or an earlier row names, a section the form lacks, a type the form does not draw or a `from` that names no registry, `projects` or vocab list is a finding naming the hub's file, and the row is left out.
- Every option is described in its file under `config/options/` and set in Settings. A wrong value is a finding, and that option takes oculus's value. Settings writes a hub's words, its categories and its form fields to the primary hub's `.oculus/config.yml`, refused when the workspace has no primary, and a workspace's catalogs and words to the workspace file. A hub's words and a workspace's catalogs are written as what changed from oculus's: the words changed or added, a null or a removal for each of oculus's taken out, and nothing for a word as oculus ships it. Their rows have no Move, since the merge keeps oculus's order.
- `locale`, an option of `appearance.yml` set in the workspace file's `settings:`, is the display language: `en`, oculus's English words, or the `languageId` of a display language an approved, enabled app contributes by its `localizations` point ([Apps guide](apps.md)). The language's words are laid over oculus's English words, a word the language lacks is drawn in English, and the workspace's `text` is laid over both. A `locale` no approved, enabled app contributes is a finding naming the workspace file and `settings.locale`, and English is drawn; a key of a language file that oculus's catalog lacks is a finding naming the file, the language and the app, and the key is not used.
- The theme list is the `themes:` rows of `appearance.yml`; each row's `group` is the words of the heading it is drawn under, in Settings and in `:theme`, the rows with no group first, and an app's themes are drawn under the app's title. The Code theme choice reads a list of its own: the VS Code code themes are the rows of `code_themes.vscode` in `appearance.yml`, each a `class` with TextMate rules in `src/lib/themes/vscode-rules.json`, a `label` and a `group`, drawn under its group. Your workspace file adds, renames or takes out a code theme by its class in `code_themes.vscode` without changing the theme list, and a change to the theme list leaves the Code theme choice as it is. The Shiki code themes are the rows of `code_themes.shiki`, each an `id` of a theme Shiki bundles, a `label` and a `group`, drawn under its group; your workspace file renames, regroups or takes out a Shiki code theme by its id the same way, with `{ id: <id>, removed: true }` to take one out. In the app a window starts on the theme `theme` names, or on the theme `app_theme` names while `theme` names none it can draw, and is filled with that theme's background until its page draws; from then on the window is filled with the background of the theme its page draws. Either option may name an app's colour theme: when the app is approved and enabled and the theme's file resolves, the page draws it from its first paint and the app fills a new window with its background. For an app's theme whose app is not approved and enabled, or whose file does not resolve, the page draws the start theme, the one `app_theme` names in the app and the first theme of the list in a browser.
- The open workspace file's `settings:` holds keys as the defaults files hold them, with no file names: `code_theme: vscode-dark-2026`, `terminal: { font_px: 14 }`. It also sets the six catalogs under the key each holds in the merged config, `agents`, `patterns` (file nesting), `glyphs`, `icons`, `latex_editing` and `latex_unimath`, each laid over oculus's in oculus's place: a name the workspace names replaces oculus's entry where it stands, a new name comes after oculus's, `<name>: null` takes one out, and a Unicode math row is matched by its `command`, `{ command: mbfalpha, removed: true }` taking one out. An agent keeps every `confirm: true` oculus ships, and a start of a value the workspace adds or whose passed words it changes is asked about first. `text` replaces words of the interface by the dotted key of the text catalog (`text: { views.settings: Preferences }`); a key the catalog lacks, or a value that is no text, is a finding and the catalog's word stands. Any other value replaces oculus's whole, except a list whose entries have a key field (`rail` by `page`, `floats` by `view`, `themes`, `latex.recipes` and `latex.tools` by `name`, `code_themes.vscode` by `class`, `code_themes.shiki` by `id`, `focus.ticker_sources` by `collection`) and a map such as `arrangements` or `counts`, which override oculus's entries one by one: your entries come first in your order, then oculus's others. `{ page: focus, removed: true }` in such a list takes oculus's entry out, and `focus: null` in such a map takes oculus's key out. A key of a hub's `config.yml`, a key no option names and a value its option refuses are findings naming the workspace file and the key, and oculus's value stands. The template is in [templates](templates.md).
- In a YAML file the editor checks, Ctrl+Space completes the keys, each with its description: the options of the defaults files, a workspace file's `settings:`, a hub's `config.yml` and `local.yml`, the catalogs, the schemas and the hub's data files.
- Over a wallpaper, `wallpaper.panel_opacity` sets how solid the panes stay, from 0 to 1. `editor.opacity` sets the editor's share (a Source tab's editor and its read-only code window, the files of the Diff view, the Merge view) and `terminal.opacity` the Terminal view's, each on its own; a key left out, as the defaults leave both, takes `panel_opacity`. Settings lists them under Source editor and under the terminal's Display and keys, and a workspace file sets them as `editor: { opacity: 0.6 }` and `terminal: { opacity: 0.9 }`. A diff drawn inside another view, as the Deposit view draws one, takes that view's share, and an editor or a Terminal view inside a free float takes the float's.
- A hub's `.oculus/config.yml` may set exactly the keys listed in its template ([templates](templates.md)); any other key is a finding. A key of `vocab.yml` is laid over oculus's by its shape and `manifest_fields` adds its rows to the form, as above; any other key it sets replaces oculus's value whole, inside a map per dotted path. Its `collections:` names the file of each registry, card list and feed: `leads` and `radar` name the Position Leads and Lit Watch files.
- A hub sets the conventions the Audit holds its projects to under `audit:` in its `.oculus/config.yml`, each off until set. `required_files` lists the files a project must hold, each row requiring its file when every key it names is met: the project's stage meets `stages`, a word block of the stages (`{ not_flags: [terminal] }` holds every stage without the flag `terminal`, and a project with no stage), the project holds the folder `folder`, and it lies under one of the hub folders `folders`. `required_sections` lists the headings a file of a project must hold while a dotted key of its `project.yml` has a value: a list with an item, a text that is not empty, a number or `true`; a line holds the heading when it is the heading or starts with it and a space, so `## Data + reproduction` holds `## Data` and `## Database` does not. `stage_folders` lists the hub folders a project at the stages `stages` is kept under, matched by whole path segments. `website` names the website's publications feed (`file`), the key of each section's entries (`list`), the key of an entry's title (`title`) and the sections a project is expected in by its stage and form (`kinds`); every hub that sets it is checked against its own feed. A project of a tier `research_audit.skip_tiers` names is held to none of them, and a project of a workspace repository to no row that names hub folders and to no `stage_folders`. A part of `audit:` that is not of its shape is a finding naming the hub's `.oculus/config.yml` and the dotted key, and the rest runs. The template shows each key ([templates](templates.md)).
- A domain's card colour (`color`, `#rrggbb`) and label (`title`), and whether its active projects must list a dataset (`expects_datasets`), are fields of its entry in the domains registry. The theme words of venues and datasets are the options of the `themes` field of the venues and data registries, each a word or `{ key, label }`.
- A hub's `.oculus/local.yml` is this machine's: the port, `hpc_host`, the programs, the agent accounts, the calendar and mail accounts, the Literature keys, the download accounts, and where oculus keeps this machine's files. Every key has a default. It stays out of git, and only the primary hub's file is read (the account rows are joined over every hub). The keys are in its template.
- `commit_message_account` in `local.yml` names the Claude account the suggested commit message runs under: the label of a `claude` row of `accounts:` in any hub's file. Empty or absent, it runs on `~/.claude`; a label no Claude row holds is a finding and `~/.claude` is used. The run saves no session, so it is never listed in Sessions.
- The rest of `.oculus/` (bookmarks, workspaces, schedules, update tasks, data files, notes, apps, pictures) is listed in the Data map ([data map](data-map.md)).
- `~/.oculus/` is oculus's own state: the open workspace, the page state the server saves for every page (`layouts.json`, each workspace's arrangement and its unread copy; `layout-writes.json`, the last 500 layout writes; `views.json`, each tab's view state; `debug.json`, the debugger's breakpoints and watches), the change log, the local history, approvals, the language servers' folder, app stores, provider credentials. It is not for editing.
- The change log (`changes.jsonl`) records every write oculus makes; History undoes one. A file saved from a source tab, a note included, is not in it (its copy is in the local history). `changes.keep` sets how many are kept.
- A hub's data files, their keys and the views that show them are in the Data map ([data map](data-map.md)), a tab of the Help page. A collection's default file is under `.oculus/data/`, in the folder of its kind: `research`, `pillars`, `literature`, `people` or `academic`.
- A collection no hub of the workspace lists under `collections:` has no view: its tab is left out of its page, and a pane left with no tab names the missing key. The tab comes back when a hub lists the key.
- A hub's settings that name no `collections:` list take oculus's list, and the hub lists the collections whose file it holds at their default path.

### Hubs and projects

- A folder of the workspace with `.oculus/config.yml` is a hub. Every hub is read and merged into one portfolio. Every record, the primary's included, has the id `<hub>:<key>`, and a record of a hub other than the primary shows that hub's chip.
- A reference to a key names the record of that key in its own hub, and else the record of the one other hub that holds the key. A key that two other hubs hold and its own hub does not names no record, and the Audit reports it.
- A field that chooses records (a venue, a pillar, the people of a project) lists the records of the hub of the record it edits first, then those of the other hubs, each with its hub's chip.
- Renaming a key rewrites every reference that names the renamed record, in every hub, and leaves a reference that names another hub's record of the same key.
- The Audit checks each hub against its own records, and a finding of a hub other than the primary shows that hub's chip.
- Make Folder a Hub..., in the Files view's menu of a folder, opens a dialog of two groups. Hub files: `config.yml`, always written; `local.yml` with the `.oculus/.gitignore` that keeps it out of git, written readable by you alone; `schedules.yml`. Collections: a box per collection of the templates. Every box starts ticked, and each row says what the file or collection holds, with its path under that line. Make writes the folder's `.oculus/config.yml`, whose `collections:` names the ticked keys at their default paths under `.oculus/data/`, the ticked hub files, and each ticked collection's data file, each from its template in `docs/templates.md` with every key commented out. It writes over no file: when one of them is there, it says which and writes nothing. It is offered on a folder that is no hub, lies in no hub and is no project (it holds no `project.yml` and no `.oculus/project.yml`).
- Make Folder a Project writes the folder's `.oculus/project.yml` from its template. It is offered on a folder that is no hub and no project.
- Make Folder a Git Repository runs `git init` in the folder, with no dialog. It is offered on a folder or root with no `.git` of its own that lies inside no `.git` folder; a folder inside another repository becomes a repository of its own inside it.
- Add Repository Configuration..., on a repository (a folder of the workspace, or a folder holding `.git`) that lacks one of `.oculus/settings.yml`, `.oculus/commands.yml`, `.oculus/launch.yml` and `.oculus/cpp.yml`, opens a dialog with a row per file: a file that is there is shown as there, and each missing one is ticked. Add writes the ticked files from their templates, every entry commented out, so the repository reads as before until you fill one in.
- None of the four is offered on the home folder, on oculus's own folder `~/.oculus` or on a folder under it. History undoes a make, as it does New File, by moving what the make wrote, the `.git` folder of a git make included, to the Trash.
- A change goes to its own hub's file. A new record goes to the file of the hub that lists its collection, and Add asks which one when more than one hub does.
- A project is a folder holding `project.yml` or `.oculus/project.yml`, found by a `scan:` folder or as a folder of the workspace. Its id is the folder's name. Its `tier` is its kind (research, personal or software), its `stage` where it stands and its `form` the form of its output; its `lead:`, `collaborators:` and `supervisors:` name its people.
- A folder of the workspace is a project wherever it lies: inside a hub, inside a `scan:` folder or holding a hub. Each manifest is one project, so a folder whose manifest a hub's `scan:` folder already reads is that hub's project, with no second card. The folder stays a folder of the workspace either way, with its files, its git and its terminal, and an edit to the project writes the manifest it was read from.
- A project's `repository:` block (`url`, `visibility`, `description`, `homepage`, `topics`, `date`) says where its code lives. It counts as cloned wherever a repository of the workspace has that `url` as `origin`. A linked worktree counts as one clone with its main checkout, so a repository with worktrees is not reported as cloned twice.
- Clone (on a project) asks for a folder and checks the repository out there. `:clone` lists your GitHub repositories (through `gh`) and clones one into a folder you pick. Afterwards oculus asks: Open (the clone alone) or Add to Workspace. While a clone runs, its Clone control turns its glyph and a notice with a moving line says "Cloning <name>..."; clearing the notice does not stop the clone.
- oculus keeps one block in the hub's git `info/exclude`, between `# BEGIN nested-repos` and `# END nested-repos`, listing the repositories below the hub so the hub's git ignores them. Nothing else in that file changes.
- The `secrets` folder of every hub is private: no search, language server, linter fix or app reads it.

### Mail and calendar

- `calendars` and `mail` in `local.yml` list your accounts (`provider`: `google`, `microsoft`, or `ics` for a calendar link). Add account and Remove in the views write them.
- The first account of a provider opens Account setup, which saves your app's client to `~/.oculus/connect/`. Tokens and calendar links live in files with mode 0600 and are never shown or logged.
- The options `mail.poll_min`, `calendar.poll_min`, `calendar.days_back` and `calendar.days_ahead`, set in Settings or the open workspace file's `settings:`, set the polling.
- An Inbox thread is on your plate when it is unread in the inbox, labelled `todo`, or a single unlabelled message. The notes per thread are in `<mail_dir>/triage.json`, written by the card and by the Inbox update task.
