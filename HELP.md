# Oculus

Oculus shows the research hub's YAML and Markdown files as boards, lists and documents, in a browser tab or in its own app. It writes only where a control says so: back into the file a value came from, and files and folders you make from the Files view. `README.md` says how to run and check it; the [Apps guide](docs/apps.md) says how to build an app; the [templates](docs/templates.md) give every YAML file oculus reads.

## Contents

[TOC]

---

## The window

- Oculus runs in a browser tab, or in its own app (`oculus.app`, or Electron from the checkout).
- The app starts the server and stops it when it quits; tmux terminals keep running. Started again, it opens its windows where they were.
- When the server ends on its own, a dialog says why and offers Restart. Open windows keep their pages, unsaved text and terminals, and reconnect.
- The app adds: windows that remember their place, floats that become windows, a native folder panel, a find bar, spelling suggestions, and the keys marked "in the app" under [The keys](#the-keys).
- In the app a link to another site opens in the default browser, and the presenter screen opens the audience window on another display when there is one.

### The title bar

- A strip runs across the top of the window, in the app and in a browser. Left: Go Back and Go Forward. Middle: the Command Center, the open workspace's name (with its hub's name in front when the two differ); a press opens the palette, as Cmd+K does. Right: the three dock toggles.
- The Command Center is the strip's button that opens the palette. The Focus board's "Command center" is a different thing: the board's panel of what wants attention.
- Go Back and Go Forward walk the tabs you made active, on any page, pane or float, and in a source tab the places you jumped to (Go to Definition, a search result, a problem) and caret moves of more than 10 lines. Back or Forward to a closed tab opens it again in the page, pane or float it was closed from, at its place among the tabs there, while that page and pane are still there; otherwise it opens in the pane you are in on the page on screen. A step whose file is gone is skipped. Each window keeps its own last fifty steps until it reloads, and a button is disabled at either end. The keys are under [The keys](#the-keys); the palette has `:go-back` and `:go-forward`.
- Toggle Left Dock, Toggle Bottom Dock and Toggle Right Dock hide or show the float docked at that edge. A toggle is drawn pressed while its float shows and disabled when no float is docked there. Docking a float at a hidden edge, by drag or from a menu, or opening a view in its float, shows the edge again. Which edges are hidden is saved with the layout. The palette has `:toggle-left-dock`, `:toggle-bottom-dock` and `:toggle-right-dock`.
- With `show_tabs: none` and `editor_actions: strip` in `appearance.yml`, the active pane's Split Right and `...` stand in the strip, before the toggles, and no pane draws them in its own head; the strip's right-click menu names that place Title Bar. With a tab bar drawn they stay in the pane's tab bar.
- In the app the window has no title bar of the system's: the strip moves the window, the window buttons sit at its left on macOS and over its right end elsewhere, where they take the strip's colours of the theme on screen (no room is kept for them in full screen, where macOS hides them), and a double press on its empty part does what macOS's "Double-click a window's title bar to" setting says: zoom, minimise or nothing. The find bar opens under the strip.
- A float's window has the same strip, with the name of the float's tab in the middle and no toggles; its Back and Forward walk that window's own steps.

### The rail

- One button per entry of `rail:` in `config/layout.yml`: `{ label, glyph, page }`, where `page` names an arrangement under `arrangements:`.
- A button shows its page, made from the arrangement the first time and as you left it after that. Its badge is the count of the first view on the page that counts something.
- Drag a button to move it. Right-click it (or Shift+F10) to hide it, reset its page, or open the rail list in Settings. History undoes a move or a hide. Reset asks first.
- Every view sits on one rail page, or in the float (Live HPC, Usage, Workbenches). The Views catalogue lists them by group; `nav_groups` and `docs` set the groups, their order and their letters.
- A click on a catalogue entry opens the view on the page you came from. A view that is already open somewhere is shown where it is. Shift-click opens it in a new pane to the right. The right-click menu has Open on this page and Open beside on this page.
- The Help page holds this manual, the Apps guide, the Templates and Palette pages, and the hub's documents (each `docs:` entry with `group: help`). A `docs:` entry whose `group` is another page's key becomes a tab of that page.
- A tab you closed stays closed; a document added to `docs:` later is added once. Reset puts every document back.
- The foot of the rail holds Workbenches and Update.

### Pages and the pane tree

- A page is a working surface: a tree of splits and panes, each pane a strip of tabs. The layout is saved as it changes, and every browser tab and app window of one server shares it.
- The Pages view lists every page with show, rename and close; a rail page also has Reset. Drag a page's row onto a pane's edge to show it there.
- Settings has Reset all pages: it rebuilds every rail page and the floats, and leaves your own pages and workbenches alone. It asks first, and about each tab with unsaved text.
- Eleven views exist once: Settings, Focus, Usage, Live HPC, Audit, Findings, History, Processes, Pages, Workbenches and Status. Opening one goes to wherever it is. Files, Search, Terminal and the session views can be open on several pages.
- Split a pane by dragging a tab onto its edge, or from the pane menu. Every drag has a menu equivalent; Shift+F10 opens the menu of the focused control.
- Show a page here... (pane menu) draws another page inside this one. It is the same page, so a tab opened in it is open everywhere that page shows.
- Float (pane menu or tab right-click), or a drag with Alt held, floats a pane over every page. Drag its strip to move it, its edges to resize it. Let go within 24 px of the left, right or bottom edge to dock it. Return to Page puts it back.
- A view opened for something (a project, a person, an entry, a document, a file, a diff) never covers the tool views. It lands, in this order: in a workbench's documents pane; in the pane that took the last such tab; in the pane you are in, if it holds such tabs; in an empty documents pane; in a new pane split off to the right.
- A pane from the arrangement stays, empty, when its last tab closes; a pane you split off closes with its last tab. Lock Group (pane right-click) makes a pane take no tab opened from elsewhere.
- The tabs a page starts with are pinned. Cmd+W on a pinned tab closes nothing; Close in its menu does. Pin and unpin from the tab's menu, Pin Editor in the palette, or by dragging into the pinned tabs.
- Reopen Closed Tab (Cmd+Shift+T in the app, `:reopen-closed-tab` in the palette) reopens the tabs the last close closed, in the pane you are in on the page on screen. The window keeps twenty until it reloads.
- A new tab opens right after the active one; closing the shown tab shows the one shown before it.
- `show_tabs` (`multiple`, `single`, `none`), `editor_actions` (`strip`, `hidden`) and `wrap_tabs` in `appearance.yml` set the tab strip; they are also in Settings and in the strip's right-click menu.
- New Text File (right-click on a strip's empty part) opens an untitled text. Its first Save asks for a folder and a name.
- A tab showing a file draws its path as a breadcrumb. Press a folder to show it in Files; in a source tab the path goes on with the symbols around the caret.
- A dot in place of the close control means unsaved text. Closing that tab, its pane or its page asks first. Unsaved text survives a tab switch and a reload.
- While a tab holds unsaved text of a file, every control that would write that file is disabled, and any write to it is refused, so your text is never overwritten.
- The rail is one Tab stop; each tab strip is one, with its pane menu after it. Arrow keys move inside a strip.

### Workbenches

- A workbench is a page for one folder. Left: Files, Search, Repositories, Deposit (for a project with a deposit), the TeX view, Problems and the sessions list, each limited to the folder. Right: the documents pane. The arrangement is `workbench:` in `config/layout.yml`.
- Open Workbench is on a project card, a collection card whose `link` is a folder, an entry page, and a person's folder block; Open in New Files is on a folder or root in Files. A workbench for a project or entry opens that item first.
- A folder has at most one workbench. A limited tab says `In <root>/<path>` and has a control that widens it to the whole root.
- Workbenches, at the foot of the rail, lists the open ones; Manage Workbenches opens the Workbenches view.
- The Workbenches view (`w` then `3`) has Open (one row per open workbench, with its folder and branch) and Closed (kept layouts, last closed first). Reopen restores a kept layout; Forget drops it. New workbench opens one for a root, or for a folder picked in the folder panel.
- Closing a workbench keeps its layout (twenty at most). Reset layout rebuilds it from `workbench:`.

### The palette

- Cmd+K opens the palette. Empty, it lists the views. A typed word matches fuzzily, letters in order (`rpls` finds RAW-PLS), across views, projects and entries.
- With a source tab on screen it also lists the editor's commands; with a Present tab, the slide commands.
- `:` starts a command. `:` and a number goes to that line. `:language`, `:interpreter`, `:compile-database` and `:file-icons` choose what their names say.
- `:task-add <title>` adds a task to the primary hub's Tasks file with `status: todo`; Shift+Enter also opens it. History undoes it.
- Every command is listed in [the palette page](docs/palette.md), written by `npm run docs:palette`.
- Cmd+P finds a file by name across the served folders (at most 200 rows). It lists hidden files, honours `.gitignore`, and skips `node_modules`, `.git` and `.svelte-kit`. `search.timeout_s` and `search.max_names` limit it.
- `#` (Cmd+T in the app) searches the workspace's symbols through the language server.

### The update tray and schedules

- Update, at the foot of the rail, opens the tray: the schedules of `.oculus/schedules.yml` and the update tasks (Lit Watch, Scout, LinkedIn, Inbox). A task runs the `/research-cockpit` skill as a Claude session in a terminal. Chat starts a Claude session over the portfolio.
- A schedule runs a task, a saved command or a prompt on a cron pattern, in local time. The dialog shows the next three runs before it saves.
- An entry is `name`, `runs` (`{ task: litwatch }`, `{ command: build, folder: ... }` or `{ prompt: "...", folder: ... }`), `when`, and optional `paused` and `unattended`. Without `when` it runs only from Run now. The template is in [templates](docs/templates.md).
- You may edit the file by hand; the dialog, Pause and Resume change only their own keys and keep your comments.
- A run missed while oculus was stopped starts once when it starts again. A due run while the last one still works is skipped.
- Run unattended starts Claude with `--dangerously-skip-permissions`, so nobody is asked. A saved command never runs unattended.
- A schedules file or run record (`~/.oculus/schedule.json`) that does not read stops every schedule, and the tray says so.

### The status bar and notifications

- The repository, branch and sync items follow one repository: the one holding the active tab's file, else the workbench's folder, else the one you picked from the repository item's list, else the hub's.
- Switching branch and Sync ask first. Sync pushes when only ahead, otherwise pulls then pushes; with no upstream it offers Publish Branch.
- The problems item toggles the Problems view. The debug item lists the launch configurations. Right-click the bar to hide or show any item.
- In a source tab: the blame item opens the commit in the graph; the line and column open `:`; indentation, encoding and line ending convert the text; the language server item restarts or shows the server.
- The LaTeX item shows during a LaTeX tab or a build, and opens the TeX view. It turns amber while a build waits for your approval.
- When the bar is too narrow, items leave from the middle; hidden ones stay listed in the right-click menu.
- The bell counts unread notifications. Do Not Disturb survives a reload. A toast shows for eight seconds.

## The keys

`?` opens the key sheet. A letter then a digit opens a view: the letter is the group's `chord` in `nav_groups`, the digit its place. Keys bound by apps are listed under Apps.

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
| Cmd+Alt+B / Cmd+Alt+C / Cmd+Alt+V | LaTeX build / clean / view PDF |
| Cmd+Alt+J | LaTeX: show the caret's line in the PDF |
| Cmd+click | in a PDF: open the source line |
| Cmd+Alt+M / Cmd+Alt+X | Math Preview / TeX view |
| Cmd+Alt+[ / Cmd+Alt+] | promote / demote sections |
| Enter / Alt+Enter | in a list environment: new `\item` / plain new line |
| Cmd+L, then Cmd+B, I, U, E, R, T, S, C, N, 6 or - | wrap in `\textbf`, `\textit`, `\underline`, `\emph`, `\textrm`, `\texttt`, `\textsl`, `\textsc`, `\textnormal`, `\textsuperscript`, `\textsubscript` |
| Cmd+L, then Cmd+Enter / Cmd+W | insert `\item` / surround with a command |
| Ctrl+Shift+M, then Cmd+B, I, R, T, S, Shift+B or C | wrap in `\mathbf`, `\mathit`, `\mathrm`, `\mathtt`, `\mathsf`, `\mathbb`, `\mathcal` |
| Shift+F10 | the right-click menu of the focused control |
| arrows, Enter, Escape | in a menu: move, open a submenu, go back |
| arrows | on a docked float's handle: resize it |
| Cmd+K | palette |
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
| `projects` | Projects | The projects with `tier: projects`, as cards or a list. |
| `coauthor` | Coauthor | The projects with `tier: coauthor`. |
| `archive` | Archive | The projects with `tier: archive`. |
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
| `literature` | Literature | The papers kept, from `registries/literature.yml`. |
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
| `audit` | Audit | What the hub is missing: open markers, manifest gaps, folders off the standard. |
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
- The editor has one control per field of the file's `schema:`. The key that names the entry cannot be edited. A venue's `name` can, and every `venue_id` stays.
- Save writes only the changed fields and keeps the file's other lines and comments. A refused field keeps what you typed and says why. Unsaved edits survive a tab switch and a reload.
- Add asks for the fields that name the new entry, writes it to the file of the hub that lists the collection in its `collections:` and opens its page. A taken key is refused. When more than one hub lists the collection, Add also asks which hub's file takes the entry, the primary chosen first. The Literature view's Add asks the same when it is given a DOI or an address.
- A field whose schema line says `filter: true` is a filter in the bar beside the search: a select or tags field as chips of its values with their counts, a text field whose values are all whole numbers as a range (from, to), and any other text field as chips. The filters are kept per tab.
- Delete asks first and names everything that refers to the entry; those references become findings. History undoes it.
- A card's status, deadline and date change on the card and are written at once.
- Edit in File opens the file at the entry. Each view drawn from one file has a control, last in its toolbar, that opens the file.
- An entry with an empty or shared key cannot be written; Findings lists it.

### Notes on single views

- **Focus.** A project sits on the lane its `focus:` names. The ideas backlog holds `holding` projects and ideas on no lane. Deadlines, due follow-ups and open subtasks are lines of the ticker; a dated deadline stays while it lies inside `deadline_horizon_days` and until the project has a chip marked `deadline_met` (`submitted`). A task line has an `agent` button that opens the composer with the task. The career panel's Edit opens an editor over the career file.
- **Projects.** `+ new idea` asks for an id, title, short handle, domain, description and folder (from `new_project_dir`, inside a `scan:` folder), and writes `<folder>/<id>/project.yml` with a README. An opened card's file box lists the files of the extensions in `file_index.ext`.
- **Personal and Software.** A personal or software project has the same card as any project. A repository is a project once it is a folder of the workspace holding `.oculus/project.yml`. When the manifest's `repository.url` is not cloned anywhere, the card offers Clone.
- **Deposit.** Every project has one. It keeps a mirror clone under `~/.oculus/deposits`, synced from the project's `code/`, with sync, commit, push, snapshot, branches, Fetch, and the diffs against `origin/main`.
- **Map.** Press a node to fix it, drag to move it; re-tune lays the map out again.
- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key.
- **Literature search.** Sends the query only to the sources that are on. Results with one DOI, PubMed id or arXiv id merge. Copy BibTeX writes no file. Add to Lit Watch and Save to Literature are the writes.
- **Literature.** The papers kept, one entry each, keyed by citation key: the first author's surname, the year and the first word of the title (`faes2024blockterm`), with `b`, `c` and on added when the key is taken. Save to Literature on a Literature search card and on a Lit Watch card writes the paper to the primary hub's Literature file (else the first hub's) and is undoable in History; a card whose paper is there reads In Literature. A paper with the DOI of one already kept, or with the title of one when either has no DOI, is refused. Add asks for one value: a DOI or its doi.org address, an arXiv id or address, or a PubMed id or address is looked up through the sources the search asks and saved, and any other address is saved as it is with a key made from its last path word. When every source fails nothing is saved and Add names them; an empty answer asks for the new entry's key, as Add does on every collection. A venue that names an entry of the venues registry opens it. Copy BibTeX on an entry, and in the toolbar for the entries shown, fetches each entry's BibTeX by DOI or makes it from the fields, under the entry's own key, and says how many were copied and which were not.
- **Position Leads.** `applied` opens a new Applications entry filled from the lead and marks the lead applied. `decline` marks it declined; reopen undoes that.
- **Inbox.** Send and Archive are the only writes to a mailbox, each after a confirmation. No draft is made at the provider.
- **LinkedIn.** One file per post in `linkedin_dir`. Add asks for a title and a category and opens the new file.
- **Session.** Details, Changes (the git state of the session's folder) and Agents (its subagents). Pin in Details offers the areas first and then every project of every hub of the workspace, grouped by hub, whether a session touched it or not. A press on an agent row opens that agent's own transcript in a Transcript tab; a row whose transcript cannot be read opens nothing and says why in its tooltip: "This agent's own transcript is not available."
- **Live HPC.** The cluster is `slurm.resource` of the hub's `config.yml`; the host is `hpc_host` of `local.yml`, else the cluster entry's `host`. It runs `squeue`, `sacct` and `sinfo` over ssh every `slurm.poll_min` minutes. Submit Job (on a `.slurm` file) shows its plan (folders, rsync arguments, the `sbatch` command) before it runs, and warns when the script does not use `/local/$SLURM_JOB_ID`. It never uses rsync `--delete`. Cancel runs `scancel`.
- **Processes.** Lists terminals, processes matching `processes.patterns`, and app hosts. Stop asks first.
- **Usage.** Refreshed every `usage_refresh_min` minutes.
- **Audit.** Mute writes a finding's signature to `audit_ignore:` in `behavior.yml`.
- **Memories.** Add takes a JPEG or PNG.
- **Settings.** Each control writes its file as you set it, keeps the file's comments, and is undoable in History. A key of the hub's list is written to `.oculus/config.yml`; the `local.yml` keys are listed under This machine with their value in force. Search takes `@modified` and `@id:`.
- **Refactor Preview.** Shows a language server's edit before anything is written, one check per file and edit. Apply writes the checked edits; Discard writes nothing.
- **Problems.** The filter takes comma-separated terms: a word, a glob, or `!` to exclude. A press shows the place in a preview tab.
- **TeX view.** Follows the LaTeX file in front. A Math Symbol inserts its command. Math Preview (Cmd+Alt+M) renders the math at the caret.
- **References.** A press opens the location. A location in a library opens a read-only tab.

### LaTeX builds

- A file builds through its root: a `% !TEX root = <path>` comment, else the file itself if it has `\documentclass`, else the main file that includes it, else the only main file of its folder.
- `% !TEX program = xelatex` or `lualatex` picks the engine; `% !LW recipe = <name>` picks a recipe. Recipes and tools are `latex.recipes` and `latex.tools` in `behavior.yml`, with LaTeX Workshop's placeholders. `latex.out_dir` and `latex.aux_dir` set the output folders.
- A build runs in a terminal. A build that would read a `latexmkrc` or run document code (`Rscript`, `julia`, `pweave`, `quarto`, `R CMD Sweave`) waits until you approve it; a changed file asks again.
- `latex.auto_build`: `on_file_change` (default), `on_save` or `never`. `latex.auto_clean`, `latex.clean_and_retry` and `latex.texcount_autorun` do what their names say.
- A failed build posts a notice with Open Compiler Log and Show Problems; its errors go to Problems and the editor.
- The PDF opens in oculus's viewer and keeps its place per file. SyncTeX: Cmd+Alt+J goes from source to PDF, Cmd+click from PDF to source.
- In a LaTeX tab: hover shows math, pictures, `\ref` targets and package documentation; completion covers environments, sub- and superscripts, `\cite` keys and labels; the editing commands (matching environment, select, toggle display math, close, wrap, promote, demote) are each one undo.
- texlab serves LaTeX and BibTeX tabs (install with `brew install texlab`). A `.bib` tab has Align and Sort. Citation Browser inserts `\cite{key}`. Count Words runs `texcount`.
- Format Document uses `latex.formatter`: `none` (default), `latexindent`, `tex-fmt` or `badness`.

## Files and the editor

- The Files view follows the disk within a couple of seconds. Show Hidden Files, Show Ignored Files and File Nesting are toggles of the view, kept per tab. A tab lists hidden files (dotfiles and the build folders) and the files git ignores until its menu turns them off. The file tree of a project card lists neither.
- A workspace is a file `.oculus/workspaces/<name>.yml` of a hub: `folders:` (each `{ name, path }`) and `primary:`. The template is in [templates](docs/templates.md). With no workspace open, the workspace is unsaved and starts empty.
- The `...` menu and the palette (`:workspace`, `:workspace-save`, `:workspace-new`, `:workspace-close`, `:folder`) switch, save, make and close workspaces. Each workspace keeps its own pages.
- Add Folder to Workspace opens the folder panel; Remove Folder takes a folder out. Both keep the file's comments and are undoable. Drag folders to reorder them.
- A folder entry may set `repository_scan_depth` (0 up, -1 for no limit) for the Repositories view.
- The filter box matches names already read; Fuzzy Match matches letters in order.
- On a row: Enter or F2 renames, Cmd+Down opens, Cmd+Enter opens beside, Cmd+Backspace deletes, Cmd+C / X / V copy, cut and paste, Option+Cmd+C copies the path. A name with `/` makes the folders between.
- Show in Files on a card or a link opens Files at that folder or file.
- The star on a row bookmarks it in `.oculus/bookmarks.yml` of the primary hub. The Bookmarks section lists them: a file bookmark opens the file, a folder bookmark shows it in Files. Bookmarks can be renamed, removed and reordered.
- An app can add a badge and a colour to a row.
- Delete moves to the Trash after asking. Do not ask me again writes `files: { confirm_delete: false }` to `behavior.yml`.
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
- Indentation, word wrap and rulers come from, in order: the tab's own choice, the file, the repository's `.oculus/settings.yml`, `editor.languages`, the global keys. The template of `settings.yml` is in [templates](docs/templates.md).

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
- In every Markdown preview, `$...$` and `$$...$$` are typeset with KaTeX. A formula KaTeX cannot typeset shows as red source. `$` in code and amounts like `$5 and $10` stay text.

### Language servers

- Python (pyright), C and C++ (clangd), TypeScript and JavaScript, Svelte, YAML, Markdown, and LaTeX and BibTeX (texlab) are served by a language server per folder. It stops 60 seconds after the last tab closes. Restart is in the status bar's language menu.
- A server gives hover, go to definition, references, completion, signature help, diagnostics and the Outline; format, organize imports and hierarchies where it offers them. clangd also gives inlay hints, inactive regions and Switch Source/Header.
- pyright uses the repository's `.venv` or `venv`, else `python3`, else `:interpreter`. A repository's own interpreter runs only after you approve it.
- clangd uses the compile database the status bar names: a `compile_commands.json` at the root or in `build/*/`, or a configuration of `.oculus/cpp.yml` (template in [templates](docs/templates.md)).
- The Svelte server runs a repository's `svelte.config.*` and `vite.config.*` only after `:svelte-config` approves them.
- The YAML server checks a hub file against its schema: undeclared keys, wrong values, keys that name nothing, missing required fields. `local.yml` is checked against the options catalog.
- The Markdown server marks links to missing files and renames a heading with its links. After a move in Files, it offers to update the links that broke, as a Refactor Preview. It also serves the notes in each hub's `.oculus/notes/`, and no other file under a dot folder.
- A definition outside the workspace opens in a read-only library tab.
- An edit a server makes to other files is one History record. It is refused whole if a file it names is open in another page, outside the workspace, in `secrets` or `~/.oculus`, over 5 MB, or changed on disk, or if it creates, renames or deletes a file.
- Apps can add languages and servers ([Apps guide](docs/apps.md), The tools). When oculus and an app both serve a language, their lists are joined, and single answers come from oculus first.

### Hub keys in YAML

- In a hub YAML file, a value whose schema field has `from:` is a link: Cmd+click opens the entry, Find All References lists every place that names it.
- F2 renames a key in every file, after a Refactor Preview. It is refused for a project's folder name, a vocabulary word, an empty or taken key.

### Linters

- ChkTeX (`.tex`), Ruff (`.py`), ESLint (TypeScript, JavaScript, Svelte) and ShellCheck (`.sh`, `.bash`, `.slurm`) run on the saved file, never while typing. `lint.chktex`, `lint.ruff`, `lint.eslint`, `lint.shellcheck` and `lint.writing` switch them.
- The `lint.*_path` keys set where a program is. ESLint is the repository's own and runs only after you approve its configuration in `:eslint-config`.
- The writing rules warn on Markdown, YAML and comments: `em-dash`, `en-dash`, `curly-quote`, `ellipsis`, `arrow`, `nbsp`, `wrapped-paragraph`. `lint.writing_skip` lists globs to skip. Fix All Writing Problems in Folder fixes many files at once, as one History record.
- A finding with a fix offers it in Quick Fix (Cmd+.), with Show documentation and a comment that silences it.
- The status bar shows `not found`, `failed`, `timed out` or `not approved` for a linter that did not run.

## Searching the files

- A pattern runs on Enter. `word`, `case` and `regex` decide what it means; without `case` it ignores case.
- It searches the workspace's folders with a local ripgrep. It skips ignored and hidden files, `node_modules`, `.git` and files over 2 MB. Find in Folder (Files menu) limits it to one folder, which is searched even when hidden or ignored. The notes in each hub's `.oculus/notes/` are searched too, listed under their hub; nothing else under a root's own `.oculus` is.
- `search.max_hits` and `search.timeout_s` limit it. A line with two matches is two rows.
- Replace: in regex mode `$0` to `$99` are groups, `\n` and `\t` escapes, and `\u`, `\U`, `\l`, `\L` change case. Preserve Case keeps the match's capitals.
- Replace All asks first. A file changed since the search, locked, binary or open with unsaved text is skipped and named. The whole replace is one History record.
- With the replace row shown, a press on a hit opens its Replace Preview, a diff beside the Search view.

## Terminals

- A Terminal tab holds terminals running Claude, Codex or a shell, in tmux, so they survive a server restart. A new tab shows the composer: workspace, agent, account, options, first prompt.
- New worktree, beside the composer's branch, is offered for a folder inside a repository Source Control watches. Type a name: Start makes `<root>/.agents/worktrees/<name>` on a new branch, as Source Control's New worktree does, then starts Claude, Codex or the shell there, in the same subfolder (a project's folder starts in that project's folder of the new worktree). Esc or a second press takes the choice back. A refused name or write starts nothing; a worktree made whose start failed stays picked, so Start again starts there. After a start the folder list offers both the new worktree's folder and the folder the composer was opened in, even when no place lists either.
- An option that makes the agent ask less (Accept edits, Auto, Bypass permissions, Full access) asks first, every time. A value of `catalogs/agents.yml` with `confirm: true` asks too.
- A start from a hub task (a task's `agent` button, Start Agent) opens the composer in the task's folder with the task as prompt. The task's text runs only after Approve and Start, kept in `~/.oculus/approvals.json`; a changed text asks again.
- Once an agent runs, the steer box sends more text and Stop interrupts.
- From two terminals on, a list at the right names them. Split, Kill (two presses), rename (double click). Drag a row to reorder it or move it to another tab. Attach to Session takes in a terminal no tab owns.
- Cmd+click opens a web address. A paste with a line break asks first. A file dropped from Files types its path.
- Closing a tab, pane or page ends its terminals, asking when one runs a program. Moving and reloading end none.
- The sessions list groups sessions by workspace: pinned first, then those that need input, then newest.

## Project commands

- A repository's commands come from `.oculus/commands.yml`, from the commands saved with Add Command..., and from what oculus finds (CMake presets, `package.json` scripts, `Makefile` targets).
- `commands.yml` is a list `commands:` of `name`, `run`, optional `cwd`, `depends_on` and `default` (`build` or `test`). The template is in [templates](docs/templates.md).
- Commands show above the commit box in Repositories, on a project card, and in Run Command on a folder in Files.
- `depends_on` runs each command of the chain once, in order, and stops at the first failure.
- `${file}`, `${fileDirname}`, `${fileBasename}`, `${fileBasenameNoExtension}`, `${lineNumber}`, `${selectedText}` and `${workspaceFolder}` reach the command as environment variables.
- A command from a file or a found one runs only after you approve its exact text on this machine. A command saved with the form runs without asking.
- The terminal stays after the command ends, with a check or a cross. Rerun and Restart run it again. A `file:line: error:` line opens that file.
- An app can add tasks and problem matchers ([Apps guide](docs/apps.md)).

## Debugging

- The Debug view runs a `.rite` program under `rite_dap`, and other languages under an app's debugger. F9 sets a breakpoint, F5 starts; when it stops, Variables, Watch, Call Stack and the Debug Console show the state.
- Configurations are in the repository's `.oculus/launch.yml`. With none, F5 runs the `.rite` file on screen. The template is in [templates](docs/templates.md):

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

- An app is a folder of web files with an `app.yml`, drawn in a tab. A machine app lives in `.oculus/apps/<name>/` of the hub; a root app in `.oculus/apps/<name>/` of another folder of the workspace. The template is in [templates](docs/templates.md).
- An app runs only after you approve it, and only while its files are the ones you approved. Keep approved while I edit lets you work on it.
- An app runs in a sandboxed frame with no access to your files. It reads the channels and makes the writes its manifest lists; every write is in the change log. A delete asks you first.
- An app with a host runs a program on this machine with your rights; the approval panel says so.
- The Apps page: the Apps view, with one row per app and its state, beside a pane where app tabs open.
- Disable and Enable (also per workspace) are in the app's menus. Remove (machine apps) moves the folder to the Trash and deletes its secrets.
- Add app from folder copies a folder into the apps folder.
- What an app adds (commands, keys, menus, status items, views, editors, settings, themes, languages, servers, debuggers, tasks, terminals, source controls, file badges) shows only while it is approved and enabled.
- An app's settings are written to `app_settings` of the hub's `config.yml`.
- No app can reach `~/.oculus`, oculus's `config/`, a hub's `secrets` folder or any `local.yml`.
- Limits are the `apps:` block of `behavior.yml`. The [Apps guide](docs/apps.md) has the manifest, the bridge and an example.

## Source Control and worktrees

- Repositories lists the repositories of the workspace: its folders, the repositories below them down to `repository_scan_depth` levels (1 by default, at most 3), and cloned projects. An agent's worktree is listed under its repository's Worktrees.
- A commit made in a terminal shows within two seconds.
- Cmd+press and Shift+press select rows of a group. Stage, Unstage and Discard on a selected row, from its controls or its right-click menu, act on every selected row of the group, and so does Add to .gitignore from the menu; Discard asks once, naming how many. On a row outside the selection they act on that row, and the menu's open items open the row pressed. Every write runs from a press; discarding work, reaching a remote and committing ask first (not Fetch).
- These are fixed: Pull is plain `git pull`; Sync pulls then pushes; Fetch prunes; signing follows `commit.gpgsign`; a commit needs a configured name and email; Stage All never stages new files. Nothing force-pushes except a deposit's snapshot.
- `git.autofetch_minutes` fetches on a timer; 0 (default) never.
- The commit box keeps one message per repository. With nothing staged it becomes Sync Changes or Publish Branch. The button in the field writes a message from the staged diff.
- Hooks run. A write that runs them, and Stage All on Untracked, whose time grows with the files it stages, has no time limit; Cancel stops a running write. Other git commands time out after 10 seconds (60 for Fetch).
- A changed row opens its diff, side by side or inline. Blocks have Stage Block, Revert Block (asks) and Unstage Block; a line selection narrows them.
- A merge, pull or stash that stops on conflicts lists them under Merge Changes. The merge editor writes the Result; Complete Merge stages it.
- Stash, Stash (Include Untracked), Stash Staged; Apply, Pop, Drop. Create Tag, Delete Tag, Push Tags. Create, Delete and switch Branch; Checkout (Detached).
- The Graph shows the history of the branch and its upstream together, fifty commits at a time, each commit once: a commit only the upstream holds is marked incoming and one only the branch holds outgoing, each with a dashed circle. Incoming Changes and Outgoing Changes stand above their commits with their count, and a press on one lists the files changed over its whole range, each opening that range's diff. The checked-out branch and the local branches, the remote branches (with a cloud) and the branch's base are drawn in colours of their own; a tag is plain. Cherry Pick and the Compare commands are on a commit.
- Untracked lists every new file on its own row, a new folder's files under that folder in tree view; a repository inside the repository is one folder row, whose press shows it in Files. A group of more than 200 changes shows the first 200 under a warning that says so.
- Discard on an untracked file moves it to the Trash. Add to .gitignore appends the path.
- Close Repository hides a repository from that tab; Reopen Closed Repositories brings it back. Open Worktree adds a worktree's folder to the workspace; Open Worktree in New Window also opens a new window.
- In a source tab the gutter marks changes; Blame shows who changed each line.
- New worktree makes `<root>/.agents/worktrees/<name>` on a new branch and opens a shell (or Claude, or Codex) there. Merging it back is `git merge`, refused with uncommitted changes. Removing it is a separate control and refuses uncommitted or untracked files.
- An app can add a source control as a row of its own.

## Configuration and the data

- Every setting is in one of three places: oculus's `config/` folder, a hub's `.oculus/config.yml`, or a hub's `.oculus/local.yml`. A saved change applies at once.
- `config/` holds:
  - `appearance.yml`: themes, wallpaper look, code theme, file icons, terminal look, tab strip.
  - `behavior.yml`: thresholds, cadences and limits; the `editor`, `files`, `literature`, `apps`, `open`, `git`, `lint`, `latex`, `search`, `mail`, `calendar`, `changes`, `processes` and Live HPC keys.
  - `layout.yml`: the rail, the arrangements, `workbench:`, `nav_groups`, `docs:`.
  - `sources.yml`: what the portfolio reads, and `languages:`, the map from file names to languages.
  - `present.yml`: `defaults.tag_tones` for every deck.
  - `catalogs/`: the composer's agents, file nesting, glyphs, icons, LaTeX tables, the options catalog, and `vocab.yml` (the palette, statuses, Focus lanes, venue tiers, radar buckets).
  - `schemas/`: the forms of `project.yml`, a deck's `present.yml` and `cpp.yml`.
  - `text/`: every word on screen.
- Every option is described in `catalogs/options.yml` and set in Settings. A wrong value is a finding, and that option takes its default.
- A hub's `.oculus/config.yml` may set exactly the keys listed in its template ([templates](docs/templates.md)); any other key is a finding. A key it sets replaces oculus's value whole; inside a map, per dotted path. Its `collections:` names the file of each registry, card list and feed: `leads` and `radar` name the Position Leads and Lit Watch files.
- A domain's card colour (`color`, `#rrggbb`) and label (`title`), and whether its active projects must list a dataset (`expects_datasets`), are fields of its entry in the domains registry. The theme words of venues and datasets are the options of the `themes` field of the venues and data registries, each a word or `{ key, label }`.
- A hub's `.oculus/local.yml` is this machine's: the port, `hpc_host`, the programs, the agent accounts, the calendar and mail accounts, the Literature keys, and where oculus keeps its files. Every key has a default. It stays out of git, and only the primary hub's file is read (the account rows are joined over every hub). The keys are in its template.
- `commit_message_account` in `local.yml` names the Claude account the suggested commit message runs under: the label of a `claude` row of `accounts:` in any hub's file. Empty or absent, it runs on `~/.claude`; a label no Claude row holds is a finding and `~/.claude` is used. The run saves no session, so it is never listed in Sessions.
- The rest of `.oculus/` (bookmarks, workspaces, schedules, notes, apps, pictures) is listed in the hub's Data map, `docs/DATA-MAP.md`.
- `~/.oculus/` is oculus's own state: the open workspace, the change log, the local history, approvals, the language servers' folder, app stores, provider credentials. It is not for editing.
- The change log (`changes.jsonl`) records every write oculus makes; History undoes one. A file saved from a source tab, a note included, is not in it (its copy is in the local history). `changes.keep` sets how many are kept.
- The hub's data files, their keys and the views that show them are in the hub's Data map, `docs/DATA-MAP.md`, on the Help page.

### Hubs and projects

- A folder of the workspace with `.oculus/config.yml` is a hub. Every hub is read and merged into one portfolio. A record of another hub than the primary has the id `<hub>:<id>` and a hub chip.
- A change goes to its own hub's file. A new record goes to the file of the hub that lists its collection, and Add asks which one when more than one hub does.
- A project is a folder holding `project.yml` or `.oculus/project.yml`, found by a `scan:` folder or as a folder of the workspace. Its id is the folder's name. Its `tier` and `type` set its board and stage.
- A project's `repository:` block (`url`, `visibility`, `description`, `homepage`, `topics`, `date`) says where its code lives. It counts as cloned wherever a repository of the workspace has that `url` as `origin`.
- Clone (on a project) asks for a folder and checks the repository out there. `:clone` lists your GitHub repositories (through `gh`) and clones one into a folder you pick. Afterwards oculus asks: Open (the clone alone) or Add to Workspace.
- oculus keeps one block in the hub's git `info/exclude`, between `# BEGIN nested-repos` and `# END nested-repos`, listing the repositories below the hub so the hub's git ignores them. Nothing else in that file changes.
- The `secrets` folder of every hub is private: no search, language server, linter fix or app reads it.

### Mail and calendar

- `calendars` and `mail` in `local.yml` list your accounts (`provider`: `google`, `microsoft`, or `ics` for a calendar link). Add account and Remove in the views write them.
- The first account of a provider opens Account setup, which saves your app's client to `~/.oculus/connect/`. Tokens and calendar links live in files with mode 0600 and are never shown or logged.
- `mail.poll_min`, `calendar.poll_min`, `calendar.days_back` and `calendar.days_ahead` in `behavior.yml` set the polling.
- An Inbox thread is on your plate when it is unread in the inbox, labelled `todo`, or a single unlabelled message. The notes per thread are in `<mail_dir>/triage.json`, written by the card and by `/research-cockpit inbox`.
