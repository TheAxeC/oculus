# Library audit, auditor C: views/academic, boards, feeds, personal, structure, system

Nothing in my part was left unaudited. Every file is in the coverage table at the end. I edited no file, ran no git command and installed nothing. `npm pack reveal.js@6.0.2` was unpacked in the session scratchpad only, so its `config.d.ts` could be read.

## Enumeration

Command, from `tools/oculus`:
`find src/lib/views/academic src/lib/views/boards src/lib/views/feeds src/lib/views/personal src/lib/views/structure src/lib/views/system -type f | sort`
Result: **95 files, 16,479 lines** (`xargs wc -l`).

**X3b.** I read `boards/deposit/Deposit.svelte` (480 lines in X3b, 497 on main) and `system/status/Status.svelte` from the X3b worktree. The only X3b change to either file is that Deposit swaps `ui/controls/Confirm.svelte` for `views/shared/AskConfirm.svelte` and Status changes one import path. Neither change touches a library capability.

**Unresolved: which files X3b adds.** Running the same `find` on the X3b worktree lists four files main lacks (`feeds/inbox/Accounts.svelte`, `feeds/inbox/Head.svelte`, `personal/calendar/Accounts.svelte`, `personal/calendar/Head.svelte`) and lacks main's five `personal/account-setup/*` files. `tools/oculus/.scratch/migration/agents/briefs/X3b.md` names none of those paths, and all four files carry the worktree's checkout timestamp (Sep 25 22:29:42). That suggests the worktree is cut from an older main, so they would be files main has since removed rather than files X3b adds. I could not confirm this without git, which the brief forbids. I did not audit them as X3b files, and the orchestrator should check it with git.

Installed versions (read from `node_modules/*/package.json`): svelte 5.57.0, @sveltejs/kit 2.70.3, marked 18.0.12, katex 0.18.7, dompurify 3.4.15, highlight.js 11.12.0, @xterm/xterm 6.0.0, yaml 2.9.0, typescript 6.0.3.

"Last release" below is the date of the current version in `npm view <pkg> time`.

---

## 1. Force layout, pan, zoom and node drag (Map)

**What oculus has**
- `structure/map/Graph.svelte` (536 lines, 110 of them style). A hand-drawn SVG with:
  - node drag that reheats the simulation;
  - background pan, wheel zoom around the pointer, and double-click to reset;
  - link mode: drag from one project to another to toggle `related:`, drawn as a rubber band with a target ring;
  - arrow markers for one-way and mutual edges;
  - focusable nodes (`tabindex`, Enter or Space opens), a label under the pointer or keyboard drawn on top, and label-overlap hiding.
- `structure/map/labels.ts` (71): the overlap rule over measured `getBBox` sizes.
- The simulation itself is in `state/boards/structure/graph.ts` (786 lines, outside my part), at lines 407 to 720:
  - `seededRandom`, `placeInit` (hubs on a ring);
  - `physics()`: one O(n^2) tick of repulsion, collision, link springs, centring, damping and bounds;
  - `crossings`, `score`, `settle`;
  - `bestLayout` (best of N seeded starts) and `optimize` (random parameter search). The chosen parameters are saved per pane.
- `tests/state/boards/structure/graph.test.ts` refers to these functions 16 times (`rg -c`).

**Candidates**
- **d3-force** 3.0.0. ISC, d3 organisation (mbostock), last release 2021-06-05, no peer dependencies.
  - Covers: the tick (`forceManyBody`, `forceLink`, `forceCollide`, `forceCenter`, alpha cooling). It is Barnes-Hut rather than O(n^2), and its random source can be seeded, so layouts stay deterministic (from the d3-force documentation I know; not re-read this run).
  - Does not cover: the seeded best-of-N search, the crossing and overlap score, the parameter search, the ring start, label overlap, rendering or interaction.
  - Removes an estimated 80 to 100 lines (`physics()` and the tick loops in `settle` and `Graph.svelte`'s `step`). Everything else stays.
  - Pure data with no DOM, so it fits the state layer and the layer rules. Theming is untouched.
  - Cost: `Physics` would map onto d3's parameters, so every pane's saved `tuned` layout is invalidated and the tests are rewritten.
- **d3-zoom** 3.0.0. ISC, d3, last release 2021-06-10. Replaces the wheel, pan and reset code (about 40 lines, estimate). It drives the DOM through d3-selection, so it would compete with Svelte for the `<g transform>`, and saves little.
- **cytoscape** 3.34.3. MIT, cytoscape org, last release 2026-09-07. Draws on canvas, so nodes are not focusable: the keyboard path to a node would be lost, which is a feature cut. Colours would have to be re-read from the tokens on every theme change. Link mode would need a plugin. **Rejected.**
- **sigma** 3.0.3 with **graphology** 0.26.0. MIT, last releases 2026-04-30 and 2025-01-26. WebGL, with the same accessibility and theming loss as cytoscape. **Rejected.**
- **@xyflow/svelte** 1.7.0. MIT, xyflow, last release 2026-09-24, peer `svelte ^5.25.0` (matches).
  - DOM nodes, built-in pan, zoom and drag, a connect gesture, and `--xy-*` CSS variables.
  - Has no force layout, so d3-force would still be needed.
  - Its connect gesture uses handles, which differs from oculus's link mode.
  - Might replace about 150 to 200 lines of interaction (estimate) but brings a node-editor model.
- **force-graph** 1.51.4. MIT, vasturiano, last release 2026-04-16. Canvas. **Rejected**, same reasons as cytoscape.

**Options**
- **Keep:** no new dependency and no churn. The O(n^2) tick stays, which is fine at the hub's node count (not measured).
- **d3-force for the tick only:** removes about 90 lines of physics that the tests currently prove by hand, and keeps every feature. Costs a dependency (stable, unchanged since 2021) and invalidates saved layouts once.
- **xyflow plus d3-force:** the largest removal, but the node-editor behaviour moves away from what the Map does now.

**Recommendation: d3-force for `physics()` and the tick loops, and keep everything else.** It is the only candidate that removes code without cutting a feature or breaking tokens and keyboard access. Keep the seeded search and the scoring, which no library does.

## 2. Drag and drop: moving cards between lanes and reordering lists

**What oculus has.** Three separate native HTML5 drag-and-drop implementations, with no touch support, no drop indicator and no auto-scroll:
- `boards/focus/lanes/Lanes.svelte` (389, 99 style): `started`, `ended`, `draggedOver`, `dropped`, about 40 lines. The `movable()` rule refuses the Ideas lane per project. A drop writes `focus:`.
- `lanes/LaneCard.svelte` (205): passes `draggable` and the events through.
- `boards/collection/Collection.svelte` (395) with `EntryCard.svelte` (498): a grip arms `draggable`, a drop onto a card moves the entry to that card's place in file order, and the keyboard path is `cardMoveRequested`. About 45 lines together.
- `academic/slides/Slides.svelte` (324): the same grip-arms-draggable pattern again (about 25 lines), plus up and down buttons.

The Collection and Slides copies of the grip pattern duplicate each other.

**Candidates**
- **svelte-dnd-action** 0.9.79. MIT, isaacHagoel, last release 2026-08-21, peer `svelte >=3.23.0 || ^5.0.0-next.0` (matches).
  - Covers: moving between zones, reordering, touch, keyboard drag, ARIA alerts (`setAriaStrings`, so the words can come from the catalog), `dragHandleZone` and `dragHandle` for the grip, and `dropFromOthersDisabled`.
  - It works by mutating a local `items` array on `consider` and `finalize`, so each list needs a local `$state` copy of the snapshot rows plus a write on finalize.
  - The per-item Ideas rule is not a per-zone flag, so it needs glue.
  - The README examples use Svelte 4 syntax (`on:consider`); Svelte 5 use is **not checked**.
  - Removes about 110 lines and adds about 50 of glue (estimates).
- **@atlaskit/pragmatic-drag-and-drop** 4.0.0. Apache-2.0, Atlassian, last release 2026-09-24. Dependencies: `raf-schd`, `@babel/runtime`, `bind-event-listener`. No framework.
  - Built on native drag and drop. Its `canDrop` per drop target matches `movable()` directly.
  - Optional packages add closest-edge drop indicators and auto-scroll.
  - Wired from `$effect` or attachments. Removes little code, since it wraps the same events, but adds indicators and auto-scroll.
- **@dnd-kit/svelte** 0.5.0. MIT, clauderic, last release 2026-06-11, peer `svelte ^5.29.0` (matches). Version 0.x, so the API is young.
- **sortablejs** 1.15.7. MIT, last release 2026-02-11. Moves DOM nodes itself, which fights Svelte's keyed each blocks.
- **@thisux/sveltednd** 0.8.0. MIT, a single maintainer, last release 2026-09-01, peer `svelte ^5.0.0`. Small.

**Options**
- **Keep:** about 110 lines, already native. The duplicated grip pattern stays, and so do the missing touch support and drop indicator.
- **svelte-dnd-action:** the most features for the least code once the glue is written. It needs local copies of the list state, which cuts against "the view holds no copy, a push redraws it".
- **pragmatic-drag-and-drop:** keeps the snapshot-driven model and `movable()` maps one to one, but the line count barely changes.

**Recommendation: keep the hand-built drag and drop, and fold the two grip-arms-draggable copies (EntryCard and Slides) into one shared partial under `views/shared/`.** The candidates either force a local list copy (svelte-dnd-action) or remove almost nothing (pragmatic). The shared-partial fold is the concrete code reduction here. If touch support or drop indicators become wanted, pragmatic-drag-and-drop is the fit.

## 3. Slide deck (Present) against deck libraries

**What oculus has**
- `academic/present/Present.svelte` (206): about 60 lines of navigation (arrows, PageUp and PageDown, Home, End, `O` for the grid, Escape), focus taken on mount unless the reader is typing elsewhere, and position held per pane instance.
- `Overview.svelte` (79): a tile grid of named slides with the project's theme colour.
- `Slide.svelte` (49): dispatch on the slide kind.
- `parts/*` and `Panel.svelte` (1,100 lines together): the slide layouts. Keys are scoped to the pane's box, not the window.

**Candidate: reveal.js** 6.0.2. MIT, hakimel, last release 2026-09-10, no peer dependencies.
- `config.d.ts` has `keyboardCondition: 'focused'` (line 296), `embedded` (392) and `overview` (311).
- Adds speaker notes, PDF export, fragments and a math plugin, which oculus does not have.
- Owns the DOM (`.reveal > .slides > section`), scales slides to a fixed size, ships its own reset and theme CSS (to be remapped to the tokens), and needs `sync()` after every snapshot push.
- Its overview shows scaled slides, not oculus's named, coloured tiles.
- Removes about 100 lines and adds about 60 of glue (estimates).

**Options:** keep, or reveal.js with `embedded` and `keyboardCondition: 'focused'`.

**Recommendation: keep.** Reveal would take DOM ownership from Svelte-rendered slides for a net saving of about 40 lines.

## 4. Math inside Markdown (Present)

**What oculus has.** `academic/present/markup.ts` (85): lifts `$$..$$`, `\[..\]`, `\(..\)` and `$..$` out, runs the rest through `ui/html.ts`'s `inlineMarkdown` or `blockMarkdown`, then puts back the KaTeX output (`trust: false`, `maxSize`, `maxExpand`). `parts/Words.svelte` (49) and `parts/Equation.svelte` (61) use it.

**Candidate: marked-katex-extension** 5.1.13. MIT, UziTech (tonybrix), last release 2026-09-16, peer `katex >=0.16 <0.19` and `marked >=4 <19` (both match).
- Its README documents only the `$` and `$$` delimiters, so `\(..\)` and `\[..\]` would be lost.
- KaTeX's output would then pass through `sanitise()` (`ui/html.ts:313` and `323`), whose profile drops `style` (`DIAGRAM_ATTR` adds `style` back only for diagrams, `ui/html.ts:128`), and that would break every KaTeX box.

**Recommendation: keep.** The extension cuts two of the four delimiters, and adopting it means allowing `style` in the Markdown sanitiser.

## 5. Calendar view against calendar components

**What oculus has.** `personal/calendar/Calendar.svelte` (126) and `Agenda.svelte` (123): a day-grouped agenda list. Each event shows its clock or the all-day word, tentative and cancelled tags, the account tag, the calendar, the place and an open-at-provider control. The grouping is `state/life/calendar.ts` (outside my part).

**Candidates**
- **@event-calendar/core** 5.15.0. MIT, vkurko, last release 2026-09-25. It depends on `svelte ^5.57.0` as a regular dependency, not a peer (matches the installed 5.57.0). It is a Svelte 5 component with snippets for event content, and its README lists `listDay`, `listWeek` and `listMonth` views, so it covers the agenda and adds month and week grids. Its own stylesheet would need mapping to the tokens, and its button and day words come from options (they can be fed from the catalog).
- **@fullcalendar/core** 7.1.0. MIT, arshaw, last release 2026-09-05, peers `temporal-polyfill` and `@full-ui/headless-calendar`.
- **@schedule-x/calendar** 4.8.0. MIT, last release 2026-09-08, peers `preact`, `@preact/signals` and `temporal-polyfill`: a second UI framework.

**Recommendation: keep.** A list of about 50 script-and-markup lines is what a calendar component would replace, while it would bring its own stylesheet and word options to remap. @event-calendar/core is the one to take if month or week grids are ever wanted.

## 6. Photo wall and lightbox (Memories)

**What oculus has.** `personal/memories/Memories.svelte` (426, 144 style): a CSS-column wall with aspect-ratio boxes from the server's sizes, lazy images with retry, and a pane-scoped overlay (Escape, backdrop press and close control, with focus returned to the tile). About 45 lines of overlay script. Upload is base64 over the write API.

**Candidates**
- **photoswipe** 5.4.4. MIT, dimsemenov, last release 2024-05-24. Uses the width and height oculus already holds. Adds zoom, pan, swipe and previous/next, with `--pswp-*` CSS variables and UI strings set through options. It opens at viewport level, where oculus's overlay is pane-scoped; placement inside a pane is **not checked**.
- **glightbox** 3.3.1. MIT, last release 2025-01-21.
- The native `<dialog>.showModal()` would give Escape and inert background for free, but it is page-level (top layer), not pane-level.

**Recommendation: keep.** The overlay is small, and every candidate moves it from the pane to the page. PhotoSwipe is the choice if zoom or previous/next is wanted.

## 7. Schema-driven manifest form (Editor)

**What oculus has.** `boards/editor/Editor.svelte` (306): one widget per field type from `config/catalogs/manifest-schema.yml` (readonly, text, textarea, lines, select, chips, tags, date, checkbox, keymap), edits held over the snapshot, and only the changed fields posted.

**Candidate: @sjsf/form** 3.8.2. MIT AND Apache-2.0, x0k, last release 2026-09-17, peers `svelte ^5.34.8`, `esm-env`, `json-schema-typed`, `@standard-schema/spec` and `json-schema-merge-allof`. It is JSON Schema driven. The manifest schema is not JSON Schema, and the widgets would have to be rewritten as an sjsf theme over `ui/forms/*` to keep the tokens.

**Recommendation: keep.** The widget dispatch is about 70 lines, and the conversion plus the theme would be larger.

## 8. Date and duration formatting

`Usage.svelte` `duration()` (8 lines), `InboxCard.svelte` `ageText()` and `hpc/Head.svelte` `late()` build durations by hand. The clock and stamp helpers are in `state/shared/words/format.ts` (123 lines, outside my part).

**Candidates**
- **date-fns** 4.4.0 (MIT, last release 2026-05-29).
- **dayjs** 1.11.23 (MIT, last release 2026-08-17).
- The built-in `Intl.DurationFormat` (`typeof` returns `function` on Node v24.21.0).

The Intl and locale formatters produce words that do not come from `config/text/` catalogs, which the spec's catalog rule (`spec.md:44`) forbids.

**Recommendation: keep.** The hand code is arithmetic, and every word already comes from the catalog.

## Findings: dependencies already present, used partly or duplicated

- **highlight.js is registered for YAML but the Config view does not use it.** `state/shared/words/languages.ts:39,64` registers YAML, and `views/sources/source/Code.svelte` highlights with it. `system/config/Config.svelte` draws each YAML file as a plain `<pre>`. The Config preview should go through the same highlighter. `views/` may not import another view, so the route is a shared partial or the state-layer function.
- **The Help view parses marked's output again with regexes.** `system/help/manual.ts` (62) re-reads the HTML that marked produced: an `<img>` regex, an attribute regex and a hand-written entity table (`ENTITIES`). marked has already parsed those images into tokens, so a `renderer.image` or `walkTokens` hook where the manual is rendered, or the browser's `DOMParser`, would replace the regex and entity code (about 30 lines, estimate). Recommendation: do it.
- **The HPC queue is a hand-built table.** `system/hpc/Jobs.svelte` (116) writes a raw `<table>` beside the `ui/display/Table.svelte` primitive, which takes a `cell` snippet as `Projects.svelte:323` uses it. This duplicates an in-tree primitive rather than a library.
- **Clipboard copy is written twice.** `personal/account-setup/CopyValue.svelte` and `system/status/Hooks.svelte` each call `navigator.clipboard.writeText` with their own guard. It is a native API, so no library is involved; it is a duplicate to share.
- **History shows YAML values as JSON.** `system/history/rows.ts` `shown()` prints list and map values with `JSON.stringify`. `yaml` (already a dependency) would show them as the file holds them. This is a presentation choice, not a defect.
- **Compacted markup.** `hpc/Capacity.svelte`, `hpc/Jobs.svelte` and `hpc/Log.svelte` pack their markup onto long lines, which breaks `spec.md:47` (one element per line). This is outside library scope, but it is a defect.
- **Not checked:** whether SLURM logs carry ANSI escapes or `\r`. `hpc/Log.svelte` prints the tail as plain text. If they do, **ansi_up** 6.0.6 (MIT, last release 2025-05-16, `use_classes` output so colours can map to tokens) or the existing @xterm/xterm would render them.

## Domain logic, no library covers it (one line each)

- Charts and meters: nothing in this part is a chart. Usage, HPC quota and walltime use the `ui/display/Meter` primitive, and `hpc/Capacity.svelte` draws a three-segment flex bar; no charting library is an option at this size.
- Search and filter: word-AND substring filters in `state/` (`inboxSearch`, `applyCollectionFilters`, `auditSearch`); the views only hand over the typed text.
- Table sorting: done in `ui/display/Table.svelte` (outside my part); the views only pass `sortable`.
- Inbox and mail: the provider snippet plus marked and DOMPurify inline Markdown (already dependencies); no mail body is rendered.
- History and audit: the change log, undo sentences, and audit sections with mute.
- Focus board, command centre, tasks, career panel and band: ticker rows and manifest writes.
- Projects, Project, Person, Collection cards, Coverage, Software, Stats and NewIdea: portfolio joins and cards.
- Feeds (Radar, Leads, LinkedIn): feed cards and status writes.
- Pillars, Domains and the Map's Controls and edge-write: registry boards and filter chips.
- Account setup: OAuth client registration steps and form.
- Deposit: mirror and git controls; the git work is server-side.
- Status, Hooks, Findings, Gallery, Settings, Appearance, RailEditor, Pages, Catalogue: workbench surfaces. Pages and Catalogue use the shell's pane-drag store (`state/workbench/drag.svelte`, outside my part).
- Help's `newest.ts`: a 28-line abort-latest helper, too small for a library.

## Coverage table (95 files)

| File (under src/lib/views/) | Capability |
|---|---|
| academic/present/markup.ts | 4 Math in Markdown |
| academic/present/Overview.svelte | 3 Slide deck |
| academic/present/Panel.svelte | 3 Slide deck (slide content, sanitised diagram) |
| academic/present/parts/Closing.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Dot.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Equation.svelte | 4 Math in Markdown |
| academic/present/parts/Framing.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Ideas.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Legend.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Project.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Summary.svelte | 3 Slide deck (uses ui Table) |
| academic/present/parts/Title.svelte | 3 Slide deck (layout, domain) |
| academic/present/parts/Words.svelte | 4 Math in Markdown |
| academic/present/Present.svelte | 3 Slide deck (navigation) |
| academic/present/Slide.svelte | 3 Slide deck |
| academic/slides/Slides.svelte | 2 Drag and drop (list reorder) |
| boards/collection/Collection.svelte | 2 Drag and drop; domain collection board |
| boards/collection/Coverage.svelte | Domain |
| boards/collection/EntryCard.svelte | 2 Drag and drop (grip); domain card |
| boards/collection/Software.svelte | Domain |
| boards/deposit/Deposit.svelte (X3b copy) | Domain (deposit controls) |
| boards/editor/Editor.svelte | 7 Schema-driven form |
| boards/focus/Band.svelte | Domain |
| boards/focus/CareerPanel.svelte | Domain |
| boards/focus/CommandCenter.svelte | Domain |
| boards/focus/CommandCenterView.svelte | Domain |
| boards/focus/Focus.svelte | Domain |
| boards/focus/lanes/LaneCard.svelte | 2 Drag and drop (lanes) |
| boards/focus/lanes/LaneHead.svelte | Domain |
| boards/focus/lanes/Lanes.svelte | 2 Drag and drop (lanes) |
| boards/focus/QuickAdd.svelte | Domain |
| boards/focus/rows.ts | Domain |
| boards/focus/Tasks.svelte | Domain |
| boards/person/Person.svelte | Domain |
| boards/project/Latex.svelte | Domain; 8 date formatting |
| boards/project/Project.svelte | Domain |
| boards/projects/NewIdea.svelte | Domain |
| boards/projects/Projects.svelte | Domain (sortable ui Table, search) |
| boards/projects/Stats.svelte | Domain |
| feeds/inbox/Inbox.svelte | Domain (inbox, search) |
| feeds/inbox/InboxCard.svelte | Domain (mail card); 8 date formatting |
| feeds/leads/LeadCard.svelte | Domain |
| feeds/leads/Leads.svelte | Domain |
| feeds/linkedin/Linkedin.svelte | Domain |
| feeds/linkedin/post-card.ts | Domain |
| feeds/linkedin/PostCard.svelte | Domain |
| feeds/radar/Bucket.svelte | Domain |
| feeds/radar/Radar.svelte | Domain |
| feeds/radar/RadarCard.svelte | Domain |
| feeds/radar/RadarIntro.svelte | Domain |
| personal/account-setup/AccountSetup.svelte | Domain |
| personal/account-setup/CopyValue.svelte | Clipboard (native; duplicate of Hooks) |
| personal/account-setup/GoogleSteps.svelte | Domain |
| personal/account-setup/HalfForm.svelte | Domain |
| personal/account-setup/MicrosoftSteps.svelte | Domain |
| personal/calendar/Agenda.svelte | 5 Calendar |
| personal/calendar/Calendar.svelte | 5 Calendar |
| personal/memories/Memories.svelte | 6 Photo wall and lightbox |
| structure/domains/DomainCard.svelte | Domain |
| structure/domains/Domains.svelte | Domain |
| structure/map/Controls.svelte | Domain (Map filters) |
| structure/map/edge-write.ts | Domain (Map write) |
| structure/map/Graph.svelte | 1 Force layout and pan/zoom |
| structure/map/labels.ts | 1 Force layout (label overlap) |
| structure/map/Map.svelte | 1 Force layout (host); domain filters |
| structure/pillars/ArchivalCard.svelte | Domain |
| structure/pillars/LineCard.svelte | Domain |
| structure/pillars/OrphansCard.svelte | Domain |
| structure/pillars/Pillars.svelte | Domain |
| system/audit/Audit.svelte | Domain (audit, search) |
| system/config/Config.svelte | Finding: YAML highlighting (highlight.js unused here) |
| system/config/files.ts | Domain |
| system/findings/Findings.svelte | Domain |
| system/gallery/Gallery.svelte | Domain (primitive gallery) |
| system/help/Diagram.svelte | Domain (sanitised SVG diagram) |
| system/help/Help.svelte | Domain (manual) |
| system/help/manual.ts | Finding: marked output parsed again by regex |
| system/help/newest.ts | Domain (abort helper) |
| system/history/History.svelte | Domain (history, search) |
| system/history/rows.ts | Domain; finding: JSON where yaml is available |
| system/hpc/Capacity.svelte | Meters (no chart library needed); compacted markup |
| system/hpc/Head.svelte | Domain; 8 date formatting |
| system/hpc/Hpc.svelte | Domain |
| system/hpc/Jobs.svelte | Finding: hand-built table beside ui Table |
| system/hpc/Log.svelte | Log display (ANSI not checked) |
| system/hpc/Quota.svelte | Meters (ui Meter) |
| system/hpc/Recent.svelte | Domain (uses ui Table) |
| system/status/Hooks.svelte | Clipboard (native; duplicate of CopyValue) |
| system/status/Status.svelte (X3b copy) | Domain |
| system/usage/Usage.svelte | Meters (ui Meter); 8 duration formatting |
| system/workbench/Appearance.svelte | Domain |
| system/workbench/Catalogue.svelte | Domain (uses the shell's drag store) |
| system/workbench/Pages.svelte | Domain (uses the shell's drag store) |
| system/workbench/RailEditor.svelte | Domain |
| system/workbench/Settings.svelte | Domain |

## Orchestrator check

- `git ls-files` over the six folders: 95 files, equal to the report.
- The four files the worktree holds and main lacks were removed from main by Q67 (`43ee0de2`), which also added `personal/account-setup/`; X3b's worktree is cut from `a8848c49`, before Q67. They are not X3b additions.
