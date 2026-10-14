# Templates

Every YAML file oculus reads, as a file you can copy. Copy a block into the file named above it, then uncomment the keys you want to set. A commented key shows its default; leaving it commented keeps that default.

## Contents

[TOC]

---

## Where each file goes

| File | Place | Who writes it |
|---|---|---|
| `config.yml` | `<hub>/.oculus/config.yml` | you; a folder holding it is a hub |
| `local.yml` | `<hub>/.oculus/local.yml` | you; this machine only, keep it out of git |
| `bookmarks.yml` | `<hub>/.oculus/bookmarks.yml` | the Files view's star, or you |
| `workspaces/<name>.yml` | `<hub>/.oculus/workspaces/` | Save Workspace As, or you |
| `schedules.yml` | `<hub>/.oculus/schedules.yml` | the update tray, or you |
| `project.yml` | `<project>/project.yml` or `<repository>/.oculus/project.yml` | you |
| `settings.yml` | `<repository>/.oculus/settings.yml` | you |
| `commands.yml` | `<repository>/.oculus/commands.yml` | you |
| `launch.yml` | `<repository>/.oculus/launch.yml` | Add Configuration, or you |
| `cpp.yml` | `<repository>/.oculus/cpp.yml` | you |
| `app.yml` | `<apps folder>/<name>/app.yml` | you |
| the hub's data files | the paths `collections:` names | oculus's views, or you |
| `present.yml` | a deck folder | you |

Oculus writes these itself, so they have no template:

- `<hub>/.oculus/memories/` and `<hub>/.oculus/wallpaper/`: picture folders.
- `<hub>/.oculus/notes/`: your notes as Markdown files, and `order.json`, the order the Notes list shows them in.
- `<repository>/.oculus/app-data/<name>.json`: the store of a root app.

## config.yml

The hub's own settings. A key set here replaces oculus's value for this hub. Any other key is a finding.

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

# The folder a new project is made in, per tier (projects, coauthor, archive, personal).
# Each folder is a scan folder or lies under one.
# new_project_dir: {}
#   example: { projects: projects/ideas, personal: side-projects }

# The folder of the hub's own deck, opened by the Present view when no deck is named.
# portfolio_deck: deck

# The hub's data files, one entry per key. The keys data, venues, pillars, domains, funding,
# people, organisations and resources are the registries, leads and radar the Position Leads and
# Lit Watch feeds, and every other key is a card list. The domains registry holds each domain's
# colour and label and which domains expect a dataset; the venues and data registries hold their
# theme words as the options of their `themes` field.
# collections:
#   - { key: data,           file: "registries/data.yml" }
#   - { key: venues,         file: "registries/venues.yml" }
#   - { key: pillars,        file: "registries/pillars.yml" }
#   - { key: domains,        file: "registries/domains.yml" }
#   - { key: statements,     file: "registries/boilerplate.yml" }
#   - { key: people,         file: "registries/people.yml" }
#   - { key: organisations,  file: "registries/organisations.yml" }
#   - { key: resources,      file: "registries/resources.yml" }
#   - { key: funding,        file: "funding/funding.yml" }
#   - { key: events,         file: "network/events.yml" }
#   - { key: education,      file: "education/education.yml" }
#   - { key: applications,   file: "applications/applications.yml" }
#   - { key: joint-work,     file: "network/joint-work.yml" }
#   - { key: tasks,          file: "tasks/tasks.yml" }
#   - { key: literature,     file: "registries/literature.yml" }
#   - { key: leads,          file: "feeds/position-leads.yml" }
#   - { key: radar,          file: "feeds/literature-radar.yml" }

# A website's publication list, compared with the manifests by the Audit view. None by default.
# publications_file: path/to/publications.yml

# A website's LinkedIn posts folder, read by the LinkedIn view. None by default.
# linkedin_dir: path/to/_linkedin

# The career file, drawn by Focus's Career strategy panel.
# career_file: registries/career.yml

# The photo wall's folder, inside the hub.
# memories_dir: .oculus/memories

# The wallpaper images' folder, inside the hub.
# wallpaper_dir: .oculus/wallpaper

# The wallpaper: `<hub name>/<file name>`, `random`, or empty for none. Read from the primary hub.
# wallpaper:
#   image: ""

# The hub's own documents, each a tab of the page its group names.
# docs: []
#   example:
#   - { label: "Data map", path: docs/DATA-MAP.md, group: help }

# The cluster Live HPC polls: the key of a `kind: cluster` entry of the resources registry.
# Empty is no cluster.
# slurm:
#   resource: ""

# The values of the settings apps declare, by the setting's whole key. The Settings view writes it.
# app_settings: {}
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

# Where oculus keeps its files.
# bookmarks: .oculus/bookmarks.yml
# schedules: .oculus/schedules.yml
# apps_dir: .oculus/apps
# changes: ~/.oculus/changes.jsonl
# history: ~/.oculus/history
# approvals: ~/.oculus/approvals.json
# lsp: ~/.oculus/lsp
# schedule_record: ~/.oculus/schedule.json
# sessions_cache: ~/.oculus/transcript-cache.json
# sessions_overrides: ~/.oculus/sessions.json
```

## bookmarks.yml

The star in the Files view writes this file. An entry with a `root` and no `path` is the root's top.

```yaml
title: Bookmarks

schema:
  - { field: label, type: text, label: Label, required: true }
  - { field: root, type: select, label: Root }
  - { field: path, type: text, label: Path }

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
```

## schedules.yml

A list of schedules. Each runs one thing: an update task, a saved command, or a prompt.

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

## project.yml

One project. `tier` and `type` are required. Every other key is optional.

```yaml
# --- Core
tier: projects          # projects, coauthor, archive, personal or software: the board it is on
type: idea              # active, published, submitted, in-prep, paused, idea, tech-report, software,
                        # nogo, dropped, disproved, abandoned, exploring, phd, finished or archived
# short: my-project     # short name for cards and lists
# title: ""
# lead: ""              # first author or project lead
# authors: []
# status:
#   chips: []           # from the status legend, such as in-prep, submitted, building
#   line: ""            # one short line
# focus: run            # Focus lane: run, push, revise, review, blocked, backburner, scope,
                        # derisk, build, or holding for an idea in the backlog
# priority: high        # high, med or low
# pin: true             # keep the card at the top of its board
# venue_id: ""          # a venue's id from the venues registry
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
# pillar: []            # pillars registry
# funding: []           # funding registry
# collaborators: []     # people registry
# waiting-on: []        # people or projects
# related: []           # other projects
# datasets: []          # data registry

# --- Dates
# deadline: YYYY-MM-DD
# followup:
#   do: ""
#   after: YYYY-MM-DD   # hidden until this date
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

Named commands of one repository, run from the Repositories view, a project card or Run Command.

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

### registries/venues.yml

```yaml
title: Venues
schema:
  - { field: name,           type: text,     required: true, help: "The venue's full name." }
  - { field: id,             type: text,     help: "The id a project's venue_id names." }
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
#  - name: Neurocomputing         # required; renaming it keeps every venue_id
#    id: neucom                   # what a project's venue_id names
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

### registries/data.yml

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
  - { field: hpc_path,    type: text,     help: "Where it lives." }
  - { field: access,      type: select,   from: vocab.data_access, help: "open, registration, credentialed or private." }
  - { field: source,      type: text,     help: "Source address." }
  - field: retrieval
    type: records
    help: "How the set is fetched again."
    fields:
      - { field: method, type: select, options: [direct, library, manual, physionet, physionet_zip, private, script, url, zenodo], required: true, help: "The recipe." }
      - { field: notes, type: textarea, help: "Steps for a person." }
datasets:
#  - key: my-eeg                  # required; what a project's datasets names
#    name: "My EEG set"           # required
#    modality: EEG
#    themes: [eeg]                # keys of the themes field's options
#    description: ""
#    size: "12 GB"
#    hpc_path: ~/data/my-eeg
#    access: open                 # open, registration, credentialed or private
#    source: https://example.org
#    retrieval:
#      method: url                # direct, library, manual, physionet, physionet_zip,
#                                 # private, script, url or zenodo
#      notes: ""
```

### registries/pillars.yml

```yaml
title: Pillars
schema:
  - { field: key,     type: text,     required: true, help: "The pillar's key, used by a project's pillar." }
  - { field: title,   type: text,     required: true, help: "Name." }
  - { field: kind,    type: text,     help: "pillar, provisional or offpillar." }
  - { field: goal,    type: textarea, help: "One-line aim." }
  - { field: color,   type: text,     help: "A hex colour of the palette." }
  - { field: funding, type: text,     help: "Granted support only." }
  - { field: blurb,   type: textarea, help: "What it covers." }
entries:
#  - key: tensor                  # required; what a project's pillar names
#    title: "Tensor methods"      # required
#    kind: pillar                 # pillar, provisional or offpillar
#    goal: ""
#    color: "#2563eb"
#    funding: ""                  # granted support only
#    blurb: ""
```

### registries/domains.yml

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

### registries/people.yml

Exactly one entry carries `self: true`: you.

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
  - { field: self,         type: checkbox, help: "True on your own entry." }
entries:
#  - key: me                      # required
#    name: "Your Name"            # required
#    affiliations: [my-uni]       # organisation keys, the primary first
#    role: ""
#    orcid: 0000-0000-0000-0000
#    email: you@example.org
#    links: []
#    folder: ""                   # a student's supervision folder
#    self: true                   # on your own entry only
```

### registries/organisations.yml

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

### registries/resources.yml

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

### registries/boilerplate.yml

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

### funding/funding.yml

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
```

### network/events.yml

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
```

### network/joint-work.yml

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

### education/education.yml

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
```

### applications/applications.yml

```yaml
title: Applications
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "Position." }
  - { field: sub,      type: text,     help: "Institution." }
  - { field: status,   type: select,   options: ["not applied", active, accepted, rejected, declined, withdrawn, applied], required: true, help: "Where it stands." }
  - { field: date,     type: text,     help: "Year applied." }
  - { field: meta,     type: metalist, help: "Label and value rows." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: link,     type: text,     help: "A path in the hub." }
  - { field: url,      type: text,     help: "The posting." }
  - { field: related,  type: tags,     from: projects, help: "Project ids." }
  - { field: deadline, type: date,     help: "The deadline, if any." }
  - { field: followup, type: text,     help: "A standing reminder." }
entries:
#  - key: my-postdoc              # required
#    title: "Postdoc position"    # required
#    sub: "University"
#    status: active               # required: not applied, active, accepted, rejected,
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
```

### tasks/tasks.yml

```yaml
title: Tasks & Service
schema:
  - { field: key,      type: text,     required: true, help: "Short name." }
  - { field: title,    type: text,     required: true, help: "What to do." }
  - { field: status,   type: select,   options: [todo, doing, done, dropped], required: true, help: "Where it stands." }
  - { field: deadline, type: date,     help: "Shows on Focus while live." }
  - { field: kind,     type: text,     help: "Review, admin, teaching." }
  - { field: note,     type: textarea, help: "Notes." }
  - { field: tags,     type: tags,     help: "Filter words." }
  - { field: followup, type: text,     help: "A standing reminder." }
entries:
#  - key: review-paper            # required
#    title: "Review a paper"      # required
#    status: todo                 # required: todo, doing, done or dropped
#    deadline: YYYY-MM-DD
#    kind: review
#    note: ""
#    tags: []
#    followup: ""
```

### registries/literature.yml

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
#  - key: faes2024blockterm       # required; the citation key
#    title: "Block-term tensor regression for ECoG"   # required
#    authors: [Axel Faes, Marc M. Van Hulle]
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

### feeds/position-leads.yml

Written by the scout. `meta.log` holds one dated line per pass.

```yaml
schema:
  - { field: title,    type: text,     help: "Position." }
  - { field: inst,     type: text,     help: "Institution." }
  - { field: country,  type: text,     help: "Country." }
  - { field: typ,      type: text,     help: "Kind of position." }
  - { field: focus,    type: textarea, help: "What it is about." }
  - { field: fit,      type: textarea, help: "How it fits; strong, moderate or reach colours the card." }
  - { field: status,   type: select,   options: [open, applied, declined], help: "Where it stands." }
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

### feeds/literature-radar.yml

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

### registries/career.yml

One record of sections, drawn by Focus's Career strategy panel.

```yaml
schema:
  - { field: title, type: text, help: "Panel title." }
  - { field: milestone, type: text, help: "One-line milestone." }
  - { field: situation, type: records, open: true, help: "Facts, one label and sentence each.", fields: [] }
  - { field: order_note, type: textarea, help: "A note over the order of work." }
  - field: order
    type: records
    help: "The order of work."
    fields:
      - { field: task, type: text, required: true, help: "What to do." }
      - { field: when, type: text, help: "When." }
      - { field: note, type: text, help: "A remark." }
  - field: hosts
    type: records
    open: true
    help: "Host candidates, best first."
    fields:
      - { field: name, type: text, required: true, help: "Name." }
      - { field: inst, type: text, help: "Institution." }
      - { field: tag, type: text, help: "Field." }
      - { field: status, type: select, from: vocab.career_host_status, help: "awaiting, warm, candidate, drafted or dropped." }
      - { field: note, type: textarea, help: "A remark." }
  - { field: host_criteria, type: tags, help: "What a host has to be." }
  - field: not_hosts
    type: records
    help: "Not hosts, with the reason."
    fields:
      - { field: who, type: text, required: true, help: "Who." }
      - { field: why, type: text, help: "Why not." }
  - field: eligibility
    type: records
    help: "The rule, the shots left, the caveat."
    fields:
      - { field: rule, type: tags, help: "Conditions." }
      - { field: shots, type: tags, help: "Calls left." }
      - { field: caveat, type: textarea, help: "What to keep in mind." }
  - field: dropped
    type: records
    help: "Dropped options, with the reason."
    fields:
      - { field: what, type: text, required: true, help: "The option." }
      - { field: why, type: text, help: "Why." }

title: Career strategy
# milestone: ""
# situation:
#   Position: "Postdoc until 2027"
# order_note: ""
# order:
#   - { task: "Apply for the fellowship", when: "2026-11", note: "" }
# hosts:
#   - { name: "A host", inst: "University", tag: "imaging", status: candidate, note: "" }
# host_criteria: ["Works on federated learning"]
# not_hosts:
#   - { who: "Someone", why: "No overlap" }
# eligibility:
#   rule: ["Within 10 years of the PhD"]
#   shots: ["2026 call"]
#   caveat: ""
# dropped:
#   - { what: "An option", why: "Why it was dropped" }
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
#     find: { folders: projects/*/*/present, tiers: [projects], types: [active] }
#     sort: folder           # folder or title
#     discover: true         # also take decks found beyond `slides`
#     slides: []             # project ids, in order

# order: []                  # slide files and groups, in the order shown
```
