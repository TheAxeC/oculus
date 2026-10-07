# Views guide

One section per view of the Views catalogue, with what it shows and how its controls behave, then the views opened for something rather than listed. The Files, Repositories, Terminal and Sessions views have their own guides, which their sections here point to.

## Focus

What wants attention now: deadlines, overdue items, follow-ups, the week's ticker, the lanes and the career strategy. A project of any tier, coauthor, archive and software included, sits on the lane its `focus:` names, and only a project of the ideas, active or manuscripts tiers can be dropped on the Ideas lane. A project of another tier on a lane has the flames and the Move to menu of every card, which write its manifest as they do any card's, and the ideas backlog and the unplaced hint stay over the three live tiers. Each card shows its first two statuses as a glyph and a word in the status's colour, and each lane's header is a strip of the lane's colour: Run green, Push blue, Revise amber, Review slate, Blocked red, Backburner grey, Scope dark cyan, De-risk honey and Build teal, the Ideas lane mauve, and the columns Funding gold, Jobs dark grey and Teaching teal, whose values are the `focus_lanes` and `focus_lane_tones` of `config/catalogs/vocab.yml`. A lane header is painted at full opacity, and a muted cluster fades a lane's sub-line and its cards and never its header. A ticker line's buttons appear under the pointer or the keyboard; on a device with a finger and a pointer, the first tap draws the buttons at the row's end and cuts the name where they begin, the next tap presses what it lands on, and a tap away closes them. A ticker line with no hidden button opens what it names on the first tap. A line that is a task, which is an entry of the Tasks collection or a subtask of a project, a funding scheme or an entry, has an `agent` button, which opens the composer in the task's folder with the task as the prompt; a snoozed line, a follow-up, a lead, a venue and a project's own deadline have none. A subtask's, a follow-up's and a task's done is always shown. The Awaiting a response strip counts the people and venues of every live project and of every project of another tier on a lane. While every cluster is open and every Funding, Jobs and Teaching column is drawn, each header has a colour that differs under every theme from the header drawn next to it, the one stacked above or below it, and the full-width Ideas lane; collapsing a cluster or emptying a column can bring two headers of the same or a near colour together.

## Projects

The projects board, as cards or as a list, searchable, with the pin, the stale badge and the card's own controls. An opened card draws the project's fields under their labels, Status, Latest, Results, Outcome, Next, Follow-up, Ideas / avenues and Reproduced, with backticked words drawn as code; Follow-up is one line per note, and a note whose `after` date lies in the future says `not until` that date. Under Files it draws the project's folder as the Files view's tree: the folder is the head of the tree and is open the first time the card is drawn, there is no workspace header and no `..` row, and a press, a key, a menu, a drag and a drop act as they do in the Files view, a file opening the way that view opens it. Each card of a tab keeps its own open folders and selection. The box above the tree filters: with text in it the tree gives way to the project's files of the extensions `file_index.ext` in `behavior.yml` names that match the text, where a Markdown file, a script or a LaTeX source opens as a document tab, a file whose extension `open.program_ext` maps to an application (a `.docx`, an `.xlsx`, a `.pptx`) opens in that application on this machine, and any other file is a link the browser opens or saves. A project folder that lies inside no folder of the workspace is said to be outside it, with Add Folder to Workspace. The folder control shows the project folder in Finder, and Show in Files selects it in the Files tab of the page, opening one there when the page has none. Each card's controls appear under the pointer or the keyboard and stay on one line, the ones that do not fit behind More at the controls' own size, and in a pane narrower than the card they stay inside what the pane shows; one Filter control in the bar holds every facet under its heading, ticks the values in force and counts them on its button, and its compute facet offers the resources present by name; a card draws one tag per resource, the cluster's with the HPC glyph; a long ELI5 is cut to four lines with Show more, which the tab remembers; a card with no subtasks offers adding the first among its controls and draws no subtasks block until it has one. The cards of a grid are stretched to one height along each row and stay in the file's order.

## Coauthor

The same board over the projects someone else leads.

## Archive

The same board over finished work and dead ends.

## Personal

One card per side project: a folder of `side-projects/` holding a `project.yml`, and a repository that is a Files root and holds `.oculus/project.yml`. A side project is on no other board, lane or audit. A repository is read once it is a Files root, added with **Add Folder to Workspace...** in the Files view or under `roots:` in `sources.yml`. The status is one of `running`, `building`, `idea` and `parked`. A card shows the title, which opens the manifest, the status in its colour, where the project lives, the explanation cut to four lines with Show more, what comes next, and its links, which are links only when they name a web page. The bar searches title, explanation and next, and one toggle per status hides or shows its cards; a status the manifest names that the list does not is drawn as unknown and sorted last. Show in Files selects the project's folder. The tab's badge is the number of cards.

## Pillars

The research pillars and which projects sit under each.

## Domains

The application domains and the projects in each.

## Map

The portfolio as a graph of projects and what links them, filtered by project type, by pillar and to the projects that still hold a pillar membership. The three filters are one wrapping row in the pane's bar, above the legend. A label that would cover another label or any node but its own is hidden until its node is hovered or holds the keyboard; a pillar's label is placed before its projects', and an archived project's label is dimmed with its node.

A press on a node fixes it where it lies and moves nothing; dragging it moves it while the other nodes are pushed and pulled, and letting go frees it and lets the picture settle, in a pane of any shape. The re-tune control lays the map out again from another start and keeps that picture, so a saved page draws the same picture again.

## Venues

The venue catalogue with its tiers, deadlines and concentration warning. A `wos:` or `scopus:` that opens with a check or a cross is drawn as the check or cross icon before its words, or as that icon's stand-in on a terminal theme. A venue whose `link` is a path of the hub opens that file in a tab of its own and carries Show in Files.

## Data

The dataset registry: where each set came from and how it is recovered.

## Code

The repositories registry, what the portfolio says about its own code, and the software projects of the `projects/software` tier with the papers each one names.

## Statements

The reusable boilerplate paragraphs.

## Files

The Files view is the file browser over the hub, the engine config folder and the configured roots, with Open Editors, Outline, Timeline, Bookmarks and Notes under its tree; its tree, menus, file operations and local history are in the [Files and search guide](files-and-search.md#the-files-view).

## Repositories

The Repositories view is VS Code's Source Control over every repository oculus knows, with the commit box, the changes, the graph, stashes, tags, branches and worktrees; the whole view is in the [Source Control guide](source-control.md#the-repositories-view).

## Search

A pattern across the files of one served root or of all of them, the hits grouped by file, each match one row opening its file in a source tab at that line, and, with the replace row shown, a replace over those matches as the editor's Search view replaces.

## References

The locations a language server found for Find All References (Shift+Alt+F12) or, where the server offers it, Find All Implementations in a source tab, under a count, one row per file and one per location with the match marked. A press opens the location at its line, and F4 and Shift+F4 step through the latest result. The pane's actions refresh, clear, clear the history of the last ten searches and collapse all.

## Funding

The funding schemes, their stage and the statement each grant requires.

## Talks & Events

Talks, events and what is coming.

## Education & Service

Teaching and service entries.

## Applications

Position applications and where each stands.

## Joint work

One entry per piece of work with one person, and the pipeline it is in. Who the person is lives in the people registry, and each entry names them by key.

## Tasks & Service

The task list. A card whose status the Focus ticker lists has Start Agent, which opens the composer in the card's folder with the task as the prompt.

## Present

A deck, one slide at a time as a 16:9 frame scaled to its pane, with an overview grid. A deck is a folder holding a `present.yml` and Markdown slide files, a file holding several slides split by a line of `---`. The deck menu in the toolbar opens the portfolio deck (`portfolio_deck:` in `sources.yml`), the deck of any project that has a `present/` folder, a deck the pane has shown, and a deck opened from the Files view with Open Presentation on a `present.yml` or on a folder that holds one. A deck has one tab on a page: Open Presentation, a project's Present button and the deck menu bring forward the tab that already shows the deck they ask for. A tab of a deck folder shows the folder's path above the slides and has the file items of a tab menu (Copy Path, Reveal and the rest). A figure or image the deck's folder lacks, or that lies outside the root, is drawn as a gap naming it, and the deck carries a finding for it.

The Present control in the toolbar and `F` put the slide on the whole monitor, in a browser tab and in the desktop app, with no rail, tabs or toolbar, and Esc leaves; there the arrows, Space (Shift+Space goes back) and a click move through the slides, and the pointer hides after 2 s at rest. The other single keys of oculus wait until you leave, and a shortcut that moves the keyboard to another pane ends the full screen. Full screen also ends when the tab is hidden or the deck holds no slides.

The Slides button in the toolbar opens the catalog of the deck's groups beside it, for the deck that pane shows. The Order list at the top holds the entries of the deck's `order:` (a slide file, the slides of a group, a summary, a grid), and you drag each to another place or step it with its up and down controls. Each group lists its members in the order of its `slides:` list with a tick, a position and the controls that move it, the decks its `find:` (folders, tiers and status chips) found as candidates, the names `slides:` holds that match no deck as missing, and the decks two discovering groups both find as conflicts. A member is dragged within its group or onto another group; a deck dropped on a group whose `find:` does not find it is refused with a sentence that says so. Save writes the `slides:` list of every group that changed and the `order:` list into its `present.yml` in one write and keeps every other line of the file. An entry of `order:` moves with its own lines and comments. When the file changed on disk meanwhile the save is refused whole, with a sentence that says so, and the catalog shows what the file holds now. History lists each changed list as its own record and undoes it while the file still holds it. A project that has a deck gains a control on its card, Open Presentation, which opens its deck.

A right-click on the slide, or on its tile in the overview, offers Edit Slide, New Slide, Duplicate Slide and Delete Slide, and the command palette lists the same four for the slide on screen. Edit Slide opens the slide's file in a source tab beside the pane at the slide's first line; for a summary or a grid it opens the deck's `present.yml` at that entry. New Slide writes a file `slide-<n>.md` holding a text slide headed New slide, and adds it to `order:` after the slide on screen. Duplicate Slide copies the slide, as a file `<name>-copy.md` after the slide's file or, in a file of several slides, as a slide right after it. Delete Slide asks first. A file that holds only that slide goes to the Trash together with its entries in `order:`, and a slide in a file of several slides is cut out of the file. A summary or a grid leaves `order:` and keeps its group. A slide of a member deck belongs to that deck, so it offers Edit Slide and New Slide, and no Duplicate or Delete. History undoes each of these; undoing a New Slide moves the new file to the Trash. A source tab over a file of the deck's folder that holds no unsaved text reads the file again once an act has written it. An image dropped on a slide of the deck's own files is copied into the deck's folder, under a free name, and linked at the end of the slide's text. A file that is no PNG, JPEG, GIF, WebP or SVG image, more than one file and a file over 32 MB are refused in the status line at the end of the toolbar, which also says what each act came to.

While a source tab of the same page holds text of a slide's file that is not saved, the slide is drawn from that text within a quarter of a second of the last keystroke. Revert in the source tab draws the file's text again. Only the files the deck reads are drawn from drafts.

Export to PDF in the toolbar, and in the palette, writes the deck as `<name>.pdf` in the deck's folder (`<name>` is the folder's name, the project's name for a project's `present/` folder), one slide to a page of 1280 by 720 px with selectable text. A slide taller than its page is scaled down to fit it. A file of that name is replaced only after the question the Files view asks. In the desktop app the page is printed by a hidden window and saved through the Files view's upload, so History lists the file and undoes it. The export gives up after 60 seconds and says so. In a browser tab the control opens the deck's print page in a new tab, which opens the browser's print dialog when the slides are loaded, and the PDF is saved from there. A PDF over 32 MB is refused, naming the limit. No other format is exported.

## Lit Watch

The literature radar the scout writes, the toolbar closing with the control that opens that feed file. A long author and venue line is cut with an ellipsis, the whole line in its tooltip, and the cards narrow with the pane.

## Literature search

One query asked of OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC and arXiv, and of Web of Science and Scopus when `local.yml` holds their keys. A toggle per source, each with the state of its answer beside it (the number of hits, rate limited with the wait the source named, no answer within `literature.timeout_s`, key refused with the status, failed, skipped when the source cannot hold a filter), and a toggle that cannot be pressed names its `local.yml` key in its tooltip. The hits are merged into papers when they share a DOI, a PubMed id or an arXiv id, and a preprint and its published version are one paper when some source names both. Filters: year range, document type, open access only, venue, author and minimum citations; each is also applied to the merged list, so a source that ignored a filter shows nothing outside it. Sort by relevance, date or citations changes the order and asks nothing; `More` asks the next page of every source that has one. A card shows the authors, the venue, year, type and citations (each source's count in the tooltip), one tag per source, the abstract under a disclosure, Open PDF when a source names an open one, Copy BibTeX (from doi.org, Semantic Scholar or the arXiv DOI, else formatted by citation-js; it writes no file) and Add to Lit Watch, which asks for a bucket, a project, the relevance and a note, appends the entry to the radar file and reads `In Lit Watch` afterwards. A search sends the query and its filters to the sources that are on and to nothing else. Google Scholar is a link that opens the same query on its site, since it has no API and its terms forbid scraping.

## Position Leads

The position leads the scout writes, the toolbar closing with the control that opens that feed file. A lead not yet applied to carries `applied`, which opens the Applications add form beside the leads, filled from the lead; saving it writes the application and then sets the lead's status to `applied`, and a cancel, or a save the file refuses, leaves the lead as it was. An open lead carries `decline`, which sets its status to `declined`, so it leaves the counts and History can undo it. The bar's toggle declined (n) shows the declined leads, counting the older `dismissed` ones with them, and its tooltip reads Show declined (n) or Hide declined (n); each closed card's reopen control puts it back on the radar.

## Inbox

The reader's own mailboxes read live: one row per configured mail account with its Connect control and a row menu whose Remove asks first, Add account in the head and on the empty page, and the plate in four sections by what each thread wants, each one column of cards. A card is titled by the sender's name with the address beside it, and draws the subject, the note, a two-line snippet, the kind tag in the Triaged section alone and the account tag while more than one account is configured; its row carries Draft reply, the thread at its provider, Archive and Triaged, and Draft reply opens an editor holding the answer with Save and Send in it.

## LinkedIn

The posts pipeline: what is posted and what is still an idea. It is drawn from a folder of one file per post rather than from one file, so the way into the text is each card's own control.

## Sessions

The Sessions view lists every agent session on this machine, grouped by workspace, with the terminals oculus runs below them; the list and its controls are in the [Terminals and commands guide](terminals.md#sessions).

## Session

One session in a tab of its own: what it is doing, its model, its workspace and its controls.

## Terminal

The Terminal view is a terminal panel of its own: each Terminal tab owns one or more terminals running Claude, Codex or a shell inside tmux; starting, splitting, finding in and ending a terminal are in the [Terminals and commands guide](terminals.md#the-terminal-view).

## Transcript

One session's turns as they were written, one tab per session.

## Timeline

One session's turns over time.

## Changes

The git state of the workspace a session works in (a path is shown whole in one line and cut at its end when the pane is narrow, and the verb and the count of the files the session touched line up in columns): its branch, the same commit box as the Repositories view, and its changes with Stage All, Unstage All and Discard All on the group heads (its commit box says Sync Changes or Publish Branch where there is nothing to commit, which is how the panel pushes) and each row opening its own diff tab for the session, a conflicted path the merge editor; in that tab a `+` beside a line (or Add Comment on Line in the line's menu) opens a comment box after it, and Send hands the comment to the session as a prompt naming the file and line, typed into its terminal when oculus runs it and copied to the clipboard otherwise, with a line saying which; a repository with no commit yet included; or one line saying the session names no workspace folder, that the workspace folder is not there, that the folder is not a git repository, that git could not read the repository and why, or that git has not read the workspace yet.

## Agents

The agents a session has running under it: the subagents its transcript names. A subagent started in the background reads running until the session's notice that it stopped: done when it completed, stopped when it was killed, error otherwise; without a notice, until its own transcript has been still for 30 minutes. A subagent resumed after its notice reads running again once it writes its transcript, and its next notice ends it again.

## Status

Whether the socket is up, which snapshot the page holds and how much is in it, and the line counts of oculus's own files by folder and language, with a TODO count and one row for everything under `src/`.

## Findings

Every problem the data layer found in the hub's files, each naming its file and key.

## Gallery

Every primitive with sample data in one pane, the living style sheet, opened under each theme to see what a card, a chip, a meter and a table look like there.

## Live HPC

The cluster queue: what is running, what is pending and the quota; it is where a job queued by Submit Job shows.

One poll runs `squeue`, `sacct` and `sinfo` over ssh every `slurm.poll_min` minutes, with the disk quota on its own slower cadence. While the cluster is not answering the next attempt comes after two minutes instead of the full period, and an answer restores the regular cadence. The head marks its "as of" time stale when the answer on screen is older than the period plus two minutes. A failed poll keeps the last good queue, recent and partition rows under the state word with the time the cluster was last reached, and their controls are shown unpressable until it answers again. When `slurm.prewarm` is on, the log paths of the finished jobs are resolved in the background after each good poll, one at a time, so the first press on a log is as fast as the second and no press waits on the prewarm's walk. The host it connects to is the machine's `hpc_host` of `local.yml` when that names one, else the `host` of the cluster entry of `registries/resources.yml` that `slurm.resource` of `behavior.yml` names; when the entry is missing, is not a cluster, has no host, or has a host that is not a plain ssh alias, no ssh runs, the state is `unreachable`, and the view shows the sentence for why in place of the ssh error.

Live HPC's cancel runs `scancel <id>`. Submit Job copies a project's code to the cluster and queues a job from it, in two steps. The plan, which the confirmation shows, names the code folder, the cluster folder (`paths.cluster` of the manifest, else `~/projects/<id>`), the files git keeps minus `__pycache__`, `.npy`, `results/` and `logs/`, the rsync arguments, the one remote command `cd <folder> && sbatch --parsable <script>`, and whether the script or a file it sources names `/local/$SLURM_JOB_ID`. The run computes the plan again at the press and refuses with `changed` unless it equals the confirmed plan, then runs `rsync` and the ssh command, with a refusal word for each step that fails: `copy-failed` carries one line of rsync's stderr, the first line that begins `ssh:` when there is one, else the last, and `submit-failed` carries sbatch's. The copy never uses `--delete`, passes no `--mkpath` and runs no remote `mkdir`, so a cluster folder that rsync cannot create ends in `copy-failed` with the line rsync wrote. One run per `<host>:<folder>` goes at a time.

## Usage

What each agent account has spent. Each Claude account's refresher reads `ok, last HH:MM, next HH:MM`, the next at `usage_refresh_min` of `behavior.yml`; `ok, figures fetched at HH:MM` when the last refresh fell inside Claude Code's five-minute window and changed no figure; and `refreshing` only while a refresh runs.

## Help

This manual.

## Audit

What the hub is missing, in six sections: open markers, manifest gaps, folders off the tier standard, status chips the project's own tier and type contradict, fields that have stopped being a glance, and the website's publication list against the portfolio. Each finding is a row of the list, with a mute control at its end.

## Memories

The photo wall, each picture shown whole in a tile of one shape, a muted tile while it loads and its name when it fails, with a control that adds a picture and a click that enlarges one.

The add control takes a JPEG or a PNG up to the size the Files view's Upload takes, checked before the file is read, and refuses a file whose first bytes are not the kind its extension names. A picture that failed to load is asked for again when its tile is pressed, so a file rewritten under its name is fetched anew.

## Calendar

The reader's own Google and Microsoft calendars and any published calendar link, read-only: one row per configured account with its Connect control (none for a published link) and a row menu whose Remove asks first, Add account in the head and on the empty page, and the events of the configured window as a day, a week, a month or a list, each account in a colour of its own, an event's title, time, calendar, location and tentative mark in its tooltip, the calendar filling the pane and scrolling inside itself, the view kept per instance and paging stopped at the window's edges. A provider or a published link that does not answer within 30 seconds puts its account in error with a sentence saying so, and the other accounts are still read. A Google account reads the calendars ticked in Google's own calendar list, and no others.

## Account setup

The steps that register the reader's own application at Google and at Microsoft, with the console links, the redirect addresses and the scopes to copy, and the fields each provider's client half is saved from, once for every calendar and mail account of it. It says whether each provider is set up and never draws a saved id or secret.

## History

Every write oculus made on this machine, newest first, with what each field held before it and a control that puts it back.

## Processes

What oculus started itself in tmux, each terminal under the name its tab shows, with its pane process as the group's row and the other processes of the terminal under it, then the local processes whose program the `processes.patterns` list of `behavior.yml` names. A name in the list matches a process whose program, or whose first argument, has that file name, so `node` lists a script run by node and `claude` lists the Claude command line but not a shell that was given a path holding the name; an empty list shows the terminals alone. The head line counts the projects in flight and the agents running, the `claude` and `codex` programs on the machine. The columns are PID, parent PID, user, start time, CPU, memory, command and the process's working folder; a press on a column head sorts within each terminal and within the matched rows. The figures are read every ten seconds while a page is open and not at all while none is, and a failed read keeps the last rows under its sentence. CPU and memory come from `ps` and differ from Activity Monitor's own measure; PID, user and command match it. Stop, on a terminal's own row, asks first, then ends that terminal and every process in it, including any started there by hand; no other process has a Stop.

## Views

Every view and hub document by group, with its key and badge; a press opens it on the page the reader came from and a shift-press beside there.

## Settings

The Settings editor over the options catalog: a search box with a count (`@modified` keeps the options that differ from their default, `@id:` looks in the key path), a table of contents of the groups and sections (under 700 px of width it is hidden behind a button in the header that shows it over the list, and choosing an entry or pressing Escape hides it again), and for each option its description, its default, the file and line of its key, and its control. The first group, This browser, holds the appearance values each kept per browser (the theme, the code theme, text size, terminal text size, CRT, wallpaper and icons); the Code theme menu offers From the theme (the syntax colours of the UI theme) and Shiki's bundled themes, and changes the syntax colours of the source tab, the diff and the merge editor alone. The theme list includes vscode dark modern and vscode light modern. The Wallpaper toggle starts on whatever the theme answers and holds a value of its own only once pressed, so saving any other appearance value leaves it alone. The Icons toggle keeps the icons on a terminal theme instead of their ASCII stand-ins. Then one group per subject: Appearance, Editor, Terminal, Sessions and usage, Cluster, Boards and audit, Rail and pages, Presentation, Project sources and Calendar and mail, and Without a heading while an option names no heading or an unknown one. Each group has a line for every config file it draws from, with the file's name, its description and a control that opens the file in a source tab; a file that is being read, could not be read, is cut or is not valid YAML says so on its line. This machine follows with the keys of `local.yml`, and last come a Catalogs group and a Texts group that list the files of `config/catalogs/` and `config/text/` (subfolders included) with the same control. The search reads a group's name as well as the settings, an empty search keeps a group whose files say why they hold no setting, and a typed search drops a group with no setting left. A toggle, a number, a text, a long text, a choice, a glyph, a hue, a colour, a folder, a file or a path is written to its file as it is set or left, recorded in History and undoable there, an undo giving the file back byte for byte with its comments and layout. A toggle of a field a record may lack has a third state, unset; a number is held to its range; a choice, a multi and a suggestion box draw from the list their option names (the domains, clusters, views, usage tiers, theme classes and the rest), say so while that list is still being read or could not be read, and mark a held value the list lacks as not in the list. A hue writes the palette name and a colour writes the first hex of the hue's class; a folder or file box offers the entries of the hub folder it has typed so far, and a path that is absolute, holds `..` or a backslash, or names nothing in the hub is refused before the write. The Editor group's Languages row also lists, for every served root, the languages that root's `.oculus/settings.yml` sets, a file that could not be read with the reason, and the entries of a read file that were skipped. A list, a multi, a parked list or a family is edited in its row: one field per item of a list, a picker for a multi, a key field and a value field per entry of a key/value table, and a card of fields per record, each field with the control its option names and a nested list of records drawn as cards inside the card, each entry with Move up, Move down and Remove, and Add after the last; a parked list offers Remove alone. A value a card's control cannot show is kept on the card and sent back unchanged. Save writes the whole value to its file with the file's comments and layout kept, recorded in History as a list or family and undoable there; Discard drops the draft; a refusal names its reason under the row; a draft stays in its tab across a reload, one started over a value the file no longer holds can only be discarded, and one over a row the file then holds in a form the editor does not draw is dropped, and the row says so. A list or family the file holds in a shape the editor does not draw is edited in the file, with Edit in the file's name. The `rail` row of `layout.yml` holds the rail list, edited and saved to `config/layout.yml`, and its `arrangements` row holds Reset all pages. The keys of `local.yml` are listed with their descriptions and never with their values.

## Pages

Every page, with show, rename and close, and New page. The browser tabs of one server, and the windows of the app, share the arrangement and each tab's own state: a page, tab or Terminal tab added or changed in one browser tab shows in the others at once, and so does what a view remembers (a Terminal tab's composer, a view's forms and filters). Each browser tab keeps showing its own page and keeps its own appearance (theme, CRT, wallpaper, icons, text size, terminal font, code theme, status bar). Two browser tabs that change the same thing in the same moment end with the last change.

## The control that opens a view's file

A view drawn from one file of the hub carries that file's own control, last in its toolbar, which opens the file in a source tab: the three feeds above, the collection views over the YAML their `collections:` entry names, the five registry views with panes of their own (Person, Venues, Data, Pillars and Domains) over the registry file each is drawn from, and each file line of a Settings group over the file it draws. The tooltip names the path, so the file the view is drawn from is read without finding it in the file browser first.

## Views opened for something

Six views are opened for something rather than listed in the Views catalogue: `project` (one project as its own tab, with a LaTeX panel over its manuscript, whose card leaves out the document row, the tab listing the project's present Markdown documents and drawing the card's tag for each known document the project has not got; the human-only marker is not shown there), `person` (one human, opened from a collaborator tag on a card, from a joint-work entry and from the Map's node, drawing the organisations they are affiliated to, the joint work that names them, the projects whose `collaborators:` name them and, for a student, the files of their supervision folder, with a Show in Files control on that folder), `editor` (a project's manifest form, which shows every field `catalogs/manifest-schema.yml` names that the project model carries: priority, waiting-on, snooze, the open subtasks and the follow-up note's `do` and `after` among them, the date read-only while the project has no note and its text is empty; a project with several follow-up notes shows them read-only, since the form edits one, and says to edit them on the Focus board or in its `project.yml`), `deposit` (its public code deposit) and `doc` (one Markdown document of the hub, from a group of the catalogue) and `latex` (the LaTeX main files of one folder, from Open LaTeX in the Files menu). Three more open from a file: `source` (one text file, edited and saved, its text coloured by language while the file is under `editor.paint_limit_kb` of `config/behavior.yml`, a Markdown file shown as source, with the rendered document its text makes beside it once Markdown: Toggle Rendered Half is run from the palette, in at most half the pane's width and with a table readable in a narrow pane), `document` (a local HTML file in a frame) and `file` (a picture, a PDF in a frame, or a name and a link that saves it); the three draw the file's path as the breadcrumb under the strip and no row of their own for its name. A file whose extension `open.program_ext` in `behavior.yml` maps to an application opens in that application on this machine, and in no other: the control "Open in its program" is beside the file view's link once it holds the file, as Open in Program in the right-click menu of a file tab (a source tab, a document, a hub document, a Markdown preview or a file view of a `.rtf`), in the row menu of a file in the Files view and in a project card's tree, on a project card's list of matching files and on a collection card's link to a file of the hub. No other file is offered. The page cannot see a file's mode or its Finder attributes, so a mapped file with an execute bit or marked as a Finder alias is refused when the control is pressed, and the view says so.

Three more are opened for one thing and are not listed in the catalogue either: `note` (a scratch note, opened from the file browser's Notes section, see the Files and search guide), `slides` (the slide catalog of one deck, opened from the Present view's toolbar) and `customization` (the viewer of one customization file, opened from a Customizations item, see "Customization files" below). Opened bare, each names nothing and can only say so.

## Customization files

A Customizations item names its file by real path (a link followed to its target), so the configured roots decide where it opens: a file a root holds opens in a source tab, and any other file opens in the Customization viewer, which shows an account's CLAUDE.md, a skill, a subagent or a settings file read only.

## Documents drawn as prose

A document drawn as prose (a hub document, a project's document, this manual, the preview beside a Markdown file in the source tab, or a Markdown preview tab) gives every heading an anchor: `user-content-` and the heading's words as GitHub writes them. A paragraph holding only `[TOC]` is drawn as the document's table of contents: one link per heading that has words, in order, indented by level, as at the head of this page. A press on an entry, or on a link to `#` and a heading's anchor with or without its `user-content-` part (`#method` reaches the heading Method), scrolls the tab to that heading, and the page's address stays as it was.

## LaTeX builds

The LaTeX view and the project tab's LaTeX panel draw the same rows. A main file is a `.tex` file directly in the folder whose first 64 KB declares a document class outside a comment, listed with `main.tex` first and the rest by name, so a folder that gains a supplement or a highlights file lists it the moment it is written; the project panel reads the `manuscript/` folder, and the LaTeX view reads any folder of a served root, opened from Open LaTeX in the Files menu on a folder, a root or a `.tex` file (for a file that builds through another main file, on that main file's folder). A `% !TEX root = <path>` comment names the main file a chapter builds through, and `% !TEX program = pdflatex`, `xelatex` or `lualatex` the engine `latexmk` builds a main file with; only the comment lines at the head of the file are read, in any case of `TEX`. Each row says when its PDF was last built, says `building` beside that time from the moment a build of the main file is asked for until its terminal has ended (a build a save started included), and offers Build and Clean, which run `latexmk` in the folder as terminals, so the output is in the terminal pane while it runs and stays readable, with the exit status, after `latexmk` ends (a main file has one terminal for Build and one for Clean, and a Build or Clean pressed again runs in that terminal; Build on a main file that is already building starts no second `latexmk`: it shows the running build's terminal and builds once more after it); PDF, which opens the built PDF as a tab; Log, which opens the build's `.log` file as a source tab; Count Words, which runs `texcount` over the main file and the files it includes and shows the number until the file is built again; and Outline, the sections of the main file followed through its `\input`, `\include`, `\subfile` and `\import` commands, a press opening the file at the section's line; a file the parser refuses is listed by its sectioning commands alone, without the files it includes, and is named under the list as not fully read; a file over 2 MB, or one that cannot be read, is named under the list as not read, and a main file that was not read never says it holds no sections. The errors and warnings of the last build are listed under a count ("1 problem" and "1 error, 1 warning" in the singular), errors first, as `file:line message` rows; a press opens the file at that line, and the same problems are drawn as markers in the editor of an open source tab. When a build ends the row redraws, and a PDF tab open on that file draws the new build without a reload. The folder is read again when the view or the panel is opened and when a file under its root changes, so a `.tex` file or a PDF written by another program shows without a build. Saving a `.tex` file builds its main file in the background, without showing its terminal, unless `latex.auto_build` of `config/behavior.yml` is `never`; Save All in Open Editors and a Timeline restore save too and build the same way, and a main file that is already building is built once more after it, however many saves came. In the editor, resting the pointer on math or on an `\includegraphics` path shows the typeset formula or, once it has loaded, the picture, and Format Document (Shift+Alt+F) formats the file with the program `latex.formatter` of `config/behavior.yml` names, as LaTeX Workshop's formatting setting offers them: `none` (the default, which formats nothing and says so), `latexindent` (it comes with TeX Live and MacTeX), `tex-fmt` (`brew install tex-fmt`) or `badness`. Each program is found on PATH unless `latex.latexindent_path`, `latex.tex_fmt_path` or `latex.badness_path` names where it is; all five keys are in Settings. A program that is not found is named with where to set its path, and the formatted text is an unsaved edit that undo takes back.
