# Data map

A hub's data files, the view that shows each, the keys that link them, and the fields that hold only under a condition. Every file below can be copied from the templates (`docs/templates.md`), with each key and a comment.

## Contents

[TOC]

---

## Files in `.oculus`

| File | What it is |
|---|---|
| `.oculus/config.yml` | the hub's settings, among them `bookmarks`, `schedules` and `apps_dir`, where the bookmarks file, the schedules file and the machine's apps folder are; a folder holding it is a hub |
| `.oculus/local.yml` | this machine's values (port, cluster alias, programs, accounts); out of git |
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

Each data file is named by its entry in `collections:` of `.oculus/config.yml`, a key and a file relative to the hub; the file below is the default path the templates and Make Folder a Hub use. Each file lists its entries under `entries:` (the `data` file under `datasets:`) and opens with a `schema:` block that declares every field. A collection the hub does not list has no view: its tab is left out of its page, and the pane says which key is missing.

| Key | Default file | One entry is | Primary key | View |
|---|---|---|---|---|
| `venues` | `.oculus/data/research/venues.yml` | a journal or conference | `id` | Venues |
| `data` | `.oculus/data/research/data.yml` | a dataset | `key` | Data |
| `pillars` | `.oculus/data/pillars/pillars.yml` | a research line | `key` | Pillars, Map |
| `domains` | `.oculus/data/pillars/domains.yml` | an application domain | `key` | Domains |
| `people` | `.oculus/data/people/people.yml` | a person | `key` | People, Person |
| `organisations` | `.oculus/data/people/organisations.yml` | a university, hospital, funder or company | `key` | Organisations |
| `resources` | `.oculus/data/research/resources.yml` | a cluster, machine or storage | `key` | Resources, Live HPC |
| `statements` | `.oculus/data/research/statements.yml` | a reusable manuscript statement | `key` | Statements |
| `funding` | `.oculus/data/academic/funding.yml` | a grant application or programme | `key` | Funding |
| `events` | `.oculus/data/academic/events.yml` | a talk, visit or conference | `key` | Talks & Events |
| `joint-work` | `.oculus/data/academic/joint-work.yml` | a piece of work with one person | `key` | Joint work, Person |
| `education` | `.oculus/data/academic/education.yml` | a course, supervision or service role | `key` | Education & Service |
| `applications` | `.oculus/data/academic/applications.yml` | a position application | `key` | Applications |
| `tasks` | `.oculus/data/academic/tasks.yml` | a task | `key` | Tasks |
| `literature` | `.oculus/data/literature/literature.yml` | a paper kept for reading and citing | `key`, its citation key | Literature |
| `leads` | `.oculus/data/academic/leads.yml` | an opening the scout found | `title` | Position Leads |
| `radar` | `.oculus/data/literature/radar.yml` | a paper the literature scout found | `title` | Lit Watch |

Two files are named by keys of their own rather than by `collections:`: the career strategy, one map with no entries drawn by Focus, at `career_file` (`.oculus/data/academic/career.yml` by default), and a project's `project.yml`, whose primary key is its folder name and which the Projects, Coauthor, Archive, Personal and Project views draw.

A duplicate or empty primary key is a finding. A venue is written by its `name` and linked to by its `id`. The `leads` and `radar` keys name the two feed files. The `domains` file gives each domain the colour of its project cards (`color`, written `#rrggbb`) and their label (`title`), and `expects_datasets: true` makes the Audit report an active project of the domain that names no dataset. Focus also draws the dates, follow-ups and subtasks of every file of `collections:` and the open leads, and every entry has a page with an editor built from its schema.

## Views that draw these files

| View | Page | Draws |
|---|---|---|
| Focus | Focus | projects by `focus`, the dated lines, follow-ups and subtasks of every file, the live leads, the career panel |
| Live HPC | the float at the right edge | the cluster `slurm.resource` names |
| Projects, Coauthor, Archive, Personal | Projects | the projects of that `tier` |
| Project, Editor | opened from a card | one project, and its form |
| Position Leads | Incoming | the `leads` feed |
| Literature search, Lit Watch, Literature | Literature | the search over the literature sources, the `radar` feed, and the `literature` file |
| LinkedIn | Incoming | the folder `linkedin_dir` names |
| Funding, Talks & Events, Education & Service, Applications, Joint work, Tasks, Memories | Academic Life | their files, and the photo wall's pictures |
| Pillars, Domains, Map | Pillars | the pillars and domains, and the projects that name them |
| Venues, Data, Statements, People, Organisations, Resources | Registries | their files |
| Person | opened from a person's name | one person, with their organisations, joint work and projects |
| Entry | opened from a card's title | one entry, its editor and what refers to it |
| Present | Present | a deck folder |
| Audit | System | the rules over projects and files, and the website's publication list against the projects |
| Findings | System | every finding, with its file and line |

## The hub's settings

`.oculus/config.yml` may set these 25 keys and no others; any other key is a finding and is not applied. A key set here replaces oculus's value whole. The defaults and a comment on each are in the `config.yml` template.

```yaml
scan:                 # the folders projects are found in
portfolio_deck:       # the hub's own deck
collections:          # the data files and the two feeds (leads, radar), one { key, file } each
chat_context:         # the collections whose files a chat's index holds for the hub
new_project_dir:      # the folder a new project is made in, per tier
publications_file:    # a website's publication list, for the Audit
linkedin_dir:         # a website's LinkedIn folder
career_file:          # the career strategy
memories_dir:         # the photo wall's pictures
wallpaper_dir:        # the backdrop's pictures
bookmarks:            # where the reader's own bookmarks are kept
schedules:            # where the schedules are kept
apps_dir:             # where the machine's apps are kept
wallpaper.image:      # the backdrop shown
docs:                 # the hub's documents, each a tab of a page
counts:               # the counts the tabs draw
statuses:             # the status words, with their colours and roles
career_host_status:   # the career card's host statuses
career_score_dims:    # the career card's score axes
career_score_tones:   # the career card's score hues
leads_fit:            # the fit colours of the Position Leads
slurm.resource:       # the cluster Live HPC polls
lint.writing_skip:    # the files the writing rules skip
lint.writing_glyphs:  # the files the writing rules let draw arrows and glyphs
app_settings:         # the values of the settings apps declare
```

## Keys and links

A foreign key is a field whose schema line has `from:`. Its value must be a primary key of the collection it names, or a word of the vocabulary list it names (`config/catalogs/vocab.yml` of oculus). A field with `options` takes only the keys of its options: the theme words of venues and datasets are the options of the `themes` field of the `venues` and `data` files. A value that matches nothing is a finding, and is marked in the editor; `maps_to` is only completed from its list. In the editor, Cmd+click on a foreign key opens the entry, Find All References lists every place that names it, and F2 renames a registry entry's key everywhere it is named.

Below, each file is named by its collection key, and `[ ]` marks a list.

```yaml
project.yml:
  venue_id: venues id
  domain: domains key
  pillar: [pillars key]
  funding: [funding key]
  datasets: [data key]
  compute: [resources key]
  collaborators: [people key]
  waiting-on: [people key, or a project]
  related: [a project]
  type: vocab types
  status.chips: [vocab statuses, the words with a label]
  focus: vocab focus_lanes, or holding
  priority: vocab priority_levels
people:
  affiliations: [organisations key]
funding:
  funder: organisations key
joint-work:
  person: people key
events, education, applications:
  related: [a project]
venues:
  category: vocab venue_categories
  tier: vocab venue_tiers
  themes: [an option of the themes field]
data:
  access: vocab data_access
  themes: [an option of the themes field]
career_file:
  hosts.status: vocab career_host_status
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

One key of `config.yml` names a primary key and is not checked by the Findings view: `slurm.resource` is a `resources` key of an entry with `kind: cluster` and a `host`; Live HPC says which condition fails.

A project is named by its folder name. Fields that name a path are not keys: an Audit row reports a missing path for the `link` of the `funding`, `events`, `education` and `applications` files.

## Fields that hold only under a condition

- `venues`: `deadline_month` and `held_month` only when `category: conference`.
- `events`: `link` is required when `role: present`.
- `funding`: `statement` is required when `status` is `awarded` or `contributing`.
- `people`: the workspace setting `self` names the key of one entry, the user's own; a key no entry carries is a finding.
- `resources`: `host` is needed for `slurm.resource` to poll the cluster.
- `radar`: an `idea` entry carries `motif`, `maps_to` and `idea_spark`; the other buckets carry `project`, `relevance` and `why`, and a `preemption` entry also `threatens`.
- `project.yml`: `followup:` is a list of notes, each `{ do, after }`, and a note's `after` hides it until that date; `holding` as `focus` only on the tiers `projects` and `personal`.

In a schema, `when:` allows a field only while the condition holds, and `required: { when: ... }` requires it only then.

## Schema fields

A schema is a list of fields. Each is a map with `field` and `type`, and may carry the attributes below.

| Type | Value |
|---|---|
| `text` | one line |
| `textarea` | several lines |
| `select` | one of `options`, or a key from `from` |
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
| `from` | where the keys come from: a registry (`venues`, `datasets`, `pillars`, `domains`, `funding`, `people`, `organisations`, `resources`), `projects`, `vocab.<list>`, `vocab.<map>.<field>` (the keys of a vocabulary map whose row carries the field as `true`, such as `vocab.statuses.chip`), or a list of these |
| `required` | `true`, or `{ when: ... }` |
| `when` | the field is allowed only while these fields hold these values |
| `help` | the hover text in the editor |
| `open` | `true` allows undeclared keys in a `records` or `raw` field |
| `fields` | the fields of each record of a `records` field |
| `map` | `true` on a `records` field that is a map from a name to a record |
| `filter` | `true` on a `select`, `tags` or `text` field draws a filter of it beside the search of the field's view |

The first field of the schema is the one a write finds the entry by. An empty value passes for every type. `snooze`, `subtasks` and `followup` are written by oculus into any entry and need no line in a schema.

`project.yml`, `present.yml`, `settings.yml`, `commands.yml`, `launch.yml`, `cpp.yml` and `app.yml` have no `schema:` block of their own; their fields are in their templates.

## A second hub

A folder of the workspace that holds `.oculus/config.yml` is a hub of its own, and oculus merges it into the one portfolio.

- Its `config.yml` paths are read from its own folder. Its `career_file`, `publications_file`, `linkedin_dir` and `portfolio_deck` are not read.
- Its records have the id `<hub name>:<id>`, and a reference never crosses hubs.
- A change to a record goes to its own hub's file. A new project goes to the primary hub, and so does a new entry, unless more than one hub lists its collection, when Add asks which hub's file takes it. Save to Literature writes to the Literature file of the primary hub when the primary holds one, named in its `collections:` or at the engine's path, and else to the first hub that holds one.
- A collection's view is shown when any hub of the workspace lists its key.

## Repositories below a hub

In a hub's git exclude file, oculus keeps one block between `# BEGIN nested-repos` and `# END nested-repos`, listing the repositories below the hub so the hub's git ignores them.
