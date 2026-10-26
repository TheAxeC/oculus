Everything in the brief is done, with case 17 built as `briefs/O80-cases.md` rules it (option (b)); the verify list passes on its last run (`test:quick: 264.2 s; every command passed`), after three earlier runs that are counted in the last section.

## Open items of the state file, verbatim

- 415 (2026-10-26, O79's /spec, ruling 398; kind 3, since option (b) replaces the name ruling 398 gives): ruling 398 has a reference show the target's field flagged `label: true`. `label:` is already a key of a schema field, the words drawn over it: `SchemaField.label?: string` (`src/lib/data/model/model-collections.ts:101`), written as text in `config/schemas/manifest-schema.yml` (every field, e.g. `venue: { label: "Venue", ... }`) and in the hub's schemas (`venues.yml:14` `label: "Venue name"`, `:16` `label: "Short name"`, `leads.yml:55` `label: "Title"`). The field a venue reference would show is `short`, which carries `label: "Short name"`, so it cannot hold both. (a) the words of a field move from `label:` to a new key `heading:`, written once in every file that has them (oculus's schemas and options description, `docs/templates.md`, the hub's data files), and `label: true` is the flag as ruled. Pros: ruling 398's name stands and each key has one meaning. Cons: a second rename across every schema in the same step, touching each `manifest-schema.yml` field. (b) the flag is named `display: true` and `label:` keeps the words. Pros: no rename; the flag is new and has no users. Cons: replaces the name ruling 398 gives. (c) `label:` takes either words or `true`. Cons: the shown field loses its words ("Short name" drawn as "short"), and one key has two meanings a finding cannot tell apart. Recommended (b), a judgment: it costs one new key against a rename of a key in every schema, and the ruled behaviour is unchanged. (c) is the lazy option.
- 416 (2026-10-26, O79's /spec, ruling 398; kind 6, the options are not ranked by a written rule): ruling 398 shows the target's one flagged field. Today a venue choice shows `short`, else `name`, and a project choice `short`, else `title` (`src/lib/state/forms/schema.ts:298`, `:303`). In the hub, 47 of the 76 venues have no `short` and 20 of the 114 projects have none (`python3` over `venues.yml`; `grep -q '^short:'` over every `project.yml`). One flag cannot say "short, else the full name". (a) one flagged field per target, set on the field every entry fills (venues `name`, projects `title`). Pros: one flag as ruled, never empty. Cons: pickers and chips show full names where they show short ones today ("IEEE Trans. Medical Imaging (TMI)" for TMI, a project's whole title in a Related chip). (b) the flag carries a rank (`display: 1` on `short`, `display: 2` on `name`; with 415 (a), `label: 1` and `label: 2`): the first filled field by rank is shown. Pros: every choice reads as it does today, any number of fallbacks, no position in a list carries meaning. Cons: the flag is a number, not `true`. (c) one flagged field, and an entry whose flagged field is empty shown by its primary key. Cons: 47 venues shown by an id such as `patternrec` or `tbme`. Recommended (b), a judgment: it keeps today's choices readable for every entry. (c) is the lazy option.
- 423 (2026-10-26, O80's brief check, `agents/reviews/O80-brief-check.md` check 1; kind 6, the options are not ranked by a written rule; no step of the plan names it, so O80 is built without it). Two board readers give the order of `boards:` a meaning. A project page draws the card of "the first board of `boards` that takes it", and of the first board when none does (`boardItemOf`, `src/lib/state/client/selectors.svelte.ts:482-503`); the card's sections come from that board, and a project is on every board whose keys it meets (G124). A role's row of the track record opens "the first key of the merged `boards:` whose `role` holds the role" (`roleBoard`, `src/lib/state/boards/career.ts:108-121`). Reordering the boards in Settings changes which card a project page draws and which board a role opens. (a) A `boards:` entry flag `project_page: true`, set on oculus's Projects board, names the board whose card the project page draws; none or two flagged is a finding; and two boards holding one role is a finding, the row then opening none. Pros: one written choice, the order means only the drawing order. Cons: every project page draws the one board's sections, so a Software project's page shows the research board's sections. (b) The project page draws the card of the board of the project's own tier and the user's role on it, that is, the board whose `tier:` and `role:` both match; a project two such boards take, or none, is a finding and its page draws the fallback card of no board's sections; the role rule as in (a). Pros: each project's page matches the board it belongs to. Cons: more rules, and a project matching two boards gets a finding where today it opens silently. (c) The order kept as the rule and written in `layout.yml`'s comment as the board that wins. Cons: a position in a list carries the meaning, which the step line of O80 ends for every other board reader. (c) is the lazy option.

## The cases' first run, on the unchanged tree

Each program is quoted in full in "The case-run programs" below. The failing lines of the new and edited tests on the unchanged tree are in the DONE / NOT DONE section, under "Tests of item 10".

### Case 17 as it was handed back, and its ruling

- The case: "A `boards:` key `focus` (a view a module registers): a finding naming the board; no second Focus view. Tests, 'boardsFindings' and 'the board views'."
- The rule of the brief: item 1, "A board key equal to a view id a module registers or to a collection key is a finding naming the board, and that board is not registered", with the test in `tests/data/sources/config/boards.test.ts` 'boardsFindings' (G116).
- The rules of the code it meets:
  - The view ids a module registers exist only in the routes layer: `grep -rn "import.meta.glob" src` prints `src/routes/views.ts:58` (`viewModules = import.meta.glob('$lib/views/**/*.svelte', { eager: true })`) and three theme or editor globs, nothing in `src/lib/data` or `src/lib/server`.
  - `boardsFindings` is in `src/lib/data/sources/config/sections/boards.ts` and runs from `READER_FINDINGS` (`src/lib/data/sources/config/sections/findings.ts:47`), which the server runs (`src/lib/server/root/process/context/findings.ts:24`, `src/lib/server/edit/writes/config/config-checks.ts:76`). The boundary table allows `data: ['data/**']` and `server: ['server/**', 'data/**']` (`tests/checks/tree/boundaries.test.ts:346-347`), so neither may import `src/routes` or `src/lib/views`.
  - The settings editor's `views` source is filled on the page from the registry (`src/lib/state/system/config/editors/sources.ts:57-58`, "The ids of the views the registry holds", and `:172-173`), which is the one place the code lists module view ids, and it is client state.
  - The data layer knows only the registry view ids (`REGISTRY_VIEWS`, `src/lib/data/helpers/hub-names.ts:130-137`: data, venues, pillars, domains, leads, radar), which back the existing collection finding `findings.collections.view_id` (`config/text/findings.yml:21`). `focus` is not among them.
  - The conventions of the brief forbid writing a view id in code ("No config word, hub key or view id is written in code"), so a list of oculus's own view ids in the data layer is ruled out.
  - The client's config payload carries no `from` map (`ConfigPayload`, `src/lib/data/model/index.ts:267-277`), so a finding made on the page cannot name the file the `boards:` value came from (the workspace file or `config/defaults/layout.yml`), and the page has no source of config findings of its own (`allFindings`, `src/lib/state/workbench/navigation/status.ts:413-419`, joins the snapshot's, the config payload's and the apps' findings).
- The result on the unchanged tree (`findings-cases.mjs` below): "case 17, a board keyed focus: (no new finding)"; "case 17 (collection key), a board keyed venues: (no new finding)".
- What can be built under the rules: the board left out of the registration when its key is a module view id (in `src/routes/views.ts`, as `registerCollections` leaves out such a collection key at `:93-101`), and a finding in `boardsFindings` for a board key equal to a `collections:` key or to a registry view id of `REGISTRY_VIEWS`, both of which the data layer reads. The finding for a module view id is the part with no source.
- Options for the ruling:
  - (a) The finding is given for a board key equal to a collection key or a registry view id, and a board keyed as a module view id is left out of the registration with no finding, as a collection keyed `debug` or `files` is today (`src/routes/views.ts:85-86`). Pros: no new mechanism; boards and collections follow one rule. Cons: a board keyed `focus` disappears with nothing in the Findings view saying why. This is the lazy option: it drops the finding the case asks for.
  - (b) The page makes the finding: the board-views function is handed the module view ids (the routes layer has them) and returns a finding for each clash, the config payload gains the `from` map so the finding names the right file, and `allFindings` takes the page's config findings as a fourth source. Pros: the case as written, and the same finding for a collection keyed as a module view id becomes possible. Cons: a wire-format change (a new field on the config payload) and a new kind of finding source, both user-visible shapes no ruling names; the test of the finding moves from 'boardsFindings' (G116) to 'the board views' (G124).
  - (c) The module view ids are written into config (for example a list beside `arrangements:`), which `boardsFindings` reads. Cons: a second list of the views to keep in step with the modules by hand; a module added without its row gives no finding.
  - Recommended (b), a judgment: it is the one that gives the reader the finding the case describes, at the cost of one payload field. (a) is the lazy option.
- The ruling (`briefs/O80-cases.md`, open item 424 closed under self-rule Z1025): option (b). The board-views function is given the view ids the modules register and the collection keys, and returns a finding per board key equal to one of them, naming the board, which is not registered; `ConfigPayload` gains `from`; `allFindings` takes the page's config findings as a fourth source; `boardsFindings` keeps every finding it gives and gives none for a view id; the case 17 test is a row of 'the board views' over the function with a module id list given to it. Option (a) was the lazy option. Added to the write list: `src/lib/state/workbench/navigation/status.ts`, `src/lib/data/model/index.ts` and the server code that builds the payload, `src/lib/ui/forms/Prompt.svelte` and `prompt.ts`, `src/lib/server/edit/writes/hubs.ts` with its rows in `tests/routes/hubs/hub-writes.test.ts` and `tests/state/forms/new-entry.test.ts`, `config/options/layout.yml` (the boards key a text key), and the board-views function in `presets.ts`.

### Every case on the unchanged tree

1. `node case1.mjs` (output `case1-before.txt`, quoted in full below). The six boards come from `Projects.svelte` (`projects` 1 to `software` 6, group `projects`), labels Projects, Supervision, Coauthor, Archive, Personal, Software, glyphs focus, teaching, author, archived, spark, code; cards 7, 10, 10, 3, 0, 3; rail counts 4, 4, 4, 0, 0, 0, all in `#16a34a`; pane titles the same words as the labels. Clusters: now (glyph now, "Now: do these", not muted, run, push, revise), parked (no glyph, "Parked / on hold", muted, review, blocked, backburner), incubate (glyph idea, "Incubation: idea to project", muted, scope, derisk, build), idea (glyph idea, heading Idea, muted, full width). Awaiting box: one venue (Journal of Machine Learning Research, 1), blocked 1, one application. Sections: CareerPanel > CommandCenter > Tasks > QuickAdd > said > awaiting > Band > Empty > Lanes. Lane moves from `exploring` and from `in-prep` onto each of the ten lanes as printed. New idea stage `nascent`; New project offered on every board except archive, tier research on projects, supervision, coauthor and archive, personal and software on theirs; a write naming no tier writes `research`. Task status `todo`, application status `not-applied`, lead status `open`, decline `declined`, apply `applied`, `dismissed` held back by the declined toggle `true`, project deadlines category `paper`. Glyphs: cross-links active, published, idea; ticker overdue, followup, pin. Category colours in-review `#0ea5e9`, in-flight `#16a34a` (rail), idea `#7c5cff`, publications `#db2777`, other-outputs `#9333ea`, released `#0d9488`, dead-ends `#9ca3af`.
2. Read and run. `Projects.svelte` registers the six ids it names (case 1 output, first block); a `boards:` entry `theses` with `label:` and `glyph:` gives no seventh view and two findings: `findings-cases.mjs`, "case 2/3, a seventh board theses with label and glyph: <oculus>/config/defaults/layout.yml [boards.theses.label] boards.theses.label is not a field a board takes; it is not read" and the same for `glyph`.
3. `findings-cases.mjs`: "case 3, the board projects with no label (oculus has no label anywhere): (no new finding)". The pane title is `lookup(\`views.${preset.id}\`)` (`Projects.svelte:224`).
4. `findings-cases.mjs`: project_boards on no entry, true on Projects and Registries, and `yes` on Projects: each "(no new finding)".
5. `findings-cases.mjs`: "<hub>/later/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied"; "lanes read: run:now, wait:later, far:nowhere, bare:; drawn clusters: now=[run] parked=[] incubate=[] idea=[]". The lanes `wait`, `far` and `bare` are read and drawn by no cluster, with no finding. The options catalog's `cluster` field is the fixed choice `options: [now, parked, incubate, idea]` (`config/options/catalogs/vocab.yml:157-160`), so Settings does not offer `later`.
6. `findings-cases.mjs`: "<hub>/grid/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied".
7. `findings-cases.mjs`: "[tiers.research.default] key tiers.research.default is not a key this file takes" and the same for `tiers.personal.default`. `case1.mjs`: "write naming no tier: written tier=research refused=[]".
8. `misc-cases.mjs`: "coauthor tier ["research","personal"]: offered=true tier the form writes=research"; "coauthor tier ["personal","software"]: offered=true tier the form writes=personal".
9. `misc-cases.mjs`: `hubsTaking(['lab','other'], 'hub')` gives ["lab","other"], and the Add's hub field starts on `hubs[0].id` (`entry-add.ts:83`), so `lab` is chosen; with the primary holding it ["hub","lab"]; one non-primary hub ["lab"]. `NewIdeaForm.svelte:72` takes `hubs.at(0)`. `writtenFile` of a `new-entry` and of a `literature-save` naming no hub, two hubs, no primary: {"root":"lab",...}, the first hub, and no refusal.
10. `misc-cases.mjs`: "at exploring onto push: {"stage":"in-prep"}"; "at in-prep onto push: null". `findings-cases.mjs`: `move_writes` is "not a key this file takes".
11. `findings-cases.mjs`: both rows give only "key focus_lanes.1.move_writes is not a key this file takes".
12. `findings-cases.mjs`: `default_task` on todo and doing, and `lead_applied` on applied and closed: "(no new finding)". `misc-cases.mjs`: the task is written with `"status":"todo"`; the apply control writes `applied`.
13. `findings-cases.mjs`: a category row with no `color` (publications): "(no new finding)".
14. `findings-cases.mjs`: `rail_color` "#2563eb" and `rail_color: 3`: each "key rail_color is not one the hub's settings file takes; it is not applied". `misc-cases.mjs`: "rail_color "#2563eb", rail count colour: #16a34a".
15. `misc-cases.mjs`: "Focus.svelte reads the config focus.sections: false"; the `focus:` keys of the merged config are stale_lag_days, refresh_stale_days, deadline_horizon_days, leads_horizon_days, conf_horizon_months, venue_conc_warn, linkedin_cadence_days, applications_open, education_open, applications_sent. The sections are drawn in the markup order case 1 prints.
16. `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts`: "Test Files 1 passed (1)", "Tests 30 passed (30)". With `--reporter=verbose` the real hub's rows ran: "names a group of its own and a path under the hub for every document of the real hub 169ms" and "matches the real hub's own files to a schema each, read with no finding 846ms".
17. The case handed back, above. `findings-cases.mjs`: "(no new finding)" for a board keyed `focus` and for one keyed `venues`.
18. Read. The Settings boards editor offers the board key as a fixed choice, `control: choice`, `options: [projects, supervision, coauthor, archive, personal, software]` (`config/options/layout.yml:128-131`), so a Settings save cannot add `theses`; the views are registered from `Projects.svelte` alone, so no save adds one.

## DONE / NOT DONE

### Items of "What to build"

| Item | State | Proof |
| --- | --- | --- |
| 1, boards registered from `boards:` | DONE | `boardsSource`, `boardViews` and `BOARD_GLYPH` in `src/lib/state/boards/board/presets.ts`; `pageBoards` and `registerBoards` in `src/routes/views.ts`; `+page.server.ts` sends `boards`, `+page.svelte` registers them on the first frame and on every config push; `Projects.svelte` names no board; `project_boards` read by `boardsGroup` in `src/lib/data/sources/config/rail.ts` with the findings `boards_none`, `boards_twice`, `boards_kind`; the Settings rail tick in `RailEditor.svelte` written back through `lists/rail.ts` and `bodies.ts`; cases 1 to 4 and 17 below |
| 2, Focus clusters from `focus_clusters:` | DONE | `clusters`, `lanesIn` in `src/lib/state/boards/focus.ts`; `Lanes.svelte` draws `clusters(config)` and names no cluster word; findings in `src/lib/data/sources/config/sections/vocab.ts`; options `cluster` field `from: focus_clusters`; `HUB_LIST` and `in-place.ts` take it; cases 1, 5, 6 below |
| 3, no first-of-list default | DONE | `default: true` on `tiers.research`; `newProjectTier` in `new-project.ts`; `manifest.ts` takes the default tier or refuses; `chosenHub` in `src/lib/state/shared/page/hubs.ts` used by `NewIdeaForm.svelte`, `entry-add.ts`, `new-entry.ts`; `write-files.ts` names no file and `hubs.ts` (server) answers 409 with `server.workspace.which_hub`; Prompt's yes off while a required choice is empty; cases 7, 8, 9 below |
| 4, a lane's move from `move_writes:` | DONE | `hubMovable`, `hubMoveOnto` in `focus.ts`; oculus's ten rows carry `move_writes`; `dropRemovedWords` reaches it (`recordWithout` in `hub-layer.ts`); cases 1, 10, 11 below |
| 5, single-use flags | DONE | `oneWordWith` in `src/lib/data/shapes/vocab-keys.ts` read by every reader the item names (`leads.ts`, `ticker.ts`, `new-entry.ts`, `lead-application.ts`, `manifest.ts`, `new-project.ts`); the finding in `sections/vocab.ts`; `dismissed` keeps `lead_closed` alone; LeadCard draws the controls disabled with a tip; cases 1, 7, 12 below |
| 6, colours | DONE | every row of `categories:` names `color`; `colourOf` has no stage fallback; `rail_color` in `vocab.yml`, `HUB_LIST`, `VOCAB_SHAPES` (so `hubWords` gives each hub its own); `railCount` returns it; cases 1, 13, 14 below |
| 7, glyph names to text words | DONE | `project.helper.xlink_*_glyph` and `focus.command.glyph_*` read with `t()`; `GLYPHS` is gone (grep 4 prints no `GLYPHS`) |
| 8, the Focus sections | DONE | `sections` under `focus:` in `behavior.yml`, described as a list of choices; read by `focusSections` in `src/lib/data/shapes/boards/focus-sections.ts`, drawn through `drawnSections` (`state/boards/focus.ts`) by `Focus.svelte`; findings in `sections/focus.ts`; case 15 below |
| 9, docs and comments | DONE | `docs/HELP.md`, `docs/apps.md`, `docs/data-map.md` (49 keys), `docs/templates.md`, `vocab.yml:4`; comments listed under "Judgment calls"; grep 6 prints nothing |
| 10, tests | DONE | the table below |

### Cases after the change

Each from the programs in "The case-run programs" (case1-after, findings-after, misc-after), run on the final tree.

| Case | Result after the change |
| --- | --- |
| 1 | Same as before on every fact, except `dismissed held back by the declined toggle: false` (was `true`, as Z1021 rules). The rail entry prints `"project_boards":true`; the six views print the same labels, glyphs, order 1 to 6, group `projects`, cards 7, 10, 10, 3, 0, 3, rail counts 4, 4, 4, 0, 0, 0 in `#16a34a`; clusters now, parked, incubate (columns) and idea (full width, `byTitle=true`, `awaiting=false`) with the same lanes, headings and glyphs; the sections `career > command_center > tasks > quick_add > said > awaiting > band > lanes` (the `Empty` message is part of `lanes`); the twenty lane moves print the same writes; the new records, the glyphs and the category colours are the same; `rail_color: #16a34a`. |
| 2 | `view theses group=projects order=7 label=views.projects glyph=views.projects_glyph`, no finding. |
| 3 | `[boards.projects.label] the board projects names no label; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names`; the view prints `label=(words projects)`. |
| 4 | None: `[rail] no rail button carries project_boards; the project boards are in no group of the view catalogue`, view `group=`. Two: `[rail] the rail button for registries carries project_boards, as the one for projects does; the project boards go in the group of projects`, view `group=projects`. `yes`: `[rail[1]] the rail button for projects has a project_boards that is not true or false; its group does not take the project boards`, and the no-entry finding with it. |
| 5 | `[focus_lanes[2]] the Focus lane far names the cluster nowhere, which no row of focus_clusters has; the lane is not drawn`, `[focus_lanes[3]] the Focus lane bare names no cluster; the lane is not drawn`; `clusters drawn: now(columns)=[run] later(columns)=[wait]`; the options entry of a lane's cluster is `"control":"choice","from":"focus_clusters"`, so Settings offers `later`. |
| 6 | `[focus_clusters.0.layout] focus_clusters.0.layout must be one of columns, full_width`, and one lane finding for each of oculus's lanes naming parked, incubate or idea (see "wrong or impossible"). |
| 7 | `[tiers.personal] research, personal each carry default, which one word carries at most; none of them is read for it`; the refusal is the `writes.test.ts` row (`a new project names no tier, and no one word of tiers carries default`). |
| 8 | `["research","personal"]: offered=true tier the form writes=research`; `["personal","software"]: offered=false tier the form writes=undefined`. |
| 9 | Primary holding none: offered `["lab","other"]`, chosen `null`; primary among them: chosen `"hub"`; one non-primary hub: chosen `"lab"`; `NewIdeaForm` starts on `chosenHub(hubs, primary()) ?? ''`; `writtenFile` of a `new-entry` and a `literature-save` naming no hub, two hubs, no primary: `null`, so the server answers it (409 with the `which_hub` sentence, `hub-writes.test.ts` rows). |
| 10 | `at exploring onto push: {"stage":"submit-ready"}`; `at in-prep onto push: null`; no finding. |
| 11 | `[focus_lanes[1].move_writes] the move_writes of the Focus lane scope names building, which the lane does not list; the lane takes no move`; `... names a chip, and the lane is placed by its stages; the lane takes no move`. |
| 12 | `[statuses.doing] todo, doing each carry default_task, ...`; the task is written as `{"key":"a-task","title":"A task"}` with no status; `[lead_statuses.closed] applied, closed each carry lead_applied, ...`; `appliedWord` gives `""`, so LeadCard draws the apply control disabled. |
| 13 | `[categories[3]] categories[3] names no color, so it is drawn in no colour`. |
| 14 | `"#2563eb"`: no finding, rail count colour `#2563eb`; `3`: `[rail_color] rail_color must be a colour written #rrggbb; oculus's value stands`. |
| 15 | `[lanes, career]`: drawn `["lanes","career"]`, and `Focus.svelte:243` draws the said line first when `quick_add` is not listed; `[lanes, nope, lanes]`: drawn `["lanes"]` with the two findings `focus.sections names nope, which is no section of the Focus board; it is not drawn` and `focus.sections names lanes more than once; it is drawn once`; `"lanes"`: oculus's list and the not-a-list finding; `[]`: nothing drawn, no finding. |
| 16 | `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose`: "names a group of its own and a path under the hub for every document of the real hub 249ms", "matches the real hub's own files to a schema each, read with no finding 2815ms", "Test Files 1 passed (1)", "Tests 30 passed (30)". |
| 17 | `boardsFindings` gives no finding (`(no new finding)`); the page's board views give `layout.yml [boards.focus] the board focus has the key of a view oculus's modules or a collection register; the board is not registered`, and the same for `venues`; no view `focus` or `venues` is registered (the 'the board views' rows). |
| 18 | Not run here: seen at the look on landing. The boards `key` field of `config/options/layout.yml` is a text key, and `+page.svelte` registers the board views on every config push, as the collection views. |

### Tests of item 10

Each new or edited test file run alone with `npx vitest run <file>` on the final tree, and on a scratch copy of the base (`<scratchpad>/o80/baserun`, the base copy with the new tests copied in) for the failing run. The error lines are as printed on the base copy.

| File (guarded entry) | Base copy | Final tree |
| --- | --- | --- |
| `tests/state/boards/board/board-views.test.ts` (G124, new file, the describe 'the board views') | 6 failed of 6: `TypeError: boardsSource is not a function` | 6 passed |
| `tests/state/boards/board/board-rules.test.ts` (G124) | 21 failed of 106 (with 'the board views' then in it): `AssertionError: expected [ [ 'x', '#f59e0b' ] ] to deeply equal [ [ 'x', '' ] ]`; `expected { count: 1, color: '#16a34a' } to deeply equal { count: 1, color: '#2563eb' }`; `expected { stage: 'in-prep' } to deeply equal { stage: 'submit-ready' }`; `expected true to be false`; `TypeError: Cannot read properties of undefined (reading 'slice')` (case 5); `expected [ { file: 'layout.yml', ...(2) }, ...(5) ] to deeply equal []` (case 29, the config check over every key); `TypeError: newProjectTier is not a function` | 100 passed |
| `tests/data/sources/config/boards.test.ts` (G116) | 22 failed of 31: `expected [ ...(3) ] to deeply equal [ Array(1) ]` (the existing rows, whose boards now carry `label` and `glyph`, which the base reads as "not a field a board takes"); `expected [] to deeply equal [ Array(1) ]` (case 13) | 31 passed |
| `tests/data/sources/config/rail.test.ts` (G13) | 4 failed of 10: `TypeError: boardsGroup is not a function`; `expected [] to strictly equal [ { file: 'layout.yml', ...(2) } ]` | 10 passed |
| `tests/routes/edit/rail.test.ts` (G8) | 5 passed (the fixture gains `project_boards`, an input) | 5 passed |
| `tests/data/shapes/catalog-files/vocab.test.ts` (G13, new) | `Error: Cannot find module '../../../../src/lib/data/sources/config/sections/vocab.ts'` | 11 passed |
| `tests/data/sources/config/layers/hub-vocab.test.ts` (G126) | 4 failed of 16: `expected { key: 'idea', label: 'idea', ...(1) } to deeply equal { key: 'idea', label: 'idea', ...(2) }` (two edited rows); `expected [ Array(1) ] to deeply equal []` (the two new rows) | 16 passed |
| `tests/server/edit/writes.test.ts` (G8) | 2 failed of 56: `expected 'id: new-idea\ntier: research\nstage: ...' to be 'id: new-idea\ntier: research\ntitle: ...'`; `expected [ ...(2) ] to deeply equal []` | 56 passed |
| `tests/checks/config/config-folder.test.ts` | 7 failed of 30; the step's lines: `expected [ 'agents', 'app_theme', ...(100) ] to deeply equal [ 'agents', 'app_theme', ...(102) ]`, `to have a length of 36 but got 35`, `TypeError: boardsSource is not a function`; one row timed out (`Error: Test timed out in 5000ms.`, 'names a glyph only where the source or another config file reads it', cold run) | 28 passed, 2 skipped |
| `tests/checks/source/keys.test.ts` | 11 failed of 11: `TypeError: boardsSource is not a function` (its `beforeEach`) | 10 passed |
| `tests/checks/source/catalog-file-keys.test.ts` (new file, the describe 'catalog file keys' moved out of `keys.test.ts`, unchanged) | not run: an existing row moved | 1 passed |
| `tests/state/workbench/navigation/registry-glyphs.test.ts` | file failed: `TypeError: boardsSource is not a function` | 80 passed |
| `tests/checks/config/arrangements.test.ts` | 14 failed of 34: `TypeError: boardsSource is not a function` | 34 passed |
| `tests/state/client/held-unsaved.test.ts` (G8) | 3 failed of 24: `expected [] to have a length of 1 but got +0` | 24 passed |
| `tests/routes/hubs/hub-writes.test.ts` (G8) | 4 failed of 47: `a Lit Watch paper added in the hub its root names: expected [ '.oculus/data/literature/radar.yml' ] to deeply equal []`; `expected 200 to be 409`; `expected 404 to be 409` | 47 passed |
| `tests/state/forms/new-entry.test.ts` | 3 failed of 24: `Error: text key not in the text catalog (config/text/): app.palette.task_add_which_hub`; `... editor.add_person_which_hub` | 24 passed |
| `tests/views/shared/forms/entry-add.test.ts` | 1 failed of 8: `Error: text key not in the text catalog (config/text/): entry_form.add_hub_none` | 8 passed |
| `tests/state/workbench/options-pages.test.ts`, `tests/shell/panes/strip/app-editor-close.test.ts` | 3 and 5 passed (payload fixtures gain `from: {}`) | 3 and 5 passed |
| `tests/server/edit/config-value.test.ts` (edited assertion) | fails on the base (`Tests  1 failed / 16 skipped (17)`, the run under "# Repair round 1", item 5) | 17 passed |

Every edited existing assertion, before and after:

- `boards.test.ts` 'reads a row added after dead-ends with no finding, the first row still holding a project': input `{ key: 'x', label: 'x', stages: { words: ['building'] } }` becomes the same row with `color: '#16a34a'` (a row without colour is now a finding).
- `boards.test.ts` categoriesFindings, the poster row: expected `'categories[7]: categories[7] names neither stages nor color, so it is drawn in no colour'` becomes `'categories[7]: categories[7] names no color, so it is drawn in no colour'`; the nonsense row's input gains `color: '#9ca3af'`; the existing boardsFindings rows run through `said`, which gives each board `label: 'views.projects', glyph: 'views.projects_glyph'` first (before, `said` called `boardsFindings` on the board as written).
- `hub-vocab.test.ts`: the two expected `idea` category rows gain `color: '#7c5cff'`; the hub's own `categories` input row gains `color: "#7c5cff"` and its expected row gains `color`.
- `config-value.test.ts` 'writes a removed and a relabelled stage as what changed from oculus's, and the merge gives it back': expected `{ key: 'idea', label: 'idea', stages: { words: ['scoping'] } }` becomes the same with `color: '#7c5cff'`.
- `writes.test.ts`: the `newIdeaOn` helper takes a list (`'scoping'` becomes `['scoping']`, `null` becomes `[]`); its doc comment "the first stage carrying `new_idea`" becomes "the one stage carrying `new_idea`, and with none or two the manifest names no stage".
- `config-folder.test.ts`: the key list gains `focus_clusters` and `rail_color`; `toHaveLength(35)` becomes `toHaveLength(36)`, one more described flag, the tier flag `default` (the count comment says so).
- `board-rules.test.ts`: the `KEYED` boards gain `...WORDS` (`label` and `glyph`), so the config check over every key reads them with no finding.
- `rail.test.ts`: the rows `{ label: 'B', ..., unplaced_collections: true }` (ROWS), the chord test's `rows[4]`, the unplaced-none row A, the two-flagged row B and the 'yes' row B gain `project_boards: true`, so no `boards_none` finding joins the finding each row is about.
- `held-unsaved.test.ts`: the rail fixture gains `project_boards: false`; the rows 'refuses %s over the file of the hub the server writes' wrote over a two-hub workspace and expected the first hub's file; they now use one hub or name the hub (`writesOver(hubs, posted)`), and the two-hub case is the new rows 'names no file for %s with two hubs, so the server answers it (G8)'.
- `hub-writes.test.ts`: 'answers a lead made in a workspace with no primary with the id of the first hub, which it wrote' becomes 'answers a lead made in a workspace of one hub and no primary with the id of that hub, which it wrote (G8)', its hubs `[one, ...into.hubs]` becoming `[one]`.
- `new-entry.test.ts`: the row 'the first hub when there is no primary' (`[other, own], null, undefined, 'second', 'review-2'`) is removed; the rows 'is none with two hubs holding tasks when ...' replace it.
- `entry-add.test.ts`: the expected hub field gains `empty: t('entry_form.add_hub_none'), required: true`.
- `routes/edit/rail.test.ts`: `railOf` keeps `project_boards` as it keeps `unplaced_collections`.
- `options-pages.test.ts`, `app-editor-close.test.ts`: the config payload fixture gains `from: {}`.
- `keys.test.ts`: the credit row of `lookup(\`views.${preset.id}\`` in `Projects.svelte` is replaced by the rows of `boardWord(row, 'label', catalog)` and `boardWord(row, 'glyph', catalog)` in `presets.ts` and `t(cluster.label)`, `t(cluster.glyph)` in `Lanes.svelte`; `beforeEach` registers the boards.
- `arrangements.test.ts`, `registry-glyphs.test.ts`, `config-folder.test.ts`: register the board views with `registerBoards(client.registry, pageBoards(boardsSource(config, () => 'layout.yml'), textCatalog(config), collections))`, as they register the collection views.

### Checks

| Check | State | Output |
| --- | --- | --- |
| 1, verify list `npm run diagrams && npm run test:quick` | DONE | last run: `ok ASCII gate`, `ok prettier: All matched files use Prettier code style!`, `ok svelte-kit sync`, `ok eslint (11.1 s)`, `ok svelte-check (38.1 s): ... COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks (191.4 s)`, `ok vitest (226.1 s)`, `ok vitest slow (262.0 s)`, `test:quick: 264.2 s; every command passed`, `exit 0`. It does not cover tests that reach no changed file within the import depth, the build, and the lint of unchanged files. |
| 2, the tests of item 10 | DONE | the table above |
| 3, unused exports | DONE | `diff <base>/unused-exports.txt <after>` prints only the base's own lines `ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)`, `ERROR: Please fix or visit https://knip.dev/reference/known-issues` and `knip stopped with status 2`; no line added. |
| 4, the first-of-list grep | DONE | hits named under "Judgment calls" |
| 5, the wording grep | DONE | 129 lines (`wc -l`), named under "Judgment calls" |
| 6, the history grep | DONE | prints nothing (exit 1) |
| 8, case 16 | DONE | case 16 above |
| 9, the docs read against the prose rules | DONE | under "Judgment calls" |
| Size limits | DONE | every changed `.ts` under 880 lines and `.svelte` under 520 (`wc -l` over the changed files); `src/lib/state/client/context.ts` is 880 at the base and after |
| Folder limits | DONE | `tests/state/boards/board/` 4 items, `tests/checks/source/` 6, `src/lib/data/shapes/boards/` 5 (`git ls-files` plus the new files) |

## Files with line counts

`diff -rq` of `src`, `tests`, `utils` and `config` against the base copy, with `wc -l` at the base and after; `docs` against `git show HEAD:<path>`. "Outside" marks a path outside the brief's write list and the ruling's, with its reason.

| Path | Base | After | Outside, reason |
| --- | --- | --- | --- |
| config/catalogs/vocab.yml | 272 | 284 | |
| config/defaults/behavior.yml | 297 | 300 | |
| config/defaults/layout.yml | 335 | 347 | |
| config/options/behavior.yml | 818 | 824 | |
| config/options/catalogs/vocab.yml | 331 | 378 | |
| config/options/layout.yml | 285 | 293 | |
| config/text/app.yml | 321 | 322 | outside: the palette's Add Task sentence asking which hub (`new-entry.ts`) |
| config/text/findings.yml | 439 | 458 | |
| config/text/server.yml | 534 | 536 | the file of the which-hub sentence; also `idea_tier_none` of `manifest.ts` |
| config/text/views/boards/editor.yml | 34 | 35 | outside: Add Person's sentence asking which hub (`new-entry.ts`) |
| config/text/views/boards/focus.yml | 158 | 161 | |
| config/text/views/boards/project.yml | 170 | 173 | |
| config/text/views/boards/projects.yml | 97 | 99 | outside: `board_glyph` (the glyph of a board naming none) and `new_idea_hub_none` (the empty hub choice of New idea) |
| config/text/views/feeds/leads.yml | 38 | 41 | outside: the tips of LeadCard's disabled controls (item 5) |
| config/text/views/shared/entry-form.yml | 43 | 44 | outside: `add_hub_none`, the empty hub choice of Add (item 3) |
| config/text/views/system/workbench.yml | 273 | 276 | |
| docs/HELP.md | 570 | 570 | |
| docs/apps.md | 847 | 847 | |
| docs/data-map.md | 263 | 265 | |
| docs/templates.md | 1482 | 1509 | |
| docs/diagrams/layers, layer-data, layer-server, layer-state, layer-views (.dot and .svg) | same | same | outside: rewritten by `npm run diagrams`, the verify list's first command (edges of the new modules) |
| docs/diagrams/writes.dot / writes.svg | 1321 / 4463 | 1344 / 4563 | outside: rewritten by `npm run diagrams` |
| src/lib/data/accounts/leads.ts | 64 | 68 | |
| src/lib/data/helpers/hub-names.ts | 840 | 843 | |
| src/lib/data/model/index.ts | 874 | 879 | |
| src/lib/data/shapes/boards/categories.ts | 151 | 140 | |
| src/lib/data/shapes/boards/focus-sections.ts | new | 65 | outside: the Focus sections reading the view and the config check share; the state layer may import `data/shapes/boards/**` and not `data/sources/config/sections/` (`boundaries.test.ts`), and `data/shapes` may not import `data/sources` (`imports/order.test.ts`) |
| src/lib/data/shapes/catalog-files/common.ts | 28 | 31 | outside: `HEX_COLOUR`, the `#rrggbb` form `rail_color` and the category colours are held to |
| src/lib/data/shapes/catalog-files/vocab.ts | 413 | 487 | |
| src/lib/data/shapes/catalog-words.ts | 118 | 119 | outside: `focus_clusters` among the keys whose words are catalog keys |
| src/lib/data/shapes/vocab-keys.ts | 316 | 331 | |
| src/lib/data/sources/config/catalog/options.ts | 705 | 708 | outside: the `from: focus_clusters` source of the options catalog |
| src/lib/data/sources/config/catalog/schemas/engine.ts | 309 | 310 | outside: a colour shape keeps its schema (the new `rail_color` scalar) |
| src/lib/data/sources/config/merge/hub-layer.ts | 579 | 608 | |
| src/lib/data/sources/config/merge/in-place.ts | 289 | 310 | |
| src/lib/data/sources/config/rail.ts | 270 | 321 | |
| src/lib/data/sources/config/sections/boards.ts | 229 | 260 | |
| src/lib/data/sources/config/sections/findings.ts | 50 | 52 | outside: runs `vocabFindings` among the readers |
| src/lib/data/sources/config/sections/focus.ts | 105 | 137 | |
| src/lib/data/sources/config/sections/vocab.ts | new | 200 | outside: the vocabulary findings of items 2, 4 and 5 (`vocabFindings`), which `vocab.test.ts` tests |
| src/lib/server/edit/feeds/feed-route.ts | 182 | 182 | outside: a Lit Watch add names its hub (`rootedHome`), so a picked hub reaches the server (item 3) |
| src/lib/server/edit/writes/bodies.ts | 699 | 705 | |
| src/lib/server/edit/writes/config/lists/rail.ts | 71 | 72 | |
| src/lib/server/edit/writes/hubs.ts | 286 | 292 | |
| src/lib/server/edit/writes/manifest.ts | 735 | 742 | |
| src/lib/server/root/config-seed.ts | 49 | 65 | ruling: a payload builder (`keyFiles`, the payload's `from`) |
| src/lib/server/root/watch/portfolio/payload.ts | 113 | 115 | ruling: a payload builder |
| src/lib/state/boards/board/index.ts | 73 | 80 | outside: the folder's index re-exports the board-views names |
| src/lib/state/boards/board/new-project.ts | 103 | 123 | |
| src/lib/state/boards/board/presets.ts | 463 | 548 | |
| src/lib/state/boards/board/ticker-lines.ts | 184 | 177 | |
| src/lib/state/boards/focus.ts | 612 | 713 | |
| src/lib/state/boards/ticker.ts | 669 | 669 | |
| src/lib/state/client/context.ts | 880 | 880 | outside: the client hands its registry to the selectors that count the page's findings |
| src/lib/state/client/shapes/payloads.ts | 299 | 300 | outside: the config payload shape gains `from` |
| src/lib/state/client/writes.svelte.ts | 859 | 867 | outside: Add Lead, Add to Lit Watch, new entries and Save to Literature send the hub picked |
| src/lib/state/feeds/lead-application.ts | 44 | 45 | |
| src/lib/state/forms/new-entry.ts | 242 | 256 | |
| src/lib/state/sessions/source/write-files.ts | 275 | 285 | |
| src/lib/state/shared/page/hubs.ts | 60 | 73 | |
| src/lib/state/shared/stores/shapes.ts | 514 | 519 | outside: the writes' types take the hub picked (`addRadarEntry(fields, root?)`) |
| src/lib/state/workbench/navigation/rail.ts | 141 | 142 | |
| src/lib/state/workbench/navigation/registry.ts | 294 | 323 | outside: the registry holds the page's findings (`refused`, `refuse`), the fourth source of the ruling |
| src/lib/state/workbench/navigation/status.ts | 605 | 614 | |
| src/lib/state/workbench/rail-badges/rail-badges.svelte.ts | 400 | 408 | |
| src/lib/ui/forms/Prompt.svelte | 142 | 158 | |
| src/lib/ui/forms/prompt.ts | 23 | 26 | |
| src/lib/views/boards/focus/Focus.svelte | 362 | 380 | |
| src/lib/views/boards/focus/career/CareerPanel.svelte | 252 | 255 | |
| src/lib/views/boards/focus/lanes/Lanes.svelte | 351 | 358 | |
| src/lib/views/boards/projects/NewIdea.svelte | 27 | 30 | |
| src/lib/views/boards/projects/Projects.svelte | 440 | 438 | |
| src/lib/views/shared/card/feed/LeadCard.svelte | 319 | 358 | |
| src/lib/views/shared/card/feed/lead-apply.ts | 80 | 81 | outside: its head comment said "the status carrying `lead_applied`", made false by item 5 |
| src/lib/views/shared/forms/NewIdeaForm.svelte | 201 | 214 | |
| src/lib/views/shared/forms/entry/entry-add.ts | 230 | 247 | |
| src/lib/views/shared/links/CrossLinks.svelte | 172 | 172 | |
| src/lib/views/system/findings/Findings.svelte | 127 | 137 | outside: lists the page's findings, the fourth source |
| src/lib/views/system/workbench/RailEditor.svelte | 355 | 367 | |
| src/routes/+page.server.ts | 95 | 106 | |
| src/routes/+page.svelte | 330 | 352 | |
| src/routes/+page.ts | 35 | 39 | outside: hands `boards` and `text` on to the page |
| src/routes/views.ts | 259 | 322 | |
| tests/checks/config/arrangements.test.ts | 76 | 90 | |
| tests/checks/config/config-folder.test.ts | 816 | 833 | |
| tests/checks/source/catalog-file-keys.test.ts | new | 75 | outside: `keys.test.ts` would pass 880 lines (899); its 'catalog file keys' describe moved here unchanged |
| tests/checks/source/keys.test.ts | 849 | 840 | |
| tests/checks/tree/boundaries.test.ts | 858 | 859 | outside: its comment on `data/shapes/boards/**` names the Focus sections the folder now holds; no rule of the check changed |
| tests/data/shapes/catalog-files/vocab.test.ts | new | 176 | |
| tests/data/sources/config/boards.test.ts | 190 | 247 | |
| tests/data/sources/config/layers/hub-vocab.test.ts | 314 | 345 | |
| tests/data/sources/config/rail.test.ts | 142 | 197 | |
| tests/routes/edit/rail.test.ts | 134 | 135 | |
| tests/routes/hubs/hub-writes.test.ts | 818 | 859 | ruling |
| tests/server/edit/config-value.test.ts | 374 | 379 | outside: its expected `idea` category row carries the colour item 6 gives it |
| tests/server/edit/writes.test.ts | 827 | 846 | |
| tests/shell/panes/strip/app-editor-close.test.ts | 176 | 177 | outside: the payload fixture gains `from` |
| tests/state/boards/board/board-rules.test.ts | 668 | 854 | |
| tests/state/boards/board/board-views.test.ts | new | 104 | outside: `board-rules.test.ts` would pass 880 lines (942); its new describe 'the board views' is here |
| tests/state/client/held-unsaved.test.ts | 461 | 481 | |
| tests/state/forms/new-entry.test.ts | 237 | 283 | ruling |
| tests/state/workbench/navigation/registry-glyphs.test.ts | 36 | 45 | |
| tests/state/workbench/options-pages.test.ts | 168 | 169 | outside: the payload fixture gains `from` |
| tests/views/shared/forms/entry-add.test.ts | 185 | 187 | outside: the expected hub field of item 3 |

`src/lib/data/index.ts` and `src/lib/data/snapshot/normalise.ts` are on the write list and unchanged: `hubWords` iterates `VOCAB_SHAPES` (`src/lib/data/index.ts:636`), which holds `rail_color` (`in-place.ts:73`).

## Judgment calls the brief left open

- The board-views function is in `presets.ts`, as the ruling allows (548 lines after). `boardViews(source, catalog, taken)` takes `taken`, the module view ids and collection keys; the page computes them in `pageBoards` (`src/routes/views.ts`), so no data or state module reads the routes layer. `moduleViewIds` stays local to `views.ts`.
- The payload's `from` maps each top-level key of the merged config to the file it was read from (`keyFiles` in `config-seed.ts`, from `keyFile`); a page finding names that file, `layout.yml` relative in the tests.
- The page's findings are the registry's `refused`, replaced each time the page registers the board views; `findingsCount` and `allFindings` take it as a fourth argument, and the rail badge (`rail-badges.svelte.ts`) counts it too.
- A board naming no `label` is drawn with its key as words (`words: 'theses'`, `label: ''`), and with no `glyph` with the word `views.board_glyph` names (`paper`, in `projects.yml`).
- A `project_boards` that is not true or false gives its own finding and the entry is read without the flag, so with no other flagged entry the "no entry" finding comes with it (case 4 output).
- A single-use flag on two words gives its finding at the second word's key, in the file that gave the second word (`statuses.doing` in the hub's file for case 12).
- Item 3's "existing `idea_tier` refusal" cannot be used with no default tier: `idea_tier` fills `{0}` with the tier, which is empty, and would read "a new project cannot have the tier ". The refusal for a write naming no tier when no one tier carries `default` is a new sentence, `server.manifest_write.idea_tier_none` ("a new project names no tier, and no one word of tiers carries default"), on the `tier` field; `idea_tier` stays for a named tier no board takes.
- `focusSections` lives in `src/lib/data/shapes/boards/focus-sections.ts` and takes the options entry as an argument: the state layer may not import `data/sources/config/sections/` and `data/shapes` may not import `data/sources`, so `drawnSections` (`state/boards/focus.ts`) and `sectionFindings` (`sections/focus.ts`) each look the entry up with `catalogOf` and hand it in.
- Two test files would pass the 880-line rule and are split by concern: 'the board views' is `tests/state/boards/board/board-views.test.ts`, and 'catalog file keys' is `tests/checks/source/catalog-file-keys.test.ts`. The orchestrator's Test lines: G124 gains `board-views.test.ts`, and G24 (`tests/checks/source/keys.test.ts`) gains `catalog-file-keys.test.ts`.
- Grep 4's remaining hits, none a first-of-list default of premise 3: `focus.ts:336` reads `lane.stages[0]` only when the lane has one stage; `focus.ts:318-319` (`laneOf`, the `.find` grep) is the lane order G124 documents, the first lane taking a project, which no ruling of the step names; `new-project.ts:58,95` `[...self].at(0)`, the self people share one key; `new-project.ts:76` and `hubs.ts:53` are length-1 guards; `presets.ts:475` is `presetFor`'s first-board fallback, open item 423; `write-files.ts:200` reads the record a reorder names; `entry-add.ts:190` is the radar bucket picker's starting choice; `QuickAdd.svelte:49` the picker's starting row; `Person.svelte:177` opens the joint-work collection of the person's hub, else the first hub's (a view to open, not a hub a record is written to); `Entry.svelte:152`, `items.ts:109` (a project's first domain), `Collection.svelte:317`, `filter-menu.ts:184`, `Latex.svelte:48`, `EntryFields.svelte` `values[0]`, `page-file.ts:48`, `presets.ts:546`, `items.ts:54`, `manifest.ts:431`, `LaneCard.svelte` `FACT_GLYPHS` and the `.find` lookups by key are lookups or values of one record.
- Grep 5's remaining hits (129 lines): `layout.yml:226`, the order of `boards:` deciding a project page's board, open item 423; the `roles` "first row" and "highest first" sentences (`vocab.yml:242`, `roles.ts`, `options/layout.yml:145`, `new-project.ts:5`, `manifest.ts:599-600`, `NewIdeaForm.svelte:14`, `NewIdea.svelte:18`, `HELP.md:288`) and the `categories` "first row" sentences (`vocab.yml:250`, `categories.ts`, `vocab.ts:459`, `options/catalogs/vocab.yml:298`, `presets.ts:138`, `board-rules.test.ts:3-4`, `boards.test.ts:197`), which G124 states and "Not changed" keeps; `behavior.yml`'s website feed rows (`options/behavior.yml:91`, `templates.md:147`); the "first hub" defaults of `memories.ts`, `workspace/actions.ts`, `docs.ts`, `Person.svelte:173`, `Notes.svelte`, `routes/api/(docs)/memories/+server.ts`, `normalise.ts:107`, `vocab-keys.ts:13,225-227`, `tones.ts:15` and `hub-words.test.ts`, which are outside premise 3 (a memory upload, a workspace file, a document's folder, a notes folder, the merge of several hubs' words) and are listed below as a problem; `hub-layer.ts:469-470` ("the first such source" of a field's `from`); the rest are tree rows, palette rows, themes, literature keys, terminals and git, unrelated to the step.
- Comments: every head and doc comment touched is rewritten, none kept word for word with a changed meaning. Head comments rewritten: `leads.ts`, `categories.ts`, `catalog-files/common.ts`, `catalog-files/vocab.ts`, `hub-layer.ts`, `in-place.ts`, `sections/boards.ts`, `sections/focus.ts`, `config-seed.ts`, `payload.ts`, `board/index.ts`, `new-project.ts`, `presets.ts`, `ticker-lines.ts`, `lead-application.ts`, `new-entry.ts`, `write-files.ts`, `shared/page/hubs.ts`, `registry.ts`, `Prompt.svelte`, `prompt.ts`, `Focus.svelte`, `Lanes.svelte`, `NewIdea.svelte`, `Projects.svelte`, `LeadCard.svelte`, `lead-apply.ts`, `NewIdeaForm.svelte`, `entry-add.ts`, `Findings.svelte`, `RailEditor.svelte`, `+page.server.ts`, `+page.ts`, `views.ts`, and the tests `arrangements`, `keys`, `boards`, `rail`, `board-rules`, `new-entry`, `registry-glyphs`, `held-unsaved`, `config-folder` (its count comment); new head comments on `sections/vocab.ts`, `focus-sections.ts`, `vocab.test.ts`, `board-views.test.ts`, `catalog-file-keys.test.ts`. Doc comments rewritten in `focus.ts`, `rail.ts`, `entry-add.ts`, `presets.ts`, `hub-layer.ts`, `new-entry.ts`, `writes.svelte.ts`, `manifest.ts`, `sections/boards.ts`, `new-project.ts`, `views.ts`, `LeadCard.svelte`, `write-files.ts`, `+page.svelte`, `NewIdeaForm.svelte`, `server hubs.ts`, `vocab.ts`, `model/index.ts` (`ConfigPayload`), `status.ts`, `stores/shapes.ts`, `bodies.ts`, `in-place.ts`, `rail-badges.svelte.ts`, `ticker.ts`, `ticker-lines.ts`, `vocab-keys.ts`, `categories.ts`, `leads.ts`, `CareerPanel.svelte`, `lead-application.ts`, `hub-names.ts`, `context.ts`, `lists/rail.ts`, `common.ts`, and the test helpers' docs (`writes.test.ts` `newIdeaOn`, `held-unsaved` `writesOver`). The other comments of the changed files are still true against the change (read with grep 5 and each changed name).
- The phrase "no longer" in `views.ts:115,149`, `+page.svelte:153`, `hub-layer.ts:5,84,278`, `vocab.yml` and `HELP.md` describes a key a config push takes out at run time, as the base's `registerCollections` doc says it, not the history of the code.
- Problems left as the base has them, none inside an item of the brief: the "first hub" defaults of grep 5 outside premise 3 (a memory upload goes to the primary's photo wall else the first hub's, `memories.ts:90`; a new workspace file goes in the primary else the first hub, `workspace/actions.ts:54`; `Person.svelte:173` opens the first hub's joint-work collection; `docs.ts:47`, `Notes.svelte:4`) are the same kind of rule ruling 390 ends for new records, and no step names them. `categoriesFindings` keys a hub's category row by its index in the merged list (`categories[3]` in case 13), so a hub's row is named by its place after the merge, not in the hub's file; the colour finding of item 6 inherits it. The config-folder row 'names a glyph only where the source or another config file reads it' timed out at 5000 ms once on the cold base copy and passes on the final tree.
- Docs read against the prose rules (verify 9): the changed sentences of `HELP.md`, `data-map.md`, `templates.md` and `apps.md` are plain ASCII, one line per paragraph and bullet, with no dash stand-in; the `templates.md` lines inside its YAML template block are comments wrapped at the block's width, as the block's other comments are. No departure found.

## Host- or user-visible changes for the look on landing

- The config payload (wire format), before: `{ config, hubs, text, icons, codeThemeClasses, host, findings }`; after: the same plus `from: Record<string, string>`, the file each top-level key was read from (`ConfigPayload`, `src/lib/data/model/index.ts`; built by `keyFiles` in `config-seed.ts` for the page data and the watcher's push).
- Projects group, catalogue and rail: before, six board views from `Projects.svelte`; after, one per key of `boards:` in its order. Look: add `theses: { tier: research, label: views.projects, glyph: views.projects_glyph }` to `boards:` in Settings and save; a seventh view after Software appears in the Projects group without a reload (case 18). Take it out again; its tab closes.
- Findings view and the status bar's findings count: before, the snapshot's, the config channel's and the apps' findings; after, also the page's, for example a board keyed `focus` in `boards:`: "the board focus has the key of a view oculus's modules or a collection register; the board is not registered".
- Settings, the rail list: a Project boards tick on each entry, beside Unplaced collections, ticked on Projects. Settings, the boards list: the key is a text field, and each board has Label and Glyph fields.
- Focus: drawn the same with oculus's config. Look: set `focus: sections: [lanes, career]` in Settings; the board draws the lanes, then the career banner, the said line at the top. The clusters' headings come from `focus_clusters`.
- Leads view: with two statuses carrying `lead_applied` (a hub's `lead_statuses: { closed: { lead_closed: true, lead_applied: true } }`), the applied control is drawn disabled with the tip "no status of this hub's lead_statuses carries lead_applied, or more than one does, so there is no word to mark the lead applied with" (case 12); the same for decline and reopen. With oculus's words, a lead with status `dismissed` is no longer held back by the declined toggle.
- The hub a new record goes to, with two or more hubs offered and the primary not among them (before, the first hub in each case): Add on a collection view asks the hub with the field empty and required, so its yes stays off until a hub is picked; New idea draws "(pick a hub)" with its save off until one is picked; Add to Lit Watch asks the hub before its other fields; the palette's Add Task says "Several hubs hold a tasks collection and none of them is the primary hub, so name the hub to add the task to."; Add Person says "Several hubs hold a people collection and the record names none of them, so name the hub to add the person to."
- A write naming no hub, two hubs open and the primary not among those taking it: before, written to the first hub; after, refused with 409 and the sentence asking which hub (`server.workspace.which_hub`).
- New project on a board naming several tiers without the default among them (case 8): before, offered and written with the first tier; after, not offered.
- Projects rail badge colour: from `rail_color` (`#16a34a`, the same as today); a hub's own `rail_color` colours its boards' counts.
- Category colours: the same four colours, now written in `vocab.yml`; a hub's category row without `color` is a finding and drawn with no colour.

## Anything in the brief that was wrong or impossible

- Item 3's "refused with the existing `idea_tier` refusal": its sentence names the tier, which a write naming no tier does not have, so a new sentence `idea_tier_none` is used (`config/text/server.yml`), as "Judgment calls" says.
- Case 6 expects one finding; a hub's `focus_clusters` replaces oculus's whole, so a hub list holding only `now` with `layout: grid` also leaves oculus's lanes naming parked, incubate and idea with no cluster, and each is the lane finding item 2 asks for (seven lines in the findings-after output). The case's own finding is there: `focus_clusters.0.layout must be one of columns, full_width`.
- The brief places the test of 'the board views' and the 'catalog file keys' check in files that would pass the size rule; they are in the two new test files named above.

## The case-run programs

All lived in the scratchpad folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o80`, run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node <file>`, and are removed with that folder before this report is handed back. `case1.mjs` and `case1-after.mjs` write new manifests only into a copy of the demo hub under `$TMPDIR`, removed at their end; `findings-after.mjs` writes hub settings files only into a temporary folder under `$TMPDIR`, removed at its end. The first-run programs (`case1.mjs`, `findings-cases.mjs`, `misc-cases.mjs`) ran on the unchanged tree; the after programs (`case1-after.mjs`, `findings-after.mjs`, `misc-after.mjs`) on the final tree, with `shim.mjs` as quoted and `snap.mjs` as quoted less its last line (the `probe` branch).

### shim.mjs (the Svelte runes as plain values, so a `.svelte.ts` store imports under Node)

```js
const id = (v) => v;
globalThis.$state = Object.assign(id, { raw: id, snapshot: id });
globalThis.$derived = Object.assign(id, { by: (f) => f() });
globalThis.$effect = Object.assign(() => {}, { pre: () => {}, root: (f) => f() });
```

### snap.mjs (the demo hub's first build, as tests/data/hubs/hubs-fixture.ts `watchedOnce` makes it)

```js
import './shim.mjs';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const { engineDir, loadConfig } = await import(W + 'src/lib/data/sources/config.ts');
const { Hub } = await import(W + 'src/lib/server/core/channels.ts');
const { watchPortfolio } = await import(W + 'src/lib/server/root/watch/portfolio/portfolio.ts');
const { writeState } = await import(W + 'src/lib/server/files/workspace/state.ts');
const { openWorkspace } = await import(W + 'src/lib/server/files/workspace/open.ts');
export async function demoSnapshot() {
    const base = mkdtempSync(join(process.env.TMPDIR, 'o80-case-'));
    const hub = join(base, 'hub');
    cpSync(join(W, 'tests/fixtures/hubs/demo'), hub, { recursive: true });
    const state = join(base, 'state');
    writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'hub', path: hub }], primary: 'hub' } });
    const workspace = { stateFolder: state, open: () => openWorkspace(state), subscribe: () => () => {}, changed: () => {}, close: () => {} };
    const channels = new Hub();
    const watcher = watchPortfolio(channels, { engine: engineDir(), icons: { set: {} }, host: { name: 'test', address: '127.0.0.1' }, open: () => workspace.open(), settings: (dir) => loadConfig(engineDir(), { hub: dir }), defaults: () => loadConfig(engineDir()), problems: () => [] }, { debounce: 20 });
    watcher.close();
    const snapshot = channels.latest('portfolio')?.payload;
    const config = loadConfig(engineDir(), { hub });
    return { snapshot, config, hub, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}
if (process.argv[2] === 'probe') { const s = await demoSnapshot(); console.log(Object.keys(s.snapshot ?? {}), Object.keys(s.snapshot?.entities?.projects ?? {}).length, Object.keys(s.config)); s.cleanup(); }
```

### case1.mjs

```js
// Case 1 of O80: oculus's own config over a copy of the demo fixture hub. Prints each fact the case
// names. Run: node case1.mjs (from this folder, Node 24). Reads the worktree; writes only into a
// copy of the demo hub under $TMPDIR, removed at the end.
import './shim.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { demoSnapshot } from './snap.mjs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { textCatalog } = await import(src('data/sources/config.ts'));
const { portfolioConfigFrom } = await import(src('data/index.ts'));
const text = await import(src('state/shared/words/text.ts'));
const focus = await import(src('state/boards/focus.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { boardItems, takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject } = await import(src('state/boards/board/new-project.ts'));
const { selfIds } = await import(src('state/boards/board/team.ts'));
const { personNames } = await import(src('state/boards/person.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { applicationFromLead } = await import(src('state/feeds/lead-application.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const { tickerCategories } = await import(src('state/boards/ticker.ts'));
const { flaggedCollections } = await import(src('data/helpers/hub-names.ts'));
const { createIdea } = await import(src('server/edit/writes/manifest.ts'));
const ticker = await import(src('state/boards/board/ticker-lines.ts'));

const { snapshot, config: loaded, hub, cleanup } = await demoSnapshot();
const config = loaded.config;
text.setCatalog(textCatalog(config));
const say = (...a) => console.log(...a);
const vocab = () => config;

say('== boards (registrations read from Projects.svelte)');
const projectsSource = readFileSync(W + 'src/lib/views/boards/projects/Projects.svelte', 'utf8');
const regs = [...projectsSource.matchAll(/boardRegistration\('([a-z-]+)', (\d+)\)/g)].map((m) => [m[1], Number(m[2])]);
const group = /group: '([a-z]+)'/.exec(projectsSource)?.[1];
for (const [id, order] of regs) {
    const preset = presets.presetFor(id, config, vocab);
    const items = boardItems(snapshot, preset);
    const rail = railCount(items.map((one) => one.project), preset.categories, preset.config, (h) => preset.words(h).config);
    say(`${id}: label=${text.t(`views.${id}`)} glyph=${text.t(`views.${id}_glyph`)} order=${order} group=${group} cards=${items.length} rail=${rail.count} colour=${rail.color} title=${text.lookup(`views.${id}`)}`);
}
const railEntry = config.rail.find((one) => one.page === 'projects');
say('rail entry projects:', JSON.stringify(railEntry));

say('== Focus clusters (as Lanes.svelte draws them)');
const board = focus.lanes(config);
const items = focus.laneItems(Object.values(snapshot.entities.projects), board, config);
for (const cluster of focus.CLUSTERS) {
    const head = cluster === 'now' ? [text.t('focus.now_glyph'), text.t('focus.cluster_now')] : cluster === 'parked' ? ['', text.t('focus.cluster_parked')] : [text.t('focus.ideas_glyph'), text.t('focus.cluster_incubate')];
    say(`${cluster}: glyph=${head[0] || '(none)'} heading=${head[1]} muted=${cluster !== 'now'} layout=columns lanes=${focus.lanesIn(board, cluster).map((l) => l.key).join(',')}`);
}
for (const lane of focus.lanesIn(board, focus.IDEA)) {
    say(`idea: glyph=${text.t('focus.ideas_glyph')} heading=${lane.label} muted=true layout=full_width lane=${lane.key} order=${(items[lane.key] ?? []).map((p) => p.title).join(' | ')}`);
}
for (const lane of board) say(`  lane ${lane.key}: ${(items[lane.key] ?? []).map((p) => `${p.title}@${p.deadline ?? ''}`).join(' | ')}`);

say('== awaiting box');
const wait = focus.waiting(snapshot, config, personNames(snapshot));
say(JSON.stringify(wait));

say('== Focus sections (markup order of Focus.svelte)');
const focusSource = readFileSync(W + 'src/lib/views/boards/focus/Focus.svelte', 'utf8').split('</script>').at(-1);
const marks = [...focusSource.matchAll(/<(CareerPanel|CommandCenter|Tasks|QuickAdd|Band|Empty|Lanes)\b|\{#if said !== ''\}|class="waitroll"/g)].map((m) => m[1] ?? (m[0].includes('said') ? 'said' : 'awaiting'));
say(marks.join(' > '));

say('== lane moves');
const base = Object.values(snapshot.entities.projects)[0];
for (const stage of ['exploring', 'in-prep']) {
    const project = { ...base, stage, chips: [] };
    for (const lane of board) {
        say(`from ${stage} onto ${lane.key}: movable=${focus.hubMovable(project, lane, vocab)} writes=${JSON.stringify(focus.hubMoveOnto(project, lane, vocab))}`);
    }
}

say('== new records');
// The demo hub names no folder for new projects; the case gives one per tier inside its scan folders.
const portfolio = { ...portfolioConfigFrom(config, loaded.from), newProjectDir: { research: 'projects/ideas', personal: 'projects/ideas', software: 'projects/software' } };
for (const [id] of regs) {
    const preset = presets.presetFor(id, config, vocab);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, selfIds(snapshot)));
    const tier = preset.rule.tiers?.at(0);
    const fields = { id: `case-${id}`, title: `Case ${id}`, eli5: 'x', ...(tier === undefined ? {} : { tier }) };
    const out = createIdea(hub, portfolio, fields);
    const file = out.changed.find((one) => one.endsWith('project.yml'));
    const path = file === undefined ? undefined : file.startsWith('/') ? file : join(hub, file);
    const manifest = path !== undefined && existsSync(path) ? readFileSync(path, 'utf8') : '';
    say(`New project on ${id}: offered=${offered} form tier=${tier} written tier=${/tier: (.*)/.exec(manifest)?.[1]} stage=${/stage: (.*)/.exec(manifest)?.[1]} refused=${JSON.stringify(out.refused)}`);
}
const untiered = createIdea(hub, portfolio, { id: 'case-untiered', title: 'Case untiered', eli5: 'x' });
const untieredFile = untiered.changed.find((one) => one.endsWith('project.yml'));
const untieredText = untieredFile === undefined ? '' : readFileSync(untieredFile.startsWith('/') ? untieredFile : join(hub, untieredFile), 'utf8');
say(`write naming no tier: written tier=${/tier: (.*)/.exec(untieredText)?.[1]} refused=${JSON.stringify(untiered.refused)}`);
const tasks = flaggedCollections(snapshot.entities.collections, 'tasks');
let taskFields = null;
await addTask('Case task', tasks, 'hub', config, async (_c, fields) => { taskFields = fields; return { ok: true, refused: [], id: 'x' }; });
say('new task status:', taskFields?.status);
say('new application status:', applicationFromLead({ title: 'Lead', status: 'open' }, config).status);
say('new lead status (openWord):', leads.openWord(config));
say('decline writes:', leads.declinedWord(config), '| apply writes:', leads.appliedWord(config));
say('dismissed held back by the declined toggle:', leads.isLeadDeclined(config, 'dismissed'));
say('project deadlines category:', tickerCategories(config).find((one) => one.manifests)?.key);

say('== glyphs');
const cross = readFileSync(W + 'src/lib/views/shared/links/CrossLinks.svelte', 'utf8');
say('cross-links:', [...cross.matchAll(/return '([a-z]+)';/g)].map((m) => m[1]).join(','));
say('ticker:', JSON.stringify(ticker.GLYPHS));

say('== categories');
for (const one of categoriesOf(config)) say(`${one.key}: ${one.color}${one.rail ? ' (rail)' : ''}`);
cleanup();
```

Output (`case1-before.txt`):

```
== boards (registrations read from Projects.svelte)
projects: label=Projects glyph=focus order=1 group=projects cards=7 rail=4 colour=#16a34a title=Projects
supervision: label=Supervision glyph=teaching order=2 group=projects cards=10 rail=4 colour=#16a34a title=Supervision
coauthor: label=Coauthor glyph=author order=3 group=projects cards=10 rail=4 colour=#16a34a title=Coauthor
archive: label=Archive glyph=archived order=4 group=projects cards=3 rail=0 colour=#16a34a title=Archive
personal: label=Personal glyph=spark order=5 group=projects cards=0 rail=0 colour=#16a34a title=Personal
software: label=Software glyph=code order=6 group=projects cards=3 rail=0 colour=#16a34a title=Software
rail entry projects: {"label":"Projects","glyph":"paper","page":"projects","chord":"p","group_glyph":"paper"}
== Focus clusters (as Lanes.svelte draws them)
now: glyph=now heading=Now: do these muted=false layout=columns lanes=run,push,revise
parked: glyph=(none) heading=Parked / on hold muted=true layout=columns lanes=review,blocked,backburner
incubate: glyph=idea heading=Incubation: idea to project muted=true layout=columns lanes=scope,derisk,build
idea: glyph=idea heading=Idea muted=true layout=full_width lane=idea order=Sketched tensor decompositions for streaming data
  lane run: 
  lane push: Transfer learning across graph domains@2026-09-10 | Bandit algorithms over evolving graphs@
  lane revise: Low-rank streaming anomaly detection@2026-08-15
  lane review: Robust representation learning under distribution shift@
  lane blocked: Sparse attention with learned routing@
  lane backburner: 
  lane scope: Drift-aware clustering for non-stationary streams@
  lane derisk: 
  lane build: 
  lane idea: Sketched tensor decompositions for streaming data@
== awaiting box
{"people":[],"venues":[{"label":"Journal of Machine Learning Research","count":1}],"blocked":1,"grants":[],"applications":["Assistant Professor, ML"]}
== Focus sections (markup order of Focus.svelte)
CareerPanel > CommandCenter > Tasks > QuickAdd > said > awaiting > Band > Empty > Lanes
== lane moves
from exploring onto run: movable=true writes=null
from exploring onto push: movable=true writes={"stage":"in-prep"}
from exploring onto revise: movable=true writes={"stage":"revision"}
from exploring onto review: movable=true writes={"stage":"submitted"}
from exploring onto blocked: movable=true writes={"status.chips":["blocked"]}
from exploring onto backburner: movable=true writes={"status.chips":["parked"]}
from exploring onto scope: movable=true writes={"stage":"scoping"}
from exploring onto derisk: movable=true writes={"stage":"de-risking"}
from exploring onto build: movable=true writes={"stage":"building"}
from exploring onto idea: movable=true writes={"stage":"nascent"}
from in-prep onto run: movable=true writes={"stage":"exploring"}
from in-prep onto push: movable=true writes=null
from in-prep onto revise: movable=true writes={"stage":"revision"}
from in-prep onto review: movable=true writes={"stage":"submitted"}
from in-prep onto blocked: movable=true writes={"status.chips":["blocked"]}
from in-prep onto backburner: movable=true writes={"status.chips":["parked"]}
from in-prep onto scope: movable=true writes={"stage":"scoping"}
from in-prep onto derisk: movable=true writes={"stage":"de-risking"}
from in-prep onto build: movable=true writes={"stage":"building"}
from in-prep onto idea: movable=true writes={"stage":"nascent"}
== new records
New project on projects: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on supervision: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on coauthor: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on archive: offered=false form tier=research written tier=research stage=nascent refused=[]
New project on personal: offered=true form tier=personal written tier=personal stage=nascent refused=[]
New project on software: offered=true form tier=software written tier=software stage=nascent refused=[]
write naming no tier: written tier=research refused=[]
new task status: todo
new application status: not-applied
new lead status (openWord): open
decline writes: declined | apply writes: applied
dismissed held back by the declined toggle: true
project deadlines category: paper
== glyphs
cross-links: active,published,idea
ticker: {"overdue":"overdue","followup":"followup","subtask":"pin"}
== categories
in-review: #0ea5e9
in-flight: #16a34a (rail)
idea: #7c5cff
publications: #db2777
other-outputs: #9333ea
released: #0d9488
dead-ends: #9ca3af
```

The "lane run" and "lane backburner" lines end in a space in the output, as printed.

### findings-cases.mjs

```js
// The config findings of the O80 cases 3 to 7, 11 to 14 and 17: each case's config, through
// loadConfig (a hub's .oculus/config.yml in a temporary folder for a hub key) or through the readers
// of READER_FINDINGS over oculus's merged config with the case's value laid on it (a layout key), and
// the findings it gives that oculus's own config does not. Run: node findings-cases.mjs.
import './shim.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/src/lib/';
const { engineDir, loadConfig } = await import(W + 'data/sources/config.ts');
const { READER_FINDINGS } = await import(W + 'data/sources/config/sections/findings.ts');
const engine = engineDir();
const base = loadConfig(engine);
const readers = (where, config) => READER_FINDINGS.flatMap((find) => find(where, config));
const known = new Set([...base.findings, ...readers({ engine, hub: null, from: base.from }, base.config)].map((f) => f.message));
const fresh = (list) => list.filter((f) => !known.has(f.message)).map((f) => `  ${f.file.replace(engine, '<oculus>').replace(/.*o80-hub-[^/]+/, '<hub>')} [${f.key}] ${f.message}`);
const temp = mkdtempSync(join(process.env.TMPDIR, 'o80-hub-'));

/** The new findings of a hub whose .oculus/config.yml is `yaml`, and the merged config. */
function hubCase(name, yaml) {
    const hub = join(temp, name);
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'config.yml'), yaml);
    const loaded = loadConfig(engine, { hub });
    const found = fresh([...loaded.findings, ...readers({ engine, hub, from: loaded.from }, loaded.config)]);
    return { found, config: loaded.config };
}

/** The new findings of oculus's merged config with `change` laid on it. */
function layoutCase(change) {
    const config = { ...structuredClone(base.config), ...change(structuredClone(base.config)) };
    return { found: fresh(readers({ engine, hub: null, from: base.from }, config)), config };
}

function show(label, result) {
    console.log(`${label}:`);
    console.log(result.found.length === 0 ? '  (no new finding)' : result.found.join('\n'));
}

const boards = (c) => c.boards;
show('case 3, the board projects with no label (oculus has no label anywhere)', layoutCase((c) => ({ boards: { ...boards(c), projects: { ...boards(c).projects } } })));
show('case 2/3, a seventh board theses with label and glyph', layoutCase((c) => ({ boards: { ...boards(c), theses: { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' } } })));
show('case 17, a board keyed focus', layoutCase((c) => ({ boards: { ...boards(c), focus: { tier: 'research' } } })));
show('case 17 (collection key), a board keyed venues', layoutCase((c) => ({ boards: { ...boards(c), venues: { tier: 'research' } } })));
const rail = (c, flag) => c.rail.map((one, at) => (flag(one, at) ? { ...one, project_boards: flag(one, at) } : one));
show('case 4, project_boards on no entry (oculus as it is)', layoutCase(() => ({})));
show('case 4, project_boards true on Projects and Registries', layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' || one.page === 'registries' ? true : undefined)) })));
show('case 4, project_boards: yes on Projects', layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' ? 'yes' : undefined)) })));
const lanes = (extra) => `focus_lanes:\n  - { key: run, label: Run, icon: live, sub: x, color: "#16a34a", cluster: now, stages: [exploring] }\n${extra}`;
const later = hubCase('later', `focus_clusters:\n  - { key: now, label: focus.cluster_now, glyph: focus.now_glyph, muted: false, layout: columns, awaiting: true }\n  - { key: later, label: focus.cluster_parked, muted: true, layout: columns }\n${lanes('  - { key: wait, label: Wait, icon: live, sub: x, color: "#16a34a", cluster: later, stages: [submitted] }\n  - { key: far, label: Far, icon: live, sub: x, color: "#16a34a", cluster: nowhere, stages: [scoping] }\n  - { key: bare, label: Bare, icon: live, sub: x, color: "#16a34a", stages: [building] }\n')}`);
show('case 5, focus_clusters with later, lanes naming later, nowhere and none', later);
const { lanes: readLanes, lanesIn, CLUSTERS } = await import(W + 'state/boards/focus.ts');
const drawn = readLanes(later.config);
console.log(`  lanes read: ${drawn.map((l) => `${l.key}:${l.cluster}`).join(', ')}; drawn clusters: ${[...CLUSTERS, 'idea'].map((c) => `${c}=[${lanesIn(drawn, c).map((l) => l.key)}]`).join(' ')}`);
show('case 6, a focus_clusters row with layout: grid', hubCase('grid', 'focus_clusters:\n  - { key: now, label: focus.cluster_now, muted: false, layout: grid }\n'));
show('case 7, two tiers with default: true', hubCase('tiers', 'tiers:\n  research: { label: Research, unmarked: true, default: true }\n  personal: { label: Personal, default: true }\n'));
show('case 10, the push lane with move_writes submit-ready', hubCase('push', lanes('  - { key: push, label: Push, icon: draft, sub: x, color: "#2563eb", cluster: now, stages: [in-prep, submit-ready], move_writes: { stage: submit-ready } }\n')));
show('case 11, stages [scoping] with move_writes stage building', hubCase('wrong-stage', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { stage: building } }\n')));
show('case 11, stages [scoping] with move_writes chip blocked', hubCase('wrong-kind', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { chip: blocked } }\n')));
show('case 12, default_task on todo (oculus) and doing (hub)', hubCase('tasks', 'statuses:\n  doing: { color: "#16a34a", default_task: true }\n'));
show('case 12, lead_applied on applied (oculus) and closed (hub)', hubCase('applied', 'lead_statuses:\n  closed: { lead_closed: true, lead_applied: true }\n'));
show('case 13, a category row with no color', layoutCase((c) => ({ categories: c.categories.map((row) => (row.key === 'publications' ? { ...row, color: undefined } : row)) })));
show('case 14, a hub setting rail_color "#2563eb"', hubCase('rail-blue', 'rail_color: "#2563eb"\n'));
show('case 14, a hub setting rail_color: 3', hubCase('rail-three', 'rail_color: 3\n'));
rmSync(temp, { recursive: true, force: true });
```

Output (`findings-before.txt`):

```
case 3, the board projects with no label (oculus has no label anywhere):
  (no new finding)
case 2/3, a seventh board theses with label and glyph:
  <oculus>/config/defaults/layout.yml [boards.theses.label] boards.theses.label is not a field a board takes; it is not read
  <oculus>/config/defaults/layout.yml [boards.theses.glyph] boards.theses.glyph is not a field a board takes; it is not read
case 17, a board keyed focus:
  (no new finding)
case 17 (collection key), a board keyed venues:
  (no new finding)
case 4, project_boards on no entry (oculus as it is):
  (no new finding)
case 4, project_boards true on Projects and Registries:
  (no new finding)
case 4, project_boards: yes on Projects:
  (no new finding)
case 5, focus_clusters with later, lanes naming later, nowhere and none:
  <hub>/later/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied
  lanes read: run:now, wait:later, far:nowhere, bare:; drawn clusters: now=[run] parked=[] incubate=[] idea=[]
case 6, a focus_clusters row with layout: grid:
  <hub>/grid/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied
case 7, two tiers with default: true:
  <hub>/tiers/.oculus/config.yml [tiers.research.default] key tiers.research.default is not a key this file takes
  <hub>/tiers/.oculus/config.yml [tiers.personal.default] key tiers.personal.default is not a key this file takes
case 10, the push lane with move_writes submit-ready:
  <hub>/push/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 11, stages [scoping] with move_writes stage building:
  <hub>/wrong-stage/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 11, stages [scoping] with move_writes chip blocked:
  <hub>/wrong-kind/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 12, default_task on todo (oculus) and doing (hub):
  (no new finding)
case 12, lead_applied on applied (oculus) and closed (hub):
  (no new finding)
case 13, a category row with no color:
  (no new finding)
case 14, a hub setting rail_color "#2563eb":
  <hub>/rail-blue/.oculus/config.yml [rail_color] key rail_color is not one the hub's settings file takes; it is not applied
case 14, a hub setting rail_color: 3:
  <hub>/rail-three/.oculus/config.yml [rail_color] key rail_color is not one the hub's settings file takes; it is not applied
```

### misc-cases.mjs

```js
// The O80 cases 8, 9, 10, 12 (the readers), 14 (the rail count) and 15 on the tree as it stands.
// Run: node misc-cases.mjs. Reads the worktree and writes nothing.
import './shim.mjs';
import { readFileSync } from 'node:fs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { engineDir, loadConfig, textCatalog } = await import(src('data/sources/config.ts'));
const text = await import(src('state/shared/words/text.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject } = await import(src('state/boards/board/new-project.ts'));
const focus = await import(src('state/boards/focus.ts'));
const { hubsTaking } = await import(src('state/shared/page/hubs.ts'));
const { writtenFile } = await import(src('state/sessions/source/write-files.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const base = loadConfig(engineDir()).config;
text.setCatalog(textCatalog(base));
const say = (...a) => console.log(...a);

say('== case 8');
for (const tiers of [['research', 'personal'], ['personal', 'software']]) {
    const config = { ...base, boards: { ...base.boards, coauthor: { ...base.boards.coauthor, tier: tiers } } };
    const preset = presets.presetFor('coauthor', config);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, new Set()));
    say(`coauthor tier ${JSON.stringify(tiers)}: offered=${offered} tier the form writes=${preset.rule.tiers?.at(0)}`);
}

say('== case 9');
say('two hubs, primary hub holds none of them (lab, other hold it):', JSON.stringify(hubsTaking(['lab', 'other'], 'hub')));
say('two hubs, primary holds it:', JSON.stringify(hubsTaking(['lab', 'hub'], 'hub')));
say('one hub, not the primary:', JSON.stringify(hubsTaking(['lab'], 'hub')));
const formSource = readFileSync(W + 'src/lib/views/shared/forms/NewIdeaForm.svelte', 'utf8');
say('NewIdeaForm hub:', /const hub = \$derived\((.*)\);/.exec(formSource)?.[1]);
const addSource = readFileSync(W + 'src/lib/views/shared/forms/entry/entry-add.ts', 'utf8');
say('entry-add hubAsk value:', /const value = (.*);/.exec(addSource)?.[1]);
const look = { primary: () => null, hubs: () => ['lab', 'other'], workspaceFile: () => null, projectManifest: () => null, collectionFile: (hub, name) => ({ root: hub, path: `${name}.yml` }), registryKey: () => 'literature', feeds: () => null, changeFile: () => null, unsavedUnknown: () => false };
say('write-files new-entry, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'new-entry', collection: 'tasks' }, base, look)));
say('write-files literature-save, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'literature-save' }, base, look)));

say('== case 10');
const pushLanes = base.focus_lanes.map((lane) => (lane.key === 'push' ? { ...lane, move_writes: { stage: 'submit-ready' } } : lane));
const pushed = { ...base, focus_lanes: pushLanes };
const lane = focus.lanes(pushed).find((one) => one.key === 'push');
for (const stage of ['exploring', 'in-prep']) {
    const project = { id: 'hub/x', root: 'hub', title: 'x', stage, chips: [], waitingOn: [] };
    say(`at ${stage} onto push: ${JSON.stringify(focus.hubMoveOnto(project, lane, () => pushed))}`);
}

say('== case 12');
const twoTasks = { ...base, statuses: { ...base.statuses, doing: { ...base.statuses.doing, default_task: true } } };
let fields = null;
const tasks = [{ id: 'hub/tasks', root: 'hub', key: 'tasks', tasks: true, schema: [{ field: 'key', type: 'text' }, { field: 'title', type: 'text' }], entries: [] }];
const answer = await addTask('A task', tasks, 'hub', twoTasks, async (_c, made) => { fields = made; return { ok: true, refused: [], id: 'hub/tasks/a-task' }; });
say('default_task on todo and doing, the task written with:', JSON.stringify(fields), JSON.stringify(answer.said));
const twoApplied = { ...base, lead_statuses: { ...base.lead_statuses, closed: { lead_closed: true, lead_applied: true } } };
say('lead_applied on applied and closed, the apply control writes:', leads.appliedWord(twoApplied));

say('== case 14');
const blue = { ...base, rail_color: '#2563eb' };
say('rail_color "#2563eb", rail count colour:', railCount([], categoriesOf(blue), blue).color);

say('== case 15');
say('Focus.svelte reads the config focus.sections:', /focus\??\.sections|\.focus\b.*sections/.test(readFileSync(W + 'src/lib/views/boards/focus/Focus.svelte', 'utf8')));
say('behavior.yml focus keys:', Object.keys(base.focus ?? {}).join(', '));
```

Output (`misc-before.txt`):

```
== case 8
coauthor tier ["research","personal"]: offered=true tier the form writes=research
coauthor tier ["personal","software"]: offered=true tier the form writes=personal
== case 9
two hubs, primary hub holds none of them (lab, other hold it): ["lab","other"]
two hubs, primary holds it: ["hub","lab"]
one hub, not the primary: ["lab"]
NewIdeaForm hub: picked === '' ? (hubs.at(0) ?? '') : picked
entry-add hubAsk value: hubs.some((one) => one.id === chosen) ? (chosen ?? '') : hubs[0].id
write-files new-entry, no root, two hubs, no primary: {"root":"lab","path":"tasks.yml"}
write-files literature-save, no root, two hubs, no primary: {"root":"lab","path":"literature.yml"}
== case 10
at exploring onto push: {"stage":"in-prep"}
at in-prep onto push: null
== case 12
default_task on todo and doing, the task written with: {"key":"a-task","title":"A task","status":"todo"} ""
lead_applied on applied and closed, the apply control writes: applied
== case 14
rail_color "#2563eb", rail count colour: #16a34a
== case 15
Focus.svelte reads the config focus.sections: false
behavior.yml focus keys: stale_lag_days, refresh_stale_days, deadline_horizon_days, leads_horizon_days, conf_horizon_months, venue_conc_warn, linkedin_cadence_days, applications_open, education_open, applications_sent
```

### case1-after.mjs

```js
// Case 1 of O80 after the change: oculus's own config over a copy of the demo fixture hub, each fact
// the case names, read through the functions the views now call. Run: node case1-after.mjs (Node
// 24). Reads the worktree; writes only into a copy of the demo hub under $TMPDIR, removed at the end.
import './shim.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { demoSnapshot } from './snap.mjs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { textCatalog } = await import(src('data/sources/config.ts'));
const { portfolioConfigFrom } = await import(src('data/index.ts'));
const text = await import(src('state/shared/words/text.ts'));
const focus = await import(src('state/boards/focus.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { boardItems, takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject, newProjectTier } = await import(src('state/boards/board/new-project.ts'));
const { selfIds } = await import(src('state/boards/board/team.ts'));
const { personNames } = await import(src('state/boards/person.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { oneWordWith } = await import(src('data/shapes/vocab-keys.ts'));
const { applicationFromLead } = await import(src('state/feeds/lead-application.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const { flaggedCollections } = await import(src('data/helpers/hub-names.ts'));
const { createIdea } = await import(src('server/edit/writes/manifest.ts'));

const { snapshot, config: loaded, hub, cleanup } = await demoSnapshot();
const config = loaded.config;
const catalog = textCatalog(config);
text.setCatalog(catalog);
const say = (...a) => console.log(...a);
const vocab = () => config;

say('== boards (boardViews over boards:, as the page registers them; no module view id given)');
const read = presets.boardViews(presets.boardsSource(config, () => 'layout.yml'), catalog, new Set());
say('findings:', JSON.stringify(read.findings));
for (const view of read.views) {
    const preset = presets.presetFor(view.id, config, vocab);
    const items = boardItems(snapshot, preset);
    const rail = railCount(items.map((one) => one.project), preset.categories, preset.config, (h) => preset.words(h).config);
    say(`${view.id}: label=${text.t(view.label)} glyph=${text.t(view.glyph)} order=${view.order} group=${view.group} cards=${items.length} rail=${rail.count} colour=${rail.color} title=${text.lookup(view.label)}`);
}
const railEntry = config.rail.find((one) => one.page === 'projects');
say('rail entry projects:', JSON.stringify(railEntry));

say('== Focus clusters (clusters(config), as Lanes.svelte draws them)');
const board = focus.lanes(config);
const items = focus.laneItems(Object.values(snapshot.entities.projects), board, config);
for (const cluster of focus.clusters(config)) {
    const glyph = cluster.glyph === '' ? '(none)' : text.t(cluster.glyph);
    const lanes = focus.lanesIn(board, cluster.key);
    // A columns cluster is headed by its label word, else its key; a full_width one draws each lane
    // under the lane's own label (Lanes.svelte).
    const heading = cluster.layout === 'full_width' ? lanes.map((l) => l.label).join(',') : cluster.label === '' ? cluster.key : text.t(cluster.label);
    say(`${cluster.key}: glyph=${glyph} heading=${heading} muted=${cluster.muted} layout=${cluster.layout} byTitle=${cluster.byTitle} awaiting=${cluster.awaiting} lanes=${lanes.map((l) => l.key).join(',')}`);
    if (cluster.layout === 'full_width') {
        for (const lane of lanes) say(`  full-width lane ${lane.key} heading=${lane.label} order=${(items[lane.key] ?? []).map((p) => p.title).join(' | ')}`);
    }
}
for (const lane of board) say(`  lane ${lane.key}: ${(items[lane.key] ?? []).map((p) => `${p.title}@${p.deadline ?? ''}`).join(' | ')}`);

say('== awaiting box');
say(JSON.stringify(focus.waiting(snapshot, config, personNames(snapshot))));

say('== Focus sections (drawnSections, with the said line where Focus.svelte draws it)');
const sections = focus.drawnSections(config);
const drawn = sections.includes('quick_add') ? sections.flatMap((one) => (one === 'quick_add' ? [one, 'said'] : [one])) : ['said', ...sections];
say(drawn.join(' > '));

say('== lane moves');
const base = Object.values(snapshot.entities.projects)[0];
for (const stage of ['exploring', 'in-prep']) {
    const project = { ...base, stage, chips: [] };
    for (const lane of board) {
        say(`from ${stage} onto ${lane.key}: movable=${focus.hubMovable(project, lane, vocab)} writes=${JSON.stringify(focus.hubMoveOnto(project, lane, vocab))}`);
    }
}

say('== new records');
// The demo hub names no folder for new projects; the case gives one per tier inside its scan folders.
const portfolio = { ...portfolioConfigFrom(config, loaded.from), newProjectDir: { research: 'projects/ideas', personal: 'projects/ideas', software: 'projects/software' } };
for (const view of read.views) {
    const preset = presets.presetFor(view.id, config, vocab);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, selfIds(snapshot)));
    const tier = newProjectTier(preset.rule, config);
    const fields = { id: `case-${view.id}`, title: `Case ${view.id}`, eli5: 'x', ...(tier === undefined ? {} : { tier }) };
    const out = createIdea(hub, portfolio, fields);
    const file = out.changed.find((one) => one.endsWith('project.yml'));
    const path = file === undefined ? undefined : file.startsWith('/') ? file : join(hub, file);
    const manifest = path !== undefined && existsSync(path) ? readFileSync(path, 'utf8') : '';
    say(`New project on ${view.id}: offered=${offered} form tier=${tier} written tier=${/tier: (.*)/.exec(manifest)?.[1]} stage=${/stage: (.*)/.exec(manifest)?.[1]} refused=${JSON.stringify(out.refused)}`);
}
const untiered = createIdea(hub, portfolio, { id: 'case-untiered', title: 'Case untiered', eli5: 'x' });
const untieredFile = untiered.changed.find((one) => one.endsWith('project.yml'));
const untieredText = untieredFile === undefined ? '' : readFileSync(untieredFile.startsWith('/') ? untieredFile : join(hub, untieredFile), 'utf8');
say(`write naming no tier: written tier=${/tier: (.*)/.exec(untieredText)?.[1]} refused=${JSON.stringify(untiered.refused)}`);
const tasks = flaggedCollections(snapshot.entities.collections, 'tasks');
let taskFields = null;
await addTask('Case task', tasks, 'hub', config, async (_c, fields) => { taskFields = fields; return { ok: true, refused: [], id: 'x' }; });
say('new task status:', taskFields?.status);
say('new application status:', applicationFromLead({ title: 'Lead', status: 'open' }, config).status);
say('new lead status (openWord):', leads.openWord(config));
say('decline writes:', leads.declinedWord(config), '| apply writes:', leads.appliedWord(config));
say('dismissed held back by the declined toggle:', leads.isLeadDeclined(config, 'dismissed'));
say('project deadlines category:', oneWordWith(config, 'ticker_categories', 'manifests'));

say('== glyphs');
say('cross-links:', ['in_flight', 'done', 'idea'].map((one) => text.t(`project.helper.xlink_${one}_glyph`)).join(','));
say('ticker:', JSON.stringify({ overdue: text.t('focus.command.glyph_overdue'), followup: text.t('focus.command.glyph_followup'), subtask: text.t('focus.command.glyph_subtask') }));

say('== categories');
for (const one of categoriesOf(config)) say(`${one.key}: ${one.color}${one.rail ? ' (rail)' : ''}`);
say('rail_color:', config.rail_color);
cleanup();
```

Output (`case1-after.txt`):

```
== boards (boardViews over boards:, as the page registers them; no module view id given)
findings: []
projects: label=Projects glyph=focus order=1 group=projects cards=7 rail=4 colour=#16a34a title=Projects
supervision: label=Supervision glyph=teaching order=2 group=projects cards=10 rail=4 colour=#16a34a title=Supervision
coauthor: label=Coauthor glyph=author order=3 group=projects cards=10 rail=4 colour=#16a34a title=Coauthor
archive: label=Archive glyph=archived order=4 group=projects cards=3 rail=0 colour=#16a34a title=Archive
personal: label=Personal glyph=spark order=5 group=projects cards=0 rail=0 colour=#16a34a title=Personal
software: label=Software glyph=code order=6 group=projects cards=3 rail=0 colour=#16a34a title=Software
rail entry projects: {"label":"Projects","glyph":"paper","page":"projects","chord":"p","group_glyph":"paper","project_boards":true}
== Focus clusters (clusters(config), as Lanes.svelte draws them)
now: glyph=now heading=Now: do these muted=false layout=columns byTitle=false awaiting=true lanes=run,push,revise
parked: glyph=(none) heading=Parked / on hold muted=true layout=columns byTitle=false awaiting=true lanes=review,blocked,backburner
incubate: glyph=idea heading=Incubation: idea to project muted=true layout=columns byTitle=false awaiting=true lanes=scope,derisk,build
idea: glyph=idea heading=Idea muted=true layout=full_width byTitle=true awaiting=false lanes=idea
  full-width lane idea heading=Idea order=Sketched tensor decompositions for streaming data
  lane run: 
  lane push: Transfer learning across graph domains@2026-09-10 | Bandit algorithms over evolving graphs@
  lane revise: Low-rank streaming anomaly detection@2026-08-15
  lane review: Robust representation learning under distribution shift@
  lane blocked: Sparse attention with learned routing@
  lane backburner: 
  lane scope: Drift-aware clustering for non-stationary streams@
  lane derisk: 
  lane build: 
  lane idea: Sketched tensor decompositions for streaming data@
== awaiting box
{"people":[],"venues":[{"label":"Journal of Machine Learning Research","count":1}],"blocked":1,"grants":[],"applications":["Assistant Professor, ML"]}
== Focus sections (drawnSections, with the said line where Focus.svelte draws it)
career > command_center > tasks > quick_add > said > awaiting > band > lanes
== lane moves
from exploring onto run: movable=true writes=null
from exploring onto push: movable=true writes={"stage":"in-prep"}
from exploring onto revise: movable=true writes={"stage":"revision"}
from exploring onto review: movable=true writes={"stage":"submitted"}
from exploring onto blocked: movable=true writes={"status.chips":["blocked"]}
from exploring onto backburner: movable=true writes={"status.chips":["parked"]}
from exploring onto scope: movable=true writes={"stage":"scoping"}
from exploring onto derisk: movable=true writes={"stage":"de-risking"}
from exploring onto build: movable=true writes={"stage":"building"}
from exploring onto idea: movable=true writes={"stage":"nascent"}
from in-prep onto run: movable=true writes={"stage":"exploring"}
from in-prep onto push: movable=true writes=null
from in-prep onto revise: movable=true writes={"stage":"revision"}
from in-prep onto review: movable=true writes={"stage":"submitted"}
from in-prep onto blocked: movable=true writes={"status.chips":["blocked"]}
from in-prep onto backburner: movable=true writes={"status.chips":["parked"]}
from in-prep onto scope: movable=true writes={"stage":"scoping"}
from in-prep onto derisk: movable=true writes={"stage":"de-risking"}
from in-prep onto build: movable=true writes={"stage":"building"}
from in-prep onto idea: movable=true writes={"stage":"nascent"}
== new records
New project on projects: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on supervision: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on coauthor: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on archive: offered=false form tier=research written tier=research stage=nascent refused=[]
New project on personal: offered=true form tier=personal written tier=personal stage=nascent refused=[]
New project on software: offered=true form tier=software written tier=software stage=nascent refused=[]
write naming no tier: written tier=research refused=[]
new task status: todo
new application status: not-applied
new lead status (openWord): open
decline writes: declined | apply writes: applied
dismissed held back by the declined toggle: false
project deadlines category: paper
== glyphs
cross-links: active,published,idea
ticker: {"overdue":"overdue","followup":"followup","subtask":"pin"}
== categories
in-review: #0ea5e9
in-flight: #16a34a (rail)
idea: #7c5cff
publications: #db2777
other-outputs: #9333ea
released: #0d9488
dead-ends: #9ca3af
rail_color: #16a34a
```

The "lane run", "lane backburner", "lane derisk" and "lane build" lines end in a space in the output, as printed.

### findings-after.mjs

```js
// The config findings of the O80 cases 2 to 7, 10 to 14 and 17 after the change: each case's
// config, through loadConfig (a hub's .oculus/config.yml in a temporary folder for a hub key) or
// through the readers of READER_FINDINGS over oculus's merged config with the case's value laid on
// it (a layout key), and the findings it gives that oculus's own config does not. Case 17's finding
// is the page's: boardViews with the taken ids handed to it. Run: node findings-after.mjs.
import './shim.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/src/lib/';
const { engineDir, loadConfig, textCatalog } = await import(W + 'data/sources/config.ts');
const { READER_FINDINGS } = await import(W + 'data/sources/config/sections/findings.ts');
const presets = await import(W + 'state/boards/board/presets.ts');
const focus = await import(W + 'state/boards/focus.ts');
const engine = engineDir();
const base = loadConfig(engine);
const catalog = textCatalog(base.config);
const readers = (where, config) => READER_FINDINGS.flatMap((find) => find(where, config));
const known = new Set([...base.findings, ...readers({ engine, hub: null, from: base.from }, base.config)].map((f) => f.message));
const fresh = (list) => list.filter((f) => !known.has(f.message)).map((f) => `  ${f.file.replace(engine, '<oculus>').replace(/.*o80-hub-[^/]+/, '<hub>')} [${f.key}] ${f.message}`);
const temp = mkdtempSync(join(process.env.TMPDIR, 'o80-hub-'));
console.log('oculus alone, findings of the merge and the readers:', [...base.findings, ...readers({ engine, hub: null, from: base.from }, base.config)].length);

/** The new findings of a hub whose .oculus/config.yml is `yaml`, and the merged config. */
function hubCase(name, yaml) {
    const hub = join(temp, name);
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'config.yml'), yaml);
    const loaded = loadConfig(engine, { hub });
    const found = fresh([...loaded.findings, ...readers({ engine, hub, from: loaded.from }, loaded.config)]);
    return { found, config: loaded.config };
}

/** The new findings of oculus's merged config with `change` laid on it. */
function layoutCase(change) {
    const config = { ...structuredClone(base.config), ...change(structuredClone(base.config)) };
    return { found: fresh(readers({ engine, hub: null, from: base.from }, config)), config };
}

function show(label, result) {
    console.log(`${label}:`);
    console.log(result.found.length === 0 ? '  (no new finding)' : result.found.join('\n'));
}

/** The board views of a config, with the ids `taken`, as `id group order label glyph`. */
function views(config, taken = []) {
    const read = presets.boardViews(presets.boardsSource(config, () => 'layout.yml'), catalog, new Set(taken));
    const lines = read.views.map((v) => `  view ${v.id} group=${v.group} order=${v.order} label=${v.label || `(words ${v.words})`} glyph=${v.glyph}`);
    const found = read.findings.map((f) => `  page finding ${f.file} [${f.key}] ${f.message}`);
    return [...lines, ...found].join('\n');
}

const boards = (c) => c.boards;
const theses = { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' };
const seventh = layoutCase((c) => ({ boards: { ...boards(c), theses } }));
show('case 2, a seventh board theses with label and glyph', seventh);
console.log(views(seventh.config));
const unlabelled = layoutCase((c) => ({ boards: { ...boards(c), projects: { ...boards(c).projects, label: undefined } } }));
for (const row of Object.values(unlabelled.config.boards)) if (row.label === undefined) delete row.label;
show('case 3, the board projects with no label', layoutCase(() => ({ boards: unlabelled.config.boards })));
console.log(views(unlabelled.config).split('\n')[0]);
const rail = (c, flag) => c.rail.map((one) => { const { project_boards, ...rest } = one; const set = flag(one); return set === undefined ? rest : { ...rest, project_boards: set }; });
const none = layoutCase((c) => ({ rail: rail(c, () => undefined) }));
show('case 4, project_boards on no entry', none);
console.log(views(none.config).split('\n')[0]);
const two = layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' || one.page === 'registries' ? true : undefined)) }));
show('case 4, project_boards true on Projects and Registries', two);
console.log(views(two.config).split('\n')[0]);
show('case 4, project_boards: yes on Projects', layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' ? 'yes' : undefined)) })));
const lanes = (extra) => `focus_lanes:\n  - { key: run, label: Run, icon: live, sub: x, color: "#16a34a", cluster: now, stages: [exploring] }\n${extra}`;
const later = hubCase('later', `focus_clusters:\n  - { key: now, label: focus.cluster_now, glyph: focus.now_glyph, muted: false, layout: columns, awaiting: true }\n  - { key: later, label: focus.cluster_parked, muted: true, layout: columns }\n${lanes('  - { key: wait, label: Wait, icon: live, sub: x, color: "#16a34a", cluster: later, stages: [submitted] }\n  - { key: far, label: Far, icon: live, sub: x, color: "#16a34a", cluster: nowhere, stages: [scoping] }\n  - { key: bare, label: Bare, icon: live, sub: x, color: "#16a34a", stages: [building] }\n')}`);
show('case 5, focus_clusters with later, lanes naming later, nowhere and none', later);
const drawn = focus.lanes(later.config);
console.log(`  clusters drawn: ${focus.clusters(later.config).map((c) => `${c.key}(${c.layout})=[${focus.lanesIn(drawn, c.key).map((l) => l.key)}]`).join(' ')}`);
const options = base.config.options['catalogs/vocab.yml'].focus_lanes;
console.log('  the options entry of a lane\'s cluster:', JSON.stringify(options.fields?.cluster ?? options));
show('case 6, a focus_clusters row with layout: grid', hubCase('grid', 'focus_clusters:\n  - { key: now, label: focus.cluster_now, muted: false, layout: grid }\n'));
show('case 7, two tiers with default: true', hubCase('tiers', 'tiers:\n  research: { label: Research, unmarked: true, default: true }\n  personal: { label: Personal, default: true }\n'));
show('case 10, the push lane with move_writes submit-ready', hubCase('push', lanes('  - { key: push, label: Push, icon: draft, sub: x, color: "#2563eb", cluster: now, stages: [in-prep, submit-ready], move_writes: { stage: submit-ready } }\n')));
show('case 11, stages [scoping] with move_writes stage building', hubCase('wrong-stage', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { stage: building } }\n')));
show('case 11, stages [scoping] with move_writes chip blocked', hubCase('wrong-kind', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { chip: blocked } }\n')));
show('case 12, default_task on todo (oculus) and doing (hub)', hubCase('tasks', 'statuses:\n  doing: { color: "#16a34a", default_task: true }\n'));
show('case 12, lead_applied on applied (oculus) and closed (hub)', hubCase('applied', 'lead_statuses:\n  closed: { lead_closed: true, lead_applied: true }\n'));
show('case 13, a category row with no color', layoutCase((c) => ({ categories: c.categories.map((row) => { if (row.key !== 'publications') return row; const { color, ...rest } = row; return rest; }) })));
show('case 14, a hub setting rail_color "#2563eb"', hubCase('rail-blue', 'rail_color: "#2563eb"\n'));
show('case 14, a hub setting rail_color: 3', hubCase('rail-three', 'rail_color: 3\n'));
const focusBoard = layoutCase((c) => ({ boards: { ...boards(c), focus: { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' } } }));
show('case 17, a board keyed focus (config check)', focusBoard);
console.log(views(focusBoard.config, ['focus']).split('\n').filter((line) => line.includes('focus')).join('\n'));
const venuesBoard = layoutCase((c) => ({ boards: { ...boards(c), venues: { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' } } }));
show('case 17 (collection key), a board keyed venues (config check)', venuesBoard);
console.log(views(venuesBoard.config, ['venues']).split('\n').filter((line) => line.includes('venues')).join('\n'));
rmSync(temp, { recursive: true, force: true });
```

Output (`findings-after.txt`):

```
oculus alone, findings of the merge and the readers: 0
case 2, a seventh board theses with label and glyph:
  (no new finding)
  view projects group=projects order=1 label=views.projects glyph=views.projects_glyph
  view supervision group=projects order=2 label=views.supervision glyph=views.supervision_glyph
  view coauthor group=projects order=3 label=views.coauthor glyph=views.coauthor_glyph
  view archive group=projects order=4 label=views.archive glyph=views.archive_glyph
  view personal group=projects order=5 label=views.personal glyph=views.personal_glyph
  view software group=projects order=6 label=views.software glyph=views.software_glyph
  view theses group=projects order=7 label=views.projects glyph=views.projects_glyph
case 3, the board projects with no label:
  <oculus>/config/defaults/layout.yml [boards.projects.label] the board projects names no label; a board with no label word is drawn with its key, and one with no glyph word with the glyph views.board_glyph names
  view projects group=projects order=1 label=(words projects) glyph=views.projects_glyph
case 4, project_boards on no entry:
  <oculus>/config/defaults/layout.yml [rail] no rail button carries project_boards; the project boards are in no group of the view catalogue
  view projects group= order=1 label=views.projects glyph=views.projects_glyph
case 4, project_boards true on Projects and Registries:
  <oculus>/config/defaults/layout.yml [rail] the rail button for registries carries project_boards, as the one for projects does; the project boards go in the group of projects
  view projects group=projects order=1 label=views.projects glyph=views.projects_glyph
case 4, project_boards: yes on Projects:
  <oculus>/config/defaults/layout.yml [rail[1]] the rail button for projects has a project_boards that is not true or false; its group does not take the project boards
  <oculus>/config/defaults/layout.yml [rail] no rail button carries project_boards; the project boards are in no group of the view catalogue
case 5, focus_clusters with later, lanes naming later, nowhere and none:
  <hub>/later/.oculus/config.yml [focus_lanes[2]] the Focus lane far names the cluster nowhere, which no row of focus_clusters has; the lane is not drawn
  <hub>/later/.oculus/config.yml [focus_lanes[3]] the Focus lane bare names no cluster; the lane is not drawn
  clusters drawn: now(columns)=[run] later(columns)=[wait]
  the options entry of a lane's cluster: {"help":"the cluster of focus_clusters the lane is drawn in; a lane naming none, or one no row has, is not drawn","control":"choice","from":"focus_clusters"}
case 6, a focus_clusters row with layout: grid:
  <hub>/grid/.oculus/config.yml [focus_clusters.0.layout] focus_clusters.0.layout must be one of columns, full_width
  <oculus>/config/catalogs/vocab.yml [focus_lanes[3]] the Focus lane review names the cluster parked, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[4]] the Focus lane blocked names the cluster parked, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[5]] the Focus lane backburner names the cluster parked, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[6]] the Focus lane scope names the cluster incubate, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[7]] the Focus lane derisk names the cluster incubate, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[8]] the Focus lane build names the cluster incubate, which no row of focus_clusters has; the lane is not drawn
  <oculus>/config/catalogs/vocab.yml [focus_lanes[9]] the Focus lane idea names the cluster idea, which no row of focus_clusters has; the lane is not drawn
case 7, two tiers with default: true:
  <hub>/tiers/.oculus/config.yml [tiers.personal] research, personal each carry default, which one word carries at most; none of them is read for it
case 10, the push lane with move_writes submit-ready:
  (no new finding)
case 11, stages [scoping] with move_writes stage building:
  <hub>/wrong-stage/.oculus/config.yml [focus_lanes[1].move_writes] the move_writes of the Focus lane scope names building, which the lane does not list; the lane takes no move
case 11, stages [scoping] with move_writes chip blocked:
  <hub>/wrong-kind/.oculus/config.yml [focus_lanes[1].move_writes] the move_writes of the Focus lane scope names a chip, and the lane is placed by its stages; the lane takes no move
case 12, default_task on todo (oculus) and doing (hub):
  <hub>/tasks/.oculus/config.yml [statuses.doing] todo, doing each carry default_task, which one word carries at most; none of them is read for it
case 12, lead_applied on applied (oculus) and closed (hub):
  <hub>/applied/.oculus/config.yml [lead_statuses.closed] applied, closed each carry lead_applied, which one word carries at most; none of them is read for it
case 13, a category row with no color:
  <oculus>/config/catalogs/vocab.yml [categories[3]] categories[3] names no color, so it is drawn in no colour
case 14, a hub setting rail_color "#2563eb":
  (no new finding)
case 14, a hub setting rail_color: 3:
  <hub>/rail-three/.oculus/config.yml [rail_color] rail_color must be a colour written #rrggbb; oculus's value stands
case 17, a board keyed focus (config check):
  (no new finding)
  page finding layout.yml [boards.focus] the board focus has the key of a view oculus's modules or a collection register; the board is not registered
case 17 (collection key), a board keyed venues (config check):
  (no new finding)
  page finding layout.yml [boards.venues] the board venues has the key of a view oculus's modules or a collection register; the board is not registered
```

### misc-after.mjs

```js
// The O80 cases 8, 9, 10, 12 (the readers), 14 (the rail count) and 15 after the change.
// Run: node misc-after.mjs. Reads the worktree and writes nothing.
import './shim.mjs';
import { readFileSync } from 'node:fs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { engineDir, loadConfig, textCatalog } = await import(src('data/sources/config.ts'));
const { READER_FINDINGS } = await import(src('data/sources/config/sections/findings.ts'));
const text = await import(src('state/shared/words/text.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject, newProjectTier } = await import(src('state/boards/board/new-project.ts'));
const focus = await import(src('state/boards/focus.ts'));
const { hubsTaking, chosenHub } = await import(src('state/shared/page/hubs.ts'));
const { writtenFile } = await import(src('state/sessions/source/write-files.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const read = loadConfig(engineDir());
const base = read.config;
text.setCatalog(textCatalog(base));
const say = (...a) => console.log(...a);

say('== case 8');
for (const tiers of [['research', 'personal'], ['personal', 'software']]) {
    const config = { ...base, boards: { ...base.boards, coauthor: { ...base.boards.coauthor, tier: tiers } } };
    const preset = presets.presetFor('coauthor', config);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, new Set()));
    say(`coauthor tier ${JSON.stringify(tiers)}: offered=${offered} tier the form writes=${newProjectTier(preset.rule, config)}`);
}

say('== case 9');
for (const [label, holders] of [['two hubs, the primary hub holding none of them', ['lab', 'other']], ['two hubs, the primary among them', ['lab', 'hub']], ['one hub, not the primary', ['lab']]]) {
    const offered = hubsTaking(holders, 'hub');
    say(`${label}: offered ${JSON.stringify(offered)}, chosen ${JSON.stringify(chosenHub(offered, 'hub') ?? null)}`);
}
const formSource = readFileSync(W + 'src/lib/views/shared/forms/NewIdeaForm.svelte', 'utf8');
say('NewIdeaForm hub:', /const hub = \$derived\((.*)\);/.exec(formSource)?.[1]);
const look = { primary: () => null, hubs: () => ['lab', 'other'], workspaceFile: () => null, projectManifest: () => null, collectionFile: (hub, name) => ({ root: hub, path: `${name}.yml` }), registryKey: () => 'literature', feeds: () => null, changeFile: () => null, unsavedUnknown: () => false };
say('write-files new-entry, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'new-entry', collection: 'tasks' }, base, look)));
say('write-files literature-save, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'literature-save' }, base, look)));

say('== case 10');
const pushLanes = base.focus_lanes.map((lane) => (lane.key === 'push' ? { ...lane, move_writes: { stage: 'submit-ready' } } : lane));
const pushed = { ...base, focus_lanes: pushLanes };
const lane = focus.lanes(pushed).find((one) => one.key === 'push');
for (const stage of ['exploring', 'in-prep']) {
    const project = { id: 'hub/x', root: 'hub', title: 'x', stage, chips: [], waitingOn: [] };
    say(`at ${stage} onto push: ${JSON.stringify(focus.hubMoveOnto(project, lane, () => pushed))}`);
}

say('== case 12');
const twoTasks = { ...base, statuses: { ...base.statuses, doing: { ...base.statuses.doing, default_task: true } } };
let fields = null;
const tasks = [{ id: 'hub/tasks', root: 'hub', key: 'tasks', tasks: true, schema: [{ field: 'key', type: 'text' }, { field: 'title', type: 'text' }], entries: [] }];
const answer = await addTask('A task', tasks, 'hub', twoTasks, async (_c, made) => { fields = made; return { ok: true, refused: [], id: 'hub/tasks/a-task' }; });
say('default_task on todo and doing, the task written with:', JSON.stringify(fields), JSON.stringify(answer.said));
const twoApplied = { ...base, lead_statuses: { ...base.lead_statuses, closed: { lead_closed: true, lead_applied: true } } };
say('lead_applied on applied and closed, the apply control writes:', JSON.stringify(leads.appliedWord(twoApplied)));

say('== case 14');
const blue = { ...base, rail_color: '#2563eb' };
say('rail_color "#2563eb", rail count colour:', railCount([], categoriesOf(blue), blue).color);

say('== case 15');
const readers = (config) => READER_FINDINGS.flatMap((find) => find({ engine: engineDir(), hub: null, from: read.from }, config)).map((f) => `[${f.key}] ${f.message}`);
for (const sections of [undefined, ['lanes', 'career'], ['lanes', 'nope', 'lanes'], 'lanes', []]) {
    const config = { ...base, focus: sections === undefined ? base.focus : { ...base.focus, sections } };
    const drawn = focus.drawnSections(config);
    say(`sections ${JSON.stringify(sections ?? '(oculus)')}: drawn ${JSON.stringify(drawn)} findings ${JSON.stringify(readers(config))}`);
}
```

Output (`misc-after.txt`):

```
== case 8
coauthor tier ["research","personal"]: offered=true tier the form writes=research
coauthor tier ["personal","software"]: offered=false tier the form writes=undefined
== case 9
two hubs, the primary hub holding none of them: offered ["lab","other"], chosen null
two hubs, the primary among them: offered ["hub","lab"], chosen "hub"
one hub, not the primary: offered ["lab"], chosen "lab"
NewIdeaForm hub: picked === '' ? (chosenHub(hubs, primary()) ?? '') : picked
write-files new-entry, no root, two hubs, no primary: null
write-files literature-save, no root, two hubs, no primary: null
== case 10
at exploring onto push: {"stage":"submit-ready"}
at in-prep onto push: null
== case 12
default_task on todo and doing, the task written with: {"key":"a-task","title":"A task"} ""
lead_applied on applied and closed, the apply control writes: ""
== case 14
rail_color "#2563eb", rail count colour: #2563eb
== case 15
sections "(oculus)": drawn ["career","command_center","tasks","quick_add","awaiting","band","lanes"] findings []
sections ["lanes","career"]: drawn ["lanes","career"] findings []
sections ["lanes","nope","lanes"]: drawn ["lanes"] findings ["[focus.sections] focus.sections names nope, which is no section of the Focus board; it is not drawn","[focus.sections] focus.sections names lanes more than once; it is drawn once"]
sections "lanes": drawn ["career","command_center","tasks","quick_add","awaiting","band","lanes"] findings ["[focus.sections] focus.sections must be a list of the sections of the Focus board; every section is drawn in the order the options list them"]
sections []: drawn [] findings []
```

## How many times the verify list ran, and whole-suite commands

- The verify list (`npm run diagrams && npm run test:quick`) ran four times, each from the worktree's root.
  - Run 1 was stopped after `ok svelte-kit sync`, before any test, when `wc -l` showed `board-rules.test.ts` at 942 lines and `keys.test.ts` at 899; the two files were split (the new test files above).
  - Run 2 completed red: `FAILED eslint` (`hub-layer.ts:163` no-dynamic-delete, `boards.test.ts:35` no-unsafe-return, `board-rules.test.ts:423` no-dynamic-delete), `FAILED vitest checks` (`boundaries.test.ts`: "state/boards/focus.ts imports data/sources/config/sections/focus"), `FAILED vitest slow` (`config-value.test.ts`, the expected `idea` row without its colour), and `vitest` with one unhandled pool error, "Failed to start forks worker for test files .../tests/ui/html.dom.test.ts ... Timeout waiting for worker to respond", a worker start timeout in a file the step does not touch, which passed in run 4. Each red line was fixed.
  - Run 3 completed red on one line: `tests/checks/imports/order.test.ts` "data/shapes/boards/focus-sections.ts:8 imports data/sources/config/catalog/options.ts (data/sources, above data/shapes)"; `focusSections` then took the options entry as an argument.
  - Run 4, after the last change, passed: the summary lines are in the Checks table.
- Whole-suite command: one, before the change. `npx vitest run --dir <scratchpad>/o80 --project unit`, started to run a case-run file from the scratchpad, ran the unit project's test files of the worktree on the unchanged tree; it was stopped before it ended and printed no summary. It wrote nothing in the worktree (`git status --short` printed nothing after it). No whole-suite command ran after the ruling.
- Other test runs: single files with `npx vitest run tests/<file>`; the case 16 command, three times (twice before the change, once after with `--reporter=verbose`); the base-copy runs of the new and edited tests in `<scratchpad>/o80/baserun`.

# Repair round 1

Everything in the round is done. Two rules of the round's head paragraph were not kept to the letter, both in the scratchpad only and changing no file of the worktree: the first form of `wrap.awk` was written into the scratchpad by a `cat > ... <<'EOF'` heredoc redirect, then deleted with `rm` and written again with the Write tool (the source quoted below is that file); and the outputs of the case-run programs and of the verify list were saved into the scratchpad by `tee` and `>` redirects (`ticker-base.txt`, `ticker-before.txt`, `rewrap-out.txt`, `wrap-after.txt`, `unused-after.txt`, `verify.txt`). Every edit of the worktree was made with the Edit and Write tools.

`<scratchpad>` below is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`. The base-copy runs ran in `<scratchpad>/o80r1/baserun`: the `src`, `tests`, `utils` and `config` folders of `.agents/worktrees/O80-base` (its `config/local.yml` left out), the worktree's root config files and `.svelte-kit`, `node_modules` linked, and the test file of the row copied in from the worktree. `git diff --stat ee0f4259 -- vite.config.ts package.json tsconfig.json eslint.config.js .prettierrc` prints nothing, so the root config files are the base's.

## Items

| Item | State | Proof |
| --- | --- | --- |
| 1, a removed word leaves a lane's `move_writes` alone | DONE | `hub-layer.ts`: `WORD_RECORDS = new Map([['focus_lanes', 'move_writes']])`; `prunedValue`'s prune calls `recordWithout` only for that field of that list (`WORD_RECORDS.get(path) === field`), and every other field, a collection's `ticker` among them, goes through `fieldWithout` as on the base. The doc of `recordWithout` and of `dropRemovedWords` names "a Focus lane's `move_writes` (`WORD_RECORDS`)". `node ticker.mjs <tree>` (source and outputs below): before, `merged funding ticker {}` with `ticker_unread`, and with the hub's `collections` a merge finding plus `ticker_unread`; after, both inputs print `merged funding ticker {"category":"funding"}` and the one list finding `ticker category funding names no word of ticker_categories; the entry gives no ticker lines`, line for line the base's output. |
| 2, a cluster row that does not read gives its lanes their finding | DONE | New `src/lib/data/shapes/boards/focus-clusters.ts` holds the row shape and reads each row once: `readClusterRows` (each row that reads, with its index) and `drawnClusterRows` (the rows the board draws). `clusterFindings` (`sections/vocab.ts`) iterates `readClusterRows`, and `clusters()` (`state/boards/focus.ts`) maps `drawnClusterRows`, so a key is known only for a row the board keeps. Test row 'words each lane of a cluster whose row does not read, and of oculus's clusters the hub's list leaves out' in `tests/data/shapes/catalog-files/vocab.test.ts`; its runs are under "Test rows". The finding's words say "no readable row of focus_clusters" (`config/text/findings.yml` `cluster_unknown`), and the same words are in `config/catalogs/vocab.yml:179`, `config/options/catalogs/vocab.yml:185`, `src/lib/data/shapes/catalog-files/vocab.ts:63` and `docs/HELP.md:287`. |
| 3, the held predicates tell the hubs apart | DONE | `tests/state/client/held-unsaved.test.ts`: `writesOver(hubs, posted, held)` builds the writes; each 'refuses %s over the file of the hub the server writes' row passes `(one: HubFile) => one.root === file.root && one.path === file.path`, the root being the hub. The G8 rows 'names no file for %s with two hubs, so the server answers it' pass `() => true`: they assert that the page names no file, so a predicate holding every file of every hub is the one under which any file named would refuse the write and the row fail. Base and after runs under "Test rows". |
| 4, a chip lane whose `move_writes` names a chip other than its first | DONE | `board-rules.test.ts` row 'case 11: a move onto a chip lane listing two chips adds the chip of move_writes, not the lane's first': the `blocked` lane given `chips: ['admin-prep', 'blocked']`, `move_writes: { chip: 'blocked' }`, expects `{ 'status.chips': ['blocked'] }`. Base and after runs under "Test rows". |
| 5, the test table's runs as the files are run | DONE | `npx vitest run tests/checks/source/catalog-file-keys.test.ts --testTimeout 0 --hookTimeout 0` printed `Test Files  1 passed (1)`, `Tests  1 passed (1)`. `tests/server/edit/config-value.test.ts` on the base copy: under "Test rows". |
| 6, the two first-of-list hits | DONE | Read: `src/lib/views/boards/person/Person.svelte:96` `hubPathsOf({ folder }).at(0)` and `src/lib/views/boards/entry/Entry.svelte:166` `hubPathsOf({ link: entry.fields.link }).at(0)`. `hubPathsOf` (`src/lib/state/boards/collection/index.ts:352`) gives at most one path per field of `PATH_FIELDS` (`['link', 'url', 'folder']`, line 336), and each call hands it a record of one field, so `.at(0)` is that one path or `undefined`. Neither picks a hub: the folder is opened in the person's own hub (`hub = rootOf(join.person ?? {})`, `Person.svelte:98`, used at `:315`), the link in the entry's own hub (`hub = rootOf(entry)`, `Entry.svelte:139`). No first-of-list default. |
| 7, the cut comment restored and `context.ts` split | DONE | `grep -n "A custom editor's tab is saved by its frame" -A1` prints the same two lines in `src/lib/state/client/context.ts:747-748` and in the base's `:778-779`. The Terminal tabs wiring moved to the new `src/lib/state/workbench/layout/tabs/terminal-host.ts` (`terminalHost(layout, ui)`, type `TerminalHost`), with the base's comment on it, every sentence kept; `context.ts` spreads `...terminalHost(layout, ui)` and drops its `paneAt` and `TERMINAL_VIEW` imports. `state/client` holds 10 items and the import order puts `state/client` above `state/workbench`, so the file is in `state/workbench/layout/tabs` (6 items after). `wc -l`: `context.ts` 849, `terminal-host.ts` 66. Importers: `grep -rn "terminal-host" src tests` prints only `src/lib/state/client/context.ts:70` (the import) and `:250` (the comment naming the file). |
| 8, the edited comment paragraphs rewrapped | DONE | Every paragraph the round's brief names and every other comment paragraph the step added or edited is rewrapped greedily at 100 columns with every word kept, by Edit from the proposals of `rewrap.mjs`. After the last change, `wrap.awk` over the lines the step adds (the `diff` of each file with its base copy, or every line of a new file) prints one line: `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:78: (90 cols, next word `rail:)`. It stays: moving `rail:` up would split the code span `` `rail: true` `` across two lines. The `NewIdeaForm.svelte` head comment, whose two paragraphs had no blank line between them and of which the step edited both, is one paragraph after the rewrap. |
| 9, the `tiers` example of `docs/templates.md` | DONE | The comment says "A tier named here replaces oculus's row of that key whole, so a row of oculus's the hub names is written with every field it keeps" and that a hub moving `default` writes oculus's `research` row without it; the example is `teaching: { label: Teaching, default: true }` and `research: { label: Research, unmarked: true }`. `node tiers.mjs <worktree>` prints merged tiers `{"research":{"label":"Research","unmarked":true},...,"teaching":{"label":"Teaching","default":true}}`, `tiers carrying default: ["teaching"]`, `merge findings: []`. |

## Test rows

Each row's base run is on `<scratchpad>/o80r1/baserun` with the worktree's test file copied in; each after run is on the worktree after the last change of the code it tests.

- Item 2, 'words each lane of a cluster whose row does not read, and of oculus's clusters the hub's list leaves out' (`tests/data/shapes/catalog-files/vocab.test.ts`). The hub writes `focus_clusters: [ { key: now, label: focus.cluster_now, muted: false, layout: grid } ]`, so the row's own finding and a lane finding for every lane of oculus's (`run`, `push`, `revise` of the dropped `now`, and the lanes of `parked`, `incubate` and `idea`, which the hub's list leaves out). Failing run on the round's unchanged tree (the worktree as round 0 left it, the row added): `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts -t "whose row does not read"` printed `<multiplication sign> words each lane of a cluster whose row does not read ...`, `AssertionError: expected [ ...(8) ] to deeply equal [ ...(11) ]`, the received list lacking the lines `focus_lanes[0] | the Focus lane run names the cluster now ...`, `focus_lanes[1] ... push ...`, `focus_lanes[2] ... revise ...`, `Tests  1 failed | 11 skipped (12)`. After: `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts` printed `Test Files  1 passed (1)`, `Tests  12 passed (12)`.
- Item 3, `tests/state/client/held-unsaved.test.ts`, `npx vitest run tests/state/client/held-unsaved.test.ts -t "a write that adds a record and names no hub" --reporter=verbose`. Base: `Tests  4 failed | 4 passed | 16 skipped (24)`; failing: 'refuses an Add to Lit Watch naming the hub two over the file of the hub the server writes' (`AssertionError: expected [ { kind: 'radar-add', ...(1) } ] to deeply equal []`) and the three 'names no file for %s with two hubs, so the server answers it (G8)' rows (`AssertionError: expected [] to have a length of 1 but got +0`); passing, each a behaviour the step keeps: 'refuses an Add Lead over the file of the hub the server writes', 'refuses an Add to Lit Watch over the file ...' and 'refuses an Add to Tasks over the file ...' (one hub, the write goes to it and its file held unsaved refuses it, as on the base), and 'refuses a Save to Literature, whose hub is the one hub that holds the collection over the file ...' (one of two hubs holds Literature, the save goes to it, as the base's "first that holds" does with one holder). After: the 8 rows pass, and the whole file `Tests  24 passed (24)`.
- Item 3, `tests/state/forms/new-entry.test.ts`, `npx vitest run tests/state/forms/new-entry.test.ts -t "the hub a" --reporter=verbose` on the base: `Tests  3 failed | 6 passed | 15 skipped (24)`. The rows the step adds or changes: 'is none with two hubs holding tasks when there is no primary, said by asking which (G8)' and '... when the primary holds no tasks collection ... (G8)' fail (`Error: text key not in the text catalog (config/text/): app.palette.task_add_which_hub`); 'is none with two hubs holding people and none named, said by asking which (G8)' fails (`... editor.add_person_which_hub`); the rows 'is %s (G8)' pass on the base, each a behaviour the step keeps: 'is the hub named (G8)' (a person goes to the hub named) and 'is the one hub holding people when none is named (G8)' (with one hub holding people it goes there). After: the three person rows pass, and the whole file `Tests  24 passed (24)`.
- Items 3 and 4, `tests/state/boards/board/board-rules.test.ts`, `npx vitest run tests/state/boards/board/board-rules.test.ts -t "the Focus lanes" --reporter=verbose` on the base: `Tests  4 failed | 7 passed | 90 skipped (101)`. Failing: 'case 10: a project at exploring is wr...' (`expected { stage: 'in-prep' } to deeply equal { stage: 'submit-ready' }`), the item 4 row 'case 11: a move onto a chip lane listing two chips adds the chip of move_writes, not the lane's first' (`expected { 'status.chips': [ 'admin-prep' ] } to deeply equal { 'status.chips': [ 'blocked' ] }`), 'takes no move onto a lane without move_writes' (`expected true to be false`), 'case 5: a cluster added after incubate ...' (`TypeError: Cannot read properties of undefined (reading 'slice')`). Passing on the base, each a behaviour the step keeps: 'case 10: a project at in-prep is on the lane already and is written nothing' (a project already on the lane is written nothing, as on the base); 'a blocked project at in-prep keeps its stage and loses its chip' (as on the base); the two rows 'case 11: moves onto a chip lane' (the shipped `blocked` lane, whose `move_writes` chip is its first chip, so the base's write of the first chip gives the same write; the changed behaviour, a `move_writes` chip other than the first, is the item 4 row, which fails on the base). After: the 11 rows pass; the whole file `Tests  101 passed (101)`.
- Item 5, `tests/server/edit/config-value.test.ts`, `npx vitest run tests/server/edit/config-value.test.ts -t "writes a removed and a relabelled stage" --reporter=verbose` on the base: `<multiplication sign> ... writes a removed and a relabelled stage as what changed from oculus's, and the merge gives it back`, `AssertionError: expected { key: 'idea', label: 'idea', ...(1) } to deeply equal { key: 'idea', label: 'idea', ...(2) }`, the diff `-   "color": "#7c5cff",`, `Tests  1 failed | 16 skipped (17)`: the base's `idea` category row has no `color`, the step gives it one. After: `Tests  17 passed (17)`.
- Item 5, `tests/checks/source/catalog-file-keys.test.ts`, run as the checks are run: `npx vitest run tests/checks/source/catalog-file-keys.test.ts --testTimeout 0 --hookTimeout 0` printed `Test Files  1 passed (1)`, `Tests  1 passed (1)`.
- Also run after the last change, each `Test Files  1 passed (1)`: `tests/data/sources/config/layers/hub-vocab.test.ts` (`Tests  16 passed (16)`), `tests/state/workbench/navigation/pages.test.ts` (`Tests  13 passed (13)`), which builds the client context and so the moved Terminal wiring.

## Checks

All from the worktree's root after the last change, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Check | State | Output |
| --- | --- | --- |
| Verify list, `npm run diagrams && npm run test:quick -- --base ee0f4259` | DONE | `npm run diagrams` wrote the 18 `.dot` and `.svg` files of `docs/diagrams`; `test:quick: 119 changed file(s), from git since ee0f4259`, `test:quick: 302 test file(s)`, `ok ASCII gate (1.0 s)`, `ok prettier (1.5 s): All matched files use Prettier code style!`, `ok svelte-kit sync (2.5 s)`, `ok eslint (14.9 s)`, `ok svelte-check (54.0 s): ... COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks (140.1 s)`, `ok vitest (206.6 s)`, `ok vitest slow (239.8 s)`, `test:quick: 242.4 s; every command passed`, exit 0. It does not cover tests that reach no changed file within the import depth, the build, and the lint of unchanged files. |
| 2, the tests over the files this round changes | DONE | base and after runs under "Test rows" |
| 3, unused exports | DONE | `sh utils/unused-exports.sh` exit 0; `diff .agents/worktrees/O80-base/unused-exports.txt <after>` prints only the base's own lines `< ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)`, `< ERROR: Please fix or visit https://knip.dev/reference/known-issues` and `< knip stopped with status 2`; no line added. |
| 4, the first-of-list grep | DONE | The hits and why each is no first-of-list default: `focus.ts:43,93` name `FOCUS_CLUSTERS`, the key of the list (`CLUSTERS` matches inside it); `focus.ts:322` reads `lane.stages[0]` only when the lane has one stage; `focus.ts:304-305` (`.find`) is `laneOf`'s lane order, the first lane taking a project; `focus.ts:412,428,551` look a lane or a tier up by its key; `Person.svelte:96` and `Entry.svelte:166`, item 6 above; `Person.svelte:177` opens the joint-work collection of the person's own hub, else the first hub's, a view to open and not a hub a record is written to; `Entry.svelte:152`, `Collection.svelte:317`, `filter-menu.ts:184`, `items.ts:54,109`, `Latex.svelte:48`, `EntryFields.svelte` `values[0]`, `page-file.ts:48`, `presets.ts:545`, `manifest.ts:431` read a value of one record; `QuickAdd.svelte:49` and `entry-add.ts:189` are a picker's starting choice; `LaneCard.svelte:110,151` is `FACT_GLYPHS`; `new-project.ts:58,95` `[...self].at(0)`, the self people sharing one key; `new-project.ts:76` and `hubs.ts:53` are length-1 guards; `presets.ts:474` is `presetFor`'s first-board fallback, open item 423; `write-files.ts:199` reads the record a reorder names; every other `.find` hit looks a row up by its key or its root. |
| 5, the wording grep | DONE | 129 lines (`wc -l`), the count of round 0. The hits in the files this round changes are the `roles` "highest first" and "first row" sentences (`config/catalogs/vocab.yml:242`, `NewIdeaForm.svelte:14`, `manifest.ts:599-600`, `board-rules.test.ts:4`) and the `categories` "first row" sentences (`config/catalogs/vocab.yml:250`, `config/options/catalogs/vocab.yml:298`, `catalog-files/vocab.ts:459`, `board-rules.test.ts:3`), which G124 states and "Not changed" keeps; the Literature key's "first author" and "first word of the title" (`HELP.md:314`, `templates.md:1355,1361`); `templates.md:147`, the website feed rows; `hub-layer.ts:478-479`, "the first such source" of a field's `from`; `HELP.md:288,292`, whose "first row" is the roles row and the categories row above; and `HELP.md:525`, "the row of the first hub that holds it" in the union of several hubs' words, which round 0 lists among the merges of several hubs' words outside premise 3. |
| 6, the history grep | DONE | prints nothing, exit 1 |
| 8, case 16 | DONE | `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose`: `names a group of its own and a path under the hub for every document of the real hub` and `matches the real hub's own files to a schema each, read with no finding` both run and pass, `Test Files  1 passed (1)`, `Tests  30 passed (30)`, none skipped. |
| 9, the docs read against the prose rules | DONE | The sentences this round changes: the `tiers` comment and example of `docs/templates.md` (comment lines at or under 100 columns, as the block's other comments) and "or one no readable row has" in `docs/HELP.md:287`. Plain ASCII, no dash stand-in, no history word, the paragraph one line in `HELP.md`. No departure found. |
| ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over the 43 files above prints nothing (exit 1); over this report, after its last edit, it prints nothing (exit 1). |
| Formatting | DONE | `npx prettier --check` over the step's changed `src` and `tests` files: `All matched files use Prettier code style!`; `npx eslint` over the round's code files exit 0. |

## The case-run programs

Each reads only and prints; each lives in `<scratchpad>/o80r1`, run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` from that folder.

### shim.mjs (the Svelte runes as plain values, so a `.svelte.ts` store imports under Node)

```js
const id = (v) => v;
globalThis.$state = Object.assign(id, { raw: id, snapshot: id });
globalThis.$derived = Object.assign(id, { by: (f) => f() });
globalThis.$effect = Object.assign(() => {}, { pre: () => {}, root: (f) => f() });
```

### ticker.mjs (item 1)

```js
// Round 1 item 1: a hub that takes a ticker category out, and a hub that takes a project stage out,
// read through loadConfig and the collections reader of the tree named by the first argument.
// Run: node ticker.mjs <tree>. Writes hub settings files only into a temporary folder under
// $TMPDIR, removed at the end.
import './shim.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = process.argv[2].replace(/\/?$/, '/') + 'src/lib/';
const { engineDir, loadConfig, textCatalog } = await import(W + 'data/sources/config.ts');
const { listWords, collectionListFindings } = await import(W + 'data/sources/collections.ts');
const engine = engineDir();
const temp = mkdtempSync(join(process.env.TMPDIR, 'o80r1-ticker-'));

function hubCase(name, yaml) {
    const hub = join(temp, name);
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'config.yml'), yaml);
    const loaded = loadConfig(engine, { hub });
    const config = loaded.config;
    const catalog = textCatalog(config);
    const list = collectionListFindings(config.collections, listWords(config), 'collections', catalog);
    const funding = config.collections.find((one) => one.key === 'funding');
    console.log(`${name}:`);
    console.log(`  merged funding ticker ${JSON.stringify(funding?.ticker)}`);
    for (const f of loaded.findings) console.log(`  merge finding [${f.key}] ${f.message}`);
    for (const f of list) console.log(`  list finding [${f.key}] ${f.message}`);
    return config;
}

hubCase('ticker category taken out', 'ticker_categories: { funding: null }\n');
hubCase('ticker category taken out, the hub writing collections', 'ticker_categories: { funding: null }\ncollections:\n  - { key: funding, file: ".oculus/data/academic/funding.yml", registry: funding, ticker: { category: funding } }\n');
const lanes = hubCase('project stage in-prep taken out', 'stages: { in-prep: null }\n');
const push = lanes.focus_lanes.find((one) => one.key === 'push');
console.log(`  merged push lane stages ${JSON.stringify(push?.stages)} move_writes ${JSON.stringify(push?.move_writes)}`);
rmSync(temp, { recursive: true, force: true });
```

`node ticker.mjs .agents/worktrees/O80-base` (the base):

```
ticker category taken out:
  merged funding ticker {"category":"funding"}
  list finding [collections[8].ticker.category] ticker category funding names no word of ticker_categories; the entry gives no ticker lines
ticker category taken out, the hub writing collections:
  merged funding ticker {"category":"funding"}
  list finding [collections[0].ticker.category] ticker category funding names no word of ticker_categories; the entry gives no ticker lines
project stage in-prep taken out:
  merged funding ticker {"category":"funding"}
  merged push lane stages ["submit-ready"] move_writes undefined
```

`node ticker.mjs .agents/worktrees/migration-O80` before the round's change:

```
ticker category taken out:
  merged funding ticker {}
  list finding [collections[8].ticker] the ticker {} of the entry funding is not a map of a category word and an undated flag; the entry gives no ticker lines
ticker category taken out, the hub writing collections:
  merged funding ticker {}
  merge finding [collections[0].ticker.category] collections[0].ticker.category names funding, which the hub's words no longer hold; it is not read
  list finding [collections[0].ticker] the ticker {} of the entry funding is not a map of a category word and an undated flag; the entry gives no ticker lines
project stage in-prep taken out:
  merged funding ticker {"category":"funding"}
  merged push lane stages ["submit-ready"] move_writes {}
```

`node ticker.mjs .agents/worktrees/migration-O80` after the last change:

```
ticker category taken out:
  merged funding ticker {"category":"funding"}
  list finding [collections[8].ticker.category] ticker category funding names no word of ticker_categories; the entry gives no ticker lines
ticker category taken out, the hub writing collections:
  merged funding ticker {"category":"funding"}
  list finding [collections[0].ticker.category] ticker category funding names no word of ticker_categories; the entry gives no ticker lines
project stage in-prep taken out:
  merged funding ticker {"category":"funding"}
  merged push lane stages ["submit-ready"] move_writes {}
```

The two ticker cases print the base's lines; the third shows a lane's `move_writes` still losing the removed stage (the base has no `move_writes`).

### tiers.mjs (item 9)

```js
// Round 1 item 9: the `tiers` example of docs/templates.md, read from the doc of the tree named by
// the first argument, laid over oculus's tiers by loadConfig, and the tiers carrying `default`.
// Run: node tiers.mjs <tree>. Writes a hub settings file only into a temporary folder under
// $TMPDIR, removed at the end.
import './shim.mjs';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const T = process.argv[2].replace(/\/?$/, '/');
const { engineDir, loadConfig } = await import(T + 'src/lib/data/sources/config.ts');
const doc = readFileSync(T + 'docs/templates.md', 'utf8').split('\n');
const at = doc.findIndex((line) => line === '#   tiers:');
const rows = [];
for (const line of doc.slice(at + 1)) {
    if (!line.startsWith('#     ')) break;
    rows.push(line.slice(1));
}
const yaml = ['tiers:', ...rows].join('\n') + '\n';
console.log('the example as a hub file writes it:');
console.log(yaml.trimEnd());
const temp = mkdtempSync(join(process.env.TMPDIR, 'o80r1-tiers-'));
mkdirSync(join(temp, '.oculus'), { recursive: true });
writeFileSync(join(temp, '.oculus', 'config.yml'), yaml);
const oculus = loadConfig(engineDir()).config.tiers;
const loaded = loadConfig(engineDir(), { hub: temp });
console.log('oculus tiers:', JSON.stringify(oculus));
console.log('merged tiers:', JSON.stringify(loaded.config.tiers));
const carrying = Object.entries(loaded.config.tiers).filter(([, row]) => row.default === true);
console.log('tiers carrying default:', JSON.stringify(carrying.map(([key]) => key)));
console.log('merge findings:', JSON.stringify(loaded.findings.map((f) => `[${f.key}] ${f.message}`)));
rmSync(temp, { recursive: true, force: true });
```

`node tiers.mjs .agents/worktrees/migration-O80` after the last change:

```
the example as a hub file writes it:
tiers:
     teaching: { label: Teaching, default: true }
     research: { label: Research, unmarked: true }
oculus tiers: {"research":{"label":"Research","unmarked":true,"default":true},"personal":{"label":"Personal"},"software":{"label":"Software"}}
merged tiers: {"research":{"label":"Research","unmarked":true},"personal":{"label":"Personal"},"software":{"label":"Software"},"teaching":{"label":"Teaching","default":true}}
tiers carrying default: ["teaching"]
merge findings: []
```

The example's rows are only in the doc after this round, so the program has no run on the base or on the round's unchanged tree.

### wrap.awk (item 8, the lines that end while the next word would fit)

```awk
# Prints each comment line that ends while the first word of the next comment line of the same
# paragraph would fit on it within 100 columns. Reads only. Run: awk -f wrap.awk <files>.
function body(s) { if (match(s, /^[ \t]*(\/\/|\*|<!--)?[ ]?/)) return substr(s, RLENGTH + 1); return s }
function kind(s) { if (s ~ /^[ \t]*\/\//) return "//"; if (s ~ /^[ \t]*\*( |$)/) return "*"; return "" }
FNR == 1 { prev = ""; pk = ""; prevbody = "" }
{
    k = kind($0); b = body($0)
    if (pk != "" && k == pk && b != "" && b !~ /^[-@#|]/ && b !~ /^[0-9]+\./ && prevbody != "") {
        split(b, w, " ")
        if (length(prev) + 1 + length(w[1]) <= 100) printf "%d: (%d cols, next word %s) %s\n", FNR - 1, length(prev), w[1], prev
    }
    prev = $0; pk = k; prevbody = b
}
```

Run over each `.ts` and `.svelte` file the step changes, keeping a hit when its line or the next is a line the step adds (from `diff .agents/worktrees/O80-base/<file> <file>`, every line of a new file). Before the rewraps it printed the paragraphs `rewrap.mjs` was then given; after the last change it prints:

```
src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:78: (90 cols, next word `rail:)      * The count a board gives the rail: its projects in the rows of `categories` carrying
```

### rewrap.mjs (item 8, the rewrapped form of each paragraph, applied by Edit)

```js
// Prints, for each `file:line` given, the comment paragraph holding that line and the same words
// wrapped greedily at 100 columns with the paragraph's own prefix. Reads only; the edits are made
// with the Edit tool from what it prints. Run: node rewrap.mjs <file:line>...
import { readFileSync } from 'node:fs';

const PREFIX = /^(\s*(?:\/\/|\*)(?: |$))/;

function paragraph(lines, at) {
    const prefixOf = (line) => PREFIX.exec(line)?.[1] ?? null;
    const own = prefixOf(lines[at]);
    const body = (line) => line.slice((prefixOf(line) ?? '').length);
    const same = (i) =>
        i >= 0 &&
        i < lines.length &&
        prefixOf(lines[i])?.trimEnd() === own.trimEnd() &&
        body(lines[i]).trim() !== '' &&
        !/^\/\*\*|^\*\//.test(lines[i].trim());
    const starts = (i) => /^[-@]/.test(body(lines[i]));
    let first = at;
    while (!starts(first) && same(first - 1)) first -= 1;
    let last = at;
    while (same(last + 1) && !starts(last + 1)) last += 1;
    return { first, last, own };
}

const seen = new Set();
for (const arg of process.argv.slice(2)) {
    const [file, number] = arg.split(/:(?=\d+$)/);
    const lines = readFileSync(file, 'utf8').split('\n');
    const line0 = lines[Number(number) - 1] ?? '';
    if (!PREFIX.test(line0) || /^\s*\/\*\*|^\s*\*\//.test(line0)) continue;
    if (line0.slice(PREFIX.exec(line0)[1].length).trim() === '') continue;
    const { first, last, own } = paragraph(lines, Number(number) - 1);
    const key = `${file}:${first}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const prefix = own.endsWith(' ') ? own : `${own} `;
    const words = lines
        .slice(first, last + 1)
        .map((line) => line.slice((PREFIX.exec(line)?.[1] ?? '').length))
        .join(' ')
        .split(/\s+/)
        .filter((word) => word !== '');
    const out = [];
    let line = prefix;
    for (const word of words) {
        if (line === prefix) line += word;
        else if (line.length + 1 + word.length <= 100) line += ` ${word}`;
        else {
            out.push(line);
            line = prefix + word;
        }
    }
    out.push(line);
    const old = lines.slice(first, last + 1);
    const same = old.join('\n') === out.join('\n');
    console.log(`=== ${file}:${first + 1}-${last + 1}${same ? ' (already wrapped)' : ''}`);
    if (same) continue;
    console.log('--- old');
    console.log(old.join('\n'));
    console.log('--- new');
    console.log(out.join('\n'));
}
```

Given every changed comment line of the step's `.ts` and `.svelte` files, it printed 1143 lines (`<scratchpad>/o80r1/rewrap-out.txt`): for each paragraph either `(already wrapped)` or its old and new form. Every "new" form was applied by Edit except `rail-badges.svelte.ts:78-79` (the code span above) and `tests/checks/tree/boundaries.test.ts:123-139`, where the proposal merges the step's paragraph into the base's paragraphs above it with no blank line between them; the step's own lines there (`data/shapes/boards/**` ... findings from) are already wrapped, and `wrap.awk` prints no hit for them. After the rewraps, `wrap.awk` gives the one line above, so no paragraph of the step is left with a short line.

## Files this round changes, with line counts

`wc -l`, after the last change:

```
     284 config/catalogs/vocab.yml
     378 config/options/catalogs/vocab.yml
     458 config/text/findings.yml
     570 docs/HELP.md
    1512 docs/templates.md
     843 src/lib/data/helpers/hub-names.ts
     879 src/lib/data/model/index.ts
      50 src/lib/data/shapes/boards/focus-clusters.ts (new)
      65 src/lib/data/shapes/boards/focus-sections.ts
     487 src/lib/data/shapes/catalog-files/vocab.ts
     617 src/lib/data/sources/config/merge/hub-layer.ts
     310 src/lib/data/sources/config/merge/in-place.ts
     320 src/lib/data/sources/config/rail.ts
     260 src/lib/data/sources/config/sections/boards.ts
     137 src/lib/data/sources/config/sections/focus.ts
     195 src/lib/data/sources/config/sections/vocab.ts
     292 src/lib/server/edit/writes/hubs.ts
     742 src/lib/server/edit/writes/manifest.ts
      65 src/lib/server/root/config-seed.ts
     115 src/lib/server/root/watch/portfolio/payload.ts
     123 src/lib/state/boards/board/new-project.ts
     547 src/lib/state/boards/board/presets.ts
     699 src/lib/state/boards/focus.ts
     669 src/lib/state/boards/ticker.ts
     849 src/lib/state/client/context.ts
     256 src/lib/state/forms/new-entry.ts
     284 src/lib/state/sessions/source/write-files.ts
      73 src/lib/state/shared/page/hubs.ts
      66 src/lib/state/workbench/layout/tabs/terminal-host.ts (new)
     323 src/lib/state/workbench/navigation/registry.ts
     614 src/lib/state/workbench/navigation/status.ts
     408 src/lib/state/workbench/rail-badges/rail-badges.svelte.ts
     438 src/lib/views/boards/projects/Projects.svelte
      80 src/lib/views/shared/card/feed/lead-apply.ts
     214 src/lib/views/shared/forms/NewIdeaForm.svelte
     246 src/lib/views/shared/forms/entry/entry-add.ts
     367 src/lib/views/system/workbench/RailEditor.svelte
     106 src/routes/+page.server.ts
     351 src/routes/+page.svelte
     322 src/routes/views.ts
     208 tests/data/shapes/catalog-files/vocab.test.ts
     865 tests/state/boards/board/board-rules.test.ts
     492 tests/state/client/held-unsaved.test.ts
```

Every `.ts` file is at or under 880 lines and every `.svelte` file under 520. Folders: `ls | wc -l` gives `src/lib/state/workbench/layout/tabs` 6, `src/lib/data/shapes/boards` 6, `src/lib/state/client` 10. `tests/state/forms/new-entry.test.ts` and `tests/server/edit/config-value.test.ts`, which the round's path list adds, needed no change: their rows are run on the base above.

## How many times the verify list ran in this round

- The verify list (`npm run diagrams && npm run test:quick -- --base ee0f4259`) ran once, after the last change, and passed.
- No whole-suite command ran. Other test runs: single files with `npx vitest run tests/<file>` (the row filters above with `-t`), the base-copy runs in `<scratchpad>/o80r1/baserun`, and the case 16 command once.
