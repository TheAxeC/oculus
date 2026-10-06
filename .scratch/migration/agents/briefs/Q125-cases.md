# Q125 cases ruling (Z646, the orchestrator, automode)

The builder's first run found that case 8 and item 1 give about 100,000 of HELP.md's 165,450 characters no destination: the brief named only `docs/configuration.md`, `docs/source-control.md` and `docs/apps.md`, the last absent from the base. Z636 says the detail moves to guides under `docs/`; the brief named too few of them. Ruled:

## Ruling A: the guides

Four more guides under `tools/oculus/docs/`, each owning one concern, added to the write list:

- `docs/window.md`, label "Window guide": the window, the rail, pages and the pane tree, the focus and unsaved-text rules, the palette and the status bar.
- `docs/views.md`, label "Views guide": one section per view with the detail of today's views table row and the paragraphs under the table.
- `docs/files-and-search.md`, label "Files and search guide": the Files view's operations, searching the files.
- `docs/terminals.md`, label "Terminals and commands guide": terminals, sessions as a reader drives them, and project commands.

`docs/source-control.md` also takes the Repositories row's detail and "Worktrees and the merge back". The Apps detail stays in HELP.md at this base, as item 1 says, listed for the second landing.

HELP.md keeps, for each concern, its short form and a link to the guide: one sentence per view in the views table with a link to its section of `docs/views.md`, and the key table whole.

## Ruling B: one home for each fact

A user-visible behaviour (what a control does, a refusal's words, an edge case) lives in the guide that owns it. DESIGN.md keeps the decision and its reason, and points to the guide for the behaviour. Nothing is dropped from either document because the other says it: a behaviour DESIGN.md narrates today moves to its guide when the guide does not already say it, and is dropped from DESIGN.md only once the guide says it. A fact is dropped outright only where a code head comment already says it and no reader of the guides needs it, named with its `file:line` in the paragraph table.

## Ruling C: the Help group and the Help page

The `docs:` list holds, after the five hub documents and E4g's Apps guide, the Configuration guide, the Source Control guide, the Window guide, the Views guide, the Files and search guide, the Terminals and commands guide, then Design. Chords run to h9 (the Source Control guide); the entries after it are opened from the catalogue and from HELP.md's links. The Help page's arrangement shows every guide as a tab after the hub documents; Design stays in the catalogue only. HELP.md's key table and the key sheet say `h1-h9` with the words of the brief.

## Ruling D: case 9 with the engine outside the hub

With the engine outside the hub, the docs route answers oculus's own documents 404 ("not inside the hub"), as it does on main; Q125 does not change that. Case 9's second run checks that hub documents are drawn as now, and states the 404 for DESIGN.md as unchanged.

## Ruling E: case 4

`npm run lint` and the other commands HELP.md holds move to README.md, each said once there; HELP.md keeps none of them.

The rest of the brief stands. The paragraph table of case 8 names each removed run's guide and section.
