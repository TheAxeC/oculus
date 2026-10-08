# Oculus

Oculus is the private working surface for the research hub: one page in a browser tab on this machine, or in its own window of the app, reading the hub's own YAML and Markdown from disk and showing it as boards, lists and documents. It writes only where a control says it writes: back into the same files, and, from the Files view's right-click menu, files and folders under the roots the view serves. This page is the short guide to using it; each section links to the guide that holds the detail, and how to run and check oculus is in `README.md`.

## Contents

[TOC]

---

## The window

The window is a rail down the left, a status bar along the bottom and, between them, the pane tree of the page the rail shows; oculus runs in a browser tab or in its own app. What the window is made of, tooltips, the palette and the status bar are in the [Window guide](docs/window.md#the-window-and-the-app).

### The rail

The rail has one button per page, twelve as shipped from Focus to System, each opening the arrangement of panes and tabs that page was left in, and at its foot Bookmarks, Search and Update. The Help page holds this manual, the hub's documents and the guides: [Configuration](docs/configuration.md), [Source Control](docs/source-control.md), [Window](docs/window.md), [Views](docs/views.md), [Files and search](docs/files-and-search.md) and [Terminals and commands](docs/terminals.md). The rail is in the [Window guide](docs/window.md#the-rail).

### Pages and the pane tree

A page is a whole working surface with its own tree of splits and panes, each pane a strip of tabs; tabs split, fold, maximise, float and drag between panes, and the layout is saved as it changes. The operations are in the [Window guide](docs/window.md#inside-a-page).

## The keys

The key sheet opens with `?`. The focus, tab and palette rules behind these keys are in the [Window guide](docs/window.md#focus-tabs-and-unsaved-text).

| Key | What it does |
|---|---|
| 1-9 | show the rail's page of that place |
| Ctrl+1-9 | switch tab in the focused pane |
| Ctrl+] / Ctrl+[ | next / previous tab in the focused pane |
| Ctrl+Tab / Ctrl+Shift+Tab | next / previous tab in the focused pane (in the app) |
| Cmd+W | close the active tab of the focused pane, asking first over unsaved text (in the app) |
| Cmd+N | new text file in the focused pane (in the app) |
| Cmd+Shift+N / Cmd+Shift+W | new window / close the window (in the app) |
| Cmd+, | settings (in the app) |
| Cmd+R | reload the window (in the app) |
| arrows | along the rail or a tab strip, when one holds the focus |
| Home / End | first / last control of the rail or a tab strip |
| arrows, Home / End, a letter | in a tree (Files, Repositories and the other explorers): up and down a row, into and out of a folder, the first and last row, and the next row whose name starts with that letter (Cmd or Ctrl with a letter is the browser's, except Cmd+A, which selects every row of the tree and never page text; Cmd+Enter opens the file beside the pane) |
| Delete | close the focused tab, asking first when it holds unsaved text; a pinned tab is not closed, the first tab that is not pinned is shown |
| f1-f3 | open a view of the Focus page's group |
| m1-m7 | open a view of the Sessions page's group |
| p1-p4 | open a view of the Projects page's group |
| e1-e6 | open a view of the Incoming page's group |
| s1-s8 | open a view of the Explorer page's group |
| c1-c6 | open a view of the Academic Life page's group |
| l1-l3 | open a view of the Pillars page's group |
| r1-r4 | open a view of the References page's group |
| t1 | open a view of the Present page's group |
| h1-h9 | open the manual, the Memories wall, a hub document or a guide, the Help page's group |
| y1-y9 | open a view of the System page's group |
| j / k | move the card cursor left / right |
| J / K | carry the card under the cursor left / right |
| i / o | move the card cursor up / down a row |
| Enter | expand the card under the cursor; on an Audit row open the file the finding names, on a Focus lane card open the project, on a Settings card move into its first field |
| / | focus this board's search |
| Cmd-Shift-F | open the Search view and put the cursor in its query box |
| Cmd-Shift-H | open the Search view with the replace row shown and put the cursor in its replace box |
| g g | top of page |
| G | bottom of page |
| n | start a new agent session: the composer in the page's Terminal tab (a new one when it has none), in that tab's folder |
| Cmd+S | save the source tab on screen (Ctrl+S off macOS), refused over a file that is not UTF-8 text throughout; the browser's save dialog is never opened |
| Cmd+Shift+M | show the Problems view, or hide it when it is the one on screen (Ctrl+Shift+M off macOS) |
| F8 / Shift+F8 | go to the next / previous problem, across files |
| Cmd+Shift+B | run the default build of the repository holding the open source file (Ctrl+Shift+B off macOS) |
| Cmd+Alt+T | run the default test of that repository (Ctrl+Alt+T off macOS) |
| Cmd+Alt+B / Cmd+Alt+C / Cmd+Alt+V | build, clean and view the PDF of the LaTeX root of the source tab or the PDF tab in front (Ctrl+Alt off macOS) |
| Cmd+Alt+J | in a LaTeX source tab, show the line at the caret on the PDF page (SyncTeX forward search) |
| Cmd+click / Ctrl+click | in a PDF tab, open the source line of the place clicked (a double click when `latex.reverse_synctex` is `double_click`) |
| Cmd+Alt+M | open Math Preview beside a LaTeX source tab |
| Cmd+Alt+X | show the TeX view in the pane that holds the Files tab, with any focus |
| Cmd+Alt+[ / Cmd+Alt+] | promote / demote the sections in the selection of a LaTeX source tab |
| Enter / Alt+Enter | in an `itemize`, `enumerate` or `description` environment, start a new `\item ` / a plain new line |
| Cmd+L, then Cmd+B, I, U, E, R, T, S, C, N, 6 or - | in a LaTeX source tab, wrap the selection in `\textbf`, `\textit`, `\underline`, `\emph`, `\textrm`, `\texttt`, `\textsl`, `\textsc`, `\textnormal`, `\textsuperscript` or `\textsubscript` |
| Cmd+L, then Cmd+Enter / Cmd+W | insert `\item` / surround the selection with a command whose name is asked |
| Ctrl+Shift+M, then Cmd+B, I, R, T, S, Shift+B or C | wrap the selection in `\mathbf`, `\mathit`, `\mathrm`, `\mathtt`, `\mathsf`, `\mathbb` or `\mathcal` (Ctrl+M, then Ctrl+key off macOS) |
| Shift-F10 | the right-click menu of the focused row or control, as the context menu key opens it |
| Cmd-K | jump palette |
| Cmd+T | in the app, the palette on the symbols of the workspace (`#` in the palette does the same in a browser) |
| F2 | rename the symbol at the caret of a source tab's editor, through its language server |
| Shift+Alt+H | show the call hierarchy of the symbol at the caret of a source tab's editor, in the References view |
| : | command line |
| Esc | clear the cursor |
| Alt+F5 / Shift+Alt+F5 | next / previous change, in a diff pane (through every file it holds) or a source tab's editor that holds the focus |
| F5 | start debugging the open `.rite` file or the chosen launch configuration, or continue while the program is paused; with no `.rite` file to run it says so |
| Shift+F5 | stop the debug session, after a confirmation naming the adapter process |
| Cmd+Shift+F5 | restart the debug session (Ctrl+Shift+F5 off macOS) |
| F9 | toggle a breakpoint on the caret line of the `.rite` source tab on screen |
| F10 / F11 / Shift+F11 | step over / step into / step out, while the program is paused; no key pauses a running program |
| Cmd+F | find in a terminal's grid that holds the focus (Ctrl+F off macOS); in the find bar Enter, Shift+F3 and Cmd+Shift+G go to the previous match, Shift+Enter, F3 and Cmd+G to the next, Escape closes it |
| Cmd+F | in the app, in a view with no find of its own (the Help view, a list), the find bar of the window: Enter goes to the next match, Shift+Enter to the previous, Escape closes it and gives the focus back; a source tab's editor and a terminal keep their own find |
| Ctrl+Enter / Cmd+Enter | commit, in a commit box's message field; send, in a diff's comment box |

## The views

One row per view of the Views catalogue; each name links to its section of the [Views guide](docs/views.md).

| Id | Name | What it is for |
|---|---|---|
| `focus` | [Focus](docs/views.md#focus) | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker, the lanes and the career strategy. |
| `projects` | [Projects](docs/views.md#projects) | The projects board, as cards or as a list, searchable, with the pin, the stale badge and each card's own controls. |
| `coauthor` | [Coauthor](docs/views.md#coauthor) | The same board over the projects someone else leads. |
| `archive` | [Archive](docs/views.md#archive) | The same board over finished work and dead ends. |
| `personal` | [Personal](docs/views.md#personal) | One card per side project, from a folder of `side-projects/` or a repository that holds `.oculus/project.yml`. |
| `pillars` | [Pillars](docs/views.md#pillars) | The research pillars and which projects sit under each. |
| `domains` | [Domains](docs/views.md#domains) | The application domains and the projects in each. |
| `map` | [Map](docs/views.md#map) | The portfolio as a graph of projects and what links them, filtered by project type and by pillar. |
| `venues` | [Venues](docs/views.md#venues) | The venue catalogue with its tiers, deadlines and concentration warning. |
| `data` | [Data](docs/views.md#data) | The dataset registry: where each set came from and how it is recovered. |
| `code` | [Code](docs/views.md#code) | The repositories registry and the software projects with the papers each one names. |
| `statements` | [Statements](docs/views.md#statements) | The reusable boilerplate paragraphs. |
| `files` | [Files](docs/views.md#files) | The file browser over the hub, the engine config folder and the configured roots, read like an editor's explorer: it follows the disk, roots, bookmarks, notes and sections reorder by drag and by Alt+Up and Alt+Down, and a second Collapse Folders press closes the roots. |
| `repositories` | [Repositories](docs/views.md#repositories) | VS Code's Source Control over every repository oculus knows, with the commit box, the changes, the graph, stashes, tags and worktrees, repositories below a root down to `repository_scan_depth` included, and a changed file's name pressed to open it. |
| `search` | [Search](docs/views.md#search) | A pattern across the files of one root or of all of them, the hits grouped by file, with an optional replace. |
| `references` | [References](docs/views.md#references) | The locations a language server found for Find All References or Find All Implementations in a source tab, and the call and type hierarchies of a symbol. |
| `latex` | [TeX view](docs/views.md#tex-view) | LaTeX Workshop's side bar for the root of the LaTeX file in front: Commands, Structure and Math Symbols. |
| `problems` | [Problems](docs/views.md#problems) | The errors, warnings and infos of the language servers, of project commands and of LaTeX builds, one row per problem under its file. |
| `debug` | [Debug](docs/views.md#debug) | The debugger of rite: the launch configuration picker with Start, the findings of `.oculus/launch.yml`, and Variables, Watch, Call Stack and Breakpoints. |
| `debug-console` | [Debug Console](docs/views.md#debug-console) | What the debugged program wrote and the expressions you evaluated in the paused frame. |
| `funding` | [Funding](docs/views.md#funding) | The funding schemes, their stage and the statement each grant requires. |
| `events` | [Talks & Events](docs/views.md#talks--events) | Talks, events and what is coming. |
| `education` | [Education & Service](docs/views.md#education--service) | Teaching and service entries. |
| `applications` | [Applications](docs/views.md#applications) | Position applications and where each stands. |
| `joint-work` | [Joint work](docs/views.md#joint-work) | One entry per piece of work with one person, and the pipeline it is in. |
| `tasks` | [Tasks & Service](docs/views.md#tasks--service) | The task list. |
| `present` | [Present](docs/views.md#present) | A deck, one slide at a time as a 16:9 frame scaled to its pane, with an overview grid and full screen. The Presenter control or `P` shows the presenter screen (the slide, the next slide, its notes, the time and a timer) and opens the slide alone in a second window for the audience, which can be reloaded without ending the presentation (closing it ends the presentation after 3 s). A right-click on a slide edits, adds, copies or deletes it. An image dropped on a slide is added to it, a slide shows what its source tab holds unsaved, and Export to PDF writes the deck beside it. |
| `radar` | [Lit Watch](docs/views.md#lit-watch) | The literature radar the scout writes. |
| `literature` | [Literature search](docs/views.md#literature-search) | One query asked of OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC and arXiv, and of Web of Science and Scopus when `local.yml` holds their keys. |
| `leads` | [Position Leads](docs/views.md#position-leads) | The position leads the scout writes. |
| `inbox` | [Inbox](docs/views.md#inbox) | The reader's own mailboxes read live, one row per configured account, with each thread's wish and a drafted answer. |
| `linkedin` | [LinkedIn](docs/views.md#linkedin) | The posts pipeline: what is posted and what is still an idea. |
| `session-list` | [Sessions](docs/views.md#sessions) | Every agent session on this machine, grouped by workspace, with the terminals oculus runs below them. |
| `session-detail` | [Session](docs/views.md#session) | One session in a tab of its own: what it is doing, its model, its workspace and its controls. |
| `terminal` | [Terminal](docs/views.md#terminal) | A terminal panel of its own: each Terminal tab owns one or more terminals running Claude, Codex or a shell inside tmux. |
| `transcript` | [Transcript](docs/views.md#transcript) | One session's turns as they were written, one tab per session. |
| `timeline` | [Timeline](docs/views.md#timeline) | One session's turns over time. |
| `changes` | [Changes](docs/views.md#changes) | The git state of the workspace a session works in: its branch, the files the session touched (each with its name first and its folder after it) and the commit box. |
| `agents` | [Agents](docs/views.md#agents) | The agents a session has running under it: the subagents its transcript names. |
| `status` | [Status](docs/views.md#status) | Whether the socket is up, which snapshot the page holds, and the line counts of oculus's own files. |
| `findings` | [Findings](docs/views.md#findings) | Every problem the data layer found in the hub's files, each naming its file and key. |
| `gallery` | [Gallery](docs/views.md#gallery) | Every primitive with sample data in one pane, opened under each theme. |
| `hpc` | [Live HPC](docs/views.md#live-hpc) | The cluster queue: what is running, what is pending and the quota. |
| `usage` | [Usage](docs/views.md#usage) | What each agent account has spent. |
| `help` | [Help](docs/views.md#help) | This manual. |
| `audit` | [Audit](docs/views.md#audit) | What the hub is missing, in sections: open markers, manifest gaps, folders off the tier standard and the like. |
| `memories` | [Memories](docs/views.md#memories) | The photo wall, each picture shown whole in a tile, with a control that adds a picture. |
| `calendar` | [Calendar](docs/views.md#calendar) | The reader's own Google and Microsoft calendars and any published calendar link, read-only. |
| `account-setup` | [Account setup](docs/views.md#account-setup) | The steps that register the reader's own application at Google and at Microsoft for the calendar and mail accounts. |
| `history` | [History](docs/views.md#history) | Every write oculus made on this machine, newest first, with a control that puts a field back. |
| `processes` | [Processes](docs/views.md#processes) | What oculus started itself in tmux and the local processes the configured patterns match. |
| `catalogue` | [Views](docs/views.md#views) | Every view and hub document by group, with its key and badge. |
| `settings` | [Settings](docs/views.md#settings) | The Settings editor over the options catalog, with a search box, a table of contents of the groups and a control per option. |
| `pages` | [Pages](docs/views.md#pages) | Every page, with show, rename and close, and New page. |

Six views are opened for something rather than listed in the catalogue, and a view drawn from one file of the hub carries that file's own control; both are in the [Views guide](docs/views.md#views-opened-for-something).

## Searching the files

Open the Search view with Cmd-Shift-F, type a pattern and press Enter; a press on a hit opens its file at that line, the `word`, `case` and `regex` toggles decide what the pattern means, and Cmd-Shift-H shows the replace row. The details are in the [Files and search guide](docs/files-and-search.md#searching-the-files).

## Project commands

A repository's named command lines run as terminals from a button in the Repositories view or on a project card; a command from a file of the repository runs only after you approve its text, and Cmd+Shift+B and Cmd+Alt+T run the default build and test. The rules are in the [Terminals and commands guide](docs/terminals.md#where-project-commands-come-from).

## Debugging

The Debug view runs a `.rite` program under cathedra's `rite_dap` adapter: set a breakpoint with F9 or a press in the editor's margin, press F5, and the program runs until it stops on one, where Variables, Watch, Call Stack and the Debug Console show its state and F10, F11 and Shift+F11 step. A repository's configurations live in `.oculus/launch.yml`, and a launch asks once for each text it runs. The behaviour and what is left out are in the [Debugging guide](docs/debugging.md).

## Apps

An app is a folder of web files, a page and its scripts, that oculus finds while it runs and draws in a tab. It needs no build and no restart: a folder that appears is offered at once, and a folder that is edited asks for approval again. A machine app lives in `~/.oculus/apps/<name>/` (or the folder `apps_dir` in `config/local.yml` names). A root app lives in `.oculus/apps/<name>/` of a root shown in the Files view, the hub included. Each folder holds an `app.yml` that names it and lists what it asks for. The Apps button on the rail opens the Apps page, and the Views catalogue lists every offered app under Apps, a root app's title followed by its root's name in parentheses.

The manifest. `name` (the folder's name, lowercase letters, digits and hyphens), `title` and `bridge: 1` are required. `description`, `glyph` (a name from the glyph vocabulary), `entry` (the page to open, `index.html` when absent), `reads` (the live data channels the app may read), `writes` (the kinds of change it may ask for) and `connects` (the outside origins it may fetch from, `https://host` or `https://host:port`) are optional. A manifest with a key oculus does not know, a channel or write it does not have, or a name that is not valid is refused, and the Findings view says why under `apps[<name>]`. A root app is offered fewer channels than a machine app: it cannot read `inbox`, `calendar`, `sessions` or `usage`, and it reads only its own root's part of `git` and `files`.

Approval. An app runs only after you approve it. Its tab shows what it can do in plain sentences: what it reads, what it writes, which outside addresses it reaches, where it keeps its own data, its folder and its size. Approve runs it. The approval holds only for the files you read: when a file of the app changes the tab shows the panel again, the tab's state is kept, and a root app changed by a `git pull` asks again too. Keep approved while I edit lets a machine app stay approved while you work on it, marked in the tab by an edit mark; a root app cannot be kept. Revoke takes the approval back. Open the app's folder shows the folder in the Files view. An app that does not answer in time shows a Reload the app button.

What an app can do. It runs in a sandboxed frame with no access to your files, cookies, the write token or the rest of oculus. It reads the channels its manifest lists and is told when they change, asks for the theme, keeps one value for its tab and one value for the app (its store, the file `~/.oculus/app-data/<name>.json` or `.oculus/app-data/<name>.json` of its root), asks oculus to write the kinds its manifest lists, and asks to open a file of a root, a project, a view or an address outside oculus. A link in the app to a page of another site asks the same: oculus shows the app's name and the whole address, with the keyboard on Cancel, and opens it in a new browser tab only when you confirm, because an address can carry what the app read. A write that deletes an entry or a feed, or creates an idea or a LinkedIn post, asks you to confirm first, with the keyboard on Cancel, and every write is recorded in the change log with the app's id. The reader's approval of the files and of the origins in `connects` is the boundary against an app sending what it read elsewhere; the browser also lets a frame reach a STUN server, resolve a host name of its choosing and open a connection to an address of its choosing that carries no data, which no policy stops.

The limits are the `apps:` block of `config/behavior.yml`: the seconds a frame is given to start, the kilobytes of a tab's state and of a store, the writes, opens and key events an app may send per minute or second, the files and megabytes a folder may hold, and `closed_paths`, the folders no app can open a file from, `secrets` as shipped. `docs/apps.md` is the guide to building an app, step by step with a worked example, and it opens in oculus as Apps guide on the Help page and in the Help group of the Views catalogue.

## Source Control and worktrees

The Repositories view and a session's Changes panel are VS Code's Source Control over the repositories oculus knows: commit, stage part of a file, pull and push, merge, stash, the graph, and worktrees with the merge back as a control of their own. Every operation and refusal is in the [Source Control guide](docs/source-control.md).

## Configuration and the data

Everything oculus shows is read from the research hub's files and written back to the files it came from, and every setting is a file of the engine's `config/` folder or the machine's `config/local.yml`, with the port as `local.yml`'s `port`. Each file, every `local.yml` key and the accounts and registries they point at are in the [Configuration guide](docs/configuration.md).
