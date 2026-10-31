# Data map

A hub's data files, the view that shows each, the keys that link them, and the fields that hold only under a condition. Every file below can be copied from the templates (`docs/templates.md`), with each key and a comment.

## Contents

[TOC]

---

## Files in `.oculus`

| File | What it is |
|---|---|
| `.oculus/config.yml` | the hub's settings, among them `bookmarks`, `schedules` and `apps_dir`, where the bookmarks file, the schedules file and the machine's apps folder are; a folder holding it is a hub |
| `.oculus/local.yml` | this machine's values (port, cluster user names and key files, programs, accounts); out of git |
| `.oculus/bookmarks.yml` | the bookmarked folders and files of the Files view |
| `.oculus/workspaces/<name>.yml` | one workspace: its folders, its primary hub and `settings:`, the workspace's own values of oculus's options |
| `.oculus/schedules.yml` | the scheduled tasks of the update tray |
| `.oculus/tasks/<task>.md` | the steps of one update task (`litwatch`, `scout`, `inbox`, `linkedin`), which the tray hands to a Claude session |
| `.oculus/data/<kind>/<file>.yml` | the data file of one collection, at oculus's default path, in the folder of its kind (`research`, `pillars`, `literature`, `people`, `academic`) |
| `.oculus/apps/<name>/app.yml` | one app |
| `.oculus/notes/` | the notes, one Markdown file each, and `order.json`, their order in the Notes list; written by oculus |
| `.oculus/memories/`, `.oculus/wallpaper/` | the photo wall's and the backdrop's pictures |

A repository of the workspace may hold its own `.oculus/` with `project.yml`, `settings.yml`, `commands.yml`, `launch.yml`, `cpp.yml` and `app-data/<name>.json` (the store of an app, written by oculus). `~/.oculus/` is oculus's machine state and is never edited by hand.

Make Folder a Hub..., in the Files view's menu of a folder, writes `.oculus/config.yml`, the hub files you tick (`local.yml` with its `.gitignore`, `schedules.yml`) and the data files of the collections you tick; Make Folder a Project writes `.oculus/project.yml`; Make Folder a Git Repository runs `git init`; Add Repository Configuration... writes the ticked ones of a repository's missing `settings.yml`, `commands.yml`, `launch.yml` and `cpp.yml`.

## Data files

A record that owns a folder of work, such as a paper, a tool or a study, is a project: its manifest is a `project.yml` at the folder's top or in its `.oculus/`, found by `scan:`, so it moves, is archived and is deleted with its folder. Any other record is an entry of one of the files below, since it has no folder of its own and a list keeps the entries' order and keys in one file; an entry whose work does sit in a folder, such as an application's, names that folder in `link:`.

Each data file is named by its entry in `collections:` of `.oculus/config.yml`, a key and a file relative to the hub, and the entry's fields say what the file is: `registry:` the registry or feed it is, the flags of the features that read it, `ticker:` the category of its lines, which names the command center group of its dated lines (the lines of the file flagged `tasks` are lines of the Tasks section, dated or not), `group:`, `order:`, `label:`, `glyph:` and `about:` where its view sits and the words it is drawn with, and `primary_key:` the field an entry is found by, for a file with no `schema:` only. A hub keys its files as it likes. The table gives oculus's own list (`config/defaults/sources.yml`): the key and default file the templates and Make Folder a Hub use, and the registry each entry names. Each file lists its entries under `entries:` (the `data` file under `datasets:`) and opens with a `schema:` block that declares every field and flags its primary key with `primary_key: true`. A collection the hub does not list has no view: its tab is left out of its page, and the pane says which key is missing.

| Key | Registry | Default file | One entry is | Primary key | View |
|---|---|---|---|---|---|
| `venues` | `venues` | `.oculus/data/research/venues.yml` | a journal or conference | `id` | Venues |
| `data` | `datasets` | `.oculus/data/research/data.yml` | a dataset | `key` | Data |
| `pillars` | `pillars` | `.oculus/data/pillars/pillars.yml` | a research line | `key` | Pillars, Map |
| `domains` | `domains` | `.oculus/data/pillars/domains.yml` | an application domain | `key` | Domains |
| `people` | `people` | `.oculus/data/people/people.yml` | a person | `key` | People, Person |
| `organisations` | `organisations` | `.oculus/data/people/organisations.yml` | a university, hospital, funder or company | `key` | Organisations |
| `resources` | `resources` | `.oculus/data/research/resources.yml` | a cluster, machine or storage | `key` | Resources, Live HPC |
| `statements` | none | `.oculus/data/research/statements.yml` | a reusable manuscript statement | `key` | Statements |
| `funding` | `funding` | `.oculus/data/academic/funding.yml` | a grant application or programme | `key` | Funding |
| `events` | none | `.oculus/data/academic/events.yml` | a talk, visit or conference | `key` | Talks & Events |
| `education` | none | `.oculus/data/academic/education.yml` | a course, supervision or service role | `key` | Education & Service |
| `applications` | none | `.oculus/data/academic/applications.yml` | a position application | `key` | Applications |
| `tasks` | none | `.oculus/data/academic/tasks.yml` | a task | `key` | Tasks |
| `literature` | `literature` | `.oculus/data/literature/literature.yml` | a paper kept for reading and citing | `key`, its citation key | Literature |
| `leads` | `leads` | `.oculus/data/academic/leads.yml` | an opening the scout found | `title` | Position Leads |
| `radar` | `radar` | `.oculus/data/literature/radar.yml` | a paper the literature scout found | `title` | Lit Watch |

Two files are named by keys of their own rather than by `collections:`: the career file, one map of the strategy and the career record the website's CV is written from, drawn by the Career view, at `career_file` (`.oculus/data/academic/career.yml` by default), and a project's `project.yml`, whose primary key is its folder name and which the Projects, Coauthor, Archive, Personal and Project views draw.

A duplicate or empty primary key is a finding, and so is a file whose schema flags no primary key or two or flags a field whose value is a list or a map, whose schema does not read, whose `collections:` entry names one beside its schema's flag, or that has neither a schema nor a named key; such a file is drawn, and every edit, Add and remove of its entries is refused with a sentence naming the cause. A venue is shown by its `short`, else its `name`, and linked to by its `id`, its primary key. A venue's `issn`, a list, is what Read from the browser asks the hub's journal browser by, and `fee` and `open_access` are the fields it writes. The entries whose `registry:` is `leads` and `radar` name the two feed files. The domains registry gives each domain the colour of its project cards (`color`, written `#rrggbb`) and their label (`title`), and `expects_datasets: true` makes the Audit report an active project of the domain that names no dataset. Focus also draws the dates of every file whose entry sets `ticker:`, under the deadline group its `ticker:` names, the follow-ups and subtasks of every file of `collections:`, and the open leads, and every entry has a page and an editor built from its schema.

## Views that draw these files

| View | Page | Draws |
|---|---|---|
| Focus | Focus | projects by `stage` and the chips `parked` and `blocked`, the dated lines, follow-ups and subtasks of every file, the live leads |
| Live HPC | the float at the right edge | the clusters `slurm.resource` names, one section each |
| Projects, Supervision, Coauthor, Archive, Personal, Software | Projects | the projects whose `tier`, `stage` and your role (the field of `roles` that names you: `lead`, `supervisors`, `collaborators`) the board's keys in `boards` take |
| Project, Editor | opened from a card | one project, and the form of any record |
| Position Leads | Incoming | the `leads` feed |
| Literature search, Lit Watch, Literature | Literature | the search over the sources of `literature.sources`, the `radar` feed, and the `literature` file |
| LinkedIn | Incoming | the folder `linkedin_dir` names |
| Funding, Talks & Events, Education & Service, Applications, Tasks, Memories, Career | Academic Life | their files, the photo wall's pictures, and the career file |
| Pillars, Domains, Map | Pillars | the pillars and domains, and the projects that name them |
| Venues, Journal Browser, Data, Statements, People, Organisations, Resources | Registries | their files, and the journal browser of `venues.browser` |
| Person | opened from a person's name | one person, with their projects |
| Entry | opened from a card's title | one entry and what refers to it |
| Listing | opened from the title of the Archival, Orphans or No funding card | one set of projects |
| Post | opened from the title of a LinkedIn card | one post, with its body |
| Present | Present | a deck folder |
| Audit | System | the rules over projects and files, the conventions the hub's `audit:` sets (the files and headings a project must hold, the folders a stage is kept under), and the website's three generated files against what the hub's files give |
| Findings | System | every finding, with its file and line |

## The hub's settings

`.oculus/config.yml` may set these 68 keys and no others; any other key is a finding and is not applied. A key of `vocab.yml` is laid over oculus's value by its shape: a map word by word, a word the hub names replacing oculus's in oculus's place, a new word coming after oculus's and `<word>: null` taking one out; `categories` row by row by `key`, `{ key: <key>, removed: true }` taking a row out; `focus_clusters`, `focus_lanes`, `fund_stages`, `position_stages`, `teaching_stages`, `roles`, `venue_categories`, `pillar_kinds`, `venue_tiers` and `radar_buckets` whole; and `rail_color` by the hub's value in place of oculus's. A list replaced whole other than `focus_clusters` with a row of the wrong kind, or with two rows naming one `key` (one `label` in a list of stages), is a finding naming the hub's file and the row's place, and oculus's list stands; `focus_clusters` is read row by row, a row of the wrong kind or naming the key of an earlier row being a finding and not read. A word the hub's values no longer give, taken out with `<word>: null` or left out of a list the hub replaces whole such as `roles`, is also taken out of every word list that names it, each option and each field of an option's rows that the options of `config/options/` describe with a `from` naming that list (a category's stage words, a Focus lane's stages and chips and the words of its `move_writes`, a funding, position or teaching stage's statuses, a count's `match`, a board's `tier` and `role`, `research_audit`'s `skip_tiers`): in oculus's own values a row left with no word stays and a single word of a field that takes a list becomes an empty list, and in a list or a row the hub writes itself each such word is a finding naming the hub's file at the word's place there, and the word is not read. `manifest_fields` adds its rows to the form of the hub's own projects. Any other key set here replaces oculus's value whole. The hub's records are drawn in its own words. The defaults and a comment on each are in the `config.yml` template.

```yaml
scan:                     # the folders projects are found in
portfolio_deck:           # the hub's own deck
collections:              # the data files and the two feeds, each a key, a file and the fields of what it is
chat_context:             # the collections whose files a chat's index holds for the hub
new_project_dir:          # the folder a new project is made in, per tier
linkedin_dir:             # a website's LinkedIn folder
career_file:              # the career file the Career view draws and the website's CV is written from
memories_dir:             # the photo wall's pictures
wallpaper_dir:            # the backdrop's pictures
bookmarks:                # where the reader's own bookmarks are kept
schedules:                # where the schedules are kept
apps_dir:                 # where the machine's apps are kept
wallpaper.image:          # the backdrop shown
docs:                     # the hub's documents, each a tab of a page
counts:                   # the counts the tabs draw
palette:                  # the hex each palette token stands for (by word)
stages:                   # the stages of projects, with their labels and flags (by word)
forms:                    # the forms of a project's output (by word)
chips:                    # the chips of projects, with their labels and glyphs (by word)
statuses:                 # the statuses of collection entries, with their colours and roles (by word)
lead_statuses:            # the statuses of Position Leads, with their roles (by word)
focus_clusters:           # the clusters the Focus lanes are grouped in, in drawing order (whole)
focus_lanes:              # the Focus lanes, in order, with what a move onto each writes (whole)
fund_stages:              # the stages stacked in the Focus Funding column, in order (whole)
position_stages:          # the stages stacked in the Focus Job applications column, in order (whole)
teaching_stages:          # the stages stacked in the Focus Teaching & supervision column, in order (whole)
focus_lane_tones:         # the colour of each collection lane bar of Focus (by word)
ticker_categories:        # the command center's deadline groups, with their words (by word)
facet_tones:              # the colour of each filter group of a project board's bar (by word)
tiers:                    # the kinds of project a manifest's tier names (by word)
research_audit:           # the tiers the audit's research rules skip (by word)
roles:                    # the roles a person holds on a project, in order (whole)
categories:               # the categories a project is filed under, each with its colour (by key)
rail_color:               # the colour of a project board's rail count (the hub's value)
leads_fit:                # the fit colours of the Position Leads (by word)
data_access:              # the colour of a dataset's access chip (by word)
venue_categories:         # the categories of venues, rows { key, label, ribbon? }, in order (whole)
pillar_kinds:             # the kinds of pillar lines, rows { key, label, color }, in order (whole)
venue_tiers:              # the tiers of venues, in order (whole)
radar_buckets:            # the buckets of Lit Watch, in order (whole)
manifest_fields:          # the fields the hub adds to the form of its own projects (by row)
slurm.resource:           # the clusters Live HPC polls, in order
clusters.key_type:        # the type of the key Account setup makes for a cluster (oculus's ed25519)
clusters.key_file:        # the path of that key, {type} and {resource} put in (oculus's ~/.ssh/id_{type}_{resource})
connections.failures:     # the rows that tell a failed ssh or git connection apart (kind, for, match, fix; by kind)
sign_in:                  # the providers a reader signs in with: google, microsoft and git hosts (by key)
recover.node_download:    # the folder of Node.js's releases Recover's cluster side downloads from (oculus's nodejs.org)
lint.writing_skip:        # the files the writing rules skip
lint.writing_glyphs:      # the files the writing rules let draw arrows and glyphs
audit.required_files:     # the files the Audit asks a project to hold
audit.required_sections:  # the headings a project's file must hold while a manifest key has a value
audit.stage_folders:      # the folders a project at a stage is kept under
website.folder:           # the website's folder, which Write the website writes its three data files into
website.cv:               # the command run in that folder after a write
website.kinds:            # the sections of the website's publications, by stage and form
website.files.site:       # the website's own file, relative to its folder
website.files.cv:         # the CV's file, relative to the website's folder
website.files.papers:     # the publications' file, relative to the website's folder
website.files.industry:   # the employer CVs' file, relative to the website's folder
app_settings:             # the values of the settings apps declare
literature.sources:       # the reader rows of the Literature search's sources (the primary hub's, by key)
literature.prefer:        # the source a merged paper takes its fields, abstract and PDF from first (the primary hub's)
recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind (by key)
venues.browser:           # the reader row of the hub's journal browser
links:                    # the addresses page links are built from (the primary hub's, by key)
```

## The workspace's settings

`settings:` of a workspace file, `.oculus/workspaces/<name>.yml`, holds the workspace's own values, each key as the merged config holds it, with no file names. A key of the hub's settings above is a finding there and is not applied.

```yaml
<option>:                 # any option of config/defaults/, as config/options/ describes it
agents:                   # the composer's agents (by name)
patterns:                 # the file nesting patterns (by pattern)
glyphs:                   # the glyphs' ASCII stand-ins (by name)
icons:                    # the icon map (by name)
latex_editing:            # the sections of the LaTeX tables (by name)
latex_unimath:            # the Unicode math rows (by command)
text:                     # words of the interface, by the dotted key of the text catalog
locale:                   # the display language: en, or the languageId an app contributes
```

A catalog is laid over oculus's in oculus's place: an entry the workspace names replaces oculus's where it stands, a new entry comes after oculus's, and `<name>: null` or `{ command: <command>, removed: true }` takes one out. `text` is laid over the display language and over oculus's English words, key by key.

## Keys and links

A foreign key is a field whose schema line has `foreign_key:`, naming a collection by its key in the hub's own `collections:`, `projects`, or a vocabulary list. Its value must be a primary key of the collection it names, or a word of the vocabulary list it names (`config/catalogs/vocab.yml` of oculus), and the editor offers those entries, each shown by its display (the filled field of the lowest `display:` rank of the target's schema, else its primary key). A `foreign_key:` that is empty, names nothing, or names a collection with no primary key is a finding, and the field offers nothing. A field with `options` takes only the keys of its options: the theme words of venues and datasets are the options of the `themes` field of the `venues` and `data` files. A value that matches nothing is a finding, and is marked in the editor; `maps_to` is only completed from its list. In the editor, Cmd+click on a foreign key opens the entry, Find All References lists every place that names it, and F2 renames a registry entry's key everywhere it is named.

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
  tier: vocab tiers
  waiting-on: [people key, or a project]
  related: [a project]
  stage: vocab stages
  form: vocab forms
  status.chips: [vocab chips]
  code_availability.anonymize: rows of { term, as }, the words For review replaces
  code_availability.zenodo_status: none, review-anon or deposited; zenodo_date and review_link are the Zenodo deposit's, doi the deposit's on any service
people:
  affiliations: [organisations key]
funding:
  funder: organisations key
  award: the funder's award number, sent with the title to Zenodo
events, education, applications:
  related: [a project]
funding, events, education, applications, tasks:
  lead, collaborators, supervisors: [people key]
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
  source: search, lit-watch or hand
radar:
  bucket: vocab radar_buckets
  project: a project
  maps_to: a project, or new-idea-candidate
deck present.yml:
  groups.<name>.slides: [a project]
```

A link between a project and another record is written on one side only. A project names what it belongs to: its venue, domain, pillars, funding, datasets, compute and people. A record that is about projects names them: an event, a teaching entry or an application in its `related:`, a literature entry in its `projects:`, a Lit Watch paper in its `project:`. The view of either side finds the other by reading the side that names it.

The vocabulary keeps each word in one list: a project's `stage:` is a word of `stages`, its `form:` a word of `forms` and each of its `status.chips` a word of `chips`; a collection entry's `status` is a word of `statuses` and a Position Lead's a word of `lead_statuses`; a project's `tier:` is a word of `tiers`, and its category on the boards is the first row of `categories` whose `stages` and `forms` blocks hold it. A status that is no word of its list is a finding naming the closest word of the list when that word is within half the written word's length in single-letter changes, rounded down, and a stage word or a form written as a chip is a finding naming the field it belongs in.

One key of `config.yml` names primary keys and is not checked by the Findings view: each key `slurm.resource` lists is a `resources` key of an entry with `kind: cluster` and a `host`, resolved in the primary hub first, then in the one other hub that holds it; Live HPC says, in that cluster's section, which condition fails.

A project is named by its folder name. Fields that name a path are not keys: an Audit row reports a missing path for the `link` of the `funding`, `events`, `education` and `applications` files.

## Fields that hold only under a condition

- `venues`: `deadline_month` and `held_month` only when `category: conference`.
- `events`: `link` is required when `role: present`.
- `funding`: `statement` is required when `status` is `awarded` or `contributing`.
- `people`: the key `self` of the primary hub's `.oculus/local.yml` names the key of one entry of any hub, the user's own, read from the primary hub first; a key no hub's entry carries, or one two hubs other than the primary carry, is a finding on that file.
- `resources`: `host` is needed for `slurm.resource` to poll the cluster; it is an ssh alias, a DNS name or an address, with no user name, which is this machine's row of `clusters:` in `local.yml`.
- `radar`: an `idea` entry carries `motif`, `maps_to` and `idea_spark`; the other buckets carry `project`, `relevance` and `why`, and a `preemption` entry also `threatens`.
- `project.yml`: `followup:` is a list of notes, each `{ do, after, done, lead, supervisors, collaborators }`; a note's `after` hides it until that date, and `done: true` keeps it on its card, struck through, and off the Focus board. The three people fields each hold a person key or a list of keys, which Mine only and the Role list read in place of the project's own people, and a `subtasks:` line takes the same three fields. The Focus lane is no key: a project sits on the lane of `focus_lanes` whose `stages` holds its `stage`, or on Blocked or Backburner when its `status.chips` carry `blocked` or `parked`, and the Idea lane holds `nascent` projects of any tier. A project at a stage carrying `terminal` sits on no chip lane.

In a schema, `when:` allows a field only while the condition holds, and `required: { when: ... }` requires it only then.

## Schema fields

A schema is a list of fields. Each is a map with `field` and `type`, and may carry the attributes below.

| Type | Value |
|---|---|
| `text` | one line |
| `textarea` | several lines |
| `select` | one of `options`, or a key from `foreign_key` |
| `tags` | a list of strings |
| `date` | `YYYY-MM-DD` |
| `checkbox` | `true` or `false` |
| `metalist` | a list of `{ label, value }` |
| `raw` | a nested map |
| `records` | a list of maps with the fields `fields` lists; with `map: true`, a map from a name to one such map |

| Attribute | Meaning |
|---|---|
| `label` | the field's name on screen |
| `options` | the allowed values of a `select` or `tags` field, each a word or `{ key, label }` |
| `primary_key` | `true` on the one field an entry of the file is found by and a reference stores; never on a list or map field |
| `display` | a whole number from 1: what a card heading and a reference to the entry show, the filled field of the lowest rank first |
| `foreign_key` | where the keys come from: a collection by its key in the hub's `collections:` (`venues`, `data`, `pillars`, `domains`, `funding`, `people`, `organisations`, `resources`, `events`, ...), `projects`, `vocab.<list>`, `vocab.<map>.<field>` (the keys of a vocabulary map whose row carries the field as `true`, such as `vocab.statuses.acknowledged`), or a list of these |
| `required` | `true`, or `{ when: ... }` |
| `when` | the field is allowed only while these fields hold these values |
| `help` | the hover text in the editor |
| `section` | the group of the editor the field is drawn in, on a top-level row: a name of `manifest_schema.sections` in the order of that list, any other name after them, and a row with no section under Other, last. It also decides what a card draws: a card leaves out the rows of the section `Website`, and the entry's page draws them as one group after its fields |
| `open` | `true` allows undeclared keys in a `records` or `raw` field |
| `fields` | the fields of each record of a `records` field |
| `map` | `true` on a `records` field that is a map from a name to a record |
| `filter` | `true` on a `select`, `tags` or `text` field draws a filter of it beside the search of the field's view |

The field flagged `primary_key: true` is the one a write finds the entry by, and its value is required. An empty value of any other field passes for every type. `snooze`, `subtasks` and `followup` are written by oculus into any entry and need no line in a schema.

`project.yml`, `present.yml`, `settings.yml`, `commands.yml`, `launch.yml`, `cpp.yml` and `app.yml` have no `schema:` block of their own; their fields are in their templates.

## A second hub

A folder of the workspace that holds `.oculus/config.yml` is a hub of its own, and oculus merges it into the one portfolio.

- Its `config.yml` paths are read from its own folder. Its `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`, `recover.node_download`, `lint.writing_skip`, `lint.writing_glyphs`, `app_settings`, `literature.sources`, `literature.prefer`, `website.folder`, `website.cv`, `website.kinds`, `website.files.site`, `website.files.cv`, `website.files.papers`, `website.files.industry` and `links` are not read: those keys are read from the primary hub's file alone, and each of them that it sets is a finding naming the hub. Its `audit:` holds its own projects to the conventions it names.
- Every record of every hub, the primary's included, has the id `<hub name>:<key>`. The files hold keys: a reference names the record of its key in its own hub, and else the record of the one other hub that holds the key; a key two other hubs hold and its own hub does not names no record, and the Audit reports it.
- A change to a record goes to its own hub's file. A new record goes to a hub that could take it: a new project to any hub of the workspace, and a new entry (Add, Add Task, an application from a lead, Save to Literature) to a hub that holds its collection, named in its `collections:` or, for Literature, at the engine's path. When more than one hub could take it, the path asks which, the primary first in the list; when one could, the record goes there, primary or not.
- A collection's view is shown when any hub of the workspace lists its key.

## The primary hub

The workspace file's `primary:` names one of its hubs. Its records are kept and resolved like any other hub's; what is specific to it is what belongs to the person and the machine rather than to one body of work, which oculus reads from the primary alone:

- This machine's values: only the primary's `.oculus/local.yml` is read (the port, who you are (`self`), the programs, the calendar, mail and download accounts, the Literature search's contact address), its account rows and its `clusters:` rows (this machine's user name and key file on each cluster) joined over every hub's file, the primary's row of a cluster used before another hub's; Account setup and Settings write a `clusters:` row into the primary's file alone.
- Who you are: the "this is me" button is drawn on the primary's people.
- The person's own files: `.oculus/bookmarks.yml`, `.oculus/schedules.yml`, the update tasks under `.oculus/tasks/`, the machine apps under `.oculus/apps/` (or the folder its `apps_dir` names) and their values under `app_settings` of its `config.yml`.
- Twenty-seven keys of a hub's `config.yml` are read from the primary's alone: `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `app_settings`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`, `recover.node_download`, `lint.writing_skip`, `lint.writing_glyphs`, `literature.sources`, `literature.prefer`, `website.folder`, `website.cv`, `website.kinds`, `website.files.site`, `website.files.cv`, `website.files.papers`, `website.files.industry` and `links`. Each of them that another hub sets is a finding of that hub's file naming the hub, and the key is not applied.
- Settings writes those twenty-seven keys to the primary's `config.yml`; any other key of a hub's `config.yml` it writes to the hub the row names, the primary first and chosen.
- Each key `slurm.resource` lists resolves in the primary first, then in the one other hub that holds the key.
- Where a new record goes: when more than one hub could take it, the path lists the primary first and selected; New Note on the Notes head writes into the primary; an app writes records to the primary alone.
- Word order: a list drawn over the records of several hubs holds the primary's words first, and the records of a folder that is no hub are the primary's.

In a workspace with no primary hub, Settings refuses the twenty-seven keys and writes a hub's other keys only once a hub is picked, an update task and an app's new record are refused, and no schedule runs.

## Repositories below a hub

In a hub's git exclude file, oculus keeps one block between `# BEGIN nested-repos` and `# END nested-repos`, listing the repositories below the hub so the hub's git ignores them.
