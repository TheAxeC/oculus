# Templates

Every YAML file oculus reads, and the Markdown file of each update task, as a file you can copy. Copy a block into the file named above it, then uncomment the keys you want to set. A commented key shows its default; leaving it commented keeps that default.

## Contents

[TOC]

---

## Where each file goes

| File | Place | Who writes it |
|---|---|---|
| `config.yml` | `<hub>/.oculus/config.yml` | Make Folder a Hub..., or you; a folder holding it is a hub |
| `local.yml` | `<hub>/.oculus/local.yml` | Make Folder a Hub..., or you; this machine only, keep it out of git |
| `.gitignore` | `<hub>/.oculus/.gitignore` | Make Folder a Hub..., with `local.yml`, or you |
| `bookmarks.yml` | `<hub>/.oculus/bookmarks.yml` | the Files view's star, or you |
| `workspaces/<name>.yml` | `<hub>/.oculus/workspaces/` | Save Workspace As, or you |
| `schedules.yml` | `<hub>/.oculus/schedules.yml` | Make Folder a Hub..., the update tray, or you |
| `tasks/<task>.md` | `<hub>/.oculus/tasks/` | you |
| `project.yml` | `<project>/project.yml` or `<repository>/.oculus/project.yml` | Make Folder a Project, or you |
| `settings.yml` | `<repository>/.oculus/settings.yml` | Add Repository Configuration..., or you |
| `commands.yml` | `<repository>/.oculus/commands.yml` | Add Repository Configuration..., Add Command..., or you |
| `launch.yml` | `<repository>/.oculus/launch.yml` | Add Repository Configuration..., Add Configuration, or you |
| `cpp.yml` | `<repository>/.oculus/cpp.yml` | Add Repository Configuration..., or you |
| `app.yml` | `<apps folder>/<name>/app.yml` | you |
| the hub's data files | the paths `collections:` names | oculus's views, or you |
| `present.yml` | a deck folder | you |

Oculus writes these itself, so they have no template:

- `<hub>/.oculus/memories/` and `<hub>/.oculus/wallpaper/`: picture folders.
- `<hub>/.oculus/notes/`: your notes as Markdown files, and `order.json`, the order the Notes list shows them in.
- `<repository>/.oculus/app-data/<name>.json`: the store of a root app.

## config.yml

The hub's own settings. A key of oculus's `config/catalogs/vocab.yml` set here is laid over oculus's value by its shape: a map word by word, `categories` row by row by `key`, and a list whose order is its meaning whole. `manifest_fields` adds fields to the form of this hub's projects. Any other key set here replaces oculus's value for this hub. A key not shown here is a finding.

```yaml
# Where projects are found: folders relative to the hub. A project is a folder holding project.yml
# or .oculus/project.yml, at any depth below a dir. `optional: true` means a missing folder is fine.
# scan:
#   - { dir: projects/ideas }
#   - { dir: side-projects, optional: true }
#   - { dir: projects/active }
#   - { dir: projects/manuscripts }
#   - { dir: projects/software, optional: true }
#   - { dir: projects/coauthor }
#   - { dir: projects/archive }

# The folder a new project is made in, per tier (research, personal, software).
# Each folder is a scan folder or lies under one.
# new_project_dir: {}
#   example: { research: projects/ideas, personal: side-projects }

# The folder of the hub's own deck, opened by the Present view when no deck is named.
# portfolio_deck: deck

# The hub's data files, one entry per key. The keys data, venues, pillars, domains, funding,
# people, organisations and resources are the registries, leads and radar the Position Leads and
# Lit Watch feeds, and every other key is a card list. The domains registry holds each domain's
# colour and label and which domains expect a dataset; the venues and data registries hold their
# theme words as the options of their `themes` field. A key the list leaves out has no view, and
# Make Folder a Hub writes the ticked keys with these paths.
# collections:
#   - { key: data,           file: ".oculus/data/research/data.yml" }
#   - { key: venues,         file: ".oculus/data/research/venues.yml" }
#   - { key: pillars,        file: ".oculus/data/pillars/pillars.yml" }
#   - { key: domains,        file: ".oculus/data/pillars/domains.yml" }
#   - { key: statements,     file: ".oculus/data/research/statements.yml" }
#   - { key: people,         file: ".oculus/data/people/people.yml" }
#   - { key: organisations,  file: ".oculus/data/people/organisations.yml" }
#   - { key: resources,      file: ".oculus/data/research/resources.yml" }
#   - { key: funding,        file: ".oculus/data/academic/funding.yml" }
#   - { key: events,         file: ".oculus/data/academic/events.yml" }
#   - { key: education,      file: ".oculus/data/academic/education.yml" }
#   - { key: applications,   file: ".oculus/data/academic/applications.yml" }
#   - { key: joint-work,     file: ".oculus/data/academic/joint-work.yml" }
#   - { key: tasks,          file: ".oculus/data/academic/tasks.yml" }
#   - { key: literature,     file: ".oculus/data/literature/literature.yml" }
#   - { key: leads,          file: ".oculus/data/academic/leads.yml" }
#   - { key: radar,          file: ".oculus/data/literature/radar.yml" }

# The keys of the collections list whose files a chat's index holds for this hub, in this order.
# chat_context: [funding, events, education, applications, joint-work, tasks]

# A website's LinkedIn posts folder, read by the LinkedIn view. None by default.
# linkedin_dir: path/to/_linkedin

# The career file, drawn by Focus's Career banner.
# career_file: .oculus/data/academic/career.yml

# The photo wall's folder, inside the hub.
# memories_dir: .oculus/memories

# The wallpaper images' folder, inside the hub.
# wallpaper_dir: .oculus/wallpaper

# Where oculus keeps the bookmarks, the schedules and the apps. A path that starts with `~` is
# under your home folder; any other relative path is read from the primary hub's folder. Read from
# the primary hub.
# bookmarks: .oculus/bookmarks.yml
# schedules: .oculus/schedules.yml
# apps_dir: .oculus/apps

# The wallpaper: `<hub name>/<file path>` (the path inside that hub's wallpaper folder), `random`, or empty for none. Read from the primary hub.
# wallpaper:
#   image: ""

# The hub's own documents, each a tab of the page its group names.
# docs: []
#   example:
#   - { label: "Lab handbook", path: docs/handbook.md, group: help }

# The cluster Live HPC polls: the key of a `kind: cluster` entry of the resources registry.
# Empty is no cluster.
# slurm:
#   resource: ""

# The writing rules: the globs of the files they leave alone, and of the files that draw arrows
# as icons, matched against the path from the file's root. Both empty by default.
# lint:
#   writing_skip: []
#   writing_glyphs: []
#   example:
#   writing_skip: ['**/vendor/**', '**/manuscript/**/*.tex']

# The conventions the Audit view holds this hub's projects to, each off until it is set. A project
# of a tier `research_audit.skip_tiers` names is held to none of them.
# `required_files`: a file a project must hold, a row requiring its file when each key it names
# is met: the project's stage meets `stages` (a word block of the stages: `words`, `not_words`,
# `flags`, `not_flags`), the project holds the folder `folder`, and it lies under one of the hub
# folders `folders` (a project of a workspace repository lies under none).
# `required_sections`: a heading a file of a project must hold while the dotted manifest key `key`
# has a value; a line holds it when it is the heading or starts with it and a space.
# `stage_folders`: the hub folders a project at the stages `stages` is kept under, matched by whole
# path segments; a project of a workspace repository is held to none.
# `website`: the website's publications feed, its entries under the key `list` of each section and
# an entry's title under `title`, and the sections `kinds` a project is expected in, the first row
# whose `stages` hold the project's stage and whose `forms` hold its form giving them.
# audit:
#   required_files: []
#   required_sections: []
#   stage_folders: []
#   website:
#     file: ''
#     list: ''
#     title: ''
#     kinds: []
#   example:
#   audit:
#     required_files:
#       - { file: README.md, stages: { not_flags: [terminal] } }
#       - { file: code/README.md, folder: code }
#     required_sections:
#       - { file: README.md, heading: "## Data", key: datasets }
#     stage_folders:
#       - { stages: { words: [published] }, folders: [projects/archive/published] }
#     website:
#       file: site/_data/publications.yml
#       list: papers
#       title: title
#       kinds:
#         - { kind: [thesis], forms: [thesis] }
#         - { kind: [papers-in-review], stages: [submitted, revision] }
#         - { kind: [journal, other-publications], forms: [journal] }
#         - { kind: [journal, conference, thesis, other-publications] }

# The values of the settings apps declare, by the setting's whole key. The Settings view writes it.
# app_settings: {}

# The counts the view tabs draw and the rail sums, by view id, in the form of `counts` in oculus's
# config/defaults/layout.yml. Set here, it replaces oculus's whole map for this hub.
# counts: {}

# This hub's words, each in the form of the key of the same name in oculus's
# config/catalogs/vocab.yml, and this hub's records are drawn in them. A map is laid over oculus's
# word by word: a word named here replaces oculus's in oculus's place, a new word comes after
# oculus's, and `<word>: null` takes oculus's word out. Only the words that differ are written.
# A word taken out, or left out of a list replaced whole here such as `roles`, also leaves every
# list that names it (a category's stages, a Focus lane's stages and chips, a funding stage's
# statuses, a count's match, a board's tier and role, whose one word leaves an empty list); in a
# list written here, each such word is a finding at its place in this file, and it is not read.

# The hex each palette token stands for.
# palette: {}
#   example:
#   palette: { "#0f766e": c-teal }

# The stages of this hub's projects, each with its label, its glyph, its colour and the flags that
# say what it does.
# stages: {}
#   example:
#   stages:
#     exploring: { label: Experimenting, icon: orange, color: "#f59e0b", live: true, on_map: true }
#     trialling: { label: trialling, icon: blue, color: "#2563eb", live: true, on_map: true }
#     stopped: null

# The forms of this hub's projects' output, each with its label and its glyph.
# forms: {}
#   example:
#   forms:
#     dataset: { label: "dataset release", icon: page }

# The chips of this hub's projects, each with its label, its glyph and the flags that say what it
# does.
# chips: {}
#   example:
#   chips:
#     on-hold: { label: on hold, icon: black, blocked: true }

# The statuses of this hub's collection entries, each with its colour and the flags that say what
# it does.
# statuses: {}
#   example:
#   statuses:
#     on-hold: { color: "#9ca3af", waiting: true }

# The statuses of this hub's Position Leads, each with the flags that say what it does and a
# colour.
# lead_statuses: {}
#   example:
#   lead_statuses:
#     shortlisted: { color: "#2563eb" }

# The colour of a Position Lead's fit chip, by its fit.
# leads_fit: {}
#   example:
#   leads_fit: { strong: "#16a34a", moderate: "#b45309", reach: "#9ca3af" }

# The colour of each collection lane bar of Focus, by the lane, as a palette tone.
# focus_lane_tones: {}
#   example:
#   focus_lane_tones: { funding: teal }

# The kinds of project a manifest's `tier` names, each with its label.
# tiers: {}
#   example:
#   tiers:
#     teaching: { label: Teaching }

# The tiers the audit's research rules leave alone, and whose projects the Orphans card leaves out.
# research_audit: {}
#   example:
#   research_audit: { skip_tiers: [personal, software] }

# The colour of a dataset's access chip, by its access.
# data_access: {}
#   example:
#   data_access: { embargoed: "#7c3aed" }

# The categories this hub's projects are filed under, each a row with its `key`. A row named here
# replaces oculus's row of that key in oculus's place, a new row comes after oculus's, and
# `{ key: <key>, removed: true }` takes oculus's row out.
# categories: []
#   example:
#   categories:
#     - { key: idea, label: "early ideas", stages: { words: [nascent, scoping] } }
#     - { key: released, removed: true }

# The lists below are replaced whole, since their order is their meaning: set here, the list is
# this hub's in full.

# The Focus lanes, in the order they are drawn, each with the stages or chips it takes.
# focus_lanes: []
#   example:
#   focus_lanes:
#     - { key: run, label: Run, sub: "getting the numbers", color: "#16a34a", cluster: now, stages: [exploring] }
#     - { key: idea, label: Idea, sub: "ideas not started yet", color: "#b5638a", cluster: idea, stages: [nascent] }

# The stages stacked inside the Focus Funding column, each with the statuses it matches.
# fund_stages: []
#   example:
#   fund_stages:
#     - { label: "Submitted", color: "#16a34a", statuses: [submitted, under-review] }

# The roles a person holds on a project, in the order the project form offers them, each with the
# manifest field that lists its people.
# roles: []
#   example:
#   roles:
#     - { key: lead, label: Lead, field: lead }
#     - { key: student, label: Student, field: collaborators }

# The categories a venue's category takes, in the order the Venues view offers them.
# venue_categories: []
#   example:
#   venue_categories: [journal, conference, workshop]

# The tiers a venue's tier takes, best first, each with its colour and label.
# venue_tiers: []
#   example:
#   venue_tiers:
#     - { key: core, color: "#7c3aed", label: core }
#     - { key: unrated, color: "#94a3b8", label: unrated, assignable: false }

# The buckets of Lit Watch, in the order they are drawn, each with its glyph, label and colour.
# radar_buckets: []
#   example:
#   radar_buckets:
#     - { key: cite_baseline, glyph: green, label: "Cite / baseline", color: "#16a34a" }

# The fields this hub adds to the form of its own projects. A row is a field of the form with
# `field:`, the key of project.yml it adds, beside its `label`, `type`, `section`, `help` and, where
# its widget takes them, `from`, `options` and `required`. The field is drawn after oculus's fields
# of its section, in this order, and is a known key of this hub's manifests only. A row with no
# field, naming a field the form already has or an earlier row names, a section the form lacks or a
# type the form does not draw is a finding, and the row is left out.
# manifest_fields: []
#   example:
#   manifest_fields:
#     - { field: grant_id, label: Grant, type: text, section: Core, help: "The grant number." }
```

## local.yml

This machine's own values. Keep the file out of git. Oculus reads the keys from the primary hub's file only, except `accounts`, `calendars` and `mail`, whose rows are read from every hub. A path that starts with `~` is under your home folder; any other relative path is read from the hub's folder.

```yaml
# The port the server listens on. Read when the server starts.
# port: 8790

# This machine's ssh alias for the cluster. Takes precedence over the cluster entry's host.
# hpc_host: ""

# The programs oculus starts.
# claude_bin: claude
# commit_message_account: personal
# The program an https address is handed to: /usr/bin/open on macOS, xdg-open on Linux, wslview
# under WSL2.
# open_bin: /usr/bin/open
# rite_dap_bin: rite_dap

# The agent account folders the Usage view reads. Without rows, ~/.claude and ~/.codex.
# accounts:
#   - { tool: claude, dir: ~/.claude, label: personal }
#   - { tool: codex, dir: ~/.codex, label: personal }

# Calendar accounts, added by the Calendar view. provider: google, microsoft or ics.
# calendars:
#   - { provider: google, label: work }
# calendar_dir: ~/.oculus/calendar

# Mail accounts, added by the Inbox view. provider: google or microsoft.
# mail:
#   - { provider: google, label: work }
# mail_dir: ~/.oculus/mail

# Keys for the Literature search. A source without its key is off, or limited.
# literature:
#   wos_key: ""
#   scopus_key: ""
#   scopus_insttoken: ""
#   openalex_key: ""
#   semantic_scholar_key: ""
#   ncbi_key: ""
#   mailto: you@example.org

# Download accounts for the Data view's Recover. One row per service.
# downloads:
#   - { service: physionet, user: <user name>, secret: <password> }
#   - { service: kaggle, user: <user name>, secret: <key> }
#   - { service: kaggle-token, secret: <token> }
#   - { service: synapse, secret: <token> }

# Where oculus keeps this machine's files.
# changes: ~/.oculus/changes.jsonl
# history: ~/.oculus/history
# approvals: ~/.oculus/approvals.json
# lsp: ~/.oculus/lsp
# schedule_record: ~/.oculus/schedule.json
# sessions_cache: ~/.oculus/transcript-cache.json
# sessions_overrides: ~/.oculus/sessions.json
```

## .gitignore

Keeps `local.yml` out of git. Make Folder a Hub... writes it beside `local.yml`.

```gitignore
# local.yml holds this machine's own values and its secrets: keys, tokens and passwords.
local.yml
```

## bookmarks.yml

The star in the Files view writes this file. An entry with a `root` and no `path` is the root's top.

```yaml
title: Bookmarks

schema:
  - field: label
    type: text
    label: Label
    required: true
    help: The name the bookmark is listed and found by.
  - field: root
    type: select
    label: Root
    help: The key of the root the file browser serves that the file or folder lies under.
  - field: path
    type: text
    label: Path
    help: The file or folder inside the root; left out, the bookmark is the root's top.

entries:
#  - { label: Manual, root: my-repo, path: docs/manual.md }
#  - { label: My repo, root: my-repo }
```

## workspaces/<name>.yml

One workspace: the folders oculus opens. The file name is the workspace's name.

```yaml
# Each folder: a name (letters, digits, `.`, `_`, `-`) and a path (`~/...` or absolute).
# `repository_scan_depth` (0 up, or -1 for no limit) overrides the global depth for that folder.
folders:
  - { name: my-hub, path: ~/research/my-hub }
#  - { name: my-tool, path: ~/code/my-tool, repository_scan_depth: 2 }

# The hub whose .oculus/local.yml and own files this machine uses.
primary: my-hub

# The workspace's own values of oculus's options, keyed as oculus's config/defaults/ files key
# them, with no file names. The Settings view writes them. A key of a hub's config.yml (the
# wallpaper image, the scan folders and the other hub settings) is set there and not here.
# A scalar or a list without a key field replaces oculus's value whole. A keyed list (rail by
# `page`, floats by `view`, themes, latex.recipes and latex.tools by `name`,
# code_themes.vscode by `class`, code_themes.shiki by `id`, focus.ticker_sources by
# `collection`) overrides oculus's entry with the same key, and
# `removed: true` takes oculus's entry out. A map (counts, boards, nav_groups and the others)
# overrides by its keys, and a key set to null takes oculus's key out.
# The six catalogs, `agents`, `patterns` (file nesting), `glyphs`, `icons`, `latex_editing` and
# `latex_unimath`, are laid over oculus's in oculus's place: an entry named here replaces oculus's
# where it stands, a new entry comes after oculus's, `<name>: null` takes one out, and a Unicode
# math row is matched by its `command`, `{ command: <command>, removed: true }` taking it out.
# `locale` is the display language: `en`, or the languageId of a display language an approved,
# enabled app contributes. `text` replaces words of the interface by the dotted key of oculus's
# text catalog, over the display language and over oculus's English words.
# `self` is the key of your own entry in the primary hub's people file, which the Person page's
# "this is me" button and the portfolio chat read.
# settings:
#   self: me
#   code_theme: vscode-dark-2026
#   terminal: { font_px: 14 }
#   rail:
#     - { page: focus, label: Focus board }
#     - { page: literature, removed: true }
#   counts:
#     hpc: null
#   glyphs:
#     red: R
#   latex_unimath:
#     - { command: mbfalpha, detail: "U+1D736", documentation: "bold alpha" }
#   locale: en
#   text:
#     views.settings: Preferences
```

## schedules.yml

A list of schedules. Each runs one thing: an update task, a command of a repository's `commands.yml`, or a prompt.

```yaml
# - name: Weekly radar
#   runs: { task: litwatch }        # litwatch, scout, linkedin or inbox
#   when: "0 7 * * 1"               # cron; without `when` it runs only from Run now
#   paused: true
#   unattended: true                # runs without asking for permissions
#
# - name: Nightly build
#   runs: { command: build, folder: ~/code/my-tool }
#   when: "0 2 * * *"
#
# - name: Morning summary
#   runs: { prompt: "Summarise yesterday's commits.", folder: ~/research/my-hub }
#   when: "0 8 * * 1-5"
```

## Update tasks

An update task is a Markdown file of the hub, `.oculus/tasks/<task>.md`, for `litwatch`, `scout`, `inbox` and `linkedin`. The Update tray and a schedule start a Claude Code session in the hub's folder and ask it to follow the file step by step, so the file is the whole instruction for one run. The tray offers only the tasks whose file the hub holds. Each template has the same sections: what the task does, the steps, the guardrails and the finish line. Replace every `<...>` with your own words; the rest can stay as it is.

### .oculus/tasks/litwatch.md

Lit Watch adds new papers to the radar file, which the Lit Watch view draws.

```markdown
# Lit Watch: the literature radar

This file is the whole instruction for one run of the Lit Watch update task. The radar is the file the `radar` key of `.oculus/config.yml` names (`.oculus/data/literature/radar.yml` by default); oculus's Lit Watch view draws it.

## What it does

- Defensive: for each project in <the project folders to watch, for example projects/active/*>, find new papers and put each in one bucket: `preemption` (it could take the project's novelty claim), `cite_baseline` or `adjacent`.
- Ideas: for each motif below, find papers that could start a new idea, in the bucket `idea`, each with its `motif` and its `maps_to` (a project id, or `new-idea-candidate`).

## Motifs

1. <a method or topic to watch>
2. <another>

## Steps

1. Read the radar file: collect every `url` already there and `meta.last_run`.
2. List the projects to watch, and the motifs above.
3. For each project and each motif, search for papers since `meta.last_run` (on the first run, <the years to cover>). For a project, read its `project.yml` and `README.md` first to find its claim and its search terms. One subagent per project or motif may search in parallel.
4. Drop every hit whose `url` is already in the file. Add the new ones under `entries:` with `found:` set to today, in the fields of the file's `schema:`, and set `meta.last_run` to today. Keep every earlier entry as it is.

## Guardrails

- Real papers only, each with a working address. Never make one up.
- The radar is a watch: it changes no project file and no manuscript.
- Write every value in plain ASCII.
- <what the radar file must never be: committed, shared, ...>

## Finish

End with the number of new entries in each bucket and the files changed.
```

### .oculus/tasks/scout.md

Scout adds open positions to the leads file, which the Position Leads view draws.

```markdown
# Scout: open positions

This file is the whole instruction for one run of the Scout update task, and it is the search spec: edit it to tune what the scout looks for. The leads are the file the `leads` key of `.oculus/config.yml` names (`.oculus/data/academic/leads.yml` by default); oculus's Position Leads view draws it.

## Profile

<who the positions are for: the field, the degree, the years of experience, the languages>

## What to look for

- Include: <the kinds of position and the topics that are in scope>
- Exclude: <the kinds of position and the topics that are not>
- Where: <the countries or cities>

## Fit

- strong: <squarely in profile>
- moderate: <adjacent>
- reach: <one point of overlap>

## Sources

- <a job board or a search address>
- <another>

## Steps

1. Read the leads file and collect every logged `url`, and every title with its institution.
2. Search the sources above for positions open today or later.
3. For each position in scope that the file does not hold, rate its fit with a one-line reason.
4. Add each new position at the top of `entries:`, in the fields of the file's `schema:`, with `status: open`. Keep the `schema:` block as it is.
5. Add one line at the top of `meta.log` that starts with today's date and holds the word `scout`, then the sources checked and the count of new leads. Oculus reads the scout's last run from the newest such line, so a run that finds nothing still writes its line.

## Guardrails

- Only real positions that are open today, each with its address. Never make one up.
- Change only the leads file, and never a lead whose `status` is no longer `open`.
- Write every value in plain ASCII.

## Finish

End with the new leads (title, institution, deadline, fit) and the `meta.log` line written.
```

### .oculus/tasks/inbox.md

Inbox writes a note for each thread on your plate into the triage file, which the Inbox view draws.

```markdown
# Inbox: email triage

This file is the whole instruction for one run of the Inbox update task. It needs a mail connector of the Claude session (<the connector's name>); without it, say so and stop. The notes go to `<mail_dir>/triage.json`, where `mail_dir` is the key of `.oculus/local.yml` (`~/.oculus/mail` by default). Oculus reads the mailboxes itself; this task writes only what each thread wants.

## Steps

1. Collect the threads on the plate: <the searches that find them, for example the unread threads in the inbox>. If none is found, write an empty set of notes and stop.
2. Read each thread and give it a `kind`: `reply` (it waits for an answer, and the note holds a draft), `action` (it asks for something to be done, which `what` states) or `info`.
3. Read `triage.json` when it exists, keep every note of a thread not read this run, and write the file as `{ "run": "<today>", "notes": { "<account key>-<thread id>": { "kind": "reply", "what": "...", "draft": "...", "written": "<ISO 8601 time>" } } }`. The account key is the `<provider>-<label>` of the mailbox's `mail:` row of `local.yml`.

## Guardrails

- Never send a message and never make a draft in the mailbox; a draft lives in the note only.
- Never set `triaged`: the Inbox view sets it.
- An empty plate gives an empty set of notes; never pick other mail to fill it.
- <the language and the tone of a draft>

## Finish

End with the number of threads on the plate and the count of each `kind` written.
```

### .oculus/tasks/linkedin.md

LinkedIn says whether a post is due and drafts one into the posts folder, which the LinkedIn view draws.

```markdown
# LinkedIn: post nudge and draft

This file is the whole instruction for one run of the LinkedIn update task. The posts are the folder `linkedin_dir` of `.oculus/config.yml` names: `NN-<slug>.md` is a post made, with `title`, `date`, `category` and `publish` in its front matter, and `xx-<slug>.md` an idea. This task drafts; it never posts.

## Steps

1. Count the days since the `date:` of the newest posted file, against `linkedin_cadence_days` of `focus:` in oculus's `behavior.yml` (30 by default), and say whether a post is due.
2. Pick a topic: the most timely `xx-` idea, or a real milestone of a project (read its `project.yml` and `README.md`).
3. Draft the post in <the voice and the length to write in>, and show it for review.
4. On request, save the draft as `xx-<slug>.md` with `publish: False`.
5. When the post is made, rename the file to the next `NN-<slug>.md` and set `date:` to the day it was posted and `publish: True`.

## Guardrails

- Never post: there is no LinkedIn connector.
- Claim only what is true; the folder may be public.
- <what a post must never hold>

## Finish

End with the days since the last post against the target, and the path of any file written or renamed.
```

## project.yml

One project. `tier` and `stage` are required, and a project naming no `lead` is an Audit finding. Every other key is optional.

```yaml
# --- Core
tier: research          # research, personal or software: the kind of project, which with your
                        # role and the stage puts it on its boards
stage: nascent          # nascent, scoping, de-risking, exploring, in-prep, building, submit-ready,
                        # submitted, revision, published, released, failed or stopped; the stage
                        # puts the project on its Focus lane
# form: journal         # journal, conference, thesis, abstract, poster or tech-report
# short: my-project     # short name for cards and lists
# title: ""
# status:
#   chips: []           # from the chips list, such as blocked, parked, numbers-to-run, results-in;
                        # blocked and parked put the card on the Blocked and Backburner lanes
#   line: ""            # one short line
# pin: true             # keep the card at the top of its board
# venue: ""             # a venue's id from the venues registry
# links: []
# tags: []
# year: 2026

# --- Content
# eli5: ""              # two plain sentences
# next: ""              # the next action
# latest: ""            # what changed last
# results: []           # one claimable result per line
# ideas: []             # one avenue per line

# --- Connections (keys of other files)
# domain: ""            # domains registry
# pillars: []           # pillars registry
# funding: []           # funding registry
# lead: []             # people registry: who leads the project, several for co-first authors
# collaborators: []     # people registry
# supervisors: []       # people registry: who supervises the work, listed last among the authors
# waiting-on: []        # people or projects
# related: []           # other projects
# datasets: []          # data registry

# --- Dates
# deadline: YYYY-MM-DD
# followup: []          # written by the card: { do, after }, hidden until after
# snooze: YYYY-MM-DD    # off the ticker until this date
# subtasks: {}          # written by the card

# --- Deposit and compute
# code_availability:
#   status: none        # none, review-anon or deposited
#   date: YYYY-MM-DD
#   url: ""
#   doi: ""
#   repo: ""            # public repository name, lowercase words joined by dashes
#   description: ""
#   homepage: ""
#   topics: []
#   visibility: public  # public or private
# repository:
#   url: ""             # the remote; Clone fetches it
#   visibility: private # public or private
#   description: ""
#   homepage: ""
#   topics: []
#   date: YYYY-MM-DD
# compute: []           # resources registry
# reproduced:
#   date: YYYY-MM-DD
#   note: ""

# --- Outcome
# outcome: ""           # a citation, or why it stopped
# doi: ""

# --- Rare
# paths: {}             # where a document is when it is not in its usual place
```

`id` is the folder's name and is never written. `subtasks` and `snooze` are written by the card.

## settings.yml

Editor settings for the files of one repository, per language. Any other top-level key is not read.

```yaml
languages:
#  python:   { tab_size: 4, insert_spaces: true, word_wrap: "off", rulers: [100], format_on_save: true }
#  markdown: { word_wrap: "on" }
```

## commands.yml

Named commands of one repository, run from the Repositories view, a project card or Run Command. Add Command... on the repository's command bar adds an entry at the end of the list, and makes the file from this template when the repository has none; Edit and Delete on an entry with a `run` change only that entry and keep its other keys and your comments.

```yaml
commands:
#  - name: build
#    run: npm run build
#    cwd: app                  # a folder inside the repository
#    default: build            # build or test; one of each
#  - name: test
#    run: npm test
#    depends_on: [build]       # runs these first
#    default: test
#    problemMatcher: $tsc      # a matcher an app declares
```

## launch.yml

Debug configurations of one repository.

```yaml
configurations:
#  - name: Debug the open file
#    program: ${file}
#  - name: Benchmark
#    program: utils/benchmark/fib.rite
#    cwd: utils
#    before: build             # a command of commands.yml, run first
#    type: rite                # or the type of an app's debugger
#    request: launch           # launch or attach
```

## cpp.yml

Compile configurations clangd can use for one repository.

```yaml
configurations:
#  - name: debug
#    compile_commands: build/debug   # a folder holding compile_commands.json
#    fallback_flags: [-std=c++20, -Iinclude]
```

## app.yml

An app's manifest. `name`, `title` and `bridge` are required. The Apps guide explains each key.

```yaml
name: my-app                 # lowercase letters, digits and dashes; equals the folder's name
title: My app
bridge: 1
# description: ""            # up to 200 characters
# glyph: app_view            # a glyph name
# entry: index.html
# reads: []                  # channels
# writes: []                 # write kinds
# connects: []               # https origins the page may reach
# host: host.mjs             # a program run on this machine
# files: []                  # machine apps: folders the page may read
# secrets: true
# activation: [onTab]        # needs host
# depends: []                # other machine apps
# contributes:
#   commands: []
#   keybindings: []
#   menus: {}
#   viewsContainers: {}
#   views: {}
#   customEditors: []
#   configuration: {}
#   themes: []
#   iconThemes: []
#   languages: []
#   grammars: []
#   snippets: []
#   semanticTokenTypes: []
#   semanticTokenModifiers: []
#   semanticTokenScopes: []
#   jsonValidation: []
#   configurationDefaults: {}
#   debuggers: []
#   breakpoints: []
#   taskDefinitions: []
#   problemPatterns: []
#   problemMatchers: []
```

## The hub's data files

Every data file has the same shape: an optional `title:` and `intro:`, a `schema:` that lists its fields, and the entries. The first field of the schema is the one an entry is found by. Each template ends with one entry, commented, holding every field; uncomment it and fill it in.

A new entry is written into the file of the hub that lists its collection. With more than one hub listing the collection, Add asks which hub's file takes it, and the `new-entry` write names that hub by its `root`; an app's `new-entry` reaches the primary hub alone.

A schema line takes these keys:

```yaml
- field: name          # the key in each entry
  type: text           # text, textarea, date, checkbox, select, tags, metalist, raw or records
  label: "Name"        # the label in the editor; the field name when absent
  required: true       # or required: { when: { role: present } }
  options: [a, b]      # the values a select or tags field takes: a word, or { key: a, label: "A" }
  from: people         # takes its values from a registry, `projects`, or `vocab.<list>`
  filter: true         # select, tags or text: a filter of the field beside the view's search
  when: { category: conference }   # the field is allowed only while this holds
  help: "One line."    # shown in the editor and on hover
  # records only: fields (the inner schema), open (more keys allowed), map (a map, not a list)
```

### .oculus/data/research/venues.yml

```yaml
title: Venues
schema:
  - { field: name,           type: text,     required: true, help: "The venue's full name." }
  - { field: id,             type: text,     help: "The id a project's venue names." }
  - { field: short,          type: text,     help: "Short name or acronym." }
  - { field: category,       type: select,   from: vocab.venue_categories, help: "journal, conference, thesis or meeting." }
  - { field: jif,            type: text,     help: "Impact factor." }
  - { field: quartile,       type: text,     help: "Quartile in its category." }
  - { field: tier,           type: select,   from: vocab.venue_tiers, help: "flagship, strong or specialist." }
  - { field: wos,            type: text,     help: "Web of Science indexing." }
  - { field: scopus,         type: text,     help: "Scopus indexing." }
  - { field: format,         type: text,     help: "LaTeX class or template." }
  - { field: free,           type: text,     help: "Open-access and charge note." }
  - { field: wants,          type: textarea, help: "What it publishes." }
  - { field: themes,         type: tags,     options: [{ key: core-ml, label: "Core ML" }, { key: clinical, label: "Clinical" }], help: "Theme words: core-ml or clinical." }
  - { field: link,           type: text,     help: "Web address." }
  - { field: timing,         type: text,     help: "When submissions are open." }
  - { field: deadline,       type: date,     help: "Next submission deadline." }
  - { field: deadline_month, type: text,     when: { category: conference }, help: "Usual deadline month, such as Aug." }
  - { field: held_month,     type: text,     when: { category: conference }, help: "Usual month it is held." }
  - { field: call,           type: text,     help: "Call-for-papers address." }
  - { field: email,          type: text,     help: "Editorial office address." }
entries:
#  - name: Neurocomputing         # required; renaming it keeps every project's venue
#    id: neucom                   # what a project's venue names
#    short: NEUCOM
#    category: journal            # journal, conference, thesis or meeting
#    jif: "6.5"
#    quartile: ""                 # the journal's quartile
#    tier: strong                 # flagship, strong or specialist
#    wos: "yes"
#    scopus: "yes"
#    format: elsarticle
#    free: "read-and-publish deal"
#    wants: ""                    # what it publishes
#    themes: [core-ml]            # keys of the themes field's options
#    link: https://example.org
#    timing: "rolling"
#    deadline: YYYY-MM-DD
#    deadline_month: Aug          # conferences only
#    held_month: Dec              # conferences only
#    call: https://example.org/cfp
#    email: editor@example.org
```

### .oculus/data/research/data.yml

The datasets are listed under `datasets:`, not `entries:`.

```yaml
title: Data
schema:
  - { field: key,         type: text,     required: true, help: "The dataset's key, used by a project's datasets." }
  - { field: name,        type: text,     required: true, help: "Full name." }
  - { field: modality,    type: text,     help: "Kind of data." }
  - { field: themes,      type: tags,     options: [{ key: eeg, label: "EEG" }, { key: ecg, label: "ECG" }], help: "Theme words: eeg or ecg." }
  - { field: description, type: textarea, help: "What it holds and why it is used." }
  - { field: size,        type: text,     help: "How large it is." }
  - { field: path,        type: text,     label: "Folder", help: "The dataset's folder under ~/data, the same on this Mac and on the cluster; Recover fetches into it." }
  - { field: access,      type: select,   from: vocab.data_access, help: "open, registration, credentialed or private." }
  - { field: source,      type: text,     help: "Source address." }
  - { field: notes,       type: textarea, help: "What a reader of the set should know, and the steps a person follows that no source states." }
  - field: retrieval
    type: records
    help: "How the set comes back: its sources, each with a kind and the fields that kind takes, fetched in the order written."
    fields:
      - { field: kind,       type: select, options: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url, library, request, derived], required: true, help: "Where the files come from. physionet to url are downloads Recover runs; library, request and derived are stated on the card." }
      - { field: project,    type: text,   when: { kind: physionet }, required: { when: { kind: physionet } }, help: "The PhysioNet project's slug, as in physionet.org/content/<project>/." }
      - { field: version,    type: text,   when: { kind: [physionet, dandi] }, required: { when: { kind: [physionet, dandi] } }, help: "The project's or dandiset's version, written as text." }
      - { field: archive,    type: checkbox, when: { kind: physionet }, help: "Whether the set comes as PhysioNet's one zip of the whole project; it is checked by its size." }
      - { field: throttle,   type: text,   when: { kind: physionet }, help: "The rate the download is held to, as curl's --limit-rate takes it (5M is five megabytes a second)." }
      - { field: record,     type: text,   when: { kind: zenodo }, required: { when: { kind: zenodo } }, help: "The Zenodo record number." }
      - { field: collection, type: text,   when: { kind: [figshare, tcia] }, required: { when: { kind: tcia } }, help: "The figshare collection id, or the TCIA collection name." }
      - { field: article,    type: text,   when: { kind: figshare }, help: "The figshare article id, for a set that is one article." }
      - { field: files,      type: tags,   when: { kind: [physionet, zenodo, figshare, stanford, geo] }, required: { when: { kind: geo } }, help: "The file names to fetch; every file of the source when absent." }
      - { field: dandiset,   type: text,   when: { kind: dandi }, required: { when: { kind: dandi } }, help: "The DANDI dandiset number." }
      - { field: assets,     type: tags,   when: { kind: dandi }, help: "The asset paths to fetch; every asset when absent." }
      - { field: repo,       type: text,   when: { kind: huggingface }, required: { when: { kind: huggingface } }, help: "The Hugging Face dataset, as owner/name." }
      - { field: patterns,   type: tags,   when: { kind: huggingface }, help: "The file patterns to fetch (* matches within a folder, ** across folders); every file when absent." }
      - { field: druid,      type: text,   when: { kind: stanford }, required: { when: { kind: stanford } }, help: "The Stanford Digital Repository druid." }
      - { field: accession,  type: text,   when: { kind: geo }, required: { when: { kind: geo } }, help: "The GEO series accession, such as GSE180759." }
      - { field: dataset,    type: text,   when: { kind: kaggle }, required: { when: { kind: kaggle } }, help: "The Kaggle dataset, as owner/slug." }
      - { field: series,     type: tags,   when: { kind: tcia }, help: "The series instance UIDs to fetch; every series of the collection when absent." }
      - { field: ids,        type: tags,   when: { kind: synapse }, required: { when: { kind: synapse } }, help: "The Synapse entity ids (syn...) whose files are fetched." }
      - field: urls
        type: records
        when: { kind: url }
        required: { when: { kind: url } }
        help: "The files of a url source, each an address with its sha256 or its md5 when the entry knows one; a row gives at most one of the two."
        fields:
          - { field: url,    type: text, required: true, help: "The file's web address." }
          - { field: sha256, type: text, help: "The file's sha256, checked after the download; not beside md5." }
          - { field: md5,    type: text, help: "The file's md5, checked after the download, for a source that publishes no sha256; not beside sha256." }
          - { field: name,   type: text, help: "The name the file is saved under; the address's last part when absent." }
      - { field: call,       type: text,   when: { kind: library }, required: { when: { kind: library } }, help: "The library call that fetches the set." }
      - { field: contact,    type: text,   when: { kind: request }, required: { when: { kind: request } }, help: "Who grants access to the set." }
      - { field: from,       type: tags,   from: datasets, when: { kind: derived }, required: { when: { kind: derived } }, help: "The datasets the set is built from." }
      - { field: script,     type: text,   when: { kind: derived }, required: { when: { kind: derived } }, help: "The project script that builds the set, as its path in the hub." }
      - { field: into,       type: text,   when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "A folder below the dataset's folder that the source's files land in; the folder itself when absent." }
      - { field: unpack,     type: checkbox, when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "Whether the source's archives are unpacked into their folder after the check." }
      - { field: strip,      type: text,   when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "How many leading folders the unpack drops of every path an archive holds, counted below folder when the source names one." }
      - { field: folder,     type: text,   label: "Folder in the archive", when: { kind: [physionet, zenodo, figshare, dandi, huggingface, stanford, geo, kaggle, tcia, synapse, url] }, help: "A folder inside each archive; the unpack takes only its contents, which land in the archive's folder, and strip counts below it." }
datasets:
#  - key: my-eeg                  # required; what a project's datasets names
#    name: "My EEG set"           # required
#    modality: EEG
#    themes: [eeg]                # keys of the themes field's options
#    description: ""
#    size: "12 GB"
#    path: ~/data/my-eeg          # the folder under ~/data on this Mac and on the cluster
#    access: open                 # open, registration, credentialed or private
#    source: https://example.org
#    notes: ""
#    retrieval:                   # one row per source; the kinds and their fields are the schema's
#      - kind: zenodo
#        record: "1234567"
#        unpack: true             # unpack the source's archives after the check
#        folder: data/train       # only this folder of each archive, its contents in the archive's folder
#      - kind: url
#        urls:
#          - { url: https://example.org/labels.csv, sha256: "" }   # or md5:, never both
#      - kind: derived
#        from: [my-raw-eeg]
#        script: projects/my-eeg/code/build.py
```

### .oculus/data/pillars/pillars.yml

```yaml
title: Pillars
schema:
  - { field: key,     type: text,     required: true, help: "The pillar's key, used by a project's pillars." }
  - { field: title,   type: text,     required: true, help: "Name." }
  - { field: kind,    type: text,     help: "pillar, provisional or offpillar." }
  - { field: goal,    type: textarea, help: "One-line aim." }
  - { field: color,   type: text,     help: "A hex colour of the palette." }
  - { field: funding, type: text,     help: "Granted support only." }
  - { field: blurb,   type: textarea, help: "What it covers." }
entries:
#  - key: tensor                  # required; what a project's pillars name
#    title: "Tensor methods"      # required
#    kind: pillar                 # pillar, provisional or offpillar
#    goal: ""
#    color: "#2563eb"
#    funding: ""                  # granted support only
#    blurb: ""
```

### .oculus/data/pillars/domains.yml

```yaml
title: Domains
schema:
  - { field: key,              type: text,     required: true, help: "The domain's key, used by a project's domain." }
  - { field: title,            type: text,     required: true, help: "Name, the label of a project card of the domain." }
  - { field: blurb,            type: textarea, help: "What it covers." }
  - { field: color,            type: text,     help: "The colour of a project card of the domain, as #rrggbb." }
  - { field: expects_datasets, type: checkbox, help: "Whether an active project of the domain must list a dataset." }
entries:
#  - key: heart                   # required; what a project's domain names
#    title: "Heart"               # required
#    blurb: ""
#    color: "#dc2626"             # #rrggbb; a neutral tone when absent
#    expects_datasets: true       # the Audit reports an active project with no dataset
```

### .oculus/data/people/people.yml

Your own entry is the one whose key the workspace setting `self` names (see `workspaces/<name>.yml`).

```yaml
title: People
schema:
  - { field: key,          type: text,     required: true, help: "The person's key." }
  - { field: name,         type: text,     required: true, help: "Full name." }
  - { field: affiliations, type: tags,     from: organisations, help: "Organisation keys, the primary first." }
  - { field: role,         type: text,     help: "Who they are to you." }
  - { field: orcid,        type: text,     help: "ORCID." }
  - { field: email,        type: text,     help: "Email address." }
  - { field: links,        type: tags,     help: "Web addresses." }
  - { field: folder,       type: text,     help: "A student's supervision folder." }
entries:
#  - key: me                      # required
#    name: "Your Name"            # required
#    affiliations: [my-uni]       # organisation keys, the primary first
#    role: ""
#    orcid: 0000-0000-0000-0000
#    email: you@example.org
#    links: []
#    folder: ""                   # a student's supervision folder
```

### .oculus/data/people/organisations.yml

```yaml
title: Organisations
schema:
  - { field: key,     type: text,   required: true, help: "The organisation's key." }
  - { field: name,    type: text,   required: true, help: "Full name." }
  - { field: kind,    type: select, options: [university, hospital, funder, company, other], required: true, help: "Kind." }
  - { field: country, type: text,   help: "Two-letter country code." }
  - { field: links,   type: tags,   help: "Web addresses." }
entries:
#  - key: my-uni                  # required
#    name: "My University"        # required
#    kind: university             # required: university, hospital, funder, company or other
#    country: NL
#    links: []
```

### .oculus/data/research/resources.yml

```yaml
title: Resources
schema:
  - { field: key,    type: text,     required: true, help: "The resource's key, used by compute and slurm.resource." }
  - { field: name,   type: text,     required: true, help: "Name." }
  - { field: kind,   type: select,   options: [cluster, machine, storage], required: true, help: "Kind." }
  - { field: host,   type: text,     help: "The ssh alias of a cluster or remote machine." }
  - { field: access, type: textarea, help: "How it is reached." }
  - { field: links,  type: tags,     help: "Web addresses." }
entries:
#  - key: my-cluster              # required; what compute and slurm.resource name
#    name: "My cluster"           # required
#    kind: cluster                # required: cluster, machine or storage
#    host: my-cluster             # the ssh alias
#    access: ""
#    links: []
```

### .oculus/data/research/statements.yml

```yaml
title: Statements
schema:
  - { field: key,       type: text,     required: true, help: "Short name." }
  - { field: title,     type: text,     required: true, help: "Name." }
  - { field: status,    type: select,   options: [draft, ready], required: true, help: "Draft or ready." }
  - { field: tags,      type: tags,     help: "Filter words." }
  - { field: note,      type: textarea, help: "Where it is used." }
  - { field: statement, type: textarea, help: "The verbatim text." }
entries:
#  - key: data-availability       # required
#    title: "Data availability"   # required
#    status: ready                # required: draft or ready
#    tags: []
#    note: ""                     # where it is used
#    statement: ""                # the verbatim text
```

### .oculus/data/academic/funding.yml

```yaml
title: Funding
schema:
  - { field: key,       type: text,     required: true, help: "The key a project's funding names." }
  - { field: title,     type: text,     required: true, help: "Scheme or application." }
  - { field: sub,       type: text,     help: "Scheme, role, period." }
  - { field: funder,    type: select,   from: organisations, help: "The funder's organisation key." }
  - { field: status,    type: select,   options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn], required: true, help: "Where it stands." }
  - { field: date,      type: text,     help: "Year or range." }
  - { field: deadline,  type: date,     help: "Shows on Focus while live." }
  - { field: meta,      type: metalist, help: "Label and value rows." }
  - { field: tags,      type: tags,     help: "Filter words." }
  - { field: note,      type: textarea, help: "Notes." }
  - { field: statement, type: textarea, help: "The funder's acknowledgment, verbatim." }
  - { field: link,      type: text,     help: "A path in the hub." }
  - { field: url,       type: text,     help: "The call's address." }
  - { field: followup,  type: text,     help: "A standing reminder." }
  - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
  - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
  - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
entries:
#  - key: my-grant                # required; what a project's funding names
#    title: "My grant"            # required
#    sub: ""                      # scheme, role, period
#    funder: my-funder            # an organisation key
#    status: in-prep              # required: in-prep, planned, submitted, contributing,
#                                 # awarded, rejected or withdrawn
#    date: "2026-2030"
#    deadline: YYYY-MM-DD
#    meta:
#      - { label: Amount, value: "250k" }
#    tags: []
#    note: ""
#    statement: ""                # required when awarded or contributing
#    link: funding/2026-my-call   # a path in the hub
#    url: https://example.org/call
#    followup: ""
#    lead: [my-key]               # required; people keys
#    collaborators: []            # people keys
#    supervisors: []              # people keys
```

### .oculus/data/academic/events.yml

```yaml
title: Talks & Events
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "Event." }
  - { field: sub,      type: text,     help: "Place." }
  - { field: role,     type: select,   options: [present, co-present, attend], required: true, help: "Your role." }
  - { field: status,   type: select,   options: [upcoming, planned, completed, cancelled, not-attending], required: true, help: "Where it stands." }
  - { field: date,     type: text,     help: "When." }
  - { field: deadline, type: date,     help: "Shows on Focus while live." }
  - { field: meta,     type: metalist, help: "Label and value rows." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: link,     type: text,     required: { when: { role: present } }, help: "Slides of a talk you give." }
  - { field: related,  type: tags,     from: projects, help: "Project ids." }
  - { field: followup, type: text,     help: "A standing reminder." }
  - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
  - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
  - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
entries:
#  - key: my-talk                 # required
#    title: "My talk"             # required
#    sub: "Amsterdam"
#    role: present                # required: present, co-present or attend
#    status: upcoming             # required: upcoming, planned, completed, cancelled
#                                 # or not-attending
#    date: YYYY-MM-DD
#    deadline: YYYY-MM-DD
#    meta: []
#    tags: []
#    note: ""
#    link: network/my-talk        # required when role is present
#    related: []                  # project ids
#    followup: ""
#    lead: [my-key]               # required; people keys
#    collaborators: []            # people keys
#    supervisors: []              # people keys
```

### .oculus/data/academic/joint-work.yml

```yaml
title: Joint work
schema:
  - { field: key,      type: text,     help: "Short name." }
  - { field: title,    type: text,     required: true, help: "What the work is." }
  - { field: person,   type: select,   from: people, required: true, help: "The person's key." }
  - { field: status,   type: select,   options: [exploring, active, completed], required: true, help: "Where it stands." }
  - { field: meta,     type: metalist, help: "Label and value rows." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: deadline, type: date,     help: "Shows on Focus while live." }
  - { field: followup, type: text,     help: "A standing reminder." }
entries:
#  - key: paper-with-sam
#    title: "A paper with Sam"    # required
#    person: sam                  # required; a person key
#    status: active               # required: exploring, active or completed
#    meta: []
#    tags: []
#    note: ""
#    deadline: YYYY-MM-DD
#    followup: ""
```

### .oculus/data/academic/education.yml

```yaml
title: Education & Service
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "Course or role." }
  - { field: sub,      type: text,     help: "Institution, period." }
  - { field: status,   type: select,   options: [planned, ongoing, completed], required: true, help: "Where it stands." }
  - { field: date,     type: text,     help: "Year or range." }
  - { field: deadline, type: date,     help: "Shows on Focus while live." }
  - { field: meta,     type: metalist, help: "Label and value rows." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: link,     type: text,     help: "A path in the hub." }
  - { field: related,  type: tags,     from: projects, help: "Project ids." }
  - { field: followup, type: text,     help: "A standing reminder." }
  - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
  - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
  - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
entries:
#  - key: ml-course               # required
#    title: "Machine learning"    # required
#    sub: "University, 2026"
#    status: ongoing              # required: planned, ongoing or completed
#    date: "2026"
#    deadline: YYYY-MM-DD
#    meta: []
#    tags: []
#    note: ""
#    link: education/courses/ml   # a path in the hub
#    related: []                  # project ids
#    followup: ""
#    lead: [my-key]               # required; people keys
#    collaborators: []            # people keys
#    supervisors: []              # people keys
```

### .oculus/data/academic/applications.yml

```yaml
title: Applications
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "Position." }
  - { field: sub,      type: text,     help: "Institution." }
  - { field: status,   type: select,   options: [not-applied, active, accepted, rejected, declined, withdrawn, applied], required: true, help: "Where it stands." }
  - { field: date,     type: text,     help: "Year applied." }
  - { field: meta,     type: metalist, help: "Label and value rows." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: link,     type: text,     help: "A path in the hub." }
  - { field: url,      type: text,     help: "The posting." }
  - { field: related,  type: tags,     from: projects, help: "Project ids." }
  - { field: deadline, type: date,     help: "The deadline, if any." }
  - { field: followup, type: text,     help: "A standing reminder." }
  - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
  - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
  - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
entries:
#  - key: my-postdoc              # required
#    title: "Postdoc position"    # required
#    sub: "University"
#    status: active               # required: not-applied, active, accepted, rejected,
#                                 # declined, withdrawn or applied
#    date: "2026"
#    meta: []
#    tags: []
#    note: ""
#    link: applications/my-postdoc
#    url: https://example.org/job
#    related: []                  # project ids
#    deadline: YYYY-MM-DD
#    followup: ""
#    lead: [my-key]               # required; people keys
#    collaborators: []            # people keys
#    supervisors: []              # people keys
```

### .oculus/data/academic/tasks.yml

```yaml
title: Tasks
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "What to do." }
  - { field: status,   type: select,   options: [todo, doing, done, dropped], required: true, help: "Where it stands." }
  - { field: deadline, type: date,     help: "Shows on Focus while live." }
  - { field: kind,     type: text,     help: "Review, admin, teaching." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: followup, type: text,     help: "A standing reminder." }
  - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
  - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
  - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
entries:
#  - key: review-paper            # required
#    title: "Review a paper"      # required
#    status: todo                 # required: todo, doing, done or dropped
#    deadline: YYYY-MM-DD
#    kind: review
#    note: ""
#    tags: []
#    followup: ""
#    lead: [my-key]               # required; people keys
#    collaborators: []            # people keys
#    supervisors: []              # people keys
```

### .oculus/data/literature/literature.yml

The papers kept for reading and citing. Save to Literature on a card of the Literature search or Lit Watch writes an entry, and so does Add on the Literature view, which takes a DOI, an arXiv or PubMed id, or an address. Oculus makes the key, the citation key: the first author's surname, the year and the first word of the title.

```yaml
title: Literature
intro: "Papers kept for reading and citing."
schema:
  - { field: key,      type: text,     required: true, help: "The citation key: the first author's surname, the year and the first word of the title." }
  - { field: title,    type: text,     required: true, help: "The paper's title." }
  - { field: authors,  type: tags,     filter: true, help: "The authors in order, one name per entry." }
  - { field: venue,    type: text,     filter: true, help: "The journal or conference; a venue of the venues registry by this name opens from it." }
  - { field: year,     type: text,     filter: true, help: "The year it appeared, as a whole number." }
  - { field: doi,      type: text,     help: "The DOI, without the address in front of it." }
  - { field: url,      type: text,     help: "The paper's address." }
  - { field: abstract, type: textarea, help: "The abstract, as plain text." }
  - { field: keywords, type: tags,     filter: true, help: "Words the paper is found by." }
  - { field: projects, type: tags,     from: projects, filter: true, help: "The projects the paper is for." }
  - { field: source,   type: select,   options: [search, lit-watch, hand], filter: true, help: "Where it came from: search, lit-watch or hand." }
  - { field: added,    type: date,     help: "The day it was saved." }
  - { field: note,     type: textarea, help: "Notes on the paper." }
entries:
#  - key: smith2024blockterm      # required; the citation key
#    title: "Block-term tensor regression for ECoG"   # required
#    authors: [John Smith, Marc M. Van Hulle]
#    venue: Neurocomputing
#    year: 2024
#    doi: 10.1016/j.neucom.2024.127654
#    url: https://doi.org/10.1016/j.neucom.2024.127654
#    abstract: ""
#    keywords: [tensor]
#    projects: [my-project]
#    source: search               # search, lit-watch or hand
#    added: YYYY-MM-DD
#    note: ""
```

### .oculus/data/academic/leads.yml

Written by the scout. `meta.log` holds one dated line per pass.

```yaml
schema:
  - { field: title,    type: text,     help: "Position." }
  - { field: inst,     type: text,     help: "Institution." }
  - { field: country,  type: text,     help: "Country." }
  - { field: typ,      type: text,     help: "Kind of position." }
  - { field: focus,    type: textarea, help: "What it is about." }
  - { field: fit,      type: textarea, help: "How it fits; strong, moderate or reach colours the card." }
  - { field: status,   type: select,   from: vocab.lead_statuses, help: "Where it stands: open, applied, declined, closed or dismissed." }
  - { field: date,     type: date,     help: "Day found." }
  - { field: deadline, type: text,     help: "Deadline as posted." }
  - { field: url,      type: text,     help: "The posting." }
meta:
  log: []
entries:
#  - title: "Assistant professor"
#    inst: "University"
#    country: NL
#    typ: tenure-track
#    focus: ""
#    fit: "strong: ..."           # strong, moderate or reach colours the card
#    status: open                 # open, applied or declined
#    date: YYYY-MM-DD
#    deadline: YYYY-MM-DD
#    url: https://example.org/job
```

### .oculus/data/literature/radar.yml

Written by the literature scout. `meta.last_run` is the day of its last pass.

```yaml
schema:
  - { field: title,      type: text,     required: true, help: "Title." }
  - { field: authors,    type: text,     help: "Authors in order." }
  - { field: venue,      type: text,     help: "Where it appeared." }
  - { field: year,       type: text,     help: "Year." }
  - { field: url,        type: text,     required: true, help: "Address; the sweep deduplicates by it." }
  - { field: bucket,     type: select,   from: vocab.radar_buckets, required: true, help: "preemption, cite_baseline, adjacent or idea." }
  - { field: project,    type: select,   from: projects, help: "The project it was found for." }
  - { field: relevance,  type: select,   options: [high, med, low], help: "How close it is." }
  - { field: why,        type: textarea, help: "Why it matters." }
  - { field: found,      type: date,     help: "Day found." }
  - { field: threatens,  type: textarea, help: "The claim a pre-emption puts at stake." }
  - { field: motif,      type: text,     help: "Idea: the pattern taken from it." }
  - { field: maps_to,    type: text,     from: projects, help: "Idea: the project, or new-idea-candidate." }
  - { field: idea_spark, type: textarea, help: "Idea: the idea itself." }
  - { field: dismissed,  type: checkbox, help: "Set by Lit Watch when you dismiss it." }
meta:
  last_run: ""
entries:
#  - title: "A paper"             # required
#    authors: "A. Author, B. Author"
#    venue: "A journal"
#    year: "2026"
#    url: https://doi.org/10.0000/x   # required
#    bucket: adjacent             # required: preemption, cite_baseline, adjacent or idea
#    project: my-project          # not on an idea
#    relevance: med               # high, med or low; not on an idea
#    why: ""                      # not on an idea
#    found: YYYY-MM-DD
#    threatens: ""                # preemption
#    motif: ""                    # idea only
#    maps_to: my-project          # idea only: a project, or new-idea-candidate
#    idea_spark: ""               # idea only
#    dismissed: true              # set by Lit Watch
```

### .oculus/data/academic/career.yml

One record of sections, drawn by Focus's Career banner: the goal, the next milestone with its day and the days left to it, the situation and the order of work.

```yaml
schema:
  - { field: title, type: text, help: "The title of the career file's editor page." }
  - { field: goal, type: text, help: "The position the plan works toward." }
  - { field: milestone, type: text, help: "The next milestone." }
  - { field: milestone_date, type: date, help: "The day of the next milestone." }
  - { field: situation, type: records, open: true, help: "Facts, one label and sentence each.", fields: [] }
  - { field: order_note, type: textarea, help: "A note over the order of work." }
  - field: order
    type: records
    help: "The order of work."
    fields:
      - { field: task, type: text, required: true, help: "What to do." }
      - { field: when, type: text, help: "When." }
      - { field: note, type: text, help: "A remark." }

title: Career strategy
# goal: ""
# milestone: ""
# milestone_date: YYYY-MM-DD
# situation:
#   Position: "Postdoc until 2027"
# order_note: ""
# order:
#   - { task: "Apply for the fellowship", when: "2026-11", note: "" }
```

## present.yml

A deck: this file and Markdown slides in one folder.

```yaml
deck:
  title: "My deck"

# defaults:
#   tag_tones: {}            # a slide tag to the hue its chip wears

# groups:
#   active:
#     find: { folders: projects/*/*/present, tiers: [research], stages: [in-prep] }
#     sort: folder           # folder or title
#     discover: true         # also take decks found beyond `slides`
#     slides: []             # project ids, in order

# order: []                  # slide files and groups, in the order shown
```
