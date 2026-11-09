# Data map

The [templates](templates.md) give every file with its keys and a comment on each, and [Help](HELP.md) describes the views that draw them.

## Contents

[TOC]

---

## The files

A folder that holds `.oculus/config.yml` is a hub. A workspace's primary hub is the one its `primary:` names ([The workspace file](#the-workspace-file)), and it holds what belongs to you and to this machine. Each path below is relative to the hub, unless the key named beside it moves the file.

A finding is a fault in a hub's files that oculus reports in the Findings view, with the file and the line.

| File | What it holds | Moved by |
|---|---|---|
| `.oculus/config.yml` | the hub's settings | |
| `.oculus/local.yml` | this machine's values, kept out of git | |
| `.oculus/workspaces/<name>.yml` | one workspace: its folders, its primary hub and its settings | |
| `.oculus/bookmarks.yml` | your bookmarks of the Files view | `bookmarks` |
| `.oculus/schedules.yml` | the schedules of the update tray | `schedules` |
| `.oculus/tasks/<task>.md` | the steps of one update task (`litwatch`, `scout`, `linkedin`, `inbox`), which a Claude session follows | |
| `.oculus/data/<kind>/<file>.yml` | the data file of one collection, at oculus's default path | `collections` |
| `.oculus/data/academic/career.yml` | the career file | `career_file` |
| `<folder>/project.yml` or `<folder>/.oculus/project.yml` | the manifest of one project | `scan` |
| `deck/` | the hub's own deck, a `present.yml` and its slide files ([Decks guide](decks.md)) | `portfolio_deck` |
| `.oculus/notes/` | the notes, one Markdown file each, and `order.json`, their order in the Notes list | |
| `.oculus/memories/` | the pictures of the Memories view | `memories_dir` |
| `.oculus/wallpaper/` | the wallpaper images | `wallpaper_dir` |
| `.oculus/apps/<name>/` | one app of this machine ([Apps guide](apps.md)) | `apps_dir` |
| the LinkedIn folder | the posts of the LinkedIn view, in the folder the key names | `linkedin_dir` |

A repository of the workspace may hold its own `.oculus/` folder:

| File | What it holds |
|---|---|
| `.oculus/project.yml` | the repository's manifest, a project like any other |
| `.oculus/settings.yml` | `languages:`, the editor options per language, as the records of `editor.languages` take them |
| `.oculus/commands.yml` | the named commands, each `{ name, run, cwd, depends_on, default, problemMatcher }`, or a `type` an app defines in place of `run` |
| `.oculus/launch.yml` | `configurations:`, the debug configurations, each `{ name, type, request, program, cwd, before }`. The `type` `rite` runs a program of cathedra's rite language under oculus's adapter `rite_dap`, and any other `type` takes the arguments of the app's debugger beside them |
| `.oculus/cpp.yml` | `configurations:`, the compile configurations clangd is started with, each `{ name, compile_commands, fallback_flags }` |
| `.oculus/app-data/<name>.json` | the store of an app the repository holds, written by oculus |

`~/.oculus/` is oculus's machine state, which oculus writes there, or where the keys of `local.yml` put it:

- the change log;
- the local history;
- the approvals;
- the language servers' state;
- the schedules' run record;
- the stores of the machine's apps.

The Files view's menu of a folder writes these files, each from its template:

- Make Folder a Hub... writes `.oculus/config.yml`, the hub files you tick (`local.yml` with its `.gitignore`, `schedules.yml`) and the data files of the collections you tick.
- Make Folder a Project writes `.oculus/project.yml`.
- Make Folder a Git Repository runs `git init`.
- Add Repository Configuration... writes the ticked ones of a repository's missing `settings.yml`, `commands.yml`, `launch.yml` and `cpp.yml`.

## The hub's settings

`.oculus/config.yml` may set these 69 keys. Oculus skips any other key and reports it as a finding.

```yaml
scan:                     # the folders projects are found in
portfolio_deck:           # the folder of the hub's own deck
collections:              # the data files, the registries and the feeds, each a key, a file and the fields of what it is
chat_context:             # the collections whose files a chat's index holds for the hub
new_project_dir:          # the folder a new project is made in, per tier
linkedin_dir:             # the website's LinkedIn folder
career_file:              # the career file
memories_dir:             # the pictures of the Memories view
wallpaper_dir:            # the wallpaper images
bookmarks:                # where your bookmarks are kept
schedules:                # where the schedules are kept
apps_dir:                 # where the machine's apps are kept
wallpaper.image:          # the wallpaper shown: <hub>/<file>, or random
docs:                     # the hub's documents, each listed in a group of the view catalogue
counts:                   # the views that draw a count, and where
palette:                  # the colour token each hex is drawn as (by word)
stages:                   # the stages of projects, with their words and flags (by word)
forms:                    # the forms of a project's output (by word)
chips:                    # the chips of projects, with their words and glyphs (by word)
statuses:                 # the statuses of collection entries, with their colours and flags (by word)
lead_statuses:            # the statuses of Position Leads, with their flags (by word)
focus_clusters:           # the clusters the Focus lanes are grouped in, in drawing order (row by row)
focus_lanes:              # the Focus lanes, in order, with what a move onto each writes (whole)
fund_stages:              # the stages stacked in the Focus Funding column, in order (whole)
position_stages:          # the stages stacked in the Focus Job applications column, in order (whole)
teaching_stages:          # the stages stacked in the Focus Teaching & supervision column, in order (whole)
focus_lane_tones:         # the colour of each collection lane bar of Focus (by word)
ticker_categories:        # the command center's deadline groups, with their words (by word)
facet_tones:              # the colour of each filter group of a board's bar (by word)
tiers:                    # the kinds of project a manifest's tier names (by word)
research_audit:           # the tiers the audit's research rules skip (by word)
roles:                    # your roles on a project, highest first (whole)
categories:               # the categories a project is filed under, each with its colour (by key)
deck_order:               # the order a deck places the categories in (whole)
rail_color:               # the colour of a project board's rail count (the hub's value)
leads_fit:                # the fit colours of the Position Leads (by word)
data_access:              # the colour of a dataset's access chip (by word)
venue_categories:         # the categories of venues, in order (whole)
pillar_kinds:             # the kinds of pillar lines, in order (whole)
venue_tiers:              # the tiers of venues, in order (whole)
radar_buckets:            # the buckets of Lit Watch, in order (whole)
manifest_fields:          # the fields the hub adds to the form of its own projects (by row)
slurm.resource:           # the clusters Live HPC polls, in order
clusters.key_type:        # the type of the key Account setup makes for a cluster
clusters.key_file:        # the path of that key, with {type} and {resource} put in
connections.failures:     # the rows that tell a failed ssh or git connection apart (by kind)
sign_in:                  # the providers you sign in with: google, microsoft and git hosts (by key)
recover.node_download:    # the folder of Node.js's releases Recover's cluster side downloads from
lint.writing_skip:        # the files the writing rules skip
lint.writing_glyphs:      # the files the writing rules let draw arrows as icons
audit.required_files:     # the files the audit asks a project to hold
audit.required_sections:  # the headings a project's file must hold while a manifest key has a value
audit.stage_folders:      # the folders a project at a stage is kept under
website.folder:           # the website's folder, which Write the website writes its three files into
website.cv:               # the command run in that folder after a write
website.kinds:            # the sections of the website's publications, by stage and form
website.paper_fields:     # the fields an entry of the publications writes, in order
website.paper_list:       # the key a section holds its entries under
website.code_link_name:   # the name the code link prints with
website.author_places.lead:         # the word of the user's place among the authors, as lead
website.author_places.supervisor:   # the same, as supervisor
website.author_places.collaborator: # the same, as collaborator
website.code_statuses.deposited:    # the word of a published code deposit's status
website.code_statuses.review_copy:  # the word of the anonymous review copy's status
website.doi_origin:       # the address a DOI resolves at
website.file_header:      # the comment line each generated file opens with
website.site_programs:    # the key of the website's own file whose map holds the research lines
website.cv_sections:      # the CV's sections in order, each with its fields, period and record fields
website.cv_lists:         # the lists of the career file the CV prints, each with its section
website.cv_entry_fields:  # the fields of a collection entry the CV takes
website.cv_fields.<role>: # the field each role of the CV reads, one key per role
website.cv_words.months:     # the twelve month words of the CV's periods
website.cv_words.open_end:   # the CV's word for a period with no end
website.cv_words.award_time: # the time and zone after the day of a CV timestamp
website.files.site:       # the website's own file, relative to its folder
website.files.cv:         # the CV's file, relative to the website's folder
website.files.papers:     # the publications' file, relative to the website's folder
website.files.industry:   # the employer CVs' file, relative to the website's folder
app_settings:             # the values of the settings apps declare
literature.sources:       # the reader rows of the Literature search, each the address, parameters and fields one source is read by (by key)
literature.prefer:        # the order of the sources a merged paper takes its fields, abstract and PDF from
recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind (by key)
venues.browser:           # the reader row of the hub's journal browser
links:                    # the addresses page links are built from (by key)
deposit.zenodo.address:   # the address every call of the Deposit view is built from
deposit.zenodo.timeout_s: # the seconds one upload of a project's zip is given
deposit.zenodo.auth:      # the header, prefix and downloads row of the token every Zenodo call carries
```

Oculus lays each key over its own value in the way the key's comment names:

- By word: a word the hub names replaces oculus's in oculus's place. A new word comes after oculus's words, and `<word>: null` takes one out.
- By key, by kind and by row: oculus lays the rows over its own rows the same way, by their `key` (`kind` for `connections.failures`). `{ key: <key>, removed: true }` takes a row of `categories` out.
- Whole: the hub's list replaces oculus's. A row of the wrong kind, or two rows naming one key, leave oculus's list standing with a finding.
- Row by row, for `focus_clusters`: a row of the wrong kind, or one naming the key of an earlier row, is a finding.
- Every other key replaces oculus's value whole.

The deck skips a key of the hub's `deck_order` that no row of `categories` holds, and the key is a finding.

A word the hub's values no longer give, taken out with `<word>: null` or left out of a list replaced whole, also leaves every word list that names it:

- a category's stage words;
- a Focus lane's stages, chips and `move_writes`;
- a count's `match`;
- a board's `tier` and `role`;
- `research_audit`'s `skip_tiers`.

In oculus's own values a row left with no word stays. In a list or a row the hub writes itself, each such word is a finding naming the hub's file at the word's place.

Oculus reads eighty-four keys from the primary hub's file alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`, `recover.node_download`, `lint.writing_skip`, `lint.writing_glyphs`, `literature.sources`, `literature.prefer`, `website.folder`, `website.cv`, `website.kinds`, `website.paper_fields`, `website.paper_list`, `website.code_link_name`, `website.author_places.lead`, `website.author_places.supervisor`, `website.author_places.collaborator`, `website.code_statuses.deposited`, `website.code_statuses.review_copy`, `website.doi_origin`, `website.file_header`, `website.site_programs`, `website.cv_sections`, `website.cv_lists`, `website.cv_entry_fields`, the forty keys of `website.cv_fields`, `website.cv_words.months`, `website.cv_words.open_end`, `website.cv_words.award_time`, `website.files.site`, `website.files.cv`, `website.files.papers`, `website.files.industry` and `links`. When another hub sets one of them, the primary's value stands and the key is a finding of that hub's file. Oculus reads the other 42 keys from each hub's own file, and a path among them resolves against the folder of that hub.

A value of `bookmarks`, `schedules` or `apps_dir` resolves in this order:

1. under the home folder, for `~` or a value starting with `~/`;
2. as written, when it is absolute;
3. against the primary hub's folder, otherwise.

## This machine's values

`.oculus/local.yml` holds the values of this machine. The primary hub's file gives every key. Oculus joins the four lists `clusters`, `accounts`, `calendars` and `mail` over every hub's file, marks each row with its hub, and puts the primary's rows of `clusters` first. When a hub other than the primary sets any other key, the primary's value stands and the key is a finding naming the hub.

| Key | What it holds | When unset |
|---|---|---|
| `port` | the port the server listens on, bound to 127.0.0.1 | 8790 |
| `self` | your own person, the key of a person of any hub's people | nobody is marked |
| `clusters` | your account on each cluster of `slurm.resource`: rows of `resource`, `user` and `key_file` | ssh's own configuration |
| `sessions_cache` | the session layer's byte-offset cache | `~/.oculus/transcript-cache.json` |
| `sessions_overrides` | the per-session overrides | `~/.oculus/sessions.json` |
| `changes` | the change log | `~/.oculus/changes.jsonl` |
| `history` | the local history, a copy of a file before each save and each delete | `~/.oculus/history` |
| `approvals` | the commands, launches, apps, interpreters and Svelte configurations you approved | `~/.oculus/approvals.json` |
| `lsp` | the language servers' state per served root | `~/.oculus/lsp` |
| `schedule_record` | the schedules' run record | `~/.oculus/schedule.json` |
| `claude_bin` | the Claude command line the chat terminals, agents and update tasks start | `claude` on PATH |
| `commit_message_account` | the Claude account the suggested commit message runs under, the label of a `claude` row of `accounts` | Claude's default folder |
| `open_bin` | the program an https address is handed to | the platform's opener |
| `rite_dap_bin` | the rite debug adapter the Debug view starts | `rite_dap` on PATH |
| `accounts` | the Claude and Codex folders the Usage view reads: rows of `tool`, `dir` and `label` | `~/.claude` and `~/.codex` |
| `calendars` | the calendar accounts: rows of `provider` (google, microsoft or ics) and `label` | no calendar |
| `calendar_dir` | the calendar credential files | `~/.oculus/calendar` |
| `mail` | the mail accounts: rows of `provider` (google or microsoft) and `label` | no mail |
| `mail_dir` | the mail credential files and the triage notes | `~/.oculus/mail` |
| `literature.mailto` | the contact address the Literature search's sources are sent | none |
| `downloads` | the secrets the reader rows of the hub's settings and the Zenodo deposit sign in with: rows of `service`, `user` and `secret` | none |

A path value of `local.yml` resolves under the home folder for `~` or a value starting with `~/`, and against the folder of the hub that holds the file for any other relative value.

## The workspace file

`.oculus/workspaces/<name>.yml` of a hub is one workspace.

```yaml
folders:                  # the folders it opens, in the order the Files view lists them
  - { name: research-hub, path: ~/workspace/research-hub, repository_scan_depth: 2 }
primary: research-hub     # the hub folder whose settings, records and state are the workspace's own
settings:                 # your values of oculus's options for this workspace
  code_theme: vscode-dark-2026
```

A folder's `path` is absolute or starts with `~`. Its `repository_scan_depth` is how many levels below it oculus searches for repositories, any whole number from -1: 0 searches the folder alone and -1 every level.

Without `primary:` the workspace has no primary hub. It then has no bookmarks file and no schedules, Settings refuses the eighty-four keys of the primary and writes a hub's other keys only once a hub is picked, and an update task and an app's new record are refused.

`settings:` holds each option of oculus's defaults files and catalogs, keyed as the merged config keys it, with no file names. In `settings:`, a key of the hub's settings, a key no option names and a value its option refuses are findings, and oculus's value stands for each. Besides the options, it takes these keys:

```yaml
agents:                   # the composer's agents (by name)
patterns:                 # the file nesting patterns (by pattern)
glyphs:                   # the glyphs' ASCII stand-ins (by name)
icons:                    # the icon map (by name)
latex_editing:            # the sections of the LaTeX tables (by name)
latex_unimath:            # the Unicode math rows (by command)
text:                     # words of the interface, by the dotted key of the text catalog
locale:                   # the display language: en, or the languageId an app contributes
```

Oculus lays the six catalogs, `agents` to `latex_unimath`, over its own entry by entry, in the same way as a hub's keys by word. `{ command: <command>, removed: true }` also takes an entry of `latex_unimath` out. `text` is laid over the display language and over oculus's English words, key by key.

## Bookmarks, schedules and tasks

`.oculus/bookmarks.yml` is a collection file whose schema oculus writes with the first bookmark: each entry is `{ label, root, path }`, the `label` its primary key, the `root` the key of a root the Files view serves and the `path` the file or folder inside it, left out for the root's top.

`.oculus/schedules.yml` is a list of entries, each `{ name, runs, when, paused, unattended }`. `runs` holds one of these:

- `{ task, hub }`: an update task of the named hub or of the primary;
- `{ command, folder }`: a command of a repository's `.oculus/commands.yml`;
- `{ prompt, folder }`: the first message of a Claude session started in the folder.

`when` is a cron expression, `paused: true` keeps the entry from running, and `unattended: true` starts the Claude session of a task or a prompt with `--dangerously-skip-permissions`.

`.oculus/tasks/<task>.md` may lie in any hub. The update tray offers the task of every hub that holds its file.

## Collection files

A registry is a data file whose entries other records name by key, such as the people or the venues file. A feed is a data file an update task writes: `leads`, the openings the scout finds, and `radar`, the papers Lit Watch finds.

Each data file is named by an entry of `collections:` in `.oculus/config.yml`, which holds these fields:

- `key` and `file`: the collection's key, and its file relative to the hub.
- `registry:` the registry or feed the file is: `datasets`, `venues`, `pillars`, `domains`, `funding`, `people`, `organisations`, `resources`, `literature`, `leads` or `radar`.
- the flags, each `true` or absent:
  - `band_positions` and `band_teaching` stack the file's entries in the Focus band's positions and teaching columns;
  - `awaiting` lists its entries in the Awaiting box;
  - `open_badge` draws its open count as a green badge;
  - `lead_applications` is where a lead's applied press writes;
  - `dissemination` lists its entries on a project card's Disseminated in, and `dissemination_skip` leaves entries out of that list;
  - `tasks` is the file Add Task and the task lines read.
- `ticker:` `{ category, undated }`: the word of `ticker_categories` the file's lines carry, which names the command center group of its dated lines, and `undated: true` when an undated entry is open work.
- `sort:` the fields of the file's schema its cards are sorted by, after the pinned cards.
- `group:`, `order:`, `label:`, `glyph:` and `about:`: where the file's view sits in the view catalogue and the dotted keys of its words.
- `primary_key:` the field an entry is found by, for a file with no `schema:` only.

The table gives oculus's own list of collections (`config/defaults/sources.yml`), with the primary key the template's schema flags. A hub keys its files as it likes, and oculus reads a registry or feed the hub's list leaves out from its own entry of it. A collection has a view while a hub lists it.

| Key | Registry | Default file | One entry is | Primary key | View |
|---|---|---|---|---|---|
| `data` | `datasets` | `.oculus/data/research/data.yml` | a dataset | `key` | Data |
| `venues` | `venues` | `.oculus/data/research/venues.yml` | a journal or conference | `id` | Venues |
| `pillars` | `pillars` | `.oculus/data/pillars/pillars.yml` | a research line | `key` | Pillars, Map |
| `domains` | `domains` | `.oculus/data/pillars/domains.yml` | an application domain | `key` | Domains |
| `statements` | none | `.oculus/data/research/statements.yml` | a reusable manuscript statement | `key` | Statements |
| `people` | `people` | `.oculus/data/people/people.yml` | a person | `key` | People, Person |
| `organisations` | `organisations` | `.oculus/data/people/organisations.yml` | a university, hospital, funder or company | `key` | Organisations |
| `resources` | `resources` | `.oculus/data/research/resources.yml` | a cluster, machine or storage | `key` | Resources, Live HPC |
| `funding` | `funding` | `.oculus/data/academic/funding.yml` | a grant application or programme | `key` | Funding |
| `events` | none | `.oculus/data/academic/events.yml` | a talk, visit or conference | `key` | Talks & Events |
| `education` | none | `.oculus/data/academic/education.yml` | a course, supervision or service role | `key` | Education & Service |
| `applications` | none | `.oculus/data/academic/applications.yml` | a position application | `key` | Applications |
| `tasks` | none | `.oculus/data/academic/tasks.yml` | a task | `key` | Tasks |
| `literature` | `literature` | `.oculus/data/literature/literature.yml` | a paper kept for reading and citing, keyed by its citation key | `key` | Literature |
| `leads` | `leads` | `.oculus/data/academic/leads.yml` | an opening the scout found | `title` | Position Leads |
| `radar` | `radar` | `.oculus/data/literature/radar.yml` | a paper the literature scout found | `title` | Lit Watch |

Each file lists its entries under `entries:` (the `data` file under `datasets:`) and opens with a `schema:` block that declares every field and flags its primary key with `primary_key: true`. The file's keys are the fields its schema declares. Oculus writes `snooze`, `subtasks` and `followup` into any entry, whatever its schema.

A duplicate or empty primary key is a finding. So is a file whose schema does one of these:

- flags no primary key, or two;
- flags a field whose value is a list or a map;
- cannot be read;
- flags a primary key beside a `primary_key:` of the file's `collections:` entry.

Oculus draws such a file and refuses every edit, Add and remove of its entries, with a sentence naming the cause.

A schema is a list of fields, each a map with `field` and `type`. Any other type is read as `text`.

| Type | Value |
|---|---|
| `text` | one line |
| `textarea` | several lines |
| `select` | one of `options`, or a key from `foreign_key` |
| `tags` | a list of strings |
| `date` | `YYYY-MM-DD` |
| `period` | a date or a span, EDTF: a year `2025`, a month `2025-09`, a day `YYYY-MM-DD`, a moment `YYYY-MM-DDTHH:MM:SS`, with an optional `Z`, `+HH:MM` or `-HH:MM`, a span `2025-09/2026-09`, an open span `2025/..` |
| `checkbox` | `true` or `false` |
| `metalist` | a list of `{ label, value }` |
| `raw` | a nested map |
| `records` | a list of maps with the fields `fields` lists; with `map: true`, a map from a name to one such map |

| Attribute | Meaning |
|---|---|
| `label` | the field's name on screen |
| `options` | the allowed values of a `select` or `tags` field, each a word or `{ key, label }` |
| `primary_key` | `true` on the one field an entry is found by and a reference stores, a field of one value |
| `display` | a whole number from 1: what a card heading and a reference to the entry show, the filled field of the lowest rank first |
| `foreign_key` | where the keys come from: a collection by its key in the hub's `collections:`, `projects`, `vocab.<list>`, `vocab.<map>.<field>` (the keys of a vocabulary map whose row carries the field as `true`, such as `vocab.statuses.acknowledged`), a list of these, or `{ field, sources }`, the target another field of the entry picks by its word |
| `required` | `true`, or `{ when: ... }` |
| `when` | the field is allowed only while these fields hold these values; the key `path` matches the file's path from the hub as a glob |
| `help` | the hover text in the editor |
| `section` | the group of the editor the field is drawn in, on a top-level row: a name of `manifest_schema.sections` in the order of that list, any other name after them, and a row with no section under Other, last. A card leaves out the rows of the section `Website`, and the entry's page draws them as one group after its fields |
| `open` | `true` on a `records` or `raw` field: the schema check passes keys the field does not declare |
| `fields` | the fields of each record of a `records` field |
| `map` | `true` on a `records` field that is a map from a name to a record |
| `filter` | `true` on a `select`, `tags`, `text` or `period` field draws a filter of it beside the search of the field's view |

The field flagged `primary_key: true` is the one a write finds the entry by, and its value is required. An empty value of any other field passes for every type.

Oculus reads these fields of the collection files by name:

- `venues`: a venue is shown by its `short`, else its `name`. Its `issn`, a list, is what Read from the browser asks the hub's journal browser by, and `fee` and `open_access` are the fields it writes. `deadline_month` and `held_month` are allowed only when `category: conference`.
- `domains`: `color`, written `#rrggbb`, colours the domain's project cards, and `expects_datasets: true` makes the Audit report an active project of the domain that names no dataset.
- `resources`: Live HPC polls a cluster of `slurm.resource` only when its entry has a `host`. The `host` is an ssh alias, a DNS name or an address. The user name comes from this machine's row of `clusters:` in `local.yml`.
- `events`: `link` is required when `role: present` and `status` is `upcoming` or `planned`.
- `funding`: `statement` is required when `status` is a word whose row of `statuses` carries `acknowledged`, `awarded` and `contributing` in oculus's vocabulary.
- `radar`: an `idea` entry carries `motif`, `maps_to` and `idea_spark`. The other buckets carry `project`, `relevance` and `why`, and a `preemption` entry also `threatens`.
- every file: Focus draws the dates of a file whose entry sets `ticker:`, under the group its `ticker:` names, and the follow-ups and subtasks of every file.

## The career file

The career file, at `career_file`, is one map: the goal, the next milestone with its day and the order of work, and the positions, degrees, awards, references and employer CV profiles the website's CV is written from. The Career view draws it.

## Project manifests

A record that owns a folder of work, such as a paper, a tool or a study, is a project. Its manifest is a `project.yml` at the folder's top or in its `.oculus/`, so the manifest moves, is archived and is deleted with its folder.

Oculus finds the manifests by walking the folders of `scan:`. The walk stops at a project and skips a dot folder, `node_modules` and a symbolic link. A project is named by its folder name, its `id`, or for a repository by the name of its workspace folder.

Any other record is an entry of a collection file. An entry whose work sits in a folder, such as an application's, names that folder in `link:`.

The keys of `project.yml` are the fields of `config/schemas/manifest-schema.yml` and the hub's `manifest_fields`. The editor marks any other key, and the key is a finding.

| Key | What it holds |
|---|---|
| `id` | the folder's name, read-only |
| `tier` | the kind of project, a word of `tiers` (required) |
| `stage` | where the project stands, a word of `stages` (required) |
| `form` | the form of the output, a word of `forms` |
| `short`, `title` | the short handle and the full title; a reference shows `short`, else `title` |
| `status.chips`, `status.line` | the chips on the card, words of `chips`, and one line read at a glance |
| `pin` | `true` keeps the card at the top of its board |
| `venue` | the venue aimed at or published in, a `venues` id |
| `links`, `tags`, `year` | web addresses or paths, search words, and the year |
| `eli5`, `next`, `latest`, `results`, `ideas` | the plain summary, the next action, the latest change, one result per line and one avenue per line |
| `domain`, `pillars`, `funding`, `datasets`, `compute` | the domain, research lines, grants, datasets and resources the project names |
| `lead`, `collaborators`, `supervisors` | people keys; a project naming no lead is a finding |
| `waiting-on`, `related` | people or projects it waits on, and the projects it builds on or feeds |
| `deadline`, `snooze` | the next deadline, and the day before which the project stays off the ticker |
| `followup`, `subtasks` | the follow-up notes and the checklist, written from the project's card |
| `code_availability.*` | the code deposit: `status`, `date`, `url`, `doi`, `repo`, `description`, `homepage`, `topics`, `visibility`, `anonymize`, `review_link`, `zenodo_status`, `zenodo_date` |
| `repository.*` | the repository on its remote: `url`, `visibility`, `description`, `homepage`, `topics`, `date` |
| `reproduced.date`, `reproduced.note` | the last run of the whole pipeline from the raw data |
| `outcome`, `doi` | how the project ended, and the published paper's DOI |
| `paths` | where a document is kept away from its usual place, and `cluster`, the project's folder on the cluster |
| `publication.*` | the website's publications entry, every key of the record whose value is not null held as the file gives it; the rows of `website.paper_fields` say which are written |
| `cv.*` | the CV's projects row: `title`, `url`, `when`, `about`, `role`, `hide`, `cv_hide`, `rank`; any other key is held as written |

A `followup:` note is `{ do, after, done, lead, supervisors, collaborators }`: its `after` hides it until that date, and `done: true` keeps it on its card, struck through, and takes it off the Focus board. The three people fields of a note each hold a person key or a list of keys, which Mine only and the Role list read in place of the project's own people. A `subtasks:` line takes the same three fields.

A project's Focus lane follows from its stage and chips: it sits on the lane of `focus_lanes` whose `stages` holds its `stage`, or on Blocked or Backburner when its `status.chips` carry `blocked` or `parked`.

## Keys and links

A foreign key is a field whose schema line has `foreign_key:`. Its value must be a primary key of the collection it names, or a word of the vocabulary list it names (`config/catalogs/vocab.yml` of oculus, under the hub's values).

The editor offers those entries, each shown by its display: the filled field of the lowest `display:` rank of the target's schema, else its primary key. A field with `options` takes only the keys of its options. A `text` field is only completed from its list.

A `foreign_key:` that is empty, names nothing, or names a collection with no primary key is a finding, and the field's list is empty. A value that matches nothing is a finding, and the editor marks it.

In the editor:

- Cmd+click on a foreign key opens the entry;
- Find All References lists every place that names it;
- F2 renames a registry entry's key everywhere it is named.

Below, each file is named by its collection key, and `[ ]` marks a list.

```yaml
project.yml:
  venue: venues id
  domain: domains key
  pillars: [pillars key]
  funding: [funding key]
  datasets: [data key]
  compute: [resources key]
  lead: [people key]
  collaborators: [people key]
  supervisors: [people key]
  waiting-on: [people key, or a project]
  related: [a project]
  tier: vocab tiers
  stage: vocab stages
  form: vocab forms
  status.chips: [vocab chips]
people:
  affiliations: [organisations key]
funding:
  funder: organisations key
funding, events, education, applications, tasks:
  lead, collaborators, supervisors: [people key]
events, education, applications:
  related: [a project]
venues:
  category: vocab venue_categories
  tier: vocab venue_tiers
  themes: [an option of the themes field]
pillars:
  kind: vocab pillar_kinds
data:
  access: vocab data_access
  themes: [an option of the themes field]
literature:
  projects: [a project]
radar:
  bucket: vocab radar_buckets
  project: a project
  maps_to: a project, or new-idea-candidate
deck present.yml:
  groups.<name>.slides: [a project]
config.yml:
  slurm.resource: [resources key of an entry with kind cluster and a host]
```

A link between a project and another record is written on one side only. A project names what it belongs to: its venue, domain, pillars, funding, datasets, compute and people. A record that is about projects names them:

- an event, a teaching entry or an application in its `related:`;
- a literature entry in its `projects:`;
- a Lit Watch paper in its `project:`.

The view of either side finds the other by reading the side that names it.

The vocabulary keeps each word in one list:

| Field | List |
|---|---|
| a project's `stage:` | `stages` |
| a project's `form:` | `forms` |
| each of a project's `status.chips` | `chips` |
| a project's `tier:` | `tiers` |
| a collection entry's `status` | `statuses` |
| a Position Lead's `status` | `lead_statuses` |

A project's category on the boards is the first row of `categories` whose `stages` and `forms` blocks hold it.

A status that is no word of its list is a finding. The finding names the closest word of the list when that word is within half the written word's length in single-letter changes, rounded down. A stage word or a form written as a chip is a finding naming the field it belongs in.

For each key `slurm.resource` lists, Live HPC checks that it names a `resources` entry with `kind: cluster` and a `host`, and says in the section of that key's cluster which condition fails.

The Audit checks a field that names a path, and reports a missing path for the `link` of the `funding`, `events`, `education` and `applications` files.

## Several hubs

Every folder of the workspace that holds `.oculus/config.yml` is a hub, and oculus reads the records of all of them into one portfolio. The settings and this machine's values of several hubs combine as [The hub's settings](#the-hubs-settings) and [This machine's values](#this-machines-values) say. The rest combines as follows:

- Your files: the bookmarks, the schedules, the machine's apps and their `app_settings` are the primary's. `self` names a person of any hub, resolved in the primary first.
- A reference: every record has the id `<hub name>:<key>`, and the files hold keys. A reference names the record of its key in its own hub's file, else the record of the one other hub that holds the key. A key that two other hubs hold and its own hub does not names no record, and the Audit reports it. Each key `slurm.resource` lists resolves in the primary first, then in the one other hub that holds it.
- A write: a change to a record goes to its own hub's file. A new project goes to any hub of the workspace, and a new entry to a hub that holds its collection. When more than one hub could take it, the form asks which, the primary first.

## Repositories below a hub

In a hub's git `info/exclude`, oculus keeps one block between `# BEGIN nested-repos` and `# END nested-repos`, listing the repositories below the hub so the hub's git ignores them, and writes that block alone, with no control.
