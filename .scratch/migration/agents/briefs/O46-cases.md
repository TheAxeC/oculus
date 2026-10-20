# O46, round 0: the ruling on case 20, the write list and the premises the first run changed

Ruled by the orchestrator in automode (Z959), from the builder's first run (`agents/reviews/O46-report.md`). Where this file and the brief differ, this file holds.

## Case 20 and decision 4: a keyed list or a family in `settings:`

Decision 4 is replaced by this rule (Z959). Ruling 180's point 3 stands: a keyed list in the workspace file overrides oculus's list entry by entry.

1. A record list whose options entry names a field under `key:` (`rail` by `page`, `floats` by `view`, `latex.recipes`, `latex.tools` and `themes` by `name`, `focus.ticker_sources` by `collection`) is merged with oculus's list this way: each workspace entry replaces oculus's entry with the same key, or is added when oculus has none; the merged list holds the workspace's entries in the workspace's order, then oculus's other entries in oculus's order. An entry `{ <key field>: x, removed: true }` takes oculus's entry `x` out of the merged list and is not itself in it.
2. A map family (`nav_groups`, `editor.languages`, `boards`, `counts`, `usage_tiers`, `read_limits`, `open.program_ext` and the other families) is merged by its keys: a workspace key replaces oculus's key of the same name or is added; `x: null` takes oculus's key `x` out.
3. A record list without `key:` (`audit_ignore` among them) and every other value replace oculus's value whole.
4. Findings, each naming the workspace file and the key, oculus's value then standing for that entry: `removed` with a value other than `true`; `removed: true` on an entry whose key oculus's list does not hold; `x: null` for a key oculus's family does not hold; two entries of one list with the same key.
5. Every write that saves one of these values into `settings:` writes what the reader sees: every entry in the reader's order (the keyed lists) or every key (the families), then one `removed: true` entry or one `null` key for each of oculus's entries the reader took out. This covers the rail's drag and Hide (`src/lib/server/edit/writes/config/lists/rail.ts`, `src/lib/shell/rail/rail.ts` `railMoved` and `railHidden`), the audit mute write (`writes/config/lists/audit-mute.ts`, a list without `key:`, written whole) and the Settings list and family editors' Remove and Move (`src/lib/state/system/config/editors/draft.ts`, saved through `config-value`). Reset on such a key removes it from `settings:`.
6. The options entry's `help` for each keyed list and family says, in one sentence, how a workspace overrides and removes an entry; `docs/templates.md`'s `workspaces/<name>.yml` block shows one override and one `removed: true`, and `HELP.md`'s Settings bullets say it.

Case 20 then reads, and the builder's tests check: `settings: { arrangements: { focus: <a pane> } }` gives the workspace's Focus arrangement and oculus's for every other page; `settings: { rail: [{ page: focus, label: F }] }` replaces only the rail entry with `page: focus`, at the head of the rail; `settings: { rail: [{ page: focus, removed: true }] }` gives oculus's rail without `focus`; `settings: { counts: { x: null } }` gives oculus's `counts` without `x`; `settings: { audit_ignore: [x] }` replaces the list whole. Added cases: Hide on the `focus` rail button removes the button and the workspace file holds the rail with `{ page: focus, removed: true }`; a drag of a rail button keeps the new order after the config push; Settings' Remove on a shipped theme keeps it removed after the push; G96's case 'is marked saved once the file holds the empty family, until it is edited' holds with the family written as every oculus key set to `null`.

## The write list

"Paths this step writes" gains every file the moved-path grep names, so Verify 6 and item 12 can be met: each file listed by `grep -rln "catalogs/options.yml\|config/appearance.yml\|config/behavior.yml\|config/layout.yml\|config/present.yml\|config/sources.yml" src docs HELP.md DESIGN.md README.md` on the base (the builder counted 81 outside the brief's list), each changed only where it names a moved file or reads one, and each named in the report. This includes `src/lib/data/sources/collections.ts`, `src/lib/server/content/docs.ts`, `src/lib/server/edit/writes.ts` (`behaviorFile` and `layoutFile`: the rail write and the audit mute write go to the workspace file's `settings:` under item 3), `src/lib/server/machine/apps/read/across/stored.ts` (the findings on values stored for apps name the file the value now lives in), `src/lib/shell/rail/`, and the stylesheets under `src/lib/themes/`.

## Premises the first run changed

1. The workspace file's schema is built in `src/lib/server/root/watch/own-schemas.ts:24` from `workspaceFileShape` and is the same for every build. Item 3's `settings:` completion needs it to follow the merged config, so it moves into the build's schemas beside `engineSchemas`; `src/lib/server/root/` is already in the write list. Its five keys (`folders`, `folders[].name`, `folders[].path`, `folders[].repository_scan_depth`, `primary`) get descriptions under item 11.
2. `src/lib/data/sources/config/settings.ts` is 878 lines, so it is split by concern into files of its folder (already in the write list), every importer updated.

## The builder's other points

The first run of the 29 cases is accepted as the report gives it. The probes stay under `$TMPDIR/o46first/` and are rerun for the after values.

## Collapsible lists and families in the Settings view (Axel, 2026-10-20)

Axel's addition to O46: the whole themes list, and every other large value, can be collapsed in the Settings view. The rule:

1. Every row that draws an editor of entries (`editors/Editor.svelte`: a `list`, `multi`, `parked` or `records` control and a family, `themes`, `floats`, `latex.recipes`, `latex.tools`, `focus.ticker_sources`, `nav_groups`, `editor.languages`, `boards`, `counts` among them), the rail row's `RailEditor.svelte`, and the "Fields" list a family, rail, arrangements or workbench row shows (`Item.svelte`) has a disclosure line above it: a chevron, the row's title, and the number of entries (or fields) it holds. Pressing the line, or Enter or Space on it, folds or unfolds the editor; the line carries `aria-expanded` and the editor's id in `aria-controls`.
2. A row holding more than five entries starts folded; five or fewer start unfolded; the "Fields" list starts folded.
3. What a reader folds or unfolds is kept per row in the Settings tab's view state, which item 4 saves to `views.json`, so it holds across a reload and a second page.
4. A search whose match lies inside a folded row unfolds it while the search is in the box; clearing the search puts back the kept state.
5. A folded row keeps its Modified bar, its gear menu, its message lines and its default line; Reset on it works without unfolding.

Cases added: the `themes` row with its shipped themes starts folded, shows its count, unfolds on a press and on Enter, and folds again; a reload keeps it unfolded; a row of three entries starts unfolded; a search for a theme's name unfolds `themes` and clearing it folds it again; Reset on a folded `themes` row writes as before. Each is a test of the view or the state layer, seen failing on the unchanged tree first. The paths are already in the write list (`src/lib/views/system/workbench/`, `src/lib/state/system/config/`).

## A block surface lines up with the boxes beside it (Z960)

Axel's look at the Focus board: the Quick add box is wider than the Tasks box and the awaiting box around it. Measured on the page: all three boxes span 65 to 1118.8 px, and Quick add's surface paints 8 px past each side, because a block `Surface` paints its layer at `inset: -4px -8px` (`src/lib/ui/frame/Surface.svelte:80-88`), while a fitted one (the awaiting box) paints at `inset: 0`. 51 block Surfaces in `src/lib` do the same (`grep -rn '<Surface>' src/lib | wc -l`), Data's intro among them.

The rule:
1. Over a wallpaper, a block `Surface`'s layer is `inset: -4px 0`, inside its column, and the Surface pads its content `0 8px` (only under `body.wall`), so the words keep their margin of surface and the layer's edges line up with the cards, lanes and fitted boxes beside it. `inline` and `fitted` are unchanged. Without a wallpaper nothing changes (`display: contents`, no padding).
2. Surface's head comment says what holds: the layer lies inside the column, and over a wallpaper the content sits 8 px further in than without one.
3. Focus's Quick add (`QuickAdd.svelte:85`) and its said line (`Focus.svelte:191`) then line up with Tasks and the awaiting box with no change of their own; read them, and change them only if they do not.

Cases: on the Focus board over a wallpaper, Quick add's painted layer spans the same left and right edges as the Tasks section and the awaiting box; Data's intro and count lines span the same edges as its cards; without a wallpaper every one of those parts lays out as on the unchanged tree. `src/lib/ui/frame/Surface.svelte` and `src/lib/views/boards/focus/` join "Paths this step writes".

## A faded card shows at full strength under the pointer (Axel, 2026-10-20; Z961)

Axel's addition: off-pillar and archival things are faded by default, since they are archival; while the pointer is over one, the fade goes away.

The faded things, as on main:
- `src/lib/views/structure/pillars/LineCard.svelte:102-105`, `.dormant, .muted { opacity: 0.62 }`: an off-pillar line (`muted`, passed by `Pillars.svelte:162`) and a dormant line.
- `src/lib/views/structure/pillars/ArchivalCard.svelte:74-76`, `.muted { opacity: 0.62 }`: the archival card.
- `src/lib/views/structure/domains/DomainCard.svelte:47-49`, `.dormant { opacity: 0.62 }`.
- `src/lib/views/shared/card/feed/LeadCard.svelte:229-232`, `.expired { opacity: 0.62; filter: grayscale(0.55) }`.
- `src/lib/views/shared/graph/Nodes.svelte:106-108` and `Graph.svelte:507-510`, an archived node and its label at `opacity: 0.6`.

The rule:
1. Each of these shows at full strength (opacity 1, no grayscale) while the pointer is over it (`:hover`) or the keyboard focus is inside it (`:focus-within`; for a graph node, while it is the hovered or focused node the graph already tracks, its label with it), and fades again when the pointer leaves and the focus moves out.
2. The change is eased over a short transition (about 120 ms), and is instant under `prefers-reduced-motion: reduce`.
3. Each rule carries a comment saying what is faded and why it lifts under the pointer.
4. Disabled controls, chips and tags keep their fade: it marks a control that does nothing, not old content.

Cases: in the Pillars view, an off-pillar line card and the archival card at 0.62, and at 1 with the pointer over them and with the focus on a link inside them, back to 0.62 after; a dormant domain card the same; an expired lead without its grayscale under the pointer; an archived node of the map and its label at 1 under the pointer. Each is a test of the view seen failing on the unchanged tree first, or, where a test environment does not apply `:hover`, a test of the rule's selector together with the look at landing. `src/lib/views/structure/pillars/`, `src/lib/views/structure/domains/DomainCard.svelte`, `src/lib/views/shared/card/feed/LeadCard.svelte` and `src/lib/views/shared/graph/` join "Paths this step writes".

## Add Command... writes the repository's `.oculus/commands.yml` (Axel, 2026-10-20, open item 181; Z962)

Axel's ruling: the commands saved with Add Command... no longer live in `~/.oculus/commands.json` (`src/lib/server/machine/runs/commands/saved.ts:1-3,20-22`), which holds settings in the machine-state folder; they are written into the repository's own `.oculus/commands.yml`. The file on this machine holds 12 entries, every one for a `/private/var/folders/.../T/oculus-repo-*` folder that no longer exists.

What is on the tree: the form is opened from a repository's command bar (`src/lib/views/shared/sessions/CommandBar.svelte:86,148`), drawn by the Repo view with its root (`Repo.svelte:281`) and by a project card with the project's folder when it is a git repository (`ProjectCard.svelte:138-142,395`); the server takes the repository through `repositoryOf` (`commands/repo.ts`); `listCommands` reads the file, then the saved commands, then the found ones (`list.ts:1-5`); a chain asks for approval when any command of it was not saved through the form (`run.ts:3-6`); approvals are keyed by the SHA-256 of the chain text with the repository's path (`approvals/approvals.ts:1-4`); the `'saved'` source is named in 18 places of `src/lib` outside tests, among them `pty/sessions.ts`, `schedules/routes.ts`, `schedules/run.ts`, `tab-menu.ts`, `terminal-payloads.ts`, `model-sessions.ts` and `views/shared/sessions/commands.ts`.

The rule:
1. The repository is the one whose command bar the form was opened from; the form has no picker of its own.
2. Save adds the entry to the end of that repository's `.oculus/commands.yml` `commands:` list, editing the file's bytes in place (every comment, quote style and other entry kept); when the file is missing it is made from its template (`docs/templates.md` `commands.yml`) and the entry added. A name the file or the found commands already hold is refused, as now. The write is refused, with the reason in the form, when the file does not parse or its `commands` is not a list.
3. The form lists, under its fields, the chain the command will run (the commands it depends on first, each line with its folder when it is not the repository's); Save approves that chain text in `~/.oculus/approvals.json`, so the reader's own command runs without a question and a later change of its text, by hand or by a pull, asks again.
4. Edit and Delete are offered on every plain entry of the file (one with `run`); an edit rewrites only that entry, keeps its place when the name is unchanged and keeps any key the form does not show (`problemMatcher`); Delete removes only that entry. A typed entry (an app's task type) keeps Open File only. Schedule... stays on every command.
5. The `saved` source is removed: `saved.ts`, its reader in `list.ts`, the `'saved'` value of `CommandSource` and every place that names it, a schedule or a terminal of such a command reading as a file command. `~/.oculus/commands.json` is deleted by the orchestrator at landing; the code reads it nowhere.
6. `CommandForm.svelte`'s and `CommandBar.svelte`'s head comments, `HELP.md:424-425`, DESIGN.md's commands and approval sentences and `docs/templates.md` say what holds; every sentence naming `commands.json` or a saved command is rewritten (grep `commands.json`, `saved through the form`, `'saved'` across `src`, `HELP.md`, `DESIGN.md`, `docs/` and list each hit in the report).

Cases: on a scratch repository with no `.oculus/commands.yml`, Add Command... with `{ name: build, run: make }` makes the file from its template holding that entry, and the bar lists `build` as a file command that runs without a question; on a scratch repository whose file holds a comment and one entry, a save adds the second entry with the comment and the first entry's bytes unchanged; a saved name the file holds is refused; Edit of an entry with a `problemMatcher` key changes `run` and keeps `problemMatcher`; Delete removes only its entry; a typed entry offers Open File and no Edit; a change of the saved entry's `run` by hand asks for approval on the next press; a file that does not parse refuses the save with its reason. Each is a test of the server or the state layer, seen failing on the unchanged tree first, with `HOME` set to a scratch folder as `commands-fixture.ts:14` does. The paths `src/lib/server/machine/runs/commands/`, `src/lib/server/machine/runs/schedules/`, `src/lib/server/machine/pty/sessions.ts`, `src/lib/server/machine/approvals/`, `src/lib/shell/commands/`, `src/lib/shell/panes/strip/tab-menu.ts`, `src/lib/state/sessions/terminal/`, `src/lib/data/model/model-sessions.ts`, `src/lib/views/shared/sessions/`, `tests/server/machine/runs/commands/` and `docs/templates.md` join "Paths this step writes".
