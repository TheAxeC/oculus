# Oculus

Oculus is the private working surface for the research hub: one page in a browser on this machine, reading the hub's own YAML and Markdown from disk and showing it as boards, lists and documents. It writes only where a control says it writes, and only back into the same files. This page is the manual; the Config view beside it shows the files every one of these surfaces is configured by.

## The window

Down the left is the rail. Across the top of the work area is the page strip. Everything else is the pane tree: one tree per page, made of splits and panes, each pane a stack of tabs, each tab one view.

### The rail

The rail draws one button per view, under the heading of the group the view belongs to. A group of more than four entries is drawn as one button with a list beside it instead, so the rail never grows an icon per view. The groups, their order, their letters and the hub documents they carry are the `nav_groups` and `docs` keys of `config/layout.yml`.

A click opens the view where views land, which is the pane whose tab was activated last; a view already open is activated where it is rather than opened twice. A shift-click opens it in a new pane to the right of that one, and the next shift-click joins that pane as a tab while it is still open.

A group also carries the hub documents the `docs` key gives it, drawn after its views and opened as a tab each. Under all the groups sit the bookmarks, the configured ones (a local HTML file under a configured root) and the reader's own from the Files view, each opened as a tab of its own, and at the foot of the rail the appearance controls: the theme list, the two text-size steps and the reset, the CRT overlay, the wallpaper where the theme has one, and the toggle between the glyph vocabulary and its ASCII stand-ins.

### Pages and the pane tree

A page is a whole working surface with a name: its own tree, its own tabs, its own arrangement. The strip across the top switches between pages, makes one, renames one and closes one. The digits 1 to 9 switch pages directly.

Inside a page:

- **Split.** Drag a tab onto the edge of a pane to split that pane and drop the tab into the new half. The pane menu splits without a drag.
- **Fold.** Every child of a split has one control that folds it to the split's edge and shows it again. A folded child is saved folded.
- **Maximise.** A pane can be drawn alone, the rest of the tree left where it is, and shown again from the same control.
- **Drag.** A tab moves inside its pane, to another pane, and to another page by way of the strip.
- **Show a page.** A leaf of a page's tree can be another page, drawn where it sits with a header naming it. It is the same page, never a copy: a tab opened in it is open wherever that page shows. A page never contains itself and is drawn at most once on a screen.

The layout is saved as it is changed, so the window comes back as it was left.

## The keys

| Key | What it does |
|---|---|
| 1-9 | switch page |
| Ctrl+1-9 | switch tab in the focused pane |
| v1-v9 | open a view of the rail by its place |
| c1-c9 | open a view of the Academic life group |
| m1-m9 | open a view of the Sessions group |
| s1-s9 | open a view of the Sources group |
| y1-y9 | open a view of the System group |
| Tab / Shift-Tab | next / previous tab |
| j / k | move the card cursor left / right |
| J / K | carry the card under the cursor left / right |
| i / o | move the card cursor up / down a row |
| Enter | expand the card under the cursor |
| / | focus this board's search |
| g g | top of page |
| G | bottom of page |
| Cmd-K | jump palette |
| : | command line |
| Esc | clear the cursor |
| Ctrl+Shift+Left / Right | move the page |

The sheet itself opens with `?` and closes with `?` or Escape. The letters before a digit are the `direct_chord` of `config/layout.yml` and the `chord` of each group in `nav_groups`. A group's documents follow its views in its chord, so the digit after the group's last view opens its first document; the directly drawn groups' documents follow the direct views under the direct chord the same way.

## The views

| Id | Name | What it shows |
|---|---|---|
| `focus` | Focus | What wants attention now: deadlines, overdue items, follow-ups, the week's ticker and the career strategy. |
| `projects` | Projects | The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. |
| `coauthor` | Coauthor | The same board over the projects someone else leads. |
| `archive` | Archive | The same board over finished work and dead ends. |
| `programs` | Pillars | The research programmes and which projects sit under each. |
| `domains` | Domains | The application domains and the projects in each. |
| `map` | Map | The portfolio as a graph of projects and what links them, filtered by project type, by research line and to the projects that still hold a line membership. |
| `venues` | Venues | The venue catalogue with its tiers, deadlines and concentration warning. |
| `data` | Data | The dataset registry: where each set came from and how it is recovered. |
| `code` | Code | The repositories registry, what the portfolio says about its own code, and the software projects of the `projects/software` tier with the papers each one names. |
| `statements` | Statements | The reusable boilerplate paragraphs. |
| `files` | Files | The file browser over the hub, the engine config folder and the configured roots, with saved workspaces. A scratch note's file is made by the first keystroke typed into it, and the delete control in the Notes list is the one thing that takes a note away. |
| `repositories` | Repositories | Every repository oculus knows, one section each: the branch line, what is changed, the newest twenty commits, the branches, and the worktrees of the root with the controls that make, open, merge back and remove one. |
| `funding` | Funding | The funding schemes, their stage and the statement each grant requires. |
| `events` | Talks & Events | Talks, events and what is coming. |
| `education` | Education & Service | Teaching and service entries. |
| `applications` | Applications | Position applications and where each stands. |
| `collaborations` | Collaborations | The collaborations and their state. |
| `tasks` | Tasks & Service | The task list. |
| `present` | Present | The public deck, one slide at a time, with an overview grid. |
| `radar` | Lit Watch | The literature radar the scout writes. |
| `leads` | Position Leads | The position leads the scout writes. Dismissing one sets its status to `dismissed` in the feed file, so it leaves the counts and History can undo it; the toolbar toggle shows the dismissed ones and each card's reopen control puts it back on the radar. |
| `inbox` | Inbox | The private email triage feed. |
| `linkedin` | LinkedIn | The posts pipeline: what is posted and what is still an idea. |
| `session-list` | Sessions | Every agent session on this machine, live ones first. |
| `session-detail` | Session | One session: what it is doing, its model, its workspace and its controls. |
| `terminal` | Terminal | A terminal running Claude, Codex or a shell inside tmux. |
| `transcript` | Transcript | One session's turns as they were written. |
| `timeline` | Timeline | One session's turns over time. |
| `changes` | Changes | The git state of the workspace a session works in. |
| `agents` | Agents | The agents a session has running under it. |
| `status` | Status | Whether the socket is up, which snapshot the page holds and how much is in it. |
| `findings` | Findings | Every problem the data layer found in the hub's files, each naming its file and key. |
| `gallery` | Gallery | Every primitive with sample data in one pane, the living style sheet, opened under each theme to see what a card, a chip, a meter and a table look like there. |
| `hpc` | Live HPC | The cluster queue: what is running, what is pending and the quota. |
| `usage` | Usage | What each agent account has spent. |
| `help` | Help | This manual. |
| `config` | Config | The files the configuration is merged from, each with its text and an edit control. |
| `audit` | Audit | What the hub is missing, in six sections: open markers, manifest gaps, folders off the tier standard, status chips the project's own tier and type contradict, fields that have stopped being a glance, and the website's publication list against the portfolio. Each finding can be muted. |
| `memories` | Memories | The photo wall, with a control that adds a picture and a click that enlarges one. |
| `history` | History | Every write oculus made on this machine, newest first, with what each field held before it and a control that puts it back. |

Four views are opened for something rather than listed in the rail: `project` (one project as its own tab), `editor` (its manifest form), `deposit` (its public code deposit) and `doc` (one Markdown document of the hub, from a group of the rail). Three more open from a file: `document` (a local HTML file in a frame), `file` (one file drawn by what its name says it is, with a control that opens a text file the source tab may save in that tab) and `source` (one text file, edited and saved, a Markdown file beside the rendered document its text makes, which a control in the bar takes away). One more opens from a repository: `repositories-diff` (one file's diff, staged or as the worktree has it, or everything a worktree holds that its repository does not).

## Worktrees and the merge back

The Repositories view is over every root the file browser serves, the hub and the configured roots and whatever the current workspace added, plus the workspace of every session. Each section is the pushed state of that repository: nothing is polled, and a commit made in a terminal moves the section within two seconds. A diff is the one thing not pushed; it is read when a pane opens it, so a repository with two hundred changed files costs the socket nothing.

A worktree is a second checkout of the same repository on a branch of its own, which is how one repository carries two pieces of work at once. The control at the bottom of a root's worktree list takes a name, says the path before anything is made, and on confirm makes `<root>/.agents/worktrees/<name>` on a new branch of that name from the repository's HEAD, then opens a shell there. A repository whose `.gitignore` does not carry `/.agents/worktrees/` is warned about in the view rather than edited: what a repository ignores is its owner's to decide, and without the rule a worktree made there becomes content of the repository.

Each worktree row carries four controls: its diff against the repository's checked-out branch, a shell started in it, the merge back, and the removal. The merge back is git's own `merge` onto the checked-out branch, a fast-forward where it can be one and a merge commit otherwise. It is refused when the repository has staged or changed paths of its own, when the repository has no branch checked out, when the name is not one of the repository's own branches, and when the branch asked for is the one checked out; a conflict is taken back with `merge --abort` and reported by the paths that conflicted, so a press on the page never leaves a repository half merged and a real conflict is taken to a terminal knowingly. An untracked file does not refuse a merge, because git carries one across untouched.

Removing the worktree is a second control and never part of the merge. It refuses a worktree holding uncommitted changes or untracked files, which is the difference from the merge: the removal takes the folder away and everything in it with it, so a file git never saw would be a file nobody can get back. The branch goes with the worktree only when no work is left only there, and the answer says when the branch was kept.

## The configuration

The files below sit in the `config/` folder of the engine, `tools/oculus/config/`. Every one but `local.yml`, which is this machine's own, is read on every load and merged into one map by its top-level keys, so a key moves between files without a reader noticing. The Config view shows the same list, each file with its text and a control that opens it for editing; an edit saved there is picked up and pushed to the page without a reload.

| File | What it holds |
|---|---|
| `appearance.yml` | The UI theme list, the wallpaper behind the panels, the Memories wall's folder, the CRT default and the terminal text size. |
| `behavior.yml` | Thresholds, horizons and cadences: read limits, stale days, the context window, the Live HPC settings, the audit's waiting statuses and mute list, git and chat. |
| `glyphs.yml` | The glyph vocabulary, one character per name, and the ASCII stand-in a terminal theme draws instead. |
| `icons.yml` | The line icon each glyph name is drawn as, one row per name in the glyph vocabulary. |
| `layout.yml` | How things are arranged: the rail groups, the hub documents, the board chrome, the tab rollups, the live badges and the saved arrangements. |
| `manifest-schema.yml` | The project.yml edit form as data: its sections, its fields, the widget each field is edited by, and where a widget takes its choices from. |
| `meta.yml` | The tool identity: the title and the subtitle the window carries. |
| `present.yml` | The public deck the Present view draws: the deck slides, the domain themes, the tag tones and the order. |
| `sources.yml` | What the portfolio reads: the scan paths, the registry and collection files, the feeds, the roots a local file is served from, and the extensions a source tab may open and save. |
| `vocab.yml` | Words and their colours: the palette, the research domains, the status legend, the focus lanes, the venue tiers and the radar buckets. |
| `local.yml` | This machine's own values, read on their own and never merged into the configuration: the hub path, the port, the ssh alias of the cluster, the Claude command, the account folders and where the machine-local state is kept. |

Every user-facing word lives under `config/text/`, one file per surface, and is read by its dotted key. Those files merge with the rest, so a word is changed there and nowhere else.

`local.yml` sits in the same `config/` folder, last in the list, and is this machine's own. Its keys are `hub`, the absolute path of the research hub; `port`, the port the server listens on; `hpc_host`, the ssh alias the Live HPC view uses; `claude_bin`, the Claude command an unattended terminal runs; `accounts`, the agent account folders the Usage view reads; and `sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes` and `changes`, the places the session cache, the per-session overrides, the saved workspaces, the reader's own bookmarks, the scratch notes and the change log are kept in. Every key has a default, so a machine that sets only `hub` works. The whole file is read once when the server starts, and `hub`, `sessions_overrides`, `bookmarks` and `changes` are read again on every write, every wallpaper request and every file opened outside the browser, so an edit to one of those four holds from the next such call and an edit to `port`, `hpc_host`, `sessions_cache`, `workspaces`, `notes`, `claude_bin` or `accounts` holds from the next start. The file is not tracked, so no machine path is ever in the repository, and it is served and edited like the files above it: the Config view cards it with a tag saying it is this machine's own. It is the one file of the folder whose keys are checked before a save: a body the server could not read back is refused with the reason, and the file is left as it was.

## Where the data comes from

Everything on the boards is read from the research hub, whose absolute path is the `hub` key of `local.yml`. The scan rules of `sources.yml` name the folders projects sit in, and a project is any folder holding a `project.yml`. The registries, the collections and the feeds are single YAML files named in the same place; the manuscripts, READMEs and decks are Markdown in each project's own folder.

Nothing is copied into a database. The server reads the files, builds one snapshot of entities and relations, and pushes it over a WebSocket; it watches the hub and the config folder, so a file edited anywhere reaches the page in the same second. The long documents stay out of that snapshot and are fetched one at a time when a tab shows one.

Three things outside the hub are read as well, all of them this machine's own. The agent sessions are read from the folders `accounts` names, `~/.claude/projects` and `~/.codex/sessions` for the transcripts and `~/.claude/sessions` for which Claude session is alive. The session cache, the per-session overrides, the saved workspaces, the reader's own bookmarks and the scratch notes are read and written under `~/.oculus`, or wherever `local.yml` puts each of them. The engine's own `config/` folder is read on every load and written when a file of it is saved from a source tab.

Writes into the hub go back to the files they came from: a manifest field from the editor, a collection entry from a card, a text file from a source tab. Every write is a POST carrying the page's own token, and nothing outside the hub, the engine config folder, the machine-local files under `~/.oculus` and the configured roots is ever written; what is read beyond those is the agent account folders above, and the workspace a session names when its git state or its terminal is opened.

Every write through the write endpoint that changed something is recorded in the change log, `~/.oculus/changes.jsonl`: when it was made, which file it wrote, what it addressed, and the value that file held before it against the value it holds after. That is the manifest fields, the collection entries, the subtasks, the feeds, the deck and the per-session overrides, and a scaffolded idea and the two LinkedIn writes, which are recorded and cannot be taken back; a text file saved from a source tab and a scratch note go through their own endpoints and are not recorded. The History view draws the log newest first, and the control on a row puts the earlier value back through the writer the change came from, refusing when the file has changed since. `changes.keep` in `behavior.yml` is how many changes the file holds.

## Running it and checking it

The server runs on this machine only, bound to the loopback address, on the port `local.yml` names. `npm run dev` runs it in development; `npm run build` builds it and `npm run preview` serves that build.

The checks, from `tools/oculus`:

- `npm test` runs the unit suite over the data layer, the server, the stores, the shell and the views.
- `npm run check` runs the TypeScript and Svelte check over every file.
- `npm run test:browser` drives the built page in a real browser, which is where the layout, the drag, the keyboard and the sanitiser are exercised.
- `npm run lint` and `npm run format:check` hold the source to its conventions.
