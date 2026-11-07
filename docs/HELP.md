# Oculus

Oculus shows the research hub's YAML and Markdown files as boards, lists and documents, in a browser tab or in its own app. Four guides stand beside this one:

- the [Data map](data-map.md): the files and their keys;
- the [Decks guide](decks.md): how to write a deck;
- the [Apps guide](apps.md): how to build an app;
- the [templates](templates.md): every file oculus reads.

`README.md` says how to run and check oculus.

## Contents

[TOC]

---

## The window

Oculus runs in a browser tab, or as its own app (`oculus.app`, the Linux folder of a release, or Electron from the checkout), on macOS, Linux and Windows through WSL2. The menu bar's items run what their keys and palette commands run.

The app starts the server, and a quit stops it and leaves the tmux sessions running. When the server ends on its own, a dialog gives its exit code and reason and offers Restart, and the open windows reconnect to the new server.

On Linux the folder panel is `zenity` and the opener `xdg-open`, and under WSL2 the opener is `wslview`. A missing one is named at start, and oculus starts all the same.

### The rail

The rail holds one button per entry of `rail:` in `config/defaults/layout.yml`, with the open workspace file's `settings:` laid over it entry by entry, by `page`.

- A button shows its page, made from its arrangement under `arrangements:` the first time and as you left it after that. Reset gives the arrangement back.
- A badge is the sum of the counts the page's views give the rail, those whose row of `counts` says `rail: true`, in the most urgent of their colours, red before amber before green.
- A drag moves a button, and Hide in its right-click menu hides it. Both are written into the open workspace file's `settings:`.
- The entry carrying `project_boards: true` (Projects) holds the project boards of `boards:` in its group.
- The entry carrying `unplaced_collections: true` (Registries) holds the collection views whose `collections:` entry names no group.
- Update, at the foot, opens the update tray: the schedules of the schedules file and the four update tasks, each a file `.oculus/tasks/<task>.md` of a hub that a Claude session follows. The tray offers the task of every hub that holds its file.
- Chat, in the update tray, starts a Claude session over the portfolio, whose index holds the projects of every hub and the files of the collections each hub's `chat_context` names.
- A schedule runs a task, a command of a repository's `.oculus/commands.yml` or a prompt on a cron pattern, in local time. A run missed while oculus was stopped starts once when it starts again, and a due run while the last one still works is skipped. The entries' keys are in the [Data map](data-map.md#bookmarks-schedules-and-tasks).
- Run unattended starts Claude on a task or a prompt with `--dangerously-skip-permissions`. A scheduled command runs only while you have approved its chain of commands.

### Pages and panes

A page is a working surface: a tree of splits and panes, each pane a strip of tabs.

- The layout is saved as it changes, into `~/.oculus/layouts.json`, one arrangement per workspace, and every browser tab and app window of one server shares it.
- Eleven views exist once: Settings, Focus, Usage, Live HPC, Findings, History, Processes, Pages, Workbenches, Status and Apps. Opening one goes to wherever it is.
- A view opened for something (a project, a person, an entry, a document, a file, a diff) lands in the first of these places that exists:
  1. a workbench's documents pane;
  2. the pane that took the last such tab;
  3. the pane you are in, if it holds such tabs;
  4. an empty documents pane;
  5. a new pane split off to the right.
- A single click on a file opens a preview tab, which the next single click replaces. Typing, a double click or a second click keeps it.
- Float, in the pane menu or a tab's menu, or a drag of a tab with Alt held, floats a pane over every page. Let go within 24 px of the left, right or bottom edge to dock it. Return to Page puts it back where it stood, or splits it off the page's largest pane when the page was rearranged so that its place is gone.
- A pane from the arrangement stays, empty, when its last tab closes, and a pane you split off closes with its last tab.
- Lock Group keeps a pane's tabs to the ones opened in it.
- The tabs a page starts with are pinned, and only Close in a tab's menu closes one.
- Reopen Closed Tab reopens the tabs the last close closed, and the window keeps twenty until it reloads.
- Go Back and Go Forward walk the tabs you made active and, in a source tab, the places you jumped to. Each window keeps its last fifty steps until it reloads.
- The unsaved text of a source tab or a form survives a tab switch and a reload.
- Shift+F10 or the menu key opens the right-click menu of the focused control.

### Workbenches

A workbench is a page for one folder, laid out as the rail's Explorer page, with Files, Repositories, Deposit (for a project), Sessions, Search and the TeX view limited to that folder.

- Open Workbench is on a project card, a collection card whose `link` is a folder, an entry page and a person's folder block.
- Open in New Files, on a folder in Files, opens a workbench for that folder.
- A folder has one workbench at most.
- On a workbench Problems is limited to the folder and Terminal starts in it.
- Closing a workbench keeps its layout, twenty at most, for the Workbenches view to reopen. Reset layout rebuilds it from `workbench:` in `config/defaults/layout.yml`.

### The palette

The palette finds views, projects, entries, files and commands by typing.

- Cmd+K opens it outside the editor. In the editor Cmd+K starts the editor's chords, and Cmd+Shift+P, F1 and Cmd+P open the palette.
- A typed word matches fuzzily, letters in order (`rpls` finds RAW-PLS). `:` starts a command, and `:` and a number goes to that line. Every command is listed in [the palette page](palette.md).
- `#` searches the workspace's symbols through the language server.
- Cmd+P finds a file by name across the served roots, the folders of the workspace, in at most 200 rows. It lists hidden files, honours `.gitignore`, and skips `node_modules`, `.git`, `.svelte-kit` and `.svelte-kit-app`. The list holds at most `search.max_names` names, and each root's list is given `search.timeout_s` seconds.
- `:task-add <title>` adds a task, with the status of `statuses` that carries `default_task` (`todo` in oculus's), to the Tasks file of a hub that holds one. With more than one such hub it asks which.

### The status bar

The status bar, along the window's foot, follows the repository and the file of the active tab.

- The repository, branch and sync items follow the first of these that exists:
  1. the repository holding the active tab's file;
  2. the workbench's folder;
  3. the repository picked from the repository item's list;
  4. the hub's repository.
- Switching branch and Sync ask first. Sync pushes when the branch is only ahead, and otherwise pulls then pushes.
- The bar's right-click menu hides or shows an item, and writes what you hide into the open workspace file's `settings:`. With no workspace file open, the menu offers Save Workspace As... in place of the items.
- Do Not Disturb, in the notifications list of the bell, keeps new notifications from showing as toasts. It holds on every page and after a reload.

## The views

### Focus

The deadlines, follow-ups and tasks across the portfolio, the projects waiting on someone, and the projects on their lanes.

- Its sections, and their order, are `focus.sections` of `config/defaults/behavior.yml`: the command center, the tasks, the quick add, the Awaiting box, the band and the lanes.
- A project sits on the lane of `focus_lanes` whose `stages` holds its `stage`, or on Blocked or Backburner when its `status.chips` carry `blocked` or `parked`. Dropping a card on a lane writes what the lane's `move_writes` names: the stage, or the chip.
- The command center, at the top, lists the dates of the records while they lie within `deadline_horizon_days` of `focus:`, a project's deadline until its stage carries `deadline_met`, and the feed lines: what the Lit Watch, Inbox and Scout feeds say needs doing, and the nudges to refresh a stale feed.
- Mine only, in the Filter list, keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one. It is on at the start, and it and Role are drawn only while a person has `self: true`. A feed line stays whatever the filter.
- The band, above the lanes, is the work that is not a project, in three columns: the funding schemes by `fund_stages`, the entries of the files flagged `band_positions` by `position_stages`, and those flagged `band_teaching` by `teaching_stages`.

### Awaiting board

The projects behind one name of the Awaiting box of Focus: a name of Waiting on or Under review, or Blocked's count, opens it.

- It holds the projects the name counts under the Focus filter in force at the press.

### Project boards

The projects a board's rule takes, as cards or as a list: Projects, Supervision, Coauthor, Archive, Personal and Software in oculus's `boards:`.

- Each key of `boards:` in `config/defaults/layout.yml` is a board view. A project shows on every board whose keys it meets: its `tier`, your role on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field.
- Your role is the first row of `roles` whose field holds the person `self` names:
  - Lead: `lead:`;
  - Supervisor: `supervisors:`;
  - Collaborator: `collaborators:`;
  - Other: any other project that names people.
- A board draws one section per row of `categories` that holds a project, the first row holding it, in that order, then "other". Inside a section the pinned projects come first, then each follows the row's `sort`.
- New project writes the project's manifest, `<folder>/<id>/project.yml`, with a README, the board's tier and you in the field of the board's role, in the folder `new_project_dir` gives for the tier. It is on the boards whose rule takes the project it writes.
- A project card's title opens the project page beside the board as a preview tab, which the next project opened from the board replaces.
- A project no board takes, a manifest without `lead:` and a `tier` that is no word of `tiers` are findings.

### Project

One project's page, in the layout every record page shares: the card with its fields in two columns (one in a narrow pane), a row of count buttons, one per row of `categories` and then the total, then the record's blocks under small labels. A count button opens the record's board, "Projects of <name>", with that row's projects picked, and the total opens it with all of them. A project's row counts the projects it is related to by `related:`, either way, and its blocks are its files, its subtasks and its follow-ups.

- The FILES block lists the files of the extensions in `file_index.ext`, newest first, at most `file_index.max_per_project`.
- A follow-up's `after:` keeps it off Focus until that date, and Done keeps it on the card, struck through.

### Editor

The form of one record: a project, an entry, a person, a lead, a Lit Watch paper or the career file. Edit, on a card's menu and on a record's page, opens it.

- It has one control per field of the file's `schema:` (for a project, of `manifest-schema.yml` and the hub's `manifest_fields`), grouped by the `section:` of each field.
- F2 on the primary key in the file renames it everywhere it is named.
- Save writes only the changed fields and keeps the file's other lines and comments. A refused field keeps what you typed, and unsaved edits survive a tab switch and a reload.
- A field that picks people offers Add person with the typed name when no person matches, and writes the person to the people file of the record's hub.

### Deposit

The code deposit of one project: a mirror clone of its `code/` folder, and its Zenodo record.

- The mirror is kept under `~/.oculus/deposits`, synced from the project's `code/`, with its own commits, pushes and branches. Snapshot replaces the mirror's remote with one commit of what would ship, after asking.
- For review stops the upload at a file whose bytes still hold a term of `code_availability.anonymize`.
- Publish sends a new version of the record the `doi` names, or a new record when there is none.
- Both write `doi`, `zenodo_status`, `zenodo_date` and, for review, `review_link` into the manifest's `code_availability`. The `deposit.zenodo` keys are in [the hub's settings](data-map.md#the-hubs-settings), and the `downloads` rows in [this machine's values](data-map.md#this-machines-values).

### Inbox

Your mailboxes, with what each thread asks of you and a drafted answer.

- Each account is a `mail` row of [this machine's values](data-map.md#this-machines-values).
- A thread is on your plate when it is unread in the inbox, carries the `todo` label, or is one unlabelled message that is no reply or forward. A thread whose newest message is your own, or that is in the trash, leaves it.
- The notes per thread are in `triage.json` in the folder `mail_dir` names, written by the card and by the Inbox update task.
- Send and Archive are the only writes to a mailbox.

### Position Leads

The academic openings the scout update task found, from the `leads` feed.

- Applied leaves the new entry in the Applications file's unsaved text until you save it, and lists the hubs that could take it with the primary first.
- Each status control writes the one word of `lead_statuses` carrying its flag (`lead_applied`, `lead_declined`, `default_lead`).
- A lead with a `deadline` goes to Expired once the day has passed, `rolling: true` or not. A lead with no day stays live until it is closed.

### LinkedIn

The posts and post ideas of the folder `linkedin_dir` names, one file each.

### Calendar

Your calendars, read-only.

- Oculus reads the calendars that the `calendars` rows of [this machine's values](data-map.md#this-machines-values) name. Their tokens and calendar links are files at mode 0600 in the folder `calendar_dir` names.
- `calendar.poll_min`, `calendar.days_back` and `calendar.days_ahead` set the polling.

### Post

A LinkedIn post with its body rendered, opened from the title of its card in LinkedIn.

- Edit opens the post's text file in a source tab. Mark posted moves the tab to the numbered file.

### Files

The folders of the workspace as a tree, with Open Editors, Outline, Backlinks, Timeline, Bookmarks, Notes and Tags.

- Every create, rename, move, copy, paste, upload and delete is undoable in History. Delete moves to the Trash after asking, and an undone delete restores files up to 5 MB.
- Before each save the old text of a file up to 256 KB is kept in the local history (`~/.oculus/history`, the newest 50 copies per file). The Timeline section lists those copies and the file's commits.
- The star on a row bookmarks it in the bookmarks file.
- Show Hidden Files, Show Ignored Files and File Nesting are kept per tab.
- A notes folder is `.oculus/notes/` of each hub. A note saves itself 800 ms after the last edit (`notes.autosave_ms`).
- `[[name]]` links to a note of the same hub, and renaming or moving a note rewrites every link that names it in its hub.
- A note's name is refused when it is empty, starts with a dot, is over 200 characters, or holds a control character or one of `/ \ : [ ] # ^ |`.
- A pasted picture is saved to `attachments/` of the hub's notes folder, up to 32 MB.
- Make Folder a Hub..., Make Folder a Project, Make Folder a Git Repository and Add Repository Configuration..., in a folder's menu, write the files the [Data map](data-map.md#the-files) names, from their templates. Make Folder a Hub... writes nothing when a file it would write is there already, and names that file.
- The private folders, the `secrets` folder of every hub and `~/.oculus`, are left out of search, the language servers, linter fixes and apps.

### Repositories

VS Code's Source Control over every repository of the workspace: its folders, the repositories below them, and the folders projects are cloned into.

- The repositories below a folder are searched down to `repository_scan_depth` levels: the global option takes 0 to 3, 1 when unset, and a workspace folder's own `repository_scan_depth` takes any whole number from -1, which means no limit ([the workspace file](data-map.md#the-workspace-file)).
- Pull is `git pull`, Sync pulls then pushes, and Fetch runs `git fetch --prune`. Only a deposit's snapshot is force-pushed.
- `git.autofetch_minutes` above 0 fetches every repository with a remote once each period. The default is 0.
- A failed fetch is named with the kind and the fix of the first row of `connections.failures` whose `match` git's or ssh's error output holds.
- A write that runs the repository's hooks, and Stage All's add of new files, has no time limit and Cancel stops it. Other git commands time out after 10 seconds (60 for Fetch).
- A git host you signed in to in Account setup answers git's requests for credentials at its `credential_address`, through oculus's credential helper.
- Removing a worktree refuses while it holds uncommitted work.
- Oculus keeps the repositories below a hub out of the hub's git, as the [Data map](data-map.md#repositories-below-a-hub) says.

### Sessions

The agent sessions on this machine and oculus's terminals. The sections of the picked session stand under them.

- The sessions are grouped by workspace: pinned first, then those that need input, then newest.
- A press shows the session's terminal, or its transcript, in the page's Terminal tab.

### Search

A pattern across the files of the workspace, with replace.

- It runs ripgrep over the served roots and leaves out:
  - ignored files and files over 2 MB;
  - folders whose name starts with a dot, apart from each hub's `.oculus/notes/`;
  - `node_modules`, `.git`, `.svelte-kit` and `.svelte-kit-app`;
  - the private folders.
- Find in Folder, in a folder's menu in Files, limits it to that folder.
- An answer holds at most `search.max_hits` hits, and each root's search is given `search.timeout_s` seconds.
- Replace All over the whole answer is one History record. A file changed since the search, locked, binary or over 256 KB stops Replace All at that file, and the answer names the files written before the stop.

### TeX view

Commands, Structure and Math Symbols for the LaTeX file in front.

- A file builds through its root, the first of these that exists:
  1. the file a `% !TEX root = <path>` comment names;
  2. the file itself, if it has `\documentclass`;
  3. the main file that includes it;
  4. the only main file of its folder.
- `% !TEX program = xelatex` or `lualatex` picks the engine and `% !LW recipe = <name>` a recipe. The recipes and tools are `latex.recipes` and `latex.tools`.
- A build that would read a `latexmkrc` or run document code (`Rscript`, `julia`, `pweave`, `quarto`, `R CMD Sweave`) waits until you approve it, and a changed file asks again.
- `latex.auto_build` is `on_file_change` (the default), `on_save` or `never`. A failed build's errors go to Problems and the editor.
- texlab serves LaTeX and BibTeX tabs, and `latex.formatter` picks the formatter of Format Document.

### Terminal

Terminals running Claude, Codex or a shell, inside tmux, so they survive a server restart.

- An option that makes the agent ask less (Accept edits, Auto, Bypass permissions, Full access) asks first, every time.
- A start from a task's `agent` button runs the task's text only after Approve and Start, kept in the approvals file. A changed text asks again.
- An agent typed in a shell terminal is detected from the process table within five seconds.
- Each pane of a tmux session you started yourself is a terminal while Claude or Codex runs in it. Attach to Session takes it in, and closing its tab leaves the tmux session running.
- Lock this tab keeps the tab's boxes and grids from taking typing until it is unlocked, and holds after a reload.
- A terminal starts with git's credential settings for the git hosts you signed in to.
- Closing a tab, pane or page ends its terminals, asking when one runs a program. Moving and reloading keep them running.

### Problems

The errors and warnings of language servers, commands, LaTeX builds and linters.

- ChkTeX, Ruff, ESLint and ShellCheck run on the saved file. `lint.chktex`, `lint.ruff`, `lint.eslint`, `lint.shellcheck` and `lint.writing` switch them, and ESLint waits for your approval of the repository's configuration.
- The writing rules warn on Markdown, YAML and comments, and skip the files of `lint.writing_skip`.
- The filter takes comma-separated terms: a word, a path glob, or a term after `!` to leave out.

### References

Find All References, implementations, call and type hierarchies, and the places that name a hub key.

- A location in a library opens a read-only tab.

### Debug

The debugger: a program of cathedra's rite language (`.rite`) under oculus's own adapter `rite_dap`, or another language under an app's debugger. One debug session runs at a time.

- Its configurations are `configurations:` of the repository's `.oculus/launch.yml` ([the files](data-map.md#the-files)). With none, Start runs the open file with its debugger's first configuration. `before` names a project command that runs first.
- Each launch of `rite_dap` asks first, and the yes is kept. `rite_dap_bin` in this machine's values names the adapter's program.
- Breakpoints and watches are kept in `~/.oculus/debug.json`.

### Debug Console

The program's output, and expressions evaluated while the debugger is paused.

### Notes Graph

The notes of every hub as a graph: a node per note and an edge per `[[link]]`, filtered to one hub.

### Session

The Details, Changes, Timeline and Agents of one agent session, in a tab of its own.

### Source

One text file in the editor, with its language server.

- A file locked, too long, not UTF-8, or a version at a commit opens read-only. A save is atomic and refuses a file with a NUL byte or that is not UTF-8.
- When the file changes on disk, a tab with no unsaved text reloads it, and a tab with unsaved text keeps it and says so.
- On save: `editor.trim_trailing_whitespace`, then the language's `format_on_save`, then `editor.final_newline`. One Cmd+Z undoes all of it. `editor.autosave` is `off`, `after_delay` or `on_focus_change`.
- Indentation, word wrap and rulers come from the first of these that sets them:
  1. the tab's own choice;
  2. the file;
  3. the repository's `.oculus/settings.yml`;
  4. `editor.languages`;
  5. the global keys.
- Python (pyright), C and C++ (clangd), TypeScript and JavaScript, Svelte, YAML, Markdown, and LaTeX and BibTeX (texlab) have a language server per folder, which stops 60 seconds after the last tab closes. A repository's own interpreter, `svelte.config.*` and `vite.config.*` wait for your approval.
- clangd uses a `compile_commands.json` at the root or in `build/*/`, or a configuration of `.oculus/cpp.yml`.
- In a hub YAML file a value whose schema field has `foreign_key:` is a link to its entry, and F2 renames the key in every file after a Refactor Preview.
- An edit a server makes to other files is one History record. It is refused whole when a file it names is:
  - open in another page;
  - outside the workspace, or in `secrets` or `~/.oculus`;
  - over 5 MB;
  - changed on disk.
- A write over a hub file that a source tab of the page holds unsaved text of is refused, whichever control sent it, with a note to save or revert the tab first.

### File

A picture, a PDF in oculus's viewer, or, for any other file the editor leaves to it, the file's name with a link.

### Document

A local HTML file in one of the served roots, in a frame of its own so its stylesheets and scripts run.

### Doc

A document of the hub's `docs:`, or a guide of oculus's own folder, rendered. A relative link to another Markdown file opens that document as a tab.

### Markdown Preview

One Markdown file rendered, as it was last saved.

- `$...$` and `$$...$$` are typeset with KaTeX, here and in the text fields of the cards. A formula KaTeX cannot typeset shows as its source in red.

### Math Preview

The math at the caret of a `.tex` tab, rendered.

### Diff

The diff of a file staged or changed, a commit, a stash, a worktree against its branch, or the edits a replace or a refactor would make.

- In a file's own diff each hunk can be staged, unstaged or reverted, whole or for the lines selected in it.

### Merge

The three-way merge of one conflicted path, Incoming and Current above the Result. Complete Merge writes the Result over the file and stages it.

### Refactor Preview

A language server's edit before anything is written, one check per file and edit. Apply writes the checked edits.

### Customization

One file the Sessions view's Customizations section lists, read-only: an account's `CLAUDE.md`, a skill, a subagent or a settings file.

### Language server output

The last 2000 lines one language server wrote to its standard error, read-only.

### Collection views

The entries of one data file as cards or as a table: Funding, Talks & Events, Education & Service, Applications and Tasks on the Academic Life page, Statements, People, Organisations and Resources on Registries, and Literature on its page.

- The file is the one the collection's entry of `collections:` names ([collection files](data-map.md#collection-files)). A collection has a view while a hub lists it.
- A card is headed by the entry's display, the filled field of the lowest `display:` rank of its file's schema, else its primary key.
- The cards go pinned first, then by the `sort:` of the collection's entry.
- Add asks for the new entry's primary key and the fields its schema marks required, writes the entry to the file of the hub whose `collections:` lists the collection, and opens its page. With more than one such hub it asks which.
- The entries of a file with no primary key are read-only, and the Findings view offers Set as primary key on it.
- More, in the view's bar, holds a Projects section on a collection whose cards draw a strip of projects at their foot: Category, Stage, Form, Tier, Role and Pillar. A pick narrows each card's strip to the projects it picks and hides a card whose strip it leaves empty.

Literature has its own rules for adding a paper:

- A paper's key is the first author's surname, the year and the first word of the title, with `b`, `c` and on added when the key is taken.
- Add looks a DOI, an arXiv paper or a PubMed paper up through the sources of the Literature search and saves the paper they merge into. Any other address is saved as an entry of its address.
- Save to Literature, on a Literature search hit or a Lit Watch paper, writes the paper to the Literature file of a hub that holds one. With more than one such hub it asks which.
- A paper with the DOI of one already kept, or with its title when either has no DOI, is refused.

### Memories

The pictures of every hub's memories folder, `memories_dir`, and of every folder under it.

- The walk skips a folder whose name starts with a dot and a link to a folder.
- Add takes a JPEG or PNG and puts it in the primary hub's folder.

### Career

The career file of the primary hub, drawn as record cards: the strategy, and the positions, degrees, awards, references and employer CV profiles the website's CV is written from.

- Edit opens the editor on the career file beside the page.
- Write the website writes one History record per file. A manifest that carries `publication:` at a stage without `public`, or with `negative` or `dead_end`, gives a finding in place of an entry.

### Entry

The page of one entry, a lead or a Lit Watch paper, laid out as a project's page. An entry's row counts the projects that name it, and the people, funding schemes and settings that name it are a line of tags on its card. When its `link` is a folder of the hub, that folder's documents, files and sessions are its blocks. A lead or a paper draws its feed's card with no row. The title of an entry card opens the page.

- Delete asks first, naming the records that refer to the entry, and Undo in History brings it back.

### Pillars

The research lines of the `pillars` file, and the projects whose `pillars:` name each.

- The lines are drawn in one section per row of `pillar_kinds`, then Other. The Orphans card is drawn in the first row's section and the Archival card in the section of `offpillar`.

### Domains

The projects by application domain, in the colour of their cards, from the `domains` file.

### Map

The pillars and the projects as a graph, linked by pillar membership and by `related:` edges. An edge one manifest lists has one arrow, from that manifest, and an edge each manifest lists has two.

- The layout is Graphviz's neato from a seed the tab keeps, so a page saved with a map draws the same picture again.
- A link drawn in link mode writes a `related:` edge into the manifest.
- With no stage picked the map draws the projects at stages without the `terminal` flag.

### Listing

The projects of the Archival, Orphans or No funding card, as closed project cards, opened from that card's title.

### Venues

The venue catalogue of the `venues` file, in one section per row of `venue_categories`.

- A row with `ribbon: true` draws the month ribbon of its venues' deadlines and meetings.
- Read from the browser asks the hub's journal browser by the venue's first ISSN, then the next while no hit answers, and writes the fee and the open-access status of the one journal it finds.

### Journal Browser

The journal browser of a hub, the row `venues.browser` of its `.oculus/config.yml`, searched by words.

- Only a press asks the browser: Search and More send one request each. Add writes the journal into the hub's venues file.

### Data

The datasets of the `data` file, with their provenance and the sources each comes back from.

- A set whose sources are all of kinds its hub's `recover.sources` rows name has a Recover control.

### Person

The page of a person, laid out as a project's page. The row counts the projects whose `lead:`, `collaborators:` or `supervisors:` name them, then "<n> waiting on <name>" for the projects whose `waiting-on:` names them. A student's supervision folder is its block.

### Recover

The files of one dataset, fetched and checked on this Mac or on a cluster of `slurm.resource`.

- Fetch downloads every missing, partial or different file, and a partial file resumes. It waits for the `downloads` row a source's `auth` needs.
- A run goes on when the view or the window closes.
- On a cluster the download runs on the login node, and Verify and Unpack are `sbatch` jobs. Unpack there fetches Node.js from the folder `recover.node_download` names.

### Literature search

One query to the sources of `literature.sources`, oculus's rows laid over by the primary hub's by `key`.

- A source whose row's `auth` needs a `downloads` row is asked once you have set that row.
- Results with one DOI, PubMed id or arXiv id merge, each field taken from the source `literature.prefer` puts first.

### Lit Watch

The new papers that touch the active and the manuscript projects, from the `radar` feed, one group per bucket of `radar_buckets`. Running Lit Watch from the update tray sweeps again.

### Present

A deck on screen, with its overview, full screen, presenter screen and PDF export. The [Decks guide](decks.md) gives a deck's files and keys.

- The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files.
- A slide's edit, add, duplicate and delete, from its right-click menu, and every change in the Overview are written at once, and History undoes each.
- In a browser, Export to PDF opens the print dialog.
- A deck whose groups hold project decks draws the Projects board's filter, which narrows the slides on screen and leaves the deck's files as they are.

### Apps

The installed apps and the state of each.

- An app needs your approval, and runs, in a sandboxed frame, only while its files are the ones you approved.
- An app reaches the folders of the workspace apart from `~/.oculus`, oculus's `config/`, a hub's `secrets` folder and every `local.yml`.
- What an app adds shows while it is approved and enabled. The [Apps guide](apps.md) has the rest.

### Help

This manual. The Help page beside it holds the Keyboard Shortcuts view, oculus's guides and the hub's documents whose `docs:` entry names the group `help`.

### Keyboard Shortcuts

The keys the workbench, the palette, the debugger, the editor, the LaTeX tab and the apps bind, and in the app the desktop app's own, each with what it does, built from the code that binds it.

### Settings

The options by scope, with a search over them.

- The scope is the file the rows write:
  - Workspace: [the workspace file](data-map.md#the-workspace-file);
  - Primary hub and Hub: [a hub's settings](data-map.md#the-hubs-settings);
  - This machine: [this machine's values](data-map.md#this-machines-values);
  - Repository: a folder's `.oculus/settings.yml` ([the files](data-map.md#the-files)).
- A change is held as unsaved until Save, and a save is one write of the file, its comments and its other keys kept.
- Reset takes your value out of its file. An entry of oculus's you remove is written as `removed: true` in a list or `null` in a map.
- The value of a `downloads` secret stays on the server.

### Account setup

Your own app registration at Google and Microsoft, the sign-in to a git host, and the key and account of each cluster.

- Your app's client is saved to `~/.oculus/connect/`, and a git host's token in `git-<key>.json` there, at mode 0600.
- Make key runs `ssh-keygen` with the type `clusters.key_type` names and keeps a key file that is there. The host's key is added to `~/.ssh/known_hosts` once you compare its fingerprints and trust them.
- Put the key on the cluster logs in once with the password you type, which goes to that one ssh alone. Save writes the cluster's row of `clusters:` in [this machine's values](data-map.md#this-machines-values) of the primary hub.

### Views

The views and documents by group, each with its key.

### Pages

The pages, the rail's and your own. A press on a page's row shows that page.

### Status

The connection, the snapshot (the hubs' records the page holds, with a count of each kind), the Claude Code hooks block, and the Gallery of every interface primitive on sample data.

### Findings

The problems found in the hubs' files, each with its file and line, and in the Audit section what the hub is missing.

- Each convention under `audit:` ([the hub's settings](data-map.md#the-hubs-settings)) applies once the hub sets it.
- Mute writes a finding's signature to `audit_ignore:` in the open workspace file's `settings:`.
- A Website finding of a generated file that differs offers Write the website.

### History

The writes oculus made on this machine, newest first, each with Undo.

- The log is `~/.oculus/changes.jsonl`, and `changes.keep` sets how many writes are kept. A source tab's saves go to the local history.

### Processes

The terminals, the processes matching `processes.patterns` and the app programs, the program of each app whose `app.yml` names a `host`.

### Live HPC

The queue and quota of each cluster `slurm.resource` names, one section each.

- Each cluster is an entry of the resources file ([collection files](data-map.md#collection-files)), reached over ssh with your row of `clusters:` ([this machine's values](data-map.md#this-machines-values)).
- It runs `squeue`, `sacct` and `sinfo` on each cluster over ssh every `slurm.poll_min` minutes.
- Submit Job, on a `.slurm` file, shows the plan (the folders, the rsync arguments, the `sbatch` command) before it runs, warns when the script does not use `/local/$SLURM_JOB_ID`, and copies with rsync, which adds and updates files on the cluster.

### Usage

What each agent account of the `accounts` rows has spent, refreshed every `usage_refresh_min` minutes.

### Workbenches view

The open workbenches and the closed ones whose layout is kept.

## The keys

Off macOS, Cmd is Ctrl.

`?`, the palette's `:keys` and the app's Help > Keyboard Shortcuts open the Keyboard Shortcuts view. It lists the keys of the workbench, the palette, the debugger, the editor, the LaTeX tab and the apps, and in the app the desktop app's own.

A letter then a digit opens a view. The letter is the group's `chord` (on its `rail:` entry, or in `nav_groups` for the float), and the digit is the view's place, so the first nine views of a group have a chord.

| Key | What it does |
|---|---|
| 1-9 / Ctrl+1-9 | show that rail page / that tab of the focused pane |
| Ctrl+] / Ctrl+[ | next / previous tab of the focused pane |
| Ctrl+Tab / Ctrl+Shift+Tab | next / previous tab (in the app) |
| Cmd+W | close the active tab, asking over unsaved text (in the app) |
| Cmd+Shift+T | reopen the tabs closed last (in the app) |
| Ctrl+- / Ctrl+Shift+- | go back / forward through the tabs and places visited; off macOS back is Ctrl+Alt+- |
| Cmd+N; Cmd+Shift+N / Cmd+Shift+W; Cmd+,; Cmd+R | new text file; new window / close window; settings; reload (in the app) |
| Tab / Shift+Tab | move between controls; in an editor Tab indents, and Escape then Tab moves on |
| arrows, Home / End | along the rail or a tab strip |
| arrows, Home / End, a letter | in a tree: move a row, open or close a folder, first / last row, next row starting with that letter |
| Delete | close the focused unpinned tab |
| f1, p1-p6, e1-e4, s1-s9, c1-c7, l1-l3, r1-r7, b1-b3, t1, y1-y8 | open a view of a group (f Focus, p Projects, e Incoming, s Explorer, c Academic Life, l Pillars, r Registries, b Literature, t Present, y System) |
| w1-w3 | Live HPC, Usage, Workbenches |
| a1-a9 | the Apps view, then the apps and the views they add |
| h1 / h2 / h3-h7 / h8, h9 | Help / Keyboard Shortcuts / the Apps guide, Templates, Data map, Palette and Decks guide, in the Help page's order / the hub's `docs:` entries of the Help group |
| j / k, i / o | move the card cursor left / right, up / down a row |
| Esc | clear the card cursor |
| Enter | open what the cursor is on |
| / | focus the board's search; in Search, back to the query box |
| g g / G | top / bottom of the page |
| n | new agent session in the page's Terminal tab |
| Cmd+Shift+F / Cmd+Shift+H | Search / Search with replace |
| Enter; Up / Down | in a Search box: run; walk the last twenty texts |
| Cmd+Alt+Enter / Cmd+Shift+1 / Cmd+Backspace | in Search: Replace All / replace the focused row / dismiss it |
| Enter, F2 | on a Files row: rename |
| Cmd+Down / Space | on a Files row: open / open in the background |
| Cmd+Enter | on a Files or Repositories row: open beside |
| Cmd+Backspace | on a Files row: delete |
| Cmd+C / Cmd+X / Cmd+V; Esc | on a Files row: copy / cut / paste; drop the cut |
| Cmd+Alt+C / Cmd+Alt+Shift+C | on a Files row: copy the path / the relative path |
| Cmd+Z / Cmd+Shift+Z | in the Files tree: undo / redo the last file operation |
| Cmd+A; Shift+Up / Shift+Down | in the Files tree: select every row; extend the selection up / down |
| Esc / Enter | in a Files name box: cancel / accept |
| Alt+Up / Alt+Down | move a root, bookmark, note or section of Files |
| Cmd+S | save the source tab, the Settings tab's changes, or an app's tab |
| Alt+Z | toggle word wrap |
| Cmd+Shift+M; F8 / Shift+F8 | Problems view; next / previous problem |
| Cmd+Shift+B / Cmd+Alt+T | default build / default test of the repository |
| Cmd+Alt+B / Cmd+Alt+C / Cmd+Alt+V | LaTeX build / clean / view PDF, in a `.tex`, `.sty` or `.cls` tab |
| Cmd+Alt+J | LaTeX: show the caret's line in the PDF, in a `.tex` tab |
| Cmd+Alt+M / Cmd+Alt+X | Math Preview, in a `.tex` tab / TeX view |
| Cmd+Alt+[ / Cmd+Alt+] | promote / demote sections, in a `.tex` tab |
| Enter / Alt+Enter | in a LaTeX list environment: new `\item` / plain new line |
| Cmd+L, then Cmd+B, I, U, E, R, T, S, C, N, 6 or - | wrap in `\textbf`, `\textit`, `\underline`, `\emph`, `\textrm`, `\texttt`, `\textsl`, `\textsc`, `\textnormal`, `\textsuperscript`, `\textsubscript`, in a `.tex` or `.bib` tab |
| Cmd+L, then Cmd+Enter / Cmd+W | insert `\item` / surround with a command, in a `.tex` tab |
| Cmd+L, then Cmd+L / Ctrl+Shift+M | select the line / tab focus mode, so Tab leaves the editor, in a `.tex` tab; off macOS the second is Ctrl+M |
| Ctrl+Shift+M, then Cmd+B, I, R, T, S, Shift+B or C | wrap in `\mathbf`, `\mathit`, `\mathrm`, `\mathtt`, `\mathsf`, `\mathbb`, `\mathcal`, in a `.tex` or `.bib` tab |
| Cmd+K | open the palette, or close it when open; in the editor, the first key of the editor's chords |
| Cmd+K Shift+Enter | in the editor: pin or unpin the tab |
| Cmd+Shift+P, F1 | palette in command mode |
| Cmd+P | find a file by name |
| Cmd+T | symbols of the workspace (in the app) |
| Shift+Enter | palette, on `:task-add`: add and open |
| : | command line |
| F2 | rename the symbol; on a hub key in YAML, rename it in every file |
| F12 / Cmd+click | go to definition; on a hub key, open its entry; on a Markdown link, follow it |
| Shift+Alt+F12 | all references and implementations |
| F4 / Shift+F4; Shift+Alt+H | next / previous reference; call hierarchy |
| Alt+O | switch source and header |
| Alt+F5 / Shift+Alt+F5 | next / previous change |
| F5 | start or continue debugging |
| Shift+F5 / Cmd+Shift+F5 | stop / restart debugging |
| F9 | toggle a breakpoint |
| F10 / F11 / Shift+F11 | step over / into / out |
| Enter, Tab, Up / Down | in the Debug Console: send, complete, history |
| Cmd+F | find in a terminal, or in the app's window for a view with no find of its own |
| Ctrl+Enter / Cmd+Enter | commit; send a diff comment |
| Enter, Shift+Enter, Delete | on a terminal row: show / split / kill (twice) |
| Shift+F10 | the right-click menu of the focused control |
| arrows | on a docked float's handle: resize it |
| F / P / O | in Present: full screen / presenter screen / overview |
| Right / Left, Page Down / Page Up, Space / Shift+Space | in Present: next / previous slide |
| Home / End | in Present: first / last slide |
| Escape | in Present: close the overview, then end presenting |
